/**
 * REWORK 12.3 — carreiras vivas, Submundo profundo, corrupção, Justiça e narrativa dinâmica.
 *
 *   F1   "A primeira palavra" (e os outros marcos de uma vez só) no máximo uma vez por PESSOA, inclusive depois da sucessão
 *   G1   o noivado não vira casamento contra a escolha: dá para adiar e para desfazer
 *   C5   o advogado particular aparece sempre para quem tem a defesa pública (bloqueado com motivo e preço quando falta)
 *   C6   a defesa narrada é a defesa escolhida (o jogo não paga advogado sozinho)
 */
import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro } from './cenarios';
import { registrarMarco, temMarco, transacao } from '../nucleo';
import type { Vida } from '../tipos';
import { executar } from '../acoes';
import { interpretar, normalizarRework123 } from '../save';
import { abrirDecisao, conteudoPorId, preparar } from '../conteudo/motor';
import { abrirProcesso } from '../sistemas/justica';
import { ficarNoivos } from '../sistemas/romance';
import { continuarComo } from '../sistemas/sucessao';
import { criarRng, rngDe } from '../rng';
import type { Decisao } from '../conteudo/base';

const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void) => transacao(v, f).vida;
const decidir = (v: Vida, opcaoId: string) => executar(v, { tipo: 'decidir', opcaoId });

/* ================================================================ F1 */

describe('F1 · marcos de uma vez só por pessoa', () => {
  it('a primeira palavra do filho não volta, mesmo que o fato antigo suma', () => {
    let v = adulto(30, { semente: 7 });
    const { p: filho } = comFilho(v, 1);
    const c = conteudoPorId('fil_palavra')!;
    v.t += 6; // o filho com 1 ano e meio
    expect(preparar(c, v, rngDe('t', 1))).toBeTruthy();
    v = em(v, x => registrarMarco(x, filho.id, 'primeira_palavra'));
    delete v.fatos[`palavra_${filho.id}`];
    expect(preparar(c, v, rngDe('t', 2))).toBeNull();
    // outra criança, a mesma cena pode acontecer
    const { p: outro } = comFilho(v, 1);
    expect(temMarco(v, outro.id, 'primeira_palavra')).toBe(false);
  });

  it('a filha que já falou, quando passa a ser jogada, não tem "a primeira palavra" de novo', () => {
    let v = adulto(40, { semente: 11 });
    comParceiro(v, { estagio: 'casamento' });
    const { p: filha } = comFilho(v, 2, { genero: 'feminino' });
    v = em(v, x => { x.fatos[`palavra_${filha.id}`] = x.t - 3; x.morte = { t: x.t, causa: 'teste' }; });
    const r = continuarComo(v, filha.id);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    expect(n.eu.marcos?.primeira_palavra).toBeDefined();
    expect(preparar(conteudoPorId('bb_primeira_palavra')!, n, rngDe('x', 3))).toBeNull();
    // a leitura do save não muda nada (idempotente)
    const relido = interpretar(JSON.stringify(n));
    expect(relido.tipo).toBe('ok');
    expect((relido as { vida: Vida }).vida.eu.marcos).toEqual(n.eu.marcos);
  });

  it('save antigo: os fatos dos filhos e a infância de quem joga viram marcos (idempotente)', () => {
    const v = adulto(35, { semente: 13 });
    const { p: f } = comFilho(v, 3);
    v.fatos[`palavra_${f.id}`] = v.t - 20;
    v.fatos[`passos_${f.id}`] = v.t - 30;
    v.ocorrencias.push({ id: 'bb_primeira_palavra', t: 24, idade: 2 });
    normalizarRework123(v);
    const uma = JSON.stringify(v);
    normalizarRework123(v);
    expect(JSON.stringify(v)).toBe(uma);
    expect(v.pessoas[f.id].marcos).toEqual({ primeira_palavra: v.t - 20, primeiros_passos: v.t - 30 });
    expect(v.eu.marcos?.primeira_palavra).toBe(24);
  });
});

/* ================================================================ G1 */

describe('G1 · o casamento respeita a escolha', () => {
  function noivos(): { v: Vida; id: string } {
    const v = adulto(30, { semente: 21 });
    const { p, vin } = comParceiro(v, { estagio: 'namoro', anos: 4 });
    ficarNoivos(v, vin);
    v.fatos[`noivado_${p.id}`] = v.t - 13;
    v.momento = null; delete v.fila;
    return { v, id: p.id };
  }
  it('a pergunta do casamento tem adiar e desfazer; adiar não casa e a pergunta só volta depois de um ano', () => {
    let { v, id } = noivos();
    const d = conteudoPorId('rom_casamento') as Decisao;
    const ctx = preparar(d, v, rngDe('c', 1));
    expect(ctx).toBeTruthy();
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('c', 1))!); });
    const ops = v.momento!.opcoes.map(o => o.id);
    expect(ops).toContain('adiar');
    expect(ops).toContain('desfazer');
    v = decidir(v, 'adiar').vida;
    expect(v.vinculos[id].romance!.estagio).not.toBe('casamento');
    expect(preparar(d, v, rngDe('c', 2))).toBeNull();
    v = em(v, x => { x.t += 6; });
    expect(preparar(d, v, rngDe('c', 3))).toBeNull();
    v = em(v, x => { x.t += 7; });
    expect(preparar(d, v, rngDe('c', 4))).toBeTruthy();
  });
  it('desfazer o noivado mantém o namoro e não casa', () => {
    let { v, id } = noivos();
    const d = conteudoPorId('rom_casamento') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('c', 1))!); });
    v = decidir(v, 'desfazer').vida;
    expect(v.vinculos[id].romance!.estagio).not.toBe('casamento');
    expect(v.vinculos[id].romance!.estagio).not.toBe('ex');
    expect(v.vinculos[id].romance!.noivado).toBeUndefined();
    v = em(v, x => { x.t += 24; });
    expect(preparar(d, v, rngDe('c', 5))).toBeNull();
  });
});

/* ================================================================ C5 / C6 */

describe('C5/C6 · a defesa é a escolhida, e o advogado particular sempre aparece', () => {
  function processado(conta: number, semente = 31): Vida {
    let v = adulto(32, { semente });
    v.financas.conta = conta;
    v.momento = null; delete v.fila;
    v = em(v, x => { abrirProcesso(x, rngDe('proc', semente), 'fraude'); });
    return v;
  }
  it('quem tem dinheiro não perde dinheiro na abertura e encontra "contratar advogado" disponível', () => {
    const antes = 300_000;
    let v = processado(antes);
    expect(v.justica!.processo!.defesa).toBe('publica');
    expect(v.financas.conta).toBe(antes);
    const d = conteudoPorId('jus_defesa') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('d', 1))!); });
    const part = v.momento!.opcoes.find(o => o.id === 'particular');
    expect(part).toBeTruthy();
    expect(part!.bloqueio).toBeUndefined();
    const r = decidir(v, 'particular');
    expect(r.vida.justica!.processo!.defesa).toBe('particular');
    expect(r.vida.justica!.processo!.pagaPor).toBe('voce');
    expect(r.vida.financas.conta).toBeLessThan(antes);
  });
  it('sem dinheiro: a opção aparece bloqueada, com o preço e o que se tem', () => {
    let v = processado(500);
    const d = conteudoPorId('jus_defesa') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('d', 1))!); });
    const part = v.momento!.opcoes.find(o => o.id === 'particular');
    expect(part?.bloqueio).toMatch(/cobra uns/);
  });
  it('escolher a defesa pública com o advogado da organização no caso muda a defesa de verdade, e o texto diz isso', () => {
    let v = processado(300_000, 33);
    v = em(v, x => { Object.assign(x.justica!.processo!, { defesa: 'particular', pagaPor: 'organizacao' }); });
    const d = conteudoPorId('jus_defesa') as Decisao;
    v = em(v, x => { abrirDecisao(x, d, preparar(d, x, rngDe('d', 1))!); });
    expect(v.momento!.opcoes.map(o => o.id)).toContain('manter');
    const r = decidir(v, 'publica');
    expect(r.vida.justica!.processo!.defesa).toBe('publica');
    expect(r.resultado).toMatch(/dispensou/);
  });
  it('o processo tem juiz, promotor e quem defende, com nome; o mesmo juiz pode voltar na mesma cidade', () => {
    const v = processado(1000, 35);
    const p = v.justica!.processo!;
    const atores = v.justica!.atores!;
    expect(atores[p.juizId!].papel).toBe('juiz');
    expect(atores[p.promotorId!].papel).toBe('promotor');
    expect(atores[p.defensorId!].papel).toBe('defensor');
    expect(atores[p.juizId!].nome.length).toBeGreaterThan(3);
    // a comarca tem poucas varas: o juiz de um segundo processo, na mesma cidade, vem do mesmo quadro
    const ids = new Set<string>();
    for (let k = 0; k < 12; k++) { const x = processado(1000, 100 + k); ids.add(x.justica!.atores![x.justica!.processo!.juizId!].nome); }
    expect(ids.size).toBeLessThanOrEqual(6);
  });
});

/* ================================================================ C1 / C2 · corrupção judicial */

import { entrar } from '../sistemas/ilicito';
import { criarContato } from '../sistemas/submundo';
import { canais, disponibilidadeCorrupcao, tentarCorromper } from '../sistemas/corrupcaoJudicial';
import { processarJustica } from '../sistemas/justica';
import { chanceDeAbsolvicao, liberarBloqueio } from '../sistemas/tribunal';
import { podeTentar } from '../plausibilidade';

function comProcessoEContato(semente: number, integridade?: number): Vida {
  let v = adulto(34, { semente });
  v.financas.conta = 400_000;
  v.momento = null; delete v.fila;
  v = em(v, (x, r) => {
    entrar(x, 'fraude', undefined, r);
    const id = criarContato(x, 'fraudes', 'intermediario', 70);
    x.caminhos.envolvimento!.fichas![id].confianca = 70;
    abrirProcesso(x, rngDe('proc', semente), 'fraude');
    x.momento = null; delete x.fila;
    if (integridade !== undefined) x.justica!.atores![x.justica!.processo!.juizId!].integridade = integridade;
  });
  return v;
}

describe('C1/C2 · tentar corromper o processo', () => {
  it('sem caminho até quem julga, a tentativa fica indisponível, com o motivo', () => {
    let v = adulto(34, { semente: 3 });
    v.financas.conta = 400_000;
    v = em(v, x => abrirProcesso(x, rngDe('p', 3), 'violencia'));
    const d = disponibilidadeCorrupcao(v, 'contato');
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/caminho até quem julga/);
    expect(canais(v)).toHaveLength(0);
  });
  it('com um intermediário de confiança e dinheiro, está disponível — e é dita ilegal', () => {
    const v = comProcessoEContato(5);
    const d = disponibilidadeCorrupcao(v, 'contato');
    expect(d.grau).toBe('irregular');
    expect(d.motivo).toMatch(/É crime/);
  });
  it('os desfechos variam (recusa, denúncia, aceite, golpe) e nada garante absolvição', () => {
    const vistos = new Set<string>();
    for (let k = 0; k < 40; k++) {
      const v = comProcessoEContato(200 + k, k % 2 === 0 ? 30 : undefined);
      const n = em(v, x => { tentarCorromper(x, 'contato'); });
      const t = n.justica!.corrupcoes![0];
      vistos.add(t.resultado);
      if (n.justica!.processo?.influencia) expect(chanceDeAbsolvicao(n)).toBeLessThanOrEqual(0.85);
      // uma tentativa por processo
      expect(podeTentar(disponibilidadeCorrupcao(n, 'contato'))).toBe(false);
    }
    expect(vistos.has('recusa') || vistos.has('denuncia')).toBe(true);
    expect(vistos.has('aceito') || vistos.has('parcial')).toBe(true);
  }, 120_000);
  it('a denúncia vira processo por corrupção quando o de agora termina; persiste no save', () => {
    let v: Vida | undefined;
    for (let k = 0; k < 60 && !v; k++) {
      const n = em(comProcessoEContato(400 + k, 97), x => { tentarCorromper(x, 'contato'); });
      if (n.justica!.corrupcoes![0].resultado === 'denuncia') v = n;
    }
    expect(v).toBeTruthy();
    const relido = (interpretar(JSON.stringify(v!)) as { vida: Vida }).vida;
    expect(relido.justica!.corrupcoes![0].resultado).toBe('denuncia');
    // o processo de agora termina (sentença), e o da corrupção abre no ano seguinte
    let w = em(relido, x => { x.t = x.justica!.processo!.tJulgamento; processarJustica(x, rngDe('s', 1)); x.justica!.prisao = undefined; x.justica!.alternativa = undefined; });
    w = em(w, x => { x.t += 12; processarJustica(x, rngDe('s', 2)); });
    expect(w.justica!.processo?.categoria).toBe('corrupcao');
  }, 120_000);
  it('o que foi aceito pode vir à tona anos depois: o juiz é afastado e a absolvição comprada é anulada', () => {
    let v: Vida | undefined;
    for (let k = 0; k < 120 && !v; k++) {
      const n = em(comProcessoEContato(600 + k, 20), x => { tentarCorromper(x, 'contato'); });
      if (n.justica!.corrupcoes![0].resultado === 'aceito') v = n;
    }
    expect(v).toBeTruthy();
    let w = em(v!, x => {
      const j = x.justica!;
      j.antecedentes.push({ t: x.t, categoria: 'fraude', desfecho: 'absolvicao' });
      j.processo = undefined; liberarBloqueio(x);
      j.corrupcoes![0].desfecho = 'absolvicao';
      j.corrupcoes![0].risco = 1;
      x.t += 12;
      processarJustica(x, rngDe('d', 1));
    });
    const t = w.justica!.corrupcoes![0];
    expect(t.descoberta).toBeDefined();
    expect(w.justica!.atores![t.alvoId].afastado).toBeDefined();
    expect(w.justica!.processo?.categoria).toBe('fraude');
    expect(w.biografia.some(e => /Veio à tona/.test(e.texto))).toBe(true);
    // e depois, a corrupção vira processo próprio
    w = em(w, x => { x.justica!.processo = undefined; x.t += 12; processarJustica(x, rngDe('d', 2)); });
    expect(w.justica!.processo?.categoria).toBe('corrupcao');
  }, 120_000);
});

describe('C8 · o dinheiro de fora e a Justiça', () => {
  it('o bloqueio sai da conta com linha própria e volta inteiro na absolvição', () => {
    let v = adulto(34, { semente: 9 });
    v.financas.conta = 500_000;
    v = em(v, (x, r) => { entrar(x, 'fraude', undefined, r); x.caminhos.envolvimento!.ganhos = 900_000; x.caminhos.envolvimento!.exposicao = 80; });
    let bloqueado = 0;
    for (let k = 0; k < 20 && !bloqueado; k++) {
      const n = em(v, x => abrirProcesso(x, rngDe('b', k), 'fraude'));
      bloqueado = n.justica?.bloqueado?.valor ?? 0;
      if (bloqueado) {
        expect(n.biografia.some(e => /bloqueou/.test(e.texto))).toBe(true);
        const w = em(n, x => liberarBloqueio(x));
        expect(w.financas.conta).toBe(n.financas.conta + bloqueado);
        expect(w.justica!.bloqueado).toBeUndefined();
      }
    }
    expect(bloqueado).toBeGreaterThan(0);
  });
});

/* ================================================================ A · facções */

import { garantirCidade, orgsDaCidade, relacaoCom, estadoEntre, definirEstado, processarFaccoes, deDentro, resolverDupla, alcanceDe, disponibilidadeOrg } from '../sistemas/faccoes';
import type { OrgViva } from '../tipos';
import { cidadesDoPais } from '../dados/lugares';

function comOrgs(semente = 51): Vida {
  let v = adulto(30, { semente, municipioId: 'sao-paulo-sp' });
  v.financas.conta = 200_000;
  v.momento = null; delete v.fila;
  v = em(v, (x, r) => { entrar(x, 'grupo', undefined, r); garantirCidade(x); });
  return v;
}

describe('A · facções vivas', () => {
  it('é possível ser de dentro de duas; entre rivais, abertamente, as duas cobram (a cena de escolher lado)', () => {
    let v = comOrgs();
    v = em(v, x => {
      const [a, b] = orgsDaCidade(x);
      definirEstado(a, b, 'rivalidade');
      for (const o of [a, b]) { const rel = relacaoCom(x, o); rel.relacao = 'membro'; rel.nivel = 1; rel.lealdade = 60; }
    });
    expect(deDentro(v).length).toBeGreaterThanOrEqual(2);
    v = em(v, x => { x.t += 12; processarFaccoes(x); });
    expect(v.caminhos.envolvimento!.cenas125?.['sub123_dupla']).toBeTruthy();
    expect(v.fatos['sub123_dupla']).toBe(v.t);
    const [a, b] = v.caminhos.envolvimento!.cenas125!['sub123_dupla'].split('|');
    const n = em(v, x => { resolverDupla(x, a, b, 'escolher'); });
    const relB = n.caminhos.envolvimento!.organizacoes!.find(o => o.id === b)!;
    expect(relB.saiu).toBeDefined();
  });
  it('vínculo secreto: a desconfiança cresce com os anos e um dia vem à tona', () => {
    let v = comOrgs(53);
    v = em(v, x => {
      const [a, b] = orgsDaCidade(x);
      definirEstado(a, b, 'concorrencia');
      const ra = relacaoCom(x, a); ra.relacao = 'membro'; ra.nivel = 1; ra.lealdade = 60;
      const rb = relacaoCom(x, b); rb.relacao = 'membro'; rb.nivel = 0; rb.lealdade = 60; rb.secreto = true;
    });
    let veio = false;
    for (let k = 0; k < 12 && !veio; k++) { v = em(v, x => { x.t += 12; processarFaccoes(x); }); veio = deDentro(v).every(r => !r.secreto); }
    expect(veio).toBe(true);
  });
  it('as relações entre organizações mudam sozinhas ao longo dos anos', () => {
    let v = comOrgs(55);
    const antes = (x: Vida) => { const os = orgsDaCidade(x); const m: string[] = []; for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) m.push(estadoEntre(os[i], os[j])); return m.join(','); };
    const a0 = antes(v);
    const vistos = new Set<string>();
    for (let k = 0; k < 20; k++) { v = em(v, x => { x.t += 12; processarFaccoes(x); }); for (const e of antes(v).split(',')) vistos.add(e); }
    expect(antes(v)).not.toBe(a0);
    expect(vistos.size).toBeGreaterThanOrEqual(3);
  });
  it('mudar de país não apaga o vínculo; fora do alcance, ele para (sem render) e só se pode conversar ou sair', () => {
    let v = comOrgs(57);
    let org: OrgViva | undefined;
    v = em(v, x => { org = orgsDaCidade(x)[0]; org.forca = 20; org.alcance = undefined; const rel = relacaoCom(x, org); rel.relacao = 'membro'; rel.nivel = 2; rel.lealdade = 70; });
    expect(alcanceDe(org!)).not.toBe('internacional');
    v = em(v, x => { x.moradia.municipioId = cidadesDoPais('PT')[0].id; x.t += 12; processarFaccoes(x); });
    const rel = v.caminhos.envolvimento!.organizacoes!.find(o => o.id === org!.id)!;
    expect(rel.saiu).toBeUndefined();
    expect(rel.distancia).toBe('fora');
    expect(podeTentar(disponibilidadeOrg(v, org!.id, 'tarefa'))).toBe(false);
  });
});

/* ================================================================ B · contratante ocasional, mercados */

import { disponibilidadeServico, encomendarServico, processarServicos, alvosPossiveis } from '../sistemas/servicosPorFora';
import { mercadosLegais, mercadosClandestinos } from '../sistemas/paralelos';
import { pessoaNova } from './cenarios';
import { vincular } from '../pessoas';

describe('B · o contratante ocasional não vira do meio', () => {
  function comConflito(): { v: Vida; alvo: string } {
    const v = adulto(35, { semente: 61 });
    v.financas.conta = 100_000;
    v.momento = null; delete v.fila;
    const amigo = pessoaNova(v, 36);
    amigo.temperamento.responsabilidade = -0.7;
    const va = vincular(v, amigo, { origem: 'vizinhanca', proximidade: 50, confianca: 60, convivio: ['vizinhanca'] });
    va.confianca = 60;
    const inimigo = pessoaNova(v, 40);
    const vi = vincular(v, inimigo, { origem: 'trabalho', proximidade: 20, convivio: ['trabalho'] });
    vi.tensao = 70;
    return { v, alvo: inimigo.id };
  }
  it('pede por um intermediário, sem criar envolvimento nem carreira; o pedido fica registrado com risco', () => {
    const { v, alvo } = comConflito();
    expect(alvosPossiveis(v).map(p => p.id)).toContain(alvo);
    const d = disponibilidadeServico(v, 'intimidacao', alvo);
    expect(d.grau).toBe('irregular');
    expect(d.motivo).toMatch(/Saída legal/);
    const n = em(v, x => { encomendarServico(x, 'intimidacao', alvo); });
    expect(n.caminhos.envolvimento).toBeUndefined();
    expect(n.caminhos.contratante!.servicos).toHaveLength(1);
  });
  it('o que foi encomendado pode vir à tona e virar processo (como mandante)', () => {
    const { v, alvo } = comConflito();
    let n = em(v, x => { encomendarServico(x, 'agressao', alvo); x.caminhos.contratante!.servicos[0].resultado = 'feito'; x.caminhos.contratante!.servicos[0].risco = 1; });
    n = em(n, x => { x.t += 12; processarServicos(x); });
    expect(n.caminhos.contratante!.servicos[0].descoberto).toBeDefined();
    expect(n.justica?.processo?.categoria).toBe('violencia');
  });
  it('Vida → Compras só tem mercados legais; o mercado por fora é do Submundo (e de quem foi apresentado)', () => {
    let v = adulto(30, { semente: 63, municipioId: 'sao-paulo-sp' });
    expect(mercadosLegais(v).every(m => m !== 'por_fora')).toBe(true);
    expect(mercadosClandestinos(v)).toHaveLength(0);
    v = em(v, x => { x.caminhos.contratante = { servicos: [], apresentado: x.t }; });
    expect(mercadosClandestinos(v)).toEqual(['por_fora']);
    expect(v.caminhos.envolvimento).toBeUndefined();
  });
});

/* ================================================================ D · a narrativa do crime */

import { proporEncomenda, abertas } from '../sistemas/encomendas';
import { consequencias, fotografar, variante } from '../sistemas/relatoDoCrime';
import { criarContato as novoContato } from '../sistemas/submundo';

describe('D · o relato do crime', () => {
  it('o texto do trabalho nomeia quem propôs e diz o valor que de fato entrou; as consequências batem com o estado', () => {
    let feitos = 0;
    for (let k = 0; k < 12; k++) {
      let v = adulto(30, { semente: 700 + k });
      v.financas.conta = 50_000; v.momento = null; delete v.fila;
      let pid = '';
      v = em(v, (x, r) => { entrar(x, 'patrimonial', undefined, r); pid = novoContato(x, 'furtos', 'parceiro', 60); proporEncomenda(x, r, 'furtos', { pessoaId: pid }, 1); });
      const enc = abertas(v)[0];
      const antes = v.financas.conta;
      const r = executar(v, { tipo: 'crime', acao: { area: 'encomenda', oque: 'aceitar', id: enc.id } });
      const nome = v.pessoas[pid].nome;
      expect(r.resultado).toContain(nome);
      const x = r.vida.caminhos.envolvimento!.encomendas!.find(y => y.id === enc.id)!;
      if (x.estado === 'concluida') {
        feitos++;
        const entrou = r.vida.financas.conta - antes;
        expect(entrou).toBeGreaterThan(0);
        expect(r.mudancas?.join(' ')).toMatch(/Entrou/);
        expect(r.resultado).not.toMatch(/Deu errado/);
      } else expect(r.resultado).not.toMatch(/Saiu como combinado/);
    }
    expect(feitos).toBeGreaterThan(0);
  });
  it('a mesma frase não volta em seguida (variantes com memória)', () => {
    let v = adulto(30, { semente: 77 });
    v = em(v, (x, r) => entrar(x, 'patrimonial', undefined, r));
    const usadas: string[] = [];
    v = em(v, x => { for (let k = 0; k < 3; k++) usadas.push(variante(x, 'teste', ['a', 'b', 'c'], k)); });
    expect(new Set(usadas).size).toBe(3);
  });
  it('as consequências medidas não inventam nada quando nada muda', () => {
    const v = adulto(30, { semente: 78 });
    expect(consequencias(v, fotografar(v))).toEqual([]);
  });
});

/* ================================================================ E · equipe e concursos */

import { garantirEquipe, processarEquipe, leituraDaEquipe } from '../sistemas/equipe';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { editalDe, chanceNoConcurso, inscrever, processarConcursos } from '../sistemas/concurso';

describe('E · a gente do trabalho e os concursos', () => {
  it('o emprego tem chefia e colegas com nome, que continuam os mesmos de um ano para o outro', () => {
    let v = adulto(30, { semente: 81 });
    v = em(v, (x, r) => { x.trabalho.atual = undefined; contratar(x, r, ocupacao('analista_adm'), 'curriculo'); garantirEquipe(x); });
    const eq = v.trabalho.atual!.equipe!;
    expect(eq.chefeId).toBeTruthy();
    expect(eq.colegas.length).toBeGreaterThanOrEqual(2);
    const nomes = leituraDaEquipe(v).map(x => x.nome);
    v = em(v, x => { x.t += 12; processarEquipe(x); });
    const depois = leituraDaEquipe(v).map(x => x.nome);
    expect(depois.filter(n => nomes.includes(n)).length).toBeGreaterThanOrEqual(1);
  });
  it('o conflito com a chefia abre a conversa, com saídas legais (e nenhuma por fora)', () => {
    let v = adulto(30, { semente: 83 });
    v = em(v, (x, r) => { x.trabalho.atual = undefined; contratar(x, r, ocupacao('analista_adm'), 'curriculo'); const eq = garantirEquipe(x)!; x.vinculos[eq.chefeId!].tensao = 80; x.t += 12; processarEquipe(x); });
    const d = conteudoPorId('trab123_conflito') as Decisao;
    const ctx = preparar(d, v, rngDe('t', 1));
    expect(ctx).toBeTruthy();
    const ids = d.opcoes.map(o => o.id);
    expect(ids).toEqual(expect.arrayContaining(['conversar', 'rh', 'transferencia', 'sindicato', 'sair']));
  });
  it('o edital tem vagas e inscritos; a aprovação diz a classificação e respeita as vagas', () => {
    let v = adulto(26, { semente: 85 });
    const oc = ocupacao('tecnico_publico');
    const ed = editalDe(v, oc);
    expect(ed.vagas).toBeGreaterThan(0);
    expect(ed.inscritos).toBe(ed.vagas * ed.porVaga);
    expect(chanceNoConcurso(v, oc)).toBeLessThanOrEqual(0.6);
    let aprov = 0, reserva = 0;
    for (let k = 0; k < 30; k++) {
      let w = em(v, x => { x.caminhos.concurso.meses = 40; inscrever(x, oc); x.trabalho.candidaturas[0].chance = 0.5; });
      w = em(w, x => { x.t += 12; processarConcursos(x, rngDe('conc', k)); });
      const txt = w.biografia.map(e => e.texto).join(' ');
      if (/Aprovad[oae] no concurso.*lugar, para/.test(txt) && !/fora das vagas/.test(txt)) { aprov++; const m = /\((\d+)º lugar, para (\d+)/.exec(txt)!; expect(Number(m[1])).toBeLessThanOrEqual(Number(m[2])); }
      if (/fora das vagas/.test(txt)) { reserva++; const m = /\((\d+)º lugar, para (\d+)/.exec(txt)!; expect(Number(m[1])).toBeGreaterThan(Number(m[2])); }
    }
    expect(aprov).toBeGreaterThan(0);
    expect(reserva + aprov).toBeLessThan(30);
  }, 120_000);
});
