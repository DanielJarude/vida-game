/**
 * ERAS HISTÓRICAS · AS TECNOLOGIAS NO BRASIL (dados puros).
 *
 * Quatro datas diferentes, que não se confundem:
 *   - `lancada`: o ano do lançamento comercial no mundo (fato);
 *   - `brasil`: o ano em que passa a estar à venda / em serviço no Brasil (fato, quando há registro; senão, aproximação);
 *   - `popular`: o ano a partir do qual a classe média costuma ter (APROXIMAÇÃO de jogo, lida das tendências das
 *     pesquisas domiciliares — IBGE/PNAD para bens duráveis e telefone; CGI.br/TIC Domicílios para computador,
 *     internet e celular a partir de 2005; Anatel para acessos móveis);
 *   - `massa`: o ano a partir do qual a maioria das casas tem, em todas as faixas de renda (APROXIMAÇÃO, mesmas fontes).
 *   - `fim`: deixa de ser vendida/usada de forma corrente (aproximação).
 * Entre `brasil` e `popular`, só a família de renda alta tem; entre `popular` e `massa`, a partir da classe média
 * baixa. Cada vida desloca as datas de adoção em até um ano (da semente): a chegada não é no mesmo dia para todo mundo.
 *
 * As marcas e os nomes de produto aparecem só como referência histórica (o que existia), nunca como peça do jogo.
 */

export type MeioDeComunicacao = 'fixo' | 'celular' | 'smartphone';

export interface TecnologiaBR {
  id: string;
  nome: string;
  lancada: number;
  brasil: number;
  popular: number;
  massa: number;
  fim?: number;
  /** O fato que sustenta `brasil` (ou "aproximação"). */
  fonte: string;
}

export const TECNOLOGIAS_BR: readonly TecnologiaBR[] = [
  // ---------------------------------------------------------------- comunicação
  { id: 'telefone_fixo', nome: 'telefone fixo em casa', lancada: 1876, brasil: 1880, popular: 1988, massa: 2001, fonte: 'Linhas fixas caras e escassas até a privatização do Sistema Telebrás (29/07/1998); a planta mais que dobrou até 2001 (Anatel). Popularização: aproximação.' },
  { id: 'orelhao', nome: 'telefone público (orelhão)', lancada: 1971, brasil: 1972, popular: 1972, massa: 1972, fim: 2018, fonte: 'Orelhão projetado por Chu Ming Silveira, instalado a partir de 1972 (Companhia Telefônica Brasileira). Fim: aproximação.' },
  { id: 'pager', nome: 'bipe (pager)', lancada: 1980, brasil: 1990, popular: 1994, massa: 9999, fim: 2003, fonte: 'Serviços de radiochamada no Brasil nos anos 1990 (aproximação).' },
  { id: 'celular', nome: 'telefone celular', lancada: 1983, brasil: 1990, popular: 2000, massa: 2005, fonte: 'Primeiro serviço móvel: Rio de Janeiro, dezembro de 1990 (Telerj). Pré-pago e telefonia digital a partir de 1998. Popularização: aproximação (Anatel).' },
  { id: 'sms', nome: 'mensagem de texto (SMS)', lancada: 1992, brasil: 1999, popular: 2002, massa: 2006, fim: 2016, fonte: 'Aproximação: o SMS se espalha com o celular digital e o pré-pago no começo dos anos 2000.' },
  { id: 'smartphone', nome: 'smartphone', lancada: 2007, brasil: 2008, popular: 2012, massa: 2015, fonte: 'Smartphones de tela sensível chegam em 2008; a maioria das casas com acesso móvel à internet por volta de 2015 (CGI.br/TIC Domicílios). Aproximação.' },
  { id: 'mensageiro_app', nome: 'mensagens por aplicativo no celular', lancada: 2009, brasil: 2010, popular: 2013, massa: 2015, fonte: 'Aplicativos de mensagem (lançados em 2009) viram o meio dominante de conversa no Brasil por volta de 2013–2015 (aproximação).' },
  // ---------------------------------------------------------------- computador e internet
  { id: 'computador', nome: 'computador em casa', lancada: 1977, brasil: 1982, popular: 1998, massa: 2012, fonte: 'Microcomputadores nacionais nos anos 1980 (reserva de mercado, Lei 7.232/1984); popularização no fim dos anos 1990; maioria das casas por volta de 2012 (aproximação, PNAD/TIC).' },
  { id: 'internet', nome: 'internet', lancada: 1991, brasil: 1995, popular: 2000, massa: 2012, fonte: 'Acesso comercial liberado em 1995 (Ministério das Comunicações/Embratel); internet discada até meados dos anos 2000.' },
  { id: 'banda_larga', nome: 'internet de banda larga', lancada: 1999, brasil: 2000, popular: 2007, massa: 2013, fonte: 'Aproximação: banda larga por ADSL a partir de 2000 nas capitais.' },
  { id: 'email', nome: 'e-mail', lancada: 1971, brasil: 1995, popular: 2000, massa: 2010, fonte: 'Com o acesso comercial à internet (1995).' },
  { id: 'mensageiro_pc', nome: 'mensageiro instantâneo no computador', lancada: 1996, brasil: 1997, popular: 2003, massa: 9999, fim: 2013, fonte: 'Mensageiros de computador (1996–1999); o mais usado no Brasil foi encerrado em 2013.' },
  { id: 'lan_house', nome: 'lan house', lancada: 1996, brasil: 1999, popular: 2003, massa: 2003, fim: 2014, fonte: 'Aproximação: as lan houses foram o principal ponto de acesso das classes C e D na segunda metade dos anos 2000 (CGI.br/TIC).' },
  { id: 'rede_comunidades', nome: 'rede social de comunidades', lancada: 2004, brasil: 2004, popular: 2005, massa: 2008, fim: 2014, fonte: 'A rede de perfis e comunidades lançada em janeiro de 2004 teve no Brasil o maior público; encerrada em setembro de 2014.' },
  { id: 'redes_modernas', nome: 'redes sociais de hoje', lancada: 2004, brasil: 2008, popular: 2011, massa: 2014, fonte: 'Aproximação: as redes atuais tomam o lugar da rede de comunidades no começo dos anos 2010.' },
  { id: 'app_namoro', nome: 'aplicativo de namoro', lancada: 2012, brasil: 2013, popular: 2015, massa: 2018, fonte: 'Aplicativos de namoro por geolocalização lançados em 2012; no Brasil a partir de 2013 (aproximação).' },
  { id: 'streaming', nome: 'streaming de filmes e séries', lancada: 2007, brasil: 2011, popular: 2015, massa: 2019, fonte: 'Primeiro serviço de streaming por assinatura no Brasil: setembro de 2011.' },
  { id: 'internet_banking', nome: 'banco pela internet', lancada: 1995, brasil: 1996, popular: 2005, massa: 2014, fonte: 'Primeiros bancos na internet no Brasil em 1996 (aproximação).' },
  { id: 'banco_app', nome: 'banco no celular', lancada: 2010, brasil: 2011, popular: 2014, massa: 2017, fonte: 'Aproximação: o celular passa a ser o principal canal bancário no fim dos anos 2010 (Febraban, Pesquisa de Tecnologia Bancária).' },
  { id: 'pix', nome: 'Pix', lancada: 2020, brasil: 2020, popular: 2020, massa: 2021, fonte: 'Pix: em funcionamento pleno a partir de 16/11/2020 (Banco Central do Brasil).' },
  { id: 'ia_conversa', nome: 'assistente de inteligência artificial', lancada: 2022, brasil: 2023, popular: 2024, massa: 9999, fonte: 'Assistentes conversacionais abertos ao público em novembro de 2022 (aproximação para o uso no Brasil).' },
  // ---------------------------------------------------------------- som, imagem, foto
  { id: 'radio', nome: 'rádio', lancada: 1920, brasil: 1922, popular: 1940, massa: 1960, fonte: 'Primeira transmissão de rádio no Brasil: 7 de setembro de 1922.' },
  { id: 'tv_cores', nome: 'televisão em cores', lancada: 1954, brasil: 1972, popular: 1980, massa: 1990, fonte: 'Transmissão oficial em cores no Brasil: 1972 (aproximação para a popularização).' },
  { id: 'videocassete', nome: 'videocassete', lancada: 1976, brasil: 1982, popular: 1988, massa: 9999, fim: 2006, fonte: 'Aproximação: videocassetes produzidos na Zona Franca de Manaus nos anos 1980.' },
  { id: 'toca_fitas', nome: 'toca-fitas e fitas cassete', lancada: 1963, brasil: 1970, popular: 1975, massa: 1985, fim: 2005, fonte: 'Aproximação.' },
  { id: 'walkman', nome: 'toca-fitas portátil', lancada: 1979, brasil: 1982, popular: 1987, massa: 9999, fim: 2003, fonte: 'Lançado no Japão em 1979 (aproximação para o Brasil).' },
  { id: 'vinil', nome: 'toca-discos e discos de vinil', lancada: 1948, brasil: 1951, popular: 1965, massa: 9999, fim: 1997, fonte: 'Aproximação: o LP perde o mercado para o CD nos anos 1990 (volta como nicho depois).' },
  { id: 'cd', nome: 'CD e aparelho de CD', lancada: 1982, brasil: 1987, popular: 1993, massa: 1998, fim: 2012, fonte: 'Primeiros CDs prensados no Brasil em 1987 (aproximação).' },
  { id: 'dvd', nome: 'DVD', lancada: 1996, brasil: 1998, popular: 2003, massa: 2007, fim: 2016, fonte: 'Aproximação.' },
  { id: 'mp3', nome: 'tocador de MP3', lancada: 1998, brasil: 2000, popular: 2005, massa: 9999, fim: 2012, fonte: 'Aproximação.' },
  { id: 'camera_filme', nome: 'câmera de filme', lancada: 1900, brasil: 1900, popular: 1975, massa: 1990, fim: 2006, fonte: 'Aproximação: a foto revelada no laboratório até a chegada das digitais.' },
  { id: 'camera_digital', nome: 'câmera digital', lancada: 1994, brasil: 1998, popular: 2004, massa: 2008, fim: 2015, fonte: 'Aproximação.' },
  { id: 'tv_tela_fina', nome: 'TV de tela fina', lancada: 1997, brasil: 2003, popular: 2009, massa: 2014, fonte: 'Aproximação; TV digital aberta a partir de 2 de dezembro de 2007 (São Paulo).' },
  { id: 'videogame_cartucho', nome: 'videogame de cartucho', lancada: 1977, brasil: 1983, popular: 1989, massa: 9999, fim: 1999, fonte: 'Primeiros consoles fabricados no Brasil em 1983 (aproximação).' },
  { id: 'videogame_disco', nome: 'videogame de CD/DVD', lancada: 1994, brasil: 1996, popular: 2001, massa: 9999, fim: 2013, fonte: 'Aproximação.' },
  { id: 'videogame_atual', nome: 'videogame de última geração', lancada: 2013, brasil: 2013, popular: 2016, massa: 9999, fonte: 'Aproximação.' },
  { id: 'notebook', nome: 'notebook', lancada: 1989, brasil: 1993, popular: 2008, massa: 2014, fonte: 'Aproximação.' },
  { id: 'tablet', nome: 'tablet', lancada: 2010, brasil: 2010, popular: 2013, massa: 9999, fonte: 'Primeiro tablet popular lançado em 2010; à venda no Brasil no fim de 2010.' }
];

export const TECNOLOGIA_POR_ID: ReadonlyMap<string, TecnologiaBR> = new Map(TECNOLOGIAS_BR.map(x => [x.id, x]));

/**
 * As plataformas das redes do jogo (`dados/redes`): o ano em que passam a ser usadas no Brasil (lançamento mundial
 * entre parênteses, quando diferente). Fontes: comunicados das próprias empresas e imprensa da época (aproximação
 * para o uso no Brasil quando a versão em português veio depois).
 */
export const PLATAFORMAS_DESDE: Readonly<Record<string, number>> = {
  youtube: 2006, // lançado em 2005; versão brasileira em 2007
  facebook: 2007, // aberto ao público em 2006; versão em português em 2008
  x: 2007, // lançado em 2006
  instagram: 2010,
  twitch: 2011,
  tiktok: 2018, // fundido ao aplicativo de vídeos curtos anterior em agosto de 2018
  onlyfans: 2016
};
