/**
 * REWORK 12.4 — VIDA PERSONALIZADA: o que a pessoa faz da casa, dos veículos, dos objetos, da roupa e do tempo livre.
 *
 * Uma ação só no motor (`{ tipo: 'personalizar', op }`), com as suas operações:
 *
 *   CASA       trocar um acabamento de um cômodo (piso, parede, luz); mudar o uso de um quarto que sobra (o estúdio, a
 *              academia); construir no terreno (a piscina, a edícula do ateliê); pôr um objeto noutro cômodo. Quem mora
 *              de aluguel mexe na superfície (pintura, luz, o uso do quarto); obra e piso, só na casa própria.
 *   OBJETOS    cada objeto tem UM lugar (`local`): em casa, noutra propriedade sua, no depósito, no cofre. Mover é trocar
 *              o lugar (com frete, quando pesa ou é longe) — nunca copiar. Emprestar (segue seu), pedir de volta, doar
 *              (vira lembrança de quem recebe), dar um nome, repaginar o móvel (estofar, pintar), expor a peça, marcá-la
 *              como de família (não vai a leilão na herança).
 *   VEÍCULOS   peças estéticas e funcionais por categoria (`dados/personalizacaoVeiculo`), um nome, o papel na garagem
 *              (de coleção), a garagem onde fica (outra propriedade sua).
 *   ROUPA      o que vestir em cada ocasião (`EstiloPessoal.looks`).
 *   CULTURA    ouvir música com calma, ir a um programa cultural, produzir uma obra (`gostos`).
 *
 * E o que corre sozinho: os custos do mês (depósito, cofre, vaga alugada, o que se construiu) entram em
 * `PATRIMONIO_NO_MES`; o ano normaliza os lugares (o que estava num imóvel vendido volta para casa; o emprestado a quem
 * morreu volta), aplica o conforto da casa e guarda as fases do estilo.
 */

import type { AspectoDoComodo, CoisaTida, Colecionavel, Imovel, ItemDeEstilo, Ocasiao, Veiculo, Vida } from '../tipos';
import { clamp } from '../rng';
import { escrever, idade, lembrarCom } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { coisa } from '../dados/coisas';
import { variantesDaCoisa } from '../dados/pertences';
import { itemEstilo, estiloDominante, nomeDoEstilo } from '../dados/estilo';
import { COFRE_ANUAL, COISAS_GRANDES, COMODOS, comodo as modeloComodo, DEPOSITO, plantaDe, VAGA_MENSAL, type TipoComodo } from '../dados/lar';
import { modeloMoradia, modeloVeiculo } from '../dados/bens';
import { economiaLocal, nomeLugar } from '../dados/lugares';
import { opcaoDaPeca, pecasDaCategoria } from '../dados/personalizacaoVeiculo';
import { pagar, PATRIMONIO_NO_MES, vereditoDePagar } from './dinheiro';
import { coisasDaVida } from './coisas';
import { colecao } from './colecao';
import { precoNovoLocal, textoVeiculo, veiculos } from './veiculos';
import { ACABAMENTOS, areaDoComodo, casaDaFamilia, comodosDaCasa, comodosDe, custoMensalDoLar, donoDoLar, efeitoDoAnoEmCasa, imovelDaMoradia, naCasaAtual, plantaDaCasa, poderSobreACasa, precoDoAcabamento, terrenoLivre } from './lar';
import { afetoDe, registrarNoObjeto } from './memoriaDosObjetos';
import { disponibilidadeCultural, disponibilidadeObra, fazerCultural, processarGostos, produzirObra } from './gostos';
import { dinheiro as fmt } from '../texto';

export type RefObjeto = { tipo: 'coisa' | 'colecao' | 'estilo'; id: string };

export type OpPersonalizar =
  | { o: 'acabamento'; comodo: string; aspecto: AspectoDoComodo; opcao: string }
  | { o: 'converter'; comodo: string; tipo: TipoComodo }
  | { o: 'construir'; tipo: TipoComodo }
  | { o: 'por_no_comodo'; coisa: string; comodo: string }
  | { o: 'mover'; ref: RefObjeto; para: string | null }
  | { o: 'emprestar'; coisa: string; pessoaId: string }
  | { o: 'pedir_de_volta'; coisa: string }
  | { o: 'doar'; ref: RefObjeto; pessoaId: string }
  | { o: 'apelidar'; ref: RefObjeto | { tipo: 'veiculo'; id: string }; nome: string }
  | { o: 'repaginar'; coisa: string; variante: number }
  | { o: 'expor'; colecao: string; comodo: string | null }
  | { o: 'de_familia'; colecao: string; sim: boolean }
  | { o: 'veiculo_peca'; bem: string; peca: string; opcao: string }
  | { o: 'veiculo_colecao'; bem: string; sim: boolean }
  | { o: 'veiculo_garagem'; bem: string; imovel: string | null }
  | { o: 'look'; ocasiao: Ocasiao; itens: string[] }
  | { o: 'cultural'; oque: string; genero?: string; pessoaId?: string }
  | { o: 'obra'; linguagem: string };

const c = (v: Vida, municipioId = v.moradia.municipioId) => economiaLocal(municipioId).custo;
const arred = (x: number) => Math.round(x / 10) * 10;

/* ================================================================= lugares */

export function objetoDe(v: Vida, ref: RefObjeto): CoisaTida | Colecionavel | ItemDeEstilo | undefined {
  if (ref.tipo === 'coisa') return coisasDaVida(v).find(x => x.id === ref.id);
  if (ref.tipo === 'colecao') return colecao(v).find(x => x.id === ref.id);
  return (v.eu.estilo?.itens ?? []).find(x => x.id === ref.id);
}

/** O nome do objeto (com o apelido, quando tem). */
export function nomeDoObjeto(v: Vida, ref: RefObjeto): string {
  const o = objetoDe(v, ref);
  if (!o) return 'isso';
  if (ref.tipo === 'coisa') { const t = o as CoisaTida; const nome = coisa(t.coisaId)?.nome ?? t.coisaId; return t.apelido ? `${nome} "${t.apelido}"` : nome; }
  if (ref.tipo === 'colecao') return (o as Colecionavel).nome;
  return itemEstilo((o as ItemDeEstilo).itemId)?.nome.toLowerCase() ?? 'isso';
}

const imovelPorId = (v: Vida, id: string) => v.financas.bens.find((b): b is Imovel => b.tipo === 'imovel' && b.id === id);

/** Onde fica um lugar (`im:`, `dep:`, `cofre:`) — o município. */
export function cidadeDoLocal(v: Vida, local: string | undefined): string {
  if (!local) return v.moradia.municipioId;
  const [tipo, id] = local.split(':');
  if (tipo === 'im') return imovelPorId(v, id)?.municipioId ?? v.moradia.municipioId;
  return id;
}

/** O lugar em palavras ("em casa", "no sítio, em Atibaia", "num depósito em São Paulo", "no cofre do banco"). */
export function nomeDoLocal(v: Vida, local: string | undefined): string {
  if (!local) return 'em casa';
  const [tipo, id] = local.split(':');
  if (tipo === 'im') { const b = imovelPorId(v, id); return b ? `${modeloMoradia(b.modeloId).casa ? 'na' : 'no'} ${b.nome}${b.municipioId !== v.moradia.municipioId ? `, em ${nomeLugar(b.municipioId)}` : ''}` : 'num imóvel que não é mais seu'; }
  if (tipo === 'dep') return `num depósito${id !== v.moradia.municipioId ? ` em ${nomeLugar(id)}` : ' alugado'}`;
  return `no cofre do banco${id !== v.moradia.municipioId ? ` (${nomeLugar(id)})` : ''}`;
}

const pequeno = (v: Vida, ref: RefObjeto): boolean => {
  const o = objetoDe(v, ref);
  if (!o) return false;
  if (ref.tipo === 'estilo') { const it = itemEstilo((o as ItemDeEstilo).itemId); return it?.categoria === 'acessorio' || it?.categoria === 'oculos'; }
  if (ref.tipo === 'colecao') return ['relogio', 'joia'].includes((o as Colecionavel).categoria);
  return false;
};
const grande = (v: Vida, ref: RefObjeto): boolean => ref.tipo === 'coisa' && COISAS_GRANDES.has((objetoDe(v, ref) as CoisaTida | undefined)?.coisaId ?? '');

/** O frete de levar um objeto de um lugar para outro: o que pesa e o que é longe custam; a peça de arte vai com seguro. */
export function freteDe(v: Vida, ref: RefObjeto, de: string | undefined, para: string | undefined): number {
  const longe = cidadeDoLocal(v, de) !== cidadeDoLocal(v, para);
  const o = objetoDe(v, ref);
  if (ref.tipo === 'colecao' && o) return arred(Math.max(300, (o as Colecionavel).valor * 0.005) * (longe ? 2 : 1));
  if (grande(v, ref)) return arred((longe ? 1800 : 350) * c(v));
  return longe ? arred(120 * c(v)) : 0;
}

/** Os lugares para onde um objeto pode ir (com o frete de cada um). */
export function locaisPara(v: Vida, ref: RefObjeto): { id: string | null; nome: string; frete: number }[] {
  const o = objetoDe(v, ref) as { local?: string } | undefined;
  if (!o) return [];
  const out: { id: string | null; nome: string; frete: number }[] = [];
  const add = (id: string | null) => { if ((id ?? undefined) !== o.local) out.push({ id, nome: nomeDoLocal(v, id ?? undefined), frete: freteDe(v, ref, o.local, id ?? undefined) }); };
  if (!casaDaFamilia(v) || ref.tipo !== 'coisa' || !coisa((o as CoisaTida).coisaId)?.daCasa) add(null);
  for (const b of v.financas.bens) if (b.tipo === 'imovel' && b.id !== v.moradia.imovelId && !b.alugadoPor) add(`im:${b.id}`);
  add(`dep:${v.moradia.municipioId}`);
  if (pequeno(v, ref)) add(`cofre:${v.moradia.municipioId}`);
  return out;
}

/* ================================================================ disponibilidade */

export function disponibilidadePersonalizar(v: Vida, op: OpPersonalizar): Veredito {
  const i = idade(v);
  if (v.justica?.prisao && op.o !== 'de_familia') return bloqueio('incompativel', 'Na prisão, não.');
  switch (op.o) {
    case 'acabamento': {
      const poder = poderSobreACasa(v);
      if (poder === 'nada') return bloqueio('impossivel', 'A casa da família é decisão dos adultos dela.');
      if (i < 18) return bloqueio('impossivel', 'A partir dos 18.');
      if (poder === 'superficie' && op.aspecto === 'piso') return bloqueio('incompativel', 'Trocar o piso é obra: na casa alugada, só com o dono (e quem paga é ele).');
      const cm = comodosDaCasa(v).find(x => x.id === op.comodo);
      if (!cm) return bloqueio('impossivel', 'Esse cômodo não existe nesta casa.');
      if (['jardim', 'piscina', 'garagem', 'lazer'].includes(cm.tipo) && op.aspecto !== 'luz') return bloqueio('impossivel', 'Não se aplica a esse espaço.');
      const opc = ACABAMENTOS[op.aspecto].opcoes.find(x => x.id === op.opcao);
      if (!opc) return bloqueio('impossivel', 'Essa opção não existe.');
      if ((donoDoLar(v)?.lar?.acabamentos[op.comodo]?.[op.aspecto] ?? '') === op.opcao) return bloqueio('incompativel', 'Já está assim.');
      return vereditoDePagar(v, precoDoAcabamento(v.moradia.modeloId, cm, op.aspecto, op.opcao, c(v)));
    }
    case 'converter': {
      const poder = poderSobreACasa(v);
      if (poder === 'nada') return bloqueio('impossivel', 'A casa da família é decisão dos adultos dela.');
      if (i < 18) return bloqueio('impossivel', 'A partir dos 18.');
      const cm = comodosDaCasa(v).find(x => x.id === op.comodo);
      if (!cm || !(cm.tipo === 'quarto_extra' || cm.de === 'conversao' || (cm.de === 'obra' && !!modeloComodo(cm.tipo)?.conversao))) return bloqueio('impossivel', 'Só um quarto que sobra muda de uso.');
      const alvo = modeloComodo(op.tipo);
      if (!alvo || (op.tipo !== 'quarto_extra' && !alvo.conversao)) return bloqueio('impossivel', 'Isso não cabe num quarto.');
      if (cm.tipo === op.tipo) return bloqueio('incompativel', 'Já é isso.');
      if (op.tipo !== 'quarto_extra' && quartosLivres(v) <= 0 && cm.tipo === 'quarto_extra') return bloqueio('incompativel', 'Esse quarto é de alguém: na casa, cada um precisa do seu canto.');
      return vereditoDePagar(v, custoDeConverter(v, op.tipo));
    }
    case 'construir': {
      if (poderSobreACasa(v) !== 'tudo') return bloqueio('impossivel', casaDaFamilia(v) ? 'A casa da família é decisão dos adultos dela.' : 'Obra, só na casa própria.');
      const m = modeloComodo(op.tipo);
      if (!m?.obra) return bloqueio('impossivel', 'Isso não se constrói.');
      const p = plantaDaCasa(v);
      if (p.integrado || (p.terreno === 0)) return bloqueio('impossivel', 'Não há terreno: um apartamento não cresce para os lados.');
      if (p.obrasPermitidas && !p.obrasPermitidas.includes(op.tipo)) return bloqueio('impossivel', 'O prédio não deixa (no terraço, só o que não pesa na laje).');
      const lar = donoDoLar(v)?.lar;
      if (terrenoLivre(v.moradia.modeloId, lar) < m.obra.terreno) return bloqueio('impossivel', `Falta terreno: pede ${m.obra.terreno} m², sobram ${terrenoLivre(v.moradia.modeloId, lar)}.`);
      if (comodosDaCasa(v).some(x => x.tipo === op.tipo) && op.tipo !== 'quarto_extra') return bloqueio('incompativel', `A casa já tem ${m.artigo} ${m.nome}.`);
      const im = imovelDaMoradia(v)!;
      if (im.problema) return bloqueio('incompativel', 'Primeiro, o reparo que está pendente.');
      return vereditoDePagar(v, custoDeConstruir(v, op.tipo));
    }
    case 'por_no_comodo': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa);
      if (!t) return bloqueio('impossivel', 'Isso não é mais seu.');
      if (!naCasaAtual(t)) return bloqueio('incompativel', 'Não está em casa.');
      if (!comodosDaCasa(v).some(x => x.id === op.comodo)) return bloqueio('impossivel', 'Esse cômodo não existe nesta casa.');
      return t.comodo === op.comodo ? bloqueio('incompativel', 'Já está lá.') : PERMITIDO;
    }
    case 'mover': {
      if (i < 16) return bloqueio('impossivel', 'A partir dos 16.');
      const o = objetoDe(v, op.ref) as (CoisaTida & Colecionavel) | undefined;
      if (!o) return bloqueio('impossivel', 'Isso não é mais seu.');
      if (o.emprestadaA) return bloqueio('incompativel', 'Está emprestado: primeiro, pedir de volta.');
      if (o.emprestadaFora) return bloqueio('incompativel', 'Está num museu até o fim do empréstimo.');
      if (op.ref.tipo === 'estilo' && (o as unknown as ItemDeEstilo).usando) return bloqueio('incompativel', 'Você está usando: tire antes de guardar.');
      const destino = locaisPara(v, op.ref).find(x => x.id === op.para);
      if (!destino) return bloqueio('impossivel', (op.para ?? undefined) === o.local ? 'Já está lá.' : 'Não dá para levar para lá.');
      return destino.frete ? vereditoDePagar(v, destino.frete, 'O frete custa') : PERMITIDO;
    }
    case 'emprestar': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa);
      const p = v.pessoas[op.pessoaId];
      const vin = v.vinculos[op.pessoaId];
      if (!t) return bloqueio('impossivel', 'Isso não é mais seu.');
      if (t.emprestadaA) return bloqueio('incompativel', 'Já está emprestado.');
      if (t.lembranca || t.estado < 8) return bloqueio('incompativel', 'Não funciona mais.');
      if (!p?.vivo || !vin || p.especie) return bloqueio('impossivel', 'Essa pessoa não está na sua vida.');
      if (p.municipioId !== v.moradia.municipioId && !vin.convivio.includes('casa')) return bloqueio('incompativel', `${p.nome} mora longe.`);
      if (coisa(t.coisaId)?.daCasa) return bloqueio('incompativel', 'É da casa: não se empresta.');
      return PERMITIDO;
    }
    case 'pedir_de_volta': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa);
      return t?.emprestadaA ? PERMITIDO : bloqueio('incompativel', 'Não está emprestado.');
    }
    case 'doar': {
      const o = objetoDe(v, op.ref) as (CoisaTida & Colecionavel) | undefined;
      const p = v.pessoas[op.pessoaId];
      if (!o) return bloqueio('impossivel', 'Isso não é mais seu.');
      if (!p?.vivo || !v.vinculos[op.pessoaId] || p.especie) return bloqueio('impossivel', 'Essa pessoa não está na sua vida.');
      if (i < 12) return bloqueio('impossivel', 'A partir dos 12.');
      if (op.ref.tipo === 'colecao' && (o.emprestadaA || o.emprestadaFora)) return bloqueio('incompativel', 'Está num museu.');
      if ((o as unknown as { dono?: string }).dono === 'casal') return bloqueio('incompativel', 'Não é só seu.');
      if (op.ref.tipo === 'estilo' && (o as unknown as ItemDeEstilo).usando) return bloqueio('incompativel', 'Você está usando.');
      return PERMITIDO;
    }
    case 'apelidar': {
      const nome = op.nome.trim();
      if (nome.length > 24) return bloqueio('impossivel', 'Um nome curto (até 24 letras).');
      const existe = op.ref.tipo === 'veiculo' ? veiculos(v).some(b => b.id === op.ref.id) : !!objetoDe(v, op.ref as RefObjeto);
      return existe ? PERMITIDO : bloqueio('impossivel', 'Isso não é mais seu.');
    }
    case 'repaginar': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa);
      if (!t) return bloqueio('impossivel', 'Isso não é mais seu.');
      const vs = variantesDaCoisa(t.coisaId);
      if (!vs[op.variante] || vs.length < 2) return bloqueio('impossivel', 'Não tem outra versão.');
      if (vs[op.variante].cor === t.cor) return bloqueio('incompativel', 'Já é assim.');
      if (t.lembranca) return bloqueio('incompativel', 'Fica como está: é lembrança.');
      return vereditoDePagar(v, custoDeRepaginar(v, t));
    }
    case 'expor': {
      const p = colecao(v).find(x => x.id === op.colecao);
      if (!p) return bloqueio('impossivel', 'Essa peça não é mais sua.');
      if (p.local || p.emprestadaA || p.emprestadaFora) return bloqueio('incompativel', 'Não está em casa.');
      if (casaDaFamilia(v) && op.comodo) return bloqueio('incompativel', 'Na casa da família, a parede é dos adultos — fica no seu quarto, guardada.');
      if (op.comodo && !comodosDaCasa(v).some(x => x.id === op.comodo)) return bloqueio('impossivel', 'Esse cômodo não existe nesta casa.');
      if (!op.comodo && !p.exposta) return bloqueio('incompativel', 'Já está guardada.');
      return PERMITIDO;
    }
    case 'de_familia': return colecao(v).some(x => x.id === op.colecao) ? PERMITIDO : bloqueio('impossivel', 'Essa peça não é mais sua.');
    case 'veiculo_peca': {
      const b = veiculos(v).find(x => x.id === op.bem);
      if (!b) return bloqueio('impossivel', 'Esse veículo não é mais seu.');
      if (i < 18) return bloqueio('impossivel', 'A partir dos 18.');
      if (b.bloqueio) return bloqueio('incompativel', 'Bloqueado pela Justiça.');
      const cat = modeloVeiculo(b.modeloId).categoria;
      const o = opcaoDaPeca(cat, op.peca, op.opcao);
      if (!o) return bloqueio('impossivel', 'Essa peça não existe neste veículo.');
      if ((b.mods?.[op.peca] ?? 'original') === op.opcao) return bloqueio('incompativel', 'Já está assim.');
      if (b.local && b.local !== v.moradia.municipioId) return bloqueio('incompativel', 'Está guardado longe: primeiro, trazer.');
      if (b.problema?.gravidade === 3 && pecasDaCategoria(cat).find(p => p.id === op.peca)?.tipo === 'funcional') return bloqueio('incompativel', 'Parado: primeiro, o conserto.');
      return vereditoDePagar(v, custoDaPeca(v, b, op.peca, op.opcao));
    }
    case 'veiculo_colecao': {
      const b = veiculos(v).find(x => x.id === op.bem);
      if (!b) return bloqueio('impossivel', 'Esse veículo não é mais seu.');
      if (!!b.papel === op.sim) return bloqueio('incompativel', op.sim ? 'Já é de coleção.' : 'Já é de uso.');
      if (op.sim && v.financas.veiculoPrincipal === b.id && veiculos(v).length > 1) return bloqueio('incompativel', 'É o do dia a dia: escolha outro como principal antes.');
      return PERMITIDO;
    }
    case 'veiculo_garagem': {
      const b = veiculos(v).find(x => x.id === op.bem);
      if (!b) return bloqueio('impossivel', 'Esse veículo não é mais seu.');
      const cat = modeloVeiculo(b.modeloId).categoria;
      if (cat === 'embarcacao' || cat === 'aeronave') return bloqueio('impossivel', 'Fica na marina ou no hangar.');
      if ((b.garagem ?? null) === op.imovel) return bloqueio('incompativel', 'Já está lá.');
      if (op.imovel) {
        const im = imovelPorId(v, op.imovel);
        if (!im || im.alugadoPor || im.id === v.moradia.imovelId) return bloqueio('impossivel', 'Essa garagem não é sua para isso.');
        const ocupadas = veiculos(v).filter(x => x.garagem === im.id).length;
        if (ocupadas >= plantaDe(im.modeloId).vagas) return bloqueio('incompativel', 'A garagem de lá está cheia.');
      }
      return PERMITIDO;
    }
    case 'look': {
      if (i < 10) return bloqueio('impossivel', 'A roupa, por enquanto, a família escolhe.');
      const meus = new Set((v.eu.estilo?.itens ?? []).map(x => x.id));
      if (op.itens.some(id => !meus.has(id))) return bloqueio('impossivel', 'Você não tem uma dessas peças.');
      return PERMITIDO;
    }
    case 'cultural': return disponibilidadeCultural(v, op.oque, op.genero, op.pessoaId);
    case 'obra': return disponibilidadeObra(v, op.linguagem);
  }
}

/* ================================================================ custos */

export const custoDeConverter = (v: Vida, tipo: TipoComodo) => arred((modeloComodo(tipo)?.conversao ?? 1500) * c(v));
export const custoDeConstruir = (v: Vida, tipo: TipoComodo) => arred((modeloComodo(tipo)?.obra?.preco ?? 0) * Math.pow(c(v), 1.2));
export const custoDeRepaginar = (v: Vida, t: CoisaTida) => arred(Math.max(150, (coisa(t.coisaId)?.preco ?? 0) * 0.25) * c(v));
export function custoDaPeca(v: Vida, b: Veiculo, peca: string, opcao: string): number {
  const o = opcaoDaPeca(modeloVeiculo(b.modeloId).categoria, peca, opcao);
  if (!o) return 0;
  // Voltar ao original custa a mão de obra (tirar o que se pôs).
  if (o.id === 'original') return arred(Math.max(300, precoNovoLocal(v, b) * 0.008));
  return arred(Math.max(o.piso * c(v), precoNovoLocal(v, b) * o.frac));
}

/** Quartos que ninguém usa (os moradores, dois por quarto, ocupam os outros). */
export function quartosLivres(v: Vida): number {
  const comodos = comodosDaCasa(v);
  const quartos = comodos.filter(x => x.tipo === 'quarto' || x.tipo === 'quarto_extra').length;
  const outros = Object.values(v.vinculos).filter(x => x.convivio.includes('casa') && x.parentesco !== 'pet' && v.pessoas[x.pessoaId]?.vivo);
  // O par divide o seu quarto; os filhos e os outros, um quarto para cada dois.
  const precisam = 1 + Math.ceil(outros.filter(x => !x.romance).length / 2);
  return quartos - precisam;
}

/* ================================================================ executar */

function larParaMexer(v: Vida) {
  const dono = donoDoLar(v)!;
  return (dono.lar ??= { extras: [], acabamentos: {} });
}

export function personalizar(v: Vida, op: OpPersonalizar): string {
  switch (op.o) {
    case 'acabamento': {
      const cm = comodosDaCasa(v).find(x => x.id === op.comodo)!;
      const preco = precoDoAcabamento(v.moradia.modeloId, cm, op.aspecto, op.opcao, c(v));
      pagar(v, preco);
      const lar = larParaMexer(v);
      (lar.acabamentos[op.comodo] ??= {})[op.aspecto] = op.opcao;
      const o = ACABAMENTOS[op.aspecto].opcoes.find(x => x.id === op.opcao)!;
      registrarNoObjeto(lar, v.t, `${cap(cm.nome)}: ${ACABAMENTOS[op.aspecto].nome.toLowerCase()} — ${o.nome} (${fmt(preco)}).`);
      // A obra de piso valoriza o imóvel só um pouco (e nunca mais do que custou).
      const im = imovelDaMoradia(v);
      if (im && op.aspecto === 'piso' && o.nivel >= 3) im.valor = Math.round((im.valor + preco * 0.4) / 1000) * 1000;
      v.mente.felicidade = clamp(v.mente.felicidade + 1);
      const frase = op.aspecto === 'parede' ? `${cap(cm.nome)} pintad${COMODOS[cm.tipo].artigo === 'a' ? 'a' : 'o'} de ${o.nome}` : op.aspecto === 'piso' ? `Piso novo n${COMODOS[cm.tipo].artigo} ${cm.nome}: ${o.nome}` : `Luz nova n${COMODOS[cm.tipo].artigo} ${cm.nome}: ${o.nome}`;
      return `${frase}. ${fmt(preco)}, entre material e mão de obra.${op.aspecto === 'piso' ? ' Uma semana de pó.' : ''}`;
    }
    case 'converter': {
      const cm = comodosDaCasa(v).find(x => x.id === op.comodo)!;
      const preco = custoDeConverter(v, op.tipo);
      pagar(v, preco);
      const lar = larParaMexer(v);
      lar.extras = lar.extras.filter(x => !(x.id === op.comodo && x.de === 'conversao'));
      if (op.tipo !== 'quarto_extra' || cm.de === 'obra') lar.extras.push({ id: op.comodo, tipo: op.tipo, de: 'conversao', t: v.t });
      const alvo = COMODOS[op.tipo];
      registrarNoObjeto(lar, v.t, `${cap(cm.nome)} virou ${alvo.artigo} ${alvo.nome} (${fmt(preco)}).`);
      if (op.tipo === 'estudio' || op.tipo === 'atelie' || op.tipo === 'biblioteca') escrever(v, { texto: `Transformou um quarto de casa em ${alvo.nome}.`, relevancia: 'cotidiano', tema: 'casa', escolha: true });
      return op.tipo === 'quarto_extra' ? `Voltou a ser quarto (${fmt(preco)}).` : `${cap(cm.nome)} virou ${alvo.artigo} ${alvo.nome}: ${alvo.descricao.charAt(0).toLowerCase()}${alvo.descricao.slice(1)} (${fmt(preco)}).`;
    }
    case 'construir': {
      const m = COMODOS[op.tipo];
      const preco = custoDeConstruir(v, op.tipo);
      pagar(v, preco);
      const lar = larParaMexer(v);
      const id = `${op.tipo}_${v.t}`;
      lar.extras.push({ id, tipo: op.tipo, de: 'obra', t: v.t });
      registrarNoObjeto(lar, v.t, `Construiu ${m.artigo} ${m.nome} (${fmt(preco)}).`);
      const im = imovelDaMoradia(v)!;
      // A obra entra no valor do imóvel pela metade (o mercado paga menos do que custou o gosto do dono).
      im.valor = Math.round((im.valor + preco * 0.55) / 1000) * 1000;
      (im.historia ??= []).push({ t: v.t, texto: `Obra: ${m.nome} (${fmt(preco)}).` });
      escrever(v, { texto: `Construiu ${m.artigo} ${m.nome} em casa: meses de obra, ${fmt(preco)}.`, relevancia: 'biografia', tema: 'casa', escolha: true });
      return `${cap(m.artigo)} ${m.nome} ficou pront${m.artigo}: ${fmt(preco)} e alguns meses de obra.${m.manutencao ? ` Manter custa uns ${fmt(arred(m.manutencao * c(v)))} por mês.` : ''}`;
    }
    case 'por_no_comodo': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa)!;
      const cm = comodosDaCasa(v).find(x => x.id === op.comodo)!;
      t.comodo = op.comodo;
      return `${cap(coisa(t.coisaId)?.nome ?? 'isso')} agora fica n${COMODOS[cm.tipo].artigo} ${cm.nome}.`;
    }
    case 'mover': {
      const o = objetoDe(v, op.ref) as { local?: string; historia?: { t: number; texto: string }[]; comodo?: string; exposta?: boolean };
      const de = o.local;
      const frete = freteDe(v, op.ref, de, op.para ?? undefined);
      if (frete) pagar(v, frete);
      o.local = op.para ?? undefined;
      o.comodo = undefined;
      if ('exposta' in o) o.exposta = undefined;
      registrarNoObjeto(o, v.t, `Agora ${nomeDoLocal(v, o.local)} (antes, ${nomeDoLocal(v, de)})${frete ? `; ${fmt(frete)} de frete` : ''}.`);
      return `${cap(nomeDoObjeto(v, op.ref))}: agora ${nomeDoLocal(v, o.local)}${frete ? `. ${fmt(frete)} de frete` : ''}.`;
    }
    case 'emprestar': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa)!;
      const p = v.pessoas[op.pessoaId];
      t.emprestadaA = p.id;
      registrarNoObjeto(t, v.t, `Emprestado a ${p.nome}.`);
      const vin = v.vinculos[p.id];
      vin.proximidade = clamp(vin.proximidade + 2);
      vin.confianca = clamp(vin.confianca + 1);
      vin.tUltimoContato = v.t;
      return `${cap(nomeDoObjeto(v, { tipo: 'coisa', id: t.id }))} está com ${p.nome} agora. Segue seu — é só pedir de volta.`;
    }
    case 'pedir_de_volta': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa)!;
      const p = v.pessoas[t.emprestadaA!];
      t.emprestadaA = undefined;
      registrarNoObjeto(t, v.t, `Voltou${p ? ` das mãos de ${p.nome}` : ''}.`);
      return `${cap(nomeDoObjeto(v, { tipo: 'coisa', id: t.id }))} voltou para casa${p ? `. ${p.nome} agradeceu` : ''}.`;
    }
    case 'doar': return doar(v, op.ref, op.pessoaId);
    case 'apelidar': {
      const nome = op.nome.trim().replace(/[<>"]/g, '');
      if (op.ref.tipo === 'veiculo') { const b = veiculos(v).find(x => x.id === op.ref.id)!; b.apelido = nome || undefined; return nome ? `${cap(textoVeiculo(b))} agora tem nome: "${nome}".` : 'Sem nome, de novo.'; }
      const o = objetoDe(v, op.ref as RefObjeto) as { apelido?: string };
      o.apelido = nome || undefined;
      return nome ? `Agora tem nome: "${nome}".` : 'Sem nome, de novo.';
    }
    case 'repaginar': {
      const t = coisasDaVida(v).find(x => x.id === op.coisa)!;
      const preco = custoDeRepaginar(v, t);
      pagar(v, preco);
      const x = variantesDaCoisa(t.coisaId)[op.variante];
      const antes = t.acabamento;
      t.cor = x.cor; t.acabamento = x.nome;
      registrarNoObjeto(t, v.t, `Repaginado: de ${antes ?? 'como veio'} para ${x.nome} (${fmt(preco)}).`);
      const c0 = coisa(t.coisaId);
      return `${cap(c0?.nome ?? 'isso')} repaginad${c0?.artigo === 'a' || c0?.artigo === 'as' ? 'a' : 'o'}: agora ${x.nome} (${fmt(preco)}).`;
    }
    case 'expor': {
      const p = colecao(v).find(x => x.id === op.colecao)!;
      p.exposta = !!op.comodo || undefined;
      p.comodo = op.comodo ?? undefined;
      if (op.comodo) { const cm = comodosDaCasa(v).find(x => x.id === op.comodo); registrarNoObjeto(p, v.t, `Exposta n${cm ? COMODOS[cm.tipo].artigo : 'a'} ${cm?.nome ?? 'casa'}.`); }
      return op.comodo ? `${p.nome}: à vista, ${(() => { const cm = comodosDaCasa(v).find(x => x.id === op.comodo); return cm ? `n${COMODOS[cm.tipo].artigo} ${cm.nome}` : 'em casa'; })()}.` : `${p.nome}: guardada.`;
    }
    case 'de_familia': {
      const p = colecao(v).find(x => x.id === op.colecao)!;
      p.deFamilia = op.sim || undefined;
      if (op.sim) registrarNoObjeto(p, v.t, 'Marcada para ficar na família.');
      return op.sim ? `${p.nome} fica na família: na herança, não vai a leilão — passa a quem herdar, com a história dela.` : `${p.nome} volta a ser uma peça como as outras.`;
    }
    case 'veiculo_peca': {
      const b = veiculos(v).find(x => x.id === op.bem)!;
      const cat = modeloVeiculo(b.modeloId).categoria;
      const preco = custoDaPeca(v, b, op.peca, op.opcao);
      pagar(v, preco);
      const peca = pecasDaCategoria(cat).find(p => p.id === op.peca)!;
      const o = opcaoDaPeca(cat, op.peca, op.opcao)!;
      b.mods ??= {};
      // A cor de fábrica fica guardada na primeira pintura (é para ela que se volta).
      if (o.cor && !b.mods._fabrica) b.mods._fabrica = `${b.cor ?? ''}|${b.corNome ?? ''}`;
      if (o.cor) { b.cor = o.cor; b.corNome = o.nome.replace(/ \(.*\)$/, ''); }
      if (op.peca === 'pintura' && o.id === 'original' && b.mods._fabrica) { const [cor, nome] = b.mods._fabrica.split('|'); b.cor = cor || undefined; b.corNome = nome || undefined; }
      if (o.id === 'original') delete b.mods[op.peca]; else b.mods[op.peca] = o.id;
      if (!Object.keys(b.mods).some(k => k !== '_fabrica')) { const fab = b.mods._fabrica; b.mods = fab && op.peca !== 'pintura' ? { _fabrica: fab } : undefined; }
      (b.historia ??= []).push({ t: v.t, texto: `${peca.nome}: ${o.nome} (${fmt(preco)}).` });
      b.valor = Math.round(b.valor / 100) * 100;
      if (peca.tipo === 'estetica') v.mente.felicidade = clamp(v.mente.felicidade + 1);
      const efeito = peca.tipo === 'funcional'
        ? (o.fragilidade ?? 1) > 1 ? ' Anda mais — e vai pedir oficina mais vezes.' : (o.fragilidade ?? 1) < 1 ? ' Menos chance de deixar você na mão.' : ''
        : (o.valor ?? 1) < 1 ? ' Na revenda, gosto de dono vale pouco.' : '';
      return `${cap(textoVeiculo(b))}: ${peca.nome.toLowerCase()} — ${o.nome} (${fmt(preco)}).${efeito}`;
    }
    case 'veiculo_colecao': {
      const b = veiculos(v).find(x => x.id === op.bem)!;
      b.papel = op.sim ? 'colecao' : undefined;
      // De coleção: roda pouco (parado, sem o seguro de uso), na garagem coberta — gasta devagar.
      b.parado = op.sim ? true : b.parado;
      (b.historia ??= []).push({ t: v.t, texto: op.sim ? 'Passou a ser de coleção: sai pouco, só aos domingos.' : 'Voltou ao uso.' });
      if (!op.sim) b.parado = false;
      return op.sim ? `${cap(textoVeiculo(b))} vira peça de coleção: na garagem, coberto, saindo pouco.` : `${cap(textoVeiculo(b))} voltou para o uso.`;
    }
    case 'veiculo_garagem': {
      const b = veiculos(v).find(x => x.id === op.bem)!;
      b.garagem = op.imovel ?? undefined;
      const im = op.imovel ? imovelPorId(v, op.imovel) : undefined;
      if (im) b.parado = true;
      (b.historia ??= []).push({ t: v.t, texto: im ? `Guardado na garagem ${modeloMoradia(im.modeloId).casa ? 'da' : 'do'} ${im.nome}.` : 'Voltou para a garagem de casa.' });
      return im ? `${cap(textoVeiculo(b))} fica guardado ${nomeDoLocal(v, `im:${im.id}`)}.` : `${cap(textoVeiculo(b))} volta para a garagem de casa.`;
    }
    case 'look': {
      const e = (v.eu.estilo ??= { itens: [] });
      (e.looks ??= {})[op.ocasiao] = op.itens;
      if (!op.itens.length) delete e.looks[op.ocasiao];
      return op.itens.length ? 'Separado: é isso que vai.' : 'Sem roupa separada: vai a de todo dia.';
    }
    case 'cultural': return fazerCultural(v, op.oque, op.genero, op.pessoaId);
    case 'obra': return produzirObra(v, op.linguagem);
  }
}

/** Dar um objeto seu a alguém: sai da sua vida, entra na dela (e na lembrança das duas). */
function doar(v: Vida, ref: RefObjeto, pessoaId: string): string {
  const p = v.pessoas[pessoaId];
  const vin = v.vinculos[pessoaId];
  const o = objetoDe(v, ref)!;
  const nome = nomeDoObjeto(v, ref);
  const afeto = afetoDe(v, o as CoisaTida);
  if (ref.tipo === 'coisa') {
    const t = o as CoisaTida;
    v.financas.coisas = coisasDaVida(v).filter(x => x !== t);
    (p.ganhou ??= []).push({ coisaId: t.coisaId, t: v.t, cor: t.cor ?? '', acabamento: t.acabamento ?? '' });
  } else if (ref.tipo === 'colecao') {
    v.financas.colecao = colecao(v).filter(x => x !== o);
  } else {
    v.eu.estilo!.itens = v.eu.estilo!.itens.filter(x => x !== o);
  }
  // O que tinha história pesa mais (para os dois lados).
  const ganho = afeto >= 45 ? 7 : 4;
  vin.proximidade = clamp(vin.proximidade + ganho);
  vin.tUltimoContato = v.t;
  lembrarCom(v, p.id, `Ganhou de você ${nome}${afeto >= 45 ? ', que tinha história' : ''}.`, afeto >= 45 ? 'apoio' : 'ritual', afeto >= 45 ? 2 : 1);
  if (afeto >= 45 || ref.tipo === 'colecao') escrever(v, { texto: `Deu ${nome} para ${p.nome}.`, relevancia: 'cotidiano', tema: 'familia', escolha: true, pessoas: [p.id] });
  return afeto >= 45 ? `${p.nome} entendeu o que estava recebendo. Guardou com cuidado.` : `${p.nome} recebeu ${nome}. Agradeceu do jeito ${vin.parentesco ? 'da família' : 'de quem gosta de você'}.`;
}

/* ================================================================ o mês e o ano */

/** Os custos do mês do que é personalizado: depósito, cofre, vaga alugada, o que se construiu e o acabamento caro. */
export function custosDaPersonalizacao(v: Vida): { rotulo: string; valor: number }[] {
  const out: { rotulo: string; valor: number }[] = [];
  const lugares = new Map<string, { grandes: number; itens: number }>();
  const conta = (local: string | undefined, gr: boolean) => { if (!local || local.startsWith('im:')) return; const x = lugares.get(local) ?? { grandes: 0, itens: 0 }; x.itens++; if (gr) x.grandes++; lugares.set(local, x); };
  for (const t of coisasDaVida(v)) conta(t.local, COISAS_GRANDES.has(t.coisaId));
  for (const p of colecao(v)) conta(p.local, false);
  for (const x of v.eu.estilo?.itens ?? []) conta(x.local, false);
  for (const [local, x] of lugares) {
    const [tipo, cidade] = local.split(':');
    const k = c(v, cidade);
    if (tipo === 'dep') out.push({ rotulo: `Depósito alugado${cidade !== v.moradia.municipioId ? ` (${nomeLugar(cidade)})` : ''}`, valor: arred((DEPOSITO.base + DEPOSITO.porGrande * x.grandes) * k) });
    else if (tipo === 'cofre') out.push({ rotulo: 'Cofre do banco', valor: arred(COFRE_ANUAL * k / 12) });
  }
  // A garagem: o que não cabe nas vagas de casa paga vaga fora (barco e avião já pagam marina e hangar).
  if (!casaDaFamilia(v)) {
    const naCasa = veiculos(v).filter(b => !b.garagem && (!b.local || b.local === v.moradia.municipioId) && ['carro', 'moto'].includes(modeloVeiculo(b.modeloId).categoria));
    const sobra = naCasa.length - plantaDaCasa(v).vagas;
    if (sobra > 0) out.push({ rotulo: `Vaga alugada para ${sobra === 1 ? 'um veículo' : `${sobra} veículos`} (não cabe${sobra === 1 ? '' : 'm'} na garagem)`, valor: arred(VAGA_MENSAL * sobra * c(v)) });
  }
  const daCasa = donoDoLar(v)?.lar;
  const x = custoMensalDoLar(v.moradia.modeloId, daCasa, c(v));
  if (x) out.push({ rotulo: 'Cuidados do que se acrescentou à casa (piscina, jardim, acabamentos)', valor: x });
  for (const b of v.financas.bens) if (b.tipo === 'imovel' && b.id !== v.moradia.imovelId && b.lar) {
    const y = custoMensalDoLar(b.modeloId, b.lar, c(v, b.municipioId));
    if (y) out.push({ rotulo: `Cuidados ${modeloMoradia(b.modeloId).casa ? 'da' : 'do'} ${b.nome}`, valor: y });
  }
  return out;
}
PATRIMONIO_NO_MES.push(v => custosDaPersonalizacao(v));

/**
 * Os lugares voltam a fazer sentido: o que estava num imóvel que deixou de ser seu (vendido, perdido na partilha) volta
 * para casa; o que está no imóvel onde agora se mora está em casa; o emprestado a quem morreu volta. Um objeto nunca
 * fica em dois lugares (o campo é um só) e nunca some (o lugar inválido vira "em casa", com a linha na história).
 */
export function normalizarLocais(v: Vida): void {
  const meus = new Set(v.financas.bens.filter(b => b.tipo === 'imovel').map(b => b.id));
  const arrumar = (o: { local?: string; historia?: { t: number; texto: string }[]; emprestadaA?: string }, vivo = true) => {
    if (o.local?.startsWith('im:')) {
      const id = o.local.slice(3);
      if (id === v.moradia.imovelId) o.local = undefined;
      else if (!meus.has(id)) { o.local = undefined; registrarNoObjeto(o, v.t, 'Voltou para casa: o imóvel onde estava deixou de ser seu.'); }
    }
    if (vivo && o.emprestadaA) {
      const p = v.pessoas[o.emprestadaA];
      if (!p || !p.vivo) { registrarNoObjeto(o, v.t, `Voltou para casa${p ? ` depois que ${p.nome} se foi` : ''}.`); o.emprestadaA = undefined; }
    }
  };
  for (const t of coisasDaVida(v)) arrumar(t);
  for (const p of colecao(v)) arrumar(p, false);
  for (const x of v.eu.estilo?.itens ?? []) arrumar(x);
  for (const b of veiculos(v)) if (b.garagem && (!meus.has(b.garagem) || b.garagem === v.moradia.imovelId)) b.garagem = undefined;
  // Nenhum objeto em dobro (um save que, por algum caminho antigo, tenha o mesmo id duas vezes).
  if (v.financas.coisas) v.financas.coisas = semRepetidos(v.financas.coisas);
  if (v.financas.colecao) v.financas.colecao = semRepetidos(v.financas.colecao);
  if (v.eu.estilo) v.eu.estilo.itens = semRepetidos(v.eu.estilo.itens);
  // Os looks só guardam peças que ainda são suas.
  const looks = v.eu.estilo?.looks;
  if (looks) { const ids = new Set(v.eu.estilo!.itens.map(x => x.id)); for (const k of Object.keys(looks) as Ocasiao[]) { looks[k] = looks[k]!.filter(id => ids.has(id)); if (!looks[k]!.length) delete looks[k]; } }
}
const semRepetidos = <T extends { id: string }>(lista: T[]): T[] => { const vistos = new Set<string>(); return lista.filter(x => (vistos.has(x.id) ? false : (vistos.add(x.id), true))); };

/** O ano do que é pessoal: os lugares, a casa (o conforto), o gosto, as fases do estilo. */
export function processarPersonalizacao(v: Vida): void {
  normalizarLocais(v);
  const e = efeitoDoAnoEmCasa(v);
  if (e.felicidade) v.mente.felicidade = clamp(v.mente.felicidade + e.felicidade);
  if (e.estresse) v.mente.estresse = clamp(v.mente.estresse + e.estresse);
  processarGostos(v);
  // O estilo muda de cara (o skate dos 16, o social dos 30): uma fase nova fica na história — mudar é possível, nunca obrigatório.
  const est = v.eu.estilo;
  if (est && idade(v) >= 13) {
    const agora = estiloDominante(est.itens.filter(x => x.usando));
    const ultima = est.fases?.[est.fases.length - 1]?.estilo;
    if (agora && agora !== ultima) {
      (est.fases ??= []).push({ t: v.t, estilo: agora });
      if (est.fases.length > 10) est.fases.splice(0, est.fases.length - 10);
      if (ultima) escrever(v, { texto: `O jeito de se vestir mudou: do ${nomeDoEstilo(ultima).toLowerCase()} para o ${nomeDoEstilo(agora).toLowerCase()}.`, relevancia: 'cotidiano', tema: 'lazer' });
    }
  }
}

/** Em palavras: o que a casa tem e o que dá para fazer nela (para a tela, sem regra nova). */
export function leituraDaPlanta(v: Vida): { tipo: string; comodos: number; terreno: number; vagas: number; poder: ReturnType<typeof poderSobreACasa>; quartosLivres: number } {
  const lar = donoDoLar(v)?.lar;
  return { tipo: modeloMoradia(v.moradia.modeloId ?? 'apto_2q').nome, comodos: comodosDe(v.moradia.modeloId, lar).length, terreno: terrenoLivre(v.moradia.modeloId, lar), vagas: plantaDaCasa(v).vagas, poder: poderSobreACasa(v), quartosLivres: Math.max(0, quartosLivres(v)) };
}

export { areaDoComodo };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
