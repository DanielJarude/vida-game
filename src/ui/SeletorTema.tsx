/**
 * REWORK 6.5 — o controle da aparência (Claro · Escuro · Automático). Um grupo de rádio de verdade (teclado com as
 * setas, `aria-checked`), com a palavra e uma amostra — a escolha nunca depende só da cor.
 */
import { useState } from 'react';
import { APARENCIAS, escolherAparencia, lerAparencia, type Aparencia } from './tema';

/** A preferência e a troca. (Acompanhar o sistema no Automático é de `tema.iniciarTema`, ligado uma vez em main.tsx.) */
export function useAparencia() {
  const [aparencia, setAparencia] = useState<Aparencia>(() => lerAparencia());
  const escolher = (a: Aparencia) => { escolherAparencia(a); setAparencia(a); };
  return { aparencia, escolher };
}

export function SeletorTema({ compacto = false }: { compacto?: boolean }) {
  const { aparencia, escolher } = useAparencia();
  const mover = (e: React.KeyboardEvent, k: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const prox = APARENCIAS[(k + d + APARENCIAS.length) % APARENCIAS.length];
    escolher(prox.id);
    (e.currentTarget.parentElement?.querySelector(`[data-aparencia="${prox.id}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div className={`tema-seletor${compacto ? ' tema-seletor--compacto' : ''}`}>
      <span className="tema-seletor__rotulo" id="tema-seletor-rotulo">Aparência</span>
      <div className="tema-seletor__opcoes" role="radiogroup" aria-labelledby="tema-seletor-rotulo">
        {APARENCIAS.map((a, k) => {
          const ativo = a.id === aparencia;
          return (
            <button key={a.id} type="button" role="radio" aria-checked={ativo} tabIndex={ativo ? 0 : -1} data-aparencia={a.id}
              className={`tema-seletor__opcao${ativo ? ' tema-seletor__opcao--ativa' : ''}`} onClick={() => escolher(a.id)} onKeyDown={e => mover(e, k)}>
              <span className={`tema-seletor__amostra tema-seletor__amostra--${a.id}`} aria-hidden />
              <span className="tema-seletor__nome">{a.rotulo}</span>
              {!compacto && <span className="tema-seletor__nota">{a.nota}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
