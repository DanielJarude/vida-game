/**
 * VIDA 20 — AS JOIAS DE USAR: cada peça é um MODELO (a corrente veneziana, a argola média, o solitário, a aliança, a
 * tornozeleira) num METAL (ouro amarelo, branco ou rosé de 18 quilates, prata 925, aço, platina, titânio, folheado) e,
 * quando tem, numa PEDRA (diamante, rubi, esmeralda, safira, ametista, topázio, zircônia, ônix, pérola). O que se compra
 * é o que se vê no corpo: o desenho (`ui/avatar`) lê a forma, a cor do metal e a cor da pedra daqui.
 *
 * Lugares (um de cada por vez, como o relógio no pulso): o pescoço (`joia`), as orelhas, a pulseira, o anel (na mão
 * direita), a aliança (no anelar da esquerda: vai junto com um anel) e o tornozelo. Os piercings são o catálogo próprio
 * de `dados/piercings129` (cada furo, a sua joia) — não se repetem aqui.
 *
 * Preços (reais de 2026, cidade de custo 1,0): o ouro 18 k (750) estava em torno de R$ 500–550 o grama na cotação de
 * 2026 (referência spot; a joalheria cobra o feitio, a margem e os impostos por cima — por isso o grama "de vitrine"
 * fica perto do dobro); prata 925 e aço custam pouco pelo metal, quase tudo é feitio. As gramaturas são as típicas de
 * catálogo (a corrente fina de 45 cm, 2–3 g; a grumet média, 8–12 g; a aliança clássica, 3–5 g). A pedra soma o seu
 * preço (o ponto de luz de diamante de 10 pontos ≈ R$ 1.500; o solitário de 30 pontos, R$ 6–9 mil; o de um quilate,
 * dezenas de milhares). Calibração de jogo, não tabela de loja.
 *
 * Catálogo puro (só tipos): pacote `dados20`.
 */

export type Metal20 = 'ouro_amarelo' | 'ouro_branco' | 'ouro_rose' | 'prata' | 'aco' | 'platina' | 'titanio' | 'folheado';
export type Pedra20 = 'diamante' | 'rubi' | 'esmeralda' | 'safira' | 'ametista' | 'topazio' | 'zirconia' | 'onix' | 'perola';
export type LugarJoia20 = 'joia' | 'orelha' | 'pulseira' | 'anel' | 'alianca' | 'tornozelo';

/** As formas que o desenho conhece, por lugar. */
export type FormaJoia20 =
  | 'veneziana' | 'grumet' | 'cartier' | 'choker' | 'ponto_de_luz' | 'medalha' | 'coracao' | 'letra' | 'riviera' | 'gota' // pescoço
  | 'brinco_ponto' | 'argola_p' | 'argola_m' | 'argola_g' | 'brinco_gota' | 'brinco_perola' | 'ear_cuff'                     // orelhas
  | 'elos' | 'rigida' | 'riviera_pulso' | 'berloques' | 'fina'                                                                // pulso
  | 'solitario' | 'aparador' | 'sinete' | 'coquetel' | 'aro'                                                                 // anel
  | 'alianca_classica' | 'alianca_cravejada'                                                                                 // aliança
  | 'tornozeleira_fina' | 'tornozeleira_bolinhas' | 'tornozeleira_contas';                                                   // tornozelo

export const METAIS20: Record<Metal20, { nome: string; de: string; cor: string; brilho: string; grama: number }> = {
  ouro_amarelo: { nome: 'ouro amarelo 18 k', de: 'de ouro', cor: '#d8b45a', brilho: '#f6e3a1', grama: 980 },
  ouro_branco: { nome: 'ouro branco 18 k', de: 'de ouro branco', cor: '#dcdcd6', brilho: '#ffffff', grama: 1000 },
  ouro_rose: { nome: 'ouro rosé 18 k', de: 'de ouro rosé', cor: '#d39a83', brilho: '#f3cdbc', grama: 990 },
  prata: { nome: 'prata 925', de: 'de prata', cor: '#c9ccd1', brilho: '#f4f6f8', grama: 32 },
  aco: { nome: 'aço inoxidável', de: 'de aço', cor: '#9aa0a6', brilho: '#d9dde1', grama: 12 },
  platina: { nome: 'platina 950', de: 'de platina', cor: '#e5e4e2', brilho: '#ffffff', grama: 1250 },
  titanio: { nome: 'titânio', de: 'de titânio', cor: '#7d838a', brilho: '#b9bec4', grama: 40 },
  folheado: { nome: 'folheado a ouro', de: 'folheada a ouro', cor: '#e0bd5e', brilho: '#f8e7a8', grama: 18 }
};

export const PEDRAS20: Record<Pedra20, { nome: string; cor: string; preco: number }> = {
  diamante: { nome: 'diamante', cor: '#e8f6ff', preco: 1500 },
  rubi: { nome: 'rubi', cor: '#b0182f', preco: 1200 },
  esmeralda: { nome: 'esmeralda', cor: '#1f8a5a', preco: 1300 },
  safira: { nome: 'safira', cor: '#1f4aa8', preco: 1100 },
  ametista: { nome: 'ametista', cor: '#8e5bb5', preco: 160 },
  topazio: { nome: 'topázio azul', cor: '#59b7d8', preco: 180 },
  zirconia: { nome: 'zircônia', cor: '#f2f8ff', preco: 25 },
  onix: { nome: 'ônix', cor: '#17171a', preco: 60 },
  perola: { nome: 'pérola cultivada', cor: '#f3eee4', preco: 220 }
};

interface Modelo20 {
  forma: FormaJoia20; lugar: LugarJoia20; nome: string;
  /** Gramas de metal (a peça típica). */
  g: number;
  /** Quantas pedras (o ponto de luz, 1; a riviera, 20 pequenas) e o tamanho relativo (1 = 10 pontos de diamante). */
  pedras?: number; tam?: number;
  /** Combinações oferecidas: [metal, pedra?]. */
  em: [Metal20, Pedra20?][];
  estilos: string[]; ocasioes: ('dia' | 'trabalho' | 'estudo' | 'festa' | 'evento' | 'esporte' | 'encontro')[];
  frase: string;
}

const MODELOS: Modelo20[] = [
  // ------------------------------------------------------------ pescoço
  { forma: 'veneziana', lugar: 'joia', nome: 'Corrente veneziana', g: 2.5, em: [['ouro_amarelo'], ['ouro_branco'], ['prata'], ['aco']], estilos: ['minimalista', 'casual', 'elegante'], ocasioes: ['dia', 'trabalho', 'encontro'], frase: 'Fina, de 45 cm, elos quadradinhos que deitam na pele.' },
  { forma: 'grumet', lugar: 'joia', nome: 'Corrente grumet', g: 10, em: [['ouro_amarelo'], ['prata'], ['aco']], estilos: ['hiphop', 'urbano', 'baile'], ocasioes: ['dia', 'festa'], frase: 'Elos achatados e torcidos, de 60 cm, que se veem de longe.' },
  { forma: 'cartier', lugar: 'joia', nome: 'Corrente de elos alongados', g: 5, em: [['ouro_amarelo'], ['ouro_rose'], ['prata']], estilos: ['elegante', 'casual'], ocasioes: ['dia', 'trabalho', 'encontro'], frase: 'Três elos curtos e um comprido, o desenho clássico.' },
  { forma: 'choker', lugar: 'joia', nome: 'Gargantilha', g: 4, em: [['ouro_amarelo'], ['prata'], ['aco'], ['folheado']], estilos: ['alternativo', 'rock', 'elegante'], ocasioes: ['festa', 'encontro', 'dia'], frase: 'Rente ao pescoço, de 38 cm.' },
  { forma: 'ponto_de_luz', lugar: 'joia', nome: 'Colar ponto de luz', g: 2, pedras: 1, tam: 1, em: [['ouro_branco', 'diamante'], ['ouro_amarelo', 'diamante'], ['ouro_rose', 'diamante'], ['prata', 'zirconia'], ['ouro_amarelo', 'zirconia']], estilos: ['elegante', 'minimalista'], ocasioes: ['trabalho', 'evento', 'encontro'], frase: 'Uma pedra só, em garras, numa corrente fina.' },
  { forma: 'medalha', lugar: 'joia', nome: 'Corrente com medalha', g: 5, em: [['ouro_amarelo'], ['prata'], ['folheado']], estilos: ['tradicional', 'casual'], ocasioes: ['dia', 'evento'], frase: 'A medalha redonda gravada, de devoção ou de presente.' },
  { forma: 'coracao', lugar: 'joia', nome: 'Colar com pingente de coração', g: 3, em: [['ouro_rose'], ['ouro_amarelo'], ['prata']], estilos: ['casual', 'vintage'], ocasioes: ['dia', 'encontro'], frase: 'O coraçãozinho vazado, o presente de namoro.' },
  { forma: 'letra', lugar: 'joia', nome: 'Colar com inicial', g: 2.5, em: [['ouro_amarelo'], ['prata']], estilos: ['minimalista', 'casual'], ocasioes: ['dia', 'estudo'], frase: 'Uma letra, a sua ou a de alguém.' },
  { forma: 'riviera', lugar: 'joia', nome: 'Colar riviera', g: 14, pedras: 40, tam: 1, em: [['ouro_branco', 'diamante'], ['prata', 'zirconia']], estilos: ['luxuoso', 'elegante'], ocasioes: ['evento', 'festa'], frase: 'Uma fileira de pedras iguais em volta do pescoço inteiro.' },
  { forma: 'gota', lugar: 'joia', nome: 'Colar com pingente de gota', g: 3, pedras: 1, tam: 4, em: [['ouro_amarelo', 'esmeralda'], ['ouro_branco', 'safira'], ['ouro_amarelo', 'rubi'], ['prata', 'ametista'], ['prata', 'topazio']], estilos: ['elegante', 'luxuoso', 'vintage'], ocasioes: ['evento', 'encontro', 'festa'], frase: 'A pedra lapidada em gota, pendurada num aro fino.' },
  // ------------------------------------------------------------ orelhas
  { forma: 'brinco_ponto', lugar: 'orelha', nome: 'Brinco ponto de luz', g: 1, pedras: 2, tam: 1, em: [['ouro_branco', 'diamante'], ['ouro_amarelo', 'diamante'], ['ouro_amarelo', 'zirconia'], ['prata', 'zirconia'], ['titanio', 'zirconia']], estilos: ['minimalista', 'elegante', 'casual'], ocasioes: ['dia', 'trabalho', 'evento'], frase: 'Uma pedrinha em cada lóbulo.' },
  { forma: 'argola_p', lugar: 'orelha', nome: 'Argola pequena', g: 1.6, em: [['ouro_amarelo'], ['ouro_rose'], ['prata'], ['aco']], estilos: ['minimalista', 'casual', 'urbano'], ocasioes: ['dia', 'trabalho', 'estudo'], frase: 'Argolinha de 12 mm, rente à orelha.' },
  { forma: 'argola_m', lugar: 'orelha', nome: 'Argola média', g: 3, em: [['ouro_amarelo'], ['prata'], ['folheado']], estilos: ['casual', 'urbano', 'baile'], ocasioes: ['dia', 'festa', 'encontro'], frase: 'De 25 mm, tubo redondo.' },
  { forma: 'argola_g', lugar: 'orelha', nome: 'Argola grande', g: 5, em: [['ouro_amarelo'], ['prata'], ['folheado']], estilos: ['hiphop', 'baile', 'afro'], ocasioes: ['festa', 'dia'], frase: 'De 50 mm, que balança quando vira o rosto.' },
  { forma: 'brinco_gota', lugar: 'orelha', nome: 'Brinco de gota', g: 2, pedras: 2, tam: 2.5, em: [['ouro_amarelo', 'esmeralda'], ['ouro_branco', 'safira'], ['prata', 'ametista'], ['ouro_amarelo', 'rubi']], estilos: ['elegante', 'luxuoso'], ocasioes: ['evento', 'festa', 'encontro'], frase: 'A pedra pendurada abaixo do lóbulo.' },
  { forma: 'brinco_perola', lugar: 'orelha', nome: 'Brinco de pérola', g: 1, pedras: 2, tam: 1, em: [['ouro_amarelo', 'perola'], ['prata', 'perola'], ['ouro_branco', 'perola']], estilos: ['elegante', 'vintage', 'social'], ocasioes: ['trabalho', 'evento'], frase: 'Pérola de 7 mm no pino.' },
  { forma: 'ear_cuff', lugar: 'orelha', nome: 'Piercing fake (ear cuff)', g: 1.2, em: [['prata'], ['ouro_amarelo'], ['aco']], estilos: ['alternativo', 'urbano', 'punk'], ocasioes: ['dia', 'festa'], frase: 'Abraça a cartilagem sem furo.' },
  // ------------------------------------------------------------ pulseira
  { forma: 'elos', lugar: 'pulseira', nome: 'Pulseira de elos', g: 9, em: [['ouro_amarelo'], ['prata'], ['aco']], estilos: ['urbano', 'hiphop', 'casual'], ocasioes: ['dia', 'festa'], frase: 'Elos grumet, fecho de gaveta.' },
  { forma: 'rigida', lugar: 'pulseira', nome: 'Bracelete rígido', g: 12, em: [['ouro_amarelo'], ['ouro_rose'], ['prata'], ['aco']], estilos: ['elegante', 'minimalista', 'afro'], ocasioes: ['trabalho', 'evento', 'encontro'], frase: 'Aro rígido aberto, que se encaixa no pulso.' },
  { forma: 'riviera_pulso', lugar: 'pulseira', nome: 'Pulseira riviera', g: 8, pedras: 30, tam: 0.6, em: [['ouro_branco', 'diamante'], ['prata', 'zirconia'], ['ouro_amarelo', 'zirconia']], estilos: ['luxuoso', 'elegante'], ocasioes: ['evento', 'festa'], frase: 'A fileira de pedras de ponta a ponta ("pulseira tênis").' },
  { forma: 'berloques', lugar: 'pulseira', nome: 'Pulseira de berloques', g: 10, em: [['prata'], ['ouro_amarelo']], estilos: ['casual', 'vintage'], ocasioes: ['dia', 'encontro'], frase: 'Os pingentes pequenos de cada fase da vida.' },
  { forma: 'fina', lugar: 'pulseira', nome: 'Pulseira fina', g: 1.8, em: [['ouro_amarelo'], ['ouro_rose'], ['prata']], estilos: ['minimalista', 'casual'], ocasioes: ['dia', 'trabalho', 'estudo'], frase: 'Um fio só, quase não aparece.' },
  // ------------------------------------------------------------ anel
  { forma: 'solitario', lugar: 'anel', nome: 'Anel solitário', g: 3, pedras: 1, tam: 3, em: [['ouro_branco', 'diamante'], ['ouro_amarelo', 'diamante'], ['ouro_rose', 'diamante'], ['platina', 'diamante'], ['prata', 'zirconia']], estilos: ['elegante', 'luxuoso'], ocasioes: ['evento', 'encontro', 'trabalho'], frase: 'Uma pedra de 30 pontos em seis garras.' },
  { forma: 'aparador', lugar: 'anel', nome: 'Anel meia-aliança cravejado', g: 3, pedras: 9, tam: 0.6, em: [['ouro_branco', 'diamante'], ['ouro_amarelo', 'diamante'], ['prata', 'zirconia']], estilos: ['elegante', 'luxuoso'], ocasioes: ['evento', 'trabalho', 'encontro'], frase: 'Pedrinhas na metade de cima do aro.' },
  { forma: 'sinete', lugar: 'anel', nome: 'Anel de sinete', g: 9, em: [['ouro_amarelo'], ['prata'], ['aco']], estilos: ['tradicional', 'vintage', 'social'], ocasioes: ['trabalho', 'evento'], frase: 'O topo chato, para o brasão ou as iniciais.' },
  { forma: 'coquetel', lugar: 'anel', nome: 'Anel de pedra (coquetel)', g: 5, pedras: 1, tam: 6, em: [['ouro_amarelo', 'rubi'], ['ouro_amarelo', 'esmeralda'], ['ouro_branco', 'safira'], ['prata', 'ametista'], ['prata', 'onix'], ['prata', 'topazio']], estilos: ['luxuoso', 'vintage', 'alternativo'], ocasioes: ['festa', 'evento'], frase: 'Uma pedra grande de cor, que chega antes da mão.' },
  { forma: 'aro', lugar: 'anel', nome: 'Anel liso', g: 4, em: [['titanio'], ['aco'], ['prata'], ['ouro_amarelo']], estilos: ['minimalista', 'rock', 'casual'], ocasioes: ['dia', 'trabalho'], frase: 'Aro de 4 mm, sem nada — o que dura.' },
  // ------------------------------------------------------------ aliança
  { forma: 'alianca_classica', lugar: 'alianca', nome: 'Aliança', g: 4, em: [['ouro_amarelo'], ['ouro_branco'], ['ouro_rose'], ['platina'], ['prata'], ['titanio']], estilos: ['tradicional', 'elegante', 'minimalista', 'casual'], ocasioes: ['dia', 'trabalho', 'evento', 'encontro', 'estudo'], frase: 'Aro abaulado de 4 mm, no anelar da esquerda.' },
  { forma: 'alianca_cravejada', lugar: 'alianca', nome: 'Aliança cravejada', g: 4.5, pedras: 7, tam: 0.5, em: [['ouro_amarelo', 'diamante'], ['ouro_branco', 'diamante']], estilos: ['elegante', 'luxuoso'], ocasioes: ['dia', 'trabalho', 'evento', 'encontro'], frase: 'A aliança com uma fileira curta de brilhantes.' },
  // ------------------------------------------------------------ tornozelo
  { forma: 'tornozeleira_fina', lugar: 'tornozelo', nome: 'Tornozeleira fina', g: 2, em: [['ouro_amarelo'], ['ouro_rose'], ['prata'], ['folheado']], estilos: ['casual', 'minimalista'], ocasioes: ['dia', 'festa'], frase: 'Um fio no tornozelo, para a sandália e a praia.' },
  { forma: 'tornozeleira_bolinhas', lugar: 'tornozelo', nome: 'Tornozeleira de bolinhas', g: 3, em: [['prata'], ['ouro_amarelo']], estilos: ['casual', 'regional'], ocasioes: ['dia', 'festa'], frase: 'Bolinhas espaçadas na corrente.' },
  { forma: 'tornozeleira_contas', lugar: 'tornozelo', nome: 'Tornozeleira de contas', g: 0.5, em: [['folheado']], estilos: ['afro', 'alternativo', 'regional'], ocasioes: ['dia', 'festa'], frase: 'Miçangas coloridas e um búzio.' }
];

export interface Joia20 {
  id: string; nome: string; lugar: LugarJoia20; forma: FormaJoia20; metal: Metal20; pedra?: Pedra20; preco: number;
  estilos: string[]; ocasioes: Modelo20['ocasioes']; descricao: string; luxo: boolean;
}

const r50 = (x: number) => (x < 1000 ? Math.round(x / 10) * 10 : x < 20000 ? Math.round(x / 50) * 50 : Math.round(x / 500) * 500);
/** Pedras grandes valem muito mais que a soma das pequenas (o preço do quilate sobe com o tamanho). */
const precoDaPedra = (p: Pedra20, n: number, tam: number) => (p === 'zirconia' || p === 'onix' ? PEDRAS20[p].preco * n * Math.max(1, tam * 0.6) : PEDRAS20[p].preco * n * Math.pow(tam, 1.6));
const FEITIO: Record<Metal20, number> = { ouro_amarelo: 250, ouro_branco: 320, ouro_rose: 280, prata: 90, aco: 50, platina: 600, titanio: 80, folheado: 40 };

export const JOIAS20: readonly Joia20[] = MODELOS.flatMap(m => m.em.map(([metal, pedra]) => {
  const id = `j20_${m.forma}_${metal}${pedra ? `_${pedra}` : ''}`;
  const preco = r50(m.g * METAIS20[metal].grama + FEITIO[metal] + (pedra ? precoDaPedra(pedra, m.pedras ?? 1, m.tam ?? 1) : 0));
  const nome = `${m.nome} ${METAIS20[metal].de}${pedra ? ` com ${PEDRAS20[pedra].nome}` : ''}`;
  return { id, nome, lugar: m.lugar, forma: m.forma, metal, pedra, preco, estilos: m.estilos, ocasioes: m.ocasioes, luxo: preco >= 8000, descricao: `${m.frase} ${cap(METAIS20[metal].nome)}${pedra ? `, ${PEDRAS20[pedra].nome}` : ''}.` };
}));
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const POR_ID = new Map(JOIAS20.map(j => [j.id, j]));
export const joia20 = (id: string): Joia20 | undefined => POR_ID.get(id);
