/**
 * VIDA 26 · CAMINHOS · GUIA DE CARREIRAS — a consulta dos caminhos profissionais do esporte, dos e-sports e das pistas:
 * como começa, as etapas (com a posição desta vida marcada), o que faz evoluir, os destinos e o depois da competição.
 * Tudo lido do motor (`v26/carreira/trajetorias26`). E o painel DEPOIS DE COMPETIR, com as portas reais de quem já
 * encerrou uma carreira (`posCarreira26`): a chance em palavras, o motivo quando está fechada, e a ação de procurar.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { trajetorias26, type Trajeto26 } from '../../../motor/v26/carreira/trajetorias26';
import { chanceEmPalavras26, portasDoPosCarreira26 } from '../../../motor/v26/carreira/posCarreira26';
import './guia26.css';

const GRUPOS: { id: Trajeto26['grupo']; nome: string }[] = [{ id: 'esporte', nome: 'Esportes' }, { id: 'esports', nome: 'E-sports' }, { id: 'pistas', nome: 'Automobilismo' }];

function Trajeto({ t }: { t: Trajeto26 }) {
  const aqui = t.etapas.findIndex(e => e.aqui);
  return (
    <details className={`g26-trajeto${t.meu ? ' g26-trajeto--meu' : ''}`} data-trajeto={t.id} open={t.meu || undefined}>
      <summary className="g26-trajeto__cabeca">
        <span className="g26-trajeto__nome">{t.nome}</span>
        {t.meu && <span className="g26-selo">{aqui >= 0 ? `você: ${t.etapas[aqui].nome.toLowerCase()}` : 'faz parte da sua vida'}</span>}
        <span className="g26-trajeto__resumo">{t.etapas.length} etapas · depois: {t.depois.slice(0, 2).join(', ')}{t.depois.length > 2 ? '…' : ''}</span>
      </summary>
      <div className="g26-trajeto__corpo">
        <p className="g26-comeco">{t.comeco}</p>
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
          <section><h4>Onde se compete</h4><p>{t.destinos.join(' → ')}</p></section>
          <section><h4>Depois de competir</h4><p>{t.depois.join(' · ')}</p></section>
          <section><h4>Outras portas</h4><ul>{t.alternativas.map((f, k) => <li key={k}>{f}</li>)}</ul></section>
        </div>
      </div>
    </details>
  );
}

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

export default function Guia26({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const todos = useMemo(() => trajetorias26(vida), [vida]);
  const meus = todos.filter(t => t.meu);
  const [grupo, setGrupo] = useState<Trajeto26['grupo']>(() => meus[0]?.grupo ?? 'esporte');
  return (
    <div className="g26" data-guia>
      <section className="g26-legenda" aria-label="Hobby, outros caminhos e profissão">
        <div><b>Hobby</b><span>Atividade por gosto, na semana (Minha Semana). Pode durar a vida toda sem virar carreira.</span></div>
        <div><b>Outros caminhos</b><span>Uma trajetória que o hobby pode abrir: a base, a peneira, a equipe amadora, o kart, a banda.</span></div>
        <div><b>Profissão</b><span>Contrato, salário, rotina e progressão (Caminhos · Trabalho) — durante a carreira e depois dela.</span></div>
      </section>
      <PosCarreira26 vida={vida} agir={agir} />
      <div className="g26-filtros" role="group" aria-label="Tipo de caminho">
        {GRUPOS.map(g => <button key={g.id} type="button" className={`filtro${grupo === g.id ? ' filtro--ativo' : ''}`} aria-pressed={grupo === g.id} onClick={() => setGrupo(g.id)}>{g.nome} <small>({todos.filter(t => t.grupo === g.id).length})</small></button>)}
      </div>
      <div className="g26-lista">{todos.filter(t => t.grupo === grupo).map(t => <Trajeto key={t.id} t={t} />)}</div>
      <p className="nota g26-rodape">As etapas e as idades são as do jogo; a idade mínima do contrato segue a Lei Geral do Esporte (Lei 14.597/2023, art. 99). Nomes de divisões e circuitos reais; clubes, equipes e organizações dos e-sports são fictícios. Nenhuma etapa é obrigatória.</p>
    </div>
  );
}
