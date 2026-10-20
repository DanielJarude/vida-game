/**
 * REWORK 9.5 · UX-04 / VIS-01 — O BOLETIM ESCOLAR.
 *
 * Um documento escolar original (não a cópia de um boletim oficial): quem é o aluno, a escola, a série, o ano letivo, e
 * cada matéria numa linha — o domínio (o número que o motor usa), a evolução no ano com a causa registrada, e o lugar
 * diante do esperado para a série (a mesma régua das palavras em todas as telas, `estagioDaFrente`). No rodapé, o que é
 * do ano inteiro: o desempenho (a "nota"), a frequência (as aulas que a agenda deixou acontecer), a dedicação e o que de
 * fato aconteceu dela, e a situação. O histórico, quando pedido, é a fotografia de cada ano fechado.
 *
 * Nada é decorativo. REWORK 9.7 · EDU-04: a nota e o conhecimento são colunas diferentes. A NOTA (à mão) é a do motor
 * para aquele ano e aquela matéria (`escola.notasDoAno`), na escala do país; o CONHECIMENTO (impresso) é o domínio, que
 * cresce com a vida e tem a sua própria régua (o esperado para a série). Antes, o domínio ia escrito à mão na coluna da
 * nota — e parecia uma nota que crescia sem fim. Substitui as duas listas de matérias que Caminhos repetia ("Como você está se saindo" e "As matérias").
 *
 * REWORK 9.6 · VIS-02: o boletim é uma FOLHA — papel com grão, cabeçalho impresso da escola, os campos do aluno sobre
 * a linha pontilhada, a tabela impressa e os números PREENCHIDOS À MÃO (caneta azul; vermelha quando a matéria está
 * abaixo do esperado para a série), o carimbo da secretaria com o ano e a rubrica da coordenação. O carimbo e a rubrica
 * são enfeite de papel, sem dado inventado: dizem só o ano e o que o documento é. A época muda o papel (antes de 2000,
 * amarelado; a escola pública e a particular, a cor do brasão).
 */

import type { Vida } from '../../motor/tipos';
import { MATERIAS, PALAVRA_DA_RELACAO } from '../../motor/dados/frentes';
import { estagioDaFrente, leituraDaFrente, materiasExtremas } from '../../motor/sistemas/frentes';
import { evolucaoDaFrente, evolucaoDaNota } from '../../motor/sistemas/progressao';
import { escalaDeNotas, NOME_MATERIA, notaDoDesempenho, notaNaEscala, rotuloSerie } from '../../motor/sistemas/escola';
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
  const ano = anoDe(vida.t);
  const escola = inst?.nome ?? (b.rede === 'privada' ? 'Escola particular' : 'Escola pública');
  const escala = escalaDeNotas(vida);
  const fmt = (n10: number) => { const x = notaNaEscala(vida, n10); return escala.casas ? num(x).replace(/^(\d+)$/, '$1,0') : String(x); };
  const abaixo = (n10: number) => notaNaEscala(vida, n10) < escala.aprovacao;
  return (
    <section className={`boletim papel${ano < 2000 ? ' papel--antigo' : ''}`} aria-labelledby={idTitulo} data-rede={b.rede} data-epoca={ano < 2000 ? 'antiga' : 'atual'}>
      <header className="boletim__cabeca">
        <span className="boletim__brasao" aria-hidden>{escola.replace(/^(Escola|Colégio|Colegio|Instituto|Centro)( (Estadual|Municipal|Federal|de))*\s*/i, '').charAt(0).toUpperCase() || 'E'}</span>
        <div className="boletim__timbre">
          <p className="boletim__escola">{escola}</p>
          <p className="boletim__rede">{b.rede === 'privada' ? 'Ensino particular' : 'Rede pública de ensino'} · {ano}</p>
        </div>
        <h2 id={idTitulo} className="boletim__titulo">Boletim escolar</h2>
        <dl className="boletim__ficha">
          <div className="campo-impresso"><dt>Aluno</dt><dd>{vida.eu.nome} {vida.eu.sobrenome}</dd></div>
          <div className="campo-impresso"><dt>Série</dt><dd>{cap(rotuloSerie(b))}{b.eja ? ' (EJA)' : ''}</dd></div>
          <div className="campo-impresso"><dt>Ano letivo</dt><dd>{ano}</dd></div>
          <div className="campo-impresso"><dt>Rede</dt><dd>{b.rede === 'privada' ? 'particular' : 'pública'}</dd></div>
        </dl>
      </header>

      <table className="boletim__tabela">
        <caption className="sr-only">Matérias: a nota do ano (de 0 a {escala.max}), o conhecimento, a evolução no ano e o lugar diante da série</caption>
        <thead>
          <tr><th scope="col">Matéria</th><th scope="col">Nota <small>(0–{escala.max})</small></th><th scope="col">Conhecimento</th><th scope="col">No ano</th><th scope="col">Diante da série</th></tr>
        </thead>
        <tbody>
          {materias.map(d => {
            const e = evolucaoDaFrente(vida, d)!;
            const r = estagioDaFrente(vida, d, e.agora);
            const direcao = e.delta === undefined ? 'nova' : e.delta >= 0.5 ? 'subiu' : e.delta <= -0.5 ? 'caiu' : 'parou';
            const causa = e.causas.filter(([, x]) => Math.abs(x) >= 0.1);
            const n = b.notas?.[d as keyof NonNullable<typeof b.notas>];
            return (
              <tr key={d} className={`boletim__linha boletim__linha--${direcao}${d === forte ? ' boletim__linha--forte' : d === fraca ? ' boletim__linha--fraca' : ''}`} data-frente={d}>
                <th scope="row" className="boletim__materia">{cap(NOME_MATERIA[d])}</th>
                <td className="boletim__nota-materia" data-rotulo="Nota">{n !== undefined ? <strong data-nota-materia={n} className={`manuscrito boletim__nota${abaixo(n) ? ' manuscrito--vermelho' : ''}`}>{fmt(n)}</strong> : <span className="boletim__esperado">no fim do ano</span>}</td>
                <td className="boletim__dominio" data-rotulo="Conhecimento"><span className="boletim__celula"><span data-agora={e.agora} className="boletim__conhecimento">{num(e.agora)}</span>{r.esperado !== undefined && <span className="boletim__esperado"> esperado na série ~{num(r.esperado)}</span>}</span></td>
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
            <dt>Média do ano</dt>
            <dd><strong className={`manuscrito boletim__nota${abaixo(notaDoDesempenho(nota.agora)) ? ' manuscrito--vermelho' : ''}`}>{fmt(notaDoDesempenho(nota.agora))}</strong> de {escala.max} · {palavraDesempenho(nota.agora)}{dNota !== undefined && <span className={`boletim__delta boletim__delta--${dNota >= 3 ? 'subiu' : dNota <= -3 ? 'caiu' : 'parou'}`}> ({dNota >= 3 ? 'subiu' : dNota <= -3 ? 'caiu' : 'quase igual'} no ano: era {fmt(notaDoDesempenho(nota.antes!))})</span>}</dd>
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

      <div className="boletim__fecho">
        <p className="boletim__legenda nota">A nota é o desempenho deste ano (aprovação a partir de {escala.aprovacao}) e pode subir ou cair no próximo. O conhecimento é o que você sabe de cada matéria: cresce com a vida e se compara ao que a série pede. A nota tem outras causas também (a frequência, a dedicação, a casa, o ano que você teve).</p>
        <div className="boletim__autenticacao" aria-hidden>
          <span className="carimbo"><span>Secretaria</span><span>{ano}</span></span>
          <span className="rubrica">
            <svg viewBox="0 0 140 36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 26c6-14 12-20 15-17s-7 18-2 17 9-16 14-15-3 14 2 13 6-9 10-10 1 8 5 8 8-12 12-11-2 9 3 9c6 0 11-6 18-7 9-1 16 2 26-3" /><path d="M40 31c22-3 46-3 70-6" opacity=".6" /></svg>
            <span className="rubrica__linha">Coordenação</span>
          </span>
        </div>
      </div>

      {anos.length >= 2 && (
        <details className="boletim__historico">
          <summary>Histórico: os anos anteriores</summary>
          <table className="boletim__tabela boletim__tabela--historico">
            <caption className="sr-only">A nota de cada matéria e a média, ano a ano</caption>
            <thead><tr><th scope="col">Ano</th>{materias.map(d => <th key={d} scope="col">{cap(NOME_MATERIA[d])}</th>)}<th scope="col">Média</th></tr></thead>
            <tbody>
              {anos.map(f => (
                <tr key={f.t}>
                  <th scope="row">{anoDe(f.t - 6)}</th>
                  {materias.map(d => { const x = f.notas?.[d as keyof NonNullable<typeof f.notas>]; return <td key={d} data-rotulo={cap(NOME_MATERIA[d])}>{x !== undefined ? fmt(x) : '—'}</td>; })}
                  <td data-rotulo="Média">{fmt(notaDoDesempenho(f.escola!))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
