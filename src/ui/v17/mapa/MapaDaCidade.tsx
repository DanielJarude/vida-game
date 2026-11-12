/**
 * VIDA 17 · O MAPA DA CIDADE — um mapa ilustrado, próprio do VIDA, da cidade onde o personagem mora.
 *
 * Não é a planta real (nem GPS): é uma representação coerente com o que o jogo SABE da cidade —
 *   o porte          metrópole, capital, polo, metropolitana ou pequena (`Municipio.perfil`): quantas regiões, quanta
 *                    quadra, se há anel viário e metrô (só metrópoles e capitais), se a cidade encosta na metrópole;
 *   o litoral        mar, praia e orla de um lado (no Brasil, a leste); sem litoral, às vezes um rio sem nome;
 *   as vocações      do catálogo das cidades (VIDA 14): o porto, o centro histórico, o distrito industrial, o campus,
 *                    os campos, a mina, a refinaria — só quando estão nos dados da cidade;
 *   os bairros       são os TIPOS de endereço que o jogo já usa nos imóveis (`mercado`: no centro, bairro nobre,
 *                    periferia, condomínio, parte alta, loteamento…) — você aparece no do seu endereço;
 *   os seus lugares  a casa, o trabalho (o empregador, se é nesta cidade), o estudo (a instituição), as lojas que a
 *                    cidade tem (`lojasDaVida`).
 * Nada leva nome de rua ou de bairro real que o jogo não tenha: a legenda diz que é ilustração.
 * Sorteio estável pelo id da cidade: a mesma cidade, o mesmo mapa.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import { municipio, nomeLugar } from '../../../motor/dados/lugares';
import { MUNICIPIOS_14, type Vocacao14 } from '../../../motor/dados14/cidades/municipios14';
import { lojasDaVida } from '../../../motor/sistemas/lojas';

const W = 360, H = 270;

function semente(s: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

interface Regiao { id: string; nome: string; x: number; y: number; r: number; tipo: 'centro' | 'denso' | 'nobre' | 'novo' | 'periferia' | 'condominio' | 'rural' | 'alto' | 'praca' | 'metro' }
interface Ponto { id: string; nome: string; detalhe?: string; x: number; y: number; icone: string; cor: string }

/** Os bairros que o jogo usa (`sistemas/mercado`), com o desenho e a distância do centro de cada um. */
const GRANDE: [string, string, Regiao['tipo'], number][] = [
  ['no centro', 'Centro', 'centro', 0], ['num bairro tradicional', 'Bairros tradicionais', 'denso', 0.42], ['perto do metrô', 'Eixo do metrô', 'metro', 0.55],
  ['num bairro novo', 'Bairros novos', 'novo', 0.7], ['num bairro nobre', 'Bairro nobre', 'nobre', 0.6], ['num condomínio fechado', 'Condomínios', 'condominio', 0.85],
  ['na periferia', 'Periferia', 'periferia', 0.92], ['afastado, fora da mancha urbana', 'Fora da mancha urbana', 'rural', 1.08]
];
const PEQUENA: [string, string, Regiao['tipo'], number][] = [
  ['no centro', 'Centro', 'centro', 0], ['perto da praça', 'Praça', 'praca', 0.3], ['num bairro novo', 'Bairro novo', 'novo', 0.62],
  ['na parte alta da cidade', 'Parte alta', 'alto', 0.7], ['num loteamento', 'Loteamento', 'periferia', 0.8], ['na saída da cidade', 'Saída da cidade', 'denso', 0.9],
  ['na zona rural, perto da cidade', 'Zona rural', 'rural', 1.08]
];

export interface DadosDoMapa {
  cidade: string; uf: string; perfil: string; litoral: boolean; metropole?: string; vocacoes: Vocacao14[]; nota?: string;
  regioes: Regiao[]; pontos: Ponto[]; mar?: string; praia?: string; rio?: string; avenidas: string[]; anel?: string; metro?: string;
  quadras: { x: number; y: number; w: number; h: number; tipo: Regiao['tipo'] }[]; parques: { x: number; y: number; r: number }[];
  aqui?: { x: number; y: number; regiao: string };
}

export function dadosDoMapa(v: Vida): DadosDoMapa {
  const m = municipio(v.moradia.municipioId);
  const r = semente(`mapa17_${m.id}`);
  const m14 = MUNICIPIOS_14.find(x => x.nome === m.nome && x.uf === m.uf);
  const vocacoes = m14?.vocacoes ?? [];
  const grande = m.perfil !== 'pequena';
  const litoral = !!(m.litoral || m14?.litoral);
  const grandeDeVerdade = m.perfil === 'metropole' || m.capital || m.capitalNacional;
  // A mancha urbana: o centro um pouco deslocado para o mar (as cidades crescem ao longo da costa).
  const maxX = litoral ? W - 74 : W - 16;
  const cx = litoral ? maxX - 110 : W / 2 + (r() - 0.5) * 30;
  const cy = H / 2 + (r() - 0.5) * 24;
  const raio = grandeDeVerdade ? 118 : grande ? 100 : 80;
  const lista = grande ? GRANDE : PEQUENA;
  const regioes: Regiao[] = [];
  const base = r() * Math.PI * 2;
  lista.forEach(([chave, nome, tipo, d], k) => {
    if (tipo === 'metro' && !grandeDeVerdade) return;
    // O nobre tende para o mar (ou para o parque); a periferia, para longe dele.
    let ang = base + k * 2.4;
    if (litoral && tipo === 'nobre') ang = (r() - 0.5) * 0.9;
    if (litoral && (tipo === 'periferia' || tipo === 'rural')) ang = Math.PI + (r() - 0.5) * 1.4;
    let x = cx + Math.cos(ang) * raio * d;
    const y = cy + Math.sin(ang) * raio * d * 0.78;
    x = Math.min(maxX - 20, Math.max(22, x));
    regioes.push({ id: chave, nome, tipo, x, y: Math.min(H - 22, Math.max(22, y)), r: tipo === 'centro' ? 26 : tipo === 'rural' ? 30 : 22 });
  });
  const centro = regioes[0];
  // As quadras de cada região (o desenho do bairro: miúdo no centro, grande no nobre, irregular na periferia).
  const quadras: DadosDoMapa['quadras'] = [];
  for (const g of regioes) {
    if (g.tipo === 'rural') continue;
    const passo = g.tipo === 'centro' ? 9 : g.tipo === 'nobre' || g.tipo === 'condominio' ? 13 : g.tipo === 'periferia' ? 8 : 10;
    const n = Math.round((g.r * 2) / passo);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = g.x - g.r + i * passo + (g.tipo === 'periferia' ? (r() - 0.5) * 3 : 0);
      const y = g.y - g.r * 0.8 + j * passo * 0.85 + (g.tipo === 'periferia' ? (r() - 0.5) * 3 : 0);
      if ((x - g.x) ** 2 + ((y - g.y) / 0.85) ** 2 > g.r * g.r || x > maxX - 6 || x < 4 || y < 4 || y > H - 8) continue;
      if (r() < (g.tipo === 'nobre' ? 0.25 : 0.08)) continue;
      quadras.push({ x, y, w: passo - (g.tipo === 'centro' ? 2 : 3), h: passo * 0.85 - 2.5, tipo: g.tipo });
    }
  }
  // As avenidas: do centro a cada região; o anel e o metrô, nas cidades grandes.
  const avenidas = regioes.slice(1).map(g => { const mx = (centro.x + g.x) / 2 + (r() - 0.5) * 24, my = (centro.y + g.y) / 2 + (r() - 0.5) * 24; return `M${centro.x.toFixed(0)} ${centro.y.toFixed(0)} Q${mx.toFixed(0)} ${my.toFixed(0)} ${g.x.toFixed(0)} ${g.y.toFixed(0)}`; });
  // A estrada que sai da cidade (para a metrópole, se a cidade é metropolitana).
  const saidaX = litoral ? 4 : r() < 0.5 ? 4 : W - 4;
  avenidas.push(`M${centro.x.toFixed(0)} ${centro.y.toFixed(0)} C${(centro.x + saidaX) / 2} ${centro.y - 30} ${(centro.x + saidaX) / 2} ${centro.y + 40} ${saidaX} ${(cy + 20).toFixed(0)}`);
  const anel = grandeDeVerdade ? `M${centro.x - raio * 0.5} ${centro.y} a${raio * 0.5} ${raio * 0.38} 0 1 0 ${raio} 0 a${raio * 0.5} ${raio * 0.38} 0 1 0 ${-raio} 0` : undefined;
  const metroR = regioes.find(g => g.tipo === 'metro');
  const metro = metroR ? `M${centro.x} ${centro.y} L${metroR.x} ${metroR.y} L${Math.min(maxX - 8, metroR.x + (metroR.x - centro.x) * 0.5)} ${metroR.y + (metroR.y - centro.y) * 0.5}` : undefined;
  // Água: o mar (com praia) ou um rio sem nome.
  const mar = litoral ? `M${maxX + 22} 0 C${maxX + 6} 60 ${maxX + 30} 120 ${maxX + 12} 180 S${maxX + 26} 250 ${maxX + 18} ${H} L${W} ${H} L${W} 0 Z` : undefined;
  const praia = litoral ? `M${maxX + 22} 0 C${maxX + 6} 60 ${maxX + 30} 120 ${maxX + 12} 180 S${maxX + 26} 250 ${maxX + 18} ${H}` : undefined;
  const temRio = !litoral && (grandeDeVerdade || r() < 0.55);
  const rio = temRio ? `M0 ${(H * (0.25 + r() * 0.5)).toFixed(0)} C${W * 0.3} ${(H * r()).toFixed(0)} ${W * 0.6} ${(H * r()).toFixed(0)} ${W} ${(H * (0.25 + r() * 0.5)).toFixed(0)}` : undefined;
  // Parques: o grande perto do centro nas cidades grandes; a praça na pequena; uma área verde no nobre.
  const parques: DadosDoMapa['parques'] = [];
  const praca = regioes.find(g => g.tipo === 'praca');
  if (praca) parques.push({ x: praca.x, y: praca.y, r: 7 });
  if (grande) parques.push({ x: centro.x + (r() - 0.5) * 60, y: centro.y + (r() - 0.5) * 50, r: grandeDeVerdade ? 14 : 10 });
  const nobre = regioes.find(g => g.tipo === 'nobre');
  if (nobre) parques.push({ x: nobre.x + 10, y: nobre.y - 8, r: 7 });
  // Os pontos: as vocações da cidade (dados) e os seus lugares (o estado da vida).
  const pontos: Ponto[] = [];
  const perto = (g: Regiao | undefined, dx = 0, dy = 0) => ({ x: Math.min(maxX - 10, Math.max(12, (g ?? centro).x + dx)), y: Math.min(H - 12, Math.max(12, (g ?? centro).y + dy)) });
  const borda = regioes.find(g => g.tipo === 'periferia') ?? regioes[regioes.length - 1];
  const rural = regioes.find(g => g.tipo === 'rural') ?? borda;
  const VOC: Partial<Record<Vocacao14, [string, string, string, () => { x: number; y: number }]>> = {
    porto: ['Porto', '⚓', '#3f6f98', () => ({ x: maxX + 4, y: (litoral ? cy + 50 : centro.y) })],
    patrimonio: ['Centro histórico', '⛪', '#8a5a3c', () => perto(centro, -12, -10)],
    turismo: ['Área turística', '★', '#c08a1e', () => (litoral ? { x: maxX - 2, y: cy - 50 } : perto(centro, 18, -16))],
    industria: ['Distrito industrial', '🏭', '#6b6b6b', () => perto(borda, 14, 10)],
    automotiva: ['Polo automotivo', '🚗', '#6b6b6b', () => perto(borda, -12, 14)],
    textil: ['Tecelagens', '🧵', '#7a5c8c', () => perto(borda, 10, -12)],
    educacao: ['Campus universitário', '🎓', '#2f6d5a', () => perto(regioes.find(g => g.tipo === 'novo'), 8, 8)],
    agro: ['Campos e lavouras', '🌾', '#6f8a2e', () => perto(rural, 0, 0)],
    mineracao: ['Mineração', '⛏', '#7b5a3a', () => perto(rural, 14, -10)],
    petroleo: ['Refinaria', '🛢', '#4a4a4a', () => perto(borda, 16, -6)],
    pesca: ['Colônia de pescadores', '🐟', '#2e7ea0', () => ({ x: litoral ? maxX + 2 : centro.x, y: litoral ? cy - 80 : centro.y + 20 })],
    logistica: ['Galpões e rodovia', '🚚', '#6b6b6b', () => ({ x: saidaX === 4 ? 24 : W - 24, y: cy + 20 })],
    tecnologia: ['Polo tecnológico', '💡', '#3d5aa8', () => perto(regioes.find(g => g.tipo === 'novo'), -10, -8)],
    comercio: ['Comércio popular', '🛍', '#b0553a', () => perto(centro, 14, 10)]
  };
  for (const vc of vocacoes) { const x = VOC[vc]; if (!x) continue; const p = x[3](); pontos.push({ id: `v_${vc}`, nome: x[0], detalhe: 'da economia da cidade', x: p.x, y: p.y, icone: x[1], cor: x[2] }); }
  // Os seus lugares.
  const meu = regioes.find(g => g.id === v.moradia.bairro);
  const casa = meu ?? (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente' ? regioes.find(g => g.tipo === 'denso') : undefined) ?? regioes[1] ?? centro;
  const emp = v.trabalho.atual;
  if (emp && emp.municipioId === m.id) { const p = perto(vocacoes.includes('industria') && /operad|montad|metal|soldad|fabri/i.test(emp.ocupacaoId) ? borda : centro, 6, 14); pontos.push({ id: 'trabalho', nome: emp.empregador || 'Trabalho', detalhe: 'onde você trabalha', ...p, icone: '💼', cor: '#4b5bb5' }); }
  const mat = v.educacao.matricula;
  if (mat && mat.modalidade === 'presencial') { const p = perto(regioes.find(g => g.tipo === 'novo') ?? centro, -14, 12); pontos.push({ id: 'estudo', nome: mat.instituicao, detalhe: 'onde você estuda', ...p, icone: '🎓', cor: '#2f6d5a' }); }
  else if (v.educacao.basica) { const p = perto(casa, 12, -10); pontos.push({ id: 'escola', nome: 'A escola', detalhe: v.educacao.basica.rede === 'publica' ? 'escola pública perto de casa' : 'escola particular', ...p, icone: '🏫', cor: '#2f6d5a' }); }
  const lojas = lojasDaVida(v).filter(e => e.tipo !== 'online');
  if (lojas.length) { const p = perto(centro, -18, 12); pontos.push({ id: 'lojas', nome: `Comércio (${lojas.length} lojas)`, detalhe: lojas.slice(0, 4).map(l => l.nome).join(', '), ...p, icone: '🛒', cor: '#b0553a' }); }
  if (m.perfil !== 'pequena') { const p = perto(centro, 20, -4); pontos.push({ id: 'hospital', nome: 'Hospital', detalhe: 'atendimento de urgência', ...p, icone: '✚', cor: '#c0392b' }); }
  else { const p = perto(centro, 16, 6); pontos.push({ id: 'posto', nome: 'Posto de saúde', ...p, icone: '✚', cor: '#c0392b' }); }
  const aqui = { x: casa.x + 4, y: casa.y + 2, regiao: casa.nome };
  return { cidade: m.nome, uf: m.uf, perfil: m.perfil, litoral, metropole: m.metropole, vocacoes, nota: m14?.nota, regioes, pontos, mar, praia, rio, avenidas, anel, metro, quadras, parques, aqui };
}

const PERFIL: Record<string, string> = { metropole: 'Metrópole', capital: 'Capital', polo: 'Polo regional', metropolitana: 'Região metropolitana', pequena: 'Cidade pequena' };

export function MapaDaCidade({ vida }: { vida: Vida }) {
  const d = useMemo(() => dadosDoMapa(vida), [vida]);
  const [foco, setFoco] = useState<string | null>(null);
  const focado = d.pontos.find(p => p.id === foco);
  return (
    <figure className="mapa17" aria-label={`Mapa ilustrado de ${d.cidade}`}>
      <div className="mapa17__moldura">
        <svg viewBox={`0 0 ${W} ${H}`} className="mapa17__svg" role="img" aria-label={`${d.cidade}: ${d.regioes.map(r => r.nome).join(', ')}`}>
          <rect width={W} height={H} className="mapa17__terra" />
          {d.rio && <path d={d.rio} className="mapa17__rio" />}
          {d.mar && <path d={d.mar} className="mapa17__mar" />}
          {d.praia && <path d={d.praia} className="mapa17__praia" />}
          {d.mar && [40, 110, 190].map(y => <path key={y} d={`M${W - 30} ${y} q6 -4 12 0 t12 0`} className="mapa17__onda" />)}
          {d.regioes.filter(g => g.tipo === 'rural').map(g => <g key={g.id}>{[0, 1, 2, 3].map(k => <rect key={k} x={g.x - 26 + (k % 2) * 27} y={g.y - 18 + Math.floor(k / 2) * 20} width={24} height={17} rx={2} className={`mapa17__campo mapa17__campo--${k % 3}`} />)}</g>)}
          {d.regioes.filter(g => g.tipo === 'alto').map(g => <g key={g.id}>{[10, 18, 26].map(rr => <ellipse key={rr} cx={g.x} cy={g.y} rx={rr} ry={rr * 0.7} className="mapa17__curva" />)}</g>)}
          {d.anel && <path d={d.anel} className="mapa17__anel" />}
          {d.avenidas.map((a, k) => <path key={k} d={a} className="mapa17__avenida" />)}
          {d.quadras.map((q, k) => <rect key={k} x={q.x} y={q.y} width={q.w} height={q.h} rx={q.tipo === 'condominio' ? 4 : 1.2} className={`mapa17__quadra mapa17__quadra--${q.tipo}`} />)}
          {d.parques.map((p, k) => <g key={k}><circle cx={p.x} cy={p.y} r={p.r} className="mapa17__parque" />{[0, 1, 2].map(j => <circle key={j} cx={p.x + Math.cos(j * 2.1) * p.r * 0.45} cy={p.y + Math.sin(j * 2.1) * p.r * 0.45} r={p.r * 0.28} className="mapa17__arvore" />)}</g>)}
          {d.metro && <path d={d.metro} className="mapa17__metro" />}
          {d.regioes.map(g => <text key={g.id} x={g.x} y={g.y - g.r * 0.85 - 3} className={`mapa17__regiao${d.aqui?.regiao === g.nome ? ' mapa17__regiao--aqui' : ''}`} textAnchor="middle">{g.nome}</text>)}
          {d.pontos.map(p => (
            <g key={p.id} className={`mapa17__ponto${foco === p.id ? ' mapa17__ponto--foco' : ''}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} onClick={() => setFoco(f => (f === p.id ? null : p.id))}>
              <circle r={7.5} style={{ fill: p.cor }} />
              <text y={3} textAnchor="middle" className="mapa17__icone">{p.icone}</text>
            </g>
          ))}
          {d.aqui && (
            <g transform={`translate(${d.aqui.x.toFixed(1)} ${d.aqui.y.toFixed(1)})`} className="mapa17__aqui">
              <circle r={11} className="mapa17__aqui-halo" />
              <circle r={5.5} className="mapa17__aqui-ponto" />
            </g>
          )}
          <g transform={`translate(18 ${H - 20})`} className="mapa17__rosa"><path d="M0 -10 L3 0 L0 10 L-3 0 Z" /><text y={-12} textAnchor="middle">N</text></g>
          {d.metropole && <text x={6} y={14} className="mapa17__rumo">← {d.metropole}</text>}
        </svg>
      </div>
      <figcaption className="mapa17__legenda">
        <div className="mapa17__titulo"><strong>{d.cidade}</strong><span>{nomeLugar(vida.moradia.municipioId).replace(`${d.cidade}, `, '')} · {PERFIL[d.perfil] ?? d.perfil}{d.litoral ? ' · litoral' : ''}</span></div>
        <p className="mapa17__voce"><span className="mapa17__marca-aqui" aria-hidden /> Você mora em <strong>{d.aqui?.regiao.toLowerCase()}</strong>{vida.moradia.bairro ? ` (${vida.moradia.bairro})` : ''}.</p>
        {focado ? <p className="mapa17__foco"><strong>{focado.icone} {focado.nome}</strong>{focado.detalhe ? ` — ${focado.detalhe}` : ''}</p> : null}
        <ul className="mapa17__pontos">
          {d.pontos.map(p => <li key={p.id}><button type="button" aria-pressed={foco === p.id} onClick={() => setFoco(f => (f === p.id ? null : p.id))}><span className="mapa17__bolinha" style={{ background: p.cor }}>{p.icone}</span>{p.nome}</button></li>)}
        </ul>
        {d.nota && <p className="mapa17__nota">{d.nota}</p>}
        <p className="mapa17__aviso">Mapa ilustrado: o traçado das ruas é uma representação; os bairros são os tipos de endereço do jogo{d.vocacoes.length ? ' e os pontos da economia vêm dos dados da cidade' : ''}.</p>
      </figcaption>
    </figure>
  );
}
