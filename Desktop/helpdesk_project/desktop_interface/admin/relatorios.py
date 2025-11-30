import customtkinter as ctk
from tkinter import messagebox, filedialog
import threading
import sys
import os
from datetime import datetime

# --- IMPORTAÇÃO MATPLOTLIB (GRÁFICOS) ---
try:
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False

# --- TENTA IMPORTAR A BIBLIOTECA DE PDF ---
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as ImageRL
    from reportlab.lib.enums import TA_CENTER
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

# --- CONFIGURAÇÃO DE PATH ---
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path: sys.path.append(parent_dir)

try:
    from desktop_interface import api_client
except ImportError:
    import api_client

# --- CORES ---
COR_PRIMARIA = "#009E7F"
COR_FUNDO = "#F4F9F8"
COR_CARD = "#FFFFFF"
COR_TEXTO = "#1E293B"

# --- HELPER FUNCTIONS (Globais) ---
def criar_kpi_card(parent, titulo, icone, cor_destaque, col_idx):
    card = ctk.CTkFrame(parent, fg_color="white", corner_radius=12, border_width=1, border_color="#E2E8F0")
    card.grid(row=0, column=col_idx, sticky="nsew", padx=10)
    
    ctk.CTkLabel(card, text=icone, font=("Arial", 24)).pack(pady=(15, 0))
    ctk.CTkLabel(card, text=titulo, font=("Helvetica", 12, "bold"), text_color="#64748B").pack(pady=(5, 0))
    
    val_lbl = ctk.CTkLabel(card, text="...", font=("Helvetica", 28, "bold"), text_color=cor_destaque)
    val_lbl.pack(pady=(0, 15))
    return val_lbl

def formatar_data(data_iso):
    if not data_iso: return "-"
    try: return datetime.fromisoformat(data_iso.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except: return str(data_iso)[:10]

# --- FUNÇÃO PRINCIPAL ---
def abrir_relatorios(frame, user):
    for w in frame.winfo_children(): w.destroy()
    
    # Verifica dependência
    if not HAS_MATPLOTLIB:
        ctk.CTkLabel(frame, text="⚠ Instale a biblioteca gráfica: pip install matplotlib", text_color="red").pack(pady=20)
        return

    scroll_relatorio = ctk.CTkScrollableFrame(frame, fg_color=COR_FUNDO)
    scroll_relatorio.pack(fill="both", expand=True, padx=0, pady=0)
    
    # Container Interno com padding
    main_container = ctk.CTkFrame(scroll_relatorio, fg_color="transparent")
    main_container.pack(fill="both", expand=True, padx=30, pady=30)

    # --- HEADER ---
    header = ctk.CTkFrame(main_container, fg_color="transparent")
    header.pack(fill="x", pady=(0, 25))
    
    ctk.CTkLabel(header, text="Dashboard Gerencial", font=("Helvetica", 28, "bold"), text_color=COR_TEXTO).pack(side="left")
    
    # Botão Exportar no Topo
    btn_exportar = ctk.CTkButton(
        header, text="⬇ Exportar PDF", fg_color="#DC2626", hover_color="#B91C1C", 
        font=("Helvetica", 14, "bold"), width=140, height=35, state="disabled"
    )
    btn_exportar.pack(side="right")

    lbl_periodo = ctk.CTkLabel(main_container, text="Carregando dados...", font=("Helvetica", 14), text_color="#64748B")
    lbl_periodo.pack(anchor="w", pady=(0, 20))

    # --- KPI CARDS (Indicadores) ---
    kpi_frame = ctk.CTkFrame(main_container, fg_color="transparent")
    kpi_frame.pack(fill="x", pady=(0, 30))
    kpi_frame.grid_columnconfigure((0, 1, 2), weight=1, uniform="kpi")

    lbl_total = criar_kpi_card(kpi_frame, "Total Chamados", "📦", "#3B82F6", 0)
    lbl_ativos = criar_kpi_card(kpi_frame, "Em Aberto", "🔥", "#EAB308", 1)
    lbl_resolvidos = criar_kpi_card(kpi_frame, "Resolvidos", "✅", "#10B981", 2)

    # --- ÁREA DO GRÁFICO E TABELA ---
    analytics_frame = ctk.CTkFrame(main_container, fg_color="transparent")
    analytics_frame.pack(fill="both", expand=True)
    analytics_frame.grid_columnconfigure(0, weight=3) # Gráfico maior
    analytics_frame.grid_columnconfigure(1, weight=1) # Tabela menor

    # Container Gráfico
    chart_container = ctk.CTkFrame(analytics_frame, fg_color="white", corner_radius=15)
    chart_container.grid(row=0, column=0, sticky="nsew", padx=(0, 20))
    
    ctk.CTkLabel(chart_container, text="Volume por Categoria", font=("Helvetica", 16, "bold"), text_color="#334155").pack(pady=(15, 5))
    
    chart_area = ctk.CTkFrame(chart_container, fg_color="white")
    chart_area.pack(fill="both", expand=True, padx=10, pady=10)

    # Container Tabela
    table_container = ctk.CTkFrame(analytics_frame, fg_color="white", corner_radius=15)
    table_container.grid(row=0, column=1, sticky="nsew")

    ctk.CTkLabel(table_container, text="Detalhamento", font=("Helvetica", 16, "bold"), text_color="#334155").pack(pady=(15, 10))
    
    # --- FUNÇÕES INTERNAS (CLOSURES) ---

    def processar_categorias(lista_crua):
        agrupado = {}
        mapa_cats = getattr(api_client, 'MAP_ID_PARA_CATEGORIA', {})
        
        if not lista_crua: return []

        for item in lista_crua:
            cat_id = item.get("categoriaId") or item.get("CategoriaId") or item.get("id")
            qtd = item.get("quantidade") or item.get("Quantidade") or 0
            
            nome_cat = mapa_cats.get(cat_id, f"Outros").lower()
            if "impressora" in nome_cat: nome_cat = "hardware"

            nome_formatado = nome_cat.capitalize()
            if nome_formatado in agrupado: agrupado[nome_formatado] += qtd
            else: agrupado[nome_formatado] = qtd
        
        lista_final = [{"nome": k, "quantidade": v} for k, v in agrupado.items()]
        return sorted(lista_final, key=lambda x: x['quantidade'], reverse=False)

    def renderizar_grafico(dados_cats):
        for widget in chart_area.winfo_children(): widget.destroy()

        if not dados_cats:
            ctk.CTkLabel(chart_area, text="Sem dados para exibir.").pack(pady=50)
            return

        nomes = [d['nome'] for d in dados_cats]
        qtds = [d['quantidade'] for d in dados_cats]
        
        fig, ax = plt.subplots(figsize=(6, 4), dpi=100)
        fig.patch.set_facecolor('white')
        ax.set_facecolor('white')

        bars = ax.barh(nomes, qtds, color='#009E7F', height=0.6)

        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_visible(False)
        ax.spines['bottom'].set_visible(False)
        ax.tick_params(axis='x', which='both', bottom=False, labelbottom=False)
        ax.tick_params(axis='y', length=0, labelsize=11)

        for bar in bars:
            width = bar.get_width()
            ax.text(width + 0.5, bar.get_y() + bar.get_height()/2, 
                    f'{int(width)}', ha='left', va='center', fontweight='bold', color='#333')

        plt.tight_layout()

        canvas = FigureCanvasTkAgg(fig, master=chart_area)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

    def renderizar_tabela_lateral(dados_cats):
        for widget in table_container.winfo_children():
            if isinstance(widget, ctk.CTkFrame): widget.destroy()

        scroll_tab = ctk.CTkScrollableFrame(table_container, fg_color="transparent")
        scroll_tab.pack(fill="both", expand=True, padx=5, pady=5)

        dados_inv = sorted(dados_cats, key=lambda x: x['quantidade'], reverse=True)

        for item in dados_inv:
            row = ctk.CTkFrame(scroll_tab, fg_color="#F8FAFC", corner_radius=8)
            row.pack(fill="x", pady=4)
            ctk.CTkLabel(row, text=item['nome'], font=("Helvetica", 12)).pack(side="left", padx=10, pady=8)
            ctk.CTkLabel(row, text=str(item['quantidade']), font=("Helvetica", 12, "bold"), text_color="#009E7F").pack(side="right", padx=10)

    def exportar_pdf_bonito(dados, lista_cats_processada):
        if not HAS_REPORTLAB:
            messagebox.showerror("Erro", "Instale: pip install reportlab")
            return

        filename = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF", "*.pdf")], title="Salvar Relatório", initialfile=f"Relatorio_{datetime.now().strftime('%Y%m%d')}.pdf")
        if not filename: return

        try:
            doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
            elementos = []
            styles = getSampleStyleSheet()
            
            estilo_titulo = ParagraphStyle('TituloCustom', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=24, textColor=colors.HexColor(COR_PRIMARIA), spaceAfter=20, alignment=TA_CENTER)
            
            elementos.append(Paragraph("Relatório Executivo de TI", estilo_titulo))
            elementos.append(Spacer(1, 1*cm))

            metricas = dados.get("metricas") or dados.get("Metricas") or {}
            val_total = str(metricas.get("totalChamados") or metricas.get("TotalChamados") or 0)
            val_abertos = str(metricas.get("totalAbertos") or metricas.get("TotalAbertos") or 0)
            val_resolvidos = str(metricas.get("totalResolvidos") or metricas.get("TotalResolvidos") or 0)

            dados_kpi = [
                ["Total Chamados", "Em Aberto", "Resolvidos"],
                [val_total, val_abertos, val_resolvidos]
            ]
            tabela = Table(dados_kpi, colWidths=[5*cm]*3)
            tabela.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,1), (-1,-1), 14),
                ('BOX', (0,0), (-1,-1), 1, colors.black),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.grey),
            ]))
            elementos.append(tabela)
            elementos.append(Spacer(1, 2*cm))

            elementos.append(Paragraph("Detalhamento por Categoria", styles['Heading2']))
            
            dados_cat = [["Categoria", "Quantidade"]]
            for item in sorted(lista_cats_processada, key=lambda x: x['quantidade'], reverse=True):
                dados_cat.append([item['nome'], str(item['quantidade'])])

            t_cat = Table(dados_cat, colWidths=[10*cm, 4*cm])
            t_cat.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor(COR_PRIMARIA)),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.whitesmoke, colors.white]),
            ]))
            elementos.append(t_cat)

            doc.build(elementos)
            messagebox.showinfo("Sucesso", "Relatório PDF gerado com sucesso!")
            
        except Exception as e: messagebox.showerror("Erro", f"Falha: {e}")

    def atualizar_interface(sucesso, dados):
        if not sucesso:
            lbl_periodo.configure(text="Erro ao conectar com servidor.")
            return

        periodo = dados.get("periodo") or dados.get("Periodo") or {}
        metricas = dados.get("metricas") or dados.get("Metricas") or {}
        cats_raw = dados.get("porCategoria") or dados.get("PorCategoria") or []

        lbl_periodo.configure(text=f"📅 Dados referentes a: {formatar_data(periodo.get('inicio') or periodo.get('Inicio'))} até {formatar_data(periodo.get('fim') or periodo.get('Fim'))}")

        val_total = metricas.get("totalChamados") or metricas.get("TotalChamados") or 0
        val_abertos = metricas.get("totalAbertos") or metricas.get("TotalAbertos") or 0
        val_resolvidos = metricas.get("totalResolvidos") or metricas.get("TotalResolvidos") or 0

        lbl_total.configure(text=str(val_total))
        lbl_ativos.configure(text=str(val_abertos))
        lbl_resolvidos.configure(text=str(val_resolvidos))

        lista_cats_processada = processar_categorias(cats_raw)
        
        renderizar_grafico(lista_cats_processada)
        renderizar_tabela_lateral(lista_cats_processada)

        btn_exportar.configure(state="normal", command=lambda: exportar_pdf_bonito(dados, lista_cats_processada))

    def carregar_dados_thread():
        if not hasattr(api_client, 'obter_relatorio_gerencial'): return
        sucesso, dados = api_client.obter_relatorio_gerencial()
        if scroll_relatorio.winfo_exists():
            scroll_relatorio.after(0, lambda: atualizar_interface(sucesso, dados))

    threading.Thread(target=carregar_dados_thread, daemon=True).start()