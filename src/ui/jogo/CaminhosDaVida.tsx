/**
 * CAMINHOS (REWORK 9) — estudos, trabalho e trajetória numa página só.
 *
 * Formação e Trabalho deixam de ser duas áreas: são dois lados da mesma
 * trajetória. A página responde a quatro perguntas, uma por aba:
 *
 *   Agora            o que ocupa a vida agora (a escola, o curso, o emprego,
 *                    a carreira, o negócio, a procura, a pena — juntos quando
 *                    acontecem juntos) e o que dá para fazer neles
 *   Desenvolvimento  como você vem se saindo (as matérias, o que está
 *                    construindo, os retornos do que tentou)
 *   Oportunidades    o que está ao alcance (portas, cursos, preparação, vagas,
 *                    concursos, negócio, outros caminhos)
 *   Histórico        por onde passou (diplomas, escolas, empregos, temporadas,
 *                    o banco, os momentos da carreira)
 *
 * Os motores não foram fundidos: cada lado é o mesmo componente de antes
 * (`Estudos`, `Trabalho`), mostrando só a parte que pertence à aba. A ORDEM
 * dos lados segue a fase da vida: quem estuda e não trabalha vê a formação
 * primeiro; quem trabalha, o trabalho. Estudar não bloqueia trabalhar, nem o
 * contrário: os dois lados estão sempre aqui.
 *
 * As quatro abas ficam no documento (a inativa, escondida pelo CSS): nenhuma
 * ação depende de qual aba está aberta para existir — e a navegação por
 * intenção (`navegacao`) aponta para a aba certa.
 */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { doClube } from '../../motor/dados/clubes';
import { nomeOcupacao } from '../../motor/sistemas/trabalho';
import { modoDoTrabalho } from '../../motor/sistemas/profissao';
import { negocioAberto } from '../../motor/sistemas/negocio';
import { nomeDaMatricula, rotuloSerie } from '../../motor/sistemas/escola';
import { instituicaoAtual } from '../../motor/sistemas/formacao';
import { navegarAbas } from '../comum';
import { SECOES_CAMINHOS, type Aba, type ParteCaminhos } from '../navegacao';
import { Estudos } from './Estudos';
import { Trabalho, TrabalhoAindaNao } from './Trabalho';

/** Uma coisa que ocupa a vida agora (a situação atual, em uma linha). */
export interface Ocupacao { id: string; lado: 'formacao' | 'trabalho'; rotulo: string; detalhe?: string }

/** O que ocupa a vida agora — tudo o que acontece ao mesmo tempo, dos dois lados. Lido do estado, nada inventado. */
export function situacaoAtual(v: Vida): Ocupacao[] {
  const out: Ocupacao[] = [];
  const i = idade(v);
  const b = v.educacao.basica;
  const m = v.educacao.matricula;
  const inst = instituicaoAtual(v);
  if (b && !v.educacao.evadiu) out.push({ id: 'escola', lado: 'formacao', rotulo: rotuloSerie(b), detalhe: inst?.nome });
  if (m) out.push({ id: 'curso', lado: 'formacao', rotulo: nomeDaMatricula(v, m), detalhe: `${m.instituicao}${m.trancado ? ' · trancado' : ''}` });
  if (v.rotinas.some(r => r.id === 'estudar_concurso')) out.push({ id: 'concurso', lado: 'formacao', rotulo: 'Estudando para concurso' });
  const modo = modoDoTrabalho(v);
  const e = v.trabalho.atual;
  if (e) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    out.push({ id: 'trabalho', lado: 'trabalho', rotulo: oc ? nomeOcupacao(v, oc) : 'Trabalhando', detalhe: [e.empregador, `desde ${anoDe(e.tInicio)}`].filter(Boolean).join(' · ') });
  }
  const p = v.trabalho.paralela;
  if (p) { const oc = ocupacaoOuNula(p.ocupacaoId); out.push({ id: 'paralela', lado: 'trabalho', rotulo: oc ? nomeOcupacao(v, oc) : 'Um segundo trabalho', detalhe: 'em paralelo' }); }
  const n = negocioAberto(v);
  if (n && modo !== 'negocio') out.push({ id: 'negocio', lado: 'trabalho', rotulo: n.nome, detalhe: 'o próprio negócio' });
  if (modo === 'negocio' && n && !e) out.push({ id: 'negocio', lado: 'trabalho', rotulo: n.nome, detalhe: 'o próprio negócio' });
  if (v.caminhos.esporte?.fase === 'base') out.push({ id: 'base', lado: 'trabalho', rotulo: `Na base ${doClube(v.caminhos.esporte.clube)}` });
  if (modo === 'procurando') out.push({ id: 'procura', lado: 'trabalho', rotulo: 'Procurando trabalho' });
  if (modo === 'aposentado') out.push({ id: 'aposentadoria', lado: 'trabalho', rotulo: 'Aposentado' + (v.eu.genero === 'feminino' ? 'a' : '') });
  if (modo === 'pausa') out.push({ id: 'pausa', lado: 'trabalho', rotulo: 'Uma pausa no trabalho' });
  if (modo === 'preso') out.push({ id: 'pena', lado: 'trabalho', rotulo: 'Cumprindo pena' });
  if (!out.length) out.push({ id: 'nada', lado: i < 14 ? 'formacao' : 'trabalho', rotulo: i < 4 ? 'Crescendo' : i < 14 ? 'Fora da escola' : 'Sem estudo nem trabalho agora' });
  return out;
}

/** Qual lado vem primeiro: quem estuda e (ainda) não trabalha vê a formação; quem trabalha, o trabalho. */
export function ordemDosLados(v: Vida): ('formacao' | 'trabalho')[] {
  const modo = modoDoTrabalho(v);
  const estuda = !!v.educacao.basica || !!v.educacao.matricula;
  const formacaoPrimeiro = modo === 'crianca' || modo === 'estudante' || (estuda && !v.trabalho.atual && modo !== 'base' && modo !== 'preso');
  return formacaoPrimeiro ? ['formacao', 'trabalho'] : ['trabalho', 'formacao'];
}

/** A fase dos caminhos, numa frase (o título da página; o detalhe de cada lado vem nas fichas e nos cabeçalhos). */
export function faseDosCaminhos(v: Vida): string {
  const i = idade(v);
  const modo = modoDoTrabalho(v);
  const estuda = (!!v.educacao.basica && !v.educacao.evadiu) || !!v.educacao.matricula;
  if (modo === 'preso') return 'A vida em suspenso';
  if (i < 4) return 'Antes da escola';
  if (modo === 'crianca' || modo === 'estudante') return estuda ? (v.educacao.basica ? 'Os anos de escola' : 'Estudando') : 'Fora da escola';
  if (modo === 'base') return estuda ? 'A escola e a base' : 'A base, o sonho do esporte';
  if (modo === 'aposentado') return estuda ? 'Aposentadoria — e voltar a estudar' : 'Depois do trabalho';
  if (modo === 'procurando') return estuda ? 'Estudando e procurando trabalho' : 'Entre um trabalho e outro';
  if (modo === 'sem_procurar') return estuda ? 'Estudando' : 'Sem trabalho, por escolha';
  if (modo === 'pausa') return 'Uma pausa para cuidar';
  if (modo === 'atleta') return estuda ? 'O esporte e os estudos' : 'A vida de atleta';
  if (modo === 'negocio') return estuda ? 'O negócio e os estudos' : 'O próprio negócio';
  if (modo === 'politica') return 'A vida pública';
  return estuda ? 'Trabalhando e estudando' : 'A vida de trabalho';
}

const VAZIO: Record<ParteCaminhos, string> = {
  agora: 'Nada ocupa a vida agora.',
  desenvolvimento: 'Ainda não há o que medir: o desenvolvimento aparece quando há escola, curso, trabalho ou um caminho em construção.',
  oportunidades: 'Nenhuma porta aberta agora. Elas aparecem com a idade, a formação, a experiência e o que acontece na vida.',
  historico: 'Ainda não há história: escolas concluídas, diplomas, empregos e temporadas aparecem aqui.'
};

interface Props {
  vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void; abrirPessoa?: (id: string) => void;
  parte: ParteCaminhos; irParte: (p: ParteCaminhos) => void;
  explorar?: string; aoExplorar?: (a: string) => void;
}

export function PaginaCaminhos({ vida, agir, irPara, abrirPessoa, parte, irParte, explorar, aoExplorar }: Props) {
  const i = idade(vida);
  const agora = situacaoAtual(vida);
  const lados = ordemDosLados(vida);
  const temTrabalho = i >= 14 || vida.trabalho.historico.length > 0;
  const lado = (l: 'formacao' | 'trabalho', p: ParteCaminhos) => {
    if (l === 'formacao') return <Estudos vida={vida} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} parte={p} />;
    if (!temTrabalho) return p === 'agora' ? <TrabalhoAindaNao vida={vida} irPara={irPara} compacto /> : null;
    return <Trabalho vida={vida} agir={agir} irPara={irPara} parte={p} explorar={explorar} aoExplorar={aoExplorar} />;
  };
  return (
    <div className="pagina-caminhos">
      <header className="folio folio--caminhos">
        <p className="folio__kicker"><span className="folio__area">Caminhos</span> · {SECOES_CAMINHOS.find(x => x.id === parte)!.rotulo.toLowerCase()}</p>
        <h1 className="folio__titulo">{faseDosCaminhos(vida)}</h1>
        <ul className="situacao-atual" aria-label="O que ocupa a sua vida agora">
          {agora.map(x => (
            <li key={x.id} className={`situacao-atual__item situacao-atual__item--${x.lado}`} data-ocupacao={x.id}>
              <span className="situacao-atual__lado">{x.lado === 'formacao' ? 'Formação' : 'Trabalho'}</span>
              <span className="situacao-atual__rotulo">{x.rotulo.charAt(0).toUpperCase() + x.rotulo.slice(1)}</span>
              {x.detalhe && <span className="situacao-atual__detalhe">{x.detalhe}</span>}
            </li>
          ))}
        </ul>
      </header>
      <nav className="subnav subnav--caminhos" aria-label="Partes de Caminhos">
        <ul role="tablist" className="subnav__lista" onKeyDown={navegarAbas}>
          {SECOES_CAMINHOS.map(x => (
            <li key={x.id} role="presentation">
              <button type="button" role="tab" id={`subnav-caminhos-${x.id}`} aria-selected={parte === x.id} tabIndex={parte === x.id ? 0 : -1} aria-controls={`caminhos-${x.id}`} className={`subnav__item${parte === x.id ? ' subnav__item--ativo' : ''}`} onClick={() => irParte(x.id)} title={x.oque}>{x.rotulo}</button>
            </li>
          ))}
        </ul>
      </nav>
      {SECOES_CAMINHOS.map(x => (
        <div key={x.id} role="tabpanel" id={`caminhos-${x.id}`} aria-labelledby={`subnav-caminhos-${x.id}`} className={`caminhos__painel caminhos__painel--${x.id}${parte === x.id ? ' caminhos__painel--ativo' : ''}`} data-ativo={parte === x.id ? 'sim' : 'nao'}>
          {lados.map(l => <div key={l} className={`lado-caminho lado-caminho--${l}`} data-lado={l}>{lado(l, x.id)}</div>)}
          <p className="caminhos__vazio nota">{VAZIO[x.id]}</p>
        </div>
      ))}
    </div>
  );
}
