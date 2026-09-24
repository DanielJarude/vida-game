/**
 * Vida material em palavras: onde mora, com quem, de quem é, como está o mês,
 * o que tem e o que deve. A tela lê daqui (e os testes também): nenhum
 * número da interface é calculado fora do motor.
 */

import type { Bem, Imovel, LinhaRazao, Veiculo, Vida } from '../motor/tipos';
import { idade, idadePessoa, moraCom } from '../motor/nucleo';
import { listaNatural, flex } from '../motor/texto';
import { modeloMoradia, modeloVeiculo } from '../motor/dados/bens';
import { municipio, rotuloPerfil } from '../motor/dados/lugares';
import { mesesRestantes, orcamento, seguranca, type NivelSeguranca, type Orcamento } from '../motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../motor/sistemas/domicilio';
import { petsDaCasa, estadoDoPet } from '../motor/sistemas/pets';
import { estadoDoVeiculo, anosDoVeiculo } from '../motor/sistemas/veiculos';
import { casaApertada } from '../motor/sistemas/imoveis';
import { anoDe } from '../motor/tempo';

export const dinheiroCheio = (v: number) => `${v < 0 ? '−' : ''}R$ ${Math.round(Math.abs(v)).toLocaleString('pt-BR')}`;

export const dinheiroCurto = (v: number) => {
  const a = Math.abs(v);
  const s = v < 0 ? '−' : '';
  if (a >= 1_000_000) return `${s}R$ ${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace('.', ',')} mi`;
  if (a >= 10_000) return `${s}R$ ${Math.round(a / 1000)} mil`;
  return `${s}R$ ${Math.round(a).toLocaleString('pt-BR')}`;
};

/* --------------------------------------------------------------- Moradia */

export type FormaDaCasa = 'predio' | 'kitnet' | 'casa' | 'casa_grande' | 'republica' | 'familia' | 'favor';

export interface LeituraLar {
  forma: FormaDaCasa;
  /** "Recife, capital do Nordeste". */
  onde: string;
  /** A frase principal: onde, como, com quem. */
  frase: string;
  /** Selos curtos: de quem é, quanto custa, o que falta. */
  selos: { texto: string; tom?: 'ruim' | 'atencao' }[];
  moradores: { id: string; nome: string }[];
  bichos: { id: string; nome: string; especie: 'cachorro' | 'gato' }[];
  veiculo?: 'carro' | 'moto' | 'bicicleta';
  janelasAcesas: number;
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
  let forma: FormaDaCasa = 'predio';
  let frase: string;
  const selos: LeituraLar['selos'] = [];
  if (m.tipo === 'pais' || m.tipo === 'parente') {
    forma = 'familia';
    const i = idade(v);
    frase = `Mora na casa da família${comQuem}${bichoTxt}.`;
    selos.push({ texto: i < 18 ? 'A casa é dos adultos' : 'Casa da família' });
    if (i >= 18) selos.push({ texto: v.trabalho.atual ? 'Ajuda nas contas' : 'Sem pagar aluguel' });
  } else if (m.tipo === 'cedida') {
    forma = 'favor';
    frase = `Mora de favor${comQuem ? `, na casa de conhecidos` : ''}${bichoTxt}.`;
    selos.push({ texto: 'De favor', tom: 'atencao' });
  } else {
    const nome = modelo?.nome ?? 'casa';
    forma = modelo?.id === 'republica' ? 'republica' : modelo?.id === 'kitnet' ? 'kitnet' : modelo?.casa ? ((modelo.quartos >= 4 || modelo.padrao >= 5) ? 'casa_grande' : 'casa') : 'predio';
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
  const vei = v.financas.bens.filter((x): x is Veiculo => x.tipo === 'veiculo').sort((a, c) => c.valor - a.valor)[0];
  const cat = vei ? modeloVeiculo(vei.modeloId).categoria : undefined;
  return {
    forma,
    onde: `${mun.nome}, ${mun.uf} · ${rotuloPerfil(mun.perfil)}`,
    frase,
    selos,
    moradores: junto.map(p => ({ id: p.id, nome: p.nome })),
    bichos,
    veiculo: cat,
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
  icone: 'predio' | 'casa' | 'kitnet' | 'carro' | 'moto' | 'bicicleta';
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
      id: b.id, tipo: 'imovel', icone: m.id === 'kitnet' ? 'kitnet' : m.casa ? 'casa' : 'predio',
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
    id: b.id, tipo: 'veiculo', icone: m.categoria,
    titulo: `${cap(m.nome)}${b.anoFabricacao ? ` ${b.anoFabricacao}` : ''}`,
    meta: `${b.usado ? 'Comprado usado' : 'Comprado zero'} em ${anoDe(b.tCompra)} · ${anos <= 1 ? 'quase novo' : `${anos} anos de estrada`} · ${dono}`,
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
