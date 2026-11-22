/**
 * VIDA 35 · AS TELAS NOVAS DA ORGANIZAÇÃO — o equipamento da line (peça por peça ou pacote, com o visual do PC), a line
 * academy, a reformulação, a compra da line de outra organização, os eventos e os cômodos da gaming house.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { anoDe } from '../../../motor/tempo';
import { JOGOS25, type JogoId } from '../../../motor/v25/esports/jogos25';
import {
  criadoresDisponiveis35, custoDaAcademy35, forcaDaAcademy35, jogosDisponiveis31, linhaDe31, maxElenco31, mediaDosTitulares31, nomeDaFuncao31, nomeDaLiga31, orgsAVenda31,
  planoDaReformulacao35, valorDaLinha33, type LinhaOrg33, type OqueOrg31
} from '../../../motor/v31/esports/org31';
import {
  bonusDaCasa35, bonusDoSetup35, COMODOS35, CUSTO_PENEIRA35, CUSTO_RETIRO35, custoDoSetup35, DESCRICAO35, estadoDaPeca35, EVENTOS35, FOCOS35, manutencaoDaCasa35, NOME_GABINETE35, NOME_PECA35,
  nomeDoDegrau35, PACOTES35, PECAS35, precoDaPeca35, REFORMULACAO35, SCRIMS35, STAFF35, TORNEIOS35, type Gabinete35, type NivelReformulacao35, type Peca35, type Torneio35
} from '../../../motor/v31/esports/org35';
import { multDaRegiao33, nomeDaRegiao33 } from '../../../motor/v31/esports/circuitos33';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { coresDaOrg34 } from '../../v31/esports/coresOrgs34';
import './org35.css';

type Agir = (a: Acao) => boolean;
const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const RGB = ['#7c3aed', '#06b6d4', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#ffffff'];

/** O desenho de uma estação (PC, monitor, periféricos, cadeira) no degrau escolhido. */
export function Estacao35({ s, cor }: { s: { pc: number; monitor: number; perifericos: number; cadeira: number; gabinete?: Gabinete35; rgb?: string }; cor: string }) {
  const luz = s.rgb ?? cor;
  const mw = 46 + s.monitor * 8, mh = 28 + s.monitor * 4;
  const gab = s.gabinete ?? 'torre';
  return (
    <svg viewBox="0 0 200 140" className="org35__estacao" role="img" aria-label="A estação de um jogador">
      <rect width="200" height="140" fill="#1f2430" />
      <rect x="0" y="92" width="200" height="48" fill="#2a303c" />
      <rect x="20" y="88" width="160" height="8" rx="2" fill="#4b5563" />
      {/* monitor */}
      <rect x={100 - mw / 2} y={86 - mh - 12} width={mw} height={mh} rx="2" fill="#0b0f17" stroke="#6b7280" />
      <rect x={100 - mw / 2 + 2} y={86 - mh - 10} width={mw - 4} height={mh - 4} fill={luz} opacity={0.25 + s.monitor * 0.15} />
      <rect x="96" y="74" width="8" height="12" fill="#6b7280" />
      {/* gabinete */}
      {gab === 'compacto' ? <rect x="150" y="62" width="20" height="26" rx="2" fill="#111827" stroke={luz} strokeWidth={s.pc ? 1.5 : 0.5} />
        : <g><rect x="148" y={gab === 'aquario' ? 46 : 40} width={gab === 'aquario' ? 30 : 24} height={gab === 'aquario' ? 42 : 48} rx="2" fill={gab === 'aquario' ? '#0f172a' : '#111827'} stroke={luz} strokeWidth={s.pc ? 1.5 : 0.5} />
          {gab === 'aquario' && <rect x="151" y="50" width="24" height="34" fill={luz} opacity={0.15 + s.pc * 0.12} />}
          {s.pc >= 2 && <circle cx={gab === 'aquario' ? 163 : 160} cy={gab === 'aquario' ? 67 : 64} r="5" fill="none" stroke={luz} strokeWidth="2" />}</g>}
      {/* teclado e mouse */}
      <rect x="62" y="80" width={40 + s.perifericos * 3} height="6" rx="1" fill="#111827" stroke={s.perifericos >= 2 ? luz : '#374151'} strokeWidth="0.8" />
      <ellipse cx="120" cy="83" rx="4" ry="3" fill="#111827" stroke={s.perifericos >= 1 ? luz : '#374151'} strokeWidth="0.8" />
      {s.perifericos >= 1 && <path d="M30 70 a10 10 0 0 1 20 0" fill="none" stroke="#9ca3af" strokeWidth="3" />}
      {/* cadeira */}
      <rect x="82" y="100" width="36" height={20 + s.cadeira * 3} rx={s.cadeira >= 2 ? 8 : 3} fill={s.cadeira >= 1 ? cor : '#6b7280'} />
      {s.cadeira >= 1 && <rect x="88" y="104" width="24" height="5" rx="2" fill="#111827" opacity="0.5" />}
    </svg>
  );
}

/** O equipamento de uma line: as quatro peças, os pacotes, o visual; quanto custa trocar e o que soma. */
export function Equipamento35({ vida, agir, L, nomeOrg }: { vida: Vida; agir: Agir; L: LinhaOrg33; nomeOrg: string }) {
  const ano = anoDe(vida.t);
  const atual = L.setup35 ?? { pc: 0, monitor: 0, perifericos: 0, cadeira: 0, anos: {} };
  const [s, setS] = useState({ pc: atual.pc, monitor: atual.monitor, perifericos: atual.perifericos, cadeira: atual.cadeira, gabinete: atual.gabinete, rgb: atual.rgb });
  const [renovar, setRenovar] = useState<Peca35[]>([]);
  const pessoas = L.elenco.length + (L.tecnico ? 1 : 0);
  const mult = multDaRegiao33(L.jogo, L.regiao);
  const custo = custoDoSetup35(L.setup35, s, renovar, pessoas, mult);
  const bonusAgora = bonusDoSetup35(L.setup35, ano);
  const bonusNovo = bonusDoSetup35({ ...s, anos: Object.fromEntries(PECAS35.map(p => [p, s[p] !== atual[p] || renovar.includes(p) ? ano : atual.anos[p] ?? ano])) }, ano);
  const cor = vida.orgEsports31?.identidade33?.cor1 ?? coresDaOrg34(nomeOrg)[0];
  return (
    <div className="org35">
      <div className="org35__topo">
        <Estacao35 s={s} cor={cor.startsWith('#') ? cor : '#7c3aed'} />
        <div>
          <p className="nota">Cada jogador e o técnico têm a sua estação ({pessoas} {pessoas === 1 ? 'pessoa' : 'pessoas'}). O equipamento soma na força da line — <b>+{bonusAgora}</b> hoje{bonusNovo !== bonusAgora ? <>, <b>+{bonusNovo}</b> com o que você montou</> : ''} — e envelhece: com 3 anos rende metade; com 5, nada.</p>
          <div className="org35__fichas" role="group" aria-label="Pacotes prontos">
            {PACOTES35.map(p => <button key={p.id} type="button" className="org35__ficha" title={p.nota} aria-pressed={PECAS35.every(k => s[k] === p.s[k])} onClick={() => setS(x => ({ ...x, ...p.s }))}>{p.nome}</button>)}
          </div>
        </div>
      </div>
      <ul className="org35__pecas">
        {PECAS35.map(p => {
          const estado = estadoDaPeca35(atual, p, ano);
          return (
            <li key={p} className="org35__peca">
              <div className="org35__peca-cabeca"><strong>{NOME_PECA35[p]}</strong>{atual[p] > 0 && <span className={`org35__estado org35__estado--${estado}`}>{nomeDoDegrau35(p, atual[p], ano)} · {estado === 'nova' ? `de ${atual.anos[p] ?? ano}` : estado}</span>}</div>
              <p className="nota">{DESCRICAO35[p]}</p>
              <div className="org35__fichas" role="group" aria-label={NOME_PECA35[p]}>
                {[0, 1, 2, 3].map(d => <button key={d} type="button" className="org35__ficha" aria-pressed={s[p] === d} onClick={() => setS(x => ({ ...x, [p]: d }))}>{nomeDoDegrau35(p, d, ano)}{d ? <small> · {dinheiroCurto(precoDaPeca35(p, d, pessoas, mult))}</small> : null}</button>)}
              </div>
              {atual[p] > 0 && s[p] === atual[p] && estado !== 'nova' && <label className="org35__liga"><input type="checkbox" checked={renovar.includes(p)} onChange={e => setRenovar(r => (e.target.checked ? [...r, p] : r.filter(x => x !== p)))} /> Renovar (comprar de novo, no mesmo degrau)</label>}
            </li>
          );
        })}
      </ul>
      <div className="org35__visual">
        <div className="org35__fichas" role="group" aria-label="Gabinete">{(Object.keys(NOME_GABINETE35) as Gabinete35[]).map(g => <button key={g} type="button" className="org35__ficha" aria-pressed={(s.gabinete ?? 'torre') === g} onClick={() => setS(x => ({ ...x, gabinete: g }))}>{NOME_GABINETE35[g]}</button>)}</div>
        <div className="org35__fichas" role="group" aria-label="Cor do RGB">{RGB.map(c => <button key={c} type="button" className="org35__cor" aria-label={c} aria-pressed={s.rgb === c} style={{ background: c }} onClick={() => setS(x => ({ ...x, rgb: c }))} />)}</div>
      </div>
      <div className="org35__salvar">
        <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'setup', jogo: L.jogo, setup: s, renovar })} variante="principal">{custo ? `Comprar o equipamento · ${dinheiroCurto(custo)}` : 'Salvar o visual'}</BotaoAcao>
        <span className="nota">Sai do caixa da organização.</span>
      </div>
    </div>
  );
}

/** A line academy: o time B que disputa uma divisão abaixo, sobe e desce gente da principal. */
export function Academy35({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const ano = anoDe(vida.t);
  const a = L.academy35;
  if (!a) return (
    <section className="org31__bloco" aria-labelledby="org35-academy">
      <h4 id="org35-academy">Line academy</h4>
      <p className="nota">Um segundo time da organização, que disputa uma divisão abaixo da principal (o cenário aberto ou, se a principal está na liga principal, a segunda divisão). Os jovens jogam partidas oficiais e evoluem mais rápido; quem está mal na principal desce para recuperar a forma. Custa a estrutura e os salários (baixos) todo ano.</p>
      <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'academy', jogo: L.jogo, ativar: true })} variante="principal">Montar a line academy · {dinheiroCurto(custoDaAcademy35(L, ano))}</BotaoAcao>
    </section>
  );
  const h = a.historico[a.historico.length - 1];
  return (
    <div className="org35">
      <section className="org31__bloco" aria-labelledby="org35-academy">
        <h4 id="org35-academy">Line academy · {nomeDaLiga31({ jogo: L.jogo, divisao: a.divisao, regiao: L.regiao }, ano)}</h4>
        <p className="nota">Força {forcaDaAcademy35(L, ano)} (a principal: {Math.round(mediaDosTitulares31(L, ano))}). {h ? `${h.ano}: ${h.posicao}º de ${h.participantes}${h.subiu ? ' · subiu' : h.caiu ? ' · caiu' : ''}.` : 'A primeira temporada fecha na virada.'} {a.elenco.length}/{maxElenco31(L.jogo, ano) + 1} jogadores.</p>
        <ul className="org35__lista">
          {[...a.elenco].sort((x, y) => y.forca - x.forca).map(j => (
            <li key={j.id}>
              <span className="org35__f">{j.forca}</span>
              <span><strong>{j.nick}</strong> <span className="org31__meta">{nomeDaFuncao31(L.jogo, j.funcao)} · {ano - anoDe(j.tNasc)} anos · potencial {j.potencial}</span></span>
              <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'subir', jogo: L.jogo, id: j.id })} variante="secundario">Subir</BotaoAcao>
            </li>
          ))}
        </ul>
        <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'academy', jogo: L.jogo, ativar: false })} variante="discreto">Fechar a academy</BotaoAcao>
      </section>
    </div>
  );
}

/** Reformular: escolher quem fica, o tamanho da ambição; a prévia mostra quem chega e quanto custa. */
export function Reformular35({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const o = vida.orgEsports31!;
  const [manter, setManter] = useState<string[]>([]);
  const [nivel, setNivel] = useState<NivelReformulacao35>('nivel');
  const [aberto, setAberto] = useState(false);
  const plano = useMemo(() => (aberto ? planoDaReformulacao35(vida, o, L, manter, nivel) : undefined), [aberto, vida, o, L, manter, nivel]);
  return (
    <section className="org31__bloco" aria-labelledby="org35-reform">
      <h4 id="org35-reform">Reformular a line</h4>
      <p className="nota">Trocar o grupo de uma vez: escolha quem fica; os outros saem (com a multa do contrato) e chegam jogadores novos para fechar a line. O grupo novo começa com o clima um pouco abaixo.</p>
      {!aberto ? <button type="button" className="botao botao--secundario" onClick={() => setAberto(true)}>Planejar a reformulação</button> : (
        <>
          <div className="org35__fichas" role="group" aria-label="Quem fica">
            {L.elenco.map(j => <button key={j.id} type="button" className="org35__ficha" aria-pressed={manter.includes(j.id)} onClick={() => setManter(m => (m.includes(j.id) ? m.filter(x => x !== j.id) : [...m, j.id]))}>{manter.includes(j.id) ? 'Fica: ' : ''}{j.nick} ({j.forca})</button>)}
          </div>
          <div className="org35__fichas" role="group" aria-label="Ambição">
            {(Object.keys(REFORMULACAO35) as NivelReformulacao35[]).map(n => <button key={n} type="button" className="org35__ficha" aria-pressed={nivel === n} title={REFORMULACAO35[n].nota} onClick={() => setNivel(n)}>{REFORMULACAO35[n].nome}</button>)}
          </div>
          {plano && <p className="nota">Chegam: {plano.novos.map(j => `${j.nick} (${nomeDaFuncao31(L.jogo, j.funcao)}, ${j.forca}${REFORMULACAO35[nivel].jovem ? `, pot. ${j.potencial}` : ''})`).join(', ')}. Multas {dinheiroCurto(plano.multas)} + contratações {dinheiroCurto(plano.contratacoes)}.</p>}
          {plano && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'reformular', jogo: L.jogo, manter, nivel })} variante="principal">Reformular · {dinheiroCurto(plano.custo)}</BotaoAcao>}
        </>
      )}
    </section>
  );
}

/** Comprar a line (vaga e jogadores) de outra organização — num jogo novo ou no lugar da sua. */
export function ComprarLinha35({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const jogos = jogosDisponiveis31(ano);
  const [jogo, setJogo] = useState<JogoId>(jogos[0] ?? 'cs');
  const [aberto, setAberto] = useState(false);
  const lista = useMemo(() => (aberto ? orgsAVenda31(vida, { jogo }).sort((a, b) => b.divisao - a.divisao || b.forca - a.forca).slice(0, 12) : []), [aberto, vida, jogo]);
  const atual = linhaDe31(o, jogo);
  const credito = atual ? valorDaLinha33(o, atual, ano) : 0;
  return (
    <section className="org31__bloco" aria-labelledby="org35-comprar">
      <h4 id="org35-comprar">Comprar a line de outra organização</h4>
      <p className="nota">A vaga na liga e os jogadores de outra organização passam a jogar com o seu nome. Num jogo em que você já está, a sua line é vendida e a comprada entra no lugar (o valor da sua abate o preço; a galeria e a academy ficam).</p>
      {!aberto ? <button type="button" className="botao botao--secundario" onClick={() => setAberto(true)}>Ver lines à venda</button> : (
        <>
          <label className="org35__campo">Jogo <select value={jogo} onChange={e => setJogo(e.target.value as JogoId)}>{jogos.map(j => <option key={j} value={j}>{JOGOS25[j].nome(ano)}</option>)}</select></label>
          {atual && <p className="nota">A sua line atual de {JOGOS25[jogo].nome(ano)} vale ~{dinheiroCurto(credito)}.</p>}
          <ul className="org35__lista">
            {lista.map(x => (
              <li key={`${x.regiao}:${x.nome}`}>
                <span className="org35__f">{x.forca}</span>
                <span><strong>{x.nome}</strong> <span className="org31__meta">{nomeDaLiga31(x, ano)} · {nomeDaRegiao33(x.jogo, x.regiao)}</span></span>
                <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'comprar_linha', nome: x.nome, jogo: x.jogo, regiao: x.regiao })} variante="secundario">Comprar · {dinheiroCurto(Math.max(0, x.preco - credito))}</BotaoAcao>
              </li>
            ))}
          </ul>
          <p className="nota">Pago com o seu dinheiro; metade das dívidas da line vem junto para a organização.</p>
        </>
      )}
    </section>
  );
}

/** Os eventos do ano. */
export function Eventos35({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  return (
    <section className="org31__bloco" aria-labelledby="org35-eventos">
      <h4 id="org35-eventos">Eventos</h4>
      <ul className="org35__lista">
        {EVENTOS35.map(e => {
          const feito = (o.eventos35 ?? []).some(x => x.ano === ano && x.tipo === e.id);
          return (
            <li key={e.id}>
              <span><strong>{e.nome}</strong> <span className="org31__meta">{e.nota} +{e.fas} fãs{e.rep ? `, +${e.rep} de nome` : ''}.</span></span>
              <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'evento', tipo: e.id })} variante="secundario">{feito ? 'Feito neste ano' : `Fazer · ${dinheiroCurto(e.custo)}`}</BotaoAcao>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Os cômodos pagos da gaming house (com efeito no time) — ao lado da personalização estética. */
export function Comodos35({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const mult = o.linhas.length ? o.linhas.reduce((s, l) => s + multDaRegiao33(l.jogo, l.regiao), 0) / o.linhas.length : 1;
  const tem = o.casa35 ?? [];
  return (
    <section className="org31__bloco" aria-labelledby="org35-comodos">
      <h4 id="org35-comodos">Cômodos e equipe da casa</h4>
      <p className="nota">Estes mudam o time: somam na força de todas as lines (até +1,2 juntos; hoje +{bonusDaCasa35(tem, o.linhas.some(l => !!l.tecnico))}) e custam por ano ({dinheiroCurto(manutencaoDaCasa35(tem, mult))} hoje).</p>
      <ul className="org35__lista">
        {COMODOS35.map(c => (
          <li key={c.id} className={tem.includes(c.id) ? 'org35__tem' : undefined}>
            <span><strong>{c.nome}</strong> <span className="org31__meta">{c.nota} {dinheiroCurto(Math.round(c.ano * mult / 1e4) * 1e4)}/ano.</span></span>
            {tem.includes(c.id)
              ? <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'comodo', id: c.id, construir: false })} variante="discreto">Fechar</BotaoAcao>
              : <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'comodo', id: c.id, construir: true })} variante="secundario">Construir · {dinheiroCurto(Math.round(c.obra * mult / 1e4) * 1e4)}</BotaoAcao>}
          </li>
        ))}
      </ul>
    </section>
  );
}


/* ------------------------------------------------------------------ VIDA 35.1 · o dia a dia */

/** O treino da line: o foco, os scrims da temporada, a comissão técnica, o retiro, o corte de salários. */
export function Treino35({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const ano = anoDe(vida.t);
  const mult = multDaRegiao33(L.jogo, L.regiao);
  const foco = L.foco35 ?? 'equilibrado';
  const din = (x: number) => dinheiroCurto(Math.round(x * mult / 1e4) * 1e4);
  return (
    <div className="org35">
      <section className="org31__bloco" aria-labelledby="org35-foco">
        <h4 id="org35-foco">Foco do treino</h4>
        <ul className="org35__lista">
          {FOCOS35.map(f => (
            <li key={f.id} className={foco === f.id ? 'org35__tem' : undefined}>
              <span><strong>{f.nome}</strong> <span className="org31__meta">{f.nota}</span></span>
              {foco === f.id ? <span className="org35__vigor">Em vigor</span> : <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'foco', jogo: L.jogo, foco: f.id })} variante="secundario">Adotar</BotaoAcao>}
            </li>
          ))}
        </ul>
      </section>
      <section className="org31__bloco" aria-labelledby="org35-scrims">
        <h4 id="org35-scrims">Scrims da temporada</h4>
        <p className="nota">{L.scrims35?.ano === ano ? `Marcados: ${SCRIMS35[L.scrims35.nivel - 1].nome.toLowerCase()} (+${SCRIMS35[L.scrims35.nivel - 1].forca}).` : 'Treinos contra outras equipes, a temporada inteira. Uma agenda por temporada.'}</p>
        <div className="org31__botoes">{SCRIMS35.map(sc => <BotaoAcao key={sc.nivel} vida={vida} agir={agir} acao={A({ op: 'scrims', jogo: L.jogo, nivel: sc.nivel })} variante="secundario">{sc.nome} · +{sc.forca} · {din(sc.custo)}</BotaoAcao>)}</div>
      </section>
      <section className="org31__bloco" aria-labelledby="org35-staff">
        <h4 id="org35-staff">Comissão técnica</h4>
        <ul className="org35__lista">
          {STAFF35.map(st => (
            <li key={st.nivel} className={(L.staff35 ?? 0) === st.nivel ? 'org35__tem' : undefined}>
              <span><strong>{st.nome}</strong> <span className="org31__meta">{st.forca ? `+${st.forca} na força · ${din(st.salario)}/ano` : 'Sem custo a mais.'}</span></span>
              {(L.staff35 ?? 0) === st.nivel ? <span className="org35__vigor">Em vigor</span> : <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'staff', jogo: L.jogo, nivel: st.nivel })} variante="secundario">{st.nivel ? 'Montar' : 'Voltar a só o técnico'}</BotaoAcao>}
            </li>
          ))}
        </ul>
      </section>
      <section className="org31__bloco" aria-labelledby="org35-clima">
        <h4 id="org35-clima">Clima e salários</h4>
        <p className="nota">Clima da line agora: {(L.moral ?? 0) > 0 ? '+' : ''}{L.moral ?? 0} na força.</p>
        <div className="org31__botoes">
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'retiro', jogo: L.jogo })} variante="secundario">{L.retiro35 === ano ? 'Retiro feito' : `Retiro do time (+0,8 no clima) · ${din(CUSTO_RETIRO35)}`}</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'corte', jogo: L.jogo })} variante="discreto">{L.corte35 === ano ? 'Salários já cortados' : 'Cortar 15% dos salários (o clima cai)'}</BotaoAcao>
        </div>
      </section>
    </div>
  );
}

/** Os torneios fora da liga: a copa aberta e o torneio de convidados (resultado na hora). */
export function Torneios35({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const ano = anoDe(vida.t);
  const mult = multDaRegiao33(L.jogo, L.regiao);
  const hist = [...(L.torneios35 ?? [])].reverse().slice(0, 8);
  return (
    <section className="org31__bloco" aria-labelledby="org35-torneios">
      <h4 id="org35-torneios">Torneios fora da liga</h4>
      <ul className="org35__lista">
        {(Object.keys(TORNEIOS35) as Torneio35[]).map(t => {
          const x = TORNEIOS35[t];
          const feito = (L.torneios35 ?? []).find(h => h.ano === ano && h.tipo === t);
          return (
            <li key={t}>
              <span><strong>{x.nome}</strong> <span className="org31__meta">{x.nota} {x.equipes} equipes · prêmio total {dinheiroCurto(Math.round(x.premio * mult / 1e4) * 1e4)}.</span></span>
              <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'torneio', jogo: L.jogo, tipo: t })} variante="secundario">{feito ? `${feito.colocacao}º neste ano` : `Inscrever · ${dinheiroCurto(Math.round(x.inscricao * mult / 1e4) * 1e4)}`}</BotaoAcao>
            </li>
          );
        })}
      </ul>
      {hist.length > 0 && <ul className="org35__hist">{hist.map((h, k) => <li key={k}><b>{h.ano}</b> {h.nome}: {h.colocacao === 1 ? 'campeã' : `${h.colocacao}º de ${h.participantes}`}{h.premio ? ` · ${dinheiroCurto(h.premio)}` : ''}</li>)}</ul>}
    </section>
  );
}

/** Peneira aberta: dois jovens a mais na peneira de talentos, na hora. */
export function PeneiraAberta35({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const ano = anoDe(vida.t);
  const c = Math.round(CUSTO_PENEIRA35 * multDaRegiao33(L.jogo, L.regiao) / 1e4) * 1e4;
  return <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'peneira_aberta', jogo: L.jogo })} variante="secundario">{L.peneira35 === ano ? 'Peneira aberta feita neste ano' : `Fazer uma peneira aberta (2 jovens agora) · ${dinheiroCurto(c)}`}</BotaoAcao>;
}

/** Criadores de conteúdo, bônus por meta e a collab com o jogo. */
export function Negocios35({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const disponiveis = criadoresDisponiveis35(vida);
  return (
    <>
      <section className="org31__bloco" aria-labelledby="org35-criadores">
        <h4 id="org35-criadores">Criadores de conteúdo</h4>
        <p className="nota">Streamers que fazem conteúdo com o nome da organização: trazem a comunidade deles (fãs todo ano) e receita de conteúdo — e cobram salário. Até três.</p>
        <ul className="org35__lista">
          {(o.criadores35 ?? []).map(c => <li key={c.id} className="org35__tem"><span><strong>{c.nome}</strong> <span className="org31__meta">audiência {c.fas} · {dinheiroCurto(c.salario)}/ano</span></span><BotaoAcao vida={vida} agir={agir} acao={A({ op: 'dispensar_criador', id: c.id })} variante="discreto">Dispensar</BotaoAcao></li>)}
          {disponiveis.map(c => <li key={c.id}><span><strong>{c.nome}</strong> <span className="org31__meta">audiência {c.fas} · {dinheiroCurto(c.salario)}/ano · luvas {dinheiroCurto(c.salario * 0.5)}</span></span><BotaoAcao vida={vida} agir={agir} acao={A({ op: 'criador', id: c.id })} variante="secundario">Assinar</BotaoAcao></li>)}
        </ul>
      </section>
      <section className="org31__bloco" aria-labelledby="org35-bicho">
        <h4 id="org35-bicho">Bônus por meta e collab</h4>
        <div className="org31__botoes">
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'bicho', ligar: !o.bicho35 })} variante={o.bicho35 ? 'principal' : 'secundario'}>{o.bicho35 ? 'Bônus por título prometido (desligar)' : 'Prometer bônus por título'}</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'collab' })} variante="secundario">{o.collab35 === ano ? 'Collab deste ano lançada' : 'Fechar collab de itens com a desenvolvedora'}</BotaoAcao>
        </div>
        <p className="nota">O bônus melhora o clima de todas as lines; a cada título, 15% da folha da line vira prêmio. A collab (itens com o escudo dentro do jogo) é para quem está numa liga principal — uma por ano, rende pela base de fãs.</p>
      </section>
    </>
  );
}
