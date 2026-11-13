/**
 * ERAS HISTÓRICAS · AS COISAS DA ÉPOCA — o mesmo catálogo (`dados/coisas`), lido no ano da vida.
 *
 * Nada de catálogo paralelo: cada coisa que muda com o tempo diz (a) de que tecnologia depende (`eras/base/tecnologias`)
 * e (b) como se chamava e era antes de virar o que é hoje — o videogame de cartucho, a TV de tubo, a câmera de filme.
 * O efeito no jogo (o que ajuda, o lazer, o alívio) é o mesmo: muda o objeto, não a mecânica.
 *
 * PREÇO RELATIVO (APROXIMAÇÃO DE JOGO, documentada): o preço de referência é em reais de hoje; uma tecnologia nova era
 * proporcionalmente muito mais cara. Enquanto ela é novidade de quem tem renda alta, custa 2,5 vezes a referência; até
 * virar coisa de todo mundo, 1,5 vez; depois, a referência. Não é preço histórico de catálogo — é a curva de adoção
 * convertida em esforço.
 *
 * MARCAS E LOJAS: só as que ainda não existiam (ou não vendiam no Brasil) no ano saem da vitrine (`MARCAS_DESDE`).
 */

import type { Coisa } from '../../dados/coisas';
import type { Vida } from '../../tipos';
/** O ano civil de um instante (sem importar `tempo`: a base histórica não depende de nenhum pacote de cima). */
const anoDe = (t: number) => Math.floor(t / 12);
import { tecnologia, existeNoBrasil, anoNoBrasil, nomeDaTecnologia } from './contexto';
import { TECNOLOGIA_POR_ID } from './tecnologias';

interface Fase { ate: number; nome?: string; descricao?: string; tec?: string }
interface CoisaNaEpoca { tec?: string; desde?: number; fases?: Fase[] }

export const COISAS_NA_EPOCA: Readonly<Record<string, CoisaNaEpoca>> = {
  celular_simples: { tec: 'celular', fases: [{ ate: 2009, nome: 'telefone celular', descricao: 'Liga, recebe ligação e, nos mais novos, manda torpedo. Bateria de dias, tela pequena.' }] },
  celular_bom: { tec: 'smartphone' },
  celular_topo: { tec: 'smartphone' },
  notebook: { tec: 'notebook', fases: [{ ate: 2005, descricao: 'Pesado, bateria de duas horas — e o preço de um carro usado.' }] },
  computador: { tec: 'computador', fases: [
    { ate: 1993, nome: 'microcomputador', descricao: 'Teclado, disquete, monitor de fósforo verde ou colorido: programar em BASIC e jogar o que coubesse na memória.' },
    { ate: 2006, nome: 'computador de mesa', descricao: 'Monitor de tubo, gabinete com gravador de CD, internet pela linha do telefone.' }
  ] },
  tablet: { tec: 'tablet' },
  videogame: { fases: [
    { ate: 1995, tec: 'videogame_cartucho', nome: 'videogame de cartucho', descricao: 'Console da época, dois controles com fio e a caixa de cartuchos.' },
    { ate: 2012, tec: 'videogame_disco', nome: 'videogame de CD', descricao: 'Console da época, memory card e uma pilha de jogos em disco.' }
  ], tec: 'videogame_atual' },
  tv: { fases: [{ ate: 2008, tec: 'tv_cores', nome: 'TV de tubo grande', descricao: 'Tela pesada de 29 polegadas, controle remoto e antena no telhado.' }], tec: 'tv_tela_fina' },
  tv_oled: { desde: 2013 },
  projetor: { desde: 2005 },
  home_theater: { tec: 'dvd' },
  camera: { fases: [{ ate: 2004, tec: 'camera_filme', nome: 'câmera fotográfica de filme', descricao: 'Filme de 36 poses, lente boa e o laboratório para revelar.' }], tec: 'camera_digital' },
  caixa_som: { fases: [
    { ate: 1996, tec: 'toca_fitas', nome: 'aparelho de som com toca-fitas', descricao: 'Rádio, toca-fitas duplo e duas caixas: gravar a fita do amigo em casa.' },
    { ate: 2008, tec: 'cd', nome: 'som com CD', descricao: 'CD, rádio e fita num aparelho só; o fone com fio para a rua.' }
  ] },
  aspirador_robo: { desde: 2010 },
  cooktop_forno: { desde: 2008 },
  geladeira_inox: { desde: 2005 },
  cafeteira: { desde: 2008 },
  controladora_dj: { desde: 2006 },
  home_studio: { desde: 2000 },
  lareira: { desde: 2008 },
  adega: { desde: 2000 }
};

function fase(c: CoisaNaEpoca, ano: number): Fase | undefined {
  return c.fases?.find(f => ano <= f.ate);
}

/** A tecnologia de que a coisa depende no ano (ou nenhuma). */
export function tecnologiaDaCoisa(id: string, ano: number): string | undefined {
  const c = COISAS_NA_EPOCA[id];
  return c ? fase(c, ano)?.tec ?? c.tec : undefined;
}

const memo = new Map<string, Coisa>();
/** A coisa como ela era no ano (nome e descrição da época). Sem mudança: a mesma coisa. */
export function coisaNoAno(c: Coisa, ano: number): Coisa {
  const e = COISAS_NA_EPOCA[c.id];
  const f = e && fase(e, ano);
  if (!f || (!f.nome && !f.descricao)) return c;
  const k = `${c.id}:${f.ate}`;
  let x = memo.get(k);
  if (!x) { x = { ...c, ...(f.nome ? { nome: f.nome } : {}), ...(f.descricao ? { descricao: f.descricao } : {}) }; memo.set(k, x); }
  return x;
}

/** Vida histórica: a coisa existe para esta pessoa agora? (o motivo, quando não) */
export function motivoSemCoisa(v: Vida, id: string): string | undefined {
  if (!v.era) return undefined;
  const ano = anoDe(v.t);
  const e = COISAS_NA_EPOCA[id];
  if (!e) return undefined;
  if (e.desde !== undefined && ano < e.desde) return `Ainda não se vende no Brasil (só por volta de ${e.desde}).`;
  const tec = tecnologiaDaCoisa(id, ano);
  if (!tec) return undefined;
  if (!existeNoBrasil(v, tec)) {
    const x = TECNOLOGIA_POR_ID.get(tec);
    return x?.fim !== undefined && ano >= x.fim ? `Já saiu de linha: ${nomeDaTecnologia(tec)} ficou no passado.` : `Ainda não existe no Brasil (${nomeDaTecnologia(tec)}: por volta de ${anoNoBrasil(tec)}).`;
  }
  if (tecnologia(v, tec) === 'indisponivel') return `Por enquanto, ${nomeDaTecnologia(tec)} é coisa de quem tem muito dinheiro.`;
  return undefined;
}

/** O multiplicador de preço da época (ver o cabeçalho). Vida contemporânea: 1. */
export function fatorDePrecoDaEpoca(v: Vida, id: string): number {
  if (!v.era) return 1;
  const ano = anoDe(v.t);
  const tec = tecnologiaDaCoisa(id, ano);
  const x = tec ? TECNOLOGIA_POR_ID.get(tec) : undefined;
  if (!x) return 1;
  if (ano < x.popular) return 2.5;
  if (ano < x.massa) return 1.5;
  return 1;
}

/**
 * Marcas e lojas que ainda não existiam no Brasil no ano (só as de data conhecida; as demais ficam como estão).
 * Fontes: históricos institucionais das empresas e imprensa da época. A reserva de mercado de informática (Lei 7.232/1984)
 * restringiu a importação de computadores até 1991/1992.
 */
export const MARCAS_DESDE: Readonly<Record<string, number>> = {
  xiaomi: 2019, lg: 1995, lenovo: 2005, dell: 1999, garmin: 2000, nintendo: 1993, chilli: 1997, decathlon: 2001, uniqlo: 2020,
  zara: 1999, hm: 2025, westwing: 2012, apple: 1992, genericos: 1992,
  amazon: 2012, mercadolivre: 1999, aliexpress: 2010, farfetch: 2008, zalando: 2008
};

/** A marca ou a loja já existe no ano desta vida (vida contemporânea: sempre). */
export function marcaExisteNoAno(v: Vida, id: string): boolean {
  if (!v.era) return true;
  const d = MARCAS_DESDE[id];
  return d === undefined || anoDe(v.t) >= d;
}
