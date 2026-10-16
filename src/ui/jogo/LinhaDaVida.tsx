/**
 * A Linha da Vida: a biografia, não um log.
 *
 * O ano mais recente fica no alto (é o que o jogador acabou de viver); um
 * botão inverte para ler do começo, como um livro. Marcos têm peso visual
 * (e o tema, para quem passa o olho); o cotidiano aparece discreto; o técnico
 * (rotina de dinheiro) nem aparece. Anos sem nada não viram linhas vazias:
 * viram silêncio.
 *
 * REWORK 6: cada ano é um bloco com a idade grande na margem (a régua da vida),
 * o ano que acabou de passar ganha o destaque de "este ano", e uma vida longa
 * abre em partes — os últimos anos primeiro, o resto a um toque — para que
 * 80 anos de biografia não pesem a cada aniversário.
 */

import { useMemo, useState } from 'react';
import type { Entrada, Vida } from '../../motor/tipos';
import { anosDaBiografia, faseDaVida, TEMA_ROTULO } from '../apresentar';

/** Quantos anos aparecem de cada vez (o resto abre a pedido). */
export const ANOS_POR_VEZ = 20;

export function LinhaDaVida({ vida, marca }: { vida: Vida; marca: number }) {
  const [doComeco, setDoComeco] = useState(false);
  const [discreto, setDiscreto] = useState(true);
  const [limite, setLimite] = useState(ANOS_POR_VEZ);
  const anos = useMemo(() => anosDaBiografia(vida, discreto), [vida, discreto]);
  const idNovas = useMemo(() => new Set(vida.biografia.slice(marca).map(e => e.id)), [vida, marca]);
  const ordem = doComeco ? anos : [...anos].reverse();
  const visiveis = ordem.slice(0, limite);
  const faltam = ordem.length - visiveis.length;

  return (
    <div className="linha-da-vida">
      <div className="linha-da-vida__controles" role="group" aria-label="Como ler a biografia">
        <button type="button" className="chip" aria-pressed={doComeco} onClick={() => { setDoComeco(d => !d); setLimite(ANOS_POR_VEZ); }}>
          {doComeco ? 'Mais recente primeiro' : 'Ler do começo'}
        </button>
        <button type="button" className="chip" aria-pressed={!discreto} onClick={() => setDiscreto(d => !d)}>
          {discreto ? 'Só o que marcou' : 'Mostrar tudo'}
        </button>
      </div>
      <ol className="anos">
        {visiveis.map((a, k) => {
          const anterior = visiveis[k - 1];
          const salto = anterior ? Math.abs(anterior.idade - a.idade) : 1;
          const fase = faseDaVida(a.idade);
          const novoCapitulo = !anterior || faseDaVida(anterior.idade) !== fase;
          const novo = marca > 0 && a.entradas.some(e => idNovas.has(e.id));
          return (
            <li key={a.idade} className={`ano${novo ? ' ano--novo' : ''}`}>
              {novoCapitulo && <p className="ano__capitulo">{fase}</p>}
              {!novoCapitulo && salto > 2 && <p className="ano__silencio" aria-hidden>· · ·</p>}
              <div className="ano__corpo">
                <h3 className="ano__cabeca">
                  <span className="ano__idade">{a.idade === 0 ? 'Nascimento' : <>{a.idade}<span className="ano__unidade"> {a.idade === 1 ? 'ano' : 'anos'}</span></>}</span>
                  <span className="ano__calendario">{a.ano}</span>
                  {novo && <span className="ano__selo">este ano</span>}
                </h3>
                <ul className="entradas">
                  {a.entradas.map(e => <ItemBiografia key={e.id} e={e} nova={idNovas.has(e.id)} />)}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
      {faltam > 0 && (
        <button type="button" className="botao botao--secundario linha-da-vida__mais" onClick={() => setLimite(l => l + ANOS_POR_VEZ)}>
          {doComeco ? 'Continuar lendo' : 'Ver anos anteriores'} <span className="linha-da-vida__faltam">({faltam} {faltam === 1 ? 'ano' : 'anos'} com história)</span>
        </button>
      )}
    </div>
  );
}

function ItemBiografia({ e, nova }: { e: Entrada; nova: boolean }) {
  return (
    <li className={`entrada entrada--${e.relevancia} entrada--tema-${e.tema}${nova ? ' entrada--nova' : ''}${e.tom ? ` entrada--${e.tom}` : ''}${e.escolha ? ' entrada--escolha' : ''}`}>
      <span className="entrada__marca" aria-hidden />
      {e.relevancia === 'marco' && TEMA_ROTULO[e.tema] && <span className="entrada__tema">{TEMA_ROTULO[e.tema]}</span>}
      <p className="entrada__texto">
        {e.texto}
        {e.escolha && <span className="entrada__escolha" title="Uma escolha sua"> sua escolha</span>}
      </p>
    </li>
  );
}
