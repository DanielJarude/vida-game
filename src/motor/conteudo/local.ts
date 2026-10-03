/**
 * O LUGAR NO TEXTO: o que o conteúdo diz depende do país onde a pessoa mora
 * (`perfilDaVida`). O conteúdo não pergunta "é o Brasil?" — lê o perfil: o
 * nome da previdência, a festa do calendário, o jeito de mandar dinheiro, as
 * cidades para onde se vai. O que o perfil não traz vira a forma genérica.
 */

import type { Vida } from '../tipos';
import { paisDaVida, perfilDaVida } from '../mundo/vida';
import type { PerfilCotidiano } from '../mundo/tipos';
import { paisDoCatalogo } from '../mundo/registro';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { cidadesDoPais, existeMunicipio, grandesCentros, municipio, paisDaCidade, type Municipio } from '../dados/lugares';

/** Os nomes e costumes do dia a dia do país onde a pessoa mora (vazio: tudo genérico). */
export const cotidiano = (v: Vida): PerfilCotidiano => perfilDaVida(v).cotidiano ?? {};

/** O país tem esta festa no calendário (a festa junina da escola, o carnaval de rua)? */
export const temFesta = (v: Vida, festa: 'junina' | 'carnaval' | 'reveillon') => !!cotidiano(v).festas?.includes(festa);

/** "o cartório" / "o registro civil". */
export const registroCivil = (v: Vida) => cotidiano(v).registroCivil ?? 'o registro civil';
/** "nome sujo" (onde se diz assim) ou o cadastro de devedores. */
export const temNomeSujo = (v: Vida) => !!cotidiano(v).nomeSujo;

/** "um Pix" / "uma transferência". */
export const transferencia = (v: Vida) => cotidiano(v).transferencia ?? 'uma transferência';

/** As cidades do país onde a pessoa mora. */
export const cidadesDaVida = (v: Vida): readonly Municipio[] => cidadesDoPais(paisDaVida(v));

/**
 * A previdência pública, nas formas que o texto pede: "o INSS" / "ao INSS" /
 * "do INSS" quando o perfil diz o artigo; senão, "a previdência (Kosei Nenkin)".
 */
export function previdencia(v: Vida) {
  const p = perfilDaVida(v).trabalho.previdencia;
  if (p.artigo === 'o' || p.artigo === 'a') {
    const o = p.artigo === 'o';
    return { o: `${p.artigo} ${p.nome}`, O: `${o ? 'O' : 'A'} ${p.nome}`, do: `${o ? 'do' : 'da'} ${p.nome}`, ao: `${o ? 'ao' : 'à'} ${p.nome}` };
  }
  return { o: `a previdência (${p.nome})`, O: `A previdência (${p.nome})`, do: 'da previdência', ao: `à previdência (${p.nome})` };
}

/** A cidade onde a pessoa mora. */
export const ondeMora = (v: Vida) => municipio(v.moradia.municipioId);

/** "de" + o nome com artigo: "a UPA" → "da UPA", "o pronto-socorro" → "do pronto-socorro". */
export const de = (comArtigo: string) => comArtigo.replace(/^o /, 'do ').replace(/^a /, 'da ').replace(/^os /, 'dos ').replace(/^as /, 'das ');

/**
 * Para onde se muda quem quer ir para longe, DENTRO do país onde mora (outro
 * país é migração, não mudança): a cidade preferida, se for deste país e não
 * for a de agora; senão, um dos grandes centros do país (`grandesCentros`).
 */
export function cidadeLonge(v: Vida, preferida: string): string {
  const pais = paisDaVida(v);
  const aqui = v.moradia.municipioId;
  if (preferida !== aqui && existeMunicipio(preferida) && paisDaCidade(preferida) === pais) return preferida;
  const outra = grandesCentros(pais).find(id => id !== aqui) ?? cidadesDoPais(pais).find(m => m.id !== aqui)?.id;
  return outra ?? aqui;
}

/** Cidades grandes do país onde se mora, fora a de agora (para onde vai a família de um amigo, uma proposta...). */
export const cidadesGrandesLonge = (v: Vida): string[] =>
  cidadesDaVida(v).filter(m => m.id !== v.moradia.municipioId && (m.perfil === 'metropole' || m.capital)).map(m => m.id);

/** A menor unidade de conta no dia a dia, no singular ("real" no Brasil; sem nome no catálogo, "centavo"). */
const UNIDADE: Record<string, string> = { BRL: 'real' };
export const unidadeDeConta = (v: Vida) => UNIDADE[paisDoCatalogo(paisDaVida(v)).moeda] ?? 'centavo';

/**
 * O trabalho é de "setor" (chefia de setor, reunião, hora extra que o setor
 * pede)? Fora disso ficam o campo e o clube, o hospital, a farda, o palco e
 * a universidade — onde essas cenas de escritório não acontecem assim.
 */
const FORA_DO_ESCRITORIO = new Set<string>(['esporte', 'seguranca', 'saude', 'criativo']);
const TRILHAS_FORA_DO_ESCRITORIO = new Set(['academia', 'docencia_superior']);
export function deEscritorio(v: Vida): boolean {
  const e = v.trabalho.atual;
  if (!e) return false;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  return !!oc && !FORA_DO_ESCRITORIO.has(oc.setor) && !TRILHAS_FORA_DO_ESCRITORIO.has(oc.trilha);
}
