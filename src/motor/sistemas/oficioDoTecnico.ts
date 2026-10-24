/**
 * REWORK 11 · ESP-11.7 — o OFÍCIO de quem trabalha na comissão técnica (auxiliar, técnico de todas as modalidades,
 * preparador físico). Não é "um emprego com chefia": antes, o técnico do Londrina via "Almoçar com a chefia", "Fazer uma
 * capacitação (curso da empresa)", "Pedir aumento", "Horas extras" e a escada de cargos. Agora o trabalho tem os verbos
 * do banco:
 *
 *   licença de treinador   os cursos por nível (C → B → A → Pro), com custo e tempo: cada nível concluído pesa no
 *                          trabalho do técnico (`tecnico.trabalhoDoTecnico`) e no nome; o Pro pede estrada no banco.
 *   análise tática         estudar o adversário, montar o plano: a próxima temporada sente (`PassagemDeTecnico.ajuste`).
 *   gestão do elenco       a conversa com os líderes, o rodízio: o vestiário (`PassagemDeTecnico.vestiario`).
 *   diretoria              alinhar o que se espera, pedir reforço: a pressão (`PassagemDeTecnico.pressao`) — que pode
 *                          subir, se a conversa der errado.
 *
 * Quem é auxiliar (ainda sem comando) faz o mesmo do lado de quem prepara: o relatório do adversário, a ponte com os
 * jogadores — e isso aparece no desempenho que a promoção lê. As peças do comando (`passagem`) são lidas aqui sem
 * importar o banco (`tecnico`): este módulo fica embaixo, e o banco e as ações do trabalho o chamam.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Emprego, PassagemDeTecnico, Vida } from '../tipos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { economiaLocal } from '../dados/lugares';
import { escrever } from '../nucleo';
import { dinheiro, flex, ge } from '../texto';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { pagar, vereditoDePagar } from './dinheiro';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

/** Quem trabalha numa comissão técnica de clube (o auxiliar, o técnico, o preparador): o ofício do banco. */
export function naComissaoTecnica(e: Emprego | undefined): boolean {
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  return !!oc && oc.trilha === 'treino' && oc.setor === 'esporte' && oc.contrato === 'clt';
}
/**
 * O vocabulário corporativo (a empresa, a chefia, o curso da empresa, a avaliação anual) não cabe aqui: o atleta e a
 * comissão técnica de clube têm contrato de clube, não emprego de empresa. Os acontecimentos de trabalho genérico leem isto.
 */
export function semVocabularioCorporativo(e: Emprego | undefined): boolean {
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  return !!oc && (oc.trilha === 'atleta' || naComissaoTecnica(e));
}

/** A passagem de comando em curso (a mesma regra de `tecnico.passagemAtual`, lida sem importar o banco). */
const passagem = (v: Vida): PassagemDeTecnico | undefined => { const ps = v.caminhos.tecnico?.passagens; const p = ps?.[ps.length - 1]; return p && p.ate === undefined ? p : undefined; };
/** No comando de um time (técnico de futebol com passagem aberta). */
export const noComandoDoTime = (v: Vida) => !!passagem(v) && v.trabalho.atual?.ocupacaoId === 'tecnico_futebol';

/* ------------------------------------------------------------ A licença */

export const NIVEIS_DE_LICENCA = ['', 'C', 'B', 'A', 'Pro'] as const;
/** Cada nível: meses de curso, custo (no custo de vida de referência; vira o de onde se vive) e o que pede. */
const CURSO: Record<1 | 2 | 3 | 4, { meses: number; custo: number; pede?: string }> = {
  1: { meses: 6, custo: 3500 },
  2: { meses: 9, custo: 7000 },
  3: { meses: 12, custo: 14000, pede: 'dois anos numa comissão técnica' },
  4: { meses: 18, custo: 28000, pede: 'três temporadas como técnico principal' }
};
const custoDoCurso = (v: Vida, n: 1 | 2 | 3 | 4) => Math.round(CURSO[n].custo * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

export const licencaDe = (v: Vida) => v.caminhos.licencaDeTreinador;
export const nivelDaLicenca = (v: Vida): number => licencaDe(v)?.nivel ?? 0;

/** O próximo curso (o nível, o que custa, quanto dura) — ou o que falta para poder fazê-lo. */
export function proximoCurso(v: Vida): { nivel: 1 | 2 | 3 | 4; meses: number; custo: number; falta?: string } | undefined {
  const l = licencaDe(v);
  if (l?.emCurso) return undefined;
  const n = (Math.min(4, (l?.nivel ?? 0) + 1)) as 1 | 2 | 3 | 4;
  if ((l?.nivel ?? 0) >= 4) return undefined;
  const c = CURSO[n];
  const anosNaComissao = (v.trabalho.experiencia['treino'] ?? 0) / 12;
  const temporadasNoComando = (v.caminhos.tecnico?.passagens ?? []).reduce((s, p) => s + p.temporadas.length, 0);
  const falta = n === 3 && anosNaComissao < 2 ? c.pede : n === 4 && temporadasNoComando < 3 ? c.pede : undefined;
  return { nivel: n, meses: c.meses, custo: custoDoCurso(v, n), falta };
}

/** O peso da licença no trabalho do técnico (em pontos de força de jogo): o curso ensina, a estrada continua contando mais. */
export const pesoDaLicenca = (v: Vida) => [0, 0.15, 0.35, 0.6, 0.9][nivelDaLicenca(v)] ?? 0;

/** O curso que termina: o nível sobe, a biografia registra, o nome no mercado de técnicos sente. Chamado uma vez por ano. */
export function avancarLicenca(v: Vida): void {
  const l = licencaDe(v);
  if (!l?.emCurso || v.t < l.emCurso.ate) return;
  l.nivel = l.emCurso.nivel;
  l.t = v.t;
  l.emCurso = undefined;
  const texto = `Concluiu a licença ${NIVEIS_DE_LICENCA[l.nivel]} de treinador${l.nivel === 4 ? ' — a mais alta, a que as grandes ligas pedem' : ''}.`;
  escrever(v, { texto, relevancia: l.nivel >= 3 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'bom' });
  marcar(v, 'formacao', texto, l.nivel >= 3 ? 2 : 1, { dominio: 'lideranca' });
  const c = v.caminhos.tecnico;
  if (c) c.reputacao = clamp(c.reputacao + [0, 1, 2, 3, 4][l.nivel]);
  const e = v.trabalho.atual;
  if (e && naComissaoTecnica(e)) e.desempenho = clamp(e.desempenho + 3);
  v.fatos['pos_treinador'] ??= v.t;
}

/* ------------------------------------------------------------ Os verbos do banco */

export type OqueBanco = 'licenca' | 'analise' | 'elenco' | 'diretoria';
const chave = (v: Vida, o: OqueBanco) => `banco:${o}:${Math.floor(v.t / 12)}`;
const feito = (v: Vida, o: OqueBanco) => v.fatos[chave(v, o)] !== undefined;

export interface VerboDoBanco { oque: OqueBanco; rotulo: string; porque: string; peso: number }

/** O que dá para fazer no ofício agora (o que já se fez no ano sai; a licença em curso, também). */
export function verbosDoBanco(v: Vida): VerboDoBanco[] {
  const e = v.trabalho.atual;
  if (!naComissaoTecnica(e)) return [];
  const comando = passagem(v);
  const tecnicoDeTime = noComandoDoTime(v);
  const out: VerboDoBanco[] = [];
  const pc = proximoCurso(v);
  const l = licencaDe(v);
  if (l?.emCurso) out.push({ oque: 'licenca', rotulo: `Licença ${NIVEIS_DE_LICENCA[l.emCurso.nivel]} de treinador em curso`, porque: `Termina em ${Math.ceil((l.emCurso.ate - v.t) / 12) <= 1 ? 'menos de um ano' : `${Math.ceil((l.emCurso.ate - v.t) / 12)} anos`}.`, peso: 0 });
  else if (pc) out.push({ oque: 'licenca', rotulo: `Fazer a licença ${NIVEIS_DE_LICENCA[pc.nivel]} de treinador`, porque: pc.falta ? `Pede ${pc.falta}.` : `${pc.meses} meses de curso, nas folgas, uns ${dinheiro(pc.custo)}: o que se aprende pesa no trabalho do banco — e o mercado olha o diploma.`, peso: pc.falta ? 1 : nivelDaLicenca(v) === 0 ? 6 : 4 });
  if (!feito(v, 'analise')) out.push({ oque: 'analise', rotulo: tecnicoDeTime ? 'Montar a análise tática da temporada (os adversários, o plano de jogo)' : 'Preparar a análise dos adversários para o técnico', porque: tecnicoDeTime ? 'Horas de vídeo com a comissão: o time chega aos jogos sabendo o que vem. Cansa.' : 'O relatório que o técnico leva para a preleção: quem prepara bem é lembrado quando o banco abre.', peso: 4 });
  if (!feito(v, 'elenco')) out.push({ oque: 'elenco', rotulo: tecnicoDeTime ? 'Cuidar do elenco: conversar com os líderes, explicar quem joga e por quê' : 'Fazer a ponte entre a comissão e os jogadores', porque: tecnicoDeTime ? 'O vestiário pesa nos jogos. A conversa franca pode unir — ou expor.' : 'Os jogadores confiam em quem escuta.', peso: comando && comando.vestiario < 45 ? 7 : 3 });
  if (tecnicoDeTime && comando && !feito(v, 'diretoria')) out.push({ oque: 'diretoria', rotulo: comando.pressao >= 60 ? 'Sentar com a diretoria antes que a pressão vire demissão' : 'Alinhar com a diretoria o que se espera — e pedir reforço', porque: 'Uma conversa dura: pode tirar a pressão de cima, trazer um reforço — ou irritar quem decide.', peso: comando.pressao >= 60 ? 7 : 2 });
  return out;
}

export function disponibilidadeBanco(v: Vida, o: OqueBanco): Veredito {
  if (!naComissaoTecnica(v.trabalho.atual)) return bloqueio('impossivel', 'Isso é de quem trabalha numa comissão técnica.');
  if (o === 'licenca') {
    const pc = proximoCurso(v);
    if (licencaDe(v)?.emCurso) return bloqueio('incompativel', 'Um curso de cada vez: o de agora ainda não terminou.');
    if (!pc) return bloqueio('impossivel', 'Você já tem a licença mais alta.');
    if (pc.falta) return bloqueio('requisito', `A licença ${NIVEIS_DE_LICENCA[pc.nivel]} pede ${pc.falta}.`);
    return vereditoDePagar(v, pc.custo, 'O curso custa uns');
  }
  if (feito(v, o)) return bloqueio('incompativel', 'Isso já foi feito nesta temporada.');
  if (o === 'diretoria' && !noComandoDoTime(v)) return bloqueio('impossivel', 'Quem conversa com a diretoria é o técnico principal.');
  return PERMITIDO;
}

/** Faz: o resultado tem mérito (a leitura de jogo, a liderança, a licença) e sorte; a consequência vai para o banco. */
export function executarBanco(v: Vida, r: Rng, o: OqueBanco): string {
  const e = v.trabalho.atual!;
  const p = passagem(v);
  const comando = noComandoDoTime(v);
  const g = ge(v);
  const lider = (habilidade(v, 'lideranca') - 30) / 120 + v.personalidade.tracos.sociabilidade / 400;
  const leitura = (v.mente.cognicao - 50) / 120 + pesoDaLicenca(v) / 6;
  if (o === 'licenca') {
    const pc = proximoCurso(v)!;
    pagar(v, pc.custo);
    v.caminhos.licencaDeTreinador = { nivel: nivelDaLicenca(v), t: licencaDe(v)?.t ?? v.t, emCurso: { nivel: pc.nivel, ate: v.t + pc.meses } };
    escrever(v, { texto: `Começou o curso da licença ${NIVEIS_DE_LICENCA[pc.nivel]} de treinador.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
    return `Matrícula feita: ${pc.meses} meses de módulos, prova prática com uma equipe de verdade, ${pc.nivel >= 3 ? 'e um trabalho final sobre o modelo de jogo' : 'e muita prancheta'}.`;
  }
  v.fatos[chave(v, o)] = v.t;
  v.mente.estresse = clamp(v.mente.estresse + (o === 'diretoria' ? 4 : 3));
  if (o === 'analise') {
    const deu = r.chance(clamp(0.55 + leitura, 0.25, 0.9));
    if (comando && p) { if (deu) p.ajuste = clamp((p.ajuste ?? 0) + 0.8, -4, 4); }
    else e.desempenho = clamp(e.desempenho + (deu ? 5 : 1));
    if (deu && v.caminhos.tecnico) v.caminhos.tecnico.reputacao = clamp(v.caminhos.tecnico.reputacao + 1);
    return deu ? (comando ? 'Semanas de vídeo, um plano por adversário. O elenco comprou a ideia: a temporada começa com o time sabendo o que fazer.' : 'O relatório saiu redondo; o técnico usou metade dele na preleção e citou você.') : (comando ? 'O plano ficou bonito no papel — e confuso no campo. Vai precisar de ajuste.' : 'O relatório chegou atrasado. O técnico agradeceu sem ler.');
  }
  if (o === 'elenco') {
    const deu = r.chance(clamp(0.55 + lider, 0.25, 0.9));
    if (comando && p) p.vestiario = clamp(p.vestiario + (deu ? 8 : -3));
    else e.desempenho = clamp(e.desempenho + (deu ? 3 : 0));
    return deu ? `Uma conversa de verdade com os líderes${comando ? ' — e o grupo fechou com você' : ': os jogadores passaram a procurar você antes do técnico'}.` : `A conversa expôs mais do que uniu: ${comando ? 'dois titulares saíram contrariados' : 'o técnico achou que você passou do ponto'}.`;
  }
  // A diretoria: a pressão sobe ou desce; às vezes vem um reforço.
  const deu = r.chance(clamp(0.5 + lider + (p ? (55 - p.pressao) / 200 : 0), 0.2, 0.85));
  if (p) {
    p.pressao = clamp(p.pressao + (deu ? -10 : 6));
    if (deu && r.chance(0.5)) p.ajuste = clamp((p.ajuste ?? 0) + 0.5, -4, 4);
  }
  return deu ? `A diretoria ouviu. Saiu da sala com um prazo justo${p && (p.ajuste ?? 0) > 0 ? ' e a promessa de um reforço' : ''}.` : `A conversa azedou: o presidente lembrou quem paga o salário ${flex(g, 'do técnico', 'da técnica')}.`;
}

/** O nome de jogador abre o vestiário (o elenco respeita quem jogou) — não ganha jogo: a estrada no banco é outra coisa. */
export function vestiarioDeExAtleta(v: Vida): number {
  const es = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].filter(x => x && x.fase !== 'base' && (x.temporadas?.length ?? 0) > 0);
  const nome = Math.max(0, ...es.map(x => (x!.reputacao ?? 30) * (x!.nivel / 4)));
  return Math.round(clamp((nome - 20) / 6, 0, 8));
}

