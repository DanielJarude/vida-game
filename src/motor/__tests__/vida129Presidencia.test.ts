/**
 * VIDA 12.9 · Presidência — quem pode disputar (pelas regras do país), a corrida (indicação, chapa, eixo, estratégia,
 * debate, reta final, pesquisas), a urna (primeiro e segundo turno, vitória e derrota), a posse na capital, o governo
 * (eixos, economia, reformas, base, mundo, crises próprias, impeachment), o fim (legado, reeleição pelas regras,
 * depois da Presidência), o governador com crises do estado, o calendário por cargo (EUA) e os saves.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { CargoEletivo, Vida } from '../tipos';
import { definirPaisCorrente } from '../mundo/moeda';
import { capitalDoPais, cidadesDoPais } from '../dados/lugares';
import {
  CARGOS, cargoNoCiclo, cargosDaEleicao, cargosDoPais, entrarNaPolitica, existeCargo, mandatosDaVida, nomeCargo, partidosDoPais, podeConcorrer,
  processarPolitica, registrarCandidatura, tDaEleicao, tDaPosse, apurar, acoesPoliticas
} from '../sistemas/politica';
import {
  chancePresidencial, forcaPresidencial, governoAtual, julgarImpeachment, leituraPresidencial, natoDoPais, normalizarVida129Presidencia, pesquisa, presidencia
} from '../sistemas/presidencia129';
import { ACONTECIMENTOS_129_PRESIDENCIA } from '../conteudo/acontecimentos129Presidencia';
import { conteudoPorId, abrirDecisao } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { interpretar } from '../save';
const serializar = (v: Vida) => JSON.stringify(v);
import { REGRAS_PRESIDENCIAIS, CRISES_GOVERNADOR, CRISES_PRESIDENTE } from '../dados/presidencia129';

void ACONTECIMENTOS_129_PRESIDENCIA;
const BASE = adulto(30, { semente: 1290 });
const cidade = (pais: string, uf?: string) => (cidadesDoPais(pais).find(m => (uf ? m.uf === uf : m.perfil === 'metropole')) ?? cidadesDoPais(pais)[0]).id;

interface Opcoes { pais?: string; municipioId?: string; idade?: number; apoio?: number; reputacao?: number; ano?: number; antes?: CargoEletivo[]; porte?: number; partido?: boolean }
/** Um político pronto para a eleição presidencial de `ano` (seis meses antes dela, filiado há dez anos). */
function politico(o: Opcoes = {}): Vida {
  const pais = o.pais ?? 'BR';
  const v = structuredClone(BASE);
  const muni = o.municipioId ?? (pais === 'BR' ? 'sao-paulo-sp' : cidade(pais));
  definirPaisCorrente(pais);
  v.id = `${v.id}-pres-${pais}-${o.apoio ?? 0}-${o.reputacao ?? 0}`;
  v.moradia.municipioId = muni; v.eu.municipioNatal = muni; v.eu.nacionalidades = [pais];
  const ano = o.ano ?? (pais === 'BR' ? 2030 : REGRAS_PRESIDENCIAIS[pais]?.ciclo[0] ?? 2030);
  v.t = tDaEleicao(ano, pais) - 6;
  v.eu.tNasc = v.t - (o.idade ?? 52) * 12;
  v.caminhos.politica = undefined;
  v.trabalho.atual = undefined; v.justica = undefined; v.momento = null; v.fila = undefined;
  delete v.fatos['chegou_cidade'];
  v.anoAtual = { acoes: [] };
  const p = entrarNaPolitica(v, 'comunidade');
  if (o.partido !== false) { p.partido = partidosDoPais(pais)[0]; p.tFiliacao = v.t - 160; p.partidos = [{ sigla: p.partido, tInicio: p.tFiliacao }]; }
  p.fase = o.partido === false ? 'envolvido' : 'entre_mandatos';
  p.apoio = o.apoio ?? 70; p.reputacao = o.reputacao ?? 85; p.desgaste = 10;
  for (const c of o.antes ?? ['deputado_federal', 'governador']) { p.historico.push({ t: v.t - 120, cargo: c, resultado: 'eleito', partido: p.partido }); p.historico.push({ t: v.t - 72, cargo: c, resultado: 'concluiu', partido: p.partido }); }
  v.fatos['pol_partido_porte'] = o.porte ?? 0;
  return v;
}
const ganhar = (v: Vida) => presidencia(v).candidaturas[presidencia(v).candidaturas.length - 1];

/** A campanha inteira pelas decisões, com uma escolha por etapa (a primeira livre, ou a preferida). */
function fazerCampanha(v: Vida, prefer: string[] = []): Vida {
  v.fatos['pol_eleicao'] = v.t;
  abrirDecisao(v, conteudoPorId('pol_eleicao') as never, contexto(v, criarRng(3)));
  let x = executar(v, { tipo: 'decidir', opcaoId: 'cargo_presidente' }).vida;
  for (let k = 0; k < 10 && x.momento; k++) {
    const op = x.momento.opcoes.find(o => prefer.includes(o.id) && !o.bloqueio) ?? x.momento.opcoes.find(o => !o.bloqueio)!;
    x = executar(x, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return x;
}

describe('elegibilidade · as regras do país', () => {
  it('Brasil: presidente existe, 35 anos na posse, nato, com partido', () => {
    const v = politico();
    expect(existeCargo('presidente', 'BR')).toBe(true);
    expect(nomeCargo(v, 'presidente')).toMatch(/presidente da República|presidenta da República/);
    expect(podeTentar(podeConcorrer(v, 'presidente', tDaEleicao(2030)))).toBe(true);
    const novo = politico({ idade: 33 });
    expect(podeConcorrer(novo, 'presidente', tDaEleicao(2030)).grau).toBe('ilegal');
    const naturalizado = politico();
    naturalizado.eu.municipioNatal = cidade('PT');
    naturalizado.eu.nacionalidades = ['BR'];
    naturalizado.caminhos.marcas.push({ t: naturalizado.t - 100, tipo: 'mudanca_cidade', texto: 'Naturalizou-se brasileira.', peso: 3 });
    expect(natoDoPais(naturalizado, 'BR')).toBe(false);
    expect(podeConcorrer(naturalizado, 'presidente', tDaEleicao(2030)).grau).toBe('ilegal');
    const semPartido = politico({ partido: false });
    expect(podeTentar(podeConcorrer(semPartido, 'presidente', tDaEleicao(2030)))).toBe(false);
  });
  it('sem nome nacional nenhum partido lança; com nome médio, a convenção decide (improvável)', () => {
    expect(podeConcorrer(politico({ reputacao: 20, apoio: 30 }), 'presidente', tDaEleicao(2030)).grau).toBe('requisito');
    expect(podeConcorrer(politico({ reputacao: 42 }), 'presidente', tDaEleicao(2030)).grau).toBe('improvavel');
  });
  it('o ciclo: no Brasil, a Presidência cai nas gerais (2030, 2034), não nas municipais', () => {
    expect(cargoNoCiclo('presidente', 2030, 'BR')).toBe(true);
    expect(cargoNoCiclo('presidente', 2034, 'BR')).toBe(true);
    expect(podeConcorrer(politico(), 'presidente', tDaEleicao(2032)).grau).toBe('impossivel');
  });
  it('EUA: Presidência de quatro em quatro anos (2028, 2032), nunca na eleição de meio de mandato; candidatura independente existe', () => {
    expect(cargoNoCiclo('presidente', 2028, 'US')).toBe(true);
    expect(cargoNoCiclo('presidente', 2030, 'US')).toBe(false);
    const v = politico({ pais: 'US', ano: 2028 });
    expect(podeTentar(podeConcorrer(v, 'presidente', tDaEleicao(2028, 'US')))).toBe(true);
    definirPaisCorrente('US');
    expect(podeConcorrer(v, 'presidente', tDaEleicao(2030, 'US')).grau).toBe('impossivel');
    const ind = politico({ pais: 'US', ano: 2028, partido: false });
    expect(podeTentar(podeConcorrer(ind, 'presidente', tDaEleicao(2028, 'US')))).toBe(true);
    definirPaisCorrente('BR');
  });
  it('EUA: o Senado pela classe das cadeiras do estado (o bug latente) e o Distrito de Colúmbia sem senador nem governador', () => {
    // Nova York: classes 1 e 3 (2030, 2028/2034); Texas: 1 e 2 (2026/2032, 2030).
    expect(cargoNoCiclo('senador', 2026, 'US', 'NY')).toBe(false);
    expect(cargoNoCiclo('senador', 2028, 'US', 'NY')).toBe(true);
    expect(cargoNoCiclo('senador', 2030, 'US', 'NY')).toBe(true);
    expect(cargoNoCiclo('senador', 2026, 'US', 'TX')).toBe(true);
    expect(cargoNoCiclo('senador', 2028, 'US', 'TX')).toBe(false);
    expect(cargoNoCiclo('senador', 2028, 'US', 'DC')).toBe(false);
    expect(cargoNoCiclo('governador', 2030, 'US', 'DC')).toBe(false);
    // Fora dos EUA, o Senado segue a eleição geral do país.
    expect(cargoNoCiclo('senador', 2030, 'BR', 'PE')).toBe(true);
    const ny = politico({ pais: 'US', ano: 2026, municipioId: cidade('US', 'NY') });
    definirPaisCorrente('US');
    expect(podeConcorrer(ny, 'senador', tDaEleicao(2026, 'US')).grau).toBe('impossivel');
    definirPaisCorrente('BR');
  });
  it('parlamentaristas e monarquias não oferecem a Presidência (documentado); Portugal e França ficam de fora pelo calendário', () => {
    for (const pais of ['DE', 'IT', 'GB', 'ES', 'JP', 'CA', 'IN', 'ZA', 'AO', 'PT', 'FR']) {
      expect(existeCargo('presidente', pais)).toBe(false);
      expect(cargosDoPais(pais)).not.toContain('presidente');
    }
    for (const pais of Object.keys(REGRAS_PRESIDENCIAIS)) expect(cargosDoPais(pais)).toContain('presidente');
    const de = politico({ pais: 'DE', ano: 2029 });
    expect(leituraPresidencial(de)?.semPresidencia).toMatch(/parlamento|direta/);
  });
  it('a capital de cada país com Presidência existe (para a mudança na posse)', () => {
    for (const pais of Object.keys(REGRAS_PRESIDENCIAIS)) expect(cidadesDoPais(pais).length).toBeGreaterThan(0);
  });
});

describe('candidatura e campanha', () => {
  it('a eleição oferece a Presidência; registrar abre a corrida com adversários de verdade (nome, partido, de onde vêm)', () => {
    const v = politico();
    expect(cargosDaEleicao(v).map(x => x.cargo)).toContain('presidente');
    registrarCandidatura(v, 'presidente', tDaEleicao(2030));
    const c = presidencia(v).campanha!;
    expect(c.adversarios.length).toBe(4);
    for (const a of c.adversarios) { expect(a.nome).toMatch(/\S+ \S+/); expect(a.partido).toBeTruthy(); expect(a.partido).not.toBe(v.caminhos.politica!.partido); expect(a.perfil.length).toBeGreaterThan(5); }
    expect(c.via).toBe('convencao');
    expect(c.pesquisas.length).toBe(1);
    expect(pesquisa(v).some(x => x.voce)).toBe(true);
    // EUA: dois adversários (sem segundo turno) e as primárias.
    const us = politico({ pais: 'US', ano: 2028 });
    registrarCandidatura(us, 'presidente', tDaEleicao(2028, 'US'));
    expect(presidencia(us).campanha!.adversarios.length).toBe(2);
    expect(presidencia(us).campanha!.via).toBe('primarias');
    definirPaisCorrente('BR');
  });
  it('a campanha passa pela indicação, a chapa, o eixo, a estratégia, o debate e a reta final — e cada etapa mexe na pesquisa', () => {
    const v = fazerCampanha(politico({ reputacao: 95, apoio: 85 }), ['previas', 'chapa_coligacao', 'eixo_economia', 'aliancas', 'debate_calma']);
    const c = presidencia(v).campanha;
    // Se a convenção escolheu outro nome, a corrida acaba (e fica registrado); senão, chegou pronta para a urna.
    if (!c) { expect(ganhar(v).resultado).toBe('preterido'); return; }
    expect(c.etapa).toBe(6);
    expect(c.chapa).toBe('coligacao');
    expect(c.eixo).toBe('economia');
    expect(c.estrategia).toBe('aliancas');
    expect(c.debate).toBe('calma');
    expect(c.reta).toBeTruthy();
    expect(c.pesquisas.length).toBeGreaterThanOrEqual(6);
    expect(v.caminhos.politica!.campanha!.nota).toBeGreaterThan(10);
  });
  it('o debate tem consequência: faltar derruba; propostas bem feitas sobem', () => {
    const notas = (op: string) => {
      let soma = 0;
      for (let s = 0; s < 8; s++) {
        const v = politico({ reputacao: 95, apoio: 85 });
        v.id += `-deb${s}`; v.rng = 7001 + s * 97;
        registrarCandidatura(v, 'presidente', tDaEleicao(2030));
        presidencia(v).campanha!.etapa = 4;
        abrirDecisao(v, conteudoPorId('presc_campanha') as never, contexto(v, criarRng(s)));
        const antes = v.caminhos.politica!.campanha!.nota;
        const x = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
        soma += x.caminhos.politica!.campanha!.nota - antes;
      }
      return soma / 8;
    };
    expect(notas('debate_faltar')).toBeLessThan(0);
    expect(notas('debate_propostas')).toBeGreaterThan(notas('debate_faltar') + 3);
  });
  it('a indicação pode não vir: quem tem pouco lugar no partido costuma perder a convenção', () => {
    let perdeu = 0;
    for (let s = 0; s < 12; s++) {
      const v = politico({ reputacao: 52, apoio: 30 });
      v.id += `-conv${s}`;
      v.caminhos.politica!.tFiliacao = v.t - 8; v.caminhos.politica!.historico = [];
      registrarCandidatura(v, 'presidente', tDaEleicao(2030));
      abrirDecisao(v, conteudoPorId('presc_campanha') as never, contexto(v, criarRng(s)));
      const x = executar(v, { tipo: 'decidir', opcaoId: 'previas' }).vida;
      if (ganhar(x)?.resultado === 'preterido') { perdeu++; expect(x.caminhos.politica!.campanha).toBeUndefined(); }
    }
    expect(perdeu).toBeGreaterThan(6);
  });
});

describe('a urna · vitória, derrota, segundo turno', () => {
  const eleger = (v: Vida, escolha = 'centro'): Vida => {
    registrarCandidatura(v, 'presidente', tDaEleicao(2030));
    presidencia(v).campanha!.etapa = 6;
    v.t = tDaEleicao(2030) + 1;
    v.anoAtual = { acoes: [] };
    processarPolitica(v, criarRng(9));
    if (presidencia(v).campanha?.segundo) {
      // O segundo turno: a decisão da última semana (abre pela fila do ano) — aqui, direto.
      presidencia(v).campanha!.segundo!.escolha = escolha;
      apurar(v, criarRng(10));
    }
    return v;
  };
  it('a trajetória mais forte vence muitas vezes, mas não sempre; a fraca quase nunca', () => {
    let fortes = 0, fracos = 0;
    for (let s = 0; s < 30; s++) {
      const f = politico({ reputacao: 95, apoio: 85 }); f.id += `-f${s}`;
      if (ganhar(eleger(f))?.resultado === 'eleito') fortes++;
      const w = politico({ reputacao: 45, apoio: 35, antes: ['deputado_estadual'], porte: 2 }); w.id += `-w${s}`;
      if (ganhar(eleger(w))?.resultado === 'eleito') fracos++;
    }
    expect(fortes).toBeGreaterThan(6);
    expect(fortes).toBeLessThan(30);
    expect(fracos).toBeLessThan(5);
  });
  it('no Brasil há segundo turno (quando ninguém passa de 50%); nos EUA, não', () => {
    let segundos = 0;
    for (let s = 0; s < 25; s++) {
      const v = politico({ reputacao: 90, apoio: 80 }); v.id += `-2t${s}`;
      registrarCandidatura(v, 'presidente', tDaEleicao(2030));
      v.t = tDaEleicao(2030) + 1;
      processarPolitica(v, criarRng(1));
      if (presidencia(v).campanha?.segundo) {
        segundos++;
        expect(v.caminhos.politica!.campanha).toBeTruthy();
        expect(v.fatos['pres_2turno']).toBe(v.t);
        // A decisão do segundo turno aparece (urgente) e resolve a apuração.
        const d = conteudoPorId('prest_segundo_turno')!;
        expect(d.quando!(contexto(v, criarRng(1)))).toBe(true);
        abrirDecisao(v, d as never, contexto(v, criarRng(2)));
        const x = executar(v, { tipo: 'decidir', opcaoId: 'centro' }).vida;
        expect(x.caminhos.politica!.campanha).toBeUndefined();
        expect(ganhar(x).segundo?.voce).toBeGreaterThan(0);
      }
    }
    expect(segundos).toBeGreaterThan(3);
    for (let s = 0; s < 6; s++) {
      const us = politico({ pais: 'US', ano: 2028 }); us.id += `-us${s}`;
      registrarCandidatura(us, 'presidente', tDaEleicao(2028, 'US'));
      us.t = tDaEleicao(2028, 'US') + 1;
      processarPolitica(us, criarRng(1));
      expect(presidencia(us).campanha).toBeUndefined();
      expect(ganhar(us).segundo).toBeUndefined();
    }
    definirPaisCorrente('BR');
  });
  it('a derrota fica no histórico (com os números do primeiro turno) e devolve à vida de antes', () => {
    const v = eleger(politico({ reputacao: 45, apoio: 35, antes: ['deputado_estadual'], porte: 2 }));
    const h = ganhar(v);
    expect(h.resultado).toBe('derrotado');
    expect(h.primeiro?.some(x => x.voce)).toBe(true);
    expect(v.caminhos.politica!.historico.some(x => x.cargo === 'presidente' && x.resultado === 'derrotado')).toBe(true);
    expect(v.caminhos.politica!.fase).toBe('entre_mandatos');
    expect(leituraPresidencial(v)!.candidaturas[0].texto).toMatch(/derrotad/);
  });
});

/** Um presidente em exercício (eleito e empossado pelo motor). */
function presidenteEmExercicio(o: Opcoes = {}): Vida {
  const pais = o.pais ?? 'BR';
  const v = politico(o);
  const ano = o.ano ?? (pais === 'BR' ? 2030 : REGRAS_PRESIDENCIAIS[pais].ciclo[0]);
  registrarCandidatura(v, 'presidente', tDaEleicao(ano, pais));
  presidencia(v).campanha!.chapa = 'coligacao';
  // Uma vitória garantida para o teste: a apuração pelo motor, com a força no teto.
  for (const a of presidencia(v).campanha!.adversarios) a.forca = 10;
  v.t = tDaEleicao(ano, pais) + 1;
  processarPolitica(v, criarRng(4));
  v.t = tDaPosse(ano, pais) + 1;
  v.anoAtual = { acoes: [] };
  processarPolitica(v, criarRng(5));
  v.momento = null; v.fila = undefined;
  return v;
}

describe('posse e governo', () => {
  it('a posse: o emprego de presidente, a mudança para a capital do país, o governo com a economia e a base', () => {
    const v = presidenteEmExercicio();
    expect(v.caminhos.politica!.mandato?.cargo).toBe('presidente');
    expect(v.trabalho.atual?.ocupacaoId).toBe('presidente');
    expect(v.trabalho.atual?.empregador).toMatch(/Planalto/);
    // A mudança para Brasília (um processo de mudança efetivo agora).
    expect(v.moradia.municipioId).toBe(capitalDoPais('BR')!.id);
    const g = governoAtual(v)!;
    expect(g.base).toBeGreaterThan(20);
    expect(Number.isFinite(g.inflacao)).toBe(true);
    expect(v.biografia.some(e => /rampa do Palácio do Planalto/.test(e.texto))).toBe(true);
    expect(CARGOS.presidente.executivo).toBe(true);
  });
  it('o presidente tem verbos próprios (não o posto do bairro): eixos, economia, reforma, base, mundo, pronunciamento', () => {
    const v = presidenteEmExercicio();
    const ids = acoesPoliticas(v, disponibilidade).map(x => x.id);
    expect(ids).toEqual(expect.arrayContaining(['pres_eixos', 'pres_economia', 'pres_reforma', 'pres_base', 'pres_mundo', 'pres_pronunciamento']));
    expect(ids).not.toContain('pol_prioridade');
    expect(ids).not.toContain('pol_comunidade');
    expect(ids.some(x => x.startsWith('pol_cargo_'))).toBe(false);
  });
  it('decisões nacionais: a política econômica muda os números do ano; a reforma tramita casa por casa', () => {
    const v = presidenteEmExercicio();
    const g = governoAtual(v)!;
    const A = (valor: string) => ({ tipo: 'politica', oque: 'governo129', valor } as unknown as Acao);
    let x = executar(v, A('economia')).vida;
    expect(x.momento?.situacaoId).toBe('presg_economia');
    x = executar(x, { tipo: 'decidir', opcaoId: 'e_ajuste' }).vida;
    expect(governoAtual(x)!.politica?.id).toBe('ajuste');
    // A reforma: com base larga, passa nas duas casas em dois anos.
    const y = structuredClone(x);
    governoAtual(y)!.base = 80; y.caminhos.politica!.mandato!.aprovacao = 70;
    y.anoAtual = { acoes: [] };
    let z = executar(y, A('reforma')).vida;
    z = executar(z, { tipo: 'decidir', opcaoId: 'r_tributaria' }).vida;
    expect(governoAtual(z)!.reforma?.etapa).toBe(1);
    for (let k = 0; k < 2; k++) { z.t += 12; z.anoAtual = { acoes: [] }; processarPolitica(z, criarRng(20 + k)); }
    expect(governoAtual(z)!.reformas.some(r => r.id === 'tributaria' && r.aprovada)).toBe(true);
    expect(governoAtual(z)!.ajuste.pib).toBeGreaterThan(0);
    void g;
  });
  it('a reforma sem base é derrotada', () => {
    const v = presidenteEmExercicio();
    const g = governoAtual(v)!;
    g.base = 15; v.caminhos.politica!.mandato!.aprovacao = 25;
    g.reforma = { id: 'previdencia', etapa: 1, t: v.t - 12 };
    v.t += 12; v.anoAtual = { acoes: [] };
    processarPolitica(v, criarRng(7));
    expect(governoAtual(v)?.reformas.some(r => r.id === 'previdencia' && !r.aprovada) ?? true).toBe(true);
  });
  it('popularidade: a economia mexe na aprovação (crescimento ajuda; desemprego alto derruba)', () => {
    const bom = presidenteEmExercicio(); const ruim = structuredClone(bom);
    const gb = governoAtual(bom)!; gb.pib = 4; gb.desemprego = 5; gb.inflacao = 3.5; gb.ajuste.pib = 1.5;
    const gr = governoAtual(ruim)!; gr.pib = -3; gr.desemprego = 14; gr.inflacao = 12; gr.ajuste.pib = -2; gr.ajuste.inflacao = 5; gr.ajuste.desemprego = 5;
    for (let k = 0; k < 3; k++) { for (const x of [bom, ruim]) { x.t += 12; x.anoAtual = { acoes: [] }; processarPolitica(x, criarRng(30 + k)); } }
    expect(bom.caminhos.politica!.mandato!.aprovacao).toBeGreaterThan(ruim.caminhos.politica!.mandato?.aprovacao ?? 0);
  });
  it('eventos exclusivos: as crises do presidente são do país; as do governador, do estado; o prefeito segue com a cidade', () => {
    expect(CRISES_PRESIDENTE.every(x => x.startsWith('pres_'))).toBe(true);
    expect(CRISES_GOVERNADOR.filter(x => x.startsWith('gov_')).length).toBeGreaterThanOrEqual(6);
    for (const t of CRISES_PRESIDENTE) {
      const v = presidenteEmExercicio();
      v.caminhos.politica!.mandato!.crise = { t: v.t, tipo: t };
      const d = conteudoPorId('presg_crise')!;
      expect(d.quando!(contexto(v, criarRng(1)))).toBe(true);
      expect(conteudoPorId('pol_crise')!.quando!(contexto(v, criarRng(1)))).toBe(false);
      abrirDecisao(v, d as never, contexto(v, criarRng(1)));
      expect(v.momento!.opcoes.filter(o => !o.bloqueio).length).toBe(3);
      const x = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)!.id }).vida;
      expect(x.caminhos.politica!.mandato?.crise).toBeUndefined();
      expect(x.caminhos.politica!.mandato?.marcos?.length ?? 0).toBeGreaterThan(0);
    }
    // O governador: a crise de estado abre a cena do estado (não "gente dormindo na escola").
    const gov = politico();
    const p = gov.caminhos.politica!;
    p.fase = 'mandato'; p.mandato = { cargo: 'governador', tInicio: gov.t - 12, tFim: gov.t + 36, aprovacao: 55, feito: 0, crise: { t: gov.t, tipo: 'gov_hospital' } };
    expect(conteudoPorId('govg_crise')!.quando!(contexto(gov, criarRng(1)))).toBe(true);
    expect(conteudoPorId('pol_crise')!.quando!(contexto(gov, criarRng(1)))).toBe(false);
    abrirDecisao(gov, conteudoPorId('govg_crise') as never, contexto(gov, criarRng(1)));
    expect(gov.momento!.texto).toMatch(/hospital regional/);
    // E as ações do Executivo estadual aparecem para o governador.
    gov.momento = null;
    gov.trabalho.atual = { ocupacaoId: 'governador', empregador: 'x', contrato: 'eletivo', salario: 30000, tInicio: gov.t - 12, desempenho: 60, municipioId: gov.moradia.municipioId, carga: 'integral' };
    const ids = acoesPoliticas(gov, disponibilidade).map(x => x.id);
    expect(ids).toEqual(expect.arrayContaining(['pol_gov_seguranca', 'pol_gov_interior', 'pol_gov_repasses']));
  });
  it('o governador sorteia crises do estado; o prefeito, as da cidade', () => {
    const tipos = (cargo: CargoEletivo) => {
      const s = new Set<string>();
      for (let k = 0; k < 60; k++) {
        const v = politico(); v.id += `-cr${k}`;
        const p = v.caminhos.politica!;
        p.fase = 'mandato'; p.mandato = { cargo, tInicio: v.t - 12, tFim: v.t + 36, aprovacao: 55, feito: 0 };
        processarPolitica(v, criarRng(k));
        if (p.mandato?.crise) s.add(p.mandato.crise.tipo);
      }
      return [...s];
    };
    expect(tipos('governador').some(t => t.startsWith('gov_'))).toBe(true);
    expect(tipos('governador')).not.toContain('chuva');
    expect(tipos('prefeito').every(t => !t.startsWith('gov_') && !t.startsWith('pres_'))).toBe(true);
  });
});

describe('consequências · impeachment', () => {
  it('rua contra, base pequena e um escândalo abrem o processo; a votação decide pelo quórum do país', () => {
    let abriu = 0, caiu = 0, sobreviveu = 0;
    for (let s = 0; s < 20; s++) {
      const v = presidenteEmExercicio(); v.id += `-imp${s}`;
      const g = governoAtual(v)!;
      g.base = 20; g.escandalos = 2; v.caminhos.politica!.mandato!.aprovacao = 12;
      v.t += 12; v.anoAtual = { acoes: [] };
      processarPolitica(v, criarRng(s));
      if (!governoAtual(v)?.impeachment) continue;
      abriu++;
      expect(v.fatos['pres_impeachment']).toBe(v.t);
      let r = julgarImpeachment(v, criarRng(s), 0);
      if (r.seguiu) r = julgarImpeachment(v, criarRng(s + 1), 0);
      if (r.caiu) {
        caiu++;
        expect(v.caminhos.politica!.mandato).toBeUndefined();
        expect(v.caminhos.politica!.historico.some(h => h.cargo === 'presidente' && h.resultado === 'cassado')).toBe(true);
        expect(v.caminhos.politica!.inelegivelAte).toBeGreaterThan(v.t + 90);
        expect(presidencia(v).mandatos[presidencia(v).mandatos.length - 1].como).toBe('afastado');
      } else sobreviveu++;
    }
    expect(abriu).toBeGreaterThan(5);
    expect(caiu + sobreviveu).toBe(abriu);
    // Com base larga, o processo não passa.
    const forte = presidenteEmExercicio();
    governoAtual(forte)!.base = 70; governoAtual(forte)!.impeachment = { t: forte.t, etapa: 1 };
    expect(julgarImpeachment(forte, criarRng(1), 0).caiu).toBe(false);
  });
});

describe('encerramento e reeleição', () => {
  it('o fim do mandato deixa o legado e pergunta o que fazer depois', () => {
    const v = presidenteEmExercicio();
    const m = v.caminhos.politica!.mandato!;
    v.fatos['pol_nao_concorre'] = undefined as never; delete v.fatos['pol_nao_concorre'];
    v.t = m.tFim + 1; v.anoAtual = { acoes: [] };
    processarPolitica(v, criarRng(1));
    const e = presidencia(v);
    expect(e.governo).toBeUndefined();
    expect(e.mandatos.length).toBe(1);
    expect(e.mandatos[0].legado.length).toBeGreaterThan(10);
    expect(v.fatos['pres_depois']).toBe(v.t);
    expect(conteudoPorId('presd_depois')!.quando!(contexto(v, criarRng(1)))).toBe(true);
    expect(mandatosDaVida(v).some(x => /presidente|presidenta/.test(x.cargo) && x.como === 'concluído')).toBe(true);
  });
  it('Brasil: uma reeleição seguida, e não uma terceira', () => {
    const v = presidenteEmExercicio();
    expect(podeTentar(podeConcorrer(v, 'presidente', tDaEleicao(2034)))).toBe(true);
    v.caminhos.politica!.consecutivos = 2;
    const d = podeConcorrer(v, 'presidente', tDaEleicao(2034));
    expect(d.grau).toBe('ilegal');
    expect(d.motivo).toMatch(/reeleição/);
  });
  it('EUA: dois mandatos na vida inteira; México e Colômbia: um só; Chile: sem reeleição imediata', () => {
    const us = presidenteEmExercicio({ pais: 'US', ano: 2028 });
    definirPaisCorrente('US');
    expect(podeTentar(podeConcorrer(us, 'presidente', tDaEleicao(2032, 'US')))).toBe(true);
    us.caminhos.politica!.historico.push({ t: us.t - 200, cargo: 'presidente', resultado: 'eleito' });
    expect(podeConcorrer(us, 'presidente', tDaEleicao(2032, 'US')).grau).toBe('ilegal');
    const mx = presidenteEmExercicio({ pais: 'MX', ano: 2030 });
    definirPaisCorrente('MX');
    expect(podeConcorrer(mx, 'presidente', tDaEleicao(2036, 'MX')).grau).toBe('ilegal');
    const cl = presidenteEmExercicio({ pais: 'CL', ano: 2029 });
    definirPaisCorrente('CL');
    expect(podeConcorrer(cl, 'presidente', tDaEleicao(2033, 'CL')).grau).toBe('ilegal');
    // Depois de um mandato de intervalo, volta a poder.
    const m = cl.caminhos.politica!.mandato!;
    cl.t = m.tFim + 1; cl.anoAtual = { acoes: [] };
    processarPolitica(cl, criarRng(1));
    cl.t = tDaEleicao(2037, 'CL') - 6;
    expect(podeConcorrer(cl, 'presidente', tDaEleicao(2037, 'CL')).grau).not.toBe('ilegal');
    definirPaisCorrente('BR');
  });
  it('a reeleição vencida mantém o governo e arquiva o primeiro mandato no legado', () => {
    const v = presidenteEmExercicio();
    v.t = tDaEleicao(2034) - 6; v.anoAtual = { acoes: [] };
    registrarCandidatura(v, 'presidente', tDaEleicao(2034));
    expect(presidencia(v).campanha!.via).toBe('reeleicao');
    for (const a of presidencia(v).campanha!.adversarios) a.forca = 5;
    v.t = tDaEleicao(2034) + 1; processarPolitica(v, criarRng(2));
    v.t = tDaPosse(2034) + 1; v.anoAtual = { acoes: [] }; processarPolitica(v, criarRng(3));
    expect(v.caminhos.politica!.consecutivos).toBe(2);
    expect(governoAtual(v)).toBeTruthy();
    expect(presidencia(v).mandatos.length).toBe(1);
    expect(presidencia(v).candidaturas.filter(c => c.resultado === 'eleito').length).toBe(2);
  });
});

describe('histórico e saves', () => {
  it('a leitura mostra as regras do país, a corrida, o governo e o histórico de candidaturas', () => {
    const v = politico();
    const l = leituraPresidencial(v)!;
    expect(l.regras?.idade).toBe(35);
    expect(l.regras?.segundoTurno).toBe(true);
    expect(l.requisitos?.length).toBeGreaterThan(3);
    registrarCandidatura(v, 'presidente', tDaEleicao(2030));
    expect(leituraPresidencial(v)!.campanha?.pesquisa.length).toBe(5);
    const g = presidenteEmExercicio();
    expect(leituraPresidencial(g)!.governo?.base).toBeGreaterThan(0);
    expect(leituraPresidencial(g)!.candidaturas[0].ganhou).toBe(true);
  });
  it('saves antigos (sem o campo) carregam; o estado presidencial atravessa o save; um estado quebrado é descartado', () => {
    const antigo = politico();
    delete antigo.caminhos.politica!.presidencia;
    const r0 = interpretar(serializar(antigo));
    expect(r0.tipo).toBe('ok');
    const v = presidenteEmExercicio();
    const r1 = interpretar(serializar(v));
    expect(r1.tipo).toBe('ok');
    if (r1.tipo === 'ok') { expect(r1.vida.caminhos.politica!.presidencia?.governo?.base).toBe(governoAtual(v)!.base); expect(r1.vida.caminhos.politica!.mandato?.cargo).toBe('presidente'); }
    const quebrado = structuredClone(v);
    (quebrado.caminhos.politica!.presidencia as unknown as { candidaturas: unknown }).candidaturas = 'x';
    normalizarVida129Presidencia(quebrado);
    expect(quebrado.caminhos.politica!.presidencia).toBeUndefined();
    expect(quebrado.caminhos.politica!.mandato?.cargo).toBe('presidente');
  });
  it('a força e a chance são números com sentido (a trajetória pesa)', () => {
    const f = politico({ reputacao: 95, apoio: 85 }); const w = politico({ reputacao: 45, apoio: 35, antes: ['deputado_estadual'] });
    registrarCandidatura(f, 'presidente', tDaEleicao(2030)); registrarCandidatura(w, 'presidente', tDaEleicao(2030));
    expect(forcaPresidencial(f)).toBeGreaterThan(forcaPresidencial(w) + 15);
    expect(chancePresidencial(f)).toBeGreaterThan(chancePresidencial(w));
    expect(chancePresidencial(f)).toBeLessThan(0.95);
  });
});
