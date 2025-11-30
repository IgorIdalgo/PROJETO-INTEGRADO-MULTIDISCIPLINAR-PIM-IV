import customtkinter as ctk
from tkinter import messagebox
import threading
import sys
import os
from datetime import datetime
import math

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# --- IMPORT DO API CLIENT ---
try:
    from desktop_interface import api_client
except ImportError:
    import api_client

from desktop_interface.ticket_detalhe import abrir_ticket_detalhe

# Configurações de Paginação
ITENS_POR_PAGINA = 5

# Mapeamento de Cores: (Cor do Fundo, Cor do Texto)
CORES_STATUS = {
    "aberto":           ("#0284C7", "#FFFFFF"), # Azul
    "em andamento":     ("#FACC15", "#1E293B"), # Amarelo
    "resolvido":        ("#16A34A", "#FFFFFF"), # Verde
    "fechado":          ("#475569", "#FFFFFF"), # Cinza
    "aguardando info":  ("#FB923C", "#1E293B"), # Laranja
    "default":          ("#94A3B8", "#FFFFFF")
}

# Mapeia ID -> Nome (Caso a API mande só o ID)
MAPA_CATEGORIAS = {
    1: "Hardware", 2: "Software", 3: "Rede", 4: "Impressora", 5: "Outros"
}

def abrir_todos_chamados(conteudo_frame, user):
    """
    Tela de Gerenciamento Global de Chamados com Paginação e Alto Contraste.
    """
    for widget in conteudo_frame.winfo_children():
        widget.destroy()

    state = {
        "dados_originais": [],
        "dados_filtrados": [],
        "pagina_atual": 1,
        "total_paginas": 1
    }

    # === HEADER ===
    header = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    header.pack(fill="x", padx=30, pady=(30, 10))

    ctk.CTkLabel(header, text="Gerenciar Chamados", font=("Helvetica", 24, "bold"), text_color="#1E293B").pack(side="left")
    lbl_contador = ctk.CTkLabel(header, text="...", font=("Helvetica", 14), text_color="#64748B")
    lbl_contador.pack(side="right", pady=5)

    # === ÁREA DE FILTROS ===
    filtros_frame = ctk.CTkFrame(conteudo_frame, fg_color="white", corner_radius=10)
    filtros_frame.pack(fill="x", padx=30, pady=(0, 20))
    
    filtros_frame.grid_columnconfigure(0, weight=2)
    filtros_frame.grid_columnconfigure((1,2,3,4), weight=1)

    busca_var = ctk.StringVar()
    entry_busca = ctk.CTkEntry(filtros_frame, placeholder_text="🔍 Buscar por ID, Título...", 
                               textvariable=busca_var, height=35, border_width=1, border_color="#CBD5E1")
    entry_busca.grid(row=0, column=0, padx=10, pady=10, sticky="ew")

    status_var = ctk.StringVar(value="Todos Status")
    cat_var = ctk.StringVar(value="Todas Categorias")
    prio_var = ctk.StringVar(value="Todas Prioridades")
    
    ctk.CTkOptionMenu(filtros_frame, variable=status_var, values=["Todos Status", "Aberto", "Em Andamento", "Resolvido", "Fechado"], 
                      height=35, fg_color="#F1F5F9", text_color="#334155", button_color="#CBD5E1", button_hover_color="#94A3B8").grid(row=0, column=1, padx=5)

    ctk.CTkOptionMenu(filtros_frame, variable=cat_var, values=["Todas Categorias", "Hardware", "Software", "Rede", "Outros"], 
                      height=35, fg_color="#F1F5F9", text_color="#334155", button_color="#CBD5E1", button_hover_color="#94A3B8").grid(row=0, column=2, padx=5)

    ctk.CTkOptionMenu(filtros_frame, variable=prio_var, values=["Todas Prioridades", "Baixa", "Média", "Alta"], 
                      height=35, fg_color="#F1F5F9", text_color="#334155", button_color="#CBD5E1", button_hover_color="#94A3B8").grid(row=0, column=3, padx=5)

    # === CONTAINER DA LISTA ===
    lista_container = ctk.CTkFrame(conteudo_frame, fg_color="transparent") 
    lista_container.pack(fill="both", expand=True, padx=20)

    # === RODAPÉ DE PAGINAÇÃO ===
    paginacao_frame = ctk.CTkFrame(conteudo_frame, fg_color="transparent", height=50)
    paginacao_frame.pack(fill="x", padx=30, pady=10, side="bottom")

    btn_anterior = ctk.CTkButton(paginacao_frame, text="< Anterior", width=100, fg_color="#334155", state="disabled", command=lambda: mudar_pagina(-1))
    btn_anterior.pack(side="left")

    lbl_paginacao = ctk.CTkLabel(paginacao_frame, text="Página 1 de 1", font=("Helvetica", 14, "bold"))
    lbl_paginacao.pack(side="left", expand=True)

    btn_proximo = ctk.CTkButton(paginacao_frame, text="Próximo >", width=100, fg_color="#334155", state="disabled", command=lambda: mudar_pagina(1))
    btn_proximo.pack(side="right")

    # ==========================================
    # LÓGICA
    # ==========================================

    def mudar_pagina(direcao):
        nova_pag = state["pagina_atual"] + direcao
        if 1 <= nova_pag <= state["total_paginas"]:
            state["pagina_atual"] = nova_pag
            renderizar_pagina()

    def carregar_dados_thread():
        if not api_client.AUTH_TOKEN: return
        sucesso, dados = api_client.listar_todos_chamados()
        if conteudo_frame.winfo_exists():
            conteudo_frame.after(0, lambda: processar_dados_iniciais(sucesso, dados))

    def processar_dados_iniciais(sucesso, dados):
        if not sucesso:
            lbl_contador.configure(text="Erro de conexão")
            return

        dados.sort(key=lambda x: int(x.get("id_chamado") or x.get("id") or 0), reverse=True)
        state["dados_originais"] = dados
        aplicar_filtro()

    def aplicar_filtro(*args):
        dados = state["dados_originais"]
        filtrados = []

        termo = busca_var.get().lower().strip()
        f_status = status_var.get().lower().replace("todos status", "")
        f_cat = cat_var.get().lower().replace("todas categorias", "")
        f_prio = prio_var.get().lower().replace("todas prioridades", "")

        for c in dados:
            c_id = str(c.get("id_chamado") or c.get("id") or "")
            c_titulo = str(c.get("titulo", "")).lower()
            c_stat = str(c.get("status", "aberto")).lower().replace("em análise", "em andamento")
            c_prio = str(c.get("prioridade", "média")).lower().replace("crítica", "alta")
            
            c_cat_id = c.get("id_categoria")
            c_cat_nome = str(c.get("categoria") or MAPA_CATEGORIAS.get(c_cat_id, "")).lower()

            match_busca = termo in c_titulo or termo in c_id
            match_status = (f_status == "") or (f_status in c_stat)
            match_prio = (f_prio == "") or (f_prio in c_prio)
            match_cat = (f_cat == "") or (f_cat in c_cat_nome)

            if match_busca and match_status and match_prio and match_cat:
                filtrados.append(c)

        state["dados_filtrados"] = filtrados
        state["pagina_atual"] = 1
        
        lbl_contador.configure(text=f"{len(filtrados)} chamados encontrados")
        renderizar_pagina()

    def renderizar_pagina():
        for w in lista_container.winfo_children(): w.destroy()

        total_itens = len(state["dados_filtrados"])
        if total_itens == 0:
            ctk.CTkLabel(lista_container, text="Nenhum registro encontrado.", text_color="gray", font=("Arial", 16)).pack(pady=40)
            lbl_paginacao.configure(text="0 de 0")
            btn_anterior.configure(state="disabled")
            btn_proximo.configure(state="disabled")
            return

        state["total_paginas"] = math.ceil(total_itens / ITENS_POR_PAGINA)
        pag_atual = state["pagina_atual"]
        
        inicio = (pag_atual - 1) * ITENS_POR_PAGINA
        fim = inicio + ITENS_POR_PAGINA
        itens_exibir = state["dados_filtrados"][inicio:fim]

        lbl_paginacao.configure(text=f"Página {pag_atual} de {state['total_paginas']}")
        btn_anterior.configure(state="normal" if pag_atual > 1 else "disabled")
        btn_proximo.configure(state="normal" if pag_atual < state["total_paginas"] else "disabled")

        for item in itens_exibir:
            criar_card_clean(lista_container, item)

    def criar_card_clean(parent, c):
        c_id = c.get("id_chamado") or c.get("id")
        titulo = c.get("titulo", "Sem Título")
        descricao = c.get("descricao", "")
        if len(descricao) > 100: descricao = descricao[:100] + "..."

        status_raw = str(c.get("status", "aberto")).lower().replace("em análise", "em andamento")
        cor_bg, cor_texto = CORES_STATUS.get(status_raw, CORES_STATUS["default"])
        
        # --- PREPARAÇÃO DOS DADOS EXTRAS ---
        # 1. Data
        data_raw = c.get("data_abertura") or c.get("dataabertura") or ""
        data_str = str(data_raw)[:10]
        try:
            data_fmt = datetime.strptime(data_str, "%Y-%m-%d").strftime("%d/%m/%Y")
        except: 
            data_fmt = data_str if data_str else "--/--/----"

        # 2. Categoria (Pega pelo ID ou Nome)
        cat_id = c.get("id_categoria")
        nome_categoria = MAPA_CATEGORIAS.get(cat_id, c.get("categoria", "Outros"))

        # 3. Prioridade
        prioridade = str(c.get("prioridade", "Média")).capitalize()
        if not prioridade: prioridade = "Média"

        # === LAYOUT DO CARD ===
        card = ctk.CTkFrame(parent, fg_color="white", corner_radius=12, border_width=1, border_color="#E2E8F0")
        card.pack(fill="x", padx=10, pady=6)

        # Coluna Principal
        main_col = ctk.CTkFrame(card, fg_color="transparent")
        main_col.pack(side="left", fill="both", expand=True, padx=15, pady=12)

        # Cabeçalho (ID + Título)
        header_card = ctk.CTkFrame(main_col, fg_color="transparent")
        header_card.pack(fill="x")
        ctk.CTkLabel(header_card, text=f"#{c_id}", font=("Helvetica", 14, "bold"), text_color="#64748B").pack(side="left")
        ctk.CTkLabel(header_card, text=titulo, font=("Helvetica", 16, "bold"), text_color="#1E293B").pack(side="left", padx=10)

        # Descrição
        if descricao:
            ctk.CTkLabel(main_col, text=descricao, font=("Helvetica", 13), text_color="#475569", anchor="w").pack(fill="x", pady=(4, 0))

        # --- LINHA DE METADADOS COMPLETA ---
        # Aqui juntamos Data | Categoria | Prioridade
        meta_txt = f"📅 {data_fmt}   •   📁 {nome_categoria}   •   ⚡ Prioridade: {prioridade}"
        ctk.CTkLabel(main_col, text=meta_txt, font=("Helvetica", 12, "bold"), text_color="#64748B", anchor="w").pack(fill="x", pady=(8, 0))

        # Coluna Lateral (Botões)
        side_col = ctk.CTkFrame(card, fg_color="transparent")
        side_col.pack(side="right", padx=15, pady=12)

        btn_status = ctk.CTkButton(side_col, text=status_raw.upper(), 
                                   fg_color=cor_bg, text_color=cor_texto,
                                   font=("Helvetica", 12, "bold"), height=28, width=120, corner_radius=14,
                                   hover=False, state="disabled") 
        btn_status.pack(pady=(0, 10))

        ctk.CTkButton(side_col, text="Detalhes", width=120, height=32, 
                      fg_color="transparent", border_width=1, border_color="#5BA39C", text_color="#5BA39C",
                      hover_color="#F0FDFA", font=("Helvetica", 13, "bold"),
                      command=lambda: abrir_ticket_detalhe(c_id, user, conteudo_frame, lambda: abrir_todos_chamados(conteudo_frame, user))
                      ).pack()

    entry_busca.bind("<KeyRelease>", lambda e: aplicar_filtro())
    status_var.trace_add("write", lambda *a: aplicar_filtro())
    cat_var.trace_add("write", lambda *a: aplicar_filtro())
    prio_var.trace_add("write", lambda *a: aplicar_filtro())

    threading.Thread(target=carregar_dados_thread, daemon=True).start()