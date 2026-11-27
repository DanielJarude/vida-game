/** VIDA 38 · bloco 3 — dependências na aba de corpo: usar ou parar. O nível aparece em palavras, nunca em número. */
import type { Acao } from '../../motor/acoes';
import { BotaoAcao } from '../comum';
import type { Vida } from '../../motor/tipos';

type Props = { vida: Vida; agir: (a: Acao) => boolean };
const P = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });
const palavra = (n: number) => (n >= 50 ? 'forte' : n >= 20 ? 'presente' : n > 0 ? 'leve' : null);

export function Vicios38({ vida, agir }: Props) {
  const alcool = palavra(vida.fatos['vicio:alcool'] ?? 0);
  const cigarro = palavra(vida.fatos['vicio:cigarro'] ?? 0);
  return (
    <section className="vicios38" aria-labelledby="titulo-vicios38">
      <h2 id="titulo-vicios38" className="secao-fio">Hábitos</h2>
      {alcool && <p className="nota">A vontade de beber está {alcool}.</p>}
      {cigarro && <p className="nota">A vontade de fumar está {cigarro}.</p>}
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'vicio', substancia: 'alcool', acao: 'usar' })} variante="secundario">Tomar uma bebida</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'vicio', substancia: 'cigarro', acao: 'usar' })} variante="secundario">Fumar um cigarro</BotaoAcao>
        {alcool && <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'vicio', substancia: 'alcool', acao: 'parar' })} variante="secundario">Parar de beber</BotaoAcao>}
        {cigarro && <BotaoAcao vida={vida} agir={agir} acao={P({ o: 'vicio', substancia: 'cigarro', acao: 'parar' })} variante="secundario">Parar de fumar</BotaoAcao>}
      </div>
    </section>
  );
}
