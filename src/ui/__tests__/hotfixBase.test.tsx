// @vitest-environment jsdom
/**
 * HOTFIX de playtest — a tela de Trabalho depois da peneira aprovada: o que
 * se constrói deriva da etapa do caminho (fonte única), não da peneira antiga.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { registrarDevolutiva } from '../../motor/sistemas/devolutivas';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { Trabalho } from '../jogo/Trabalho';

afterEach(() => cleanup());

function garoto(ajuste: (v: Vida) => void): Vida {
  let v = criarVida({ nome: 'Caio', sobrenome: 'Souza', genero: 'masculino', municipioId: 'salvador-ba', semente: 5 });
  for (let k = 0; k < 14; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.trabalho.atual = undefined; v.caminhos.oportunidades = []; v.caminhos.esporte = undefined;
  v.rotinas = v.rotinas.filter(r => r.id !== 'futebol'); v.rotinas.push({ id: 'futebol', tInicio: v.t - 60, nivel: 2 });
  v.caminhos.frentes.futebol = { interesse: 85, meses: 70, habilidade: 72, tInicio: v.t - 70, tUltimo: v.t, retomadas: 0, auge: 72 };
  // A peneira do ano passado: aprovado (a devolutiva fica no histórico).
  registrarDevolutiva(v, { tipo: 'peneira', titulo: 'A peneira do clube', texto: 'O treinador gostou do seu domínio de bola.', passou: true, dominio: 'futebol', nivel: 4 });
  ajuste(v);
  return v;
}
const tela = (v: Vida, agir: (a: Acao) => boolean = () => true) => render(<main><Trabalho vida={v} agir={agir} irPara={() => {}} /></main>);

describe('HOTFIX · Trabalho depois do ingresso na base', () => {
  it('na base: "Se firmar na base", sem "Chegar a uma base" nem "Pedir um teste num clube"', () => {
    const v = garoto(x => { x.caminhos.esporte = { modalidade: 'futebol', fase: 'base', clube: 'Bahia', nivel: 1, tInicio: x.t - 6, tFase: x.t - 6, lesoes: 0, municipioId: x.moradia.municipioId }; });
    tela(v);
    const construindo = screen.getByRole('region', { name: /O que você está construindo/ });
    expect(within(construindo).getByText('Se firmar na base do Bahia')).toBeTruthy();
    expect(within(construindo).queryByText(/Chegar a uma base/)).toBeNull();
    expect(within(construindo).queryByText(/Desde a última peneira/)).toBeNull();
    expect(screen.queryAllByRole('button', { name: /Pedir um teste num clube/ })).toHaveLength(0);
  });

  it('aprovado com o convite sem resposta (save de antes do hotfix): o passo é responder ao convite', () => {
    const v = garoto(x => { x.fatos['convite_base'] = x.t - 2; x.fatos['peneira_mod'] = 0; });
    const pedidos: Acao[] = [];
    tela(v, a => { pedidos.push(a); return true; });
    const construindo = screen.getByRole('region', { name: /O que você está construindo/ });
    expect(within(construindo).queryByText(/Chegar a uma base/)).toBeNull();
    expect(screen.queryAllByRole('button', { name: /Pedir um teste num clube/ })).toHaveLength(0);
    fireEvent.click(within(construindo).getByRole('button', { name: /Responder ao convite do clube/ }));
    expect(pedidos.some(a => (a as { oque?: string }).oque === 'responder_convite')).toBe(true);
  });
});
