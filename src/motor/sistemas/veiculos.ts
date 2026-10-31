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

import { efeitoDasMods } from '../dados/personalizacaoVeiculo';
import { textoLocal } from '../mundo/locais';
import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { ProblemaBem, Veiculo, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { anoDe } from '../tempo';
import { economiaLocal } from '../dados/lugares';
import { depreciacao, modeloVeiculo, nomeDaVersao, versaoVeiculo, type CategoriaVeiculo, type ModeloVeiculo } from '../dados/bens';
import { corConcordada, corDoVeiculo } from '../dados/pertences';
import { dinheiro as fmt } from '../texto';
import { abalar } from './abalo';
import { okDePagar } from './dinheiro';
import { indiceClassicos, precoNovoNoPais, valorDeClassico } from './mercado';
import { fatorDeImportado, importaUsados, tributoDeImportados } from './precos';
import { converterEntrePaises } from '../mundo/moeda';
import { municipio, paisDaCidade } from '../dados/lugares';
import { paisDaVida } from '../mundo/vida';
import { nomeDoPais } from '../mundo/registro';

const nomeDoMunicipio = (id: string) => municipio(id).nome;
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
/** O veículo é "a" (a moto, a Biz, a bicicleta) ou "o" (o carro, o Argo)? */
export const vecFeminino = (b: { versaoId?: string; modeloId: string }) => { const x = versaoVeiculo(b.versaoId); if (x) return x.artigo === 'a'; const c = modeloVeiculo(b.modeloId).categoria; return c !== 'carro' && c !== 'aeronave' && b.modeloId !== 'veleiro'; };
/** "Fiat Argo vermelho", "Honda Biz preta", "Caloi Andes azul": o veículo desta vida, com a cor dele. */
export const nomeComCor = (b: { id: string; versaoId?: string; modeloId: string; nome: string; cor?: string; corNome?: string }) => {
  const c = corDoVeiculo(b, modeloVeiculo(b.modeloId).categoria);
  return `${nomeDoVeiculo(b)}${c.nome ? ` ${corConcordada(c.nome, vecFeminino(b))}` : ''}`;
};

/** Quanto custa um igual zero quilômetro (a versão, senão a classe). */
export const precoNovoDoVeiculo = (b: { modeloId: string; versaoId?: string }) => versaoVeiculo(b.versaoId)?.preco ?? modeloVeiculo(b.modeloId).preco;

/** REWORK 12: onde o veículo está (a cidade): onde a pessoa mora, ou onde ficou guardado. */
export const ondeEsta = (v: Vida, b: Veiculo) => b.local ?? v.moradia.municipioId;
/** REWORK 12: guardado longe (em outra cidade ou país): não leva ninguém a lugar nenhum até ser trazido. */
export const guardadoLonge = (v: Vida, b: Veiculo) => !!b.local && b.local !== v.moradia.municipioId;

/**
 * REWORK 12: o preço de um igual, zero, no mercado de onde o veículo está — nos preços de onde a vida está. O
 * Corolla nos Estados Unidos vale o Corolla de lá (não o daqui com o imposto brasileiro).
 */
export function precoNovoLocal(v: Vida, b: { modeloId: string; versaoId?: string; local?: string }): number {
  const onde = b.local ?? v.moradia.municipioId;
  return precoNovoNoPais({ preco: precoNovoDoVeiculo(b) }, onde) * converterEntrePaises(1, paisDaCidade(onde), paisDaVida(v));
}

/**
 * REWORK 12: o que o veículo vale hoje no mercado. O comum deprecia pela idade e pelo estado. O clássico segue o
 * mercado de clássicos e o estado (pode subir, pode cair). A edição limitada deprecia pouco e, com o tempo, anda
 * com o mercado de colecionador — sem garantia nenhuma.
 */
export function valorDeMercadoDoVeiculo(v: Vida, b: Veiculo): number {
  const m = modeloVeiculo(b.modeloId);
  const onde = ondeEsta(v, b);
  const conv = converterEntrePaises(1, paisDaCidade(onde), paisDaVida(v));
  if (m.segmento === 'classico') return Math.round(valorDeClassico(v, precoNovoDoVeiculo(b), b.estado, onde) * conv / 100) * 100;
  const novo = precoNovoLocal(v, b);
  const anos = anosDoVeiculo(v, b);
  const lim = versaoVeiculo(b.versaoId)?.limitada;
  const dep = lim ? Math.max(0.72, depreciacao(m, anos)) * (anos >= 5 ? Math.pow(indiceClassicos(v.economia?.semente ?? 1, anoDe(v.t)), 0.8) : 1) : depreciacao(m, anos);
  return Math.round(novo * dep * (0.8 + b.estado / 500) * efeitoDasMods(m.categoria, b.mods).valor / 100) * 100;
}

/** Combustível e manutenção básica por mês (a versão ajusta a classe). */
export const usoMensalDoVeiculo = (b: { modeloId: string; versaoId?: string; mods?: Record<string, string> }) => (versaoVeiculo(b.versaoId)?.usoMensal ?? modeloVeiculo(b.modeloId).usoMensal) * (b.mods ? efeitoDasMods(modeloVeiculo(b.modeloId).categoria, b.mods).uso : 1);

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
  const taxas = m.categoria === 'embarcacao' ? 'seguro e marina' : m.categoria === 'aeronave' ? 'seguro, hangar e inspeção' : `${textoLocal(v, 'impostoVeiculo')}${b.parado ? '' : ' e seguro'}`;
  if (m.taxaAnual) out.push({ rotulo: `${nome}: ${taxas}`, valor: b.valor * (b.parado ? 0.035 : m.taxaAnual) / 12 });
  // O jato voa com tripulação própria: salário fixo enquanto não está parado (parado, a tripulação é dispensada).
  if (m.tripulacao && !b.parado) out.push({ rotulo: `${nome}: tripulação (dois pilotos)`, valor: m.tripulacao });
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
  ],
  embarcacao: [
    { texto: 'a parte elétrica, com a maresia', gravidade: 1, custo: [1500, 4500] },
    { texto: 'o casco, que pediu reparo', gravidade: 2, custo: [6000, 18000] },
    { texto: 'o motor', gravidade: 3, custo: [15000, 60000] }
  ],
  aeronave: [
    { texto: 'a inspeção anual, que pediu troca de peças', gravidade: 1, custo: [8000, 20000] },
    { texto: 'os instrumentos', gravidade: 2, custo: [15000, 45000] },
    { texto: 'o motor, na revisão geral', gravidade: 3, custo: [60000, 180000] }
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
    const novo = precoNovoLocal(v, b);
    // Vale o que um igual, da mesma idade e estado, vale no mercado (REWORK 12: no mercado de onde ele está).
    b.valor = valorDeMercadoDoVeiculo(v, b);
    const revisado = b.tRevisao !== undefined && v.t - b.tRevisao <= 12;
    // O clássico roda pouco (é passeio de domingo): gasta devagar.
    const gasto = m.segmento === 'classico' ? 2 : (m.categoria === 'bicicleta' ? 4 : 5) + (anos > 8 ? 2 : 0);
    if (!b.parado) b.estado = clamp(Math.round(b.estado - gasto + (revisado ? 3 : 0) + r.normal()));
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
            abalar(v, `${textoVeiculo(b)} ${gv(b, 'parado', 'parada')}`, -2, 5);
          }
        }
      }
      continue;
    }
    if (b.parado) continue;
    // REWORK 12.4: o que foi feito nele (o pneu bom, o motor preparado) muda o quanto ele dá problema.
    const chance = m.fragilidade * efeitoDasMods(m.categoria, b.mods).fragilidade * (0.07 + (100 - b.estado) / 260 + anos * 0.006) * (revisado ? 0.55 : 1) * (b.usado ? 1.1 : 1);
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
  return m.categoria === 'carro' || m.categoria === 'aeronave' || m.id === 'veleiro' ? `o ${m.nome}` : `a ${m.nome}`;
}

/** Concorda com o veículo: "o Onix ficou parado", "a Biz ficou parada". */
export const gv = (b: Veiculo, masc: string, fem: string) => (textoVeiculo(b).startsWith('a ') ? fem : masc);

/* ------------------------------------------------------------- Ações */

export type AcaoVeiculo = 'consertar' | 'adiar' | 'revisao' | 'parar' | 'usar' | 'trazer' | 'principal' | 'restaurar';

/**
 * REWORK 12: trazer um veículo guardado em outro lugar para onde a pessoa mora. Na mesma país, o caminhão-cegonha
 * (ou a própria estrada). De outro país: o frete (o navio, o voo de traslado do avião), a nacionalização (a
 * diferença de imposto entre os dois países, sobre o valor do usado) — e o país pode simplesmente não deixar
 * (o Brasil só aceita carro usado importado se for de coleção, com 30 anos ou mais).
 */
export function custoDeTrazer(v: Vida, b: Veiculo): { custo: number; bloqueio?: string; internacional: boolean } {
  const de = paisDaCidade(ondeEsta(v, b));
  const para = paisDaVida(v);
  const m = modeloVeiculo(b.modeloId);
  const c = Math.sqrt(economiaLocal(v.moradia.municipioId).custo);
  if (de === para) {
    const custo = m.categoria === 'bicicleta' ? 150 : m.categoria === 'aeronave' ? b.valor * 0.008 + 6000 : m.categoria === 'embarcacao' ? b.valor * 0.03 + 4000 : b.valor * 0.012 + (m.categoria === 'moto' ? 900 : 2600);
    return { custo: Math.round(custo * c / 100) * 100, internacional: false };
  }
  const regra = importaUsados(para);
  const anos = anosDoVeiculo(v, b);
  if (m.categoria !== 'bicicleta' && (regra === false || (regra === 'colecao' && anos < 30))) {
    return { custo: 0, internacional: true, bloqueio: regra === 'colecao' ? `${nomeDoPais(para)} não deixa entrar veículo usado importado — só de coleção, com 30 anos ou mais.` : `${nomeDoPais(para)} não deixa entrar veículo usado importado.` };
  }
  const frete = m.categoria === 'bicicleta' ? 400 : m.categoria === 'aeronave' ? b.valor * 0.03 + 25000 : m.categoria === 'embarcacao' ? b.valor * 0.07 + 20000 : b.valor * 0.03 + (m.categoria === 'moto' ? 4500 : 9000);
  const imposto = Math.max(0, tributoDeImportados(para) / tributoDeImportados(de) - 1) * b.valor * 0.8 + b.valor * 0.04;
  return { custo: Math.round((frete * c + (m.categoria === 'bicicleta' ? 0 : imposto)) / 100) * 100, internacional: true };
}

/** REWORK 12: restaurar um clássico — caro, e o valor que volta não é garantido (o mercado é que diz). */
export const custoDeRestaurar = (v: Vida, b: Veiculo) => Math.round(precoNovoDoVeiculo(b) * fatorDeImportado(paisDaCidade(ondeEsta(v, b)), 0.6) * 0.3 * Math.max(0.2, (95 - b.estado) / 50) / 100) * 100;

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
      if (guardadoLonge(v, b)) return { ok: false, motivo: 'Está guardado em outra cidade: primeiro, trazer.' };
      if ((b.problema?.gravidade ?? 0) >= 3) return { ok: false, motivo: 'Precisa de conserto antes de voltar a rodar.' };
      return { ok: true };
    case 'trazer': {
      if (!guardadoLonge(v, b)) return { ok: false, motivo: 'Já está com você.' };
      const t = custoDeTrazer(v, b);
      if (t.bloqueio) return { ok: false, motivo: t.bloqueio };
      return okDePagar(v, t.custo, t.internacional ? 'O frete e a nacionalização custam' : 'Trazer custa');
    }
    case 'principal':
      if (v.financas.veiculoPrincipal === b.id) return { ok: false, motivo: 'Já é o principal.' };
      if (guardadoLonge(v, b)) return { ok: false, motivo: 'Está guardado longe.' };
      if (['embarcacao', 'aeronave'].includes(modeloVeiculo(b.modeloId).categoria)) return { ok: false, motivo: 'Não é veículo do dia a dia.' };
      return veiculos(v).filter(x => !['embarcacao', 'aeronave'].includes(modeloVeiculo(x.modeloId).categoria)).length > 1 ? { ok: true } : { ok: false, motivo: 'É o único.' };
    case 'restaurar':
      if (modeloVeiculo(b.modeloId).segmento !== 'classico') return { ok: false, motivo: 'Restauração é coisa de clássico.' };
      if (b.estado >= 88) return { ok: false, motivo: 'Já está impecável.' };
      if (b.problema) return { ok: false, motivo: 'Primeiro, o conserto.' };
      return okDePagar(v, custoDeRestaurar(v, b), 'A restauração custa');
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
      if (p.gravidade === 3 && p.custo > b.valor * 0.4) escrever(v, { texto: `Pagou ${fmt(p.custo)} para ${textoVeiculo(b)} voltar a andar — quase metade do que ${gv(b, 'ele', 'ela')} valia.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
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
      // REWORK 12.4: o histórico de manutenção (as revisões entram na história do veículo; só as últimas importam).
      (b.historia ??= []).push({ t: v.t, texto: `Revisão (${fmt(custo)}).` });
      if (b.historia.length > 30) b.historia.splice(0, b.historia.length - 30);
      return `Revisão feita (${fmt(custo)}): óleo, filtros, a checagem de sempre. Menos chance de surpresa este ano.`;
    }
    case 'parar':
      b.parado = true;
      (b.historia ??= []).push({ t: v.t, texto: 'Ficou parado na garagem.' });
      return `${cap(textoVeiculo(b))} ficou ${gv(b, 'parado', 'parada')}: sem combustível nem seguro, mas também sem condução.`;
    case 'usar':
      b.parado = false;
      return `${cap(textoVeiculo(b))} voltou a rodar.`;
    case 'trazer': {
      const t = custoDeTrazer(v, b);
      v.financas.conta -= t.custo;
      const de = ondeEsta(v, b);
      b.local = undefined;
      b.parado = false;
      (b.historia ??= []).push({ t: v.t, texto: `Trazid${gv(b, 'o', 'a')} de ${nomeDoMunicipio(de)}${t.internacional ? ', com frete e nacionalização' : ''} (${fmt(t.custo)}).` });
      return `${cap(textoVeiculo(b))} chegou${t.internacional ? ', nacionalizad' + gv(b, 'o', 'a') : ''}. ${fmt(t.custo)} ${t.internacional ? 'entre frete, documentos e imposto' : 'de transporte'}.`;
    }
    case 'principal':
      v.financas.veiculoPrincipal = b.id;
      return `${cap(textoVeiculo(b))} passa a ser ${gv(b, 'o', 'a')} do dia a dia.`;
    case 'restaurar': {
      const custo = custoDeRestaurar(v, b);
      v.financas.conta -= custo;
      b.estado = 94;
      b.tRevisao = v.t;
      (b.historia ??= []).push({ t: v.t, texto: `Restaurad${gv(b, 'o', 'a')} (${fmt(custo)}).` });
      return `Meses de oficina, peça garimpada, pintura refeita: ${textoVeiculo(b)} está como saiu da fábrica. O quanto isso vale, o mercado diz (${fmt(custo)}).`;
    }
  }
}

/** Quanto se consegue vendendo hoje (menos o conserto pendente; financiado, o banco recebe primeiro). */
export function valorDeVenda(b: Veiculo, v?: Vida): number {
  // REWORK 12: o clássico e o exótico vendem com a comissão da garagem (mais cara); de longe, vende-se pior.
  const m = modeloVeiculo(b.modeloId);
  const k = m.segmento ? 0.88 : 0.92;
  const longe = v && guardadoLonge(v, b) ? 0.92 : 1;
  return Math.max(0, Math.round((b.valor * k * longe - (b.problema ? b.problema.custo * 0.8 : 0)) / 100) * 100);
}

/** Descrição do estado em palavras. */
export function estadoDoVeiculo(b: Veiculo): string {
  if (b.parado) return 'parado na garagem';
  if (b.problema) return b.problema.gravidade >= 3 ? `parado: ${b.problema.texto}` : `precisa de conserto: ${b.problema.texto}`;
  return b.estado >= 80 ? 'inteiro' : b.estado >= 60 ? 'bem cuidado' : b.estado >= 40 ? 'com as marcas do uso' : 'cansado';
}

