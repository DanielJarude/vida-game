/** VIDA 38 · bloco 3 — ajudar a cidade: doar para uma causa ou ser voluntário. Usa o mesmo botão de ação do jogo. */
import type { Acao } from '../../motor/acoes';
import { BotaoAcao } from '../comum';
import type { Vida } from '../../motor/tipos';
import { dinheiro as fmt } from '../../motor/texto';

type Props = { vida: Vida; agir: (a: Acao) => boolean };

export function AjudarACidade({ vida, agir }: Props) {
  const total = vida.fatos['ajudar:total'] ?? 0;
  return (
    <section className="ajudar-cidade" aria-labelledby="titulo-ajudar">
      <h2 id="titulo-ajudar" className="secao-fio">Ajudar a cidade</h2>
      <p className="nota">Cada ajuda vale uma vez por ano. Doar custa dinheiro de verdade; o voluntariado não custa, mas cansa.{total > 0 ? ` Até hoje você já doou ${fmt(total)}.` : ''}</p>
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'personalizar', op: { o: 'ajudar_dinheiro', valor: 'pequena' } }} variante="secundario">Doar para uma vaquinha</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'personalizar', op: { o: 'ajudar_dinheiro', valor: 'grande' } }} variante="secundario">Doar para uma campanha da cidade</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'personalizar', op: { o: 'voluntariar' } }} variante="secundario">Ser voluntário no mutirão</BotaoAcao>
      </div>
    </section>
  );
}
