/**
 * REWORK 10.5 · EDU-05 — o histórico acadêmico em papel.
 *
 * `HistoricoDoCurso`: o documento da faculdade (ou do técnico, da pós) — o curso, a instituição, o ingresso, o ano em
 * que se está, os créditos e, ano a ano, cada disciplina com a nota (na escala do país) e a situação. Substitui o
 * "desempenho no curso 60 → 72" (um número de 0 a 100 sem disciplina nenhuma) que a parte Boletim mostrava.
 *
 * `HistoricoEscolar`: tudo o que ficou fechado — os anos da escola e os de cada curso, com a média e a situação, e as
 * disciplinas a um toque. Mora em Estudos · Histórico e continua lá depois da formatura e do abandono (antes, o boletim
 * sumia junto com a escola).
 */

import type { Matricula, RegistroAcademico, Vida } from '../../motor/tipos';
import { curso } from '../../motor/dados/cursos';
import { escalaDeNotas, nomeDaMatricula, notaNaEscala } from '../../motor/sistemas/escola';
import { CREDITOS_POR_DISCIPLINA, creditosDoCurso, gradeDoCurso, historicoDe, registrosDoCurso } from '../../motor/sistemas/historicoAcademico';
import { anoDe } from '../../motor/tempo';

const num = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',');
const SITUACAO: Record<RegistroAcademico['situacao'], string> = {
  aprovado: 'aprovado', reprovado: 'com reprovação', concluido: 'concluído', trancado: 'matrícula trancada', abandonado: 'abandonou', cancelado: 'matrícula cancelada', cursando: 'cursando'
};
const SITUACAO_ESCOLA: Partial<Record<RegistroAcademico['situacao'], string>> = { aprovado: 'aprovado', reprovado: 'reprovado', concluido: 'concluiu', abandonado: 'deixou a escola' };

function escalaDe(vida: Vida) {
  const escala = escalaDeNotas(vida);
  const fmt = (n10: number) => { const x = notaNaEscala(vida, n10); return escala.casas ? num(x).replace(/^(\d+)$/, '$1,0') : String(x); };
  const abaixo = (n10: number) => notaNaEscala(vida, n10) < escala.aprovacao;
  return { escala, fmt, abaixo };
}

/** O documento do curso de agora: as disciplinas de cada ano, as notas, os créditos, a situação. */
export function HistoricoDoCurso({ vida, m = vida.educacao.matricula }: { vida: Vida; m?: Matricula }) {
  if (!m) return null;
  const c = curso(m.cursoId);
  const { escala, fmt, abaixo } = escalaDe(vida);
  const anos = registrosDoCurso(vida, m.cursoId, m.tInicio).filter(x => x.disciplinas.length);
  const cred = creditosDoCurso(vida, m.cursoId, m.tInicio);
  const totalDeAnos = Math.max(1, Math.ceil(c.meses / 12));
  const previstos = Math.max(cred.cursados, gradeDoCurso(m.area ?? c.area, c.nivel).length * CREDITOS_POR_DISCIPLINA);
  const ano = anoDe(vida.t);
  const media = anos.length ? anos.reduce((a, x) => a + (x.media ?? 0), 0) / anos.length : undefined;
  const id = 'titulo-historico-curso';
  return (
    <section className={`boletim historico-academico papel${ano < 2000 ? ' papel--antigo' : ''}`} aria-labelledby={id} data-historico="curso">
      <header className="boletim__cabeca">
        <span className="boletim__brasao" aria-hidden>{m.instituicao.replace(/^(Universidade|Faculdade|Instituto|Centro|Escola)( (Federal|Estadual|de|do|da))*\s*/i, '').charAt(0).toUpperCase() || 'U'}</span>
        <div className="boletim__timbre">
          <p className="boletim__escola">{m.instituicao}</p>
          <p className="boletim__rede">{m.rede === 'privada' ? 'Instituição particular' : 'Instituição pública'} · {m.modalidade === 'ead' ? 'a distância' : 'presencial'}</p>
        </div>
        <h2 id={id} className="boletim__titulo">Histórico acadêmico</h2>
        <dl className="boletim__ficha">
          <div className="campo-impresso"><dt>Aluno</dt><dd>{vida.eu.nome} {vida.eu.sobrenome}</dd></div>
          <div className="campo-impresso"><dt>Curso</dt><dd>{nomeDaMatricula(vida, m)}</dd></div>
          <div className="campo-impresso"><dt>Ingresso</dt><dd>{anoDe(m.tInicio)}</dd></div>
          <div className="campo-impresso"><dt>Andamento</dt><dd>{m.trancado ? 'trancado' : `${Math.min(totalDeAnos, anos.length + 1)}º de ${totalDeAnos} ${totalDeAnos === 1 ? 'ano' : 'anos'}`}</dd></div>
        </dl>
      </header>
      {anos.length === 0 ? (
        <p className="historico-academico__vazio">O primeiro ano letivo ainda não fechou: as disciplinas e as notas aparecem aqui no fim do ano.</p>
      ) : (
        <table className="boletim__tabela historico-academico__tabela">
          <caption className="sr-only">As disciplinas de cada ano, com a nota (de 0 a {escala.max}) e a situação</caption>
          <thead><tr><th scope="col">Ano</th><th scope="col">Disciplina</th><th scope="col">Nota <small>(0–{escala.max})</small></th><th scope="col">Situação</th></tr></thead>
          <tbody>
            {anos.flatMap(x => x.disciplinas.map((d, k) => (
              <tr key={`${x.t}-${d.nome}`} className="boletim__linha" data-disciplina={d.nome} data-situacao={d.situacao}>
                <td data-rotulo="Ano">{k === 0 ? anoDe(x.t - 6) : ''}</td>
                <th scope="row" className="boletim__materia">{d.nome}</th>
                <td data-rotulo="Nota"><strong className={`manuscrito boletim__nota${abaixo(d.nota) ? ' manuscrito--vermelho' : ''}`}>{fmt(d.nota)}</strong></td>
                <td data-rotulo="Situação">{d.situacao === 'reprovada' ? 'reprovada — volta a ser cursada' : 'aprovada'}</td>
              </tr>
            )))}
          </tbody>
        </table>
      )}
      <dl className="boletim__rodape">
        {media !== undefined && <div data-media-curso={media}><dt>Média geral</dt><dd><strong className={`manuscrito boletim__nota${abaixo(media) ? ' manuscrito--vermelho' : ''}`}>{fmt(media)}</strong> de {escala.max}</dd></div>}
        <div data-creditos={cred.aprovados}><dt>Créditos</dt><dd>{cred.aprovados} aprovados de ~{previstos} do curso{cred.cursados > cred.aprovados ? ` · ${cred.cursados - cred.aprovados} a refazer` : ''}</dd></div>
        <div><dt>Reprovações</dt><dd>{m.reprovacoes ? `${m.reprovacoes} ${m.reprovacoes === 1 ? 'disciplina' : 'disciplinas'} — cada uma alonga o curso` : 'nenhuma'}</dd></div>
        <div><dt>Situação</dt><dd>{m.trancado ? 'matrícula trancada' : m.mesesRestantes <= 12 ? 'cursando o último ano' : `cursando · faltam uns ${Math.ceil(m.mesesRestantes / 12)} anos`}</dd></div>
      </dl>
      <p className="boletim__legenda nota">A nota é o desempenho do ano em cada disciplina (aprovação a partir de {escala.aprovacao}). Não é a inteligência nem o que você sabe: a frequência, a dedicação, o trabalho e o ano que você teve pesam nela.</p>
    </section>
  );
}

/** Uma linha do histórico: o ano, o que era, a média, a situação — e as disciplinas a um toque. */
function Linha({ vida, x }: { vida: Vida; x: RegistroAcademico }) {
  const { fmt, abaixo } = escalaDe(vida);
  const sit = (x.nivel === 'escola' ? SITUACAO_ESCOLA[x.situacao] : undefined) ?? SITUACAO[x.situacao];
  const cabeca = (
    <>
      <span className="historico-academico__ano">{anoDe(x.t - 6)}</span>
      <span className="historico-academico__rotulo">{x.rotulo}<small> · {x.instituicao}</small></span>
      <span className={`historico-academico__situacao historico-academico__situacao--${x.situacao}`}>{x.media !== undefined ? <><strong className={abaixo(x.media) ? 'historico-academico__baixa' : undefined}>{fmt(x.media)}</strong> · </> : null}{sit}</span>
    </>
  );
  if (!x.disciplinas.length) return <li className="historico-academico__item" data-registro={x.situacao}><div className="historico-academico__linha">{cabeca}</div></li>;
  return (
    <li className="historico-academico__item" data-registro={x.situacao}>
      <details>
        <summary className="historico-academico__linha">{cabeca}</summary>
        <ul className="historico-academico__disciplinas">
          {x.disciplinas.map(d => <li key={d.nome}><span>{d.nome}</span> <strong className={abaixo(d.nota) ? 'historico-academico__baixa' : undefined}>{fmt(d.nota)}</strong></li>)}
        </ul>
      </details>
    </li>
  );
}

/** Estudos · Histórico: todos os anos letivos fechados, da escola à pós. */
export function HistoricoEscolar({ vida }: { vida: Vida }) {
  const escola = historicoDe(vida, 'escola');
  const cursos = historicoDe(vida, 'cursos');
  if (!escola.length && !cursos.length) return null;
  return (
    <section className="historico-academico historico-academico--lista" aria-labelledby="titulo-historico-escolar" data-historico="todos">
      <h2 id="titulo-historico-escolar" className="secao-fio">Histórico escolar e acadêmico</h2>
      <p className="nota">Cada ano letivo fechado: onde, o que era, a média e como terminou. Fica guardado depois da formatura — e de um abandono.</p>
      {cursos.length > 0 && (
        <>
          <h3 className="historico-academico__grupo">Cursos</h3>
          <ul className="historico-academico__anos">{[...cursos].reverse().map(x => <Linha key={`${x.t}-${x.rotulo}-${x.situacao}`} vida={vida} x={x} />)}</ul>
        </>
      )}
      {escola.length > 0 && (
        <>
          <h3 className="historico-academico__grupo">Escola</h3>
          <ul className="historico-academico__anos">{[...escola].reverse().map(x => <Linha key={`${x.t}-${x.rotulo}-${x.situacao}`} vida={vida} x={x} />)}</ul>
        </>
      )}
    </section>
  );
}
