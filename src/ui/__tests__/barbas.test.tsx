// @vitest-environment jsdom
/**
 * HOTFIX das barbas — regressão. A geometria de verdade (a boca, os olhos e o nariz livres; o quadro) é medida no
 * navegador por `scripts/playtest/barbas.mjs` sobre as galerias de `galeriaBarbas.tsx`; aqui fica o que o jsdom garante:
 *   1. toda barba × com e sem bigode × idade × expressão × rosto desenha caminhos válidos, marcada (e a boca marcada);
 *      nenhuma barba antes dos 16 nem em rosto feminino;
 *   2. a barba é uma massa só que segue a mandíbula: desce até o queixo (a longa, bem além), e o bigode vai junto;
 *   3. os tipos novos (longa, costeletas, bigodão; cavanhaque sem bigode) na Aparência e no Nascer;
 *   4. a gente do mundo usa os tipos novos sem gastar a sequência do gerador da vida.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { disponibilidadeAparencia } from '../../motor/sistemas/estilo';
import { variarBarba } from '../../motor/sistemas/identidade';
import { visualAleatorio, visualHerdado } from '../../motor/pessoas';
import { BARBAS, BARBAS_COM_BIGODE } from '../../motor/dados/estilo';
import type { Genero, Vida, Visual } from '../../motor/tipos';
import { Retrato, type Expressao } from '../avatar/Retrato';
import { AparenciaEEstilo } from '../jogo/Aparencia';
import { Criacao } from '../telas/Criacao';
import type { ControleVida } from '../useVida';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); const r = criarRng(20261018); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const TIPOS = BARBAS.map(b => b.id).filter(b => b !== 'nenhuma');
const html = (v: Partial<Visual>, i: number, g: Genero = 'masculino', x?: Expressao) => renderToStaticMarkup(<Retrato visual={{ pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', rosto: 'oval', ...v } as Visual} genero={g} idade={i} semente="b" tamanho={96} expressao={x} />);
/** O trecho da barba no SVG e o ponto mais baixo da massa (os caminhos da barba são pares x y). */
const barba = (h: string) => h.match(/<g class="retrato__barba"[\s\S]*?<\/g>(?=<(?!circle|path)|$)/)?.[0] ?? '';
const fundo = (h: string) => Math.max(...[...(barba(h).match(/ d="([^"]+)"/)?.[1] ?? '').matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m => Number(m[2])));

function vida(idade: number): Vida {
  let v = criarVida({ nome: 'Rui', sobrenome: 'Reis', genero: 'masculino', municipioId: 'recife-pe', semente: 8 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  return v;
}

describe('toda barba, todo rosto, toda expressão', () => {
  it('desenha caminhos válidos, marca a barba e a boca', () => {
    for (const b of TIPOS) for (const bigode of [undefined, false]) for (const i of [16, 25, 50, 80]) for (const x of ['bem', 'neutro', 'abatido', 'tenso'] as Expressao[]) for (const rosto of ['oval', 'redondo', 'quadrado', 'longo', 'coracao']) for (const textura of ['liso', 'crespo']) {
      const h = html({ barba: b, bigode, rosto, textura }, i, 'masculino', x);
      const caso = `${b} ${bigode} ${i} ${x} ${rosto} ${textura}`;
      expect(h, caso).not.toMatch(/NaN|Infinity/);
      expect(h, caso).toMatch(/class="retrato__barba"[^>]*data-boca="[\d.,-]+"/);
    }
  });
  it('nenhuma barba antes dos 16 nem em rosto feminino', () => {
    for (const b of TIPOS) {
      expect(html({ barba: b }, 14)).not.toContain('retrato__barba');
      expect(html({ barba: b }, 30, 'feminino')).not.toContain('retrato__barba');
    }
  });
});

describe('uma massa só, presa ao rosto', () => {
  it('a barba desce até o queixo; a cheia passa dele, a longa bem além (e afina no fim da adolescência)', () => {
    const queixo = 44 + 46 / 2;
    expect(fundo(html({ barba: 'curta' }, 30))).toBeGreaterThanOrEqual(queixo);
    expect(fundo(html({ barba: 'cheia' }, 30))).toBeGreaterThan(fundo(html({ barba: 'curta' }, 30)));
    expect(fundo(html({ barba: 'longa' }, 30))).toBeGreaterThan(queixo + 8);
    expect(fundo(html({ barba: 'longa' }, 17))).toBeLessThan(fundo(html({ barba: 'longa' }, 30)));
  });
  it('o bigode vai junto (e sai quando a pessoa tira); o bigodão é mais largo que o bigode', () => {
    for (const b of BARBAS_COM_BIGODE) {
      expect(barba(html({ barba: b }, 30)), b).toContain('retrato__bigode');
      expect(barba(html({ barba: b, bigode: false }, 30)), b).not.toContain('retrato__bigode');
    }
    const largura = (b: string) => { const xs = [...(barba(html({ barba: b }, 30)).match(/ d="([^"]+)"/)?.[1] ?? '').matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m => Number(m[1])); return Math.max(...xs) - Math.min(...xs); };
    expect(largura('bigodao')).toBeGreaterThan(largura('bigode'));
  });
});

describe('os tipos novos no jogo', () => {
  function Ligado({ v0 }: { v0: Vida }) {
    const [v, setV] = useState(v0);
    return <main><AparenciaEEstilo vida={v} agir={(a: Acao) => { setV(executar(v, a).vida); return true; }} irPara={() => {}} /><output data-testid="barba">{`${v.eu.visual.barba}|${v.eu.visual.bigode}`}</output></main>;
  }
  it('Aparência e estilo: todas as barbas; "Com bigode" onde cabe; a longa e o cavanhaque sem bigode', () => {
    render(<Ligado v0={vida(25)} />);
    const sel = screen.getByRole('combobox', { name: 'Barba' }) as HTMLSelectElement;
    expect([...sel.options].map(o => o.value)).toEqual(BARBAS.map(b => b.id));
    fireEvent.change(sel, { target: { value: 'bigodao' } });
    expect(screen.queryByRole('checkbox', { name: 'Com bigode' })).toBeNull();
    fireEvent.change(sel, { target: { value: 'cavanhaque' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Com bigode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mudar o visual' }));
    expect(screen.getByTestId('barba').textContent).toBe('cavanhaque|false');
    fireEvent.change(screen.getByRole('combobox', { name: 'Barba' }), { target: { value: 'longa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mudar o visual' }));
    expect(screen.getByTestId('barba').textContent).toMatch(/^longa\|/);
  });
  it('o motor aceita as barbas do catálogo e recusa as inventadas', () => {
    const v = vida(20);
    for (const b of TIPOS) expect(disponibilidadeAparencia(v, { barba: b }).grau, b).toBe('permitido');
    expect(disponibilidadeAparencia(v, { barba: 'trancada' }).grau).not.toBe('permitido');
  });
  it('Nascer: "Barba quando adulto" oferece o catálogo inteiro', () => {
    const c = { setTela: () => {}, nascer: () => {} } as unknown as ControleVida;
    render(<Criacao c={c} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Homem' }));
    const puxar = screen.getByRole('checkbox', { name: /Puxar os traços dos pais/ }) as HTMLInputElement;
    if (puxar.checked) fireEvent.click(puxar);
    const sel = screen.getByRole('combobox', { name: 'Barba quando adulto' }) as HTMLSelectElement;
    expect([...sel.options].map(o => o.value)).toEqual(BARBAS.map(b => (b.id === 'nenhuma' ? '' : b.id)));
  });
});

describe('a gente do mundo', () => {
  it('usa os tipos novos; variar é estável (aplicar de novo não muda); a sequência do gerador da vida é a mesma', () => {
    const r = criarRng(42);
    const vistos = new Set<string>();
    for (let i = 0; i < 3000; i++) {
      const a = visualAleatorio(r, 'masculino');
      const f = visualHerdado(r, 'masculino', a, visualAleatorio(r, 'feminino'));
      for (const v of [a, f]) if (v.barba) { vistos.add(v.barba + (v.bigode === false ? '-' : '')); expect(variarBarba(v)).toEqual(v); }
    }
    for (const b of TIPOS) expect(vistos, b).toContain(b);
    expect(vistos).toContain('cavanhaque-');
    // O número de sorteios do gerador da vida não mudou com a variação (medido antes do HOTFIX: 20000 pares, semente 42).
    const s = criarRng(42);
    for (let i = 0; i < 20000; i++) { const a = visualAleatorio(s, 'masculino'); visualHerdado(s, 'masculino', a, visualAleatorio(s, 'feminino')); }
    expect(s.next()).toBeCloseTo(0.18566769151948392, 12);
  });
});
