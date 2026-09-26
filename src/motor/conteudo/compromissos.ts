/**
 * A pergunta que o jogo faz quando duas trajetórias não cabem juntas.
 *
 * "Você foi chamado para a base. A rotina de treinos entra em conflito com a
 * faculdade. O que você quer fazer?" — e cada opção diz, antes, o que
 * acontece. A regra de quem conflita com quem mora em `sistemas/compromissos`.
 */

import type { Rng } from '../rng';
import type { Vida } from '../tipos';
import type { Conteudo, Ctx } from './base';
import { contexto } from './base';
import { abrirDecisao, conteudoPorId } from './motor';
import { resolverPendente } from '../sistemas/compromissos';
import { listaNatural } from '../texto';
import { curso } from '../dados/cursos';

const pend = (c: Ctx) => c.v.caminhos.pendente;

export const COMPROMISSOS: Conteudo[] = [
  {
    id: 'comp_conflito', tipo: 'decisao', idade: [10, 110], tema: 'escolha', prioritario: true, prioridade: 6, repetir: 0,
    // Quando o conflito nasceu no ano (um concurso que chamou, por exemplo), a pergunta abre com o ano.
    quando: c => !!pend(c),
    titulo: c => {
      const p = pend(c);
      if (!p) return 'Uma escolha';
      const novo = p.novo.tipo === 'base' ? 'A base' : p.novo.tipo === 'contrato_esporte' ? 'O contrato' : p.novo.tipo === 'negocio' ? 'O negócio' : p.novo.tipo === 'dedicar_negocio' ? 'O negócio' : p.novo.tipo === 'servico_militar' ? 'O quartel' : p.novo.tipo === 'curso' ? (curso(p.novo.cursoId).nivel === 'superior' ? 'A faculdade' : 'O curso') : p.novo.via === 'concurso' ? 'A posse' : 'O trabalho novo';
      return `${novo} e o resto da vida`;
    },
    texto: c => {
      const p = pend(c);
      if (!p) return 'A escolha já passou.';
      const porque = p.conflitos.length === 1 ? `${p.conflitos[0]}.` : `${listaNatural(p.conflitos)}.`;
      const pergunta = p.novo.tipo === 'servico_militar' ? 'Servir é obrigatório. O que você faz com o resto?' : 'Tudo junto não cabe. O que você quer fazer?';
      return `${p.oferta} ${porque} ${pergunta}`;
    },
    opcoes: [0, 1, 2, 3].map(k => ({
      id: `plano_${k}`,
      texto: (c: Ctx) => pend(c)?.planos[k]?.texto ?? '—',
      disponivel: (c: Ctx) => (pend(c)?.planos[k] ? true : false),
      consequencia: (c: Ctx) => pend(c)?.planos[k]?.consequencias.join(' '),
      // O plano grava na Linha da Vida o que foi deixado, com o motivo; o texto da folha diz o que mudou.
      resolver: (c: Ctx) => {
        const recusa = !!pend(c)?.planos[k]?.recusa;
        const texto = resolverPendente(c.v, c.r, k);
        return { texto, memoria: null, tom: recusa ? 'neutro' as const : 'bom' as const };
      }
    }))
  }
];

/** Abre a pergunta do conflito pendente (quando uma ação o criou). */
export function abrirConflitoPendente(v: Vida, r: Rng): void {
  const d = conteudoPorId('comp_conflito');
  if (d && d.tipo === 'decisao' && v.caminhos.pendente && !v.momento) abrirDecisao(v, d, contexto(v, r));
}
