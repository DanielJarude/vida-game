/**
 * VIDA 14 · JUSTIÇA E PROBLEMAS LEGAIS (fora do crime — o processo penal é `sistemas/justica`).
 *
 * A vida gera CAUSAS, sempre com contexto: a demissão com direitos não pagos (trabalhista), o cliente que não pagou e o
 * fornecedor que cobra (contrato, para quem tem empresa), o ex-funcionário que processa a empresa, o banco que cobrou o
 * que não devia (consumidor, no juizado), o acidente de carro (indenização), a declaração pública que alguém levou ao
 * juiz (quem tem nome), a ação de improbidade (o político de contas rejeitadas), a multa de trânsito ou do fisco.
 *
 *   quem tem razão a pessoa decide se processa (a causa espera dois anos e prescreve); quem é processado se defende.
 *   advogado     sem (só no juizado), a Defensoria (renda baixa), um particular, um escritório de nome — ou você mesmo,
 *                se é advogado. Muda a chance e custa (honorários na hora e, no particular, uma parte do que ganhar).
 *   acordo       propor (o outro lado aceita ou não) ou aceitar o que oferecem: acaba na hora, sem risco.
 *   sentença     no prazo do tipo; quem perde paga o valor (ou parte), as custas e os honorários do outro lado.
 *   recurso      depois de perder: mais um ano e meio, mais custo, às vezes vira.
 *
 * Consequências: o dinheiro (da conta ou do caixa da empresa), a cabeça (processo aberto pesa), a reputação da empresa,
 * e na política a improbidade perdida torna inelegível por oito anos. Nada disso é do Submundo.
 */
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { economiaLocal } from '../../dados/lugares';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { pagar, vereditoDePagar } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import { empresasAtivas } from '../../sistemas/empresas';
import { desgastar } from '../../sistemas/desgastePolitico';
import { marcar } from '../../sistemas/marcas';

export type TipoCaso14 = 'trabalhista' | 'contrato' | 'consumidor' | 'indenizacao' | 'difamacao' | 'improbidade' | 'multa';
export type Advogado14 = 'nenhum' | 'defensoria' | 'proprio' | 'particular' | 'escritorio';

export interface Caso14 {
  id: string;
  tipo: TipoCaso14;
  polo: 'autor' | 'reu';
  /** Quem está do outro lado (para a frase). */
  contra: string;
  /** O que está em jogo. */
  valor: number;
  /** A empresa que responde (ou cobra), quando é dela. */
  empresaId?: string;
  t: number;
  /** Causa ainda não levada à Justiça (só quando a pessoa é a parte com razão): prescreve. */
  pendente?: boolean;
  /** Quando sai a sentença (ou a do recurso). */
  tDecisao?: number;
  /** A razão de fato (0..1, a chance de ganhar sem advogado nenhum) — o advogado contratado diz uma palavra sobre ela. */
  razao: number;
  advogado?: Advogado14;
  acordoOferecido?: number;
  recurso?: boolean;
  /** A primeira sentença foi contra (o recurso está aberto por um ano). */
  perdeu?: number;
}

export interface CasoFechado14 { t: number; tipo: TipoCaso14; polo: 'autor' | 'reu'; contra: string; texto: string; saldo: number }
export interface Justica14 { casos: Caso14[]; fechados?: CasoFechado14[]; n?: number }

export const NOME_CASO14: Record<TipoCaso14, string> = {
  trabalhista: 'Ação trabalhista', contrato: 'Disputa de contrato', consumidor: 'Causa de consumidor', indenizacao: 'Pedido de indenização',
  difamacao: 'Ação por danos morais', improbidade: 'Ação de improbidade', multa: 'Multa'
};
/** Meses até a sentença, por tipo (o juizado é rápido; a ação cível, não). */
const DURACAO: Record<TipoCaso14, number> = { trabalhista: 14, contrato: 24, consumidor: 8, indenizacao: 20, difamacao: 18, improbidade: 30, multa: 6 };
const BONUS: Record<Advogado14, number> = { nenhum: -0.12, defensoria: 0, proprio: 0.06, particular: 0.08, escritorio: 0.15 };

const estado = (v: Vida): Justica14 => (v.justica14 ??= { casos: [] });
export const casos14 = (v: Vida) => v.justica14?.casos ?? [];
const custoLocal = (v: Vida) => Math.max(0.5, economiaLocal(v.moradia.municipioId).custo);
const r100 = (x: number) => Math.round(x / 100) * 100;

/** Advogado de profissão (com a OAB): defende a si mesmo. */
const advogadoDeProfissao = (v: Vida) => { const oc = v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId) : undefined; return oc?.trilha === 'direito' && (oc.nivel ?? 0) >= 3; };
const rendaBaixa = (v: Vida) => (v.trabalho.atual?.salario ?? 0) < 3000 * custoLocal(v) && v.financas.conta < 20000 * custoLocal(v);

/** Honorários iniciais do advogado (o particular também leva 20% do que ganhar). */
export function honorarios14(v: Vida, c: Caso14, a: Advogado14): number {
  if (a === 'nenhum' || a === 'defensoria' || a === 'proprio') return 0;
  const base = a === 'escritorio' ? 18000 : 3500;
  return r100((base + c.valor * (a === 'escritorio' ? 0.05 : 0.02)) * custoLocal(v));
}

function novoCaso(v: Vida, x: Omit<Caso14, 'id' | 't'>): Caso14 {
  const j = estado(v);
  j.n = (j.n ?? 0) + 1;
  const c: Caso14 = { ...x, id: `j14-${j.n}`, t: v.t };
  if (!c.pendente && c.tipo !== 'multa') c.tDecisao = v.t + DURACAO[c.tipo];
  if (c.tipo === 'multa') c.tDecisao = v.t + DURACAO.multa;
  j.casos.push(c);
  return c;
}

/* ================================================================ O ano: as causas que a vida gera, as sentenças */

export function processarJustica14(v: Vida): void {
  if (v.morte || idade(v) < 18) return;
  const r = rngDe(v.id, 'j14', v.t);
  const j = v.justica14;
  // As sentenças do ano e o que prescreveu.
  for (const c of [...(j?.casos ?? [])]) {
    if (c.pendente && v.t - c.t > 24) { fechar(v, c, `A causa contra ${c.contra} prescreveu sem ir à Justiça.`, 0, false); continue; }
    if (c.perdeu !== undefined && !c.recurso && v.t - c.perdeu >= 12) { fechar(v, c, '', 0, true); continue; }
    if (!c.pendente && c.tDecisao !== undefined && v.t >= c.tDecisao && c.perdeu === undefined) sentenca(v, r, c);
  }
  // A cabeça: processo aberto pesa.
  const abertos = casos14(v).filter(c => !c.pendente && c.tipo !== 'multa').length;
  if (abertos) v.mente.estresse = clamp(v.mente.estresse + 2 * abertos);
  if (v.justica?.prisao) return;
  const ja = (tipo: TipoCaso14) => casos14(v).some(c => c.tipo === tipo);
  const custo = custoLocal(v);
  // Demitido no ano, com carteira: às vezes ficou direito para trás.
  const dem = v.caminhos.marcas.slice().reverse().find(m => m.tipo === 'demissao' && v.t - m.t <= 12);
  if (dem && !ja('trabalhista') && r.chance(0.4)) {
    const sal = v.trabalho.historico?.slice(-1)[0]?.salario ?? 3000 * custo;
    novoCaso(v, { tipo: 'trabalhista', polo: 'autor', contra: v.trabalho.historico?.slice(-1)[0]?.empregador ?? 'a empresa de antes', valor: r100(sal * r.int(3, 9)), pendente: true, razao: 0.55 + r.next() * 0.25 });
    escrever(v, { texto: 'Fazendo as contas da rescisão, ficou claro que faltavam horas extras e verbas. Dá para entrar na Justiça do Trabalho — ou deixar para lá.', relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // A empresa: o ex-funcionário, o cliente que não pagou, o fornecedor que cobra.
  for (const emp of empresasAtivas(v).filter(x => x.papel !== 'investidor')) {
    if (emp.equipe >= 3 && !ja('trabalhista') && r.chance(0.05 + Math.min(0.1, emp.equipe / 400))) {
      novoCaso(v, { tipo: 'trabalhista', polo: 'reu', contra: 'um ex-funcionário', valor: r100(r.int(15000, 90000) * custo), empresaId: emp.id, razao: 0.35 + r.next() * 0.4 });
      escrever(v, { texto: `Um ex-funcionário entrou com uma ação trabalhista contra ${emp.nome}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    }
    if (!ja('contrato') && r.chance(0.05)) {
      const autor = r.chance(0.5);
      const rec = emp.ultimo?.receita ?? 200000;
      novoCaso(v, { tipo: 'contrato', polo: autor ? 'autor' : 'reu', contra: autor ? 'um cliente que não pagou' : 'um fornecedor', valor: r100(Math.max(8000, rec * (0.01 + r.next() * 0.03))), empresaId: emp.id, pendente: autor || undefined, razao: 0.4 + r.next() * 0.35 });
      escrever(v, { texto: autor ? `Um cliente grande de ${emp.nome} sumiu sem pagar a última entrega. Cobrar na Justiça é uma opção.` : `Um fornecedor processou ${emp.nome}: diz que o contrato foi rompido antes da hora.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    }
  }
  // O consumidor (juizado: sem advogado, rápido).
  if (!ja('consumidor') && r.chance(0.04)) {
    novoCaso(v, { tipo: 'consumidor', polo: 'autor', contra: r.pick(['o banco', 'a operadora de celular', 'a loja que vendeu o aparelho com defeito', 'a companhia aérea']), valor: r100(r.int(1500, 9000) * custo), pendente: true, razao: 0.6 + r.next() * 0.25 });
    escrever(v, { texto: 'Uma cobrança que não devia estar ali — e o atendimento não resolve. O juizado de pequenas causas resolve isso sem advogado.', relevancia: 'cotidiano', tema: 'dinheiro' });
  }
  // O carro: o acidente com prejuízo de outro; a multa.
  const carro = v.financas.bens.some(b => b.tipo === 'veiculo');
  if (carro && !ja('indenizacao') && r.chance(0.025)) {
    novoCaso(v, { tipo: 'indenizacao', polo: 'reu', contra: 'o motorista do outro carro', valor: r100(r.int(8000, 60000) * custo), razao: 0.3 + r.next() * 0.45 });
    escrever(v, { texto: 'Uma batida num cruzamento — ninguém se feriu, mas o outro motorista entrou na Justiça pedindo o conserto e os dias parados.', relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
  }
  if (carro && !ja('multa') && r.chance(0.1)) {
    novoCaso(v, { tipo: 'multa', polo: 'reu', contra: 'o órgão de trânsito', valor: r100(r.int(2, 30) * 100 * custo), razao: 0.25 + r.next() * 0.2 });
  }
  // O nome público: a declaração que foi parar no juiz.
  if ((v.notoriedade?.valor ?? 0) >= 30 && !ja('difamacao') && r.chance(0.035)) {
    novoCaso(v, { tipo: 'difamacao', polo: 'reu', contra: 'alguém que se sentiu atingido por uma declaração sua', valor: r100(r.int(20000, 200000) * custo), razao: 0.4 + r.next() * 0.4 });
    escrever(v, { texto: 'Uma frase sua numa entrevista foi parar no juiz: pedem indenização por danos morais.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
  // A política: as contas rejeitadas viram ação de improbidade.
  const p = v.caminhos.politica;
  const rej = v.fatos['pol14_contas_rejeitadas'];
  if (p && rej !== undefined && v.t - rej <= 24 && !ja('improbidade') && r.chance(0.5)) {
    novoCaso(v, { tipo: 'improbidade', polo: 'reu', contra: 'o Ministério Público', valor: r100(r.int(50000, 400000) * custo), razao: 0.35 + r.next() * 0.35 });
    escrever(v, { texto: 'O Ministério Público entrou com uma ação de improbidade pelas contas rejeitadas. Se perder: multa e oito anos sem poder disputar eleição.', relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  }
}

/** Paga (da empresa, quando o caso é dela; senão, da conta). */
function pagarCaso(v: Vida, c: Caso14, valor: number, rotulo: string): void {
  if (valor <= 0) return;
  const emp = c.empresaId ? empresasAtivas(v).find(x => x.id === c.empresaId) : undefined;
  if (emp) { emp.caixa -= valor; return; }
  pagar(v, valor);
  lancar(v, rotulo, 'despesa', -valor);
}
function receber(v: Vida, c: Caso14, valor: number, rotulo: string): void {
  if (valor <= 0) return;
  const emp = c.empresaId ? empresasAtivas(v).find(x => x.id === c.empresaId) : undefined;
  if (emp) { emp.caixa += valor; return; }
  v.financas.conta += valor;
  lancar(v, rotulo, 'acontecimento', valor);
}

const chance = (c: Caso14) => clamp(c.razao + BONUS[c.advogado ?? 'nenhum'] + (c.tipo === 'consumidor' && (c.advogado ?? 'nenhum') === 'nenhum' ? 0.12 : 0), 0.05, 0.95);

function sentenca(v: Vida, r: Rng, c: Caso14): void {
  const ganhou = r.chance(chance(c));
  if (c.recurso) c.recurso = false;
  if (ganhou) {
    if (c.polo === 'autor') {
      const bruto = r100(c.valor * (0.6 + r.next() * 0.4));
      const exito = c.advogado === 'particular' || c.advogado === 'escritorio' ? r100(bruto * 0.2) : 0;
      receber(v, c, bruto - exito, `${NOME_CASO14[c.tipo]}: ganha`);
      fechar(v, c, `${NOME_CASO14[c.tipo]} contra ${c.contra}: ganhou. ${fmt(bruto)} de condenação${exito ? `, ${fmt(exito)} de honorários de êxito` : ''}.`, bruto - exito, false);
    } else {
      fechar(v, c, `${NOME_CASO14[c.tipo]} movida por ${c.contra}: o pedido foi negado. ${c.tipo === 'multa' ? 'A multa foi anulada.' : 'Não deve nada.'}`, 0, false);
    }
    return;
  }
  // Perdeu: o valor (ou parte), as custas, a sucumbência — o recurso fica aberto por um ano (se ainda não recorreu).
  c.perdeu = v.t;
  c.tDecisao = undefined;
  if (c.tipo === 'multa') { fechar(v, c, '', 0, true); return; }
  escrever(v, { texto: `${NOME_CASO14[c.tipo]}${c.polo === 'autor' ? ` contra ${c.contra}` : ` movida por ${c.contra}`}: a sentença saiu contra você. Dá para recorrer (um ano e meio, mais custo) — ou aceitar.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
}

/** Encerra (ao aceitar a derrota, as contas da derrota). */
function fechar(v: Vida, c: Caso14, texto: string, saldo: number, derrota: boolean): void {
  const j = estado(v);
  j.casos = j.casos.filter(x => x.id !== c.id);
  if (derrota) {
    const custas = r100(c.valor * 0.03 + 300);
    if (c.polo === 'reu') {
      const paga = c.tipo === 'multa' ? c.valor : r100(c.valor * 0.75);
      pagarCaso(v, c, paga + custas, `${NOME_CASO14[c.tipo]}: condenação e custas`);
      saldo = -(paga + custas);
      texto = c.tipo === 'multa' ? `A multa (${fmt(c.valor)}) ficou de pé: paga, com os acréscimos.` : `${NOME_CASO14[c.tipo]} movida por ${c.contra}: perdeu. ${fmt(paga)} de condenação e ${fmt(custas)} de custas e honorários do outro lado.`;
      consequencias(v, c);
    } else {
      const suc = r100(c.valor * 0.1);
      pagarCaso(v, c, suc + custas, `${NOME_CASO14[c.tipo]}: custas e sucumbência`);
      saldo = -(suc + custas);
      texto = `${NOME_CASO14[c.tipo]} contra ${c.contra}: perdeu. Ficaram as custas e os honorários do outro lado (${fmt(suc + custas)}).`;
    }
  }
  if (texto) {
    (j.fechados ??= []).push({ t: v.t, tipo: c.tipo, polo: c.polo, contra: c.contra, texto, saldo });
    if (j.fechados.length > 30) j.fechados.splice(0, j.fechados.length - 30);
    if (c.tipo !== 'multa' || derrota) escrever(v, { texto, relevancia: c.tipo === 'multa' || c.tipo === 'consumidor' ? 'cotidiano' : 'biografia', tema: c.tipo === 'consumidor' || c.tipo === 'multa' ? 'dinheiro' : 'trabalho', tom: saldo > 0 ? 'bom' : saldo < 0 ? 'ruim' : undefined });
  }
}

function consequencias(v: Vida, c: Caso14): void {
  const emp = c.empresaId ? empresasAtivas(v).find(x => x.id === c.empresaId) : undefined;
  if (emp && (c.tipo === 'trabalhista' || c.tipo === 'contrato')) emp.reputacao = clamp(emp.reputacao - 3);
  const p = v.caminhos.politica;
  if (c.tipo === 'improbidade' && p) {
    p.inelegivelAte = Math.max(p.inelegivelAte ?? 0, v.t + 96);
    desgastar(p, 10, 'escandalo');
    if (p.mandato) p.mandato.aprovacao = clamp(p.mandato.aprovacao - 8);
    marcar(v, 'politica', 'Condenado(a) por improbidade: oito anos inelegível.', 3);
  }
  if (c.tipo === 'difamacao' && v.notoriedade) v.fatos['vis_polemica'] = v.t;
}

/* ================================================================ As decisões */

export type OqueJustica14 =
  | { op: 'processar'; id: string; advogado: Advogado14 }
  | { op: 'advogado'; id: string; advogado: Advogado14 }
  | { op: 'acordo'; id: string }
  | { op: 'aceitar'; id: string }
  | { op: 'recorrer'; id: string }
  | { op: 'desistir'; id: string };

const caso = (v: Vida, id: string) => casos14(v).find(c => c.id === id);

function dispAdvogado(v: Vida, c: Caso14, a: Advogado14): Veredito {
  if (a === 'defensoria' && !rendaBaixa(v)) return bloqueio('requisito', 'A Defensoria é para quem não pode pagar advogado.');
  if (a === 'defensoria' && c.empresaId) return bloqueio('impossivel', 'A Defensoria não defende empresa.');
  if (a === 'proprio' && !advogadoDeProfissao(v)) return bloqueio('requisito', 'Só quem é advogado pode se defender sozinho.');
  if (a === 'nenhum' && c.tipo !== 'consumidor' && c.tipo !== 'multa') return bloqueio('requisito', 'Fora do juizado, a Justiça pede advogado.');
  const h = honorarios14(v, c, a);
  return h > 0 && !c.empresaId ? vereditoDePagar(v, h, 'Os honorários custam') : PERMITIDO;
}

export function disponibilidadeJustica14(v: Vida, a: OqueJustica14): Veredito {
  const c = caso(v, a.id);
  if (!c) return bloqueio('impossivel', 'Esse caso não existe mais.');
  switch (a.op) {
    case 'processar': return c.pendente ? dispAdvogado(v, c, a.advogado) : bloqueio('impossivel', 'Já está na Justiça.');
    case 'advogado': return c.pendente || c.perdeu !== undefined ? bloqueio('impossivel', 'Não se aplica agora.') : c.advogado && c.advogado !== 'nenhum' ? bloqueio('incompativel', 'O caso já tem advogado.') : dispAdvogado(v, c, a.advogado);
    case 'acordo': return c.pendente || c.perdeu !== undefined || c.tipo === 'multa' ? bloqueio('impossivel', 'Não se aplica agora.') : v.anoAtual.acoes.includes(`j14_acordo:${c.id}`) ? bloqueio('incompativel', 'Já houve proposta neste ano.') : { grau: 'improvavel', motivo: 'O outro lado pode não aceitar.' };
    case 'aceitar': return c.acordoOferecido !== undefined ? (c.polo === 'reu' && !c.empresaId ? vereditoDePagar(v, c.acordoOferecido, 'O acordo custa') : PERMITIDO) : bloqueio('impossivel', 'Não há acordo na mesa.');
    case 'recorrer': return c.perdeu === undefined || c.recurso ? bloqueio('impossivel', 'Não há sentença para recorrer.') : c.tipo === 'multa' ? bloqueio('impossivel', 'A multa já foi julgada no recurso administrativo.') : PERMITIDO;
    case 'desistir': return c.polo === 'autor' || (c.tipo === 'multa' && c.perdeu === undefined) || c.perdeu !== undefined ? PERMITIDO : bloqueio('impossivel', 'Quem é processado não desiste: defende-se, faz acordo ou perde.');
  }
}

export function executarJustica14(v: Vida, r: Rng, a: OqueJustica14): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const c = caso(v, a.id)!;
  switch (a.op) {
    case 'processar': case 'advogado': {
      const h = honorarios14(v, c, a.advogado);
      if (h) pagarCaso(v, c, h, 'Honorários de advogado');
      c.advogado = a.advogado;
      if (c.pendente) { c.pendente = undefined; c.tDecisao = v.t + DURACAO[c.tipo]; }
      const leitura = a.advogado === 'nenhum' ? '' : ` ${a.advogado === 'proprio' ? 'Lendo o processo, você mesmo' : 'O advogado'} acha que ${chance(c) >= 0.65 ? 'a chance é boa' : chance(c) >= 0.45 ? 'dá para ganhar, mas não é certo' : 'vai ser difícil'}.`;
      const texto = a.op === 'processar' ? `Entrou na Justiça contra ${c.contra}${h ? ` (${fmt(h)} de honorários)` : ''}. A decisão deve sair por volta de ${anoDe(c.tDecisao!)}.${leitura}` : `Contratou a defesa${h ? ` (${fmt(h)})` : ''}.${leitura}`;
      escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto, tom: 'neutro' };
    }
    case 'acordo': {
      v.anoAtual.acoes.push(`j14_acordo:${c.id}`);
      const p = chance(c);
      // O valor justo: o esperado, com desconto por acabar logo; o outro lado aceita se não espera melhor.
      const valor = r100(c.valor * (c.polo === 'autor' ? p * 0.8 : (1 - p) * 0.9 + 0.1));
      if (r.chance(0.55 + (c.polo === 'autor' ? 0.1 - p * 0.2 : p * 0.2))) {
        c.acordoOferecido = valor;
        return { texto: `O outro lado topa encerrar por ${fmt(valor)}. É aceitar e acabou — ou seguir para a sentença.`, tom: 'neutro' };
      }
      return { texto: 'O outro lado recusou: acha que ganha na sentença.', tom: 'ruim' };
    }
    case 'aceitar': {
      const valor = c.acordoOferecido!;
      if (c.polo === 'autor') receber(v, c, valor, `${NOME_CASO14[c.tipo]}: acordo`); else pagarCaso(v, c, valor, `${NOME_CASO14[c.tipo]}: acordo`);
      const texto = `Acordo fechado com ${c.contra}: ${c.polo === 'autor' ? 'recebeu' : 'pagou'} ${fmt(valor)} e o processo acabou.`;
      fechar(v, c, texto, c.polo === 'autor' ? valor : -valor, false);
      return { texto, tom: 'neutro' };
    }
    case 'recorrer': {
      const custo = r100(c.valor * 0.02 + (c.advogado === 'escritorio' ? 8000 : c.advogado === 'particular' ? 2500 : 0) * custoLocal(v));
      pagarCaso(v, c, custo, 'Recurso: custas e honorários');
      c.recurso = true;
      c.perdeu = undefined;
      c.razao = clamp(c.razao - 0.15); // o recurso vira menos vezes do que a primeira sentença
      c.tDecisao = v.t + 18;
      const texto = `Recorreu (${fmt(custo)}). O tribunal deve julgar por volta de ${anoDe(c.tDecisao)}.`;
      escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto, tom: 'neutro' };
    }
    case 'desistir': {
      if (c.perdeu !== undefined || (c.polo === 'reu' && c.tipo === 'multa')) { fechar(v, c, '', 0, true); return { texto: 'Aceitou a decisão e pagou.', tom: 'neutro' }; }
      const texto = c.pendente ? `Deixou para lá a causa contra ${c.contra}.` : `Desistiu da ação contra ${c.contra}: ficaram as custas.`;
      if (!c.pendente) pagarCaso(v, c, r100(c.valor * 0.02 + 300), 'Custas da desistência');
      fechar(v, c, texto, 0, false);
      return { texto, tom: 'neutro' };
    }
  }
}

/* ================================================================ Leitura */

export function leituraJustica14(v: Vida) {
  const cs = casos14(v);
  const pode = (c: Caso14, a: Advogado14) => dispAdvogado(v, c, a).grau;
  return {
    casos: cs.map(c => ({
      id: c.id, titulo: NOME_CASO14[c.tipo], polo: c.polo, contra: c.contra, valor: c.valor, pendente: !!c.pendente, perdeu: c.perdeu !== undefined,
      recurso: !!c.recurso, acordo: c.acordoOferecido, advogado: c.advogado, decisao: c.tDecisao !== undefined ? anoDe(c.tDecisao) : undefined,
      empresa: c.empresaId ? empresasAtivas(v).find(x => x.id === c.empresaId)?.nome : undefined,
      opcoesAdvogado: (['nenhum', 'defensoria', 'proprio', 'particular', 'escritorio'] as Advogado14[]).filter(a => pode(c, a) !== 'impossivel' && pode(c, a) !== 'requisito').map(a => ({ a, custo: honorarios14(v, c, a) }))
    })),
    fechados: (v.justica14?.fechados ?? []).slice(-8).reverse()
  };
}

/** Saves: nada a migrar (tudo opcional). */
export function normalizarVida14Justica(v: Vida): void {
  const j = v.justica14;
  if (!j) return;
  if (!Array.isArray(j.casos)) { delete v.justica14; return; }
  j.casos = j.casos.filter(c => c && typeof c.id === 'string' && Number.isFinite(c.valor));
}
