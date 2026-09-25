/**
 * Você: a pessoa, não as métricas.
 *
 * O rosto em primeiro lugar (com a expressão do momento), a fase da vida e
 * uma frase sobre agora. Depois, Humor, Cabeça e Saúde como três leituras:
 * uma palavra, uma escala que não depende de cor, a tendência, o que tem
 * ajudado, o que tem pesado — e o que dá para fazer a respeito. Os cuidados
 * vêm das causas: sobrecarga pede tirar algo da semana; luto pede gente perto.
 */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { tracosMarcantes } from '../../motor/personalidade';
import type { Dimensao } from '../../motor/sistemas/estado';
import { Retrato } from '../avatar/Retrato';
import { BotaoAcao, Vazio } from '../comum';
import { faseDaVida, ocupacaoAtual, ondeMora } from '../apresentar';
import { lutoVisivel, situacaoAfetiva } from '../leitura';
import { expressaoDe, lerDimensao, momentoAtual, palavraTendencia, type LeituraDimensao } from '../estadoPessoal';
import { ODinheiro } from './Dinheiro';

export type Destino = 'tempo' | 'rumo' | 'pessoas' | 'casa' | 'trabalho';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Destino) => void; abrirPessoa: (id: string) => void }

export function Voce({ vida, agir, irPara, abrirPessoa }: Props) {
  const i = idade(vida);
  const dims: Dimensao[] = i >= 10 ? ['humor', 'cabeca', 'saude'] : ['humor', 'saude'];
  const leituras = dims.map(d => lerDimensao(vida, d));
  const tracos = tracosMarcantes(vida);
  const afeto = situacaoAfetiva(vida);
  const luto = lutoVisivel(vida);
  const condicoes = vida.corpo.condicoes;
  return (
    <div className="voce">
      <section className="voce-rosto" aria-label="Como você está">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente="eu" tamanho={176} rotulo={`${vida.eu.nome} aos ${i}`} expressao={expressaoDe(vida)} />
        <div className="voce-rosto__texto">
          <p className="folio__kicker"><span className="folio__area">Você</span> · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
          <h1 className="voce-rosto__momento">{momentoAtual(vida)}</h1>
          <p className="voce-rosto__linha">{ocupacaoAtual(vida)} · {ondeMora(vida)}</p>
          {afeto && <p className="voce-rosto__linha">{afeto}{luto ? ` · ${luto}` : ''}</p>}
        </div>
      </section>

      <div className={`estados estados--${leituras.length}`}>
        {leituras.map(l => <Estado key={l.d} l={l} vida={vida} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} />)}
      </div>

      {i >= 8 && <ODinheiro vida={vida} agir={agir} irParaCasa={() => irPara('casa')} />}

      {condicoes.length > 0 && (
        <section className="voce-condicoes" aria-label="Condições de saúde">
          <h2 className="voce-subtitulo">O que o corpo carrega</h2>
          <ul>
            {condicoes.map(c => (
              <li key={c.id}>
                <strong>{c.nome.charAt(0).toUpperCase() + c.nome.slice(1)}</strong>
                <span>{c.tratando ? 'em tratamento' : vida.processos.some(p => p.tipo === 'tratamento' && p.condicaoId === c.id) ? 'na fila do SUS' : c.cronica ? 'sem tratamento' : 'passando'}{c.cronica ? '' : ' · deve passar'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tracos.length > 0 && (
        <p className="voce-tracos">Quem convive diz que você é {tracos.join(', ').replace(/, ([^,]*)$/, ' e $1')} — é o que suas escolhas têm mostrado.</p>
      )}
    </div>
  );
}

function Escala({ nivel, nome }: { nivel: number; nome: string }) {
  return (
    <span className="escala" role="img" aria-label={`${nome}: ${nivel} de 5`}>
      {[1, 2, 3, 4, 5].map(k => <span key={k} className={`escala__marca${k <= nivel ? ' escala__marca--cheia' : ''}`} />)}
    </span>
  );
}

function Estado({ l, vida, agir, irPara, abrirPessoa }: { l: LeituraDimensao; vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Destino) => void; abrirPessoa: (id: string) => void }) {
  const t = palavraTendencia(l.tendencia);
  const vazio = !l.ajudando.length && !l.pesando.length;
  return (
    <article className={`estado-bloco estado-bloco--${l.d} estado-bloco--n${l.nivel}`} aria-labelledby={`estado-${l.d}`}>
      <header className="estado-bloco__cabeca">
        <h2 id={`estado-${l.d}`} className="estado-bloco__nome">{l.nome}</h2>
        {t && <span className={`estado-bloco__tendencia estado-bloco__tendencia--${l.tendencia}`}>{l.tendencia === 'melhorando' ? '↗ ' : l.tendencia === 'piorando' ? '↘ ' : ''}{t}</span>}
      </header>
      <p className="estado-bloco__palavra">{l.palavra}</p>
      <Escala nivel={l.nivel} nome={l.nome} />
      {l.pesando.length > 0 && (
        <div className="estado-bloco__lista">
          <h3>Tem pesado</h3>
          <ul>{l.pesando.map(f => <li key={f.id}>{f.pessoaId && vida.pessoas[f.pessoaId] ? <button type="button" className="link" onClick={() => abrirPessoa(f.pessoaId!)}>{f.texto}</button> : f.texto}{f.pontual ? <span className="estado-bloco__quando"> · este ano</span> : null}</li>)}</ul>
        </div>
      )}
      {l.ajudando.length > 0 && (
        <div className="estado-bloco__lista estado-bloco__lista--bom">
          <h3>Tem ajudado</h3>
          <ul>{l.ajudando.map(f => <li key={f.id}>{f.pessoaId && vida.pessoas[f.pessoaId] ? <button type="button" className="link" onClick={() => abrirPessoa(f.pessoaId!)}>{f.texto}</button> : f.texto}</li>)}</ul>
        </div>
      )}
      {vazio && <Vazio>Nada pesando muito, nada puxando muito.</Vazio>}
      {l.cuidados.length > 0 && (
        <div className="estado-bloco__cuidar">
          {l.cuidados.map(s => s.acao
            ? <BotaoAcao key={s.id} vida={vida} acao={s.acao} agir={agir} variante="secundario" ocultarImpossivel>{s.texto}</BotaoAcao>
            : <button key={s.id} type="button" className="botao botao--discreto" onClick={() => (s.pessoaId ? abrirPessoa(s.pessoaId) : s.aba ? irPara(s.aba) : undefined)}>{s.texto} →</button>)}
          {l.cuidados[0]?.motivo && <p className="estado-bloco__motivo">{l.cuidados[0].motivo}</p>}
        </div>
      )}
    </article>
  );
}
