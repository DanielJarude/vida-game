// @vitest-environment jsdom
/**
 * REWORK 9.5 — A vida em objetos (a interface).
 *
 * Fase A: Minha Semana diz a rotina em três leituras (horários, exigência, cabeça) que não se contradizem; a dedicação
 * aos estudos diz antes o que pede (as horas) e o que tende a dar.
 * Fase B: a escola é um boletim (o domínio do motor, a evolução com causa, a frequência real, nenhum valor de enfeite);
 * cada habilidade é uma ficha — e aparece uma vez só.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { avancarAno } from '../../motor/ano';
import { criarVida } from '../../motor/criacao';
import { transacao } from '../../motor/nucleo';
import { avaliarRotina } from '../../motor/sistemas/avaliacaoDaRotina';
import { presencaNaEscola, previsaoDaPostura } from '../../motor/sistemas/agenda';
import { evolucaoDaFrente } from '../../motor/sistemas/progressao';
import { estagioDaFrente } from '../../motor/sistemas/frentes';
import { MATERIAS } from '../../motor/dados/frentes';
import type { Rotina, Vida } from '../../motor/tipos';
import { Tempo } from '../jogo/Tempo';
import { Voce } from '../jogo/Voce';
import { Estudos } from '../jogo/Estudos';
import { DesenvolvimentoReal } from '../jogo/Progresso';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  const r = criarRng(20261018); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const nada = () => {};
const rot = (id: string, nivel: 1 | 2 | 3, t: number): Rotina => ({ id, nivel, tInicio: t });
function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 12): Vida {
  let v = criarVida({ nome: 'Ana', sobrenome: 'Reis', genero: 'feminino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  return transacao(v, ajuste).vida;
}
/** A criança do playtest: escola, futebol duas vezes, leitura, xadrez — e estresse de 11%. */
const crianca = () => vidaAos(9, x => { x.mente.estresse = 11; x.rotinas = [rot('futebol', 2, x.t - 12), rot('leitura', 1, x.t - 12), rot('xadrez', 2, x.t - 12)]; });

describe('Fase A · Minha Semana: as três leituras da rotina', () => {
  it('a criança do playtest: nenhuma contradição na tela (cabeça tranquila, semana que ainda tem horário)', () => {
    const v = crianca();
    render(<main><Tempo vida={v} agir={() => true} aba="semana" /></main>);
    const notas = screen.getByRole('region', { name: 'Como está a rotina' });
    const av = avaliarRotina(v);
    expect(notas.textContent).toContain(av.resumo);
    expect(notas.textContent).toMatch(/Ainda há horários disponíveis/);
    const tudo = screen.getByRole('main').textContent!;
    expect(tudo).not.toMatch(/não cabe mais nada|Sobra espaço para descansar|mais atividades do que cabe/i);
    // cada nota diz uma coisa: horários, exigência, cabeça — com o número do motor
    expect(within(notas).getByRole('article', { name: 'Horários' }).textContent).toContain(`${av.horarios.livres} h livres`);
    expect(within(notas).getByRole('article', { name: 'Cabeça' }).textContent).toContain(`${av.cabeca.valor}%`);
  });

  it('a dedicação diz antes o que pede: as horas de estudo em casa e o preço, da mesma conta do motor', () => {
    const v = crianca();
    render(<main><Estudos vida={v} agir={() => true} irPara={nada} parte="agora" /></main>);
    const grupo = screen.getByRole('radiogroup', { name: 'Postura nos estudos' });
    const ded = within(grupo).getByRole('radio', { name: /Com dedicação/ });
    const pv = previsaoDaPostura(v, 'dedicada');
    expect(ded.textContent).toContain(`+${String(pv.horas).replace('.', ',')} h por semana`);
    expect(ded.textContent).toContain(pv.custo);
    expect(within(grupo).getByRole('radio', { name: /Empurrando/ }).textContent).toMatch(/devolve tempo/);
    expect(within(grupo).getByRole('radio', { checked: true }).textContent).toMatch(/No ritmo/);
  });
});

describe('Fase B · o boletim e as fichas', () => {
  it('o boletim mostra o domínio do motor, a evolução com causa e a frequência real — e nenhuma nota por matéria inventada', () => {
    const v = vidaAos(13);
    render(<main><DesenvolvimentoReal vida={v} /></main>);
    const b = screen.getByRole('region', { name: 'Boletim escolar' });
    for (const d of MATERIAS.filter(m => v.caminhos.frentes[m])) {
      const e = evolucaoDaFrente(v, d)!;
      const linha = b.querySelector(`[data-frente="${d}"]`)!;
      expect(Number(linha.querySelector('[data-agora]')!.getAttribute('data-agora'))).toBe(e.agora);
      for (const [fonte, x] of e.causas) if (Math.abs(x) >= 0.1) expect(linha.querySelector(`[data-fonte="${fonte}"]`)).toBeTruthy();
      expect(linha.textContent!.toLowerCase()).toContain(estagioDaFrente(v, d).palavra.toLowerCase());
    }
    expect(Number(b.querySelector('[data-nota="escola"]')!.getAttribute('data-agora'))).toBe(v.educacao.basica!.desempenho);
    expect(Number(b.querySelector('[data-frequencia]')!.getAttribute('data-frequencia'))).toBe(Math.round(presencaNaEscola(v) * 100));
    expect(b.textContent).toContain(`${v.eu.nome} ${v.eu.sobrenome}`);
    // as matérias aparecem uma vez só em Desenvolvimento (antes: "Como você está se saindo" + "As matérias")
    expect(screen.queryByRole('region', { name: 'As matérias' })).toBeNull();
  });

  it('Português de 3,2 para 8,6 aos 8 anos: o boletim não diz mais "tropeça na redação"', () => {
    const v = vidaAos(8, x => { const f = x.caminhos.frentes.linguagens!; f.habilidade = 8.6; f.auge = Math.max(f.auge, 8.6); });
    render(<main><DesenvolvimentoReal vida={v} /></main>);
    const linha = screen.getByRole('region', { name: 'Boletim escolar' }).querySelector('[data-frente="linguagens"]')!;
    expect(linha.textContent).not.toMatch(/tropeça/);
    expect(linha.textContent).toMatch(/esperado/);
  });

  it('em Você, cada habilidade é uma ficha — e cada uma aparece uma vez só', () => {
    const v = vidaAos(12, x => { x.rotinas = [rot('xadrez', 2, x.t - 24), rot('futebol', 2, x.t - 24)]; });
    const w = avancarAno(avancarAno(v).vida).vida;
    w.momento = null;
    render(<main><Voce vida={w} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    const fichas = [...document.querySelectorAll('.ficha-hab')].map(x => x.getAttribute('data-frente'));
    expect(fichas.length).toBeGreaterThan(0);
    expect(new Set(fichas).size).toBe(fichas.length);
    const xadrez = document.querySelector('.ficha-hab[data-frente="xadrez"]');
    if (xadrez) expect(xadrez.textContent).toMatch(/No último ano/);
  });
});
