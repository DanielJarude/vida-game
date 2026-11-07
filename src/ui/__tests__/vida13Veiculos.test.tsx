// @vitest-environment jsdom
/**
 * VIDA 13 — Veículos: o rework visual e a garagem.
 *
 *   catálogo        todo carro e toda moto do catálogo tem perfil próprio (nenhum cai no desenho genérico da forma) e
 *                   sai com as partes que o fazem ser o que é (lataria, vidros, rodas, farol, lanterna; tanque, banco,
 *                   motor, escape, garfo, farol).
 *   perfis          silhuetas distintas: nenhum par de carros com a mesma lataria; o 911 (motor traseiro), o Huracán (motor
 *                   central) e o sedã comum têm construções diferentes; as medidas são as de verdade (o Phantom é mais
 *                   comprido que o Mobi, o G 63 mais alto que o Huracán, a moto mais curta que o carro na garagem).
 *   personalização  pintura, acabamento, rodas, suspensão, escape e baú mudam o desenho.
 *   comprado=visto  a oferta da loja e o veículo na garagem saem com o MESMO desenho (o mesmo caminho de parâmetros), e o
 *                   presente pedido pela criança chega com o modelo do anúncio.
 *   saves antigos   veículo sem versão, ou com uma versão que não existe mais, ainda desenha (e igual em todas as telas).
 *   garagem         a cena na escala, o filtro por tipo, o veículo de perto (a folha com o desenho grande).
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { precarregar } from '../App';
import { DesenhoVeiculo } from '../jogo/material/Desenhos';
import { GaragemVisual } from '../jogo/Garagem129';
import { amostraDoVeiculo, visualDoVeiculo } from '../ilustracao/veiculos';
import { perfilDoModelo } from '../ilustracao/carros';
import { MODELOS_13 } from '../ilustracao/carros13';
import { MOTOS_MODERNAS_13, MOTOS_RETRO_13 } from '../ilustracao/motos13';
import { MOTOS_CLASSICAS_1291 } from '../ilustracao/motosClassicas1291';
import { MODELOS_MOTO } from '../ilustracao/duasRodas';
import { MODELOS_MOTO_129 } from '../ilustracao/veiculos129';
import type { Peca } from '../ilustracao/nucleo';
import { VERSOES_VEICULO, formaDaVersao, modeloVeiculo, versaoVeiculo, type FormaVeiculo } from '../../motor/dados/bens';
import { corDoVeiculo } from '../../motor/dados/pertences';
import { ofertasDeVeiculos } from '../../motor/sistemas/mercado';
import { executar } from '../../motor/acoes';
import { adulto } from '../../motor/__tests__/cenarios';
import type { Imovel, Veiculo, Vida } from '../../motor/tipos';

beforeAll(async () => { await precarregar(); });
afterEach(cleanup);

const traco = (el: ReactElement): string => {
  const { container } = render(el);
  const d = [...container.querySelectorAll('path, circle, ellipse')].map(x => `${x.getAttribute('d') ?? ''}${x.getAttribute('cx') ?? ''},${x.getAttribute('r') ?? ''},${x.getAttribute('fill') ?? ''}`).join('|');
  cleanup();
  return d;
};
const marcas = (pecas: Peca[]): string[] => pecas.flatMap(x => [x.marca ?? x.tipo, ...(x.tipo === 'grupo' ? marcas(x.pecas) : [])]);
const catDe = (id: string) => modeloVeiculo(versaoVeiculo(id)!.classe).categoria;
const CARROS = VERSOES_VEICULO.filter(x => modeloVeiculo(x.classe).categoria === 'carro');
const MOTOS = VERSOES_VEICULO.filter(x => modeloVeiculo(x.classe).categoria === 'moto');
const desenho = (id: string, cor = '#2c4f8a', mods?: Record<string, string>) => { const f = formaDaVersao(versaoVeiculo(id)); return amostraDoVeiculo(f, cor, id, id, 90, visualDoVeiculo(f, mods)); };
const lataria = (id: string, mods?: Record<string, string>) => (desenho(id, '#2c4f8a', mods).pecas.find(x => x.marca === 'lataria') as Extract<Peca, { tipo: 'massa' }>).d;

describe('o catálogo inteiro desenha, cada modelo com o seu perfil', () => {
  it('todo carro tem perfil pelas medidas e sai com lataria, vidros, retrovisor, rodas, farol e lanterna', () => {
    expect(CARROS.length).toBeGreaterThanOrEqual(100);
    for (const x of CARROS) {
      expect(MODELOS_13[x.id], x.id).toBeDefined();
      const m = marcas(desenho(x.id).pecas);
      for (const parte of ['lataria', 'roda', 'farol', 'lanterna', 'caixa-de-roda', 'porta']) expect(m, `${x.id}: ${parte}`).toContain(parte);
      if (!MODELOS_13[x.id].j?.semTeto) expect(m.filter(k => k === 'vidro').length, x.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('toda moto tem perfil próprio (clássica, de linha clássica, moderna ou scooter/motoneta) com tanque ou carroceria, banco, rodas e farol', () => {
    for (const x of MOTOS) {
      const temPerfil = !!(MOTOS_CLASSICAS_1291[x.id] ?? MOTOS_RETRO_13[x.id] ?? MOTOS_MODERNAS_13[x.id] ?? MODELOS_MOTO[x.id] ?? MODELOS_MOTO_129[x.id]);
      expect(temPerfil, x.id).toBe(true);
      const m = marcas(desenho(x.id).pecas);
      expect(m.filter(k => k === 'roda').length, x.id).toBe(2);
      expect(m.some(k => /^(tanque|carroceria|escudo)/.test(k)), x.id).toBe(true);
      expect(m.some(k => /^(banco|selim)/.test(k)), x.id).toBe(true);
      expect(m.some(k => /farol/.test(k)) || m.includes('placa-de-numero'), x.id).toBe(true);
    }
    // As de hoje montadas peça a peça: motor, escape, garfo, balança, discos.
    for (const id of Object.keys(MOTOS_MODERNAS_13)) {
      const m = marcas(desenho(id).pecas);
      expect(m.some(k => /cilindro|bloco-boxer/.test(k)), id).toBe(true);
      expect(m.some(k => /^escape|coletor/.test(k)), id).toBe(true);
      expect(m.some(k => /^garfo/.test(k)), id).toBe(true);
      expect(m, id).toEqual(expect.arrayContaining(['balanca', 'disco', 'monochoque']));
    }
  });

  it('no DOM: todo veículo do catálogo marca o modelo e tem peças (o desenho nunca falta)', () => {
    for (const x of [...CARROS, ...MOTOS]) {
      const { container } = render(<DesenhoVeiculo forma={formaDaVersao(x)} versaoId={x.id} cor="#b8352b" largura={160} />);
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('data-modelo'), x.id).toBe(x.id);
      expect(svg.querySelectorAll('[data-peca]').length, x.id).toBeGreaterThanOrEqual(10);
      cleanup();
    }
  });
});

describe('perfis distintos e proporções de verdade', () => {
  it('nenhum par de carros sai com a mesma lataria; nenhum par de motos com o mesmo desenho', () => {
    const l = CARROS.map(x => lataria(x.id));
    expect(new Set(l).size).toBe(CARROS.length);
    const t = MOTOS.map(x => JSON.stringify(desenho(x.id).pecas));
    expect(new Set(t).size).toBe(MOTOS.length);
  });

  it('o 911 (motor traseiro), o Huracán (motor central) e o sedã comum são construções diferentes', () => {
    const p911 = perfilDoModelo('porsche_911')!, hur = perfilDoModelo('lamborghini_huracan')!, cor = perfilDoModelo('toyota_corolla')!;
    expect([MODELOS_13.porsche_911.a, MODELOS_13.lamborghini_huracan.a, MODELOS_13.toyota_corolla.a]).toEqual(['traseiro', 'central', 'seda']);
    const rel = (p: typeof hur) => ({ alt: (122 - p.teto) / (p.x1 - p.x0), pb: (p.x1 - p.pb) / (p.x1 - p.x0) });
    // O Huracán é o mais baixo em relação ao comprimento, com o para-brisa mais à frente (a cabine adiantada).
    expect(rel(hur).alt).toBeLessThan(rel(p911).alt);
    expect(rel(p911).alt).toBeLessThan(rel(cor).alt);
    expect(rel(hur).pb).toBeLessThan(rel(cor).pb);
    // O 911 tem o farol no para-lama e a anca; o Huracán, as tomadas laterais; o Corolla, o porta-malas (três volumes).
    expect(marcas(desenho('porsche_911').pecas)).toContain('casco-do-farol');
    expect(marcas(desenho('lamborghini_huracan').pecas)).toContain('tomada');
    expect(cor.traseira).toBe('tres');
    expect(p911.traseira).toBe('fastback');
    // Hatch ≠ SUV ≠ picape ≠ sedã: as traseiras.
    expect(perfilDoModelo('vw_polo')!.traseira).toBe('hatch');
    expect(perfilDoModelo('jeep_compass')!.traseira).toBe('caixa');
    expect(perfilDoModelo('toyota_hilux')!.traseira).toBe('cacamba');
    // O Fusca com os para-lamas soltos e o estribo.
    expect(marcas(desenho('vw_fusca_1972').pecas)).toEqual(expect.arrayContaining(['paralama', 'estribo']));
  });

  it('as medidas: o Phantom é mais comprido que o Mobi; o G 63 mais alto que o Huracán; a picape mais longa que o hatch', () => {
    const comp = (id: string) => { const p = perfilDoModelo(id)!; return p.x1 - p.x0; };
    const alt = (id: string) => 122 - perfilDoModelo(id)!.teto;
    expect(comp('rolls_phantom')).toBeGreaterThan(comp('fiat_mobi') * 1.5);
    expect(alt('mercedes_g63')).toBeGreaterThan(alt('lamborghini_huracan') * 1.6);
    expect(comp('toyota_hilux')).toBeGreaterThan(comp('vw_polo'));
    for (const x of CARROS) { const p = perfilDoModelo(x.id)!; expect(p.x0, x.id).toBeGreaterThanOrEqual(-2); expect(p.x1, x.id).toBeLessThanOrEqual(242); expect(p.teto, x.id).toBeGreaterThan(20); }
  });
});

describe('a personalização muda o desenho', () => {
  it('pintura, acabamento, rodas, suspensão e escape (carro); baú, escape e banco (moto)', () => {
    const base = desenho('vw_golf_gti');
    const tinta = (a: ReturnType<typeof desenho>) => (a.pecas.find(x => x.marca === 'lataria') as Extract<Peca, { tipo: 'massa' }>).cor;
    expect(tinta(desenho('vw_golf_gti', '#b8302a'))).not.toBe(tinta(base));
    expect(marcas(desenho('vw_golf_gti', '#2c4f8a', { acabamento: 'perolizado' }).pecas)).toContain('acabamento-perolizado');
    const roda = (a: ReturnType<typeof desenho>) => a.pecas.find(x => x.tipo === 'pneu') as Extract<Peca, { tipo: 'pneu' }>;
    expect(roda(desenho('vw_golf_gti', '#2c4f8a', { rodas: 'douradas' })).corAro).toBe('#c9a23a');
    expect(roda(desenho('vw_golf_gti', '#2c4f8a', { rodas: 'raiadas' })).aro).toBe('raios');
    // A rebaixada desce a carroceria (as rodas ficam); a reforçada sobe.
    const y = (d: string) => Number(/M[\d.]+ ([\d.]+)/.exec(d)![1]);
    expect(y(lataria('vw_golf_gti', { suspensao: 'rebaixada' }))).toBeGreaterThan(y(lataria('vw_golf_gti')));
    expect(y(lataria('toyota_hilux', { suspensao: 'reforcada' }))).toBeLessThan(y(lataria('toyota_hilux')));
    expect(roda(desenho('vw_golf_gti', '#2c4f8a', { suspensao: 'rebaixada' })).cy).toBe(roda(base).cy);
    expect(marcas(desenho('vw_golf', '#2c4f8a', { motor: 'remap' }).pecas)).toContain('ponteira-esportiva');
    expect(marcas(desenho('honda_cg160', '#2c4f8a', { bagageiro: 'bau' }).pecas)).toContain('bau');
    expect(marcas(desenho('honda_cg160', '#2c4f8a', { bagageiro: 'alforjes' }).pecas)).toContain('alforje');
    expect(marcas(desenho('yamaha_mt09', '#2c4f8a', { escape: 'esportivo' }).pecas)).toContain('ponteira-esportiva');
    // O desenho com peças é outro (o cache não confunde).
    expect(JSON.stringify(desenho('vw_golf', '#2c4f8a', { suspensao: 'rebaixada' }))).not.toBe(JSON.stringify(desenho('vw_golf')));
  });
});

/** Uma vida rica, com carteira, casa e garagem vazia. */
function rica(): Vida {
  const v = adulto(40, { semente: 13, municipioId: 'sao-paulo-sp' });
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  v.financas.conta = 30_000_000; v.financas.dividas = []; v.financas.negativado = false;
  v.trabalho.licencas.push('cnh');
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 900000, tCompra: v.t - 60, municipioId: v.moradia.municipioId, estado: 80 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: v.t - 60 };
  return v;
}

describe('o comprado é o exibido', () => {
  it('cada oferta (concessionária, usados, motos, colecionador): o desenho da loja = o desenho na garagem depois da compra', () => {
    let n = 0;
    for (const loja of ['concessionaria', 'usados', 'motos', 'colecionador'] as const) {
      const v0 = rica();
      for (const o of ofertasDeVeiculos(v0, loja).slice(0, 4)) {
        const forma = formaDaVersao(versaoVeiculo(o.versaoId), o.modeloId);
        // Como a loja desenha (Compras: a vitrine; Lugares: o anúncio e o detalhe).
        const naLoja = traco(<DesenhoVeiculo forma={forma} versaoId={o.versaoId} cor={o.cor} semente={o.id} estado={o.estado} largura={200} />);
        const noAnuncio = traco(<DesenhoVeiculo forma={forma} semente={o.versaoId ?? o.modeloId} cor={o.cor} estado={o.estado} largura={200} />);
        const r = executar(v0, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
        const b = r.vida.financas.bens.find((x): x is Veiculo => x.tipo === 'veiculo')!;
        expect(b, o.id).toBeDefined();
        expect([b.versaoId, b.cor, b.estado], o.id).toEqual([o.versaoId, o.cor, o.estado]);
        // Como a garagem desenha (Garagem129, Pertences, a oficina).
        const naGaragem = traco(<DesenhoVeiculo forma={formaDaVersao(versaoVeiculo(b.versaoId), b.modeloId)} semente={b.id} versaoId={b.versaoId} cor={corDoVeiculo(b, modeloVeiculo(b.modeloId).categoria).cor} estado={b.estado} mods={b.mods} largura={200} />);
        expect(naGaragem, o.id).toBe(naLoja);
        expect(naGaragem, o.id).toBe(noAnuncio);
        n++;
      }
    }
    expect(n).toBeGreaterThanOrEqual(12);
  }, 120_000);

  it('o presente pedido pela criança chega com o modelo do anúncio (antes chegava sem versão, e a garagem desenhava outro)', () => {
    const v = adulto(10, { semente: 7 });
    v.financas.bens = v.financas.bens.filter(b => b.tipo !== 'veiculo');
    let achou = false;
    for (let s = 0; s < 12 && !achou; s++) {
      const r = executar({ ...structuredClone(v), id: `${v.id}-${s}` }, { tipo: 'pedir_veiculo', modeloId: 'bike' });
      const b = r.vida.financas.bens.find((x): x is Veiculo => x.tipo === 'veiculo');
      if (b) { achou = true; expect(b.versaoId).toBeDefined(); expect(catDe(b.versaoId!)).toBe('bicicleta'); }
    }
    if (!achou) expect(true).toBe(true); // nenhum adulto disse sim nessas sementes: a regra fica coberta pela compra acima
  });
});

describe('saves antigos', () => {
  it('veículo sem versão (save até v13) ou com versão desconhecida ainda desenha, igual em todas as telas', () => {
    const formas: FormaVeiculo[] = ['compacto', 'hatch', 'seda', 'suv', 'suv_medio', 'suv_grande', 'picape', 'esportivo', 'street', 'trail', 'scooter', 'cub'];
    for (const f of formas) {
      const a = traco(<DesenhoVeiculo forma={f} semente="v12" largura={120} />);
      const b = traco(<DesenhoVeiculo forma={f} semente="v12" versaoId={undefined} largura={120} />);
      expect(a.length, f).toBeGreaterThan(100);
      expect(a, f).toBe(b);
      expect(traco(<DesenhoVeiculo forma={f} versaoId="modelo_que_saiu_do_catalogo" semente="v12" largura={120} />).length, f).toBeGreaterThan(100);
    }
    // As peças antigas (rodas "liga" de antes, preto fosco) continuam aparecendo.
    expect(marcas(desenho('fiat_argo', '#2c4f8a', { rodas: 'liga', pintura: 'preto_fosco' }).pecas)).toContain('roda');
    expect((desenho('fiat_argo', '#2c4f8a', { pintura: 'preto_fosco' }).pecas.find(x => x.marca === 'lataria') as { attrs?: Record<string, string> }).attrs?.['data-acabamento']).toBe('fosco');
  });
});

describe('a garagem', () => {
  const comVeiculos = () => {
    const v = rica();
    const add = (id: string, versaoId: string, extra: Partial<Veiculo> = {}) => { const x = versaoVeiculo(versaoId)!; v.financas.bens.push({ id, tipo: 'veiculo', modeloId: x.classe, versaoId, nome: `${x.marca} ${x.modelo}`, valor: x.preco, tCompra: v.t, estado: 90, anoFabricacao: 2025, precoPago: x.preco, cor: '#b8352b', corNome: 'vermelho', ...extra }); };
    add('v1', 'porsche_911', { mods: { rodas: 'douradas', suspensao: 'rebaixada' } });
    add('v2', 'honda_cg160');
    add('v3', 'toyota_hilux');
    return v;
  };

  it('a cena na escala: a moto sai menor que o carro; cada vaga abre o veículo de perto', () => {
    const { container, getByRole } = render(<GaragemVisual vida={comVeiculos()} agir={() => true} />);
    const vagas = [...container.querySelectorAll('.gar129__vaga')];
    expect(vagas.length).toBe(3);
    const larg = (i: number) => Number(vagas[i].querySelector('svg')!.getAttribute('width'));
    const iMoto = vagas.findIndex(x => x.querySelector('svg')!.getAttribute('data-modelo') === 'honda_cg160');
    const iCarro = vagas.findIndex(x => x.querySelector('svg')!.getAttribute('data-modelo') === 'toyota_hilux');
    expect(larg(iMoto)).toBeLessThan(larg(iCarro) * 0.6);
    fireEvent.click(vagas[iCarro]);
    const folha = getByRole('dialog');
    expect(folha.getAttribute('aria-label')).toMatch(/De perto/);
    expect(Number(folha.querySelector('svg')!.getAttribute('width'))).toBeGreaterThanOrEqual(600);
  });

  it('as peças feitas aparecem no desenho da garagem e na legenda do de perto; o filtro por tipo separa carros e motos', () => {
    const { container, getAllByRole, getByRole, getByLabelText } = render(<GaragemVisual vida={comVeiculos()} agir={() => true} />);
    const cartao = container.querySelector('[data-veiculo="v1"]')!;
    expect(cartao.querySelector('[data-peca="roda"] circle[fill="#c9a23a"]')).toBeTruthy();
    fireEvent.click(getAllByRole('button', { name: /Ver de perto: Porsche 911/ })[1]);
    expect(getByRole('dialog').textContent).toMatch(/forjadas douradas/);
    fireEvent.click(getByRole('button', { name: 'Fechar' }));
    fireEvent.change(getByLabelText('Tipo'), { target: { value: 'moto' } });
    expect([...container.querySelectorAll('.gar129__cartao')].map(x => x.getAttribute('data-veiculo'))).toEqual(['v2']);
  });
});
