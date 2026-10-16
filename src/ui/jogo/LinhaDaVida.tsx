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
 *
 * REWORK 6.5: cada acontecimento segue a mesma ordem de leitura — a idade/o ano na margem → o tipo (o tema do marco,
 * "sua escolha") numa linha própria → a narrativa. Nada se sobrepõe: a margem é medida em rem e só leva o número (o
 * nascimento é "0 · ao nascer"; a palavra "Nascimento" em 2rem não cabia na margem e se deitava sobre o tema do
 * marco), e o tema não repete o que a margem já diz (o marco do nascimento no ano 0).
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
                  <span className="ano__idade">{a.idade}<span className="ano__unidade"> {a.idade === 0 ? 'ao nascer' : a.idade === 1 ? 'ano' : 'anos'}</span></span>
                  <span className="ano__calendario">{a.ano}</span>
                  {novo && <span className="ano__selo">este ano</span>}
                </h3>
                <ul className="entradas">
                  {a.entradas.map(e => <ItemBiografia key={e.id} e={e} nova={idNovas.has(e.id)} idade={a.idade} />)}
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

/** O tema que a margem já diz não se repete: o marco do nascimento, no ano 0, já está na idade ("0 · ao nascer"). */
export function temaDoMarco(e: Entrada, idadeDoAno: number): string | null {
  if (e.relevancia !== 'marco') return null;
  if (e.tema === 'nascimento' && idadeDoAno === 0) return null;
  return TEMA_ROTULO[e.tema] ?? null;
}

function ItemBiografia({ e, nova, idade }: { e: Entrada; nova: boolean; idade: number }) {
  const tema = temaDoMarco(e, idade);
  return (
    <li className={`entrada entrada--${e.relevancia} entrada--tema-${e.tema}${nova ? ' entrada--nova' : ''}${e.tom ? ` entrada--${e.tom}` : ''}${e.escolha ? ' entrada--escolha' : ''}`}>
      {(tema || e.escolha) && (
        <p className="entrada__tipo">
          {tema && <span className="entrada__tema">{tema}</span>}
          {e.escolha && <span className="entrada__escolha" title="Uma escolha sua">sua escolha</span>}
        </p>
      )}
      <p className="entrada__texto">{e.texto}</p>
    </li>
  );
}
