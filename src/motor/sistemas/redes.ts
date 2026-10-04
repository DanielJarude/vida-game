/**
 * Redes sociais 2.0 (FIX pós-REWORK 4): sete plataformas, uma vida.
 *
 * Não são sete peles do mesmo contador. Cada plataforma (`dados/redes`) tem
 * alcance, conversão, viralização, esquecimento, público por idade, o quanto
 * a opinião vira briga, o que pede de produção, o que cabe nela, como paga e
 * como verifica. A MESMA pessoa, com a mesma publicação, vai diferente em
 * cada uma: o vídeo de humor explode no TikTok e passa batido no Facebook; a
 * opinião forte vira briga no X; a foto da família rende no Facebook da tia.
 *
 * E a rede conversa com a vida (nunca um minigame isolado):
 *   - O QUE SE PUBLICA sai da vida: a viagem, o trabalho (o plantão, a farda,
 *     o treino), a música que você lançou, a derrota de domingo, o bicho, a
 *     família, o que você sabe ensinar. Uma pessoa comum não recebe opções de
 *     celebridade;
 *   - AS PESSOAS: quem da sua vida está naquela rede reage; quem está longe às
 *     vezes comenta e a conversa recomeça; a opinião forte briga com o amigo; o
 *     trollar vira conflito; o parceiro e a família podem descobrir o OnlyFans;
 *   - O NOME: quem é famoso alcança mais e ganha público sozinho; público real
 *     grande dá nome (`notoriedade`, fonte 'rede'); a polêmica de quem é
 *     conhecido vira imagem pública (`vis_polemica`);
 *   - A CARREIRA: o chefe vê o post do trabalho; o bastidor de quem tem sigilo
 *     (saúde, farda) dá advertência; o atleta que rebate a torcida cobra a
 *     reputação; o músico que divulga ganha público; o político que briga
 *     ganha a base e o desgaste; viralizar pode virar convite para viver disso;
 *   - O DINHEIRO: promover e comprar custam; a conta monetizada paga todo mês
 *     (`redesBase.rendaDaRede` → o orçamento);
 *   - A LINHA DA VIDA: só o que é biografia — a primeira conta, viralizar, os
 *     patamares, a verificação, a suspensão, o escândalo, a conta grande
 *     apagada, a celebridade que respondeu. Cada post, não.
 *
 * O save não cresce sem limite: cada conta guarda as últimas 8 publicações; o
 * resto vira número (`totais`). Simulação interna (offline). Sorteios derivados
 * (`rngDe`): a rede não mexe no acaso do resto da vida.
 */

import type { ContaSocial, Pessoa, PlataformaId, Publicacao, TemaPublicacao, Vida } from '../tipos';
import { PERMITIDO, bloqueio, type Veredito } from '../plausibilidade';
import { clamp, rngDe, type Rng } from '../rng';
import { escrever, idade, idadePessoa, lembrarCom, novoId, parceiro } from '../nucleo';
import { flex, listaNatural } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { DE_CRIADOR, PLATAFORMAS, ehPlataforma, type Plataforma } from '../dados/redes';
import { sortearNome, sortearSobrenome } from '../dados/nomes';
import { pagar, vereditoDePagar } from './dinheiro';
import { habilidade } from './frentes';
import { temCoisa } from './coisas';
import { petsDaCasa } from './pets';
import { contaAtiva, contasAtivas, PLATAFORMA_PADRAO, publicacoesDoAno, publicoReal, rendaDaConta, seguidoresEmPalavras } from './redesBase';
import { estadoDaRelacao } from './lacos';
import { novaOportunidade } from './oportunidades';
import { criarPessoa, vincular } from '../pessoas';
import { novoContexto } from './relacoes';
import { paisDaVida } from '../mundo/vida';
import { anoDe } from '../tempo';

export type OpRede =
  | { oque: 'criar'; plataforma?: PlataformaId }
  | { oque: 'publicar'; plataforma?: PlataformaId; tema: TemaPublicacao; promover?: boolean }
  | { oque: 'mencionar'; plataforma?: PlataformaId; celebridade: string }
  | { oque: 'trollar'; plataforma?: PlataformaId; alvo: 'celebridade' | 'estranho' | string }
  | { oque: 'promover_conta'; plataforma?: PlataformaId }
  | { oque: 'verificar'; plataforma?: PlataformaId }
  | { oque: 'seguir' | 'deixar' | 'bloquear' | 'desbloquear'; pessoaId: string }
  | { oque: 'apagar_publicacao'; plataforma?: PlataformaId; id: string }
  | { oque: 'apagar_conta'; plataforma?: PlataformaId }
  | { oque: 'monetizar'; plataforma?: PlataformaId }
  | { oque: 'comprar'; plataforma?: PlataformaId; pacote: 0 | 1 | 2 };

export const PACOTES = [{ n: 1000, custo: 150, perde: 12 }, { n: 10000, custo: 1200, perde: 22 }, { n: 50000, custo: 5000, perde: 32 }] as const;
const custoLocal = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 10) * 10;
export const custoDoPacote = (v: Vida, k: 0 | 1 | 2) => custoLocal(v, PACOTES[k].custo);
export const custoDePromover = (v: Vida) => custoLocal(v, 300);
/** Uma campanha para a conta (não um post): cresce com o tamanho da conta, até um teto. */
export const custoDaCampanha = (v: Vida, c: ContaSocial) => custoLocal(v, Math.min(6000, 800 + publicoReal(c) * 0.02));
/** O selo pago (X): um ano de assinatura. */
export const custoDoSelo = (v: Vida) => custoLocal(v, 480);
/** O teto de publicações por plataforma no ano (o ano do jogo é longo: cada uma é uma fase, não um clique). */
export const LIMITE_DO_ANO = 8;
const MAX_PUBLICACOES = 8;
const TROLLAR_POR_ANO = 3;

const plat = (op: OpRede): Plataforma => PLATAFORMAS[('plataforma' in op ? op.plataforma : undefined) ?? PLATAFORMA_PADRAO];
const doAno = (v: Vida, c: ContaSocial) => c.publicacoes.filter(p => Math.floor(p.t / 12) === Math.floor(v.t / 12));
const suspensa = (v: Vida, c: ContaSocial) => c.suspensaAte !== undefined && v.t < c.suspensaAte;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------- Quem está onde */

const conhecidosParaRede = (v: Vida) => Object.values(v.vinculos)
  .map(vin => ({ vin, p: v.pessoas[vin.pessoaId] }))
  .filter(({ p }) => p && p.vivo && !p.especie && p.nome && idadePessoa(v, p) >= 13 && idadePessoa(v, p) <= 85);

/** Essa pessoa usa essa plataforma? (Estável: a tia está no Facebook; o sobrinho, no TikTok.) */
export function usaPlataforma(v: Vida, p: Pessoa, pl: PlataformaId): boolean {
  const x = PLATAFORMAS[pl];
  if (pl === 'onlyfans') return false;
  const i = idadePessoa(v, p);
  const dentro = i >= x.quem[0] && i <= x.quem[1];
  return rngDe(p.id, 'usa', pl).next() < (dentro ? 0.75 : 0.12);
}

/** Quem da sua vida segue você (nas redes em geral). */
export const seguidoresConhecidos = (v: Vida, pl?: PlataformaId): Pessoa[] => conhecidosParaRede(v)
  .filter(x => x.vin.digital?.seguidor && x.vin.digital.bloqueado === undefined && (!pl || usaPlataforma(v, x.p, pl))).map(x => x.p);

/* --------------------------------------------------------- O que publicar */

const ultimaViagem = (v: Vida) => [...v.biografia].reverse().find(e => v.t - e.t <= 12 && /^Viajou para /.test(e.texto))?.texto.match(/^Viajou para ([^(,.]+)/)?.[1]?.trim();
const ARTES = [['fotografia', 'uma série de fotos'], ['desenho', 'um desenho novo'], ['escrita', 'um texto'], ['danca', 'um vídeo dançando']] as const;
const SIGILO = new Set(['saude', 'seguranca', 'forcas', 'militar', 'justica']);
const ENSINAVEIS: [Parameters<typeof habilidade>[1], string][] = [['programacao', 'programação'], ['cozinha', 'cozinha'], ['musica', 'música'], ['exatas', 'matemática'], ['linguagens', 'redação'], ['fotografia', 'fotografia'], ['xadrez', 'xadrez'], ['desenho', 'desenho'], ['futebol', 'futebol']];

/** A temporada que acabou mal (o atleta profissional tem o que responder). */
function temporadaRuim(v: Vida): boolean {
  const es = v.caminhos.esporte;
  if (!es || es.fase !== 'profissional') return false;
  const t = es.temporadas?.slice(-1)[0];
  return !!t && anoDe(v.t) - t.ano <= 1 && (t.nota < 6.3 || t.colocacao >= 12);
}

export interface Conteudo { tema: TemaPublicacao; rotulo: string; dica?: string }

/** O que dá para publicar NESTA plataforma agora — sai do que a vida tem. */
export function conteudosPossiveis(v: Vida, plId: PlataformaId = PLATAFORMA_PADRAO): Conteudo[] {
  const pl = PLATAFORMAS[plId];
  const i = idade(v);
  const out: Conteudo[] = [];
  const add = (tema: TemaPublicacao, rotulo: string, dica?: string) => { if (pl.temas[tema] && !out.some(x => x.tema === tema)) out.push({ tema, rotulo, dica }); };
  if (plId === 'onlyfans') {
    add('exclusivo', 'Um ensaio novo para assinantes', 'Conteúdo exclusivo: é o que paga a assinatura.');
    add('conversa', 'Responder quem assina', 'Quem conversa, renova.');
    if (contasAtivas(v).some(c => c.plataforma !== 'onlyfans' && publicoReal(c) >= 2000)) add('divulgar', 'Divulgar o OnlyFans nas outras redes', 'Traz assinantes — e deixa o OnlyFans à vista de quem você conhece.');
    return out;
  }
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  const es = v.caminhos.esporte;
  const atleta = es?.fase === 'profissional';
  const pol = v.caminhos.politica;
  const politico = pol && pol.fase !== 'encerrada' && pol.fase !== 'envolvido';
  add('cotidiano', plId === 'x' ? 'Um pensamento do dia' : plId === 'youtube' ? 'Um vlog do dia a dia' : plId === 'facebook' ? 'Contar como foi a semana' : plId === 'tiktok' ? 'Um vídeo do dia a dia' : plId === 'twitch' ? 'Uma live de conversa' : 'Uma foto do dia');
  if (plId === 'twitch') add('conversa', 'Bater papo ao vivo com quem assiste');
  if (i >= 12) add('humor', plId === 'x' ? 'Uma piada' : 'Um vídeo de humor', v.personalidade.tracos.sociabilidade >= 10 ? 'O seu jeito ajuda.' : undefined);
  const viagem = ultimaViagem(v);
  if (viagem) add('viagem', `As fotos de ${viagem}`);
  if (atleta) {
    add('esporte', 'O treino de hoje');
    if (temporadaRuim(v)) {
      add('desculpas', 'Pedir desculpas à torcida pela fase', 'Costuma acalmar — se parecer sincero.');
      add('rebater', 'Rebater as críticas da torcida', 'Pode virar briga com a torcida inteira.');
    }
  } else if (v.rotinas.some(r => ['futebol', 'volei', 'basquete', 'corrida', 'academia', 'natacao', 'atletismo', 'lutas', 'time_escola'].includes(r.id))) add('esporte', 'O esporte da semana');
  if (e && oc) {
    const sigilo = SIGILO.has(oc.setor) || SIGILO.has(oc.trilha);
    if (atleta) { /* o treino já está acima */ }
    else if (sigilo) add('bastidores', `Os bastidores do trabalho (${oc.nome[v.eu.genero === 'feminino' ? 1 : 0]})`, 'Rende curiosidade — e o trabalho pode não gostar do que aparece.');
    else add('trabalho', plId === 'x' ? 'Comentar o trabalho' : 'Algo do trabalho', 'O chefe também tem rede.');
    if (oc.trilha === 'conteudo' || oc.setor === 'comunicacao') add('bastidores', 'Os bastidores do que você produz');
  }
  if (politico) add('politica', `Falar da sua bandeira${pol!.prioridade ? '' : ''}`, 'A base gosta; o adversário guarda o print.');
  else if (i >= 16) add('politica', 'Opinar sobre política', 'Quase sempre vira briga.');
  if (i >= 16) add('opiniao', 'Dar uma opinião forte', 'Pode render alcance — e briga.');
  const conq = v.caminhos.marcas.filter(m => v.t - m.t <= 12 && m.peso >= 2).pop();
  if (conq) add('conquista', 'Contar uma conquista');
  const musica = v.caminhos.arte?.linguagem === 'musica' || oc?.trilha === 'musica' || habilidade(v, 'musica') >= 25;
  const obra = (v.caminhos.obras ?? []).filter(o => v.t - o.t <= 18).pop();
  if (obra) add('divulgar', `Divulgar "${obra.titulo}"`, 'Quem não sabe que existe não ouve.');
  else if (v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado') add('divulgar', `Divulgar ${v.caminhos.negocio.nome}`, 'Cliente novo vem de onde menos se espera.');
  if (musica) add('musica', plId === 'twitch' ? 'Tocar ao vivo' : 'Um vídeo tocando');
  const arte = ARTES.find(([d]) => habilidade(v, d) >= 25);
  if (arte) add('arte', `Mostrar ${arte[1]}`);
  if (temCoisa(v, 'videogame') || temCoisa(v, 'computador')) add('jogo', plId === 'twitch' ? 'Jogar ao vivo' : 'Um vídeo jogando');
  const ensina = ENSINAVEIS.filter(([d]) => habilidade(v, d) >= 45).sort((a, b) => habilidade(v, b[0]) - habilidade(v, a[0]))[0];
  if (ensina) add('tutorial', `Ensinar ${ensina[1]}`, 'Quem sabe de verdade cresce devagar e não para.');
  if (habilidade(v, 'cozinha') >= 20 || temCoisa(v, 'cozinha_equipada')) add('receita', 'Uma receita');
  if (petsDaCasa(v).length) add('pet', `${plId === 'tiktok' ? 'Um vídeo' : 'Uma foto'} de ${petsDaCasa(v)[0].nome}`);
  if (Object.values(v.vinculos).some(x => x.convivio.includes('casa') && (x.parentesco === 'filho' || x.romance))) add('familia', 'Um momento em família', 'Quem é da família costuma reagir.');
  if (i >= 15) add('estilo', 'O visual do dia');
  if ((v.educacao.matricula && !v.educacao.matricula.trancado) || (v.educacao.basica && i >= 13)) add('estudo', 'A rotina de estudos');
  if (i >= 18) add('comunidade', 'Uma notícia do bairro, num grupo');
  return out;
}

/** O texto da publicação (o que fica no perfil): o tema, a vida e a plataforma. */
function textoDaPublicacao(v: Vida, pl: Plataforma, tema: TemaPublicacao, n: number): string {
  const r = rngDe(v.id, 'texto_post', v.t, tema, n, pl.id);
  const vid = pl.id === 'youtube' || pl.id === 'tiktok';
  switch (tema) {
    case 'viagem': return `${vid ? 'Um vídeo' : 'As fotos'} de ${ultimaViagem(v) ?? 'uma viagem'}.`;
    case 'trabalho': return r.pick(['Um dia comum no trabalho — com legenda engraçada.', 'A mesa de trabalho, às sete da noite.', 'O projeto que finalmente saiu.', 'O café da firma, avaliado com nota.']);
    case 'bastidores': return r.pick(['Os bastidores de um dia de trabalho.', 'O que ninguém vê do trabalho.', 'Um dia inteiro do trabalho, em um minuto.']);
    case 'conquista': return v.caminhos.marcas.filter(m => v.t - m.t <= 12 && m.peso >= 2).pop()?.texto ?? 'Uma conquista.';
    case 'arte': { const a = ARTES.find(([d]) => habilidade(v, d) >= 25); return a ? `${cap(a[1])}.` : 'Algo feito à mão.'; }
    case 'musica': return pl.id === 'twitch' ? 'Uma live tocando os pedidos do chat.' : r.pick(['Um vídeo tocando, na sala.', 'Uma música inteira, gravada de primeira.', 'Um cover — e uma composição sua no fim.']);
    case 'pet': return `${petsDaCasa(v)[0]?.nome ?? 'O bicho'} ${r.pick(['dormindo no lugar errado, de novo', 'roubando a cena', 'fingindo que não fez nada'])}.`;
    case 'familia': return r.pick(['O almoço de domingo, todo mundo junto.', 'Uma foto de casa, sem pose.', 'Aniversário em família.']);
    case 'opiniao': return r.pick(['Uma opinião forte sobre o trânsito da cidade.', 'Uma opinião forte sobre trabalho e descanso.', 'Uma opinião forte sobre o jogo de domingo.', 'Uma opinião forte sobre quem fura fila.']);
    case 'politica': { const pol = v.caminhos.politica; return pol && pol.fase !== 'encerrada' && pol.fase !== 'envolvido' ? 'Uma defesa da sua bandeira — com o adversário marcado.' : r.pick(['Uma opinião sobre a eleição.', 'Uma crítica ao governo.', 'Uma defesa do governo.']); }
    case 'humor': return r.pick(['Uma piada sobre a própria vida.', 'Uma imitação que saiu melhor do que devia.', 'Um meme sobre segunda-feira.']);
    case 'esporte': return v.caminhos.esporte?.fase === 'profissional' ? r.pick(['O treino de hoje, com a legenda "foco".', 'O vestiário antes do jogo.', 'A recuperação depois do treino.']) : 'O esporte da semana.';
    case 'desculpas': return 'Um pedido de desculpas à torcida pela fase.';
    case 'rebater': return 'Uma resposta dura às críticas da torcida.';
    case 'divulgar': { const o = (v.caminhos.obras ?? []).filter(x => v.t - x.t <= 18).pop(); return o ? `A divulgação de "${o.titulo}".` : v.caminhos.negocio ? `A divulgação de ${v.caminhos.negocio.nome}.` : 'Uma divulgação.'; }
    case 'jogo': return pl.id === 'twitch' ? 'Uma live jogando até tarde.' : 'Um vídeo jogando.';
    case 'tutorial': return 'Uma aula do que você sabe fazer.';
    case 'receita': return r.pick(['Uma receita de família.', 'Um prato novo, passo a passo.', 'O bolo que deu errado — e a receita certa.']);
    case 'estilo': return r.pick(['O visual do dia.', 'Uma roupa nova, no espelho.']);
    case 'estudo': return r.pick(['A mesa de estudos, com café.', 'Uma rotina de estudos para a prova.']);
    case 'comunidade': return r.pick(['Um aviso sobre o buraco da rua.', 'Uma campanha de doação do bairro.', 'Uma foto da festa da rua.']);
    case 'conversa': return pl.id === 'onlyfans' ? 'Uma rodada de respostas para quem assina.' : 'Uma live de conversa com quem assiste.';
    case 'exclusivo': return 'Um ensaio exclusivo para assinantes.';
    default: return pl.id === 'x' ? r.pick(['Um pensamento solto sobre a vida.', 'Uma reclamação do calor.']) : r.pick(['O café da manhã.', 'O céu no fim da tarde.', 'A rua de sempre, numa luz diferente.', 'Uma selfie sem motivo.']);
  }
}

/* --------------------------------------------------------- Celebridades */

export interface Celebridade { id: string; nome: string; papel: string; genero: 'masculino' | 'feminino'; area: 'musica' | 'futebol' | 'tv' | 'humor' | 'internet' | 'politica' }
const ARQUETIPOS: { area: Celebridade['area']; papel: [string, string]; idade: number }[] = [
  { area: 'musica', papel: ['cantor', 'cantora'], idade: 1992 }, { area: 'futebol', papel: ['jogador da seleção', 'jogadora da seleção'], idade: 1999 },
  { area: 'tv', papel: ['apresentador de TV', 'apresentadora de TV'], idade: 1978 }, { area: 'humor', papel: ['humorista', 'humorista'], idade: 1988 },
  { area: 'internet', papel: ['influenciador', 'influenciadora'], idade: 2001 }, { area: 'politica', papel: ['político', 'política'], idade: 1965 }
];

/** As celebridades do país onde a pessoa mora (fictícias, sempre as mesmas para o país). */
export function celebridadesDoPais(v: Vida): Celebridade[] {
  const pais = paisDaVida(v);
  const r = rngDe('celebridades', pais);
  return ARQUETIPOS.map((a, k) => {
    const g = r.chance(0.5) ? 'feminino' : 'masculino';
    return { id: `${pais}:${k}`, nome: `${sortearNome(r, g, a.idade, pais)} ${sortearSobrenome(r, pais)}`, papel: a.papel[g === 'feminino' ? 1 : 0], genero: g, area: a.area };
  });
}

/* -------------------------------------------------------- Disponibilidade */

export function disponibilidadeRede(v: Vida, op: OpRede): Veredito {
  const i = idade(v);
  if (v.justica?.prisao?.regime === 'fechado') return bloqueio('impossivel', 'Na prisão, sem rede.');
  if (op.oque === 'seguir' || op.oque === 'deixar' || op.oque === 'bloquear' || op.oque === 'desbloquear') {
    if (!contasAtivas(v).length) return bloqueio('impossivel', 'Você não tem conta em nenhuma rede.');
    const vin = v.vinculos[op.pessoaId];
    const p = v.pessoas[op.pessoaId];
    if (!vin || !p || !p.vivo) return bloqueio('impossivel', 'Essa pessoa não está na sua vida.');
    if (op.oque === 'seguir' && (vin.digital?.segue || vin.digital?.bloqueado !== undefined)) return bloqueio('incompativel', vin.digital?.segue ? 'Você já segue.' : 'Você bloqueou essa pessoa.');
    if (op.oque === 'deixar' && !vin.digital?.segue) return bloqueio('incompativel', 'Você não segue essa pessoa.');
    if (op.oque === 'bloquear' && vin.digital?.bloqueado !== undefined) return bloqueio('incompativel', 'Já está bloqueada.');
    if (op.oque === 'desbloquear' && vin.digital?.bloqueado === undefined) return bloqueio('incompativel', 'Não está bloqueada.');
    return PERMITIDO;
  }
  const pl = plat(op);
  const c = contaAtiva(v, pl.id);
  if (op.oque === 'criar') {
    if (i < pl.idadeMin) return bloqueio('ilegal', `${pl.nome} é a partir dos ${pl.idadeMin} anos.`);
    if (c) return bloqueio('incompativel', `Você já tem uma conta no ${pl.nome}.`);
    if (v.redes?.contas[pl.id]?.apagada !== undefined && v.t - v.redes.contas[pl.id].apagada! < 12) return bloqueio('incompativel', 'Você apagou essa conta há pouco. Espere um tempo para começar outra.');
    return PERMITIDO;
  }
  if (!c) return bloqueio('impossivel', `Você não tem conta no ${pl.nome}.`);
  if (suspensa(v, c) && op.oque !== 'apagar_conta' && op.oque !== 'apagar_publicacao') return bloqueio('incompativel', `A conta está suspensa até o ano que vem: a ${pl.nome} puniu as denúncias.`);
  switch (op.oque) {
    case 'publicar': {
      if (!conteudosPossiveis(v, pl.id).some(t => t.tema === op.tema)) return bloqueio('impossivel', 'Não há o que mostrar disso agora.');
      const ano = doAno(v, c);
      if (ano.length >= LIMITE_DO_ANO) return bloqueio('incompativel', `Você já ${pl.id === 'twitch' ? 'fez muitas lives' : 'publicou muito'} neste ano: quem acompanha cansou um pouco.`);
      if (ano.filter(p => p.tema === op.tema).length >= 2) return bloqueio('incompativel', 'Você já publicou sobre isso neste ano — duas vezes.');
      if (op.promover) return vereditoDePagar(v, custoDePromover(v), 'Promover custa');
      return PERMITIDO;
    }
    case 'mencionar': {
      if (!celebridadesDoPais(v).some(x => x.id === op.celebridade)) return bloqueio('impossivel', 'Essa pessoa não existe por aqui.');
      if (v.fatos[`rede_mencao:${pl.id}`] !== undefined && Math.floor(v.fatos[`rede_mencao:${pl.id}`] / 12) === Math.floor(v.t / 12)) return bloqueio('incompativel', 'Você já marcou uma celebridade nessa rede neste ano.');
      return PERMITIDO;
    }
    case 'trollar': {
      if (i < 13) return bloqueio('impossivel', 'Não.');
      if ((v.fatos[`rede_trolls:${pl.id}:${Math.floor(v.t / 12)}`] ?? 0) >= TROLLAR_POR_ANO) return bloqueio('incompativel', 'Você já comprou brigas demais nessa rede neste ano.');
      if (op.alvo !== 'celebridade' && op.alvo !== 'estranho') {
        const vin = v.vinculos[op.alvo]; const p = v.pessoas[op.alvo];
        if (!vin || !p?.vivo || !usaPlataforma(v, p, pl.id)) return bloqueio('impossivel', 'Essa pessoa não está nessa rede.');
      }
      return PERMITIDO;
    }
    case 'promover_conta': {
      if (v.fatos[`rede_campanha:${pl.id}`] !== undefined && Math.floor(v.fatos[`rede_campanha:${pl.id}`] / 12) === Math.floor(v.t / 12)) return bloqueio('incompativel', 'A campanha deste ano já rodou.');
      if (!c.publicacoes.some(p => !p.apagada && v.t - p.t < 12)) return bloqueio('requisito', 'Promover o quê? A conta não publicou nada neste ano.');
      return vereditoDePagar(v, custoDaCampanha(v, c), 'Uma campanha custa');
    }
    case 'verificar': {
      if (c.verificada !== undefined) return bloqueio('incompativel', 'A conta já é verificada.');
      if (pl.verificacao === 'paga') { if (i < 16) return bloqueio('ilegal', 'A partir dos 16 anos.'); return vereditoDePagar(v, custoDoSelo(v), 'O selo custa (um ano)'); }
      if (pl.verificacao === 'documento') return i >= 18 ? PERMITIDO : bloqueio('ilegal', 'Só maiores de idade.');
      if (c.pedidoVerificacao !== undefined) return bloqueio('incompativel', 'O pedido está em análise: a resposta sai na virada do ano.');
      if (c.recusaVerificacao !== undefined && v.t - c.recusaVerificacao < 12) return bloqueio('incompativel', 'O último pedido foi recusado há pouco. Dá para tentar de novo daqui a um ano.');
      return PERMITIDO;
    }
    case 'apagar_publicacao': return c.publicacoes.some(p => p.id === op.id && !p.apagada) ? PERMITIDO : bloqueio('impossivel', 'Essa publicação não existe mais.');
    case 'apagar_conta': return PERMITIDO;
    case 'monetizar': {
      if (c.monetizada !== undefined) return bloqueio('incompativel', 'A conta já é monetizada.');
      if (i < Math.max(16, pl.idadeMin)) return bloqueio('ilegal', `A partir dos ${Math.max(16, pl.idadeMin)} anos.`);
      if (pl.id === 'onlyfans' && c.verificada === undefined) return bloqueio('requisito', 'Antes, a verificação de identidade (maioridade e documento).');
      const real = publicoReal(c);
      if (real < pl.monetiza.minimo) return bloqueio('requisito', `Pede pelo menos ${seguidoresEmPalavras(pl.monetiza.minimo)} ${pl.publico[1]} de verdade (você tem ${seguidoresEmPalavras(real)}).`);
      const feitas = Math.max(c.totais?.publicacoes ?? 0, c.publicacoes.length);
      if (pl.id === 'youtube' && feitas < 10) return bloqueio('requisito', 'O programa pede um canal com pelo menos 10 vídeos.');
      if (pl.id === 'twitch' && feitas < 6) return bloqueio('requisito', 'Para virar afiliado, pede pelo menos 6 lives.');
      if (c.credibilidade < 40) return bloqueio('requisito', 'As marcas não confiam na conta: credibilidade baixa demais.');
      return PERMITIDO;
    }
    case 'comprar':
      if (i < 16) return bloqueio('ilegal', 'A partir dos 16 anos.');
      if (pl.id === 'onlyfans') return bloqueio('impossivel', 'Assinante comprado não paga assinatura.');
      return vereditoDePagar(v, custoDoPacote(v, op.pacote));
  }
}

/* -------------------------------------------------------------- Executar */

const arrobaDe = (v: Vida, pl: PlataformaId) => `${v.eu.nome}${v.eu.sobrenome.split(' ').pop() ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) + (pl === 'instagram' ? '' : pl === 'x' ? '_' : '') + String(Math.floor(rngDe(v.id, 'arroba').next() * 90 + 10));
const totais = (c: ContaSocial) => (c.totais ??= { publicacoes: c.publicacoes.length, virais: c.publicacoes.filter(p => p.viral).length, receita: 0, polemicas: c.publicacoes.filter(p => p.polemica).length, maior: c.seguidores });

export function executarRede(v: Vida, op: OpRede): string {
  if (op.oque === 'seguir' || op.oque === 'deixar' || op.oque === 'bloquear' || op.oque === 'desbloquear') return pessoaNaRede(v, op);
  const pl = plat(op);
  if (op.oque === 'criar') return criar(v, pl);
  const c = contaAtiva(v, pl.id)!;
  switch (op.oque) {
    case 'publicar': return publicar(v, pl, c, op.tema, !!op.promover);
    case 'mencionar': return mencionar(v, pl, c, op.celebridade);
    case 'trollar': return trollar(v, pl, c, op.alvo);
    case 'promover_conta': return campanha(v, pl, c);
    case 'verificar': return verificar(v, pl, c);
    case 'apagar_publicacao': {
      const x = c.publicacoes.find(p => p.id === op.id)!;
      x.apagada = true;
      if (x.polemica) c.credibilidade = clamp(c.credibilidade + 3);
      return x.polemica ? 'A publicação sumiu. O print, não — mas a poeira baixou um pouco.' : 'A publicação sumiu do seu perfil.';
    }
    case 'apagar_conta': {
      c.apagada = v.t;
      const grande = publicoReal(c) >= 10000;
      escrever(v, { texto: `Apagou a conta no ${pl.nome}${grande ? `, com ${seguidoresEmPalavras(c.seguidores)} ${pl.publico[1]}` : ''}.`, relevancia: grande ? 'biografia' : 'cotidiano', tema: 'amizade', escolha: true });
      if (c.monetizada !== undefined) return `A conta foi apagada — e com ela a renda de ${pl.monetiza.como}. O silêncio é estranho nos primeiros dias.`;
      return 'A conta foi apagada. O silêncio é estranho nos primeiros dias.';
    }
    case 'monetizar': {
      c.monetizada = v.t;
      escrever(v, { texto: `A conta no ${pl.nome} passou a pagar: ${pl.monetiza.como}, ${seguidoresEmPalavras(publicoReal(c))} ${pl.publico[1]}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
      const renda = rendaDaConta(v, c);
      return `${pl.id === 'onlyfans' ? 'A assinatura passou a valer.' : pl.id === 'youtube' ? 'Os anúncios entraram nos vídeos — os antigos também.' : 'A primeira proposta chegou na mesma semana.'} Hoje, a conta renderia uns ${renda} por mês — e muda com o que você publicar.`;
    }
    case 'comprar': {
      const pk = PACOTES[op.pacote];
      pagar(v, custoDoPacote(v, op.pacote));
      c.seguidores += pk.n; c.comprados = (c.comprados ?? 0) + pk.n;
      c.credibilidade = clamp(c.credibilidade - pk.perde);
      // Comprado não interage: o engajamento cai na mesma proporção.
      c.engajamento = clamp(Math.round((c.engajamento ?? 50) * Math.max(0.2, publicoReal(c) / Math.max(1, c.seguidores))));
      return `${seguidoresEmPalavras(pk.n)} ${pl.publico[1]} novos em dois dias. Nenhum deles comenta nada — e o número de curtidas não acompanhou.`;
    }
  }
}

function criar(v: Vida, pl: Plataforma): string {
  const r = rngDe(v.id, 'conta', v.t, pl.id);
  const c: ContaSocial = { plataforma: pl.id, arroba: arrobaDe(v, pl.id), tCriada: v.t, seguidores: 0, credibilidade: 60, publicacoes: [], engajamento: 50, totais: { publicacoes: 0, virais: 0, receita: 0, polemicas: 0, maior: 0 } };
  (v.redes ??= { contas: {} }).contas[pl.id] = c;
  // Quem é próximo e está nessa rede segue de volta (quem não tem idade, nem gosta de rede, não).
  let n = 0;
  if (pl.id !== 'onlyfans') {
    for (const { p, vin } of conhecidosParaRede(v)) {
      if (vin.digital?.bloqueado !== undefined || estadoDaRelacao(v, vin) === 'rompido' || !usaPlataforma(v, p, pl.id)) continue;
      const chance = vin.proximidade >= 60 ? 0.85 : vin.proximidade >= 35 ? 0.5 : 0.15;
      if (r.chance(chance)) { (vin.digital ??= {}).seguidor = true; vin.digital.segue = true; n++; }
    }
  }
  const fama = v.notoriedade?.valor ?? 0;
  c.seguidores = n + r.int(pl.id === 'onlyfans' ? 0 : 4, pl.id === 'onlyfans' ? 3 : 40) + (fama >= 30 ? Math.round((fama - 25) ** 2 * 30) : 0);
  // A biografia guarda a primeira rede da vida (e a conta de quem já é conhecido); o resto é cotidiano.
  const primeira = Object.keys(v.redes.contas).length === 1;
  escrever(v, { texto: `Criou uma conta no ${pl.nome}.`, relevancia: primeira || fama >= 40 ? 'biografia' : 'cotidiano', tema: 'amizade', escolha: true });
  if (pl.id === 'onlyfans') return `@${c.arroba} existe. Ninguém da sua vida sabe — por enquanto. Assinante vem com conteúdo e com divulgação.`;
  return `@${c.arroba} existe agora. ${n ? `${n} ${n === 1 ? 'pessoa da sua vida seguiu' : 'pessoas da sua vida seguiram'} na mesma semana.` : 'Ninguém conhecido por lá ainda.'}${fama >= 30 ? ` E ${seguidoresEmPalavras(c.seguidores - n)} estranhos: o seu nome chegou antes de você.` : ''}`;
}

/** O que pesa a favor de uma publicação: o equipamento, o que você sabe, o tema certo na rede certa, a idade do público. */
function qualidade(v: Vida, pl: Plataforma, tema: TemaPublicacao): number {
  const camera = temCoisa(v, 'camera') ? 0.25 : 0;
  const celular = temCoisa(v, 'celular_topo') ? 0.2 : temCoisa(v, 'celular_bom') ? 0.1 : 0;
  const pc = pl.producao === 2 && (temCoisa(v, 'computador') || temCoisa(v, 'notebook')) ? 0.25 : pl.producao === 2 ? -0.25 : 0;
  const arte = tema === 'arte' ? Math.max(...ARTES.map(([d]) => habilidade(v, d))) / 120 : tema === 'musica' ? habilidade(v, 'musica') / 120 : tema === 'tutorial' ? 0.3 : tema === 'receita' ? habilidade(v, 'cozinha') / 160 : 0;
  const jeito = tema === 'humor' || tema === 'conversa' ? v.personalidade.tracos.sociabilidade / 100 : 0;
  const i = idade(v);
  const demografia = i < pl.faixa[0] ? 0.7 : i > pl.faixa[1] ? Math.max(0.45, 1 - (i - pl.faixa[1]) / 40) : 1;
  return Math.max(0.3, (1 + camera + celular + pc + arte + jeito) * (pl.temas[tema] ?? 0.6) * demografia);
}

function publicar(v: Vida, pl: Plataforma, c: ContaSocial, tema: TemaPublicacao, promover: boolean): string {
  const t = totais(c);
  const n = t.publicacoes;
  const r = rngDe(v.id, 'post', v.t, tema, n, pl.id);
  if (promover) pagar(v, custoDePromover(v));
  const q = qualidade(v, pl, tema);
  const fama = 1 + (v.notoriedade?.valor ?? 0) / 25;
  const criador = v.trabalho.atual?.ocupacaoId === 'criador_conteudo' ? 1.3 : 1;
  const ano = doAno(v, c).length;
  // Quem posta demais no ano satura: a quinta publicação não alcança como a primeira.
  const saturacao = ano < 3 ? 1 : Math.max(0.35, 1 - (ano - 2) * 0.15);
  const real = publicoReal(c);
  const base = Math.max(pl.piso, real * pl.alcance * 3 + (c.comprados ?? 0) * 0.01);
  let alcance = base * (0.3 + 0.7 * c.credibilidade / 100) * q * fama * criador * saturacao * (0.5 + r.next()) * (promover ? 3 : 1);
  const viral = pl.viral[0] > 0 && r.chance(pl.viral[0] * q * (promover ? 1.5 : 1));
  if (viral) alcance *= pl.viral[1] * (0.6 + r.next() * 0.8);
  let novos = Math.round(alcance * pl.conversao * Math.min(2, q) * (0.6 + r.next() * 0.8));
  // TikTok: o público do viral vem e vai — metade some antes do fim do ano (`processarRedes` cobra o resto).
  // OnlyFans não tem vitrine: assinante vem do nome e da divulgação nas outras redes (que deixa a conta à vista).
  if (pl.id === 'onlyfans') {
    const vitrine = tema === 'divulgar' ? Math.max(0, ...contasAtivas(v).filter(x => x.plataforma !== 'onlyfans').map(publicoReal)) * 0.004 : 0;
    novos = Math.round(novos * (0.5 + (v.notoriedade?.valor ?? 0) / 60) + vitrine * (0.6 + r.next() * 0.8));
  }
  c.seguidores += novos;
  if (!c.comprados) c.credibilidade = clamp(c.credibilidade + 1);
  const eng = clamp(35 + q * 15 + (viral ? 20 : 0) - (c.comprados ? 15 : 0) - (ano >= 5 ? 10 : 0));
  c.engajamento = Math.round(((c.engajamento ?? 50) * 2 + eng) / 3);
  const pub: Publicacao = { id: novoId(v, 'pb'), t: v.t, tema, texto: textoDaPublicacao(v, pl, tema, n), alcance: Math.round(alcance), novos, ...(promover ? { promovida: true } : {}), ...(viral ? { viral: true } : {}) };
  t.publicacoes++;
  if (viral) t.virais++;
  // Produção: o vídeo longo e a live cansam (é trabalho de verdade).
  if (pl.producao === 2) v.mente.estresse = clamp(v.mente.estresse + 2);

  // Quem da sua vida está nessa rede reage; quem está longe e calado às vezes comenta — e a conversa recomeça.
  const reagiram: Pessoa[] = [];
  const comentou: Pessoa[] = [];
  for (const p of seguidoresConhecidos(v, pl.id)) {
    const vin = v.vinculos[p.id];
    const familia = tema === 'familia' && (vin.parentesco || vin.romance) ? 0.25 : 0;
    if (!r.chance(0.2 + vin.proximidade / 170 + familia)) continue;
    reagiram.push(p);
    (vin.digital ??= {}).reacao = v.t;
    const longe = p.municipioId !== v.moradia.municipioId && v.t - vin.tUltimoContato >= 18;
    if (longe && vin.proximidade >= 35 && r.chance(tema === 'viagem' || tema === 'familia' || tema === 'conquista' ? 0.35 : 0.18)) {
      comentou.push(p);
      vin.digital.mensagem = v.t; vin.tUltimoContato = v.t;
      vin.proximidade = clamp(vin.proximidade + 3);
      if (!vin.parentesco) vin.aproximacao = v.t;
    }
  }
  pub.pessoas = reagiram.slice(0, 6).map(p => p.id);
  const extras: string[] = [];
  // A briga: a opinião, a política, a resposta à torcida. A rede de briga (X) briga mais; quem já é briguento, também.
  const PESO_BRIGA: Partial<Record<TemaPublicacao, number>> = { opiniao: 0.6, politica: 0.9, rebater: 1.2, humor: 0.12, trabalho: 0.08 };
  const chanceBriga = (PESO_BRIGA[tema] ?? 0) * pl.briga * (0.7 + (c.toxicidade ?? 0) / 100) * (fama > 2 ? 1.3 : 1);
  if (chanceBriga > 0 && r.chance(Math.min(0.85, chanceBriga))) extras.push(...polemica(v, pl, c, pub, reagiram, r));
  // O que o post faz na carreira e na vida.
  extras.push(...efeitosNaVida(v, pl, c, pub, r));
  // FIX pós-playtest humano: o post comum também tem acontecimento (não só números) — sem repetir o último eco.
  if (!viral && !pub.polemica) { const eco = ecoDoPost(v, pl, c, pub, reagiram, r); if (eco) extras.push(eco); }
  c.publicacoes = [...c.publicacoes, pub].slice(-MAX_PUBLICACOES);
  t.maior = Math.max(t.maior, c.seguidores);
  if (viral) extras.push(...viralizou(v, pl, pub, r));
  pub.reacao = pub.polemica ? 'virou briga' : viral ? 'viralizou' : alcance >= Math.max(200, real * 0.8) ? 'foi bem' : alcance < real * 0.15 ? 'passou batido' : 'o de sempre';
  marcosDeSeguidores(v, pl, c);
  const quem = comentou.length ? ` ${listaNatural(comentou.map(p => p.nome))} comentou${comentou.length > 1 ? 'aram' : ''} — fazia tempo que vocês não se falavam.` : reagiram.length ? ` Reagiram: ${reagiram.slice(0, 3).map(p => p.nome).join(', ')}${reagiram.length > 3 ? ` e mais ${reagiram.length - 3}` : ''}.` : '';
  const viram = pl.id === 'onlyfans' ? `${seguidoresEmPalavras(Math.round(alcance))} assinantes e curiosos viram` : `${seguidoresEmPalavras(Math.round(alcance))} pessoas viram`;
  return `${viral ? 'Viralizou. ' : ''}${viram}${novos ? `; ${seguidoresEmPalavras(novos)} ${novos === 1 ? pl.publico[0] : pl.publico[1]} ${novos === 1 ? 'novo' : 'novos'}` : ''}.${quem}${extras.length ? ` ${extras.join(' ')}` : ''}`;
}

/**
 * O ECO de uma publicação comum (FIX pós-playtest humano): "foto do dia" não pode ser sempre o mesmo acontecimento com
 * outros números. O que pode acontecer depende de quem segue (a família, alguém do trabalho, quem está longe), do tamanho
 * da conta (a permuta da loja pequena, a colaboração com uma conta maior, o print de uma página) e do tema — e o eco
 * não repete o anterior da mesma conta (`ContaSocial.ecos`, só os tipos). Metade das vezes, nada: post comum é comum.
 */
function ecoDoPost(v: Vida, pl: Plataforma, c: ContaSocial, pub: Publicacao, reagiram: Pessoa[], r: Rng): string | undefined {
  if (!r.chance(0.55)) return undefined;
  const real = publicoReal(c);
  const recentes = c.ecos ?? [];
  const opcoes: { id: string; peso: number; fazer: () => string }[] = [];
  const fam = reagiram.find(p => v.vinculos[p.id]?.parentesco && ['mae', 'pai', 'avo', 'tio'].includes(v.vinculos[p.id].parentesco!));
  if (fam) opcoes.push({ id: 'familia', peso: 2, fazer: () => { v.vinculos[fam.id].proximidade = clamp(v.vinculos[fam.id].proximidade + 1); return `${fam.nome} comentou três corações e uma pergunta que deveria ter sido mensagem privada. Todo mundo leu.`; } });
  const colega = reagiram.find(p => v.vinculos[p.id]?.convivio.includes('trabalho'));
  if (colega) opcoes.push({ id: 'colega', peso: 1.4, fazer: () => { v.vinculos[colega.id].proximidade = clamp(v.vinculos[colega.id].proximidade + 2); return `No dia seguinte, ${colega.nome} puxou o assunto do post no café — e a conversa foi além do trabalho.`; } });
  opcoes.push({ id: 'estranho_gentil', peso: 1, fazer: () => `Um estranho do outro lado do ${pl.id === 'onlyfans' ? 'mundo' : 'país'} escreveu um comentário comprido, gentil, sobre o post. Você respondeu.` });
  opcoes.push({ id: 'chato', peso: 0.8, fazer: () => { v.mente.estresse = clamp(v.mente.estresse + 1); return 'Um comentário maldoso de um perfil sem foto. Você apagou — e pensou nele o resto do dia.'; } });
  if (['receita', 'tutorial', 'pet', 'viagem'].includes(pub.tema)) opcoes.push({ id: 'pergunta', peso: 1.6, fazer: () => { c.engajamento = clamp((c.engajamento ?? 50) + 3); return pub.tema === 'receita' ? 'Choveram pedidos da receita. Você virou, por uma semana, a pessoa da receita.' : pub.tema === 'viagem' ? 'Três pessoas perguntaram onde era, e uma foi no mês seguinte.' : 'As perguntas nos comentários renderam mais que o post.'; } });
  if (real >= 1500 && real < 60000 && pl.id !== 'onlyfans') opcoes.push({ id: 'permuta', peso: 1.2, fazer: () => { v.financas.conta += Math.round(150 * economiaLocal(v.moradia.municipioId).custo); return 'Uma loja pequena da cidade mandou mensagem: um produto em troca de um post. O primeiro "publi" — pequeno, e seu.'; } });
  if (real >= 8000 && pl.id !== 'onlyfans') opcoes.push({ id: 'colab', peso: 1, fazer: () => { const g = Math.round(real * (0.03 + r.next() * 0.04)); c.seguidores += g; pub.novos += g; return `Uma conta maior que a sua chamou para uma colaboração. ${seguidoresEmPalavras(g)} ${pl.publico[1]} vieram de lá.`; } });
  if (real >= 300) opcoes.push({ id: 'print', peso: 0.6, fazer: () => { const g = Math.round(pub.alcance * 0.3); pub.alcance += g; return 'Uma página de memes da cidade repostou — sem dar crédito. Ainda assim, chegou gente.'; } });
  const livres = opcoes.filter(o => o.id !== recentes[recentes.length - 1]).map(o => ({ ...o, peso: recentes.includes(o.id) ? o.peso * 0.3 : o.peso }));
  const e = r.weighted(livres, o => o.peso);
  if (!e) return undefined;
  c.ecos = [...recentes, e.id].slice(-3);
  return e.fazer();
}

/** A publicação virou briga: alcance maior, confiança menor — e quem da sua vida pensa diferente. */
function polemica(v: Vida, pl: Plataforma, c: ContaSocial, pub: Publicacao, reagiram: Pessoa[], r: Rng): string[] {
  const out: string[] = [];
  pub.polemica = true;
  totais(c).polemicas++;
  c.credibilidade = clamp(c.credibilidade - 8);
  c.toxicidade = clamp((c.toxicidade ?? 0) + 6);
  pub.alcance = Math.round(pub.alcance * 2);
  const ganho = Math.round(pub.alcance * pl.conversao * 0.6);
  c.seguidores += ganho; pub.novos += ganho;
  const alvo = reagiram.concat(seguidoresConhecidos(v, pl.id)).filter(p => !v.vinculos[p.id]?.romance).sort((a, b) => a.temperamento.afabilidade - b.temperamento.afabilidade)[0];
  if (alvo && r.chance(0.6)) {
    const vin = v.vinculos[alvo.id];
    vin.tensao = clamp(vin.tensao + 14);
    out.push(`${alvo.nome} discordou em público — e a discussão foi longe nos comentários.`);
    if (vin.tensao >= 45 && !vin.conflito) vin.conflito = { t: v.t, assunto: `a briga no ${pl.nome}`, gravidade: 1, quem: 'eu' };
  } else out.push('Estranhos discordaram em peso nos comentários.');
  // Quem é conhecido vira notícia: a imagem pública sente (`notoriedade.imagemPublica`).
  if ((v.notoriedade?.valor ?? 0) >= 30) { v.fatos['vis_polemica'] = v.t; out.push('Virou notícia: o print rodou fora da rede.'); }
  // Quem tem mandato (ou quer ter): a base gosta da briga; o desgaste sobe.
  const pol = v.caminhos.politica;
  if (pol && pol.fase !== 'encerrada' && (pub.tema === 'politica' || pub.tema === 'opiniao')) {
    pol.apoio = clamp(pol.apoio + 1); pol.desgaste = clamp(pol.desgaste + 4);
    out.push('A base aplaudiu; o adversário guardou o print.');
  }
  // O atleta que rebate a torcida: a torcida não esquece.
  const es = v.caminhos.esporte;
  if (pub.tema === 'rebater' && es?.reputacao !== undefined) { es.reputacao = clamp(es.reputacao - 3); out.push('A torcida respondeu no jogo seguinte, nas arquibancadas.'); }
  return out;
}

/** O que o post faz na carreira e na vida (fora a briga). */
function efeitosNaVida(v: Vida, pl: Plataforma, c: ContaSocial, pub: Publicacao, r: Rng): string[] {
  const out: string[] = [];
  const e = v.trabalho.atual;
  const oc = e ? ocupacaoOuNula(e.ocupacaoId) : undefined;
  if (e && pub.tema === 'trabalho' && r.chance(0.12)) { e.clima = clamp((e.clima ?? 50) - 4); out.push('Alguém da chefia viu — e não gostou.'); }
  if (e && oc && pub.tema === 'bastidores' && (SIGILO.has(oc.setor) || SIGILO.has(oc.trilha)) && r.chance(0.3)) {
    e.clima = clamp((e.clima ?? 50) - 8);
    out.push('O trabalho viu o vídeo: uma advertência por escrito — o que aparece ali não devia aparecer.');
    escrever(v, { texto: `Levou uma advertência no trabalho por causa de um vídeo dos bastidores no ${pl.nome}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  }
  if (pub.tema === 'desculpas' && v.caminhos.esporte?.reputacao !== undefined) {
    const es = v.caminhos.esporte;
    if (r.chance(0.65)) { es.reputacao = clamp((es.reputacao ?? 50) + 2); out.push('A torcida aceitou: o próximo jogo foi de apoio.'); if ((v.notoriedade?.valor ?? 0) >= 30) v.fatos['vis_boa'] = v.t; }
    else out.push('Uma parte da torcida achou que foi pouco.');
  }
  if (pub.tema === 'divulgar') {
    const arte = v.caminhos.arte;
    const ganho = Math.min(4, Math.round(pub.novos / 800) + (pub.viral ? 3 : 0));
    if (arte?.ativo && ganho > 0) { arte.publico = clamp(arte.publico + ganho); out.push('Gente nova chegou ao trabalho de vocês pela rede.'); }
    const neg = v.caminhos.negocio;
    if (neg && neg.estado !== 'fechado' && pub.novos >= 30 && r.chance(0.5)) out.push('Clientes novos disseram que viram na rede.');
  }
  if (pub.tema === 'musica' || pub.tema === 'arte' || pub.tema === 'tutorial') v.fatos['audiencia'] = clamp((v.fatos['audiencia'] ?? 0) + Math.min(6, 1 + pub.novos / 500));
  if (pub.tema === 'familia') {
    const par = parceiro(v);
    if (par && pub.pessoas?.includes(par.p.id)) par.vin.proximidade = clamp(par.vin.proximidade + 1);
  }
  if (pl.id === 'onlyfans' && pub.tema === 'divulgar') descoberta(v, pl, c, rngDe(v.id, 'of_divulga', v.t), 0.45);
  return out;
}

/** Viralizou: o que muda para quem era ninguém (e para quem já era alguém). */
function viralizou(v: Vida, pl: Plataforma, pub: Publicacao, r: Rng): string[] {
  const out: string[] = [];
  const fama = v.notoriedade?.valor ?? 0;
  if (v.fatos['rede_viral'] === undefined || v.t - v.fatos['rede_viral'] >= 60) {
    v.fatos['rede_viral'] = v.t;
    escrever(v, { texto: `Uma publicação no ${pl.nome} viralizou: ${pub.texto.replace(/\.$/, '').replace(/^(.)/, x => x.toLowerCase())}.`, relevancia: 'biografia', tema: 'amizade', tom: 'bom' });
  }
  if (fama < 25) {
    // Uma pessoa comum que viraliza: às vezes, uma porta (viver disso; uma publi paga; um convite da TV local).
    if (DE_CRIADOR.includes(pl.id as PlataformaId) && v.trabalho.atual?.ocupacaoId !== 'criador_conteudo' && idade(v) >= 16 && r.chance(0.35)) {
      novaOportunidade(v, { tipo: 'convite', ocupacaoId: 'criador_conteudo', meses: 12, chave: 'criador', titulo: 'Viver de conteúdo?', texto: `Depois do vídeo que viralizou no ${pl.nome}, marcas começaram a mandar proposta. Dá para tentar viver disso — por enquanto.` });
      out.push('Na semana seguinte, chegaram propostas de marcas (estão em Trabalho).');
    } else if (r.chance(0.3)) {
      v.fatos['vis_boa'] = v.t;
      out.push('Um programa de TV local quis falar com você. Por uma semana, a rua inteira sabia o seu nome.');
    }
  }
  return out;
}

/** Marcar uma celebridade: o normal, para quem é ninguém, é não acontecer nada. */
function mencionar(v: Vida, pl: Plataforma, c: ContaSocial, celebId: string): string {
  v.fatos[`rede_mencao:${pl.id}`] = v.t;
  const cel = celebridadesDoPais(v).find(x => x.id === celebId)!;
  const r = rngDe(v.id, 'mencao', v.t, pl.id, celebId);
  const fama = v.notoriedade?.valor ?? 0;
  const real = publicoReal(c);
  const conhece = (c.celebridades ?? []).includes(cel.nome);
  // A chance de ser notado: o tamanho da conta, o nome, a confiança, a sorte, uma conversa anterior.
  const chance = Math.min(0.9, 0.05 + Math.log10(real + 1) * 0.035 + fama / 160 + (conhece ? 0.25 : 0)) * (0.6 + c.credibilidade / 150) * (c.toxicidade && c.toxicidade >= 40 ? 0.5 : 1);
  const x = r.next();
  if (x >= chance) return r.pick([`${cel.nome} não viu. ${cel.papel.charAt(0).toUpperCase() + cel.papel.slice(1)} recebe milhares de marcações por dia.`, `Nada. A marcação se perdeu entre outras mil.`, `Silêncio. Uns fãs de ${cel.nome} curtiram, por educação.`]);
  const y = x / chance;
  const lembrar = () => { c.celebridades = [...new Set([...(c.celebridades ?? []), cel.nome])].slice(-8); };
  if (y > 0.45) { lembrar(); return `${cel.nome} curtiu. Só isso — mas você tirou print.`; }
  if (y > 0.15) {
    lembrar();
    const ganho = Math.round((200 + real * 0.05) * (0.5 + r.next()));
    c.seguidores += ganho;
    if (!conhece && fama < 40) escrever(v, { texto: `${cel.nome}, ${cel.papel}, respondeu a uma publicação sua no ${pl.nome}.`, relevancia: 'cotidiano', tema: 'amizade', tom: 'bom' });
    return `${cel.nome} respondeu! ${seguidoresEmPalavras(ganho)} pessoas vieram ver quem era você.`;
  }
  if (y > 0.03) {
    lembrar();
    const ganho = Math.round((1500 + real * 0.15) * (0.5 + r.next()));
    c.seguidores += ganho;
    escrever(v, { texto: `${cel.nome}, ${cel.papel}, compartilhou uma publicação sua no ${pl.nome}: ${seguidoresEmPalavras(ganho)} ${pl.publico[1]} novos numa noite.`, relevancia: 'biografia', tema: 'amizade', tom: 'bom' });
    return `${cel.nome} compartilhou. O celular não parou a noite inteira: ${seguidoresEmPalavras(ganho)} ${pl.publico[1]} novos.`;
  }
  // Raríssimo: começou uma conversa de verdade.
  lembrar();
  const [nome, ...sob] = cel.nome.split(' ');
  const p = criarPessoa(v, r, { idade: clamp(idade(v) + r.int(-8, 12), 20, 75), genero: cel.genero, municipioId: v.moradia.municipioId, nome, sobrenome: sob.join(' '), ocupacao: cel.papel });
  const vin = vincular(v, p, { origem: 'apresentado', proximidade: 22, estagio: 'conhecido' });
  vin.contexto = novoContexto('outro');
  vin.digital = { mensagem: v.t, segue: true, seguidor: true };
  lembrarCom(v, p.id, `Começaram a conversar depois de uma marcação no ${pl.nome}.`, 'inicio', 2);
  escrever(v, { texto: `${cel.nome}, ${cel.papel}, respondeu a uma marcação no ${pl.nome} — e a conversa continuou por mensagem.`, relevancia: 'biografia', tema: 'amizade', tom: 'bom', pessoas: [p.id] });
  return `${cel.nome} respondeu — e depois mandou mensagem. A conversa continuou. ${p.nome} agora está em Pessoas.`;
}

/** Trollar, xingar, provocar: às vezes dá audiência; quase sempre deixa conta. */
function trollar(v: Vida, pl: Plataforma, c: ContaSocial, alvo: string): string {
  const k = `rede_trolls:${pl.id}:${Math.floor(v.t / 12)}`;
  v.fatos[k] = (v.fatos[k] ?? 0) + 1;
  const r = rngDe(v.id, 'trollar', v.t, pl.id, alvo, v.fatos[k]);
  c.toxicidade = clamp((c.toxicidade ?? 0) + 10);
  c.credibilidade = clamp(c.credibilidade - 3);
  v.mente.estresse = clamp(v.mente.estresse + 2);
  const out: string[] = [];
  const x = r.next();
  if (x < 0.25 + (pl.id === 'x' ? 0.15 : 0)) {
    // Rendeu: a briga trouxe gente (quem gosta de briga).
    const ganho = Math.round((50 + publicoReal(c) * 0.04) * (0.5 + r.next()) * (pl.id === 'x' ? 2 : 1));
    c.seguidores += ganho;
    out.push(`A provocação pegou: ${seguidoresEmPalavras(ganho)} ${pl.publico[1]} novos — do tipo que gosta de briga.`);
  } else if (x < 0.55) out.push('Ninguém deu muita bola. Ficou só a sensação.');
  // A denúncia: a rede pune quem acumula.
  if (r.chance(0.18 + (c.toxicidade ?? 0) / 300)) {
    c.advertencias = (c.advertencias ?? 0) + 1;
    if (c.advertencias >= 3) {
      c.suspensaAte = v.t + 12;
      c.advertencias = 0;
      escrever(v, { texto: `A conta no ${pl.nome} foi suspensa por um ano depois de denúncias.`, relevancia: publicoReal(c) >= 10000 ? 'biografia' : 'cotidiano', tema: 'amizade', tom: 'ruim' });
      out.push(`Denunciaram. Foi a terceira: a ${pl.nome} suspendeu a conta por um ano.`);
    } else out.push(`Denunciaram: a ${pl.nome} mandou uma advertência (${c.advertencias} de 3).`);
  }
  if (alvo === 'celebridade') {
    v.mente.estresse = clamp(v.mente.estresse + 3);
    out.push('Os fãs vieram em bando. O celular não parou — e não era coisa boa.');
    if ((v.notoriedade?.valor ?? 0) >= 30) { v.fatos['vis_polemica'] = v.t; out.push('E virou notícia.'); }
  } else if (alvo !== 'estranho') {
    const vin = v.vinculos[alvo]; const p = v.pessoas[alvo];
    vin.tensao = clamp(vin.tensao + 20); vin.proximidade = clamp(vin.proximidade - 8);
    vin.conflito = { t: v.t, assunto: `a provocação no ${pl.nome}`, gravidade: vin.proximidade >= 40 ? 2 : 1, quem: 'eu' };
    lembrarCom(v, p.id, `Você provocou ${p.nome} em público, no ${pl.nome}.`, 'conflito', 2);
    out.unshift(`${p.nome} viu. ${flex(p.genero, 'Ele', 'Ela', 'Elu')} respondeu — e a briga saiu da rede.`);
    if (vin.convivio.includes('trabalho') && v.trabalho.atual) { v.trabalho.atual.clima = clamp((v.trabalho.atual.clima ?? 50) - 4); out.push('No trabalho, todo mundo ficou sabendo.'); }
  } else out.unshift('Você provocou um estranho nos comentários.');
  // O chefe também está lá.
  if (v.trabalho.atual && alvo !== 'estranho' && r.chance(0.12)) { v.trabalho.atual.clima = clamp((v.trabalho.atual.clima ?? 50) - 5); out.push('Alguém do trabalho mostrou o print para a chefia.'); }
  return out.join(' ');
}

/** Uma campanha paga para a conta: público legítimo, que depende do que a conta tem para mostrar. */
function campanha(v: Vida, pl: Plataforma, c: ContaSocial): string {
  const custo = custoDaCampanha(v, c);
  pagar(v, custo);
  v.fatos[`rede_campanha:${pl.id}`] = v.t;
  const r = rngDe(v.id, 'campanha', v.t, pl.id);
  const recentes = c.publicacoes.filter(p => !p.apagada && v.t - p.t < 12);
  const boas = recentes.filter(p => p.reacao === 'foi bem' || p.viral).length;
  const fator = (0.5 + Math.min(1.2, boas * 0.3)) * (0.6 + r.next() * 0.8) * (0.4 + c.credibilidade / 120);
  const novos = Math.round(custo / 2 * pl.conversao * 10 * fator);
  c.seguidores += novos;
  c.engajamento = clamp((c.engajamento ?? 50) + 3);
  return novos >= 100 ? `A campanha rodou: ${seguidoresEmPalavras(novos)} ${pl.publico[1]} novos, de verdade.` : `A campanha rodou e trouxe pouca gente (${novos}). Promover conta fraca é jogar dinheiro fora.`;
}

/** Verificar: pagar o selo (X), mandar o documento (OnlyFans) ou pedir e esperar a análise (o resto). */
function verificar(v: Vida, pl: Plataforma, c: ContaSocial): string {
  if (pl.verificacao === 'paga') {
    pagar(v, custoDoSelo(v));
    c.verificada = v.t; c.selo = 'pago';
    return 'Selo assinado. A conta tem o tique — que hoje diz que você paga, não quem você é.';
  }
  if (pl.verificacao === 'documento') { c.verificada = v.t; return 'Documento e selfie enviados: identidade e maioridade confirmadas.'; }
  c.pedidoVerificacao = v.t;
  return 'Pedido enviado. A análise olha se você é quem diz e se é de interesse público — a resposta sai na virada do ano.';
}

/** O que a rede pede para verificar (notoriedade ou um público real grande e confiável). */
export function criterioDeVerificacao(pl: PlataformaId): number {
  return pl === 'tiktok' ? 200000 : pl === 'twitch' ? 50000 : pl === 'facebook' ? 50000 : 100000;
}

function pessoaNaRede(v: Vida, op: Extract<OpRede, { pessoaId: string }>): string {
  const vin = v.vinculos[op.pessoaId]; const p = v.pessoas[op.pessoaId];
  switch (op.oque) {
    case 'seguir': {
      (vin.digital ??= {}).segue = true;
      const volta = rngDe(v.id, 'segue', op.pessoaId, v.t).chance(vin.proximidade >= 40 ? 0.8 : 0.35);
      if (volta && !vin.digital.seguidor) { vin.digital.seguidor = true; const c = contasAtivas(v).find(x => usaPlataforma(v, p, x.plataforma as PlataformaId)); if (c) c.seguidores += 1; }
      vin.digital.reacao = v.t;
      return volta ? `Você passou a seguir ${p.nome}. ${p.nome} seguiu de volta.` : `Você passou a seguir ${p.nome}.`;
    }
    case 'deixar': {
      vin.digital!.segue = false;
      const notou = vin.digital!.seguidor && vin.proximidade >= 45 && rngDe(v.id, 'deixou', op.pessoaId, v.t).chance(0.5);
      if (notou) { vin.tensao = clamp(vin.tensao + 6); vin.proximidade = clamp(vin.proximidade - 3); return `Você deixou de seguir ${p.nome}. ${p.nome} percebeu — e não disse nada.`; }
      return `Você deixou de seguir ${p.nome}.`;
    }
    case 'desbloquear':
      vin.digital!.bloqueado = undefined;
      vin.tensao = clamp(vin.tensao - 5);
      return `Você desbloqueou ${p.nome}. Ainda não se falaram.`;
    case 'bloquear': {
      const d = (vin.digital ??= {});
      d.bloqueado = v.t; d.segue = false;
      if (d.seguidor) { d.seguidor = false; for (const c of contasAtivas(v)) if (usaPlataforma(v, p, c.plataforma as PlataformaId)) c.seguidores = Math.max(0, c.seguidores - 1); }
      // Bloquear é um gesto com consequência: o ex fica longe de verdade; o amigo ou a família, ofendidos.
      if (vin.romance?.estagio === 'ex') { vin.distancia = v.t; vin.tensao = clamp(vin.tensao + 10); return `Você bloqueou ${p.nome}. Um silêncio que, desta vez, foi escolhido.`; }
      if (vin.proximidade >= 40 || vin.parentesco) {
        vin.tensao = clamp(vin.tensao + 25); vin.proximidade = clamp(vin.proximidade - 10);
        vin.conflito = { t: v.t, assunto: 'o bloqueio na rede', gravidade: 2, quem: 'eu' };
        return `Você bloqueou ${p.nome}. ${flex(p.genero, 'Ele', 'Ela', 'Elu')} descobriu em dois dias — e entendeu como uma briga.`;
      }
      vin.distancia = v.t;
      return `Você bloqueou ${p.nome}.`;
    }
  }
}

function marcosDeSeguidores(v: Vida, pl: Plataforma, c: ContaSocial): void {
  for (const m of [1000, 10000, 100000, 1000000]) {
    const chave = `rede_${pl.id}_${m}`;
    if (publicoReal(c) >= m * 0.7 && c.seguidores >= m && v.fatos[chave] === undefined) {
      v.fatos[chave] = v.t;
      if (m >= 10000) escrever(v, { texto: `Passou de ${seguidoresEmPalavras(m)} ${pl.publico[1]} no ${pl.nome}.`, relevancia: m >= 100000 ? 'biografia' : 'cotidiano', tema: 'amizade', tom: 'bom' });
    }
  }
}

/**
 * OnlyFans: o que é público às vezes chega a quem não devia. Quem descobre reage do seu jeito — o parceiro, a família,
 * o trabalho (em carreiras de imagem conservadora, pesa mais). Nada é descrito além disso.
 */
function descoberta(v: Vida, pl: Plataforma, c: ContaSocial, r: Rng, chance: number): string | undefined {
  if (!r.chance(chance)) return undefined;
  const ja = new Set(c.descobriram ?? []);
  const par = parceiro(v);
  const candidatos = [
    ...(par && !ja.has(par.p.id) ? [par] : []),
    ...Object.values(v.vinculos).map(vin => ({ vin, p: v.pessoas[vin.pessoaId] })).filter(x => x.p?.vivo && !x.p.especie && !ja.has(x.p.id) && ['mae', 'pai', 'irmao'].includes(x.vin.parentesco ?? ''))
  ];
  const e = v.trabalho.atual;
  const trabalhoSabe = e && !ja.has('trabalho') && r.chance(0.35);
  if (trabalhoSabe && e) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    const imagem = oc && (['publico', 'educacao', 'saude', 'forcas', 'seguranca', 'justica'].includes(oc.setor) || oc.trilha === 'politica');
    e.clima = clamp((e.clima ?? 50) - (imagem ? 20 : 8));
    c.descobriram = [...ja, 'trabalho'];
    escrever(v, { texto: `O trabalho descobriu a conta no ${pl.nome}.${imagem ? ' A conversa com a chefia foi longa — e o clima não voltou a ser o mesmo.' : ' Uns riram, outros fingiram não saber.'}`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    const pol = v.caminhos.politica;
    if (pol && pol.fase !== 'encerrada') pol.desgaste = clamp(pol.desgaste + 12);
    return 'O trabalho descobriu.';
  }
  const quem = candidatos[0];
  if (!quem) return undefined;
  const { p, vin } = quem;
  c.descobriram = [...ja, p.id];
  const romance = !!vin.romance && vin.romance.estagio !== 'ex';
  const aceita = p.temperamento.abertura >= 0.25 && r.chance(0.6);
  if (aceita) { vin.tensao = clamp(vin.tensao + 6); lembrarCom(v, p.id, `${p.nome} descobriu o ${pl.nome} — e quis conversar, sem drama.`, 'conflito', 2); }
  else {
    vin.tensao = clamp(vin.tensao + (romance ? 28 : 18)); vin.confianca = clamp(vin.confianca - (romance ? 15 : 8));
    vin.conflito = { t: v.t, assunto: `o ${pl.nome}`, gravidade: romance ? 3 : 2, quem: 'eu' };
    lembrarCom(v, p.id, `${p.nome} descobriu o ${pl.nome} por outra pessoa.`, 'conflito', 3);
  }
  escrever(v, { texto: `${p.nome} descobriu a conta no ${pl.nome}.${aceita ? ' Houve conversa, não briga.' : ' A conversa foi difícil.'}`, relevancia: 'biografia', tema: romance ? 'amor' : 'familia', tom: aceita ? undefined : 'ruim', pessoas: [p.id] });
  return `${p.nome} descobriu.`;
}

/* ---------------------------------------------------------------- O ano */

/** O ano das redes: quem some perde gente; quem é famoso ganha; o comprado pode ser descoberto; a rede paga e pune. */
export function processarRedes(v: Vida): void {
  for (const c of contasAtivas(v)) {
    if (!ehPlataforma(c.plataforma)) continue;
    const pl = PLATAFORMAS[c.plataforma];
    const r = rngDe(v.id, 'rede_ano', v.t, pl.id);
    const t = totais(c);
    if (c.suspensaAte !== undefined && v.t >= c.suspensaAte) c.suspensaAte = undefined;
    if (c.advertencias && r.chance(0.5)) c.advertencias -= 1;
    c.toxicidade = c.toxicidade ? Math.max(0, c.toxicidade - 5) : c.toxicidade;
    // A verificação pedida: a análise olha o nome e o público real (não o clique).
    if (c.pedidoVerificacao !== undefined && v.t - c.pedidoVerificacao >= 1) {
      const ok = (v.notoriedade?.valor ?? 0) >= 35 || (publicoReal(c) >= criterioDeVerificacao(pl.id) && c.credibilidade >= 50 && !c.comprados);
      c.pedidoVerificacao = undefined;
      if (ok) { c.verificada = v.t; escrever(v, { texto: `A conta no ${pl.nome} foi verificada.`, relevancia: 'biografia', tema: 'amizade', tom: 'bom' }); }
      else c.recusaVerificacao = v.t;
    }
    const noAno = publicacoesDoAno(v, c);
    const real = publicoReal(c);
    if (noAno === 0) { c.seguidores = Math.round(c.seguidores - real * pl.esquece[0]); c.credibilidade = clamp(c.credibilidade - 2); c.engajamento = clamp((c.engajamento ?? 50) - 8); }
    else c.seguidores = Math.round(c.seguidores - real * pl.esquece[1] + real * 0.01 * Math.min(6, noAno));
    // Quem faz da criação de conteúdo uma atividade da semana (`rotinas: criar_conteudo`) publica sem o jogador clicar
    // em cada vídeo: o ano de trabalho aparece no público das redes de criador.
    const criando = v.rotinas.find(x => x.id === 'criar_conteudo');
    if (criando && DE_CRIADOR.includes(pl.id)) c.seguidores += Math.round(pl.piso * pl.conversao * 8 * (criando.nivel ?? 1) * (0.6 + r.next() * 0.8) * (1 + real / 20000));
    // YouTube: o catálogo continua sendo visto (quem ensina de verdade cresce devagar e não para).
    if (pl.id === 'youtube' && t.publicacoes >= 5) c.seguidores += Math.round(Math.min(t.publicacoes, 80) * (8 + real * 0.0008) * (0.6 + r.next() * 0.8));
    // Quem é famoso ganha público sozinho — mais onde o público da idade dele está.
    const fama = v.notoriedade?.valor ?? 0;
    const peso = ({ instagram: 1, tiktok: 0.8, x: 0.7, youtube: 0.5, facebook: 0.45, twitch: 0.2, onlyfans: 0.12 } as Record<PlataformaId, number>)[pl.id];
    if (fama >= 30) c.seguidores += Math.round((fama - 25) ** 2 * 40 * peso * (0.6 + r.next() * 0.8));
    c.seguidores = Math.max(0, c.seguidores);
    // O comprado pode ser descoberto (algumas redes caçam mais).
    if (c.comprados) {
      const chance = pl.deteccao + (c.comprados / Math.max(1, c.seguidores)) * 0.4 + fama / 200;
      if (r.chance(chance)) {
        c.seguidores = Math.max(0, c.seguidores - Math.round(c.comprados * 0.9));
        c.comprados = 0;
        c.credibilidade = clamp(c.credibilidade - 20);
        c.advertencias = (c.advertencias ?? 0) + 1;
        if (c.monetizada !== undefined && c.credibilidade < 40) c.monetizada = undefined;
        escrever(v, { texto: `Descobriram que parte dos seus ${pl.publico[1]} no ${pl.nome} era comprada. Os prints rodaram mais do que qualquer publicação sua.`, relevancia: 'biografia', tema: 'amizade', tom: 'ruim' });
      }
    } else if (c.credibilidade < 70) c.credibilidade = clamp(c.credibilidade + 3);
    if (pl.id === 'onlyfans') descoberta(v, pl, c, r, Math.min(0.35, 0.08 + Math.log10(real + 1) * 0.05));
    // Quem cria de verdade, com público e renda, pode receber o convite de viver disso.
    if (DE_CRIADOR.includes(pl.id) && c.monetizada !== undefined && real >= 50000 && v.trabalho.atual?.ocupacaoId !== 'criador_conteudo' && idade(v) >= 16 && r.chance(0.25)) {
      novaOportunidade(v, { tipo: 'convite', ocupacaoId: 'criador_conteudo', meses: 12, chave: 'criador', titulo: 'A rede virou trabalho', texto: `Com ${seguidoresEmPalavras(real)} ${pl.publico[1]} no ${pl.nome}, uma agência quer cuidar da sua carreira de criador. Dá para viver disso.` });
    }
    t.receita += rendaDaConta(v, c) * 12;
    t.maior = Math.max(t.maior, c.seguidores);
    marcosDeSeguidores(v, pl, c);
  }
}

/* ------------------------------------------------------------- Leitura */

export interface LeituraDaConta {
  conta: ContaSocial;
  plataforma: Plataforma;
  real: number;
  credibilidade: string;
  engajamento: string;
  /** "verificada", "selo pago", "em análise", "recusada"... */
  verificacao?: string;
  renda: number;
  suspensa: boolean;
  toxica: boolean;
  noAno: number;
}

const palavraCred = (x: number) => (x >= 70 ? 'confiável' : x >= 45 ? 'normal' : x >= 25 ? 'desconfiada' : 'queimada');
const palavraEng = (x: number) => (x >= 65 ? 'quente' : x >= 45 ? 'morno' : x >= 25 ? 'frio' : 'parado');

/** O que a tela mostra da conta (a mesma fonte que as ações usam). */
export function leituraDaConta(v: Vida, pl: PlataformaId = PLATAFORMA_PADRAO): LeituraDaConta | undefined {
  const c = contaAtiva(v, pl);
  if (!c) return undefined;
  const verificacao = c.verificada !== undefined ? (c.selo === 'pago' ? 'selo pago' : pl === 'onlyfans' ? 'identidade verificada' : 'verificada') : c.pedidoVerificacao !== undefined ? 'verificação em análise' : c.recusaVerificacao !== undefined && v.t - c.recusaVerificacao < 12 ? 'verificação recusada' : undefined;
  return { conta: c, plataforma: PLATAFORMAS[pl], real: publicoReal(c), credibilidade: palavraCred(c.credibilidade), engajamento: palavraEng(c.engajamento ?? 50), verificacao, renda: rendaDaConta(v, c), suspensa: suspensa(v, c), toxica: (c.toxicidade ?? 0) >= 40, noAno: doAno(v, c).length };
}
