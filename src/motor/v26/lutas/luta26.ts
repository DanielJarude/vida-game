/**
 * VIDA 26.2 — escolher (ou trocar) o estilo de luta: a ação `luta26`, a leitura para as telas e o que muda na carreira.
 *
 * A técnica de lutas continua UMA frente (`frentes.lutas`) — é ela que a base, a seletiva e a carreira leem. O estilo diz
 * de qual estilo é essa técnica: ao trocar, a técnica do estilo que se deixa fica guardada (`Vida.lutas26.tecnicas`) e a
 * frente passa a valer a do estilo novo — a que já se tinha nele ou parte da de agora (`aproveitamento26`), o que for
 * maior. Voltar a um estilo devolve o que se tinha nele: nada se perde, mas recomeçar custa.
 * Durante a carreira profissional, trocar é decisão grande: dá para fazer, com o custo dito antes.
 */
import type { Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { clamp } from '../../rng';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { garantirFrente, habilidade } from '../../sistemas/frentes';
import { aproveitamento26, ESTILOS26, faixa26, LISTA_ESTILOS26, NOME_FAMILIA26, type EstiloLuta26 } from '../esporte/estilos26';

export const estiloDaLuta26 = (v: Vida): EstiloLuta26 | undefined => v.lutas26?.estilo;
/** O nome da luta desta vida: o estilo ("Muay Thai") ou, sem estilo, "luta". */
export const nomeDaLuta26 = (v: Vida) => { const e = estiloDaLuta26(v); return e ? ESTILOS26[e].nome : 'luta'; };

/** Pratica (ou compete) luta: a rotina, a frente ou a carreira. */
const praticaLuta = (v: Vida) => v.rotinas.some(r => r.id === 'lutas') || (v.caminhos.esporte?.modalidade === 'lutas' && v.caminhos.esporte.fase !== 'encerrada');
const anosDeLuta = (v: Vida) => (v.caminhos.frentes.lutas?.meses ?? 0) / 12;

/** A técnica que o estilo novo teria (sem mudar nada): a guardada nele ou parte da de agora, o que for maior. */
export function tecnicaNoEstilo26(v: Vida, para: EstiloLuta26): number {
  const de = estiloDaLuta26(v);
  const agora = habilidade(v, 'lutas');
  if (!de) return agora;
  if (de === para) return agora;
  return Math.round(Math.max(v.lutas26?.tecnicas?.[para] ?? 0, agora * aproveitamento26(de, para)) * 10) / 10;
}

export function disponibilidadeLuta26(v: Vida, estilo: EstiloLuta26): Veredito {
  if (!ESTILOS26[estilo]) return bloqueio('impossivel', 'Estilo desconhecido.');
  if (!praticaLuta(v)) return bloqueio('requisito', 'Primeiro, começar a treinar luta (Minha Semana · Corpo e mente).');
  if (estiloDaLuta26(v) === estilo) return bloqueio('impossivel', 'Já é o seu estilo.');
  if (estilo === 'mma' && idade(v) < 18) return bloqueio('requisito', 'MMA de competição é para maiores de 18; até lá, dá para treinar os estilos que o compõem.');
  return PERMITIDO;
}

export function executarLuta26(v: Vida, estilo: EstiloLuta26): { texto: string; tom: 'bom' | 'neutro' } {
  const d = disponibilidadeLuta26(v, estilo);
  if (d.grau !== 'permitido') return { texto: d.motivo ?? 'Agora não.', tom: 'neutro' };
  const de = estiloDaLuta26(v);
  const st = (v.lutas26 ??= {});
  const f = garantirFrente(v, 'lutas');
  const nova = tecnicaNoEstilo26(v, estilo);
  if (de) (st.tecnicas ??= {})[de] = f.habilidade;
  st.estilo = estilo; st.desde = v.t;
  if (de) st.trocas = (st.trocas ?? 0) + 1;
  f.habilidade = clamp(nova);
  f.auge = Math.max(f.auge, f.habilidade);
  const e = ESTILOS26[estilo];
  const carreira = v.caminhos.esporte?.modalidade === 'lutas' && v.caminhos.esporte.fase !== 'encerrada';
  const guardada = (st.tecnicas?.[estilo] ?? 0) >= nova - 0.01 && (st.tecnicas?.[estilo] ?? 0) > 0;
  const texto = de
    ? `Trocou o ${ESTILOS26[de].nome} pelo ${e.nome}${carreira ? ' — no meio da carreira' : ''}. A técnica no ${e.nome} começa em ${Math.round(nova)} (${guardada ? 'o que já tinha nele' : `parte do que sabia no ${ESTILOS26[de].nome}`}); a do ${ESTILOS26[de].nome} fica guardada.`
    : `Escolheu o ${e.nome} como estilo de luta (${NOME_FAMILIA26[e.familia]}).`;
  escrever(v, { texto, relevancia: de ? 'biografia' : 'cotidiano', tema: 'lazer', tom: 'neutro', escolha: true });
  return { texto, tom: de ? 'neutro' : 'bom' };
}

/** A leitura para as telas: o estilo, a família, a faixa (quando há), a próxima faixa e o que pede, os outros estilos com o custo de trocar. */
export function leituraDaLuta26(v: Vida) {
  const estilo = estiloDaLuta26(v);
  const h = habilidade(v, 'lutas');
  const faixa = estilo ? faixa26(estilo, h, anosDeLuta(v), idade(v)) : undefined;
  return {
    estilo, h, faixa,
    opcoes: LISTA_ESTILOS26.map(id => ({ id, nome: ESTILOS26[id].nome, familia: NOME_FAMILIA26[ESTILOS26[id].familia], sobre: ESTILOS26[id].sobre, tecnica: tecnicaNoEstilo26(v, id), guardada: v.lutas26?.tecnicas?.[id], veredito: disponibilidadeLuta26(v, id) }))
  };
}

/** Saves: o que vier quebrado sai (estilo desconhecido, técnicas fora de 0..100). */
export function normalizarLuta26(v: Vida): void {
  const x = v.lutas26;
  if (!x) return;
  if (typeof x !== 'object' || (x.estilo && !ESTILOS26[x.estilo])) { delete v.lutas26; return; }
  if (x.tecnicas) for (const k of Object.keys(x.tecnicas) as EstiloLuta26[]) if (!ESTILOS26[k] || !Number.isFinite(x.tecnicas[k])) delete x.tecnicas[k];
}
