/**
 * VIDA 25 · A CARREIRA DE E-SPORTS (em Caminhos · Outros caminhos e, no profissional, também em Trabalho).
 * Sem carreira: a porta (os jogos que existem no ano, o que cada um é). Com carreira: o jogo e a função, o caminho dos
 * cinco degraus (com os nomes reais da época), a equipe e o contrato, a ficha de atributos, a última temporada
 * (competições, colocações, a métrica individual, o prêmio), a proposta na mesa, o que dá para fazer no ano e o
 * histórico (temporadas, equipes, títulos).
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { podeTentar } from '../../../motor/plausibilidade';
import { jogosNoAno25, leituraEsports25, podeComecar25, type OqueEsports25 } from '../../../motor/v25/esports/esports25';
import { GRUPO25, JOGOS25, NOME_ATRIBUTO25, NOME_GRUPO25, SOBRE_ATRIBUTO25, type AtributoEsports } from '../../../motor/v25/esports/jogos25';
import { pesosDaFuncao } from '../../../motor/v25/esports/esports25';
import { anoDe } from '../../../motor/tempo';
import { municipio } from '../../../motor/dados/lugares';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { FichaDeAtleta25, type LinhaFicha25 } from '../ficha/FichaDeAtleta25';
import './esports25.css';

const A = (oque: OqueEsports25): Acao => ({ tipo: 'esports25', oque } as Acao);
const pl = (n: number, s: string, p = `${s}s`) => `${n} ${n === 1 ? s : p}`;
const GENERO = { tatico: 'tático por equipes', battle_royale: 'battle royale', moba: 'estratégia (MOBA)', carros: 'futebol de carros' } as const;

function Porta({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [aberto, setAberto] = useState(false);
  if (!podeTentar(podeComecar25(vida))) return null;
  const ano = anoDe(vida.t);
  const jogos = jogosNoAno25(ano);
  return (
    <section className="esp25 esp25--porta" aria-labelledby="esp25-porta">
      <h3 id="esp25-porta" className="subtitulo">E-sports: competir de verdade</h3>
      <p className="nota">Do ranqueado ao mundial, numa equipe (ou, no Fortnite, em dupla e pelas divisões). O treino entra na semana como atividade — e ninguém começa numa equipe de elite: peneira, cenário aberto, segunda divisão, liga principal.</p>
      {!aberto ? <button type="button" className="botao botao--secundario" onClick={() => setAberto(true)}>Escolher o jogo <span aria-hidden>→</span></button> : (
        <ul className="esp25__jogos">
          {jogos.map(id => {
            const j = JOGOS25[id];
            return (
              <li key={id} className="esp25__jogo">
                <p className="esp25__jogo-nome">{j.nome(ano)} <small>· {GENERO[j.genero]}{j.porEquipe(ano) > 1 ? `, ${j.porEquipe(ano)} por equipe` : ''}</small></p>
                <p className="nota">{j.sobre}</p>
                <p className="nota esp25__jogo-topo">No topo: {j.niveis[4].nome(ano, true)} · contrato profissional a partir dos {j.idadePro} anos.</p>
                <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'comecar', jogo: id })} variante="principal">Competir em {j.nome(ano)}</BotaoAcao>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function Esports25({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraEsports25(vida);
  if (!l) return <Porta vida={vida} agir={agir} />;
  const { e, j } = l;
  const ult = e.temporadas[e.temporadas.length - 1];
  const encerrada = e.fase === 'encerrada';
  const anterior = e.serie.length >= 2 ? e.serie[e.serie.length - 2] : undefined;
  const pesos = new Map(pesosDaFuncao(j, e.funcao));
  const linhas: LinhaFicha25[] = j.atributos.map(([id]) => ({
    id, nome: NOME_ATRIBUTO25[id], grupo: GRUPO25[id], valor: e.atributos[id] ?? 0, peso: pesos.get(id), sobre: SOBRE_ATRIBUTO25[id],
    antes: anterior?.a[id], serie: e.serie.map(x => x.a[id]).filter((x): x is number => typeof x === 'number')
  }));
  const grupos = (Object.keys(NOME_GRUPO25) as (keyof typeof NOME_GRUPO25)[]).map(g => ({ id: g, nome: NOME_GRUPO25[g] }));
  const nivelSerie = e.serie.map(x => { const p = pesosDaFuncao(j, e.funcao); return p.reduce((s, [id, w]) => s + (x.a[id as AtributoEsports] ?? 0) * w, 0); });
  const fase = encerrada ? 'Carreira encerrada' : e.fase === 'profissional' ? 'Profissional' : e.equipe ? 'Em equipe, sem salário' : e.fase === 'competitivo' ? 'Sem equipe' : 'No ranqueado';
  return (
    <section className="esp25" aria-labelledby="esp25-t" data-fase={e.fase}>
      <header className="esp25__cabeca">
        <h3 id="esp25-t" className="subtitulo">E-sports · {l.nomeJogo}</h3>
        <p className="esp25__placar"><span className={`esp25__estado esp25__estado--${e.fase}`}>{fase}</span>{l.funcao ? <span> · {l.funcao.nome}</span> : null}{!encerrada && <span> · {l.caminho[e.nivel - 1].nome}</span>}</p>
      </header>
      <ol className="esp25__caminho" aria-label="O caminho até a elite">
        {l.caminho.map(c => <li key={c.n} className={`esp25__degrau${c.atual && !encerrada ? ' esp25__degrau--atual' : ''}${c.feito ? ' esp25__degrau--feito' : ''}`}><span className="esp25__degrau-n">{c.n}</span> {c.nome}</li>)}
      </ol>
      {!encerrada && (
        <dl className="esp25__ficha">
          <div><dt>Equipe</dt><dd>{e.equipe ? <>{e.equipe.nome} <small>· {e.equipe.titular ? 'titular' : 'reserva'}</small></> : j.id === 'fortnite' ? 'joga pelas divisões (a dupla muda por copa)' : 'nenhuma — a peneira e as propostas abrem a porta'}</dd></div>
          {e.equipe && <div><dt>Contrato</dt><dd>{e.equipe.salario ? `${dinheiroCurto(e.equipe.salario)}/mês` : 'sem salário'}{e.equipe.contratoAte ? ` · até ${anoDe(e.equipe.contratoAte)}` : ''}{e.equipe.municipioId ? ` · ${municipio(e.equipe.municipioId).nome}` : ''}</dd></div>}
          <div><dt>Treino</dt><dd>{l.intensidade === 3 ? (e.fase === 'profissional' ? 'o dia inteiro, com a equipe (é o trabalho)' : 'o dia inteiro') : l.intensidade === 2 ? 'todo dia, com horário' : l.intensidade === 1 ? 'umas horas, nos dias livres' : <strong>parado — sem treino, a mão esfria (Minha Semana)</strong>}</dd></div>
          <div><dt>No cenário</dt><dd>{e.reputacao >= 70 ? 'nome conhecido' : e.reputacao >= 45 ? 'respeitado no circuito' : e.reputacao >= 20 ? 'começando a ser visto' : 'desconhecido'}</dd></div>
          {l.proximo && <div><dt>Próximo degrau</dt><dd>{l.proximo.nome}: nível de jogo perto de {Math.round(l.proximo.precisa)} (o seu: {Math.round(l.nivelDeJogo)}){l.proximo.idade > 13 ? `, ${l.proximo.idade}+ anos` : ''}</dd></div>}
        </dl>
      )}
      <FichaDeAtleta25 titulo="Atributos de jogador" nivel={l.nivelDeJogo} nivelRotulo="nível de jogo" nivelSerie={nivelSerie} grupos={grupos} linhas={linhas} fortes={l.fortes} fracos={l.fracos}
        rodape={`Os pesos são os da função${l.funcao ? ` (${l.funcao.nome})` : ''}. A mão (mira, reflexos, mecânica) chega ao auge perto dos ${j.auge} anos e cai depois; a leitura (estratégia, decisão, comunicação) cresce com os anos de partida.`} />
      {ult && (
        <div className="esp25__temporada" aria-label="A última temporada">
          <p className="esp25__temporada-titulo">Temporada {ult.ano}{ult.equipe ? ` · ${ult.equipe}` : ''} · {ult.papel === 'reserva' ? 'reserva' : ult.papel === 'sem_equipe' ? 'sem equipe' : 'titular'}</p>
          <ul className="esp25__competicoes">
            {ult.competicoes.map((c, k) => (
              <li key={k} className={c.titulo ? 'esp25__comp esp25__comp--titulo' : 'esp25__comp'}>
                <span className="esp25__comp-nome">{c.titulo && <b className="esp25__selo">campeão</b>}{c.nome}</span>
                <span className="esp25__comp-pos">{c.colocacao}º de {c.participantes}</span>
                <span className="esp25__comp-vd">{c.vitorias}V {c.derrotas}D</span>
                {c.premio > 0 && <span className="esp25__comp-premio">{dinheiroCurto(c.premio)}</span>}
              </li>
            ))}
          </ul>
          <p className="nota">{j.metrica.nome}: <b>{ult.metrica.toLocaleString('pt-BR')}</b> <small>({j.metrica.sobre})</small> · {pl(ult.disputas, j.disputa[0], j.disputa[1])}, {ult.vencidas} vencid{j.disputa[0] === 'mapa' ? 'os' : 'as'}{ult.destaque ? ` · destaque: ${ult.destaque}` : ''}{ult.premios ? ` · prêmios no ano: ${dinheiroCurto(ult.premios)} (a sua parte)` : ''}</p>
        </div>
      )}
      {l.proposta && (
        <div className="esp25__proposta" role="group" aria-label="Proposta na mesa">
          <p><b>Proposta:</b> {l.proposta.equipe} · {l.caminho[l.proposta.nivel - 1].nome} · {l.proposta.salario ? `${dinheiroCurto(l.proposta.salario)}/mês` : 'sem salário'} · {l.proposta.titular ? 'como titular' : 'para brigar pela vaga'} · {l.proposta.meses} meses{l.proposta.municipioId && l.proposta.municipioId !== vida.moradia.municipioId ? ` · gaming house em ${municipio(l.proposta.municipioId).nome} (mudar de cidade)` : ''}. Vale até {anoDe(l.proposta.validaAte)}.</p>
          <div className="esp25__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'aceitar' })} variante="principal">Aceitar</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'recusar' })}>Recusar</BotaoAcao>
          </div>
        </div>
      )}
      {!encerrada && (
        <div className="esp25__acoes">
          <p className="esp25__rotulo">O foco do treino neste ano</p>
          <div className="esp25__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'mecanica' })}>{j.genero === 'tatico' ? 'Mira e reflexo' : 'Mecânica'}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'estrategia' })}>Estudar partidas</BotaoAcao>
            {j.porEquipe(anoDe(vida.t)) > 1 && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'equipe' })}>Treino com a equipe</BotaoAcao>}
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'mental' })}>Psicólogo do esporte</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'descanso' })}>Descansar mais</BotaoAcao>
          </div>
          <div className="esp25__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'peneira' })} ocultarImpossivel>Fazer peneira numa equipe</BotaoAcao>
            {e.equipe && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'sair' })} variante="discreto">Sair da equipe</BotaoAcao>}
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'parar' })} variante="discreto">Parar de competir</BotaoAcao>
          </div>
          {j.funcoes.length > 1 && (
            <details className="esp25__funcoes">
              <summary>Função na equipe</summary>
              <ul>
                {j.funcoes.map(f => (
                  <li key={f.id}><b>{f.nome}</b> — {f.sobre} {f.id !== e.funcao && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'funcao', funcao: f.id })} variante="discreto" ocultarImpossivel>Jogar assim</BotaoAcao>}{f.id === e.funcao && <small> (a sua)</small>}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {(e.temporadas.length > 1 || e.passagens.length > 0) && (
        <details className="esp25__historico">
          <summary>A carreira: {pl(e.totais.temporadas, 'temporada')}, {pl(e.passagens.length, 'equipe')}, {pl(e.totais.titulos, 'título')}{e.totais.premios ? `, ${dinheiroCurto(e.totais.premios)} em prêmios` : ''}</summary>
          {e.passagens.length > 0 && <ul className="esp25__passagens">{e.passagens.map((p, k) => <li key={k}>{p.de}–{p.ate ?? 'hoje'} · {p.equipe} <small>({l.caminho[p.nivel - 1]?.nome}{p.saida ? `; saída: ${p.saida}` : ''})</small></li>)}</ul>}
          <div className="esp25__tabela" role="region" aria-label="Temporadas" tabIndex={0}>
            <table>
              <thead><tr><th>Ano</th><th>Degrau</th><th>Equipe</th><th>Liga/circuito</th><th>{j.metrica.nome}</th><th>Títulos</th></tr></thead>
              <tbody>{e.temporadas.map(t => <tr key={t.ano}><td>{t.ano}</td><td>{t.nivel}</td><td>{t.equipe ?? '—'}{t.papel === 'reserva' ? ' (reserva)' : ''}</td><td>{t.competicoes[0].colocacao}º/{t.competicoes[0].participantes}</td><td>{t.metrica.toLocaleString('pt-BR')}</td><td>{t.competicoes.filter(c => c.titulo).map(c => c.nome).join(', ') || '—'}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      )}
      <p className="nota esp25__fonte">Jogos e competições reais (nomes da época); equipes, adversários, resultados e contratos são simulação do jogo.</p>
    </section>
  );
}

export default Esports25;
