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
import { COMPRADORES21, FRACAO_DO_MERCADO21, LOCAIS21, MODELOS_ESPOLIO21, type LocalDoRoubo21, type BemIlicito21, type CategoriaDoEspolio21, type Comprador21, type Espolio21, type ModeloDoEspolio21 } from '../../dados21/crime/espolio21';

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

export interface Parte21 { dinheiro: number; bens: BemIlicito21[]; local?: LocalDoRoubo21 }

/** Os objetos que um lugar assim pode ter (categoria, faixa de preço, patamar). */
function elegiveisDoLocal(v: Vida, L: (typeof LOCAIS21)[LocalDoRoubo21], patamar: number): ModeloDoEspolio21[] {
  const f = fator(v);
  return MODELOS_ESPOLIO21.filter(m => L.categorias.includes(m.categoria) && (!L.so || L.so.includes(m.id)) && (m.patamar ?? 1) <= patamar
    && precoDoModelo(v, m) >= L.piso * f && precoDoModelo(v, m) <= L.teto * f && m.escala <= L.escala);
}

/**
 * O lugar de um serviço, quando quem chama não diz: o tamanho do serviço e o patamar pesam — e só entram lugares que
 * comportam a parte (o dinheiro que um lugar assim tem e o que dá para levar dele): um serviço de R$ 300 mil não é uma
 * carteira na rua, e um de R$ 2 mil não é uma carga inteira.
 */
export function sortearLocal21(r: Rng, escala: 1 | 3, patamar = 1, v?: Vida, parte?: number): LocalDoRoubo21 {
  const pesos: Partial<Record<LocalDoRoubo21, number>> = escala === 1
    ? { pessoa_rua: 3, casa_simples: 2, casa_media: 2, comercio_bairro: 1.5 }
    : { casa_alto_padrao: 2, loja_eletronicos: 1.5, joalheria: patamar >= 2 ? 1.5 : 0.6, loja_grife: 1, carga: 1, patio_veiculos: 1 };
  let ids = Object.keys(pesos) as LocalDoRoubo21[];
  if (v && parte) {
    const f = fator(v);
    const cabe = ids.filter(id => {
      const L = LOCAIS21[id];
      const ms = elegiveisDoLocal(v, L, patamar).map(m => FRACAO_DO_MERCADO21[m.categoria] * precoDoModelo(v, m));
      const max = L.especie[1] * f + (ms.length ? Math.max(...ms) * L.maxItens : 0);
      const min = ms.length ? Math.min(...ms) : Infinity;
      return max >= parte * 0.75 && (min <= parte * 1.3 || L.especie[1] * f >= parte * 0.75);
    });
    if (cabe.length) ids = cabe;
  }
  return r.weighted(ids, x => pesos[x] ?? 0) ?? ids[0];
}

/**
 * Divide a parte de quem fez (`parte`: o que o serviço rende) em dinheiro em espécie e bens — e AGORA pelo lugar (VIDA
 * 27 · §11): o dinheiro é o que o lugar tinha (a carteira, o caixa, o cofre), os objetos são os que um lugar assim tem,
 * na faixa de preço dele, usados (de alguém: valem menos) ou novos (de loja, de carga). Antes, os objetos vinham de uma
 * lista única (o relógio suíço na casa simples) e o dinheiro era a sobra da conta. Os bens entram no espólio; o dinheiro
 * NÃO é pago aqui (quem chama paga). `patamar`: o nível no meio (1..3).
 */
export function repartir21(v: Vida, parte: number, escala: 1 | 3, origem: string, patamar = 1, local?: LocalDoRoubo21): Parte21 {
  const r = rngDe(v.id, 'espolio21', v.t, origem, bensIlicitos21(v).length, espolio21(v).historico.length);
  if (parte <= 0) return { dinheiro: 0, bens: [] };
  const onde = local ?? sortearLocal21(r, escala, patamar, v, parte);
  const L = LOCAIS21[onde];
  const f = fator(v);
  // O dinheiro em espécie: o que o lugar tinha (nunca mais que a parte inteira).
  const especie = Math.min(parte, Math.round(r.int(L.especie[0], L.especie[1]) * f / 50) * 50);
  let resta = parte - especie;
  const bens: BemIlicito21[] = [];
  const elegiveis = elegiveisDoLocal(v, L, patamar);
  for (let k = 0; k < L.maxItens && resta > 0; k++) {
    // O que cabe no que resta da parte (com folga de 30%); o engano entra raramente, o raro mais raramente ainda.
    const cabem = elegiveis.filter(m => FRACAO_DO_MERCADO21[m.categoria] * precoDoModelo(v, m) <= resta * 1.3);
    if (!cabem.length) break;
    // O que preenche melhor o que resta pesa mais (um lugar rende o que tem de valor, não só miudeza).
    const m = r.weighted(cabem, x => (x.engano ? 0.25 : x.raro ? 0.35 : 1) * (x.escala === L.escala ? 1.6 : 1) * Math.max(0.05, Math.min(1, FRACAO_DO_MERCADO21[x.categoria] * precoDoModelo(v, x) / resta)));
    if (!m) break;
    const conservacao = L.usado && !m.engano ? Math.round((0.55 + r.next() * 0.4) * 100) / 100 : 1;
    const valor = Math.round(precoDoModelo(v, m) * conservacao / 10) * 10;
    bens.push(novoBem(v, m, valor, L.nome, bens.length, onde, conservacao));
    resta -= baseNoMercado21({ valor, categoria: m.categoria });
    // Um bem grande basta (não sai de um lugar um carro e um quadro); a carga pode ser de vários lotes.
    if (m.categoria === 'veiculo' || m.categoria === 'arte' || (m.categoria === 'mercadoria' && onde !== 'carga')) break;
  }
  espolio21(v).bens.push(...bens);
  // O que o lugar não tinha não vira dinheiro: o serviço rendeu o que havia.
  return { dinheiro: especie, bens, local: onde };
}

function novoBem(v: Vida, m: ModeloDoEspolio21, valor: number, origem: string, k: number, local?: LocalDoRoubo21, conservacao = 1): BemIlicito21 {
  return {
    id: `esp${v.t}_${bensIlicitos21(v).length + k}_${m.id}`, modelo: m.id, categoria: m.categoria, nome: m.nome, valor, t: v.t, origem,
    rastreavel: m.rastreavel, ...(m.raro ? { raro: true } : {}), ...(m.engano ? { engano: true } : {}),
    calor: m.rastreavel ? 80 : 55, estado: 'escondido', ...(m.estiloId ? { estiloId: m.estiloId } : {}),
    ...(local ? { local } : {}), ...(conservacao < 1 ? { conservacao } : {})
  };
}

const umOuUma = (c: CategoriaDoEspolio21) => (['joia', 'bolsa', 'roupa', 'arte', 'mercadoria', 'colecionavel'].includes(c) ? 'uma' : 'um');

/** "R$ 800 em espécie, um relógio de mergulho e um celular top de linha". */
export function textoDaParte21(p: Parte21): string {
  const itens = p.bens.map(b => (/^(Caixas|Garrafas|Eletrodomésticos|Ferramentas|Brincos|Lote)/.test(b.nome) ? b.nome.charAt(0).toLowerCase() + b.nome.slice(1) : `${umOuUma(b.categoria)} ${b.nome.charAt(0).toLowerCase()}${b.nome.slice(1)}`));
  const partes = [...(p.dinheiro > 0 ? [`${dinheiro(p.dinheiro)} em espécie`] : []), ...itens];
  const lista = partes.length <= 1 ? (partes[0] ?? 'nada') : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
  return p.local ? `${LOCAIS21[p.local].nome}, ${lista}` : lista;
}

/* ============================================================================ O mercado paralelo */

/** A procura do ano por categoria (0,75–1,25): o ouro sobe, o celular de um modelo antigo cai. */
export function procura21(v: Vida, c: CategoriaDoEspolio21): number {
  return 0.75 + rngDe(v.id, 'procura21', c, anoDe(v.t)).next() * 0.5;
}

export interface Oferta21 { comprador: Comprador21; nome: string; preco: number; risco: number; liberado: boolean; motivo?: string; descricao: string }

/**
 * VIDA 27: o nome que os compradores enxergam. Antes era só o das vendas anteriores (`espolio21.reputacao`) — o
 * segundo no comando de uma facção aparecia como "sem nome no meio" para o desmanche. Agora vale o maior entre as
 * vendas, a reputação no crime aqui na cidade e o posto numa organização de que se é de dentro (ela garante quem é
 * dela). Lido direto do estado (sem importar o submundo: chunks).
 */
export function nomeNoMercado21(v: Vida): { valor: number; porque: string } {
  const es = espolio21(v);
  const e = v.caminhos.envolvimento;
  const op: { valor: number; porque: string }[] = [{ valor: es.reputacao, porque: 'as vendas que já fez' }];
  if (e) {
    const aqui = e.reputacaoLocal?.[v.moradia.municipioId] ?? e.reputacao ?? 0;
    op.push({ valor: Math.round(aqui * 0.8), porque: 'o seu nome no crime da cidade' });
    for (const o of e.organizacoes ?? []) {
      if (o.saiu !== undefined || o.expulso !== undefined || o.distancia === 'fora') continue;
      if (o.propria) { op.push({ valor: 60, porque: `${o.nome}, que é sua` }); continue; }
      if (o.relacao !== 'membro') continue;
      const n = o.nivel ?? 0;
      op.push({ valor: 10 + n * 9, porque: `o seu posto em ${o.nome}` });
    }
  }
  return op.reduce((a, x) => (x.valor > a.valor ? x : a));
}

/** Quem compraria este bem, por quanto, com que risco — e quem ainda não negocia com você (e por quê). */
export function ofertas21(v: Vida, b: BemIlicito21): Oferta21[] {
  const nome = nomeNoMercado21(v);
  const cautela = !!v.caminhos.envolvimento?.cautela;
  return (Object.keys(COMPRADORES21) as Comprador21[]).filter(c => COMPRADORES21[c].compra.includes(b.categoria)).map(c => {
    const p = COMPRADORES21[c];
    const reputacaoPaga = 1 + nome.valor / 400;
    const raro = b.raro && c === 'colecionador' ? 1.3 : b.raro && c === 'bairro' ? 0.6 : 1;
    const engano = b.engano ? 0.4 : 1;
    const preco = Math.round(baseNoMercado21(b) * p.paga * procura21(v, b.categoria) * (1 - b.calor / 250) * reputacaoPaga * raro * engano / 10) * 10;
    const risco = clamp(p.risco * (1 + b.calor / 100) * (b.rastreavel ? 1.4 : 1) * (cautela ? 0.7 : 1) * (1 - nome.valor / 250), 0.01, 0.6);
    const liberado = nome.valor >= p.reputacao;
    return { comprador: c, nome: p.nome, preco, risco, liberado, descricao: p.descricao, ...(liberado ? {} : { motivo: `Só negocia com quem já tem nome no meio (${p.reputacao}+; o seu: ${Math.round(nome.valor)}, por ${nome.porque}).` }) };
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
      const x = venderUm21(v, b, o, r);
      return { texto: x.texto, tom: x.ok ? 'bom' : 'ruim', titulo };
    }
  }
}

/** Uma venda (a de um bem só, e cada uma do lote): o mesmo risco, o mesmo pagamento, o mesmo registro. */
function venderUm21(v: Vida, b: BemIlicito21, o: Oferta21, r: Rng): { ok: boolean; texto: string; investigacao?: boolean } {
  const es = espolio21(v);
  tirarDoGuardaRoupa(v, b);
  const e = v.caminhos.envolvimento;
  if (r.chance(o.risco)) {
    // Deu errado: a loja estava vigiada, o comprador era informante. O bem fica com a polícia, o nome circula.
    sair(v, b, 'apreendido', undefined, o.comprador);
    es.reputacao = clamp(es.reputacao - 12);
    const investigacao = abrirInvestigacao21(v, r, 14);
    escrever(v, { texto: `A venda de ${b.nome.toLowerCase()} deu errado: a mercadoria foi apreendida.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    return { ok: false, investigacao, texto: `${o.nome}: deu errado. ${r.pick(['Havia gente de olho na loja.', 'O comprador falou com quem não devia.', 'A mercadoria estava no cadastro de roubados.'])} ${b.nome} foi apreendido${b.categoria === 'joia' || b.categoria === 'bolsa' || b.categoria === 'roupa' || b.categoria === 'arte' || b.categoria === 'mercadoria' ? 'a' : ''}${investigacao ? ' — e o seu nome entrou numa investigação.' : '. O seu nome circulou.'}` };
  }
  movimentoPorFora(v, 'ocasional', o.preco);
  if (e) { e.ganhos += o.preco; e.exposicao = clamp(e.exposicao + (b.rastreavel ? 3 : 1)); }
  es.reputacao = clamp(es.reputacao + Math.min(8, 2 + Math.round(o.preco / Math.max(1, 4000 * fator(v)))));
  sair(v, b, 'vendido', o.preco, o.comprador);
  return { ok: true, texto: `${o.nome} pagou ${dinheiro(o.preco)} por ${b.nome.toLowerCase()}${b.engano ? ' — menos do que parecia: não era o que você achava' : ''}.` };
}

/* ============================================================================ VIDA 27 · §12: vender vários de uma vez */

export type EscolhaDoLote21 = Comprador21 | 'melhor';
export interface ItemDoLote21 { bemId: string; nome: string; modelo: string; comprador: Comprador21; nomeComprador: string; preco: number; risco: number }
export interface Lote21 {
  itens: ItemDoLote21[];
  /** O que foi selecionado e não entra (ninguém liberado compra, ou o escolhido não mexe com isso), e por quê. */
  fora: { bemId: string; nome: string; motivo: string }[];
  total: number;
  /** A chance de pelo menos uma das vendas dar errado (cada uma tem o risco dela). */
  riscoDeAlgo: number;
  porComprador: { comprador: Comprador21; nome: string; n: number; total: number; riscoMax: number }[];
}

/**
 * O lote: para cada bem selecionado (sem repetir; só os que são seus), o comprador — o escolhido, ou o que paga mais
 * entre os que negociam com você — e o preço de agora. O que a prévia mostra é o que se paga: o lote é montado uma vez,
 * no começo da venda, com os preços desse momento.
 */
export function montarLote21(v: Vida, bemIds: string[], escolha: EscolhaDoLote21 = 'melhor'): Lote21 {
  const ids = [...new Set(bemIds)];
  const itens: ItemDoLote21[] = [], fora: Lote21['fora'] = [];
  for (const id of ids) {
    const b = bensIlicitos21(v).find(x => x.id === id);
    if (!b) continue;
    const ofs = ofertas21(v, b).filter(o => escolha === 'melhor' || o.comprador === escolha);
    const ok = ofs.filter(o => o.liberado).sort((a, c) => c.preco - a.preco || a.risco - c.risco)[0];
    if (!ok) { fora.push({ bemId: b.id, nome: b.nome, motivo: ofs.length ? ofs[0].motivo ?? 'Ninguém negocia isso com você.' : escolha === 'melhor' ? 'Ninguém compra isso.' : `${COMPRADORES21[escolha].nome} não mexe com isso.` }); continue; }
    itens.push({ bemId: b.id, nome: b.nome, modelo: b.modelo, comprador: ok.comprador, nomeComprador: ok.nome, preco: ok.preco, risco: ok.risco });
  }
  const por = new Map<Comprador21, Lote21['porComprador'][number]>();
  for (const x of itens) { const g = por.get(x.comprador) ?? { comprador: x.comprador, nome: x.nomeComprador, n: 0, total: 0, riscoMax: 0 }; g.n++; g.total += x.preco; g.riscoMax = Math.max(g.riscoMax, x.risco); por.set(x.comprador, g); }
  return { itens, fora, total: itens.reduce((s2, x) => s2 + x.preco, 0), riscoDeAlgo: 1 - itens.reduce((p, x) => p * (1 - x.risco), 1), porComprador: [...por.values()] };
}

export function disponibilidadeLote21(v: Vida, bemIds: string[], escolha: EscolhaDoLote21): Veredito {
  if (v.justica?.prisao) return bloqueio('impossivel', 'Preso, não.');
  const l = montarLote21(v, bemIds, escolha);
  if (!l.itens.length) return bloqueio('requisito', l.fora[0]?.motivo ?? 'Nada selecionado para vender.');
  return { grau: 'irregular', motivo: `Receptação é crime. ${l.itens.length} ${l.itens.length === 1 ? 'item' : 'itens'} por ${dinheiro(l.total)}; a chance de alguma venda dar errado é de ${Math.round(l.riscoDeAlgo * 100)}%.` };
}

/**
 * Vende o lote, item por item, pelas mesmas regras da venda de um só (risco, pagamento, nome no meio, histórico). Se
 * uma der errado, a polícia está no meio: o resto não é vendido e volta para o esconderijo. Nada é vendido duas vezes
 * (o bem vendido sai do espólio) e o que não foi selecionado não muda.
 */
export function venderLote21(v: Vida, bemIds: string[], escolha: EscolhaDoLote21): { texto: string; tom?: 'bom' | 'ruim'; vendidos: number; total: number } {
  const lote = montarLote21(v, bemIds, escolha);
  const r = rngDe(v.id, 'espolio21_lote', v.t, espolio21(v).historico.length, lote.itens.length);
  let vendidos = 0, total = 0;
  let falha: string | undefined;
  for (const x of lote.itens) {
    const b = bensIlicitos21(v).find(y => y.id === x.bemId);
    if (!b) continue;
    const of = { comprador: x.comprador, nome: x.nomeComprador, preco: x.preco, risco: x.risco, liberado: true, descricao: '' };
    const res = venderUm21(v, b, of, r);
    if (!res.ok) { falha = res.texto; break; }
    vendidos++; total += x.preco;
  }
  const sobrou = lote.itens.length - vendidos - (falha ? 1 : 0);
  const partes = [vendidos ? `Vendeu ${vendidos} ${vendidos === 1 ? 'item' : 'itens'} por ${dinheiro(total)} no total.` : 'Nada chegou a ser vendido.'];
  if (falha) partes.push(falha, sobrou > 0 ? `Com a polícia no meio, a venda parou: ${sobrou === 1 ? 'o outro item continua' : `os outros ${sobrou} itens continuam`} com você.` : '');
  if (lote.fora.length) partes.push(`Ficaram de fora (sem comprador): ${lote.fora.map(f2 => f2.nome.toLowerCase()).join(', ')}.`);
  return { texto: partes.filter(Boolean).join(' '), tom: falha ? 'ruim' : vendidos ? 'bom' : undefined, vendidos, total };
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
