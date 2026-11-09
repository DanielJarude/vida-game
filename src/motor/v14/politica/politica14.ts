/**
 * VIDA 14 · POLÍTICA — o mandato que deixa marca (estado em `VidaPolitica.v14`, tipos em `dados14/politica/tipos`).
 *
 *   GESTÃO   prefeito, vereador, deputado, senador, governador: medidas concretas do catálogo (`dados14/politica/medidas`)
 *            — lei, reforma, investimento, imposto, programa, decisão administrativa. A que passa por votação depende da
 *            casa (o apoio parlamentar, a oposição, a aprovação); a que passa fica EM VIGOR: custa por ano às contas
 *            públicas, faz efeito depois da carência e mexe na economia, na população e nas instituições enquanto vale.
 *            Os indicadores mexem na aprovação todo ano; o déficit vira dívida; três anos de rombo, as contas rejeitadas.
 *            No fim do mandato, o LEGADO (o que mudou entre a posse e a saída) pesa na reputação.
 *   FILIAÇÃO a direção do partido (a relação), a permanência mínima de dois anos entre trocas e a JUSTA CAUSA (expulsão,
 *            fusão do partido, perseguição interna), que abre a troca sem perder o mandato.
 *   BELÉM    Portugal: o Presidente da República é eleito em data própria (janeiro, posse em março) e NÃO governa:
 *            promulga ou veta os diplomas, envia ao Tribunal Constitucional, ouve o Conselho de Estado, nomeia o
 *            Primeiro-Ministro e pode dissolver a Assembleia da República (CRP, arts. 133.º–136.º e 172.º).
 *
 * Os ganchos entram por `PRESIDENCIA` (`sistemas/politica`) — o motor antigo não importa este módulo.
 */
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { CargoEletivo, Vida, VidaPolitica } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { flex, ge } from '../../texto';
import { bloqueio, PERMITIDO, podeTentar, type Veredito } from '../../plausibilidade';
import { paisDaVida } from '../../mundo/vida';
import { sortearNome, sortearSobrenome } from '../../dados/nomes';
import { partidoDe } from '../../dados/partidos';
import { REGRAS_PRESIDENCIAIS } from '../../dados/presidencia129';
import { aliviar, desgastar } from '../../sistemas/desgastePolitico';
import { marcar } from '../../sistemas/marcas';
import type { AcaoProfissional } from '../../sistemas/profissao';
import type { Acao } from '../../acoes';
import {
  PRESIDENCIA, cargoNoCiclo, cargoNoPais, emMandato, naPolitica, nomeCargo, partidosDoPais, podeConcorrer,
  regraDaTroca, registrarNoMandato, tDaEleicaoDe, type SaidaPolitica
} from '../../sistemas/politica';
import { presidencia } from '../../sistemas/presidencia129';
import { DIPLOMAS_PT, MEDIDAS_14, NOME_TIPO_MEDIDA, medida14, type ModeloMedida14 } from '../../dados14/politica/medidas';
import type { Belem14, Filiacao14, Gestao14, Legado14, Medida14, Politica14 } from '../../dados14/politica/tipos';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const r1 = (x: number) => Math.round(x * 10) / 10;
const pol14 = (p: VidaPolitica): Politica14 => (p.v14 ??= {});
const MEDIDAS_POR_ANO = 2;
/** A permanência mínima num partido antes de trocar de novo, sem justa causa (meses). */
export const PERMANENCIA_MINIMA_14 = 24;
const JANELA_JUSTA_CAUSA = 12;

/* ================================================================ Gestão */

/** O mandato tem gestão própria? (a Presidência governa por `presidencia129`; o PR português, por Belém). */
const comGestao = (v: Vida) => { const m = v.caminhos.politica?.mandato; return !!m && emMandato(v) && m.cargo !== 'presidente'; };
const escopoDe = (c: CargoEletivo) => cargoNoPais(c).escopo as Gestao14['escopo'];

/** A gestão do mandato corrente (criada na primeira vez; a de um mandato anterior vira legado antes). */
export function gestao14(v: Vida): Gestao14 | undefined {
  const p = v.caminhos.politica;
  if (!p || !comGestao(v)) return undefined;
  const m = p.mandato!;
  const x = pol14(p);
  if (x.gestao && (x.gestao.tInicio !== m.tInicio || x.gestao.cargo !== m.cargo)) fecharGestao(v, p);
  if (!x.gestao) {
    const fase = v.economia?.fase ?? 'normal';
    const eco = fase === 'crise' ? 40 : fase === 'desaceleracao' ? 46 : fase === 'expansao' ? 56 : 50;
    const porte = [8, 0, -6][v.fatos['pol_partido_porte'] ?? 1] ?? 0;
    const apoio = Math.round(clamp(30 + porte + p.apoio * 0.25 + (m.aprovacao - 50) * 0.2, 12, 70));
    x.gestao = {
      cargo: m.cargo, tInicio: m.tInicio, escopo: escopoDe(m.cargo), economia: eco, populacao: 50, instituicoes: 50, saldo: 0, divida: 35,
      apoioParlamentar: apoio, oposicao: 30, medidas: [], deficits: 0,
      inicio: { economia: eco, populacao: 50, instituicoes: 50, divida: 35, aprovacao: Math.round(m.aprovacao) }, anos: []
    };
  }
  return x.gestao;
}

/** Fecha a gestão de um mandato que acabou: o legado (e a reputação que ele dá ou tira). */
function fecharGestao(v: Vida, p: VidaPolitica): void {
  const x = pol14(p);
  const g = x.gestao;
  if (!g) return;
  x.gestao = undefined;
  const d = { economia: r1(g.economia - g.inicio.economia), populacao: r1(g.populacao - g.inicio.populacao), instituicoes: r1(g.instituicoes - g.inicio.instituicoes), divida: r1(g.divida - g.inicio.divida) };
  const aprovadas = g.medidas.filter(z => z.estado !== 'rejeitada').map(z => medida14(z.id)?.nome ?? z.id);
  if (!aprovadas.length && !g.anos.length) return; // um mandato sem nada decidido não deixa legado de gestão
  const soma = d.economia + d.populacao + d.instituicoes * 0.7 - Math.max(0, d.divida) / 6;
  const veredito = soma >= 12 ? 'uma gestão que mudou a vida de quem morava lá' : soma >= 4 ? 'uma gestão que deixou coisas de pé' : soma > -4 ? 'uma gestão sem grandes marcas' : 'uma gestão que deixou a casa pior do que encontrou';
  const leg: Legado14 = { cargo: g.cargo, de: anoDe(g.tInicio), ate: anoDe(v.t), aprovadas, rejeitadas: g.medidas.filter(z => z.estado === 'rejeitada').length, revogadas: g.medidas.filter(z => z.estado === 'revogada').length, delta: d, veredito };
  (x.legados ??= []).push(leg);
  if (x.legados.length > 10) x.legados.splice(0, x.legados.length - 10);
  p.reputacao = clamp(p.reputacao + clamp(soma / 3, -6, 6));
  escrever(v, { texto: `O legado de ${nomeCargo(v, g.cargo)} (${leg.de}–${leg.ate}): ${veredito}${aprovadas.length ? ` — ${aprovadas.slice(0, 3).join(', ')}` : ''}.`, relevancia: 'biografia', tema: 'trabalho', tom: soma >= 4 ? 'bom' : soma <= -4 ? 'ruim' : undefined });
}

/** As medidas que este cargo pode tomar (o Executivo executa e propõe; o Legislativo propõe leis). */
export function medidasDoCargo(v: Vida): ModeloMedida14[] {
  const m = v.caminhos.politica?.mandato;
  if (!m || !comGestao(v)) return [];
  const exe = cargoNoPais(m.cargo).executivo;
  const esc = escopoDe(m.cargo);
  return MEDIDAS_14.filter(x => (x.quem === 'ambos' || (x.quem === 'executivo') === exe) && (!x.escopos || x.escopos.includes(esc)));
}

const medidasNoAno = (v: Vida) => v.anoAtual.acoes.filter(x => x.startsWith('pol14_medida')).length;

export function dispMedida(v: Vida, id: string): Veredito {
  const g = gestao14(v);
  const mod = medida14(id);
  if (!g || !mod) return bloqueio('impossivel', 'Medida de gestão é coisa de quem tem mandato.');
  if (!medidasDoCargo(v).includes(mod)) return bloqueio('impossivel', cargoNoPais(g.cargo).executivo ? 'Isso sai do Legislativo, não do seu gabinete.' : 'Isso é ato do Executivo: o mandato legislativo propõe leis.');
  if (g.medidas.some(z => z.id === id && z.estado === 'em_vigor')) return bloqueio('incompativel', 'Já está em vigor.');
  if (g.medidas.some(z => z.id === id && z.estado === 'rejeitada' && v.t - z.t < 12)) return bloqueio('incompativel', 'A casa rejeitou isso há menos de um ano: não volta à pauta tão cedo.');
  if (medidasNoAno(v) >= MEDIDAS_POR_ANO) return bloqueio('incompativel', 'A agenda do ano já tem duas medidas: mais que isso, nada anda.');
  if (mod.custo > 0 && g.divida >= 90) return { grau: 'irregular', motivo: 'A dívida já passa do limite prudente: gastar mais agora fere as regras de responsabilidade fiscal (e o tribunal de contas olha).' };
  return mod.quorum > 0 ? { grau: 'improvavel', chance: chanceDaVotacao(v, g, mod), motivo: `Passa por votação (${mod.quorum}% da casa).` } : PERMITIDO;
}

function chanceDaVotacao(v: Vida, g: Gestao14, mod: ModeloMedida14): number {
  const m = v.caminhos.politica!.mandato!;
  const band = v.caminhos.politica!.prioridade && v.caminhos.politica!.prioridade === mod.bandeira ? 4 : 0;
  const favor = g.apoioParlamentar + 12 + band + (m.aprovacao - 50) * 0.25 + (mod.agora.apoio ?? 0) * 1.5 - g.oposicao * 0.12 + (cargoNoPais(m.cargo).executivo ? 0 : -6);
  return clamp((favor - mod.quorum + 10) / 20, 0.05, 0.95);
}

function aplicarAgora(v: Vida, g: Gestao14, mod: ModeloMedida14): void {
  const p = v.caminhos.politica!;
  const m = p.mandato!;
  const a = mod.agora;
  if (a.aprovacao) m.aprovacao = clamp(m.aprovacao + a.aprovacao);
  if (a.apoio) g.apoioParlamentar = Math.round(clamp(g.apoioParlamentar + a.apoio, 5, 90));
  if (a.oposicao) g.oposicao = Math.round(clamp(g.oposicao + a.oposicao));
  if (a.partido) { const f = filiacao14(v); if (f) f.relacao = Math.round(clamp(f.relacao + a.partido)); }
}

export function executarMedida(v: Vida, r: Rng, id: string): SaidaPolitica {
  const p = v.caminhos.politica!;
  const m = p.mandato!;
  const g = gestao14(v)!;
  const mod = medida14(id)!;
  v.anoAtual.acoes.push(`pol14_medida:${id}`);
  const fim = (texto: string, tom: 'bom' | 'ruim' | 'neutro', bio = false): SaidaPolitica => { escrever(v, { texto, relevancia: bio ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, tom: tom === 'neutro' ? undefined : tom }); return { texto, tom }; };
  const efeito = descreverEfeito(mod);
  let votos: number | undefined;
  if (mod.quorum > 0) {
    const ch = chanceDaVotacao(v, g, mod);
    votos = Math.round(clamp(mod.quorum - 10 + ch * 20 + r.normal() * 6, 5, 95));
    const passou = votos >= mod.quorum;
    if (!passou) {
      g.medidas.push({ id, t: v.t, estado: 'rejeitada', votos, quorum: mod.quorum, anos: 0, carencia: 0 });
      m.aprovacao = clamp(m.aprovacao - 1);
      g.apoioParlamentar = Math.round(clamp(g.apoioParlamentar - 2, 5, 90));
      desgastar(p, 2, 'promessas');
      return fim(`${cap(mod.nome)} foi derrotada em plenário: ${votos}% a favor, precisava de ${mod.quorum}%. Quem perdia com ela (${mod.quemPerde}) fez a conta antes de você.`, 'ruim');
    }
    // O projeto do Legislativo ainda passa pela sanção do Executivo.
    if (!cargoNoPais(m.cargo).executivo && r.chance(0.2 + g.oposicao / 400)) {
      g.medidas.push({ id, t: v.t, estado: 'rejeitada', votos, quorum: mod.quorum, anos: 0, carencia: 0 });
      p.reputacao = clamp(p.reputacao + 1);
      return fim(`${cap(mod.nome)} passou na casa (${votos}%), mas o Executivo vetou. O seu nome ficou no projeto; a derrubada do veto fica para outra vez.`, 'neutro');
    }
  }
  const med: Medida14 = { id, t: v.t, estado: 'em_vigor', votos, quorum: mod.quorum || undefined, anos: mod.duracao, carencia: mod.carencia };
  g.medidas.push(med);
  if (g.medidas.length > 40) g.medidas.splice(0, g.medidas.length - 40);
  aplicarAgora(v, g, mod);
  m.feito += 2;
  registrarNoMandato(v, `${anoDe(v.t)} · ${mod.nome}${votos !== undefined ? ` (${votos}% na votação)` : ''}`);
  const quando = mod.carencia ? `O efeito deve aparecer em ${mod.carencia === 1 ? 'um ano' : `${mod.carencia} anos`}` : 'O efeito começa já';
  return fim(`${cap(mod.nome)} ${votos !== undefined ? `foi aprovada com ${votos}% dos votos` : 'saiu por ato do Executivo'}. ${quando} e dura ${mod.duracao} anos: ${efeito}. Quem perde: ${mod.quemPerde}.`, 'bom', true);
}

export function dispRevogar(v: Vida, id: string): Veredito {
  const g = gestao14(v);
  if (!g || !g.medidas.some(z => z.id === id && z.estado === 'em_vigor')) return bloqueio('impossivel', 'Não há essa medida em vigor.');
  const mod = medida14(id);
  if (mod && !medidasDoCargo(v).includes(mod)) return bloqueio('impossivel', 'Revogar isso não cabe ao seu cargo.');
  if (medidasNoAno(v) >= MEDIDAS_POR_ANO) return bloqueio('incompativel', 'A agenda do ano já tem duas medidas.');
  return { grau: 'improvavel', motivo: 'Quem confiou na medida estranha; a oposição chama de recuo.' };
}

export function executarRevogar(v: Vida, id: string): SaidaPolitica {
  const p = v.caminhos.politica!;
  const g = gestao14(v)!;
  const z = g.medidas.find(x => x.id === id && x.estado === 'em_vigor')!;
  const mod = medida14(id);
  v.anoAtual.acoes.push(`pol14_medida:revogar:${id}`);
  z.estado = 'revogada';
  g.instituicoes = r1(clamp(g.instituicoes - 2));
  p.mandato!.aprovacao = clamp(p.mandato!.aprovacao - 1);
  const texto = `Revogou ${mod?.nome ?? 'a medida'}. O custo dela sai das contas a partir de agora; o que ela fazia, também.`;
  escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  return { texto, tom: 'neutro' };
}

/** O que a medida faz por ano em vigor, em palavras (a mesma conta que o ano aplica). */
export function descreverEfeito(mod: ModeloMedida14): string {
  const nomes: Record<string, string> = { economia: 'a economia', populacao: 'a vida da população', instituicoes: 'as instituições' };
  const partes = Object.entries(mod.porAno).map(([k, x]) => `${(x as number) > 0 ? 'melhora' : 'piora'} ${nomes[k]}`);
  const custo = mod.custo > 0 ? `custa ${r1(mod.custo)}% da receita por ano` : mod.custo < 0 ? `reforça o caixa em ${r1(-mod.custo)}% da receita por ano` : 'não pesa no caixa';
  return [...partes, custo].join(', ');
}

/** O ano da gestão: as contas, as medidas em vigor, os indicadores, a casa, a aprovação. */
function anoDaGestao(v: Vida): void {
  const p = v.caminhos.politica!;
  const g = gestao14(v);
  if (!g || !p.mandato || g.tInicio === v.t) return;
  const m = p.mandato;
  const fase = v.economia?.fase ?? 'normal';
  const rng = rngDe(v.id, 'pol14_gestao', v.t);
  // As contas: a arrecadação acompanha a economia (do país e do lugar); as medidas em vigor custam ou arrecadam.
  let saldo = (fase === 'crise' ? -3 : fase === 'desaceleracao' ? -1 : fase === 'expansao' ? 1.5 : 0.5) + (g.economia - 50) / 25;
  const efeito = { economia: 0, populacao: 0, instituicoes: 0 };
  for (const z of g.medidas) {
    if (z.estado !== 'em_vigor') continue;
    const mod = medida14(z.id);
    if (!mod) continue;
    saldo -= mod.custo;
    if (z.carencia > 0) z.carencia -= 1;
    else for (const [k, x] of Object.entries(mod.porAno)) efeito[k as keyof typeof efeito] += x as number;
    z.anos -= 1;
    if (z.anos <= 0) z.estado = 'concluida';
  }
  // Os indicadores voltam devagar ao normal; o que está em vigor empurra.
  const mover = (k: keyof typeof efeito, extra = 0) => { g[k] = r1(clamp(g[k] + (50 - g[k]) * 0.08 + efeito[k] + extra + rng.normal() * 0.8)); };
  mover('economia', fase === 'crise' ? -2 : fase === 'expansao' ? 1 : 0);
  mover('populacao', saldo < -8 ? -1 : 0); // o rombo grande atrasa salário e fornecedor: quem depende do serviço sente
  mover('instituicoes');
  g.saldo = r1(saldo);
  g.divida = r1(clamp(g.divida - saldo + (g.divida > 60 ? g.divida * 0.03 : 0), 0, 250));
  g.deficits = saldo < -5 ? (g.deficits ?? 0) + 1 : 0;
  // A aprovação sente a vida que mudou (ou não); a casa acompanha a rua; a oposição cresce com a impopularidade.
  m.aprovacao = Math.round(clamp(m.aprovacao + (g.populacao - 50) * 0.08 + (g.economia - 50) * 0.05 + (g.instituicoes - 50) * 0.02));
  if (efeito.populacao + efeito.economia + efeito.instituicoes > 0) m.feito += 1;
  g.apoioParlamentar = Math.round(clamp(g.apoioParlamentar + ((p.apoio + m.aprovacao) / 2 - g.apoioParlamentar) * 0.15 + rng.normal() * 2, 5, 90));
  g.oposicao = Math.round(clamp(g.oposicao + (50 - m.aprovacao) * 0.15 + (g.divida > 80 ? 2 : 0) - 1));
  if (g.oposicao >= 70 && !m.crise) m.crise = { t: v.t, tipo: cargoNoPais(m.cargo).executivo ? 'verba' : 'votacao' };
  if ((g.deficits ?? 0) >= 3) {
    g.deficits = 0;
    m.aprovacao = clamp(m.aprovacao - 6);
    g.instituicoes = r1(clamp(g.instituicoes - 5));
    desgastar(p, 6, 'escandalo');
    v.fatos['pol14_contas_rejeitadas'] = v.t;
    registrarNoMandato(v, `${anoDe(v.t)} · contas rejeitadas pelo tribunal de contas`);
    escrever(v, { texto: `Três anos seguidos de rombo: o tribunal de contas recomendou rejeitar as contas, e ${cargoNoPais(m.cargo).executivo ? 'a casa rejeitou' : 'a oposição transformou isso em bandeira'}. Na próxima eleição, o assunto vai estar em todo debate.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
  g.anos.push({ ano: anoDe(v.t), economia: g.economia, populacao: g.populacao, instituicoes: g.instituicoes, saldo: g.saldo, divida: g.divida, apoio: g.apoioParlamentar });
  if (g.anos.length > 12) g.anos.splice(0, g.anos.length - 12);
}

/* ================================================================ Filiação */

export function filiacao14(v: Vida): Filiacao14 | undefined {
  const p = v.caminhos.politica;
  if (!p?.partido) return p?.v14?.partido;
  return (pol14(p).partido ??= { relacao: 50, trocas: [] });
}

const excecaoAberta = (v: Vida, f?: Filiacao14) => !!f?.excecao && v.t - f.excecao.t <= JANELA_JUSTA_CAUSA;
const trocasSemCausa = (v: Vida, f?: Filiacao14) => (f?.trocas ?? []).filter(x => !x.justa && v.t - x.t <= 96).length;

/** O veto da troca (gancho `troca`): a permanência mínima, salvo justa causa. */
function vetoDaTroca(v: Vida): Veredito | undefined {
  const p = v.caminhos.politica;
  const f = filiacao14(v);
  if (!p?.partido || excecaoAberta(v, f)) return undefined;
  if (p.tFiliacao !== undefined && v.t - p.tFiliacao < PERMANENCIA_MINIMA_14 && (p.partidos?.length ?? 0) > 1)
    return bloqueio('incompativel', `A filiação atual tem menos de dois anos: trocar de novo agora, sem justa causa (expulsão, fusão do partido ou perseguição interna), não se sustenta — nem no partido novo, nem no eleitor. Dá a partir de ${anoDe(p.tFiliacao + PERMANENCIA_MINIMA_14)}.`);
  if (trocasSemCausa(v, f) >= 2) return { grau: 'irregular', motivo: 'Seria a terceira troca de legenda em oito anos: a fama de vira-casaca pesa na urna e nos partidos.' };
  return undefined;
}

/** Na hora da troca (gancho `trocou`): a justa causa protege o mandato; a troca em série é anotada. */
function naTroca(v: Vida, _antes: string | undefined, nova: string | undefined): { justa?: boolean; texto?: string } | undefined {
  const p = v.caminhos.politica!;
  const f = (pol14(p).partido ??= { relacao: 50, trocas: [] });
  const justa = excecaoAberta(v, f) ? f.excecao!.tipo : undefined;
  f.trocas.push({ t: v.t, justa: justa ?? (regraDaTroca(v).como === 'janela' ? 'janela' : undefined) });
  if (f.trocas.length > 12) f.trocas.splice(0, f.trocas.length - 12);
  f.excecao = undefined;
  f.relacao = nova ? 50 : f.relacao;
  if (justa) return { justa: true, texto: `A justa causa (${justa === 'expulsao' ? 'a expulsão' : justa === 'fusao' ? 'a fusão do partido' : 'a perseguição interna'}) foi reconhecida: o mandato fica com você.` };
  const n = trocasSemCausa(v, f);
  if (n >= 2) { desgastar(p, 4, 'partido'); return { texto: `É a ${n === 2 ? 'segunda' : `${n}ª`} troca em poucos anos: os jornais já usam a palavra "vira-casaca".` }; }
  return undefined;
}

/** O ano da filiação: a relação com a direção (os votos, as medidas) e as exceções que a vida abre. */
function anoDaFiliacao(v: Vida): void {
  const p = v.caminhos.politica!;
  const f = filiacao14(v);
  if (!p.partido || !f) return;
  const rng = rngDe(v.id, 'pol14_partido', v.t);
  const a = v.anoAtual.acoes;
  f.relacao = Math.round(clamp(f.relacao + (50 - f.relacao) * 0.1 + (a.includes('pol_cargo:votar_contra') ? -8 : 0) + (a.includes('pol_cargo:votar_com') ? 4 : 0) + (p.desgaste > 50 ? -3 : 0) + (p.mandato && p.mandato.aprovacao >= 60 ? 3 : 0)));
  if (excecaoAberta(v, f)) return;
  if (f.excecao) f.excecao = undefined;
  const sigla = partidoDe(p.partido)?.chamado ?? p.partido;
  if (f.relacao <= 8 && rng.chance(0.4)) {
    f.excecao = { tipo: 'expulsao', t: v.t };
    p.partidos ??= [{ sigla: p.partido, tInicio: p.tFiliacao ?? p.tInicio }];
    const aberto = p.partidos.find(x => x.sigla === p.partido && x.tFim === undefined);
    if (aberto) { aberto.tFim = v.t; aberto.como = 'justa_causa'; }
    p.partido = undefined;
    p.tFiliacao = undefined;
    escrever(v, { texto: `A direção ${sigla} expulsou você do partido. Expulsão é justa causa: por um ano, a filiação a outra legenda não custa o mandato.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'politica', `Expulso(a) ${sigla}, aos ${idade(v)}.`, 2);
  } else if (f.relacao <= 22 && rng.chance(0.3)) {
    f.excecao = { tipo: 'perseguicao', t: v.t };
    escrever(v, { texto: `A direção ${sigla} passou a isolar você: tirou da comissão, cortou o tempo de TV, negou a legenda para a próxima. Perseguição interna é justa causa — a porta de saída está aberta por um ano, sem risco para o mandato.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  } else if (rng.chance(0.012)) {
    f.excecao = { tipo: 'fusao', t: v.t };
    escrever(v, { texto: `${cap(sigla)} anunciou a fusão com outro partido. Quem não quiser ficar na sigla nova tem um ano para sair por justa causa.`, relevancia: 'biografia', tema: 'trabalho' });
  }
}

/* ================================================================ Belém (Portugal) */

const semipresidencial = (v: Vida) => !!REGRAS_PRESIDENCIAIS[paisDaVida(v)]?.semipresidencial;
const emBelem = (v: Vida) => semipresidencial(v) && v.caminhos.politica?.mandato?.cargo === 'presidente' && emMandato(v);
export const belem14 = (v: Vida): Belem14 | undefined => (emBelem(v) || v.caminhos.politica?.v14?.belem ? v.caminhos.politica!.v14!.belem : undefined);

function novoGoverno(v: Vida, rng: Rng, depoisDeEleicao: boolean): NonNullable<Belem14['governo']> {
  const pais = paisDaVida(v);
  const fem = rng.chance(0.4);
  const partidos = partidosDoPais(pais);
  const partido = rng.pick(partidos);
  const maioria = rng.chance(depoisDeEleicao ? 0.3 : 0.25) ? 'absoluta' : 'relativa';
  const meu = v.caminhos.politica?.partido;
  return {
    pm: `${sortearNome(rng, fem ? 'feminino' : 'masculino', anoDe(v.t) - rng.int(42, 64), pais)} ${sortearSobrenome(rng, pais)}`, fem, partido,
    maioria, alinhado: meu ? partido === meu || rng.chance(0.35) : rng.chance(0.45), tInicio: v.t, estabilidade: maioria === 'absoluta' ? 75 : 50
  };
}

/** A posse em Belém (no lugar do governo do país: o PR não governa). */
function posseBelem(v: Vida, reeleicao: boolean): void {
  const p = v.caminhos.politica!;
  const x = pol14(p);
  const rng = rngDe(v.id, 'pt_posse', v.t);
  const antigo = x.belem;
  const b: Belem14 = reeleicao && antigo ? antigo : { relacao: 55, influencia: 40, promulgados: 0, vetos: 0, confirmados: 0, tc: 0, inconstitucionais: 0, dissolucoes: 0, conselhos: 0, registro: [], mandatos: antigo?.mandatos ?? [] };
  if (!b.governo) { b.governo = novoGoverno(v, rng, false); b.tLegislativas = v.t - rng.int(6, 30); }
  const ultimo = b.mandatos[b.mandatos.length - 1];
  b.mandatos.push({ de: anoDe(v.t), seguidos: reeleicao && ultimo ? ultimo.seguidos + 1 : 1 });
  x.belem = b;
  presidencia(v).governo = undefined;
  const g = b.governo;
  escrever(v, { texto: `${reeleicao ? 'Segundo mandato' : 'Tomou posse'} no Palácio de Belém, perante a Assembleia da República. O Presidente não governa: o Governo é de ${g.pm} (${partidoDe(g.partido)?.chamado ?? g.partido}, maioria ${g.maioria}). A arma do cargo é outra — a promulgação, o veto, o Tribunal Constitucional, a palavra.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
}

function fimBelem(v: Vida, como: 'concluiu' | 'renunciou'): void {
  const b = v.caminhos.politica?.v14?.belem;
  if (!b) return;
  const m = b.mandatos[b.mandatos.length - 1];
  if (m && m.ate === undefined) m.ate = anoDe(v.t);
  const ap = Math.round(v.caminhos.politica?.mandato?.aprovacao ?? 50);
  const leg = b.inconstitucionais + b.vetos >= 3 ? 'um Presidente exigente, que travou o que achou errado' : b.dissolucoes > 0 ? 'um Presidente que não hesitou em devolver a palavra ao povo' : b.influencia >= 60 ? 'um Presidente próximo, de influência discreta' : 'um mandato de estabilidade';
  b.registro.push(`${anoDe(v.t)} · ${como === 'concluiu' ? 'saiu de Belém' : 'renunciou'} com ${ap}% de aprovação: ${leg}`);
  b.governo = undefined; b.diploma = undefined; b.crise = undefined; b.formar = undefined;
  escrever(v, { texto: `Deixou Belém com ${ap}% de aprovação: ${leg}. ${b.promulgados} diplomas promulgados, ${b.vetos} vetos, ${b.tc} envios ao Tribunal Constitucional${b.dissolucoes ? `, ${b.dissolucoes === 1 ? 'uma dissolução' : `${b.dissolucoes} dissoluções`} da Assembleia` : ''}.`, relevancia: 'marco', tema: 'trabalho', tom: ap >= 50 ? 'bom' : undefined });
  marcar(v, 'politica', `Ex-Presidente da República: ${leg}.`, 3);
}

/** O ano em Belém: o Governo (a estabilidade, as crises, as legislativas), o diploma do ano e a aprovação. */
function anoBelem(v: Vida): void {
  const p = v.caminhos.politica!;
  const b = p.v14?.belem;
  const m = p.mandato;
  if (!b || !m || !emBelem(v) || m.tInicio === v.t) return;
  const rng = rngDe(v.id, 'pt_ano', v.t);
  const g = b.governo ??= novoGoverno(v, rng, true);
  // As crises de governo (as do motor geral) não são do PR: em Belém, a crise é a do Governo e da Assembleia (`b.crise`).
  if (m.crise) m.crise = undefined;
  // O diploma que ficou na secretária: promulgado (o prazo constitucional correu).
  if (b.diploma && v.t - b.diploma.t >= 12) { b.promulgados += 1; b.diploma = undefined; }
  b.diploma ??= { id: rng.pick(DIPLOMAS_PT).id, t: v.t };
  // O Governo: a maioria absoluta aguenta; a relativa desgasta, e a crise vem.
  const fase = v.economia?.fase ?? 'normal';
  g.estabilidade = Math.round(clamp(g.estabilidade - (g.maioria === 'relativa' ? 6 : 2) - (fase === 'crise' ? 6 : 0) + (b.relacao - 50) * 0.05 + rng.normal() * 5));
  if (!b.crise && g.estabilidade < 30 && rng.chance(0.5)) {
    b.crise = { tipo: rng.pick(['pt_censura', 'pt_orcamento', 'pt_demissao']), t: v.t };
    escrever(v, { texto: b.crise.tipo === 'pt_orcamento' ? 'O Orçamento do Estado chumbou na Assembleia. O país olha para Belém: dissolver e convocar eleições, ou segurar o Governo?' : b.crise.tipo === 'pt_censura' ? 'Uma moção de censura ao Governo passou a ter votos para ser aprovada. Belém vai ter de decidir.' : `${g.pm} apresentou a demissão. Cabe ao Presidente ouvir os partidos e decidir: novo Governo ou eleições antecipadas.`, relevancia: 'biografia', tema: 'trabalho' });
  }
  // As legislativas regulares (quatro anos da última).
  if (b.tLegislativas !== undefined && v.t - b.tLegislativas >= 48) legislativas(v, b, rng, false);
  // A aprovação de um PR mede a presença e a independência — a economia pesa menos que num governo.
  const crise = fase === 'crise';
  m.aprovacao = Math.round(clamp(m.aprovacao + 2.5 + (crise ? 4 : 0) + (b.influencia - 50) * 0.05 + (b.crise ? -2 : 0)));
  b.influencia = Math.round(clamp(b.influencia + (50 - b.influencia) * 0.1));
  m.feito = Math.max(m.feito, 1);
}

function legislativas(v: Vida, b: Belem14, rng: Rng, antecipadas: boolean): void {
  b.tLegislativas = v.t;
  const antes = b.governo;
  b.governo = novoGoverno(v, rng, true);
  b.crise = undefined;
  b.formar = v.t;
  const mudou = !antes || antes.partido !== b.governo.partido;
  escrever(v, { texto: `${antecipadas ? 'Eleições antecipadas' : 'Legislativas'}: ${mudou ? `${partidoDe(b.governo.partido)?.chamado ?? b.governo.partido} venceu` : 'o mesmo partido voltou a vencer'}, com maioria ${b.governo.maioria}. Agora Belém ouve os partidos e nomeia o Primeiro-Ministro.`, relevancia: 'biografia', tema: 'trabalho' });
}

type AcaoBelem = 'pt_promulgar' | 'pt_vetar' | 'pt_tc' | 'pt_conselho' | 'pt_dissolver' | 'pt_nomear' | 'pt_presenca' | 'pt_candidatura';

/** A janela da eleição presidencial portuguesa (data própria) e se a pessoa pode concorrer nela. */
export function eleicaoBelemNaJanela(v: Vida): { ano: number; t: number } | undefined {
  if (!semipresidencial(v)) return undefined;
  const pais = paisDaVida(v);
  for (let a = anoDe(v.t); a <= anoDe(v.t) + 1; a++) {
    const t = tDaEleicaoDe('presidente', a, pais);
    if (t > v.t && t <= v.t + 12 && cargoNoCiclo('presidente', a, pais)) return { ano: a, t };
  }
  return undefined;
}

function dispBelem(v: Vida, a: AcaoBelem): Veredito {
  const p = v.caminhos.politica;
  if (!p) return bloqueio('impossivel', 'Não se aplica.');
  if (a === 'pt_candidatura') {
    const e = eleicaoBelemNaJanela(v);
    if (!naPolitica(v)) return bloqueio('impossivel', 'Primeiro, é preciso estar na vida pública.');
    if (!e) return bloqueio('requisito', 'A eleição para Presidente da República não cai nos próximos meses.');
    if (p.campanha || p.posse) return bloqueio('impossivel', 'A candidatura já está registrada.');
    return podeConcorrer(v, 'presidente', e.t);
  }
  const b = p.v14?.belem;
  if (!emBelem(v) || !b) return bloqueio('impossivel', 'Isso é do Presidente da República.');
  const feita = v.anoAtual.acoes.includes(`pt14:${a}`);
  switch (a) {
    case 'pt_promulgar': case 'pt_vetar': case 'pt_tc': return b.diploma ? PERMITIDO : bloqueio('impossivel', 'Não há diploma à espera.');
    case 'pt_conselho': return feita ? bloqueio('incompativel', 'O Conselho de Estado já reuniu neste ano.') : PERMITIDO;
    case 'pt_presenca': return feita ? bloqueio('incompativel', 'A agenda pelo país deste ano já foi feita.') : PERMITIDO;
    case 'pt_nomear': return b.formar !== undefined ? PERMITIDO : bloqueio('impossivel', 'Não há Governo a formar.');
    case 'pt_dissolver': {
      if (b.tLegislativas !== undefined && v.t - b.tLegislativas < 6) return bloqueio('ilegal', 'A Assembleia não pode ser dissolvida nos seis meses seguintes à sua eleição (CRP, art. 172.º).');
      if (p.mandato && p.mandato.tFim - v.t <= 6) return bloqueio('ilegal', 'No último semestre do mandato presidencial, a dissolução está vedada (CRP, art. 172.º).');
      if (!v.anoAtual.acoes.includes('pt14:pt_conselho')) return bloqueio('requisito', 'Antes de dissolver, a Constituição manda ouvir o Conselho de Estado e os partidos.');
      return b.crise ? PERMITIDO : { grau: 'improvavel', motivo: 'Sem crise à vista, a dissolução parece golpe de mão: o país pode castigar quem a fez.' };
    }
  }
  return bloqueio('impossivel', 'Não se aplica.');
}

function execBelem(v: Vida, r: Rng, a: AcaoBelem): SaidaPolitica {
  const p = v.caminhos.politica!;
  const m = p.mandato;
  const fim = (texto: string, tom: 'bom' | 'ruim' | 'neutro', bio = false): SaidaPolitica => { escrever(v, { texto, relevancia: bio ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, tom: tom === 'neutro' ? undefined : tom }); return { texto, tom }; };
  if (a === 'pt_candidatura') {
    const e = eleicaoBelemNaJanela(v)!;
    p.campanha = { cargo: 'presidente', tEleicao: e.t, gasto: 0, nota: 0, etapa: 1 };
    if (p.fase !== 'mandato') p.fase = 'candidato';
    PRESIDENCIA.registrar?.(v);
    marcar(v, 'candidatura', `${cap(flex(ge(v), 'candidato', 'candidata', 'candidate'))} a Presidente da República, aos ${idade(v)}.`, 3);
    return fim(`Entregou no Tribunal Constitucional as assinaturas de mais de 7.500 cidadãos eleitores: candidatura a Presidente da República, ${p.partido ? `com o apoio ${partidoDe(p.partido)?.chamado ? `de ${partidoDe(p.partido)!.chamado}` : 'do partido'}, mas em nome próprio` : 'sem partido, como manda a tradição do cargo'}. Eleição em janeiro de ${e.ano}.`, 'bom', true);
  }
  v.anoAtual.acoes.push(`pt14:${a}`);
  const b = p.v14!.belem!;
  const g = b.governo;
  const d = b.diploma ? DIPLOMAS_PT.find(x => x.id === b.diploma!.id) : undefined;
  switch (a) {
    case 'pt_promulgar': {
      b.diploma = undefined; b.promulgados += 1;
      b.relacao = Math.round(clamp(b.relacao + 3 * (d?.peso ?? 1)));
      if (m) m.aprovacao = clamp(m.aprovacao + Math.round((d?.rua ?? 0) * 4));
      if (d && d.duvida >= 0.5 && r.chance(d.duvida - 0.2)) { b.influencia = Math.round(clamp(b.influencia - 6)); return fim(`Promulgou ${d.nome}. Meses depois, o Tribunal Constitucional, chamado por deputados, declarou parte dela inconstitucional — e lembrou que Belém podia ter perguntado antes.`, 'ruim'); }
      return fim(`Promulgou ${d?.nome ?? 'o diploma'}, com uma nota a explicar porquê. ${g ? `${g.pm} agradeceu em público.` : ''}`, 'bom');
    }
    case 'pt_vetar': {
      b.diploma = undefined; b.vetos += 1;
      b.relacao = Math.round(clamp(b.relacao - 6 * (d?.peso ?? 1)));
      b.influencia = Math.round(clamp(b.influencia + 3));
      if (m) m.aprovacao = clamp(m.aprovacao + Math.round(-(d?.rua ?? 0) * 5));
      if (g?.maioria === 'absoluta' && r.chance(0.55)) { b.confirmados += 1; b.promulgados += 1; return fim(`Vetou ${d?.nome ?? 'o diploma'} e devolveu-o à Assembleia com a fundamentação. A maioria confirmou o texto sem mudar uma vírgula: a promulgação passa a ser obrigatória (CRP, art. 136.º). O recado ficou dado.`, 'neutro'); }
      return fim(`Vetou ${d?.nome ?? 'o diploma'}. A Assembleia reabriu o texto e acolheu parte das objeções: a lei que sair vai ser outra.`, 'bom', true);
    }
    case 'pt_tc': {
      b.diploma = undefined; b.tc += 1;
      const inconst = r.chance(d?.duvida ?? 0.3);
      b.relacao = Math.round(clamp(b.relacao - (inconst ? 4 : 6)));
      if (inconst) { b.inconstitucionais += 1; b.influencia = Math.round(clamp(b.influencia + 6)); if (m) m.aprovacao = clamp(m.aprovacao + 3); registrarNoMandato(v, `${anoDe(v.t)} · o Tribunal Constitucional deu-lhe razão sobre ${d?.nome ?? 'um diploma'}`); return fim(`Enviou ${d?.nome ?? 'o diploma'} ao Tribunal Constitucional. O Tribunal pronunciou-se pela inconstitucionalidade: veto obrigatório, e o Governo volta à estaca zero.`, 'bom', true); }
      b.promulgados += 1;
      b.influencia = Math.round(clamp(b.influencia - 4));
      return fim(`O Tribunal Constitucional não encontrou inconstitucionalidade em ${d?.nome ?? 'o diploma'}: Belém promulgou, com cara de quem perdeu tempo.`, 'neutro');
    }
    case 'pt_conselho': {
      b.conselhos += 1;
      b.influencia = Math.round(clamp(b.influencia + 4));
      return fim(`Convocou o Conselho de Estado${b.crise ? ' sobre a crise política' : ''}. ${b.crise ? 'Os conselheiros dividiram-se; a decisão é sua.' : 'A reunião, longa, saiu sem comunicado — mas Lisboa inteira soube o que se disse.'}`, 'neutro');
    }
    case 'pt_presenca': {
      b.influencia = Math.round(clamp(b.influencia + 8));
      if (m) m.aprovacao = clamp(m.aprovacao + 3);
      aliviar(p, 3);
      return fim(r.pick(['Uma semana de Presidência aberta no interior: lares, escolas, quartéis de bombeiros. A selfie com o Presidente tornou-se desporto nacional.', 'Falou ao país sem papel, sobre o que ninguém no Governo queria discutir. No dia seguinte, os ministros responderam-lhe.', 'Recebeu em Belém quem nunca lá tinha entrado: as associações, os autarcas das terras pequenas, os emigrantes de visita.']), 'bom');
    }
    case 'pt_nomear': {
      b.formar = undefined;
      if (g) { g.estabilidade = g.maioria === 'absoluta' ? 75 : 55; b.relacao = Math.round(clamp(b.relacao + 4)); }
      b.crise = undefined;
      return fim(`Ouviu os partidos com assento parlamentar e nomeou ${g?.pm ?? 'o novo Primeiro-Ministro'} (${g ? partidoDe(g.partido)?.chamado ?? g.partido : ''}). O Governo toma posse em Belém na semana seguinte.`, 'neutro', true);
    }
    case 'pt_dissolver': {
      b.dissolucoes += 1;
      const justificada = !!b.crise;
      legislativas(v, b, r, true);
      if (m) m.aprovacao = clamp(m.aprovacao + (justificada ? 2 : -8));
      b.influencia = Math.round(clamp(b.influencia + (justificada ? 5 : -10)));
      if (!justificada) desgastar(p, 6, 'exposicao');
      registrarNoMandato(v, `${anoDe(v.t)} · dissolveu a Assembleia da República`);
      return fim(justificada ? 'Dissolveu a Assembleia da República e convocou eleições antecipadas. "Quando o Parlamento não consegue dar um Governo ao país, devolve-se a palavra ao povo."' : 'Dissolveu uma Assembleia que funcionava. Os partidos falaram em "golpe de Belém"; o eleitor foi às urnas contrariado.', justificada ? 'bom' : 'ruim', true);
    }
  }
  return {};
}

function acoesBelem(v: Vida): AcaoProfissional[] {
  const out: AcaoProfissional[] = [];
  const A = (valor: AcaoBelem) => ({ tipo: 'politica', oque: 'governo129', valor } as unknown as Acao);
  const add = (id: AcaoBelem, rotulo: string, porque: string | undefined, peso: number) => { if (podeTentar(dispBelem(v, id))) out.push({ id: `pol14_${id}`, rotulo, porque, acao: A(id), peso }); };
  const e = eleicaoBelemNaJanela(v);
  if (e && !emBelem(v)) add('pt_candidatura', 'Candidatar-se a Presidente da República', `Eleição em janeiro de ${e.ano}: candidatura de cidadãos (7.500 a 15.000 assinaturas), sem precisar de partido.`, 8);
  const b = v.caminhos.politica?.v14?.belem;
  if (!emBelem(v) || !b) return out;
  const d = b.diploma ? DIPLOMAS_PT.find(x => x.id === b.diploma!.id) : undefined;
  if (d) {
    add('pt_promulgar', `Promulgar ${d.nome}`, d.rua < 0 ? 'Na rua, há quem conte com o seu veto.' : undefined, 6);
    add('pt_vetar', `Vetar ${d.nome}`, 'Devolve à Assembleia com os motivos; uma maioria absoluta pode confirmar.', 4);
    add('pt_tc', `Enviar ${d.nome} ao Tribunal Constitucional`, d.duvida >= 0.4 ? 'Há dúvidas sérias de constitucionalidade.' : 'Pedir a fiscalização preventiva.', d.duvida >= 0.4 ? 6 : 2);
  }
  if (b.formar !== undefined) add('pt_nomear', 'Ouvir os partidos e nomear o Primeiro-Ministro', 'Depois das eleições, o Governo sai da Assembleia — e o PR nomeia.', 9);
  add('pt_conselho', 'Convocar o Conselho de Estado', b.crise ? 'Antes de qualquer decisão sobre a crise.' : undefined, b.crise ? 7 : 2);
  add('pt_dissolver', 'Dissolver a Assembleia da República', b.crise ? 'A crise política pede uma saída.' : 'A "bomba atómica" da Constituição.', b.crise ? 6 : 0);
  add('pt_presenca', 'Presidência aberta: percorrer o país', 'A magistratura de influência.', 3);
  return out;
}

/* ================================================================ Leitura (para o painel) */

export interface LeituraPolitica14 {
  gestao?: {
    cargo: string; indicadores: { rotulo: string; valor: number; inicio: number }[]; saldo: number; divida: number; apoio: number; oposicao: number;
    emVigor: { id: string; nome: string; tipo: string; efeito: string; desde: number; ate: number; carencia: number; votos?: number }[];
    ultimas: { nome: string; texto: string }[];
    possiveis: { id: string; nome: string; tipo: string; oque: string; efeito: string; quemPerde: string; votacao?: string }[];
    alerta?: string;
  };
  legados: Legado14[];
  filiacao?: { relacao: number; palavra: string; regra: string; excecao?: string; trocas: number };
  belem?: { governo?: string; estabilidade?: number; relacao: number; influencia: number; diploma?: string; crise?: string; formar: boolean; numeros: string; registro: string[] };
}

export function leituraPolitica14(v: Vida): LeituraPolitica14 | undefined {
  const p = v.caminhos.politica;
  if (!p) return undefined;
  const out: LeituraPolitica14 = { legados: p.v14?.legados ?? [] };
  const g = gestao14(v);
  if (g) {
    const mods = medidasDoCargo(v);
    out.gestao = {
      cargo: nomeCargo(v, g.cargo),
      indicadores: [{ rotulo: 'Economia', valor: g.economia, inicio: g.inicio.economia }, { rotulo: 'População', valor: g.populacao, inicio: g.inicio.populacao }, { rotulo: 'Instituições', valor: g.instituicoes, inicio: g.inicio.instituicoes }],
      saldo: g.saldo, divida: g.divida, apoio: g.apoioParlamentar, oposicao: g.oposicao,
      emVigor: g.medidas.filter(z => z.estado === 'em_vigor').map(z => { const mod = medida14(z.id)!; return { id: z.id, nome: mod.nome, tipo: NOME_TIPO_MEDIDA[mod.tipo], efeito: descreverEfeito(mod), desde: anoDe(z.t), ate: anoDe(v.t) + z.anos, carencia: z.carencia, votos: z.votos }; }),
      ultimas: g.medidas.filter(z => z.estado !== 'em_vigor').slice(-4).reverse().map(z => ({ nome: medida14(z.id)?.nome ?? z.id, texto: z.estado === 'rejeitada' ? `rejeitada em ${anoDe(z.t)}${z.votos !== undefined ? ` (${z.votos}% de ${z.quorum}%)` : ''}` : z.estado === 'revogada' ? 'revogada' : 'cumpriu o prazo' })),
      possiveis: mods.filter(x => !g.medidas.some(z => z.id === x.id && z.estado === 'em_vigor')).map(x => ({ id: x.id, nome: x.nome, tipo: NOME_TIPO_MEDIDA[x.tipo], oque: x.oque, efeito: descreverEfeito(x), quemPerde: x.quemPerde, votacao: x.quorum ? `votação, ${x.quorum}% da casa` : undefined })),
      alerta: g.divida >= 90 ? 'A dívida passou do limite prudente: gasto novo fere a responsabilidade fiscal.' : (g.deficits ?? 0) >= 2 ? 'Dois anos seguidos de rombo: mais um, e o tribunal de contas recomenda rejeitar as contas.' : undefined
    };
  }
  const f = filiacao14(v);
  if (p.partido && f) {
    const desde = p.tFiliacao;
    const livre = desde === undefined || v.t - desde >= PERMANENCIA_MINIMA_14 || (p.partidos?.length ?? 0) <= 1;
    out.filiacao = {
      relacao: f.relacao, palavra: f.relacao >= 70 ? 'de confiança' : f.relacao >= 45 ? 'normal' : f.relacao >= 25 ? 'tensa' : 'em ruptura',
      regra: livre ? 'Pode trocar de partido (com as regras da janela, se tiver mandato).' : `Permanência mínima: sem justa causa, nova troca só a partir de ${anoDe(desde! + PERMANENCIA_MINIMA_14)}.`,
      excecao: excecaoAberta(v, f) ? `Justa causa aberta (${f.excecao!.tipo === 'expulsao' ? 'expulsão' : f.excecao!.tipo === 'fusao' ? 'fusão do partido' : 'perseguição interna'}) até ${anoDe(f.excecao!.t + JANELA_JUSTA_CAUSA)}: a troca não custa o mandato.` : undefined,
      trocas: trocasSemCausa(v, f)
    };
  } else if (!p.partido && excecaoAberta(v, f)) out.filiacao = { relacao: 0, palavra: 'sem partido', regra: 'Sem partido.', excecao: `Justa causa aberta até ${anoDe(f!.excecao!.t + JANELA_JUSTA_CAUSA)}: filiar-se a outro partido não custa o mandato.`, trocas: trocasSemCausa(v, f) };
  const b = p.v14?.belem;
  if (b && (emBelem(v) || b.registro.length)) {
    const d = b.diploma ? DIPLOMAS_PT.find(x => x.id === b.diploma!.id) : undefined;
    out.belem = {
      governo: b.governo ? `${b.governo.pm} · ${partidoDe(b.governo.partido)?.chamado ?? b.governo.partido} · maioria ${b.governo.maioria}` : undefined,
      estabilidade: b.governo?.estabilidade, relacao: b.relacao, influencia: b.influencia, diploma: d?.nome,
      crise: b.crise ? ({ pt_censura: 'moção de censura', pt_orcamento: 'Orçamento chumbado', pt_demissao: 'demissão do Primeiro-Ministro' } as Record<string, string>)[b.crise.tipo] : undefined,
      formar: b.formar !== undefined, numeros: `${b.promulgados} promulgados · ${b.vetos} vetos · ${b.tc} ao Tribunal Constitucional (${b.inconstitucionais} inconstitucionais) · ${b.dissolucoes} dissoluções`,
      registro: b.registro.slice(-4)
    };
  }
  return out.gestao || out.legados.length || out.filiacao || out.belem ? out : undefined;
}

/* ================================================================ Ganchos */

const MEDIDA = /^m14:/;
const REVOGAR = /^r14:/;
const ehBelem = (x?: string) => !!x && x.startsWith('pt_');

{
  const antes = { ano: PRESIDENCIA.ano, posse: PRESIDENCIA.posse, fim: PRESIDENCIA.fim, acoes: PRESIDENCIA.acoes, disp: PRESIDENCIA.disp, exec: PRESIDENCIA.exec };
  PRESIDENCIA.ano = v => {
    antes.ano?.(v);
    const p = v.caminhos.politica;
    if (!p) return;
    // O mandato com gestão que acabou (concluído, renunciado, cassado): o legado.
    if (p.v14?.gestao && !comGestao(v)) fecharGestao(v, p);
    if (comGestao(v)) anoDaGestao(v);
    anoDaFiliacao(v);
    anoBelem(v);
  };
  PRESIDENCIA.posse = (v, re) => (semipresidencial(v) ? posseBelem(v, re) : antes.posse?.(v, re));
  PRESIDENCIA.fim = (v, como) => (semipresidencial(v) ? fimBelem(v, como) : antes.fim?.(v, como));
  PRESIDENCIA.acoes = v => [...(antes.acoes?.(v) ?? []), ...acoesBelem(v)];
  PRESIDENCIA.disp = (v, x) => (x && MEDIDA.test(x) ? dispMedida(v, x.slice(4)) : x && REVOGAR.test(x) ? dispRevogar(v, x.slice(4)) : ehBelem(x) ? dispBelem(v, x as AcaoBelem) : antes.disp?.(v, x) ?? bloqueio('impossivel', 'Não se aplica.'));
  PRESIDENCIA.exec = (v, r, x) => (x && MEDIDA.test(x) ? executarMedida(v, r, x.slice(4)) : x && REVOGAR.test(x) ? executarRevogar(v, x.slice(4)) : ehBelem(x) ? execBelem(v, r, x as AcaoBelem) : antes.exec?.(v, r, x) ?? {});
  PRESIDENCIA.troca = vetoDaTroca;
  PRESIDENCIA.trocou = naTroca;
}

/** A ação de uma medida (para a tela). */
export const acaoMedida14 = (id: string, revogar = false) => ({ tipo: 'politica', oque: 'governo129', valor: `${revogar ? 'r14' : 'm14'}:${id}` } as unknown as Acao);

/** Saves: nada a migrar (tudo opcional); só limpa uma justa causa vencida. */
export function normalizarVida14Politica(v: Vida): void {
  const f = v.caminhos.politica?.v14?.partido;
  if (f?.excecao && v.t - f.excecao.t > JANELA_JUSTA_CAUSA) f.excecao = undefined;
}

