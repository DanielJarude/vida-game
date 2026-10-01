/**
 * Pacote consolidado pós-playtest (REWORK 3 + FIX + FIX 3.1 + hotfix).
 * Testes CAUSAIS: atravessam sistemas — gerar → persistir → exibir →
 * decidir → executar → consequência → biografia → save/reload.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { responderTudo } from './ajuda';
import { executar, disponibilidade } from '../acoes';
import { avancarAno } from '../ano';
import { exportarVida, importarVida } from '../save';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { garantirFrente } from '../sistemas/frentes';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { municipio } from '../dados/lugares';
import { oClube } from '../dados/clubes';
import { criarProposta, entrarNaBase, processarEsporte, profissionalizar, propostaNaMesa } from '../sistemas/esporte';
import { processarOportunidades } from '../sistemas/oportunidades';
import { mercadoDoTrabalho, oportunidadeCoerente, oportunidadesAbertas } from '../sistemas/mercados';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';
import { anoDaAtividade, pesoNaSelecaoDoIf, vivenciaQuePesa } from '../sistemas/formacao';
import { estadoDoArco } from '../sistemas/arcos';
import { garantirFrente as frente } from '../sistemas/frentes';
import { contextoDaRelacao, pesoDoContexto } from '../sistemas/relacoes';
import { interacoesPara } from '../sistemas/interacoes';
import { avaliarTemporada, leituraDoPalmares, registrarTemporada } from '../sistemas/palmares';
import type { Temporada } from '../tipos';
import { encerrarCarreira } from '../sistemas/esporte';
import { leituraDoNome, origemDoNome, processarNotoriedade } from '../sistemas/notoriedade';
import { entrarNaPolitica, leituraPolitica, fatoresDaEleicao, basePartidaria } from '../sistemas/politica';
import { comprarItem } from '../sistemas/estilo';
import { distribuicao, intencoesDe, modeloDaSituacao, resolverSituacao } from '../sistemas/situacoes';
import { custoDaExperiencia, escolhasDaExperiencia } from '../sistemas/experiencias';

export const recarregar = (v: Vida): Vida => { const l = importarVida(exportarVida(v)); if (l.tipo !== 'ok') throw new Error(`save: ${l.tipo}`); return l.vida; };

/** Jogador profissional de futebol, num clube da própria cidade (Campina Grande, o Treze), morando por conta. */
export function jogadorPro(o: { semente?: number; idade?: number; habilidade?: number; nivel?: number; municipioId?: string; clube?: string } = {}): Vida {
  const municipioId = o.municipioId ?? 'campina-grande-pb';
  const v = adulto(o.idade ?? 23, { semente: o.semente ?? 5, genero: 'masculino', municipioId });
  return transacao(v, x => {
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: o.habilidade ?? 84, interesse: 90, meses: 140, auge: o.habilidade ?? 84 });
    x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined;
    entrarNaBase(x, 'futebol', municipioId, o.clube ?? 'Treze');
    profissionalizar(x, criarRng(1), o.nivel ?? 2);
    x.momento = null; x.caminhos.pendente = undefined;
  }).vida;
}

const abrir = (v: Vida, id: string): Vida => transacao(v, (x, r) => { const d = conteudoPorId(id); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
const decidir = (v: Vida, opcaoId: string): Vida => executar(v, { tipo: 'decidir', opcaoId }).vida;

describe('A · P0: a proposta aceita é a proposta executada', () => {
  it('gerar → salvar → recarregar → aceitar: clube, cidade, divisão, contrato, salário e Linha da Vida são os da proposta', () => {
    let v = jogadorPro();
    const antes = v.caminhos.esporte!.clube;
    // A. gerar: a proposta concreta é criada UMA vez e persistida.
    v = transacao(v, x => { criarProposta(x, x.caminhos.esporte!, 3, 'mercado'); x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    const p = propostaNaMesa(v)!;
    expect(p).toBeTruthy();
    expect(p.clube).not.toBe(antes);
    // A decisão exibe ESTA proposta.
    v = abrir(v, 'esp_proposta');
    expect(v.momento?.texto).toContain(p.clube);
    expect(v.momento?.texto).toContain(municipio(p.municipioId).nome);
    const aceitar = v.momento!.opcoes.find(o => o.id === 'aceitar')!;
    expect(aceitar.detalhe).toContain(p.salario.toLocaleString('pt-BR').split(',')[0]);
    // B/C. salvar e recarregar: a proposta e a decisão continuam as mesmas.
    v = recarregar(v);
    expect(propostaNaMesa(v)).toEqual(p);
    expect(v.momento?.texto).toContain(p.clube);
    // D. aceitar.
    const bio0 = v.biografia.length;
    v = decidir(v, 'aceitar');
    v = responderTudo(v);
    // E. a proposta A foi executada exatamente.
    const es = v.caminhos.esporte!;
    expect(es.clube).toBe(p.clube);
    expect(es.nivel).toBe(p.nivel);
    expect(es.contratoAte).toBe(v.t + p.meses);
    expect(es.proposta).toBeUndefined();
    expect(v.trabalho.atual!.empregador).toBe(oClube(p.clube));
    expect(v.trabalho.atual!.salario).toBe(p.espaco === 'titular' ? p.salarioTitular : p.salario);
    if (p.municipioId !== 'campina-grande-pb') {
      expect(v.moradia.municipioId).toBe(p.municipioId);
      expect(v.trabalho.atual!.municipioId).toBe(p.municipioId);
    }
    const novas = v.biografia.slice(bio0).map(e => e.texto).join(' | ');
    expect(novas).toContain(p.clube);
    // Nenhum OUTRO clube aparece na biografia da transferência.
    const outros = ['CRB', 'CSA', 'Remo', 'Paysandu', 'Sport', 'Náutico', 'Santa Cruz'].filter(c => c !== p.clube);
    for (const c of outros) expect(novas).not.toContain(` ${c}`);
    // Save/reload depois: o contrato continua o da proposta.
    const r = recarregar(v);
    expect(r.caminhos.esporte!.clube).toBe(p.clube);
    expect(r.trabalho.atual!.salario).toBe(v.trabalho.atual!.salario);
  });

  it('a proposta B nunca altera a A: não sobrescreve a que espera resposta, nem desfaz a que foi aceita', () => {
    let v = jogadorPro({ semente: 9 });
    v = transacao(v, x => { criarProposta(x, x.caminhos.esporte!, 3, 'mercado'); }).vida;
    const a = propostaNaMesa(v)!;
    // Enquanto A espera, B não nasce por cima.
    v = transacao(v, x => { expect(criarProposta(x, x.caminhos.esporte!, 3, 'maior')).toBeUndefined(); }).vida;
    expect(propostaNaMesa(v)).toEqual(a);
    v = transacao(v, x => { x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    v = decidir(abrir(v, 'esp_proposta'), 'aceitar');
    v = responderTudo(v);
    expect(v.caminhos.esporte!.clube).toBe(a.clube);
    const salarioA = v.trabalho.atual!.salario;
    // Depois, surge B: fica na mesa, A continua sendo o contrato vigente.
    v = transacao(v, x => { x.t += 12; criarProposta(x, x.caminhos.esporte!, 4, 'mercado'); }).vida;
    const b = propostaNaMesa(v)!;
    expect(b.id).not.toBe(a.id);
    expect(v.caminhos.esporte!.clube).toBe(a.clube);
    expect(v.trabalho.atual!.salario).toBe(salarioA);
    // Recusar B não mexe em A.
    v = transacao(v, x => { x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    v = abrir(v, 'esp_proposta');
    const recusa = v.momento!.opcoes.find(o => o.id === 'recusar' || o.id === 'ficar')!;
    v = decidir(v, recusa.id);
    expect(v.caminhos.esporte!.clube).toBe(a.clube);
    expect(propostaNaMesa(v)).toBeUndefined();
  });

  it('no fluxo natural (a temporada gera a proposta), o clube aceito é o clube exibido', () => {
    let checados = 0;
    for (let s = 1; s <= 40 && checados < 4; s++) {
      let v = jogadorPro({ semente: s, habilidade: 90, nivel: 2 });
      v.caminhos.esporte!.reputacao = 70;
      for (let k = 0; k < 4 && !v.momento; k++) v = avancarAno(v).vida;
      if (v.momento?.situacaoId !== 'esp_proposta') continue;
      const p = propostaNaMesa(v)!;
      expect(v.momento.texto).toContain(p.clube);
      const op = v.momento.opcoes.find(o => o.id === 'aceitar')!;
      v = recarregar(v);
      v = responderTudo(decidir(v, op.id));
      expect(v.caminhos.esporte!.clube).toBe(p.clube);
      if (p.municipioId !== 'campina-grande-pb') expect(v.moradia.municipioId).toBe(p.municipioId);
      checados++;
    }
    expect(checados).toBeGreaterThan(0);
  });

  it('a volta de quem ficou sem clube assina com o clube DA proposta (não com o da base) e não é "o primeiro contrato"', () => {
    let v = jogadorPro({ semente: 3 });
    v = transacao(v, (x, r) => {
      const es = x.caminhos.esporte!;
      x.trabalho.atual = undefined; x.fatos['esp_sem_clube'] = x.t; es.reputacao = 45; es.espaco = undefined; es.contratoAte = undefined;
      x.t += 12; processarEsporte(x, r);
    }).vida;
    const p = propostaNaMesa(v)!;
    expect(p?.origem).toBe('sem_clube');
    const op = v.caminhos.oportunidades.find(o => o.titulo === 'Um clube ligou')!;
    expect(op.texto).toContain(p.clube);
    const bio0 = v.biografia.length;
    v = executar(v, { tipo: 'oportunidade', id: op.id, aceitar: true }).vida;
    v = responderTudo(v, 'assinar');
    expect(v.caminhos.esporte!.clube).toBe(p.clube);
    const novas = v.biografia.slice(bio0);
    expect(novas.some(e => /primeiro contrato/.test(e.texto))).toBe(false);
    expect(novas.some(e => e.texto.includes(`Voltou a jogar: assinou com ${oClube(p.clube)}`))).toBe(true);
  });
});

describe('B · P0: carreira especial não recebe portas do emprego comum', () => {
  it('o jogador profissional nunca recebe "um concorrente quer você", nem indicação de emprego', () => {
    const v = jogadorPro({ semente: 4 });
    expect(mercadoDoTrabalho(v)).toBe('esporte');
    const x = transacao(v, (y, r) => {
      const e = y.trabalho.atual!;
      e.desempenho = 95; y.trabalho.experiencia[ocupacao(e.ocupacaoId).trilha] = 200;
      for (let k = 0; k < 40; k++) { y.caminhos.ultimas = {}; y.t += 12; processarOportunidades(y, r); }
    }).vida;
    const genericas = x.caminhos.oportunidades.filter(o => ['proposta', 'indicacao', 'vaga', 'aprendiz', 'estagio', 'temporario'].includes(o.tipo));
    expect(genericas).toEqual([]);
  });

  it('a porta incoerente que um save antigo trouxe: não aparece, não é aceita (com o motivo) e some na virada do ano', () => {
    let v = jogadorPro({ semente: 6 });
    v.caminhos.oportunidades.push({ id: 'op_velha', tipo: 'proposta', titulo: 'Uma proposta', texto: 'Uma concorrente quer você para a mesma função, com salário melhor.', tInicio: v.t, tFim: v.t + 12, ocupacaoId: 'jogador_futebol', bonus: 0.18 });
    v = recarregar(v);
    expect(oportunidadesAbertas(v).some(o => o.id === 'op_velha')).toBe(false);
    const d = disponibilidade(v, { tipo: 'oportunidade', id: 'op_velha', aceitar: true });
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/clube/);
    v = avancarAno(v).vida;
    expect(v.caminhos.oportunidades.some(o => o.id === 'op_velha')).toBe(false);
  });

  it('o emprego comum continua recebendo a proposta do concorrente — e a "mesma função" não esbarra em "você já trabalha nisso"', () => {
    let v = adulto(32, { semente: 8 });
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('vendedor')); x.trabalho.atual!.desempenho = 90; x.trabalho.experiencia['comercio'] = 120; }).vida;
    expect(mercadoDoTrabalho(v)).toBe('emprego');
    expect(oportunidadeCoerente(v, { tipo: 'proposta' })).toBe(true);
    v.caminhos.oportunidades.push({ id: 'op_conc', tipo: 'proposta', titulo: 'Uma proposta', texto: 'Uma concorrente quer você para a mesma função, com salário melhor.', tInicio: v.t, tFim: v.t + 12, ocupacaoId: v.trabalho.atual!.ocupacaoId, bonus: 0.18 });
    const d = disponibilidade(v, { tipo: 'oportunidade', id: 'op_conc', aceitar: true });
    expect(d.motivo ?? '').not.toMatch(/já trabalha nisso/);
    expect(podeTentar(d)).toBe(true);
  });

  it('atriz, pesquisadora e militar também ficam fora das portas do emprego comum', () => {
    for (const oc of ['ator', 'pesquisador', 'professor_univ']) {
      let v = adulto(30, { semente: 12 });
      v = transacao(v, (x, r) => { contratar(x, r, ocupacao(oc), 'oportunidade'); }).vida;
      expect(oportunidadeCoerente(v, { tipo: 'indicacao' })).not.toBe(true);
      expect(oportunidadeCoerente(v, { tipo: 'proposta' })).not.toBe(true);
    }
  });
});

/* ======================================================================= C */

/** Um estudante de 12 anos numa escola, com as frentes que a atividade pede. */
function estudante(semente = 21, dominios: Partial<Record<string, number>> = {}): Vida {
  const v = adulto(12, { semente });
  return transacao(v, x => {
    for (const [d, h] of Object.entries(dominios)) { frente(x, d as never); Object.assign(x.caminhos.frentes[d as never]!, { habilidade: h, interesse: 80, meses: 40 }); }
    x.momento = null;
  }).vida;
}

describe('C · atividade com história interna', () => {
  it('entrar no time → permanecer → a vaga, o destaque, o campeonato; o marco persiste e pesa depois (na peneira)', () => {
    let v = estudante(21, { futebol: 70, lideranca: 50 });
    v.rotinas.push({ id: 'time_escola', tInicio: v.t, nivel: 1, instituicao: 'escola' });
    const etapas = new Set<string>();
    for (let k = 0; k < 5; k++) v = transacao(v, x => { x.t += 12; anoDaAtividade(x, 'time_escola', 1); const viv = x.educacao.vivencias!.find(y => y.tipo === 'time'); if (viv?.etapa) etapas.add(viv.etapa); }).vida;
    const viv = v.educacao.vivencias!.find(y => y.tipo === 'time')!;
    expect(etapas.has('treinos')).toBe(true);
    expect([...etapas].some(e => e === 'titular' || e === 'destaque' || e === 'capitao')).toBe(true);
    expect(viv.anos).toBeGreaterThanOrEqual(4);
    expect(viv.marcos?.length).toBeGreaterThan(0);
    expect(estadoDoArco('time_escola', viv)).toBeTruthy();
    // Consequência posterior real: o destaque do time da escola é visto por quem indica para a peneira.
    const peneiras = (comDestaque: boolean) => {
      let n = 0;
      for (let s = 1; s <= 120; s++) {
        const w = transacao(estudante(5), (x) => {
          frente(x, 'futebol'); Object.assign(x.caminhos.frentes.futebol!, { habilidade: 58, interesse: 80, meses: 40 });
          x.rotinas = [{ id: 'futebol', tInicio: x.t - 24, nivel: 2 }];
          x.caminhos.oportunidades = []; x.caminhos.ultimas = {};
          if (comDestaque) x.fatos['destaque_escolar_futebol'] = x.t;
          x.fatos[`destaque_futebol`] = x.t;
          processarEsporte(x, criarRng(s));
        }).vida;
        if (w.caminhos.oportunidades.some(o => o.tipo === 'peneira')) n++;
      }
      return n;
    };
    expect(peneiras(true)).toBeGreaterThan(peneiras(false));
    // Save/reload: a história continua a mesma.
    expect(recarregar(v).educacao.vivencias!.find(y => y.tipo === 'time')).toEqual(viv);
  });

  it('olimpíada: preparação → fases; a medalha (quando vem) pesa na prova do instituto federal; robótica premiada pesa em engenharia', () => {
    let medalhas = 0, fases = 0;
    for (let s = 1; s <= 12; s++) {
      let v = estudante(30 + s, { exatas: 72, ciencias: 66 });
      v.rotinas.push({ id: 'olimpiada', tInicio: v.t, nivel: 2, instituicao: 'escola' });
      for (let k = 0; k < 4; k++) v = transacao(v, x => { x.t += 12; anoDaAtividade(x, 'olimpiada', 2); }).vida;
      const viv = v.educacao.vivencias!.find(y => y.tipo === 'olimpiada')!;
      if (viv.etapa && viv.etapa !== 'preparacao') fases++;
      if (viv.feito?.startsWith('medalha')) { medalhas++; expect(pesoNaSelecaoDoIf(v)).toBeGreaterThan(0); }
    }
    expect(fases).toBeGreaterThan(0);
    expect(medalhas).toBeGreaterThan(0);
    expect(medalhas).toBeLessThan(12); // não é garantido
    // Robótica: a história chega a um prêmio para quem tem o que ela pede — e conta na vaga de engenharia.
    let v = estudante(77, { ciencias: 85, exatas: 85, programacao: 85 });
    v.rotinas.push({ id: 'clube_ciencias', tInicio: v.t, nivel: 1, instituicao: 'escola' });
    for (let k = 0; k < 6; k++) v = transacao(v, x => { x.t += 12; anoDaAtividade(x, 'clube_ciencias', 1); }).vida;
    const rob = v.educacao.vivencias!.find(y => y.tipo === 'ciencias')!;
    expect(['competicao', 'premiado']).toContain(rob.etapa);
    expect(vivenciaQuePesa(v, { trilha: 'engenharia', setor: 'engenharia', area: ['engenharia'] }).bonus).toBeGreaterThan(0);
  });
});

/* ======================================================================= D */

describe('D · romance pelo aplicativo: contexto próprio, resultado aberto', () => {
  it('match → conversa → encontro: pode evoluir ou acabar; o contexto e a trajetória persistem', () => {
    let evoluiu = 0, acabou = 0, matches = 0;
    for (let s = 1; s <= 60; s++) {
      let v = adulto(26, { semente: 100 + s });
      v.eu.atracao = 'homens';
      v = executar(v, { tipo: 'conhecer_alguem', contexto: 'app' }).vida;
      const x = Object.values(v.vinculos).find(vin => vin.contexto?.via === 'app' && vin.romance?.estagio === 'interesse');
      if (!x) continue;
      matches++;
      expect(x.contexto!.etapa).toBe('match');
      expect(['relacionamento', 'casual', 'incerto']).toContain(x.contexto!.busca);
      expect(x.fases?.map(f => f.fase)).toContain('match');
      // O convite genérico não atravessa o caminho do app.
      expect(interacoesPara(v, x.pessoaId).map(i => i.id)).not.toContain('convidar');
      expect(interacoesPara(v, x.pessoaId).map(i => i.id)).toContain('app_conversar');
      v = executar(v, { tipo: 'pessoa', pessoaId: x.pessoaId, interacao: 'app_conversar' }).vida;
      const y = v.vinculos[x.pessoaId];
      if (y.contexto?.etapa !== 'conversa') { acabou++; continue; }
      v = executar(v, { tipo: 'pessoa', pessoaId: x.pessoaId, interacao: 'app_encontro' }).vida;
      const z = v.vinculos[x.pessoaId];
      expect(z.contexto?.quimica).toBeTypeOf('number');
      if (z.romance?.estagio === 'saindo') evoluiu++; else if (!z.romance || z.contexto?.etapa === 'encerrado') acabou++;
      // A história persiste (save/reload).
      const r = recarregar(v).vinculos[x.pessoaId];
      expect(r.contexto).toEqual(z.contexto);
      expect(r.fases).toEqual(z.fases);
    }
    expect(matches).toBeGreaterThan(5);
    expect(evoluiu).toBeGreaterThan(0);
    expect(acabou).toBeGreaterThan(0);
  });

  it('a origem define a abertura inicial, não o resultado: app > trabalho; saves antigos derivam o contexto da origem', () => {
    const v = adulto(30, { semente: 9 });
    const base = { pessoaId: 'x', tInicio: v.t, proximidade: 30, confianca: 30, tensao: 0, convivio: [], tUltimoContato: v.t, historia: [] };
    const app = { ...base, origem: 'online' as const };
    const trab = { ...base, origem: 'trabalho' as const };
    expect(contextoDaRelacao(v, app).via).toBe('app');
    expect(contextoDaRelacao(v, trab).via).toBe('trabalho');
    expect(pesoDoContexto(v, app)).toBeGreaterThan(pesoDoContexto(v, trab));
  });
});

/* ======================================================================= E, F */

const temporada = (o: Partial<Temporada>): Temporada => ({ ano: 2045, clube: 'São Paulo', nivel: 4, posicao: 'volante', partidas: 32, titular: 28, gols: 2, assistencias: 3, defesa: 68, nota: 7.8, colocacao: 1, mesesFora: 0, ...o });

describe('E · título: conquista permanente', () => {
  it('campeão → palmarés (protagonista) → aparece na carreira → Linha da Vida → save/reload', () => {
    let v = jogadorPro({ semente: 14, clube: 'São Paulo', municipioId: 'sao-paulo-sp', nivel: 4 });
    const bio0 = v.biografia.length;
    v = transacao(v, (x, r) => { const e = x.caminhos.esporte!; const t = temporada({ clube: e.clube }); (e.temporadas ??= []).push(t); registrarTemporada(x, r, e, t); }).vida;
    const tit = v.caminhos.palmares!.find(c => c.tipo === 'titulo')!;
    expect(tit.papel).toBe('protagonista');
    expect(tit.competicao).toBe('Série A');
    expect(leituraDoPalmares(v).titulos.join(' ')).toMatch(/Série A/);
    expect(v.biografia.slice(bio0).some(b => /^Campeão da Série A com o São Paulo: 32 jogos, 28 como titular/.test(b.texto))).toBe(true);
    expect(recarregar(v).caminhos.palmares).toEqual(v.caminhos.palmares);
  });

  it('campeão reserva ≠ campeão protagonista', () => {
    let v = jogadorPro({ semente: 15, clube: 'São Paulo', municipioId: 'sao-paulo-sp', nivel: 4 });
    v = transacao(v, (x, r) => { const e = x.caminhos.esporte!; const t = temporada({ clube: e.clube, partidas: 9, titular: 2, defesa: 8, nota: 6.1 }); (e.temporadas ??= []).push(t); registrarTemporada(x, r, e, t); }).vida;
    const tit = v.caminhos.palmares!.find(c => c.tipo === 'titulo')!;
    expect(tit.papel).toBe('elenco');
    expect(v.biografia.some(b => /como parte do elenco/.test(b.texto))).toBe(true);
    expect(v.caminhos.palmares!.some(c => c.tipo === 'premio')).toBe(false);
  });
});

describe('F · a avaliação da temporada lê a posição', () => {
  it('o volante de temporada excelente é avaliado por titularidade, desarmes e o time — não por gols', () => {
    const e = jogadorPro({ semente: 16 }).caminhos.esporte!;
    const desarmador = avaliarTemporada(e, temporada({ gols: 0, assistencias: 2, defesa: 74, nota: 7.6, colocacao: 3 }));
    const artilheiro = avaliarTemporada(e, temporada({ gols: 7, assistencias: 2, defesa: 22, nota: 7.6, colocacao: 3 }));
    expect(desarmador.indice).toBeGreaterThan(artilheiro.indice);
    // O mesmo número de gols num atacante vale outra coisa.
    const atacante = avaliarTemporada({ ...e, posicao: 'atacante' }, temporada({ posicao: 'atacante', gols: 0, assistencias: 2, defesa: 3, nota: 7.6, colocacao: 3 }));
    expect(atacante.indice).toBeLessThan(desarmador.indice);
  });
});

/* ======================================================================= G, H */

describe('G · a fama atravessa a troca de carreira (e não vira apoio sozinha)', () => {
  it('famoso → aposenta → decai devagar → entra na política: nome conhecido, base própria', () => {
    let v = jogadorPro({ semente: 18, clube: 'São Paulo', municipioId: 'sao-paulo-sp', nivel: 4, idade: 33 });
    v = transacao(v, x => { x.caminhos.esporte!.reputacao = 85; x.caminhos.esporte!.espaco = 'titular'; for (let k = 0; k < 6; k++) processarNotoriedade(x); }).vida;
    const auge = v.notoriedade!.valor;
    expect(auge).toBeGreaterThanOrEqual(55);
    v = transacao(v, x => { encerrarCarreira(x, x.caminhos.esporte!, 'escolha'); for (let k = 0; k < 3; k++) { x.t += 12; processarNotoriedade(x); } }).vida;
    expect(v.notoriedade!.valor).toBeLessThan(auge);
    expect(v.notoriedade!.valor).toBeGreaterThan(auge * 0.45);
    expect(origemDoNome(v)).toBe('esporte');
    v = transacao(v, x => { entrarNaPolitica(x, 'notoriedade'); x.t += 12; processarNotoriedade(x); }).vida;
    // A origem do nome continua a mesma; a tela política diz o nome do PÚBLICO e a presença política à parte.
    expect(origemDoNome(v)).toBe('esporte');
    const l = leituraPolitica(v)!;
    expect(l.publico).toMatch(/famos|reconhecid/);
    expect(l.publico).toMatch(/futebol/);
    expect(l.reputacao).not.toMatch(/pouco conhecid/);
    expect(leituraDoNome(v)!.frase).toBe(l.publico);
    // A base é outra conta: fama não vira apoio, nem lugar no partido.
    const p = v.caminhos.politica!;
    expect(p.apoio).toBeLessThan(20);
    expect(basePartidaria(v)).toBe(0);
    // Mas o eleitor reconhece o nome (a notoriedade pesa no fator do nome, não na base).
    const nome = fatoresDaEleicao(v, 'vereador', v.t + 12).fatores.find(f => f.id === 'nome')!.valor;
    expect(nome).toBeGreaterThan(p.reputacao * 0.22);
    expect(recarregar(v).notoriedade).toEqual(v.notoriedade);
  });
});

describe('H · luxo não cria fama', () => {
  it('famoso compra relógio: a notoriedade não sobe, e o texto não diz que ninguém o conhece', () => {
    let v = adulto(35, { semente: 19 });
    v = transacao(v, x => { x.financas.conta = 200000; x.notoriedade = { valor: 70, pico: 70, fonte: 'esporte', t: x.t, origens: { esporte: 70 } }; }).vida;
    let texto = '';
    v = transacao(v, x => { texto = comprarItem(x, 'relogio_luxo'); }).vida;
    expect(v.notoriedade!.valor).toBe(70);
    expect(texto).not.toMatch(/[Nn]inguém na rua/);
    expect(texto).not.toMatch(/sabe quem você é/);
    // Anônimo: o luxo continua não criando nome.
    let w = adulto(35, { semente: 20 });
    w = transacao(w, x => { x.financas.conta = 200000; x.notoriedade = undefined; texto = comprarItem(x, 'relogio_luxo'); processarNotoriedade(x); }).vida;
    expect(w.notoriedade).toBeUndefined();
    expect(texto).toMatch(/Ninguém na rua passa a saber/);
  });
});

/* ======================================================================= I */

describe('I · situação de carreira: intenção ≠ resultado', () => {
  it('o estado muda a distribuição; a mesma intenção dá desfechos diferentes; a consequência persiste', () => {
    const m = modeloDaSituacao('fut_lance_construcao')!;
    const d = { minuto: 78, placar: 'perde por 1 a 0', jogo: 'clássico', clube: 'Treze' };
    const bom = jogadorPro({ semente: 22, habilidade: 92 });
    bom.caminhos.esporte!.posicao = 'volante'; bom.mente.cognicao = 80; bom.mente.estresse = 25;
    const ruim = jogadorPro({ semente: 22, habilidade: 74 });
    ruim.caminhos.esporte!.posicao = 'volante'; ruim.mente.cognicao = 35; ruim.mente.estresse = 80;
    const arriscar = intencoesDe(m, bom, d).find(i => i.id === 'arriscar')!;
    expect(distribuicao(bom, arriscar, d).sucesso).toBeGreaterThan(distribuicao(ruim, arriscar, d).sucesso);
    // Arriscar espalha para os extremos; jogar simples concentra no meio.
    const simples = intencoesDe(m, bom, d).find(i => i.id === 'simples')!;
    const pa = distribuicao(bom, arriscar, d), ps = distribuicao(bom, simples, d);
    expect(pa.otimo + pa.pessimo).toBeGreaterThan(ps.otimo + ps.pessimo);
    // A mesma escolha não garante o resultado.
    const desfechos = (quem: Vida) => { const xs = new Set<string>(); for (let s = 1; s <= 60; s++) transacao(quem, y => { y.caminhos.situacao = { id: m.id, t: y.t, dados: d }; xs.add(resolverSituacao(y, criarRng(s), 'arriscar')!.desfecho); }); return xs; };
    expect(desfechos(bom).size).toBeGreaterThanOrEqual(2);
    expect(desfechos(ruim).size).toBeGreaterThanOrEqual(3);
    // A consequência fica: o registro, e o estado (a decisão completa, pela ação do jogador, e o reload).
    let v = transacao(bom, y => { y.caminhos.situacao = { id: m.id, t: y.t, dados: d }; }).vida;
    v = abrir(v, 'car_situacao');
    expect(v.momento?.texto).toContain('78 minutos');
    v = recarregar(v);
    v = decidir(v, 'i0');
    expect(v.caminhos.situacoes?.length).toBe(1);
    expect(v.caminhos.situacao).toBeUndefined();
    expect(recarregar(v).caminhos.situacoes).toEqual(v.caminhos.situacoes);
  });

  it('o emprego comum também produz situações (não só as carreiras especiais), e nem todo ano', () => {
    let v = adulto(30, { semente: 23 });
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('vendedor')); }).vida;
    let anos = 0, com = 0;
    for (let k = 0; k < 12; k++) {
      v = avancarAno(v).vida;
      anos++;
      if (v.momento?.situacaoId === 'car_situacao') com++;
      v = responderTudo(v);
    }
    expect(com).toBeGreaterThan(0);
    expect(com).toBeLessThan(anos);
  });
});

/* ======================================================================= J */

describe('J · save/load: os estados novos voltam iguais', () => {
  it('proposta, seleção, palmarés, situação, origem do nome, contexto e fases da relação, história da atividade', () => {
    let v = jogadorPro({ semente: 24, clube: 'São Paulo', municipioId: 'sao-paulo-sp', nivel: 4 });
    v = transacao(v, (x, r) => {
      const e = x.caminhos.esporte!;
      criarProposta(x, e, 4, 'mercado');
      e.selecao = { radar: x.t, convocacoes: 2, jogos: 5, gols: 1, tPrimeira: x.t, tEstreia: x.t, tUltima: x.t, titular: false, torneios: [{ ano: 2046, nome: 'o torneio mundial de seleções', campanha: 'caiu nas quartas', jogos: 2 }] };
      const t = temporada({ clube: e.clube }); (e.temporadas ??= []).push(t); registrarTemporada(x, r, e, t);
      x.caminhos.situacao = { id: 'fut_jornalista', t: x.t, dados: { a: 1 } };
      x.caminhos.situacoes = [{ id: 'emp_erro', t: x.t - 12, trajetoria: 'emprego', intencao: 'Avisar a chefia e corrigir', desfecho: 'bom', texto: 'Corrigido.' }];
      x.notoriedade = { valor: 60, pico: 70, fonte: 'politica', t: x.t, origens: { esporte: 70, politica: 12 } };
      const vin = Object.values(x.vinculos)[0];
      vin.contexto = { via: 'app', abertura: 0.78, busca: 'casual', etapa: 'conversa', quimica: 61 };
      vin.fases = [{ fase: 'match', t: x.t }, { fase: 'conversa', t: x.t }];
      x.educacao.vivencias = [{ tipo: 'time', t: x.t - 60, anos: 4, instituicao: 'escola:x', etapa: 'capitao', papel: 'capitão', marcos: [{ t: x.t - 24, texto: 'Virou o capitão.' }], feito: 'título nos jogos escolares', tFim: x.t - 12 }];
    }).vida;
    const r = recarregar(v);
    expect(r.caminhos.esporte!.proposta).toEqual(v.caminhos.esporte!.proposta);
    expect(r.caminhos.esporte!.selecao).toEqual(v.caminhos.esporte!.selecao);
    expect(r.caminhos.palmares).toEqual(v.caminhos.palmares);
    expect(r.caminhos.situacao).toEqual(v.caminhos.situacao);
    expect(r.caminhos.situacoes).toEqual(v.caminhos.situacoes);
    expect(r.notoriedade).toEqual(v.notoriedade);
    expect(Object.values(r.vinculos)[0].contexto).toEqual(Object.values(v.vinculos)[0].contexto);
    expect(Object.values(r.vinculos)[0].fases).toEqual(Object.values(v.vinculos)[0].fases);
    expect(r.educacao.vivencias).toEqual(v.educacao.vivencias);
    expect(origemDoNome(r)).toBe('esporte');
  });

  it('um save v18 de antes do pacote (sem os campos novos) continua válido e é lido com os derivados', () => {
    const v = jogadorPro({ semente: 25 });
    delete v.caminhos.palmares; delete v.caminhos.esporte!.proposta;
    for (const vin of Object.values(v.vinculos)) { delete vin.contexto; delete vin.fases; }
    if (v.notoriedade) delete v.notoriedade.origens;
    const r = recarregar(v);
    expect(r.versao).toBe(18);
    expect(contextoDaRelacao(r, Object.values(r.vinculos)[0]).via).toBeTruthy();
  });
});

/* ================================================================= Portas */

describe('Ações genéricas são portas: a escolha concreta vem depois', () => {
  it('viagem: destino e duração mudam o preço; a escolha é a que acontece', () => {
    let v = adulto(35, { semente: 26 });
    v = transacao(v, x => { x.financas.conta = 300000; }).vida;
    const xs = escolhasDaExperiencia(v, 'viagem_pais');
    expect(new Set(xs.map(x => x.grupo)).size).toBeGreaterThanOrEqual(6);
    const semana = xs.find(x => x.id === 'noronha:semana')!, duas = xs.find(x => x.id === 'noronha:duas')!, ouro = xs.find(x => x.id === 'ouro_preto:semana')!;
    expect(duas.custo).toBeGreaterThan(semana.custo);
    expect(semana.custo).toBeGreaterThan(ouro.custo);
    const r = executar(v, { tipo: 'experiencia', id: 'viagem_pais', escolha: 'ouro_preto:semana' });
    expect(r.vida.biografia.slice(-4).some(b => b.texto.includes('Ouro Preto'))).toBe(true);
    expect(custoDaExperiencia(v, 'viagem_pais', 'ouro_preto:semana')).toBe(ouro.custo);
    // O curso escolhe o domínio — e, na música, o instrumento.
    expect(escolhasDaExperiencia(v, 'curso_caro').some(x => x.id === 'musica:piano')).toBe(true);
  });
});
