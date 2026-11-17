/**
 * VIDA 25 · A FICHA DO ATLETA — a mesma forma para toda carreira esportiva (o futebol, o basquete, o vôlei, as
 * individuais, os e-sports), com o que é de cada uma: os grupos (técnicos, físicos, táticos; nos e-sports, mecânicos,
 * táticos, de equipe e mentais), os atributos que a modalidade (a posição, a função, o jogo) usa, o peso de cada um.
 *
 * Tudo vem do motor: o valor é o que a temporada lê; o "antes" é a fotografia do fim do ano anterior (quando existe — os
 * anos anteriores à VIDA 25 não têm, e a ficha diz isso em vez de inventar); a evolução é a série dessas fotografias. A
 * régua marca onde estava o valor no ano anterior; a seta só aparece quando o número mudou de verdade.
 */
import { useId } from 'react';
import './ficha25.css';

export interface LinhaFicha25 {
  id: string;
  nome: string;
  grupo: string;
  valor: number;
  /** O valor na fotografia anterior (ausente: sem fotografia). */
  antes?: number;
  /** A série das fotografias (a evolução), mais antiga primeiro. */
  serie: number[];
  sobre: string;
  /** O peso na função/posição (0–1), quando a modalidade pesa. */
  peso?: number;
}

const num = (x: number) => (Math.round(x * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const palavraDoValor25 = (x: number) => (x >= 85 ? 'de elite' : x >= 72 ? 'muito bom' : x >= 60 ? 'bom' : x >= 47 ? 'regular' : x >= 34 ? 'em formação' : 'iniciante');

function Linha({ serie, rotulo }: { serie: number[]; rotulo: string }) {
  if (serie.length < 2) return null;
  const min = Math.min(...serie), max = Math.max(...serie);
  const amp = Math.max(4, max - min);
  const pts = serie.map((y, k) => `${(k / (serie.length - 1)) * 80},${18 - ((y - min) / amp) * 16 - 1}`).join(' ');
  return <svg className="f25-linha" viewBox="0 0 80 18" width={80} height={18} role="img" aria-label={`${rotulo}: ${serie.map(num).join(' → ')}`}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Atributo({ l }: { l: LinhaFicha25 }) {
  const d = l.antes === undefined ? undefined : Math.round((l.valor - l.antes) * 10) / 10;
  const dir = d === undefined ? 'novo' : d >= 0.5 ? 'sobe' : d <= -0.5 ? 'cai' : 'igual';
  const peso = l.peso === undefined ? undefined : l.peso >= 0.22 ? 'pesa muito' : l.peso >= 0.12 ? 'pesa' : 'pesa pouco';
  return (
    <li className={`f25-attr f25-attr--${dir}`} data-atributo={l.id}>
      <details>
        <summary className="f25-attr__linha">
          <span className="f25-attr__nome">{cap(l.nome)}{peso && <small className="f25-attr__peso"> · {peso}</small>}</span>
          <span className="f25-attr__regua" aria-hidden>
            <span className="f25-attr__barra" style={{ width: `${Math.max(2, Math.min(100, l.valor))}%` }} />
            {l.antes !== undefined && <i className="f25-attr__antes" style={{ left: `${Math.max(0, Math.min(100, l.antes))}%` }} />}
          </span>
          <span className="f25-attr__valor" aria-label={`${l.nome}: ${num(l.valor)} de 100`}>{Math.round(l.valor)}</span>
          <span className={`f25-attr__delta f25-attr__delta--${dir}`}>{d === undefined ? '' : dir === 'igual' ? '=' : `${d > 0 ? '↗ +' : '↘ −'}${num(Math.abs(d))}`}<span className="sr-only">{d === undefined ? 'sem registro anterior' : dir === 'igual' ? 'igual ao ano anterior' : dir === 'sobe' ? 'subiu em relação ao ano anterior' : 'caiu em relação ao ano anterior'}</span></span>
        </summary>
        <div className="f25-attr__mais">
          <p>{l.sobre}</p>
          <p className="f25-attr__dados">Agora: <b>{num(l.valor)}</b> ({palavraDoValor25(l.valor)}){l.antes !== undefined ? <> · no ano anterior: {num(l.antes)}</> : <> · sem fotografia do ano anterior</>}</p>
          {l.serie.length >= 2 && <p className="f25-attr__evolucao">Evolução <Linha serie={l.serie} rotulo={l.nome} /> <small>{l.serie.map(num).join(' → ')}</small></p>}
        </div>
      </details>
    </li>
  );
}

export function FichaDeAtleta25({ titulo, nivel, nivelRotulo, nivelSerie, grupos, linhas, fortes, fracos, rodape }: {
  titulo: string; nivel?: number; nivelRotulo?: string; nivelSerie?: number[];
  grupos: { id: string; nome: string }[]; linhas: LinhaFicha25[]; fortes: string[]; fracos: string[]; rodape?: string;
}) {
  const id = useId();
  if (!linhas.length) return null;
  const nomeDe = (x: string) => linhas.find(l => l.id === x)?.nome ?? x;
  const semAntes = linhas.every(l => l.antes === undefined);
  return (
    <section className="f25" aria-labelledby={`${id}-t`}>
      <header className="f25__cabeca">
        <h3 id={`${id}-t`} className="f25__titulo">{titulo}</h3>
        {nivel !== undefined && (
          <p className="f25__nivel"><span className="f25__nivel-num">{Math.round(nivel)}</span><span className="f25__nivel-rot">{nivelRotulo ?? 'nível'} · {palavraDoValor25(nivel)}</span>{nivelSerie && <Linha serie={nivelSerie} rotulo={nivelRotulo ?? 'nível'} />}</p>
        )}
      </header>
      {(fortes.length > 0 || fracos.length > 0) && (
        <ul className="f25__resumo" aria-label="Pontos fortes e limitações">
          {fortes.map(x => <li key={`f${x}`} className="f25__forte"><span aria-hidden>▲ </span><span className="sr-only">Ponto forte: </span>{cap(nomeDe(x))}</li>)}
          {fracos.map(x => <li key={`c${x}`} className="f25__fraco"><span aria-hidden>▼ </span><span className="sr-only">Limitação: </span>{cap(nomeDe(x))}</li>)}
        </ul>
      )}
      {grupos.map(g => {
        const ls = linhas.filter(l => l.grupo === g.id);
        if (!ls.length) return null;
        return (
          <div key={g.id} className="f25__grupo">
            <h4 className="f25__grupo-nome">{g.nome}</h4>
            <ul className="f25__lista">{ls.map(l => <Atributo key={l.id} l={l} />)}</ul>
          </div>
        );
      })}
      <p className="f25__rodape">{semAntes ? 'A comparação com o ano anterior aparece a partir do próximo fim de temporada. ' : 'A marca na régua é onde o atributo estava no fim do ano anterior. '}{rodape}</p>
    </section>
  );
}
