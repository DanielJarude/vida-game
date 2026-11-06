/**
 * VIDA 12.9 — na ficha da prática: o instrumento (qual, o degrau em cada um, trocar sem perder o que aprendeu) e os
 * marcos do hobby (a foto na parede, o almoço de domingo) — o que `sistemas/hobbies129` registrou, nada inventado.
 */
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { anoDe } from '../../motor/tempo';
import { leituraDosHobbies } from '../../motor/sistemas/hobbies129';
import { BotaoAcao } from '../comum';

const COM_MARCOS = new Set(['musica', 'fotografia', 'desenho', 'pintura', 'cozinhar', 'jardinagem']);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function HobbyNaFicha({ vida, agir, id }: { vida: Vida; agir: (a: Acao) => boolean; id: string }) {
  if (!COM_MARCOS.has(id)) return null;
  const l = leituraDosHobbies(vida, id);
  const atual = l.instrumentos.find(i => i.id === l.atual)!;
  const outros = l.instrumentos.filter(i => i.id !== l.atual);
  return (
    <section className="ficha-pratica__bloco hobby129" aria-label={id === 'musica' ? 'O instrumento' : 'Marcos'}>
      {id === 'musica' && (
        <>
          <h3 className="ficha-pratica__sub">O instrumento: {atual.nome}</h3>
          <p>{cap(atual.nivel.nome)}{atual.nivel.proximo ? <span className="nota"> · próximo degrau ({atual.nivel.proximo}) em uns {Math.max(1, Math.ceil(atual.nivel.falta / 12))} {Math.ceil(atual.nivel.falta / 12) <= 1 ? 'ano' : 'anos'} no ritmo de aula</span> : null}{!atual.tem ? <span className="nota"> · sem um em casa, rende menos</span> : null}</p>
          {outros.some(i => i.meses > 0) && <p className="nota">Também toca: {outros.filter(i => i.meses > 0).map(i => `${i.nome} (${i.nivel.nome})`).join(', ')}.</p>}
          <details className="detalhes"><summary>Aprender outro instrumento</summary>
            <ul className="hobby129__instrumentos">
              {outros.map(i => <li key={i.id}><BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'instrumento', id: i.id }} variante="discreto">{cap(i.nome)}{i.meses > 0 ? ` (${i.nivel.nome})` : ''}</BotaoAcao></li>)}
            </ul>
          </details>
        </>
      )}
      <h3 className="ficha-pratica__sub">Marcos</h3>
      {l.marcos.length ? <ul className="hobby129__marcos">{l.marcos.slice(0, 8).map(m => <li key={m.id}><span className="nota">{anoDe(m.t)}</span> {m.texto}</li>)}</ul> : <p className="nota">Ainda nenhum — eles chegam com a prática.</p>}
    </section>
  );
}
