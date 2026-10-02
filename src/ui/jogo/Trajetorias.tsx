/**
 * "O que você construiu": as trajetórias da vida, uma por uma (generalização
 * de carreiras e legado).
 *
 * A pergunta da tela: olhar uma pessoa aos 60 e entender o que ela construiu
 * sem ler 200 acontecimentos. Por isso a profundidade vem aos poucos:
 *
 *   1. o título e o período (Futebol profissional · 2040–2057)
 *   2. a trajetória em uma frase (17 temporadas, 4 clubes, 512 jogos, 61 gols)
 *   3. o que marcou (Campeão da Série A com o São Paulo · 12 jogos pela seleção)
 *   4. o histórico — só para quem abre (a tabela por clube, as produções, os
 *      artigos, os mandatos, os postos, as safras)
 *
 * Uma carreira que acabou continua aqui: a pessoa é uma só.
 */

import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import { trajetoriasDaVida, type TrajetoriaDaVida } from '../../motor/sistemas/legado';
import { palmaresDe } from '../../motor/sistemas/palmares';
import { celulaDoHistorico, GlifoDaLinha, type Glifo } from '../iconesConquista';

/**
 * O glifo de uma linha do histórico esportivo que não é uma conquista
 * registrada (a linha da seleção, a campanha num torneio pelo país).
 */
function glifoDoGrupo(grupo: string, linha: string): Glifo | undefined {
  if (grupo === 'Títulos') return 'taca';
  if (grupo === 'Finais') return 'final';
  if (grupo === 'Pelo país' || grupo.startsWith('Prêmios e representação')) return /medalha/i.test(linha) ? 'medalha' : /campe/i.test(linha) ? 'taca' : /convoca/i.test(linha) ? 'bandeira' : grupo === 'Pelo país' ? 'bandeira' : 'premio';
  return undefined;
}

export function OQueConstruiu({ vida, titulo = 'O que você construiu', limite }: { vida: Vida; titulo?: string; limite?: number }) {
  const lista = trajetoriasDaVida(vida).filter(t => t.area !== 'formacao' || t.realizacoes.length > 0 || t.detalhe.length > 0);
  if (!lista.length) return null;
  const mostradas = limite ? lista.slice(0, limite) : lista;
  return (
    <section className="trajetorias-vida" aria-labelledby="titulo-construiu">
      <h2 id="titulo-construiu" className="voce-subtitulo">{titulo}</h2>
      <ol className="trajetorias-vida__lista">
        {mostradas.map(t => <Trajetoria key={t.id} t={t} palmares={t.area === 'esporte' ? palmaresDe(vida) : undefined} />)}
      </ol>
    </section>
  );
}

function Trajetoria({ t, palmares }: { t: TrajetoriaDaVida; palmares?: ReturnType<typeof palmaresDe> }) {
  const [aberta, setAberta] = useState(false);
  const temDetalhe = t.detalhe.some(d => d.linhas.length || d.tabela?.linhas.length);
  const id = `trajetoria-${t.id.replace(/[^a-z0-9]/gi, '-')}`;
  return (
    <li className={`trajetoria-vida trajetoria-vida--${t.area}${t.ativa ? ' trajetoria-vida--ativa' : ''}`}>
      <p className="trajetoria-vida__cabeca"><span className="trajetoria-vida__titulo">{t.titulo}</span> <span className="trajetoria-vida__periodo">{t.periodo}</span></p>
      <p className="trajetoria-vida__resumo">{t.resumo}</p>
      {t.realizacoes.length > 0 && (
        <ul className={`trajetoria-vida__marcos${palmares ? ' trajetoria-vida__marcos--glifos' : ''}`} aria-label={`O que marcou: ${t.titulo}`}>
          {t.realizacoes.slice(0, 3).map((r, k) => <li key={k}>{palmares && <GlifoDaLinha palmares={palmares} linha={r} padrao="marco" />}{r}</li>)}
        </ul>
      )}
      {temDetalhe && (
        <button type="button" className="link trajetoria-vida__abrir" aria-expanded={aberta} aria-controls={id} onClick={() => setAberta(x => !x)}>
          {aberta ? 'Fechar o histórico' : 'Ver o histórico'}
        </button>
      )}
      {aberta && (
        <div id={id} className="trajetoria-vida__detalhe">
          {t.realizacoes.length > 3 && (
            <div className="palmares__grupo"><h4>Mais do que marcou</h4><ul className="marcos-caminho marcos-caminho--glifos">{t.realizacoes.slice(3).map((r, k) => <li key={k}>{palmares && <GlifoDaLinha palmares={palmares} linha={r} padrao="marco" />}<span>{r}</span></li>)}</ul></div>
          )}
          {t.detalhe.map((d, k) => (
            <div key={k} className="palmares__grupo">
              <h4>{d.titulo}</h4>
              {d.tabela && d.tabela.linhas.length > 0 && (
                <div className="palmares__historico-rolagem">
                  <table className="palmares__historico">
                    <thead><tr>{d.tabela.colunas.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
                    <tbody>{[...d.tabela.linhas].reverse().map((l, j) => <tr key={j}>{l.map((c, i) => <td key={i}>{celulaDoHistorico(c)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              {d.linhas.length > 0 && <ul className={`marcos-caminho${palmares ? ' marcos-caminho--glifos' : ''}`}>{d.linhas.map((x, j) => { const g = palmares && glifoDoGrupo(d.titulo, x); return <li key={j}>{palmares && <GlifoDaLinha palmares={palmares} linha={x} padrao={g} />}<span>{x}</span></li>; })}</ul>}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}
