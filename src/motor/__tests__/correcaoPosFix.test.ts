/**
 * Correção pós-FIX: pendências do relatório + economia do futebol e do palco.
 *
 * Invariantes e faixas, não números mágicos: o que se exige é o requisito
 * (sobra não é "no limite"; cachê contratado não é renda; estrela é rara e
 * tem trajetória), não a coincidência de uma semente.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { transacao } from '../nucleo';
import { disponibilidade } from '../acoes';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { orcamento, saldoMensal, seguranca } from '../sistemas/dinheiro';
import { acoesDoTrabalho, leituraDoTrabalho } from '../sistemas/profissao';
import { garantirFrente } from '../sistemas/frentes';
import { assinarContrato, entrarNaBase, fecharTemporada, profissionalizar, salarioDoContrato, valorDeMercado } from '../sistemas/esporte';
import { cacheDeApresentacao, temporadaDePalco } from '../sistemas/palco';
import { rendaDeImagem } from '../sistemas/notoriedade';
import { remuneracaoDe } from '../sistemas/renda';

const clone = <T,>(x: T): T => structuredClone(x);

function base(i = 32, semente = 7): Vida {
  const v = adulto(i, { semente });
  v.trabalho.atual = undefined; v.educacao.matricula = undefined; v.educacao.basica = undefined;
  v.caminhos.esporte = undefined; v.caminhos.politica = undefined; v.caminhos.negocio = undefined; v.caminhos.arte = undefined;
  v.financas.dividas = []; v.financas.investimentos = []; v.financas.negativado = false;
  v.rotinas = []; v.processos = []; v.anoAtual = { acoes: [] };
  for (const x of Object.values(v.vinculos)) { x.chamado = undefined; x.romance = undefined; }
  return v;
}
const margem = (v: Vida) => { const o = orcamento(v); return o.sobra / Math.max(1, o.renda); };

/* ================================================================ Segurança financeira */

describe('segurança financeira: a margem do mês e a reserva, pela mesma função', () => {
  it('renda claramente acima das despesas, pouca reserva: não é "no limite"', () => {
    const v = base();
    contratar(v, criarRng(1), ocupacao('medico'));
    v.financas.conta = 3000;
    expect(margem(v)).toBeGreaterThanOrEqual(0.15);
    expect(seguranca(v).nivel).toBe('equilibrado');
    expect(seguranca(v).texto).toMatch(/Sobra/);
  });
  it('equilíbrio apertado (sobra pouca, sem reserva): no limite', () => {
    let achou = false;
    for (let sal = 1800; sal <= 9000 && !achou; sal += 100) {
      const v = base();
      contratar(v, criarRng(1), ocupacao('assistente_adm'));
      v.trabalho.atual!.salario = sal; v.financas.conta = 500;
      const m = margem(v);
      if (m >= 0 && m < 0.15) { achou = true; expect(seguranca(v).nivel).toBe('no_limite'); }
    }
    expect(achou).toBe(true);
  });
  it('déficit mensal sem reserva: apertado; com reserva grande, a leitura diz que a reserva cobre', () => {
    const v = base();
    v.financas.conta = 300;
    expect(orcamento(v).sobra).toBeLessThan(0);
    expect(seguranca(v).nivel).toBe('apertado');
    const rico = clone(v); rico.financas.conta = orcamento(rico).despesa * 6;
    expect(['no_limite', 'seguro']).toContain(seguranca(rico).nivel);
    expect(seguranca(rico).nivel).not.toBe('equilibrado');
  });
  it('dívida relevante: parcelas que levam metade da renda não são "equilíbrio"', () => {
    const v = base();
    contratar(v, criarRng(1), ocupacao('medico'));
    v.financas.conta = 3000;
    const renda = orcamento(v).renda;
    v.financas.dividas.push({ id: 'd1', tipo: 'emprestimo', saldo: 200000, jurosMes: 0.02, parcela: Math.round(renda * 0.5), descricao: 'Empréstimo', tInicio: v.t, prazo: 60 });
    expect(['no_limite', 'apertado']).toContain(seguranca(v).nivel);
  });
  it('invariante em vidas quaisquer: sobra ≥ 15% sem parcela pesada nunca aparece "no limite" nem "apertado"', () => {
    for (let s = 1; s <= 12; s++) {
      const v = adulto(35, { semente: s });
      const o = orcamento(v);
      const parcelas = v.financas.dividas.reduce((t, d) => t + (d.saldo > 0 && d.parcela > 0 ? d.parcela : 0), 0);
      const seg = seguranca(v);
      if (seg.nivel === 'dependente' || seg.nivel === 'no_vermelho') continue;
      if (o.sobra / Math.max(1, o.renda) >= 0.15 && parcelas / Math.max(1, o.renda) < 0.45) expect(['no_limite', 'apertado']).not.toContain(seg.nivel);
      if (o.sobra < 0) expect(seg.nivel).not.toBe('equilibrado');
    }
  });
});

/* ================================================================ Ações sem dinheiro */

describe('ação conhecida sem dinheiro: aparece bloqueada, com o motivo', () => {
  const dentista = (licenca = true) => {
    const v = base(34, 9);
    v.educacao.concluidos.push({ cursoId: 'odontologia', nome: 'Odontologia', nivel: 'superior', area: 'odontologia', tFim: v.t - 60, instituicao: 'x' });
    v.educacao.escolaridade = 'superior'; v.trabalho.experiencia['odontologia'] = 72;
    if (licenca) v.trabalho.licencas.push('cro');
    contratar(v, criarRng(1), ocupacao('dentista'));
    v.trabalho.atual!.clientela = 85;
    v.financas.conta = 0;
    return v;
  };
  it('montar o consultório sem capital: visível, bloqueado, com o porquê', () => {
    const v = dentista();
    const a = acoesDoTrabalho(v, disponibilidade);
    const x = [...a.agora, ...a.mais].find(y => y.id === 'negocio');
    expect(x).toBeDefined();
    expect(x!.bloqueado).toMatch(/capital/);
    // Com dinheiro, a mesma ação fica ativa.
    const rico = clone(v); rico.financas.conta = 200000;
    const y = [...acoesDoTrabalho(rico, disponibilidade).agora, ...acoesDoTrabalho(rico, disponibilidade).mais].find(z => z.id === 'negocio');
    expect(y?.bloqueado).toBeUndefined();
  });
  it('o que ainda não é elegível (sem registro no conselho) não é revelado', () => {
    const v = dentista(false);
    v.financas.conta = 200000;
    const a = acoesDoTrabalho(v, disponibilidade);
    expect([...a.agora, ...a.mais].some(y => y.id === 'negocio')).toBe(false);
  });
});

/* ================================================================ Futebol */

function jogador(o: { semente?: number; idade?: number; h?: number; nivel?: number; rep?: number; noto?: number; clube?: string; espaco?: 'titular' | 'reserva'; nota?: number } = {}): Vida {
  const v = base(o.idade ?? 26, o.semente ?? 11);
  return transacao(v, x => {
    garantirFrente(x, 'futebol');
    const f = x.caminhos.frentes.futebol!; f.habilidade = o.h ?? 80; f.meses = 140; f.auge = f.habilidade; f.interesse = 90;
    entrarNaBase(x, 'futebol', x.moradia.municipioId, o.clube ?? 'Bahia');
    profissionalizar(x, criarRng(1), 4);
    const e = x.caminhos.esporte!;
    e.clube = o.clube ?? 'Bahia'; e.nivel = (o.nivel ?? 4) as 1 | 2 | 3 | 4; e.reputacao = o.rep ?? 50; e.espaco = o.espaco ?? 'titular';
    if (o.nota !== undefined) e.temporadas = [{ ano: 2050, clube: e.clube, nivel: e.nivel, posicao: 'meia', partidas: 30, titular: 25, gols: 5, assistencias: 5, nota: o.nota, colocacao: 8, mesesFora: 0 }];
    if (o.noto) x.notoriedade = { valor: o.noto, pico: o.noto, fonte: 'esporte', t: x.t };
    assinarContrato(x, e, 24);
  }).vida;
}

describe('futebol: distribuição, não tabela por divisão', () => {
  it('dois titulares da mesma divisão ganham diferente: o jovem recém-promovido × o consolidado', () => {
    const jovem = jogador({ idade: 19, rep: 25, nota: 6 });
    const consolidado = jogador({ idade: 28, rep: 70, nota: 7.5 });
    expect(consolidado.trabalho.atual!.salario).toBeGreaterThan(jovem.trabalho.atual!.salario * 3);
  });
  it('reputação e temporada melhores elevam o valor de mercado e o contrato', () => {
    const a = jogador({ rep: 40, nota: 5.5 });
    const b = jogador({ rep: 65, nota: 7.8 });
    expect(valorDeMercado(b, b.caminhos.esporte!)).toBeGreaterThan(valorDeMercado(a, a.caminhos.esporte!));
    expect(b.trabalho.atual!.salario).toBeGreaterThan(a.trabalho.atual!.salario);
  });
  it('a estrela de clube grande ganha muitas vezes o titular comum — e isso exige nome, fama e clube; clube menor paga menos pela mesma estrela', () => {
    const comum = jogador({ rep: 50, nota: 6.5 });
    const estrela = jogador({ rep: 97, noto: 88, nota: 9 });
    const semFama = jogador({ rep: 97, nota: 9 });
    const clubeMenor = jogador({ rep: 97, noto: 88, nota: 9, clube: 'Ferroviário' });
    expect(estrela.trabalho.atual!.salario).toBeGreaterThan(comum.trabalho.atual!.salario * 10);
    expect(estrela.trabalho.atual!.salario).toBeGreaterThan(semFama.trabalho.atual!.salario * 2);
    expect(estrela.trabalho.atual!.salario).toBeGreaterThan(clubeMenor.trabalho.atual!.salario * 2);
  });
  it('divisão baixa: renda baixa e contrato curto (não é emprego estável)', () => {
    const v = jogador({ nivel: 1, rep: 12, espaco: 'reserva', clube: 'Ferroviário', nota: 5 });
    expect(v.trabalho.atual!.salario).toBeLessThan(4000);
    expect(v.caminhos.esporte!.contratoAte! - v.t).toBeLessThanOrEqual(12);
    const elite = jogador({ rep: 60 });
    expect(elite.caminhos.esporte!.contratoAte! - elite.t).toBeGreaterThan(12);
  });
  it('patrocínio é outra renda: linha própria, fora do salário do contrato', () => {
    const v = jogador({ rep: 90, noto: 80, nota: 8.5 });
    const img = rendaDeImagem(v);
    expect(img).toBeGreaterThan(0);
    const linhas = saldoMensal(v).linhas;
    expect(linhas.some(l => l.rotulo === 'Patrocínio e publicidade' && l.valor === img)).toBe(true);
    expect(linhas.some(l => /Salário|Renda do trabalho/.test(l.rotulo) && l.valor === remuneracaoDe(v.trabalho.atual!).mediaMensal)).toBe(true);
    expect(leituraDoTrabalho(v).renda).toContain(remuneracaoDe(v.trabalho.atual!).liquido.toLocaleString('pt-BR'));
    expect(v.trabalho.atual!.salario).toBe(salarioDoContrato(v, v.caminhos.esporte!));
  });
  it('a nota da temporada entra no contrato seguinte (fecharTemporada → salário)', () => {
    const v = jogador({ rep: 55 });
    fecharTemporada(v, criarRng(2), v.caminhos.esporte!);
    const x = transacao(v, y => assinarContrato(y, y.caminhos.esporte!, 24)).vida;
    expect(x.trabalho.atual!.salario).toBe(salarioDoContrato(x, x.caminhos.esporte!));
  });
});

/* ================================================================ Palco */

function musico(o: { hab: number; publico: number; noto?: number; semente?: number }): Vida {
  const v = base(28, o.semente ?? 13);
  return transacao(v, x => {
    garantirFrente(x, 'musica'); x.caminhos.frentes.musica!.habilidade = o.hab;
    x.rotinas = [{ id: 'musica', tInicio: x.t, nivel: 3 }];
    x.caminhos.arte = { linguagem: 'musica', nome: 'Maré', tipo: 'banda', tInicio: x.t - 60, publico: o.publico, membros: [], ativo: true };
    contratar(x, criarRng(1), ocupacao(o.publico >= 55 ? 'musico_profissional' : 'musico_noite'));
    x.trabalho.atual!.clientela = o.publico;
    if (o.noto) x.notoriedade = { valor: o.noto, pico: o.noto, fonte: 'arte', t: x.t };
  }).vida;
}

describe('palco: valor contratado ≠ renda do artista', () => {
  it('o que o contratante paga não é o que fica: custos saem, e a renda do trabalho é o que ficou', () => {
    for (let s = 1; s <= 8; s++) {
      const v = transacao(musico({ hab: 80, publico: 60, semente: s }), (x, r) => { temporadaDePalco(x, r); }).vida;
      const p = v.caminhos.palco!;
      if (!p.apresentacoes) continue;
      expect(p.artista).toBeLessThan(p.bruto);
      expect(p.custos).toBe(p.bruto - p.artista);
      expect(v.trabalho.atual!.salario).toBe(Math.round(p.artista / 12 / 10) * 10);
      expect(leituraDoTrabalho(v).renda).toMatch(/conforme os trabalhos/);
    }
  });
  it('quem começa não recebe cachê de estrela; o caso excepcional pode chegar perto do milhão (bruto)', () => {
    expect(cacheDeApresentacao(musico({ hab: 45, publico: 5 }), 'musica')).toBeLessThan(6000);
    const topo = cacheDeApresentacao(musico({ hab: 95, publico: 98, noto: 97 }), 'musica');
    expect(topo).toBeGreaterThan(500000);
    const famoso = cacheDeApresentacao(musico({ hab: 85, publico: 75, noto: 70 }), 'musica');
    expect(famoso).toBeGreaterThan(100000);
    expect(famoso).toBeLessThan(topo);
  });
  it('a carreira é irregular: o mesmo artista tem anos muito diferentes', () => {
    const ganhos: number[] = [];
    let v = musico({ hab: 80, publico: 55 });
    for (let k = 0; k < 10; k++) { v = transacao(v, x => { x.t += 12; temporadaDePalco(x, criarRng(100 + k)); }).vida; ganhos.push(v.caminhos.palco!.artista); }
    expect(Math.max(...ganhos)).toBeGreaterThan(Math.min(...ganhos) * 2.5);
  });
  it('publicidade da arte é linha separada; a banda que toca por fora aparece como shows, não como salário', () => {
    const famosa = musico({ hab: 88, publico: 80, noto: 75 });
    expect(saldoMensal(famosa).linhas.some(l => l.rotulo === 'Patrocínio e publicidade')).toBe(true);
    const hobby = transacao(musico({ hab: 70, publico: 40 }), (x, r) => { contratar(x, criarRng(2), ocupacao('assistente_adm')); temporadaDePalco(x, r); }).vida;
    if (hobby.caminhos.palco!.apresentacoes) expect(saldoMensal(hobby).linhas.some(l => /Shows e apresentações/.test(l.rotulo))).toBe(true);
    expect(hobby.trabalho.atual!.ocupacaoId).toBe('assistente_adm');
  });
  it('determinismo: mesmo estado + mesmo gerador = mesmo ano de palco', () => {
    const a = transacao(musico({ hab: 80, publico: 60 }), x => { temporadaDePalco(x, criarRng(5)); }).vida;
    const b = transacao(musico({ hab: 80, publico: 60 }), x => { temporadaDePalco(x, criarRng(5)); }).vida;
    expect(a.caminhos.palco).toEqual(b.caminhos.palco);
  });
});
