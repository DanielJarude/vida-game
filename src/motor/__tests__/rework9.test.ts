/**
 * REWORK 9 — A vida organizada.
 *
 * Fase 0: as inconsistências críticas do playtest.
 *   FUT-01  o campeão da Série B que continuava na Série B (o teto pelo porte
 *           bloqueava o acesso; o clube não tinha divisão própria).
 *   SOC-01  40 mil → 537 mil seguidores sem publicar (a fama somava um número
 *           fixo por ano, sem limite e sem causa registrada).
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { avancarAno } from '../ano';
import { contaAtiva, fecharBalanco, fimDoBalanco } from '../sistemas/redesBase';
import { processarRedes, publicoDoNome } from '../sistemas/redes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { interpretar } from '../save';
import type { CarreiraEsportiva, Temporada, Vida } from '../tipos';
import { clubesDoPais, divisaoDoNivel } from '../dados/clubes';
import { registrarTemporada } from '../sistemas/palmares';
import { divisaoDoClube, fecharTemporadaDaLiga, ligaDe, regrasDeAcesso, temporadaCorrente, VAGAS_POR_DIVISAO } from '../sistemas/ligas';

function atletaNoRemo(nivel: 1 | 2 | 3 | 4 = 3): Vida {
  return transacao(adulto(24, { municipioId: 'belem-pa', semente: 9 }), x => {
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Remo', nivel, tInicio: x.t - 60, tFase: x.t - 48, lesoes: 0, municipioId: 'belem-pa', reputacao: 50, espaco: 'titular', contratoAte: x.t + 48, posicao: 'meia', temporadas: [] };
    x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Remo', contrato: 'clt', salario: 20000, tInicio: x.t - 48, desempenho: 70, municipioId: 'belem-pa', carga: 'integral' };
  }).vida;
}

const temporada = (v: Vida, e: CarreiraEsportiva, colocacao: number): Temporada => {
  const t: Temporada = { ano: temporadaCorrente(v), clube: e.clube, nivel: e.nivel, posicao: 'meia', partidas: 36, titular: 34, gols: 6, assistencias: 7, nota: 7.4, colocacao, mesesFora: 0 };
  (e.temporadas ??= []).push(t);
  return t;
};

describe('FUT-01 · acesso e rebaixamento no futebol', () => {
  it('o caso do playtest: campeão da Série B com o Remo, como titular → a próxima temporada é na Série A', () => {
    const v = atletaNoRemo(3);
    const n = transacao(v, (x, r) => {
      const e = x.caminhos.esporte!;
      registrarTemporada(x, r, e, temporada(x, e, 1));
    }).vida;
    const e = n.caminhos.esporte!;
    expect(e.nivel).toBe(4);
    expect(divisaoDoClube(n, 'Remo', 'BR')).toBe(4);
    const p = n.caminhos.palmares ?? [];
    expect(p.some(c => c.tipo === 'titulo' && c.competicao === 'Série B')).toBe(true);
    expect(p.some(c => c.tipo === 'acesso' && c.competicao === 'Série A')).toBe(true);
    // Salvar e carregar não desfaz o acesso.
    const lido = interpretar(JSON.stringify(n));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    expect(lido.vida.caminhos.esporte!.nivel).toBe(4);
    expect(lido.vida.caminhos.ligas!.BR.div.Remo).toBe(4);
    // A temporada seguinte é disputada (e registrada) na Série A — não outra vez na B.
    const depois = avancarAno(lido.vida).vida;
    const ts = depois.caminhos.esporte!.temporadas ?? [];
    const ultima = ts[ts.length - 1];
    if (ultima && ultima.clube === 'Remo') {
      expect(ultima.nivel).toBe(4);
      expect(divisaoDoNivel(ultima.nivel, 'BR')).toBe('Série A');
    }
  });

  it('dois títulos da mesma divisão em seguida, no mesmo clube, só se ele não subiu — o que não acontece com o campeão', () => {
    let v = atletaNoRemo(2);
    for (let k = 0; k < 2; k++) {
      v = transacao(v, (x, r) => { const e = x.caminhos.esporte!; registrarTemporada(x, r, e, temporada(x, e, 1)); x.t += 12; }).vida;
    }
    const titulos = (v.caminhos.palmares ?? []).filter(c => c.tipo === 'titulo').map(c => c.competicao);
    expect(titulos).toEqual([divisaoDoNivel(2, 'BR'), 'Série B']);
    expect(v.caminhos.esporte!.nivel).toBe(4);
  });

  it('rebaixamento também funciona — inclusive para um clube grande (sem piso artificial)', () => {
    const grande = clubesDoPais('BR').find(c => c.porte === 'grande')!;
    const v = transacao(atletaNoRemo(4), x => { const e = x.caminhos.esporte!; e.clube = grande.nome; e.municipioId = grande.cidade; }).vida;
    const n = transacao(v, (x, r) => { const e = x.caminhos.esporte!; registrarTemporada(x, r, e, temporada(x, e, 20)); }).vida;
    expect(n.caminhos.esporte!.nivel).toBe(3);
    expect(divisaoDoClube(n, grande.nome, 'BR')).toBe(3);
    expect((n.caminhos.palmares ?? []).some(c => c.tipo === 'rebaixamento' && c.competicao === 'Série A')).toBe(true);
  });

  it('o meio da tabela fica onde está; a regra é do país (o Brasil troca quatro)', () => {
    expect(regrasDeAcesso('BR').troca).toEqual([4, 4, 4]);
    for (const [col, esperado] of [[4, 4], [5, 3], [16, 3], [17, 2]] as const) {
      const n = transacao(atletaNoRemo(3), (x, r) => { const e = x.caminhos.esporte!; registrarTemporada(x, r, e, temporada(x, e, col)); }).vida;
      expect(n.caminhos.esporte!.nivel, `${col}º lugar na Série B`).toBe(esperado);
    }
  });

  it('liga fechada (MLS): o campeão não sobe e o último não cai', () => {
    expect(regrasDeAcesso('US').fechada).toBe(true);
    const v = adulto(25, { semente: 3 });
    const clube = clubesDoPais('US')[0];
    expect(fecharTemporadaDaLiga(v, 'US', temporadaCorrente(v), clube.nome, 3, 1)).toBe(0);
    expect(fecharTemporadaDaLiga(v, 'US', temporadaCorrente(v) + 1, clube.nome, 3, 20)).toBe(0);
    expect(divisaoDoClube(v, clube.nome, 'US')).toBe(3);
  });

  it('os clubes do mundo seguem as mesmas regras: 30 temporadas, vagas nunca estouram, um campeão por divisão, quem sobe aparece em cima', () => {
    const v = adulto(20, { semente: 5 });
    const liga = ligaDe(v, 'BR');
    let anterior = { ...liga.div };
    for (let k = 1; k <= 30; k++) {
      fecharTemporadaDaLiga(v, 'BR', liga.ano + 1, 'Remo', liga.div.Remo, 10);
      for (const n of [2, 3, 4]) expect(Object.values(liga.div).filter(d => d === n).length).toBeLessThanOrEqual(VAGAS_POR_DIVISAO);
      const u = liga.ultima!;
      for (const c of u.subiram) expect(liga.div[c]).toBe(anterior[c] + 1);
      for (const c of u.cairam) expect(liga.div[c]).toBe(anterior[c] - 1);
      // O campeão de cada divisão de 2 a 3 sobe (o Brasil troca quatro).
      for (const n of [2, 3] as const) if (u.campeoes[n]) expect(u.subiram).toContain(u.campeoes[n]);
      // Ninguém pula duas divisões.
      for (const c of Object.keys(liga.div)) expect(Math.abs(liga.div[c] - (anterior[c] ?? liga.div[c]))).toBeLessThanOrEqual(1);
      anterior = { ...liga.div };
    }
    // Em 30 anos, a tabela se mexe de verdade: algum tradicional chega à elite, algum grande cai.
    const portes = new Map(clubesDoPais('BR').map(c => [c.nome, c.porte]));
    expect(Object.entries(liga.div).some(([c, d]) => portes.get(c) === 'tradicional' && d === 4)).toBe(true);
    expect(Object.values(liga.div).filter(d => d === 4).length).toBeGreaterThan(10);
  });

  it('um save antigo (sem tabela): a tabela nasce concordando com o contrato de agora', () => {
    const v = atletaNoRemo(4);
    expect(v.caminhos.ligas).toBeUndefined();
    const n = transacao(v, x => divisaoDoClube(x, 'Remo', 'BR'));
    expect(n.valor).toBe(4);
  });

  it('carreira inteira: entre duas temporadas seguidas no mesmo clube, a divisão muda exatamente pelo acesso/rebaixamento registrado', () => {
    let v = atletaNoRemo(2);
    v = transacao(v, x => { x.caminhos.esporte!.contratoAte = x.t + 200; }).vida;
    for (let k = 0; k < 10; k++) v = avancarAno(v).vida;
    const e = v.caminhos.esporte!;
    const ts = e.temporadas ?? [];
    const palmares = v.caminhos.palmares ?? [];
    for (let i = 1; i < ts.length; i++) {
      const a = ts[i - 1], b = ts[i];
      if (a.clube !== b.clube || a.emprestado || b.emprestado) continue;
      const subiu = palmares.some(c => c.tipo === 'acesso' && c.ano === a.ano && c.clube === a.clube);
      const caiu = palmares.some(c => c.tipo === 'rebaixamento' && c.ano === a.ano && c.clube === a.clube);
      expect(b.nivel, `${a.ano}→${b.ano}`).toBe(a.nivel + (subiu ? 1 : caiu ? -1 : 0));
      if (a.colocacao <= 4 && a.nivel < 4) expect(subiu, `${a.ano}: ${a.colocacao}º`).toBe(true);
    }
  });
});

describe('SOC-01 · o público tem causa, e a conta fecha', () => {
  const rede = (oque: string, extra: Record<string, unknown> = {}) => ({ tipo: 'rede', op: { oque, plataforma: 'instagram', ...extra } }) as Parameters<typeof executar>[1];

  function famosa(fama: number, seguidores = 40000, semente = 11): Vida {
    let v = adulto(30, { semente });
    v = transacao(v, x => { x.financas.conta = 1e7; x.notoriedade = { valor: fama, pico: fama, t: x.t, fonte: 'arte', origens: { arte: fama } }; }).vida;
    v = executar(v, rede('criar')).vida;
    return transacao(v, x => {
      const c = contaAtiva(x, 'instagram')!;
      // Um público de partida conhecido (fecha o balanço da criação, para o teste partir de um número redondo).
      fecharBalanco(c, x.t, fama);
      c.seguidores = seguidores;
      c.balanco = { desde: x.t, inicio: seguidores, organico: 0, publicacoes: 0, exposicao: 0, comprados: 0, perdas: 0, famaInicio: fama };
    }).vida;
  }

  it('o caso do playtest: 40 mil, um ano sem publicar, nome estável — cresce pouco, e o balanço diz de onde veio', () => {
    const v = avancarAno(famosa(50)).vida;
    const c = contaAtiva(v, 'instagram')!;
    const b = c.anos![c.anos!.length - 1];
    expect(fimDoBalanco(b)).toBe(b.fim);
    expect(b.fim).toBe(c.seguidores);
    expect(b.publicacoes).toBe(0);
    // Sem publicar, a exposição só aproxima a conta do público que o nome atrai — 2% do que falta, não meio milhão.
    expect(b.exposicao).toBeLessThanOrEqual(Math.round((publicoDoNome('instagram', 50) - 40000) * 0.02 * 1.2) + 1);
    expect(c.seguidores).toBeLessThan(80000);
    expect(b.perdas).toBeGreaterThan(0);
  });

  it('crescimento extraordinário continua possível — quando o nome cresce de verdade, e o motivo fica registrado', () => {
    const v0 = famosa(45);
    const v = avancarAno(transacao(v0, x => { x.notoriedade = { valor: 80, pico: 80, t: x.t, fonte: 'arte', origens: { arte: 80 } }; x.caminhos.obras = []; }).vida).vida;
    const b = contaAtiva(v, 'instagram')!.anos!.slice(-1)[0];
    expect(fimDoBalanco(b)).toBe(b.fim);
    expect(b.exposicao).toBeGreaterThan(100000);
    expect((b.motivos ?? []).some(m => /o nome cresceu no ano/.test(m))).toBe(true);
    // Proporcional: nunca passa do público que o nome possível traz.
    expect(b.fim!).toBeLessThanOrEqual(publicoDoNome('instagram', Math.max(b.famaFim ?? 0, 80)) + 40000);
  });

  it('parada por 30 anos, a conta de quem é conhecido converge (não cresce para sempre)', () => {
    let v = famosa(70);
    const fins: number[] = [];
    for (let k = 0; k < 30; k++) {
      v = transacao(v, x => { x.notoriedade = { valor: 70, pico: 70, t: x.t, fonte: 'arte', origens: { arte: 70 } }; x.t += 12; processarRedes(x); }).vida;
      fins.push(contaAtiva(v, 'instagram')!.seguidores);
    }
    expect(fins[29]).toBeLessThanOrEqual(publicoDoNome('instagram', 70));
    // O último decênio cresce menos que o primeiro.
    expect(fins[29] - fins[19]).toBeLessThan(fins[9] - 40000);
  });

  it('o balanço fecha em toda situação: publicar, comprar, a rede que esquece, a compra descoberta', () => {
    let v = famosa(35, 2000, 21);
    for (let ano = 0; ano < 8; ano++) {
      v = executar(v, rede('publicar', { tema: 'cotidiano' })).vida;
      if (ano === 1) v = executar(v, rede('comprar', { pacote: 0 })).vida;
      v = transacao(v, x => { x.t += 12; processarRedes(x); }).vida;
      const c = contaAtiva(v, 'instagram')!;
      for (const b of c.anos!) expect(fimDoBalanco(b), JSON.stringify(b)).toBe(b.fim);
      expect(c.balanco!.inicio).toBe(c.seguidores);
    }
    const c = contaAtiva(v, 'instagram')!;
    const somaPub = c.anos!.reduce((a, b) => a + b.publicacoes, 0);
    expect(somaPub).toBeGreaterThan(0);
    expect(c.anos!.some(b => b.comprados > 0)).toBe(true);
  });

  it('salvar e carregar não reaplica ganhos: o mesmo número, o mesmo balanço, o mesmo ano seguinte', () => {
    const v = avancarAno(famosa(60)).vida;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    const c1 = contaAtiva(v, 'instagram')!, c2 = contaAtiva(lido.vida, 'instagram')!;
    expect(c2.seguidores).toBe(c1.seguidores);
    expect(c2.anos).toEqual(c1.anos);
    const a = avancarAno(v).vida, b = avancarAno(lido.vida).vida;
    expect(contaAtiva(b, 'instagram')!.seguidores).toBe(contaAtiva(a, 'instagram')!.seguidores);
  });

  it('conta nova: o primeiro público já tem causa (conhecidos e, para quem é conhecido, o nome)', () => {
    let v = adulto(30, { semente: 4 });
    v = transacao(v, x => { x.notoriedade = { valor: 60, pico: 60, t: x.t, fonte: 'esporte', origens: { esporte: 60 } }; }).vida;
    v = executar(v, rede('criar')).vida;
    const c = contaAtiva(v, 'instagram')!;
    expect(c.balanco!.inicio).toBe(0);
    expect(fimDoBalanco(c.balanco!)).toBe(c.seguidores);
    expect(c.balanco!.exposicao).toBeGreaterThan(0);
  });
});

/* ======================================================================= FASE B — a agenda em horários */

import { agendaDaSemana, alternativasDoConflito, impactoDoTrabalho, presencaNaAtividade, presencaNaEscola, processarAgenda } from '../sistemas/agenda';
import { analisarEntrada, planosDeConflito, propor, resolverPendente } from '../sistemas/compromissos';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { calcularDesempenho } from '../sistemas/escola';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { processarRotinas } from '../sistemas/rotinas';

/** Uma adolescente de 16, no ensino médio de manhã, com o futebol marcado (seg, qua, sex, 16h). */
function adolescenteComFutebol(): Vida {
  return transacao(adulto(16, { semente: 41 }), x => {
    x.trabalho.atual = undefined;
    x.educacao.basica = { etapa: 'medio', serie: 1, rede: 'publica', desempenho: 62, reprovacoes: 0 };
    x.educacao.evadiu = false;
    x.educacao.matricula = undefined;
    x.rotinas = [{ id: 'futebol', tInicio: x.t - 24, nivel: 2 }];
    x.agenda = { turnos: { escola: 'manha' }, lugares: { futebol: { dias: [0, 2, 4], inicio: 16 * 60 } } };
  }).vida;
}

describe('Fase B · a agenda da semana: horários reais, conflitos reais, consequências reais', () => {
  it('cada compromisso tem origem, dias e horas; a escola de manhã, o futebol às 16h, sem conflito', () => {
    const v = adolescenteComFutebol();
    const a = agendaDaSemana(v);
    const escola = a.blocos.find(b => b.id === 'escola')!;
    expect(escola).toMatchObject({ origem: 'escola', dias: [0, 1, 2, 3, 4], inicio: 420, fim: 720, obrigatorio: true, turno: 'manha' });
    const fut = a.blocos.find(b => b.ref === 'futebol')!;
    expect(fut).toMatchObject({ dias: [0, 2, 4], inicio: 960, movel: true, fixado: true });
    expect(a.conflitos).toEqual([]);
    expect(presencaNaAtividade(v, 'futebol')).toBe(1);
  });

  it('a proposta de trabalho das 13h às 17h bate com o futebol das 16h: a decisão diz antes, com saídas de verdade (remarcar, largar, manter) e recusar', () => {
    const v = adolescenteComFutebol();
    const imp = impactoDoTrabalho(v, { ocupacaoId: 'jovem_aprendiz', carga: 'parcial', turno: 'tarde' });
    expect(imp.novos.some(c => c.perde === 'futebol')).toBe(true);
    const conflitos = analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'jovem_aprendiz', via: 'oportunidade' });
    // A escola é de manhã: o meio período encaixa à tarde; o futebol marcado às 16h é que bate.
    const horario = conflitos.find(c => c.motivo.includes('Jogar bola'));
    expect(horario).toBeTruthy();
    const planos = planosDeConflito(v, { tipo: 'emprego', ocupacaoId: 'jovem_aprendiz', via: 'oportunidade' }, conflitos);
    expect(planos.some(p => p.recusa)).toBe(true);
    expect(planos.some(p => p.larga.includes('soltar:futebol') || p.larga.includes('rotina:futebol'))).toBe(true);
    // Aceitar remarcando: o futebol vai para um horário livre; nada mais bate.
    const n = transacao(v, (x, r) => {
      propor(x, r, { tipo: 'emprego', ocupacaoId: 'jovem_aprendiz', via: 'oportunidade' });
      const k = x.caminhos.pendente!.planos.findIndex(p => p.larga.includes('soltar:futebol'));
      resolverPendente(x, r, k >= 0 ? k : 0);
    }).vida;
    expect(n.trabalho.atual?.ocupacaoId).toBe('jovem_aprendiz');
    const a = agendaDaSemana(n);
    if (n.rotinas.some(r => r.id === 'futebol')) expect(a.conflitos.filter(c => c.perde === 'futebol')).toEqual([]);
  });

  it('trabalho integral em cima da escola: falta é cobrada no ano (presença < 1, nota menor), e a saída do turno da noite existe aos 16', () => {
    const v = adolescenteComFutebol();
    const conflitos = analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'atendente', via: 'oportunidade' });
    const c = conflitos.find(x => x.com === 'agenda');
    expect(c?.alternativas.some(a => a.larga === 'turno_escola:noite')).toBe(true);
    expect(c?.alternativas.some(a => a.conciliar)).toBe(true);
    const comTrabalho = transacao(v, (x, r) => { contratar(x, r, ocupacao('atendente')); }).vida;
    const p = presencaNaEscola(comTrabalho);
    expect(p).toBeLessThan(0.5);
    expect(calcularDesempenho(comTrabalho, criarRng(7), 0, undefined, p)).toBeLessThan(calcularDesempenho(comTrabalho, criarRng(7), 0, undefined, 1));
    // Passar a escola para a noite resolve.
    const noite = transacao(comTrabalho, x => { x.agenda!.turnos!.escola = 'noite'; }).vida;
    expect(presencaNaEscola(noite)).toBe(1);
  });

  it('trabalho e faculdade: o curso de meio período vai para a noite; trocar para a manhã é bloqueado e diz por quê', () => {
    const v = transacao(adulto(24, { semente: 8 }), (x, r) => {
      x.trabalho.atual = undefined; contratar(x, r, ocupacao('assistente_adm'));
      x.educacao.matricula = { cursoId: 'administracao', instituicao: 'Faculdade da Cidade', rede: 'privada', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 40, mensalidade: 800, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
    }).vida;
    const curso = agendaDaSemana(v).blocos.find(b => b.id === 'curso')!;
    expect(curso.turno).toBe('noite');
    expect(agendaDaSemana(v).conflitos).toEqual([]);
    const d = disponibilidade(v, { tipo: 'agenda', op: { oque: 'turno', fonte: 'curso', turno: 'manha' } });
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/mesmo horário/);
  });

  it('o conflito cobra o treino: as vezes perdidas não treinam (a mesma frente, menos ganho)', () => {
    const base = adolescenteComFutebol();
    const comConflito = transacao(base, (x, r) => { contratar(x, r, ocupacao('jovem_aprendiz')); x.agenda!.turnos!.trabalho = 'tarde'; }).vida;
    expect(presencaNaAtividade(comConflito, 'futebol')).toBeLessThan(1);
    const semConflito = transacao(comConflito, x => { delete x.agenda!.lugares!.futebol; }).vida;
    expect(presencaNaAtividade(semConflito, 'futebol')).toBe(1);
    const ganho = (v: Vida) => transacao(v, x => { const antes = x.caminhos.frentes.futebol?.habilidade ?? 0; processarRotinas(x, criarRng(5), agendaDaSemana(x).presenca); return (x.caminhos.frentes.futebol?.habilidade ?? 0) - antes; }).valor;
    expect(ganho(comConflito)).toBeLessThan(ganho(semConflito));
  });

  it('as alternativas de um conflito são testadas: cada uma, aplicada, tira o conflito (ou a atividade)', () => {
    const v = transacao(adolescenteComFutebol(), (x, r) => { contratar(x, r, ocupacao('jovem_aprendiz')); x.agenda!.turnos!.trabalho = 'tarde'; }).vida;
    const a = agendaDaSemana(v);
    const c = a.conflitos.find(x => x.perde === 'futebol')!;
    const alts = alternativasDoConflito(v, c, a);
    expect(alts.length).toBeGreaterThan(0);
    for (const alt of alts) {
      const r = executar(v, alt.acao as never);
      const depois = agendaDaSemana(r.vida);
      expect(depois.conflitos.some(x => x.id === c.id), alt.texto).toBe(false);
    }
  });

  it('a agenda guarda só escolhas, sobrevive ao save e se limpa sozinha (atividade largada leva o lugar junto)', () => {
    const v = adolescenteComFutebol();
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && lido.vida.agenda).toEqual(v.agenda);
    const sem = executar(v, { tipo: 'rotina', id: 'futebol', ativa: false }).vida;
    expect(sem.agenda?.lugares?.futebol).toBeUndefined();
    // Um save sem agenda abre com a semana derivada do estado (nada inventado: só o que existe).
    const antigo = transacao(v, x => { x.agenda = undefined; }).vida;
    const a = agendaDaSemana(antigo);
    expect(a.blocos.every(b => ['escola', 'rotina', 'trajeto'].includes(b.origem))).toBe(true);
  });

  it('o conflito novo vira nota na Linha da Vida uma vez (não todo ano)', () => {
    const v = transacao(adolescenteComFutebol(), (x, r) => { contratar(x, r, ocupacao('jovem_aprendiz')); x.agenda!.turnos!.trabalho = 'tarde'; }).vida;
    const n = transacao(v, x => { const k = x.biografia.length; processarAgenda(x); const um = x.biografia.length - k; processarAgenda(x); return [um, x.biografia.length - k]; });
    expect(n.valor).toEqual([1, 1]);
  });
});

/* ======================================================================= FASE B — PROG-01, EDU-01, NPC-01 */

import { evolucaoDaFrente, evolucaoDaNota, ANOS_DE_EVOLUCAO } from '../sistemas/progressao';
import { esperadoNaSerie } from '../sistemas/escola';
import { ocupacaoDeAdulto } from '../sistemas/filhos';
import { criarVida } from '../criacao';

describe('PROG-01 · a progressão tem causa registrada, e o número é o do motor', () => {
  it('um ano de futebol na semana: a frente andou, e a causa registrada é a atividade', () => {
    let v = adolescenteComFutebol();
    v = transacao(v, x => { x.agenda = undefined; }).vida;
    v = avancarAno(v).vida; v.momento = null;
    v = avancarAno(v).vida;
    const e = evolucaoDaFrente(v, 'futebol')!;
    expect(e.agora).toBe(Math.round(v.caminhos.frentes.futebol!.habilidade * 10) / 10);
    const ult = v.evolucao![v.evolucao!.length - 1];
    const causas = ult.causas?.futebol ?? [];
    expect(causas.some(([f, x]) => f === 'rotina:futebol' && x > 0)).toBe(true);
    // As matérias andam pela escola.
    expect((ult.causas?.exatas ?? []).some(([f]) => f === 'escola')).toBe(true);
    // A nota do ano é a do motor.
    expect(evolucaoDaNota(v, 'escola').agora).toBe(v.educacao.basica!.desempenho);
  });

  it('parar também é registrado: dois anos sem praticar, a causa é "sem prática" (negativa)', () => {
    let v = transacao(adolescenteComFutebol(), x => { x.caminhos.frentes.futebol = { interesse: 60, meses: 60, habilidade: 55, tInicio: x.t - 72, tUltimo: x.t - 30, retomadas: 0, auge: 55 }; x.rotinas = []; x.agenda = undefined; }).vida;
    v = avancarAno(v).vida; v.momento = null;
    const ult = v.evolucao![v.evolucao!.length - 1];
    expect((ult.causas?.futebol ?? []).some(([f, x]) => f === 'sem_pratica' && x < 0)).toBe(true);
  });

  it('a fotografia é pequena e limitada: oito anos, só o que mudou', () => {
    let v = adolescenteComFutebol();
    for (let k = 0; k < 12; k++) { v = avancarAno(v).vida; v.momento = null; }
    expect(v.evolucao!.length).toBe(ANOS_DE_EVOLUCAO);
    expect(JSON.stringify(v.evolucao).length).toBeLessThan(12000);
    expect(v.caminhos.praticaDoPeriodo).toBeUndefined();
  });
});

describe('EDU-01 · a curva do que se espera acompanha o aluno típico (sem empurrar todos para baixo)', () => {
  it('o esperado cresce como a mediana medida (8 → 17), não 5 pontos por ano', () => {
    expect(esperadoNaSerie(10)).toBeGreaterThan(17); expect(esperadoNaSerie(10)).toBeLessThan(20);
    expect(esperadoNaSerie(14)).toBeGreaterThan(32); expect(esperadoNaSerie(14)).toBeLessThan(37);
    expect(esperadoNaSerie(17)).toBeGreaterThan(43); expect(esperadoNaSerie(17)).toBeLessThan(47);
  });

  it('numa turma, há de tudo: com dificuldade, medianos, bons e excelentes — e a postura pesa sem decidir sozinha', () => {
    const notas: number[] = [];
    for (let k = 0; k < 14; k++) {
      let v = criarVida({ nome: 'A', sobrenome: 'B', genero: k % 2 ? 'feminino' : 'masculino', municipioId: ['recife-pe', 'sao-paulo-sp', 'belem-pa', 'curitiba-pr'][k % 4], semente: 9100 + k });
      for (let a = 0; a < 15; a++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; v.caminhos.processo = undefined; }
      if (v.educacao.basica && !v.educacao.evadiu) notas.push(v.educacao.basica.desempenho);
    }
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    expect(media).toBeGreaterThan(46);
    expect(media).toBeLessThan(66);
    expect(Math.max(...notas) - Math.min(...notas)).toBeGreaterThan(25);
  });
});

describe('NPC-01 · as profissões de quem entra na vida', () => {
  it('o mesmo adulto tem sempre o mesmo cargo; um grupo de adultos tem muitos cargos diferentes, de várias classes', () => {
    const v = adulto(30, { semente: 2 });
    const ids = new Map<string, number>();
    for (let k = 0; k < 60; k++) {
      const p = { ...Object.values(v.pessoas)[0], id: `p_teste_${k}`, municipioId: v.moradia.municipioId, vida: { aptidao: 0, escolaridade: 'medio' as const, experiencia: 0, trajetoria: [] } };
      const a = ocupacaoDeAdulto(p, k % 3 === 0 ? 'superior' : k % 3 === 1 ? 'medio' : 'fundamental', 32);
      const b = ocupacaoDeAdulto(p, k % 3 === 0 ? 'superior' : k % 3 === 1 ? 'medio' : 'fundamental', 32);
      expect(a?.id).toBe(b?.id);
      if (a) ids.set(a.id, (ids.get(a.id) ?? 0) + 1);
    }
    // Sem formação de uma área, o adulto não chega aos cargos que pedem diploma de área — o que sobra ainda é variado:
    // nenhum cargo passa de um quinto do grupo (antes, a conta do "salário mais perto" caía sempre nos mesmos).
    expect(ids.size).toBeGreaterThanOrEqual(14);
    expect(Math.max(...ids.values())).toBeLessThanOrEqual(12);
  });
});
