/**
 * Calendário político (pós-playtest): o mandato tem UMA fonte de verdade
 * (`calendarioDoMandato`) — início, fim, duração, o ano em curso, o último
 * ano, a eleição que encerra o mandato e a eleição na janela. O texto da
 * pergunta da eleição, a leitura da interface e o motor leem dela.
 *
 * O bug: "O mandato de prefeito entra no último ano." aparecia sempre que
 * havia mandato e uma eleição na janela — inclusive na eleição GERAL do meio
 * do mandato, e no primeiro ano de quem faz aniversário depois de outubro.
 */

import { describe, expect, it } from 'vitest';
import { nova, responder, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { executar, type Acao } from '../acoes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { CargoEletivo, Vida } from '../tipos';
import {
  CARGOS, calendarioDoMandato, eleicaoNaJanela, entrarNaPolitica, leituraPolitica, mandatosDaVida, mandatoAcabaNaEleicao, ORDEM_CARGOS, podeConcorrer, regraDaTroca, tDaEleicao, tDaPosse, tipoDeEleicao
} from '../sistemas/politica';
import { interpretar } from '../save';
import { conteudoPorId, abrirDecisao } from '../conteudo/motor';
import { contexto } from '../conteudo/base';

function adulto(i = 34, semente = 7): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, municipioId: 'recife-pe' }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, municipioId: 'recife-pe' }), i);
  v.momento = null;
  v.trabalho.atual = undefined; v.trabalho.aposentadoria = undefined; v.trabalho.pausa = undefined;
  v.educacao.matricula = undefined; v.educacao.basica = undefined;
  v.caminhos.envolvimento = undefined; v.caminhos.militar = undefined; v.caminhos.negocio = undefined; v.caminhos.esporte = undefined; v.caminhos.politica = undefined;
  v.caminhos.processo = undefined; v.caminhos.oportunidades = [];
  v.justica = undefined;
  v.corpo.saude = 85; v.corpo.condicoes = [];
  v.financas.conta = 50000; v.financas.dividas = []; v.financas.negativado = false;
  v.anoAtual = { acoes: [] };
  delete v.fatos['chegou_cidade'];
  return v;
}

function politico(v: Vida, apoio = 60, reputacao = 55): Vida {
  return transacao(v, x => { const p = entrarNaPolitica(x, 'comunidade'); p.partido = 'Partido Ipê'; p.tFiliacao = x.t - 36; p.fase = 'filiado'; p.apoio = apoio; p.reputacao = reputacao; }).vida;
}

/** Um mandato montado direto no estado (o calendário em si, sem sorteio). */
function comMandato(base: Vida, cargo: CargoEletivo, anoEleicao: number, t: number): Vida {
  const v = structuredClone(base);
  const p = entrarNaPolitica(v, 'comunidade');
  p.partido = 'Partido Ipê'; p.tFiliacao = tDaEleicao(anoEleicao) - 36; p.fase = 'mandato'; p.apoio = 50; p.reputacao = 50;
  const inicio = tDaPosse(anoEleicao);
  p.mandato = { cargo, tInicio: inicio, tFim: inicio + CARGOS[cargo].anos * 12, aprovacao: 55, feito: 0 };
  p.consecutivos = 1;
  p.historico.push({ t: tDaEleicao(anoEleicao), cargo, resultado: 'eleito' });
  v.t = t;
  v.eu.tNasc = t - 50 * 12; // idade de qualquer cargo, no ano que for
  v.momento = null;
  return v;
}

/** Abre a pergunta da eleição como o motor abre (o fato do dia + a decisão) e devolve o texto. */
function perguntaDaEleicao(v: Vida): { texto: string; opcoes: { id: string; texto: string }[] } {
  const w = structuredClone(v);
  w.fatos['pol_eleicao'] = w.t;
  const d = conteudoPorId('pol_eleicao')!;
  if (d.tipo !== 'decisao') throw new Error('pol_eleicao não é decisão');
  const m = abrirDecisao(w, d, contexto(w, criarRng(1)));
  return { texto: m.texto, opcoes: m.opcoes };
}

const A = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);

/** Mandatos coerentes: um só em exercício, todos os outros fechados, o emprego eletivo é o do mandato atual. */
function semSobreposicao(v: Vida): void {
  const ms = mandatosDaVida(v);
  expect(ms.filter(m => m.como === 'em exercício').length).toBeLessThanOrEqual(1);
  for (const m of ms) expect(['em exercício', 'à espera da posse', 'concluído', 'renunciou', 'cassado']).toContain(m.como);
  const p = v.caminhos.politica;
  if (p?.mandato) expect(v.trabalho.atual?.contrato === 'eletivo' ? v.trabalho.atual.ocupacaoId : p.mandato.cargo).toBe(p.mandato.cargo);
  else expect(v.trabalho.atual?.contrato).not.toBe('eletivo');
  // Fechados, em ordem: um mandato não começa antes do anterior acabar.
  const fechados = ms.filter(m => m.ate !== undefined).sort((a, b) => a.de - b.de);
  for (let k = 1; k < fechados.length; k++) expect(fechados[k].de).toBeGreaterThanOrEqual(fechados[k - 1].ate!);
}

describe('calendário eleitoral brasileiro', () => {
  it('municipais e gerais se alternam a cada dois anos; posse em janeiro do ano seguinte', () => {
    for (let ano = 2028; ano <= 2060; ano += 2) expect(tipoDeEleicao(ano)).toBe((ano - 2028) % 4 === 0 ? 'municipal' : 'geral');
    for (let ano = 2029; ano <= 2059; ano += 2) expect(tipoDeEleicao(ano)).toBeUndefined();
    expect(tDaEleicao(2032) % 12).toBe(9);
    expect(tDaPosse(2032)).toBe(2033 * 12);
  });

  it('cada cargo: duração, último ano e a eleição que encerra o mandato é a do próprio tipo, em outubro do último ano', () => {
    const base = adulto(40);
    for (const cargo of ORDEM_CARGOS) {
      const anoEl = CARGOS[cargo].tipo === 'municipal' ? 2028 : 2030;
      const v = comMandato(base, cargo, anoEl, tDaPosse(anoEl));
      const cal = calendarioDoMandato(v)!;
      expect(cal.anos).toBe(cargo === 'senador' ? 8 : 4);
      expect(cal.anoPosse).toBe(anoEl + 1);
      expect(cal.anoFinal).toBe(anoEl + cal.anos);
      expect(cal.ano).toBe(1);
      expect(cal.ultimoAno).toBe(false);
      expect(tipoDeEleicao(cal.eleicaoDoFim.ano)).toBe(CARGOS[cargo].tipo);
      expect(mandatoAcabaNaEleicao(v.caminhos.politica!.mandato!, cal.eleicaoDoFim.ano)).toBe(true);
      expect(mandatoAcabaNaEleicao(v.caminhos.politica!.mandato!, cal.eleicaoDoFim.ano - 2)).toBe(false);
      // Ano a ano, em anos civis: o último é só o último.
      for (let k = 0; k < cal.anos; k++) {
        const w = comMandato(base, cargo, anoEl, tDaPosse(anoEl) + k * 12 + 6);
        const c = calendarioDoMandato(w)!;
        expect(c.ano).toBe(k + 1);
        expect(c.ultimoAno).toBe(k === cal.anos - 1);
      }
    }
  });

  it('senador: a eleição geral do meio do mandato não o encerra (reeleição impossível nela)', () => {
    const v = comMandato(adulto(45), 'senador', 2030, 2034 * 12 + 2);
    const cal = calendarioDoMandato(v)!;
    expect(cal.ano).toBe(4);
    expect(cal.naJanela?.ano).toBe(2034);
    expect(cal.naJanela?.encerra).toBe(false);
    expect(podeConcorrer(v, 'senador', tDaEleicao(2034)).grau).toBe('impossivel');
  });
});

describe('o mês do aniversário não muda o ano do mandato', () => {
  // Prefeito 2029–2032 (eleito em 2028). O tique é o aniversário: pode cair em qualquer mês.
  const base = adulto(40);
  for (const mes of [0, 2, 6, 9, 10, 11]) {
    it(`aniversário no mês ${mes + 1}: ano do mandato pelo ano civil; "último ano" só em 2032`, () => {
      for (let ano = 2029; ano <= 2032; ano++) {
        const v = comMandato(base, 'prefeito', 2028, ano * 12 + mes);
        const cal = calendarioDoMandato(v)!;
        expect(cal.ano).toBe(ano - 2028);
        expect(cal.ultimoAno).toBe(ano === 2032);
        if (!eleicaoNaJanela(v)) continue;
        const { texto } = perguntaDaEleicao(v);
        // A frase do último ano sai do mesmo calendário: só no último ano de verdade.
        expect(/entra no último ano/.test(texto)).toBe(ano === 2032);
        if (cal.naJanela!.encerra) expect(texto).toMatch(/último ano/);
        else expect(texto).toMatch(/vai até 2032/);
      }
    });
  }

  it('o caso do playtest: prefeito com aniversário em novembro, no primeiro ano, diante da eleição geral', () => {
    const v = comMandato(base, 'prefeito', 2028, 2029 * 12 + 10);
    const cal = calendarioDoMandato(v)!;
    expect(cal.ano).toBe(1);
    expect(cal.naJanela).toMatchObject({ ano: 2030, tipo: 'geral', encerra: false });
    const q = perguntaDaEleicao(v);
    expect(q.texto).not.toMatch(/último ano/);
    expect(q.texto).toMatch(/ano 1 de 4/);
    expect(q.texto).toMatch(/renunciar/); // prefeito: outro cargo pede renúncia
    expect(q.opcoes.find(o => o.id === 'voltar')?.texto).toMatch(/seguir no mandato/);
    expect(leituraPolitica(v)!.etapa).toBe('Ano 1 de 4 do mandato · 2029–2032');
    expect(leituraPolitica(v)!.horizonte).not.toMatch(/Último ano|termina/);
  });

  it('a eleição do fim vista do ano 3 (aniversário depois de outubro): o último ano começa em janeiro', () => {
    const v = comMandato(base, 'prefeito', 2028, 2031 * 12 + 10);
    const cal = calendarioDoMandato(v)!;
    expect(cal.ano).toBe(3);
    expect(cal.naJanela).toMatchObject({ ano: 2032, encerra: true });
    const q = perguntaDaEleicao(v);
    expect(q.texto).not.toMatch(/entra no último ano/);
    expect(q.texto).toMatch(/Em janeiro começa o último ano/);
    expect(regraDaTroca(comMandato(base, 'vereador', 2028, 2031 * 12 + 10)).como).toBe('janela');
    expect(regraDaTroca(comMandato(base, 'vereador', 2028, 2029 * 12 + 10)).como).toBe('fora_da_janela');
  });

  it('no último ano: a frase, a leitura e o horizonte dizem o mesmo', () => {
    const v = comMandato(base, 'prefeito', 2028, 2032 * 12 + 3);
    expect(perguntaDaEleicao(v).texto).toMatch(/^O mandato de .* entra no último ano\./);
    expect(leituraPolitica(v)!.etapa).toMatch(/^Último ano do mandato \(4 de 4\)/);
    expect(leituraPolitica(v)!.horizonte).toMatch(/^Último ano/);
  });

  it('vereador no meio do mandato: disputa outro cargo sem largar a cadeira', () => {
    const v = comMandato(base, 'vereador', 2028, 2030 * 12 + 1);
    const q = perguntaDaEleicao(v);
    expect(q.texto).toMatch(/sem largar o mandato/);
    expect(q.texto).not.toMatch(/último ano/);
  });
});

describe('a transição: um mandato de cada vez, inclusive depois de reabrir', () => {
  function campanha(v: Vida, cargo: CargoEletivo): Vida {
    v = executar(v, A('candidatura')).vida;
    expect(v.momento?.situacaoId).toBe('pol_eleicao');
    for (const op of [`cargo_${cargo}`, 'fin_pequenas', 'rua_redes', 'tom_propostas']) v = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
    return v;
  }
  /** Avança um ano e confere, a cada pergunta da eleição, que o texto bate com o calendário. */
  function umAno(v: Vida, pref: (v: Vida) => string | undefined): Vida {
    v = avancarAno(v).vida;
    while (v.momento && !v.morte) {
      if (v.momento.situacaoId === 'pol_eleicao' && v.caminhos.politica?.mandato && !v.caminhos.politica.campanha) {
        const cal = calendarioDoMandato(v)!;
        expect(/entra no último ano/.test(v.momento.texto)).toBe(cal.ultimoAno && cal.naJanela?.encerra !== false);
      }
      v = responder(v, pref(v));
    }
    semSobreposicao(v);
    return v;
  }
  function forcarVitoria(v: Vida): Vida {
    return transacao(v, x => { const p = x.caminhos.politica!; p.apoio = 100; p.reputacao = 100; p.desgaste = 0; p.campanha!.nota = 120; }).vida;
  }
  function ateAJanela(v: Vida, tipo: 'municipal' | 'geral'): Vida {
    for (let k = 0; k < 8 && eleicaoNaJanela(v)?.tipo !== tipo; k++) v = umAno(v, w => (w.momento?.situacaoId === 'pol_eleicao' ? (w.caminhos.politica?.mandato ? 'voltar' : 'nao') : 'ficar'));
    return v;
  }
  function apurar(v: Vida): Vida {
    for (let k = 0; k < 3 && (v.caminhos.politica?.campanha || v.caminhos.politica?.posse); k++) v = umAno(v, w => (w.momento?.situacaoId === 'pol_eleicao' ? 'voltar' : 'ficar'));
    return v;
  }

  it('prefeito: mandato inteiro ano a ano, a frase certa em cada janela, e o fim fecha o mandato', () => {
    let v = politico(adulto(34, 11));
    v = ateAJanela(v, 'municipal');
    v = forcarVitoria(campanha(v, 'prefeito'));
    v = apurar(v);
    const m = v.caminhos.politica!.mandato!;
    expect(m.cargo).toBe('prefeito');
    expect(m.tInicio % 12).toBe(0); // posse em 1º de janeiro, qualquer que seja o mês do aniversário
    const tFim = m.tFim;
    // Vive o mandato inteiro sem concorrer: a cada ano, o calendário e a leitura concordam.
    for (let k = 0; k < 6 && v.caminhos.politica?.mandato?.tFim === tFim; k++) {
      const cal = calendarioDoMandato(v)!;
      expect(leituraPolitica(v)!.etapa).toContain(`${cal.anoPosse}–${cal.anoFinal}`);
      v = umAno(v, w => (w.momento?.situacaoId === 'pol_eleicao' ? 'voltar' : 'ficar'));
    }
    expect(v.caminhos.politica!.mandato).toBeUndefined();
    expect(v.t).toBeGreaterThanOrEqual(tFim);
    expect(v.caminhos.politica!.historico.filter(h => h.cargo === 'prefeito' && h.resultado === 'concluiu').length).toBe(1);
  }, 60000);

  it('prefeito que disputa outro cargo renuncia; eleito, só o novo mandato fica — e o save reabre igual', () => {
    let v = politico(adulto(36, 9));
    v = ateAJanela(v, 'municipal');
    v = forcarVitoria(campanha(v, 'prefeito'));
    v = apurar(v);
    expect(v.caminhos.politica!.mandato?.cargo).toBe('prefeito');
    v = ateAJanela(v, 'geral');
    v = campanha(v, 'deputado_federal');
    expect(v.caminhos.politica!.mandato).toBeUndefined(); // renunciou no registro
    expect(v.caminhos.politica!.historico.some(h => h.cargo === 'prefeito' && h.resultado === 'renunciou')).toBe(true);
    semSobreposicao(v);
    v = apurar(forcarVitoria(v));
    const p = v.caminhos.politica!;
    expect(p.mandato?.cargo).toBe('deputado_federal');
    expect(p.posse).toBeUndefined();
    expect(mandatosDaVida(v).filter(x => x.como === 'em exercício').map(x => x.cargo)).toHaveLength(1);
    semSobreposicao(v);
    // Reabrir: o calendário é derivado do estado salvo — o mesmo, sem nada a migrar.
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') {
      expect(calendarioDoMandato(r.vida)).toEqual(calendarioDoMandato(v));
      expect(leituraPolitica(r.vida)!.etapa).toBe(leituraPolitica(v)!.etapa);
      semSobreposicao(r.vida);
      // E a vida segue igual depois de reabrir.
      const a = umAno(v, () => 'ficar');
      const b = umAno(r.vida, () => 'ficar');
      expect(b.caminhos.politica).toEqual(a.caminhos.politica);
    }
  }, 60000);

  it('vereador eleito deputado: o mandato de vereador fecha na posse do novo, sem sobrepor', () => {
    let v = politico(adulto(36, 7));
    v = ateAJanela(v, 'municipal');
    v = forcarVitoria(campanha(v, 'vereador'));
    v = apurar(v);
    expect(v.caminhos.politica!.mandato?.cargo).toBe('vereador');
    v = ateAJanela(v, 'geral');
    v = forcarVitoria(campanha(v, 'deputado_estadual'));
    expect(v.caminhos.politica!.mandato?.cargo).toBe('vereador'); // segue na cadeira durante a campanha
    v = apurar(v);
    expect(v.caminhos.politica!.mandato?.cargo).toBe('deputado_estadual');
    expect(v.caminhos.politica!.historico.filter(h => h.cargo === 'vereador' && h.resultado === 'concluiu')).toHaveLength(1);
    semSobreposicao(v);
  }, 60000);
});
