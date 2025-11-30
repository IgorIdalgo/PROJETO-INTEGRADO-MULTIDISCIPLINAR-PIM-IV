import customtkinter as ctk
from tkinter import messagebox
import sys
import os

# --- Configuração de Path ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path: sys.path.append(parent_dir)

try:
    from desktop_interface import api_client
except ImportError:
    import api_client

# --- Função Principal ---
def exibir_artigo_func(artigo_id, conteudo_frame, user, callback_voltar):
    """Exibe o conteúdo detalhado de um artigo buscando da API."""
    
    # Busca os dados reais na API
    artigo = api_client.obter_artigo(artigo_id)
    
    if not artigo:
        messagebox.showerror("Erro", f"Artigo #{artigo_id} não encontrado na base.")
        callback_voltar()
        return

    # Limpa o frame atual para desenhar o artigo
    for widget in conteudo_frame.winfo_children():
        widget.destroy()

    # Mapeia Categoria ID -> Nome
    cat_id = artigo.get("id_categoria")
    mapa_reverso = getattr(api_client, 'MAP_ID_PARA_CATEGORIA', {})
    nome_cat = mapa_reverso.get(cat_id, "Geral").capitalize()

    # === Header de Navegação ===
    header = ctk.CTkFrame(conteudo_frame, fg_color="transparent")
    header.pack(fill="x", padx=20, pady=(20, 10))

    # Botão de Categoria (apenas visual/indicador)
    ctk.CTkButton(
        header, text=nome_cat, fg_color="white", text_color="#00796B",
        border_width=1, border_color="#00796B", hover=False,
        width=80, height=24, font=("Helvetica", 12)
    ).pack(side="left")

    # Botão Voltar
    ctk.CTkButton(
        header, text="← Voltar", width=80, height=30, fg_color="#5BA39C",
        hover_color="#489C8C", command=callback_voltar
    ).pack(side="right")

    # === Conteúdo do Artigo (Scrollável) ===
    scroll_frame = ctk.CTkScrollableFrame(conteudo_frame, fg_color="transparent")
    scroll_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))

    # Título do Artigo
    ctk.CTkLabel(
        scroll_frame, text=artigo.get("titulo", "Sem Título"),
        font=("Helvetica", 24, "bold"), text_color="#111827",
        wraplength=800, justify="left"
    ).pack(anchor="w", pady=(10, 5))

    # Meta dados (Data de Criação e ID)
    data_criacao = artigo.get("datacriacao", "")
    if data_criacao and len(data_criacao) >= 10:
        data_fmt = data_criacao[:10] # Pega apenas a data YYYY-MM-DD
    else:
        data_fmt = "Data N/A"

    meta_text = f"Artigo ID: #{artigo.get('id_artigo')}   •   📅 Criado em: {data_fmt}"
    ctk.CTkLabel(
        scroll_frame, text=meta_text, font=("Helvetica", 12), text_color="#6B7280"
    ).pack(anchor="w", pady=(0, 20))

    # Separador visual
    ctk.CTkFrame(scroll_frame, height=2, fg_color="#E5E7EB").pack(fill="x", pady=(0, 20))

    # Corpo do Artigo (Texto)
    conteudo_texto = artigo.get("conteudo", "Conteúdo indisponível.")
    ctk.CTkLabel(
        scroll_frame, text=conteudo_texto, font=("Helvetica", 14), text_color="#374151",
        justify="left", anchor="w", wraplength=850
    ).pack(anchor="w", fill="x")

    # Tags (Se existirem no banco)
    tags_str = artigo.get("palavraschave", "")
    if tags_str:
        tags_frame = ctk.CTkFrame(scroll_frame, fg_color="transparent")
        tags_frame.pack(fill="x", pady=(30, 10))
        
        ctk.CTkLabel(tags_frame, text="Tags:", font=("Helvetica", 12, "bold"), text_color="#999").pack(side="left", padx=(0, 10))
        
        # Divide as tags por vírgula e cria labels para cada uma
        for tag in tags_str.split(","):
            tag = tag.strip()
            if tag:
                ctk.CTkLabel(
                    tags_frame, text=tag, fg_color="#E0F2F1", text_color="#00796B",
                    corner_radius=8, padx=10, pady=2, font=("Helvetica", 11)
                ).pack(side="left", padx=2)

    # === Rodapé ===
    footer = ctk.CTkFrame(scroll_frame, fg_color="transparent")
    footer.pack(fill="x", pady=(20, 10))

    # Botão "Útil" (Feedback visual simples)
    ctk.CTkButton(
        footer, text="👍 Este artigo foi útil", fg_color="transparent",
        text_color="#333", hover_color="#F3F4F6", border_width=1, border_color="#DDD", height=28,
        command=lambda: messagebox.showinfo("Obrigado", "Obrigado pelo seu feedback!")
    ).pack(side="right")