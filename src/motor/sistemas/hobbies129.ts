/**
 * VIDA 12.9 — HOBBIES COM HISTÓRIA (as regras de `dados/hobbies129`). O ano: quem tem a rotina de tocar avança no
 * instrumento escolhido (mais rápido com aula, ensaio sério e o instrumento em casa; mais devagar tocando no emprestado);
 * cada atividade criativa (foto, desenho, pintura, cozinha, plantas) ganha os marcos da habilidade alcançada — com
 * consequências pequenas e reais (a primeira venda de fotos põe dinheiro na conta; o almoço de domingo aproxima quem
 * mora junto; a horta alegra a casa). Silencioso na biografia (os marcos ficam no próprio hobby, a tela mostra): não
 * mexe nos ids nem no acaso do resto da vida. Nenhum cômodo é exigido.
 */
import type { Vida } from '../tipos';
import { clamp } from '../rng';
import { economiaLocal } from '../dados/lugares';
import { INSTRUMENTOS, instrumento, MARCOS_DE_HOBBY, NIVEIS_DO_INSTRUMENTO, type EstadoHobbies129 } from '../dados/hobbies129';
import { habilidade } from './frentes';
import { coisasDaVida } from './coisas';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { idade } from '../nucleo';

const estado = (v: Vida): EstadoHobbies129 => (v.caminhos.hobbies129 ??= {});
const temRotina = (v: Vida, id: string) => v.rotinas.find(r => r.id === id);

/** O instrumento de agora: o escolhido; sem escolha, o primeiro que a pessoa tem em casa; sem nenhum, o violão. */
export function instrumentoAtual(v: Vida): string {
  const e = v.caminhos.hobbies129;
  if (e?.instrumento && instrumento(e.instrumento)) return e.instrumento;
  const meus = new Set(coisasDaVida(v).map(c => c.coisaId));
  return INSTRUMENTOS.find(i => i.coisas.some(c => meus.has(c)))?.id ?? 'violao';
}
export const temOInstrumento = (v: Vida, id: string) => { const meus = new Set(coisasDaVida(v).map(c => c.coisaId)); return !!instrumento(id)?.coisas.some(c => meus.has(c)); };
export function nivelNoInstrumento(meses: number) {
  let k = 0;
  for (let i = 0; i < NIVEIS_DO_INSTRUMENTO.length; i++) if (meses >= NIVEIS_DO_INSTRUMENTO[i].meses) k = i;
  const prox = NIVEIS_DO_INSTRUMENTO[k + 1];
  return { indice: k, nome: NIVEIS_DO_INSTRUMENTO[k].nome, falta: prox ? Math.max(0, prox.meses - meses) : 0, proximo: prox?.nome };
}

/** O ano dos hobbies (chamado depois das rotinas). */
export function processarHobbies129(v: Vida): void {
  if (v.morte) return;
  const musica = temRotina(v, 'musica');
  if (musica) {
    const e = estado(v);
    const id = instrumentoAtual(v);
    const ins = instrumento(id)!;
    const dose = musica.nivel === 1 ? 0.5 : musica.nivel === 2 ? 1 : 1.5;
    const emCasa = ins.coisas.length === 0 || temOInstrumento(v, id) ? 1 : 0.6;
    const antes = (e.instrumentos ??= {})[id] ?? 0;
    const depois = Math.round((antes + (12 * dose * emCasa) / ins.dificuldade) * 10) / 10;
    e.instrumentos[id] = depois;
    const a = nivelNoInstrumento(antes).indice, b = nivelNoInstrumento(depois).indice;
    for (let k = a + 1; k <= b; k++) marcar(v, `musica:${id}:${k}`, NIVEIS_DO_INSTRUMENTO[k].marco.replace('{instrumento}', ins.nome));
  }
  for (const m of MARCOS_DE_HOBBY) {
    if (!temRotina(v, m.hobby)) continue;
    if (habilidade(v, m.frente) < m.habilidade) continue;
    if (marcar(v, `${m.hobby}:${m.habilidade}`, m.texto)) aplicar(v, m.efeito);
  }
}

function marcar(v: Vida, id: string, texto: string): boolean {
  const e = estado(v);
  const ms = (e.marcos ??= []);
  if (ms.some(x => x.id === id)) return false;
  ms.push({ id, t: v.t, texto });
  if (ms.length > 60) ms.splice(0, ms.length - 60);
  return true;
}

function aplicar(v: Vida, efeito?: string): void {
  if (!efeito) return;
  const custo = economiaLocal(v.moradia.municipioId).custo;
  if (efeito === 'venda_foto' || efeito === 'venda_desenho') { v.financas.conta += Math.round((efeito === 'venda_foto' ? 900 : 600) * custo / 10) * 10; v.mente.felicidade = clamp(v.mente.felicidade + 3); }
  if (efeito === 'presente_feito' || efeito === 'horta') v.mente.felicidade = clamp(v.mente.felicidade + 2);
  if (efeito === 'almoco') for (const vin of Object.values(v.vinculos)) if (vin.convivio.includes('casa')) vin.proximidade = clamp(vin.proximidade + 3);
}

/** Trocar (ou escolher) o instrumento — o que se aprendeu nos outros continua contando. */
export function disponibilidadeInstrumento(v: Vida, id: string): Veredito {
  if (!instrumento(id)) return bloqueio('impossivel', 'Esse instrumento não existe aqui.');
  if (idade(v) < 5) return bloqueio('impossivel', 'Ainda é cedo para escolher um instrumento.');
  if (instrumentoAtual(v) === id && v.caminhos.hobbies129?.instrumento === id) return bloqueio('incompativel', 'É o instrumento que você já pratica.');
  return PERMITIDO;
}
export function escolherInstrumento(v: Vida, id: string): string {
  const e = estado(v);
  e.instrumento = id;
  const ins = instrumento(id)!;
  const meses = e.instrumentos?.[id] ?? 0;
  const tem = ins.coisas.length === 0 || temOInstrumento(v, id);
  return `${meses ? 'De volta ao' : 'Agora é o'} ${ins.nome}${meses ? ` (${nivelNoInstrumento(meses).nome})` : ''}.${tem ? '' : ' Sem um em casa, a prática rende menos — dá para comprar na loja de instrumentos.'}`;
}

/** Para a tela: o instrumento de agora, o nível em cada um, os marcos de um hobby. */
export function leituraDosHobbies(v: Vida, hobby?: string) {
  const e = v.caminhos.hobbies129;
  const atual = instrumentoAtual(v);
  return {
    atual,
    instrumentos: INSTRUMENTOS.map(i => ({ id: i.id, nome: i.nome, meses: e?.instrumentos?.[i.id] ?? 0, nivel: nivelNoInstrumento(e?.instrumentos?.[i.id] ?? 0), tem: i.coisas.length === 0 || temOInstrumento(v, i.id) })),
    marcos: (e?.marcos ?? []).filter(m => !hobby || m.id.startsWith(`${hobby}:`)).slice().reverse()
  };
}
