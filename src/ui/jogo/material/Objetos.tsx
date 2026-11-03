/**
 * O desenho de cada coisa (REWORK 4 → REWORK 8): a forma PRÓPRIA do objeto (ilustracao/objetos), na COR e no
 * ACABAMENTO que ele tem nesta vida (o violão de madeira escura, a raquete vermelha, o sofá verde). "Interface
 * contida, vida colorida": a cor é do objeto (do motor: `CoisaTida.cor`), não um enfeite da tela. Sem cor (a
 * vitrine, o presente ainda não dado), a coisa aparece no acabamento mais comum dela — a primeira variante.
 */

import { memo } from 'react';
import { variantesDaCoisa } from '../../../motor/dados/pertences';
import { Ilustracao, valida } from '../../ilustracao/nucleo';
import { amostraDoObjeto } from '../../ilustracao/objetos';
import { comEstiloDaMarca } from '../../ilustracao/estiloDeMarca';
import { estiloDaMarca } from '../../../motor/sistemas/perfilDaMarca';

/** 12.8: com `marca`, o desenho leva o acabamento dela (o metal, o volume, o filete) — o mesmo produto, outra marca. */
export const DesenhoObjeto = memo(function DesenhoObjeto({ coisaId, cor, tamanho = 48, rotulo, marca }: { coisaId: string; cor?: string; tamanho?: number; rotulo?: string; marca?: string }) {
  const c = valida(cor, valida(variantesDaCoisa(coisaId)[0]?.cor, '#a49a8c'));
  const estilo = marca ? estiloDaMarca(marca) : undefined;
  const a = comEstiloDaMarca(amostraDoObjeto(coisaId, c), estilo, `${coisaId}|${c}`);
  return <Ilustracao a={a} largura={tamanho} rotulo={rotulo ?? coisaId} className="desenho-objeto" dados={{ 'data-coisa': coisaId, ...(estilo ? { 'data-estilo-marca': estilo } : {}) }} />;
});
