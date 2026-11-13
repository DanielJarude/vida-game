/**
 * VIDA 18 · A PROPRIEDADE RURAL — terra com área, solo, água e vocação; lavoura em talhões; rebanho agregado; estrutura,
 * máquina e gestão. Aprofunda `sistemas/rural` (que continua sendo a CARREIRA de quem produz: terra, safra regional,
 * cooperativa, pesca e defeso) sem duplicá-lo:
 *
 *   ONDE MORA      a propriedade própria é um IMÓVEL (`Imovel.rural`): entra no patrimônio, vende-se pela venda de
 *                  imóvel, passa na herança e na partilha como qualquer bem (nada de herança paralela). A arrendada de
 *                  terceiros fica em `Vida.rural18.arrendadas` (não é patrimônio: é contrato).
 *   O ANO          `processarFazendas18` (uma vez por ano, `ultimoAno` garante): o clima da região (a safra regional de
 *                  `safraDaRegiao` + o tipo de evento + o desastre do mundo14 na região de casa), o preço do ano por
 *                  cultura (`rngDe`, o mesmo para todos), cada talhão (aptidão da região, solo, água, irrigação, praga,
 *                  rotação, manejo orgânico, foco em volume ou qualidade, tecnologia), cada rebanho (capacidade de
 *                  pasto e de estrutura, sanidade, genética, alimentação, nascimentos, mortes, vendas) e os custos fixos
 *                  (manutenção, ITR, gestão). O resultado entra na conta UMA vez (`lancar` 'Resultado da propriedade').
 *   O VALOR        terra (R$/ha da região × solo × água) + estruturas (depreciadas) + máquinas + rebanho. `Imovel.valor`
 *                  é recalculado daqui (`sincronizarValor`); `processarImoveis` não mexe em imóvel rural.
 *   O DONO         quem produz (ocupação produtor rural) toca a própria terra; para as outras, um caseiro ou um
 *                  gerente (custo). A renda do produtor (o salário por clientela) é o pró-labore: o resultado da
 *                  propriedade que ele toca desconta esse pró-labore — o dinheiro não entra duas vezes.
 *
 * Sorteios: tudo por `rngDe(v.id, ...)` (o gerador principal da vida não muda por causa da fazenda).
 */
import type { Imovel, Vida } from '../../tipos';
import { clamp, rngDe, type Rng } from '../../rng';
import { escrever, idade } from '../../nucleo';
import { economiaLocal, municipio, paisDaCidade } from '../../dados/lugares';
import { anoDe } from '../../tempo';
import { lancar } from '../../sistemas/extrato';
import { habilidade } from '../../sistemas/frentes';
import { safraDaRegiao } from '../../sistemas/rural';
import { dinheiro as fmt } from '../../texto';
import {
  CULTURAS18, ESTRUTURAS18, MAQUINAS18, PRECO_TERRA_REGIAO, REBANHOS18, RESERVA_LEGAL, TIPOS18,
  type CulturaId, type EspecieRural, type EstruturaId, type GrupoCultura, type MaquinaId, type RegiaoRural, type TipoRural
} from '../../dados18/rural/catalogo18';

export type { CulturaId, EspecieRural, EstruturaId, MaquinaId, TipoRural };

/* ================================================================== O estado */

export interface Talhao18 {
  id: string;
  cultura: CulturaId;
  ha: number;
  /** Ano do plantio (perenes e florestas contam a idade daqui). */
  ano: number;
  irrigado?: boolean;
  /** Soja seguida de milho safrinha na mesma área (duas safras no ano). */
  safrinha?: boolean;
  /** O grupo da cultura que estava neste chão antes (para a rotação). */
  antes?: GrupoCultura;
  /** Anos seguidos do mesmo grupo neste chão (monocultura). */
  repete?: number;
}

export type Alimentacao18 = 'pasto' | 'suplementado' | 'confinado';
export type Estrategia18 = 'manter' | 'crescer' | 'reduzir';

export interface Rebanho18 {
  especie: EspecieRural;
  cabecas: number;
  /** 0–100: o melhoramento (reprodutor, inseminação, seleção). */
  genetica: number;
  /** 0–100: vacina, vermífugo, veterinário. */
  sanidade: number;
  alimentacao: Alimentacao18;
  estrategia: Estrategia18;
  sanitario: 'basico' | 'completo';
}

export interface AnoRural18 {
  ano: number;
  clima: ClimaRural18['tipo'];
  receita: number;
  custo: number;
  resultado: number;
  linhas: { oque: string; receita: number; custo: number; nota?: string }[];
}

export type UsoRural18 = 'producao' | 'residencia' | 'investimento' | 'arrendada';

export interface PropriedadeRural18 {
  id: string;
  tipo: TipoRural;
  nome: string;
  ha: number;
  municipioId: string;
  /** 0–100. */
  solo: number;
  agua: number;
  relevo: 'plano' | 'ondulado' | 'montanhoso';
  /** Valor da terra nua por hectare, hoje. */
  valorHa: number;
  uso: UsoRural18;
  manejo: 'convencional' | 'organico';
  /** Ano em que começou a transição para o orgânico (a certificação sai em três anos). */
  transicao?: number;
  foco: 'volume' | 'equilibrio' | 'qualidade';
  talhoes: Talhao18[];
  rebanhos: Rebanho18[];
  estruturas: { id: EstruturaId; n: number; t: number; ha?: number }[];
  maquinas: { id: MaquinaId; t: number }[];
  cooperativa?: boolean;
  seguro?: boolean;
  historico: AnoRural18[];
  ultimoAno: number;
  origem: 'compra' | 'heranca' | 'familia' | 'arrendamento' | 'antigo';
  /** Arrendada de terceiros (`de: 'terceiro'`, você paga) ou a terceiros (`para: 'terceiro'`, você recebe). */
  arrendamento?: { valorAno: number; ate: number; sentido: 'pago' | 'recebo' };
  /** Ano da última recuperação do solo (calagem e adubação verde). */
  tRecuperacao?: number;
  /** Os cavalos de corrida da casa (individuais: são poucos e têm nome). */
  cavalos?: CavaloDeCorrida18[];
}

export interface CavaloDeCorrida18 { id: string; nome: string; nasc: number; sexo: 'macho' | 'femea'; velocidade: number; fundo: number; forma: number; corridas: number; vitorias: number; premios: number; aposentado?: boolean }

export interface Rural18 {
  arrendadas: PropriedadeRural18[];
  /** As festas e eventos do campo deste ano a que a pessoa foi (ids). */
  festas?: { ano: number; ids: string[] };
  /** A última temporada passada no campo (ano). */
  temporada?: number;
}

const estado18 = (v: Vida): Rural18 => (v.rural18 ??= { arrendadas: [] });

/* ================================================================== Onde: região, reserva, preço da terra */

export function regiaoRural(municipioId: string): RegiaoRural {
  if (paisDaCidade(municipioId) !== 'BR') return 'outro';
  return (municipio(municipioId).regiao as RegiaoRural | undefined) ?? 'outro';
}
export const custoLocal = (municipioId: string) => economiaLocal(municipioId).custo;

/** A fração que é reserva legal (Código Florestal): não se planta nem se põe gado. Fora do Brasil, 10% de mata e beira de rio. */
export function reservaLegal(municipioId: string): number {
  if (paisDaCidade(municipioId) !== 'BR') return 0.1;
  return RESERVA_LEGAL[municipio(municipioId).uf] ?? 0.2;
}
/** A área que se pode usar (sem a reserva legal e a beira de rio). */
export const areaUtil = (p: PropriedadeRural18) => Math.round(p.ha * (1 - reservaLegal(p.municipioId)) * 0.96 * 10) / 10;
export const areaPlantada = (p: PropriedadeRural18) => Math.round(p.talhoes.reduce((s, t) => s + t.ha, 0) * 10) / 10;
/** O que não é lavoura nem tanque vira pasto (ou fica parado). */
export const areaPasto = (p: PropriedadeRural18) => Math.max(0, Math.round((areaUtil(p) - areaPlantada(p) - laminaDagua(p)) * 10) / 10);
export const laminaDagua = (p: PropriedadeRural18) => qtdEstrutura(p, 'tanques') * 1;
export const areaLivre = (p: PropriedadeRural18) => Math.max(0, Math.round((areaUtil(p) - areaPlantada(p) - laminaDagua(p)) * 10) / 10);

/** Preço da terra nua por hectare: o tipo, a região, o solo e a água (terra boa e com água vale mais). */
export function precoDaTerraHa(tipo: TipoRural, municipioId: string, solo: number, agua: number): number {
  const base = TIPOS18[tipo].precoHa * PRECO_TERRA_REGIAO[regiaoRural(municipioId)] * custoLocal(municipioId);
  return Math.round(base * (0.7 + solo / 250 + agua / 500) / 10) * 10;
}

/* ================================================================== Estruturas, máquinas, capacidade */

export const qtdEstrutura = (p: PropriedadeRural18, id: EstruturaId) => p.estruturas.filter(e => e.id === id).reduce((s, e) => s + e.n, 0);
export const temEstrutura = (p: PropriedadeRural18, id: EstruturaId) => qtdEstrutura(p, id) > 0;
export const temMaquina = (p: PropriedadeRural18, id: MaquinaId) => p.maquinas.some(m => m.id === id);

/** Quantas unidades da estrutura cabem nesta propriedade (pelo tamanho e pelo tipo). */
export function maxDaEstrutura(p: PropriedadeRural18, id: EstruturaId): number {
  const e = ESTRUTURAS18[id];
  if (!e.tipos.includes(p.tipo) || p.ha < e.minHa) return 0;
  if (!e.haPorUnidade) return e.max;
  return Math.max(1, Math.min(e.max, Math.floor(p.ha / e.haPorUnidade) + 1));
}

/** O custo de construir (o que escala por hectare usa a área servida). */
export function custoDaEstrutura(p: PropriedadeRural18, id: EstruturaId, ha?: number): number {
  const e = ESTRUTURAS18[id];
  const servida = e.porHa ? (ha ?? Math.min(areaUtil(p), e.capacidade ?? areaUtil(p))) : 0;
  return Math.round(((e.custo || 0) + (e.porHa ?? 0) * servida) * custoLocal(p.municipioId) / 100) * 100;
}

/** Hectares irrigáveis (pivô e gotejamento), limitados pela água disponível (poço, represa). */
export function haIrrigaveis(p: PropriedadeRural18): number {
  const pivo = p.estruturas.filter(e => e.id === 'pivo').reduce((s, e) => s + (e.ha ?? 100) * e.n, 0);
  const gotejo = p.estruturas.filter(e => e.id === 'irrigacao_gotejo').reduce((s, e) => s + (e.ha ?? 10) * e.n, 0);
  const fonte = temEstrutura(p, 'represa') ? 1 : temEstrutura(p, 'poco') ? 0.35 : 0;
  const pivoOk = temEstrutura(p, 'represa') ? pivo : pivo * 0.3;
  return Math.round((pivoOk + gotejo * Math.min(1, fonte * 2.5)) * 10) / 10;
}

/** Tecnologia (0–3): as máquinas e a agricultura de precisão. */
export function tecnologia(p: PropriedadeRural18): number {
  return Math.min(3, Math.round(p.maquinas.reduce((s, m) => s + MAQUINAS18[m.id].tecnologia, 0) * 10) / 10);
}

/** Capacidade de pasto em UA (unidade animal): o solo, a água e o manejo. */
export function capacidadeUA(p: PropriedadeRural18): number {
  const lot = 0.9 * (0.6 + p.solo / 160) * (0.8 + p.agua / 400);
  const confinado = p.rebanhos.some(r => r.alimentacao === 'confinado') ? qtdEstrutura(p, 'curral') * 150 : 0;
  return Math.round(areaPasto(p) * lot + confinado);
}
export const uaOcupadas = (p: PropriedadeRural18) => p.rebanhos.reduce((s, r) => s + REBANHOS18[r.especie].ua * r.cabecas * (r.alimentacao === 'confinado' ? 0.15 : r.alimentacao === 'suplementado' ? 0.8 : 1), 0);

/** O teto de um rebanho pela estrutura (sem curral, o gado não passa de ~60; sem aviário, 200 galinhas...). */
export function tetoDaEstrutura(p: PropriedadeRural18, e: EspecieRural): number {
  const d = REBANHOS18[e];
  if (!d.estrutura) return Number.POSITIVE_INFINITY;
  const cap = ESTRUTURAS18[d.estrutura].capacidade ?? 0;
  const n = qtdEstrutura(p, d.estrutura);
  // Galinhas e frangos dividem o aviário; ovelhas e cabras, o aprisco.
  const dividem = p.rebanhos.filter(r => r.especie !== e && REBANHOS18[r.especie].estrutura === d.estrutura).reduce((s, r) => s + r.cabecas, 0);
  if (e === 'tilapia' || e === 'tambaqui') return Math.max(0, n * cap - dividem);
  return Math.max(0, d.semEstrutura + n * cap - dividem);
}

/* ================================================================== O clima e o preço do ano */

export interface ClimaRural18 { tipo: 'bom' | 'normal' | 'seca' | 'enchente' | 'geada' | 'granizo' | 'veranico'; texto: string; severidade: number }

function hash01(...partes: (string | number)[]): number { return rngDe('clima18', ...partes).next(); }

/** O clima do ano na região: a mesma safra regional de sempre (`safraDaRegiao`) com o que a explica. */
export function climaDoAno(v: Vida | undefined, municipioId: string, ano: number): ClimaRural18 {
  const s = safraDaRegiao(municipioId, ano);
  const reg = regiaoRural(municipioId);
  const uf = paisDaCidade(municipioId) === 'BR' ? municipio(municipioId).uf : paisDaCidade(municipioId);
  // O desastre que o mundo14 registrou na região de casa neste ano pesa por cima.
  const desastre = v?.mundo14?.eventos?.find(e => e.ano === ano && e.tipo === 'desastre' && e.escopo === 'regiao' && /seca|estiagem|enchente|chuva/i.test(e.titulo + ' ' + e.texto));
  if (desastre) return /seca|estiagem/i.test(desastre.titulo + desastre.texto) ? { tipo: 'seca', texto: 'A seca que o noticiário mostrou: pasto queimado, represa baixa.', severidade: 0.45 } : { tipo: 'enchente', texto: 'A enchente que tomou a região: várzea alagada, estrada cortada.', severidade: 0.4 };
  if (s === 'boa') return { tipo: 'bom', texto: 'Chuva na hora certa, sol na colheita.', severidade: 0 };
  if (s === 'normal') {
    const x = hash01(uf, ano, 'normal');
    return x < 0.18 ? { tipo: 'veranico', texto: 'Um veranico de três semanas no meio da safra.', severidade: 0.12 } : { tipo: 'normal', texto: 'Um ano de chuva regular.', severidade: 0 };
  }
  const x = hash01(uf, ano, 'ruim');
  const geadaPossivel = reg === 'Sul' || reg === 'Sudeste';
  if (geadaPossivel && x < 0.3) return { tipo: 'geada', texto: 'Geada forte em julho: o café e a cana queimaram nas baixadas.', severidade: 0.4 };
  if (x < 0.62) return { tipo: 'seca', texto: reg === 'Nordeste' ? 'A estiagem: o açude baixou, o sertão secou cedo.' : 'Seca no verão: a lavoura sofreu na fase de enchimento do grão.', severidade: 0.38 };
  if (x < 0.85) return { tipo: 'enchente', texto: 'Chuva demais: várzea alagada e colheita atrasada.', severidade: 0.3 };
  return { tipo: 'granizo', texto: 'Uma pancada de granizo levou parte da lavoura.', severidade: 0.25 };
}

/** O preço do ano para uma cultura (o mercado: o mesmo para todos no ano; em ano ruim na região, sobe um pouco). */
export function fatorDePreco(cultura: string, ano: number): number {
  const r = rngDe('preco18', cultura, ano);
  return Math.round((0.82 + r.next() * 0.36) * 100) / 100;
}

/* ================================================================== Quem toca: gestão e competência */

export const produtorRural = (v: Vida) => v.trabalho.atual?.ocupacaoId === 'produtor_rural';
/** A propriedade que a própria pessoa toca (a do produtor rural): a primeira em produção. As outras pedem caseiro ou gerente. */
export function tocadaPorVoce(v: Vida): string | undefined {
  if (!produtorRural(v)) return undefined;
  return todasAsPropriedades(v).find(x => x.p.uso === 'producao')?.p.id;
}
/** O quanto se sabe do ofício: a prática do campo e a formação (agronomia, veterinária, técnico agrícola). */
export function competencia(v: Vida): number {
  const hab = habilidade(v, 'campo');
  const formado = v.educacao.concluidos.some(c => c.area === 'agro' || c.cursoId === 'agronomia' || c.cursoId === 'tec_agropecuaria') ? 15 : 0;
  const vet = v.educacao.concluidos.some(c => c.area === 'veterinaria') ? 10 : 0;
  return clamp(hab * 0.8 + formado + vet);
}
export const temVeterinaria = (v: Vida) => v.educacao.concluidos.some(c => c.area === 'veterinaria');

/** O custo de gestão por ano de uma propriedade que você não toca: caseiro no pequeno, gerente no grande. */
export function custoDeGestao(v: Vida, p: PropriedadeRural18): number {
  if (p.uso !== 'producao' || tocadaPorVoce(v) === p.id) return 0;
  // Quem mora no sítio (ou na chácara) cuida dele no dia a dia: sem caseiro.
  const im = todasAsPropriedades(v).find(x => x.p === p)?.imovel;
  if (p.ha <= 50 && im && im.id === v.moradia.imovelId) return 0;
  const c = custoLocal(p.municipioId);
  return Math.round((p.ha < 40 ? 32000 : p.ha < 300 ? 78000 : 140000) * c);
}

/* ================================================================== Valor */

export function valorDasEstruturas(p: PropriedadeRural18, ano: number): number {
  return Math.round(p.estruturas.reduce((s, e) => {
    const base = (ESTRUTURAS18[e.id].custo + (ESTRUTURAS18[e.id].porHa ?? 0) * (e.ha ?? 0)) * custoLocal(p.municipioId) * e.n;
    const idadeAnos = Math.max(0, ano - anoDe(e.t));
    return s + base * Math.max(0.3, 1 - idadeAnos * 0.025);
  }, 0) / 1000) * 1000;
}
export function valorDasMaquinas(p: PropriedadeRural18, ano: number): number {
  return Math.round(p.maquinas.reduce((s, m) => s + MAQUINAS18[m.id].preco * custoLocal(p.municipioId) * Math.max(0.2, 1 - Math.max(0, ano - anoDe(m.t)) * 0.08), 0) / 1000) * 1000;
}
export function valorDoRebanho(p: PropriedadeRural18): number {
  const c = custoLocal(p.municipioId);
  const cav = (p.cavalos ?? []).filter(x => !x.aposentado).reduce((s, x) => s + valorDoCavalo(x) * c, 0);
  return Math.round((p.rebanhos.reduce((s, r) => s + REBANHOS18[r.especie].valor * r.cabecas * (0.6 + r.genetica / 125) * c, 0) + cav) / 1000) * 1000;
}
export const valorDoCavalo = (x: CavaloDeCorrida18) => Math.round(12000 + (x.velocidade + x.fundo - 100) * 900 + x.vitorias * 6000);
/** As lavouras perenes formadas valem (o cafezal, o pomar, a floresta em pé). */
export function valorDasLavouras(p: PropriedadeRural18, ano: number): number {
  const c = custoLocal(p.municipioId);
  return Math.round(p.talhoes.reduce((s, t) => {
    const k = CULTURAS18[t.cultura];
    if (k.ciclo === 'anual' || !k.implantacaoHa) return s;
    const idadeT = ano - t.ano;
    // A floresta em pé vale o que já cresceu do corte (descontado); o cafezal e o pomar, a implantação que ainda não se gastou.
    if (k.ciclo === 'florestal') return s + Math.max(k.implantacaoHa, k.produtividade * k.preco * Math.min(1, idadeT / (k.vidaUtil ?? 7)) * 0.75) * t.ha * c;
    const fr = Math.max(0.2, 1 - idadeT / ((k.vidaUtil ?? 10) * 1.2));
    return s + k.implantacaoHa * t.ha * c * fr;
  }, 0) / 1000) * 1000;
}
export function valorDaPropriedade(p: PropriedadeRural18, ano: number): number {
  return Math.round((p.valorHa * p.ha + valorDasEstruturas(p, ano) + valorDasMaquinas(p, ano) + valorDoRebanho(p) + valorDasLavouras(p, ano)) / 1000) * 1000;
}

/** Todas as propriedades que a vida toca ou tem (as próprias, nos imóveis; as arrendadas de terceiros). */
export function todasAsPropriedades(v: Vida): { p: PropriedadeRural18; imovel?: Imovel }[] {
  const proprias = v.financas.bens.filter((b): b is Imovel => b.tipo === 'imovel' && !!b.rural).map(b => ({ p: b.rural!, imovel: b }));
  return [...proprias, ...(v.rural18?.arrendadas ?? []).map(p => ({ p }))];
}
export function acharPropriedade(v: Vida, id: string): { p: PropriedadeRural18; imovel?: Imovel } | undefined {
  return todasAsPropriedades(v).find(x => x.p.id === id);
}
export function sincronizarValor(v: Vida, imovel: Imovel | undefined): void {
  if (!imovel?.rural) return;
  imovel.valor = Math.max(10000, valorDaPropriedade(imovel.rural, anoDe(v.t)));
}

/* ================================================================== Criar uma propriedade */

const NOMES = ['Boa Vista', 'Santa Rita', 'São João', 'Recanto', 'Água Limpa', 'Três Barras', 'Bela Vista', 'Esperança', 'Santa Clara', 'Cachoeira', 'Pau-d\'Alho', 'Retiro', 'Bom Jardim', 'Ipê Amarelo', 'Serra Azul', 'Capão Bonito', 'Dois Irmãos', 'Lagoa Seca', 'Primavera', 'Santo Antônio'];
const PREFIXO: Record<TipoRural, string> = { agricola: 'Fazenda', pecuaria: 'Fazenda', sitio: 'Sítio', chacara: 'Chácara', haras: 'Haras', cafeeira: 'Fazenda', florestal: 'Fazenda', aquicultura: 'Piscicultura' };

export function novaPropriedade(v: Vida, r: Rng, tipo: TipoRural, ha: number, municipioId: string, origem: PropriedadeRural18['origem']): PropriedadeRural18 {
  const T = TIPOS18[tipo];
  const solo = clamp(Math.round(55 + r.normal() * 14), 25, 92);
  const agua = clamp(Math.round((regiaoRural(municipioId) === 'Nordeste' ? 42 : 62) + r.normal() * 15), 15, 95);
  const relevo = tipo === 'cafeeira' ? r.pick(['ondulado', 'montanhoso'] as const) : tipo === 'agricola' ? 'plano' : r.pick(['plano', 'ondulado', 'ondulado'] as const);
  const ano = anoDe(v.t);
  const p: PropriedadeRural18 = {
    id: `pr${v.seq++}`, tipo, nome: `${PREFIXO[tipo]} ${r.pick(NOMES)}`, ha, municipioId, solo, agua, relevo,
    valorHa: precoDaTerraHa(tipo, municipioId, solo, agua) * (relevo === 'montanhoso' ? 0.85 : 1),
    uso: 'producao', manejo: 'convencional', foco: 'equilibrio', talhoes: [], rebanhos: [],
    estruturas: T.vemCom.map(id => ({ id, n: 1, t: v.t - 12 * r.int(3, 20) })), maquinas: [], historico: [], ultimoAno: ano - 1, origem
  };
  p.valorHa = Math.round(p.valorHa / 10) * 10;
  return p;
}

/** A propriedade "pronta" de uma oferta ou de uma família: já com a lavoura ou o rebanho da vocação dela. */
export function povoar(p: PropriedadeRural18, r: Rng, ano: number, intensidade = 0.6): void {
  const T = TIPOS18[p.tipo];
  const util = areaUtil(p);
  const reg = regiaoRural(p.municipioId);
  const culturas = T.vocacao.filter((x): x is CulturaId => x in CULTURAS18).filter(c => CULTURAS18[c].aptidao[reg] >= 0.75);
  const rebanhos = T.vocacao.filter((x): x is EspecieRural => x in REBANHOS18);
  const lavoura = util * (1 - T.pasto) * intensidade;
  if (culturas.length && lavoura >= 0.3) {
    const c = culturas[0];
    const k = CULTURAS18[c];
    const ha = Math.max(0.3, Math.round(Math.min(lavoura, k.maxHa ?? lavoura) * 10) / 10);
    // A lavoura que vem com a terra está no meio da vida dela (a floresta, longe do corte: quem compra paga o que ela já cresceu).
    p.talhoes.push({ id: `t${ano}a`, cultura: c, ha, ...(c === 'soja' && reg !== 'Nordeste' && reg !== 'Norte' ? { safrinha: true } : {}), ano: k.ciclo === 'anual' ? ano : k.ciclo === 'florestal' ? ano - r.int(1, Math.max(1, (k.vidaUtil ?? 7) - 2)) : ano - r.int(k.formacao ?? 0, (k.formacao ?? 0) + 6) });
  }
  if (p.tipo === 'aquicultura') { const t = p.estruturas.find(e => e.id === 'tanques'); if (t) t.n = Math.max(1, Math.min(30, Math.round(p.ha * 0.25))); }
  if (rebanhos.length) {
    const e = rebanhos[0];
    const d = REBANHOS18[e];
    const cap = d.ua > 0 ? Math.floor(areaPasto(p) * 0.85 / d.ua) : d.semEstrutura;
    const n0 = Math.min(tetoDaEstrutura(p, e), Math.round(cap * intensidade));
    const n = n0 >= d.lote * 0.3 ? n0 : 0;
    if (e === 'tilapia' || e === 'tambaqui') p.rebanhos.push({ especie: e, cabecas: Math.max(1, Math.round(tetoDaEstrutura(p, e) * 0.8)), genetica: 45, sanidade: 60, alimentacao: 'confinado', estrategia: 'manter', sanitario: 'basico' });
    else if (n > 0) p.rebanhos.push({ especie: e, cabecas: n, genetica: clamp(Math.round(40 + r.normal() * 10)), sanidade: clamp(Math.round(60 + r.normal() * 10)), alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' });
  }
}

/* ================================================================== O ano de uma propriedade */

function grupo(c: CulturaId): GrupoCultura { return CULTURAS18[c].grupo; }

/** O que um talhão rende num ano (receita, custo e uma nota). Puro: não muda nada (a previsão usa o mesmo cálculo). */
export function resultadoDoTalhao(_v: Vida | undefined, p: PropriedadeRural18, t: Talhao18, ano: number, clima: ClimaRural18, praga: boolean, comp: number): { receita: number; custo: number; nota?: string; colheu: boolean; producao: number } {
  const k = CULTURAS18[t.cultura];
  const c = custoLocal(p.municipioId);
  const reg = regiaoRural(p.municipioId);
  const idadeT = ano - t.ano;
  const tec = tecnologia(p);
  const reducaoOperacao = Math.min(0.2, p.maquinas.reduce((s, m) => s + MAQUINAS18[m.id].economia * Math.min(1, MAQUINAS18[m.id].ha / Math.max(1, areaPlantada(p))), 0));
  let custo = k.custoHa * t.ha * c * (1 - reducaoOperacao) * (p.foco === 'qualidade' ? 1.06 : 1);
  if (p.manejo === 'organico') custo *= 0.95;
  if (p.cooperativa) custo *= 0.96;
  if (t.irrigado) custo += 900 * t.ha * c * (temEstrutura(p, 'solar') ? 0.5 : 1);
  // Perene em formação e floresta antes do corte: só o custo de manter.
  const emFormacao = (k.ciclo === 'perene' || k.ciclo === 'semiperene') && idadeT < (k.formacao ?? 0);
  const florestaCrescendo = k.ciclo === 'florestal' && idadeT < (k.vidaUtil ?? 7);
  if (emFormacao || florestaCrescendo) return { receita: 0, custo: Math.round((emFormacao ? k.custoHa * 0.35 : k.custoHa) * t.ha * c), nota: emFormacao ? `em formação (${idadeT + 1}º de ${k.formacao} anos)` : `crescendo (${idadeT} de ${k.vidaUtil} anos até o corte)`, colheu: false, producao: 0 };
  // A produtividade: aptidão da região, solo, água, tecnologia, competência de quem toca, foco.
  // Solo 60, quem toca com prática média (45) e água suficiente: a produtividade de referência.
  let prod = k.produtividade * k.aptidao[reg] * (0.6 + p.solo / 150) * (1 + tec * 0.05) * (0.95 + comp / 900);
  const aguaOk = t.irrigado ? 1 : Math.min(1, (p.agua + 30) / (k.agua * 100 + 30));
  prod *= 0.75 + 0.25 * aguaOk;
  if (p.foco === 'volume') prod *= 1.06; else if (p.foco === 'qualidade') prod *= 0.92;
  // Orgânico: rende menos (sem adubo químico nem defensivo de síntese).
  if (p.manejo === 'organico') prod *= 0.8;
  // Rotação: leguminosa depois de gramínea ajuda; o mesmo grupo anos a fio cansa e chama praga.
  if (k.ciclo === 'anual' && t.antes && t.antes !== k.grupo) prod *= 1.05;
  if (k.ciclo === 'anual' && (t.repete ?? 0) >= 3) prod *= 0.93;
  // Bienalidade do café: um ano carrega, o outro descansa.
  if (t.cultura === 'cafe') prod *= (idadeT % 2 === 0 ? 1.15 : 0.85);
  let nota: string | undefined;
  // O clima: a severidade pesa no que estava na fase sensível.
  let perda = 0;
  if (clima.tipo === 'geada' && k.geada) perda += clima.severidade * (t.cultura === 'cafe' ? 1.2 : 0.8);
  else if (clima.tipo === 'seca' || clima.tipo === 'veranico') perda += clima.severidade * k.agua * (t.irrigado ? 0.2 : 1.1) * (temEstrutura(p, 'represa') ? 0.85 : 1);
  else if (clima.tipo === 'enchente') perda += clima.severidade * (t.cultura === 'arroz' ? 0.2 : 0.7) * (temEstrutura(p, 'estradas') ? 0.85 : 1);
  else if (clima.tipo === 'granizo') perda += clima.severidade * (t.cultura === 'horta' && temEstrutura(p, 'estufa') ? 0.1 : 0.9);
  else if (clima.tipo === 'bom') prod *= 1.08;
  if (perda > 0.02) nota = `${clima.tipo === 'geada' ? 'a geada' : clima.tipo === 'seca' || clima.tipo === 'veranico' ? 'a falta de chuva' : clima.tipo === 'enchente' ? 'a chuva demais' : 'o granizo'} levou ${Math.round(perda * 100)}%`;
  if (praga) {
    const p0 = 0.22 * (p.manejo === 'organico' ? 1.3 : 1) * (1 - tec * 0.12) * (1 - comp / 300);
    perda += p0;
    nota = (nota ? nota + '; ' : '') + `${k.praga} levou ${Math.round(p0 * 100)}%`;
  }
  prod *= Math.max(0.1, 1 - perda);
  const producao = Math.round(prod * t.ha * 10) / 10;
  // O preço: o do ano, o prêmio do orgânico certificado e da qualidade, e o silo (vender na entressafra).
  const certificado = p.manejo === 'organico' && p.transicao !== undefined && ano - p.transicao >= 3;
  let preco = k.preco * fatorDePreco(t.cultura, ano) * c;
  if (certificado) preco *= 1 + k.premioOrganico;
  if (p.foco === 'qualidade') preco *= 1 + k.premioQualidade + (t.cultura === 'cafe' && temEstrutura(p, 'terreiro') ? 0.12 : 0);
  if (temEstrutura(p, 'silo') && ['soja', 'milho', 'trigo', 'feijao', 'arroz', 'cafe'].includes(t.cultura)) preco *= 1.05;
  if (p.cooperativa) preco *= 1.02;
  let receita = producao * preco;
  // A safrinha de milho depois da soja (precisa de chuva no outono — ou de irrigação).
  if (t.safrinha && t.cultura === 'soja') {
    const m = CULTURAS18.milho;
    const pm = m.produtividade * 0.8 * m.aptidao[reg] * (0.6 + p.solo / 150) * (t.irrigado ? 1 : clima.tipo === 'seca' ? 0.5 : 0.9);
    receita += pm * t.ha * m.preco * fatorDePreco('milho', ano) * c;
    custo += m.custoHa * 0.85 * t.ha * c * (1 - reducaoOperacao);
  }
  // A floresta é cortada no fim do ciclo (a receita do ciclo inteiro de uma vez).
  if (k.ciclo === 'florestal') nota = (nota ? nota + '; ' : '') + 'corte do ciclo';
  // Seguro rural: paga parte da perda grande.
  if (p.seguro && perda > 0.3) receita += k.produtividade * t.ha * k.preco * c * (perda - 0.3) * 0.7;
  return { receita: Math.round(receita), custo: Math.round(custo), nota, colheu: true, producao };
}

/** O que um rebanho dá num ano (receita, custo, e as cabeças depois de nascer, morrer e vender). Puro. */
export function resultadoDoRebanho(_v: Vida | undefined, p: PropriedadeRural18, rb: Rebanho18, ano: number, clima: ClimaRural18, surto: boolean, comp: number): { receita: number; custo: number; cabecas: number; nascidos: number; mortos: number; vendidos: number; nota?: string; sanidade: number } {
  const d = REBANHOS18[rb.especie];
  const c = custoLocal(p.municipioId);
  // Peixe: toneladas por ano pela lâmina d'água.
  if (rb.especie === 'tilapia' || rb.especie === 'tambaqui') {
    const t = Math.min(rb.cabecas, tetoDaEstrutura(p, rb.especie));
    let prod = t * (0.85 + rb.genetica / 300) * (0.8 + rb.sanidade / 500) * (clima.tipo === 'seca' ? 0.85 : 1);
    if (surto) prod *= 0.75;
    const receita = prod * d.produtoPorCabeca * d.precoProduto * fatorDePreco(rb.especie, ano) * c;
    const custo = t * d.custoAno * c * (temEstrutura(p, 'solar') ? 0.93 : 1);
    return { receita: Math.round(receita), custo: Math.round(custo), cabecas: rb.cabecas, nascidos: 0, mortos: 0, vendidos: 0, sanidade: rb.sanidade, nota: surto ? `${d.doenca} pegou um dos tanques` : undefined };
  }
  const n = rb.cabecas;
  if (n <= 0) return { receita: 0, custo: 0, cabecas: 0, nascidos: 0, mortos: 0, vendidos: 0, sanidade: rb.sanidade };
  // Lotação: pasto e estrutura.
  const capUA = capacidadeUA(p);
  const ocup = uaOcupadas(p);
  const lotado = d.ua > 0 && ocup > capUA ? ocup / Math.max(1, capUA) : 1;
  const teto = tetoDaEstrutura(p, rb.especie);
  const apertado = n > teto ? n / Math.max(1, teto) : 1;
  const excesso = Math.max(lotado, apertado);
  // Sanidade do ano: o manejo, o veterinário da casa, a superlotação, a seca.
  // A sanidade anda para o equilíbrio do manejo (básico ~58, completo ~82; quem entende do ofício, um pouco mais) e cai
  // com a superlotação, a seca no pasto e o surto do ano.
  const alvoSan = (rb.sanitario === 'completo' ? 82 : 58) + (comp > 50 ? 5 : 0) - (excesso > 1 ? (excesso - 1) * 60 : 0) - (clima.tipo === 'seca' && rb.alimentacao === 'pasto' ? 10 : 0);
  let san = rb.sanidade + (alvoSan - rb.sanidade) * 0.4;
  if (surto) san -= 18;
  san = clamp(Math.round(san), 5, 98);
  const alim = rb.alimentacao === 'confinado' ? 1.25 : rb.alimentacao === 'suplementado' ? 1.1 : 1;
  const custoAlim = rb.alimentacao === 'confinado' ? 1.9 : rb.alimentacao === 'suplementado' ? 1.3 : 1;
  const sec = clima.tipo === 'seca' && rb.alimentacao === 'pasto' ? 0.85 : 1;
  const gen = 0.6 + rb.genetica / 125;
  const mort = Math.min(0.5, d.mortalidade * (1.6 - san / 100) * (surto ? 2.2 : 1) * (excesso > 1.2 ? 1.5 : 1));
  const mortos = Math.round(n * mort);
  const nascidos = Math.round(n * d.matrizes * d.natalidade * (0.7 + san / 330) * alim * sec);
  // Venda. Os de giro (porco, frango, galinha) mantêm o alojamento e vendem os lotes (a reposição está no custo); o
  // rebanho de cria vende o que passa do alvo: manter = o mesmo tamanho; crescer = reter as fêmeas (+12%); reduzir = −20%.
  const giro = rb.especie === 'porcos' || rb.especie === 'frangos' || rb.especie === 'galinhas';
  const vivos = n + nascidos - mortos;
  const alvo = Math.round(n * (rb.estrategia === 'crescer' ? 1.12 : rb.estrategia === 'reduzir' ? 0.8 : 1));
  const vendidos = giro ? Math.round(n * d.desfrute * (1 - mort)) : Math.round(Math.min(Math.max(0, vivos - alvo), vivos * 0.6));
  const cabecas = giro ? n : Math.max(0, vivos - vendidos);
  const precoVenda = d.precoVenda * gen * fatorDePreco(rb.especie, ano) * c * (rb.especie === 'cavalos' ? 1 + rb.genetica / 60 : 1);
  const produto = d.produtoPorCabeca * n * gen * alim * sec * (0.75 + san / 400) * (excesso > 1 ? 1 / excesso : 1);
  const qualidadeLeite = rb.especie === 'leite' && (temMaquina(p, 'ordenhadeira') || temEstrutura(p, 'ordenha')) ? 1.08 : 1;
  const receita = vendidos * precoVenda + produto * d.precoProduto * fatorDePreco(`${rb.especie}-produto`, ano) * c * qualidadeLeite * (p.manejo === 'organico' && rb.especie === 'leite' ? 1.25 : 1);
  const custo = n * d.custoAno * custoAlim * c * (rb.sanitario === 'completo' ? 1.08 : 1) * (temEstrutura(p, 'solar') && (rb.especie === 'leite' || rb.especie === 'frangos' || rb.especie === 'galinhas' || rb.especie === 'porcos') ? 0.95 : 1);
  const notas: string[] = [];
  if (surto) notas.push(`${d.doenca} atacou o rebanho`);
  if (excesso > 1.05) notas.push(lotado > apertado ? 'pasto pequeno para tanto animal' : `falta ${dEstrutura(rb.especie)}`);
  if (clima.tipo === 'seca' && rb.alimentacao === 'pasto') notas.push('o pasto secou');
  return { receita: Math.round(receita), custo: Math.round(custo), cabecas, nascidos: giro ? 0 : nascidos, mortos: giro ? 0 : mortos, vendidos, sanidade: san, nota: notas.join('; ') || undefined };
}
const dEstrutura = (e: EspecieRural) => { const s = REBANHOS18[e].estrutura; return s ? ESTRUTURAS18[s].nome : 'estrutura'; };

/** Custos fixos do ano: manutenção das estruturas e das máquinas, imposto da terra, gestão, arrendamento. */
export function custosFixos(v: Vida, p: PropriedadeRural18, ano: number): { oque: string; custo: number }[] {
  const c = custoLocal(p.municipioId);
  const out: { oque: string; custo: number }[] = [];
  const manut = p.estruturas.reduce((s, e) => s + (ESTRUTURAS18[e.id].custo + (ESTRUTURAS18[e.id].porHa ?? 0) * (e.ha ?? 0)) * ESTRUTURAS18[e.id].manutencao * e.n, 0) * c * (temEstrutura(p, 'solar') ? 0.92 : 1);
  if (manut > 0) out.push({ oque: 'Manutenção das estruturas', custo: Math.round(manut) });
  const maq = p.maquinas.reduce((s, m) => s + MAQUINAS18[m.id].preco * 0.04, 0) * c * (temEstrutura(p, 'galpao') ? 0.8 : 1);
  if (maq > 0) out.push({ oque: 'Manutenção das máquinas', custo: Math.round(maq) });
  // ITR (Lei 9.393/1996): alíquota baixa na terra bem usada; a terra parada paga mais.
  const usada = (areaPlantada(p) + Math.min(areaPasto(p), uaOcupadas(p) / 0.9)) / Math.max(1, areaUtil(p));
  // (Sobre o valor da terra nua declarado, que fica bem abaixo do de mercado: 0,06% bem usada, 0,3% parada.)
  const itr = paisDaCidade(p.municipioId) === 'BR' && p.arrendamento?.sentido !== 'pago' ? p.valorHa * p.ha * (usada > 0.65 || p.ha < 30 ? 0.0006 : 0.003) : 0;
  if (itr > 0) out.push({ oque: 'ITR (imposto da terra)', custo: Math.round(itr) });
  const gestao = custoDeGestao(v, p);
  if (gestao > 0) out.push({ oque: p.ha < 40 ? 'Caseiro' : 'Gerente da fazenda', custo: gestao });
  if (p.cooperativa) out.push({ oque: 'Cooperativa (cota e mensalidade)', custo: Math.round(1200 * c + p.ha * 8 * c) });
  if (p.seguro) out.push({ oque: 'Seguro rural', custo: Math.round(p.talhoes.reduce((s, t) => s + CULTURAS18[t.cultura].custoHa * t.ha, 0) * 0.04 * c) });
  if (p.manejo === 'organico') out.push({ oque: 'Certificação orgânica', custo: Math.round(3500 * c) });
  if (p.arrendamento?.sentido === 'pago') out.push({ oque: 'Arrendamento da terra', custo: p.arrendamento.valorAno });
  void ano;
  return out;
}

/** O ano inteiro da propriedade (sem aplicar): o que a tela mostra como "previsão" com o clima normal. */
export function simularAno(v: Vida, p: PropriedadeRural18, ano: number, opts: { clima?: ClimaRural18; rr?: Rng; prever?: boolean } = {}): { linhas: AnoRural18['linhas']; receita: number; custo: number; clima: ClimaRural18; talhoes: ReturnType<typeof resultadoDoTalhao>[]; rebanhos: ReturnType<typeof resultadoDoRebanho>[] } {
  const clima = opts.clima ?? climaDoAno(v, p.municipioId, ano);
  const rr = opts.rr ?? rngDe(v.id, 'fazenda18', p.id, ano);
  const comp = tocadaPorVoce(v) === p.id ? competencia(v) : 45;
  const linhas: AnoRural18['linhas'] = [];
  if (p.uso === 'arrendada') {
    const rec = p.arrendamento?.sentido === 'recebo' ? p.arrendamento.valorAno : 0;
    linhas.push({ oque: 'Arrendamento recebido', receita: rec, custo: 0 });
    for (const f of custosFixos(v, p, ano).filter(x => x.oque.startsWith('ITR'))) linhas.push({ oque: f.oque, receita: 0, custo: f.custo });
    return { linhas, receita: rec, custo: linhas.reduce((s, l) => s + l.custo, 0), clima, talhoes: [], rebanhos: [] };
  }
  const talhoes = p.talhoes.map(t => {
    const k = CULTURAS18[t.cultura];
    const risco = k.risco * ((t.repete ?? 0) >= 3 ? 1.5 : 1) * (p.manejo === 'organico' ? 1.15 : 1);
    const praga = opts.prever ? false : rr.chance(risco);
    const res = resultadoDoTalhao(v, p, t, ano, clima, praga, comp);
    linhas.push({ oque: `${k.nome.charAt(0).toUpperCase() + k.nome.slice(1)} · ${fmtHa(t.ha)}`, receita: res.receita, custo: res.custo, nota: res.nota });
    return res;
  });
  const rebanhos = p.rebanhos.map(rb => {
    const surto = opts.prever ? false : rr.chance(0.06 * (1.5 - rb.sanidade / 100) * (rb.cabecas > tetoDaEstrutura(p, rb.especie) ? 1.6 : 1));
    const res = resultadoDoRebanho(v, p, rb, ano, clima, surto, comp);
    linhas.push({ oque: `${REBANHOS18[rb.especie].nome.charAt(0).toUpperCase() + REBANHOS18[rb.especie].nome.slice(1)} · ${rb.cabecas.toLocaleString('pt-BR')} ${REBANHOS18[rb.especie].unidade}`, receita: res.receita, custo: res.custo, nota: res.nota });
    return res;
  });
  if (p.uso !== 'producao') {
    // Residência ou investimento: a terra parada não produz; a casa e as estruturas custam.
    linhas.length = 0;
  }
  for (const f of custosFixos(v, p, ano)) linhas.push({ oque: f.oque, receita: 0, custo: f.custo });
  const receita = linhas.reduce((s, l) => s + l.receita, 0);
  const custo = linhas.reduce((s, l) => s + l.custo, 0);
  return { linhas, receita, custo, clima, talhoes, rebanhos };
}

export const fmtHa = (ha: number) => `${ha.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`;

/** O pró-labore do produtor que toca esta propriedade (o salário que já cai como renda do trabalho, no ano). */
function proLaboreAnual(v: Vida, p: PropriedadeRural18): number {
  if (tocadaPorVoce(v) !== p.id) return 0;
  return Math.round((v.trabalho.atual?.salario ?? 0) * 12);
}

/** Aplica o ano: dinheiro (uma vez), solo, rebanho, talhões, valor, história. Idempotente por `ultimoAno`. */
export function viverAnoDaPropriedade(v: Vida, p: PropriedadeRural18, imovel: Imovel | undefined, ano: number): AnoRural18 | undefined {
  if (p.ultimoAno >= ano) return undefined;
  const rr = rngDe(v.id, 'fazenda18', p.id, ano);
  const s = simularAno(v, p, ano, { rr });
  // O pró-labore de quem toca a terra sai do lucro dela: o que passa dele entra como resultado; o prejuízo pesa inteiro.
  const pl = Math.min(proLaboreAnual(v, p), Math.max(0, s.receita - s.custo));
  const linhas = [...s.linhas];
  if (pl > 0) linhas.push({ oque: 'Seu pró-labore (já recebido como renda do trabalho)', receita: 0, custo: pl });
  const receita = s.receita;
  const custo = s.custo + pl;
  const resultado = receita - custo;
  v.financas.conta = Math.round(v.financas.conta + resultado);
  lancar(v, `Resultado: ${p.nome}`, resultado >= 0 ? 'renda' : 'despesa', resultado);
  // O chão: rotação, monocultura, orgânico, pasto lotado.
  if (p.uso === 'producao') {
    const novos: Talhao18[] = [];
    p.talhoes.forEach((t, k) => {
      const kk = CULTURAS18[t.cultura];
      const res = s.talhoes[k];
      if (kk.ciclo === 'anual') {
        const g = grupo(t.cultura);
        // A safrinha de milho depois da soja já é rotação (gramínea depois de leguminosa, no mesmo ano).
        t.repete = t.safrinha ? 1 : t.antes === g ? (t.repete ?? 1) + 1 : 1;
        t.antes = t.safrinha ? 'graminea' : g;
        p.solo = clamp(p.solo + (t.repete >= 3 ? -0.8 : g === 'leguminosa' ? 0.4 : -0.2) * t.ha / Math.max(1, areaUtil(p)) * 3, 10, 98);
      }
      // A floresta cortada libera o chão; o café velho, também.
      const fim = (kk.ciclo === 'florestal' && res?.colheu) || ((kk.ciclo === 'perene' || kk.ciclo === 'semiperene') && ano - t.ano >= (kk.vidaUtil ?? 99));
      if (!fim) novos.push(t);
    });
    p.talhoes = novos;
    if (p.manejo === 'organico') p.solo = clamp(p.solo + 0.8, 10, 98);
    const lot = uaOcupadas(p) / Math.max(1, capacidadeUA(p));
    if (lot > 1.1) p.solo = clamp(p.solo - (lot - 1) * 4, 10, 98);
    p.rebanhos.forEach((rb, k) => { const res = s.rebanhos[k]; if (!res) return; rb.cabecas = res.cabecas; rb.sanidade = res.sanidade; rb.genetica = clamp(rb.genetica + (rb.estrategia === 'crescer' ? 0.6 : 0.3)); });
    p.rebanhos = p.rebanhos.filter(rb => rb.cabecas > 0);
    for (const cav of p.cavalos ?? []) envelhecerCavalo(cav, ano);
  }
  // A terra valoriza (ou não) com o mercado da região.
  const vr = rngDe('terra18', regiaoRural(p.municipioId), ano).normal() * 0.04 + 0.03;
  p.valorHa = Math.round(p.valorHa * (1 + vr) / 10) * 10;
  const registro: AnoRural18 = { ano, clima: s.clima.tipo, receita, custo, resultado, linhas };
  p.historico.push(registro);
  if (p.historico.length > 25) p.historico.splice(0, p.historico.length - 25);
  p.ultimoAno = ano;
  if (p.arrendamento && p.arrendamento.ate <= ano) acabarArrendamento(v, p);
  sincronizarValor(v, imovel);
  return registro;
}

function envelhecerCavalo(c: CavaloDeCorrida18, ano: number): void {
  const idadeC = ano - c.nasc;
  if (idadeC >= 8 && !c.aposentado) c.aposentado = true;
  c.forma = clamp(Math.round(55 + (idadeC >= 3 && idadeC <= 5 ? 10 : 0) - (idadeC >= 7 ? 10 : 0)));
}

function acabarArrendamento(v: Vida, p: PropriedadeRural18): void {
  const a = p.arrendamento!;
  if (a.sentido === 'pago') {
    // O contrato acabou: a terra volta para o dono (o rebanho e as máquinas que eram seus voltam com você? ficam vendidos).
    const st = estado18(v);
    const rebanho = valorDoRebanho(p) + valorDasMaquinas(p, anoDe(v.t));
    if (rebanho > 0) { v.financas.conta += Math.round(rebanho * 0.92); lancar(v, `Venda do rebanho e das máquinas: ${p.nome}`, 'renda', Math.round(rebanho * 0.92)); }
    st.arrendadas = st.arrendadas.filter(x => x.id !== p.id);
    escrever(v, { texto: `O arrendamento ${p.nome.startsWith('Sítio') ? 'do' : 'da'} ${p.nome} venceu e não foi renovado. A terra voltou para o dono.`, relevancia: 'biografia', tema: 'trabalho' });
  } else {
    p.arrendamento = undefined;
    p.uso = 'investimento';
    escrever(v, { texto: `O contrato de arrendamento ${p.nome.startsWith('Sítio') ? 'do' : 'da'} ${p.nome} terminou. A terra está de volta nas suas mãos — parada, por enquanto.`, relevancia: 'cotidiano', tema: 'dinheiro' });
  }
}

/** O ano de todas as propriedades (chamado pelo ano da vida). */
export function processarFazendas18(v: Vida): void {
  normalizarRural18(v);
  const ano = anoDe(v.t) - 1;
  const lista = todasAsPropriedades(v);
  if (!lista.length) return;
  // A terra herdada que ainda não teve destino: a vida pergunta (`rural18_herdou`).
  if (lista.some(x => x.imovel?.herdado && x.p.origem !== 'antigo' && v.fatos[`rural18_decidiu_${x.imovel.id}`] === undefined) && idade(v) >= 18) v.fatos['rural18_herdou'] = v.t;
  let total = 0;
  const bons: string[] = [], ruins: string[] = [];
  for (const { p, imovel } of lista) {
    const a = viverAnoDaPropriedade(v, p, imovel, ano);
    if (!a) continue;
    total += a.resultado;
    if (a.resultado > 0 && a.receita > 0) bons.push(p.nome); else if (a.resultado < 0 && p.uso === 'producao') ruins.push(p.nome);
  }
  if (!bons.length && !ruins.length) return;
  const clima = climaDoAno(v, lista[0].p.municipioId, ano);
  escrever(v, {
    texto: `O ano no campo (${ano}): ${clima.texto} ${total >= 0 ? `As propriedades fecharam com ${fmt(total)} de resultado.` : `As propriedades fecharam no vermelho: ${fmt(-total)}.`}`,
    relevancia: Math.abs(total) > 200000 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: total >= 0 ? 'bom' : 'ruim'
  });
  if (ruins.length && total < 0) v.fatos['rural18_prejuizo'] = v.t;
}

/** O resumo para as telas: área, uso, valor, o último ano. */
export function resumoDaPropriedade(v: Vida, p: PropriedadeRural18) {
  const ano = anoDe(v.t);
  return {
    util: areaUtil(p), plantada: areaPlantada(p), pasto: areaPasto(p), livre: areaLivre(p), reserva: reservaLegal(p.municipioId),
    capacidadeUA: capacidadeUA(p), ua: Math.round(uaOcupadas(p)), irrigaveis: haIrrigaveis(p), tecnologia: tecnologia(p),
    valor: valorDaPropriedade(p, ano), terra: Math.round(p.valorHa * p.ha), estruturas: valorDasEstruturas(p, ano), maquinas: valorDasMaquinas(p, ano), rebanho: valorDoRebanho(p),
    ultimo: p.historico[p.historico.length - 1], previsao: simularAno(v, p, ano, { prever: true, clima: { tipo: 'normal', texto: '', severidade: 0 } }),
    tocadaPorVoce: tocadaPorVoce(v) === p.id, regiao: regiaoRural(p.municipioId)
  };
}

export { idade };

/* ================================================================== Saves antigos */

/**
 * O sítio comprado antes da VIDA 18 (o modelo `sitio`, sem área nem lavoura) vira uma propriedade de verdade: 8 ha, a
 * casa (velha, já depreciada) e a terra com o valor que sobra — o valor do imóvel não muda. Idempotente: só mexe em
 * quem não tem `rural`; nos que têm, completa os campos que faltarem.
 */
export function normalizarRural18(v: Vida): void {
  const ano = anoDe(v.t);
  const alvo = [...v.financas.bens, ...Object.values(v.pessoas ?? {}).flatMap(p => p.posses?.bens ?? [])];
  for (const b of alvo) {
    if (b.tipo !== 'imovel') continue;
    if (b.rural) { completar(b.rural, ano); continue; }
    if (b.modeloId !== 'sitio') continue;
    const r = rngDe('normalizar18', b.id);
    const ha = 8;
    const p: PropriedadeRural18 = {
      id: `pr-${b.id}`, tipo: 'sitio', nome: b.nome === 'sítio' ? 'o sítio' : b.nome, ha, municipioId: b.municipioId,
      solo: clamp(Math.round(55 + r.normal() * 10), 30, 85), agua: 60, relevo: 'ondulado', valorHa: 0, uso: v.moradia.imovelId === b.id ? 'residencia' : 'investimento',
      manejo: 'convencional', foco: 'equilibrio', talhoes: [], rebanhos: [], estruturas: [{ id: 'sede', n: 1, t: Math.min(b.tCompra, v.t) - 12 * 40 }], maquinas: [], historico: [], ultimoAno: ano - 1, origem: 'antigo'
    };
    const casa = valorDasEstruturas(p, ano);
    p.valorHa = Math.max(500, Math.round((b.valor - casa) / ha / 10) * 10);
    // Quem já vivia de produzir na própria terra: a produção que a carreira dizia (`VidaRural.cultura`) vira lavoura e criação.
    const ru = v.caminhos.rural;
    if (v.financas.bens.includes(b) && ru?.terra === 'propria' && produtorRural(v) && !v.financas.bens.some(x => x !== b && x.tipo === 'imovel' && x.rural?.uso === 'producao')) {
      p.uso = 'producao';
      const t = (cultura: CulturaId, h: number) => p.talhoes.push({ id: `t-${b.id}-${cultura}`, cultura, ha: h, ano: ano - (CULTURAS18[cultura].ciclo === 'anual' ? 0 : 6) });
      const rb = (especie: EspecieRural, n: number) => p.rebanhos.push({ especie, cabecas: n, genetica: 45, sanidade: 60, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' });
      if (ru.cultura === 'horta') t('horta', 1.5);
      else if (ru.cultura === 'leite') rb('leite', 10);
      else if (ru.cultura === 'lavoura') { t('milho', 3); t('feijao', 2); }
      else { t('milho', 2); rb('galinhas', 40); rb('leite', 4); }
      if (ru.cooperativa) p.cooperativa = true;
    }
    b.rural = p;
    sincronizarValor(v, b);
  }
  if (v.rural18) { v.rural18.arrendadas ??= []; for (const p of v.rural18.arrendadas) completar(p, ano); }
}
function completar(p: PropriedadeRural18, ano: number): void {
  p.talhoes ??= []; p.rebanhos ??= []; p.estruturas ??= []; p.maquinas ??= []; p.historico ??= [];
  p.uso ??= 'producao'; p.manejo ??= 'convencional'; p.foco ??= 'equilibrio';
  if (typeof p.ultimoAno !== 'number') p.ultimoAno = ano - 1;
}
