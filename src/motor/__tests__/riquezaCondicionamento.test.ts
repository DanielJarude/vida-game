/**
 * Pós-playtest: TRABALHO, RIQUEZA E PROPÓSITO · CONDICIONAMENTO.
 *
 *  A2 — ocupação ≠ situação econômica ≠ intenção. Quem vive do patrimônio
 *       por escolha não "procura trabalho há tanto tempo"; quem quer voltar
 *       a trabalhar e não consegue sente, rico ou não; o pobre sem trabalho
 *       continua sentindo. Trabalho, Dinheiro e Você leem a mesma fonte
 *       (`sistemas/intencao`).
 *  A3 — a explicação do condicionamento é uma frase montada na fonte (sem
 *       "+ o futebol;" solto), a seta é a mudança MEDIDA e as causas listadas
 *       batem com a direção; cada esporte alimenta a forma e é nomeado.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { nova, viverAte } from './ajuda';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { criarRng } from '../rng';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { depositar } from '../sistemas/investimentos';
import { seguranca } from '../sistemas/dinheiro';
import { encerrarEmprego, contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { acoesDoTrabalho, leituraDoTrabalho, modoDoTrabalho } from '../sistemas/profissao';
import { fatoresCabeca, fatoresHumor, leituraDoEstado } from '../sistemas/estado';
import { intencaoProfissional, mesesProcurando, registrarProcura } from '../sistemas/intencao';
import { alvoCondicionamento, causasDoCondicionamento, estimuloFisico, fatoresCondicionamento, pisoDeForma, tendenciaPessoal } from '../sistemas/pessoa';
import { entrarNaBase } from '../sistemas/esporte';
import { cuidarDaLesao, lesaoAtiva, lesionar } from '../sistemas/lesoes';
import { lerPessoal } from '../../ui/estadoPessoal';

const clone = (v: Vida): Vida => JSON.parse(JSON.stringify(v));
const disp = (v: Vida, a: Parameters<typeof disponibilidade>[1]) => disponibilidade(v, a);

/** Um adulto que já trabalhou e está sem trabalho há `anos`. */
function semTrabalho(anos: number, semente = 11): Vida {
  const v = adulto(45, { semente });
  if (v.trabalho.atual) encerrarEmprego(v, 'pediu demissão');
  if (!v.trabalho.historico.length) v.trabalho.historico.push({ ...contratar(clone(v), criarRng(1), ocupacao('vendedor')), tFim: v.t - anos * 12, motivo: 'demitido' });
  v.trabalho.desempregadoDesde = v.t - anos * 12;
  v.trabalho.intencao = undefined;
  v.trabalho.aposentadoria = undefined;
  v.trabalho.pausa = undefined;
  v.caminhos.negocio = undefined;
  v.educacao.matricula = undefined;
  v.financas.dividas = [];
  v.financas.negativado = false;
  v.momento = null;
  return v;
}

/** O personagem do playtest: ~R$ 89 milhões, R$ 83 milhões aplicados, sem dívida. */
function rico(anos = 5): Vida {
  const v = semTrabalho(anos);
  v.financas.conta = 6_000_000;
  depositar(v, 'pos_fixado', 83_000_000);
  return v;
}

function pobre(anos = 3): Vida {
  const v = semTrabalho(anos);
  v.financas.conta = 1200;
  v.financas.investimentos = [];
  return v;
}

const ids = (fs: { id: string }[]) => fs.map(f => f.id);

describe('A2 — trabalho, riqueza e propósito', () => {
  it('rico sem trabalho e sem declarar intenção: vive do patrimônio — a cabeça não conta "procurar trabalho há tanto tempo"', () => {
    const v = rico();
    expect(seguranca(v).nivel).toBe('folgado');
    expect(seguranca(v).texto).toMatch(/deixou de ser a preocupação/);
    const l = intencaoProfissional(v);
    expect(l.intencao).toBe('sem_procurar');
    expect(l.livre).toBe(true);
    expect(modoDoTrabalho(v)).toBe('sem_procurar');
    expect(ids(fatoresCabeca(v))).not.toContain('procura');
    expect(ids(fatoresHumor(v))).not.toContain('sem_trabalho');
    // A tela Você (o que pesa na cabeça) não mostra a procura.
    expect(leituraDoEstado(v, 'cabeca', 10).pesando.map(f => f.texto).join(' | ')).not.toMatch(/procurar trabalho/);
    // A tela Trabalho diz a mesma coisa.
    const t = leituraDoTrabalho(v);
    expect(t.titulo).toBe('Vivendo do que juntou');
    expect(t.frases.join(' ')).not.toMatch(/procurando|cada ano parado/i);
    expect(acoesDoTrabalho(v, disp).agora.concat(acoesDoTrabalho(v, disp).mais).map(a => a.id)).toContain('voltar_procurar');
  });

  it('rico que declarou querer voltar a trabalhar e não consegue: a frustração pesa (não é de dinheiro)', () => {
    let v = rico(5);
    const r = executar(v, { tipo: 'intencao_trabalho', quer: 'procurar' });
    expect(r.vida.trabalho.intencao?.quer).toBe('procurar');
    v = r.vida;
    expect(modoDoTrabalho(v)).toBe('procurando');
    // Recém-declarado: a procura começa agora (não há 5 anos).
    expect(ids(fatoresCabeca(v))).not.toContain('procura');
    v.trabalho.intencao!.t = v.t - 18;
    const f = fatoresCabeca(v).find(x => x.id === 'procura');
    expect(f?.texto).toBe('querer voltar a trabalhar e não conseguir');
    expect(f!.efeito).toBeGreaterThan(0);
    expect(fatoresHumor(v).find(x => x.id === 'sem_trabalho')?.texto).toBe('querer trabalhar e não ter onde');
    expect(leituraDoTrabalho(v).frases.join(' ')).toMatch(/quer voltar a trabalhar/);
  });

  it('mandar currículo também é dizer: a candidatura vira intenção de procurar', () => {
    const v = rico(5);
    registrarProcura(v);
    expect(v.trabalho.intencao).toEqual({ quer: 'procurar', t: v.t });
    expect(intencaoProfissional(v).intencao).toBe('procurando');
    expect(mesesProcurando(v)).toBe(0);
  });

  it('pobre sem trabalho continua sentindo a procura — e não pode "viver do patrimônio"', () => {
    const v = pobre(3);
    expect(intencaoProfissional(v).intencao).toBe('procurando');
    expect(modoDoTrabalho(v)).toBe('procurando');
    expect(fatoresCabeca(v).find(x => x.id === 'procura')?.texto).toBe('procurar trabalho há tanto tempo');
    expect(fatoresHumor(v).find(x => x.id === 'sem_trabalho')?.texto).toBe('estar sem trabalho');
    const d = disponibilidade(v, { tipo: 'intencao_trabalho', quer: 'nao_procurar' });
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/guardado/);
  });

  it('rico pode parar de procurar (e voltar): a ação muda a mesma fonte que as três telas leem', () => {
    let v = rico(3);
    v = executar(v, { tipo: 'intencao_trabalho', quer: 'procurar' }).vida;
    v.trabalho.intencao!.t = v.t - 24;
    expect(ids(fatoresCabeca(v))).toContain('procura');
    expect(acoesDoTrabalho(v, disp).agora.concat(acoesDoTrabalho(v, disp).mais).map(a => a.id)).toContain('parar_procurar');
    v = executar(v, { tipo: 'intencao_trabalho', quer: 'nao_procurar' }).vida;
    expect(ids(fatoresCabeca(v))).not.toContain('procura');
    expect(modoDoTrabalho(v)).toBe('sem_procurar');
    expect(v.biografia.some(b => /Parou de procurar trabalho/.test(b.texto))).toBe(true);
  });

  it('as telas concordam: Trabalho (modo), Dinheiro (folga) e Você (cabeça) leem a mesma intenção', () => {
    const casos: Vida[] = [rico(5), pobre(3), (() => { const v = rico(5); v.trabalho.intencao = { quer: 'procurar', t: v.t - 30 }; return v; })(), (() => { const v = pobre(3); v.trabalho.intencao = { quer: 'nao_procurar', t: v.t - 30 }; return v; })()];
    for (const v of casos) {
      const l = intencaoProfissional(v);
      expect(modoDoTrabalho(v) === 'sem_procurar').toBe(l.intencao === 'sem_procurar');
      expect(modoDoTrabalho(v) === 'procurando').toBe(l.intencao === 'procurando');
      expect(l.livre).toBe(seguranca(v).nivel === 'folgado');
      expect(ids(fatoresCabeca(v)).includes('procura')).toBe(l.intencao === 'procurando' && mesesProcurando(v) >= 12);
    }
  });

  it('a declaração vale só para o tempo sem trabalho em que foi feita; o emprego novo a encerra', () => {
    const v = rico(2);
    v.trabalho.intencao = { quer: 'procurar', t: v.t - 60 }; // antes do último emprego
    expect(intencaoProfissional(v).intencao).toBe('sem_procurar');
    contratar(v, criarRng(2), ocupacao('vendedor'));
    expect(v.trabalho.intencao).toBeUndefined();
    expect(intencaoProfissional(v).intencao).toBe('nao_se_aplica');
  });

  it('o save valida a intenção (opcional)', () => {
    const v = rico(2);
    v.trabalho.intencao = { quer: 'nao_procurar', t: v.t };
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
    const ruim = JSON.parse(JSON.stringify(v));
    ruim.trabalho.intencao = { quer: 'talvez', t: 1 };
    expect(interpretar(JSON.stringify(ruim)).tipo).toBe('invalido');
  });
});

/* =================================================================== A3 */

const ESPORTES = ['futebol', 'volei', 'basquete', 'tenis', 'natacao', 'atletismo', 'lutas', 'danca', 'academia', 'corrida', 'time_escola', 'atletica'] as const;
const NOMES: Record<string, RegExp> = { futebol: /futebol/, volei: /vôlei/, basquete: /basquete/, tenis: /tênis/, natacao: /natação/, atletismo: /atletismo/, lutas: /luta/, danca: /dança/, academia: /academia/, corrida: /correr/, time_escola: /time da escola/, atletica: /atlética/ };

let base13: Vida | undefined;
function crianca13(): Vida {
  base13 ??= viverAte(nova({ municipioId: 'uberaba-mg', genero: 'masculino', semente: 7 }), 13);
  const v = clone(base13);
  v.momento = null;
  v.rotinas = [];
  v.corpo.condicoes = v.corpo.condicoes.filter(c => c.id !== 'lesao');
  v.caminhos.esporte = undefined;
  return v;
}

/** Uma lesão em andamento, que já tirou meses do ano. */
function machucar(v: Vida, cuidado?: 'repouso' | 'fisio' | 'cirurgia' | 'sacrificio', g: 1 | 2 | 3 = 2): void {
  lesionar(v, criarRng(5), g, 'pratica');
  const c = lesaoAtiva(v)!;
  c.tInicio = v.t - 6;
  if (cuidado) cuidarDaLesao(v, cuidado, false);
  c.lesao.tFim = v.t + 3;
}

/** A frase não pode vazar fragmento: sem sinais soltos, sem ponto-e-vírgula, pontuação fechada. */
function semFragmento(frase: string): void {
  expect(frase).not.toMatch(/[;+−]/);
  expect(frase).not.toMatch(/\s[,.]|,,|\.\.|^\s|\s$/);
  if (frase) expect(frase).toMatch(/^O que (ajuda|pesa|segura)/);
  if (frase) expect(frase).toMatch(/\.$/);
}

function comHistorico(v: Vida, formaAntes: number): void {
  v.mente.historico = [{ t: v.t - 24, humor: 60, cabeca: 30, saude: 80, forma: formaAntes, cognicao: 50, aparencia: 55 }];
}

describe('A3 — condicionamento', () => {
  it('cada esporte (e o treino voluntário) alimenta a forma e é nomeado na frase', () => {
    for (const id of ESPORTES) {
      const v = crianca13();
      if (id === 'atletica' || id === 'academia') v.eu.tNasc -= 5 * 12; // atividades de quem já é mais velho
      v.rotinas = [{ id, tInicio: v.t - 24, nivel: 2 }];
      const t = fatoresCondicionamento(v).find(f => f.id === 'treino');
      expect(t, id).toBeDefined();
      expect(t!.efeito, id).toBeGreaterThan(5);
      expect(t!.texto, id).toMatch(NOMES[id]);
      const l = lerPessoal(v, 'condicionamento');
      semFragmento(l.causas);
      expect(l.causas, id).toMatch(NOMES[id]);
    }
  });

  it('nenhuma combinação de esporte × lesão × cuidado vaza fragmento', () => {
    for (const id of ESPORTES) for (const cuidado of [undefined, 'repouso', 'fisio', 'cirurgia', 'sacrificio'] as const) for (const dir of [80, 50, 65]) {
      const v = crianca13();
      v.rotinas = [{ id, tInicio: v.t - 24, nivel: 2 }];
      if (id === 'futebol') entrarNaBase(v, 'futebol', 'uberaba-mg', 'Uberaba');
      machucar(v, cuidado);
      v.corpo.forma = 66;
      comHistorico(v, dir);
      const l = lerPessoal(v, 'condicionamento');
      semFragmento(l.causas);
      expect(l.causas).toMatch(/lesão|ombro|joelho|coxa|tornozelo|menisco|pé|panturrilha/);
    }
  });

  it('na base, o treino é dito como treino de base — e entrar na base não baixa o alvo (sem degrau aos 12)', () => {
    const v = crianca13();
    v.rotinas = [{ id: 'futebol', tInicio: v.t - 24, nivel: 2 }];
    const antes = alvoCondicionamento(v);
    entrarNaBase(v, 'futebol', 'uberaba-mg', 'Uberaba');
    expect(alvoCondicionamento(v)).toBeGreaterThan(antes);
    expect(fatoresCondicionamento(v).find(f => f.id === 'treino')!.texto).toBe('o treino de base de futebol');
    for (let i = 5; i < 20; i++) expect(Math.abs(pisoDeForma(i + 1) - pisoDeForma(i))).toBeLessThanOrEqual(3);
  });

  it('a lesão tira dos treinos de quem está na base (não só do profissional): causa real, com o nome', () => {
    const v = crianca13();
    entrarNaBase(v, 'futebol', 'uberaba-mg', 'Uberaba');
    const sao = clone(v);
    machucar(v, 'repouso');
    expect(estimuloFisico(v).total).toBeLessThan(estimuloFisico(sao).total);
    expect(alvoCondicionamento(v)).toBeLessThan(alvoCondicionamento(sao));
    expect(fatoresCondicionamento(v).find(f => f.id === 'treino')!.texto).toMatch(/^o treino de base de futebol \((bem )?reduzido pela lesão\)$/);
  });

  it('atleta da base machucado pode legitimamente vir piorando — e a frase diz por quê, na ordem certa', () => {
    const v = crianca13();
    v.predisposicoes = { ...(v.predisposicoes ?? {}), fisica: 0.6 } as Vida['predisposicoes'];
    entrarNaBase(v, 'futebol', 'uberaba-mg', 'Uberaba');
    machucar(v, 'fisio');
    const parte = lesaoAtiva(v)!.lesao.parte;
    v.corpo.forma = 70;
    comHistorico(v, 78);
    expect(tendenciaPessoal(v, 'condicionamento')).toBe('piorando');
    const c = causasDoCondicionamento(v);
    expect(c.contra[0]).toBe(parte);
    const l = lerPessoal(v, 'condicionamento');
    semFragmento(l.causas);
    expect(l.causas.startsWith(`O que pesa: ${parte}`)).toBe(true);
    expect(l.causas).toMatch(/O que segura: o treino de base de futebol/);
  });

  it('a seta é a mudança medida; as causas listadas seguem a direção (também quando a causa já passou)', () => {
    // Melhorando: o que ajuda vem primeiro.
    const a = crianca13();
    a.rotinas = [{ id: 'natacao', tInicio: a.t - 24, nivel: 3 }];
    a.corpo.forma = 72; comHistorico(a, 60);
    expect(tendenciaPessoal(a, 'condicionamento')).toBe('melhorando');
    expect(lerPessoal(a, 'condicionamento').causas).toMatch(/^O que ajuda: a natação/);
    // Estável: sem seta, sem inventar causa de queda.
    const e = clone(a); e.corpo.forma = 61;
    expect(tendenciaPessoal(e, 'condicionamento')).toBe('estavel');
    // Piorando com a lesão que JÁ sarou (dentro da janela): ela é dita.
    const p = crianca13();
    p.rotinas = [{ id: 'basquete', tInicio: p.t - 24, nivel: 1 }];
    p.fatos['lesao_curada'] = p.t - 6; p.fatos['lesao_curada_meses'] = 5;
    p.corpo.forma = 60; comHistorico(p, 70);
    expect(tendenciaPessoal(p, 'condicionamento')).toBe('piorando');
    expect(lerPessoal(p, 'condicionamento').causas).toMatch(/^O que pesa: .*a lesão que tirou 5 meses de treino/);
    // Piorando sem nada que pese no alvo: nunca uma frase só com o que ajuda.
    const q = crianca13();
    q.eu.tNasc -= 7 * 12; // 20 anos: a infância já passou
    q.rotinas = [{ id: 'corrida', tInicio: q.t - 24 }];
    q.corpo.forma = 70; comHistorico(q, 80);
    expect(tendenciaPessoal(q, 'condicionamento')).toBe('piorando');
    expect(causasDoCondicionamento(q).contra.length).toBeGreaterThan(0);
    expect(lerPessoal(q, 'condicionamento').causas).toMatch(/^O que pesa: /);
  });

  it('sedentarismo e doença aparecem como o que pesa', () => {
    const v = crianca13();
    v.eu.tNasc -= 10 * 12;
    v.corpo.forma = 50; comHistorico(v, 60);
    v.corpo.saude = 40;
    const l = lerPessoal(v, 'condicionamento');
    expect(l.tendencia).toBe('piorando');
    expect(l.causas).toMatch(/^O que pesa: nenhum exercício na semana e a saúde fraca\.$/);
  });
});

describe('A2 · quem mora com a família não "vive do patrimônio" com trocados', () => {
  it('adulta de 26 anos, na casa dos pais, com R$ 418: procura trabalho (Dinheiro e Trabalho concordam)', () => {
    let v = nova({ semente: 5, genero: 'feminino' });
    v = viverAte(v, 26);
    v.momento = null;
    v.trabalho.atual = undefined;
    v.educacao.matricula = undefined;
    v.moradia = { ...v.moradia, tipo: 'pais' };
    v.financas.conta = 418;
    v.financas.investimentos = [];
    expect(seguranca(v).nivel).not.toBe('folgado');
    expect(seguranca(v).texto).not.toMatch(/deixou de ser a preocupação/);
    expect(intencaoProfissional(v).intencao).toBe('procurando');
    expect(modoDoTrabalho(v)).not.toBe('sem_procurar');
  });
});
