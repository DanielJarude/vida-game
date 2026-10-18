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
import { MATERIAS, modeloFrente, PALAVRA_DA_RELACAO } from '../../motor/dados/frentes';
import { estagioDaFrente } from '../../motor/sistemas/frentes';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { NOME_MATERIA } from '../../motor/sistemas/escola';
import { evolucaoDaFrente, evolucaoDaNota, evolucaoDoTrabalho, type EvolucaoDaFrente } from '../../motor/sistemas/progressao';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { dinheiroCurto } from '../apresentar';
import { anoDe } from '../../motor/tempo';
import { Boletim } from './Boletim';

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

/**
 * REWORK 9.5 · UX-03 — A FICHA DE DESENVOLVIMENTO de uma habilidade: o nome, o nível em palavras (a régua certa), a frase
 * que a descreve, o que mudou no último ano (antes → agora, o número do motor), de onde veio (as fontes que o motor
 * registrou) e, quando pedido, o histórico ano a ano. Em pé, para ler de cima para baixo — não espalhada numa linha.
 */
export function FichaDeHabilidade({ vida, e, nome, frase, ativa = true }: { vida: Vida; e: EvolucaoDaFrente; nome?: string; frase?: string; ativa?: boolean }) {
  const m = modeloFrente(e.d);
  const titulo = cap(nome ?? (MATERIAS.includes(e.d) ? NOME_MATERIA[e.d] : m.nome));
  // REWORK 9.5 · EDU-02: a palavra vem da régua certa (a matéria, diante da série) — nunca de um estado antigo.
  const regua = estagioDaFrente(vida, e.d, e.agora);
  const f = vida.caminhos.frentes[e.d]!;
  const auge = estagioDaFrente(vida, e.d, f.auge);
  const direcao = e.delta === undefined ? 'nova' : e.delta >= 0.5 ? 'subiu' : e.delta <= -0.5 ? 'caiu' : 'parou';
  const causas = e.causas.filter(([, x]) => Math.abs(x) >= 0.1);
  const mudou = e.delta === undefined ? (e.antes === undefined ? `começou a contar: ${num(e.agora)}` : `${num(e.agora)}`)
    : direcao === 'subiu' ? `subiu ${num(e.delta)} — de ${num(e.antes!)} para ${num(e.agora)}`
      : direcao === 'caiu' ? `caiu ${num(-e.delta)} — de ${num(e.antes!)} para ${num(e.agora)}`
        : `ficou parado em ${num(e.agora)}`;
  return (
    <li className={`ficha-hab ficha-hab--${direcao}${ativa ? '' : ' ficha-hab--parada'}`} data-frente={e.d}>
      <div className="ficha-hab__cabeca">
        <h4 className="ficha-hab__nome">{titulo}</h4>
        <p className="ficha-hab__nivel">{cap(regua.palavra)}{regua.relacao ? <span className="ficha-hab__relacao"> · {PALAVRA_DA_RELACAO[regua.relacao]}</span> : null}</p>
      </div>
      {frase && <p className="ficha-hab__frase">{ativa ? frase : `Parou. ${frase}`.replace('Parou. Parou', 'Parou')}</p>}
      <p className="ficha-hab__linha"><span className="ficha-hab__rotulo">No último ano</span> <span className={`ficha-hab__mudou ficha-hab__mudou--${direcao}`} data-agora={e.agora}>{mudou}</span>{auge.estagio > regua.estagio && <span className="ficha-hab__auge"> · já esteve melhor ({auge.palavra})</span>}</p>
      {causas.length > 0 && (
        <p className="ficha-hab__linha ficha-hab__origem"><span className="ficha-hab__rotulo">De onde veio</span>{' '}
          {causas.map(([fonte, x]) => <span key={fonte} className={`ficha-hab__causa${x < 0 ? ' ficha-hab__causa--perda' : ''}`} data-fonte={fonte}>{nomeDaFonte(fonte)} {sinal(x)}</span>)}
        </p>
      )}
      {e.serie.length >= 2 && (
        <details className="ficha-hab__historico">
          <summary>Histórico <Trajetoria serie={e.serie} rotulo={titulo} /></summary>
          <ol className="ficha-hab__anos">{e.serie.map(x => <li key={x.t}><span>{anoDe(x.t - 6)}</span> <strong>{num(x.valor)}</strong></li>)}</ol>
        </details>
      )}
    </li>
  );
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/** As frentes de uma lista (as do ofício, as da semana), da que mais andou para a que menos — em fichas. */
export function Progressao({ vida, dominios, titulo, vazio }: { vida: Vida; dominios: Dominio[]; titulo: string; vazio?: string }) {
  const lista = dominios.map(d => evolucaoDaFrente(vida, d)).filter((x): x is EvolucaoDaFrente => !!x);
  if (!lista.length) return vazio ? <p className="nota">{vazio}</p> : null;
  const ordem = [...lista].sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
  return (
    <section className="evolucao-ano" aria-label={titulo}>
      <h3 className="evolucao-ano__titulo">{titulo}</h3>
      <ul className="fichas-hab">{ordem.map(e => <FichaDeHabilidade key={e.d} vida={vida} e={e} />)}</ul>
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
      {/* REWORK 9.5 · UX-04: a escola é o boletim (as matérias, a nota, a frequência, a dedicação) — uma lista só. */}
      {vida.educacao.basica && !vida.educacao.evadiu && <Boletim vida={vida} />}
      {vida.educacao.matricula && !vida.educacao.matricula.trancado && <NotaComHistoria vida={vida} qual="curso" />}
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
