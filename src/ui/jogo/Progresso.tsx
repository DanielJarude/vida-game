/**
 * REWORK 9 · PROG-01 — A PROGRESSÃO, VISÍVEL E COM CAUSA.
 *
 * Para cada coisa que se mede de verdade no motor (a habilidade de uma frente, a nota da escola ou do curso, o
 * desempenho e o salário do trabalho): o valor de agora, o do fim do ano anterior, a diferença — e de onde ela veio,
 * pelas fontes que o motor registrou no instante em que a frente andou (`progressao`). Nada aqui é estimado para a
 * tela: o número mostrado é o campo que o motor usa; a causa é a que ele somou. Estagnar e cair também aparecem.
 *
 * A forma não é uma barra de 0 a 100: os degraus da habilidade (a palavra do estágio), o "antes → agora", a fileira
 * das causas e, quando há anos fotografados, a trajetória curta.
 */

import type { Dominio, Vida } from '../../motor/tipos';
import { estagioDe, MATERIAS, modeloFrente } from '../../motor/dados/frentes';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { NOME_MATERIA } from '../../motor/sistemas/escola';
import { evolucaoDaFrente, evolucaoDaNota, evolucaoDoTrabalho, type EvolucaoDaFrente } from '../../motor/sistemas/progressao';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { Degraus } from '../comum';
import { dinheiroCurto } from '../apresentar';

/** De onde veio, em palavras (a fonte que o motor registrou). */
export function nomeDaFonte(f: string): string {
  if (f.startsWith('rotina:')) { const m = modeloRotina(f.slice(7)); return m ? m.nome.toLowerCase() : 'uma atividade da semana'; }
  if (f.startsWith('acao:')) {
    const a = f.slice(5);
    return a === 'oficio' ? 'o que você fez no trabalho' : a === 'formacao' ? 'o que você fez na escola' : a === 'rotina' ? 'uma escolha da semana' : a === 'pessoa' ? 'o tempo com alguém' : a === 'usar_coisa' ? 'usar o que é seu' : a === 'experiencia' ? 'uma viagem ou experiência' : 'uma escolha sua';
  }
  return ({ escola: 'as aulas', curso: 'o curso', trabalho: 'o trabalho', treino: 'o treino', paralela: 'o trabalho por fora', obra: 'a própria obra', vida: 'o dia a dia', acontecimento: 'um acontecimento', sem_pratica: 'sem prática', idade: 'a idade', outro: 'outras experiências' } as Record<string, string>)[f] ?? f;
}

const num = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',');
const sinal = (x: number) => (x > 0 ? `+${num(x)}` : x < 0 ? `−${num(-x)}` : '0');

/** A trajetória curta (os anos fotografados): uma linha só, sem eixo — a forma do caminho. */
function Trajetoria({ serie, rotulo }: { serie: { valor: number }[]; rotulo: string }) {
  if (serie.length < 2) return null;
  const vs = serie.map(x => x.valor);
  const min = Math.min(...vs), max = Math.max(...vs);
  const amp = Math.max(4, max - min);
  const pts = vs.map((y, k) => `${(k / (vs.length - 1)) * 60},${16 - ((y - min) / amp) * 14 - 1}`).join(' ');
  return <svg className="evolucao-ano__trajetoria" viewBox="0 0 60 16" width={60} height={16} role="img" aria-label={`${rotulo}: ${vs.map(num).join(' → ')}`}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Uma frente: o estágio, o antes → agora, o porquê. */
export function LinhaDeProgresso({ vida, e, nome }: { vida: Vida; e: EvolucaoDaFrente; nome?: string }) {
  const m = modeloFrente(e.d);
  const titulo = nome ?? (MATERIAS.includes(e.d) ? NOME_MATERIA[e.d] : m.nome);
  const est = estagioDe(e.agora);
  const f = vida.caminhos.frentes[e.d]!;
  const direcao = e.delta === undefined ? 'nova' : e.delta >= 0.5 ? 'subiu' : e.delta <= -0.5 ? 'caiu' : 'parou';
  return (
    <li className={`evolucao-ano__linha evolucao-ano__linha--${direcao}`} data-frente={e.d}>
      <span className="evolucao-ano__nome">{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</span>
      <Degraus estagio={est} auge={estagioDe(f.auge)} rotulo={titulo} palavra={m.estagios[est]} compacto />
      <span className="evolucao-ano__valores" data-agora={e.agora}>
        {e.antes !== undefined ? <>{num(e.antes)} <span aria-hidden>→</span><span className="sr-only">para</span> </> : null}<strong>{num(e.agora)}</strong>
        {e.delta !== undefined && <span className={`evolucao-ano__delta evolucao-ano__delta--${direcao}`}> ({sinal(e.delta)} no ano)</span>}
      </span>
      <span className="evolucao-ano__palavra">{m.estagios[est]}</span>
      {e.causas.length > 0 && (
        <span className="evolucao-ano__causas">
          {e.causas.map(([fonte, x]) => <span key={fonte} className={`evolucao-ano__causa${x < 0 ? ' evolucao-ano__causa--perda' : ''}`} data-fonte={fonte}>{nomeDaFonte(fonte)} {sinal(x)}</span>)}
        </span>
      )}
      <Trajetoria serie={e.serie} rotulo={titulo} />
    </li>
  );
}

/** As frentes de uma lista (as matérias, as do ofício, as da semana), da que mais andou para a que menos. */
export function Progressao({ vida, dominios, titulo, vazio }: { vida: Vida; dominios: Dominio[]; titulo: string; vazio?: string }) {
  const lista = dominios.map(d => evolucaoDaFrente(vida, d)).filter((x): x is EvolucaoDaFrente => !!x);
  if (!lista.length) return vazio ? <p className="nota">{vazio}</p> : null;
  const ordem = [...lista].sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
  return (
    <section className="evolucao-ano" aria-label={titulo}>
      <h3 className="evolucao-ano__titulo">{titulo}</h3>
      <ul className="evolucao-ano__lista">{ordem.map(e => <LinhaDeProgresso key={e.d} vida={vida} e={e} />)}</ul>
    </section>
  );
}

/** A nota (o desempenho da escola ou do curso): antes → agora, e a trajetória. */
function NotaComHistoria({ vida, qual }: { vida: Vida; qual: 'escola' | 'curso' }) {
  const n = evolucaoDaNota(vida, qual);
  if (n.agora === undefined) return null;
  const d = n.antes !== undefined ? n.agora - n.antes : undefined;
  return (
    <p className="evolucao-ano__nota" data-nota={qual} data-agora={n.agora}>
      <span className="evolucao-ano__nome">{qual === 'escola' ? 'A nota do ano' : 'O desempenho no curso'}</span>{' '}
      {n.antes !== undefined && <>{n.antes} → </>}<strong>{n.agora}</strong>
      {d !== undefined && <span className={`evolucao-ano__delta evolucao-ano__delta--${d >= 3 ? 'subiu' : d <= -3 ? 'caiu' : 'parou'}`}> ({sinal(d)})</span>}
      <Trajetoria serie={n.serie} rotulo={qual === 'escola' ? 'A nota, ano a ano' : 'O desempenho, ano a ano'} />
    </p>
  );
}

/**
 * Caminhos · Desenvolvimento: o que se mede no estudo e no trabalho, ano a ano — a nota, as matérias, o desempenho e
 * o salário no ofício, as frentes que o ofício e o esporte usam.
 */
export function DesenvolvimentoReal({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  const t = evolucaoDoTrabalho(vida);
  const doOficio: Dominio[] = [];
  if (oc?.habilidade) doOficio.push(oc.habilidade.dominio);
  if (oc?.modalidade) doOficio.push(oc.modalidade as Dominio);
  const esporte = vida.caminhos.esporte;
  if (esporte && !doOficio.includes(esporte.modalidade)) doOficio.push(esporte.modalidade);
  const estuda = (vida.educacao.basica && !vida.educacao.evadiu) || vida.educacao.matricula;
  if (!estuda && !e && !doOficio.length) return null;
  return (
    <section className="desenvolvimento-real" aria-label="Ano a ano">
      <h2 className="secao-fio">Ano a ano: o que mudou e por quê</h2>
      {vida.educacao.basica && !vida.educacao.evadiu && <NotaComHistoria vida={vida} qual="escola" />}
      {vida.educacao.matricula && !vida.educacao.matricula.trancado && <NotaComHistoria vida={vida} qual="curso" />}
      {vida.educacao.basica && !vida.educacao.evadiu && <Progressao vida={vida} dominios={[...MATERIAS]} titulo="As matérias" />}
      {e && t.desempenho && (
        <p className="evolucao-ano__nota" data-nota="trabalho" data-agora={t.desempenho[1]}>
          <span className="evolucao-ano__nome">O desempenho no trabalho</span>{' '}
          {t.desempenho[0] !== undefined && <>{t.desempenho[0]} → </>}<strong>{t.desempenho[1]}</strong>
          {t.salario && t.salario[0] !== undefined && t.salario[0] !== t.salario[1] ? <span className="evolucao-ano__delta"> · salário {dinheiroCurto(t.salario[0])} → {dinheiroCurto(t.salario[1])}</span> : t.salario ? <span className="evolucao-ano__delta"> · salário {dinheiroCurto(t.salario[1])}</span> : null}
        </p>
      )}
      {doOficio.length > 0 && <Progressao vida={vida} dominios={doOficio} titulo={esporte ? 'O que o esporte pede' : 'O que o ofício pede'} />}
    </section>
  );
}
