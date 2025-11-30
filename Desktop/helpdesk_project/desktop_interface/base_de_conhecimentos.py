import customtkinter as ctk
from tkinter import messagebox
import threading
import sys
import os
import math

# --- Configuração de Path ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path: sys.path.append(parent_dir)

try:
    from desktop_interface import api_client
except ImportError:
    import api_client

from desktop_interface.exibir_artigo import exibir_artigo_func

# Configuração de Paginação (2 linhas de 3 colunas = 6 itens)
ITENS_POR_PAGINA = 6

# Mapa visual para ID da API
MAPA_CATEGORIA_FILTRO = {
    "Todos": None,
    "Hardware": 1,
    "Software": 2,
    "Rede": 3,
    "Outros": 5
}

def mostrar_base_conhecimento(conteudo_frame, user):
    # Limpa o frame atual
    for widget in conteudo_frame.winfo_children():
        widget.destroy()
    
    conteudo_frame.configure(fg_color="#F8FAFC") 

    # Variáveis de Estado
    state = {
        "artigos_originais": [], 
        "pagina_atual": 1,
        "total_paginas": 1,
        "categoria_atual": "Todos",
        "termo_busca": ""
    }

    # === Header Principal ===
    header = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    header.pack(fill="x", padx=40, pady=(30, 20)) 

    ctk.CTkLabel(
        header, text="Base de Conhecimento", font=("Helvetica", 28, "bold"), text_color="#1E293B"
    ).pack(side="left")

    lbl_contador = ctk.CTkLabel(header, text="...", font=("Helvetica", 14), text_color="#64748B")
    lbl_contador.pack(side="right", pady=5)

    # === Área de Filtros e Busca ===
    filter_frame = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    filter_frame.pack(fill="x", padx=40, pady=(0, 20)) 

    termo_busca_var = ctk.StringVar()
    search_entry = ctk.CTkEntry(
        filter_frame, placeholder_text="🔍 Pesquisar solução...",
        width=300, height=40, font=("Helvetica", 14), textvariable=termo_busca_var,
        border_color="#CBD5E1", border_width=1, corner_radius=20, fg_color="white", text_color="#333"
    )
    search_entry.pack(side="left", padx=(0, 20))

    cat_buttons_frame = ctk.CTkFrame(filter_frame, fg_color="transparent")
    cat_buttons_frame.pack(side="left", fill="x")

    categorias = ["Todos", "Hardware", "Software", "Rede", "Outros"]
    botoes_refs = {}

    # === Grade de Artigos (Fixo - Sem Scrollbar) ===
    grid_frame = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    grid_frame.pack(fill="both", expand=True, padx=30)
    
    grid_frame.grid_columnconfigure((0, 1, 2), weight=1, uniform="cols") 
    grid_frame.grid_rowconfigure((0, 1), weight=1) 

    # === Rodapé de Paginação ===
    footer_frame = ctk.CTkFrame(conteudo_frame, fg_color="transparent", height=50)
    footer_frame.pack(fill="x", padx=40, pady=20, side="bottom")

    btn_anterior = ctk.CTkButton(footer_frame, text="< Anterior", width=100, fg_color="#334155", state="disabled", 
                                 command=lambda: mudar_pagina(-1))
    btn_anterior.pack(side="left")

    lbl_paginacao = ctk.CTkLabel(footer_frame, text="Página 1 de 1", font=("Helvetica", 14, "bold"), text_color="#475569")
    lbl_paginacao.pack(side="left", expand=True)

    btn_proximo = ctk.CTkButton(footer_frame, text="Próximo >", width=100, fg_color="#334155", state="disabled", 
                                command=lambda: mudar_pagina(1))
    btn_proximo.pack(side="right")

    # --- LÓGICA DE UI (CARTÕES) ---
    def criar_card(parent, artigo, row, col):
        card = ctk.CTkFrame(parent, fg_color="white", corner_radius=15, border_width=1, border_color="#E2E8F0")
        card.grid(row=row, column=col, sticky="nsew", padx=10, pady=10)
        card.grid_propagate(False) 

        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(fill="both", expand=True, padx=20, pady=15)

        top_row = ctk.CTkFrame(inner, fg_color="transparent")
        top_row.pack(fill="x", pady=(0, 10))

        cat_id = artigo.get("id_categoria")
        mapa_reverso = getattr(api_client, 'MAP_ID_PARA_CATEGORIA', {})
        nome_cat = mapa_reverso.get(cat_id, "Geral").capitalize()

        cor_tag = "#E0F2F1" 
        txt_tag = "#00796B"
        if "Hardware" in nome_cat: cor_tag="#FEF3C7"; txt_tag="#D97706"
        elif "Software" in nome_cat: cor_tag="#DBEAFE"; txt_tag="#2563EB"
        elif "Rede" in nome_cat: cor_tag="#FEE2E2"; txt_tag="#DC2626"

        ctk.CTkLabel(top_row, text="📄", font=("Arial", 22)).pack(side="left")
        
        badge = ctk.CTkLabel(top_row, text=nome_cat, font=("Helvetica", 11, "bold"), 
                             text_color=txt_tag, fg_color=cor_tag, corner_radius=8, width=80, height=22)
        badge.pack(side="right")

        titulo = artigo.get("titulo", "Sem Título")
        if len(titulo) > 40: titulo = titulo[:40] + "..."
        
        conteudo = artigo.get("conteudo", "")
        resumo = (conteudo[:75] + "...") if len(conteudo) > 75 else conteudo

        ctk.CTkLabel(inner, text=titulo, font=("Helvetica", 16, "bold"), text_color="#1E293B", 
                     wraplength=230, justify="left", anchor="w").pack(fill="x")
        
        ctk.CTkLabel(inner, text=resumo, font=("Helvetica", 13), text_color="#64748B", 
                     wraplength=230, justify="left", anchor="w").pack(fill="x", pady=(5, 0))

        ctk.CTkLabel(inner, text="").pack(expand=True) 

        ctk.CTkButton(inner, text="Ler Artigo", fg_color="transparent", border_width=1, 
                      border_color="#009E7F", text_color="#009E7F", hover_color="#F0FDFA",
                      height=32, width=120, font=("Helvetica", 12, "bold"),
                      command=lambda aid=artigo.get("id_artigo"): exibir_artigo_func(
                          aid, conteudo_frame, user, 
                          callback_voltar=lambda: mostrar_base_conhecimento(conteudo_frame, user)
                      )
        ).pack(fill="x", side="bottom")

    # --- LÓGICA DE DADOS & PAGINAÇÃO ---
    
    def carregar_dados_iniciais():
        if not api_client.AUTH_TOKEN: return
        sucesso, dados = api_client.listar_artigos()
        
        # [SEGURANÇA] Verifica se o frame ainda existe antes de chamar o callback
        if conteudo_frame.winfo_exists():
            conteudo_frame.after(0, lambda: processar_carga(sucesso, dados))

    def processar_carga(sucesso, dados):
        if sucesso:
            state["artigos_originais"] = dados
            filtrar_e_renderizar()
        else:
            # [SEGURANÇA] Verifica janela antes de mostrar erro
            if conteudo_frame.winfo_exists():
                messagebox.showerror("Erro", "Falha ao carregar artigos.")

    def filtrar_e_renderizar():
        # Filtra localmente
        termo = state["termo_busca"].lower().strip()
        cat_nome = state["categoria_atual"]
        cat_id = MAPA_CATEGORIA_FILTRO.get(cat_nome)

        filtrados = []
        for art in state["artigos_originais"]:
            if cat_id is not None and art.get("id_categoria") != cat_id:
                continue
            
            t_art = str(art.get("titulo", "")).lower()
            c_art = str(art.get("conteudo", "")).lower()
            if termo and (termo not in t_art and termo not in c_art):
                continue
                
            filtrados.append(art)

        state["filtrados"] = filtrados
        state["pagina_atual"] = 1
        
        # [SEGURANÇA] Verifica se lbl_contador ainda existe (Evita erro de Logout)
        if lbl_contador.winfo_exists():
            lbl_contador.configure(text=f"{len(filtrados)} artigos")
            renderizar_pagina()

    def renderizar_pagina():
        # [SEGURANÇA] Verifica se o grid ainda existe
        if not grid_frame.winfo_exists(): return

        for w in grid_frame.winfo_children(): w.destroy()

        total_itens = len(state["filtrados"])
        if total_itens == 0:
            ctk.CTkLabel(grid_frame, text="Nenhum artigo encontrado.", 
                         font=("Helvetica", 16), text_color="gray").place(relx=0.5, rely=0.4, anchor="center")
            if lbl_paginacao.winfo_exists():
                lbl_paginacao.configure(text="0 de 0")
                btn_anterior.configure(state="disabled")
                btn_proximo.configure(state="disabled")
            return

        state["total_paginas"] = math.ceil(total_itens / ITENS_POR_PAGINA)
        pag = state["pagina_atual"]
        
        inicio = (pag - 1) * ITENS_POR_PAGINA
        fim = inicio + ITENS_POR_PAGINA
        itens_exibir = state["filtrados"][inicio:fim]

        if lbl_paginacao.winfo_exists():
            lbl_paginacao.configure(text=f"Página {pag} de {state['total_paginas']}")
            btn_anterior.configure(state="normal" if pag > 1 else "disabled")
            btn_proximo.configure(state="normal" if pag < state["total_paginas"] else "disabled")

        for i, item in enumerate(itens_exibir):
            row = i // 3
            col = i % 3
            criar_card(grid_frame, item, row, col)

    def mudar_pagina(direcao):
        nova = state["pagina_atual"] + direcao
        if 1 <= nova <= state["total_paginas"]:
            state["pagina_atual"] = nova
            renderizar_pagina()

    def ao_buscar(event=None):
        state["termo_busca"] = termo_busca_var.get()
        filtrar_e_renderizar()

    def selecionar_categoria(cat):
        state["categoria_atual"] = cat
        for nome, btn in botoes_refs.items():
            # [SEGURANÇA] Verifica botão
            if btn.winfo_exists():
                if nome == cat:
                    btn.configure(fg_color="#009E7F", text_color="white", border_width=0)
                else:
                    btn.configure(fg_color="white", text_color="#333", border_width=1, border_color="#CBD5E1")
        filtrar_e_renderizar()

    for cat in categorias:
        btn = ctk.CTkButton(
            cat_buttons_frame, text=cat, width=90, height=36, corner_radius=18,
            fg_color="white", text_color="#333", border_width=1, border_color="#CBD5E1", 
            hover_color="#E0F2F1", font=("Helvetica", 12, "bold"),
            command=lambda c=cat: selecionar_categoria(c)
        )
        btn.pack(side="left", padx=5)
        botoes_refs[cat] = btn

    termo_busca_var.trace_add("write", lambda *a: ao_buscar())
    selecionar_categoria("Todos") 
    threading.Thread(target=carregar_dados_iniciais, daemon=True).start()