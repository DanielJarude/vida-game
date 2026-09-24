/**
 * Rumo: estudo e trabalho.
 *
 * O jogador não vê um catálogo de profissões: vê as portas que a vida abriu
 * agora, o que a formação e a estrada permitem, e o que está fora de alcance
 * perto de onde ele está — sempre com o motivo. A carreira é contada em
 * palavras (anos de estrada, o que falta para o próximo passo), não em níveis.
 */

import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { opcoesDeCurso } from '../../motor/acoes';
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
import { anoDe } from '../../motor/tempo';
import { BotaoAcao, Escolha, Linha, Secao, Vazio } from '../comum';
import { dinheiroCurto, palavraDesempenho } from '../apresentar';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

const VIA: Record<string, string> = {
  sisu: 'SISU — universidade pública', selecao_publica: 'Seleção pública', privada: 'Particular',
  prouni: 'ProUni — bolsa integral', fies: 'FIES — financiamento', ead: 'A distância (EAD)'
};

const NIVEL_CURSO: { id: string; rotulo: string }[] = [
  { id: 'livre', rotulo: 'Aprender um ofício' }, { id: 'tecnico', rotulo: 'Curso técnico' }, { id: 'superior', rotulo: 'Faculdade' },
  { id: 'pos', rotulo: 'Pós-graduação' }, { id: 'residencia', rotulo: 'Pós-graduação' }, { id: 'mestrado', rotulo: 'Pós-graduação' }, { id: 'doutorado', rotulo: 'Pós-graduação' }
];

export function Rumo({ vida, agir }: Props) {
  const i = idade(vida);
  return (
    <div className="rumo">
      <Portas vida={vida} agir={agir} />
      <Estudo vida={vida} agir={agir} />
      {i >= 15 && <Cursos vida={vida} agir={agir} />}
      {i >= 14 && <Trabalho vida={vida} agir={agir} />}
      {i >= 17 && <Concursos vida={vida} agir={agir} />}
      {i >= 14 && <Vagas vida={vida} agir={agir} />}
      {(vida.trabalho.historico.length > 0 || vida.educacao.concluidos.length > 0 || vida.caminhos.marcas.length > 0) && <Trajetoria vida={vida} />}
      {i < 14 && !vida.educacao.basica && <Vazio>Por enquanto, o rumo é crescer.</Vazio>}
    </div>
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
  return (
    <Secao titulo="Estudo">
      <Linha rotulo="Escolaridade" valor={ROTULO_ESCOLARIDADE[e.escolaridade]} />
      {b && (
        <>
          <Linha rotulo="Agora" valor={`${rotuloSerie(b)}, escola ${b.rede === 'publica' ? 'pública' : 'particular'}${b.integrado ? ` · integrado ao ${cursoOuNulo(b.integrado)?.nome ?? 'técnico'}` : ''}`} />
          {b.etapa !== 'creche' && b.etapa !== 'pre' && <Linha rotulo="Notas" valor={palavraDesempenho(b.desempenho)} tom={b.desempenho >= 62 ? 'bom' : b.desempenho < 40 ? 'ruim' : undefined} />}
          {forte && fraca && b.etapa !== 'creche' && b.etapa !== 'pre' && <p className="nota">Vai melhor em {NOME_MATERIA[forte]}; {NOME_MATERIA[fraca]} é onde mais sofre.</p>}
          {b.reprovacoes > 0 && <Linha rotulo="Repetências" valor={String(b.reprovacoes)} />}
        </>
      )}
      {m && (
        <>
          <Linha rotulo="Curso" valor={`${curso(m.cursoId).nome}${m.trancado ? ' (trancado)' : ''}`} />
          <Linha rotulo="Onde" valor={`${m.instituicao}${m.modalidade === 'ead' ? '' : ` · ${nomeLugar(m.municipioId)}`}`} />
          <Linha rotulo="Falta" valor={m.mesesRestantes <= 12 ? 'o último ano' : `cerca de ${Math.ceil(m.mesesRestantes / 12)} anos`} />
          {m.mensalidade > 0 && <Linha rotulo={m.financiamento === 'fies' ? 'Mensalidade (FIES)' : 'Mensalidade'} valor={dinheiroCurto(m.mensalidade)} />}
          <Linha rotulo="Desempenho" valor={palavraDesempenho(m.desempenho)} />
          <p className="nota">{portasDoCurso(vida, m.cursoId)}</p>
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
  const [todos, setTodos] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  const opcoes = useMemo(() => opcoesDeCurso(vida).map((o, indice) => ({ o, indice })), [vida]);
  if (vida.educacao.matricula) return null;
  const porCurso = new Map<string, typeof opcoes>();
  for (const x of opcoes) {
    const lista = porCurso.get(x.o.curso.id) ?? [];
    lista.push(x);
    porCurso.set(x.o.curso.id, lista);
  }
  const cursos = [...porCurso.entries()]
    .map(([id, lista]) => ({ id, lista, possivel: lista.some(x => podeTentar(x.o.veredito)) }))
    .filter(c => todos || c.possivel)
    .filter(c => !c.lista.every(x => x.o.veredito.grau === 'incompativel' && /concluiu/.test(x.o.veredito.motivo ?? '')));
  const grupos = [...new Set(NIVEL_CURSO.map(n => n.rotulo))].map(rotulo => ({ rotulo, lista: cursos.filter(c => NIVEL_CURSO.find(n => n.id === curso(c.id).nivel)?.rotulo === rotulo) })).filter(g => g.lista.length);
  return (
    <Secao titulo="Cursos" recolhivel aberta={idade(vida) >= 17} extra={<button type="button" className="botao botao--discreto" onClick={() => setTodos(t => !t)}>{todos ? 'Só os possíveis' : 'Ver todos'}</button>}>
      {cursos.length === 0 && <Vazio>Nenhum curso ao alcance agora. {melhorNotaRecente(vida) === 0 && idade(vida) >= 16 ? 'Uma nota do ENEM abre portas.' : ''}</Vazio>}
      {grupos.map(g => (
        <div key={g.rotulo} className="grupo-atividades">
          <h3 className="grupo-atividades__titulo">{g.rotulo}</h3>
          <ul className="lista-opcoes">
            {g.lista.map(c => {
              const cc = curso(c.id);
              const melhores = [...c.lista].sort((a, b) => Number(podeTentar(b.o.veredito)) - Number(podeTentar(a.o.veredito)) || (b.o.veredito.chance ?? 0) - (a.o.veredito.chance ?? 0)).slice(0, 4);
              const aberta = aberto === c.id;
              return (
                <li key={c.id} className="opcao-curso">
                  <button type="button" className="opcao-curso__cabeca" aria-expanded={aberta} onClick={() => setAberto(aberta ? null : c.id)}>
                    <span className="opcao-curso__nome">{cc.nome}</span>
                    <span className="opcao-curso__meta">{cc.meses >= 24 ? `${cc.meses / 12} anos` : `${cc.meses} meses`}{c.possivel ? '' : ' · fora de alcance'}</span>
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
            })}
          </ul>
        </div>
      ))}
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
          <Linha rotulo="Ganha" valor={`${dinheiroCurto(e.salario)} bruto · ${dinheiroCurto(liquido(e.salario, e.contrato))} no bolso${e.clientela !== undefined ? ' · varia com a freguesia' : ''}`} />
          <Linha rotulo="Desde" valor={`${anoDe(e.tInicio)}${e.contrato === 'clt' ? ' · carteira assinada' : e.contrato === 'servidor' ? ' · servidor público' : e.contrato === 'militar' ? ' · carreira militar' : e.contrato === 'informal' ? ' · informal' : e.contrato === 'autonomo' ? ' · por conta própria' : e.contrato === 'estagio' ? ' · estágio' : e.contrato === 'temporario' ? ' · temporário' : ' · aprendiz'}`} />
          {e.clientela === undefined && <Linha rotulo="Como vai" valor={palavraDesempenho(e.desempenho)} tom={e.desempenho >= 62 ? 'bom' : e.desempenho < 40 ? 'ruim' : undefined} />}
          <div className="carreira">
            {estradaNaArea(vida) && <p>{estradaNaArea(vida)}</p>}
            {horizonte(vida) && <p>{horizonte(vida)}</p>}
            {n && n.estado !== 'fechado' && <p>{n.nome}: {n.estado === 'firme' ? 'firme, com freguesia certa' : n.estado === 'apertado' ? 'no aperto, o movimento está fraco' : 'ainda começando'}.</p>}
            {esporte?.fase === 'profissional' && <p>{esporte.lesoes > 1 ? `${esporte.lesoes} lesões na carreira. ` : ''}O corpo tem prazo: poucas carreiras passam dos 35.</p>}
          </div>
          <div className="grupo-acoes">
            <BotaoAcao vida={vida} acao={{ tipo: 'horas_extras' }} agir={agir} ocultarImpossivel>Fazer horas extras este ano</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'pedir_aumento' }} agir={agir} ocultarImpossivel>Pedir aumento</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'aposentar' }} agir={agir} ocultarImpossivel>{ocupacao(e.ocupacaoId).contrato === 'militar' ? 'Ir para a reserva' : 'Aposentar'}</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'pedir_demissao' }} agir={agir} variante="perigo">{e.clientela !== undefined ? 'Parar com isso' : 'Pedir demissão'}</BotaoAcao>
          </div>
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
  const [mais, setMais] = useState(false);
  const [bloqueadas, setBloqueadas] = useState(false);
  const atual = vida.trabalho.atual?.ocupacaoId;
  const exp = vida.trabalho.experiencia;
  const areas = new Set(vida.educacao.concluidos.map(c => c.area));
  const todas = OCUPACOES.filter(oc => !oc.concurso && oc.id !== atual).map(oc => ({ oc, d: elegibilidade(vida, oc) }));
  const alcance = todas.filter(x => podeTentar(x.d));
  const minhaArea = (oc: Ocupacao) => (exp[oc.trilha] ?? 0) >= 12 || !!oc.area?.some(a => areas.has(a)) || !!oc.habilidade;
  const naArea = alcance.filter(x => minhaArea(x.oc) && !porContaPropria(x.oc)).sort((a, b) => b.oc.nivel - a.oc.nivel || b.oc.salario - a.oc.salario).slice(0, 6);
  const porConta = alcance.filter(x => porContaPropria(x.oc) && !naArea.includes(x)).sort((a, b) => b.oc.salario - a.oc.salario).slice(0, 5);
  const usados = new Set([...naArea, ...porConta].map(x => x.oc.id));
  // Para começar: uma de cada setor, as mais prováveis.
  const setores = new Set<string>();
  const comecar = alcance.filter(x => !usados.has(x.oc.id) && x.oc.nivel <= 2).sort((a, b) => (b.d.chance ?? 0) - (a.d.chance ?? 0)).filter(x => (setores.has(x.oc.setor) ? false : (setores.add(x.oc.setor), true))).slice(0, 6);
  comecar.forEach(x => usados.add(x.oc.id));
  const outras = alcance.filter(x => !usados.has(x.oc.id)).sort((a, b) => b.oc.salario - a.oc.salario).slice(0, 12);
  // Fora de alcance: só o que está perto do caminho (próximo degrau, a sua formação, o seu ofício).
  const perto = new Set<string>();
  if (atual) for (const x of degrausAcima(ocupacao(atual))) perto.add(x.id);
  for (const { oc } of todas) if (minhaArea(oc) && oc.nivel >= 2) perto.add(oc.id);
  const fora = todas.filter(x => !podeTentar(x.d) && x.d.grau !== 'ilegal' && x.d.grau !== 'impossivel' && perto.has(x.oc.id) && !/currículo|oportunidade|peneira|carreira militar|negócio/.test(x.d.motivo ?? '')).slice(0, 8);
  const negocios = negociosPossiveis(vida).filter(n => podeTentar(n.veredito) || /R\$/.test(n.veredito.motivo ?? ''));
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('candidatura:')).length;
  const grupo = (titulo: string, lista: typeof alcance, dica?: string) => lista.length > 0 && (
    <div className="grupo-atividades">
      <h3 className="grupo-atividades__titulo">{titulo}</h3>
      {dica && <p className="nota">{dica}</p>}
      <ul className="lista-vagas">
        {lista.map(({ oc }) => (
          <li key={oc.id} className="vaga">
            <div className="vaga__texto"><strong>{nomeOcupacao(vida, oc)}</strong><span>{ROTULO_SETOR[oc.setor]}{oc.experiencia ? ' · pede estrada' : oc.nivel <= 1 ? ' · para começar' : ''} · a partir de {dinheiroCurto(oc.salario)}{oc.jornada === 'fora' ? ' · dias fora de casa' : oc.jornada === 'longa' ? ' · jornada longa' : ''}</span></div>
            <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance={!porContaPropria(oc)}>{porContaPropria(oc) ? 'Começar por conta' : 'Candidatar-se'}</BotaoAcao>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <Secao titulo="Procurar trabalho" recolhivel aberta={!vida.trabalho.atual && idade(vida) >= 16}>
      <p className="dica">Cada candidatura leva a uma entrevista. Dá para tentar até três processos por ano ({Math.max(0, 3 - usadas)} restantes). Trabalhar por conta não passa por entrevista: a freguesia é que decide.</p>
      {alcance.length === 0 && <Vazio>Nenhuma vaga ao seu alcance agora.</Vazio>}
      {grupo('Na sua área', naArea)}
      {grupo('Por conta própria', porConta, 'Com ofício, dá para atender por conta. Começa com pouca freguesia.')}
      {grupo('Para começar', comecar)}
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
      {outras.length > 0 && (
        <>
          <button type="button" className="botao botao--discreto" aria-expanded={mais} onClick={() => setMais(x => !x)}>{mais ? 'Esconder' : 'Ver'} outras portas ({outras.length})</button>
          {mais && grupo('Outras portas', outras)}
        </>
      )}
      {fora.length > 0 && (
        <>
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
        </>
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
    <Secao titulo="Trajetória" recolhivel aberta={false}>
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
