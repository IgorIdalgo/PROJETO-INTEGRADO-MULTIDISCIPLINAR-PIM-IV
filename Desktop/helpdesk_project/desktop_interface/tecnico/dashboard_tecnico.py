import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime, timedelta
import threading
import sys
import os

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path: sys.path.append(parent_dir)

# --- IMPORT API CLIENT ---
try:
    from desktop_interface import api_client
except ImportError:
    import api_client

# ======= Telas do sistema =======
from desktop_interface.criar_chamado import abrir_formulario_chamado
from desktop_interface.ticket_detalhe import abrir_ticket_detalhe
from desktop_interface.todos_chamados import abrir_todos_chamados
from desktop_interface.menu_lateral import criar_menu_lateral

# Importa a função da Base de Conhecimento
try:
    from desktop_interface.base_de_conhecimentos import mostrar_base_conhecimento as abrir_base_conhecimento
except ImportError:
    def abrir_base_conhecimento(frame, user):
        for w in frame.winfo_children(): w.destroy()
        ctk.CTkLabel(frame, text="Base de Conhecimento (Em breve)", font=("Segoe UI", 16)).pack(pady=50)

# 🟢 FUNÇÃO DE CONTAGEM SIMPLIFICADA
def processar_chamados_para_tecnico(todos_chamados):
    """Calcula estatísticas gerais do sistema."""
    
    status_resolvidos = ["resolvido", "fechado"]
    
    total_abertos = 0
    total_em_andamento = 0
    total_resolvidos = 0
    
    chamados_ativos_para_listagem = []

    for c in todos_chamados: 
        status = str(c.get("status", "aberto")).lower()
        if status == "em análise": status = "em andamento"

        # Contagem por Status
        if status == "aberto":
            total_abertos += 1
        elif status == "em andamento":
            total_em_andamento += 1
        elif status in status_resolvidos:
             total_resolvidos += 1

        # Lista para exibir (Tudo que não está fechado)
        if status not in status_resolvidos:
            chamados_ativos_para_listagem.append(c)

    # Ordena do mais recente (#Maior) para o mais antigo
    chamados_ativos_para_listagem.sort(key=lambda x: int(x.get("id_chamado") or x.get("id") or 0), reverse=True)

    # Limita a 10 chamados recentes
    chamados_ativos_para_listagem = chamados_ativos_para_listagem[:10]

    return total_abertos, total_em_andamento, total_resolvidos, chamados_ativos_para_listagem


# 🟢 DEFINIÇÃO PRINCIPAL
def abrir_dashboard_tecnico(janela_principal, user):
    
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

    conteudo_frame = ctk.CTkFrame(janela, fg_color="white")
    conteudo_frame.pack(side="right", fill="both", expand=True)

    def mostrar_dashboard(frame, user):
        for w in frame.winfo_children():
            w.destroy()
            
        lbl_abertos_val = None
        lbl_andamento_val = None
        lbl_resolvidos_val = None

        # --- TOPO ---
        topo_frame = ctk.CTkFrame(frame, fg_color="transparent")
        topo_frame.pack(fill="x", padx=20, pady=(20, 10))
        topo_frame.grid_columnconfigure(0, weight=1)
        topo_frame.grid_columnconfigure(1, weight=0)

        # TEXTO FIXO
        ctk.CTkLabel(topo_frame, text="Seja bem vindo ao sistema Helpdesk IA", font=("Helvetica", 24, "bold"), text_color="#1E293B", justify="left").grid(row=0, column=0, sticky="w")
        ctk.CTkLabel(topo_frame, text="Visão Geral do Suporte", font=("Helvetica", 14), text_color="#64748B", anchor="w").grid(row=1, column=0, sticky="w")

        botoes_topo_frame = ctk.CTkFrame(topo_frame, fg_color="transparent")
        botoes_topo_frame.grid(row=0, column=1, sticky="e", rowspan=2)

        ctk.CTkButton(
            botoes_topo_frame, text="Buscar na Base de Conhecimento", fg_color="#5BA39C", height=35, font=("Helvetica", 13, "bold"),
            command=lambda: abrir_base_conhecimento(frame, user)
        ).pack(side="left", padx=5)

        # --- MAIN ---
        main = ctk.CTkFrame(frame, fg_color="#F4F9F8")
        main.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(0, weight=0)
        main.grid_rowconfigure(1, weight=1)

        # --- CARDS ---
        stats = ctk.CTkFrame(main, fg_color="white", corner_radius=12, border_width=1, border_color="#DDD")
        stats.grid(row=0, column=0, sticky="ew", pady=10)
        stats.grid_columnconfigure((0, 1, 2), weight=1)

        def criar_card_estatistica(parent, titulo, cor, coluna):
            card = ctk.CTkFrame(parent, fg_color="white", corner_radius=12, border_width=1, border_color="#E2E8F0")
            card.grid(row=0, column=coluna, padx=10, sticky="ew")
            faixa_topo = ctk.CTkFrame(card, height=4, fg_color=cor, corner_radius=2)
            faixa_topo.pack(fill="x", side="top")
            inner = ctk.CTkFrame(card, fg_color="transparent")
            inner.pack(expand=True, fill="both", pady=15)
            ctk.CTkLabel(inner, text=titulo, font=("Helvetica", 13, "bold"), text_color="#64748B").pack()
            valor = ctk.CTkLabel(inner, text="...", font=("Helvetica", 36, "bold"), text_color=cor)
            valor.pack(pady=(5, 0))
            return valor

        # TÍTULOS DOS CARDS
        lbl_abertos_val = criar_card_estatistica(stats, "Abertos (Total)", cor="#0284C7", coluna=0)
        lbl_andamento_val = criar_card_estatistica(stats, "Em Andamento (Sistema)", cor="#EAB308", coluna=1)
        lbl_resolvidos_val = criar_card_estatistica(stats, "Resolvidos (Total)", cor="#16A34A", coluna=2)

        # --- LISTA RECENTES ---
        recentes = ctk.CTkFrame(main, fg_color="white", corner_radius=12, border_width=1, border_color="#DDD")
        recentes.grid(row=1, column=0, sticky="nsew", pady=(10, 0))

        ctk.CTkLabel(recentes, text="Chamados Ativos no Sistema", font=("Helvetica", 18, "bold"), text_color="#333").pack(pady=10)
        
        recentes_container = ctk.CTkFrame(recentes, fg_color="white")
        recentes_container.pack(fill="both", expand=True, padx=10, pady=10)
        
        lbl_placeholder = ctk.CTkLabel(recentes_container, text="Carregando dados...", text_color="gray")
        lbl_placeholder.pack(pady=20)

        barra_inferior = ctk.CTkFrame(recentes, fg_color="white")
        barra_inferior.pack(fill="x", padx=10, pady=(0, 10))

        ctk.CTkButton(
            barra_inferior, text="Gerenciar Todos Chamados", fg_color="#5BA39C",
            command=lambda: abrir_todos_chamados(frame, user)
        ).pack(side="left", padx=5)

        # --- LÓGICA DE CARREGAMENTO ---
        def carregar_dados_tecnico():
            if not api_client.AUTH_TOKEN: 
                frame.after(0, lambda: exibir_erro("Não autenticado."))
                return

            sucesso, dados = api_client.listar_todos_chamados()
            
            if sucesso and isinstance(dados, list):
                abertos, andamento, resolvidos, lista_ativos = processar_chamados_para_tecnico(dados)
                frame.after(0, lambda: atualizar_ui(abertos, andamento, resolvidos, lista_ativos))
            else:
                frame.after(0, lambda: exibir_erro(f"Erro ao carregar: {dados}"))

        def exibir_erro(mensagem):
            if lbl_placeholder.winfo_exists(): lbl_placeholder.destroy()
            ctk.CTkLabel(recentes_container, text=mensagem, text_color="red").pack(pady=20)
            lbl_abertos_val.configure(text="-")
            lbl_andamento_val.configure(text="-")
            lbl_resolvidos_val.configure(text="-")

        def criar_card_chamado_simples(parent, chamado):
            ch_id = chamado.get("id_chamado") or chamado.get("id")
            titulo = chamado.get("titulo", "Sem título")
            status_raw = str(chamado.get("status", "aberto")).lower()
            
            cor_faixa = "#4A5568"
            if status_raw == "aberto": cor_faixa = "#0284C7"
            elif status_raw in ["resolvido", "fechado"]: cor_faixa = "#16A34A"
            elif status_raw == "em andamento": cor_faixa = "#EAB308"
            
            # Card Compacto (Linha Única)
            card = ctk.CTkFrame(parent, fg_color="white", corner_radius=8, border_width=1, border_color=cor_faixa)
            card.pack(fill="x", pady=4, padx=5)
            
            content_frame = ctk.CTkFrame(card, fg_color="transparent")
            content_frame.pack(side="left", fill="both", expand=True, padx=10, pady=5)

            ctk.CTkLabel(content_frame, text=f"#{ch_id}", font=("Helvetica", 13, "bold"), text_color="#64748B", width=35).pack(side="left", padx=(5, 10))
            ctk.CTkLabel(content_frame, text=titulo, font=("Helvetica", 14, "bold"), text_color="#1E293B", anchor="w").pack(side="left", fill="x", expand=True)

            right_frame = ctk.CTkFrame(card, fg_color="transparent")
            right_frame.pack(side="right", padx=15)
            
            # Status
            ctk.CTkLabel(right_frame, text=status_raw.capitalize(), font=("Helvetica", 11, "bold"), text_color=cor_faixa).pack(side="left", padx=15)
            
            # Botão Detalhes (passando 'frame' corrigido)
            ctk.CTkButton(right_frame, text="Detalhes", width=70, height=28, fg_color="#5BA39C", hover_color="#4C8E87", font=("Helvetica", 11, "bold"),
                          command=lambda: abrir_ticket_detalhe(ch_id, user, frame, lambda: mostrar_dashboard(frame, user))).pack(side="right")

        def atualizar_ui(abertos, andamento, resolvidos, lista_ativos):
            if not lbl_abertos_val.winfo_exists(): return

            lbl_abertos_val.configure(text=str(abertos))
            lbl_andamento_val.configure(text=str(andamento))
            lbl_resolvidos_val.configure(text=str(resolvidos))

            if lbl_placeholder.winfo_exists(): lbl_placeholder.destroy()
            for w in recentes_container.winfo_children(): w.destroy()

            if not lista_ativos:
                ctk.CTkLabel(recentes_container, text="Nenhum chamado ativo no sistema.", text_color="gray").pack(pady=20)
            else:
                for c in lista_ativos:
                    criar_card_chamado_simples(recentes_container, c)
            
        threading.Thread(target=carregar_dados_tecnico, daemon=True).start()

    criar_menu_lateral(
        janela, user, conteudo_frame, abrir_dashboard=mostrar_dashboard,
        abrir_meus_chamados=None, abrir_base_conhecimento=abrir_base_conhecimento, 
        abrir_gerenciar_chamados=abrir_todos_chamados, abrir_usuarios=None, abrir_relatorios=None
    )

    mostrar_dashboard(conteudo_frame, user)