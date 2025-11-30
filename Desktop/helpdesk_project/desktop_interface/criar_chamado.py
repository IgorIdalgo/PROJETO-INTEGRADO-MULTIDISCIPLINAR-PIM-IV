import customtkinter as ctk
from tkinter import messagebox, filedialog
from PIL import Image
import threading
import sys
import os
import time

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from desktop_interface import api_client
except ImportError:
    import api_client

try:
    from desktop_interface.filtro_chamado import validar_pertinencia
except ImportError:

    def validar_pertinencia(titulo, descricao):
        return True, "Filtro indisponível."


# ==============================================================================
# FUNÇÃO DE CARREGAMENTO DE IMAGEM (COMPATÍVEL COM .EXE E VSCODE)
# ==============================================================================
def carregar_imagem_robo_pequena():
    """
    Busca a imagem do robô (32x32) de forma segura para .EXE e Desenvolvimento.
    """
    nome_arquivo = "svgviewer-output.png"

    # Lista de locais onde a imagem pode estar
    locais_possiveis = [
        # 1. Pasta atual do script (Desenvolvimento)
        os.path.join(os.path.dirname(os.path.abspath(__file__)), nome_arquivo),
        # 2. Pasta 'desktop_interface' dentro do .EXE (Produção/PyInstaller)
        # O PyInstaller descompacta arquivos em sys._MEIPASS
        os.path.join(getattr(sys, "_MEIPASS", ""), "desktop_interface", nome_arquivo),
        # 3. Raiz do .EXE (Caso tenha sido adicionado na raiz)
        os.path.join(getattr(sys, "_MEIPASS", ""), nome_arquivo),
        # 4. Pasta pai (Fallback)
        os.path.join(parent_dir, nome_arquivo),
    ]

    for caminho in locais_possiveis:
        if os.path.exists(caminho) and os.path.isfile(caminho):
            try:
                pil_img = Image.open(caminho)
                return ctk.CTkImage(
                    light_image=pil_img, dark_image=pil_img, size=(32, 32)
                )
            except Exception as e:
                print(f"Erro ao ler imagem em {caminho}: {e}")

    # Se não achar nada, retorna None (o código vai usar o emoji 🤖)
    return None


# --- FUNÇÃO PARA LER ARTIGO SEM SAIR DA TELA (POPUP) ---
def ler_artigo_popup(parent, artigo_id):
    artigo = api_client.obter_artigo(artigo_id)
    if not artigo:
        return

    popup = ctk.CTkToplevel(parent)
    popup.title("Leitura Rápida - Base de Conhecimento")
    popup.geometry("600x500")
    popup.grab_set()

    scroll = ctk.CTkScrollableFrame(popup, fg_color="white")
    scroll.pack(fill="both", expand=True, padx=20, pady=20)

    ctk.CTkLabel(
        scroll,
        text=artigo.get("titulo"),
        font=("Helvetica", 20, "bold"),
        text_color="#1E293B",
        wraplength=550,
        justify="left",
    ).pack(anchor="w", pady=(0, 10))

    ctk.CTkLabel(
        scroll,
        text=artigo.get("conteudo"),
        font=("Helvetica", 14),
        text_color="#334155",
        wraplength=550,
        justify="left",
    ).pack(anchor="w")

    ctk.CTkButton(popup, text="Fechar", fg_color="#5BA39C", command=popup.destroy).pack(
        pady=10
    )


def abrir_dashboard_fallback(conteudo_frame, user):
    try:
        janela_top = conteudo_frame.winfo_toplevel()
        role = user.get("role", "colaborador").lower()
        if role in ["admin", "administrador"]:
            from desktop_interface.admin.dashboard_admin import abrir_dashboard_admin

            abrir_dashboard_admin(janela_top, user)
        elif role == "tecnico":
            from desktop_interface.tecnico.dashboard_tecnico import (
                abrir_dashboard_tecnico,
            )

            abrir_dashboard_tecnico(janela_top, user)
        else:
            from desktop_interface.colaborador.dashboard_colaborador import (
                abrir_dashboard_colaborador,
            )

            abrir_dashboard_colaborador(janela_top, user)
    except Exception as e:
        print(f"Erro ao redirecionar: {e}")


def abrir_formulario_chamado(
    conteudo_frame, user, callback_refresh=None, rascunho_salvo=None
):
    for widget in conteudo_frame.winfo_children():
        widget.destroy()
    conteudo_frame.configure(fg_color="#F4F9F8")
    arquivos_selecionados = []
    timer_busca = None

    def voltar_seguro():
        if (
            entry_titulo.get().strip()
            or txt_desc.get("1.0", "end-1c").strip()
            or len(arquivos_selecionados) > 0
        ):
            if not messagebox.askyesno(
                "Descartar?", "Deseja descartar o rascunho e sair?"
            ):
                return
        if callback_refresh:
            callback_refresh()
        else:
            abrir_dashboard_fallback(conteudo_frame, user)

    header_frame = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    header_frame.pack(fill="x", padx=40, pady=(30, 20))
    ctk.CTkLabel(
        header_frame,
        text="Novo Chamado",
        font=("Helvetica", 28, "bold"),
        text_color="#1E293B",
    ).pack(side="left")
    ctk.CTkButton(
        header_frame,
        text="Voltar",
        width=80,
        fg_color="transparent",
        border_width=1,
        border_color="#009E7F",
        text_color="#009E7F",
        command=voltar_seguro,
    ).pack(side="right")

    main_grid = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    main_grid.pack(fill="both", expand=True, padx=40, pady=(0, 40))
    main_grid.grid_columnconfigure(0, weight=3)
    main_grid.grid_columnconfigure(1, weight=2)
    main_grid.grid_rowconfigure(0, weight=1)

    # === ESQUERDA (FORMULÁRIO) ===
    form_card = ctk.CTkFrame(
        main_grid,
        fg_color="white",
        corner_radius=15,
        border_width=1,
        border_color="#E2E8F0",
    )
    form_card.grid(row=0, column=0, sticky="nsew", padx=(0, 20))

    # Frame Normal (Sem Scrollbar)
    form_scroll = ctk.CTkFrame(form_card, fg_color="transparent")
    form_scroll.pack(fill="both", expand=True, padx=20, pady=20)

    ctk.CTkLabel(
        form_scroll,
        text="Título do Problema",
        font=("Helvetica", 14, "bold"),
        text_color="#334155",
    ).pack(anchor="w", pady=(0, 5))
    entry_titulo = ctk.CTkEntry(
        form_scroll,
        height=45,
        placeholder_text="Ex: Impressora não funciona...",
        font=("Helvetica", 14),
        border_color="#CBD5E1",
        fg_color="white",
        text_color="#0F172A",
    )
    entry_titulo.pack(fill="x", pady=(0, 20))

    ctk.CTkLabel(
        form_scroll,
        text="Descrição Detalhada",
        font=("Helvetica", 14, "bold"),
        text_color="#334155",
    ).pack(anchor="w", pady=(0, 5))
    txt_desc = ctk.CTkTextbox(
        form_scroll,
        height=150,
        font=("Helvetica", 14),
        border_color="#CBD5E1",
        fg_color="white",
        text_color="#0F172A",
        border_width=2,
    )
    txt_desc.pack(fill="x", pady=(0, 20))

    row_combos = ctk.CTkFrame(form_scroll, fg_color="transparent")
    row_combos.pack(fill="x", pady=(0, 20))
    row_combos.grid_columnconfigure(0, weight=1)
    row_combos.grid_columnconfigure(1, weight=1)

    ctk.CTkLabel(
        row_combos,
        text="Categoria",
        font=("Helvetica", 14, "bold"),
        text_color="#334155",
    ).grid(row=0, column=0, sticky="w", padx=(0, 10))
    cbo_cat = ctk.CTkComboBox(
        row_combos,
        values=["Hardware", "Software", "Rede", "Outros"],
        height=40,
        border_color="#CBD5E1",
        fg_color="white",
        text_color="#0F172A",
        state="readonly",
    )
    cbo_cat.set("Hardware")
    cbo_cat.grid(row=1, column=0, sticky="ew", padx=(0, 10), pady=(5, 0))

    ctk.CTkLabel(
        row_combos,
        text="Urgência",
        font=("Helvetica", 14, "bold"),
        text_color="#334155",
    ).grid(row=0, column=1, sticky="w", padx=(10, 0))
    cbo_prio = ctk.CTkComboBox(
        row_combos,
        values=["Baixa", "Média", "Alta"],
        height=40,
        border_color="#CBD5E1",
        fg_color="white",
        text_color="#0F172A",
        state="readonly",
    )
    cbo_prio.set("Média")
    cbo_prio.grid(row=1, column=1, sticky="ew", padx=(10, 0), pady=(5, 0))

    # Anexos
    ctk.CTkLabel(
        form_scroll,
        text="Anexos (Imagens PNG/JPG)",
        font=("Helvetica", 14, "bold"),
        text_color="#334155",
    ).pack(anchor="w", pady=(10, 5))
    frame_anexos = ctk.CTkFrame(
        form_scroll,
        fg_color="#F8FAFC",
        border_color="#CBD5E1",
        border_width=1,
        corner_radius=8,
    )
    frame_anexos.pack(fill="x", pady=(0, 20))
    lbl_files_info = ctk.CTkLabel(
        frame_anexos,
        text="Nenhum arquivo selecionado",
        text_color="gray",
        font=("Helvetica", 12),
    )
    lbl_files_info.pack(side="left", padx=15, pady=15)
    btn_limpar_anexos = None

    def atualizar_info_anexos():
        qtd = len(arquivos_selecionados)
        if qtd > 0:
            lbl_files_info.configure(
                text=f"{qtd} imagem(ns) selecionada(s)", text_color="#00755E"
            )
            if btn_limpar_anexos:
                btn_limpar_anexos.pack(side="right", padx=(5, 15), pady=10)
        else:
            lbl_files_info.configure(
                text="Nenhum arquivo selecionado", text_color="gray"
            )
            if btn_limpar_anexos:
                btn_limpar_anexos.pack_forget()

    def selecionar_arquivos():
        caminhos = filedialog.askopenfilenames(
            title="Selecionar Imagens", filetypes=[("Imagens", "*.jpg *.jpeg *.png")]
        )
        if caminhos:
            for p in caminhos:
                if p not in arquivos_selecionados:
                    arquivos_selecionados.append(p)
            atualizar_info_anexos()

    def limpar_anexos():
        arquivos_selecionados.clear()
        atualizar_info_anexos()

    ctk.CTkButton(
        frame_anexos,
        text="📎 Adicionar",
        width=100,
        fg_color="white",
        text_color="#333",
        border_width=1,
        border_color="#CBD5E1",
        hover_color="#EEE",
        command=selecionar_arquivos,
    ).pack(side="right", padx=(5, 15), pady=10)
    btn_limpar_anexos = ctk.CTkButton(
        frame_anexos,
        text="🗑️ Limpar",
        width=80,
        fg_color="#FEE2E2",
        text_color="#991B1B",
        hover_color="#FECACA",
        border_width=0,
        command=limpar_anexos,
    )

    # === DIREITA (PAINEL IA / SUGESTÕES) ===
    ia_card = ctk.CTkFrame(
        main_grid,
        fg_color="white",
        corner_radius=15,
        border_width=1,
        border_color="#E2E8F0",
    )
    ia_card.grid(row=0, column=1, sticky="nsew")

    ia_content = ctk.CTkFrame(ia_card, fg_color="transparent")
    ia_content.pack(fill="both", expand=True, padx=25, pady=25)

    # Header Direita
    header_ia = ctk.CTkFrame(ia_content, fg_color="transparent")
    header_ia.pack(fill="x", pady=(0, 15))

    # --- IMAGEM DO ROBÔ (Usando a função blindada) ---
    img_robo = carregar_imagem_robo_pequena()

    if img_robo:
        ctk.CTkLabel(header_ia, text="", image=img_robo).pack(side="left", padx=(0, 10))
    else:
        ctk.CTkLabel(header_ia, text="🤖", font=("Arial", 28)).pack(
            side="left", padx=(0, 10)
        )

    lbl_titulo_ia = ctk.CTkLabel(
        header_ia,
        text="Solução IA & Ajuda",
        font=("Helvetica", 18, "bold"),
        text_color="#5BA39C",
    )
    lbl_titulo_ia.pack(side="left")

    # Frame Normal (Sem Scrollbar)
    container_dinamico = ctk.CTkFrame(
        ia_content,
        fg_color="#F0FDF4",
        corner_radius=10,
        border_width=1,
        border_color="#BBF7D0",
    )
    container_dinamico.pack(fill="both", expand=True)

    # --- LÓGICA DE SUGESTÃO DA BASE DE CONHECIMENTO ---
    def ao_digitar(event):
        nonlocal timer_busca
        if timer_busca is not None:
            main_grid.after_cancel(timer_busca)

        texto = entry_titulo.get()
        if len(texto) > 3:
            timer_busca = main_grid.after(800, lambda: buscar_sugestoes(texto))
        else:
            limpar_sugestoes()

    def limpar_sugestoes():
        for w in container_dinamico.winfo_children():
            w.destroy()
        ctk.CTkLabel(
            container_dinamico,
            text="Digite o título para ver sugestões...",
            text_color="gray",
        ).pack(pady=20)

    def buscar_sugestoes(termo):
        threading.Thread(target=thread_busca_kb, args=(termo,)).start()

    def thread_busca_kb(termo):
        if not api_client.AUTH_TOKEN:
            return
        sucesso, artigos = api_client.listar_artigos(termo=termo)

        if container_dinamico.winfo_exists():
            container_dinamico.after(0, lambda: exibir_sugestoes(sucesso, artigos))

    def exibir_sugestoes(sucesso, artigos):
        for w in container_dinamico.winfo_children():
            w.destroy()

        if not sucesso or not artigos:
            ctk.CTkLabel(
                container_dinamico,
                text="Preencha os dados e clique em 'Criar Chamado'.\nA IA analisará o problema aqui.",
                font=("Helvetica", 12),
                text_color="gray",
                wraplength=250,
            ).pack(pady=50)
            return

        ctk.CTkLabel(
            container_dinamico,
            text="📚 Artigos Relacionados:",
            font=("Helvetica", 12, "bold"),
            text_color="#00796B",
        ).pack(anchor="w", pady=(5, 10), padx=10)

        for art in artigos[:3]:
            card_sug = ctk.CTkFrame(
                container_dinamico,
                fg_color="white",
                corner_radius=6,
                border_width=1,
                border_color="#E2E8F0",
            )
            card_sug.pack(fill="x", pady=5, padx=5)

            tit = art.get("titulo", "Sem Titulo")
            aid = art.get("id_artigo")

            ctk.CTkLabel(
                card_sug,
                text=tit,
                font=("Helvetica", 12, "bold"),
                text_color="#333",
                wraplength=220,
                justify="left",
            ).pack(anchor="w", padx=10, pady=(10, 5))

            ctk.CTkButton(
                card_sug,
                text="Ler Artigo",
                height=24,
                fg_color="#5BA39C",
                font=("Helvetica", 11),
                command=lambda i=aid: ler_artigo_popup(conteudo_frame, i),
            ).pack(anchor="e", padx=10, pady=(0, 10))

    # Bind no título
    entry_titulo.bind("<KeyRelease>", ao_digitar)

    # --- LÓGICA DE ENVIO (SUBMIT) ---
    btn_enviar = None

    def acao_enviar():
        t = entry_titulo.get().strip()
        d = txt_desc.get("1.0", "end-1c").strip()
        c = cbo_cat.get()
        p = cbo_prio.get()
        if len(t) < 3 or len(d) < 5:
            messagebox.showerror(
                "Atenção", "Preencha o título e uma descrição detalhada."
            )
            return

        for w in container_dinamico.winfo_children():
            w.destroy()
        ctk.CTkLabel(
            container_dinamico,
            text="🔄 Analisando com IA...",
            font=("Helvetica", 14, "bold"),
            text_color="#009E7F",
        ).pack(pady=50)

        btn_enviar.configure(state="disabled", text="Enviando...", fg_color="#64748B")
        threading.Thread(
            target=thread_enviar, args=(t, d, c, p, list(arquivos_selecionados))
        ).start()

    def thread_enviar(t, d, c, p, files):
        pertinente, motivo = api_client.validar_pertinencia(t, d)
        if not pertinente:
            form_scroll.after(0, lambda: processar_rejeicao(motivo))
            return
        try:
            sucesso, resultado = api_client.criar_novo_chamado(t, d, c, p, files)
            form_scroll.after(0, lambda: processar_retorno(sucesso, resultado))
        except Exception as e:
            form_scroll.after(0, lambda: processar_retorno(False, f"Erro interno: {e}"))

    def processar_rejeicao(motivo):
        btn_enviar.configure(state="normal", text="Criar Chamado", fg_color="#009E7F")
        messagebox.showwarning("Chamado Rejeitado", f"Motivo: {motivo}")
        for w in container_dinamico.winfo_children():
            w.destroy()
        ctk.CTkLabel(
            container_dinamico,
            text=f"❌ Rejeitado: {motivo}",
            text_color="#EF4444",
            wraplength=250,
        ).pack(pady=20)

    def processar_retorno(sucesso, resultado):
        btn_enviar.configure(state="normal", text="Criar Chamado", fg_color="#009E7F")
        if sucesso:
            sugestao = ""
            if "IA:" in resultado:
                try:
                    sugestao = resultado.split("IA:", 1)[1].strip()
                except:
                    sugestao = resultado
            if not sugestao:
                sugestao = resultado

            for w in container_dinamico.winfo_children():
                w.destroy()
            ctk.CTkLabel(
                container_dinamico,
                text="✅ Chamado Criado!",
                font=("Helvetica", 14, "bold"),
                text_color="#16A34A",
            ).pack(pady=(20, 10))

            lbl_ia = ctk.CTkLabel(
                container_dinamico,
                text=sugestao,
                font=("Helvetica", 12),
                text_color="#15803D",
                wraplength=260,
                justify="left",
            )
            lbl_ia.pack(padx=10, pady=10)

            messagebox.showinfo("Sucesso", "Chamado criado com sucesso!")
            entry_titulo.delete(0, "end")
            txt_desc.delete("1.0", "end")
            cbo_cat.set("Hardware")
            cbo_prio.set("Média")
            limpar_anexos()

            if callback_refresh:
                callback_refresh()
        else:
            messagebox.showerror("Erro", resultado)
            for w in container_dinamico.winfo_children():
                w.destroy()
            ctk.CTkLabel(
                container_dinamico, text=f"Erro: {resultado}", text_color="red"
            ).pack(pady=20)

    btn_enviar = ctk.CTkButton(
        form_scroll,
        text="Criar Chamado",
        height=50,
        fg_color="#009E7F",
        hover_color="#00856A",
        font=("Helvetica", 16, "bold"),
        corner_radius=8,
        command=acao_enviar,
    )
    btn_enviar.pack(fill="x", pady=(10, 20))

    # Inicializa painel direito limpo
    limpar_sugestoes()
