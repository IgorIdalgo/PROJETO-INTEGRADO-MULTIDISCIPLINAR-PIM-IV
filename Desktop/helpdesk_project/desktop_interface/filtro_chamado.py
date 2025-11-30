import sys
import os

# --- LÓGICA DE VALIDAÇÃO LOCAL ---

def validar_pertinencia(titulo: str, descricao: str) -> tuple[bool, str]:
    """
    Verifica se o chamado é pertinente (TI, Infra, RH) usando uma lista de palavras-chave locais.
    
    Retorna:
    (True, "") se for pertinente.
    (False, motivo) se for irrelevante.
    """
    
    # 🔴 TERMOS IRRELEVANTES (Assuntos não relacionados ao escopo do suporte)
    TERMOS_IRRELEVANTES = [
        "marmita", "caixinha", "natal", "aniversário", "pizza", "café", 
        "emprestado", "pedi para", "presente", "brinde", "comida",
        "parabéns", "folga", "festa", "viagem"
    ]
    
    # Termos de baixo valor que podem ser encaminhados ao RH/Outros departamentos.
    TERMOS_REDIRECIONAMENTO = [
        "vale-transporte", "salário", "férias", "atestado", "holerite"
    ]
    
    # Combina e normaliza o texto para busca
    texto_completo = (titulo + " " + descricao).lower()
    
    # 1. Checa por termos completamente irrelevantes (Rejeição imediata)
    for termo in TERMOS_IRRELEVANTES:
        if termo in texto_completo:
            return False, f"O conteúdo ('{termo}') sugere um assunto pessoal ou não relacionado a suporte técnico (TI) ou estrutural."

    # 2. Chamados de RH (Ainda pertinentes, mas a validação de IA não os rejeitará, apenas os sinalizará)
    for termo in TERMOS_REDIRECIONAMENTO:
        if termo in texto_completo:
            # Não rejeitamos, mas a IA do backend pode ser mais precisa.
            pass 

    # Se passar pelo filtro local, consideramos pertinente para envio.
    return True, ""