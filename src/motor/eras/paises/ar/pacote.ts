/**
 * ERAS v3 · ARGENTINA (1945–2025) — o pacote de época (dados puros; fonte em cada item). Começa em 1945 porque a série
 * oficial de preços ao consumidor (INDEC, IPC da Grande Buenos Aires) começa em 1943: antes dela, não há dado confiável
 * para mostrar o dinheiro da época sem inventar.
 *
 * Fontes gerais: InfoLEG e Boletín Oficial (leis e decretos); INDEC (preços, censos, Encuesta Permanente de Hogares);
 * Banco Central de la República Argentina (moedas); Archivo General de la Nación; Casa Rosada (presidentes); CONADEP
 * ("Nunca Más", 1984) e Secretaría de Derechos Humanos; Ministerio de Defensa (Malvinas). Anos de popularização:
 * aproximação [A] lida dos censos de 1960–2010 e da EPH.
 */
import type { PacoteDeEra } from '../../base/pacote';
import * as S from './serie';
import { SOCIEDADE_AR } from './sociedade';

const t = (a: number, m: number) => a * 12 + m - 1;

export const PACOTE: PacoteDeEra = {
  sociedade: SOCIEDADE_AR,
  pais: 'AR',
  nome: 'Argentina',
  desde: 1945,
  serie: S,
  moedas: [
    { id: 'AR_MN', nome: 'peso moeda nacional', plural: 'pesos moeda nacional', simbolo: 'm$n', desde: -Infinity, dataOficial: '1881', porAtual: 1e13, fonte: 'Lei 1.130/1881 (peso moneda nacional); BCRA.' },
    { id: 'AR_LEY', nome: 'peso lei 18.188', plural: 'pesos', simbolo: '$', desde: t(1970, 1), dataOficial: '1º de janeiro de 1970', porAtual: 1e11, troca: '$ 1 = m$n 100', fonte: 'Lei 18.188/1969; BCRA.' },
    { id: 'AR_PA', nome: 'peso argentino', plural: 'pesos argentinos', simbolo: '$a', desde: t(1983, 6), dataOficial: '1º de junho de 1983', porAtual: 1e7, troca: '$a 1 = $ 10.000', fonte: 'Lei 22.707/1982 (em vigor em 01/06/1983); BCRA.' },
    { id: 'AR_AUSTRAL', nome: 'austral', plural: 'australes', simbolo: '₳', desde: t(1985, 6), dataOficial: '15 de junho de 1985 (Plano Austral)', porAtual: 1e4, troca: '₳ 1 = $a 1.000', fonte: 'Decreto 1.096/1985 (Plano Austral); BCRA.' },
    { id: 'ARS', nome: 'peso', plural: 'pesos', simbolo: '$', desde: t(1992, 1), dataOficial: '1º de janeiro de 1992', porAtual: 1, troca: '$ 1 = ₳ 10.000 (= US$ 1 na conversibilidade)', fonte: 'Decreto 2.128/1991; Lei 23.928/1991 (conversibilidade); BCRA.' }
  ],
  acontecimentos: [
    { id: 'dezessete_outubro', data: [1945, 10], categoria: 'politica', titulo: 'O 17 de outubro', fato: 'Em 17 de outubro de 1945, trabalhadores dos subúrbios encheram a Praça de Maio para exigir a libertação do coronel Juan Domingo Perón; nascia o peronismo.', peso: 'biografia', idadeMin: 8, fonte: 'Archivo General de la Nación; Instituto Nacional Juan Domingo Perón.' },
    { id: 'peron_46', data: [1946, 6], categoria: 'politica', titulo: 'Perón presidente', fato: 'Em junho de 1946, Perón assumiu a presidência: férias pagas, décimo terceiro, aposentadorias, sindicatos fortes — e a imprensa e a oposição cada vez mais cerceadas.', peso: 'biografia', idadeMin: 8, pessoal: { trabalho: 'No seu trabalho, chegaram o décimo terceiro e as férias pagas.' }, fonte: 'Casa Rosada; Decreto 33.302/1945 (aguinaldo).' },
    { id: 'voto_mulher_ar', data: [1947, 9], categoria: 'direitos', titulo: 'O voto feminino', fato: 'Em 23 de setembro de 1947, a Lei 13.010 deu às mulheres o direito de votar e ser votadas; elas votaram pela primeira vez em novembro de 1951.', peso: 'biografia', pessoal: { mulher: 'Em 1951, você votou pela primeira vez.' }, fonte: 'Lei 13.010/1947 (InfoLEG); Cámara Nacional Electoral.' },
    { id: 'universidade_gratis', data: [1949, 11], categoria: 'sociedade', titulo: 'A universidade gratuita', fato: 'Em novembro de 1949, um decreto acabou com as mensalidades das universidades nacionais; a universidade pública e gratuita virou marca do país.', peso: 'cotidiano', idadeMin: 12, fonte: 'Decreto 29.337/1949 (Boletín Oficial).' },
    { id: 'tv_51', data: [1951, 10], categoria: 'tecnologia', titulo: 'A televisão chega', fato: 'Em 17 de outubro de 1951, o Canal 7 de Buenos Aires fez a primeira transmissão de televisão do país.', peso: 'cotidiano', fonte: 'Televisión Pública Argentina; Archivo General de la Nación.' },
    { id: 'evita', data: [1952, 7], categoria: 'politica', titulo: 'A morte de Eva Perón', fato: 'Em 26 de julho de 1952 morreu Eva Perón, aos 33 anos; as filas para o velório atravessaram a cidade durante dias.', peso: 'biografia', idadeMin: 6, fonte: 'Archivo General de la Nación; Museo Evita.' },
    { id: 'bombardeio_55', data: [1955, 6], categoria: 'politica', titulo: 'O bombardeio da Praça de Maio', fato: 'Em 16 de junho de 1955, aviões da Marinha bombardearam a Praça de Maio numa tentativa de golpe; mais de 300 civis morreram.', peso: 'biografia', divisoes: ['C', 'B'], idadeMin: 6, fonte: 'Secretaría de Derechos Humanos (investigação de 2010); Archivo Nacional de la Memoria.' },
    { id: 'golpe_55', data: [1955, 9], categoria: 'politica', titulo: 'A "Revolução Libertadora"', fato: 'Em setembro de 1955, um golpe militar derrubou Perón, que partiu para o exílio. O peronismo foi proscrito: até dizer o nome de Perón em público passou a ser crime.', peso: 'biografia', idadeMin: 8, fonte: 'Decreto-Lei 4.161/1956 (Boletín Oficial); Archivo General de la Nación.' },
    { id: 'golpe_66', data: [1966, 6], categoria: 'politica', titulo: 'O golpe de Onganía', fato: 'Em 28 de junho de 1966, os militares derrubaram o presidente Illia, fecharam o Congresso e proibiram os partidos. Um mês depois, a polícia invadiu as universidades a pauladas ("a noite dos bastões longos") e centenas de professores deixaram o país.', peso: 'biografia', idadeMin: 10, fonte: 'Archivo General de la Nación; Universidad de Buenos Aires (memória de 29/07/1966).' },
    { id: 'cordobazo', data: [1969, 5], categoria: 'sociedade', titulo: 'O Cordobazo', fato: 'Em 29 de maio de 1969, operários das fábricas de automóveis e estudantes tomaram as ruas de Córdoba contra a ditadura; o protesto abalou o regime.', peso: 'biografia', divisoes: ['X'], idadeMin: 8, fonte: 'Archivo Provincial de la Memoria (Córdoba); Universidad Nacional de Córdoba.' },
    { id: 'volta_peron', data: [1973, 6], categoria: 'politica', titulo: 'A volta de Perón', fato: 'Em junho de 1973, depois de 18 anos de exílio, Perón voltou ao país — o encontro em Ezeiza terminou em tiroteio entre facções peronistas. Em outubro, assumiu o terceiro mandato; morreu em 1º de julho de 1974.', peso: 'biografia', idadeMin: 8, fonte: 'Casa Rosada; Archivo General de la Nación.' },
    { id: 'rodrigazo', data: [1975, 6], categoria: 'economia', titulo: 'O Rodrigazo', fato: 'Em junho de 1975, um pacote econômico dobrou de uma vez os preços da gasolina e das tarifas e desvalorizou o peso: a inflação daquele ano passou de 180%.', peso: 'cotidiano', mods: { clientela: -6, reajuste: -0.03 }, fonte: 'BCRA; INDEC.' },
    { id: 'golpe_76', data: [1976, 3], categoria: 'politica', titulo: 'O golpe de 1976', fato: 'Em 24 de março de 1976, as Forças Armadas tomaram o poder. Começou o terrorismo de Estado: sequestros, centros clandestinos de detenção, torturas e desaparecimentos — 8.961 casos documentados pela CONADEP; os organismos de direitos humanos estimam 30 mil.', peso: 'biografia', idadeMin: 8, fonte: 'CONADEP, "Nunca Más" (1984); Secretaría de Derechos Humanos; Archivo Nacional de la Memoria.' },
    { id: 'maes', data: [1977, 4], categoria: 'direitos', titulo: 'As Mães da Praça de Maio', fato: 'Em 30 de abril de 1977, mães de desaparecidos começaram a caminhar em círculos na Praça de Maio, com lenços brancos na cabeça, perguntando onde estavam os filhos.', peso: 'cotidiano', idadeMin: 10, fonte: 'Asociación Madres de Plaza de Mayo; Archivo Nacional de la Memoria.' },
    { id: 'mundial_78', data: [1978, 6], categoria: 'esporte', titulo: 'Campeã do mundo em casa', fato: 'Em 25 de junho de 1978, a Argentina venceu a Holanda e ganhou a Copa do Mundo disputada no país — a poucas quadras de um centro clandestino de detenção.', peso: 'biografia', fonte: 'FIFA; Archivo Nacional de la Memoria (ESMA).' },
    { id: 'malvinas', data: [1982, 4], categoria: 'guerra', titulo: 'A Guerra das Malvinas', fato: 'Em 2 de abril de 1982, a ditadura ocupou as ilhas Malvinas; a guerra com o Reino Unido durou até 14 de junho e matou 649 argentinos, muitos deles recrutas de 18 e 19 anos.', peso: 'biografia', idadeMin: 6, fonte: 'Ministerio de Defensa; Comisión Nacional de Ex-Combatientes.' },
    { id: 'democracia_83', data: [1983, 10], categoria: 'politica', titulo: 'A volta da democracia', fato: 'Em 30 de outubro de 1983, Raúl Alfonsín ganhou a eleição presidencial; em 10 de dezembro, a democracia voltou. Em 1984, o relatório "Nunca Más" e, em 1985, o julgamento das juntas militares.', peso: 'biografia', idadeMin: 8, fonte: 'Cámara Nacional Electoral; CONADEP; sentença da Causa 13/84 (09/12/1985).' },
    { id: 'plano_austral', data: [1985, 6], categoria: 'economia', titulo: 'O Plano Austral', fato: 'Em junho de 1985, o Plano Austral trocou a moeda e congelou preços para frear uma inflação de 30% ao mês; funcionou por pouco tempo.', peso: 'cotidiano', idadeMin: 12, fonte: 'BCRA; Decreto 1.096/1985.' },
    { id: 'mexico_86', data: [1986, 6], categoria: 'esporte', titulo: 'O bicampeonato no México', fato: 'Em 29 de junho de 1986, a Argentina de Maradona venceu a Alemanha Ocidental e ganhou a segunda Copa do Mundo.', peso: 'biografia', fonte: 'FIFA.' },
    { id: 'divorcio_87', data: [1987, 6], categoria: 'direitos', titulo: 'A lei do divórcio', fato: 'Em junho de 1987, a Lei 23.515 instituiu o divórcio que permite voltar a casar; até então, quem se separava não podia se casar de novo no país.', peso: 'cotidiano', idadeMin: 16, fonte: 'Lei 23.515/1987 (InfoLEG).' },
    { id: 'hiper_89', data: [1989, 7], categoria: 'economia', titulo: 'A hiperinflação', fato: 'Em 1989, a inflação chegou a quase 200% em um único mês (julho); houve saques a supermercados, e o presidente Alfonsín entregou o cargo antes do prazo.', peso: 'biografia', idadeMin: 6, especial: { tipo: 'hiperinflacao', fica: 0.5, texto: 'O que a família tinha em australes evaporou; quem tinha algum dólar guardado em casa se salvou.' }, mods: { demissao: 1.3, contratacao: -0.08, clientela: -10 }, fonte: 'INDEC (IPC mensal); BCRA.' },
    { id: 'bonex', data: [1990, 1], categoria: 'economia', titulo: 'O Plano Bonex', fato: 'Em 1º de janeiro de 1990, os depósitos a prazo foram trocados à força por títulos em dólar a dez anos; quem precisou vender os títulos logo perdeu boa parte do dinheiro.', peso: 'cotidiano', idadeMin: 18, especial: { tipo: 'congelamento', limite: 600, voltaEm: t(1991, 1), parcelas: 1, perda: 0.35, texto: 'As aplicações da família viraram títulos que ninguém queria comprar.' }, fonte: 'Decreto 36/1990 (Boletín Oficial); BCRA.' },
    { id: 'conversibilidade', data: [1991, 4], categoria: 'economia', titulo: 'A conversibilidade: um peso, um dólar', fato: 'Em 1º de abril de 1991, a lei da conversibilidade fixou 10 mil australes por dólar (em 1992, um peso por dólar). A inflação caiu a quase zero; as privatizações e o desemprego vieram junto.', peso: 'biografia', idadeMin: 10, fonte: 'Lei 23.928/1991 (InfoLEG); BCRA.' },
    { id: 'amia', data: [1994, 7], categoria: 'desastre', titulo: 'O atentado à AMIA', fato: 'Em 18 de julho de 1994, um carro-bomba destruiu a sede da associação mutual judaica AMIA em Buenos Aires: 85 mortos. Dois anos antes, a embaixada de Israel também tinha sido atacada.', peso: 'biografia', divisoes: ['C', 'B'], idadeMin: 8, fonte: 'Unidad Fiscal AMIA (Ministerio Público Fiscal); AMIA.' },
    { id: 'fim_colimba', data: [1994, 12], categoria: 'politica', titulo: 'O fim do serviço militar obrigatório', fato: 'Em dezembro de 1994, depois do assassinato de um recruta num quartel de Neuquén, a lei acabou com o serviço militar obrigatório.', peso: 'cotidiano', idadeMin: 12, fonte: 'Lei 24.429/1994 (InfoLEG).' },
    { id: 'corralito', data: [2001, 12], categoria: 'economia', titulo: 'O "corralito" e o fim de 2001', fato: 'Em dezembro de 2001, os saques bancários foram limitados a 250 pesos por semana; vieram os panelaços, as mortes nos protestos de 19 e 20 de dezembro, a renúncia do presidente e, em janeiro, o fim da conversibilidade: o peso perdeu dois terços do valor.', peso: 'biografia', idadeMin: 6, especial: { tipo: 'congelamento', limite: 900, voltaEm: t(2003, 4), parcelas: 1, perda: 0.45, texto: 'O dinheiro da família ficou preso no banco.' }, mods: { demissao: 1.5, contratacao: -0.12, clientela: -12 }, dura: 1, pessoal: { semTrabalho: 'Sem emprego, você entrou na fila do plano social de 150 pesos.' }, fonte: 'Decreto 1.570/2001 (Boletín Oficial); BCRA; INDEC (desemprego de 21,5% em maio de 2002).' },
    { id: 'casamento_10', data: [2010, 7], categoria: 'direitos', titulo: 'O casamento igualitário', fato: 'Em 15 de julho de 2010, a Argentina aprovou o casamento entre pessoas do mesmo sexo — o primeiro país da América Latina a fazê-lo; em 2012 veio a lei de identidade de gênero.', peso: 'cotidiano', idadeMin: 12, fonte: 'Lei 26.618/2010; Lei 26.743/2012 (InfoLEG).' },
    { id: 'papa', data: [2013, 3], categoria: 'cultura', titulo: 'Um papa argentino', fato: 'Em 13 de março de 2013, o arcebispo de Buenos Aires, Jorge Mario Bergoglio, foi eleito papa — Francisco.', peso: 'cotidiano', fonte: 'Santa Sé.' },
    { id: 'covid_ar', data: [2020, 3], categoria: 'saude', titulo: 'A quarentena', fato: 'Em 20 de março de 2020 começou o isolamento social obrigatório, um dos mais longos do mundo; as escolas ficaram fechadas por quase um ano.', peso: 'biografia', idadeMin: 4, mods: { clientela: -9, contratacao: -0.08 }, fonte: 'Decreto 297/2020 (Boletín Oficial).' },
    { id: 'aborto_20', data: [2020, 12], categoria: 'direitos', titulo: 'O aborto legal', fato: 'Em 30 de dezembro de 2020, o Senado aprovou a lei de interrupção voluntária da gravidez até a 14ª semana, depois de anos de mobilização com o lenço verde.', peso: 'cotidiano', idadeMin: 14, fonte: 'Lei 27.610/2020 (InfoLEG).' },
    { id: 'catar_22', data: [2022, 12], categoria: 'esporte', titulo: 'O tricampeonato no Catar', fato: 'Em 18 de dezembro de 2022, a Argentina de Messi venceu a França nos pênaltis e ganhou a terceira Copa do Mundo; milhões foram às ruas.', peso: 'biografia', fonte: 'FIFA.' },
    { id: 'inflacao_23', data: [2023, 12], categoria: 'economia', titulo: 'Inflação de três dígitos', fato: 'Em 2023, a inflação passou de 200% ao ano; em dezembro, o novo governo desvalorizou o peso pela metade e cortou gastos.', peso: 'cotidiano', idadeMin: 12, mods: { clientela: -6 }, fonte: 'INDEC (IPC); BCRA.' }
  ],
  tecnologias: {
    eletricidade: { chega: 1887, popular: 1935, massa: 1955, fonte: 'Aproximação: rede elétrica em Buenos Aires desde o fim do século XIX; ampla maioria das casas urbanas eletrificadas em 1960 (Censo Nacional de 1960).' },
    agua_encanada: { chega: 1880, popular: 1950, massa: 1975, fonte: 'Aproximação (censos de 1960 e 1980).' },
    fogao_gas: { chega: 1920, popular: 1950, massa: 1965, fonte: 'Aproximação: gás natural da Gas del Estado (1945) e o botijão no interior.' },
    geladeira: { chega: 1935, popular: 1960, massa: 1975, fonte: 'Aproximação: geladeiras nacionais desde os anos 1940 (censos).' },
    radio: { chega: 1920, popular: 1935, massa: 1950, fonte: 'Primeira transmissão regular: Buenos Aires, 27/08/1920 ("los locos de la azotea").' },
    tv: { chega: 1951, popular: 1962, massa: 1970, fonte: 'Canal 7, 17/10/1951; maioria das casas com TV por volta de 1970 (aproximação).' },
    tv_cores: { chega: 1980, popular: 1985, massa: 1992, fonte: 'Transmissão regular em cores desde 01/05/1980 (aproximação para a difusão).' },
    maquina_lavar: { chega: 1950, popular: 1975, massa: 1990, fonte: 'Aproximação.' },
    aviao: { chega: 1929, popular: 1995, massa: 9999, fonte: 'Aeroposta Argentina, 1929 (aproximação para a popularização).' },
    telefone_fixo: { chega: 1881, popular: 1990, massa: 2000, fonte: 'Aproximação: anos de espera por uma linha da estatal até a privatização (1990); maioria das casas com telefone fixo por volta de 2000 (Censo 2001).' },
    orelhao: { chega: 1930, popular: 1955, massa: 1955, fim: 2015, fonte: 'Aproximação: telefones públicos de ficha e os locutórios.' },
    pager: { chega: 1988, popular: 1993, massa: 9999, fim: 2002, fonte: 'Aproximação.' },
    celular: { chega: 1989, popular: 1998, massa: 2004, fonte: 'Primeiro serviço celular: novembro de 1989 (aproximação para a difusão; o pré-pago a partir de 1997).' },
    sms: { chega: 2000, popular: 2003, massa: 2006, fim: 2016, fonte: 'Aproximação.' },
    smartphone: { chega: 2009, popular: 2012, massa: 2015, fonte: 'Aproximação (INDEC, Acesso e uso de TIC).' },
    mensageiro_app: { chega: 2011, popular: 2013, massa: 2015, fonte: 'Aproximação.' },
    computador: { chega: 1983, popular: 1998, massa: 2010, fonte: 'Aproximação (INDEC, EPH-TIC).' },
    internet: { chega: 1995, popular: 2002, massa: 2010, fonte: 'Internet comercial desde 1995 (aproximação).' },
    banda_larga: { chega: 2001, popular: 2007, massa: 2012, fonte: 'Aproximação.' },
    email: { chega: 1995, popular: 2002, massa: 2010, fonte: 'Aproximação.' },
    mensageiro_pc: { chega: 1998, popular: 2003, massa: 9999, fim: 2013, fonte: 'Aproximação.' },
    lan_house: { chega: 1999, popular: 2002, massa: 2004, fim: 2014, fonte: 'Os "cibers" e locutórios com computador, principal acesso de muitos bairros nos anos 2000 (aproximação).' },
    rede_comunidades: { chega: 2004, popular: 2006, massa: 2008, fim: 2012, fonte: 'Os fotologs e as primeiras redes, muito populares entre os jovens de 2004 a 2008 (aproximação).' },
    redes_modernas: { chega: 2008, popular: 2010, massa: 2013, fonte: 'Aproximação.' },
    app_namoro: { chega: 2013, popular: 2015, massa: 2018, fonte: 'Aproximação.' },
    streaming: { chega: 2011, popular: 2015, massa: 2019, fonte: 'Aproximação.' },
    internet_banking: { chega: 1998, popular: 2005, massa: 2012, fonte: 'Aproximação.' },
    banco_app: { chega: 2012, popular: 2016, massa: 2019, fonte: 'Aproximação.' },
    pix: { chega: 9999, popular: 9999, massa: 9999, fonte: 'Sistema brasileiro (não existe no país).' },
    ia_conversa: { chega: 2022, popular: 2023, massa: 9999, fonte: 'Aproximação.' },
    tv_tela_fina: { chega: 2004, popular: 2010, massa: 2014, fonte: 'Aproximação.' },
    videocassete: { chega: 1980, popular: 1986, massa: 9999, fim: 2006, fonte: 'Aproximação.' },
    toca_fitas: { chega: 1968, popular: 1975, massa: 1985, fim: 2005, fonte: 'Aproximação.' },
    walkman: { chega: 1981, popular: 1987, massa: 9999, fim: 2003, fonte: 'Aproximação.' },
    vinil: { chega: 1950, popular: 1962, massa: 9999, fim: 1995, fonte: 'Aproximação.' },
    cd: { chega: 1987, popular: 1993, massa: 1998, fim: 2012, fonte: 'Aproximação.' },
    dvd: { chega: 1999, popular: 2004, massa: 2008, fim: 2016, fonte: 'Aproximação.' },
    mp3: { chega: 2000, popular: 2005, massa: 9999, fim: 2012, fonte: 'Aproximação.' },
    camera_filme: { chega: 1900, popular: 1965, massa: 1985, fim: 2006, fonte: 'Aproximação.' },
    camera_digital: { chega: 1998, popular: 2004, massa: 2008, fim: 2015, fonte: 'Aproximação.' },
    videogame_cartucho: { chega: 1982, popular: 1989, massa: 9999, fim: 1999, fonte: 'Aproximação (consoles e clones de cartucho).' },
    videogame_disco: { chega: 1996, popular: 2001, massa: 9999, fim: 2013, fonte: 'Aproximação.' },
    videogame_atual: { chega: 2013, popular: 2016, massa: 9999, fonte: 'Aproximação.' },
    notebook: { chega: 1993, popular: 2008, massa: 2014, fonte: 'Aproximação.' },
    tablet: { chega: 2010, popular: 2013, massa: 9999, fonte: 'Aproximação.' }
  },
  lembrancas: [
    { id: 'asado', de: 1945, ate: 2025, idade: [4, 90], tipo: 'comida', texto: 'O assado do domingo: o avô na grelha desde cedo, a família inteira em volta da mesa até a tarde.' },
    { id: 'mate', de: 1945, ate: 2025, idade: [10, 90], tipo: 'casa', texto: 'O mate passando de mão em mão na roda, a garrafa térmica embaixo do braço, a conversa sem pressa.' },
    { id: 'radio_tango', de: 1945, ate: 1960, idade: [8, 80], tipo: 'radio', exige: 'radio', texto: 'O tango e as radionovelas no rádio da cozinha; as orquestras tocando nos bailes de sábado do clube do bairro.' },
    { id: 'potrero', de: 1945, ate: 1995, idade: [6, 16], tipo: 'esporte', meio: 'urbano', texto: 'O futebol no terreno baldio do bairro — o "potrero" —, com os casacos fazendo de trave até escurecer.' },
    { id: 'presentes_evita', de: 1947, ate: 1955, idade: [4, 12], tipo: 'festa', texto: 'No Natal, chegava a caixa da Fundação Eva Perón: sidra, pão doce e um brinquedo para cada criança da casa.' },
    { id: 'clube_bairro', de: 1945, ate: 2025, idade: [6, 80], tipo: 'esporte', meio: 'urbano', texto: 'O clube do bairro: a piscina no verão, o basquete na quadra, o baile e a sede onde todo mundo se conhecia.' },
    { id: 'colectivo', de: 1945, ate: 1995, idade: [8, 80], tipo: 'rua', meio: 'urbano', texto: 'Os ônibus coletivos pintados à mão com filetes coloridos, frases e santinhos no painel do motorista.' },
    { id: 'carnaval_agua', de: 1945, ate: 1990, idade: [6, 16], tipo: 'brincadeira', texto: 'O carnaval de bairro com balões de água jogados de uma calçada para a outra e as fantasias feitas em casa.' },
    { id: 'tv_familia', de: 1958, ate: 1980, idade: [4, 70], tipo: 'tv', exige: 'tv', texto: 'A televisão em preto e branco na sala, com a família reunida para os programas de humor e as novelas.' },
    { id: 'rock_nacional_ar', de: 1967, ate: 1990, idade: [14, 30], tipo: 'musica', texto: 'O rock em espanhol nos recitais lotados e nas fitas gravadas — cantado baixo nos anos da ditadura, gritado depois.' },
    { id: 'colimba', de: 1945, ate: 1994, idade: [18, 22], tipo: 'escola', texto: 'O número do documento sorteado decidia: um ano de "colimba" num quartel longe de casa — ou a dispensa e a festa.' },
    { id: 'silencio_76', de: 1976, ate: 1983, idade: [10, 80], tipo: 'rua', texto: 'Os anos do medo: não se falava de política nem no ônibus; livros enterrados no quintal; carros sem placa passando devagar.' },
    { id: 'plata_dulce', de: 1979, ate: 1981, idade: [18, 70], tipo: 'casa', texto: 'Os anos do dólar barato: quem podia, viajava para fora e voltava com malas de eletrônicos importados.' },
    { id: 'locutorio', de: 1995, ate: 2010, idade: [12, 80], tipo: 'rua', meio: 'urbano', texto: 'O locutório da esquina: cabines de telefone para ligar para longe, computador por hora e as cópias de documentos.' },
    { id: 'panelaco', de: 2001, ate: 2002, idade: [8, 80], tipo: 'rua', meio: 'urbano', texto: 'O barulho das panelas batidas nas janelas e nas esquinas, noite após noite: "que se vayan todos".' },
    { id: 'clube_troca', de: 2001, ate: 2003, idade: [16, 80], tipo: 'casa', texto: 'Os clubes de troca: roupa por comida, conserto por pão, e os vales de papel no lugar do peso.' },
    { id: 'fotolog', de: 2004, ate: 2008, idade: [13, 22], tipo: 'brincadeira', texto: 'A página de fotos com uma foto por dia, os comentários dos amigos e o "flogger" de franja nas praças.' },
    { id: 'pena_folclore', de: 1945, ate: 2025, idade: [12, 80], tipo: 'musica', divisoes: ['A', 'T', 'Y'], texto: 'A peña de folclore: zambas e chacareiras com violão e bombo até tarde, e a dança com o lenço na mão.' },
    { id: 'vindima', de: 1945, ate: 2025, idade: [6, 80], tipo: 'festa', divisoes: ['M'], texto: 'A Festa da Vindima: o desfile dos carros alegóricos, a rainha eleita e a cidade inteira cheirando a uva.' },
    { id: 'cuarteto', de: 1945, ate: 2025, idade: [14, 60], tipo: 'musica', divisoes: ['X'], texto: 'Os bailes de cuarteto de sábado, o ritmo de Córdoba que lota os clubes até o amanhecer.' }
  ],
  regras: [
    { id: 'ar_voto_mulher', tema: 'voto_feminino', quem: 'mulher', de: 1945, ate: 1951, valor: 18, texto: 'Mulher ainda não votava: o voto feminino seria aprovado em 1947 e exercido pela primeira vez em 1951.', fonte: 'Lei 13.010/1947.' },
    { id: 'ar_sem_eleicoes_55', tema: 'sem_eleicoes', de: 1955, ate: 1958, texto: 'Era um governo militar: sem eleições, com o peronismo proscrito.', fonte: 'Archivo General de la Nación (governo de facto de 1955–1958).' },
    { id: 'ar_sem_eleicoes_66', tema: 'sem_eleicoes', de: 1966, ate: 1973, texto: 'A ditadura de 1966 fechou o Congresso e proibiu os partidos: não havia eleição a disputar.', fonte: 'Estatuto de la Revolución Argentina (1966).' },
    { id: 'ar_sem_eleicoes_76', tema: 'sem_eleicoes', de: 1976, ate: 1983, texto: 'A ditadura de 1976 suspendeu os partidos e as eleições: militância podia custar a vida.', fonte: 'Acta del Proceso de Reorganización Nacional (24/03/1976).' },
    { id: 'ar_proscricao', tema: 'censura', de: 1956, ate: 1973, valor: 18, texto: 'O peronismo estava proscrito: dizer o nome de Perón, cantar a marcha ou mostrar a foto dele em público podia dar cadeia.', fonte: 'Decreto-Lei 4.161/1956 (Boletín Oficial).' },
    { id: 'ar_terror', tema: 'perseguicao', de: 1976, ate: 1983, valor: 16, texto: 'Era o terrorismo de Estado: estudantes, operários, sindicalistas e qualquer suspeito podiam ser sequestrados e desaparecer; a censura cobria jornais, livros e canções.', fonte: 'CONADEP, "Nunca Más" (1984).' },
    { id: 'ar_sem_divorcio', tema: 'divorcio', de: 1945, ate: 1987, texto: 'Pela lei da época, não havia divórcio que permitisse casar de novo (só a separação, exceto por um breve período em 1954–1956).', fonte: 'Lei 2.393/1888; Lei 14.394/1954 (suspensa em 1956); Lei 23.515/1987.' },
    { id: 'ar_casamento_igual', tema: 'casamento_igualitario', de: 1945, ate: 2010, texto: 'o casamento entre pessoas do mesmo sexo ainda não existia (só viria em julho de 2010).', fonte: 'Lei 26.618/2010.' },
    { id: 'ar_editos', tema: 'homossexualidade_crime', quem: 'mesmo_genero', de: 1945, ate: 1998, texto: 'Não era crime, mas os editos policiais permitiam prender alguém por dias por "escândalo" ou pela roupa; o namoro era vivido em segredo.', fonte: 'Edictos policiales (derrogados em Buenos Aires pelo Código de Convivência de 1998).' },
    { id: 'ar_colimba', tema: 'servico_militar', quem: 'homem', de: 1945, ate: 1995, valor: 18, texto: 'Aos 18, o sorteio do serviço militar obrigatório: o número do documento decidia se você ia para o quartel por um ano.', fonte: 'Lei 4.031/1901 (Ley Riccheri) e Lei 17.531/1967; Lei 24.429/1994.' },
    { id: 'ar_universidade', tema: 'escola_obrigatoria', de: 1945, texto: 'A escola primária era obrigatória e gratuita — a escola pública de avental branco que formou gerações.', fonte: 'Lei 1.420/1884 (Ley de Educación Común).' }
  ],
  guerras: [
    { id: 'ar_malvinas', nome: 'a Guerra das Malvinas', de: [1982, 4], ate: [1982, 6], idades: [18, 20], alcance: 0.04, letalidade: 0.045, frente: 'Durante a guerra, a televisão dizia que estávamos ganhando; as escolas juntavam chocolate e cachecóis para os soldados.', fonte: 'Cerca de 14 mil militares nas ilhas, 649 mortos (Ministerio de Defensa). Aproximação [A] sobre os recrutas de 18 a 20 anos.' }
  ],
  governantes: [
    { nome: 'Edelmiro Farrell', cargo: 'presidente de facto', desde: [1944, 2] }, { nome: 'Juan Domingo Perón', cargo: 'presidente', desde: [1946, 6] },
    { nome: 'Eduardo Lonardi / Pedro Aramburu', cargo: 'presidente de facto', desde: [1955, 9] }, { nome: 'Arturo Frondizi', cargo: 'presidente', desde: [1958, 5] },
    { nome: 'José María Guido', cargo: 'presidente', desde: [1962, 3] }, { nome: 'Arturo Illia', cargo: 'presidente', desde: [1963, 10] },
    { nome: 'Juan Carlos Onganía', cargo: 'presidente de facto', desde: [1966, 6] }, { nome: 'Héctor Cámpora', cargo: 'presidente', desde: [1973, 5] },
    { nome: 'Juan Domingo Perón', cargo: 'presidente', desde: [1973, 10] }, { nome: 'María Estela Martínez de Perón', cargo: 'presidenta', desde: [1974, 7] },
    { nome: 'Jorge Rafael Videla', cargo: 'presidente de facto', desde: [1976, 3] }, { nome: 'Raúl Alfonsín', cargo: 'presidente', desde: [1983, 12] },
    { nome: 'Carlos Menem', cargo: 'presidente', desde: [1989, 7] }, { nome: 'Fernando de la Rúa', cargo: 'presidente', desde: [1999, 12] },
    { nome: 'Eduardo Duhalde', cargo: 'presidente', desde: [2002, 1] }, { nome: 'Néstor Kirchner', cargo: 'presidente', desde: [2003, 5] },
    { nome: 'Cristina Fernández de Kirchner', cargo: 'presidenta', desde: [2007, 12] }, { nome: 'Mauricio Macri', cargo: 'presidente', desde: [2015, 12] },
    { nome: 'Alberto Fernández', cargo: 'presidente', desde: [2019, 12] }, { nome: 'Javier Milei', cargo: 'presidente', desde: [2023, 12] }
  ],
  decadas: [
    { decada: 1940, rotulo: 'Anos 1940', contexto: 'O 17 de outubro e o primeiro governo de Perón: salários, sindicatos, a indústria nacional e a figura de Evita.', sociedade: 'O voto feminino (1947, exercido em 1951); direitos trabalhistas novos; a imprensa vigiada.', tecnologia: 'O rádio em todas as casas; a geladeira começa a chegar.', cultura: 'A era de ouro do tango, as radionovelas, o cinema nacional.', dinheiro: 'Peso moeda nacional (m$n).', marcos: ['dezessete_outubro', 'peron_46', 'voto_mulher_ar', 'universidade_gratis'] },
    { decada: 1950, rotulo: 'Anos 1950', contexto: 'A morte de Evita, o bombardeio da Praça de Maio, o golpe de 1955 e o peronismo proibido.', sociedade: 'Proscrição política; o país dividido entre peronistas e antiperonistas.', tecnologia: 'A televisão começa em 1951; a geladeira e o rádio de válvula.', cultura: 'Tango, folclore, o futebol de clubes.', dinheiro: 'Peso moeda nacional, com inflação crescente.', marcos: ['tv_51', 'evita', 'bombardeio_55', 'golpe_55'] },
    { decada: 1960, rotulo: 'Anos 1960', contexto: 'Governos civis frágeis e golpes; em 1966, a ditadura de Onganía; em 1969, o Cordobazo.', sociedade: 'Universidades invadidas, cientistas no exílio; a juventude politizada.', tecnologia: 'A TV na maioria das casas urbanas no fim da década.', cultura: 'O rock em espanhol começa; os quadrinhos de humor.', dinheiro: 'Peso moeda nacional até 1969.', marcos: ['golpe_66', 'cordobazo'] },
    { decada: 1970, rotulo: 'Anos 1970', contexto: 'A volta de Perón, a violência política, o Rodrigazo e o golpe de 1976: o terrorismo de Estado.', sociedade: 'Desaparecimentos, exílio, censura; as Mães da Praça de Maio; a Copa de 1978.', tecnologia: 'TV em preto e branco; cores só em 1980.', cultura: 'Rock nacional cantado baixo, o cinema censurado.', dinheiro: 'Peso lei (desde 1970), com inflação de três dígitos.', marcos: ['volta_peron', 'rodrigazo', 'golpe_76', 'maes', 'mundial_78'] },
    { decada: 1980, rotulo: 'Anos 1980', contexto: 'A guerra das Malvinas, a volta da democracia, o julgamento das juntas e a hiperinflação.', sociedade: 'O "Nunca Más", o divórcio (1987), a liberdade de volta.', tecnologia: 'TV em cores, videocassete.', cultura: 'A explosão do rock nacional, a Copa de 1986.', dinheiro: 'Peso argentino (1983) e austral (1985).', marcos: ['malvinas', 'democracia_83', 'mexico_86', 'hiper_89'] },
    { decada: 1990, rotulo: 'Anos 1990', contexto: 'A conversibilidade — um peso, um dólar —, as privatizações e o desemprego crescendo.', sociedade: 'Fim do serviço militar (1994); o atentado à AMIA.', tecnologia: 'Telefone fixo depois da privatização, celular, TV a cabo.', cultura: 'Rock, cumbia, o futebol na TV paga.', dinheiro: 'Peso conversível (US$ 1).', marcos: ['conversibilidade', 'amia', 'fim_colimba'] },
    { decada: 2000, rotulo: 'Anos 2000', contexto: 'O corralito, a crise de 2001 e a recuperação depois de 2003.', sociedade: 'Desemprego de 20%, clubes de troca, fábricas recuperadas pelos trabalhadores.', tecnologia: 'Cibercafés e locutórios; celular pré-pago.', cultura: 'Cumbia, fotologs, rock de bairro.', dinheiro: 'Peso desvalorizado (2002).', marcos: ['corralito'] },
    { decada: 2010, rotulo: 'Anos 2010', contexto: 'O casamento igualitário, o papa argentino e a inflação voltando a subir.', sociedade: 'Lei de identidade de gênero (2012); o movimento "Ni una menos" (2015).', tecnologia: 'Smartphone, aplicativos de mensagens.', cultura: 'Trap, streaming.', dinheiro: 'Peso com controle cambial e o dólar paralelo.', marcos: ['casamento_10', 'papa'] },
    { decada: 2020, rotulo: 'Anos 2020', contexto: 'A longa quarentena, o aborto legal, a Copa do Catar e a inflação de três dígitos.', sociedade: 'Pobreza acima de 40% em 2023.', tecnologia: 'Pagamento por QR, inteligência artificial que conversa.', cultura: 'Trap, vídeos curtos.', dinheiro: 'Peso; inflação de mais de 200% em 2023.', marcos: ['covid_ar', 'aborto_20', 'catar_22', 'inflacao_23'] }
  ],
  ocupacoes: { jogador_futebol: 1931, jogador_basquete: 1985, tatuador: 1980, piloto_corrida: 1950, dev_jr: 1965, dev_pleno: 1965, dev_senior: 1968, motoboy: 1990, tec_seguranca: 1979 },
  cursos: { computacao: 1963, administracao: 1958, mba: 1990, mestrado: 1970, doutorado: 1920, residencia: 1957, psicologia: 1957, jornalismo: 1960, nutricao: 1935, fisioterapia: 1950, design: 1960, economia: 1913 }
};
