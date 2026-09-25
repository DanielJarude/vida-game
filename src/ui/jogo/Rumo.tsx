/**
 * Rumo: o que está se abrindo na vida.
 *
 * Com o Trabalho ganhando área própria, o Rumo ficou com o que é FUTURO:
 * a formação (o que já ficou para trás, onde se está, as portas seguintes),
 * as portas que a vida abriu e não são de emprego (bolsa, peneira, banda,
 * seleção do instituto), e as mudanças de caminho que não cabem num cargo
 * (voltar a estudar, a vida política). O catálogo inteiro de cursos fica
 * em "explorar".
 */

import { useMemo, useState } from 'react';
import type { Oportunidade, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { curso, cursoOuNulo } from '../../motor/dados/cursos';
import { OCUPACOES } from '../../motor/dados/ocupacoes';
import { nomeLugar } from '../../motor/dados/lugares';
import { nomeOcupacao } from '../../motor/sistemas/trabalho';
import { melhorNotaRecente, rotuloSerie, ROTULO_ESCOLARIDADE, temCota, NOME_MATERIA } from '../../motor/sistemas/escola';
import { materiasExtremas } from '../../motor/sistemas/frentes';
import { podeTentar } from '../../motor/plausibilidade';
import { anoDe } from '../../motor/tempo';
import { BotaoAcao, Escolha, Folio, Linha, Secao, Vazio } from '../comum';
import { cursosParaVoce, type CursoOpcoes } from '../../motor/sistemas/relevancia';
import { dinheiroCurto, palavraDesempenho } from '../apresentar';
import { naPolitica, portasDaPolitica, leituraPolitica } from '../../motor/sistemas/politica';
import type { Aba } from '../telas/Jogo';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }

const VIA: Record<string, string> = {
  sisu: 'SISU — universidade pública', selecao_publica: 'Seleção pública', privada: 'Particular',
  prouni: 'ProUni — bolsa integral', fies: 'FIES — financiamento', ead: 'A distância (EAD)'
};

const NIVEL_CURSO: { id: string; rotulo: string }[] = [
  { id: 'livre', rotulo: 'Aprender um ofício' }, { id: 'tecnico', rotulo: 'Curso técnico' }, { id: 'superior', rotulo: 'Faculdade' },
  { id: 'pos', rotulo: 'Pós-graduação' }, { id: 'residencia', rotulo: 'Pós-graduação' }, { id: 'mestrado', rotulo: 'Pós-graduação' }, { id: 'doutorado', rotulo: 'Pós-graduação' }
];

const PORTAS_DE_TRABALHO = new Set(['vaga', 'indicacao', 'aprendiz', 'estagio', 'temporario', 'proposta', 'reinsercao', 'clientela', 'funcao', 'atualizacao']);
/** A porta é de trabalho (vai para a área Trabalho) ou de rumo (estudo, esporte, arte)? */
export function ehPortaDeTrabalho(o: Oportunidade): boolean {
  if (PORTAS_DE_TRABALHO.has(o.tipo)) return true;
  if (o.tipo === 'convite' && o.ocupacaoId) return true;
  if (o.tipo === 'bolsa' && o.ocupacaoId) return true;
  return false;
}

export function Rumo({ vida, agir, irPara }: Props) {
  const i = idade(vida);
  const e = vida.educacao;
  const titulo = e.basica ? rotuloSerie(e.basica) : e.matricula ? curso(e.matricula.cursoId).nome : i < 4 ? 'Ainda não é hora da escola' : i >= 18 ? 'O que se abre agora' : 'Sem estudar agora';
  const lede = e.basica ? `Escola ${e.basica.rede === 'publica' ? 'pública' : 'particular'} · notas ${palavraDesempenho(e.basica.desempenho)}` : e.matricula ? `${e.matricula.instituicao} · ${e.matricula.mesesRestantes <= 12 ? 'último ano' : `faltam uns ${Math.ceil(e.matricula.mesesRestantes / 12)} anos`}` : ROTULO_ESCOLARIDADE[e.escolaridade];
  return (
    <div className="rumo">
      <Folio kicker={<><span className="folio__area">Rumo</span> · o que está se abrindo</>} titulo={titulo} lede={lede} />
      <PortasAbertas vida={vida} agir={agir} filtro={o => !ehPortaDeTrabalho(o) || i < 14} titulo="Ao seu alcance agora" />
      <TrajetoriaDeEstudo vida={vida} />
      <Estudo vida={vida} agir={agir} />
      {i >= 15 && <Cursos vida={vida} agir={agir} />}
      {i < 14 && !vida.educacao.basica && <Vazio>Por enquanto, o rumo é crescer.</Vazio>}
      {i >= 16 && <Caminhos vida={vida} agir={agir} irPara={irPara} />}
    </div>
  );
}

/** Mudanças de caminho que não são um cargo: a vida política, por exemplo. */
function Caminhos({ vida, agir, irPara }: Props) {
  const lp = leituraPolitica(vida);
  const dentro = naPolitica(vida);
  const portas = portasDaPolitica(vida);
  return (
    <Secao titulo="Outros caminhos">
      <div className="caminho-politico">
        <p className="caminho-politico__texto">{dentro && lp ? `A vida política: ${lp.titulo.toLowerCase()}. ${lp.horizonte ?? ''}` : portas.length ? 'A vida que você leva já puxa gente para perto: associação, causa, nome conhecido. A política é uma porta possível.' : 'A vida política começa perto: a associação do bairro, uma causa, um partido da cidade.'}</p>
        {dentro ? <button type="button" className="botao botao--discreto" onClick={() => irPara?.('trabalho')}>Ver a vida política →</button>
          : <BotaoAcao vida={vida} acao={{ tipo: 'politica', oque: 'aproximar' }} agir={agir} variante="secundario" ocultarBloqueado>{lp ? 'Voltar à vida política' : 'Aproximar-se da vida política'}</BotaoAcao>}
      </div>
    </Secao>
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

