/**
 * VIDA 18 · O QUE SE FAZ NO CAMPO — comprar, arrendar, plantar, criar, construir, mecanizar, mudar o manejo, expandir e
 * reduzir, morar, passar temporadas, ir às festas. Cada operação tem o veredito (`disponibilidadeRural18`) e a execução
 * (`executarRural18`); o dinheiro sai da conta UMA vez, pelo preço que a tela mostrou.
 */
import type { Imovel, Vida } from '../../tipos';
import { clamp, rngDe, type Rng } from '../../rng';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { escrever, idade, parceiro } from '../../nucleo';
import { anoDe } from '../../tempo';
import { lancar } from '../../sistemas/extrato';
import { vereditoDePagar } from '../../sistemas/dinheiro';
import { dinheiro as fmt } from '../../texto';
import { abalar } from '../../sistemas/abalo';
import { iniciarRural } from '../../sistemas/rural';
import { contratar } from '../../sistemas/trabalho';
import { ocupacao } from '../../dados/ocupacoes';
import { marcar } from '../../sistemas/marcas';
import {
  CULTURAS18, ESTRUTURAS18, FESTAS18, MAQUINAS18, REBANHOS18, TIPOS18,
  type CulturaId, type EspecieRural, type EstruturaId, type MaquinaId, type TipoRural
} from '../../dados18/rural/catalogo18';
import {
  acharPropriedade, areaLivre, areaUtil, custoDaEstrutura, custoLocal, fmtHa, maxDaEstrutura, novaPropriedade, povoar, qtdEstrutura,
  regiaoRural, sincronizarValor, tetoDaEstrutura, todasAsPropriedades, valorDaPropriedade, valorDasMaquinas, valorDoRebanho, haIrrigaveis,
  type Alimentacao18, type Estrategia18, type PropriedadeRural18, type UsoRural18
} from './fazenda18';

/* ================================================================== As ofertas da região */

export interface OfertaRural18 { id: string; p: PropriedadeRural18; preco: number; arrendamentoAno: number; porteiraFechada: boolean }

/** O que está à venda (e para arrendar) na zona rural do município neste ano: um de cada tipo, estável no ano. */
export function ofertasRurais(v: Vida): OfertaRural18[] {
  const ano = anoDe(v.t);
  const mun = v.moradia.municipioId;
  const r = rngDe(v.id, 'ofertas18', mun, ano);
  const tipos = Object.keys(TIPOS18) as TipoRural[];
  const seq0 = v.seq;
  const out = tipos.map((tipo, k) => {
    const T = TIPOS18[tipo];
    const ha = T.tamanhos[Math.min(T.tamanhos.length - 1, Math.floor(r.next() * T.tamanhos.length * 0.9))];
    const falsa = { ...v, seq: 0 } as Vida;
    const p = novaPropriedade(falsa, r, tipo, ha, mun, 'compra');
    p.id = `of:${ano}:${k}`;
    const porteira = r.chance(0.45);
    if (porteira) povoar(p, r, ano, tipo === 'agricola' || tipo === 'cafeeira' || tipo === 'pecuaria' ? 0.85 : 0.65);
    const preco = valorDaPropriedade(p, ano);
    const arr = Math.round(p.valorHa * p.ha * (tipo === 'pecuaria' || tipo === 'florestal' ? 0.03 : 0.04) / 100) * 100;
    return { id: p.id, p, preco, arrendamentoAno: arr, porteiraFechada: porteira };
  });
  v.seq = seq0;
  return out.filter(o => !v.fatos[`rural18_negocio_${o.id}`]);
}

/** O crédito rural (Pronaf/Pronamp: juro abaixo do banco para quem produz) ou o financiamento comum. */
export function condicaoDeCredito(v: Vida): { rural: boolean; jurosMes: number; prazo: number; nome: string } {
  const produz = v.trabalho.atual?.ocupacaoId === 'produtor_rural' || todasAsPropriedades(v).some(x => x.p.uso === 'producao');
  return produz ? { rural: true, jurosMes: 0.0055, prazo: 144, nome: 'crédito rural' } : { rural: false, jurosMes: 0.0095, prazo: 120, nome: 'financiamento bancário' };
}

/* ================================================================== As operações */

export type OqueRural18 =
  | { op: 'comprar'; oferta: string; financiar?: boolean }
  | { op: 'arrendar'; oferta: string }
  | { op: 'devolver'; id: string }
  | { op: 'arrendar_para'; id: string }
  | { op: 'retomar'; id: string }
  | { op: 'uso'; id: string; uso: Exclude<UsoRural18, 'arrendada'> }
  | { op: 'plantar'; id: string; cultura: CulturaId; ha: number; irrigado?: boolean }
  | { op: 'arrancar'; id: string; talhao: string }
  | { op: 'safrinha'; id: string; talhao: string }
  | { op: 'animais'; id: string; especie: EspecieRural; lotes: number }
  | { op: 'vender_animais'; id: string; especie: EspecieRural; fracao: number }
  | { op: 'manejo'; id: string; especie: EspecieRural; alimentacao?: Alimentacao18; estrategia?: Estrategia18; sanitario?: 'basico' | 'completo' }
  | { op: 'genetica'; id: string; especie: EspecieRural }
  | { op: 'construir'; id: string; estrutura: EstruturaId; ha?: number }
  | { op: 'maquina'; id: string; maquina: MaquinaId }
  | { op: 'vender_maquina'; id: string; maquina: MaquinaId }
  | { op: 'solo'; id: string }
  | { op: 'organico'; id: string }
  | { op: 'foco'; id: string; foco: PropriedadeRural18['foco'] }
  | { op: 'cooperativa'; id: string }
  | { op: 'seguro'; id: string }
  | { op: 'expandir'; id: string; ha: number }
  | { op: 'reduzir'; id: string; ha: number }
  | { op: 'tocar'; id: string }
  | { op: 'temporada'; id: string }
  | { op: 'festa'; festa: string };

const jaFez = (v: Vida, chave: string) => v.anoAtual.acoes.includes(chave);
const fazer = (v: Vida, chave: string) => { v.anoAtual.acoes.push(chave); };

export const precoDaEstrutura = custoDaEstrutura;
export const precoDaMaquina = (p: PropriedadeRural18, m: MaquinaId) => Math.round(MAQUINAS18[m].preco * custoLocal(p.municipioId) / 100) * 100;
export const precoDoLote = (p: PropriedadeRural18, e: EspecieRural) => {
  const d = REBANHOS18[e];
  // Peixe: o "lote" é a povoação de alevinos para 5 t/ano; o resto, as cabeças do lote.
  return Math.round((e === 'tilapia' || e === 'tambaqui' ? 6000 : d.valor * d.lote) * custoLocal(p.municipioId) / 100) * 100;
};
export const custoDaImplantacao = (p: PropriedadeRural18, c: CulturaId, ha: number) => Math.round((CULTURAS18[c].implantacaoHa ?? 0) * ha * custoLocal(p.municipioId) / 100) * 100;
export const custoDoSolo = (p: PropriedadeRural18) => Math.round(1100 * areaUtil(p) * custoLocal(p.municipioId) / 100) * 100;
export const custoDaGenetica = (p: PropriedadeRural18, e: EspecieRural) => {
  const rb = p.rebanhos.find(x => x.especie === e);
  const d = REBANHOS18[e];
  return Math.round(Math.max(1500, (rb?.cabecas ?? 0) * d.matrizes * d.valor * 0.06) * custoLocal(p.municipioId) / 100) * 100;
};
export const custoDaTemporada = (v: Vida, p: PropriedadeRural18) => Math.round((p.municipioId === v.moradia.municipioId ? 400 : 1600) * custoLocal(p.municipioId) / 10) * 10;

/** As culturas que cabem nesta propriedade (pelo tipo), com a aptidão da região. */
export function culturasPossiveis(p: PropriedadeRural18): { c: CulturaId; aptidao: number }[] {
  const reg = regiaoRural(p.municipioId);
  return (Object.keys(CULTURAS18) as CulturaId[]).filter(c => CULTURAS18[c].tipos.includes(p.tipo)).map(c => ({ c, aptidao: CULTURAS18[c].aptidao[reg] })).sort((a, b) => b.aptidao - a.aptidao);
}
export const especiesPossiveis = (p: PropriedadeRural18) => (Object.keys(REBANHOS18) as EspecieRural[]).filter(e => REBANHOS18[e].tipos.includes(p.tipo));
export const estruturasPossiveis = (p: PropriedadeRural18) => (Object.keys(ESTRUTURAS18) as EstruturaId[]).filter(e => maxDaEstrutura(p, e) > 0);
export const maquinasPossiveis = (p: PropriedadeRural18) => (Object.keys(MAQUINAS18) as MaquinaId[]).filter(m => MAQUINAS18[m].tipos.includes(p.tipo) && p.ha >= MAQUINAS18[m].minHa);

/** As festas e os eventos do campo que acontecem perto neste ano (pela região de casa ou de uma propriedade). */
export function festasDoAno(v: Vida): typeof FESTAS18 {
  const regs = new Set([regiaoRural(v.moradia.municipioId), ...todasAsPropriedades(v).map(x => regiaoRural(x.p.municipioId))]);
  if (regs.has('outro') && regs.size === 1) return FESTAS18.filter(f => f.id === 'feira' || f.id === 'exposicao');
  return FESTAS18.filter(f => f.regioes.some(r => regs.has(r)));
}

function precisaDe(v: Vida, id: string): { p: PropriedadeRural18; imovel?: Imovel } | Veredito {
  const x = acharPropriedade(v, id);
  return x ?? bloqueio('impossivel', 'Essa propriedade não é mais sua.');
}
const ehVeredito = (x: unknown): x is Veredito => !!x && typeof x === 'object' && 'grau' in (x as object);

export function disponibilidadeRural18(v: Vida, q: OqueRural18): Veredito {
  const i = idade(v);
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não daqui de dentro.');
  if (q.op === 'festa') {
    if (i < 6) return bloqueio('impossivel', 'Ainda é cedo: quem vai é a família.');
    const f = festasDoAno(v).find(x => x.id === q.festa);
    if (!f) return bloqueio('impossivel', 'Essa festa não é desta região.');
    if (jaFez(v, `festa18:${q.festa}`)) return bloqueio('incompativel', 'Já foi este ano.');
    if (f.equestre && i < 12) return PERMITIDO;
    return vereditoDePagar(v, Math.round(f.custo * custoLocal(v.moradia.municipioId)), 'Ir custa');
  }
  if (i < 18) return bloqueio('ilegal', 'Comprar, arrendar e tocar terra é coisa de maior de idade.');
  if (q.op === 'comprar' || q.op === 'arrendar') {
    const o = ofertasRurais(v).find(x => x.id === q.oferta);
    if (!o) return bloqueio('impossivel', 'Essa oferta já não está de pé.');
    if (q.op === 'arrendar') return vereditoDePagar(v, Math.round(o.arrendamentoAno / 2), 'O dono pede, como garantia, seis meses de arrendamento na conta:');
    if (q.financiar) {
      if (v.financas.negativado) return bloqueio('requisito', 'Com o nome no cadastro de devedores, banco nenhum financia terra.');
      return vereditoDePagar(v, Math.round(o.preco * 0.2), 'A entrada (20%) é de');
    }
    return vereditoDePagar(v, o.preco, 'À vista, custa');
  }
  const x = precisaDe(v, q.id);
  if (ehVeredito(x)) return x;
  const { p, imovel } = x;
  const arrendadaDeTerceiro = p.arrendamento?.sentido === 'pago';
  const parada = p.uso !== 'producao';
  const anoT = anoDe(v.t);
  switch (q.op) {
    case 'devolver': return arrendadaDeTerceiro ? PERMITIDO : bloqueio('impossivel', 'Essa terra é sua: para sair dela, venda (em Patrimônio).');
    case 'arrendar_para': return !imovel ? bloqueio('impossivel', 'Só se arrenda a terra própria.') : p.uso === 'arrendada' ? bloqueio('impossivel', 'Já está arrendada.') : v.moradia.imovelId === imovel.id ? bloqueio('incompativel', 'Você mora nela: arrendar a terra inteira tira a sua casa.') : PERMITIDO;
    case 'retomar': return p.uso === 'arrendada' && p.arrendamento?.sentido === 'recebo' ? PERMITIDO : bloqueio('impossivel', 'Não está arrendada a ninguém.');
    case 'uso': return p.uso === 'arrendada' ? bloqueio('incompativel', 'Está arrendada: o contrato vale até o fim (ou retome).') : p.uso === q.uso ? bloqueio('impossivel', 'Já é assim.') : arrendadaDeTerceiro && q.uso !== 'producao' ? bloqueio('incompativel', 'Terra arrendada é para produzir.') : PERMITIDO;
    case 'plantar': {
      if (parada) return bloqueio('incompativel', 'A propriedade não está em produção (mude o uso para produzir).');
      const k = CULTURAS18[q.cultura];
      if (!k) return bloqueio('impossivel', 'Essa cultura não existe.');
      if (!k.tipos.includes(p.tipo)) return bloqueio('impossivel', `${k.nome.charAt(0).toUpperCase() + k.nome.slice(1)} não é coisa d${TIPOS18[p.tipo].artigo} ${TIPOS18[p.tipo].nome}.`);
      if (!(q.ha > 0)) return bloqueio('impossivel', 'Escolha a área.');
      if (q.ha > areaLivre(p) + 0.01) return bloqueio('incompativel', `Só há ${fmtHa(areaLivre(p))} livres (sem a reserva legal e o que já está plantado).`);
      const ja = p.talhoes.filter(t => t.cultura === q.cultura).reduce((s, t) => s + t.ha, 0);
      if (k.maxHa && ja + q.ha > k.maxHa) return bloqueio('incompativel', `${k.nome.charAt(0).toUpperCase() + k.nome.slice(1)} pede braço: até ${fmtHa(k.maxHa)} por família.`);
      if (q.irrigado) {
        const irrigado = p.talhoes.filter(t => t.irrigado).reduce((s, t) => s + t.ha, 0);
        if (irrigado + q.ha > haIrrigaveis(p) + 0.01) return bloqueio('requisito', `A irrigação dá conta de ${fmtHa(Math.max(0, haIrrigaveis(p) - irrigado))} (construa pivô ou gotejamento, com represa ou poço).`);
      }
      const imp = custoDaImplantacao(p, q.cultura, q.ha);
      return imp > 0 ? vereditoDePagar(v, imp, 'Implantar custa') : PERMITIDO;
    }
    case 'arrancar': return p.talhoes.some(t => t.id === q.talhao) ? PERMITIDO : bloqueio('impossivel', 'Esse talhão não existe mais.');
    case 'safrinha': { const t = p.talhoes.find(x => x.id === q.talhao); return t?.cultura === 'soja' ? PERMITIDO : bloqueio('impossivel', 'A safrinha de milho vem depois da soja.'); }
    case 'animais': {
      if (parada) return bloqueio('incompativel', 'A propriedade não está em produção.');
      const d = REBANHOS18[q.especie];
      if (!d) return bloqueio('impossivel', 'Esse animal não existe.');
      if (!d.tipos.includes(p.tipo)) return bloqueio('impossivel', `${d.nome.charAt(0).toUpperCase() + d.nome.slice(1)} não cabem n${TIPOS18[p.tipo].artigo} ${TIPOS18[p.tipo].nome}.`);
      if ((q.especie === 'tilapia' || q.especie === 'tambaqui') && qtdEstrutura(p, 'tanques') === 0) return bloqueio('requisito', 'Peixe pede tanque: construa os tanques primeiro.');
      const teto = tetoDaEstrutura(p, q.especie);
      const ja = p.rebanhos.find(r => r.especie === q.especie)?.cabecas ?? 0;
      const qtd = d.lote * q.lotes;
      if (ja + qtd > teto * 1.25) return bloqueio('requisito', `Sem ${d.estrutura ? ESTRUTURAS18[d.estrutura].nome : 'estrutura'} a mais, não cabem: o teto hoje é de ${Math.round(teto).toLocaleString('pt-BR')} ${d.unidade}.`);
      return vereditoDePagar(v, precoDoLote(p, q.especie) * q.lotes, 'O lote custa');
    }
    case 'vender_animais': return p.rebanhos.some(r => r.especie === q.especie && r.cabecas > 0) ? PERMITIDO : bloqueio('impossivel', 'Não há esse rebanho.');
    case 'manejo': return p.rebanhos.some(r => r.especie === q.especie) ? PERMITIDO : bloqueio('impossivel', 'Não há esse rebanho.');
    case 'genetica': {
      const rb = p.rebanhos.find(r => r.especie === q.especie);
      if (!rb) return bloqueio('impossivel', 'Não há esse rebanho.');
      if (jaFez(v, `gen18:${p.id}:${q.especie}`)) return bloqueio('incompativel', 'O melhoramento deste ano já foi feito: o efeito aparece nas crias.');
      if (rb.genetica >= 95) return bloqueio('impossivel', 'A genética já é de ponta.');
      return vereditoDePagar(v, custoDaGenetica(p, q.especie), 'Custa');
    }
    case 'construir': {
      const e = ESTRUTURAS18[q.estrutura];
      if (!e) return bloqueio('impossivel', 'Essa obra não existe.');
      const max = maxDaEstrutura(p, q.estrutura);
      if (!max) return bloqueio('impossivel', `${e.nome.charAt(0).toUpperCase() + e.nome.slice(1)} não cabe ${p.ha < e.minHa ? `em ${fmtHa(p.ha)} (pede ${fmtHa(e.minHa)})` : `n${TIPOS18[p.tipo].artigo} ${TIPOS18[p.tipo].nome}`}.`);
      if (qtdEstrutura(p, q.estrutura) >= max) return bloqueio('incompativel', `Já há ${max === 1 ? '' : `${max} `}${e.nome}: é o que cabe nesta área.`);
      if (arrendadaDeTerceiro && !['poco', 'curral', 'aprisco', 'cocheiras'].includes(q.estrutura)) return bloqueio('incompativel', 'Em terra arrendada não se faz obra grande: fica para o dono.');
      if (q.estrutura === 'tanques' && areaLivre(p) < 1) return bloqueio('incompativel', 'Não sobra área livre para escavar um tanque.');
      return vereditoDePagar(v, custoDaEstrutura(p, q.estrutura, q.ha), 'A obra custa');
    }
    case 'maquina': {
      const m = MAQUINAS18[q.maquina];
      if (!m) return bloqueio('impossivel', 'Essa máquina não existe.');
      if (!m.tipos.includes(p.tipo) || p.ha < m.minHa) return bloqueio('impossivel', `${m.nome.charAt(0).toUpperCase() + m.nome.slice(1)} não se paga em ${fmtHa(p.ha)}.`);
      if (p.maquinas.filter(x => x.id === q.maquina).length >= Math.max(1, Math.ceil(p.ha / m.ha))) return bloqueio('incompativel', 'Uma a mais ficaria parada no galpão.');
      return vereditoDePagar(v, precoDaMaquina(p, q.maquina), 'Custa');
    }
    case 'vender_maquina': return p.maquinas.some(m => m.id === q.maquina) ? PERMITIDO : bloqueio('impossivel', 'Não há essa máquina.');
    case 'solo': {
      if (p.tRecuperacao !== undefined && anoT - p.tRecuperacao < 3) return bloqueio('incompativel', `O solo foi corrigido em ${p.tRecuperacao}: o calcário leva uns três anos para agir por inteiro.`);
      if (p.solo >= 90) return bloqueio('impossivel', 'O solo já está muito bom.');
      return vereditoDePagar(v, custoDoSolo(p), 'A correção custa');
    }
    case 'organico': return parada ? bloqueio('incompativel', 'A propriedade não está em produção.') : PERMITIDO;
    case 'foco': return p.foco === q.foco ? bloqueio('impossivel', 'Já é o foco.') : PERMITIDO;
    case 'cooperativa': case 'seguro': return parada ? bloqueio('incompativel', 'A propriedade não está em produção.') : PERMITIDO;
    case 'expandir': {
      if (!imovel) return bloqueio('impossivel', 'Só se expande a terra própria.');
      if (!(q.ha > 0)) return bloqueio('impossivel', 'Escolha a área.');
      if (jaFez(v, `expandiu18:${p.id}`)) return bloqueio('incompativel', 'O vizinho já vendeu o que queria vender este ano.');
      return vereditoDePagar(v, Math.round(p.valorHa * 1.05 * q.ha), 'A área do vizinho custa');
    }
    case 'reduzir': {
      if (!imovel) return bloqueio('impossivel', 'Só se vende parte da terra própria.');
      if (!(q.ha > 0) || q.ha > p.ha * 0.6) return bloqueio('impossivel', 'Dá para vender até 60% da área (o resto é a propriedade).');
      if (q.ha * (1 - 0.2) > areaLivre(p) + 0.01) return bloqueio('incompativel', `Para vender ${fmtHa(q.ha)}, a área precisa estar livre (há ${fmtHa(areaLivre(p))} sem lavoura).`);
      if (imovel.bloqueio) return bloqueio('incompativel', 'A Justiça bloqueou este imóvel.');
      return PERMITIDO;
    }
    case 'tocar': {
      if (v.trabalho.atual?.ocupacaoId === 'produtor_rural') return bloqueio('impossivel', 'Você já vive de produzir.');
      if (p.uso !== 'producao') return bloqueio('incompativel', 'Ponha a propriedade em produção primeiro.');
      return PERMITIDO;
    }
    case 'temporada': return jaFez(v, `temporada18:${anoT}`) ? bloqueio('incompativel', 'Já passou uma temporada no campo este ano.') : !temCasa(p) ? bloqueio('requisito', 'Não há casa para ficar: construa a sede primeiro.') : vereditoDePagar(v, custoDaTemporada(v, p), 'A temporada custa');
  }
  return PERMITIDO;
}
const temCasa = (p: PropriedadeRural18) => qtdEstrutura(p, 'sede') > 0;

export interface SaidaRural18 { texto: string; tom?: 'bom' | 'ruim' | 'neutro' }

export function executarRural18(v: Vida, rr: Rng, q: OqueRural18): SaidaRural18 {
  const anoT = anoDe(v.t);
  if (q.op === 'festa') return irAFesta(v, rr, q.festa);
  if (q.op === 'comprar' || q.op === 'arrendar') {
    const o = ofertasRurais(v).find(x => x.id === q.oferta)!;
    v.fatos[`rural18_negocio_${o.id}`] = v.t;
    const p: PropriedadeRural18 = { ...o.p, id: `pr${v.seq++}`, ultimoAno: anoT - 1, origem: q.op === 'comprar' ? 'compra' : 'arrendamento' };
    if (q.op === 'arrendar') {
      // O rebanho e a lavoura de uma oferta "porteira fechada" não vêm com o arrendamento: a terra vem nua.
      p.talhoes = []; p.rebanhos = []; p.maquinas = [];
      p.arrendamento = { valorAno: o.arrendamentoAno, ate: anoT + 5, sentido: 'pago' };
      (v.rural18 ??= { arrendadas: [] }).arrendadas.push(p);
      escrever(v, { texto: `Arrendou ${p.nome} (${fmtHa(p.ha)}) por cinco anos: ${fmt(o.arrendamentoAno)} por ano.`, relevancia: 'biografia', tema: 'trabalho' });
      return { texto: `Contrato assinado: ${p.nome}, ${fmtHa(p.ha)}, cinco anos.`, tom: 'bom' };
    }
    const imovel: Imovel = { id: `im${v.seq++}`, tipo: 'imovel', modeloId: 'sitio', nome: p.nome, valor: o.preco, precoPago: o.preco, tCompra: v.t, municipioId: p.municipioId, estado: 70, bairro: 'na zona rural', historia: [{ t: v.t, texto: q.financiar ? 'Comprada com financiamento.' : 'Comprada à vista.' }], dono: 'eu', tManutencao: v.t, rural: p };
    const cred = condicaoDeCredito(v);
    const entrada = q.financiar ? Math.round(o.preco * 0.2) : o.preco;
    v.financas.conta -= entrada;
    lancar(v, `Compra: ${p.nome}`, 'despesa', -entrada);
    v.financas.bens.push(imovel);
    if (q.financiar) {
      const saldo = o.preco - entrada;
      const parcela = Math.round(saldo * cred.jurosMes / (1 - Math.pow(1 + cred.jurosMes, -cred.prazo)));
      v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'financiamento_imovel', saldo, jurosMes: cred.jurosMes, parcela, bemId: imovel.id, descricao: `${cred.rural ? 'Crédito rural' : 'Financiamento'}: ${p.nome}`, tInicio: v.t, prazo: cred.prazo });
    }
    if (v.caminhos.rural && v.trabalho.atual?.ocupacaoId === 'produtor_rural' && v.caminhos.rural.terra !== 'propria') v.caminhos.rural.terra = 'propria';
    escrever(v, { texto: `Comprou ${p.nome}: ${fmtHa(p.ha)} de ${TIPOS18[p.tipo].nome} por ${fmt(o.preco)}${q.financiar ? `, com ${cred.nome}` : ''}.`, relevancia: 'marco', tema: 'dinheiro', tom: 'bom' });
    marcar(v, 'conquista', `Comprou ${TIPOS18[p.tipo].artigo === 'a' ? 'a própria' : 'o próprio'} ${TIPOS18[p.tipo].nome}.`, 3, { trilha: 'campo' });
    return { texto: `A escritura saiu: ${p.nome} é sua.`, tom: 'bom' };
  }
  const { p, imovel } = acharPropriedade(v, (q as { id: string }).id)!;
  const c = custoLocal(p.municipioId);
  const pagar = (valor: number, rotulo: string) => { v.financas.conta -= valor; lancar(v, rotulo, 'despesa', -valor); };
  const receber = (valor: number, rotulo: string) => { v.financas.conta += valor; lancar(v, rotulo, 'renda', valor); };
  const fim = (texto: string, tom: SaidaRural18['tom'] = 'neutro'): SaidaRural18 => { sincronizarValor(v, imovel); return { texto, tom }; };
  switch (q.op) {
    case 'devolver': {
      const vend = Math.round((valorDoRebanho(p) + valorDasMaquinas(p, anoT)) * 0.9);
      if (vend > 0) receber(vend, `Venda do rebanho e das máquinas: ${p.nome}`);
      const multa = Math.round(p.arrendamento!.valorAno * 0.5);
      pagar(multa, `Multa do arrendamento: ${p.nome}`);
      v.rural18!.arrendadas = v.rural18!.arrendadas.filter(x => x.id !== p.id);
      escrever(v, { texto: `Devolveu ${p.nome} antes do fim do contrato (multa de ${fmt(multa)}).`, relevancia: 'biografia', tema: 'trabalho' });
      return { texto: `Terra devolvida. ${vend > 0 ? `O rebanho e as máquinas viraram ${fmt(vend)}.` : ''}` };
    }
    case 'arrendar_para': {
      const valor = Math.round(p.valorHa * p.ha * (p.tipo === 'pecuaria' || p.tipo === 'florestal' ? 0.03 : 0.04) / 100) * 100;
      const vend = Math.round(valorDoRebanho(p) * 0.92);
      if (vend > 0) receber(vend, `Venda do rebanho: ${p.nome}`);
      p.rebanhos = []; p.cavalos = undefined;
      p.talhoes = p.talhoes.filter(t => CULTURAS18[t.cultura].ciclo !== 'anual');
      p.uso = 'arrendada';
      p.arrendamento = { valorAno: valor, ate: anoT + 5, sentido: 'recebo' };
      escrever(v, { texto: `Arrendou ${p.nome} a um vizinho por cinco anos: ${fmt(valor)} por ano.${vend > 0 ? ` O rebanho foi vendido (${fmt(vend)}).` : ''}`, relevancia: 'biografia', tema: 'dinheiro' });
      return fim(`Contrato assinado: ${fmt(valor)} por ano, cinco anos.`, 'bom');
    }
    case 'retomar': {
      const multa = Math.round(p.arrendamento!.valorAno * 0.5);
      pagar(multa, `Rescisão do arrendamento: ${p.nome}`);
      p.arrendamento = undefined; p.uso = 'investimento';
      return fim(`A terra voltou para você (a rescisão custou ${fmt(multa)}).`);
    }
    case 'uso': {
      p.uso = q.uso;
      return fim(q.uso === 'producao' ? `${p.nome} em produção: o que plantar e o que criar é com você.` : q.uso === 'residencia' ? `${p.nome}: casa e lazer. A lavoura e o rebanho param de contar como negócio.` : `${p.nome} guardada como investimento: a terra valoriza (ou não); custa o imposto e a conservação.`);
    }
    case 'plantar': {
      const k = CULTURAS18[q.cultura];
      const imp = custoDaImplantacao(p, q.cultura, q.ha);
      if (imp > 0) pagar(imp, `Implantação: ${k.nome}`);
      const antigo = p.talhoes.find(t => t.cultura === q.cultura && !!t.irrigado === !!q.irrigado && k.ciclo === 'anual');
      if (antigo) antigo.ha = Math.round((antigo.ha + q.ha) * 10) / 10;
      else p.talhoes.push({ id: `t${v.seq++}`, cultura: q.cultura, ha: Math.round(q.ha * 10) / 10, ano: anoT, ...(q.irrigado ? { irrigado: true } : {}) });
      const prazo = k.ciclo === 'anual' ? `Planta-se entre ${mesNome(k.plantio[0])} e ${mesNome(k.plantio[1])}; colhe-se entre ${mesNome(k.colheita[0])} e ${mesNome(k.colheita[1])}.` : k.ciclo === 'florestal' ? `O corte vem em ${k.vidaUtil} anos.` : `A primeira colheita vem em ${k.formacao} ${k.formacao === 1 ? 'ano' : 'anos'}.`;
      return fim(`${fmtHa(q.ha)} de ${k.nome}${q.irrigado ? ', irrigados' : ''}. ${prazo}`, 'bom');
    }
    case 'arrancar': {
      const t = p.talhoes.find(x => x.id === q.talhao)!;
      p.talhoes = p.talhoes.filter(x => x.id !== q.talhao);
      return fim(`${fmtHa(t.ha)} de ${CULTURAS18[t.cultura].nome} saíram: a área está livre.`);
    }
    case 'safrinha': {
      const t = p.talhoes.find(x => x.id === q.talhao)!;
      t.safrinha = !t.safrinha;
      return fim(t.safrinha ? 'Depois da soja, milho safrinha na mesma área: duas safras no ano (e o risco da chuva do outono).' : 'Sem safrinha: a área descansa depois da soja.');
    }
    case 'animais': {
      const d = REBANHOS18[q.especie];
      const preco = precoDoLote(p, q.especie) * q.lotes;
      pagar(preco, `Compra de animais: ${d.nome}`);
      const rb = p.rebanhos.find(r => r.especie === q.especie);
      const qtd = d.lote * q.lotes;
      if (rb) { rb.genetica = Math.round((rb.genetica * rb.cabecas + 50 * qtd) / (rb.cabecas + qtd)); rb.cabecas += qtd; }
      else p.rebanhos.push({ especie: q.especie, cabecas: qtd, genetica: 50, sanidade: 70, alimentacao: q.especie === 'tilapia' || q.especie === 'tambaqui' || q.especie === 'porcos' || q.especie === 'frangos' || q.especie === 'galinhas' ? 'confinado' : 'pasto', estrategia: 'manter', sanitario: 'basico' });
      if (q.especie === 'cavalos' && p.tipo === 'haras') adicionarCavalosDeCorrida(v, p, rr, Math.min(3, q.lotes));
      return fim(`${qtd.toLocaleString('pt-BR')} ${d.unidade} de ${d.nome} chegaram (${fmt(preco)}).`, 'bom');
    }
    case 'vender_animais': {
      const rb = p.rebanhos.find(r => r.especie === q.especie)!;
      const d = REBANHOS18[q.especie];
      const n = Math.max(1, Math.round(rb.cabecas * clamp(q.fracao, 0, 1, )));
      const unit = q.especie === 'tilapia' || q.especie === 'tambaqui' ? 1200 : d.valor * (0.6 + rb.genetica / 125);
      const valor = Math.round(n * unit * c * 0.95);
      rb.cabecas -= n;
      if (rb.cabecas <= 0) p.rebanhos = p.rebanhos.filter(x => x !== rb);
      if (q.especie === 'cavalos' && rb.cabecas <= 0) p.cavalos = undefined;
      receber(valor, `Venda de animais: ${d.nome}`);
      return fim(`Vendeu ${n.toLocaleString('pt-BR')} ${d.unidade} de ${d.nome}: ${fmt(valor)}.`);
    }
    case 'manejo': {
      const rb = p.rebanhos.find(r => r.especie === q.especie)!;
      if (q.alimentacao) rb.alimentacao = q.alimentacao;
      if (q.estrategia) rb.estrategia = q.estrategia;
      if (q.sanitario) rb.sanitario = q.sanitario;
      return fim(`Manejo de ${REBANHOS18[q.especie].nome}: ${rb.alimentacao === 'pasto' ? 'a pasto' : rb.alimentacao === 'suplementado' ? 'pasto com suplemento' : 'confinado'}, ${rb.estrategia === 'manter' ? 'mantendo o tamanho' : rb.estrategia === 'crescer' ? 'retendo as fêmeas para crescer' : 'vendendo mais para reduzir'}, sanidade ${rb.sanitario === 'completo' ? 'completa' : 'básica'}.`);
    }
    case 'genetica': {
      const rb = p.rebanhos.find(r => r.especie === q.especie)!;
      const custo = custoDaGenetica(p, q.especie);
      pagar(custo, `Melhoramento genético: ${REBANHOS18[q.especie].nome}`);
      fazer(v, `gen18:${p.id}:${q.especie}`);
      rb.genetica = clamp(rb.genetica + 7);
      const como = q.especie === 'corte' || q.especie === 'leite' ? 'inseminação artificial com sêmen de touro provado' : q.especie === 'cavalos' ? 'cobertura com garanhão de linhagem' : 'reprodutores melhorados';
      return fim(`${como.charAt(0).toUpperCase() + como.slice(1)}: a genética do rebanho sobe (as crias mostram).`, 'bom');
    }
    case 'construir': {
      const e = ESTRUTURAS18[q.estrutura];
      const custo = custoDaEstrutura(p, q.estrutura, q.ha);
      pagar(custo, `Obra: ${e.nome}`);
      const ha = e.porHa ? (q.ha ?? Math.min(areaUtil(p), e.capacidade ?? areaUtil(p))) : undefined;
      p.estruturas.push({ id: q.estrutura, n: 1, t: v.t, ...(ha ? { ha } : {}) });
      return fim(`${e.nome.charAt(0).toUpperCase() + e.nome.slice(1)} pront${e.nome.endsWith('a') || e.nome.startsWith('irrigação') || e.nome.startsWith('energia') ? 'a' : e.nome.endsWith('s') ? 'os' : 'o'} (${fmt(custo)}).`, 'bom');
    }
    case 'maquina': {
      const preco = precoDaMaquina(p, q.maquina);
      pagar(preco, `Compra: ${MAQUINAS18[q.maquina].nome}`);
      p.maquinas.push({ id: q.maquina, t: v.t });
      return fim(`${MAQUINAS18[q.maquina].nome.charAt(0).toUpperCase() + MAQUINAS18[q.maquina].nome.slice(1)} no galpão (${fmt(preco)}).`, 'bom');
    }
    case 'vender_maquina': {
      const m = p.maquinas.find(x => x.id === q.maquina)!;
      const valor = Math.round(MAQUINAS18[q.maquina].preco * c * Math.max(0.2, 1 - Math.max(0, anoT - anoDe(m.t)) * 0.08) * 0.9);
      p.maquinas = p.maquinas.filter(x => x !== m);
      receber(valor, `Venda: ${MAQUINAS18[q.maquina].nome}`);
      return fim(`Vendeu ${MAQUINAS18[q.maquina].nome}: ${fmt(valor)}.`);
    }
    case 'solo': {
      const custo = custoDoSolo(p);
      pagar(custo, `Correção do solo: ${p.nome}`);
      p.solo = clamp(p.solo + 16, 10, 95);
      p.tRecuperacao = anoT;
      return fim('Calcário, gesso e adubação verde: o solo melhora (e a lavoura sente na safra seguinte).', 'bom');
    }
    case 'organico': {
      if (p.manejo === 'organico') { p.manejo = 'convencional'; p.transicao = undefined; return fim('De volta ao convencional: a produtividade volta, o prêmio do orgânico vai embora.'); }
      p.manejo = 'organico'; p.transicao = anoT;
      return fim('Começou a transição para o orgânico: três anos sem químico até a certificação (rende menos agora; depois, vende mais caro).', 'bom');
    }
    case 'foco': { p.foco = q.foco; return fim(q.foco === 'volume' ? 'Foco em volume: produzir mais por hectare, vender no preço do dia.' : q.foco === 'qualidade' ? 'Foco em qualidade: menos volume, mais cuidado, preço melhor.' : 'Equilíbrio entre volume e qualidade.'); }
    case 'cooperativa': { p.cooperativa = !p.cooperativa; if (v.caminhos.rural && produtorTocaEsta(v, p)) v.caminhos.rural.cooperativa = !!p.cooperativa; return fim(p.cooperativa ? 'Associado à cooperativa: compra junto, vende junto, assistência técnica.' : 'Saiu da cooperativa.'); }
    case 'seguro': { p.seguro = !p.seguro; return fim(p.seguro ? 'Lavoura no seguro rural: o ano muito ruim tem cobertura.' : 'Sem seguro rural.'); }
    case 'expandir': {
      const preco = Math.round(p.valorHa * 1.05 * q.ha);
      pagar(preco, `Compra de área: ${p.nome}`);
      fazer(v, `expandiu18:${p.id}`);
      p.ha = Math.round((p.ha + q.ha) * 10) / 10;
      if (imovel) { imovel.precoPago = (imovel.precoPago ?? imovel.valor) + preco; (imovel.historia ??= []).push({ t: v.t, texto: `Comprou ${fmtHa(q.ha)} do vizinho.` }); }
      return fim(`${fmtHa(q.ha)} a mais: ${p.nome} agora tem ${fmtHa(p.ha)}.`, 'bom');
    }
    case 'reduzir': {
      const valor = Math.round(p.valorHa * 0.95 * q.ha);
      p.ha = Math.round((p.ha - q.ha) * 10) / 10;
      receber(valor, `Venda de área: ${p.nome}`);
      if (imovel) (imovel.historia ??= []).push({ t: v.t, texto: `Vendeu ${fmtHa(q.ha)}.` });
      return fim(`Vendeu ${fmtHa(q.ha)}: ${fmt(valor)}. Ficaram ${fmtHa(p.ha)}.`);
    }
    case 'tocar': {
      contratar(v, rr, ocupacao('produtor_rural'), 'convite');
      iniciarRural(v, imovel ? 'propria' : p.arrendamento?.sentido === 'pago' ? 'arrendada' : 'familia');
      if (v.caminhos.rural) v.caminhos.rural.cooperativa = !!p.cooperativa;
      // A terra que se toca passa a ser a primeira da lista (a que `tocadaPorVoce` lê).
      if (imovel) { const bens = v.financas.bens; const k = bens.indexOf(imovel); if (k > 0) { bens.splice(k, 1); bens.unshift(imovel); } }
      escrever(v, { texto: `Foi viver de produzir: ${p.nome} passou a ser o seu trabalho.`, relevancia: 'marco', tema: 'trabalho' });
      return fim('Agora a terra é o seu trabalho: a renda vem da safra e do rebanho.', 'bom');
    }
    case 'temporada': {
      const custo = custoDaTemporada(v, p);
      pagar(custo, 'Temporada no campo');
      fazer(v, `temporada18:${anoT}`);
      (v.rural18 ??= { arrendadas: [] }).temporada = anoT;
      abalar(v, 'a temporada no campo', 4, -6);
      const par = parceiro(v);
      if (par) par.vin.proximidade = clamp(par.vin.proximidade + 3);
      const texto = rr.pick([
        `Duas semanas n${TIPOS18[p.tipo].artigo} ${p.nome.split(' ').slice(0, 1)[0].toLowerCase()}: café no fogão a lenha, o barulho do gado de manhã cedo, nenhum compromisso depois das oito.`,
        `Uma temporada em ${p.nome}: pescaria no açude, trilha até a cachoeira, a noite com mais estrelas do que se lembrava.`,
        `Passou o mês de férias em ${p.nome}. Voltou queimado de sol e com vontade de ficar.`
      ]);
      escrever(v, { texto, relevancia: 'cotidiano', tema: 'lazer', tom: 'bom' });
      return { texto, tom: 'bom' };
    }
  }
  return { texto: '' };
}

const produtorTocaEsta = (v: Vida, p: PropriedadeRural18) => v.trabalho.atual?.ocupacaoId === 'produtor_rural' && todasAsPropriedades(v).find(x => x.p.uso === 'producao')?.p.id === p.id;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const mesNome = (m: number) => MESES[(m - 1 + 12) % 12];

/* ================================================================== Cavalos de corrida do haras */

const NOMES_CAVALO = ['Vento Sul', 'Estrela Guia', 'Trovão', 'Ventania', 'Faísca', 'Relâmpago', 'Bem-te-vi', 'Saci', 'Cometa', 'Garoa', 'Aurora', 'Ventura', 'Tempestade', 'Brisa', 'Caipora', 'Fandango', 'Xodó', 'Sertanejo', 'Luar', 'Andorinha'];
export function adicionarCavalosDeCorrida(v: Vida, p: PropriedadeRural18, r: Rng, n: number): void {
  const anoT = anoDe(v.t);
  const lista = (p.cavalos ??= []);
  const gen = p.rebanhos.find(x => x.especie === 'cavalos')?.genetica ?? 50;
  for (let k = 0; k < n; k++) {
    const usados = new Set(lista.map(c => c.nome));
    const nome = NOMES_CAVALO.find(x => !usados.has(x) && r.chance(0.5)) ?? NOMES_CAVALO.find(x => !usados.has(x)) ?? `Potro ${lista.length + 1}`;
    lista.push({ id: `cv${v.seq++}`, nome, nasc: anoT - r.int(2, 4), sexo: r.chance(0.5) ? 'macho' : 'femea', velocidade: clamp(Math.round(42 + gen / 5 + r.normal() * 9)), fundo: clamp(Math.round(42 + gen / 5 + r.normal() * 9)), forma: 60, corridas: 0, vitorias: 0, premios: 0 });
  }
}

/* ================================================================== As festas */

function irAFesta(v: Vida, r: Rng, id: string): SaidaRural18 {
  const f = FESTAS18.find(x => x.id === id)!;
  fazer(v, `festa18:${id}`);
  const custo = Math.round(f.custo * custoLocal(v.moradia.municipioId));
  if (idade(v) >= 12) { v.financas.conta -= custo; lancar(v, `Festa: ${f.nome}`, 'despesa', -custo); }
  const st = (v.rural18 ??= { arrendadas: [] });
  const anoT = anoDe(v.t);
  if (st.festas?.ano !== anoT) st.festas = { ano: anoT, ids: [] };
  st.festas.ids.push(id);
  abalar(v, f.nome, 3, -3);
  const extras: string[] = [];
  // A exposição: quem tem rebanho bom leva ao julgamento e ao leilão.
  if (f.leilao) {
    const melhor = todasAsPropriedades(v).flatMap(x => x.p.rebanhos.map(rb => ({ x, rb }))).filter(({ rb }) => ['corte', 'leite', 'cavalos', 'ovelhas', 'cabras'].includes(rb.especie)).sort((a, b) => b.rb.genetica - a.rb.genetica)[0];
    if (melhor && melhor.rb.genetica >= 60 && r.chance(0.25 + (melhor.rb.genetica - 60) / 80)) {
      melhor.rb.genetica = clamp(melhor.rb.genetica + 2);
      extras.push(`Uma matriz ${melhor.x.p.nome.startsWith('Sítio') ? 'do' : 'da'} ${melhor.x.p.nome} levou a faixa de campeã da raça — o telefone tocou a semana inteira.`);
      marcar(v, 'conquista', `Campeã da raça na exposição agropecuária.`, 2, { trilha: 'campo' });
    } else if (melhor) extras.push('Os seus animais não passaram da primeira fase do julgamento, mas o leilão deu ideia de quanto valem.');
  }
  if (f.equestre && todasAsPropriedades(v).some(x => x.p.rebanhos.some(rb => rb.especie === 'cavalos'))) extras.push('Foi a cavalo, com os animais da casa.');
  const texto = `${f.nome.charAt(0).toUpperCase() + f.nome.slice(1)}: ${f.oque.charAt(0).toLowerCase() + f.oque.slice(1)}${extras.length ? ' ' + extras.join(' ') : ''}`;
  escrever(v, { texto, relevancia: extras.length ? 'biografia' : 'cotidiano', tema: 'lazer', tom: 'bom' });
  return { texto, tom: 'bom' };
}

/* ================================================================== A terra da família (origem rural) */

/**
 * A família que vive do campo tem terra: um sítio (ou, na classe alta, uma fazenda) no nome do pai ou da mãe — nas
 * POSSES dela (o mesmo patrimônio que a herança e a partilha já sabem passar adiante). Chamado uma vez, na criação ou
 * na primeira vez que um save antigo é aberto com pais do campo.
 */
export function terraDaFamilia(v: Vida, r: Rng): PropriedadeRural18 | undefined {
  if (v.fatos['rural18_familia'] !== undefined) return undefined;
  const ocupacoesDoCampo = ['produtor_rural', 'gerente_fazenda'];
  const pais = Object.values(v.pessoas).filter(p => p.vivo && (v.vinculos[p.id]?.parentesco === 'pai' || v.vinculos[p.id]?.parentesco === 'mae'));
  const dono = pais.find(p => p.ocupacaoId && ocupacoesDoCampo.includes(p.ocupacaoId));
  v.fatos['rural18_familia'] = v.t;
  if (!dono) return undefined;
  const classe = v.origem.classe;
  const tipo: TipoRural = classe === 'alta' ? r.pick(['agricola', 'pecuaria', 'cafeeira'] as const) : regiaoRural(v.moradia.municipioId) === 'Sudeste' && r.chance(0.3) ? 'cafeeira' : 'sitio';
  const T = TIPOS18[tipo];
  const ha = classe === 'alta' ? T.tamanhos[1 + r.int(0, Math.min(2, T.tamanhos.length - 2))] : classe === 'vulneravel' || classe === 'trabalhadora' ? T.tamanhos[0] : T.tamanhos[Math.min(1, T.tamanhos.length - 1)];
  const p = novaPropriedade(v, r, tipo, ha, v.moradia.municipioId, 'familia');
  povoar(p, r, anoDe(v.t), 0.7);
  if (tipo === 'sitio' && !p.rebanhos.some(x => x.especie === 'galinhas')) p.rebanhos.push({ especie: 'galinhas', cabecas: 40, genetica: 40, sanidade: 60, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' });
  const valor = valorDaPropriedade(p, anoDe(v.t));
  const imovel: Imovel = { id: `im${v.seq++}`, tipo: 'imovel', modeloId: 'sitio', nome: p.nome, valor, tCompra: v.t - 12 * 20, municipioId: p.municipioId, estado: 60, bairro: 'na zona rural', historia: [{ t: v.t, texto: `Da família: ${dono.nome} toca a terra.` }], rural: p };
  const pos = (dono.posses ??= { dinheiro: 0, bens: [], historia: [] });
  pos.bens.push(imovel);
  pos.historia.push({ t: v.t, texto: `${p.nome} (${fmtHa(p.ha)})`, valor });
  return p;
}

export { custoLocal };
