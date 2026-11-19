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
  // ERAS v4: a regra que uma reforma desta continuidade derrubou antes da data real já não vale (aqui, desde então).
  if (regraDerrubadaAntes(r.id, ano * 12 + 6)) return false;
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

export { taxaDoSuperior } from './sociedade4';
import { taxaDoSuperior, instituidoAqui, regraDerrubadaAntes } from './sociedade4';

/** O quanto a universidade estava ao alcance, perto do de hoje (1 na vida contemporânea e depois de 2020). */
export function fatorDoSuperior(): number {
  const t = mesHistoricoCorrente();
  if (t === null) return 1;
  const pais = paisHistoricoCorrente(), ano = Math.floor(t / 12);
  // ERAS v4: a escola ampliada antes da hora (uma reforma desta continuidade) adianta o acesso: a taxa de dez anos depois.
  const agora = taxaDoSuperior(pais, instituidoAqui('escola', t) ? Math.min(2020, ano + 10) : ano), hoje = taxaDoSuperior(pais, 2020);
  return agora === undefined || hoje === undefined ? 1 : Math.min(1, agora / hoje);
}
