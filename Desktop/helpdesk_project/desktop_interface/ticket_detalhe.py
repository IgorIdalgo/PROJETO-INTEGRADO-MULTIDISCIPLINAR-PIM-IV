import customtkinter as ctk
from tkinter import messagebox
from tkinter import filedialog
import threading
import sys
import os
import requests 
import base64 
import webbrowser
import re # IMPORTANTE PARA O NOME
from datetime import datetime

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path: sys.path.append(parent_dir)

try:
    from desktop_interface import api_client
except ImportError:
    import api_client

FLUXO_STATUS_LOGICO = ["Aberto", "Em Andamento", "Resolvido", "Fechado"]

# --- FUNÇÃO AUXILIAR DE NOME (MESMA DOS DASHBOARDS) ---
def obter_primeiro_nome(user_dict, default="Usuário"):
    # 1. Tenta Nome do Banco
    nome_db = user_dict.get("nomecompleto") or user_dict.get("NomeCompleto") or user_dict.get("nome")
    if nome_db and len(str(nome_db).strip()) > 1:
        return str(nome_db).split()[0].title()
    
    # 2. Tenta limpar o Email
    email = user_dict.get("email") or ""
    if "@" in str(email):
        handle = str(email).split("@")[0]
        # Divide por ponto, underline, hifen ou números
        partes = re.split(r'[._\-\d]', handle)
        if partes and partes[0]:
            return partes[0].title()
            
    return default

def abrir_ticket_detalhe(chamado_id, user, conteudo_frame, callback_refresh=None):
    
    # Busca chamado completo
    chamado = api_client.obter_chamado_por_id(chamado_id)

    if not chamado:
        messagebox.showerror("Erro", f"Detalhes do chamado #{chamado_id} não encontrados.")
        if callback_refresh: callback_refresh()
        return

    for widget in conteudo_frame.winfo_children(): widget.destroy()

    status_raw = str(chamado.get("status", "Aberto"))
    MAPA_STATUS_VISUAL = {
        "aberto": "Aberto", "em andamento": "Em Andamento", 
        "resolvido": "Resolvido", "fechado": "Fechado"
    }
    status_atual_formatado = MAPA_STATUS_VISUAL.get(status_raw.lower(), status_raw.capitalize())
    
    # --- FUNÇÃO DE DOWNLOAD ---
    def baixar_anexo(anexo_obj):
        nome = anexo_obj.get("nome", "arquivo_download")
        url = anexo_obj.get("url")
        dados_b64 = anexo_obj.get("dados")

        if url:
            if messagebox.askyesno("Baixar Anexo", f"O anexo é um link externo.\nDeseja abrir '{nome}' no navegador?"):
                webbrowser.open(url)
                return

        if "." not in nome: nome += ".dat"

        filepath = filedialog.asksaveasfilename(
            defaultextension=os.path.splitext(nome)[1], 
            initialfile=nome, 
            title="Salvar Anexo"
        )
        if not filepath: return
        
        def worker():
            try:
                if url:
                    resp = requests.get(url, stream=True, timeout=30)
                    resp.raise_for_status()
                    with open(filepath, 'wb') as f:
                        for chunk in resp.iter_content(chunk_size=8192): f.write(chunk)
                elif dados_b64:
                    bytes_dados = base64.b64decode(dados_b64)
                    with open(filepath, 'wb') as f: f.write(bytes_dados)
                else:
                    messagebox.showerror("Erro", "Anexo sem conteúdo.")
                    return

                messagebox.showinfo("Sucesso", f"Arquivo salvo com sucesso!")
            except Exception as e:
                messagebox.showerror("Erro ao Baixar", f"Falha: {e}")
        
        threading.Thread(target=worker).start()

    # === CABEÇALHO ===
    header = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    header.pack(fill="x", padx=20, pady=(20, 10))
    ctk.CTkButton(header, text="← Voltar", width=80, fg_color="#5BA39C", command=lambda: callback_refresh() if callback_refresh else None).pack(side="left")
    id_real = chamado.get('id_chamado') or chamado_id
    ctk.CTkLabel(header, text=f"Chamado #{id_real}", font=("Helvetica", 24, "bold"), text_color="#333").pack(side="left", padx=20)
    lbl_status_topo = ctk.CTkLabel(header, text=f"Status: {status_atual_formatado}", font=("Helvetica", 14, "bold"), text_color="#0284C7")
    lbl_status_topo.pack(side="right")

    # === SCROLL PRINCIPAL ===
    scroll = ctk.CTkScrollableFrame(conteudo_frame, fg_color="transparent")
    scroll.pack(fill="both", expand=True, padx=20, pady=(0, 20))

    grid = ctk.CTkFrame(scroll, fg_color="transparent")
    grid.pack(fill="both", expand=True)
    grid.grid_columnconfigure(0, weight=7)
    grid.grid_columnconfigure(1, weight=3)

    # --- ESQUERDA ---
    left = ctk.CTkFrame(grid, fg_color="white", corner_radius=15)
    left.grid(row=0, column=0, sticky="nsew", padx=(0, 15), pady=10)

    ctk.CTkLabel(left, text="Título do Problema", font=("Helvetica", 12, "bold"), text_color="gray").pack(anchor="w", padx=25, pady=(20, 0))
    ctk.CTkLabel(left, text=chamado.get("titulo", "-"), font=("Helvetica", 18, "bold"), text_color="#1E293B").pack(anchor="w", padx=25, pady=(5, 15))
    ctk.CTkLabel(left, text="Descrição", font=("Helvetica", 12, "bold"), text_color="gray").pack(anchor="w", padx=25, pady=(5, 0))
    ctk.CTkLabel(left, text=chamado.get("descricao", "-"), font=("Helvetica", 14), text_color="#334155", wraplength=600, justify="left").pack(anchor="w", padx=25, pady=(5, 25))

    # IA
    sugestao_raw = str(chamado.get("resolucaoia_sugerida", ""))
    if sugestao_raw == "None": sugestao_raw = ""
    role_usuario = user.get("role", "colaborador").lower()
    
    if "colaborador" in role_usuario:
        titulo_ia, cor_icone, msg_ia = "💡 Dica do Assistente", "#F59E0B", sugestao_raw if sugestao_raw else "Análise em processamento."
    else:
        titulo_ia, cor_icone, msg_ia = "🤖 Análise Técnica da IA", "#10B981", sugestao_raw if sugestao_raw else "Nenhuma análise registrada."

    ia_frame = ctk.CTkFrame(left, fg_color="#F0FDF4", corner_radius=10, border_color="#BBF7D0", border_width=1)
    ia_frame.pack(fill="x", padx=25, pady=(0, 25))
    ctk.CTkLabel(ia_frame, text=titulo_ia, font=("Helvetica", 14, "bold"), text_color=cor_icone).pack(anchor="w", padx=15, pady=(15, 5))
    ctk.CTkLabel(ia_frame, text=msg_ia, font=("Helvetica", 13), text_color="#14532D", wraplength=580, justify="left").pack(anchor="w", padx=15, pady=(0, 15))

    # --- ANEXOS ---
    anexos = chamado.get("anexos") or []
    if anexos:
        ctk.CTkLabel(left, text="Anexos Recebidos", font=("Helvetica", 14, "bold")).pack(anchor="w", padx=25, pady=(10, 5))
        anexo_container = ctk.CTkFrame(left, fg_color="transparent")
        anexo_container.pack(fill="x", padx=25, pady=(0, 20))
        
        for idx, anexo in enumerate(anexos):
            anexo_frame = ctk.CTkFrame(anexo_container, fg_color="#F8FAFC", corner_radius=8, border_width=1, border_color="#E2E8F0")
            anexo_frame.pack(fill="x", pady=4)
            
            nome_anexo = anexo.get("nome") or f"Arquivo_{idx+1}"
            url_anexo = anexo.get("url")
            dados_b64 = anexo.get("dados")
            
            ctk.CTkLabel(anexo_frame, text="📎", font=("Arial", 18)).pack(side="left", padx=10, pady=5)
            ctk.CTkLabel(anexo_frame, text=nome_anexo, font=("Helvetica", 13), text_color="#334155").pack(side="left", padx=5)
            
            if url_anexo or dados_b64:
                ctk.CTkButton(
                    anexo_frame, text="Baixar / Abrir", width=100, height=28, fg_color="#5BA39C", hover_color="#007F66",
                    font=("Helvetica", 11, "bold"),
                    command=lambda a=anexo: baixar_anexo(a)
                ).pack(side="right", padx=10, pady=5)
            else:
                ctk.CTkLabel(anexo_frame, text="(Vazio)", text_color="red", font=("Helvetica", 11)).pack(side="right", padx=10)

    # --- CHAT ---
    tabview = ctk.CTkTabview(left, height=400, fg_color="transparent", segmented_button_selected_color="#5BA39C", segmented_button_selected_hover_color="#468882")
    tabview.pack(fill="x", padx=15, pady=(10, 15))
    tabview.add("Comentários")
    tab_chat = tabview.tab("Comentários")
    
    chat_scroll = ctk.CTkScrollableFrame(tab_chat, fg_color="#F1F5F9", height=300, corner_radius=10)
    chat_scroll.pack(fill="both", expand=True, padx=0, pady=(0, 10))
    
    input_container = ctk.CTkFrame(tab_chat, fg_color="transparent")
    input_container.pack(fill="x", padx=0, pady=0)
    
    entry_chat = ctk.CTkTextbox(input_container, height=50, border_color="#CBD5E1", border_width=1, corner_radius=20, fg_color="white", text_color="#333")
    entry_chat.pack(side="left", fill="both", expand=True, padx=(0, 10))

    # Cache local para evitar múltiplas chamadas de lista de usuários
    users_cache = {} 

    def obter_mapa_usuarios():
        if not users_cache:
            sucesso, lista = api_client.listar_usuarios()
            if sucesso and lista:
                for u in lista:
                    uid = str(u.get("id") or u.get("id_usuario"))
                    users_cache[uid] = u # Guarda o objeto usuario inteiro

    def carregar_comentarios():
        try: obter_mapa_usuarios()
        except: pass
        
        sucesso, dados = api_client.listar_comentarios(id_real)
        
        # Se a janela fechou durante o carregamento
        if not chat_scroll.winfo_exists(): return
        
        # Limpa chat antigo
        for w in chat_scroll.winfo_children(): w.destroy()
        
        if sucesso and dados:
            dados.sort(key=lambda x: x.get("data_hora", ""), reverse=False)
            ctk.CTkLabel(chat_scroll, text="", height=10).pack() # Espaçador topo
            for c in dados: 
                criar_balao_comentario(c)
            
            # Rola para baixo
            chat_scroll.after(100, lambda: chat_scroll._parent_canvas.yview_moveto(1.0))
        elif not dados: 
            ctk.CTkLabel(chat_scroll, text="Nenhum comentário.", text_color="gray").pack(pady=40)

    def criar_balao_comentario(comentario):
        uid = str(comentario.get("id_usuario"))
        texto = comentario.get("comentario")
        data_raw = comentario.get("data_hora", "")
        
        try: dt = datetime.fromisoformat(data_raw.replace("Z", "")); data_fmt = dt.strftime("%d/%m %H:%M")
        except: data_fmt = "Recentemente"
        
        meu_id = str(api_client.CURRENT_USER.get("id"))
        sou_eu = uid == meu_id
        
        # Dados do Autor
        autor_data = users_cache.get(uid, {})
        
        # 🟢 AQUI ESTÁ A CORREÇÃO DO NOME
        if sou_eu:
            nome_exibicao = "Você"
        else:
            # Tenta pegar do cache, se não der, tenta do objeto comentário
            dados_para_nome = autor_data if autor_data else comentario
            nome_exibicao = obter_primeiro_nome(dados_para_nome, default="Usuário")

        role = autor_data.get("id_perfil") or comentario.get("id_perfil") or 3
        map_roles = {1: ("Admin", "#EF4444"), 2: ("Técnico", "#0284C7"), 3: ("Colaborador", "#64748B")}
        c_txt, c_cor = map_roles.get(role, ("Colaborador", "#64748B"))
        
        # Visual do Balão
        align, bg = ("e", "#DCF8C6") if sou_eu else ("w", "#FFFFFF")
        row = ctk.CTkFrame(chat_scroll, fg_color="transparent"); row.pack(fill="x", pady=5, padx=10)
        bubble = ctk.CTkFrame(row, fg_color=bg, corner_radius=12, border_width=1, border_color="#E2E8F0")
        bubble.pack(side="right" if sou_eu else "left", anchor=align)
        
        if not sou_eu:
            head = ctk.CTkFrame(bubble, fg_color="transparent", height=15); head.pack(fill="x", padx=10, pady=(5,0))
            ctk.CTkLabel(head, text=nome_exibicao, font=("Helvetica", 11, "bold"), text_color="#333").pack(side="left")
            ctk.CTkLabel(head, text=f" • {c_txt.upper()}", font=("Helvetica", 9, "bold"), text_color=c_cor).pack(side="left", padx=5)
        
        ctk.CTkLabel(bubble, text=texto, font=("Helvetica", 13), text_color="#111827", justify="left", wraplength=380).pack(padx=10, pady=(5,2))
        ctk.CTkLabel(bubble, text=data_fmt, font=("Helvetica", 9), text_color="#6B7280").pack(anchor="e", padx=8, pady=(0,5))

    def acao_enviar_comentario():
        texto = entry_chat.get("1.0", "end-1c").strip()
        if not texto: return
        btn_enviar.configure(state="disabled", text="...")
        
        def th():
            sucesso, _ = api_client.enviar_comentario(id_real, texto)
            if conteudo_frame.winfo_exists(): 
                conteudo_frame.after(0, lambda: fim(sucesso))
        
        def fim(ok):
            btn_enviar.configure(state="normal", text="➤")
            if ok: 
                entry_chat.delete("1.0", "end")
                # 🟢 RECARREGA OS COMENTÁRIOS IMEDIATAMENTE
                threading.Thread(target=carregar_comentarios).start()
            else: 
                messagebox.showerror("Erro", "Falha ao enviar.")
        
        threading.Thread(target=th).start()

    btn_enviar = ctk.CTkButton(input_container, text="➤", width=50, height=50, corner_radius=25, fg_color="#5BA39C", font=("Arial", 20), command=acao_enviar_comentario)
    btn_enviar.pack(side="right")
    
    # Carrega comentários ao abrir
    threading.Thread(target=carregar_comentarios).start()

    # --- DIREITA ---
    right = ctk.CTkFrame(grid, fg_color="white", corner_radius=15)
    right.grid(row=0, column=1, sticky="nsew", pady=10)
    ctk.CTkLabel(right, text="Detalhes do Ticket", font=("Helvetica", 16, "bold"), text_color="#333").pack(anchor="w", padx=20, pady=(20, 15))
    
    def add_meta(label, val):
        row = ctk.CTkFrame(right, fg_color="transparent"); row.pack(fill="x", padx=20, pady=8)
        ctk.CTkLabel(row, text=label, font=("Helvetica", 12, "bold"), text_color="#64748B").pack(side="left")
        ctk.CTkLabel(row, text=str(val), font=("Helvetica", 12, "bold"), text_color="#334155").pack(side="right")
    
    cat_val = chamado.get("id_categoria")
    mapa = getattr(api_client, 'MAP_ID_PARA_CATEGORIA', {})
    add_meta("Categoria", mapa.get(cat_val, "Geral").capitalize())
    add_meta("Prioridade", str(chamado.get("prioridade") or "Média").title())
    add_meta("Data", str(chamado.get("data_abertura") or "")[:10])
    ctk.CTkFrame(right, height=2, fg_color="#E2E8F0").pack(fill="x", padx=20, pady=20)

    if role_usuario == "tecnico": 
        ctk.CTkLabel(right, text="Gerenciar Status", font=("Helvetica", 14, "bold"), text_color="#00796B").pack(anchor="w", padx=20, pady=(0, 10))
        combo = ctk.CTkComboBox(right, values=FLUXO_STATUS_LOGICO, state="readonly", height=35, border_color="#CBD5E1", button_color="#00796B")
        combo.set(status_atual_formatado)
        combo.pack(fill="x", padx=20, pady=5)
        
        def atualizar():
            novo = combo.get()
            if novo == status_atual_formatado: return
            def th():
                s_api = MAPA_STATUS_VISUAL.get(novo.lower(), novo)
                suc, msg = api_client.atualizar_status_chamado(id_real, s_api)
                right.after(0, lambda: fim_up(suc, msg, s_api))
            threading.Thread(target=th).start()
        
        def fim_up(suc, msg, n):
            if suc: messagebox.showinfo("Sucesso", msg); lbl_status_topo.configure(text=f"Status: {n}"); abrir_ticket_detalhe(id_real, user, conteudo_frame, callback_refresh)
            else: messagebox.showerror("Erro", msg)

        ctk.CTkButton(right, text="Atualizar Status", fg_color="#009E7F", font=("Helvetica", 13, "bold"), height=40, command=atualizar).pack(fill="x", padx=20, pady=(10, 20))
    else:
        ctk.CTkLabel(right, text="Gerenciamento de Status: Exclusivo para Técnicos.", font=("Helvetica", 12, "italic"), text_color="#EF4444", wraplength=200).pack(padx=20, pady=20)