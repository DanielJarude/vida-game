/**
 * ERAS v3 · A SOCIEDADE DA ÉPOCA — as regras de direitos e as guerras, lidas por país (o Brasil em `regrasBR`; os outros
 * nos pacotes). Só leitura e funções puras: o ano histórico (`eras/v3/sociedade`) escreve na vida; os sistemas (o
 * casamento, a política, o corpo) perguntam aqui.
 */
import type { Vida } from '../../tipos';
import { GUERRAS_BR, REGRAS_BR } from './regrasBR';
import { pacoteDaEra, type GuerraDaEpoca, type LadoDaDivisao, type RegraSocial } from './pacote';
import { ladoHistoricoCorrente, mesHistoricoCorrente, paisHistoricoCorrente } from './moedas';

export const regrasDoPais = (pais: string): readonly RegraSocial[] => (pais === 'BR' ? REGRAS_BR : pacoteDaEra(pais)?.regras ?? []);
export const guerrasDoPais = (pais: string): readonly GuerraDaEpoca[] => (pais === 'BR' ? GUERRAS_BR : pacoteDaEra(pais)?.guerras ?? []);

/** A regra vale no ano, no lugar (divisão), no lado do país? */
export function regraValeEm(r: RegraSocial, ano: number, divisao?: string, lado: LadoDaDivisao = 'oeste'): boolean {
  if (ano < r.de || (r.ate !== undefined && ano >= r.ate)) return false;
  if (r.divisoes && (!divisao || !r.divisoes.includes(divisao))) return false;
  if (r.lado && r.lado !== lado) return false;
  return true;
}

/** A primeira regra do tema que vale agora (para a vida histórica em processamento). */
export function regraVigente(tema: RegraSocial['tema'], ano: number, divisao?: string, cargo?: string): RegraSocial | undefined {
  if (mesHistoricoCorrente() === null) return undefined;
  const pais = paisHistoricoCorrente(), lado = ladoHistoricoCorrente();
  return regrasDoPais(pais).find(r => r.tema === tema && regraValeEm(r, ano, divisao, lado) && (!cargo || !r.cargos || r.cargos.includes(cargo)));
}

/** A guerra em curso no mês, para o país (e o lado) da vida histórica em processamento. */
export function guerraEmCurso(t: number): GuerraDaEpoca | undefined {
  if (mesHistoricoCorrente() === null) return undefined;
  const pais = paisHistoricoCorrente(), lado = ladoHistoricoCorrente();
  return guerrasDoPais(pais).find(g => t >= g.de[0] * 12 + g.de[1] - 1 && t <= g.ate[0] * 12 + g.ate[1] - 1 && (!g.lado || g.lado === lado));
}

/**
 * O risco de uma pessoa do mundo (o pai, o irmão, o filho, o companheiro) morrer na guerra neste ano: a fração convocada
 * × a letalidade histórica, dividida pelos anos da guerra (o risco total da guerra é o histórico). Só homens na idade
 * (e mulheres onde houve convocação). Vida contemporânea: 0.
 */
export function riscoDeGuerraDaPessoa(t: number, idade: number, genero: string): { risco: number; guerra?: GuerraDaEpoca } {
  const g = guerraEmCurso(t);
  if (!g) return { risco: 0 };
  if (idade < g.idades[0] || idade > g.idades[1]) return { risco: 0 };
  if (genero !== 'masculino' && !g.mulheres) return { risco: 0 };
  const anos = Math.max(1, (g.ate[0] * 12 + g.ate[1] - (g.de[0] * 12 + g.de[1])) / 12);
  return { risco: g.alcance * g.letalidade / anos, guerra: g };
}

/** Os anos de vida que contam para uma regra que pesa numa idade (o voto aos 21, a escola aos 7). */
export const idadeDe = (v: Vida) => Math.floor((v.t - v.eu.tNasc) / 12);

/**
 * ERAS v3 · QUEM CHEGAVA À UNIVERSIDADE: a taxa bruta de matrícula no ensino superior (% da faixa de idade), por país e ano.
 * APROXIMAÇÃO [A] a partir de Barro & Lee (2013, "A new data set of educational attainment", com as séries longas de 1870 em
 * diante) e da UNESCO UIS (taxa bruta de matrícula no ensino superior, desde 1970); pontos de 10 em 10 anos, interpolados.
 */
const SUPERIOR: Readonly<Record<string, readonly [number, number][]>> = {
  BR: [[1900, 0.5], [1930, 1], [1950, 1.5], [1960, 2], [1970, 5], [1980, 11], [1990, 11], [2000, 16], [2010, 37], [2020, 55]],
  US: [[1900, 2], [1920, 5], [1940, 9], [1950, 15], [1960, 30], [1970, 48], [1980, 53], [1990, 72], [2000, 68], [2010, 90], [2020, 88]],
  GB: [[1900, 1], [1920, 2], [1940, 2.5], [1950, 3.5], [1960, 5], [1970, 14], [1980, 19], [1990, 30], [2000, 58], [2010, 59], [2020, 69]],
  JP: [[1900, 0.5], [1920, 2], [1940, 3], [1950, 5], [1960, 10], [1970, 17], [1980, 31], [1990, 29], [2000, 49], [2010, 58], [2020, 64]],
  DE: [[1900, 1], [1920, 2], [1940, 2], [1950, 4], [1960, 7], [1970, 14], [1980, 26], [1990, 34], [2000, 50], [2010, 57], [2020, 73]],
  AR: [[1945, 4], [1950, 5], [1960, 11], [1970, 14], [1980, 22], [1990, 38], [2000, 53], [2010, 75], [2020, 95]]
};
export function taxaDoSuperior(pais: string, ano: number): number | undefined {
  const s = SUPERIOR[pais];
  if (!s) return undefined;
  if (ano <= s[0][0]) return s[0][1];
  for (let i = 1; i < s.length; i++) if (ano <= s[i][0]) { const [a, x] = s[i - 1], [b, y] = s[i]; return x + (y - x) * (ano - a) / (b - a); }
  return s[s.length - 1][1];
}
/** O quanto a universidade estava ao alcance, perto do de hoje (1 na vida contemporânea e depois de 2020). */
export function fatorDoSuperior(): number {
  const t = mesHistoricoCorrente();
  if (t === null) return 1;
  const pais = paisHistoricoCorrente(), ano = Math.floor(t / 12);
  const agora = taxaDoSuperior(pais, ano), hoje = taxaDoSuperior(pais, 2020);
  return agora === undefined || hoje === undefined ? 1 : Math.min(1, agora / hoje);
}
