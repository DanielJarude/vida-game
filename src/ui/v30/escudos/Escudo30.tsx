/**
 * VIDA 30 · OS ESCUDOS DOS CLUBES. Cada clube do catálogo tem um escudo desenhado com as cores dele e um traço que o torna
 * reconhecível (as listras, a faixa, a metade, o círculo, a estrela) — nunca o escudo oficial (que é marca registrada):
 * a forma é do VIDA, as cores e o desenho geral são os que a torcida associa ao clube. Um clube fora da tabela recebe um
 * escudo estável pelo nome (formato, padrão e cores variados — nada de dois clubes iguais por acaso).
 */
type Forma = 'classico' | 'redondo' | 'pontudo' | 'reto' | 'hexagono' | 'losango';
type Padrao = 'liso' | 'listras' | 'faixa' | 'metade' | 'horizontal' | 'tres' | 'cruz' | 'aro';
/** [forma, padrão, cor principal, cor secundária, estrela?] */
type Desenho = [Forma, Padrao, string, string, boolean?];

const B = '#ffffff', P = '#111111', V = '#c8102e', VD = '#00813d', AZ = '#0b3d91', AC = '#5aa9e6', AM = '#ffd200', GR = '#7a1c2c', LJ = '#f26b21', RX = '#5b2a86';

import './escudo30.css';
import type { Identidade33, Simbolo33 } from '../../../motor/v33/dono/identidade33';

/**
 * VIDA 33 · os escudos criados pelos donos. Quem fundou um time escolhe a identidade; as telas que recebem a vida registram
 * aqui os escudos dela, e qualquer `<Escudo30 nome=… />` (a tabela do campeonato, a vitrine, a galeria) desenha o escolhido.
 */
const REGISTRO = new Map<string, Identidade33>();
export function registrarIdentidades33(vida: { clube20?: { nome: string; identidade33?: Identidade33 }; equipes32?: { nome: string; identidade33?: Identidade33 }[]; orgEsports31?: { nome: string; identidade33?: Identidade33 } }): void {
  for (const x of [vida.clube20, ...(vida.equipes32 ?? []), vida.orgEsports31]) if (x?.identidade33) REGISTRO.set(x.nome, x.identidade33);
}
export const identidadeRegistrada33 = (nome: string) => REGISTRO.get(nome);

export const ESCUDOS30: Record<string, Desenho> = {
  // Norte e Nordeste
  'Rio Branco': ['classico', 'listras', P, B], 'Atlético Acreano': ['classico', 'metade', AZ, B], Trem: ['redondo', 'faixa', V, B], Amazonas: ['classico', 'listras', AM, P], Manaus: ['pontudo', 'metade', VD, B], Nacional: ['classico', 'liso', AZ, B, true],
  Paysandu: ['classico', 'listras', AC, B, true], Remo: ['classico', 'liso', AZ, B, true], 'Porto Velho': ['redondo', 'liso', VD, AM], 'São Raimundo': ['classico', 'metade', V, B], Palmas: ['reto', 'faixa', AZ, AM],
  CRB: ['classico', 'listras', V, B], CSA: ['classico', 'listras', AZ, B, true], Bahia: ['classico', 'tres', AZ, V, true], Vitória: ['classico', 'listras', V, P], 'Fluminense de Feira': ['classico', 'tres', VD, V], 'Bahia de Feira': ['classico', 'metade', AZ, B], Juazeirense: ['redondo', 'faixa', AZ, B],
  Fortaleza: ['classico', 'tres', AZ, V, true], Ceará: ['classico', 'listras', P, B, true], Ferroviário: ['classico', 'horizontal', V, P], Icasa: ['redondo', 'metade', VD, B], 'Sampaio Corrêa': ['classico', 'tres', AM, VD], 'Moto Club': ['classico', 'listras', V, P],
  'Botafogo-PB': ['classico', 'listras', P, B, true], Treze: ['classico', 'listras', P, B], Campinense: ['classico', 'listras', V, P], Sport: ['classico', 'horizontal', V, P], Náutico: ['classico', 'listras', V, B], 'Santa Cruz': ['classico', 'horizontal', P, V], Central: ['redondo', 'listras', P, B],
  River: ['classico', 'faixa', B, V], 'Flamengo-PI': ['classico', 'horizontal', V, P], ABC: ['classico', 'liso', P, B, true], 'América-RN': ['classico', 'liso', V, B], 'Potiguar de Mossoró': ['redondo', 'listras', V, B], Confiança: ['classico', 'liso', AZ, B], Sergipe: ['classico', 'listras', V, B],
  // Centro-Oeste
  Brasiliense: ['classico', 'liso', AM, VD], Gama: ['classico', 'liso', VD, B], Capital: ['reto', 'faixa', AZ, B], Goiás: ['classico', 'liso', VD, B], 'Vila Nova': ['classico', 'liso', V, B], 'Atlético Goianiense': ['classico', 'listras', V, P], Anápolis: ['redondo', 'metade', V, B], Anapolina: ['classico', 'listras', V, B],
  Cuiabá: ['classico', 'metade', AM, VD], Mixto: ['classico', 'listras', P, B], Operário: ['classico', 'listras', P, B], Comercial: ['classico', 'liso', P, B],
  // Sudeste
  'Rio Branco-ES': ['classico', 'listras', P, B], 'Vitória-ES': ['classico', 'liso', AZ, B], 'Atlético Mineiro': ['classico', 'listras', P, B, true], Cruzeiro: ['redondo', 'liso', AZ, B, true], 'América Mineiro': ['classico', 'faixa', VD, P], Uberlândia: ['classico', 'liso', VD, B], Tupi: ['redondo', 'listras', P, B], Uberaba: ['classico', 'listras', V, B],
  Flamengo: ['redondo', 'horizontal', V, P, true], Fluminense: ['classico', 'tres', GR, VD, true], Vasco: ['classico', 'faixa', P, B, true], Botafogo: ['classico', 'liso', P, B, true], 'Volta Redonda': ['classico', 'liso', AM, P],
  Corinthians: ['redondo', 'liso', B, P], Palmeiras: ['redondo', 'liso', VD, B, true], 'São Paulo': ['pontudo', 'tres', B, V], Portuguesa: ['classico', 'metade', V, VD], 'Santo André': ['classico', 'liso', AZ, B], 'São Bernardo': ['classico', 'liso', AM, P], Guarani: ['classico', 'liso', VD, B, true], 'Ponte Preta': ['redondo', 'faixa', P, B],
  Santos: ['classico', 'listras', P, B, true], 'Botafogo-SP': ['classico', 'listras', P, V], 'Comercial-SP': ['classico', 'liso', P, B], 'São Bento': ['classico', 'liso', AZ, B], Noroeste: ['classico', 'liso', V, B], Marília: ['classico', 'liso', AZ, B], 'XV de Piracicaba': ['classico', 'liso', RX, B],
  // Sul
  'Athletico Paranaense': ['pontudo', 'listras', V, P], Coritiba: ['redondo', 'horizontal', VD, B], 'Paraná Clube': ['classico', 'tres', AZ, V], Londrina: ['classico', 'liso', AC, B], Maringá: ['classico', 'liso', AZ, B], 'Operário Ferroviário': ['classico', 'listras', P, B],
  Grêmio: ['classico', 'listras', AC, P, true], Internacional: ['redondo', 'liso', V, B, true], Juventude: ['classico', 'liso', VD, B], Caxias: ['classico', 'liso', GR, B], 'Brasil de Pelotas': ['classico', 'listras', V, P], Avaí: ['classico', 'listras', AZ, B], Figueirense: ['classico', 'listras', P, B], Joinville: ['classico', 'tres', V, P], Chapecoense: ['redondo', 'liso', VD, B], Criciúma: ['classico', 'listras', AM, P],
  // Fora do Brasil (os grandes que o mundo carrega)
  'Real Madrid': ['redondo', 'liso', B, '#d4af37'], Barcelona: ['pontudo', 'listras', '#a50044', '#004d98'], 'Atlético de Madrid': ['classico', 'listras', V, B], Sevilla: ['classico', 'liso', B, V], Valencia: ['classico', 'liso', B, LJ],
  'Manchester United': ['redondo', 'liso', V, P], 'Manchester City': ['redondo', 'liso', AC, B], Liverpool: ['classico', 'liso', V, '#00a398'], Arsenal: ['classico', 'liso', V, B], Chelsea: ['redondo', 'liso', AZ, B], Tottenham: ['classico', 'liso', B, '#132257'],
  'Bayern de Munique': ['redondo', 'metade', V, AZ], 'Borussia Dortmund': ['redondo', 'liso', AM, P], Juventus: ['reto', 'listras', P, B], Milan: ['classico', 'listras', V, P], Internazionale: ['redondo', 'listras', AZ, P], Napoli: ['redondo', 'liso', AC, B], Roma: ['classico', 'metade', GR, '#f0bc42'],
  'Paris Saint-Germain': ['redondo', 'faixa', AZ, V], Marseille: ['classico', 'liso', B, AC], Benfica: ['redondo', 'liso', V, B], Porto: ['classico', 'listras', AZ, B], Sporting: ['redondo', 'horizontal', VD, B], Ajax: ['redondo', 'faixa', B, V], PSV: ['classico', 'listras', V, B],
  'Boca Juniors': ['classico', 'horizontal', AZ, AM], 'River Plate': ['classico', 'faixa', B, V], Racing: ['classico', 'listras', AC, B], Independiente: ['redondo', 'liso', V, B], 'San Lorenzo': ['classico', 'listras', AZ, V],
  Peñarol: ['classico', 'listras', AM, P], 'Colo-Colo': ['classico', 'liso', B, P], América: ['redondo', 'liso', AM, AZ], Chivas: ['classico', 'listras', V, B],
  'LA Galaxy': ['pontudo', 'faixa', '#00245d', AM], 'Inter Miami': ['redondo', 'liso', '#f7b5cd', P], 'Al-Hilal': ['redondo', 'liso', AZ, B], 'Al-Nassr': ['redondo', 'liso', AM, AZ]
};

const FORMAS: Forma[] = ['classico', 'redondo', 'pontudo', 'reto'];
const PADROES: Padrao[] = ['liso', 'listras', 'faixa', 'metade', 'horizontal', 'tres', 'cruz', 'aro'];
const PALETA = [V, AZ, VD, P, AM, GR, AC, LJ, RX, '#1e7a3c', '#0b6e8a', '#8b1d2c'];
function hash(s: string): number { let h = 2166136261; for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; }

/** O desenho de um clube: o da tabela ou um estável pelo nome. */
export function desenhoDoClube30(nome: string): Desenho {
  const d = ESCUDOS30[nome];
  if (d) return d;
  const h = hash(nome);
  const c1 = PALETA[h % PALETA.length];
  const c2 = (h >> 8) % 3 === 0 ? P : B;
  return [FORMAS[(h >> 4) % FORMAS.length], PADROES[(h >> 12) % PADROES.length], c1, c2 === c1 ? B : c2, (h >> 20) % 5 === 0];
}

const CONTORNO: Record<Forma, string> = {
  classico: 'M50 4 L94 14 L92 60 Q86 94 50 111 Q14 94 8 60 L6 14 Z',
  pontudo: 'M50 4 L95 10 L95 52 Q90 86 50 111 Q10 86 5 52 L5 10 Z',
  reto: 'M8 6 L92 6 L92 70 Q92 96 50 111 Q8 96 8 70 Z',
  redondo: 'M50 6 A50 50 0 1 1 49.9 6 Z',
  hexagono: 'M50 4 L95 30 L95 85 L50 111 L5 85 L5 30 Z',
  losango: 'M50 3 L97 57 L50 112 L3 57 Z'
};

/** Os símbolos (no centro do escudo, no lugar da sigla). Desenhos simples, centrados em (50, 58). */
const SIMBOLO: Record<Exclude<Simbolo33, 'sigla'>, string> = {
  estrela: 'M50 34 l7 15 16.5 1.5-12.5 11 4 16-15-9-15 9 4-16-12.5-11 16.5-1.5z',
  raio: 'M56 32 L38 62 L50 62 L44 86 L64 52 L52 52 L58 32 Z',
  coroa: 'M30 76 L30 46 L40 58 L50 40 L60 58 L70 46 L70 76 Z',
  chama: 'M50 32 C62 46 70 54 66 68 C63 79 56 84 50 84 C42 84 34 78 34 68 C34 58 42 54 44 46 C47 52 50 54 52 54 C52 46 50 40 50 32 Z',
  bola: 'M50 36 A22 22 0 1 0 50.01 36 Z M50 46 L59 52 L56 63 L44 63 L41 52 Z',
  asa: 'M28 70 C36 50 52 40 74 36 C70 44 66 48 60 50 C66 52 68 54 70 56 C62 58 56 58 52 58 C56 62 58 64 58 68 C48 68 38 70 28 70 Z',
  escudo: 'M50 34 L70 40 L68 62 Q64 78 50 84 Q36 78 32 62 L30 40 Z',
  mira: 'M50 34 A24 24 0 1 0 50.01 34 Z M50 42 A16 16 0 1 1 49.99 42 Z M48 30 h4 v18 h-4z M48 68 h4 v18 h-4z M26 56 h18 v4 h-18z M56 56 h18 v4 h-18z',
  garra: 'M36 80 C34 64 36 48 42 36 C42 52 44 62 48 70 C48 56 50 44 56 34 C55 50 56 60 58 68 C60 58 64 50 70 44 C66 58 64 70 62 80 Z'
};

export const iniciaisDoClube30 = (nome: string) => {
  const ps = nome.replace(/-[A-Z]{2}$/, '').split(/[\s-]+/).filter(w => w.length > 2 && !/^(de|do|da|dos|das|del|la|el)$/i.test(w));
  return (ps.length >= 2 ? ps.slice(0, 3).map(w => w[0]).join('') : (ps[0] ?? nome).slice(0, 3)).toUpperCase();
};

/** O escudo desenhado: o da identidade escolhida (passada ou registrada), senão o da tabela ou o estável pelo nome. */
export function Escudo30({ nome, tamanho = 64, identidade }: { nome: string; tamanho?: number; identidade?: Identidade33 }) {
  const ident = identidade ?? REGISTRO.get(nome);
  const [forma, padrao, a, b, estrela] = ident ? [ident.forma, ident.padrao, ident.cor1, ident.cor2, !!ident.estrela] as Desenho : desenhoDoClube30(nome);
  const id = `esc30-${hash(nome + (ident ? JSON.stringify(ident) : '')).toString(36)}`;
  const redondo = forma === 'redondo';
  const vb = redondo ? '0 0 100 106' : '0 0 100 115';
  const contorno = redondo ? 'M50 4 A48 48 0 1 0 50.01 4 Z' : CONTORNO[forma];
  const ini = (ident?.sigla || iniciaisDoClube30(nome)).slice(0, 4);
  const corTexto = padrao === 'liso' || padrao === 'aro' ? b : a === B ? P : B;
  const detalhe = ident?.cor3;
  const simbolo = ident && ident.simbolo !== 'sigla' ? SIMBOLO[ident.simbolo] : undefined;
  const placa = !simbolo && !(padrao === 'liso' || padrao === 'aro');
  return (
    <svg className="escudo30" width={tamanho} height={tamanho * (redondo ? 1.06 : 1.15)} viewBox={vb} role="img" aria-label={`Escudo do ${nome}`}>
      <defs><clipPath id={id}><path d={contorno} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="0" width="100" height="115" fill={a} />
        {padrao === 'listras' && [0, 1, 2, 3, 4].map(k => k % 2 === 1 && <rect key={k} x={k * 20} y="0" width="20" height="115" fill={b} />)}
        {padrao === 'horizontal' && [0, 1, 2, 3, 4, 5].map(k => k % 2 === 1 && <rect key={k} x="0" y={k * 19} width="100" height="19" fill={b} />)}
        {padrao === 'faixa' && <path d="M-10 20 L20 -10 L110 80 L80 110 Z" fill={b} />}
        {padrao === 'metade' && <rect x="50" y="0" width="50" height="115" fill={b} />}
        {padrao === 'tres' && <><rect x="33" y="0" width="34" height="115" fill={b} /><rect x="67" y="0" width="33" height="115" fill={a} opacity="0.75" /></>}
        {padrao === 'cruz' && <><rect x="40" y="0" width="20" height="115" fill={b} /><rect x="0" y="40" width="100" height="20" fill={b} /></>}
        {padrao === 'aro' && <circle cx="50" cy="56" r="30" fill="none" stroke={b} strokeWidth="9" />}
      </g>
      <path d={contorno} fill="none" stroke={detalhe ?? (a === B ? P : b === B ? P : B)} strokeWidth="4" />
      {placa && <rect x="18" y={redondo ? 40 : 44} width="64" height="26" rx="6" fill={a === B ? P : '#ffffff'} opacity="0.92" />}
      {simbolo
        ? <path d={simbolo} fill={detalhe ?? (padrao === 'liso' || padrao === 'aro' ? b : '#ffffff')} fillRule="evenodd" stroke={a === B ? P : 'rgba(0,0,0,.35)'} strokeWidth="1.2" transform={redondo ? 'translate(0 -3)' : undefined} />
        : <text x="50" y={redondo ? 61 : 65} textAnchor="middle" fontSize={ini.length > 3 ? 18 : ini.length > 2 ? 22 : 26} fontWeight="800" fill={placa ? (ident?.cor3 && ident.cor3 !== '#ffffff' ? ident.cor3 : a === B ? '#ffffff' : a) : (detalhe ?? corTexto)} fontFamily="system-ui, sans-serif">{ini}</text>}
      {estrela && <path d="M50 10 l3 7 7.5 .5-5.7 4.8 1.8 7.3L50 25.6l-6.6 4 1.8-7.3-5.7-4.8 7.5-.5z" fill={AM} stroke={P} strokeWidth="0.8" transform={redondo ? 'translate(0 -2)' : undefined} />}
    </svg>
  );
}
