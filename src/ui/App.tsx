import { useEffect } from 'react';
import { useVida } from './useVida';
import { Inicio } from './telas/Inicio';
import { sobDemanda } from './util/sobDemanda';
import { carregarMotor } from './motor';
import { AvisoAtualizacao } from './pwa/AvisoAtualizacao';

// O jogo, a criação e as vidas passadas chegam sob demanda (pacotes à parte): a primeira tela é só a inicial.
const Criacao = sobDemanda(() => import('./telas/Criacao').then(m => m.Criacao));
const Jogo = sobDemanda(() => import('./telas/Jogo').then(m => m.Jogo));
const Vidas = sobDemanda(() => import('./telas/Vidas').then(m => m.Vidas));

/** Busca tudo o que a vida vai pedir (o motor e as telas) — logo depois da primeira tela. */
export function precarregar(): Promise<unknown> {
  return Promise.all([carregarMotor(), Criacao.precarregar(), Jogo.precarregar(), Vidas.precarregar()]);
}

export function App() {
  const c = useVida();
  useEffect(() => { void precarregar(); }, []);
  return (
    <div className="app">
      {c.tela === 'inicio' && <Inicio c={c} />}
      {c.tela === 'criacao' && <Criacao c={c} />}
      {c.tela === 'jogo' && c.vida && <Jogo c={c} />}
      {c.tela === 'vidas' && <Vidas c={c} />}
      <AvisoAtualizacao />
      <div className="avisos" aria-live="polite">
        {c.aviso && <p key={c.aviso.id} className={`aviso aviso--${c.aviso.tom}`}>{c.aviso.texto}</p>}
      </div>
    </div>
  );
}
