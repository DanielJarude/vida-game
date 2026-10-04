/**
 * Fazer junto (FIX pós-REWORK 4): "essa pessoa existe → há coisas que eu posso FAZER com ela".
 *
 * O playtest percebia que, no VIDA, quase tudo com as pessoas era FALA
 * (conversar, desabafar, perguntar, pedir desculpas). As falas continuam; aqui
 * entram programas concretos — cada um só para quem faz sentido (o tipo de
 * vínculo, a idade dos dois, a distância, o estado da relação, o dinheiro):
 *
 *   ir ao cinema · jantar fora · um show · um jogo no estádio · o parque com a
 *   criança · ensinar algo ao filho (andar de bicicleta, nadar, cozinhar,
 *   tocar, dirigir) · cozinhar junto · caminhar junto · um fim de semana fora ·
 *   a festa de aniversário · o jantar romântico.
 *
 * A reação não é garantida: depende da afinidade, do jeito da pessoa, de como
 * a relação anda — e da sorte (o filme ruim, a chuva no parque). O que se
 * repete vira costume (a história dos dois); o que é marco (ensinar o filho a
 * andar de bicicleta) vai para a Linha da Vida. As regras de sempre valem:
 * uma vez por ano cada coisa com cada pessoa, e o tempo com a mesma pessoa no
 * mesmo ano rende cada vez menos (`interacoes`).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Pessoa } from '../tipos';
import type { CtxI, Interacao } from './interacoes';
import { escrever, lembrarCom, marcarFato } from '../nucleo';
import { flex } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { pagar, vereditoDePagar } from './dinheiro';
import { habilidade, praticar } from './frentes';
import { compatibilidade } from './social';
import { ehDescendente } from './vinculos';
import { estadoDaRelacao } from './lacos';
import { viverCena, type ProgramaDeCena } from './microcenas';

/**
 * FIX pós-playtest humano: cada programa é também uma CENA (`microcenas`) — o que mora aqui é o lugar (o que se vê,
 * do que se discorda, o ponto alto e o ruim de cada um); o que acontece de fato é decidido lá, pelo contexto.
 */
const P: Record<string, ProgramaDeCena> = {
  cinema: { id: 'cinema', oque: 'o cinema', onde: 'no cinema', depois: 'na saída do cinema', pago: true,
    mico: ['{nome} riu alto na cena triste — a única risada da sala inteira.', 'A pipoca virou inteira no colo de quem estava na frente. Vocês assistiram o resto pedindo desculpas.'],
    comum: ['Pipoca dividida, um filme bom o bastante, e {nome} comentando os trailers como se fossem o filme.', 'Sessão das nove, sala meio vazia. Vocês escolheram o lugar do meio e ninguém atrapalhou.', 'O filme era longo; a conversa na fila do estacionamento, mais longa ainda.'],
    alto: n => `${n} saiu do cinema falando do filme — e falou até em casa. Vocês já marcaram o próximo.`,
    ruim: n => `${n} queria ver outro filme e passou a sessão no celular. Na saída, cada um foi para um lado.`,
    discordia: [['achou o final perfeito', 'achou o final preguiçoso'], ['torceu pelo vilão', 'não perdoou o vilão'], ['dormiu na metade e jura que não', 'viu cada minuto e conta tudo']] },
  jantar: { id: 'jantar', oque: 'o jantar', onde: 'no restaurante', depois: 'na sobremesa', pago: true,
    mico: ['{nome} chamou o garçom pelo nome errado três vezes. Vocês saíram rindo da vergonha.', 'A conta veio com o prato de outra mesa. Descobriram depois de pagar.'],
    comum: ['Um prato cada, um pedaço do seu para {nome} provar, e a conta dividida certinha.', 'O restaurante de sempre, a mesa de sempre — e o garçom já sabendo o pedido.', 'Comida boa, conversa boa, e a hora passou sem ninguém olhar o relógio.'],
    alto: n => `Um jantar que virou três horas de conversa. Fecharam o restaurante — o garçom empilhando as cadeiras em volta de você e ${n}.`,
    ruim: n => `A conta chegou e veio junto uma conversa atravessada. ${n} pagou a parte e foi embora antes do café.`,
    discordia: [['jura que o lugar de antes era melhor', 'defende o novo'], ['achou o prato salgado demais', 'achou perfeito']] },
  show: { id: 'show', oque: 'o show', onde: 'no show', depois: 'na volta do show', pago: true,
    mico: ['Você cantou o refrão errado, alto, no silêncio entre duas músicas.', '{nome} perdeu o celular no meio da multidão — e um estranho devolveu no fim do show.'],
    comum: ['Um show bom: a música que vocês esperavam veio no bis.', 'Lugar lotado, um copo derrubado no seu tênis, e uma noite boa mesmo assim.', '{nome} conhecia todas as letras; você, metade. Ninguém reparou.'],
    alto: n => `Vocês cantaram tudo, perderam a voz e voltaram de madrugada. ${n} guardou o ingresso.`,
    ruim: n => `${n} odiou a banda e não fez questão de esconder. A noite acabou cedo.`,
    discordia: [['achou que a banda envelheceu mal', 'achou o melhor show da vida'], ['queria ficar na frente do palco', 'queria ficar no fundo, perto da saída']] },
  estadio: { id: 'estadio', oque: 'o jogo', onde: 'no estádio', depois: 'na saída do estádio', pago: true,
    mico: ['Você comemorou o gol do outro time, no meio da torcida errada.', 'O cachorro-quente caiu na arquibancada de baixo. Pediram desculpas por dois tempos.'],
    comum: ['Arquibancada, o grito da torcida e um empate com gosto de nada. O cachorro-quente valeu.', 'O time jogou mal, a torcida cantou bem. Vocês voltaram rouco.', 'Um jogo morno; o que ficou foi a conversa no intervalo.'],
    alto: n => `O time virou no último minuto. ${n} pulou no seu pescoço — e vocês saíram abraçados com estranhos.`,
    ruim: n => `Derrota, chuva e trânsito na volta. ${n} não falou nada no caminho.`,
    discordia: [['culpa o técnico', 'culpa o juiz'], ['quer o atacante no banco', 'acha que o atacante é a única esperança']] },
  parque: { id: 'parque', oque: 'o parque', onde: 'no parque', depois: 'na volta do parque', infantil: true,
    comum: ['Balanço, escorregador, sorvete derretendo na mão. {nome} dormiu no caminho de volta.', '{nome} fez amizade com outra criança em dez minutos e esqueceu que você existia.', 'Uma tarde inteira atrás de {nome} no parque. Valeu o cansaço.'],
    alto: n => `${n} descobriu o escorregador grande e quis descer quarenta vezes. Na trigésima, você desceu junto.`,
    ruim: n => `Choveu no meio da tarde. Voltaram correndo, ${n} reclamando de tudo.` },
  cozinhar: { id: 'cozinhar', oque: 'a cozinha', onde: 'na cozinha', depois: 'com a louça na pia', infantil: true,
    comum: ['A receita da avó, com {nome} errando a medida e acertando o resto.', 'Farinha até no teto, e o melhor bolo do mês.', 'Vocês inventaram um prato que ainda não tem nome. Ficou bom.'],
    alto: n => `Ficou tão bom que ${n} tirou foto antes de comer — e pediu para fazerem de novo no domingo.`,
    ruim: () => 'Queimou. Vocês discutiram sobre de quem foi a culpa — e pediram uma pizza.',
    discordia: [['acha que leva alho', 'acha que alho estraga'], ['quer seguir a receita', 'quer inventar']] },
  caminhar: { id: 'caminhar', oque: 'a caminhada', onde: 'na caminhada', depois: 'no fim da caminhada',
    mico: ['Um cachorro resolveu acompanhar vocês o caminho todo. {nome} já tinha dado nome a ele na volta.', 'Pegaram uma rua errada e andaram meia hora a mais. Ninguém admitiu a culpa.'],
    comum: ['Uma volta longa no fim da tarde. A conversa veio sozinha.', '{nome} puxou o ritmo. Você chegou sem fôlego e rindo.', 'Caminharam sem pressa, olhando as casas, sem precisar falar.'],
    alto: n => `Era para ser uma volta no quarteirão; viraram duas horas e um pôr do sol. ${n} disse que precisava daquilo.`,
    ruim: n => `${n} estava de mau humor; foram calados até o fim.` },
  fim_de_semana: { id: 'fim_de_semana', oque: 'o fim de semana', onde: 'na viagem curta', depois: 'na estrada de volta', pago: true,
    mico: ['A pousada da foto não era a pousada que existia. Riram disso a viagem inteira.', 'Esqueceram a mala de um dos dois em casa. Foram comprar escova de dente juntos.'],
    comum: ['Dois dias fora. Voltaram mais leves.', 'Uma pousada simples, café da manhã demorado, nada para fazer — e foi isso que fez bem.', 'Choveu um dia, fez sol no outro. Deu para tudo.'],
    alto: n => `Uma pousada simples, uma cachoeira, e a conversa que você e ${n} estavam devendo um ao outro.`,
    ruim: () => 'Dois dias juntos demais. Na volta, cada um com o seu fone.',
    discordia: [['queria acordar cedo e fazer trilha', 'queria dormir até tarde'], ['quer voltar no ano que vem', 'quer conhecer outro lugar']] },
  romantico: { id: 'romantico', oque: 'o jantar', onde: 'no restaurante', depois: 'na volta para casa', pago: true,
    mico: ['O garçom acendeu a vela e quase pôs fogo no cardápio. A noite virou piada — boa.', 'Você derramou o vinho na toalha. {nome} derramou o dele em solidariedade.'],
    comum: ['Um jantar bonito. Voltaram de mãos dadas.', 'A mesa do canto, a conversa sem pressa, e {nome} roubando a sua sobremesa.', 'Vinho da casa, prato do dia — e a sensação boa de ter parado o resto do mundo por uma noite.'],
    alto: n => `Vela na mesa, vinho que você não sabia pronunciar e ${n} olhando para você como no começo.`,
    ruim: () => 'Um assunto antigo voltou na sobremesa. O jantar acabou cedo.',
    discordia: [['quer viajar no fim do ano', 'quer guardar dinheiro'], ['acha que vocês trabalham demais', 'acha que é só uma fase']] }
};
/** O efeito-base do programa (`efeito`) + a cena: o texto e o título do popup saem da cena. */
const cena = (c: CtxI, foi: ReturnType<typeof comoFoi>, prog: ProgramaDeCena, n: number) => { const x = viverCena(c, foi, prog, n); return { resultado: x.texto, titulo: x.titulo }; };

const humano = (c: CtxI) => !c.p.especie;
const perto = (c: CtxI) => c.casa || !c.longe;
const romance = (c: CtxI) => c.papel === 'parceiro' || c.papel === 'saindo' || c.papel === 'caso';
const rompido = (c: CtxI) => estadoDaRelacao(c.v, c.vin) === 'rompido' || c.papel === 'afastado' || c.papel === 'ex' || c.papel === 'rival' || c.papel === 'ex_amigo' || (c.vin.distancia !== undefined && c.v.t - c.vin.distancia < 60);
const proximo = (c: CtxI) => c.vin.parentesco !== undefined || romance(c) || c.papel === 'amigo' || c.papel === 'amigo_proximo';
const crianca = (c: CtxI) => ehDescendente(c.papel) || ((c.papel === 'irmao' || c.papel === 'parente') && c.eu - c.ip >= 8);
const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const Ele = (p: Pessoa) => flex(p.genero, 'Ele', 'Ela', 'Elu');
const afeto = (c: CtxI, n: number) => { c.vin.proximidade = clamp(Math.round(c.vin.proximidade + n)); };
const confiar = (c: CtxI, n: number) => { c.vin.confianca = clamp(Math.round(c.vin.confianca + n)); };
const acalmar = (c: CtxI, n: number) => { c.vin.tensao = clamp(Math.round(c.vin.tensao - n)); };
const presente = (c: CtxI, n: number) => { c.vin.presenca = clamp(Math.round((c.vin.presenca ?? 30) + n)); };
const envolver = (c: CtxI, n: number) => { if (c.vin.romance) c.vin.romance.envolvimento = clamp(Math.round(c.vin.romance.envolvimento + n)); };
const cabeca = (c: CtxI, n: number) => { c.v.mente.estresse = clamp(c.v.mente.estresse + n); };
const humor = (c: CtxI, n: number) => { c.v.mente.felicidade = clamp(c.v.mente.felicidade + n); };
/** O preço local de um programa (por pessoa, unidade do motor). */
const preco = (c: CtxI, x: number) => Math.round(x * economiaLocal(c.v.moradia.municipioId).custo / 10) * 10;
const conta = (c: CtxI, k: string) => { const h = (c.vin.habitos ??= {}); h[k] = (h[k] ?? 0) + 1; return h[k]; };
const costume = (c: CtxI, n: number, quando: number, texto: string) => { if (n === quando) lembrarCom(c.v, c.p.id, texto, 'ritual', 2); };

/**
 * Como foi: a afinidade, o jeito da pessoa, o estado da relação e a sorte decidem. Devolve 'otimo' | 'bom' | 'morno' |
 * 'ruim' — e cada programa escreve o seu texto para cada caso.
 */
function comoFoi(c: CtxI, r: Rng, bonus = 0): 'otimo' | 'bom' | 'morno' | 'ruim' {
  const x = compatibilidade(c.v, c.p) * 0.25 + c.p.temperamento.afabilidade * 0.15 - c.vin.tensao / 260 + bonus + (r.next() - 0.5) * 0.9;
  return x > 0.38 ? 'otimo' : x > 0 ? 'bom' : x > -0.3 ? 'morno' : 'ruim';
}
/** O efeito de "como foi" na relação (a mesma régua para todo programa). */
function efeito(c: CtxI, foi: ReturnType<typeof comoFoi>, base: number): void {
  if (foi === 'otimo') { afeto(c, base + 3); confiar(c, 2); acalmar(c, 4); envolver(c, 4); }
  else if (foi === 'bom') { afeto(c, base); acalmar(c, 2); envolver(c, 2); }
  else if (foi === 'morno') afeto(c, Math.round(base / 3));
  else { c.vin.tensao = clamp(c.vin.tensao + 4); }
}
const pagarPrograma = (c: CtxI, custo: number) => { if (custo > 0) pagar(c.v, custo); };

/** O que dá para ensinar a um filho (a idade dele, o que você sabe, o que você tem). */
interface Licao { id: string; rotulo: string; marco: string; dominio?: Dominio; de: number; ate: number; pode: (c: CtxI) => boolean }
const LICOES: Licao[] = [
  { id: 'bicicleta', rotulo: 'andar de bicicleta', marco: 'Ensinou {nome} a andar de bicicleta.', de: 4, ate: 9, pode: () => true },
  { id: 'nadar', rotulo: 'nadar', marco: 'Ensinou {nome} a nadar.', dominio: 'natacao', de: 5, ate: 11, pode: c => habilidade(c.v, 'natacao') >= 20 || c.v.rotinas.some(x => x.id === 'natacao') },
  { id: 'bola', rotulo: 'chutar uma bola direito', marco: 'Ensinou {nome} a jogar bola.', dominio: 'futebol', de: 5, ate: 12, pode: c => habilidade(c.v, 'futebol') >= 25 },
  { id: 'cozinhar', rotulo: 'cozinhar o primeiro prato', marco: 'Ensinou {nome} a cozinhar o primeiro prato.', dominio: 'cozinha', de: 9, ate: 17, pode: c => habilidade(c.v, 'cozinha') >= 20 },
  { id: 'tocar', rotulo: 'tocar as primeiras músicas', marco: 'Ensinou {nome} a tocar as primeiras músicas.', dominio: 'musica', de: 7, ate: 17, pode: c => habilidade(c.v, 'musica') >= 30 },
  { id: 'xadrez', rotulo: 'jogar xadrez', marco: 'Ensinou {nome} a jogar xadrez.', dominio: 'xadrez', de: 6, ate: 15, pode: c => habilidade(c.v, 'xadrez') >= 25 },
  { id: 'programar', rotulo: 'programar', marco: 'Ensinou {nome} a programar.', dominio: 'programacao', de: 10, ate: 17, pode: c => habilidade(c.v, 'programacao') >= 35 },
  { id: 'dirigir', rotulo: 'dirigir', marco: 'Ensinou {nome} a dirigir.', de: 16, ate: 21, pode: c => c.v.trabalho.licencas.includes('cnh') && c.v.financas.bens.some(b => b.tipo === 'veiculo') }
];
const licaoPara = (c: CtxI): Licao | undefined => LICOES.find(l => c.ip >= l.de && c.ip <= l.ate && l.pode(c) && c.v.fatos[`ensinou:${l.id}:${c.p.id}`] === undefined);

const CUSTO = { cinema: 45, jantar: 160, show: 220, estadio: 90, fim_de_semana: 900, festa: 900, almoco: 320, romantico: 380 };

export const INTERACOES_JUNTOS: Interacao[] = [
  {
    id: 'cinema',
    quando: c => humano(c) && !romance(c) && !rompido(c) && perto(c) && c.eu >= 9 && c.ip >= 6 && (proximo(c) || c.papel === 'colega' && c.eu >= 12),
    disponivel: c => vereditoDePagar(c.v, preco(c, CUSTO.cinema * 2), 'Os ingressos custam uns'),
    rotulo: c => (crianca(c) && c.ip <= 11 ? `Levar ${c.p.nome} ao cinema` : `Ir ao cinema com ${c.p.nome}`),
    executar: (c, r) => {
      pagarPrograma(c, preco(c, CUSTO.cinema * 2));
      const n = conta(c, 'cinema'); const foi = comoFoi(c, r);
      efeito(c, foi, 4); humor(c, 2);
      if (c.papel === 'colega' || c.papel === 'conhecido') c.vin.aproximacao = c.v.t;
      costume(c, n, 3, `O cinema com ${c.p.nome} virou costume.`);
      return cena(c, foi, { ...P.cinema, infantil: crianca(c) }, n);
    }
  },
  {
    id: 'jantar_fora',
    quando: c => humano(c) && !romance(c) && !rompido(c) && perto(c) && c.eu >= 16 && c.ip >= 10 && proximo(c),
    disponivel: c => vereditoDePagar(c.v, preco(c, CUSTO.jantar), 'O jantar custa uns'),
    rotulo: c => (c.papel === 'genitor' || c.papel === 'avo' ? `Levar ${c.p.nome} para jantar fora, por sua conta` : `Jantar fora com ${c.p.nome}`),
    executar: (c, r) => {
      pagarPrograma(c, preco(c, CUSTO.jantar));
      const n = conta(c, 'jantar'); const foi = comoFoi(c, r, 0.1);
      efeito(c, foi, 5); confiar(c, 1);
      costume(c, n, 3, `Os jantares com ${c.p.nome} viraram coisa de vocês.`);
      const pais = c.papel === 'genitor' || c.papel === 'avo';
      return cena(c, foi, pais ? { ...P.jantar, alto: x => `${x} pediu o mais barato do cardápio e você trocou pelo melhor. Contou para todo mundo depois.` } : P.jantar, n);
    }
  },
  {
    id: 'show',
    quando: c => humano(c) && !rompido(c) && perto(c) && c.eu >= 14 && c.ip >= 14 && (romance(c) || c.papel === 'amigo' || c.papel === 'amigo_proximo' || c.papel === 'irmao' || c.papel === 'filho'),
    disponivel: c => vereditoDePagar(c.v, preco(c, CUSTO.show * 2), 'Os ingressos custam uns'),
    rotulo: c => `Ir a um show com ${c.p.nome}`,
    executar: (c, r) => {
      pagarPrograma(c, preco(c, CUSTO.show * 2));
      const n = conta(c, 'show');
      const musica = habilidade(c.v, 'musica') >= 20 ? 0.15 : 0;
      const foi = comoFoi(c, r, 0.15 + musica);
      efeito(c, foi, 6); humor(c, 3); cabeca(c, -2);
      if (n === 1 && foi === 'otimo') lembrarCom(c.v, c.p.id, `O show que vocês viram juntos.`, 'ritual', 2);
      return cena(c, foi, P.show, n);
    }
  },
  {
    id: 'estadio',
    quando: c => humano(c) && !romance(c) && !rompido(c) && perto(c) && c.eu >= 10 && c.ip >= 6 && (c.papel === 'filho' || c.papel === 'genitor' || c.papel === 'irmao' || c.papel === 'amigo' || c.papel === 'amigo_proximo' || c.papel === 'neto' || c.papel === 'avo')
      && (habilidade(c.v, 'futebol') >= 15 || c.v.rotinas.some(x => x.id === 'futebol') || c.vin.habitos?.['estadio'] !== undefined || c.p.genero === c.v.eu.genero),
    disponivel: c => vereditoDePagar(c.v, preco(c, CUSTO.estadio * 2), 'Os ingressos custam uns'),
    rotulo: c => (c.papel === 'filho' && c.ip <= 12 ? `Levar ${c.p.nome} ao primeiro jogo no estádio` : `Ver um jogo no estádio com ${c.p.nome}`),
    executar: (c, r) => {
      pagarPrograma(c, preco(c, CUSTO.estadio * 2));
      const n = conta(c, 'estadio'); const foi = comoFoi(c, r, 0.1);
      efeito(c, foi, 5); humor(c, 2);
      if (n === 1 && c.papel === 'filho' && c.ip <= 12) { lembrarCom(c.v, c.p.id, `O primeiro jogo de ${c.p.nome} no estádio foi com você.`, 'ritual', 3); }
      costume(c, n, 3, `Ir ao estádio virou programa de vocês.`);
      // O placar é do jogo, não da relação: um sorteio próprio (sempre consumido, como antes).
      const ganhou = r.chance(0.45);
      return cena(c, ganhou && foi !== 'ruim' ? 'otimo' : foi, { ...P.estadio, infantil: crianca(c) }, n);
    }
  },
  {
    id: 'parque',
    quando: c => humano(c) && crianca(c) && c.ip >= 2 && c.ip <= 11 && perto(c) && c.eu >= 14 && !rompido(c),
    rotulo: c => `Levar ${c.p.nome} ao parque`,
    executar: (c, r) => {
      const n = conta(c, 'parque');
      const chuva = r.chance(0.15);
      afeto(c, chuva ? 3 : 6); presente(c, 8); cabeca(c, -2); humor(c, 2);
      costume(c, n, 3, `O parque de domingo era de vocês.`);
      if (chuva) return { resultado: `Choveu no meio da tarde. Voltaram correndo, ${c.p.nome} rindo e encharcad${flex(c.p.genero, 'o', 'a', 'e')}.`, titulo: `O parque com ${c.p.nome}` };
      return cena(c, n % 4 === 0 ? 'otimo' : 'bom', P.parque, n);
    }
  },
  {
    id: 'ensinar',
    quando: c => humano(c) && (c.papel === 'filho' || c.papel === 'neto' || (c.papel === 'irmao' && c.eu - c.ip >= 8)) && perto(c) && c.eu >= 16 && !rompido(c) && !!licaoPara(c),
    rotulo: c => `Ensinar ${c.p.nome} a ${licaoPara(c)!.rotulo}`,
    executar: (c, r) => {
      const l = licaoPara(c)!;
      // Paciência é empatia e disciplina juntas (os traços que existem): quem tem, ensina melhor.
      const paciencia = (c.v.personalidade.tracos.empatia + c.v.personalidade.tracos.disciplina) / 2;
      const deu = r.chance(0.7 + paciencia / 250);
      afeto(c, deu ? 8 : 4); presente(c, 10); confiar(c, deu ? 3 : 1);
      if (l.dominio) praticar(c.v, r, l.dominio, 0.1, 1);
      if (!deu) return { resultado: `${c.p.nome} chorou, você perdeu a paciência, e a lição ficou para outro dia. Na volta, ${ele(c.p)} segurou a sua mão.` };
      c.v.fatos[`ensinou:${l.id}:${c.p.id}`] = c.v.t;
      const marco = l.marco.replace('{nome}', c.p.nome);
      lembrarCom(c.v, c.p.id, marco, 'ritual', 3);
      if (c.papel === 'filho') escrever(c.v, { texto: marco, relevancia: l.id === 'bicicleta' || l.id === 'dirigir' || l.id === 'nadar' ? 'biografia' : 'cotidiano', tema: 'familia', tom: 'bom', pessoas: [c.p.id], escolha: true });
      return { resultado: l.id === 'bicicleta' ? `Você soltou o banco sem avisar. ${c.p.nome} só percebeu dez metros depois — e não caiu.` : l.id === 'dirigir' ? `Um estacionamento vazio, o carro morrendo na primeira marcha, e depois a primeira volta no quarteirão. ${c.p.nome} não esquece.` : `${c.p.nome} aprendeu a ${l.rotulo}. Daqui a anos, vai lembrar com quem foi.` };
    }
  },
  {
    id: 'cozinhar_junto',
    quando: c => humano(c) && c.casa && c.ip >= 6 && c.eu >= 12 && !rompido(c),
    rotulo: c => (crianca(c) && c.ip <= 12 ? `Fazer um bolo com ${c.p.nome}` : `Cozinhar com ${c.p.nome}`),
    executar: (c, r) => {
      const n = conta(c, 'cozinhar'); const foi = comoFoi(c, r, 0.1);
      efeito(c, foi, 4); presente(c, 5);
      praticar(c.v, r, 'cozinha', 0.15, 1);
      costume(c, n, 3, `Cozinhar junto virou coisa de vocês.`);
      return cena(c, foi, { ...P.cozinhar, infantil: crianca(c) }, n);
    }
  },
  {
    id: 'caminhar_junto',
    quando: c => humano(c) && perto(c) && c.ip >= 12 && c.eu >= 14 && !rompido(c) && (proximo(c)),
    rotulo: c => (c.ip >= 65 ? `Uma caminhada leve com ${c.p.nome}` : `Caminhar (ou correr) com ${c.p.nome}`),
    executar: (c, r) => {
      const n = conta(c, 'caminhar'); const foi = comoFoi(c, r, 0.05);
      efeito(c, foi, 3); cabeca(c, -3);
      c.v.corpo.forma = clamp(c.v.corpo.forma + 1);
      costume(c, n, 4, `As caminhadas com ${c.p.nome} viraram costume.`);
      return cena(c, foi, P.caminhar, n);
    }
  },
  {
    id: 'fim_de_semana',
    quando: c => humano(c) && !rompido(c) && c.eu >= 18 && c.ip >= 16 && !c.casa && (romance(c) || c.papel === 'amigo_proximo' || c.papel === 'genitor' || c.papel === 'irmao' || (c.papel === 'filho' && c.ip >= 18)),
    disponivel: c => vereditoDePagar(c.v, preco(c, CUSTO.fim_de_semana * 2), 'Um fim de semana fora custa uns'),
    rotulo: c => `Um fim de semana fora com ${c.p.nome}`,
    executar: (c, r) => {
      pagarPrograma(c, preco(c, CUSTO.fim_de_semana * 2));
      const foi = comoFoi(c, r, 0.2);
      efeito(c, foi, 9); cabeca(c, -5); humor(c, 3);
      if (foi !== 'ruim') lembrarCom(c.v, c.p.id, `Um fim de semana fora, só vocês.`, 'ritual', 2);
      return cena(c, foi, P.fim_de_semana, conta(c, 'fim_de_semana'));
    }
  },
  {
    id: 'aniversario',
    quando: c => humano(c) && !rompido(c) && perto(c) && c.eu >= 18 && ((c.papel === 'filho' && c.ip >= 3 && c.ip <= 15) || ((c.papel === 'genitor' || c.papel === 'avo') && c.ip >= 60)),
    disponivel: c => vereditoDePagar(c.v, preco(c, c.papel === 'filho' ? CUSTO.festa : CUSTO.almoco), 'A comemoração custa uns'),
    rotulo: c => (c.papel === 'filho' ? `Fazer a festa de aniversário de ${c.p.nome}` : `Juntar a família no aniversário de ${c.p.nome}`),
    executar: (c, r) => {
      const filho = c.papel === 'filho';
      pagarPrograma(c, preco(c, filho ? CUSTO.festa : CUSTO.almoco));
      const n = conta(c, 'aniversario');
      afeto(c, filho ? 7 : 9); presente(c, 6); confiar(c, 2); humor(c, 2);
      if (filho) costume(c, n, 3, `As festas de aniversário de ${c.p.nome} eram sempre com você na organização.`);
      else marcarFato(c.v, `aniversario_${c.p.id}_${Math.floor(c.v.t / 12)}`);
      const marco = !filho && c.ip >= 80 && (c.ip % 10 === 0 || c.ip % 5 === 0);
      if (marco) escrever(c.v, { texto: `Juntou a família nos ${c.ip} anos de ${c.p.nome}.`, relevancia: 'biografia', tema: 'familia', tom: 'bom', pessoas: [c.p.id], escolha: true });
      return { resultado: filho ? [`Bolo, brigadeiro, a turma da escola e um parabéns desafinado. ${c.p.nome} dormiu abraçad${flex(c.p.genero, 'o', 'a', 'e')} no presente.`, `A festa foi no quintal, com pula-pula alugado. ${c.p.nome} não quis ir embora da própria festa.`][r.int(0, 1)] : `${Ele(c.p)} assoprou as velas devagar, olhando cada um. Ninguém esqueceu daquele almoço.` };
    }
  },
  {
    id: 'jantar_romantico',
    quando: c => humano(c) && (c.papel === 'parceiro' || c.papel === 'saindo') && perto(c) && c.eu >= 18,
    disponivel: c => vereditoDePagar(c.v, preco(c, CUSTO.romantico), 'O jantar custa uns'),
    rotulo: c => `Um jantar com reserva, só vocês (${c.p.nome})`,
    executar: (c, r) => {
      pagarPrograma(c, preco(c, CUSTO.romantico));
      const n = conta(c, 'romantico'); const foi = comoFoi(c, r, 0.2);
      efeito(c, foi, 4); envolver(c, foi === 'otimo' ? 6 : 3);
      costume(c, n, 3, `Os jantares de vocês dois nunca saíram da agenda.`);
      return cena(c, foi, P.romantico, n);
    }
  }
];

/** O grupo de cada interação na ficha: fazer junto, conversar, cuidar e ajudar, a relação (a ordem da tela). */
export type GrupoDeInteracao = 'juntos' | 'conversar' | 'cuidar' | 'romance' | 'relacao';
const GRUPOS: Record<string, GrupoDeInteracao> = {
  // Fazer junto: o que se FAZ (não o que se diz).
  cinema: 'juntos', jantar_fora: 'juntos', show: 'juntos', estadio: 'juntos', parque: 'juntos', ensinar: 'juntos', cozinhar_junto: 'juntos', caminhar_junto: 'juntos',
  fim_de_semana: 'juntos', aniversario: 'juntos', jantar_romantico: 'juntos', tempo: 'juntos', visitar: 'juntos', sair_juntos: 'juntos', passear: 'juntos',
  brincar: 'juntos', ler: 'juntos', treinar_junto: 'juntos', visitar_par: 'juntos', app_encontro: 'juntos', comemorar: 'juntos', intimidade: 'juntos',
  // Conversar.
  conversar: 'conversar', desabafar: 'conversar', aconselhar: 'conversar', ligar: 'conversar', ligar_par: 'conversar', duvidas: 'conversar', conselho_futuro: 'conversar',
  perguntar_vida: 'conversar', elogiar: 'conversar', pedir_conselho: 'conversar', ex_conversar: 'conversar', app_conversar: 'conversar',
  // FIX pós-playtest humano: o que pode virar romance tem lugar próprio na ficha ("Algo mais").
  flertar: 'romance', declarar: 'romance', demonstrar_interesse: 'romance', convidar: 'romance',
  carinho: 'conversar', futuro_casal: 'conversar', dinheiro_casal: 'conversar', agradecer_professor: 'conversar', conhecer: 'conversar', futuro: 'conversar',
  // Cuidar e ajudar.
  cuidar: 'cuidar', apoiar: 'cuidar', dinheiro: 'cuidar', medico: 'cuidar', estudos: 'cuidar', escola: 'cuidar', incentivar: 'cuidar', limite: 'cuidar',
  pedir_ajuda_criancas: 'cuidar', ex_filhos: 'cuidar', chamado_sim: 'cuidar', chamado_nao: 'cuidar'
};
/** O resto (aproximar, pedir em namoro, casar, terminar, desculpas, discordar, afastar...) é a relação em si. */
export const grupoDaInteracao = (id: string): GrupoDeInteracao => GRUPOS[id] ?? 'relacao';
