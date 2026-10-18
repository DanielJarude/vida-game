/**
 * REWORK 9.5 · UX-04 / VIS-01 — O BOLETIM ESCOLAR.
 *
 * Um documento escolar original (não a cópia de um boletim oficial): quem é o aluno, a escola, a série, o ano letivo, e
 * cada matéria numa linha — o domínio (o número que o motor usa), a evolução no ano com a causa registrada, e o lugar
 * diante do esperado para a série (a mesma régua das palavras em todas as telas, `estagioDaFrente`). No rodapé, o que é
 * do ano inteiro: o desempenho (a "nota"), a frequência (as aulas que a agenda deixou acontecer), a dedicação e o que de
 * fato aconteceu dela, e a situação. O histórico, quando pedido, é a fotografia de cada ano fechado.
 *
 * Nada é decorativo: o motor não tem nota por matéria, então o boletim não inventa uma — mostra o domínio e diz a
 * diferença. Substitui as duas listas de matérias que Caminhos repetia ("Como você está se saindo" e "As matérias").
 */

import type { Vida } from '../../motor/tipos';
import { MATERIAS, PALAVRA_DA_RELACAO } from '../../motor/dados/frentes';
import { estagioDaFrente, leituraDaFrente, materiasExtremas } from '../../motor/sistemas/frentes';
import { evolucaoDaFrente, evolucaoDaNota } from '../../motor/sistemas/progressao';
import { NOME_MATERIA, rotuloSerie } from '../../motor/sistemas/escola';
import { instituicaoAtual } from '../../motor/sistemas/formacao';
import { presencaNaEscola } from '../../motor/sistemas/agenda';
import { anoDe } from '../../motor/tempo';
import { palavraDesempenho } from '../apresentar';
import { nomeDaFonte } from './Progresso';

const num = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',');
const sinal = (x: number) => (x > 0 ? `+${num(x)}` : x < 0 ? `−${num(-x)}` : '0');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const POSTURA: Record<Vida['educacao']['postura'], string> = { dedicada: 'com dedicação', normal: 'no ritmo', relaxada: 'empurrando' };

export function Boletim({ vida }: { vida: Vida }) {
  const b = vida.educacao.basica;
  if (!b || vida.educacao.evadiu || b.etapa === 'creche' || b.etapa === 'pre') return null;
  const inst = instituicaoAtual(vida);
  const materias = MATERIAS.filter(d => vida.caminhos.frentes[d]);
  const { forte, fraca } = materiasExtremas(vida);
  const nota = evolucaoDaNota(vida, 'escola');
  const dNota = nota.antes !== undefined && nota.agora !== undefined ? nota.agora - nota.antes : undefined;
  const freq = presencaNaEscola(vida);
  const ev = vida.evolucao ?? [];
  const rotina = [...ev].reverse().find(f => f.rotina?.postura)?.rotina;
  const anos = ev.filter(f => f.escola !== undefined).slice(-6);
  const idTitulo = 'titulo-boletim';
  return (
    <section className="boletim" aria-labelledby={idTitulo}>
      <header className="boletim__cabeca">
        <p className="boletim__escola">{inst?.nome ?? (b.rede === 'privada' ? 'Escola particular' : 'Escola pública')}</p>
        <h2 id={idTitulo} className="boletim__titulo">Boletim escolar</h2>
        <dl className="boletim__ficha">
          <div><dt>Aluno</dt><dd>{vida.eu.nome} {vida.eu.sobrenome}</dd></div>
          <div><dt>Série</dt><dd>{cap(rotuloSerie(b))}{b.eja ? ' (EJA)' : ''}</dd></div>
          <div><dt>Ano letivo</dt><dd>{anoDe(vida.t)}</dd></div>
          <div><dt>Rede</dt><dd>{b.rede === 'privada' ? 'particular' : 'pública'}</dd></div>
        </dl>
      </header>

      <table className="boletim__tabela">
        <caption className="sr-only">Matérias: domínio, evolução no ano e lugar diante da série</caption>
        <thead>
          <tr><th scope="col">Matéria</th><th scope="col">Domínio</th><th scope="col">No ano</th><th scope="col">Diante da série</th></tr>
        </thead>
        <tbody>
          {materias.map(d => {
            const e = evolucaoDaFrente(vida, d)!;
            const r = estagioDaFrente(vida, d, e.agora);
            const direcao = e.delta === undefined ? 'nova' : e.delta >= 0.5 ? 'subiu' : e.delta <= -0.5 ? 'caiu' : 'parou';
            const causa = e.causas.filter(([, x]) => Math.abs(x) >= 0.1);
            return (
              <tr key={d} className={`boletim__linha boletim__linha--${direcao}${d === forte ? ' boletim__linha--forte' : d === fraca ? ' boletim__linha--fraca' : ''}`} data-frente={d}>
                <th scope="row" className="boletim__materia">{cap(NOME_MATERIA[d])}</th>
                <td className="boletim__dominio" data-rotulo="Domínio"><span className="boletim__celula"><strong data-agora={e.agora}>{num(e.agora)}</strong>{r.esperado !== undefined && <span className="boletim__esperado"> esperado ~{num(r.esperado)}</span>}</span></td>
                <td className="boletim__ano" data-rotulo="No ano"><span className="boletim__celula">
                  {e.antes !== undefined ? <span className={`boletim__delta boletim__delta--${direcao}`}>{num(e.antes)} → {num(e.agora)} ({sinal(e.delta ?? 0)})</span> : <span className="boletim__delta boletim__delta--nova">primeiro ano registrado</span>}
                  {causa.length > 0 && (
                    <span className="boletim__causas">
                      {causa.map(([fonte, x]) => <span key={fonte} className={`boletim__causa${x < 0 ? ' boletim__causa--perda' : ''}`} data-fonte={fonte}>{nomeDaFonte(fonte)} {sinal(x)}</span>)}
                    </span>
                  )}
                </span></td>
                <td className="boletim__serie" data-rotulo="Diante da série"><span className="boletim__celula">{cap(r.palavra)}{r.relacao ? <span className="boletim__relacao"> · {PALAVRA_DA_RELACAO[r.relacao]}</span> : null}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <dl className="boletim__rodape">
        {nota.agora !== undefined && (
          <div data-nota="escola" data-agora={nota.agora}>
            <dt>Desempenho do ano</dt>
            <dd><strong>{nota.agora}</strong>/100 · {palavraDesempenho(nota.agora)}{dNota !== undefined && <span className={`boletim__delta boletim__delta--${dNota >= 3 ? 'subiu' : dNota <= -3 ? 'caiu' : 'parou'}`}> ({sinal(dNota)} no ano)</span>}</dd>
          </div>
        )}
        <div data-frequencia={Math.round(freq * 100)}>
          <dt>Frequência</dt>
          <dd>{freq >= 0.995 ? 'todas as aulas da semana' : `${Math.round(freq * 100)}% das aulas — o resto é atravessado por outro compromisso (a agenda mostra)`}</dd>
        </div>
        <div>
          <dt>Dedicação</dt>
          <dd>{cap(POSTURA[vida.educacao.postura])}{rotina?.postura === 'dedicada' && rotina.estudo !== undefined ? ` · no último ano, ${rotina.estudo >= 0.99 ? 'todas as horas de estudo em casa aconteceram' : rotina.estudo <= 0 ? 'o estudo em casa não achou horário' : `${Math.round(rotina.estudo * 100)}% das horas de estudo em casa aconteceram`}` : ''}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>Cursando{b.reprovacoes ? ` · ${b.reprovacoes === 1 ? 'uma reprovação' : `${b.reprovacoes} reprovações`} no caminho` : ''}</dd>
        </div>
      </dl>

      {(forte || fraca) && (
        <div className="boletim__observacoes">
          <p className="boletim__obs-titulo">Observações</p>
          {forte && <p>{cap(NOME_MATERIA[forte])}: {leituraDaFrente(vida, forte).replace(/\.$/, '')}.</p>}
          {fraca && <p>{cap(NOME_MATERIA[fraca])}: {leituraDaFrente(vida, fraca).replace(/\.$/, '')}.</p>}
        </div>
      )}

      <p className="boletim__legenda nota">O domínio é o que você sabe de cada matéria; o desempenho do ano tem outras causas também (a frequência, a dedicação, a casa, o ano que você teve).</p>

      {anos.length >= 2 && (
        <details className="boletim__historico">
          <summary>Histórico: os anos anteriores</summary>
          <table className="boletim__tabela boletim__tabela--historico">
            <caption className="sr-only">Domínio de cada matéria e desempenho, ano a ano</caption>
            <thead><tr><th scope="col">Ano</th>{materias.map(d => <th key={d} scope="col">{cap(NOME_MATERIA[d])}</th>)}<th scope="col">Desempenho</th></tr></thead>
            <tbody>
              {anos.map(f => (
                <tr key={f.t}>
                  <th scope="row">{anoDe(f.t - 6)}</th>
                  {materias.map(d => <td key={d} data-rotulo={cap(NOME_MATERIA[d])}>{f.frentes[d] !== undefined ? num(f.frentes[d]!) : '—'}</td>)}
                  <td data-rotulo="Desempenho">{f.escola}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
