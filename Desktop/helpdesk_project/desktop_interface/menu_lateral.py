import customtkinter as ctk
from tkinter import messagebox
import sys
import os

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

def criar_menu_lateral(
    janela_dashboard, 
    usuario, 
    conteudo_frame, 
    abrir_dashboard, 
    abrir_meus_chamados, 
    abrir_base_conhecimento, 
    abrir_gerenciar_chamados=None, 
    abrir_usuarios=None,
    abrir_relatorios=None
):
    """
    Cria o menu lateral padrão para todos os dashboards.
    Lida com a navegação e o LOGOUT seguro.
    """
    
    # Frame do Menu
    menu_frame = ctk.CTkFrame(janela_dashboard, width=250, corner_radius=0, fg_color="#E0F2F1")
    menu_frame.pack(side="left", fill="y")
    menu_frame.pack_propagate(False) # Mantém largura fixa

    # --- Cabeçalho do Menu ---
    role_display = usuario.get("role", "Colaborador").capitalize()
    if role_display == "Admin": role_display = "Administrador"

    ctk.CTkLabel(
        menu_frame, 
        text=f"HelpDesk IA\n{role_display}", 
        font=("Helvetica", 20, "bold"), 
        text_color="#00796B"
    ).pack(pady=(40, 30))

    # --- Botões de Navegação ---
    
    def criar_botao(texto, comando, role_check=None):
        role_user = usuario.get("role", "").lower()
        if role_check and role_user not in role_check:
            return None # Não cria o botão se a permissão não for atendida
            
        return ctk.CTkButton(
            menu_frame, 
            text=texto, 
            fg_color="#5BA39C", 
            hover_color="#4C8E87", 
            height=40, 
            anchor="w",
            font=("Helvetica", 13, "bold"),
            command=lambda: comando(conteudo_frame, usuario)
        )

    # Botão Dashboard (Home)
    criar_botao("Dashboard", abrir_dashboard).pack(fill="x", padx=20, pady=5)

    # 🟢 LÓGICA DE MEUS CHAMADOS (SÓ CRIA SE A FUNÇÃO FOR PASSADA E FOR COLABORADOR)
    if abrir_meus_chamados and usuario.get("role").lower() == "colaborador":
        criar_botao("Meus Chamados", abrir_meus_chamados).pack(fill="x", padx=20, pady=5)

    # Botão Base de Conhecimento (Visível para Colaborador e Técnico)
    if abrir_base_conhecimento and usuario.get("role").lower() in ["colaborador", "tecnico"]:
        criar_botao("Base de Conhecimento", abrir_base_conhecimento).pack(fill="x", padx=20, pady=5)
    
    # Botão Gerenciar Chamados (Admin/Técnico)
    if abrir_gerenciar_chamados:
        criar_botao("Gerenciar Chamados", abrir_gerenciar_chamados).pack(fill="x", padx=20, pady=5)
    
    # Botão Usuários (Admin)
    if abrir_usuarios:
        criar_botao("Usuários", abrir_usuarios).pack(fill="x", padx=20, pady=5)

    # Botão Relatórios (Admin)
    if abrir_relatorios:
        criar_botao("Relatórios", abrir_relatorios, role_check=["admin"]).pack(fill="x", padx=20, pady=5)


    # =========================================
    # LÓGICA DE LOGOUT
    # =========================================
    def realizar_logout():
        """
        Fecha o dashboard atual e restaura a janela de login oculta.
        """
        resposta = messagebox.askyesno("Logout", "Tem certeza que deseja sair do sistema?")
        
        if resposta:
            try:
                janela_login = janela_dashboard.master
                janela_login.deiconify()
                janela_dashboard.destroy()

                # Limpeza opcional do campo de senha
                try:
                    for widget in janela_login.winfo_children():
                        if isinstance(widget, ctk.CTkFrame):
                            for child in widget.winfo_children():
                                if isinstance(child, ctk.CTkFrame): 
                                    for subchild in child.winfo_children():
                                        if isinstance(subchild, ctk.CTkEntry) and subchild.cget("show") == "*":
                                            subchild.delete(0, "end")
                except:
                    pass 

                print("Logout realizado com sucesso.")

            except Exception as e:
                print(f"Erro ao fazer logout: {e}")
                sys.exit()

    # Espaçador para empurrar o Logout para o fundo
    ctk.CTkFrame(menu_frame, fg_color="transparent").pack(fill="both", expand=True)

    # Botão Logout
    ctk.CTkButton(
        menu_frame, 
        text="Sair (Logout)", 
        fg_color="#EF4444", 
        hover_color="#DC2626", 
        height=40,
        font=("Helvetica", 13, "bold"),
        command=realizar_logout
    ).pack(fill="x", padx=20, pady=20)