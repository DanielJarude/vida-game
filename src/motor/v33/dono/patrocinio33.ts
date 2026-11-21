/**
 * VIDA 33 · OS PATROCÍNIOS DE QUEM É DONO — o clube de futebol, os times de quadra e a organização de e-sports dividem o
 * mesmo departamento comercial: várias COTAS por time (o master da camisa, as cotas menores, o fornecedor do uniforme, o
 * naming rights da casa; no e-sports, periféricos, bebida e plataforma), e ninguém liga sozinho — o dono BUSCA
 * patrocinadores (cada busca custa e há um limite por ano), recebe propostas que valem até o fim do ano, negocia (pode
 * subir o valor ou a marca desistir), assina, e pode romper pagando multa. Algumas propostas trazem METAS (subir, ser campeão,
 * ir a um torneio internacional): cumprida, paga bônus; as metas "de cláusula" encerram o contrato quando falham.
 *
 * O departamento comercial (0 a 3) custa por ano e trabalha pelo dono: propostas melhores, mais buscas, a renovação
 * oferecida por quem gostou da parceria e uma proposta espontânea por ano.
 *
 * Folha: só o rng e os tipos. As marcas são todas fictícias (nenhuma empresa real); os setores respeitam a época (casa de
 * apostas só depois da lei de 2018; corretora de criptomoedas entre 2018 e 2022; banco digital e delivery por aplicativo
 * depois de 2015). Todo sorteio vem de `rngDe` de quem chama: nada mexe na sequência da vida.
 */
import { clamp, type Rng } from '../../rng';

export type Tipo33 = 'futebol' | 'quadra' | 'esports';
export type Cota33 = 'master' | 'secundario' | 'material' | 'naming' | 'perifericos' | 'bebida' | 'plataforma';

export interface Meta33 { tipo: 'subir' | 'titulo' | 'topo' | 'internacional' | 'nao_cair'; texto: string; /** Falhou, acabou. */ clausula?: boolean }
export interface Contrato33 { cota: Cota33; marca: string; setor: string; valor: number; desde: number; ate: number; rep: number; meta?: Meta33; bonus?: number }
export interface Oferta33 { id: string; cota: Cota33; marca: string; setor: string; valor: number; anos: number; rep: number; meta?: Meta33; bonus?: number; sobre: string; ano: number; renovacao?: boolean; negociada?: boolean }
export interface Comercial33 {
  contratos: Contrato33[]; ofertas: Oferta33[];
  /** 0 nenhum (o dono faz tudo) · 1 um gerente comercial · 2 um departamento · 3 uma agência de marketing esportivo. */
  departamento: 0 | 1 | 2 | 3;
  buscas: { ano: number; n: number };
  seq: number;
  hist: { ano: number; texto: string }[];
}
/** O que o time é agora (quem chama monta). */
export interface Contexto33 {
  tipo: Tipo33; ano: number;
  /** A receita base do ano do time (sem prêmios nem patrocínio): a régua de todas as cotas. */
  receitaBase: number;
  /** 0..100: a torcida (ou os fãs) e o nome. */
  fama: number; reputacao: number;
  /** Está na divisão mais alta que o time pode disputar? (as metas mudam: subir × ser campeão). */
  noTopo: boolean;
  /** Há uma casa que aceita nome (estádio ou ginásio próprio, gaming house)? */
  temCasa: boolean;
  /** Joga torneios internacionais (e-sports): a meta "internacional" faz sentido. */
  internacional?: boolean;
}
export interface Resultado33 { titulo: boolean; subiu: boolean; caiu: boolean; topo: boolean; internacional: boolean }

export const DEPARTAMENTOS33 = ['Sem departamento', 'Gerente comercial', 'Departamento comercial', 'Agência de marketing esportivo'] as const;

interface DefCota { id: Cota33; nome: string; sobre: string; peso: number; anos: [number, number]; casa?: boolean }
const COTAS: Record<Tipo33, DefCota[]> = {
  futebol: [
    { id: 'master', nome: 'Master da camisa', sobre: 'o peito da camisa: a cota mais cara', peso: 0.12, anos: [1, 3] },
    { id: 'secundario', nome: 'Cotas da camisa', sobre: 'costas, mangas e calção', peso: 0.05, anos: [1, 3] },
    { id: 'material', nome: 'Material esportivo', sobre: 'quem fornece e vende o uniforme', peso: 0.06, anos: [3, 5] },
    { id: 'naming', nome: 'Naming rights do estádio', sobre: 'o nome da empresa no estádio', peso: 0.08, anos: [5, 10], casa: true }
  ],
  quadra: [
    { id: 'master', nome: 'Master da camisa', sobre: 'no vôlei, no basquete e no futsal, a marca muitas vezes vira o nome do time', peso: 0.16, anos: [1, 3] },
    { id: 'secundario', nome: 'Cotas da camisa', sobre: 'costas, ombros e short', peso: 0.06, anos: [1, 2] },
    { id: 'material', nome: 'Material esportivo', sobre: 'quem fornece o uniforme e o tênis', peso: 0.05, anos: [2, 4] },
    { id: 'naming', nome: 'Naming rights do ginásio', sobre: 'o nome da empresa no ginásio', peso: 0.08, anos: [3, 6], casa: true }
  ],
  esports: [
    { id: 'master', nome: 'Patrocínio master', sobre: 'a camisa, as transmissões e o nome nas redes', peso: 0.14, anos: [1, 3] },
    { id: 'perifericos', nome: 'Periféricos e hardware', sobre: 'mouse, teclado, monitor e cadeira', peso: 0.07, anos: [1, 3] },
    { id: 'bebida', nome: 'Bebida e alimentação', sobre: 'o energético e o lanche das lives', peso: 0.05, anos: [1, 2] },
    { id: 'plataforma', nome: 'Parceiro de plataforma', sobre: 'banco, aplicativo, streaming ou apostas', peso: 0.06, anos: [1, 2] }
  ]
};
export const cotasDe33 = (t: Tipo33) => COTAS[t];
export const nomeDaCota33 = (t: Tipo33, c: Cota33) => COTAS[t].find(x => x.id === c)?.nome ?? c;

interface Setor { id: string; marca: (raiz: string) => string; desde?: number; ate?: number; rep: number; mult: number; sobre?: string }
const S = (id: string, marca: (r: string) => string, mult = 1, rep = 0, desde?: number, ate?: number, sobre?: string): Setor => ({ id, marca, mult, rep, desde, ate, sobre });
const SETORES: Record<Cota33, Setor[]> = {
  master: [
    S('banco', r => `Banco ${r}`, 1.05), S('tecnologia', r => `${r} Tech`, 1.05, 0, 1995), S('montadora', r => `${r} Motors`, 1),
    S('telefonia', r => `${r} Telecom`, 1, 0, 1997), S('supermercados', r => `Supermercados ${r}`, 0.85), S('companhia aérea', r => `${r} Linhas Aéreas`, 1.1),
    S('apostas', r => `${r}Bet`, 1.5, -2, 2018, undefined, 'paga muito — e parte da torcida torce o nariz'),
    S('criptomoedas', r => `${r} Coin`, 1.35, -1, 2018, 2022, 'paga bem; o setor é volátil'),
    S('delivery', r => `${r} Delivery`, 1, 0, 2015)
  ],
  secundario: [
    S('construtora', r => `Construtora ${r}`, 0.9), S('plano de saúde', r => `${r} Saúde`, 1), S('faculdade', r => `Faculdade ${r}`, 0.9),
    S('farmácias', r => `Farmácias ${r}`, 0.9), S('postos', r => `Postos ${r}`, 0.85), S('seguradora', r => `Seguros ${r}`, 1)
  ],
  material: [S('material esportivo', r => `${r} Sport`, 1)],
  naming: [S('banco', r => `Banco ${r}`, 1.05), S('seguradora', r => `Seguros ${r}`, 1), S('telefonia', r => `${r} Telecom`, 1, 0, 1997), S('tecnologia', r => `${r} Tech`, 1.05, 0, 1995)],
  perifericos: [S('periféricos', r => `${r} Gear`, 1), S('hardware', r => `${r} Hardware`, 1.05), S('cadeiras gamer', r => `${r} Seats`, 0.85, 0, 2010)],
  bebida: [S('energético', r => `${r} Energy`, 1), S('refrigerante', r => `${r} Cola`, 0.95), S('lanchonetes', r => `Lanches ${r}`, 0.85)],
  plataforma: [
    S('banco digital', r => `${r} Bank`, 1.05, 0, 2015), S('streaming', r => `${r} Play`, 1, 0, 2011), S('telefonia', r => `${r} Telecom`, 1, 0, 1997),
    S('apostas', r => `${r}Bet`, 1.5, -3, 2018, undefined, 'paga muito — e parte da comunidade torce o nariz'),
    S('criptomoedas', r => `${r} Coin`, 1.3, -1, 2018, 2022, 'paga bem; o setor é volátil')
  ]
};
const RAIZES = ['Horizonte', 'Aurora', 'Meridiano', 'Atlas', 'Vértice', 'Órbita', 'Pilar', 'Farol', 'Zênite', 'Prisma', 'Âmbar', 'Cobalto', 'Nimbus', 'Quasar', 'Boreal', 'Solaris', 'Alvorada', 'Tropical', 'Ventura', 'Rubi', 'Safira', 'Granito', 'Ipê', 'Jacarandá', 'Lúmen', 'Ônix', 'Trovão', 'Faísca', 'Ímpeto', 'Andorinha'];

const arred = (x: number) => (x >= 1e6 ? Math.round(x / 1e5) * 1e5 : Math.round(x / 1e4) * 1e4);
const ativos = (c: Comercial33, ano: number) => c.contratos.filter(x => x.desde <= ano && x.ate >= ano);

export function novoComercial33(): Comercial33 { return { contratos: [], ofertas: [], departamento: 0, buscas: { ano: 0, n: 0 }, seq: 0, hist: [] }; }

/** As cotas que o time pode vender agora (o naming só com casa própria). */
export const cotasDisponiveis33 = (ctx: Contexto33) => COTAS[ctx.tipo].filter(c => !c.casa || ctx.temCasa);
export const contratoDaCota33 = (c: Comercial33 | undefined, cota: Cota33, ano: number) => (c ? ativos(c, ano).find(x => x.cota === cota) : undefined);
/** O que os contratos pagam por ano agora. */
export const receitaDePatrocinio33 = (c: Comercial33 | undefined, ano: number) => (c ? ativos(c, ano).reduce((s, x) => s + x.valor, 0) : 0);
export const buscasPorAno33 = (c: Comercial33 | undefined) => 2 + (c?.departamento ?? 0);
export const buscasFeitas33 = (c: Comercial33 | undefined, ano: number) => (c && c.buscas.ano === ano ? c.buscas.n : 0);
/** Cada busca: o tempo do dono, as reuniões, as apresentações (com departamento, a estrutura já paga uma parte). */
export const custoDaBusca33 = (ctx: Contexto33, c?: Comercial33) => arred(Math.max(10000, ctx.receitaBase * 0.008) * (c?.departamento ? 0.6 : 1));
/** O departamento por ano. */
export const custoDoDepartamento33 = (ctx: Contexto33, nivel: number) => (nivel <= 0 ? 0 : arred(ctx.receitaBase * [0, 0.015, 0.03, 0.05][nivel] + [0, 40e3, 90e3, 180e3][nivel]));
/** A multa para romper um contrato: metade do que falta pagar (no mínimo, meio ano). */
export const multaDeRompimento33 = (x: Contrato33, ano: number) => arred(x.valor * 0.5 * Math.max(1, x.ate - ano));

function metaPara(ctx: Contexto33, r: Rng): Meta33 | undefined {
  if (!r.chance(0.45)) return undefined;
  const clausula = r.chance(0.35);
  if (ctx.internacional && r.chance(0.5)) return { tipo: 'internacional', texto: 'disputar um torneio internacional', clausula };
  if (!ctx.noTopo) return r.chance(0.6) ? { tipo: 'subir', texto: 'subir de divisão', clausula } : { tipo: 'nao_cair', texto: 'não cair', clausula: false };
  return r.chance(0.5) ? { tipo: 'titulo', texto: 'ser campeão', clausula } : { tipo: 'topo', texto: 'terminar entre os primeiros', clausula };
}

function gerarOferta(ctx: Contexto33, c: Comercial33, def: DefCota, r: Rng, ano: number, extra?: Partial<Oferta33>): Oferta33 {
  const setores = SETORES[def.id].filter(s => (s.desde ?? 0) <= ano && (s.ate === undefined || s.ate >= ano));
  const s = setores[Math.floor(r.next() * setores.length)];
  const raiz = RAIZES[Math.floor(r.next() * RAIZES.length)];
  const nome = (ctx.fama + ctx.reputacao) / 2;
  const valorBase = ctx.receitaBase * def.peso * (0.7 + nome / 160) * (1 + 0.07 * c.departamento) * s.mult * (0.85 + r.next() * 0.3);
  const meta = metaPara(ctx, r);
  const anos = def.anos[0] + Math.floor(r.next() * (def.anos[1] - def.anos[0] + 1));
  // A meta com cláusula paga mais no fixo; a meta comum, um bônus.
  const valor = arred(valorBase * (meta?.clausula ? 1.25 : 1));
  const bonus = meta ? arred(valor * (meta.clausula ? 0.25 : 0.5)) : undefined;
  c.seq += 1;
  const sobre = [anos === 1 ? 'um ano' : `${anos} anos`, s.sobre, meta ? (meta.clausula ? `cláusula: ${meta.texto}, ou o contrato acaba` : `bônus de ${Math.round((bonus ?? 0) / Math.max(1, valor) * 100)}% se ${meta.texto}`) : undefined].filter(Boolean).join(' · ');
  return { id: `p${c.seq}`, cota: def.id, marca: s.marca(raiz), setor: s.id, valor, anos, rep: s.rep, ...(meta ? { meta, bonus } : {}), sobre, ano, ...extra };
}

export type OpComercial33 =
  | { acao: 'buscar'; cota: Cota33 }
  | { acao: 'aceitar'; id: string }
  | { acao: 'negociar'; id: string }
  | { acao: 'recusar'; id: string }
  | { acao: 'romper'; cota: Cota33 }
  | { acao: 'departamento'; nivel: 0 | 1 | 2 | 3 };

/** O que impede (texto) — ou nada. `caixa` é o dinheiro do time. */
export function problemaComercial33(ctx: Contexto33, c: Comercial33 | undefined, op: OpComercial33, caixa: number): string | undefined {
  const ano = ctx.ano;
  switch (op.acao) {
    case 'buscar': {
      const def = cotasDisponiveis33(ctx).find(x => x.id === op.cota);
      if (!def) return op.cota === 'naming' ? 'O naming rights só se vende com casa própria (estádio ou ginásio ampliado).' : 'Essa cota não existe aqui.';
      if (contratoDaCota33(c, op.cota, ano)) return `A cota já tem contrato (${contratoDaCota33(c, op.cota, ano)!.marca}, até ${contratoDaCota33(c, op.cota, ano)!.ate}).`;
      if (buscasFeitas33(c, ano) >= buscasPorAno33(c)) return `Já foram ${buscasPorAno33(c)} buscas neste ano${c?.departamento ? '' : ' (um departamento comercial faz mais)'}.`;
      const custo = custoDaBusca33(ctx, c);
      return caixa >= custo ? undefined : `A busca custa ${custo.toLocaleString('pt-BR')} (reuniões e apresentações); o caixa não tem.`;
    }
    case 'aceitar': case 'negociar': case 'recusar': {
      const o = c?.ofertas.find(x => x.id === op.id && x.ano === ano);
      if (!o) return 'Essa proposta já não está na mesa.';
      if (op.acao === 'aceitar' && contratoDaCota33(c, o.cota, ano)) return 'A cota já tem contrato.';
      if (op.acao === 'negociar' && o.negociada) return 'Essa proposta já foi negociada: é pegar ou largar.';
      return undefined;
    }
    case 'romper': {
      const x = contratoDaCota33(c, op.cota, ano);
      if (!x) return 'Não há contrato nessa cota.';
      const multa = multaDeRompimento33(x, ano);
      return caixa >= multa ? undefined : `A multa é de ${multa.toLocaleString('pt-BR')}; o caixa não tem.`;
    }
    case 'departamento': return (c?.departamento ?? 0) === op.nivel ? 'Já é assim.' : undefined;
  }
}

/** Executa (o `problema` já foi checado). Devolve o texto e o que sai do caixa do time. */
export function executarComercial33(ctx: Contexto33, c: Comercial33, op: OpComercial33, r: Rng): { texto: string; custo: number; tom: 'bom' | 'ruim' | 'neutro' } {
  const ano = ctx.ano;
  switch (op.acao) {
    case 'buscar': {
      const def = cotasDisponiveis33(ctx).find(x => x.id === op.cota)!;
      const custo = custoDaBusca33(ctx, c);
      c.buscas = { ano, n: buscasFeitas33(c, ano) + 1 };
      c.ofertas = c.ofertas.filter(o => o.ano === ano && o.cota !== op.cota);
      // Quem não tem nome quase não é atendido: às vezes ninguém topa.
      const n = (ctx.fama + ctx.reputacao) / 2 < 6 && r.chance(0.35) ? 0 : 2 + (c.departamento >= 2 ? 1 : 0) - ((ctx.fama + ctx.reputacao) / 2 < 12 && r.chance(0.5) ? 1 : 0);
      for (let k = 0; k < n; k++) c.ofertas.push(gerarOferta(ctx, c, def, r, ano));
      return { texto: n ? `${n} empresa${n > 1 ? 's' : ''} ${n > 1 ? 'fizeram' : 'fez'} proposta para ${def.nome.toLowerCase()}. Valem até o fim do ano.` : `Nenhuma empresa se interessou por ${def.nome.toLowerCase()} desta vez: o time ainda tem pouco nome.`, custo, tom: n ? 'bom' : 'ruim' };
    }
    case 'aceitar': {
      const o = c.ofertas.find(x => x.id === op.id)!;
      c.contratos = c.contratos.filter(x => !(x.cota === o.cota && x.ate < ano));
      c.contratos.push({ cota: o.cota, marca: o.marca, setor: o.setor, valor: o.valor, desde: ano, ate: ano + o.anos - 1, rep: o.rep, ...(o.meta ? { meta: o.meta, bonus: o.bonus } : {}) });
      c.ofertas = c.ofertas.filter(x => x.cota !== o.cota);
      c.hist.unshift({ ano, texto: `Contrato com ${o.marca} (${nomeDaCota33(ctx.tipo, o.cota).toLowerCase()}): ${o.valor.toLocaleString('pt-BR')} por ano até ${ano + o.anos - 1}.` });
      if (c.hist.length > 20) c.hist.length = 20;
      return { texto: `${o.marca} fechou: ${nomeDaCota33(ctx.tipo, o.cota).toLowerCase()} até ${ano + o.anos - 1}.`, custo: 0, tom: 'bom' };
    }
    case 'negociar': {
      const o = c.ofertas.find(x => x.id === op.id)!;
      const p = clamp(0.35 + ctx.reputacao / 250 + c.departamento * 0.08, 0.15, 0.85);
      if (r.chance(p)) {
        o.valor = arred(o.valor * 1.15); if (o.bonus) o.bonus = arred(o.bonus * 1.15); o.negociada = true;
        return { texto: `${o.marca} subiu a proposta: ${o.valor.toLocaleString('pt-BR')} por ano.`, custo: 0, tom: 'bom' };
      }
      c.ofertas = c.ofertas.filter(x => x.id !== o.id);
      return { texto: `${o.marca} não gostou da contraproposta e desistiu.`, custo: 0, tom: 'ruim' };
    }
    case 'recusar': { const o = c.ofertas.find(x => x.id === op.id)!; c.ofertas = c.ofertas.filter(x => x.id !== o.id); return { texto: `Proposta de ${o.marca} recusada.`, custo: 0, tom: 'neutro' }; }
    case 'romper': {
      const x = contratoDaCota33(c, op.cota, ano)!;
      const multa = multaDeRompimento33(x, ano);
      x.ate = ano - 1;
      c.hist.unshift({ ano, texto: `Contrato com ${x.marca} rompido (multa de ${multa.toLocaleString('pt-BR')}).` });
      return { texto: `Contrato com ${x.marca} rompido: a cota está livre.`, custo: multa, tom: 'neutro' };
    }
    case 'departamento': {
      c.departamento = op.nivel;
      return { texto: op.nivel ? `${DEPARTAMENTOS33[op.nivel]}: ${custoDoDepartamento33(ctx, op.nivel).toLocaleString('pt-BR')} por ano.` : 'O departamento comercial foi desfeito: as buscas voltam a ser com você.', custo: 0, tom: 'neutro' };
    }
  }
}

/**
 * A temporada que fechou (`ano`): o que os contratos pagaram, os bônus e as cláusulas das metas, o custo do departamento,
 * os contratos que acabam — e, para o ano novo (`ctxNovo`), as renovações e a proposta espontânea do departamento.
 */
export function fecharAnoComercial33(ctxNovo: Contexto33, c: Comercial33, ano: number, res: Resultado33, r: Rng): { receita: number; bonus: number; despesa: number; rep: number; textos: string[] } {
  let receita = 0, bonus = 0, rep = 0;
  const textos: string[] = [];
  for (const x of ativos(c, ano)) {
    receita += x.valor; rep += x.rep;
    if (!x.meta) continue;
    const ok = x.meta.tipo === 'subir' ? res.subiu : x.meta.tipo === 'titulo' ? res.titulo : x.meta.tipo === 'topo' ? res.topo || res.titulo : x.meta.tipo === 'internacional' ? res.internacional : !res.caiu;
    if (ok && x.bonus) { bonus += x.bonus; textos.push(`${x.marca} pagou o bônus da meta (${x.meta.texto}).`); }
    else if (!ok && x.meta.clausula && x.ate > ano) { x.ate = ano; textos.push(`A meta do contrato com ${x.marca} (${x.meta.texto}) não veio: a cláusula encerrou o patrocínio.`); }
  }
  const despesa = custoDoDepartamento33(ctxNovo, c.departamento);
  // O ano novo: as propostas velhas caem; quem termina contrato e gostou oferece renovar; o departamento traz uma proposta.
  const novo = ctxNovo.ano;
  c.ofertas = [];
  for (const x of c.contratos.filter(y => y.ate === ano)) {
    const def = cotasDisponiveis33(ctxNovo).find(d => d.id === x.cota);
    if (!def || x.rep < -1) continue;
    if (c.departamento >= 1 || r.chance(0.45)) {
      const o = gerarOferta(ctxNovo, c, def, r, novo, { renovacao: true });
      c.ofertas.push({ ...o, marca: x.marca, setor: x.setor, rep: x.rep, sobre: `renovação · ${o.sobre}` });
    }
    textos.push(`Terminou o contrato com ${x.marca} (${nomeDaCota33(ctxNovo.tipo, x.cota).toLowerCase()}).`);
  }
  c.contratos = c.contratos.filter(y => y.ate >= novo || novo - y.ate <= 3).slice(-16);
  if (c.departamento >= 1) {
    const livres = cotasDisponiveis33(ctxNovo).filter(d => !contratoDaCota33(c, d.id, novo) && !c.ofertas.some(o => o.cota === d.id));
    if (livres.length) c.ofertas.push(gerarOferta(ctxNovo, c, livres[Math.floor(r.next() * livres.length)], r, novo));
  }
  return { receita, bonus, despesa, rep, textos };
}

/** Saves: o que vier quebrado volta vazio. */
export function normalizarComercial33(x: unknown): Comercial33 | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const c = x as Partial<Comercial33>;
  return {
    contratos: Array.isArray(c.contratos) ? c.contratos.filter(k => k && typeof k.valor === 'number' && typeof k.ate === 'number') : [],
    ofertas: Array.isArray(c.ofertas) ? c.ofertas.filter(k => k && typeof k.id === 'string') : [],
    departamento: ([0, 1, 2, 3] as const).includes(c.departamento as 0) ? c.departamento as 0 : 0,
    buscas: c.buscas && typeof c.buscas.ano === 'number' ? c.buscas : { ano: 0, n: 0 },
    seq: typeof c.seq === 'number' ? c.seq : 0,
    hist: Array.isArray(c.hist) ? c.hist.slice(0, 20) : []
  };
}
/** Um contrato antigo (o patrocínio único de antes da VIDA 33) vira a cota master. */
export function contratoAntigo33(p: { nome: string; valor: number; ate: number; rep?: number } | undefined, desde: number): Contrato33 | undefined {
  if (!p || typeof p.valor !== 'number' || typeof p.ate !== 'number') return undefined;
  return { cota: 'master', marca: p.nome.replace(/^uma? /i, m => m[0].toUpperCase() + m.slice(1)), setor: 'contrato anterior', valor: p.valor, desde: Math.min(desde, p.ate), ate: p.ate, rep: p.rep ?? 0 };
}
