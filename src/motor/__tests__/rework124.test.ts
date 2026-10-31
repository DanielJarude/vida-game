/**
 * REWORK 12.4 — Vida personalizada: as regras que não podem quebrar.
 *
 *   casa        a planta difere por tipo (kitnet ≠ mansão); o conforto sai do que tem dentro, não do saldo; obra só em
 *               casa própria e com terreno; aluguel só mexe na superfície; o cômodo vazio não ajuda a prática.
 *   objetos     um lugar só (mover não duplica nem apaga); imóvel vendido devolve o que estava nele; emprestado volta
 *               quando a pessoa morre; guardado não ajuda; o que tem história vira lembrança ao quebrar.
 *   veículos    estético ≠ funcional; a preparação aumenta o desgaste e tira valor; nenhuma peça dá lucro.
 *   herança     a peça de família passa em espécie (com a história) a quem continua; os acessórios e os objetos com
 *               história também; nada se duplica.
 *   roupa       uma peça por parte do corpo; a ocasião; a entrevista formal.
 *   gostos      nunca leem classe nem lugar; mudam com a vida; o programa custa; a obra vira peça sua.
 *   saves       o save antigo carrega igual; tudo persiste (JSON de ida e volta).
 */
import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar, VERSAO_SAVE } from '../save';
import { criarRng } from '../rng';
import { comodosDe, comodosDaCasa, confortoDaCasa, bonusDosComodos, terrenoLivre } from '../sistemas/lar';
import { bonusDaAtividade, processarCoisas, receberCoisa } from '../sistemas/coisas';
import { custosDaPersonalizacao, normalizarLocais, processarPersonalizacao } from '../sistemas/personalizacao';
import { afetoDe } from '../sistemas/memoriaDosObjetos';
import { processarVeiculos, valorDeMercadoDoVeiculo } from '../sistemas/veiculos';
import { efeitoDasMods, PECAS_POR_CATEGORIA } from '../dados/personalizacaoVeiculo';
import { continuarComo, inventario, partilhar } from '../sistemas/sucessao';
import { calcularHeranca } from '../sistemas/partilha';
import { gostosDe, preferidosDaPessoa, processarGostos } from '../sistemas/gostos';
import { adequacaoDaRoupa, ITENS_ESTILO, lugaresDoItem } from '../dados/estilo';
import { COISAS } from '../dados/coisas';
import { usosDaCoisa } from '../dados/pertences';
import type { Colecionavel, Imovel, Veiculo, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

/** Dona de uma casa (o tipo escolhido), com dinheiro, sem ninguém morando junto. */
function dona(modeloId = 'casa_grande', conta = 2_000_000): Vida {
  const v = adulto(40, { semente: 7 });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false;
  v.financas.coisas = []; v.financas.colecao = [];
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId, nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId, aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  return v;
}

describe('a casa por dentro', () => {
  it('a planta muda com o tipo: kitnet é um cômodo só; a mansão tem piscina, jardim e escritório', () => {
    const kit = comodosDe('kitnet', undefined).map(c => c.tipo);
    const man = comodosDe('mansao', undefined).map(c => c.tipo);
    expect(kit).toEqual(['quarto', 'banheiro']);
    expect(man).toEqual(expect.arrayContaining(['piscina', 'jardim', 'escritorio', 'lazer', 'garagem']));
    expect(man.filter(t => t === 'quarto_extra').length).toBe(5);
    expect(terrenoLivre('apto_2q', undefined)).toBe(0);
    expect(terrenoLivre('mansao', undefined)).toBeGreaterThan(terrenoLivre('casa_3q', undefined));
  });

  it('ficar rico não mobilia a casa: o conforto sai do que tem dentro', () => {
    const pobre = dona('apto_2q', 1000);
    const rico = dona('apto_2q', 50_000_000);
    expect(confortoDaCasa(rico).valor).toBe(confortoDaCasa(pobre).valor);
    receberCoisa(rico, 'colchao', 3000); receberCoisa(rico, 'sofa', 3500); receberCoisa(rico, 'mesa_jantar', 2600);
    expect(confortoDaCasa(rico).valor).toBeGreaterThan(confortoDaCasa(pobre).valor);
  });

  it('acabamento custa, fica na casa e muda o conforto; aluguel não troca o piso', () => {
    let v = dona('casa_3q');
    const antes = confortoDaCasa(v).valor;
    const conta = v.financas.conta;
    v = fazer(v, p({ o: 'acabamento', comodo: 'sala', aspecto: 'piso', opcao: 'madeira' }));
    v = fazer(v, p({ o: 'acabamento', comodo: 'sala', aspecto: 'parede', opcao: 'verde_oliva' }));
    expect(v.financas.conta).toBeLessThan(conta);
    expect((v.financas.bens[0] as Imovel).lar!.acabamentos.sala).toEqual({ piso: 'madeira', parede: 'verde_oliva' });
    expect(confortoDaCasa(v).valor).toBeGreaterThan(antes);
    const inquilina = adulto(30);
    inquilina.financas.conta = 100000;
    expect(pode(inquilina, p({ o: 'acabamento', comodo: 'sala', aspecto: 'piso', opcao: 'madeira' }))).toBe(false);
    expect(pode(inquilina, p({ o: 'acabamento', comodo: 'sala', aspecto: 'parede', opcao: 'terracota' }))).toBe(true);
    expect(pode(inquilina, p({ o: 'construir', tipo: 'piscina' }))).toBe(false);
  });

  it('obra: só com terreno; valoriza menos do que custa; a piscina tem custo de mês', () => {
    let v = dona('casa_grande');
    const valor = (v.financas.bens[0] as Imovel).valor;
    const conta = v.financas.conta;
    v = fazer(v, p({ o: 'construir', tipo: 'piscina' }));
    const gasto = conta - v.financas.conta;
    const im = v.financas.bens[0] as Imovel;
    expect(im.valor - valor).toBeLessThan(gasto);
    expect(comodosDaCasa(v).some(c => c.tipo === 'piscina')).toBe(true);
    expect(custosDaPersonalizacao(v).some(l => /piscina/.test(l.rotulo))).toBe(true);
    expect(pode(v, p({ o: 'construir', tipo: 'piscina' }))).toBe(false);
    const apto = dona('apto_3q');
    expect(pode(apto, p({ o: 'construir', tipo: 'academia' }))).toBe(false);
  });

  it('o estúdio vazio é só um quarto: ajuda a prática quando tem instrumento dentro', () => {
    let v = dona('casa_3q');
    v = fazer(v, p({ o: 'converter', comodo: 'quarto2', tipo: 'estudio' }));
    expect(bonusDosComodos(v, 'musica')).toBe(0);
    receberCoisa(v, 'violao', 900);
    const t = v.financas.coisas!.find(x => x.coisaId === 'violao')!;
    expect(bonusDosComodos(v, 'musica')).toBeGreaterThan(0);
    // O violão guardado no depósito não toca (nem no estúdio, nem fora dele).
    t.local = `dep:${v.moradia.municipioId}`;
    expect(bonusDaAtividade(v, 'musica')).toBe(0);
  });

  it('o quarto de alguém não vira estúdio', () => {
    const v = dona('casa_2q');
    comFilho(v, 8); comFilho(v, 10); comFilho(v, 12);
    expect(pode(v, p({ o: 'converter', comodo: 'quarto2', tipo: 'estudio' }))).toBe(false);
  });
});

describe('cada objeto tem um lugar', () => {
  it('mover troca o lugar (não copia), cobra o frete do que pesa e volta para casa quando o imóvel é vendido', () => {
    let v = dona('casa_grande');
    const sitio: Imovel = { id: 'isitio', tipo: 'imovel', modeloId: 'sitio', nome: 'sítio', valor: 300000, tCompra: v.t - 12, municipioId: v.moradia.municipioId, estado: 80 };
    v.financas.bens.push(sitio);
    receberCoisa(v, 'piano', 30000);
    const id = v.financas.coisas![0].id;
    const conta = v.financas.conta;
    v = fazer(v, p({ o: 'mover', ref: { tipo: 'coisa', id }, para: 'im:isitio' }));
    expect(v.financas.coisas!.filter(x => x.id === id).length).toBe(1);
    expect(v.financas.coisas![0].local).toBe('im:isitio');
    expect(v.financas.conta).toBeLessThan(conta);
    v = fazer(v, { tipo: 'vender_bem', bemId: 'isitio' });
    expect(v.financas.coisas!.length).toBe(1);
    expect(v.financas.coisas![0].local).toBeUndefined();
    expect(v.financas.coisas![0].historia!.some(h => /deixou de ser seu/.test(h.texto))).toBe(true);
  });

  it('depósito e cofre custam por mês; o cofre só aceita o que é pequeno', () => {
    let v = dona('apto_2q');
    receberCoisa(v, 'sofa', 3500);
    v.eu.estilo = { itens: [{ id: 'e1', itemId: 'relogio_luxo', t: v.t, preco: 24000, usando: false }] };
    const sofa = v.financas.coisas![0].id;
    expect(pode(v, p({ o: 'mover', ref: { tipo: 'coisa', id: sofa }, para: `cofre:${v.moradia.municipioId}` }))).toBe(false);
    v = fazer(v, p({ o: 'mover', ref: { tipo: 'coisa', id: sofa }, para: `dep:${v.moradia.municipioId}` }));
    v = fazer(v, p({ o: 'mover', ref: { tipo: 'estilo', id: 'e1' }, para: `cofre:${v.moradia.municipioId}` }));
    const custos = custosDaPersonalizacao(v).map(l => l.rotulo).join(' | ');
    expect(custos).toMatch(/Depósito/);
    expect(custos).toMatch(/Cofre/);
  });

  it('emprestado segue seu; volta quando a pessoa morre; dar tira da sua vida e entra na lembrança dela', () => {
    let v = dona('apto_2q');
    const { p: par } = comParceiro(v, { idade: 40, estagio: 'namoro' });
    par.municipioId = v.moradia.municipioId;
    receberCoisa(v, 'violao', 900);
    receberCoisa(v, 'camera', 7000);
    const [violao, camera] = v.financas.coisas!.map(x => x.id);
    v = fazer(v, p({ o: 'emprestar', coisa: violao, pessoaId: par.id }));
    expect(v.financas.coisas!.find(x => x.id === violao)!.emprestadaA).toBe(par.id);
    v.pessoas[par.id].vivo = false;
    normalizarLocais(v);
    expect(v.financas.coisas!.find(x => x.id === violao)!.emprestadaA).toBeUndefined();
    v.pessoas[par.id].vivo = true;
    v = fazer(v, p({ o: 'doar', ref: { tipo: 'coisa', id: camera }, pessoaId: par.id }));
    expect(v.financas.coisas!.some(x => x.id === camera)).toBe(false);
    expect(v.pessoas[par.id].ganhou!.some(g => g.coisaId === 'camera')).toBe(true);
  });

  it('nada em dobro: um save com o mesmo objeto duas vezes fica com um', () => {
    const v = dona('apto_2q');
    receberCoisa(v, 'tv', 3500);
    v.financas.coisas!.push(structuredClone(v.financas.coisas![0]));
    normalizarLocais(v);
    expect(v.financas.coisas!.length).toBe(1);
  });

  it('o que tem história vira lembrança quando para de funcionar (e não ajuda mais)', () => {
    const v = dona('apto_2q');
    const t = receberCoisa(v, 'violao', 900);
    t.memoria = { origem: 'heranca', de: 'Vó Lurdes', afeto: 60 };
    t.estado = 1;
    for (let k = 0; k < 3; k++) { v.t += 12; processarCoisas(v); }
    const ainda = v.financas.coisas!.find(x => x.id === t.id)!;
    expect(ainda.lembranca).toBe(true);
    expect(bonusDaAtividade(v, 'musica')).toBe(0);
    expect(afetoDe(v, ainda)).toBeGreaterThanOrEqual(60);
  });
});

describe('veículos personalizados', () => {
  function comCarro(): Vida {
    const v = dona('casa_3q');
    v.trabalho.licencas.push('cnh');
    const b: Veiculo = { id: 'vc', tipo: 'veiculo', modeloId: 'carro_sedan', nome: 'sedã', valor: 140000, tCompra: v.t, estado: 100, anoFabricacao: Math.floor(v.t / 12) + 2026 };
    v.financas.bens.push(b);
    return v;
  }
  it('cada categoria tem as suas peças (o barco não troca de roda; o avião não ganha escapamento)', () => {
    const ids = (c: keyof typeof PECAS_POR_CATEGORIA) => PECAS_POR_CATEGORIA[c].map(x => x.id);
    expect(ids('embarcacao')).not.toContain('rodas');
    expect(ids('aeronave')).not.toContain('escape');
    expect(ids('carro')).toEqual(expect.arrayContaining(['pintura', 'rodas', 'interior', 'pneus', 'motor']));
    for (const lista of Object.values(PECAS_POR_CATEGORIA)) expect(new Set(lista.map(x => x.tipo))).toEqual(new Set(['estetica', 'funcional']));
  });
  it('a preparação de motor anda mais e quebra mais; o pneu bom cuida; nenhuma peça dá lucro', () => {
    let v = comCarro();
    const valor = valorDeMercadoDoVeiculo(v, v.financas.bens[1] as Veiculo);
    const conta = v.financas.conta;
    v = fazer(v, p({ o: 'veiculo_peca', bem: 'vc', peca: 'motor', opcao: 'remap' }));
    const b = v.financas.bens.find(x => x.id === 'vc') as Veiculo;
    expect(efeitoDasMods('carro', b.mods).fragilidade).toBeGreaterThan(1);
    expect(valorDeMercadoDoVeiculo(v, b)).toBeLessThan(valor);
    expect(efeitoDasMods('carro', { pneus: 'bons' }).fragilidade).toBeLessThan(1);
    // Comprar a melhor peça estética e vender: o veículo nunca vale mais do que custou a peça.
    v = fazer(v, p({ o: 'veiculo_peca', bem: 'vc', peca: 'interior', opcao: 'couro' }));
    const b2 = v.financas.bens.find(x => x.id === 'vc') as Veiculo;
    expect(valorDeMercadoDoVeiculo(v, b2) - valor).toBeLessThan(conta - v.financas.conta);
    expect(b2.historia!.length).toBeGreaterThanOrEqual(2);
    processarVeiculos(v, criarRng(3));
  });
  it('a pintura muda a cor; voltar ao original devolve a de fábrica', () => {
    let v = comCarro();
    (v.financas.bens[1] as Veiculo).cor = '#b6bcc3'; (v.financas.bens[1] as Veiculo).corNome = 'prata';
    v = fazer(v, p({ o: 'veiculo_peca', bem: 'vc', peca: 'pintura', opcao: 'vermelho' }));
    expect((v.financas.bens.find(x => x.id === 'vc') as Veiculo).corNome).toBe('vermelho');
    v = fazer(v, p({ o: 'veiculo_peca', bem: 'vc', peca: 'pintura', opcao: 'original' }));
    expect((v.financas.bens.find(x => x.id === 'vc') as Veiculo).corNome).toBe('prata');
  });
  it('carros além das vagas pagam vaga alugada', () => {
    const v = dona('apto_1q');
    for (const k of [1, 2]) v.financas.bens.push({ id: `v${k}`, tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'compacto', valor: 50000, tCompra: v.t, estado: 90 });
    expect(custosDaPersonalizacao(v).some(l => /Vaga alugada/.test(l.rotulo))).toBe(true);
  });
});

describe('herança: os objetos atravessam as gerações', () => {
  function familia(): { v: Vida; filho: string } {
    const v = dona('casa_3q', 50000);
    v.financas.investimentos = [];
    for (const [id, vin] of Object.entries(v.vinculos)) if (vin.parentesco === 'filho' || vin.romance) { delete v.vinculos[id]; delete v.pessoas[id]; }
    const { p: f } = comFilho(v, 30, { casa: false });
    f.municipioId = v.moradia.municipioId; f.renda = 5000;
    const relogio: Colecionavel = { id: 'cr', pecaId: 'rolex_datejust', nome: 'Relógio do avô', categoria: 'relogio', raridade: 'rara', procedencia: 'herdada', certificado: true, estado: 80, valor: 40000, precoPago: 0, tCompra: v.t - 300, deFamilia: true, historia: [{ t: v.t - 300, texto: 'Comprado pelo avô em 1990.' }] };
    const quadro: Colecionavel = { id: 'cq', pecaId: 'tela', nome: 'Uma tela', categoria: 'arte', raridade: 'comum', procedencia: 'galeria', certificado: true, estado: 90, valor: 8000, precoPago: 8000, tCompra: v.t - 30 };
    v.financas.colecao = [relogio, quadro];
    const violao = receberCoisa(v, 'violao', 900);
    violao.memoria = { origem: 'presente', de: 'a mãe', afeto: 50 };
    v.eu.estilo = { itens: [{ id: 'e1', itemId: 'relogio', t: v.t - 100, preco: 320, usando: true }] };
    v.morte = { t: v.t, causa: 'infarto', heranca: calcularHeranca(v) };
    return { v, filho: f.id };
  }
  it('a peça de família entra inteira no inventário e fica com o filho; a outra vai a leilão', () => {
    const { v, filho } = familia();
    const inv = inventario(v);
    expect(inv.some(x => x.tipo === 'peca' && x.nome === 'Relógio do avô')).toBe(true);
    const part = partilhar(v, {});
    expect(part.quinhoes.find(x => x.pessoaId === filho)!.bens.some(b => b.tipo === 'peca')).toBe(true);
  });
  it('quem continua recebe a peça, o violão com história e o relógio de pulso — com a memória de quem era', () => {
    const { v, filho } = familia();
    const r = continuarComo(v, filho);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    const peca = (n.financas.colecao ?? []).find(c => c.nome === 'Relógio do avô');
    expect(peca?.memoria?.origem).toBe('heranca');
    expect(peca?.historia!.some(h => /Comprado pelo avô/.test(h.texto))).toBe(true);
    expect((n.financas.colecao ?? []).some(c => c.nome === 'Uma tela')).toBe(false);
    const violao = (n.financas.coisas ?? []).find(c => c.coisaId === 'violao');
    expect(violao?.memoria?.origem).toBe('heranca');
    expect((n.eu.estilo?.itens ?? []).some(x => x.itemId === 'relogio' && x.memoria?.origem === 'heranca')).toBe(true);
    // Nada em dobro: a peça existe uma vez só.
    expect((n.financas.colecao ?? []).filter(c => c.id === 'cr').length).toBe(1);
  });
});

describe('a roupa', () => {
  it('uma peça por parte do corpo: o vestido tira a calça e a camiseta; a jaqueta vai por cima', () => {
    let v = adulto(25);
    v.financas.conta = 50000;
    for (const id of ['jeans', 'camiseta_lisa', 'jaqueta_jeans', 'vestido_floral']) v = fazer(v, { tipo: 'comprar_item', itemId: id });
    const usando = v.eu.estilo!.itens.filter(x => x.usando).map(x => x.itemId).sort();
    expect(usando).toEqual(['jaqueta_jeans', 'vestido_floral']);
    expect(lugaresDoItem(ITENS_ESTILO.find(x => x.id === 'vestido_floral')!)).toEqual(['tronco', 'pernas']);
  });
  it('a ocasião: o chinelo destoa no evento formal; quem não comprou nada não perde nada', () => {
    expect(adequacaoDaRoupa([{ itemId: 'chinelo_slide' }, { itemId: 'bermuda_tactel' }], 'evento')).toBe('destoa');
    expect(adequacaoDaRoupa([{ itemId: 'camisa_social' }, { itemId: 'calca_alfaiataria' }], 'trabalho')).toBe('adequada');
    expect(adequacaoDaRoupa([], 'trabalho')).toBe('neutra');
  });
  it('estilos não são de lugar nem de preço: cada estilo tem peça barata', () => {
    const estilos = new Set(ITENS_ESTILO.flatMap(x => x.estilos ?? []));
    for (const e of estilos) {
      if (e === 'luxuoso') continue;
      expect(ITENS_ESTILO.some(x => x.estilos?.includes(e) && x.preco <= 400), e).toBe(true);
    }
  });
});

describe('música e arte', () => {
  it('o gosto não lê classe nem cidade: a mesma pessoa em casas diferentes tem o mesmo gosto de partida', () => {
    const a = adulto(20, { semente: 21 });
    const b = structuredClone(a);
    b.origem.classe = a.origem.classe === 'alta' ? 'vulneravel' : 'alta';
    b.moradia.municipioId = 'sao-paulo-sp';
    delete a.eu.gostos; delete b.eu.gostos;
    expect(gostosDe(b)).toEqual(gostosDe(a));
  });
  it('em muitas vidas, todo gênero aparece entre os preferidos de alguém', () => {
    const vistos = new Set<string>();
    for (let k = 0; k < 400; k++) for (const g of preferidosDaPessoa(`p${k}`)) vistos.add(g);
    expect(vistos.size).toBeGreaterThanOrEqual(20);
  });
  it('o par puxa o gosto; o programa custa; a obra vira peça sua', () => {
    let v = dona('apto_2q');
    const { p: par, vin } = comParceiro(v, { idade: 40, estagio: 'morando_junto' });
    vin.convivio = ['casa'];
    par.municipioId = v.moradia.municipioId;
    const fav = preferidosDaPessoa(par.id)[0];
    const antes = gostosDe(v).musica[fav];
    for (let k = 0; k < 5; k++) { v.t += 12; processarGostos(v); }
    expect(gostosDe(v).musica[fav]).toBeGreaterThan(antes);
    const conta = v.financas.conta;
    v = fazer(v, p({ o: 'cultural', oque: 'roda_samba', pessoaId: par.id }));
    expect(v.financas.conta).toBeLessThan(conta);
    expect(pode(v, p({ o: 'cultural', oque: 'roda_samba' }))).toBe(false);
    v = fazer(v, p({ o: 'obra', linguagem: 'desenho' }));
    const obra = (v.financas.colecao ?? []).find(c => c.procedencia === 'propria')!;
    expect(obra.memoria?.origem).toBe('feito');
    expect(obra.valor).toBeLessThan(5000);
    v = fazer(v, p({ o: 'expor', colecao: obra.id, comodo: 'sala' }));
    expect((v.financas.colecao ?? []).find(c => c.id === obra.id)!.exposta).toBe(true);
    expect(pode(v, p({ o: 'obra', linguagem: 'pintura' }))).toBe(false);
  });
});

describe('catálogo e saves', () => {
  it('toda coisa nova tem lugar na casa e as que se usam têm uso', () => {
    for (const id of ['cavaquinho', 'pandeiro', 'sanfona', 'saxofone', 'controladora_dj', 'home_studio', 'som_hifi', 'mesa_sinuca', 'cavalete', 'torno_ceramica']) {
      expect(COISAS.some(c => c.id === id), id).toBe(true);
      expect(usosDaCoisa(id).length, id).toBeGreaterThan(0);
    }
  });
  it('o save antigo (sem nada disto) carrega igual, e tudo o que é novo persiste no JSON', () => {
    let v = dona('casa_grande');
    expect(v.versao).toBe(VERSAO_SAVE);
    const velho = JSON.stringify(v);
    const r0 = interpretar(velho);
    expect(r0.tipo).toBe('ok');
    v = fazer(v, p({ o: 'construir', tipo: 'piscina' }));
    v = fazer(v, p({ o: 'acabamento', comodo: 'sala', aspecto: 'luz', opcao: 'quente' }));
    receberCoisa(v, 'violao', 900);
    v = fazer(v, p({ o: 'apelidar', ref: { tipo: 'coisa', id: v.financas.coisas![0].id }, nome: 'Bege' }));
    v = fazer(v, p({ o: 'cultural', oque: 'ouvir' }));
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect((r.vida.financas.bens[0] as Imovel).lar).toEqual((v.financas.bens[0] as Imovel).lar);
    expect(r.vida.financas.coisas![0].apelido).toBe('Bege');
    expect(r.vida.eu.gostos).toEqual(v.eu.gostos);
  });
  it('o ano corre com tudo isto sem quebrar (dez anos)', () => {
    const v = dona('mansao', 5_000_000);
    receberCoisa(v, 'piano', 30000);
    for (let k = 0; k < 10; k++) { v.t += 12; processarPersonalizacao(v); processarCoisas(v); }
    expect(confortoDaCasa(v).valor).toBeGreaterThan(0);
  });
});
