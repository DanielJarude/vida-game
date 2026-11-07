/**
 * VIDA 13 · Fama — o núcleo único do reconhecimento (`sistemas/reconhecimento13`), as reações do mundo proporcionais ao
 * nome (`f13_*`) e os eventos que só existem com histórico registrado (`h13_*`).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { avancarAno } from '../ano';
import { vincular } from '../pessoas';
import { anoDe } from '../tempo';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { CATALOGO } from '../conteudo/catalogo';
import type { Ctx, Decisao } from '../conteudo/base';
import { interpretar } from '../save';
import { criarRng } from '../rng';
import { processarNotoriedade } from '../sistemas/notoriedade';
import {
  CHANCE_DE_LEMBRANCA13, CHANCE_DE_REACAO13, imagemDaFama13, intensidade13, leituraDaFama13, marcosDoEstado13, mundoReage13, nomeDasEmpresas13,
  normalizarVida13Fama, origensDaFama13, registrarMarcos13, valorDaCampanha13
} from '../sistemas/reconhecimento13';
import type { ConquistaEsportiva, Empresa, Vida } from '../tipos';

let BASE: Vida;
beforeAll(() => { BASE = adulto(38, { municipioId: 'sao-paulo-sp', semente: 73 }); });
const nova = () => structuredClone(BASE);
const comNome = (v: Vida, valor: number, fonte: 'esporte' | 'arte' | 'politica' | 'negocio' | 'rede') => { v.notoriedade = { valor, pico: valor, t: v.t, fonte, origens: { [fonte]: valor } }; return v; };
const titulo = (v: Vida, anosAtras: number, extra: Partial<ConquistaEsportiva> = {}): ConquistaEsportiva => ({ tipo: 'titulo', modalidade: 'futebol', ano: anoDe(v.t) - anosAtras, t: v.t - anosAtras * 12, competicao: 'Série A', clube: 'Atlético Paulistano', papel: 'protagonista', texto: 'Campeão da Série A', ...extra });
const empresa = (v: Vida, o: Partial<Empresa>): Empresa => ({ id: `emp-${Object.keys(o).join('')}`, tipo: 'montadora', nome: 'Atlântica Motors', municipioId: v.moradia.municipioId, tInicio: v.t - 120, papel: 'dono', parte: 1, investido: 1e8, caixa: 1e7, ativos: 1e8, unidades: 1, qualidade: 60, reputacao: 60, equipe: 900, preco: 'medio', gestao: 'propria', distribuir: false, anosNoVermelho: 0, estado: 'operando', avaliacao: 2e9, ...o } as Empresa);
const prep = (id: string, v: Vida) => preparar(conteudoPorId(id)!, v, criarRng(5));
const H13 = CATALOGO.filter(c => c.id.startsWith('h13_')).map(c => c.id);
const F13 = CATALOGO.filter(c => c.id.startsWith('f13_')).map(c => c.id);

describe('as origens da fama (cada uma com o registro que a prova)', () => {
  it('esportiva — e o feito da seleção como origem própria, com o texto do registro', () => {
    const v = comNome(nova(), 70, 'esporte');
    v.caminhos.palmares = [titulo(v, 3), { ...titulo(v, 2), tipo: 'selecao', competicao: 'torneio mundial de seleções', texto: 'Campeão do torneio mundial de seleções', clube: undefined }];
    registrarMarcos13(v);
    const o = origensDaFama13(v);
    expect(o[0].origem).toBe('esportiva');
    expect(o[0].porque).toMatch(/1 título no futebol/);
    const feito = o.find(x => x.origem === 'feito');
    expect(feito?.porque).toMatch(/Campeão do torneio mundial de seleções/);
  });
  it('musical × artística: a linguagem do trabalho decide', () => {
    const v = comNome(nova(), 50, 'arte');
    v.caminhos.arte = { linguagem: 'musica', nome: 'Os Andarilhos', tipo: 'banda', tInicio: v.t - 100, publico: 60, membros: [], ativo: true };
    expect(origensDaFama13(v)[0].origem).toBe('musical');
    v.caminhos.arte = { ...v.caminhos.arte, linguagem: 'teatro' as never, tipo: 'companhia' };
    expect(origensDaFama13(v)[0].origem).toBe('artistica');
  });
  it('empresarial: a empresa grande dá nome ao dono (o motivo extra da notoriedade), na medida do valor', () => {
    const v = nova();
    v.financas.empresas = [empresa(v, { avaliacao: 2e9 })];
    expect(nomeDasEmpresas13(v)!.valor).toBeGreaterThan(40);
    for (let k = 0; k < 6; k++) { v.t += 12; processarNotoriedade(v); }
    expect(v.notoriedade!.fonte).toBe('negocio');
    expect(origensDaFama13(v)[0]).toMatchObject({ origem: 'empresarial', porque: expect.stringContaining('Atlântica Motors') });
    // A pequena não dá nome; o investidor não aparece; a que está abrindo, metade.
    const w = nova();
    w.financas.empresas = [empresa(w, { avaliacao: 3e6 })];
    expect(nomeDasEmpresas13(w)).toBeUndefined();
    w.financas.empresas = [empresa(w, { papel: 'investidor' })];
    expect(nomeDasEmpresas13(w)).toBeUndefined();
    w.financas.empresas = [empresa(w, { estado: 'abrindo' })];
    expect(nomeDasEmpresas13(w)!.valor).toBeCloseTo(nomeDasEmpresas13(v)!.valor / 2, 0);
  });
  it('política e controvérsia: a polêmica vira origem só quando a rejeição é o que mais se lembra', () => {
    const v = comNome(nova(), 45, 'politica');
    v.caminhos.politica = { fase: 'mandato', tInicio: v.t - 100, origem: 'comunidade', reputacao: 60, apoio: 40, desgaste: 20, consecutivos: 1, historico: [{ t: v.t - 30, cargo: 'vereador', resultado: 'eleito' }], mandato: { cargo: 'vereador', tInicio: v.t - 30, tFim: v.t + 18, aprovacao: 50, feito: 0 } } as never;
    expect(origensDaFama13(v)[0]).toMatchObject({ origem: 'politica', porque: expect.stringMatching(/1 eleição vencida/) });
    expect(origensDaFama13(v).some(o => o.origem === 'controversia')).toBe(false);
    v.segredos = [{ id: 's1', tipo: 'processo', t: v.t - 14, quemSabe: [], publico: v.t - 12 }];
    (v.caminhos.politica as { escandalo?: unknown }).escandalo = { t: v.t - 12, tipo: 'processo' };
    v.fatos['vis_polemica'] = v.t - 6;
    registrarMarcos13(v);
    expect(imagemDaFama13(v)!.rejeicao).toBeGreaterThanOrEqual(35);
    expect(origensDaFama13(v).find(o => o.origem === 'controversia')?.porque).toMatch(/polêmica|notícia|Escândalo/);
  });
});

describe('proporcionalidade: o tamanho do nome manda', () => {
  it('a campanha cresce com o nome, com o alcance e com o país — e cai com a rejeição', () => {
    const vals = [20, 35, 55, 80].map(x => valorDaCampanha13(comNome(nova(), x, 'esporte')));
    expect(vals[0]).toBe(Math.round(vals[0]));
    for (let k = 1; k < vals.length; k++) expect(vals[k]).toBeGreaterThan(vals[k - 1]);
    expect(valorDaCampanha13(comNome(nova(), 15, 'esporte'))).toBe(0);
    const querido = comNome(nova(), 60, 'esporte');
    const rejeitado = comNome(nova(), 60, 'esporte');
    rejeitado.segredos = [{ id: 's', tipo: 'prisao', t: rejeitado.t - 13, quemSabe: [], publico: rejeitado.t - 12 }];
    registrarMarcos13(rejeitado);
    expect(valorDaCampanha13(rejeitado)).toBeLessThan(valorDaCampanha13(querido));
    const fora = comNome(nova(), 60, 'esporte');
    fora.moradia.municipioId = 'us:nova-york';
    expect(valorDaCampanha13(fora)).toBeGreaterThan(valorDaCampanha13(querido));
  });
  it('as chances de reação sobem por faixa, e o anônimo não tem nenhuma', () => {
    expect(CHANCE_DE_REACAO13[0]).toBe(0);
    for (let k = 1; k < CHANCE_DE_REACAO13.length; k++) expect(CHANCE_DE_REACAO13[k]).toBeGreaterThan(CHANCE_DE_REACAO13[k - 1]);
    expect(CHANCE_DE_REACAO13[4] + CHANCE_DE_LEMBRANCA13).toBeLessThan(0.5);
    expect(intensidade13(nova())).toBe(0);
    expect(intensidade13(comNome(nova(), 80, 'arte'))).toBeGreaterThan(intensidade13(comNome(nova(), 30, 'arte')));
  });
  it('benefícios e custos crescem juntos (fama tem os dois lados)', () => {
    const local = leituraDaFama13(comNome(nova(), 15, 'arte'));
    const grande = leituraDaFama13(comNome(nova(), 85, 'arte'));
    expect(local.relevante).toBe(true);
    expect(grande.beneficios.length).toBeGreaterThan(local.beneficios.length);
    expect(grande.custos.length).toBeGreaterThan(local.custos.length);
    expect(grande.privacidade).toBe('quase nenhuma');
    expect(local.privacidade).toBe('tranquila');
    expect(leituraDaFama13(nova()).relevante).toBe(false);
  });
  it('as reações respeitam a origem: o político não recebe campanha de marca; a empresária recebe o mercado', () => {
    const pol = comNome(nova(), 60, 'politica');
    expect(prep('f13_patrocinio', pol)).toBeNull();
    const atleta = comNome(nova(), 60, 'esporte');
    expect(prep('f13_patrocinio', atleta)).not.toBeNull();
    expect(prep('f13_mercado', atleta)).toBeNull();
    const emp = nova();
    emp.financas.empresas = [empresa(emp, {})];
    for (let k = 0; k < 6; k++) { emp.t += 12; processarNotoriedade(emp); }
    expect(prep('f13_mercado', emp)).not.toBeNull();
  });
  it('aceitar a campanha paga de verdade: conta, extrato e a lista de receitas da fama', () => {
    const v = comNome(nova(), 60, 'esporte');
    const ctx = prep('f13_patrocinio', v)! as Ctx;
    const valor = valorDaCampanha13(v);
    const antes = v.financas.conta;
    const res = (conteudoPorId('f13_patrocinio') as Decisao).opcoes.find(o => o.id === 'aceitar')!.resolver(ctx);
    res.efeito?.(ctx);
    expect(v.financas.conta - antes).toBe(valor);
    expect(v.fama13!.receitas![v.fama13!.receitas!.length - 1]).toMatchObject({ valor, rotulo: 'Campanhas e publicidade' });
    expect(v.financas.extratoAberto!.linhas.some(l => l.rotulo === 'Campanhas e publicidade' && l.conta === valor)).toBe(true);
    expect(leituraDaFama13(v).receitaAno).toBe(valor);
  });
});

describe('o anônimo não vira celebridade', () => {
  it('trinta anos de vida comum: nenhuma reação ao nome, nenhuma notoriedade', () => {
    let v = nova();
    for (let k = 0; k < 30 && !v.morte; k++) { v = avancarAno(v).vida; v.momento = null; v.fila = undefined; }
    expect((v.notoriedade?.valor ?? 0)).toBeLessThan(10);
    expect(v.ocorrencias.filter(o => o.id.startsWith('f13_'))).toEqual([]);
  });
  it('nenhuma reação f13 cabe para quem não tem nome', () => {
    const v = nova();
    comParceiro(v);
    for (const id of F13) expect(prep(id, v), id).toBeNull();
  });
  it('o pass anual não toca o gerador principal', () => {
    const v = comNome(nova(), 85, 'arte');
    const rng = v.rng, seq = v.seq;
    for (let k = 0; k < 20; k++) { v.t += 12; mundoReage13(v, CATALOGO, preparar, () => true); }
    expect(v.rng).toBe(rng);
    // (novoId usa seq só quando uma pessoa ou entrada nasce — o abrir de mentira não cria nada)
    expect(v.seq).toBe(seq);
    expect(Object.values(v.fama13!.reacoes ?? {}).reduce((s, n) => s + n, 0)).toBeGreaterThan(0);
  });
});

describe('eventos de histórico: só com o que foi registrado', () => {
  it('uma vida sem passado registrado não tem lembrança nenhuma (nem marcos)', () => {
    const v = nova();
    expect(marcosDoEstado13(v).filter(m => m.tipo !== 'subiu' && m.tipo !== 'caiu')).toEqual([]);
    for (const id of H13) expect(prep(id, v), id).toBeNull();
    registrarMarcos13(v);
    expect(v.fama13).toBeUndefined();
  });
  it('os anos redondos do título: com a competição, o clube e o tempo reais', () => {
    const v = nova();
    v.caminhos.palmares = [titulo(v, 10)];
    const ctx = prep('h13_titulo', v)!;
    const d = conteudoPorId('h13_titulo') as Decisao;
    expect(d.texto(ctx)).toMatch(/Faz 10 anos: campeão da Série A com o Atlético Paulistano/);
    v.caminhos.palmares = [titulo(v, 9)];
    expect(prep('h13_titulo', v)).toBeNull();
  });
  it('a controvérsia volta anos depois — a de verdade, guardada no ano em que aconteceu', () => {
    const v = comNome(nova(), 50, 'arte');
    v.segredos = [{ id: 's9', tipo: 'caso', t: v.t - 2, quemSabe: [], publico: v.t }];
    registrarMarcos13(v);
    // Dez anos depois a exposição já tirou o segredo da lista; o marco ficou.
    v.segredos = [];
    v.t += 84;
    const ctx = prep('h13_controversia', v)!;
    expect((conteudoPorId('h13_controversia') as Decisao).texto(ctx)).toMatch(new RegExp(`em ${anoDe(v.t - 84)}.*caso fora do casamento`));
    // Falar abertamente e dar certo: a controvérsia deixa de voltar.
    const falar = (conteudoPorId('h13_controversia') as Decisao).opcoes.find(o => o.id === 'falar')!;
    for (let k = 0; k < 10 && prep('h13_controversia', v); k++) { const c = prep('h13_controversia', v)!; falar.resolver(c).efeito?.(c); v.t += 12; }
    expect(v.fama13!.marcos!.some(m => m.tipo === 'superou')).toBe(true);
  });
  it('o negócio que fechou vira palco só quando a vida deu certo depois', () => {
    const v = nova();
    v.caminhos.negocio = { tipo: 'lanchonete', nome: 'Lanchonete da Esquina', ocupacaoId: 'empresario', tInicio: v.t - 200, capital: 20000, clientela: 10, estado: 'fechado', anosNoVermelho: 3, tFim: v.t - 120 };
    registrarMarcos13(v);
    expect(prep('h13_fracasso', v)).toBeNull();
    comNome(v, 40, 'arte');
    const ctx = prep('h13_fracasso', v)!;
    expect((conteudoPorId('h13_fracasso') as Decisao).texto(ctx)).toMatch(/lanchonete da Esquina fechou as portas, em \d{4}/i);
  });
  it('o rival e o amigo de antes são gente que já existe (nenhuma pessoa nova)', () => {
    const v = comNome(nova(), 45, 'esporte');
    v.caminhos.palmares = [titulo(v, 1)];
    registrarMarcos13(v);
    const r = pessoaNova(v, 40);
    const vin = vincular(v, r, { origem: 'trabalho', proximidade: 20 });
    vin.estagio = 'rival'; vin.tInicio = v.t - 150; vin.tUltimoContato = v.t - 60; vin.tensao = 50;
    const antes = Object.keys(v.pessoas).length;
    const ctx = prep('h13_rival', v)!;
    expect(ctx.p.quem.id).toBe(r.id);
    const res = (conteudoPorId('h13_rival') as Decisao).opcoes[0].resolver(ctx);
    res.efeito?.(ctx);
    expect(Object.keys(v.pessoas).length).toBe(antes);
    expect(v.vinculos[r.id].tensao).toBeLessThan(50);
    // Sem uma notícia boa recente, o rival não aparece.
    const w = comNome(nova(), 45, 'esporte');
    const r2 = pessoaNova(w, 40);
    const vin2 = vincular(w, r2, { origem: 'trabalho', proximidade: 20 });
    vin2.estagio = 'rival'; vin2.tInicio = w.t - 150; vin2.tUltimoContato = w.t - 60;
    expect(prep('h13_rival', w)).toBeNull();
  });
  it('o emprego deixado volta com o nome do lugar e o ano reais', () => {
    const v = comNome(nova(), 25, 'arte');
    v.trabalho.historico.push({ ...(v.trabalho.atual ?? { ocupacaoId: 'vendedor', contrato: 'clt', salario: 2000, desempenho: 50, tCargo: v.t - 200 } as never), empregador: 'Lojas Horizonte', tInicio: v.t - 200, tFim: v.t - 150, motivo: 'pediu demissão' } as never);
    const ctx = prep('h13_emprego', v)!;
    const n = (conteudoPorId('h13_emprego') as { narrar: (c: Ctx) => { texto: string } }).narrar(ctx);
    expect(n.texto).toMatch(new RegExp(`Lojas Horizonte, que você deixou em ${anoDe(v.t - 150)}`));
  });
  it('a lembrança de saves antigos usa a data do registro, nunca a de hoje', () => {
    const v = nova();
    v.caminhos.palmares = [titulo(v, 12)];
    registrarMarcos13(v);
    expect(v.fama13!.marcos![0].t).toBe(v.t - 144);
    expect(v.fama13!.desde).toBe(v.t);
  });
});

describe('saves', () => {
  it('normalizarVida13Fama: o que vier torto sai; o que é bom fica', () => {
    const v = nova();
    v.fama13 = { marcos: [{ t: 1, tipo: 'conquista', texto: 'x', ref: 'r', peso: 3 }, { t: 'x' } as never], serie: 'nada' as never, receitas: [{ t: 1, valor: NaN, rotulo: 'a' }, { t: 2, valor: 10, rotulo: 'b' }], reacoes: [] as never };
    normalizarVida13Fama(v);
    expect(v.fama13).toEqual({ marcos: [{ t: 1, tipo: 'conquista', texto: 'x', ref: 'r', peso: 3 }], receitas: [{ t: 2, valor: 10, rotulo: 'b' }] });
    const w = nova();
    w.fama13 = 'lixo' as never;
    normalizarVida13Fama(w);
    expect(w.fama13).toBeUndefined();
  });
  it('um save sem o campo abre igual e ganha o campo só quando há o que guardar', () => {
    const v = nova();
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.fama13).toBeUndefined();
  });
});
