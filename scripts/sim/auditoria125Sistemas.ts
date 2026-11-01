/**
 * VIDA 12.5 · auditoria transversal de sistemas — economia, idade/tempo, família, eventos, carreiras.
 * Vidas inteiras com os perfis de `agentes` (mais um "comprador" opcional que compra e vende coisas, itens e veículos)
 * contando, ano a ano, o que nunca deveria acontecer. Cada violação guarda um exemplo com semente/perfil/idade.
 *
 *   npx esbuild scripts/sim/auditoria125Sistemas.ts --bundle --platform=node --format=esm --outfile=<scratch>/a.mjs && N=6 node <scratch>/a.mjs
 *
 *   N        vidas por perfil (padrão 6)     ATE   idade final (padrão 85)
 *   PERFIS   lista (padrão: os 9 do populacao97)   SO   uma semente só (repro)
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade, idadePessoa } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { criarRng, type Rng } from '../../src/motor/rng';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { CATALOGO } from '../../src/motor/conteudo/catalogo';
import { COISAS } from '../../src/motor/dados/coisas';
import { ITENS_ESTILO } from '../../src/motor/dados/estilo';
import { precoDaCoisa, valorDeRevenda } from '../../src/motor/sistemas/coisas';
import type { Classe, Vida } from '../../src/motor/tipos';
import { agente } from './agentes';
import { writeFileSync } from 'node:fs';
const OUT = process.env.OUT;
let linhas: string[] = [];
const log = (x: string) => { linhas.push(x); };

const N = Number(process.env.N ?? 6);
const ATE = Number(process.env.ATE ?? 85);
const SO = process.env.SO ? Number(process.env.SO) : undefined;
const PERFIS = (process.env.PERFIS ?? 'social,estudioso,ambicioso,esportista,familiar,economico,passivo,aleatorio,impulsivo').split(',');
const CLASSES: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];
const PAISES = ['BR', 'BR', 'BR', 'PT', 'US', 'AR', 'JP', 'NG', 'DE'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const aplicado = (v: Vida) => v.financas.investimentos.reduce((s, a) => s + a.valor, 0);

const cont: Record<string, number> = {};
const ex: Record<string, string[]> = {};
const vistosViol = new Set<string>();
function viol(k: string, msg: string) { if (vistosViol.has(k + msg.replace(/ \d+a /, ' '))) return; vistosViol.add(k + msg.replace(/ \d+a /, ' ')); cont[k] = (cont[k] ?? 0) + 1; const l = (ex[k] ??= []); if (l.length < 6) l.push(msg); }
const info: Record<string, number> = {};
const inc = (k: string, n = 1) => { info[k] = (info[k] ?? 0) + n; };

/* --------------------------------------------------------------- varredura de números */
function varrer(o: unknown, caminho: string, tag: string, prof = 0) {
  if (prof > 9 || o === null || o === undefined) return;
  if (typeof o === 'number') { if (!Number.isFinite(o)) viol('numero_nao_finito', `${tag} ${caminho}=${o}`); return; }
  if (typeof o !== 'object') return;
  if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) varrer(o[i], `${caminho}[${i}]`, tag, prof + 1); return; }
  for (const [k, x] of Object.entries(o as Record<string, unknown>)) {
    if (k === 'biografia' || k === 'ocorrencias' || k === 'historia') continue;
    varrer(x, caminho ? `${caminho}.${k}` : k, tag, prof + 1);
  }
}

/* --------------------------------------------------------------- eventos */
const ocVidas: Record<string, number> = {}, ocTotal: Record<string, number> = {}, ocMaxVida: Record<string, number> = {};
const ocMaxEx: Record<string, string> = {};
const sitVistas: Record<string, number> = {};
const opcaoTot: Record<string, number> = {}, opcaoNula: Record<string, number> = {};
let idadesCobertas = new Set<number>();

function impressao(v: Vida): string {
  let vs = 0; for (const x of Object.values(v.vinculos)) vs += x.proximidade + x.confianca * 3 + x.tensao * 7 + (x.romance ? x.romance.envolvimento * 11 + x.romance.estagio.length : 0) + x.historia.length;
  return JSON.stringify([Math.round(v.financas.conta), Math.round(aplicado(v)), v.financas.dividas.length, v.financas.bens.length, (v.financas.coisas ?? []).length, v.corpo, v.mente, v.fatos, v.biografia.length, Math.round(vs * 100), Object.keys(v.pessoas).length, v.trabalho, v.educacao, v.caminhos, v.moradia, (v.ecos ?? []).length, v.segredos, v.justica, v.notoriedade, v.processos.length, v.rotinas, (v.fila ?? []).length, v.luto.length, v.personalidade, v.eu.visual, v.mundoCriminal, v.organizacoes, v.trisal]);
}

function decidir(v: Vida, ag: ReturnType<typeof agente>, r: Rng): Vida {
  for (let j = 0; j < 12 && v.momento && !v.morte; j++) {
    const m = v.momento!;
    const op = ag.decidir(v, m, r);
    sitVistas[m.situacaoId] = (sitVistas[m.situacaoId] ?? 0) + 1;
    const antes = impressao(v);
    const prox = executar(v, { tipo: 'decidir', opcaoId: op }).vida;
    const k = `${m.situacaoId}:${op}`;
    opcaoTot[k] = (opcaoTot[k] ?? 0) + 1;
    if (prox.momento?.id !== m.id && impressao(prox) === antes) opcaoNula[k] = (opcaoNula[k] ?? 0) + 1;
    v = prox;
  }
  return v;
}

/* --------------------------------------------------------------- comprador */
const compras = { coisa: 0, coisaErr: 0, venda: 0, vendaErr: 0, item: 0, itemErr: 0, veiculo: 0, vendaBem: 0 };
function comprar(v: Vida, r: Rng, tag: string): Vida {
  const i = idade(v);
  if (i < 12 || v.morte) return v;
  // comprar uma coisa
  if (r.chance(0.35)) {
    const c = r.pick([...COISAS]);
    const a: Acao = { tipo: 'comprar_coisa', coisaId: c.id };
    if (tenta(v, a) && disponibilidade(v, a).grau === 'permitido') {
      const preco = precoDaCoisa(v, c.id);
      const n0 = (v.financas.coisas ?? []).length, d0 = v.financas.conta + aplicado(v);
      const lote = c.id === 'discos' && (v.financas.coisas ?? []).some(x => x.coisaId === 'discos');
      v = executar(v, a).vida; compras.coisa++;
      const d1 = v.financas.conta + aplicado(v), n1 = (v.financas.coisas ?? []).length;
      if (Math.abs(d0 - d1 - preco) > 2) { compras.coisaErr++; viol('compra_coisa_valor', `${tag} ${i}a ${c.id}: preço ${preco}, saiu ${Math.round(d0 - d1)}`); }
      if (n1 !== n0 + (lote ? 0 : 1)) { compras.coisaErr++; viol('compra_coisa_qtd', `${tag} ${i}a ${c.id}: ${n0}→${n1}`); }
    }
  }
  // vender uma coisa
  const cs = v.financas.coisas ?? [];
  if (cs.length && r.chance(0.12)) {
    const t = r.pick(cs);
    const a: Acao = { tipo: 'vender_coisa', coisaTidaId: t.id };
    if (tenta(v, a)) {
      const valor = valorDeRevenda(v, t), c0 = v.financas.conta, n0 = cs.length;
      if (t.emprestadaA) viol('vende_coisa_emprestada', `${tag} ${i}a vendeu ${t.coisaId} emprestada a ${t.emprestadaA}`);
      v = executar(v, a).vida; compras.venda++;
      if (Math.abs(v.financas.conta - c0 - valor) > 2) { compras.vendaErr++; viol('venda_coisa_valor', `${tag} ${i}a ${t.coisaId}: revenda ${valor}, entrou ${Math.round(v.financas.conta - c0)}`); }
      if ((v.financas.coisas ?? []).length !== n0 - 1) { compras.vendaErr++; viol('venda_coisa_qtd', `${tag} ${i}a ${t.coisaId}`); }
    }
  }
  // item de estilo
  if (r.chance(0.2)) {
    const it = r.pick([...ITENS_ESTILO]);
    const a: Acao = { tipo: 'comprar_item', itemId: it.id };
    if (tenta(v, a) && disponibilidade(v, a).grau === 'permitido') {
      const n0 = v.eu.estilo?.itens.length ?? 0, d0 = v.financas.conta + aplicado(v);
      v = executar(v, a).vida; compras.item++;
      const n1 = v.eu.estilo?.itens.length ?? 0, novo = v.eu.estilo?.itens[n1 - 1];
      if (n1 !== n0 + 1) { compras.itemErr++; viol('compra_item_qtd', `${tag} ${i}a ${it.id}: ${n0}→${n1}`); }
      else if (novo && Math.abs(d0 - (v.financas.conta + aplicado(v)) - novo.preco) > 2) { compras.itemErr++; viol('compra_item_valor', `${tag} ${i}a ${it.id}: preço ${novo.preco}, saiu ${Math.round(d0 - v.financas.conta - aplicado(v))}`); }
    }
  }
  // veículo (de vez em quando) e venda de bem
  if (i >= 18 && r.chance(0.06)) {
    for (const modeloId of ['carro_compacto', 'moto_pequena', 'carro_sedan', 'bike']) {
      const a: Acao = { tipo: 'comprar_veiculo', modeloId, financiar: false };
      if (!tenta(v, a) || disponibilidade(v, a).grau !== 'permitido') continue;
      const n0 = v.financas.bens.length; v = executar(v, a).vida; compras.veiculo++;
      if (v.financas.bens.length !== n0 + 1) viol('compra_veiculo_qtd', `${tag} ${i}a ${modeloId}`);
      break;
    }
  }
  if (i >= 18 && v.financas.bens.length && r.chance(0.04)) {
    const b = r.pick(v.financas.bens);
    const a: Acao = { tipo: 'vender_bem', bemId: b.id };
    if (tenta(v, a) && disponibilidade(v, a).grau === 'permitido') {
      const n0 = v.financas.bens.length; v = executar(v, a).vida; compras.vendaBem++;
      if (v.financas.bens.length !== n0 - 1 || v.financas.bens.some(x => x.id === b.id)) viol('venda_bem_qtd', `${tag} ${i}a ${b.id}`);
      if (v.financas.dividas.some(d => d.bemId === b.id)) viol('venda_bem_divida_orfa', `${tag} ${i}a ${b.id}`);
    }
  }
  return v;
}

/* --------------------------------------------------------------- invariantes do ano */
const BIO_INFANTIL = /\b(cerveja|bebeu|b[eê]bad|porre|ressaca|cigarro|fumou|namor|beij|transa|sexo|sal[aá]rio|demitid|contratad|carteira assinada|promovid|casou|noiv)/i;
const pendente: number[] = []; const pendenteRel: number[] = [];
const rotPend: Record<string, number> = {};

interface Estado { estagio: Record<string, string>; vivos: Record<string, boolean>; familia: string[]; emprego?: string; ocup?: string; empregador?: string; nBio: number; idade: number; bens: Set<string>; coisas: Set<string>; }

function checarAno(v: Vida, e: Estado, tag: string, avancou: boolean) {
  const i = idade(v);
  const novas = v.biografia.slice(e.nBio);
  // ---- tempo
  if (avancou && !v.morte && i !== e.idade + 1) viol('idade_salto', `${tag} ${e.idade}→${i}`);
  for (const [k, x] of [['saude', v.corpo.saude], ['forma', v.corpo.forma], ['aparencia', v.corpo.aparencia], ['felicidade', v.mente.felicidade], ['estresse', v.mente.estresse], ['cognicao', v.mente.cognicao]] as const)
    if (!(x >= 0 && x <= 100)) viol('atributo_fora', `${tag} ${i}a ${k}=${x}`);
  varrer(v, '', `${tag} ${i}a`);
  // ---- economia
  const f = v.financas;
  const ids = (arr: { id: string }[], nome: string) => { const s = new Set<string>(); for (const x of arr) { if (s.has(x.id)) viol('id_duplicado', `${tag} ${i}a ${nome} ${x.id}`); s.add(x.id); } };
  ids(f.bens, 'bem'); ids(f.coisas ?? [], 'coisa'); ids(f.dividas, 'divida'); ids(f.investimentos as { id: string }[], 'aplicacao'); ids(f.colecao ?? [], 'colecao'); ids(v.eu.estilo?.itens ?? [], 'item');
  for (const b of f.bens) { if (!(b.valor >= 0)) viol('bem_valor_negativo', `${tag} ${i}a ${b.nome} valor=${b.valor}`); if (!(b.estado >= 0 && b.estado <= 100)) viol('bem_estado_fora', `${tag} ${i}a ${b.nome} estado=${b.estado}`); }
  for (const d of f.dividas) { if (!(d.saldo >= 0)) viol('divida_saldo_negativo', `${tag} ${i}a ${d.descricao} saldo=${d.saldo}`); if (d.bemId && !f.bens.some(b => b.id === d.bemId)) viol('divida_de_bem_inexistente', `${tag} ${i}a ${d.descricao} (bem ${d.bemId}) saldo=${Math.round(d.saldo)}`); }
  for (const a of f.investimentos) if (!(a.valor >= 0)) viol('aplicacao_negativa', `${tag} ${i}a ${a.produto}=${a.valor}`);
  for (const c of f.coisas ?? []) { if (!(c.preco >= 0)) viol('coisa_preco_negativo', `${tag} ${i}a ${c.coisaId}`); if (!(c.estado >= 0 && c.estado <= 100)) viol('coisa_estado_fora', `${tag} ${i}a ${c.coisaId} estado=${c.estado}`); if (c.quantidade !== undefined && c.quantidade < 1) viol('coisa_qtd', `${tag} ${i}a ${c.coisaId} q=${c.quantidade}`); }
  if (v.moradia.imovelId && !f.bens.some(b => b.id === v.moradia.imovelId)) viol('moradia_em_imovel_inexistente', `${tag} ${i}a ${v.moradia.imovelId} tipo=${v.moradia.tipo}`);
  if (v.moradia.tipo === 'propria' && v.moradia.aluguel > 0) viol('propria_com_aluguel', `${tag} ${i}a aluguel=${v.moradia.aluguel}`);
  // bens/coisas que somem sem venda (só conta quando a biografia do ano não fala de venda/roubo/perda)
  const bensAgora = new Set(f.bens.map(b => b.id));
  for (const id of e.bens) if (!bensAgora.has(id)) inc('bem_sumiu_no_ano');
  e.bens = bensAgora; e.coisas = new Set((f.coisas ?? []).map(c => c.id));
  // extrato do ano
  if (avancou && f.extrato) {
    const c = conciliar(f.extrato);
    if (!c.ok) viol('extrato_nao_concilia', `${tag} ${i}a dif=${c.diferencaConta}/${c.diferencaAplicado} ajustes=${c.ajustes.map(a => `${a.rotulo}:${a.conta}`).join(',')}`);
    const outros = f.extrato.linhas.filter(l => l.rotulo === 'Outros movimentos do ano');
    const tot = f.extrato.linhas.reduce((s, l) => s + Math.abs(l.conta), 0);
    const p = outros.reduce((s, l) => s + Math.abs(l.conta), 0);
    if (tot > 0) { pendente.push(p); pendenteRel.push(p / tot); }
    if (p > 5000 && p / Math.max(1, tot) > 0.25) viol('extrato_pendente_grande', `${tag} ${i}a "Outros movimentos" ${Math.round(outros[0]?.conta ?? 0)} de ${Math.round(tot)} movimentados`);
    for (const l of f.extrato.linhas) if (/aluguel/i.test(l.rotulo) && l.tipo === 'despesa' && v.moradia.tipo === 'propria' && v.t - v.moradia.tInicio >= 12) viol('aluguel_com_casa_propria', `${tag} ${i}a ${l.rotulo} ${l.conta}`);
    // rótulos repetidos com o mesmo sinal e valor (pagamento dobrado)
    const vistos = new Map<string, string>();
    for (const l of f.extrato.linhas) { if (Math.abs(l.conta) < 50) continue; const k = `${l.tipo}:${Math.round(l.conta)}`; if (vistos.has(k) && vistos.get(k) !== l.rotulo) inc('extrato_mesmo_valor_rotulos_diferentes'); vistos.set(k, l.rotulo); }
    for (const l of f.extrato.linhas) rotPend[`${l.tipo}|${l.rotulo}`] = (rotPend[`${l.tipo}|${l.rotulo}`] ?? 0) + 1;
  }
  // ---- trabalho
  const t = v.trabalho;
  if (t.atual) {
    if (i < 14 && t.atual.contrato !== 'informal') viol('emprego_crianca', `${tag} ${i}a ${t.atual.ocupacaoId} (${t.atual.contrato})`);
    if (i < 12) viol('emprego_menor_12', `${tag} ${i}a ${t.atual.ocupacaoId} (${t.atual.contrato}) ${t.atual.empregador}`);
    if (!(t.atual.salario >= 0)) viol('salario_invalido', `${tag} ${i}a ${t.atual.salario}`);
    if (!(t.atual.desempenho >= 0 && t.atual.desempenho <= 100)) viol('desempenho_fora', `${tag} ${i}a ${t.atual.desempenho}`);
    if (t.atual.tInicio > v.t) viol('emprego_futuro', `${tag} ${i}a`);
  }
  for (const h of t.historico) if (h.tFim < h.tInicio) viol('historico_fim_antes_inicio', `${tag} ${h.ocupacaoId} ${h.tInicio}→${h.tFim}`);
  const principais = t.historico.filter(h => h.motivo !== 'paralela' && !/paralel/i.test(h.motivo)).slice().sort((a, b) => a.tInicio - b.tInicio);
  for (let k = 1; k < principais.length; k++) if (principais[k].tInicio < principais[k - 1].tFim - 1 && principais[k].empregador !== principais[k - 1].empregador) { const kk = `${tag}${principais[k - 1].tInicio}${principais[k].tInicio}`; if (vistosViol.has(kk)) continue; vistosViol.add(kk); inc('historico_sobreposto'); if ((ex['historico_sobreposto_ex'] ??= []).length < 6) ex['historico_sobreposto_ex'].push(`${tag} ${principais[k - 1].ocupacaoId}@${principais[k - 1].empregador} ${principais[k - 1].tInicio}-${principais[k - 1].tFim} (${principais[k - 1].motivo}) × ${principais[k].ocupacaoId}@${principais[k].empregador} ${principais[k].tInicio}-${principais[k].tFim}`); }
  const chave = t.atual ? `${t.atual.empregador}|${t.atual.tInicio}` : undefined;
  if (avancou || true) {
    if (chave && chave !== e.emprego) {
      inc('emprego_novo');
      const temBio = novas.some(b => b.tema === 'trabalho' || /trabalh|emprego|vaga|contrat|cargo|empresa|loja|escrit|clube|posto|turno/i.test(b.texto));
      if (!temBio) { inc('emprego_novo_sem_bio'); if ((ex['emprego_novo_sem_bio'] ??= []).length < 8) ex['emprego_novo_sem_bio'].push(`${tag} ${i}a ${t.atual!.ocupacaoId} @ ${t.atual!.empregador} (${t.atual!.via ?? '?'}) | bio: ${novas.map(b => b.texto.slice(0, 60)).join(' / ').slice(0, 200)}`); }
    } else if (chave && t.atual!.ocupacaoId !== e.ocup) {
      inc('promocao_ou_troca_de_cargo');
      const temBio = novas.some(b => b.tema === 'trabalho' || /promo|cargo|posto|sub|virou|assum/i.test(b.texto));
      if (!temBio) { inc('cargo_novo_sem_bio'); if ((ex['cargo_novo_sem_bio'] ??= []).length < 8) ex['cargo_novo_sem_bio'].push(`${tag} ${i}a ${e.ocup}→${t.atual!.ocupacaoId} @ ${t.atual!.empregador}`); }
    }
    e.emprego = chave; e.ocup = t.atual?.ocupacaoId;
  }
  // ---- família e romance
  const principaisR = Object.values(v.vinculos).filter(x => x.romance && x.romance.estagio !== 'ex' && x.romance.estagio !== 'interesse' && !x.romance.secreto && !x.romance.paralelo && x.romance.estagio !== 'saindo' && !x.romance.fim && !!v.pessoas[x.pessoaId]?.vivo);
  const casados = principaisR.filter(x => x.romance!.estagio === 'casamento');
  if (casados.length > 1) viol('casado_com_dois', `${tag} ${i}a ${casados.map(x => `${v.pessoas[x.pessoaId]?.nome}(${x.romance!.estagio})`).join(', ')}`);
  if (principaisR.length > 1 && !v.trisal) viol('duas_parcerias_principais', `${tag} ${i}a ${principaisR.map(x => `${v.pessoas[x.pessoaId]?.nome}:${x.romance!.estagio}`).join(', ')}`);
  for (const x of Object.values(v.vinculos)) {
    const p = v.pessoas[x.pessoaId];
    if (!p) { viol('vinculo_sem_pessoa', `${tag} ${i}a ${x.pessoaId}`); continue; }
    const est = x.romance?.estagio;
    if (est && est !== 'ex' && !p.vivo && x.romance?.fim !== 'morte') viol('parceria_morta_ativa', `${tag} ${i}a ${p.nome} (${est}) morreu em ${p.tMorte}`);
    if (est && est !== 'ex' && x.romance?.fim === 'morte' && p.vivo) viol('viuvez_de_vivo', `${tag} ${i}a ${p.nome} (${est})`);
    if (est && est !== 'ex' && est !== 'interesse' && i < 12) viol('romance_crianca', `${tag} ${i}a ${p.nome} ${est}`);
    if (est && est !== 'ex' && est !== 'interesse' && p.vivo && ((i < 16 && idadePessoa(v, p) >= 18) || (i >= 18 && idadePessoa(v, p) < 16))) viol('romance_menor_adulto', `${tag} eu ${i}a × ${p.nome} ${idadePessoa(v, p)}a (${est})`);
    const antes = e.estagio[x.pessoaId];
    if (antes === 'ex' && est && est !== 'ex' && est !== 'interesse') {
      const fala = novas.some(b => b.pessoas?.includes(p.id) || b.texto.includes(p.nome));
      inc('ex_voltou');
      if (!fala) viol('ex_voltou_sem_evento', `${tag} ${i}a ${p.nome}: ex→${est}`);
    }
    if (antes && antes !== 'casamento' && est === 'casamento' && !novas.some(b => b.pessoas?.includes(p.id) || b.texto.includes(p.nome))) viol('casou_sem_bio', `${tag} ${i}a ${p.nome}: ${antes}→casamento`);
    if (antes === 'casamento' && est === 'ex' && x.romance?.fim !== 'morte' && !novas.some(b => b.pessoas?.includes(p.id) || b.texto.includes(p.nome) || /divórci|separ/i.test(b.texto))) viol('divorcio_sem_bio', `${tag} ${i}a ${p.nome}`);
    if (antes === 'casamento' && est === 'ex' && x.romance?.fim === 'morte') viol('viuvez_vira_ex', `${tag} ${i}a ${p.nome}`);
    if (est) e.estagio[x.pessoaId] = est; else delete e.estagio[x.pessoaId];
  }
  for (const id of e.familia) {
    if (!v.pessoas[id]) viol('familiar_sumiu', `${tag} ${i}a ${id}`);
    else if (!v.vinculos[id] && v.pessoas[id].vivo) viol('vinculo_familiar_perdido', `${tag} ${i}a ${v.pessoas[id].nome}`);
  }
  for (const p of Object.values(v.pessoas)) {
    if (p.especie) continue;
    if (e.vivos[p.id] === false && p.vivo) viol('ressuscitou', `${tag} ${i}a ${p.nome} ${p.sobrenome}`);
    e.vivos[p.id] = p.vivo;
    if (!p.vivo && p.tMorte === undefined) viol('morto_sem_tMorte', `${tag} ${p.nome}`);
    if (p.vivo && idadePessoa(v, p) > 112) viol('npc_imortal', `${tag} ${i}a ${p.nome} ${idadePessoa(v, p)}a`);
    if (p.tMorte !== undefined && p.tMorte < p.tNasc) viol('morreu_antes_de_nascer', `${tag} ${p.nome}`);
    for (const g of p.genitores ?? []) {
      const tg = g === 'eu' ? v.eu.tNasc : v.pessoas[g]?.tNasc;
      if (tg === undefined) continue;
      const dif = (p.tNasc - tg) / 12;
      const nomeG = g === 'eu' ? 'EU' : v.pessoas[g].nome;
      if (dif < 13) viol('genitor_jovem_demais', `${tag} ${nomeG} tinha ${dif.toFixed(1)}a quando ${p.nome} nasceu`);
      const gen = g === 'eu' ? v.eu.genero : v.pessoas[g].genero;
      if (gen === 'feminino' && dif > 52 && !p.reconhecidoPor) viol('mae_velha_demais', `${tag} ${nomeG} tinha ${dif.toFixed(1)}a quando ${p.nome} nasceu`);
      const gp = g === 'eu' ? undefined : v.pessoas[g];
      if (gp && gp.tMorte !== undefined && p.tNasc > gp.tMorte + (gen === 'masculino' ? 10 : 1)) viol('nasceu_depois_da_morte_do_genitor', `${tag} ${p.nome} nasceu ${((p.tNasc - gp.tMorte) / 12).toFixed(1)}a depois da morte de ${gp.nome}`);
    }
  }
  // ---- texto impróprio para a idade
  if (i < 12) for (const b of novas) if (b.idade < 12 && BIO_INFANTIL.test(b.texto) && !b.pessoas?.length) { inc('bio_infantil_suspeita'); if ((ex['bio_infantil_suspeita'] ??= []).length < 14) ex['bio_infantil_suspeita'].push(`${tag} ${b.idade}a "${b.texto.slice(0, 140)}"`); }
  e.nBio = v.biografia.length; e.idade = i;
}

/* --------------------------------------------------------------- main */
await carregarMundo();
const t0 = Date.now();
let anos = 0, vidas = 0, crashes = 0;
const crashEx: string[] = [];
for (const nomePerfil of PERFIS) {
  for (let k = 0; k < N; k++) {
    const pais = PAISES[k % PAISES.length];
    const cids = pais === 'BR' ? ['recife-pe', 'sao-paulo-sp', 'salvador-ba', 'porto-alegre-rs', 'belem-pa', 'uberaba-mg', 'manaus-am'] : cidadesDoPais(pais).slice(0, 6).map(c => c.id);
    const municipioId = cids[k % cids.length];
    const classe = CLASSES[(k * 3 + PERFIS.indexOf(nomePerfil)) % 5];
    const genero = k % 2 ? 'masculino' : 'feminino';
    const semente = 125000 + PERFIS.indexOf(nomePerfil) * 1000 + k * 7;
    if (SO !== undefined && semente !== SO) continue;
    const comprador = k % 2 === 0;
    const tag = `[${nomePerfil}#${k} s=${semente} ${pais}/${classe}/${genero[0]}${comprador ? '/compra' : ''}]`;
    const ag = agente(nomePerfil); const r = criarRng(semente); const rc = criarRng(semente + 1);
    let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Ulação', genero, municipioId, semente, classe });
    vidas++;
    const familia = Object.values(v.vinculos).filter(x => x.parentesco && /^(pai|mae|irmao)$/.test(x.parentesco)).map(x => x.pessoaId);
    const e: Estado = { estagio: {}, vivos: {}, familia, nBio: v.biografia.length, idade: idade(v), bens: new Set(), coisas: new Set() };
    const ocAqui: Record<string, number> = {};
    try {
      while (!v.morte && idade(v) < ATE) {
        for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; v = decidir(v, ag, r); }
        if (comprador) v = comprar(v, rc, tag);
        checarAno(v, e, tag, false);
        v = avancarAno(v).vida; anos++;
        idadesCobertas.add(idade(v));
        v = decidir(v, ag, r);
        checarAno(v, e, tag, true);
      }
    } catch (err) { crashes++; crashEx.push(`${tag} ${idade(v)}a: ${(err as Error).message?.slice(0, 160)}`); }
    if (SO !== undefined) { const cnh = v.ocorrencias.filter(o => o.id === 'cnh_prova'); const porIdade: Record<number, number> = {}; for (const o of cnh) porIdade[o.idade] = (porIdade[o.idade] ?? 0) + 1; console.error('CNH por idade', JSON.stringify(porIdade), 'fatos cnh:', Object.keys(v.fatos).filter(k => /cnh|habil|carteira/.test(k)).join(','), 'bio cnh:', v.biografia.filter(b => /prova|carteira|CNH|habilita/i.test(b.texto)).map(b => `${b.idade}a ${b.texto.slice(0, 70)}`).join(' | ')); }
    for (const o of v.ocorrencias) ocAqui[o.id] = (ocAqui[o.id] ?? 0) + 1;
    for (const [id, n] of Object.entries(ocAqui)) {
      ocVidas[id] = (ocVidas[id] ?? 0) + 1; ocTotal[id] = (ocTotal[id] ?? 0) + n;
      if (n > (ocMaxVida[id] ?? 0)) { ocMaxVida[id] = n; ocMaxEx[id] = tag; }
    }
    // ocorrência fora da faixa de idade do catálogo / repetição de não-repetível
    const porId = new Map(CATALOGO.map(c => [c.id, c]));
    for (const o of v.ocorrencias) { const c = porId.get(o.id); if (c && (o.idade < c.idade[0] || o.idade > c.idade[1])) viol('ocorrencia_fora_da_idade', `${tag} ${o.id} aos ${o.idade} (faixa ${c.idade.join('-')})`); }
    for (const [id, n] of Object.entries(ocAqui)) { const c = porId.get(id); if (c && c.repetir === undefined && n > 1) viol('nao_repetivel_repetiu', `${tag} ${id} ×${n}`); }
    process.stderr.write(`${tag} ${idade(v)}a ${v.morte ? 'morreu' : 'vivo'} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
    if (OUT) relatorio();
  }
}

function relatorio() {
linhas = [];
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
log(`# Auditoria 12.5 · sistemas — ${vidas} vidas, ${anos} anos, ${((Date.now() - t0) / Math.max(1, anos)).toFixed(1)} ms/ano, crashes ${crashes}`);
for (const c of crashEx) log('  CRASH ' + c);
log('\n## Violações (contagem e exemplos)');
for (const [k, n] of Object.entries(cont).sort((a, b) => b[1] - a[1])) { log(`- ${k}: ${n}`); for (const x of ex[k] ?? []) log(`    · ${x}`); }
log('\n## Contadores informativos'); log(JSON.stringify(info));
for (const k of ['emprego_novo_sem_bio', 'cargo_novo_sem_bio', 'historico_sobreposto_ex', 'bio_infantil_suspeita']) if (ex[k]) { log(`### ${k}`); for (const x of ex[k]) log('    · ' + x); }
log(`\nCompras: ${JSON.stringify(compras)}`);
log(`Extrato "Outros movimentos do ano" (|R$|): p50 ${Math.round(pct(pendente, 0.5))} p90 ${Math.round(pct(pendente, 0.9))} max ${Math.round(pct(pendente, 1))}; fração do movimentado p50 ${pct(pendenteRel, 0.5).toFixed(3)} p90 ${pct(pendenteRel, 0.9).toFixed(3)}`);

// eventos do catálogo nunca vistos (com faixa de idade coberta)
const cobre = (c: { idade: [number, number] }) => [...idadesCobertas].some(x => x >= c.idade[0] && x <= c.idade[1]);
const sorteaveis = CATALOGO.filter(c => !c.manual && cobre(c));
const nunca = sorteaveis.filter(c => !ocVidas[c.id]);
log(`\n## Eventos: catálogo ${CATALOGO.length} (sorteáveis ${sorteaveis.length}, manuais ${CATALOGO.filter(c => c.manual).length}); vistos ${Object.keys(ocVidas).length}; sorteáveis NUNCA vistos em ${vidas} vidas: ${nunca.length}`);
log(nunca.map(c => `${c.id}[${c.idade.join('-')}]`).join(' '));
log('\n## Repetição: maior número de vezes numa mesma vida (top 25)');
for (const [id, n] of Object.entries(ocMaxVida).sort((a, b) => b[1] - a[1]).slice(0, 25)) log(`- ${id}: ×${n} (${ocMaxEx[id]}); média por vida que viu ${(ocTotal[id] / ocVidas[id]).toFixed(1)}; repetir=${CATALOGO.find(c => c.id === id)?.repetir ?? '—'}`);
log('\n## Opções de decisão que não mudaram nada (n≥3, ≥80% sem efeito)');
for (const [k, n] of Object.entries(opcaoTot).filter(([k, n]) => n >= 3 && (opcaoNula[k] ?? 0) / n >= 0.8).sort((a, b) => b[1] - a[1]).slice(0, 40)) log(`- ${k}: ${opcaoNula[k]}/${n}`);
log('\n## Rótulos de extrato (tipo|rótulo: anos) top 60');
log(Object.entries(rotPend).sort((a, b) => b[1] - a[1]).slice(0, 60).map(([k, n]) => `${k}:${n}`).join(' ; '));

if (OUT) writeFileSync(OUT, linhas.join('\n')); else console.log(linhas.join('\n'));
}
relatorio();
