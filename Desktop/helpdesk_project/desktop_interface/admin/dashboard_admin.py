import customtkinter as ctk
import threading
import sys
import os
from datetime import datetime, timedelta
from tkinter import messagebox

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
interface_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(interface_dir)

if interface_dir not in sys.path: sys.path.append(interface_dir)
if root_dir not in sys.path: sys.path.append(root_dir)

try:
    from desktop_interface import api_client
except ImportError:
    import api_client

from desktop_interface.criar_chamado import abrir_formulario_chamado
from desktop_interface.ticket_detalhe import abrir_ticket_detalhe
try:
    from desktop_interface.todos_chamados import abrir_todos_chamados
except ImportError:
    from desktop_interface.meus_chamados import abrir_meus_chamados as abrir_todos_chamados

from desktop_interface.menu_lateral import criar_menu_lateral
from desktop_interface.admin.abrir_usuarios import abrir_usuarios
from desktop_interface.meus_chamados import abrir_meus_chamados 
from desktop_interface.admin.relatorios import abrir_relatorios

# --- FUNÇÕES DE LAYOUT E AÇÃO ---
def mostrar_base_conhecimento_placeholder(frame, user):
    for w in frame.winfo_children(): w.destroy()
    ctk.CTkLabel(frame, text="Funcionalidade Base de Conhecimento Indisponível para Admin", font=("Segoe UI", 16, "bold"), text_color="red").pack(pady=50)

def abrir_dashboard_admin(janela_principal, user):

    root = janela_principal.winfo_toplevel()
    root.withdraw()

    janela = ctk.CTkToplevel(root)
    janela.title("Helpdesk IA")
    janela.geometry("1200x720")
    janela.configure(fg_color="#F4F9F8")

    def ao_fechar():
        root.destroy()
    janela.protocol("WM_DELETE_WINDOW", ao_fechar)

    janela.lift()
    janela.focus_force()

    # FRAME PRINCIPAL
    conteudo_frame = ctk.CTkFrame(
        janela, fg_color="#F4F9F8", corner_radius=0
    )
    conteudo_frame.pack(side="right", fill="both", expand=True)

    # ---------------------------------------------------------------------------
    # DASHBOARD PRINCIPAL
    # ---------------------------------------------------------------------------
    def mostrar_dashboard(frame, usuario):
        for w in frame.winfo_children(): 
            w.destroy()

        # ============================= TOPO =============================
        topo = ctk.CTkFrame(frame, fg_color="transparent")
        topo.pack(fill="x", padx=30, pady=(30, 20))

        # Texto de boas-vindas (FIXO)
        info_topo = ctk.CTkFrame(topo, fg_color="transparent")
        info_topo.pack(side="left")
        ctk.CTkLabel(info_topo, text="Seja bem vindo ao sistema Helpdesk IA", font=("Helvetica", 24, "bold"), text_color="#1E293B", anchor="w").pack(anchor="w")
        ctk.CTkLabel(info_topo, text="Painel de Controle • Visão Geral", font=("Helvetica", 14), text_color="#64748B", anchor="w").pack(anchor="w")

        # Botões do topo
        botoes_topo = ctk.CTkFrame(topo, fg_color="transparent")
        botoes_topo.pack(side="right")
        
        # Botão Relatório (Agora chama o módulo real)
        ctk.CTkButton(
            botoes_topo,
            text="Relatórios",
            fg_color="#0284C7", 
            hover_color="#0267A3",
            height=35,
            font=("Helvetica", 13, "bold"),
            corner_radius=8,
            command=lambda: abrir_relatorios(frame, usuario)
        ).pack(side="left", padx=5)

        # ============================= CARDS =============================
        stats = ctk.CTkFrame(frame, fg_color="transparent")
        stats.pack(fill="x", padx=25, pady=(10, 5))
        stats.grid_columnconfigure((0,1,2), weight=1)

        lbl_abertos = criar_card_dashboard_colab(stats, "Abertos (Total)", "#0284C7", 0)
        lbl_andam = criar_card_dashboard_colab(stats, "Em Andamento (Total)", "#EAB308", 1)
        lbl_resolv = criar_card_dashboard_colab(stats, "Resolvidos (Total)", "#16A34A", 2)

        # ============================= TÍTULO DA LISTA =============================
        ctk.CTkLabel(
            frame,
            text="Chamados Recentes",
            font=("Helvetica", 18, "bold"),
            text_color="#334155"
        ).pack(pady=(30, 10))

        # ============================= LISTA (SEM SCROLLBAR) =============================
        lista_frame = ctk.CTkFrame(frame, fg_color="transparent")
        lista_frame.pack(fill="both", expand=True, padx=25, pady=(0, 20))

        placeholder = ctk.CTkLabel(lista_frame, text="Carregando...", text_color="gray")
        placeholder.pack(pady=20)

        # ============================= BOTÃO FINAL =============================
        # Botão fixo na parte inferior
        ctk.CTkButton(
            frame,
            text="Gerenciar Todos Chamados",
            fg_color="#5BA39C",
            hover_color="#4C8E87",
            height=42,
            corner_radius=10,
            font=("Helvetica", 15, "bold"),
            command=lambda: abrir_todos_chamados(frame, usuario)
        ).pack(pady=20)

        # ============================= CARREGAMENTO ASSÍNCRONO =============================
        def carregar_stats_admin():
            if not api_client.AUTH_TOKEN: return

            sucesso, dados = api_client.listar_todos_chamados()

            if sucesso and isinstance(dados, list):
                
                # CÁLCULO DE ESTATÍSTICAS TOTAIS
                abertos_total = sum(1 for c in dados if c.get("status","").lower() == "aberto")
                andamento_total = sum(1 for c in dados if c.get("status","").lower() == "em andamento")
                resolvidos_total = sum(1 for c in dados if c.get("status","").lower() in ["resolvido","fechado"])
                
                # Recentes
                agora = datetime.now()
                limite = agora - timedelta(days=5)
                recentes = []

                for c in dados:
                    try:
                        # O api_client já normalizou para 'data_abertura'
                        dt_str = str(c.get("data_abertura", "") or "")[:10]
                        if dt_str and len(dt_str) == 10:
                            dt = datetime.strptime(dt_str, "%Y-%m-%d")
                            if dt >= limite:
                                recentes.append(c)
                    except: pass

                recentes.sort(key=lambda x: int(x.get("id_chamado") or 0), reverse=True)
                recentes = recentes[:10]

                if frame.winfo_exists():
                    frame.after(0, lambda: atualizar_ui(abertos_total, andamento_total, resolvidos_total, recentes))
            else: 
                if frame.winfo_exists():
                    frame.after(0, lambda: atualizar_ui(0, 0, 0, [])) 

        def criar_cartao_chamado_fallback(parent, chamado, usuario, root_frame):
            status_raw = str(chamado.get("status", "Aberto")).lower()
            
            cor_faixa = "#4A5568"
            if status_raw == "aberto": cor_faixa = "#0284C7"
            elif status_raw in ["resolvido", "fechado"]: cor_faixa = "#16A34A"
            elif status_raw == "em andamento": cor_faixa = "#EAB308"
            
            # Card mais compacto
            card = ctk.CTkFrame(parent, fg_color="white", corner_radius=8, border_width=1, border_color=cor_faixa)
            card.pack(fill="x", pady=4, padx=5)
            
            id_ch = chamado.get("id_chamado") or "?"
            titulo = chamado.get("titulo", "Sem título")
            
            content_frame = ctk.CTkFrame(card, fg_color="transparent")
            content_frame.pack(side="left", fill="both", expand=True, padx=10, pady=5)

            ctk.CTkLabel(content_frame, text=f"#{id_ch}", font=("Helvetica", 13, "bold"), text_color="#64748B", width=35).pack(side="left", padx=(0, 10))
            ctk.CTkLabel(content_frame, text=titulo, font=("Helvetica", 14, "bold"), text_color="#1E293B", anchor="w").pack(side="left", fill="x", expand=True)

            right_frame = ctk.CTkFrame(card, fg_color="transparent")
            right_frame.pack(side="right", padx=10)
            
            ctk.CTkLabel(right_frame, text=status_raw.capitalize(), font=("Helvetica", 11, "bold"), text_color=cor_faixa).pack(side="left", padx=10)
            
            ctk.CTkButton(
                right_frame, text="Detalhes", width=70, height=28, fg_color="#5BA39C", hover_color="#4C8E87", 
                font=("Helvetica", 11, "bold"),
                command=lambda: abrir_ticket_detalhe(id_ch, usuario, root_frame, lambda: mostrar_dashboard(root_frame, usuario))
            ).pack(side="right")

        def atualizar_ui(q_abertos, q_andam, q_resolv, lista):
            if not lbl_abertos.winfo_exists(): return

            lbl_abertos.configure(text=str(q_abertos))
            lbl_andam.configure(text=str(q_andam))
            lbl_resolv.configure(text=str(q_resolv))

            for w in lista_frame.winfo_children(): w.destroy()

            if not lista:
                ctk.CTkLabel(lista_frame, text="Nenhum chamado recente.", text_color="gray").pack(pady=20)
                return

            for item in lista:
                criar_cartao_chamado_fallback(lista_frame, item, usuario, frame)

        threading.Thread(target=carregar_stats_admin, daemon=True).start()

    def criar_card_dashboard_colab(parent, titulo, cor, coluna):
        card = ctk.CTkFrame(parent, fg_color="white", corner_radius=12, border_width=1, border_color="#E2E8F0")
        card.grid(row=0, column=coluna, padx=10, sticky="ew")
        
        faixa_topo = ctk.CTkFrame(card, height=4, fg_color=cor, corner_radius=2)
        faixa_topo.pack(fill="x", side="top")
        
        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(expand=True, fill="both", pady=15)
        
        ctk.CTkLabel(inner, text=titulo, font=("Helvetica", 13, "bold"), text_color="#64748B").pack()
        lbl = ctk.CTkLabel(inner, text="...", font=("Helvetica", 36, "bold"), text_color=cor) 
        lbl.pack(pady=(5, 0))
        return lbl

    # 🟢 CHAMADA FINAL
    criar_menu_lateral(
        janela, user, conteudo_frame, mostrar_dashboard, 
        abrir_meus_chamados, mostrar_base_conhecimento_placeholder, 
        abrir_todos_chamados, abrir_usuarios, abrir_relatorios
    )
    mostrar_dashboard(conteudo_frame, user)