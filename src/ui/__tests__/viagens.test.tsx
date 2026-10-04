// @vitest-environment jsdom
/**
 * Viagens em passos (rework de UX): a escolha anda um nível por vez —
 *   para fora:   país → cidade → duração → com quem → resumo → confirmar
 *   no Brasil:   região → destino → duração → com quem → resumo → confirmar
 * (FIX pós-REWORK 4: as viagens moram na aba "Viagens" de Tempo livre, e há o passo "Com quem?" — o id da escolha é o
 * de sempre, com a companhia no fim.)
 * Nunca todas as combinações destino × duração de uma vez; a restrição da
 * porta (foi há pouco) aparece uma vez só; confirmar executa a MESMA ação do
 * motor de antes (mesmo id de escolha, mesmo preço).
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { executar } from '../../motor/acoes';
import { transacao } from '../../motor/nucleo';
import { catalogoDeViagem, custoDaExperiencia, escolhasDaExperiencia } from '../../motor/sistemas/experiencias';
import { dinheiroCurto } from '../apresentar';
import { Tempo } from '../jogo/Tempo';

beforeAll(async () => { await precarregar(); });

function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}): Vida {
  let v = criarVida({ nome: 'Lia', sobrenome: 'Prado', genero: 'feminino', municipioId: 'recife-pe', semente: 7 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  return transacao(v, x => { x.financas.conta = 400000; x.trabalho.atual = undefined; ajuste(x); }).vida;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  const r = criarRng(20261002);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const DURACOES = /fim de semana prolongado|uma semana|duas semanas/i;
const porta = (nome: string) => screen.getByText(nome).closest('li') as HTMLElement;

describe('Viagem para fora: país → cidade → duração → resumo', () => {
  it('o primeiro nível mostra só países (nenhuma duração); o país mostra só as suas cidades; a cidade mostra as durações', () => {
    const v = vidaAos(35);
    render(<Tempo vida={v} agir={() => true} aba="viagens" />);
    const li = porta('Uma viagem para fora do país');
    fireEvent.click(within(li).getByRole('button', { name: 'Ver destinos' }));

    // Nível 1: países (com o continente uma vez, como sobretítulo), nenhuma duração.
    expect(within(li).getByText('Para qual país?')).toBeTruthy();
    expect(within(li).getByRole('button', { name: /^Portugal/ })).toBeTruthy();
    expect(within(li).getByRole('button', { name: /^Japão/ })).toBeTruthy();
    expect(within(li).queryByText(DURACOES)).toBeNull();
    expect(within(li).queryAllByRole('button', { name: DURACOES })).toHaveLength(0);
    expect(within(li).getAllByText('Europa')).toHaveLength(1);

    // Nível 2: só as cidades do país escolhido.
    fireEvent.click(within(li).getByRole('button', { name: /^Portugal/ }));
    expect(within(li).getByText('Qual cidade?')).toBeTruthy();
    expect(within(li).getByRole('button', { name: /^Lisboa/ })).toBeTruthy();
    expect(within(li).queryByRole('button', { name: /^Paris|^Roma|^Tóquio|^Portugal|^Argentina/ })).toBeNull();
    expect(within(li).queryAllByRole('button', { name: DURACOES })).toHaveLength(0);

    // Nível 3: as durações daquela cidade, cada uma com o preço do motor.
    fireEvent.click(within(li).getByRole('button', { name: /^Lisboa/ }));
    expect(within(li).getByText('Por quanto tempo?')).toBeTruthy();
    const lisboa = catalogoDeViagem(v, 'viagem_exterior').grupos.find(g => g.id === 'portugal')!.lugares[0];
    expect(within(li).getAllByRole('button', { name: /dias/ })).toHaveLength(lisboa.duracoes.length);
    for (const d of lisboa.duracoes) expect(within(li).getByRole('button', { name: new RegExp(`^${d.nome}.*${dinheiroCurto(d.custo).replace(/[$.]/g, '\\$&')}`, 'i') })).toBeTruthy();

    // Voltar sobe um nível de cada vez.
    fireEvent.click(within(li).getByRole('button', { name: /Voltar/ }));
    expect(within(li).getByText('Qual cidade?')).toBeTruthy();
    fireEvent.click(within(li).getByRole('button', { name: /Voltar/ }));
    expect(within(li).getByText('Para qual país?')).toBeTruthy();
    expect(within(li).queryByRole('button', { name: /Voltar/ })).toBeNull();
  });

  it('confirmar executa a mesma ação de antes (mesmo id de escolha), com o preço do motor', () => {
    const v = vidaAos(35);
    const feitas: Acao[] = [];
    render(<Tempo vida={v} agir={a => { feitas.push(a); return true; }} aba="viagens" />);
    const li = porta('Uma viagem para fora do país');
    fireEvent.click(within(li).getByRole('button', { name: 'Ver destinos' }));
    fireEvent.click(within(li).getByRole('button', { name: /^Portugal/ }));
    fireEvent.click(within(li).getByRole('button', { name: /^Lisboa/ }));
    fireEvent.click(within(li).getByRole('button', { name: /^Uma semana/ }));
    // FIX pós-REWORK 4: com quem (sem ninguém em casa, a primeira opção é ir só — o preço de sempre).
    expect(within(li).getByText('Com quem?')).toBeTruthy();
    fireEvent.click(within(li).getByRole('button', { name: /^Sozinh/ }));

    const preco = custoDaExperiencia(v, 'viagem_exterior', 'lisboa:semana:so');
    expect(escolhasDaExperiencia(v, 'viagem_exterior').find(e => e.id === 'lisboa:semana')!.custo).toBe(preco);
    expect(within(li).getByText(dinheiroCurto(preco))).toBeTruthy();
    fireEvent.click(within(li).getByRole('button', { name: 'Confirmar a viagem' }));
    expect(feitas).toEqual([{ tipo: 'experiencia', id: 'viagem_exterior', escolha: 'lisboa:semana:so' }]);

    // E o motor cobra exatamente esse preço e conta essa viagem.
    const r = executar(v, feitas[0]);
    expect(v.financas.conta - r.vida.financas.conta).toBe(preco);
    expect(r.vida.biografia.slice(-4).some(b => b.texto.includes('Lisboa'))).toBe(true);
  });
});

describe('Viagem pelo Brasil: região → destino → duração', () => {
  it('a região mostra só os seus destinos; nada de duração antes do destino', () => {
    const v = vidaAos(35);
    render(<Tempo vida={v} agir={() => true} aba="viagens" />);
    const li = porta('Uma viagem pelo Brasil');
    fireEvent.click(within(li).getByRole('button', { name: 'Ver destinos' }));
    expect(within(li).queryAllByRole('button', { name: DURACOES })).toHaveLength(0);
    fireEvent.click(within(li).getByRole('button', { name: /^Sul/ }));
    expect(within(li).getByRole('button', { name: /^Foz do Iguaçu/ })).toBeTruthy();
    expect(within(li).getByRole('button', { name: /^Gramado/ })).toBeTruthy();
    expect(within(li).queryByRole('button', { name: /^Ouro Preto|^Bonito|^Salvador/ })).toBeNull();
    fireEvent.click(within(li).getByRole('button', { name: /^Gramado/ }));
    expect(within(li).getAllByRole('button', { name: /dias/ })).toHaveLength(3);
  });
});

describe('A restrição da porta aparece uma vez só', () => {
  it('foi há pouco: o motivo aparece uma vez, no nível da viagem, e a porta não abre lista de durações', () => {
    const v = vidaAos(35, x => { x.fatos.exp_viagem_exterior = x.t - 3; });
    render(<Tempo vida={v} agir={() => true} aba="viagens" />);
    expect(screen.getAllByText('Foi há pouco — a próxima fica para daqui a um tempo.')).toHaveLength(1);
    const li = porta('Uma viagem para fora do país');
    expect(within(li).queryByRole('button', { name: 'Ver destinos' })).toBeNull();
    expect(within(li).queryAllByRole('button', { name: DURACOES })).toHaveLength(0);
    // A outra porta segue aberta.
    expect(within(porta('Uma viagem pelo Brasil')).getByRole('button', { name: 'Ver destinos' })).toBeTruthy();
  });
});
