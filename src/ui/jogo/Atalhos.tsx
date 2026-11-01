/**
 * VIDA 12.6 — a estrela que guarda uma ação nos atalhos, a faixa "Seus atalhos" (no painel de agora) e a folha dos
 * últimos avisos (no Menu).
 */
import { useEffect, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { alternarAtalho, atalhosDe, avisosDe, ehAtalho, EVENTO_ATALHOS } from '../atalhos';
import { BotaoAcao, Folha } from '../comum';

function useAtalhos(vidaId: string) {
  const [, setN] = useState(0);
  useEffect(() => { const f = () => setN(n => n + 1); window.addEventListener(EVENTO_ATALHOS, f); return () => window.removeEventListener(EVENTO_ATALHOS, f); }, []);
  return atalhosDe(vidaId);
}

export function Estrela({ vida, acao, rotulo }: { vida: Vida; acao: Acao; rotulo: string }) {
  useAtalhos(vida.id);
  const marcado = ehAtalho(vida.id, acao);
  return (
    <button type="button" className={`estrela-atalho${marcado ? ' estrela-atalho--marcada' : ''}`} aria-pressed={marcado} aria-label={marcado ? `Tirar dos atalhos: ${rotulo}` : `Guardar nos atalhos: ${rotulo}`} title={marcado ? 'Tirar dos atalhos' : 'Guardar nos atalhos'}
      onClick={() => alternarAtalho(vida.id, acao, rotulo)}>{marcado ? '★' : '☆'}</button>
  );
}

export function SeusAtalhos({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const xs = useAtalhos(vida.id);
  if (!xs.length) return null;
  return (
    <section className="seus-atalhos" aria-label="Seus atalhos">
      <h2 className="painel-agora__titulo">Seus atalhos</h2>
      <ul className="seus-atalhos__lista">
        {xs.map(x => (
          <li key={JSON.stringify(x.acao)}>
            <BotaoAcao vida={vida} acao={x.acao} agir={agir} variante="discreto" ocultarImpossivel>{x.rotulo}</BotaoAcao>
            <Estrela vida={vida} acao={x.acao} rotulo={x.rotulo} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function UltimosAvisos({ vida, aoFechar }: { vida: Vida; aoFechar: () => void }) {
  const xs = avisosDe(vida.id);
  return (
    <Folha titulo="Últimos avisos" rotulo="Últimos avisos" aoFechar={aoFechar}>
      {xs.length ? (
        <ol className="ultimos-avisos">
          {xs.map((a, k) => <li key={k}><span className="ultimos-avisos__quando">{a.ano} · {a.idade} anos</span>{a.titulo ? <strong> {a.titulo}.</strong> : null} {a.texto}</li>)}
        </ol>
      ) : <p className="nota">Nenhum aviso guardado ainda neste aparelho.</p>}
      <p className="nota">Guardados só neste navegador. A história inteira continua em História · Linha da Vida.</p>
    </Folha>
  );
}
