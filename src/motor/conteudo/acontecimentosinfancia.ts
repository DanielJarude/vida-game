/**
 * REWORK 11 · Fase F (EVT-11.1) — A INFÂNCIA QUE DEPENDE DE QUEM VOCÊ É. A infância repetia entre vidas porque quase
 * toda cena era genérica ("a primeira palavra", "o passarinho": essas continuam). Estas só aparecem quando a vida está
 * naquele lugar — a avó doente, o pai sem emprego, a cidade nova, o irmão mais velho, o primeiro campeonato da escolinha,
 * a redação de quem vai bem na escola — e as universais (o dente, a coleção, a noite sem luz) variam o texto por um
 * sorteio derivado da vida (`rngDe`): a mesma vida conta igual, vidas diferentes contam diferente.
 *
 * Regras da casa (como em `acontecimentos10`): papéis `fixo` (não gastam o gerador do ano); `quando` não sorteia;
 * nada presume país (nenhuma festa, moeda ou costume local).
 */
import type { Conteudo, Ctx } from './base';
import * as P from './papeis';
import { fixo } from './papeis';
import { cognicao, estresse, feliz, prox } from './efeitos';
import { idade, idadePessoa, lembrarCom } from '../nucleo';
import { rngDe } from '../rng';
import { flex } from '../texto';

const nome = (c: Ctx, papel: string) => c.p[papel]?.nome ?? '';
const ele = (c: Ctx, papel: string) => flex(c.p[papel]?.genero ?? 'masculino', 'ele', 'ela', 'elu');
const naEscola = (c: Ctx) => !!c.v.educacao.basica && !c.v.educacao.evadiu;
/** Uma das variantes, sempre a mesma para esta vida (o sorteio derivado não mexe no gerador do ano). */
const uma = <T,>(c: Ctx, chave: string, xs: T[]): T => rngDe(c.v.id, 'inf11', chave).pick(xs);
const ESPORTES: Record<string, string> = { futebol: 'futebol', volei: 'vôlei', basquete: 'basquete', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta', time_escola: 'futebol' };
const esporteDaCrianca = (c: Ctx) => c.v.rotinas.find(r => ESPORTES[r.id]);
const avoDoente = (v: Ctx['v']) => P.avo(v).filter(p => p.saude < 45);
const genitorSemEmprego = (v: Ctx['v']) => P.genitorEmCasa(v).filter(p => p.aperto?.tipo === 'desemprego' && v.t - p.aperto.t <= 18);
const irmaoMaisVelho = (v: Ctx['v']) => P.irmaoEmCasa(v).filter(p => idadePessoa(v, p) - idade(v) >= 4 && idadePessoa(v, p) <= 19);
const petDoente = (v: Ctx['v']) => P.pet(v).filter(p => p.saude < 40);

export const ACONTECIMENTOS_INFANCIA: Conteudo[] = [
  {
    id: 'inf11_avo_doente', tipo: 'decisao', idade: [5, 12], tema: 'familia', peso: 1.6,
    papeis: { avo: fixo(avoDoente) },
    titulo: c => `${nome(c, 'avo')} no hospital`,
    texto: c => `${nome(c, 'avo')} está doente, e os adultos falam baixo quando você entra na cozinha. No domingo, a família vai visitar.`,
    opcoes: [
      { id: 'cartao', texto: 'Fazer um desenho para levar', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `${nome(c, 'avo')} pendurou o desenho na parede do quarto e mostrou para cada visita.`, memoria: `Levou um desenho para ${nome(c, 'avo')}, no tempo da doença.`, lembrar: ['avo', 'O desenho no quarto do hospital.', 'apoio'], efeito: () => { prox(c, 'avo', 10); feliz(c, 2); } }) },
      { id: 'perguntar', texto: 'Perguntar o que está acontecendo', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Alguém sentou com você e explicou devagar. Saber foi melhor que imaginar.', memoria: null, efeito: () => { estresse(c, -3); cognicao(c, 1); } }) },
      { id: 'nao_ir', texto: 'Pedir para não ir', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: `Você ficou com uma vizinha. À noite, perguntou se ${nome(c, 'avo')} tinha perguntado por você.`, memoria: null, efeito: () => estresse(c, 3) }) }
    ]
  },
  {
    id: 'inf11_casa_sem_emprego', tipo: 'decisao', idade: [6, 12], tema: 'familia', peso: 1.6,
    papeis: { genitor: fixo(genitorSemEmprego) },
    titulo: 'A casa mais quieta',
    texto: c => `Desde que ${nome(c, 'genitor')} perdeu o emprego, a casa ficou mais quieta. Você percebeu que ${ele(c, 'genitor')} conta o dinheiro do mercado duas vezes.`,
    opcoes: [
      { id: 'cofrinho', texto: 'Oferecer o dinheiro do cofrinho', comportamento: { generosidade: 1 },
        resolver: c => ({ texto: `${nome(c, 'genitor')} não aceitou — mas abraçou você por um tempo que não acabava.`, memoria: `Ofereceu o cofrinho a ${nome(c, 'genitor')}, no ano sem emprego.`, lembrar: ['genitor', 'O cofrinho oferecido no ano difícil.', 'apoio'], efeito: () => { prox(c, 'genitor', 10); } }) },
      { id: 'perguntar', texto: 'Perguntar se vai ficar tudo bem', comportamento: { coragem: 1 },
        resolver: c => ({ texto: `"Vai." ${nome(c, 'genitor')} disse com a voz firme, e você acreditou.`, memoria: null, efeito: () => { prox(c, 'genitor', 4); estresse(c, -2); } }) },
      { id: 'fingir', texto: 'Fazer de conta que não percebeu', resolver: c => ({ texto: 'Você parou de pedir coisas no mercado sem ninguém pedir.', memoria: null, efeito: () => estresse(c, 4) }) }
    ]
  },
  {
    id: 'inf11_cidade_nova', tipo: 'decisao', idade: [5, 11], tema: 'lugar', peso: 2,
    quando: c => { const t = c.v.fatos['mudou_de_cidade']; return t !== undefined && c.v.t - t <= 12 && naEscola(c); },
    titulo: 'A escola nova',
    texto: () => 'Cidade nova, escola nova. No primeiro dia, todo mundo já tem com quem sentar — e repara no seu jeito de falar.',
    opcoes: [
      { id: 'puxar', texto: 'Puxar conversa com quem está sozinho também', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'O outro aluno novo era de outra cidade também. Na semana seguinte, vocês já tinham um esconderijo no pátio.', memoria: 'Fez o primeiro amigo na escola da cidade nova.', efeito: () => feliz(c, 3) }) },
      { id: 'quieto', texto: 'Ficar quieto até entender como é aqui', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Levou um mês. Depois, ninguém lembrava mais que você era o novo.', memoria: null, efeito: () => estresse(c, 2) }) },
      { id: 'saudade', texto: 'Pedir para voltar para a cidade antiga', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Não dava para voltar. Mas alguém prometeu uma ligação por semana para os amigos de lá.', memoria: null, efeito: () => estresse(c, 4) }) }
    ]
  },
  {
    id: 'inf11_irmao_mais_velho', tipo: 'decisao', idade: [6, 11], tema: 'familia', peso: 1.4,
    papeis: { irmao: fixo(irmaoMaisVelho) },
    titulo: 'Junto com a turma',
    texto: c => `${nome(c, 'irmao')}, ${idadePessoa(c.v, c.p.irmao)} anos, vai sair com a turma e — pela primeira vez — deixa você ir junto. Com uma condição: não contar nada em casa.`,
    opcoes: [
      { id: 'ir', texto: 'Ir e guardar o segredo', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Foi a tarde mais longa e mais legal do ano. O segredo virou de vocês dois.', memoria: `A tarde em que ${nome(c, 'irmao')} deixou você ir junto com a turma.`, lembrar: ['irmao', 'A tarde com a turma, e o segredo.', 'amizade'], efeito: () => { prox(c, 'irmao', 12); feliz(c, 3); } }) },
      { id: 'contar', texto: 'Ir, mas contar em casa depois', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `${nome(c, 'irmao')} levou bronca e ficou uma semana sem falar com você.`, memoria: null, efeito: () => { prox(c, 'irmao', -6); } }) },
      { id: 'ficar', texto: 'Ficar em casa', resolver: c => ({ texto: `${nome(c, 'irmao')} foi sem você e voltou contando vantagem.`, memoria: null, efeito: () => feliz(c, -1) }) }
    ]
  },
  {
    id: 'inf11_primeiro_campeonato', tipo: 'decisao', idade: [6, 12], tema: 'lazer', peso: 1.8,
    quando: c => !!esporteDaCrianca(c),
    titulo: 'O primeiro campeonato',
    texto: c => `O primeiro campeonato de verdade ${esporteDaCrianca(c)!.id === 'time_escola' ? 'do time da escola' : `de ${ESPORTES[esporteDaCrianca(c)!.id]}`}: uniforme, arquibancada com famílias, um juiz de verdade. Na véspera, você quase não dormiu.`,
    opcoes: [
      { id: 'pedir', texto: 'Pedir para estar no momento decisivo', comportamento: { coragem: 1 },
        resolver: c => { const deu = rngDe(c.v.id, 'inf11', 'campeonato').chance(0.5); return { texto: deu ? 'Deu certo. Você foi carregado nos ombros até o lanche.' : 'Não deu. O técnico disse que errar é de quem tenta — você só acreditou anos depois.', memoria: deu ? 'Decidiu o primeiro campeonato da escolinha.' : null, tom: deu ? 'bom' : 'neutro', efeito: () => { if (deu) feliz(c, 5); else estresse(c, 3); } }; } },
      { id: 'time', texto: 'Jogar para o time, sem inventar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'O time ficou em terceiro. A medalha de plástico ficou anos na parede.', memoria: null, efeito: () => feliz(c, 2) }) },
      { id: 'banco', texto: 'Pedir para começar no banco', resolver: c => ({ texto: 'Entrou no fim, com a perna tremendo. Encostou na bola duas vezes.', memoria: null, efeito: () => estresse(c, -1) }) }
    ]
  },
  {
    id: 'inf11_dente', tipo: 'acontecimento', idade: [6, 7], tema: 'infancia', peso: 1.2,
    narrar: c => ({ texto: uma(c, 'dente', [
      'O primeiro dente caiu numa mordida de maçã. Você guardou num potinho e mostrou para todo mundo da rua.',
      'O dente mole caiu sozinho no meio da aula. A turma inteira quis ver o buraco.',
      'Depois de uma semana mexendo com a língua, o dente caiu no banho. Foi parar no ralo — e você chorou de verdade.'
    ]), relevancia: 'cotidiano', efeito: () => feliz(c, 1) })
  },
  {
    id: 'inf11_colecao', tipo: 'decisao', idade: [7, 11], tema: 'infancia', peso: 1.2,
    titulo: 'A coleção',
    texto: c => { const x = uma(c, 'colecao', ['figurinhas', 'tampinhas', 'pedras bonitas', 'cartas de jogo']); return `A coleção de ${x} já ocupa uma caixa inteira. Um colega propõe trocar três das dele pela sua mais rara.`; },
    opcoes: [
      { id: 'trocar', texto: 'Trocar', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: 'Três pelo preço de uma. No dia seguinte, você descobriu que a sua era a única da escola.', memoria: null, efeito: () => feliz(c, -1) }) },
      { id: 'guardar', texto: 'Guardar a rara: essa não sai', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'A rara ficou. Anos depois, a caixa ainda estava num armário.', memoria: null, efeito: () => feliz(c, 1) }) },
      { id: 'dar', texto: 'Dar uma repetida de presente', comportamento: { generosidade: 1 }, resolver: c => ({ texto: 'O colega ficou sem graça e, no outro dia, trouxe um doce.', memoria: null, efeito: () => feliz(c, 2) }) }
    ]
  },
  {
    id: 'inf11_redacao', tipo: 'acontecimento', idade: [8, 12], tema: 'escola', peso: 1.3,
    quando: c => naEscola(c) && (c.v.educacao.basica?.desempenho ?? 0) >= 72,
    narrar: c => ({ texto: uma(c, 'redacao', [
      'A professora leu a sua redação em voz alta para a turma. Você olhou para a carteira o tempo todo — e lembrou disso por anos.',
      'A sua redação foi para o mural da escola, com uma estrela de papel em cima.',
      'Uma redação sua foi escolhida para representar a turma. Você leu no microfone, com a voz tremendo.'
    ]), relevancia: 'biografia', tom: 'bom', efeito: () => { feliz(c, 3); cognicao(c, 1); } })
  },
  {
    id: 'inf11_noite_sem_luz', tipo: 'acontecimento', idade: [4, 9], tema: 'familia', peso: 1,
    papeis: { genitor: fixo(P.genitorEmCasa) },
    narrar: c => ({ texto: uma(c, 'sem_luz', [
      `A luz acabou numa noite de tempestade. ${nome(c, 'genitor')} acendeu uma vela e contou histórias até a luz voltar — você queria que não voltasse.`,
      `Na noite sem luz, ${nome(c, 'genitor')} fez sombras de bicho na parede com a lanterna. Foi a melhor noite do mês.`,
      `Sem luz e com chuva forte, a família dormiu toda no mesmo quarto. ${nome(c, 'genitor')} roncava; você ria baixinho.`
    ]), relevancia: 'cotidiano', tom: 'bom', efeito: () => { prox(c, 'genitor', 4); lembrarCom(c.v, c.p.genitor.id, 'A noite sem luz.', 'ritual', 1); } })
  },
  {
    id: 'inf11_bicho_doente', tipo: 'decisao', idade: [5, 12], tema: 'familia', peso: 1.5,
    papeis: { pet: fixo(petDoente) },
    titulo: c => `${nome(c, 'pet')} está doente`,
    texto: c => `${nome(c, 'pet')} quase não come há dias e passa o tempo deitado no canto. Os adultos falam em veterinário.`,
    opcoes: [
      { id: 'cuidar', texto: 'Ficar junto e ajudar a cuidar', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `Você dormiu duas noites no chão, perto de ${nome(c, 'pet')}. Aprendeu a dar o remédio escondido na comida.`, memoria: `Cuidou de ${nome(c, 'pet')} na doença.`, efeito: () => { prox(c, 'pet', 10); estresse(c, 2); } }) },
      { id: 'perguntar', texto: 'Perguntar se vai melhorar', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'A resposta foi "talvez". Foi a primeira vez que você ouviu um talvez de verdade.', memoria: null, efeito: () => estresse(c, 2) }) }
    ]
  }
];
