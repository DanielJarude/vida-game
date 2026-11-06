/**
 * VIDA 12.9 — RECEBER E SAIR JUNTO: o jantar em casa, a festa, o churrasco, a festa na piscina, a sessão de cinema, a
 * noite de jogos, a saída em grupo, o cinema. Quem vai, você escolhe (entre quem está perto e com quem você tem
 * relação); o que a casa tem decide o que dá para fazer (sem churrasqueira não há churrasco; o tamanho da casa decide
 * quantos cabem); o dinheiro decide o jeito (do dia a dia, caprichado, com buffet) — e quem tem pouco faz o simples, ou
 * racha a conta.
 *
 * O que acontece é de verdade e com cada um: a proximidade de cada convidado cresce (menos com quem já veio muitas vezes,
 * mais com o encontro caprichado e o cômodo bom); quem estava brigado com você pode fazer as pazes — ou deixar um clima;
 * o ex e o par atual na mesma festa dão ciúme; a festa no prédio pode render reclamação e multa do condomínio; quem
 * organiza se diverte e se cansa. Um de cada tipo por ano. Reaproveita os vínculos, os cômodos (`casaViva`: a mesma
 * qualidade do cômodo, a mesma vez no ano da festa na piscina e do churrasco), o dinheiro e a Linha da Vida.
 *
 * Sorteios derivados (`rngDe`): receber gente não mexe no acaso do resto da vida.
 */
import type { Pessoa, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { escrever, idade, idadePessoa, lembrarCom } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { modeloMoradia } from '../dados/bens';
import { coisa } from '../dados/coisas';
import { COMODOS } from '../dados/lar';
import { ENCONTROS, encontro, MULT_DO_JEITO, type JeitoDoEncontro, type ModeloDeEncontro, type TipoDeEncontro } from '../dados/encontros129';
import { areaDoComodo, casaDaFamilia, comodoEquipado, comodosDaCasa } from './lar';
import { fatorDaQualidade, nivelDoComodo } from './casaViva';
import { pagar, vereditoDePagar } from './dinheiro';
import { temCoisa } from './coisas';
import { mesmaCidade, moraJunto } from './vinculos';
import { estadoDaRelacao } from './lacos';
import { dinheiro as fmt } from '../texto';

const ano = (v: Vida) => Math.floor(v.t / 12);
const custo = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const arred = (x: number) => Math.round(x / 10) * 10;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const chave = (t: TipoDeEncontro) => `encontro:${t}`;
const SOCIAIS = new Set(['sala', 'cozinha', 'lazer', 'piscina', 'varanda', 'jardim', 'jogos', 'cinema', 'adega', 'quadra']);

/** Quem dá para chamar: quem mora junto ou na cidade, com relação (família, par, convívio ou amizade), sem briga rompida. */
export function convidaveis(v: Vida, m: ModeloDeEncontro): Pessoa[] {
  const minimo = m.idadeMin >= 16 ? 14 : 4;
  return Object.values(v.vinculos)
    .map(vin => ({ vin, p: v.pessoas[vin.pessoaId] }))
    .filter(({ vin, p }) => p && p.vivo && !p.especie && p.nome
      && (moraJunto(vin) || mesmaCidade(v, p))
      && estadoDaRelacao(v, vin) !== 'rompido' && vin.digital?.bloqueado === undefined
      && (vin.parentesco || (vin.romance && vin.romance.estagio !== 'ex' && vin.romance.estagio !== 'interesse') || vin.convivio.length > 0 || vin.proximidade >= 30 || (vin.romance?.estagio === 'ex' && vin.proximidade >= 40))
      && (idadePessoa(v, p) >= minimo || !!vin.parentesco))
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)
    .map(x => x.p);
}

/** Onde: o cômodo que serve (o melhor) ou a coisa; `undefined` = a casa não tem. Fora de casa: sempre. */
function lugarDoEncontro(v: Vida, m: ModeloDeEncontro): { ok: boolean; qualidade: number; onde?: string } {
  if (!m.emCasa) return { ok: true, qualidade: 1 };
  if (!m.comodos && !m.coisas) return { ok: true, qualidade: 1 };
  const cms = comodosDaCasa(v).filter(c => m.comodos?.includes(c.tipo) && comodoEquipado(v, c));
  if (cms.length) {
    const melhor = cms.map(c => ({ c, q: fatorDaQualidade(nivelDoComodo(v, c)) })).sort((a, b) => b.q - a.q)[0];
    return { ok: true, qualidade: melhor.q, onde: COMODOS[melhor.c.tipo]?.nome ?? melhor.c.nome };
  }
  const tem = (m.coisas ?? []).find(id => temCoisa(v, id));
  return tem ? { ok: true, qualidade: 0.95, onde: coisa(tem)?.nome } : { ok: false, qualidade: 1 };
}

/** Quantos cabem: pela área dos cômodos de receber (a sala, a cozinha, a área de lazer, a piscina...). */
export function capacidade(v: Vida, m: ModeloDeEncontro): number {
  if (!m.emCasa) return m.convidados[1];
  const area = comodosDaCasa(v).filter(c => SOCIAIS.has(c.tipo)).reduce((s, c) => s + areaDoComodo(v.moradia.modeloId, c), 0) || 30;
  return Math.max(0, Math.min(m.convidados[1], Math.floor(area / m.m2PorPessoa) - 1));
}

export function custoDoEncontro(v: Vida, m: ModeloDeEncontro, n: number, jeito: JeitoDoEncontro = 'simples', rachar = false): number {
  const porPessoa = m.porPessoa * custo(v) * MULT_DO_JEITO[jeito].custo;
  return arred(porPessoa * (rachar ? 1 : n + 1));
}

function vezNoAno(v: Vida, m: ModeloDeEncontro): boolean {
  const f = v.fatos[chave(m.id)];
  if (f !== undefined && Math.floor(f / 12) === ano(v)) return true;
  if (m.usoDoComodo) { const g = v.fatos[`ucomodo:${m.usoDoComodo[0]}:${m.usoDoComodo[1]}`]; if (g !== undefined && Math.floor(g / 12) === ano(v)) return true; }
  return false;
}

export function disponibilidadeEncontro(v: Vida, tipo: string, convidados?: string[], jeito: JeitoDoEncontro = 'simples', rachar = false): Veredito {
  const m = encontro(tipo);
  if (!m) return bloqueio('impossivel', 'Esse encontro não existe.');
  if (idade(v) < m.idadeMin) return bloqueio('impossivel', `A partir dos ${m.idadeMin} anos.`);
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if (m.emCasa && casaDaFamilia(v) && m.id !== 'jantar' && m.id !== 'cinema_casa' && m.id !== 'jogos') return bloqueio('incompativel', 'Na casa dos seus pais, festa assim só com a casa sendo sua.');
  const lugar = lugarDoEncontro(v, m);
  if (!lugar.ok) {
    const falta = [...(m.comodos ?? []).map(c => COMODOS[c as keyof typeof COMODOS]?.nome).filter(Boolean), ...(m.coisas ?? []).slice(0, 2).map(c => coisa(c)?.nome).filter(Boolean)];
    return bloqueio('impossivel', `A casa não tem onde: ${falta.slice(0, 3).join(', ')}.`);
  }
  if (vezNoAno(v, m)) return bloqueio('incompativel', `Você já fez ${m.nome === 'cinema' ? 'um cinema com gente' : `um${/^(festa|sess|noite|saída)/.test(m.nome) ? 'a' : ''} ${m.nome}`} neste ano.`);
  const cand = convidaveis(v, m);
  if (cand.length < m.convidados[0]) return bloqueio('incompativel', 'Não há gente por perto o bastante para isso agora.');
  const cab = capacidade(v, m);
  if (cab < m.convidados[0]) return bloqueio('incompativel', 'A casa é pequena demais para isso.');
  if (rachar && m.emCasa) return bloqueio('impossivel', 'Em casa, quem recebe é quem paga.');
  if (jeito === 'buffet' && !m.emCasa) return bloqueio('impossivel', 'Buffet é para receber em casa.');
  if (convidados) {
    const ids = [...new Set(convidados)];
    if (ids.length < m.convidados[0]) return bloqueio('incompativel', m.convidados[0] === 1 ? 'Chame pelo menos uma pessoa.' : `Chame pelo menos ${m.convidados[0]} pessoas.`);
    if (ids.length > cab) return bloqueio('incompativel', m.emCasa ? `Na sua casa cabem até ${cab} convidados para isso.` : `No máximo ${cab} pessoas.`);
    const ok = new Set(cand.map(p => p.id));
    if (ids.some(id => !ok.has(id))) return bloqueio('incompativel', 'Alguém da lista não está por perto para isso.');
    return vereditoDePagar(v, custoDoEncontro(v, m, ids.length, jeito, rachar), 'Custa');
  }
  return vereditoDePagar(v, custoDoEncontro(v, m, m.convidados[0], jeito, rachar), 'Custa a partir de');
}

/** O encontro: paga, cada convidado sente, a casa e a vizinhança respondem. Devolve o que aconteceu. */
export function fazerEncontro(v: Vida, tipo: string, convidados: string[], jeito: JeitoDoEncontro = 'simples', rachar = false): string {
  const m = encontro(tipo)!;
  const ids = [...new Set(convidados)];
  const gente = ids.map(id => v.pessoas[id]).filter(Boolean);
  const r = rngDe(v.id, 'encontro', m.id, v.t);
  const lugar = lugarDoEncontro(v, m);
  const q = MULT_DO_JEITO[jeito].qualidade * lugar.qualidade * (ids.length > capacidade(v, m) * 0.85 ? 0.95 : 1);
  const total = custoDoEncontro(v, m, ids.length, jeito, rachar);
  pagar(v, total);
  v.fatos[chave(m.id)] = v.t;
  if (m.usoDoComodo) v.fatos[`ucomodo:${m.usoDoComodo[0]}:${m.usoDoComodo[1]}`] = v.t;
  const notas: string[] = [];
  // O par e o ex na mesma festa.
  const par = gente.find(p => { const ro = v.vinculos[p.id]?.romance; return ro && ro.estagio !== 'ex' && ro.estagio !== 'interesse' && !ro.secreto; });
  const ex = gente.find(p => v.vinculos[p.id]?.romance?.estagio === 'ex');
  let pazes = 0, clima = 0;
  for (const p of gente) {
    const vin = v.vinculos[p.id];
    if (!vin) continue;
    const h = (vin.habitos ??= {});
    const n = (h[`encontro:${m.id}`] = (h[`encontro:${m.id}`] ?? 0) + 1);
    const repeticao = n <= 2 ? 1 : n <= 5 ? 0.7 : 0.45;
    let ganho = m.prox * q * repeticao * (rachar ? 0.75 : 1);
    if (vin.tensao >= 40) {
      // Quem estava brigado: o encontro pode aproximar — ou deixar um clima.
      if (r.next() < 0.55) { vin.tensao = clamp(vin.tensao - 10); ganho *= 1.2; pazes++; lembrarCom(v, p.id, `Fizeram as pazes no ${m.nome}.`, 'ritual', 1); }
      else { vin.tensao = clamp(vin.tensao + 4); ganho *= 0.3; clima++; }
    }
    vin.proximidade = clamp(Math.round(vin.proximidade + Math.max(1, ganho)));
    vin.tUltimoContato = v.t;
    v.anoAtual.acoes.push(`pessoa:encontro_${m.id}:${p.id}`);
    if (n === 1 && vin.proximidade >= 55 && ids.length <= 4) lembrarCom(v, p.id, `${cap(m.nome)} com você pela primeira vez.`, 'ritual', 1);
  }
  if (par && ex && par.id !== ex.id) {
    const vp = v.vinculos[par.id];
    vp.tensao = clamp(vp.tensao + 8);
    notas.push(`${par.nome} não gostou de ver ${ex.nome} na lista.`);
  }
  if (pazes) notas.push(pazes === 1 ? 'Quem estava de mal com você saiu de bem.' : `${pazes} pessoas que andavam de mal com você saíram de bem.`);
  if (clima) notas.push(clima === 1 ? 'Com uma pessoa, ficou um clima.' : `Com ${clima} pessoas, ficou um clima.`);
  // O prédio: a festa grande pode virar reclamação e multa.
  const predio = m.emCasa && !casaDaFamilia(v) && v.moradia.modeloId && !modeloMoradia(v.moradia.modeloId)?.casa;
  if (m.barulho && predio && ids.length >= 8 && r.next() < 0.45) {
    const multa = arred(350 * custo(v));
    pagar(v, multa);
    v.mente.estresse = clamp(v.mente.estresse + 3);
    notas.push(`O vizinho reclamou do barulho: multa do condomínio de ${fmt(multa)}.`);
  }
  // Quem organiza: diverte-se e cansa (a festa grande cansa mais).
  v.mente.felicidade = clamp(v.mente.felicidade + Math.round(m.feliz * q));
  v.mente.estresse = clamp(v.mente.estresse + Math.round(m.cansaco * (ids.length >= 15 ? 1.5 : 1)) - 2);
  // A primeira de cada tipo e as grandes entram na Linha da Vida.
  const grande = ids.length >= 12 || jeito === 'buffet';
  if (v.fatos[`encontro_primeiro:${m.id}`] === undefined || grande) {
    v.fatos[`encontro_primeiro:${m.id}`] ??= v.t;
    escrever(v, { texto: `${cap(m.nome)}${grande ? ` para ${ids.length} pessoas` : ''}: ${gente.slice(0, 4).map(p => p.nome).join(', ')}${gente.length > 4 ? ' e mais gente' : ''}.`, relevancia: grande ? 'biografia' : 'cotidiano', tema: 'social', escolha: true, pessoas: gente.slice(0, 6).map(p => p.id) } as never);
  }
  const nome = gente.length === 1 ? gente[0].nome : gente[Math.floor(r.next() * gente.length)]?.nome ?? '';
  const texto = m.textos[Math.floor(r.next() * m.textos.length)].replace(/\{nome\}/g, nome);
  const quem = gente.length <= 3 ? ` Com ${gente.map(p => p.nome).join(', ').replace(/, ([^,]*)$/, ' e $1')}.` : ` ${gente.length} convidados.`;
  const onde = lugar.onde && m.emCasa ? ` (${lugar.onde})` : '';
  return `${texto}${quem}${onde} ${rachar ? 'Cada um pagou o seu' : 'Gasto'}: ${fmt(total)}.${notas.length ? ' ' + notas.join(' ') : ''}`;
}

/** Para a tela: cada encontro, se dá, quem dá para chamar, quantos cabem, o custo por pessoa. */
export function encontrosPossiveis(v: Vida) {
  return ENCONTROS.filter(m => idade(v) >= m.idadeMin).map(m => ({
    modelo: m,
    veredito: disponibilidadeEncontro(v, m.id),
    candidatos: convidaveis(v, m),
    capacidade: capacidade(v, m),
    porPessoa: custoDoEncontro(v, m, 0),
    lugar: lugarDoEncontro(v, m).onde
  }));
}
