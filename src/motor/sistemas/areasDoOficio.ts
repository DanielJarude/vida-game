/**
 * A área de aprofundamento é da PESSOA, não do emprego (REWORK 4).
 *
 * O bug do playtest: "A área — Depois de anos de código, dá para escolher onde
 * se aprofundar" voltava depois de a pessoa já ter escolhido Segurança. A
 * escolha morava só no emprego (`Emprego.especialidade`) e só atravessava uma
 * troca de emprego se o anterior fosse da MESMA trilha e estivesse no
 * histórico — de dev para analista de dados (outra trilha, o mesmo ofício), de
 * uma carreira pausada, de uma paralela que virou principal, a área sumia e a
 * primeira escolha voltava a ser sorteada.
 *
 * Agora a cadeia é:
 *
 *   trajetória → o marco fica elegível → a pessoa escolhe → a FASE é gravada
 *   (`Trabalho.areas`) → o emprego de agora e os próximos leem dela → a
 *   primeira escolha deixa de ser elegível para sempre.
 *
 * Mudar de área é OUTRA decisão ("Depois de anos em Segurança, surgiu a
 * oportunidade de migrar para Dados"): fecha a fase anterior e abre a nova —
 * a biografia e o currículo sabem que as duas existiram.
 */

import type { Emprego, FaseDeArea, Vida } from '../tipos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { OFICIOS } from './oficios';

/** A chave do ofício de uma trilha (ti e dados são o mesmo ofício). */
export const chaveDoOficio = (trilha?: string): string | undefined => (trilha ? OFICIOS[trilha]?.chave : undefined);
const chaveDoEmprego = (e?: Emprego) => chaveDoOficio(ocupacaoOuNula(e?.ocupacaoId ?? '')?.trilha);

/** Todos os vínculos de trabalho que a pessoa já teve ou tem (o de agora primeiro, depois do mais recente ao mais antigo). */
function empregosDaVida(v: Vida): Emprego[] {
  const t = v.trabalho;
  return [t.atual, t.paralela, ...(t.pausadas ?? []).map(p => p.emprego), ...[...t.historico].reverse()].filter((e): e is Emprego => !!e);
}

/** As fases de área de um ofício, em ordem. Saves antigos: deduzidas dos empregos (a área gravada no vínculo). */
export function fasesDaArea(v: Vida, oficio: string): FaseDeArea[] {
  const gravadas = (v.trabalho.areas ?? []).filter(f => f.oficio === oficio);
  if (gravadas.length) return gravadas;
  const e = empregosDaVida(v).find(x => x.especialidade && chaveDoEmprego(x) === oficio && OFICIOS[oficio]?.areas.includes(x.especialidade));
  return e ? [{ oficio, area: e.especialidade!, tInicio: e.tInicio }] : [];
}

/** A área em que a pessoa está aprofundada agora, naquele ofício (ou nenhuma). */
export function areaAtual(v: Vida, oficio?: string): string | undefined {
  if (!oficio) return undefined;
  const f = fasesDaArea(v, oficio);
  const ultima = f[f.length - 1];
  return ultima && ultima.tFim === undefined ? ultima.area : undefined;
}

/** A área que um emprego desta ocupação herda da pessoa (vale para qualquer trilha do mesmo ofício). */
export function areaParaTrilha(v: Vida, trilha: string): string | undefined {
  const a = areaAtual(v, chaveDoOficio(trilha));
  return a && OFICIOS[trilha]?.areas.includes(a) ? a : undefined;
}

/**
 * A pessoa passa a se aprofundar numa área. Fecha a fase anterior (se havia) e grava a nova; os vínculos de agora
 * daquele ofício passam a carregá-la. Nada é apagado.
 */
export function escolherArea(v: Vida, oficio: string, area: string): void {
  const fases = fasesDaArea(v, oficio).map(f => ({ ...f }));
  const aberta = fases[fases.length - 1];
  if (aberta && aberta.tFim === undefined) {
    if (aberta.area === area) return;
    aberta.tFim = v.t;
  }
  fases.push({ oficio, area, tInicio: v.t });
  v.trabalho.areas = [...(v.trabalho.areas ?? []).filter(f => f.oficio !== oficio), ...fases];
  for (const e of [v.trabalho.atual, v.trabalho.paralela]) if (e && chaveDoEmprego(e) === oficio) e.especialidade = area;
}

/** Já trabalhou num cargo que procura exatamente esta área (o analista de dados para a vaga de cientista de dados). */
export function viveuAArea(v: Vida, area: string): boolean {
  if ((v.trabalho.areas ?? []).some(f => f.area === area)) return true;
  return empregosDaVida(v).some(e => e.especialidade === area || ocupacaoOuNula(e.ocupacaoId)?.areaProfissional === area || (e.postos ?? []).some(p => ocupacaoOuNula(p.ocupacaoId)?.areaProfissional === area));
}

/** A trajetória de áreas, para o currículo: "Segurança (2031–2039) → Dados (desde 2039)". */
export function trajetoriaDeAreas(v: Vida): FaseDeArea[] {
  const chaves = new Set<string>([...(v.trabalho.areas ?? []).map(f => f.oficio), ...empregosDaVida(v).map(chaveDoEmprego).filter((x): x is string => !!x)]);
  return [...chaves].flatMap(k => fasesDaArea(v, k));
}
