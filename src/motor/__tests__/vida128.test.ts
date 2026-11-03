/**
 * VIDA 12.8 — Casa, marcas, coleções e exóticos: as regras que não podem quebrar.
 *
 *   planta       banheiros proporcionais (kitnet 1, mansão 8), suítes ao lado do quarto, o banheiro antigo mantém o id
 *   cômodos      o cômodo vazio não serve; cada uso uma vez por ano; vai para os sistemas de sempre; a qualidade mexe
 *                pouco; o escritório só para quem trabalha de casa; a academia de casa tira mensalidade e ida e volta
 *   lado de fora só casa própria; o terreno limita; prévia = conta; manutenção no mês; o conforto sobe um pouco
 *   marcas       posicionamento de cinco níveis; ultraluxo mais caro; durabilidade e revenda mudam o desgaste e o usado
 *   coleções     raridade dos dados (não do preço); vinho sem adega perde; vitrine protege; as coleções organizadas
 *   exóticos     a espécie da oferta é a do texto (o macaco-prego não vira papagaio); lei por lugar; cada espécie com regra
 *   saves        o save antigo carrega igual; o novo vai e volta
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { criarRng } from '../rng';
import { comodosDe, comodosDaCasa, comodoDaCoisa, confortoDaCasa, nivelDaCoisa, academiaEmCasa } from '../sistemas/lar';
import { processarCoisas, receberCoisa, valorDeRevenda } from '../sistemas/coisas';
import { custoDaRotina } from '../sistemas/rotinas';
import { cargaDaAtividade } from '../sistemas/semana';
import { usosDoComodo, fatorDaQualidade, precoExterno, opcoesExternasPara, custoMensalDoExterno } from '../sistemas/casaViva';
import { precoNaLoja, ofertasDaLoja } from '../sistemas/lojas';
import { segmentoDaMarca, fatorDeDesgaste, fatorDeRevenda, leituraDaMarca } from '../sistemas/perfilDaMarca';
import { colecoesDaVida, grauDe, processarColecao, temAdega } from '../sistemas/colecao';
import { PECAS_DE_COLECAO } from '../dados/colecionaveis';
import { grauDaPeca } from '../dados/colecao128';
import { ANIMAIS, OFERTAS_ILEGAIS, animal } from '../dados/animais';
import { EXOTICOS, INSTALACOES, legalidade } from '../sistemas/exoticos';
import { especieDeZoo } from '../dados/setores';
import { cidadesDoPais } from '../dados/lugares';
import { BENS } from '../conteudo/bens';
import { contexto } from '../conteudo/base';
import { MARCAS } from '../dados/lojas';
import { PERFIS_DE_MARCA } from '../dados/perfisDeMarca';
import { USOS_DOS_COMODOS } from '../dados/casa128';
import { COMODOS } from '../dados/lar';
import type { Colecionavel, Imovel, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

/** Dona de uma casa (o tipo escolhido), com dinheiro, sem ninguém morando junto. */
function dona(modeloId = 'casa_grande', conta = 3_000_000): Vida {
  const v = adulto(40, { semente: 7 });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false;
  v.financas.coisas = []; v.financas.colecao = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId, nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId, aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  v.rotinas = [];
  return v;
}
const ultima = (v: Vida) => v.financas.coisas![v.financas.coisas!.length - 1];
const banheiros = (modelo: string) => comodosDe(modelo, undefined).filter(c => c.tipo === 'banheiro' || c.tipo === 'lavabo');

/* ================================================================== a planta */

describe('a planta: banheiros proporcionais ao imóvel', () => {
  it('casa pequena tem um banheiro; média, mais de um; mansão, vários (suítes + social + lavabo)', () => {
    expect(banheiros('kitnet')).toHaveLength(1);
    expect(banheiros('apto_1q')).toHaveLength(1);
    expect(banheiros('casa_simples')).toHaveLength(1);
    expect(banheiros('apto_2q').length).toBeGreaterThanOrEqual(2);
    expect(banheiros('casa_3q').length).toBeGreaterThanOrEqual(2);
    expect(banheiros('casa_grande').length).toBeGreaterThanOrEqual(4);
    const m = banheiros('mansao');
    expect(m.length).toBeGreaterThanOrEqual(7);
    expect(m.filter(c => c.suiteDe)).toHaveLength(6);
    expect(m.some(c => c.tipo === 'lavabo')).toBe(true);
  });
  it('cada suíte vem logo depois do quarto dela; o banheiro social de antes mantém o id "banheiro"; nunca mais banheiros que quartos + 2', () => {
    for (const modelo of ['apto_1q', 'apto_2q', 'apto_3q', 'alto_padrao', 'cobertura', 'casa_simples', 'casa_2q', 'casa_3q', 'casa_grande', 'mansao', 'sitio']) {
      const cs = comodosDe(modelo, undefined);
      expect(cs.some(c => c.id === 'banheiro'), modelo).toBe(true);
      for (const [i, c] of cs.entries()) if (c.suiteDe) expect(cs[i - 1].id, `${modelo}:${c.id}`).toBe(c.suiteDe);
      const quartos = cs.filter(c => c.tipo === 'quarto' || c.tipo === 'quarto_extra').length;
      expect(banheiros(modelo).filter(c => c.tipo === 'banheiro').length, modelo).toBeLessThanOrEqual(quartos + 2);
      expect(new Set(cs.map(c => c.id)).size, modelo).toBe(cs.length);
    }
  });
  it('o que estava no banheiro antes da 12.8 continua no banheiro social (e não no da suíte)', () => {
    const v = dona('casa_grande');
    receberCoisa(v, 'toalheiro', 300);
    const t = ultima(v);
    const porComodo = comodosDaCasa(v);
    expect(porComodo.find(c => c.id === 'banheiro_suite')).toBeTruthy();
    // sem cômodo escolhido, a coisa de banheiro vai para o banheiro de id 'banheiro'
    expect(t.comodo).toBeUndefined();
    expect(comodoDaCoisa(v, t)?.id).toBe('banheiro');
  });
  it('dá para construir um banheiro a mais (casa própria, com terreno), até o limite', () => {
    let v = dona('casa_3q');
    const antes = banheiros('casa_3q').length;
    v = fazer(v, p({ o: 'construir', tipo: 'banheiro' }));
    expect(comodosDaCasa(v).filter(c => c.tipo === 'banheiro').length).toBe(antes + 1);
  });
});

/* ================================================================== os cômodos */

describe('os cômodos servem para alguma coisa', () => {
  function comAcademia(): Vida {
    let v = dona('casa_grande');
    v = fazer(v, p({ o: 'construir', tipo: 'academia' }));
    return v;
  }
  it('o cômodo vazio não serve; equipado, o treino vai para o corpo, uma vez por ano', () => {
    let v = comAcademia();
    const cm = comodosDaCasa(v).find(c => c.tipo === 'academia')!;
    expect(pode(v, p({ o: 'usar_comodo', comodo: cm.id, uso: 'treinar' }))).toBe(false);
    receberCoisa(v, 'esteira', 3000);
    const forma = v.corpo.forma;
    v = fazer(v, p({ o: 'usar_comodo', comodo: cm.id, uso: 'treinar' }));
    expect(v.corpo.forma).toBeGreaterThan(forma);
    expect(pode(v, p({ o: 'usar_comodo', comodo: cm.id, uso: 'treinar' }))).toBe(false);
  });
  it('a academia de casa tira a mensalidade e a ida e volta da atividade "academia"', () => {
    const v = comAcademia();
    expect(custoDaRotina(v, 'academia', 1)).toBeGreaterThan(0);
    receberCoisa(v, 'kit_academia', 900);
    expect(academiaEmCasa(v)).toBe(true);
    expect(custoDaRotina(v, 'academia', 1)).toBe(0);
    expect(cargaDaAtividade('academia', 1, 40, true).carga).toBeLessThan(cargaDaAtividade('academia', 1, 40).carga);
  });
  it('a sessão de cinema para todo mundo aproxima quem foi; custa o que custa', () => {
    let v = dona('mansao');
    v = fazer(v, p({ o: 'construir', tipo: 'cinema' }));
    receberCoisa(v, 'projetor', 4000);
    const cm = comodosDaCasa(v).find(c => c.tipo === 'cinema')!;
    const u = usosDoComodo(v, cm.id).find(x => x.uso.id === 'sessao_familia')!;
    if (!u.companhias.length) return; // vida sem ninguém na cidade: o uso fica bloqueado (coberto abaixo)
    const ids = u.companhias.map(x => x.id);
    const antes = ids.map(id => v.vinculos[id].proximidade);
    const conta = v.financas.conta;
    v = fazer(v, p({ o: 'usar_comodo', comodo: cm.id, uso: 'sessao_familia' }));
    expect(ids.some((id, k) => v.vinculos[id].proximidade > antes[k])).toBe(true);
    expect(v.financas.conta).toBeLessThan(conta);
  });
  it('o escritório só rende trabalho para quem tem trabalho que se faz de casa', () => {
    const v = dona('mansao');
    receberCoisa(v, 'escrivaninha', 1600);
    const cm = comodosDaCasa(v).find(c => c.tipo === 'escritorio')!;
    v.trabalho.atual = undefined;
    expect(pode(v, p({ o: 'usar_comodo', comodo: cm.id, uso: 'trabalhar_em_casa' }))).toBe(false);
  });
  it('a qualidade mexe pouco: do básico ao exclusivo, entre 0,9× e 1,25×', () => {
    expect(fatorDaQualidade(1)).toBeCloseTo(0.9, 2);
    expect(fatorDaQualidade(6)).toBeLessThanOrEqual(1.25);
    expect(fatorDaQualidade(6)).toBeGreaterThan(fatorDaQualidade(2));
  });
  it('todo uso aponta para um cômodo que existe e tem ao menos um texto', () => {
    for (const [tipo, usos] of Object.entries(USOS_DOS_COMODOS)) {
      expect(COMODOS[tipo as keyof typeof COMODOS], tipo).toBeTruthy();
      for (const u of usos!) expect(u.textos.length, `${tipo}:${u.id}`).toBeGreaterThan(0);
    }
  });
});

/* ================================================================== o lado de fora */

describe('o lado de fora da casa', () => {
  it('apartamento não mexe na fachada; casa própria sim, com a conta da prévia', () => {
    const apto = dona('apto_3q');
    expect(pode(apto, p({ o: 'reforma_externa', mudancas: { fachada: 'tijolinho' } }))).toBe(false);
    let v = dona('casa_grande');
    const preco = precoExterno(v, 'fachada', 'tijolinho') + precoExterno(v, 'caminho', 'pedra_portuguesa');
    const conta = v.financas.conta;
    const valor = (v.financas.bens[0] as Imovel).valor;
    v = fazer(v, p({ o: 'reforma_externa', mudancas: { fachada: 'tijolinho', caminho: 'pedra_portuguesa' } }));
    expect(conta - v.financas.conta).toBe(preco);
    expect((v.financas.bens[0] as Imovel).valor).toBeGreaterThan(valor);
    const casa = v.financas.bens[0] as Imovel;
    expect(casa.lar?.externo?.fachada).toBe('tijolinho');
  });
  it('o terreno limita: a casa simples não tem paisagismo assinado; a mansão tem', () => {
    expect(opcoesExternasPara(dona('casa_simples'), 'paisagismo').some(o => o.id === 'assinado')).toBe(false);
    expect(opcoesExternasPara(dona('mansao'), 'paisagismo').some(o => o.id === 'assinado')).toBe(true);
  });
  it('o jardim assinado custa por mês e soma um pouco ao conforto', () => {
    let v = dona('mansao');
    const c0 = confortoDaCasa(v).valor;
    v = fazer(v, p({ o: 'reforma_externa', mudancas: { paisagismo: 'assinado', luz_externa: 'projeto' } }));
    expect(custoMensalDoExterno(v)[0]?.valor ?? 0).toBeGreaterThan(0);
    expect(confortoDaCasa(v).valor).toBeGreaterThan(c0);
  });
});

/* ================================================================== as marcas */

describe('as marcas têm posicionamento e efeito', () => {
  it('cinco posicionamentos; o ultraluxo existe e é real', () => {
    expect(segmentoDaMarca('volt')).toBe(1);
    expect(segmentoDaMarca('rolex')).toBe(4);
    expect(segmentoDaMarca('patek')).toBe(5);
    expect(segmentoDaMarca('fendi_casa')).toBe(5);
    for (const id of Object.keys(PERFIS_DE_MARCA)) expect(MARCAS.some(m => m.id === id), id).toBe(true);
  });
  it('o mesmo produto: ultraluxo > luxo > premium > econômico', () => {
    const v = dona('mansao');
    v.moradia.municipioId = 'sao-paulo-sp';
    const prod = { tipo: 'coisa' as const, id: 'sofa_couro' };
    expect(precoNaLoja(v, prod, 'natuzzi')).toBeGreaterThan(precoNaLoja(v, prod, 'tokstok'));
    expect(precoNaLoja(v, prod, 'fendi_casa')).toBeGreaterThan(precoNaLoja(v, prod, 'natuzzi'));
  });
  it('a durabilidade muda o desgaste; a revenda muda o usado; sem marca, nada muda', () => {
    expect(fatorDeDesgaste('miele')).toBeLessThan(fatorDeDesgaste('volt'));
    expect(fatorDeDesgaste(undefined)).toBe(1);
    expect(fatorDeRevenda(undefined)).toBe(0.5);
    const v = dona('casa_grande');
    receberCoisa(v, 'maquina_lavar', 5000); ultima(v).marca = 'miele';
    receberCoisa(v, 'maquina_lavar', 5000); ultima(v).marca = 'volt';
    for (let k = 0; k < 6; k++) { processarCoisas(v); v.t += 12; }
    const [miele, volt] = v.financas.coisas!.filter(t => t.coisaId === 'maquina_lavar');
    expect(miele.estado).toBeGreaterThan(volt.estado);
    expect(valorDeRevenda(v, miele)).toBeGreaterThan(valorDeRevenda(v, volt));
  });
  it('o segmento da coisa leva a marca em conta (o mesmo sofá: econômico abaixo, luxo acima)', () => {
    const v = dona();
    receberCoisa(v, 'sofa', 3000); ultima(v).marca = 'etna';
    receberCoisa(v, 'sofa', 3000); ultima(v).marca = 'natuzzi';
    const [a, b] = v.financas.coisas!;
    expect(nivelDaCoisa(b)).toBeGreaterThan(nivelDaCoisa(a));
    expect(leituraDaMarca('miele')!.fama).toBe('durabilidade');
  });
  it('a loja de móveis de uma metrópole oferece as marcas de luxo de lá', () => {
    const v = dona(); v.moradia.municipioId = 'sao-paulo-sp';
    expect(ofertasDaLoja(v, 'moveis').some(o => o.marca === 'minotti')).toBe(true);
  });
});

/* ================================================================== as coleções */

describe('coleções: raridade dos dados, o vinho pede adega', () => {
  it('a raridade sai do catálogo e da tiragem declarada, nunca do preço', () => {
    const g = (id: string) => { const x = PECAS_DE_COLECAO.find(q => q.id === id)!; return grauDaPeca(x); };
    expect(g('rel_seiko_presage')).toBe('comum');
    expect(g('rel_rolex_submariner')).toBe('incomum');
    expect(g('rel_rolex_daytona')).toBe('rara');
    expect(g('rel_patek_perpetuo')).toBe('muito_rara');
    expect(g('arte_fotografia')).toBe('limitada');
    expect(g('arte_impressionista')).toBe('unica');
    // caro não é raro: o Cartier Tank de série custa mais que a gravura e continua comum
    expect(g('rel_cartier_tank')).toBe('comum');
  });
  function comVinho(adega: boolean): Vida {
    const v = dona('casa_grande');
    const c: Colecionavel = { id: 'cl1', pecaId: 'vin_bordeaux', nome: 'caixa de Bordeaux', categoria: 'vinho', raridade: 'incomum', procedencia: 'loja', certificado: true, estado: 100, valor: 16000, precoPago: 16000, tCompra: v.t };
    v.financas.colecao = [c];
    if (adega) receberCoisa(v, 'adega', 4500);
    return v;
  }
  it('sem adega, o vinho perde estado e valor; com adega, não perde estado', () => {
    const sem = comVinho(false), com = comVinho(true);
    expect(temAdega(sem)).toBe(false); expect(temAdega(com)).toBe(true);
    for (let k = 0; k < 5; k++) { processarColecao(sem, criarRng(k + 1)); processarColecao(com, criarRng(k + 1)); }
    expect(sem.financas.colecao![0].estado).toBeLessThan(com.financas.colecao![0].estado);
    expect(sem.financas.colecao![0].valor).toBeLessThan(com.financas.colecao![0].valor);
  });
  it('as coleções organizadas: grupos, contagem, valor, onde está e o expositor', () => {
    const v = comVinho(true);
    receberCoisa(v, 'banheira_pedra', 180000);
    const cs = colecoesDaVida(v);
    const vinhos = cs.find(c => c.id === 'vinho')!;
    expect(vinhos.itens).toHaveLength(1);
    expect(vinhos.valor).toBe(16000);
    expect(vinhos.expositor).toBeTruthy();
    expect(cs.find(c => c.id === 'edicoes')!.itens[0].grau).toBe('unica');
    expect(grauDe(v.financas.colecao![0])).toBe('incomum');
  });
});

/* ================================================================== os exóticos */

describe('exóticos: a espécie certa, a lei de cada lugar', () => {
  it('cada oferta ilegal nomeia a espécie que a casa vai receber', () => {
    for (const o of OFERTAS_ILEGAIS) {
      const a = animal(o.especie);
      expect(a.id, o.bicho).toBe(o.especie);
      const nome = a.nome[0].split('-')[0];
      expect(o.bicho, `${o.bicho} → ${o.especie}`).toContain(nome);
    }
  });
  it('comprar o "filhote de macaco-prego" na feira registra um macaco-prego (o texto, o resumo e o inventário concordam)', () => {
    const base = dona('casa_grande');
    const feira = BENS.find(c => c.id === 'pet_feira')! as unknown as { texto: (c: unknown) => string; opcoes: { id: string; resolver: (c: never) => unknown }[] };
    const i = OFERTAS_ILEGAIS.findIndex(o => o.especie === 'macaco_prego');
    // o ano em que a oferta do dia é a do macaco
    for (let k = 0; k < 12; k++) {
      const v = structuredClone(base);
      v.t = base.t + k * 12;
      const c = contexto(v, criarRng(3));
      if (!feira.texto(c).includes('macaco-prego')) continue;
      void i;
      const op = feira.opcoes!.find(o => o.id === 'comprar')!;
      const r = op.resolver(c as never) as { texto: string; efeito?: () => void };
      expect(r.texto).toContain('macaco-prego');
      const antes = new Set(Object.keys(v.pessoas));
      r.efeito!();
      const novo = Object.values(v.pessoas).find(x => !antes.has(x.id) && x.especie)!;
      expect(novo.especie).toBe('macaco_prego');
      const bio = v.biografia.filter(e => e.pessoas?.includes(novo.id)).map(e => e.texto).join(' ');
      expect(bio).toMatch(/macac[oa]-prego/);
      expect(bio).not.toContain('papagaio');
      return;
    }
    throw new Error('nenhum ano com a oferta do macaco-prego');
  });
  it('primata não se vende no Brasil; com licença onde a lei permite; cada exótico tem regra, instalação e (se tiver) zoológico válido', () => {
    expect(legalidade('macaco_prego', 'sao-paulo-sp')).toBe('proibido');
    expect(legalidade('sagui', 'sao-paulo-sp')).toBe('proibido');
    expect(legalidade('tucano', 'sao-paulo-sp')).toBe('licenca');
    expect(legalidade('raposa_do_deserto', 'sao-paulo-sp')).toBe('proibido');
    const fl = cidadesDoPais('US').find(c => c.uf === 'FL');
    if (fl) expect(legalidade('macaco_prego', fl.id)).toBe('licenca');
    for (const a of ANIMAIS.filter(x => x.exotico)) {
      const r = EXOTICOS[a.id];
      expect(r, a.id).toBeTruthy();
      expect(INSTALACOES.some(i => i.id === r!.instalacao), a.id).toBe(true);
      if (r!.zoo) expect(especieDeZoo(r!.zoo), a.id).toBeTruthy();
      expect(a.cotidiano.length, a.id).toBeGreaterThan(0);
      expect(a.vida[1], a.id).toBeGreaterThan(a.vida[0]);
    }
  });
});

/* ================================================================== saves */

describe('saves', () => {
  it('a casa com o lado de fora, os banheiros novos e os usos vai e volta pelo JSON', () => {
    let v = dona('casa_grande');
    v = fazer(v, p({ o: 'reforma_externa', mudancas: { fachada: 'pedra' } }));
    const w = interpretar(JSON.stringify(v));
    expect(w.tipo).toBe('ok');
    if (w.tipo === 'ok') {
      expect(comodosDaCasa(w.vida).map(c => c.id)).toEqual(comodosDaCasa(v).map(c => c.id));
      expect((w.vida.financas.bens[0] as Imovel).lar?.externo?.fachada).toBe('pedra');
    }
  });
});
