/**
 * VIDA 14 · Você → Objetivos: as metas que a pessoa escolheu (opcionais), o progresso medido do estado real, mudar a meta
 * ou deixar de lado, escolher uma nova, o que já foi alcançado — e o reconhecimento do meio (prêmios, congressos,
 * palestras). Tudo lido de `v14/conquistas` — a tela não faz conta.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { anoDe } from '../../../motor/tempo';
import { OBJETIVOS14, type TipoObjetivo14 } from '../../../motor/dados14/conquistas/catalogo';
import { modeloObjetivo14, nomeDoObjetivo14, objetivos14, progresso14, rotuloDoAlvo14 } from '../../../motor/v14/conquistas/objetivos';
import { reconhecimentos14 } from '../../../motor/v14/conquistas/reconhecimento';
import { idade } from '../../../motor/nucleo';
import './conquistas14.css';

const A = (oque: unknown) => ({ tipo: 'conquistas14', oque } as unknown as Acao);

export function Objetivos14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [novo, setNovo] = useState<TipoObjetivo14 | null>(null);
  const [mudar, setMudar] = useState<string | null>(null);
  const todos = objetivos14(vida);
  const ativos = todos.filter(o => o.estado === 'ativo');
  const feitos = todos.filter(o => o.estado !== 'ativo').slice().reverse();
  const livres = OBJETIVOS14.filter(m => idade(vida) >= m.idade && !ativos.some(o => o.tipo === m.id));
  const rec = reconhecimentos14(vida).slice().reverse();
  return (
    <section className="c14" aria-label="Objetivos pessoais">
      <p className="c14__intro">Opcional: escolha o que quer perseguir. O jogo mede pelo que acontece de verdade — e não empurra a vida para lado nenhum.</p>
      {ativos.length === 0 && <p className="nota">Nenhum objetivo escolhido. A vida segue do mesmo jeito.</p>}
      <ul className="c14__lista">
        {ativos.map(o => {
          const p = progresso14(vida, o);
          const m = modeloObjetivo14(o.tipo);
          return (
            <li key={o.id} className="c14__obj">
              <p className="c14__nome"><span>{nomeDoObjetivo14(vida, o.tipo)}</span><small>meta: {rotuloDoAlvo14(vida, o.tipo, o.alvo)} · desde {anoDe(o.t)}</small></p>
              <div className="c14__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.fracao * 100)} aria-label={`${nomeDoObjetivo14(vida, o.tipo)}: ${p.texto}`}><span style={{ width: `${Math.max(2, Math.min(100, p.fracao * 100))}%` }} /></div>
              <p className="c14__prog">{p.texto}{p.detalhe ? ` · ${p.detalhe}` : ''}</p>
              <p className="c14__mede">{m.mede}</p>
              <div className="grupo-acoes">
                {m.alvos.length > 1 && <button type="button" className="botao botao--discreto" aria-expanded={mudar === o.id} onClick={() => setMudar(x => (x === o.id ? null : o.id))}>Mudar a meta</button>}
                <BotaoAcao vida={vida} acao={A({ op: 'abandonar', id: o.id })} agir={agir} variante="discreto">Deixar de lado</BotaoAcao>
              </div>
              {mudar === o.id && (
                <div className="grupo-acoes">
                  {m.alvos.filter(x => x.valor !== o.alvo).map(x => <BotaoAcao key={x.valor} vida={vida} acao={A({ op: 'alterar', id: o.id, alvo: x.valor })} agir={agir} variante="secundario" aoAgir={() => setMudar(null)}>{rotuloDoAlvo14(vida, o.tipo, x.valor)}</BotaoAcao>)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {livres.length > 0 && (
        <div className="c14__novo">
          <p className="c14__sub">Escolher um objetivo</p>
          <div className="c14__tipos">
            {livres.map(m => <button key={m.id} type="button" className={`c14__tipo${novo === m.id ? ' c14__tipo--ativo' : ''}`} aria-pressed={novo === m.id} onClick={() => setNovo(x => (x === m.id ? null : m.id))}>{nomeDoObjetivo14(vida, m.id)}</button>)}
          </div>
          {novo && (() => {
            const m = modeloObjetivo14(novo);
            return (
              <div className="c14__escolha">
                <p className="nota">{m.descricao} {m.mede}</p>
                <div className="grupo-acoes">
                  {m.alvos.map(x => <BotaoAcao key={x.valor} vida={vida} acao={A({ op: 'criar', tipo: novo, alvo: x.valor })} agir={agir} variante="secundario" aoAgir={() => setNovo(null)}>{rotuloDoAlvo14(vida, novo, x.valor)}</BotaoAcao>)}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {feitos.length > 0 && (
        <div>
          <p className="c14__sub">Já na história</p>
          <ul className="historico-politico">
            {feitos.slice(0, 10).map(o => <li key={o.id}>{o.estado === 'concluido' ? `Alcançado: ${o.rotulo ?? nomeDoObjetivo14(vida, o.tipo).toLowerCase()}` : `Deixado de lado em ${anoDe(o.tFim ?? o.t)}: ${nomeDoObjetivo14(vida, o.tipo).toLowerCase()} (chegou a ${Math.round((o.melhor ?? 0) * 100)}%)`}</li>)}
          </ul>
        </div>
      )}
      {rec.length > 0 && (
        <div>
          <p className="c14__sub">Reconhecimento no meio</p>
          <ul className="historico-politico">
            {rec.slice(0, 12).map((x, k) => <li key={k}><strong>{anoDe(x.t)}</strong> · {x.texto}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

export default Objetivos14;
