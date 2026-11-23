/** VIDA 36 · correções de bugs da atualização (5.1 base esportiva; 5.4 desabafo do negócio que fechou). */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { executar } from '../acoes';
import { entrarNaBase } from '../sistemas/esporte';
import { FALAS17 as DESABAFOS17 } from '../dados17/celular/catalogo17';

describe('VIDA 36 · 5.1 parar a modalidade encerra a carreira na base', () => {
  it('a rotina de futebol parada no meio da base encerra a carreira (sem personagem "vinculado" à base)', () => {
    const { vida: v0 } = transacao(adulto(17, { semente: 36, genero: 'masculino', municipioId: 'campina-grande-pb' }), x => {
      x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined;
      entrarNaBase(x, 'futebol', x.moradia.municipioId, 'clube de bairro de Campina Grande');
    });
    expect(v0.caminhos.esporte?.fase).toBe('base');
    expect(v0.rotinas.some(r => r.id === 'futebol')).toBe(true);
    const { vida } = executar(v0, { tipo: 'rotina', id: 'futebol', ativa: false });
    expect(vida.caminhos.esporte?.fase).toBe('encerrada');
    expect(vida.caminhos.esporte?.motivoFim).toBe('escolha');
    expect(vida.rotinas.some(r => r.id === 'futebol')).toBe(false);
  });
});

describe('VIDA 36 · 5.4 quem fechou o próprio negócio não "foi demitido"', () => {
  it('há um desabafo próprio para o negócio que fechou, em todos os tons', () => {
    const d = DESABAFOS17.desabafo_negocio;
    expect(d).toBeDefined();
    for (const tom of ['expansivo', 'contido', 'carinhoso', 'ironico'] as const) expect(d[tom].length).toBeGreaterThan(0);
    expect(JSON.stringify(d)).not.toMatch(/demit|mandad/);
  });
});
