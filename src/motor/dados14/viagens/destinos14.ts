/**
 * VIDA 14 · Viagens — os destinos que vão além do turismo de sempre (`sistemas/experiencias`: a viagem pelo país e a
 * viagem para fora continuam lá, com os destinos e os preços de sempre). Catálogo puro (só tipos; `dados14-viagens`).
 *
 *   negocios   a feira, a sede, o cliente de fora — ligada ao trabalho ou à empresa (`v14/viagens`)
 *   cultural   a viagem para aprender alguma coisa: a língua, a dança, a arte, o templo
 *   evento     o que só acontece numa época: a Oktoberfest, o Carnaval de Veneza, a florada no Japão, a Copa do Mundo
 *   marco      os lugares que todo mundo conhece de foto
 *   luxo       o resort, o cruzeiro, o safári, a neve dos Alpes
 *
 * Preços na unidade do Brasil (reais de hoje, preço de mercado, por pessoa): `passagem` é a ida e volta saindo do
 * Brasil; `diaria`, hotel e o dia no lugar. O motor converte pelo câmbio de quem mora fora (`mundo/moeda`), soma a
 * distância de quem mora no interior e multiplica por quem vai. `paises` são códigos ISO (o que conta em
 * `paisesVisitados`): o cruzeiro passa por vários.
 */
import type { Dominio } from '../../tipos';

export type TipoViagem14 = 'negocios' | 'cultural' | 'evento' | 'marco' | 'luxo';

export interface Destino14 {
  id: string;
  tipo: TipoViagem14;
  /** Como aparece na frase ("Viajou para Kyoto"). */
  nome: string;
  /** Os países (ISO) — o primeiro é o principal. */
  paises: string[];
  /** O nome do país (ou da rota) para a lista. */
  onde: string;
  passagem: number;
  diaria: number;
  /** As durações possíveis, em dias. */
  dias: number[];
  /** Uma linha: o que se vive lá. */
  descricao: string;
  /** O que a viagem pratica (a língua, a dança, o desenho...). */
  dominio?: Dominio;
  /** Negócios: a área em que a feira faz sentido (sem: qualquer trabalho). */
  areas?: string[];
  /** Evento: quando acontece (para a frase). */
  epoca?: string;
}

const d = (id: string, tipo: TipoViagem14, nome: string, paises: string[], onde: string, passagem: number, diaria: number, dias: number[], descricao: string, extra: Partial<Destino14> = {}): Destino14 =>
  ({ id, tipo, nome, paises, onde, passagem, diaria, dias, descricao, ...extra });

export const DESTINOS_14: readonly Destino14[] = [
  // Negócios
  d('neg_sao_paulo', 'negocios', 'São Paulo', ['BR'], 'Brasil', 900, 750, [2, 3, 5], 'As sedes, as feiras do Anhembi e do Expo Center Norte, o almoço que fecha negócio.'),
  d('neg_buenos_aires', 'negocios', 'Buenos Aires', ['AR'], 'Argentina', 2400, 750, [3, 5], 'Cliente e fornecedor do Mercosul, reunião e jantar tarde.'),
  d('neg_nova_york', 'negocios', 'Nova York', ['US'], 'Estados Unidos', 6400, 1700, [3, 5, 7], 'Sedes, bancos e investidores: a reunião em que todo mundo fala rápido.'),
  d('neg_las_vegas', 'negocios', 'Las Vegas (CES)', ['US'], 'Estados Unidos', 6800, 1300, [4, 6], 'A maior feira de tecnologia do mundo, em janeiro.', { areas: ['ti', 'tecnologia', 'comercio', 'vendas'] }),
  d('neg_londres', 'negocios', 'Londres', ['GB'], 'Reino Unido', 6200, 1600, [3, 5, 7], 'A City, os escritórios regionais, o contrato em inglês formal.'),
  d('neg_frankfurt', 'negocios', 'Frankfurt', ['DE'], 'Alemanha', 6000, 1300, [3, 5], 'Feiras industriais e do livro, bancos, compradores europeus.'),
  d('neg_lisboa', 'negocios', 'Lisboa (Web Summit)', ['PT'], 'Portugal', 5600, 950, [3, 5], 'Startups, investidores e palestras, em novembro.', { areas: ['ti', 'tecnologia', 'comunicacao', 'administracao'] }),
  d('neg_dubai', 'negocios', 'Dubai', ['AE'], 'Emirados Árabes Unidos', 7000, 1400, [3, 5], 'Compradores do Golfo, feiras de alimentos e de construção.'),
  d('neg_xangai', 'negocios', 'Xangai', ['CN'], 'China', 9800, 950, [5, 7, 10], 'Fornecedores, fábricas e a feira de Cantão logo ali.'),
  // Experiências culturais
  d('cul_dublin', 'cultural', 'Dublin (curso de inglês)', ['IE'], 'Irlanda', 6200, 650, [14, 28], 'Escola de inglês de manhã, casa de família, pub à noite: a língua entra pelo ouvido.', { dominio: 'idiomas' }),
  d('cul_buenos_tango', 'cultural', 'Buenos Aires (tango)', ['AR'], 'Argentina', 2400, 520, [7, 14], 'Aula de tango de dia, milonga de madrugada em San Telmo.', { dominio: 'danca' }),
  d('cul_florenca', 'cultural', 'Florença e a Toscana', ['IT'], 'Itália', 6000, 950, [7, 14], 'Uffizi, o Davi, um curso de desenho num ateliê renascentista.', { dominio: 'desenho' }),
  d('cul_kyoto', 'cultural', 'Kyoto', ['JP'], 'Japão', 9800, 900, [7, 14], 'Templos, jardins de pedra, a cerimônia do chá, uma pousada de tatame.', { dominio: 'humanas' }),
  d('cul_istambul', 'cultural', 'Istambul', ['TR'], 'Turquia', 6500, 650, [7, 10], 'Santa Sofia, o Grande Bazar e o Bósforo entre dois continentes.', { dominio: 'humanas' }),
  d('cul_marrakech', 'cultural', 'Marrakech', ['MA'], 'Marrocos', 6300, 550, [7, 10], 'A praça Jemaa el-Fna, os souks, uma noite no deserto.', { dominio: 'fotografia' }),
  d('cul_lisboa_letras', 'cultural', 'Lisboa e Coimbra (oficina de escrita)', ['PT'], 'Portugal', 5600, 700, [7, 14], 'Pessoa, Saramago, a universidade velha e uma oficina de escrita.', { dominio: 'escrita' }),
  // Eventos internacionais
  d('evt_oktoberfest', 'evento', 'Munique, na Oktoberfest', ['DE'], 'Alemanha', 6000, 1200, [5, 7], 'Tendas de cervejaria, roupa típica, seis milhões de pessoas.', { epoca: 'setembro e outubro' }),
  d('evt_veneza', 'evento', 'Veneza, no Carnaval', ['IT'], 'Itália', 6000, 1300, [5, 7], 'Máscaras, fantasias de época, os canais lotados.', { epoca: 'fevereiro' }),
  d('evt_hanami', 'evento', 'o Japão, na florada das cerejeiras', ['JP'], 'Japão', 9800, 1100, [7, 14], 'Piquenique debaixo das cerejeiras, de Tóquio a Kyoto.', { epoca: 'fim de março e abril' }),
  d('evt_muertos', 'evento', 'a Cidade do México, no Dia de Muertos', ['MX'], 'México', 4800, 650, [5, 7], 'Altares, calaveras, o desfile e a noite no cemitério.', { epoca: 'fim de outubro e novembro' }),
  d('evt_edimburgo', 'evento', 'Edimburgo, no Festival Fringe', ['GB'], 'Reino Unido', 6200, 1150, [5, 7], 'Três semanas de teatro, comédia e música em cada porão da cidade.', { epoca: 'agosto', dominio: 'teatro' }),
  d('evt_wimbledon', 'evento', 'Londres, em Wimbledon', ['GB'], 'Reino Unido', 6200, 1600, [4, 6], 'Grama, morangos com creme e a fila para o ingresso do dia.', { epoca: 'junho e julho' }),
  // Lugares conhecidos
  d('mar_machu_picchu', 'marco', 'Machu Picchu', ['PE'], 'Peru', 3600, 520, [5, 7, 10], 'A cidade inca na montanha, chegando de trem ou pela trilha.'),
  d('mar_gize', 'marco', 'as Pirâmides de Gizé', ['EG'], 'Egito', 7200, 600, [7, 10], 'As pirâmides, a Esfinge, o Nilo e o museu do Cairo.'),
  d('mar_muralha', 'marco', 'a Grande Muralha e Pequim', ['CN'], 'China', 9800, 800, [7, 10], 'A muralha em Mutianyu, a Cidade Proibida, o pato laqueado.'),
  d('mar_taj_mahal', 'marco', 'o Taj Mahal', ['IN'], 'Índia', 9200, 500, [7, 10], 'Agra ao nascer do sol, Délhi e Jaipur no mesmo roteiro.'),
  d('mar_petra', 'marco', 'Petra', ['JO'], 'Jordânia', 7600, 700, [5, 7], 'A cidade esculpida na pedra rosa e uma noite no Wadi Rum.'),
  d('mar_acropole', 'marco', 'a Acrópole de Atenas', ['GR'], 'Grécia', 6400, 800, [5, 7, 10], 'O Partenon, a Plaka e uma ilha no fim.'),
  d('mar_sagrada', 'marco', 'Barcelona e a Sagrada Família', ['ES'], 'Espanha', 5900, 950, [5, 7], 'Gaudí inteiro, a Rambla e o mar.'),
  d('mar_chichen', 'marco', 'Chichén Itzá', ['MX'], 'México', 5000, 600, [5, 7], 'A pirâmide maia, os cenotes e o Caribe ao lado.'),
  d('mar_angkor', 'marco', 'Angkor Wat', ['KH'], 'Camboja', 11000, 450, [7, 10], 'Os templos na selva, o nascer do sol sobre o lago.'),
  d('mar_pascoa', 'marco', 'a Ilha de Páscoa', ['CL'], 'Chile', 5200, 900, [5, 7], 'Os moais no meio do Pacífico, a mais de três mil quilômetros de tudo.'),
  // Luxo
  d('lux_maldivas', 'luxo', 'as Maldivas', ['MV'], 'Maldivas', 11000, 6500, [5, 7, 10], 'Bangalô sobre a água, hidroavião, mergulho com arraias.'),
  d('lux_cruzeiro', 'luxo', 'um cruzeiro pelo Mediterrâneo', ['IT', 'FR', 'ES', 'GR'], 'Itália, França, Espanha e Grécia', 6200, 3800, [7, 10, 14], 'Cabine com varanda, uma cidade por dia, jantar de gala a bordo.'),
  d('lux_safari', 'luxo', 'um safári no Serengeti', ['TZ'], 'Tanzânia', 9800, 5200, [5, 7, 10], 'A grande migração, o lodge na savana, o Kilimanjaro no horizonte.'),
  d('lux_alpes', 'luxo', 'St. Moritz, nos Alpes', ['CH'], 'Suíça', 6400, 5600, [5, 7], 'Esqui, hotel histórico, trem panorâmico entre as montanhas.'),
  d('lux_dubai', 'luxo', 'Dubai, num hotel de luxo', ['AE'], 'Emirados Árabes Unidos', 7000, 4800, [4, 6], 'Suíte com mordomo, o deserto de quadriciclo, compras sem olhar a etiqueta.'),
  d('lux_paris', 'luxo', 'Paris em palácio', ['FR'], 'França', 6200, 5200, [4, 7], 'Hotel-palácio, alta-costura, jantar com estrelas do guia.')
];

/** A Copa do Mundo (no calendário do jogo: anos pares não múltiplos de 4, `sistemas/competicoes.torneioDeSelecoes`): as
 *  sedes reais escolhidas até agora; depois delas, o motor escolhe entre candidatas plausíveis pelo ano. */
export const SEDES_DA_COPA: Readonly<Record<number, { paises: string[]; onde: string; passagem: number }>> = {
  2026: { paises: ['US', 'MX', 'CA'], onde: 'Estados Unidos, México e Canadá', passagem: 6400 },
  2030: { paises: ['ES', 'PT', 'MA'], onde: 'Espanha, Portugal e Marrocos', passagem: 5800 },
  2034: { paises: ['SA'], onde: 'Arábia Saudita', passagem: 7200 }
};
export const CANDIDATAS_COPA: readonly { paises: string[]; onde: string; passagem: number }[] = [
  { paises: ['GB'], onde: 'Reino Unido', passagem: 6200 }, { paises: ['AU'], onde: 'Austrália', passagem: 11000 },
  { paises: ['JP', 'KR'], onde: 'Japão e Coreia do Sul', passagem: 9800 }, { paises: ['AR', 'UY', 'CL', 'PY'], onde: 'Argentina, Uruguai, Chile e Paraguai', passagem: 2600 },
  { paises: ['DE'], onde: 'Alemanha', passagem: 6000 }, { paises: ['IT'], onde: 'Itália', passagem: 6000 },
  { paises: ['CN'], onde: 'China', passagem: 9800 }, { paises: ['BR'], onde: 'Brasil', passagem: 0 }
];

/** O nome de cada país que aparece aqui (ISO → nome), para quando o país não está no catálogo do mundo. */
export const NOMES_PAISES_14: Readonly<Record<string, string>> = {
  BR: 'Brasil', AR: 'Argentina', UY: 'Uruguai', CL: 'Chile', PY: 'Paraguai', PE: 'Peru', CO: 'Colômbia', MX: 'México', US: 'Estados Unidos', CA: 'Canadá',
  PT: 'Portugal', ES: 'Espanha', FR: 'França', IT: 'Itália', DE: 'Alemanha', GB: 'Reino Unido', IE: 'Irlanda', CH: 'Suíça', GR: 'Grécia', TR: 'Turquia',
  MA: 'Marrocos', EG: 'Egito', TZ: 'Tanzânia', JO: 'Jordânia', AE: 'Emirados Árabes Unidos', SA: 'Arábia Saudita', IN: 'Índia', CN: 'China',
  JP: 'Japão', KR: 'Coreia do Sul', KH: 'Camboja', MV: 'Maldivas', AU: 'Austrália'
};

/** As viagens de sempre (`experiencias`, fato `m_viagem` com o destino pelo nome) → o país (para contar as antigas). */
export const DESTINOS_ANTIGOS_PAIS: Readonly<Record<string, string>> = {
  'Buenos Aires': 'AR', 'Montevidéu': 'UY', 'Santiago': 'CL', 'Cusco e o Vale Sagrado': 'PE', 'Cartagena': 'CO',
  'a Cidade do México': 'MX', 'Lisboa': 'PT', 'Paris': 'FR', 'Roma': 'IT', 'Nova York': 'US', 'Tóquio': 'JP',
  'o Rio de Janeiro': 'BR', 'Salvador': 'BR', 'Foz do Iguaçu': 'BR', 'a Chapada Diamantina': 'BR', 'os Lençóis Maranhenses': 'BR',
  'Bonito': 'BR', 'Ouro Preto': 'BR', 'Jericoacoara': 'BR', 'Fernando de Noronha': 'BR', 'Gramado': 'BR',
  'a Amazônia, a partir de Manaus': 'BR', 'o Pantanal': 'BR'
};
