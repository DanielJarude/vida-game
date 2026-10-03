/**
 * Onde a vida está no mundo. TRÊS PERGUNTAS DIFERENTES:
 *   - onde nasceu      → o país da cidade natal (não muda nunca);
 *   - de onde é        → as nacionalidades (mudam só por naturalização);
 *   - onde mora        → o país da moradia (muda numa migração).
 * Ninguém deriva uma da outra fora daqui.
 */

import type { Pessoa, Vida } from '../tipos';
import { existeMunicipio, paisDaCidade } from '../dados/lugares';
import { PAIS_PADRAO, perfilDoPais, temPerfil } from './registro';
import { definirPaisCorrente } from './moeda';
import type { PerfilDePais } from './tipos';
import { nacionalidadesAoNascer } from './cidadania';

/** O país onde a pessoa mora. */
export const paisDaVida = (v: Vida): string => paisDaCidade(v.moradia.municipioId);
/** O país onde nasceu. */
export const paisNatal = (v: Vida): string => paisDaCidade(v.eu.municipioNatal);
/** As nacionalidades (a primeira, a de nascença). */
export const nacionalidadesDaVida = (v: Vida): string[] => (v.eu.nacionalidades?.length ? v.eu.nacionalidades : [paisNatal(v)]);
export const temNacionalidade = (v: Vida, pais: string) => nacionalidadesDaVida(v).includes(pais);

/** As instituições do lugar onde a pessoa mora (escola, trabalho, política, saúde...). */
export const perfilDaVida = (v: Vida): PerfilDePais => perfilDoPais(paisDaVida(v));

/** Uma pessoa do mundo: onde mora e de onde é. */
export const paisDaPessoa = (p: Pessoa): string => (existeMunicipio(p.municipioId) ? paisDaCidade(p.municipioId) : PAIS_PADRAO);
export function nacionalidadesDaPessoa(p: Pessoa): string[] {
  if (p.nacionalidades?.length) return p.nacionalidades;
  // Sem o campo: a do país onde nasceu; sem a cidade natal, a do país onde mora (quem nasceu no mundo do jogo nasceu
  // onde a família morava — e quem mudou de país depois teve a nacionalidade gravada na mudança).
  const lugar = p.municipioNatal && existeMunicipio(p.municipioNatal) ? p.municipioNatal : existeMunicipio(p.municipioId) ? p.municipioId : undefined;
  return [lugar ? paisDaCidade(lugar) : PAIS_PADRAO];
}

/** Os blocos de livre circulação de um país. */
export const blocosDoPais = (pais: string): string[] => (temPerfil(pais) ? perfilDoPais(pais).migracao.blocos : []);

/** A pessoa (por alguma nacionalidade) circula livremente até este país? */
export function circulaLivre(nacionalidades: string[], destino: string): boolean {
  const blocos = blocosDoPais(destino);
  return nacionalidades.some(n => n === destino || blocosDoPais(n).some(b => blocos.includes(b)));
}

/** As línguas que a pessoa fala: a da terra onde nasceu e as que aprendeu. */
export function linguasDaPessoa(v: Vida): string[] {
  const natal = paisNatal(v);
  const casa = temPerfil(natal) ? perfilDoPais(natal).idiomas[0] : 'português';
  return [...new Set([casa, ...(v.mundo?.idiomas ?? [])])];
}

/** Fala a língua do dia a dia do país onde mora? */
export const falaALingua = (v: Vida): boolean => linguasDaPessoa(v).includes(perfilDaVida(v).idiomas[0]);

/**
 * O peso de ter chegado há pouco (para uma vaga, para uma entrevista): sem a
 * língua e sem rede, a mesma pessoa é menos chamada. Some com a adaptação.
 */
export function penaDeChegada(v: Vida): number {
  const a = v.mundo?.adaptacao;
  if (a === undefined) return 0;
  return ((falaALingua(v) ? 0 : 0.14) + 0.05) * (1 - a / 100);
}

/**
 * A escola do país onde a pessoa mora, em palavras: o exame que abre a
 * universidade ("o ENEM", "a EBAU", "o gaokao"), o sistema de vagas, a bolsa
 * e o crédito públicos. As telas e os textos falam por aqui — nunca "ENEM"
 * escrito à mão.
 */
export function educacaoDaVida(v: Vida) {
  const e = perfilDaVida(v).educacao;
  const a = e.exame.artigo;
  const nome = e.exame.nome;
  return {
    ...e,
    nome,
    o: `${a} ${nome}`, O: `${a.toUpperCase()} ${nome}`,
    do: `${a === 'o' ? 'do' : 'da'} ${nome}`, no: `${a === 'o' ? 'no' : 'na'} ${nome}`, No: `${a === 'o' ? 'No' : 'Na'} ${nome}`,
    pelo: `${a === 'o' ? 'pelo' : 'pela'} ${nome}`, para: `para ${a} ${nome}`,
    /** O sistema que distribui as vagas pela nota (no Brasil, o SISU). */
    vagas: e.sistemaDeVagas ?? 'a seleção pela nota',
    aberto: e.ingresso === 'acesso_aberto',
    inst: e.instituicoes ?? {
      universidade: 'a universidade pública', tecnico: 'a escola técnica pública', livre: 'um curso gratuito de formação profissional',
      escolaFundamental: 'escola pública', escolaMedio: 'escola secundária pública', nomeEscolaFundamental: 'Escola Pública', nomeEscolaMedio: 'Escola Secundária'
    }
  };
}

/** O nome de um programa sem artigo ("a bolsa da JASSO" → "bolsa da JASSO"). */
const limpo = (n: string) => n.replace(/^(o|a) /, '');
const feminino = (n: string) => /^(a |bolsa|gratuidade|política|becas?)/i.test(n);
/** "o FIES", "o HECS-HELP", "a bolsa da JASSO". */
export const oPrograma = (n: string) => `${feminino(n) ? 'a' : 'o'} ${limpo(n)}`;
/** "do ProUni", "da bolsa da JASSO". */
export const doPrograma = (n: string) => `${feminino(n) ? 'da' : 'do'} ${limpo(n)}`;

/** Há quantos anos a pessoa mora no país onde está (a vida inteira, para quem nunca saiu). */
export const anosNoPais = (v: Vida): number => Math.floor((v.t - (v.fatos['chegou_pais'] ?? v.eu.tNasc)) / 12);

/**
 * As nacionalidades de quem nasce (filho, neto, irmão), pelo lugar e pelos
 * pais (`mundo/cidadania`). Devolve undefined quando é a de sempre — a do
 * país onde nasce, sozinha —, para não gravar o óbvio.
 */
export function nacionalidadesDoBebe(municipioNatal: string, dosPais: string[][], anosDosPais: number): string[] | undefined {
  const pais = paisDaCidade(municipioNatal);
  const n = nacionalidadesAoNascer(pais, [...new Set(dosPais.flat())], anosDosPais);
  return n.length === 1 && n[0] === pais ? undefined : n;
}

/** O texto e as telas desta vida falam na moeda do país onde ela mora. Quem entra no motor chama. */
export function entrarNaVida(v: Vida): void {
  definirPaisCorrente(paisDaVida(v));
}
