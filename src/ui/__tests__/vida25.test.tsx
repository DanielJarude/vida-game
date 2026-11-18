// @vitest-environment jsdom
/**
 * VIDA 25 — as telas: a porta e a carreira de e-sports (os jogos do ano, o caminho, a ficha, a temporada, a proposta), a
 * ficha do atleta nas modalidades tradicionais (grupos, antes/agora só com fotografia), a formação ano a ano, o lembrete
 * da CNH (aparece com motivo, some com "agora não") e o corpo em quatro partes.
 */
import { atributosDaCarreira } from '../../motor/sistemas/atributosEsportivos';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import { nova, viver } from '../../motor/__tests__/ajuda';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import { carregarMundo } from '../../motor/mundo/carregar';
import type { CarreiraEsportiva, Vida } from '../../motor/tipos';
import { Esports25 } from '../v25/esports/Esports25';
import { FichaDoEsporte25 } from '../v25/ficha/FichaDoEsporte25';
import { Formacao25 } from '../v25/formacao/Formacao25';
import { LembreteCnh25 } from '../v25/cnh/LembreteCnh25';
import { CorpoPainel } from '../v24/Corpo24';

beforeAll(async () => { await carregarMundo(); });
afterEach(() => { cleanup(); try { localStorage.clear(); } catch { /* */ } });

function aos(idade: number, s = 2501): Vida { const v = nova({ semente: s, genero: 'feminino', municipioId: 'recife-pe' } as never); v.t = v.eu.tNasc + idade * 12; v.momento = null; return v; }

describe('VIDA 25 · e-sports na tela', () => {
  it('a porta mostra só os jogos que existem no ano e começa a carreira', () => {
    let v = aos(15);
    let agiu: Acao | undefined;
    const r = render(<Esports25 vida={v} agir={a => { agiu = a; return true; }} />);
    fireEvent.click(within(r.container).getByRole('button', { name: /Escolher o jogo/ }));
    const botoes = within(r.container).getAllByRole('button', { name: /^Competir em/ });
    expect(botoes.length).toBe(6);
    fireEvent.click(within(r.container).getByRole('button', { name: /Competir em VALORANT/ }));
    expect(agiu).toEqual({ tipo: 'esports25', oque: { op: 'comecar', jogo: 'valorant' } });
    v = executar(v, agiu!).vida;
    cleanup();
    const c = render(<Esports25 vida={v} agir={() => true} />);
    expect(c.container.textContent).toMatch(/E-sports · VALORANT/);
    expect(c.container.querySelectorAll('.esp25__degrau').length).toBe(5);
    expect(c.container.querySelector('.esp25__degrau--atual')?.textContent).toMatch(/Ranqueadas/);
    expect(c.container.querySelectorAll('[data-atributo]').length).toBeGreaterThanOrEqual(6);
  });
  it('depois de temporadas, a última temporada e o histórico aparecem; a proposta tem aceitar e recusar', () => {
    let v = aos(15, 2502);
    v = executar(v, { tipo: 'esports25', oque: { op: 'comecar', jogo: 'cs' } } as Acao).vida;
    v = viver(v, 2);
    v = transacao(v, x => { x.momento = null; x.esports25!.proposta = { equipe: 'Graúna Gaming', nivel: 2, forca: 48, salario: 0, meses: 12, validaAte: x.t + 11, origem: 'peneira', titular: true }; }).vida;
    const r = render(<Esports25 vida={v} agir={() => true} />);
    expect(r.container.querySelector('.esp25__temporada')?.textContent).toMatch(/Temporada \d{4}/);
    expect(within(r.container).getByRole('group', { name: 'Proposta na mesa' }).textContent).toMatch(/Graúna Gaming/);
    expect(within(r.container).getByRole('button', { name: 'Aceitar' })).toBeTruthy();
    expect(r.container.textContent).toMatch(/equipes, adversários, resultados e contratos são simulação/);
  });
});

describe('VIDA 25 · ficha do atleta e formação', () => {
  it('a ficha agrupa os atributos da modalidade e só compara com fotografia anterior', () => {
    const v = adulto(24, { semente: 2503 });
    const e = { modalidade: 'volei', fase: 'profissional', clube: 'x', nivel: 2, tInicio: 0, tFase: 0, lesoes: 0, municipioId: 'recife-pe' } as CarreiraEsportiva;
    const r = render(<FichaDoEsporte25 vida={v} e={e} />);
    // VIDA 26: o conjunto completo da função (técnicos, táticos, físicos, mentais).
    expect(r.container.querySelectorAll('[data-atributo]').length).toBe(atributosDaCarreira(e, undefined, undefined, v).length);
    expect(r.container.querySelectorAll('[data-atributo]').length).toBeGreaterThanOrEqual(8);
    expect(r.container.querySelector('.f25-attr__antes')).toBeNull();
    expect(r.container.textContent).toMatch(/A comparação com o ano anterior aparece/);
    cleanup();
    const e2 = { ...e, serieAtributos: [{ ano: 2030, tecnica: 60, a: { ataque: 58, recepcao: 60, bloqueio: 61, saque: 59 } }, { ano: 2031, tecnica: 62, a: { ataque: 63, recepcao: 61, bloqueio: 61, saque: 60 } }] };
    const r2 = render(<FichaDoEsporte25 vida={v} e={e2} />);
    // Só os atributos da função que estavam na fotografia anterior têm a marca do ano anterior.
    const naFoto = atributosDaCarreira(e, undefined, undefined, v).filter(([id]) => ['ataque', 'recepcao', 'bloqueio', 'saque'].includes(id)).length;
    expect(r2.container.querySelectorAll('.f25-attr__antes').length).toBe(naFoto);
    expect(naFoto).toBeGreaterThan(0);
    expect(within(r2.container).getByText('Técnicos')).toBeTruthy();
    expect(within(r2.container).getByText('Mentais e comportamentais')).toBeTruthy();
  });
  it('a formação mostra as categorias, o ano a ano e os títulos registrados', () => {
    const v = aos(17, 2504);
    const e = { modalidade: 'futebol', fase: 'base', clube: 'Sport', nivel: 1, tInicio: v.t - 36, tFase: v.t - 36, lesoes: 0, municipioId: 'recife-pe', formacao: [
      { ano: 2040, idade: 15, categoria: 'sub-15', clube: 'Sport', competicao: 'campeonato estadual sub-15', jogos: 16, titular: 12, gols: 4, assistencias: 3, nota: 7.1, tecnica: 66, colocacao: 1, participantes: 16, titulo: true, avaliacao: 'Evoluiu dentro do esperado.' },
      { ano: 2041, idade: 16, categoria: 'sub-17', clube: 'Sport', competicao: 'campeonato estadual sub-17', jogos: 20, titular: 9, gols: 2, assistencias: 1, nota: 6.0, tecnica: 70, colocacao: 4, participantes: 16, avaliacao: 'Oscilou, mais vezes no banco do que em campo.' }
    ] } as CarreiraEsportiva;
    const r = render(<Formacao25 vida={v} e={e} />);
    expect([...r.container.querySelectorAll('.form25__degrau')].map(x => x.textContent)).toEqual(['Sub-15', 'Sub-17']);
    expect(r.container.querySelectorAll('tbody tr').length).toBe(2);
    expect(r.container.querySelector('.form25__titulos')?.textContent).toMatch(/sub-15/);
    expect(r.container.textContent).toMatch(/Oscilou/);
  });
});

describe('VIDA 25 · CNH e corpo', () => {
  it('o lembrete da carteira aparece aos 18 e some com "agora não"', () => {
    const v = aos(18, 2505);
    const r = render(<LembreteCnh25 vida={v} agir={() => true} />);
    expect(r.container.querySelector('[data-motivo="idade"]')).toBeTruthy();
    fireEvent.click(within(r.container).getByRole('button', { name: 'Agora não' }));
    expect(r.container.querySelector('.lembrete-cnh')).toBeNull();
    cleanup();
    const r2 = render(<LembreteCnh25 vida={v} agir={() => true} />);
    expect(r2.container.querySelector('.lembrete-cnh')).toBeNull();
    cleanup();
    const r3 = render(<LembreteCnh25 vida={aos(16, 2506)} agir={() => true} />);
    expect(r3.container.querySelector('.lembrete-cnh')).toBeNull();
  });
  it('o corpo tem quatro partes: condição atual, evolução, objetivo e constituição', () => {
    const v = transacao(adulto(30, { semente: 2507 }), x => { x.momento = null; }).vida;
    const r = render(<CorpoPainel vida={v} agir={() => true} />);
    const nomes = within(r.container).getAllByRole('radio').map(x => x.textContent);
    expect(nomes).toEqual(expect.arrayContaining(['Condição atual', 'Evolução', 'Constituição']));
    expect(r.container.querySelector('[data-c24-parte="agora"]')?.textContent).toMatch(/mesmo número do atributo Físico/);
    fireEvent.click(within(r.container).getByRole('radio', { name: 'Evolução' }));
    expect(r.container.querySelector('[data-c24-parte="evolucao"]')?.textContent).toMatch(/O que está mudando/);
    fireEvent.click(within(r.container).getByRole('radio', { name: 'Constituição' }));
    expect(r.container.querySelector('[data-c24-parte="nascenca"]')?.textContent).toMatch(/Altura adulta/);
  });
});
