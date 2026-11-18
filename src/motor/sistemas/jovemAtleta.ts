/**
 * VIDA 26 — O JOVEM ATLETA: capacidade atual, potencial e prontidão, separados.
 *
 * Antes, a formação tinha um número só (a técnica) contra uma régua só (a do contrato profissional). Um menino de 12
 * anos com técnica alta no sub-15 ouvia que "já tinha o nível que o contrato profissional pede". Agora a comissão olha
 * três coisas diferentes, todas lidas do estado real:
 *
 *   CAPACIDADE ATUAL  o nível na posição (`atributosEsportivos.nivelNaPosicao`): técnica + corpo de agora (a maturação
 *                     limita força e fôlego do adolescente) + leitura de jogo + cabeça;
 *   POTENCIAL         uma ESTIMATIVA do teto (o mesmo teto que o treino persegue em `frentes.praticar`: a facilidade de
 *                     nascença, a predisposição física, os anos de prática), dita como faixa — larga aos 12, estreita aos
 *                     19. Nunca é mostrada como habilidade adquirida;
 *   PRONTIDÃO         o quanto o atleta está preparado para um ambiente mais exigente (0–100): a técnica contra a régua
 *                     do profissional, o físico de agora contra o do adulto, a experiência competitiva (jogos de
 *                     formação) e a maturidade (os atributos mentais).
 *
 * As etapas também são separadas (`esporte.anoNaBase`): seguir na categoria; jogar acima da idade (a promoção
 * antecipada, rara); treinar com o elenco profissional (a integração gradual, a partir dos 16); o primeiro contrato
 * (Lei 14.597/2023, art. 99: a partir dos 16 anos — no jogo, aos 16 só o excepcional; a regra é 17+); a estreia.
 */
import type { AnoDeFormacao, CarreiraEsportiva, Vida } from '../tipos';
import { idade } from '../nucleo';
import { clamp } from '../rng';
import { aptidao, mesesDePratica } from './frentes';
import { predisposicao } from './predisposicao';
import { CORPO_DO_ATRIBUTO, GRUPO_DO_ATRIBUTO, efeitoDaMente, efeitoDoCorpo, nivelNaPosicao, type AtributoNoPerfil } from './atributosEsportivos';
import { capacidadesDe } from './capacidadesFisicas';

export interface LeituraDoJovem {
  /** O nível na posição agora (0–100). */
  capacidade: number;
  /** O teto estimado, como faixa (mínimo, máximo). */
  potencial: [number, number];
  /** 0–100: a preparação para um ambiente mais exigente. */
  prontidao: number;
  /** As quatro partes da prontidão (0–100 cada), para a tela explicar. */
  partes: { tecnica: number; fisico: number; experiencia: number; maturidade: number };
}

/** O teto que o treino persegue (a mesma conta de `frentes.praticar`), projetado com os anos de prática que ainda virão até os 21. */
export function potencialDe(v: Vida, e: CarreiraEsportiva, h: number): [number, number] {
  const i = idade(v);
  const d = e.modalidade;
  const apt = aptidao(v, d);
  const pred = predisposicao(v, 'fisica');
  const meses = mesesDePratica(v, d) + Math.max(0, 21 - i) * 12;
  const teto = Math.min(97, 70 + apt * 18 + pred * 4 + Math.min(d === 'futebol' ? 7 : 12, meses / 24));
  // A comissão não sabe o teto: estima. Quanto mais novo, mais larga a faixa.
  const incerteza = 2 + Math.max(0, 19 - i) * 1.1;
  const centro = Math.max(h, teto - 1);
  return [Math.round(clamp(Math.max(h, centro - incerteza))), Math.round(clamp(centro + incerteza * 0.6))];
}

export function lerJovem(v: Vida, e: CarreiraEsportiva, h: number, perfil: AtributoNoPerfil[], limiar: number): LeituraDoJovem {
  const i = idade(v);
  const cap = capacidadesDe(v);
  const fisicos = perfil.filter(x => CORPO_DO_ATRIBUTO[x.id]);
  const mentais = perfil.filter(x => GRUPO_DO_ATRIBUTO[x.id] === 'mental');
  const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const anos = Math.max(0, (v.t - e.tInicio) / 12);
  const jogos = (e.formacao ?? []).reduce((s, a) => s + a.jogos, 0);
  const partes = {
    tecnica: clamp(50 + (h - limiar) * 4),
    // O corpo do adulto médio de esporte = 70; o de 12 anos fica muito abaixo, por mais que treine.
    fisico: clamp(70 + media(fisicos.map(x => efeitoDoCorpo(x.id, cap))) * 5),
    experiencia: clamp(jogos / 70 * 100),
    maturidade: clamp(70 + media(mentais.map(x => efeitoDaMente(v, x.id, i, anos))) * 5)
  };
  const prontidao = Math.round(partes.tecnica * 0.45 + partes.fisico * 0.25 + partes.experiencia * 0.15 + partes.maturidade * 0.15);
  return { capacidade: nivelNaPosicao(perfil), potencial: potencialDe(v, e, h), prontidao, partes: { tecnica: Math.round(partes.tecnica), fisico: Math.round(partes.fisico), experiencia: Math.round(partes.experiencia), maturidade: Math.round(partes.maturidade) } };
}

/** A idade mínima do primeiro contrato (Lei 14.597/2023, art. 99: 16 anos) e a do caso comum (17). */
export const IDADE_LEGAL_CONTRATO = 16;

/**
 * Pode receber a proposta do primeiro contrato NESTE ano? A idade (16 só para o excepcional), a técnica (a régua de
 * sempre) e a prontidão (físico, experiência, cabeça). Não garante: a chance continua em `esporte.anoNaBase`.
 */
export function prontoParaContrato(i: number, idadeContrato: [number, number], h: number, limiar: number, l: LeituraDoJovem): boolean {
  if (i < IDADE_LEGAL_CONTRATO || i > idadeContrato[1]) return false;
  if (i < idadeContrato[0]) return h >= limiar + 4 && l.prontidao >= 78;
  return h >= limiar && l.prontidao >= 55;
}

/**
 * O que a comissão diz do ano — frases escolhidas pelos números do ano e da leitura, sem contradição: quem tem técnica
 * de profissional e não tem idade nem físico ouve isso, e não que "já tem o nível do contrato".
 */
export function avaliacaoDaComissao(a: AnoDeFormacao, l: LeituraDoJovem, h: number, limiar: number, podeContrato: boolean, anterior?: AnoDeFormacao, individual = false): string {
  const frases: string[] = [];
  const titularMuito = !individual && a.jogos > 0 && a.titular >= a.jogos * 0.6;
  frases.push(a.nota >= 7.5 ? 'É um dos destaques da categoria' : a.nota >= 6.4 ? 'Evoluiu dentro do esperado' : a.nota >= 5.4 ? 'Oscilou durante o ano' : 'Ficou abaixo do que a categoria pede');
  if (!individual) frases[0] += titularMuito ? ', titular na maior parte dos jogos' : a.jogos > 0 ? ', mais vezes no banco do que em campo' : ', quase sem jogar';
  if (anterior && h - anterior.tecnica >= 3) frases.push('apresenta evolução técnica acima da média');
  if (a.acima) frases.push(a.acima === 'profissional' ? 'treinou com o elenco profissional durante o ano' : `subiu para o ${a.acima} antes da idade`);
  if (l.partes.fisico < 45 && a.idade < 18) frases.push('precisa desenvolver a parte física — vem com o crescimento e o treino');
  else if (l.partes.fisico < 45) frases.push('precisa melhorar a parte física');
  const [lo, hi] = l.potencial;
  if (hi >= limiar + 6 && l.capacidade < limiar - 6) frases.push('tem potencial, mas ainda não o nível que se pede adiante');
  if (h >= limiar && !podeContrato) {
    const falta = [l.partes.fisico < 60 && 'físico', l.partes.experiencia < 50 && 'experiência', l.partes.maturidade < 55 && 'maturidade'].filter(Boolean).join(' e ') || 'regularidade';
    frases.push(a.idade < IDADE_LEGAL_CONTRATO ? `tem técnica acima da idade, mas ainda precisa de ${falta} antes de uma oportunidade profissional (e o contrato só vem a partir dos 16)` : `tem a técnica, mas ainda precisa de ${falta} antes de uma oportunidade profissional`);
  }
  else if (podeContrato) frases.push('a comissão vê condições de oferecer um contrato profissional');
  else if (h >= limiar - 5 && a.idade >= 16) frases.push('está perto da régua do profissional');
  else if (lo >= limiar && a.idade < 16) frases.push('a comissão acredita que pode chegar ao profissional, se continuar evoluindo');
  return `${frases.join('; ')}.`.replace(/^./, c => c.toUpperCase());
}
