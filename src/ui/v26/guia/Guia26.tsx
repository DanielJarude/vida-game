/**
 * VIDA 26 · CAMINHOS DE CARREIRA (o explorador de trajetórias) — e o painel DEPOIS DE COMPETIR.
 *
 * O explorador mostra como cada esporte, cada jogo de e-sports, as pistas e cada família de profissões começa, as formas
 * de começar (as bifurcações da entrada), as etapas (com a etapa desta vida marcada), o que faz evoluir, onde se
 * compete, o depois e as outras portas — e onde se dá o próximo passo de verdade (o botão leva à tela real). VIDA 26.1:
 * o estado de cada caminho para esta vida (em andamento, ao alcance, mais adiante, já percorrido, fora de alcance), com o
 * porquê; filtros por tipo e por estado; busca (a mesma da central). Mora em Caminhos · Caminhos de carreira e na
 * central "Onde fica cada coisa" (Menu). Tudo lido do motor (`v26/carreira/trajetorias26`): orienta, não concede.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { NOME_ESTADO26, trajetorias26, type EstadoDoTrajeto, type Trajeto26 } from '../../../motor/v26/carreira/trajetorias26';
import { chanceEmPalavras26, portasDoPosCarreira26 } from '../../../motor/v26/carreira/posCarreira26';
import type { Aba } from '../../navegacao';
import { buscarTrajetorias } from '../central/buscaDeTrajetorias';
import './guia26.css';

const GRUPOS: { id: Trajeto26['grupo']; nome: string }[] = [{ id: 'esporte', nome: 'Esportes' }, { id: 'esports', nome: 'E-sports' }, { id: 'pistas', nome: 'Automobilismo' }, { id: 'profissao', nome: 'Profissões' }];
const ORDEM_ESTADO: EstadoDoTrajeto[] = ['andamento', 'disponivel', 'futuro', 'encerrado', 'fora'];

function Trajeto({ t, aberto, irPara }: { t: Trajeto26; aberto?: boolean; irPara?: (a: Aba) => void }) {
  const aqui = t.etapas.findIndex(e => e.aqui);
  return (
    <details className={`g26-trajeto${t.meu ? ' g26-trajeto--meu' : ''}`} data-trajeto={t.id} data-estado={t.estado} open={aberto || undefined}>
      <summary className="g26-trajeto__cabeca">
        <span className="g26-trajeto__nome">{t.nome}</span>
        <span className={`g26-estado g26-estado--${t.estado}`}>{aqui >= 0 ? `você: ${t.etapas[aqui].nome.toLowerCase()}` : NOME_ESTADO26[t.estado]}</span>
        <span className="g26-trajeto__resumo">{t.area} · {t.etapas.map(e => e.nome).slice(0, 5).join(' → ')}{t.etapas.length > 5 ? ' → …' : ''}</span>
      </summary>
      <div className="g26-trajeto__corpo">
        <p className="g26-comeco">{t.comeco}</p>
        <p className="g26-porque"><b>Para você:</b> {t.porque}</p>
        {t.entradas.length > 1 && (
          <div className="g26-entradas" aria-label="Formas de começar">
            <span className="g26-entradas__rot">Formas de começar — nenhuma obrigatória</span>
            <ul>{t.entradas.map((x, k) => <li key={k}>{x}</li>)}</ul>
          </div>
        )}
        <ol className="g26-etapas" aria-label={`Etapas: ${t.nome}`}>
          {t.etapas.map((e, k) => (
            <li key={k} className={`g26-etapa${e.aqui ? ' g26-etapa--aqui' : e.feita ? ' g26-etapa--feita' : ''}`} aria-current={e.aqui ? 'step' : undefined}>
              <span className="g26-etapa__marca" aria-hidden>{e.feita && !e.aqui ? '✓' : k + 1}</span>
              <div className="g26-etapa__texto">
                <b>{e.nome}</b>{e.quando && <small> · {e.quando}</small>}{e.aqui && <span className="sr-only"> (você está aqui)</span>}
                <p>{e.como}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="g26-colunas">
          <section><h4>O que faz evoluir</h4><ul>{t.fatores.map((f, k) => <li key={k}>{f}</li>)}</ul></section>
          <section><h4>{t.grupo === 'profissao' ? 'Os degraus' : 'Onde se compete'}</h4><p>{t.destinos.join(' → ')}</p></section>
          <section><h4>{t.grupo === 'profissao' ? 'Para onde se costuma ir depois' : 'Depois de competir'}</h4><p>{t.depois.join(' · ')}</p></section>
          <section><h4>Outras portas</h4><ul>{t.alternativas.map((f, k) => <li key={k}>{f}</li>)}</ul></section>
        </div>
        {t.ir && irPara && <button type="button" className="botao botao--secundario g26-ir" onClick={() => irPara(t.ir!.destino as Aba)}>{t.ir.rotulo} →</button>}
      </div>
    </details>
  );
}

const LEGENDA = (
  <section className="g26-legenda" aria-label="Hobby, outros caminhos e profissão">
        <div><b>Hobby</b><span>Atividade por gosto, na semana (Minha Semana). Pode durar a vida toda sem virar carreira.</span></div>
        <div><b>Caminho</b><span>Uma trajetória que o hobby pode abrir: a base, a peneira, a equipe amadora, o kart, a banda.</span></div>
        <div><b>Profissão</b><span>Contrato, salário, rotina e progressão (Caminhos · Trabalho) — durante a carreira e depois dela.</span></div>
      </section>
);

export function PosCarreira26({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const lista = useMemo(() => portasDoPosCarreira26(vida), [vida]);
  if (!lista.length) return null;
  return (
    <section className="pc26" aria-labelledby="pc26-t" data-pos-carreira>
      <h3 id="pc26-t" className="pc26__titulo">Depois de competir</h3>
      <p className="nota">A competição acabou; a carreira no esporte, não necessariamente. O que se alcança depende da trajetória: anos, nível, títulos, nome, formação. Uma tentativa por porta a cada ano.</p>
      {lista.map(({ trajetoria: t, portas }) => (
        <div key={t.origem} className="pc26__grupo">
          <h4 className="pc26__origem">{t.nome.charAt(0).toUpperCase() + t.nome.slice(1)} <small>· {Math.round(t.anos)} {Math.round(t.anos) === 1 ? 'ano' : 'anos'}{t.profissional ? ', profissional' : ', sem chegar ao profissional'}{t.titulos ? `, ${t.titulos} ${t.titulos === 1 ? 'título' : 'títulos'}` : ''}</small></h4>
          <ul className="pc26__portas">
            {portas.map(p => {
              const ja = vida.trabalho.atual?.ocupacaoId === p.id;
              const fechada = p.chance <= 0;
              return (
                <li key={p.id} className={`pc26__porta${fechada ? ' pc26__porta--fechada' : ''}`} data-porta={p.id}>
                  <div className="pc26__porta-texto">
                    <b>{p.nome.charAt(0).toUpperCase() + p.nome.slice(1)}</b>
                    <small>{ja ? 'é o seu trabalho agora' : fechada ? p.motivo : p.tentou ? `${chanceEmPalavras26(p.chance)} · já procurou este ano` : chanceEmPalavras26(p.chance)}</small>
                  </div>
                  {!ja && !fechada && <button type="button" className="botao botao--discreto" disabled={p.tentou} onClick={() => agir({ tipo: 'pos26', ocupacaoId: p.id })}>Procurar</button>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

/**
 * O EXPLORADOR: filtros por tipo e por estado, busca, a lista (o que já está em andamento primeiro). `foco`: um caminho
 * a abrir (vindo da busca da central). `semPos`: sem o painel do depois (a central já é uma folha; ele mora em Caminhos).
 */
export function Explorador26({ vida, agir, irPara, foco, semPos }: { vida?: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; foco?: string; semPos?: boolean }) {
  const todos = useMemo(() => trajetorias26(vida), [vida]);
  const focado = todos.find(t => t.id === foco);
  const [grupo, setGrupo] = useState<Trajeto26['grupo']>(() => focado?.grupo ?? todos.find(t => t.meu && t.estado === 'andamento')?.grupo ?? 'esporte');
  const [estado, setEstado] = useState<EstadoDoTrajeto | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const base = busca.trim() ? buscarTrajetorias(todos, busca) : todos.filter(t => t.grupo === grupo).sort((a, b) => ORDEM_ESTADO.indexOf(a.estado) - ORDEM_ESTADO.indexOf(b.estado));
  const lista = estado === 'todos' ? base : base.filter(t => t.estado === estado);
  return (
    <div className="g26" data-guia>
      {semPos ? <details className="g26-legenda-recolhida"><summary>Hobby, caminho e profissão: a diferença</summary>{LEGENDA}</details> : LEGENDA}
      {!semPos && vida && <PosCarreira26 vida={vida} agir={agir} />}
      <div className="g26-controles">
        <label className="catalogo__busca g26-busca"><span className="sr-only">Procurar um caminho</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
          <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Procurar um caminho (futebol, Muay Thai, Counter-Strike, saúde…)" autoComplete="off" aria-label="Procurar um caminho" />
        </label>
        {!busca.trim() && (
          <div className="g26-filtros" role="group" aria-label="Tipo de caminho">
            {GRUPOS.map(g => <button key={g.id} type="button" className={`filtro${grupo === g.id ? ' filtro--ativo' : ''}`} aria-pressed={grupo === g.id} onClick={() => setGrupo(g.id)}>{g.nome} <small>({todos.filter(t => t.grupo === g.id).length})</small></button>)}
          </div>
        )}
        <div className="g26-filtros g26-filtros--estado" role="group" aria-label="Situação">
          {(['todos', ...ORDEM_ESTADO] as const).map(e => {
            const n = e === 'todos' ? base.length : base.filter(t => t.estado === e).length;
            if (e !== 'todos' && !n) return null;
            return <button key={e} type="button" className={`filtro${estado === e ? ' filtro--ativo' : ''}`} aria-pressed={estado === e} onClick={() => setEstado(e)}>{e === 'todos' ? 'Todos' : NOME_ESTADO26[e].charAt(0).toUpperCase() + NOME_ESTADO26[e].slice(1)} <small>({n})</small></button>;
          })}
        </div>
      </div>
      {!lista.length && <p className="nota">Nenhum caminho com isso. Tente outra palavra — ou outro tipo.</p>}
      <div className="g26-lista">{lista.map(t => <Trajeto key={t.id} t={t} aberto={t.id === foco || (!foco && !busca && t.meu && t.estado === 'andamento')} irPara={irPara} />)}</div>
      <p className="nota g26-rodape">Possibilidades, não garantias: cada etapa depende do que você faz, do desempenho e do contexto, e dá para parar, mudar de direção ou ficar no hobby. As idades e regras são as do jogo; o contrato de atleta segue a Lei Geral do Esporte (Lei 14.597/2023, art. 99). Nomes de divisões e circuitos reais; clubes, equipes e organizações dos e-sports são fictícios.</p>
    </div>
  );
}

export default function Guia26({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }) {
  return <Explorador26 vida={vida} agir={agir} irPara={irPara} />;
}
