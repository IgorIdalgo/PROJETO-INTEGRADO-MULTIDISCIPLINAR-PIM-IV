import requests
import logging
import base64
import os
import json 
from typing import Optional, Dict, Any, List
import sys 
from requests.exceptions import RequestException 

# ----------------------------------------------------------------------
# CONFIGURAÇÕES
# ----------------------------------------------------------------------
API_BASE_URL = "https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net"
AUTH_TOKEN: Optional[str] = None
CURRENT_USER: Optional[Dict[str, Any]] = None

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Mapeamentos
MAP_CATEGORIA_PARA_ID = {"hardware": 1, "software": 2, "rede": 3, "outros": 5}
MAP_ID_PARA_CATEGORIA = {1: "hardware", 2: "software", 3: "rede", 4: "hardware", 5: "outros"}
MAP_URGENCIA_API = {"baixa": "Baixa", "media": "Média", "média": "Média", "alta": "Alta"} 
MAP_ROLE_ID = {1: "admin", 2: "tecnico", 3: "colaborador"}

def _get_headers(auth_required: bool = True) -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if auth_required and AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers

def _normalizar_dados(dados: Any) -> Any:
    if isinstance(dados, list):
        return [_normalizar_dados(item) for item in dados]
    
    if isinstance(dados, dict):
        dados_lower = {k.lower(): v for k, v in dados.items()}
        
        # Chamados
        if "id_chamado" not in dados: dados["id_chamado"] = dados_lower.get("idchamado") or dados.get("id")
        if "id_usuario" not in dados: dados["id_usuario"] = dados_lower.get("idusuario")
        if "titulo" not in dados: dados["titulo"] = dados_lower.get("titulo")
        if "descricao" not in dados: dados["descricao"] = dados_lower.get("descricao")
        if "status" not in dados: dados["status"] = dados_lower.get("status")
        if "prioridade" not in dados: dados["prioridade"] = dados_lower.get("prioridade")
        if "data_abertura" not in dados: dados["data_abertura"] = dados_lower.get("dataabertura")
        if "data_fechamento" not in dados: dados["data_fechamento"] = dados_lower.get("datafechamento")
        if "id_categoria" not in dados: dados["id_categoria"] = dados_lower.get("idcategoria")
        
        # --- NORMALIZAÇÃO DE ANEXOS ---
        lista_anexos_raw = (
            dados.get("ChamadoAnexos") or dados.get("chamadoAnexos")
            or dados.get("Anexos") or dados.get("anexos") 
            or dados_lower.get("anexos") or []
        )
        
        anexos_normalizados = []
        if isinstance(lista_anexos_raw, list):
            for anexo in lista_anexos_raw:
                nome = (anexo.get("Nome") or anexo.get("nome") or anexo.get("NomeArquivo") or "anexo.dat")
                url = (anexo.get("Url") or anexo.get("url") or anexo.get("UrlArquivo"))
                dados_b64 = (anexo.get("Dados") or anexo.get("dados") or anexo.get("DadosBase64"))
                
                if url or dados_b64:
                    anexos_normalizados.append({"nome": nome, "url": url, "dados": dados_b64})
        
        dados["anexos"] = anexos_normalizados

        # Outros Campos
        if "id_artigo" not in dados: dados["id_artigo"] = dados_lower.get("idartigo") or dados.get("IdArtigo") or dados.get("id")
        if "conteudo" not in dados: dados["conteudo"] = dados_lower.get("conteudo")
        if "palavraschave" not in dados: dados["palavraschave"] = dados_lower.get("palavraschave") or ""
        if "datacriacao" not in dados: dados["datacriacao"] = dados_lower.get("datacriacao")
        if "resolucaoia_sugerida" not in dados: dados["resolucaoia_sugerida"] = (dados.get("ResolucaoIA_Sugerida") or dados.get("resolucaoIA_Sugerida") or dados.get("resolucaoia_sugerida") or dados_lower.get("resolucaoia_sugerida") or "")
        if "comentario" not in dados: dados["comentario"] = dados.get("Comentario") or dados_lower.get("comentario")
        if "data_hora" not in dados: dados["data_hora"] = dados.get("DataHora") or dados_lower.get("datahora")
        if "id_interacao" not in dados: dados["id_interacao"] = dados.get("IdInteracao") or dados_lower.get("idinteracao")
        if "nomecompleto" not in dados: dados["nomecompleto"] = dados.get("NomeCompleto") or dados_lower.get("nomecompleto")
        if "id_perfil" not in dados: dados["id_perfil"] = dados.get("IdPerfil") or dados_lower.get("idperfil")
        if "ativo" not in dados: dados["ativo"] = dados.get("Ativo") if "Ativo" in dados else dados.get("ativo")
        if "metricas" not in dados and "Metricas" in dados: dados["metricas"] = dados["Metricas"]
        if "periodo" not in dados and "Periodo" in dados: dados["periodo"] = dados["Periodo"]
        if "porCategoria" not in dados and "PorCategoria" in dados: dados["porCategoria"] = dados["PorCategoria"]

        return dados
    return dados

# --- LOGIN ---
def realizar_login(email: str, senha: str) -> tuple[bool, str, Optional[Dict]]:
    global AUTH_TOKEN, CURRENT_USER
    url_login = f"{API_BASE_URL}/api/auth/login"
    try:
        response = requests.post(url_login, json={"email": email, "password": senha}, headers=_get_headers(False), timeout=20)
        try: data = response.json()
        except: return False, f"Erro Fatal {response.status_code}: API não retornou JSON.", None
        if response.status_code != 200: return False, f"Falha no login: {data.get('detail')}", None
        token = data.get("token")
        user_obj = data.get("user", {})
        if not token: return False, "Token não recebido.", None
        AUTH_TOKEN = token
        url_me = f"{API_BASE_URL}/api/auth/me"
        response_me = requests.get(url_me, headers=_get_headers(True), timeout=20)
        if response_me.status_code != 200:
            AUTH_TOKEN = None 
            return False, f"Erro ao buscar perfil: {response_me.status_code}", None
        full_profile = response_me.json()
        if "email" not in full_profile or not full_profile["email"]: full_profile["email"] = user_obj.get("email") or email
        role_id = full_profile.get("idPerfil") or full_profile.get("IdPerfil") or full_profile.get("role") or 3
        role_str = MAP_ROLE_ID.get(role_id, "colaborador")
        full_profile["role"] = role_str
        full_profile["role_id"] = role_id
        CURRENT_USER = full_profile
        return True, "Login realizado com sucesso!", CURRENT_USER
    except Exception as e: return False, f"Erro interno: {e}", None

# --- CHAMADOS ---
def validar_pertinencia(titulo: str, descricao: str) -> tuple[bool, str]:
    try:
        from desktop_interface.filtro_chamado import validar_pertinencia as validar
        return validar(titulo, descricao)
    except: return True, "Filtro indisponível."

def listar_meus_chamados():
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.get(f"{API_BASE_URL}/api/chamados/meus", headers=_get_headers(), timeout=20)
        if resp.status_code == 200: return True, _normalizar_dados(resp.json())
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, str(e)

def listar_todos_chamados():
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.get(f"{API_BASE_URL}/api/chamados/todos", headers=_get_headers(), timeout=20)
        if resp.status_code == 200: return True, _normalizar_dados(resp.json())
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, str(e)

def obter_chamado_por_id(chamado_id):
    if not AUTH_TOKEN: return None
    
    candidato_detalhe = None

    try:
        print(f"--- DEBUG: Tentando buscar ID {chamado_id} direto na API ---")
        resp = requests.get(f"{API_BASE_URL}/api/chamados/{chamado_id}", headers=_get_headers(), timeout=10)
        if resp.status_code == 200:
            candidato_detalhe = _normalizar_dados(resp.json())
            if candidato_detalhe.get("anexos"):
                print("--- DEBUG: Anexos encontrados na rota direta! ---")
                return candidato_detalhe
            else:
                print("--- DEBUG: Rota direta veio SEM anexos. Tentando fallback... ---")
    except Exception as e:
        print(f"--- DEBUG: Erro na rota direta: {e}")

    print("--- DEBUG: Ativando busca na lista (Fallback) ---")
    user_role = CURRENT_USER.get("role") if CURRENT_USER else "colaborador"
    
    if user_role in ["admin", "tecnico"]: 
        sucesso, lista = listar_todos_chamados()
    else: 
        sucesso, lista = listar_meus_chamados()

    if sucesso and lista:
        for c in lista:
            if str(c.get("id_chamado")) == str(chamado_id):
                if c.get("anexos") or not candidato_detalhe:
                    print(f"--- DEBUG: Chamado encontrado na lista! Anexos: {len(c.get('anexos', []))} ---")
                    return c
    
    return candidato_detalhe

def criar_novo_chamado(titulo, descricao, categoria, urgencia, caminhos_anexos=None):
    if not AUTH_TOKEN: return False, "Não autenticado."
    pertinente, motivo = validar_pertinencia(titulo, descricao)
    if not pertinente: return False, f"Chamado rejeitado pela IA Local: {motivo}"
    
    cat_id = MAP_CATEGORIA_PARA_ID.get(categoria.lower(), 5)
    urgencia_api = MAP_URGENCIA_API.get(urgencia.lower(), "Média")

    lista_anexos_payload = []
    if caminhos_anexos:
        for caminho in caminhos_anexos:
            try:
                if os.path.exists(caminho):
                    with open(caminho, "rb") as image_file:
                        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                        lista_anexos_payload.append({"Nome": os.path.basename(caminho), "Dados": encoded_string})
            except Exception as e: logging.error(f"Erro anexo: {e}")

    payload = {"titulo": titulo, "descricao": descricao, "id_categoria": cat_id, "urgencia": urgencia_api, "anexos": lista_anexos_payload}

    try:
        response = requests.post(f"{API_BASE_URL}/api/chamados", json=payload, headers=_get_headers(), timeout=60)
        if response.status_code == 201:
            dados = _normalizar_dados(response.json())
            ia = dados.get("resolucaoia_sugerida")
            if not ia: ia = "Sugestão não retornada pela API."
            return True, f"Chamado Criado!\nID: {dados.get('id_chamado')}\n\nIA: {ia}"
        return False, f"Erro API {response.status_code}: {response.text}"
    except Exception as e: return False, f"Erro: {e}"

def atualizar_status_chamado(chamado_id, novo_status):
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.put(f"{API_BASE_URL}/api/chamados/{chamado_id}", json={"status": novo_status}, headers=_get_headers(), timeout=10)
        if resp.status_code == 200: return True, "Status atualizado!"
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, f"Erro: {e}"

def atribuir_chamado(chamado_id: int, tecnico_id: int) -> tuple[bool, str]:
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.put(f"{API_BASE_URL}/api/chamados/{chamado_id}/atribuir", json={"idTecnico": tecnico_id}, headers=_get_headers(), timeout=15)
        if resp.status_code == 200: return True, "Chamado atribuído."
        return False, f"Falha ({resp.status_code})"
    except Exception as e: return False, f"Erro: {e}"

def listar_comentarios(chamado_id):
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.get(f"{API_BASE_URL}/api/chamados/{chamado_id}/comentarios", headers=_get_headers(), timeout=15)
        if resp.status_code == 200: return True, _normalizar_dados(resp.json())
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, f"Erro: {e}"

def enviar_comentario(chamado_id, texto):
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.post(f"{API_BASE_URL}/api/chamados/{chamado_id}/comentarios", json={"comentario": texto}, headers=_get_headers(), timeout=15)
        # CORRIGIDO: mudado de response.json() para resp.json()
        if resp.status_code == 201: return True, _normalizar_dados(resp.json())
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, f"Erro: {e}"

def listar_usuarios() -> tuple[bool, str | List[Dict]]:
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.get(f"{API_BASE_URL}/api/usuarios", headers=_get_headers(), timeout=20)
        if resp.status_code == 200: return True, _normalizar_dados(resp.json())
        if resp.status_code == 403: return False, "Acesso negado."
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, str(e)

def atualizar_usuario(user_id: str, nome: str, id_perfil: int, ativo: bool) -> tuple[bool, str]:
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.put(f"{API_BASE_URL}/api/usuarios/{user_id}", json={"nome_completo": nome, "id_perfil": id_perfil, "ativo": ativo}, headers=_get_headers(), timeout=15)
        if resp.status_code == 200: return True, "Atualizado!"
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, f"Erro: {e}"

def inativar_usuario(user_id: str) -> tuple[bool, str]:
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.delete(f"{API_BASE_URL}/api/usuarios/{user_id}", headers=_get_headers(), timeout=15)
        if resp.status_code == 200: return True, "Inativado!"
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, f"Erro: {e}"

def obter_relatorio_gerencial(data_inicio=None, data_fim=None) -> tuple[bool, Dict]:
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.get(f"{API_BASE_URL}/api/relatorios/chamados", headers=_get_headers(), params={"dataInicio": data_inicio, "dataFim": data_fim}, timeout=20)
        if resp.status_code == 200: return True, _normalizar_dados(resp.json())
        return False, f"Erro: {resp.status_code}"
    except Exception as e: return False, f"Erro: {e}"

def listar_artigos(termo=None, categoria_id=None):
    if not AUTH_TOKEN: return False, "Não autenticado."
    try:
        resp = requests.get(f"{API_BASE_URL}/api/artigos", headers=_get_headers(), params={"termo": termo, "categoria": categoria_id}, timeout=15)
        if resp.status_code == 200: return True, _normalizar_dados(resp.json())
        return False, f"Erro {resp.status_code}"
    except Exception as e: return False, f"Erro: {e}"

def obter_artigo(artigo_id):
    if not AUTH_TOKEN: return None
    try:
        resp = requests.get(f"{API_BASE_URL}/api/artigos/{artigo_id}", headers=_get_headers(), timeout=15)
        if resp.status_code == 200: return _normalizar_dados(resp.json())
        return None
    except: return None

def health_check():
    try: return requests.get(f"{API_BASE_URL}/", timeout=5).status_code == 200
    except: return False