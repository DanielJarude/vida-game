/**
 * O legado: depois da morte, o destino do patrimônio e a pergunta que fica —
 * encerrar esta história ou continuar a família.
 *
 * Duas decisões que a tela mantém separadas (porque o motor mantém):
 *   A PARTILHA   quem herda o quê, dentro da regra do país (`sucessao.partilhar`);
 *   QUEM SEGUE   qual filho ou filha passa a ser a pessoa jogada — alguém que
 *                já vive no mundo, com a vida que tem. Escolher quem segue não
 *                muda a partilha.
 * Tudo aqui é leitura do motor; as escolhas viram `DecisoesDeHeranca`, que o
 * motor guarda na vida (recarregar mostra o mesmo).
 */

import { useState } from 'react';
import type { DecisoesDeHeranca, Vida } from '../../motor/tipos';
import type { ControleVida } from '../useVida';
import { partilhar, sucessores, lacoComFalecido, type Partilha } from '../../motor/sistemas/sucessao';
import { DESTINOS_DE_DOACAO, nomeDoDestino } from '../../motor/dados/sucessao';
import { dinheiro as fmt, flex } from '../../motor/texto';
import { Retrato } from '../avatar/Retrato';

const FRACOES = [0, 0.25, 0.5, 0.75, 1];
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** A partilha, explicada e (enquanto a história não acabou) decidível. */
export function PartilhaDoLegado({ vida, c }: { vida: Vida; c: ControleVida }) {
  const d: DecisoesDeHeranca = vida.morte?.decisoes ?? {};
  const p = partilhar(vida, d);
  const [aberta, setAberta] = useState(false);
  const nome = (id: string) => vida.pessoas[id]?.nome ?? 'alguém';
  const laco = (id: string) => lacoComFalecido(vida, id);
  const decidivel = !vida.morte?.encerrada;
  const mudar = (novo: DecisoesDeHeranca) => c.decidirHeranca(novo);
  const fracaoDe = (id: string) => d.disponivel?.find(x => x.pessoaId === id)?.fracao ?? 0;
  const setFracao = (id: string, f: number) => mudar({ ...d, disponivel: [...(d.disponivel ?? []).filter(x => x.pessoaId !== id), ...(f > 0 ? [{ pessoaId: id, fracao: f }] : [])] });
  const bensDecidiveis = p.inventario.filter(x => x.tipo === 'imovel' || x.tipo === 'veiculo' || x.tipo === 'negocio');
  const atribuido = (id: string) => p.quinhoes.find(q => q.bens.some(b => b.id === id))?.pessoaId ?? '';

  if (p.bruto <= 0 && p.dividas <= 0) return <p className="legado__nota">Não deixou bens a partilhar.</p>;
  return (
    <div className="legado__partilha">
      <dl className="legado__conta">
        <div><dt>O que havia</dt><dd>{fmt(p.bruto)}</dd></div>
        {p.dividasPagas > 0 && <div><dt>Dívidas pagas</dt><dd>− {fmt(p.dividasPagas)}</dd></div>}
        {p.meacao > 0 && <div><dt>Meação ({nome(p.quinhoes.find(q => q.meacao > 0)!.pessoaId)})</dt><dd>− {fmt(p.meacao)}</dd></div>}
        {p.custos > 0 && <div><dt>{capital(p.regra.rotuloCusto)}</dt><dd>− {fmt(p.custos)}</dd></div>}
        <div className="legado__conta-total"><dt>Herança</dt><dd>{fmt(p.heranca)}</dd></div>
      </dl>
      {p.naoCoberto > 0 && <p className="legado__nota">As dívidas passavam do que havia: {fmt(p.naoCoberto)} se extinguiram com o espólio. Ninguém herda dívida.</p>}
      {p.legitima > 0 && (
        <p className="legado__nota">
          Pela lei ({p.regra.nome}), metade da herança é dos herdeiros necessários e se divide entre eles. A outra metade — {fmt(p.disponivel)} — é a parte que um testamento pode decidir.
        </p>
      )}
      {p.herdeiros.length === 0 && p.heranca > 0 && <p className="legado__nota">Sem herdeiros: o que não for doado vai para {p.regra.vacancia}.</p>}

      <ul className="legado__quinhoes" aria-label="Quem recebe">
        {p.quinhoes.filter(q => q.valor > 0).map(q => (
          <li key={q.pessoaId}>
            <span className="legado__quem">{nome(q.pessoaId)}<span className="legado__laco"> · {laco(q.pessoaId)}</span></span>
            <span className="legado__valor">{fmt(q.valor)}</span>
            <span className="legado__como">
              {[q.meacao > 0 ? `meação de ${fmt(q.meacao)}` : '', ...q.bens.map(b => b.moradia ? 'a casa da família' : b.nome), q.dinheiro > 0 ? `${fmt(q.dinheiro)} em dinheiro` : ''].filter(Boolean).join(' · ')}
            </span>
          </li>
        ))}
        {p.doacao && <li><span className="legado__quem">Doação · {nomeDoDestino(p.doacao.destino)}</span><span className="legado__valor">{fmt(p.doacao.valor)}</span></li>}
        {p.vacante > 0 && <li><span className="legado__quem">{capital(p.regra.vacancia)}</span><span className="legado__valor">{fmt(p.vacante)}</span></li>}
      </ul>
      {p.vendidos.length > 0 && <p className="legado__nota">Vendido no inventário (ninguém ficou com {p.vendidos.length === 1 ? 'ele' : 'eles'}): {p.vendidos.map(b => b.nome).join(', ')}.</p>}
      {p.erros.map((e, k) => <p key={k} className="legado__erro" role="alert">{e}</p>)}

      {decidivel && (p.disponivel > 0 || bensDecidiveis.length > 0) && (
        <details className="legado__decidir" open={aberta} onToggle={e => setAberta((e.target as HTMLDetailsElement).open)}>
          <summary>Decidir o destino do patrimônio</summary>
          {p.disponivel > 0 && (
            <fieldset>
              <legend>A parte disponível ({fmt(p.disponivel)})</legend>
              <p className="legado__nota">O que não for decidido aqui segue a lei.</p>
              {p.herdeiros.map(h => (
                <div key={h.pessoaId} className="legado__linha">
                  <span>{nome(h.pessoaId)} <span className="legado__laco">· {laco(h.pessoaId)}</span></span>
                  <span className="legado__passos" role="group" aria-label={`Parte disponível para ${nome(h.pessoaId)}`}>
                    {FRACOES.map(f => <button key={f} type="button" className="legado__passo" aria-pressed={fracaoDe(h.pessoaId) === f} onClick={() => setFracao(h.pessoaId, f)}>{pct(f)}</button>)}
                  </span>
                </div>
              ))}
              <div className="legado__linha">
                <span>Doar para
                  <select className="legado__select" aria-label="Destino da doação" value={d.doacao?.destino ?? 'educacao'} onChange={e => mudar({ ...d, doacao: { fracao: d.doacao?.fracao ?? 0, destino: e.target.value } })}>
                    {DESTINOS_DE_DOACAO.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
                  </select>
                </span>
                <span className="legado__passos" role="group" aria-label="Parte doada">
                  {FRACOES.map(f => <button key={f} type="button" className="legado__passo" aria-pressed={(d.doacao?.fracao ?? 0) === f} onClick={() => mudar({ ...d, doacao: f > 0 ? { fracao: f, destino: d.doacao?.destino ?? 'educacao' } : undefined })}>{pct(f)}</button>)}
                </span>
              </div>
            </fieldset>
          )}
          {bensDecidiveis.length > 0 && (
            <fieldset>
              <legend>Quem fica com cada bem</legend>
              <p className="legado__nota">Um bem entra na parte de quem o recebe. O que ninguém recebe é vendido no inventário.</p>
              {bensDecidiveis.map(b => (
                <label key={b.id} className="legado__linha">
                  <span>{b.moradia ? 'A casa da família' : capital(b.nome)} <span className="legado__laco">· {fmt(b.valor)}</span></span>
                  <select className="legado__select" value={atribuido(b.id)} onChange={e => mudar({ ...d, bens: { ...Object.fromEntries(p.quinhoes.flatMap(q => q.bens.map(x => [x.id, q.pessoaId]))), ...(d.bens ?? {}), [b.id]: e.target.value } })}>
                    <option value="">vender no inventário</option>
                    {p.quinhoes.map(q => <option key={q.pessoaId} value={q.pessoaId}>{nome(q.pessoaId)}</option>)}
                  </select>
                </label>
              ))}
            </fieldset>
          )}
          <button type="button" className="botao botao--secundario" onClick={() => mudar({})}>Voltar à partilha pela lei</button>
        </details>
      )}
    </div>
  );
}

/** Continuar a família: quem pode seguir, com o contexto para escolher. Ninguém é escolhido pelo jogo. */
export function ContinuarFamilia({ vida, c }: { vida: Vida; c: ControleVida }) {
  const lista = sucessores(vida);
  const [escolha, setEscolha] = useState<string | null>(null);
  const p: Partilha = partilhar(vida, vida.morte?.decisoes);
  const g = vida.eu.tratamento ?? vida.eu.genero;
  if (!lista.length) {
    return <p className="legado__nota">{flex(g, 'Não deixou', 'Não deixou')} filhos. A história desta família termina aqui.</p>;
  }
  const s = lista.find(x => x.pessoa.id === escolha);
  return (
    <div className="legado__continuar">
      <ul className="legado__sucessores">
        {lista.map(x => (
          <li key={x.pessoa.id}>
            <button type="button" className="legado__sucessor" aria-pressed={escolha === x.pessoa.id} disabled={!x.pode} onClick={() => setEscolha(x.pessoa.id)}>
              <Retrato visual={x.pessoa.visual!} genero={x.pessoa.genero} idade={x.idade} semente={x.pessoa.id} tamanho={56} especie={x.pessoa.especie} rotulo={x.pessoa.nome} />
              <span className="legado__sucessor-texto">
                <span className="legado__sucessor-nome">{x.pessoa.nome}, {x.idade} · {x.laco}</span>
                <span>{x.ocupacao}</span>
                <span>{[x.onde, x.familia].filter(Boolean).join(' · ')}</span>
                <span>{x.dinheiro}{x.traco ? ` · ${x.traco}` : ''}</span>
                {x.guarda && <span>A guarda ficaria com {x.guarda}.</span>}
                {!x.pode && <span className="legado__erro">{x.motivo}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {s && (
        <div className="legado__confirmar">
          <p>
            A história segue com {s.pessoa.nome}, aos {s.idade} — com a vida que {flex(s.pessoa.genero, 'ele', 'ela', 'elu')} já tem.
            {(() => { const q = p.quinhoes.find(x => x.pessoaId === s.pessoa.id); return q && q.valor > 0 ? ` Pela partilha, ${flex(s.pessoa.genero, 'ele recebe', 'ela recebe', 'elu recebe')} ${fmt(q.valor)}.` : ' Pela partilha, não recebe parte da herança.'; })()}
          </p>
          <button type="button" className="botao botao--principal" disabled={p.erros.length > 0} onClick={() => c.continuarComo(s.pessoa.id)}>Continuar como {s.pessoa.nome}</button>
          {p.erros.length > 0 && <p className="legado__erro">Antes, a partilha precisa fechar: {p.erros[0]}</p>}
        </div>
      )}
    </div>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
