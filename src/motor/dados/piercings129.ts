/**
 * VIDA 12.9 — PIERCINGS: as joias de cada furo, como itens de estilo (`ITENS_ESTILO`): um por lugar do corpo (o nostril,
 * o septo, a sobrancelha, o lábio, o helix e o tragus da orelha, o umbigo), comprados, usados, trocados e tirados como
 * qualquer peça — o retrato (o rosto, a orelha) e a figura (o umbigo, com o tronco à mostra) desenham cada um no seu
 * lugar. O lóbulo continua sendo o dos brincos (lugar `orelha`): com o helix e o tragus, a orelha tem três furos.
 *
 * Joias de verdade: o aço cirúrgico e o titânio (os do primeiro furo, os que o estúdio recomenda), a prata, o ouro
 * amarelo e rosé, o preto (PVD); argola (segmento/clicker), ponto de luz (labret de rosca), barra curva, ferradura
 * (o septo), trio (pontos em fila no helix). Puro: só tipos.
 */
export type RegiaoDePiercing = 'nariz' | 'septo' | 'sobrancelha' | 'labio' | 'helix' | 'tragus' | 'umbigo';
export type FormaDePiercing = 'ponto' | 'argola' | 'barra' | 'ferradura' | 'trio' | 'pingente';
export type MetalDePiercing = 'aco' | 'titanio' | 'prata' | 'ouro' | 'ouro_rose' | 'preto';

export interface Piercing { regiao: RegiaoDePiercing; forma: FormaDePiercing; metal: MetalDePiercing; /** A pedra (cor), quando tem. */ pedra?: string }

export const COR_DO_METAL: Record<MetalDePiercing, [string, string]> = {
  aco: ['#b9bec4', '#7d848c'], titanio: ['#a7adb6', '#6c737c'], prata: ['#d9dde2', '#8d939b'],
  ouro: ['#e1bd5f', '#a3802c'], ouro_rose: ['#e6a98f', '#a8664f'], preto: ['#3b3d42', '#141518']
};
export const NOME_DA_REGIAO: Record<RegiaoDePiercing, string> = {
  nariz: 'no nariz', septo: 'no septo', sobrancelha: 'na sobrancelha', labio: 'no lábio', helix: 'no alto da orelha (helix)', tragus: 'no tragus', umbigo: 'no umbigo'
};

/** O item de estilo de cada joia (o mesmo formato de `dados/estilo.ItemEstilo`, sem importar o módulo: só os campos). */
export interface ItemDePiercing {
  id: string; nome: string; categoria: 'acessorio'; lugar: RegiaoDePiercing; preco: number; descricao: string;
  piercing: Piercing; estilos?: string[]; luxo?: boolean; nivel?: number;
}

const p = (id: string, nome: string, preco: number, piercing: Piercing, descricao: string, x: Partial<ItemDePiercing> = {}): ItemDePiercing =>
  ({ id, nome, categoria: 'acessorio', lugar: piercing.regiao, preco, piercing, descricao, ...x });

export const PIERCINGS: ItemDePiercing[] = [
  // Nariz (nostril)
  p('pc_nariz_ponto_aco', 'Piercing no nariz — ponto de aço', 120, { regiao: 'nariz', forma: 'ponto', metal: 'aco' }, 'O furo e um ponto de aço cirúrgico. Discreto, o primeiro de muita gente.', { estilos: ['casual', 'alternativo'] }),
  p('pc_nariz_ponto_zirconia', 'Piercing no nariz — ponto de luz', 180, { regiao: 'nariz', forma: 'ponto', metal: 'titanio', pedra: '#e9f6ff' }, 'Titânio com uma zircônia que pega a luz.', { estilos: ['casual', 'elegante'] }),
  p('pc_nariz_argola_prata', 'Argola no nariz — prata', 160, { regiao: 'nariz', forma: 'argola', metal: 'prata' }, 'Argola fina de prata, depois de cicatrizado.', { estilos: ['alternativo', 'rock', 'vintage'] }),
  p('pc_nariz_argola_ouro', 'Argola no nariz — ouro 18k', 1400, { regiao: 'nariz', forma: 'argola', metal: 'ouro' }, 'Ouro dezoito, argola delicada.', { estilos: ['elegante'], luxo: true, nivel: 4 }),
  p('pc_nariz_diamante', 'Ponto de diamante no nariz', 9800, { regiao: 'nariz', forma: 'ponto', metal: 'ouro', pedra: '#f4fbff' }, 'Um diamante pequeno em ouro branco. Brilha sem fazer barulho.', { estilos: ['luxuoso', 'elegante'], luxo: true, nivel: 5 }),
  // Septo
  p('pc_septo_ferradura', 'Septo — ferradura de aço', 140, { regiao: 'septo', forma: 'ferradura', metal: 'aco' }, 'A ferradura de aço: dá para virar para dentro quando precisa.', { estilos: ['alternativo', 'punk', 'rock'] }),
  p('pc_septo_clicker_ouro', 'Septo — argola dourada', 900, { regiao: 'septo', forma: 'argola', metal: 'ouro' }, 'Argola clicker banhada a ouro, fecho escondido.', { estilos: ['alternativo', 'elegante'], nivel: 3 }),
  p('pc_septo_preto', 'Septo — argola preta', 150, { regiao: 'septo', forma: 'argola', metal: 'preto' }, 'Aço com PVD preto. Some na foto em preto e branco, aparece no resto.', { estilos: ['punk', 'rock', 'streetwear'] }),
  // Sobrancelha
  p('pc_sobrancelha_barra', 'Sobrancelha — barra curva de titânio', 150, { regiao: 'sobrancelha', forma: 'barra', metal: 'titanio' }, 'A barra curva no canto de fora da sobrancelha.', { estilos: ['alternativo', 'rock', 'punk'] }),
  p('pc_sobrancelha_argola', 'Sobrancelha — argola preta', 140, { regiao: 'sobrancelha', forma: 'argola', metal: 'preto' }, 'Argola fina no canto da sobrancelha.', { estilos: ['punk', 'streetwear'] }),
  // Lábio
  p('pc_labio_labret', 'Lábio — labret de titânio', 150, { regiao: 'labio', forma: 'ponto', metal: 'titanio' }, 'O ponto embaixo do lábio (labret), com a base lisa por dentro.', { estilos: ['alternativo', 'rock'] }),
  p('pc_labio_argola', 'Lábio — argola lateral', 150, { regiao: 'labio', forma: 'argola', metal: 'aco' }, 'Argola no canto do lábio de baixo.', { estilos: ['punk', 'alternativo'] }),
  p('pc_labio_rose', 'Lábio — ponto de ouro rosé', 1100, { regiao: 'labio', forma: 'ponto', metal: 'ouro_rose', pedra: '#f6c1cf' }, 'Ouro rosé com uma pedra cor-de-rosa.', { estilos: ['elegante'], nivel: 4, luxo: true }),
  // Helix
  p('pc_helix_argola', 'Helix — argola de prata', 130, { regiao: 'helix', forma: 'argola', metal: 'prata' }, 'Argola no alto da orelha, na cartilagem.', { estilos: ['casual', 'alternativo'] }),
  p('pc_helix_trio', 'Helix — trio de pontos', 260, { regiao: 'helix', forma: 'trio', metal: 'titanio', pedra: '#e9f6ff' }, 'Três furos em fila subindo a orelha, três pontos de luz.', { estilos: ['alternativo', 'elegante'] }),
  p('pc_helix_ouro', 'Helix — ponto de ouro', 780, { regiao: 'helix', forma: 'ponto', metal: 'ouro' }, 'Um ponto de ouro dezoito na cartilagem.', { estilos: ['elegante'], nivel: 4, luxo: true }),
  p('pc_helix_preto', 'Helix — argola preta', 120, { regiao: 'helix', forma: 'argola', metal: 'preto' }, 'Argola preta, fina, na borda da orelha.', { estilos: ['rock', 'punk', 'streetwear'] }),
  // Tragus
  p('pc_tragus_ponto', 'Tragus — ponto de titânio', 140, { regiao: 'tragus', forma: 'ponto', metal: 'titanio' }, 'O furo na cartilagem da frente da orelha.', { estilos: ['casual', 'alternativo'] }),
  p('pc_tragus_diamante', 'Tragus — ponto de diamante', 7200, { regiao: 'tragus', forma: 'ponto', metal: 'ouro', pedra: '#f4fbff' }, 'Diamante pequeno em ouro branco.', { estilos: ['luxuoso'], luxo: true, nivel: 5 }),
  // Umbigo
  p('pc_umbigo_barra', 'Umbigo — barra com pedra', 160, { regiao: 'umbigo', forma: 'barra', metal: 'aco', pedra: '#7fd0e8' }, 'A barra curva com uma pedra azul em cima.', { estilos: ['casual'] }),
  p('pc_umbigo_pingente', 'Umbigo — pingente de prata', 240, { regiao: 'umbigo', forma: 'pingente', metal: 'prata', pedra: '#c6a7e8' }, 'Barra de prata com um pingente pequeno.', { estilos: ['alternativo'] }),
  p('pc_umbigo_ouro', 'Umbigo — barra de ouro', 1500, { regiao: 'umbigo', forma: 'barra', metal: 'ouro', pedra: '#f4fbff' }, 'Ouro dezoito com zircônia.', { estilos: ['elegante'], luxo: true, nivel: 4 })
];

export const REGIOES_DE_PIERCING = new Set<string>(['nariz', 'septo', 'sobrancelha', 'labio', 'helix', 'tragus', 'umbigo']);
const POR_ID = new Map(PIERCINGS.map(x => [x.id, x]));
export const piercingDoItem = (itemId: string): Piercing | undefined => POR_ID.get(itemId)?.piercing;
/** A idade mínima: no Brasil e em quase todo lugar, menor só com autorização — aqui, a partir dos 16. */
export const IDADE_MINIMA_PIERCING = 16;
