// @vitest-environment jsdom
/**
 * VIDA 12.9 · Presidência na tela: o painel político mostra as regras do país e o que falta para disputar, a corrida
 * (a pesquisa com cada adversário) e o governo do país (a economia, a base, o mundo) — lidos do motor de verdade.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { adulto } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';
import { definirPaisCorrente } from '../../motor/mundo/moeda';
import { entrarNaPolitica, partidosDoPais, processarPolitica, registrarCandidatura, tDaEleicao, tDaPosse } from '../../motor/sistemas/politica';
import { presidencia } from '../../motor/sistemas/presidencia129';
import { criarRng } from '../../motor/rng';
import { PainelPresidencial } from '../jogo/Presidencia129';
import '../../motor/conteudo/acontecimentos129Presidencia';

afterEach(() => cleanup());
const BASE = adulto(30, { semente: 1291 });

function politico(): Vida {
  const v = structuredClone(BASE);
  definirPaisCorrente('BR');
  v.moradia.municipioId = 'sao-paulo-sp'; v.eu.municipioNatal = 'sao-paulo-sp'; v.eu.nacionalidades = ['BR'];
  v.t = tDaEleicao(2030) - 6; v.eu.tNasc = v.t - 52 * 12;
  v.caminhos.politica = undefined; v.trabalho.atual = undefined; v.momento = null;
  delete v.fatos['chegou_cidade'];
  v.anoAtual = { acoes: [] };
  const p = entrarNaPolitica(v, 'comunidade');
  p.partido = partidosDoPais('BR')[0]; p.tFiliacao = v.t - 160; p.fase = 'entre_mandatos'; p.apoio = 75; p.reputacao = 90;
  p.historico.push({ t: v.t - 120, cargo: 'governador', resultado: 'eleito', partido: p.partido }, { t: v.t - 72, cargo: 'governador', resultado: 'concluiu', partido: p.partido });
  return v;
}

describe('o painel da Presidência', () => {
  it('fora da corrida: as regras do país e o que falta (com e sem cumprir)', () => {
    render(<PainelPresidencial vida={politico()} />);
    expect(screen.getByText(/próxima eleição em 2030/)).toBeTruthy();
    expect(screen.getAllByText(/35 anos na posse/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Nacionalidade de nascença/)).toBeTruthy();
  });
  it('em campanha: a pesquisa com você e os adversários (nome e partido)', () => {
    const v = politico();
    registrarCandidatura(v, 'presidente', tDaEleicao(2030));
    render(<PainelPresidencial vida={v} />);
    expect(screen.getByText(/A corrida presidencial · 2030/)).toBeTruthy();
    expect(screen.getByText('Você')).toBeTruthy();
    for (const a of presidencia(v).campanha!.adversarios) expect(screen.getByText(a.nome)).toBeTruthy();
  });
  it('no governo: a economia do país, a base no Congresso e o mundo', () => {
    const v = politico();
    registrarCandidatura(v, 'presidente', tDaEleicao(2030));
    for (const a of presidencia(v).campanha!.adversarios) a.forca = 5;
    v.t = tDaEleicao(2030) + 1; processarPolitica(v, criarRng(1));
    v.t = tDaPosse(2030) + 1; v.anoAtual = { acoes: [] }; processarPolitica(v, criarRng(2));
    render(<PainelPresidencial vida={v} />);
    expect(screen.getByText('O governo do país')).toBeTruthy();
    expect(screen.getByText('Inflação')).toBeTruthy();
    expect(screen.getByText('Base no Congresso')).toBeTruthy();
    expect(screen.getByText(/eleit/)).toBeTruthy();
  });
});
