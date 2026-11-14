/**
 * VIDA 21 · os números do ofício: o que a sua profissão conta (pacientes, plantões, obras, pratos, quilômetros…), na
 * carreira inteira e no último ano. As trilhas com números próprios (esporte, artes, política) apontam para eles.
 */
import type { Vida } from '../../../motor/tipos';
import "./carreiras21.css";
import { numerosDoOficio, numerosEmOutroLugar } from '../../../motor/v21/carreiras/oficio21';

const fmt = (n: number) => n.toLocaleString('pt-BR');

export function NumerosDoOficio({ vida }: { vida: Vida }) {
  const ns = numerosDoOficio(vida);
  const outro = numerosEmOutroLugar(vida);
  if (!ns.length && !outro) return null;
  return (
    <section className="numeros-oficio-bloco" aria-labelledby="titulo-numeros-oficio">
      <h3 id="titulo-numeros-oficio" className="subtitulo">Os números do seu ofício</h3>
      {outro && <p className="nota">{outro}</p>}
      {ns.length > 0 && (
        <dl className="numeros-oficio">
          {ns.map(n => (
            <div key={`${n.trilha}:${n.indicador.id}`}>
              <dt>{n.indicador.rotulo.charAt(0).toUpperCase() + n.indicador.rotulo.slice(1)}</dt>
              <dd><strong>{fmt(n.valor)}</strong>{n.doAno > 0 && <span className="nota"> · {fmt(n.doAno)} no último ano</span>}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
