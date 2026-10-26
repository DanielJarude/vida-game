/**
 * REWORK 12.25 · ORG-12.25-01 — AS ORGANIZAÇÕES COMO MUNDO. Antes, uma organização era um nome com lealdade e memória,
 * que existia só na relação com o jogador. Agora ela EXISTE: tem tipo (pelo país e pelo ramo — uma facção, uma família,
 * uma rede, um círculo, um coletivo, uma turma, um sindicato), força, coesão, pressão da Justiça, um quadro de gente com
 * nome, uma liderança que envelhece, é presa, sai ou perde apoio, alianças e rivalidades, influência nas regiões da
 * cidade — e evolui sozinha, ano a ano, com ou sem o jogador. A relação do jogador fica onde sempre esteve
 * (`RelacaoComOrganizacao`, mesmo id: "o pessoal dos Soares" continua sendo o pessoal dos Soares).
 *
 *   RELAÇÃO      conhecido, contato comercial, aliado, de dentro, liderança, ex-integrante, rival (aliado não é de dentro)
 *   HIERARQUIA   sete degraus, com os nomes de cada estilo; sobe-se com lealdade, tempo, prática e oportunidade; cai-se
 *                (rebaixamento) com a lealdade perdida; sai-se expulso com a traição
 *   SUCESSÃO     a liderança vaga abre uma disputa: apoiar alguém, ficar de fora, disputar, sair — nem toda disputa é
 *                guerra (há acordos, rachas, conselhos); a organização continua depois
 *   TERRITÓRIO   a influência em cada região da cidade (texto, não mapa) — e a voz de quem mora lá: moradores e comércio
 *                se organizam, cobram o poder público, e isso pressiona quem quer mandar. Nenhuma região é "do crime" por
 *                ser pobre: a influência nasce da presença, das alianças e do que acontece
 *   ADMINISTRAÇÃO quem lidera escolhe a prioridade, resolve a disputa interna, negocia alianças, reage à pressão, cuida da
 *                presença — sem microgerenciamento: uma escolha por ano, e o ano faz o resto
 *
 * Eficiência: só existem as organizações das cidades por onde o caminho passou (3 a 5 por cidade, com 4 a 7 nomes cada);
 * o ano de cada uma é uma conta curta. Sorteios derivados (`rngDe`): determinístico por vida e ano.
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { MembroDaOrg, MundoCriminal, OrgViva, Ramo, RelacaoComOrganizacao, Vida } from '../tipos';
import { escrever, idade } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { criarPessoa, vincular } from '../pessoas';
import { sortearNome, sortearSobrenome } from '../dados/nomes';
import { economiaLocal, municipio, paisDaCidade } from '../dados/lugares';
import { anoDe } from '../tempo';
import { contrair } from '../texto';
import { vereditoDePagar } from './dinheiro';
import { ativo } from './ilicito';
import { preso } from './justica';
import { anotar, lembrarOrg, NOME_DO_PAPEL } from './submundo';
import { NOME_DO_RAMO } from './ramos';
import { ganharPratica, marco, movimentoPorFora, pagarPorFora, pedirRumo } from './carreiraCriminal';
import { abalar } from './abalo';
import { proporEncomenda } from './encomendas';

const env = (v: Vida) => v.caminhos.envolvimento;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ================================================================ estilos, nomes, hierarquias */

export const HIERARQUIA: Record<OrgViva['estilo'], string[]> = {
  faccao: ['colaboração de fora', 'gente de dentro', 'gente antiga da casa', 'responsável por uma área', 'liderança regional', 'alta liderança', 'quem manda'],
  familia: ['gente de fora da família', 'gente da família', 'de confiança da família', 'à frente de uma equipe', 'conselho da família', 'braço direito do chefe', 'quem chefia a família'],
  rede: ['um bico para a rede', 'parte da rede', 'operação de confiança', 'coordenação de um trecho', 'gerência regional', 'sociedade da rede', 'dono da rede'],
  circulo: ['indicação', 'participação', 'articulação', 'operação de confiança', 'apadrinhamento regional', 'conselho do círculo', 'quem preside o círculo'],
  coletivo: ['gente nova', 'gente do coletivo', 'veterania', 'coordenação de célula', 'administração', 'núcleo fundador', 'quem fundou e decide'],
  turma: ['gente que chega', 'gente da turma', 'gente antiga da turma', 'cabeça de um grupo', 'quem manda num pedaço', 'braço direito', 'quem manda na turma'],
  sindicato: ['associação', 'gente do sindicato', 'gente de confiança', 'chefia de equipe', 'chefia regional', 'diretoria', 'quem preside']
};
export const NOME_DO_ESTILO: Record<OrgViva['estilo'], string> = { faccao: 'facção', familia: 'família', rede: 'rede', circulo: 'círculo de influência', coletivo: 'coletivo', turma: 'turma', sindicato: 'sindicato do crime' };
export const nomeDoNivel = (o: OrgViva | undefined, nivel: number) => HIERARQUIA[o?.estilo ?? 'turma'][clamp(Math.round(nivel), 0, 6)];

const LUGARES = ['do Cais', 'do Trilho', 'do Mercado', 'do Viaduto', 'do Planalto', 'da Serra', 'do Litoral', 'do Norte', 'do Sul', 'Leste'];
const APELIDOS = ['Magro', 'Alemão', 'Baixinho', 'Russo', 'Galego', 'Careca', 'Doutor', 'Professor', 'Ruivo', 'Português'];
const BICHOS = ['Corvo', 'Vespa', 'Mariposa', 'Lince', 'Garça', 'Morcego', 'Coruja'];

/** O estilo de uma organização: o ramo e o país (nem toda organização brasileira é igual; nem toda estrangeira é máfia). */
export function estiloDe(ramo: Ramo, pais: string, r: Rng): OrgViva['estilo'] {
  switch (ramo) {
    case 'contrabando': return 'rede';
    case 'fraudes': return 'circulo';
    case 'digital': return 'coletivo';
    case 'furtos': return 'turma';
    case 'organizado': {
      if (pais === 'br') return r.chance(0.6) ? 'faccao' : r.chance(0.5) ? 'familia' : 'rede';
      if (pais === 'it') return r.chance(0.65) ? 'familia' : 'rede';
      if (['us', 'ca', 'gb', 'au', 'ie', 'jp', 'kr'].includes(pais)) return r.chance(0.55) ? 'sindicato' : r.chance(0.5) ? 'familia' : 'turma';
      return r.pick(['familia', 'rede', 'sindicato', 'faccao'] as const);
    }
  }
}

function nomeNovo(municipioId: string, estilo: OrgViva['estilo'], r: Rng): string {
  const pais = paisDaCidade(municipioId);
  const sob = sortearSobrenome(r, pais);
  switch (estilo) {
    case 'faccao': return r.pick([`a Irmandade ${r.pick(LUGARES)}`, `a Liga ${r.pick(LUGARES)}`, `o Conselho ${r.pick(LUGARES)}`]);
    case 'familia': return `a família ${sob}`;
    case 'rede': return r.pick([`a rede do ${r.pick(APELIDOS)}`, `o pessoal dos ${sob}`]);
    case 'circulo': return `o círculo de ${sob}`;
    case 'coletivo': return `o coletivo ${r.pick(BICHOS)}`;
    case 'turma': return `a turma do ${r.pick(APELIDOS)}`;
    case 'sindicato': return r.pick([`o sindicato ${sob}`, `a organização ${sob}`]);
  }
}

/* ================================================================ regiões e comunidade */

const REGIOES_GRANDE = [['centro', 'o centro'], ['norte', 'a zona norte'], ['sul', 'a zona sul'], ['leste', 'a zona leste'], ['oeste', 'a zona oeste']] as const;
const REGIOES_MEDIA = [['centro', 'o centro'], ['norte', 'os bairros do norte'], ['sul', 'os bairros do sul'], ['saida', 'a saída da cidade']] as const;
const REGIOES_PEQUENA = [['centro', 'o centro'], ['bairros', 'os bairros'], ['rural', 'a zona rural']] as const;

/** As regiões da cidade (texto; a infraestrutura de bairros do jogo é textual, e o território também). */
export function regioesDe(municipioId: string): { id: string; nome: string }[] {
  const p = municipio(municipioId).perfil;
  const xs = p === 'metropole' || p === 'metropolitana' ? REGIOES_GRANDE : p === 'pequena' ? REGIOES_PEQUENA : REGIOES_MEDIA;
  return xs.map(([id, nome]) => ({ id, nome }));
}
export const nomeDaRegiao = (municipioId: string, id: string) => regioesDe(municipioId).find(x => x.id === id)?.nome ?? 'uma região da cidade';

/** A região onde a pessoa mora (estável enquanto não muda de casa). */
export function regiaoDaPessoa(v: Vida): string {
  const m = v.mundoCriminal;
  if (m?.regiao && m.regiao.municipioId === v.moradia.municipioId) return m.regiao.id;
  const rs = regioesDe(v.moradia.municipioId);
  const id = rs[Math.floor(rngDe(v.id, 'regiao', v.moradia.municipioId, v.moradia.tInicio ?? 0).next() * rs.length) % rs.length].id;
  if (m) m.regiao = { municipioId: v.moradia.municipioId, id };
  return id;
}

/* ================================================================ o mundo */

export const orgsDoMundo = (v: Vida): OrgViva[] => Object.values(v.mundoCriminal?.orgs ?? {});
export const orgViva = (v: Vida, id: string): OrgViva | undefined => v.mundoCriminal?.orgs[id];
export const orgsDaCidade = (v: Vida, municipioId = v.moradia.municipioId) => orgsDoMundo(v).filter(o => o.municipioId === municipioId && o.estado !== 'extinta');

function garantirMundo(v: Vida): MundoCriminal {
  return (v.mundoCriminal ??= { orgs: {}, tAtualizado: v.t });
}

function novoMembro(v: Vida, o: { municipioId: string; id: string }, r: Rng, nivel: number, k: number): MembroDaOrg {
  const genero = r.chance(0.78) ? 'masculino' : 'feminino';
  const idadeM = clamp(20 + nivel * 4 + r.int(-3, 14), 19, 70);
  const tNasc = v.t - idadeM * 12 - r.int(0, 11);
  const pais = paisDaCidade(o.municipioId);
  const sob = sortearSobrenome(r, pais);
  return { id: `${o.id}_m${k}`, nome: `${sortearNome(r, genero, anoDe(tNasc), pais)} ${sob}`.split(' ').slice(0, 2).join(' '), genero, tNasc, nivel, desde: v.t - r.int(12, 120), estado: 'ativo' };
}

/** Uma organização do mundo (nova, para a cidade e o ramo — ou registrando uma que já existia na relação do jogador). */
function criarOrgViva(v: Vida, municipioId: string, ramo: Ramo, id: string, nome?: string): OrgViva {
  const r = rngDe('orgviva', id);
  const estilo = estiloDe(ramo, paisDaCidade(municipioId), r);
  const o: OrgViva = {
    id, nome: nome ?? nomeNovo(municipioId, estilo, r), estilo, ramo, municipioId,
    forca: 25 + r.int(0, 45), coesao: 45 + r.int(0, 35), pressao: 10 + r.int(0, 25),
    quadro: [], aliadas: [], rivais: [], influencia: {}, estado: 'ativa', historia: [], desde: v.t - r.int(24, 240)
  };
  const n = 4 + Math.round(o.forca / 25);
  const niveis = [6, 5, 4, 3, 2, 2, 1].slice(0, n);
  o.quadro = niveis.map((nv, k) => novoMembro(v, o, r, nv, k));
  for (const reg of regioesDe(municipioId)) if (r.chance(0.55)) o.influencia[reg.id] = Math.round(o.forca * (0.3 + r.next() * 0.7));
  garantirMundo(v).orgs[id] = o;
  return o;
}

/** A relação do jogador (save antigo ou criada agora) passa a ter uma organização viva atrás dela, com o mesmo id e nome. */
export function garantirOrgViva(v: Vida, rel: RelacaoComOrganizacao): OrgViva {
  const ja = orgViva(v, rel.id);
  if (ja) return ja;
  const m = /^org_[a-z]+_(.+)_\d+$/.exec(rel.id);
  const municipioId = m && safeMunicipio(m[1]) ? m[1] : v.moradia.municipioId;
  const o = criarOrgViva(v, municipioId, rel.especialidade, rel.id, rel.nome);
  if (rel.propria) {
    // A organização própria: o jogador é quem manda (o quadro é a gente dele).
    o.quadro = o.quadro.filter(x => x.nivel < 6).slice(0, 3);
    o.forca = 20;
  }
  return o;
}
function safeMunicipio(id: string): boolean { try { return !!municipio(id); } catch { return false; } }

/** As organizações da cidade existem a partir do momento em que o caminho passa por ela (3 a 5, pelo tamanho). */
export function garantirCidade(v: Vida, municipioId = v.moradia.municipioId): void {
  const e = env(v);
  if (!e) return;
  for (const rel of e.organizacoes ?? []) garantirOrgViva(v, rel);
  if (orgsDoMundo(v).some(o => o.municipioId === municipioId && o.id.startsWith('mundo_'))) return;
  const p = municipio(municipioId).perfil;
  const ramos: Ramo[] = p === 'pequena' ? ['organizado', 'contrabando', 'furtos'] : p === 'polo' || p === 'capital' ? ['organizado', 'contrabando', 'fraudes', 'furtos'] : ['organizado', 'organizado', 'contrabando', 'fraudes', 'digital'];
  ramos.forEach((ramo, k) => criarOrgViva(v, municipioId, ramo, `mundo_${municipioId}_${k}`));
  // As relações iniciais entre elas: a mesma especialidade disputa; às vezes, uma alia-se.
  const os = orgsDaCidade(v, municipioId);
  const r = rngDe(v.id, 'mundo_cidade', municipioId);
  for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) {
    const a = os[i], b = os[j];
    if (a.ramo === b.ramo ? r.chance(0.7) : r.chance(0.12)) relacionar(a, b, 'rival');
    else if (r.chance(0.18)) relacionar(a, b, 'aliada');
  }
}

function relacionar(a: OrgViva, b: OrgViva, como: 'rival' | 'aliada' | 'nada'): void {
  a.rivais = a.rivais.filter(x => x !== b.id); b.rivais = b.rivais.filter(x => x !== a.id);
  a.aliadas = a.aliadas.filter(x => x !== b.id); b.aliadas = b.aliadas.filter(x => x !== a.id);
  if (como === 'rival') { a.rivais.push(b.id); b.rivais.push(a.id); }
  if (como === 'aliada') { a.aliadas.push(b.id); b.aliadas.push(a.id); }
}

function historia(o: OrgViva, t: number, texto: string): void {
  o.historia.push({ t, texto: contrair(texto) });
  if (o.historia.length > 20) o.historia.splice(0, o.historia.length - 20);
}

export const lider = (o: OrgViva) => o.quadro.find(m => m.estado === 'ativo' && m.nivel >= 6);

/* ================================================================ a relação do jogador */

export type VinculoComOrg = 'conhecido' | 'comercial' | 'aliado' | 'integrante' | 'lideranca' | 'ex' | 'rival';
export const NOME_DO_VINCULO: Record<VinculoComOrg, string> = { conhecido: 'conhecido', comercial: 'contato comercial', aliado: 'aliado (não é de dentro)', integrante: 'de dentro', lideranca: 'na liderança', ex: 'ex-integrante', rival: 'rival' };

export function vinculoComOrg(rel: RelacaoComOrganizacao | undefined): VinculoComOrg {
  if (!rel) return 'conhecido';
  if (rel.expulso !== undefined || (rel.saiu !== undefined && rel.relacao === 'membro')) return 'ex';
  if (rel.relacao === 'rival') return 'rival';
  if (rel.propria) return rel.saiu === undefined ? 'lideranca' : 'ex';
  if (rel.relacao === 'membro') return (rel.nivel ?? 0) >= 4 ? 'lideranca' : 'integrante';
  if (rel.relacao === 'aliada') return rel.lealdade >= 55 ? 'aliado' : 'comercial';
  return rel.saiu !== undefined ? 'ex' : 'conhecido';
}

/** A relação do jogador com uma organização do mundo (criada como "conhecido" quando ainda não existe). */
export function relacaoCom(v: Vida, o: OrgViva): RelacaoComOrganizacao {
  const e = env(v)!;
  const os = (e.organizacoes ??= []);
  const ja = os.find(x => x.id === o.id);
  if (ja) return ja;
  const rel: RelacaoComOrganizacao = { id: o.id, nome: o.nome, especialidade: o.ramo, relacao: 'neutra', lealdade: 25, memoria: [], desde: v.t };
  os.push(rel);
  return rel;
}

/** O posto (0..6) de quem é de dentro; os saves antigos liam o posto do ramo organizado (1..4). */
export function nivelDe(v: Vida, rel: RelacaoComOrganizacao): number {
  if (rel.propria) return 6;
  if (rel.relacao !== 'membro') return rel.nivel ?? -1;
  // O posto do ramo organizado (as cenas antigas o sobem) também conta: o nível nunca fica atrás dele.
  const doPosto = rel.especialidade === 'organizado' ? Math.max(0, (env(v)?.especializacoes?.organizado?.posto ?? 1) - 1) : 0;
  return Math.max(rel.nivel ?? 0, doPosto);
}

function definirNivel(v: Vida, rel: RelacaoComOrganizacao, nivel: number): void {
  rel.nivel = clamp(Math.round(nivel), 0, 6);
  const s = env(v)?.especializacoes?.organizado;
  if (s && rel.especialidade === 'organizado') s.posto = Math.min(4, rel.nivel + 1) as 1 | 2 | 3 | 4;
}

/* ================================================================ o ano do mundo */

/**
 * O ano das organizações (as da cidade de agora e as de antes, de onde o caminho passou): a força, a coesão, a pressão,
 * o quadro (quem entra, sobe, é preso, morre, sai), a liderança e a sucessão, as alianças e as rivalidades, a influência
 * por região e a voz da comunidade. Depois, a relação do jogador: a parte que cabe a quem é de dentro, a promoção que
 * chega, o rebaixamento, a expulsão.
 */
export function processarFaccoes(v: Vida): void {
  const e = env(v);
  if (!e) return;
  garantirCidade(v);
  const m = garantirMundo(v);
  for (const o of orgsDoMundo(v)) if (o.estado !== 'extinta') anoDaOrg(v, o);
  renovarCidade(v);
  anoDaComunidade(v);
  m.tAtualizado = v.t;
  anoDoJogadorNasOrgs(v);
  cenasDoAno(v);
}

/** As cenas que o mundo traz ao jogador neste ano (uma de cada, com intervalo): a rivalidade no seu pedaço, a aliança oferecida. */
function cenasDoAno(v: Vida): void {
  const e = env(v)!;
  if (!ativo(v) || preso(v)) return;
  const r = rngDe(v.id, 'cenas_faccoes', v.t);
  const reg = regiaoDaPessoa(v);
  const ult = (k: string) => v.fatos[k] !== undefined && v.t - v.fatos[k] < 36;
  const minha = (e.organizacoes ?? []).find(o => (o.relacao === 'membro' || o.propria) && o.saiu === undefined && o.expulso === undefined);
  const o = minha ? orgViva(v, minha.id) : undefined;
  if (o && !ult('sub125_rivalidade')) {
    const rival = o.rivais.map(x => orgViva(v, x)).find(x => x && x.estado !== 'extinta' && (x.influencia[reg] ?? 0) >= 25 && (o.influencia[reg] ?? 0) >= 20);
    if (rival && r.chance(0.4)) { (e.cenas125 ??= {})['sub125_rivalidade'] = `${o.id}|${rival.id}`; v.fatos['sub125_rivalidade'] = v.t; }
  }
  if ((e.reputacao ?? 0) >= 40 && !ult('sub125_alianca')) {
    const alvo = orgsDaCidade(v).find(x => vinculoComOrg(e.organizacoes?.find(y => y.id === x.id)) === 'conhecido' && x.forca >= 30 && !e.organizacoes?.some(y => y.id === x.id && y.relacao === 'rival'));
    if (alvo && r.chance(0.25)) { (e.cenas125 ??= {})['sub125_alianca'] = alvo.id; v.fatos['sub125_alianca'] = v.t; }
  }
}

function anoDaOrg(v: Vida, o: OrgViva): void {
  const r = rngDe(v.id, 'org_ano', o.id, v.t);
  const rel = env(v)?.organizacoes?.find(x => x.id === o.id);
  const jogadorLidera = !!rel && rel.saiu === undefined && rel.expulso === undefined && (rel.propria || nivelDe(v, rel) >= 6) && !preso(v);
  const pr = o.prioridade ?? 'consolidar';
  // A força: o acaso, a prioridade, a pressão, as alianças e as rivalidades.
  // (Com volta ao tamanho de costume: o mundo não se esvazia sozinho — quem cai é quem é empurrado.)
  o.forca = clamp(Math.round(o.forca + (r.next() - 0.5) * 8 + (45 - o.forca) * 0.1 + (pr === 'expandir' ? 4 : pr === 'discricao' ? -2 : 0) - Math.max(0, o.pressao - 30) / 15 + o.aliadas.length * 0.8 - o.rivais.length * 0.6 + (o.coesao < 35 ? -3 : 0)));
  o.pressao = clamp(Math.round(o.pressao * 0.85 + o.forca / 12 + (pr === 'expandir' ? 4 : pr === 'discricao' ? -5 : 0)));
  o.coesao = clamp(Math.round(o.coesao + (58 - o.coesao) * 0.1 + (r.next() - 0.5) * 10 - (o.disputa ? 8 : 0) + (pr === 'consolidar' ? 4 : 0)));
  // Uma operação da Justiça (o ano em que a pressão vira prisão de alguém do quadro).
  if (r.chance(o.pressao / 300)) {
    const alvo = r.pick(o.quadro.filter(x => x.estado === 'ativo') .slice(0, 6));
    if (alvo) {
      alvo.estado = 'preso';
      o.forca = clamp(o.forca - 8);
      o.pressao = clamp(o.pressao - 15);
      historia(o, v.t, `Uma operação levou ${alvo.nome} (${nomeDoNivel(o, alvo.nivel)}).`);
    }
  }
  // O quadro: a idade, a saída, a promoção de quem fica; a entrada de gente nova quando a força cresce.
  for (const x of o.quadro) {
    if (x.estado !== 'ativo') continue;
    const i = anoDe(v.t - x.tNasc);
    if (r.chance(i >= 70 ? 0.07 : i >= 55 ? 0.02 : 0.006)) { x.estado = 'morto'; historia(o, v.t, `${x.nome} morreu.`); continue; }
    if (r.chance(i >= 62 ? 0.08 : 0.02)) { x.estado = 'saiu'; historia(o, v.t, `${x.nome} deixou ${o.nome}.`); continue; }
    if (x.nivel < 5 && r.chance(0.06)) x.nivel++;
  }
  const ativos = o.quadro.filter(x => x.estado === 'ativo');
  if (ativos.length < 3 + Math.round(o.forca / 25) && r.chance(0.6)) o.quadro.push(novoMembro(v, o, r, r.int(1, 3), o.quadro.length));
  if (o.quadro.length > 12) o.quadro = [...o.quadro.filter(x => x.estado === 'ativo' || x.pessoaId), ...o.quadro.filter(x => x.estado !== 'ativo' && !x.pessoaId).slice(-3)].slice(-12);
  // A liderança: quem manda ainda manda? (A morte, a prisão, a saída, a perda de apoio abrem a sucessão.)
  const l = lider(o);
  if (!jogadorLidera && !o.disputa) {
    const caiu = !l ? 'a cadeira estava vazia' : o.coesao < 30 && r.chance(0.25) ? `${l.nome} perdeu o apoio de quem mandava junto` : undefined;
    if (caiu) {
      if (l && caiu !== 'a cadeira estava vazia') { l.nivel = 4; l.estado = r.chance(0.5) ? 'saiu' : 'ativo'; }
      abrirDisputa(v, o, r, caiu);
    }
  } else if (o.disputa && v.t - o.disputa.t >= 12) resolverDisputa(v, o, r);
  // Alianças e rivalidades entre as organizações da mesma cidade.
  const outras = orgsDaCidade(v, o.municipioId).filter(x => x.id !== o.id);
  if (outras.length && r.chance(0.07)) {
    const b = r.pick(outras);
    const ja = o.rivais.includes(b.id) ? 'rival' : o.aliadas.includes(b.id) ? 'aliada' : 'nada';
    const novo = ja === 'rival' ? (r.chance(0.5) ? 'nada' : 'rival') : ja === 'aliada' ? (r.chance(0.5) ? 'nada' : 'rival') : (b.ramo === o.ramo ? 'rival' : r.chance(0.5) ? 'aliada' : 'rival');
    if (novo !== ja) {
      relacionar(o, b, novo);
      historia(o, v.t, novo === 'rival' ? `${cap(o.nome)} e ${b.nome} viraram rivais.` : novo === 'aliada' ? `${cap(o.nome)} e ${b.nome} fecharam um acordo.` : `${cap(o.nome)} e ${b.nome} deixaram as diferenças de lado.`);
    }
  }
  // A influência por região: a presença cresce com a força e a prioridade; as rivais disputam; a comunidade pesa.
  for (const reg of regioesDe(o.municipioId)) {
    const voz = v.mundoCriminal?.comunidade?.[`${o.municipioId}:${reg.id}`] ?? 40;
    const atual = o.influencia[reg.id] ?? 0;
    const alvo = o.forca * (pr === 'expandir' ? 0.9 : 0.7) * (1 - voz / 200);
    const prox = Math.round(atual + (alvo - atual) * 0.15 + (r.next() - 0.5) * 6);
    if (prox <= 2) delete o.influencia[reg.id]; else o.influencia[reg.id] = clamp(prox);
  }
  // O fim (ou o enfraquecimento) — a história fica.
  if (o.forca < 6) {
    if (o.estado === 'enfraquecida' && r.chance(0.4)) { o.estado = 'extinta'; historia(o, v.t, `${cap(o.nome)} deixou de existir: os que sobraram foram para outros lados.`); }
    else o.estado = 'enfraquecida';
  } else if (o.estado === 'enfraquecida' && o.forca >= 15) o.estado = 'ativa';
}

/** O espaço que uma organização extinta deixou não fica vazio por muito tempo: outra nasce (o mundo continua). */
function renovarCidade(v: Vida): void {
  const cidades = [...new Set(orgsDoMundo(v).map(o => o.municipioId))];
  for (const c of cidades) {
    const vivas = orgsDaCidade(v, c);
    const ramos = [...new Set(orgsDoMundo(v).filter(o => o.municipioId === c).map(o => o.ramo))];
    for (const ramo of ramos) {
      if (vivas.some(o => o.ramo === ramo)) continue;
      if (!rngDe(v.id, 'renovar', c, ramo, v.t).chance(0.35)) continue;
      const k = orgsDoMundo(v).filter(o => o.municipioId === c).length;
      const o = criarOrgViva(v, c, ramo, `mundo_${c}_${k}`);
      o.forca = 15 + Math.round(o.forca / 3);
      o.desde = v.t;
      historia(o, v.t, `${cap(o.nome)} surgiu no espaço que outra organização deixou.`);
    }
  }
}

/** A voz dos moradores e do comércio de cada região: cresce quando alguém quer mandar demais ali, e cobra o poder público. */
function anoDaComunidade(v: Vida): void {
  const m = garantirMundo(v);
  const com = (m.comunidade ??= {});
  const cidades = [...new Set(orgsDoMundo(v).map(o => o.municipioId))];
  for (const c of cidades) for (const reg of regioesDe(c)) {
    const k = `${c}:${reg.id}`;
    const total = orgsDaCidade(v, c).reduce((s, o) => s + (o.influencia[reg.id] ?? 0), 0);
    const r = rngDe(v.id, 'comunidade', k, v.t);
    const antes = com[k] ?? 35 + Math.round(r.next() * 20);
    com[k] = clamp(Math.round(antes + (total > 70 ? 4 : total > 40 ? 1 : -1) + (r.next() - 0.5) * 4));
    // Quando a voz é alta, a pressão sobre quem tem presença ali sobe (a associação, o comércio, a cobrança por política pública).
    if (com[k] >= 65) for (const o of orgsDaCidade(v, c)) if ((o.influencia[reg.id] ?? 0) >= 25) { o.pressao = clamp(o.pressao + 3); o.influencia[reg.id] = clamp((o.influencia[reg.id] ?? 0) - 3); }
  }
}

/* ================================================================ sucessão */

function abrirDisputa(v: Vida, o: OrgViva, r: Rng, motivo: string): void {
  const cands = o.quadro.filter(x => x.estado === 'ativo' && x.nivel >= 3).sort((a, b) => b.nivel - a.nivel).slice(0, 2).map(x => x.id);
  if (!cands.length) {
    const novo = novoMembro(v, o, r, 5, o.quadro.length);
    o.quadro.push(novo);
    cands.push(novo.id);
  }
  const rel = env(v)?.organizacoes?.find(x => x.id === o.id);
  if (rel && rel.relacao === 'membro' && rel.saiu === undefined && nivelDe(v, rel) >= 4 && !preso(v)) cands.push('jogador');
  o.disputa = { t: v.t, candidatos: cands, motivo };
  historia(o, v.t, `A liderança ficou vaga (${motivo}): ${cands.map(c => c === 'jogador' ? 'você' : o.quadro.find(x => x.id === c)?.nome).join(' e ')} ${cands.length > 1 ? 'disputam' : 'é o nome'}.`);
  if (rel && rel.relacao === 'membro' && rel.saiu === undefined && !preso(v)) {
    const e = env(v)!;
    (e.cenas125 ??= {})['sub125_disputa'] = o.id;
    v.fatos['sub125_disputa'] = v.t;
  }
}

const JEITOS = ['numa conversa longa, com os antigos à mesa', 'num acordo: quem perdeu ficou com uma parte do negócio', 'num racha: um pedaço foi embora com quem perdeu', 'num conselho, sem barulho', 'depois de meses de tensão, sem ninguém se machucar'];

function resolverDisputa(v: Vida, o: OrgViva, r: Rng): void {
  const d = o.disputa!;
  const rel = env(v)?.organizacoes?.find(x => x.id === o.id);
  const peso = (c: string) => c === 'jogador'
    ? (rel ? 1 + (rel.lealdade - 40) / 30 + nivelDe(v, rel) * 0.3 + (env(v)?.reputacao ?? 0) / 60 : 0.1) * (preso(v) ? 0.05 : 1)
    : 1 + (o.quadro.find(x => x.id === c)?.nivel ?? 3) * 0.3 + (d.apoio === c ? 1.2 : 0);
  const vencedor = r.weighted(d.candidatos, peso) ?? d.candidatos[0];
  const jeito = r.pick(JEITOS);
  o.disputa = undefined;
  if (jeito.includes('racha')) { o.forca = clamp(o.forca - 12); o.coesao = clamp(o.coesao - 5); } else o.coesao = clamp(o.coesao + 10);
  if (vencedor === 'jogador') {
    if (rel) { definirNivel(v, rel, 6); lembrarOrg(rel, v.t, 'alianca', 10); }
    historia(o, v.t, `A disputa terminou ${jeito}: você passou a mandar.`);
    marco(v, `Chegou ao topo de ${o.nome}: ${nomeDoNivel(o, 6)}.`);
    escrever(v, { texto: contrair(`Passou a comandar ${o.nome}. A disputa terminou ${jeito}.`), relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
    return;
  }
  const m = o.quadro.find(x => x.id === vencedor);
  if (m) m.nivel = 6;
  for (const x of o.quadro) if (x.id !== vencedor && x.nivel >= 6) x.nivel = 5;
  historia(o, v.t, `A disputa terminou ${jeito}: ${m?.nome ?? 'alguém'} passou a mandar.`);
  // Quem trabalha com ela sem ser de dentro fica sabendo (e o que se combinou com a direção antiga vale menos).
  if (rel && rel.relacao === 'aliada' && rel.saiu === undefined && ativo(v)) { (env(v)!.cenas125 ??= {})['sub125_novo_lider'] = o.id; v.fatos['sub125_novo_lider'] = v.t; }
  if (!rel || rel.relacao !== 'membro' || rel.saiu !== undefined) return;
  const n = nivelDe(v, rel);
  if (d.candidatos.includes('jogador')) {
    // Perder a disputa não é o fim: depende de como se perdeu (o racha leva gente com você).
    if (jeito.includes('racha') || r.chance(0.3)) { lembrarOrg(rel, v.t, 'conflito', -12); anotar(v, `Perdeu a disputa em ${o.nome} — e quem ganhou não esquece.`, 'ruim'); }
    else { lembrarOrg(rel, v.t, 'reconciliacao', 2); anotar(v, `Perdeu a disputa em ${o.nome}, e ficou no posto de antes.`); }
    return;
  }
  if (d.apoio === vencedor) { lembrarOrg(rel, v.t, 'alianca', 10); if (n < 5) definirNivel(v, rel, n + 1); anotar(v, `Apoiou ${m?.nome} na disputa de ${o.nome}, e ${m?.nome} lembrou: você subiu.`, 'bom'); }
  else if (d.apoio && d.apoio !== vencedor) { lembrarOrg(rel, v.t, 'conflito', -10); if (n > 0 && r.chance(0.5)) definirNivel(v, rel, n - 1); anotar(v, `Apoiou quem perdeu a disputa de ${o.nome}. O novo comando sabe.`, 'ruim'); }
}

/* ================================================================ o jogador nas organizações */

/** A parte que cabe a quem é de dentro (pelo posto, pela força, pela influência, pela prioridade) — ou o que custa o ano. */
export function parteDoAno(_v: Vida, o: OrgViva, nivel: number): number {
  const base = [0.5, 1, 2, 4, 12, 30, 90][clamp(nivel, 0, 6)] * 6000;
  const infl = Object.values(o.influencia).reduce((s, x) => s + x, 0) / Math.max(1, regioesDe(o.municipioId).length);
  const pr = o.prioridade === 'negocios' ? 1.25 : o.prioridade === 'discricao' ? 0.6 : 1;
  return Math.round(base * (o.forca / 50) * (1 + infl / 150) * pr * economiaLocal(o.municipioId).custo / 100) * 100;
}

function anoDoJogadorNasOrgs(v: Vida): void {
  const e = env(v)!;
  if (preso(v)) {
    // Preso, o comando passa a outro (a liderança vaga), e o posto espera — ou não.
    for (const rel of e.organizacoes ?? []) {
      const o = orgViva(v, rel.id);
      if (o && rel.relacao === 'membro' && nivelDe(v, rel) >= 6 && !o.disputa) { definirNivel(v, rel, 5); abrirDisputa(v, o, rngDe(v.id, 'disputa_preso', o.id, v.t), 'quem mandava foi preso'); }
    }
    return;
  }
  if (!ativo(v)) return;
  const r = rngDe(v.id, 'jogador_orgs', v.t);
  for (const rel of e.organizacoes ?? []) {
    if (rel.saiu !== undefined || rel.expulso !== undefined) continue;
    const o = orgViva(v, rel.id);
    if (!o || o.estado === 'extinta') continue;
    if (rel.relacao !== 'membro' && !rel.propria) continue;
    const n = nivelDe(v, rel);
    if (rel.nivel === undefined && !rel.propria) definirNivel(v, rel, n);
    // A parte do ano (a organização própria já paga pelos negócios dela: `clandestinos`).
    if (!rel.propria) {
      const seco = r.chance(o.coesao < 35 ? 0.35 : 0.15);
      const parte = seco ? 0 : Math.round(parteDoAno(v, o, n) * (0.7 + r.next() * 0.6) / 100) * 100;
      if (parte > 0) { movimentoPorFora(v, 'organizacao', parte); e.ganhos += parte; }
      // Quem sobe até o comando passa a delegar: a exposição pessoal cresce até o posto de responsável por uma área e,
      // dali para cima, diminui (outros fazem a rua) — o que pesa é a pressão sobre a organização inteira.
      const pessoal = n <= 3 ? n * 1.5 : Math.max(0, 4.5 - (n - 3) * 1.5);
      e.exposicao = clamp(e.exposicao + 2 + Math.round(pessoal) + Math.round(o.pressao / 30));
      ganharPratica(v, 2 + n);
      rel.lealdade = clamp(rel.lealdade + (e.cautela ? -3 : 1));
    }
    // A lealdade perdida: o rebaixamento; a perdida de vez (ou a traição): a expulsão.
    const traiu = rel.memoria.some(m => m.fato === 'traicao' && v.t - m.t < 24);
    if (!rel.propria && (rel.lealdade < 12 || traiu)) {
      rel.expulso = v.t;
      rel.saiu = v.t;
      lembrarOrg(rel, v.t, 'saida', -10);
      v.fatos['pressao_grupo'] = v.t;
      anotar(v, `Foi posto para fora de ${o.nome}.`, 'ruim');
      escrever(v, { texto: contrair(`Foi expuls${v.eu.genero === 'feminino' ? 'a' : v.eu.genero === 'nao_binario' ? 'e' : 'o'} de ${o.nome}. Quem sai assim não sai em paz.`), relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
      abalar(v, 'a expulsão', -8, 12);
      pedirRumo(v, 'perda');
      continue;
    }
    if (!rel.propria && rel.lealdade < 25 && n > 0 && r.chance(0.4)) {
      definirNivel(v, rel, n - 1);
      anotar(v, `Rebaixado em ${o.nome}: ${nomeDoNivel(o, n - 1)}.`, 'ruim');
      continue;
    }
    // A promoção que chega (sem pedir) para quem é leal, presente e já tem prática.
    if (!rel.propria && n < 5 && rel.lealdade >= 55 + n * 4 && (rel.pedidos?.promovido === undefined || v.t - rel.pedidos.promovido >= 24) && r.chance(0.18)) {
      promover(v, o, rel, 'O comando chamou você para subir.');
    }
  }
}

function promover(v: Vida, o: OrgViva, rel: RelacaoComOrganizacao, como: string): string {
  const n = nivelDe(v, rel) + 1;
  definirNivel(v, rel, n);
  (rel.pedidos ??= {}).promovido = v.t;
  const e = env(v)!;
  e.reputacao = clamp((e.reputacao ?? 0) + 6);
  lembrarOrg(rel, v.t, 'alianca', 3);
  const texto = `${como} Agora: ${nomeDoNivel(o, n)}, em ${o.nome}.`;
  anotar(v, texto, 'bom');
  if (n >= 3) marco(v, `Chegou a ${nomeDoNivel(o, n)} em ${o.nome}.`);
  else escrever(v, { texto: contrair(`Subiu em ${o.nome}: ${nomeDoNivel(o, n)}.`), relevancia: 'biografia', tema: 'trabalho', escolha: true });
  if (n >= 3 && !Object.values(e.fichas ?? {}).some(f => f.papel === 'protegido' && f.organizacao === o.id && f.afastado === undefined)) {
    const rr = rngDe(v.id, 'protegido_org', o.id, v.t);
    const p = criarPessoa(v, rr, { genero: rr.chance(0.7) ? 'masculino' : 'feminino', idade: Math.max(18, idade(v) - rr.int(2, 12)), municipioId: v.moradia.municipioId });
    vincular(v, p, { origem: 'vizinhanca', estagio: 'conhecido', proximidade: 25, convivio: [] });
    (e.fichas ??= {})[p.id] = { papel: 'protegido', especialidade: o.ramo, confianca: 45, espera: 'lealdade', cumpridas: 0, quebradas: 0, organizacao: o.id, desde: v.t };
    (e.contatos ??= []).push(p.id);
  }
  return texto;
}

/* ================================================================ as ações com uma organização */

export type OqueOrg = 'conversar' | 'filiar' | 'tarefa' | 'promocao' | 'sair' | 'apoiar' | 'disputar' | 'neutro' | 'prioridade_expandir' | 'prioridade_consolidar' | 'prioridade_discricao' | 'prioridade_negocios' | 'mediar' | 'alianca' | 'romper' | 'presenca' | 'recolher' | 'conhecer';

const feito = (rel: RelacaoComOrganizacao, k: string, v: Vida) => rel.pedidos?.[k] !== undefined && v.t - rel.pedidos[k] < 12;

export function disponibilidadeOrg(v: Vida, orgId: string, oque: OqueOrg, alvo?: string): Veredito {
  const e = env(v);
  const o = orgViva(v, orgId);
  if (!e || !o) return bloqueio('impossivel', 'Essa organização não está no seu caminho.');
  if (preso(v)) return bloqueio('impossivel', 'Da prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  if (o.estado === 'extinta') return bloqueio('impossivel', 'Ela não existe mais.');
  const rel = e.organizacoes?.find(x => x.id === orgId);
  const vinc = vinculoComOrg(rel);
  const n = rel ? nivelDe(v, rel) : -1;
  const dentro = vinc === 'integrante' || vinc === 'lideranca';
  if (!ativo(v) && oque !== 'conversar') return bloqueio('incompativel', 'Você não está mais nisso.');
  if (rel && feito(rel, oque, v)) return bloqueio('incompativel', 'Isso já foi feito neste ano.');
  switch (oque) {
    case 'conhecer': return rel ? bloqueio('incompativel', 'Você já sabe quem eles são.') : PERMITIDO;
    case 'conversar': return rel ? PERMITIDO : bloqueio('requisito', 'Primeiro, alguém precisa apresentar você.');
    case 'filiar':
      if (dentro) return bloqueio('incompativel', 'Você já é de dentro.');
      if (vinc === 'rival' || rel?.expulso !== undefined) return bloqueio('incompativel', 'Depois do que houve, essa porta está fechada.');
      if (!rel || rel.lealdade < 45) return bloqueio('requisito', 'Ninguém entra sem que confiem: falta lealdade (trabalhos, favores, tempo de aliança).');
      if (idade(v) < 18) return bloqueio('impossivel', 'Cedo demais.');
      if (e.organizacoes?.some(x => x.relacao === 'membro' && x.saiu === undefined && x.id !== orgId && x.especialidade === o.ramo)) return bloqueio('incompativel', 'Você já é de dentro de outra organização do mesmo ramo.');
      return { grau: 'irregular', motivo: 'É crime. De dentro: uma parte do que a organização faz, um posto para subir — e compromissos, a pressão que vem com ela, uma saída mais difícil.' };
    case 'tarefa': return dentro || vinc === 'aliado' || vinc === 'comercial' ? PERMITIDO : bloqueio('requisito', 'Eles não pedem nada a quem não conhecem.');
    case 'promocao':
      if (!dentro || rel?.propria) return bloqueio('impossivel', 'Só para quem é de dentro.');
      if (n >= 5) return bloqueio('incompativel', 'Acima disso, só a liderança — e ela se disputa, não se pede.');
      if (rel!.lealdade < 40 + n * 5) return bloqueio('requisito', 'Ninguém ali acha que chegou a sua hora: falta lealdade.');
      if ((garantirXp(v)) < [0, 8, 20, 35, 55, 75][n]) return bloqueio('requisito', 'Falta prática para esse posto.');
      return PERMITIDO;
    case 'sair': return dentro && !rel?.propria ? PERMITIDO : bloqueio('impossivel', 'Você não é de dentro.');
    case 'apoiar': case 'neutro': return o.disputa && dentro && (oque === 'neutro' || o.disputa.candidatos.includes(alvo ?? '')) && alvo !== 'jogador' ? PERMITIDO : bloqueio('impossivel', 'Não há disputa em que tomar lado.');
    case 'disputar':
      if (!o.disputa || !dentro) return bloqueio('impossivel', 'Não há disputa aberta.');
      if (o.disputa.candidatos.includes('jogador')) return bloqueio('incompativel', 'Você já está na disputa.');
      return n >= 4 ? PERMITIDO : bloqueio('requisito', 'Para disputar o comando, é preciso estar perto dele (um posto alto).');
  }
  // As da liderança.
  if (n < 3 && !rel?.propria) return bloqueio('requisito', 'Isso é de quem tem posto de comando.');
  switch (oque) {
    case 'mediar': return o.coesao >= 55 ? bloqueio('incompativel', 'Não há briga interna para resolver agora.') : vereditoDePagar(v, custoDeComando(v, o), 'Acalmar os ânimos custa uns');
    case 'alianca': case 'romper': {
      const b = alvo ? orgViva(v, alvo) : undefined;
      if (!b || b.id === o.id || b.municipioId !== o.municipioId) return bloqueio('impossivel', 'Com quem?');
      if (n < 4 && !rel?.propria) return bloqueio('requisito', 'Aliança é coisa de quem manda.');
      if (oque === 'alianca' && o.aliadas.includes(b.id)) return bloqueio('incompativel', 'Já são aliadas.');
      if (oque === 'romper' && !o.aliadas.includes(b.id)) return bloqueio('incompativel', 'Não há aliança a romper.');
      return PERMITIDO;
    }
    case 'presenca': return n >= 4 || rel?.propria ? vereditoDePagar(v, custoDeComando(v, o) * 2, 'Fazer-se presente custa uns') : bloqueio('requisito', 'Só quem comanda decide onde a organização se faz presente.');
    case 'recolher': return o.pressao >= 30 ? PERMITIDO : bloqueio('incompativel', 'A pressão não pede isso agora.');
  }
  return PERMITIDO;
}

const garantirXp = (v: Vida) => env(v)?.carreira?.xp ?? 0;
export const custoDeComando = (_v: Vida, o: OrgViva) => Math.round(8000 * economiaLocal(o.municipioId).custo * (0.5 + o.forca / 50) / 100) * 100;

export function executarOrg(v: Vida, orgId: string, oque: OqueOrg, alvo?: string): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const o = orgViva(v, orgId)!;
  const rel = relacaoCom(v, o);
  (rel.pedidos ??= {})[oque] = v.t;
  const r = rngDe(v.id, 'org_acao', orgId, oque, v.t);
  const n = nivelDe(v, rel);
  switch (oque) {
    case 'conhecer':
      return { texto: `Você passou a saber quem é ${o.nome}: ${NOME_DO_ESTILO[o.estilo]}, ${NOME_DO_RAMO[o.ramo].toLowerCase()}.` };
    case 'conversar': {
      const l = lider(o);
      rel.lealdade = clamp(rel.lealdade + (rel.lealdade < 50 ? 2 : 0));
      const ult = o.historia[o.historia.length - 1];
      return { texto: `${cap(o.nome)} anda ${o.forca >= 60 ? 'forte' : o.forca >= 30 ? 'do mesmo tamanho' : 'enfraquecida'}${o.coesao < 40 ? ', rachada por dentro' : ''}${o.pressao >= 50 ? ', com a Justiça em cima' : ''}. ${l ? `Quem manda é ${l.nome}.` : 'Ninguém manda de verdade agora.'}${ult ? ` O assunto do momento: ${ult.texto.charAt(0).toLowerCase()}${ult.texto.slice(1)}` : ''}` };
    }
    case 'filiar': {
      const chance = clamp(0.3 + (rel.lealdade - 45) / 80 + (e.reputacao ?? 0) / 300, 0.15, 0.9);
      if (!r.chance(chance)) {
        if (r.chance(0.5) && propor(v, o, 1)) return { texto: `Disseram que ainda não. Antes, querem ver você cumprir uma tarefa (ela chegou em Encomendas).`, tom: undefined };
        lembrarOrg(rel, v.t, 'conflito', -3);
        return { texto: 'Disseram que não. Por enquanto, você é de fora.', tom: 'ruim' };
      }
      rel.relacao = 'membro';
      delete rel.saiu;
      definirNivel(v, rel, 0);
      lembrarOrg(rel, v.t, 'alianca', 6);
      const es = (e.especializacoes ??= {});
      if (o.ramo === 'organizado' && (!es.organizado || es.organizado.largou !== undefined)) { es.organizado = { tInicio: v.t, experiencia: es.organizado?.experiencia ?? 10, nome: es.organizado?.nome ?? 5, operacoes: es.organizado?.operacoes ?? 0, falhas: es.organizado?.falhas ?? 0, ganhos: es.organizado?.ganhos ?? 0, posto: 1 }; }
      marco(v, `Entrou para ${o.nome}: ${nomeDoNivel(o, 0)}.`);
      return { texto: `Você agora é de ${o.nome} — ${nomeDoNivel(o, 0)}. Uma parte do que ela faz passa a ser sua; o que ela espera de você, também.`, tom: 'bom' };
    }
    case 'tarefa': {
      const x = propor(v, o);
      return { texto: x ? `${cap(o.nome)} tinha uma coisa para você. A proposta está em Encomendas.` : 'Não havia nada agora.' };
    }
    case 'promocao': {
      const chance = clamp(0.25 + rel.lealdade / 200 + garantirXp(v) / 400 - n * 0.07, 0.1, 0.85);
      if (r.chance(chance)) return { texto: promover(v, o, rel, 'O pedido foi aceito.'), tom: 'bom' };
      lembrarOrg(rel, v.t, 'conflito', -4);
      return { texto: '"Ainda não." O pedido ficou lembrado — volte a pedir daqui a um ano, com mais para mostrar.', tom: 'ruim' };
    }
    case 'sair': {
      const negociado = r.chance(clamp(0.55 + rel.lealdade / 200 - n * 0.08, 0.15, 0.9));
      rel.saiu = v.t;
      if (o.ramo === 'organizado' && e.especializacoes?.organizado) e.especializacoes.organizado.largou = v.t;
      if (negociado) { lembrarOrg(rel, v.t, 'saida', -3); anotar(v, `Saiu de ${o.nome} sem guerra.`, 'bom'); return { texto: `Aceitaram a sua saída. Ninguém sai de verdade — mas ninguém vai bater na sua porta.` }; }
      lembrarOrg(rel, v.t, 'traicao', -20);
      v.fatos['pressao_grupo'] = v.t;
      abalar(v, 'a saída mal recebida', -6, 10);
      anotar(v, `${cap(o.nome)} não aceitou a sua saída.`, 'ruim');
      return { texto: 'Você disse que estava fora. A resposta foi o silêncio — e um recado, depois.', tom: 'ruim' };
    }
    case 'apoiar': case 'neutro': {
      o.disputa!.apoio = oque === 'apoiar' ? alvo : undefined;
      const m = o.quadro.find(x => x.id === alvo);
      return { texto: oque === 'apoiar' ? `Você deixou claro que está com ${m?.nome}. Se ${m?.nome} ganhar, lembra; se perder, quem ganhou também lembra.` : 'Você ficou de fora da disputa. Ninguém ganha nada com você — nem perde.' };
    }
    case 'disputar':
      o.disputa!.candidatos.push('jogador');
      e.exposicao = clamp(e.exposicao + 6);
      historia(o, v.t, 'Você entrou na disputa pelo comando.');
      return { texto: `Você se colocou na disputa pelo comando de ${o.nome}. A resposta chega em um ano — e depende de quem está com você.` };
    case 'prioridade_expandir': case 'prioridade_consolidar': case 'prioridade_discricao': case 'prioridade_negocios': {
      o.prioridade = oque.replace('prioridade_', '') as OrgViva['prioridade'];
      const T = { expandir: 'crescer: mais gente, mais presença — e mais olhos em cima', consolidar: 'arrumar a casa: menos crescimento, mais união', discricao: 'sumir do radar: menos dinheiro, menos pressão', negocios: 'fazer dinheiro: mais renda, a força parada' } as const;
      return { texto: `A prioridade de ${o.nome}, neste ano, é ${T[o.prioridade!]}.` };
    }
    case 'mediar':
      pagarPorFora(v, 'custos', custoDeComando(v, o));
      o.coesao = clamp(o.coesao + 14);
      return { texto: 'Você sentou com os lados, ouviu, pagou o que precisava ser pago. A casa ficou mais calma.', tom: 'bom' };
    case 'alianca': {
      const b = orgViva(v, alvo!)!;
      if (r.chance(clamp(0.35 + (b.rivais.includes(o.id) ? -0.2 : 0) + (o.forca - b.forca) / 200, 0.1, 0.8))) { relacionar(o, b, 'aliada'); historia(o, v.t, `Aliança com ${b.nome}, negociada por você.`); return { texto: `${cap(b.nome)} topou o acordo.`, tom: 'bom' }; }
      return { texto: `${cap(b.nome)} recusou${b.rivais.includes(o.id) ? ': a rivalidade é velha demais' : ''}.`, tom: 'ruim' };
    }
    case 'romper': {
      const b = orgViva(v, alvo!)!;
      relacionar(o, b, 'rival');
      historia(o, v.t, `A aliança com ${b.nome} acabou (decisão sua).`);
      return { texto: `A aliança com ${b.nome} acabou. Agora são rivais.`, tom: 'ruim' };
    }
    case 'presenca': {
      pagarPorFora(v, 'custos', custoDeComando(v, o) * 2);
      const reg = alvo ?? regiaoDaPessoa(v);
      o.influencia[reg] = clamp((o.influencia[reg] ?? 0) + 12);
      o.pressao = clamp(o.pressao + 5);
      e.exposicao = clamp(e.exposicao + 5);
      const k = `${o.municipioId}:${reg}`;
      const com = garantirMundo(v).comunidade ??= {};
      com[k] = clamp((com[k] ?? 40) + 4);
      return { texto: `${cap(o.nome)} passou a se fazer mais presente em ${nomeDaRegiao(o.municipioId, reg)}. Quem mora lá reparou — e não ficou parado.` };
    }
    case 'recolher':
      o.pressao = clamp(o.pressao - 18);
      o.prioridade = 'discricao';
      e.exposicao = clamp(e.exposicao - 6);
      return { texto: 'Você mandou recolher: menos movimento, menos telefone, menos gente nova. A pressão baixou; o dinheiro do ano também vai baixar.' };
  }
  return { texto: '' };
}

/** Uma proposta de trabalho da organização (fica em Encomendas). */
const propor = (v: Vida, o: OrgViva, g?: 1 | 2 | 3) => !!proporEncomenda(v, rngDe(v.id, 'tarefa_org', o.id, v.t), o.ramo, { orgId: o.id }, g);

/* ================================================================ a leitura (a tela) */

export function leituraDasOrganizacoes(v: Vida) {
  const e = env(v);
  if (!e) return [];
  const minhaRegiao = regiaoDaPessoa(v);
  const ids = new Set([...(e.organizacoes ?? []).map(x => x.id), ...orgsDaCidade(v).map(x => x.id)]);
  const LEMBRA: Record<string, string> = { promessa: 'promessa cumprida', promessa_quebrada: 'promessa quebrada', alianca: 'aliança', conflito: 'conflito', traicao: 'traição', saida: 'saída', favor: 'favor', reconciliacao: 'reconciliação' };
  return [...ids].map(id => {
    const o = orgViva(v, id);
    const rel = e.organizacoes?.find(x => x.id === id);
    if (!o) return undefined;
    const n = rel ? nivelDe(v, rel) : -1;
    const l = lider(o);
    return {
      id, nome: o.nome, estilo: NOME_DO_ESTILO[o.estilo], ramo: NOME_DO_RAMO[o.ramo], estado: o.estado,
      vinculo: vinculoComOrg(rel), nomeVinculo: NOME_DO_VINCULO[vinculoComOrg(rel)], conhecida: !!rel,
      nivel: n, posto: n >= 0 ? nomeDoNivel(o, n) : undefined, proximoPosto: n >= 0 && n < 6 ? nomeDoNivel(o, n + 1) : undefined,
      lealdade: rel?.lealdade ?? 0, forca: o.forca, coesao: o.coesao, pressao: o.pressao, lider: l?.nome, propria: !!rel?.propria,
      hierarquia: HIERARQUIA[o.estilo],
      quadro: o.quadro.filter(x => x.estado === 'ativo').sort((a, b) => b.nivel - a.nivel).slice(0, 5).map(x => ({ nome: x.nome, posto: nomeDoNivel(o, x.nivel) })),
      aliadas: o.aliadas.map(x => orgViva(v, x)?.nome).filter(Boolean) as string[], rivais: o.rivais.map(x => orgViva(v, x)?.nome).filter(Boolean) as string[],
      territorio: regioesDe(o.municipioId).map(reg => ({ id: reg.id, nome: reg.nome, influencia: o.influencia[reg.id] ?? 0, comunidade: v.mundoCriminal?.comunidade?.[`${o.municipioId}:${reg.id}`] ?? 40, sua: reg.id === minhaRegiao && o.municipioId === v.moradia.municipioId })),
      disputa: o.disputa ? { motivo: o.disputa.motivo, candidatos: o.disputa.candidatos.map(c => ({ id: c, nome: c === 'jogador' ? 'você' : o.quadro.find(x => x.id === c)?.nome ?? 'alguém' })), apoio: o.disputa.apoio } : undefined,
      prioridade: o.prioridade, parte: n >= 0 && !rel?.propria && rel?.relacao === 'membro' ? parteDoAno(v, o, n) : undefined,
      lembra: rel ? [...new Set(rel.memoria.slice(-6))].map(m => `${anoDe(m.t)} · ${LEMBRA[m.fato]}`) : [],
      historia: o.historia.slice(-6).reverse().map(h => ({ ano: anoDe(h.t), texto: h.texto })),
      cidade: municipio(o.municipioId).nome, daqui: o.municipioId === v.moradia.municipioId
    };
  }).filter((x): x is NonNullable<typeof x> => !!x && (x.conhecida || x.daqui))
    .sort((a, b) => Number(b.vinculo === 'lideranca' || b.vinculo === 'integrante') - Number(a.vinculo === 'lideranca' || a.vinculo === 'integrante') || Number(b.conhecida) - Number(a.conhecida) || b.forca - a.forca);
}

/** A influência na região onde a pessoa mora (para o abrigo do foragido e o risco do bairro). */
export function influenciaAqui(v: Vida): { org: OrgViva; influencia: number; rel?: RelacaoComOrganizacao }[] {
  const reg = regiaoDaPessoa(v);
  return orgsDaCidade(v).map(o => ({ org: o, influencia: o.influencia[reg] ?? 0, rel: env(v)?.organizacoes?.find(x => x.id === o.id) })).filter(x => x.influencia > 0).sort((a, b) => b.influencia - a.influencia);
}

export { NOME_DO_PAPEL };
