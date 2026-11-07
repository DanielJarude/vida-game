// @vitest-environment jsdom
/**
 * VIDA 13 — Aparência (desenho e tela): cada joia nova aparece no seu furo e com desenho próprio; a orelha de perto; o
 * medusa some debaixo do bigode; criança não aparece com piercing nem maquiagem; os cortes e as barbas novas desenham
 * formas diferentes entre si; as mechas e a maquiagem aparecem; a nuca de costas muda com o corte; a seção de piercings
 * experimenta sem mudar nada e usa/tira pela ação de sempre.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Retrato } from '../avatar/Retrato';
import { OrelhaDePerto } from '../avatar/piercings';
import { CabeloDeCostas, cabeloCobreOrelha, temBigode } from '../avatar/identidade13';
import { PIERCINGS } from '../../motor/dados/piercings129';
import { zonaDoFuro } from '../../motor/dados/piercings13';
import { BARBAS_13, CORTES_13 } from '../../motor/dados/aparencia13';
import { TIPOS_DE_CABELO } from '../../motor/dados/estilo';
import { PiercingsDaAparencia, visualDaPrevia } from '../jogo/Piercings13';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar } from '../../motor/acoes';
import type { Genero, Visual } from '../../motor/tipos';

afterEach(cleanup);
const vis = { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', rosto: 'oval', calvicie: 'nao' } as Visual;
const html = (v: Partial<Visual>, g: Genero = 'feminino', i = 28) => renderToStaticMarkup(<Retrato visual={{ ...vis, ...v } as Visual} genero={g} idade={i} semente="t" tamanho={100} rotulo="r" />);
const parte = (h: string, sel: RegExp) => (h.match(sel) ?? []).join('');

describe('13 · piercings no desenho', () => {
  it('toda joia do rosto aparece no seu furo, com desenho diferente das outras do mesmo furo', () => {
    const porFuro = new Map<string, Set<string>>();
    for (const p of PIERCINGS.filter(x => x.lugar !== 'umbigo')) {
      const { container, unmount } = render(<Retrato visual={{ ...vis, piercings: [p.id] }} genero="nao_binario" idade={25} semente="x" tamanho={100} rotulo="r" />);
      const el = container.querySelector(`[data-piercing="${p.lugar}"]`);
      expect(el, p.id).toBeTruthy();
      const s = porFuro.get(p.lugar) ?? new Set();
      s.add(el!.innerHTML);
      porFuro.set(p.lugar, s);
      unmount();
    }
    for (const [l, s] of porFuro) expect(s.size, l).toBe(PIERCINGS.filter(x => x.lugar === l).length);
  });

  it('o medusa some debaixo do bigode; criança não aparece com piercing nem maquiagem', () => {
    expect(html({ piercings: ['pc_medusa_titanio'] }, 'masculino', 30)).toContain('data-piercing="medusa"');
    expect(html({ piercings: ['pc_medusa_titanio'], barba: 'curta' }, 'masculino', 30)).not.toContain('data-piercing="medusa"');
    expect(html({ piercings: ['pc_medusa_titanio'], barba: 'curta', bigode: false }, 'masculino', 30)).toContain('data-piercing="medusa"');
    expect(temBigode({ ...vis, barba: 'bigode_fino' }, 'masculino', 30)).toBe(true);
    const crianca = html({ piercings: ['pc_concha_ponto_titanio'], batom: 'rosa', delineado: 'fino' }, 'feminino', 7);
    expect(crianca).not.toContain('data-piercing');
    expect(crianca).not.toContain('data-maquiagem');
  });

  it('a orelha de perto: cada furo da orelha, o brinco no lóbulo, o cabelo por cima quando cobre', () => {
    const orelha = PIERCINGS.filter(p => zonaDoFuro(p.lugar) === 'orelha');
    const { container } = render(<OrelhaDePerto ids={['pc_helix_argola', 'pc_industrial_barra_aco', 'pc_tragus_ponto', 'pc_concha_ponto_titanio', 'pc_daith_argola_aco', 'pc_lobulo2_ponto_aco']} brinco="brincos_perola" pele="#d49f75" sombra="#bd8559" />);
    for (const r of ['helix', 'industrial', 'tragus', 'concha', 'daith', 'lobulo2']) expect(container.querySelector(`[data-piercing="${r}"]`), r).toBeTruthy();
    expect(container.querySelector('[data-brinco="perola"]')).toBeTruthy();
    expect(container.querySelector('[data-cabelo-cobre]')).toBeNull();
    for (const p of orelha) expect(renderToStaticMarkup(<OrelhaDePerto ids={[p.id]} pele="#d49f75" sombra="#bd8559" />), p.id).toContain(`data-piercing="${p.lugar}"`);
    expect(renderToStaticMarkup(<OrelhaDePerto ids={['pc_helix_argola']} pele="#d49f75" sombra="#bd8559" cabelo="#222222" />)).toContain('data-cabelo-cobre');
    expect(cabeloCobreOrelha('longo_liso')).toBe(true);
    expect(cabeloCobreOrelha('undercut')).toBe(false);
  });
});

describe('13 · identidade visual no desenho', () => {
  it('cortes novos: todo tipo e idade desenham sem NaN, e cada corte é uma forma diferente', () => {
    const formas = new Set<string>();
    for (const c of CORTES_13) {
      for (const t of TIPOS_DE_CABELO) for (const i of [9, 30, 75]) expect(html({ cabelo: c.id, textura: t.id }, 'feminino', i), `${c.id} ${t.id} ${i}`).not.toMatch(/NaN|Infinity/);
      formas.add(parte(html({ cabelo: c.id, textura: 'liso' }), /<g class="retrato__cabelo[^]*?<\/g><\/g>|<g class="retrato__cabelo[^]*?<\/g>/g));
    }
    expect(formas.size).toBe(CORTES_13.length);
  });

  it('barbas novas: cada uma com a sua forma, sem NaN', () => {
    const formas = new Set<string>();
    for (const b of BARBAS_13) {
      const h = html({ barba: b.id }, 'masculino', 34);
      expect(h, b.id).not.toMatch(/NaN|Infinity/);
      expect(h, b.id).toContain('retrato__barba');
      formas.add(parte(h, /<g class="retrato__barba[^]*?<\/g>/g));
    }
    expect(formas.size).toBe(BARBAS_13.length);
  });

  it('mechas e maquiagem aparecem (e cada delineado é diferente)', () => {
    for (const e of ['luzes', 'ombre', 'frente']) expect(html({ cabelo: 'longo_liso', mechas: 'loiro', mechasEstilo: e })).toContain(`data-mechas="${e}"`);
    const h = html({ delineado: 'gatinho', sombraOlhos: 'dourado', batom: 'vermelho', blush: 'rosado' }, 'masculino', 30);
    for (const k of ['delineado-gatinho', 'sombra', 'batom', 'blush']) expect(h).toContain(`data-maquiagem="${k}"`);
    const d = new Set(['fino', 'gatinho', 'carregado'].map(x => parte(html({ delineado: x }), /<g class="retrato__maquiagem"[^]*?<\/g><\/g>/g)));
    expect(d.size).toBe(3);
  });

  it('de costas: o comprimento e o que fica preso mudam o desenho', () => {
    const f = (c: string) => renderToStaticMarkup(<svg><CabeloDeCostas cabelo={c} cor="#333333" /></svg>);
    expect(new Set(['curto', 'chanel', 'shag', 'longo_liso', 'rabo', 'dois_coques', 'maria_chiquinha', 'moicano', 'trancas'].map(f)).size).toBe(9);
  });
});

describe('13 · a seção de piercings', () => {
  it('experimentar só muda a prévia; "Trocar por esta" usa a peça pelo id; "Tirar" guarda', () => {
    let v = transacao(adulto(25, { semente: 1313, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 100_000; x.momento = null; }).vida;
    for (const id of ['pc_helix_argola', 'pc_helix_cluster']) v = executar(v, { tipo: 'comprar_item', itemId: id }).vida;
    expect(v.eu.visual.piercings).toEqual(['pc_helix_cluster']);
    expect(visualDaPrevia(v.eu.visual, 'pc_helix_argola', false).piercings).toEqual(['pc_helix_argola']);
    expect(visualDaPrevia({ ...v.eu.visual, cabelo: 'longo_liso' }, undefined, true).cabelo).toBe('coque');
    const agir = vi.fn(() => true);
    render(<PiercingsDaAparencia vida={v} agir={agir} irPara={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Argola de prata/ }));
    expect(screen.getByRole('img', { name: /Experimentando/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar por esta' }));
    const peca = v.eu.estilo!.itens.find(x => x.itemId === 'pc_helix_argola')!;
    expect(agir).toHaveBeenCalledWith({ tipo: 'usar_item', itemId: 'pc_helix_argola', id: peca.id, usar: true });
    fireEvent.click(screen.getByRole('button', { name: 'Tirar' }));
    expect(agir).toHaveBeenLastCalledWith(expect.objectContaining({ tipo: 'usar_item', itemId: 'pc_helix_cluster', usar: false }));
  });
});
