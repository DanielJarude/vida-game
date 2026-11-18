/**
 * VIDA 26.1 · A CENTRAL "ONDE FICA CADA COISA" (no Menu). Duas funções complementares:
 *
 *   O QUE FAZER AGORA   as intenções do mapa (`navegacao.MAPA_DE_INTENCOES`), agrupadas pela finalidade (as áreas de
 *                       `GRUPOS_DE_INTENCAO`): a grade das áreas → a área → a ação → a tela real. A busca atravessa
 *                       tudo (sinônimos, variação de escrita, erro de digitação) e também encontra os caminhos de carreira;
 *   CAMINHOS DE CARREIRA o explorador de trajetórias (`Explorador26`, o mesmo de Caminhos · Caminhos de carreira).
 *
 * Nenhum destino novo: cada ação abre o lugar que já abria (o id e o `lugar` de cada intenção ficam iguais).
 */
import { lazy, Suspense, useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import { trajetorias26, NOME_ESTADO26 } from '../../../motor/v26/carreira/trajetorias26';
import { buscarIntencoes, GRUPOS_DE_INTENCAO, grupoDaIntencao, MAPA_DE_INTENCOES, resolverDestino, rotuloDoLugar, type GrupoDeIntencao, type Intencao, type Lugar } from '../../navegacao';
import { buscarTrajetorias } from './buscaDeTrajetorias';
import './central26.css';

const Explorador = lazy(() => import('../guia/Guia26').then(m => ({ default: m.Explorador26 })));

function Acao({ x, ir, comArea }: { x: Intencao; ir: (l: Lugar) => void; comArea?: boolean }) {
  return (
    <li>
      <button type="button" className="onde-fica__item c26-acao" data-intencao={x.id} onClick={() => ir(x.lugar)}>
        <span className="onde-fica__quero c26-acao__quero">{x.quero}</span>
        <span className="c26-acao__la">{x.la.charAt(0).toUpperCase() + x.la.slice(1)}</span>
        <span className="onde-fica__onde c26-acao__onde">{comArea ? `${GRUPOS_DE_INTENCAO.find(g => g.id === grupoDaIntencao(x))!.rotulo} · ` : ''}{rotuloDoLugar(x.lugar)} <span aria-hidden>→</span></span>
      </button>
    </li>
  );
}

export function Central26({ vida, ir }: { vida?: Vida; ir: (l: Lugar) => void }) {
  const [aba, setAba] = useState<'agora' | 'caminhos'>('agora');
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState<GrupoDeIntencao | null>(null);
  const [foco, setFoco] = useState<string | undefined>();
  const trajetos = useMemo(() => trajetorias26(vida), [vida]);
  const q = busca.trim();
  const acoes = q ? buscarIntencoes(q) : [];
  const caminhos = q ? buscarTrajetorias(trajetos, q).slice(0, 5) : [];
  const porGrupo = GRUPOS_DE_INTENCAO.map(g => ({ g, xs: acoes.filter(x => grupoDaIntencao(x) === g.id) })).filter(y => y.xs.length);
  const abrirCaminho = (id?: string) => { setFoco(id); setAba('caminhos'); setBusca(''); };
  return (
    <section className="onde-fica c26" aria-labelledby="onde-fica-titulo" data-central>
      <header className="c26__cabeca">
        <h2 id="onde-fica-titulo" className="subtitulo">Onde fica cada coisa</h2>
        <p className="nota">Encontre o que fazer agora — ou descubra os caminhos que dá para construir ao longo da vida.</p>
      </header>
      <div className="c26__abas" role="tablist" aria-label="Central">
        <button type="button" role="tab" aria-selected={aba === 'agora'} className={`c26__aba${aba === 'agora' ? ' c26__aba--ativa' : ''}`} onClick={() => setAba('agora')}>O que fazer agora</button>
        <button type="button" role="tab" aria-selected={aba === 'caminhos'} className={`c26__aba${aba === 'caminhos' ? ' c26__aba--ativa' : ''}`} onClick={() => abrirCaminho(undefined)}>Caminhos de carreira</button>
      </div>
      {aba === 'agora' && (
        <div role="tabpanel" className="c26__painel">
          <label className="catalogo__busca onde-fica__busca"><span className="sr-only">Procurar o que você quer fazer</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
            <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="O que você quer fazer? (namorar, faculdade, futebol, Counter-Strike…)" autoComplete="off" />
          </label>
          {q ? (
            <div className="c26__resultados" aria-live="polite">
              {!acoes.length && !caminhos.length && <p className="nota">Nada com essa palavra. Tente outra — ou percorra as áreas.</p>}
              {caminhos.length > 0 && (
                <section className="c26-grupo c26-grupo--caminhos" aria-label="Caminhos de carreira encontrados">
                  <h3 className="c26-grupo__nome">Caminhos de carreira</h3>
                  <ul className="c26-lista">{caminhos.map(t => (
                    <li key={t.id}><button type="button" className="c26-acao c26-acao--caminho" data-trajeto-busca={t.id} onClick={() => abrirCaminho(t.id)}>
                      <span className="c26-acao__quero">{t.nome}</span>
                      <span className="c26-acao__la">{t.etapas.map(e => e.nome).slice(0, 4).join(' → ')}</span>
                      <span className="c26-acao__onde">{t.area} · {NOME_ESTADO26[t.estado]} <span aria-hidden>→</span></span>
                    </button></li>
                  ))}</ul>
                </section>
              )}
              {porGrupo.map(({ g, xs }) => (
                <section key={g.id} className="c26-grupo" aria-label={g.rotulo}>
                  <h3 className="c26-grupo__nome">{g.rotulo}</h3>
                  <ul className="c26-lista onde-fica__lista">{xs.map(x => <Acao key={x.id} x={x} ir={ir} />)}</ul>
                </section>
              ))}
            </div>
          ) : grupo ? (
            <div className="c26__area">
              <button type="button" className="link c26__voltar" onClick={() => setGrupo(null)}>← Todas as áreas</button>
              <h3 className="c26-grupo__nome c26-grupo__nome--grande">{GRUPOS_DE_INTENCAO.find(g => g.id === grupo)!.rotulo}</h3>
              <ul className="c26-lista onde-fica__lista">{MAPA_DE_INTENCOES.filter(x => grupoDaIntencao(x) === grupo).map(x => <Acao key={x.id} x={x} ir={ir} />)}</ul>
              {grupo === 'esporte' && <button type="button" className="botao botao--secundario" onClick={() => abrirCaminho(undefined)}>Explorar os caminhos de carreira do esporte →</button>}
            </div>
          ) : (
            <>
              <button type="button" className="c26-destaque" onClick={() => abrirCaminho(undefined)} data-entrada-caminhos>
                <span className="c26-destaque__titulo">Caminhos de carreira</span>
                <span className="c26-destaque__texto">Do hobby ao profissional: {trajetos.filter(t => t.grupo !== 'profissao').length} caminhos no esporte, nos e-sports e nas pistas, e {trajetos.filter(t => t.grupo === 'profissao').length} famílias de profissões — como começa, as etapas, o depois e onde você está.</span>
              </button>
              <ul className="c26-areas" aria-label="Áreas da vida">
                {GRUPOS_DE_INTENCAO.map(g => {
                  const n = MAPA_DE_INTENCOES.filter(x => grupoDaIntencao(x) === g.id).length;
                  return n ? <li key={g.id}><button type="button" className="c26-area" data-grupo={g.id} onClick={() => setGrupo(g.id)}><span className="c26-area__nome">{g.rotulo}</span><span className="c26-area__oque">{g.oque}</span><span className="c26-area__n">{n} {n === 1 ? 'ação' : 'ações'}</span></button></li> : null;
                })}
              </ul>
            </>
          )}
        </div>
      )}
      {aba === 'caminhos' && (
        <div role="tabpanel" className="c26__painel">
          <Suspense fallback={<p className="nota">Carregando os caminhos…</p>}>
            <Explorador vida={vida} agir={() => false} irPara={a => ir(resolverDestino(a))} foco={foco} semPos />
          </Suspense>
        </div>
      )}
    </section>
  );
}
