// @vitest-environment jsdom
/**
 * PWA na interface: a persistência (aqui na reserva do localStorage — o jsdom
 * não tem IndexedDB), a recuperação do save anterior com aviso, a importação
 * que falha sem estragar a vida de agora, as vidas passadas e o aviso de
 * versão nova (que espera as gravações antes de atualizar).
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App, precarregar } from '../App';
import { AvisoAtualizacao } from '../pwa/AvisoAtualizacao';
import { deveRegistrar } from '../pwa/registrar';
import { CHAVE_BACKUP, CHAVE_ESTATISTICAS, CHAVE_SAVE, exportarVida, ler, salvar } from '../../motor/save';
import { CHAVES_LOCAIS } from '../persistencia/armazens';
import { adulto } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; });
afterEach(() => cleanup());

const comNome = (v: Vida, nome: string): Vida => ({ ...v, eu: { ...v.eu, nome } });

function importarArquivo(texto: string): void {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const arquivo = new File([texto], 'vida.json', { type: 'application/json' });
  fireEvent.change(input, { target: { files: [arquivo] } });
}

describe('persistência na interface', () => {
  it('o save principal não abre: o anterior entra, o jogador é avisado e o texto danificado vai para o backup', () => {
    const v = comNome(adulto(30), 'Rosa');
    localStorage.setItem(CHAVES_LOCAIS.anterior, JSON.stringify(v));
    localStorage.setItem(CHAVE_SAVE, '{"versao":19,"eu":{"nome":"Ro');
    render(<App />);
    expect(screen.getByRole('button', { name: /Continuar a vida de Rosa/ })).toBeTruthy();
    expect(screen.getByText(/voltou ao salvamento anterior/)).toBeTruthy();
    expect(localStorage.getItem(CHAVE_BACKUP)).toContain('"Ro');
    // A vida recuperada volta a ser o principal.
    const r = ler();
    expect(r.tipo === 'ok' && r.vida.eu.nome).toBe('Rosa');
  });

  it('cada passo salvo guarda o anterior (um passo atrás, para recuperar)', () => {
    salvar(comNome(adulto(30), 'Lia'));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida de Lia/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Viver mais um ano/ })[0]);
    const anterior = JSON.parse(localStorage.getItem(CHAVES_LOCAIS.anterior)!) as Vida;
    const atual = JSON.parse(localStorage.getItem(CHAVE_SAVE)!) as Vida;
    expect(anterior.eu.nome).toBe('Lia');
    expect(atual.t).toBeGreaterThan(anterior.t);
  });

  it('as vidas passadas vêm da persistência', () => {
    localStorage.setItem(CHAVE_ESTATISTICAS, JSON.stringify({ vidasJogadas: 1, totalAnosVividos: 80, maiorIdade: 80, maiorPatrimonio: 1000, historico: [{ id: 'x', nome: 'Dona Zica', idadeMorte: 80, lugar: 'Recife', profissao: 'costureira', patrimonio: 1000, causa: 'velhice', ano: 2010 }] }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Vidas passadas (1)' }));
    expect(screen.getByText('Dona Zica')).toBeTruthy();
  });
});

describe('exportar e importar (auditoria do PWA)', () => {
  it('um arquivo inválido mostra o erro e não mexe na vida salva nem na tela', async () => {
    const v = comNome(adulto(30), 'Clara');
    salvar(v);
    const antes = localStorage.getItem(CHAVE_SAVE);
    render(<App />);
    importarArquivo('{"formato":"vida-save","vida":{"versao":999}}');
    expect((await screen.findByRole('alert')).textContent).toMatch(/versão mais nova/);
    importarArquivo('alert(1)');
    expect((await screen.findByRole('alert')).textContent).toMatch(/não é um JSON válido/);
    expect(localStorage.getItem(CHAVE_SAVE)).toBe(antes);
    expect(screen.getByRole('button', { name: /Continuar a vida de Clara/ })).toBeTruthy();
  });

  it('um arquivo válido pede confirmação e só então substitui (a vida de antes fica no anterior)', async () => {
    salvar(comNome(adulto(30), 'Clara'));
    render(<App />);
    importarArquivo(exportarVida(comNome(adulto(40, { semente: 7 }), 'Joana')));
    expect(await screen.findByText(/A vida de Joana/)).toBeTruthy();
    expect(screen.getByText(/Isso substitui a vida salva agora \(Clara/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Importar e continuar essa vida' }));
    const r = ler();
    expect(r.tipo === 'ok' && r.vida.eu.nome).toBe('Joana');
    expect((JSON.parse(localStorage.getItem(CHAVES_LOCAIS.anterior)!) as Vida).eu.nome).toBe('Clara');
  });
});

describe('versão nova (PWA)', () => {
  it('fora da build de produção (e no jsdom) não registra service worker e não mostra nada', () => {
    render(<App />);
    expect(screen.queryByText(/Há uma versão nova/)).toBeNull();
    expect(deveRegistrar()).toBe(false); // o jsdom não tem service worker
  });

  it('o aviso é discreto e só atualiza depois de esperar as gravações', async () => {
    const atualizar = vi.fn(async () => {});
    render(<AvisoAtualizacao atualizacao={atualizar} />);
    expect(screen.getByRole('status', { name: 'Versão nova' }).textContent).toMatch(/Há uma versão nova do VIDA/);
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar agora' }));
    await waitFor(() => expect(atualizar).toHaveBeenCalledTimes(1));
  });

  it('"Agora não" some com o aviso sem atualizar', () => {
    const atualizar = vi.fn(async () => {});
    render(<AvisoAtualizacao atualizacao={atualizar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }));
    expect(screen.queryByText(/Há uma versão nova/)).toBeNull();
    expect(atualizar).not.toHaveBeenCalled();
  });
});
