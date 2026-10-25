/**
 * REWORK 11.5 · SUB-17 — o Submundo com cara própria: um DOSSIÊ (papel escuro, fichas datilografadas, carimbos), não
 * a lista genérica de antes. Mostra o que o motor tem — as frentes (ramos) com prática, nome e o que é próprio de cada
 * uma (posto, mercado, estoque), as pessoas com ficha (papel, confiança, o combinado pendente), as organizações e o que
 * elas lembram, a exposição e o diário do caminho — e as ações de cada frente, com o risco dito ANTES de escolher.
 *
 * Nada aqui ensina coisa alguma: são escolhas e consequências, em palavras.
 */
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { BotaoAcao } from '../comum';
import { leituraDoSubmundo, previsaoDaAcao, ROTULO_DA_ACAO } from '../../motor/sistemas/submundo';
import { NOME_DO_RAMO } from '../../motor/sistemas/ramos';
import { dinheiroCurto } from '../leituraMaterial';
import { capitalDoModelo, leituraDosNegocios, MODELOS_CLANDESTINOS, NOME_DO_ESTAGIO, ROTULO_CLANDESTINO, type OqueClandestino } from '../../motor/sistemas/clandestinos';
import { contatosAtivos } from '../../motor/sistemas/submundo';
import { empresasAtivas } from '../../motor/sistemas/empresas';
import { anoDe } from '../../motor/tempo';

const palavraDoRisco = (x: number) => (x < 0.12 ? 'baixo' : x < 0.25 ? 'médio' : x < 0.4 ? 'alto' : 'muito alto');
const RELACAO: Record<string, string> = { membro: 'você é de dentro', aliada: 'aliada', rival: 'rival', neutra: 'sem lado' };
const MERCADO = ['despencou', 'fraco', 'normal', 'aquecido', 'disputado'];

function Barra({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <span className="sub-barra" role="meter" aria-label={rotulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valor)}>
      <span className="sub-barra__cheio" style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} />
    </span>
  );
}

export function PainelDoSubmundo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const s = leituraDoSubmundo(vida);
  if (!s) return null;
  const ativo = !!vida.caminhos.envolvimento && vida.caminhos.envolvimento.parou === undefined && !vida.justica?.prisao;
  const vivos = s.contatos.filter(c => c.estado === 'ativo');
  const outros = s.contatos.filter(c => c.estado !== 'ativo').slice(0, 4);
  return (
    <section className="dossie" aria-labelledby="titulo-dossie">
      <header className="dossie__cabeca">
        <h3 id="titulo-dossie" className="dossie__titulo">Dossiê do caminho</h3>
        <span className="dossie__carimbo">{ativo ? 'em atividade' : 'arquivado'}</span>
      </header>
      <p className="dossie__estagio">{NOME_DO_ESTAGIO[leituraDosNegocios(vida).estagio]}</p>
      <div className="dossie__exposicao">
        <span className="dossie__rotulo">Exposição</span>
        <Barra valor={s.exposicao} rotulo="Exposição às autoridades" />
        <span className="dossie__nota">{s.exposicao < 25 ? 'pouca gente sabe' : s.exposicao < 55 ? 'gente demais já sabe' : 'é questão de tempo'}</span>
      </div>

      <div className="dossie__ramos">
        {s.ramos.map(r => (
          <article key={r.ramo} className={`sub-ramo${r.ativa ? '' : ' sub-ramo--largado'}`} aria-label={r.nome}>
            <p className="sub-ramo__cabeca"><span className="sub-ramo__nome">{r.nome}</span>{r.principal && <span className="sub-ramo__selo">principal</span>}{!r.ativa && <span className="sub-ramo__selo">largado</span>}</p>
            <dl className="sub-ramo__dados">
              <div><dt>Prática</dt><dd><Barra valor={r.experiencia} rotulo={`Prática em ${r.nome}`} /></dd></div>
              <div><dt>Nome no meio</dt><dd><Barra valor={r.fama} rotulo={`Nome em ${r.nome}`} /></dd></div>
              <div><dt>Operações</dt><dd>{r.operacoes}{r.falhas ? ` (${r.falhas} deram errado)` : ''}</dd></div>
              <div><dt>Entrou</dt><dd>{r.ganhos > 0 ? dinheiroCurto(r.ganhos) : 'nada ainda'}</dd></div>
              {r.posto && <div><dt>Posto</dt><dd>{r.posto}</dd></div>}
              {r.mercado !== undefined && <div><dt>Mercado</dt><dd>{MERCADO[r.mercado + 2]}{r.estoque ? ` · guardado: ${dinheiroCurto(r.estoque)}` : ''}</dd></div>}
              <div><dt>Desde</dt><dd>{r.desde}</dd></div>
            </dl>
            {r.ativa && ativo && (
              <div className="grupo-acoes sub-ramo__acoes">
                {r.acoes.map(oque => {
                  const p = previsaoDaAcao(vida, r.ramo, oque);
                  return (
                    <div key={oque} className="sub-acao">
                      <BotaoAcao vida={vida} acao={{ tipo: 'submundo', oque, ramo: r.ramo }} agir={agir} variante="secundario" semAviso>{ROTULO_DA_ACAO[oque]}</BotaoAcao>
                      {p && (p.risco > 0 || p.ganho || p.custo) && (
                        <p className="sub-acao__previsao">
                          {p.risco > 0 && <>risco de dar errado: <strong>{palavraDoRisco(p.risco)}</strong></>}
                          {p.ganho && <> · pode render {dinheiroCurto(p.ganho[0])} a {dinheiroCurto(p.ganho[1])}</>}
                          {p.custo && <> · custa {dinheiroCurto(p.custo)}</>}
                        </p>
                      )}
                    </div>
                  );
                })}
                <BotaoAcao vida={vida} acao={{ tipo: 'submundo', oque: 'largar_ramo', ramo: r.ramo }} agir={agir} variante="discreto" ocultarImpossivel ocultarBloqueado>Largar esta frente</BotaoAcao>
              </div>
            )}
          </article>
        ))}
      </div>

      <NegociosPorFora vida={vida} agir={agir} ativo={ativo} />

      {ativo && s.podeEntrar.length > 0 && (
        <details className="dossie__outras">
          <summary>Outras frentes</summary>
          <div className="grupo-acoes">
            {s.podeEntrar.map(r => <BotaoAcao key={r} vida={vida} acao={{ tipo: 'submundo', oque: 'entrar_ramo', ramo: r }} agir={agir} variante="discreto" ocultarImpossivel>{`Atuar também em ${NOME_DO_RAMO[r].toLowerCase()}`}</BotaoAcao>)}
          </div>
        </details>
      )}

      <div className="dossie__bloco">
        <h4 className="dossie__rotulo">Gente do caminho</h4>
        {vivos.length === 0 && <p className="dossie__nota">Ninguém do caminho responde por você hoje.</p>}
        <ul className="sub-contatos">
          {[...vivos, ...outros].map(c => (
            <li key={c.id} className={`sub-contato sub-contato--${c.estado}`}>
              <p className="sub-contato__nome"><span>{c.nome}</span><span className="sub-contato__papel">{c.papel} · {c.ramo.toLowerCase()}{c.organizacao ? ` · ${c.organizacao}` : ''}</span></p>
              {c.estado === 'ativo'
                ? <span className="sub-contato__confianca"><span className="dossie__nota">confiança</span><Barra valor={c.confianca} rotulo={`Confiança de ${c.nome}`} /></span>
                : <span className="dossie__carimbo dossie__carimbo--menor">{c.estado === 'traiu' ? 'falou demais' : c.estado === 'morto' ? 'morreu' : 'afastou-se'}</span>}
              {c.pendente && ativo && <BotaoAcao vida={vida} acao={{ tipo: 'submundo', oque: 'cumprir_combinado', pessoaId: c.id }} agir={agir} variante="discreto">{`Cumprir o combinado com ${c.nome}`}</BotaoAcao>}
            </li>
          ))}
        </ul>
      </div>

      {s.organizacoes.length > 0 && (
        <div className="dossie__bloco">
          <h4 className="dossie__rotulo">Organizações</h4>
          <ul className="sub-orgs">
            {s.organizacoes.map(o => (
              <li key={o.nome} className="sub-org">
                <p className="sub-contato__nome"><span>{o.nome.charAt(0).toUpperCase() + o.nome.slice(1)}</span><span className="sub-contato__papel">{o.ramo.toLowerCase()} · {o.saiu ? 'você saiu' : RELACAO[o.relacao]}</span></p>
                <span className="sub-contato__confianca"><span className="dossie__nota">lealdade que leem em você</span><Barra valor={o.lealdade} rotulo={`Lealdade com ${o.nome}`} /></span>
                {o.lembra.length > 0 && <p className="dossie__nota">Lembram: {o.lembra.join('; ')}.</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.divida > 0 && (
        <div className="dossie__bloco">
          <p className="dossie__nota">Dívida com o caminho: <strong>{dinheiroCurto(s.divida)}</strong>.</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'submundo', oque: 'acertar_divida' }} agir={agir} variante="secundario" ocultarImpossivel>Acertar a dívida</BotaoAcao>
        </div>
      )}

      {s.diario.length > 0 && (
        <div className="dossie__bloco">
          <h4 className="dossie__rotulo">Anotações</h4>
          <ol className="sub-diario">
            {s.diario.map((d, k) => <li key={k} className={d.tom ? `sub-diario--${d.tom}` : undefined}><span className="margem__ano">{d.ano}</span> {d.texto}</li>)}
          </ol>
        </div>
      )}
    </section>
  );
}

/**
 * REWORK 12.2 — os negócios por fora: os que estão de pé (com sócios, caixa, exposição, fachada, as decisões) e os que
 * acabaram (com a história); abrir um novo; a organização própria (tenentes, coesão, alianças). Só números e gente.
 */
function NegociosPorFora({ vida, agir, ativo }: { vida: Vida; agir: (a: Acao) => boolean; ativo: boolean }) {
  const l = leituraDosNegocios(vida);
  const e = vida.caminhos.envolvimento;
  const org = l.organizacao;
  const empresas = empresasAtivas(vida).filter(x => x.papel !== 'investidor');
  const d = (oque: OqueClandestino, negocioId?: string, alvo?: string, rotulo?: string, variante: 'secundario' | 'discreto' = 'discreto') =>
    <BotaoAcao key={`${oque}-${negocioId}-${alvo}`} vida={vida} acao={{ tipo: 'clandestino', oque, negocioId, alvo }} agir={agir} variante={variante} ocultarBloqueado semAviso={variante === 'discreto'}>{rotulo ?? ROTULO_CLANDESTINO[oque]}</BotaoAcao>;
  if (!l.negocios.length && !ativo) return null;
  return (
    <div className="dossie__bloco dossie__negocios">
      <h4 className="dossie__rotulo">Negócios por fora</h4>
      {!l.negocios.length && <p className="dossie__nota">Nenhum negócio seu. Abrir um é mais dinheiro possível — e mais gente sabendo, um sócio que pode trair, um rival que cobra, a apreensão que leva o que estava empatado.</p>}
      <ul className="sub-negocios">
        {l.negocios.map(({ n, modelo, desde, socios, fachada }) => (
          <li key={n.id} className={`sub-negocio sub-negocio--${n.estado}`}>
            <p className="sub-contato__nome"><span>{n.nome.charAt(0).toUpperCase() + n.nome.slice(1)}</span><span className="sub-contato__papel">{modelo.nome.toLowerCase()} · desde {desde}{n.estado !== 'ativo' ? ` · ${n.estado === 'encerrado' ? 'encerrado' : n.estado === 'tomado' ? 'passado adiante' : 'desmantelado'} em ${anoDe(n.tFim ?? vida.t)}` : ''}</span></p>
            {n.estado === 'ativo' && (
              <>
                <dl className="sub-ramo__dados">
                  <div><dt>Empatado</dt><dd>{dinheiroCurto(n.capital)}</dd></div>
                  <div><dt>Caixa</dt><dd>{n.caixa < 0 ? '− ' : ''}{dinheiroCurto(Math.abs(n.caixa))}</dd></div>
                  {n.ultimo && <div><dt>O último ano</dt><dd>{dinheiroCurto(n.ultimo.receita)} entraram, {dinheiroCurto(n.ultimo.despesa)} saíram</dd></div>}
                  <div><dt>Nome no meio</dt><dd><Barra valor={n.reputacao} rotulo={`Nome de ${n.nome}`} /></dd></div>
                  <div><dt>Chama atenção</dt><dd><Barra valor={n.exposicao} rotulo={`Exposição de ${n.nome}`} /></dd></div>
                  <div><dt>Ritmo</dt><dd>{['com cautela', 'o de sempre', 'acelerado'][n.ritmo]}</dd></div>
                  {socios.length > 0 && <div><dt>Sócios</dt><dd>{socios.map(x => `${x.nome} (${Math.round(x.parte * 100)}%, confiança ${x.confianca >= 60 ? 'alta' : x.confianca >= 35 ? 'média' : 'baixa'})`).join('; ')}</dd></div>}
                  {fachada && <div><dt>Fachada</dt><dd>{fachada}</dd></div>}
                </dl>
                {n.ultimo?.nota && <p className="dossie__nota">{n.ultimo.nota}</p>}
                {ativo && (
                  <div className="grupo-acoes sub-ramo__acoes">
                    {d('retirar', n.id, undefined, `Tirar uns ${dinheiroCurto(Math.round(Math.max(0, n.caixa) * 0.9))} do caixa`, 'secundario')}
                    {d('aportar', n.id)}
                    {([0, 1, 2] as const).filter(x => x !== n.ritmo).map(x => d(`ritmo_${x}`, n.id))}
                    {contatosAtivos(vida).filter(c => !n.socios.some(sc => sc.pessoaId === c.id)).slice(0, 2).map(c => d('socio', n.id, c.id, `Chamar ${vida.pessoas[c.id].nome} para sócio`))}
                    {n.socios.map(sc => d('romper_socio', n.id, sc.pessoaId, `Romper com ${vida.pessoas[sc.pessoaId]?.nome ?? 'o sócio'}`))}
                    {!n.fachadaId && empresas.filter(x => !x.fachada).map(x => d('fachada', n.id, x.id, `Usar ${x.nome} como fachada`))}
                    {d('desligar_fachada', n.id)}
                    {d('passar_adiante', n.id)}
                    {d('encerrar', n.id)}
                  </div>
                )}
              </>
            )}
            {n.historia.length > 0 && <details className="dossie__outras"><summary>A história</summary><ol className="sub-diario">{n.historia.slice(-8).map((h, k) => <li key={k} className={h.tom ? `sub-diario--${h.tom}` : undefined}><span className="margem__ano">{anoDe(h.t)}</span> {h.texto}</li>)}</ol></details>}
          </li>
        ))}
      </ul>
      {ativo && (
        <details className="dossie__outras">
          <summary>Abrir um negócio por fora</summary>
          <div className="grupo-acoes">
            {MODELOS_CLANDESTINOS.map(m => <BotaoAcao key={m.tipo} vida={vida} acao={{ tipo: 'clandestino', oque: 'abrir', alvo: m.tipo }} agir={agir} variante="discreto" ocultarImpossivel>{`${m.nome} (${dinheiroCurto(capitalDoModelo(vida, m.tipo))}) — ${m.descricao}`}</BotaoAcao>)}
          </div>
        </details>
      )}
      {ativo && !org && l.negocios.some(x => x.n.estado === 'ativo') && d('fundar_organizacao', undefined, undefined, 'Fundar a própria organização', 'secundario')}
      {org && e && (
        <div className="dossie__bloco">
          <h4 className="dossie__rotulo">{org.nome.charAt(0).toUpperCase() + org.nome.slice(1)} · o seu comando</h4>
          <p className="dossie__nota">Coesão: {org.propria!.coesao >= 60 ? 'firme' : org.propria!.coesao >= 45 ? 'rachando' : 'à beira de uma disputa'}. Dividem o comando: {org.propria!.tenentes.map(id => vida.pessoas[id]?.nome).filter(Boolean).join(', ') || 'ninguém'}.</p>
          {ativo && (
            <div className="grupo-acoes">
              {contatosAtivos(vida).filter(c => !org.propria!.tenentes.includes(c.id)).slice(0, 2).map(c => d('tenente', undefined, c.id, `Dar comando a ${vida.pessoas[c.id].nome}`))}
              {(e.organizacoes ?? []).filter(o => !o.propria && o.relacao !== 'membro').map(o => o.relacao === 'aliada' ? d('romper_alianca', undefined, o.id, `Romper a aliança com ${o.nome}`) : d('alianca', undefined, o.id, `Propor aliança a ${o.nome}`))}
              {d('dissolver')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
