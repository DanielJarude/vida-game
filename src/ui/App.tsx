import { useVida } from './useVida';
import { Inicio } from './telas/Inicio';
import { Criacao } from './telas/Criacao';
import { Jogo } from './telas/Jogo';
import { Vidas } from './telas/Vidas';

export function App() {
  const c = useVida();
  return (
    <div className="app">
      {c.tela === 'inicio' && <Inicio c={c} />}
      {c.tela === 'criacao' && <Criacao c={c} />}
      {c.tela === 'jogo' && c.vida && <Jogo c={c} />}
      {c.tela === 'vidas' && <Vidas c={c} />}
      <div className="avisos" aria-live="polite">
        {c.aviso && <p key={c.aviso.id} className={`aviso aviso--${c.aviso.tom}`}>{c.aviso.texto}</p>}
      </div>
    </div>
  );
}
