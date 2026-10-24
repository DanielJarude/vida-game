// @vitest-environment jsdom
/**
 * REWORK 11.5 · Fases G e H — as interfaces das carreiras especiais e a galeria, com o motor de verdade por trás:
 * cada botão muda o estado (nada é enfeite), e cada tela mostra o que a carreira tem.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { adulto } from '../../motor/__tests__/cenarios';
import { transacao } from '../../motor/nucleo';
import { executar, type Acao } from '../../motor/acoes';
import type { CarreiraEsportiva, Vida } from '../../motor/tipos';
import { entrarNaPolitica } from '../../motor/sistemas/politica';
import { entrar } from '../../motor/sistemas/ilicito';
import { criarContato } from '../../motor/sistemas/submundo';
import { CampoDoAtleta, PlenarioDoPolitico, PranchetaDoTecnico } from '../jogo/CarreirasEspeciais';
import { PainelDoSubmundo } from '../jogo/Submundo';
import { GaleriaDeConquistas } from '../jogo/Galeria';
import { Momento } from '../jogo/Momento';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { aceitarPropostaDeTecnico, passagemAtual, processarTecnico } from '../../motor/sistemas/tecnico';
import { garantirFrente } from '../../motor/sistemas/frentes';
import { conteudoPorId, preparar, abrirDecisao } from '../../motor/conteudo/motor';
import { CATALOGO } from '../../motor/conteudo/catalogo';

afterEach(() => cleanup());

/** Um palco de teste: a tela com o motor de verdade (o clique executa a ação e a tela redesenha). */
function Palco({ inicial, Tela }: { inicial: Vida; Tela: (p: { vida: Vida; agir: (a: Acao) => boolean }) => ReactNode }) {
  const [v, setV] = useState(inicial);
  return <main><Tela vida={v} agir={a => { const r = executar(v, a); setV(r.vida); return true; }} /><output data-testid="estado">{JSON.stringify({ estilo: r(v).estilo, aliancas: v.caminhos.politica?.aliancas?.length ?? 0, estoque: v.caminhos.envolvimento?.especializacoes?.contrabando?.estoque ?? 0 })}</output></main>;
}
const r = (v: Vida) => ({ estilo: v.caminhos.tecnico?.estilo ?? 'equilibrado' });
const estado = () => JSON.parse(screen.getByTestId('estado').textContent!);

describe('REWORK 11.5 · interfaces', () => {
  it('o plenário: fechar uma aliança no botão cria a aliança e a promessa, e a tela mostra as duas', () => {
    const v = transacao(adulto(40, { semente: 5300 }), x => {
      x.trabalho.atual = undefined; x.momento = null; delete x.fila;
      const p = entrarNaPolitica(x, 'comunidade');
      p.partido = 'Partido Ipê'; p.tFiliacao = x.t - 24; p.fase = 'filiado'; p.apoio = 40; p.reputacao = 40;
    }).vida;
    render(<Palco inicial={v} Tela={PlenarioDoPolitico} />);
    const pl = screen.getByRole('region', { name: 'O plenário' });
    fireEvent.click(within(pl).getByRole('button', { name: 'Fechar uma aliança' }));
    expect(estado().aliancas).toBe(1);
    expect(screen.getByRole('region', { name: 'O plenário' }).textContent).toMatch(/Promessas/);
    expect(within(screen.getByRole('region', { name: 'O plenário' })).getByRole('button', { name: 'Cumprir agora' })).toBeTruthy();
  });

  it('a prancheta: escolher o 5-3-2 muda a estratégia do time (o motor lê em cada jogo)', () => {
    const v = transacao(adulto(40, { semente: 77, genero: 'masculino', municipioId: 'recife-pe' }), (x, rr) => {
      x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
      garantirFrente(x, 'futebol');
      x.trabalho.experiencia['treino'] = 48;
      contratar(x, rr, ocupacao('tecnico_futebol'), 'oportunidade');
      processarTecnico(x, rr);
      const pr = x.caminhos.tecnico?.proposta;
      if (!passagemAtual(x) && pr) aceitarPropostaDeTecnico(x, rr, pr.id);
      x.momento = null; delete x.fila;
    }).vida;
    render(<Palco inicial={v} Tela={PranchetaDoTecnico} />);
    const pr = screen.getByRole('region', { name: 'A prancheta' });
    expect(within(pr).getByRole('img', { name: /A formação: 4-4-2/ })).toBeTruthy();
    fireEvent.click(within(pr).getByRole('button', { name: /5-3-2/ }));
    expect(estado().estilo).toBe('defensivo');
    expect(within(screen.getByRole('region', { name: 'A prancheta' })).getByRole('img', { name: /A formação: 5-3-2/ })).toBeTruthy();
  });

  it('o dossiê do Submundo: as frentes, o risco dito antes, e a ação do contrabando guarda o lote', () => {
    const v = transacao(adulto(30, { semente: 9 }), (x, rr) => { x.momento = null; delete x.fila; entrar(x, 'mercado', undefined, rr); x.financas.conta = 100000; criarContato(x, 'contrabando', 'fornecedor'); }).vida;
    render(<Palco inicial={v} Tela={PainelDoSubmundo} />);
    const d = screen.getByRole('region', { name: 'Dossiê do caminho' });
    expect(within(d).getByRole('article', { name: /Contrabando/ })).toBeTruthy();
    expect(d.textContent).toMatch(/risco de dar errado: (baixo|médio|alto|muito alto)/);
    fireEvent.click(within(d).getByRole('button', { name: 'Adiantar dinheiro num lote' }));
    expect(estado().estoque).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: 'Dossiê do caminho' }).textContent).toMatch(/guardado/);
  });

  it('o campo: o goleiro vê os números de goleiro; o atacante, os de atacante', () => {
    const atleta = (posicao: CarreiraEsportiva['posicao']) => transacao(adulto(26, { semente: 21, genero: 'masculino', municipioId: 'belo-horizonte-mg' }), x => {
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Cruzeiro', nivel: 4, tInicio: x.t - 72, tFase: x.t - 60, lesoes: 0, municipioId: 'belo-horizonte-mg', reputacao: 55, espaco: 'titular', contratoAte: x.t + 36, posicao, temporadas: [{ ano: 2040, clube: 'Cruzeiro', nivel: 4, partidas: 30, titular: 28, gols: posicao === 'goleiro' ? 0 : 12, assistencias: 4, nota: 7.1, colocacao: 5, mesesFora: 0, semSofrerGol: posicao === 'goleiro' ? 11 : undefined, golsSofridos: posicao === 'goleiro' ? 28 : undefined }] } as CarreiraEsportiva;
    }).vida;
    const { unmount } = render(<CampoDoAtleta vida={atleta('goleiro')} />);
    const g = screen.getByRole('region', { name: 'Em campo' });
    expect(g.textContent).toMatch(/Sem sofrer gol/);
    expect(g.textContent).not.toMatch(/Assistências/);
    unmount();
    render(<CampoDoAtleta vida={atleta('atacante')} />);
    const a = screen.getByRole('region', { name: 'Em campo' });
    expect(a.textContent).toMatch(/Assistências/);
    expect(a.textContent).not.toMatch(/Sem sofrer gol/);
    expect(within(a).getByRole('img', { name: /Escudo de Cruzeiro/ })).toBeTruthy();
  });

  it('a galeria: cada competição com a sua forma de troféu, e o prêmio individual separado do título', () => {
    const v = transacao(adulto(30, { semente: 3 }), x => {
      x.caminhos.palmares = [
        { tipo: 'titulo', modalidade: 'futebol', ano: 2040, t: x.t, competicao: 'Copa do Mundo', competicaoId: 'sel:mundial', clube: 'Brasil', papel: 'protagonista', texto: 'Campeão da Copa do Mundo', trofeuId: 'sel:mundial:2040' },
        { tipo: 'titulo', modalidade: 'futebol', ano: 2041, t: x.t, competicao: 'Copa Libertadores', competicaoId: 'cont:CONMEBOL', clube: 'Cruzeiro', papel: 'elenco', texto: 'Campeão da Libertadores', trofeuId: 'cont:CONMEBOL:2041:cruzeiro' },
        { tipo: 'titulo', modalidade: 'futebol', ano: 2042, t: x.t, competicao: 'Série A', competicaoId: 'liga:BR:4', clube: 'Cruzeiro', papel: 'protagonista', texto: 'Campeão da Série A', trofeuId: 'liga:BR:4:2042:cruzeiro' },
        { tipo: 'premio', modalidade: 'futebol', ano: 2042, t: x.t, competicao: 'Série A', clube: 'Cruzeiro', texto: 'Artilheiro da Série A, com 22 gols' }
      ];
    }).vida;
    render(<GaleriaDeConquistas vida={v} />);
    const g = screen.getByRole('region', { name: 'A galeria' });
    const formas = [...g.querySelectorAll('svg.trofeu')].map(x => x.getAttribute('data-forma'));
    expect(new Set(formas).size).toBe(4);
    expect(formas).toEqual(expect.arrayContaining(['mundo', 'figura', 'liga', 'medalha']));
    expect(g.textContent).toMatch(/Prêmios individuais/);
    expect(g.textContent).toMatch(/2041 · Cruzeiro · no elenco/);
  });

  it('o momento diz quando o ano ainda tem outro assunto esperando', () => {
    let v = transacao(adulto(30, { semente: 5 }), x => { x.momento = null; delete x.fila; }).vida;
    const ids = CATALOGO.filter(c => c.tipo === 'decisao' && !c.papeis && !c.manual).map(c => c.id);
    v = transacao(v, (x, rr) => {
      const abertos = ids.filter(id => preparar(conteudoPorId(id)!, x, rr));
      const d = conteudoPorId(abertos[0])!;
      if (d.tipo === 'decisao') abrirDecisao(x, d, preparar(d, x, rr)!);
      x.fila = [{ id: abertos.find(id => id.split('_')[0] !== abertos[0].split('_')[0])!, t: x.t, papeis: {}, prioridade: 1 }];
    }).vida;
    render(<Momento vida={v} agir={() => true} />);
    expect(document.body.textContent).toMatch(/outro assunto esperando por você/);
  });
});
