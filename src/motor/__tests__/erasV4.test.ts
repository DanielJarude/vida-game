/**
 * ERAS v4 — a sociedade que pesa na vida e o mundo que muda: barreiras (lei, instituição, costume) com país, lugar,
 * período e a quem pesam; o privilégio de origem; as reformas e a história alternativa (alcance, contestação, herança);
 * os movimentos; os partidos da época; o esporte amador; os saves; e a vida contemporânea intacta.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova, viver } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { entrarNaVida } from '../mundo/vida';
import { tDe } from '../tempo';
import { interpretar } from '../save';
import { cidadesDoPais } from '../dados/lugares';
import { ocupacao } from '../dados/ocupacoes';
import { elegibilidade } from '../sistemas/trabalho';
import { partidosDoPais } from '../sistemas/politica';
import { condicoesEmprestimo, disponibilidade, executar } from '../acoes';
import { regraValeEm, regrasDoPais } from '../eras/base/sociedade';
import { ocupacaoAindaNaoExiste } from '../eras/base/profissoes';
import { partidosNoMes } from '../eras/base/partidos';
import { partidoDe } from '../dados/partidos';
import {
  barreirasQuePesam, epocaNaVaga, epocaNoCredito, epocaNaPolitica, epocaNaFaculdade, garantirHistoria, normalizarHistoria,
  reformasPendentes, regraDerrubadaAntes, sociedadeDoPais, redeDeOrigem, pesoDaBarreira, partidosDoMesNoPais, instituidoAqui
} from '../eras/base/sociedade4';
import { reformasDoMandato, chanceDaReforma } from '../eras/v4/politica4';
import { movimentosDaVida } from '../eras/v4/movimentos4';
import { resumoDaSociedade } from '../eras/v4/resumo4';
import { pacotesDeEra } from '../eras/base/pacote';
import { fatoresDeMortalidade } from '../eras/base/mortalidade';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

const cidade = (pais: string, uf?: string) => (pais === 'BR' ? (uf === 'MG' ? 'belo-horizonte-mg' : 'sao-paulo-sp') : (cidadesDoPais(pais).find(c => !uf || c.uf === uf) ?? cidadesDoPais(pais)[0]).id);
const vida = (pais: string, ano: number, o: Parameters<typeof nova>[0] & { uf?: string } = {}) => { const { uf, ...r } = o; return nova({ semente: 4242, municipioId: cidade(pais, uf), ano, era: true, ...r }); };
const noMes = (v: Vida, ano: number, mes = 5) => { v.t = tDe(ano, mes); entrarNaVida(v); return v; };
const casar = (v: Vida) => {
  v.pessoas['conj4'] = { ...(Object.values(v.pessoas)[0]), id: 'conj4', genero: v.eu.genero === 'feminino' ? 'masculino' : 'feminino', vivo: true } as never;
  const modelo = structuredClone(Object.values(v.vinculos)[0]);
  v.vinculos['conj4'] = { ...modelo, pessoaId: 'conj4', parentesco: undefined, origem: 'romance', tInicio: v.t, convivio: ['casa'], romance: { estagio: 'casamento', tEstagio: v.t, envolvimento: 70 } } as never;
  return v;
};
const negro = (v: Vida) => { v.eu.ancestralidade = { af: 1 }; return v; };

describe('os pacotes sociais', () => {
  it('cada país com época tem barreiras, reformas, movimentos e partidos com fonte; os ids são únicos e as referências existem', () => {
    const paises = ['BR', ...pacotesDeEra().map(p => p.pais)];
    expect(paises.length).toBeGreaterThanOrEqual(6);
    for (const pais of paises) {
      const s = sociedadeDoPais(pais)!;
      expect(s, pais).toBeDefined();
      expect(s.barreiras.length, pais).toBeGreaterThan(0);
      expect(s.reformas.length, pais).toBeGreaterThan(0);
      expect(s.movimentos.length, pais).toBeGreaterThan(0);
      expect(s.partidos?.length ?? 0, pais).toBeGreaterThan(0);
      const ids = [...s.barreiras.map(b => b.id), ...s.reformas.map(r => r.id)];
      expect(new Set(s.barreiras.map(b => b.id)).size, pais).toBe(s.barreiras.length);
      expect(new Set(s.reformas.map(b => b.id)).size, pais).toBe(s.reformas.length);
      const regras = new Set(regrasDoPais(pais).map(r => r.id));
      for (const b of s.barreiras) {
        expect(b.fonte.length, b.id).toBeGreaterThan(20);
        expect(b.bloqueia || (b.fator !== undefined && b.fator > 0 && b.fator < 1), b.id).toBe(true);
        if (b.ate !== undefined) expect(b.ate, b.id).toBeGreaterThan(b.de);
        if (b.reforma) expect(s.reformas.some(r => r.id === b.reforma), `${b.id} → ${b.reforma}`).toBe(true);
      }
      for (const r of s.reformas) {
        expect(r.fonte.length, r.id).toBeGreaterThan(10);
        for (const d of r.derruba) expect(ids.includes(d) || regras.has(d), `${r.id} derruba ${d}`).toBe(true);
        if (r.real) expect(r.real[0], r.id).toBeGreaterThanOrEqual(r.desde);
      }
      for (const m of s.movimentos) for (const r of m.reformas) expect(s.reformas.some(x => x.id === r), `${m.id} → ${r}`).toBe(true);
      for (const p of s.partidos ?? []) expect(p.linha.length, p.id).toBeGreaterThan(5);
    }
  });
  it('o jogo não oferece filiação a partidos nazistas ou fascistas', () => {
    const todos = ['BR', ...pacotesDeEra().map(p => p.pais)].flatMap(p => (sociedadeDoPais(p)?.partidos ?? []).map(x => `${x.sigla} ${x.nome}`));
    expect(todos.some(x => /NSDAP|nazista|Integralista|fascista/i.test(x))).toBe(false);
  });
});

describe('a vida contemporânea não muda', () => {
  it('sem época: nenhuma barreira, fator 1, partidos de sempre, crédito como sempre', () => {
    const v = nova({ semente: 99, municipioId: 'sao-paulo-sp' });
    entrarNaVida(v);
    casar(negro(v));
    expect(v.era).toBeUndefined();
    for (const d of ['trabalho', 'salario', 'estudo', 'credito', 'politica'] as const) expect(barreirasQuePesam(v, d)).toEqual([]);
    expect(epocaNaVaga(v, ocupacao('advogado')).fator).toBe(1);
    expect(epocaNaFaculdade(v).fator).toBe(1);
    expect(epocaNoCredito(v).bloqueio).toBeUndefined();
    expect(redeDeOrigem(v, 5)).toBe(1);
    expect(resumoDaSociedade(v)).toBeUndefined();
    expect(movimentosDaVida(v)).toEqual([]);
    expect(partidosDoPais('US').every(s => s.startsWith('~'))).toBe(true);
  });
});

describe('barreiras: lei, instituição e costume, no lugar e no tempo', () => {
  it('Brasil, 1950: a mulher casada precisava da autorização do marido para trabalhar e não contratava crédito sozinha', () => {
    const v = noMes(casar(vida('BR', 1925, { genero: 'feminino' })), 1950);
    expect(epocaNaVaga(v, ocupacao('professor_fund')).fator).toBeLessThan(0.7);
    expect(epocaNoCredito(v).bloqueio?.barreira.id).toBe('br_casada_credito');
    v.trabalho.atual = { ocupacaoId: 'professor_fund', salario: 3000, contrato: 'clt', tInicio: v.t, municipioId: v.moradia.municipioId, carga: 'integral' } as never;
    expect(condicoesEmprestimo(v, 2000, 12).veredito.grau).toBe('ilegal');
    // Solteira, não; depois de 1962, a lei caiu (o costume ainda pesa, cada vez menos).
    const s = noMes(vida('BR', 1925, { genero: 'feminino' }), 1950);
    expect(epocaNoCredito(s).bloqueio).toBeUndefined();
    const depois = noMes(casar(vida('BR', 1925, { genero: 'feminino' })), 1965);
    expect(epocaNoCredito(depois).bloqueio).toBeUndefined();
    const residuo = barreirasQuePesam(depois, 'trabalho').find(p => p.barreira.id === 'br_casada_trabalho');
    expect(residuo?.residual).toBe(true);
    expect(residuo!.fator).toBeGreaterThan(0.8);
  });
  it('EUA: a segregação pesa no Sul (Geórgia) e não em Nova York; a discriminação legal vale no país inteiro até 1965', () => {
    const sul = noMes(negro(vida('US', 1925, { genero: 'masculino', uf: 'GA' })), 1950);
    const norte = noMes(negro(vida('US', 1925, { genero: 'masculino', uf: 'NY' })), 1950);
    const oc = ocupacao('gerente_adm');
    // O motor responde pela vida em processamento (`entrarNaVida`): cada consulta entra na vida dela.
    entrarNaVida(sul);
    expect(epocaNaVaga(sul, oc).pesos.map(p => p.barreira.id)).toContain('us_jim_crow_trabalho');
    expect(epocaNaPolitica(sul, 'deputado_estadual').fator).toBeLessThan(0.3);
    expect(epocaNaFaculdade(sul).pesos.map(p => p.barreira.id)).toContain('us_universidade_segregada');
    entrarNaVida(norte);
    expect(epocaNaVaga(norte, oc).pesos.map(p => p.barreira.id)).not.toContain('us_jim_crow_trabalho');
    expect(epocaNaVaga(norte, oc).pesos.map(p => p.barreira.id)).toContain('us_discriminacao_emprego');
    expect(epocaNaPolitica(norte, 'deputado_estadual').fator).toBe(1);
  });
  it('a lei que fecha a porta aparece como motivo na vaga (com a saída da época)', () => {
    const v = noMes(vida('GB', 1900, { genero: 'feminino' }), 1919);
    v.educacao.concluidos.push({ cursoId: 'direito', nivel: 'superior', area: 'direito', tInicio: v.t - 60, tFim: v.t - 12 } as never);
    const ve = elegibilidade(v, ocupacao('advogado'));
    expect(ve.grau).toBe('ilegal');
    expect(ve.motivo).toMatch(/advocacia/);
    expect(ve.motivo).toMatch(/magistério/);
  });
  it('o salário de entrada da mulher era menor antes das leis de salário igual (e depois volta a se aproximar)', () => {
    const v = noMes(vida('US', 1925, { genero: 'feminino' }), 1950);
    expect(barreirasQuePesam(v, 'salario')[0]?.fator).toBeCloseTo(0.65, 2);
    const h = noMes(vida('US', 1925, { genero: 'masculino' }), 1950);
    expect(barreirasQuePesam(h, 'salario')).toEqual([]);
  });
  it('Alemanha: a RDA fechava a universidade a quem ia à igreja e não entrava na juventude do partido; no oeste, não', () => {
    const leste = cidadesDoPais('DE').find(c => c.uf === 'SN')!.id;
    const v = nova({ semente: 4242, municipioId: leste, ano: 1955, era: true });
    noMes(v, 1973);
    v.crenca14 = { de: v.eu.nome, atual: 'protestante', familia: 'protestante', pratica: 'regular', desde: v.eu.tNasc } as never;
    expect(epocaNaFaculdade(v).pesos.map(p => p.barreira.id)).toContain('de_rda_igreja');
    const oeste = noMes(vida('DE', 1955, { uf: 'BY' }), 1973);
    oeste.crenca14 = v.crenca14;
    expect(epocaNaFaculdade(oeste).pesos.map(p => p.barreira.id)).not.toContain('de_rda_igreja');
  });
  it('o privilégio de origem pesa mais quando poucos estudavam (1910) do que depois (2010); nos postos de base, nada', () => {
    const rica = noMes(vida('BR', 1900, { classe: 'alta' }), 1925);
    const r1925 = redeDeOrigem(rica, 4), fRica = epocaNaFaculdade(rica).fator;
    expect(r1925).toBeGreaterThan(1.25);
    const pobre = noMes(vida('BR', 1900, { classe: 'vulneravel' }), 1925);
    expect(redeDeOrigem(pobre, 4)).toBeLessThan(0.8);
    expect(redeDeOrigem(pobre, 1)).toBe(1);
    expect(epocaNaFaculdade(pobre).fator).toBeLessThan(fRica);
    const rica2 = noMes(vida('BR', 1985, { classe: 'alta' }), 2010);
    expect(redeDeOrigem(rica2, 4)).toBeLessThan(r1925);
  });
});

describe('a história alternativa', () => {
  it('uma reforma estadual antecipada derruba a barreira só no estado dela, e a regra da v3 deixa de valer lá', () => {
    const ga = noMes(negro(vida('US', 1925, { genero: 'masculino', uf: 'GA' })), 1950);
    const h = garantirHistoria(ga);
    h.alteracoes.push({ reforma: 'us_dessegregacao_estadual', pais: 'US', t: tDe(1950, 0), alcance: 'estadual', divisao: 'GA', por: 'voce', autor: ga.eu.nome, antes: 15 });
    entrarNaVida(ga);
    // A lei caiu no estado; o costume, não de uma vez: o que sobra é o resíduo (cada vez menor).
    const jimGA = epocaNaVaga(ga, ocupacao('gerente_adm')).pesos.find(p => p.barreira.id === 'us_jim_crow_trabalho');
    expect(jimGA?.residual).toBe(true);
    expect(jimGA!.fator).toBeGreaterThan(0.79);
    expect(regraDerrubadaAntes('us_jim_crow', ga.t)).toBe(true);
    const jim = regrasDoPais('US').find(r => r.id === 'us_jim_crow')!;
    expect(regraValeEm(jim, 1950, 'GA')).toBe(false);
    // No Texas, com a mesma história (outro estado), a lei continua.
    const tx = noMes(negro(vida('US', 1925, { genero: 'masculino', uf: 'TX' })), 1950);
    tx.era!.historia = structuredClone(h);
    entrarNaVida(tx);
    expect(epocaNaVaga(tx, ocupacao('gerente_adm')).pesos.find(p => p.barreira.id === 'us_jim_crow_trabalho')?.residual).toBe(false);
  });
  it('a reforma derrubada depois devolve a barreira até a data real; a reforma municipal cria escola só na cidade', () => {
    const v = noMes(casar(vida('BR', 1915, { genero: 'feminino' })), 1945);
    const h = garantirHistoria(v);
    h.alteracoes.push({ reforma: 'br_estatuto_mulher_casada', pais: 'BR', t: tDe(1940, 0), alcance: 'nacional', por: 'voce', autor: 'X', antes: 22, revogadaEm: tDe(1943, 0) });
    entrarNaVida(v);
    expect(epocaNoCredito(v).bloqueio).toBeDefined();
    h.alteracoes[0].revogadaEm = undefined;
    expect(epocaNoCredito(v).bloqueio).toBeUndefined();
    h.alteracoes.push({ reforma: 'br_escola_municipal', pais: 'BR', t: tDe(1944, 0), alcance: 'municipal', municipioId: v.moradia.municipioId, por: 'voce', autor: 'X' });
    expect(instituidoAqui('escola', v.t)).toBe(true);
    const outra = noMes(vida('BR', 1915, { uf: 'MG' }), 1945);
    outra.era!.historia = structuredClone(h);
    entrarNaVida(outra);
    expect(instituidoAqui('escola', outra.t)).toBe(false);
  });
  it('as reformas pendentes respeitam o tempo e o lugar; a que perdeu o sentido sai da lista', () => {
    const ny = noMes(vida('US', 1900, { uf: 'NY' }), 1915);
    expect(reformasPendentes('US', ny.t).map(r => r.id)).toContain('us_voto_feminino_estadual');
    noMes(ny, 1925);
    expect(reformasPendentes('US', ny.t).map(r => r.id)).not.toContain('us_voto_feminino_estadual');
    expect(reformasPendentes('US', ny.t).map(r => r.id)).not.toContain('us_dessegregacao_estadual');
  });
  it('o mandato só propõe o que é da sua competência; sob regime fechado, a chance desaba', () => {
    const v = noMes(vida('BR', 1900, { genero: 'masculino' }), 1950);
    v.caminhos.politica = { fase: 'mandato', origem: 'decisao', tInicio: v.t, apoio: 40, reputacao: 30, desgaste: 5, consecutivos: 1, historico: [], mandato: { cargo: 'prefeito', tInicio: v.t, tFim: v.t + 48, aprovacao: 60, feito: 0 } } as never;
    expect(reformasDoMandato(v).every(r => r.alcance === 'municipal')).toBe(true);
    (v.caminhos.politica as unknown as { mandato: { cargo: string } }).mandato.cargo = 'deputado_federal';
    const rs = reformasDoMandato(v);
    expect(rs.every(r => r.alcance === 'nacional')).toBe(true);
    const est = rs.find(r => r.id === 'br_estatuto_mulher_casada')!;
    const c1950 = chanceDaReforma(v, est).chance;
    noMes(v, 1961);
    expect(chanceDaReforma(v, est).chance).toBeGreaterThan(c1950);
    noMes(v, 1970); // AI-5: a casa vota o que o regime manda
    const lei = reformasDoMandato(v).find(r => r.id === 'br_lei_cao')!;
    expect(chanceDaReforma(v, lei).regime).toBe(true);
  });
  it('propor pelo mandato grava a mudança (quando passa), na linha do tempo como história alternativa; a vida segue', () => {
    let aprovou = false;
    for (let s = 1; s <= 25 && !aprovou; s++) {
      let v = noMes(vida('US', 1900, { genero: 'masculino', uf: 'GA', semente: 900 + s }), 1945);
      v.caminhos.politica = { fase: 'mandato', origem: 'decisao', tInicio: v.t, apoio: 90, reputacao: 80, desgaste: 0, consecutivos: 1, historico: [], mandato: { cargo: 'governador', tInicio: v.t, tFim: v.t + 48, aprovacao: 90, feito: 0 } } as never;
      const r = reformasDoMandato(v).find(x => x.id === 'us_dessegregacao_estadual');
      expect(r).toBeDefined();
      const a = { tipo: 'politica', oque: 'reforma4', valor: r!.id } as never;
      expect(disponibilidade(v, a).grau).toBe('permitido');
      v = executar(v, a).vida;
      const alt = v.era!.historia?.alteracoes ?? [];
      if (alt.length) {
        aprovou = true;
        expect(alt[0]).toMatchObject({ reforma: 'us_dessegregacao_estadual', alcance: 'estadual', divisao: 'GA', por: 'voce' });
        expect(v.mundo14!.eventos.some(e => e.real === false && e.titulo === r!.nome)).toBe(true);
        expect(disponibilidade(v, a).grau).not.toBe('permitido'); // uma por ano
        v = viver(v, 3);
        expect(v.era!.historia!.alteracoes.length).toBeGreaterThan(0);
      }
    }
    expect(aprovou).toBe(true);
  });
});

describe('o que a reforma cria', () => {
  it('a água e o posto de saúde que a cidade conquista antes da hora cortam a mortalidade da época (mais na infância), só lá', () => {
    const v = noMes(vida('BR', 1900), 1920);
    const antes = fatoresDeMortalidade(false, 2);
    garantirHistoria(v).alteracoes.push({ reforma: 'br_saude_municipal', pais: 'BR', t: tDe(1915, 0), alcance: 'municipal', municipioId: v.moradia.municipioId, por: 'voce', autor: 'X' });
    entrarNaVida(v);
    const depois = fatoresDeMortalidade(false, 2);
    expect(depois.crianca).toBeLessThan(antes.crianca * 0.5);
    expect(depois.adulto).toBeLessThan(antes.adulto);
    const outra = noMes(vida('BR', 1900, { uf: 'MG' }), 1920);
    outra.era!.historia = structuredClone(v.era!.historia);
    entrarNaVida(outra);
    expect(fatoresDeMortalidade(false, 2).crianca).toBeCloseTo(antes.crianca, 5);
  });
});

describe('movimentos e partidos', () => {
  it('os movimentos da época aparecem no lugar e no tempo; participar soma pressão; sob ditadura, o risco é dito', () => {
    let v = noMes(vida('BR', 1950, { genero: 'feminino' }), 1976);
    const ms = movimentosDaVida(v);
    expect(ms.map(m => m.m.id)).toEqual(expect.arrayContaining(['br_movimento_negro', 'br_anistia']));
    expect(ms.find(m => m.m.id === 'br_anistia')!.risco).toBe(2);
    v = executar(v, { tipo: 'eras4', oque: 'participar', movimento: 'br_anistia' }).vida;
    expect(v.era!.historia!.pressao['br_anistia']).toBeGreaterThan(0);
    expect(v.era!.historia!.movimentos['br_anistia']).toBeDefined();
    expect(disponibilidade(v, { tipo: 'eras4', oque: 'participar', movimento: 'br_anistia' }).grau).not.toBe('permitido');
  });
  it('os partidos são os do país e do mês (proibidos fora; partido único marcado; o estado conta no Brasil de 1920)', () => {
    const us = noMes(vida('US', 1900), 1914);
    expect(partidosDoPais('US')).toEqual(expect.arrayContaining(['US_DEM', 'US_REP', 'US_PROG', 'US_SOC']));
    expect(partidoDe('US_PROG')?.nome).toBe('Partido Progressista');
    noMes(us, 1925);
    expect(partidosDoPais('US')).not.toContain('US_PROG');
    noMes(vida('DE', 1900, { uf: 'BY' }), 1936);
    expect(partidosDoPais('DE')).toEqual([]);
    const ar = noMes(vida('AR', 1945), 1962);
    expect(partidosDoMesNoPais('AR', ar.t)).not.toContain('AR_PJ');
    noMes(ar, 1974);
    expect(partidosDoMesNoPais('AR', ar.t)).toContain('AR_PJ');
    const sp = noMes(vida('BR', 1900), 1925);
    expect(partidosNoMes(sp.t)).toContain('PRP_1873');
    expect(partidosNoMes(sp.t)).not.toContain('PRM_1888');
    noMes(sp, 1955);
    expect(partidosNoMes(sp.t)).toEqual(expect.arrayContaining(['PSD_1945', 'UDN', 'PTB_1945']));
    expect(partidosNoMes(sp.t)).not.toContain('PCB_1922'); // na ilegalidade desde 1947
  });
});

describe('esporte amador antes do profissionalismo', () => {
  it('o contrato de jogador de futebol não existe no Brasil de 1925 nem no Japão de 1980; existe na Inglaterra de 1905', () => {
    expect(ocupacaoAindaNaoExiste(noMes(vida('BR', 1905), 1925), 'jogador_futebol')).toBe(1933);
    expect(ocupacaoAindaNaoExiste(noMes(vida('JP', 1960), 1980), 'jogador_futebol')).toBe(1993);
    expect(ocupacaoAindaNaoExiste(noMes(vida('GB', 1885), 1905), 'jogador_futebol')).toBeUndefined();
  });
});

describe('saves', () => {
  it('a história da vida sobrevive ao save; malformada, é limpa; save antigo não ganha nada', () => {
    const v = noMes(vida('BR', 1940), 1960);
    const h = garantirHistoria(v);
    h.alteracoes.push({ reforma: 'br_lei_cao', pais: 'BR', t: v.t, alcance: 'nacional', por: 'voce', autor: 'A', antes: 29 });
    h.pressao['br_movimento_negro'] = 40;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.era!.historia).toEqual(h);
    const ruim = structuredClone(v);
    (ruim.era as unknown as Record<string, unknown>).historia = { alteracoes: [{ x: 1 }, h.alteracoes[0]], pressao: { a: 'x', b: 3 }, movimentos: 7, encontros: 'z' };
    normalizarHistoria(ruim);
    expect(ruim.era!.historia!.alteracoes.length).toBe(1);
    expect(ruim.era!.historia!.pressao).toEqual({ b: 3 });
    expect(ruim.era!.historia!.movimentos).toEqual({});
    expect(ruim.era!.historia!.encontros).toEqual([]);
    const antiga = noMes(vida('BR', 1975), 1990);
    delete antiga.era!.historia;
    const r2 = interpretar(JSON.stringify(antiga));
    expect(r2.tipo === 'ok' && r2.vida.era!.historia).toBeFalsy();
  });
  it('a vida histórica vive 40 anos com a sociedade da época sem erro, e o peso da barreira é coerente com o tempo', () => {
    let v = vida('GB', 1915, { genero: 'feminino' });
    v = viver(v, 40);
    expect(v.t).toBeGreaterThan(tDe(1950, 0));
    const p = pesoDaBarreira(noMes(v, 1930), sociedadeDoPais('GB')!.barreiras.find(b => b.id === 'gb_salario_mulher')!);
    expect(p?.fator).toBeCloseTo(0.65, 2);
  });
});
