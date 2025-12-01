/**
 * Dados Mock para Base de Conhecimento
 * Usado quando o backend não tem dados ou para testes
 */

export const articulosMockKnowledgeBase = [
  {
    id: '1',
    titulo: 'Como Reiniciar um Computador com Windows 10',
    descricao: 'Guia passo a passo para reiniciar corretamente um computador Windows 10',
    conteudo: `
      1. Clique no botão Iniciar
      2. Selecione o botão Desligar/Reiniciar
      3. Escolha Reiniciar
      4. O computador irá reiniciar automaticamente
      5. Aguarde o carregamento completo do sistema
    `,
    resumo: 'Reinicie seu computador para resolver muitos problemas',
    categoria: 'software',
    tags: ['computador', 'reiniciar', 'windows', 'sistema'],
    palavrasChave: ['reiniciar', 'restart', 'desligar', 'ligar', 'windows'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '2',
    titulo: 'Resolução de Problemas de Conexão Wi-Fi',
    descricao: 'Guia completo para solucionar problemas de conexão Wi-Fi',
    conteudo: `
      Passo 1: Verificar a senha
      - Certifique-se de que está digitando a senha correta
      - Senhas Wi-Fi são sensíveis a maiúsculas e minúsculas

      Passo 2: Reiniciar o roteador
      - Desconecte o roteador por 30 segundos
      - Reconecte e aguarde 2 minutos

      Passo 3: Verificar a distância
      - Tente se aproximar do roteador
      - Remova obstáculos entre você e o roteador

      Passo 4: Atualizar drivers
      - Abra Gerenciador de Dispositivos
      - Procure por adaptadores de rede
      - Atualize os drivers
    `,
    resumo: 'Passo a passo para reconectar à Wi-Fi',
    categoria: 'rede',
    tags: ['wifi', 'internet', 'conexão', 'rede', 'roteador'],
    palavrasChave: ['wifi', 'internet', 'conexão', 'rede', 'lento', 'cai', 'desconecta'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '3',
    titulo: 'Problema: Impressora Offline',
    descricao: 'Como resolver quando a impressora está offline',
    conteudo: `
      A impressora aparecendo como offline geralmente significa que:
      
      1. A conexão foi perdida
      2. O cabo está solto
      3. A impressora foi desligada

      Solução:
      1. Verifique o cabo de conexão (USB ou rede)
      2. Desligue e religue a impressora
      3. No Windows, vá para Configurações > Dispositivos > Impressoras
      4. Clique na sua impressora
      5. Clique "Abrir fila" e limpe os trabalhos pendentes
      6. Tente imprimir novamente
    `,
    resumo: 'Como resolver problema de impressora offline',
    categoria: 'impressora',
    tags: ['impressora', 'offline', 'erro', 'não imprime'],
    palavrasChave: ['impressora', 'offline', 'não imprime', 'erro'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '4',
    titulo: 'Limpeza de Espaço em Disco - Windows',
    descricao: 'Como liberar espaço em disco no Windows',
    conteudo: `
      Se seu disco está cheio, siga esses passos:

      Método 1: Limpeza de Disco Automática
      1. Clique em "Este Computador"
      2. Clique com direito em "C:" ou a unidade cheia
      3. Propriedades
      4. Clique em "Limpeza de disco"
      5. Selecione os itens a deletar
      6. Clique OK

      Método 2: Manual
      1. Abra a pasta Downloads
      2. Delete arquivos antigos que não precisa mais
      3. Esvazia a Lixeira
      4. Desinstale programas não usados via Painel de Controle

      Método 3: Storage Sense (Windows 10)
      1. Configurações > Sistema > Armazenamento
      2. Ative "Storage Sense"
      3. Escolha limpeza automática
    `,
    resumo: 'Libere espaço no disco para melhor desempenho',
    categoria: 'hardware',
    tags: ['disco', 'espaço', 'armazenamento', 'limpeza'],
    palavrasChave: ['disco', 'espaço', 'cheio', 'armazenamento', 'memória'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '5',
    titulo: 'Guia de Troubleshooting: Teclado e Mouse',
    descricao: 'Como resolver problemas com teclado ou mouse',
    conteudo: `
      Se seu teclado ou mouse não funciona:

      Para Dispositivos Com Fio (USB):
      1. Desconecte o dispositivo
      2. Reconecte em outra porta USB
      3. Aguarde o Windows reconhecer
      4. Tente novamente

      Para Dispositivos Sem Fio:
      1. Verifique as baterias
      2. Se tiver interruptor, desligue e religue
      3. Certifique-se de que o receptor USB está conectado
      4. Tente reconectar via software do fabricante

      Se Nada Funcionar:
      1. Tente em outro computador para testar o dispositivo
      2. Se funcionar em outro PC, reinstale drivers
      3. Se não funcionar em nenhum lugar, o dispositivo pode estar defeituoso
    `,
    resumo: 'Resolva problemas com teclado e mouse',
    categoria: 'hardware',
    tags: ['teclado', 'mouse', 'periférico', 'não funciona'],
    palavrasChave: ['teclado', 'mouse', 'não funciona', 'periférico'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '6',
    titulo: 'Problema: Monitor sem Sinal',
    descricao: 'Como resolver quando o monitor não mostra imagem',
    conteudo: `
      Seu monitor está preto ou sem sinal? Siga estes passos:

      Passo 1: Verificação Básica
      1. Verifique se o monitor está ligado (luz verde/azul)
      2. Se não, clique no botão power
      3. Se tiver uma bateria de backup, tente

      Passo 2: Verificar Conexão
      1. Verifique o cabo de vídeo (HDMI, DisplayPort ou VGA)
      2. Certifique-se de que está bem conectado em ambas as extremidades
      3. Tente reconectar

      Passo 3: Verificar o Computador
      1. O computador ligou? (ouça barulho de ventiladores)
      2. Os LEDs estão acesos?
      3. Se não, ligue o computador

      Passo 4: Testar com Outro Cabo
      1. Se tiver outro cabo de vídeo, tente
      2. Se tiver outro monitor, tente conectar

      Se ainda não funcionar, pode ser problema de hardware
    `,
    resumo: 'Diagnostique e corrija problemas de monitor sem sinal',
    categoria: 'hardware',
    tags: ['monitor', 'tela', 'vídeo', 'sem sinal'],
    palavrasChave: ['monitor', 'tela', 'sem sinal', 'preta', 'vídeo'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '7',
    titulo: 'Entender e Usar VPN da Empresa',
    descricao: 'Como conectar e usar a VPN corporativa corretamente',
    conteudo: `
      VPN (Virtual Private Network) é importante para acessar recursos corporativos remotamente.

      Instalação:
      1. Receba as credenciais de acesso do TI
      2. Instale o cliente VPN fornecido pela empresa
      3. Abra o aplicativo

      Conexão:
      1. Digite suas credenciais
      2. Clique em "Conectar"
      3. Aguarde até ver "Conectado"

      Uso:
      - Agora você pode acessar recursos internos como se estivesse na empresa
      - Sua velocidade pode ser menor
      - Não compartilhe suas credenciais

      Troubleshooting:
      - Se não conseguir conectar, verifique internet
      - Reinicie o aplicativo
      - Contate TI se tiver credenciais erradas
    `,
    resumo: 'Guia completo para usar VPN corporativa',
    categoria: 'rede',
    tags: ['vpn', 'remoto', 'corporativo', 'acesso'],
    palavrasChave: ['vpn', 'conectar', 'remoto', 'corporativo'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '8',
    titulo: 'Sincronização OneDrive: Passo a Passo',
    descricao: 'Como sincronizar seus arquivos com OneDrive',
    conteudo: `
      OneDrive sincroniza seus arquivos automaticamente com a nuvem.

      Primeira Vez:
      1. Clique no ícone OneDrive na bandeja do sistema
      2. Faça login com sua conta corporativa
      3. Escolha qual pasta sincronizar
      4. Clique "Próximo"

      Usando OneDrive:
      1. Os arquivos aparecem em "Esta semana"
      2. Você pode acessá-los de qualquer lugar
      3. Eles aparecem automaticamente em outros PCs

      Se Não Está Sincronizando:
      1. Verifique se está conectado à internet
      2. Abra OneDrive
      3. Se tiver um "X" vermelho, há um erro
      4. Se tiver uma "pausa", clique para retomar
      5. Se tiver um "relógio", aguarde a sincronização

      Pause Temporária:
      1. Clique no ícone OneDrive
      2. Clique em "..." (mais opções)
      3. Selecione "Pausar sincronização"
    `,
    resumo: 'Aprenda a sincronizar arquivos na nuvem',
    categoria: 'software',
    tags: ['onedrive', 'nuvem', 'sincronização', 'arquivo'],
    palavrasChave: ['onedrive', 'sincronização', 'nuvem', 'arquivo'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '9',
    titulo: 'Problemas com Email: Outlook',
    descricao: 'Soluções para problemas comuns com Outlook',
    conteudo: `
      Problemas Com Email no Outlook:

      Não Recebe Emails:
      1. Verifique a pasta Spam/Lixo
      2. Verifique se tem internet
      3. Feche e reabra Outlook
      4. Clique em "Enviar/Receber"
      5. Se nada funcionar, adicione o remetente aos contatos

      Não Consegue Enviar:
      1. Verifique se está conectado à internet
      2. Clique em "Enviar/Receber"
      3. Verifique o servidor SMTP nas Configurações
      4. Tente novamente

      Outlook Lento:
      1. Feche outros programas pesados
      2. Compacte as pastas (Ferramentas > Opções > Arquivo de Dados)
      3. Aumente o espaço em disco
      4. Desabilite add-ins desnecessários

      Erro de Autenticação:
      1. Altere sua senha no site corporativo
      2. Atualize a senha no Outlook
      3. Se não funcionar, contate TI
    `,
    resumo: 'Resolva problemas com Outlook e Email',
    categoria: 'software',
    tags: ['outlook', 'email', 'mail', 'erro'],
    palavrasChave: ['email', 'outlook', 'não recebe', 'não envia'],
    dataAtualizacao: new Date().toISOString()
  },
  {
    id: '10',
    titulo: 'Como Atualizar Drivers de Hardware',
    descricao: 'Guia para atualizar drivers de dispositivos',
    conteudo: `
      Os drivers são programas que permitem que o Windows controle o hardware.

      Atualizar Drivers:
      
      Método 1: Via Windows Update
      1. Vá para Configurações > Atualização e Segurança
      2. Clique em "Verificar atualizações"
      3. Aguarde e instale se houver drivers novos

      Método 2: Gerenciador de Dispositivos
      1. Pressione Win + X
      2. Selecione "Gerenciador de Dispositivos"
      3. Procure o dispositivo que precisa atualizar
      4. Clique com direito > "Atualizar driver"
      5. Escolha "Pesquisar automaticamente"
      6. Aguarde

      Método 3: Site do Fabricante
      1. Identifique o modelo do dispositivo
      2. Visite o site do fabricante
      3. Procure por Downloads/Suporte
      4. Baixe o driver para seu SO (Windows 10/11)
      5. Execute o instalador

      Depois de Atualizar:
      - Reinicie o computador
      - Verifique se o dispositivo funciona
      - Se não funcionar, volte para a versão anterior
    `,
    resumo: 'Mantenha seus drivers atualizados',
    categoria: 'hardware',
    tags: ['driver', 'atualização', 'hardware', 'dispositivo'],
    palavrasChave: ['driver', 'atualizar', 'hardware', 'dispositivo'],
    dataAtualizacao: new Date().toISOString()
  }
];

/**
 * Função para seedar dados no backend
 * Chamada uma vez para popular a base de dados
 */
export async function seedArticulosKnowledgeBase() {
  try {
    // Opcional: implementar se tiver endpoint POST /api/artigos
    console.log('Dados de artigos disponíveis para mock');
    return articulosMockKnowledgeBase;
  } catch (error) {
    console.error('Erro ao fazer seed dos artigos:', error);
    return [];
  }
}

export default articulosMockKnowledgeBase;
