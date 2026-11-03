/**
 * 12.8.1 — as categorias da loja da casa (móveis e decoração), como os tipos de peça da loja de roupas: uma por produto,
 * sem subcategoria, na ordem da vitrine. Cada móvel e cada eletrodoméstico do catálogo tem a sua (o teste confere que
 * nenhum fica sem); o que aparecer depois sem lugar marcado cai em Decoração.
 *
 * Catálogo puro (só dados), no pacote `motor-casa`.
 */
export const CATEGORIAS_DA_CASA = [
  { id: 'sala', nome: 'Sala e estar' }, { id: 'quarto', nome: 'Quarto' }, { id: 'cozinha', nome: 'Cozinha e jantar' },
  { id: 'escritorio', nome: 'Escritório' }, { id: 'banheiro', nome: 'Banheiro' }, { id: 'iluminacao', nome: 'Iluminação' },
  { id: 'decoracao', nome: 'Decoração' }, { id: 'externa', nome: 'Jardim, área externa e piscina' },
  { id: 'garagem', nome: 'Garagem e organização' }, { id: 'eletro', nome: 'Eletrodomésticos' }
] as const;
export type CategoriaDaCasa = (typeof CATEGORIAS_DA_CASA)[number]['id'];

const LISTA: Record<Exclude<CategoriaDaCasa, 'eletro'>, string[]> = {
  sala: ['sofa', 'sofa_retratil', 'sofa_couro', 'sofa_designer', 'sofa_cama', 'poltrona', 'poltrona_designer', 'mesa_centro', 'mesa_centro_marmore', 'mesa_lateral', 'estante_sala', 'aparador', 'lareira', 'vitrine_colecao', 'estante_trofeus', 'mesa_jogos', 'poltronas_cinema'],
  quarto: ['colchao', 'roupa_de_cama', 'cama_box', 'cama_king', 'colchao_hotel', 'cama_solteiro', 'beliche', 'guarda_roupa', 'closet', 'penteadeira', 'criado_mudo', 'espelho_chao', 'comoda', 'expositor_relogios'],
  cozinha: ['mesa_jantar', 'louca_talheres', 'ilha_cozinha', 'armarios_planejados'],
  escritorio: ['escrivaninha', 'mesa_executiva', 'cadeira_ergonomica', 'estante_escritorio'],
  banheiro: ['banheira', 'banheira_pedra', 'ducha', 'gabinete', 'bancada_marmore', 'espelho_led', 'toalhas', 'sauna'],
  iluminacao: ['luz_jardim', 'luz_piscina'],
  decoracao: ['quadros', 'objetos_decor', 'plantas', 'vasos_grandes', 'tapete', 'tapete_persa'],
  externa: ['espreguicadeira', 'espreguicadeira_teca', 'guarda_sol', 'ombrelone', 'mesa_externa', 'sofa_externo', 'boias', 'aquecedor_piscina', 'capa_piscina', 'cascata', 'kit_piscina', 'churrasqueira', 'espaco_gourmet', 'forno_pizza', 'pergolado', 'gazebo', 'fonte', 'escultura_jardim', 'playground', 'cama_elastica'],
  garagem: ['ferramentas', 'bancada_ferramentas', 'armario_garagem', 'organizadores']
};
const DA_COISA = new Map<string, CategoriaDaCasa>(Object.entries(LISTA).flatMap(([c, ids]) => ids.map(id => [id, c as CategoriaDaCasa] as const)));
export const temCategoriaDaCasa = (coisaId: string) => DA_COISA.has(coisaId);

/** A categoria de uma coisa da loja da casa (o eletrodoméstico, a sua; o móvel sem lugar marcado, Decoração). */
export function categoriaDaCasa(coisaId: string, eletro: boolean): CategoriaDaCasa {
  return eletro ? 'eletro' : DA_COISA.get(coisaId) ?? 'decoracao';
}
export const nomeDaCategoriaDaCasa = (c: CategoriaDaCasa) => CATEGORIAS_DA_CASA.find(x => x.id === c)!.nome;
