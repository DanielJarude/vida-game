/**
 * REWORK 10.6 — Uma vida ao seu alcance (o motor).
 *
 * Cada bloco reproduz um problema do playtest (o ID no título) e prova a correção no estado guardado — não só na tela.
 * Os cenários dizem a pré-condição explicitamente (a vida sorteada pela semente não decide o que se testa).
 */

import { describe, expect, it } from 'vitest';
import { adulto, comParente } from './cenarios';
import { nova, viverAte } from './ajuda';
import { disponibilidade, executar } from '../acoes';
import { transacao, idade } from '../nucleo';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { criarRng } from '../rng';
import { contratar, unificarCarreiraArtistica } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { podeConciliar } from '../sistemas/paralelas';
import { agendaDaSemana, processarAgenda, reconciliarObrigacoes } from '../sistemas/agenda';
import { analisarEntrada } from '../sistemas/compromissos';
import { verbosDoOficio, executarOficio } from '../sistemas/noOficio';
import { fecharTemporada } from '../sistemas/esporte';
import { CATALOGO } from '../conteudo/catalogo';
import { contexto } from '../conteudo/base';
import { carreiraNoFimDoMedio } from '../conteudo/sistemicos';
import { evoluirCondicoes, pararTratamento, riscoDeParar } from '../sistemas/saude';
import { interacoesPara, ctxPessoa } from '../sistemas/interacoes';
import { responsaveis } from '../sistemas/origem';
import { situacaoDaCompra } from '../sistemas/pedidosDaCrianca';
import { opcoesDeCurso } from '../sistemas/escola';
import { processarOportunidades, novaOportunidade } from '../sistemas/oportunidades';
import { oportunidadesAbertas } from '../sistemas/mercados';
import { processarDistantes } from '../sistemas/indiretos';
import { criarPessoa } from '../pessoas';
import { podeTentar } from '../plausibilidade';

const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const recarregar = (v: Vida): Vida => { const l = interpretar(JSON.stringify(v)); if (l.tipo !== 'ok') throw new Error('save não abriu'); return l.vida; };

/** Uma vida no ensino médio (a idade dita), na escola de manhã, sem trabalho. */
function noMedio(anos: number, semente = 21): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, municipioId: 'recife-pe' }), anos);
  while (v.morte || !v.educacao.basica || v.educacao.basica.etapa !== 'medio') v = viverAte(nova({ semente: ++s, municipioId: 'recife-pe' }), anos);
  return em(v, x => { x.momento = null; x.caminhos.pendente = undefined; x.trabalho.atual = undefined; x.agenda = { turnos: { escola: 'manha' } }; });
}

/** Um atleta profissional de futebol, na posição dita. */
function atleta(posicao: 'goleiro' | 'atacante' | 'meia', anos = 22): Vida {
  return em(adulto(anos, { semente: 31 }), x => {
    contratar(x, criarRng(1), ocupacao('jogador_futebol'));
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Clube', nivel: 3, tInicio: x.t - 60, tFase: x.t - 24, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 40, posicao, espaco: 'titular' };
  });
}

describe('AGE-01 · escola e trabalho não ficam no mesmo horário', () => {
  it('o aprendiz que bate com a aula não ganha mais "dar conta dos dois": só turnos que resolvem (ou nenhum, e não entra)', () => {
    const v = noMedio(15);
    const c = analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'jovem_aprendiz', via: 'oportunidade' }).find(x => x.com === 'agenda');
    // De manhã a escola, o aprendiz pode ir para a tarde: a saída existe, e nenhuma é "conciliar".
    if (c) {
      expect(c.alternativas.some(a => a.conciliar)).toBe(false);
      expect(c.alternativas.some(a => a.larga === 'escola')).toBe(false); // o aprendiz só existe estudando
    }
  });

  it('sem turno que resolva, o motor impede antes de confirmar (a candidatura diz por quê)', () => {
    // Médio integrado ao técnico (o dia inteiro na escola, sem outro turno): o meio período de um menor não tem horário.
    const v = em(noMedio(15), x => { x.agenda = undefined; x.educacao.basica!.integrado = 'tec_informatica'; });
    const c = analisarEntrada(v, { tipo: 'emprego', ocupacaoId: 'jovem_aprendiz', via: 'oportunidade' }).find(x => x.com === 'agenda');
    expect(c?.impede).toBe(true);
    const d = disponibilidade(v, { tipo: 'candidatar', ocupacaoId: 'jovem_aprendiz' });
    if (d.grau !== 'ilegal' && d.grau !== 'requisito') expect(podeTentar(d)).toBe(false);
  });

  it('save antigo com escola 7h–12h e trabalho 8h–12h: a reconciliação muda o turno, diz na Linha da Vida e não perde o contrato', () => {
    let v = noMedio(16);
    v = em(v, x => { contratar(x, criarRng(2), ocupacao('jovem_aprendiz')); x.agenda = { turnos: { escola: 'manha', trabalho: 'manha' } }; });
    const antes = agendaDaSemana(v).conflitos.filter(c => c.perde === 'escola' && (c.ocupa ?? '').startsWith('trabalho'));
    expect(antes.length).toBeGreaterThan(0);
    v = em(v, x => { processarAgenda(x); });
    const depois = agendaDaSemana(v).conflitos.filter(c => c.perde === 'escola' && (c.ocupa ?? '').startsWith('trabalho'));
    expect(depois.length).toBe(0);
    expect(v.trabalho.atual?.ocupacaoId).toBe('jovem_aprendiz');
    expect(v.biografia.some(b => /batiam no mesmo horário/.test(b.texto))).toBe(true);
    // Sem conflito, a reconciliação não mexe em nada.
    expect(reconciliarObrigacoes(v)).toBeUndefined();
  });
});

describe('CAR-15 · uma carreira de ator, não duas', () => {
  const duplicado = () => em(adulto(30, { semente: 41 }), x => {
    contratar(x, criarRng(3), ocupacao('ator'));
    const p = { ...x.trabalho.atual!, ocupacaoId: 'ator_reconhecido', carga: 'parcial' as const, salario: 6000, tInicio: x.t - 48 };
    x.trabalho.paralela = p;
  });

  it('o save com "Ator" principal e "Ator conhecido" paralelo abre com uma carreira só: o degrau mais alto, desde o início mais antigo', () => {
    const v = recarregar(duplicado());
    expect(v.trabalho.paralela).toBeUndefined();
    expect(v.trabalho.atual?.ocupacaoId).toBe('ator_reconhecido');
    expect(v.trabalho.atual!.tInicio).toBeLessThanOrEqual(v.t - 48);
    // O outro degrau fica no currículo (nada some) — e não rende mais em dobro.
    expect(v.trabalho.historico.some(h => h.ocupacaoId === 'ator' && h.motivo === 'a mesma carreira, unificada')).toBe(true);
  });

  it('a mesma carreira artística não entra como paralela; e o degrau novo contratado funde com a paralela', () => {
    const v = em(adulto(30, { semente: 41 }), x => { contratar(x, criarRng(3), ocupacao('ator')); });
    expect(podeConciliar(v, ocupacao('ator_reconhecido'))).toBe(false);
    const w = em(adulto(30, { semente: 41 }), x => {
      contratar(x, criarRng(3), ocupacao('garcom'));
      x.trabalho.paralela = { ...x.trabalho.atual!, ocupacaoId: 'ator', carga: 'parcial' };
      contratar(x, criarRng(4), ocupacao('ator_reconhecido'));
    });
    expect(w.trabalho.paralela).toBeUndefined();
    expect(w.trabalho.atual?.ocupacaoId).toBe('ator_reconhecido');
    expect(unificarCarreiraArtistica(w)).toBe(false);
  });
});

describe('FUT-05 · o treino do goleiro é de goleiro, e aparece na temporada', () => {
  it('o goleiro profissional não recebe "finalização"; o atacante, sim', () => {
    const g = verbosDoOficio(atleta('goleiro')).find(x => x.oque === 'treino_finalizacao')!;
    expect(g.rotulo).toMatch(/goleiro/i);
    expect(g.rotulo).not.toMatch(/finaliza/i);
    expect(verbosDoOficio(atleta('atacante')).find(x => x.oque === 'treino_finalizacao')!.rotulo).toMatch(/finaliza/i);
    expect(verbosDoOficio(atleta('meia')).find(x => x.oque === 'treino_finalizacao')!.rotulo).toMatch(/passe/i);
  });

  it('o treino técnico do ano pesa na nota e nas defesas da temporada (mesmo dia, mesma sorte)', () => {
    const base = atleta('goleiro');
    const treinou = em(base, x => { executarOficio(x, criarRng(5), 'treino_finalizacao'); x.caminhos.frentes = base.caminhos.frentes; });
    const t0 = em(base, x => { fecharTemporada(x, criarRng(9), x.caminhos.esporte!); }).caminhos.esporte!.temporadas!.slice(-1)[0];
    const t1 = em(treinou, x => { fecharTemporada(x, criarRng(9), x.caminhos.esporte!); }).caminhos.esporte!.temporadas!.slice(-1)[0];
    expect(t1.nota).toBeGreaterThanOrEqual(t0.nota);
    expect(t1.defesa ?? 0).toBeGreaterThanOrEqual(t0.defesa ?? 0);
    expect(t1.gols).toBe(0);
  });
});

describe('EVT-09 · o fim do médio reconhece a carreira', () => {
  const evento = (id: string) => CATALOGO.find(c => c.id === id)!;
  it('o jogador profissional que conclui o médio recebe o evento de quem tem carreira — sem "Arrumar um emprego"', () => {
    const v = em(atleta('atacante', 18), x => { x.fatos['concluiu_medio'] = x.t; });
    expect(carreiraNoFimDoMedio(v)?.agora).toMatch(/atleta profissional/);
    const ctx = contexto(v, criarRng(1));
    expect(evento('esc_fim_do_medio').quando!(ctx)).toBe(false);
    expect(evento('esc_fim_do_medio_carreira').quando!(ctx)).toBe(true);
    const d = evento('esc_fim_do_medio_carreira');
    const textos = d.tipo === 'decisao' ? d.opcoes.map(o => (typeof o.texto === 'function' ? o.texto(ctx) : o.texto)) : [];
    expect(textos.join(' | ')).toMatch(/Priorizar a carreira no esporte/);
    expect(textos.join(' | ')).not.toMatch(/Arrumar um emprego/);
    // Mudar de rumo continua possível.
    expect(textos.join(' | ')).toMatch(/outro trabalho/);
  });

  it('quem não tem carreira continua recebendo a pergunta de sempre (faculdade, emprego, técnico)', () => {
    const v = em(noMedio(17), x => { x.fatos['concluiu_medio'] = x.t; x.trabalho.atual = undefined; x.caminhos.esporte = undefined; });
    const ctx = contexto(v, criarRng(1));
    expect(evento('esc_fim_do_medio').quando!(ctx)).toBe(true);
    expect(evento('esc_fim_do_medio_carreira').quando!(ctx)).toBe(false);
  });
});

describe('P4 · parar o tratamento tem risco dito antes e consequência conforme a condição', () => {
  const comPressao = () => em(adulto(50, { semente: 51 }), x => {
    x.corpo.condicoes = [{ id: 'hipertensao', nome: 'hipertensão', tInicio: x.t - 60, cronica: true, gravidade: 3, tratando: true, diagnosticada: true, tDiagnostico: x.t - 60, tTratamento: x.t - 36 }];
  });

  it('o risco é dito antes; parar registra quando e depois de quanto tempo; a criança não decide', () => {
    const v = comPressao();
    expect(riscoDeParar(v, v.corpo.condicoes[0])).toMatch(/pressão/);
    const w = em(v, x => { pararTratamento(x, 'hipertensao'); });
    const c = w.corpo.condicoes[0];
    expect(c.tratando).toBe(false);
    expect(c.abandono?.meses).toBe(36);
    expect(c.abandono?.vezes).toBe(1);
    const crianca = em(viverAte(nova({ semente: 3 }), 12), x => { x.corpo.condicoes = [{ id: 'diabetes', nome: 'diabetes', tInicio: x.t - 12, cronica: true, gravidade: 2, tratando: true, diagnosticada: true }]; });
    expect(disponibilidade(crianca, { tipo: 'parar_tratamento', condicaoId: 'diabetes' }).grau).toBe('ilegal');
  });

  it('com os anos sem tratamento, o corpo cobra (dito como consequência); retomado, para de cobrar', () => {
    let v = em(comPressao(), x => { pararTratamento(x, 'hipertensao'); });
    const saude0 = v.corpo.saude;
    for (let k = 0; k < 20; k++) v = em(v, x => { x.t += 12; evoluirCondicoes(x, criarRng(k)); });
    expect(v.biografia.some(b => /pressão subiu de novo/.test(b.texto) && /tratamento estava parado/.test(b.texto))).toBe(true);
    expect(v.corpo.saude).toBeLessThan(saude0);
    const retomado = em(v, x => { x.corpo.condicoes[0].tratando = true; });
    const n = retomado.biografia.length;
    let r2 = retomado;
    for (let k = 0; k < 4; k++) r2 = em(r2, x => { x.t += 12; evoluirCondicoes(x, criarRng(20 + k)); });
    expect(r2.biografia.slice(n).some(b => /tratamento estava parado/.test(b.texto))).toBe(false);
  });
});

describe('INF-01/02 · a criança pede aos responsáveis', () => {
  const crianca = (): Vida => {
    let s = 61;
    let v = viverAte(nova({ semente: s, municipioId: 'recife-pe' }), 10);
    while (v.morte || !responsaveis(v).length) v = viverAte(nova({ semente: ++s, municipioId: 'recife-pe' }), 10);
    return em(v, x => { x.momento = null; x.financas.conta = 193; for (const r of responsaveis(x)) { r.vin.proximidade = 90; r.vin.tensao = 0; r.p.renda = 40000; } });
  };

  it('o estádio vira "Pedir a … para levar você", sem cobrar da criança', () => {
    const v = crianca();
    const pai = responsaveis(v)[0];
    const ctx = ctxPessoa(v, pai.p.id)!;
    const estadio = interacoesPara(v, pai.p.id).find(x => x.id === 'estadio');
    if (estadio) {
      expect(estadio.rotulo(ctx)).toMatch(/^Pedir a .+ para levar você ao estádio/);
      expect(estadio.disponivel ? podeTentar(estadio.disponivel(ctx)) : true).toBe(true);
    }
    const cinema = interacoesPara(v, pai.p.id).find(x => x.id === 'cinema')!;
    expect(cinema.rotulo(ctx)).toMatch(/^Pedir a .+ cinema/);
    const r = executar(v, { tipo: 'pessoa', pessoaId: pai.p.id, interacao: 'cinema' });
    expect(r.vida.financas.conta).toBe(193);
  });

  it('a chuteira mais cara que o cofrinho: o preço, o que há, o que falta — e o pedido preserva o produto', () => {
    const v = crianca();
    const s = situacaoDaCompra(v, 'chuteira_bola');
    expect(s.tem).toBe(193);
    expect(s.falta).toBe(s.preco - 193);
    expect(s.quem.length).toBeGreaterThan(0);
    expect(podeTentar(disponibilidade(v, { tipo: 'pedir_compra', coisaId: 'chuteira_bola' }))).toBe(true);
    // Pede várias vezes (anos seguidos) até alguém topar: a coisa é da criança, e ela não paga quando o adulto compra.
    let w = v, deu = false;
    for (let k = 0; k < 12 && !deu; k++) {
      const r = executar(w, { tipo: 'pedir_compra', coisaId: 'chuteira_bola', responsavelId: s.quem[0].id });
      w = r.vida;
      deu = (w.financas.coisas ?? []).some(c => c.coisaId === 'chuteira_bola');
      if (!deu) w = em(w, x => { x.anoAtual.acoes = []; });
    }
    expect(deu).toBe(true);
    expect(w.financas.conta).toBe(193);
    // Uma vez por ano por produto.
    expect(disponibilidade(w, { tipo: 'pedir_compra', coisaId: 'chuteira_bola' }).grau).not.toBe('permitido');
  });
});

describe('C2 · candidatar-se, ser aprovado e matricular-se são passos diferentes', () => {
  it('aprovada, a vaga fica reservada; a matrícula só entra ao confirmar (e a vaga não confirmada passa)', () => {
    let v = em(adulto(19, { semente: 71 }), x => { x.educacao.matricula = undefined; x.educacao.escolaridade = 'medio'; x.financas.conta = 50000; });
    const ops = opcoesDeCurso(v);
    const k = ops.findIndex(o => o.curso.nivel === 'superior' && podeTentar(o.veredito) && (o.veredito.chance ?? 0.9) >= 0.8);
    expect(k).toBeGreaterThanOrEqual(0);
    let aprovado = false;
    for (let t = 0; t < 6 && !aprovado; t++) {
      const r = executar(v, { tipo: 'matricular', indice: k, etapa: 'candidatar' });
      if (r.vida.educacao.aprovacao) { v = r.vida; aprovado = true; } else v = em(r.vida, x => { delete x.fatos[`tentou_${ops[k].curso.id}_${Math.floor(x.t / 12)}`]; x.t += 12; });
    }
    expect(aprovado).toBe(true);
    expect(v.educacao.matricula).toBeUndefined();
    const confirmado = executar(v, { tipo: 'confirmar_matricula' }).vida;
    if (!confirmado.caminhos.pendente) expect(confirmado.educacao.matricula?.cursoId).toBe(v.educacao.aprovacao!.novo.cursoId);
    expect(confirmado.educacao.aprovacao).toBeUndefined();
    // Recarregar mantém a vaga esperando (save).
    expect(recarregar(v).educacao.aprovacao?.nome).toBe(v.educacao.aprovacao!.nome);
  });
});

describe('UX-23 / D3 · convite com prazo', () => {
  it('o convite vencido sai das portas abertas e fica dito; o recusado também', () => {
    const v = em(adulto(16, { semente: 81 }), x => {
      const amigo = comParente(x, 'tio', 40).p;
      novaOportunidade(x, { tipo: 'iniciacao', meses: 12, chave: 'teste106', titulo: `${amigo.nome} chamou para um projeto`, texto: 'Um projeto.', pessoaId: amigo.id, atividade: 'projeto_escola' });
    });
    const o = oportunidadesAbertas(v)[0];
    expect(o).toBeTruthy();
    const vencido = em(v, x => { x.t = o.tFim; processarOportunidades(x, criarRng(1)); });
    expect(oportunidadesAbertas(vencido).some(x => x.id === o.id)).toBe(false);
    expect(vencido.biografia.some(b => /passou sem resposta/.test(b.texto))).toBe(true);
    expect(disponibilidade(vencido, { tipo: 'oportunidade', id: o.id, aceitar: true }).grau).not.toBe('permitido');
  });
});

describe('P8 · o resto do mundo também envelhece', () => {
  it('gente sem vínculo e sem ligação com a sua vida morre com a idade — quem é da sua vida, não por esta conta', () => {
    const v = em(adulto(40, { semente: 91 }), x => {
      for (let k = 0; k < 60; k++) criarPessoa(x, criarRng(500 + k), { idade: 92, genero: 'feminino', municipioId: x.moradia.municipioId });
    });
    const vivosDaVida = Object.keys(v.vinculos).filter(id => v.pessoas[id]?.vivo).length;
    let w = v, mortes = 0;
    for (let k = 0; k < 3; k++) w = em(w, x => { x.t += 12; mortes += processarDistantes(x); });
    expect(mortes).toBeGreaterThan(10);
    expect(Object.keys(w.vinculos).filter(id => w.pessoas[id]?.vivo).length).toBe(vivosDaVida);
    expect(idade(w)).toBeGreaterThan(40);
  });
});
