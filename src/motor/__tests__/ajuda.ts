/** Utilitários de teste: viver uma vida inteira de forma determinística. */

import { criarVida, type OpcoesCriacao } from '../criacao';
import { avancarAno } from '../ano';
import { executar, type Acao } from '../acoes';
import type { Vida } from '../tipos';
import { idade } from '../nucleo';

export function nova(o: Partial<OpcoesCriacao> = {}): Vida {
  return criarVida({ nome: 'Teste', sobrenome: 'Silva', genero: 'feminino', municipioId: 'recife-pe', semente: 42, ...o });
}

/** Avança anos respondendo decisões com a primeira opção livre. */
export function viver(v: Vida, anos: number, acoesPorAno?: (v: Vida) => Acao[]): Vida {
  for (let k = 0; k < anos && !v.morte; k++) {
    for (const a of acoesPorAno?.(v) ?? []) {
      v = executar(v, a).vida;
      if (v.momento) v = responder(v);
    }
    v = avancarAno(v).vida;
    if (v.momento) v = responder(v);
  }
  return v;
}

export function responder(v: Vida, preferir?: string): Vida {
  const m = v.momento!;
  const op = m.opcoes.find(o => o.id === preferir && !o.bloqueio) ?? m.opcoes.find(o => !o.bloqueio) ?? m.opcoes[0];
  return executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
}

export function viverAte(v: Vida, alvo: number, acoesPorAno?: (v: Vida) => Acao[]): Vida {
  return viver(v, Math.max(0, alvo - idade(v)), acoesPorAno);
}
