/**
 * "Há uma versão nova do VIDA": discreto, não bloqueia nada e só aparece
 * quando uma versão nova já baixou e está esperando. Atualizar espera a vida
 * terminar de ser gravada antes de recarregar — nunca no meio de um save.
 */
import { useEffect, useState } from 'react';
import { registrarServiceWorker, type Atualizar } from './registrar';
import { aguardarGravacoes } from '../persistencia';

export function AvisoAtualizacao({ atualizacao }: { atualizacao?: Atualizar | null } = {}) {
  const [atualizar, setAtualizar] = useState<Atualizar | null>(() => atualizacao ?? null);
  const [atualizando, setAtualizando] = useState(false);
  useEffect(() => { void registrarServiceWorker(f => setAtualizar(() => f)); }, []);
  if (!atualizar) return null;
  const aceitar = async () => {
    setAtualizando(true);
    try {
      await aguardarGravacoes();
      await atualizar();
    } catch {
      setAtualizando(false);
    }
  };
  return (
    <div className="versao-nova" role="status" aria-label="Versão nova">
      <p>Há uma versão nova do VIDA.</p>
      <div className="versao-nova__acoes">
        <button type="button" className="botao botao--principal" disabled={atualizando} onClick={() => void aceitar()}>{atualizando ? 'Atualizando…' : 'Atualizar agora'}</button>
        <button type="button" className="botao botao--discreto" disabled={atualizando} onClick={() => setAtualizar(null)}>Agora não</button>
      </div>
    </div>
  );
}
