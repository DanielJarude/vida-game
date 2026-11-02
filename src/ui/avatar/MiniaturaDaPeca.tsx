/**
 * 12.7 — A MINIATURA DE UMA PEÇA: a vitrine da loja, o "O que você está usando" e o provador mostram a peça de verdade
 * (o desenho dela no catálogo de `pecas.ts`, no corpo de quem vai usar), recortada na parte do corpo onde ela vai. Óculos,
 * chapéu e brincos aparecem no rosto (o retrato com o modelo do produto). Nunca um desenho genérico: o que se vê é o
 * produto anunciado.
 */
import type { Vida, Visual } from '../../motor/tipos';
import { idade } from '../../motor/nucleo';
import { itemEstilo, lugaresDoItem } from '../../motor/dados/estilo';
import { tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { Retrato } from './Retrato';
import { Figura, focoDaPeca } from './Figura';
import '../catalogo.css';

/** O retrato só com a peça do rosto (os óculos, o chapéu, os brincos deste produto). */
export function visualComPecaDoRosto(base: Visual, itemId: string): Visual {
  const it = itemEstilo(itemId)!;
  const v: Visual = { ...base };
  delete v.oculos; delete v.chapeu; delete v.modeloOculos; delete v.modeloChapeu; delete v.brincos; delete v.joia;
  if (it.categoria === 'oculos' && it.visual?.oculos) { v.oculos = it.visual.oculos; v.modeloOculos = it.id; }
  if (it.categoria === 'chapeu' && it.visual?.chapeu) { v.chapeu = it.visual.chapeu; v.modeloChapeu = it.id; }
  if (it.lugar === 'orelha') v.brincos = true;
  return v;
}

export function MiniaturaDaPeca({ vida, itemId, id, largura = 84, rotulo }: { vida: Vida; itemId: string; id?: string; largura?: number; rotulo?: string }) {
  const it = itemEstilo(itemId);
  if (!it) return null;
  const i = idade(vida);
  const nome = rotulo ?? it.nome;
  if (it.categoria === 'oculos' || it.categoria === 'chapeu' || it.lugar === 'orelha') {
    return <span className="miniatura-peca miniatura-peca--rosto" data-item={itemId}><Retrato visual={visualComPecaDoRosto(vida.eu.visual, itemId)} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} tamanho={largura} rotulo={nome} soCabeca /></span>;
  }
  const corpo = tipoDeCorpo(vida);
  const lugar = it.lugar === 'corpo' || (!it.lugar && it.categoria === 'roupa') ? 'corpo' : it.lugar ?? lugaresDoItem(it)[0];
  const visual: Visual = { ...vida.eu.visual };
  delete visual.chapeu; delete visual.oculos; delete visual.superior;
  return (
    <span className="miniatura-peca" data-item={itemId}>
      <Figura visual={visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={corpo} pecas={[{ itemId, id: id ?? `${itemId}-vitrine` }]} largura={largura} semFundo foco={focoDaPeca(vida.eu.genero, corpo, i, lugar)} rotulo={nome} />
    </span>
  );
}
