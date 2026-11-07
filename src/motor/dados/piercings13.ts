/**
 * VIDA 13 — PIERCINGS (complemento): mais furos e mais joias. Cada furo é um LUGAR (um de cada vez, como sempre:
 * `estilo.umPorLugar`), e vários furos ficam na mesma ZONA do corpo quando a anatomia deixa — a orelha tem o lóbulo
 * (os brincos), o segundo furo do lóbulo, o helix, o tragus, a concha, o daith e o industrial; o nariz tem as duas
 * narinas, o septo e a ponte; a boca tem o labret, o canto do lábio e o medusa.
 *
 * Joias com desenho próprio: argola lisa, argola com fecho cravejado (clicker), ponto de luz, flor de pedras (cluster),
 * barra curva, barra reta (industrial, ponte), espeto (spike), pingentes (lua, estrela, coração, cruz). Metais: aço,
 * titânio (e o titânio anodizado: azul, arco-íris), prata, ouro amarelo, branco e rosé, preto (PVD); acabamento polido,
 * fosco ou martelado. Puro: só tipos (`import type`).
 */
import type { ItemDePiercing, Piercing, RegiaoDePiercing } from './piercings129';

/** As zonas do corpo (a lupa da seção de piercings) e os furos de cada uma, na ordem de quem olha no espelho. */
export type ZonaDePiercing = 'orelha' | 'nariz' | 'sobrancelha' | 'boca' | 'umbigo';
export const ZONAS_DE_PIERCING: { id: ZonaDePiercing; nome: string; furos: string[] }[] = [
  { id: 'orelha', nome: 'Orelha', furos: ['orelha', 'lobulo2', 'helix', 'industrial', 'tragus', 'concha', 'daith'] },
  { id: 'nariz', nome: 'Nariz', furos: ['nariz', 'nariz2', 'septo', 'ponte'] },
  { id: 'sobrancelha', nome: 'Sobrancelha', furos: ['sobrancelha'] },
  { id: 'boca', nome: 'Boca', furos: ['labio', 'labio2', 'medusa'] },
  { id: 'umbigo', nome: 'Umbigo', furos: ['umbigo'] }
];
/** O nome de cada furo (o lugar), como aparece na seção de piercings. `orelha` é o lóbulo: o furo dos brincos. */
export const NOME_DO_FURO: Record<string, string> = {
  orelha: 'Lóbulo (brincos)', lobulo2: 'Lóbulo, 2º furo', helix: 'Helix', industrial: 'Industrial', tragus: 'Tragus', concha: 'Concha', daith: 'Daith',
  nariz: 'Narina esquerda', nariz2: 'Narina direita', septo: 'Septo', ponte: 'Ponte do nariz',
  sobrancelha: 'Sobrancelha', labio: 'Lábio (labret ou canto)', labio2: 'Canto do lábio, outro lado', medusa: 'Medusa (acima do lábio)', umbigo: 'Umbigo'
};
export const zonaDoFuro = (lugar: string): ZonaDePiercing | undefined => ZONAS_DE_PIERCING.find(z => z.furos.includes(lugar))?.id;

/** Os furos novos da VIDA 13 (somam-se aos da 12.9). */
export const REGIOES_13: RegiaoDePiercing[] = ['lobulo2', 'concha', 'daith', 'industrial', 'nariz2', 'ponte', 'medusa', 'labio2'];

const p = (id: string, nome: string, preco: number, piercing: Piercing, descricao: string, x: Partial<ItemDePiercing> = {}): ItemDePiercing =>
  ({ id, nome, categoria: 'acessorio', lugar: piercing.regiao, preco, piercing, descricao, ...x });
const ZIRC = '#e9f6ff', DIAM = '#f4fbff';

export const PIERCINGS_13: ItemDePiercing[] = [
  // Orelha — o segundo furo do lóbulo
  p('pc_lobulo2_ponto_aco', 'Lóbulo, 2º furo — ponto de aço', 90, { regiao: 'lobulo2', forma: 'ponto', metal: 'aco' }, 'Um ponto pequeno acima do brinco. O segundo furo mais comum que existe.', { estilos: ['casual', 'minimalista'] }),
  p('pc_lobulo2_argola_ouro', 'Lóbulo, 2º furo — argolinha de ouro', 690, { regiao: 'lobulo2', forma: 'argola', metal: 'ouro' }, 'Argolinha justa de ouro dezoito, colada no lóbulo.', { estilos: ['elegante', 'casual'], nivel: 3 }),
  p('pc_lobulo2_estrela', 'Lóbulo, 2º furo — estrela de ouro rosé', 540, { regiao: 'lobulo2', forma: 'charme', metal: 'ouro_rose', simbolo: 'estrela' }, 'Uma estrelinha de ouro rosé presa rente à pele.', { estilos: ['elegante', 'vintage'], nivel: 3 }),
  p('pc_lobulo2_diamante', 'Lóbulo, 2º furo — diamante em ouro branco', 6400, { regiao: 'lobulo2', forma: 'ponto', metal: 'ouro_branco', pedra: DIAM }, 'Um diamante pequeno, garra de ouro branco.', { estilos: ['luxuoso', 'elegante'], luxo: true, nivel: 5 }),
  p('pc_lobulo2_spike', 'Lóbulo, 2º furo — espeto preto', 110, { regiao: 'lobulo2', forma: 'spike', metal: 'preto' }, 'O espeto curto de aço preto: a ponta aparece de frente.', { estilos: ['punk', 'rock'] }),
  // Orelha — helix (mais modelos)
  p('pc_helix_clicker_ouro', 'Helix — clicker cravejado de ouro', 2300, { regiao: 'helix', forma: 'clicker', metal: 'ouro', pedra: ZIRC }, 'Argola de fecho articulado com uma fileira de zircônias na frente.', { estilos: ['elegante', 'luxuoso'], luxo: true, nivel: 4 }),
  p('pc_helix_cluster', 'Helix — flor de pedras em prata', 320, { regiao: 'helix', forma: 'cluster', metal: 'prata', pedra: '#cfe8ff' }, 'Cinco pedrinhas em flor, rente à cartilagem.', { estilos: ['elegante', 'casual'] }),
  p('pc_helix_spike', 'Helix — espeto de titânio fosco', 150, { regiao: 'helix', forma: 'spike', metal: 'titanio', acabamento: 'fosco' }, 'Titânio escovado, ponta cônica.', { estilos: ['punk', 'alternativo', 'streetwear'] }),
  // Orelha — industrial
  p('pc_industrial_barra_aco', 'Industrial — barra de aço', 180, { regiao: 'industrial', forma: 'barra_reta', metal: 'aco' }, 'Dois furos no alto da orelha e uma barra reta atravessando de um ao outro.', { estilos: ['alternativo', 'rock', 'punk'] }),
  p('pc_industrial_preta', 'Industrial — barra preta com espetos', 210, { regiao: 'industrial', forma: 'barra_reta', metal: 'preto', simbolo: 'espetos' }, 'Aço com PVD preto e espetos nas pontas.', { estilos: ['punk', 'rock'] }),
  p('pc_industrial_arco', 'Industrial — titânio arco-íris', 260, { regiao: 'industrial', forma: 'barra_reta', metal: 'titanio_arco' }, 'Titânio anodizado: muda de cor com a luz, do azul ao dourado.', { estilos: ['alternativo', 'streetwear'] }),
  // Orelha — tragus (mais modelos)
  p('pc_tragus_argola_prata', 'Tragus — argolinha de prata', 150, { regiao: 'tragus', forma: 'argola', metal: 'prata' }, 'Argola pequena, fechada rente ao tragus.', { estilos: ['casual', 'alternativo'] }),
  p('pc_tragus_cluster_rose', 'Tragus — flor de ouro rosé', 980, { regiao: 'tragus', forma: 'cluster', metal: 'ouro_rose', pedra: '#f6c1cf' }, 'Flor de pedras cor-de-rosa em ouro rosé.', { estilos: ['elegante'], nivel: 4, luxo: true }),
  p('pc_tragus_lua', 'Tragus — meia-lua de titânio', 170, { regiao: 'tragus', forma: 'charme', metal: 'titanio', simbolo: 'lua' }, 'Uma meia-lua lisa de titânio polido.', { estilos: ['alternativo', 'casual'] }),
  // Orelha — concha
  p('pc_concha_argola_prata', 'Concha — argola grande de prata', 210, { regiao: 'concha', forma: 'argola', metal: 'prata', acabamento: 'martelado' }, 'A argola larga que abraça a borda da orelha, prata martelada.', { estilos: ['alternativo', 'vintage', 'rock'] }),
  p('pc_concha_ponto_titanio', 'Concha — ponto de titânio', 160, { regiao: 'concha', forma: 'ponto', metal: 'titanio', pedra: ZIRC }, 'Um ponto de luz no meio da orelha.', { estilos: ['casual', 'elegante'] }),
  p('pc_concha_cluster_ouro', 'Concha — flor de ouro com zircônias', 1600, { regiao: 'concha', forma: 'cluster', metal: 'ouro', pedra: ZIRC }, 'Ouro dezoito, sete zircônias em flor.', { estilos: ['elegante', 'luxuoso'], nivel: 4, luxo: true }),
  // Orelha — daith
  p('pc_daith_argola_aco', 'Daith — argola de aço', 170, { regiao: 'daith', forma: 'argola', metal: 'aco' }, 'A argola na dobra de dentro da orelha, acima do tragus.', { estilos: ['alternativo', 'casual'] }),
  p('pc_daith_coracao_ouro', 'Daith — coração de ouro', 1300, { regiao: 'daith', forma: 'charme', metal: 'ouro', simbolo: 'coracao' }, 'A argola em forma de coração, ouro dezoito.', { estilos: ['elegante', 'vintage'], nivel: 4, luxo: true }),
  p('pc_daith_clicker_branco', 'Daith — clicker cravejado de ouro branco', 4200, { regiao: 'daith', forma: 'clicker', metal: 'ouro_branco', pedra: DIAM }, 'Fecho articulado, diamantes na frente.', { estilos: ['luxuoso'], luxo: true, nivel: 5 }),
  // Nariz — narina esquerda (mais modelos)
  p('pc_nariz_cluster_ouro', 'Nariz — flor de ouro', 1250, { regiao: 'nariz', forma: 'cluster', metal: 'ouro', pedra: ZIRC }, 'Uma flor de cinco pedras em ouro: aparece sem gritar.', { estilos: ['elegante'], nivel: 4, luxo: true }),
  p('pc_nariz_argola_preta', 'Nariz — argola preta', 120, { regiao: 'nariz', forma: 'argola', metal: 'preto' }, 'Argola fina de aço preto.', { estilos: ['punk', 'rock', 'streetwear'] }),
  p('pc_nariz_titanio_azul', 'Nariz — ponto de titânio azul', 150, { regiao: 'nariz', forma: 'ponto', metal: 'titanio_azul' }, 'Titânio anodizado azul: a cor vem da luz no metal, não de tinta.', { estilos: ['alternativo'] }),
  p('pc_nariz_clicker_branco', 'Nariz — argola cravejada de ouro branco', 5200, { regiao: 'nariz', forma: 'clicker', metal: 'ouro_branco', pedra: DIAM }, 'Argola articulada com diamantes pequenos na frente.', { estilos: ['luxuoso'], luxo: true, nivel: 5 }),
  // Nariz — narina direita
  p('pc_nariz2_ponto_aco', 'Narina direita — ponto de aço', 120, { regiao: 'nariz2', forma: 'ponto', metal: 'aco' }, 'O ponto do outro lado: os dois juntos fazem o par.', { estilos: ['casual', 'alternativo'] }),
  p('pc_nariz2_argola_prata', 'Narina direita — argola de prata', 160, { regiao: 'nariz2', forma: 'argola', metal: 'prata' }, 'Argola fina de prata na outra narina.', { estilos: ['alternativo', 'rock'] }),
  p('pc_nariz2_rose', 'Narina direita — ponto de ouro rosé', 720, { regiao: 'nariz2', forma: 'ponto', metal: 'ouro_rose', pedra: '#f6c1cf' }, 'Ouro rosé com uma pedra rosada.', { estilos: ['elegante'], nivel: 3 }),
  // Septo (mais modelos)
  p('pc_septo_clicker_branco', 'Septo — clicker cravejado', 3900, { regiao: 'septo', forma: 'clicker', metal: 'ouro_branco', pedra: DIAM }, 'Ouro branco e uma fileira de diamantes que aparece por baixo do nariz.', { estilos: ['luxuoso', 'elegante'], luxo: true, nivel: 5 }),
  p('pc_septo_spike', 'Septo — ferradura com espetos', 160, { regiao: 'septo', forma: 'ferradura', metal: 'aco', simbolo: 'espetos' }, 'A ferradura de aço com as pontas em espeto.', { estilos: ['punk', 'rock'] }),
  p('pc_septo_arco', 'Septo — argola arco-íris', 190, { regiao: 'septo', forma: 'argola', metal: 'titanio_arco' }, 'Titânio anodizado, do roxo ao dourado.', { estilos: ['alternativo', 'streetwear'] }),
  // Ponte do nariz
  p('pc_ponte_barra_aco', 'Ponte — barra de aço', 170, { regiao: 'ponte', forma: 'barra_reta', metal: 'aco' }, 'A barra que atravessa a pele entre os olhos: duas bolinhas, uma de cada lado.', { estilos: ['alternativo', 'punk'] }),
  p('pc_ponte_preta', 'Ponte — barra preta com espetos', 190, { regiao: 'ponte', forma: 'barra_reta', metal: 'preto', simbolo: 'espetos' }, 'Aço preto, pontas cônicas.', { estilos: ['punk', 'rock'] }),
  // Sobrancelha (mais modelos)
  p('pc_sobrancelha_spike', 'Sobrancelha — barra com espetos', 160, { regiao: 'sobrancelha', forma: 'barra', metal: 'aco', simbolo: 'espetos' }, 'A barra curva com as pontas em espeto.', { estilos: ['punk', 'rock'] }),
  p('pc_sobrancelha_ouro', 'Sobrancelha — barra de ouro com pedra', 980, { regiao: 'sobrancelha', forma: 'barra', metal: 'ouro', pedra: ZIRC }, 'Ouro dezoito e uma zircônia na ponta de cima.', { estilos: ['elegante'], nivel: 4, luxo: true }),
  p('pc_sobrancelha_azul', 'Sobrancelha — titânio azul', 170, { regiao: 'sobrancelha', forma: 'barra', metal: 'titanio_azul' }, 'Barra curva de titânio anodizado azul.', { estilos: ['alternativo', 'streetwear'] }),
  // Lábio (mais modelos)
  p('pc_labio_spike', 'Lábio — labret com espeto', 150, { regiao: 'labio', forma: 'spike', metal: 'preto' }, 'O labret embaixo do lábio, com a ponta em espeto.', { estilos: ['punk', 'rock'] }),
  p('pc_labio_argola_ouro', 'Lábio — argola de ouro', 980, { regiao: 'labio', forma: 'argola', metal: 'ouro' }, 'Argola fina de ouro no canto do lábio.', { estilos: ['elegante', 'alternativo'], nivel: 4, luxo: true }),
  // Canto do lábio, o outro lado (com a argola do lábio: o par, "snake bites")
  p('pc_labio2_argola_aco', 'Canto do lábio (outro lado) — argola de aço', 150, { regiao: 'labio2', forma: 'argola', metal: 'aco' }, 'A argola do outro canto: com a do lábio, faz o par.', { estilos: ['punk', 'alternativo'] }),
  p('pc_labio2_ponto_titanio', 'Canto do lábio (outro lado) — ponto', 150, { regiao: 'labio2', forma: 'ponto', metal: 'titanio' }, 'Ponto de titânio no canto do lábio de baixo.', { estilos: ['alternativo', 'casual'] }),
  p('pc_labio2_argola_preta', 'Canto do lábio (outro lado) — argola preta', 140, { regiao: 'labio2', forma: 'argola', metal: 'preto' }, 'Argola preta, fina.', { estilos: ['punk', 'rock'] }),
  // Medusa (o furo entre o nariz e o lábio de cima)
  p('pc_medusa_titanio', 'Medusa — ponto de titânio', 160, { regiao: 'medusa', forma: 'ponto', metal: 'titanio' }, 'O ponto no meio do lábio de cima, onde o arco do cupido faz a curva.', { estilos: ['alternativo', 'casual'] }),
  p('pc_medusa_zirconia', 'Medusa — ponto de luz', 220, { regiao: 'medusa', forma: 'ponto', metal: 'prata', pedra: ZIRC }, 'Prata com uma zircônia.', { estilos: ['elegante', 'alternativo'] }),
  p('pc_medusa_ouro', 'Medusa — ponto de ouro', 820, { regiao: 'medusa', forma: 'ponto', metal: 'ouro', acabamento: 'polido' }, 'Ouro dezoito, bolinha polida.', { estilos: ['elegante'], nivel: 4, luxo: true }),
  // Umbigo (mais modelos)
  p('pc_umbigo_lua', 'Umbigo — pingente de meia-lua', 480, { regiao: 'umbigo', forma: 'pingente', metal: 'ouro', simbolo: 'lua' }, 'Barra de ouro com uma meia-lua pendurada.', { estilos: ['elegante', 'vintage'], nivel: 3 }),
  p('pc_umbigo_titanio_azul', 'Umbigo — barra de titânio azul', 190, { regiao: 'umbigo', forma: 'barra', metal: 'titanio_azul', pedra: '#7fb4ff' }, 'Titânio anodizado azul, pedra azul.', { estilos: ['alternativo', 'casual'] }),
  p('pc_umbigo_diamantes', 'Umbigo — cascata de diamantes', 14000, { regiao: 'umbigo', forma: 'pingente', metal: 'ouro_branco', pedra: DIAM, simbolo: 'cascata' }, 'Ouro branco e três diamantes em fila, caindo.', { estilos: ['luxuoso'], luxo: true, nivel: 5 })
];

/**
 * VIDA 13 — BRINCOS NOVOS (o lóbulo, lugar `orelha`): cada modelo com o seu desenho no retrato (`ui/avatar/piercings`).
 * Não são piercings de estúdio (o furo do lóbulo já é o de sempre): são itens de estilo como os brincos da 12.4.
 */
export interface ItemDeBrinco { id: string; nome: string; categoria: 'acessorio'; lugar: 'orelha'; preco: number; descricao: string; visual: { joia: 'brincos' }; estilos?: string[]; luxo?: boolean; nivel?: number }
const b = (id: string, nome: string, preco: number, descricao: string, x: Partial<ItemDeBrinco> = {}): ItemDeBrinco =>
  ({ id, nome, categoria: 'acessorio', lugar: 'orelha', preco, descricao, visual: { joia: 'brincos' }, ...x });
export const BRINCOS_13: ItemDeBrinco[] = [
  b('brincos_perola', 'Brincos de pérola', 420, 'Uma pérola cultivada em cada orelha, presa rente.', { estilos: ['elegante', 'tradicional', 'social'] }),
  b('brincos_argola_grande', 'Argolas grandes douradas', 180, 'Argola larga, banhada a ouro: aparece de longe.', { estilos: ['urbano', 'baile', 'hiphop', 'afro'] }),
  b('brincos_gota', 'Brincos de gota', 1500, 'Uma pedra em gota pendurada numa haste fina de ouro.', { estilos: ['elegante', 'luxuoso'], nivel: 4, luxo: true }),
  b('brincos_cruz', 'Brincos de cruz pendente', 140, 'Uma cruz pequena de prata balançando.', { estilos: ['rock', 'punk', 'vintage'] }),
  b('brincos_alargador', 'Alargadores (túnel)', 90, 'O túnel de silicone preto no lóbulo alargado aos poucos.', { estilos: ['alternativo', 'punk', 'rock'] })
];
