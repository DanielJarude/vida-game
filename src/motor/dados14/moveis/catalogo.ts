/**
 * VIDA 14 — A LOJA DE MÓVEIS POR TIPO DE MÓVEL, OS CONJUNTOS E A MOBÍLIA DOS IMÓVEIS (catálogo puro, só dados).
 *
 *   TIPOS DE MÓVEL   cada produto da casa (móvel e eletrodoméstico) num tipo só: todos os sofás juntos, todas as
 *                    poltronas juntas, as camas, as mesas… — a 12.8.1 agrupava por cômodo (a poltrona na "Sala", a
 *                    cama de solteiro no "Quarto", a mesa executiva no "Escritório"). O cômodo continua existindo como
 *                    filtro ("para a sala"); o agrupamento da vitrine passa a ser o tipo. O teste confere que nenhum
 *                    produto fica sem tipo; o que aparecer depois sem tipo cai em "Outros".
 *   CONJUNTOS        peças que JÁ existem no catálogo (nenhum produto novo), combinadas por cômodo e estilo: a sala
 *                    (sofá + poltrona de leitura + mesa de centro), o quarto (cama + mesas de cabeceira + guarda-roupa),
 *                    o jantar (mesa com cadeiras + aparador) e a área externa (sofá externo + mesa e cadeiras +
 *                    espreguiçadeiras). O estilo escolhe a peça, o acabamento (a cor) e o segmento da marca.
 *   MOBÍLIA          o que um imóvel mobiliado traz, por nível (parcial, mobiliado, de luxo).
 */

export const TIPOS_DE_MOVEL = [
  { id: 'sofas', nome: 'Sofás' },
  { id: 'poltronas', nome: 'Poltronas' },
  { id: 'camas', nome: 'Camas e colchões' },
  { id: 'mesas', nome: 'Mesas e cadeiras' },
  { id: 'armarios', nome: 'Armários e cômodas' },
  { id: 'closets', nome: 'Closets, penteadeiras e espelhos' },
  { id: 'estantes', nome: 'Estantes, racks e vitrines' },
  { id: 'eletro', nome: 'Eletrodomésticos' },
  { id: 'iluminacao', nome: 'Iluminação' },
  { id: 'decoracao', nome: 'Decoração, tapetes e plantas' },
  { id: 'texteis', nome: 'Cama, mesa, banho e cozinha' },
  { id: 'banheiro', nome: 'Banheiro e spa' },
  { id: 'externos', nome: 'Móveis externos e jardim' },
  { id: 'piscina', nome: 'Piscina' },
  { id: 'lazer', nome: 'Jogos e lazer em casa' },
  { id: 'garagem', nome: 'Garagem e oficina' },
  { id: 'outros', nome: 'Outros' }
] as const;
export type TipoDeMovel = (typeof TIPOS_DE_MOVEL)[number]['id'];

const LISTA: Record<Exclude<TipoDeMovel, 'eletro' | 'outros'>, string[]> = {
  sofas: ['sofa', 'sofa_retratil', 'sofa_couro', 'sofa_designer', 'sofa_cama'],
  poltronas: ['poltrona', 'poltrona_designer', 'poltronas_cinema'],
  camas: ['colchao', 'cama_box', 'cama_king', 'colchao_hotel', 'cama_solteiro', 'beliche'],
  mesas: ['mesa_jantar', 'mesa_centro', 'mesa_centro_marmore', 'mesa_lateral', 'criado_mudo', 'escrivaninha', 'mesa_executiva', 'cadeira_ergonomica', 'ilha_cozinha'],
  armarios: ['guarda_roupa', 'comoda', 'armarios_planejados'],
  closets: ['closet', 'penteadeira', 'espelho_chao', 'expositor_relogios'],
  estantes: ['estante_sala', 'estante_escritorio', 'aparador', 'vitrine_colecao', 'estante_trofeus'],
  iluminacao: ['luz_jardim', 'luz_piscina', 'espelho_led'],
  decoracao: ['quadros', 'objetos_decor', 'plantas', 'vasos_grandes', 'tapete', 'tapete_persa', 'lareira'],
  texteis: ['roupa_de_cama', 'toalhas', 'louca_talheres', 'cozinha_equipada'],
  banheiro: ['banheira', 'banheira_pedra', 'ducha', 'gabinete', 'bancada_marmore', 'sauna'],
  externos: ['espreguicadeira', 'espreguicadeira_teca', 'guarda_sol', 'ombrelone', 'mesa_externa', 'sofa_externo', 'churrasqueira', 'espaco_gourmet', 'forno_pizza', 'pergolado', 'gazebo', 'fonte', 'escultura_jardim'],
  piscina: ['boias', 'aquecedor_piscina', 'capa_piscina', 'cascata', 'kit_piscina'],
  lazer: ['mesa_jogos', 'playground', 'cama_elastica'],
  garagem: ['ferramentas', 'bancada_ferramentas', 'armario_garagem', 'organizadores', 'carregador_ev', 'lavadora_pressao']
};
const DO_PRODUTO = new Map<string, TipoDeMovel>(Object.entries(LISTA).flatMap(([t, ids]) => ids.map(id => [id, t as TipoDeMovel] as const)));
export const temTipoDeMovel = (coisaId: string) => DO_PRODUTO.has(coisaId);

/** O tipo de um produto da casa: o eletrodoméstico é eletrodoméstico (menos o toalheiro, que é do banheiro). */
export function tipoDeMovel(coisaId: string, eletro: boolean): TipoDeMovel {
  if (coisaId === 'toalheiro') return 'banheiro';
  if (eletro) return 'eletro';
  return DO_PRODUTO.get(coisaId) ?? 'outros';
}
export const nomeDoTipoDeMovel = (t: TipoDeMovel) => TIPOS_DE_MOVEL.find(x => x.id === t)!.nome;

/* ================================================================ estilos e conjuntos */

export const ESTILOS = [
  { id: 'moderno', nome: 'Moderno', frase: 'Linhas retas, cores neutras com um toque de cor.', segmento: 2 },
  { id: 'classico', nome: 'Clássico', frase: 'Madeira escura, couro, peças que atravessam décadas.', segmento: 3 },
  { id: 'minimalista', nome: 'Minimalista', frase: 'Pouca coisa, madeira clara, nada sobrando.', segmento: 1 },
  { id: 'industrial', nome: 'Industrial', frase: 'Preto fosco, couro gasto, cara de galpão.', segmento: 2 },
  { id: 'contemporaneo', nome: 'Contemporâneo', frase: 'O que se usa agora: curvas, tons de terra, mistura de materiais.', segmento: 3 },
  { id: 'luxo', nome: 'Luxo', frase: 'Marca de design, mármore, couro e peças de assinatura.', segmento: 4 }
] as const;
export type EstiloDeMovel = (typeof ESTILOS)[number]['id'];
export const nomeDoEstilo14 = (e: EstiloDeMovel) => ESTILOS.find(x => x.id === e)!.nome;

export type CenaDoConjunto = 'sala' | 'quarto' | 'jantar' | 'externa';
export const NOME_DA_CENA: Record<CenaDoConjunto, string> = { sala: 'Sala de estar', quarto: 'Quarto', jantar: 'Sala de jantar', externa: 'Área externa' };
/** Os cômodos (tipos de `dados/lar`) onde cada conjunto entra, na ordem de preferência. */
export const COMODOS_DA_CENA: Record<CenaDoConjunto, string[]> = { sala: ['sala'], quarto: ['quarto'], jantar: ['sala', 'cozinha'], externa: ['lazer', 'jardim', 'piscina', 'varanda'] };

export interface PecaDoConjunto { coisaId: string; /** o acabamento preferido (nome da variante, em `dados/pertences`); ausente: o primeiro */ acabamento?: string[] }
export interface Conjunto { id: string; cena: CenaDoConjunto; estilo: EstiloDeMovel; nome: string; pecas: PecaDoConjunto[] }

const p = (coisaId: string, ...acabamento: string[]): PecaDoConjunto => (acabamento.length ? { coisaId, acabamento } : { coisaId });
const PECAS: Record<CenaDoConjunto, Record<EstiloDeMovel, PecaDoConjunto[]>> = {
  sala: {
    moderno: [p('sofa_retratil', 'cinza-claro'), p('poltrona', 'mostarda'), p('mesa_centro', 'madeira natural')],
    classico: [p('sofa_couro', 'conhaque', 'caramelo'), p('poltrona', 'verde-oliva'), p('mesa_centro', 'madeira escura')],
    minimalista: [p('sofa', 'bege', 'cinza-claro'), p('poltrona', 'cinza-claro'), p('mesa_centro', 'madeira clara')],
    industrial: [p('sofa_couro', 'preto', 'caramelo'), p('poltrona', 'terracota'), p('mesa_centro', 'madeira escura')],
    contemporaneo: [p('sofa_retratil', 'bege'), p('poltrona', 'azul-petróleo'), p('mesa_centro_marmore', 'travertino')],
    luxo: [p('sofa_designer', 'bouclé off-white'), p('poltrona_designer'), p('mesa_centro_marmore', 'carrara', 'nero marquina')]
  },
  quarto: {
    moderno: [p('cama_box'), p('criado_mudo', 'madeira natural'), p('guarda_roupa', 'madeira natural')],
    classico: [p('cama_king'), p('criado_mudo', 'madeira escura'), p('guarda_roupa', 'madeira natural')],
    minimalista: [p('cama_box'), p('criado_mudo', 'madeira clara'), p('guarda_roupa', 'branco')],
    industrial: [p('cama_box'), p('criado_mudo', 'madeira escura'), p('guarda_roupa', 'madeira natural')],
    contemporaneo: [p('cama_king'), p('criado_mudo', 'madeira natural'), p('guarda_roupa', 'madeira natural')],
    luxo: [p('cama_king'), p('criado_mudo', 'madeira escura'), p('closet')]
  },
  jantar: {
    moderno: [p('mesa_jantar', 'madeira natural'), p('aparador', 'laca off-white')],
    classico: [p('mesa_jantar', 'madeira escura'), p('aparador', 'laca vinho')],
    minimalista: [p('mesa_jantar', 'madeira clara'), p('aparador', 'laca off-white')],
    industrial: [p('mesa_jantar', 'madeira escura'), p('aparador', 'laca preta')],
    contemporaneo: [p('mesa_jantar', 'madeira natural'), p('aparador', 'laca verde')],
    luxo: [p('mesa_jantar', 'madeira escura'), p('aparador', 'laca preta')]
  },
  externa: {
    moderno: [p('sofa_externo'), p('mesa_externa', 'grafite'), p('guarda_sol')],
    classico: [p('mesa_externa'), p('espreguicadeira'), p('guarda_sol')],
    minimalista: [p('mesa_externa'), p('espreguicadeira')],
    industrial: [p('mesa_externa', 'grafite'), p('espreguicadeira'), p('ombrelone')],
    contemporaneo: [p('sofa_externo'), p('mesa_externa'), p('espreguicadeira')],
    luxo: [p('sofa_externo'), p('mesa_externa'), p('espreguicadeira_teca'), p('ombrelone')]
  }
};

export const CONJUNTOS: Conjunto[] = (Object.keys(PECAS) as CenaDoConjunto[]).flatMap(cena =>
  ESTILOS.map(e => ({ id: `${cena}_${e.id}`, cena, estilo: e.id, nome: `${NOME_DA_CENA[cena]} ${e.nome.toLowerCase()}`, pecas: PECAS[cena][e.id] })));
export const conjunto14 = (id: string) => CONJUNTOS.find(c => c.id === id);
export const conjuntoDe = (cena: CenaDoConjunto, estilo: EstiloDeMovel) => CONJUNTOS.find(c => c.cena === cena && c.estilo === estilo)!;

/* ================================================================ a mobília dos imóveis */

export type NivelDeMobilia = 'vazio' | 'parcial' | 'mobiliado' | 'luxo';
export const NOME_DA_MOBILIA: Record<NivelDeMobilia, string> = { vazio: 'Vazio', parcial: 'Semimobiliado', mobiliado: 'Mobiliado', luxo: 'Mobiliado de luxo' };
/** Quanto o aluguel mobiliado custa a mais (fração do aluguel vazio). */
export const ACRESCIMO_DO_ALUGUEL: Record<NivelDeMobilia, number> = { vazio: 0, parcial: 0.1, mobiliado: 0.22, luxo: 0.35 };
/** Na venda, a mobília entra pelo valor de usada em bom estado (fração do preço de novo). */
export const FATOR_DA_MOBILIA_NA_VENDA = 0.7;
/** O estado (0–100) das peças que vêm com o imóvel. */
export const ESTADO_DA_MOBILIA = 85;

/** O que vem na cozinha e na área de serviço, por nível. */
export const COZINHA_DA_MOBILIA: Record<Exclude<NivelDeMobilia, 'vazio'>, string[]> = {
  parcial: ['geladeira', 'fogao'],
  mobiliado: ['geladeira', 'fogao', 'maquina_lavar', 'microondas'],
  luxo: ['geladeira_inox', 'cooktop_forno', 'maquina_lavar', 'lava_loucas', 'adega']
};
/** O semimobiliado: o quarto com cama e armário (o resto, a cozinha). */
export const QUARTO_DO_SEMIMOBILIADO: string[] = ['cama_box', 'guarda_roupa'];
