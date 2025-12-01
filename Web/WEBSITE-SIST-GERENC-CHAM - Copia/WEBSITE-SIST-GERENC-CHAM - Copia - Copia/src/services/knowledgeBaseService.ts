/**
 * Serviço para buscar artigos da Base de Conhecimento relacionados ao problema
 */

import { apiGet } from '@/lib/api';
import { articulosMockKnowledgeBase } from '@/data/knowledgeBaseMock';

export interface ArtigoKnowledgeBase {
  id: string;
  titulo: string;
  resumo: string;
  descricao?: string;
  conteudo?: string;
  palavrasChave?: string[];
  tags?: string[];
  categoria?: string;
  dataAtualizacao?: string;
}

/**
 * Busca artigos na base de conhecimento que correspondem às keywords
 */
export async function buscarArticosRelatados(
  keywords: string[],
  tiposProblema?: string[]
): Promise<ArtigoKnowledgeBase[]> {
  try {
    // Busca todos os artigos
    let response = await apiGet('/api/artigos', { silent: true });

    // Se não há resposta do backend, usa dados mock
    if (!response || !Array.isArray(response) || response.length === 0) {
      response = articulosMockKnowledgeBase;
    }

    if (!response || !Array.isArray(response)) {
      return [];
    }

    // Filtra artigos que contêm as keywords
    const artigos = response
      .map((artigo: any) => {
        let relevancia = 0;

        // Obtém texto completo para busca
        const textoCompleto = (
          (artigo.titulo || '') +
          ' ' +
          (artigo.descricao || '') +
          ' ' +
          (artigo.conteudo || '') +
          ' ' +
          (artigo.resumo || '')
        ).toLowerCase();

        // Conta quantas keywords foram encontradas
        keywords.forEach(keyword => {
          const ocorrencias = (textoCompleto.match(new RegExp(keyword.toLowerCase(), 'g')) || [])
            .length;
          relevancia += ocorrencias;
        });

        // Se filtrou por tipo de problema, verifica tags/categoria
        if (tiposProblema && tiposProblema.length > 0) {
          const tags = (artigo.tags || []).map((t: string) => t.toLowerCase());
          const categoria = (artigo.categoria || '').toLowerCase();

          const temTipoProblema = tiposProblema.some(
            tipo =>
              tags.some((tag: string) => tag.includes(tipo)) ||
              categoria.includes(tipo)
          );

          if (temTipoProblema) {
            relevancia += 5; // Boost de relevância
          }
        }

        return {
          artigo,
          relevancia
        };
      })
      .filter(item => item.relevancia > 0)
      .sort((a, b) => b.relevancia - a.relevancia)
      .slice(0, 3) // Retorna no máximo 3 artigos
      .map(item => ({
        id: item.artigo.id || '',
        titulo: item.artigo.titulo || '',
        resumo: item.artigo.descricao || item.artigo.resumo || '',
        conteudo: item.artigo.conteudo || '',
        categoria: item.artigo.categoria || '',
        tags: item.artigo.tags || [],
        palavrasChave: item.artigo.palavrasChave || []
      }));

    return artigos;
  } catch (error) {
    console.error('Erro ao buscar artigos relacionados:', error);
    // Usa dados mock como fallback em caso de erro
    return processarArticosMock(keywords, tiposProblema);
  }
}

/**
 * Processa dados mock quando backend falha
 */
function processarArticosMock(keywords: string[], tiposProblema?: string[]) {
  return articulosMockKnowledgeBase
    .map(artigo => {
      let relevancia = 0;
      const textoCompleto = (
        (artigo.titulo || '') +
        ' ' +
        (artigo.descricao || '') +
        ' ' +
        (artigo.conteudo || '') +
        ' ' +
        (artigo.resumo || '')
      ).toLowerCase();

      keywords.forEach(keyword => {
        const ocorrencias = (textoCompleto.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        relevancia += ocorrencias;
      });

      if (tiposProblema && tiposProblema.length > 0) {
        const tags = (artigo.tags || []).map((t: string) => t.toLowerCase());
        const categoria = (artigo.categoria || '').toLowerCase();
        const temTipoProblema = tiposProblema.some(
          tipo =>
            tags.some((tag: string) => tag.includes(tipo)) ||
            categoria.includes(tipo)
        );
        if (temTipoProblema) {
          relevancia += 5;
        }
      }

      return { artigo, relevancia };
    })
    .filter(item => item.relevancia > 0)
    .sort((a, b) => b.relevancia - a.relevancia)
    .slice(0, 3)
    .map(item => ({
      id: item.artigo.id,
      titulo: item.artigo.titulo,
      resumo: item.artigo.descricao || item.artigo.resumo,
      conteudo: item.artigo.conteudo,
      categoria: item.artigo.categoria,
      tags: item.artigo.tags,
      palavrasChave: item.artigo.palavrasChave
    }));
}

/**
 * Busca artigos por termo de busca simples
 */
export async function buscarArtigosPorTermo(termo: string): Promise<ArtigoKnowledgeBase[]> {
  try {
    if (!termo || termo.length < 3) return [];

    let response = await apiGet('/api/artigos', { silent: true });

    // Usa mock como fallback
    if (!response || !Array.isArray(response) || response.length === 0) {
      response = articulosMockKnowledgeBase;
    }

    if (!response || !Array.isArray(response)) {
      return [];
    }

    const termoLower = termo.toLowerCase();

    return response
      .filter((artigo: any) => {
        const textoCompleto = (
          (artigo.titulo || '') +
          ' ' +
          (artigo.descricao || '') +
          ' ' +
          (artigo.resumo || '')
        ).toLowerCase();

        return textoCompleto.includes(termoLower);
      })
      .slice(0, 5)
      .map((artigo: any) => ({
        id: artigo.id || '',
        titulo: artigo.titulo || '',
        resumo: artigo.descricao || artigo.resumo || '',
        conteudo: artigo.conteudo || '',
        categoria: artigo.categoria || '',
        tags: artigo.tags || [],
        palavrasChave: artigo.palavrasChave || []
      }));
  } catch (error) {
    console.error('Erro ao buscar artigos por termo:', error);
    return [];
  }
}

export default {
  buscarArticosRelatados,
  buscarArtigosPorTermo
};
