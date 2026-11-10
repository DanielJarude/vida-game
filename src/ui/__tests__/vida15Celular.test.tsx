// @vitest-environment jsdom
/** VIDA 15 · o celular na tela: abre pelo cabeçalho, mostra os aplicativos, responde mensagens, namora pelo app, lê o jornal. */
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import Celular from '../v15/celular/Celular';
import { adulto, pessoaNova } from '../../motor/__tests__/cenarios';
import { vincular } from '../../motor/pessoas';
import { executar, type Acao } from '../../motor/acoes';
import { processarCelular15 } from '../../motor/v15/celular/celular15';
import type { Vida } from '../../motor/tipos';

function vidaComMensagens(): Vida {
  for (let s = 1; s < 40; s++) {
    const v = structuredClone(adulto(28, { semente: s }));
    v.financas.conta = 50000;
    v.eu.atracao = 'mulheres';
    for (const vin of Object.values(v.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
    for (let k = 0; k < 6; k++) { const p = pessoaNova(v, 27, 'feminino'); const vin = vincular(v, p, { origem: 'trabalho', proximidade: 62, estagio: 'amigo_proximo' }); vin.tUltimoContato = v.t - 30; }
    v.t += 12;
    processarCelular15(v);
    if (v.celular15!.msgs.some(m => m.tipo === 'convite')) return v;
  }
  throw new Error('sem convite');
}

function Palco({ inicial, app }: { inicial: Vida; app?: 'inicio' | 'namoro' | 'noticias' }) {
  const [v, setV] = useState(inicial);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return !r.aviso || r.vida !== v; };
  return <Celular vida={v} agir={agir} aoFechar={() => {}} irPara={() => {}} irLugar={() => {}} abrirPessoa={() => {}} appInicial={app} />;
}

describe('VIDA 15 · o celular na tela', () => {
  it('a tela inicial tem os aplicativos e a notificação; Mensagens abre a conversa e responder mostra o que aconteceu', async () => {
    const v = vidaComMensagens();
    render(<Palco inicial={v} />);
    const apps = screen.getByRole('list', { name: 'Aplicativos' });
    for (const n of ['Mensagens', 'Namoro', 'Rede', 'Notícias', 'Agenda', 'Mapas', 'Banco', 'E-mail']) expect(within(apps).getByRole('button', { name: new RegExp(`^${n}`) })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Notificações' })).toBeTruthy();
    fireEvent.click(within(apps).getByRole('button', { name: /^Mensagens/ }));
    const conversas = await screen.findByRole('list', { name: 'Conversas' });
    const m = v.celular15!.msgs.find(x => x.tipo === 'convite')!;
    fireEvent.click(within(conversas).getByRole('button', { name: new RegExp(v.pessoas[m.de!].nome) }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Topar' })); });
    expect(screen.getByText('Topo!')).toBeTruthy();
  });

  it('o namoro mostra um perfil com curtir e passar', async () => {
    render(<Palco inicial={vidaComMensagens()} app="namoro" />);
    expect(await screen.findByRole('button', { name: /^Curtir / })).toBeTruthy();
    const passar = screen.getByRole('button', { name: /^Passar / });
    const nome = passar.getAttribute('aria-label');
    await act(async () => { fireEvent.click(passar); });
    expect(screen.getByRole('button', { name: /^Passar / }).getAttribute('aria-label')).not.toBe(nome);
  });

  it('o jornal tem nome, edição e editorias', () => {
    render(<Palco inicial={vidaComMensagens()} app="noticias" />);
    expect(screen.getByText(/Edição de/)).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Destaques' })).toBeTruthy();
  });
});
