/**
 * VIDA 33 · A CAMISA DO TIME — o desenho do uniforme (o modelo, a gola, o padrão, as cores, as mangas), com o escudo no
 * peito e o patrocinador master, quando há. Também o editor que o dono usa na fundação e na loja.
 */
import type { Camisa33, Mangas33, ModeloCamisa33, PadraoCamisa33 } from '../../../motor/v33/dono/loja33';
import { MODELOS33, PADROES_CAMISA33 } from '../../../motor/v33/dono/loja33';
import type { Identidade33 } from '../../../motor/v33/dono/identidade33';
import { Escudo30 } from '../../v30/escudos/Escudo30';
import { SeletorDeCor33 } from './EditorIdentidade33';

const CORPO = 'M35 18 L50 12 Q60 20 70 12 L85 18 L110 34 L100 52 L88 46 L88 108 L32 108 L32 46 L20 52 L10 34 Z';
const TRONCO = 'M35 18 L50 12 Q60 20 70 12 L85 18 L88 46 L88 108 L32 108 L32 46 Z';
const MANGAS = 'M35 18 L10 34 L20 52 L32 46 Z M85 18 L110 34 L100 52 L88 46 Z';
const MANGAS_RAGLAN = 'M50 12 L35 18 L10 34 L20 52 L32 46 L42 26 Z M70 12 L85 18 L110 34 L100 52 L88 46 L78 26 Z';
let seq = 0;

export function DesenhoCamisa33({ camisa, nome, identidade, patrocinador, tamanho = 120 }: { camisa: Omit<Camisa33, 'ano'>; nome: string; identidade?: Identidade33; patrocinador?: string; tamanho?: number }) {
  const id = `cam33-${(seq = (seq + 1) % 1e6)}`;
  const { cor1: a, cor2: b, cor3: c } = camisa;
  const manga = camisa.mangas === 'cor2' ? b : camisa.mangas === 'cor3' ? c : a;
  const claro = (h: string) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150; };
  const textoPat = claro(camisa.padrao === 'metade' || camisa.padrao === 'liso' ? a : b) && claro(a) ? '#111111' : '#ffffff';
  return (
    <svg className="dono33__camisa" width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-label={`Camisa do ${nome}`}>
      <defs>
        <clipPath id={`${id}-t`}><path d={TRONCO} /></clipPath>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <path d={CORPO} fill={a} />
      <g clipPath={`url(#${id}-t)`}>
        {camisa.padrao === 'listras' && [0, 1, 2, 3, 4, 5].map(k => k % 2 === 1 && <rect key={k} x={32 + k * 9.4} y="0" width="9.4" height="120" fill={b} />)}
        {camisa.padrao === 'horizontal' && [0, 1, 2, 3, 4, 5, 6, 7].map(k => k % 2 === 1 && <rect key={k} x="0" y={12 + k * 12} width="120" height="12" fill={b} />)}
        {camisa.padrao === 'faixa' && <path d="M20 30 L40 10 L110 90 L90 110 Z" fill={b} />}
        {camisa.padrao === 'metade' && <rect x="60" y="0" width="60" height="120" fill={b} />}
        {camisa.padrao === 'ombros' && <rect x="0" y="14" width="120" height="16" fill={b} />}
        {camisa.padrao === 'gradiente' && <rect x="0" y="0" width="120" height="120" fill={`url(#${id}-g)`} />}
        {camisa.padrao === 'risca' && Array.from({ length: 12 }, (_, k) => <rect key={k} x={34 + k * 5} y="0" width="1" height="120" fill={b} opacity="0.8" />)}
        {camisa.modelo === 'jersey' && <><path d="M32 46 L44 108 L32 108 Z" fill={c} /><path d="M88 46 L76 108 L88 108 Z" fill={c} /></>}
      </g>
      <path d={camisa.modelo === 'raglan' ? MANGAS_RAGLAN : MANGAS} fill={manga} />
      <path d="M12 37 L18 49 M108 37 L102 49" stroke={c} strokeWidth="3" />
      {camisa.modelo === 'redonda' && <path d="M50 12 Q60 22 70 12" fill="none" stroke={c} strokeWidth="3.5" />}
      {(camisa.modelo === 'v' || camisa.modelo === 'jersey') && <path d="M50 12 L60 27 L70 12" fill="none" stroke={c} strokeWidth="3.5" />}
      {camisa.modelo === 'polo' && <><path d="M50 12 L56 24 L60 20 L64 24 L70 12" fill={c} stroke={c} strokeWidth="2" /><path d="M60 20 L60 36" stroke={c} strokeWidth="2" /><circle cx="60" cy="28" r="1.2" fill={a} /><circle cx="60" cy="33" r="1.2" fill={a} /></>}
      {camisa.modelo === 'raglan' && <path d="M50 12 Q60 22 70 12" fill="none" stroke={c} strokeWidth="3.5" />}
      <g transform="translate(66 30)"><Escudo30 nome={nome} identidade={identidade} tamanho={13} /></g>
      {patrocinador && <text x="60" y="68" textAnchor="middle" fontSize={patrocinador.length > 14 ? 6 : 7.5} fontWeight="800" fill={textoPat} fontFamily="system-ui, sans-serif">{patrocinador.toUpperCase()}</text>}
      <path d={CORPO} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="1.2" />
    </svg>
  );
}

/** O editor da camisa (o desenho ao lado). */
export function EditorCamisa33({ camisa, mudar, esports }: { camisa: Omit<Camisa33, 'ano'>; mudar: (c: Omit<Camisa33, 'ano'>) => void; esports?: boolean }) {
  const modelos = MODELOS33.filter(m => esports || m.id !== 'jersey');
  return (
    <div className="dono33__editor">
      <fieldset className="dono33__campo"><legend>Modelo</legend>
        <div className="dono33__fichas">{modelos.map(m => <button key={m.id} type="button" className="chip" aria-pressed={camisa.modelo === m.id} onClick={() => mudar({ ...camisa, modelo: m.id as ModeloCamisa33 })}>{m.nome}</button>)}</div>
      </fieldset>
      <fieldset className="dono33__campo"><legend>Padrão</legend>
        <div className="dono33__fichas">{PADROES_CAMISA33.map(p => <button key={p.id} type="button" className="chip" aria-pressed={camisa.padrao === p.id} onClick={() => mudar({ ...camisa, padrao: p.id as PadraoCamisa33 })}>{p.nome}</button>)}</div>
      </fieldset>
      <SeletorDeCor33 rotulo="Cor principal" valor={camisa.cor1} mudar={x => mudar({ ...camisa, cor1: x })} />
      <SeletorDeCor33 rotulo="Segunda cor" valor={camisa.cor2} mudar={x => mudar({ ...camisa, cor2: x })} />
      <SeletorDeCor33 rotulo="Detalhes (gola, punhos)" valor={camisa.cor3} mudar={x => mudar({ ...camisa, cor3: x })} />
      <fieldset className="dono33__campo"><legend>Mangas</legend>
        <div className="dono33__fichas">{(['cor1', 'cor2', 'cor3'] as Mangas33[]).map((m, k) => <button key={m} type="button" className="chip" aria-pressed={camisa.mangas === m} onClick={() => mudar({ ...camisa, mangas: m })}>{['Na cor principal', 'Na segunda cor', 'Na cor dos detalhes'][k]}</button>)}</div>
      </fieldset>
    </div>
  );
}

/** Uma camisa de partida a partir da identidade (as mesmas cores do escudo). */
export const camisaDaIdentidade33 = (i: Identidade33 | undefined, esports: boolean): Omit<Camisa33, 'ano'> => ({
  modelo: esports ? 'jersey' : 'redonda', padrao: i && ['listras', 'horizontal', 'faixa', 'metade'].includes(i.padrao) ? i.padrao as PadraoCamisa33 : 'liso',
  cor1: i?.cor1 ?? '#0b3d91', cor2: i?.cor2 ?? '#ffffff', cor3: i?.cor3 ?? '#111111', mangas: 'cor1'
});
