/**
 * VIDA 27 · §7 — A VIZINHANÇA PELO LUGAR. Antes, o entorno tinha quatro casas vizinhas e um prédio, quase sempre o mesmo
 * por tipo (o bairro nobre era sempre a "casa grande"; a cidade pequena, sempre a "telha"), e o país não entrava: um
 * subúrbio americano saía igual à periferia de São Paulo, e o sítio tinha só pasto. Agora a escolha de cada vizinho é
 * feita num catálogo de construções, filtrado por:
 *   · a REGIÃO DO MUNDO do endereço (Brasil, América Latina, mundo anglo, Europa, Ásia, África, Oriente Médio) — o jeito
 *     de construir (a laje e a caixa-d'água, o telhado de duas águas com revestimento e gramado sem muro, a casa
 *     geminada estreita de telhado inclinado, o terraço plano de cor de terra);
 *   · o ENTORNO (periferia, bairro, centro, nobre, condomínio, cidade pequena, rural) — que já vem do bairro, do porte da
 *     cidade e do tipo de moradia (`entorno22.tipoDeEntorno`);
 *   · o PADRÃO da moradia (a mansão não tem um puxadinho do lado; a casa popular não tem uma casa modernista);
 *   · o LITORAL (coqueiros na calçada).
 * A escolha é estável (o mesmo endereço, os mesmos vizinhos), e os dois lados não repetem o mesmo modelo quando há
 * alternativa. A rural tem o que o campo tem: a sede de outra propriedade ao longe, o galpão, o silo, a cerca, a mata.
 */
import { clarear, escurecer, ret, type Peca } from '../../ilustracao/nucleo';
import { decadaDaFigura } from '../../eras/modaDaDecada';
import { COR, arvore, bloco, duasAguas, frontal, frontao, grupo, janela, lajeEmBalanco, marcado, noChao, palmeira, platibanda, quatroAguas, sombraDoBloco, type Bloco, type Vista } from './kit';
import type { TipoDeEntorno } from './entorno22';

export type Regiao27 = 'br' | 'latam' | 'anglo' | 'europa' | 'asia' | 'africa' | 'oriente';

const LATAM = new Set(['AR', 'UY', 'PY', 'CL', 'BO', 'PE', 'EC', 'CO', 'VE', 'MX', 'CU', 'DO', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'PR', 'HT', 'JM']);
const ANGLO = new Set(['US', 'CA', 'AU', 'NZ']);
const EUROPA = new Set(['PT', 'ES', 'FR', 'IT', 'DE', 'NL', 'BE', 'CH', 'AT', 'GB', 'IE', 'PL', 'CZ', 'SE', 'NO', 'DK', 'FI', 'GR', 'HU', 'RO', 'UA', 'RU', 'HR', 'RS', 'BG', 'SK', 'SI', 'LU', 'IS', 'EE', 'LV', 'LT']);
const ASIA = new Set(['JP', 'CN', 'KR', 'IN', 'TH', 'VN', 'ID', 'PH', 'MY', 'SG', 'TW', 'HK', 'BD', 'PK', 'LK', 'NP', 'KH', 'MM']);
const ORIENTE = new Set(['SA', 'AE', 'QA', 'KW', 'IL', 'TR', 'IR', 'IQ', 'JO', 'LB', 'EG', 'MA', 'DZ', 'TN', 'OM', 'BH']);

export function regiaoDoPais27(pais?: string): Regiao27 {
  if (!pais || pais === 'BR') return 'br';
  if (LATAM.has(pais)) return 'latam';
  if (ANGLO.has(pais)) return 'anglo';
  if (EUROPA.has(pais)) return 'europa';
  if (ASIA.has(pais)) return 'asia';
  if (ORIENTE.has(pais)) return 'oriente';
  return 'africa';
}

/** As cores de parede de cada lugar (as fachadas que se veem por lá). */
const PALETA: Record<Regiao27, string[]> = {
  br: ['#e6dccb', '#d9c8a8', '#cfd8d6', '#e8d2c4', '#d6dccb', '#efe6d6', '#c9c1b4', '#e9d9a6', '#c8d6c1'],
  latam: ['#e9cfa8', '#d7b48e', '#e3c3c0', '#cfd9c4', '#f0e2c6', '#c7b9a6', '#e6d39c'],
  anglo: ['#e9e6df', '#c9d2d8', '#d8d0c2', '#b7c3c9', '#e6dccb', '#a8b3a1', '#d9cbb6'],
  europa: ['#e8dcc0', '#dcc39a', '#e7d3c7', '#cfc6b6', '#efe4cf', '#d8b99a', '#c3c9c4'],
  asia: ['#e7e4de', '#d6d3cc', '#cfd6d8', '#e2d9cc', '#c8cdc8'],
  africa: ['#d9b48a', '#c9a07a', '#e2c9a2', '#cfb59a', '#e6d6b8'],
  oriente: ['#e6d6b4', '#d9c39a', '#efe3c8', '#cdb88f', '#e3d2b0']
};

interface Ctx27 { regiao: Regiao27; padrao: number; litoral: boolean; semente: (k: string) => number }
interface Modelo27 {
  id: string;
  /** VIDA 28: a década a partir da qual esse tipo de casa existe na paisagem (a laje com caixa-d'água de fibra é dos anos 1970). */
  desde?: number;
  regioes: Regiao27[] | 'todas';
  entornos: TipoDeEntorno[];
  /** O padrão da moradia em que este vizinho combina (0 a 5). */
  padrao: [number, number];
  /** A largura mínima de lote que ele pede (m). */
  min: number;
  desenhar: (v: Vista, x0: number, l: number, z0: number, c: Ctx27, k: string) => Peca[];
}

const longe = (c: string) => clarear(c, 0.3);
const corDe = (c: Ctx27, k: string) => longe(PALETA[c.regiao][Math.floor(c.semente(k) * PALETA[c.regiao].length) % PALETA[c.regiao].length]);
const marca = (id: string, pecas: Peca[]) => [marcado('cena__vizinho', { 'data-entorno': 'casa', 'data-vizinho': id }, pecas)];
function janelas(v: Vista, b: Bloco, andares: number, passo = 3, l = 1.1, a = 1.1): Peca[] {
  const out: Peca[] = [];
  const n = Math.max(1, Math.floor((b.x1 - b.x0) / passo));
  for (let f = 0; f < andares; f++) for (let k = 0; k < n; k++) out.push(janela(v, b.z0, b.x0 + 0.6 + k * ((b.x1 - b.x0 - 1.2) / n), f * 2.9 + 0.95, l, a, { acesa: false }));
  return out;
}
/** A caixa-d'água azul em cima da laje (o Brasil e a América Latina). */
function caixaDagua(v: Vista, b: Bloco): Peca[] {
  const cx = b.x0 + (b.x1 - b.x0) * 0.65;
  return bloco(v, { x0: cx, x1: cx + 1.1, z0: b.z0 + 1.5, z1: b.z0 + 2.6, h0: b.h1, h1: b.h1 + 1 }, { cor: longe('#5f8fbf') });
}

const MODELOS27: Modelo27[] = [
  /* ---------------- Brasil e América Latina */
  { id: 'laje_caixa', desde: 1970, regioes: ['br', 'latam'], entornos: ['periferia', 'bairro'], padrao: [0, 2], min: 4,
    desenhar: (v, x0, l, z0, c, k) => { const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 7, h1: 2.9 }; const cor = corDe(c, k); return marca('laje_caixa', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor, soclo: 0.3, corSoclo: longe('#8f877a') }), ...platibanda(v, b, 0.3, cor), ...caixaDagua(v, b), ...janelas(v, b, 1)]); } },
  { id: 'laje_puxadinho', desde: 1970, regioes: ['br', 'latam'], entornos: ['periferia'], padrao: [0, 1], min: 4.5,
    desenhar: (v, x0, l, z0, c, k) => {
      const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 7, h1: 2.9 };
      const cima: Bloco = { x0: x0 + 0.4, x1: x0 + l * 0.7, z0: z0 + 0.6, z1: z0 + 6, h0: 2.9, h1: 5.6 };
      return marca('laje_puxadinho', [sombraDoBloco(v, b, cima.h1, 0.12), ...bloco(v, b, { cor: corDe(c, k) }), ...bloco(v, cima, { cor: longe('#b9a99a'), textura: 'blocos' }), ...platibanda(v, cima, 0.2, longe('#b9a99a')), ...janelas(v, b, 1)]);
    } },
  { id: 'casa_4aguas', regioes: ['br', 'latam'], entornos: ['bairro', 'pequena', 'periferia'], padrao: [0, 3], min: 5,
    desenhar: (v, x0, l, z0, c, k) => { const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 7, h1: 2.9 }; return marca('casa_4aguas', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor: corDe(c, k), soclo: 0.3 }), ...quatroAguas(v, b, 1.2, { cor: longe(c.semente(k + 't') > 0.6 ? COR.telhaEscura : COR.telha) }), ...janelas(v, b, 1)]); } },
  { id: 'casa_frontao', regioes: ['br', 'latam', 'europa'], entornos: ['bairro', 'pequena'], padrao: [0, 3], min: 5,
    desenhar: (v, x0, l, z0, c, k) => { const w = Math.min(l, 7); const b: Bloco = { x0, x1: x0 + w, z0, z1: z0 + 8, h1: 2.9 }; const cor = corDe(c, k); return marca('casa_frontao', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor }), ...frontao(v, b, 1.8, { cor: longe(COR.telha) }, cor), ...janelas(v, b, 1, 2.6)]); } },
  { id: 'sobrado_varanda', desde: 1960, regioes: ['br', 'latam'], entornos: ['bairro'], padrao: [1, 4], min: 6,
    desenhar: (v, x0, l, z0, c, k) => {
      const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 7.5, h1: 5.8 }; const cor = corDe(c, k);
      return marca('sobrado_varanda', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor, soclo: 0.3 }), ...lajeEmBalanco(v, { ...b, h1: 2.95 }, 0.8, 0.15, longe(COR.branco)), ...quatroAguas(v, b, 1.3, { cor: longe(COR.telha) }), ...janelas(v, b, 2)]);
    } },
  { id: 'platibanda_moderna', desde: 1960, regioes: ['br', 'latam', 'oriente'], entornos: ['bairro', 'nobre', 'condominio'], padrao: [2, 5], min: 7,
    desenhar: (v, x0, l, z0, c, k) => {
      const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 8.5, h1: 5.8 };
      return marca('platibanda_moderna', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor: longe(c.semente(k) > 0.5 ? '#efeae0' : '#c9c3b8') }), ...lajeEmBalanco(v, b, 1, 0.25, longe('#e8e2d6')), grupo(frontal(v, x0 + 1, z0, 4.9), [{ tipo: 'massa', d: ret(0, 0, l - 2, 1.9, 0.05), cor: longe(COR.vidro), semVolume: true, marca: 'vidro-vizinho' }])]);
    } },
  /* ---------------- Os bairros caros (quase todo lugar) */
  { id: 'casa_grande', regioes: 'todas', entornos: ['nobre', 'condominio'], padrao: [3, 5], min: 8,
    desenhar: (v, x0, l, z0, c, k) => { const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 9, h1: 5.8 }; return marca('casa_grande', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor: corDe(c, k), soclo: 0.3 }), ...quatroAguas(v, b, 1.6, { cor: longe(c.regiao === 'europa' || c.regiao === 'anglo' ? COR.ardosia : COR.telhaEscura) }), ...janelas(v, b, 2, 2.6)]); } },
  { id: 'casa_moderna', desde: 1990, regioes: 'todas', entornos: ['nobre', 'condominio'], padrao: [3, 5], min: 8,
    desenhar: (v, x0, l, z0, _c, k) => {
      const b: Bloco = { x0, x1: x0 + l * 0.65, z0, z1: z0 + 9, h1: 3 };
      const cima: Bloco = { x0: x0 + l * 0.25, x1: x0 + l, z0: z0 + 0.4, z1: z0 + 8.6, h0: 3, h1: 6.2 };
      void k;
      return marca('casa_moderna', [sombraDoBloco(v, b, cima.h1, 0.12), ...bloco(v, b, { cor: longe('#e9e4da'), textura: 'placas' }), ...bloco(v, cima, { cor: longe('#d6d0c4') }), ...lajeEmBalanco(v, cima, 1.2, 0.2, longe('#efeae0')), grupo(frontal(v, cima.x0 + 0.5, cima.z0, 5.8), [{ tipo: 'massa', d: ret(0, 0, cima.x1 - cima.x0 - 1, 2.2, 0.05), cor: longe(COR.vidro), semVolume: true, marca: 'vidro-vizinho' }])]);
    } },
  /* ---------------- O mundo anglo (EUA, Canadá, Austrália, Nova Zelândia) */
  { id: 'suburbio_duas_aguas', regioes: ['anglo'], entornos: ['bairro', 'pequena', 'periferia', 'condominio'], padrao: [0, 4], min: 7,
    desenhar: (v, x0, l, z0, c, k) => {
      const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 8, h1: 5.6 }; const cor = corDe(c, k);
      const garagem: Bloco = { x0: x0 + l * 0.55, x1: x0 + l, z0: z0 - 0.3, z1: z0 + 5, h1: 2.7 };
      return marca('suburbio_duas_aguas', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor, textura: 'tabuas' }), ...duasAguas(v, b, 2, { cor: longe(COR.ardosia) }, cor), ...bloco(v, garagem, { cor, textura: 'tabuas' }), grupo(frontal(v, garagem.x0 + 0.4, garagem.z0, 2.2), [{ tipo: 'massa', d: ret(0, 0, garagem.x1 - garagem.x0 - 0.8, 2.1, 0.03), cor: longe('#f2efe8'), semVolume: true, marca: 'porta-garagem' }]), ...janelas(v, { ...b, x1: x0 + l * 0.5 }, 2, 2.2)]);
    } },
  { id: 'rancho', desde: 1940, regioes: ['anglo'], entornos: ['bairro', 'pequena', 'periferia'], padrao: [0, 3], min: 8,
    desenhar: (v, x0, l, z0, c, k) => { const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 8, h1: 2.8 }; return marca('rancho', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor: corDe(c, k), textura: 'tabuas' }), ...quatroAguas(v, b, 1, { cor: longe('#6d6863'), fiadas: false }), ...janelas(v, b, 1, 2.5)]); } },
  /* ---------------- Europa */
  { id: 'geminadas', regioes: ['europa'], entornos: ['bairro', 'centro', 'pequena', 'periferia'], padrao: [0, 4], min: 6,
    desenhar: (v, x0, l, z0, c, k) => {
      const n = l >= 9 ? 3 : 2, w = l / n, out: Peca[] = [];
      for (let i = 0; i < n; i++) {
        const b: Bloco = { x0: x0 + i * w, x1: x0 + (i + 1) * w, z0, z1: z0 + 8, h1: 8.4 }; const cor = corDe(c, `${k}${i}`);
        out.push(sombraDoBloco(v, b, b.h1, 0.1), ...bloco(v, b, { cor, textura: c.semente(k + 'tij') > 0.6 ? 'tijolo' : undefined }), ...frontao(v, b, 2.4, { cor: longe(c.semente(k + 'ard') > 0.5 ? COR.ardosia : COR.telha) }, cor), ...janelas(v, b, 3, 2.2, 0.9, 1.3));
      }
      return marca('geminadas', out);
    } },
  { id: 'casa_pedra', regioes: ['europa'], entornos: ['pequena', 'bairro'], padrao: [0, 4], min: 6,
    desenhar: (v, x0, l, z0, _c, k) => { const w = Math.min(l, 8); const b: Bloco = { x0, x1: x0 + w, z0, z1: z0 + 7, h1: 4.2 }; void k; return marca('casa_pedra', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor: longe('#c8bda8'), textura: 'pedra' }), ...duasAguas(v, b, 2.6, { cor: longe(COR.ardosia) }, longe('#c8bda8')), ...janelas(v, b, 1, 2.4, 0.9, 1.1)]); } },
  /* ---------------- Ásia, África, Oriente Médio */
  { id: 'casa_asia', regioes: ['asia'], entornos: ['bairro', 'pequena', 'periferia'], padrao: [0, 4], min: 5,
    desenhar: (v, x0, l, z0, c, k) => {
      const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 7, h1: 5.6 };
      const ac = bloco(v, { x0: x0 + l - 1.4, x1: x0 + l - 0.6, z0: z0 - 0.4, z1: z0, h0: 3.4, h1: 4 }, { cor: longe('#e6e6e2') });
      return marca('casa_asia', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor: corDe(c, k) }), ...(c.semente(k + 'tel') > 0.5 ? duasAguas(v, b, 1.2, { cor: longe('#4e5a63'), fiadas: false }, corDe(c, k)) : platibanda(v, b, 0.3, corDe(c, k))), ...ac, ...janelas(v, b, 2, 2.4)]);
    } },
  { id: 'terraco_plano', regioes: ['africa', 'oriente', 'latam'], entornos: ['periferia', 'bairro', 'pequena'], padrao: [0, 3], min: 5,
    desenhar: (v, x0, l, z0, c, k) => { const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 7, h1: c.semente(k + 'and') > 0.5 ? 5.6 : 2.9 }; const cor = corDe(c, k); return marca('terraco_plano', [sombraDoBloco(v, b, b.h1, 0.12), ...bloco(v, b, { cor, textura: 'textura' }), ...platibanda(v, b, 0.5, cor), ...janelas(v, b, b.h1 > 3 ? 2 : 1, 2.8, 0.9, 1)]); } },
  /* ---------------- Os prédios do centro (e o prédio baixo da cidade média) */
  { id: 'predio_comercial', regioes: 'todas', entornos: ['centro'], padrao: [0, 5], min: 6,
    desenhar: (v, x0, l, z0, c, k) => predio(v, x0, l, z0, 4 + Math.floor(c.semente(k) * 5), corDe(c, k), true, 'predio_comercial') },
  { id: 'predio_varandas', desde: 1970, regioes: 'todas', entornos: ['centro', 'bairro'], padrao: [1, 5], min: 7,
    desenhar: (v, x0, l, z0, c, k) => predio(v, x0, l, z0, 6 + Math.floor(c.semente(k) * 8), corDe(c, k), false, 'predio_varandas', true) },
  { id: 'predio_baixo', regioes: 'todas', entornos: ['centro', 'bairro'], padrao: [0, 3], min: 6,
    desenhar: (v, x0, l, z0, c, k) => predio(v, x0, l, z0, 3 + Math.floor(c.semente(k) * 2), corDe(c, k), c.semente(k + 'loja') > 0.5, 'predio_baixo') }
];

function predio(v: Vista, x0: number, l: number, z0: number, andares: number, cor: string, loja: boolean, id: string, varandas = false): Peca[] {
  const b: Bloco = { x0, x1: x0 + l, z0, z1: z0 + 10, h1: andares * 2.9 };
  const out: Peca[] = [sombraDoBloco(v, b, b.h1, 0.1), ...bloco(v, b, { cor, corTopo: escurecer(cor, 0.06) })];
  const cols = Math.max(2, Math.floor(l / 2.6));
  for (let a = loja ? 1 : 0; a < andares; a++) out.push(grupo(frontal(v, x0, z0, a * 2.9 + 2.2), [{ tipo: 'massa', d: Array.from({ length: cols }, (_, k) => ret(0.6 + k * (l - 1.2) / cols, 0, (l - 1.2) / cols - 0.7, 1.2, 0.05)).join(''), cor: longe('#7f9cad'), semVolume: true, marca: 'janelas-vizinho' }]));
  if (varandas) for (let a = 1; a < andares; a++) out.push(...lajeEmBalanco(v, { x0, x1: x0 + l, z0, z1: z0 + 10, h1: a * 2.9 }, 0.7, 0.12, longe('#e9e4da')));
  if (loja) out.push(grupo(frontal(v, x0, z0, 2.6), [{ tipo: 'massa', d: ret(0.3, 0.2, l - 0.6, 0.5, 0.02), cor: longe('#b0503c'), semVolume: true, marca: 'toldo' }, { tipo: 'massa', d: ret(0.5, 0.8, l - 1, 1.6, 0.03), cor: longe('#9fb4bf'), semVolume: true, marca: 'vitrine' }]));
  return [marcado('cena__vizinho', { 'data-entorno': 'predio', 'data-vizinho': id }, out)];
}

/** O campo em volta: a sede de outra propriedade ao longe, o galpão, o silo, a cerca, a mata (nada de prédio). */
function vizinhoRural(v: Vista, a: number, b: number, c: Ctx27, k: string): Peca[] {
  const x = (a + b) / 2, s = c.semente(k);
  const out: Peca[] = [noChao(v, a, b, 0, 16, '#a9c47a', 'pasto-vizinho')];
  if (s < 0.4) {
    const sede: Bloco = { x0: x - 3, x1: x + 3, z0: 10, z1: 15, h1: 2.9 };
    out.push(sombraDoBloco(v, sede, sede.h1, 0.08), ...bloco(v, sede, { cor: corDe(c, k) }), ...quatroAguas(v, sede, 1.3, { cor: longe(COR.telha) }));
  } else if (s < 0.7) {
    const galpao: Bloco = { x0: x - 3.5, x1: x + 3.5, z0: 9, z1: 15, h1: 4 };
    const silo: Bloco = { x0: x + 4, x1: x + 5.6, z0: 10, z1: 11.6, h1: 7 };
    out.push(sombraDoBloco(v, galpao, galpao.h1, 0.08), ...bloco(v, galpao, { cor: longe('#b9bec2'), textura: 'ripado' }), ...duasAguas(v, galpao, 1.4, { cor: longe('#9aa1a6'), fiadas: false }, longe('#b9bec2')), ...bloco(v, silo, { cor: longe('#c9ced1') }), ...quatroAguas(v, silo, 1.2, { cor: longe('#a7adb1'), beiral: 0.05, fiadas: false }));
  } else out.push(arvore(v, x - 2, 9, { alt: 6.5, copa: '#4f7f42' }), arvore(v, x + 1.5, 11, { alt: 7.5, copa: '#3f6534' }), arvore(v, x + 3.5, 8.5, { alt: 5.5, copa: '#5f8f4e' }));
  // A cerca na divisa (os moirões).
  for (let z = 1; z < 15; z += 2.4) out.push(...bloco(v, { x0: a + 0.2, x1: a + 0.35, z0: z, z1: z + 0.15, h1: 1.2 }, { cor: longe(COR.madeira), semTopo: true }));
  return [marcado('cena__vizinho', { 'data-entorno': 'pasto', 'data-vizinho': s < 0.4 ? 'sede' : s < 0.7 ? 'galpao_silo' : 'mata' }, out)];
}

/**
 * Os vizinhos dos dois lados, pelo lugar. `lados` são as faixas visíveis (x de cada divisa); devolve as peças do fundo.
 * Estável: o mesmo endereço tem os mesmos vizinhos.
 */
export function vizinhosDoLugar27(v: Vista, lados: [number, number][], tipo: TipoDeEntorno, ctx: { pais?: string; padrao?: number; litoral?: boolean }, sem: (k: string) => number): { fundo: Peca[]; ids: string[] } {
  const c: Ctx27 = { regiao: regiaoDoPais27(ctx.pais), padrao: ctx.padrao ?? 2, litoral: !!ctx.litoral, semente: sem };
  const fundo: Peca[] = [], ids: string[] = [];
  if (tipo === 'rural') {
    for (const [k, [a, b]] of lados.entries()) { const p = vizinhoRural(v, a, b, c, `rural${k}`); fundo.push(...p); ids.push(String((p[0] as { attrs?: Record<string, string> }).attrs?.['data-vizinho'] ?? 'rural')); }
    return { fundo, ids };
  }
  for (const [k, [a, b]] of lados.entries()) {
    const l = b - a;
    // VIDA 28: numa vida histórica, só os tipos de casa que já existiam na década (sem laje com caixa-d'água em 1915).
    const daEpoca = (m: Modelo27) => (m.desde ?? 0) <= (decadaDaFigura() ?? 9999);
    const ok = MODELOS27.filter(m => daEpoca(m) && (m.regioes === 'todas' || m.regioes.includes(c.regiao)) && m.entornos.includes(tipo) && c.padrao >= m.padrao[0] - 1 && c.padrao <= m.padrao[1] + 1 && l >= m.min * 0.8);
    const lista = ok.length ? ok : MODELOS27.filter(m => daEpoca(m) && m.entornos.includes(tipo)).length ? MODELOS27.filter(m => daEpoca(m) && m.entornos.includes(tipo)) : MODELOS27.filter(m => m.entornos.includes(tipo));
    // Os dois lados não repetem o mesmo modelo quando há alternativa.
    const livres = lista.filter(m => !ids.includes(m.id));
    const de = livres.length ? livres : lista;
    const m = de[Math.floor(sem(`m${k}`) * de.length) % de.length];
    const largo = Math.min(l - 0.4, tipo === 'periferia' ? l * 0.6 : tipo === 'nobre' || tipo === 'condominio' ? 10 : 9);
    const x0 = k === 0 ? b - largo - 0.2 : a + 0.2;
    const z0 = tipo === 'nobre' || tipo === 'condominio' ? 7 : tipo === 'centro' ? 4.2 : tipo === 'pequena' ? 5 : 4.4;
    fundo.push(...m.desenhar(v, x0, largo, z0, c, `${m.id}${k}`));
    ids.push(m.id);
    // A periferia é colada: um segundo vizinho menor no resto da divisa.
    if (tipo === 'periferia' && l - largo > 3.5) {
      const m2 = de.find(x => x.id !== m.id && x.min <= l - largo) ?? m;
      fundo.push(...m2.desenhar(v, k === 0 ? a + 0.1 : x0 + largo + 0.2, l - largo - 0.5, 4, c, `${m2.id}${k}b`));
    }
    // Os bairros com quintal têm árvore; o litoral, coqueiro.
    if (tipo === 'nobre' || tipo === 'condominio' || (tipo === 'bairro' && sem(`arv${k}`) > 0.5)) fundo.push(c.litoral && sem(`coq${k}`) > 0.4 ? palmeira(v, k === 0 ? a + 0.8 : b - 0.8, 2.6, 6.5, k === 0 ? 1 : -1) : arvore(v, k === 0 ? a + 0.8 : b - 0.8, 2.6, { alt: 6, copa: '#4f7f42' }));
  }
  return { fundo, ids };
}

/** Os modelos que podem aparecer num lugar (para os testes e para a auditoria de variedade). */
export function modelosPossiveis27(tipo: TipoDeEntorno, pais?: string, padrao = 2): string[] {
  const regiao = regiaoDoPais27(pais);
  return MODELOS27.filter(m => (m.regioes === 'todas' || m.regioes.includes(regiao)) && m.entornos.includes(tipo) && padrao >= m.padrao[0] - 1 && padrao <= m.padrao[1] + 1).map(m => m.id);
}
