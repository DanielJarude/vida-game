/** VIDA 20 — vícios aos 14, automobilismo (kart → F1), clubes à venda e geridos na liga de sempre, joias de usar. */
import { describe, expect, it } from 'vitest';
import { adulto, comFilho } from './cenarios';
import { nova, viverAte } from './ajuda';
import { transacao, idade } from '../nucleo';
import { executar, disponibilidade, type Acao } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { anoDe } from '../tempo';
import { continuarComo } from '../sistemas/sucessao';
import { balanco } from '../sistemas/dinheiro';
import { processarDependencias14, IDADE_MINIMA_VICIO } from '../v14/crencas/dependencias14';
import { habitosDaPessoa } from '../sistemas/corpo';
import { CATEGORIAS20, nivelDoPiloto, pontosDeSuperlicenca, processarAutomobilismo20, tetoDoAtributo } from '../v20/automobilismo/automobilismo20';
import { avaliarClube, clubesAVenda, conflitoDeInteresses, mediaDoElenco, mercadoDoAno } from '../v20/clubes/clubes20';
import { clubesDoPais } from '../dados/clubes';
import { ligaDe, ultimaTemporadaDoPais } from '../sistemas/ligas';
import { JOIAS20, joia20 } from '../dados20/joias20';
import { itemEstilo } from '../dados/estilo';
import { emAlta19 } from '../v19/conectada/feed19';
import type { Vida } from '../tipos';

const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; x.fila = undefined; return x; };

describe('Vícios — idade mínima de 14 anos', () => {
  it('ninguém desenvolve vício antes dos 14 (30 infâncias, com estresse alto forçado)', () => {
    for (let s = 1; s <= 30; s++) {
      let v = nova({ semente: 900 + s });
      while (idade(v) < IDADE_MINIMA_VICIO) {
        v.mente.estresse = 90;
        v = ano(v);
        expect(v.dependencias14?.lista ?? {}, `semente ${s}, ${idade(v)} anos`).toEqual(v.dependencias14 ? {} : {});
        if (idade(v) < IDADE_MINIMA_VICIO) { expect(v.corpo.habitos.fuma).toBe(false); expect(v.corpo.habitos.bebe).toBe('nao'); expect(v.dependencias14).toBeUndefined(); }
      }
    }
  });
  it('um estado de vício numa criança (save antigo, herança) é desfeito, e o ano não o desenvolve', () => {
    const v = viverAte(nova({ semente: 77 }), 11);
    v.corpo.habitos.fuma = true; v.corpo.habitos.bebe = 'muito';
    v.dependencias14 = { lista: { tabaco: { nivel: 60, pico: 60, desde: v.t, recaidas: 0, tentativas: 0 } }, marcos: [] };
    processarDependencias14(v);
    expect(v.corpo.habitos.fuma).toBe(false);
    expect(v.corpo.habitos.bebe).toBe('nao');
    expect(v.dependencias14).toBeUndefined();
    const lido = interpretar(JSON.stringify({ ...v, dependencias14: { lista: { alcool: { nivel: 70, pico: 70, desde: 0, recaidas: 0, tentativas: 0 } }, marcos: [] } }));
    expect(lido.tipo === 'ok' && lido.vida.dependencias14).toBeFalsy();
  });
  it('a partir dos 14 o vício é possível, não obrigatório (a mesma regra de sempre: contexto, não sorteio solto)', () => {
    let com = 0, sem = 0;
    for (let s = 1; s <= 24; s++) {
      let v = viverAte(nova({ semente: 1300 + s }), 14);
      for (let k = 0; k < 12; k++) { v.mente.estresse = 80; v.personalidade.tracos.impulsividade = 60; v = ano(v); }
      if (Object.keys(v.dependencias14?.lista ?? {}).length || v.corpo.habitos.fuma || v.corpo.habitos.bebe !== 'nao') com++; else sem++;
    }
    expect(com).toBeGreaterThan(0);
    expect(sem).toBeGreaterThan(0);
  });
  it('NPCs: ninguém fuma antes dos 16 (o hábito do mundo é da semente da pessoa, e respeita a idade)', () => {
    for (let k = 0; k < 400; k++) expect(habitosDaPessoa({ id: `p${k}` } as never, 13).fuma).toBe(false);
  });
  it('quem continua a vida de quem morreu não herda os vícios dele', () => {
    let v = adulto(45, { semente: 81 });
    v.corpo.habitos.fuma = true;
    v.dependencias14 = { lista: { tabaco: { nivel: 60, pico: 60, desde: v.t, recaidas: 0, tentativas: 0 }, alcool: { nivel: 70, pico: 70, desde: v.t, recaidas: 1, tentativas: 0 } }, marcos: [] };
    v.apostas = { anosPesados: 3 } as never;
    const { p: filha } = comFilho(v, 10, { casa: true });
    v = transacao(v, x => { x.morte = { t: x.t, causa: 'infarto' }; }).vida;
    const r = continuarComo(v, filha.id);
    expect(r.erro).toBeUndefined();
    expect(r.vida.dependencias14).toBeUndefined();
    expect(r.vida.apostas).toBeUndefined();
    expect(r.vida.corpo.habitos.fuma).toBe(false);
    const depois = ano(r.vida);
    expect(depois.dependencias14).toBeUndefined();
  });
  it('dependência: progressão com efeito nos estudos; ajuda, tratamento e recuperação', () => {
    const jovem = viverAte(nova({ semente: 52 }), 15);
    if (jovem.educacao.basica) {
      jovem.dependencias14 = { lista: { drogas: { nivel: 60, pico: 60, desde: jovem.t, recaidas: 0, tentativas: 0, substancia: 'cannabis' } }, marcos: [] };
      const antes = jovem.educacao.basica.desempenho;
      processarDependencias14(jovem);
      expect(jovem.educacao.basica.desempenho).toBeLessThan(antes);
    }
    let v = adulto(22, { semente: 33 });
    v.dependencias14 = { lista: { drogas: { nivel: 60, pico: 60, desde: v.t, recaidas: 0, tentativas: 0, substancia: 'cannabis' } }, marcos: [] };
    v = tenta(v, { tipo: 'dep14', oque: { op: 'tratar', tipo: 'drogas', modo: 'grupo' } } as Acao);
    expect(v.dependencias14!.lista.drogas!.tratamento?.modo).toBe('grupo');
    for (let k = 0; k < 6 && v.dependencias14?.lista.drogas && v.dependencias14.lista.drogas.limpoDesde === undefined; k++) { v = ano(v); v = tenta(v, { tipo: 'dep14', oque: { op: 'tratar', tipo: 'drogas', modo: 'grupo' } } as Acao); }
    const d = v.dependencias14?.lista.drogas;
    expect(!d || d.limpoDesde !== undefined || d.nivel < 60).toBe(true);
  });
});

function piloto(s: number, classe: 'media' | 'alta' = 'alta'): Vida {
  const v = viverAte(nova({ semente: s, classe }), 9);
  return tenta(v, { tipo: 'auto20', oque: { op: 'comecar' } } as Acao);
}

describe('Automobilismo — do kart à F1', () => {
  it('começa no kart só criança/adolescente; atleta profissional e adulto não', () => {
    const v = piloto(41);
    expect(v.automobilismo20?.fase).toBe('kart');
    expect(v.biografia.some(e => /kart/i.test(e.texto))).toBe(true);
    expect(podeTentar(disponibilidade(adulto(25), { tipo: 'auto20', oque: { op: 'comecar' } } as Acao))).toBe(false);
    expect(podeTentar(disponibilidade(viverAte(nova({ semente: 3 }), 5), { tipo: 'auto20', oque: { op: 'comecar' } } as Acao))).toBe(false);
  });
  it('a temporada é corrida a corrida: posições, pontos, vitórias e pódios coerentes', () => {
    let v = piloto(42);
    for (let k = 0; k < 3; k++) v = ano(v);
    const ts = v.automobilismo20!.temporadas;
    expect(ts.length).toBeGreaterThan(0);
    for (const t of ts) {
      expect(t.posicao).toBeGreaterThanOrEqual(1);
      expect(t.posicao).toBeLessThanOrEqual(CATEGORIAS20[t.categoria].grid);
      expect(t.podios).toBeGreaterThanOrEqual(t.vitorias);
      expect(t.vitorias).toBeLessThanOrEqual(t.corridas);
      expect(t.pontos).toBeLessThanOrEqual(t.corridas * 25);
      if (t.titulo) expect(t.posicao).toBe(1);
    }
  });
  it('sem orçamento não há temporada; dois anos sem, a carreira acaba', () => {
    let v = piloto(43, 'media');
    v.automobilismo20!.fase = 'f3'; v.automobilismo20!.equipe = 'Halcyon GP';
    v.automobilismo20!.temporadas = [{ ano: anoDe(v.t) - 1, categoria: 'f3', equipe: 'x', corridas: 1, vitorias: 0, podios: 0, poles: 0, pontos: 0, posicao: 20, abandonos: 0, acidentes: 0 }];
    v.origem.classe = 'trabalhadora';
    processarAutomobilismo20(v);
    expect(v.biografia.some(e => /orçamento/.test(e.texto))).toBe(true);
    processarAutomobilismo20(v);
    expect(v.automobilismo20!.fase).toBe('encerrada');
    expect(v.automobilismo20!.motivoFim).toBe('orcamento');
  });
  it('F1: exige 18 anos e 40 pontos de Superlicença em três anos; o contrato vira emprego com salário', () => {
    const v = piloto(44);
    const a = v.automobilismo20!;
    const y = anoDe(v.t);
    a.temporadas = [{ ano: y - 2, categoria: 'f3', equipe: 'x', corridas: 20, vitorias: 3, podios: 6, poles: 1, pontos: 150, posicao: 3, abandonos: 1, acidentes: 0, sl: 20 }, { ano: y - 1, categoria: 'f2', equipe: 'y', corridas: 28, vitorias: 4, podios: 9, poles: 2, pontos: 220, posicao: 2, abandonos: 1, acidentes: 0, sl: 40 }];
    expect(pontosDeSuperlicenca(a, y - 1)).toBe(60);
    expect(pontosDeSuperlicenca(a, y + 2)).toBe(0);
    a.fase = 'f2';
    let w = adulto(19, { semente: 44 });
    a.proposta = { categoria: 'f1', equipe: 'Aurora Racing', forca: 85, validaAte: w.t + 11, salario: 6000000 };
    w.automobilismo20 = a;
    w = tenta(w, { tipo: 'auto20', oque: { op: 'aceitar' } } as Acao);
    expect(w.automobilismo20!.fase).toBe('f1');
    expect(w.trabalho.atual?.ocupacaoId).toBe('piloto_corrida');
    expect(w.trabalho.atual?.empregador).toBe('Aurora Racing');
    expect(w.trabalho.atual!.salario).toBeGreaterThan(400000);
    w = ano(w);
    expect(w.automobilismo20!.temporadas.some(t => t.categoria === 'f1')).toBe(true);
    // A fama: a F1 põe o nome na frente do público.
    for (let k = 0; k < 3 && w.automobilismo20!.fase === 'f1'; k++) w = ano(w);
    expect(w.notoriedade?.valor ?? 0).toBeGreaterThan(10);
  });
  it('os atributos têm teto no talento; o treino aproxima, não passa', () => {
    let v = piloto(45);
    for (let k = 0; k < 12 && v.automobilismo20!.fase !== 'encerrada'; k++) { v = tenta(v, { tipo: 'auto20', oque: { op: 'treinar', foco: 'mental' } } as Acao); v = ano(v); }
    const a = v.automobilismo20!;
    for (const k of Object.keys(a.atributos) as (keyof typeof a.atributos)[]) expect(a.atributos[k]).toBeLessThanOrEqual(tetoDoAtributo(a, k) + 0.01);
    expect(nivelDoPiloto(a)).toBeLessThan(100);
  });
  it('trajetórias diferentes: com a mesma regra, umas sobem, outras param (e o determinismo vale)', () => {
    const fins = new Set<string>();
    for (let s = 0; s < 6; s++) {
      let v = piloto(500 + s * 7);
      for (let k = 0; k < 14 && v.automobilismo20!.fase !== 'encerrada'; k++) { v = tenta(v, { tipo: 'auto20', oque: { op: 'aceitar' } } as Acao); v = tenta(v, { tipo: 'auto20', oque: { op: 'patrocinio' } } as Acao); v = ano(v); }
      fins.add(v.automobilismo20!.fase);
    }
    expect(fins.size).toBeGreaterThan(1);
    const a = (s: number) => { let v = piloto(s); for (let k = 0; k < 5; k++) v = ano(v); return JSON.stringify(v.automobilismo20); };
    expect(a(61)).toBe(a(61));
  });
});

function rico(i = 35): Vida { const v = adulto(i, { semente: 21 }); v.financas.conta = 3e9; return v; }

describe('Clubes — todos os clubes em que se joga estão à venda', () => {
  it('a lista de venda tem cada clube do catálogo do país (e de cada país carregado)', () => {
    const v = rico();
    const br = clubesAVenda(v, 'BR');
    expect(br.length).toBe(clubesDoPais('BR').length);
    expect(new Set(br.map(c => c.nome))).toEqual(new Set(clubesDoPais('BR').map(c => c.nome)));
    for (const c of br) { expect(c.preco).toBeGreaterThan(0); expect(c.valor).toBeGreaterThanOrEqual(c.preco); }
  });
  it('comprar: pede dinheiro (não patrimônio), assume as dívidas, persiste no save e entra no patrimônio', () => {
    const pobre = adulto(30);
    pobre.financas.conta = 1000;
    expect(podeTentar(disponibilidade(pobre, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Flamengo', pais: 'BR' } } as Acao))).toBe(false);
    let v = rico();
    const x = avaliarClube(v, 'Náutico', 'BR')!;
    const antes = v.financas.conta;
    v = tenta(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Náutico', pais: 'BR' } } as Acao);
    expect(v.clube20?.nome).toBe('Náutico');
    expect(antes - v.financas.conta).toBe(x.preco);
    expect(v.clube20!.divida).toBe(x.divida);
    expect(v.clube20!.elenco.length).toBeGreaterThanOrEqual(18);
    expect(balanco(v).empresas).toBeGreaterThan(0);
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && lido.vida.clube20?.nome).toBe('Náutico');
    // Um clube por vez.
    expect(podeTentar(disponibilidade(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Sport', pais: 'BR' } } as Acao))).toBe(false);
  });
  it('financiar: 40% de entrada, o resto vira dívida no banco (paga pelo motor de sempre)', () => {
    let v = adulto(35, { semente: 21 });
    const x = avaliarClube(v, 'Remo', 'BR')!;
    v.financas.conta = Math.round(x.preco * 0.45);
    v = tenta(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Remo', pais: 'BR', financiar: true } } as Acao);
    expect(v.clube20?.nome).toBe('Remo');
    expect(v.financas.dividas.some(d => /compra do Remo/.test(d.descricao))).toBe(true);
  });
  it('a temporada do clube é a da liga do país: o histórico do clube é a linha dele na tabela', () => {
    let v = rico();
    v = tenta(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Bahia', pais: 'BR' } } as Acao);
    for (let k = 0; k < 3; k++) v = ano(v);
    const c = v.clube20!;
    const h = c.historico[c.historico.length - 1];
    expect(h).toBeDefined();
    const u = ultimaTemporadaDoPais(v, 'BR')!;
    if (h.posicao && h.divisao >= 2) expect(u.tabelas?.[h.divisao as 2]?.[h.posicao - 1]?.[0]).toBe('Bahia');
    expect(ligaDe(v, 'BR').div.Bahia).toBeGreaterThanOrEqual(1);
  });
  it('mercado, venda, renovação, base, obras: nenhum jogador em dois lugares', () => {
    let v = rico();
    v = tenta(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Goiás', pais: 'BR' } } as Acao);
    const m = mercadoDoAno(v)[0];
    v = tenta(v, { tipo: 'clube20', oque: { op: 'aportar', valor: 300e6 } } as Acao);
    v = tenta(v, { tipo: 'clube20', oque: { op: 'contratar', id: m.id } } as Acao);
    expect(v.clube20!.elenco.some(j => j.nome === m.nome)).toBe(true);
    expect(mercadoDoAno(v).some(j => j.id === m.id)).toBe(false);
    const vendido = v.clube20!.elenco[0];
    v = tenta(v, { tipo: 'clube20', oque: { op: 'vender', id: vendido.id } } as Acao);
    expect(v.clube20!.elenco.some(j => j.id === vendido.id)).toBe(false);
    expect(v.clube20!.vendas[0].nome).toBe(vendido.nome);
    const jr = v.clube20!.juniores[0];
    v = tenta(v, { tipo: 'clube20', oque: { op: 'promover', id: jr.id } } as Acao);
    expect(v.clube20!.elenco.some(j => j.id === jr.id) && !v.clube20!.juniores.some(j => j.id === jr.id)).toBe(true);
    v = tenta(v, { tipo: 'clube20', oque: { op: 'obra', qual: 'ct' } } as Acao);
    const ct = v.clube20!.ct;
    expect(v.clube20!.obra?.qual).toBe('ct');
    v = ano(v); v = ano(v);
    expect(v.clube20!.ct).toBe(ct + 1);
    const ids = [...v.clube20!.elenco, ...v.clube20!.juniores].map(j => j.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('conflito de interesses: quem joga num clube do país não compra outro dele', () => {
    const v = rico(25);
    v.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Sport', nivel: 4, tInicio: v.t, tFase: v.t, lesoes: 0, municipioId: 'recife-pe' } as never;
    expect(conflitoDeInteresses(v, 'Náutico', 'BR')).toMatch(/Sport/);
    expect(podeTentar(disponibilidade(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Náutico', pais: 'BR' } } as Acao))).toBe(false);
    expect(conflitoDeInteresses(v, 'Sport', 'BR')).toBeUndefined();
  });
  it('vender o clube devolve o valor menos as dívidas; o elenco é coerente (média dentro da régua)', () => {
    let v = rico();
    v = tenta(v, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Ceará', pais: 'BR' } } as Acao);
    expect(mediaDoElenco(v.clube20!)).toBeGreaterThan(50);
    expect(mediaDoElenco(v.clube20!)).toBeLessThan(85);
    const conta = v.financas.conta;
    v = tenta(v, { tipo: 'clube20', oque: { op: 'vender_clube' } } as Acao);
    expect(v.clube20).toBeUndefined();
    expect(v.financas.conta).toBeGreaterThanOrEqual(conta);
  });
});

describe('Joias de usar', () => {
  it('o catálogo: cada peça é item de estilo no lugar certo, com metal/pedra na descrição e preço coerente', () => {
    expect(JOIAS20.length).toBeGreaterThanOrEqual(80);
    const lugares = new Set(JOIAS20.map(j => j.lugar));
    for (const l of ['joia', 'orelha', 'pulseira', 'anel', 'alianca', 'tornozelo']) expect(lugares.has(l as never)).toBe(true);
    for (const j of JOIAS20) {
      const it = itemEstilo(j.id)!;
      expect(it.lugar).toBe(j.lugar);
      expect(it.preco).toBeGreaterThan(0);
    }
    expect(joia20('j20_solitario_platina_diamante')!.preco).toBeGreaterThan(joia20('j20_solitario_prata_zirconia')!.preco * 10);
  });
  it('comprar, usar, trocar e guardar; um por lugar; aliança junto com anel; o save guarda o mesmo item', () => {
    let v = adulto(30, { semente: 5 });
    v.financas.conta = 1e6;
    const comprar = (id: string) => { v = executar(v, { tipo: 'comprar_item', itemId: id }).vida; if (!v.eu.estilo!.itens.find(x => x.itemId === id)!.usando) v = executar(v, { tipo: 'usar_item', itemId: id, usar: true }).vida; };
    comprar('j20_ponto_de_luz_ouro_branco_diamante');
    expect(v.eu.visual.modeloJoia).toBe('j20_ponto_de_luz_ouro_branco_diamante');
    comprar('j20_grumet_prata');
    expect(v.eu.visual.modeloJoia).toBe('j20_grumet_prata');
    const usando = v.eu.estilo!.itens.filter(x => x.usando && itemEstilo(x.itemId)?.lugar === 'joia');
    expect(usando.map(x => x.itemId)).toEqual(['j20_grumet_prata']);
    comprar('j20_solitario_ouro_amarelo_diamante');
    comprar('j20_alianca_classica_ouro_amarelo');
    comprar('j20_tornozeleira_fina_prata');
    comprar('j20_argola_m_ouro_amarelo');
    const em = v.eu.estilo!.itens.filter(x => x.usando).map(x => x.itemId);
    for (const id of ['j20_solitario_ouro_amarelo_diamante', 'j20_alianca_classica_ouro_amarelo', 'j20_tornozeleira_fina_prata', 'j20_argola_m_ouro_amarelo']) expect(em).toContain(id);
    expect(v.eu.visual.modeloBrincos).toBe('j20_argola_m_ouro_amarelo');
    v = executar(v, { tipo: 'usar_item', itemId: 'j20_grumet_prata', usar: false }).vida;
    expect(v.eu.visual.modeloJoia).toBeUndefined();
    expect(v.eu.estilo!.itens.some(x => x.itemId === 'j20_grumet_prata')).toBe(true);
    v = executar(v, { tipo: 'usar_item', itemId: 'j20_ponto_de_luz_ouro_branco_diamante', usar: true }).vida;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && lido.vida.eu.visual.modeloJoia).toBe('j20_ponto_de_luz_ouro_branco_diamante');
    v = ano(v);
    expect(v.eu.visual.modeloJoia).toBe('j20_ponto_de_luz_ouro_branco_diamante');
    expect(v.eu.estilo!.itens.filter(x => x.usando).map(x => x.itemId)).toContain('j20_alianca_classica_ouro_amarelo');
  });
});

describe('Integração', () => {
  it('Em alta: o título do seu clube e a vitória na F1 viram assunto (com origem)', () => {
    const v = adulto(30);
    v.clube20 = { nome: 'Sport', pais: 'BR', historico: [{ ano: anoDe(v.t), divisao: 4, posicao: 1, receita: 1, despesa: 1, caixa: 0, forca: 4, titulo: true }] } as never;
    v.automobilismo20 = { fase: 'f1', temporadas: [{ ano: anoDe(v.t), categoria: 'f1', vitorias: 2, titulo: false }] } as never;
    const t = emAlta19(v);
    expect(t.some(x => x.id.startsWith('clube20:'))).toBe(true);
    expect(t.some(x => x.id.startsWith('auto20:'))).toBe(true);
  });
  it('saves antigos (sem nenhum estado novo) carregam e avançam', () => {
    const v = adulto(40, { semente: 9 });
    delete v.clube20; delete v.automobilismo20;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') expect(() => ano(lido.vida)).not.toThrow();
  });
});
