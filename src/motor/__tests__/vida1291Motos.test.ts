/**
 * VIDA 12.9.1 — Motos clássicas: as regras que não podem quebrar.
 *
 *   catálogo     íntegro (ids únicos, todas na classe `moto_classica`, marca/modelo/ano reais, preço de referência
 *                plausível, produção só quando conhecida); a classe é moto e clássica (segmento `classico`).
 *   raridade     vem dos dados (produção, marco histórico), nunca do ano nem do preço: a CB750 (centenas de milhares) é
 *                incomum só por ser um marco; a Black Shadow (~1.700) é muito rara; a XS650 sem número é incomum, não rara.
 *   valorização  não deprecia pela idade (anda com o índice de clássicos e com o estado); restaura-se.
 *   compra/venda só usada, só na garagem de colecionador (a loja de motos não vende clássica zero); compra com a história
 *                do anúncio; vende-se.
 *   coleção      "Motos de coleção", com marca, modelo e ano e o fundamento do grau.
 *   peças        filete, banco de couro e rodas persistem no bem, sobrevivem ao save e mudam o desenho; o filete não serve
 *                numa moto que não é clássica.
 *   desenho      cada clássica tem um desenho próprio (nenhuma repete), com as peças que a definem (motor, escape, garfo).
 *   saves        a moto de antes carrega igual e desenha igual.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { criarRng } from '../rng';
import { depreciacao, formaDaVersao, modeloVeiculo, VEICULOS, VERSOES_VEICULO, versaoVeiculo } from '../dados/bens';
import { CLASSE_MOTO_CLASSICA, ehMotoClassica1291, VERSOES_MOTOS_CLASSICAS } from '../dados/motosClassicas1291';
import { fundamentoDaRaridade, grauDoVeiculo } from '../dados/veiculos129';
import { colecoesDaVida } from '../sistemas/colecao';
import { ofertasDeVeiculos, valorDeClassico } from '../sistemas/mercado';
import { processarVeiculos, valorDeMercadoDoVeiculo, valorDeVenda } from '../sistemas/veiculos';
import { versaoParaVeiculoAntigo } from '../sistemas/versoesVeiculo';
import { amostraDoVeiculo, visualDoVeiculo } from '../../ui/ilustracao/veiculos';
import { MOTOS_CLASSICAS_1291 } from '../../ui/ilustracao/motosClassicas1291';
import type { Peca } from '../../ui/ilustracao/nucleo';
import type { Imovel, Veiculo, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });
const seg = 'classico' as const;

function rica(): Vida {
  const v = adulto(40, { semente: 1291, municipioId: 'sao-paulo-sp' });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = 30_000_000; v.financas.dividas = []; v.financas.negativado = false;
  if (!v.trabalho.licencas.includes('cnh')) v.trabalho.licencas.push('cnh');
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  return v;
}
const moto = (v: Vida, versaoId: string, extra: Partial<Veiculo> = {}): Veiculo => {
  const x = versaoVeiculo(versaoId)!;
  const b: Veiculo = { id: `v-${versaoId}`, tipo: 'veiculo', modeloId: x.classe, versaoId, nome: `${x.marca} ${x.modelo}`, valor: x.preco, tCompra: v.t, estado: 85, anoFabricacao: x.ano ?? 2026, precoPago: x.preco, ...extra };
  v.financas.bens.push(b);
  return b;
};
const marcas = (pecas: Peca[]): string[] => pecas.flatMap(x => [x.marca ?? x.tipo, ...(x.tipo === 'grupo' ? marcas(x.pecas) : [])]);
const desenho = (id: string, mods?: Record<string, string>) => amostraDoVeiculo('cruiser', '#2c4f8a', id, id, 90, visualDoVeiculo('cruiser', mods));

describe('o catálogo de motos clássicas', () => {
  it('é íntegro: ids únicos, classe moto clássica, marca/modelo/ano, preço de referência e produção coerentes', () => {
    const ids = VERSOES_VEICULO.map(x => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(VERSOES_MOTOS_CLASSICAS.length).toBeGreaterThanOrEqual(25);
    expect(VEICULOS.filter(m => m.id === 'moto_classica')).toHaveLength(1);
    expect(CLASSE_MOTO_CLASSICA).toMatchObject({ categoria: 'moto', segmento: 'classico', cnh: true, usado: true });
    for (const x of VERSOES_MOTOS_CLASSICAS) {
      expect(versaoVeiculo(x.id), x.id).toBe(x);
      expect(x.classe, x.id).toBe('moto_classica');
      expect(x.marca.length && x.modelo.length && (x.acabamento ?? '').length, x.id).toBeTruthy();
      expect(x.ano!, x.id).toBeGreaterThanOrEqual(1920);
      expect(x.ano!, x.id).toBeLessThanOrEqual(1995);
      expect(x.preco, x.id).toBeGreaterThanOrEqual(20000);
      expect(x.preco, x.id).toBeLessThanOrEqual(6_000_000);
      expect(x.dica, x.id).toContain(String(x.ano));
      expect(formaDaVersao(x), x.id).toBe('cruiser');
      if (x.producao !== undefined) expect(x.producao, x.id).toBeGreaterThan(100);
      expect(x.limitada, x.id).toBeUndefined();
      expect(ehMotoClassica1291(x.id)).toBe(true);
    }
    // As de cada origem e de cada estilo pedido.
    const marcasDe = new Set(VERSOES_MOTOS_CLASSICAS.map(x => x.marca));
    for (const m of ['Triumph', 'BSA', 'Norton', 'Ducati', 'BMW', 'Moto Guzzi', 'Vincent', 'Honda', 'Kawasaki', 'Yamaha', 'Suzuki', 'Harley-Davidson', 'Indian']) expect(marcasDe.has(m), m).toBe(true);
    for (const d of ['café racer', 'scrambler', 'custom', 'esportiva clássica']) expect(VERSOES_MOTOS_CLASSICAS.some(x => x.dica.startsWith(d)), d).toBe(true);
  });
});

describe('raridade pelos dados', () => {
  const grau = (id: string) => grauDoVeiculo(versaoVeiculo(id), seg);
  it('produção e marco histórico decidem; o ano e o preço, não', () => {
    // A CB750: centenas de milhares feitas — comum pela produção, incomum só por ser um marco.
    expect(grau('honda_cb750_1970')).toBe('incomum');
    expect(grauDoVeiculo({ ...versaoVeiculo('honda_cb750_1970')!, historica: false }, seg)).toBe('comum');
    // A Black Shadow (~1.700): rara pela produção, muito rara por ser um marco. A SS100 (383): muito rara (não passa disso).
    expect(grau('vincent_black_shadow_1950')).toBe('muito_rara');
    expect(grau('brough_ss100_1930')).toBe('muito_rara');
    expect(grau('ducati_750ss_1974')).toBe('muito_rara');
    expect(grau('harley_xr1000_1983')).toBe('rara');
    expect(grau('bmw_r60_2_1965')).toBe('incomum');
    // Sem número conhecido, a classe decide: a moto velha de série não vira rara por ser velha.
    expect(grau('yamaha_xs650_1972')).toBe('incomum');
    expect(grau('indian_scout_101_1929')).toBe('incomum');
    const graus = VERSOES_MOTOS_CLASSICAS.map(x => grau(x.id));
    expect(graus.filter(g => g === 'muito_rara' || g === 'rara').length).toBeLessThanOrEqual(6);
    // O caro não é raro por ser caro: a Knucklehead (R$ 750 mil) sem número fica incomum; a R 90 S (R$ 190 mil, 17.465) também.
    expect(grau('harley_knucklehead_1937')).toBe('incomum');
    expect(grau('bmw_r90s_1974')).toBe('incomum');
  });
  it('o fundamento diz o porquê, com o milhar no formato daqui', () => {
    expect(fundamentoDaRaridade(versaoVeiculo('vincent_black_shadow_1950'), seg)).toBe('marco da história; cerca de 1.700 fabricados');
    expect(fundamentoDaRaridade(versaoVeiculo('honda_cb750_1970'), seg)).toBe('marco da história; mais de 400.000 fabricados');
    expect(fundamentoDaRaridade(versaoVeiculo('bmw_r60_2_1965'), seg)).toBe('cerca de 17.306 fabricados');
    expect(fundamentoDaRaridade(versaoVeiculo('corvette_1963'), seg)).toBe('cerca de 10.594 fabricados');
    expect(fundamentoDaRaridade(versaoVeiculo('yamaha_xs650_1972'), seg)).toBe('clássico de série');
  });
});

describe('valorização, compra e venda', () => {
  it('a clássica não deprecia pela idade: anda com o mercado de clássicos e com o estado', () => {
    expect(depreciacao(CLASSE_MOTO_CLASSICA, 30)).toBe(1);
    const v = rica();
    const b = moto(v, 'kawasaki_z1_1973', { estado: 85 });
    const precos: number[] = [];
    for (let k = 0; k < 12; k++) {
      v.t += 12;
      const vale = valorDeMercadoDoVeiculo(v, b);
      // Cada ano, o valor é o do mercado de clássicos (o índice do ano) para a mesma moto no mesmo estado.
      expect(vale).toBe(valorDeClassico(v, versaoVeiculo('kawasaki_z1_1973')!.preco, 85));
      precos.push(vale);
    }
    // Pode subir e cair; não desaba como moto usada comum (que perde mais da metade em 12 anos).
    expect(Math.min(...precos)).toBeGreaterThan(precos[0] * 0.4);
    // A moto comum da mesma idade perde; a clássica não cai pela idade.
    expect(depreciacao(modeloVeiculo('moto_media'), 12)).toBeLessThan(0.5);
    // O estado pesa: a mesma moto, cansada, vale bem menos.
    const cansada = { ...b, estado: 40 };
    expect(valorDeMercadoDoVeiculo(v, cansada)).toBeLessThan(valorDeMercadoDoVeiculo(v, b) * 0.8);
    // O ano passa: o processamento anual mantém o valor no mercado de clássicos (não aplica depreciação de usado).
    const antes = b.valor;
    processarVeiculos(v, criarRng(3));
    expect(b.valor).toBeGreaterThan(antes * 0.4);
  });
  it('só usada, só na garagem de colecionador; compra com a história do anúncio; restaura; vende', () => {
    let v = rica();
    expect(ofertasDeVeiculos(v, 'motos').some(o => o.modeloId === 'moto_classica')).toBe(false);
    const col = ofertasDeVeiculos(v, 'colecionador');
    const motos = col.filter(o => o.modeloId === 'moto_classica');
    expect(motos.length).toBe(3);
    expect(motos.every(o => o.usado && ehMotoClassica1291(o.versaoId) && o.anoFabricacao === versaoVeiculo(o.versaoId)!.ano && !!o.historico)).toBe(true);
    // Os anúncios das motos vêm depois dos carros (os anúncios de antes não mudam de lugar).
    expect(col.slice(-3).every(o => o.modeloId === 'moto_classica')).toBe(true);
    const o = motos[0];
    v = fazer(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
    const b = v.financas.bens.find((x): x is Veiculo => x.tipo === 'veiculo' && x.modeloId === 'moto_classica')!;
    expect(b.versaoId).toBe(o.versaoId);
    expect(b.historia![0].texto).toContain(o.historico!);
    // Restaurar é coisa de clássico: a moto clássica pode (se não estiver impecável).
    b.estado = 50;
    expect(pode(v, { tipo: 'veiculo', bemId: b.id, oque: 'restaurar' })).toBe(true);
    // Vende: a conta sobe pelo valor de venda.
    const conta = v.financas.conta, vale = valorDeVenda(b, v);
    expect(vale).toBeGreaterThan(0);
    v = fazer(v, { tipo: 'vender_bem', bemId: b.id });
    expect(v.financas.bens.some(x => x.id === b.id)).toBe(false);
    expect(v.financas.conta).toBeGreaterThan(conta);
  });
});

describe('coleção', () => {
  it('as motos de coleção têm o grupo delas, com marca, modelo, ano e o fundamento do grau', () => {
    const v = rica();
    moto(v, 'vincent_black_shadow_1950', { papel: 'colecao', parado: true });
    moto(v, 'honda_cb750_1970', { papel: 'colecao', parado: true });
    moto(v, 'jaguar_etype', { papel: 'colecao', parado: true });
    const gs = colecoesDaVida(v);
    const motos = gs.find(g => g.id === 'motos')!;
    expect(motos.nome).toBe('Motos de coleção');
    expect(motos.itens.map(x => x.nome).sort()).toEqual(['Honda CB750 Four, 1970', 'Vincent Black Shadow Série C, 1950']);
    expect(motos.itens[0].grau).toBe('muito_rara');
    expect(motos.itens.find(x => x.nome.startsWith('Honda'))!.detalhe).toMatch(/400\.000/);
    expect(gs.find(g => g.id === 'carros')!.itens.map(x => x.nome)).toEqual(['Jaguar E-Type Série 1, 1963']);
    expect(gs.findIndex(g => g.id === 'motos')).toBe(gs.findIndex(g => g.id === 'carros') + 1);
  });
});

describe('personalização que persiste e aparece no desenho', () => {
  it('filete, banco de couro, rodas e acabamento ficam no bem, sobrevivem ao save e mudam o desenho', () => {
    let v = rica();
    moto(v, 'triumph_t120_1969');
    const sem = JSON.stringify(desenho('triumph_t120_1969').pecas);
    for (const [peca, opcao] of [['filete', 'dourado'], ['banco', 'couro_caramelo'], ['rodas', 'raiadas_douradas'], ['acabamento', 'metalico']] as const)
      v = fazer(v, p({ o: 'veiculo_peca', bem: 'v-triumph_t120_1969', peca, opcao }));
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const b = r.vida.financas.bens.find(x => x.id === 'v-triumph_t120_1969') as Veiculo;
    expect(b.mods).toMatchObject({ filete: 'dourado', banco: 'couro_caramelo', rodas: 'raiadas_douradas', acabamento: 'metalico' });
    const visual = visualDoVeiculo('cruiser', b.mods)!;
    expect(visual).toMatchObject({ filete: '#d4af37', banco: '#9a6233', acabamento: 'metalico' });
    const com = desenho('triumph_t120_1969', b.mods);
    const m = marcas(com.pecas);
    for (const marca of ['filete', 'acabamento-metalico', 'banco', 'roda']) expect(m, marca).toContain(marca);
    expect(com.pecas.some(x => x.tipo === 'massa' && x.marca === 'banco' && x.cor === '#9a6233')).toBe(true);
    expect(com.pecas.filter(x => x.tipo === 'pneu').every(x => x.tipo === 'pneu' && x.corAro === '#c9a23a' && x.aro === 'raios')).toBe(true);
    expect(JSON.stringify(com.pecas)).not.toBe(sem);
    // Cada detalhe sozinho muda o desenho.
    const um = ['filete', 'banco', 'rodas'].map((peca, k) => JSON.stringify(desenho('triumph_t120_1969', { [peca]: ['branco', 'couro_marrom', 'raiadas_douradas'][k] }).pecas));
    expect(new Set([sem, ...um]).size).toBe(4);
  });
  it('o filete é de moto clássica: na naked de hoje é recusado; o banco de couro serve em qualquer moto', () => {
    const v = rica();
    moto(v, 'kawasaki_z900');
    expect(pode(v, p({ o: 'veiculo_peca', bem: 'v-kawasaki_z900', peca: 'filete', opcao: 'dourado' }))).toBe(false);
    expect(pode(v, p({ o: 'veiculo_peca', bem: 'v-kawasaki_z900', peca: 'banco', opcao: 'couro_marrom' }))).toBe(true);
  });
});

describe('o desenho de cada clássica', () => {
  it('toda clássica tem perfil próprio e desenho único, com as peças que a definem', () => {
    const vistos = new Set<string>();
    for (const x of VERSOES_MOTOS_CLASSICAS) {
      expect(MOTOS_CLASSICAS_1291[x.id], x.id).toBeDefined();
      const a = desenho(x.id);
      const m = marcas(a.pecas);
      expect(m.filter(k => k === 'roda'), x.id).toHaveLength(2);
      expect(m.some(k => /tanque/.test(k)), x.id).toBe(true);
      expect(m.some(k => /^guidao-/.test(k)), x.id).toBe(true);
      vistos.add(JSON.stringify(a.pecas));
    }
    expect(vistos.size).toBe(VERSOES_MOTOS_CLASSICAS.length);
    // O que separa as famílias: o V2 da Harley, o boxer da BMW, os quatro escapamentos da CB750, a carenagem da RC30.
    expect(marcas(desenho('harley_knucklehead_1937').pecas)).toContain('cabecote-no-dos-dedos');
    expect(marcas(desenho('harley_panhead_1955').pecas)).toContain('cabecote-panela');
    expect(marcas(desenho('bmw_r60_2_1965').pecas)).toEqual(expect.arrayContaining(['cilindro-de-lado', 'garfo-earles', 'cardan']));
    expect(marcas(desenho('honda_cb750_1970').pecas)).toEqual(expect.arrayContaining(['silenciador-alto', 'silenciador-baixo']));
    expect(marcas(desenho('honda_rc30_1988').pecas)).toEqual(expect.arrayContaining(['carenagem-inteira', 'farol-duplo']));
    expect(marcas(desenho('bsa_gold_star_1960').pecas)).toEqual(expect.arrayContaining(['corcova', 'guidao-baixo', 'megafone']));
    expect(marcas(desenho('honda_cl350_1970').pecas)).toEqual(expect.arrayContaining(['escapamento-alto', 'protetor-de-calor', 'guidao-alto']));
    expect(marcas(desenho('indian_chief_1947').pecas)).toContain('paralama-de-saia');
  });
});

describe('saves antigos', () => {
  it('a moto de antes (sem campos novos) carrega igual e desenha igual; o sorteio de versão de save velho não cai numa clássica', () => {
    const v = rica();
    const b = moto(v, 'honda_cg160', { mods: { pintura: 'vermelho', rodas: 'raiadas' }, cor: '#b8302a', corNome: 'vermelha' });
    const c = moto(v, 'harley_fat_boy', { cor: '#1f1f22', corNome: 'preta' });
    const antes = JSON.parse(JSON.stringify([b, c]));
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.financas.bens.filter(x => x.tipo === 'veiculo')).toEqual(antes);
    // Sem peça nova, nenhum visual novo: o desenho da moto de antes é o de sempre.
    expect(visualDoVeiculo('street', { pintura: 'vermelho' })).toBeUndefined();
    expect(visualDoVeiculo('cruiser', { escape: 'esportivo' })).toBeUndefined();
    // A moto sem versão (save v≤13) continua sorteando só entre as versões de antes da classe dela.
    for (let k = 0; k < 20; k++) {
      const x = versaoParaVeiculoAntigo({ id: `m${k}`, tipo: 'veiculo', modeloId: 'moto_media', nome: 'moto média', valor: 30000, tCompra: 0, estado: 80 } as Veiculo);
      expect(ehMotoClassica1291(x?.id)).toBe(false);
    }
  });
});
