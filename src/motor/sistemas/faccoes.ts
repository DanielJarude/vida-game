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
import type { EstadoEntreOrgs, MembroDaOrg, MundoCriminal, OrgViva, PerfilDeOrg, Ramo, RelacaoComOrganizacao, Vida } from '../tipos';
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
import { reputacaoAqui } from './mercadoCriminal';

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

/* ================================================================ REWORK 12.35 · o jeito de cada organização */

/**
 * O PERFIL muda o que a organização FAZ, não só o nome: o quanto a rivalidade vira guerra (`escala`), o quanto aceita
 * conversar (`negocia`), o que paga a quem é de dentro (`paga`), o quanto atrai a polícia (`policia`), o quanto aceita
 * gente nova (`recruta`), o quanto o comando é contestado (`contesta`) e como responde a quem trai (`traicao`).
 */
export const PERFIS_DE_ORG: Record<PerfilDeOrg, { nome: string; escala: number; negocia: number; paga: number; policia: number; recruta: number; contesta: number; traicao: 'expulsa' | 'cobra' | 'esquece'; frase: string }> = {
  territorial: { nome: 'territorial', escala: 1.3, negocia: 0, paga: 1, policia: 1.1, recruta: 0.05, contesta: 1, traicao: 'cobra', frase: 'vive do pedaço que ocupa: briga por bairro, cobra presença' },
  economica: { nome: 'de negócios', escala: 0.7, negocia: 0.15, paga: 1.2, policia: 0.9, recruta: 0, contesta: 0.9, traicao: 'expulsa', frase: 'pensa em dinheiro primeiro: prefere o acordo à guerra, paga melhor' },
  agressiva: { nome: 'agressiva', escala: 1.6, negocia: -0.15, paga: 1.05, policia: 1.35, recruta: 0.1, contesta: 1.2, traicao: 'cobra', frase: 'responde a tudo com força: cresce rápido, atrai a polícia, não perdoa' },
  discreta: { nome: 'discreta', escala: 0.6, negocia: 0.1, paga: 0.85, policia: 0.6, recruta: -0.1, contesta: 0.8, traicao: 'expulsa', frase: 'some do radar: ganha menos, aparece menos, desconfia de gente nova' },
  hierarquica: { nome: 'hierárquica', escala: 1, negocia: 0.05, paga: 1, policia: 1, recruta: -0.05, contesta: 0.6, traicao: 'cobra', frase: 'cada um no seu lugar: o comando pesa, sair da linha custa caro' },
  fragmentada: { nome: 'fragmentada', escala: 1.1, negocia: 0, paga: 0.95, policia: 1, recruta: 0.15, contesta: 1.6, traicao: 'esquece', frase: 'vários grupos sob um nome: entra-se fácil, o comando vive contestado' }
};
const PERFIS_DO_ESTILO: Record<OrgViva['estilo'], PerfilDeOrg[]> = {
  faccao: ['territorial', 'hierarquica', 'agressiva'], familia: ['hierarquica', 'discreta', 'economica'], rede: ['economica', 'discreta', 'fragmentada'],
  circulo: ['discreta', 'economica', 'hierarquica'], coletivo: ['fragmentada', 'discreta', 'economica'], turma: ['agressiva', 'fragmentada', 'territorial'],
  sindicato: ['economica', 'hierarquica', 'territorial']
};
/** O perfil (o registrado; nos saves antigos, derivado do estilo e do id — estável). */
export function perfilDe(o: OrgViva): PerfilDeOrg {
  if (o.perfil) return o.perfil;
  const xs = PERFIS_DO_ESTILO[o.estilo];
  o.perfil = xs[Math.floor(rngDe('perfil_org', o.id).next() * xs.length) % xs.length];
  return o.perfil;
}
export const jeitoDe = (o: OrgViva) => PERFIS_DE_ORG[perfilDe(o)];

/** A lealdade de um nome do quadro (derivada e estável nos saves antigos) e a ambição. */
export function lealdadeDoMembro(m: MembroDaOrg): number {
  if (m.lealdade === undefined) m.lealdade = 35 + Math.round(rngDe('membro_leal', m.id).next() * 45);
  return m.lealdade;
}
export function ambicaoDoMembro(m: MembroDaOrg): number {
  if (m.ambicao === undefined) m.ambicao = Math.round(rngDe('membro_amb', m.id).next() * 100) / 100;
  return m.ambicao;
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

/* ================================================================ REWORK 12.3 · A2: as relações entre organizações */

export const NOME_DO_ESTADO_ENTRE: Record<EstadoEntreOrgs, string> = {
  alianca: 'aliadas', cooperacao: 'cooperando num negócio', neutralidade: 'neutras', concorrencia: 'concorrentes', rivalidade: 'rivais',
  tregua: 'em trégua', conflito: 'em conflito aberto', ruptura: 'romperam'
};
/** O estado entre duas organizações (o registrado; nos saves antigos, o das listas). */
export function estadoEntre(a: OrgViva, b: OrgViva): EstadoEntreOrgs {
  const x = a.relacoes?.[b.id];
  if (x) return x;
  return a.aliadas.includes(b.id) ? 'alianca' : a.rivais.includes(b.id) ? 'rivalidade' : a.ramo === b.ramo ? 'concorrencia' : 'neutralidade';
}
/** Muda o estado (nos dois lados) e mantém as listas de aliadas e rivais coerentes. */
export function definirEstado(a: OrgViva, b: OrgViva, e: EstadoEntreOrgs): void {
  (a.relacoes ??= {})[b.id] = e;
  (b.relacoes ??= {})[a.id] = e;
  relacionar(a, b, e === 'alianca' || e === 'cooperacao' ? 'aliada' : e === 'rivalidade' || e === 'conflito' || e === 'ruptura' ? 'rival' : 'nada');
}

/** O que muda de um ano para o outro (as probabilidades saem do estado, da força e da disputa pelo mesmo espaço). */
function proximoEstado(a: OrgViva, b: OrgViva, e: EstadoEntreOrgs, r: Rng): EstadoEntreOrgs {
  const disputam = Object.keys(a.influencia).some(k => (a.influencia[k] ?? 0) >= 20 && (b.influencia[k] ?? 0) >= 20);
  const fortes = a.forca >= 40 && b.forca >= 40;
  // REWORK 12.35: o perfil de cada lado pesa (a agressiva esquenta a rivalidade; a discreta e a de negócios esfriam).
  const escala = Math.sqrt(jeitoDe(a).escala * jeitoDe(b).escala);
  const conversa = (jeitoDe(a).negocia + jeitoDe(b).negocia) / 2;
  const x = r.next();
  if (e === 'rivalidade') return x < (disputam && fortes ? 0.12 : 0.04) * escala ? 'conflito' : x > 0.93 - conversa * 0.3 ? 'tregua' : x > 0.9 - conversa * 0.3 ? 'concorrencia' : e;
  if (e === 'conflito') return x < 0.35 / escala + conversa ? 'tregua' : e;
  switch (e) {
    case 'neutralidade': return a.ramo === b.ramo ? (x < 0.08 ? 'concorrencia' : e) : x < 0.05 ? 'cooperacao' : x < 0.07 ? 'concorrencia' : e;
    case 'concorrencia': return x < (disputam ? 0.12 : 0.06) ? 'rivalidade' : x > 0.95 ? 'neutralidade' : e;
    case 'tregua': return x < 0.25 ? 'neutralidade' : x > 0.88 ? 'conflito' : e;
    case 'alianca': return x < 0.04 ? 'ruptura' : x > 0.96 ? 'neutralidade' : e;
    case 'cooperacao': return x < 0.4 ? 'neutralidade' : x > 0.9 ? 'alianca' : e;
    case 'ruptura': return 'rivalidade';
  }
}

const FRASE_DA_MUDANCA: Partial<Record<EstadoEntreOrgs, (a: string, b: string) => string>> = {
  conflito: (a, b) => `${a} e ${b} entraram em conflito aberto.`,
  tregua: (a, b) => `${a} e ${b} fizeram uma trégua.`,
  ruptura: (a, b) => `A aliança entre ${a} e ${b} acabou mal.`,
  alianca: (a, b) => `${a} e ${b} fecharam uma aliança.`,
  cooperacao: (a, b) => `${a} e ${b} passaram a dividir um negócio.`,
  rivalidade: (a, b) => `${a} e ${b} viraram rivais.`,
  concorrencia: (a, b) => `${a} e ${b} passaram a disputar o mesmo mercado.`,
  neutralidade: (a, b) => `${a} e ${b} deixaram as diferenças de lado.`
};

/** O ano das relações de uma cidade: cada par uma vez; o conflito custa; quem é de dentro de um dos lados fica sabendo. */
function evoluirRelacoes(v: Vida, municipioId: string): void {
  const os = orgsDaCidade(v, municipioId);
  const e = env(v);
  for (let i = 0; i < os.length; i++) for (let j = i + 1; j < os.length; j++) {
    const a = os[i], b = os[j];
    const r = rngDe(v.id, 'rel_orgs', a.id, b.id, v.t);
    const antes = estadoEntre(a, b);
    if (antes === 'conflito') {
      // O conflito (abstrato): os dois lados perdem força e gente presa; a cidade fica mais vigiada.
      for (const o of [a, b]) { o.forca = clamp(o.forca - 5); o.pressao = clamp(o.pressao + 8); o.coesao = clamp(o.coesao - 2); }
      guerraDoAno(v, a, b, r);
    }
    const depois = proximoEstado(a, b, antes, r);
    if (depois === antes) continue;
    definirEstado(a, b, depois);
    const frase = FRASE_DA_MUDANCA[depois]?.(cap(a.nome), b.nome) ?? '';
    historia(a, v.t, frase); historia(b, v.t, frase);
    // Quem é de dentro (ou aliado) de um dos lados vive isso.
    const minha = (e?.organizacoes ?? []).find(x => (x.id === a.id || x.id === b.id) && (x.relacao === 'membro' || x.propria) && x.saiu === undefined && x.expulso === undefined);
    if (minha && ativo(v) && !preso(v)) {
      anotar(v, frase, depois === 'conflito' || depois === 'ruptura' ? 'ruim' : depois === 'tregua' || depois === 'alianca' ? 'bom' : undefined);
      if (depois === 'conflito') {
        // Quem está na moita fica fora da linha de frente: a guerra não pesa na exposição dele.
        if (!e!.cautela) e!.exposicao = clamp(e!.exposicao + 3);
        escrever(v, { texto: contrair(`${frase.replace(/\.$/, '')} — e você é de dentro de ${minha.nome}. O bairro ficou mais tenso; todo mundo anda olhando para os lados.`), relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      } else if (depois === 'tregua' || depois === 'ruptura' || depois === 'alianca') escrever(v, { texto: contrair(frase), relevancia: 'cotidiano', tema: 'trabalho' });
    }
  }
}

/**
 * REWORK 12.35 · o ano de uma guerra, do lado do mundo (com ou sem o jogador): quem ganha terreno na região disputada,
 * quem perde gente do quadro (preso ou morto, com nome) — e a história de cada uma registra.
 */
function guerraDoAno(v: Vida, a: OrgViva, b: OrgViva, r: Rng): void {
  const peso = (o: OrgViva) => o.forca * (0.85 + jeitoDe(o).escala * 0.15) * (0.8 + o.coesao / 250);
  const [forte, fraca] = peso(a) + (r.next() - 0.5) * 30 >= peso(b) ? [a, b] : [b, a];
  const reg = Object.keys(fraca.influencia).sort((x, y) => (forte.influencia[y] ?? 0) - (forte.influencia[x] ?? 0))[0];
  if (reg) {
    const ganho = Math.min(fraca.influencia[reg] ?? 0, 6 + r.int(0, 6));
    fraca.influencia[reg] = clamp((fraca.influencia[reg] ?? 0) - ganho);
    forte.influencia[reg] = clamp((forte.influencia[reg] ?? 0) + Math.round(ganho * 0.7));
  }
  for (const o of [a, b]) {
    if (!r.chance(o === fraca ? 0.35 : 0.18)) continue;
    const alvos = o.quadro.filter(x => x.estado === 'ativo' && x.nivel <= 4 && !x.pessoaId);
    const m = alvos.length ? r.pick(alvos) : undefined;
    if (!m) continue;
    const outra = o === a ? b : a;
    if (r.chance(0.45)) { m.estado = 'morto'; m.causa = `na guerra com ${outra.nome}`; historia(o, v.t, `${m.nome} morreu na guerra com ${outra.nome}.`); }
    else { m.estado = 'preso'; m.causa = `preso na guerra com ${outra.nome}`; historia(o, v.t, `${m.nome} foi pres${m.genero === 'feminino' ? 'a' : 'o'} no meio da guerra com ${outra.nome}.`); }
  }
}

export function historia(o: OrgViva, t: number, texto: string): void {
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

/**
 * O posto (0..6) de quem é de dentro. REWORK 12.35 · D6: a fonte única é `rel.nivel` (o posto do ramo organizado do 11.5
 * virou espelho dele; os saves antigos o trazem para cá uma vez, em `normalizarRework1235`).
 */
export function nivelDe(_v: Vida, rel: RelacaoComOrganizacao): number {
  if (rel.propria) return 6;
  if (rel.relacao !== 'membro') return rel.nivel ?? -1;
  return rel.nivel ?? 0;
}

export function definirNivel(v: Vida, rel: RelacaoComOrganizacao, nivel: number): void {
  rel.nivel = clamp(Math.round(nivel), 0, 6);
  const e = env(v);
  if (e) e.postoUnificado = true;
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
  // REWORK 12.35 · AUTONOMIA: o mundo do crime continua sem o jogador (quem herdou, quem nunca entrou, quem saiu): as
  // organizações já conhecidas seguem o ano delas — sem a parte do jogador.
  if (!e) { if (v.mundoCriminal && Object.keys(v.mundoCriminal.orgs).length) anoDoMundo(v); return; }
  garantirCidade(v);
  const m = garantirMundo(v);
  for (const o of orgsDoMundo(v)) if (o.estado !== 'extinta') anoDaOrg(v, o);
  for (const cid of new Set(orgsDoMundo(v).map(o => o.municipioId))) evoluirRelacoes(v, cid);
  renovarCidade(v);
  anoDaComunidade(v);
  m.tAtualizado = v.t;
  anoDoJogadorNasOrgs(v);
  cenasDoAno(v);
}

function anoDoMundo(v: Vida): void {
  const m = v.mundoCriminal!;
  for (const o of orgsDoMundo(v)) if (o.estado !== 'extinta') anoDaOrg(v, o);
  for (const cid of new Set(orgsDoMundo(v).map(o => o.municipioId))) evoluirRelacoes(v, cid);
  renovarCidade(v);
  anoDaComunidade(v);
  m.tAtualizado = v.t;
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
  // Uma operação da Justiça (o ano em que a pressão vira ação). REWORK 12.35: de tipos diferentes — a prisão de gente do
  // quadro, da liderança, a busca num território, o bloqueio do patrimônio, o desmantelamento —, pelo tamanho da pressão
  // e pelo jeito da organização (a discreta atrai menos; a agressiva, mais; quem tem informante dentro, muito mais).
  const informantes = o.quadro.filter(x => x.informante !== undefined && (x.estado === 'ativo' || x.estado === 'preso')).length;
  if (r.chance(o.pressao / 300 * jeitoDe(o).policia * (1 + informantes * 0.6))) operacao(v, o, r, informantes > 0);
  // O quadro: a idade, a saída, a promoção de quem fica; a entrada de gente nova quando a força cresce.
  for (const x of o.quadro) {
    if (x.estado !== 'ativo') continue;
    const i = anoDe(v.t - x.tNasc);
    if (r.chance(i >= 70 ? 0.07 : i >= 55 ? 0.02 : 0.006)) { x.estado = 'morto'; historia(o, v.t, `${x.nome} morreu.`); continue; }
    if (r.chance(i >= 62 ? 0.08 : 0.02)) { x.estado = 'saiu'; historia(o, v.t, `${x.nome} deixou ${o.nome}.`); continue; }
    if (x.nivel < 5 && r.chance(0.06)) x.nivel++;
    // REWORK 12.35: a lealdade de cada um anda com a casa (a união, a pressão, o dinheiro); quem já não acredita nela, com a
    // polícia em cima, pode passar a colaborar — ninguém sabe até aparecer.
    x.lealdade = clamp(Math.round(lealdadeDoMembro(x) + (o.coesao - 50) / 12 + (o.prioridade === 'negocios' ? 1 : 0) - (o.pressao >= 60 ? 2 : 0) + (r.next() - 0.5) * 6));
    if (x.informante === undefined && x.lealdade < 22 && o.pressao >= 45 && r.chance(0.08)) { x.informante = v.t; o.pressao = clamp(o.pressao + 6); }
  }
  // Quem está preso e já não deve nada à casa pode falar (a delação de dentro).
  for (const x of o.quadro) if (x.estado === 'preso' && x.informante === undefined && lealdadeDoMembro(x) < 40 && r.chance(0.12)) { x.informante = v.t; o.pressao = clamp(o.pressao + 8); }
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
  // (REWORK 12.3 · A2: as alianças e rivalidades mudam em `evoluirRelacoes`, uma vez por par, pelo estado de cada par.)
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

function operacao(v: Vida, o: OrgViva, r: Rng, comInformante: boolean): void {
  const ativos = o.quadro.filter(x => x.estado === 'ativo');
  const tipo: NonNullable<OrgViva['operacao']>['tipo'] = o.pressao >= 80 && (o.forca < 45 || comInformante) && r.chance(0.35) ? 'desmantelamento'
    : o.pressao >= 60 && r.chance(0.3) ? 'lideranca' : r.chance(0.25) ? 'busca' : r.chance(0.25) ? 'patrimonio' : 'integrantes';
  o.operacao = { t: v.t, tipo };
  const prende = (m: MembroDaOrg | undefined, porque: string) => { if (!m) return; m.estado = 'preso'; m.causa = porque; };
  switch (tipo) {
    case 'integrantes': {
      const alvo = r.pick(ativos.slice(0, 6));
      prende(alvo, 'preso numa operação');
      o.forca = clamp(o.forca - 8); o.pressao = clamp(o.pressao - 15);
      if (alvo) historia(o, v.t, `Uma operação levou ${alvo.nome} (${nomeDoNivel(o, alvo.nivel)}).`);
      break;
    }
    case 'lideranca': {
      const l = lider(o) ?? ativos.sort((a, b) => b.nivel - a.nivel)[0];
      prende(l, 'preso numa operação contra o comando');
      o.forca = clamp(o.forca - 12); o.pressao = clamp(o.pressao - 20); o.coesao = clamp(o.coesao - 8);
      if (l) historia(o, v.t, `Uma operação contra o comando levou ${l.nome} (${nomeDoNivel(o, l.nivel)}).`);
      break;
    }
    case 'busca': {
      const reg = Object.keys(o.influencia).sort((a, b) => (o.influencia[b] ?? 0) - (o.influencia[a] ?? 0))[0];
      if (reg) o.influencia[reg] = clamp((o.influencia[reg] ?? 0) - 15);
      o.forca = clamp(o.forca - 5); o.pressao = clamp(o.pressao - 10);
      historia(o, v.t, `Uma operação vasculhou ${reg ? nomeDaRegiao(o.municipioId, reg) : 'a cidade'} atrás de gente de ${o.nome}.`);
      break;
    }
    case 'patrimonio':
      o.forca = clamp(o.forca - 10); o.pressao = clamp(o.pressao - 12);
      historia(o, v.t, `Uma operação bloqueou dinheiro e bens ligados a ${o.nome}.`);
      break;
    case 'desmantelamento': {
      const levados = ativos.filter(() => r.chance(0.5)).slice(0, 4);
      for (const m of levados) prende(m, 'preso no desmantelamento');
      o.forca = clamp(Math.round(o.forca * 0.4)); o.pressao = clamp(o.pressao - 35); o.coesao = clamp(o.coesao - 15);
      o.estado = o.forca < 8 ? 'extinta' : 'enfraquecida';
      historia(o, v.t, o.estado === 'extinta' ? `Uma operação grande desmantelou ${o.nome}: ${levados.length} presos, o resto se espalhou.` : `Uma operação grande quase acabou com ${o.nome}: ${levados.length} presos.`);
      break;
    }
  }
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

export function abrirDisputa(v: Vida, o: OrgViva, r: Rng, motivo: string): void {
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
  // REWORK 12.3 · A4: o racha é de verdade — quem perdeu sai com gente e funda outra organização, rival da de origem.
  const perdedor = jeito.includes('racha') ? d.candidatos.find(c => c !== vencedor && c !== 'jogador') : undefined;
  if (perdedor) rachar(v, o, perdedor, d.apoio === perdedor);
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

/** O racha: o candidato que perdeu leva uma parte do quadro e funda uma organização nova, rival da de origem. */
export function rachar(v: Vida, o: OrgViva, perdedorId: string, apoiouPerdedor: boolean): void {
  const m = o.quadro.find(x => x.id === perdedorId);
  if (!m) return;
  const id = `racha_${o.id}_${v.t}`;
  if (orgViva(v, id)) return;
  const nova = criarOrgViva(v, o.municipioId, o.ramo, id);
  nova.rachaDe = { id: o.id, t: v.t };
  nova.forca = Math.max(12, Math.round(o.forca * 0.4));
  // Quem foi junto: o perdedor no comando e até dois do quadro (que saem da organização de origem).
  const foram = o.quadro.filter(x => x.estado === 'ativo' && x.id !== m.id && x.nivel <= 4).slice(-2);
  m.estado = 'saiu';
  for (const x of foram) x.estado = 'saiu';
  nova.quadro = [{ ...m, id: `${id}_m0`, nivel: 6, estado: 'ativo', desde: v.t, pessoaId: m.pessoaId }, ...foram.map((x, k) => ({ ...x, id: `${id}_m${k + 1}`, estado: 'ativo' as const, nivel: Math.min(5, x.nivel + 1) })), ...nova.quadro.filter(x => x.nivel <= 2).slice(0, 2)];
  definirEstado(o, nova, 'rivalidade');
  historia(o, v.t, `${m.nome} saiu com gente e fundou ${nova.nome}.`);
  historia(nova, v.t, `Nasceu de um racha em ${o.nome}, com ${m.nome} no comando.`);
  const rel = env(v)?.organizacoes?.find(x => x.id === o.id);
  if (rel && (rel.relacao === 'membro' || rel.relacao === 'aliada') && rel.saiu === undefined) {
    const texto = `${cap(o.nome)} rachou: ${m.nome} saiu com gente e fundou ${nova.nome}.${apoiouPerdedor ? ` Você apoiou ${m.nome} — e ${m.nome} lembra.` : ''}`;
    anotar(v, texto, 'ruim');
    escrever(v, { texto: contrair(texto), relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    if (apoiouPerdedor) { const nr = relacaoCom(v, nova); nr.relacao = 'aliada'; nr.lealdade = 55; lembrarOrg(nr, v.t, 'alianca', 0); }
  }
}

/* ================================================================ o jogador nas organizações */

/** A parte que cabe a quem é de dentro (pelo posto, pela força, pela influência, pela prioridade) — ou o que custa o ano. */
export function parteDoAno(_v: Vida, o: OrgViva, nivel: number): number {
  const base = [0.5, 1, 2, 4, 12, 30, 90][clamp(nivel, 0, 6)] * 6000;
  const infl = Object.values(o.influencia).reduce((s, x) => s + x, 0) / Math.max(1, regioesDe(o.municipioId).length);
  const pr = o.prioridade === 'negocios' ? 1.25 : o.prioridade === 'discricao' ? 0.6 : 1;
  return Math.round(base * (o.forca / 50) * (1 + infl / 150) * pr * jeitoDe(o).paga * economiaLocal(o.municipioId).custo / 100) * 100;
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
  atualizarDistancias(v);
  vigiarDuplaLealdade(v);
  for (const rel of e.organizacoes ?? []) {
    if (rel.saiu !== undefined || rel.expulso !== undefined) continue;
    const o = orgViva(v, rel.id);
    if (!o || o.estado === 'extinta') continue;
    if (rel.relacao !== 'membro' && !rel.propria) continue;
    const n = nivelDe(v, rel);
    if (rel.nivel === undefined && !rel.propria) definirNivel(v, rel, n);
    // REWORK 12.3 · A6: de fora do alcance, o vínculo não se apaga — mas não rende, e a confiança esfria.
    if (rel.distancia === 'fora') { rel.lealdade = clamp(rel.lealdade - 5); continue; }
    const longe = rel.distancia === 'longe' ? 0.5 : 1;
    // A parte do ano (a organização própria já paga pelos negócios dela: `clandestinos`).
    if (!rel.propria) {
      const seco = r.chance(o.coesao < 35 ? 0.35 : 0.15);
      // REWORK 12.35: quem dividiu o comando (a contestação) leva menos por três anos.
      const dividido = v.fatos['comando_dividido'] !== undefined && v.t - v.fatos['comando_dividido'] < 36 ? 0.75 : 1;
      const parte = seco ? 0 : Math.round(parteDoAno(v, o, n) * longe * dividido * (0.7 + r.next() * 0.6) / 100) * 100;
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

/* ================================================================ REWORK 12.3 · A6: a distância (mudança de cidade e de país) */

/** Até onde uma organização chega (pela força e pelo estilo; as redes e os coletivos atravessam fronteira mais fácil). */
export function alcanceDe(o: OrgViva): NonNullable<OrgViva['alcance']> {
  if (o.alcance) return o.alcance;
  const viaja = o.estilo === 'rede' || o.estilo === 'coletivo' || o.estilo === 'sindicato';
  return o.forca >= (viaja ? 60 : 80) ? 'internacional' : o.forca >= 50 ? 'nacional' : o.forca >= 28 ? 'regional' : 'local';
}
export const NOME_DO_ALCANCE: Record<NonNullable<OrgViva['alcance']>, string> = { local: 'só na cidade', regional: 'na região', nacional: 'no país inteiro', internacional: 'fora do país também' };

function distanciaPara(v: Vida, o: OrgViva): 'perto' | 'longe' | 'fora' {
  const aqui = v.moradia.municipioId;
  if (o.municipioId === aqui) return 'perto';
  let ma, mb;
  try { ma = municipio(o.municipioId); mb = municipio(aqui); } catch { return 'fora'; }
  const alc = alcanceDe(o);
  if (ma.pais !== mb.pais) return alc === 'internacional' ? 'longe' : 'fora';
  if (ma.uf === mb.uf) return alc === 'local' ? 'fora' : 'longe';
  return alc === 'nacional' || alc === 'internacional' ? 'longe' : 'fora';
}

/** A distância de cada vínculo de dentro, recalculada no ano — e dita quando muda (o vínculo nunca é apagado). */
function atualizarDistancias(v: Vida): void {
  for (const rel of env(v)?.organizacoes ?? []) {
    if (rel.saiu !== undefined || rel.expulso !== undefined || (rel.relacao !== 'membro' && rel.relacao !== 'aliada' && !rel.propria)) continue;
    const o = orgViva(v, rel.id);
    if (!o) continue;
    const d = distanciaPara(v, o);
    const antes = rel.distancia ?? 'perto';
    if (d === antes) { rel.distancia = d; continue; }
    rel.distancia = d;
    const txt = d === 'perto' ? `De volta perto de ${o.nome}: o vínculo voltou a ser do dia a dia.`
      : d === 'longe' ? `Longe de ${o.nome}, o vínculo continua — à distância (${NOME_DO_ALCANCE[alcanceDe(o)]}): menos parte, menos tarefas.`
        : `${cap(o.nome)} não chega aonde você está agora (${NOME_DO_ALCANCE[alcanceDe(o)]}). O vínculo fica, mas parado: não rende, e a confiança esfria a cada ano longe.`;
    anotar(v, txt, d === 'fora' ? 'ruim' : undefined);
    escrever(v, { texto: contrair(txt), relevancia: 'cotidiano', tema: 'trabalho' });
  }
}

/* ================================================================ REWORK 12.3 · A1: mais de uma organização */

/** As organizações de que se é de dentro agora. */
export const deDentro = (v: Vida) => (env(v)?.organizacoes ?? []).filter(o => (o.relacao === 'membro' || o.propria) && o.saiu === undefined && o.expulso === undefined);

/**
 * Ser de dentro de duas: entre aliadas, é ponte (as duas confiam um pouco mais); entre neutras, ninguém se importa muito;
 * entre concorrentes e rivais, cada ano aumenta a desconfiança — e o que é secreto pode vir à tona. Quando vem (ou quando
 * é aberto entre rivais), as duas cobram uma escolha (`sub123_dupla`).
 */
function vigiarDuplaLealdade(v: Vida): void {
  const e = env(v)!;
  const ds = deDentro(v);
  if (ds.length < 2) return;
  for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
    const ra = ds[i], rb = ds[j];
    const a = orgViva(v, ra.id), b = orgViva(v, rb.id);
    if (!a || !b) continue;
    const est = estadoEntre(a, b);
    if (est === 'alianca' || est === 'cooperacao') { ra.lealdade = clamp(ra.lealdade + 1); rb.lealdade = clamp(rb.lealdade + 1); continue; }
    const peso = est === 'conflito' || est === 'ruptura' ? 22 : est === 'rivalidade' ? 15 : est === 'concorrencia' || est === 'tregua' ? 8 : 3;
    const r = rngDe(v.id, 'dupla', a.id, b.id, v.t);
    for (const [rel, outra] of [[ra, rb], [rb, ra]] as const) {
      if (!outra.secreto) {
        // Aberto: quem é de dentro de uma rival declarada perde confiança todo ano.
        if (peso >= 15) rel.lealdade = clamp(rel.lealdade - 6);
        continue;
      }
      rel.suspeita = clamp((rel.suspeita ?? 0) + peso / 3 + e.exposicao / 20 + r.int(0, 4));
    }
    const descoberta = [ra, rb].some(x => (x.suspeita ?? 0) >= 60 || (x.suspeita ?? 0) / 300 > r.next());
    const abertaEntreRivais = !ra.secreto && !rb.secreto && peso >= 15;
    if ((descoberta || abertaEntreRivais) && !(v.fatos['sub123_dupla'] !== undefined && v.t - v.fatos['sub123_dupla'] < 24)) {
      if (descoberta) {
        for (const x of [ra, rb]) { x.secreto = false; x.suspeita = 0; }
        const texto = `${cap(a.nome)} e ${b.nome} descobriram que você é de dentro das duas.`;
        anotar(v, texto, 'ruim');
        escrever(v, { texto: contrair(texto), relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      }
      if (peso >= 8) { (e.cenas125 ??= {})['sub123_dupla'] = `${a.id}|${b.id}`; v.fatos['sub123_dupla'] = v.t; }
    }
  }
}

/** A resposta à cobrança (a cena `sub123_dupla`): ficar com uma, negar, ou propor ser a ponte. */
export function resolverDupla(v: Vida, fica: string | undefined, sai: string | undefined, como: 'escolher' | 'negar' | 'ponte'): string {
  const e = env(v)!;
  const ra = e.organizacoes?.find(x => x.id === fica), rb = e.organizacoes?.find(x => x.id === sai);
  const a = fica ? orgViva(v, fica) : undefined, b = sai ? orgViva(v, sai) : undefined;
  if (!ra || !rb || !a || !b) return 'Nada mudou.';
  const r = rngDe(v.id, 'dupla_resp', a.id, b.id, v.t);
  if (como === 'escolher') {
    const rival = ['rivalidade', 'conflito', 'ruptura'].includes(estadoEntre(a, b));
    rb.saiu = v.t;
    if (rival) { rb.expulso = v.t; lembrarOrg(rb, v.t, 'traicao', -20); v.fatos['pressao_grupo'] = v.t; }
    else lembrarOrg(rb, v.t, 'saida', -6);
    lembrarOrg(ra, v.t, 'alianca', 8);
    return rival ? `Você ficou com ${a.nome}. Em ${b.nome}, o seu nome virou o de quem foi embora para o outro lado — e isso não se esquece.` : `Você ficou com ${a.nome} e saiu de ${b.nome} sem briga.`;
  }
  if (como === 'negar') {
    if (r.chance(clamp(0.25 + (e.reputacao ?? 0) / 300, 0.15, 0.55))) { ra.lealdade = clamp(ra.lealdade - 4); rb.lealdade = clamp(rb.lealdade - 4); return 'Você negou, olhando nos olhos. Por enquanto, aceitaram — mas agora alguém observa.'; }
    const perde = ra.lealdade < rb.lealdade ? ra : rb;
    perde.expulso = v.t; perde.saiu = v.t; lembrarOrg(perde, v.t, 'traicao', -20);
    e.exposicao = clamp(e.exposicao + 6);
    return `Ninguém acreditou. ${cap(perde.nome)} pôs você para fora — e quem é expulso por isso fica marcado no meio.`;
  }
  const est = estadoEntre(a, b);
  if (est !== 'conflito' && est !== 'ruptura' && r.chance(clamp(0.3 + (e.reputacao ?? 0) / 250, 0.2, 0.7))) {
    definirEstado(a, b, 'cooperacao');
    ra.lealdade = clamp(ra.lealdade + 3); rb.lealdade = clamp(rb.lealdade + 3);
    historia(a, v.t, `${cap(a.nome)} e ${b.nome} passaram a fazer negócio por meio de você.`);
    return `Você propôs ser a ponte entre ${a.nome} e ${b.nome} — e as duas toparam fazer negócio por meio de você. Por enquanto.`;
  }
  ra.lealdade = clamp(ra.lealdade - 8); rb.lealdade = clamp(rb.lealdade - 8);
  return `A ideia de ser a ponte não colou: ${a.nome} e ${b.nome} querem saber de que lado você está.`;
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

export type OqueOrg = 'conversar' | 'filiar' | 'tarefa' | 'promocao' | 'sair' | 'apoiar' | 'disputar' | 'neutro' | 'prioridade_expandir' | 'prioridade_consolidar' | 'prioridade_discricao' | 'prioridade_negocios' | 'mediar' | 'alianca' | 'romper' | 'presenca' | 'recolher' | 'conhecer'
  /** REWORK 12.3: entrar sem que as outras saibam (A1); a reunião do grupo (A5); a trégua e a cooperação com outra organização (A2/A4). */
  | 'filiar_secreto' | 'reuniao' | 'tregua' | 'cooperar';

/**
 * REWORK 12.3 · A3: o que cada posto permite, de verdade (as ações e as propostas que o motor libera em cada nível).
 */
export const PODERES_DO_NIVEL: string[][] = [
  ['tarefas pequenas da organização', 'uma parte pequena do que ela faz', 'pedir para subir (uma vez por ano)'],
  ['ir às reuniões do grupo', 'trabalhos de tamanho médio', 'ser chamado para subir sem pedir'],
  ['encomendar trabalhos a outros', 'um caminho até o fórum (para o bem e para o mal)'],
  ['decisões internas: acalmar brigas, mandar recolher', 'gente sob o seu comando'],
  ['alianças, tréguas e cooperações com outras organizações', 'fazer-se presente numa região', 'disputar o comando'],
  ['o conselho: a voz na sucessão'],
  ['comandar: a prioridade do ano, tudo o que está acima']
];

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
  // REWORK 12.3 · A6: de fora do alcance, só conversar e sair; de longe, nada que peça estar presente.
  if (rel?.distancia === 'fora' && !['conversar', 'sair', 'conhecer'].includes(oque)) return bloqueio('incompativel', `Daqui, ${o.nome} não alcança você (${NOME_DO_ALCANCE[alcanceDe(o)]}): o vínculo está parado. Dá para conversar ou sair.`);
  if (rel?.distancia === 'longe' && ['presenca', 'mediar', 'reuniao'].includes(oque)) return bloqueio('incompativel', 'Isso pede estar na cidade dela.');
  switch (oque) {
    case 'conhecer': return rel ? bloqueio('incompativel', 'Você já sabe quem eles são.') : PERMITIDO;
    case 'conversar': return rel ? PERMITIDO : bloqueio('requisito', 'Primeiro, alguém precisa apresentar você.');
    case 'filiar':
      if (dentro) return bloqueio('incompativel', 'Você já é de dentro.');
      if (vinc === 'rival' || rel?.expulso !== undefined) return bloqueio('incompativel', 'Depois do que houve, essa porta está fechada.');
      if (!rel || rel.lealdade < 45) return bloqueio('requisito', 'Ninguém entra sem que confiem: falta lealdade (trabalhos, favores, tempo de aliança).');
      if (idade(v) < 18) return bloqueio('impossivel', 'Cedo demais.');
      {
        // REWORK 12.3 · A1: dá para ser de dentro de mais de uma — com consequência. Entre rivais, abertamente, é declarar lado.
        const outras = deDentro(v).filter(x => x.id !== orgId).map(x => orgViva(v, x.id)).filter((x): x is OrgViva => !!x);
        const rival = outras.find(x => ['rivalidade', 'conflito', 'ruptura'].includes(estadoEntre(o, x)));
        if (rival) return { grau: 'irregular', motivo: `É crime. E ${rival.nome}, de que você já é de dentro, é rival dela: entrar abertamente é declarar lado — as duas vão cobrar.` };
        if (outras.length) return { grau: 'irregular', motivo: `É crime. Você já é de dentro de ${outras.map(x => x.nome).join(' e ')}: ser de duas tem preço — e a confiança de cada uma passa a ser medida.` };
      }
      return { grau: 'irregular', motivo: 'É crime. De dentro: uma parte do que a organização faz, um posto para subir — e compromissos, a pressão que vem com ela, uma saída mais difícil.' };
    case 'filiar_secreto':
      if (dentro) return bloqueio('incompativel', 'Você já é de dentro.');
      if (!deDentro(v).some(x => x.id !== orgId)) return bloqueio('requisito', 'Só faz sentido esconder de quem você já é de dentro — e você não é de nenhuma.');
      if (vinc === 'rival' || rel?.expulso !== undefined) return bloqueio('incompativel', 'Depois do que houve, essa porta está fechada.');
      if (!rel || rel.lealdade < 50) return bloqueio('requisito', 'Para entrar em segredo, eles precisam confiar muito em você (lealdade 50 ou mais).');
      return { grau: 'irregular', motivo: 'É crime — e um segredo. Cada ano, a desconfiança cresce (mais entre rivais); se vier à tona, as duas cobram.' };
    case 'reuniao': return dentro && n >= 1 ? PERMITIDO : bloqueio('requisito', `As reuniões são de ${nomeDoNivel(o, 1)} para cima.`);
    case 'tregua': case 'cooperar': {
      const b = alvo ? orgViva(v, alvo) : undefined;
      if (!b || b.id === o.id || b.municipioId !== o.municipioId) return bloqueio('impossivel', 'Com quem?');
      if (n < 4 && !rel?.propria) return bloqueio('requisito', `Negociar com outra organização é de ${nomeDoNivel(o, 4)} para cima.`);
      const est = estadoEntre(o, b);
      if (oque === 'tregua') return est === 'conflito' || est === 'rivalidade' || est === 'ruptura' ? vereditoDePagar(v, custoDeComando(v, o), 'Sentar à mesa custa uns') : bloqueio('incompativel', `Não há guerra a parar: estão ${NOME_DO_ESTADO_ENTRE[est]}.`);
      return est === 'neutralidade' || est === 'concorrencia' || est === 'tregua' ? PERMITIDO : bloqueio('incompativel', `Agora não: estão ${NOME_DO_ESTADO_ENTRE[est]}.`);
    }
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
      return n >= 4 ? PERMITIDO : bloqueio('requisito', `Para disputar o comando, é preciso ser ${nomeDoNivel(o, 4)} ou mais.`);
  }
  // As da liderança.
  if (n < 3 && !rel?.propria) return bloqueio('requisito', `Isso é de ${nomeDoNivel(o, 3)} para cima.`);
  switch (oque) {
    case 'mediar': return o.coesao >= 55 ? bloqueio('incompativel', 'Não há briga interna para resolver agora.') : vereditoDePagar(v, custoDeComando(v, o), 'Acalmar os ânimos custa uns');
    case 'alianca': case 'romper': {
      const b = alvo ? orgViva(v, alvo) : undefined;
      if (!b || b.id === o.id || b.municipioId !== o.municipioId) return bloqueio('impossivel', 'Com quem?');
      if (n < 4 && !rel?.propria) return bloqueio('requisito', `Alianças são de ${nomeDoNivel(o, 4)} para cima.`);
      if (oque === 'alianca' && o.aliadas.includes(b.id)) return bloqueio('incompativel', 'Já são aliadas.');
      if (oque === 'romper' && !o.aliadas.includes(b.id)) return bloqueio('incompativel', 'Não há aliança a romper.');
      return PERMITIDO;
    }
    case 'presenca': return n >= 4 || rel?.propria ? vereditoDePagar(v, custoDeComando(v, o) * 2, 'Fazer-se presente custa uns') : bloqueio('requisito', `Onde a organização se faz presente é decisão de ${nomeDoNivel(o, 4)} para cima.`);
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
      const chance = clamp(0.3 + (rel.lealdade - 45) / 80 + reputacaoAqui(v) / 300 + jeitoDe(o).recruta, 0.15, 0.9);
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
      if (r.chance(clamp(0.35 + (b.rivais.includes(o.id) ? -0.2 : 0) + (o.forca - b.forca) / 200, 0.1, 0.8))) { definirEstado(o, b, 'alianca'); historia(o, v.t, `Aliança com ${b.nome}, negociada por você.`); return { texto: `${cap(b.nome)} topou o acordo.`, tom: 'bom' }; }
      return { texto: `${cap(b.nome)} recusou${b.rivais.includes(o.id) ? ': a rivalidade é velha demais' : ''}.`, tom: 'ruim' };
    }
    case 'romper': {
      const b = orgViva(v, alvo!)!;
      definirEstado(o, b, 'ruptura');
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
    case 'filiar_secreto': {
      const chance = clamp(0.3 + (rel.lealdade - 45) / 80 + (e.reputacao ?? 0) / 300, 0.15, 0.85);
      if (!r.chance(chance)) { lembrarOrg(rel, v.t, 'conflito', -2); return { texto: 'Ouviram a proposta e disseram que não: quem já é de outra casa, eles não querem escondido.', tom: 'ruim' }; }
      rel.relacao = 'membro'; rel.secreto = true; rel.suspeita = 0;
      delete rel.saiu;
      definirNivel(v, rel, 0);
      lembrarOrg(rel, v.t, 'alianca', 4);
      marco(v, `Entrou para ${o.nome} sem que os outros soubessem.`);
      const outras = deDentro(v).filter(x => x.id !== o.id).map(x => x.nome).join(' e ');
      return { texto: `Você agora é de ${o.nome} também — ${nomeDoNivel(o, 0)} —, e ${outras} não sabe${outras.includes(' e ') ? 'm' : ''}. Cada ano, guardar isso fica mais difícil.`, tom: 'bom' };
    }
    case 'reuniao': {
      rel.lealdade = clamp(rel.lealdade + 3);
      const l = lider(o);
      const disputa = o.disputa ? ` A sucessão está aberta: ${o.disputa.candidatos.map(c => c === 'jogador' ? 'você' : o.quadro.find(x => x.id === c)?.nome).join(' e ')}.` : '';
      const outras = Object.entries(o.relacoes ?? {}).map(([id, est]) => ({ b: orgViva(v, id), est })).filter(x => x.b && x.b.estado !== 'extinta' && x.est !== 'neutralidade').slice(0, 2);
      const fora = outras.length ? ` Lá fora: ${outras.map(x => `com ${x.b!.nome}, ${NOME_DO_ESTADO_ENTRE[x.est]}`).join('; ')}.` : '';
      return { texto: `Na reunião, ${l ? `${l.nome} falou primeiro` : 'ninguém falou primeiro'}. ${o.coesao < 40 ? 'Havia dois grupos na mesa, e todo mundo percebeu.' : 'A casa está unida.'}${disputa}${fora} Você foi visto ali — e isso conta.` };
    }
    case 'tregua': {
      const b = orgViva(v, alvo!)!;
      pagarPorFora(v, 'custos', custoDeComando(v, o));
      const chance = clamp(0.35 + (b.forca < o.forca ? 0.15 : -0.05) + (estadoEntre(o, b) === 'conflito' ? 0.1 : 0) + (b.pressao >= 50 ? 0.1 : 0), 0.15, 0.8);
      if (r.chance(chance)) { definirEstado(o, b, 'tregua'); historia(o, v.t, `Trégua com ${b.nome}, negociada por você.`); historia(b, v.t, `Trégua com ${o.nome}.`); e.exposicao = clamp(e.exposicao - 3); return { texto: `${cap(b.nome)} aceitou a trégua. Por enquanto, ninguém avança sobre ninguém — e a rua fica mais calma.`, tom: 'bom' }; }
      return { texto: `${cap(b.nome)} mandou dizer que não há o que conversar.`, tom: 'ruim' };
    }
    case 'cooperar': {
      const b = orgViva(v, alvo!)!;
      if (r.chance(clamp(0.35 + (o.forca - b.forca) / 200 + (estadoEntre(o, b) === 'concorrencia' ? -0.1 : 0), 0.15, 0.75))) { definirEstado(o, b, 'cooperacao'); historia(o, v.t, `Um negócio dividido com ${b.nome}, negociado por você.`); return { texto: `${cap(b.nome)} topou dividir um negócio. Não é aliança: é este ano, este negócio — e cada lado de olho no outro.`, tom: 'bom' }; }
      return { texto: `${cap(b.nome)} recusou: preferem fazer sozinhos.`, tom: 'ruim' };
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
      cidade: municipio(o.municipioId).nome, daqui: o.municipioId === v.moradia.municipioId,
      // REWORK 12.3: as relações com cada outra organização (A2), o alcance e a distância (A6), o segredo (A1), o que o posto permite (A3).
      relacoes: orgsDaCidade(v, o.municipioId).filter(x => x.id !== o.id).map(x => ({ id: x.id, nome: x.nome, estado: estadoEntre(o, x), nomeEstado: NOME_DO_ESTADO_ENTRE[estadoEntre(o, x)] })),
      alcance: NOME_DO_ALCANCE[alcanceDe(o)], distancia: rel?.distancia, secreto: !!rel?.secreto, suspeita: rel?.suspeita ?? 0,
      poderes: n >= 0 && (rel?.relacao === 'membro' || rel?.propria) ? PODERES_DO_NIVEL.slice(0, Math.min(6, n) + 1).flat() : [],
      rachaDe: o.rachaDe ? orgViva(v, o.rachaDe.id)?.nome : undefined,
      // REWORK 12.35: o jeito dela, o apoio ao comando (de quem lidera), o que vem no próximo posto, o que aconteceu no ano.
      perfil: jeitoDe(o).nome, perfilFrase: jeitoDe(o).frase,
      apoio: rel && (rel.propria || n >= 6) ? o.apoio : undefined,
      proximosPoderes: n >= 0 && n < 6 && (rel?.relacao === 'membro' || rel?.propria) ? PODERES_DO_NIVEL[n + 1] : [],
      esteAno: o.historia.filter(h => v.t - h.t < 12).reverse().map(h => h.texto),
      operacao: o.operacao && v.t - o.operacao.t < 12 ? o.operacao.tipo : undefined
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
