/**
 * VIDA 27 · §4 — a venda da safra (e da fazenda): o dinheiro entra, uma vez só, e persiste.
 *
 * O defeito: a situação "A hora de vender" pagava valores fixos e, em "Vender agora ao atravessador", os desfechos
 * ruim/péssimo não pagavam nada — a safra era "vendida" sem dinheiro. E com propriedade no Campo, a colheita
 * também entrava no fechamento do ano, sem relação com a venda.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { avancarAno } from '../ano';
import { interpretar } from '../save';
import { ofertasRurais } from '../v18/rural/acoes18';
import { safrasAVenda18 } from '../v18/rural/fazenda18';
import { resolverSituacao, situacaoAberta } from '../sistemas/situacoes';
import { criarRng } from '../rng';
import type { Imovel, Vida } from '../tipos';

const fazer = (v: Vida, a: Acao) => { const d = disponibilidade(v, a); expect(podeTentar(d), `${JSON.stringify(a)}: ${d.motivo}`).toBe(true); return executar(v, a); };
const limpar = (v: Vida) => { v.momento = null; delete v.fila; return v; };

function comFazenda(): { v: Vida; b: Imovel } {
  let v = adulto(40, { semente: 27, municipioId: 'uberaba-mg' });
  v.financas.conta = 50_000_000; v.financas.dividas = [];
  const o = ofertasRurais(v).find(x => x.preco > 0 && x.p.tipo !== 'haras')!;
  v = fazer(v, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id } }).vida;
  const b = v.financas.bens.find((x): x is Imovel => x.tipo === 'imovel' && !!x.rural)!;
  return { v, b };
}

/** Com lavoura anual a colher neste ano e tocando a terra (o caminho rural aberto). */
function comLavoura(): { v: Vida; b: Imovel } {
  let { v, b } = comFazenda();
  const p = b.rural!;
  v = fazer(v, { tipo: 'rural18', oque: { op: 'tocar', id: p.id } }).vida;
  limpar(v);
  if (!safrasAVenda18(v).length) {
    const livre = Math.floor(Math.min(50, p.ha * 0.3));
    v = fazer(v, { tipo: 'rural18', oque: { op: 'plantar', id: p.id, cultura: 'milho', ha: livre } }).vida;
  }
  return { v, b: v.financas.bens.find(x => x.id === b.id) as Imovel };
}

function abrirVenda(v: Vida) { v.caminhos.situacao = { id: 'rur_venda', t: v.t, dados: {} }; return situacaoAberta(v); }

describe('VIDA 27 · venda da safra', () => {
  it('há safra a vender, com valor da lavoura real', () => {
    const { v } = comLavoura();
    const s = safrasAVenda18(v);
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].valor).toBeGreaterThan(0);
  });

  it('todo desfecho de vender paga a safra (nenhum "vendeu" sem dinheiro), e o texto diz o valor', () => {
    for (const intencao of ['vista', 'esperar']) for (let k = 0; k < 6; k++) {
      const { v } = comLavoura();
      expect(abrirVenda(v)).toBeTruthy();
      const valor = safrasAVenda18(v).reduce((x, s) => x + s.valor, 0);
      const antes = v.financas.conta;
      const res = resolverSituacao(v, criarRng(100 + k), intencao)!;
      const recebido = v.financas.conta - antes;
      expect(recebido, `${intencao}/${res.desfecho}`).toBeGreaterThan(valor * 0.8);
      expect(recebido).toBeLessThan(valor * 1.2);
      expect(res.texto).toMatch(/R\$/);
      expect(safrasAVenda18(v).length).toBe(0); // vendida: não se vende de novo
    }
  });

  it('o fechamento do ano não conta a safra vendida de novo, e o registro mostra a venda', () => {
    const { v: v0, b } = comLavoura();
    const v = v0;
    abrirVenda(v);
    resolverSituacao(v, criarRng(7), 'vista');
    const p = (v.financas.bens.find(x => x.id === b.id) as Imovel).rural!;
    const vendida = p.safraVendida!;
    expect(vendida).toBeTruthy();
    // Fechamento: o ano da propriedade (o que entrou na conta pelo resultado = receita - custo - o já recebido).
    const depois = limpar(avancarAno(v).vida);
    const p2 = (depois.financas.bens.find(x => x.id === b.id) as Imovel).rural!;
    const reg = p2.historico.find(h => h.ano === vendida.ano)!;
    expect(reg).toBeTruthy();
    const linha = reg.linhas.find(l => l.oque.startsWith('Safra vendida'))!;
    expect(linha.receita).toBe(vendida.receita);
    // As linhas das lavouras ficaram sem receita (a venda é a única receita delas).
    expect(reg.linhas.filter(l => l.nota?.includes('vendida antes')).every(l => l.receita === 0)).toBe(true);
  });

  it('a venda sobrevive a salvar e carregar (sem pagar de novo)', () => {
    const { v } = comLavoura();
    abrirVenda(v);
    resolverSituacao(v, criarRng(3), 'vista');
    const conta = v.financas.conta;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.financas.conta).toBe(conta);
    expect(safrasAVenda18(r.vida).length).toBe(0);
  });
});

describe('VIDA 27 · venda da fazenda inteira', () => {
  it('vender pelo Patrimônio credita o valor e tira a terra, uma vez', () => {
    const { v, b } = comFazenda();
    const antes = v.financas.conta;
    const r = fazer(v, { tipo: 'vender_bem', bemId: b.id });
    expect(r.vida.financas.conta - antes).toBeGreaterThan(b.valor * 0.9);
    expect(r.vida.financas.bens.some(x => x.id === b.id)).toBe(false);
    expect(podeTentar(disponibilidade(r.vida, { tipo: 'vender_bem', bemId: b.id }))).toBe(false);
  });
});
