// @vitest-environment jsdom
/**
 * FIX pós-REWORK 4 — as telas: o clique chega ao motor e o motor responde na tela. Tempo livre por abas, o estresse
 * como leitura única, as redes sociais jogáveis, a ficha com "Fazer juntos", o veículo com cor em Pertences e na loja,
 * os objetos reconhecíveis, o dia a dia do trabalho e o ano letivo.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { criarPessoa, vincular } from '../../motor/pessoas';
import type { Vida } from '../../motor/tipos';
import { Tempo } from '../jogo/Tempo';
import { Pessoas } from '../jogo/Pessoas';
import { Pertences } from '../jogo/Pertences';
import { Trabalho } from '../jogo/Trabalho';
import { Estudos } from '../jogo/Estudos';
import { Lugar } from '../jogo/material/Lugares';
import { DesenhoObjeto } from '../jogo/material/Objetos';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; const r = criarRng(20261003); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function vida(idade: number, ajuste: (v: Vida) => void = () => {}): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
const adulta = (v: Vida) => { v.trabalho.atual = undefined; contratar(v, criarRng(2), ocupacao('assistente_adm')); v.financas.conta = 60000; v.financas.negativado = false; };

/** A tela ligada ao motor de verdade: cada clique executa a ação e a tela renderiza a vida nova. */
function Ligado({ v0, tela }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactNode }) {
  const [v, setV] = useState(v0);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return true; };
  return <main>{tela(v, agir)}</main>;
}

describe('Tempo livre: abas — e o estresse como leitura principal', () => {
  it('"A semana" mostra o estresse com o porquê (o que pesa, o que ajuda, se cabe mais) — sem a barra de "Carga"', () => {
    render(<Ligado v0={vida(30, adulta)} tela={(v, agir) => <Tempo vida={v} agir={agir} />} />);
    const main = screen.getByRole('main');
    expect(within(main).getByRole('meter', { name: /Estresse/ })).toBeTruthy();
    expect(within(main).getByText('O que está pesando')).toBeTruthy();
    expect(within(main).getByText('O que está ajudando')).toBeTruthy();
    expect(within(main).getByText(/Dá para assumir mais\?/)).toBeTruthy();
    expect(within(main).queryByText('Carga')).toBeNull();
  });
  it('as abas respondem ao que se quer: corpo, hobbies, gente, redes, viagens', () => {
    render(<Ligado v0={vida(30, adulta)} tela={(v, agir) => <Tempo vida={v} agir={agir} />} />);
    for (const nome of ['Corpo e mente', 'Hobbies', 'Sair e ver gente', 'Redes sociais', 'Viagens']) expect(screen.getByRole('tab', { name: nome })).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Corpo e mente' }));
    expect(screen.getByText('Cuidar de si')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Redes sociais' }));
    for (const pl of ['Instagram', 'TikTok', 'YouTube', 'X (Twitter)', 'Facebook', 'Twitch', 'OnlyFans']) expect(screen.getAllByText(pl).length).toBeGreaterThan(0);
  });
});

describe('Redes sociais: criar, postar, apagar — o clique muda a vida', () => {
  it('criar a conta no Instagram → postar → a publicação aparece; apagar pede confirmação', () => {
    render(<Ligado v0={vida(25, adulta)} tela={(v, agir) => <Tempo vida={v} agir={agir} aba="redes" />} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar uma conta no Instagram' }));
    expect(screen.getByText(/^@/, { selector: '.plataforma-painel__titulo, .plataforma-painel__titulo *' })).toBeTruthy();
    const post = screen.getByRole('button', { name: 'Uma foto do dia' });
    fireEvent.click(post);
    expect(document.querySelectorAll('.rede__publicacoes .publicacao').length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: /A conta: crescer, verificar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar a conta…' }));
    expect(screen.getByText(/Apagar a conta no Instagram\?/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    expect(screen.getByRole('button', { name: 'Criar uma conta no Instagram' })).toBeTruthy();
  });
  it('OnlyFans é só para maiores de idade: aos 16, a plataforma diz a idade', () => {
    render(<Ligado v0={vida(16)} tela={(v, agir) => <Tempo vida={v} agir={agir} aba="redes" />} />);
    const of = screen.getByRole('tab', { name: /OnlyFans/ });
    expect(of.textContent).toMatch(/a partir dos 18/);
  });
});

describe('a ficha da pessoa: o que FAZER com ela vem primeiro, por tipo', () => {
  it('com a parceria: "Fazer juntos" (jantar, cozinhar, show), depois conversar e a relação', () => {
    const v = vida(30, x => {
      adulta(x);
      const p = criarPessoa(x, criarRng(9), { idade: 31, genero: 'masculino', municipioId: x.moradia.municipioId });
      const vin = vincular(x, p, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
      vin.romance = { estagio: 'casamento', tEstagio: x.t - 60, tInicio: x.t - 60, envolvimento: 80, planoFilhos: 'evitando' };
    });
    const parId = Object.values(v.vinculos).find(x => x.romance)!.pessoaId;
    render(<Ligado v0={v} tela={(vv, agir) => <Pessoas vida={vv} agir={agir} aberta={parId} abrir={() => {}} />} />);
    const ficha = screen.getByRole('dialog');
    expect(within(ficha).getByText('Fazer juntos')).toBeTruthy();
    expect(within(ficha).getByRole('button', { name: /jantar com reserva/ })).toBeTruthy();
    expect(within(ficha).getByRole('button', { name: /Cozinhar com/ })).toBeTruthy();
    expect(within(ficha).getByText('A relação')).toBeTruthy();
  });
});

describe('materialidade: o veículo tem cor (na loja e em Pertences), os objetos se distinguem', () => {
  it('na concessionária, cada carro com a cor dele; em Pertences, o veículo com o que dá para fazer', () => {
    const v = vida(30, x => { adulta(x); x.financas.conta = 300000; x.trabalho.licencas.push('cnh'); });
    render(<Ligado v0={v} tela={(vv, agir) => <><Lugar vida={vv} agir={agir} qual="concessionaria" aoFechar={() => {}} trocar={() => {}} /><Pertences vida={vv} agir={agir} abrir={() => {}} /></>} />);
    const coloridos = [...document.querySelectorAll('.oferta--veiculo .desenho-veiculo--colorido')].map(x => (x as HTMLElement).style.getPropertyValue('--cor-veiculo'));
    expect(coloridos.length).toBeGreaterThan(3);
    expect(new Set(coloridos).size).toBeGreaterThan(2);
    fireEvent.click(document.querySelector('.oferta--veiculo') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /^Comprar$/ }));
    expect(screen.getAllByText(/Seu veículo/).length).toBeGreaterThan(0);
    const noPertence = document.querySelector('.pertence--veiculo .desenho-veiculo--colorido') as HTMLElement;
    expect(noPertence).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /domingo|estrada|volta/ }).length).toBeGreaterThan(0);
  });
  it('violão e violino não são o mesmo desenho; objeto escuro ganha contorno claro (contraste no fundo escuro)', () => {
    const { container: a } = render(<DesenhoObjeto coisaId="violao" cor="#6e3f22" />);
    const violao = a.innerHTML; cleanup();
    const { container: b } = render(<DesenhoObjeto coisaId="violino" cor="#6e3f22" />);
    expect(b.innerHTML).not.toBe(violao); cleanup();
    const { container: c } = render(<DesenhoObjeto coisaId="violao" cor="#2b2523" />);
    expect(c.innerHTML).toMatch(/#d8cbb8/);
  });
});

describe('trabalho e formação: verbos de dentro', () => {
  it('Trabalho mostra "No dia a dia do trabalho"; o clique executa (uma vez por ano)', () => {
    render(<Ligado v0={vida(30, adulta)} tela={(v, agir) => <Trabalho vida={v} agir={agir} irPara={() => {}} />} />);
    expect(screen.getByText('No dia a dia do trabalho')).toBeTruthy();
    const b = screen.getByRole('button', { name: 'Almoçar com a chefia' });
    fireEvent.click(b);
    expect(screen.queryByRole('button', { name: 'Almoçar com a chefia' })).toBeNull();
  });
  it('Formação mostra "Neste ano letivo" na escola', () => {
    const v = vida(14);
    expect(v.educacao.basica).toBeDefined();
    render(<Ligado v0={v} tela={(vv, agir) => <Estudos vida={vv} agir={agir} irPara={() => {}} />} />);
    expect(screen.getByText('Neste ano letivo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Estudar de verdade para as provas' })).toBeTruthy();
  });
});
