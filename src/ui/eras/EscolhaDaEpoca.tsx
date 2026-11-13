/**
 * ERAS HISTÓRICAS · "Quando você nasce" — a primeira escolha da tela Nascer.
 *
 * Seis portas: hoje (o VIDA de sempre, em qualquer país) ou uma década brasileira (1980–2020). Escolhida a década, o
 * ano; a prévia diz em poucas linhas o país, a tecnologia, a cultura, as moedas e o que a infância vai atravessar — sem
 * enciclopédia: o resto se vive.
 */
import { DECADAS } from '../../motor/eras/dados/culturaBR';
import { ACONTECIMENTOS_BR } from '../../motor/eras/dados/acontecimentosBR';
import { ObjetosDaEpoca } from './Aparelhos';
import './eras.css';

export type Epoca = 'hoje' | 1980 | 1990 | 2000 | 2010 | 2020;

const ANO_HOJE = 2026;

export function anosDaDecada(d: Exclude<Epoca, 'hoje'>): number[] {
  const x = DECADAS.find(y => y.decada === d)!;
  const out: number[] = [];
  for (let a = x.anos[0]; a <= x.anos[1]; a++) out.push(a);
  return out;
}

export function EscolhaDaEpoca({ epoca, ano, aoMudar }: { epoca: Epoca; ano: number; aoMudar: (e: Epoca, ano: number) => void }) {
  const d = epoca === 'hoje' ? undefined : DECADAS.find(x => x.decada === epoca);
  return (
    <fieldset className="campo epoca" data-era={epoca === 'hoje' ? 'hoje' : epoca}>
      <legend className="campo__rotulo">Quando você nasce</legend>
      <div className="epoca__portas" role="radiogroup" aria-label="Época do nascimento">
        <button type="button" role="radio" aria-checked={epoca === 'hoje'} className="epoca__porta" data-era="hoje" onClick={() => aoMudar('hoje', ANO_HOJE)}>
          <strong>Hoje</strong><span>{ANO_HOJE} · o mundo todo</span>
        </button>
        {DECADAS.map(x => (
          <button key={x.decada} type="button" role="radio" aria-checked={epoca === x.decada} className="epoca__porta" data-era={x.decada}
            onClick={() => aoMudar(x.decada as Epoca, epoca === x.decada ? ano : x.anos[0] + Math.min(4, x.anos[1] - x.anos[0]))}>
            <strong>{x.rotulo.replace('Anos ', '')}</strong><span>{x.anos[0]}–{x.anos[1]} · Brasil</span>
          </button>
        ))}
      </div>
      {!d ? (
        <p className="nota">O VIDA de sempre: a vida começa agora, em qualquer país do mundo, com o celular, as redes e os preços de hoje.</p>
      ) : (
        <div className="epoca__previa">
          <div className="epoca__anos" role="radiogroup" aria-label="Ano de nascimento">
            {anosDaDecada(d.decada as Exclude<Epoca, 'hoje'>).map(a => (
              <button key={a} type="button" role="radio" aria-checked={a === ano} className="chip epoca__ano" onClick={() => aoMudar(epoca, a)}>{a}</button>
            ))}
          </div>
          <div className="epoca__jornal">
            <div className="epoca__objetos" aria-hidden><ObjetosDaEpoca decada={d.decada as 1980} tamanho={58} /></div>
            <div className="epoca__texto">
              <p className="epoca__manchete">{d.contexto}</p>
              <dl className="epoca__fichas">
                <div><dt>Tecnologia</dt><dd>{d.tecnologia}</dd></div>
                <div><dt>Cultura</dt><dd>{d.cultura}</dd></div>
                <div><dt>Dinheiro</dt><dd>{d.moedas}</dd></div>
              </dl>
            </div>
          </div>
          <p className="epoca__rotulo">O que a sua infância atravessa</p>
          <ul className="epoca__marcos">
            {d.marcos.map(id => ACONTECIMENTOS_BR.find(a => a.id === id)).filter(a => a && a.data[0] >= ano - 1).slice(0, 4).map(a => (
              <li key={a!.id}><span className="epoca__marco-ano">{a!.data[0]}</span>{a!.titulo}</li>
            ))}
            <li><span className="epoca__marco-ano">→</span>E depois, as décadas seguintes, até hoje e além: a vida não fica presa ao ano em que começou.</li>
          </ul>
          <p className="nota">Nesta primeira versão, as épocas são vividas no Brasil. Os preços aparecem na moeda de cada momento; a tecnologia, as lojas, as profissões e os acontecimentos acompanham o calendário.</p>
        </div>
      )}
    </fieldset>
  );
}
