// @vitest-environment jsdom
/**
 * HOTFIX dos cabelos — regressão. A geometria de verdade (isPointInFill, o quadro, os olhos) é medida no navegador por
 * `scripts/playtest/cabelos.mjs` sobre as galerias de `galeriaCabelos.tsx`, e a inspeção visual está no relatório; aqui
 * fica o que o jsdom consegue garantir sem desenhar:
 *   1. todo corte × todo tipo × as idades da prévia (bebê, 9, 30, 75) desenha caminhos válidos;
 *   2. tranças e locs: TODA raiz de cordão fica junto da cabeça (antes, os cordões de fora nasciam no ar, a até 1,25 × a
 *      meia-largura da cabeça) e acima do queixo; há cordões no alto, saindo da linha do cabelo;
 *   3. o tipo "encaracolado" tem desenho próprio (nem o liso, nem o cacheado);
 *   4. o tipo de cabelo é escolha no salão (Você · Aparência e estilo): o natural fica nos genes e é o que os filhos
 *      herdam; antes da idade de decidir o visual, a química espera; voltar ao natural, sempre;
 *   5. a tela: o seletor em Aparência e estilo (com o natural marcado) e no Nascer (sem puxar os pais).
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
import { disponibilidadeAparencia, texturaNatural } from '../../motor/sistemas/estilo';
import { geneticaDe } from '../../motor/sistemas/identidade';
import { CORTES, TIPOS_DE_CABELO } from '../../motor/dados/estilo';
import type { Genero, Vida, Visual } from '../../motor/tipos';
import { Retrato } from '../avatar/Retrato';
import { AparenciaEEstilo } from '../jogo/Aparencia';
import { Criacao } from '../telas/Criacao';
import type { ControleVida } from '../useVida';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); const r = criarRng(20261017); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const IDADES = [0, 9, 30, 75];
const html = (v: Partial<Visual>, g: Genero, i: number) => renderToStaticMarkup(<Retrato visual={{ pele: 'p4', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho', rosto: 'oval', calvicie: 'nao', ...v } as Visual} genero={g} idade={i} semente="t" tamanho={96} />);
const raizes = (h: string) => [...h.matchAll(/data-raiz="([\d.-]+),([\d.-]+)"/g)].map(m => [Number(m[1]), Number(m[2])]);

function vida(idade: number, textura = 'crespo'): Vida {
  let v = criarVida({ nome: 'Ana', sobrenome: 'Reis', genero: 'feminino', municipioId: 'recife-pe', semente: 8 });
  v.eu.visual.textura = textura;
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  return v;
}

describe('todo corte, todo tipo, toda idade da prévia', () => {
  it('desenha caminhos válidos (sem NaN nem Infinity) e marca as camadas do cabelo', () => {
    for (const c of CORTES.map(x => x.id)) for (const t of TIPOS_DE_CABELO.map(x => x.id)) for (const i of IDADES) for (const g of ['feminino', 'masculino'] as Genero[]) {
      const h = html({ cabelo: c, textura: t }, g, i);
      expect(h, `${c} ${t} ${i}`).not.toMatch(/NaN|Infinity/);
      if (i > 0) expect(h, `${c} ${t} ${i}`).toMatch(/retrato__cabelo--frente|retrato__cabelo--atras/);
    }
  });
});

describe('tranças e locs presas à cabeça', () => {
  it('toda raiz de cordão nasce junto do crânio — nenhuma no ar ao lado da cabeça — e acima do queixo', () => {
    for (const c of ['trancas', 'locs']) for (const i of [9, 30, 75]) for (const rosto of ['oval', 'redondo', 'quadrado', 'longo', 'coracao']) for (const g of ['feminino', 'masculino'] as Genero[]) {
      const rs = raizes(html({ cabelo: c, textura: 'crespo', rosto }, g, i));
      expect(rs.length, `${c} ${i} ${rosto}`).toBeGreaterThan(8);
      for (const [x, y] of rs) {
        // A cabeça mais larga do jogo tem meia-largura ~21 (x de 29 a 71); antes, raízes em x = 25,6 e 74,4.
        expect(Math.abs(x - 50), `${c} ${i} ${rosto}: raiz em (${x}, ${y})`).toBeLessThanOrEqual(21.5);
        expect(y, `${c} ${i} ${rosto}: raiz em (${x}, ${y})`).toBeLessThan(48);
      }
    }
  });
  it('o alto tem os próprios cordões saindo da linha do cabelo (não uma tampa lisa) — e os da frente nascem na têmpora', () => {
    for (const c of ['trancas', 'locs']) {
      const rs = raizes(html({ cabelo: c, textura: 'crespo' }, 'feminino', 30));
      // Raízes na testa (miolo da cabeça, acima dos olhos) — os cordões do alto.
      expect(rs.filter(([x, y]) => Math.abs(x - 50) < 12 && y < 36).length, c).toBeGreaterThanOrEqual(4);
    }
  });
  it('a velhice tira cordões (menos densidade), a infância encurta — a mesma pessoa nas idades', () => {
    const n = (i: number) => raizes(html({ cabelo: 'trancas', textura: 'crespo' }, 'feminino', i)).length;
    expect(n(75)).toBeLessThan(n(30));
    expect(n(9)).toBeGreaterThan(8);
  });
});

describe('o tipo "encaracolado"', () => {
  it('tem desenho próprio: nem o liso, nem o cacheado, em cortes curtos e longos', () => {
    for (const c of ['curto', 'longo_liso', 'cacheado_longo', 'chanel', 'rabo']) {
      const [l, e, k] = ['liso', 'encaracolado', 'cacheado'].map(t => html({ cabelo: c, textura: t }, 'feminino', 30));
      expect(e, c).not.toBe(l);
      expect(e, c).not.toBe(k);
    }
  });
  it('cabelo com cachos não ganha os traços retos de brilho do liso nos longos', () => {
    const fiosRetos = (h: string) => (h.match(/stroke-linecap="round" opacity="0.42"/g) ?? []).length;
    expect(fiosRetos(html({ cabelo: 'longo_liso', textura: 'liso' }, 'feminino', 30))).toBeGreaterThan(0);
    for (const t of ['encaracolado', 'cacheado', 'crespo']) expect(fiosRetos(html({ cabelo: 'longo_liso', textura: t }, 'feminino', 30)), t).toBe(0);
  });
});

describe('o tipo de cabelo no salão: a aparência muda, a genética não', () => {
  it('alisar aos 25: o visual fica liso; os genes guardam o crespo (é o que passa para os filhos)', () => {
    let v = vida(25, 'crespo');
    expect(texturaNatural(v)).toBe('crespo');
    expect(disponibilidadeAparencia(v, { textura: 'liso' }).grau).toBe('permitido');
    v = executar(v, { tipo: 'aparencia', mudanca: { textura: 'liso' } }).vida;
    expect(v.eu.visual.textura).toBe('liso');
    expect(geneticaDe(v.eu)!.textura).toBe('crespo');
    expect(texturaNatural(v)).toBe('crespo');
    // E fazer cachos depois não apaga o natural.
    v = executar(v, { tipo: 'aparencia', mudanca: { textura: 'encaracolado' } }).vida;
    expect(v.eu.visual.textura).toBe('encaracolado');
    expect(geneticaDe(v.eu)!.textura).toBe('crespo');
  });
  it('antes da idade de decidir o visual, a química espera; o tipo que já é, não se "muda"; um tipo inventado, não existe', () => {
    const v = vida(10, 'cacheado');
    expect(disponibilidadeAparencia(v, { textura: 'liso' }).grau).not.toBe('permitido');
    expect(disponibilidadeAparencia(v, { textura: 'cacheado' }).grau).not.toBe('permitido');
    expect(disponibilidadeAparencia(vida(30), { textura: 'roxo' }).grau).not.toBe('permitido');
  });
  it('voltar ao natural é sempre possível', () => {
    let v = vida(20, 'ondulado');
    v = executar(v, { tipo: 'aparencia', mudanca: { textura: 'liso' } }).vida;
    expect(disponibilidadeAparencia(v, { textura: 'ondulado' }).grau).toBe('permitido');
  });
});

describe('na tela', () => {
  function Ligado({ v0 }: { v0: Vida }) {
    const [v, setV] = useState(v0);
    return <main><AparenciaEEstilo vida={v} agir={(a: Acao) => { setV(executar(v, a).vida); return true; }} irPara={() => {}} /><output data-testid="textura">{v.eu.visual.textura}</output></main>;
  }
  it('Aparência e estilo: "Tipo de cabelo" com os cinco tipos, o natural marcado, a prévia antes e a mudança depois', () => {
    render(<Ligado v0={vida(28, 'cacheado')} />);
    const sel = screen.getByRole('combobox', { name: 'Tipo de cabelo' }) as HTMLSelectElement;
    const opcoes = [...sel.options].map(o => o.textContent);
    expect(opcoes).toEqual(['Liso', 'Ondulado', 'Encaracolado', 'Cacheado (natural)', 'Crespo']);
    fireEvent.change(sel, { target: { value: 'encaracolado' } });
    expect(screen.getByText(/cachos largos e soltos/)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Como ficaria' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mudar o visual' }));
    expect(screen.getByTestId('textura').textContent).toBe('encaracolado');
  });
  it('criança: só o tipo que ela tem (a química ainda passa pela família)', () => {
    render(<Ligado v0={vida(9, 'crespo')} />);
    const sel = screen.queryByRole('combobox', { name: 'Tipo de cabelo' }) as HTMLSelectElement | null;
    if (sel) expect([...sel.options].map(o => o.value)).toEqual(['crespo']);
  });
  it('Nascer sem puxar os pais: escolhe o tipo de cabelo, e é com ele que se nasce', () => {
    const nascidos: { visual?: Visual }[] = [];
    const c = { setTela: () => {}, nascer: (o: { visual?: Visual }) => { nascidos.push(o); } } as unknown as ControleVida;
    render(<Criacao c={c} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Puxar os traços dos pais/ }));
    const sel = screen.getByRole('combobox', { name: 'Tipo de cabelo' }) as HTMLSelectElement;
    expect([...sel.options].map(o => o.value)).toEqual(TIPOS_DE_CABELO.map(t => t.id));
    fireEvent.change(sel, { target: { value: 'encaracolado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    expect(nascidos[0].visual?.textura).toBe('encaracolado');
    const v = criarVida({ nome: 'Lia', sobrenome: 'Melo', genero: 'feminino', municipioId: 'recife-pe', semente: 3, visual: nascidos[0].visual, herdarCores: false });
    expect(v.eu.visual.textura).toBe('encaracolado');
  });
});
