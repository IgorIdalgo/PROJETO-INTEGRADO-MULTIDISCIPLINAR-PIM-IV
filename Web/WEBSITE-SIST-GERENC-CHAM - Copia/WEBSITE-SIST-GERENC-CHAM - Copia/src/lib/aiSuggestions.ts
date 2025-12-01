/**
 * Sistema de Sugestões de IA Local
 * Analisa o texto do usuário e fornece sugestões baseadas em keywords
 */

export interface AISuggestion {
  id: string;
  titulo: string;
  descricao: string;
  resumo: string;
  palavrasChave: string[];
  passos: string[];
  confianca: number; // 0 a 1
  tipoProblema: 'hardware' | 'software' | 'rede' | 'impressora' | 'outro';
}

export interface KeywordMatch {
  keyword: string;
  frequencia: number;
  tipoProblema: string;
}

// Base de conhecimento local com sugestões de IA
const baseSugestoesIA: AISuggestion[] = [
  {
    id: '1',
    titulo: 'Computador Não Liga',
    descricao: 'O computador não liga ou não inicia o sistema operacional',
    resumo: 'Verifique a conexão de energia e reinicie o equipamento',
    palavrasChave: ['não liga', 'não inicia', 'travado', 'não funciona', 'preto', 'tela preta', 'sem sinal'],
    passos: [
      'Verifique se o cabo de energia está conectado corretamente na tomada e no computador',
      'Aguarde 30 segundos e tente novamente',
      'Se tiver um no-break, tente conectar diretamente na tomada',
      'Se ainda não funcionar, tente um outro cabo de energia se tiver disponível',
      'Se nada funcionar, chame suporte técnico'
    ],
    confianca: 0.95,
    tipoProblema: 'hardware'
  },
  {
    id: '2',
    titulo: 'Problema com Wi-Fi',
    descricao: 'Dificuldade em conectar à rede Wi-Fi ou internet lenta',
    resumo: 'Tente reiniciar o roteador e o equipamento',
    palavrasChave: ['wifi', 'internet', 'conexão', 'rede', 'lento', 'cai', 'desconecta', 'sem internet', 'sinal fraco'],
    passos: [
      'Reinicie o roteador (desligue por 30 segundos)',
      'Reinicie seu computador ou notebook',
      'Verifique se está digitando a senha corretamente',
      'Tente conectar em um 5GHz se disponível',
      'Se o problema persistir, verifique outras páginas para confirmar se é a internet ou apenas um site',
      'Se nada funcionar, entre em contato com TI'
    ],
    confianca: 0.9,
    tipoProblema: 'rede'
  },
  {
    id: '3',
    titulo: 'Impressora Não Funciona',
    descricao: 'Impressora offline, não imprime ou sem papel',
    resumo: 'Verifique conexão, papel e drivers da impressora',
    palavrasChave: ['impressora', 'não imprime', 'offline', 'papel', 'toner', 'imprimir', 'erro impressão'],
    passos: [
      'Verifique se há papel na impressora',
      'Verifique se há toner/tinta disponível',
      'Desligue a impressora por 30 segundos e ligue novamente',
      'Verifique se está conectada na rede ou via USB',
      'Tente reimprimir o documento',
      'Se persistir, tente reinstalar os drivers da impressora',
      'Contate o suporte se nada funcionar'
    ],
    confianca: 0.92,
    tipoProblema: 'impressora'
  },
  {
    id: '4',
    titulo: 'Software Travado ou Lento',
    descricao: 'Aplicação respondendo lentamente ou congelada',
    resumo: 'Feche a aplicação e reabra, ou reinicie o computador',
    palavrasChave: ['lento', 'travado', 'congelado', 'não responde', 'lag', 'aplicação', 'programa', 'demora'],
    passos: [
      'Aguarde alguns segundos - às vezes é apenas uma operação lenta',
      'Feche a aplicação problemática',
      'Reabra a aplicação',
      'Se continuar lento, tente reiniciar o computador',
      'Verifique se há atualizações pendentes da aplicação',
      'Se nada funcionar, contate TI com o nome da aplicação'
    ],
    confianca: 0.88,
    tipoProblema: 'software'
  },
  {
    id: '5',
    titulo: 'Teclado ou Mouse Não Funciona',
    descricao: 'Periféricos não respondem aos comandos',
    resumo: 'Reconecte o dispositivo ou troque as baterias',
    palavrasChave: ['teclado', 'mouse', 'não funciona', 'periférico', 'não responde', 'digitação', 'cursor'],
    passos: [
      'Se for wireless, verifique as baterias',
      'Se for USB, desconecte e reconecte o dispositivo',
      'Reinicie o computador',
      'Tente em outra porta USB',
      'Se for mouse wireless, verifique se o receptor está conectado',
      'Contate TI se não funcionar'
    ],
    confianca: 0.87,
    tipoProblema: 'hardware'
  },
  {
    id: '6',
    titulo: 'Erro ao Abrir Arquivo',
    descricao: 'Arquivo corrompido, formato não suportado ou permissões insuficientes',
    resumo: 'Verifique o formato do arquivo e permissões de acesso',
    palavrasChave: ['erro', 'arquivo', 'abrir', 'corrompido', 'formato', 'permissão', 'acesso negado', 'não consegue'],
    passos: [
      'Verifique a extensão do arquivo (.docx, .xlsx, .pdf, etc)',
      'Tente abrir com um programa diferente',
      'Verifique se você tem permissão para acessar o arquivo',
      'Se foi compartilhado, peça para compartilhar novamente',
      'Tente restaurar uma versão anterior do arquivo',
      'Entre em contato com TI se persistir'
    ],
    confianca: 0.85,
    tipoProblema: 'software'
  },
  {
    id: '7',
    titulo: 'Problema com Email',
    descricao: 'Não consegue enviar/receber emails ou está em spam',
    resumo: 'Verifique as configurações de email e a pasta de spam',
    palavrasChave: ['email', 'mail', 'não recebe', 'não envia', 'spam', 'outlook', 'gmail', 'mensagem'],
    passos: [
      'Verifique se está com internet conectada',
      'Verifique a pasta Spam/Lixo',
      'Adicione o remetente aos contatos para evitar spam',
      'Tente sair da aplicação de email e abrir novamente',
      'Se usar Outlook, execute a função "Reparar" no Painel de Controle',
      'Reinicie o computador se nada funcionar',
      'Contate TI com prints do erro'
    ],
    confianca: 0.86,
    tipoProblema: 'software'
  },
  {
    id: '8',
    titulo: 'Problema com Sincronização de Arquivos',
    descricao: 'Arquivos não sincronizam entre dispositivos ou OneDrive/Drive',
    resumo: 'Verifique conexão e permissões de sincronização',
    palavrasChave: ['sincronização', 'sincronizar', 'onedrive', 'google drive', 'arquivos', 'nuvem', 'backup'],
    passos: [
      'Verifique se está com internet conectada',
      'Abra o aplicativo de sincronização (OneDrive, Google Drive, etc)',
      'Verifique se está logado com a conta correta',
      'Aguarde a sincronização completar',
      'Se tiver muitos arquivos, pode levar tempo',
      'Reinicie o computador se necessário',
      'Entre em contato com TI se os arquivos não sincronizarem'
    ],
    confianca: 0.84,
    tipoProblema: 'software'
  },
  {
    id: '9',
    titulo: 'Monitor Sem Sinal',
    descricao: 'Tela do monitor preta ou sem sinal de entrada',
    resumo: 'Verifique cabos de vídeo e reinicie o computador',
    palavrasChave: ['monitor', 'tela', 'sem sinal', 'entrada', 'preta', 'preto', 'não aparece', 'vídeo'],
    passos: [
      'Verifique se o monitor está ligado',
      'Verifique se o cabo de vídeo está conectado na GPU/Motherboard',
      'Tente reconectar o cabo de vídeo',
      'Se o computador tiver GPU dedicada, verifique se está usando a GPU e não a integrada',
      'Reinicie o computador',
      'Tente outro cabo ou monitor se tiver disponível',
      'Contate TI se nada funcionar'
    ],
    confianca: 0.91,
    tipoProblema: 'hardware'
  },
  {
    id: '10',
    titulo: 'Espaço em Disco Cheio',
    descricao: 'Sem espaço no disco rígido ou SSD',
    resumo: 'Limpe arquivos temporários e desnecessários',
    palavrasChave: ['disco', 'espaço', 'cheio', 'armazenamento', 'memória', 'cheia', 'sem espaço'],
    passos: [
      'Abra "Este Computador" e verifique o espaço disponível',
      'Delete arquivos desnecessários da pasta Downloads',
      'Esvazia a Lixeira',
      'Use a ferramenta "Limpeza de Disco" do Windows',
      'Desinstale programas que não usa',
      'Se tiver arquivos grandes, mude para uma unidade externa',
      'Contate TI se precisar de expansão de armazenamento'
    ],
    confianca: 0.89,
    tipoProblema: 'hardware'
  },
  {
    id: '11',
    titulo: 'Problema com VPN',
    descricao: 'Não consegue conectar à VPN da empresa ou desconecta',
    resumo: 'Verifique credenciais e reconecte à VPN',
    palavrasChave: ['vpn', 'conectar', 'desconecta', 'remoto', 'acesso remoto', 'rede corporativa'],
    passos: [
      'Verifique suas credenciais de VPN',
      'Feche o cliente VPN completamente',
      'Reabra e tente conectar novamente',
      'Se usar Windows, reinicie o computador',
      'Verifique se tem conexão com internet',
      'Se tiver firewall pessoal, adicione VPN à whitelist',
      'Contate TI com prints do erro'
    ],
    confianca: 0.83,
    tipoProblema: 'rede'
  }
];

/**
 * Extrai keywords do texto e calcula frequência
 */
export function extrairKeywords(texto: string): KeywordMatch[] {
  if (!texto || texto.length < 20) return [];

  const textoLower = texto.toLowerCase();
  const keywordMatches: Map<string, { count: number; tipo: string }> = new Map();

  // Procura por matches em cada sugestão
  baseSugestoesIA.forEach(sugestao => {
    sugestao.palavrasChave.forEach(keyword => {
      // Verifica se a keyword está no texto
      if (textoLower.includes(keyword.toLowerCase())) {
        const chave = keyword.toLowerCase();
        const existing = keywordMatches.get(chave) || { count: 0, tipo: sugestao.tipoProblema };
        existing.count++;
        keywordMatches.set(chave, existing);
      }
    });
  });

  // Converte para array e ordena por frequência
  return Array.from(keywordMatches.entries())
    .map(([keyword, data]) => ({
      keyword,
      frequencia: data.count,
      tipoProblema: data.tipo
    }))
    .sort((a, b) => b.frequencia - a.frequencia);
}

/**
 * Gera sugestões baseadas no texto digitado
 */
export function gerarSugestoesLocalizada(texto: string): AISuggestion[] {
  if (!texto || texto.length < 20) return [];

  const textoLower = texto.toLowerCase();
  const sugestoesRelevantes: Map<string, AISuggestion> = new Map();

  // Encontra sugestões que correspondem às keywords
  baseSugestoesIA.forEach(sugestao => {
    let matchCount = 0;

    sugestao.palavrasChave.forEach(keyword => {
      if (textoLower.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    });

    // Se encontrou keywords, adiciona a sugestão
    if (matchCount > 0) {
      // Calcula confiança ajustada
      const confiancaAjustada = Math.min(
        (matchCount / sugestao.palavrasChave.length) * sugestao.confianca,
        0.99
      );

      sugestoesRelevantes.set(sugestao.id, {
        ...sugestao,
        confianca: confiancaAjustada
      });
    }
  });

  // Converte para array e ordena por confiança
  return Array.from(sugestoesRelevantes.values())
    .sort((a, b) => b.confianca - a.confianca)
    .slice(0, 3); // Retorna no máximo 3 sugestões
}

/**
 * Formata sugestão para exibição
 */
export function formatarSugestao(sugestao: AISuggestion): {
  titulo: string;
  resumo: string;
  descricao: string;
  passos: string[];
  confianca: number;
} {
  return {
    titulo: sugestao.titulo,
    resumo: sugestao.resumo,
    descricao: sugestao.descricao,
    passos: sugestao.passos,
    confianca: Math.round(sugestao.confianca * 100)
  };
}

export default {
  extrairKeywords,
  gerarSugestoesLocalizada,
  formatarSugestao,
  baseSugestoesIA
};
