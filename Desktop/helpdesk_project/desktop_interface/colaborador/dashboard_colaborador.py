import customtkinter as ctk
import threading
import sys
import os
from datetime import datetime, timedelta

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

# Importações das telas
from desktop_interface.criar_chamado import abrir_formulario_chamado
from desktop_interface.meus_chamados import abrir_meus_chamados
from desktop_interface.ticket_detalhe import abrir_ticket_detalhe
from desktop_interface.menu_lateral import criar_menu_lateral

# --- FUNÇÃO AUXILIAR DE FILTRAGEM ---
def is_today(data_abertura_str):
    if not data_abertura_str: return False
    try:
        data_chamado = datetime.strptime(str(data_abertura_str)[:10], "%Y-%m-%d").date()
        return data_chamado == datetime.now().date()
    except: return False

def mostrar_base_conhecimento(frame, user):
    try:
        from desktop_interface.base_de_conhecimentos import mostrar_base_conhecimento as abrir_base_conhecimento
        abrir_base_conhecimento(frame, user)
    except ImportError:
        for w in frame.winfo_children(): w.destroy()
        ctk.CTkLabel(frame, text="Base de Conhecimento (Em breve)", font=("Helvetica", 16)).pack(pady=50)


def abrir_dashboard_colaborador(janela_principal, user):
    janela_principal.withdraw()

    janela = ctk.CTkToplevel(janela_principal)
    janela.title("HelpDesk IA")
    janela.geometry("1200x720")
    janela.configure(fg_color="#F4F9F8")
    
    def ao_fechar():
        janela_principal.destroy()
    janela.protocol("WM_DELETE_WINDOW", ao_fechar)
    janela.lift()
    janela.focus_force()

    conteudo_frame = ctk.CTkFrame(janela, fg_color="#F4F9F8")
    conteudo_frame.pack(side="right", fill="both", expand=True)

    # --- FUNÇÃO QUE MONTA O DASHBOARD ---
    def mostrar_dashboard(frame, usuario_logado):
        # Limpa widgets anteriores
        for w in frame.winfo_children(): w.destroy()

        # Topo
        topo = ctk.CTkFrame(frame, fg_color="transparent")
        topo.pack(fill="x", padx=30, pady=(30, 20))
        
        info_topo = ctk.CTkFrame(topo, fg_color="transparent")
        info_topo.pack(side="left")
        
        # TEXTO FIXO
        ctk.CTkLabel(info_topo, text="Seja bem vindo ao sistema Helpdesk IA", font=("Helvetica", 24, "bold"), text_color="#1E293B", anchor="w").pack(anchor="w")
        ctk.CTkLabel(info_topo, text="Bem-vindo ao seu painel.", font=("Helvetica", 14), text_color="#64748B", anchor="w").pack(anchor="w")

        botoes_topo = ctk.CTkFrame(topo, fg_color="transparent")
        botoes_topo.pack(side="right")

        ctk.CTkButton(
            botoes_topo, text="+ Novo Chamado", fg_color="#009E7F", font=("Helvetica", 13, "bold"),
            height=35, corner_radius=8,
            command=lambda: abrir_formulario_chamado(frame, usuario_logado, lambda: mostrar_dashboard(frame, usuario_logado))
        ).pack(side="left", padx=5)

        ctk.CTkButton(
            botoes_topo, text="Base de Conhecimento", fg_color="#5BA39C", font=("Helvetica", 13, "bold"),
            height=35, corner_radius=8,
            command=lambda: mostrar_base_conhecimento(frame, usuario_logado)
        ).pack(side="left", padx=5)

        # Stats
        stats_frame = ctk.CTkFrame(frame, fg_color="transparent")
        stats_frame.pack(fill="x", padx=25, pady=(10, 5)) 
        stats_frame.grid_columnconfigure((0, 1, 2), weight=1)

        def criar_card_dashboard(parent, titulo, cor, coluna):
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

        lbl_abertos = criar_card_dashboard(stats_frame, "Abertos (Total)", "#0284C7", 0)
        lbl_andam = criar_card_dashboard(stats_frame, "Em Andamento (Total)", "#EAB308", 1)
        lbl_resolv = criar_card_dashboard(stats_frame, "Resolvidos (Total)", "#16A34A", 2)

        # Lista de Recentes (Título)
        ctk.CTkLabel(frame, text="Chamados Recentes", font=("Helvetica", 18, "bold"), text_color="#334155").pack(pady=(30, 10))
        
        # Container de Recentes (Frame normal, sem scroll)
        recentes_container = ctk.CTkFrame(frame, fg_color="transparent") 
        recentes_container.pack(fill="both", expand=True, padx=25, pady=(0, 20))
        
        lbl_loading = ctk.CTkLabel(recentes_container, text="Carregando lista completa...", text_color="gray")
        lbl_loading.pack(pady=20)
        
        # Botão Rodapé
        ctk.CTkButton(
            frame, text="Ver Todos Meus Chamados", fg_color="#5BA39C", height=42, corner_radius=10,
            font=("Helvetica", 15, "bold"),
            command=lambda: abrir_meus_chamados(frame, usuario_logado)
        ).pack(anchor="n", pady=25) 

        # --- THREAD PARA CARREGAR DADOS REAIS ---
        def carregar_dados_thread():
            if not api_client.AUTH_TOKEN: return

            # [SEGURANÇA] Se a janela fechou antes de começar, para aqui
            if not frame.winfo_exists(): return

            sucesso, dados = api_client.listar_meus_chamados()
            
            # [SEGURANÇA] Verifica de novo se a janela existe antes de agendar atualização
            if not frame.winfo_exists(): return
            
            if sucesso and isinstance(dados, list):
                
                # Estatísticas
                c_abertos = sum(1 for c in dados if str(c.get("status", "")).lower() == "aberto")
                c_andam = sum(1 for c in dados if str(c.get("status", "")).lower() == "em andamento")
                c_resolv = sum(1 for c in dados if str(c.get("status", "")).lower() in ["resolvido", "fechado"])
                
                # Ordenação: Recentes primeiro
                lista_ordenada = sorted(
                    dados, 
                    key=lambda x: int(x.get("id_chamado") or x.get("id") or 0), 
                    reverse=True
                )
                
                lista_exibicao = lista_ordenada[:10]

                # Agenda atualização na thread principal
                frame.after(0, lambda: atualizar_ui(c_abertos, c_andam, c_resolv, lista_exibicao))
            else:
                print(f"Erro ao carregar: {dados}")
                frame.after(0, lambda: mostrar_erro_ui("Erro ao carregar dados."))

        def mostrar_erro_ui(msg):
            # [SEGURANÇA] Verifica se os labels ainda existem
            if not lbl_abertos.winfo_exists(): return

            lbl_abertos.configure(text="-")
            lbl_andam.configure(text="-")
            lbl_resolv.configure(text="-")
            for w in recentes_container.winfo_children(): w.destroy()
            ctk.CTkLabel(recentes_container, text=msg, text_color="red").pack(pady=20)

        def atualizar_ui(abertos, andam, resolv, lista_rec):
            # [SEGURANÇA CRÍTICA] Se o label não existe mais (tela mudou), para tudo
            if not lbl_abertos.winfo_exists(): return

            lbl_abertos.configure(text=str(abertos))
            lbl_andam.configure(text=str(andam))
            lbl_resolv.configure(text=str(resolv))

            if lbl_loading.winfo_exists(): lbl_loading.destroy()

            for w in recentes_container.winfo_children(): w.destroy()

            if not lista_rec:
                ctk.CTkLabel(recentes_container, text="Nenhum chamado encontrado.", text_color="gray").pack(pady=20)
                return

            for c in lista_rec:
                criar_card_chamado_compacto(recentes_container, c)

        # 🟢 FUNÇÃO DE CARD COMPACTO (Linha Única)
        def criar_card_chamado_compacto(parent, c):
            try:
                # [SEGURANÇA] Verifica se o pai ainda existe
                if not parent.winfo_exists(): return

                c_id = c.get("id_chamado") or c.get("id")
                titulo = c.get("titulo", "Sem Título")
                status = str(c.get("status", "Aberto")).lower()
                
                if status == "em análise": status_safe = "Em Andamento"
                else: status_safe = status.capitalize()
                
                # Cores
                cor_faixa = "#94A3B8"
                if "aberto" in status: cor_faixa = "#0284C7"
                elif "andamento" in status: cor_faixa = "#EAB308"
                elif "resolvido" in status or "fechado" in status: cor_faixa = "#16A34A"
                
                # --- LAYOUT COMPACTO ---
                card = ctk.CTkFrame(parent, fg_color="white", corner_radius=8, border_width=1, border_color=cor_faixa)
                card.pack(fill="x", padx=5, pady=4) 
                
                # Lado Esquerdo: ID + Título
                content_frame = ctk.CTkFrame(card, fg_color="transparent")
                content_frame.pack(side="left", padx=10, pady=5, fill="x", expand=True)
                
                # ID
                ctk.CTkLabel(content_frame, text=f"#{c_id}", font=("Helvetica", 13, "bold"), text_color="#64748B", width=35).pack(side="left", padx=(0, 10))
                # Título
                ctk.CTkLabel(content_frame, text=titulo, font=("Helvetica", 14, "bold"), text_color="#1E293B", anchor="w").pack(side="left", fill="x", expand=True)
                
                # Lado Direito: Status + Botão
                right_frame = ctk.CTkFrame(card, fg_color="transparent")
                right_frame.pack(side="right", padx=10)

                # Status Label
                ctk.CTkLabel(right_frame, text=status_safe, font=("Helvetica", 11, "bold"), text_color=cor_faixa).pack(side="left", padx=10)

                # Botão Pequeno
                ctk.CTkButton(
                    right_frame, text="Detalhes", width=70, height=28, fg_color="#5BA39C", hover_color="#4C8E87",
                    font=("Helvetica", 11, "bold"),
                    command=lambda: abrir_ticket_detalhe(c_id, usuario_logado, frame, lambda: mostrar_dashboard(frame, usuario_logado))
                ).pack(side="right")
                
            except Exception as e: 
                print(f"Erro ao criar card: {e}")

        threading.Thread(target=carregar_dados_thread, daemon=True).start()

    # Passando 'user' corretamente
    criar_menu_lateral(
        janela, user, conteudo_frame,
        mostrar_dashboard,
        abrir_meus_chamados,
        mostrar_base_conhecimento,
        abrir_gerenciar_chamados=None,
        abrir_usuarios=None
    )

    mostrar_dashboard(conteudo_frame, user)