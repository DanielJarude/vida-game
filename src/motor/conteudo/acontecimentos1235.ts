/**
 * REWORK 12.35 — AS SITUAÇÕES DO SUBMUNDO VIVO. Cada cena nasce de um caso que o motor abriu com o estado real (quem,
 * onde, que organização, que posto) e se resolve no motor (`conflitosCriminais`, `poderInterno`, `vidaDupla`): o texto do
 * resultado é o que de fato mudou. As opções que não cabem no seu posto não aparecem.
 *
 *   sub1235_confronto    a guerra da sua organização (o pedaço, a retaliação, a emboscada, o recado, o negócio, o aliado)
 *   sub1235_operacao     a busca na sua casa
 *   sub1235_perseguicao  depois do trabalho que deu errado
 *   sub1235_contestacao  alguém quer o seu lugar no comando
 *   sub1235_traicao      a delação de quem foi preso; quem foi para a rival
 *   sub1235_suspeita     o boato: alguém fala com a polícia?
 *   sub1235_raro         a rival que pede socorro, a aliança inesperada, o comando oferecido
 *   sub1235_conjuge      o par que não aceita mais
 *   sub1235_recomeco     um ano depois de sair
 *
 * Nenhuma opção descreve como se faz coisa alguma.
 */
import type { Conteudo, Ctx } from './base';
import { comContracao } from './base';
import type { CasoDoSubmundo } from '../tipos';
import { casoDaCena, escolhasDaOperacao, escolhasDoConfronto, pesoDaEscolha, pesoDaOperacao, pesoDaPerseguicao, quemAjuda, resolverConfronto, resolverOperacao, resolverPerseguicao, ROTULO_DA_OPERACAO, ROTULO_DA_PERSEGUICAO, ROTULO_DO_CONFRONTO, textoDoConfronto, type EscolhaDaOperacao, type EscolhaDaPerseguicao, type EscolhaDeConfronto } from '../sistemas/conflitosCriminais';
import { apoioAoComando, escolhasDaContestacao, escolhasDaSuspeita, escolhasDaTraicao, escolhasDoRaro, pesoDaContestacao, pesoDaSuspeita, pesoDaTraicao, resolverContestacao, resolverRaro, resolverSuspeita, resolverTraicao, ROTULO_DA_CONTESTACAO, ROTULO_DA_SUSPEITA, ROTULO_DA_TRAICAO, ROTULO_DO_RARO, type EscolhaDaContestacao, type EscolhaDaSuspeita, type EscolhaDaTraicao, type EscolhaRara } from '../sistemas/poderInterno';
import { pesoDoPar, resolverPar, resolverRecomeco, ROTULO_DO_PAR, ROTULO_DO_RECOMECO, type EscolhaDoPar, type EscolhaDoRecomeco } from '../sistemas/vidaDupla';
import { lealdadeDoMembro, nomeDoNivel, orgViva } from '../sistemas/faccoes';
import { flex } from '../texto';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const deHoje = (c: Ctx, id: string) => c.v.fatos[id] === c.v.t;

interface Cena<E extends string> {
  id: string;
  prioridade: number;
  titulo: (c: Ctx, k: CasoDoSubmundo) => string;
  texto: (c: Ctx, k: CasoDoSubmundo) => string;
  todas: E[];
  rotulo: (c: Ctx, k: CasoDoSubmundo, x: E) => string;
  escolhas: (c: Ctx, k: CasoDoSubmundo) => E[];
  /** `true` ou o motivo de não dar (a opção aparece desabilitada, com o motivo). */
  pode?: (c: Ctx, k: CasoDoSubmundo, x: E) => true | string;
  peso?: (c: Ctx, k: CasoDoSubmundo, x: E) => string | undefined;
  resolver: (c: Ctx, k: CasoDoSubmundo, x: E) => { texto: string; tom?: 'bom' | 'ruim' };
  quando?: (c: Ctx, k: CasoDoSubmundo) => boolean;
  preso?: boolean;
}

/** Uma cena a partir do caso de hoje: as opções que cabem, o peso dito antes, o resultado do motor. */
function cena<E extends string>(x: Cena<E>): Conteudo {
  const caso = (c: Ctx) => casoDaCena(c.v, x.id)!;
  return {
    id: x.id, tipo: 'decisao', idade: [16, 95], tema: 'escolha', prioritario: true, prioridade: x.prioridade, repetir: 1,
    quando: c => { const k = casoDaCena(c.v, x.id); return deHoje(c, x.id) && !!k && k.escolha === undefined && (x.preso || !c.v.justica?.prisao) && !c.v.morte && (!x.quando || x.quando(c, k)); },
    titulo: c => x.titulo(c, caso(c)),
    texto: c => x.texto(c, caso(c)),
    opcoes: x.todas.map(op => ({
      id: op,
      texto: (c: Ctx) => x.rotulo(c, caso(c), op),
      disponivel: (c: Ctx) => (!x.escolhas(c, caso(c)).includes(op) ? false : x.pode ? x.pode(c, caso(c), op) : true),
      ...(x.peso ? { consequencia: (c: Ctx) => x.peso!(c, caso(c), op) } : {}),
      resolver: (c: Ctx) => { const r = x.resolver(c, caso(c), op); return { texto: r.texto, memoria: null, ...(r.tom ? { tom: r.tom } : {}) }; }
    }))
  };
}

const org = (c: Ctx, k: CasoDoSubmundo) => orgViva(c.v, k.orgId!)!;
const membro = (c: Ctx, k: CasoDoSubmundo) => org(c, k).quadro.find(m => m.id === k.membroId);

export const ACONTECIMENTOS_1235: Conteudo[] = ([
  cena<EscolhaDeConfronto>({
    id: 'sub1235_confronto', prioridade: 4,
    quando: (c, k) => !!orgViva(c.v, k.orgId!) && !!orgViva(c.v, k.outraId!),
    titulo: (c, k) => ({ territorio: 'O pedaço em disputa', retaliacao: 'A hora do revide', emboscada: 'Uma emboscada', ameaca: 'Um recado', negocio: 'O negócio que querem tomar', aliado: 'Um aliado pede ajuda' } as Record<string, string>)[k.situacao] ?? `${cap(org(c, k).nome)} em guerra`,
    texto: (c, k) => textoDoConfronto(c.v, k),
    todas: ['ir', 'retaliar', 'intimidar', 'negociar', 'questionar', 'recuar', 'proteger', 'ficar_fora'],
    rotulo: (_c, _k, x) => ROTULO_DO_CONFRONTO[x],
    escolhas: (c, k) => escolhasDoConfronto(c.v, k),
    peso: (c, k, x) => pesoDaEscolha(c.v, k, x),
    resolver: (c, k, x) => resolverConfronto(c.v, k.id, x)
  }),
  cena<EscolhaDaOperacao>({
    id: 'sub1235_operacao', prioridade: 5,
    titulo: () => 'Uma busca na sua casa',
    texto: (c, k) => `${k.resultado?.[0] ?? 'A polícia bateu na sua porta com um mandado de busca.'} A operação era contra ${orgViva(c.v, k.orgId!)?.nome ?? 'a sua organização'} — e chegou até você. O que você faz agora?`,
    todas: ['advogado', 'parar', 'colaborar', 'seguir'],
    rotulo: (_c, _k, x) => ROTULO_DA_OPERACAO[x],
    escolhas: c => escolhasDaOperacao(c.v),
    peso: (c, _k, x) => pesoDaOperacao(c.v, x),
    resolver: (c, k, x) => resolverOperacao(c.v, k.id, x)
  }),
  cena<EscolhaDaPerseguicao>({
    id: 'sub1235_perseguicao', prioridade: 5,
    titulo: () => 'Uma perseguição',
    texto: c => `O trabalho deu errado, e a polícia chegou antes de todo mundo sair. Há segundos para decidir — e cada escolha tem um preço diferente.${c.v.corpo.forma < 35 ? ' O seu fôlego não é o de antes.' : ''}`,
    todas: ['fugir', 'ajuda', 'entregar', 'enfrentar'],
    rotulo: (c, _k, x) => (x === 'ajuda' && quemAjuda(c.v) ? `Pedir ajuda a ${quemAjuda(c.v)}` : ROTULO_DA_PERSEGUICAO[x]),
    escolhas: () => ['fugir', 'ajuda', 'entregar', 'enfrentar'],
    pode: (c, _k, x) => (x === 'ajuda' && !quemAjuda(c.v) ? 'Ninguém de confiança por perto (um contato na cidade, ou uma organização sua com presença aqui).' : true),
    peso: (c, _k, x) => pesoDaPerseguicao(c.v, x),
    resolver: (c, k, x) => resolverPerseguicao(c.v, k.id, x)
  }),
  cena<EscolhaDaContestacao>({
    id: 'sub1235_contestacao', prioridade: 5,
    quando: (c, k) => !!membro(c, k) && membro(c, k)!.estado === 'ativo',
    titulo: (c, k) => `${membro(c, k)!.nome} quer o seu lugar`,
    texto: (c, k) => {
      const o = org(c, k), m = membro(c, k)!;
      const rel = c.v.caminhos.envolvimento!.organizacoes!.find(x => x.id === o.id)!;
      const apoio = apoioAoComando(c.v, o, rel);
      return `Em ${o.nome}, ${m.nome} (${nomeDoNivel(o, m.nivel)}) anda dizendo que o comando perdeu o rumo — e há quem escute. O apoio que você tem dentro está em ${apoio} de 100 (a casa unida: ${o.coesao}; a polícia em cima: ${o.pressao}). ${lealdadeDoMembro(m) < 30 ? `${cap(flex(m.genero, 'ele', 'ela', 'elu'))} já não esconde que quer mandar.` : 'Ainda dá para conversar.'}`;
    },
    todas: ['negociar', 'dividir', 'conselho', 'afastar', 'ceder'],
    rotulo: (_c, _k, x) => ROTULO_DA_CONTESTACAO[x],
    escolhas: (c, k) => escolhasDaContestacao(c.v, k.orgId!),
    peso: (c, k, x) => pesoDaContestacao(c.v, k.orgId!, x),
    resolver: (c, k, x) => resolverContestacao(c.v, k.id, x)
  }),
  cena<EscolhaDaTraicao>({
    id: 'sub1235_traicao', prioridade: 4,
    quando: (c, k) => !!membro(c, k),
    titulo: (c, k) => (k.situacao === 'delacao' ? `${membro(c, k)!.nome} falou` : `${membro(c, k)!.nome} mudou de lado`),
    texto: (c, k) => {
      const m = membro(c, k)!, o = org(c, k);
      if (k.situacao === 'delacao') return `${m.nome}, de ${o.nome}, foi pres${flex(m.genero, 'o', 'a', 'e')} e já não devia nada à casa. Contou à polícia o que sabia — e sabia de você. O que foi dito pesa como prova; a investigação ganha força.`;
      const b = k.outraId ? orgViva(c.v, k.outraId) : undefined;
      return `${m.nome} (${nomeDoNivel(o, m.nivel)}) trocou ${o.nome} por ${b?.nome ?? 'uma rival'}, levando o que sabia: quem é quem, onde, quanto. Ninguém foi pego de surpresa — havia tempo que ${flex(m.genero, 'ele', 'ela', 'elu')} não acreditava mais na casa.`;
    },
    todas: ['advogado', 'moita', 'proteger', 'deixar', 'reforcar', 'cobrar'],
    rotulo: (_c, _k, x) => ROTULO_DA_TRAICAO[x],
    escolhas: (c, k) => escolhasDaTraicao(c.v, k.situacao),
    peso: (c, _k, x) => pesoDaTraicao(c.v, x),
    resolver: (c, k, x) => resolverTraicao(c.v, k.id, x)
  }),
  cena<EscolhaDaSuspeita>({
    id: 'sub1235_suspeita', prioridade: 3,
    quando: (c, k) => !!membro(c, k) && membro(c, k)!.estado === 'ativo',
    titulo: () => 'Um nome na boca de todo mundo',
    texto: (c, k) => {
      const m = membro(c, k)!, o = org(c, k);
      const fonte = k.pessoaId ? c.v.pessoas[k.pessoaId] : undefined;
      const cred = k.credibilidade ?? 30;
      return `${fonte ? `${fonte.nome}, que costuma saber das coisas, contou` : 'Corre um boato'} que ${m.nome} (${nomeDoNivel(o, m.nivel)}) anda falando com a polícia. ${cred >= 65 ? 'A fonte costuma acertar.' : cred >= 40 ? 'Pode ser verdade, pode não ser.' : 'Parece mais conversa de corredor do que coisa sabida.'} Você não tem como ter certeza.`;
    },
    todas: ['apurar', 'confrontar', 'avisar', 'ignorar'],
    rotulo: (_c, _k, x) => ROTULO_DA_SUSPEITA[x],
    escolhas: (c, k) => escolhasDaSuspeita(c.v, k.orgId!),
    peso: (c, _k, x) => pesoDaSuspeita(c.v, x),
    resolver: (c, k, x) => resolverSuspeita(c.v, k.id, x)
  }),
  cena<EscolhaRara>({
    id: 'sub1235_raro', prioridade: 3,
    quando: (c, k) => !!orgViva(c.v, k.orgId!) && (!k.outraId || !!orgViva(c.v, k.outraId)),
    titulo: (_c, k) => ({ rival_pede: 'A rival pede socorro', alianca: 'Uma aliança que ninguém esperava', comando: 'O comando, oferecido' } as Record<string, string>)[k.situacao] ?? 'Algo que não acontece todo dia',
    texto: (c, k) => {
      const o = org(c, k), b = k.outraId ? orgViva(c.v, k.outraId) : undefined;
      if (k.situacao === 'rival_pede') return `${cap(b!.nome)}, que por anos disputou espaço com ${o.nome}, está no chão: pouca gente, a polícia em cima, sem dinheiro. Quem sobrou mandou pedir socorro — a você.`;
      if (k.situacao === 'alianca') return `${cap(b!.nome)} trocou de comando, e quem manda agora mandou um recado inesperado: chega de briga com ${o.nome}. Propõem aliança.`;
      return `Com o comando de ${o.nome} vago, os antigos se reuniram e chegaram a um nome: o seu. Não é disputa — é convite.`;
    },
    todas: ['aceitar', 'absorver', 'explorar', 'recusar'],
    rotulo: (_c, _k, x) => ROTULO_DO_RARO[x],
    escolhas: (_c, k) => escolhasDoRaro(k.situacao),
    resolver: (c, k, x) => resolverRaro(c.v, k.id, x)
  }),
  cena<EscolhaDoPar>({
    id: 'sub1235_conjuge', prioridade: 4,
    quando: (c, k) => !!k.pessoaId && !!c.v.pessoas[k.pessoaId]?.vivo,
    titulo: (c, k) => `${c.v.pessoas[k.pessoaId!].nome} quer conversar`,
    texto: (c, k) => {
      const p = c.v.pessoas[k.pessoaId!];
      const T: Record<string, string> = {
        ameaca: `Depois do recado que chegou à casa, ${p.nome} não dorme direito. Disse que não vai viver com medo — nem deixar os seus viverem.`,
        hospital: `${p.nome} passou noites no hospital sem saber o que tinha acontecido. Agora quer saber — e quer saber o que vem depois.`,
        rejeita: `${p.nome} sabe o que você faz e não aceita. Não é mais uma briga: é uma conversa sobre se ainda dá.`,
        pede_para_sair: `${p.nome} pediu de novo, com calma e sem rodeio: que você saia disso. Desta vez, quer uma resposta.`
      };
      return T[k.situacao] ?? `${p.nome} quer conversar sobre o que você faz por fora — e sobre vocês.`;
    },
    todas: ['prometer', 'explicar', 'mentir', 'separar'],
    rotulo: (_c, _k, x) => ROTULO_DO_PAR[x],
    escolhas: c => (c.v.caminhos.envolvimento?.saindo !== undefined ? ['explicar', 'mentir', 'separar'] : ['prometer', 'explicar', 'mentir', 'separar']),
    peso: (c, k, x) => pesoDoPar(c.v, x, k.pessoaId!),
    resolver: (c, k, x) => resolverPar(c.v, k.id, x)
  }),
  cena<EscolhaDoRecomeco>({
    id: 'sub1235_recomeco', prioridade: 2,
    titulo: () => 'Um ano fora',
    texto: () => 'Faz um tempo que você saiu. A vida não virou outra de um dia para o outro: há quem ainda ligue, há quem na família ainda não confie, há a ficha. Por onde recomeçar?',
    todas: ['familia', 'cortar', 'ajudar', 'seguir'],
    rotulo: (_c, _k, x) => ROTULO_DO_RECOMECO[x],
    escolhas: () => ['familia', 'cortar', 'ajudar', 'seguir'],
    resolver: (c, k, x) => resolverRecomeco(c.v, k.id, x)
  })
] as Conteudo[]).map(comContracao);

export const IDS_DO_1235 = ACONTECIMENTOS_1235.map(x => x.id);
