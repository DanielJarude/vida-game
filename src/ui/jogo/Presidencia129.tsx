/**
 * VIDA 12.9 · A Presidência no painel político (sob demanda): as regras do país e o que falta para disputar, a corrida
 * (a pesquisa com cada adversário, as etapas, o segundo turno), o governo do país (a economia, a base no Congresso, o
 * mundo, a tensão com os Poderes, os eixos, a reforma, as conquistas, o impeachment) e a história (as candidaturas e o
 * legado de cada mandato). Tudo lido de `leituraPresidencial` — a tela não faz conta.
 */
import type { Vida } from '../../motor/tipos';
import { leituraPresidencial, type LeituraPresidencial } from '../../motor/sistemas/presidencia129';
import { partidoDe } from '../../motor/dados/partidos';
import '../presidencia129.css';

const n = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');
const ETAPAS = ['Indicação', 'Chapa', 'Promessa', 'Estratégia', 'Debate', 'Reta final'];

function Indicador({ rotulo, valor, sufixo = '%', antes, melhorSobe }: { rotulo: string; valor: number; sufixo?: string; antes?: number; melhorSobe?: boolean }) {
  const d = antes === undefined ? 0 : Math.round((valor - antes) * 10) / 10;
  const bom = d === 0 || melhorSobe === undefined ? undefined : (d > 0) === melhorSobe;
  return (
    <div className={`pres129__ind${bom === undefined ? '' : bom ? ' pres129__ind--bom' : ' pres129__ind--ruim'}`}>
      <span className="pres129__ind-rotulo">{rotulo}</span>
      <span className="pres129__ind-valor">{n(valor)}{sufixo}</span>
      {antes !== undefined && d !== 0 && <span className="pres129__ind-delta">{d > 0 ? '▲' : '▼'} {n(Math.abs(d))} desde a posse</span>}
    </div>
  );
}

function Barra({ rotulo, valor, palavra }: { rotulo: string; valor: number; palavra: string }) {
  return (
    <div className="pres129__barra" role="img" aria-label={`${rotulo}: ${palavra}`}>
      <span className="pres129__barra-rotulo">{rotulo}</span>
      <span className="pres129__barra-trilho" aria-hidden><span style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} /></span>
      <span className="pres129__barra-palavra">{palavra}</span>
    </div>
  );
}

function Corrida({ c }: { c: NonNullable<LeituraPresidencial['campanha']> }) {
  const max = Math.max(...c.pesquisa.map(x => x.pct), 1);
  return (
    <div className="pres129__bloco">
      <p className="pres129__kicker">A corrida presidencial · {c.ano}</p>
      <ol className="pres129__etapas" aria-label="As etapas da campanha">
        {ETAPAS.map((e, k) => <li key={e} className={k < c.etapa ? 'feita' : k === c.etapa ? 'agora' : ''}>{e}</li>)}
      </ol>
      <ul className="pres129__pesquisa" aria-label="A pesquisa de intenção de voto">
        {c.pesquisa.map(x => (
          <li key={x.nome} className={x.voce ? 'pres129__voce' : undefined}>
            <span className="pres129__nome">{x.voce ? 'Você' : x.nome}<small>{x.partido ? ` · ${partidoDe(x.partido)?.chamado ?? x.partido}` : ' · sem partido'}{x.perfil ? ` · ${x.perfil}` : ''}</small></span>
            <span className="pres129__trilho" aria-hidden><span style={{ width: `${(x.pct / max) * 100}%` }} /></span>
            <span className="pres129__pct">{n(x.pct)}%</span>
          </li>
        ))}
      </ul>
      <p className="nota">{[c.segundo, c.eixo ? `A promessa: ${c.eixo}` : undefined, c.debate, `Hoje: ${c.chance}`].filter(Boolean).join(' · ')}.</p>
    </div>
  );
}

function Governo({ g }: { g: NonNullable<LeituraPresidencial['governo']> }) {
  return (
    <div className="pres129__bloco">
      <p className="pres129__kicker">O governo do país</p>
      {g.impeachment && <p className="nota nota--atencao">{g.impeachment}: a votação decide se o mandato continua.</p>}
      <div className="pres129__indicadores">
        <Indicador rotulo="Inflação" valor={g.inflacao} antes={g.inicio.inflacao} melhorSobe={false} />
        <Indicador rotulo="PIB" valor={g.pib} antes={g.inicio.pib} melhorSobe />
        <Indicador rotulo="Desemprego" valor={g.desemprego} antes={g.inicio.desemprego} melhorSobe={false} />
      </div>
      <Barra rotulo="Base no Congresso" valor={g.base} palavra={`${g.base}% das cadeiras`} />
      <Barra rotulo="Relações com o mundo" valor={g.mundo} palavra={g.mundo >= 65 ? 'parceiro procurado' : g.mundo >= 45 ? 'normais' : 'isolado'} />
      <Barra rotulo="Tensão com os Poderes" valor={g.conflito} palavra={g.conflito >= 60 ? 'crise institucional' : g.conflito >= 30 ? 'atrito' : 'calma'} />
      <dl className="dados">
        <div className="dado"><dt>Prioridades</dt><dd>{g.eixos.length ? g.eixos.join(' e ') : 'ainda não definidas'}</dd></div>
        <div className="dado"><dt>Política econômica do ano</dt><dd>{g.politica ?? 'o rumo de antes'}</dd></div>
        <div className="dado"><dt>No Congresso</dt><dd>{g.reforma ?? 'nenhuma reforma tramitando'}</dd></div>
        {g.escandalos > 0 && <div className="dado"><dt>Escândalos</dt><dd>{g.escandalos === 1 ? 'um caso no governo' : `${g.escandalos} casos no governo`}</dd></div>}
      </dl>
      {g.anos.length > 1 && (
        <div className="pres129__anos" role="img" aria-label={`A aprovação ano a ano: ${g.anos.map(a => `${a.ano}, ${a.aprovacao}%`).join('; ')}`}>
          {g.anos.slice(-8).map(a => <span key={a.ano} style={{ height: `${Math.max(6, a.aprovacao)}%` }} title={`${a.ano}: ${a.aprovacao}%`}><small>{String(a.ano).slice(2)}</small></span>)}
        </div>
      )}
      {(g.reformas.length > 0 || g.conquistas.length > 0) && <ul className="historico-politico">{[...g.reformas, ...g.conquistas.filter(x => !/aprovada$/.test(x))].slice(-6).map((x, k) => <li key={k}>{x}</li>)}</ul>}
    </div>
  );
}

export function PainelPresidencial({ vida }: { vida: Vida }) {
  const l = leituraPresidencial(vida);
  if (!l) return null;
  const historia = l.candidaturas.length > 0 || l.mandatos.length > 0;
  if (l.semPresidencia && !historia) return <p className="nota pres129__fora">{l.semPresidencia}</p>;
  return (
    <section className="pres129" aria-label="A Presidência">
      {l.governo && <Governo g={l.governo} />}
      {l.campanha && <Corrida c={l.campanha} />}
      {l.regras && l.requisitos && (
        <div className="pres129__bloco">
          <p className="pres129__kicker">A Presidência · próxima eleição em {l.regras.proxima}</p>
          <p className="pres129__regra">{l.regras.titulo.charAt(0).toUpperCase() + l.regras.titulo.slice(1)}: {l.regras.idade} anos na posse, mandato de {l.regras.anos}. {l.regras.limite}{l.regras.colegio ? ' Quem decide é o Colégio Eleitoral: vencer em cada estado leva os delegados dele (Maine e Nebraska dividem por distrito), e é preciso 270 de 538 — mais votos no país não bastam.' : l.regras.segundoTurno ? ' Há segundo turno.' : ' Vence quem tiver mais votos.'}</p>
          <ul className="pres129__requisitos">{l.requisitos.map(x => <li key={x.texto} className={x.ok ? 'ok' : 'falta'}><span aria-hidden>{x.ok ? '✓' : '·'}</span> {x.texto}<span className="sr-only">{x.ok ? ' (cumprido)' : ' (falta)'}</span></li>)}</ul>
        </div>
      )}
      {historia && (
        <div className="pres129__bloco">
          <p className="pres129__kicker">Na história</p>
          {l.mandatos.map((m, k) => <p key={k} className="pres129__legado"><strong>{m.de}–{m.ate}</strong> · {m.legado} · aprovação de {m.aprovacao}% no fim{m.reformas.length ? ` · ${m.reformas.join(', ')}` : ''}.</p>)}
          {l.candidaturas.length > 0 && <ul className="historico-politico">{l.candidaturas.map((c, k) => <li key={k}>{c.texto}</li>)}</ul>}
        </div>
      )}
    </section>
  );
}

export default PainelPresidencial;
