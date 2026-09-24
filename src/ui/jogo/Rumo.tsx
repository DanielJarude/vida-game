/**
 * Rumo: estudo e trabalho — duas composições, não uma lista.
 *
 * No topo, as portas que a vida abriu agora (valem para os dois lados).
 * ESTUDO é uma trajetória: o que já ficou para trás, onde você está, e as
 * portas seguintes (poucas, com motivo); o resto do catálogo fica em
 * "explorar". TRABALHO é uma escada: os degraus da sua estrada, onde você
 * está, o próximo passo e o que falta; depois as vagas que fazem sentido
 * para você, e o resto recolhido por área. Devolutivas das últimas
 * tentativas dizem o que pesou. Nunca "nível 2": sempre palavras.
 */

import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { curso, cursoOuNulo } from '../../motor/dados/cursos';
import { OCUPACOES, ROTULO_TRILHA, ROTULO_SETOR, ocupacao, type Ocupacao } from '../../motor/dados/ocupacoes';
import { nomeLugar } from '../../motor/dados/lugares';
import { degrausAcima, elegibilidade, estradaNaArea, horizonte, nomeOcupacao, porContaPropria } from '../../motor/sistemas/trabalho';
import { melhorNotaRecente, rotuloSerie, ROTULO_ESCOLARIDADE, temCota, NOME_MATERIA } from '../../motor/sistemas/escola';
import { materiasExtremas } from '../../motor/sistemas/frentes';
import { editaisAbertos, leituraDoPreparo } from '../../motor/sistemas/concurso';
import { negociosPossiveis } from '../../motor/sistemas/negocio';
import { liquido } from '../../motor/sistemas/renda';
import { podeTentar } from '../../motor/plausibilidade';
import { disponibilidade } from '../../motor/acoes';
import { anoDe } from '../../motor/tempo';
import { BotaoAcao, Escolha, Linha, Secao, Vazio } from '../comum';
import { cursosParaVoce, vagasParaVoce, type CursoOpcoes } from '../../motor/sistemas/relevancia';
import { O_QUE_TRABALHAR } from '../../motor/sistemas/devolutivas';
import { dinheiroCurto, palavraDesempenho } from '../apresentar';
import { situacaoNaJustica } from '../../motor/sistemas/justica';
import { leituraDaPausa } from '../../motor/sistemas/pausa';
import { leituraDoEnvolvimento } from '../../motor/sistemas/ilicito';
import { leituraRural } from '../../motor/sistemas/rural';
import { escadaMilitar } from '../../motor/sistemas/militar';
import { familiaDaTrilha } from '../../motor/dados/carreiras';
import { eDasForcas } from '../../motor/sistemas/trabalho';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

const VIA: Record<string, string> = {
  sisu: 'SISU — universidade pública', selecao_publica: 'Seleção pública', privada: 'Particular',
  prouni: 'ProUni — bolsa integral', fies: 'FIES — financiamento', ead: 'A distância (EAD)'
};

const NIVEL_CURSO: { id: string; rotulo: string }[] = [
  { id: 'livre', rotulo: 'Aprender um ofício' }, { id: 'tecnico', rotulo: 'Curso técnico' }, { id: 'superior', rotulo: 'Faculdade' },
  { id: 'pos', rotulo: 'Pós-graduação' }, { id: 'residencia', rotulo: 'Pós-graduação' }, { id: 'mestrado', rotulo: 'Pós-graduação' }, { id: 'doutorado', rotulo: 'Pós-graduação' }
];

type Lado = 'estudo' | 'trabalho';

/** Qual lado abre primeiro: o que ocupa a vida agora. */
function ladoInicial(v: Vida): Lado {
  const i = idade(v);
  if (i < 14) return 'estudo';
  if (v.trabalho.atual || v.trabalho.aposentadoria) return 'trabalho';
  if (v.educacao.basica || v.educacao.matricula) return 'estudo';
  return 'trabalho';
}

export function Rumo({ vida, agir }: Props) {
  const i = idade(vida);
  const [lado, setLado] = useState<Lado>(() => ladoInicial(vida));
  const temTrabalho = i >= 14;
  return (
    <div className={`rumo rumo--${lado}`}>
      <Portas vida={vida} agir={agir} />
      {temTrabalho && (
        <div className="lados" role="tablist" aria-label="Estudo ou trabalho">
          {(['estudo', 'trabalho'] as Lado[]).map(l => (
            <button key={l} type="button" role="tab" aria-selected={lado === l} className={`lados__item${lado === l ? ' lados__item--ativo' : ''}`} onClick={() => setLado(l)}>
              {l === 'estudo' ? 'Estudo' : 'Trabalho'}
            </button>
          ))}
        </div>
      )}
      {(lado === 'estudo' || !temTrabalho) ? (
        <div role="tabpanel" aria-label="Estudo" className="rumo__painel">
          <TrajetoriaDeEstudo vida={vida} />
          <Estudo vida={vida} agir={agir} />
          {i >= 15 && <Cursos vida={vida} agir={agir} />}
          {i < 14 && !vida.educacao.basica && <Vazio>Por enquanto, o rumo é crescer.</Vazio>}
        </div>
      ) : (
        <div role="tabpanel" aria-label="Trabalho" className="rumo__painel">
          <Situacao vida={vida} agir={agir} />
          <Escada vida={vida} />
          {!(vida.justica?.prisao?.regime === 'fechado') && <Trabalho vida={vida} agir={agir} />}
          <Devolutivas vida={vida} />
          {!(vida.justica?.prisao?.regime === 'fechado') && <Vagas vida={vida} agir={agir} />}
          {i >= 17 && !vida.justica?.prisao && <Concursos vida={vida} agir={agir} />}
          {(vida.trabalho.historico.length > 0 || vida.caminhos.marcas.length > 0) && <Trajetoria vida={vida} />}
        </div>
      )}
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
    if (x.tema !== 'escola') continue;
    if (/^Terminou o fundamental/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: 'Fundamental completo' });
    else if (/^Concluiu o ensino médio/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: 'Ensino médio completo' });
    else if (/^Largou a escola/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: x.texto.replace(/\.$/, '') });
  }
  for (const c of e.concluidos) passado.push({ ano: anoDe(c.tFim), texto: c.nome });
  passado.sort((a, b) => a.ano - b.ano);
  const b = e.basica;
  const m = e.matricula;
  const agora = b ? `${rotuloSerie(b)}, escola ${b.rede === 'publica' ? 'pública' : 'particular'}` : m ? `${curso(m.cursoId).nome}${m.trancado ? ' (trancado)' : ''}` : i < 4 ? 'Ainda não é hora da escola' : 'Sem estudar agora';
  const detalhe = b && b.etapa !== 'creche' && b.etapa !== 'pre' ? `Notas: ${palavraDesempenho(b.desempenho)}` : m ? `${m.mesesRestantes <= 12 ? 'Último ano' : `Faltam uns ${Math.ceil(m.mesesRestantes / 12)} anos`} · desempenho ${palavraDesempenho(m.desempenho)}` : ROTULO_ESCOLARIDADE[e.escolaridade];
  const { para } = i >= 15 && !m ? cursosParaVoce(vida) : { para: [] };
  const proximo = b ? (b.etapa === 'medio' ? 'Depois do médio: faculdade, técnico, trabalho — ou os três.' : 'Seguir na escola.') : m ? portasDoCurso(vida, m.cursoId) : '';
  return (
    <section className="trajeto" aria-label="Sua trajetória nos estudos">
      <ol className="trajeto__linha">
        {passado.slice(-4).map((x, k) => (
          <li key={k} className="trajeto__passo trajeto__passo--passado"><span className="trajeto__ano">{x.ano}</span><span className="trajeto__texto">{x.texto}</span></li>
        ))}
        <li className="trajeto__passo trajeto__passo--agora" aria-current="step">
          <span className="trajeto__ano">Agora</span>
          <span className="trajeto__texto">{agora}</span>
          <span className="trajeto__detalhe">{detalhe}</span>
        </li>
        {para.length > 0 ? para.map(x => (
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

/* ------------------------------------------------------- Trabalho: escada */

/** Os degraus da estrada atual: onde você esteve, onde está, o que vem. */
function Escada({ vida }: { vida: Vida }) {
  const e = vida.trabalho.atual;
  const oc = e ? ocupacao(e.ocupacaoId) : undefined;
  if (!oc || e?.clientela !== undefined || e?.posAposentadoria) return null;
  if (eDasForcas(oc)) {
    const postos = escadaMilitar(vida);
    if (postos.length < 2) return horizonte(vida) ? <p className="escada__horizonte">{horizonte(vida)}</p> : null;
    return (
      <section className="escada" aria-label="Sua carreira militar">
        <h2 className="escada__titulo">A sua carreira militar</h2>
        <ol className="escada__degraus">
          {[...postos].reverse().map(x => (
            <li key={x.nome} className={`escada__degrau escada__degrau--${x.estado === 'agora' ? 'agora' : x.estado === 'foi' ? 'foi' : 'acima'}`} aria-current={x.estado === 'agora' ? 'step' : undefined}>
              <span className="escada__nome">{x.nome}</span>
              <span className="escada__nota">{x.estado === 'agora' ? 'você está aqui' : x.estado === 'foi' ? 'já foi' : ''}</span>
            </li>
          ))}
        </ol>
        {horizonte(vida) && <p className="escada__horizonte">{horizonte(vida)}</p>}
      </section>
    );
  }
  const degraus = [...new Map(OCUPACOES.filter(x => x.trilha === oc.trilha && !x.concurso && x.contrato !== 'estagio' && x.entrada !== 'negocio' && (x.nivel <= oc.nivel || degrausAcima(oc).some(d => d.id === x.id) || x.nivel === oc.nivel + 2)).sort((a, b) => a.nivel - b.nivel).map(x => [x.nivel, x] as const)).values()];
  if (degraus.length < 2) return null;
  const jaFoi = new Set(vida.trabalho.historico.map(h => h.ocupacaoId));
  return (
    <section className="escada" aria-label={`Sua estrada em ${ROTULO_TRILHA[oc.trilha] ?? oc.trilha}`}>
      <h2 className="escada__titulo">A sua estrada em {ROTULO_TRILHA[oc.trilha] ?? oc.trilha}</h2>
      <ol className="escada__degraus">
        {[...degraus].reverse().map(x => {
          const estado = x.id === oc.id ? 'agora' : x.nivel < oc.nivel ? (jaFoi.has(x.id) ? 'foi' : 'abaixo') : 'acima';
          return (
            <li key={x.id} className={`escada__degrau escada__degrau--${estado}`} aria-current={estado === 'agora' ? 'step' : undefined}>
              <span className="escada__nome">{nomeOcupacao(vida, x)}</span>
              <span className="escada__nota">{estado === 'agora' ? 'você está aqui' : estado === 'foi' ? 'já foi' : estado === 'acima' ? (x.nivel === oc.nivel + 1 ? 'o próximo passo' : 'mais adiante') : ''}</span>
            </li>
          );
        })}
      </ol>
      {horizonte(vida) && <p className="escada__horizonte">{horizonte(vida)}</p>}
    </section>
  );
}

/** O que ficou das últimas tentativas: o que pesou e o que dá para fazer. */
function Devolutivas({ vida }: { vida: Vida }) {
  const lista = vida.caminhos.devolutivas.filter(d => !d.passou && vida.t - d.t <= 36).slice(-3).reverse();
  if (!lista.length) return null;
  return (
    <Secao titulo="O que ficou das últimas tentativas">
      <ul className="devolutivas">
        {lista.map((d, k) => (
          <li key={k} className="devolutiva">
            <span className="devolutiva__ano">{anoDe(d.t)}</span>
            <div>
              <strong>{d.titulo}</strong>
              <p>{d.texto}{d.perto ? ' Ficou perto.' : ''}</p>
              {d.falta && <p className="devolutiva__dica">{O_QUE_TRABALHAR[d.falta]}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

/* ------------------------------------------------------------ Portas */

function Portas({ vida, agir }: Props) {
  const ops = vida.caminhos.oportunidades.filter(o => o.tFim > vida.t);
  if (!ops.length) return null;
  return (
    <Secao titulo="Ao seu alcance agora">
      <p className="dica">Portas que a vida abriu este ano. Elas não esperam para sempre.</p>
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
    </Secao>
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
  // Série, curso, notas e o tempo que falta já estão na trajetória acima; aqui fica o resto.
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
  const [explorar, setExplorar] = useState(false);
  const [todos, setTodos] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  const { para, resto } = useMemo(() => cursosParaVoce(vida), [vida]);
  if (vida.educacao.matricula) return null;
  const restoMostrado = resto.filter(c => todos || c.possivel);
  const grupos = [...new Set(NIVEL_CURSO.map(n => n.rotulo))].map(rotulo => ({ rotulo, lista: restoMostrado.filter(c => NIVEL_CURSO.find(n => n.id === c.curso.nivel)?.rotulo === rotulo) })).filter(g => g.lista.length);
  const item = (c: CursoOpcoes, motivo?: string) => {
    const cc = c.curso;
    const melhores = [...c.opcoes].sort((a, b) => Number(podeTentar(b.o.veredito)) - Number(podeTentar(a.o.veredito)) || (b.o.veredito.chance ?? 0) - (a.o.veredito.chance ?? 0)).slice(0, 4);
    const aberta = aberto === cc.id;
    return (
      <li key={cc.id} className="opcao-curso">
        <button type="button" className="opcao-curso__cabeca" aria-expanded={aberta} onClick={() => setAberto(aberta ? null : cc.id)}>
          <span className="opcao-curso__nome">{cc.nome}</span>
          <span className="opcao-curso__meta">{motivo ? `${motivo} · ` : ''}{cc.meses >= 24 ? `${cc.meses / 12} anos` : `${cc.meses} meses`}{c.possivel ? '' : ' · fora de alcance'}</span>
        </button>
        {aberta && (
          <div className="opcao-curso__corpo">
            <p className="nota">{cc.descricao} {portasDoCurso(vida, cc.id)}</p>
            {melhores.map(({ o, indice }) => (
              <div key={indice} className="via">
                <div className="via__texto">
                  <strong>{VIA[o.via]}</strong>
                  <span>{o.modalidade === 'ead' ? 'de casa' : nomeLugar(o.municipioId)}{o.mensalidade > 0 ? ` · ${dinheiroCurto(o.mensalidade)}/mês` : o.via === 'fies' ? ' · paga depois de formado' : ' · sem mensalidade'}</span>
                  {o.observacao && <span className="via__obs">{o.observacao}</span>}
                </div>
                <BotaoAcao vida={vida} acao={{ tipo: 'matricular', indice }} agir={agir} mostrarChance>Tentar</BotaoAcao>
              </div>
            ))}
          </div>
        )}
      </li>
    );
  };
  return (
    <Secao titulo="Próximos passos">
      {para.length === 0 && <Vazio>Nenhum curso claramente no seu caminho agora. {melhorNotaRecente(vida) === 0 && idade(vida) >= 16 ? 'Uma nota do ENEM abre portas.' : ''}</Vazio>}
      {para.length > 0 && <ul className="lista-opcoes">{para.map(x => item(x.item, x.motivo))}</ul>}
      {resto.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={explorar} onClick={() => setExplorar(x => !x)}>{explorar ? 'Recolher' : `Explorar outros cursos (${resto.filter(c => c.possivel).length})`}</button>
          {explorar && (
            <>
              <button type="button" className="botao botao--discreto" onClick={() => setTodos(t => !t)}>{todos ? 'Só os que estão ao alcance' : 'Incluir os fora de alcance'}</button>
              {grupos.map(g => (
                <div key={g.rotulo} className="grupo-atividades">
                  <h3 className="grupo-atividades__titulo">{g.rotulo}</h3>
                  <ul className="lista-opcoes">{g.lista.map(c => item(c))}</ul>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </Secao>
  );
}

/* ----------------------------------------------------------- Trabalho */

function Trabalho({ vida, agir }: Props) {
  const e = vida.trabalho.atual;
  const t = vida.trabalho;
  const n = vida.caminhos.negocio;
  const esporte = vida.caminhos.esporte;
  const arte = vida.caminhos.arte;
  return (
    <Secao titulo="Trabalho">
      {e ? (
        <>
          <Linha rotulo="O que faz" valor={nomeOcupacao(vida, ocupacao(e.ocupacaoId))} />
          <Linha rotulo="Onde" valor={e.empregador} />
          <Linha rotulo="Ganha" valor={`${dinheiroCurto(e.salario)} bruto · ${dinheiroCurto(liquido(e.salario, e.contrato))} no bolso${e.clientela !== undefined ? ({ sazonal: ' · varia com a safra', projeto: ' · varia com os trabalhos', variavel: ' · varia com a freguesia', estavel: ' · varia com a freguesia' } as const)[familiaDaTrilha(ocupacao(e.ocupacaoId).trilha).renda] : ''}`} />
          <Linha rotulo="Desde" valor={`${anoDe(e.tInicio)}${e.contrato === 'clt' ? ' · carteira assinada' : e.contrato === 'servidor' ? ' · servidor público' : e.contrato === 'militar' ? ' · carreira militar' : e.contrato === 'informal' ? ' · informal' : e.contrato === 'autonomo' ? ' · por conta própria' : e.contrato === 'estagio' ? ' · estágio' : e.contrato === 'temporario' ? ' · temporário' : ' · aprendiz'}`} />
          {e.clientela === undefined && <Linha rotulo="Como vai" valor={palavraDesempenho(e.desempenho)} tom={e.desempenho >= 62 ? 'bom' : e.desempenho < 40 ? 'ruim' : undefined} />}
          <div className="carreira">
            {estradaNaArea(vida) && <p>{estradaNaArea(vida)}</p>}
            {horizonte(vida) && (e.clientela !== undefined || e.posAposentadoria) && <p>{horizonte(vida)}</p>}
            {n && n.estado !== 'fechado' && <p>{n.nome}: {n.estado === 'firme' ? 'firme, com freguesia certa' : n.estado === 'apertado' ? 'no aperto, o movimento está fraco' : 'ainda começando'}.</p>}
            {esporte?.fase === 'profissional' && <p>{esporte.lesoes > 1 ? `${esporte.lesoes} lesões na carreira. ` : ''}O corpo tem prazo: poucas carreiras passam dos 35.</p>}
            {comoSeCresce(vida) && <p className="nota">{comoSeCresce(vida)}</p>}
          </div>
          <div className="grupo-acoes">
            <BotaoAcao vida={vida} acao={{ tipo: 'horas_extras' }} agir={agir} ocultarImpossivel>Fazer horas extras este ano</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'pedir_aumento' }} agir={agir} ocultarImpossivel>Pedir aumento</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'aposentar' }} agir={agir} ocultarImpossivel>{ocupacao(e.ocupacaoId).contrato === 'militar' ? 'Ir para a reserva' : 'Aposentar'}</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'mei' }} agir={agir} ocultarImpossivel>Formalizar como MEI</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'pedir_demissao' }} agir={agir} variante="perigo">{e.clientela !== undefined ? 'Parar com isso' : eDasForcas(ocupacao(e.ocupacaoId)) ? 'Deixar a Força' : 'Pedir demissão'}</BotaoAcao>
          </div>
          <Ritmo vida={vida} agir={agir} />
        </>
      ) : t.aposentadoria ? (
        <Linha rotulo="Aposentadoria" valor={`${dinheiroCurto(t.aposentadoria.beneficio)} por mês, desde ${anoDe(t.aposentadoria.t)}`} />
      ) : (
        <Vazio>{idade(vida) < 16 ? 'Aos 14 e 15, só como jovem aprendiz.' : t.desempregadoDesde !== undefined && vida.t - t.desempregadoDesde >= 12 ? `Sem trabalho desde ${anoDe(t.desempregadoDesde)}.` : 'Sem trabalho no momento.'}</Vazio>
      )}
      {esporte?.fase === 'base' && <p className="nota">Na {esporte.modalidade === 'futebol' ? 'base' : 'equipe'} do {esporte.clube}, desde {anoDe(esporte.tFase)}. Quase ninguém da base vira profissional — e quem vira, vira cedo.</p>}
      {arte?.ativo && <p className="nota">{arte.nome}: {arte.publico < 15 ? 'quase ninguém conhece ainda' : arte.publico < 40 ? 'já tem quem vá ver' : arte.publico < 65 ? 'tem público fiel na cidade' : 'gente de fora já conhece'}.</p>}
      {t.candidaturas.length > 0 && <p className="nota">Concurso em andamento: {t.candidaturas.map(c => nomeOcupacao(vida, ocupacao(c.ocupacaoId))).join(', ')} — resultado no próximo ano.</p>}
      {vida.caminhos.concurso.reserva && <p className="nota">No cadastro reserva para {nomeOcupacao(vida, ocupacao(vida.caminhos.concurso.reserva.ocupacaoId))}, até {anoDe(vida.caminhos.concurso.reserva.tAte)}. Podem chamar.</p>}
      {!e && !t.aposentadoria && idade(vida) >= 60 && <BotaoAcao vida={vida} acao={{ tipo: 'aposentar' }} agir={agir}>Pedir aposentadoria</BotaoAcao>}
    </Secao>
  );
}

function Concursos({ vida, agir }: Props) {
  const editais = editaisAbertos(vida).map(oc => ({ oc, d: elegibilidade(vida, oc) }));
  const possiveis = editais.filter(x => podeTentar(x.d));
  const estudando = vida.rotinas.some(r => r.id === 'estudar_concurso');
  if (!possiveis.length && !estudando && vida.caminhos.concurso.tentativas === 0) return null;
  return (
    <Secao titulo="Concursos" recolhivel aberta={estudando || possiveis.length > 0 && !vida.trabalho.atual}>
      <p className="dica">{estudando ? `Você estuda para concurso${vida.caminhos.concurso.meses >= 12 ? ` — o equivalente a ${Math.round(vida.caminhos.concurso.meses / 12)} ${Math.round(vida.caminhos.concurso.meses / 12) === 1 ? 'ano' : 'anos'} de estudo firme` : ''}.` : 'Concurso pede preparo: sem estudo, é quase loteria. O estudo entra em Tempo livre.'}</p>
      {possiveis.length === 0 && <Vazio>Nenhum edital aberto que caiba no seu perfil este ano.</Vazio>}
      <ul className="lista-vagas">
        {possiveis.map(({ oc }) => (
          <li key={oc.id} className="vaga">
            <div className="vaga__texto"><strong>{nomeOcupacao(vida, oc)}</strong><span>{leituraDoPreparo(vida, oc)}</span></div>
            <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance>Inscrever-se</BotaoAcao>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

/* ------------------------------------------------------ Procurar trabalho */

function Vagas({ vida, agir }: Props) {
  const [explorar, setExplorar] = useState(false);
  const [bloqueadas, setBloqueadas] = useState(false);
  const atual = vida.trabalho.atual?.ocupacaoId;
  const { para, resto } = vagasParaVoce(vida);
  const areas = new Set(vida.educacao.concluidos.map(c => c.area));
  const minhaArea = (oc: Ocupacao) => (vida.trabalho.experiencia[oc.trilha] ?? 0) >= 12 || !!oc.area?.some(a => areas.has(a)) || !!oc.habilidade;
  // Fora de alcance: só o que está perto do caminho (próximo degrau, a sua formação, o seu ofício).
  const perto = new Set<string>();
  if (atual) for (const x of degrausAcima(ocupacao(atual))) perto.add(x.id);
  const todas = OCUPACOES.filter(oc => !oc.concurso && oc.id !== atual);
  for (const oc of todas) if (minhaArea(oc) && oc.nivel >= 2) perto.add(oc.id);
  const fora = todas.map(oc => ({ oc, d: elegibilidade(vida, oc) })).filter(x => !podeTentar(x.d) && x.d.grau !== 'ilegal' && x.d.grau !== 'impossivel' && perto.has(x.oc.id) && !/currículo|oportunidade|peneira|carreira militar|negócio/.test(x.d.motivo ?? '')).slice(0, 8);
  const negocios = negociosPossiveis(vida).filter(n => podeTentar(n.veredito) || /R\$/.test(n.veredito.motivo ?? ''));
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('candidatura:')).length;
  const porSetor = [...new Set(resto.map(x => x.oc.setor))].map(setor => ({ setor, lista: resto.filter(x => x.oc.setor === setor).sort((a, b) => a.oc.nivel - b.oc.nivel || b.oc.salario - a.oc.salario) }));
  const linha = ({ oc }: { oc: Ocupacao }, motivo?: string) => (
    <li key={oc.id} className="vaga">
      <div className="vaga__texto"><strong>{nomeOcupacao(vida, oc)}</strong>{motivo && <span className="vaga__motivo">{motivo}</span>}<span>{ROTULO_SETOR[oc.setor]}{oc.experiencia ? ' · pede estrada' : oc.nivel <= 1 ? ' · para começar' : ''} · a partir de {dinheiroCurto(oc.salario)}{oc.jornada === 'fora' ? ' · dias fora de casa' : oc.jornada === 'longa' ? ' · jornada longa' : ''}</span></div>
      <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance={!porContaPropria(oc)}>{porContaPropria(oc) ? 'Começar por conta' : 'Candidatar-se'}</BotaoAcao>
    </li>
  );
  if (idade(vida) < 14) return null;
  return (
    <Secao titulo={vida.trabalho.atual ? 'Outros caminhos' : 'Procurar trabalho'}>
      <p className="dica">Candidatar-se leva a uma entrevista de duas ou três perguntas. Até três processos por ano ({Math.max(0, 3 - usadas)} restantes). Trabalhar por conta não passa por entrevista: a freguesia é que decide.</p>
      {para.length === 0 && resto.length === 0 && <Vazio>Nenhuma vaga ao seu alcance agora.</Vazio>}
      {para.length > 0 && <ul className="lista-vagas lista-vagas--sugestoes">{para.map(x => linha(x.item, x.motivo))}</ul>}
      {negocios.length > 0 && (
        <div className="grupo-atividades">
          <h3 className="grupo-atividades__titulo">Abrir um negócio</h3>
          <ul className="lista-vagas">
            {negocios.map(n => (
              <li key={n.t.id} className="vaga">
                <div className="vaga__texto"><strong>Abrir {n.t.nome}</strong><span>uns {dinheiroCurto(n.custo)} para começar</span></div>
                <BotaoAcao vida={vida} acao={{ tipo: 'abrir_negocio', negocio: n.t.id }} agir={agir}>Abrir</BotaoAcao>
              </li>
            ))}
          </ul>
        </div>
      )}
      {resto.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={explorar} onClick={() => setExplorar(x => !x)}>{explorar ? 'Recolher' : `Explorar outras vagas (${resto.length})`}</button>
          {explorar && porSetor.map(g => (
            <div key={g.setor} className="grupo-atividades">
              <h3 className="grupo-atividades__titulo">{ROTULO_SETOR[g.setor]}</h3>
              <ul className="lista-vagas">{g.lista.map(x => linha(x))}</ul>
            </div>
          ))}
        </div>
      )}
      {fora.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={bloqueadas} onClick={() => setBloqueadas(x => !x)}>{bloqueadas ? 'Esconder' : 'Ver'} o próximo passo e o que falta ({fora.length})</button>
          {bloqueadas && (
            <ul className="lista-vagas lista-vagas--bloqueadas">
              {fora.map(({ oc, d }) => (
                <li key={oc.id} className="vaga vaga--bloqueada">
                  <div className="vaga__texto"><strong>{nomeOcupacao(vida, oc)}</strong><span>{d.motivo}</span></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Secao>
  );
}

/* ---------------------------------------------------------- Trajetória */

function Trajetoria({ vida }: { vida: Vida }) {
  const t = vida.trabalho;
  const trilhas = Object.entries(t.experiencia).filter(([, m]) => m >= 12).sort((a, b) => b[1] - a[1]);
  const marcos = vida.caminhos.marcas.filter(m => m.peso === 3).slice(-8);
  return (
    <Secao titulo="Por onde você passou" recolhivel aberta={false}>
      {marcos.length > 0 && (
        <ul className="marcos-caminho">
          {marcos.map((m, k) => <li key={k}><span className="marcos-caminho__ano">{anoDe(m.t)}</span><span>{m.texto}</span></li>)}
        </ul>
      )}
      {vida.educacao.concluidos.map(c => <Linha key={c.cursoId + c.tFim} rotulo={String(anoDe(c.tFim))} valor={c.nome} />)}
      {t.historico.slice().reverse().slice(0, 12).map((h, k) => <Linha key={k} rotulo={`${anoDe(h.tInicio)}–${anoDe(h.tFim)}`} valor={`${nomeOcupacao(vida, ocupacao(h.ocupacaoId))}, ${h.empregador}`} />)}
      {trilhas.length > 0 && <p className="nota">Estrada: {trilhas.map(([tr, m]) => `${Math.floor(m / 12)} ${Math.floor(m / 12) === 1 ? 'ano' : 'anos'} em ${ROTULO_TRILHA[tr] ?? tr}`).join(' · ')}.</p>}
      <p className="nota">INSS: {Math.floor(t.contribuicao / 12)} anos de contribuição.{t.licencas.length ? ` Registros: ${t.licencas.map(l => l.toUpperCase()).join(', ')}.` : ''}</p>
    </Secao>
  );
}

/* ------------------------------------------------------------- Situação */

/** O que está acontecendo com a vida de trabalho agora, quando não é "um emprego": pena, pausa, campo, por fora. */
function Situacao({ vida, agir }: Props) {
  const justica = situacaoNaJustica(vida);
  const pausa = leituraDaPausa(vida);
  const fora = leituraDoEnvolvimento(vida);
  const campo = leituraRural(vida);
  if (!justica && !pausa && !fora && !campo) return null;
  const pa = vida.trabalho.pausa;
  return (
    <Secao titulo={vida.justica?.prisao ? 'Cumprindo pena' : pa ? 'Cuidando' : 'Agora'}>
      {justica && <p>{justica}</p>}
      {pausa && <p>{pausa}</p>}
      {campo && <p>{campo}</p>}
      {fora && <p className="nota">{fora}</p>}
      <div className="grupo-acoes">
        {pa && <BotaoAcao vida={vida} acao={{ tipo: 'voltar_mercado' }} agir={agir}>{pa.intensidade === 'parcial' ? 'Voltar à jornada inteira' : 'Voltar ao mercado'}</BotaoAcao>}
        {pa?.intensidade === 'total' && <BotaoAcao vida={vida} acao={{ tipo: 'facultativo', ativo: !pa.facultativo }} agir={agir} variante="discreto">{pa.facultativo ? 'Parar de pagar o INSS facultativo' : 'Pagar o INSS como facultativo'}</BotaoAcao>}
        {fora && <BotaoAcao vida={vida} acao={{ tipo: 'parar_por_fora' }} agir={agir}>Largar isso de vez</BotaoAcao>}
      </div>
    </Secao>
  );
}

/** Reduzir ou parar para cuidar da casa e da família: recolhido, porque não é decisão de todo ano. */
function Ritmo({ vida, agir }: Props) {
  const [aberto, setAberto] = useState(false);
  const reduzir = podeTentar(disponibilidadeRitmo(vida, 'parcial'));
  const parar = podeTentar(disponibilidadeRitmo(vida, 'total'));
  if (!reduzir && !parar) return null;
  return (
    <div className="explorar">
      <button type="button" className="botao botao--discreto" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Recolher' : 'Mudar o ritmo do trabalho'}</button>
      {aberto && (
        <div className="grupo-acoes">
          <p className="dica">Para cuidar da casa, dos filhos ou de alguém da família. Menos renda; o tempo de INSS também sente.</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'cuidar_da_casa', intensidade: 'parcial' }} agir={agir} ocultarImpossivel>Reduzir a jornada</BotaoAcao>
          <BotaoAcao vida={vida} acao={{ tipo: 'cuidar_da_casa', intensidade: 'total' }} agir={agir} ocultarImpossivel variante="discreto">Parar de trabalhar por um tempo</BotaoAcao>
        </div>
      )}
    </div>
  );
}

const disponibilidadeRitmo = (v: Vida, intensidade: 'parcial' | 'total') => disponibilidade(v, { tipo: 'cuidar_da_casa', intensidade });

/** Como se cresce nesse tipo de trabalho, em palavras (identidade da família de carreira). */
function comoSeCresce(v: Vida): string | undefined {
  const e = v.trabalho.atual;
  if (!e || e.posAposentadoria) return undefined;
  const f = familiaDaTrilha(ocupacao(e.ocupacaoId).trilha);
  if (!f.degraus.length || f.progressao === 'empresa' || f.progressao === 'militar') return undefined;
  const renda = f.renda === 'variavel' ? ' A renda varia com a freguesia.' : f.renda === 'sazonal' ? ' A renda vem da safra, não do mês.' : f.renda === 'projeto' ? ' A renda vem por projeto: há anos bons e anos magros.' : '';
  return `Nesse caminho, cresce-se assim: ${f.degraus.join(' → ')}.${renda}`;
}
