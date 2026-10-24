// @vitest-environment jsdom
/**
 * REWORK 11 · Fases H e I — as telas: publicar em passos (tipo → configurar → confirmar), o público de agora rotulado
 * ao lado do fechamento de cada ano, a conta banida com o motivo, e o planejamento do casamento na ficha de quem está
 * noivo (o preço, quem paga, a preferência da outra pessoa) — o clique chega ao motor.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { criarPessoa, vincular } from '../../motor/pessoas';
import { transacao } from '../../motor/nucleo';
import { ficarNoivos } from '../../motor/sistemas/romance';
import { advertir } from '../../motor/sistemas/redes';
import { PLATAFORMAS } from '../../motor/dados/redes';
import type { Vida } from '../../motor/tipos';
import { RedesSociais } from '../jogo/Redes';
import { Pessoas } from '../jogo/Pessoas';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; const r = criarRng(20261024); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

let BASE: Vida | undefined;
function vida(ajuste: (v: Vida) => void = () => {}): Vida {
  if (!BASE) {
    let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 7 });
    for (let i = 0; i < 28; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
    v.caminhos.processo = undefined;
    BASE = v;
  }
  return transacao(BASE, x => { x.financas.conta = 200000; x.financas.investimentos = []; ajuste(x); }).vida;
}
const rede = (op: object) => ({ tipo: 'rede', op } as Acao);

function Ligado({ v0, tela, aoAgir }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactNode; aoAgir?: (a: Acao) => void }) {
  const [v, setV] = useState(v0);
  const agir = (a: Acao) => { aoAgir?.(a); const r = executar(v, a); setV(r.vida); return true; };
  return <main>{tela(v, agir)}</main>;
}

describe('SOC-11 · publicar em passos', () => {
  it('escolher o tipo não publica; configurar; confirmar publica (a mesma ação de sempre)', () => {
    const v0 = executar(vida(), rede({ oque: 'criar', plataforma: 'instagram' })).vida;
    const feitas: Acao[] = [];
    render(<Ligado v0={v0} aoAgir={a => feitas.push(a)} tela={(v, agir) => <RedesSociais vida={v} agir={agir} />} />);
    const cel = () => screen.getByRole('region', { name: 'Seu celular' });
    fireEvent.click(within(cel()).getAllByRole('tab', { name: /Instagram/ })[0]);
    expect(within(cel()).getByText('1. O quê')).toBeTruthy();
    fireEvent.click(within(cel()).getByRole('button', { name: /Uma foto do dia/ }));
    expect(feitas.filter(a => a.tipo === 'rede')).toHaveLength(0);
    expect(within(cel()).getByText(/Impulsionar a publicação/)).toBeTruthy();
    fireEvent.click(within(cel()).getByRole('button', { name: 'Continuar' }));
    fireEvent.click(within(cel()).getByRole('button', { name: 'Publicar' }));
    expect(feitas.some(a => a.tipo === 'rede' && (a as { op: { oque: string } }).op.oque === 'publicar')).toBe(true);
  });

  it('da tela inicial, "Publicar" pergunta a plataforma primeiro', () => {
    let v0 = executar(vida(), rede({ oque: 'criar', plataforma: 'instagram' })).vida;
    v0 = executar(v0, rede({ oque: 'criar', plataforma: 'x' })).vida;
    render(<Ligado v0={v0} tela={(v, agir) => <RedesSociais vida={v} agir={agir} />} />);
    fireEvent.click(screen.getByRole('button', { name: /Voltar para a tela inicial/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    expect(screen.getByText('Publicar onde?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^X/ }));
    expect(screen.getByText('1. O quê')).toBeTruthy();
  });
});

describe('SOC-11.5 · o número de hoje e o fim de cada ano, rotulados', () => {
  it('o histórico diz "no fim de cada ano", termina em "agora" com o número do perfil, e o perfil diz "+X desde o fim de"', () => {
    let v0 = executar(vida(), rede({ oque: 'criar', plataforma: 'instagram' })).vida;
    v0 = transacao(v0, x => {
      const c = x.redes!.contas.instagram;
      c.anos = [{ desde: x.t - 12, ate: x.t, inicio: 300000, organico: 0, publicacoes: 180000, exposicao: 0, comprados: 0, perdas: 0, fim: 480000 }];
      c.balanco = { desde: x.t, inicio: 480000, organico: 0, publicacoes: 189000, exposicao: 0, comprados: 0, perdas: 0 };
      c.seguidores = 669000;
    }).vida;
    render(<main><RedesSociais vida={v0} agir={() => true} /></main>);
    fireEvent.click(screen.getAllByRole('tab', { name: /Instagram/ })[0]);
    const lado = screen.getByRole('complementary', { name: 'Os números das redes' });
    expect(lado.textContent).toMatch(/No fim de cada ano/);
    const lista = within(lado).getByRole('list', { name: /no fim de cada ano, e agora/ });
    expect(lista.textContent).toMatch(/480 mil/);
    expect(lista.textContent).toMatch(/agora/);
    expect(lista.textContent).toMatch(/669 mil/);
    expect(lado.textContent).toMatch(/ano fechado/);
    const perfil = document.querySelector('.plataforma-painel__numero')!;
    expect(perfil.textContent).toMatch(/669 mil/);
    expect(perfil.textContent).toMatch(/hoje/);
    expect(perfil.textContent).toMatch(/\+189 mil desde o fim de/);
  });

  it('a conta banida diz o motivo e quando dá para ter outra', () => {
    let v0 = executar(vida(), rede({ oque: 'criar', plataforma: 'instagram' })).vida;
    v0 = transacao(v0, x => { const c = x.redes!.contas.instagram; for (let k = 0; k < 9; k++) advertir(x, PLATAFORMAS.instagram, c, 'provocação nos comentários'); }).vida;
    render(<main><RedesSociais vida={v0} agir={() => true} /></main>);
    fireEvent.click(screen.getAllByRole('tab', { name: /Instagram/ })[0]);
    const cel = screen.getByRole('region', { name: 'Seu celular' });
    expect(cel.textContent).toMatch(/baniu a sua conta/);
    expect(cel.textContent).toMatch(/provocação nos comentários/);
  });
});

describe('REL-16 · o planejamento do casamento na ficha', () => {
  it('noivos: a ficha mostra o plano com o preço e a preferência; combinar e casar passam pelo motor', () => {
    let id = '';
    const v0 = vida(x => {
      const p = criarPessoa(x, criarRng(9), { idade: 29, genero: 'masculino', municipioId: x.moradia.municipioId });
      p.atracao = 'mulheres';
      const vin = vincular(x, p, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
      vin.romance = { estagio: 'morando_junto', tEstagio: x.t - 36, tInicio: x.t - 48, envolvimento: 85, planoFilhos: 'evitando' };
      ficarNoivos(x, vin);
      vin.romance.noivado!.t = x.t - 8; x.fatos[`noivado_${p.id}`] = x.t - 8;
      id = p.id;
    });
    const feitas: Acao[] = [];
    let atual = v0;
    render(<Ligado v0={v0} aoAgir={a => feitas.push(a)} tela={(v, agir) => { atual = v; return <Pessoas vida={v} agir={agir} aberta={id} abrir={() => {}} />; }} />);
    const secao = screen.getByRole('region', { name: 'O planejamento do casamento' });
    expect(secao.textContent).toMatch(/sonha com/);
    expect(secao.textContent).toMatch(/Ao todo/);
    fireEvent.click(within(secao).getByRole('radio', { name: /Num salão de festas/ }));
    fireEvent.click(within(secao).getByRole('button', { name: 'Combinar este plano' }));
    expect(feitas.some(a => a.tipo === 'casamento' && (a as { op: string }).op === 'planejar')).toBe(true);
    expect(atual.vinculos[id].romance?.noivado?.plano?.local).toBe('salao');
    fireEvent.click(within(screen.getByRole('region', { name: 'O planejamento do casamento' })).getByRole('button', { name: 'Casar, como combinado' }));
    expect(atual.vinculos[id].romance?.estagio).toBe('casamento');
    expect(screen.getByRole('region', { name: 'A lua de mel' })).toBeTruthy();
  });
});
