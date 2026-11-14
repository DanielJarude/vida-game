// @vitest-environment jsdom
/** VIDA 20 — os apps sociais do celular: cada rede tem o seu app; criar conta e publicar com poucos toques, pelas mesmas ações. */
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import Celular from '../v15/celular/Celular';
import { executar, type Acao } from '../../motor/acoes';
import { adulto } from '../../motor/__tests__/cenarios';
import { interpretar } from '../../motor/save';
import type { Vida } from '../../motor/tipos';

function Palco({ inicial, feitas }: { inicial: Vida; feitas: Acao[] }) {
  const [v, setV] = useState(inicial);
  const agir = (a: Acao) => { feitas.push(a); const r = executar(v, a); setV(r.vida); (globalThis as { __vida20?: Vida }).__vida20 = r.vida; return true; };
  return <Celular vida={v} agir={agir} aoFechar={() => {}} irPara={() => {}} irLugar={() => {}} abrirPessoa={() => {}} />;
}

afterEach(cleanup);

describe('VIDA 20 · apps sociais', () => {
  it('cada rede é um app na tela inicial; criar a conta e publicar levam um toque cada (a ação de sempre)', async () => {
    const v = adulto(24, { semente: 12 });
    v.financas.conta = 20000;
    const feitas: Acao[] = [];
    render(<Palco inicial={v} feitas={feitas} />);
    const apps = screen.getByRole('list', { name: 'Aplicativos' });
    for (const n of ['Instagram', 'TikTok', 'YouTube', 'X', 'Facebook']) expect(within(apps).getByRole('button', { name: new RegExp(`^${n}`) })).toBeTruthy();
    fireEvent.click(within(apps).getByRole('button', { name: /^TikTok/ }));
    const criar = await screen.findByRole('button', { name: 'Criar conta' });
    await act(async () => { fireEvent.click(criar); });
    expect(feitas.some(a => a.tipo === 'rede' && (a as { op: { oque: string; plataforma: string } }).op.oque === 'criar' && (a as { op: { plataforma: string } }).op.plataforma === 'tiktok')).toBe(true);
    // O botão de criar fica no alto; a composição mostra os conteúdos — um toque publica.
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: 'Novo vídeo' })[0]); });
    const lista = document.querySelector('.app20__conteudos')!;
    const primeiro = within(lista as HTMLElement).getAllByRole('button')[0];
    await act(async () => { fireEvent.click(primeiro); });
    const pub = feitas.find(a => a.tipo === 'rede' && (a as { op: { oque: string } }).op.oque === 'publicar') as { op: { plataforma: string } } | undefined;
    expect(pub?.op.plataforma).toBe('tiktok');
    const depois = (globalThis as { __vida20?: Vida }).__vida20!;
    const conta = depois.redes!.contas.tiktok!;
    expect(conta.publicacoes.length).toBe(1);
    // O save guarda a conta e a publicação (nada duplicado).
    const lido = interpretar(JSON.stringify(depois));
    expect(lido.tipo === 'ok' && lido.vida.redes!.contas.tiktok!.publicacoes.length).toBe(1);
    // O perfil mostra a publicação; voltar leva à tela inicial do celular.
    expect(document.querySelector('.app20[data-tela="perfil"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar à tela inicial' }));
    expect(screen.getByRole('list', { name: 'Aplicativos' })).toBeTruthy();
  });
  it('o X tem "Em alta"; cada app tem a sua barra de navegação', async () => {
    const v = adulto(30, { semente: 14 });
    render(<Palco inicial={v} feitas={[]} />);
    fireEvent.click(within(screen.getByRole('list', { name: 'Aplicativos' })).getByRole('button', { name: /^X/ }));
    const nav = await screen.findByRole('navigation', { name: /Navegação do X/ });
    for (const n of ['Para você', 'Em alta', 'Notificações', 'Perfil']) expect(within(nav).getByRole('button', { name: n })).toBeTruthy();
    fireEvent.click(within(nav).getByRole('button', { name: 'Em alta' }));
    expect(document.querySelector('.app20[data-tela="alta"]')).toBeTruthy();
  });
});
