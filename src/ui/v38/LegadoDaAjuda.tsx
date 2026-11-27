/** VIDA 38 · legado: o que a pessoa fez pela cidade e quantas escolhas tomou, em frases curtas (na tela de fim). */
import type { Vida } from '../../motor/tipos';
import { fazerLegadoDaAjuda } from './legadoAjuda';

export function LegadoDaAjuda({ vida }: { vida: Vida }) {
  const linhas = fazerLegadoDaAjuda(vida);
  if (!linhas.length) return null;
  return (
    <section className="fim__legado" aria-labelledby="fim-cidade">
      <h2 id="fim-cidade">O que você fez pela cidade</h2>
      <ul>{linhas.map((t, k) => <li key={k}>{t}</li>)}</ul>
    </section>
  );
}
