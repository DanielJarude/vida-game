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
 * REWORK 9.5 · UX-07: só a parte aberta é desenhada (antes, as quatro ficavam no documento e o CSS escondia três —
 * 15 a 25 ms a mais em cada toque). A navegação por intenção (`navegacao`) aponta para a parte certa; nenhuma ação
 * depende de outra parte estar desenhada para existir no motor.
 *
 * REWORK 9.6 · UX-09/10: a página misturava, em cada parte, a escola, as vagas, os concursos, a política e o esporte.
 * Agora Caminhos tem uma PÁGINA INICIAL curta (a situação, o próximo passo, as entradas — na ordem que a fase da vida
 * pede, sem esconder nenhuma) e quatro DIVISÕES que não se misturam: Estudos e Trabalho (cada um com as suas partes:
 * agora, desempenho, oportunidades, histórico), Vida pública e Outros caminhos. O que cruza as divisões vira LIGAÇÃO
 * (o técnico concluído abre vagas em Trabalho; a vaga mora em Trabalho, não no boletim) — nunca a mesma ação em dois
 * lugares. Só a divisão aberta (e a parte aberta) é desenhada.
 */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { doClube } from '../../motor/dados/clubes';
import { nomeOcupacao } from '../../motor/sistemas/trabalho';
import { modoDoTrabalho } from '../../motor/sistemas/profissao';
import { situacaoProfissional } from '../../motor/sistemas/situacaoProfissional';
import { negocioAberto } from '../../motor/sistemas/negocio';
import { nomeDaMatricula, rotuloSerie } from '../../motor/sistemas/escola';
import { instituicaoAtual } from '../../motor/sistemas/formacao';
import { navegarAbas } from '../comum';
import { recenteDe, TEMAS_CAMINHOS } from '../area';
import { DIVISOES_CAMINHOS, PARTES_DA_DIVISAO, type Aba, type DivisaoCaminhos, type ParteCaminhos } from '../navegacao';
import { Estudos } from './Estudos';
import { Trabalho, TrabalhoAindaNao } from './Trabalho';
import { DesenvolvimentoReal } from './Progresso';
import { ResumoDaRotina } from './Rotina';
import { OutrosCaminhosDaVida, Submundo, VidaPublica } from './DivisoesCaminhos';
import { situacaoNoSubmundo, temMargem } from './Margem';
import { leituraPolitica, naPolitica } from '../../motor/sistemas/politica';
import { editaisAbertos } from '../../motor/sistemas/concurso';
import { elegibilidade } from '../../motor/sistemas/trabalho';
import { podeTentar } from '../../motor/plausibilidade';
import { proximoPasso } from '../../motor/sistemas/trabalho';
import { oportunidadesAbertas } from '../../motor/sistemas/mercados';
import { rotuloEscolaridade } from '../../motor/sistemas/escola';
import { palavraDesempenho } from '../apresentar';

/** Uma coisa que ocupa a vida agora (a situação atual, em uma linha). */
export interface Ocupacao { id: string; lado: 'formacao' | 'trabalho'; rotulo: string; detalhe?: string }

/** A divisão de Caminhos onde mora cada coisa que ocupa a vida (a base é esporte; o mandato, vida pública). */
export function divisaoDaOcupacao(o: Ocupacao, v: Vida): Exclude<DivisaoCaminhos, 'inicio'> {
  if (o.lado === 'formacao') return o.id === 'concurso' ? 'publica' : 'estudos';
  if (o.id === 'pena' || o.id === 'por_fora') return 'submundo';
  if (o.id === 'base') return 'outros';
  if (o.id === 'trabalho' && modoDoTrabalho(v) === 'politica') return 'publica';
  return 'trabalho';
}

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
  // REWORK 11 · Fase B: a carreira especial sem contrato (o atleta sem clube, o técnico sem clube, o artista entre
  // trabalhos) continua sendo a carreira — na divisão Trabalho, com o nome dela; nunca "Procurando trabalho".
  const sp = situacaoProfissional(v);
  if (e) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    out.push({ id: 'trabalho', lado: 'trabalho', rotulo: oc ? nomeOcupacao(v, oc) : 'Trabalhando', detalhe: [e.empregador, `desde ${anoDe(e.tInicio)}`].filter(Boolean).join(' · ') });
  } else if (sp.semVinculo) out.push({ id: 'trabalho', lado: 'trabalho', rotulo: sp.rotulo, detalhe: sp.detalhe });
  const p = v.trabalho.paralela;
  if (p) { const oc = ocupacaoOuNula(p.ocupacaoId); out.push({ id: 'paralela', lado: 'trabalho', rotulo: oc ? nomeOcupacao(v, oc) : 'Um segundo trabalho', detalhe: 'em paralelo' }); }
  const n = negocioAberto(v);
  if (n && modo !== 'negocio') out.push({ id: 'negocio', lado: 'trabalho', rotulo: n.nome, detalhe: 'o próprio negócio' });
  if (modo === 'negocio' && n && !e) out.push({ id: 'negocio', lado: 'trabalho', rotulo: n.nome, detalhe: 'o próprio negócio' });
  if (v.caminhos.esporte?.fase === 'base') out.push({ id: 'base', lado: 'trabalho', rotulo: `Na base ${doClube(v.caminhos.esporte.clube)}` });
  if (modo === 'procurando' && !sp.semVinculo) out.push({ id: 'procura', lado: 'trabalho', rotulo: 'Procurando trabalho' });
  if (modo === 'aposentado') out.push({ id: 'aposentadoria', lado: 'trabalho', rotulo: 'Aposentado' + (v.eu.genero === 'feminino' ? 'a' : '') });
  if (modo === 'pausa') out.push({ id: 'pausa', lado: 'trabalho', rotulo: 'Uma pausa no trabalho' });
  if (modo === 'preso') out.push({ id: 'pena', lado: 'trabalho', rotulo: 'Cumprindo pena' });
  if (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined && modo !== 'preso') out.push({ id: 'por_fora', lado: 'trabalho', rotulo: 'Por fora', detalhe: 'a vida à margem' });
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
  const sp = situacaoProfissional(v);
  if (sp.semVinculo && !v.trabalho.atual) return sp.carreira === 'esporte' ? (estuda ? 'O esporte e os estudos' : 'A vida de atleta, sem clube agora') : sp.carreira === 'tecnico' ? 'O banco, entre um clube e outro' : 'A carreira, entre um trabalho e outro';
  if (modo === 'procurando') return estuda ? 'Estudando e procurando trabalho' : 'Entre um trabalho e outro';
  if (modo === 'sem_procurar') return estuda ? 'Estudando' : 'Sem trabalho, por escolha';
  if (modo === 'pausa') return 'Uma pausa para cuidar';
  if (modo === 'atleta') return estuda ? 'O esporte e os estudos' : 'A vida de atleta';
  if (modo === 'negocio') return estuda ? 'O negócio e os estudos' : 'O próprio negócio';
  if (modo === 'politica') return 'A vida pública';
  return estuda ? 'Trabalhando e estudando' : 'A vida de trabalho';
}

/** O que cada divisão diz de você agora, numa linha (a ficha da página inicial e o subtítulo da divisão). */
export function estadoDaDivisao(v: Vida, d: Exclude<DivisaoCaminhos, 'inicio'>): string {
  const i = idade(v);
  const modo = modoDoTrabalho(v);
  if (d === 'estudos') {
    const b = v.educacao.basica, m = v.educacao.matricula;
    if (b && !v.educacao.evadiu) return `${rotuloSerie(b)} · desempenho ${palavraDesempenho(b.desempenho)}`;
    if (m) return `${nomeDaMatricula(v, m)}${m.trancado ? ' · trancado' : ''}`;
    if (i < 4) return 'Antes da escola';
    return v.educacao.concluidos.length || v.educacao.escolaridade !== 'nenhuma' ? `Formação: ${rotuloEscolaridade(v, v.educacao.escolaridade)} — cursos ao alcance` : 'Sem estudar agora — cursos ao alcance';
  }
  if (d === 'trabalho') {
    if (i < 14 && !v.trabalho.historico.length) return 'Trabalho só a partir dos 14 (como aprendiz)';
    const e = v.trabalho.atual;
    if (modo === 'preso') return 'Cumprindo pena';
    if (e && modo !== 'politica') { const oc = ocupacaoOuNula(e.ocupacaoId); return `${oc ? cap(nomeOcupacao(v, oc)) : 'Trabalhando'} · desde ${anoDe(e.tInicio)}`; }
    const sp = situacaoProfissional(v);
    if (!e && sp.semVinculo) return [cap(sp.rotulo), sp.detalhe].filter(Boolean).join(' · ');
    if (modo === 'negocio') return negocioAberto(v)?.nome ?? 'O próprio negócio';
    if (modo === 'procurando') return 'Procurando trabalho — as vagas estão aqui';
    if (modo === 'aposentado') return 'Aposentadoria';
    return 'Sem trabalho agora — vagas, por conta, negócio';
  }
  if (d === 'publica') {
    if (i < 16) return 'Concursos e política, a partir dos 16';
    const pol = naPolitica(v) ? leituraPolitica(v) : undefined;
    if (pol) return pol.titulo;
    if (modo === 'servidor') return 'No serviço público';
    const estudando = v.rotinas.some(r => r.id === 'estudar_concurso');
    const n = i >= 17 ? editaisAbertos(v).filter(oc => podeTentar(elegibilidade(v, oc))).length : 0;
    return [estudando ? 'Estudando para concurso' : '', n ? `${n} ${n === 1 ? 'edital aberto' : 'editais abertos'} para você` : 'Nenhum edital para você este ano'].filter(Boolean).join(' · ');
  }
  if (d === 'submundo') return situacaoNoSubmundo(v);
  const esp = v.caminhos.esporte;
  const portas = oportunidadesAbertas(v).filter(o => ['peneira', 'seletiva', 'banda', 'grupo'].includes(o.tipo)).length;
  const partes = [
    esp?.fase === 'base' ? `Na base ${doClube(esp.clube)}` : esp?.fase === 'profissional' ? (situacaoProfissional(v).semVinculo ? `${cap(situacaoProfissional(v).rotulo)} (a carreira está em Trabalho)` : 'Atleta profissional (a carreira está em Trabalho)') : '',
    v.caminhos.arte?.ativo ? v.caminhos.arte.nome : '',
    portas ? `${portas} ${portas === 1 ? 'porta aberta' : 'portas abertas'}` : ''
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Esporte, arte, universidade: como cada um começa';
}

/** A ordem das entradas na página inicial: a fase da vida decide o que vem primeiro; nenhuma some. */
export function ordemDasDivisoes(v: Vida): Exclude<DivisaoCaminhos, 'inicio'>[] {
  const base = ordemDasDivisoesBase(v);
  if (!submundoVisivel(v)) return base;
  // O Submundo vem primeiro quando é a situação (a pena, a investigação, o que se faz por fora); senão, por último.
  const urgente = !!v.justica?.prisao || !!v.justica?.processo || (!!v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined);
  return urgente ? ['submundo', ...base] : [...base, 'submundo'];
}

/** REWORK 10.5 · CRI-02: o Submundo aparece a partir dos 14 (ou para quem já tem algo com isso). */
export const submundoVisivel = (v: Vida) => idade(v) >= 14 || temMargem(v);

function ordemDasDivisoesBase(v: Vida): Exclude<DivisaoCaminhos, 'inicio' | 'submundo'>[] {
  const i = idade(v);
  const modo = modoDoTrabalho(v);
  const estuda = (!!v.educacao.basica && !v.educacao.evadiu) || !!v.educacao.matricula;
  if (modo === 'politica' || modo === 'servidor' || (naPolitica(v) && !v.trabalho.atual)) return ['publica', 'trabalho', 'estudos', 'outros'];
  // A base é formação (mora em Outros caminhos). REWORK 11 · Fase B: a carreira de atleta, de técnico ou de artista — com
  // contrato ou sem — mora em Trabalho (o painel, o contrato ou a falta dele, as ações): Trabalho vem primeiro, e Outros
  // caminhos logo depois (as portas do esporte e da arte). Antes, o atleta com clube via Outros primeiro, e o sem clube
  // via "Procurando trabalho" primeiro e a carreira só no fim, em "Em andamento".
  if (modo === 'base' || v.caminhos.esporte?.fase === 'base') return ['outros', estuda ? 'estudos' : 'trabalho', estuda ? 'trabalho' : 'estudos', 'publica'];
  if (modo === 'atleta' || modo === 'artista' || (situacaoProfissional(v).semVinculo && !v.trabalho.atual)) return ['trabalho', 'outros', 'estudos', 'publica'];
  if (i < 14) return ['estudos', 'outros', 'trabalho', 'publica'];
  if (estuda && !v.trabalho.atual) return ['estudos', 'trabalho', 'outros', 'publica'];
  return ['trabalho', 'estudos', 'publica', 'outros'];
}

/** O próximo passo que mais importa agora (um, com o lugar onde se dá) — lido do motor, nunca inventado. */
export function proximoNosCaminhos(v: Vida): { texto: string; divisao: Exclude<DivisaoCaminhos, 'inicio'>; parte?: ParteCaminhos } | undefined {
  const modo = modoDoTrabalho(v);
  const sp = situacaoProfissional(v);
  if (sp.semVinculo && !v.trabalho.atual) return { texto: `${cap(sp.rotulo)}${sp.detalhe ? ` (${sp.detalhe})` : ''}: a carreira continua — a situação e o que dá para fazer estão em Trabalho.`, divisao: 'trabalho', parte: 'agora' };
  if (modo === 'procurando') return { texto: 'Procurar trabalho: as vagas ao seu alcance, com o que cada uma pede.', divisao: 'trabalho', parte: 'oportunidades' };
  const pp = proximoPasso(v);
  if (pp) return { texto: pp.resumo, divisao: 'trabalho', parte: 'agora' };
  const b = v.educacao.basica;
  if (b && !v.educacao.evadiu) return { texto: `${rotuloSerie(b)}: o boletim diz como vão as matérias.`, divisao: 'estudos', parte: 'desenvolvimento' };
  const m = v.educacao.matricula;
  if (m && !m.trancado) return { texto: `${nomeDaMatricula(v, m)}: ${m.mesesRestantes <= 12 ? 'o último ano' : `faltam uns ${Math.ceil(m.mesesRestantes / 12)} anos`}.`, divisao: 'estudos', parte: 'agora' };
  return undefined;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const VAZIO: Record<ParteCaminhos, string> = {
  agora: 'Nada ocupa a vida agora.',
  desenvolvimento: 'Ainda não há o que medir: o desenvolvimento aparece quando há escola, curso, trabalho ou um caminho em construção.',
  oportunidades: 'Nenhuma porta aberta agora. Elas aparecem com a idade, a formação, a experiência e o que acontece na vida.',
  historico: 'Ainda não há história: escolas concluídas, diplomas, empregos e temporadas aparecem aqui.'
};

interface Props {
  vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void; abrirPessoa?: (id: string) => void;
  divisao?: DivisaoCaminhos; irDivisao?: (d: DivisaoCaminhos, p?: ParteCaminhos) => void;
  parte: ParteCaminhos; irParte: (p: ParteCaminhos) => void;
  explorar?: string; aoExplorar?: (a: string | undefined) => void;
}

export function PaginaCaminhos({ vida, agir, irPara, abrirPessoa, divisao = 'inicio', irDivisao = () => {}, parte, irParte, explorar, aoExplorar }: Props) {
  const i = idade(vida);
  const rotulo = DIVISOES_CAMINHOS.find(x => x.id === divisao)!.rotulo;
  return (
    <div className={`pagina-caminhos pagina-caminhos--${divisao}`}>
      <nav className="divisoes-caminhos" aria-label="Divisões de Caminhos">
        <ul className="divisoes-caminhos__lista">
          {DIVISOES_CAMINHOS.filter(x => x.id !== 'submundo' || submundoVisivel(vida) || divisao === 'submundo').map(x => (
            <li key={x.id}>
              <button type="button" className={`divisoes-caminhos__item${divisao === x.id ? ' divisoes-caminhos__item--ativa' : ''}`} aria-current={divisao === x.id ? 'page' : undefined} onClick={() => irDivisao(x.id)} title={x.oque}>{x.rotulo}</button>
            </li>
          ))}
        </ul>
      </nav>
      {divisao === 'inicio'
        ? <InicioCaminhos vida={vida} irDivisao={irDivisao} irPara={irPara} />
        : (
          <header className="folio folio--caminhos folio--divisao">
            <p className="folio__kicker"><span className="folio__area">Caminhos</span> · {rotulo.toLowerCase()}</p>
            <h1 className="folio__titulo">{rotulo}</h1>
            <p className="folio__lede">{estadoDaDivisao(vida, divisao)}</p>
            {divisao === 'estudos' && parte === 'agora' && i >= 6 && <ResumoDaRotina vida={vida} irPara={() => irPara('semana')} />}
          </header>
        )}
      {(divisao === 'estudos' || divisao === 'trabalho') && (
        <>
          <nav className="subnav subnav--caminhos" aria-label={`Partes de ${rotulo}`}>
            <ul role="tablist" className="subnav__lista" onKeyDown={navegarAbas}>
              {PARTES_DA_DIVISAO[divisao].map(x => (
                <li key={x.id} role="presentation">
                  <button type="button" role="tab" id={`subnav-caminhos-${x.id}`} aria-selected={parte === x.id} tabIndex={parte === x.id ? 0 : -1} aria-controls={parte === x.id ? `caminhos-${x.id}` : undefined} className={`subnav__item${parte === x.id ? ' subnav__item--ativo' : ''}`} onClick={() => irParte(x.id)} title={x.oque}>{x.rotulo}</button>
                </li>
              ))}
            </ul>
          </nav>
          <div role="tabpanel" id={`caminhos-${parte}`} aria-labelledby={`subnav-caminhos-${parte}`} className={`caminhos__painel caminhos__painel--${parte} caminhos__painel--ativo`} data-ativo="sim" data-divisao={divisao}>
            {divisao === 'estudos' && parte === 'desenvolvimento' && <DesenvolvimentoReal vida={vida} lado="estudos" />}
            {divisao === 'trabalho' && parte === 'desenvolvimento' && <DesenvolvimentoReal vida={vida} lado="trabalho" />}
            {divisao === 'estudos'
              ? <div className="lado-caminho lado-caminho--formacao" data-lado="formacao"><Estudos vida={vida} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} parte={parte} divisao explorar={explorar} aoExplorar={aoExplorar} /></div>
              : <div className="lado-caminho lado-caminho--trabalho" data-lado="trabalho">{i >= 14 || vida.trabalho.historico.length > 0
                ? <Trabalho vida={vida} agir={agir} irPara={irPara} parte={parte} explorar={explorar} aoExplorar={aoExplorar} divisao />
                : parte === 'agora' ? <TrabalhoAindaNao vida={vida} irPara={irPara} compacto /> : null}</div>}
            <p className="caminhos__vazio nota">{VAZIO[parte]}</p>
            <LigacoesDaDivisao vida={vida} divisao={divisao} irPara={irPara} />
          </div>
        </>
      )}
      {divisao === 'publica' && <div className="caminhos__painel caminhos__painel--publica caminhos__painel--ativo" data-divisao="publica"><VidaPublica vida={vida} agir={agir} irPara={irPara} /></div>}
      {divisao === 'outros' && <div className="caminhos__painel caminhos__painel--outros caminhos__painel--ativo" data-divisao="outros"><OutrosCaminhosDaVida vida={vida} agir={agir} irPara={irPara} /></div>}
      {divisao === 'submundo' && <div className="caminhos__painel caminhos__painel--submundo caminhos__painel--ativo" data-divisao="submundo"><Submundo vida={vida} agir={agir} irPara={irPara} /></div>}
    </div>
  );
}

/**
 * A PÁGINA INICIAL de Caminhos: o que ocupa a vida agora (cada coisa leva à sua divisão), o próximo passo que mais
 * importa e as quatro entradas, na ordem da fase da vida. Não lista as oportunidades do mundo: cada divisão as tem.
 */
function InicioCaminhos({ vida, irDivisao, irPara }: { vida: Vida; irDivisao: (d: DivisaoCaminhos, p?: ParteCaminhos) => void; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const agora = situacaoAtual(vida);
  const prox = proximoNosCaminhos(vida);
  const ordem = ordemDasDivisoes(vida);
  return (
    <>
      <header className="folio folio--caminhos">
        <p className="folio__kicker"><span className="folio__area">Caminhos</span> · início</p>
        <h1 className="folio__titulo">{faseDosCaminhos(vida)}</h1>
        <ul className="situacao-atual" aria-label="O que ocupa a sua vida agora">
          {agora.map(x => {
            const d = divisaoDaOcupacao(x, vida);
            return (
              <li key={x.id} className={`situacao-atual__item situacao-atual__item--${x.lado}`} data-ocupacao={x.id}>
                <button type="button" className="situacao-atual__ir" onClick={() => irDivisao(d, 'agora')} disabled={x.id === 'nada'}>
                  <span className="situacao-atual__lado">{DIVISOES_CAMINHOS.find(y => y.id === d)!.rotulo}</span>
                  <span className="situacao-atual__rotulo">{cap(x.rotulo)}</span>
                  {x.detalhe && <span className="situacao-atual__detalhe">{x.detalhe}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {i >= 6 && <ResumoDaRotina vida={vida} irPara={() => irPara('semana')} />}
        {/* REWORK 10 · UX-13: o que aconteceu há pouco nos estudos e no trabalho (a mesma leitura da cabeça das outras áreas). */}
        {(() => { const r = recenteDe(vida, TEMAS_CAMINHOS); return r ? <p className="cabeca-area__recente caminhos__recente"><span className="cabeca-area__rotulo">Há pouco</span><span className="cabeca-area__quando">{r.quando}</span> {r.texto}</p> : null; })()}
      </header>
      {prox && (
        <section className="proximo-caminho" aria-labelledby="titulo-proximo-caminho">
          <h2 id="titulo-proximo-caminho" className="proximo-caminho__rotulo">O próximo passo</h2>
          <p className="proximo-caminho__texto">{prox.texto}</p>
          <button type="button" className="link proximo-caminho__ir" onClick={() => irDivisao(prox.divisao, prox.parte)}>Ver em {DIVISOES_CAMINHOS.find(y => y.id === prox.divisao)!.rotulo} →</button>
        </section>
      )}
      <ul className="entradas-caminhos" aria-label="Os caminhos">
        {ordem.map(d => {
          const x = DIVISOES_CAMINHOS.find(y => y.id === d)!;
          return (
            <li key={d} className={`entrada-caminho entrada-caminho--${d}`}>
              <button type="button" className="entrada-caminho__botao" onClick={() => irDivisao(d)}>
                <span className="entrada-caminho__nome">{x.rotulo}</span>
                <span className="entrada-caminho__estado">{estadoDaDivisao(vida, d)}</span>
                <span className="entrada-caminho__oque">{x.oque}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** O que cruza as divisões, como ligação (nunca a mesma ação duas vezes): o curso que abre vagas, a vaga que pede curso. */
function LigacoesDaDivisao({ vida, divisao, irPara }: { vida: Vida; divisao: 'estudos' | 'trabalho'; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const ultimo = [...vida.educacao.concluidos].sort((a, b) => b.tFim - a.tFim)[0];
  const recente = ultimo && vida.t - ultimo.tFim <= 24 && ultimo.nivel !== 'livre';
  if (divisao === 'estudos') {
    if (!recente || i < 14) return null;
    return <p className="ligacao-caminho"><span>{cap(ultimo.nome)} concluído: as vagas que pedem essa formação estão em Trabalho.</span> <button type="button" className="link" onClick={() => irPara('vagas')}>Ver as vagas →</button></p>;
  }
  if (i < 15) return null;
  return <p className="ligacao-caminho"><span>Faltou formação para uma vaga? Os cursos estão em Estudos; concursos, em Vida pública.</span> <button type="button" className="link" onClick={() => irPara('cursos')}>Ver os cursos →</button></p>;
}
