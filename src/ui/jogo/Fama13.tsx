/**
 * VIDA 13 · FAMA — a fama como parte própria de Você (só aparece quando o público conhece o nome, há prestígio no meio
 * ou um público nas redes). Lê o núcleo único (`motor/sistemas/reconhecimento13`): o tamanho do nome e a tendência, por
 * que conhecem você (com o registro), a imagem (admiração × rejeição), o que a fama traz e o que cobra (com o dinheiro
 * que pagou), o que fazer com o nome (os usos de sempre, `visibilidade`) e a fama no tempo (os marcos guardados).
 */
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { leituraDaFama } from '../../motor/sistemas/fama';
import { leituraDoNome } from '../../motor/sistemas/notoriedade';
import { USOS } from '../../motor/sistemas/visibilidade';
import { leituraDaFama13, marcosDaFama13, ROTULO_ORIGEM, tomDoMarco13 } from '../../motor/sistemas/reconhecimento13';
import { BotaoAcao, Dado } from '../comum';
import { dinheiroCurto } from '../apresentar';
import { anoDe } from '../../motor/tempo';
import './fama13.css';
import { Manchete161 } from '../v16/areas/Capas161';

const CHEGA: Record<string, string> = { 'a cidade': 'à cidade', 'a região': 'à região', 'o país': 'ao país todo', 'fora do país': 'além das fronteiras' };
const DEGRAUS = ['anônimo', 'local', 'reconhecido', 'famoso', 'muito famoso'];

/** A notoriedade ano a ano, num traço (sem eixo: a forma da fama, com o primeiro e o último ano). */
function Trajeto({ serie }: { serie: [number, number][] }) {
  if (serie.length < 2) return null;
  const w = 240, h = 48;
  const a0 = serie[0][0], a1 = serie[serie.length - 1][0];
  const x = (a: number) => (a1 === a0 ? 0 : ((a - a0) / (a1 - a0)) * w);
  const y = (n: number) => h - 2 - (n / 100) * (h - 4);
  const pts = serie.map(([a, n]) => `${x(a).toFixed(1)},${y(n).toFixed(1)}`).join(' ');
  const pico = serie.reduce((m, s) => (s[1] > m[1] ? s : m), serie[0]);
  return (
    <figure className="fama13__trajeto" aria-label={`A notoriedade de ${a0} a ${a1}: o pico foi ${pico[1]} em ${pico[0]}`}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
        {[10, 30, 55, 78].map(f => <line key={f} x1="0" x2={w} y1={y(f)} y2={y(f)} className="fama13__faixa" />)}
        <polyline points={pts} className="fama13__linha" />
        <circle cx={x(pico[0])} cy={y(pico[1])} r="3" className="fama13__pico" />
      </svg>
      <figcaption><span>{a0}</span><span>pico {pico[1]} em {pico[0]}</span><span>{a1}</span></figcaption>
    </figure>
  );
}

function Barra({ rotulo, valor, tom }: { rotulo: string; valor: number; tom: 'bom' | 'ruim' }) {
  return (
    <div className={`fama13__barra fama13__barra--${tom}`}>
      <span className="fama13__barra-rotulo">{rotulo}</span>
      <span className="fama13__barra-trilho" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={valor} aria-label={rotulo}><span style={{ width: `${Math.max(2, valor)}%` }} /></span>
      <span className="fama13__barra-valor">{valor}</span>
    </div>
  );
}

export function Fama13({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraDaFama13(vida);
  const f = leituraDaFama(vida);
  const nome = leituraDoNome(vida);
  const marcos = marcosDaFama13(vida).filter(m => m.tipo !== 'causa').slice(-10).reverse();
  // Só o que cabe ao tamanho do nome: o bloqueado por "o público ainda não conhece você o bastante" não vira parede de botões mortos.
  const usos = USOS.filter(u => { const d = disponibilidade(vida, { tipo: 'visibilidade', oque: u.id }); return d.grau !== 'impossivel' && !(d.grau === 'requisito' && /conhecer você/.test(d.motivo ?? '')); });
  const seta = l.tendencia === 'subindo' ? '↑ subindo' : l.tendencia === 'caindo' ? '↓ caindo' : '— estável';
  return (
    <div className="fama13">
      <section className="fama13__capa" aria-labelledby="fama13-titulo">
        <Manchete161 vida={vida} />
        <p className="rotulo-pequeno">Fama{l.origem ? ` · ${ROTULO_ORIGEM[l.origem]}` : ''}</p>
        <h2 id="fama13-titulo" className="fama13__palavra">{l.palavra.charAt(0).toUpperCase() + l.palavra.slice(1)}{nome?.por ? <span className="fama13__por"> {nome.por}</span> : null}</h2>
        <ol className="fama13__escada" aria-label={`Notoriedade ${l.valor} de 100`}>
          {DEGRAUS.map((d, k) => <li key={d} className={k === l.nivel ? 'fama13__degrau fama13__degrau--aqui' : k < l.nivel ? 'fama13__degrau fama13__degrau--passou' : 'fama13__degrau'} aria-current={k === l.nivel ? 'step' : undefined}>{d}</li>)}
        </ol>
        <dl className="dados fama13__ficha fama-ficha">
          <Dado rotulo="Reconhecimento público"><span className="fama13__numeros"><strong>{l.valor}</strong> de 100 <span className={`fama13__tendencia fama13__tendencia--${l.tendencia === 'subindo' ? 'bom' : l.tendencia === 'caindo' ? 'ruim' : 'neutro'}`}>{seta}</span></span></Dado>
          <Dado rotulo="Alcance">{l.alcance === 'ninguém' ? 'só quem convive com você' : `o nome chega ${CHEGA[l.alcance] ?? `a ${l.alcance}`}`}</Dado>
          <Dado rotulo="Privacidade">{l.privacidade}</Dado>
          <Dado rotulo="Prestígio profissional">{f.prestigio.palavra}{f.prestigio.por && f.prestigio.valor >= 12 ? ` (${f.prestigio.por})` : ''}</Dado>
          {f.digital && <Dado rotulo="Nas redes">{f.digital.palavra} · {f.digital.credibilidade}</Dado>}
        </dl>
        <Trajeto serie={vida.fama13?.serie ?? []} />
      </section>

      {l.origens.length > 0 && (
        <section className="fama13__bloco" aria-labelledby="fama13-origens">
          <h3 id="fama13-origens" className="voce-subtitulo">Por que conhecem você</h3>
          <ul className="fama13__origens">
            {l.origens.map(o => (
              <li key={o.origem} className={`fama13__origem fama13__origem--${o.origem}`}>
                <span className="fama13__selo">{ROTULO_ORIGEM[o.origem]}</span>
                <span className="fama13__porque">{o.porque.charAt(0).toUpperCase() + o.porque.slice(1)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {l.imagem && (
        <section className="fama13__bloco" aria-labelledby="fama13-imagem">
          <h3 id="fama13-imagem" className="voce-subtitulo">Imagem pública: {l.imagem.palavra}</h3>
          <Barra rotulo="Admiração" valor={l.imagem.admiracao} tom="bom" />
          <Barra rotulo="Rejeição" valor={l.imagem.rejeicao} tom="ruim" />
          <p className="nota">{l.imagem.texto} O tempo apaga devagar — o que é ruim, mais devagar ainda.</p>
        </section>
      )}

      <div className="fama13__dois">
        <section className="fama13__bloco fama13__lado fama13__lado--bom" aria-labelledby="fama13-traz">
          <h3 id="fama13-traz" className="voce-subtitulo">O que a fama traz</h3>
          {(l.imagemMensal > 0 || l.receitaTotal > 0) && (
            <dl className="dados fama13__dinheiro">
              {l.imagemMensal > 0 && <Dado rotulo="Patrocínio por mês">{dinheiroCurto(l.imagemMensal)}</Dado>}
              {l.receitaAno > 0 && <Dado rotulo="Campanhas e convites (12 meses)">{dinheiroCurto(l.receitaAno)}</Dado>}
              {l.receitaTotal > 0 && <Dado rotulo="Pago pela fama, na vida">{dinheiroCurto(l.receitaTotal)}</Dado>}
            </dl>
          )}
          {l.beneficios.length ? <ul className="fama13__lista">{l.beneficios.map(b => <li key={b}>{b}</li>)}</ul> : <p className="nota">Por enquanto, quase nada: o nome ainda é pequeno.</p>}
        </section>
        <section className="fama13__bloco fama13__lado fama13__lado--ruim" aria-labelledby="fama13-cobra">
          <h3 id="fama13-cobra" className="voce-subtitulo">O que a fama cobra</h3>
          {l.custos.length ? <ul className="fama13__lista">{l.custos.map(b => <li key={b}>{b}</li>)}</ul> : <p className="nota">Quase nada ainda: dá para ir à padaria em paz.</p>}
        </section>
      </div>

      {usos.length === 0 && l.valor < 25 && <p className="nota">Quando o público conhecer mais o seu nome, dá para usá-lo: entrevistas, causas, publicidade, recolhimento.</p>}
      {usos.length > 0 && (
        <section className="fama13__bloco" aria-labelledby="fama13-usar">
          <h3 id="fama13-usar" className="voce-subtitulo">O que fazer com o nome</h3>
          <p className="nota">O resultado não é garantido: depende do tamanho do nome, da origem dele, da imagem — e do dia.</p>
          <ul className="experiencias__lista">
            {usos.map(u => (
              <li key={u.id} className="experiencia">
                <span className="experiencia__texto"><strong>{u.rotulo}</strong><span>{u.descricao}</span></span>
                <BotaoAcao vida={vida} acao={{ tipo: 'visibilidade', oque: u.id }} agir={agir} variante="discreto">{u.id === 'privacidade' ? 'Recolher-se' : 'Fazer'}</BotaoAcao>
              </li>
            ))}
          </ul>
        </section>
      )}

      {marcos.length > 0 && (
        <section className="fama13__bloco" aria-labelledby="fama13-tempo">
          <h3 id="fama13-tempo" className="voce-subtitulo">A fama no tempo</h3>
          <ol className="fama13__marcos">
            {marcos.map(m => (
              <li key={m.ref} className={`fama13__marco fama13__marco--${tomDoMarco13(m)}`}>
                <span className="fama13__ano">{anoDe(m.t)}</span>
                <span>{m.texto.replace(/ \(\d{4}\)$/, '')}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

export default Fama13;
