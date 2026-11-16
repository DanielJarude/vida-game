// @vitest-environment jsdom
/**
 * VIDA 24 — as telas: a Aparência por categorias (e a categoria lembrada), o painel Corpo (sem editar proporções; o
 * objetivo não muda o corpo na hora; a projeção na mesma escala), os pelos (fios por região, a idade, os cuidados), o corpo
 * de nascença, a gordura sem ponta, e as joias que eram o mesmo desenho agora diferentes.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import type { Genero, Visual, Vida } from '../../motor/tipos';
import { Figura } from '../avatar/Figura';
import { Retrato } from '../avatar/Retrato';
import { LARGURA_DE_REFERENCIA } from '../avatar/referencia';
import { visualComPecaDoRosto } from '../avatar/MiniaturaDaPeca';
import { AparenciaEEstilo } from '../jogo/Aparencia';
import { CorpoPainel, PelosPainel } from '../v24/Corpo24';
import { CorpoDeNascenca, type EscolhaDoCorpo } from '../telas/CorpoDeNascenca';

afterEach(() => { cleanup(); try { localStorage.clear(); sessionStorage.clear(); } catch { /* */ } });
const base = (x: Partial<Visual> = {}): Visual => ({ pele: 'p3', cabelo: 'raspado', corCabelo: 'preto', olhos: 'castanho', ...x } as Visual);
const vida = (s: number, f: (v: Vida) => void = () => undefined) => transacao(adulto(28, { semente: s, genero: 'masculino' }), x => { x.momento = null; f(x); }).vida;
const semCor = (s: string) => s.replace(/#[0-9a-fA-F]{3,8}\b/g, '#').replace(/ (id|aria-label|clip-path|fill|stroke|opacity)="[^"]*"/g, '');

describe('VIDA 24 · Aparência por categorias', () => {
  it('uma categoria por vez; a escolhida fica lembrada ao sair e voltar', async () => {
    const v = vida(2410);
    const um = render(<AparenciaEEstilo vida={v} agir={() => true} irPara={() => undefined} />);
    const abas = within(um.container).getAllByRole('tab').map(b => b.textContent);
    expect(abas).toEqual(expect.arrayContaining(['Corpo', 'Pele e marcas', 'Pelos', 'Cabelo e rosto', 'Piercings e joias', 'Roupas e estilo']));
    fireEvent.click(within(um.container).getByRole('tab', { name: 'Corpo' }));
    await waitFor(() => expect(um.container.querySelector('[data-c24="corpo"]')).toBeTruthy());
    um.unmount();
    const dois = render(<AparenciaEEstilo vida={v} agir={() => true} irPara={() => undefined} />);
    expect(within(dois.container).getByRole('tab', { name: 'Corpo' }).getAttribute('aria-selected')).toBe('true');
    expect(dois.container.querySelector('[data-categoria="corpo"]')).toBeTruthy();
  });
});

describe('VIDA 24 · Corpo', () => {
  it('sem controles de proporção; a projeção na mesma escala; o objetivo vira ação e não muda o corpo na hora', () => {
    let v = vida(2411, x => { x.rotinas = [{ id: 'academia', tInicio: x.t, nivel: 1 }]; });
    const acoes: Acao[] = [];
    const agir = (a: Acao) => { acoes.push(a); v = executar(v, a).vida; return true; };
    const { container } = render(<CorpoPainel vida={v} agir={agir} />);
    expect(container.querySelector('input[type="range"]')).toBeNull();
    const figs = [...container.querySelectorAll('.c24__fig svg.figura')];
    expect(figs.length).toBe(2);
    expect(new Set(figs.map(f => f.getAttribute('width')))).toEqual(new Set([String(LARGURA_DE_REFERENCIA)]));
    expect(container.querySelector('[data-c24-fig="projecao"]')!.textContent).toMatch(/projeção/);
    fireEvent.click(within(container).getByRole('radio', { name: /Objetivo/ }));
    fireEvent.click(within(container).getByRole('radio', { name: 'Ganhar massa muscular' }));
    expect(container.querySelector('[data-c24-atende="sim"]')).toBeTruthy();
    const antes = JSON.stringify(v.corpo.composicao24);
    fireEvent.click(within(container).getByRole('button', { name: 'Seguir esse plano' }));
    expect(acoes[0]).toMatchObject({ tipo: 'corpo24', op: { o: 'plano', objetivo: 'massa' } });
    expect(v.corpo.plano24?.objetivo).toBe('massa');
    expect(JSON.stringify(v.corpo.composicao24)).toBe(antes);
  });

  it('o que está mudando o corpo é a conta de verdade (o sedentarismo aparece; a constituição de nascença é só consulta)', () => {
    const v = vida(2412, x => { x.rotinas = []; x.corpo.habitos.sedentario = true; });
    const { container } = render(<CorpoPainel vida={v} agir={() => true} />);
    expect(container.textContent).toMatch(/O sedentarismo/);
    fireEvent.click(within(container).getByRole('radio', { name: 'De nascença' }));
    expect(container.querySelectorAll('[data-c24-parte="nascenca"] [data-eixo]').length).toBe(12);
    expect(container.querySelector('[data-c24-parte="nascenca"] input')).toBeNull();
  });
});

describe('VIDA 24 · pelos', () => {
  const pelos = (n: number, i = 30, x: Partial<Visual> = {}) => renderToStaticMarkup(<Figura visual={base({ pelos23: n, ...x })} genero="masculino" idade={i} semente="p" corpo="mediano" pecas={[]} semCima descalco largura={132} />);
  const fios = (s: string) => (s.match(/q -?\d/g) ?? []).length;
  it('são fios (traços curvos), mais com mais pelos; nada na criança; o laser tira da região', () => {
    expect(fios(pelos(3))).toBeGreaterThan(fios(pelos(2)));
    expect(fios(pelos(2))).toBeGreaterThan(fios(pelos(1)));
    expect(fios(pelos(1))).toBeGreaterThan(12);
    expect(pelos(3, 9)).not.toContain('data-regiao-pelo');
    expect(pelos(3)).toContain('data-regiao-pelo="peito"');
    expect(pelos(3, 30, { laser24: ['peito'] })).not.toContain('data-regiao-pelo="peito"');
  });
  it('o painel dos pelos mostra o nível natural e confirma um cuidado como ação', () => {
    let v = vida(2413, x => { x.eu.visual.pelos23 = 3; });
    const acoes: Acao[] = [];
    const { container } = render(<PelosPainel vida={v} agir={a => { acoes.push(a); v = executar(v, a).vida; return true; }} />);
    expect(container.textContent).toMatch(/Muitos/i);
    fireEvent.click(within(container).getByRole('radio', { name: 'Aparar' }));
    fireEvent.click(within(container).getByRole('button', { name: 'Fazer assim' }));
    expect(acoes[0]).toMatchObject({ tipo: 'corpo24', op: { o: 'pelos', metodo: 'aparar' } });
    expect(v.eu.visual.pelos24?.metodo).toBe('aparar');
  });
});

describe('VIDA 24 · corpo de nascença', () => {
  it('três jeitos; escolher mostra as tendências e devolve a constituição escolhida', () => {
    let e: EscolhaDoCorpo = { modo: 'heranca' };
    const { container, rerender } = render(<CorpoDeNascenca escolha={e} aoMudar={x => { e = x; }} genero="feminino" visual={base({ corpo23: '222222222222' })} />);
    expect(container.querySelectorAll('.corpo-nascenca__fig > svg').length).toBe(4);
    fireEvent.click(within(container).getByRole('radio', { name: 'Escolher' }));
    expect(e.modo).toBe('escolher');
    rerender(<CorpoDeNascenca escolha={e} aoMudar={x => { e = x; }} genero="feminino" visual={base({ corpo23: '222222222222' })} />);
    const ombros = container.querySelector('[data-eixo="ombros"] input') as HTMLInputElement;
    fireEvent.change(ombros, { target: { value: '2' } });
    expect(e.c?.charAt(1)).toBe('4');
    expect(container.textContent).toMatch(/Não é o atributo Físico/);
  });
});

describe('VIDA 24 · a gordura sem ponta', () => {
  it('a cintura de quem tem muita gordura nunca passa muito do peito e do quadril (o volume é arredondado)', () => {
    for (const g of ['feminino', 'masculino'] as Genero[]) for (const c of ['222222222222', '222232224232']) {
      const s = renderToStaticMarkup(<Figura visual={base({ corpo23: c })} genero={g} idade={30} semente="g" corpo={{ tipo: 'acima_do_peso', c, comp: { g: 3, m: 0 } }} pecas={[]} semCima descalco largura={132} />);
      const tronco = /<path d="(M [^"]+Z)" fill="#[0-9a-f]+" stroke="#[0-9a-f]+" stroke-width="0.7" stroke-linejoin="round"><\/path>/g;
      const caminhos = [...s.matchAll(tronco)].map(m => m[1]).filter(d => (d.match(/ C /g) ?? []).length >= 8);
      expect(caminhos.length, `${g} ${c}`).toBeGreaterThan(0);
      const xs = caminhos[0].replace(/[MCLQZ]/g, ' ').trim().split(/\s+/).map(Number).filter((_, k) => k % 2 === 0);
      expect(Math.max(...xs) - 60, `${g} ${c}`).toBeLessThan(36);
    }
  });
});

describe('VIDA 24 · joias que eram iguais', () => {
  const corpo = (id: string) => semCor(renderToStaticMarkup(<Figura visual={base()} genero="feminino" idade={30} semente="j" corpo="mediano" pecas={[{ itemId: 'regata', id: 'r' }, { itemId: id, id }]} largura={132} />));
  const rosto = (id: string) => semCor(renderToStaticMarkup(<Retrato visual={visualComPecaDoRosto(base(), id)} genero="feminino" idade={30} semente="j" tamanho={132} />));
  it('os relógios têm construção própria (caixa, pulseira, luneta, submostradores)', () => {
    const r = ['relogio', 'relogio_luxo', 'relogio_ouro', 'relogio_complicacao', 'relogio_mergulho', 'relogio_couro_classico', 'relogio_esportivo_cronografo', 'relogio_titanio', 'relogio_ouro_rose', 'relogio_digital', 'relogio_digital_retro'];
    expect(new Set(r.map(corpo)).size).toBe(r.length);
  });
  it('correntes, pulseiras e anéis de antes diferentes entre si e das novas — no corpo e na vitrine (retrato)', () => {
    for (const [a, b] of [['corrente_grossa', 'gargantilha_couro'], ['guias', 'colar_perolas'], ['pulseira_prata', 'j20_fina_prata'], ['pulseira_ouro', 'j20_elos_ouro_amarelo'], ['anel_prata', 'j20_aro_prata'], ['anel_ouro', 'anel_diamante'], ['anel_grafite', 'j20_aro_titanio']]) expect(corpo(a), `${a} × ${b}`).not.toBe(corpo(b));
    const colares = ['corrente_prata', 'corrente_grossa', 'guias', 'colar_perolas', 'corrente_cruz', 'gargantilha_couro', 'colar_diamantes', 'joia'];
    expect(new Set(colares.map(rosto)).size).toBe(colares.length);
  });
  it('os piercings que só mudavam a cor: calibre, clicker, ferradura, coração, garras', () => {
    const p = (id: string) => semCor(renderToStaticMarkup(<Retrato visual={base({ piercings: [id] })} genero="feminino" idade={30} semente="j" tamanho={132} />));
    for (const [a, b] of [['pc_nariz_argola_ouro', 'pc_nariz_argola_preta'], ['pc_septo_clicker_ouro', 'pc_septo_preto'], ['pc_sobrancelha_argola', 'pc_sobrancelha_argola_azul'], ['pc_sobrancelha_rose', 'pc_sobrancelha_ouro'], ['pc_medusa_zirconia', 'pc_medusa_diamante']]) expect(p(a), `${a} × ${b}`).not.toBe(p(b));
  });
});
