/**
 * ERAS HISTÓRICAS · os objetos da época desenhados no traço do VIDA (SVG, sem marca): o telefone de disco, o tijolão,
 * o celular de teclas, o smartphone; a TV de tubo e o monitor. Servem à escolha da época, ao aparelho de comunicação e
 * ao painel "A época". Cores pelos tokens (claro e escuro).
 */

type Decada = 1900 | 1910 | 1920 | 1930 | 1940 | 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | 2010 | 2020 | 2026;

export function TelefoneDeDisco({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <path d="M10 46c0-10 8-20 22-20s22 10 22 20v6H10z" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <path d="M8 22c0-6 10-10 24-10s24 4 24 10l-6 4c-2-3-9-5-18-5s-16 2-18 5z" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <circle cx="32" cy="40" r="9" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1.4" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const a = (-60 + i * 30) * Math.PI / 180; return <circle key={i} cx={32 + Math.cos(a) * 6} cy={40 + Math.sin(a) * 6} r="1.3" fill="var(--text-primary)" />; })}
    </svg>
  );
}

/** ERAS v3: a carta (o envelope selado com o carimbo do correio), para quem ainda não tem telefone em casa. */
export function Envelope({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <rect x="7" y="16" width="50" height="34" rx="2" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <path d="M7 17l25 19 25-19" fill="none" stroke="var(--text-primary)" strokeWidth="1.6" />
      <rect x="44" y="20" width="9" height="11" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.1" />
      <circle cx="42" cy="27" r="6" fill="none" stroke="var(--text-primary)" strokeWidth="0.9" strokeDasharray="2 1.5" />
      <path d="M13 42h16M13 46h11" stroke="var(--text-primary)" strokeWidth="1.1" />
    </svg>
  );
}

export function Tijolao({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <rect x="40" y="4" width="3" height="14" rx="1.5" fill="var(--text-primary)" />
      <rect x="22" y="14" width="22" height="46" rx="4" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <rect x="26" y="19" width="14" height="8" rx="1" fill="var(--era-tela)" stroke="var(--text-primary)" strokeWidth="1" />
      {[0, 1, 2, 3].map(l => [0, 1, 2].map(c => <rect key={`${l}${c}`} x={26 + c * 5} y={32 + l * 6} width="4" height="4" rx="1" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth=".8" />))}
    </svg>
  );
}

export function CelularDeTeclas({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <rect x="20" y="6" width="24" height="52" rx="9" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <rect x="24" y="12" width="16" height="16" rx="2" fill="var(--era-tela)" stroke="var(--text-primary)" strokeWidth="1" />
      <path d="M27 20h10M27 24h6" stroke="var(--text-primary)" strokeWidth="1" />
      <ellipse cx="32" cy="34" rx="5" ry="2.6" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth=".8" />
      {[0, 1, 2, 3].map(l => [0, 1, 2].map(c => <rect key={`${l}${c}`} x={24.5 + c * 5.5} y={39 + l * 4.5} width="4" height="3" rx="1.2" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth=".6" />))}
    </svg>
  );
}

export function Smartphone({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <rect x="18" y="4" width="28" height="56" rx="6" fill="var(--text-primary)" />
      <rect x="20.5" y="9" width="23" height="44" rx="2" fill="var(--era-tom)" />
      {[0, 1, 2, 3].map(l => [0, 1, 2].map(c => <rect key={`${l}${c}`} x={23 + c * 6.5} y={13 + l * 8} width="5" height="5" rx="1.4" fill="var(--surface)" opacity=".85" />))}
      <circle cx="32" cy="56.5" r="1.6" fill="var(--surface)" />
    </svg>
  );
}

export function TvDeTubo({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <path d="M24 10l8 8 8-8" stroke="var(--text-primary)" strokeWidth="1.6" fill="none" />
      <rect x="6" y="18" width="52" height="36" rx="6" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <rect x="11" y="23" width="34" height="26" rx="5" fill="var(--era-tela)" stroke="var(--text-primary)" strokeWidth="1.2" />
      <circle cx="51" cy="29" r="2.5" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth=".8" />
      <circle cx="51" cy="37" r="2.5" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth=".8" />
      <path d="M14 54l-3 6M50 54l3 6" stroke="var(--text-primary)" strokeWidth="1.6" />
    </svg>
  );
}

export function MonitorDeTubo({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <rect x="8" y="8" width="48" height="38" rx="4" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <rect x="13" y="13" width="38" height="27" rx="2" fill="var(--era-tela)" stroke="var(--text-primary)" strokeWidth="1" />
      <path d="M17 19h16M17 24h22M17 29h12" stroke="var(--text-primary)" strokeWidth="1.2" opacity=".7" />
      <path d="M26 46l-4 8h20l-4-8" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.4" />
      <rect x="12" y="56" width="40" height="5" rx="1.5" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1" />
    </svg>
  );
}

/** Os dois objetos que resumem a época (a comunicação e a tela da casa). */
/** ERAS v3: o gramofone de corneta (1900–1920). */
export function Gramofone({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <rect x="10" y="42" width="30" height="12" rx="1.5" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <ellipse cx="25" cy="42" rx="12" ry="2.6" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1.2" />
      <path d="M33 40l6-14" stroke="var(--text-primary)" strokeWidth="1.8" />
      <path d="M38 27c2-8 8-15 18-19l2 7c-6 3-10 9-13 15z" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <path d="M56 8c2 2 3 4 2 7" stroke="var(--text-primary)" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/** ERAS v3: o rádio de válvula de capelinha (1925–1960). */
export function RadioDeValvula({ tamanho = 64 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden className="era-desenho">
      <path d="M12 56V30c0-12 9-20 20-20s20 8 20 20v26z" fill="var(--era-tom)" stroke="var(--text-primary)" strokeWidth="1.6" />
      <path d="M18 32c0-8 6-14 14-14s14 6 14 14v6H18z" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1.2" />
      {[22, 26, 30, 34, 38, 42].map(x => <path key={x} d={`M${x} 21v16`} stroke="var(--text-primary)" strokeWidth="0.8" opacity=".5" />)}
      <rect x="20" y="42" width="24" height="5" rx="1" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1" />
      <circle cx="22" cy="51" r="2.2" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1" />
      <circle cx="42" cy="51" r="2.2" fill="var(--surface)" stroke="var(--text-primary)" strokeWidth="1" />
    </svg>
  );
}

export function ObjetosDaEpoca({ decada, tamanho = 64 }: { decada: Decada; tamanho?: number }) {
  // ERAS v3: antes de 1970 — a carta e o gramofone; o rádio de válvula; o rádio e a primeira TV.
  if (decada === 1900 || decada === 1910) return <><Envelope tamanho={tamanho} /><Gramofone tamanho={tamanho} /></>;
  if (decada === 1920 || decada === 1930 || decada === 1940) return <><Envelope tamanho={tamanho} /><RadioDeValvula tamanho={tamanho} /></>;
  if (decada === 1950 || decada === 1960) return <><RadioDeValvula tamanho={tamanho} /><TvDeTubo tamanho={tamanho} /></>;
  if (decada === 1970 || decada === 1980) return <><TelefoneDeDisco tamanho={tamanho} /><TvDeTubo tamanho={tamanho} /></>;
  if (decada === 1990) return <><Tijolao tamanho={tamanho} /><MonitorDeTubo tamanho={tamanho} /></>;
  if (decada === 2000) return <><CelularDeTeclas tamanho={tamanho} /><MonitorDeTubo tamanho={tamanho} /></>;
  return <><Smartphone tamanho={tamanho} /></>;
}
