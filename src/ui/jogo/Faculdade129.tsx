/**
 * VIDA 12.9 · Estudos — a faculdade, de ponta a ponta (pacote sob demanda).
 *
 * `MinhaFaculdade129`: o curso em andamento como um cartão próprio — a instituição (a sigla, o campus, a cidade), o
 * curso, os SEMESTRES (dois por ano letivo, com o atraso das reprovações à vista), o turno, o custo, o desempenho, as
 * reprovações diante do limite do regimento, os últimos períodos com as notas, e o que dá para fazer: a dependência nas
 * férias, trocar de curso, trancar, voltar, abandonar (com a conta do FIES dita antes).
 *
 * `Ingresso129`: entrar numa graduação — escolher o curso, ver onde ele é oferecido (instituições reais do Brasil, campus
 * por campus, públicas e particulares, perto ou longe), o processo de cada uma (Fuvest, SISU, vestibular próprio...) com a
 * chance de hoje, o turno, e candidatar-se; o resultado aparece com as notas de cada fase. Fora do Brasil, ou num curso
 * sem instituição no catálogo, as vias gerais de sempre.
 *
 * Tudo o que se mostra sai do motor (`sistemas/estudos129`): a tela não inventa nota, corte nem mensalidade.
 */
import { useMemo, useState } from 'react';
import type { Matricula, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { BotaoAcao } from '../comum';
import { CURSOS, cursoOuNulo, ROTULO_AREA, type AreaFormacao, type Curso } from '../../motor/dados/cursos';
import { nomeLugar } from '../../motor/dados/lugares';
import { anoDe } from '../../motor/tempo';
import { dinheiroCurto, palavraChance, palavraDesempenho } from '../apresentar';
import { podeTentar } from '../../motor/plausibilidade';
import { educacaoDaVida } from '../../motor/mundo/vida';
import { custoDoEstudo } from '../../motor/sistemas/custoDoEstudo';
import { escalaDeNotas, nomeDaMatricula, notaNaEscala } from '../../motor/sistemas/escola';
import { agendaDaSemana } from '../../motor/sistemas/agenda';
import { consequenciasDaMudanca } from '../../motor/sistemas/processos';
import {
  chanceDaDependencia129, custoDaDependencia129, dividaProporcional129, instituicaoDaMatricula129, leituraDoCurso129, limiteDeReprovacoes129,
  nomeDaInstituicao129, ondeHa129, opcoes129, palavraSeletividade129, PALAVRA_TURNO_129, PROCESSOS_129, reprovadasDoUltimoAno129, ROTULO_TIPO_129,
  semestres129, trocasInternas129, type Opcao129, type Turno129
} from '../../motor/sistemas/estudos129';
import { paisDaVida } from '../../motor/mundo/vida';
import { formatarDinheiroCheio } from '../../motor/mundo/moeda';
import '../estudos129.css';

type Agir = (a: Acao) => boolean;

const NIVEL_129: Record<string, string> = { livre: 'Qualificação', tecnico: 'Curso técnico', superior: 'Faculdade', pos: 'Pós-graduação', mestrado: 'Mestrado', doutorado: 'Doutorado', residencia: 'Residência médica' };

/** A sigla (ou a inicial) da instituição, para o selo. */
function sigla(m: Matricula): string {
  const real = instituicaoDaMatricula129(m);
  if (real) return real.inst.sigla;
  const limpo = m.instituicao.replace(/^(a|o|uma|um) /i, '').replace(/^(universidade|faculdade|instituto|centro|escola)( (federal|estadual|técnica|particular|de|do|da))*\s*/i, '');
  return (limpo.charAt(0) || 'U').toUpperCase();
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtNota = (vida: Vida, n10: number) => { const e = escalaDeNotas(vida); const x = notaNaEscala(vida, n10); return e.casas ? x.toFixed(1).replace('.', ',') : String(x); };

/** O custo do curso, em palavras (a mesma fonte do extrato: `custoDoEstudo`). */
export function textoDoCusto129(vida: Vida, m: Matricula): string {
  const ce = custoDoEstudo(vida, m);
  if (!ce) return '—';
  const credito = (educacaoDaVida(vida).credito?.nome ?? 'crédito estudantil').replace(/^(o|a) /, '');
  if (ce.regime === 'gratuita') return 'sem mensalidade';
  if (ce.regime === 'bolsa_integral') return m.bolsaAtleta ? 'bolsa de atleta integral' : 'bolsa integral: nada a pagar';
  if (ce.bolsa) return `${dinheiroCurto(Math.round(m.mensalidade * (1 - ce.bolsa)))}/mês, com bolsa de atleta de ${Math.round(ce.bolsa * 100)}%`;
  if (ce.regime === 'credito') return `${dinheiroCurto(m.mensalidade)}/mês pelo ${credito}: paga depois`;
  return ce.daFamilia > 0 ? `${dinheiroCurto(m.mensalidade)}/mês · a família põe ${dinheiroCurto(ce.daFamilia)}` : `${dinheiroCurto(m.mensalidade)}/mês`;
}

/* ================================================================ O curso em andamento */

export function MinhaFaculdade129({ vida, agir, irPara }: { vida: Vida; agir: Agir; irPara?: (a: 'historico_academico' | 'desenvolvimento') => void }) {
  const m = vida.educacao.matricula;
  const [trocar, setTrocar] = useState(false);
  if (!m) return null;
  const c = cursoOuNulo(m.cursoId);
  if (!c) return null;
  const real = instituicaoDaMatricula129(m);
  const sem = semestres129(vida, m);
  const curto = c.meses < 12;
  const bloco = !m.trancado && m.modalidade === 'presencial' ? agendaDaSemana(vida).blocos.find(b => b.id === 'curso') : undefined;
  const turno = (bloco?.turno ?? (c.carga === 'integral' ? 'integral' : undefined)) as Turno129 | undefined;
  const rep = m.reprovacoes ?? 0;
  const limite = limiteDeReprovacoes129(c);
  const formatura = anoDe(vida.t + m.mesesRestantes);
  const leitura = leituraDoCurso129(vida, m);
  const ultimos = sem.periodos.slice(-2);
  const reprovadas = reprovadasDoUltimoAno129(vida, m);
  const fies = dividaProporcional129(vida, m);
  const kicker = [NIVEL_129[c.nivel] ?? 'Curso', real ? ROTULO_TIPO_129[real.inst.tipo] : m.rede === 'publica' ? 'pública' : 'particular', m.modalidade === 'ead' ? 'a distância' : 'presencial'].join(' · ');
  return (
    <section className={`fac129${m.trancado ? ' fac129--trancado' : ''}`} aria-labelledby="fac129-titulo" data-curso129={c.id}>
      <header className="fac129__cabeca">
        <span className="fac129__selo" aria-hidden>{sigla(m)}</span>
        <div className="fac129__ident">
          <p className="fac129__kicker">{kicker}</p>
          <h2 id="fac129-titulo" className="fac129__titulo">{nomeDaMatricula(vida, m)}</h2>
          <p className="fac129__onde">{real ? nomeDaInstituicao129(real.inst, real.campus) : cap(m.instituicao)}{m.modalidade === 'presencial' ? ` · ${nomeLugar(m.municipioId)}` : ''}</p>
        </div>
      </header>

      {m.trancado ? (
        <p className="fac129__estado" role="status">Matrícula trancada desde {anoDe(m.tTrancou ?? vida.t)}. A vaga espera até {anoDe((m.tTrancou ?? vida.t) + 48)}; depois, a instituição cancela.</p>
      ) : curto ? (
        <p className="fac129__estado">{m.mesesRestantes <= 12 ? 'Termina no fim deste ano.' : `Faltam uns ${m.mesesRestantes} meses.`}</p>
      ) : (
        <div className="fac129__progresso" role="group" aria-label="Andamento do curso em semestres">
          <div className="fac129__trilho" aria-hidden>
            {Array.from({ length: Math.min(sem.total, 20) }, (_, k) => {
              const n = k + 1;
              const estado = n < sem.atual ? 'feito' : n <= sem.esteAno[1] ? 'agora' : 'falta';
              return <span key={k} className={`fac129__seg fac129__seg--${estado}${n > sem.previstos ? ' fac129__seg--atraso' : ''}`} />;
            })}
          </div>
          <p className="fac129__semestre"><strong>{sem.esteAno[0] === sem.esteAno[1] ? `${sem.atual}º semestre` : `${sem.esteAno[0]}º e ${sem.esteAno[1]}º semestres`}</strong> de {sem.total} · formatura prevista em {formatura}</p>
          {sem.atraso > 0 && <p className="fac129__atraso">{sem.atraso === 1 ? 'Um semestre a mais' : `${sem.atraso} semestres a mais`} por reprovação.</p>}
        </div>
      )}

      <dl className="fac129__fichas">
        <div className="fac129__ficha"><dt>Turno</dt><dd>{m.modalidade === 'ead' ? 'a distância, no seu tempo' : turno ? (turno === 'integral' ? 'integral (manhã e tarde)' : PALAVRA_TURNO_129[turno]) : '—'}</dd></div>
        <div className="fac129__ficha"><dt>Custo</dt><dd>{textoDoCusto129(vida, m)}</dd></div>
        {!m.trancado && <div className="fac129__ficha"><dt>Desempenho</dt><dd>{palavraDesempenho(m.desempenho)}</dd></div>}
        <div className={`fac129__ficha${rep >= limite - 2 && rep > 0 ? ' fac129__ficha--alerta' : ''}`}><dt>Reprovações</dt><dd>{rep ? `${rep} de ${limite} toleradas` : 'nenhuma'}</dd></div>
      </dl>

      {!m.trancado && m.modalidade === 'presencial' && c.carga !== 'integral' && c.id !== 'residencia' && m.inst129?.turno !== 'integral' && (
        <div className="fac129__turnos" role="group" aria-label="Mudar de turno">
          <span className="fac129__rotulo">Turno das aulas</span>
          {(['manha', 'tarde', 'noite'] as const).map(t => (
            <button key={t} type="button" className="fac129__pilula" aria-pressed={turno === t} disabled={turno === t} onClick={() => agir({ tipo: 'agenda', op: { oque: 'turno', fonte: 'curso', turno: t } })}>{PALAVRA_TURNO_129[t]}</button>
          ))}
        </div>
      )}

      {leitura.length > 0 && <ul className="fac129__leitura">{leitura.map((x, k) => <li key={k}>{x}</li>)}</ul>}

      {ultimos.length > 0 && (
        <div className="fac129__periodos" aria-label="Os últimos semestres">
          {ultimos.map(p => (
            <article key={`${p.ano}-${p.rotulo}`} className="fac129__periodo">
              <header><strong>{p.rotulo}</strong> <span>{p.ano}{p.media !== undefined ? ` · média ${fmtNota(vida, p.media)}` : ''}</span></header>
              <ul>{p.disciplinas.map(d => (
                <li key={d.nome} data-situacao={d.situacao}><span>{d.nome}</span><span className={`fac129__nota${d.situacao === 'reprovada' ? ' fac129__nota--baixa' : ''}`}>{fmtNota(vida, d.nota)}{d.rec ? ' · exame final' : d.situacao === 'reprovada' ? ' · reprovada' : ''}</span></li>
              ))}</ul>
            </article>
          ))}
          {irPara && <button type="button" className="link fac129__mais" onClick={() => irPara('historico_academico')}>O histórico acadêmico inteiro →</button>}
        </div>
      )}
      {!ultimos.length && !m.trancado && !curto && <p className="fac129__vazio">O primeiro ano letivo ainda não fechou: as notas dos dois primeiros semestres aparecem no fim do ano.</p>}

      <div className="fac129__acoes">
        {reprovadas.length > 0 && !m.trancado && (
          <div className="fac129__acao">
            <BotaoAcao vida={vida} acao={{ tipo: 'estudos129', oque: 'dependencia' }} agir={agir} variante="secundario" mostrarChance>Refazer nas férias (dependência)</BotaoAcao>
            <p className="fac129__porque">{reprovadas.join(', ')}: passando, o semestre de atraso volta.{custoDaDependencia129(m, reprovadas.length) > 0 ? ` Custa ${dinheiroCurto(custoDaDependencia129(m, reprovadas.length))}.` : ''} Chance de hoje: {palavraChance(chanceDaDependencia129(vida, m)).toLowerCase()}.</p>
          </div>
        )}
        {!m.trancado && (c.nivel === 'superior' || c.nivel === 'tecnico') && (
          <button type="button" className="botao botao--secundario fac129__trocar" aria-expanded={trocar} onClick={() => setTrocar(x => !x)}>{trocar ? 'Fechar a troca de curso' : 'Trocar de curso'}</button>
        )}
        {!m.trancado && <BotaoAcao vida={vida} acao={{ tipo: 'trancar' }} agir={agir} variante="discreto">Trancar o curso</BotaoAcao>}
        {m.trancado && <BotaoAcao vida={vida} acao={{ tipo: 'destrancar' }} agir={agir} variante="principal">Voltar ao curso</BotaoAcao>}
        <div className="fac129__acao">
          <BotaoAcao vida={vida} acao={{ tipo: 'abandonar_curso' }} agir={agir} variante="perigo">Abandonar o curso</BotaoAcao>
          {fies > 0 && <p className="fac129__porque fac129__porque--alerta">Ao sair, o {(educacaoDaVida(vida).credito?.nome ?? 'crédito estudantil').replace(/^(o|a) /, '')} do que foi cursado vira dívida: uns {dinheiroCurto(fies)}.</p>}
        </div>
      </div>
      {trocar && !m.trancado && <TrocaDeCurso129 vida={vida} agir={agir} />}
    </section>
  );
}

/* ================================================================ Troca de curso */

function TrocaDeCurso129({ vida, agir }: { vida: Vida; agir: Agir }) {
  const internas = useMemo(() => trocasInternas129(vida), [vida]);
  const [outra, setOutra] = useState(false);
  const m = vida.educacao.matricula!;
  const real = instituicaoDaMatricula129(m);
  const possiveis = internas.filter(x => x.veredito.grau !== 'impossivel');
  return (
    <section className="fac129-troca" aria-labelledby="fac129-troca-titulo" data-troca129>
      <h3 id="fac129-troca-titulo" className="fac129-troca__titulo">Trocar de curso</h3>
      <p className="fac129-troca__lede">Dois caminhos: a <strong>transferência interna</strong> ({real ? `${real.inst.sigla}, mesmo campus` : 'a mesma instituição'}), que aproveita parte das disciplinas; ou um <strong>processo seletivo</strong> para outro curso, em qualquer lugar — o curso de agora só fecha quando a matrícula nova for confirmada.</p>
      {possiveis.length > 0 ? (
        <ul className="fac129-troca__lista">
          {possiveis.slice(0, 12).map(x => (
            <li key={x.curso.id} className="fac129-troca__item">
              <div>
                <strong>{x.curso.nome}</strong>
                <span>{x.aproveita ? `aproveita ${x.aproveita} meses` : 'começa do início'} · {x.mensalidade > 0 ? `${dinheiroCurto(x.mensalidade)}/mês` : 'sem mensalidade'}</span>
              </div>
              <BotaoAcao vida={vida} acao={{ tipo: 'estudos129', oque: 'trocar_interna', cursoId: x.curso.id }} agir={agir} variante="secundario" mostrarChance>Pedir transferência</BotaoAcao>
            </li>
          ))}
        </ul>
      ) : <p className="fac129__vazio">Não há outro curso do mesmo nível onde você estuda.</p>}
      <button type="button" className="botao botao--discreto" aria-expanded={outra} onClick={() => setOutra(x => !x)}>{outra ? 'Fechar o processo seletivo' : 'Prestar um processo seletivo para outro curso'}</button>
      {outra && <Ingresso129 vida={vida} agir={agir} troca />}
    </section>
  );
}

/* ================================================================ Entrar na faculdade */

const MIRAS = ['medicina', 'direito', 'computacao', 'eng_civil', 'psicologia', 'administracao', 'enfermagem', 'arquitetura'];

/** A distância de um lugar para quem mora aqui: a mesma cidade, o mesmo estado, outro estado. */
function perto(vida: Vida, municipioId: string): 0 | 1 | 2 {
  if (municipioId === vida.moradia.municipioId) return 0;
  const uf = (id: string) => id.slice(-2);
  return uf(municipioId) === uf(vida.moradia.municipioId) ? 1 : 2;
}
const ROTULO_PERTO = ['na sua cidade', 'no seu estado', 'outro estado · mudança'];

export function Ingresso129({ vida, agir, troca = false }: { vida: Vida; agir: Agir; troca?: boolean }) {
  const graduacoes = useMemo(() => CURSOS.filter(c => c.nivel === 'superior'), []);
  const objetivo = vida.educacao.objetivo?.cursoId;
  const [cursoId, setCursoId] = useState<string | undefined>(objetivo && graduacoes.some(c => c.id === objetivo) ? objetivo : undefined);
  const [busca, setBusca] = useState('');
  const [rede, setRede] = useState<'todas' | 'publica' | 'privada'>('todas');
  const [turno, setTurno] = useState<Turno129>('noite');
  const [todas, setTodas] = useState(false);
  const pais = paisDaVida(vida);
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const xs = q ? graduacoes.filter(c => `${c.nome} ${ROTULO_AREA[c.area as AreaFormacao] ?? ''} ${c.descricao}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)) : graduacoes;
    const peso = (c: Curso) => (c.id === objetivo ? -2 : MIRAS.includes(c.id) ? -1 : 0);
    return [...xs].sort((a, b) => peso(a) - peso(b) || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [busca, graduacoes, objetivo]);
  const ultimo = [...(vida.educacao.processos129 ?? [])].reverse().find(p => vida.t - p.t < 12);
  return (
    <div className="fac129-ingresso" data-ingresso129={troca ? 'troca' : 'entrar'}>
      {ultimo && <ResultadoDoProcesso129 vida={vida} p={ultimo} />}
      <div className="fac129-ingresso__busca">
        <label className="fac129__rotulo" htmlFor={`fac129-busca${troca ? '-t' : ''}`}>1 · O curso</label>
        <input id={`fac129-busca${troca ? '-t' : ''}`} type="search" className="campo fac129-ingresso__campo" placeholder="direito, medicina, engenharia…" value={busca} onChange={e => setBusca(e.target.value)} />
      </div>
      {lista.length === 0 && <p className="fac129__vazio">Nenhuma graduação com esse nome. Tente a área (saúde, engenharia, comunicação).</p>}
      <ul className="fac129-cursos" aria-label="As graduações">
        {lista.map(c => {
          const aberto = cursoId === c.id;
          const n = new Set(ondeHa129(pais, c.id).map(x => x.inst.id)).size;
          return (
            <li key={c.id} className={`fac129-curso${aberto ? ' fac129-curso--aberto' : ''}`} data-curso129={c.id}>
              <button type="button" className="fac129-curso__cabeca" aria-expanded={aberto} onClick={() => setCursoId(aberto ? undefined : c.id)}>
                <span className="fac129-curso__nome">{c.nome}</span>
                <span className="fac129-curso__meta">{c.meses / 12} anos{c.carga === 'integral' ? ' · integral' : ''}{n ? ` · ${n} ${n === 1 ? 'instituição' : 'instituições'}` : ''}{c.id === objetivo ? ' · seu objetivo' : ''}</span>
              </button>
              {aberto && <OndeEstudar129 vida={vida} agir={agir} curso={c} troca={troca} rede={rede} setRede={setRede} turno={turno} setTurno={setTurno} todas={todas} setTodas={setTodas} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Onde o curso é oferecido: as instituições (com o campus e o processo) e as vias gerais. */
function OndeEstudar129({ vida, agir, curso: c, troca, rede, setRede, turno, setTurno, todas, setTodas }: {
  vida: Vida; agir: Agir; curso: Curso; troca: boolean; rede: 'todas' | 'publica' | 'privada'; setRede: (r: 'todas' | 'publica' | 'privada') => void;
  turno: Turno129; setTurno: (t: Turno129) => void; todas: boolean; setTodas: (b: boolean) => void;
}) {
  const ops = useMemo(() => opcoes129(vida, c.id, troca), [vida, c.id, troca]);
  const doCatalogo = ops.filter(o => o.inst && (rede === 'todas' || o.rede === rede));
  const gerais = ops.filter(o => !o.inst);
  // Agrupa por instituição + campus, do mais perto ao mais longe; empatando, as mais disputadas antes.
  const grupos = new Map<string, Opcao129[]>();
  for (const o of doCatalogo) { const k = `${o.inst!.id}:${o.campus!.id}`; grupos.set(k, [...(grupos.get(k) ?? []), o]); }
  const ordenados = [...grupos.values()].sort((a, b) => perto(vida, a[0].municipioId) - perto(vida, b[0].municipioId) || Number(podeTentar(b[0].veredito)) - Number(podeTentar(a[0].veredito)) || a[0].inst!.sigla.localeCompare(b[0].inst!.sigla));
  const visiveis = todas ? ordenados : ordenados.slice(0, 6);
  const temCatalogo = ops.some(o => o.inst);
  const turnos = c.carga === 'integral' ? [] : (['manha', 'tarde', 'noite'] as const);
  return (
    <div className="fac129-onde">
      <p className="fac129-onde__descricao">{c.descricao} Corte de referência no jogo: ~{c.corte} pontos (a instituição soma a sua disputa).</p>
      {temCatalogo && (
        <div className="fac129-onde__filtros" role="group" aria-label="Filtrar as instituições">
          <span className="fac129__rotulo">2 · Onde</span>
          {(['todas', 'publica', 'privada'] as const).map(r => (
            <button key={r} type="button" className="fac129__pilula" aria-pressed={rede === r} onClick={() => setRede(r)}>{r === 'todas' ? 'Todas' : r === 'publica' ? 'Públicas' : 'Particulares'}</button>
          ))}
        </div>
      )}
      {turnos.length > 0 && (
        <div className="fac129-onde__filtros" role="group" aria-label="O turno pretendido">
          <span className="fac129__rotulo">Turno</span>
          {turnos.map(t => <button key={t} type="button" className="fac129__pilula" aria-pressed={turno === t} onClick={() => setTurno(t)}>{PALAVRA_TURNO_129[t]}</button>)}
        </div>
      )}
      {temCatalogo && visiveis.length === 0 && <p className="fac129__vazio">Nenhuma {rede === 'publica' ? 'pública' : 'particular'} do catálogo oferece {c.nome} nas cidades do jogo.</p>}
      <ul className="fac129-inst">
        {visiveis.map(g => {
          const o = g[0];
          const i = o.inst!, campus = o.campus!;
          const d = perto(vida, o.municipioId);
          const efeitos = d > 0 ? consequenciasDaMudanca(vida, o.municipioId) : [];
          return (
            <li key={`${i.id}:${campus.id}`} className="fac129-inst__item" data-inst129={i.id}>
              <header className="fac129-inst__cabeca">
                <span className="fac129__selo fac129__selo--mini" aria-hidden>{i.sigla}</span>
                <div>
                  <strong className="fac129-inst__nome">{nomeDaInstituicao129(i, campus)}</strong>
                  <span className="fac129-inst__meta">{ROTULO_TIPO_129[i.tipo]} · {nomeLugar(o.municipioId)} <em className={`fac129-inst__perto fac129-inst__perto--${d}`}>{ROTULO_PERTO[d]}</em></span>
                </div>
              </header>
              <p className="fac129-inst__fatos">
                <span>{cap(palavraSeletividade129(i))}</span>
                {o.turnos.length > 0 && <span>{o.turnos.length === 1 && o.turnos[0] === 'integral' ? 'período integral' : `turnos: ${o.turnos.map(t => PALAVRA_TURNO_129[t]).join(', ')}`}</span>}
                {i.duracoes?.[c.id] && <span>{i.duracoes[c.id]! / 6} semestres</span>}
                <span>{o.rede === 'publica' ? 'sem mensalidade' : o.mensalidadeVerificada ? `${formatarDinheiroCheio(Math.round(o.mensalidadeVerificada.valor))}/mês (referência ${o.mensalidadeVerificada.ano}${o.mensalidadeVerificada.fraca ? ', a confirmar' : ''})` : `~${dinheiroCurto(o.mensalidade)}/mês (estimativa do jogo para o curso)`}</span>
              </p>
              {efeitos.length > 0 && <details className="fac129-inst__mudanca"><summary>O que muda ao se mudar</summary><ul>{efeitos.map((x, k) => <li key={k}>{x}</li>)}</ul></details>}
              <ul className="fac129-proc">
                {g.map(p => (
                  <li key={p.chave} className="fac129-proc__item" data-processo={p.processo}>
                    <div className="fac129-proc__texto">
                      <strong>{p.nomeProcesso}</strong>
                      <span>{PROCESSOS_129[p.processo as keyof typeof PROCESSOS_129]?.descricao}</span>
                      {p.esperada !== undefined && p.corte !== undefined && podeTentar(p.veredito) && <span className="fac129-proc__nota">Hoje: ~{p.esperada} · corte ~{p.corte}</span>}
                    </div>
                    <BotaoAcao vida={vida} acao={{ tipo: 'estudos129', oque: 'candidatar', chave: p.chave, turno: c.carga === 'integral' ? 'integral' : turno, ...(troca ? { troca: true } : {}) }} agir={agir} variante={podeTentar(p.veredito) && (p.veredito.chance ?? 0) >= 0.3 ? 'principal' : 'secundario'} mostrarChance>Candidatar-se</BotaoAcao>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      {!todas && ordenados.length > visiveis.length && <button type="button" className="botao botao--discreto" onClick={() => setTodas(true)}>Ver mais {ordenados.length - visiveis.length} {ordenados.length - visiveis.length === 1 ? 'instituição' : 'instituições'}</button>}
      {gerais.length > 0 && (
        <div className="fac129-gerais">
          <p className="fac129__rotulo">{temCatalogo ? 'Outras vias' : 'As vias'}</p>
          <ul className="fac129-proc">
            {gerais.map(p => (
              <li key={p.chave} className="fac129-proc__item" data-processo={p.processo}>
                <div className="fac129-proc__texto">
                  <strong>{p.nomeProcesso}</strong>
                  <span>{p.modalidade === 'ead' ? 'de casa' : nomeLugar(p.municipioId)} · {p.mensalidade > 0 ? `${dinheiroCurto(p.mensalidade)}/mês` : p.processo === 'fies' ? 'paga depois de formado' : 'sem mensalidade'}</span>
                  {p.observacao && <span className="fac129-proc__obs">{p.observacao}</span>}
                </div>
                <BotaoAcao vida={vida} acao={{ tipo: 'estudos129', oque: 'candidatar', chave: p.chave, ...(troca ? { troca: true } : {}) }} agir={agir} variante="secundario" mostrarChance>{c.nivel === 'livre' ? 'Inscrever-se' : 'Candidatar-se'}</BotaoAcao>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!ops.length && <p className="fac129__vazio">Este curso não existe nas cidades e nas vias ao seu alcance.</p>}
    </div>
  );
}

/** O resultado de um processo seletivo: as fases, as notas, o corte, aprovado ou não. */
function ResultadoDoProcesso129({ vida, p }: { vida: Vida; p: NonNullable<Vida['educacao']['processos129']>[number] }) {
  const c = cursoOuNulo(p.cursoId);
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
  return (
    <article className={`fac129-res fac129-res--${p.aprovado ? 'aprovado' : 'reprovado'}`} aria-label={`Resultado: ${p.nome}`} data-resultado129={p.aprovado ? 'aprovado' : 'reprovado'}>
      <header className="fac129-res__cabeca">
        <span className="fac129-res__selo">{p.aprovado ? 'Aprovação' : 'Não foi desta vez'}</span>
        <strong>{p.nome} · {c?.nome ?? p.cursoId}</strong>
        <span className="fac129-res__onde">{p.instituicao} · {anoDe(p.t)}</span>
      </header>
      {p.fases.length > 0 && (
        <ol className="fac129-res__fases">
          {p.fases.map((f, k) => (
            <li key={k} className={f.passou ? 'passou' : 'nao'}>
              <span className="fac129-res__fase">{f.nome}</span>
              <span className="fac129-res__nota"><strong>{fmt(f.nota)}</strong> de {f.max}{f.corte !== undefined ? ` · corte ${fmt(f.corte)}` : ''}</span>
              <div className="fac129-res__barra" aria-hidden><span style={{ width: `${Math.min(100, (f.nota / f.max) * 100)}%` }} />{f.corte !== undefined && <i style={{ left: `${Math.min(100, (f.corte / f.max) * 100)}%` }} />}</div>
            </li>
          ))}
        </ol>
      )}
      {p.nota && <p className="fac129-res__nota-final">{cap(p.nota)}.{p.aprovado && vida.educacao.aprovacao ? ' A vaga espera a sua confirmação (acima).' : ''}</p>}
    </article>
  );
}
