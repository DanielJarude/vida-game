/**
 * 12.4.1 — Expansão da vida personalizada: as regras que não podem quebrar.
 *
 *   casa        "deixar com a sua cara" saiu da lista; a reforma conserta e renova (estado e valor), sem mexer nos acabamentos.
 *   casamento   ao ar livre pede o lugar (sítio, jardim, praia) e a frase final diz só o escolhido; plano antigo continua.
 *   atividades  a idade cobra uma vez por ano (não a cada prática); o adulto amador aprende devagar, mas aprende; a
 *               equipe de natação não é mais barata que a aula; o projeto social não cobra da casa.
 *   lojas       o mercado do país decide as lojas e as marcas; a loja só vende o que oferece; marca e loja ficam no
 *               objeto; o preço cobrado é o mostrado.
 *   aparência   o corpo vem do que o jogo já sabe; brincos e corrente juntos; a peça de cima vai para o retrato.
 *   dinheiro    comprar imóvel desconta o pago e diz o que sobrou; o imóvel vira patrimônio, não saldo.
 *   eventos     cada fase tem os seus; os da vida adulta só aparecem na trajetória certa.
 *   saves       o save antigo carrega; o novo persiste.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { criarRng } from '../rng';
import { USOS_CASA } from '../sistemas/usos';
import { CENARIOS_AR_LIVRE, ondeFoi, rotuloDoLocal } from '../sistemas/casamento';
import { estaNoivo, ficarNoivos } from '../sistemas/romance';
import { garantirFrente, praticar } from '../sistemas/frentes';
import { custoDaRotina, modeloRotina } from '../sistemas/rotinas';
import { lojasDaVida, mercadoDoPais, ofertasDaLoja, precoNaLoja } from '../sistemas/lojas';
import { tipoDeCorpo } from '../sistemas/silhueta';
import { disponivel, patrimonio } from '../sistemas/dinheiro';
import { ofertasDeImoveis } from '../sistemas/mercado';
import { cidadesDoPais } from '../dados/lugares';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { ITENS_ESTILO } from '../dados/estilo';
import { ESTABELECIMENTOS, MARCAS } from '../dados/lojas';
import type { Imovel, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a); };
const roma = () => cidadesDoPais('IT').find(m => m.nome === 'Roma')!.id;

function dona(conta = 500_000): Vida {
  const v = adulto(40, { semente: 7 });
  v.financas.conta = conta; v.financas.dividas = []; v.financas.coisas = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 400000, tCompra: v.t - 120, municipioId: v.moradia.municipioId, estado: 55 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 3, tInicio: v.t - 120 };
  return v;
}

describe('a casa', () => {
  it('"deixar com a sua cara" saiu da lista; a reforma ficou, com função própria', () => {
    expect(USOS_CASA).not.toContain('decorar');
    expect(USOS_CASA).toContain('reformar');
    const v = dona();
    const r = fazer(v, { tipo: 'usar_casa', oque: 'reformar' });
    const b = r.vida.financas.bens[0] as Imovel;
    expect(b.estado).toBeGreaterThan(55);
    expect(b.valor).toBeGreaterThan(400000);
    expect(b.lar?.acabamentos ?? {}).toEqual({});
  });
});

describe('o casamento', () => {
  function noivos(): { v: Vida; id: string } {
    const v = adulto(30, { semente: 11 });
    v.financas.conta = 400000;
    const { p, vin } = comParceiro(v, { estagio: 'morando_junto', anos: 3 });
    ficarNoivos(v, vin);
    v.fatos[`noivado_${p.id}`] = v.t - 13;
    vin.romance!.noivado!.t = v.t - 13;
    return { v, id: p.id };
  }
  it('ao ar livre pede o lugar; a frase diz só o escolhido (nunca a lista)', () => {
    const { v, id } = noivos();
    expect(estaNoivo(v, v.vinculos[id])).toBe(true);
    const base = { local: 'ar_livre' as const, cerimonia: 'simbolica' as const, convidados: 400, estilo: 'classico' as const, luaDeMel: false };
    expect(disponibilidade(v, { tipo: 'casamento', pessoaId: id, op: 'planejar', plano: base }).grau).toBe('requisito');
    const v2 = fazer(v, { tipo: 'casamento', pessoaId: id, op: 'planejar', plano: { ...base, cenario: 'jardim' } }).vida;
    const r = executar(v2, { tipo: 'casamento', pessoaId: id, op: 'celebrar' });
    expect(r.resultado).toMatch(/Casaram-se ao ar livre, em um jardim, numa cerimônia simbólica, com celebrante, com 400 convidados/);
    expect(r.resultado).not.toMatch(/sítio|praia|\(/);
    expect(JSON.stringify(r.vida.biografia ?? [])).not.toMatch(/um sítio, um jardim, a praia/);
  });
  it('os textos: só o lugar escolhido; plano antigo (sem cenário) diz "ao ar livre"', () => {
    expect(ondeFoi({ local: 'ar_livre', cenario: 'praia' })).toBe('ao ar livre, na praia');
    expect(rotuloDoLocal({ local: 'ar_livre', cenario: 'sitio' })).toBe('Ao ar livre, num sítio');
    expect(ondeFoi({ local: 'ar_livre' })).toBe('ao ar livre');
    expect(Object.keys(CENARIOS_AR_LIVRE)).toEqual(['sitio', 'jardim', 'praia']);
  });
});

describe('natação e futebol', () => {
  it('a idade cobra uma vez por ano: praticar duas vezes no mesmo ano não tira em dobro', () => {
    const v = adulto(42, { semente: 3 });
    const f = garantirFrente(v, 'futebol'); f.habilidade = 60; f.auge = 60;
    const r = criarRng(1);
    praticar(v, r, 'futebol', 1);
    const depois1 = f.habilidade;
    praticar(v, r, 'futebol', 0.3);
    expect(f.habilidade).toBeGreaterThanOrEqual(depois1 - 0.01);
  });
  it('o adulto amador que pratica natação aprende (antes ia a zero em dez anos)', () => {
    const v = adulto(30, { semente: 5 });
    const f = garantirFrente(v, 'natacao'); f.habilidade = 8; f.auge = 8;
    const r = criarRng(2);
    for (let k = 0; k < 10; k++) { v.t += 12; praticar(v, r, 'natacao', 1, 1); }
    expect(f.habilidade).toBeGreaterThan(8);
  });
  it('a equipe de natação custa mais que a aula (subir de degrau não "alivia")', () => {
    const m = modeloRotina('natacao')!;
    expect(m.niveis[1].custo).toBeGreaterThan(m.niveis[0].custo);
    const v = adulto(30);
    expect(custoDaRotina(v, 'natacao', 2)).toBeGreaterThan(custoDaRotina(v, 'natacao', 1));
  });
});

describe('as lojas', () => {
  it('o mercado do país decide: Brasil tem Renner e Magalu; Itália tem Coin e não tem Hering', () => {
    expect(mercadoDoPais('BR')).toBe('BR');
    expect(mercadoDoPais('IT')).toBe('EU');
    expect(mercadoDoPais('US')).toBe('NA');
    const br = adulto(30, { municipioId: 'sao-paulo-sp' });
    const it = adulto(30, { municipioId: roma() });
    const lojasBr = lojasDaVida(br).map(e => e.id), lojasIt = lojasDaVida(it).map(e => e.id);
    expect(lojasBr).toEqual(expect.arrayContaining(['renner', 'magalu', 'mercadolivre']));
    expect(lojasIt).toEqual(expect.arrayContaining(['coin', 'zalando']));
    expect(lojasIt).not.toContain('renner');
    expect(ofertasDaLoja(it, 'roupas').some(o => o.marca === 'hering')).toBe(false);
    expect(ofertasDaLoja(br, 'roupas').some(o => o.marca === 'hering')).toBe(true);
  });
  it('a loja só vende o que oferece; marca e loja ficam na peça; o preço cobrado é o mostrado', () => {
    const v = adulto(30, { municipioId: roma() });
    v.financas.conta = 50000;
    expect(pode(v, { tipo: 'comprar_item', itemId: 'jeans', marca: 'hering', loja: 'roupas' })).toBe(false);
    const o = ofertasDaLoja(v, 'roupas').find(x => x.produto.id === 'jeans' && x.marca === 'levis')!;
    const antes = v.financas.conta;
    const r = fazer(v, { tipo: 'comprar_item', itemId: 'jeans', marca: 'levis', loja: 'roupas' });
    const it = r.vida.eu.estilo!.itens.find(x => x.itemId === 'jeans')!;
    expect(it.marca).toBe('levis');
    expect(it.loja).toBe('roupas');
    expect(antes - r.vida.financas.conta).toBe(o.preco);
    expect(r.aviso?.texto).toMatch(/Levi's/);
  });
  it('pela internet sai mais caro, e a marca de fora vem importada', () => {
    const v = adulto(30, { municipioId: roma() });
    const p = { tipo: 'coisa' as const, id: 'sofa' };
    expect(precoNaLoja(v, p, 'tokstok', 'amazon')).toBeGreaterThan(precoNaLoja(v, p, 'tokstok'));
    expect(ofertasDaLoja(v, 'amazon').find(o => o.marca === 'tokstok')?.importado).toBe(true);
  });
  it('o catálogo: toda peça de vestir é vendida em alguma loja do Brasil e da Itália; toda loja e marca é válida', () => {
    for (const mun of ['sao-paulo-sp', roma()]) {
      const v = adulto(30, { municipioId: mun });
      const vendidos = new Set(lojasDaVida(v).flatMap(e => ofertasDaLoja(v, e.id).map(o => o.produto.id)));
      for (const it of ITENS_ESTILO) expect(vendidos.has(it.id), `${it.id} em ${mun}`).toBe(true);
    }
    expect(new Set(MARCAS.map(m => m.id)).size).toBe(MARCAS.length);
    expect(new Set(ESTABELECIMENTOS.map(e => e.id)).size).toBe(ESTABELECIMENTOS.length);
  });
});

describe('a aparência', () => {
  it('o corpo vem do condicionamento, dos hábitos e do que se pratica — e muda com a vida', () => {
    const v = adulto(30, { semente: 2 });
    v.rotinas = []; v.corpo.habitos.sedentario = true; v.corpo.forma = 25;
    expect(tipoDeCorpo(v)).toBe('acima_do_peso');
    v.corpo.habitos.sedentario = false; v.corpo.forma = 80; v.rotinas = [{ id: 'academia', tInicio: v.t - 48, nivel: 2 }];
    expect(tipoDeCorpo(v)).toBe('musculoso');
  });
  it('a corrente e os brincos vão juntos; a peça de cima vai para o retrato', () => {
    const v = adulto(25, { semente: 4, genero: 'feminino' });
    v.financas.conta = 20000;
    let x = fazer(v, { tipo: 'comprar_item', itemId: 'corrente_prata' }).vida;
    x = fazer(x, { tipo: 'comprar_item', itemId: 'brincos' }).vida;
    expect(x.eu.estilo!.itens.filter(i => i.usando).map(i => i.itemId)).toEqual(expect.arrayContaining(['corrente_prata', 'brincos']));
    expect(x.eu.visual.joia).toBe('corrente');
    expect(x.eu.visual.brincos).toBe(true);
    x = fazer(x, { tipo: 'comprar_item', itemId: 'camisa_polo' }).vida;
    expect(x.eu.visual.superior).toMatch(/^camisa_polo#/);
    x = fazer(x, { tipo: 'comprar_item', itemId: 'blazer' }).vida;
    expect(x.eu.visual.superior).toMatch(/^blazer#/);
    // A peça trocada continua sua, guardada.
    x = fazer(x, { tipo: 'comprar_item', itemId: 'camiseta_lisa' }).vida;
    expect(x.eu.estilo!.itens.find(i => i.itemId === 'camisa_polo')!.usando).toBe(false);
  });
});

describe('o dinheiro do imóvel', () => {
  it('comprar a casa desconta o pago e diz o que sobrou; o imóvel vira patrimônio', () => {
    const v = adulto(35, { municipioId: roma() });
    v.financas.conta = 275000;
    const o = ofertasDeImoveis(v, 'venda').filter(x => x.preco < 260000).sort((a, b) => b.preco - a.preco)[0];
    const p0 = patrimonio(v);
    const r = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: true });
    expect(disponivel(r.vida)).toBeLessThan(275000 - o.preco + 1);
    expect(r.vida.financas.bens.some(b => b.tipo === 'imovel')).toBe(true);
    expect(patrimonio(r.vida)).toBeGreaterThan(p0 * 0.9);
    expect(r.aviso?.texto).toMatch(/para gastar ficaram/);
  });
});

describe('os eventos por fase', () => {
  it('cada fase tem os seus: um da infância, três da adolescência, o fluxo adulto', () => {
    for (const id of ['inf1241_feira_de_ciencias', 'ado1241_intercambio', 'ado1241_banda', 'ado1241_viagem_amigos', 'adu1241_ninho_vazio', 'adu1241_dez_anos_casados', 'adu1241_filho_entrada', 'adu1241_goteira', 'adu1241_mesmo_emprego', 'adu1241_cidade_nova']) expect(conteudoPorId(id), id).toBeTruthy();
    expect(conteudoPorId('inf1241_feira_de_ciencias')!.idade).toEqual([8, 11]);
    expect(conteudoPorId('ado1241_intercambio')!.idade[0]).toBeGreaterThanOrEqual(13);
  });
  it('o da vida adulta só aparece na trajetória certa: a goteira pede casa própria velha; o filho que pede ajuda, filho adulto fora e dinheiro', () => {
    const r = criarRng(1);
    const goteira = conteudoPorId('adu1241_goteira')!;
    const v = dona();
    expect(preparar(goteira, v, r)).toBeTruthy();
    (v.financas.bens[0] as Imovel).estado = 95;
    expect(preparar(goteira, v, r)).toBeFalsy();
    const pede = conteudoPorId('adu1241_filho_entrada')!;
    const w = adulto(55, { semente: 9 });
    w.financas.conta = 10;
    comFilho(w, 28, { casa: false });
    expect(preparar(pede, w, r)).toBeFalsy();
    w.financas.conta = 500000;
    expect(preparar(pede, w, r)).toBeTruthy();
  });
});

describe('saves', () => {
  it('o save antigo carrega; marca, loja, cenário e o visual novo persistem', () => {
    const v = adulto(30, { municipioId: 'sao-paulo-sp' });
    v.financas.conta = 100000;
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
    let x = fazer(v, { tipo: 'comprar_item', itemId: 'jeans', marca: 'levis', loja: 'roupas' }).vida;
    x = fazer(x, { tipo: 'comprar_coisa', coisaId: 'sofa', marca: 'tokstok', loja: 'moveis' }).vida;
    const r = interpretar(JSON.stringify(x));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.eu.estilo!.itens[0].marca).toBe('levis');
    expect(r.vida.financas.coisas!.find(c => c.coisaId === 'sofa')!.marca).toBe('tokstok');
    expect(r.vida.eu.visual.superior).toBe(x.eu.visual.superior);
  });
});
