/**
 * Vida profissional (rework do Trabalho): o modo de cada caminho, as ações
 * contextuais e a sua disponibilidade, o ritmo e o que ele cobra, o clima com
 * a chefia, o negócio como gestão (caixa, equipe, porte, venda, fechamento,
 * fracasso que ensina), o atleta (contrato, banco, foco, doping abstrato),
 * farda, serviço público, campo, arte, personalidade só por escolha, agência,
 * save v12 com saves v11 reais.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responder, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { idade, idadePessoa, transacao, vinculosVivos } from '../nucleo';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';
import { ocupacao } from '../dados/ocupacoes';
import { contratar, processarTrabalho } from '../sistemas/trabalho';
import { acoesDoTrabalho, leituraDoTrabalho, modoDoTrabalho, processarProfissao, type ModoTrabalho } from '../sistemas/profissao';
import { abrirNegocio, contaDoAno, contratarFuncionario, fecharNegocio, negocioAtivo, podeAbrirNegocio, processarNegocio, tetoDoMovimento, valorDoNegocio } from '../sistemas/negocio';
import { entrarNaBase, processarEsporte, profissionalizar } from '../sistemas/esporte';
import { garantirFrente } from '../sistemas/frentes';
import { iniciarRural } from '../sistemas/rural';
import { fatoresCabeca } from '../sistemas/estado';
import { semana } from '../sistemas/semana';
import { balanco } from '../sistemas/dinheiro';
import { interpretar, VERSAO_SAVE } from '../save';
import { conteudoPorId } from '../conteudo/motor';
import { PROFISSAO } from '../conteudo/profissao';
import { criarPessoa, vincular } from '../pessoas';
import { municipio } from '../dados/lugares';
import { guarnicaoPerto } from '../sistemas/militar';

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');

function adulto(i = 30, semente = 7, genero: 'feminino' | 'masculino' = 'feminino', municipioId = 'recife-pe'): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, genero, municipioId }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero, municipioId }), i);
  v.momento = null;
  v.trabalho.atual = undefined;
  v.trabalho.aposentadoria = undefined;
  v.trabalho.pausa = undefined;
  v.trabalho.horasExtras = false;
  v.educacao.matricula = undefined;
  v.educacao.basica = undefined;
  v.educacao.escolaridade = 'medio';
  v.caminhos.envolvimento = undefined;
  v.caminhos.militar = undefined;
  v.caminhos.negocio = undefined;
  v.caminhos.esporte = undefined;
  v.caminhos.processo = undefined;
  v.justica = undefined;
  v.caminhos.oportunidades = [];
  v.corpo.saude = 82;
  v.corpo.forma = 70;
  v.corpo.condicoes = [];
  v.mente.estresse = 30;
  v.mente.felicidade = 60;
  v.financas.dividas = [];
  v.financas.negativado = false;
  v.anoAtual = { acoes: [] };
  return v;
}

const com = (v: Vida, id: string, via = 'curriculo') => transacao(v, x => { contratar(x, criarRng(3), ocupacao(id), via); }).vida;
const formar = (v: Vida, area: string, nivel: 'superior' | 'tecnico' = 'superior') => { v.educacao.concluidos.push({ cursoId: area, nome: area, nivel, area, tFim: v.t - 24, instituicao: 'x' }); v.educacao.escolaridade = nivel; };
const ids = (v: Vida) => { const a = acoesDoTrabalho(v, disponibilidade); return [...a.agora, ...a.mais, ...a.saidas].map(x => x.id); };
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const P = (oque: string, extra: Record<string, string> = {}) => ({ tipo: 'profissao', oque, ...extra } as unknown as Acao);

/* ============================================================ Modos */

describe('modo do trabalho: cada caminho é lido do jeito dele', () => {
  const casos: [string, ModoTrabalho, (v: Vida) => void][] = [
    ['atendente', 'empregado', () => {}],
    ['tecnico_publico', 'servidor', () => {}],
    ['professor_concursado', 'docente', v => formar(v, 'educacao')],
    ['tec_enfermagem', 'saude', v => formar(v, 'enfermagem', 'tecnico')],
    ['soldado_pm', 'seguranca', () => {}],
    ['eletricista', 'autonomo', v => { v.trabalho.experiencia['eletrica'] = 48; }],
    ['ambulante', 'informal', () => {}],
    ['produtor_rural', 'rural', v => { iniciarRural(v, 'familia'); }]
  ];
  for (const [oc, modo, prep] of casos) {
    it(`${oc} → ${modo}`, () => {
      let v = adulto(32);
      prep(v);
      v = com(v, oc, oc === 'produtor_rural' ? 'oportunidade' : 'curriculo');
      if (oc === 'produtor_rural') iniciarRural(v, 'familia');
      expect(modoDoTrabalho(v)).toBe(modo);
    });
  }
  it('sem trabalho, a leitura muda com a vida: criança, estudante, procurando, aposentado, pausa, preso', () => {
    expect(modoDoTrabalho(viverAte(nova({ semente: 3 }), 9))).toBe('crianca');
    const v = adulto(40);
    expect(modoDoTrabalho(v)).toBe('procurando');
    v.trabalho.aposentadoria = { t: v.t, beneficio: 2000 };
    expect(modoDoTrabalho(v)).toBe('aposentado');
    v.trabalho.aposentadoria = undefined;
    v.trabalho.pausa = { motivo: 'casa', tInicio: v.t, intensidade: 'total' };
    expect(modoDoTrabalho(v)).toBe('pausa');
    v.trabalho.pausa = undefined;
    v.justica = { antecedentes: [], prisao: { tInicio: v.t, tFim: v.t + 24, regime: 'fechado' } };
    expect(modoDoTrabalho(v)).toBe('preso');
    expect(acoesDoTrabalho(v, disponibilidade).agora).toHaveLength(0);
  });
});

/* ======================================================= Ações contextuais */

describe('ações contextuais: poucas, pertinentes e sempre possíveis', () => {
  const cenarios: [string, (v: Vida) => Vida][] = [
    ['empregada', v => com(v, 'vendedor')],
    ['servidor', v => com(v, 'tecnico_publico')],
    ['autônomo', v => { v.trabalho.experiencia['eletrica'] = 60; return com(v, 'eletricista'); }],
    ['informal', v => com(v, 'ambulante')],
    ['dona de negócio', v => transacao(v, x => { x.financas.conta = 60000; x.trabalho.experiencia['alimentacao'] = 60; abrirNegocio(x, criarRng(1), 'lanchonete'); }).vida],
    ['procurando', v => v]
  ];
  for (const [nome, prep] of cenarios) {
    it(`${nome}: de 1 a 5 em "agora", e toda ação com comando passa na disponibilidade do motor`, () => {
      const v = prep(adulto(34));
      const a = acoesDoTrabalho(v, disponibilidade);
      expect(a.agora.length).toBeGreaterThanOrEqual(1);
      expect(a.agora.length).toBeLessThanOrEqual(5);
      for (const x of [...a.agora, ...a.mais, ...a.saidas]) if (x.acao) expect(tenta(v, x.acao), `${nome}: ${x.rotulo}`).toBe(true);
    });
  }
  it('nada absurdo: servidor não pede aumento, militar não negocia promoção, dono não pede aumento, autônomo não conversa sobre promoção', () => {
    const serv = com(adulto(34), 'tecnico_publico');
    expect(ids(serv)).not.toContain('aumento');
    expect(ids(serv)).not.toContain('promocao');
    expect(tenta(serv, P('remocao'))).toBe(false); // servidor da prefeitura: outra cidade é outro concurso
    const aut = (() => { const v = adulto(34); v.trabalho.experiencia['eletrica'] = 60; return com(v, 'eletricista'); })();
    expect(ids(aut)).not.toContain('promocao');
    expect(ids(aut)).not.toContain('aumento');
    const dona = transacao(adulto(34), x => { x.financas.conta = 60000; x.trabalho.experiencia['alimentacao'] = 60; abrirNegocio(x, criarRng(1), 'lanchonete'); }).vida;
    expect(ids(dona)).not.toContain('aumento');
    expect(ids(dona)).toContain('contratar');
    expect(ids(dona)).toContain('fechar');
    expect(tenta(dona, { tipo: 'pedir_aumento' })).toBe(false);
    expect(tenta(dona, P('promocao'))).toBe(false);
    expect(tenta(serv, P('contratar'))).toBe(false);
    expect(tenta(serv, P('foco', { valor: 'forcar' }))).toBe(false);
    expect(tenta(aut, P('remocao'))).toBe(false);
  });
  it('as saídas (demitir-se, fechar) nunca vêm em destaque', () => {
    const v = com(adulto(34), 'vendedor');
    const a = acoesDoTrabalho(v, disponibilidade);
    expect(a.agora.some(x => x.saida)).toBe(false);
    expect(a.saidas.map(x => x.id)).toContain('sair');
  });
  it('o porquê acompanha o contexto: contas no vermelho puxam horas extras; cabeça cheia puxa desistir delas', () => {
    let v = com(adulto(34), 'vendedor');
    v.financas.conta = -8000;
    v.financas.dividas.push({ id: 'dx', tipo: 'cartao', saldo: 9000, jurosMes: 0.12, parcela: 0, descricao: 'cartão' });
    const horas = acoesDoTrabalho(v, disponibilidade).agora.find(x => x.id === 'horas');
    expect(horas?.porque).toMatch(/não fecha/);
    v = executar(v, { tipo: 'horas_extras' }).vida;
    v.mente.estresse = 75;
    const sem = acoesDoTrabalho(v, disponibilidade).agora.find(x => x.id === 'sem_horas');
    expect(sem).toBeTruthy();
  });
  it('a leitura do trabalho fala em palavras: título, onde, renda no bolso, jornada — nunca "nível"', () => {
    const v = com(adulto(34), 'vendedor');
    const l = leituraDoTrabalho(v);
    expect(l.titulo.length).toBeGreaterThan(3);
    expect(l.renda).toMatch(/por mês no bolso/);
    expect(JSON.stringify(l)).not.toMatch(/nível|nivel \d|clima: \d/);
  });
});

/* ================================================================ Ritmo */

describe('ritmo: trabalho excessivo tem custo; preservar a saúde tem valor', () => {
  const professora = (semente = 7) => { const v = adulto(34, semente); formar(v, 'educacao'); return com(v, 'professor_concursado', 'concurso'); };
  it('mais turmas: salário maior na hora, a semana mais cheia, a cabeça sente; voltar desfaz o salário', () => {
    let v = professora();
    const antes = v.trabalho.atual!.salario;
    const semanaAntes = semana(v).fixos.find(f => f.id === 'trabalho')!.peso;
    v = executar(v, P('ritmo', { valor: 'puxado' })).vida;
    expect(v.trabalho.atual!.salario).toBeGreaterThan(antes * 1.2);
    expect(semana(v).fixos.find(f => f.id === 'trabalho')!.peso).toBeGreaterThan(semanaAntes);
    expect(fatoresCabeca(v).some(f => f.id === 'ritmo' && f.efeito > 0)).toBe(true);
    expect(tenta(v, P('ritmo', { valor: 'normal' }))).toBe(false); // uma mudança por ano
    v = avancarAno(v).vida; if (v.momento) v = responder(v);
    v = executar(v, P('ritmo', { valor: 'normal' })).vida;
    expect(Math.abs(v.trabalho.atual!.salario / antes - 1)).toBeLessThan(0.12);
  });
  it('anos no ritmo puxado cobram do corpo: a saúde fica abaixo de quem manteve o ritmo leve (média de várias vidas)', () => {
    let puxado = 0; let leve = 0;
    for (const s of [3, 5, 8, 13, 21]) {
      const base = professora(s);
      let a = executar(base, P('ritmo', { valor: 'puxado' })).vida;
      let b = executar(base, P('ritmo', { valor: 'leve' })).vida;
      for (let k = 0; k < 6; k++) {
        a = avancarAno(a).vida; while (a.momento) a = responder(a, 'seguir');
        b = avancarAno(b).vida; while (b.momento) b = responder(b);
      }
      puxado += a.corpo.saude; leve += b.corpo.saude;
    }
    expect(puxado).toBeLessThan(leve);
  });
  it('o limite: anos puxados com a cabeça cheia abrem "O corpo deu sinal", e seguir custa saúde', () => {
    let v = professora();
    v = executar(v, P('ritmo', { valor: 'puxado' })).vida;
    v = transacao(v, x => { x.trabalho.atual!.anosPuxado = 3; x.mente.estresse = 72; processarProfissao(x, criarRng(1)); }).vida;
    expect(v.fatos['trab_limite']).toBe(v.t);
    const d = conteudoPorId('trab_limite')!;
    expect(d.tipo).toBe('decisao');
  });
  it('dono sem ninguém na equipe não tem como aliviar o balcão', () => {
    const v = transacao(adulto(34), x => { x.financas.conta = 60000; x.trabalho.experiencia['alimentacao'] = 60; abrirNegocio(x, criarRng(1), 'lanchonete'); }).vida;
    expect(tenta(v, P('ritmo', { valor: 'leve' }))).toBe(false);
    expect(tenta(v, P('ritmo', { valor: 'puxado' }))).toBe(true);
  });
  it('quem tem carteira comum não mexe em "ritmo" (tem horas extras e jornada reduzida)', () => {
    const v = com(adulto(34), 'vendedor');
    expect(tenta(v, P('ritmo', { valor: 'puxado' }))).toBe(false);
  });
});

/* ================================================================ Clima */

describe('clima com a chefia: pesa na cabeça, na promoção e no corte', () => {
  it('clima ruim aparece como causa na cabeça; bom, no humor', () => {
    const v = com(adulto(34), 'vendedor');
    v.trabalho.atual!.clima = 20;
    expect(fatoresCabeca(v).some(f => f.id === 'clima')).toBe(true);
  });
  it('o blefe da proposta de fora, quando dá errado, azeda o clima', () => {
    let achou = false;
    for (let s = 1; s < 40 && !achou; s++) {
      let v = com(adulto(34, s), 'vendedor');
      v.t += 24;
      v.trabalho.atual!.tInicio = v.t - 24;
      v = executar(v, { tipo: 'pedir_aumento' }).vida;
      if (!v.momento) continue;
      v = executar(v, { tipo: 'decidir', opcaoId: 'proposta' }).vida;
      if ((v.trabalho.atual!.clima ?? 50) <= 40) achou = true;
    }
    expect(achou).toBe(true);
  });
  it('com clima péssimo, cortes acontecem mais (mesmas sementes)', () => {
    let ruim = 0; let bom = 0;
    for (let s = 1; s <= 60; s++) {
      const base = com(adulto(34, 7), 'vendedor');
      const a = transacao(base, x => { x.trabalho.atual!.clima = 15; x.trabalho.atual!.desempenho = 55; x.rng = s * 7919; processarTrabalho(x, criarRng(s)); }).vida;
      const b = transacao(base, x => { x.trabalho.atual!.clima = 85; x.trabalho.atual!.desempenho = 55; x.rng = s * 7919; processarTrabalho(x, criarRng(s)); }).vida;
      if (!a.trabalho.atual) ruim++;
      if (!b.trabalho.atual) bom++;
    }
    expect(ruim).toBeGreaterThan(bom);
  });
});

/* ============================================================== Negócio */

const lanchonete = (conta = 60000, semente = 7) => transacao(adulto(34, semente), x => { x.financas.conta = conta; x.trabalho.experiencia['alimentacao'] = 60; abrirNegocio(x, criarRng(1), 'lanchonete'); }).vida;

describe('negócio: gestão, não renda passiva', () => {
  it('abrir é um processo: modos com e sem dinheiro, sem conhecer o ramo é possível mas avisado', () => {
    let v = adulto(30);
    v.financas.conta = 30000;
    const d = podeAbrirNegocio(v, 'lanchonete');
    expect(d.grau).toBe('improvavel');
    expect(d.motivo).toMatch(/Sem conhecer o ramo/);
    v = executar(v, { tipo: 'abrir_negocio', negocio: 'lanchonete' }).vida;
    expect(v.momento?.situacaoId).toBe('neg_abrir');
    const opcoes = v.momento!.opcoes.map(o => o.id);
    expect(opcoes).toContain('guardado');
    expect(opcoes).toContain('pequeno');
    v = executar(v, { tipo: 'decidir', opcaoId: 'pequeno' }).vida;
    const n = v.caminhos.negocio!;
    expect(n.emCasa).toBe(true);
    expect(n.semEstrada).toBe(true);
    expect(tetoDoMovimento(n)).toBeLessThan(60);
  });
  it('registro profissional continua obrigatório (sem CRP, sem consultório)', () => {
    const v = adulto(34);
    v.financas.conta = 90000;
    expect(podeAbrirNegocio(v, 'consultorio_psicologia').grau).toBe('requisito');
  });
  it('empréstimo abre, e a dívida fica mesmo depois de fechar', () => {
    let v = adulto(34);
    v = com(v, 'vendedor');
    v.trabalho.atual!.salario = 7000;
    v.trabalho.experiencia['alimentacao'] = 60;
    v.financas.conta = 2000;
    v = executar(v, { tipo: 'abrir_negocio', negocio: 'lanchonete' }).vida;
    expect(v.momento?.situacaoId).toBe('neg_abrir');
    const emp = v.momento!.opcoes.find(o => o.id === 'emprestimo')!;
    if (emp.bloqueio) return; // a renda desta vida não sustenta empréstimo — o motivo aparece
    v = executar(v, { tipo: 'decidir', opcaoId: 'emprestimo' }).vida;
    const n = v.caminhos.negocio!;
    expect(n.dividaId).toBeTruthy();
    v = transacao(v, x => { fecharNegocio(x, 'teste'); }).vida;
    expect(v.financas.dividas.some(d => d.id === n.dividaId && d.saldo > 0)).toBe(true);
  });
  it('o que sobra fica no caixa (conta como patrimônio); retirar é decisão', () => {
    let v = lanchonete();
    v = transacao(v, x => { x.caminhos.negocio!.clientela = 80; x.trabalho.atual!.clientela = 80; processarNegocio(x, criarRng(2)); }).vida;
    const n = v.caminhos.negocio!;
    expect(n.resultadoAno!).toBeGreaterThan(0);
    expect(n.caixa!).toBeGreaterThan(0);
    expect(balanco(v).negocio).toBe(n.caixa);
    const conta = v.financas.conta;
    if (tenta(v, P('retirar'))) {
      v = executar(v, P('retirar')).vida;
      expect(v.financas.conta).toBeGreaterThan(conta);
    }
  });
  it('casa vazia não paga nem quem toca: o caixa acaba e sai do bolso', () => {
    const v = lanchonete();
    const antes = v.financas.conta;
    transacao(v, x => { x.caminhos.negocio!.clientela = 8; x.trabalho.atual!.clientela = 8; processarNegocio(x, criarRng(2)); expect(x.financas.conta).toBeLessThan(antes); });
  });
  it('contratar põe gente de verdade na vida (vínculo de trabalho); demitir deixa marca', () => {
    let v = lanchonete();
    v = transacao(v, x => { contratarFuncionario(x, criarRng(4), 'indicacao'); }).vida;
    const f = v.caminhos.negocio!.equipe![0];
    const p = v.pessoas[f.pessoaId];
    expect(p).toBeTruthy();
    expect(v.vinculos[p.id].convivio).toContain('trabalho');
    expect(p.ocupacao).toBe(f.funcao);
    v = executar(v, P('demitir', { pessoaId: p.id })).vida;
    expect(v.momento?.situacaoId).toBe('neg_demitir');
    v = executar(v, { tipo: 'decidir', opcaoId: 'demitir' }).vida;
    expect(v.caminhos.negocio!.equipe).toHaveLength(0);
    expect(v.vinculos[p.id].tensao).toBeGreaterThanOrEqual(25);
    expect(v.vinculos[p.id].historia.some(h => /demitid/.test(h.texto))).toBe(true);
  });
  it('sozinho, o movimento tem teto; com alguém, a casa pode encher', () => {
    const v = lanchonete();
    const n = v.caminhos.negocio!;
    const so = tetoDoMovimento(n);
    transacao(v, x => { contratarFuncionario(x, criarRng(4), 'jovem'); expect(tetoDoMovimento(x.caminhos.negocio!)).toBeGreaterThan(so); });
  });
  it('ampliar com a casa cheia pode compensar; com a casa meio vazia, afunda mais (risco real)', () => {
    const base = lanchonete(200000);
    const pequeno = transacao(base, x => { x.caminhos.negocio!.clientela = 35; x.trabalho.atual!.clientela = 35; }).vida;
    const grande = transacao(pequeno, x => { const n = x.caminhos.negocio!; n.porte = 2; contratarFuncionario(x, criarRng(1), 'indicacao'); contratarFuncionario(x, criarRng(2), 'indicacao'); n.clientela = 35; x.trabalho.atual!.clientela = 35; }).vida;
    expect(contaDoAno(grande, grande.caminhos.negocio!).resultado).toBeLessThan(contaDoAno(pequeno, pequeno.caminhos.negocio!).resultado);
    const cheio = transacao(grande, x => { x.caminhos.negocio!.clientela = 92; x.trabalho.atual!.clientela = 92; }).vida;
    const cheioPequeno = transacao(pequeno, x => { x.caminhos.negocio!.clientela = 72; x.trabalho.atual!.clientela = 72; }).vida;
    expect(contaDoAno(cheio, cheio.caminhos.negocio!).resultado).toBeGreaterThan(contaDoAno(cheioPequeno, cheioPequeno.caminhos.negocio!).resultado);
  });
  it('não se amplia com a casa vazia; outra unidade pede o primeiro ponto firme', () => {
    const v = lanchonete(300000);
    expect(tenta(v, P('ampliar'))).toBe(false);
    expect(tenta(v, P('unidade'))).toBe(false);
  });
  it('vender vira dinheiro e encerra o trabalho de dono; o valor depende do que o negócio rende', () => {
    let v = lanchonete();
    v = transacao(v, x => { const n = x.caminhos.negocio!; n.historico = [30000, 40000]; n.reputacao = 70; }).vida;
    const valor = valorDoNegocio(v, v.caminhos.negocio!);
    const antes = v.financas.conta;
    v = executar(v, P('vender')).vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'vender' }).vida;
    expect(v.trabalho.atual).toBeUndefined();
    expect(v.financas.conta - antes).toBeGreaterThanOrEqual(valor);
    expect(negocioAtivo(v)).toBeUndefined();
  });
  it('o fracasso ensina: quem fechou e tenta de novo começa com mais movimento', () => {
    const primeira = lanchonete(80000);
    const inicial = primeira.caminhos.negocio!.clientela;
    let v = transacao(primeira, x => { fecharNegocio(x, 'o movimento não pagou as contas'); x.trabalho.atual = undefined; }).vida;
    expect(v.fatos['negocio_aprendizado']).toBe(1);
    v = transacao(v, x => { x.financas.conta = 80000; abrirNegocio(x, criarRng(1), 'lanchonete'); }).vida;
    expect(v.caminhos.negocio!.clientela).toBeGreaterThan(inicial);
  });
  it('mudar o jeito de vender tem espera: não dá para trocar todo ano', () => {
    let v = lanchonete();
    v = executar(v, P('estrategia')).vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'qualidade' }).vida;
    expect(v.caminhos.negocio!.estrategia).toBe('qualidade');
    expect(tenta(v, P('estrategia'))).toBe(false);
  });
});

/* ================================================================ Atleta */

function atleta(semente = 7, habilidade = 80): Vida {
  const v = adulto(20, semente, 'masculino');
  return transacao(v, x => { garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = habilidade; f.interesse = 90; f.meses = 120; f.auge = habilidade; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Esporte Clube Teste'); profissionalizar(x, criarRng(1), 2); }).vida;
}

describe('atleta: contrato, banco, foco, doping abstrato, carreira curta', () => {
  it('o contrato tem prazo e o espaço no time depende do que se joga', () => {
    const v = atleta();
    const es = v.caminhos.esporte!;
    expect(es.contratoAte).toBe(v.t + 24);
    expect(['titular', 'reserva']).toContain(es.espaco);
    expect(modoDoTrabalho(v)).toBe('atleta');
    expect(ids(v)).toContain('forcar');
    expect(ids(v)).not.toContain('pos'); // aos 20, ainda não
    v.eu.tNasc -= 12 * 9;
    expect(ids(v)).toContain('pos');
  });
  it('o contrato vence e a renovação é conversa (decisão), não sorteio silencioso', () => {
    let v = atleta();
    v.caminhos.esporte!.contratoAte = v.t + 12;
    v = transacao(v, x => { x.t += 12; processarEsporte(x, criarRng(5)); }).vida;
    if (v.caminhos.esporte!.fase === 'profissional') expect(v.fatos['esp_renovacao']).toBe(v.t);
  });
  it('reserva: conversar com o treinador entra em destaque', () => {
    const v = atleta(7, 70);
    v.caminhos.esporte!.espaco = 'reserva';
    expect(acoesDoTrabalho(v, disponibilidade).agora.map(x => x.id)).toContain('treinador');
  });
  it('treinar dobrado machuca mais; preservar dura mais (média de várias vidas)', () => {
    let lesF = 0; let lesP = 0; let durF = 0; let durP = 0;
    for (let s = 1; s <= 24; s++) {
      for (const foco of ['forcar', 'preservar'] as const) {
        let v = atleta(s);
        v.caminhos.esporte!.foco = foco;
        let anos = 0;
        for (let k = 0; k < 20 && v.caminhos.esporte?.fase === 'profissional'; k++) {
          v = avancarAno(v).vida;
          while (v.momento) v = responder(v, 'renovar');
          if (v.caminhos.esporte?.fase === 'profissional') { v.caminhos.esporte.foco = foco; anos++; }
        }
        if (foco === 'forcar') { lesF += v.caminhos.esporte!.lesoes; durF += anos; } else { lesP += v.caminhos.esporte!.lesoes; durP += anos; }
      }
    }
    expect(lesF).toBeGreaterThan(lesP);
    expect(durP).toBeGreaterThanOrEqual(durF);
  });
  it('carreiras de atleta não são eternas: ninguém joga profissional aos 42', () => {
    for (let s = 1; s <= 12; s++) {
      let v = atleta(s, 88);
      v.caminhos.esporte!.foco = 'preservar';
      while (!v.morte && idade(v) < 42) { v = avancarAno(v).vida; while (v.momento) v = responder(v, 'renovar'); }
      if (v.morte) continue; // uma vida que acabou antes não diz nada sobre carreira
      expect(v.trabalho.atual?.ocupacaoId).not.toBe('jogador_futebol');
    }
  });
  it('doping: é uma decisão com recusa; aceitar deixa um risco que, cedo ou tarde, vira suspensão — sem descrever o quê', () => {
    const d = PROFISSAO.find(x => x.id === 'esp_doping')!;
    expect(d.tipo).toBe('decisao');
    if (d.tipo !== 'decisao') return;
    const texto = d.texto({} as never);
    expect(texto).not.toMatch(/esteroide|anabol|EPO|hormônio|dose|injeç|microdose|mascarar/i);
    expect(d.opcoes.map(o => o.id)).toEqual(expect.arrayContaining(['recusar', 'aceitar']));
    let suspensos = 0;
    for (let s = 1; s <= 15; s++) {
      let v = atleta(s);
      v.caminhos.esporte!.doping = v.t;
      for (let k = 0; k < 8; k++) { v = avancarAno(v).vida; while (v.momento) v = responder(v, 'renovar'); }
      if (v.fatos['suspenso_doping'] !== undefined) suspensos++;
    }
    expect(suspensos).toBeGreaterThanOrEqual(8);
  });
});

/* ============================================ Farda, serviço público, campo, arte */

describe('farda e serviço público: transferência e remoção com família no meio', () => {
  it('servidor da prefeitura não tem remoção para outra cidade; estadual, depois do probatório, tem', () => {
    const pref = com(adulto(36), 'tecnico_publico', 'concurso');
    pref.t += 48;
    expect(tenta(pref, P('remocao'))).toBe(false);
    let prof = adulto(36);
    formar(prof, 'educacao');
    prof = com(prof, 'professor_concursado', 'concurso');
    prof.trabalho.atual!.tInicio = prof.t - 60;
    expect(prof.trabalho.atual!.empregador).toBe('a rede pública de ensino');
    expect(tenta(prof, P('remocao'))).toBe(true);
  });
  it('remoção atendida muda de cidade SEM perder o cargo', () => {
    for (let s = 1; s < 30; s++) {
      let v = adulto(38, s);
      formar(v, 'educacao');
      v = com(v, 'professor_concursado', 'concurso');
      v.trabalho.atual!.tInicio = v.t - 120;
      const aqui = v.moradia.municipioId;
      v = executar(v, P('remocao')).vida;
      if (!v.momento) continue;
      const pedir = v.momento.opcoes.find(o => o.id === 'pedir');
      if (!pedir || pedir.bloqueio) { v = executar(v, { tipo: 'decidir', opcaoId: 'nao' }).vida; continue; }
      v = executar(v, { tipo: 'decidir', opcaoId: 'pedir' }).vida;
      if (v.moradia.municipioId !== aqui) {
        expect(v.trabalho.atual?.ocupacaoId).toBe('professor_concursado');
        expect(v.trabalho.atual?.municipioId).toBe(v.moradia.municipioId);
        return;
      }
    }
    throw new Error('nenhuma remoção atendida em 30 vidas');
  });
  it('pedir movimentação para perto de quem importa vira, com o tempo, uma transferência para lá', () => {
    let v = adulto(30, 9, 'masculino', 'porto-alegre-rs');
    v.corpo.forma = 80;
    v = com(v, 'sargento', 'concurso');
    const m = v.caminhos.militar!;
    m.forca = 'exercito';
    m.guarnicao = 'manaus-am';
    const mae = vinculosVivos(v).find(x => x.vin.parentesco === 'mae')?.p ?? criarPessoa(v, criarRng(2), { idade: 64, municipioId: 'porto-alegre-rs' });
    if (!v.vinculos[mae.id]) vincular(v, mae, { parentesco: 'mae', origem: 'familia', proximidade: 70 });
    mae.municipioId = 'porto-alegre-rs'; mae.tNasc = v.t - 12 * 66;
    expect(guarnicaoPerto(m.forca, 'porto-alegre-rs')).toBe('porto-alegre-rs');
    v = executar(v, P('movimentacao')).vida;
    expect(v.momento?.situacaoId).toBe('mil_movimentacao');
    v = executar(v, { tipo: 'decidir', opcaoId: 'pedir' }).vida;
    let foi = false;
    for (let k = 0; k < 6 && !foi; k++) {
      v = avancarAno(v).vida;
      while (v.momento) { if (v.momento.situacaoId === 'mil_transferencia') { foi = municipio(v.moradia.municipioId).id !== 'porto-alegre-rs'; v = responder(v, 'familia'); foi = v.moradia.municipioId === 'porto-alegre-rs'; } else v = responder(v); }
    }
    expect(foi).toBe(true);
  });
});

describe('campo e arte: a terra adiante, a obra na rua', () => {
  it('cooperativa custa a cota; crédito rural vira dívida e produção; a sucessão passa a lida para um filho', () => {
    let v = adulto(62);
    v.trabalho.experiencia['campo'] = 200;
    garantirFrente(v, 'campo'); v.caminhos.frentes.campo!.habilidade = 70;
    v = com(v, 'produtor_rural', 'oportunidade');
    iniciarRural(v, 'familia');
    v.financas.conta = 20000;
    expect(tenta(v, P('cooperativa'))).toBe(true);
    v = executar(v, P('cooperativa')).vida;
    expect(v.caminhos.rural!.cooperativa).toBe(true);
    const dividas = v.financas.dividas.length;
    if (tenta(v, P('investir_terra'))) { v = executar(v, P('investir_terra')).vida; expect(v.financas.dividas.length).toBe(dividas + 1); }
    const filho = criarPessoa(v, criarRng(3), { idade: 30, municipioId: v.moradia.municipioId });
    vincular(v, filho, { parentesco: 'filho', origem: 'familia', proximidade: 70 });
    filho.renda = 1500;
    v = executar(v, P('sucessao')).vida;
    expect(v.momento?.situacaoId).toBe('rural_sucessao');
    v = executar(v, { tipo: 'decidir', opcaoId: 'filho' }).vida;
    expect(v.trabalho.atual?.ocupacaoId).not.toBe('produtor_rural');
    expect(v.pessoas[filho.id].ocupacao).toMatch(/produtor/);
  });
  it('turnê pede público; lançar custa dinheiro e mexe no público', () => {
    let v = adulto(28);
    garantirFrente(v, 'musica');
    v.caminhos.frentes.musica!.habilidade = 70;
    v.caminhos.arte = { linguagem: 'musica', nome: 'Varanda', tipo: 'banda', tInicio: v.t - 60, publico: 10, membros: [], ativo: true };
    v.financas.conta = 20000;
    expect(tenta(v, P('estrada'))).toBe(false);
    const antes = v.caminhos.arte.publico;
    v = executar(v, P('lancar')).vida;
    expect(v.caminhos.arte!.publico).toBeGreaterThan(antes);
    expect(tenta(v, P('lancar'))).toBe(false);
  });
});

/* ======================================================= Personalidade e agência */

describe('personalidade só por escolha; acontecimento não decide por você', () => {
  it('puxar o ritmo com criança pequena em casa move "família" para baixo; processar o ano, não', () => {
    let v = adulto(33);
    formar(v, 'educacao');
    v = com(v, 'professor_concursado', 'concurso');
    const bebe = criarPessoa(v, criarRng(5), { idade: 2, municipioId: v.moradia.municipioId });
    vincular(v, bebe, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
    const antes = v.personalidade.tracos.familia;
    const evid = v.personalidade.evidencias.length;
    v = transacao(v, x => { processarProfissao(x, criarRng(1)); }).vida;
    expect(v.personalidade.evidencias.length).toBe(evid);
    v = executar(v, P('ritmo', { valor: 'puxado' })).vida;
    expect(v.personalidade.tracos.familia).toBeLessThan(antes);
  });
  it('nenhuma decisão nova narra, antes da escolha, uma reação que o jogador não escolheu', () => {
    for (const c of PROFISSAO) {
      if (c.tipo !== 'decisao') continue;
      const ctx = { v: lanchonete(), r: criarRng(1), idade: 34, p: {}, g: (m: string) => m, vezes: 0 } as never;
      let texto = '';
      try { texto = c.texto(ctx); } catch { continue; }
      expect(texto, c.id).not.toMatch(/Você (aceitou|recusou|decidiu|escolheu|topou)/);
    }
  });
  it('todas as decisões manuais novas têm pelo menos uma saída que não mexe na vida (desistir, ficar, ainda não)', () => {
    for (const c of PROFISSAO) {
      if (c.tipo !== 'decisao' || !c.manual) continue;
      expect(c.opcoes.length, c.id).toBeGreaterThanOrEqual(2);
    }
  });
});

/* ================================================================== Save */

describe('save v12', () => {
  it('saves v11 reais (motor do PLAYTEST #3) migram, validam, seguem vivendo anos, salvam e reabrem', () => {
    expect(VERSAO_SAVE).toBe(12);
    for (const nome of ['save-v11-negocio.json', 'save-v11-atleta.json', 'save-v11-professora.json']) {
      const bruto = fixture(nome);
      expect(JSON.parse(bruto).versao).toBe(11);
      const r = interpretar(bruto);
      expect(r.tipo, nome).toBe('ok');
      if (r.tipo !== 'ok') continue;
      expect(r.migrado).toBe(true);
      let v = r.vida;
      expect(v.versao).toBe(12);
      if (nome === 'save-v11-negocio.json') {
        const n = v.caminhos.negocio!;
        expect(n.caixa).toBe(0);
        expect(n.porte).toBe(1);
        expect(n.equipe).toEqual([]);
        expect(n.reputacao).toBeGreaterThanOrEqual(10);
        expect(modoDoTrabalho(v)).toBe('negocio');
      }
      if (nome === 'save-v11-atleta.json') {
        const es = v.caminhos.esporte!;
        expect(es.contratoAte).toBeGreaterThan(v.t);
        expect(['titular', 'reserva']).toContain(es.espaco);
      }
      // A tela do trabalho lê a vida migrada sem quebrar.
      expect(leituraDoTrabalho(v).titulo.length).toBeGreaterThan(2);
      expect(() => acoesDoTrabalho(v, disponibilidade)).not.toThrow();
      for (let k = 0; k < 6 && !v.morte; k++) { v = avancarAno(v).vida; while (v.momento) v = responder(v); }
      const de = interpretar(JSON.stringify(v));
      expect(de.tipo).toBe('ok');
      if (de.tipo === 'ok') { expect(de.migrado).toBe(false); expect(de.vida.t).toBe(v.t); }
    }
  });
  it('v10 → v11 → v12: a cadeia antiga continua de pé', () => {
    const r = interpretar(fixture('save-v10-familia.json'));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.versao).toBe(12);
  });
  it('um save v12 com equipe apontando para ninguém é recusado (vai para backup), não corrompe', () => {
    const v = lanchonete();
    v.caminhos.negocio!.equipe = [{ pessoaId: 'fantasma', tInicio: v.t, funcao: 'x', salario: 1000 }];
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('invalido');
  });
});

void idadePessoa;
