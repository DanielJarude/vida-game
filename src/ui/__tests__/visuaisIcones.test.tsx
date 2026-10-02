// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DesenhoVeiculo } from '../jogo/material/Desenhos';
import { Retrato } from '../avatar/Retrato';
import { FiguraCao, FiguraGato, morfologiaCao, morfologiaGato } from '../avatar/caesEGatos';
import { GLIFOS, GlifoConquista, GlifoDaLinha, iconeDaConquista } from '../iconesConquista';
import { formaDaVersao, VERSOES_VEICULO, type FormaVeiculo } from '../../motor/dados/bens';
import type { ConquistaEsportiva } from '../../motor/tipos';

afterEach(cleanup);

/** A "assinatura" do desenho: todos os traços, na ordem. */
function traco(el: ReactElement): string {
  const { container } = render(el);
  const d = [...container.querySelectorAll('path, circle, ellipse, rect')].map(x => `${x.tagName}:${x.getAttribute('d') ?? ''}${x.getAttribute('cx') ?? ''},${x.getAttribute('cy') ?? ''},${x.getAttribute('r') ?? x.getAttribute('rx') ?? ''},${x.getAttribute('ry') ?? ''}`).join('|');
  cleanup();
  return d;
}
const EMOJI = /\p{Extended_Pictographic}/u;

describe('aviões: famílias morfológicas', () => {
  const AVIOES: FormaVeiculo[] = ['ultraleve', 'monomotor', 'asa_baixa', 'bimotor', 'jato'];

  it('cada família tem silhueta própria (não é a mesma linha com variação)', () => {
    const tracos = AVIOES.map(f => traco(<DesenhoVeiculo forma={f} />));
    expect(new Set(tracos).size).toBe(AVIOES.length);
    // Desenhos de verdade, não três riscos.
    for (const t of tracos) expect(t.split('|').length).toBeGreaterThanOrEqual(8);
  });

  it('o que separa as famílias está no desenho: hélice no nariz, naceles, janelinhas do jato, asa alta × baixa', () => {
    const conta = (f: FormaVeiculo, sel: string) => { const { container } = render(<DesenhoVeiculo forma={f} />); const n = container.querySelectorAll(sel).length; cleanup(); return n; };
    // O jato não tem hélice (o disco translúcido); o bimotor tem a da nacele; o monomotor, a do nariz.
    const helices = (f: FormaVeiculo) => conta(f, 'ellipse[fill-opacity="0.22"]');
    expect(helices('jato')).toBe(0);
    expect(helices('monomotor')).toBe(1);
    expect(helices('bimotor')).toBeGreaterThanOrEqual(1);
    // O jato tem a fileira de janelinhas redondas.
    expect(conta('jato', 'circle[fill-opacity="0.5"]')).toBeGreaterThanOrEqual(5);
    // Asa alta (montante) × asa baixa: a asa do monomotor fica acima da cabine, a do asa-baixa embaixo.
    const asaY = (f: FormaVeiculo) => { const { container } = render(<DesenhoVeiculo forma={f} />); const ys = [...container.querySelectorAll('path[stroke-width="1.2"]')].map(p => Number((p.getAttribute('d') ?? '').match(/^M[\d.]+ ([\d.]+)/)?.[1] ?? NaN)).filter(Number.isFinite); cleanup(); return ys[0]; };
    expect(asaY('monomotor')).toBeLessThan(10);
    expect(asaY('asa_baixa')).toBeGreaterThan(14);
  });

  it('o catálogo usa as famílias: Archer é asa baixa, Skyhawk é asa alta, os ultraleves são ultraleves', () => {
    const f = (id: string) => formaDaVersao(VERSOES_VEICULO.find(x => x.id === id));
    expect(f('piper_archer')).toBe('asa_baixa');
    expect(f('cessna_172')).toBe('monomotor');
    expect(f('paradise_p1')).toBe('ultraleve');
    expect(formaDaVersao({ id: 'x', classe: 'monomotor', marca: 'X', modelo: 'Y', dica: 'jato executivo leve', faixa: 'alta', preco: 1, artigo: 'o', pesoUsado: 1 } as never)).toBe('jato');
    expect(formaDaVersao({ id: 'x', classe: 'monomotor', marca: 'X', modelo: 'Y', dica: 'bimotor de seis lugares', faixa: 'alta', preco: 1, artigo: 'o', pesoUsado: 1 } as never)).toBe('bimotor');
  });
});

describe('moto aquática: desenho próprio', () => {
  it('não é a lancha nem o veleiro, e tem banco, guidão e o jato de espuma', () => {
    const jet = traco(<DesenhoVeiculo forma="jetski" />);
    expect(jet).not.toBe(traco(<DesenhoVeiculo forma="lancha" />));
    expect(jet).not.toBe(traco(<DesenhoVeiculo forma="veleiro" />));
    const { container } = render(<DesenhoVeiculo forma="jetski" rotulo="moto aquática" />);
    // O banco (massa mais cheia), o guidão (traço grosso), as gotas do jato.
    expect(container.querySelectorAll('path[fill-opacity="0.55"]').length).toBe(1);
    expect(container.querySelectorAll('path[stroke-width="2.4"]').length).toBe(1);
    expect(container.querySelectorAll('circle').length).toBeGreaterThanOrEqual(2);
  });
});

describe('cães e gatos: famílias morfológicas, não a mesma forma com outra cor', () => {
  const ids = Array.from({ length: 24 }, (_, i) => `pessoa_${i * 37 + 5}`);
  const COR_CAO = { cor: '#8a5a32', padrao: 'liso' as const, coleira: '#b8442e' };
  const COR_GATO = { cor: '#7d7670', padrao: 'liso' as const, olho: '#c9b23a' };

  it('cachorros variam em porte, corpo, perna, focinho, orelha, cauda e pelagem', () => {
    const ms = ids.map((id, k) => morfologiaCao(id, (['pequeno', 'medio', 'grande'] as const)[k % 3]));
    for (const traço of ['corpo', 'pernas', 'focinho', 'orelhas', 'cauda', 'pelo'] as const) expect(new Set(ms.map(m => m[traço])).size, traço).toBeGreaterThanOrEqual(3);
    const combos = new Set(ms.map(m => [m.porte, m.corpo, m.pernas, m.focinho, m.orelhas, m.cauda, m.pelo].join('/')));
    expect(combos.size).toBeGreaterThanOrEqual(20);
  });

  it('com a cor fixa (sem nome, sem raça, sem cor), os cachorros continuam indivíduos diferentes', () => {
    const tracos = ids.map(id => traco(<svg><FiguraCao m={{ ...morfologiaCao(id), ...COR_CAO }} /></svg>));
    expect(new Set(tracos).size).toBe(ids.length);
  });

  it('o porte muda o desenho e a mesma identidade dá sempre o mesmo bicho', () => {
    expect(morfologiaCao('pessoa_9', 'pequeno')).toEqual(morfologiaCao('pessoa_9', 'pequeno'));
    const a = traco(<Retrato genero="masculino" idade={3} especie="cachorro" semente="pessoa_9" porte="pequeno" />);
    expect(a).toBe(traco(<Retrato genero="masculino" idade={3} especie="cachorro" semente="pessoa_9" porte="pequeno" />));
    expect(a).not.toBe(traco(<Retrato genero="masculino" idade={3} especie="cachorro" semente="pessoa_9" porte="grande" />));
  });

  it('a raça (quando houver) fixa traços sem quebrar o resto', () => {
    const m = morfologiaCao('x', 'pequeno', { pernas: 'curtas', corpo: 'comprido', orelhas: 'longas' });
    expect([m.pernas, m.corpo, m.orelhas]).toEqual(['curtas', 'comprido', 'longas']);
  });

  it('gatos variam em constituição, cabeça, orelha, cauda, postura e pelo — e diferem com a cor fixa', () => {
    const ms = ids.map(id => morfologiaGato(id));
    for (const traço of ['corpo', 'cabeca', 'orelhas', 'cauda', 'postura', 'pelo'] as const) expect(new Set(ms.map(m => m[traço])).size, traço).toBeGreaterThanOrEqual(2);
    expect(new Set(ms.map(m => [m.corpo, m.cabeca, m.orelhas, m.cauda, m.postura, m.pelo].join('/'))).size).toBeGreaterThanOrEqual(15);
    const tracos = ids.map(id => traco(<svg><FiguraGato m={{ ...morfologiaGato(id), ...COR_GATO }} /></svg>));
    expect(new Set(tracos).size).toBe(ids.length);
  });

  it('o retrato do pet marca a morfologia (cão e gato de corpo inteiro)', () => {
    const { container } = render(<Retrato genero="feminino" idade={4} especie="gato" semente="pessoa_77" rotulo="Mia" />);
    expect(container.querySelector('[data-morfo^="gato:"]')).not.toBeNull();
    cleanup();
    const r = render(<Retrato genero="masculino" idade={4} especie="cachorro" semente="pessoa_77" porte="medio" rotulo="Bidu" />);
    expect(r.container.querySelector('[data-morfo^="cao:medio/"]')).not.toBeNull();
  });
});

describe('iconografia das conquistas', () => {
  const c = (tipo: ConquistaEsportiva['tipo'], modalidade: ConquistaEsportiva['modalidade'], texto: string): ConquistaEsportiva => ({ tipo, modalidade, ano: 2041, t: 0, competicao: 'x', texto });

  it('cada tipo tem o seu glifo, respeitando a modalidade (não é tudo taça, não é tudo futebol)', () => {
    expect(iconeDaConquista(c('titulo', 'futebol', 'Campeão da Série A com o Bahia'))).toBe('taca');
    expect(iconeDaConquista(c('titulo', 'basquete', 'Campeão do NBB'))).toBe('taca');
    expect(iconeDaConquista(c('titulo', 'natacao', 'Campeã do Troféu Brasil de natação nos 200 m livre'))).toBe('podio');
    expect(iconeDaConquista(c('titulo', 'atletismo', 'Campeão do brasileiro de atletismo nos 400 m'))).toBe('podio');
    expect(iconeDaConquista(c('titulo', 'lutas', 'Campeão do brasileiro de lutas, na categoria até 81 kg'))).toBe('cinturao');
    expect(iconeDaConquista(c('final', 'tenis', 'Final do torneio de Buenos Aires'))).toBe('final');
    expect(iconeDaConquista(c('acesso', 'futebol', 'Acesso para a Série B'))).toBe('acesso');
    expect(iconeDaConquista(c('rebaixamento', 'volei', 'Rebaixamento da Superliga'))).toBe('queda');
    expect(iconeDaConquista(c('premio', 'basquete', 'Cestinha do NBB, com 21,4 pontos por jogo'))).toBe('premio');
    expect(iconeDaConquista(c('selecao', 'atletismo', 'Medalha de bronze — Pan-Americano'))).toBe('medalha');
    expect(iconeDaConquista(c('selecao', 'volei', 'Estreia pela seleção'))).toBe('bandeira');
    expect(iconeDaConquista(c('selecao', 'futebol', 'Capitão da seleção'))).toBe('bracadeira');
    expect(iconeDaConquista(c('marco', 'futebol', 'Recebeu a braçadeira de capitão do Bahia'))).toBe('bracadeira');
    expect(iconeDaConquista(c('marco', 'tenis', 'Entrou entre os 100 melhores do ranking mundial'))).toBe('ranking');
    expect(iconeDaConquista(c('marco', 'natacao', 'Primeira temporada como profissional'))).toBe('marco');
    // Uma família sem iconografia ainda não ganha glifo (a arte, a academia, a política entram no registro depois).
    expect(iconeDaConquista({ tipo: 'premio', texto: 'Prêmio de pesquisa' }, 'academia')).toBeUndefined();
  });

  it('a linha escrita encontra a conquista (nos dois formatos) e o glifo sai sem emoji, monocromático e decorativo', () => {
    const pal = [c('titulo', 'lutas', 'Campeão do brasileiro de lutas'), c('final', 'tenis', 'Final do torneio de Santiago')];
    const { container } = render(<ul><li><GlifoDaLinha palmares={pal} linha="2041 · Campeão do brasileiro de lutas (titular)" /></li><li><GlifoDaLinha palmares={pal} linha="Final do torneio de Santiago (2041)" /></li><li><GlifoDaLinha palmares={pal} linha="sem par" /></li></ul>);
    expect([...container.querySelectorAll('[data-glifo]')].map(x => x.getAttribute('data-glifo'))).toEqual(['cinturao', 'final']);
    cleanup();
    for (const g of GLIFOS) {
      const r = render(<GlifoConquista glifo={g} />);
      const svg = r.container.querySelector('svg')!;
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(r.container.innerHTML).not.toMatch(EMOJI);
      // Só currentColor: nenhuma cor fixa.
      expect(r.container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}/i);
      cleanup();
    }
  });
});
