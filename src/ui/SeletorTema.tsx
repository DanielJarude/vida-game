/**
 * REWORK 6.5 — o controle da aparência. Um grupo de rádio de verdade (teclado com as setas, `aria-checked`), com a
 * palavra e uma amostra — a escolha nunca depende só da cor.
 *
 * REWORK 7.5 — quatro paletas + Automático, cada uma com a PRÉVIA da página que ela dá: a moldura, o papel, a tinta,
 * a cor de agir e três tons de área. A prévia não é uma figura com cores escritas à mão: o elemento leva
 * `data-amostra="<paleta>"` e tokens.css lhe dá a paleta inteira (`--p-*`), a mesma que o jogo usará — trocar um valor
 * na paleta muda a prévia junto.
 */
import { useState } from 'react';
import { APARENCIAS, escolherAparencia, lerAparencia, type Aparencia, type Paleta } from './tema';

/** A preferência e a troca. (Acompanhar o sistema no Automático é de `tema.iniciarTema`, ligado uma vez em main.tsx.) */
export function useAparencia() {
  const [aparencia, setAparencia] = useState<Aparencia>(() => lerAparencia());
  const escolher = (a: Aparencia) => { escolherAparencia(a); setAparencia(a); };
  return { aparencia, escolher };
}

/** A miniatura de uma página na paleta: a moldura no alto, o papel com duas linhas de tinta, o botão de agir e os tons. */
function Previa({ paleta }: { paleta: Paleta }) {
  return (
    <span className="tema-previa" data-amostra={paleta} aria-hidden>
      <span className="tema-previa__moldura" />
      <span className="tema-previa__papel">
        <span className="tema-previa__linha" />
        <span className="tema-previa__linha tema-previa__linha--curta" />
        <span className="tema-previa__tons"><i /><i /><i /></span>
        <span className="tema-previa__acao" />
      </span>
    </span>
  );
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
              aria-label={`${a.rotulo} — ${a.nota}`}
              className={`tema-seletor__opcao${ativo ? ' tema-seletor__opcao--ativa' : ''}`} onClick={() => escolher(a.id)} onKeyDown={e => mover(e, k)}>
              <span className="tema-seletor__amostra">
                {a.id === 'auto' ? <><Previa paleta="claro" /><Previa paleta="escuro" /></> : <Previa paleta={a.id} />}
              </span>
              <span className="tema-seletor__nome">{a.rotulo}</span>
              {!compacto && <span className="tema-seletor__nota">{a.nota}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
