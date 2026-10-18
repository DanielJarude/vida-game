/**
 * REWORK 9.5 — A vida em objetos · Fase A: a rotina coerente e a dedicação escolar com contrapartidas.
 *
 * ROT-01  agenda, exigência e estresse: três leituras, uma conta cada, que não se contradizem.
 * ROT-02  o peso de uma atividade é o que ela EXIGE (duração × intensidade), não o fato de existir.
 * ROT-03  a dedicação aos estudos é tempo de verdade na semana — rende o que acha de horário.
 */

import { describe, expect, it } from 'vitest';
import { nova, viver, viverAte } from './ajuda';
import { adulto } from './cenarios';
import { avancarAno } from '../ano';
import { disponibilidade, executar } from '../acoes';
import { transacao } from '../nucleo';
import { interpretar } from '../save';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { cansacoNosEstudos, cargaDaAtividade, encaixe, semana } from '../sistemas/semana';
import { agendaDaSemana, alternativasDoConflito, horarioDaAtividade, previsaoDaPostura } from '../sistemas/agenda';
import { avaliarRotina } from '../sistemas/avaliacaoDaRotina';
import { alvoCabeca, fatoresCabeca } from '../sistemas/estado';
import { leituraDaSobrecarga, pesoDaSobrecargaNaSaude, processarSobrecarga } from '../sistemas/sobrecarga';
import { leituraDoEstresse } from '../sistemas/leituraDoEstresse';
import { calcularDesempenho } from '../sistemas/escola';
import { criarRng } from '../rng';
import { rotinaDoAno } from '../sistemas/fechamento';
import { estagioDaFrente, leituraDaFrente } from '../sistemas/frentes';
import type { Rotina, Vida } from '../tipos';

const rot = (id: string, nivel: 1 | 2 | 3, t: number): Rotina => ({ id, nivel, tInicio: t });

/** O caso do playtest: criança de 9, escola, futebol duas vezes por semana, leitura, xadrez. */
function criancaDoPlaytest(): Vida {
  return transacao(viverAte(nova({ semente: 77, genero: 'masculino' }), 9), x => {
    x.momento = null;
    x.mente.estresse = 11;
    x.rotinas = [rot('futebol', 2, x.t - 12), rot('leitura', 1, x.t - 12), rot('xadrez', 2, x.t - 12)];
  }).vida;
}

/** Adulta com emprego integral e faculdade à noite. */
function trabalhaEEstuda(): Vida {
  return transacao(adulto(24, { semente: 31 }), (x, r) => {
    x.educacao.basica = undefined;
    contratar(x, r, ocupacao('assistente_adm'));
    x.educacao.matricula = { cursoId: 'administracao', instituicao: 'Faculdade da Cidade', rede: 'privada', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 40, mensalidade: 800, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
    x.rotinas = [];
    x.momento = null;
  }).vida;
}

/** Cada dia, das 8h às 20h, tomado por atividades de duas horas marcadas (o que sobra de horário: nenhum). */
function tomarOsDias(x: Vida): void {
  const ids = ['videogame', 'igreja', 'voluntariado', 'ajudar_familia', 'cozinhar', 'consertar'];
  const todos = [0, 1, 2, 3, 4, 5, 6] as (0 | 1 | 2 | 3 | 4 | 5 | 6)[];
  x.rotinas = ids.map(id => rot(id, 1, x.t));
  x.agenda = { turnos: { escola: 'manha' }, lugares: Object.fromEntries(ids.map((id, k) => [id, { dias: todos, inicio: (8 + 2 * k) * 60 }])) };
}

describe('ROT-01 · a criança do playtest (escola, futebol 2×, leitura, xadrez)', () => {
  it('a rotina plausível não está no teto: ainda cabe outra atividade — e a agenda tem horário para ela', () => {
    const v = criancaDoPlaytest();
    const e = encaixe(v, 0);
    expect(e.faixa === 'folgada' || e.faixa === 'ocupada').toBe(true);
    // As leves (uma vez por semana) entram; um quarto esporte intenso, duas vezes por semana, pode ouvir "não" — mas
    // de DESCANSO, com a saída concreta (diminuir o que já existe), nunca "não cabe mais nada".
    for (const id of ['desenho', 'musica']) {
      const d = disponibilidade(v, { tipo: 'rotina', id, ativa: true, nivel: 1 });
      if (d.grau === 'impossivel' || d.grau === 'requisito') continue; // não existe aqui, ou a casa não paga: outro motivo, concreto
      expect(d.grau, `${id}: ${d.motivo}`).toBe('permitido');
    }
    const nat = disponibilidade(v, { tipo: 'rotina', id: 'natacao', ativa: true, nivel: 1 });
    if (nat.grau === 'incompativel') {
      expect(nat.motivo).toMatch(/Descanso insuficiente/);
      expect(nat.motivo).toMatch(/largar ou diminuir/);
      expect(nat.motivo).not.toMatch(/não cabe mais nada/);
    }
    const av = avaliarRotina(v);
    expect(av.horarios.conflitos).toBe(0);
    expect(av.horarios.livres).toBeGreaterThan(10);
  });

  it('a exigência de cada atividade é a do que ela pede — um livro por mês não cobra o que cobra um treino', () => {
    const leitura = cargaDaAtividade('leitura', 1);
    const futebol = cargaDaAtividade('futebol', 2);
    expect(leitura.carga).toBeLessThan(futebol.carga / 2);
    // a parte mental do treino é menor que a da apostila
    expect(cargaDaAtividade('futebol', 2).mental).toBeLessThan(cargaDaAtividade('estudar_concurso', 2).mental);
    const s = semana(criancaDoPlaytest());
    expect(s.ocupado).toBeCloseTo(s.rotinas.reduce((t, r) => t + r.peso, 0));
    expect(s.rotinas.find(r => r.id === 'leitura')!.tempo).toBe(0.5);
  });

  it('estresse baixo e semana ocupada: nenhuma leitura diz "sobrecarga forte" nem "não cabe mais nada"', () => {
    const v = criancaDoPlaytest();
    const l = leituraDoEstresse(v);
    expect(l.nivel).toBe('baixo');
    expect(l.frase).not.toMatch(/Sobra espaço/);
    expect(fatoresCabeca(v).some(f => f.id === 'semana')).toBe(false);
    expect(leituraDaSobrecarga(v).nivel).toBe(0);
    const av = avaliarRotina(v);
    expect(av.resumo).toMatch(/lidando bem|leve/);
    expect(av.resumo).not.toMatch(/não cabe|passou do que se aguenta/);
  });

  it('quando não há horário, o "não" diz que é de horário — e com o que ocupa os dias', () => {
    const v = transacao(criancaDoPlaytest(), x => {
      tomarOsDias(x);
    }).vida;
    const h = horarioDaAtividade(v, 'futebol', 2)!;
    expect(h.cabem).toBe(0);
    const d = disponibilidade(v, { tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 });
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/Horário incompatível/);
    expect(d.motivo).toMatch(/19h30/);
    expect(d.motivo).toMatch(/ocupam os dias/);
  });

  it('a criança que passa do que aguenta ouve o porquê de descanso (não de horário) e o que sair', () => {
    const v = transacao(criancaDoPlaytest(), x => { x.rotinas.push(rot('musica', 2, x.t), rot('natacao', 2, x.t), rot('danca', 2, x.t)); }).vida;
    const e = encaixe(v, cargaDaAtividade('lutas', 2).carga);
    expect(e.possivel).toBe(false);
    expect(e.motivo).toMatch(/Descanso insuficiente/);
    expect(e.motivo).toMatch(/largar ou diminuir|mais de uma coisa/);
  });
});

describe('ROT-01 · rotinas de outras idades', () => {
  it('adolescente conciliando escola, esporte e curso: cabe, e a agenda põe cada coisa num horário', () => {
    const v = transacao(viverAte(nova({ semente: 52 }), 15), x => { x.momento = null; x.rotinas = [rot('volei', 2, x.t), rot('ingles', 2, x.t)]; }).vida;
    expect(encaixe(v, 0).possivel).toBe(true);
    const a = agendaDaSemana(v);
    expect(a.conflitos.filter(c => c.perda > 0)).toHaveLength(0);
    const d = disponibilidade(v, { tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 });
    expect(d.grau).toBe('permitido');
  });

  it('adulta trabalhando e estudando: a faculdade vai para a noite, e uma atividade ainda acha o fim de semana', () => {
    const v = trabalhaEEstuda();
    const a = agendaDaSemana(v);
    expect(a.blocos.find(b => b.id === 'curso')!.turno).toBe('noite');
    const h = horarioDaAtividade(v, 'futebol', 2)!;
    expect(h.cabem).toBe(h.vezes);
    const d = disponibilidade(v, { tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 });
    expect(d.grau).toBe('permitido');
    // e a leitura diz que a rotina é exigente — com o motivo de exigência, não de horário
    expect(['ocupada', 'cheia', 'sobrecarregada']).toContain(encaixe(v, cargaDaAtividade('futebol', 2).carga).faixa);
  });

  it('conflito de horário real: a escola muda de turno por cima de uma atividade marcada — o conflito aparece, com saídas que resolvem', () => {
    const v0 = transacao(viverAte(nova({ semente: 52 }), 13), x => {
      x.momento = null;
      x.rotinas = [rot('desenho', 1, x.t)];
      x.agenda = { turnos: { escola: 'manha' }, lugares: { desenho: { dias: [2], inicio: 14 * 60 } } };
    }).vida;
    expect(agendaDaSemana(v0).conflitos).toHaveLength(0);
    const v = executar(v0, { tipo: 'agenda', op: { oque: 'turno', fonte: 'escola', turno: 'tarde' } }).vida;
    const a = agendaDaSemana(v);
    const c = a.conflitos.find(x => x.perde === 'desenho')!;
    expect(c).toBeTruthy();
    const alts = alternativasDoConflito(v, c, a);
    expect(alts.length).toBeGreaterThan(0);
    for (const alt of alts) {
      const depois = executar(v, alt.acao as never).vida;
      expect(agendaDaSemana(depois).conflitos.some(x => x.id === c.id), alt.texto).toBe(false);
    }
  });
});

describe('ROT-01 · ocupação, exigência e cabeça são três coisas', () => {
  it('rotina cheia, mas emocionalmente saudável: movimentada, cabeça tranquila', () => {
    const v = transacao(trabalhaEEstuda(), x => { x.rotinas = [rot('academia', 1, x.t)]; x.mente.estresse = 18; }).vida;
    const av = avaliarRotina(v);
    expect(av.exigencia.peso).not.toBe('leve');
    if (leituraDoEstresse(v).nivel === 'baixo' && leituraDoEstresse(v).tendencia !== 'subindo') expect(av.resumo).toMatch(/lidando bem|cabeça segura/);
    expect(av.cabeca.texto).not.toMatch(/descansar/);
  });

  it('rotina pouco ocupada, mas com estresse alto: a leitura diz que o peso vem de outro lugar', () => {
    const v = transacao(adulto(30, { semente: 8 }), x => {
      x.rotinas = []; x.trabalho.atual = undefined; x.mente.estresse = 72;
      x.financas.conta = -30000; x.financas.negativado = true;
    }).vida;
    const av = avaliarRotina(v);
    expect(av.exigencia.peso).toBe('leve');
    expect(['alto', 'no limite']).toContain(av.cabeca.nivel);
    expect(av.resumo).toMatch(/vem de outro lugar/);
    expect(av.horarios.livres).toBeGreaterThan(40);
  });

  it('a atividade prazerosa alivia a cabeça sem apagar o esforço: a exigência sobe, o alvo do estresse desce', () => {
    const v = trabalhaEEstuda();
    const com = transacao(v, x => { x.rotinas = [rot('futebol', 2, x.t)]; }).vida;
    expect(semana(com).ocupado).toBeGreaterThan(semana(v).ocupado);
    expect(alvoCabeca(com)).toBeLessThan(alvoCabeca(v));
  });

  it('o excesso de um treino de que se gosta pesa menos na cabeça do que o de uma apostila (o cansaço é o mesmo)', () => {
    const base = transacao(trabalhaEEstuda(), x => { x.rotinas = [rot('academia', 1, x.t), rot('corrida', 1, x.t), rot('natacao', 2, x.t), rot('futebol', 2, x.t)]; }).vida;
    const gosta = transacao(base, x => { for (const d of ['natacao', 'futebol'] as const) { const f = x.caminhos.frentes[d] ?? { habilidade: 30, interesse: 80, meses: 24, tInicio: x.t - 24, tUltimo: x.t, auge: 30, retomadas: 0 }; f.interesse = 80; x.caminhos.frentes[d] = f as never; } }).vida;
    const fb = fatoresCabeca(base).find(f => f.id === 'semana')?.efeito ?? 0;
    const fg = fatoresCabeca(gosta).find(f => f.id === 'semana')?.efeito ?? 0;
    expect(fg).toBeLessThanOrEqual(fb);
    expect(semana(gosta).ocupado).toBeCloseTo(semana(base).ocupado);
  });

  it('sobrecarga persistente cobra aos poucos: primeiro o nível, depois os anos, e só então a saúde', () => {
    let v = transacao(trabalhaEEstuda(), x => { x.rotinas = [rot('academia', 1, x.t), rot('futebol', 2, x.t), rot('ingles', 2, x.t), rot('musica', 2, x.t), rot('bico', 1, x.t)]; }).vida;
    expect(leituraDaSobrecarga(v).nivel).toBeGreaterThanOrEqual(2);
    expect(pesoDaSobrecargaNaSaude(v)).toBeUndefined();
    const efeitos: number[] = [];
    for (let k = 0; k < 4; k++) { v = transacao(v, x => { processarSobrecarga(x); x.t += 12; }).vida; efeitos.push(pesoDaSobrecargaNaSaude(v)?.efeito ?? 0); }
    expect(efeitos[0]).toBe(0);
    expect(efeitos[3]).toBeLessThan(efeitos[1]);
    // e não vira muro: uma coisa leve ainda é permitida, com o preço dito
    const d = disponibilidade(v, { tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 });
    expect(['permitido', 'incompativel']).toContain(d.grau);
    if (d.grau === 'permitido') expect(d.motivo).toBeTruthy();
  });

  it('a rotina muda com a vida: perder o emprego tira o expediente da agenda e alivia a exigência', () => {
    const v = transacao(trabalhaEEstuda(), x => { x.rotinas = [rot('academia', 1, x.t)]; }).vida;
    const sem = transacao(v, x => { x.trabalho.atual = undefined; }).vida;
    expect(agendaDaSemana(sem).blocos.some(b => b.origem === 'trabalho')).toBe(false);
    expect(semana(sem).capacidade).toBeGreaterThan(semana(v).capacidade);
    expect(avaliarRotina(sem).horarios.livres).toBeGreaterThan(avaliarRotina(v).horarios.livres);
  });

  it('salvar e abrir não duplica nem perde compromissos: a mesma agenda, a mesma leitura', () => {
    const v = transacao(criancaDoPlaytest(), x => { x.educacao.postura = 'dedicada'; x.agenda = { ...(x.agenda ?? {}), lugares: { xadrez: { dias: [1, 3], inicio: 15 * 60 } } }; }).vida;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    const a = agendaDaSemana(v), b = agendaDaSemana(lido.vida);
    expect(b.blocos.map(x => `${x.id}${x.dias}${x.inicio}`)).toEqual(a.blocos.map(x => `${x.id}${x.dias}${x.inicio}`));
    expect(avaliarRotina(lido.vida).resumo).toBe(avaliarRotina(v).resumo);
    const depois = avancarAno(lido.vida).vida;
    expect(new Set(depois.rotinas.map(r => r.id)).size).toBe(depois.rotinas.length);
  });
});

describe('ROT-03 · a dedicação aos estudos é tempo de verdade', () => {
  it('com dedicação, o estudo em casa entra na semana e na agenda (quatro vezes); empurrando, devolve tempo', () => {
    const v = criancaDoPlaytest();
    const ded = transacao(v, x => { x.educacao.postura = 'dedicada'; }).vida;
    const rel = transacao(v, x => { x.educacao.postura = 'relaxada'; }).vida;
    expect(semana(ded).fixos.some(f => f.id === 'estudo_casa')).toBe(true);
    const blocos = agendaDaSemana(ded).blocos.filter(b => b.ref === 'estudo_casa');
    expect(blocos.reduce((s, b) => s + b.dias.length, 0)).toBe(4);
    expect(semana(rel).capacidade).toBeGreaterThan(semana(v).capacidade);
    expect(semana(ded).capacidade).toBeLessThan(semana(v).capacidade);
    expect(previsaoDaPostura(v, 'dedicada').horas).toBeGreaterThan(0);
    expect(previsaoDaPostura(v, 'relaxada').horas).toBeLessThan(0);
  });

  it('a rotina equilibrada comporta a dedicação sem penalidade obrigatória (nem estresse automático)', () => {
    const v = transacao(criancaDoPlaytest(), x => { x.rotinas = [rot('leitura', 1, x.t)]; x.educacao.postura = 'dedicada'; }).vida;
    expect(['folgada', 'ocupada']).toContain(encaixe(v, 0).faixa);
    expect(cansacoNosEstudos(v)).toBe(0);
    expect(fatoresCabeca(v).some(f => f.id === 'semana' || f.id === 'semana_fixa')).toBe(false);
    expect(disponibilidade(v, { tipo: 'postura', valor: 'normal' }).grau).toBe('permitido');
  });

  it('a dedicação rende o que acha de horário: sem horário, não rende', () => {
    const r1 = criarRng(5), r2 = criarRng(5);
    const v = transacao(criancaDoPlaytest(), x => { x.educacao.postura = 'dedicada'; }).vida;
    const cheia = calcularDesempenho(v, r1, 0, undefined, 1, 1);
    const vazia = calcularDesempenho(v, r2, 0, undefined, 1, 0);
    expect(cheia).toBeGreaterThan(vazia);
  });

  it('com a semana sem horário para estudar, a dedicação não é oferecida como se coubesse (o porquê é de horário)', () => {
    const v = transacao(criancaDoPlaytest(), x => {
      tomarOsDias(x);
    }).vida;
    const d = disponibilidade(v, { tipo: 'postura', valor: 'dedicada' });
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/Horário incompatível/);
  });

  it('nenhuma opção ganha sempre: empurrando, sobra fôlego para o que a dedicação não deixaria entrar', () => {
    const v = transacao(criancaDoPlaytest(), x => { x.rotinas.push(rot('musica', 2, x.t)); }).vida;
    const ded = transacao(v, x => { x.educacao.postura = 'dedicada'; }).vida;
    const rel = transacao(v, x => { x.educacao.postura = 'relaxada'; }).vida;
    const extra = cargaDaAtividade('desenho', 1).carga;
    expect(encaixe(rel, extra).folga).toBeGreaterThan(encaixe(ded, extra).folga + 0.5);
    // e a dedicada rende mais na escola, na mesma semente
    expect(calcularDesempenho(ded, criarRng(9), 0)).toBeGreaterThan(calcularDesempenho(rel, criarRng(9), 0));
  });

  it('o ano registra o que de fato foi (a dedicação e quanto do estudo aconteceu) — e o fim do ano conta quando importa', () => {
    const v = transacao(criancaDoPlaytest(), x => { x.educacao.postura = 'dedicada'; }).vida;
    const depois = viver(v, 1);
    const foto = depois.evolucao![depois.evolucao!.length - 1];
    expect(foto.rotina?.postura).toBe('dedicada');
    expect(foto.rotina?.estudo).toBeGreaterThan(0);
    const lido = interpretar(JSON.stringify(depois));
    expect(lido.tipo === 'ok' && lido.vida.evolucao![lido.vida.evolucao!.length - 1].rotina?.postura).toBe('dedicada');
    // sem nada a dizer, o fim do ano não inventa caixa da rotina
    const r = rotinaDoAno(depois);
    if (r) expect(r.linhas.length).toBeGreaterThan(0);
  });
});

describe('EDU-02 · nota, domínio e descrição falam a mesma língua', () => {
  /** O caso do playtest: Português de 3,2 para 8,6 aos 8 anos. */
  const comPortugues = (h: number, anos = 8) => transacao(viverAte(nova({ semente: 77 }), anos), x => {
    const f = x.caminhos.frentes.linguagens ?? { habilidade: h, interesse: 40, meses: 24, tInicio: x.t - 24, tUltimo: x.t, auge: h, retomadas: 0 };
    f.habilidade = h; f.auge = Math.max(f.auge, h);
    x.caminhos.frentes.linguagens = f as never;
  }).vida;

  it('3,2 → 8,6 aos 8 anos: a frase sai de "tropeça na redação" (a régua é a da série, não a de um adulto)', () => {
    const antes = estagioDaFrente(comPortugues(3.2), 'linguagens');
    const depois = estagioDaFrente(comPortugues(8.6), 'linguagens');
    expect(antes.regua).toBe('serie');
    expect(antes.palavra).toBe('tropeça na redação');
    expect(depois.palavra).not.toBe('tropeça na redação');
    expect(depois.estagio).toBeGreaterThan(antes.estagio);
    expect(leituraDaFrente(comPortugues(8.6), 'linguagens')).not.toMatch(/tropeça/);
  });

  it('fora da escola, a régua volta a ser a absoluta (o adulto não é comparado com a 3ª série)', () => {
    const v = transacao(adulto(30, { semente: 4 }), x => { x.caminhos.frentes.linguagens = { habilidade: 8.6, interesse: 40, meses: 24, tInicio: x.t - 24, tUltimo: x.t, auge: 8.6, retomadas: 0 } as never; }).vida;
    const r = estagioDaFrente(v, 'linguagens');
    expect(r.regua).toBe('absoluta');
    expect(r.palavra).toBe('tropeça na redação');
  });

  it('quem domina como adulto é dito assim em qualquer idade, e salvar/abrir não muda a frase', () => {
    expect(estagioDaFrente(comPortugues(82, 15), 'linguagens').estagio).toBe(5);
    const v = comPortugues(8.6);
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && estagioDaFrente(lido.vida, 'linguagens').palavra).toBe(estagioDaFrente(v, 'linguagens').palavra);
  });
});
