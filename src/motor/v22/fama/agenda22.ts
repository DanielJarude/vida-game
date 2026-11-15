/**
 * VIDA 22 · A AGENDA PÚBLICA — os convites que a fama traz, lidos da trajetória (não botões genéricos repetidos).
 *
 * O QUE CHEGA    a cada ano, um punhado de convites (nenhum para quem o público não conhece; um ou dois para o nome
 *                local; quatro ou cinco para quem é muito famoso), escolhidos pelo que a pessoa É: a origem do nome
 *                (`reconhecimento13.origensDaFama13` — esporte, música, arte, negócios, política, redes, um feito), o
 *                tamanho dele, a imagem (admiração × rejeição) e o que aconteceu há pouco (o título, a obra que marcou,
 *                a eleição — `marcosDaFama13`). O atleta recebe a mesa-redonda do programa esportivo e a coletiva
 *                depois da conquista; a cantora, a apresentação especial e a rádio; o empresário, o fórum de negócios e
 *                a inauguração; o político, o debate e a cerimônia; quem vive das redes, a publi e o encontro com
 *                seguidores. A premiação só vem com uma conquista recente; a marca não chama quem está malvisto.
 *                Cada convite tem quem convida (um programa, uma revista, um podcast, um festival — nomes genéricos,
 *                nunca de veículos reais) e o que pede.
 *
 * O QUE ACONTECE aceitar tem resultado incerto (o tamanho do nome, a imagem, o estresse, a sociabilidade — e o dia):
 *                o nome cresce ou não, a imagem melhora (`fatos.vis_boa`) ou uma frase pega mal (`vis_polemica`, que a
 *                imagem pública já lê), o cachê entra pelo caminho de sempre da fama (`receberDaFama13`: conta, extrato,
 *                "o que a fama pagou"), e o que é da carreira vai para ela (o público da obra, a reputação e a
 *                freguesia do negócio, o apoio e a reputação política). Um programa grande que deu certo abre a porta do
 *                próximo (o talk show depois do auditório); a gafe fecha as marcas por um tempo. Recusar não custa nada
 *                — às vezes custa a relação com quem convidou (o convite não volta naquele ano).
 *
 * O MUNDO REAGE  "Na imprensa e nas ruas" junta o que se disse do nome no ano: as entrevistas e aparições que
 *                aconteceram, os marcos (com a frase do registro), e as reações proporcionais ao tamanho do nome — o
 *                pedido de foto na padaria (local), o grupo que reconhece no aeroporto (famoso), o fotógrafo na porta
 *                (muito famoso). Nada disso é inventado: sai do que está registrado na vida.
 *
 * Sorteios: `rngDe(v.id, 'agenda22', ano, ...)` — nada aqui mexe no gerador principal. Nada é processado no ano: os
 * convites são lidos na hora (determinísticos para a vida e o ano); só o que se respondeu fica guardado.
 */
import type { Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { faixaDaNotoriedade } from '../../sistemas/notoriedade';
import { imagemDaFama13, marcosDaFama13, origensDaFama13, receberDaFama13, valorDaCampanha13, type OrigemDaFama13 } from '../../sistemas/reconhecimento13';
import { negocioAtivo } from '../../sistemas/negocio';
import { naPolitica } from '../../sistemas/politica';
import { desgastar } from '../../sistemas/desgastePolitico';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';

export interface Agenda22 {
  /** O que se respondeu: o id do convite (estável no ano), o ano, aceitou ou não e o tom do resultado. */
  feitos: { id: string; tpl: string; ano: number; aceitou: boolean; tom?: 'bom' | 'ruim' | 'neutro'; texto?: string }[];
}

type Origem = OrigemDaFama13 | 'qualquer';
interface Modelo22 {
  id: string;
  /** O que o convite é ("Participar da mesa-redonda de {de}"). */
  rotulo: string;
  /** Quem convida (sorteado da lista; nomes genéricos). */
  de: string[];
  origens: Origem[];
  /** Notoriedade mínima. */
  min: number;
  /** O que o convite pede de quem vai (o tempo, a viagem, a exposição). */
  pede: string;
  /** O que pode trazer (antes de aceitar: o jogador decide sabendo o que está em jogo). */
  traz: string;
  /** Requisito a mais (a conquista recente, o negócio aberto, a vida política). */
  exige?: (v: Vida) => boolean;
  /** Cachê (fração da campanha do nome: `valorDaCampanha13`). */
  cache?: number;
  /** Risco de gafe (0..1, sobre a base). */
  risco?: number;
  /** Quanto pesa no nome (+ quando dá certo). */
  nome: number;
  /** O que vai para a carreira quando dá certo. */
  carreira?: 'arte' | 'negocio' | 'politica';
  /** Pede imagem boa (a marca e o evento exclusivo não chamam quem está malvisto). */
  imagemBoa?: boolean;
  /** Abre a porta deste outro no ano seguinte, quando dá certo. */
  abre?: string;
  /** Só vem se este outro deu certo antes. */
  depoisDe?: string;
  texto: { bom: string[]; neutro: string[]; ruim: string[] };
}

const recente = (v: Vida, tipos: string[], anos = 2) => marcosDaFama13(v).some(m => tipos.includes(m.tipo) && v.t - m.t <= anos * 12);
const deuCerto = (v: Vida, tpl: string) => (v.fama22?.feitos ?? []).some(f => f.tpl === tpl && f.aceitou && f.tom === 'bom');

export const MODELOS22: Modelo22[] = [
  // ------------------------------------------------------------------ para qualquer nome conhecido
  { id: 'jornal', rotulo: 'Dar uma entrevista longa para {de}', de: ['o jornal da capital', 'um portal de notícias', 'o caderno de domingo do jornal'], origens: ['qualquer'], min: 22, nome: 2, risco: 0.12,
    pede: 'uma tarde de conversa e uma sessão de fotos', traz: 'o nome em destaque; uma frase mal colocada pode virar manchete',
    texto: { bom: ['A entrevista saiu com foto grande e um título que você teria escolhido.', 'O texto foi justo — e foi muito compartilhado.'], neutro: ['A matéria saiu num canto de página. Quem leu, gostou.'], ruim: ['Uma frase sua virou o título — fora do contexto, e o contexto não voltou.'] } },
  { id: 'podcast', rotulo: 'Ir ao {de}', de: ['podcast de entrevistas mais ouvido do país', 'videocast de conversa longa', 'podcast de histórias de vida'], origens: ['qualquer'], min: 28, nome: 3, risco: 0.16,
    pede: 'três horas de conversa sem roteiro', traz: 'gente nova conhecendo a sua história; três horas é muito tempo para não escorregar',
    texto: { bom: ['Três horas que passaram rápido. Um trecho rodou as redes do jeito bom.', 'A conversa ficou entre os episódios mais vistos do mês.'], neutro: ['Uma boa conversa, que pouca gente viu inteira.'], ruim: ['Um corte de quarenta segundos, sem o resto da frase, virou assunto por uma semana.'] } },
  { id: 'aparicao', rotulo: 'Comparecer à {de}', de: ['inauguração de um shopping', 'reabertura do teatro da cidade', 'abertura de uma feira'], origens: ['qualquer'], min: 25, nome: 1, cache: 0.15,
    pede: 'uma tarde de fotos e apertos de mão', traz: 'um cachê de presença e fotos no jornal local',
    texto: { bom: ['Fotos, apertos de mão, um cachê de presença — e uma foto sua que saiu bonita.'], neutro: ['Muita foto, pouca conversa. O cachê pagou o cansaço.'], ruim: ['O evento atrasou duas horas e a foto que saiu foi a da sua cara de cansaço.'] } },
  { id: 'beneficente', rotulo: 'Apoiar {de}', de: ['o leilão beneficente de um hospital infantil', 'o jantar de uma ONG de educação', 'a campanha do agasalho da cidade'], origens: ['qualquer'], min: 25, nome: 1, risco: 0.04,
    pede: 'uma noite e o nome no material da campanha', traz: 'imagem: quem admira você presta atenção; a causa ganha visibilidade',
    texto: { bom: ['O leilão bateu a meta. Quem organizava escreveu agradecendo — e o público viu.', 'A campanha cresceu com o seu nome nela.'], neutro: ['Uma noite boa, sem barulho. A causa agradeceu.'], ruim: ['Disseram que era marketing pessoal. Doeu, e não era.'] } },
  { id: 'fas', rotulo: 'Fazer um encontro com fãs em {de}', de: ['uma livraria do centro', 'um shopping', 'o ginásio da cidade'], origens: ['qualquer'], min: 40, nome: 2,
    pede: 'uma tarde inteira de fotos, abraços e histórias', traz: 'proximidade com quem gosta de você; cansaço',
    texto: { bom: ['A fila dobrou o quarteirão. Uma senhora contou como você ajudou numa fase difícil dela.', 'Três horas de fotos, abraços — e uma carta que você guardou.'], neutro: ['Menos gente do que o esperado, mas quem foi não esquece.'], ruim: ['Faltou organização: empurra-empurra na fila e reclamação nas redes.'] } },
  { id: 'autografos', rotulo: 'Fazer uma sessão de autógrafos em {de}', de: ['uma livraria grande', 'uma bienal', 'a loja oficial do clube'], origens: ['esportiva', 'artistica', 'musical'], min: 35, nome: 2, cache: 0.1,
    pede: 'uma tarde de canetas e fotos', traz: 'fãs perto; um cachê pequeno',
    texto: { bom: ['Quatrocentas dedicatórias. A mão doeu; valeu cada uma.'], neutro: ['Uma tarde tranquila de autógrafos e conversa.'], ruim: ['A sessão atrasou e metade da fila foi embora reclamando.'] } },
  { id: 'auditorio', rotulo: 'Participar do {de}', de: ['programa de auditório de domingo', 'programa de variedades da tarde', 'quadro de entrevistas do programa de sábado'], origens: ['qualquer'], min: 45, nome: 4, risco: 0.12, cache: 0.2, abre: 'talkshow',
    pede: 'um dia de gravação, ensaio e maquiagem', traz: 'milhões de pessoas vendo; a brincadeira do apresentador nem sempre ajuda',
    texto: { bom: ['O quadro foi o mais comentado do domingo. Gente na rua repetindo o que você disse.', 'Você riu, o auditório riu — e o país conheceu outro lado seu.'], neutro: ['Uma participação simpática, que passou sem muito barulho.'], ruim: ['A pegadinha do apresentador pegou mal — e foi você quem ficou com o constrangimento.'] } },
  { id: 'talkshow', rotulo: 'Ser entrevistado no {de}', de: ['talk show da madrugada', 'programa de entrevistas mais visto da TV', 'sofá do programa de fim de noite'], origens: ['qualquer'], min: 55, nome: 4, risco: 0.14, depoisDe: 'auditorio',
    pede: 'uma noite no sofá mais visto do país', traz: 'o nome no assunto do dia seguinte; o apresentador sabe onde apertar',
    texto: { bom: ['A entrevista virou trecho em todo lugar no dia seguinte. A sua resposta sobre o começo emocionou.'], neutro: ['Uma boa entrevista, sem momento marcante.'], ruim: ['O apresentador trouxe um assunto antigo; você travou ao vivo.'] } },
  { id: 'premiacao', rotulo: 'Ir à {de} (você está entre os indicados)', de: ['cerimônia de premiação do ano', 'festa de premiação da categoria', 'noite de gala do prêmio nacional'], origens: ['qualquer'], min: 40, nome: 3, exige: v => recente(v, ['conquista', 'obra', 'feito', 'eleicao']),
    pede: 'uma noite de gala, roupa à altura e um discurso no bolso', traz: 'a chance de levar o prêmio; o discurso fica gravado',
    texto: { bom: ['Você ganhou. O discurso curto, com o nome de quem ajudou no começo, rodou o país.', 'Levou o prêmio da categoria — e a foto no palco virou a capa da semana.'], neutro: ['Não ganhou, mas a foto no tapete vermelho saiu em todo lugar.'], ruim: ['Não ganhou, e a câmera pegou a sua cara na hora do anúncio.'] } },
  { id: 'homenagem', rotulo: 'Receber {de}', de: ['o título de cidadão honorário da câmara municipal', 'uma homenagem da escola onde estudou', 'a medalha de mérito da cidade natal'], origens: ['qualquer'], min: 45, nome: 1, exige: v => idade(v) >= 30,
    pede: 'uma cerimônia e um discurso', traz: 'reconhecimento de onde você veio',
    texto: { bom: ['A professora do primário estava na primeira fila. Você não conseguiu terminar o discurso sem chorar.'], neutro: ['Uma cerimônia bonita e protocolar.'], ruim: ['Um grupo protestou na porta da cerimônia contra a homenagem.'] } },
  { id: 'gala', rotulo: 'Ir a {de}', de: ['um jantar de gala em um hotel cinco estrelas', 'a festa exclusiva de uma grife', 'a estreia fechada para convidados'], origens: ['qualquer'], min: 55, nome: 1, imagemBoa: true, risco: 0.06,
    pede: 'uma noite, a roupa e a disposição para conversar com estranhos importantes', traz: 'contatos e fotos nas colunas sociais',
    texto: { bom: ['Uma conversa no canto da festa virou convite para outro projeto.', 'A foto na coluna social saiu com a roupa certa.'], neutro: ['Muito brilho, pouca conversa de verdade.'], ruim: ['Uma foto tirada na hora errada, com a pessoa errada, rendeu fofoca.'] } },
  { id: 'campanha', rotulo: 'Estrelar uma campanha publicitária de {de}', de: ['uma rede de supermercados', 'um banco digital', 'uma marca de refrigerantes', 'uma operadora de telefonia'], origens: ['esportiva', 'artistica', 'musical', 'digital', 'feito'], min: 35, nome: 2, cache: 1, imagemBoa: true, abre: 'embaixador',
    pede: 'dois dias de estúdio e o rosto em outdoor por meses', traz: `um cachê de campanha; o rosto associado à marca`,
    texto: { bom: ['A campanha pegou: o bordão do comercial virou piada boa no país.', 'Dois dias de estúdio, um cachê de campanha e o rosto em todo ponto de ônibus.'], neutro: ['Um comercial correto. O cachê entrou.'], ruim: ['A campanha foi criticada — e o seu rosto estava nela.'] } },
  { id: 'embaixador', rotulo: 'Ser embaixador da marca {de} por um ano', de: ['de roupas esportivas', 'de relógios', 'de cosméticos', 'de carros'], origens: ['esportiva', 'artistica', 'musical', 'digital', 'empresarial'], min: 58, nome: 2, cache: 2.4, imagemBoa: true, depoisDe: 'campanha',
    pede: 'eventos da marca o ano todo e exclusividade no segmento', traz: 'o maior cachê da fama; o nome preso à marca',
    texto: { bom: ['Um ano de eventos, coleção com o seu nome — e o contrato renovável.'], neutro: ['Um contrato bom, cumprido sem brilho.'], ruim: ['A marca se envolveu num escândalo no meio do contrato, e a pergunta era para você.'] } },
  // ------------------------------------------------------------------ pela origem do nome
  { id: 'mesa_esportiva', rotulo: 'Participar da mesa-redonda do {de}', de: ['programa esportivo de domingo à noite', 'canal de esportes', 'programa de rádio esportiva'], origens: ['esportiva'], min: 30, nome: 2, risco: 0.14,
    pede: 'uma noite de debate ao vivo', traz: 'a opinião de quem jogou; o comentário sobre o ex-clube pode pegar mal',
    texto: { bom: ['A análise do lance polêmico foi a mais citada no dia seguinte.'], neutro: ['Um debate animado, como sempre.'], ruim: ['Um comentário sobre o rival virou briga de torcida nas redes.'] } },
  { id: 'coletiva', rotulo: 'Dar a entrevista coletiva {de}', de: ['depois da conquista', 'da apresentação no novo projeto', 'do anúncio da temporada'], origens: ['esportiva', 'politica'], min: 30, nome: 2, risco: 0.18, exige: v => recente(v, ['conquista', 'eleicao', 'feito'], 1),
    pede: 'uma sala cheia de microfones e perguntas sem combinação', traz: 'o assunto do dia é você; a pergunta difícil vem',
    texto: { bom: ['Respondeu com calma e graça; uma frase sua virou manchete boa.'], neutro: ['Respostas protocolares, coletiva curta.'], ruim: ['Perdeu a paciência com um repórter — e o vídeo correu.'] } },
  { id: 'clinica', rotulo: 'Dar uma clínica esportiva em {de}', de: ['uma escolinha da periferia', 'um projeto social de esporte', 'a base do clube da cidade'], origens: ['esportiva'], min: 25, nome: 1,
    pede: 'um sábado inteiro de treino com crianças', traz: 'imagem e o carinho de quem começa',
    texto: { bom: ['Duzentas crianças, uma bola cada. Um menino tímido acertou o chute e correu para abraçar você.'], neutro: ['Um sábado bom de treino.'], ruim: ['Choveu, o evento esvaziou e a organização se desculpou pelo atraso.'] } },
  { id: 'show_especial', rotulo: 'Fazer uma apresentação especial em {de}', de: ['um festival de música', 'a virada cultural', 'o especial de fim de ano da TV'], origens: ['musical'], min: 30, nome: 3, cache: 0.5, carreira: 'arte', risco: 0.08,
    pede: 'ensaios e uma noite no palco grande', traz: 'público novo para a sua música; um cachê de palco',
    texto: { bom: ['O público cantou junto do começo ao fim. O vídeo da apresentação passou de um milhão.'], neutro: ['Um bom show, para um público que estava ali por outro artista.'], ruim: ['O som falhou na sua parte. Não foi culpa sua; foi o seu nome no vídeo.'] } },
  { id: 'radio', rotulo: 'Ir ao {de} falar do trabalho novo', de: ['programa da manhã da rádio mais ouvida', 'programa musical da rádio pública', 'estúdio ao vivo de uma rádio jovem'], origens: ['musical'], min: 22, nome: 2, carreira: 'arte',
    pede: 'uma manhã e um violão', traz: 'a música tocando mais; pouca exposição de risco',
    texto: { bom: ['Tocou ao vivo; a rádio passou a música na programação.'], neutro: ['Uma boa conversa, numa manhã comum.'], ruim: ['O locutor errou o seu nome duas vezes. Ninguém riu.'] } },
  { id: 'estreia', rotulo: 'Ir à estreia no {de}', de: ['festival de cinema', 'tapete vermelho da pré-estreia', 'festival de teatro'], origens: ['artistica'], min: 30, nome: 2, carreira: 'arte', risco: 0.06,
    pede: 'uma noite de tapete vermelho e entrevistas rápidas', traz: 'o trabalho em destaque; fotos em todo lugar',
    texto: { bom: ['A crítica falou bem — e citou você pelo nome.'], neutro: ['Uma estreia bonita, que passou rápido.'], ruim: ['A crítica foi dura com o trabalho; a sua foto ilustrava a resenha.'] } },
  { id: 'forum', rotulo: 'Palestrar no {de}', de: ['fórum de negócios da capital', 'congresso do setor', 'encontro de empreendedores'], origens: ['empresarial'], min: 25, nome: 2, cache: 0.3, carreira: 'negocio', risco: 0.06,
    pede: 'uma palestra de quarenta minutos e o painel depois', traz: 'reputação no mercado e contatos; um cachê de palestra',
    texto: { bom: ['A palestra lotou a sala; três pessoas pediram reunião depois.'], neutro: ['Uma boa palestra para uma plateia distraída com o celular.'], ruim: ['Um número errado no slide foi parar numa coluna de economia.'] } },
  { id: 'economica', rotulo: 'Dar uma entrevista para {de}', de: ['a revista de negócios mais lida', 'o programa de economia da TV', 'o caderno de economia do jornal'], origens: ['empresarial'], min: 30, nome: 2, carreira: 'negocio', risco: 0.1,
    pede: 'uma conversa sobre números e futuro', traz: 'o negócio conhecido por mais gente; uma previsão errada fica registrada',
    texto: { bom: ['A capa da revista trouxe a sua empresa como exemplo.'], neutro: ['Uma entrevista técnica, lida por quem é do ramo.'], ruim: ['Uma resposta sobre os funcionários pegou mal.'] } },
  { id: 'inauguracao', rotulo: 'Fazer a inauguração {de}', de: ['da nova unidade com festa aberta', 'da reforma da loja com imprensa', 'do lançamento do produto novo'], origens: ['empresarial'], min: 25, nome: 1, carreira: 'negocio', exige: v => !!negocioAtivo(v) || (v.financas.empresas ?? []).some(e => e.estado !== 'encerrada'),
    pede: 'um dia de festa e o dinheiro da festa', traz: 'freguesia nova e o nome do negócio no jornal',
    texto: { bom: ['Fila na porta na inauguração; o movimento das semanas seguintes confirmou.'], neutro: ['Uma festa boa, para os conhecidos de sempre.'], ruim: ['Choveu, a festa esvaziou e a foto no jornal foi a da loja vazia.'] } },
  { id: 'debate', rotulo: 'Participar do {de}', de: ['debate da TV', 'debate da rádio', 'debate promovido pela universidade'], origens: ['politica'], min: 20, nome: 3, carreira: 'politica', risco: 0.22, exige: v => naPolitica(v),
    pede: 'preparação e uma noite ao vivo contra adversários', traz: 'presença política e apoio; o tropeço fica gravado',
    texto: { bom: ['Você ganhou o debate na opinião de quem assistiu — e a frase final virou bordão.'], neutro: ['Um empate morno.'], ruim: ['Uma pergunta sobre o passado desmontou a sua resposta ao vivo.'] } },
  { id: 'cerimonia', rotulo: 'Representar a cidade {de}', de: ['na cerimônia de aniversário do município', 'no desfile cívico', 'na entrega de uma obra pública'], origens: ['politica'], min: 20, nome: 1, carreira: 'politica', exige: v => naPolitica(v),
    pede: 'uma manhã de protocolo', traz: 'presença e um pouco de apoio',
    texto: { bom: ['O discurso curto agradou; o povo aplaudiu de verdade.'], neutro: ['Protocolo cumprido.'], ruim: ['Uma vaia de um grupo organizado abafou o seu discurso.'] } },
  { id: 'publi', rotulo: 'Fazer uma publicidade paga para {de}', de: ['uma marca de cosméticos', 'um aplicativo de entregas', 'uma loja de roupas', 'um site de apostas'], origens: ['digital'], min: 25, nome: 1, cache: 0.5, risco: 0.12, imagemBoa: true,
    pede: 'três vídeos e a marca no seu perfil', traz: 'um cachê; seguidores não gostam de publi demais',
    texto: { bom: ['A publi rendeu: a marca renovou e os seguidores nem reclamaram.'], neutro: ['Uma publi como outra qualquer.'], ruim: ['Os seguidores acharam forçado. Os comentários foram cruéis.'] } },
  { id: 'seguidores', rotulo: 'Fazer um encontro com seguidores em {de}', de: ['um parque da cidade', 'um evento de criadores de conteúdo', 'uma convenção de cultura pop'], origens: ['digital'], min: 30, nome: 2,
    pede: 'um dia ao vivo, longe da tela', traz: 'proximidade com quem acompanha; conteúdo para meses',
    texto: { bom: ['Gente que viajou horas para estar ali. O vídeo do encontro foi o mais visto do ano.'], neutro: ['Um encontro simpático.'], ruim: ['A segurança falhou e o evento terminou antes da hora.'] } }
];

/* ------------------------------------------------------------------ o que chega neste ano */

export interface Convite22 { id: string; tpl: string; rotulo: string; de: string; pede: string; traz: string; cache?: number; porque: string }

const ROTULO_ORIGEM22: Record<string, string> = { esportiva: 'pelo esporte', artistica: 'pela arte', musical: 'pela música', empresarial: 'pelos negócios', politica: 'pela política', digital: 'pelas redes', feito: 'pelo feito', controversia: 'pela polêmica' };

/** Quantos convites cabem no tamanho do nome (anônimo: nenhum). */
const quantos = (nivel: number) => [0, 2, 3, 4, 5][nivel] ?? 0;

/** Os convites deste ano (lidos na hora; sem os que já foram respondidos). */
export function convites22(v: Vida): Convite22[] {
  if (idade(v) < 16 || v.justica?.prisao) return [];
  const noto = v.notoriedade?.valor ?? 0;
  const nivel = faixaDaNotoriedade(noto);
  const n = quantos(nivel);
  if (!n) return [];
  const ano = anoDe(v.t);
  const origens = origensDaFama13(v).map(o => o.origem);
  const im = imagemDaFama13(v);
  const malvisto = !!im && (im.palavra === 'rejeitada' || im.palavra === 'malvista');
  const gafeRecente = v.fatos['vis_polemica'] !== undefined && v.t - v.fatos['vis_polemica'] < 18;
  const elegiveis = MODELOS22.filter(m => noto >= m.min
    && (m.origens.includes('qualquer') || m.origens.some(o => origens.includes(o as OrigemDaFama13)))
    && (!m.exige || m.exige(v))
    && (!m.imagemBoa || (!malvisto && !gafeRecente))
    && (!m.depoisDe || deuCerto(v, m.depoisDe)));
  const r = rngDe(v.id, 'agenda22', ano);
  // A origem do nome pesa: os convites da origem principal primeiro; os universais completam.
  const peso = (m: Modelo22) => (m.origens.includes('qualquer') ? 1 : m.origens.includes(origens[0] as Origem) ? 3 : 1.6) * (m.depoisDe ? 2 : 1) * (m.exige ? 1.8 : 1);
  const lista = elegiveis.map(m => ({ m, k: r.next() / peso(m) })).sort((a, b) => a.k - b.k).slice(0, n).map(x => x.m);
  const respondidos = new Set((v.fama22?.feitos ?? []).filter(f => f.ano === ano).map(f => f.id));
  return lista.map(m => {
    const rr = rngDe(v.id, 'agenda22', ano, m.id);
    const de = m.de[Math.floor(rr.next() * m.de.length)];
    const id = `${ano}:${m.id}`;
    const origem = m.origens.find(o => o !== 'qualquer' && origens.includes(o as OrigemDaFama13));
    const porque = m.depoisDe ? 'porque a última aparição na TV deu certo' : m.exige && m.id === 'premiacao' ? 'pela conquista recente' : origem ? `${ROTULO_ORIGEM22[origem]}` : 'porque o público conhece o seu nome';
    return { id, tpl: m.id, rotulo: m.rotulo.replace('{de}', de), de, pede: m.pede, traz: m.traz, cache: m.cache ? Math.max(0, Math.round(valorDaCampanha13(v, m.cache) / 100) * 100) || undefined : undefined, porque };
  }).filter(c => !respondidos.has(c.id));
}

export function disponibilidadeAgenda22(v: Vida, _oque: 'aceitar' | 'recusar', id: string): Veredito {
  if (idade(v) < 16) return bloqueio('impossivel', 'Ainda não.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  if (!convites22(v).some(c => c.id === id)) return bloqueio('impossivel', 'Esse convite não está mais de pé.');
  return PERMITIDO;
}

/** Aceitar ou recusar um convite. Devolve o texto do que aconteceu. */
export function responderConvite22(v: Vida, oque: 'aceitar' | 'recusar', id: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro'; titulo: string } {
  const c = convites22(v).find(x => x.id === id)!;
  const m = MODELOS22.find(x => x.id === c.tpl)!;
  const ano = anoDe(v.t);
  const a = (v.fama22 ??= { feitos: [] });
  if (oque === 'recusar') {
    a.feitos.push({ id, tpl: m.id, ano, aceitou: false });
    return { texto: `Você agradeceu e recusou. ${c.de.charAt(0).toUpperCase() + c.de.slice(1)} vai chamar outra pessoa este ano.`, tom: 'neutro', titulo: 'Convite recusado' };
  }
  const r = rngDe(v.id, 'agenda22', ano, m.id, 'resultado');
  const noto = v.notoriedade?.valor ?? 0;
  const im = imagemDaFama13(v);
  const imagem = im ? (im.admiracao - im.rejeicao) / 200 : 0;
  const social = (v.personalidade.tracos.sociabilidade - 50) / 250;
  const cabeca = -(v.mente.estresse - 50) / 300;
  const x = r.next();
  const pRuim = clamp((m.risco ?? 0.05) - imagem * 0.3 - social * 0.2 - cabeca * 0.3, 0.02, 0.45);
  const pBom = clamp(0.45 + (noto - m.min) / 200 + imagem + social + cabeca, 0.2, 0.8);
  const tom: 'bom' | 'ruim' | 'neutro' = x < pRuim ? 'ruim' : x < pRuim + pBom ? 'bom' : 'neutro';
  const textos = m.texto[tom];
  const texto = textos[Math.floor(r.next() * textos.length)];
  const nt = (v.notoriedade ??= { valor: 0, pico: 0, t: v.t });
  const partes: string[] = [texto];
  // O nome, a imagem, a cabeça.
  if (tom === 'bom') { nt.valor = clamp(nt.valor + m.nome); v.fatos['vis_boa'] = v.t; v.mente.felicidade = clamp(v.mente.felicidade + 3); }
  else if (tom === 'neutro') nt.valor = clamp(nt.valor + Math.max(0, m.nome - 2));
  else { v.fatos['vis_polemica'] = v.t; v.mente.estresse = clamp(v.mente.estresse + 5); }
  nt.pico = Math.max(nt.pico, nt.valor);
  v.mente.estresse = clamp(v.mente.estresse + 2);
  // O cachê, pelo caminho de sempre da fama (conta, extrato, "pago pela fama").
  if (c.cache && tom !== 'ruim') { receberDaFama13(v, c.cache, `Fama: ${m.rotulo.split(' {')[0].replace(/^./, s => s.toLowerCase())}`); partes.push(`Cachê: ${fmt(c.cache)}.`); }
  else if (c.cache && tom === 'ruim' && m.id !== 'campanha' && m.id !== 'embaixador') { receberDaFama13(v, c.cache, `Fama: ${m.rotulo.split(' {')[0].replace(/^./, s => s.toLowerCase())}`); partes.push(`O cachê veio igual (${fmt(c.cache)}).`); }
  else if (c.cache && tom === 'ruim') { const metade = Math.round(c.cache / 2 / 100) * 100; receberDaFama13(v, metade, 'Fama: campanha (reduzida)'); partes.push(`A marca pagou só metade do combinado (${fmt(metade)}).`); }
  // A carreira.
  if (m.carreira === 'arte' && v.caminhos.arte?.ativo && tom !== 'ruim') { v.caminhos.arte.publico = clamp(v.caminhos.arte.publico + (tom === 'bom' ? 4 : 1)); partes.push(`Gente nova chegou ao trabalho de ${v.caminhos.arte.nome}.`); }
  if (m.carreira === 'negocio') { const neg = negocioAtivo(v); if (neg && tom !== 'ruim') { neg.reputacao = clamp((neg.reputacao ?? 30) + (tom === 'bom' ? 4 : 1)); neg.clientela = clamp(neg.clientela + (tom === 'bom' ? 3 : 0)); partes.push(`${neg.nome} ficou mais conhecido.`); } }
  if (m.carreira === 'politica' && v.caminhos.politica) { const p = v.caminhos.politica; if (tom === 'bom') { p.apoio = clamp(p.apoio + 3); p.reputacao = clamp(p.reputacao + 3); partes.push('O apoio cresceu.'); } else if (tom === 'ruim') desgastar(p, 4, 'exposicao'); }
  if (m.abre && tom === 'bom') partes.push('Quem viu ficou de olho: outros convites podem vir.');
  a.feitos.push({ id, tpl: m.id, ano, aceitou: true, tom, texto });
  if (a.feitos.length > 60) a.feitos.splice(0, a.feitos.length - 60);
  escrever(v, { texto: tom === 'ruim' ? `${c.rotulo.replace(/^./, s => s.toUpperCase())}: ${texto.charAt(0).toLowerCase()}${texto.slice(1)}` : `${c.rotulo.replace(/^./, s => s.toUpperCase())}.`, relevancia: m.nome >= 3 || tom === 'ruim' ? 'biografia' : 'cotidiano', tema: 'trabalho', tom });
  return { texto: partes.join(' '), tom, titulo: c.rotulo.replace(/^./, s => s.toUpperCase()) };
}

/* ------------------------------------------------------------------ o mundo reage: imprensa e ruas */

export interface Nota22 { tipo: 'imprensa' | 'rua' | 'marco'; texto: string; tom?: 'bom' | 'ruim' | 'neutro' }

const RUAS: Record<number, string[]> = {
  1: ['Na padaria, a moça do caixa perguntou se era você mesmo.', 'Um vizinho pediu uma foto para mandar para o filho.'],
  2: ['No aeroporto, um grupo reconheceu você e pediu uma foto juntos.', 'No restaurante, a mesa do lado mandou um bilhete pelo garçom.', 'No supermercado, um senhor contou que acompanha a sua carreira.'],
  3: ['Saiu para jantar e foi parado cinco vezes até chegar à mesa.', 'Uma foto sua comprando pão foi parar num perfil de fofoca.', 'Fãs esperaram na porta do hotel até tarde da noite.'],
  4: ['Um fotógrafo passou a semana na frente do seu prédio.', 'Ir ao cinema virou operação: entrada pelos fundos e sessão vazia.', 'O seu nome nos assuntos mais comentados — sem você ter feito nada.']
};

/** O que se disse do nome neste ano: as aparições respondidas, os marcos do ano e as reações nas ruas (proporcionais ao nome). */
export function imprensaDoAno22(v: Vida): Nota22[] {
  const ano = anoDe(v.t);
  const nivel = faixaDaNotoriedade(v.notoriedade?.valor ?? 0);
  if (!nivel) return [];
  const out: Nota22[] = [];
  for (const f of (v.fama22?.feitos ?? []).filter(x => x.ano === ano && x.aceitou)) {
    const m = MODELOS22.find(x => x.id === f.tpl);
    if (m && f.texto) out.push({ tipo: 'imprensa', texto: f.texto, tom: f.tom });
  }
  for (const m of marcosDaFama13(v).filter(x => anoDe(x.t) === ano && x.tipo !== 'causa').slice(-3)) out.push({ tipo: 'marco', texto: m.texto.replace(/ \(\d{4}\)$/, ''), tom: m.peso < 0 ? 'ruim' : 'bom' });
  const r = rngDe(v.id, 'ruas22', ano);
  const frases = RUAS[nivel] ?? [];
  const k = Math.floor(r.next() * frases.length);
  if (frases.length) out.push({ tipo: 'rua', texto: frases[k] });
  if (nivel >= 3 && frases.length > 1) out.push({ tipo: 'rua', texto: frases[(k + 1) % frases.length] });
  return out;
}
