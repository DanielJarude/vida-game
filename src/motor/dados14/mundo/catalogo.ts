/**
 * VIDA 14 · Eventos mundiais e evolução histórica — os catálogos (puros).
 *
 *   - HISTORIA_REAL: o que aconteceu de verdade antes de 2026 (fatos genéricos, sem detalhe que possa estar errado);
 *   - MARCOS_FUTUROS: a evolução tecnológica e científica plausível, com JANELA de anos (cada mundo sorteia o ano dentro
 *     dela, de forma determinística, respeitando a ordem: a base na Lua antes de Marte);
 *   - os textos dos marcos que JÁ estão nos dados do jogo (a profissão que surge ou encolhe em `dados/ocupacoes`, a
 *     automação e a expansão de cada família em `dados/carreiras`): o ano é o dos dados, nunca outro;
 *   - os moldes dos acontecimentos sorteados (crise de fora, choque de energia, desastre, pandemia, acordos).
 * Nenhum texto promete efeito que o motor não aplica: o efeito dito é composto a partir dos `mods` (`v14/mundo`).
 */

import type { EfeitosMundo14, TipoEventoMundial } from './tipos';

export interface FatoHistorico {
  ano: number;
  chave: string;
  tipo: TipoEventoMundial;
  titulo: string;
  texto: string;
  mods?: EfeitosMundo14;
  /** Anos de efeito depois do primeiro (0: só o ano). */
  dura?: number;
  /** Choque de inflação (pontos percentuais somados à inflação do ano). */
  inflacao?: number;
  pandemia?: { exteriorMeses: number; contagio: number };
  /** Torna os aparelhos eletrônicos que a pessoa tem mais velhos (uma geração nova chegou). */
  obsoleta?: boolean;
}

/** Fatos reais, contados de forma genérica (sem números nem nomes que possam estar errados). */
export const HISTORIA_REAL: FatoHistorico[] = [
  { ano: 2001, chave: 'atentados', tipo: 'internacional', titulo: 'Atentados nos Estados Unidos', texto: 'Aviões sequestrados derrubaram as torres de Nova York. Os aeroportos do mundo inteiro mudaram as regras de segurança.', mods: { ramos: { aerea: 0.85 } }, dura: 1 },
  { ano: 2003, chave: 'genoma', tipo: 'ciencia', titulo: 'O genoma humano', texto: 'Os cientistas terminaram de ler o genoma humano inteiro: o manual de instruções do corpo, letra por letra.' },
  { ano: 2004, chave: 'tsunami_indico', tipo: 'desastre', titulo: 'Tsunami no oceano Índico', texto: 'Um terremoto no fundo do mar levantou ondas gigantes que varreram o litoral de vários países da Ásia. O mundo inteiro mandou ajuda.' },
  { ano: 2007, chave: 'smartphone', tipo: 'produtos', titulo: 'A internet no bolso', texto: 'Chegaram os celulares de tela sensível ao toque, com a internet inteira no bolso. O celular de teclinha começou a parecer coisa antiga.', obsoleta: true },
  { ano: 2008, chave: 'crise_2008', tipo: 'economia', titulo: 'Crise financeira mundial', texto: 'Bancos grandes quebraram nos Estados Unidos e a crise correu o mundo: crédito travado, bolsas despencando, fábricas cortando turno.', mods: { demissao: 1.2, contratacao: -0.04, ramos: { banco: 0.85, montadora: 0.9 } }, dura: 1 },
  { ano: 2009, chave: 'gripe_2009', tipo: 'pandemia', titulo: 'Uma gripe nova', texto: 'Uma gripe nova virou pandemia. Álcool em gel em todo canto, aulas adiadas em alguns lugares — e a vacina chegou depois.', pandemia: { exteriorMeses: 0, contagio: 0.15 } },
  { ano: 2010, chave: 'haiti', tipo: 'desastre', titulo: 'Terremoto no Haiti', texto: 'Um terremoto destruiu boa parte da capital do Haiti. Missões de ajuda chegaram de vários países.' },
  { ano: 2011, chave: 'japao_2011', tipo: 'desastre', titulo: 'Terremoto e tsunami no Japão', texto: 'Um terremoto enorme e um tsunami atingiram o Japão, e uma usina nuclear teve um acidente grave. Fábricas de peças pararam e faltou componente no mundo inteiro.', mods: { ramos: { montadora: 0.94, semicondutores: 0.9 } } },
  { ano: 2012, chave: 'higgs', tipo: 'ciencia', titulo: 'Uma partícula procurada por décadas', texto: 'Físicos anunciaram a descoberta do bóson de Higgs, a partícula que faltava na teoria. Saiu em todos os jornais, entendida por quase ninguém.' },
  { ano: 2014, chave: 'ebola', tipo: 'pandemia', titulo: 'Ebola na África Ocidental', texto: 'Uma epidemia de ebola atingiu países da África Ocidental. Aeroportos passaram a medir a febre de quem chegava de lá.' },
  { ano: 2015, chave: 'acordo_clima', tipo: 'internacional', titulo: 'Acordo do clima', texto: 'Quase todos os países assinaram em Paris um acordo para conter o aquecimento do planeta.', mods: { ramos: { energia: 1.05 } }, dura: 2 },
  { ano: 2016, chave: 'brexit', tipo: 'internacional', titulo: 'O Reino Unido sai da União Europeia', texto: 'Num plebiscito, o Reino Unido decidiu sair da União Europeia. Anos de negociação vieram depois.' },
  { ano: 2019, chave: 'buraco_negro', tipo: 'ciencia', titulo: 'A foto de um buraco negro', texto: 'Uma rede de telescópios no mundo inteiro fez a primeira imagem de um buraco negro: um anel de luz em volta do escuro.' },
  { ano: 2020, chave: 'covid', tipo: 'pandemia', titulo: 'Pandemia', texto: 'Um vírus novo parou o planeta. Fronteiras fechadas, escolas e lojas de portas baixadas, gente trabalhando da cozinha de casa.', mods: { demissao: 1.6, contratacao: -0.1, clientela: -10, setores: { alimentacao: 0.6, beleza: 0.6, comercio: 0.8, esporte: 0.6, transporte: 0.8, saude: 1.25, tecnologia: 1.15, logistica: 1.15 }, ramos: { restaurante: 0.6, hotel: 0.45, academia: 0.55, museu: 0.45, zoologico: 0.6, estudio: 0.75, loja: 0.8, aerea: 0.45, online: 1.3, clinica: 1.1, tecnologia: 1.1 } }, pandemia: { exteriorMeses: 12, contagio: 0.35 } },
  { ano: 2021, chave: 'vacinas_2021', tipo: 'ciencia', titulo: 'Vacina no braço', texto: 'As vacinas contra o vírus da pandemia, feitas em tempo recorde, chegaram ao braço de bilhões de pessoas. Aos poucos, a vida voltou para a rua.', mods: { demissao: 1.15, setores: { alimentacao: 0.85, beleza: 0.85, saude: 1.1 }, ramos: { restaurante: 0.85, hotel: 0.75, aerea: 0.75, museu: 0.8, online: 1.1 } } },
  { ano: 2022, chave: 'guerra_ucrania', tipo: 'internacional', titulo: 'Guerra na Europa', texto: 'A Rússia invadiu a Ucrânia. Gás, petróleo e trigo subiram no mundo inteiro, e a inflação veio junto.', inflacao: 0.02, mods: { reajuste: -0.006, ramos: { energia: 1.1, aerea: 0.9 } } },
  { ano: 2023, chave: 'ia_conversa', tipo: 'tecnologia', titulo: 'A inteligência artificial que conversa', texto: 'Assistentes de inteligência artificial que conversam e escrevem viraram assunto em toda parte — no trabalho, na escola, na mesa do jantar.', mods: { setores: { tecnologia: 1.05 } }, dura: 2 }
];

export interface MarcoFuturo {
  id: string;
  /** Janela do ano: cada mundo sorteia um ano dentro dela (determinístico). */
  janela: [number, number];
  /** Só depois deste marco (pelo menos um ano). */
  depois?: string;
  tipo: TipoEventoMundial;
  titulo: string;
  texto: string;
  mods?: EfeitosMundo14;
  dura?: number;
  obsoleta?: boolean;
  /** Melhora o tratamento de quem tem uma condição crônica em tratamento. */
  tratamento?: boolean;
}

export const MARCOS_FUTUROS: MarcoFuturo[] = [
  { id: 'aparelhos_1', janela: [2029, 2033], tipo: 'produtos', titulo: 'Óculos que mostram a tela', texto: 'Óculos leves que projetam mapa, mensagem e legenda diante dos olhos começaram a substituir a tela do celular. O aparelho de vidro na mão ficou com cara de coisa velha.', obsoleta: true },
  { id: 'aparelhos_2', janela: [2040, 2045], depois: 'aparelhos_1', tipo: 'produtos', titulo: 'Telas que se enrolam', texto: 'Os aparelhos passaram a dobrar, enrolar e caber no bolso da camisa. Os computadores de mesa viraram peça de colecionador.', obsoleta: true },
  { id: 'aparelhos_3', janela: [2052, 2058], depois: 'aparelhos_2', tipo: 'produtos', titulo: 'Tudo por voz', texto: 'A casa, o carro e o trabalho passaram a obedecer à voz e ao gesto. Teclado virou coisa de quem programa — e de quem tem saudade.', obsoleta: true },
  { id: 'aparelhos_4', janela: [2066, 2072], depois: 'aparelhos_3', tipo: 'produtos', titulo: 'Mais uma geração de aparelhos', texto: 'Uma geração nova de aparelhos chegou às lojas, mais leve e mais esperta. Os de cinco anos atrás deixaram de receber atualização.', obsoleta: true },
  { id: 'aparelhos_5', janela: [2080, 2086], depois: 'aparelhos_4', tipo: 'produtos', titulo: 'Aparelhos que se consertam', texto: 'Chegaram aparelhos que se atualizam e se consertam sozinhos. Os antigos pararam de conversar com os sistemas novos.', obsoleta: true },
  { id: 'aparelhos_6', janela: [2094, 2100], depois: 'aparelhos_5', tipo: 'produtos', titulo: 'Outra virada nos aparelhos', texto: 'Mais uma virada nos aparelhos do dia a dia. O que estava na gaveta virou relíquia de uma hora para outra.', obsoleta: true },
  { id: 'aparelhos_7', janela: [2110, 2120], depois: 'aparelhos_6', tipo: 'produtos', titulo: 'Uma geração nova de aparelhos', texto: 'Uma geração nova de aparelhos chegou. Os antigos ainda ligam, mas o mundo parou de falar a língua deles.', obsoleta: true },
  { id: 'eletricos', janela: [2036, 2044], tipo: 'tecnologia', titulo: 'O carro elétrico vira maioria', texto: 'Os carros elétricos passaram a ser a maioria dos vendidos no mundo. Os postos começaram a trocar bombas por tomadas.', mods: { ramos: { energia: 1.1, montadora: 1.05 }, setores: { manutencao: 1.05 } }, dura: 2 },
  { id: 'base_lunar', janela: [2034, 2042], tipo: 'ciencia', titulo: 'Gente morando na Lua', texto: 'Uma base permanente na Lua recebeu a primeira tripulação fixa. A transmissão parou escolas no mundo inteiro.', mods: { ramos: { aeroespacial: 1.15 } }, dura: 2 },
  { id: 'marte', janela: [2046, 2062], depois: 'base_lunar', tipo: 'ciencia', titulo: 'A primeira gente em Marte', texto: 'Pela primeira vez, uma tripulação pousou em Marte. Gente que nunca ligou para o espaço passou a madrugada acordada vendo.', mods: { ramos: { aeroespacial: 1.2, semicondutores: 1.05 } }, dura: 2 },
  { id: 'terapia_genica', janela: [2034, 2045], tipo: 'ciencia', titulo: 'Remédios feitos para cada um', texto: 'Terapias que corrigem genes e remédios feitos sob medida chegaram aos hospitais. Doenças que se arrastavam por décadas passaram a ser controladas.', tratamento: true, mods: { setores: { saude: 1.06 } }, dura: 2 },
  { id: 'vacina_cancer', janela: [2042, 2056], depois: 'terapia_genica', tipo: 'ciencia', titulo: 'Vacinas contra o câncer', texto: 'Vacinas treinadas contra tumores entraram no tratamento de rotina. Para muitos tipos de câncer, o diagnóstico deixou de ser sentença.', tratamento: true },
  { id: 'quantica', janela: [2038, 2050], tipo: 'tecnologia', titulo: 'Computadores quânticos úteis', texto: 'Os computadores quânticos saíram dos laboratórios e começaram a desenhar remédios e materiais novos. As empresas de chips correram atrás.', mods: { ramos: { semicondutores: 1.15, tecnologia: 1.06 }, setores: { tecnologia: 1.06 } }, dura: 3 },
  { id: 'impressao_casas', janela: [2038, 2048], tipo: 'tecnologia', titulo: 'Casas impressas', texto: 'Máquinas que imprimem paredes inteiras chegaram aos canteiros de obra. Os prédios sobem mais rápido, com menos gente na obra.', mods: { setores: { construcao: 0.95 }, ramos: { construtora: 1.08 } }, dura: 3 },
  { id: 'carne_cultivada', janela: [2040, 2055], tipo: 'produtos', titulo: 'Carne de laboratório no mercado', texto: 'Carne cultivada em laboratório chegou à prateleira do supermercado pelo preço da outra. O pasto começou a encolher.', mods: { setores: { agro: 0.96 } }, dura: 4 },
  { id: 'fusao', janela: [2058, 2078], tipo: 'tecnologia', titulo: 'Energia da fusão', texto: 'A primeira usina de fusão nuclear passou a vender energia para a rede. A conta de luz do mundo começou a mudar de figura.', mods: { ramos: { energia: 1.2, industria: 1.05 }, setores: { engenharia: 1.08, industria: 1.04 } }, dura: 4 },
  { id: 'robotaxi', janela: [2045, 2054], tipo: 'tecnologia', titulo: 'Táxi sem motorista', texto: 'Táxis sem motorista passaram a circular nas metrópoles do mundo. Por enquanto, convivem com os de sempre.', mods: { ramos: { tecnologia: 1.04, montadora: 1.04 } }, dura: 2 }
];

/** As profissões que surgem ou encolhem nos dados do jogo (`dados/ocupacoes`): o texto do ano em que acontece. */
export const TEXTO_OCUPACAO: Record<string, string> = {
  instalador_solar: 'Os telhados encheram de placas solares, e instalar energia solar virou profissão com fila de clientes.',
  operador_drone: 'Os drones tomaram as lavouras: pulverizar, medir, vigiar. Surgiu a profissão de quem pilota drone no campo.',
  tecnico_energia: 'As redes de energia viraram inteligentes, com bateria em cada bairro. Surgiu a vaga de técnico de redes de energia.',
  tecnico_sistemas_automatizados: 'As fábricas automatizadas precisam de quem cuide dos sistemas: técnico de sistemas automatizados virou carreira.',
  operador_telemarketing: 'Os atendentes virtuais passaram a atender quase todas as ligações. O telemarketing começou a sumir.',
  supervisor_atendimento: 'Com o atendimento quase todo automático, as equipes de supervisão foram encolhendo.',
  caixa: 'O autoatendimento tomou os supermercados: o caixa com gente virou exceção.',
  porteiro: 'A portaria remota — câmera, interfone e uma central longe dali — tomou os prédios. O porteiro de guarita foi ficando raro.',
  operador_confeccao: 'As confecções automatizaram o corte e a costura em série. A costureira de fábrica foi ficando rara.',
  operador_producao: 'As linhas de produção passaram a rodar quase sozinhas. A vaga de operador foi rareando.',
  frentista: 'Com os carros elétricos, os postos viraram eletropostos de autoatendimento. O frentista foi desaparecendo.',
  motorista_caminhao: 'Caminhões que dirigem sozinhos tomaram as rodovias principais. O motorista de caminhão ficou para os trechos difíceis.'
};

/** A automação (ou a expansão) que chega a cada família de carreiras (`dados/carreiras`), no ano dos dados. */
export const TEXTO_AUTOMACAO: Record<string, string> = {
  industria: 'A automação entrou de vez nas fábricas: robôs na linha, menos gente operando, mais gente cuidando das máquinas.',
  escritorio: 'Sistemas de inteligência artificial passaram a fazer boa parte do trabalho de escritório: planilha, relatório, conferência.',
  criacao: 'Ferramentas que geram imagem e texto chegaram ao trabalho de quem cria. Sobrou espaço para quem tem assinatura própria.',
  varejo: 'As lojas passaram a se repor e cobrar sozinhas. Vender ficou mais disputado.',
  tecnologia: 'Os sistemas passaram a escrever boa parte do próprio código. Programar mudou de cara.',
  publico: 'Os serviços públicos foram para o celular: menos balcão, menos fila, menos gente atendendo.',
  predial: 'Os prédios ganharam portaria remota e limpeza automatizada.',
  transporte: 'Veículos autônomos começaram a assumir rotas de entrega e de carga.'
};
export const TEXTO_EXPANSAO: Record<string, string> = {
  docencia: 'O mundo passou a estudar a vida inteira: faltam professores, e a profissão ganhou procura.',
  cuidado: 'A população envelheceu: cuidar de gente virou um dos trabalhos mais procurados.',
  saude: 'Com mais gente vivendo mais, a saúde passou a contratar como nunca.'
};

/* ------------------------------------------------------- Os acontecimentos sorteados (de 2026 em diante) */

/** Causas de uma crise que vem de fora (o país entra em crise e o mundo explica por quê). */
export const CAUSAS_CRISE: { chave: string; titulo: string; texto: string; ramos?: Record<string, number> }[] = [
  { chave: 'bolha', titulo: 'Bolha que estourou lá fora', texto: 'Uma bolha de crédito estourou nas grandes economias: bancos com o caixa no vermelho, empresas cortando investimento no mundo todo.', ramos: { banco: 0.88, construtora: 0.9 } },
  { chave: 'calote', titulo: 'Um país grande não pagou', texto: 'Um país grande deixou de pagar a dívida e o dinheiro fugiu dos emergentes. O dólar disparou e o crédito sumiu.', ramos: { banco: 0.9 } },
  { chave: 'comercio', titulo: 'Guerra comercial', texto: 'As grandes potências entraram numa guerra de tarifas. O comércio do mundo travou e as fábricas sentiram primeiro.', ramos: { industria: 0.9, montadora: 0.9, semicondutores: 0.9 } },
  { chave: 'tecnologia', titulo: 'O tombo das empresas de tecnologia', texto: 'As ações das gigantes de tecnologia despencaram de uma vez, e o tombo arrastou as bolsas do mundo.', ramos: { tecnologia: 0.88 } }
];

/** Choques de energia e de alimentos (inflação de fora, que chega à feira). */
export const CHOQUES: { chave: string; titulo: string; texto: string; inflacao: number; mods: EfeitosMundo14 }[] = [
  { chave: 'petroleo', titulo: 'Choque do petróleo', texto: 'Um conflito numa região produtora fechou rotas de petróleo. Combustível, frete e passagem aérea subiram no mundo inteiro.', inflacao: 0.02, mods: { reajuste: -0.006, ramos: { aerea: 0.85, energia: 1.1 }, setores: { transporte: 0.95 } } },
  { chave: 'safra', titulo: 'Quebra de safra no mundo', texto: 'Secas ao mesmo tempo em vários celeiros do mundo derrubaram a colheita. O preço da comida subiu em todo lugar.', inflacao: 0.015, mods: { reajuste: -0.004, setores: { agro: 1.06 }, ramos: { restaurante: 0.95 } } },
  { chave: 'cadeias', titulo: 'Falta de peças', texto: 'As rotas de navio se embaralharam e faltaram peças e chips no mundo inteiro. Carros e eletrônicos ficaram mais caros e demorados.', inflacao: 0.012, mods: { ramos: { montadora: 0.9, semicondutores: 1.08 }, setores: { industria: 0.95 } } }
];

export type Perigo = 'terremoto' | 'furacao' | 'enchente' | 'calor' | 'incendio' | 'seca';

/** Os perigos naturais plausíveis em cada país (o resto do mundo: enchente, calor e seca). */
export const PERIGOS_DO_PAIS: Record<string, Perigo[]> = {
  JP: ['terremoto', 'furacao', 'enchente', 'calor'], CL: ['terremoto', 'incendio', 'seca'], MX: ['terremoto', 'furacao', 'seca', 'calor'],
  PE: ['terremoto', 'enchente'], IT: ['terremoto', 'enchente', 'calor', 'incendio'], US: ['terremoto', 'furacao', 'incendio', 'enchente', 'calor'],
  NZ: ['terremoto', 'enchente'], CO: ['terremoto', 'enchente'], CR: ['terremoto', 'furacao', 'enchente'], CN: ['terremoto', 'furacao', 'enchente', 'calor'],
  KR: ['furacao', 'enchente', 'calor'], IN: ['furacao', 'enchente', 'calor', 'seca'], AU: ['incendio', 'seca', 'enchente', 'calor', 'furacao'],
  PT: ['incendio', 'calor', 'seca'], ES: ['incendio', 'calor', 'seca'], FR: ['enchente', 'calor', 'incendio'], DE: ['enchente', 'calor'],
  GB: ['enchente', 'calor'], CA: ['incendio', 'enchente', 'calor'], BR: ['enchente', 'seca', 'calor', 'incendio'], AR: ['enchente', 'seca', 'calor'],
  UY: ['enchente', 'seca'], DO: ['furacao', 'enchente'], ZA: ['seca', 'incendio', 'enchente'], KE: ['seca', 'enchente'], NG: ['enchente', 'calor'],
  AO: ['seca', 'enchente'], MA: ['terremoto', 'seca', 'calor']
};

/** Desastres longe que mexem na vida de cá (fábrica parada do outro lado do mundo). [país, perigo, mods] */
export const DESASTRES_LONGE: [string, Perigo, EfeitosMundo14?][] = [
  ['JP', 'terremoto', { ramos: { montadora: 0.95, semicondutores: 0.9 } }], ['KR', 'furacao', { ramos: { semicondutores: 0.93 } }],
  ['CN', 'enchente', { ramos: { industria: 0.96, montadora: 0.96 } }], ['US', 'furacao', { ramos: { energia: 1.05 } }],
  ['ID', 'terremoto'], ['PH', 'furacao'], ['TR', 'terremoto'], ['IN', 'calor'], ['AU', 'incendio'], ['CL', 'terremoto'], ['MX', 'furacao'],
  ['IT', 'terremoto'], ['BD', 'enchente'], ['PK', 'enchente'], ['CA', 'incendio'], ['PT', 'incendio'], ['ES', 'calor'], ['NP', 'terremoto']
];

/** Como cada perigo é contado: [título, longe (no país X), aqui (a região de casa)]. */
export const TEXTO_PERIGO: Record<Perigo, [string, string, string]> = {
  terremoto: ['Terremoto', 'Um terremoto forte {no}: prédios no chão, gente procurando parentes nos escombros.', 'O chão tremeu na região. Rachadura na parede, a noite dormindo na rua, a cidade contando os estragos.'],
  furacao: ['Tempestade gigante', 'Um furacão {no} arrancou telhados e derrubou a energia de milhões de casas.', 'Uma tempestade gigante passou pela região: telhado voando, energia cortada por dias.'],
  enchente: ['Enchente', 'Enchentes deixaram cidades inteiras debaixo d\'água {no}.', 'Choveu em dias o que chove em meses e a região alagou: rua virou rio, casa perdeu móvel, escola virou abrigo.'],
  calor: ['Onda de calor', 'Uma onda de calor histórica {no} lotou hospitais e deixou cidades sem energia.', 'Uma onda de calor fora do normal tomou a região: ventilador esgotado, falta de luz, gente passando mal na rua.'],
  incendio: ['Incêndios', 'Incêndios florestais queimaram por semanas {no}, e a fumaça cobriu cidades inteiras.', 'O fogo tomou o mato da região por semanas. A fumaça entrava pela janela.'],
  seca: ['Seca', 'Uma seca longa {no} secou rios e derrubou a colheita.', 'A chuva não veio para a região: reservatório no fim, água racionada, feira mais cara.']
};

/** Acordos e tensões no cenário internacional (com o que mudam). */
export const CENARIO_INTERNACIONAL: { chave: string; titulo: string; texto: string; mods: EfeitosMundo14; dura?: number; inflacao?: number }[] = [
  { chave: 'acordo_comercial', titulo: 'Acordo comercial', texto: 'O país assinou um acordo comercial grande com outro bloco. Abriu mercado para quem exporta — e concorrência para quem não se mexer.', mods: { setores: { agro: 1.06, industria: 1.04, logistica: 1.05 } }, dura: 2 },
  { chave: 'carbono', titulo: 'Taxa sobre o carbono', texto: 'Os grandes mercados passaram a cobrar uma taxa de quem polui para produzir. Energia limpa virou negócio; fábrica antiga, problema.', mods: { ramos: { energia: 1.08, industria: 0.96, montadora: 0.97 }, setores: { engenharia: 1.04 } }, dura: 3 },
  { chave: 'conflito', titulo: 'Guerra do outro lado do mundo', texto: 'Uma guerra estourou entre dois países do outro lado do mundo. Rotas de comércio fechadas, preços mexendo, refugiados nas fronteiras.', mods: { ramos: { aerea: 0.92, energia: 1.05 } }, inflacao: 0.01 },
  { chave: 'paz', titulo: 'Um acordo de paz', texto: 'Um acordo de paz encerrou uma guerra longa do outro lado do mundo. As rotas de comércio reabriram.', mods: { ramos: { aerea: 1.04 }, setores: { logistica: 1.03 } } }
];

/** Rótulos para explicar os efeitos (só o que o motor aplica). */
export const ROTULO_SETOR14: Record<string, string> = {
  comercio: 'comércio', alimentacao: 'bares e restaurantes', beleza: 'beleza', cuidado: 'cuidado', transporte: 'transporte', logistica: 'logística e entregas',
  industria: 'indústria', construcao: 'construção', manutencao: 'manutenção e instalação', agro: 'campo', saude: 'saúde', educacao: 'educação',
  tecnologia: 'tecnologia', criativo: 'economia criativa', comunicacao: 'comunicação', esporte: 'esporte', seguranca: 'segurança', publico: 'serviço público',
  financas: 'finanças', juridico: 'direito', administrativo: 'escritório', engenharia: 'engenharia'
};
export const ROTULO_RAMO14: Record<string, string> = {
  restaurante: 'restaurantes', hotel: 'hotéis', academia: 'academias', estudio: 'estúdios', loja: 'lojas', museu: 'museus', zoologico: 'zoológicos',
  online: 'lojas online', clinica: 'clínicas', produto: 'produtos próprios', tecnologia: 'empresas de tecnologia', construtora: 'construtoras',
  industria: 'indústrias', montadora: 'montadoras', banco: 'bancos', aerea: 'companhias aéreas', aeroespacial: 'empresas aeroespaciais',
  semicondutores: 'fábricas de chips', energia: 'empresas de energia', infraestrutura: 'infraestrutura'
};
