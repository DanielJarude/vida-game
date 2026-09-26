/**
 * Estudos: a formação, inteira, num lugar só.
 *
 * Antes se chamava "Rumo" — e ninguém sabia o que era. Aqui se responde de
 * imediato: onde eu estudo agora (escola, faculdade, curso), o que já ficou
 * para trás, por onde dá para seguir, e onde procuro uma formação nova. O
 * catálogo de cursos é grande (isso é bom) e se explora por área, nível,
 * busca e pelo que faz sentido para esta vida.
 */

import { useMemo } from 'react';
import type { Oportunidade, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { curso, cursoOuNulo, type AreaFormacao } from '../../motor/dados/cursos';
import { OCUPACOES } from '../../motor/dados/ocupacoes';
import { nomeLugar } from '../../motor/dados/lugares';
import { consequenciasDaMudanca } from '../../motor/sistemas/processos';
import { nomeOcupacao } from '../../motor/sistemas/trabalho';
import { melhorNotaRecente, rotuloSerie, ROTULO_ESCOLARIDADE, temCota, NOME_MATERIA } from '../../motor/sistemas/escola';
import { materiasExtremas } from '../../motor/sistemas/frentes';
import { podeTentar } from '../../motor/plausibilidade';
import { anoDe } from '../../motor/tempo';
import { BotaoAcao, Escolha, Folio, Linha, Secao } from '../comum';
import { cursosAgrupados, cursosParaVoce } from '../../motor/sistemas/relevancia';
import { dinheiroCurto, palavraDesempenho } from '../apresentar';
import { Catalogo, type ItemCatalogo } from './Catalogo';
import type { Aba } from '../telas/Jogo';
import { analisarEntrada } from '../../motor/sistemas/compromissos';
import { novaMatricula } from '../../motor/sistemas/escola';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }

const VIA: Record<string, string> = {
  sisu: 'SISU — universidade pública', selecao_publica: 'Seleção pública', privada: 'Particular',
  prouni: 'ProUni — bolsa integral', fies: 'FIES — financiamento', ead: 'A distância (EAD)'
};

const NIVEL: Record<string, string> = { livre: 'Ofício e qualificação', tecnico: 'Técnico', superior: 'Faculdade', pos: 'Pós-graduação', residencia: 'Pós-graduação', mestrado: 'Pós-graduação', doutorado: 'Pós-graduação' };
const TIPO_NIVEL: Record<string, string> = { livre: 'oficio', tecnico: 'tecnico', superior: 'superior', pos: 'pos', residencia: 'pos', mestrado: 'pos', doutorado: 'pos' };

/** A grande área de cada formação (o agrupamento do catálogo). */
const GRANDE_AREA: Record<AreaFormacao, string> = {
  medicina: 'saúde', enfermagem: 'saúde', psicologia: 'saúde', educacao_fisica: 'saúde', nutricao: 'saúde', fisioterapia: 'saúde', odontologia: 'saúde', farmacia: 'saúde', veterinaria: 'saúde', radiologia: 'saúde',
  direito: 'direito e humanas', economia: 'negócios e gestão', administracao: 'negócios e gestão', contabilidade: 'negócios e gestão', logistica: 'negócios e gestão', imoveis: 'negócios e gestão',
  engenharia_civil: 'engenharia e indústria', engenharia: 'engenharia e indústria', arquitetura: 'engenharia e indústria', eletrotecnica: 'engenharia e indústria', mecanica: 'engenharia e indústria', automacao: 'engenharia e indústria', edificacoes: 'engenharia e indústria', seguranca_trabalho: 'engenharia e indústria',
  eletrica: 'ofícios', soldagem: 'ofícios', vigilancia: 'ofícios', arbitragem: 'ofícios',
  computacao: 'tecnologia', exatas: 'ciências e matemática',
  educacao: 'educação e letras', letras: 'educação e letras',
  design: 'artes e comunicação', comunicacao: 'artes e comunicação', musica_formacao: 'artes e comunicação', artes_cenicas: 'artes e comunicação',
  agro: 'campo', gastronomia: 'cozinha e beleza', beleza: 'cozinha e beleza', qualquer: 'outras áreas'
};

const PORTAS_DE_TRABALHO = new Set(['vaga', 'indicacao', 'aprendiz', 'estagio', 'temporario', 'proposta', 'reinsercao', 'funcao', 'atualizacao']);
const PORTAS_DE_TEMPO = new Set(['peneira', 'seletiva', 'banda', 'grupo', 'retomar', 'clientela']);
/** Em que área a porta aparece: trabalho, estudos ou tempo livre (esporte, arte, o bico). */
export function areaDaPorta(o: Oportunidade): 'trabalho' | 'estudos' | 'tempo' {
  if (PORTAS_DE_TRABALHO.has(o.tipo)) return 'trabalho';
  if ((o.tipo === 'convite' || o.tipo === 'bolsa') && o.ocupacaoId) return 'trabalho';
  if (PORTAS_DE_TEMPO.has(o.tipo)) return 'tempo';
  return 'estudos';
}
/** A porta é de trabalho? (compatibilidade com quem já chamava assim) */
export const ehPortaDeTrabalho = (o: Oportunidade) => areaDaPorta(o) === 'trabalho';

export function Estudos({ vida, agir }: Props) {
  const i = idade(vida);
  const e = vida.educacao;
  const titulo = e.basica ? rotuloSerie(e.basica) : e.matricula ? curso(e.matricula.cursoId).nome : i < 4 ? 'Ainda não é hora da escola' : i >= 18 ? 'Estudar de novo, ou pela primeira vez' : 'Sem estudar agora';
  const lede = e.basica ? `Escola ${e.basica.rede === 'publica' ? 'pública' : 'particular'} · notas ${palavraDesempenho(e.basica.desempenho)}` : e.matricula ? `${e.matricula.instituicao}${e.matricula.trancado ? ' · trancado' : ` · ${e.matricula.mesesRestantes <= 12 ? 'último ano' : `faltam uns ${Math.ceil(e.matricula.mesesRestantes / 12)} anos`}`}` : ROTULO_ESCOLARIDADE[e.escolaridade];
  return (
    <div className="estudos rumo">
      <Folio kicker={<><span className="folio__area">Estudos</span> · a sua formação</>} titulo={titulo} lede={lede} />
      <PortasAbertas vida={vida} agir={agir} filtro={o => areaDaPorta(o) === 'estudos'} titulo="Ao seu alcance agora" />
      <TrajetoriaDeEstudo vida={vida} />
      <Estudo vida={vida} agir={agir} />
      {i >= 15 && <Cursos vida={vida} agir={agir} />}
      {i < 14 && !vida.educacao.basica && <p className="vazio">Por enquanto, o estudo é crescer.</p>}
    </div>
  );
}

/* ------------------------------------------------------ Estudo: trajetória */

/** Passado → agora → próximo: a formação como um caminho, em poucas linhas. */
function TrajetoriaDeEstudo({ vida }: { vida: Vida }) {
  const e = vida.educacao;
  const i = idade(vida);
  const passado: { ano: number; texto: string }[] = [];
  // O que a biografia já registra (nada é inventado aqui).
  for (const x of vida.biografia) {
    if (x.tema !== 'escola' && x.tema !== 'estudo') continue;
    if (/^Terminou o fundamental/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: 'Fundamental completo' });
    else if (/^Concluiu o ensino médio/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: 'Ensino médio completo' });
    else if (/^Largou a escola/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: x.texto.replace(/\.$/, '') });
    else if (/^Trancou /.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: x.texto.replace(/\.$/, '') });
    else if (/^Abandonou o curso/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: x.texto.replace(/\.$/, '') });
  }
  for (const c of e.concluidos) passado.push({ ano: anoDe(c.tFim), texto: c.nome });
  passado.sort((a, b) => a.ano - b.ano);
  const b = e.basica;
  const m = e.matricula;
  const agora = b ? `${rotuloSerie(b)}, escola ${b.rede === 'publica' ? 'pública' : 'particular'}` : m ? `${curso(m.cursoId).nome}${m.trancado ? ' (trancado)' : ''}` : i < 4 ? 'Ainda não é hora da escola' : 'Sem estudar agora';
  const detalhe = b && b.etapa !== 'creche' && b.etapa !== 'pre' ? `Notas: ${palavraDesempenho(b.desempenho)}` : m ? (m.trancado ? `Trancado desde ${anoDe(m.tTrancou ?? vida.t)}: a vaga espera até ${anoDe((m.tTrancou ?? vida.t) + 48)}` : `${m.mesesRestantes <= 12 ? 'Último ano' : `Faltam uns ${Math.ceil(m.mesesRestantes / 12)} anos`} · desempenho ${palavraDesempenho(m.desempenho)}`) : ROTULO_ESCOLARIDADE[e.escolaridade];
  const { para } = i >= 15 && !m ? cursosParaVoce(vida) : { para: [] };
  const proximo = b ? (b.etapa === 'medio' ? 'Depois do médio: faculdade, técnico, trabalho — ou os três.' : 'Seguir na escola.') : m ? portasDoCurso(vida, m.cursoId) : '';
  return (
    <section className="trajeto" aria-label="Sua trajetória nos estudos">
      <ol className="trajeto__linha">
        {passado.slice(-5).map((x, k) => (
          <li key={k} className="trajeto__passo trajeto__passo--passado"><span className="trajeto__ano">{x.ano}</span><span className="trajeto__texto">{x.texto}</span></li>
        ))}
        <li className="trajeto__passo trajeto__passo--agora" aria-current="step">
          <span className="trajeto__ano">Agora</span>
          <span className="trajeto__texto">{agora}</span>
          <span className="trajeto__detalhe">{detalhe}</span>
        </li>
        {para.length > 0 ? para.slice(0, 3).map(x => (
          <li key={x.item.curso.id} className="trajeto__passo trajeto__passo--porta">
            <span className="trajeto__ano">Porta</span>
            <span className="trajeto__texto">{x.item.curso.nome}</span>
            <span className="trajeto__detalhe">{x.motivo}</span>
          </li>
        )) : proximo ? (
          <li className="trajeto__passo trajeto__passo--porta"><span className="trajeto__ano">Depois</span><span className="trajeto__texto">{proximo}</span></li>
        ) : null}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------ Portas */

/** As portas que a vida abriu (filtradas pela área que as mostra). Elas não esperam para sempre. */
export function PortasAbertas({ vida, agir, filtro, titulo }: { vida: Vida; agir: (a: Acao) => boolean; filtro: (o: Oportunidade) => boolean; titulo: string }) {
  const ops = vida.caminhos.oportunidades.filter(o => o.tFim > vida.t && filtro(o));
  if (!ops.length) return null;
  return (
    <section className="portas-abertas" aria-labelledby={`portas-${titulo}`}>
      <h2 id={`portas-${titulo}`} className="secao-fio">{titulo}</h2>
      <ul className="portas">
        {ops.map(o => (
          <li key={o.id} className="porta">
            <div className="porta__texto">
              <strong>{o.titulo}</strong>
              <p>{o.texto}</p>
              <span className="porta__prazo">Até {anoDe(o.tFim)}</span>
            </div>
            <div className="porta__acoes">
              <BotaoAcao vida={vida} acao={{ tipo: 'oportunidade', id: o.id, aceitar: true }} agir={agir} variante="principal">{o.tipo === 'peneira' ? 'Ir à peneira' : o.tipo === 'seletiva' ? 'Ir à seletiva' : o.tipo === 'selecao_tecnico' ? 'Fazer a prova' : o.tipo === 'retomar' ? 'Voltar a fazer' : 'Aceitar'}</BotaoAcao>
              <BotaoAcao vida={vida} acao={{ tipo: 'oportunidade', id: o.id, aceitar: false }} agir={agir} variante="discreto">Deixar passar</BotaoAcao>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ Estudo */

function Estudo({ vida, agir }: Props) {
  const e = vida.educacao;
  const b = e.basica;
  const m = e.matricula;
  const i = idade(vida);
  const estudando = !!b || !!m;
  const { forte, fraca } = materiasExtremas(vida);
  const temAlgo = estudando || e.evadiu || i >= 15;
  if (!temAlgo) return null;
  return (
    <Secao titulo={estudando ? 'Os estudos agora' : 'Estudar'}>
      {b && (
        <>
          {b.integrado && <Linha rotulo="Integrado" valor={cursoOuNulo(b.integrado)?.nome ?? 'técnico'} />}
          {forte && fraca && b.etapa !== 'creche' && b.etapa !== 'pre' && <p className="nota">Vai melhor em {NOME_MATERIA[forte]}; {NOME_MATERIA[fraca]} é onde mais sofre.</p>}
          {b.reprovacoes > 0 && <Linha rotulo="Repetências" valor={String(b.reprovacoes)} />}
        </>
      )}
      {m && (
        <>
          <Linha rotulo="Onde" valor={`${m.instituicao}${m.modalidade === 'ead' ? ' · a distância' : ` · ${nomeLugar(m.municipioId)}`}`} />
          <Linha rotulo="Turno" valor={m.modalidade === 'ead' ? 'no seu tempo' : curso(m.cursoId).carga === 'integral' ? 'período integral (não cabe com emprego de dia inteiro)' : 'à noite (cabe com trabalho)'} />
          {m.mensalidade > 0 && <Linha rotulo={m.financiamento === 'fies' ? 'Mensalidade (FIES)' : 'Mensalidade'} valor={dinheiroCurto(m.mensalidade)} />}
        </>
      )}
      {e.evadiu && !b && <p className="nota">Você largou a escola. Dá para voltar pelo supletivo.</p>}
      {estudando && i >= 7 && (
        <div className="campo">
          <span className="campo__rotulo">Como você encara os estudos este ano</span>
          <Escolha rotulo="Postura nos estudos" valor={e.postura} aoMudar={valor => agir({ tipo: 'postura', valor })}
            opcoes={[{ id: 'dedicada', rotulo: 'Com dedicação' }, { id: 'normal', rotulo: 'No ritmo' }, { id: 'relaxada', rotulo: 'Empurrando' }]} />
        </div>
      )}
      <div className="grupo-acoes">
        {i >= 15 && <BotaoAcao vida={vida} acao={{ tipo: 'enem' }} agir={agir} ocultarImpossivel>Fazer o ENEM deste ano</BotaoAcao>}
        {m && !m.trancado && <BotaoAcao vida={vida} acao={{ tipo: 'trancar' }} agir={agir} variante="discreto">Trancar o curso</BotaoAcao>}
        {m?.trancado && <BotaoAcao vida={vida} acao={{ tipo: 'destrancar' }} agir={agir}>Voltar ao curso</BotaoAcao>}
        {m && <BotaoAcao vida={vida} acao={{ tipo: 'abandonar_curso' }} agir={agir} variante="perigo">Abandonar o curso</BotaoAcao>}
        {b && i >= 15 && <BotaoAcao vida={vida} acao={{ tipo: 'largar_escola' }} agir={agir} variante="perigo">Largar a escola</BotaoAcao>}
        {e.evadiu && <BotaoAcao vida={vida} acao={{ tipo: 'voltar_a_estudar' }} agir={agir}>Voltar a estudar (supletivo)</BotaoAcao>}
      </div>
      {melhorNotaRecente(vida) > 0 && <p className="nota">Melhor ENEM recente: {melhorNotaRecente(vida)}{temCota(vida) ? ' · você concorre por cota (escola pública e baixa renda)' : ''}.</p>}
    </Secao>
  );
}

/** O que um curso abre, em palavras (para que a formação tenha consequência visível). */
function portasDoCurso(v: Vida, cursoId: string): string {
  const c = cursoOuNulo(cursoId);
  if (!c) return '';
  const ocs = OCUPACOES.filter(oc => oc.area && (oc.area.includes(c.area as never)) && !oc.experiencia && oc.contrato !== 'estagio' && !oc.entrada).slice(0, 3);
  if (!ocs.length) return c.descricao;
  return `Abre portas como: ${ocs.map(oc => nomeOcupacao(v, oc)).join(', ')}.`;
}

function Cursos({ vida, agir }: Props) {
  const { para } = useMemo(() => cursosParaVoce(vida), [vida]);
  const todos = useMemo(() => cursosAgrupados(vida), [vida]);
  const sugestao = new Map(para.map(x => [x.item.curso.id, x.motivo]));
  if (vida.educacao.matricula && !vida.educacao.matricula.trancado) return <Secao titulo="Outra formação"><p className="nota">Um curso de cada vez: quando este terminar (ou for trancado), o catálogo volta a abrir aqui.</p></Secao>;
  const itens: ItemCatalogo[] = todos.map(c => {
    const cc = c.curso;
    const vias = [...c.opcoes].sort((a, b) => Number(podeTentar(b.o.veredito)) - Number(podeTentar(a.o.veredito)) || (b.o.veredito.chance ?? 0) - (a.o.veredito.chance ?? 0)).slice(0, 4);
    const melhor = vias[0]?.o;
    const duracao = cc.meses >= 24 ? `${cc.meses / 12} anos` : `${cc.meses} meses`;
    return {
      id: cc.id,
      titulo: cc.nome,
      grupo: GRANDE_AREA[cc.area as AreaFormacao] ?? 'outras áreas',
      tipo: TIPO_NIVEL[cc.nivel],
      meta: `${NIVEL[cc.nivel]} · ${duracao}${cc.carga === 'integral' ? ' · período integral' : ''}${melhor ? ` · ${melhor.mensalidade > 0 ? `${dinheiroCurto(melhor.mensalidade)}/mês` : melhor.via === 'fies' ? 'paga depois de formado' : 'sem mensalidade'}` : ''}`,
      motivo: sugestao.get(cc.id),
      destaque: sugestao.has(cc.id),
      possivel: c.possivel,
      bloqueio: vias.find(x => !podeTentar(x.o.veredito))?.o.veredito.motivo,
      busca: `${cc.area} ${cc.descricao}`,
      detalhe: (
        <div className="curso-detalhe">
          <p className="nota">{cc.descricao} {portasDoCurso(vida, cc.id)}</p>
          {vias.map(({ o, indice }) => (
            <div key={indice} className="via">
              <div className="via__texto">
                <strong>{VIA[o.via]}</strong>
                <span>{o.modalidade === 'ead' ? 'de casa' : nomeLugar(o.municipioId)}{o.mensalidade > 0 ? ` · ${dinheiroCurto(o.mensalidade)}/mês` : o.via === 'fies' ? ' · paga depois de formado' : ' · sem mensalidade'}{o.modalidade !== 'ead' && o.municipioId !== vida.moradia.municipioId ? ' · pede mudança de cidade' : ''}</span>
                {o.observacao && <span className="via__obs">{o.observacao}</span>}
                {/* Estudar em outra cidade é mudar: o que fica para trás é dito antes de tentar. */}
                {o.modalidade !== 'ead' && o.municipioId !== vida.moradia.municipioId && (() => { const efeitos = consequenciasDaMudanca(vida, o.municipioId); return efeitos.length ? <ul className="via__consequencias">{efeitos.map((x, k) => <li key={k}>{x}</li>)}</ul> : null; })()}
                {/* O que a matrícula conflitaria (o trabalho do dia inteiro, a base): dito antes; se passar, a vida pergunta. */}
                {(() => { const c = analisarEntrada(vida, novaMatricula(vida, o)); return c.length ? <span className="via__obs">{c.map(x => `${x.motivo}: ${x.impede ? 'não dá agora' : 'se passar, a vida pergunta o que fazer'}.`).join(' ')}</span> : null; })()}
              </div>
              <BotaoAcao vida={vida} acao={{ tipo: 'matricular', indice }} agir={agir} mostrarChance>Tentar</BotaoAcao>
            </div>
          ))}
        </div>
      )
    };
  });
  return (
    <Secao titulo="Procurar uma formação">
      {para.length === 0 && melhorNotaRecente(vida) === 0 && idade(vida) >= 16 && <p className="nota">Uma nota do ENEM abre as portas da faculdade pública.</p>}
      <Catalogo itens={itens} rotulo="Cursos" dicaBusca="enfermagem, direito, solda, técnico…" tipos={[{ id: 'oficio', rotulo: 'Ofício' }, { id: 'tecnico', rotulo: 'Técnico' }, { id: 'superior', rotulo: 'Faculdade' }, { id: 'pos', rotulo: 'Pós' }]} vazio="Nenhum curso com esse filtro." porGrupo={5} />
    </Secao>
  );
}
