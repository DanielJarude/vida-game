/**
 * VIDA 31 · O PAINEL DO HOJE — a vida em cinco barras, lidas direto do motor (nada estimado): a saúde, a felicidade, o
 * estresse, a forma e o dinheiro. Cada barra leva ao lugar onde se cuida dela. O detalhe (as causas, as tendências)
 * continua em Eu; aqui é o golpe de vista do começo do ano.
 */
import type { Vida } from '../../motor/tipos';
import { idade } from '../../motor/nucleo';
import { ESCALA_SEGURANCA, leituraDaSeguranca } from '../leituraMaterial';
import type { Aba } from '../navegacao';

interface Barra { id: string; rotulo: string; valor: number; texto: string; tom: 'bom' | 'medio' | 'ruim'; ir: Aba }

const tomDe = (x: number, invertido = false): Barra['tom'] => { const v = invertido ? 100 - x : x; return v >= 60 ? 'bom' : v >= 35 ? 'medio' : 'ruim'; };
const n = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

export function barrasDaVida(v: Vida): Barra[] {
  const i = idade(v);
  const out: Barra[] = [
    { id: 'saude', rotulo: 'Saúde', valor: n(v.corpo.saude), texto: String(n(v.corpo.saude)), tom: tomDe(v.corpo.saude), ir: 'prontuario' },
    { id: 'felicidade', rotulo: 'Felicidade', valor: n(v.mente.felicidade), texto: String(n(v.mente.felicidade)), tom: tomDe(v.mente.felicidade), ir: 'voce' },
    { id: 'estresse', rotulo: 'Estresse', valor: n(v.mente.estresse), texto: `${n(v.mente.estresse)}%`, tom: tomDe(v.mente.estresse, true), ir: 'semana' }
  ];
  if (i >= 4) out.push({ id: 'forma', rotulo: 'Forma', valor: n(v.corpo.forma), texto: String(n(v.corpo.forma)), tom: tomDe(v.corpo.forma), ir: 'corpo' });
  if (i >= 14) {
    const s = leituraDaSeguranca(v);
    const k = ESCALA_SEGURANCA.indexOf(s.nivel);
    const valor = k < 0 ? 50 : Math.round(((k + 1) / ESCALA_SEGURANCA.length) * 100);
    out.push({ id: 'dinheiro', rotulo: 'Dinheiro', valor, texto: s.palavra, tom: k < 0 ? 'medio' : k >= 3 ? 'bom' : k >= 2 ? 'medio' : 'ruim', ir: 'dinheiro' });
  }
  return out;
}

export function StatusDaVida31({ vida, irPara }: { vida: Vida; irPara: (a: Aba) => void }) {
  return (
    <ul className="status31" aria-label="Como a vida está">
      {barrasDaVida(vida).map(b => (
        <li key={b.id}>
          <button type="button" className={`status31__item status31__item--${b.id} status31__item--${b.tom}`} onClick={() => irPara(b.ir)}>
            <span className="status31__topo"><span className="status31__rotulo">{b.rotulo}</span><strong className="status31__valor">{b.texto}</strong></span>
            <span className="status31__trilho" aria-hidden><span className="status31__barra" style={{ width: `${Math.max(4, b.valor)}%` }} /></span>
          </button>
        </li>
      ))}
    </ul>
  );
}
