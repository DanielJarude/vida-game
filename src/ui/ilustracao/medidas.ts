/**
 * VIDA 12.8 — AS MEDIDAS DE CADA OBJETO: largura × profundidade × altura em metros (as de catálogo de móvel e de loja:
 * um sofá de três lugares tem 2,1 m; um par de chuteiras, 30 cm; uma barraca armada, 2,1 m de lado) e COMO ele fica
 * na casa: no chão (encostado, no meio, num canto, ao lado de outro), na parede (a que altura), em cima de uma
 * superfície (a bancada, o aparador, a escrivaninha), deitado no piso (o tapete) ou dentro da piscina (a boia).
 *
 * Quem usa: `disposicao.ts`, que põe cada objeto no seu lugar, sem sobrepor, na escala certa da perspectiva.
 */

export type Montagem = 'chao' | 'parede' | 'superficie' | 'tapete' | 'agua';
/**
 * Onde, no chão: `fundo` (encostado na parede do fundo), `lado` (junto de uma parede lateral), `canto`, `centro`,
 * `frente` (perto de quem olha), `junto` (ao lado de uma âncora), `diante` (na frente de uma âncora), e lá fora `deck`
 * (o deck do fundo da piscina), `deck_lado`, `borda` (a borda da piscina).
 */
export type Zona = 'fundo' | 'lado' | 'canto' | 'centro' | 'frente' | 'junto' | 'diante' | 'deck' | 'deck_lado' | 'borda';

export interface Medida {
  w: number; d: number; h: number;
  m: Montagem;
  z?: Zona[];
  /** Na parede: a altura do pé do objeto (m). */
  alt?: number;
  /** É superfície para coisas pequenas (o tampo, a bancada), a esta altura (m). */
  topo?: number;
  /** `junto` / `diante`: as âncoras (ids de coisa ou de fixo), na ordem de preferência. */
  de?: string[];
  /** `diante`: o vão até a âncora (m; negativo = encaixado, a cadeira sob a mesa). */
  vao?: number;
  /** Âncora do cômodo: entra primeiro, no meio da parede do fundo (o sofá, a cama, a mesa de bilhar). */
  ancora?: boolean;
  /** O desenho é um par (as duas mesas de cabeceira): uma de cada lado da âncora. */
  par?: boolean;
  /** Prefere a parede lateral direita (a TV de frente para o sofá). */
  paredeLado?: boolean;
}

const chao = (w: number, d: number, h: number, z: Zona[], x: Partial<Medida> = {}): Medida => ({ w, d, h, m: 'chao', z, ...x });
const parede = (w: number, h: number, alt: number, x: Partial<Medida> = {}): Medida => ({ w, d: 0.08, h, m: 'parede', alt, ...x });
const sobre = (w: number, d: number, h: number): Medida => ({ w, d, h, m: 'superficie' });
const SOFAS = ['sofa_designer', 'sofa_retratil', 'sofa_couro', 'sofa', 'sofa_cama', 'sofa_externo'];
const CAMAS = ['cama_king', 'colchao_hotel', 'colchao', 'cama_box', 'cama_solteiro', 'beliche'];
const MESAS = ['mesa_executiva', 'escrivaninha', 'home_studio'];

export const MEDIDAS: Record<string, Medida> = {
  // ---------------------------------------------------------- sala
  sofa: chao(2.1, 0.9, 0.85, ['fundo', 'lado'], { ancora: true }),
  sofa_retratil: chao(2.4, 1.0, 0.95, ['fundo', 'lado'], { ancora: true }),
  sofa_couro: chao(2.2, 0.95, 0.85, ['fundo', 'lado'], { ancora: true }),
  sofa_designer: chao(2.7, 1.05, 0.75, ['fundo', 'lado'], { ancora: true }),
  poltrona: chao(0.85, 0.85, 1.0, ['junto', 'canto', 'lado'], { de: SOFAS }),
  poltrona_designer: chao(0.9, 0.9, 0.95, ['junto', 'canto', 'lado'], { de: SOFAS }),
  mesa_centro: chao(1.1, 0.6, 0.4, ['diante', 'centro'], { de: SOFAS, vao: 0.45, topo: 0.4 }),
  mesa_centro_marmore: chao(1.2, 0.7, 0.38, ['diante', 'centro'], { de: SOFAS, vao: 0.45, topo: 0.38 }),
  mesa_lateral: chao(0.45, 0.45, 0.55, ['junto', 'canto'], { de: [...SOFAS, ...CAMAS, 'poltrona', 'poltrona_designer'], topo: 0.55 }),
  estante_sala: chao(2.0, 0.42, 1.9, ['fundo', 'lado'], { topo: 0.55 }),
  aparador: chao(1.6, 0.45, 0.8, ['fundo', 'lado'], { topo: 0.8 }),
  tv: parede(1.25, 0.72, 0.95, { paredeLado: true }),
  tv_oled: parede(1.72, 0.99, 0.85, { paredeLado: true }),
  home_theater: chao(1.4, 0.35, 0.55, ['fundo', 'lado'], { topo: 0.55 }),
  tapete: { w: 2.5, d: 1.7, h: 0.01, m: 'tapete' },
  tapete_persa: { w: 3.0, d: 2.0, h: 0.01, m: 'tapete' },
  quadros: parede(1.3, 0.6, 1.45),
  objetos_decor: sobre(0.45, 0.25, 0.35),
  lareira: chao(1.4, 0.45, 1.1, ['fundo', 'lado'], { topo: 1.1 }),
  mesa_jantar: chao(1.8, 0.95, 0.76, ['lado', 'centro', 'frente'], { topo: 0.76 }),
  som_hifi: chao(0.9, 0.42, 0.6, ['fundo', 'lado'], { topo: 0.6 }),
  discos: chao(0.65, 0.38, 0.55, ['junto', 'lado', 'canto'], { de: ['som_hifi', 'estante_sala', 'aparador'] }),
  aspirador_robo: chao(0.35, 0.35, 0.1, ['frente', 'canto']),
  plantas: chao(0.55, 0.55, 1.2, ['canto', 'lado']),
  vasos_grandes: chao(0.65, 0.65, 1.0, ['canto', 'lado', 'deck_lado']),
  vitrine_colecao: chao(1.0, 0.45, 1.9, ['lado', 'fundo'], { topo: 1.05 }),
  estante_trofeus: chao(1.2, 0.38, 1.8, ['lado', 'fundo'], { topo: 1.1 }),
  projetor: sobre(0.32, 0.3, 0.14),
  videogame: sobre(0.38, 0.26, 0.1),
  caixa_som: sobre(0.3, 0.25, 0.4),
  // ---------------------------------------------------------- cozinha e lavanderia
  geladeira: chao(0.7, 0.72, 1.85, ['fundo', 'lado']),
  geladeira_inox: chao(0.92, 0.78, 1.85, ['fundo', 'lado']),
  freezer: chao(1.1, 0.7, 0.9, ['lado', 'fundo'], { topo: 0.9 }),
  adega: chao(0.6, 0.6, 0.85, ['fundo', 'lado'], { topo: 0.85 }),
  adega_parede: chao(1.2, 0.6, 2.1, ['fundo', 'lado']),
  fogao: chao(0.76, 0.65, 0.9, ['fundo']),
  cooktop_forno: chao(0.9, 0.62, 0.9, ['fundo']),
  fogao_profissional: chao(1.2, 0.72, 0.95, ['fundo']),
  microondas: sobre(0.5, 0.4, 0.3),
  cafeteira: sobre(0.28, 0.32, 0.38),
  louca_talheres: sobre(0.5, 0.35, 0.25),
  cozinha_equipada: sobre(0.6, 0.4, 0.3),
  ilha_cozinha: chao(2.0, 0.95, 0.92, ['centro'], { topo: 0.92 }),
  armarios_planejados: chao(2.4, 0.62, 2.2, ['fundo', 'lado']),
  maquina_lavar: chao(0.6, 0.62, 0.85, ['fundo', 'lado']),
  lava_loucas: chao(0.6, 0.6, 0.85, ['fundo']),
  // ---------------------------------------------------------- quartos
  colchao: chao(1.6, 2.0, 0.6, ['fundo'], { ancora: true }),
  cama_box: chao(1.4, 1.9, 0.62, ['fundo'], { ancora: true }),
  cama_king: chao(1.95, 2.05, 1.15, ['fundo'], { ancora: true }),
  colchao_hotel: chao(1.6, 2.0, 0.66, ['fundo'], { ancora: true }),
  cama_solteiro: chao(0.95, 1.95, 0.6, ['fundo', 'lado'], { ancora: true }),
  beliche: chao(1.0, 2.0, 1.7, ['lado', 'fundo'], { ancora: true }),
  sofa_cama: chao(1.9, 0.9, 0.85, ['fundo', 'lado'], { ancora: true }),
  roupa_de_cama: sobre(0.5, 0.4, 0.15),
  guarda_roupa: chao(1.6, 0.6, 2.1, ['lado', 'fundo']),
  closet: chao(2.4, 0.62, 2.4, ['lado', 'fundo']),
  penteadeira: chao(1.0, 0.45, 1.45, ['lado', 'fundo'], { topo: 0.78 }),
  criado_mudo: chao(0.48, 0.4, 0.55, ['junto'], { de: CAMAS, par: true, topo: 0.55 }),
  espelho_chao: chao(0.6, 0.06, 1.7, ['canto', 'lado']),
  comoda: chao(1.2, 0.5, 0.9, ['lado', 'fundo'], { topo: 0.9 }),
  ar_condicionado: parede(0.9, 0.3, 2.1),
  expositor_relogios: sobre(0.5, 0.35, 0.22),
  // ---------------------------------------------------------- estudo, trabalho, escritório
  escrivaninha: chao(1.2, 0.6, 0.76, ['lado', 'fundo'], { topo: 0.76 }),
  mesa_executiva: chao(1.8, 0.85, 0.76, ['centro', 'fundo'], { ancora: true, topo: 0.76 }),
  cadeira_ergonomica: chao(0.65, 0.65, 1.2, ['diante', 'frente'], { de: MESAS, vao: -0.3 }),
  monitores: sobre(1.1, 0.25, 0.5),
  impressora: sobre(0.45, 0.4, 0.25),
  estante_escritorio: chao(1.0, 0.36, 1.9, ['lado', 'fundo'], { topo: 0.75 }),
  computador: sobre(0.6, 0.3, 0.5),
  notebook: sobre(0.35, 0.25, 0.22),
  tablet: sobre(0.25, 0.18, 0.05),
  camera: sobre(0.15, 0.1, 0.12),
  celular_simples: sobre(0.08, 0.16, 0.01), celular_bom: sobre(0.08, 0.16, 0.01), celular_topo: sobre(0.08, 0.16, 0.01),
  livros: chao(0.9, 0.3, 1.2, ['lado', 'fundo'], { topo: 1.2 }),
  livros_estudo: sobre(0.4, 0.3, 0.25),
  material_arte: sobre(0.5, 0.35, 0.3),
  jogos_tabuleiro: sobre(0.45, 0.3, 0.12),
  tabuleiro: sobre(0.45, 0.45, 0.1),
  // ---------------------------------------------------------- banheiro
  banheira: chao(1.7, 0.75, 0.6, ['fundo', 'lado']),
  banheira_pedra: chao(1.8, 0.85, 0.62, ['fundo', 'centro']),
  ducha: chao(0.9, 0.9, 2.1, ['canto', 'fundo']),
  gabinete: chao(0.8, 0.5, 0.85, ['fundo', 'lado'], { topo: 0.85 }),
  bancada_marmore: chao(1.6, 0.55, 0.9, ['fundo', 'lado'], { topo: 0.9 }),
  espelho_led: parede(0.8, 0.9, 1.2),
  toalheiro: parede(0.5, 0.9, 0.85),
  toalhas: sobre(0.4, 0.3, 0.25),
  sauna: chao(1.8, 1.5, 2.1, ['lado', 'fundo']),
  // ---------------------------------------------------------- piscina e área externa
  espreguicadeira: chao(1.95, 1.5, 0.75, ['deck', 'deck_lado']),
  espreguicadeira_teca: chao(2.0, 1.55, 0.8, ['deck', 'deck_lado']),
  guarda_sol: chao(2.0, 0.5, 2.3, ['junto', 'deck', 'deck_lado'], { de: ['espreguicadeira', 'espreguicadeira_teca', 'mesa_externa'] }),
  ombrelone: chao(3.0, 0.6, 2.6, ['junto', 'deck', 'deck_lado'], { de: ['sofa_externo', 'espreguicadeira_teca', 'espreguicadeira', 'mesa_externa'] }),
  mesa_externa: chao(1.6, 1.0, 0.75, ['deck_lado', 'deck', 'centro'], { topo: 0.75 }),
  sofa_externo: chao(2.2, 0.9, 0.75, ['deck_lado', 'deck', 'fundo', 'lado']),
  boias: { w: 0.9, d: 0.9, h: 0.2, m: 'agua' },
  luz_piscina: { w: 0.6, d: 0.6, h: 0.2, m: 'agua' },
  aquecedor_piscina: parede(2.0, 1.0, 1.2),
  capa_piscina: { w: 4, d: 2, h: 0.02, m: 'agua' },
  cascata: chao(1.4, 0.35, 0.9, ['borda'], { ancora: true }),
  kit_piscina: chao(0.6, 0.45, 0.65, ['canto', 'deck_lado']),
  churrasqueira: chao(1.3, 0.75, 2.1, ['fundo', 'lado'], { topo: 0.9 }),
  espaco_gourmet: chao(3.0, 0.8, 2.2, ['fundo']),
  forno_pizza: chao(1.2, 1.1, 1.7, ['fundo', 'canto']),
  pergolado: chao(3.6, 3.0, 2.6, ['fundo', 'centro']),
  gazebo: chao(3.0, 3.0, 2.8, ['canto', 'fundo']),
  fonte: chao(1.3, 1.3, 1.2, ['centro', 'frente']),
  escultura_jardim: chao(0.6, 0.6, 1.6, ['centro', 'canto']),
  luz_jardim: chao(1.8, 0.2, 0.6, ['frente', 'lado']),
  playground: chao(3.2, 2.0, 2.3, ['lado', 'canto']),
  cama_elastica: chao(3.0, 3.0, 0.95, ['lado', 'centro']),
  // ---------------------------------------------------------- lazer, jogos, cinema
  mesa_sinuca: chao(2.5, 1.4, 0.8, ['centro'], { ancora: true }),
  bilhar_profissional: chao(2.85, 1.6, 0.82, ['centro'], { ancora: true }),
  pebolim: chao(1.4, 0.75, 0.92, ['lado', 'centro']),
  pingue_pongue: chao(2.74, 1.52, 0.76, ['centro'], { ancora: true }),
  mesa_jogos: chao(1.3, 1.3, 0.75, ['centro', 'lado'], { topo: 0.75 }),
  fliperama: chao(0.7, 0.85, 1.85, ['lado', 'fundo']),
  poltronas_cinema: chao(2.7, 1.0, 1.05, ['centro', 'frente'], { ancora: true }),
  // ---------------------------------------------------------- academia
  kit_academia: chao(0.9, 0.6, 0.45, ['frente', 'centro', 'lado']),
  esteira: chao(1.8, 0.8, 1.4, ['lado', 'fundo']),
  estacao_musculacao: chao(1.8, 1.2, 2.1, ['fundo', 'lado'], { ancora: true }),
  bicicleta_ergometrica: chao(1.1, 0.55, 1.3, ['lado', 'frente']),
  remo_seco: chao(2.1, 0.55, 0.5, ['centro', 'lado']),
  saco_pancada: chao(0.4, 0.4, 1.0, ['canto', 'lado']),
  // ---------------------------------------------------------- garagem
  ferramentas: sobre(0.5, 0.25, 0.25),
  bancada_ferramentas: chao(1.8, 0.65, 1.8, ['fundo', 'lado'], { topo: 0.9 }),
  armario_garagem: chao(1.8, 0.5, 1.9, ['lado', 'fundo']),
  organizadores: chao(1.2, 0.45, 1.9, ['lado', 'fundo'], { topo: 1.0 }),
  carregador_ev: parede(0.35, 0.45, 1.0),
  lavadora_pressao: chao(0.55, 0.45, 0.8, ['canto', 'lado']),
  // ---------------------------------------------------------- música
  piano: chao(1.5, 0.62, 1.25, ['fundo', 'lado'], { ancora: true, topo: 1.25 }),
  bateria: chao(1.6, 1.3, 1.2, ['centro', 'canto']),
  teclado: chao(1.3, 0.4, 0.95, ['fundo', 'lado']),
  guitarra: chao(0.42, 0.35, 1.05, ['canto', 'junto'], { de: ['home_studio', 'teclado', 'bateria'] }),
  violao: chao(0.42, 0.35, 1.0, ['canto', 'junto'], { de: ['home_studio', 'teclado', 'poltrona'] }),
  violino: sobre(0.6, 0.22, 0.12),
  cavaquinho: chao(0.25, 0.2, 0.7, ['canto', 'junto'], { de: ['violao', 'home_studio'] }),
  pandeiro: sobre(0.3, 0.3, 0.07),
  sanfona: sobre(0.45, 0.32, 0.45),
  saxofone: chao(0.35, 0.3, 0.8, ['canto', 'junto'], { de: ['teclado', 'piano', 'home_studio'] }),
  home_studio: chao(1.4, 0.65, 1.0, ['fundo', 'lado'], { ancora: true, topo: 0.76 }),
  controladora_dj: sobre(0.7, 0.4, 0.1),
  // ---------------------------------------------------------- arte
  cavalete: chao(0.7, 0.7, 1.8, ['centro', 'lado']),
  torno_ceramica: chao(0.7, 0.6, 0.65, ['centro', 'canto']),
  // ---------------------------------------------------------- esporte e lazer guardado
  chuteira_bola: chao(0.36, 0.26, 0.24, ['canto', 'frente']),
  raquete: parede(0.3, 0.7, 1.2),
  prancha: chao(0.55, 0.12, 2.0, ['canto', 'lado']),
  camping: chao(2.1, 2.1, 1.3, ['centro', 'lado']),
  camping_guardado: chao(0.6, 0.4, 0.5, ['canto', 'lado']),
  // ---------------------------------------------------------- 12.8 · peças de coleção à vista
  _obra: parede(0.9, 0.7, 1.4),
  _camisa: parede(0.75, 0.9, 1.35),
  _peca: sobre(0.3, 0.25, 0.3),
  _antiguidade: sobre(0.32, 0.32, 0.45)
};

/** O que não está na tabela: uma caixa de 50 cm, no chão, num canto (o desenho genérico). */
export const MEDIDA_PADRAO: Medida = chao(0.5, 0.4, 0.5, ['canto', 'lado', 'frente']);
export const medidaDe = (coisaId: string): Medida => MEDIDAS[coisaId] ?? MEDIDA_PADRAO;
export const EXTERNOS = new Set(['jardim', 'piscina', 'lazer', 'garagem', 'quadra']);
