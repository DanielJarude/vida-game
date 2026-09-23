/** Rumo: estudo e trabalho. */

import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { opcoesDeCurso } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { curso } from '../../motor/dados/cursos';
import { OCUPACOES, ROTULO_NIVEL, ROTULO_TRILHA, ocupacao } from '../../motor/dados/ocupacoes';
import { nomeLugar } from '../../motor/dados/lugares';
import { elegibilidade, nomeOcupacao } from '../../motor/sistemas/trabalho';
import { melhorNotaRecente, rotuloSerie, ROTULO_ESCOLARIDADE, temCota } from '../../motor/sistemas/escola';
import { liquido } from '../../motor/sistemas/renda';
import { podeTentar } from '../../motor/plausibilidade';
import { anoDe } from '../../motor/tempo';
import { BotaoAcao, Escolha, Linha, Secao, Vazio } from '../comum';
import { dinheiroCurto, palavraChance, palavraDesempenho } from '../apresentar';

interface Props { vida: Vida; agir: (a: Acao) => boolean }

const VIA: Record<string, string> = {
  sisu: 'SISU — universidade pública', selecao_publica: 'Seleção pública', privada: 'Faculdade particular',
  prouni: 'ProUni — bolsa integral', fies: 'FIES — financiamento', ead: 'A distância (EAD)'
};

export function Rumo({ vida, agir }: Props) {
  const i = idade(vida);
  return (
    <div className="rumo">
      <Estudo vida={vida} agir={agir} />
      {i >= 15 && <Cursos vida={vida} agir={agir} />}
      {i >= 14 && <Trabalho vida={vida} agir={agir} />}
      {i >= 14 && <Vagas vida={vida} agir={agir} />}
      {(vida.trabalho.historico.length > 0 || vida.educacao.concluidos.length > 0) && <Trajetoria vida={vida} />}
      {i < 14 && !vida.educacao.basica && <Vazio>Por enquanto, o rumo é crescer.</Vazio>}
    </div>
  );
}

function Estudo({ vida, agir }: Props) {
  const e = vida.educacao;
  const b = e.basica;
  const m = e.matricula;
  const i = idade(vida);
  const estudando = !!b || !!m;
  return (
    <Secao titulo="Estudo">
      <Linha rotulo="Escolaridade" valor={ROTULO_ESCOLARIDADE[e.escolaridade]} />
      {b && (
        <>
          <Linha rotulo="Agora" valor={`${rotuloSerie(b)}, escola ${b.rede === 'publica' ? 'pública' : 'particular'}`} />
          {b.etapa !== 'creche' && b.etapa !== 'pre' && <Linha rotulo="Notas" valor={palavraDesempenho(b.desempenho)} tom={b.desempenho >= 62 ? 'bom' : b.desempenho < 40 ? 'ruim' : undefined} />}
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
        {m && <BotaoAcao vida={vida} acao={{ tipo: 'abandonar_curso' }} agir={agir} variante="perigo">Abandonar o curso</BotaoAcao>}
        {b && i >= 15 && <BotaoAcao vida={vida} acao={{ tipo: 'largar_escola' }} agir={agir} variante="perigo">Largar a escola</BotaoAcao>}
        {e.evadiu && <BotaoAcao vida={vida} acao={{ tipo: 'voltar_a_estudar' }} agir={agir}>Voltar a estudar (supletivo)</BotaoAcao>}
      </div>
      {melhorNotaRecente(vida) > 0 && <p className="nota">Melhor ENEM recente: {melhorNotaRecente(vida)}{temCota(vida) ? ' · você concorre por cota (escola pública e baixa renda)' : ''}.</p>}
    </Secao>
  );
}

function Cursos({ vida, agir }: Props) {
  const [todos, setTodos] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  const opcoes = useMemo(() => opcoesDeCurso(vida).map((o, indice) => ({ o, indice })), [vida]);
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
  if (vida.educacao.matricula) return null;
  return (
    <Secao titulo="Cursos" recolhivel aberta={idade(vida) >= 17} extra={<button type="button" className="botao botao--discreto" onClick={() => setTodos(t => !t)}>{todos ? 'Só os possíveis' : 'Ver todos'}</button>}>
      {cursos.length === 0 && <Vazio>Nenhum curso ao alcance agora. {melhorNotaRecente(vida) === 0 && idade(vida) >= 16 ? 'Uma nota do ENEM abre portas.' : ''}</Vazio>}
      <ul className="lista-opcoes">
        {cursos.map(c => {
          const cc = curso(c.id);
          const melhores = [...c.lista].sort((a, b) => Number(podeTentar(b.o.veredito)) - Number(podeTentar(a.o.veredito)) || (b.o.veredito.chance ?? 0) - (a.o.veredito.chance ?? 0));
          const aberta = aberto === c.id;
          return (
            <li key={c.id} className="opcao-curso">
              <button type="button" className="opcao-curso__cabeca" aria-expanded={aberta} onClick={() => setAberto(aberta ? null : c.id)}>
                <span className="opcao-curso__nome">{cc.nome}</span>
                <span className="opcao-curso__meta">{cc.nivel === 'tecnico' ? 'técnico' : cc.nivel === 'superior' ? 'graduação' : cc.nivel} · {cc.meses >= 24 ? `${cc.meses / 12} anos` : `${cc.meses} meses`}{c.possivel ? '' : ' · fora de alcance'}</span>
              </button>
              {aberta && (
                <div className="opcao-curso__corpo">
                  <p className="nota">{cc.descricao}</p>
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
    </Secao>
  );
}

function Trabalho({ vida, agir }: Props) {
  const e = vida.trabalho.atual;
  const t = vida.trabalho;
  return (
    <Secao titulo="Trabalho">
      {e ? (
        <>
          <Linha rotulo="Cargo" valor={nomeOcupacao(vida, ocupacao(e.ocupacaoId))} />
          <Linha rotulo="Onde" valor={e.empregador} />
          <Linha rotulo="Salário" valor={`${dinheiroCurto(e.salario)} bruto · ${dinheiroCurto(liquido(e.salario, e.contrato))} no bolso`} />
          <Linha rotulo="Desde" valor={`${anoDe(e.tInicio)}${e.contrato === 'clt' ? ' · carteira assinada' : e.contrato === 'servidor' ? ' · servidor público' : e.contrato === 'informal' ? ' · informal' : e.contrato === 'autonomo' ? ' · por conta própria' : e.contrato === 'estagio' ? ' · estágio' : ' · aprendiz'}`} />
          <Linha rotulo="Como vai" valor={palavraDesempenho(e.desempenho)} tom={e.desempenho >= 62 ? 'bom' : e.desempenho < 40 ? 'ruim' : undefined} />
          <div className="grupo-acoes">
            <BotaoAcao vida={vida} acao={{ tipo: 'horas_extras' }} agir={agir} ocultarImpossivel>Fazer horas extras este ano</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'pedir_aumento' }} agir={agir} ocultarImpossivel>Pedir aumento</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'aposentar' }} agir={agir} ocultarImpossivel>Aposentar</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'pedir_demissao' }} agir={agir} variante="perigo">Pedir demissão</BotaoAcao>
          </div>
        </>
      ) : t.aposentadoria ? (
        <Linha rotulo="Aposentadoria" valor={`${dinheiroCurto(t.aposentadoria.beneficio)} por mês, desde ${anoDe(t.aposentadoria.t)}`} />
      ) : (
        <Vazio>{idade(vida) < 16 ? 'Aos 14 e 15, só como jovem aprendiz.' : 'Sem trabalho no momento.'}</Vazio>
      )}
      {t.candidaturas.length > 0 && <p className="nota">Concurso em andamento: {t.candidaturas.map(c => nomeOcupacao(vida, ocupacao(c.ocupacaoId))).join(', ')} — resultado no próximo ano.</p>}
      {!e && !t.aposentadoria && idade(vida) >= 60 && <BotaoAcao vida={vida} acao={{ tipo: 'aposentar' }} agir={agir}>Pedir aposentadoria</BotaoAcao>}
    </Secao>
  );
}

function Vagas({ vida, agir }: Props) {
  const [verBloqueadas, setVer] = useState(false);
  const vagas = OCUPACOES.map(oc => ({ oc, d: elegibilidade(vida, oc) }))
    .filter(x => x.d.grau !== 'incompativel' || x.oc.id !== vida.trabalho.atual?.ocupacaoId);
  const alcancaveis = vagas.filter(x => podeTentar(x.d)).sort((a, b) => b.oc.salario - a.oc.salario);
  const bloqueadas = vagas.filter(x => !podeTentar(x.d) && x.d.grau !== 'ilegal').sort((a, b) => a.oc.nivel - b.oc.nivel || a.oc.salario - b.oc.salario);
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('candidatura:')).length;
  return (
    <Secao titulo="Procurar trabalho" recolhivel aberta={!vida.trabalho.atual && idade(vida) >= 16}>
      <p className="dica">Cada candidatura leva a uma entrevista. Dá para tentar até três processos por ano ({Math.max(0, 3 - usadas)} restantes).</p>
      {alcancaveis.length === 0 && <Vazio>Nenhuma vaga ao seu alcance agora.</Vazio>}
      <ul className="lista-vagas">
        {alcancaveis.map(({ oc }) => (
          <li key={oc.id} className="vaga">
            <div className="vaga__texto">
              <strong>{nomeOcupacao(vida, oc)}</strong>
              <span>{oc.concurso ? 'concurso público' : ROTULO_NIVEL[oc.nivel]} · a partir de {dinheiroCurto(oc.salario)}</span>
            </div>
            <BotaoAcao vida={vida} acao={{ tipo: 'candidatar', ocupacaoId: oc.id }} agir={agir} mostrarChance>{oc.concurso ? 'Inscrever-se' : 'Candidatar-se'}</BotaoAcao>
          </li>
        ))}
      </ul>
      {bloqueadas.length > 0 && (
        <>
          <button type="button" className="botao botao--discreto" aria-expanded={verBloqueadas} onClick={() => setVer(v => !v)}>{verBloqueadas ? 'Esconder' : 'Ver'} o que ainda está fora de alcance ({bloqueadas.length})</button>
          {verBloqueadas && (
            <ul className="lista-vagas lista-vagas--bloqueadas">
              {bloqueadas.map(({ oc, d }) => (
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

function Trajetoria({ vida }: { vida: Vida }) {
  const t = vida.trabalho;
  const trilhas = Object.entries(t.experiencia).filter(([, m]) => m >= 12).sort((a, b) => b[1] - a[1]);
  return (
    <Secao titulo="Trajetória" recolhivel aberta={false}>
      {vida.educacao.concluidos.map(c => <Linha key={c.cursoId + c.tFim} rotulo={String(anoDe(c.tFim))} valor={c.nome} />)}
      {t.historico.slice().reverse().slice(0, 12).map((h, k) => <Linha key={k} rotulo={`${anoDe(h.tInicio)}–${anoDe(h.tFim)}`} valor={`${nomeOcupacao(vida, ocupacao(h.ocupacaoId))}, ${h.empregador}`} />)}
      {trilhas.length > 0 && <p className="nota">Experiência: {trilhas.map(([tr, m]) => `${Math.floor(m / 12)} ${Math.floor(m / 12) === 1 ? 'ano' : 'anos'} em ${ROTULO_TRILHA[tr] ?? tr}`).join(' · ')}.</p>}
      <p className="nota">INSS: {Math.floor(t.contribuicao / 12)} anos de contribuição.{t.licencas.length ? ` Registros: ${t.licencas.map(l => l.toUpperCase()).join(', ')}.` : ''}</p>
    </Secao>
  );
}

void palavraChance;
