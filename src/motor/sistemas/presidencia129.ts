/**
 * VIDA 12.9 · A PRESIDÊNCIA — o degrau de cima da vida política, com identidade própria (não é o mandato de prefeito
 * com outro texto). Reaproveita o que a política já tem (`politica`: a candidatura, a apuração, a posse, o mandato, o
 * histórico; `desgastePolitico`; `aliancas`) e acrescenta, num pacote acima dela (registra os ganchos em
 * `politica.PRESIDENCIA` ao carregar):
 *
 *   QUEM PODE — as regras do país (`dados/presidencia129`): idade, nacionalidade nata, partido (ou candidatura
 *     independente onde existe), o limite de mandatos (Brasil: uma reeleição seguida; EUA: dois na vida; México e
 *     Colômbia: um só; Chile, Uruguai, Peru: sem reeleição imediata; Costa Rica: oito anos de intervalo), o calendário
 *     (EUA: de quatro em quatro anos, nunca no meio do mandato). Sem eleição direta (os parlamentaristas), não há.
 *   A CORRIDA — adversários com nome, partido e de onde vêm; a indicação (a convenção ou as primárias), a chapa, o eixo,
 *     a estratégia, o debate e a reta final (`acontecimentos129Presidencia`), as pesquisas a cada etapa. A urna conta os
 *     votos de cada um (com a incerteza do dia); onde há segundo turno e ninguém passa do limiar, os dois primeiros se
 *     enfrentam de novo, com uma decisão na última semana.
 *   O GOVERNO — a economia do país como estado do mandato (inflação, PIB, desemprego, puxados pela fase da economia do
 *     mundo e pelas escolhas), a base no Congresso, as relações com o mundo, a tensão com os outros Poderes; os eixos de
 *     governo, a política econômica do ano, as reformas (com tramitação casa por casa e quórum), a articulação da base,
 *     a agenda internacional; as crises do país; os acontecimentos históricos; os escândalos; o impeachment.
 *   O FIM — o legado (os números de quando entrou e de quando saiu, as reformas, as conquistas), a reeleição pelas
 *     regras do país, e o que fazer depois (o partido, as memórias, a fundação, ou a vida fora da política).
 *
 * O GOVERNADOR também ganha o que é do estado: as crises estaduais (a polícia, a rodovia, o hospital regional, o
 * repasse, a chuva no interior, o presídio) e três ações do Executivo estadual. O prefeito segue com a cidade.
 *
 * Os sorteios novos são DERIVADOS (`rngDe`): as vidas que não chegam aqui seguem iguais.
 */

import { apurarColegio, ladoDoCandidato, MAIORIA_NO_COLEGIO, TOTAL_DE_DELEGADOS } from './colegioEleitoral129';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Vida, VidaPolitica } from '../tipos';
import { escrever, idade, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO, podeTentar, type Veredito } from '../plausibilidade';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';
import { paisDaVida, paisNatal, nacionalidadesDaVida } from '../mundo/vida';
import { perfilDoPais, temPerfil } from '../mundo/registro';
import { municipio } from '../dados/lugares';
import { sortearNome, sortearSobrenome } from '../dados/nomes';
import { oPartido, partidoDe } from '../dados/partidos';
import {
  EIXOS_129, PERFIS_ADVERSARIO, PIB_DA_FASE, POLITICAS_129, REFORMAS_129, REGRAS_PRESIDENCIAIS, semPresidenciaTexto,
  type Adversario129, type CampanhaPresidencial129, type CandidaturaPresidencial129, type Eixo129, type Governo129, type MandatoPresidencial129, type Presidencia129,
  type RegraPresidencial, type Reforma129
} from '../dados/presidencia129';
import { aliviar, desgastar } from './desgastePolitico';
import { marcar, temMarca } from './marcas';
import { abalar } from './abalo';
import { habilidade } from './frentes';
import { encerrarEmprego } from './trabalho';
import {
  PRESIDENCIA, aliado, basePartidaria, calendarioDoMandato, cargoNoCiclo, eleicaoNaJanela, fatoresDaEleicao, naPolitica, nomeCargo,
  nomePublico, partidosDoPais, podeConcorrer, registrarNoMandato, resumoDoMandato, tDaEleicao, tDaEleicaoDe, tDaPosse, tDaPosseDe, voltarAoTrabalho,
  type FatorEleitoral, type SaidaPolitica
} from './politica';
import type { AcaoProfissional } from './profissao';
import type { Acao } from '../acoes';

/* ================================================================ Leituras básicas */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const r1 = (x: number) => Math.round(x * 10) / 10;
const pct = (x: number) => `${r1(x).toString().replace('.', ',')}%`;

/** As regras da Presidência do país onde a vida mora (ausente: não há eleição direta). */
export const regraDaPresidencia = (v: Vida): RegraPresidencial | undefined => REGRAS_PRESIDENCIAIS[paisDaVida(v)];

/** O estado presidencial (criado na primeira vez). */
export function presidencia(v: Vida): Presidencia129 {
  const p = v.caminhos.politica!;
  p.presidencia ??= { candidaturas: [], mandatos: [] };
  return p.presidencia;
}

export const emMandatoPresidencial = (v: Vida) => v.caminhos.politica?.fase === 'mandato' && v.caminhos.politica.mandato?.cargo === 'presidente';

/**
 * Nacional nato do país: nasceu nele, ou a nacionalidade de nascença é dele e não veio por naturalização (a marca
 * "Naturalizou-se ..." de `migracao`). A dupla nacionalidade de berço conta só a primeira (a de nascença, no jogo).
 */
export function natoDoPais(v: Vida, pais: string): boolean {
  if (paisNatal(v) === pais) return true;
  if (nacionalidadesDaVida(v)[0] !== pais) return false;
  const gent = temPerfil(pais) ? perfilDoPais(pais).gentilico : [];
  return !temMarca(v, 'mudanca_cidade', m => m.texto.startsWith('Naturalizou-se') && gent.some(g => m.texto.includes(g)));
}

/** Quantas vezes já foi eleito presidente (o mandato de agora incluído). */
const eleicoesVencidas = (p: VidaPolitica) => p.historico.filter(h => h.cargo === 'presidente' && h.resultado === 'eleito').length;
/** Quando acabou (ou acaba) o último mandato presidencial. */
function fimDoUltimoMandato(p: VidaPolitica): number | undefined {
  if (p.mandato?.cargo === 'presidente') return p.mandato.tFim;
  const fins = p.historico.filter(h => h.cargo === 'presidente' && h.resultado !== 'eleito' && h.resultado !== 'derrotado').map(h => h.t);
  return fins.length ? Math.max(...fins) : undefined;
}

/** O nome que o eleitor do país inteiro reconhece (a presença política ou o nome público). */
const nomeNacional = (v: Vida) => Math.max(v.caminhos.politica?.reputacao ?? 0, nomePublico(v));

/* ============================================================ Elegibilidade (ganchos) */

/** O que a lei do país barra (antes do partido): a nacionalidade nata, o limite de mandatos; e a candidatura sem partido. */
function elegivel(v: Vida, tEleicao: number): Veredito | undefined {
  const pais = paisDaVida(v);
  const r = REGRAS_PRESIDENCIAIS[pais];
  if (!r) return bloqueio('impossivel', semPresidenciaTexto(pais));
  const nome = nomeCargo(v, 'presidente');
  if (r.nato && !natoDoPais(v, pais)) return bloqueio('ilegal', `Para ${nome}, só quem é ${temPerfil(pais) ? perfilDoPais(pais).gentilico[ge(v) === 'feminino' ? 1 : 0] : 'do país'} de nascença.`);
  const p = v.caminhos.politica;
  if (p) {
    if (r.limite.total && eleicoesVencidas(p) >= r.limite.total) return bloqueio('ilegal', r.limite.texto);
    if (r.limite.seguidos && p.mandato?.cargo === 'presidente' && p.consecutivos >= r.limite.seguidos) return bloqueio('ilegal', r.limite.texto);
    const fim = fimDoUltimoMandato(p);
    if (r.limite.intervalo && fim !== undefined && (tDaPosse(anoDe(tEleicao)) - fim) / 12 < r.limite.intervalo) return bloqueio('ilegal', r.limite.texto);
  }
  // Sem partido: só onde a lei aceita candidatura independente (com assinaturas) — e só com nome no país inteiro.
  if (p && !p.partido) {
    if (!r.independente) return undefined;
    if (nomeNacional(v) < 40) return bloqueio('requisito', 'Uma candidatura independente precisa de centenas de milhares de assinaturas: sem nome no país inteiro, não se chega lá.');
    return { grau: 'improvavel', chance: 0.4, motivo: 'Sem partido: as assinaturas, o dinheiro e o tempo de TV, tudo por conta própria.' };
  }
  return undefined;
}

/** O que o partido pesa ao escolher o nome (depois das regras): a reeleição é natural; o resto passa pela convenção. */
function forca(v: Vida, _t: number): Veredito {
  const p = v.caminhos.politica!;
  if (p.mandato?.cargo === 'presidente') return PERMITIDO;
  const nome = nomeNacional(v);
  if (nome < 30) return bloqueio('requisito', 'Sem nome no país inteiro, nenhum partido lança à Presidência: antes, um cargo do estado ou do Congresso.');
  if (nome < 50 || basePartidaria(v) < 25) return { grau: 'improvavel', chance: 0.25, motivo: `${cap(regraDaPresidencia(v)?.escolha === 'primarias' ? 'as primárias escolhem' : 'a convenção escolhe')} o nome: sem nome nacional ou lugar no partido, raramente é o seu.` };
  return PERMITIDO;
}

/* ================================================================ A corrida */

const TEMP = 10;
/** A incerteza do dia da eleição (na escala da força): o voto que muda na última semana, a abstenção, o erro das pesquisas. */
const RUIDO_DA_URNA = 6;
const RUIDO_DO_SEGUNDO = 7;

/** Quanto pesa a trajetória (o maior cargo que já exerceu). */
function trajetoria(p: VidaPolitica): number {
  const pesos: Record<string, number> = { governador: 8, senador: 6, presidente: 6, deputado_federal: 3, prefeito: 3, deputado_estadual: 1, vereador: 0 };
  const cargos = [...p.historico.filter(h => h.resultado === 'eleito').map(h => h.cargo), ...(p.mandato ? [p.mandato.cargo] : [])];
  return cargos.reduce((m, c) => Math.max(m, pesos[c] ?? 0), 0);
}

/** A economia do país pesa em quem governa (a reeleição): crescimento ajuda; inflação e desemprego, não. */
function pesoDaEconomia(v: Vida): number {
  const g = governoAtual(v);
  const r = regraDaPresidencia(v);
  if (!g || !r) return 0;
  return clamp((g.pib - 1.5) * 1.5 - Math.max(0, g.inflacao - 5) * 0.8 - Math.max(0, g.desemprego - r.desemprego) * 1, -10, 8);
}

/** A força da sua candidatura (a mesma escala dos adversários): os fatores da eleição, a trajetória, a economia. */
export function forcaPresidencial(v: Vida, t?: number): number {
  const p = v.caminhos.politica!;
  const tEl = t ?? p.campanha?.tEleicao ?? v.t;
  const f = fatoresDaEleicao(v, 'presidente', tEl).fatores.filter(k => k.id !== 'disputa').reduce((s, k) => s + k.valor, 0);
  return f + trajetoria(p) + pesoDaEconomia(v);
}

/** Os votos válidos (%) de cada força. */
function votos(forcas: number[]): number[] {
  const m = Math.max(...forcas);
  const e = forcas.map(f => Math.exp((f - m) / TEMP));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map(x => (x / s) * 100);
}

function gerarAdversarios(v: Vida, ano: number, r: RegraPresidencial): Adversario129[] {
  const rng = rngDe(v.id, 'pres_adversarios', ano);
  const pais = paisDaVida(v);
  const meu = v.caminhos.politica?.partido;
  const partidos = partidosDoPais(pais).filter(s => s !== meu);
  const usados = new Set<string>();
  const umPartido = () => { for (let k = 0; k < 20; k++) { const s = rng.pick(partidos); if (!usados.has(s)) { usados.add(s); return s; } } return undefined; };
  // Dois grandes onde não há segundo turno (EUA, México: um forte e um pequeno); quatro onde há.
  const fortes = PERFIS_ADVERSARIO.filter(x => x.forca >= 60);
  const outros = PERFIS_ADVERSARIO.filter(x => x.forca < 60);
  const perfis = r.segundoTurno ? [rng.pick(fortes), rng.pick(fortes.filter(x => x.id !== 'governador')), rng.pick(outros), rng.pick(outros)] : [rng.pick(fortes), rng.pick(outros.filter(x => x.forca < 50))];
  // VIDA 12.9.1 (EUA, Colégio Eleitoral): a disputa é de dois grandes lados — o adversário forte é do lado oposto ao seu
  // (quem é de centro ou independente enfrenta um grande de cada lado); o pequeno é uma terceira via.
  const ladoMeu = ladoDoCandidato(meu);
  const partidosDoColegio = r.colegio ? (ladoMeu > 0 ? ['~direita', '~centro_direita'] : ladoMeu < 0 ? ['~centro_esquerda', '~esquerda'] : ['~centro_esquerda', '~centro_direita']) : [];
  if (r.colegio && ladoMeu === 0) perfis[1] = rng.pick(fortes.filter(x => x.id !== perfis[0].id));
  return perfis.map((perfil, k) => {
    const fem = rng.chance(0.35);
    const anoNasc = ano - rng.int(40, 72);
    const nome = `${sortearNome(rng, fem ? 'feminino' : 'masculino', anoNasc, pais)} ${sortearSobrenome(rng, pais)}`;
    const partido = r.colegio ? (k === 0 ? partidosDoColegio[0] : ladoMeu === 0 ? partidosDoColegio[1] : rng.pick(['~centro', '~verde', '~regional'].filter(x => x !== meu))) : umPartido();
    return { nome, feminino: fem, partido, perfil: perfil.texto(fem), forca: r1(perfil.forca + rng.normal() * 5 - (k >= 2 ? 3 : 0)) };
  });
}

/** A pesquisa de agora (sem a incerteza da urna): você e cada adversário. */
export function pesquisa(v: Vida): { nome: string; partido?: string; pct: number; voce?: boolean; perfil?: string }[] {
  const c = presidencia(v).campanha;
  if (!c) return [];
  const x = votos([forcaPresidencial(v), ...c.adversarios.map(a => a.forca)]);
  const meu = v.caminhos.politica?.partido;
  return [{ nome: 'você', partido: meu, pct: r1(x[0]), voce: true }, ...c.adversarios.map((a, k) => ({ nome: a.nome, partido: a.partido, pct: r1(x[k + 1]), perfil: a.perfil }))].sort((a, b) => b.pct - a.pct);
}
/** A pesquisa em palavras (para as cenas da campanha). */
export function pesquisaEmTexto(v: Vida, quantos = 4): string {
  return pesquisa(v).slice(0, quantos).map(x => `${x.voce ? 'você' : x.nome}${x.partido && !x.voce ? ` (${partidoDe(x.partido)?.chamado ?? x.partido})` : ''} ${pct(x.pct)}`).join(' · ');
}
export const anotarPesquisa = (v: Vida) => { const c = presidencia(v).campanha; if (c) c.pesquisas.push(pesquisa(v).find(x => x.voce)?.pct ?? 0); };

/** A candidatura registrada (`politica.registrarCandidatura`): a corrida começa, com os adversários de verdade. */
function registrar(v: Vida): void {
  const p = v.caminhos.politica!;
  const r = regraDaPresidencia(v);
  if (!r || !p.campanha) return;
  const ano = anoDe(p.campanha.tEleicao);
  const via: CampanhaPresidencial129['via'] = p.mandato?.cargo === 'presidente' ? 'reeleicao' : !p.partido ? 'independente' : r.escolha;
  const rng = rngDe(v.id, 'pres_rival', ano);
  const fem = rng.chance(0.35);
  const rival = via === 'convencao' || via === 'primarias' ? `${sortearNome(rng, fem ? 'feminino' : 'masculino', ano - rng.int(40, 70), paisDaVida(v))} ${sortearSobrenome(rng, paisDaVida(v))}` : undefined;
  presidencia(v).campanha = { ano, etapa: via === 'convencao' || via === 'primarias' ? 0 : 1, via, adversarios: gerarAdversarios(v, ano, r), rival, pesquisas: [] };
  anotarPesquisa(v);
}

/** Candidatura independente (sem partido, onde a lei deixa): o registro com as assinaturas. */
export function registrarIndependente(v: Vida, tEleicao: number): void {
  const p = v.caminhos.politica!;
  p.campanha = { cargo: 'presidente', tEleicao, gasto: 0, nota: 0, etapa: 1 };
  if (p.fase !== 'mandato') p.fase = 'candidato';
  escrever(v, { texto: `Registrou candidatura independente a ${nomeCargo(v, 'presidente')}, sem partido, para a eleição de ${anoDe(tEleicao)}.`, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'candidatura', `${cap(flex(ge(v), 'candidato', 'candidata', 'candidate'))} a ${nomeCargo(v, 'presidente')}, sem partido, aos ${idade(v)}.`, 3);
  registrar(v);
}

/** A indicação não veio (a convenção, as primárias) ou a candidatura foi retirada: a corrida acaba antes da urna. */
export function encerrarCorrida(v: Vida, resultado: 'preterido' | 'desistiu', texto: string): void {
  const p = v.caminhos.politica!;
  const e = presidencia(v);
  const c = e.campanha;
  if (c) e.candidaturas.push({ ano: c.ano, partido: p.partido, via: c.via, resultado, adversarios: c.adversarios.map(a => a.nome) });
  e.campanha = undefined;
  p.campanha = undefined;
  if (p.fase === 'candidato') p.fase = p.historico.length ? 'entre_mandatos' : p.partido ? 'filiado' : 'envolvido';
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: resultado === 'preterido' ? 'ruim' : undefined });
  if (resultado === 'preterido') marcar(v, 'derrota', texto, 2);
}

/** A chance de vencer (estimada com a incerteza da urna; o segundo turno, sem a decisão da última semana). */
export function chancePresidencial(v: Vida, n = 300): number {
  const e = presidencia(v);
  const c = e.campanha;
  const r = regraDaPresidencia(v);
  if (!c || !r) return 0;
  const rng = rngDe(v.id, 'pres_chance', c.ano, c.etapa);
  const P = forcaPresidencial(v);
  let ganhou = 0;
  const lados = r.colegio ? ladosDaDisputa(v, c) : [];
  for (let k = 0; k < n; k++) {
    const fs = [P, ...c.adversarios.map(a => a.forca)].map(f => f + rng.normal() * RUIDO_DA_URNA);
    const x = votos(fs);
    if (r.colegio) { if (apurarColegio(x.map((y, i) => ({ nacional: y, lado: lados[i] })), rng).eleito === 0) ganhou++; continue; }
    const ordem = x.map((_y, i) => i).sort((a, b) => x[b] - x[a]);
    if (!r.segundoTurno || venceNoPrimeiro(r, x, ordem)) { if (ordem[0] === 0) ganhou++; continue; }
    if (ordem[0] !== 0 && ordem[1] !== 0) continue;
    const adv = ordem[0] === 0 ? ordem[1] : ordem[0];
    if (P - (c.adversarios[adv - 1].forca) + rng.normal() * RUIDO_DO_SEGUNDO > 0) ganhou++;
  }
  return ganhou / n;
}

/** Ninguém precisa de segundo turno? (Argentina: 45%, ou 40% com dez pontos de vantagem; Costa Rica: 40%.) */
function venceNoPrimeiro(r: RegraPresidencial, x: number[], ordem: number[]): boolean {
  const a = x[ordem[0]], b = x[ordem[1]];
  if (a > r.limiar) return true;
  return r.limiar === 45 && a >= 40 && a - b >= 10;
}

/** VIDA 12.9.1: o lado no espectro de cada um na disputa (você primeiro; o independente é de centro). */
function ladosDaDisputa(v: Vida, c: CampanhaPresidencial129): number[] {
  return [ladoDoCandidato(v.caminhos.politica?.partido), ...c.adversarios.map(a => ladoDoCandidato(a.partido))];
}

/**
 * VIDA 12.9.1 — a apuração americana: o voto popular é o da urna (`x`), mas quem decide é o Colégio Eleitoral — os
 * estados, um a um (vencedor leva tudo; Maine e Nebraska por distrito), 270 de 538; sem maioria, a Câmara.
 */
function apurarNoColegio(v: Vida, c: CampanhaPresidencial129, x: number[], placar: string, nome: string,
  fim: (ganhou: boolean, segundo?: { voce: number; adversario: string }, colegio?: CandidaturaPresidencial129['colegio']) => { ganhou: boolean; chance: number }) {
  const res = apurarColegio(x.map((y, i) => ({ nacional: y, lado: ladosDaDisputa(v, c)[i] })), rngDe(v.id, 'pres_colegio', c.ano));
  const nomes = ['você', ...c.adversarios.map(a => a.nome)];
  const ganhou = res.eleito === 0;
  const popularVenceu = res.popular.indexOf(Math.max(...res.popular));
  const ordem = res.delegados.map((_d, i) => i).filter(i => res.delegados[i] > 0 || i === 0).sort((a, b) => res.delegados[b] - res.delegados[a]);
  const colegioTxt = ordem.map(i => `${nomes[i]} ${res.delegados[i]}`).join(' · ');
  let texto = `A apuração para ${nome}. Voto popular: ${placar}. Colégio Eleitoral: ${colegioTxt} (${MAIORIA_NO_COLEGIO} de ${TOTAL_DE_DELEGADOS} para vencer).`;
  if (res.contingencia) {
    const d = res.contingencia;
    texto += ` Ninguém chegou a ${MAIORIA_NO_COLEGIO}: a Câmara dos Representantes decidiu, uma delegação por estado — ${d.finalistas.map(i => `${nomes[i]} ${d.delegacoes[i]}`).join(' · ')} (26 de 50 para vencer${d.repetida ? '; nenhuma maioria na primeira votação, e as votações se repetiram' : ''}).`;
  }
  texto += ganhou
    ? (popularVenceu !== 0 ? ` Você venceu no Colégio Eleitoral mesmo com menos votos no país que ${nomes[popularVenceu]}.` : ` Você venceu no voto popular e no Colégio Eleitoral${res.contingencia ? ' — pela Câmara' : ''}.`)
    : (popularVenceu === 0 ? ` Você teve mais votos no país, mas ${nomes[res.eleito]} venceu no Colégio Eleitoral${res.contingencia ? ' (pela Câmara)' : ''}.` : ` ${nomes[res.eleito]} venceu${res.contingencia ? ', escolhid' + (c.adversarios[res.eleito - 1]?.feminino ? 'a' : 'o') + ' pela Câmara' : ''}.`);
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: ganhou ? 'bom' : 'ruim' });
  if (popularVenceu !== res.eleito) marcar(v, ganhou ? 'eleicao' : 'derrota', ganhou ? `Eleit${ge(v) === 'feminino' ? 'a' : 'o'} pelo Colégio Eleitoral, com menos votos no país.` : 'Mais votos no país — e a derrota no Colégio Eleitoral.', 2);
  return fim(ganhou, undefined, {
    delegados: res.delegados, nomes, estados: res.estadosGanhos[0], popular: res.popular.map(r1), eleito: nomes[res.eleito],
    ...(res.contingencia ? { camara: { delegacoes: res.contingencia.finalistas.map(i => res.contingencia!.delegacoes[i]), finalistas: res.contingencia.finalistas.map(i => nomes[i]) } } : {})
  });
}

/** O que a última semana do segundo turno somou (`prest_segundo_turno`). */
const BONUS_DO_SEGUNDO: Record<string, number> = { apoio: 4, apoio_falhou: -1, centro: 2.5, rejeicao: 3, rejeicao_falhou: -3, debate: 5, debate_falhou: -4 };

/** A apuração presidencial (gancho de `politica.apurar`): o primeiro turno, e o segundo quando houver. */
function apurar(v: Vida, conta: { fatores: FatorEleitoral[]; chance: number }): { ganhou: boolean; chance: number } | 'adiar' {
  const p = v.caminhos.politica!;
  const e = presidencia(v);
  const r = regraDaPresidencia(v);
  if (!r) return { ganhou: false, chance: 0 };
  if (!e.campanha) registrar(v);
  const c = e.campanha!;
  const chance = c.primeiro ? c.chance ?? conta.chance : chancePresidencial(v);
  c.chance = chance;
  const nome = nomeCargo(v, 'presidente');
  const meu = p.partido;
  const fim = (ganhou: boolean, segundo?: { voce: number; adversario: string }, colegio?: CandidaturaPresidencial129['colegio']) => {
    e.candidaturas.push({ ano: c.ano, partido: meu, via: c.via, resultado: ganhou ? 'eleito' : 'derrotado', primeiro: c.primeiro, segundo, adversarios: c.adversarios.map(a => a.nome), debate: c.debateFoi, eixo: c.eixo, chapa: c.chapa, reeleicao: c.via === 'reeleicao' || undefined, ...(colegio ? { colegio } : {}) });
    e.campanha = undefined;
    delete v.fatos['pres_2turno'];
    return { ganhou, chance };
  };
  if (!c.primeiro) {
    const rng = rngDe(v.id, 'pres_urna', c.ano, 1);
    const P = forcaPresidencial(v);
    const x = votos([P, ...c.adversarios.map(a => a.forca)].map(f => f + rng.normal() * RUIDO_DA_URNA));
    const ordem = x.map((_y, i) => i).sort((a, b) => x[b] - x[a]);
    c.primeiro = ordem.slice(0, 4).concat(ordem.slice(0, 4).includes(0) ? [] : [0]).map(i => (i === 0 ? { nome: 'você', partido: meu, pct: r1(x[0]), voce: true } : { nome: c.adversarios[i - 1].nome, partido: c.adversarios[i - 1].partido, pct: r1(x[i]) }));
    const placar = c.primeiro.map(y => `${y.voce ? 'você' : y.nome} ${pct(y.pct)}`).join(' · ');
    if (r.colegio) return apurarNoColegio(v, c, x, placar, nome, fim);
    if (!r.segundoTurno || venceNoPrimeiro(r, x, ordem)) {
      const ganhou = ordem[0] === 0;
      escrever(v, { texto: `A apuração para ${nome}: ${placar}.${ganhou ? (r.segundoTurno ? ' Venceu já no primeiro turno.' : '') : ` ${c.adversarios[ordem[0] - 1].nome} venceu.`}`, relevancia: 'biografia', tema: 'trabalho' });
      return fim(ganhou);
    }
    if (ordem[0] !== 0 && ordem[1] !== 0) {
      escrever(v, { texto: `O primeiro turno para ${nome}: ${placar}. Você ficou fora do segundo turno, que ${c.adversarios[ordem[0] - 1].nome} e ${c.adversarios[ordem[1] - 1].nome} disputam.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      return fim(false);
    }
    const adv = ordem[0] === 0 ? ordem[1] : ordem[0];
    c.segundo = { adv: adv - 1, t: v.t };
    v.fatos['pres_2turno'] = v.t;
    escrever(v, { texto: `O primeiro turno para ${nome}: ${placar}. Você e ${c.adversarios[adv - 1].nome} vão ao segundo turno.`, relevancia: 'marco', tema: 'trabalho' });
    return 'adiar';
  }
  // O segundo turno: os dois, frente a frente — a última semana (a decisão) e a incerteza do dia.
  const s = c.segundo!;
  const adv = c.adversarios[s.adv];
  const rng = rngDe(v.id, 'pres_urna', c.ano, 2);
  const d = forcaPresidencial(v) + (BONUS_DO_SEGUNDO[s.escolha ?? ''] ?? 0) - adv.forca + rng.normal() * RUIDO_DO_SEGUNDO;
  const meus = r1(clamp(50 + d * 1.1, 26, 74));
  const ganhou = meus > 50;
  escrever(v, { texto: `O segundo turno: você ${pct(meus)}, ${adv.nome} ${pct(100 - meus)}.`, relevancia: 'biografia', tema: 'trabalho', tom: ganhou ? 'bom' : 'ruim' });
  return fim(ganhou, { voce: meus, adversario: adv.nome });
}

/* ================================================================ A posse e o governo */

export const governoAtual = (v: Vida): Governo129 | undefined => (emMandatoPresidencial(v) ? v.caminhos.politica?.presidencia?.governo : undefined);

function posse(v: Vida, reeleicao: boolean): void {
  const p = v.caminhos.politica!;
  const e = presidencia(v);
  const r = regraDaPresidencia(v);
  if (!r) return;
  const ultima = [...e.candidaturas].reverse().find(x => x.resultado === 'eleito');
  if (reeleicao && e.governo) {
    // O primeiro mandato fica no legado; o governo continua (os números são os mesmos de ontem).
    arquivar(v, 'concluiu', false);
    e.governo.tInicio = v.t;
    escrever(v, { texto: `Segundo mandato em ${r.palacio}. A base no Congresso recomeça em ${Math.round(e.governo.base)}% das cadeiras.`, relevancia: 'biografia', tema: 'trabalho' });
    return;
  }
  const fase = v.economia?.fase ?? 'normal';
  const rng = rngDe(v.id, 'pres_posse', v.t);
  const porte = [12, 6, 0][v.fatos['pol_partido_porte'] ?? 1] ?? 6;
  // A chapa da campanha pesa na base: a coligação traz cadeiras; o nome técnico acalma o mercado.
  const chapa = ultima?.chapa;
  const base = clamp(28 + porte + (chapa === 'coligacao' ? 14 : chapa === 'tecnica' ? 4 : 0) + (p.apoio - 50) * 0.15 + rng.normal() * 4, 12, 70);
  const inflacao = r1((v.economia?.inflacao ?? 0.045) * 100 - (chapa === 'tecnica' ? 0.3 : 0));
  const pib = PIB_DA_FASE[fase] ?? 2;
  const desemprego = r1(r.desemprego + (fase === 'crise' ? 2.5 : fase === 'desaceleracao' ? 1 : fase === 'expansao' ? -1 : 0));
  e.governo = {
    tInicio: v.t, inflacao, pib, desemprego, base: Math.round(base), mundo: 50, conflito: 10, eixos: ultima?.eixo ? [ultima.eixo] : [],
    ajuste: { pib: 0, inflacao: 0, desemprego: 0 }, reformas: [], conquistas: [], escandalos: 0,
    inicio: { inflacao, pib, desemprego }, anos: []
  };
  const brasil = paisDaVida(v) === 'BR';
  escrever(v, {
    texto: `${brasil ? 'Subiu a rampa do Palácio do Planalto e recebeu a faixa presidencial.' : `Tomou posse em ${r.palacio}.`} No primeiro dia: inflação de ${pct(inflacao)}, desemprego de ${pct(desemprego)}, e uma base de cerca de ${Math.round(base)}% das cadeiras em ${r.congresso}.`,
    relevancia: 'biografia', tema: 'trabalho', tom: 'bom'
  });
  abalar(v, 'a posse na Presidência', 8, 6);
}

/** O mandato presidencial acaba (concluído, renunciado, cassado): o legado. */
function arquivar(v: Vida, como: MandatoPresidencial129['como'], fecharGoverno = true): MandatoPresidencial129 | undefined {
  const p = v.caminhos.politica!;
  const e = presidencia(v);
  const g = e.governo;
  if (!g) return undefined;
  const aprovacao = Math.round(p.mandato?.aprovacao ?? 50);
  const reformas = g.reformas.filter(x => x.aprovada && x.t >= g.tInicio).map(x => REFORMAS_129[x.id].nome);
  const conquistas = [...g.conquistas];
  const melhorou = (g.desemprego < g.inicio.desemprego - 0.8 ? 1 : g.desemprego > g.inicio.desemprego + 0.8 ? -1 : 0) + (g.inflacao < Math.max(4, g.inicio.inflacao - 1) ? 1 : g.inflacao > g.inicio.inflacao + 2 ? -1 : 0);
  const legado = como === 'afastado' || como === 'cassado' ? 'um governo interrompido pelo afastamento'
    : aprovacao >= 60 && melhorou >= 1 ? `um governo lembrado com saudade${reformas.length ? `, o de ${reformas[0]}` : ''}`
      : aprovacao >= 50 ? `um governo bem avaliado${reformas.length ? `, que aprovou ${reformas.join(' e ')}` : ''}`
        : aprovacao >= 35 ? `um governo dividido${melhorou < 0 ? ', com a economia pior do que encontrou' : ''}`
          : `um governo que saiu pela porta dos fundos${melhorou < 0 ? ', com a economia em frangalhos' : ''}`;
  const m: MandatoPresidencial129 = { de: anoDe(g.tInicio), ate: anoDe(v.t), como, aprovacao, inflacao: g.inflacao, pib: g.pib, desemprego: g.desemprego, reformas, conquistas: conquistas.slice(-6), legado };
  e.mandatos.push(m);
  if (fecharGoverno) e.governo = undefined;
  else g.conquistas = [];
  return m;
}

function fim(v: Vida, como: 'concluiu' | 'renunciou'): void {
  const m = arquivar(v, como);
  if (!m) return;
  const r = regraDaPresidencia(v);
  const texto = `Deixou ${r?.palacio ?? 'a Presidência'} com ${m.aprovacao}% de aprovação: ${m.legado}. Inflação de ${pct(m.inflacao)}, desemprego de ${pct(m.desemprego)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: m.aprovacao >= 50 ? 'bom' : m.aprovacao < 35 ? 'ruim' : undefined });
  marcar(v, 'politica', `Ex-${nomeCargo(v, 'presidente')}: ${m.legado}.`, 3);
  if (como === 'concluiu') v.fatos['pres_depois'] = v.t;
}

/** Afastado pelo impeachment (ou pela vacância): o mandato acaba, e a inabilitação onde a lei a prevê. */
export function afastarDoCargo(v: Vida, texto: string): void {
  const p = v.caminhos.politica!;
  const m = p.mandato;
  if (!m || m.cargo !== 'presidente') return;
  const r = regraDaPresidencia(v);
  arquivar(v, 'afastado');
  p.historico.push({ t: v.t, cargo: 'presidente', resultado: 'cassado', partido: p.partido, ...resumoDoMandato(p) });
  p.mandato = undefined;
  p.consecutivos = 0;
  p.fase = 'entre_mandatos';
  if (r?.impeachment.inabilita) p.inelegivelAte = Math.max(p.inelegivelAte ?? 0, v.t + r.impeachment.inabilita * 12);
  desgastar(p, 25, 'escandalo');
  p.apoio = clamp(p.apoio - 15);
  if (v.trabalho.atual?.contrato === 'eletivo') encerrarEmprego(v, 'afastamento do cargo');
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'derrota', texto, 3);
  abalar(v, 'o afastamento da Presidência', -16, 16);
  const par = parceiro(v);
  if (par) par.vin.tensao = clamp(par.vin.tensao + 8);
  voltarAoTrabalho(v, 'depois do afastamento');
}

/* ================================================================ O ano do governo */

/** Os acontecimentos que entram na história do país (sem escolha: o mundo acontece). */
const HISTORICOS: { id: string; texto: (v: Vida) => string; efeito: (g: Governo129, v: Vida) => void; quando?: (g: Governo129) => boolean }[] = [
  { id: 'cupula', texto: () => 'O país sediou uma cúpula de chefes de Estado. Por três dias, o mundo olhou para cá — e a foto oficial correu os jornais.', efeito: g => { g.mundo = clamp(g.mundo + 8); } },
  { id: 'safra', texto: () => 'Safra recorde no campo: os portos não davam conta, e o PIB do ano sentiu.', efeito: g => { g.pib = r1(g.pib + 0.4); } },
  { id: 'acordo', texto: () => 'Depois de anos de negociação, saiu o acordo comercial com um bloco inteiro de países. Assinatura em cerimônia, e setores reclamando da concorrência.', efeito: g => { g.mundo = clamp(g.mundo + 6); g.ajuste.pib = r1(g.ajuste.pib + 0.2); } },
  { id: 'descoberta', texto: () => 'Uma reserva de energia descoberta no litoral virou manchete no mundo inteiro: a promessa de dinheiro por décadas — e a briga para decidir quem fica com ele.', efeito: g => { g.ajuste.pib = r1(g.ajuste.pib + 0.3); g.conflito = clamp(g.conflito + 5); } },
  { id: 'esporte', texto: () => 'A seleção do país ganhou um título mundial. Por uma semana, ninguém falou de política — e o governo foi à festa.', efeito: (_g, v) => { const m = v.caminhos.politica!.mandato!; m.aprovacao = clamp(m.aprovacao + 3); } },
  { id: 'tragedia', texto: () => 'Um acidente aéreo matou dezenas de pessoas e parou o país em luto oficial de três dias.', efeito: g => { g.conflito = clamp(g.conflito - 5); } },
  { id: 'visita', texto: () => 'Visita de Estado de uma potência estrangeira: banda militar, jantar de gala e uma lista de acordos que ainda vão sair do papel.', efeito: g => { g.mundo = clamp(g.mundo + 5); } },
  { id: 'eleicao_vizinho', texto: () => 'No país vizinho, venceu um governo que não esconde a antipatia pelo seu. A fronteira ficou mais fria.', efeito: g => { g.mundo = clamp(g.mundo - 6); } }
];

function anoDoGoverno(v: Vida): void {
  const p = v.caminhos.politica;
  const e = p?.presidencia;
  if (!p || !e) return;
  // Saiu do cargo por um caminho que não passou pelo fim (a cassação de campanha, a prisão, a infidelidade): arquiva.
  if (e.governo && p.mandato?.cargo !== 'presidente') { arquivar(v, 'cassado'); return; }
  const g = e.governo;
  const m = p.mandato;
  const r = regraDaPresidencia(v);
  if (!g || !m || !r || g.tInicio === v.t) return;
  const rng = rngDe(v.id, 'pres_ano', v.t);
  const fase = v.economia?.fase ?? 'normal';
  // A ECONOMIA: a fase do mundo, as reformas que ficaram, a política do ano, o mundo (as relações).
  const pol = g.politica && v.t - g.politica.t < 12 ? POLITICAS_129[g.politica.id] : undefined;
  const alvoPib = (PIB_DA_FASE[fase] ?? 2) + g.ajuste.pib + (pol?.pib ?? 0) + (g.mundo - 50) / 50 * 0.4;
  const alvoInf = (v.economia?.inflacao ?? 0.045) * 100 + g.ajuste.inflacao + (pol?.inflacao ?? 0);
  const alvoDes = r.desemprego + (fase === 'crise' ? 2.5 : fase === 'desaceleracao' ? 1 : fase === 'expansao' ? -1 : fase === 'recuperacao' ? 0.3 : 0) + g.ajuste.desemprego + (pol?.desemprego ?? 0);
  g.pib = r1(g.pib + (alvoPib - g.pib) * 0.7 + rng.normal() * 0.5);
  g.inflacao = r1(Math.max(-1, g.inflacao + (alvoInf - g.inflacao) * 0.6 + rng.normal() * 0.6));
  g.desemprego = r1(clamp(g.desemprego + (alvoDes - g.desemprego) * 0.5 + rng.normal() * 0.3, 1.5, 30));
  // A APROVAÇÃO sente a economia (o resto — o desgaste, a crise do mundo — `politica` já contou).
  const eco = clamp((g.pib - 1.2) * 1.5 - Math.max(0, g.inflacao - 6) * 0.7 - (g.desemprego - r.desemprego) * 0.9, -8, 7);
  m.aprovacao = Math.round(clamp(m.aprovacao + eco + (pol?.aprovacao ?? 0) * 0.5 + (g.base < 35 ? -2 : 0) - (g.conflito > 60 ? 2 : 0)));
  // A BASE acompanha a rua (e o tempo de governo cansa os aliados).
  const anos = (v.t - m.tInicio) / 12;
  g.base = Math.round(clamp(g.base + (m.aprovacao - 50) * 0.06 + rng.normal() * 2 - (anos >= 3 ? 1 : 0), 8, 85));
  g.conflito = Math.round(Math.max(0, g.conflito - 6));
  g.mundo = Math.round(g.mundo + (50 - g.mundo) * 0.1);
  if (m.aprovacao >= 65 && !g.conquistas.some(x => x.startsWith(`${anoDe(v.t)} ·`))) g.conquistas.push(`${anoDe(v.t)} · aprovação acima de 65%`);
  tramitar(v, g, r, m, rng);
  // O IMPEACHMENT: rua contra, base pequena e um motivo (o escândalo, o conflito com os Poderes, o favor que virou processo,
  // a rua inteira pedindo a saída).
  const motivo = g.escandalos > 0 || g.conflito >= 40 || m.aprovacao < 25 || v.fatos['pol_risco'] !== undefined || (!!p.escandalo && v.t - p.escandalo.t < 36);
  if (!g.impeachment && m.aprovacao < 30 && g.base < 45 && motivo && rng.chance(0.55)) {
    g.impeachment = { t: v.t, etapa: 1 };
    v.fatos['pres_impeachment'] = v.t;
  } else if (g.impeachment && v.t - g.impeachment.t >= 12) {
    // O processo que ficou sem resposta segue sozinho (a defesa de sempre).
    julgarImpeachment(v, rng, undefined);
  }
  // A HISTÓRIA: às vezes, o ano entra nos livros (sem escolha).
  if (rng.chance(0.22)) {
    const h = rng.pick(HISTORICOS);
    h.efeito(g, v);
    const texto = h.texto(v);
    registrarNoMandato(v, `${anoDe(v.t)} · ${texto.split('.')[0].toLowerCase()}`);
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho' });
  }
  g.anos.push({ ano: anoDe(v.t), aprovacao: m.aprovacao, inflacao: g.inflacao, pib: g.pib, desemprego: g.desemprego, base: g.base });
  if (g.anos.length > 12) g.anos.splice(0, g.anos.length - 12);
}

/** A reforma anda casa por casa (uma por ano), com o quórum dela: a base, a rua, o centro que vota caso a caso. */
function tramitar(v: Vida, g: Governo129, r: RegraPresidencial, m: NonNullable<VidaPolitica['mandato']>, rng: Rng): void {
  const rf = g.reforma;
  if (!rf || v.t - rf.t < 6) return;
  const md = REFORMAS_129[rf.id];
  const quorum = md.emenda ? r.quorum.emenda : r.quorum.lei;
  const votosDaReforma = g.base + (m.aprovacao - 50) * 0.25 + 15 + rng.normal() * 6;
  const casa = r.casas[rf.etapa - 1] ?? r.congresso;
  const p = v.caminhos.politica!;
  if (votosDaReforma >= quorum) {
    if (rf.etapa === 1 && r.casas[1]) {
      g.reforma = { id: rf.id, etapa: 2, t: v.t };
      escrever(v, { texto: `${cap(md.nome)} passou em ${casa}, com ${Math.round(Math.min(98, votosDaReforma))}% dos votos. Agora, ${r.casas[1]}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
      return;
    }
    g.reforma = undefined;
    g.reformas.push({ id: rf.id, t: v.t, aprovada: true });
    aplicarReforma(g, rf.id, m);
    m.feito += 3;
    g.conquistas.push(`${anoDe(v.t)} · ${md.nome} aprovada`);
    registrarNoMandato(v, `${anoDe(v.t)} · ${md.nome} aprovada em ${r.congresso}`);
    escrever(v, { texto: `${cap(md.nome)} foi aprovada em ${casa} e promulgada. É a marca do governo — para o bem e para o mal.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    return;
  }
  g.reforma = undefined;
  g.reformas.push({ id: rf.id, t: v.t, aprovada: false });
  m.aprovacao = clamp(m.aprovacao - 3);
  g.base = Math.round(clamp(g.base - 3, 0, 100));
  desgastar(p, 4, 'mandato');
  registrarNoMandato(v, `${anoDe(v.t)} · ${md.nome} derrotada em ${casa}`);
  escrever(v, { texto: `${cap(md.nome)} foi derrotada em ${casa}: faltaram votos (precisava de ${quorum}% das cadeiras). A oposição comemorou no plenário.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
}

function aplicarReforma(g: Governo129, id: Reforma129, m: NonNullable<VidaPolitica['mandato']>): void {
  const a = g.ajuste;
  if (id === 'tributaria') { a.pib = r1(a.pib + 0.4); m.aprovacao = clamp(m.aprovacao + 1); }
  if (id === 'previdencia') { a.inflacao = r1(a.inflacao - 0.4); a.pib = r1(a.pib + 0.2); m.aprovacao = clamp(m.aprovacao - 4); }
  if (id === 'administrativa') { a.pib = r1(a.pib + 0.2); g.conflito = clamp(g.conflito + 6); }
  if (id === 'politica') { g.base = Math.round(clamp(g.base + 4)); }
  if (id === 'educacao') { a.desemprego = r1(a.desemprego - 0.2); m.aprovacao = clamp(m.aprovacao + 3); }
  if (id === 'seguranca') { m.aprovacao = clamp(m.aprovacao + 3); g.conflito = clamp(g.conflito + 3); }
}

/**
 * O impeachment em duas casas (no Brasil: a Câmara autoriza por dois terços, o Senado julga por dois terços; nos EUA,
 * a Câmara acusa por maioria). Os votos contra são o que sobra da base e do que a defesa conseguiu. `defesa` é o que a
 * pessoa escolheu (`presi_impeachment`); sem escolha, a defesa de sempre.
 */
export function julgarImpeachment(v: Vida, rng: Rng, defesa: number | undefined): { caiu: boolean; etapa: 1 | 2; contra: number; seguiu: boolean } {
  const p = v.caminhos.politica!;
  const g = presidencia(v).governo!;
  const r = regraDaPresidencia(v)!;
  const m = p.mandato!;
  const etapa = g.impeachment?.etapa ?? 1;
  const apoio = g.base + (defesa ?? 0) + (m.aprovacao - 30) * 0.3 + rng.normal() * 6;
  const contra = Math.round(clamp(100 - apoio - 8, 0, 100));
  const quorum = etapa === 1 ? r.impeachment.acusa : r.impeachment.condena;
  const casa = r.casas[etapa - 1] ?? r.congresso;
  if (contra < quorum) {
    g.impeachment = undefined;
    delete v.fatos['pres_impeachment'];
    g.conquistas.push(`${anoDe(v.t)} · sobreviveu ao processo de afastamento`);
    registrarNoMandato(v, `${anoDe(v.t)} · ${r.impeachment.nome} barrado em ${casa}`);
    escrever(v, { texto: `${cap(r.impeachment.nome)} foi barrado em ${casa}: ${contra}% votaram contra você, e precisavam de ${quorum}%. O governo sobreviveu — mais fraco.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    g.base = Math.round(clamp(g.base - 2));
    return { caiu: false, etapa, contra, seguiu: false };
  }
  if (etapa === 1 && r.casas[1]) {
    g.impeachment = { t: v.t, etapa: 2 };
    escrever(v, { texto: `${cap(casa)} aprovou ${r.impeachment.nome}: ${contra}% dos votos. O julgamento vai para ${r.casas[1]}${paisDaVida(v) === 'BR' ? ', e você é afastado do cargo enquanto ele corre'.replace('afastado', flex(ge(v), 'afastado', 'afastada', 'afastade')) : ''}.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    m.aprovacao = clamp(m.aprovacao - 4);
    return { caiu: false, etapa, contra, seguiu: true };
  }
  delete v.fatos['pres_impeachment'];
  g.impeachment = undefined;
  afastarDoCargo(v, `${cap(casa)} condenou: ${contra}% dos votos. ${cap(r.impeachment.nome)} tirou você ${paisDaVida(v) === 'BR' ? 'do Planalto' : 'da Presidência'}${r.impeachment.inabilita ? `, com ${r.impeachment.inabilita} anos sem poder exercer função pública` : ''}.`);
  return { caiu: true, etapa, contra, seguiu: false };
}

/* ================================================================ As ações (presidente e governador) */

export type AcaoGoverno129 = 'eixos' | 'reforma' | 'base' | 'economia' | 'mundo' | 'pronunciamento' | 'independente'
  | 'gov_seguranca' | 'gov_interior' | 'gov_repasses';
const POR_ANO_PRES = 3;
const feitaNoAno = (v: Vida, id: string) => v.anoAtual.acoes.includes(`pres_acao:${id}`) || v.anoAtual.acoes.includes(`pol_cargo:${id}`);
const presidenciaisNoAno = (v: Vida) => v.anoAtual.acoes.filter(x => x.startsWith('pres_acao:')).length;
const estaduaisNoAno = (v: Vida) => v.anoAtual.acoes.filter(x => x.startsWith('pol_cargo:')).length;

/** A eleição presidencial na janela (para a candidatura independente). */
function eleicaoPresidencialNaJanela(v: Vida) {
  const e = eleicaoNaJanela(v);
  return e && cargoNoCiclo('presidente', e.ano, paisDaVida(v), municipio(v.moradia.municipioId).uf) ? e : undefined;
}

function disp(v: Vida, valor?: string): Veredito {
  const p = v.caminhos.politica;
  const a = valor as AcaoGoverno129;
  if (!p) return bloqueio('impossivel', 'Não se aplica.');
  if (a === 'independente') {
    const r = regraDaPresidencia(v);
    if (!r?.independente) return bloqueio('impossivel', 'Aqui não há candidatura sem partido.');
    if (p.partido) return bloqueio('impossivel', 'Com partido, a candidatura passa por ele.');
    if (p.campanha || p.posse) return bloqueio('impossivel', 'A candidatura já está registrada.');
    const e = eleicaoPresidencialNaJanela(v);
    if (!e) return bloqueio('requisito', 'Não há eleição presidencial nos próximos meses.');
    return podeConcorrer(v, 'presidente', e.t);
  }
  const m = p.mandato;
  if (a.startsWith('gov_')) {
    if (m?.cargo !== 'governador') return bloqueio('impossivel', 'Isso é do governo de um estado.');
    if (feitaNoAno(v, a)) return bloqueio('incompativel', 'Isso já foi feito neste ano.');
    if (estaduaisNoAno(v) >= 2) return bloqueio('incompativel', 'A agenda do governo neste ano já está tomada (duas frentes por ano).');
    if (a === 'gov_repasses' && v.fatos['gov129_repasse'] !== undefined && v.t - v.fatos['gov129_repasse'] < 24) return bloqueio('incompativel', 'A última rodada de negociação foi há pouco.');
    return PERMITIDO;
  }
  const g = governoAtual(v);
  if (!g || !m) return bloqueio('impossivel', 'Isso é do governo do país.');
  if (g.impeachment && a !== 'pronunciamento' && a !== 'base') return bloqueio('incompativel', 'Com o processo de afastamento aberto, o governo só cuida de sobreviver.');
  if (feitaNoAno(v, a)) return bloqueio('incompativel', 'Isso já foi decidido neste ano.');
  if (presidenciaisNoAno(v) >= POR_ANO_PRES) return bloqueio('incompativel', 'A agenda do ano já está tomada (três grandes frentes por ano).');
  if (a === 'reforma' && g.reforma) return bloqueio('incompativel', `${cap(REFORMAS_129[g.reforma.id].nome)} ainda tramita: uma reforma de cada vez.`);
  if (a === 'eixos' && g.eixos.length >= 2 && v.t - m.tInicio < 24) return bloqueio('incompativel', 'Os eixos do governo foram definidos há pouco: trocar agora parece improviso.');
  return PERMITIDO;
}

function exec(v: Vida, r: Rng, valor?: string): SaidaPolitica {
  const a = valor as AcaoGoverno129;
  const p = v.caminhos.politica!;
  if (a === 'independente') return { decisao: 'presx_independente' };
  if (a.startsWith('gov_')) { v.anoAtual.acoes.push(`pol_cargo:${a}`); return acaoDoEstado(v, r, a); }
  v.anoAtual.acoes.push(`pres_acao:${a}`);
  if (a === 'pronunciamento') {
    const m = p.mandato!;
    const g = governoAtual(v)!;
    const crise = !!m.crise;
    const ok = r.chance(clamp(0.35 + habilidade(v, 'lideranca') / 250 + (m.aprovacao - 40) / 150 + (crise ? 0.1 : 0), 0.1, 0.8));
    m.aprovacao = clamp(m.aprovacao + (ok ? 3 : -2));
    if (!ok) g.conflito = clamp(g.conflito + 4);
    const texto = ok ? `Falou em rede nacional${crise ? ' sobre a crise' : ''}, sem papel na mão. Nas casas, gente parou para ouvir; a aprovação subiu.` : 'O pronunciamento em rede nacional virou panelaço nas janelas e meme até de madrugada.';
    escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', escolha: true, tom: ok ? 'bom' : 'ruim' });
    return { texto, tom: ok ? 'bom' : 'ruim' };
  }
  return { decisao: { eixos: 'presg_eixos', reforma: 'presg_reforma', base: 'presg_base', economia: 'presg_economia', mundo: 'presg_mundo' }[a as 'eixos'] };
}

/** As três ações do governo do estado: a segurança (a polícia é estadual), o interior (rodovias e hospitais), os repasses. */
function acaoDoEstado(v: Vida, r: Rng, a: AcaoGoverno129): SaidaPolitica {
  const p = v.caminhos.politica!;
  const m = p.mandato!;
  const uf = municipio(v.moradia.municipioId);
  const forcaP = p.apoio / 250 + (aliado(v) ? 0.06 : 0) + habilidade(v, 'lideranca') / 500 - p.desgaste / 400;
  const crise = v.economia?.fase === 'crise';
  const fim = (texto: string, tom: 'bom' | 'ruim' | 'neutro', bio = false): SaidaPolitica => { escrever(v, { texto, relevancia: bio ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, tom: tom === 'neutro' ? undefined : tom }); return { texto, tom }; };
  if (a === 'gov_seguranca') {
    const deu = r.chance(clamp(0.42 + forcaP - (crise ? 0.08 : 0), 0.12, 0.8));
    if (deu) { m.feito += 3; m.aprovacao = clamp(m.aprovacao + 5); registrarNoMandato(v, `${anoDe(v.t)} · plano estadual de segurança: os homicídios caíram`); return fim('O plano estadual de segurança saiu do papel: mais policiais na rua à noite, presídio com bloqueador de celular, delegacia funcionando de madrugada. Os homicídios do estado caíram pela primeira vez em anos.', 'bom', true); }
    m.aprovacao = clamp(m.aprovacao - 2); desgastar(p, 3, 'promessas');
    return fim('O plano estadual de segurança foi anunciado com festa — e a violência não leu o anúncio. A oposição contou os mortos na tribuna da Assembleia.', 'ruim');
  }
  if (a === 'gov_interior') {
    const deu = r.chance(clamp(0.5 + forcaP / 2 - (crise ? 0.15 : 0), 0.15, 0.8));
    if (deu) { m.feito += 2; m.aprovacao = clamp(m.aprovacao + 3); p.apoio = clamp(p.apoio + 4); registrarNoMandato(v, `${anoDe(v.t)} · rodovia duplicada e hospital regional aberto no interior`); return fim('A rodovia estadual que matava gente foi duplicada, e o hospital regional abriu as portas: quem mora no interior parou de viajar seis horas para fazer exame na capital.', 'bom', true); }
    desgastar(p, 3, 'mandato'); if (!m.crise) m.crise = { t: v.t, tipo: 'gov_rodovia' };
    return fim('As obras no interior pararam no meio: o asfalto acabou no quilômetro 40, e o hospital regional ficou de fachada pronta e sem médico.', 'ruim');
  }
  v.fatos['gov129_repasse'] = v.t;
  const deu = r.chance(clamp(0.45 + ([0.1, 0, -0.08][v.fatos['pol_partido_porte'] ?? 1] ?? 0) + forcaP / 2 - (crise ? 0.2 : 0), 0.12, 0.8));
  if (deu) { m.feito += 2; m.aprovacao = clamp(m.aprovacao + 2); registrarNoMandato(v, `${anoDe(v.t)} · repasses federais destravados para ${uf.uf || 'o estado'}`); return fim('Uma semana de corredor no governo federal, e os repasses saíram: a folha do estado em dia e as obras paradas voltaram a andar.', 'bom'); }
  desgastar(p, 3, 'partido');
  return fim('Voltou do governo federal com promessa e sem dinheiro: o repasse ficou "em estudo". A folha do fim do ano vai apertar.', 'ruim');
}

/** As ações do governo (para a tela de Trabalho): o presidente governa o país; o governador, o estado. */
function acoes(v: Vida): AcaoProfissional[] {
  const out: AcaoProfissional[] = [];
  const p = v.caminhos.politica;
  if (!p) return out;
  const A = (valor: AcaoGoverno129) => ({ tipo: 'politica', oque: 'governo129', valor } as unknown as Acao);
  const m = p.mandato;
  const r = regraDaPresidencia(v);
  if (!m && !p.partido && r?.independente && naPolitica(v) && eleicaoPresidencialNaJanela(v) && !p.campanha && !p.posse && podeTentar(disp(v, 'independente')))
    out.push({ id: 'pres_independente', rotulo: 'Lançar candidatura independente à Presidência', porque: 'Sem partido: as assinaturas, o dinheiro e o tempo de TV por conta própria.', acao: A('independente'), peso: 6 });
  if (m?.cargo === 'governador') {
    const uf = municipio(v.moradia.municipioId);
    const add = (id: AcaoGoverno129, rotulo: string, porque: string, peso: number) => { if (podeTentar(disp(v, id))) out.push({ id: `pol_${id}`, rotulo, porque, acao: A(id), peso }); };
    add('gov_seguranca', 'Lançar um plano estadual de segurança', 'A polícia é do estado: se a violência cair, o nome é seu; se não, também.', 4);
    add('gov_interior', 'Levar o governo ao interior: rodovias e hospitais regionais', 'Quem mora longe da capital vota — e cobra.', 3);
    add('gov_repasses', `Negociar repasses federais para ${uf.uf || 'o estado'}`, 'Sem o dinheiro de cima, a folha aperta.', 2);
    return out;
  }
  const g = governoAtual(v);
  if (!g || !m) return out;
  const add = (id: AcaoGoverno129, rotulo: string, porque: string | undefined, peso: number) => { if (podeTentar(disp(v, id))) out.push({ id: `pres_${id}`, rotulo, porque, acao: A(id), peso }); };
  add('eixos', g.eixos.length ? 'Rever as prioridades do governo' : 'Definir as prioridades do governo', g.eixos.length ? undefined : 'Sem prioridade, o governo é só administração.', g.eixos.length ? 1 : 9);
  add('economia', 'Decidir a política econômica do ano', `Inflação ${pct(g.inflacao)}, PIB ${pct(g.pib)}, desemprego ${pct(g.desemprego)}.`, 7);
  add('reforma', 'Enviar uma reforma ao Congresso', `A base tem ${g.base}% das cadeiras.`, g.reformas.length ? 4 : 6);
  add('base', 'Articular a base no Congresso', g.base < 40 ? 'Com a base pequena, nada passa.' : undefined, g.base < 40 ? 8 : 3);
  add('mundo', 'Cuidar da agenda internacional', g.mundo < 40 ? 'O país anda isolado.' : undefined, g.mundo < 40 ? 5 : 2);
  add('pronunciamento', 'Fazer um pronunciamento em rede nacional', m.crise ? 'O país espera uma palavra sua.' : undefined, m.crise ? 6 : 2);
  return out;
}

/* ================================================================ O horizonte e a leitura */

function horizonte(v: Vida): string | undefined {
  const r = regraDaPresidencia(v);
  const cal = calendarioDoMandato(v);
  const p = v.caminhos.politica;
  if (!r || !cal || !p) return undefined;
  const t = tDaEleicao(cal.eleicaoDoFim.ano);
  const pode = podeTentar(podeConcorrer(v, 'presidente', t));
  return `${cal.ultimoAno ? 'Último ano do mandato' : `Ano ${cal.ano} de ${cal.anos}`}: ${pode ? 'a reeleição é possível — e a economia vai pesar nela.' : `não há reeleição agora. ${r.limite.texto}`}`;
}

export interface LeituraPresidencial {
  /** Onde não há eleição direta para presidente. */
  semPresidencia?: string;
  regras?: { titulo: string; idade: number; anos: number; limite: string; segundoTurno: boolean; independente: boolean; nato: boolean; proxima: number; colegio?: boolean };
  /** O que falta (ou o que pesa) para disputar, quando a pessoa está na política. */
  requisitos?: { texto: string; ok: boolean }[];
  campanha?: { ano: number; etapa: number; via: string; pesquisa: ReturnType<typeof pesquisa>; historia: number[]; segundo?: string; debate?: string; eixo?: string; chance: string };
  governo?: {
    inflacao: number; pib: number; desemprego: number; base: number; mundo: number; conflito: number;
    inicio: Governo129['inicio']; eixos: string[]; reforma?: string; reformas: string[]; conquistas: string[]; impeachment?: string; politica?: string; escandalos: number;
    anos: Governo129['anos'];
  };
  candidaturas: { ano: number; texto: string; ganhou: boolean }[];
  mandatos: MandatoPresidencial129[];
}

/** A leitura da Presidência (para o painel político): as regras do país, a corrida, o governo, a história. */
export function leituraPresidencial(v: Vida): LeituraPresidencial | undefined {
  const p = v.caminhos.politica;
  if (!p) return undefined;
  const pais = paisDaVida(v);
  const r = REGRAS_PRESIDENCIAIS[pais];
  const e = p.presidencia;
  const out: LeituraPresidencial = { candidaturas: [], mandatos: e?.mandatos ?? [] };
  if (!r) out.semPresidencia = semPresidenciaTexto(pais);
  else {
    // VIDA 14: a eleição de data própria (Portugal) conta pelo mês dela, e a posse também.
    const prox = (() => { for (let a = anoDe(v.t); a < anoDe(v.t) + 12; a++) if (cargoNoCiclo('presidente', a, pais) && tDaEleicaoDe('presidente', a, pais) > v.t) return a; return r.ciclo[0]; })();
    out.regras = { titulo: nomeCargo(v, 'presidente'), idade: r.idade, anos: r.anos, limite: r.limite.texto, segundoTurno: r.segundoTurno, independente: r.independente, nato: r.nato, proxima: prox, ...(r.colegio ? { colegio: true } : {}) };
    if (!emMandatoPresidencial(v) && !e?.campanha && p.fase !== 'encerrada') {
      const tP = tDaPosseDe('presidente', prox, pais);
      const req: { texto: string; ok: boolean }[] = [];
      req.push({ texto: `Idade mínima de ${r.idade} anos na posse`, ok: (tP - v.eu.tNasc) / 12 >= r.idade });
      if (r.nato) req.push({ texto: r.semipresidencial ? 'Português de origem (CRP, art. 122.º)' : 'Nacionalidade de nascença', ok: natoDoPais(v, pais) });
      if (r.assinaturas) req.push({ texto: `Assinaturas de ${r.assinaturas[0].toLocaleString('pt-BR')} a ${r.assinaturas[1].toLocaleString('pt-BR')} eleitores (partido não é exigido)`, ok: true });
      else req.push({ texto: r.independente ? 'Partido (ou candidatura independente, com assinaturas)' : 'Filiação a um partido', ok: !!p.partido || r.independente });
      req.push({ texto: 'Nome conhecido no país inteiro', ok: nomeNacional(v) >= 50 });
      if (p.partido && !r.semipresidencial) req.push({ texto: 'Lugar dentro do partido (para ser o escolhido)', ok: basePartidaria(v) >= 25 });
      if (!r.semipresidencial) req.push({ texto: 'Um cargo de peso antes (governo do estado, Senado, Congresso, prefeitura grande)', ok: trajetoria(p) >= 3 });
      out.requisitos = req;
    }
  }
  const c = e?.campanha;
  if (c && p.campanha) {
    out.campanha = {
      ano: c.ano, etapa: c.etapa, via: c.via, pesquisa: pesquisa(v), historia: c.pesquisas,
      segundo: c.segundo ? `Segundo turno contra ${c.adversarios[c.segundo.adv].nome}` : undefined,
      debate: c.debateFoi ? { bem: 'Foi bem no debate', mal: 'Foi mal no debate', empate: 'O debate terminou empatado' }[c.debateFoi] : undefined,
      eixo: c.eixo ? EIXOS_129[c.eixo] : undefined,
      chance: chanceEmPalavras(chancePresidencial(v, 160))
    };
  }
  const g = governoAtual(v);
  if (g) {
    out.governo = {
      inflacao: g.inflacao, pib: g.pib, desemprego: g.desemprego, base: g.base, mundo: g.mundo, conflito: g.conflito, inicio: g.inicio,
      eixos: g.eixos.map(x => EIXOS_129[x]), reforma: g.reforma ? `${cap(REFORMAS_129[g.reforma.id].nome)} — em ${r?.casas[g.reforma.etapa - 1] ?? r?.congresso}` : undefined,
      reformas: g.reformas.map(x => `${anoDe(x.t)}: ${REFORMAS_129[x.id].nome} ${x.aprovada ? 'aprovada' : 'derrotada'}`),
      conquistas: g.conquistas.slice(-6), escandalos: g.escandalos,
      impeachment: g.impeachment ? `${cap(r?.impeachment.nome ?? 'o processo de afastamento')} em ${r?.casas[g.impeachment.etapa - 1] ?? r?.congresso}` : undefined,
      politica: g.politica && v.t - g.politica.t < 12 ? POLITICAS_129[g.politica.id].nome : undefined,
      anos: g.anos
    };
  }
  out.candidaturas = (e?.candidaturas ?? []).slice(-6).reverse().map(x => {
    const quem = x.primeiro?.find(y => y.voce);
    const texto = x.resultado === 'preterido' ? `${x.ano}: não foi ${x.via === 'primarias' ? 'escolhido nas primárias' : 'o escolhido na convenção'}`.replace('escolhido', flex(ge(v), 'escolhido', 'escolhida', 'escolhide'))
      : x.resultado === 'desistiu' ? `${x.ano}: retirou a candidatura`
        : `${x.ano}: ${x.resultado === 'eleito' ? (x.reeleicao ? flex(ge(v), 'reeleito', 'reeleita', 'reeleite') : flex(ge(v), 'eleito', 'eleita', 'eleite')) : 'derrotado'.replace('derrotado', flex(ge(v), 'derrotado', 'derrotada', 'derrotade'))}${x.colegio
          ? ` — ${x.colegio.delegados[0]} delegados no Colégio Eleitoral (${x.colegio.estados} estados), ${pct(x.colegio.popular[0])} do voto popular${x.colegio.camara ? '; decidido pela Câmara' : ''}${x.resultado !== 'eleito' ? `; ${x.colegio.eleito} venceu` : ''}`
          : `${quem ? ` — ${pct(quem.pct)} no primeiro turno` : ''}${x.segundo ? `, ${pct(x.segundo.voce)} no segundo contra ${x.segundo.adversario}` : ''}`}`;
    return { ano: x.ano, texto, ganhou: x.resultado === 'eleito' };
  });
  if (!out.regras && !out.campanha && !out.governo && !out.candidaturas.length && !out.mandatos.length) return { ...out, semPresidencia: out.semPresidencia };
  return out;
}

export const chanceEmPalavras = (x: number) => (x >= 0.7 ? 'favorito na urna' : x >= 0.45 ? 'com boa chance' : x >= 0.25 ? 'disputa aberta' : x >= 0.08 ? 'azarão' : 'quase sem chance');

/* ================================================================ Saves */

/** Saves antigos: nada a preencher (campo opcional). Um estado quebrado (de um save editado à mão) é descartado sem tocar no resto. */
export function normalizarVida129Presidencia(v: Vida): void {
  const p = v.caminhos.politica;
  const e = p?.presidencia as Presidencia129 | undefined;
  if (!p || !e) return;
  if (typeof e !== 'object' || !Array.isArray(e.candidaturas) || !Array.isArray(e.mandatos)) { delete p.presidencia; return; }
  if (e.campanha && (!Array.isArray(e.campanha.adversarios) || !p.campanha || p.campanha.cargo !== 'presidente')) delete e.campanha;
  if (e.governo && (!Number.isFinite(e.governo.inflacao) || !Number.isFinite(e.governo.base) || !Array.isArray(e.governo.reformas))) delete e.governo;
}

/* ================================================================ Os ganchos */

PRESIDENCIA.elegivel = elegivel;
PRESIDENCIA.forca = forca;
PRESIDENCIA.registrar = registrar;
PRESIDENCIA.apurar = apurar;
PRESIDENCIA.posse = posse;
PRESIDENCIA.fim = fim;
PRESIDENCIA.ano = anoDoGoverno;
PRESIDENCIA.horizonte = horizonte;
PRESIDENCIA.acoes = acoes;
PRESIDENCIA.disp = disp;
PRESIDENCIA.exec = exec;

/* ================================================================ Para o conteúdo */

export { EIXOS_129, POLITICAS_129, REFORMAS_129 };
export type { Eixo129, Reforma129 };
/** O nome do adversário no partido dele: "Fulana Tal, do partido X". */
export const doAdversario = (a: Adversario129) => `${a.nome} (${a.partido ? partidoDe(a.partido)?.chamado ?? a.partido : 'sem partido'})`;
export const oPartidoDoAdversario = (a: Adversario129) => oPartido(a.partido);
/** O líder da pesquisa entre os adversários. */
export const liderAdversario = (v: Vida): Adversario129 | undefined => [...(presidencia(v).campanha?.adversarios ?? [])].sort((a, b) => b.forca - a.forca)[0];
/** Quem você é na pesquisa (posição). */
export const posicaoNaPesquisa = (v: Vida) => pesquisa(v).findIndex(x => x.voce) + 1;
export { aliviar, desgastar };
