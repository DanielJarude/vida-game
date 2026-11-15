/**
 * ERAS HISTÓRICAS · AS CIDADES NO TEMPO — o transporte sobre trilhos das capitais (o que mais muda a vida sem carro).
 * Datas da operação comercial do primeiro trecho (fontes: companhias operadoras — Metrô-SP, MetrôRio, CBTU, Trensurb,
 * Metrô-DF, CCR Metrô Bahia, Metrofor; 'aproximado' = o mês não é seguro). Antes da data, o "transporte bom" da metrópole
 * é o de ônibus: médio. Bondes e trens de subúrbio antigos ficam fora (limitação documentada).
 */
const anoDe = (t: number) => Math.floor(t / 12);
import { mesHistoricoCorrente } from './moedas';

export interface Trilho { cidade: string; nome: string; de: [number, number]; certeza: 'documentado' | 'aproximado' }

export const TRILHOS_BR: readonly Trilho[] = [
  { cidade: 'sao-paulo-sp', nome: 'o metrô', de: [1974, 9], certeza: 'documentado' },
  { cidade: 'rio-de-janeiro-rj', nome: 'o metrô', de: [1979, 3], certeza: 'documentado' },
  { cidade: 'porto-alegre-rs', nome: 'o trem metropolitano (Trensurb)', de: [1985, 3], certeza: 'documentado' },
  { cidade: 'recife-pe', nome: 'o metrô', de: [1985, 3], certeza: 'aproximado' },
  { cidade: 'belo-horizonte-mg', nome: 'o metrô', de: [1986, 8], certeza: 'documentado' },
  { cidade: 'brasilia-df', nome: 'o metrô', de: [2001, 3], certeza: 'aproximado' },
  { cidade: 'fortaleza-ce', nome: 'o metrô (linha Sul)', de: [2014, 6], certeza: 'aproximado' },
  { cidade: 'salvador-ba', nome: 'o metrô', de: [2014, 6], certeza: 'documentado' }
];
const POR_CIDADE = new Map(TRILHOS_BR.map(x => [x.cidade, x]));
const tDe = (x: [number, number]) => x[0] * 12 + x[1] - 1;

export const trilhoDaCidade = (id: string) => POR_CIDADE.get(id);

/** Na vida histórica em processamento, a cidade ainda não tem o trilho que tem hoje? (o ano em que vai abrir) */
export function trilhoAindaNaoAbriu(id: string): number | undefined {
  const t = mesHistoricoCorrente();
  const x = POR_CIDADE.get(id);
  if (t === null || !x) return undefined;
  return t < tDe(x.de) ? x.de[0] : undefined;
}
export const anoDoTrilho = (id: string) => { const x = POR_CIDADE.get(id); return x ? anoDe(tDe(x.de)) : undefined; };
