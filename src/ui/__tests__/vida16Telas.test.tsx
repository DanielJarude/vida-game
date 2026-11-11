// @vitest-environment jsdom
/** VIDA 16 · na tela: escrever no celular, a pasta do ofício e a vida religiosa. */
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import Celular from '../v15/celular/Celular';
import Oficio16 from '../v16/oficios/Oficio16';
import VidaReligiosa16 from '../v16/religiao/VidaReligiosa16';
import { adulto, pessoaNova } from '../../motor/__tests__/cenarios';
import { vincular } from '../../motor/pessoas';
import { executar, type Acao } from '../../motor/acoes';
import { crencaDe } from '../../motor/v14/crencas/crencas';
import type { Vida } from '../../motor/tipos';

function usePalco(inicial: Vida) {
  const [v, setV] = useState(inicial);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return r.vida !== v; };
  return { v, agir };
}

describe('VIDA 16 · telas', () => {
  it('Mensagens: Nova mensagem → escolher a pessoa → a intenção → a conversa aparece com a resposta', async () => {
    const v = structuredClone(adulto(30, { semente: 3 }));
    const p = pessoaNova(v, 31, 'feminino');
    const vin = vincular(v, p, { origem: 'escola', proximidade: 65, estagio: 'amigo_proximo' });
    vin.tUltimoContato = v.t - 24;
    function Palco() { const { v: x, agir } = usePalco(v); return <Celular vida={x} agir={agir} aoFechar={() => {}} irPara={() => {}} irLugar={() => {}} abrirPessoa={() => {}} appInicial="mensagens" />; }
    render(<Palco />);
    fireEvent.click(await screen.findByRole('button', { name: 'Nova mensagem' }));
    fireEvent.click(within(screen.getByRole('list', { name: 'Contatos' })).getByRole('button', { name: new RegExp(p.nome) }));
    await act(async () => { fireEvent.click(within(screen.getByRole('group', { name: 'O que escrever' })).getByRole('button', { name: /Perguntar como está/ })); });
    expect(document.querySelector('.cel__balao--minha')?.textContent?.length).toBeGreaterThan(3);
  });

  it('a pasta do escritório: pegar o caso, escolher a estratégia', async () => {
    const v = structuredClone(adulto(34, { semente: 2 }));
    v.trabalho.atual = { ocupacaoId: 'advogado', empregador: 'escritório próprio', contrato: 'autonomo', salario: 8000, tInicio: v.t - 48, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral' };
    function Palco() { const { v: x, agir } = usePalco(v); return <Oficio16 vida={x} agir={agir} />; }
    render(<Palco />);
    expect(screen.getByText(/A pasta do escritório/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Pegar o caso' })[0]); });
    expect(screen.getByRole('button', { name: 'Ir a julgamento' })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Buscar um acordo' })); });
    expect(screen.getByText(/Acordo fechado/)).toBeTruthy();
  });

  it('a vida religiosa: os caminhos da tradição; seguir um mostra a etapa e os gestos', async () => {
    const v = structuredClone(adulto(22, { semente: 4, genero: 'feminino' }));
    v.crenca14 = { ...crencaDe(v), atual: 'candomble', pratica: 'regular' };
    function Palco() { const { v: x, agir } = usePalco(v); return <VidaReligiosa16 vida={x} agir={agir} />; }
    render(<Palco />);
    expect(screen.getByText('Sacerdócio no candomblé')).toBeTruthy();
    expect(screen.getByText('Ogã e equede no candomblé')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Seguir este caminho' })[0]); });
    expect(screen.getByText('Abiã')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'O ano na vida religiosa' })).toBeTruthy();
  });
});
