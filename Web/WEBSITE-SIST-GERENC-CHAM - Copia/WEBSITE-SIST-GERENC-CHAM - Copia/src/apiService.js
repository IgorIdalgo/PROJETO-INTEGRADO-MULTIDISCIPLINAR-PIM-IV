/*
 * ======================================================
 * SERVIÇO DA API (O "LINK" COM O BACKEND C#)
 *
 * Este ficheiro lê o URL do .env e exporta as funções
 * que o seu site JavaScript irá usar.
 * ======================================================
 */

// 1. Lê o URL da sua API C# na Azure a partir do ficheiro .env
const AZURE_API_URL = import.meta.env.VITE_AZURE_API_URL;

if (!AZURE_API_URL) {
    console.error("ERRO: VITE_AZURE_API_URL não está definido no ficheiro .env");
}

/**
 * 1. LOGIN
 * Faz o login através da *sua* API C#, não do Supabase.
 * A sua API C# é que falará com o Supabase.
 */
export async function loginComApi(email, password) {
    // Chamamos o endpoint /api/auth/login que criámos na API C#
    const response = await fetch(`${AZURE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const erroMsg = await response.text();
        throw new Error(erroMsg || 'Email ou senha inválidos.');
    }

    const data = await response.json(); // Espera uma resposta como { token: "eyJ..." }
    
    // Salva o Token JWT no armazenamento local do navegador
    if (data.token) {
        localStorage.setItem('jwt_token', data.token);
    } else {
        throw new Error('A API não retornou um token.');
    }
}

/**
 * 2. CRIAR CHAMADO
 * Chama o endpoint /api/chamados (que já existe) usando o token.
 */
export async function criarChamadoComApi(titulo, descricao, idCategoria, urgencia) {
    // Pega o token que foi salvo no login
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        throw new Error('Utilizador não autenticado. Faça login primeiro.');
    }

    const chamadoDto = {
        titulo,
        descricao,
        id_categoria: idCategoria,
        urgencia,
    };

    const response = await fetch(`${AZURE_API_URL}/api/chamados`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Envia o Token JWT para o [Authorize] da sua API C#
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(chamadoDto),
    });

    if (!response.ok) {
        const erroMsg = await response.text();
        throw new Error(`Erro ao criar chamado: ${erroMsg}`);
    }

    return await response.json(); // Retorna o chamado criado (com os dados da IA)
}/*
 * ======================================================
 * SERVIÇO DA API (O "LINK" COM O BACKEND C#)
 *
 * Este ficheiro lê o URL do .env e exporta as funções
 * que o seu site JavaScript irá usar.
 * ======================================================
 */

// 1. Lê o URL da sua API C# na Azure a partir do ficheiro .env
const AZURE_API_URL = import.meta.env.VITE_AZURE_API_URL;

if (!AZURE_API_URL) {
    console.error("ERRO: VITE_AZURE_API_URL não está definido no ficheiro .env");
}

/**
 * 1. LOGIN
 * Faz o login através da *sua* API C#, não do Supabase.
 * A sua API C# é que falará com o Supabase.
 */
export async function loginComApi(email, password) {
    // Chamamos o endpoint /api/auth/login que criámos na API C#
    const response = await fetch(`${AZURE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const erroMsg = await response.text();
        throw new Error(erroMsg || 'Email ou senha inválidos.');
    }

    const data = await response.json(); // Espera uma resposta como { token: "eyJ..." }
    
    // Salva o Token JWT no armazenamento local do navegador
    if (data.token) {
        localStorage.setItem('jwt_token', data.token);
    } else {
        throw new Error('A API não retornou um token.');
    }
}

/**
 * 2. CRIAR CHAMADO
 * Chama o endpoint /api/chamados (que já existe) usando o token.
 */
export async function criarChamadoComApi(titulo, descricao, idCategoria, urgencia) {
    // Pega o token que foi salvo no login
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        throw new Error('Utilizador não autenticado. Faça login primeiro.');
    }

    const chamadoDto = {
        titulo,
        descricao,
        id_categoria: idCategoria,
        urgencia,
    };

    const response = await fetch(`${AZURE_API_URL}/api/chamados`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Envia o Token JWT para o [Authorize] da sua API C#
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(chamadoDto),
    });

    if (!response.ok) {
        const erroMsg = await response.text();
        throw new Error(`Erro ao criar chamado: ${erroMsg}`);
    }

    return await response.json(); // Retorna o chamado criado (com os dados da IA)
}