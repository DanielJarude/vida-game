/**
 * REWORK 11.5 · SUB-11..16 — O SUBMUNDO COM ESPECIALIZAÇÕES (os ramos de `ramos.ts`), GENTE COM MEMÓRIA E CONSEQUÊNCIA.
 *
 * O envolvimento (`ilicito`) e a trajetória à margem (`margem`) continuam sendo a espinha: a exposição, a confiança do
 * meio, a investigação, o processo, a saída. Este módulo dá a ela o que faltava:
 *
 *   RAMOS        cada um com a sua prática (`experiencia`), o seu nome, as suas operações e falhas; o contrabando com o
 *                mercado que oscila e o estoque que pode ser apreendido; o crime organizado com posto e lealdade
 *   CONTATOS     fichas (`FichaDeContato`): papel, confiança, o que esperam, promessas cumpridas e quebradas, a
 *                organização; afastam-se quando a confiança acaba, e são eles que traem
 *   ORGANIZAÇÕES fictícias, com nome do lugar; lembram promessas, alianças, conflitos, traições e saídas
 *   AÇÕES        próprias de cada ramo (`OqueSubmundo`), com custo, pré-requisito, risco dito antes e consequência real
 *   CENAS        decisões próprias de cada ramo e as encadeadas (a cobrança da promessa quebrada, a reconciliação),
 *                disparadas aqui e escritas em `conteudo/submundo`
 *
 * Nada descreve como se faz coisa alguma: o jogo fala de gente, de risco e da conta que chega. Sorteios derivados
 * (`rngDe`): a sequência do ano não muda.
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { Envolvimento, FichaDeContato, PapelDoContato, Ramo, RelacaoComOrganizacao, Vida } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { criarPessoa, vincular } from '../pessoas';
import { sortearSobrenome } from '../dados/nomes';
import { economiaLocal, paisDaCidade } from '../dados/lugares';
import { abalar } from './abalo';
import { disponivel, pagar, vereditoDePagar } from './dinheiro';
import { preso } from './justica';
import { ativo, parar, rendaDeReferencia, temAcesso } from './ilicito';
import { categoriaDoRamo, chanceDeFalha, garantirRamos, NOME_DO_RAMO, novaEspecializacao, PERFIL, RAMOS, ramoPrincipal, ramosAtivos } from './ramos';
import { machucarNaBriga } from './lesoes';
import { dinheiroCurto } from '../texto';
import { anoDe } from '../tempo';

const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 100) * 100;
const env = (v: Vida) => v.caminhos.envolvimento;
const esp = (v: Vida, r: Ramo) => env(v)?.especializacoes?.[r];

/* ---------------------------------------------------------------- o diário do caminho */

/** O que aconteceu no caminho (a tela lê; no máximo 40 linhas). */
export function anotar(v: Vida, texto: string, tom?: 'bom' | 'ruim'): void {
  const e = env(v);
  if (!e) return;
  (e.diario ??= []).push({ t: v.t, texto, ...(tom ? { tom } : {}) });
  if (e.diario.length > 40) e.diario.splice(0, e.diario.length - 40);
}

/* ---------------------------------------------------------------- contatos com ficha */

const PAPEIS_DO_RAMO: Record<Ramo, PapelDoContato[]> = {
  furtos: ['parceiro', 'intermediario', 'informante'],
  contrabando: ['fornecedor', 'comprador', 'intermediario'],
  organizado: ['chefe', 'parceiro', 'protegido'],
  digital: ['tecnico', 'intermediario', 'comprador'],
  fraudes: ['intermediario', 'informante', 'parceiro']
};
const ESPERA_DO_PAPEL: Record<PapelDoContato, FichaDeContato['espera']> = { parceiro: 'parte', fornecedor: 'parte', comprador: 'volume', chefe: 'lealdade', protegido: 'lealdade', intermediario: 'discricao', tecnico: 'parte', informante: 'discricao' };

export const NOME_DO_PAPEL: Record<PapelDoContato, string> = { parceiro: 'parceiro', fornecedor: 'fornecedor', comprador: 'comprador', chefe: 'quem manda', protegido: 'quem você protege', intermediario: 'intermediário', tecnico: 'quem entende do assunto', informante: 'quem fica sabendo das coisas' };

/** As fichas dos contatos que existiam antes (save antigo): quem abriu a porta é parceiro; os outros, do ramo principal. */
export function garantirFichas(v: Vida, e: Envolvimento): void {
  const ids = [...new Set([...(e.contatoId ? [e.contatoId] : []), ...(e.contatos ?? [])])];
  const fs = (e.fichas ??= {});
  const ramo = ramoPrincipal(e);
  for (const id of ids) {
    if (fs[id] || !v.pessoas[id]) continue;
    const vin = v.vinculos[id];
    fs[id] = { papel: id === e.contatoId ? 'parceiro' : PAPEIS_DO_RAMO[ramo][1], especialidade: ramo, confianca: Math.round(clamp(vin?.confianca ?? 40, 10, 90)), espera: id === e.contatoId ? 'parte' : 'discricao', cumpridas: 0, quebradas: 0, desde: e.tInicio };
  }
}

/** Os contatos que contam hoje (vivos, soltos, não afastados, não traidores). */
export function contatosAtivos(v: Vida, ramo?: Ramo, papel?: PapelDoContato): { id: string; f: FichaDeContato }[] {
  const e = env(v);
  if (!e?.fichas) return [];
  return Object.entries(e.fichas)
    .filter(([id, f]) => v.pessoas[id]?.vivo && f.afastado === undefined && f.traiu === undefined && (!ramo || f.especialidade === ramo) && (!papel || f.papel === papel))
    .map(([id, f]) => ({ id, f }))
    .sort((a, b) => b.f.confianca - a.f.confianca);
}

/** Alguém novo do caminho, com papel e (no crime organizado e no contrabando) organização. */
export function criarContato(v: Vida, ramo: Ramo, papel?: PapelDoContato, salt = 0): string {
  const e = env(v)!;
  // Gente demais no mesmo ramo, não: a partir de quatro, quem chega é alguém que já estava (o do mesmo papel, se houver).
  const doRamo = contatosAtivos(v, ramo);
  if (doRamo.length >= 4) return (doRamo.find(c => !papel || c.f.papel === papel) ?? doRamo[0]).id;
  const r = rngDe(v.id, 'contato_sub', v.t, ramo, Object.keys(e.fichas ?? {}).length + salt);
  const p = criarPessoa(v, r, { genero: r.chance(0.62) ? 'masculino' : 'feminino', idade: Math.max(18, idade(v) + r.int(-8, 14)), municipioId: v.moradia.municipioId });
  p.temperamento.responsabilidade = -0.5;
  vincular(v, p, { origem: 'vizinhanca', estagio: 'conhecido', proximidade: 22, convivio: [] });
  const pap = papel ?? r.pick(PAPEIS_DO_RAMO[ramo]);
  const org = ramo === 'organizado' || ramo === 'contrabando' ? organizacaoDoRamo(v, ramo).id : undefined;
  (e.fichas ??= {})[p.id] = { papel: pap, especialidade: ramo, confianca: 30 + r.int(0, 15), espera: ESPERA_DO_PAPEL[pap], cumpridas: 0, quebradas: 0, ...(org ? { organizacao: org } : {}), desde: v.t };
  (e.contatos ??= []).push(p.id);
  return p.id;
}

/** O contato perdeu a confiança (ou você o perdeu): não traz mais trabalho. */
export function afastar(v: Vida, id: string, porque: string): void {
  const f = env(v)?.fichas?.[id];
  if (!f || f.afastado !== undefined) return;
  f.afastado = v.t;
  const p = v.pessoas[id];
  if (p) anotar(v, `${p.nome} se afastou: ${porque}.`, 'ruim');
}

/** Uma promessa ao contato: cumprida (a confiança sobe) ou quebrada (cai — e ele lembra). */
export function promessa(v: Vida, id: string, cumprida: boolean): void {
  const f = env(v)?.fichas?.[id];
  if (!f) return;
  if (cumprida) { f.cumpridas++; f.confianca = clamp(f.confianca + 10); } else { f.quebradas++; f.confianca = clamp(f.confianca - 18); }
  const org = f.organizacao ? orgPorId(v, f.organizacao) : undefined;
  if (org) lembrarOrg(org, v.t, cumprida ? 'promessa' : 'promessa_quebrada', cumprida ? 4 : -10);
  const p = v.pessoas[id];
  if (p) lembrarCom(v, id, cumprida ? 'Você cumpriu o combinado.' : 'Você não cumpriu o combinado.', cumprida ? 'apoio' : 'conflito', 1);
}

/* ---------------------------------------------------------------- organizações fictícias */

const APELIDOS = ['Magro', 'Alemão', 'Baixinho', 'Russo', 'Galego', 'Careca', 'Doutor', 'Professor', 'Ruivo', 'Neguinho'];
const BICHOS = ['Corvo', 'Vespa', 'Mariposa', 'Lince', 'Garça', 'Morcego', 'Coruja'];

/** O nome de uma organização do lugar (estável para a cidade e o ramo — é a cidade que tem os seus grupos). */
export function nomeDeOrganizacao(municipioId: string, ramo: Ramo, k: number): string {
  const r = rngDe('org_sub', municipioId, ramo, k);
  const sob = sortearSobrenome(r, paisDaCidade(municipioId));
  switch (ramo) {
    case 'organizado': return r.pick([`a família ${sob}`, `os ${sob}`, `o grupo do ${r.pick(APELIDOS)}`]);
    case 'contrabando': return r.pick([`a rede do ${r.pick(APELIDOS)}`, `o pessoal dos ${sob}`]);
    case 'digital': return `o coletivo ${r.pick(BICHOS)}`;
    case 'fraudes': return `o círculo de ${sob}`;
    case 'furtos': return `a turma do ${r.pick(APELIDOS)}`;
  }
}

export const orgPorId = (v: Vida, id: string) => env(v)?.organizacoes?.find(o => o.id === id);

/** A organização com que se trabalha neste ramo (ou a primeira do lugar). */
export function organizacaoDoRamo(v: Vida, ramo: Ramo): RelacaoComOrganizacao {
  const e = env(v)!;
  const os = (e.organizacoes ??= []);
  const ja = os.find(o => o.especialidade === ramo && o.relacao !== 'rival' && o.saiu === undefined);
  if (ja) return ja;
  const k = os.filter(o => o.especialidade === ramo).length;
  const id = `org_${ramo}_${v.moradia.municipioId}_${k}`;
  const o: RelacaoComOrganizacao = { id, nome: nomeDeOrganizacao(v.moradia.municipioId, ramo, k), especialidade: ramo, relacao: ramo === 'organizado' ? 'membro' : 'aliada', lealdade: 40, memoria: [], desde: v.t };
  os.push(o);
  return o;
}

/** Uma rival do lugar (a outra organização do mesmo ramo). */
export function rivalDoRamo(v: Vida, ramo: Ramo): RelacaoComOrganizacao {
  const e = env(v)!;
  const os = (e.organizacoes ??= []);
  const ja = os.find(o => o.especialidade === ramo && o.relacao === 'rival');
  if (ja) return ja;
  const k = os.filter(o => o.especialidade === ramo).length;
  const o: RelacaoComOrganizacao = { id: `org_${ramo}_${v.moradia.municipioId}_${k}`, nome: nomeDeOrganizacao(v.moradia.municipioId, ramo, k), especialidade: ramo, relacao: 'rival', lealdade: 15, memoria: [], desde: v.t };
  os.push(o);
  return o;
}

export function lembrarOrg(o: RelacaoComOrganizacao, t: number, fato: RelacaoComOrganizacao['memoria'][number]['fato'], lealdade = 0): void {
  o.memoria.push({ t, fato });
  if (o.memoria.length > 20) o.memoria.splice(0, o.memoria.length - 20);
  o.lealdade = clamp(o.lealdade + lealdade);
}

/* ---------------------------------------------------------------- o ano */

/** Depois do envolvimento e da margem: a prática, o mercado, as pessoas, as organizações — e as cenas de cada ramo. */
export function processarSubmundo(v: Vida): void {
  const e = env(v);
  if (!e) return;
  garantirRamos(v, e);
  garantirFichas(v, e);
  delete e.cenas;
  delete e.cenasOrg;
  const r = rngDe(v.id, 'submundo', v.t);
  if (e.parou !== undefined || preso(v)) {
    // Fora (ou preso): a organização lembra de quem saiu; a dívida não some.
    for (const o of e.organizacoes ?? []) if (o.relacao === 'membro' && o.saiu === undefined && e.parou !== undefined) { o.saiu = e.parou; lembrarOrg(o, v.t, 'saida', -15); }
    if (e.parou !== undefined && (e.divida ?? 0) > 0 && r.chance(0.35)) cena(v, 'sub_divida', contatosAtivos(v)[0]?.id);
    return;
  }
  // A categoria que a Justiça lê acompanha o ramo principal (sem mexer no "pequenos" de quem começou menor).
  const principal = ramoPrincipal(e);
  if (principal !== ramoDe(e)) e.categoria = categoriaDoRamo(principal, idade(v) < 18, temAcesso(v));
  const ativos = ramosAtivos(e);
  for (const ramo of ativos) {
    const s = e.especializacoes![ramo]!;
    const peso = ramo === principal ? 1 : 0.5;
    s.experiencia = clamp(Math.round(s.experiencia + (2 + e.nivel) * peso * (e.cautela ? 0.5 : 1)));
    s.nome = clamp(Math.round(s.nome * 0.9 + (s.experiencia * 0.3 + Math.max(0, s.operacoes - s.falhas * 1.5) * 3) * 0.1 + peso * 2));
    if (ramo === 'contrabando') anoDoContrabando(v, e, r);
    if (ramo === 'organizado') anoDaOrganizacao(v, e, r);
  }
  // Várias frentes ao mesmo tempo: mais gente sabendo, e o combinado que não se consegue cumprir.
  if (ativos.length >= 2) {
    e.exposicao = clamp(e.exposicao + 2 * (ativos.length - 1));
    if (ativos.length >= 3 && r.chance(0.3)) {
      const c = contatosAtivos(v)[r.int(0, Math.max(0, contatosAtivos(v).length - 1))];
      if (c) { promessa(v, c.id, false); anotar(v, `Com tanta coisa ao mesmo tempo, o combinado com ${v.pessoas[c.id].nome} ficou para trás.`, 'ruim'); }
    }
    // O membro de uma organização que atua por fora dela, no ramo de outra, vira assunto.
    const membro = (e.organizacoes ?? []).find(o => o.relacao === 'membro' && o.saiu === undefined);
    if (membro && ativos.some(x => x !== membro.especialidade && x !== 'furtos') && r.chance(0.2)) lembrarOrg(membro, v.t, 'conflito', -6);
  }
  // As pessoas: a confiança anda com o que se cumpriu; quem não confia mais se afasta.
  for (const { id, f } of contatosAtivos(v)) {
    f.confianca = clamp(f.confianca + (f.cumpridas >= f.quebradas ? 2 : -4));
    if (f.confianca < 15) afastar(v, id, 'deixou de confiar em você');
  }
  // As cenas do ano: uma de cada ramo, às vezes; e as encadeadas (o que ficou para trás voltando).
  for (const ramo of ativos) {
    const s = e.especializacoes![ramo]!;
    if (!r.chance(ramo === principal ? 0.38 : 0.22)) continue;
    const ev = cenaDoRamo(v, e, ramo, s.experiencia, r);
    if (ev) cena(v, ev.id, ev.pessoa, ev.org);
  }
  // A palavra dada de novo (a cobrança) e o prazo pedido (a apreensão) vencem em um ano: quem não cumpriu, perde.
  for (const { id, f } of contatosAtivos(v)) {
    const ultima = v.fatos[`sub_ultima_${id}`];
    if (ultima !== undefined && v.t - ultima >= 12) {
      delete v.fatos[`sub_ultima_${id}`];
      if (f.quebradas > f.cumpridas) { f.traiu = v.t; e.exposicao = clamp(e.exposicao + 15); e.traicoes = (e.traicoes ?? 0) + 1; anotar(v, `${v.pessoas[id].nome} cansou de esperar e falou o seu nome.`, 'ruim'); }
    }
    const prazo = v.fatos[`sub_prazo_${id}`];
    if (prazo !== undefined && v.t - prazo >= 12) {
      delete v.fatos[`sub_prazo_${id}`];
      if ((e.divida ?? 0) > 0) { promessa(v, id, false); anotar(v, `O prazo com ${v.pessoas[id].nome} venceu, e a dívida continua.`, 'ruim'); }
    }
  }
  const quebrou = contatosAtivos(v).find(c => c.f.quebradas > c.f.cumpridas);
  if (quebrou && r.chance(0.4)) cena(v, 'sub_cobranca', quebrou.id);
  const brigada = (e.organizacoes ?? []).find(o => o.memoria.some(m => m.fato === 'conflito' || m.fato === 'promessa_quebrada') && !o.memoria.some(m => m.fato === 'reconciliacao' && v.t - m.t < 60) && v.t - Math.max(...o.memoria.filter(m => m.fato === 'conflito' || m.fato === 'promessa_quebrada').map(m => m.t)) >= 24);
  if (brigada && r.chance(0.3)) cena(v, 'sub_reconciliacao', undefined, brigada.id);
}

const ramoDe = (e: Envolvimento): Ramo => ({ pequenos: 'furtos', patrimonial: 'furtos', mercado: 'contrabando', grupo: 'organizado', fraude: e.especializacoes?.digital && !e.especializacoes.fraudes ? 'digital' : 'fraudes', corrupcao: 'fraudes' } as const)[e.categoria];

/** Marca a cena de hoje (a decisão em `conteudo/submundo` lê o fato e a pessoa). */
function cena(v: Vida, id: string, pessoa?: string, org?: string): void {
  const e = env(v)!;
  v.fatos[id] = v.t;
  if (pessoa) (e.cenas ??= {})[id] = pessoa;
  if (org) (e.cenasOrg ??= {})[id] = org;
}

function cenaDoRamo(v: Vida, e: Envolvimento, ramo: Ramo, xp: number, r: Rng): { id: string; pessoa?: string; org?: string } | undefined {
  const quem = (p?: PapelDoContato) => contatosAtivos(v, ramo, p)[0]?.id ?? contatosAtivos(v, ramo)[0]?.id;
  switch (ramo) {
    case 'furtos': {
      const parc = quem('parceiro');
      if (parc && r.chance(0.5)) return { id: 'subf_parceiro', pessoa: parc };
      return xp >= 30 ? { id: 'subf_escala', pessoa: parc ?? criarContato(v, 'furtos', 'parceiro') } : undefined;
    }
    case 'contrabando':
      return { id: 'subc_mercado', pessoa: quem('fornecedor') ?? criarContato(v, 'contrabando', 'fornecedor'), org: rivalDoRamo(v, 'contrabando').id };
    case 'organizado': {
      const s = e.especializacoes!.organizado!;
      const org = organizacaoDoRamo(v, 'organizado');
      if ((s.posto ?? 1) < 4 && s.experiencia >= 22 * (s.posto ?? 1) && org.lealdade >= 45 && r.chance(0.55)) return { id: 'subo_promocao', pessoa: quem('chefe'), org: org.id };
      return { id: 'subo_disputa', pessoa: quem('parceiro') ?? quem(), org: org.id };
    }
    case 'digital':
      return r.chance(0.5) ? { id: 'subd_encomenda', pessoa: quem('intermediario') ?? criarContato(v, 'digital', 'intermediario') } : { id: 'subd_exposto', pessoa: quem() };
    case 'fraudes':
      return r.chance(temAcesso(v) ? 0.6 : 0.2) ? { id: 'subx_conflito', pessoa: quem('intermediario') ?? criarContato(v, 'fraudes', 'intermediario') } : { id: 'subx_denuncia', pessoa: quem('informante') ?? quem() };
  }
}

/** O ano do contrabando: o mercado muda; o estoque vende (ou é apreendido). */
function anoDoContrabando(v: Vida, e: Envolvimento, r: Rng): void {
  const s = e.especializacoes!.contrabando!;
  const antes = s.mercado ?? 0;
  s.mercado = Math.max(-2, Math.min(2, Math.round(antes * 0.5 + (r.next() * 4 - 2))));
  if (s.mercado !== antes && Math.abs(s.mercado - antes) >= 2) anotar(v, s.mercado > antes ? 'A procura subiu de repente: o que se vende por fora vale mais neste ano.' : 'A procura despencou: o que se vende por fora quase não sai.', s.mercado > antes ? 'bom' : 'ruim');
  const estoque = s.estoque ?? 0;
  if (estoque <= 0) return;
  const apreensao = 0.07 + e.exposicao / 500 + (e.cautela ? -0.03 : 0);
  if (r.chance(apreensao)) {
    s.estoque = 0;
    s.falhas++;
    e.exposicao = clamp(e.exposicao + 8);
    anotar(v, `Uma apreensão levou o que estava guardado: uns ${fmt(v, estoque)} perdidos.`, 'ruim');
    escrever(v, { texto: 'Uma apreensão levou a mercadoria que estava guardada. O prejuízo ficou inteiro com você.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    abalar(v, 'a apreensão', -5, 8);
    const forn = contatosAtivos(v, 'contrabando', 'fornecedor')[0];
    if (forn && r.chance(0.5)) { e.divida = (e.divida ?? 0) + Math.round(estoque * 0.4 / 100) * 100; cena(v, 'subc_apreensao', forn.id); }
    return;
  }
  const valor = Math.round(estoque * (0.85 + (s.mercado ?? 0) * 0.18 + r.next() * 0.35) / 100) * 100;
  s.estoque = 0;
  s.ganhos += Math.max(0, valor - estoque);
  e.ganhos += Math.max(0, valor - estoque);
  v.financas.conta += valor;
  s.operacoes++;
  anotar(v, valor >= estoque ? `O lote saiu: ${fmt(v, valor)} por ${fmt(v, estoque)} investidos.` : `O lote saiu no prejuízo: ${fmt(v, valor)} por ${fmt(v, estoque)} investidos.`, valor >= estoque ? 'bom' : 'ruim');
}

/** O ano na organização: a lealdade que se lê em você; quem está dentro há muito tempo e é leal sobe. */
function anoDaOrganizacao(v: Vida, e: Envolvimento, r: Rng): void {
  const org = organizacaoDoRamo(v, 'organizado');
  org.lealdade = clamp(org.lealdade + (e.cautela ? -3 : 2));
  if (!contatosAtivos(v, 'organizado', 'chefe').length && r.chance(0.6)) criarContato(v, 'organizado', 'chefe');
}

/** O dinheiro na moeda do jogo (a mesma régua de todo texto). */
const fmt = (_v: Vida, x: number) => dinheiroCurto(x);

/* ---------------------------------------------------------------- as ações da tela */

export type OqueSubmundo =
  | 'entrar_ramo' | 'largar_ramo'
  | 'servico_pequeno' | 'servico_maior'
  | 'comprar_lote' | 'vender_estoque' | 'novo_comprador'
  | 'tarefa_do_grupo' | 'pedir_para_subir' | 'tentar_sair'
  | 'encomenda' | 'sumir_da_rede' | 'aprender'
  | 'esquema_de_influencia' | 'recusar_pedido' | 'denunciar'
  | 'cumprir_combinado' | 'acertar_divida';

/** Quais ações cada ramo tem (a tela mostra estas, com o risco dito antes). */
export const ACOES_DO_RAMO: Record<Ramo, OqueSubmundo[]> = {
  furtos: ['servico_pequeno', 'servico_maior'],
  contrabando: ['comprar_lote', 'vender_estoque', 'novo_comprador'],
  organizado: ['tarefa_do_grupo', 'pedir_para_subir', 'tentar_sair'],
  digital: ['encomenda', 'aprender', 'sumir_da_rede'],
  fraudes: ['esquema_de_influencia', 'recusar_pedido', 'denunciar']
};

export const ROTULO_DA_ACAO: Record<OqueSubmundo, string> = {
  entrar_ramo: 'Começar a atuar aqui', largar_ramo: 'Largar esta frente',
  servico_pequeno: 'Topar um serviço pequeno', servico_maior: 'Topar um serviço grande, com o parceiro',
  comprar_lote: 'Adiantar dinheiro num lote', vender_estoque: 'Vender o que está guardado agora', novo_comprador: 'Abrir um comprador novo',
  tarefa_do_grupo: 'Cumprir uma tarefa do grupo', pedir_para_subir: 'Pedir para subir no grupo', tentar_sair: 'Pedir para sair do grupo',
  encomenda: 'Aceitar uma encomenda', aprender: 'Aprender com quem entende', sumir_da_rede: 'Sumir por um tempo',
  esquema_de_influencia: 'Entrar num acerto de influência', recusar_pedido: 'Recusar o próximo pedido', denunciar: 'Denunciar o esquema',
  cumprir_combinado: 'Cumprir o combinado', acertar_divida: 'Acertar a dívida'
};

/** Uma ação por ramo por ano (a operação, a venda, o pedido) — o ano não é uma máquina de apertar botão. */
const feitaNoAno = (v: Vida, ramo: Ramo, oque: OqueSubmundo) => v.fatos[`sub_acao_${ramo}_${oque}`] === v.t;

/** O valor de referência de uma operação: meses da renda do envolvimento, no custo do lugar. */
export function valorDaOperacao(v: Vida, ramo: Ramo, meses: number): number {
  const e = env(v)!;
  const s = e.especializacoes?.[ramo];
  return preco(v, rendaDeReferencia(e) * meses * PERFIL[ramo].renda * (0.8 + (s?.experiencia ?? 0) / 250) * (ramo === 'contrabando' ? 1 + (s?.mercado ?? 0) * 0.15 : 1));
}

/** O que a tela diz antes de escolher: o risco e o que pode render (sem método — números e gente). */
export function previsaoDaAcao(v: Vida, ramo: Ramo, oque: OqueSubmundo): { risco: number; ganho?: [number, number]; custo?: number } | undefined {
  const e = env(v);
  if (!e) return undefined;
  const parceiro = contatosAtivos(v, ramo, 'parceiro').some(c => c.f.confianca >= 45);
  switch (oque) {
    case 'servico_pequeno': return { risco: chanceDeFalha(e, ramo, 1, parceiro), ganho: [valorDaOperacao(v, ramo, 0.5), valorDaOperacao(v, ramo, 1.5)] };
    case 'servico_maior': return { risco: chanceDeFalha(e, ramo, 3, parceiro), ganho: [valorDaOperacao(v, ramo, 2), valorDaOperacao(v, ramo, 5)] };
    case 'comprar_lote': return { risco: 0.07 + e.exposicao / 500, custo: valorDaOperacao(v, 'contrabando', 2) };
    case 'encomenda': return { risco: chanceDeFalha(e, 'digital', 2, false), ganho: [valorDaOperacao(v, 'digital', 0.5), valorDaOperacao(v, 'digital', 3.5)] };
    case 'esquema_de_influencia': return { risco: chanceDeFalha(e, 'fraudes', 2, false) + (v.caminhos.politica?.mandato ? 0.08 : 0), ganho: [valorDaOperacao(v, 'fraudes', 1.5), valorDaOperacao(v, 'fraudes', 4)] };
    case 'tarefa_do_grupo': return { risco: chanceDeFalha(e, 'organizado', 1, parceiro), ganho: [valorDaOperacao(v, 'organizado', 1), valorDaOperacao(v, 'organizado', 2)] };
    case 'aprender': return { risco: 0, custo: preco(v, 1500) };
    case 'tentar_sair': { const org = (e.organizacoes ?? []).find(o => o.relacao === 'membro' && o.saiu === undefined); return { risco: clamp(0.25 + ((esp(v, 'organizado')?.posto ?? 1) - 1) * 0.12 - (org?.lealdade ?? 40) / 300, 0.1, 0.7) }; }
    default: return undefined;
  }
}

export function disponibilidadeSubmundo(v: Vida, oque: OqueSubmundo, ramo?: Ramo, pessoaId?: string): Veredito {
  const e = env(v);
  if (!e || !ativo(v)) return bloqueio('impossivel', 'Você não está nisso agora.');
  if (preso(v)) return bloqueio('impossivel', 'Na prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  const i = idade(v);
  if (oque === 'cumprir_combinado') {
    const f = pessoaId ? e.fichas?.[pessoaId] : undefined;
    if (!f || f.afastado !== undefined || f.traiu !== undefined || !v.pessoas[pessoaId!]?.vivo) return bloqueio('impossivel', 'Não há combinado em aberto com essa pessoa.');
    if (f.quebradas <= f.cumpridas) return bloqueio('incompativel', 'Não há nada pendente com essa pessoa.');
    if (v.fatos[`sub_combinado_${pessoaId}`] === v.t) return bloqueio('incompativel', 'Você já acertou com essa pessoa neste ano.');
    return vereditoDePagar(v, preco(v, 1500), 'Acertar o combinado custa uns');
  }
  if (oque === 'acertar_divida') return (e.divida ?? 0) > 0 ? vereditoDePagar(v, e.divida!, 'A dívida é de') : bloqueio('impossivel', 'Não há dívida.');
  if (!ramo) return bloqueio('impossivel', 'De que frente?');
  const s = e.especializacoes?.[ramo];
  const ativa = !!s && s.largou === undefined;
  if (oque === 'entrar_ramo') {
    if (ativa) return bloqueio('incompativel', 'Você já atua nisso.');
    if (ramosAtivos(e).length >= 3) return bloqueio('incompativel', 'Três frentes ao mesmo tempo já é mais do que se dá conta.');
    if (ramo === 'contrabando' && i < 18) return bloqueio('impossivel', 'Cedo demais para isso.');
    if (ramo === 'organizado' && (e.reputacao ?? 0) < 25 && !contatosAtivos(v).some(c => c.f.papel === 'chefe' || c.f.papel === 'intermediario')) return bloqueio('requisito', 'Uma organização não aceita quem o meio ainda não conhece: falta confiança do meio (ou alguém de dentro que responda por você).');
    if (ramo === 'digital' && v.mente.cognicao < 50) return bloqueio('requisito', 'Isso pede um tipo de familiaridade que você ainda não tem.');
    if (ramo === 'fraudes' && !temAcesso(v)) return bloqueio('requisito', 'Sem um cargo, uma assinatura ou um negócio, não há onde entrar.');
    return { grau: 'irregular', motivo: `É crime. Mais uma frente é mais gente sabendo (a exposição cresce) e menos tempo para cada uma${s ? '; a prática de antes volta com você' : ''}.` };
  }
  if (!ativa) return bloqueio('impossivel', 'Você não atua nisso.');
  if (oque === 'largar_ramo') return ramosAtivos(e).length <= 1 ? bloqueio('incompativel', 'É a única frente: largar é largar o caminho (Largar isso de vez).') : PERMITIDO;
  if (!ACOES_DO_RAMO[ramo].includes(oque)) return bloqueio('impossivel', 'Isso não é desta frente.');
  if (feitaNoAno(v, ramo, oque)) return bloqueio('incompativel', 'Já foi feito neste ano.');
  switch (oque) {
    case 'servico_maior':
      if (s!.experiencia < 30) return bloqueio('requisito', 'Falta prática para algo desse tamanho.');
      if (!contatosAtivos(v, 'furtos', 'parceiro').length) return bloqueio('requisito', 'Sem um parceiro de confiança, não.');
      break;
    case 'comprar_lote': {
      if ((s!.estoque ?? 0) > 0) return bloqueio('incompativel', 'Ainda há mercadoria guardada.');
      if (!contatosAtivos(v, 'contrabando', 'fornecedor').length) return bloqueio('requisito', 'Sem fornecedor, não há lote.');
      const d = vereditoDePagar(v, valorDaOperacao(v, 'contrabando', 2), 'O lote pede uns');
      if (d.grau !== 'permitido') return d;
      break;
    }
    case 'vender_estoque': if ((s!.estoque ?? 0) <= 0) return bloqueio('incompativel', 'Não há nada guardado.'); break;
    case 'pedir_para_subir':
      if ((s!.posto ?? 1) >= 4) return bloqueio('incompativel', 'Acima disso, não há para onde subir.');
      if (s!.experiencia < 18 * (s!.posto ?? 1)) return bloqueio('requisito', 'Ninguém ali acha que chegou a sua hora.');
      break;
    case 'aprender':
      if (!contatosAtivos(v, 'digital', 'tecnico').length) return bloqueio('requisito', 'Falta alguém do meio disposto a ensinar.');
      return vereditoDePagar(v, preco(v, 1500), 'Custa uns');
    case 'esquema_de_influencia': if (!temAcesso(v)) return bloqueio('requisito', 'Sem cargo, assinatura ou negócio, não há acerto possível.'); break;
  }
  return PERMITIDO;
}

/** Executa a ação do Submundo. Cada uma tem a sua conta — nenhuma é a mesma função com outro nome. */
export function executarSubmundo(v: Vida, r: Rng, oque: OqueSubmundo, ramo?: Ramo, pessoaId?: string): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  if (ramo && oque !== 'entrar_ramo' && oque !== 'largar_ramo') v.fatos[`sub_acao_${ramo}_${oque}`] = v.t;
  const s = ramo ? e.especializacoes?.[ramo] : undefined;
  const ganhar = (x: number) => { const liq = Math.round(x * 0.7 / 100) * 100; v.financas.conta += liq; e.ganhos += x; if (s) s.ganhos += x; return liq; };
  const operou = (falhou: boolean) => { if (!s) return; s.operacoes++; if (falhou) s.falhas++; s.ultima = v.t; s.experiencia = clamp(s.experiencia + (falhou ? 2 : 4)); };
  const parceiro = () => contatosAtivos(v, ramo, 'parceiro')[0];
  switch (oque) {
    case 'entrar_ramo': {
      const esps = (e.especializacoes ??= {});
      const volta = !!esps[ramo!];
      if (volta) { delete esps[ramo!]!.largou; esps[ramo!]!.tInicio = v.t; } else esps[ramo!] = novaEspecializacao(v, e, ramo!);
      e.exposicao = clamp(e.exposicao + 6);
      const quem = criarContato(v, ramo!);
      anotar(v, `Começou a atuar em ${NOME_DO_RAMO[ramo!].toLowerCase()}.`);
      escrever(v, { texto: `Passou a atuar também em ${NOME_DO_RAMO[ramo!].toLowerCase()}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: `${v.pessoas[quem].nome} passou a ser o seu contato nisso.${volta ? ' A prática de antes voltou rápido.' : ''} Mais uma frente: mais gente sabe quem você é.` };
    }
    case 'largar_ramo': {
      s!.largou = v.t;
      for (const c of contatosAtivos(v, ramo)) if (c.f.espera === 'volume' || c.f.espera === 'parte') c.f.confianca = clamp(c.f.confianca - 10);
      const org = (e.organizacoes ?? []).find(o => o.especialidade === ramo && o.saiu === undefined && o.relacao !== 'rival');
      if (org) { org.saiu = v.t; lembrarOrg(org, v.t, 'saida', -10); }
      anotar(v, `Largou ${NOME_DO_RAMO[ramo!].toLowerCase()}.`);
      return { texto: 'Você avisou quem precisava saber. Quem contava com isso não gostou; a prática fica.' };
    }
    case 'servico_pequeno':
    case 'servico_maior': {
      const escala = oque === 'servico_maior' ? 3 : 1;
      const p = parceiro();
      const falha = r.chance(chanceDeFalha(e, 'furtos', escala, !!p && p.f.confianca >= 45));
      operou(falha);
      e.exposicao = clamp(e.exposicao + (escala === 3 ? 10 : 3) + (falha ? 8 : 0));
      if (falha) {
        if (escala === 3 && r.chance(0.4)) machucarNaBriga(v, r, 2);
        if (escala === 3 && p && r.chance(0.35)) { e.cenas = { ...(e.cenas ?? {}), subf_parceiro: p.id }; v.fatos['subf_parceiro'] = v.t; v.fatos['subf_pego'] = v.t; }
        anotar(v, escala === 3 ? 'O serviço grande deu errado no meio.' : 'Um serviço pequeno deu errado.', 'ruim');
        abalar(v, 'o serviço que deu errado', -5, 8);
        return { texto: escala === 3 ? 'Deu errado. Você saiu sem nada — e com mais gente sabendo.' : 'Deu errado. Nada veio, e o susto ficou.', tom: 'ruim' };
      }
      const liq = ganhar(r.int(valorDaOperacao(v, 'furtos', escala === 3 ? 2 : 0.5), valorDaOperacao(v, 'furtos', escala === 3 ? 5 : 1.5)));
      if (p && escala === 3) promessa(v, p.id, true);
      if (escala === 3) e.trabalhos = (e.trabalhos ?? 0) + 1;
      anotar(v, `Um serviço ${escala === 3 ? 'grande' : 'pequeno'} deu certo: ${fmt(v, liq)} no bolso.`, 'bom');
      return { texto: escala === 3 ? `Deu certo. ${fmt(v, liq)} ficaram com você, depois da parte de cada um.` : `Deu certo, e foi pouco: ${fmt(v, liq)}.` };
    }
    case 'comprar_lote': {
      const custo = valorDaOperacao(v, 'contrabando', 2);
      pagar(v, custo);
      s!.estoque = custo;
      const f = contatosAtivos(v, 'contrabando', 'fornecedor')[0];
      if (f) promessa(v, f.id, true);
      e.exposicao = clamp(e.exposicao + 4);
      anotar(v, `Adiantou ${fmt(v, custo)} num lote.`);
      return { texto: `O lote está guardado. Se o mercado ajudar (e ninguém aparecer), ele sai no fim do ano com lucro — ou sai agora, se você precisar.` };
    }
    case 'vender_estoque': {
      const valor = Math.round((s!.estoque ?? 0) * (0.8 + (s!.mercado ?? 0) * 0.12 + r.next() * 0.2) / 100) * 100;
      const custo = s!.estoque ?? 0;
      s!.estoque = 0;
      v.financas.conta += valor;
      s!.ganhos += Math.max(0, valor - custo); e.ganhos += Math.max(0, valor - custo);
      operou(valor < custo);
      const c = contatosAtivos(v, 'contrabando', 'comprador')[0];
      if (c) c.f.confianca = clamp(c.f.confianca + 3);
      anotar(v, `Vendeu o lote às pressas: ${fmt(v, valor)} por ${fmt(v, custo)}.`, valor >= custo ? 'bom' : 'ruim');
      return { texto: valor >= custo ? `Saiu por ${fmt(v, valor)}: um pouco de lucro, sem esperar.` : `Saiu por ${fmt(v, valor)}, abaixo do que custou. Pressa custa.`, tom: valor >= custo ? 'bom' : 'ruim' };
    }
    case 'novo_comprador': {
      const id = criarContato(v, 'contrabando', 'comprador');
      e.exposicao = clamp(e.exposicao + 3);
      const rival = r.chance(0.25) ? rivalDoRamo(v, 'contrabando') : undefined;
      if (rival) lembrarOrg(rival, v.t, 'conflito', -5);
      anotar(v, `${v.pessoas[id].nome} passou a comprar de você.${rival ? ` ${cap(rival.nome)} não gostou: o comprador era deles.` : ''}`, rival ? 'ruim' : undefined);
      return { texto: `${v.pessoas[id].nome} topou comprar de você.${rival ? ` O problema: comprava de ${rival.nome}, e eles repararam.` : ''}` };
    }
    case 'tarefa_do_grupo': {
      const org = organizacaoDoRamo(v, 'organizado');
      const falha = r.chance(chanceDeFalha(e, 'organizado', 1, !!parceiro()));
      operou(falha);
      e.exposicao = clamp(e.exposicao + 5 + (falha ? 6 : 0));
      if (falha) { lembrarOrg(org, v.t, 'conflito', -6); anotar(v, `Uma tarefa de ${org.nome} saiu errada.`, 'ruim'); return { texto: 'A tarefa saiu errada, e quem manda reparou.', tom: 'ruim' }; }
      lembrarOrg(org, v.t, 'favor', 6);
      const liq = ganhar(r.int(valorDaOperacao(v, 'organizado', 1), valorDaOperacao(v, 'organizado', 2)));
      return { texto: `Você fez o que pediram. ${cap(org.nome)} lembra de quem cumpre — e pagou ${fmt(v, liq)}.` };
    }
    case 'pedir_para_subir': {
      const org = organizacaoDoRamo(v, 'organizado');
      const posto = s!.posto ?? 1;
      const chance = clamp(0.2 + org.lealdade / 200 + s!.experiencia / 300 - (posto - 1) * 0.1, 0.1, 0.8);
      if (r.chance(chance)) {
        s!.posto = (posto + 1) as 2 | 3 | 4;
        e.reputacao = clamp((e.reputacao ?? 0) + 8);
        e.exposicao = clamp(e.exposicao + 6);
        lembrarOrg(org, v.t, 'alianca', 4);
        if (s!.posto === 4) { const prot = criarContato(v, 'organizado', 'protegido'); anotar(v, `Passou a ter gente sob o seu comando (${v.pessoas[prot].nome}, entre outros).`); }
        anotar(v, `Subiu em ${org.nome}: ${POSTO[s!.posto!]}.`, 'bom');
        escrever(v, { texto: `Subiu dentro de ${org.nome}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
        return { texto: `Agora você é ${POSTO[s!.posto!]}. Mais dinheiro, mais responsabilidade — e mais olhos em você.` };
      }
      lembrarOrg(org, v.t, 'conflito', -8);
      e.atritos = (e.atritos ?? 0) + 1;
      return { texto: '"Ainda não." O pedido ficou lembrado — e não do jeito que você queria.', tom: 'ruim' };
    }
    case 'tentar_sair': {
      const org = (e.organizacoes ?? []).find(o => o.relacao === 'membro' && o.saiu === undefined) ?? organizacaoDoRamo(v, 'organizado');
      const risco = previsaoDaAcao(v, 'organizado', 'tentar_sair')!.risco;
      s!.largou = v.t;
      org.saiu = v.t;
      if (r.chance(risco)) {
        lembrarOrg(org, v.t, 'traicao', -25);
        v.fatos['pressao_grupo'] = v.t;
        abalar(v, 'a saída mal recebida', -8, 12);
        anotar(v, `${cap(org.nome)} não aceitou a sua saída.`, 'ruim');
        if (!ramosAtivos(e).length) parar(v, `saiu de ${org.nome}, sem a bênção de ninguém`);
        return { texto: 'Você disse que estava fora. A resposta veio em forma de silêncio — e de um carro parado na esquina.', tom: 'ruim' };
      }
      lembrarOrg(org, v.t, 'saida', -5);
      anotar(v, `Saiu de ${org.nome} sem guerra.`, 'bom');
      if (!ramosAtivos(e).length) parar(v, `saiu de ${org.nome}`);
      return { texto: 'Aceitaram. Ninguém sai de verdade de um lugar desses — mas ninguém vai bater na sua porta.' };
    }
    case 'encomenda': {
      const falha = r.chance(chanceDeFalha(e, 'digital', 2, false));
      operou(falha);
      if (falha) {
        // A exposição do crime digital vem de uma vez (o rastro que ficou).
        e.exposicao = clamp(e.exposicao + 16);
        anotar(v, 'Uma encomenda deu errado e deixou rastro.', 'ruim');
        abalar(v, 'o rastro', -4, 9);
        return { texto: 'Deu errado — e deixou rastro. Não se sabe ainda quem viu.', tom: 'ruim' };
      }
      e.exposicao = clamp(e.exposicao + 2);
      const liq = ganhar(r.int(valorDaOperacao(v, 'digital', 0.5), valorDaOperacao(v, 'digital', 3.5)));
      const i = contatosAtivos(v, 'digital', 'intermediario')[0];
      if (i) promessa(v, i.id, true);
      return { texto: `A encomenda foi entregue. ${fmt(v, liq)} — o valor muda muito de uma para outra.` };
    }
    case 'aprender': {
      pagar(v, preco(v, 1500));
      const t = contatosAtivos(v, 'digital', 'tecnico')[0]!;
      s!.experiencia = clamp(s!.experiencia + 9);
      t.f.confianca = clamp(t.f.confianca + 4);
      return { texto: `${v.pessoas[t.id].nome} mostrou como o meio funciona (o que fazer, e principalmente o que não fazer). A sua prática subiu.` };
    }
    case 'sumir_da_rede': {
      e.exposicao = clamp(e.exposicao - 14);
      s!.nome = clamp(s!.nome - 12);
      for (const c of contatosAtivos(v, 'digital')) c.f.confianca = clamp(c.f.confianca - 5);
      anotar(v, 'Sumiu por um tempo do meio digital.');
      return { texto: 'Você sumiu. Menos gente procura — inclusive quem trazia trabalho.' };
    }
    case 'esquema_de_influencia': {
      const falha = r.chance(previsaoDaAcao(v, 'fraudes', 'esquema_de_influencia')!.risco);
      operou(falha);
      e.exposicao = clamp(e.exposicao + 6 + (falha ? 10 : 0));
      if (v.caminhos.politica?.mandato) v.caminhos.politica.apoio = clamp(v.caminhos.politica.apoio - (falha ? 6 : 1));
      if (falha) { anotar(v, 'Um acerto de influência vazou para quem não devia.', 'ruim'); abalar(v, 'o acerto que vazou', -5, 9); return { texto: 'O acerto vazou para quem não devia. O seu nome circula agora em conversas que você não controla.', tom: 'ruim' }; }
      const liq = ganhar(r.int(valorDaOperacao(v, 'fraudes', 1.5), valorDaOperacao(v, 'fraudes', 4)));
      anotar(v, `Entrou num acerto de influência: ${fmt(v, liq)}.`);
      return { texto: `O acerto andou. ${fmt(v, liq)} — e agora você deve favores a gente que lembra.` };
    }
    case 'recusar_pedido': {
      e.exposicao = clamp(e.exposicao - 5);
      for (const c of contatosAtivos(v, 'fraudes')) c.f.confianca = clamp(c.f.confianca - 8);
      s!.nome = clamp(s!.nome - 6);
      anotar(v, 'Recusou um pedido no círculo de influência.');
      return { texto: 'Você disse não. O telefone tocou menos — e o sono melhorou um pouco.' };
    }
    case 'denunciar': {
      s!.largou = v.t;
      for (const c of contatosAtivos(v, 'fraudes')) { c.f.confianca = 0; c.f.afastado = v.t; }
      for (const o of (e.organizacoes ?? []).filter(o => o.especialidade === 'fraudes')) { lembrarOrg(o, v.t, 'traicao', -40); o.relacao = 'rival'; }
      e.exposicao = clamp(e.exposicao - 20);
      v.fatos['denunciou_esquema'] = v.t;
      v.fatos['pressao_grupo'] = v.t;
      escrever(v, { texto: 'Denunciou o esquema de que fazia parte.', relevancia: 'marco', tema: 'trabalho', escolha: true });
      anotar(v, 'Denunciou o esquema.', 'bom');
      if (!ramosAtivos(e).length) parar(v, 'denunciou o esquema');
      return { texto: 'Você contou o que sabia a quem investiga. O seu lado da história conta a seu favor — e quem estava junto não vai esquecer.' };
    }
    case 'cumprir_combinado': {
      pagar(v, preco(v, 1500));
      v.fatos[`sub_combinado_${pessoaId}`] = v.t;
      promessa(v, pessoaId!, true);
      return { texto: `Você acertou o que devia a ${v.pessoas[pessoaId!].nome}. A confiança volta devagar.` };
    }
    case 'acertar_divida': {
      const d = e.divida ?? 0;
      pagar(v, d);
      e.divida = 0;
      anotar(v, `Acertou a dívida de ${fmt(v, d)}.`, 'bom');
      return { texto: 'Dívida paga. Ninguém mais tem esse assunto com você.' };
    }
  }
}

export const POSTO: Record<1 | 2 | 3 | 4, string> = { 1: 'gente de fora', 2: 'gente de dentro', 3: 'gente de confiança', 4: 'quem comanda uma parte' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- a leitura (a tela do Submundo) */

export interface LeituraDoRamo {
  ramo: Ramo; nome: string; ativa: boolean; principal: boolean;
  experiencia: number; fama: number; operacoes: number; falhas: number; ganhos: number; desde: number;
  posto?: string; mercado?: number; estoque?: number;
  acoes: OqueSubmundo[];
}

/** O Submundo da pessoa, para a tela: os ramos, as pessoas, as organizações, o risco e o diário. */
export function leituraDoSubmundo(v: Vida): {
  ramos: LeituraDoRamo[];
  contatos: { id: string; nome: string; papel: string; ramo: string; confianca: number; pendente: boolean; estado: 'ativo' | 'afastado' | 'traiu' | 'morto'; organizacao?: string }[];
  organizacoes: { nome: string; ramo: string; relacao: RelacaoComOrganizacao['relacao']; lealdade: number; saiu: boolean; lembra: string[] }[];
  exposicao: number; divida: number; diario: { ano: number; texto: string; tom?: 'bom' | 'ruim' }[]; podeEntrar: Ramo[];
} | undefined {
  const e = env(v);
  if (!e) return undefined;
  garantirRamos(v, e);
  const principal = ramoPrincipal(e);
  const ramos = RAMOS.filter(r => e.especializacoes?.[r]).map(r => {
    const s = e.especializacoes![r]!;
    return { ramo: r, nome: NOME_DO_RAMO[r], ativa: s.largou === undefined && e.parou === undefined, principal: r === principal && s.largou === undefined, experiencia: s.experiencia, fama: s.nome, operacoes: s.operacoes, falhas: s.falhas, ganhos: s.ganhos, desde: anoDe(s.tInicio), ...(s.posto ? { posto: POSTO[s.posto] } : {}), ...(r === 'contrabando' ? { mercado: s.mercado ?? 0, estoque: s.estoque ?? 0 } : {}), acoes: ACOES_DO_RAMO[r] };
  });
  const orgs = e.organizacoes ?? [];
  const contatos = Object.entries(e.fichas ?? {}).filter(([id]) => v.pessoas[id]).map(([id, f]) => ({
    id, nome: v.pessoas[id].nome, papel: NOME_DO_PAPEL[f.papel], ramo: NOME_DO_RAMO[f.especialidade], confianca: f.confianca,
    pendente: f.quebradas > f.cumpridas && f.afastado === undefined && f.traiu === undefined && v.pessoas[id].vivo,
    estado: (!v.pessoas[id].vivo ? 'morto' : f.traiu !== undefined ? 'traiu' : f.afastado !== undefined ? 'afastado' : 'ativo') as 'ativo' | 'afastado' | 'traiu' | 'morto',
    ...(f.organizacao ? { organizacao: orgs.find(o => o.id === f.organizacao)?.nome } : {})
  })).sort((a, b) => Number(b.estado === 'ativo') - Number(a.estado === 'ativo') || b.confianca - a.confianca);
  const LEMBRA: Record<string, string> = { promessa: 'promessa cumprida', promessa_quebrada: 'promessa quebrada', alianca: 'aliança', conflito: 'conflito', traicao: 'traição', saida: 'saída', favor: 'favor', reconciliacao: 'reconciliação' };
  return {
    ramos,
    contatos,
    organizacoes: orgs.map(o => ({ nome: o.nome, ramo: NOME_DO_RAMO[o.especialidade], relacao: o.relacao, lealdade: o.lealdade, saiu: o.saiu !== undefined, lembra: o.memoria.slice(-4).map(m => `${anoDe(m.t)} · ${LEMBRA[m.fato]}`) })),
    exposicao: Math.round(e.exposicao), divida: e.divida ?? 0,
    diario: (e.diario ?? []).slice(-12).reverse().map(x => ({ ano: anoDe(x.t), texto: x.texto, ...(x.tom ? { tom: x.tom } : {}) })),
    podeEntrar: e.parou === undefined ? RAMOS.filter(r => !e.especializacoes?.[r] || e.especializacoes[r]!.largou !== undefined) : []
  };
}

/** O save de antes do REWORK 11.5: os ramos e as fichas a partir do que havia (idempotente; nada é reescrito). */
export function normalizarSubmundo(v: Vida): void {
  const e = v.caminhos?.envolvimento;
  if (!e) return;
  garantirRamos(v, e);
  garantirFichas(v, e);
}

export { disponivel };
