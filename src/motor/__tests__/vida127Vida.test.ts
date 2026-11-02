/**
 * VIDA 12.7 — a casa (acabamentos, reforma com prévia, o catálogo por cômodo), a moda (tipos de peça, o luxo de
 * verdade), as tatuagens (o significado que muda, a história) e as falas (o trabalho por ambiente, o fim do caso).
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { transacao } from '../nucleo';
import { vincular } from '../pessoas';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { ACABAMENTOS, ASPECTOS_DO_COMODO, COMODO_DA_COISA, COMODOS, opcaoDeAcabamento } from '../dados/lar';
import { COISAS, coisa } from '../dados/coisas';
import { ITENS_ESTILO, nivelDoItem, TIPOS_DE_PECA, tipoDePeca } from '../dados/estilo';
import { acabamentoDoComodo, comodoDaCoisa, comodosDaCasa } from '../sistemas/lar';
import { reformaDoComodo } from '../sistemas/personalizacao';
import { lojasDaVida, ofertasDaLoja } from '../sistemas/lojas';
import { marca as marcaPorId } from '../dados/lojas';
import { ABERTURA_DO_AUMENTO, AUMENTO_NAO, AUMENTO_SIM, COMO_VAI } from '../dados/falasDoTrabalho';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { criarRng } from '../rng';
import type { Imovel, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };

function dona(conta = 5_000_000, modeloId = 'casa_grande'): Vida {
  const v = adulto(40, { semente: 127, municipioId: 'sao-paulo-sp' });
  v.financas.conta = conta; v.financas.dividas = []; v.financas.coisas = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId, nome: 'casa', valor: 2_000_000, tCompra: v.t - 120, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId, aluguel: 0, padrao: 4, tInicio: v.t - 120 };
  v.momento = null;
  return v;
}

describe('12.7 · a casa: acabamentos e a reforma com prévia', () => {
  it('o catálogo de acabamentos cresceu, com os seis segmentos e um desenho para cada opção', () => {
    expect(ACABAMENTOS.piso.opcoes.length).toBeGreaterThanOrEqual(18);
    expect(ACABAMENTOS.parede.opcoes.length).toBeGreaterThanOrEqual(30);
    expect(ACABAMENTOS.luz.opcoes.length).toBeGreaterThanOrEqual(12);
    expect(ACABAMENTOS.rodape.opcoes.length).toBeGreaterThanOrEqual(4);
    expect(ACABAMENTOS.cortina.opcoes.length).toBeGreaterThanOrEqual(6);
    const niveis = new Set(ASPECTOS_DO_COMODO.flatMap(a => ACABAMENTOS[a].opcoes.map(o => o.nivel)));
    for (const n of [1, 2, 3, 4, 5, 6]) expect(niveis.has(n), `nível ${n}`).toBe(true);
    for (const a of ASPECTOS_DO_COMODO) for (const o of ACABAMENTOS[a].opcoes) {
      expect(o.desenho, `${a}:${o.id}`).toBeTruthy();
      expect(new Set(ACABAMENTOS[a].opcoes.map(x => x.id)).size).toBe(ACABAMENTOS[a].opcoes.length);
    }
  });

  it('a prévia não cobra; confirmar cobra exatamente o total da prévia e grava tudo de uma vez', () => {
    let v = dona();
    const sala = comodosDaCasa(v).find(c => c.tipo === 'sala')!;
    const mudancas = { piso: 'taco_espinha', parede: 'boiserie_verde', luz: 'lustre_cristal', rodape: 'moldura_teto', cortina: 'veludo' } as const;
    const conta0 = v.financas.conta;
    const previa = reformaDoComodo(v, sala.id, mudancas, { temperatura: 'neutra', intensidade: 70 });
    expect(previa.itens.map(x => x.aspecto).sort()).toEqual(['cortina', 'luz', 'parede', 'piso', 'rodape']);
    expect(previa.total).toBe(previa.itens.reduce((s, x) => s + x.preco, 0));
    expect(previa.regulavel).toBe(true);
    expect(v.financas.conta).toBe(conta0);
    v = fazer(v, { tipo: 'personalizar', op: { o: 'reforma', comodo: sala.id, mudancas, luz: { temperatura: 'neutra', intensidade: 70 } } });
    expect(conta0 - v.financas.conta).toBe(previa.total);
    for (const [a, id] of Object.entries(mudancas)) expect(acabamentoDoComodo(v, sala.id, a as never)).toBe(id);
    const lar = (v.financas.bens[0] as Imovel).lar!;
    expect(lar.luzes?.[sala.id]).toEqual({ temperatura: 'neutra', intensidade: 70 });
    // Salvar e carregar mantém a reforma.
    const w = (interpretar(JSON.stringify(v)) as { vida: Vida }).vida;
    for (const [a, id] of Object.entries(mudancas)) expect(acabamentoDoComodo(w, sala.id, a as never)).toBe(id);
    expect((w.financas.bens[0] as Imovel).lar!.luzes?.[sala.id]?.intensidade).toBe(70);
    // O que já está assim não entra na conta (nem custa) — e nada mudou = nada a confirmar.
    expect(reformaDoComodo(w, sala.id, mudancas).itens).toEqual([]);
    expect(pode(w, { tipo: 'personalizar', op: { o: 'reforma', comodo: sala.id, mudancas } })).toBe(false);
  });

  it('as regras de cada espaço: lá fora só luz; sem janela, sem cortina; alugada não troca piso; luz simples não regula', () => {
    const v = dona();
    const cs = comodosDaCasa(v);
    const banheiro = cs.find(c => c.tipo === 'banheiro')!;
    expect(pode(v, { tipo: 'personalizar', op: { o: 'reforma', comodo: banheiro.id, mudancas: { cortina: 'linho' } } })).toBe(false);
    expect(pode(v, { tipo: 'personalizar', op: { o: 'reforma', comodo: banheiro.id, mudancas: { parede: 'marmore_parede' } } })).toBe(true);
    const sala = cs.find(c => c.tipo === 'sala')!;
    expect(pode(v, { tipo: 'personalizar', op: { o: 'reforma', comodo: sala.id, mudancas: { luz: 'simples' }, luz: { intensidade: 50 } } })).toBe(false);
    const alugada = transacao(adulto(30, { semente: 128 }), x => { x.financas.conta = 100_000; x.momento = null; x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 2000, padrao: 3, tInicio: x.t }; }).vida;
    const s2 = comodosDaCasa(alugada).find(c => c.tipo === 'sala')!;
    expect(pode(alugada, { tipo: 'personalizar', op: { o: 'reforma', comodo: s2.id, mudancas: { piso: 'carvalho' } } })).toBe(false);
    expect(pode(alugada, { tipo: 'personalizar', op: { o: 'reforma', comodo: s2.id, mudancas: { parede: 'verde_salvia', cortina: 'persiana' } } })).toBe(true);
  });

  it('sem dinheiro, a prévia mostra o preço e a confirmação não passa', () => {
    const v = dona(500);
    const sala = comodosDaCasa(v).find(c => c.tipo === 'sala')!;
    expect(reformaDoComodo(v, sala.id, { piso: 'marmore_calacatta' }).total).toBeGreaterThan(10_000);
    expect(pode(v, { tipo: 'personalizar', op: { o: 'reforma', comodo: sala.id, mudancas: { piso: 'marmore_calacatta' } } })).toBe(false);
  });
});

describe('12.7 · a casa: o catálogo por cômodo', () => {
  const novos = COISAS.filter(c => (c.nivel ?? 0) > 0);
  it('cada cômodo tem coisas próprias, do básico ao alto padrão', () => {
    expect(novos.length).toBeGreaterThanOrEqual(80);
    for (const tipo of ['sala', 'cozinha', 'quarto', 'quarto_extra', 'banheiro', 'piscina', 'jardim', 'lazer', 'garagem', 'escritorio', 'jogos', 'academia', 'cinema']) {
      const doComodo = novos.filter(c => COMODO_DA_COISA[c.id]?.[0] === tipo || (tipo === 'lazer' && COMODO_DA_COISA[c.id]?.includes('lazer')));
      expect(doComodo.length, tipo).toBeGreaterThanOrEqual(tipo === 'lazer' || tipo === 'cinema' ? 2 : 3);
    }
    for (const c of novos) expect(COMODO_DA_COISA[c.id], c.id).toBeTruthy();
    const niveis = new Set(novos.map(c => c.nivel));
    for (const n of [1, 2, 3, 4, 5, 6]) expect(niveis.has(n), `nível ${n}`).toBe(true);
  });

  it('a coisa nova vai para o cômodo dela quando ele existe (a distribuição automática de sempre)', () => {
    let v = dona();
    const tem = new Set(comodosDaCasa(v).map(c => c.tipo));
    for (const id of ['geladeira', 'banheira', 'cama_king', 'tv_oled']) {
      v = fazer(v, { tipo: 'comprar_coisa', coisaId: id });
      const t = v.financas.coisas!.find(x => x.coisaId === id)!;
      const destino = COMODO_DA_COISA[id].find(x => tem.has(x as never));
      const cm = comodoDaCoisa(v, t)!;
      expect(cm.tipo, id).toBe(destino);
    }
  });

  it('o móvel de luxo só sai de marca premium ou de luxo, e a marca soma menos sobre ele', () => {
    const v = dona();
    const lojas = lojasDaVida(v);
    const ofertas = lojas.flatMap(e => ofertasDaLoja(v, e.id)).filter(o => o.produto.tipo === 'coisa' && (coisa(o.produto.id)?.nivel ?? 0) >= 4);
    expect(ofertas.length).toBeGreaterThan(0);
    for (const o of ofertas) if (o.marca) expect(marcaPorId(o.marca)!.faixa, `${o.produto.id}/${o.marca}`).toBeGreaterThanOrEqual(3);
    const sofa = ofertas.filter(o => o.produto.id === 'sofa_designer').map(o => o.preco);
    expect(Math.max(...sofa)).toBeLessThan(85_000 * 1.6 * 1.3);
  });

  it('saves antigos: as coisas de antes continuam nos cômodos de antes; as casas antigas leem os acabamentos de origem', () => {
    const v = dona();
    for (const c of comodosDaCasa(v)) for (const a of ASPECTOS_DO_COMODO) expect(opcaoDeAcabamento(a, acabamentoDoComodo(v, c.id, a)), `${c.id}:${a}`).toBeTruthy();
    expect(COMODOS.sala).toBeTruthy();
  });
});

describe('12.7 · a moda', () => {
  it('toda peça tem um tipo principal (sem subcategoria) e um segmento', () => {
    const ids = new Set(TIPOS_DE_PECA.map(t => t.id));
    for (const it of ITENS_ESTILO) { expect(ids.has(tipoDePeca(it)), it.id).toBe(true); expect(nivelDoItem(it)).toBeGreaterThanOrEqual(1); }
    for (const t of TIPOS_DE_PECA) expect(ITENS_ESTILO.some(it => tipoDePeca(it) === t.id), t.id).toBe(true);
    expect(tipoDePeca(ITENS_ESTILO.find(x => x.id === 'vestido_festa')!)).toBe('vestidos');
    expect(tipoDePeca(ITENS_ESTILO.find(x => x.id === 'saia_midi')!)).toBe('saias');
    expect(tipoDePeca(ITENS_ESTILO.find(x => x.id === 'bermuda_sarja')!)).toBe('shorts');
    expect(tipoDePeca(ITENS_ESTILO.find(x => x.id === 'terno')!)).toBe('sociais');
    expect(tipoDePeca(ITENS_ESTILO.find(x => x.id === 'legging')!)).toBe('esportivas');
  });

  it('o luxo tem faixas de verdade: alto luxo e exclusivo passam de dezenas a centenas de milhares', () => {
    const v = dona();
    const ofertas = lojasDaVida(v).flatMap(e => ofertasDaLoja(v, e.id)).filter(o => o.produto.tipo === 'item');
    const max = Math.max(...ofertas.map(o => o.preco));
    expect(max).toBeGreaterThanOrEqual(300_000);
    expect(ofertas.some(o => o.produto.id === 'vestido_alta_costura')).toBe(true);
    expect(ofertas.filter(o => o.preco >= 15_000 && o.preco < 80_000).length).toBeGreaterThan(3);
    // O básico continua barato.
    expect(Math.min(...ofertas.filter(o => o.produto.id === 'camiseta_lisa').map(o => o.preco))).toBeLessThan(300);
  });
});

describe('12.7 · tatuagens: o significado que muda, a história', () => {
  it('ressignificar guarda o que era e o que passou a ser; a tinta não muda', () => {
    let v = transacao(adulto(30, { semente: 1271, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 100_000; x.momento = null; }).vida;
    v = fazer(v, { tipo: 'tatuar', desenho: 'andorinha', regiao: 'antebraco', lado: 'e', significado: { tipo: 'amor' } } as Acao);
    const t0 = v.eu.tatuagens!.find(x => x.desenho === 'andorinha')!;
    const antes = { regiao: t0.regiao, ajuste: t0.ajuste, desenho: t0.desenho };
    v = fazer(v, { tipo: 'ressignificar_tatuagem', id: t0.id, significado: { tipo: 'recomeco' } });
    const t = v.eu.tatuagens!.find(x => x.id === t0.id)!;
    expect(t.significado?.tipo).toBe('recomeco');
    expect(t.alteracoes).toEqual([{ t: v.t, oque: 'significado', de: 'Por um amor', para: 'Um recomeço' }]);
    expect({ regiao: t.regiao, ajuste: t.ajuste, desenho: t.desenho }).toEqual(antes);
    expect(pode(v, { tipo: 'ressignificar_tatuagem', id: t0.id, significado: { tipo: 'recomeco' } })).toBe(false);
    const w = (interpretar(JSON.stringify(v)) as { vida: Vida }).vida;
    expect(w.eu.tatuagens!.find(x => x.id === t0.id)!.alteracoes?.length).toBe(1);
  });
});

describe('12.7 · as falas', () => {
  it('cada ambiente de trabalho tem a sua conversa do aumento e a sua leitura do ano', () => {
    for (const amb of Object.keys(ABERTURA_DO_AUMENTO) as (keyof typeof ABERTURA_DO_AUMENTO)[]) {
      expect(ABERTURA_DO_AUMENTO[amb].length).toBeGreaterThanOrEqual(1);
      expect(AUMENTO_SIM[amb].length).toBeGreaterThanOrEqual(1);
      expect(AUMENTO_NAO[amb].length).toBeGreaterThanOrEqual(1);
      expect(COMO_VAI[amb]).toHaveLength(4);
    }
    const todas = new Set(Object.values(ABERTURA_DO_AUMENTO).flat());
    expect(todas.size).toBeGreaterThanOrEqual(14);
  });

  it('a conversa do aumento acontece no cenário do trabalho (o garçom não está numa "sala fechada, café frio")', () => {
    const cena = conteudoPorId('trab_negociacao')!;
    const v = transacao(adulto(30, { semente: 1272 }), x => { x.momento = null; }).vida;
    const texto = (setor: string) => {
      const w = transacao(v, x => { x.trabalho.atual = { ...(x.trabalho.atual ?? {}), ocupacaoId: setor, empregador: 'o lugar', tInicio: x.t - 30, salario: 3000, desempenho: 70 } as never; }).vida;
      const c = preparar(cena, w, criarRng(1));
      const t = (cena as unknown as { texto: (c: unknown) => string }).texto;
      return c ? t(c) : '';
    };
    const garcom = texto('garcom');
    expect(garcom).toMatch(/salão|caixa|gerência|gerente/);
    expect(garcom).not.toMatch(/café frio/);
    expect(texto('aux_cozinha')).not.toMatch(/café frio/);
  });

  it('o fim do caso depende do caso (e não é sempre a mesma frase)', () => {
    const textos = new Set<string>();
    for (let k = 0; k < 12; k++) {
      const v = transacao(adulto(32, { semente: 1270 + k }), x => { x.financas.conta = 400_000; x.momento = null; }).vida;
      comParceiro(v, { estagio: 'casamento' });
      const amante = pessoaNova(v, 30, k % 2 ? 'masculino' : 'feminino');
      const vin = vincular(v, amante, { origem: 'romance', proximidade: 60 });
      vin.romance = { estagio: 'saindo', tEstagio: v.t - (k % 3) * 20, tInicio: v.t - (k % 3) * 20 - 2, envolvimento: 50, secreto: true };
      const s = executar(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: 'encerrar_caso' as never });
      textos.add(s.resultado ?? '');
      expect(s.vida.vinculos[amante.id]?.romance?.estagio).toBe('ex');
    }
    expect(textos.size).toBeGreaterThanOrEqual(5);
  });

  it('a conversa sobre o futuro com o amante não repete a frase duas vezes seguidas; o carinho existe', () => {
    let v = transacao(adulto(32, { semente: 1279 }), x => { x.financas.conta = 400_000; x.momento = null; }).vida;
    comParceiro(v, { estagio: 'casamento' });
    const amante = pessoaNova(v, 30, 'masculino');
    const vin = vincular(v, amante, { origem: 'romance', proximidade: 60 });
    vin.romance = { estagio: 'saindo', tEstagio: v.t - 12, tInicio: v.t - 12, envolvimento: 30, secreto: true };
    let anterior = '';
    for (let k = 0; k < 4; k++) {
      v.vinculos[amante.id].romance!.envolvimento = 30;
      const s = executar(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: 'caso_futuro' as never });
      expect(s.resultado).not.toBe(anterior);
      anterior = s.resultado ?? '';
      v = s.vida;
    }
    expect(pode(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: 'caso_carinho' as never })).toBe(true);
    v = fazer(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: 'caso_carinho' as never });
    expect(pode(v, { tipo: 'pessoa', pessoaId: amante.id, interacao: 'caso_carinho' as never })).toBe(false);
  });
});
