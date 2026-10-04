/**
 * Formação: a formação, inteira, num lugar só — e o lugar onde ela acontece
 * (a escola, o instituto federal, a universidade), com gente e atividades.
 *
 * Antes se chamava "Rumo" — e ninguém sabia o que era. Aqui se responde de
 * imediato: onde eu estudo agora (escola, faculdade, curso), o que já ficou
 * para trás, por onde dá para seguir, e onde procuro uma formação nova. O
 * catálogo de cursos é grande (isso é bom) e se explora por área, nível,
 * busca e pelo que faz sentido para esta vida.
 */

import { verbosDaFormacao } from '../../motor/sistemas/naFormacao';
import { noPais } from '../../motor/mundo/registro';
import { useMemo } from 'react';
import type { Oportunidade, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { curso, cursoOuNulo, type AreaFormacao } from '../../motor/dados/cursos';
import { OCUPACOES, ocupacaoOuNula } from '../../motor/dados/ocupacoes';
import { nomeLugar } from '../../motor/dados/lugares';
import { consequenciasDaMudanca } from '../../motor/sistemas/processos';
import { nomeOcupacao, porContaPropria } from '../../motor/sistemas/trabalho';
import { areaDaPos, melhorNotaRecente, nomeDaFormacao, nomeDaMatricula, notasDaqui, rotuloEscolaridade, rotuloSerie, temCota, NOME_MATERIA } from '../../motor/sistemas/escola';
import { educacaoDaVida, perfilDaVida } from '../../motor/mundo/vida';
import { textoLocal } from '../../motor/mundo/locais';
import { materiasExtremas } from '../../motor/sistemas/frentes';
import { podeTentar } from '../../motor/plausibilidade';
import { anoDe } from '../../motor/tempo';
import { BotaoAcao, Escolha, Folio, Linha, Secao } from '../comum';
import { alvosDoEnem, cursosAgrupados, cursosParaVoce, pontuarCursos } from '../../motor/sistemas/relevancia';
import { dinheiroCurto, palavraDesempenho } from '../apresentar';
import { Catalogo, type ItemCatalogo } from './Catalogo';
import type { Aba } from '../navegacao';
import { analisarEntrada } from '../../motor/sistemas/compromissos';
import { custoDoEstudo } from '../../motor/sistemas/custoDoEstudo';
import { historiaDaFormacao } from '../../motor/sistemas/vidaEstudantil';
import { novaMatricula } from '../../motor/sistemas/escola';
import { descricaoDaRotina, modeloRotina, nivelDa, nivelModelo } from '../../motor/sistemas/rotinas';
import { NOME_FOCO } from '../../motor/sistemas/concurso';
import type { FocoConcurso } from '../../motor/tipos';
import { instituicaoAtual, leituraDasVivencias, pessoasDaFormacao, ROTINA_DA_OFERTA, VIVENCIA_DA_ROTINA } from '../../motor/sistemas/formacao';
import { estadoDoArco } from '../../motor/sistemas/arcos';
import { flex } from '../../motor/texto';
import { estimativaParaCurso, fazCursinho, mesesDePreparo, objetivoCurso, PALAVRA_SITUACAO, proximoPassoVestibular } from '../../motor/sistemas/vestibular';
import { objetivosAtivos } from '../../motor/sistemas/objetivos';
import { oportunidadesAbertas } from '../../motor/sistemas/mercados';
import type { Objetivo } from '../../motor/tipos';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; abrirPessoa?: (id: string) => void }

/** O rótulo de cada via: as públicas (vagas, bolsa, crédito) com os nomes do país onde se mora (`educacaoDaVida`). */
function rotuloDaVia(vida: Vida, via: string): string {
  const ed = educacaoDaVida(vida);
  return via === 'sisu' ? ed.via.sisu : via === 'prouni' ? ed.via.prouni : via === 'fies' ? ed.via.fies : ({ selecao_publica: 'Seleção pública', privada: 'Particular', ead: 'A distância (EAD)' } as Record<string, string>)[via] ?? via;
}
/** A etapa concluída, como a biografia a registrou (com o nome do país onde foi): "Terminou o fundamental e começou..." → "Fundamental completo". */
function etapaConcluida(texto: string): string | undefined {
  const m = /^Terminou (o|a) (.+?) e começou/.exec(texto) ?? /^Concluiu (o|a) (.+?)( —| n[oa] | em |,|\.|$)/.exec(texto);
  return m ? `${m[2].charAt(0).toUpperCase()}${m[2].slice(1)} ${m[1] === 'a' ? 'completa' : 'completo'}` : undefined;
}

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

export function Estudos({ vida, agir, irPara, abrirPessoa }: Props) {
  const i = idade(vida);
  const e = vida.educacao;
  const inst = instituicaoAtual(vida);
  const titulo = e.basica ? rotuloSerie(e.basica) : e.matricula ? nomeDaMatricula(vida, e.matricula) : i < 4 ? 'Ainda não é hora da escola' : i >= 18 ? 'Estudar de novo, ou pela primeira vez' : 'Sem estudar agora';
  const lede = e.basica ? `Escola ${e.basica.rede === 'publica' ? 'pública' : 'particular'} · notas ${palavraDesempenho(e.basica.desempenho)}` : e.matricula ? `${e.matricula.instituicao}${e.matricula.trancado ? ' · trancado' : ` · ${e.matricula.mesesRestantes <= 12 ? 'último ano' : `faltam uns ${Math.ceil(e.matricula.mesesRestantes / 12)} anos`}`}` : rotuloEscolaridade(vida, e.escolaridade);
  return (
    <div className="estudos rumo">
      <Folio kicker={<><span className="folio__area">Formação</span> · {inst ? inst.rotulo : i < 4 ? 'ainda não' : 'caminhos possíveis'}</>} titulo={titulo} lede={lede} />
      <PortasAbertas vida={vida} agir={agir} filtro={o => areaDaPorta(o) === 'estudos'} titulo="Ao seu alcance agora" />
      {inst && <OLugar vida={vida} agir={agir} abrirPessoa={abrirPessoa} irPara={irPara} />}
      {inst && <NoAnoLetivo vida={vida} agir={agir} />}
      <OQueFicou vida={vida} />
      <TrajetoriaDeEstudo vida={vida} />
      <Formacao vida={vida} />
      <Estudo vida={vida} agir={agir} />
      {i >= 14 && <Preparacao vida={vida} agir={agir} irPara={irPara} />}
      <ObjetivosEmCurso vida={vida} agir={agir} filtro={o => /^(selecao|vestibular):/.test(o.id)} />
      {i >= 15 && <Cursos vida={vida} agir={agir} />}
      {i < 14 && !vida.educacao.basica && <p className="vazio">Por enquanto, o estudo é crescer.</p>}
    </div>
  );
}

/* ------------------------------------------------------ O lugar (REWORK 3) */

/**
 * A instituição como ambiente: como ela é, quem está lá (a professora que
 * reparou, os colegas), e o que dá para fazer ali — atividades de verdade,
 * que ocupam a semana (a mesma rotina que Tempo livre conta) e deixam
 * vivências que pesam depois (`formacao`).
 */
function OLugar({ vida, agir, abrirPessoa, irPara }: { vida: Vida; agir: (a: Acao) => boolean; abrirPessoa?: (id: string) => void; irPara?: (a: Aba) => void }) {
  const inst = instituicaoAtual(vida)!;
  const gente = pessoasDaFormacao(vida);
  const profs = gente.filter(x => x.papel === 'professor' || x.papel === 'orientador');
  const amigos = gente.filter(x => x.papel === 'amigo').length;
  const colegas = gente.filter(x => x.papel === 'colega').length;
  const atividades = inst.ofertas.map(o => ROTINA_DA_OFERTA[o]).filter((id): id is string => !!id).map(id => modeloRotina(id)).filter((m): m is NonNullable<ReturnType<typeof modeloRotina>> => !!m);
  const i = idade(vida);
  return (
    <section className="o-lugar" aria-labelledby="o-lugar-titulo">
      <h2 id="o-lugar-titulo" className="secao-fio">{inst.nome}</h2>
      <p className="o-lugar__descricao">{inst.descricao}</p>
      {(profs.length > 0 || colegas + amigos > 0) && (
        <ul className="o-lugar__gente">
          {profs.map(x => <li key={x.p.id}><button type="button" className="link" onClick={() => abrirPessoa?.(x.p.id)}>{x.p.nome}</button> — {x.papel === 'orientador' ? flex(x.p.genero, 'orienta você', 'orienta você') : x.p.ocupacao ?? 'professor'}</li>)}
          {colegas + amigos > 0 && <li>{colegas > 0 ? `${colegas} ${colegas === 1 ? 'colega' : 'colegas'} de convívio` : ''}{colegas > 0 && amigos > 0 ? ' e ' : ''}{amigos > 0 ? `${amigos} ${amigos === 1 ? 'amizade' : 'amizades'} daqui` : ''} <span className="nota">— conviver não é ser amigo: a amizade pede gesto, em Pessoas.</span></li>}
        </ul>
      )}
      {i >= 7 && atividades.length > 0 && (
        <>
          <h3 className="subtitulo">O que dá para fazer aqui</h3>
          <ul className="o-lugar__atividades">
            {atividades.map(m => {
              const faz = vida.rotinas.some(r => r.id === m.id);
              // A história interna da atividade: a etapa, o papel, o último marco (`arcos`).
              const viv = faz ? (vida.educacao.vivencias ?? []).find(x => x.tipo === VIVENCIA_DA_ROTINA[m.id] && x.tFim === undefined) : undefined;
              const estado = estadoDoArco(m.id, viv);
              const ultimo = viv?.marcos?.[viv.marcos.length - 1];
              return (
                <li key={m.id} className={`atividade-formacao${faz ? ' atividade-formacao--ativa' : ''}`}>
                  <div className="atividade-formacao__texto"><strong>{m.nome}</strong><span>{estado ? `Agora: ${estado}.` : descricaoDaRotina(vida, m)}</span>{ultimo && <span className="nota">{anoDe(ultimo.t)} · {ultimo.texto}</span>}</div>
                  {faz
                    ? <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: m.id, ativa: false }} agir={agir} variante="discreto">Parar</BotaoAcao>
                    : <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: m.id, ativa: true, nivel: 1 }} agir={agir} variante="secundario">Entrar</BotaoAcao>}
                </li>
              );
            })}
          </ul>
          <p className="nota">Cada atividade ocupa parte da semana (veja em <button type="button" className="link" onClick={() => irPara?.('tempo')}>Tempo livre</button>).</p>
        </>
      )}
    </section>
  );
}

/**
 * FIX pós-REWORK 4: os verbos do ano letivo (`naFormacao`) — estudar para as provas, pedir ajuda ao professor, a festa,
 * o trabalho em grupo, matar aula, colar; na faculdade, o projeto com um professor e o congresso. Uma vez por ano cada.
 */
function NoAnoLetivo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const verbos = verbosDaFormacao(vida);
  if (!verbos.length) return null;
  return (
    <Secao titulo="Neste ano letivo">
      <ul className="dia-a-dia__lista">
        {verbos.map(x => (
          <li key={x.oque} className="dia-a-dia__item">
            <BotaoAcao vida={vida} acao={{ tipo: 'formacao', oque: x.oque }} agir={agir} variante={x.risco ? 'discreto' : 'secundario'}>{x.rotulo}</BotaoAcao>
            <span className="dia-a-dia__porque">{x.porque}</span>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

/** O que a formação deixou (e continua valendo): vivências, com o que deu certo — e a história de dentro (REWORK 4). */
function OQueFicou({ vida }: { vida: Vida }) {
  const xs = leituraDasVivencias(vida);
  const historia = historiaDaFormacao(vida);
  if (!xs.length && !historia.length) return null;
  return (
    <>
      {xs.length > 0 && (
        <Secao titulo="O que ficou da formação">
          <ul className="formacao-lista">{xs.map((x, k) => <li key={k}><span className="formacao-lista__nome">{x}</span></li>)}</ul>
          <p className="nota">Isso pesa em portas futuras: uma seleção, um estágio, uma vaga, um mestrado.</p>
        </Secao>
      )}
      {historia.length > 0 && (
        <Secao titulo="Sua história na formação" recolhivel aberta={idade(vida) < 30}>
          {historia.slice().reverse().map((h, k) => (
            <div key={k} className="historia-formacao">
              <p className="historia-formacao__lugar">{h.instituicao.charAt(0).toUpperCase() + h.instituicao.slice(1)} <span>{anoDe(h.de)}{anoDe(h.ate) !== anoDe(h.de) ? `–${anoDe(h.ate)}` : ''}</span></p>
              <ul>{h.momentos.map((m, j) => <li key={j} className={`historia-formacao__momento historia-formacao__momento--${m.tipo}`}><span className="historia-formacao__ano">{m.idade} anos</span> {m.texto}</li>)}</ul>
            </div>
          ))}
        </Secao>
      )}
    </>
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
    const etapa = x.tema === 'escola' ? etapaConcluida(x.texto) : undefined;
    if (etapa) passado.push({ ano: anoDe(x.t), texto: etapa });
    else if (/^Largou a escola/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: x.texto.replace(/\.$/, '') });
    else if (/^Trancou /.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: x.texto.replace(/\.$/, '') });
    else if (/^Abandonou o curso/.test(x.texto)) passado.push({ ano: anoDe(x.t), texto: x.texto.replace(/\.$/, '') });
  }
  for (const c of e.concluidos) passado.push({ ano: anoDe(c.tFim), texto: c.nome });
  // O histórico por país: onde estudou antes de mudar de país (e até onde), nos nomes daquele sistema.
  for (const h of e.historicoEscolar ?? []) {
    const ate = h.etapa && h.serie !== undefined ? `, até ${h.etapa === 'creche' ? 'a creche' : h.etapa === 'pre' ? 'a pré-escola' : `${h.etapa === 'medio' ? 'a' : 'o'} ${rotuloSerie({ etapa: h.etapa, serie: h.serie, rede: 'publica', desempenho: 50, reprovacoes: 0 }, h.pais)}`}` : '';
    passado.push({ ano: anoDe(h.ate), texto: `Estudou ${noPais(h.pais)}${ate}` });
  }
  passado.sort((a, b) => a.ano - b.ano);
  const b = e.basica;
  const m = e.matricula;
  const agora = b ? `${rotuloSerie(b)}, escola ${b.rede === 'publica' ? 'pública' : 'particular'}` : m ? `${nomeDaMatricula(vida, m)}${m.trancado ? ' (trancado)' : ''}` : i < 4 ? 'Ainda não é hora da escola' : 'Sem estudar agora';
  const detalhe = b && b.etapa !== 'creche' && b.etapa !== 'pre' ? `Notas: ${palavraDesempenho(b.desempenho)}` : m ? (m.trancado ? `Trancado desde ${anoDe(m.tTrancou ?? vida.t)}: a vaga espera até ${anoDe((m.tTrancou ?? vida.t) + 48)}` : `${m.mesesRestantes <= 12 ? 'Último ano' : `Faltam uns ${Math.ceil(m.mesesRestantes / 12)} anos`} · desempenho ${palavraDesempenho(m.desempenho)}`) : rotuloEscolaridade(vida, e.escolaridade);
  const { para } = i >= 15 && !m ? cursosParaVoce(vida) : { para: [] };
  const proximo = b ? (b.etapa === 'medio' ? `Depois ${educacaoDaVida(vida).medio.do}: faculdade, técnico, trabalho — ou os três.` : 'Seguir na escola.') : m ? portasDoCurso(vida, m.cursoId) : '';
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

/** O botão diz o que aceitar significa: entrevista, começar por conta, o teste, a prova. */
function rotuloDaPorta(o: Oportunidade): string {
  if (o.tipo === 'peneira') return 'Ir à peneira';
  if (o.tipo === 'seletiva') return 'Ir à seletiva';
  if (o.tipo === 'selecao_tecnico') return 'Fazer a prova';
  if (o.tipo === 'retomar') return 'Voltar a fazer';
  const oc = o.ocupacaoId ? ocupacaoOuNula(o.ocupacaoId) : undefined;
  if (oc && ['aprendiz', 'estagio', 'indicacao', 'vaga', 'proposta', 'reinsercao'].includes(o.tipo)) return porContaPropria(oc) ? 'Começar por conta própria' : 'Ir à entrevista';
  return 'Aceitar';
}

/** As portas que a vida abriu (filtradas pela área que as mostra). Elas não esperam para sempre. */
export function PortasAbertas({ vida, agir, filtro, titulo }: { vida: Vida; agir: (a: Acao) => boolean; filtro: (o: Oportunidade) => boolean; titulo: string }) {
  const ops = oportunidadesAbertas(vida).filter(filtro);
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
              <BotaoAcao vida={vida} acao={{ tipo: 'oportunidade', id: o.id, aceitar: true }} agir={agir} variante="principal">{rotuloDaPorta(o)}</BotaoAcao>
              <BotaoAcao vida={vida} acao={{ tipo: 'oportunidade', id: o.id, aceitar: false }} agir={agir} variante="discreto">Deixar passar</BotaoAcao>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ Formação */

const NIVEL_CREDENCIAL: Record<string, string> = { livre: 'qualificação', tecnico: 'técnico', superior: 'graduação', pos: 'especialização (pós)', residencia: 'residência', mestrado: 'mestrado', doutorado: 'doutorado' };

/** As credenciais formais: o que já é seu (com a área que cada uma carrega). */
function Formacao({ vida }: { vida: Vida }) {
  const lista = [...vida.educacao.concluidos].sort((a, b) => b.tFim - a.tFim);
  if (!lista.length) return null;
  return (
    <Secao titulo="Sua formação">
      <ul className="formacao-lista">
        {lista.map((c, k) => (
          <li key={k}><span className="formacao-lista__ano">{anoDe(c.tFim)}</span><span className="formacao-lista__nome">{c.nome}<span className="formacao-lista__nivel">{NIVEL_CREDENCIAL[c.nivel] ?? c.nivel} · {c.instituicao}</span></span></li>
        ))}
      </ul>
    </Secao>
  );
}

const situacaoDaNota = (vida: Vida, s: string): string => ({ acima: 'a nota alcança o corte', perto: 'perto do corte (lista de espera)', longe: 'ainda longe do corte' } as Record<string, string>)[s] ?? `sem nota ${educacaoDaVida(vida).do} ainda`;

/**
 * O que você vem tentando: os objetivos que as próprias tentativas formaram
 * (o mestrado, a peneira, o concurso) — quantas vezes, o que pesou por último
 * (a causa real, da conta do motor) e, quando é controlável, a ação que mexe
 * nisso. Não é lista de tarefas: some quando se alcança ou se deixa de tentar.
 */
export function ObjetivosEmCurso({ vida, agir, filtro }: { vida: Vida; agir: (a: Acao) => boolean; filtro?: (o: Objetivo) => boolean }) {
  const lista = objetivosAtivos(vida).filter(o => o.tentativas >= 1 && o.resultado === 'nao_passou' && (!filtro || filtro(o)));
  if (!lista.length) return null;
  const acaoDe = (o: Objetivo): { acao: Acao; rotulo: string } | undefined => {
    if (o.id === 'selecao:residencia') return { acao: { tipo: 'perseguir', oque: 'preparar_residencia' } as unknown as Acao, rotulo: 'Um ano de estudo para a prova de residência' };
    if (o.id.startsWith('selecao:')) return { acao: { tipo: 'perseguir', oque: 'preparar_pos' } as unknown as Acao, rotulo: 'Um ano preparando o projeto de pesquisa' };
    if (o.id.startsWith('peneira:')) return { acao: { tipo: 'perseguir', oque: 'treino_fundamentos', valor: o.id.split(':')[1] } as unknown as Acao, rotulo: 'Um ano de fundamentos, com treinador' };
    if (o.id === 'arte:teste' || o.id === 'arte:edital') return { acao: { tipo: 'perseguir', oque: 'apresentar' } as unknown as Acao, rotulo: 'Apresentar-se (currículo e público)' };
    return undefined;
  };
  return (
    <Secao titulo="O que você vem tentando">
      <ul className="objetivos">
        {lista.map(o => {
          const a = o.caminho ? acaoDe(o) : undefined;
          return (
            <li key={o.id} className="objetivo-em-curso">
              <strong>{o.titulo}</strong>
              <span className="nota">{o.tentativas === 1 ? `Uma tentativa, em ${anoDe(o.tUltima)}` : `${o.tentativas} tentativas desde ${anoDe(o.tPrimeira)}`}.{o.obstaculo ? ` Da última vez: ${o.obstaculo.replace(/^Não passou: /, '').replace(/^./, x => x.toLowerCase())}` : ''}</span>
              {o.caminho && <span className="devolutiva__dica">{o.caminho}</span>}
              {a && <BotaoAcao vida={vida} acao={a.acao} agir={agir} variante="discreto" ocultarImpossivel>{a.rotulo}</BotaoAcao>}
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}

/** Cursos que as pessoas costumam "mirar" (além dos que já fazem sentido para esta vida). */
const MIRAS = ['medicina', 'direito', 'eng_civil', 'psicologia', 'computacao', 'odontologia', 'veterinaria', 'arquitetura'];

/**
 * A preparação (não é credencial). Com um curso em vista, a situação dele —
 * pela MESMA conta da prova (`vestibular.estimativaParaCurso`) — o que pesa,
 * o próximo passo e o que mudou desde a última prova. O cursinho mora aqui
 * (é uma rotina da semana, mas começa e para em Estudos).
 */
function Preparacao({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }) {
  const e = vida.educacao;
  const i = idade(vida);
  // Onde a universidade pública tem matrícula aberta (Argentina, Uruguai, Itália, Marrocos), não há prova a preparar.
  const rumoAoVestibular = !educacaoDaVida(vida).aberto && !e.matricula && !['superior', 'pos', 'mestrado', 'doutorado'].includes(e.escolaridade) && (e.escolaridade === 'medio' || e.escolaridade === 'tecnico' || e.basica?.etapa === 'medio' || (e.basica?.etapa === 'fundamental2' && i >= 14));
  const alvos = rumoAoVestibular ? alvosDoEnem(vida) : [];
  const cursinho = fazCursinho(vida);
  const concurso = vida.rotinas.some(r => r.id === 'estudar_concurso');
  const ed = educacaoDaVida(vida);
  const notas = notasDaqui(vida).slice(-2);
  const objetivo = objetivoCurso(vida);
  const est = objetivo ? estimativaParaCurso(vida, objetivo) : undefined;
  const ultimaDev = [...vida.caminhos.devolutivas].reverse().find(d => d.tipo === 'vestibular');
  const miras = rumoAoVestibular && !objetivo ? [...new Set([...alvos.map(a => a.curso.id), ...MIRAS])].slice(0, 6) : [];
  const anosCursinho = cursinho ? Math.floor((vida.t - (vida.rotinas.find(r => r.id === 'cursinho')?.tInicio ?? vida.t)) / 12) : 0;
  const preparo = mesesDePreparo(vida);
  if (!rumoAoVestibular && !concurso && !cursinho && !objetivo && i < 17) return null;
  return (
    <Secao titulo="Preparação">
      {objetivo && est && (
        <div className="objetivo" aria-label={`Objetivo: ${objetivo.nome}`}>
          <p className="objetivo__titulo"><span className="objetivo__rotulo">Objetivo</span> {objetivo.nome}</p>
          <p className={`objetivo__situacao objetivo__situacao--${est.situacao}`}>{PALAVRA_SITUACAO[est.situacao].charAt(0).toUpperCase() + PALAVRA_SITUACAO[est.situacao].slice(1)}</p>
          <p className="nota">{est.frase}</p>
          {est.ultima && <p className="nota">{`Desde ${ed.o} de ${anoDe(est.ultima.t)} (ponderada ${est.ultima.nota}), a preparação ${est.nota - est.ultima.nota >= 15 ? 'subiu' : est.nota - est.ultima.nota <= -15 ? 'esfriou' : 'está parecida'}.`}</p>}
          <p className="objetivo__passo">{proximoPassoVestibular(vida, est)}</p>
          <div className="grupo-acoes grupo-acoes--linha">
            {est.fraca && est.situacao !== 'no_corte' && <BotaoAcao vida={vida} acao={{ tipo: 'perseguir', oque: 'estudo_dirigido', valor: est.fraca } as unknown as Acao} agir={agir} variante="secundario" ocultarImpossivel>{`Estudar ${NOME_MATERIA[est.fraca]} de forma dirigida (este ano)`}</BotaoAcao>}
            <BotaoAcao vida={vida} acao={{ tipo: 'objetivo_estudo' }} agir={agir} variante="discreto">Deixar esse objetivo de lado</BotaoAcao>
          </div>
        </div>
      )}
      {miras.length > 0 && (
        <div className="objetivo objetivo--escolher">
          <p className="nota">Tem um curso em vista? Com um objetivo, a preparação passa a ser dirigida a ele — e Formação diz a distância até o corte.</p>
          <div className="grupo-acoes grupo-acoes--linha">
            {miras.map(id => <BotaoAcao key={id} vida={vida} acao={{ tipo: 'objetivo_estudo', cursoId: id }} agir={agir} variante="discreto" ocultarImpossivel>{`Mirar em ${curso(id).nome}`}</BotaoAcao>)}
          </div>
        </div>
      )}
      {(rumoAoVestibular || cursinho) && (
        <div className="preparo-cursinho">
          <p className="nota">{cursinho
            ? `Você faz cursinho${anosCursinho >= 1 ? ` há ${anosCursinho} ${anosCursinho === 1 ? 'ano' : 'anos'}` : ' (começou agora: rende ao longo do ano)'}${objetivo ? `, dirigido ao que ${objetivo.nome} pesa` : ''}.`
            : preparo > 0 ? 'A preparação do cursinho esfria sem ele.' : 'O cursinho é a preparação que mais sobe a nota no primeiro ano; depois, rende menos.'}</p>
          <div className="grupo-acoes grupo-acoes--linha">
            {cursinho
              ? <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: 'cursinho', ativa: false }} agir={agir} variante="discreto">Parar o cursinho</BotaoAcao>
              : <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }} agir={agir} variante="secundario" ocultarImpossivel>Começar o cursinho</BotaoAcao>}
          </div>
        </div>
      )}
      {alvos.length > 0 && (
        <>
          <p className="nota">{notas.length ? `${ed.nome}: ${notas.map(n => `${n.nota} em ${anoDe(n.t)}`).join(' · ')}${notas.length === 2 ? (notas[1].nota > notas[0].nota ? ' — a nota subiu.' : notas[1].nota < notas[0].nota ? ' — a nota caiu.' : ' — igual.') : '.'}` : `Ainda sem nota ${ed.do}: é ela que abre a universidade pública.`}</p>
          <ul className="nota-alvo" aria-label="A sua nota diante dos cursos">
            {alvos.map(a => (
              <li key={a.curso.id}>
                <span className="nota-alvo__curso">{a.curso.nome}</span>
                <span className={`nota-alvo__palavra nota-alvo__palavra--${a.situacao === 'sem_nota' ? 'longe' : a.situacao}`}>{a.situacao === 'sem_nota' && notas.length ? 'sem nota recente (valem as dos últimos anos)' : situacaoDaNota(vida, a.situacao)}{a.situacao !== 'sem_nota' ? ` (corte ~${a.corte})` : ''}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {ultimaDev && vida.t - ultimaDev.t <= 36 && <p className="nota"><strong>{ultimaDev.titulo}.</strong> {ultimaDev.texto}</p>}
      {i >= 17 && <EstudoParaConcurso vida={vida} agir={agir} irPara={irPara} />}
    </Secao>
  );
}

const FOCOS_UI: { id: FocoConcurso | 'geral'; rotulo: string }[] = [
  { id: 'geral', rotulo: 'Estudo geral' }, { id: 'policial', rotulo: 'Polícia e farda' }, { id: 'administrativo', rotulo: 'Prefeitura e tribunais' },
  { id: 'fiscal', rotulo: 'Fiscal' }, { id: 'bancario', rotulo: 'Bancos públicos' }, { id: 'educacao', rotulo: 'Magistério' }, { id: 'saude', rotulo: 'Saúde' }, { id: 'academico', rotulo: 'Universidade' }
];

/**
 * Estudar para concurso: preparação profissional deliberada, em Estudos
 * (a rotina da semana é a fonte única; `caminhos.concurso` guarda o preparo).
 * Começar, o ritmo, a área e parar moram aqui; os editais, em Trabalho.
 */
function EstudoParaConcurso({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }) {
  const c = vida.caminhos.concurso;
  const rot = vida.rotinas.find(r => r.id === 'estudar_concurso');
  // Onde o serviço público não entra por concurso (EUA, Reino Unido, Alemanha...), não há o que estudar.
  if (!rot && !perfilDaVida(vida).trabalho.concurso) return null;
  const m = modeloRotina('estudar_concurso')!;
  const n = rot ? nivelDa(rot) : 0;
  const anos = Math.round(c.meses / 12);
  return (
    <div className="preparo-cursinho" aria-label="Estudo para concurso">
      <p className="objetivo__titulo"><span className="objetivo__rotulo">Concurso</span> {rot ? nivelModelo(m, n).rotulo : 'sem estudar agora'}</p>
      <p className="nota">{rot
        ? `Você estuda para concurso${c.meses >= 12 ? ` — o equivalente a ${anos} ${anos === 1 ? 'ano' : 'anos'} de estudo firme` : ''}${c.foco ? `, dirigido para ${NOME_FOCO[c.foco]}` : ', sem uma área'}.`
        : c.meses >= 6 ? 'O estudo parou: o preparo esfria a cada ano parado.' : 'Concurso pede preparo: sem estudo, é quase loteria.'}</p>
      <div className="grupo-acoes grupo-acoes--linha">
        {!rot && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 1 }} agir={agir} variante="secundario" ocultarImpossivel>Começar a estudar para concurso</BotaoAcao>}
        {rot && n < m.niveis.length && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: (n + 1) as 2 | 3 }} agir={agir} variante="discreto" ocultarBloqueado>{`Mais a sério: ${nivelModelo(m, n + 1).rotulo.toLowerCase()}`}</BotaoAcao>}
        {rot && n > 1 && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: (n - 1) as 1 | 2 }} agir={agir} variante="discreto">Mais leve</BotaoAcao>}
        {rot && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: 'estudar_concurso', ativa: false }} agir={agir} variante="discreto">Parar de estudar</BotaoAcao>}
      </div>
      {(rot || c.meses >= 6) && (
        <div className="foco-estudo" role="group" aria-labelledby="foco-rotulo">
          <span id="foco-rotulo" className="foco-estudo__rotulo">Para que área você estuda</span>
          <div className="foco-estudo__opcoes">
            {FOCOS_UI.map(f => {
              const ativo = (c.foco ?? 'geral') === f.id;
              return <button key={f.id} type="button" className="botao botao--discreto" aria-pressed={ativo} disabled={ativo} onClick={() => agir({ tipo: 'perseguir', oque: 'foco_concurso', valor: f.id } as unknown as Acao)}>{f.rotulo}</button>;
            })}
          </div>
          <p className="nota">Estudo dirigido rende mais nos editais daquela área; mudar de área não apaga o que se estudou. A sua estrada (a farda para a polícia, o Direito para tribunal, Contábeis para o fiscal) também pesa.</p>
        </div>
      )}
      {irPara && (rot || c.meses >= 6) && <button type="button" className="link rotina__ir" onClick={() => irPara('trabalho')}>Os editais e o preparo de cada um, em Trabalho →</button>}
    </div>
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
          <Linha rotulo="Turno" valor={m.modalidade === 'ead' ? 'no seu tempo' : curso(m.cursoId).carga === 'integral' ? 'período integral (com emprego, a semana passa muito do que cabe)' : 'à noite (cabe com trabalho)'} />
          {/* O custo pela mesma fonte do extrato e dos acontecimentos (`custoDoEstudo`): a tela não diz uma coisa e o mês outra. */}
          {(() => { const ce = custoDoEstudo(vida, m); if (!ce) return null; const credito = educacaoDaVida(vida).credito?.nome ?? 'crédito estudantil';
            return <Linha rotulo="Custo" valor={ce.regime === 'gratuita' ? 'sem mensalidade' : ce.regime === 'bolsa_integral' ? 'bolsa integral: nada a pagar' : ce.regime === 'credito' ? `${dinheiroCurto(m.mensalidade)}/mês, pelo ${credito.replace(/^(o|a) /, '')}: paga depois de formado` : ce.daFamilia > 0 ? `${dinheiroCurto(m.mensalidade)}/mês · a família põe ${dinheiroCurto(ce.daFamilia)}` : `${dinheiroCurto(m.mensalidade)}/mês`} />; })()}
        </>
      )}
      {e.evadiu && !b && <p className="nota">{`Você largou a escola. Dá para voltar pelo ${textoLocal(vida, 'supletivo').replace(/^(o|a) /, '')}.`}</p>}
      {estudando && i >= 7 && (
        <div className="campo">
          <span className="campo__rotulo">Como você encara os estudos este ano</span>
          <Escolha rotulo="Postura nos estudos" valor={e.postura} aoMudar={valor => agir({ tipo: 'postura', valor })}
            opcoes={[{ id: 'dedicada', rotulo: 'Com dedicação' }, { id: 'normal', rotulo: 'No ritmo' }, { id: 'relaxada', rotulo: 'Empurrando' }]} />
        </div>
      )}
      <div className="grupo-acoes">
        {i >= 15 && <BotaoAcao vida={vida} acao={{ tipo: 'enem' }} agir={agir} ocultarImpossivel>{educacaoDaVida(vida).acao}</BotaoAcao>}
        {m && !m.trancado && <BotaoAcao vida={vida} acao={{ tipo: 'trancar' }} agir={agir} variante="discreto">Trancar o curso</BotaoAcao>}
        {m?.trancado && <BotaoAcao vida={vida} acao={{ tipo: 'destrancar' }} agir={agir}>Voltar ao curso</BotaoAcao>}
        {m && <BotaoAcao vida={vida} acao={{ tipo: 'abandonar_curso' }} agir={agir} variante="perigo">Abandonar o curso</BotaoAcao>}
        {b && i >= 15 && <BotaoAcao vida={vida} acao={{ tipo: 'largar_escola' }} agir={agir} variante="perigo">Largar a escola</BotaoAcao>}
        {e.evadiu && <BotaoAcao vida={vida} acao={{ tipo: 'voltar_a_estudar' }} agir={agir}>{`Voltar a estudar (${textoLocal(vida, 'supletivo').replace(/^(o|a) /, '')})`}</BotaoAcao>}
      </div>
      {melhorNotaRecente(vida) > 0 && <p className="nota">Melhor nota recente {educacaoDaVida(vida).do}: {melhorNotaRecente(vida)}{temCota(vida) ? ' · você concorre por cota (escola pública e baixa renda)' : ''}.</p>}
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

/** Onde um curso mora no catálogo, conforme o ponto da formação em que a pessoa está. */
function grupoDoCurso(cc: { nivel: string; area: string }, formado: boolean, areas: Set<string>): { grupo: string; ordemGrupo: number } {
  if (cc.nivel === 'mestrado' || cc.nivel === 'doutorado') return { grupo: 'pesquisa: mestrado e doutorado', ordemGrupo: formado ? 2 : 7 };
  if (cc.nivel === 'pos' || cc.nivel === 'residencia') return { grupo: 'pós e especialização', ordemGrupo: formado ? 1 : 6 };
  if (cc.nivel === 'superior') return formado ? (areas.has(cc.area) ? { grupo: 'outra graduação na sua área', ordemGrupo: 5 } : { grupo: 'mudar de área: outra graduação', ordemGrupo: 4 }) : { grupo: 'graduação', ordemGrupo: 0 };
  if (cc.nivel === 'tecnico') return { grupo: 'técnico e profissionalizante', ordemGrupo: formado ? 3 : 1 };
  return { grupo: 'cursos livres e preparação', ordemGrupo: 8 };
}

function Cursos({ vida, agir }: Props) {
  const { para } = useMemo(() => cursosParaVoce(vida), [vida]);
  const todos = useMemo(() => cursosAgrupados(vida), [vida]);
  const sugestao = new Map(para.map(x => [x.item.curso.id, x.motivo]));
  const pontos = useMemo(() => new Map(pontuarCursos(vida, todos).map(x => [x.item.curso.id, x.pontos])), [vida, todos]);
  const formado = vida.educacao.concluidos.some(c => c.nivel === 'superior');
  const areasFormadas = new Set(vida.educacao.concluidos.filter(c => c.nivel === 'superior').map(c => c.area));
  if (vida.educacao.matricula && !vida.educacao.matricula.trancado) return <Secao titulo="Outra formação"><p className="nota">Um curso de cada vez: quando este terminar (ou for trancado), o catálogo volta a abrir aqui.</p></Secao>;
  const itens: ItemCatalogo[] = todos.map(c => {
    const cc = c.curso;
    const vias = [...c.opcoes].sort((a, b) => Number(podeTentar(b.o.veredito)) - Number(podeTentar(a.o.veredito)) || (b.o.veredito.chance ?? 0) - (a.o.veredito.chance ?? 0)).slice(0, 4);
    const melhor = vias[0]?.o;
    const duracao = cc.meses >= 24 ? `${cc.meses / 12} anos` : `${cc.meses} meses`;
    return {
      id: cc.id,
      titulo: nomeDaFormacao(cc, areaDaPos(vida, cc)),
      // Grupos pelo momento da formação (não pela área): graduação, técnico, pós, pesquisa, mudar de área, cursos livres.
      ...grupoDoCurso(cc, formado, areasFormadas),
      ordem: pontos.get(cc.id) ?? 0,
      tipo: TIPO_NIVEL[cc.nivel],
      meta: `${NIVEL[cc.nivel]} · ${duracao}${cc.carga === 'integral' ? ' · período integral' : ''}${melhor ? ` · ${melhor.via === 'fies' || (melhor.rede === 'publica' && melhor.mensalidade > 0 && educacaoDaVida(vida).publicaDiferida) ? 'paga depois de formado' : melhor.mensalidade > 0 ? `${dinheiroCurto(melhor.mensalidade)}/mês` : 'sem mensalidade'}` : ''}`,
      motivo: sugestao.get(cc.id),
      destaque: sugestao.has(cc.id),
      possivel: c.possivel,
      bloqueio: vias.find(x => !podeTentar(x.o.veredito))?.o.veredito.motivo,
      busca: `${cc.area} ${GRANDE_AREA[cc.area as AreaFormacao] ?? ""} ${cc.descricao}`,
      detalhe: (
        <div className="curso-detalhe">
          <p className="nota">{cc.descricao} {portasDoCurso(vida, cc.id)}</p>
          {cc.nivel === 'residencia' && <BotaoAcao vida={vida} acao={{ tipo: 'perseguir', oque: 'preparar_residencia' } as unknown as Acao} agir={agir} variante="discreto" ocultarImpossivel>Um ano de estudo para a prova de residência (antes de tentar)</BotaoAcao>}
          {(cc.nivel === 'mestrado' || cc.nivel === 'doutorado') && <BotaoAcao vida={vida} acao={{ tipo: 'perseguir', oque: 'preparar_pos' } as unknown as Acao} agir={agir} variante="discreto" ocultarImpossivel>Um ano preparando o projeto de pesquisa (antes de tentar)</BotaoAcao>}
          {vias.map(({ o, indice }) => (
            <div key={indice} className="via">
              <div className="via__texto">
                <strong>{rotuloDaVia(vida, o.via)}</strong>
                <span>{o.modalidade === 'ead' ? 'de casa' : nomeLugar(o.municipioId)}{o.via === 'fies' || (o.rede === 'publica' && o.mensalidade > 0 && educacaoDaVida(vida).publicaDiferida) ? ' · paga depois de formado' : o.mensalidade > 0 ? ` · ${dinheiroCurto(o.mensalidade)}/mês` : ' · sem mensalidade'}{o.modalidade !== 'ead' && o.municipioId !== vida.moradia.municipioId ? ' · pede mudança de cidade' : ''}</span>
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
    <>
      {para.length > 0 && (
        <Secao titulo="Próximos caminhos">
          <ul className="lista-vagas">
            {para.map(x => (
              <li key={x.item.curso.id} className="vaga">
                <div className="vaga__texto"><strong>{nomeDaFormacao(x.item.curso, areaDaPos(vida, x.item.curso))}</strong><span>{x.motivo}</span></div>
              </li>
            ))}
          </ul>
          <p className="nota">As vias de cada um (pública, particular, bolsa, a distância) estão no catálogo abaixo.</p>
        </Secao>
      )}
      <Secao titulo="Explorar formações" recolhivel={para.length > 0} aberta={para.length === 0}>
        {para.length === 0 && melhorNotaRecente(vida) === 0 && idade(vida) >= 16 && <p className="nota">{educacaoDaVida(vida).aberto ? 'Aqui, a universidade pública tem matrícula aberta: basta o ensino concluído.' : `Uma nota ${educacaoDaVida(vida).do} abre as portas da universidade pública.`}</p>}
        <Catalogo itens={itens} rotulo="Cursos" dicaBusca="enfermagem, direito, solda, técnico, mestrado…" tipos={[{ id: 'oficio', rotulo: 'Ofício' }, { id: 'tecnico', rotulo: 'Técnico' }, { id: 'superior', rotulo: 'Faculdade' }, { id: 'pos', rotulo: 'Pós' }]} vazio="Nenhum curso com esse filtro." porGrupo={6} />
      </Secao>
    </>
  );
}
