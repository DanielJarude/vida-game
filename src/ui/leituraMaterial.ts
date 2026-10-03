/**
 * Vida material em palavras: onde mora, com quem, de quem é, como está o mês,
 * o que tem e o que deve. A tela lê daqui (e os testes também): nenhum
 * número da interface é calculado fora do motor.
 */

import { variantesDeVeiculo } from '../motor/dados/pertences';
import { formatarDinheiroCheio, formatarDinheiroCurto } from '../motor/mundo/moeda';
import type { Especie } from '../motor/tipos';
import type { Bem, Imovel, LinhaRazao, Veiculo, Vida } from '../motor/tipos';
import { idade, idadePessoa, moraCom } from '../motor/nucleo';
import { listaNatural, flex } from '../motor/texto';
import { formaDaVersao, modeloMoradia, modeloVeiculo, versaoVeiculo, type FormaVeiculo } from '../motor/dados/bens';
import { municipio, nomeLugar, rotuloPerfil } from '../motor/dados/lugares';
import { mesesRestantes, orcamento, seguranca, type NivelSeguranca, type Orcamento } from '../motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../motor/sistemas/domicilio';
import { petsDaCasa, estadoDoPet } from '../motor/sistemas/pets';
import { estadoDoVeiculo, anosDoVeiculo, nomeDoVeiculo, versaoDoVeiculo } from '../motor/sistemas/veiculos';
import { casaApertada } from '../motor/sistemas/imoveis';
import { anoDe } from '../motor/tempo';

/** Na moeda do país onde a vida está (`motor/mundo/moeda`). */
export const dinheiroCheio = (v: number) => formatarDinheiroCheio(v);
export const dinheiroCurto = (v: number) => formatarDinheiroCurto(v, undefined, 'auto');

/* --------------------------------------------------------------- Moradia */

/**
 * A silhueta do lar no desenho: um tipo para cada modelo de moradia
 * (`dados/bens`), mais os arranjos sem modelo — a casa da família, a casa de
 * parentes, o quarto de favor e a moradia funcional (vila, alojamento).
 */
export type FormaDaCasa =
  | 'republica' | 'kitnet' | 'apto_1q' | 'apto_2q' | 'apto_3q' | 'alto_padrao'
  | 'casa_simples' | 'casa_2q' | 'casa_3q' | 'casa_grande' | 'sitio'
  | 'familia' | 'parente' | 'favor' | 'funcional';

/** Como a casa está — só se sabe de verdade do imóvel próprio. */
export interface CondicaoDoLar {
  /** boa · gasta (mancha de umidade) · ruim (rachadura) · problema (reparo pendente: andaime). */
  nivel: 'boa' | 'gasta' | 'ruim' | 'problema';
  /** Conservação 0..100 do imóvel próprio (ausente em casa alugada ou de outros). */
  estado?: number;
  /** O reparo pendente, em palavras. */
  problema?: string;
  /** Reforma ou reparo grande nos últimos 12 meses (pintura nova). */
  reformaRecente: boolean;
}

export interface LeituraLar {
  forma: FormaDaCasa;
  /** Modelo de moradia (`dados/bens`), quando há. */
  modeloId?: string;
  /** 1 (precária) .. 5 (muito boa). */
  padrao: number;
  rural: boolean;
  /** Moradia funcional (vila militar, alojamento). */
  funcional: boolean;
  condicao: CondicaoDoLar;
  /** "Recife, capital do Nordeste". */
  onde: string;
  /** A frase principal: onde, como, com quem. */
  frase: string;
  /** Selos curtos: de quem é, quanto custa, o que falta. */
  selos: { texto: string; tom?: 'ruim' | 'atencao' }[];
  moradores: { id: string; nome: string }[];
  bichos: { id: string; nome: string; especie: Especie }[];
  veiculo?: 'carro' | 'moto' | 'bicicleta';
  /** A forma do veículo na porta (o desenho): hatch, picape, scooter, mountain bike. */
  formaVeiculo?: FormaVeiculo;
  janelasAcesas: number;
}

const FORMAS_DE_MODELO: readonly FormaDaCasa[] = ['republica', 'kitnet', 'apto_1q', 'apto_2q', 'apto_3q', 'alto_padrao', 'casa_simples', 'casa_2q', 'casa_3q', 'casa_grande', 'sitio'];
const formaDoModelo = (id: string): FormaDaCasa => (FORMAS_DE_MODELO as readonly string[]).includes(id) ? id as FormaDaCasa : 'apto_2q';

/** Só lê: o estado do imóvel próprio onde se mora (o motor é quem o muda). */
function condicaoDoLar(v: Vida): CondicaoDoLar {
  const m = v.moradia;
  const im = m.tipo === 'propria' ? v.financas.bens.find((x): x is Imovel => x.tipo === 'imovel' && x.id === m.imovelId) : undefined;
  if (!im) return { nivel: 'boa', reformaRecente: false };
  const reformaRecente = im.tManutencao !== undefined && v.t - im.tManutencao <= 12;
  const nivel: CondicaoDoLar['nivel'] = im.problema ? 'problema' : im.estado < 40 ? 'ruim' : im.estado < 65 && !reformaRecente ? 'gasta' : 'boa';
  return { nivel, estado: im.estado, problema: im.problema?.texto, reformaRecente };
}

const artigo = (nome: string) => (nome.startsWith('casa') || nome.startsWith('kitnet') ? 'uma' : 'um');

export function leituraDoLar(v: Vida): LeituraLar {
  const m = v.moradia;
  const mun = municipio(m.municipioId);
  const modelo = m.modeloId ? modeloMoradia(m.modeloId) : undefined;
  const junto = moraCom(v);
  const nomes = junto.map(p => {
    const vin = v.vinculos[p.id];
    if (vin.parentesco === 'mae') return 'a mãe';
    if (vin.parentesco === 'pai') return 'o pai';
    if (vin.parentesco === 'avo') return flex(p.genero, 'o avô', 'a avó');
    if (vin.parentesco === 'irmao' || vin.parentesco === 'meio_irmao') return p.nome;
    return p.nome;
  });
  const bichos = petsDaCasa(v).map(p => ({ id: p.id, nome: p.nome, especie: p.especie! }));
  const comQuem = nomes.length ? ` com ${listaNatural(nomes.slice(0, 4))}${nomes.length > 4 ? ' e mais gente' : ''}` : '';
  const bichoTxt = bichos.length ? `${nomes.length ? ' — e' : ', com'} ${listaNatural(bichos.map(b => b.nome))}` : '';
  const eu = v.eu.tratamento ?? v.eu.genero;
  let forma: FormaDaCasa = 'apto_2q';
  let frase: string;
  const selos: LeituraLar['selos'] = [];
  if (m.tipo === 'pais' || m.tipo === 'parente') {
    forma = m.tipo === 'pais' ? 'familia' : 'parente';
    const i = idade(v);
    frase = `Mora na casa da família${comQuem}${bichoTxt}.`;
    selos.push({ texto: i < 18 ? 'A casa é dos adultos' : 'Casa da família' });
    if (i >= 18) selos.push({ texto: v.trabalho.atual ? 'Ajuda nas contas' : 'Sem pagar aluguel' });
  } else if (m.tipo === 'cedida') {
    forma = m.funcional ? 'funcional' : 'favor';
    frase = `Mora de favor${comQuem ? `, na casa de conhecidos` : ''}${bichoTxt}.`;
    selos.push({ texto: 'De favor', tom: 'atencao' });
  } else {
    const nome = modelo?.nome ?? 'casa';
    forma = modelo ? formaDoModelo(modelo.id) : m.tipo === 'republica' ? 'republica' : 'apto_2q';
    const bairro = m.bairro ? ` ${m.bairro}` : '';
    if (m.tipo === 'republica') frase = `Mora numa república${bairro}, dividindo a casa com outros estudantes e trabalhadores${bichoTxt}.`;
    else if (m.tipo === 'propria') frase = `Mora n${artigo(nome) === 'uma' ? 'uma' : 'um'} ${nome}${bairro}${comQuem ? `,${comQuem}` : `, sozinh${flex(eu, 'o', 'a', 'e')}`}${bichoTxt}.`;
    else frase = `Mora de aluguel n${artigo(nome) === 'uma' ? 'uma' : 'um'} ${nome}${bairro}${comQuem ? `,${comQuem}` : m.divide ? ', dividindo com um amigo' : `, sozinh${flex(eu, 'o', 'a', 'e')}`}${bichoTxt}.`;
    if (m.tipo === 'aluguel' || m.tipo === 'republica') {
      selos.push({ texto: `Alugado · ${dinheiroCurto(m.divide ? m.aluguel / 2 : m.aluguel)} por mês${m.divide ? ' (sua parte)' : ''}` });
      if ((m.atraso ?? 0) > 0) selos.push({ texto: `Aluguel atrasado: ${Math.ceil(m.atraso!)} ${Math.ceil(m.atraso!) === 1 ? 'mês' : 'meses'}`, tom: 'ruim' });
    }
    if (m.tipo === 'propria') {
      const im = v.financas.bens.find(x => x.id === m.imovelId) as Imovel | undefined;
      const d = im ? v.financas.dividas.find(x => x.bemId === im.id) : undefined;
      selos.push({ texto: d ? `Financiado · faltam ${Math.ceil(mesesRestantes(v, d) / 12)} anos` : im?.herdado ? 'Herdado · é seu' : im?.dono === 'casal' ? 'Próprio · de vocês' : 'Próprio · quitado' });
      if (d && (d.atraso ?? 0) > 0) selos.push({ texto: `Parcelas atrasadas: ${Math.ceil(d.atraso!)}`, tom: 'ruim' });
      if (im?.problema) selos.push({ texto: `Pedindo reparo: ${im.problema.texto}`, tom: 'atencao' });
    }
    if (m.aceitaPet === false && (m.tipo === 'aluguel' || m.tipo === 'republica')) selos.push({ texto: 'Não aceita animais' });
  }
  const apertada = casaApertada(v);
  if (apertada) selos.push({ texto: apertada.charAt(0).toUpperCase() + apertada.slice(1), tom: 'atencao' });
  // O veículo na porta: o de terra mais valioso (o barco fica na marina; o avião, no hangar).
  const vei = v.financas.bens.filter((x): x is Veiculo => x.tipo === 'veiculo' && ['carro', 'moto', 'bicicleta'].includes(modeloVeiculo(x.modeloId).categoria)).sort((a, c) => c.valor - a.valor)[0];
  const cat = vei ? (modeloVeiculo(vei.modeloId).categoria as 'carro' | 'moto' | 'bicicleta') : undefined;
  return {
    forma,
    modeloId: modelo?.id,
    padrao: m.padrao,
    rural: !!modelo?.rural,
    funcional: !!m.funcional,
    condicao: condicaoDoLar(v),
    onde: `${nomeLugar(mun.id)} · ${rotuloPerfil(mun.perfil)}`,
    frase,
    selos,
    moradores: junto.map(p => ({ id: p.id, nome: p.nome })),
    bichos,
    veiculo: cat,
    formaVeiculo: vei ? formaDaVersao(versaoVeiculo(vei.versaoId), vei.modeloId) : undefined,
    janelasAcesas: 1 + junto.length
  };
}

/* ------------------------------------------------------------------ Mês */

export const ROTULO_GRUPO: Record<LinhaRazao['grupo'], string> = {
  renda: 'Entradas', moradia: 'Moradia', casa: 'Mercado e contas', filhos: 'Filhos', transporte: 'Transporte', saude: 'Saúde',
  educacao: 'Estudo', dividas: 'Parcelas e dívidas', lazer: 'Lazer e extras', animais: 'Animais', outros: 'Outros compromissos'
};

export const ROTULO_ORIGEM: Record<NonNullable<LinhaRazao['de']>, string> = {
  eu: 'Seu trabalho', parceria: 'Da parceria', familia: 'Da família', patrimonio: 'Do que você tem', governo: 'Benefício'
};

export interface LeituraMes {
  orcamento: Orcamento;
  entradas: { origem: string; valor: number; linhas: LinhaRazao[] }[];
  saidas: { grupo: LinhaRazao['grupo']; rotulo: string; valor: number; linhas: LinhaRazao[] }[];
  sobra: number;
  /** Frase humana sobre o mês. */
  frase: string;
  dependente: boolean;
  /** Na casa da família: como é o dinheiro de lá (não é seu). */
  casa?: { texto: string; folga: 'apertada' | 'justa' | 'confortavel' | 'folgada' };
}

export function leituraDoMes(v: Vida): LeituraMes {
  const o = orcamento(v);
  const porOrigem = new Map<string, LinhaRazao[]>();
  for (const l of o.entradas) {
    const k = ROTULO_ORIGEM[l.de ?? 'eu'];
    porOrigem.set(k, [...(porOrigem.get(k) ?? []), l]);
  }
  const entradas = [...porOrigem.entries()].map(([origem, linhas]) => ({ origem, linhas, valor: linhas.reduce((s, l) => s + l.valor, 0) })).sort((a, b) => b.valor - a.valor);
  const porGrupo = new Map<LinhaRazao['grupo'], LinhaRazao[]>();
  for (const l of o.saidas) porGrupo.set(l.grupo, [...(porGrupo.get(l.grupo) ?? []), l]);
  const saidas = [...porGrupo.entries()].map(([grupo, linhas]) => ({ grupo, rotulo: ROTULO_GRUPO[grupo], linhas, valor: -linhas.reduce((s, l) => s + l.valor, 0) })).sort((a, b) => b.valor - a.valor);
  const i = idade(v);
  const dependente = o.arranjo === 'familia' && i < 18;
  const maior = saidas[0];
  let frase: string;
  if (dependente) frase = o.renda > 0 ? `O dinheiro que é seu: ${dinheiroCurto(o.renda)} por mês${o.entradas.some(l => l.rotulo === 'Mesada') ? ', quase todo em lanche e saída' : ''}.` : 'Dinheiro seu, ainda não há. Quem sustenta a casa são os adultos.';
  else if (o.renda <= 0 && o.despesa <= 0) frase = 'Nada entra e nada sai: por enquanto, as contas são da família.';
  else if (o.sobra >= 0) frase = `Entra ${dinheiroCurto(o.renda)}, sai ${dinheiroCurto(o.despesa)}${maior ? ` — o que mais pesa é ${maior.rotulo.toLowerCase()}` : ''}. Sobram ${dinheiroCurto(o.sobra)} por mês.`;
  else frase = `Entra ${dinheiroCurto(o.renda)}, sai ${dinheiroCurto(o.despesa)}. Faltam ${dinheiroCurto(-o.sobra)} por mês${maior ? `, e ${maior.rotulo.toLowerCase()} é o que mais pesa` : ''}.`;
  let casa: LeituraMes['casa'];
  if (o.daCasa && moraComFamiliaDeOrigem(v)) {
    const pp = o.daCasa.porPessoa;
    const folga = pp < 700 ? 'apertada' : pp < 1600 ? 'justa' : pp < 4000 ? 'confortavel' : 'folgada';
    const quem = o.daCasa.quem.map(p => {
      const par = v.vinculos[p.id]?.parentesco;
      return par === 'mae' ? 'da sua mãe' : par === 'pai' ? 'do seu pai' : par === 'avo' ? flex(p.genero, 'do seu avô', 'da sua avó') : `de ${p.nome}`;
    });
    casa = {
      folga,
      texto: o.daCasa.renda > 0
        ? `A casa vive da renda ${listaNatural(quem)}: uns ${dinheiroCurto(o.daCasa.renda)} por mês para ${moraCom(v).length + 1} pessoas. ${folga === 'apertada' ? 'É apertado.' : folga === 'justa' ? 'Dá, contado.' : folga === 'confortavel' ? 'Dá com alguma folga.' : 'Sobra.'}`
        : 'Ninguém da casa tem renda agora. O dinheiro é o que a família consegue.'
    };
  }
  return { orcamento: o, entradas, saidas, sobra: o.sobra, frase, dependente, casa };
}

/* ------------------------------------------------------- O ano, real por real */

export interface LeituraDoExtrato {
  ano: number;
  /** Na conta: como começou e como terminou o ano fechado. */
  inicio: number;
  fim: number;
  /** O que mexeu na conta, agrupado (positivo entra, negativo sai), na ordem de leitura. */
  conta: { rotulo: string; valor: number; linhas: { rotulo: string; valor: number }[] }[];
  /** As aplicações no mesmo ano: começo, fim e o que as moveu. */
  aplicacoes?: { inicio: number; fim: number; rendeu: number; posto: number; tirado: number; outros: number };
  /** O que mudou na conta DEPOIS do fechamento (acontecimentos e escolhas deste ano, ainda em aberto). */
  depois: number;
}

const GRUPOS_EXTRATO: { rotulo: string; tipos: string[] }[] = [
  { rotulo: 'Entrou: trabalho, rendas e o que a casa divide', tipos: ['renda'] },
  { rotulo: 'Da família', tipos: ['familia'] },
  { rotulo: 'Saiu: as despesas do mês, vezes doze', tipos: ['despesa'] },
  { rotulo: 'Dívidas: parcelas, atrasados, cartão', tipos: ['divida'] },
  { rotulo: 'Rendimentos (e a inflação no dinheiro parado)', tipos: ['rendimento'] },
  { rotulo: 'Posto nas aplicações', tipos: ['aporte'] },
  { rotulo: 'Tirado das aplicações', tipos: ['resgate'] },
  { rotulo: 'Acontecimentos do ano', tipos: ['acontecimento'] },
  { rotulo: 'Escolhas e compras', tipos: ['escolha'] },
  { rotulo: 'Diferença sem explicação', tipos: ['ajuste'] }
];

/**
 * A conta do último ano fechado, real por real (`sistemas/extrato`): começou
 * com X, entrou, saiu, foi para as aplicações, voltou delas, terminou com Y.
 * É o que responde "a sobra do mês foi para onde?".
 */
export function leituraDoExtrato(v: Vida): LeituraDoExtrato | undefined {
  const e = v.financas.extrato;
  if (!e || !Array.isArray(e.linhas) || e.contaFinal === undefined) return undefined;
  const conta = GRUPOS_EXTRATO.map(g => {
    const linhas = e.linhas.filter(l => g.tipos.includes(l.tipo) && Math.round(l.conta) !== 0).map(l => ({ rotulo: l.rotulo, valor: Math.round(l.conta) }));
    return { rotulo: g.rotulo, valor: linhas.reduce((s, l) => s + l.valor, 0), linhas };
  }).filter(g => g.linhas.length > 0);
  const soma = (tipos: string[]) => Math.round(e.linhas.filter(l => tipos.includes(l.tipo)).reduce((s, l) => s + l.aplicado, 0));
  const fimAplicado = Math.round(e.aplicadoFinal ?? e.aplicadoInicial);
  const rendeu = soma(['rendimento']);
  const posto = soma(['aporte']);
  const tirado = soma(['resgate']);
  const outros = fimAplicado - Math.round(e.aplicadoInicial) - rendeu - posto - tirado;
  const aplicacoes = e.aplicadoInicial > 0 || fimAplicado > 0 ? { inicio: Math.round(e.aplicadoInicial), fim: fimAplicado, rendeu, posto, tirado, outros } : undefined;
  return { ano: anoDe(e.tFim ?? v.t), inicio: Math.round(e.contaInicial), fim: Math.round(e.contaFinal), conta, aplicacoes, depois: Math.round(v.financas.conta - e.contaFinal) };
}

/* ------------------------------------------------------------- Segurança */

export const ESCALA_SEGURANCA: NivelSeguranca[] = ['no_vermelho', 'apertado', 'no_limite', 'equilibrado', 'seguro', 'folgado'];
export const PALAVRA_SEGURANCA: Record<NivelSeguranca, string> = {
  dependente: 'Por conta da família', no_vermelho: 'No vermelho', apertado: 'Apertado', no_limite: 'No limite', equilibrado: 'Equilibrado', seguro: 'Seguro', folgado: 'Folgado'
};

export function leituraDaSeguranca(v: Vida) {
  const s = seguranca(v);
  return { ...s, palavra: PALAVRA_SEGURANCA[s.nivel], marca: s.nivel === 'dependente' ? -1 : Math.max(0, ESCALA_SEGURANCA.indexOf(s.nivel) - 1) };
}

/* -------------------------------------------------------------- Bens */

export interface LeituraBem {
  id: string;
  tipo: 'imovel' | 'veiculo';
  /** Veículo: a categoria; imóvel: o modelo de moradia (cada um com a sua silhueta, `IconeMoradia`). */
  icone: string;
  /** Veículo: a forma (o desenho próprio — hatch, picape, scooter, lancha). */
  forma?: FormaVeiculo;
  /** REWORK 4: a cor do veículo (e o nome dela). */
  cor?: string;
  corNome?: string;
  modeloId: string;
  titulo: string;
  meta: string;
  estado: string;
  valor: number;
  /** Financiamento preso ao bem (quando houver). */
  financiamento?: { saldo: number; parcela: number; anos: number; atraso: number; suaParte: number; dividaId: string };
  problema?: { texto: string; custo: number; grave: boolean; adiado: number };
  historia: { ano: number; texto: string }[];
  ondeMora: boolean;
  alugadoPor?: number;
  dono: string;
}

export function leituraDosBens(v: Vida): LeituraBem[] {
  const out: LeituraBem[] = [];
  const bens = [...v.financas.bens].sort((a, b) => (a.tipo === b.tipo ? b.valor - a.valor : a.tipo === 'imovel' ? -1 : 1));
  for (const b of bens) out.push(leituraDoBem(v, b));
  return out;
}

export function leituraDoBem(v: Vida, b: Bem): LeituraBem {
  const d = v.financas.dividas.find(x => x.bemId === b.id);
  const financiamento = d ? { saldo: d.saldo, parcela: d.parcela, anos: Math.ceil(mesesRestantes(v, d) / 12), atraso: Math.ceil(d.atraso ?? 0), suaParte: Math.max(0, b.valor - d.saldo), dividaId: d.id } : undefined;
  const historia = (b.historia ?? []).map(h => ({ ano: anoDe(h.t), texto: h.texto }));
  const dono = b.dono === 'casal' ? 'de vocês' : 'seu';
  if (b.tipo === 'imovel') {
    const m = modeloMoradia(b.modeloId);
    const aqui = v.moradia.imovelId === b.id;
    return {
      id: b.id, tipo: 'imovel', icone: m.id, modeloId: m.id,
      titulo: `${cap(b.herdado && b.nome === 'casa da família' ? 'casa da família' : m.nome)}${b.bairro ? ` ${b.bairro}` : ''}`,
      meta: `${b.herdado ? 'Herdado' : 'Comprado'} em ${anoDe(b.tCompra)} · ${dono}${b.municipioId !== v.moradia.municipioId ? ` · em ${municipio(b.municipioId).nome}` : ''}`,
      estado: aqui ? 'Você mora aqui.' : b.alugadoPor ? `Alugado por ${dinheiroCurto(b.alugadoPor)} por mês.` : 'Vazio.',
      valor: b.valor, financiamento,
      problema: b.problema ? { texto: b.problema.texto, custo: b.problema.custo, grave: false, adiado: b.problema.adiado } : undefined,
      historia, ondeMora: aqui, alugadoPor: b.alugadoPor, dono
    };
  }
  const m = modeloVeiculo(b.modeloId);
  const anos = anosDoVeiculo(v, b);
  return {
    id: b.id, tipo: 'veiculo', icone: m.categoria, forma: formaDaVersao(versaoVeiculo(b.versaoId), m.id), modeloId: m.id,
    // REWORK 4: a cor deste veículo (da compra; saves antigos: estável pelo id).
    cor: b.cor ?? variantesDeVeiculo(m.categoria)[parseInt(b.id.replace(/\D/g, '') || '0', 10) % variantesDeVeiculo(m.categoria).length].cor,
    corNome: b.corNome ?? variantesDeVeiculo(m.categoria)[parseInt(b.id.replace(/\D/g, '') || '0', 10) % variantesDeVeiculo(m.categoria).length].nome,
    titulo: `${cap(nomeDoVeiculo(b))}${b.anoFabricacao ? ` ${b.anoFabricacao}` : ''}`,
    meta: cap(`${versaoDoVeiculo(b) ? `${versaoDoVeiculo(b)!.dica} · ` : ''}${b.usado ? 'comprado usado' : 'comprado zero'} em ${anoDe(b.tCompra)} · ${anos <= 1 ? 'quase novo' : `${anos} anos${m.raro ? '' : ' de estrada'}`} · ${dono}`),
    estado: cap(estadoDoVeiculo(b)) + '.',
    valor: b.valor, financiamento,
    problema: b.problema ? { texto: b.problema.texto, custo: b.problema.custo, grave: b.problema.gravidade >= 3, adiado: b.problema.adiado } : undefined,
    historia, ondeMora: false, dono
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------ Bichos */

export function leituraDosBichos(v: Vida) {
  return petsDaCasa(v).map(p => ({ p, idade: idadePessoa(v, p), estado: estadoDoPet(v, p) }));
}
