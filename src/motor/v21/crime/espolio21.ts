/**
 * VIDA 21 · O QUE VEIO DO ROUBO — os bens concretos do crime, o mercado paralelo e o que vem depois.
 *
 *   A PARTE      um serviço do ramo de furtos e roubos (e as encomendas desse ramo) que dá certo rende a MESMA parte de
 *                antes — só que agora dividida em dinheiro em espécie (vai para o saldo, como sempre) e bens: o celular,
 *                a corrente de ouro, o relógio, a bolsa de grife, a gravura, a carga de pneus, o carro. O valor que o
 *                mercado paralelo paga pelos bens soma o que antes vinha em dinheiro: a economia não muda; muda o que se
 *                vê e o que se decide. Nem todo serviço rende bem: às vezes era só dinheiro; às vezes, um engano (a
 *                corrente era folheada, o celular estava bloqueado).
 *   O DESTINO    cada bem tem as saídas que fazem sentido para ele: guardar (escondido), usar (o celular, o carro sem
 *                documento, o quadro na parede), vestir (joia, relógio, bolsa e roupa vão para a Aparência — as peças
 *                do guarda-roupa de sempre, marcadas pela origem), vender, ou se livrar. Dinheiro não é bem: entra no saldo.
 *   O MERCADO    compradores diferentes (o receptador do bairro, a loja de usados, o comprador de ouro, o desmanche, o
 *                colecionador que não pergunta), cada um com o que compra, quanto paga, o risco e o nome no meio que
 *                exige. A procura muda por ano e por categoria; o bem "quente" (recém-levado, rastreável) vale menos e
 *                arrisca mais. O nome no mercado paralelo sobe com venda limpa e abre os compradores melhores.
 *   O DEPOIS     o que é rastreável e está em uso pode ser achado (o IMEI, a blitz, o relógio reconhecido); a venda pode
 *                dar errado (o informante, a loja vigiada); o processo traz a busca. Cada um desses tira o bem, soma
 *                exposição e pode abrir a investigação — e a investigação segue o caminho de sempre (`ilicito`, `justica`:
 *                processo, julgamento, condenação, prisão são etapas próprias, não um resultado automático).
 *
 * Sorteios derivados (`rngDe`): não mexem no acaso da vida. Nada aqui ensina coisa alguma: objetos, números, consequência.
 */
import type { Vida } from '../../tipos';
import { clamp, rngDe, type Rng } from '../../rng';
import { escrever } from '../../nucleo';
import { dinheiro } from '../../texto';
import { anoDe } from '../../tempo';
import { economiaLocal } from '../../dados/lugares';
import { itemEstilo } from '../../dados/estilo';
import { movimentoPorFora } from '../../sistemas/porFora';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { COMPRADORES21, FRACAO_DO_MERCADO21, MODELOS_ESPOLIO21, type BemIlicito21, type CategoriaDoEspolio21, type Comprador21, type Espolio21, type ModeloDoEspolio21 } from '../../dados21/crime/espolio21';

export const espolio21 = (v: Vida): Espolio21 => (v.espolio21 ??= { bens: [], reputacao: 0, historico: [] });
export const bensIlicitos21 = (v: Vida): BemIlicito21[] => v.espolio21?.bens ?? [];
const fator = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;

function precoDoModelo(v: Vida, m: ModeloDoEspolio21): number {
  const base = m.preco ?? (m.estiloId ? itemEstilo(m.estiloId)?.preco ?? 1000 : 1000);
  return Math.round(base * fator(v) / 10) * 10;
}

/** O que o mercado paralelo pagaria de referência (sem a procura do ano, sem o comprador). */
export const baseNoMercado21 = (b: Pick<BemIlicito21, 'valor' | 'categoria'>) => b.valor * FRACAO_DO_MERCADO21[b.categoria];

/* ============================================================================ A parte de um serviço */

export interface Parte21 { dinheiro: number; bens: BemIlicito21[] }

/**
 * Divide a parte de quem fez (`parte`: o que antes entrava todo em dinheiro) em dinheiro em espécie e bens. Os bens entram
 * no espólio; o dinheiro NÃO é pago aqui (quem chama paga, pelo caminho de sempre). `patamar`: o nível no meio (1..3).
 */
export function repartir21(v: Vida, parte: number, escala: 1 | 3, origem: string, patamar = 1): Parte21 {
  const r = rngDe(v.id, 'espolio21', v.t, origem, bensIlicitos21(v).length, espolio21(v).historico.length);
  // Às vezes era só dinheiro (o caixa, a carteira, o pagamento combinado).
  if (parte <= 0 || r.chance(escala === 3 ? 0.15 : 0.3)) return { dinheiro: Math.max(0, parte), bens: [] };
  let dinheiroVivo = Math.round(parte * (escala === 3 ? r.int(5, 30) : r.int(10, 45)) / 100);
  let resta = parte - dinheiroVivo;
  const bens: BemIlicito21[] = [];
  const elegiveis = MODELOS_ESPOLIO21.filter(m => m.escala <= escala && (m.patamar ?? 1) <= patamar);
  for (let k = 0; k < (escala === 3 ? 3 : 2) && resta > 0; k++) {
    // O que cabe na parte (com folga de 30%); o engano entra raramente, o raro mais raramente ainda.
    const cabem = elegiveis.filter(m => FRACAO_DO_MERCADO21[m.categoria] * precoDoModelo(v, m) <= resta * 1.3 && (k === 0 || !bens.some(b => b.modelo === m.id)));
    if (!cabem.length) break;
    const m = r.weighted(cabem, x => (x.engano ? 0.25 : x.raro ? 0.35 : 1) * (x.escala === escala ? 1.6 : 1));
    if (!m) break;
    const valor = precoDoModelo(v, m);
    bens.push(novoBem(v, m, valor, origem, bens.length));
    resta -= baseNoMercado21({ valor, categoria: m.categoria });
    // Um bem grande basta (não sai de um serviço uma carga, um carro e um quadro).
    if (m.categoria === 'veiculo' || m.categoria === 'mercadoria' || m.categoria === 'arte') break;
  }
  if (!bens.length) return { dinheiro: Math.max(0, parte), bens: [] };
  dinheiroVivo += Math.max(0, Math.round(resta));
  dinheiroVivo = Math.round(dinheiroVivo / 50) * 50;
  espolio21(v).bens.push(...bens);
  return { dinheiro: dinheiroVivo, bens };
}

function novoBem(v: Vida, m: ModeloDoEspolio21, valor: number, origem: string, k: number): BemIlicito21 {
  return {
    id: `esp${v.t}_${bensIlicitos21(v).length + k}_${m.id}`, modelo: m.id, categoria: m.categoria, nome: m.nome, valor, t: v.t, origem,
    rastreavel: m.rastreavel, ...(m.raro ? { raro: true } : {}), ...(m.engano ? { engano: true } : {}),
    calor: m.rastreavel ? 80 : 55, estado: 'escondido', ...(m.estiloId ? { estiloId: m.estiloId } : {})
  };
}

const umOuUma = (c: CategoriaDoEspolio21) => (['joia', 'bolsa', 'roupa', 'arte', 'mercadoria', 'colecionavel'].includes(c) ? 'uma' : 'um');

/** "R$ 800 em espécie, um relógio de mergulho e um celular top de linha". */
export function textoDaParte21(p: Parte21): string {
  const itens = p.bens.map(b => (/^(Caixas|Garrafas|Eletrodomésticos|Ferramentas|Brincos|Lote)/.test(b.nome) ? b.nome.charAt(0).toLowerCase() + b.nome.slice(1) : `${umOuUma(b.categoria)} ${b.nome.charAt(0).toLowerCase()}${b.nome.slice(1)}`));
  const partes = [...(p.dinheiro > 0 ? [`${dinheiro(p.dinheiro)} em espécie`] : []), ...itens];
  return partes.length <= 1 ? (partes[0] ?? 'nada') : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/* ============================================================================ O mercado paralelo */

/** A procura do ano por categoria (0,75–1,25): o ouro sobe, o celular de um modelo antigo cai. */
export function procura21(v: Vida, c: CategoriaDoEspolio21): number {
  return 0.75 + rngDe(v.id, 'procura21', c, anoDe(v.t)).next() * 0.5;
}

export interface Oferta21 { comprador: Comprador21; nome: string; preco: number; risco: number; liberado: boolean; motivo?: string; descricao: string }

/** Quem compraria este bem, por quanto, com que risco — e quem ainda não negocia com você (e por quê). */
export function ofertas21(v: Vida, b: BemIlicito21): Oferta21[] {
  const es = espolio21(v);
  const cautela = !!v.caminhos.envolvimento?.cautela;
  return (Object.keys(COMPRADORES21) as Comprador21[]).filter(c => COMPRADORES21[c].compra.includes(b.categoria)).map(c => {
    const p = COMPRADORES21[c];
    const reputacaoPaga = 1 + es.reputacao / 400;
    const raro = b.raro && c === 'colecionador' ? 1.3 : b.raro && c === 'bairro' ? 0.6 : 1;
    const engano = b.engano ? 0.4 : 1;
    const preco = Math.round(baseNoMercado21(b) * p.paga * procura21(v, b.categoria) * (1 - b.calor / 250) * reputacaoPaga * raro * engano / 10) * 10;
    const risco = clamp(p.risco * (1 + b.calor / 100) * (b.rastreavel ? 1.4 : 1) * (cautela ? 0.7 : 1) * (1 - es.reputacao / 250), 0.01, 0.6);
    const liberado = es.reputacao >= p.reputacao;
    return { comprador: c, nome: p.nome, preco, risco, liberado, descricao: p.descricao, ...(liberado ? {} : { motivo: `Só negocia com quem já tem nome no meio (${p.reputacao}+; o seu: ${Math.round(es.reputacao)}).` }) };
  });
}

/* ============================================================================ As saídas de cada bem */

export type OqueEspolio21 = 'vender' | 'usar' | 'guardar' | 'descartar';

/** O que dá para fazer com este bem (as saídas que fazem sentido para ele). */
export function saidas21(b: BemIlicito21): OqueEspolio21[] {
  const out: OqueEspolio21[] = [];
  if (b.estado !== 'escondido') out.push('guardar');
  if (b.estado === 'escondido' && b.categoria !== 'mercadoria') out.push('usar');
  out.push('vender', 'descartar');
  return out;
}

export function rotuloDaSaida21(b: BemIlicito21, oque: OqueEspolio21): string {
  if (oque === 'usar') return b.estiloId ? 'Usar (vai para a Aparência)' : b.categoria === 'veiculo' ? 'Rodar com ele (sem documento)' : b.categoria === 'arte' || b.categoria === 'colecionavel' ? 'Deixar em casa, à vista' : 'Usar';
  if (oque === 'guardar') return 'Guardar escondido';
  if (oque === 'descartar') return b.categoria === 'veiculo' ? 'Largar o veículo' : 'Se livrar';
  return 'Vender';
}

export function disponibilidadeEspolio21(v: Vida, oque: OqueEspolio21, bemId: string, comprador?: Comprador21): Veredito {
  const b = bensIlicitos21(v).find(x => x.id === bemId);
  if (!b) return bloqueio('impossivel', 'Isso não está mais com você.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Preso, não.');
  if (!saidas21(b).includes(oque)) return bloqueio('incompativel', oque === 'usar' ? 'Isso não é de usar.' : 'Não dá agora.');
  if (oque === 'vender') {
    if (!comprador) return bloqueio('incompativel', 'Escolha para quem.');
    const o = ofertas21(v, b).find(x => x.comprador === comprador);
    if (!o) return bloqueio('incompativel', 'Esse comprador não mexe com isso.');
    if (!o.liberado) return bloqueio('requisito', o.motivo!);
    return { grau: 'irregular', motivo: `Receptação é crime. Paga uns ${dinheiro(o.preco)}; a chance de dar errado é de ${Math.round(o.risco * 100)}%.` };
  }
  if (oque === 'usar' && b.categoria === 'veiculo') return { grau: 'irregular', motivo: 'Sem documento: uma blitz e ele vai embora — com você junto para a delegacia.' };
  if (oque === 'usar' && b.rastreavel) return { grau: 'irregular', motivo: 'Tem número de série: em uso, pode ser achado.' };
  return PERMITIDO;
}

export interface SaidaEspolio21 { texto: string; tom?: 'bom' | 'ruim'; titulo: string; vestir?: { itemId: string; pecaId: string } }

/**
 * Executa a saída. Vestir é feito por quem chama (`acoes`: o guarda-roupa de sempre, `usarItem`), e quem chama
 * redesenha a Aparência depois (`sincronizarVisual`) — esta camada não depende da Aparência: aqui a peça só entra e sai
 * do guarda-roupa (joia, relógio, bolsa e casaco são redesenhados pelo que está em uso).
 */
export function executarEspolio21(v: Vida, oque: OqueEspolio21, bemId: string, comprador?: Comprador21): SaidaEspolio21 {
  const es = espolio21(v);
  const b = es.bens.find(x => x.id === bemId)!;
  const r = rngDe(v.id, 'espolio21_acao', v.t, bemId, oque, es.historico.length);
  const titulo = b.nome;
  switch (oque) {
    case 'usar': {
      if (b.estiloId) {
        const pecaId = `est_${b.id}`;
        v.eu.estilo ??= { itens: [] };
        v.eu.estilo.itens.push({ id: pecaId, itemId: b.estiloId, t: v.t, preco: b.valor, usando: false });
        b.estado = 'no_guarda_roupa'; b.pecaId = pecaId;
        return { texto: `${b.nome} foi para o seu guarda-roupa. Quem reparar pode perguntar de onde veio — e, se for procurado, alguém pode reconhecer.`, titulo, vestir: { itemId: b.estiloId, pecaId } };
      }
      b.estado = 'em_uso';
      const t = b.categoria === 'veiculo' ? `Você passou a rodar com ${b.nome.toLowerCase()}, sem documento. Cada blitz vira um risco.`
        : b.categoria === 'arte' || b.categoria === 'colecionavel' ? `${b.nome} ficou em casa, à vista de quem visita.`
          : `Você passou a usar ${b.nome.toLowerCase()}.${b.rastreavel ? ' Tem número de série — ligado, pode ser localizado.' : ''}`;
      return { texto: t, titulo, tom: b.rastreavel ? 'ruim' : undefined };
    }
    case 'guardar': {
      tirarDoGuardaRoupa(v, b);
      b.estado = 'escondido';
      return { texto: `${b.nome} voltou para o esconderijo.`, titulo };
    }
    case 'descartar': {
      tirarDoGuardaRoupa(v, b);
      sair(v, b, 'descartado');
      const e = v.caminhos.envolvimento;
      if (e) e.exposicao = clamp(e.exposicao - (b.rastreavel ? 3 : 1));
      return { texto: b.categoria === 'veiculo' ? `Você largou ${b.nome.toLowerCase()} longe de casa. Alguém vai achar — melhor que não seja com você.` : `Você se livrou de ${b.nome.toLowerCase()}. O que não está com você não pesa contra você.`, titulo };
    }
    case 'vender': {
      const o = ofertas21(v, b).find(x => x.comprador === comprador)!;
      tirarDoGuardaRoupa(v, b);
      const e = v.caminhos.envolvimento;
      if (r.chance(o.risco)) {
        // Deu errado: a loja estava vigiada, o comprador era informante. O bem fica com a polícia, o nome circula.
        sair(v, b, 'apreendido', undefined, comprador);
        es.reputacao = clamp(es.reputacao - 12);
        const investigacao = abrirInvestigacao21(v, r, 14);
        escrever(v, { texto: `A venda de ${b.nome.toLowerCase()} deu errado: a mercadoria foi apreendida.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
        return { texto: `${o.nome}: deu errado. ${r.pick(['Havia gente de olho na loja.', 'O comprador falou com quem não devia.', 'A mercadoria estava no cadastro de roubados.'])} ${b.nome} foi apreendido${b.categoria === 'joia' || b.categoria === 'bolsa' || b.categoria === 'roupa' || b.categoria === 'arte' || b.categoria === 'mercadoria' ? 'a' : ''}${investigacao ? ' — e o seu nome entrou numa investigação.' : '. O seu nome circulou.'}`, tom: 'ruim', titulo };
      }
      movimentoPorFora(v, 'ocasional', o.preco);
      if (e) { e.ganhos += o.preco; e.exposicao = clamp(e.exposicao + (b.rastreavel ? 3 : 1)); }
      es.reputacao = clamp(es.reputacao + Math.min(8, 2 + Math.round(o.preco / Math.max(1, 4000 * fator(v)))));
      sair(v, b, 'vendido', o.preco, comprador);
      return { texto: `${o.nome} pagou ${dinheiro(o.preco)} por ${b.nome.toLowerCase()}${b.engano ? ' — menos do que parecia: não era o que você achava' : ''}.`, tom: 'bom', titulo };
    }
  }
}

function tirarDoGuardaRoupa(v: Vida, b: BemIlicito21): void {
  if (!b.pecaId || !v.eu.estilo) return;
  v.eu.estilo.itens = v.eu.estilo.itens.filter(x => x.id !== b.pecaId);
  delete b.pecaId;
}

function sair(v: Vida, b: BemIlicito21, desfecho: Espolio21['historico'][number]['desfecho'], valor?: number, comprador?: Comprador21): void {
  const es = espolio21(v);
  es.bens = es.bens.filter(x => x.id !== b.id);
  es.historico = [...es.historico, { t: v.t, nome: b.nome, desfecho, ...(valor !== undefined ? { valor } : {}), ...(comprador ? { comprador } : {}) }].slice(-40);
}

/** O bem achado (ou a venda que deu errado) pode abrir a investigação — que segue o caminho de sempre. */
function abrirInvestigacao21(v: Vida, r: Rng, exposicao: number): boolean {
  const e = v.caminhos.envolvimento;
  if (!e) return false;
  e.exposicao = clamp(e.exposicao + exposicao);
  if (e.investigado === undefined && !v.justica?.processo && r.chance(0.35 + e.exposicao / 250)) { e.investigado = v.t; return true; }
  return false;
}

/* ============================================================================ O ano */

/** O que acontece com os bens no ano: esfriam; o rastreável em uso pode ser achado; o processo traz a busca. */
export function processarEspolio21(v: Vida): void {
  const es = v.espolio21;
  if (!es?.bens.length) return;
  const r = rngDe(v.id, 'espolio21_ano', v.t);
  const busca = !!v.justica?.processo && v.fatos['esp21_busca'] !== v.justica.processo.tInicio;
  if (busca) v.fatos['esp21_busca'] = v.justica!.processo!.tInicio;
  const achados: string[] = [];
  for (const b of [...es.bens]) {
    // A peça vestida saiu do guarda-roupa por outro caminho (deu de presente): o bem não está mais com você.
    if (b.pecaId && !v.eu.estilo?.itens.some(x => x.id === b.pecaId)) { sair(v, b, 'descartado'); continue; }
    b.calor = clamp(b.calor - 20);
    const usandoPeca = !!b.pecaId && !!v.eu.estilo?.itens.find(x => x.id === b.pecaId && x.usando);
    const exposto = b.estado === 'em_uso' || usandoPeca;
    const chance = busca && b.estado === 'escondido' ? 0.7
      : b.categoria === 'veiculo' && b.estado === 'em_uso' ? 0.3
        : exposto && b.rastreavel ? 0.08 + b.calor / 400
          : exposto && (b.raro || b.valor > 20000 * fator(v)) ? 0.04 + b.calor / 600 : 0;
    if (!chance || !r.chance(chance)) continue;
    tirarDoGuardaRoupa(v, b);
    sair(v, b, busca ? 'apreendido' : 'recuperado');
    achados.push(b.nome.toLowerCase());
    abrirInvestigacao21(v, r, b.categoria === 'veiculo' ? 15 : 8);
  }
  if (!achados.length) return;
  const lista = achados.length === 1 ? achados[0] : `${achados.slice(0, -1).join(', ')} e ${achados[achados.length - 1]}`;
  escrever(v, {
    texto: busca ? `Na busca do processo, a polícia levou ${lista}.` : `${lista.charAt(0).toUpperCase()}${lista.slice(1)} ${achados.length === 1 ? 'foi achado' : 'foram achados'} — ${r.pick(['o dono reconheceu', 'o número de série bateu no cadastro', 'uma blitz no caminho'])}. Ficou com a polícia.`,
    relevancia: 'biografia', tema: 'trabalho', tom: 'ruim'
  });
}

/** Save antigo / dado estranho: só o que é válido fica. */
export function normalizarEspolio21(v: Vida): void {
  const es = v.espolio21;
  if (!es) return;
  if (!Array.isArray(es.bens)) es.bens = [];
  es.bens = es.bens.filter(b => b && typeof b.id === 'string' && FRACAO_DO_MERCADO21[b.categoria] !== undefined && Number.isFinite(b.valor));
  for (const b of es.bens) {
    b.calor = clamp(Number.isFinite(b.calor) ? b.calor : 50);
    if (b.pecaId && !v.eu.estilo?.itens.some(x => x.id === b.pecaId)) { delete b.pecaId; b.estado = 'escondido'; }
  }
  es.reputacao = clamp(Number.isFinite(es.reputacao) ? es.reputacao : 0);
  if (!Array.isArray(es.historico)) es.historico = [];
}
