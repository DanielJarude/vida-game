/**
 * VIDA 17 · A FUNÇÃO DE CADA MÓVEL — o espaço (m², `moveis14`) dizia se cabia; faltava dizer se FAZ SENTIDO.
 *
 * O problema: os modelos de sofá são produtos diferentes, então dava para comprar um sofá, depois outro, depois outro —
 * e todos iam para a mesma sala, um em cima do outro na ilustração. Agora cada móvel que ocupa uma POSIÇÃO FUNCIONAL
 * tem a sua função, com as vagas dela:
 *
 *   por cômodo   a cama (uma por quarto), o guarda-roupa e a penteadeira (um por quarto), o sofá e a mesa de centro (um
 *                por sala), a banheira (uma por banheiro), a escrivaninha (uma por quarto ou escritório);
 *   por casa     a mesa de jantar, a geladeira, o fogão, a lavadora, a lava-louças, a ilha, o closet, a lareira, a
 *                churrasqueira, o espaço gourmet, a mesa de bilhar.
 *
 * O que não tem função (poltrona, criado-mudo, estante, cadeira, planta, quadro, tapete, espreguiçadeira) segue só a
 * regra do espaço: quantas couberem. Comprar:
 *
 *   com vaga     a peça vai para o cômodo da vaga — a 2ª cama vai para o 2º quarto, a 3ª para o 3º, e assim por diante
 *                (o mesmo produto pode se repetir: duas camas de solteiro em dois quartos);
 *   sem vaga     a loja oferece TROCAR (a antiga vai para o depósito, ou o proprietário a guarda, no aluguel mobiliado)
 *                e diz por que não dá para ter mais uma ("todos os 2 quartos já têm cama").
 *
 * Saves antigos com peças repetidas: a normalização redistribui o que sobra para outro cômodo com vaga; o resto vai para
 * o depósito (nunca some; dá para retirar ou trocar depois, pela Casa).
 */
import type { CoisaTida, Vida } from '../../tipos';
import type { TipoComodo } from '../../dados/lar';
import { coisa } from '../../dados/coisas';
import { casaDaFamilia, comodoDaCoisa, comodosDaCasa, naCasaAtual, type ComodoDaCasa } from '../../sistemas/lar';
import { DEPOSITO, espacoDoComodo, ocupa14 } from './moveis14';

export interface Funcao17 {
  id: string;
  /** O nome da função ("cama", "sofá"), com o artigo. */
  nome: string;
  artigo: 'o' | 'a';
  ids: string[];
  /** Os cômodos onde a função existe (na ordem de preferência). */
  comodos: TipoComodo[];
  /** Por cômodo (cada cômodo dos tipos acima tem uma vaga) ou por casa (uma vaga na casa inteira). */
  vagas: 'comodo' | 'casa';
  /** O nome do lugar, para a frase ("quarto", "sala", "banheiro"). */
  lugar: [string, string];
}

export const FUNCOES17: Funcao17[] = [
  { id: 'cama', nome: 'cama', artigo: 'a', ids: ['colchao', 'cama_box', 'cama_king', 'colchao_hotel', 'cama_solteiro', 'beliche'], comodos: ['quarto', 'quarto_extra'], vagas: 'comodo', lugar: ['quarto', 'quartos'] },
  { id: 'guarda_roupa', nome: 'guarda-roupa', artigo: 'o', ids: ['guarda_roupa'], comodos: ['quarto', 'quarto_extra'], vagas: 'comodo', lugar: ['quarto', 'quartos'] },
  { id: 'penteadeira', nome: 'penteadeira', artigo: 'a', ids: ['penteadeira'], comodos: ['quarto', 'quarto_extra'], vagas: 'comodo', lugar: ['quarto', 'quartos'] },
  { id: 'sofa', nome: 'sofá', artigo: 'o', ids: ['sofa', 'sofa_retratil', 'sofa_couro', 'sofa_designer'], comodos: ['sala'], vagas: 'comodo', lugar: ['sala', 'salas'] },
  { id: 'mesa_centro', nome: 'mesa de centro', artigo: 'a', ids: ['mesa_centro', 'mesa_centro_marmore'], comodos: ['sala'], vagas: 'comodo', lugar: ['sala', 'salas'] },
  { id: 'banheira', nome: 'banheira', artigo: 'a', ids: ['banheira', 'banheira_pedra'], comodos: ['banheiro'], vagas: 'comodo', lugar: ['banheiro', 'banheiros'] },
  { id: 'escrivaninha', nome: 'mesa de trabalho', artigo: 'a', ids: ['escrivaninha', 'mesa_executiva'], comodos: ['escritorio', 'quarto', 'quarto_extra'], vagas: 'comodo', lugar: ['cômodo', 'cômodos'] },
  { id: 'mesa_jantar', nome: 'mesa de jantar', artigo: 'a', ids: ['mesa_jantar'], comodos: ['sala', 'cozinha'], vagas: 'casa', lugar: ['casa', 'casa'] },
  { id: 'geladeira', nome: 'geladeira', artigo: 'a', ids: ['geladeira', 'geladeira_inox'], comodos: ['cozinha'], vagas: 'casa', lugar: ['cozinha', 'cozinhas'] },
  { id: 'fogao', nome: 'fogão', artigo: 'o', ids: ['fogao', 'cooktop_forno', 'fogao_profissional'], comodos: ['cozinha'], vagas: 'casa', lugar: ['cozinha', 'cozinhas'] },
  { id: 'lavadora', nome: 'lavadora', artigo: 'a', ids: ['maquina_lavar'], comodos: ['cozinha'], vagas: 'casa', lugar: ['casa', 'casa'] },
  { id: 'lava_loucas', nome: 'lava-louças', artigo: 'a', ids: ['lava_loucas'], comodos: ['cozinha'], vagas: 'casa', lugar: ['cozinha', 'cozinhas'] },
  { id: 'ilha', nome: 'ilha de cozinha', artigo: 'a', ids: ['ilha_cozinha'], comodos: ['cozinha'], vagas: 'casa', lugar: ['cozinha', 'cozinhas'] },
  { id: 'closet', nome: 'closet', artigo: 'o', ids: ['closet'], comodos: ['quarto'], vagas: 'casa', lugar: ['casa', 'casa'] },
  { id: 'lareira', nome: 'lareira', artigo: 'a', ids: ['lareira'], comodos: ['sala'], vagas: 'casa', lugar: ['casa', 'casa'] },
  { id: 'churrasqueira', nome: 'churrasqueira', artigo: 'a', ids: ['churrasqueira'], comodos: ['lazer', 'jardim'], vagas: 'casa', lugar: ['casa', 'casa'] },
  { id: 'gourmet', nome: 'espaço gourmet', artigo: 'o', ids: ['espaco_gourmet'], comodos: ['lazer', 'jardim'], vagas: 'casa', lugar: ['casa', 'casa'] },
  { id: 'bilhar', nome: 'mesa de bilhar', artigo: 'a', ids: ['mesa_sinuca', 'bilhar_profissional'], comodos: ['jogos', 'sala'], vagas: 'casa', lugar: ['casa', 'casa'] }
];

const POR_ID = new Map(FUNCOES17.flatMap(f => f.ids.map(id => [id, f] as const)));
export const funcaoDe17 = (coisaId: string): Funcao17 | undefined => POR_ID.get(coisaId);

/** As peças em casa (as suas e as do proprietário) de uma função. */
function ocupantes(v: Vida, f: Funcao17): CoisaTida[] {
  return (v.financas.coisas ?? []).filter(t => naCasaAtual(t) && f.ids.includes(t.coisaId));
}

/** Os cômodos da casa onde a função existe, na ordem (o quarto principal antes do 2º, do 3º…). */
function comodosDaFuncao(v: Vida, f: Funcao17): ComodoDaCasa[] {
  const cs = comodosDaCasa(v);
  return f.comodos.flatMap(tipo => cs.filter(c => c.tipo === tipo));
}

export interface Vaga17 {
  funcao: Funcao17;
  /** O cômodo com vaga (onde a peça nova vai). Ausente: não há vaga. */
  livre?: ComodoDaCasa;
  /** As peças que já ocupam a função (para trocar). */
  ocupantes: { t: CoisaTida; comodo?: ComodoDaCasa }[];
  /** Quantas vagas a casa tem para essa função. */
  capacidade: number;
  /** O porquê, quando não há vaga (a frase da loja). */
  motivo?: string;
}

/**
 * A vaga de uma peça nova. `undefined`: a peça não tem função (só o espaço decide), ou a casa não é sua para mobiliar
 * (a casa da família), ou não há planta (sem cômodos).
 */
export function vagaPara17(v: Vida, coisaId: string): Vaga17 | undefined {
  const f = funcaoDe17(coisaId);
  if (!f || casaDaFamilia(v)) return undefined;
  const todos = comodosDaCasa(v);
  if (!todos.length) return undefined;
  const lugares = comodosDaFuncao(v, f);
  const occ = ocupantes(v, f).map(t => ({ t, comodo: comodoDaCoisa(v, t, todos) }));
  if (f.vagas === 'casa') {
    const capacidade = 1;
    const livre = occ.length < capacidade ? (lugares[0] ?? undefined) : undefined;
    return { funcao: f, livre: livre ?? (occ.length < capacidade ? todos[0] : undefined), ocupantes: occ, capacidade, motivo: occ.length >= capacidade ? `A casa já tem ${f.artigo === 'a' ? 'uma' : 'um'} ${f.nome} (${nomeDe(occ[0].t)}). Para levar ${f.artigo === 'a' ? 'esta' : 'este'}, troque.` : undefined };
  }
  const contagem = new Map<string, number>();
  for (const o of occ) if (o.comodo) contagem.set(o.comodo.id, (contagem.get(o.comodo.id) ?? 0) + 1);
  const livre = lugares.find(c => !contagem.get(c.id));
  const n = lugares.length;
  const motivo = livre ? undefined
    : n === 0 ? `A casa não tem ${f.lugar[0] === 'cômodo' ? 'cômodo para isso' : `${f.lugar[0]}`}: ${f.artigo === 'a' ? 'uma' : 'um'} ${f.nome} não teria onde ficar.`
      : n === 1 ? `${cap(f.artigo)} ${f.lugar[0]} já tem ${f.artigo === 'a' ? 'uma' : 'um'} ${f.nome} (${nomeDe(occ[0].t)}). Para levar ${f.artigo === 'a' ? 'esta' : 'este'}, troque${f.id === 'cama' ? ' — ou more numa casa com mais quartos' : ''}.`
        : `${f.lugar[0] === 'sala' ? 'Todas as' : 'Todos os'} ${n} ${f.lugar[1]} já têm ${f.nome}. Para levar mais ${f.artigo === 'a' ? 'uma' : 'um'}, troque ${f.artigo === 'a' ? 'uma delas' : 'um deles'}${f.id === 'cama' ? ' — ou more numa casa com mais quartos' : ''}.`;
  return { funcao: f, livre, ocupantes: occ, capacidade: n, motivo };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nomeDe = (t: CoisaTida) => coisa(t.coisaId)?.nome ?? t.coisaId;

/** Pode trocar esta peça pela nova? (Da mesma função, em casa.) */
export function podeTrocar17(v: Vida, coisaId: string, sai: string): boolean {
  const f = funcaoDe17(coisaId);
  const t = (v.financas.coisas ?? []).find(x => x.id === sai);
  return !!f && !!t && naCasaAtual(t) && f.ids.includes(t.coisaId) && !t.lembranca;
}

/**
 * Depois de comprar uma peça com função: põe no cômodo da vaga (ou no lugar da que saiu, numa troca). A que sai vai
 * para o depósito (a do proprietário, ele guarda). Devolve a frase do que aconteceu.
 */
export function posicionar17(v: Vida, nova: CoisaTida, sai?: string): string | undefined {
  const f = funcaoDe17(nova.coisaId);
  if (!f || casaDaFamilia(v) || !comodosDaCasa(v).length) return undefined;
  if (sai) {
    const velha = (v.financas.coisas ?? []).find(x => x.id === sai);
    if (velha) {
      const lugar = comodoDaCoisa(v, velha);
      if (velha.doImovel) {
        const mob = v.moradia.mobilia14;
        if (mob) (mob.devolvidos ??= []).push({ coisaId: velha.coisaId, cor: velha.cor, acabamento: velha.acabamento, preco: velha.preco });
        v.financas.coisas = (v.financas.coisas ?? []).filter(x => x.id !== velha.id);
      } else velha.local = DEPOSITO;
      nova.local = undefined;
      nova.comodo = lugar?.id;
      return `${cap(nomeDe(velha))} saiu ${velha.doImovel ? '(o proprietário guardou)' : 'para o depósito'}; ${nomeDe(nova)} ficou no lugar${lugar ? `, n${lugar.nome.startsWith('a') ? 'a' : 'o'} ${lugar.nome}` : ''}.`;
    }
  }
  // Calcula a vaga sem a peça nova.
  const antes = nova.local;
  nova.local = DEPOSITO;
  const vg = vagaPara17(v, nova.coisaId);
  nova.local = antes;
  if (!vg?.livre) { nova.local = DEPOSITO; return `Não havia vaga: ${vg?.motivo ?? 'foi para o depósito.'}`; }
  nova.comodo = vg.livre.id;
  nova.local = undefined;
  // O espaço (m²) do cômodo também conta.
  const esp = espacoDoComodo(v, vg.livre);
  if (esp.usado > esp.capacidade + 0.05) { nova.local = DEPOSITO; return `N${vg.livre.nome.startsWith('a') ? 'a' : 'o'} ${vg.livre.nome} não coube (${String(Math.max(0, esp.capacidade - (esp.usado - ocupa14(nova.coisaId)))).replace('.', ',')} m² livres): foi para o depósito.`; }
  const ordem = vg.funcao.vagas === 'comodo' && vg.capacidade > 1 && vg.ocupantes.length >= 1;
  return ordem ? `Foi para ${vg.livre.nome.startsWith('a') ? 'a' : 'o'} ${vg.livre.nome}.` : undefined;
}

/**
 * Saves antigos (e mobílias que se somaram): mais peças que vagas numa função. O que sobra vai para outro cômodo com
 * vaga; sem vaga, para o depósito. Fica a peça mais nova no lugar (a última comprada). Devolve quantas mudaram.
 */
export function organizarFuncoes17(v: Vida): number {
  if (casaDaFamilia(v) || !comodosDaCasa(v).length) return 0;
  let n = 0;
  for (const f of FUNCOES17) {
    const occ = ocupantes(v, f);
    if (occ.length <= 1 && f.vagas === 'casa') continue;
    const todos = comodosDaCasa(v);
    const lugares = comodosDaFuncao(v, f);
    if (f.vagas === 'casa') {
      // Fica a do proprietário (não se tira dele) ou a mais nova; as outras vão para o depósito.
      const fica = occ.find(t => t.doImovel) ?? [...occ].sort((a, b) => b.t - a.t)[0];
      for (const t of occ) if (t !== fica && !t.doImovel) { t.local = DEPOSITO; n++; }
      continue;
    }
    const porComodo = new Map<string, CoisaTida[]>();
    for (const t of occ) { const c = comodoDaCoisa(v, t, todos); if (c) porComodo.set(c.id, [...(porComodo.get(c.id) ?? []), t]); }
    const sobra: CoisaTida[] = [];
    for (const [cid, ts] of porComodo) {
      const valido = lugares.some(c => c.id === cid);
      const ord = [...ts].sort((a, b) => (b.doImovel ? 1 : 0) - (a.doImovel ? 1 : 0) || b.t - a.t);
      sobra.push(...(valido ? ord.slice(1) : ord));
      for (const t of valido ? ord.slice(1) : ord) porComodo.set(cid, (porComodo.get(cid) ?? []).filter(x => x !== t));
    }
    for (const t of sobra) {
      if (t.doImovel) continue;
      const livre = lugares.find(c => !(porComodo.get(c.id) ?? []).length);
      if (livre) { t.comodo = livre.id; t.local = undefined; porComodo.set(livre.id, [t]); }
      else t.local = DEPOSITO;
      n++;
    }
  }
  return n;
}
