/**
 * VIDA 32 · AS EQUIPES DE QUADRA DO DONO — fundar um time de basquete, vôlei ou futsal e levá-lo da liga regional à
 * liga nacional. Mais leve do que o clube de futebol (`v20/clubes`): o elenco é uma força só (0–100), o ginásio, o
 * técnico e o patrocínio pesam na temporada; a liga tem 12 times por divisão (sobem 2, caem 2).
 *
 * As divisões têm o nome de cada modalidade e país (`esporte.divisaoDe`: NBB, Superliga, Liga Nacional de Futsal…). A
 * temporada sai de um sorteio estável (`rngDe(v.id, 'equipe32', id, ano)`): a mesma vida e o mesmo ano, o mesmo resultado.
 */
import { clamp, rngDe } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { pagar } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import { existeMunicipio, municipio, paisDaCidade } from '../../dados/lugares';
import { divisaoDe } from '../../sistemas/esporte';
import { clubesDoPais } from '../../dados/clubes';
import { normalizarIdentidade33, type Identidade33 } from '../../v33/dono/identidade33';
import { contratoAntigo33, normalizarComercial33, novoComercial33, type Comercial33, type Contexto33 } from '../../v33/dono/patrocinio33';
import { normalizarLoja33, type Loja33 } from '../../v33/dono/loja33';
import { executarDono33, fecharAnoDono33, problemaDono33, type OpDono33 } from '../../v33/dono/dono33';

export type Modalidade32 = 'basquete' | 'volei' | 'futsal';
export const MODALIDADES32: { id: Modalidade32; nome: string }[] = [
  { id: 'basquete', nome: 'Basquete' }, { id: 'volei', nome: 'Vôlei' }, { id: 'futsal', nome: 'Futsal' }
];
export const nomeDaModalidade32 = (m: Modalidade32) => MODALIDADES32.find(x => x.id === m)?.nome ?? m;

export interface TemporadaDaEquipe32 { ano: number; nivel: 1 | 2 | 3; posicao: number; titulo?: boolean; acesso?: boolean; queda?: boolean; receita: number; despesa: number; forca: number }

export interface Equipe32 {
  id: string; nome: string; modalidade: Modalidade32; pais: string; municipioId: string; cidade: string; desde: number;
  /** 1 regional · 2 acesso nacional · 3 liga nacional. */
  nivel: 1 | 2 | 3;
  /** A força do elenco (0–100): sobe com reforços, cai um pouco por ano (o elenco envelhece e sai). */
  elenco: number;
  caixa: number; divida: number; torcida: number; reputacao: number;
  /** O ginásio (1 alugado … 5 arena própria). */
  ginasio: number;
  /** A obra do ginásio em andamento (pronta no fim do ano). */
  obra?: number;
  tecnico?: { nome: string; nivel: number; salario: number };
  /** Até a VIDA 32 (o normalizador leva para `comercial33`). */
  patrocinio?: { nome: string; valor: number; ate: number };
  /** VIDA 33 · a identidade, os patrocínios por cota e a loja. */
  identidade33?: Identidade33;
  comercial33?: Comercial33;
  loja33?: Loja33;
  historico: TemporadaDaEquipe32[];
  valor: number;
}

/** O mercado do país (a mesma ordem de grandeza do clube de futebol, bem menor em dinheiro). */
const MERCADO: Record<string, number> = { US: 4, ES: 1.6, IT: 1.6, FR: 1.3, DE: 1.3, GB: 1.2, PT: 0.8, AR: 0.6 };
const mercado = (pais: string) => MERCADO[pais] ?? 1;
/** A força média de cada divisão e a receita base (bilheteria, TV, patrocínio de liga). */
const FORCA_DIV = [0, 45, 58, 70];
const RECEITA_DIV = [0, 0.6e6, 2.5e6, 9e6];

export const custoDeFundarEquipe32 = (pais: string) => Math.round(8e5 * mercado(pais) / 1e5) * 1e5;
export const custoDoReforco32 = (e: Equipe32, pesado: boolean) => Math.round((pesado ? 1.2 : 0.4) * RECEITA_DIV[e.nivel] * Math.pow(1.04, Math.max(0, e.elenco - 40)) * mercado(e.pais) / 1e5) * 1e5;
export const custoDoGinasio32 = (e: Equipe32) => Math.round(1.5e6 * Math.pow(1.9, e.ginasio - 1) * mercado(e.pais) / 1e5) * 1e5;
export const nomeDaDivisao32 = (e: Pick<Equipe32, 'modalidade' | 'pais'>, nivel: number) => divisaoDe(e.modalidade, nivel, e.pais).replace(/ — .*/, '');

const NOMES_TECNICO = ['Marcos Paiva', 'Renata Lobo', 'Júlio Andrade', 'Paula Siqueira', 'Edson Leite', 'Carla Montenegro', 'Fábio Rangel', 'Lia Duarte', 'Hélio Prates', 'Tânia Vieira', 'Sérgio Bastos', 'Aline Castro'];

/** Os técnicos disponíveis no ano (estáveis no ano: os mesmos três até virar o ano). */
export function tecnicosDaEquipe32(v: Vida, e: Equipe32) {
  const r = rngDe(v.id, 'equipe32-tec', e.id, anoDe(v.t));
  return [0, 1, 2].map(k => {
    const nivel = clamp(Math.round(1 + r.next() * 3 + e.nivel * 0.5 + k * 0.3), 1, 5);
    return { nome: NOMES_TECNICO[Math.floor(r.next() * NOMES_TECNICO.length)], nivel, salario: Math.round(RECEITA_DIV[e.nivel] * (0.04 + nivel * 0.035) * mercado(e.pais) / 1e4) * 1e4 };
  });
}
/** VIDA 33 · o contexto do dono (patrocínios, loja). */
export function contextoEquipe33(e: Equipe32, ano: number): Contexto33 {
  return { tipo: 'quadra', ano, receitaBase: RECEITA_DIV[e.nivel] * (0.5 + e.torcida / 80) * mercado(e.pais), fama: e.torcida, reputacao: e.reputacao, noTopo: e.nivel === 3, temCasa: e.ginasio >= 3 };
}

/** O que o investimento inicial compra: elenco (+8 de força a cada vez que dobra, até +45), o ginásio, e o caixa. */
export interface PreviaEquipe33 { custo: number; investimento: number; elenco: number; ginasio: number; caixa: number }
export function previaDaEquipe33(pais: string, investimento: number, foco: 'elenco' | 'equilibrado' | 'estrutura'): PreviaEquipe33 {
  const base = custoDeFundarEquipe32(pais);
  const inv = Math.max(0, Math.round(investimento));
  const [fe, fg] = foco === 'elenco' ? [0.8, 0] : foco === 'estrutura' ? [0.25, 0.6] : [0.5, 0.3];
  const elenco = Math.round(Math.min(85, 40 + Math.min(45, 8 * Math.log2(1 + inv * fe / base))) * 10) / 10;
  let obra = inv * fg, ginasio = 1;
  while (ginasio < 5) { const c = Math.round(1.5e6 * Math.pow(1.9, ginasio - 1) * mercado(pais) / 1e5) * 1e5; if (c > obra) break; obra -= c; ginasio++; }
  return { custo: base + inv, investimento: inv, elenco, ginasio, caixa: Math.round((base * 0.4 + inv * (1 - fe - fg) + obra) / 1e4) * 1e4 };
}

export type OqueEquipe32 =
  | { op: 'fundar'; modalidade: Modalidade32; nome: string; municipioId: string; investimento?: number; foco?: 'elenco' | 'equilibrado' | 'estrutura'; identidade?: Identidade33 }
  | { op: 'reforco'; id: string; pesado: boolean }
  | { op: 'ginasio'; id: string }
  | { op: 'tecnico'; id: string; i: number }
  | { op: 'dono'; id: string; sub: OpDono33 }
  | { op: 'aportar'; id: string; valor: number }
  | { op: 'vender'; id: string };

export function nomeLivre32(v: Vida, nome: string, pais: string): string | undefined {
  const n = nome.trim();
  if (n.length < 3) return 'Dê um nome ao time (pelo menos 3 letras).';
  if (n.length > 32) return 'O nome é comprido demais (até 32 letras).';
  const igual = (a: string) => a.toLowerCase() === n.toLowerCase();
  if ((v.equipes32 ?? []).some(e => igual(e.nome)) || v.clube20 && igual(v.clube20.nome) || clubesDoPais(pais).some(c => igual(c.nome))) return 'Já existe um time com esse nome.';
  return undefined;
}

export function disponibilidadeEquipe32(v: Vida, o: OqueEquipe32): Veredito {
  if (idade(v) < 18) return bloqueio('requisito', 'Só quem é maior de idade funda um time.');
  if (o.op === 'fundar') {
    if (!existeMunicipio(o.municipioId)) return bloqueio('impossivel', 'Cidade não encontrada.');
    if ((v.equipes32 ?? []).some(e => e.modalidade === o.modalidade)) return bloqueio('incompativel', `Você já tem um time de ${nomeDaModalidade32(o.modalidade).toLowerCase()}.`);
    const pais = paisDaCidade(o.municipioId);
    const erro = nomeLivre32(v, o.nome, pais);
    if (erro) return bloqueio('requisito', erro);
    const custo = custoDeFundarEquipe32(pais) + Math.max(0, Math.round(o.investimento ?? 0));
    return v.financas.conta >= custo ? PERMITIDO : bloqueio('requisito', `Fundar o time ${o.investimento ? 'com esse investimento ' : ''}custa ${fmt(custo)} (registro na federação, uniformes, quadra alugada e o primeiro elenco${o.investimento ? ', mais o investimento' : ''}).`);
  }
  const e = (v.equipes32 ?? []).find(x => x.id === o.id);
  if (!e) return bloqueio('impossivel', 'Esse time não é seu.');
  switch (o.op) {
    case 'reforco': { const c = custoDoReforco32(e, o.pesado); if (e.elenco >= 95) return bloqueio('incompativel', 'O elenco já é dos melhores do país.'); return e.caixa >= c ? PERMITIDO : bloqueio('requisito', `Os reforços custam ${fmt(c)}; o caixa do time tem ${fmt(e.caixa)}.`); }
    case 'ginasio': { if (e.ginasio >= 5) return bloqueio('incompativel', 'A arena já é de ponta.'); if (e.obra) return bloqueio('incompativel', 'A obra do ginásio já está em andamento.'); const c = custoDoGinasio32(e); return e.caixa >= c ? PERMITIDO : bloqueio('requisito', `A obra custa ${fmt(c)}; o caixa não tem.`); }
    case 'tecnico': { const t = tecnicosDaEquipe32(v, e)[o.i]; if (!t) return bloqueio('impossivel', ''); if (e.tecnico?.nome === t.nome) return bloqueio('incompativel', 'Ele já é o técnico.'); return e.caixa >= t.salario * 0.25 ? PERMITIDO : bloqueio('requisito', `As luvas (${fmt(Math.round(t.salario * 0.25))}) não cabem no caixa.`); }
    case 'dono': { const p = problemaDono33(contextoEquipe33(e, anoDe(v.t)), e, o.sub, e.caixa, anoDe(e.desde)); return p ? bloqueio('requisito', p) : PERMITIDO; }
    case 'aportar': return o.valor > 0 && v.financas.conta >= o.valor ? PERMITIDO : bloqueio('requisito', 'Não há esse dinheiro na conta.');
    case 'vender': return PERMITIDO;
  }
}

export function executarEquipe32(v: Vida, o: OqueEquipe32): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  if (o.op === 'fundar') {
    const pais = paisDaCidade(o.municipioId);
    const p = previaDaEquipe33(pais, o.investimento ?? 0, o.foco ?? 'equilibrado');
    const custo = p.custo;
    pagar(v, custo);
    lancar(v, `Fundação do time (${o.nome.trim()})`, 'despesa', -custo);
    const e: Equipe32 = {
      id: `eq32_${o.modalidade}_${v.t}`, nome: o.nome.trim(), modalidade: o.modalidade, pais, municipioId: o.municipioId, cidade: municipio(o.municipioId).nome, desde: v.t,
      nivel: 1, elenco: p.elenco, caixa: p.caixa, divida: 0, torcida: 5 + Math.min(8, Math.round(Math.log2(1 + p.investimento / 5e5))), reputacao: 10, ginasio: p.ginasio, historico: [],
      valor: Math.round((custoDeFundarEquipe32(pais) * 0.5 + p.investimento * 0.5) / 1e4) * 1e4, comercial33: novoComercial33()
    };
    const ident = normalizarIdentidade33(o.identidade);
    if (ident) e.identidade33 = ident;
    (v.equipes32 ??= []).push(e);
    escrever(v, { texto: `Fundou o ${e.nome}, time de ${nomeDaModalidade32(e.modalidade).toLowerCase()} de ${e.cidade}: começa no ${nomeDaDivisao32(e, 1)}, numa quadra alugada.`, relevancia: 'marco', tema: 'dinheiro', tom: 'bom', escolha: true });
    return { texto: `O ${e.nome} foi fundado.`, tom: 'bom' };
  }
  const lista = v.equipes32!;
  const e = lista.find(x => x.id === o.id)!;
  switch (o.op) {
    case 'reforco': {
      const c = custoDoReforco32(e, o.pesado);
      e.caixa -= c;
      const ganho = o.pesado ? 9 : 3.5;
      e.elenco = clamp(Math.round((e.elenco + ganho * (1 - e.elenco / 130)) * 10) / 10, 0, 98);
      return { texto: `${o.pesado ? 'Contratações de peso' : 'Um reforço pontual'} por ${fmt(c)}: o elenco do ${e.nome} agora tem força ${Math.round(e.elenco)}.`, tom: 'bom' };
    }
    case 'ginasio': { const c = custoDoGinasio32(e); e.caixa -= c; e.obra = e.ginasio + 1; return { texto: `A obra do ginásio começou (${fmt(c)}): fica pronta no fim do ano.`, tom: 'neutro' }; }
    case 'tecnico': { const t = tecnicosDaEquipe32(v, e)[o.i]; e.caixa -= Math.round(t.salario * 0.25); e.tecnico = t; return { texto: `${t.nome} é o técnico do ${e.nome}.`, tom: 'bom' }; }
    case 'dono': {
      const ano = anoDe(v.t);
      const x = executarDono33(contextoEquipe33(e, ano), e, o.sub, rngDe(v.id, 'equipe33_dono', e.id, ano, e.comercial33?.seq ?? 0, e.comercial33?.buscas.n ?? 0), anoDe(e.desde));
      e.caixa -= x.custo;
      if (x.fama) e.torcida = clamp(e.torcida + x.fama);
      return { texto: x.texto, tom: x.tom };
    }
    case 'aportar': { pagar(v, o.valor); lancar(v, `Aporte no time (${e.nome})`, 'despesa', -o.valor); e.caixa += o.valor; return { texto: `${fmt(o.valor)} entraram no caixa do ${e.nome}.`, tom: 'neutro' }; }
    case 'vender': {
      const valor = Math.max(0, Math.round((e.valor + e.caixa - e.divida) / 1e4) * 1e4);
      v.financas.conta += valor;
      lancar(v, `Venda do time (${e.nome})`, 'renda', valor);
      v.equipes32 = lista.filter(x => x !== e);
      escrever(v, { texto: `Vendeu o ${e.nome} por ${fmt(valor)}.`, relevancia: 'marco', tema: 'dinheiro', escolha: true });
      return { texto: `Time vendido por ${fmt(valor)}.`, tom: 'neutro' };
    }
  }
}

/** A temporada de cada time (uma vez por ano, na virada). */
export function processarEquipes32(v: Vida): void {
  if (!v.equipes32?.length || v.morte) return;
  const ano = anoDe(v.t) - 1;
  for (const e of v.equipes32) {
    if (anoDe(e.desde) > ano || e.historico.some(h => h.ano === ano)) continue;
    const r = rngDe(v.id, 'equipe32', e.id, ano);
    const forca = e.elenco + (e.ginasio - 1) * 1.2 + (e.tecnico?.nivel ?? 0) * 1.5;
    const diff = forca - FORCA_DIV[e.nivel];
    const posicao = clamp(Math.round(6.5 - diff / 2.6 + r.normal() * 2.2), 1, 12);
    const titulo = posicao === 1;
    const acesso = e.nivel < 3 && posicao <= 2;
    const queda = e.nivel > 1 && posicao >= 11;
    // VIDA 33: os patrocínios (as cotas) e a loja.
    const dono = fecharAnoDono33(contextoEquipe33(e, ano), contextoEquipe33(e, ano + 1), e, { titulo, subiu: acesso, caiu: queda, topo: posicao <= 4, internacional: false }, rngDe(v.id, 'equipe33_fechar', e.id, ano));
    for (const t of dono.textos) escrever(v, { texto: `${e.nome}: ${t}`, relevancia: 'cotidiano', tema: 'dinheiro' });
    if (dono.rep) e.reputacao = clamp(e.reputacao + dono.rep);
    const receita = Math.round((RECEITA_DIV[e.nivel] * (0.5 + e.torcida / 80) * (0.85 + e.ginasio * 0.08) * mercado(e.pais) * (1 + (12 - posicao) * 0.02) + dono.receita) / 1e4) * 1e4;
    const folha = RECEITA_DIV[e.nivel] * mercado(e.pais) * (0.25 + Math.max(0, e.elenco - FORCA_DIV[e.nivel] + 10) * 0.025);
    const despesa = Math.round((folha + dono.despesa + (e.tecnico?.salario ?? 0) + receita * 0.25 + e.divida * 0.11) / 1e4) * 1e4;
    e.caixa += receita - despesa;
    if (e.caixa < 0) { e.divida += -e.caixa; e.caixa = 0; }
    else if (e.divida > 0) { const a = Math.min(e.divida, Math.round(e.caixa * 0.5)); e.divida -= a; e.caixa -= a; }
    const nivel = e.nivel;
    e.historico.push({ ano, nivel, posicao, receita, despesa, forca: Math.round(forca), ...(titulo ? { titulo } : {}), ...(acesso ? { acesso } : {}), ...(queda ? { queda } : {}) });
    if (e.historico.length > 40) e.historico.splice(0, e.historico.length - 40);
    if (acesso) e.nivel = (e.nivel + 1) as 1 | 2 | 3;
    if (queda) e.nivel = (e.nivel - 1) as 1 | 2 | 3;
    e.torcida = clamp(Math.round(e.torcida * 0.85 + (10 + nivel * 15 + (titulo ? 8 : 0)) * 0.15 + (acesso ? 4 : 0) - (queda ? 4 : 0)));
    e.reputacao = clamp(Math.round(e.reputacao + (titulo ? 8 : 0) + (acesso ? 5 : 0) - (queda ? 6 : 0) + (6.5 - posicao) * 0.5));
    // O elenco envelhece e perde gente; o ginásio novo fica pronto; o técnico às vezes sai.
    e.elenco = clamp(Math.round((e.elenco - 1.5 - r.next() * 1.5) * 10) / 10, 20, 98);
    if (e.obra) { e.ginasio = e.obra; e.obra = undefined; }
    e.valor = Math.round(Math.max(RECEITA_DIV[e.nivel] * mercado(e.pais) * 1.4, receita * 1.4) / 1e4) * 1e4;
    const div = nomeDaDivisao32(e, nivel);
    const frase = titulo ? `Campeão! O ${e.nome}, o seu time de ${nomeDaModalidade32(e.modalidade).toLowerCase()}, venceu o ${div} de ${ano}.`
      : acesso ? `O ${e.nome} terminou em ${posicao}º no ${div} de ${ano} e subiu de divisão.`
      : queda ? `O ${e.nome} terminou em ${posicao}º no ${div} de ${ano} e caiu.`
      : `O ${e.nome} terminou em ${posicao}º no ${div} de ${ano}.`;
    escrever(v, { texto: frase, relevancia: titulo || acesso || queda ? 'marco' : 'cotidiano', tema: 'trabalho', tom: titulo || acesso ? 'bom' : queda ? 'ruim' : undefined });
  }
}

/** O que os times valem no patrimônio (o valor mais o caixa, menos a dívida). */
export const valorDasEquipes32 = (v: Vida) => (v.equipes32 ?? []).reduce((s, e) => s + Math.max(0, e.valor + e.caixa - e.divida), 0);

/** Saves: o patrocínio único da VIDA 32 vira a cota master; identidade e loja validadas. */
export function normalizarEquipes33(v: Vida): void {
  if (!Array.isArray(v.equipes32)) return;
  const ano = anoDe(v.t);
  for (const e of v.equipes32) {
    e.comercial33 = normalizarComercial33(e.comercial33) ?? novoComercial33();
    const antigo = contratoAntigo33(e.patrocinio, ano);
    if (antigo) e.comercial33.contratos.push(antigo);
    delete e.patrocinio;
    const id = normalizarIdentidade33(e.identidade33); if (id) e.identidade33 = id; else delete e.identidade33;
    const loja = normalizarLoja33(e.loja33, ano); if (loja) e.loja33 = loja; else delete e.loja33;
  }
}
