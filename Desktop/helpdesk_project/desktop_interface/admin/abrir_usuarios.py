import customtkinter as ctk
from tkinter import messagebox
import threading
import sys
import os

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# --- IMPORT API CLIENT ---
try:
    from desktop_interface import api_client
except ImportError:
    import api_client

# Mapa de perfis
MAP_PERFIL_ID_TO_STRING = {1: "admin", 2: "tecnico", 3: "colaborador"}
MAP_STRING_TO_PERFIL_ID = {"Admin": 1, "Tecnico": 2, "Colaborador": 3}

# 🔑 SENHA FIXA DE CONFIRMAÇÃO (NOVA IMPLEMENTAÇÃO)
SENHA_FIXA_ADMIN = "confirmacao123"


# ------------------------------------------------------------------------------
# LÓGICA DE CONFIRMAÇÃO DE SENHA (MODAL DE SEGURANÇA)
# ------------------------------------------------------------------------------
def solicitar_senha_confirmacao(parent, acao_callback):
    dialog = ctk.CTkToplevel(parent)
    dialog.title("Autenticação Necessária")
    dialog.geometry("350x220")
    dialog.grab_set()
    dialog.focus_force()

    dialog.update_idletasks()
    try:
        x = parent.winfo_rootx() + (parent.winfo_width() // 2) - 175
        y = parent.winfo_rooty() + (parent.winfo_height() // 2) - 110
        dialog.geometry(f"+{x}+{y}")
    except:
        pass

    ctk.CTkLabel(
        dialog,
        text="🔒 Acesso Restrito",
        font=("Helvetica", 14, "bold"),
        text_color="#555",
    ).pack(pady=(20, 5))
    ctk.CTkLabel(
        dialog, text="Confirme sua senha para continuar:", font=("Helvetica", 12)
    ).pack(pady=(0, 10))

    entry_pass = ctk.CTkEntry(dialog, show="*", width=250, height=35)
    entry_pass.pack(pady=5)
    entry_pass.focus()

    def confirmar(event=None):
        senha_digitada = entry_pass.get()
        if not senha_digitada:
            messagebox.showwarning("Atenção", "Digite a senha.", parent=dialog)
            return

        btn_confirmar.configure(state="disabled", text="Validando...")
        
        # --- NOVO FLUXO: VALIDAÇÃO COM SENHA FIXA ---
        if senha_digitada == SENHA_FIXA_ADMIN:
            # Senha correta: executa a ação e fecha o modal
            dialog.destroy()
            acao_callback()
        else:
            # Senha incorreta: mostra erro e reabilita o botão
            messagebox.showerror("Acesso Negado", "Senha incorreta.", parent=dialog)
            if dialog.winfo_exists():
                btn_confirmar.configure(state="normal", text="Confirmar")
                entry_pass.delete(0, "end")
        # ------------------------------------------

    entry_pass.bind("<Return>", confirmar)
    btn_confirmar = ctk.CTkButton(
        dialog,
        text="Confirmar",
        fg_color="#DC2626",
        hover_color="#B91C1C",
        height=35,
        width=250,
        font=("Helvetica", 13, "bold"),
        command=confirmar,
    )
    btn_confirmar.pack(pady=20)


# ------------------------------------------------------------------------------
# MODAL DE EDIÇÃO DE USUÁRIO
# ------------------------------------------------------------------------------
def abrir_modal_edicao(parent_frame, usuario_data, callback_sucesso):

    janela_edit = ctk.CTkToplevel(parent_frame)
    janela_edit.title("Editar Usuário")
    janela_edit.geometry("420x480")
    janela_edit.grab_set()
    janela_edit.focus_force()

    user_id = usuario_data.get("id")
    nome_atual = usuario_data.get("nomecompleto") or ""
    id_perfil_atual = usuario_data.get("id_perfil") or 3
    ativo_atual = usuario_data.get("ativo", True)

    role_str_atual = MAP_PERFIL_ID_TO_STRING.get(
        id_perfil_atual, "colaborador"
    ).capitalize()

    ctk.CTkLabel(
        janela_edit,
        text="Editar Dados",
        font=("Helvetica", 20, "bold"),
        text_color="#00796B",
    ).pack(pady=(30, 5))
    
    ctk.CTkLabel(
        janela_edit, text=f"ID Sistema: {user_id}", font=("Courier", 10), text_color="gray"
    ).pack(pady=(0, 20))

    ctk.CTkLabel(
        janela_edit, text="Nome Completo", font=("Helvetica", 12, "bold")
    ).pack(anchor="w", padx=40)
    entry_nome = ctk.CTkEntry(janela_edit, width=340, height=35)
    entry_nome.pack(pady=(5, 15))
    if nome_atual:
        entry_nome.insert(0, nome_atual)

    ctk.CTkLabel(
        janela_edit, text="Função / Cargo", font=("Helvetica", 12, "bold")
    ).pack(anchor="w", padx=40)
    combo_cargo = ctk.CTkComboBox(
        janela_edit,
        values=["Admin", "Tecnico", "Colaborador"],
        width=340,
        height=35,
        state="readonly",
    )
    combo_cargo.set(role_str_atual)
    combo_cargo.pack(pady=(5, 15))

    switch_ativo = ctk.CTkSwitch(
        janela_edit,
        text="Usuário Ativo",
        onvalue=True,
        offvalue=False,
        font=("Helvetica", 12),
    )
    if ativo_atual:
        switch_ativo.select()
    else:
        switch_ativo.deselect()
    switch_ativo.pack(pady=10)

    def acao_salvar_final():
        if not messagebox.askyesno(
            "Confirmar Alterações",
            "Deseja salvar as alterações neste usuário?",
            parent=janela_edit,
        ):
            return

        novo_nome = entry_nome.get().strip() or "Usuário Sem Nome"
        novo_cargo_str = combo_cargo.get()
        novo_status = switch_ativo.get()
        novo_id_perfil = MAP_STRING_TO_PERFIL_ID.get(novo_cargo_str, 3)

        sucesso, msg = api_client.atualizar_usuario(
            user_id, novo_nome, novo_id_perfil, novo_status
        )

        if sucesso:
            messagebox.showinfo("Sucesso", "Dados atualizados!", parent=janela_edit)
            janela_edit.destroy()
            callback_sucesso()
        else:
            messagebox.showerror("Erro", msg, parent=janela_edit)

    ctk.CTkButton(
        janela_edit,
        text="Salvar Alterações",
        width=340,
        height=40,
        font=("Helvetica", 14, "bold"),
        fg_color="#009E7F",
        hover_color="#00755E",
        command=acao_salvar_final,
    ).pack(pady=30)


# ------------------------------------------------------------------------------
# TELA PRINCIPAL (LISTAGEM)
# ------------------------------------------------------------------------------
def abrir_usuarios(conteudo_frame, user):

    for widget in conteudo_frame.winfo_children():
        widget.destroy()

    container = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    container.pack(fill="both", expand=True, padx=30, pady=20)

    # Cabeçalho
    header = ctk.CTkFrame(container, fg_color="transparent")
    header.pack(fill="x", pady=(0, 20))
    ctk.CTkLabel(
        header,
        text="Gerenciar Usuários",
        font=("Helvetica", 24, "bold"),
        text_color="#1E293B",
    ).pack(side="left")
    lbl_status = ctk.CTkLabel(header, text="...", text_color="gray")
    lbl_status.pack(side="right")

    # Tabela
    tabela_frame = ctk.CTkFrame(
        container,
        fg_color="white",
        corner_radius=10,
        border_width=0, 
    )
    tabela_frame.pack(fill="both", expand=True)

    grid = ctk.CTkFrame(tabela_frame, fg_color="transparent")
    grid.pack(fill="x", padx=20, pady=15)

    # Configuração de Colunas
    grid.grid_columnconfigure(0, weight=10) # Nome
    grid.grid_columnconfigure(1, weight=1)  # Status
    grid.grid_columnconfigure(2, weight=1)  # Função
    grid.grid_columnconfigure(3, weight=0)  # Ações

    # --- FLUXO INATIVAR ---
    def preparar_inativacao(usuario_data):
        uid = usuario_data.get("id")
        nome = usuario_data.get("nomecompleto") or "Desconhecido"

        def fluxo_confirmar_final():
            if messagebox.askyesno(
                "Inativar Usuário",
                f"ATENÇÃO: Deseja realmente inativar o usuário:\n{nome}?\n\nEle perderá acesso ao sistema.",
            ):
                sucesso, msg = api_client.inativar_usuario(uid)
                if sucesso:
                    messagebox.showinfo("Sucesso", "Usuário inativado.")
                    carregar_usuarios_thread()
                else:
                    messagebox.showerror("Erro", msg)

        solicitar_senha_confirmacao(conteudo_frame, fluxo_confirmar_final)

    # --- FLUXO EDITAR ---
    def preparar_edicao(usuario_data):
        def fluxo_abrir_janela():
            abrir_modal_edicao(conteudo_frame, usuario_data, carregar_usuarios_thread)
        solicitar_senha_confirmacao(conteudo_frame, fluxo_abrir_janela)

    # --- LISTAGEM DE DADOS ---
    def carregar_usuarios_thread():
        lbl_status.configure(text="Atualizando...")
        if not api_client.AUTH_TOKEN:
            return
        sucesso, dados = api_client.listar_usuarios()
        if tabela_frame.winfo_exists():
            tabela_frame.after(0, lambda: renderizar_tabela(sucesso, dados))

    def renderizar_tabela(sucesso, dados):
        lbl_status.configure(text="")
        for w in grid.winfo_children():
            w.destroy()

        if not sucesso:
            ctk.CTkLabel(grid, text=f"Erro: {dados}", text_color="red").pack(pady=20)
            return
        if not dados:
            ctk.CTkLabel(
                grid, text="Nenhum usuário encontrado.", text_color="gray"
            ).pack(pady=20)
            return

        # Cabeçalhos
        headers = ["NOME DO USUÁRIO", "STATUS", "FUNÇÃO", "AÇÕES"]
        # Mantive padx=10 aqui para garantir alinhamento com o conteúdo
        for i, h in enumerate(headers):
            ctk.CTkLabel(
                grid, text=h, font=("Helvetica", 11, "bold"), text_color="#94A3B8"
            ).grid(row=0, column=i, sticky="w", pady=(0, 15), padx=10)

        if isinstance(dados, list):
            filtrados = sorted(dados, key=lambda u: str(u.get("nomecompleto") or "").lower())
        else:
            filtrados = []

        for idx, u in enumerate(filtrados, start=1):
            criar_linha(idx, u)

    def criar_linha(row_idx, u):
        nome_display = u.get("nomecompleto") or "Usuário sem nome"
        id_perfil = u.get("id_perfil") or 3
        ativo = u.get("ativo")
        if ativo is None: ativo = True

        pad_y = 8
        # Padx unificado em 10 para alinhar perfeitamente com o header
        pad_x = 10 

        # CORREÇÃO PRINCIPAL: anchor="w" força o texto a ficar na esquerda da célula
        ctk.CTkLabel(
            grid, 
            text=nome_display, 
            font=("Helvetica", 12, "bold"), 
            text_color="#334155",
            anchor="w" 
        ).grid(row=row_idx, column=0, sticky="ew", pady=pad_y, padx=pad_x)

        # Status
        cor_status = "#16A34A" if ativo else "#DC2626"
        txt_status = "Ativo" if ativo else "Inativo"
        ctk.CTkLabel(
            grid, text=txt_status, font=("Helvetica", 11, "bold"), text_color=cor_status,
            anchor="w"
        ).grid(row=row_idx, column=1, sticky="ew", pady=pad_y, padx=pad_x)

        # Função
        role_map = {
            1: ("Admin", "#EF4444"),
            2: ("Técnico", "#3B82F6"),
            3: ("Colaborador", "#6B7280"),
        }
        nome_role, cor_role = role_map.get(id_perfil, ("Colaborador", "#6B7280"))

        badge = ctk.CTkLabel(
            grid,
            text=nome_role.upper(),
            font=("Helvetica", 9, "bold"),
            text_color="white",
            fg_color=cor_role,
            corner_radius=6,
            width=90,
            height=25,
        )
        # Badge não usa anchor="w" pq texto dentro do botão/label colorido fica melhor centralizado
        badge.grid(row=row_idx, column=2, sticky="w", pady=pad_y, padx=pad_x)

        # Ações
        acoes_frame = ctk.CTkFrame(grid, fg_color="transparent")
        acoes_frame.grid(row=row_idx, column=3, sticky="w", pady=pad_y, padx=pad_x)

        ctk.CTkButton(
            acoes_frame,
            text="Editar",
            width=70,
            height=28,
            fg_color="#F59E0B",
            hover_color="#D97706",
            font=("Helvetica", 11, "bold"),
            command=lambda: preparar_edicao(u),
        ).pack(side="left", padx=(0, 5))

        if ativo:
            ctk.CTkButton(
                acoes_frame,
                text="Inativar",
                width=70,
                height=28,
                fg_color="#EF4444",
                hover_color="#DC2626",
                font=("Helvetica", 11, "bold"),
                command=lambda: preparar_inativacao(u),
            ).pack(side="left", padx=0)

    threading.Thread(target=carregar_usuarios_thread, daemon=True).start()