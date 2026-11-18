/**
 * VIDA 27 · §14 — no máximo DUAS carreiras profissionais ao mesmo tempo.
 *
 * O que ocupa vaga (a carreira profissional efetivamente ativa):
 *   · o trabalho principal (`trabalho.atual`) — emprego, atleta com contrato, jogador profissional de e-sports, piloto de
 *     Fórmula 1, mandato, o negócio tocado em tempo integral, o ofício por conta;
 *   · a trajetória paralela (`trabalho.paralela`);
 *   · o negócio próprio tocado nas horas vagas (dedicação paralela, não só investimento).
 * O que NÃO ocupa: hobby e atividade da semana (o futebol com os amigos, o boxe por gosto, o videogame), a formação (a
 * base esportiva, o e-sports amador ou competitivo sem salário, o kart e as categorias de base, o estágio, o aprendiz),
 * a carreira pausada, o que já acabou (histórico), o projeto artístico "por fora", a vida política antes do mandato e a
 * vida à margem (não é carreira profissional). Encerrar uma carreira libera a vaga e não apaga nada: o histórico, as
 * temporadas, os títulos, os contratos e o nome continuam onde sempre estiveram.
 */
import type { Vida } from '../tipos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export const LIMITE_DE_CARREIRAS = 2;

export interface CarreiraAtiva { tipo: 'principal' | 'paralela' | 'negocio'; nome: string; ocupacaoId?: string }

const nomeDe = (v: Vida, id: string) => { const oc = ocupacaoOuNula(id); return oc ? (v.eu.genero === 'feminino' ? oc.nome[1] : oc.nome[0]) : id; };
/** Formação, não carreira: o estágio, o aprendiz, quem está no período de formação de um cargo. */
const emFormacao = (contrato: string) => contrato === 'estagio' || contrato === 'aprendiz';

export function carreirasAtivas(v: Vida): CarreiraAtiva[] {
  const out: CarreiraAtiva[] = [];
  const t = v.trabalho;
  if (t.atual && !emFormacao(t.atual.contrato)) out.push({ tipo: 'principal', nome: nomeDe(v, t.atual.ocupacaoId), ocupacaoId: t.atual.ocupacaoId });
  if (t.paralela && !emFormacao(t.paralela.contrato)) out.push({ tipo: 'paralela', nome: nomeDe(v, t.paralela.ocupacaoId), ocupacaoId: t.paralela.ocupacaoId });
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado' && (n.dedicacao ?? 'integral') === 'paralela' && !n.passivo && t.atual?.ocupacaoId !== n.ocupacaoId) out.push({ tipo: 'negocio', nome: n.nome });
  return out;
}

/** Cabe mais uma carreira (sem substituir nenhuma)? */
export const temVagaDeCarreira = (v: Vida) => carreirasAtivas(v).length < LIMITE_DE_CARREIRAS;

/** O porquê, para quem tenta começar uma terceira: quais carreiras ocupam as vagas e onde liberar uma. */
export function motivoDoLimite(v: Vida): string {
  const cs = carreirasAtivas(v);
  return `Limite de ${LIMITE_DE_CARREIRAS} carreiras profissionais ao mesmo tempo: as vagas estão com ${cs.map(c => c.nome).join(' e ')}. Para começar outra, deixe uma delas (Caminhos · Trabalho) — o histórico continua.`;
}

/** O veredito de começar uma carreira a mais (sem substituir a principal). */
export const vagaParaMaisUma = (v: Vida): Veredito => (temVagaDeCarreira(v) ? PERMITIDO : bloqueio('requisito', motivoDoLimite(v)));
