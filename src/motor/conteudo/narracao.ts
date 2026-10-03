/**
 * FATO → CONTEXTO → NARRAÇÃO → MEMÓRIA (REWORK 4).
 *
 * O playtest viu a Linha da Vida revelar o catálogo: "Num sábado de
 * supermercado cheio..." igual em vidas diferentes. Não se resolve com cem
 * paráfrases. Aqui o acontecimento vira primeiro um FATO estruturado — a
 * criança se perdeu: onde, aos quantos anos, com quem, por quanto tempo,
 * como foi achada, no que deu —, decidido pelo CONTEXTO real da vida (a
 * cidade e o porte dela, o mar por perto, a família que existe, a classe, a
 * rede de saúde do país). A frase é a narração desse fato, montada por partes
 * que dependem dele (não sinônimos soltos). O fato fica guardado na entrada
 * (`Entrada.fato`) e pode voltar como MEMÓRIA anos depois ("No aniversário da
 * sua mãe, alguém contou de novo a história da feira").
 *
 * Os sorteios daqui são derivados (`rngDe`): a variedade não mexe no acaso do
 * resto da vida.
 */

import type { Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { rngDe, type Rng } from '../rng';
import { flex } from '../texto';
import { idadePessoa } from '../nucleo';
import { municipio, pertoDaAgua } from '../dados/lugares';
import { cotidiano } from './local';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const r = (c: Ctx, tipo: string) => rngDe(c.v.id, 'fato', tipo, c.v.t);
const papelDe = (v: Vida, p: Pessoa) => { const par = v.vinculos[p.id]?.parentesco; return par === 'mae' ? 'mãe' : par === 'pai' ? 'pai' : par === 'avo' ? flex(p.genero, 'avô', 'avó') : par === 'madrasta' ? 'madrasta' : par === 'padrasto' ? 'padrasto' : ''; };
const quemE = (v: Vida, p: Pessoa) => { const papel = papelDe(v, p); return papel ? `${flex(p.genero, 'seu', 'sua')} ${papel}, ${p.nome}` : p.nome; };

/* --------------------------------------------------------- Perder-se */

type Dados = Record<string, string | number>;

/** O fato: onde a criança se perdeu (pelo lugar de verdade), por quanto tempo, como foi achada. */
export function fatoPerdido(c: Ctx, quem: Pessoa): Dados {
  const x = r(c, 'perdido');
  const m = municipio(c.v.moradia.municipioId);
  const lugares = ['supermercado', 'shopping', 'parque', 'feira'];
  if (m.perfil === 'metropole') lugares.push('estacao', 'show');
  if (pertoDaAgua(c.v.moradia.municipioId)) lugares.push('praia', 'praia');
  if (m.perfil === 'pequena' || m.perfil === 'polo') lugares.push('festa', 'festa');
  const onde = x.pick(lugares);
  const como = x.pick(onde === 'praia' ? ['salva_vidas', 'outra_familia', 'sozinho'] : onde === 'supermercado' || onde === 'shopping' ? ['alto_falante', 'seguranca', 'outra_familia', 'sozinho'] : ['outra_familia', 'sozinho', 'seguranca']);
  return { onde, como, duracao: x.pick(['dez minutos', 'meia hora', 'quase uma hora']), quem: quem.id, desfecho: x.pick(['historia', 'mao', 'sorvete', 'medo']) };
}

const ONDE: Record<string, string[]> = {
  supermercado: ['Num sábado de supermercado cheio', 'Entre as gôndolas do supermercado, numa véspera de feriado'],
  shopping: ['Num shopping lotado de fim de ano', 'Na praça de alimentação de um shopping, num domingo'],
  parque: ['Num domingo no parque', 'No parque da cidade, perto do lago'],
  feira: ['Na feira da rua de baixo', 'No meio das barracas da feira de domingo'],
  estacao: ['Na plataforma do metrô, na hora do rush', 'Na estação lotada, num fim de tarde'],
  show: ['Num show de rua com a cidade inteira', 'Na festa de rua do aniversário da cidade'],
  praia: ['Num domingo de praia cheia', 'Na beira do mar, entre guarda-sóis iguais'],
  festa: ['Na festa da cidade, com a praça cheia', 'Numa feira de fim de ano na praça central']
};
const COMO: Record<string, (q: string) => string> = {
  alto_falante: () => 'Chamaram o seu nome no alto-falante, e o nome nunca pareceu tão grande.',
  seguranca: () => 'Um segurança achou você sentad{o} num canto, sem chorar, esperando.',
  outra_familia: q => `Uma família desconhecida ficou com você até ${q} aparecer, correndo.`,
  salva_vidas: () => 'Um salva-vidas levou você no ombro até a barraca deles, apitando.',
  sozinho: q => `Você voltou sozinh{o}, pelo mesmo caminho, e encontrou ${q} no lugar exato onde tinha se perdido.`
};
const DESFECHO: Record<string, (q: string) => string> = {
  historia: q => `${cap(q)} conta essa história até hoje, com as mãos tremendo.`,
  mao: () => 'Pelo resto do ano, só se andava na rua de mão dada — e bem apertada.',
  sorvete: () => 'Teve sorvete de consolo; ninguém sabe ao certo se para você ou para quem procurava.',
  medo: () => 'Por meses, você se recusou a soltar a mão de alguém em lugar cheio.'
};

export function narrarPerdido(c: Ctx, quem: Pessoa, d: Dados): string {
  const x = r(c, 'perdido_texto');
  const g = (s: string) => s.replace(/\{o\}/g, c.g('o', 'a', 'e'));
  return g(`${x.pick(ONDE[String(d.onde)] ?? ONDE.parque)}, você sumiu da vista de ${quem.nome} por ${d.duracao}. ${(COMO[String(d.como)] ?? COMO.sozinho)(quem.nome)} ${(DESFECHO[String(d.desfecho)] ?? DESFECHO.historia)(quem.nome)}`);
}

/* ----------------------------------------------- O primeiro dia de aula */

export function fatoPrimeiroDia(c: Ctx, quem: Pessoa): Dados {
  const x = r(c, 'primeiro_dia');
  const irmao = Object.values(c.v.vinculos).map(vin => c.v.pessoas[vin.pessoaId]).find(p => p && p.vivo && (c.v.vinculos[p.id].parentesco === 'irmao' || c.v.vinculos[p.id].parentesco === 'meio_irmao') && idadePessoa(c.v, p) > 7 && idadePessoa(c.v, p) < 15 && c.v.vinculos[p.id].convivio.includes('casa'));
  const colega = Object.values(c.v.vinculos).map(vin => c.v.pessoas[vin.pessoaId]).find(p => p && p.vivo && !c.v.vinculos[p.id].parentesco && c.v.vinculos[p.id].convivio.includes('escola'));
  return {
    quem: quem.id,
    reacao: x.pick(['chorou', 'nem_olhou', 'agarrou', 'mandou_embora', 'calado']),
    marca: x.pick(['lancheira', 'mochila', 'uniforme', 'desenho', 'nome']),
    ...(irmao ? { irmao: irmao.id } : {}), ...(colega && x.chance(0.6) ? { colega: colega.id } : {}),
    rede: c.v.educacao.basica?.rede ?? 'publica'
  };
}

export function narrarPrimeiroDia(c: Ctx, d: Dados): string {
  const x = r(c, 'primeiro_dia_texto');
  const v = c.v;
  const quem = v.pessoas[String(d.quem)];
  const q = quem?.nome ?? 'a família';
  const irmao = d.irmao ? v.pessoas[String(d.irmao)] : undefined;
  const colega = d.colega ? v.pessoas[String(d.colega)] : undefined;
  const abertura = x.pick([`Primeiro dia no 1º ano${d.rede === 'privada' ? ', de uniforme novo' : ''}.`, `O primeiro dia de aula de verdade.`, `${q} levou você ao primeiro dia do 1º ano.`]);
  const reacao = ({
    chorou: `Você chorou na porta${colega ? ` até ${colega.nome} oferecer metade do lanche` : ' por meia hora, e depois esqueceu por que chorava'}.`,
    nem_olhou: `Você entrou sem olhar para trás — quem chorou foi ${q}, no portão.`,
    agarrou: `Você agarrou a perna de ${q} e só soltou quando a professora prometeu o lugar perto da janela.`,
    mandou_embora: `Você mandou ${q} ir embora antes de chegar ao portão: já era grande.`,
    calado: `Você não falou com ninguém o dia inteiro${colega ? `, só com ${colega.nome}, no fim do recreio` : ''}.`
  } as Record<string, string>)[String(d.reacao)];
  const marca = ({
    lancheira: 'A lancheira voltou intacta, e a história do dia foi inventada no caminho.',
    mochila: 'A mochila era maior que as costas e pesava mais do que tudo o que tinha dentro.',
    uniforme: 'O uniforme voltou sujo de tinta até a gola.',
    desenho: 'Voltou com um desenho da casa, com a família inteira do lado de fora.',
    nome: 'Aprendeu a escrever o próprio nome no quadro — com uma letra ao contrário.'
  } as Record<string, string>)[String(d.marca)];
  const comIrmao = irmao ? ` Na mesma escola, ${irmao.nome} fingiu não conhecer você no recreio.` : '';
  return `${abertura} ${reacao} ${marca}${comIrmao}`;
}

/* -------------------------------------------- A febre de madrugada (bebê) */

export function fatoFebre(c: Ctx, quem: Pessoa): Dados {
  const x = r(c, 'febre');
  const privado = c.v.financas.planoDeSaude || ['media', 'alta'].includes(c.v.origem.classe);
  return { quem: quem.id, causa: x.pick(['virose', 'otite', 'amigdalite', 'bronquiolite', 'dentes']), onde: privado ? 'plano' : 'publico', hora: x.pick(['de madrugada', 'num domingo à noite', 'num feriado', 'no meio de uma viagem']) };
}

export function narrarFebre(c: Ctx, d: Dados): string {
  const quem = c.v.pessoas[String(d.quem)];
  const q = quem ? quemE(c.v, quem) : 'a família';
  const onde = d.onde === 'plano' ? 'o pronto-socorro do plano' : (cotidiano(c.v).prontoAtendimento ?? 'o pronto-socorro');
  const causa = ({ virose: 'Era virose', otite: 'Era uma otite', amigdalite: 'Era a garganta', bronquiolite: 'Era bronquiolite: dois dias de inalação', dentes: 'Eram os dentes nascendo' } as Record<string, string>)[String(d.causa)];
  const espera = d.onde === 'plano' ? 'foram atendidos em meia hora' : 'foram atendidos quando o dia já clareava';
  return `Uma febre alta ${d.hora} levou ${q} com você no colo para ${onde}; ${espera}. ${causa}.`;
}

/* ------------------------------------------------------ A memória que volta */

/** Um fato da infância que ainda pode ser contado (de alguém que está vivo e conta). */
export function memoriaContavel(v: Vida): { tipo: string; dados: Dados; quem: Pessoa } | undefined {
  for (const e of v.biografia) {
    if (!e.fato || !['perdido', 'primeiro_dia'].includes(e.fato.tipo)) continue;
    const quem = v.pessoas[String(e.fato.dados.quem)];
    if (quem?.vivo && v.vinculos[quem.id]) return { tipo: e.fato.tipo, dados: e.fato.dados, quem };
  }
  return undefined;
}

export function narrarMemoria(_v: Vida, rr: Rng, m: { tipo: string; dados: Dados; quem: Pessoa }): string {
  const ocasiao = rr.pick([`No aniversário de ${m.quem.nome}`, 'Num almoço de família', 'Numa noite de fotos antigas', 'No casamento de um primo']);
  if (m.tipo === 'perdido') {
    const onde = ({ supermercado: 'no supermercado', shopping: 'no shopping', parque: 'no parque', feira: 'na feira', estacao: 'na estação', show: 'na festa de rua', praia: 'na praia', festa: 'na festa da cidade' } as Record<string, string>)[String(m.dados.onde)] ?? 'naquele dia';
    return `${ocasiao}, ${m.quem.nome} contou de novo a história de quando você se perdeu ${onde}. A cada versão, você some por mais tempo.`;
  }
  return `${ocasiao}, ${m.quem.nome} lembrou do seu primeiro dia de aula${m.dados.reacao === 'chorou' ? ' — e do choro na porta' : m.dados.reacao === 'nem_olhou' ? ' — e de quem chorou no portão' : ''}. Todo mundo riu; você também.`;
}
