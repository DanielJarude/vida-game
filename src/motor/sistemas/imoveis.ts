/**
 * Imóveis depois da compra: valem mais ou menos com o mercado, envelhecem,
 * pedem manutenção de tempos em tempos (espaçada: um telhado não cai todo
 * ano), podem ser alugados, vendidos, quitados — e às vezes deixam de caber
 * na família.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Imovel, Vida } from '../tipos';
import { escrever, filhos, idadePessoa, moraCom } from '../nucleo';
import { modeloMoradia } from '../dados/bens';
import { dinheiro as fmt } from '../texto';
import { aluguelDe, valorJustoDoImovel } from './mercado';
import { fatorDoBairro } from './precos';
import { converterEntrePaises } from '../mundo/moeda';
import { paisDaCidade } from '../dados/lugares';
import { paisDaVida } from '../mundo/vida';
import type { AnoEconomico } from './economia';
import { okDePagar, PATRIMONIO_NO_MES } from './dinheiro';
import type { Veredito } from '../plausibilidade';

export const imoveis = (v: Vida) => v.financas.bens.filter((b): b is Imovel => b.tipo === 'imovel');
export const casaPropria = (v: Vida) => imoveis(v).find(b => b.id === v.moradia.imovelId);

const REPAROS: { texto: string; pct: number }[] = [
  { texto: 'o telhado', pct: 0.03 },
  { texto: 'a parte elétrica', pct: 0.025 },
  { texto: 'uma infiltração que não para', pct: 0.02 },
  { texto: 'o encanamento', pct: 0.025 },
  { texto: 'o piso e a pintura', pct: 0.035 }
];

/**
 * REWORK 12: o que o dono recebe de um aluguel, de fato. A imobiliária fica com ~10% e segura o calote; quem
 * administra por conta própria fica com tudo — e com o risco. Sobre o recebido, o imposto do país (uma fatia da
 * alíquota de renda: aluguel tem dedução de despesa em quase todo lugar).
 */
export function aluguelLiquido(b: Imovel, bruto: number): number {
  const taxa = (b.administracao ?? 'imobiliaria') === 'imobiliaria' ? 0.9 : 1;
  return Math.round(bruto * taxa / 10) * 10;
}

/** O aluguel de mercado deste imóvel hoje (o tipo, a cidade, o bairro e o estado), nos preços de onde a vida está. */
export function aluguelDeMercado(v: Vida, b: Imovel): number {
  const m = modeloMoradia(b.modeloId);
  // REWORK 9.7 · ECO-01: o aluguel de um imóvel em outro país está nos preços de lá — convertido como o valor do imóvel
  // foi convertido na mudança (antes, não: o rendimento de um apartamento em São Paulo ia de 4% a 9% ao mudar para os EUA).
  const conv = converterEntrePaises(1, paisDaCidade(b.municipioId), paisDaVida(v));
  return aluguelDe(v, m, b.municipioId) * conv * fatorDoBairro(b.indiceBairro ?? 1, m.id, 'aluguel') * (0.75 + b.estado / 400);
}

/** O ano dos imóveis. */
export function processarImoveis(v: Vida, r: Rng, ec?: AnoEconomico): void {
  for (const b of imoveis(v)) {
    const variacao = (ec?.imoveis ?? 0.005) + r.normal() * 0.02 - (b.problema ? 0.02 : 0);
    // REWORK 12: o valor anda com o mercado e com o acaso — e é puxado devagar para o que o mercado paga por um igual
    // (o tipo, a cidade, o bairro, o estado). Sem isso, o acaso acumulava sem freio por décadas.
    const justo = valorJustoDoImovel(v, b);
    const andou = b.valor * (1 + variacao);
    b.valor = Math.max(10000, Math.round((andou + (justo - andou) * 0.12) / 1000) * 1000);
    b.estado = clamp(b.estado - (b.alugadoPor ? 2.5 : 1.5) - (b.problema ? 3 : 0));
    // Aluguel de quem aluga para terceiros acompanha o mercado; às vezes o imóvel fica vazio.
    if (b.alugadoPor) {
      b.alugadoPor = aluguelLiquido(b, aluguelDeMercado(v, b));
      const propria = b.administracao === 'propria';
      // REWORK 12: quem administra sozinho acha inquilino mais devagar (vacância maior) e às vezes escolhe mal.
      if (r.chance(propria ? 0.16 : 0.1)) {
        const meses = r.int(2, propria ? 7 : 5);
        v.financas.conta -= b.alugadoPor * meses;
        escrever(v, { texto: `O inquilino ${b.nome.startsWith('casa') ? 'da casa' : 'do apartamento'} saiu e o imóvel ficou ${meses} meses vazio.`, relevancia: 'tecnico', tema: 'dinheiro' });
      } else if (!b.calote && r.chance(propria ? 0.07 : 0.015)) {
        // O calote: com imobiliária, quase sempre resolvido por ela (garantia); sozinho, vira decisão (acontecimentos12).
        b.calote = 1;
      }
    }
    if (b.problema) continue;
    const desde = v.t - (b.tManutencao ?? b.tCompra);
    if (desde < 84) continue;
    if (r.chance(0.12 + (100 - b.estado) / 400 + Math.min(0.15, (desde - 84) / 600))) {
      const x = r.pick(REPAROS);
      const custo = Math.round(Math.max(2500, b.valor * x.pct) / 100) * 100;
      b.problema = { id: `pb${v.seq++}`, texto: x.texto, custo, desde: v.t, gravidade: 2, adiado: 0 };
      const aqui = v.moradia.imovelId === b.id;
      escrever(v, { texto: aqui ? `A casa começou a cobrar os anos: ${x.texto}. O orçamento do conserto veio em ${fmt(custo)}.` : `${b.nome.charAt(0).toUpperCase() + b.nome.slice(1)} ${b.nome.startsWith('casa') || b.nome.startsWith('kitnet') ? 'alugada' : 'alugado'} precisa de reparo: ${x.texto} (${fmt(custo)}).`, relevancia: 'cotidiano', tema: 'casa', tom: 'ruim' });
    }
  }
}

export type AcaoImovel = 'reparar' | 'adiar' | 'alugar' | 'retomar' | 'morar' | 'administrar';

export function disponibilidadeImovel(v: Vida, b: Imovel | undefined, oque: AcaoImovel): { ok: boolean; motivo?: string; resgate?: Veredito['resgate'] } {
  if (!b) return { ok: false, motivo: 'Imóvel não encontrado.' };
  const aqui = v.moradia.imovelId === b.id;
  switch (oque) {
    case 'reparar':
      if (!b.problema) return { ok: false, motivo: 'Não há reparo pendente.' };
      return okDePagar(v, b.problema.custo, 'O reparo custa');
    case 'adiar':
      if (!b.problema) return { ok: false, motivo: 'Não há reparo pendente.' };
      return v.anoAtual.acoes.includes(`adiou:${b.id}`) ? { ok: false, motivo: 'Já decidiu esperar este ano.' } : { ok: true };
    case 'alugar':
      if (aqui) return { ok: false, motivo: 'Você mora aqui.' };
      if (b.alugadoPor) return { ok: false, motivo: 'Já está alugado.' };
      return { ok: true };
    case 'retomar':
      return b.alugadoPor ? { ok: true } : { ok: false, motivo: 'Não está alugado.' };
    case 'administrar':
      if (aqui) return { ok: false, motivo: 'Você mora aqui.' };
      return v.anoAtual.acoes.includes(`administrou:${b.id}`) ? { ok: false, motivo: 'Já mudou isso este ano.' } : { ok: true };
    case 'morar':
      if (aqui) return { ok: false, motivo: 'Você já mora aqui.' };
      if (b.municipioId !== v.moradia.municipioId) return { ok: false, motivo: 'Fica em outra cidade.' };
      return { ok: true };
  }
}

export function executarImovel(v: Vida, b: Imovel, oque: AcaoImovel): string {
  switch (oque) {
    case 'reparar': {
      const p = b.problema!;
      v.financas.conta -= p.custo;
      b.problema = undefined;
      b.estado = clamp(b.estado + 22);
      b.tManutencao = v.t;
      (b.historia ??= []).push({ t: v.t, texto: `Reparou ${p.texto} (${fmt(p.custo)}).` });
      return `Reparo feito: ${p.texto}. ${fmt(p.custo)} e algumas semanas de obra.`;
    }
    case 'adiar':
      v.anoAtual.acoes.push(`adiou:${b.id}`);
      b.problema!.adiado += 1;
      b.problema!.custo = Math.round(b.problema!.custo * 1.1 / 100) * 100;
      return `Fica para depois. ${b.problema!.texto.charAt(0).toUpperCase() + b.problema!.texto.slice(1)} continua lá — e o imóvel perde um pouco a cada ano assim.`;
    case 'alugar': {
      b.alugadoPor = aluguelLiquido(b, aluguelDeMercado(v, b));
      (b.historia ??= []).push({ t: v.t, texto: 'Alugado para terceiros.' });
      return `Alugado por ${fmt(b.alugadoPor)} por mês${(b.administracao ?? 'imobiliaria') === 'imobiliaria' ? ' (já descontada a imobiliária)' : ''}.`;
    }
    case 'retomar':
      b.alugadoPor = undefined;
      b.calote = undefined;
      return 'O contrato do inquilino terminou. O imóvel está livre.';
    case 'administrar': {
      const antes = b.administracao ?? 'imobiliaria';
      b.administracao = antes === 'imobiliaria' ? 'propria' : 'imobiliaria';
      if (b.alugadoPor) b.alugadoPor = aluguelLiquido(b, aluguelDeMercado(v, b));
      v.anoAtual.acoes.push(`administrou:${b.id}`);
      return b.administracao === 'propria'
        ? 'Sem imobiliária: o aluguel vem inteiro — e achar inquilino, cobrar e consertar passa a ser com você.'
        : 'A imobiliária assume: fica com uns 10% do aluguel, acha inquilino mais rápido e segura o calote.';
    }
    case 'morar': return '';
  }
}

/** Quantos quartos a família que mora junto precisa (o casal num, até duas crianças por quarto). */
export function quartosNecessarios(v: Vida): number {
  // Quem iria junto numa mudança: a parceria e os filhos (não a família de origem).
  const junto = moraCom(v);
  const criancas = junto.filter(p => idadePessoa(v, p) < 18 && ['filho', 'enteado'].includes(v.vinculos[p.id]?.parentesco ?? '')).length;
  const outrosAdultos = junto.filter(p => idadePessoa(v, p) >= 18 && !v.vinculos[p.id]?.romance && ['filho', 'enteado', 'sogro'].includes(v.vinculos[p.id]?.parentesco ?? '')).length;
  return 1 + Math.ceil(criancas / 2) + outrosAdultos;
}

/** A casa deixou de caber na família? (null se cabe ou se não é a casa dela) */
export function casaApertada(v: Vida): string | null {
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente' || v.moradia.tipo === 'cedida') return null;
  const m = v.moradia.modeloId ? modeloMoradia(v.moradia.modeloId) : undefined;
  if (!m || m.id === 'republica') return null;
  const precisa = quartosNecessarios(v);
  if (m.quartos >= precisa) return null;
  const temFilhos = filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 18);
  return temFilhos ? 'a casa ficou pequena para a família' : 'gente demais para o espaço';
}

/** Valor de venda (menos corretagem e impostos). */
export const valorDeVendaImovel = (b: Imovel) => Math.round(b.valor * 0.94 / 1000) * 1000;

/**
 * REWORK 12: o que custa, por mês, um imóvel seu que NÃO é a sua casa. Vazio, paga tudo: o imposto, a
 * manutenção e o condomínio (antes, imóvel vazio não custava nada — dava para guardar riqueza de graça). Alugado,
 * o inquilino paga o condomínio; o dono fica com o imposto do imóvel e o imposto sobre o aluguel recebido.
 */
export function custosDoImovelDeInvestimento(v: Vida, b: Imovel, c: number): { rotulo: string; valor: number }[] {
  if (b.id === v.moradia.imovelId) return [];
  const m = modeloMoradia(b.modeloId);
  const nome = b.nome;
  const out: { rotulo: string; valor: number }[] = [];
  out.push({ rotulo: `${nome.charAt(0).toUpperCase() + nome.slice(1)}: imposto e manutenção`, valor: b.valor * 0.006 / 12 });
  if (!b.alugadoPor && m.condominio) out.push({ rotulo: `${nome.charAt(0).toUpperCase() + nome.slice(1)}: condomínio (vazio)`, valor: m.condominio * c });
  if (b.alugadoPor && !b.calote) out.push({ rotulo: `${nome.charAt(0).toUpperCase() + nome.slice(1)}: imposto sobre o aluguel`, valor: b.alugadoPor * 0.12 });
  return out;
}


PATRIMONIO_NO_MES.push((v, c) => imoveis(v).flatMap(b => custosDoImovelDeInvestimento(v, b, c)));
