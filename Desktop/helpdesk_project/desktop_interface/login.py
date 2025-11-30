import customtkinter as ctk
from tkinter import messagebox
from PIL import Image
import threading
import sys
import os

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# --- IMPORT API ---
try:
    from desktop_interface import api_client
except ImportError:
    import api_client

# Importa dashboards
from desktop_interface.admin.dashboard_admin import abrir_dashboard_admin
from desktop_interface.tecnico.dashboard_tecnico import abrir_dashboard_tecnico
from desktop_interface.colaborador.dashboard_colaborador import (
    abrir_dashboard_colaborador,
)

# ====================== CONFIGURAÇÃO DA JANELA ======================

ctk.set_appearance_mode("light")
ctk.set_default_color_theme("green")

app = ctk.CTk()
app.title("HelpDesk - Login")
app.geometry("1200x720")
app.resizable(False, False)
app.configure(fg_color="#5BA39C")  # Verde suave


# ====================== FUNÇÃO PARA CARREGAR IMAGEM (BLINDADA) ======================
def carregar_imagem_robo():
    """Tenta encontrar a imagem do robô em vários locais possíveis"""
    nomes_possiveis = ["svgviewer-output.png", "robot.png"]

    # Lista de pastas para procurar
    pastas_busca = [
        os.path.dirname(
            os.path.abspath(__file__)
        ),  # Pasta do script (desktop_interface)
        parent_dir,  # Pasta pai (helpdesk_project)
        os.path.join(parent_dir, "desktop_interface"),  # Redundância
    ]

    # Se estiver rodando como EXE (PyInstaller)
    if hasattr(sys, "_MEIPASS"):
        pastas_busca.insert(0, os.path.join(sys._MEIPASS, "desktop_interface"))
        pastas_busca.insert(0, sys._MEIPASS)

    for pasta in pastas_busca:
        for nome in nomes_possiveis:
            caminho_completo = os.path.join(pasta, nome)
            if os.path.exists(caminho_completo):
                try:
                    pil_img = Image.open(caminho_completo)
                    return ctk.CTkImage(light_image=pil_img, size=(90, 90))
                except:
                    pass
    return None


# ====================== LAYOUT ======================

center_frame = ctk.CTkFrame(app, fg_color="transparent")
center_frame.place(relx=0.5, rely=0.5, anchor="center")

# --- TOPO ---
header_frame = ctk.CTkFrame(center_frame, fg_color="transparent")
header_frame.pack(pady=(0, 35))

# Tenta carregar a imagem
robot_image = carregar_imagem_robo()

if robot_image:
    lbl_icon = ctk.CTkLabel(header_frame, text="", image=robot_image)
    lbl_icon.pack(pady=(0, 15))
else:
    # Fallback se não achar a imagem de jeito nenhum
    lbl_icon = ctk.CTkLabel(
        header_frame, text="🤖", font=("Arial", 72), text_color="white"
    )
    lbl_icon.pack(pady=(0, 15))

# Título
lbl_titulo = ctk.CTkLabel(
    header_frame, text="HelpDesk IA", font=("Segoe UI", 42), text_color="white"
)
lbl_titulo.pack(pady=(0, 5))

# Subtítulo
lbl_subtitulo = ctk.CTkLabel(
    header_frame,
    text="Sistema Inteligente de Suporte",
    font=("Segoe UI", 18),
    text_color="#F0FDF4",
)
lbl_subtitulo.pack()

# --- CARD DE LOGIN ---
card_login = ctk.CTkFrame(
    center_frame,
    width=420,
    height=380,
    corner_radius=20,
    fg_color="white",
    border_width=0,
)
card_login.pack(pady=10, ipadx=40, ipady=40)

ctk.CTkLabel(
    card_login, text="Login", font=("Segoe UI", 28, "bold"), text_color="#333"
).pack(pady=(10, 5))
ctk.CTkLabel(
    card_login,
    text="Entre com suas credenciais para acessar",
    font=("Segoe UI", 14),
    text_color="gray",
).pack(pady=(0, 25))

# Campos
entry_user = ctk.CTkEntry(
    card_login,
    placeholder_text="Email corporativo",
    width=320,
    height=50,
    border_color="#E2E8F0",
    fg_color="#F8FAFC",
    text_color="#333",
    font=("Segoe UI", 14),
)
entry_user.pack(pady=(0, 15))

entry_password = ctk.CTkEntry(
    card_login,
    placeholder_text="Senha",
    show="*",
    width=320,
    height=50,
    border_color="#E2E8F0",
    fg_color="#F8FAFC",
    text_color="#333",
    font=("Segoe UI", 14),
)
entry_password.pack(pady=(0, 30))

btn_login = None


# --- LÓGICA ---
def acao_botao_login():
    email = entry_user.get().strip()
    senha = entry_password.get().strip()
    if not email or not senha:
        messagebox.showerror("Atenção", "Preencha todos os campos.")
        return
    btn_login.configure(state="disabled", text="ENTRANDO...", fg_color="#4C8E87")
    threading.Thread(
        target=thread_login_worker, args=(email, senha), daemon=True
    ).start()


def thread_login_worker(email, senha):
    try:
        sucesso, mensagem, user_data = api_client.realizar_login(email, senha)
        app.after(0, lambda: processar_resultado(sucesso, mensagem, user_data))
    except Exception as e:
        app.after(0, lambda: processar_resultado(False, f"Erro interno: {e}", None))


def processar_resultado(sucesso, mensagem, user_data):
    try:
        if btn_login.winfo_exists():
            btn_login.configure(state="normal", text="ENTRAR", fg_color="#5BA39C")
    except:
        pass

    if sucesso:
        app.withdraw()
        role = user_data.get("role", "colaborador").lower()
        if role in ["admin", "administrador"]:
            abrir_dashboard_admin(app, user_data)
        elif role == "tecnico":
            abrir_dashboard_tecnico(app, user_data)
        else:
            abrir_dashboard_colaborador(app, user_data)
    else:
        messagebox.showerror("Erro", mensagem)


btn_login = ctk.CTkButton(
    card_login,
    text="ENTRAR",
    width=320,
    height=50,
    corner_radius=10,
    fg_color="#5BA39C",
    hover_color="#4C8E87",
    font=("Segoe UI", 15, "bold"),
    command=acao_botao_login,
)
btn_login.pack(pady=(0, 10))


def abrir_tela_login(janela):
    janela.deiconify()
    janela.title("HelpDesk - Login")
    janela.geometry("1200x720")
    janela.configure(fg_color="#5BA39C")
    entry_password.delete(0, "end")


if __name__ == "__main__":
    app.mainloop()
