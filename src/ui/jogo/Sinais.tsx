/**
 * REWORK 6 — os sinais da pessoa num relance: cada dimensão que o motor tem (bem-estar, cabeça, saúde e, com a idade,
 * corpo, aprendizado e aparência), com o nível em cinco marcas, a palavra e a seta da tendência. É a mesma leitura
 * que Você detalha (`estadoPessoal.sinaisDaVida`) — aqui só o resumo, para a Linha da Vida e o alto de Você.
 * Nada depende só de cor: a palavra diz o estado; a seta tem texto para leitor de tela.
 */
import type { Vida } from '../../motor/tipos';
import { sinaisDaVida } from '../estadoPessoal';

export function Medidor({ nivel, nome }: { nivel: number; nome: string }) {
  return (
    <span className="medidor" role="img" aria-label={`${nome}: ${nivel} de 5`}>
      {[1, 2, 3, 4, 5].map(k => <span key={k} className={`medidor__marca${k <= nivel ? ' medidor__marca--cheia' : ''}`} />)}
    </span>
  );
}

export function Sinais({ vida, aoAbrir, titulo }: { vida: Vida; aoAbrir?: () => void; titulo?: string }) {
  const ss = sinaisDaVida(vida);
  return (
    <section className="sinais" aria-label={titulo ?? 'Como você está'}>
      <ul className="sinais__lista">
        {ss.map(s => (
          <li key={s.id} className={`sinal sinal--${s.id} sinal--n${s.nivel}`}>
            <span className="sinal__nome">{s.nome}</span>
            <Medidor nivel={s.nivel} nome={s.nome} />
            <span className="sinal__palavra">
              {s.palavra}
              {s.tendencia === 'melhorando' && <span className="sinal__seta sinal__seta--sobe" title="vem melhorando"> ↗<span className="sr-only"> vem melhorando</span></span>}
              {s.tendencia === 'piorando' && <span className="sinal__seta sinal__seta--desce" title="vem piorando"> ↘<span className="sr-only"> vem piorando</span></span>}
            </span>
          </li>
        ))}
      </ul>
      {aoAbrir && <button type="button" className="sinais__abrir" onClick={aoAbrir}>Por quê, e o que fazer <span aria-hidden>→</span></button>}
    </section>
  );
}
