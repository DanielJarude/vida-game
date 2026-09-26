/**
 * Veículos: comprar, usar, gastar, quebrar, consertar, vender.
 *
 * Um veículo não é um número no patrimônio: tem idade, estado, história. O
 * usado chega com anos de estrada (e às vezes com um passado que pesa); o
 * estado cai com o uso; os problemas aparecem mais nos velhos e nos mal
 * cuidados. TODO problema tem saída: consertar, adiar (quando dá), vender
 * como está ou deixar parado. Adiar tem preço: o conserto cresce e o
 * problema pode piorar até o carro parar.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { ProblemaBem, Veiculo, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { anoDe } from '../tempo';
import { economiaLocal } from '../dados/lugares';
import { depreciacao, modeloVeiculo, nomeDaVersao, versaoVeiculo, type CategoriaVeiculo, type ModeloVeiculo } from '../dados/bens';
import { dinheiro as fmt } from '../texto';
import { abalar } from './abalo';
import { okDePagar } from './dinheiro';
import type { Veredito } from '../plausibilidade';

/** Dá para usar (não está parado nem quebrado de vez). */
export const veiculoUtil = (b: { tipo: string; parado?: boolean; problema?: ProblemaBem }) => b.tipo === 'veiculo' && !b.parado && (b.problema?.gravidade ?? 0) < 3;

export const veiculos = (v: Vida) => v.financas.bens.filter((b): b is Veiculo => b.tipo === 'veiculo');

/** Carro, moto ou bicicleta — pela classe (vale para ids antigos, como `moto_usada`). */
export const categoriaDoVeiculo = (b: { modeloId: string } | string): CategoriaVeiculo => modeloVeiculo(typeof b === 'string' ? b : b.modeloId).categoria;

/** A versão concreta (marca e modelo), quando o veículo tem uma. */
export const versaoDoVeiculo = (b: { versaoId?: string }) => versaoVeiculo(b.versaoId);

/** O nome para mostrar: marca e modelo da versão ("Fiat Mobi"); sem versão, o nome guardado. */
export const nomeDoVeiculo = (b: { versaoId?: string; nome: string }) => { const x = versaoVeiculo(b.versaoId); return x ? nomeDaVersao(x) : b.nome; };

/** Quanto custa um igual zero quilômetro (a versão, senão a classe). */
export const precoNovoDoVeiculo = (b: { modeloId: string; versaoId?: string }) => versaoVeiculo(b.versaoId)?.preco ?? modeloVeiculo(b.modeloId).preco;

/** Combustível e manutenção básica por mês (a versão ajusta a classe). */
export const usoMensalDoVeiculo = (b: { modeloId: string; versaoId?: string }) => versaoVeiculo(b.versaoId)?.usoMensal ?? modeloVeiculo(b.modeloId).usoMensal;

/** Tem condução própria que funciona (carro ou moto). */
export const temConducao = (v: Vida) => veiculos(v).some(b => veiculoUtil(b) && categoriaDoVeiculo(b) !== 'bicicleta');

export const anosDoVeiculo = (v: Vida, b: Veiculo) => Math.max(0, anoDe(v.t) - (b.anoFabricacao ?? anoDe(b.tCompra)));

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Custos mensais de um veículo (uso, IPVA, seguro). */
export function custosDeVeiculo(v: Vida, b: Veiculo, c: number, uso = 1): { rotulo: string; valor: number }[] {
  const m = modeloVeiculo(b.modeloId);
  const out: { rotulo: string; valor: number }[] = [];
  const nome = cap(nomeDoVeiculo(b));
  if (!b.parado && veiculoUtil(b)) {
    const idadeFator = 1 + Math.min(0.35, anosDoVeiculo(v, b) * 0.015);
    out.push({ rotulo: `${nome}: combustível e manutenção`, valor: usoMensalDoVeiculo(b) * c * idadeFator * (b.estado < 40 ? 1.3 : 1) * uso });
  }
  if (m.taxaAnual) out.push({ rotulo: `${nome}: IPVA${b.parado ? '' : ' e seguro'}`, valor: b.valor * (b.parado ? 0.035 : m.taxaAnual) / 12 });
  return out;
}

/* ------------------------------------------------------------ Problemas */

const PROBLEMAS: Record<ModeloVeiculo['categoria'], { texto: string; gravidade: 1 | 2 | 3; custo: [number, number] }[]> = {
  carro: [
    { texto: 'pneus e freios gastos', gravidade: 1, custo: [1200, 2600] },
    { texto: 'a bateria e a parte elétrica', gravidade: 1, custo: [600, 1600] },
    { texto: 'a embreagem patinando', gravidade: 2, custo: [1800, 3800] },
    { texto: 'a suspensão batendo', gravidade: 2, custo: [1500, 3500] },
    { texto: 'o radiador vazando', gravidade: 2, custo: [900, 2400] },
    { texto: 'o motor', gravidade: 3, custo: [5000, 12000] },
    { texto: 'o câmbio', gravidade: 3, custo: [4000, 9000] }
  ],
  moto: [
    { texto: 'relação e pneus', gravidade: 1, custo: [400, 900] },
    { texto: 'os freios', gravidade: 1, custo: [250, 600] },
    { texto: 'a embreagem', gravidade: 2, custo: [500, 1200] },
    { texto: 'o motor', gravidade: 3, custo: [2500, 5500] }
  ],
  bicicleta: [
    { texto: 'corrente e pneus', gravidade: 1, custo: [120, 300] },
    { texto: 'a bateria da bicicleta', gravidade: 2, custo: [1800, 3200] }
  ]
};

function sortearProblema(v: Vida, r: Rng, b: Veiculo): ProblemaBem {
  const m = modeloVeiculo(b.modeloId);
  let lista = PROBLEMAS[m.categoria];
  if (m.categoria === 'bicicleta' && !m.eletrica) lista = lista.filter(p => !p.texto.includes('bateria'));
  // Estado ruim puxa para os problemas graves.
  const grave = b.estado < 40 || anosDoVeiculo(v, b) > 12;
  const p = r.weighted(lista, x => (x.gravidade === 3 ? (grave ? 1.2 : 0.35) : x.gravidade === 2 ? 1 : 1.4))!;
  const custo = Math.round(Math.min(r.int(p.custo[0], p.custo[1]) * m.fatorConserto * Math.sqrt(economiaLocal(v.moradia.municipioId).custo), precoNovoDoVeiculo(b) * 0.45) / 10) * 10;
  return { id: `pb${v.seq++}`, texto: p.texto, custo, desde: v.t, gravidade: p.gravidade, adiado: 0 };
}

/** O ano dos veículos: depreciar, gastar, dar problema; problema adiado cresce. */
export function processarVeiculos(v: Vida, r: Rng): void {
  for (const b of veiculos(v)) {
    const m = modeloVeiculo(b.modeloId);
    const anos = anosDoVeiculo(v, b);
    const novo = precoNovoDoVeiculo(b);
    // Vale o que um igual, da mesma idade e estado, vale no mercado.
    b.valor = Math.round(novo * depreciacao(m, anos) * (0.8 + b.estado / 500) / 100) * 100;
    const revisado = b.tRevisao !== undefined && v.t - b.tRevisao <= 12;
    if (!b.parado) b.estado = clamp(Math.round(b.estado - (m.categoria === 'bicicleta' ? 4 : 5) - (anos > 8 ? 2 : 0) + (revisado ? 3 : 0) + r.normal()));
    else b.estado = clamp(b.estado - 1);

    if (b.problema) {
      // Não consertou no ano: o problema cresce, e às vezes piora de vez.
      const p = b.problema;
      if (v.t - p.desde >= 12) {
        p.custo = Math.round(p.custo * 1.25 / 10) * 10;
        // Bicicleta não "quebra de vez": o problema fica, mas não vira motor fundido.
        const teto = m.categoria === 'bicicleta' ? 2 : 3;
        p.custo = Math.min(p.custo, Math.round(novo * 0.45 / 10) * 10);
        if (p.gravidade < teto && !b.parado && r.chance(p.gravidade === 1 ? 0.35 : 0.4)) {
          p.gravidade = (p.gravidade + 1) as 1 | 2 | 3;
          if (p.gravidade === 3) {
            p.custo = Math.round(Math.min(Math.max(p.custo * 1.6, novo * 0.05), novo * 0.45) / 10) * 10;
            escrever(v, { texto: `${cap(textoVeiculo(b))} parou de vez: o que era ${p.texto} virou coisa grande. Na oficina, ${fmt(p.custo)}.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'ruim' });
            abalar(v, `${textoVeiculo(b)} parado`, -2, 5);
          }
        }
      }
      continue;
    }
    if (b.parado) continue;
    const chance = m.fragilidade * (0.07 + (100 - b.estado) / 260 + anos * 0.006) * (revisado ? 0.55 : 1) * (b.usado ? 1.1 : 1);
    if (r.chance(Math.min(0.75, chance))) {
      b.problema = sortearProblema(v, r, b);
      const p = b.problema;
      if (p.gravidade === 3) {
        const primeira = !(b.historia ?? []).some(h => h.texto.startsWith('Quebrou'));
        escrever(v, { texto: primeira ? `${cap(textoVeiculo(b))} deixou você na mão. Na oficina, o veredito: ${p.texto}, ${fmt(p.custo)}.` : `${cap(textoVeiculo(b))} quebrou de novo — ${p.texto}.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'ruim' });
        abalar(v, `${textoVeiculo(b)} na oficina`, -2, 4);
      }
      (b.historia ??= []).push({ t: v.t, texto: p.gravidade === 3 ? `Quebrou: ${p.texto}.` : `Começou a dar problema: ${p.texto}.` });
    }
  }
}

/** "o Fiat Mobi", "a Honda CG 160 Fan"; sem versão, "o carro compacto", "a moto pequena". */
export function textoVeiculo(b: Veiculo): string {
  const x = versaoVeiculo(b.versaoId);
  if (x) return `${x.artigo} ${nomeDaVersao(x)}`;
  const m = modeloVeiculo(b.modeloId);
  return m.categoria === 'carro' ? `o ${m.nome}` : `a ${m.nome}`;
}

/* ------------------------------------------------------------- Ações */

export type AcaoVeiculo = 'consertar' | 'adiar' | 'revisao' | 'parar' | 'usar';

export function disponibilidadeVeiculo(v: Vida, b: Veiculo | undefined, oque: AcaoVeiculo): { ok: boolean; motivo?: string; resgate?: Veredito['resgate'] } {
  if (!b) return { ok: false, motivo: 'Veículo não encontrado.' };
  switch (oque) {
    case 'consertar':
      if (!b.problema) return { ok: false, motivo: 'Não há nada para consertar.' };
      return okDePagar(v, b.problema.custo, 'O conserto custa');
    case 'adiar':
      if (!b.problema) return { ok: false, motivo: 'Não há conserto pendente.' };
      if (b.problema.gravidade >= 3) return { ok: false, motivo: 'Assim não anda. Ou conserta, ou vende, ou deixa parado.' };
      if (v.anoAtual.acoes.includes(`adiou:${b.id}`)) return { ok: false, motivo: 'Já decidiu esperar este ano.' };
      return { ok: true };
    case 'revisao': {
      if (b.parado) return { ok: false, motivo: 'Está parado.' };
      if (b.problema) return { ok: false, motivo: 'Primeiro, o conserto.' };
      if (b.tRevisao !== undefined && v.t - b.tRevisao < 12) return { ok: false, motivo: 'Já fez a revisão este ano.' };
      const custo = custoRevisao(v, b);
      return okDePagar(v, custo, 'A revisão custa');
    }
    case 'parar': return b.parado ? { ok: false, motivo: 'Já está parado.' } : { ok: true };
    case 'usar':
      if (!b.parado) return { ok: false, motivo: 'Já está em uso.' };
      if ((b.problema?.gravidade ?? 0) >= 3) return { ok: false, motivo: 'Precisa de conserto antes de voltar a rodar.' };
      return { ok: true };
  }
}

export const custoRevisao = (v: Vida, b: Veiculo) => Math.round(usoMensalDoVeiculo(b) * 1.4 * Math.sqrt(economiaLocal(v.moradia.municipioId).custo) / 10) * 10;

export function executarVeiculo(v: Vida, b: Veiculo, oque: AcaoVeiculo): string {
  switch (oque) {
    case 'consertar': {
      const p = b.problema!;
      v.financas.conta -= p.custo;
      b.estado = clamp(b.estado + (p.gravidade === 3 ? 30 : 18), 0, b.usado ? 92 : 100);
      b.problema = undefined;
      (b.historia ??= []).push({ t: v.t, texto: `Consertou ${p.texto} (${fmt(p.custo)}).` });
      if (p.gravidade === 3 && p.custo > b.valor * 0.4) escrever(v, { texto: `Pagou ${fmt(p.custo)} para ${textoVeiculo(b)} voltar a andar — quase metade do que ele valia.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
      return `Consertado: ${p.texto}. ${cap(textoVeiculo(b))} voltou a rodar direito.`;
    }
    case 'adiar':
      v.anoAtual.acoes.push(`adiou:${b.id}`);
      b.problema!.adiado += 1;
      return `Dá para rodar assim por um tempo. Mas ${b.problema!.texto} não melhora sozinho — e o conserto costuma crescer.`;
    case 'revisao': {
      const custo = custoRevisao(v, b);
      v.financas.conta -= custo;
      b.tRevisao = v.t;
      b.estado = clamp(b.estado + 6, 0, b.usado ? 92 : 100);
      return `Revisão feita (${fmt(custo)}): óleo, filtros, a checagem de sempre. Menos chance de surpresa este ano.`;
    }
    case 'parar':
      b.parado = true;
      (b.historia ??= []).push({ t: v.t, texto: 'Ficou parado na garagem.' });
      return `${cap(textoVeiculo(b))} ficou parado: sem combustível nem seguro, mas também sem condução.`;
    case 'usar':
      b.parado = false;
      return `${cap(textoVeiculo(b))} voltou a rodar.`;
  }
}

/** Quanto se consegue vendendo hoje (menos o conserto pendente; financiado, o banco recebe primeiro). */
export function valorDeVenda(b: Veiculo): number {
  return Math.max(0, Math.round((b.valor * 0.92 - (b.problema ? b.problema.custo * 0.8 : 0)) / 100) * 100);
}

/** Descrição do estado em palavras. */
export function estadoDoVeiculo(b: Veiculo): string {
  if (b.parado) return 'parado na garagem';
  if (b.problema) return b.problema.gravidade >= 3 ? `parado: ${b.problema.texto}` : `precisa de conserto: ${b.problema.texto}`;
  return b.estado >= 80 ? 'inteiro' : b.estado >= 60 ? 'bem cuidado' : b.estado >= 40 ? 'com as marcas do uso' : 'cansado';
}

