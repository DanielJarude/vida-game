/**
 * VIDA 14 · o mundo em que a vida acontece (Você → No mundo): o que está pesando agora (crise, pandemia, setor em alta)
 * e o que muda na vida, as restrições, e a linha do tempo vivida por década — tecnologia, ciência, desastres, profissões
 * que surgem e somem. Lido de `resumoDoMundo14` — a tela não faz conta.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import { resumoDoMundo14 } from '../../../motor/v14/mundo/mundo14';
import '../politica/politica14.css';

const TIPO: Record<string, string> = { economia: 'Economia', tecnologia: 'Tecnologia', ciencia: 'Ciência', desastre: 'Desastre', pandemia: 'Pandemia', cultura: 'Cultura', esporte: 'Esporte', internacional: 'Mundo', trabalho: 'Trabalho', produtos: 'Produtos' };

export function Mundo14({ vida }: { vida: Vida }) {
  const [abertas, setAbertas] = useState(1);
  const r = resumoDoMundo14(vida);
  if (!r.decadas.length && !r.antes.length) return null;
  return (
    <section className="p14" aria-label="O mundo">
      <div className="p14__bloco">
        <p className="p14__kicker">O mundo agora · {r.ano}</p>
        {r.ativos.length === 0 && <p className="nota">Nada de fora pesando na sua vida neste ano.</p>}
        <ul className="p14__medidas">
          {r.ativos.map(x => <li key={x.ev.id} className="p14__medida"><p className="p14__medida-nome"><span>{x.ev.titulo}</span><small>{TIPO[x.ev.tipo] ?? x.ev.tipo}{x.ev.lugar ? ` · ${x.ev.lugar}` : ''}{x.ev.ate && x.ev.ate > x.ev.ano ? ` · até ${x.ev.ate}` : ''}</small></p>{x.efeito && <p className="p14__medida-efeito">{x.efeito}</p>}</li>)}
        </ul>
        {r.restricoes.map(x => <p key={x} className="nota nota--atencao">{x}</p>)}
      </div>
      {r.decadas.length > 0 && (
        <div className="p14__bloco">
          <p className="p14__kicker">O que o mundo viveu</p>
          {r.decadas.slice(0, abertas).map(d => (
            <div key={d.decada}>
              <p className="p14__sub">Anos {d.decada}</p>
              <ul className="historico-politico">{d.eventos.map(e => <li key={e.id}><strong>{e.ano}</strong> · {e.titulo}{e.efeito ? ` — ${e.efeito}` : ''}</li>)}</ul>
            </div>
          ))}
          {abertas < r.decadas.length && <button type="button" className="botao botao--discreto" onClick={() => setAbertas(n => n + 2)}>Décadas anteriores</button>}
        </div>
      )}
    </section>
  );
}

export default Mundo14;
