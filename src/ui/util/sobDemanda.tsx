/**
 * Carregamento sob demanda com cache de módulo: a primeira vez, carrega (e
 * mostra um aviso curto); depois, é síncrono. `precarregar()` busca antes de
 * precisar (a tela inicial já dispara o do jogo; os testes esperam por ele).
 */
import { useEffect, useState, type ComponentType } from 'react';

export type SobDemanda<P> = ComponentType<P> & { precarregar: () => Promise<void> };

export function sobDemanda<P extends object>(carregar: () => Promise<ComponentType<P>>): SobDemanda<P> {
  let C: ComponentType<P> | null = null;
  let promessa: Promise<void> | null = null;
  const precarregar = () => (promessa ??= carregar().then(m => { C = m; }));
  function Componente(props: P) {
    const [, setPronto] = useState(0);
    useEffect(() => { if (!C) { let vivo = true; void precarregar().then(() => { if (vivo) setPronto(1); }); return () => { vivo = false; }; } return undefined; }, []);
    if (C) return <C {...props} />;
    return <p className="carregando" role="status">Carregando…</p>;
  }
  return Object.assign(Componente, { precarregar });
}
