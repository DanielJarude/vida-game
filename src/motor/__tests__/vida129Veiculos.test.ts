/**
 * VIDA 12.9 — Veículos e garagem: as regras que não podem quebrar.
 *
 *   catálogo     íntegro (ids únicos, classe existente, marca e modelo, preço e ano plausíveis, tiragem coerente); os
 *                novos entram na loja certa; o save velho sem versão não muda de modelo porque o catálogo cresceu.
 *   raridade     vem dos dados do produto (tiragem, produção, classe), nunca do preço: o Rolls de série não é raro, o
 *                McLaren 765LT é edição limitada, o Fusca é comum.
 *   coleção      o carro de coleção tem marca, modelo e ano no nome (não "carro clássico") e o fundamento do grau.
 *   peças        acabamento, rodas, teto, faixas e aerofólio persistem no bem e mudam o desenho; o que não serve
 *                (roda de cravo num esportivo, aerofólio numa picape) é recusado.
 *   saves        o veículo antigo carrega igual (nenhum campo novo obrigatório).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { formaDaVersao, VEICULOS, VERSOES_VEICULO, versaoVeiculo } from '../dados/bens';
import { ehVersao129, fundamentoDaRaridade, grauDoVeiculo, nomeDoVeiculoDeColecao, VERSOES_VEICULO_129, visualDasMods } from '../dados/veiculos129';
import { pecasDaCategoria, PECAS_POR_CATEGORIA } from '../dados/personalizacaoVeiculo';
import { colecoesDaVida } from '../sistemas/colecao';
import { versaoParaVeiculoAntigo } from '../sistemas/versoesVeiculo';
import { ofertasDeVeiculos } from '../sistemas/mercado';
import { amostraDoVeiculo, visualDoVeiculo } from '../../ui/ilustracao/veiculos';
import type { Peca } from '../../ui/ilustracao/nucleo';
import type { Imovel, Veiculo, Vida } from '../tipos';

const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao) => { expect(pode(v, a), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const p = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });
const segmento = (classe: string) => VEICULOS.find(m => m.id === classe)?.segmento;

function rica(): Vida {
  const v = adulto(40, { semente: 129, municipioId: 'sao-paulo-sp' });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = 30_000_000; v.financas.dividas = []; v.financas.negativado = false;
  v.trabalho.licencas.push('cnh');
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  return v;
}
const veiculo = (v: Vida, versaoId: string, extra: Partial<Veiculo> = {}): Veiculo => {
  const x = versaoVeiculo(versaoId)!;
  const b: Veiculo = { id: `v-${versaoId}`, tipo: 'veiculo', modeloId: x.classe, versaoId, nome: `${x.marca} ${x.modelo}`, valor: x.preco, tCompra: v.t, estado: 90, anoFabricacao: x.ano ?? 2026, precoPago: x.preco, ...extra };
  v.financas.bens.push(b);
  return b;
};
const marcas = (pecas: Peca[]): string[] => pecas.flatMap(x => [x.marca ?? x.tipo, ...(x.tipo === 'grupo' ? marcas(x.pecas) : [])]);

describe('o catálogo de veículos', () => {
  it('é íntegro: ids únicos, classe existente, marca/modelo, preço e ano plausíveis, tiragem coerente', () => {
    const ids = VERSOES_VEICULO.map(x => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(VERSOES_VEICULO_129.length).toBeGreaterThanOrEqual(60);
    for (const x of VERSOES_VEICULO_129) {
      expect(VEICULOS.some(m => m.id === x.classe), x.id).toBe(true);
      expect(x.marca.length && x.modelo.length, x.id).toBeTruthy();
      expect(x.preco, x.id).toBeGreaterThan(10000);
      expect(x.preco, x.id).toBeLessThan(40_000_000);
      if (segmento(x.classe) === 'classico') { expect(x.ano, x.id).toBeGreaterThanOrEqual(1950); expect(x.ano!, x.id).toBeLessThanOrEqual(1995); expect(x.dica).toContain(String(x.ano)); }
      else expect(x.ano, x.id).toBeUndefined();
      if (x.limitada) { expect(x.limitada).toBeGreaterThan(0); expect(x.dica, x.id).toMatch(/edição limitada/); }
      if (x.producao) expect(x.producao).toBeGreaterThan(x.limitada ?? 0);
      expect(formaDaVersao(x), x.id).toBe(x.forma);
    }
  });
  it('amplia o que faltava: motos, clássicos, esportivos, luxo, superesportivos e edições limitadas', () => {
    const da = (f: (x: typeof VERSOES_VEICULO_129[number]) => boolean) => VERSOES_VEICULO_129.filter(f).length;
    expect(da(x => x.classe.startsWith('moto'))).toBeGreaterThanOrEqual(15);
    expect(da(x => x.classe === 'classico')).toBeGreaterThanOrEqual(20);
    expect(da(x => x.classe === 'superesportivo' || x.classe === 'hiperluxo')).toBeGreaterThanOrEqual(14);
    expect(VERSOES_VEICULO.filter(x => x.limitada).length).toBeGreaterThanOrEqual(6);
    expect(da(x => x.classe === 'carro_luxo')).toBeGreaterThanOrEqual(10);
  });
  it('os novos entram nas lojas certas (o clássico só usado, na garagem de colecionador)', () => {
    const v = rica();
    const col = ofertasDeVeiculos(v, 'colecionador');
    expect(col.some(o => !o.usado && o.versaoId === 'ferrari_sf90_xx')).toBe(true);
    expect(col.filter(o => o.modeloId === 'classico').every(o => o.usado)).toBe(true);
    expect(ofertasDeVeiculos(v, 'motos').some(o => o.versaoId === 'yamaha_nmax')).toBe(true);
    expect(ofertasDeVeiculos(v, 'concessionaria').some(o => o.versaoId === 'chevrolet_corvette')).toBe(false); // só na América do Norte
  });
  it('o save antigo sem versão continua ganhando o mesmo modelo (só as versões de antes entram no sorteio)', () => {
    for (const classe of ['moto_pequena', 'moto_grande', 'carro_luxo', 'superesportivo', 'classico', 'hiperluxo', 'carro_sedan']) {
      for (let k = 0; k < 40; k++) {
        const x = versaoParaVeiculoAntigo({ id: `b${k}`, modeloId: classe });
        expect(x && ehVersao129(x.id), `${classe} ${x?.id}`).toBe(false);
      }
    }
  });
});

describe('raridade pelos dados do produto', () => {
  it('a edição limitada é limitada; a produção conhecida decide; a classe sozinha não faz raro', () => {
    expect(grauDoVeiculo(versaoVeiculo('mclaren_765lt'), 'exotico')).toBe('limitada');
    expect(grauDoVeiculo(versaoVeiculo('ducati_superleggera'))).toBe('limitada');
    expect(grauDoVeiculo(versaoVeiculo('toyota_2000gt_1967'), 'classico')).toBe('muito_rara');
    expect(grauDoVeiculo(versaoVeiculo('corvette_1963'), 'classico')).toBe('rara');
    expect(grauDoVeiculo(versaoVeiculo('ford_mustang_1967'), 'classico')).toBe('incomum');
    expect(grauDoVeiculo(versaoVeiculo('vw_fusca_1972'), 'classico')).toBe('comum');
    // Caro não é colecionável: o Rolls-Royce Phantom de série (R$ 12 milhões) fica abaixo do Interlagos (R$ 400 mil, 822 feitos).
    expect(grauDoVeiculo(versaoVeiculo('rolls_phantom'), 'exotico')).toBe('incomum');
    expect(grauDoVeiculo(versaoVeiculo('willys_interlagos_1964'), 'classico')).toBe('muito_rara');
    expect(grauDoVeiculo(versaoVeiculo('fiat_mobi'))).toBe('comum');
    expect(grauDoVeiculo({ id: 'x', limitada: 1 })).toBe('unica');
    expect(fundamentoDaRaridade(versaoVeiculo('ferrari_sf90_xx'))).toBe('edição limitada de 799 unidades');
    expect(fundamentoDaRaridade(versaoVeiculo('vw_beetle_1967'), 'classico')).toMatch(/mais de 21,5 milhões/);
  });
  it('na coleção: o nome é marca, modelo e ano; o grau segue a tiragem (o 765LT, antes "rara" pela classe, é edição limitada)', () => {
    const v = rica();
    veiculo(v, 'mclaren_765lt', { papel: 'colecao', parado: true, anoFabricacao: 2021 });
    veiculo(v, 'jaguar_etype', { papel: 'colecao', parado: true });
    veiculo(v, 'rolls_phantom', { papel: 'colecao', parado: true });
    const carros = colecoesDaVida(v).find(g => g.id === 'carros')!;
    const nomes = carros.itens.map(x => x.nome);
    expect(nomes).toContain('McLaren 765LT, 2021');
    expect(nomes).toContain('Jaguar E-Type Série 1, 1963');
    expect(nomes.some(n => /carro clássico|superesportivo|altíssimo luxo/.test(n))).toBe(false);
    expect(carros.itens.find(x => x.nome.startsWith('McLaren'))!.grau).toBe('limitada');
    expect(carros.itens.find(x => x.nome.startsWith('Rolls'))!.grau).toBe('incomum');
    expect(carros.itens.find(x => x.nome.startsWith('McLaren'))!.detalhe).toBe('edição limitada de 765 unidades');
    // O nome sem versão (save antigo) cai no nome salvo, e nunca some.
    expect(nomeDoVeiculoDeColecao(undefined, 1970, 'Opala', 'carro clássico')).toBe('Opala, 1970');
  });
});

describe('personalização que persiste e aparece', () => {
  it('acabamento, rodas, teto, faixas e aerofólio ficam no bem, sobrevivem ao save e mudam o desenho', () => {
    let v = rica();
    veiculo(v, 'porsche_911');
    const sem = amostraDoVeiculo('esportivo', '#2c4f8a', 'porsche_911', 'porsche_911', 90);
    for (const [peca, opcao] of [['pintura', 'azul_royal'], ['acabamento', 'perolizado'], ['rodas', 'douradas'], ['teto', 'preto'], ['faixas', 'dupla'], ['aerofolio', 'aerofolio']] as const)
      v = fazer(v, p({ o: 'veiculo_peca', bem: 'v-porsche_911', peca, opcao }));
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const b = r.vida.financas.bens.find(x => x.id === 'v-porsche_911') as Veiculo;
    expect(b.mods).toMatchObject({ acabamento: 'perolizado', rodas: 'douradas', teto: 'preto', faixas: 'dupla', aerofolio: 'aerofolio' });
    expect(b.corNome).toBe('azul-royal');
    const visual = visualDoVeiculo('esportivo', b.mods)!;
    expect(visual).toMatchObject({ acabamento: 'perolizado', tetoCor: '#1f1f22', faixa: 'dupla', aerofolio: true });
    expect(visual.roda).toMatchObject({ cor: '#c9a23a', aroMaior: true });
    const com = amostraDoVeiculo('esportivo', b.cor, 'porsche_911', 'porsche_911', 90, visual);
    const m = marcas(com.pecas);
    for (const marca of ['acabamento-perolizado', 'faixa', 'asa', 'roda']) expect(m, marca).toContain(marca);
    expect(com.pecas.filter(x => x.tipo === 'pneu').every(x => x.tipo === 'pneu' && x.corAro === '#c9a23a')).toBe(true);
    expect(JSON.stringify(com)).not.toBe(JSON.stringify(sem));
    expect(b.historia!.length).toBeGreaterThanOrEqual(6);
  });
  it('cada acabamento e cada roda dá um desenho diferente (carro e moto)', () => {
    const desenho = (forma: 'hatch' | 'street', versao: string, mods?: Record<string, string>) => JSON.stringify(amostraDoVeiculo(forma, '#b8302a', versao, versao, 90, visualDoVeiculo(forma, mods)).pecas);
    const carro = ['original', 'metalico', 'perolizado', 'acetinado', 'fosco'].map(a => desenho('hatch', 'vw_polo', { acabamento: a }));
    expect(new Set(carro).size).toBe(5);
    const rodas = pecasDaCategoria('carro').find(x => x.id === 'rodas')!.opcoes.filter(o => o.id !== 'off_road').map(o => desenho('hatch', 'vw_polo', { rodas: o.id }));
    expect(new Set(rodas).size).toBe(rodas.length);
    const moto = ['original', 'metalico', 'fosco'].map(a => desenho('street', 'kawasaki_z900', { acabamento: a }));
    expect(new Set(moto).size).toBe(3);
    expect(desenho('street', 'kawasaki_z900', { rodas: 'liga_dourada' })).not.toBe(desenho('street', 'kawasaki_z900'));
    // O preto fosco de antes já diz que é fosco.
    expect(visualDasMods('carro', { pintura: 'preto_fosco' }, PECAS_POR_CATEGORIA.carro)?.acabamento).toBe('fosco');
  });
  it('o que não serve no veículo é recusado (roda de cravo no esportivo; aerofólio na picape)', () => {
    const v = rica();
    veiculo(v, 'porsche_911');
    veiculo(v, 'toyota_hilux');
    expect(pode(v, p({ o: 'veiculo_peca', bem: 'v-porsche_911', peca: 'rodas', opcao: 'off_road' }))).toBe(false);
    expect(pode(v, p({ o: 'veiculo_peca', bem: 'v-toyota_hilux', peca: 'aerofolio', opcao: 'aerofolio' }))).toBe(false);
    expect(pode(v, p({ o: 'veiculo_peca', bem: 'v-toyota_hilux', peca: 'rodas', opcao: 'off_road' }))).toBe(true);
  });
});

describe('saves antigos', () => {
  it('o veículo de antes (sem peças novas, sem campos novos) carrega igual e desenha igual', () => {
    const v = rica();
    const b = veiculo(v, 'chevrolet_onix', { mods: { pintura: 'vermelho', rodas: 'liga' }, cor: '#b8302a', corNome: 'vermelho' });
    const antes = JSON.parse(JSON.stringify(b));
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(r.vida.financas.bens.find(x => x.id === b.id)).toEqual(antes);
    // Sem peça nenhuma, o desenho é o mesmo de sempre (nenhum visual).
    expect(visualDoVeiculo('hatch', undefined)).toBeUndefined();
    // VIDA 13: a preparação do motor passou a aparecer (a ponteira do escape); pneus e freios continuam invisíveis.
    expect(visualDoVeiculo('hatch', { motor: 'remap', pneus: 'bons' })).toEqual({ escape: true });
    expect(visualDoVeiculo('hatch', { pneus: 'bons', freios: 'reforcados' })).toBeUndefined();
  });
});
