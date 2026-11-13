/**
 * VIDA 18 · as apostas novas na tela: as loterias da Caixa (volante, surpresinha, bolões, o sorteio do concurso e a
 * conferência por faixa), as apostas esportivas (a rodada com as odds e a temporada), o turfe (o páreo, os cavalos com os
 * números deles, as odds da bolsa, o cavalo da casa), o bingo e o histórico. Tudo o que aparece foi sorteado pelo motor:
 * a tela só mostra o resultado (nada de "quase ganhou" fabricado, nada que empurre a jogar de novo).
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao, Subnav } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { anoDe } from '../../../motor/tempo';
import { LOTERIAS18, BOLOES18, INSCRICAO_TURFE, type LoteriaId } from '../../../motor/dados18/apostas/loterias18';
import { bolaoDaLoterica, chanceDaFaixa, comb, precoDaAposta, precoDaLoteca, premioEstimado, proximoConcurso } from '../../../motor/v18/apostas/loterias18';
import { mercadoDaTemporada, mercadoPronto, odd, probabilidades, rodada, gradeDePlacares, paisDoFutebol } from '../../../motor/v18/apostas/esportivas18';
import { chancesDoPareo, hipodromosDaVida, oddTurfe, desempenho } from '../../../motor/v18/apostas/turfe18';
import { cavalosDaCasa, leiDa, pareoAberto, pareoDe, precoDaCartela, rodadaAberta, pendentesEsportivas, type OqueAposta18 } from '../../../motor/v18/apostas/apostas18';
import { bingoBeneficente } from '../../../motor/v18/apostas/bingo18';
import './apostas18.css';

type Agir = (a: Acao) => boolean;
const a18 = (oque: OqueAposta18): Acao => ({ tipo: 'aposta18', oque });
const dz = (n: number, zero?: boolean) => String(n).padStart(2, '0') + (zero ? '' : '');
const umEm = (p: number) => (p > 0 ? `1 em ${Math.round(1 / p).toLocaleString('pt-BR')}` : '—');
const fmtOdd = (x: number) => x.toFixed(2).replace('.', ',');

function Lei({ texto }: { texto: string }) { return <p className="apostas18__lei">{texto}</p>; }

/* ================================================================== Loterias da Caixa */

const ORDEM: LoteriaId[] = ['mega', 'lotofacil', 'quina', 'lotomania', 'duplasena', 'loteca'];

export function Loterias18({ vida, agir }: { vida: Vida; agir: Agir }) {
  const [l, setL] = useState<LoteriaId>('mega');
  const lei = leiDa(vida, 'loterias');
  if (!lei.permitido) return <Lei texto={lei.texto} />;
  return (
    <div className="apostas18">
      <Lei texto={lei.texto} />
      <Subnav rotulo="Loterias" prefixo="loterias18" classe="subnav--loterias18" itens={ORDEM.map(id => ({ id, rotulo: LOTERIAS18[id].nome, oque: LOTERIAS18[id].dias }))} atual={l} aoMudar={setL} />
      <div role="tabpanel" id="loterias18-painel" aria-labelledby={`loterias18-aba-${l}`}>
        {l === 'loteca' ? <Loteca vida={vida} agir={agir} /> : <Volante key={l} vida={vida} agir={agir} l={l} />}
      </div>
    </div>
  );
}

function Cartaz({ vida, l }: { vida: Vida; l: LoteriaId }) {
  const L = LOTERIAS18[l];
  const n = proximoConcurso(vida, l);
  const est = premioEstimado(vida, l, n);
  return (
    <div className={`apostas18__cartaz apostas18__cartaz--${l}`}>
      <span className="apostas18__cartaz-nome">{L.nome}</span>
      <span>Concurso {n.toLocaleString('pt-BR')} · {L.dias}</span>
      <strong>Prêmio estimado: {dinheiroCurto(est)}</strong>
    </div>
  );
}

function Volante({ vida, agir, l }: { vida: Vida; agir: Agir; l: LoteriaId }) {
  const L = LOTERIAS18[l];
  const [marcados, setMarcados] = useState<number[]>([]);
  const [dezenas, setDezenas] = useState(L.min);
  const [qtd, setQtd] = useState(1);
  const [cotas, setCotas] = useState(1);
  const n = proximoConcurso(vida, l);
  const bolao = useMemo(() => bolaoDaLoterica(vida, l), [vida, l]);
  const lo = L.doZero ? 0 : 1;
  const nums = Array.from({ length: L.universo }, (_, k) => k + lo);
  const alternar = (x: number) => setMarcados(m => (m.includes(x) ? m.filter(y => y !== x) : m.length < L.max ? [...m, x].sort((a, b) => a - b) : m));
  const meus = (vida.apostas18?.bilhetes ?? []).filter(b => b.loteria === l).slice(-6).reverse();
  const ultimoConferido = meus.find(b => b.resultado);
  const sorteados = new Set([...(ultimoConferido?.resultado?.sorteio ?? []), ...(ultimoConferido?.resultado?.sorteio2 ?? [])]);
  const conhecidos = Object.values(vida.pessoas).filter(p => p.vivo && !p.especie && (vida.vinculos[p.id]?.proximidade ?? 0) >= 45).slice(0, 4);
  return (
    <section className="apostas18__loteria" aria-label={L.nome}>
      <Cartaz vida={vida} l={l} />
      <div className="apostas18__volante papel papel--sem-dobra">
        <p className="bilhete__cabeca"><span>{L.nome} · marque {L.min === L.max ? L.min : `${L.min} a ${L.max}`}</span><span>{marcados.length >= L.min ? dinheiroCurto(precoDaAposta(l, marcados.length)) : `aposta simples: ${dinheiroCurto(L.preco)}`}</span></p>
        <div className={`apostas18__grade apostas18__grade--${l}`} role="group" aria-label={`Dezenas de ${dz(lo)} a ${dz(L.universo - 1 + lo)}`}>
          {nums.map(x => <button key={x} type="button" className={`bilhete__numero${marcados.includes(x) ? ' bilhete__numero--marcado' : ''}${sorteados.has(x) ? ' bilhete__numero--sorteado' : ''}`} aria-pressed={marcados.includes(x)} onClick={() => alternar(x)}>{dz(x)}</button>)}
        </div>
        <p className="nota">{marcados.length} marcadas{marcados.length > L.min && l !== 'lotomania' ? ` = ${comb(marcados.length, L.min).toLocaleString('pt-BR')} apostas simples` : ''}.</p>
        <div className="grupo-acoes grupo-acoes--linha">
          <button type="button" className="botao botao--discreto" onClick={() => setMarcados([])}>Limpar</button>
          <BotaoAcao vida={vida} agir={agir} variante="principal" acao={a18({ jogo: 'loteria', oque: 'comprar', loteria: l, jogos: [marcados] })} semAviso>Registrar este jogo</BotaoAcao>
        </div>
      </div>
      <div className="apostas18__linha">
        <span>Surpresinha</span>
        {l !== 'lotomania' && <label>dezenas <select value={dezenas} onChange={e => setDezenas(Number(e.target.value))}>{Array.from({ length: Math.min(L.max, L.min + 5) - L.min + 1 }, (_, k) => L.min + k).map(d => <option key={d} value={d}>{d}</option>)}</select></label>}
        <label>jogos <select value={qtd} onChange={e => setQtd(Number(e.target.value))}>{[1, 2, 3, 5, 10].map(d => <option key={d} value={d}>{d}</option>)}</select></label>
        <BotaoAcao vida={vida} agir={agir} acao={a18({ jogo: 'loteria', oque: 'comprar', loteria: l, surpresinhas: qtd, dezenas })}>Registrar · {dinheiroCurto(precoDaAposta(l, dezenas) * qtd)}</BotaoAcao>
      </div>
      <div className="apostas18__linha">
        <span>Bolão da lotérica</span>
        <span className="nota">{bolao.jogos.length} jogos de {BOLOES18[l].dezenas} dezenas, {bolao.cotas} cotas de {dinheiroCurto(bolao.valorCota)} (com a tarifa de serviço)</span>
        <label>cotas <select value={cotas} onChange={e => setCotas(Number(e.target.value))}>{[1, 2, 3, 5].map(d => <option key={d} value={d}>{d}</option>)}</select></label>
        <BotaoAcao vida={vida} agir={agir} acao={a18({ jogo: 'loteria', oque: 'bolao', loteria: l, cotas })}>Comprar cotas</BotaoAcao>
      </div>
      {conhecidos.length > 0 && (
        <div className="apostas18__linha">
          <span>Bolão com {conhecidos.map(p => p.nome).join(', ')}</span>
          <BotaoAcao vida={vida} agir={agir} acao={a18({ jogo: 'loteria', oque: 'bolao_conhecidos', loteria: l, pessoas: conhecidos.map(p => p.id), jogos: 10 })}>Fazer o bolão (10 jogos, a sua parte)</BotaoAcao>
        </div>
      )}
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} agir={agir} variante={meus.some(b => b.concurso === n && !b.resultado) ? 'principal' : 'secundario'} acao={a18({ jogo: 'loteria', oque: 'sorteio', loteria: l })}>Ver o sorteio do concurso {n.toLocaleString('pt-BR')}</BotaoAcao>
      </div>
      <Bilhetes vida={vida} l={l} />
      <details className="regras">
        <summary>Regras, faixas e chances</summary>
        <table className="regras__tabela"><thead><tr><th>Faixa</th><th>Prêmio</th><th>Chance (aposta simples)</th></tr></thead>
          <tbody>{L.faixas.map(f => <tr key={f.nome}><td>{f.nome}</td><td>{f.fixo ? dinheiroCurto(f.fixo) : `${Math.round((f.pct ?? 0) * 100)}% do prêmio, dividido`}</td><td>{umEm(chanceDaFaixa(L.universo, L.sorteia, L.min, f.acertos))}</td></tr>)}</tbody></table>
        <p className="nota">{Math.round(43.35)}% da arrecadação vira prêmio. Uma aposta com mais dezenas vale por todas as combinações simples que contém (e custa por elas). A faixa principal acumula quando ninguém acerta.</p>
      </details>
    </section>
  );
}

function Bilhetes({ vida, l }: { vida: Vida; l: LoteriaId }) {
  const L = LOTERIAS18[l];
  const meus = (vida.apostas18?.bilhetes ?? []).filter(b => b.loteria === l).slice(-6).reverse();
  if (!meus.length) return null;
  return (
    <ul className="apostas18__bilhetes" aria-label="Seus bilhetes">
      {meus.map(b => (
        <li key={b.id} className={`apostas18__bilhete${b.resultado?.premio ? ' apostas18__bilhete--premiado' : ''}`}>
          <span className="apostas18__bilhete-cab">Concurso {b.concurso.toLocaleString('pt-BR')} · {b.bolao ? `bolão (${b.bolao.minhas} de ${b.bolao.cotas} cotas)` : `${b.jogos.length} ${b.jogos.length === 1 ? 'jogo' : 'jogos'}`} · {dinheiroCurto(b.custo)}</span>
          {l !== 'loteca' && <span className="apostas18__dezenas">{b.jogos.slice(0, 3).map((j, k) => <span key={k}>{j.map(x => dz(x)).join(' ')}</span>)}{b.jogos.length > 3 ? <span>…</span> : null}</span>}
          {b.resultado ? (
            <span>{l === 'loteca' ? 'Resultados: ' + b.resultado.resultados!.join(' ') : <>Sorteio: <span className="loteria__bolas apostas18__bolas">{b.resultado.sorteio.map(x => <span key={x} className="loteria__bola">{dz(x)}</span>)}</span>{b.resultado.sorteio2 ? <> · 2º: <span className="loteria__bolas apostas18__bolas">{b.resultado.sorteio2.map(x => <span key={x} className="loteria__bola">{dz(x)}</span>)}</span></> : null}</>} — {b.resultado.premio > 0 ? <strong>{b.resultado.faixas.map(f => `${f.combinacoes > 1 ? `${f.combinacoes}× ` : ''}${f.nome}`).join(', ')}: {dinheiroCurto(b.resultado.premio)}</strong> : 'nenhuma faixa'}</span>
          ) : <span className="nota">Aguardando o sorteio ({L.dias}).</span>}
        </li>
      ))}
    </ul>
  );
}

function Loteca({ vida, agir }: { vida: Vida; agir: Agir }) {
  const n = proximoConcurso(vida, 'loteca');
  const rd = rodada(vida, n, 'BR');
  const [p, setP] = useState<('1' | 'X' | '2')[][]>(() => rd.jogos.map((_, k) => (k === 0 ? ['1', 'X'] : ['1'])));
  const alternar = (k: number, x: '1' | 'X' | '2') => setP(ps => ps.map((s, j) => (j !== k ? s : s.includes(x) ? (s.length > 1 ? s.filter(y => y !== x) : s) : [...s, x])));
  const preco = precoDaLoteca(p);
  return (
    <section className="apostas18__loteria" aria-label="Loteca">
      <Cartaz vida={vida} l="loteca" />
      <table className="apostas18__loteca">
        <thead><tr><th scope="col">#</th><th scope="col">Mandante</th><th scope="col">1</th><th scope="col">X</th><th scope="col">2</th><th scope="col">Visitante</th></tr></thead>
        <tbody>{rd.jogos.map((j, k) => <tr key={k}><td>{k + 1}</td><td className="apostas18__time">{j.casa}</td>{(['1', 'X', '2'] as const).map(x => <td key={x}><button type="button" className={`apostas18__coluna${p[k].includes(x) ? ' apostas18__coluna--marcada' : ''}`} aria-pressed={p[k].includes(x)} aria-label={`Jogo ${k + 1}: ${x === '1' ? j.casa : x === '2' ? j.fora : 'empate'}`} onClick={() => alternar(k, x)}>{x}</button></td>)}<td className="apostas18__time">{j.fora}</td></tr>)}</tbody>
      </table>
      <p className="nota">{p.filter(x => x.length === 2).length} duplos, {p.filter(x => x.length === 3).length} triplos = {(preco / LOTERIAS18.loteca.preco).toLocaleString('pt-BR')} combinações. Vale o tempo regulamentar.</p>
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} agir={agir} variante="principal" acao={a18({ jogo: 'loteria', oque: 'comprar', loteria: 'loteca', palpites: p })}>Registrar · {dinheiroCurto(preco)}</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={a18({ jogo: 'loteria', oque: 'bolao', loteria: 'loteca', cotas: 1 })}>Uma cota do bolão · {dinheiroCurto(bolaoDaLoterica(vida, 'loteca').valorCota)}</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={a18({ jogo: 'loteria', oque: 'sorteio', loteria: 'loteca' })}>Ver os jogos do concurso {n.toLocaleString('pt-BR')}</BotaoAcao>
      </div>
      <Bilhetes vida={vida} l="loteca" />
    </section>
  );
}

/* ================================================================== Esportes */

export function Esportes18({ vida, agir }: { vida: Vida; agir: Agir }) {
  const lei = leiDa(vida, 'esportivas');
  const [valor, setValor] = useState(50);
  const [aberto, setAberto] = useState<number | undefined>();
  const n = rodadaAberta(vida);
  const pais = paisDoFutebol(vida);
  const rd = useMemo(() => rodada(vida, n, pais), [vida, n, pais]);
  const pend = pendentesEsportivas(vida);
  const feitas = (vida.apostas18?.esportivas ?? []).filter(a => a.liquidada).slice(-6).reverse();
  if (!lei.permitido) return <Lei texto={lei.texto} />;
  return (
    <div className="apostas18">
      <Lei texto={lei.texto} />
      <div className="apostas18__linha"><span>Valor por aposta</span>{[10, 50, 100, 500, 1000].map(x => <button key={x} type="button" className={`apostas18__chip${valor === x ? ' apostas18__chip--ativo' : ''}`} aria-pressed={valor === x} onClick={() => setValor(x)}>{dinheiroCurto(x)}</button>)}</div>
      <section aria-label={`Rodada ${n}`}>
        <h4 className="apostas18__h">Rodada {n.toLocaleString('pt-BR')} · futebol {pais === 'BR' ? 'brasileiro' : 'do país'}</h4>
        <ul className="apostas18__jogos">
          {rd.jogos.map((j, k) => {
            const pr = probabilidades(j);
            const minhas = pend.filter(a => a.evento === `${pais}:r${n}:${k}`);
            return (
              <li key={k} className="apostas18__jogo">
                <div className="apostas18__confronto"><span>{j.casa}</span><span className="apostas18__x">×</span><span>{j.fora}</span></div>
                <div className="apostas18__odds" role="group" aria-label={`${j.casa} contra ${j.fora}`}>
                  {(['1', 'X', '2'] as const).map(x => <BotaoAcao key={x} vida={vida} agir={agir} semAviso acao={a18({ jogo: 'esportiva', oque: 'jogo', jogoK: k, mercado: '1x2', palpite: x, valor })}>{x === '1' ? 'Casa' : x === 'X' ? 'Empate' : 'Fora'} {fmtOdd(odd(pr[x]))}</BotaoAcao>)}
                  <button type="button" className="botao botao--discreto" aria-expanded={aberto === k} onClick={() => setAberto(aberto === k ? undefined : k)}>Mais</button>
                </div>
                {aberto === k && <MaisMercados vida={vida} agir={agir} k={k} valor={valor} j={j} />}
                {minhas.length > 0 && <p className="nota">Suas apostas: {minhas.map(a => `${a.descricao.split(' — ')[1]} (${dinheiroCurto(a.valor)} a ${fmtOdd(a.odd)})`).join('; ')}</p>}
              </li>
            );
          })}
        </ul>
        <BotaoAcao vida={vida} agir={agir} variante="principal" acao={a18({ jogo: 'esportiva', oque: 'rodada' })}>Acompanhar a rodada {n.toLocaleString('pt-BR')}</BotaoAcao>
      </section>
      <Temporada vida={vida} agir={agir} valor={valor} />
      {feitas.length > 0 && <ul className="apostas18__bilhetes" aria-label="Apostas liquidadas">{feitas.map(a => <li key={a.id} className={`apostas18__bilhete${a.liquidada!.ganhou ? ' apostas18__bilhete--premiado' : ''}`}><span className="apostas18__bilhete-cab">{a.descricao}</span><span>{a.liquidada!.resultado} — {a.liquidada!.recebido > 0 ? <strong>{dinheiroCurto(a.liquidada!.recebido)}</strong> : 'perdeu'} (apostou {dinheiroCurto(a.valor)} a {fmtOdd(a.odd)})</span></li>)}</ul>}
      <details className="regras"><summary>Como as odds são feitas</summary><p>Os jogos são do futebol simulado do VIDA, com a força e a forma de cada clube (a mesma régua da temporada). A odd é o inverso da chance do modelo, com a margem da casa (7%). O placar é sorteado uma vez, pelo mundo — o mesmo para quem apostou e quem não apostou.</p></details>
    </div>
  );
}

function MaisMercados({ vida, agir, k, valor, j }: { vida: Vida; agir: Agir; k: number; valor: number; j: ReturnType<typeof rodada>['jogos'][number] }) {
  const pr = probabilidades(j);
  const g = gradeDePlacares(j);
  const t = g.flat().reduce((s, x) => s + x, 0);
  const placares = [[1, 0], [2, 1], [1, 1], [0, 0], [2, 0], [0, 1], [1, 2], [2, 2], [3, 1]];
  return (
    <div className="apostas18__mais">
      <BotaoAcao vida={vida} agir={agir} semAviso acao={a18({ jogo: 'esportiva', oque: 'jogo', jogoK: k, mercado: 'gols', palpite: 'mais', valor })}>Mais de 2,5 gols {fmtOdd(odd(pr.mais))}</BotaoAcao>
      <BotaoAcao vida={vida} agir={agir} semAviso acao={a18({ jogo: 'esportiva', oque: 'jogo', jogoK: k, mercado: 'gols', palpite: 'menos', valor })}>Menos de 2,5 {fmtOdd(odd(pr.menos))}</BotaoAcao>
      {placares.map(([x, y]) => <BotaoAcao key={`${x}-${y}`} vida={vida} agir={agir} semAviso acao={a18({ jogo: 'esportiva', oque: 'jogo', jogoK: k, mercado: 'placar', palpite: `${x}-${y}`, valor })}>{x} × {y} · {fmtOdd(odd(g[x][y] / t))}</BotaoAcao>)}
    </div>
  );
}

function Temporada({ vida, agir, valor }: { vida: Vida; agir: Agir; valor: number }) {
  if (!mercadoPronto(vida)) return (
    <section className="apostas18__temporada"><h4 className="apostas18__h">A temporada</h4><p className="nota">Campeão, G4, rebaixamento e copa: as odds saem da força dos clubes na liga deste mundo.</p><BotaoAcao vida={vida} agir={agir} acao={a18({ jogo: 'esportiva', oque: 'abrir_mercado' })}>Abrir o mercado do campeonato</BotaoAcao></section>
  );
  const m = mercadoDaTemporada(vida);
  if (!m) return null;
  return (
    <section className="apostas18__temporada" aria-label="A temporada">
      <h4 className="apostas18__h">Temporada {m.ano} · elite</h4>
      <table className="apostas18__tabela">
        <thead><tr><th scope="col">Clube</th><th scope="col">Campeão</th><th scope="col">G4</th><th scope="col">Cai</th><th scope="col">Copa</th></tr></thead>
        <tbody>{m.opcoes.slice(0, 12).map(o => <tr key={o.clube}><th scope="row">{o.clube}</th>{(['campeao', 'g4', 'queda', 'copa'] as const).map(mm => <td key={mm}><BotaoAcao vida={vida} agir={agir} semAviso ocultarImpossivel acao={a18({ jogo: 'esportiva', oque: 'temporada', mercado: mm, clube: o.clube, valor })}>{fmtOdd(odd(o[mm]))}</BotaoAcao></td>)}</tr>)}</tbody>
      </table>
      <p className="nota">Liquida quando a temporada fechar (na virada do ano), pela tabela que a liga jogou.</p>
    </section>
  );
}

/* ================================================================== Turfe */

export function Turfe18({ vida, agir }: { vida: Vida; agir: Agir }) {
  const lei = leiDa(vida, 'turfe');
  const hips = hipodromosDaVida(vida);
  const [hip, setHip] = useState(hips[0]?.id ?? 'local');
  const [valor, setValor] = useState(20);
  const [exata, setExata] = useState<string[]>([]);
  const p = useMemo(() => pareoDe(vida, hip), [vida, hip]);
  const ch = useMemo(() => chancesDoPareo(p), [p]);
  const casa = cavalosDaCasa(vida);
  const aberto = pareoAberto(vida, hip);
  const ultima = (vida.apostas18?.corridas ?? []).filter(c => c.hipodromo === hip && c.ordem.length).slice(-1)[0];
  const minhas = (vida.apostas18?.corridas ?? []).find(c => c.hipodromo === hip && c.numero === p.numero && !c.ordem.length)?.apostas ?? [];
  if (!lei.permitido) return <Lei texto={lei.texto} />;
  return (
    <div className="apostas18">
      <Lei texto={lei.texto} />
      {hips.length > 1 && <div className="apostas18__linha"><span>Hipódromo</span>{hips.map(h => <button key={h.id} type="button" className={`apostas18__chip${hip === h.id ? ' apostas18__chip--ativo' : ''}`} aria-pressed={hip === h.id} onClick={() => setHip(h.id)}>{h.nome.replace('Hipódromo d', '').replace(/^[oa] /, '')}</button>)}</div>}
      <div className="apostas18__pareo">
        <h4 className="apostas18__h">{p.grandePremio ? 'Grande Prêmio' : `Páreo ${p.numero.toLocaleString('pt-BR')}`} · {p.hipodromo.nome} · {p.distancia.toLocaleString('pt-BR')} m na {p.pista}</h4>
        <table className="apostas18__tabela apostas18__tabela--pareo">
          <thead><tr><th scope="col">Cavalo</th><th scope="col">Jóquei</th><th scope="col">Idade · peso</th><th scope="col">Vel. · fundo · forma</th><th scope="col">Vencedor</th><th scope="col">Placê</th></tr></thead>
          <tbody>{[...p.corredores].sort((a, b) => desempenho(b, p) - desempenho(a, p)).map(c => (
            <tr key={c.nome} className={c.daCasa ? 'apostas18__da-casa' : undefined}>
              <th scope="row"><button type="button" className={`apostas18__cavalo${exata.includes(c.nome) ? ' apostas18__cavalo--marcado' : ''}`} aria-pressed={exata.includes(c.nome)} onClick={() => setExata(e => (e.includes(c.nome) ? e.filter(x => x !== c.nome) : [...e, c.nome].slice(-2)))}>{c.nome}{c.daCasa ? ' (da casa)' : ''}</button></th>
              <td>{c.joquei}</td><td>{c.idade} · {c.peso} kg</td><td>{c.velocidade} · {c.fundo} · {c.forma}</td>
              <td><BotaoAcao vida={vida} agir={agir} semAviso acao={a18({ jogo: 'turfe', oque: 'apostar', hipodromo: hip, tipo: 'vencedor', cavalos: [c.nome], valor })}>{oddTurfe(ch.vencer[c.nome] ?? 0).toFixed(1).replace('.', ',')}</BotaoAcao></td>
              <td><BotaoAcao vida={vida} agir={agir} semAviso acao={a18({ jogo: 'turfe', oque: 'apostar', hipodromo: hip, tipo: 'place', cavalos: [c.nome], valor })}>{oddTurfe(ch.place[c.nome] ?? 0).toFixed(1).replace('.', ',')}</BotaoAcao></td>
            </tr>
          ))}</tbody>
        </table>
        <div className="apostas18__linha"><span>Valor</span>{[10, 20, 50, 100, 500].map(x => <button key={x} type="button" className={`apostas18__chip${valor === x ? ' apostas18__chip--ativo' : ''}`} aria-pressed={valor === x} onClick={() => setValor(x)}>{dinheiroCurto(x)}</button>)}</div>
        <div className="apostas18__linha"><span>Exata (toque dois cavalos, na ordem)</span><span>{exata.join(' → ') || '—'}</span>{exata.length === 2 && <BotaoAcao vida={vida} agir={agir} acao={a18({ jogo: 'turfe', oque: 'apostar', hipodromo: hip, tipo: 'exata', cavalos: exata, valor })}>Exata {oddTurfe(ch.exata[`${exata[0]}>${exata[1]}`] ?? 0).toFixed(1).replace('.', ',')}</BotaoAcao>}</div>
        {minhas.length > 0 && <p className="nota">Suas apostas neste páreo: {minhas.map(a => `${a.tipo === 'vencedor' ? 'vencedor' : a.tipo === 'place' ? 'placê' : 'exata'} ${a.cavalos.join(' → ')} (${dinheiroCurto(a.valor)})`).join('; ')}.</p>}
        {casa.length > 0 && !aberto.daCasa && <div className="apostas18__linha"><span>Inscrever um cavalo da casa ({dinheiroCurto(INSCRICAO_TURFE)})</span>{casa.map(c => <BotaoAcao key={c.id} vida={vida} agir={agir} acao={a18({ jogo: 'turfe', oque: 'inscrever', hipodromo: hip, cavalo: c.id })}>{c.nome}</BotaoAcao>)}</div>}
        <BotaoAcao vida={vida} agir={agir} variante="principal" acao={a18({ jogo: 'turfe', oque: 'correr', hipodromo: hip })}>Dada a largada</BotaoAcao>
      </div>
      {ultima && (
        <div className="resultado-aposta" role="status" aria-live="polite">
          <p className="resultado-aposta__rotulo">Páreo {ultima.numero.toLocaleString('pt-BR')}</p>
          <ol className="apostas18__chegada">{ultima.ordem.slice(0, 5).map((c, k) => <li key={c}><span>{k + 1}º</span> {c}</li>)}</ol>
          {ultima.apostas.length > 0 && <p>Suas apostas: {ultima.apostas.reduce((s, a) => s + a.recebido, 0) > 0 ? `voltaram ${dinheiroCurto(ultima.apostas.reduce((s, a) => s + a.recebido, 0))}` : 'nenhuma acertou'}.</p>}
          {ultima.daCasa && <p>{ultima.daCasa.nome}, da casa, chegou em {ultima.daCasa.lugar}º{ultima.daCasa.premio ? ` — prêmio de ${dinheiroCurto(ultima.daCasa.premio)}` : ''}.</p>}
        </div>
      )}
      <details className="regras"><summary>Como funciona</summary><p>Cada cavalo tem velocidade (pesa no tiro curto), fundo (pesa na distância longa), forma e peso; a corrida é o desempenho de cada um mais o acaso do dia. As odds vêm de milhares de simulações da mesma corrida, com o desconto do hipódromo (30%). Vencedor: o primeiro. Placê: chegar entre os dois primeiros. Exata: os dois primeiros, na ordem.</p></details>
    </div>
  );
}

/* ================================================================== Bingo */

export function Bingo18({ vida, agir }: { vida: Vida; agir: Agir }) {
  const lei = leiDa(vida, 'bingo');
  const [n, setN] = useState(2);
  const benef = bingoBeneficente(vida);
  const ult = (vida.apostas18?.historico ?? []).find(h => h.jogo === 'bingo');
  if (!lei.permitido) return <Lei texto={lei.texto} />;
  return (
    <div className="apostas18">
      <Lei texto={lei.texto} />
      <div className="apostas18__bingo">
        <svg viewBox="0 0 120 70" className="apostas18__globo" aria-hidden><circle cx="40" cy="35" r="28" fill="none" stroke="currentColor" strokeWidth="2" />{[18, 30, 44, 52, 34, 26].map((x, k) => <circle key={k} cx={x + 4} cy={20 + (k * 9) % 34} r="6" fill={['#e05a47', '#3f8fd1', '#e9b83c', '#5aa55a', '#9a5ac8', '#e07a2f'][k]} />)}<rect x="74" y="12" width="40" height="46" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />{Array.from({ length: 25 }, (_, k) => <rect key={k} x={76 + (k % 5) * 7.6} y={14 + Math.floor(k / 5) * 8.6} width="6.6" height="7.6" fill={k === 12 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="0.5" />)}</svg>
        <p>{benef ? 'Bingo da paróquia: as cartelas ajudam a festa; o prêmio é prenda (a cesta, o liquidificador, a bicicleta).' : 'Salão de bingo: 75 bolas, a primeira linha e a cartela cheia pagam uma parte da venda das cartelas.'}</p>
        <div className="apostas18__linha"><span>Cartelas</span>{[1, 2, 4, 6].map(x => <button key={x} type="button" className={`apostas18__chip${n === x ? ' apostas18__chip--ativo' : ''}`} aria-pressed={n === x} onClick={() => setN(x)}>{x}</button>)}
          <BotaoAcao vida={vida} agir={agir} variante="principal" acao={a18({ jogo: 'bingo', oque: 'jogar', cartelas: n })}>Jogar uma rodada · {dinheiroCurto(precoDaCartela(vida) * n)}</BotaoAcao>
        </div>
        {ult && <p className="resultado-aposta" role="status" aria-live="polite">{ult.texto}</p>}
      </div>
    </div>
  );
}

/* ================================================================== Histórico */

export function Historico18({ vida }: { vida: Vida }) {
  const h = vida.apostas18?.historico ?? [];
  const e = vida.apostas;
  const anoT = anoDe(vida.t);
  const doAno = h.filter(x => anoDe(x.t) === anoT);
  const soma = (xs: typeof h) => xs.reduce((s, x) => s + x.recebido - x.apostado, 0);
  return (
    <div className="apostas18">
      <dl className="apostas18__balanco">
        <div><dt>Este ano (todas as apostas)</dt><dd>{e && e.ano.t === vida.t ? `${e.ano.recebido - e.ano.apostado >= 0 ? '+' : '−'}${dinheiroCurto(Math.abs(e.ano.recebido - e.ano.apostado))}` : '—'}</dd></div>
        <div><dt>Na vida inteira</dt><dd>{e ? `${e.total.recebido - e.total.apostado >= 0 ? '+' : '−'}${dinheiroCurto(Math.abs(e.total.recebido - e.total.apostado))}` : '—'}</dd></div>
        <div><dt>Loterias, esportes, turfe e bingo neste ano</dt><dd>{doAno.length ? `${soma(doAno) >= 0 ? '+' : '−'}${dinheiroCurto(Math.abs(soma(doAno)))}` : '—'}</dd></div>
      </dl>
      {h.length ? (
        <ol className="apostas18__historico">{h.slice(0, 40).map((x, k) => <li key={k}><span className="apostas18__hist-ano">{anoDe(x.t)}</span><span>{x.texto}</span><span className={x.recebido - x.apostado >= 0 ? 'campo18__bom' : 'campo18__ruim'}>{x.recebido - x.apostado >= 0 ? '+' : '−'}{dinheiroCurto(Math.abs(x.recebido - x.apostado))}</span></li>)}</ol>
      ) : <p className="vazio">Nenhuma aposta conferida ainda.</p>}
    </div>
  );
}
