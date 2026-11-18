/**
 * VIDA 27 · §15 — a saúde mental na ficha de saúde: a fase (ou a recuperação), o que pesa, o que ajuda, e onde há
 * ajuda (no jogo e, fora dele, a linha real). O motor é `motor/v27/mente/mente27`.
 */
import type { Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import { fatoresDoSofrimento27, linhaDeApoio27, nomeDaFase27 } from '../../motor/v27/mente/mente27';

export function SaudeMental27({ vida }: { vida: Vida }) {
  const c = vida.mente.crise27;
  if (!c) return null;
  const emCurso = c.fim === undefined && c.nivel > 0;
  const fs = fatoresDoSofrimento27(vida);
  const pesa = fs.filter(f => f.peso > 0).sort((a, b) => b.peso - a.peso).slice(0, 4);
  const ajuda = fs.filter(f => f.peso < 0);
  return (
    <section className="voce-condicoes mente27" aria-label="Saúde mental">
      <h2 className="voce-subtitulo">Saúde mental</h2>
      <p className="nota">
        {emCurso ? <>Agora: <strong>{nomeDaFase27(c.nivel)}</strong>, desde {anoDe(c.t)}.</> : <>Em recuperação desde {anoDe(c.fim!)} — o que passou continua na sua história.</>}
      </p>
      {emCurso && pesa.length > 0 && <p className="nota">O que pesa: {pesa.map(f => f.texto).join(', ')}.</p>}
      {ajuda.length > 0 && <p className="nota">O que ajuda: {ajuda.map(f => f.texto).join(', ')}.</p>}
      {emCurso && <p className="nota">Pedir ajuda funciona: contar para alguém próximo, procurar atendimento (Cuidados), ligar para {linhaDeApoio27(vida)}. Fora do jogo, no Brasil: CVV, 188 (24 horas, de graça).</p>}
    </section>
  );
}
