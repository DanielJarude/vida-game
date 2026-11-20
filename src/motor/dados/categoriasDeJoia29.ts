/**
 * VIDA 29 — as CATEGORIAS da joalheria (e das joias na Aparência): brincos, colares, pulseiras, anéis, relógios,
 * piercings, tornozeleiras — e as subcategorias onde há variedade (argolas, pontos de luz e pérolas, pendentes, ear cuffs,
 * alargadores; correntes, com pingente, gargantilhas e colares longos; anéis e alianças). Lidas do próprio item (o lugar no
 * corpo, a forma da joia, o furo do piercing): nenhum produto sem categoria, nenhuma categoria inventada sem produto.
 * "Conjuntos" não existe como produto no catálogo: não aparece (não se mostra prateleira vazia).
 * Folha (só tipos importados).
 */
import type { ItemEstilo } from './estilo';
import type { Joia20 } from '../dados20/joias20';

export type CategoriaDeJoia = 'brincos' | 'colares' | 'pulseiras' | 'aneis' | 'relogios' | 'piercings' | 'tornozeleiras';
export const NOME_CATEGORIA_DE_JOIA: Record<CategoriaDeJoia, string> = {
  brincos: 'Brincos', colares: 'Colares e correntes', pulseiras: 'Pulseiras', aneis: 'Anéis', relogios: 'Relógios', piercings: 'Piercings', tornozeleiras: 'Tornozeleiras'
};
export const ORDEM_DAS_JOIAS: CategoriaDeJoia[] = ['brincos', 'colares', 'pulseiras', 'aneis', 'relogios', 'piercings', 'tornozeleiras'];

const ARGOLAS = new Set(['argola_p', 'argola_m', 'argola_g', 'argola_fina', 'argola_grossa', 'huggie', 'argola_perola', 'brincos_argola_grande', 'brincos_ouro']);
const PONTOS = new Set(['brinco_ponto', 'brinco_perola', 'bolinha', 'flor', 'brincos_perola', 'brincos_diamante', 'brincos']);
const PENDENTES = new Set(['brinco_gota', 'geometrico', 'corrente_fio', 'pendente_longo', 'candelabro', 'assimetrico', 'barra', 'meia_lua', 'brincos_gota', 'brincos_cruz']);
const DE_CARTILAGEM = new Set(['ear_cuff', 'climber']);
const CORRENTES = new Set(['veneziana', 'grumet', 'cartier', 'cubana', 'cordao', 'camadas']);
const PINGENTES = new Set(['ponto_de_luz', 'medalha', 'coracao', 'letra', 'gota']);
const GARGANTILHAS = new Set(['choker', 'riviera', 'perolas', 'colar_longo']);

/** A categoria de um item de estilo (undefined = não é joia: roupa, óculos, chapéu, bolsa). */
export function categoriaDeJoia(it: Pick<ItemEstilo, 'lugar' | 'categoria'> & { piercing?: unknown }): CategoriaDeJoia | undefined {
  if (it.piercing) return 'piercings';
  switch (it.lugar) {
    case 'orelha': return 'brincos';
    case 'joia': return 'colares';
    case 'pulseira': return 'pulseiras';
    case 'anel': case 'alianca': return 'aneis';
    case 'pulso': return 'relogios';
    case 'tornozelo': return 'tornozeleiras';
    default: return undefined;
  }
}

/** A subcategoria (onde há variedade): pela forma da joia do catálogo ou pelo id dos brincos antigos. */
export function subcategoriaDeJoia(id: string, it: Pick<ItemEstilo, 'lugar'>, j?: Pick<Joia20, 'forma'>): string | undefined {
  const forma = j?.forma ?? id;
  if (it.lugar === 'orelha') return ARGOLAS.has(forma) ? 'Argolas' : PONTOS.has(forma) ? 'Pontos de luz e pérolas' : PENDENTES.has(forma) ? 'Pendentes' : DE_CARTILAGEM.has(forma) ? 'Ear cuffs' : id === 'brincos_alargador' ? 'Alargadores' : 'Outros brincos';
  if (it.lugar === 'joia') return CORRENTES.has(forma) ? 'Correntes' : PINGENTES.has(forma) ? 'Com pingente' : GARGANTILHAS.has(forma) ? 'Gargantilhas e colares de pérolas' : 'Outros colares';
  if (it.lugar === 'alianca') return 'Alianças';
  if (it.lugar === 'anel') return 'Anéis';
  return undefined;
}
