/**
 * REWORK 9 — A AGENDA DA SEMANA, em horários.
 *
 * Sete colunas, segunda a domingo; cada compromisso ocupa as horas dele (o bloco tem a altura da duração). Tudo vem
 * de `sistemas/agenda` — a mesma conta que o ano usa para saber o que de fato aconteceu: a escola e o curso no turno
 * deles, o trabalho no expediente, o que corre em paralelo, a casa (as crianças, quem precisa de cuidado, o bicho), o
 * trajeto, cada atividade no lugar dela.
 *
 * O que dá para fazer daqui: tocar num compromisso e ver de onde ele vem, até quando vai, o que faz na vida e quanto
 * custa; mudar o turno do que tem turno; escolher os dias e a hora de uma atividade (ou devolvê-la ao encaixe
 * automático); deixá-la mais leve ou mais a sério; abrir a ficha da prática. Conflitos aparecem no alto, com as saídas
 * que existem — nunca em silêncio. No celular, um dia de cada vez (as sete colunas não cabem legíveis).
 *
 * O tamanho da semana (folgada, ocupada, cheia…) continua o de `semana`: é ele que diz se ainda cabe algo, e o
 * estresse lê dele.
 */

import { useState } from 'react';
import type { Dia, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { custoDaRotina, DE_ESTUDOS } from '../../motor/sistemas/rotinas';
import { DE_FORMACAO } from '../../motor/sistemas/formacao';
import { ABRE, agendaDaSemana, alternativasDoConflito, DIAS, DIAS_CURTOS, FECHA, faixaDeHoras, fichaDoBloco, hora, PALAVRA_TURNO, quando, TODOS, type Bloco } from '../../motor/sistemas/agenda';
import { idade } from '../../motor/nucleo';
import { folgaNosHorarios } from '../../motor/sistemas/avaliacaoDaRotina';
import { BotaoAcao, navegarAbas } from '../comum';
import { dinheiroCurto } from '../apresentar';
import { leituraDaPratica } from '../leituraPratica';
import { FichaPratica } from './Pratica';
import type { Aba } from '../navegacao';

/** Para onde leva a causa de um compromisso fixo (ele mora em outra área). */
const AREA_DA_ORIGEM: Partial<Record<Bloco['origem'], Aba>> = {
  escola: 'formacao', curso: 'formacao', estudo: 'formacao', trabalho: 'trabalho', paralela: 'trabalho', negocio: 'trabalho', politica: 'trabalho', prisao: 'trabalho', pena: 'trabalho',
  filhos: 'pessoas', cuidado: 'pessoas', pets: 'pessoas', trajeto: 'cidade'
};
const ROTULO_DA_ORIGEM: Record<Bloco['origem'], string> = {
  escola: 'Escola', curso: 'Curso', estudo: 'Estudo', trabalho: 'Trabalho', paralela: 'Trabalho por fora', negocio: 'Negócio', politica: 'Política', rotina: 'Atividade',
  filhos: 'Filhos', cuidado: 'Cuidado', pets: 'Bichos', prisao: 'Pena', pena: 'Pena', trajeto: 'Trajeto'
};
/** A família visual do bloco (a cor vem do tom de cada área — as quatro paletas). */
const FAMILIA: Record<Bloco['origem'], string> = {
  escola: 'estudo', curso: 'estudo', estudo: 'estudo', trabalho: 'trabalho', paralela: 'trabalho', negocio: 'trabalho', politica: 'trabalho', rotina: 'atividade',
  filhos: 'casa', cuidado: 'casa', pets: 'casa', prisao: 'pena', pena: 'pena', trajeto: 'trajeto'
};

/** As horas da régua (a cada duas, das 6h à meia-noite). */
const REGUA = Array.from({ length: (FECHA - ABRE) / 120 + 1 }, (_, k) => ABRE + k * 120);
const pos = (m: number) => `${((m - ABRE) / (FECHA - ABRE)) * 100}%`;
const alt = (de: number, ate: number) => `${((Math.min(ate, FECHA) - de) / (FECHA - ABRE)) * 100}%`;
/** Os horários que dá para escolher para uma atividade (de meia em meia hora). */
const HORAS_ESCOLHA = Array.from({ length: (22 * 60 - ABRE) / 30 + 1 }, (_, k) => ABRE + k * 30);

export function Agenda({ vida, agir, irPara, abrirPessoa }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; abrirPessoa?: (id: string) => void }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [ficha, setFicha] = useState<string | null>(null);
  const i = idade(vida);
  const a = agendaDaSemana(vida);
  // no celular, um dia de cada vez: abre no primeiro dia com um conflito, ou com um compromisso (não numa segunda vazia)
  const comConflito = a.conflitos.flatMap(c => c.dias);
  const ocupados = a.blocos.filter(b => b.origem !== 'trajeto').flatMap(b => b.dias);
  const [dia, setDia] = useState<Dia>(() => (comConflito.length ? Math.min(...comConflito) : ocupados.length ? Math.min(...ocupados) : 0) as Dia);
  const bloco = aberto ? a.blocos.find(b => b.id === aberto) : undefined;
  // REWORK 9.5: as horas livres são as da avaliação da rotina (a janela da idade) — um número só em Minha Semana.
  const folga = folgaNosHorarios(vida, a);
  const conflitoDe = (id: string) => a.conflitos.find(c => c.perde === id || c.perde === a.blocos.find(b => b.id === id)?.ref);
  const pratica = ficha ? vida.rotinas.find(r => r.id === ficha) : undefined;
  const lp = pratica ? leituraDaPratica(vida, pratica, DE_ESTUDOS.has(pratica.id) || DE_FORMACAO.has(pratica.id)) : undefined;
  const origens = [...new Set(a.blocos.map(b => FAMILIA[b.origem]))];
  const nomeFamilia: Record<string, string> = { estudo: 'Estudo', trabalho: 'Trabalho', atividade: 'Atividades', casa: 'Casa e família', pena: 'Pena', trajeto: 'Trajeto' };

  return (
    <section className="agenda agenda-semana" aria-labelledby="titulo-agenda">
      <header className="agenda-semana__cabeca">
        <h3 id="titulo-agenda" className="agenda__titulo">A agenda da semana</h3>
        {/* REWORK 9.5: a agenda diz só o que é dela (os compromissos e as horas); a exigência e a cabeça estão nas notas da rotina. */}
        <p className="agenda__ritmo">
          {a.blocos.filter(b => b.origem !== 'trajeto').length} {a.blocos.length === 1 ? 'compromisso' : 'compromissos'} · uns {folga.livres} h livres na semana ({folga.janela})
        </p>
        {origens.length > 1 && (
          <ul className="agenda-semana__legenda" aria-label="Legenda">
            {origens.map(o => <li key={o} className={`agenda-semana__chave agenda-semana__chave--${o}`}>{nomeFamilia[o]}</li>)}
          </ul>
        )}
      </header>

      {a.conflitos.length > 0 && (
        <div className="agenda-semana__conflitos" role="group" aria-label="Conflitos de horário">
          {a.conflitos.map(c => {
            const alts = alternativasDoConflito(vida, c, a);
            return (
              <div key={c.id} className="conflito-agenda">
                <p className="conflito-agenda__texto"><strong>Conflito de horário.</strong> {c.texto}</p>
                {alts.length > 0 && (
                  <div className="grupo-acoes grupo-acoes--linha conflito-agenda__saidas">
                    {alts.map(x => <BotaoAcao key={x.texto} vida={vida} acao={x.acao as Acao} agir={agir} variante="discreto">{x.texto}</BotaoAcao>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No celular, um dia de cada vez: a fileira de dias escolhe a coluna que aparece. */}
      <nav className="agenda-semana__dias" aria-label="Dia da agenda">
        <ul role="tablist" className="agenda-semana__dias-lista" onKeyDown={navegarAbas}>
          {TODOS.map(d => (
            <li key={d} role="presentation">
              <button type="button" role="tab" aria-selected={dia === d} tabIndex={dia === d ? 0 : -1} className={`agenda-semana__dia-botao${dia === d ? ' agenda-semana__dia-botao--ativo' : ''}`} onClick={() => setDia(d)} aria-label={`${DIAS[d]}: ${Math.round(a.livre[d] / 60)} h livres`}>
                <span>{DIAS_CURTOS[d]}</span>
                <span className="agenda-semana__dia-livre" aria-hidden>{Math.round(folga.porDia[d] / 60)}h</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grade-semana" data-dia={dia}>
        <div className="grade-semana__regua" aria-hidden>
          {REGUA.map(m => <span key={m} className="grade-semana__hora" style={{ top: pos(m) }}>{hora(m)}</span>)}
        </div>
        {TODOS.map(d => {
          const doDia = a.blocos.filter(b => b.dias.includes(d));
          return (
            <section key={d} className={`grade-semana__dia${d === dia ? ' grade-semana__dia--escolhido' : ''}${d >= 5 ? ' grade-semana__dia--fds' : ''}`} aria-label={`${DIAS[d]}${doDia.length ? '' : ': livre'}`}>
              <h4 className="grade-semana__nome">{DIAS_CURTOS[d]}<span className="grade-semana__livre"> · {Math.round(folga.porDia[d] / 60)}h livres</span></h4>
              <div className="grade-semana__corpo">
                {REGUA.map(m => <span key={m} className="grade-semana__linha" style={{ top: pos(m) }} aria-hidden />)}
                {doDia.map(b => {
                  const c = conflitoDe(b.id);
                  const perdeAqui = c && c.dias.includes(d) && c.tipo === 'sobreposicao';
                  // REWORK 11 · QA (D3): o bloco de 1 h não cabe em duas linhas (nome e horas) — vai em uma, como os curtos.
                  const curto = b.fim - b.inicio <= 60;
                  return (
                    <button key={`${b.id}${d}`} type="button" data-bloco={b.id}
                      className={`bloco-agenda bloco-agenda--${FAMILIA[b.origem]}${b.movel ? ' bloco-agenda--movel' : ''}${perdeAqui ? ' bloco-agenda--conflito' : ''}${b.alternado ? ' bloco-agenda--alternado' : ''}${curto ? ' bloco-agenda--curto' : ''}${aberto === b.id ? ' bloco-agenda--aberto' : ''}`}
                      style={{ top: pos(b.inicio), height: alt(b.inicio, b.fim) }}
                      onClick={() => setAberto(x => (x === b.id ? null : b.id))}
                      aria-expanded={aberto === b.id}
                      aria-label={`${b.rotulo}, ${DIAS[d]}, ${faixaDeHoras(b)}${perdeAqui ? ' — em conflito' : ''}`}>
                      <span className="bloco-agenda__nome">{b.rotulo.replace(/ — .*/, '').replace(/ \(.*\)$/, '')}</span>
                      {!curto && <span className="bloco-agenda__horas">{faixaDeHoras(b)}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {bloco && <DetalheDoBloco vida={vida} b={bloco} agir={agir} irPara={irPara} abrirFicha={id => setFicha(id)} fechar={() => setAberto(null)} />}

      {i >= 4 && i < 18 && vida.educacao.basica && <p className="nota agenda-semana__nota">Nas férias (o fim do ano e o meio do ano), as aulas saem da semana; a agenda mostra a semana de aula.</p>}

      {lp && <FichaPratica vida={vida} l={lp} agir={agir} aoFechar={() => setFicha(null)} irPara={irPara} abrirPessoa={abrirPessoa} />}
    </section>
  );
}

/** A ficha de um compromisso: de onde vem, até quando, o que faz, quanto custa — e o que dá para mudar nele. */
function DetalheDoBloco({ vida, b, agir, irPara, abrirFicha, fechar }: { vida: Vida; b: Bloco; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; abrirFicha: (id: string) => void; fechar: () => void }) {
  const f = fichaDoBloco(vida, b, (id, n) => custoDaRotina(vida, id, n));
  const ref = b.ref ?? b.id;
  const rot = b.movel ? vida.rotinas.find(r => r.id === ref) : undefined;
  // O estudo em casa (a dedicação) também tem lugar escolhido — dias e hora — como uma atividade.
  const remarcavel = !!rot || ref === 'estudo_casa' || ref === 'curso_ead';
  const lugar = vida.agenda?.lugares?.[ref];
  const doMesmo = agendaDaSemana(vida).blocos.filter(x => (x.ref ?? x.id) === ref);
  const [dias, setDias] = useState<Dia[]>(lugar?.dias ?? doMesmo.flatMap(x => x.dias));
  const [inicio, setInicio] = useState<number>(lugar?.inicio ?? b.inicio);
  const lp = rot ? leituraDaPratica(vida, rot, DE_ESTUDOS.has(rot.id) || DE_FORMACAO.has(rot.id)) : undefined;
  const area = AREA_DA_ORIGEM[b.origem];
  const nivel = lp?.nivel;
  const podeMudarNivel = lp && !lp.daFormacao;
  const mais = podeMudarNivel && nivel && nivel < 3 ? lp!.niveis.find(q => q.n === nivel + 1) : undefined;
  const menos = podeMudarNivel && nivel && nivel > 1 ? lp!.niveis.find(q => q.n === nivel - 1) : undefined;
  return (
    <section className="detalhe-agenda" aria-label={`Compromisso: ${b.rotulo}`}>
      <header className="detalhe-agenda__cabeca">
        <p className="detalhe-agenda__tipo">{ROTULO_DA_ORIGEM[b.origem]}{f.obrigatorio ? ' · obrigatório' : ' · escolhido por você'}</p>
        <h4 className="detalhe-agenda__titulo">{b.rotulo}</h4>
        <button type="button" className="botao botao--discreto detalhe-agenda__fechar" onClick={fechar} aria-label="Fechar o compromisso">Fechar</button>
      </header>
      <dl className="detalhe-agenda__dados">
        <div><dt>Quando</dt><dd>{doMesmo.map(x => quando(x)).join('; ')}{b.alternado ? ' (alternado)' : ''}</dd></div>
        <div><dt>Na semana</dt><dd>{doMesmo.reduce((s2, x) => s2 + fichaDoBloco(vida, x).horas, 0).toString().replace('.', ',')} h{b.vezes ? ` · ${b.vezes} ${b.vezes === 1 ? 'vez' : 'vezes'}` : ''}</dd></div>
        <div><dt>De onde vem</dt><dd>{f.origem}</dd></div>
        <div><dt>O que faz</dt><dd>{f.efeito}</dd></div>
        <div><dt>Até quando</dt><dd>{f.termina}</dd></div>
        {f.custo !== undefined && f.custo > 0 && <div><dt>Custo</dt><dd>{dinheiroCurto(f.custo)}/mês</dd></div>}
      </dl>

      {b.turnos && b.turnos.length > 1 && b.fonteDoTurno && (
        <div className="grupo-acoes grupo-acoes--linha" aria-label="Turno">
          <span className="rotulo-pequeno">Turno: {b.turno ? PALAVRA_TURNO[b.turno] : '—'}</span>
          {b.turnos.filter(t => t !== b.turno).map(t => <BotaoAcao key={t} vida={vida} acao={{ tipo: 'agenda', op: { oque: 'turno', fonte: b.fonteDoTurno!, turno: t } }} agir={agir} variante="discreto">{`Passar para a ${PALAVRA_TURNO[t]}`}</BotaoAcao>)}
        </div>
      )}

      {remarcavel && (
        <fieldset className="detalhe-agenda__mudar">
          <legend>Dias e horário</legend>
          <div className="detalhe-agenda__dias" role="group" aria-label="Dias">
            {TODOS.map(d => (
              <label key={d} className={`detalhe-agenda__dia${dias.includes(d) ? ' detalhe-agenda__dia--sim' : ''}`}>
                <input type="checkbox" checked={dias.includes(d)} onChange={e => setDias(x => (e.target.checked ? [...x, d].sort() as Dia[] : x.filter(y => y !== d)))} />
                {DIAS_CURTOS[d]}
              </label>
            ))}
          </div>
          <label className="detalhe-agenda__hora">Começa às{' '}
            <select value={inicio} onChange={e => setInicio(Number(e.target.value))}>
              {HORAS_ESCOLHA.map(m => <option key={m} value={m}>{hora(m)}</option>)}
            </select>
          </label>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'agenda', op: { oque: 'mover', id: ref, dias, inicio } }} agir={agir} variante="secundario">Marcar nesse horário</BotaoAcao>
            {lugar && <BotaoAcao vida={vida} acao={{ tipo: 'agenda', op: { oque: 'soltar', id: ref } }} agir={agir} variante="discreto">Voltar ao encaixe automático</BotaoAcao>}
          </div>
        </fieldset>
      )}

      <div className="grupo-acoes grupo-acoes--linha">
        {menos && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: ref, ativa: true, nivel: menos.n }} agir={agir} variante="discreto" ocultarBloqueado>Mais leve: {menos.rotulo.toLowerCase()}</BotaoAcao>}
        {mais && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: ref, ativa: true, nivel: mais.n }} agir={agir} variante="discreto" ocultarBloqueado>Mais a sério: {mais.rotulo.toLowerCase()}</BotaoAcao>}
        {lp && <button type="button" className="botao botao--discreto" onClick={() => abrirFicha(ref)}>Abrir a ficha da prática</button>}
        {ref === 'estudo_casa' && <BotaoAcao vida={vida} acao={{ tipo: 'postura', valor: 'normal' }} agir={agir} variante="discreto">Estudar no ritmo (tirar as horas a mais)</BotaoAcao>}
        {(!b.movel || ref === 'estudo_casa') && area && irPara && <button type="button" className="botao botao--discreto" onClick={() => irPara(area)}>Ver onde isso mora →</button>}
      </div>
    </section>
  );
}
