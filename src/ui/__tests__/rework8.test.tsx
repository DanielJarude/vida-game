// @vitest-environment jsdom
/**
 * REWORK 8 (Fase A) — a correção isolada do bug dos presentes.
 *
 * O que era: ao abrir "Dar um presente", os nomes saíam numa coluna estreitíssima, quebrando letra por letra, e o "Dar",
 * o preço e o resto ficavam desalinhados. Duas causas reais, em estilos compartilhados:
 *   1. a grade do presente era `36px 1fr auto`; quando o presente não podia ser dado, o `BotaoAcao` punha o MOTIVO
 *      ("Custa R$ 570; na conta há R$ 0.") dentro da coluna `auto` do botão, que crescia até caber a frase inteira e
 *      espremia o `1fr` do nome;
 *   2. `.objeto` era a classe de dois componentes (o cartão de Pertences, com padding de 16 px, e o desenho do objeto):
 *      o desenho do presente virava um quadradinho cinza.
 * Este teste trava a estrutura e o contrato do CSS (o jsdom não mede layout); a geometria de verdade — o nome com
 * largura, em 360/390/1440 px, sem e com dinheiro, e as outras interfaces com a mesma estrutura (cada loja, pertences,
 * a ficha da prática) — é medida no navegador por `scripts/playtest/colunas8.mjs` (102 telas, 0 problemas).
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { executar, type Acao } from '../../motor/acoes';
import { vincular } from '../../motor/pessoas';
import { adulto, pessoaNova } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';
import { Pessoas } from '../jogo/Pessoas';
import { DesenhoObjeto } from '../jogo/material/Objetos';

const UI = join(__dirname, '..');
const CSS = ['vida.css', 'vivida.css', 'agir.css', 'material.css', 'experiencia.css', 'cotidiano.css', 'sistema.css'].map(f => [f, readFileSync(join(UI, f), 'utf8')] as const);

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; const r = criarRng(20261018); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Tela({ v0 }: { v0: Vida }) {
  const [v, setV] = useState(v0);
  const [aberta, setAberta] = useState<string | null>(null);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return true; };
  return <main><Pessoas vida={v} agir={agir} aberta={aberta} abrir={setAberta} /></main>;
}

function comAmiga(conta: number) {
  const v = adulto(30, { semente: 17 });
  v.financas.conta = conta;
  v.financas.investimentos = [];
  const p = pessoaNova(v, 30, 'feminino');
  const vin = vincular(v, p, { origem: 'trabalho', proximidade: 70, convivio: [] });
  vin.estagio = 'amigo_proximo';
  p.municipioId = v.moradia.municipioId;
  return { v, p };
}

function abrirPresentes(v: Vida, nome: string) {
  render(<Tela v0={v} />);
  fireEvent.click(screen.getAllByRole('button', { name: new RegExp(nome) })[0]);
  const ficha = screen.getByRole('dialog', { name: nome });
  fireEvent.click(within(ficha).getByRole('button', { name: new RegExp(`^Dar um presente a ${nome}`) }));
  return ficha;
}

describe('os presentes: cada um com nome, tipo, descrição, preço, disponibilidade e o botão', () => {
  it('sem dinheiro: cada presente diz o que é e por que não dá — o motivo fica FORA da coluna do botão', () => {
    const { v, p } = comAmiga(0);
    const ficha = abrirPresentes(v, p.nome);
    const itens = ficha.querySelectorAll('li.presente');
    expect(itens.length).toBeGreaterThan(2);
    for (const li of itens) {
      expect(li.querySelector('.presente__nome')?.textContent?.length).toBeGreaterThan(2);
      expect(li.querySelector('.presente__tipo')?.textContent).toMatch(/·/);
      expect(li.querySelector('.presente__descricao')?.textContent?.length).toBeGreaterThan(5);
      expect(li.classList.contains('presente--bloqueado')).toBe(true);
      const dar = within(li as HTMLElement).getByRole('button', { name: 'Dar' }) as HTMLButtonElement;
      expect(dar.disabled).toBe(true);
      // O motivo é irmão do botão dentro do `.acao` (que some da grade: `display: contents`) — ganha a linha de baixo.
      const motivo = li.querySelector('.acao__motivo');
      expect(motivo?.textContent).toMatch(/Custa .+; na conta há/);
      expect(motivo?.parentElement).toBe(dar.parentElement);
      // O desenho é o desenho (não o cartão de Pertences).
      expect(li.querySelector('svg.desenho-objeto')).toBeTruthy();
    }
  });

  it('com dinheiro: dá para dar, e a moeda e os valores grandes cabem na linha do tipo', () => {
    const { v, p } = comAmiga(500000);
    const ficha = abrirPresentes(v, p.nome);
    const dar = within(ficha).getAllByRole('button', { name: 'Dar' }).filter(b => !(b as HTMLButtonElement).disabled);
    expect(dar.length).toBeGreaterThan(0);
    for (const t of ficha.querySelectorAll('.presente__tipo')) expect(t.textContent).toMatch(/R\$ [\d.]+/);
  });

  it('o contrato do CSS: a coluna do texto nunca é espremida; o motivo mora numa linha própria', () => {
    const vivida = CSS.find(([f]) => f === 'vivida.css')![1];
    expect(vivida).toMatch(/\.presente \{[^}]*grid-template-columns: 40px minmax\(0, 1fr\) auto;[^}]*grid-template-areas: 'objeto texto botao' '\. motivo motivo'/);
    expect(vivida).toMatch(/\.presente > \.acao \{ display: contents; \}/);
    expect(vivida).toMatch(/\.presente > \.acao > \.acao__motivo[^{]*\{ grid-area: motivo;/);
    expect(vivida).toMatch(/\.presente__texto \{[^}]*min-width: 0/);
  });

  it('`.objeto` (o cartão) e o desenho de um objeto não dividem mais a classe', () => {
    const { container } = render(<DesenhoObjeto coisaId="violao" />);
    expect(container.querySelector('svg')!.getAttribute('class')).toBe('desenho-objeto');
    const comObjeto = CSS.filter(([, s]) => /(^|\n)\.objeto \{/.test(s)).map(([f]) => f);
    expect(comObjeto).toEqual(['material.css']);
  });
});
