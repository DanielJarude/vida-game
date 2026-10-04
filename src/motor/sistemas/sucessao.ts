/**
 * Sucessão: a morte encerra uma vida, mas não precisa encerrar a família.
 *
 * Duas perguntas separadas — e o jogo nunca responde uma pela outra:
 *
 *   QUEM HERDA O PATRIMÔNIO  →  a partilha (`partilhar`), pela regra do país
 *                               (`dados/sucessao`) e pelo que o jogador decide
 *                               dentro dela (a parte disponível, a doação, quem
 *                               fica com qual bem);
 *   QUEM O JOGADOR CONTROLA  →  `continuarComo`: um filho ou uma filha que JÁ
 *                               EXISTE no mundo. Não se cria ninguém: a pessoa
 *                               chega com o nome, a idade, a aparência, a
 *                               formação, o trabalho, a parceria, os filhos, o
 *                               dinheiro dela e a vida que viveu como NPC. A
 *                               câmera muda de pessoa.
 *
 * CONSERVAÇÃO — nada aparece nem some: bruto = dívidas pagas + meação +
 * quinhões + doação + custos + vacante. A dívida que o patrimônio não cobre
 * se extingue com ele (ninguém herda dívida). Cada bem tem UM dono depois da
 * partilha. A troca de protagonista é uma função pura sobre uma vida morta:
 * a vida que sai dela não tem `morte`, então não há como transferir duas
 * vezes (nem depois de salvar e recarregar).
 *
 * MEMÓRIA — três coisas que não se misturam: a BIOGRAFIA de quem morreu
 * (guardada inteira na linhagem, só marcos e biografia), a MEMÓRIA FAMILIAR
 * (a linhagem, de geração em geração) e a LINHA DA VIDA de quem continua (que
 * começa com o nascimento dela e registra a morte do pai ou da mãe — não a
 * vida dele).
 *
 * MÉRITO NÃO SE HERDA — o patrimônio passa; títulos, prêmios, reputação na
 * área, base política e habilidade ficam com quem os construiu. O filho de
 * alguém conhecido é conhecido por associação (um pouco, e isso passa).
 */

import { nacionalidadesDaPessoa, paisDaPessoa, paisDaVida } from '../mundo/vida';
import { converterEntrePaises } from '../mundo/moeda';
import type {
  Bem, Condicao, DecisoesDeHeranca, Emprego, Entrada, Escolaridade, Genero, Geracao, Heranca, Imovel, Linhagem, Parentesco, Personalidade, Pessoa, Posses, Traco, Vida, Vinculo
} from '../tipos';
import { clamp } from '../rng';
import { idadePessoa, escrever, novoId, transacao } from '../nucleo';
import { anoDe, idadeEm, MESES, mesDe } from '../tempo';
import { flex, dinheiro as fmt, listaNatural, rotuloParentesco } from '../texto';
import { regrasDoPais, nomeDoDestino, type RegrasDeSucessao } from '../dados/sucessao';
import { construidoJunto, uniaoConta } from './partilha';
import { valorDoNegocio } from './negocio';
import { derivarPredisposicoes } from './predisposicao';
import { caminhosVazios } from './marcas';
import { bairroDeOrigem } from './origem';
import { modeloMoradia } from '../dados/bens';
import { aluguelDe } from './mercado';
import { cursoPorNome } from '../dados/cursos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { liquido as liquidoDe } from './renda';
import { pisoDeForma } from './pessoa';
import { economiaLocal, nomeLugar, paisDaCidade } from '../dados/lugares';
import { retrospectiva } from './retrospectiva';
import { trajetoriasDaVida } from './legado';
import { economiasEstimadas } from './economiasNpc';
import { condicaoDaPessoa, garantirCondicoes, habitosDaPessoa, saudeConhecida } from './corpo';
import { lancar } from './extrato';

export { economiasEstimadas, taxaDePoupanca } from './economiasNpc';

/* ================================================================ O país */

/**
 * A lei da sucessão é a do país onde a pessoa morava (o domicílio — LINDB art. 10 no Brasil; a residência habitual no
 * Regulamento europeu 650/2012). Abstração: um só país por herança, sem conflito de leis entre bens em lugares diferentes.
 */
export { paisDaVida };

/* ============================================================ Inventário */

export type TipoItem = 'dinheiro' | 'aplicacao' | 'imovel' | 'veiculo' | 'negocio';

export interface ItemDoInventario {
  /** `conta`, o id da aplicação, o id do bem, ou `negocio`. */
  id: string;
  tipo: TipoItem;
  nome: string;
  valor: number;
  /** A casa onde a família morava. */
  moradia?: boolean;
}

/** O que existia no dia da morte, item a item (com valor de mercado). O negócio vale o caixa mais o que alguém pagaria pela parte de quem morreu. */
export function inventario(v: Vida): ItemDoInventario[] {
  const f = v.financas;
  const itens: ItemDoInventario[] = [];
  if (f.conta > 0) itens.push({ id: 'conta', tipo: 'dinheiro', nome: 'dinheiro em conta', valor: Math.round(f.conta) });
  for (const a of f.investimentos) if (a.valor > 0) itens.push({ id: a.id, tipo: 'aplicacao', nome: 'aplicações', valor: Math.round(a.valor) });
  for (const b of f.bens) itens.push({ id: b.id, tipo: b.tipo, nome: b.nome, valor: Math.round(b.valor), ...(b.tipo === 'imovel' && b.id === v.moradia.imovelId ? { moradia: true } : {}) });
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado') {
    const valor = Math.max(0, Math.round(n.caixa ?? 0)) + valorDoNegocio(v, n);
    if (valor > 0) itens.push({ id: 'negocio', tipo: 'negocio', nome: n.nome, valor });
  }
  return itens;
}

/** As obrigações que o patrimônio paga (todas as dívidas, a conta no vermelho, o aluguel atrasado). */
export function obrigacoes(v: Vida): number {
  const f = v.financas;
  return Math.round(f.dividas.reduce((s, d) => s + d.saldo, 0) + Math.max(0, -f.conta) + (v.moradia.atraso ?? 0) * v.moradia.aluguel);
}

/* =============================================================== Herdeiros */

export type PapelHerdeiro = 'conjuge' | 'filho' | 'neto' | 'ascendente' | 'irmao';

export interface Herdeiro {
  pessoaId: string;
  papel: PapelHerdeiro;
  /** Herdeiro necessário (tem a legítima garantida). */
  necessario: boolean;
  /** Fração da herança pela lei (antes do testamento). */
  quota: number;
  /** Neto que herda no lugar de quem (o filho que já morreu). */
  representa?: string;
}

/** A parceria que conta para a partilha: casamento, ou união de dois anos ou mais, viva. */
export function conjugeSobrevivente(v: Vida): Pessoa | undefined {
  const par = Object.values(v.vinculos).find(x => x.romance && v.pessoas[x.pessoaId]?.vivo && (x.romance.estagio === 'casamento' || (x.romance.estagio === 'morando_junto' && uniaoConta(v, v.pessoas[x.pessoaId], 'morando_junto'))));
  return par ? v.pessoas[par.pessoaId] : undefined;
}

const ehFilhoDeVerdade = (vin: Vinculo) => vin.parentesco === 'filho';

/** Quem herda pela lei, e com que fração (a ordem e as concorrências da regra do país). */
export function herdeirosLegais(v: Vida, regra: RegrasDeSucessao = regrasDoPais(paisDaVida(v))): Herdeiro[] {
  const conjuge = conjugeSobrevivente(v);
  // Descendentes por estirpe: cada filho vivo é uma cabeça; o filho que morreu é representado pelos filhos vivos dele.
  const estirpes: { cabeca: Herdeiro[] }[] = [];
  for (const vin of Object.values(v.vinculos).filter(ehFilhoDeVerdade)) {
    const f = v.pessoas[vin.pessoaId];
    if (!f || f.especie) continue;
    if (f.vivo) estirpes.push({ cabeca: [{ pessoaId: f.id, papel: 'filho', necessario: true, quota: 0 }] });
    else if (regra.representacao) {
      const netos = Object.values(v.pessoas).filter(n => n.vivo && !n.especie && n.genitores?.includes(f.id));
      if (netos.length) estirpes.push({ cabeca: netos.map(n => ({ pessoaId: n.id, papel: 'neto' as const, necessario: true, quota: 0, representa: f.id })) });
    }
  }
  if (estirpes.length) {
    const cabecas = estirpes.length + (conjuge && regra.conjugeComDescendentes ? 1 : 0);
    const out: Herdeiro[] = [];
    for (const e of estirpes) for (const h of e.cabeca) out.push({ ...h, quota: 1 / cabecas / e.cabeca.length });
    if (conjuge && regra.conjugeComDescendentes) out.push({ pessoaId: conjuge.id, papel: 'conjuge', necessario: true, quota: 1 / cabecas });
    return out;
  }
  const ascendentes = Object.values(v.vinculos).filter(x => (x.parentesco === 'mae' || x.parentesco === 'pai') && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]);
  if (ascendentes.length) {
    const doConjuge = conjuge ? (ascendentes.length >= 2 ? regra.conjugeComAscendentes[0] : regra.conjugeComAscendentes[1]) : 0;
    const out: Herdeiro[] = ascendentes.map(p => ({ pessoaId: p.id, papel: 'ascendente' as const, necessario: true, quota: (1 - doConjuge) / ascendentes.length }));
    if (conjuge) out.push({ pessoaId: conjuge.id, papel: 'conjuge', necessario: true, quota: doConjuge });
    return out;
  }
  if (conjuge) return [{ pessoaId: conjuge.id, papel: 'conjuge', necessario: true, quota: 1 }];
  if (regra.colaterais) {
    const irmaos = Object.values(v.vinculos).filter(x => (x.parentesco === 'irmao' || x.parentesco === 'meio_irmao') && v.pessoas[x.pessoaId]?.vivo && !v.pessoas[x.pessoaId].especie).map(x => v.pessoas[x.pessoaId]);
    if (irmaos.length) return irmaos.map(p => ({ pessoaId: p.id, papel: 'irmao' as const, necessario: false, quota: 1 / irmaos.length }));
  }
  return [];
}

/* ================================================================ Partilha */

export interface Quinhao {
  pessoaId: string;
  papel: PapelHerdeiro;
  /** Pela lei (a legítima) e pelo testamento (a parte disponível). */
  legitima: number;
  disponivel: number;
  /** A meação (só o cônjuge): não é herança, é a metade do que construíram. */
  meacao: number;
  /** Total que a pessoa recebe. */
  valor: number;
  /** Em bens (com o valor de cada um) e em dinheiro (o resto). */
  bens: ItemDoInventario[];
  dinheiro: number;
}

export interface Partilha {
  regra: RegrasDeSucessao;
  inventario: ItemDoInventario[];
  bruto: number;
  dividas: number;
  dividasPagas: number;
  /** Dívida que o patrimônio não cobriu: extingue-se (ninguém herda dívida). */
  naoCoberto: number;
  /** O que sobrou depois das dívidas. */
  liquido: number;
  meacao: number;
  custos: number;
  /** O que se transmite como herança (depois da meação e dos custos). */
  heranca: number;
  /** A metade dos herdeiros necessários e a parte que o testamento decide. */
  legitima: number;
  disponivel: number;
  herdeiros: Herdeiro[];
  quinhoes: Quinhao[];
  doacao?: { valor: number; destino: string };
  /** Sem herdeiro: para o poder público. */
  vacante: number;
  /** Os bens que ninguém recebeu (vendidos no inventário). */
  vendidos: ItemDoInventario[];
  /** Por que as decisões não cabem (vazio = a partilha é válida). */
  erros: string[];
}

const arred = (x: number) => Math.round(x);

/**
 * A partilha, pela regra do país e pelas decisões do jogador. Pura: lê a vida
 * (morta ou não) e devolve a conta inteira, sem mudar nada.
 */
export function partilhar(v: Vida, d: DecisoesDeHeranca = {}): Partilha {
  const regra = regrasDoPais(paisDaVida(v));
  const inv = inventario(v);
  const erros: string[] = [];
  const bruto = inv.reduce((s, x) => s + x.valor, 0);
  const dividas = obrigacoes(v);
  const dividasPagas = Math.min(bruto, dividas);
  const naoCoberto = dividas - dividasPagas;
  const liquido = bruto - dividasPagas;
  const conjuge = conjugeSobrevivente(v);
  const meacao = conjuge && regra.meacao ? Math.min(liquido, arred(construidoJunto(v, conjuge) / 2)) : 0;
  const base = liquido - meacao;
  const custos = arred(base * regra.custoTransmissao);
  const heranca = base - custos;
  const herdeiros = herdeirosLegais(v, regra);
  const temNecessarios = herdeiros.some(h => h.necessario);
  const legitima = temNecessarios ? arred(heranca * regra.legitima) : 0;
  const disponivel = heranca - legitima;

  // A parte disponível: a doação, o que o testamento dá a alguém, e o resto pela lei.
  const fracDoacao = Math.max(0, Math.min(1, d.doacao?.fracao ?? 0));
  const doacao = fracDoacao > 0 && d.doacao ? { valor: arred(disponivel * fracDoacao), destino: d.doacao.destino } : undefined;
  const elegiveis = new Set([...herdeiros.map(h => h.pessoaId), ...(conjuge ? [conjuge.id] : [])]);
  const escolhas = (d.disponivel ?? []).filter(x => x.fracao > 0);
  for (const x of escolhas) if (!elegiveis.has(x.pessoaId)) erros.push(`${v.pessoas[x.pessoaId]?.nome ?? 'Alguém'} não está entre quem pode receber.`);
  const somaEscolhas = escolhas.reduce((s, x) => s + x.fracao, 0);
  if (somaEscolhas + fracDoacao > 1.0001) erros.push('As escolhas passam do que a parte disponível permite.');
  const livre = Math.max(0, 1 - fracDoacao - somaEscolhas);

  const quinhoes = new Map<string, Quinhao>();
  const q = (id: string, papel: PapelHerdeiro): Quinhao => {
    let x = quinhoes.get(id);
    if (!x) { x = { pessoaId: id, papel, legitima: 0, disponivel: 0, meacao: 0, valor: 0, bens: [], dinheiro: 0 }; quinhoes.set(id, x); }
    return x;
  };
  if (conjuge && meacao > 0) q(conjuge.id, 'conjuge').meacao = meacao;
  for (const h of herdeiros) {
    const x = q(h.pessoaId, h.papel);
    x.legitima += arred(legitima * h.quota);
    x.disponivel += arred(disponivel * livre * h.quota);
  }
  for (const e of escolhas) if (elegiveis.has(e.pessoaId)) {
    const papel = herdeiros.find(h => h.pessoaId === e.pessoaId)?.papel ?? 'conjuge';
    q(e.pessoaId, papel).disponivel += arred(disponivel * e.fracao);
  }
  // Sem herdeiro nenhum: o que o testamento não doou vai para o poder público.
  let vacante = herdeiros.length ? 0 : Math.max(0, heranca - (doacao?.valor ?? 0) - [...quinhoes.values()].reduce((s, x) => s + x.legitima + x.disponivel, 0));
  // O arredondamento fica com quem recebe mais (a conta fecha no centavo de real).
  const lista = [...quinhoes.values()];
  for (const x of lista) x.valor = x.meacao + x.legitima + x.disponivel;
  const distribuido = lista.reduce((s, x) => s + x.valor, 0) + (doacao?.valor ?? 0) + vacante + custos + dividasPagas;
  const sobra = bruto - distribuido;
  if (sobra !== 0) {
    const maior = [...lista].sort((a, b) => b.valor - a.valor)[0];
    if (maior) { maior.disponivel += sobra; maior.valor += sobra; } else vacante += sobra;
  }

  // Bens específicos: entram no quinhão de quem os recebe. Padrão: a casa da família fica com o cônjuge, quando cabe.
  const atribuicoes: Record<string, string> = { ...(d.bens ?? {}) };
  if (!d.bens && conjuge) {
    const casa = inv.find(x => x.moradia);
    const qc = quinhoes.get(conjuge.id);
    if (casa && qc && casa.valor <= qc.valor) atribuicoes[casa.id] = conjuge.id;
  }
  for (const [bemId, pessoaId] of Object.entries(atribuicoes)) {
    const item = inv.find(x => x.id === bemId);
    if (!item || item.tipo === 'dinheiro' || item.tipo === 'aplicacao') continue;
    const x = quinhoes.get(pessoaId);
    if (!x) { erros.push(`${v.pessoas[pessoaId]?.nome ?? 'Alguém'} não recebe parte da herança — não pode ficar com ${item.nome}.`); continue; }
    x.bens.push(item);
  }
  for (const x of lista) {
    const emBens = x.bens.reduce((s, b) => s + b.valor, 0);
    if (emBens > x.valor) erros.push(`${x.bens.map(b => b.nome).join(' e ')} vale${x.bens.length > 1 ? 'm' : ''} mais do que a parte de ${v.pessoas[x.pessoaId]?.nome ?? 'alguém'} (${fmt(x.valor)}).`);
    x.dinheiro = x.valor - emBens;
  }
  const atribuidos = new Set(lista.flatMap(x => x.bens.map(b => b.id)));
  const vendidos = inv.filter(x => (x.tipo === 'imovel' || x.tipo === 'veiculo' || x.tipo === 'negocio') && !atribuidos.has(x.id));
  // As dívidas são pagas antes de tudo: se o dinheiro do que não foi atribuído não basta, os bens atribuídos não podem sair inteiros.
  const caixaLivre = inv.filter(x => !atribuidos.has(x.id)).reduce((s, x) => s + x.valor, 0);
  const precisaDeCaixa = dividasPagas + custos + (doacao?.valor ?? 0) + vacante + lista.reduce((s, x) => s + Math.max(0, x.dinheiro), 0);
  if (precisaDeCaixa > caixaLivre + 1) erros.push('As dívidas e os custos pedem a venda de algum bem que foi deixado para alguém.');

  return { regra, inventario: inv, bruto, dividas, dividasPagas, naoCoberto, liquido, meacao, custos, heranca, legitima, disponivel, herdeiros, quinhoes: lista, doacao, vacante, vendidos, erros };
}

/** A partilha como fica registrada (o formato do save e da tela do fim). */
export function registroDaPartilha(v: Vida, p: Partilha): Heranca {
  const papelReg = (x: PapelHerdeiro): Heranca['partes'][number]['papel'] => x === 'conjuge' ? 'conjuge' : x === 'filho' ? 'filho' : x === 'neto' ? 'neto' : 'outro';
  return {
    liquido: p.liquido,
    partes: p.quinhoes.filter(x => x.valor > 0).map(x => ({ pessoaId: x.pessoaId, valor: x.valor, papel: papelReg(x.papel), ...(x.meacao > 0 ? { meacao: true } : {}), dinheiro: x.dinheiro, bens: x.bens.map(b => b.nome) })),
    bens: v.financas.bens.map(b => b.nome),
    dividas: p.dividasPagas,
    bruto: p.bruto,
    custos: p.custos,
    ...(p.doacao ? { doacao: { valor: p.doacao.valor, destino: nomeDoDestino(p.doacao.destino) } } : {}),
    ...(p.vacante > 0 ? { vacante: p.vacante } : {}),
    ...(p.naoCoberto > 0 ? { naoCoberto: p.naoCoberto } : {}),
    regra: p.regra.pais,
    vendidos: p.vendidos.map(b => b.nome)
  };
}

/** A conta fecha? (o invariante da partilha, usado pelos testes e pela própria troca de protagonista). */
export function partilhaFecha(p: Partilha): boolean {
  const soma = p.dividasPagas + p.custos + p.vacante + (p.doacao?.valor ?? 0) + p.quinhoes.reduce((s, x) => s + x.valor, 0);
  const emEspecie = p.quinhoes.every(x => x.dinheiro + x.bens.reduce((s, b) => s + b.valor, 0) === x.valor);
  return soma === p.bruto && emEspecie;
}

/* ================================================== Quem pode continuar */

export interface Sucessor {
  pessoa: Pessoa;
  idade: number;
  laco: string;
  /** Pode continuar? (e por quê não) */
  pode: boolean;
  motivo?: string;
  /** Contexto para a escolha, em frases curtas. */
  onde: string;
  ocupacao: string;
  familia: string;
  dinheiro: string;
  traco?: string;
  /** O que a família sabe da saúde dela (o que tem nome) — e que vai junto se ela continuar. */
  saude?: string;
  /** Quem ficaria com a guarda (menor de idade). */
  guarda?: string;
}

/** Filhos e filhas vivos (biológicos ou adotivos): quem pode continuar a história. Nunca ninguém inventado. */
export function sucessores(v: Vida): Sucessor[] {
  const out: Sucessor[] = [];
  for (const vin of Object.values(v.vinculos)) {
    if (!ehFilhoDeVerdade(vin)) continue;
    const p = v.pessoas[vin.pessoaId];
    if (!p || !p.vivo || p.especie) continue;
    const i = idadePessoa(v, p);
    const tutor = i < 18 ? guardiao(v, p) : undefined;
    const filhosDela = Object.values(v.pessoas).filter(x => x.genitores?.includes(p.id) && x.vivo && !x.especie);
    const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
    const casado = v.fatos[`casou_${p.id}`] !== undefined;
    const familia = [
      par?.vivo ? `${casado ? flex(par.genero, 'casado com', 'casada com', 'casade com').replace(/^casad[oae] com/, flex(p.genero, 'casado com', 'casada com', 'casade com')) : 'namora'} ${par.nome}` : i >= 18 ? flex(p.genero, 'solteiro', 'solteira', 'solteire') : '',
      filhosDela.length ? (filhosDela.length === 1 ? `${flex(filhosDela[0].genero, 'um filho', 'uma filha', 'ume filhe')}, ${filhosDela[0].nome}` : `${filhosDela.length} filhos`) : ''
    ].filter(Boolean).join(' · ');
    const mesmaCasa = vin.convivio.includes('casa');
    const guardado = p.posses?.dinheiro ?? economiasEstimadas(v, p);
    out.push({
      pessoa: p,
      idade: i,
      laco: flex(p.genero, 'filho', 'filha', 'filhe') + (v.fatos[`adotado_${p.id}`] !== undefined ? flex(p.genero, ' adotivo', ' adotiva', ' adotive') : ''),
      pode: i >= 18 || !!tutor,
      motivo: i < 18 && !tutor ? 'Não há um adulto da família que possa assumir a guarda — quem decidiria seria a Justiça.' : undefined,
      onde: `${mesmaCasa ? 'morava com você' : 'mora'} em ${nomeLugar(p.municipioId)}`,
      ocupacao: i < 18 ? (i >= 4 ? 'estudante' : 'criança') : p.ocupacao ? `${p.ocupacao}${p.formacao ? ` · ${p.formacao}` : ''}` : (p.formacao ?? 'sem ocupação'),
      familia,
      dinheiro: i < 18 ? 'depende da família' : p.renda > 0 ? `renda de ${fmt(p.renda)} por mês${guardado > 1000 ? `, ${fmt(guardado)} guardados` : ''}` : guardado > 1000 ? `sem renda; ${fmt(guardado)} guardados` : 'sem renda',
      traco: tracoDe(p),
      saude: saudeConhecida(p),
      guarda: tutor ? `${tutor.nome} (${lacoDoGuardiao(v, p, tutor)})` : undefined
    });
  }
  return out.sort((a, b) => b.idade - a.idade);
}

/** O jeito da pessoa, pelo temperamento (o mesmo que a ficha dela mostra). */
function tracoDe(p: Pessoa): string | undefined {
  const t = p.temperamento;
  const eixos: [number, string, string][] = [
    [t.extroversao, flex(p.genero, 'expansivo', 'expansiva', 'expansive'), flex(p.genero, 'reservado', 'reservada', 'reservade')],
    [t.afabilidade, flex(p.genero, 'afetuoso', 'afetuosa', 'afetuose'), flex(p.genero, 'difícil de agradar', 'difícil de agradar')],
    [t.responsabilidade, flex(p.genero, 'organizado', 'organizada', 'organizade'), 'de pouca rotina'],
    [t.estabilidade, flex(p.genero, 'tranquilo', 'tranquila', 'tranquile'), flex(p.genero, 'ansioso', 'ansiosa', 'ansiose')],
    [t.abertura, 'curios' + flex(p.genero, 'o', 'a', 'e'), flex(p.genero, 'apegado ao conhecido', 'apegada ao conhecido', 'apegade ao conhecido')]
  ];
  const forte = eixos.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]))[0];
  if (!forte || Math.abs(forte[0]) < 0.35) return undefined;
  return forte[0] > 0 ? forte[1] : forte[2];
}

/** Quem fica com a guarda de um menor: o outro genitor vivo, quem morava junto com ele (madrasta, padrasto), um irmão adulto, um avô, um tio. */
export function guardiao(v: Vida, p: Pessoa): Pessoa | undefined {
  const vivo = (id?: string) => (id && id !== 'eu' && v.pessoas[id]?.vivo && !v.pessoas[id].especie ? v.pessoas[id] : undefined);
  const outroGenitor = (p.genitores ?? []).map(id => vivo(id)).find(Boolean);
  if (outroGenitor && idadePessoa(v, outroGenitor) >= 18) return outroGenitor;
  const conjuge = conjugeSobrevivente(v);
  if (conjuge && v.vinculos[p.id]?.convivio.includes('casa') && v.vinculos[conjuge.id]?.convivio.includes('casa')) return conjuge;
  const irmaoAdulto = Object.values(v.vinculos).filter(x => x.parentesco === 'filho' && x.pessoaId !== p.id).map(x => vivo(x.pessoaId)).filter((x): x is Pessoa => !!x && idadePessoa(v, x) >= 21).sort((a, b) => b.tNasc - a.tNasc)[0];
  if (irmaoAdulto) return irmaoAdulto;
  const avo = Object.values(v.vinculos).filter(x => x.parentesco === 'mae' || x.parentesco === 'pai').map(x => vivo(x.pessoaId)).filter((x): x is Pessoa => !!x && idadePessoa(v, x) < 85)[0];
  if (avo) return avo;
  return Object.values(v.vinculos).filter(x => x.parentesco === 'irmao' || x.parentesco === 'meio_irmao').map(x => vivo(x.pessoaId)).filter((x): x is Pessoa => !!x && idadePessoa(v, x) >= 21 && idadePessoa(v, x) < 80)[0];
}

function lacoDoGuardiao(v: Vida, p: Pessoa, g: Pessoa): string {
  if (p.genitores?.includes(g.id)) return flex(g.genero, 'o pai', 'a mãe', 'a mãe');
  const par = v.vinculos[g.id]?.parentesco;
  if (par === 'filho') return flex(g.genero, 'o irmão mais velho', 'a irmã mais velha', 'ume irmane mais velhe');
  if (par === 'mae' || par === 'pai') return flex(g.genero, 'o avô', 'a avó', 'a avó');
  if (par === 'irmao' || par === 'meio_irmao') return flex(g.genero, 'o tio', 'a tia', 'ume tie');
  return flex(g.genero, 'o padrasto', 'a madrasta', 'quem morava junto');
}

/* ================================================== Economias de quem não é o protagonista */

export function garantirPosses(p: Pessoa): Posses {
  return (p.posses ??= { dinheiro: 0, bens: [], historia: [] });
}

/* ================================================== Aplicar a partilha */

function bemDoInventario(v: Vida, item: ItemDoInventario): Bem | undefined {
  return v.financas.bens.find(b => b.id === item.id);
}

/** Entrega a cada pessoa o que coube a ela (NPC: nas posses; o protagonista que continua recebe à parte). */
function entregarAosNpcs(v: Vida, p: Partilha, nomeMorto: string, exceto?: string): void {
  for (const x of p.quinhoes) {
    if (x.pessoaId === exceto) continue;
    const pe = v.pessoas[x.pessoaId];
    if (!pe) continue;
    const pos = garantirPosses(pe);
    // Saves anteriores ao acompanhamento: as economias que a pessoa já tinha entram junto (estimadas uma única vez).
    if (pos.dinheiro === 0 && pos.historia.length === 0) {
      const ja = economiasEstimadas(v, { ...pe, posses: undefined });
      if (ja > 0) { pos.dinheiro += ja; pos.historia.push({ t: v.t, texto: 'Economias do próprio trabalho', valor: ja }); }
    }
    // MUNDO: quem herda e mora em outro país recebe o quinhão pelo câmbio (o mesmo valor de mercado, na unidade de
    // lá — `mundo/moeda`): a herança não cria nem some dinheiro ao atravessar a fronteira.
    const k = converterEntrePaises(1, paisDaVida(v), paisDaPessoa(pe));
    pos.dinheiro += x.dinheiro * k;
    for (const b of x.bens) {
      if (b.tipo === 'negocio') {
        const n = v.caminhos.negocio;
        if (n) pos.negocio = { ...structuredClone(n), passivo: true };
      } else {
        const bem = bemDoInventario(v, b);
        if (bem) pos.bens.push({ ...structuredClone(bem), valor: bem.valor * k, dono: 'eu', ...(bem.tipo === 'imovel' ? { herdado: true } : {}), historia: [...(bem.historia ?? []), { t: v.t, texto: `Herdad${bem.tipo === 'imovel' ? 'o' : 'o'} de ${nomeMorto}.` }] } as Bem);
      }
    }
    pos.historia.push({ t: v.t, texto: `Herança de ${nomeMorto}${x.meacao > 0 ? ' (com a meação)' : ''}`, valor: x.valor * k });
  }
}

/* ================================================== Encerrar */

/** Encerra a história aqui: a partilha é feita (com as decisões do jogador) e fica registrada. Nada continua. */
export function encerrarHistoria(vida: Vida): { vida: Vida; erro?: string } {
  if (!vida.morte) return { vida, erro: 'Esta vida não terminou.' };
  if (vida.morte.encerrada) return { vida };
  const p = partilhar(vida, vida.morte.decisoes);
  if (p.erros.length) return { vida, erro: p.erros[0] };
  const { vida: nova } = transacao(vida, v => {
    entregarAosNpcs(v, p, `${v.eu.nome}`);
    v.morte!.heranca = registroDaPartilha(v, p);
    v.morte!.encerrada = true;
  });
  return { vida: nova };
}

/** Guarda as decisões sobre a herança (a tela do legado), sem fazer a partilha ainda. */
export function decidirHeranca(vida: Vida, d: DecisoesDeHeranca): Vida {
  if (!vida.morte || vida.morte.encerrada) return vida;
  return transacao(vida, v => { v.morte!.decisoes = d; v.morte!.heranca = registroDaPartilha(v, partilhar(v, d)); }).vida;
}

/* ================================================== Continuar como */

/** A geração que termina, como a família vai lembrar. */
function registrarGeracao(v: Vida, pessoaId: string, p: Partilha, sucessor?: Pessoa): Geracao {
  return {
    pessoaId,
    nome: v.eu.nome,
    sobrenome: v.eu.sobrenome,
    genero: v.eu.genero,
    ...(v.eu.tratamento ? { tratamento: v.eu.tratamento } : {}),
    visual: structuredClone(v.eu.visual),
    tNasc: v.eu.tNasc,
    tMorte: v.morte!.t,
    causa: v.morte!.causa,
    municipioNatal: v.eu.municipioNatal,
    municipioMorte: v.moradia.municipioId,
    resumo: retrospectiva(v),
    trajetorias: trajetoriasDaVida(v).map(t => ({ titulo: t.titulo, periodo: t.periodo, resumo: t.resumo })),
    biografia: v.biografia.filter(e => e.relevancia === 'marco' || e.relevancia === 'biografia').map(e => ({ t: e.t, idade: e.idade, texto: e.texto, marco: e.relevancia === 'marco' })),
    heranca: registroDaPartilha(v, p),
    ...(sucessor ? { sucessor: { nome: sucessor.nome, laco: flex(sucessor.genero, 'filho', 'filha', 'filhe'), idade: idadePessoa(v, sucessor) } } : {}),
    ...(v.notoriedade && v.notoriedade.pico >= 5 ? { notoriedade: { pico: v.notoriedade.pico, fonte: v.notoriedade.fonte } } : {})
  };
}

/** O temperamento da pessoa vira a personalidade de quem passa a ser jogado (a personalidade emergente que ela já tinha). */
function personalidadeDe(p: Pessoa, t: number): Personalidade {
  const tp = p.temperamento;
  const c = (x: number, k: number) => Math.max(-100, Math.min(100, Math.round(x * k))) || 0;
  const tracos: Record<Traco, number> = {
    empatia: c(tp.afabilidade, 45),
    generosidade: c(tp.afabilidade * 0.6 + tp.abertura * 0.2, 40),
    disciplina: c(tp.responsabilidade, 45),
    impulsividade: c(-tp.estabilidade * 0.6 - tp.responsabilidade * 0.3, 40),
    coragem: c(tp.abertura * 0.5 + tp.extroversao * 0.3, 40),
    sociabilidade: c(tp.extroversao, 45),
    independencia: c(tp.abertura * 0.6 - tp.afabilidade * 0.2, 35),
    familia: c(tp.afabilidade * 0.4 + tp.responsabilidade * 0.3, 35)
  };
  return { tracos, evidencias: [{ t, origem: 'o jeito de antes', impactos: {} }] };
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** O bruto de um líquido mensal (a conta inversa do desconto). */
function brutoDe(liq: number, contrato: Emprego['contrato']): number {
  let lo = liq, hi = liq * 2.2;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (liquidoDe(m, contrato) < liq) lo = m; else hi = m; }
  return Math.round(hi / 10) * 10;
}

const ESCOLARIDADE_NPC: Record<NonNullable<Pessoa['vida']>['escolaridade'], Escolaridade> = { fundamental: 'fundamental', medio: 'medio', tecnico: 'tecnico', superior: 'superior' };

/**
 * Continua a história como `herdeiroId` (um filho ou filha vivo da pessoa
 * que morreu). Faz a partilha com as decisões guardadas e devolve a vida
 * DELA: mesma pessoa, mesma idade, mesma família — vista dela.
 */
const NOME_DA_LEMBRANCA: Record<string, string> = { violao: 'o violão', violino: 'o violino', guitarra: 'a guitarra', piano: 'o piano', camera: 'a câmera', bateria: 'a bateria', teclado: 'o teclado' };

export function continuarComo(vida: Vida, herdeiroId: string): { vida: Vida; erro?: string } {
  if (!vida.morte) return { vida, erro: 'Esta vida ainda não terminou.' };
  if (vida.morte.encerrada) return { vida, erro: 'Esta história foi encerrada.' };
  const suc = sucessores(vida).find(s => s.pessoa.id === herdeiroId);
  if (!suc) return { vida, erro: 'Só um filho ou uma filha viva pode continuar a história.' };
  if (!suc.pode) return { vida, erro: suc.motivo ?? 'Não é possível continuar com essa pessoa.' };
  const p = partilhar(vida, vida.morte.decisoes);
  if (p.erros.length) return { vida, erro: p.erros[0] };

  const { vida: nova } = transacao(vida, (v, r) => {
    const tMorte = v.morte!.t;
    const h = v.pessoas[herdeiroId];
    const oldId = novoId(v, 'p');
    const nomeMorto = v.eu.nome;
    const vinHerdeiro = v.vinculos[herdeiroId];
    const moravaJunto = vinHerdeiro.convivio.includes('casa');
    const conjuge = conjugeSobrevivente(v);
    const quinhaoDela = p.quinhoes.find(x => x.pessoaId === herdeiroId);
    const geracao = registrarGeracao(v, oldId, p, h);
    // A saúde dela é a que ela já tinha: as condições acompanhadas (ou, de quem ainda não era, os anos vividos até aqui).
    garantirCondicoes(v, h);

    // 1. Quem morreu passa a ser uma pessoa do mundo (falecida), com quem tinha como pais.
    const paisDoMorto = Object.values(v.vinculos).filter(x => x.parentesco === 'mae' || x.parentesco === 'pai').map(x => x.pessoaId);
    const ultimoEmprego = v.trabalho.atual ?? v.trabalho.historico[v.trabalho.historico.length - 1];
    const ocMorto = ultimoEmprego ? ocupacaoOuNula(ultimoEmprego.ocupacaoId) : undefined;
    const tp = v.personalidade.tracos;
    const morto: Pessoa = {
      id: oldId, nome: v.eu.nome, sobrenome: v.eu.sobrenome, genero: v.eu.genero, tNasc: v.eu.tNasc, vivo: false, tMorte, causaMorte: v.morte!.causa,
      temperamento: { extroversao: tp.sociabilidade / 100, afabilidade: tp.empatia / 100, responsabilidade: tp.disciplina / 100, abertura: tp.coragem / 100, estabilidade: -tp.impulsividade / 100 },
      ...(ocMorto ? { ocupacao: v.eu.genero === 'feminino' ? ocMorto.nome[1] : ocMorto.nome[0], ocupacaoId: ocMorto.id } : {}),
      renda: 0, municipioId: v.moradia.municipioId, saude: 0, visual: structuredClone(v.eu.visual),
      ...(v.eu.ancestralidade ? { ancestralidade: v.eu.ancestralidade } : {}), ...(v.eu.tradicao ? { tradicao: v.eu.tradicao } : {}),
      ...(paisDoMorto.length ? { genitores: paisDoMorto } : {}), municipioNatal: v.eu.municipioNatal,
      // O que quem morreu tinha de crônico fica na ficha dele: é o histórico da família de quem continua.
      condicoes: v.corpo.condicoes.filter(c => c.cronica && !c.lesao).map(c => ({
        id: c.id, tInicio: c.tInicio, gravidade: c.gravidade, diagnosticada: c.diagnosticada !== false, tratando: c.tratando,
        ...(c.tDiagnostico !== undefined ? { tDiagnostico: c.tDiagnostico } : {}), ...(c.tarde ? { tarde: true } : {})
      }))
    };
    v.pessoas[oldId] = morto;

    // 2. A partilha chega a quem ficou (exceto a parte de quem continua, que vem para a conta dela).
    entregarAosNpcs(v, p, nomeMorto, herdeiroId);

    // 3. A árvore muda de ponto de vista: 'eu' era quem morreu; agora é quem continua.
    const antigos = v.vinculos;
    for (const pe of Object.values(v.pessoas)) {
      if (pe.genitores) pe.genitores = pe.genitores.map(g => (g === 'eu' ? oldId : g === herdeiroId ? 'eu' : g));
      if (pe.parceiroId === herdeiroId) pe.parceiroId = undefined;
    }
    const parDela = h.parceiroId ? v.pessoas[h.parceiroId] : undefined;
    const novos = reconciliarParentescos(v, antigos, herdeiroId, oldId, conjuge?.id);

    // 4. A pessoa que continua: o que ela já era.
    const i = idadePessoa(v, h);
    const novoT = v.t + (((h.tNasc - v.t) % 12) + 12) % 12;
    const vidaNpc = h.vida;
    const pred = derivarPredisposicoes(`${v.id}:${h.id}`);
    const aptidao = vidaNpc?.aptidao ?? 0;
    const guarda = i < 18 ? guardiao(vida, vida.pessoas[herdeiroId]) : undefined;
    const tratamento = h.genero === 'nao_binario' ? 'nao_binario' as Genero : undefined;
    const habitos = habitosDaPessoa(h, i);
    v.eu = {
      nome: h.nome, sobrenome: h.sobrenome, genero: h.genero, tNasc: h.tNasc,
      municipioNatal: h.municipioNatal ?? v.eu.municipioNatal,
      // A nacionalidade é a que a pessoa já tinha (quem nasceu em Buenos Aires, filha de brasileiro, é das duas).
      nacionalidades: nacionalidadesDaPessoa(h),
      ...(h.atracao ? { atracao: h.atracao } : {}),
      visual: structuredClone(h.visual ?? v.eu.visual),
      ...(tratamento ? { tratamento } : {}),
      // REWORK 4: quem continua é quem já era — a ancestralidade, a tradição e a semente do retrato dela (a roupa e o
      // fundo do rosto não mudam na troca).
      ...(h.ancestralidade ? { ancestralidade: h.ancestralidade } : {}), ...(h.tradicao ? { tradicao: h.tradicao } : {}),
      semente: h.id
    };
    v.corpo = {
      saude: clamp(Math.round(h.saude)),
      forma: clamp(Math.round(pisoDeForma(i) + 8 + pred.fisica * 6 + (i < 18 ? 6 : 0))),
      aparencia: clamp(Math.round(55 + pred.artistica * 4)),
      aparenciaBase: clamp(Math.round(55 + pred.artistica * 4)),
      // As condições e os hábitos dela, 1:1: o que tem nome continua com nome, o tratamento continua, o que ninguém
      // nomeou continua sem nome (e age sobre o corpo, com os sinais na tela "Você").
      condicoes: (h.condicoes ?? []).map(condicaoDaPessoa).filter((c): c is Condicao => !!c),
      habitos: { fuma: habitos.fuma, bebe: i >= 18 ? 'social' : 'nao', sedentario: habitos.sedentario },
      podeGestar: h.genero === 'feminino'
    };
    const pesoLuto = clamp(Math.round((vinHerdeiro.proximidade ?? 60) * 0.9 + 20));
    v.mente = {
      felicidade: clamp(Math.round(62 - pesoLuto * 0.15)),
      estresse: clamp(Math.round(22 + pesoLuto * 0.1)),
      cognicao: clamp(Math.round(55 + aptidao * 30 + pred.cognitiva * 8)),
      abalos: [{ t: tMorte, texto: `a morte de ${flex(v.pessoas[oldId].genero, 'seu pai', 'sua mãe', 'sue mãe')}`, humor: -Math.round(pesoLuto * 0.15), cabeca: Math.round(pesoLuto * 0.1) }],
      historico: []
    };
    v.predisposicoes = pred;
    v.personalidade = personalidadeDe(h, novoT);
    v.vinculos = novos;

    // 5. A casa: com quem e onde a pessoa mora agora.
    const casa = p.inventario.find(x => x.moradia);
    const casaFicouCom = casa ? p.quinhoes.find(x => x.bens.some(b => b.id === casa.id))?.pessoaId : undefined;
    const imovelDaCasa = casa ? (vida.financas.bens.find(b => b.id === casa.id) as Imovel | undefined) : undefined;
    const antigaMoradia = vida.moradia;
    // A herdeira que mora em outro país recebe pelo câmbio (a casa no Brasil passa a valer, para ela, o mesmo em pesos).
    const kHerdeira = converterEntrePaises(1, paisDaVida(vida), paisDaCidade(h.municipioId));
    const recebidos: Bem[] = (quinhaoDela?.bens ?? []).filter(b => b.tipo !== 'negocio').map(b => vida.financas.bens.find(x => x.id === b.id)).filter((b): b is Bem => !!b)
      .map(b => ({ ...structuredClone(b), valor: b.valor * kHerdeira, dono: 'eu' as const, ...(b.tipo === 'imovel' ? { herdado: true } : {}), historia: [...(b.historia ?? []), { t: tMorte, texto: `Herdad${b.tipo === 'imovel' ? 'o' : 'o'} de ${nomeMorto}.` }] } as Bem));
    const proprios = h.posses?.bens ?? [];
    v.financas = {
      conta: 0, investimentos: [], dividas: [], bens: [...proprios.map(b => structuredClone(b)), ...recebidos],
      estilo: i < 18 ? 'modesto' : h.renda > 9000 ? 'confortavel' : 'modesto', planoDeSaude: vida.financas.planoDeSaude && (i < 18 || h.renda > 5000),
      negativado: false, razao: [], historico: []
    };
    const daCasa = (id: string) => novos[id]?.convivio.includes('casa');
    const residentes = Object.keys(novos).filter(daCasa);
    if (i < 18 && guarda) {
      const g = v.pessoas[guarda.id];
      if (h.genitores?.includes(guarda.id) || guarda.id === conjuge?.id) {
        v.moradia = { tipo: 'pais', municipioId: g.municipioId, aluguel: 0, padrao: antigaMoradia.padrao, tInicio: moravaJunto && g.municipioId === antigaMoradia.municipioId ? antigaMoradia.tInicio : novoT };
      } else {
        v.moradia = { tipo: 'parente', municipioId: g.municipioId, aluguel: 0, padrao: 3, tInicio: novoT, anfitriaoId: g.id };
      }
    } else if (moravaJunto && casaFicouCom === herdeiroId && imovelDaCasa) {
      v.moradia = { tipo: 'propria', municipioId: imovelDaCasa.municipioId, imovelId: imovelDaCasa.id, modeloId: imovelDaCasa.modeloId, aluguel: 0, padrao: antigaMoradia.padrao, tInicio: antigaMoradia.tInicio, ...(imovelDaCasa.bairro ? { bairro: imovelDaCasa.bairro } : {}) };
    } else if (moravaJunto && conjuge && residentes.includes(conjuge.id) && (casaFicouCom === conjuge.id || antigaMoradia.tipo !== 'propria')) {
      v.moradia = { tipo: h.genitores?.includes(conjuge.id) ? 'pais' : 'parente', municipioId: antigaMoradia.municipioId, aluguel: 0, padrao: antigaMoradia.padrao, tInicio: antigaMoradia.tInicio, ...(h.genitores?.includes(conjuge.id) ? {} : { anfitriaoId: conjuge.id }) };
    } else if (moravaJunto && antigaMoradia.tipo === 'aluguel') {
      v.moradia = { ...structuredClone(antigaMoradia), atraso: undefined, atrasoDesde: undefined };
    } else {
      const casaPropria = v.financas.bens.find((b): b is Imovel => b.tipo === 'imovel' && b.municipioId === h.municipioId && !b.alugadoPor);
      if (casaPropria) {
        v.moradia = { tipo: 'propria', municipioId: h.municipioId, imovelId: casaPropria.id, modeloId: casaPropria.modeloId, aluguel: 0, padrao: modeloMoradia(casaPropria.modeloId).padrao, tInicio: novoT };
      } else {
        const familia = residentes.length;
        const renda = h.renda + (parDela?.vivo && daCasa(parDela.id) ? parDela.renda : 0);
        const modelo = modeloMoradia(familia >= 3 ? (renda > 9000 ? 'apto_3q' : 'apto_2q') : familia >= 1 ? 'apto_2q' : renda < 2500 ? 'kitnet' : 'apto_1q');
        v.moradia = { tipo: 'aluguel', municipioId: h.municipioId, modeloId: modelo.id, aluguel: aluguelDe(v, modelo, h.municipioId), padrao: modelo.padrao, tInicio: Math.min(novoT, v.fatos[`saiu_de_casa_${h.id}`] ?? novoT), aceitaPet: true };
      }
    }
    if (casa && moravaJunto && casaFicouCom === undefined && !(i < 18 && guarda && guarda.id !== conjuge?.id)) {
      // A casa foi vendida no inventário: quem morava nela sai.
      for (const id of Object.keys(novos)) if (novos[id].convivio.includes('casa') && v.moradia.tipo === 'aluguel' && !residentes.includes(id)) novos[id].convivio = novos[id].convivio.filter(c => c !== 'casa');
    }

    // 5b. FIX pós-REWORK 4 — as COISAS de quem morreu (o violão, a câmera, os livros, a TV): não somem. Quem continua
    // na mesma casa fica com o que é da casa; quem vive em outra leva o que é pessoal e tem uso (a lembrança que se usa).
    // As redes sociais eram de quem morreu: quem continua começa sem conta (e sem os laços digitais de outra pessoa).
    const coisasDoMorto = vida.financas.coisas ?? [];
    const mesmaCasa = moravaJunto && v.moradia.municipioId === antigaMoradia.municipioId && (v.moradia.imovelId === antigaMoradia.imovelId || v.moradia.tipo === antigaMoradia.tipo);
    const pessoais = new Set(['violao', 'violino', 'guitarra', 'teclado', 'bateria', 'piano', 'camera', 'livros', 'tabuleiro', 'jogos_tabuleiro', 'material_arte', 'videogame', 'raquete', 'prancha', 'camping']);
    const ficam = coisasDoMorto.filter(c => mesmaCasa || pessoais.has(c.coisaId)).map(c => structuredClone(c));
    if (ficam.length) v.financas.coisas = ficam;
    v.redes = undefined;
    for (const x of Object.values(novos)) x.digital = undefined;

    // 6. O dinheiro: o que já era dela e o que herdou. Menor de idade: a herança fica aplicada em nome dela até os 18.
    const ja = h.posses ? h.posses.dinheiro : economiasEstimadas(vida, vida.pessoas[herdeiroId]);
    const herdou = (quinhaoDela?.dinheiro ?? 0) * kHerdeira;
    // O extrato dela abre com o que ela já tinha; a herança entra como linha (a conta de cada real continua fechando).
    v.financas.extratoAberto = { tInicio: novoT, contaInicial: ja, aplicadoInicial: 0, linhas: [] };
    if (herdou > 0) lancar(v, `Herança de ${nomeMorto}`, 'familia', i < 18 ? 0 : herdou, i < 18 ? herdou : 0);
    if (i < 18) {
      v.financas.conta = ja;
      if (herdou > 0) v.financas.investimentos.push({ id: 'apl_pos_fixado', produto: 'pos_fixado', aportado: herdou, valor: herdou, tInicio: novoT, historico: [], pico: herdou, tutelaAte: h.tNasc + 18 * 12 });
    } else {
      v.financas.conta = ja + herdou;
    }
    if (h.posses?.negocio) v.caminhos = { ...caminhosVazios(), negocio: h.posses.negocio };
    else v.caminhos = caminhosVazios();
    const negocioHerdado = quinhaoDela?.bens.some(b => b.tipo === 'negocio') && vida.caminhos.negocio;
    if (negocioHerdado) v.caminhos.negocio = { ...structuredClone(vida.caminhos.negocio!), passivo: true, socioId: vida.caminhos.negocio!.socioId && v.pessoas[vida.caminhos.negocio!.socioId] ? vida.caminhos.negocio!.socioId : undefined, equipe: (vida.caminhos.negocio!.equipe ?? []).filter(f => !!v.pessoas[f.pessoaId]) };
    v.fatos = {};
    if (vida.fatos['recessao_ate'] !== undefined) v.fatos['recessao_ate'] = vida.fatos['recessao_ate'];
    // Fatos sobre as pessoas que continuam na vida (o casamento de um irmão, a saída de casa de um filho dela).
    for (const [k, x] of Object.entries(vida.fatos)) {
      const m = /^(casou|namoro|uniao_cartorio|saiu_de_casa|adotado|ex_genro)_(.+)$/.exec(k);
      if (m && m[2] !== herdeiroId && v.vinculos[m[2]]) v.fatos[k] = x;
    }
    // A história da saúde dela: o diagnóstico já aconteceu (não se anuncia de novo), o controle já veio.
    for (const c of v.corpo.condicoes) {
      v.fatos[`teve_${c.id}`] = 1;
      if (c.diagnosticada === false || c.tDiagnostico === undefined) continue;
      v.fatos[`diagnostico_${c.id}`] = c.tDiagnostico;
      if ((c.id === 'hipertensao' || c.id === 'diabetes') && c.tratando && novoT - c.tDiagnostico >= 24) v.fatos[`controle_${c.id}`] = c.tDiagnostico + 24;
    }
    const herdadoTotal = (quinhaoDela?.valor ?? 0);
    if (herdadoTotal > 0) v.fatos['herdado_total'] = herdadoTotal;
    if (h.posses?.historia.some(x => x.texto.startsWith('Herança'))) v.fatos['herdado_total'] = (v.fatos['herdado_total'] ?? 0) + h.posses.historia.filter(x => x.texto.startsWith('Herança')).reduce((s, x) => s + x.valor, 0);
    if (Object.values(novos).some(x => x.parentesco === 'neto')) v.fatos['virou_avo'] = tMorte;
    if (i >= 18 && (v.fatos[`saiu_de_casa_${h.id}`] !== undefined || !moravaJunto)) { v.fatos['saiu_de_casa'] = vida.fatos[`saiu_de_casa_${h.id}`] ?? novoT; v.fatos['independencia'] = vida.fatos[`saiu_de_casa_${h.id}`] ?? novoT; }
    if (parDela?.vivo) {
      const desde = vida.fatos[`namoro_${h.id}`] ?? novoT - 24;
      const casou = vida.fatos[`casou_${h.id}`];
      if (casou !== undefined) { v.fatos[`uniao_${parDela.id}`] = casou; v.fatos[`patrimonio_uniao_${parDela.id}`] = Math.max(0, ja); v.fatos[`herdado_ate_uniao_${parDela.id}`] = 0; }
      if (casou !== undefined && vida.fatos[`uniao_cartorio_${h.id}`] === 1) v.fatos['casou'] = casou;
      v.fatos[`namoro_desde_${parDela.id}`] = desde;
    }
    for (const filho of Object.values(v.pessoas)) if (filho.genitores?.includes('eu') && !filho.especie) v.fatos[`filho_${filho.id}`] = filho.tNasc;

    // 7. Formação e trabalho: o que a ficha dela já dizia.
    v.educacao = educacaoDe(v, h, i, aptidao);
    v.trabalho = trabalhoDe(v, h, i);

    // 8. A casa de origem: o lar de quem continua é o de quem ficou (a reserva é o que ficou com essa pessoa).
    const classe = classeNoNascimento(vida, h.tNasc);
    const outroGenitor = (h.genitores ?? []).filter(g => g !== oldId).map(g => v.pessoas[g]).find(x => x?.vivo);
    const casaDeOrigem = outroGenitor ?? (guarda ? v.pessoas[guarda.id] : undefined);
    let reserva = 0;
    if (casaDeOrigem?.posses && casaDeOrigem.posses.dinheiro > 0) { reserva = casaDeOrigem.posses.dinheiro; casaDeOrigem.posses.dinheiro = 0; casaDeOrigem.posses.historia.push({ t: tMorte, texto: 'Virou a reserva da casa', valor: -reserva }); }
    v.origem = {
      classe,
      arranjo: (h.genitores ?? []).length >= 2 ? 'pais_juntos' : vida.eu.genero === 'masculino' ? 'pai_solo' : 'mae_solo',
      reserva,
      ...(casaDeOrigem && reserva > 0 ? { reservaDe: casaDeOrigem.id } : {}),
      ...(guarda && !h.genitores?.includes(guarda.id) ? { responsavelId: guarda.id } : {}),
      apoios: [],
      contribuicao: 'combinado',
      bairro: vida.origem.bairro ?? bairroDeOrigem(vida.id, classe, v.eu.municipioNatal)
    };

    // 9. O resto do estado é dela (ou de ninguém ainda): nada da vida de quem morreu continua aberto nela.
    v.processos = processosDaFamilia(v, h, parDela);
    v.rotinas = [];
    v.biografia = [];
    v.momento = null;
    v.ocorrencias = [];
    v.anoAtual = { acoes: [] };
    v.luto = [{ pessoaId: oldId, t: tMorte, peso: pesoLuto }];
    v.justica = undefined;
    v.segredos = undefined;
    v.deslocamento = undefined;
    // Filho de alguém conhecido é conhecido por associação — pouco, e passa (o motor deixa decair: não há fonte própria).
    const pico = vida.notoriedade?.pico ?? 0;
    v.notoriedade = pico >= 25 ? { valor: Math.round(Math.min(18, pico * 0.18) * 10) / 10, pico: Math.round(Math.min(18, pico * 0.18) * 10) / 10, t: novoT } : undefined;
    v.morte = undefined;
    const linhagem: Linhagem = { geracoes: [...(vida.linhagem?.geracoes ?? []), geracao] };
    v.linhagem = linhagem;

    // 10. A Linha da Vida dela: a vida que já viveu (o que a ficha registrava), a morte de quem a criou, a herança.
    v.t = tMorte;
    escreverVidaAnterior(v, h, vidaNpc?.trajetoria ?? [], oldId, vida);
    const ultimo = v.pessoas[oldId];
    const laco = flex(ultimo.genero, 'seu pai', 'sua mãe', 'sue mãe');
    escrever(v, { t: tMorte, texto: `Em ${MESES[mesDe(tMorte)]} de ${anoDe(tMorte)}, ${laco}, ${nomeMorto}, morreu aos ${idadeEm(ultimo.tNasc, tMorte)} anos (${vida.morte!.causa}).`, relevancia: 'marco', tema: 'perda', tom: 'ruim', pessoas: [oldId], evento: { tipo: 'morte', pessoaId: oldId, peso: pesoLuto } });
    const partes: string[] = [];
    if (quinhaoDela && quinhaoDela.valor > 0) {
      const bens = quinhaoDela.bens.map(b => b.tipo === 'negocio' ? `o negócio (${b.nome})` : b.moradia ? 'a casa da família' : b.nome);
      partes.push(`coube a você ${bens.length ? `${listaNatural(bens)}${quinhaoDela.dinheiro > 0 ? ` e ${fmt(quinhaoDela.dinheiro)}` : ''}` : fmt(quinhaoDela.dinheiro)}`);
      if (i < 18 && quinhaoDela.dinheiro > 0) partes.push(`o dinheiro fica aplicado em seu nome até os 18${guarda ? `, aos cuidados de ${guarda.nome}` : ''}`);
    } else if (p.liquido <= 0) partes.push(p.naoCoberto > 0 ? 'as dívidas levaram o que havia, e o que faltou se extinguiu com o espólio' : 'não havia bens a dividir');
    else partes.push('a sua parte foi para outras pessoas da família, como ficou decidido');
    if (p.doacao) partes.push(`${fmt(p.doacao.valor)} foram doados para ${nomeDoDestino(p.doacao.destino)}`);
    escrever(v, { t: tMorte + 1, texto: `O inventário de ${nomeMorto} terminou: ${partes.join('; ')}.`, relevancia: 'biografia', tema: 'dinheiro', pessoas: [oldId] });
    // A lembrança que se usa: o instrumento, a câmera, os livros de quem morreu ficaram com você.
    const lembranca = (v.financas.coisas ?? []).find(c => ['violao', 'violino', 'guitarra', 'piano', 'camera', 'bateria', 'teclado'].includes(c.coisaId));
    if (lembranca) escrever(v, { t: tMorte + 1, texto: `Ficou com ${NOME_DA_LEMBRANCA[lembranca.coisaId] ?? 'uma coisa'} de ${nomeMorto}.`, relevancia: 'biografia', tema: 'familia', pessoas: [oldId] });
    if (i < 18 && guarda) {
      const g = v.pessoas[guarda.id];
      if (!h.genitores?.includes(guarda.id)) escrever(v, { t: tMorte + 1, texto: `A guarda ficou com ${g.nome}. Foi para a casa ${flex(g.genero, 'dele', 'dela', 'delu')}${g.municipioId !== antigaMoradia.municipioId ? `, em ${nomeLugar(g.municipioId)}` : ''}.`, relevancia: 'marco', tema: 'familia', pessoas: [g.id] });
    } else if (moravaJunto && v.moradia.tipo === 'aluguel' && casa && casaFicouCom === undefined) {
      escrever(v, { t: tMorte + 1, texto: 'A casa onde morava foi vendida no inventário. Mudou-se.', relevancia: 'biografia', tema: 'casa', tom: 'ruim' });
    }
    v.t = novoT;
    // Ela não fica duas vezes no mundo: agora é 'eu'.
    delete v.pessoas[herdeiroId];
    delete v.vinculos[herdeiroId];
    void r;
  });
  return { vida: nova };
}

/* ------------------------------------------------------------ Parentescos */

const doGenero = (p: Pessoa, m: Parentesco, f: Parentesco): Parentesco => (p.genero === 'feminino' ? f : m);

/**
 * Os vínculos, refeitos do ponto de vista de quem continua. Cada pessoa
 * continua sendo quem é — a mãe sobrevivente é mãe, os irmãos continuam
 * irmãos, a parceria dela continua parceria, os filhos dela são filhos — e
 * ninguém fica com dois papéis (nem com o papel que tinha para quem morreu).
 */
function reconciliarParentescos(v: Vida, antigos: Vida['vinculos'], herdeiroId: string, oldId: string, conjugeId?: string): Vida['vinculos'] {
  const novos: Vida['vinculos'] = {};
  const h = v.pessoas[herdeiroId];
  const vinH = antigos[herdeiroId];
  const casaH = vinH.convivio.includes('casa');
  const meus = new Set(h.genitores ?? []);
  meus.add(oldId);
  const novo = (pe: Pessoa, parentesco: Parentesco | undefined, prox: number, extra: Partial<Vinculo> = {}): Vinculo => {
    const base: Vinculo = {
      pessoaId: pe.id, ...(parentesco ? { parentesco } : {}), origem: 'familia', tInicio: Math.max(h.tNasc, pe.tNasc), proximidade: clamp(Math.round(prox)),
      confianca: clamp(Math.round(45 + prox * 0.4)), tensao: 0, convivio: [], tUltimoContato: v.t, historia: [], ...extra
    };
    novos[pe.id] = base;
    return base;
  };
  const filhosDe = (id: string) => Object.values(v.pessoas).filter(x => x.genitores?.includes(id) && !x.especie);
  const irmaosDela = new Set<string>();

  // Quem morreu: o pai ou a mãe dela — com a história que tinham juntos.
  const morto = v.pessoas[oldId];
  novos[oldId] = { ...structuredClone(vinH), pessoaId: oldId, parentesco: doGenero(morto, 'pai', 'mae'), origem: 'familia', convivio: [], tInicio: h.tNasc, romance: undefined, chamado: undefined, estagio: undefined, formacao: undefined, contexto: undefined, fases: undefined };

  for (const [id, vin] of Object.entries(antigos)) {
    const pe = v.pessoas[id];
    if (!pe || id === herdeiroId) continue;
    const vivo = pe.vivo;
    const par = vin.parentesco;
    const casaJunto = casaH && vin.convivio.includes('casa');
    if (pe.especie) {
      // O bicho da casa fica com quem continua morando nela (a família).
      if (par === 'pet' && casaJunto && vivo) novo(pe, 'pet', vin.proximidade, { convivio: ['casa'] });
      continue;
    }
    if (id === conjugeId || (vin.romance && (meus.has(id) || vin.romance.fim === 'morte'))) {
      if (meus.has(id)) novo(pe, doGenero(pe, 'pai', 'mae'), casaJunto ? 80 : 60, { convivio: casaJunto && vivo ? ['casa'] : [] });
      else if (id === conjugeId) novo(pe, doGenero(pe, 'padrasto', 'madrasta'), casaJunto ? 62 : 45, { convivio: casaJunto && vivo ? ['casa'] : [] });
      continue;
    }
    if (meus.has(id)) { novo(pe, doGenero(pe, 'pai', 'mae'), vivo ? 55 : 40); continue; }
    switch (par) {
      case 'filho': case 'enteado': {
        const comum = (pe.genitores ?? []).filter(g => meus.has(g) || g === oldId).length;
        if (comum === 0) continue;
        const ambos = (pe.genitores ?? []).length >= 2 && (h.genitores ?? []).length >= 2 && (pe.genitores ?? []).every(g => (h.genitores ?? []).includes(g));
        irmaosDela.add(id);
        novo(pe, ambos ? 'irmao' : 'meio_irmao', (casaJunto ? 68 : 52) - Math.abs(pe.tNasc - h.tNasc) / 24, { convivio: casaJunto && vivo ? ['casa'] : [] });
        break;
      }
      case 'mae': case 'pai': novo(pe, 'avo', vivo ? 55 : 40); break;
      case 'irmao': case 'meio_irmao': novo(pe, doGenero(pe, 'tio', 'tio'), 40); break;
      case 'neto': case 'bisneto': {
        const g = pe.genitores ?? [];
        if (g.includes('eu')) novo(pe, 'filho', idadePessoa(v, pe) < 18 ? 80 : 60, { convivio: idadePessoa(v, pe) < 21 && v.fatos[`saiu_de_casa_${pe.id}`] === undefined ? ['casa'] : [] });
        else if (g.some(x => filhosDe('eu').some(f => f.id === x))) novo(pe, 'neto', 55);
        else if (g.some(x => irmaosDela.has(x) || (antigos[x]?.parentesco === 'filho' || antigos[x]?.parentesco === 'enteado'))) novo(pe, 'sobrinho', 42);
        break;
      }
      case 'genro': {
        if (pe.parceiroId === undefined && h.parceiroId === id) break; // a parceria dela (abaixo)
        const deQuem = Object.values(v.pessoas).find(x => x.parceiroId === id);
        if (deQuem && (antigos[deQuem.id]?.parentesco === 'filho' || antigos[deQuem.id]?.parentesco === 'enteado') && deQuem.id !== herdeiroId) novo(pe, 'cunhado', 32);
        else if (deQuem && deQuem.genitores?.includes('eu')) novo(pe, 'genro', 40);
        break;
      }
      default: break; // amigos, colegas, conhecidos e os parentes distantes de quem morreu não são a rede dela
    }
  }
  // A parceria dela continua parceria.
  const par = h.parceiroId ? v.pessoas[h.parceiroId] : undefined;
  if (par) {
    const casou = v.fatos[`casou_${herdeiroId}`];
    const cartorio = v.fatos[`uniao_cartorio_${herdeiroId}`];
    const estagio = casou !== undefined ? (cartorio === 1 ? 'casamento' : 'morando_junto') : 'namoro';
    const desde = v.fatos[`namoro_${herdeiroId}`] ?? v.t - 24;
    const junto = estagio !== 'namoro';
    novos[par.id] = {
      pessoaId: par.id, origem: 'romance', tInicio: desde, proximidade: 72, confianca: 70, tensao: 6, convivio: par.vivo && junto ? ['casa'] : [], tUltimoContato: v.t,
      historia: [{ t: desde, texto: `Começaram a namorar.`, tipo: 'romance', peso: 2 }, ...(casou !== undefined ? [{ t: casou, texto: estagio === 'casamento' ? 'Casaram no civil.' : 'Foram morar juntos.', tipo: 'casamento' as const, peso: 3 }] : [])],
      romance: { estagio, tEstagio: casou ?? desde, tInicio: desde, envolvimento: 70, planoFilhos: 'sem_planejar' }
    };
    par.parceiroId = undefined;
  }
  // Os filhos dela que moram com ela: a casa é a dela (os da parceria também).
  for (const f of filhosDe('eu')) if (novos[f.id]) novos[f.id].parentesco = 'filho';
  return novos;
}

/* ------------------------------------------------------------ Formação e trabalho */

function educacaoDe(v: Vida, h: Pessoa, i: number, aptidao: number): Vida['educacao'] {
  const e: Vida['educacao'] = { escolaridade: 'nenhuma', evadiu: false, concluidos: [], enem: [], postura: 'normal', vivencias: [] };
  const desempenho = clamp(Math.round(58 + aptidao * 30));
  const rede: 'publica' | 'privada' = (classeNoNascimento(v, h.tNasc) === 'media' || classeNoNascimento(v, h.tNasc) === 'alta') ? 'privada' : 'publica';
  if (i < 18) {
    if (i >= 4 && i <= 5) e.basica = { etapa: 'pre', serie: 0, rede, desempenho: 60, reprovacoes: 0 };
    else if (i >= 6 && i <= 14) { e.basica = { etapa: i - 5 >= 6 ? 'fundamental2' : 'fundamental1', serie: Math.min(9, i - 5), rede, desempenho, reprovacoes: 0 }; e.escolaridade = 'fundamental_incompleto'; }
    else if (i >= 15) { e.basica = { etapa: 'medio', serie: Math.min(3, i - 14), rede, desempenho, reprovacoes: 0 }; e.escolaridade = 'medio_incompleto'; }
    return e;
  }
  e.escolaridade = ESCOLARIDADE_NPC[h.vida?.escolaridade ?? (h.formacao ? 'superior' : 'medio')];
  const c = cursoPorNome(h.formacao);
  if (c) e.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: Math.min(v.t, h.tNasc + (c.nivel === 'superior' ? 23 : 20) * 12), instituicao: c.nivel === 'superior' ? 'a faculdade' : 'a escola técnica', desempenho });
  const est = h.estudo;
  const ce = est ? cursoPorNome(est.curso) : undefined;
  if (est && ce && est.tFim > v.t) {
    e.matricula = {
      cursoId: ce.id, instituicao: est.paga === 'publica' ? 'a universidade pública' : 'a faculdade', rede: est.paga === 'publica' ? 'publica' : 'privada', modalidade: 'presencial',
      tInicio: est.tFim - ce.meses, mesesRestantes: Math.max(1, est.tFim - v.t), mensalidade: est.paga === 'publica' || est.paga === 'bolsa' ? 0 : Math.round(ce.mensalidade * economiaLocal(h.municipioId).custo), ...(est.paga === 'fies' ? { financiamento: 'fies' as const } : est.paga === 'bolsa' ? { financiamento: 'prouni' as const } : {}),
      desempenho, trancado: false, municipioId: h.municipioId
    };
    if (e.escolaridade === 'medio') e.escolaridade = 'superior_incompleto';
  }
  return e;
}

function trabalhoDe(v: Vida, h: Pessoa, i: number): Vida['trabalho'] {
  const t: Vida['trabalho'] = { historico: [], experiencia: {}, candidaturas: [], contribuicao: 0, licencas: [], horasExtras: false };
  if (i < 14) return t;
  const exp = h.vida?.experiencia ?? 0;
  const oc = h.ocupacaoId ? ocupacaoOuNula(h.ocupacaoId) : undefined;
  if (oc) t.experiencia[oc.trilha] = exp;
  const anosTrabalhando = Math.max(0, i - 19);
  t.contribuicao = Math.round(Math.max(exp, anosTrabalhando * 12 * 0.7));
  if (h.ocupacao?.startsWith('aposentad')) {
    t.aposentadoria = { t: h.vida?.tCargo ?? v.t - 12, beneficio: Math.max(1620, h.renda) };
    t.contribuicao = Math.max(t.contribuicao, 35 * 12);
    return t;
  }
  if (oc && h.renda > 0) {
    t.atual = {
      ocupacaoId: oc.id, empregador: oc.concurso ? 'o serviço público' : oc.contrato === 'autonomo' || oc.contrato === 'informal' ? 'por conta própria' : 'uma empresa da cidade', contrato: oc.contrato,
      salario: brutoDe(h.renda, oc.contrato), tInicio: h.vida?.tCargo ?? v.t - 24, desempenho: 55, municipioId: h.municipioId, carga: oc.carga, via: 'antes', tPosto: h.vida?.tCargo ?? v.t - 24
    };
    return t;
  }
  if (i >= 18 && h.ocupacao?.startsWith('desempregad')) {
    const ultima = [...(h.vida?.trajetoria ?? [])].reverse().find(x => x.tipo === 'desemprego');
    t.desempregadoDesde = ultima?.t ?? v.t - 6;
  }
  return t;
}

/** A classe da casa quando a pessoa nasceu (pela renda de quem morreu naquele ano). */
function classeNoNascimento(v: Vida, tNasc: number): Vida['origem']['classe'] {
  const foto = [...v.financas.historico].sort((a, b) => Math.abs(a.t - tNasc) - Math.abs(b.t - tNasc))[0];
  const renda = foto?.renda ?? 3000;
  return renda < 1800 ? 'vulneravel' : renda < 3800 ? 'trabalhadora' : renda < 7000 ? 'media_baixa' : renda < 16000 ? 'media' : 'alta';
}

/** As gestações da família dela em curso viram processos (ou continuam como gestações de quem não é ela). */
function processosDaFamilia(v: Vida, h: Pessoa, par?: Pessoa): Vida['processos'] {
  const out: Vida['processos'] = [];
  for (const g of [h, par]) {
    if (!g?.gestacao) continue;
    const outro = g === h ? par : h;
    out.push({ tipo: 'gestacao', id: `g${v.seq++}`, tConcepcao: g.gestacao.tParto - 9, tParto: g.gestacao.tParto, gestanteId: g === h ? 'eu' : g.id, ...(outro && outro !== h ? { outroId: outro.id } : g !== h ? { outroId: 'eu' } : {}), descoberta: true, planejada: true });
    g.gestacao = undefined;
  }
  return out;
}

/** A vida que a pessoa já viveu, como a ficha dela registrava, vira o começo da Linha da Vida dela (na voz dela). */
function escreverVidaAnterior(v: Vida, h: Pessoa, trajetoria: NonNullable<Pessoa['vida']>['trajetoria'], oldId: string, antes: Vida): void {
  const morto = v.pessoas[oldId];
  const outro = (h.genitores ?? []).filter(g => g !== oldId).map(g => v.pessoas[g]).find(Boolean);
  const pais = outro ? `${morto.nome} e ${outro.nome}` : morto.nome;
  const natal = h.municipioNatal ?? antes.eu.municipioNatal;
  escrever(v, { t: h.tNasc, texto: `Nasceu em ${MESES[mesDe(h.tNasc)]} de ${anoDe(h.tNasc)}, em ${nomeLugar(natal)}, ${flex(h.genero, 'filho', 'filha', 'filhe')} de ${pais}.`, relevancia: 'marco', tema: 'nascimento', tom: 'bom', pessoas: [oldId, ...(outro ? [outro.id] : [])] });
  const nome = h.nome;
  const visto = new Set<string>();
  for (const x of [...trajetoria].sort((a, b) => a.t - b.t)) {
    let texto = x.texto.trim();
    if (texto.startsWith(`${nome} `)) texto = capital(texto.slice(nome.length + 1));
    texto = texto.replace(new RegExp(`\\b${nome}\\b`, 'g'), 'você');
    const bebe = /^Nasceu (.+)\.$/.exec(texto);
    if (bebe) {
      const f = Object.values(v.pessoas).find(p => p.nome === bebe[1] && p.genitores?.includes('eu'));
      if (f) texto = `Nasceu ${f.nome}, ${flex(f.genero, 'seu filho', 'sua filha', 'sue filhe')}.`;
    }
    if (visto.has(texto)) continue;
    visto.add(texto);
    const rel: Entrada['relevancia'] = ['estudo', 'trabalho', 'amor', 'filho', 'casa', 'promocao', 'lugar', 'perda'].includes(x.tipo) ? 'biografia' : 'cotidiano';
    escrever(v, { t: Math.min(x.t, v.t), texto, relevancia: rel, tema: x.tipo === 'filho' ? 'filhos' : x.tipo === 'amor' ? 'amor' : x.tipo === 'estudo' || x.tipo === 'escola' ? 'estudo' : x.tipo === 'trabalho' || x.tipo === 'promocao' || x.tipo === 'desemprego' ? 'trabalho' : x.tipo === 'casa' ? 'casa' : x.tipo === 'lugar' ? 'lugar' : x.tipo === 'perda' ? 'perda' : 'familia' });
  }
  v.biografia.sort((a, b) => a.t - b.t);
}

/* ------------------------------------------------------------ Leituras */

/** O que ficou, em frases (a tela do legado). */
export function oQueFicou(v: Vida): string[] {
  const out: string[] = [];
  const p = partilhar(v, v.morte?.decisoes);
  const nFilhos = Object.values(v.vinculos).filter(x => x.parentesco === 'filho').length;
  const netos = Object.values(v.vinculos).filter(x => x.parentesco === 'neto').length;
  if (nFilhos) out.push(`${nFilhos === 1 ? 'Um filho' : `${nFilhos} filhos`}${netos ? `, ${netos === 1 ? 'um neto' : `${netos} netos`}` : ''}.`);
  if (p.bruto > 0) out.push(`Um patrimônio de ${fmt(p.liquido)}${p.dividasPagas > 0 ? `, depois de pagar ${fmt(p.dividasPagas)} em dívidas` : ''}.`);
  else if (p.dividas > 0) out.push('Dívidas maiores do que os bens — e ninguém herda dívida.');
  return out;
}

/** Rótulo do laço de uma pessoa com quem morreu (para a tela da partilha). */
export function lacoComFalecido(v: Vida, pessoaId: string): string {
  const pe = v.pessoas[pessoaId];
  const vin = v.vinculos[pessoaId];
  if (!pe) return '';
  if (vin?.romance) return flex(pe.genero, 'marido', 'esposa', 'cônjuge');
  if (vin?.parentesco) return rotuloParentesco(pe, vin.parentesco);
  return '';
}

/** Total de patrimônio que existe na família (protagonista e as posses de quem está no mundo): o que a conservação compara. */
export function patrimonioDaFamilia(v: Vida, liquidoProtagonista: number): number {
  // Cada um na unidade do país onde mora, trazido à do protagonista pelo câmbio (a soma só vale numa unidade).
  const aqui = paisDaVida(v);
  const npcs = Object.values(v.pessoas).reduce((s, p) => s + (p.posses ? (p.posses.dinheiro + p.posses.bens.reduce((t, b) => t + b.valor, 0)) * converterEntrePaises(1, paisDaPessoa(p), aqui) : 0), 0);
  return liquidoProtagonista + npcs + (v.origem.reservaDe ? v.origem.reserva ?? 0 : 0);
}

