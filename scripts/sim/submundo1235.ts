/**
 * REWORK 12.35 — o Submundo vivo em vidas longas: os 15 perfis do §21. Cada perfil joga com as ações da tela e responde
 * às cenas de um jeito coerente com ele (quem vai à guerra vai; quem quer sair, sai). Mede o que o pedido lista:
 *
 *   conflitos (anos de guerra, casos de confronto, escolhas e resultados), participação (casos abertos e resolvidos),
 *   operações (na organização × as que chegaram ao jogador × buscas na casa), comando (contestações, comandos perdidos),
 *   traições (delações, quem mudou de lado), boatos, patrimônio (p10/p50/p90 aos 10/20/30 anos), prisões, ferimentos,
 *   internações, mortes (do crime e outras), família (rejeição, par que foi embora), organizações (extintas, surgidas,
 *   trocas de comando), reabilitação (emprego e marcos do recomeço), gerações (o herdeiro sem cargo, a organização que
 *   continua), save (ida e volta) e o custo (ms por ano de vida).
 *
 *   npx esbuild scripts/sim/submundo1235.ts --bundle --platform=node --format=esm --outfile=<scratch>/s.mjs && N=16 ANOS=30 node <scratch>/s.mjs
 *   (PERFIS=integrante,lider ... escolhe os perfis)
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, comFilho, comParceiro, pessoaNova } from '../../src/motor/__tests__/cenarios';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { balanco } from '../../src/motor/sistemas/dinheiro';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { criarContato, contatosAtivos } from '../../src/motor/sistemas/submundo';
import { abertas } from '../../src/motor/sistemas/encomendas';
import { orgsDaCidade, relacaoCom, garantirCidade, nivelDe, orgViva, definirEstado, definirNivel } from '../../src/motor/sistemas/faccoes';
import { prender } from '../../src/motor/sistemas/justica';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { capitalDoPais } from '../../src/motor/dados/lugares';
import { mudarAgora } from '../../src/motor/sistemas/processos';
import { continuarComo, sucessores } from '../../src/motor/sistemas/sucessao';
import { oportunidades } from '../../src/motor/sistemas/mercadoCriminal';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { vincular } from '../../src/motor/pessoas';
import { interpretar } from '../../src/motor/save';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const N = Number(process.env.N ?? 16);
const ANOS = Number(process.env.ANOS ?? 30);
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const k = (x: number) => (!Number.isFinite(x) ? '—' : Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(1)}mi` : `${Math.round(x / 1000)}k`);
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const crime = (v: Vida, acao: Extract<Acao, { tipo: 'crime' }>['acao']) => tenta(v, { tipo: 'crime', acao });

type Perfil = 'nunca' | 'contratante' | 'integrante' | 'independente' | 'promocao' | 'lider' | 'lider_contestado' | 'guerra' | 'operacao' | 'traido' | 'muda_cidade' | 'muda_pais' | 'abandona' | 'condenado' | 'sucessao';
const TODOS: Perfil[] = ['nunca', 'contratante', 'integrante', 'independente', 'promocao', 'lider', 'lider_contestado', 'guerra', 'operacao', 'traido', 'muda_cidade', 'muda_pais', 'abandona', 'condenado', 'sucessao'];
const PERFIS = (process.env.PERFIS?.split(',') as Perfil[]) ?? TODOS;
const DE_DENTRO = new Set<Perfil>(['integrante', 'promocao', 'lider', 'lider_contestado', 'guerra', 'operacao', 'traido', 'muda_cidade', 'muda_pais', 'abandona', 'sucessao']);
const LIDER = new Set<Perfil>(['lider', 'lider_contestado', 'sucessao']);

/** As respostas às cenas, coerentes com o perfil (quem quer sair escolhe sair; quem vai à guerra vai). */
function responder(v: Vida, p: Perfil, legal: boolean, cenas: Map<string, number>): Vida {
  for (let i = 0; i < 16 && v.momento && !v.morte; i++) {
    const mo = v.momento!;
    const id = mo.situacaoId;
    cenas.set(id, (cenas.get(id) ?? 0) + 1);
    const livre = (x: string) => mo.opcoes.find(o => o.id === x && !o.bloqueio);
    const primeiro = (...xs: string[]) => xs.map(livre).find(Boolean);
    let op;
    switch (id) {
      case 'sub1235_confronto': op = legal ? primeiro('ficar_fora', 'recuar', 'negociar') : p === 'lider_contestado' ? primeiro('negociar', 'intimidar') : LIDER.has(p) ? primeiro('retaliar', 'intimidar') : p === 'guerra' ? primeiro('ir') : primeiro(p === 'operacao' ? 'proteger' : 'ir', 'negociar'); break;
      case 'sub1235_operacao': op = legal ? primeiro('parar', 'advogado') : primeiro('advogado', 'parar'); break;
      case 'sub1235_perseguicao': op = legal ? primeiro('entregar') : LIDER.has(p) ? primeiro('ajuda', 'fugir') : primeiro('fugir'); break;
      case 'sub1235_contestacao': op = p === 'lider_contestado' ? primeiro('conselho', 'negociar') : primeiro('negociar', 'dividir'); break;
      case 'sub1235_traicao': op = primeiro('advogado', 'reforcar', 'deixar'); break;
      case 'sub1235_suspeita': op = primeiro('apurar', 'ignorar'); break;
      case 'sub1235_raro': op = primeiro('aceitar', 'absorver', 'recusar'); break;
      case 'sub1235_conjuge': op = legal || p === 'abandona' ? primeiro('prometer', 'explicar') : primeiro('explicar', 'mentir'); break;
      case 'sub1235_recomeco': op = primeiro('familia', 'cortar'); break;
      case 'ilic_rumo': op = legal ? primeiro('sair_aos_poucos', 'parar_esquema') : primeiro('seguir_esquema'); break;
      case 'ilic_proposta': op = primeiro('recusar_proposta'); break;
      case 'jus_defesa': op = primeiro('manter', 'particular', 'publica'); break;
      case 'jus_recurso': op = primeiro('recorrer'); break;
      case 'sub125_familia': op = legal ? primeiro('prometer', 'contar') : primeiro('contar'); break;
      case 'sub125_disputa': op = LIDER.has(p) ? primeiro('disputar', 'apoiar_1') : primeiro('apoiar_1', 'neutro'); break;
      case 'sub125_retorno': case 'sub125_legado': op = primeiro('recusar'); break;
      case 'pri_rotina': op = primeiro('os_dois', 'estudar'); break;
      case 'pri_saida': op = primeiro('programa'); break;
      default:
        if (!legal && /^(sub|ilic_)/.test(id)) op = mo.opcoes.find(o => !o.bloqueio && !/parar|largar|sair|recusar|denunciar|ajuda|mudar|sumir|cortar|cooperar|entregar|negar|colaborar/.test(o.id));
    }
    op ??= primeiro('recusar', 'negociar', 'manter', 'esperar', 'neutro', 'seguir') ?? mo.opcoes.find(o => !o.bloqueio) ?? mo.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return v;
}

function comecar(p: Perfil, s: number): Vida {
  let v = adulto(26, { semente: 9000 + s * 37, municipioId: s % 3 === 0 ? 'rio-de-janeiro-rj' : 'sao-paulo-sp' });
  v.trabalho.atual = undefined;
  contratar(v, criarRng(s), ocupacao('assistente_adm'));
  v.financas.dividas = []; v.financas.negativado = false; v.momento = null; delete v.fila;
  v.financas.conta = LIDER.has(p) ? 400_000 : 30_000;
  delete v.fatos['proposta_ilicita'];
  v.justica = undefined;
  v.caminhos.envolvimento = undefined;
  if (s % 2 === 0) v = transacao(v, x => { comParceiro(x, { estagio: 'casamento' }); }).vida;
  if (p === 'nunca') return v;
  if (p === 'contratante') {
    return transacao(v, x => {
      const amigo = pessoaNova(x, 30); vincular(x, amigo, { origem: 'trabalho', proximidade: 50 }); amigo.temperamento.responsabilidade = -0.8; x.vinculos[amigo.id].confianca = 60;
      const desafeto = pessoaNova(x, 35); const vin = vincular(x, desafeto, { origem: 'vizinhanca', proximidade: 20 }); vin.tensao = 40; vin.ruptura = { t: x.t, porque: 'uma briga de vizinhos', quem: 'outro' };
    }).vida;
  }
  return transacao(v, (x, r) => {
    entrar(x, p === 'independente' ? 'patrimonial' : 'grupo', undefined, r);
    const e = x.caminhos.envolvimento!;
    criarContato(x, p === 'independente' ? 'furtos' : 'organizado', p === 'independente' ? 'parceiro' : 'chefe');
    garantirCidade(x);
    if (p === 'sucessao') comFilho(x, 8);
    if (p === 'condenado') { x.justica = { antecedentes: [{ t: x.t, categoria: 'patrimonial', desfecho: 'prisao', anos: 4 }] }; prender(x, x.t + 30, 'fechado', 'pena'); x.justica.prisao!.penaMeses = 48; e.parou = x.t; return; }
    if (!DE_DENTRO.has(p)) return;
    const o = orgsDaCidade(x).find(z => z.ramo === 'organizado')!;
    const rel = relacaoCom(x, o);
    if (LIDER.has(p)) {
      e.reputacao = 65;
      rel.relacao = 'membro'; rel.lealdade = 65; definirNivel(x, rel, p === 'lider' ? 4 : 6);
      if (p !== 'lider') for (const m of o.quadro) if (m.nivel >= 6) m.nivel = 5;
      if (p === 'lider_contestado') { o.coesao = 32; for (const m of o.quadro.filter(z => z.nivel >= 4)) { m.ambicao = 0.85; m.lealdade = 28; } }
    } else if (p === 'operacao' || p === 'traido' || p === 'guerra') {
      rel.relacao = 'membro'; rel.lealdade = 60; definirNivel(x, rel, 3);
      if (p === 'operacao') o.pressao = 85;
      if (p === 'traido') for (const m of o.quadro.filter(z => z.nivel < 6)) { m.lealdade = 15; m.ambicao = 0.8; }
      const b = orgsDaCidade(x).find(z => z.id !== o.id)!;
      if (p === 'guerra') definirEstado(o, b, 'conflito');
      if (p === 'traido') definirEstado(o, b, 'rivalidade');
    } else { rel.relacao = 'aliada'; rel.lealdade = 50; }
  }).vida;
}

/** O ano do perfil, com as ações da tela. */
function politica(p: Perfil, v: Vida, ano: number, legal: boolean): Vida {
  const e = v.caminhos.envolvimento;
  if (p === 'contratante') {
    if (ano === 1) { const alvo = Object.values(v.vinculos).find(x => x.ruptura)?.pessoaId; if (alvo) v = crime(v, { area: 'servico', tipo: 'intimidacao', alvoId: alvo }); }
    if (ano === 3) v = crime(v, { area: 'servico', tipo: 'favor' });
    return v;
  }
  const ativo = !!e && e.parou === undefined && !v.justica?.prisao;
  if (ativo && !legal) {
    for (const x of abertas(v)) { if (!x.negociada && x.gravidade >= 2) v = crime(v, { area: 'encomenda', oque: 'negociar', id: x.id }); v = crime(v, { area: 'encomenda', oque: 'aceitar', id: x.id }); }
    for (const o of oportunidades(v)) v = crime(v, { area: 'oportunidade', id: o.id, oque: o.chance >= 0.55 ? 'aceitar' : 'recusar' });
    for (const c of contatosAtivos(v).slice(0, 2)) v = crime(v, { area: 'contato', oque: 'conversar', pessoaId: c.id });
    if (DE_DENTRO.has(p)) {
      for (const o of orgsDaCidade(v).filter(z => v.caminhos.envolvimento?.organizacoes?.some(r => r.id === z.id && r.relacao !== 'rival'))) {
        if (!v.caminhos.envolvimento!.organizacoes!.some(r => r.relacao === 'membro' && r.saiu === undefined)) v = crime(v, { area: 'org', oque: 'filiar', orgId: o.id });
        v = crime(v, { area: 'org', oque: 'tarefa', orgId: o.id });
        if (p === 'promocao' || p === 'lider') { v = crime(v, { area: 'org', oque: 'reuniao', orgId: o.id }); v = crime(v, { area: 'org', oque: 'promocao', orgId: o.id }); }
        if (LIDER.has(p)) {
          v = crime(v, { area: 'org', oque: 'disputar', orgId: o.id });
          if (o.coesao < 50) v = crime(v, { area: 'org', oque: 'mediar', orgId: o.id });
          v = crime(v, { area: 'org', oque: o.pressao >= 50 ? 'recolher' : ano % 2 ? 'prioridade_negocios' : 'prioridade_consolidar', orgId: o.id });
          const rel = v.caminhos.envolvimento!.organizacoes!.find(r => r.id === o.id);
          if (rel) for (const m of o.quadro.filter(z => z.nivel < 6 && (z.estado === 'ativo' || z.estado === 'preso'))) v = crime(v, { area: 'subordinado', orgId: o.id, membroId: m.id, oque: m.estado === 'preso' ? 'proteger' : (m.lealdade ?? 50) < 40 ? 'promover' : 'cobrar' });
        }
      }
    }
    if (p === 'independente') { v = tenta(v, { tipo: 'submundo', oque: 'servico_pequeno' as never, ramo: 'furtos' }); v = tenta(v, { tipo: 'submundo', oque: 'servico_maior' as never, ramo: 'furtos' }); }
  }
  // A Justiça: a defesa ativa.
  if (v.justica?.processo && !v.justica.foragido) {
    v = crime(v, { area: 'justica', oque: 'estrategia_contestar' });
    v = crime(v, { area: 'justica', oque: 'audiencia_preparar' });
    v = crime(v, { area: 'justica', oque: 'audiencia_comparecer' });
  }
  v = crime(v, { area: 'justica', oque: 'recorrer' });
  if (v.justica?.prisao) for (const oque of ['estudar', 'trabalhar', 'cartas', 'saude', 'visitas', 'preparar_saida'] as const) v = tenta(v, { tipo: 'prisao', oque });
  if (!v.justica?.prisao && !v.trabalho.atual && (legal || p === 'condenado')) v = tenta(v, { tipo: 'candidatar', ocupacaoId: 'assistente_adm' });
  // Quem ganha compra (um carro, uma vez): o que a Justiça pode bloquear e tomar.
  if (!legal && v.financas.conta > 110_000 && !v.financas.bens.some(b => b.tipo === 'veiculo' && b.tCompra >= (v.caminhos.envolvimento?.tInicio ?? 0))) v = tenta(v, { tipo: 'comprar_veiculo', modeloId: 'carro_novo', financiar: false });
  if (v.financas.conta > 200_000) v = tenta(v, { tipo: 'investir', destino: 'pos_fixado', valor: Math.round(v.financas.conta - 100_000) });
  return v;
}

const TIPOS_DE_CASO = ['confronto', 'operacao', 'perseguicao', 'contestacao', 'traicao', 'suspeita', 'raro', 'conjuge', 'recomeco'] as const;

for (const p of PERFIS) {
  const pat = { 10: [] as number[], 20: [] as number[], 30: [] as number[] };
  const c = {
    vidas: 0, anos: 0, ms: 0, anosGuerra: 0, anosMembro: 0, operacoesOrg: 0, operacoesJogador: 0, buscas: 0, contestacoes: 0, comandosPerdidos: 0, chegouAoComando: 0,
    delacoes: 0, mudaramDeLado: 0, boatos: 0, boatosVerdade: 0, ferimentos: 0, internacoes: 0, mortesCrime: 0, mortesOutras: 0, contatosMortos: 0, mortesNoQuadroGuerra: 0,
    familiaRejeita: 0, parFoiEmbora: 0, vidasComPar: 0, vidasCondenadas: 0, vidasCustodia: 0, bensConfiscados: 0, flagrantes: 0, orgsExtintas: 0, orgsNovas: 0, trocasDeComando: 0,
    empregadoNoFim: 0, recomecoTrabalho: 0, recomecoLimpo: 0, saveOk: 0, ajustes: 0, anomalias: 0, porFora: [] as number[], casos: {} as Record<string, number>, escolhas: {} as Record<string, number>, tons: { bom: 0, ruim: 0, neutro: 0 },
    separacoesPeloCrime: 0, herdeiroSemCargo: 0, herdeiros: 0, orgContinua: 0, legadoContatos: 0, cenas: new Map<string, number>()
  };
  for (let s = 0; s < N; s++) {
    let v = comecar(p, s);
    const par0 = Object.values(v.vinculos).find(x => x.romance && x.romance.estagio !== 'ex')?.pessoaId;
    let presoAnos = 0, morreuNoCrime = false;
    const t0 = Date.now();
    let geracao = 0;
    for (let a = 0; a < ANOS; a++) {
      if (v.morte) {
        // O perfil da sucessão: quem morreu deixa herdeiros — a história continua com um deles (e o mundo do crime também).
        if (p === 'sucessao' && geracao === 0) {
          const h = sucessores(v).find(x => x.pode);
          if (!h) break;
          const orgsAntes = (v.caminhos.envolvimento?.organizacoes ?? []).filter(o => o.relacao === 'membro').map(o => o.id);
          const r2 = continuarComo(v, h.pessoa.id);
          if (r2.erro) break;
          v = r2.vida; geracao = 1; c.herdeiros++;
          if (!(v.caminhos.envolvimento?.organizacoes ?? []).some(o => o.relacao === 'membro' && (o.nivel ?? 0) > 0)) c.herdeiroSemCargo++;
          if (orgsAntes.some(id => orgViva(v, id)?.estado !== 'extinta')) c.orgContinua++;
          if (v.mundoCriminal?.legado?.contatos?.length) c.legadoContatos++;
          continue;
        }
        break;
      }
      const legal = p === 'nunca' || p === 'contratante' || p === 'condenado' || (p === 'abandona' && a >= 6) || geracao === 1;
      if ((p === 'muda_cidade' || p === 'muda_pais') && a === 6) v = transacao(v, x => mudarAgora(x, p === 'muda_pais' ? capitalDoPais('PT')!.id : 'porto-alegre-rs', 'sim', { internacional: p === 'muda_pais', comAFamilia: true })).vida;
      if (p === 'abandona' && a === 6) {
        const rel = v.caminhos.envolvimento?.organizacoes?.find(o => o.relacao === 'membro' && o.saiu === undefined);
        if (rel) v = crime(v, { area: 'org', oque: 'sair', orgId: rel.id });
        v = crime(v, { area: 'rumo', oque: 'sair_aos_poucos' });
      }
      if (p === 'sucessao' && a === 12 && geracao === 0 && v.caminhos.envolvimento) v = transacao(v, x => { x.caminhos.envolvimento!.morteNoCrime = { t: x.t + 12, causa: 'violência ligada ao crime' }; }).vida;
      v = politica(p, v, a, legal);
      v = responder(avancarAno(v).vida, p, legal, c.cenas);
      c.anos++;
      const e = v.caminhos.envolvimento;
      if (v.justica?.prisao) presoAnos++;
      const rel = e?.organizacoes?.find(o => (o.relacao === 'membro' || o.propria) && o.saiu === undefined && o.expulso === undefined);
      if (rel) {
        c.anosMembro++;
        const o = orgViva(v, rel.id);
        if (o && Object.values(o.relacoes ?? {}).includes('conflito')) c.anosGuerra++;
        if (o?.operacao?.t === v.t) c.operacoesOrg++;
        if (nivelDe(v, rel) >= 6 || rel.propria) c.chegouAoComando++;
      }
      const ex = v.financas.extrato;
      if (ex && ex.tFim === v.t) { const cc = conciliar(ex); if (!cc.ok) c.ajustes++; c.porFora.push(ex.linhas.filter(l => l.tipo === 'por_fora').reduce((s2, l) => s2 + l.conta, 0)); }
      const b = balanco(v).liquido;
      if (!Number.isFinite(b) || !Number.isFinite(v.financas.conta)) c.anomalias++;
      if ([10, 20, 30].includes(a + 1)) pat[(a + 1) as 10 | 20 | 30].push(b);
      if (v.morte && /crime/.test(v.morte.causa)) morreuNoCrime = true;
    }
    c.ms += Date.now() - t0;
    c.vidas++;
    const e = v.caminhos.envolvimento;
    for (const x of e?.casos ?? []) {
      c.casos[x.tipo] = (c.casos[x.tipo] ?? 0) + 1;
      if (x.escolha) { c.escolhas[`${x.tipo}:${x.escolha}`] = (c.escolhas[`${x.tipo}:${x.escolha}`] ?? 0) + 1; c.tons[x.tom ?? 'neutro']++; }
      if (x.tipo === 'contestacao') c.contestacoes++;
      if (x.tipo === 'traicao' && x.situacao === 'delacao') c.delacoes++;
      if (x.tipo === 'traicao' && x.situacao === 'mudou') c.mudaramDeLado++;
      if (x.tipo === 'suspeita') { c.boatos++; if (x.verdade) c.boatosVerdade++; }
    }
    c.operacoesJogador += v.fatos['operacoes_no_jogador'] ?? 0;
    c.buscas += (e?.casos ?? []).filter(x => x.tipo === 'operacao').length;
    c.comandosPerdidos += v.fatos['comandos_perdidos'] ?? 0;
    c.ferimentos += v.fatos['ferimentos_crime'] ?? 0;
    c.internacoes += v.fatos['internacoes_crime'] ?? 0;
    c.contatosMortos += v.fatos['contatos_mortos_crime'] ?? 0;
    c.flagrantes += v.fatos['flagrantes'] ?? 0;
    c.bensConfiscados += v.fatos['bens_confiscados'] ?? 0;
    if (morreuNoCrime) c.mortesCrime++; else if (v.morte) c.mortesOutras++;
    if (Object.values(e?.familia ?? {}).some(f => f.postura === 'rejeita' || f.postura === 'pede_para_sair')) c.familiaRejeita++;
    if (par0) { c.vidasComPar++; if (!v.vinculos[par0]?.romance || v.vinculos[par0].romance!.estagio === 'ex') c.parFoiEmbora++; }
    c.separacoesPeloCrime += (v.fatos['par_foi_embora_crime'] ?? 0) > 0 ? 1 : 0;
    const ants = v.justica?.antecedentes ?? [];
    if (ants.some(x => x.desfecho === 'prisao')) c.vidasCondenadas++;
    if (presoAnos > 0) c.vidasCustodia++;
    for (const o of Object.values(v.mundoCriminal?.orgs ?? {})) {
      if (o.estado === 'extinta') c.orgsExtintas++;
      if (o.desde > v.t - ANOS * 12 && (o.rachaDe || o.historia.some(h => /surgiu no espaço|Nasceu de um racha/.test(h.texto)))) c.orgsNovas++;
      c.trocasDeComando += o.historia.filter(h => /passou a mandar|O comando mudou/.test(h.texto)).length;
      c.mortesNoQuadroGuerra += o.quadro.filter(m => m.estado === 'morto' && /guerra/.test(m.causa ?? '')).length;
    }
    if (v.trabalho.atual) c.empregadoNoFim++;
    if (e?.recomeco?.marcos['trabalho'] !== undefined) c.recomecoTrabalho++;
    if (e?.recomeco?.marcos['limpo'] !== undefined) c.recomecoLimpo++;
    const rt = interpretar(JSON.stringify(v));
    if (rt.tipo === 'ok') { const de = interpretar(JSON.stringify(rt.vida)); if (de.tipo === 'ok' && JSON.stringify(de.vida.caminhos.envolvimento) === JSON.stringify(rt.vida.caminhos.envolvimento) && JSON.stringify(de.vida.mundoCriminal) === JSON.stringify(rt.vida.mundoCriminal)) c.saveOk++; }
  }
  const mm = (a: 10 | 20 | 30) => `${a}a ${k(pct(pat[a], 0.1))}/${k(pct(pat[a], 0.5))}/${k(pct(pat[a], 0.9))}`;
  const n = c.vidas;
  console.log(`\n## ${p} (${n} vidas × até ${ANOS} anos; ${(c.ms / Math.max(1, c.anos)).toFixed(1)} ms por ano de vida)`);
  console.log(`- patrimônio ${mm(10)} | ${mm(20)} | ${mm(30)} · por fora/ano p50 ${k(pct(c.porFora, 0.5))} p90 ${k(pct(c.porFora, 0.9))}`);
  console.log(`- casos: ${TIPOS_DE_CASO.map(t => `${t} ${c.casos[t] ?? 0}`).join(' · ')} · resolvidos bem/mal/neutro ${c.tons.bom}/${c.tons.ruim}/${c.tons.neutro}`);
  console.log(`- escolhas: ${Object.entries(c.escolhas).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([x, y]) => `${x} ${y}`).join(', ')}`);
  console.log(`- guerra: anos de membro ${c.anosMembro}, com a org em guerra ${c.anosGuerra} (${Math.round(c.anosGuerra / Math.max(1, c.anosMembro) * 100)}%) · mortos na guerra (quadros, todas as orgs) ${c.mortesNoQuadroGuerra} · contatos seus mortos ${c.contatosMortos}`);
  console.log(`- polícia: operações na sua org ${c.operacoesOrg} · que chegaram a você ${c.operacoesJogador} · buscas na casa ${c.buscas} · flagrantes ${c.flagrantes} · bens confiscados ${c.bensConfiscados}`);
  console.log(`- poder: anos no comando ${c.chegouAoComando} · contestações ${c.contestacoes} · comandos perdidos ${c.comandosPerdidos} · delações ${c.delacoes} · mudaram de lado ${c.mudaramDeLado} · boatos ${c.boatos} (verdadeiros ${c.boatosVerdade})`);
  console.log(`- corpo: ferimentos ${c.ferimentos} · internações ${c.internacoes} · mortes no crime ${c.mortesCrime}/${n} · outras mortes ${c.mortesOutras}`);
  console.log(`- Justiça: condenadas à prisão ${c.vidasCondenadas}/${n} (${Math.round(c.vidasCondenadas / n * 100)}%) · passaram por custódia ${c.vidasCustodia}/${n}`);
  console.log(`- família: alguém rejeita/pede para sair ${c.familiaRejeita}/${n} · casamentos terminados ${c.parFoiEmbora}/${c.vidasComPar} (por causa do crime: ${c.separacoesPeloCrime})`);
  console.log(`- mundo: orgs extintas ${c.orgsExtintas} · surgidas (racha/vazio) ${c.orgsNovas} · trocas de comando ${c.trocasDeComando}`);
  console.log(`- recomeço: empregado no fim ${c.empregadoNoFim}/${n} · 1º emprego depois de sair ${c.recomecoTrabalho} · 5 anos limpos ${c.recomecoLimpo}${c.herdeiros ? ` · gerações: herdeiros ${c.herdeiros}, sem cargo herdado ${c.herdeiroSemCargo}, org do pai continua ${c.orgContinua}, contatos no legado ${c.legadoContatos}` : ''}`);
  console.log(`- save ida e volta ${c.saveOk}/${n} · ajustes no extrato ${c.ajustes} · anomalias ${c.anomalias}`);
  const top = [...c.cenas.entries()].filter(([x]) => /^(sub|ilic|jus|pri)/.test(x)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([x, y]) => `${x} ${y}`).join(', ');
  console.log(`- cenas mais vistas: ${top}`);
}
console.log('\nFIM');
