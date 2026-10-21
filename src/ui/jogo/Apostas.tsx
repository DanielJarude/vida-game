/**
 * REWORK 10 · JOG-01 — Vida · Apostas: a loteria, o blackjack, a roleta e o caça-níquel da Raposa, jogáveis de verdade,
 * só com o dinheiro do jogo. Carregada sob demanda (um pacote à parte; o service worker guarda para o modo offline).
 *
 * O que a tela respeita: cada controle tem regra por trás (não há botão de "dividir" no blackjack porque a regra não
 * existe); o que se vê é o que foi sorteado (a roda para na casa sorteada, os rolos mostram os símbolos sorteados — a
 * animação representa o resultado, não o decide); as regras, as chances e o retorno médio estão à vista; nada empurra a
 * apostar de novo (sem "quase!", sem rodada automática, sem bônus); a autoexclusão e o limite ficam a um toque.
 */
import { useMemo, useState } from 'react';
import type { Vida, Carta, Simbolo, TipoDeApostaNaRoleta, ApostaNaRoleta, ResultadoDeAposta } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { BotaoAcao, Subnav } from '../comum';
import { idade } from '../../motor/nucleo';
import { dinheiroCurto } from '../leituraMaterial';
import {
  balancoDasApostas, chanceLoteria, LOTERIA, PAGA_ROLETA, PAGA_TRES, precoDoBilhete, proibido, ROLO, rtpLoteria, rtpNiquel,
  valorDaMao, valoresDeAposta, VERMELHOS
} from '../../motor/sistemas/apostas';

type Jogo = 'loteria' | 'blackjack' | 'roleta' | 'niquel';
const JOGOS: { id: Jogo; rotulo: string; oque: string }[] = [
  { id: 'loteria', rotulo: 'Loteria', oque: 'Seis de quarenta: um bilhete, um sorteio' },
  { id: 'blackjack', rotulo: 'Blackjack', oque: 'Vinte e um contra a banca' },
  { id: 'roleta', rotulo: 'Roleta', oque: 'Roleta europeia, um zero' },
  { id: 'niquel', rotulo: 'Caça-níquel', oque: 'A máquina da Raposa: três rolos, uma linha' }
];
const pct = (x: number) => `${(Math.round(x * 1000) / 10).toString().replace('.', ',')}%`;

export function Apostas({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [jogo, setJogo] = useState<Jogo>('loteria');
  const i = idade(vida);
  if (i < 18) return <p className="vazio">Aposta é coisa de maior de idade.</p>;
  if (proibido(vida)) return <p className="vazio">Aqui, o jogo de azar é proibido por lei: não há loteria nem cassino.</p>;
  const b = balancoDasApostas(vida);
  const ultima = vida.apostas?.ultimas[0];
  return (
    <div className="apostas">
      <header className="apostas__cabeca">
        <p className="apostas__aviso">Só com o dinheiro do jogo: na conta, <strong>{dinheiroCurto(Math.max(0, vida.financas.conta))}</strong>. Não se aposta o aplicado nem o emprestado.</p>
        <p className="nota">{b.frase}{b.ano ? ` Este ano: ${b.ano >= 0 ? '+' : '−'}${dinheiroCurto(Math.abs(b.ano))}.` : ''} Em todo jogo daqui, a casa fica com uma parte de cada aposta, em média — as chances e o retorno estão nas regras de cada mesa.</p>
      </header>
      <Subnav rotulo="Jogos" prefixo="apostas" itens={JOGOS} atual={jogo} aoMudar={setJogo} classe="subnav--apostas" />
      <div role="tabpanel" id="apostas-painel" aria-labelledby={`apostas-aba-${jogo}`}>
        {jogo === 'loteria' && <Loteria vida={vida} agir={agir} ultima={ultima?.jogo === 'loteria' ? ultima : undefined} />}
        {jogo === 'blackjack' && <Blackjack vida={vida} agir={agir} ultima={ultima?.jogo === 'blackjack' ? ultima : undefined} />}
        {jogo === 'roleta' && <Roleta vida={vida} agir={agir} ultima={ultima?.jogo === 'roleta' ? ultima : undefined} />}
        {jogo === 'niquel' && <Niquel vida={vida} agir={agir} ultima={ultima?.jogo === 'niquel' ? ultima : undefined} />}
      </div>
      <Controle vida={vida} agir={agir} />
    </div>
  );
}

/** A autoexclusão e o limite (sempre à mão, sem drama). */
function Controle({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const e = vida.apostas;
  return (
    <details className="apostas__controle">
      <summary>Limites e autoexclusão</summary>
      {e?.autoexclusao !== undefined && vida.t < e.autoexclusao ? <p className="nota">Você está fora das apostas até {Math.floor(e.autoexclusao / 12)}.</p> : (
        <div className="grupo-acoes">
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'controle', oque: 'autoexcluir' } }} agir={agir} variante="secundario">Ficar fora das apostas por um ano</BotaoAcao>
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'controle', oque: 'limite' } }} agir={agir} variante="discreto">{e?.limiteAnual ? `Tirar o limite de ${dinheiroCurto(e.limiteAnual)} por ano` : 'Pôr um limite de perda no ano'}</BotaoAcao>
        </div>
      )}
    </details>
  );
}

/* ------------------------------------------------------------------- Loteria */

function Loteria({ vida, agir, ultima }: { vida: Vida; agir: (a: Acao) => boolean; ultima?: ResultadoDeAposta }) {
  const [marcados, setMarcados] = useState<number[]>([]);
  const preco = precoDoBilhete(vida);
  const alternar = (n: number) => setMarcados(m => (m.includes(n) ? m.filter(x => x !== n) : m.length < 6 ? [...m, n].sort((a, b) => a - b) : m));
  const surpresinha = () => { const bolas = Array.from({ length: 40 }, (_, k) => k + 1); const out: number[] = []; while (out.length < 6) { const k = Math.floor(Math.random() * bolas.length); out.push(bolas.splice(k, 1)[0]); } setMarcados(out.sort((a, b) => a - b)); };
  return (
    <section className="loteria" aria-label="Loteria">
      <div className="bilhete papel papel--sem-dobra">
        <p className="bilhete__cabeca"><span>Seis de Quarenta</span><span>bilhete · {dinheiroCurto(preco)}</span></p>
        <div className="bilhete__grade" role="group" aria-label="Escolha seis números">
          {Array.from({ length: 40 }, (_, k) => k + 1).map(n => (
            <button key={n} type="button" className={`bilhete__numero${marcados.includes(n) ? ' bilhete__numero--marcado' : ''}${ultima?.sorteio?.includes(n) ? ' bilhete__numero--sorteado' : ''}`} aria-pressed={marcados.includes(n)} onClick={() => alternar(n)}>{String(n).padStart(2, '0')}</button>
          ))}
        </div>
        <p className="nota">{marcados.length}/6 marcados{marcados.length ? `: ${marcados.join(', ')}` : ''}.</p>
        <div className="grupo-acoes grupo-acoes--linha">
          <button type="button" className="botao botao--discreto" onClick={surpresinha}>Escolher ao acaso</button>
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'loteria', numeros: marcados } }} agir={agir} variante="principal" semAviso>Comprar e conferir o sorteio</BotaoAcao>
        </div>
      </div>
      {ultima?.sorteio && (
        <div className="resultado-aposta" role="status" aria-live="polite">
          <p className="resultado-aposta__rotulo">O sorteio</p>
          <ul className="loteria__bolas">{ultima.sorteio.map(n => <li key={n} className="loteria__bola">{String(n).padStart(2, '0')}</li>)}</ul>
          <p>{ultima.texto}</p>
        </div>
      )}
      <details className="regras">
        <summary>Regras e chances</summary>
        <p>Seis números de 1 a 40; sorteiam-se seis. O prêmio é fixo, em vezes o bilhete:</p>
        <table className="regras__tabela"><thead><tr><th>Acertos</th><th>Paga</th><th>Chance</th></tr></thead>
          <tbody>{[6, 5, 4, 3].map(k => <tr key={k}><td>{k}</td><td>{LOTERIA.premio[k].toLocaleString('pt-BR')}×</td><td>1 em {Math.round(1 / chanceLoteria(k)).toLocaleString('pt-BR')}</td></tr>)}</tbody></table>
        <p className="nota">Em média, a loteria devolve {pct(rtpLoteria())} do que recebe.</p>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------- Blackjack */

const NAIPE: Record<Carta['n'], string> = { copas: '♥', ouros: '♦', espadas: '♠', paus: '♣' };
const VALOR = (v: number) => (v === 1 ? 'A' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v));
function CartaDesenho({ c, virada }: { c?: Carta; virada?: boolean }) {
  if (virada || !c) return <span className="carta carta--virada" aria-label="carta virada" />;
  const verm = c.n === 'copas' || c.n === 'ouros';
  return <span className={`carta${verm ? ' carta--vermelha' : ''}`} aria-label={`${VALOR(c.v)} de ${c.n}`}><span className="carta__valor">{VALOR(c.v)}</span><span className="carta__naipe" aria-hidden>{NAIPE[c.n]}</span></span>;
}
function Blackjack({ vida, agir, ultima }: { vida: Vida; agir: (a: Acao) => boolean; ultima?: ResultadoDeAposta }) {
  const valores = valoresDeAposta(vida);
  const [valor, setValor] = useState(valores[0]);
  const mao = vida.apostas?.mao;
  const voce = mao?.voce ?? ultima?.voce ?? [];
  const banca = mao?.banca ?? ultima?.banca ?? [];
  return (
    <section className="mesa mesa--blackjack" aria-label="Blackjack">
      <div className="mesa__feltro">
        <div className="mesa__lado"><p className="mesa__rotulo">Banca{!mao && banca.length ? ` · ${valorDaMao(banca).total}` : ''}</p><div className="mesa__cartas">{banca.map((c, k) => <CartaDesenho key={k} c={c} virada={!!mao && k === 1} />)}</div></div>
        <div className="mesa__lado"><p className="mesa__rotulo">Você{voce.length ? ` · ${valorDaMao(voce).total}` : ''}{mao ? ` · aposta ${dinheiroCurto(mao.aposta)}` : ''}</p><div className="mesa__cartas">{voce.map((c, k) => <CartaDesenho key={k} c={c} />)}</div></div>
      </div>
      {!mao && ultima && <p className="resultado-aposta" role="status" aria-live="polite">{ultima.texto}</p>}
      {mao ? (
        <div className="grupo-acoes grupo-acoes--linha">
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'blackjack', oque: 'pedir' } }} agir={agir} variante="principal">Pedir carta</BotaoAcao>
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'blackjack', oque: 'parar' } }} agir={agir} variante="secundario">Parar</BotaoAcao>
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'blackjack', oque: 'dobrar' } }} agir={agir} variante="discreto" ocultarImpossivel>Dobrar (uma carta só)</BotaoAcao>
        </div>
      ) : (
        <div className="apostas__fichas">
          <Fichas valores={valores} valor={valor} aoMudar={setValor} />
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'blackjack', oque: 'apostar', valor } }} agir={agir} variante="principal" semAviso>Apostar {dinheiroCurto(valor)} e dar as cartas</BotaoAcao>
        </div>
      )}
      <details className="regras">
        <summary>Regras</summary>
        <ul>
          <li>Seis baralhos, embaralhados a cada mão. O ás vale 11 ou 1; J, Q e K valem 10.</li>
          <li>Passou de 21, estourou e perdeu. A banca pede carta até 17 e para no 17 (também no 17 com ás).</li>
          <li>Blackjack (ás e uma carta de 10 nas duas primeiras) paga 3 para 2; ganhar paga 1 para 1; empate devolve a aposta.</li>
          <li>Dobrar: nas duas primeiras cartas, a aposta dobra e vem uma carta só. Não há divisão nem seguro nesta mesa.</li>
          <li>Com a melhor estratégia, a casa fica com cerca de 1% do que se aposta.</li>
        </ul>
      </details>
    </section>
  );
}

function Fichas({ valores, valor, aoMudar }: { valores: number[]; valor: number; aoMudar: (v: number) => void }) {
  return (
    <div className="fichas-aposta" role="radiogroup" aria-label="Valor da ficha">
      {valores.map(x => <button key={x} type="button" role="radio" aria-checked={x === valor} className={`ficha-aposta${x === valor ? ' ficha-aposta--escolhida' : ''}`} onClick={() => aoMudar(x)}>{dinheiroCurto(x)}</button>)}
    </div>
  );
}

/* ------------------------------------------------------------------- Roleta */

/** A ordem das casas na roda europeia (a roda de verdade, não 0..36 em fila). */
const RODA = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const APOSTAS_FORA: { tipo: TipoDeApostaNaRoleta; rotulo: string }[] = [
  { tipo: 'vermelho', rotulo: 'Vermelho' }, { tipo: 'preto', rotulo: 'Preto' }, { tipo: 'par', rotulo: 'Par' }, { tipo: 'impar', rotulo: 'Ímpar' },
  { tipo: 'baixo', rotulo: '1–18' }, { tipo: 'alto', rotulo: '19–36' }, { tipo: 'duzia1', rotulo: '1ª dúzia' }, { tipo: 'duzia2', rotulo: '2ª dúzia' }, { tipo: 'duzia3', rotulo: '3ª dúzia' }
];
function RodaDaRoleta({ casa, giro }: { casa?: number; giro: number }) {
  const passo = 360 / 37;
  const angulo = casa === undefined ? 0 : 360 * 4 + (360 - RODA.indexOf(casa) * passo);
  return (
    <svg className="roda" viewBox="-110 -110 220 220" role="img" aria-label={casa === undefined ? 'A roda da roleta' : `A roda parou no ${casa}`}>
      <g key={giro} className="roda__giro" style={{ ['--angulo' as string]: `${angulo}deg` }}>
        {RODA.map((n, k) => {
          const a0 = (k * passo - passo / 2 - 90) * Math.PI / 180, a1 = (k * passo + passo / 2 - 90) * Math.PI / 180;
          const cor = n === 0 ? 'var(--roleta-verde)' : VERMELHOS.has(n) ? 'var(--roleta-vermelho)' : 'var(--roleta-preto)';
          const mid = (k * passo - 90) * Math.PI / 180;
          return (
            <g key={n}>
              <path d={`M0 0 L${100 * Math.cos(a0)} ${100 * Math.sin(a0)} A100 100 0 0 1 ${100 * Math.cos(a1)} ${100 * Math.sin(a1)} Z`} fill={cor} stroke="var(--roleta-fio)" strokeWidth="0.6" />
              <text x={84 * Math.cos(mid)} y={84 * Math.sin(mid)} className="roda__numero" textAnchor="middle" dominantBaseline="central" transform={`rotate(${k * passo} ${84 * Math.cos(mid)} ${84 * Math.sin(mid)})`}>{n}</text>
            </g>
          );
        })}
        <circle r="46" fill="var(--roleta-centro)" />
      </g>
      <path d="M0 -104 L-6 -116 L6 -116 Z" className="roda__ponteiro" />
    </svg>
  );
}
function Roleta({ vida, agir, ultima }: { vida: Vida; agir: (a: Acao) => boolean; ultima?: ResultadoDeAposta }) {
  const valores = valoresDeAposta(vida);
  const [valor, setValor] = useState(valores[0]);
  const [apostas, setApostas] = useState<ApostaNaRoleta[]>([]);
  const [numero, setNumero] = useState(17);
  const total = apostas.reduce((s, a) => s + a.valor, 0);
  const giro = vida.apostas?.ultimas.filter(x => x.jogo === 'roleta').length ?? 0;
  const poe = (tipo: TipoDeApostaNaRoleta, n?: number) => setApostas(as => [...as, { tipo, valor, ...(tipo === 'numero' ? { numero: n } : {}) }]);
  return (
    <section className="mesa mesa--roleta" aria-label="Roleta">
      <div className="roleta">
        <RodaDaRoleta casa={ultima?.casa} giro={giro} />
        <div className="roleta__mesa">
          <Fichas valores={valores} valor={valor} aoMudar={setValor} />
          <div className="roleta__fora" role="group" aria-label="Apostas de fora (1:1 e 2:1)">
            {APOSTAS_FORA.map(x => <button key={x.tipo} type="button" className={`roleta__aposta roleta__aposta--${x.tipo}`} onClick={() => poe(x.tipo)}>{x.rotulo}</button>)}
          </div>
          <div className="roleta__numero">
            <label className="campo"><span className="campo__rotulo">Um número (paga 35:1)</span>
              <input type="number" min={0} max={36} value={numero} onChange={e => setNumero(Math.max(0, Math.min(36, Math.round(Number(e.target.value)) || 0)))} /></label>
            <button type="button" className="botao botao--secundario" onClick={() => poe('numero', numero)}>Apostar no {numero}</button>
          </div>
          {apostas.length > 0 && (
            <div className="roleta__apostas">
              <p className="nota">Na mesa: {apostas.map(a => `${a.tipo === 'numero' ? `nº ${a.numero}` : APOSTAS_FORA.find(x => x.tipo === a.tipo)!.rotulo} ${dinheiroCurto(a.valor)}`).join(' · ')} — total {dinheiroCurto(total)}.</p>
              <button type="button" className="link" onClick={() => setApostas([])}>Tirar as fichas</button>
            </div>
          )}
          <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'roleta', apostas } }} agir={agir} variante="principal" semAviso aoAgir={() => setApostas([])}>Girar a roda</BotaoAcao>
        </div>
      </div>
      {ultima && <p className="resultado-aposta" role="status" aria-live="polite">{ultima.texto}</p>}
      <details className="regras">
        <summary>Regras e pagamentos</summary>
        <ul>
          <li>Roleta europeia: 37 casas (0 a 36), um zero só. O zero perde todas as apostas de fora.</li>
          <li>Vermelho/preto, par/ímpar, 1–18/19–36: pagam {PAGA_ROLETA.vermelho - 1} para 1. Dúzias: {PAGA_ROLETA.duzia1 - 1} para 1. Um número: {PAGA_ROLETA.numero - 1} para 1.</li>
          <li>Em toda aposta, a roleta devolve, em média, 36 de cada 37 (97,3%).</li>
        </ul>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------- Caça-níquel da Raposa */

const NOME_SIMBOLO: Record<Simbolo, string> = { folha: 'folha', sino: 'sino', estrela: 'estrela', moeda: 'moeda', raposa: 'raposa' };
function SimboloDesenho({ s }: { s: Simbolo }) {
  return (
    <svg className={`simbolo simbolo--${s}`} viewBox="0 0 40 40" role="img" aria-label={NOME_SIMBOLO[s]}>
      {s === 'folha' && <path d="M8 30 C8 14 20 6 33 7 C34 20 26 32 10 32 Z M10 30 L26 14" fill="var(--niquel-folha)" stroke="var(--niquel-traco)" strokeWidth="1.5" />}
      {s === 'sino' && <path d="M20 6 C12 6 11 14 11 20 L8 27 L32 27 L29 20 C29 14 28 6 20 6 Z M17 29 A3 3 0 0 0 23 29" fill="var(--niquel-sino)" stroke="var(--niquel-traco)" strokeWidth="1.5" />}
      {s === 'estrela' && <path d="M20 5 L24 15 L35 16 L26 23 L29 34 L20 28 L11 34 L14 23 L5 16 L16 15 Z" fill="var(--niquel-estrela)" stroke="var(--niquel-traco)" strokeWidth="1.5" />}
      {s === 'moeda' && <g><circle cx="20" cy="20" r="13" fill="var(--niquel-moeda)" stroke="var(--niquel-traco)" strokeWidth="1.5" /><circle cx="20" cy="20" r="8" fill="none" stroke="var(--niquel-traco)" strokeWidth="1.2" /></g>}
      {s === 'raposa' && <path d="M8 9 L15 17 L25 17 L32 9 L31 22 C29 29 24 33 20 33 C16 33 11 29 9 22 Z M16 23 L18 23 M22 23 L24 23 M19 28 L21 28" fill="var(--niquel-raposa)" stroke="var(--niquel-traco)" strokeWidth="1.5" strokeLinejoin="round" />}
    </svg>
  );
}
function Niquel({ vida, agir, ultima }: { vida: Vida; agir: (a: Acao) => boolean; ultima?: ResultadoDeAposta }) {
  const valores = valoresDeAposta(vida);
  const [valor, setValor] = useState(valores[0]);
  const rtp = useMemo(() => rtpNiquel(), []);
  const giro = vida.apostas?.ultimas.filter(x => x.jogo === 'niquel').length ?? 0;
  const rolos: Simbolo[] = ultima?.rolos ?? ['raposa', 'raposa', 'raposa'];
  return (
    <section className="mesa mesa--niquel" aria-label="Caça-níquel da Raposa">
      <div className="niquel">
        <p className="niquel__nome">A Raposa</p>
        <div className="niquel__janela" aria-label={`Rolos: ${rolos.map(s => NOME_SIMBOLO[s]).join(', ')}`}>
          {rolos.map((s, k) => <span key={`${giro}-${k}`} className="niquel__rolo" style={{ ['--atraso' as string]: `${k * 0.18}s` }}><SimboloDesenho s={s} /></span>)}
        </div>
      </div>
      {ultima && <p className="resultado-aposta" role="status" aria-live="polite">{ultima.texto}</p>}
      <div className="apostas__fichas">
        <Fichas valores={valores} valor={valor} aoMudar={setValor} />
        <BotaoAcao vida={vida} acao={{ tipo: 'aposta', op: { jogo: 'niquel', valor } }} agir={agir} variante="principal" semAviso>Girar ({dinheiroCurto(valor)})</BotaoAcao>
      </div>
      <details className="regras">
        <summary>Tabela de pagamentos</summary>
        <table className="regras__tabela"><thead><tr><th>Na linha</th><th>Paga</th></tr></thead><tbody>
          {(Object.keys(PAGA_TRES) as Simbolo[]).reverse().map(s => <tr key={s}><td>três {NOME_SIMBOLO[s]}s</td><td>{PAGA_TRES[s]}×</td></tr>)}
          <tr><td>raposa, raposa, qualquer</td><td>10×</td></tr><tr><td>raposa no primeiro rolo</td><td>1× (a aposta volta)</td></tr>
        </tbody></table>
        <p className="nota">Cada rolo tem 32 posições ({(Object.keys(ROLO) as Simbolo[]).map(s => `${ROLO[s]} ${NOME_SIMBOLO[s]}${ROLO[s] > 1 ? 's' : ''}`).join(', ')}), sorteadas de forma independente. A máquina devolve, em média, {pct(rtp)} do que recebe.</p>
      </details>
    </section>
  );
}
