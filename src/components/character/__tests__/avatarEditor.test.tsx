/**
 * @vitest-environment jsdom
 *
 * B4-FIX2 item 17 — editor de avatar na criação de Nova Vida e persistência
 * até o motor. Cobre: presença real de escolha (não só símbolo automático),
 * cada categoria muda o estado, o valor final chega intacto ao callback de
 * criação, e o fallback funciona para quem não decide nada.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import { CharacterCreationScreen } from '../../screens/CharacterCreationScreen';
import { AvatarEditor } from '../AvatarEditor';
import { APARENCIA_PADRAO } from '../../../data/avatar/avatarData';

afterEach(cleanup);

describe('B4-FIX2 · AvatarEditor', () => {
  it('renderiza um controle por categoria de personalização', () => {
    render(<AvatarEditor aparencia={APARENCIA_PADRAO} onMudar={() => {}} />);

    expect(screen.getByText('Tom de pele')).toBeTruthy();
    expect(screen.getByText('Cabelo')).toBeTruthy();
    expect(screen.getByText('Cor do cabelo')).toBeTruthy();
    expect(screen.getByText('Cor dos olhos')).toBeTruthy();
  });

  it('clicar em uma opção de cabelo chama onMudar com o novo valor, preservando o resto', () => {
    const onMudar = vi.fn();
    render(<AvatarEditor aparencia={APARENCIA_PADRAO} onMudar={onMudar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Longo' }));

    expect(onMudar).toHaveBeenCalledWith({
      ...APARENCIA_PADRAO,
      estiloCabelo: 'longo'
    });
  });

  it('clicar em uma amostra de cor de olhos muda só esse campo', () => {
    const onMudar = vi.fn();
    render(<AvatarEditor aparencia={APARENCIA_PADRAO} onMudar={onMudar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Verde' }));

    expect(onMudar).toHaveBeenCalledWith({
      ...APARENCIA_PADRAO,
      corOlhos: 'verde'
    });
  });
});

describe('B4-FIX2 · aparência escolhida chega ao motor na criação da vida', () => {
  it('a aparência selecionada na tela é exatamente o que a criação de vida recebe', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Negra' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cacheado' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ruivo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Azul' }));

    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    expect(onCriar).toHaveBeenCalledTimes(1);
    const aparenciaRecebida = onCriar.mock.calls[0][6];
    expect(aparenciaRecebida).toEqual({
      tomPele: 'negra',
      estiloCabelo: 'cacheado',
      corCabelo: 'ruivo',
      corOlhos: 'azul'
    });
  });

  it('sem nenhuma escolha manual, ainda assim envia uma aparência válida (não undefined)', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    const aparenciaRecebida = onCriar.mock.calls[0][6];
    expect(aparenciaRecebida).toBeTruthy();
    expect(typeof aparenciaRecebida.tomPele).toBe('string');
  });

  it('"Sortear tudo" também sorteia uma aparência (não deixa travada no padrão)', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    // Roda várias vezes: ao menos uma amostragem deve produzir algo
    // diferente do padrão neutro para provar que o sorteio de fato varia.
    const resultados: string[] = [];
    for (let i = 0; i < 15; i++) {
      fireEvent.click(screen.getByRole('button', { name: /sortear tudo/i }));
      fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));
      const aparencia = onCriar.mock.calls[onCriar.mock.calls.length - 1][6];
      resultados.push(JSON.stringify(aparencia));
    }

    expect(new Set(resultados).size).toBeGreaterThan(1);
  });
});
