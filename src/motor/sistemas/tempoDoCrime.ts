/**
 * REWORK 12.25 — o que o caminho ocupa da semana e o posto que se tem (leituras puras, embaixo de tudo: a semana, a
 * agenda e o Submundo leem daqui, sem ciclo entre pacotes).
 */
import type { Vida } from '../tipos';

const env = (v: Vida) => v.caminhos.envolvimento;
const frentes = (v: Vida) => Object.values(env(v)?.especializacoes ?? {}).filter(s => s && s.largou === undefined).length;

/** O maior posto que se tem hoje numa organização de que se é de dentro (−1: nenhum). */
export function nivelNaOrganizacao(v: Vida): number {
  const os = env(v)?.organizacoes ?? [];
  let n = -1;
  for (const o of os) if (o.relacao === 'membro' && o.saiu === undefined && o.expulso === undefined) n = Math.max(n, o.propria ? 6 : Math.max(o.nivel ?? 0, o.especialidade === 'organizado' ? Math.max(0, (env(v)?.especializacoes?.organizado?.posto ?? 1) - 1) : 0));
  return n;
}
export const temOrganizacaoPropria = (v: Vida) => !!env(v)?.organizacoes?.some(o => o.propria && o.saiu === undefined);


/**
 * O quanto o caminho ocupa a semana (lido pela agenda e pela semana): os encontros (o nível, as frentes), a organização
 * (o posto), os negócios por fora tocados de perto. Quem está na moita ocupa menos; quem está preso, nada.
 */
export function tempoDoCaminho(v: Vida): { noites: number; sabado: boolean; peso: number; rotulo: string } | undefined {
  const e = env(v);
  if (!e || e.parou !== undefined || v.justica?.prisao || v.justica?.foragido) return undefined;
  const nivel = nivelNaOrganizacao(v);
  const negocios = (e.negocios ?? []).filter(n => n.estado === 'ativo' && n.ritmo > 0).length;
  let noites = e.cautela ? 1 : e.nivel >= 2 || frentes(v) >= 2 ? 2 : 1;
  if (nivel >= 0) noites += 1;
  noites = Math.min(4, noites + Math.min(2, negocios));
  const sabado = nivel >= 2 || negocios >= 2 || (e.nivel >= 3 && !e.cautela);
  const peso = Math.round((noites * 0.2 + (sabado ? 0.3 : 0)) * 100) / 100;
  const rotulo = nivel >= 4 || temOrganizacaoPropria(v) ? 'A organização (o comando)' : nivel >= 0 ? 'Os compromissos com a organização' : negocios ? 'Os negócios por fora' : 'Os encontros por fora';
  return { noites, sabado, peso, rotulo };
}

