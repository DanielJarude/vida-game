/**
 * VIDA 15 · O CELULAR — as pessoas tomam a iniciativa, o acaso põe gente no caminho, o aplicativo mostra perfis.
 *
 *   NA VIRADA DO ANO (`processarCelular15`, chamado pelo ano depois das iniciativas): de 0 a 3 mensagens, escolhidas pelo
 *     contexto (quem gosta de você e anda sem notícia, o amigo da mesma cidade com um programa, a família com uma
 *     novidade que ESTÁ na trajetória dela, a parceria, o colega de anos atrás, o ex, o contato do trabalho, e — com
 *     fama — o fã, a produção do evento, a pessoa famosa, a imprensa). Sorteio derivado (`rngDe`): nada aqui mexe no
 *     acaso do resto da vida, nem cria pessoas (quem ainda não está na vida só nasce quando você responde).
 *   DURANTE O ANO (`depoisDaAcao15`, chamado pelas ações): o que você faz move o ano — depois de algumas escolhas, chega
 *     mais gente; ir a um lugar (sair, viajar, um programa, as compras) pode pôr alguém conhecido no caminho.
 *   A RESPOSTA (`responderMsg15`): uma por mensagem; muda a relação de verdade (proximidade, confiança, a história dos
 *     dois, o romance pelo caminho de sempre), custa o que custa, e às vezes traz alguém novo.
 *   O NAMORO (`executarCelular15` · curtir/passar): perfis do ano; o match é da outra pessoa; depois do match, a conversa
 *     e o encontro são as interações de sempre (`app_conversar`, `app_encontro`).
 *
 * Sem notificação repetitiva: cada pessoa tem um intervalo, cada tipo também, e anos tranquilos existem.
 */

import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { Pessoa, Vida, Vinculo } from '../../tipos';
import { escrever, foraDaParceria, idade, idadePessoa, lembrarCom, parceiro, vinculosVivos } from '../../nucleo';
import { garantirVida } from '../../sistemas/filhos';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { criarPessoa, vincular } from '../../pessoas';
import { papelDe, type Papel } from '../../sistemas/vinculos';
import { acordoConsentido, atraiGenero, interesseInicial, podeTerRomance } from '../../sistemas/romance';
import { compatibilidade } from '../../sistemas/social';
import { novoContexto, buscaDoPerfil, registrarFase, etapaDoApp } from '../../sistemas/relacoes';
import { vereditoDePagar } from '../../sistemas/dinheiro';
import { avisoDoApp16, deixarRastro16, esquecerRastro16 } from '../../v16/romance/namoro16';
import { arquivarMsgs16, disponibilidadeEscrever16, escrever16, type IntencaoMsg16 } from '../../v16/celular/mensagens16';
import { somarAoNome, origemDoNome } from '../../sistemas/notoriedade';
import { flex } from '../../texto';
import { anoDe } from '../../tempo';
import { textoDaEpoca } from '../../eras/base/anacronismos';
import { anoNoBrasil, existeNoBrasil, temAcesso } from '../../eras/base/contexto';
import { municipio } from '../../dados/lugares';
import { sortearNome, sortearSobrenome } from '../../dados/nomes';
import { candidatos17, deixarFio17, ehTipo17, extrasDaVida15, opcoes17, responder17, semResposta17, aoChegar17 } from '../../v17/celular/mensagens17';
import { podeReceber17, receber17, type Prioridade17 } from '../../sistemas/cotaDeMensagens';
import { aindaEmRomance } from '../../sistemas/estadoConjugal';
import { disponibilidadeLigacao17, ligarDaUnidade17, MOTIVO_PRESO17, preso17 } from '../../v17/prisao/telefone17';
import type { AreaCelebridade15, Celular15, Lugar15, Molde15, Msg15, PerfilApp15, TipoMsg15 } from '../../dados15/celular/tipos';

/* ------------------------------------------------------------------ Leitura */

const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const humano = (p: Pessoa) => !p.especie && p.vivo && !!p.nome;
const moraJunto = (vin: Vinculo) => vin.convivio.includes('casa');

/** O nível da fama, 0..4 (o mesmo degrau da tela de Fama). */
export function nivelDaFama15(v: Vida): number {
  const x = v.notoriedade?.valor ?? 0;
  return x >= 78 ? 4 : x >= 55 ? 3 : x >= 30 ? 2 : x >= 10 ? 1 : 0;
}

/** A partir de quando há celular na vida (antes disso, a família liga para a casa). */
export const IDADE_CELULAR15 = 10;
/** ERAS HISTÓRICAS: numa vida histórica, o mesmo aparelho é o telefone de casa, o celular de teclas ou o smartphone
 *  (`eras/base/contexto.meioDeComunicacao`) — as mensagens são as mesmas; a tela muda. */
export const temCelular15 = (v: Vida) => idade(v) >= IDADE_CELULAR15 && !v.morte;

export function celularDe(v: Vida): Celular15 {
  return (v.celular15 ??= { ano: anoDe(v.t), msgs: [] });
}

/** As mensagens à espera de resposta (do ano). */
export function pendentes15(v: Vida): Msg15[] {
  return (v.celular15?.msgs ?? []).filter(m => !m.resposta && mensagemViva(v, m));
}

/** Uma mensagem de alguém que morreu (ou saiu da vida) não espera mais resposta. */
function mensagemViva(v: Vida, m: Msg15): boolean {
  if (!m.de) return true;
  const p = v.pessoas[m.de];
  return !!p && p.vivo && !!v.vinculos[m.de];
}

/** Quantas novidades o aparelho mostra (mensagens não lidas + chamados das pessoas). */
export function naoLidas15(v: Vida): number {
  const msgs = (v.celular15?.msgs ?? []).filter(m => !m.lida && !m.resposta && mensagemViva(v, m)).length;
  const chamados = vinculosVivos(v).filter(x => x.vin.chamado).length;
  return msgs + chamados;
}

/* ------------------------------------------------------------------ Os programas */

interface Programa { id: string; verbo: string; nome: string; feito: string[]; onde: Lugar15; custo: number; idade: [number, number]; social?: boolean }
const PROGRAMAS: Programa[] = [
  { id: 'brincar', verbo: 'vir brincar aqui em casa à tarde', nome: 'uma tarde de brincadeira lá em casa', feito: ['A tarde passou voando: videogame, bolo e a promessa de repetir.', 'Construíram uma cabana de lençol que ocupou a sala inteira.'], onde: 'parque', custo: 0, idade: [6, 12] },
  { id: 'aniversario', verbo: 'comemorar o meu aniversário comigo', nome: 'a festa do meu aniversário', feito: ['Parabéns cantado alto, bolo bom, a turma toda junta.', 'A festa foi pequena e foi a melhor do ano.'], onde: 'festa', custo: 40, idade: [6, 99], social: true },
  { id: 'cinema', verbo: 'ir ao cinema no fim de semana', nome: 'um cinema no fim de semana', feito: ['O filme era mediano; a conversa depois, não.', 'Saíram do cinema discutindo o final até a esquina.'], onde: 'cinema', custo: 60, idade: [10, 90] },
  { id: 'shopping', verbo: 'dar uma volta no shopping', nome: 'uma volta no shopping', feito: ['Não compraram nada e passaram quatro horas lá dentro.', 'Lanche na praça de alimentação, vitrines, risada.'], onde: 'shopping', custo: 50, idade: [11, 30] },
  { id: 'pelada', verbo: 'jogar uma pelada no sábado de manhã', nome: 'a pelada de sábado', feito: ['Perderam de lavada e riram o caminho de volta inteiro.', 'Um gol bonito, uma canela ralada, o refrigerante gelado no fim.'], onde: 'parque', custo: 15, idade: [10, 60] },
  { id: 'praia', verbo: 'passar o dia na praia (ou na cachoeira)', nome: 'um dia de praia', feito: ['Sol, água gelada e aquele cansaço bom de fim de dia.', 'Voltaram vermelhos de sol e de tanto rir.'], onde: 'praia', custo: 60, idade: [10, 75] },
  { id: 'festa', verbo: 'ir a uma festa no sábado', nome: 'uma festa no sábado', feito: ['A música estava alta, a pista cheia, a volta foi de madrugada.', 'Dançou mais do que pretendia. Os pés reclamaram no domingo.'], onde: 'festa', custo: 80, idade: [15, 45], social: true },
  { id: 'show', verbo: 'ir a um show que ninguém pode perder', nome: 'um show imperdível', feito: ['Cantaram junto até perder a voz.', 'Ficaram na grade. Valeu cada minuto em pé.'], onde: 'show', custo: 250, idade: [15, 70], social: true },
  { id: 'bar', verbo: 'tomar uma cerveja depois do expediente', nome: 'uma cerveja depois do expediente', feito: ['Era para ser uma; foram três e muita conversa.', 'O bar fechou com vocês dois ainda falando da vida.'], onde: 'bar', custo: 90, idade: [18, 80], social: true },
  { id: 'jantar', verbo: 'jantar num restaurante novo', nome: 'um jantar num restaurante novo', feito: ['A comida era boa; a sobremesa, melhor ainda.', 'Pediram de tudo para dividir e saíram rolando.'], onde: 'restaurante', custo: 180, idade: [18, 99] },
  { id: 'churrasco', verbo: 'aparecer num churrasco com a turma', nome: 'um churrasco com a turma', feito: ['Carne boa, música alta e a turma toda junta de novo.', 'Alguém trouxe um violão. Ninguém foi embora cedo.'], onde: 'festa', custo: 40, idade: [16, 99], social: true },
  { id: 'viagem', verbo: 'fazer uma viagem curta de fim de semana', nome: 'uma viagem curta de fim de semana', feito: ['Dois dias longe de tudo, estrada, pousada simples e boas histórias.', 'Choveu o fim de semana inteiro — e mesmo assim foi ótimo.'], onde: 'aeroporto', custo: 900, idade: [18, 75], social: true },
  { id: 'cafe', verbo: 'tomar um café para pôr a conversa em dia', nome: 'um café para pôr a conversa em dia', feito: ['O café virou duas horas de conversa.', 'Puseram em dia anos de assunto numa tarde.'], onde: 'restaurante', custo: 30, idade: [14, 99] },
  { id: 'almoco', verbo: 'almoçar no domingo', nome: 'um almoço de domingo', feito: ['Almoço comprido, daqueles que viram café da tarde.', 'Comida caseira e conversa sem pressa.'], onde: 'restaurante', custo: 70, idade: [30, 99] }
];

const A_DOIS: Programa[] = [
  { id: 'jantar_dois', verbo: 'jantar fora, só nós dois', nome: 'um jantar a dois', feito: ['Mesa de canto, vinho, e nenhum assunto de boleto.'], onde: 'restaurante', custo: 260, idade: [18, 99] },
  { id: 'cinema_dois', verbo: 'ir ao cinema e depois comer uma pizza', nome: 'cinema e pizza', feito: ['Dividiram a pipoca, depois a pizza, depois o cobertor.'], onde: 'cinema', custo: 120, idade: [15, 99] },
  { id: 'fds_dois', verbo: 'passar um fim de semana fora, os dois', nome: 'um fim de semana fora', feito: ['Dois dias sem relógio. Voltaram mais perto.'], onde: 'aeroporto', custo: 1400, idade: [20, 85] },
  { id: 'parque_dois', verbo: 'passar o domingo no parque, sem celular', nome: 'um domingo no parque', feito: ['Toalha na grama, um livro cada e muita conversa.'], onde: 'parque', custo: 20, idade: [15, 99] },
  { id: 'show_dois', verbo: 'ir ao show daquela banda que a gente ouve', nome: 'o show da banda de vocês', feito: ['Cantaram a música de vocês abraçados no meio da multidão.'], onde: 'show', custo: 380, idade: [16, 75] }
];


/* ------------------------------------------------------------------ Os candidatos */

interface Candidato { tipo: TipoMsg15; peso: number; p?: Pessoa; prioridade?: Prioridade17; montar: (r: Rng) => Omit<Msg15, 'id' | 't' | 'tipo' | 'onda'> }

const RECENTE = (v: Vida, chave: string, meses: number) => { const t = v.fatos[chave]; return t !== undefined && v.t - t < meses; };

function candidatos(v: Vida, excluir: Set<string>): Candidato[] {
  const eu = idade(v);
  const out: Candidato[] = [];
  const par = parceiro(v);
  const cidade = v.moradia.municipioId;
  const fama = nivelDaFama15(v);
  for (const { p, vin } of vinculosVivos(v)) {
    if (!humano(p) || excluir.has(p.id) || vin.chamado) continue;
    if (RECENTE(v, `cel15_${p.id}`, 18)) continue;
    // Quem rompeu, bloqueou ou está em guerra não manda "oi".
    if (vin.ruptura && vin.estagio !== 'ex_amigo') continue;
    if (vin.distancia !== undefined && v.t - vin.distancia < 48) continue;
    const papel: Papel = papelDe(p, vin);
    const ip = idadePessoa(v, p);
    const semContato = (v.t - vin.tUltimoContato) / 12;
    const longe = p.municipioId !== cidade;
    // Convite: amigo por perto (ou família próxima, adulto) chama para um programa da idade dos dois.
    if ((papel === 'amigo' || papel === 'amigo_proximo' || (papel === 'irmao' && eu >= 16) || (papel === 'colega' && vin.proximidade >= 40 && eu >= 16)) && !longe && !RECENTE(v, `cel17_semconvite_${p.id}`, 36) && ip >= 6 && vin.tensao < 50 && !moraJunto(vin)) {
      const ops = PROGRAMAS.filter(x => eu >= x.idade[0] && eu <= x.idade[1] && ip >= x.idade[0] && ip <= x.idade[1] + 10);
      if (ops.length) out.push({ tipo: 'convite', p, peso: (papel === 'amigo_proximo' ? 1.4 : 0.8) + Math.max(0, p.temperamento.extroversao) * 0.6, montar: rr => {
        const pr = rr.pick(ops);
        const frase = rr.pick(eu < 13 ? ['"Quer {v}? Minha mãe deixou!"', '"Bora {v}?"'] : ['"Bora {v}? Vai ser bom te ver."', '"Tô organizando {n}. Conto com você?"', '"Topa {v}? Faz tempo que a gente não sai."', '"Ei! Vai ter {n} — você vem, né?"']);
        return { de: p.id, texto: frase.replace('{v}', pr.verbo).replace('{n}', pr.nome), assunto: pr.id, onde: pr.onde, custo: pr.custo };
      } });
    }
    // Saudade: quem gosta de você e anda sem notícia (família longe, amigo de outra cidade, padrinho).
    const familiaPerto = papel === 'genitor' || papel === 'avo' || papel === 'filho';
    if (semContato >= (familiaPerto ? 1 : 2) && vin.proximidade >= 38 && !moraJunto(vin) && eu >= 10 && ip >= 10 && ['amigo', 'amigo_proximo', 'irmao', 'genitor', 'avo', 'filho', 'neto', 'parente', 'afastado'].includes(papel)) {
      out.push({ tipo: 'saudade', p, peso: 0.35 + Math.min(0.8, semContato * 0.15) + (familiaPerto ? 0.4 : 0), montar: rr => ({
        de: p.id, texto: rr.pick(papel === 'genitor' || papel === 'avo'
          ? ['"Oi, meu bem. Tá tudo bem por aí? Liga quando puder."', '"Sonhei com você esta noite. Me dá notícia?"', '"Tô com saudade. Vem almoçar um domingo desses."']
          : ['"E aí, sumid{o}! Como você tá?"', '"Lembrei de você hoje, do nada. Tudo bem por aí?"', '"Faz tanto tempo... me conta de você."', '"Vi uma foto antiga nossa e bateu saudade."'])
      }) });
    }
    // Notícia: a família (ou um amigo próximo) conta o que ACONTECEU na vida dela — lido da trajetória (nada inventado).
    const traj = p.vida?.trajetoria?.filter(x => x.t >= v.t - 12 && x.t <= v.t && x.tipo !== 'escola') ?? [];
    if (traj.length && (['irmao', 'genitor', 'filho', 'neto', 'avo', 'amigo_proximo', 'parente'].includes(papel) || (papel === 'amigo' && vin.proximidade >= 45)) && ip >= 12) {
      const ult = traj[traj.length - 1];
      // VIDA 17: "tô namorando" só de quem ainda está no romance que a trajetória anunciou (sem contradizer o estado).
      const romanceAcabou = ult.tipo === 'amor' && /namor|relacionamento/i.test(ult.texto) && !/termin|separ/i.test(ult.texto) && !aindaEmRomance(p);
      if (!romanceAcabou && !RECENTE(v, `cel15n_${p.id}_${ult.t}`, 999)) out.push({ tipo: 'noticia', p, peso: 1.6, montar: () => ({ de: p.id, texto: falaDaNoticia(p, ult.tipo, ult.texto), cartao: ult.texto, assunto: `${ult.tipo}:${ult.t}` }) });
    }
    // O colega de anos atrás: da escola, da faculdade, de um trabalho antigo (sem convívio, sem contato há 5+ anos).
    if ((papel === 'conhecido' || papel === 'colega' || papel === 'afastado' || papel === 'amigo') && vin.convivio.length === 0 && semContato >= 5 && eu >= 20 && vin.tensao < 40 && vin.historia.length >= 2 && !RECENTE(v, `cel15r_${p.id}`, 120)) {
      const de = vin.formacao ? 'da escola' : vin.origem === 'trabalho' ? 'do trabalho antigo' : vin.origem === 'faculdade' ? 'da faculdade' : vin.origem === 'escola' ? 'da escola' : 'de anos atrás';
      out.push({ tipo: 'reencontro', p, peso: 0.25 + Math.min(0.5, semContato / 20), montar: rr => ({ de: p.id, texto: rr.pick([`"Lembra de mim? ${p.nome}, ${de}! Achei você aqui por acaso."`, `"Quanto tempo! Tô organizando um encontro da turma ${de}. Você vem?"`, `"${cap(p.nome)} aqui, ${de}. Passei pela sua rua e lembrei de você."`]), assunto: de }) });
    }
    // O ex: anos depois, uma mensagem (com ou sem segundas intenções — a resposta é sua).
    if (papel === 'ex' && vin.romance?.estagio === 'ex' && v.t - vin.romance.tEstagio >= 30 && eu >= 17 && vin.tensao < 60 && !RECENTE(v, `cel15ex_${p.id}`, 48)) {
      out.push({ tipo: 'ex', p, peso: 0.35 + Math.max(0, p.temperamento.extroversao) * 0.3, montar: rr => ({ de: p.id, texto: rr.pick(['"Oi. Sei que faz tempo. Só queria saber se você está bem."', '"Vi uma música que era nossa tocando hoje. Espero que esteja tudo bem com você."', '"Ei... tô na cidade semana que vem. Um café, sem drama?"']) }) });
    }
    // A proposta: um contato do trabalho (de agora ou de antes) oferece um trabalho extra, uma indicação.
    if ((vin.origem === 'trabalho' || vin.convivio.includes('trabalho')) && eu >= 18 && (v.trabalho.atual || v.trabalho.historico?.length) && vin.proximidade >= 30 && !RECENTE(v, 'cel15_proposta', 24)) {
      out.push({ tipo: 'proposta', p, peso: 0.5, montar: rr => ({ de: p.id, texto: rr.pick(['"Tenho um trabalho extra, coisa de algumas semanas, e pensei em você. Paga bem. Topa?"', '"Tem um projeto aqui que é a sua cara. Posso passar o seu nome?"', '"Um cliente meu precisa de alguém de confiança. Quer que eu indique você?"']), assunto: 'extra' }) });
    }
  }
  // A parceria sugere um programa a dois (a relação também pede atitude dela).
  if (par && humano(par.p) && !excluir.has(par.p.id) && !RECENTE(v, 'cel15_par', 8)) {
    const ops = A_DOIS.filter(x => eu >= x.idade[0] && eu <= x.idade[1]);
    out.push({ tipo: 'parceiro', p: par.p, peso: 1.1 + (par.vin.romance && par.vin.romance.envolvimento >= 60 ? 0.5 : 0), montar: rr => {
      const pr = rr.pick(ops);
      return { de: par.p.id, texto: rr.pick(['"E se a gente fosse {v}? Tô precisando de um tempo nosso."', '"Pensei numa coisa: {n}. Que tal?"', '"Reservei a data, só falta você topar: {n}."']).replace('{v}', pr.verbo).replace('{n}', pr.nome), assunto: pr.id, onde: pr.onde, custo: pr.custo };
    } });
  }
  // A fama: os fãs, os eventos, as pessoas famosas, a imprensa — na medida do tamanho do nome.
  if (fama >= 1 && eu >= 14) {
    if (!RECENTE(v, 'cel15_fa', 10)) out.push({ tipo: 'fa', peso: 0.4 + fama * 0.35, montar: rr => {
      const nome = sortearNome(rr, rr.chance(0.5) ? 'masculino' : 'feminino', anoDe(v.t) - rr.int(14, 40), municipio(v.moradia.municipioId).pais);
      return { remetente: `${nome} (fã)`, texto: rr.pick(['"Sou muito seu fã! Um dia ainda tiro uma foto com você."', '"Você mudou o meu ano. Responde, por favor 🙏"', '"Meu filho é louco por você. Grava um vídeo de parabéns pra ele?"', '"Te vi de longe ontem e não tive coragem de chegar. Obrigado por tudo!"']), assunto: 'fa' };
    } });
    if (fama >= 2 && eu >= 16 && !RECENTE(v, 'cel15_evento', 10)) out.push({ tipo: 'evento', peso: 0.35 + fama * 0.3, montar: rr => {
      const ev = rr.pick(EVENTOS.filter(e => fama >= e.fama));
      return { remetente: ev.quem, texto: ev.texto, assunto: ev.id, onde: ev.onde, custo: ev.custo, molde: molde(v, rr, fama) };
    } });
    if (fama >= 3 && eu >= 16 && !RECENTE(v, 'cel15_celeb', 14)) out.push({ tipo: 'celebridade', peso: 0.3 + (fama - 2) * 0.3, montar: rr => {
      const m = molde(v, rr, fama);
      return { remetente: `${m.nome} ${m.sobrenome}`, molde: m, texto: rr.pick(['"Oi! A gente se cruzou naquele evento — adorei o seu trabalho. Vamos marcar alguma coisa?"', '"Te sigo faz tempo. Tô fazendo um projeto e queria você nele. Conversamos?"', '"Seu último trabalho me pegou. Um café, quando der?"']) };
    } });
    const caso = par ?? vinculosVivos(v).find(x => x.vin.romance?.estagio === 'saindo');
    if (fama >= 2 && caso && eu >= 18 && !RECENTE(v, 'cel15_imprensa', 18)) out.push({ tipo: 'imprensa', peso: 0.4 + fama * 0.2, montar: rr => ({ remetente: rr.pick(['Coluna Bastidores', 'Portal Holofote', 'Revista Ribalta']), de: undefined, texto: `"Temos fotos suas com ${caso.p.nome} saindo de um restaurante. Vamos publicar amanhã. Quer comentar?"`, assunto: caso.p.id }) });
  }
  return out;
}

/** A fala de quem conta a novidade (a novidade em si vai no cartão, com as palavras da trajetória — nada inventado). */
function falaDaNoticia(p: Pessoa, tipo: string, texto = ''): string {
  // VIDA 17: a fala acompanha o que de fato aconteceu (a separação não é "tô namorando"; o casamento também não).
  if (tipo === 'amor' && /separ|termin|divorc/i.test(texto)) return '"A gente terminou. Tô bem, na medida do possível — só não queria que você soubesse por outra pessoa."';
  if (tipo === 'amor' && /casou|casaram|morar juntos/i.test(texto)) return '"Vamos juntar as escovas de dente! Queria que você soubesse por mim."';
  if (tipo === 'amor' && /novo relacionamento/i.test(texto)) return '"Tenho uma novidade meio sem jeito de contar: conheci alguém. Quero que você conheça."';
  const fala: Record<string, string> = {
    trabalho: '"Tenho novidade no trabalho! Ainda tô me acostumando."',
    promocao: `"Adivinha quem foi promovid${o(p)}? Vou pagar o jantar!"`,
    desemprego: '"Perdi o emprego. Tô bem, juro — só queria contar pra alguém."',
    casa: '"Casa nova! Vem conhecer o lugar."',
    amor: '"Tô namorando! Quero que você conheça."',
    filho: '"Nasceu! Tô sem dormir e mais feliz do que nunca."',
    lugar: '"Vida nova, cidade nova. Vem me visitar!"',
    saude: '"Fiz uns exames e vou precisar de um tempo pra cuidar da saúde. Nada de pânico."',
    perda: `"Foi um ano difícil por aqui. Obrigad${o(p)} por estar perto."`,
    estudo: '"Consegui! Finalmente."'
  };
  return fala[tipo] ?? '"Tenho novidade!"';
}

/** VIDA 17: o título do post lido do que aconteceu (uma separação não é "Namorando"). */
export function tituloDoPost17(tipo: string, texto: string): string {
  if (tipo === 'amor' && /separ|termin|divorc/i.test(texto)) return 'Fim de um ciclo';
  if (tipo === 'amor' && /casou|casaram|morar juntos/i.test(texto)) return 'Juntos';
  return TITULO_DO_POST15[tipo] ?? 'Novidade';
}

/** O título da publicação de cada tipo de acontecimento (a rede dos amigos). */
export const TITULO_DO_POST15: Record<string, string> = {
  trabalho: 'Trabalho novo', promocao: 'Promoção', desemprego: 'Fase de recomeço', casa: 'Casa nova', amor: 'Namorando',
  filho: 'Bem-vindo, bebê', lugar: 'Mudança', saude: 'Cuidando da saúde', perda: 'Luto', estudo: 'Conquista', escola: 'Escola'
};

interface EventoFama { id: string; quem: string; texto: string; onde: Lugar15; custo: number; fama: number }
const EVENTOS: EventoFama[] = [
  { id: 'estreia', quem: 'Produtora (convite)', texto: '"Você está convidad{o} para a pré-estreia do filme mais esperado do ano. Tapete vermelho às 19h."', onde: 'evento', custo: 0, fama: 2 },
  { id: 'premio', quem: 'Organização do prêmio', texto: '"Gostaríamos de contar com a sua presença na noite de premiação. Mesa reservada."', onde: 'evento', custo: 0, fama: 2 },
  { id: 'festa_fechada', quem: 'Uma assessoria', texto: '"Festa fechada, só convidados, numa cobertura. O seu nome está na lista."', onde: 'festa', custo: 0, fama: 2 },
  { id: 'desfile', quem: 'Uma grife', texto: '"Primeira fila no desfile da nova coleção — e o look da noite é por nossa conta."', onde: 'evento', custo: 0, fama: 3 },
  { id: 'baile', quem: 'Comitê do baile beneficente', texto: '"Baile de gala beneficente: a mesa custa caro, mas a causa é boa — e todo mundo vai estar lá."', onde: 'evento', custo: 3000, fama: 3 },
  { id: 'iate', quem: 'Um empresário conhecido', texto: '"Fim de semana no meu barco, com uns amigos do meio. Vai ser discreto. Vem?"', onde: 'praia', custo: 0, fama: 3 }
];

const AREAS: AreaCelebridade15[] = ['musica', 'tv', 'cinema', 'esporte', 'internet', 'moda', 'negocios'];
export const ROTULO_AREA15: Record<AreaCelebridade15, [string, string]> = {
  musica: ['cantor', 'cantora'], tv: ['apresentador de TV', 'apresentadora de TV'], cinema: ['ator', 'atriz'], esporte: ['atleta', 'atleta'],
  internet: ['influenciador', 'influenciadora'], moda: ['modelo', 'modelo'], negocios: ['empresário', 'empresária']
};

/** A pessoa famosa do convite: idade perto da sua, gênero pelo acaso (às vezes pelo seu interesse). */
function molde(v: Vida, r: Rng, fama: number): Molde15 {
  const at = v.eu.atracao;
  const genero = at && r.chance(0.5) ? (at === 'homens' ? 'masculino' : at === 'mulheres' ? 'feminino' : r.chance(0.5) ? 'masculino' : 'feminino') : r.chance(0.5) ? 'masculino' : 'feminino';
  const i = idade(v);
  const id = clamp(i + r.int(-8, 8), 18, 85);
  const pais = municipio(v.moradia.municipioId).pais;
  const nome = sortearNome(r, genero, anoDe(v.t) - id, pais);
  return { nome, sobrenome: sortearSobrenome(r, pais), genero, idade: id, area: r.pick(AREAS), nivel: (fama >= 4 ? 3 : fama >= 3 ? r.pick([2, 3]) : r.pick([1, 2])) as 1 | 2 | 3 };
}

/* ------------------------------------------------------------------ O ano */

const POR_ANO = (v: Vida) => (idade(v) < 13 ? 1 : 2) + (nivelDaFama15(v) >= 2 ? 1 : 0);

/** A prioridade das mensagens da VIDA 15 na cota do ano (o acaso e o ruído ficam por último). */
const PRIORIDADE15: Partial<Record<TipoMsg15, Prioridade17>> = { parceiro: 'alta', fa: 'baixa', evento: 'baixa' };

/**
 * Escolhe e grava até `n` mensagens novas (sem repetir pessoa, nem a que já espera resposta). VIDA 17: as situações
 * novas entram no mesmo sorteio, e cada mensagem consome uma vaga da cota do ano (`receber17`): sem vaga, não chega.
 */
function entregar(v: Vida, r: Rng, n: number, onda: number): Msg15[] {
  const c = celularDe(v);
  const ja = new Set(c.msgs.filter(m => !m.resposta && m.de).map(m => m.de!));
  const out: Msg15[] = [];
  const tipos = new Set<TipoMsg15>();
  const fama = nivelDaFama15(v);
  for (let k = 0; k < n; k++) {
    if (!podeReceber17(v, 'alta')) break;
    const todos: Candidato[] = [...candidatos(v, ja), ...candidatos17(v, ja, fama)];
    const lista = todos.filter(x => !tipos.has(x.tipo) && podeReceber17(v, x.prioridade ?? PRIORIDADE15[x.tipo] ?? 'normal'));
    if (!lista.length) break;
    const x = r.weighted(lista, y => y.peso);
    if (!x) break;
    const mes = receber17(v, x.prioridade ?? PRIORIDADE15[x.tipo] ?? 'normal');
    if (mes === undefined) break;
    const base = x.montar(r);
    const m: Msg15 = { id: `m${anoDe(v.t)}_${onda}_${k}_${c.msgs.length}`, t: v.t, tipo: x.tipo, onda, mes17: mes, ...base };
    if (m.texto.includes('{o}')) m.texto = m.texto.replace(/\{o\}/g, flex(v.eu.genero, 'o', 'a', 'e'));
    if (v.era) m.texto = textoDaEpoca(v, m.texto); // ERAS HISTÓRICAS: o recado fala do jeito da época
    c.msgs.push(m);
    aoChegar17(v, m);
    out.push(m);
    tipos.add(x.tipo);
    if (x.p) { ja.add(x.p.id); v.fatos[`cel15_${x.p.id}`] = v.t; }
    if (x.tipo === 'noticia' && x.p && base.assunto) v.fatos[`cel15n_${x.p.id}_${base.assunto.split(':')[1]}`] = v.t;
    if (x.tipo === 'ex' && x.p) v.fatos[`cel15ex_${x.p.id}`] = v.t;
    if (x.tipo === 'reencontro' && x.p) v.fatos[`cel15r_${x.p.id}`] = v.t;
    if (['proposta', 'fa', 'evento', 'imprensa'].includes(x.tipo)) v.fatos[`cel15_${x.tipo}`] = v.t;
    if (x.tipo === 'celebridade') v.fatos['cel15_celeb'] = v.t;
    if (x.tipo === 'parceiro') v.fatos['cel15_par'] = v.t;
  }
  return out;
}

/**
 * A virada do ano no celular: as mensagens antigas sem resposta saem (o silêncio também é resposta — leve), as
 * respondidas ficam como histórico; chegam as do ano novo. E as pessoas da vida que viraram notícia (a fama delas).
 */
export function processarCelular15(v: Vida): void {
  if (!temCelular15(v)) return;
  const c = celularDe(v);
  const ano = anoDe(v.t);
  if (c.ano === ano && c.msgs.some(m => m.onda === 0 && anoDe(m.t) === ano)) return;
  // O que ficou sem resposta no ano que passou sai do aparelho (o silêncio não pune: a relação segue pelo convívio de sempre).
  // VIDA 16: o que sai do ano vai para o histórico (`mensagens16`) — a conversa não some.
  const fica = (m: Msg15) => (m.resposta ? v.t - m.t <= 36 : anoDe(m.t) >= ano - 1 && v.t - m.t <= 12);
  // VIDA 17: o desabafo, a mágoa, a paquera que ficaram sem resposta podem voltar como cobrança.
  semResposta17(v, c.msgs.filter(m => !fica(m)));
  arquivarMsgs16(v, c.msgs.filter(m => !fica(m)));
  c.msgs = c.msgs.filter(fica);
  if (c.msgs.length > 60) arquivarMsgs16(v, c.msgs.splice(0, c.msgs.length - 60));
  c.ano = ano;
  // VIDA 16: o rastro do aplicativo envelhece (o de outra parceria não vale mais).
  esquecerRastro16(v);
  c.ondas = 0;
  c.acoesNoAno = 0;
  c.encontrosNoAno = 0;
  const r = rngDe(v.id, 'celular15', v.t);
  // VIDA 17: preso, nada chega ao aparelho retido (o sorteio do mundo segue: as pessoas da vida continuam vivendo).
  if (preso17(v)) { vidasQueViramNoticia(v, r); return; }
  vidasQueViramNoticia(v, r);
  repercutirCasalFamoso(v);
  // Nem todo ano o telefone toca: quem tem pouca gente perto recebe pouco.
  const gente = vinculosVivos(v).filter(x => humano(x.p) && x.vin.proximidade >= 35).length;
  // VIDA 17: a virada leva no máximo 2 (o resto do ano chega aos poucos, durante as escolhas; cota de 4 no total).
  const n = Math.min(2, POR_ANO(v), (r.chance(0.55) ? 1 : 0) + (gente >= 4 ? 1 : 0) + (nivelDaFama15(v) >= 2 ? 1 : 0));
  entregar(v, r, n, 0);
}

/**
 * Pessoas com vida própria (§2.4): quem trabalha com palco, tela, esporte ou rede pode ficar conhecido — e isso fica
 * na trajetória dela (a "Vida deles", a notícia, a mensagem) e na pessoa (`celebridade15`), sem contradição depois.
 */
const OFICIO_DE_FAMA = /(músic|cantor|cantora|ator|atriz|jogador|jogadora|atleta|influenc|youtuber|modelo|apresentador|apresentadora|escritor|escritora|comediante|chef|dj|lutador|lutadora|tenista|piloto|dançarin|bailarin)/i;
function vidasQueViramNoticia(v: Vida, r: Rng): void {
  for (const { p, vin } of vinculosVivos(v)) {
    if (!humano(p) || p.celebridade15 || !p.ocupacao || !OFICIO_DE_FAMA.test(p.ocupacao)) continue;
    const ip = idadePessoa(v, p);
    if (ip < 16 || ip > 60) continue;
    if (vin.proximidade < 25 && !vin.parentesco) continue;
    if (!r.chance(0.025)) continue;
    const area: AreaCelebridade15 = /músic|cantor|dj/i.test(p.ocupacao) ? 'musica' : /ator|atriz|comediante/i.test(p.ocupacao) ? 'cinema' : /influenc|youtuber/i.test(p.ocupacao) ? 'internet' : /modelo/i.test(p.ocupacao) ? 'moda' : /apresentador/i.test(p.ocupacao) ? 'tv' : 'esporte';
    p.celebridade15 = { area, nivel: 1, desde: v.t };
    garantirVida(p).trajetoria.push({ t: v.t, texto: `Ficou conhecid${o(p)} como ${p.ocupacao}: o nome começou a sair nas notícias.`, tipo: 'trabalho' });
  }
}

/** O casal em que alguém é famoso vira assunto: o nome cresce um pouco (para os dois), a privacidade diminui. */
function repercutirCasalFamoso(v: Vida): void {
  const par = parceiro(v);
  if (!par?.p.celebridade15) return;
  const f = origemDoNome(v) ?? 'arte';
  somarAoNome(v, f, 1 + par.p.celebridade15.nivel);
}

/* ------------------------------------------------------------------ Durante o ano */

/** As ações que levam a um LUGAR (e o lugar). Só essas podem pôr alguém conhecido no caminho. */
function lugarDaAcao(a: { tipo: string; [k: string]: unknown }): Lugar15 | undefined {
  switch (a.tipo) {
    case 'experiencia': return String(a.id ?? '').startsWith('viagem') ? 'aeroporto' : undefined;
    case 'viagem14': return 'aeroporto';
    case 'encontro': return 'restaurante';
    case 'conquistas14': return 'restaurante';
    case 'comprar_item': case 'comprar_coisa': return 'shopping';
    case 'conhecer_alguem': case 'fazer_amizade': return a.contexto === 'noite' ? 'bar' : undefined;
    default: return undefined;
  }
}

/**
 * Chamado pelas ações (dentro da transação, depois de a ação acontecer): o ano anda com o que você faz. Depois da 3ª e
 * da 7ª escolha do ano, chega mais alguém; ir a um lugar pode pôr alguém conhecido no caminho (no máximo 3 por ano).
 */
export function depoisDaAcao15(v: Vida, a: { tipo: string; [k: string]: unknown }): void {
  if (!temCelular15(v) || v.justica?.prisao || v.morte) return;
  const c = celularDe(v);
  if (c.ano !== anoDe(v.t)) return;
  const q = a.tipo === 'celular15' ? a.oque as { op?: string; escolha?: string; id?: string } : undefined;
  if (q && ['ler', 'passar', 'curtir', 'namoro_abrir', 'namoro_mais', 'curtir_post', 'desfazer'].includes(q.op ?? '')) return;
  // VIDA 19: mexer na rede dos outros (curtir, comentar, conversar sobre um post) é como rolar o feed — não move o ano.
  if (a.tipo === 'conectada19') return;
  c.acoesNoAno = (c.acoesNoAno ?? 0) + 1;
  const onda = c.ondas ?? 0;
  if ((c.acoesNoAno === 3 && onda === 0) || (c.acoesNoAno === 7 && onda <= 1)) {
    c.ondas = onda + 1;
    const r = rngDe(v.id, 'celular15_onda', v.t, c.ondas);
    // VIDA 17: uma por onda (o sorteio do "2" segue sendo feito, para não mudar o acaso do resto).
    if (r.chance(0.6)) { r.chance(0.2); entregar(v, r, 1, c.ondas); }
  }
  // Um convite aceito leva ao lugar do programa (a praia, o show, o restaurante, o evento).
  const aceita = q?.op === 'responder' && ['aceitar', 'ir', 'marcar'].includes(q.escolha ?? '') ? c.msgs.find(m => m.id === q.id) : undefined;
  const lugar = aceita ? aceita.onde : lugarDaAcao(a);
  if (!lugar || (c.encontrosNoAno ?? 0) >= 3) return;
  const r = rngDe(v.id, 'celular15_acaso', v.t, c.acoesNoAno);
  if (!r.chance(lugar === 'aeroporto' ? 0.3 : 0.2)) return;
  const m = encontroPorAcaso(v, r, lugar);
  // VIDA 17: o acaso também é mensagem — só chega se sobrar cota (prioridade baixa: precisa de duas vagas).
  if (m) { const mes = receber17(v, 'baixa'); if (mes === undefined) return; m.mes17 = mes; if (v.era) m.texto = textoDaEpoca(v, m.texto); c.msgs.push(m); c.encontrosNoAno = (c.encontrosNoAno ?? 0) + 1; }
}

const ONDE: Record<Lugar15, string> = {
  restaurante: 'no restaurante', festa: 'na festa', aeroporto: 'no aeroporto', praia: 'na praia', evento: 'no evento', shopping: 'no shopping',
  cinema: 'na fila do cinema', show: 'no show', bar: 'no bar', parque: 'no parque', academia: 'na academia', mercado: 'no mercado', rua: 'na rua'
};
export const rotuloDoLugar15 = (l: Lugar15) => ONDE[l];

/** Alguém da vida (ou um fã, quando há fama) aparece no mesmo lugar. */
function encontroPorAcaso(v: Vida, r: Rng, lugar: Lugar15): Msg15 | undefined {
  const fama = nivelDaFama15(v);
  const id = `e${anoDe(v.t)}_${celularDe(v).msgs.length}`;
  if (fama >= 2 && r.chance(0.25 + fama * 0.1)) {
    return { id, t: v.t, tipo: 'fa', onda: 9, onde: lugar, remetente: 'Um fã', assunto: 'foto', texto: `${cap(ONDE[lugar])}, alguém reconheceu você e chegou tremendo: "Posso tirar uma foto? Desculpa, é que eu sou muito seu fã."` };
  }
  const cidade = v.moradia.municipioId;
  const pool = vinculosVivos(v).filter(({ p, vin }) => humano(p) && !moraJunto(vin) && idadePessoa(v, p) >= 8 && !vin.chamado
    && (lugar === 'aeroporto' || p.municipioId === cidade) && !(vin.ruptura && vin.estagio !== 'ex_amigo'));
  if (!pool.length) return undefined;
  const x = r.weighted(pool, ({ p, vin }) => {
    const papel = papelDe(p, vin);
    const sem = (v.t - vin.tUltimoContato) / 12;
    return (papel === 'ex' ? 0.7 : papel === 'afastado' || papel === 'ex_amigo' ? 0.8 : papel === 'conhecido' || papel === 'colega' ? 0.6 : 1) * (0.4 + Math.min(2, sem * 0.4)) + (p.celebridade15 ? 0.6 : 0);
  });
  if (!x) return undefined;
  const papel = papelDe(x.p, x.vin);
  const anos = Math.round((v.t - x.vin.tUltimoContato) / 12);
  const quanto = anos >= 2 ? ` — fazia ${anos} anos que vocês não se viam` : '';
  const texto = papel === 'ex' ? `${cap(ONDE[lugar])}, você deu de cara com ${x.p.nome}${quanto}. Um segundo de silêncio, os dois sem saber o que fazer com as mãos.`
    : papel === 'genitor' || papel === 'irmao' || papel === 'avo' || papel === 'filho' ? `${cap(ONDE[lugar])}, quem aparece? ${x.p.nome}, por acaso. Riram da coincidência.`
      : `${cap(ONDE[lugar])}, alguém chamou o seu nome: era ${x.p.nome}${quanto}.`;
  return { id, t: v.t, tipo: 'encontro', onda: 9, de: x.p.id, onde: lugar, texto };
}

/* ------------------------------------------------------------------ As respostas */

export interface OpcaoMsg15 { op: string; rotulo: string; veredito: Veredito }

/** As respostas que fazem sentido para ESTA mensagem (com o porquê, quando não dá). */
export function opcoesDaMsg15(v: Vida, m: Msg15): OpcaoMsg15[] {
  if (m.resposta || !mensagemViva(v, m)) return [];
  if (ehTipo17(m.tipo)) return opcoes17(v, m);
  return [...opcoesDaMsg15Base(v, m), ...extrasDaVida15(v, m)];
}

function opcoesDaMsg15Base(v: Vida, m: Msg15): OpcaoMsg15[] {
  const p = m.de ? v.pessoas[m.de] : undefined;
  const pagar = (x: number | undefined, t: string): Veredito => (x ? vereditoDePagar(v, x, t) : PERMITIDO);
  const ok = PERMITIDO;
  const par = parceiro(v);
  const exclusivo = !!par && !acordoConsentido(par.vin.romance);
  switch (m.tipo) {
    case 'convite': return [
      { op: 'aceitar', rotulo: 'Topar', veredito: pagar(m.custo, 'O programa custa uns') },
      { op: 'outro_dia', rotulo: 'Sugerir outro dia', veredito: ok },
      { op: 'recusar', rotulo: 'Agradecer e recusar', veredito: ok }];
    case 'saudade': return [
      { op: 'ligar', rotulo: 'Ligar e conversar com calma', veredito: ok },
      { op: 'marcar', rotulo: 'Marcar de se ver', veredito: pagar(80, 'Encontrar custa uns') },
      { op: 'curto', rotulo: 'Responder rapidinho', veredito: ok }];
    case 'noticia': return [
      { op: 'ligar', rotulo: m.assunto?.startsWith('desemprego') || m.assunto?.startsWith('perda') || m.assunto?.startsWith('saude') ? 'Ligar e oferecer apoio' : 'Ligar para comemorar', veredito: ok },
      { op: 'curto', rotulo: 'Mandar um coração', veredito: ok }];
    case 'parceiro': return [
      { op: 'aceitar', rotulo: 'Topar', veredito: pagar(m.custo, 'O programa custa uns') },
      { op: 'adiar', rotulo: 'Pedir para deixar para depois', veredito: ok }];
    case 'reencontro': return [
      { op: 'marcar', rotulo: 'Marcar um café', veredito: pagar(40, 'O café custa uns') },
      { op: 'conversar', rotulo: 'Conversar por mensagem', veredito: ok },
      { op: 'ignorar', rotulo: 'Deixar sem resposta', veredito: ok }];
    case 'ex': return [
      { op: 'cordial', rotulo: 'Responder com cordialidade', veredito: ok },
      { op: 'marcar', rotulo: 'Topar o café', veredito: exclusivo ? { grau: 'irregular', motivo: `Você está com ${par!.p.nome}: um café com ${p?.nome ?? 'o ex'} pode ser mal entendido.` } : ok },
      { op: 'ignorar', rotulo: 'Deixar sem resposta', veredito: ok }];
    case 'proposta': return [
      { op: 'aceitar', rotulo: m.texto.includes('extra') ? 'Aceitar o trabalho extra' : 'Aceitar a indicação', veredito: v.justica?.prisao ? bloqueio('impossivel', 'Não daqui.') : ok },
      { op: 'recusar', rotulo: 'Agradecer e recusar', veredito: ok }];
    case 'fa': return [
      { op: 'atender', rotulo: m.assunto === 'foto' ? 'Tirar a foto, com um sorriso' : 'Responder com carinho', veredito: ok },
      { op: 'recusar', rotulo: m.assunto === 'foto' ? 'Recusar com educação' : 'Deixar para lá', veredito: ok }];
    case 'evento': return [
      { op: 'ir', rotulo: 'Ir', veredito: pagar(m.custo, 'A mesa custa') },
      { op: 'recusar', rotulo: 'Declinar', veredito: ok }];
    case 'celebridade': return [
      { op: 'aceitar', rotulo: 'Responder e marcar', veredito: ok },
      { op: 'recusar', rotulo: 'Agradecer, sem marcar nada', veredito: ok }];
    case 'imprensa': return [
      { op: 'confirmar', rotulo: 'Confirmar o relacionamento', veredito: ok },
      { op: 'sem_comentar', rotulo: '"Sem comentários"', veredito: ok },
      { op: 'negar', rotulo: 'Negar', veredito: ok }];
    case 'encontro': return [
      { op: 'conversar', rotulo: 'Parar para conversar', veredito: ok },
      { op: 'cumprimentar', rotulo: 'Cumprimentar e seguir', veredito: ok },
      { op: 'desviar', rotulo: 'Fingir que não viu', veredito: ok }];
    // VIDA 16: o que você escreveu e os chamados guardados não pedem resposta aqui.
    case 'escrita': case 'chamado': return [];
  }
  return [];
}

const humor = (v: Vida, feliz: number, estresse = 0) => {
  v.mente.felicidade = clamp(Math.round(v.mente.felicidade + feliz));
  v.mente.estresse = clamp(Math.round(v.mente.estresse + estresse));
};
const perto = (vin: Vinculo | undefined, n: number, contato = true, t?: number) => {
  if (!vin) return;
  vin.proximidade = clamp(Math.round(vin.proximidade + n));
  if (contato && t !== undefined) vin.tUltimoContato = t;
};

export interface SaidaCelular15 { texto: string; titulo?: string; pessoaId?: string; tom?: 'bom' | 'ruim' | 'neutro' }

/** A resposta: muda a relação, custa o que custa, fica na história dos dois (e na Linha da Vida, quando importa). */
export function responderMsg15(v: Vida, r: Rng, m: Msg15, op: string): SaidaCelular15 {
  // VIDA 17: as situações novas e as respostas extras são respondidas lá.
  const r17 = responder17(v, r, m, op);
  if (r17) return r17;
  const p = m.de ? v.pessoas[m.de] : undefined;
  const vin = m.de ? v.vinculos[m.de] : undefined;
  const nome = p?.nome ?? m.remetente ?? 'Alguém';
  const pagar = () => { if (m.custo) v.financas.conta -= m.custo; };
  let texto = '';
  let tom: SaidaCelular15['tom'] = 'neutro';
  let pessoaId = p?.id;
  switch (m.tipo) {
    case 'convite': case 'parceiro': {
      if (op === 'aceitar') {
        pagar();
        humor(v, r.int(3, 6), -r.int(2, 5));
        perto(vin, m.tipo === 'parceiro' ? 3 : r.int(4, 7), true, v.t);
        if (vin) vin.tensao = clamp(vin.tensao - 3);
        if (m.tipo === 'parceiro' && vin?.romance) { vin.romance.envolvimento = clamp(vin.romance.envolvimento + 4); }
        lembrarCom(v, p!.id, m.tipo === 'parceiro' ? `Um programa a dois: ${nomeDoAssunto(m)}.` : `Saíram juntos: ${nomeDoAssunto(m)}.`, m.tipo === 'parceiro' ? 'romance' : 'amizade', 1);
        const prg = [...PROGRAMAS, ...A_DOIS].find(x => x.id === m.assunto);
        texto = `${cap(prg?.nome ?? 'o programa')}, com ${p!.nome}. ${prg ? r.pick(prg.feito) : 'Foi bom.'}${m.tipo === 'parceiro' ? ` Foi bom ter ${p!.nome} só para você por umas horas.` : ''}`;
        tom = 'bom';
        // Num programa com gente, às vezes se conhece alguém (fica como conhecido; o resto é com o tempo).
        const pr = PROGRAMAS.find(x => x.id === m.assunto);
        if (pr?.social && idade(v) >= 12 && r.chance(0.3)) {
          const eu = idade(v);
          const novo = criarPessoa(v, r, { idade: clamp(eu + r.int(-4, 5), Math.max(8, eu - 6), 90), municipioId: v.moradia.municipioId });
          const nv = vincular(v, novo, { origem: 'apresentado', proximidade: r.int(20, 30), estagio: 'conhecido' });
          nv.contexto = novoContexto('amigos', {});
          registrarFase(v, nv, 'conhecido');
          lembrarCom(v, novo.id, `Conheceram-se por ${p!.nome}.`, 'inicio', 1);
          texto += ` Lá, ${p!.nome} apresentou ${novo.nome}: a conversa rendeu.`;
        }
        if (m.custo && m.custo >= 500) escrever(v, { texto: `${cap(nomeDoAssunto(m))} com ${p!.nome}.`, relevancia: 'cotidiano', tema: m.tipo === 'parceiro' ? 'amor' : 'lazer', escolha: true, pessoas: [p!.id] });
      } else if (op === 'outro_dia') {
        perto(vin, 1, true, v.t);
        // VIDA 17: a promessa fica — e pode voltar como cobrança se ninguém marcar.
        deixarFio17(v, { pid: p!.id, tipo: 'promessa', t: v.t, dado: nomeDoAssunto(m) });
        texto = `"Esse fim de semana não dá — mas a gente marca, prometo." ${p!.nome} mandou um "combinado!".`;
      } else if (op === 'adiar') {
        if (vin?.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento - 2);
        deixarFio17(v, { pid: p!.id, tipo: 'promessa', t: v.t, dado: nomeDoAssunto(m) });
        texto = `${p!.nome} disse "tudo bem". O tom não era de tudo bem.`;
      } else {
        perto(vin, -1, false);
        texto = `Você agradeceu e recusou. ${p!.nome} respondeu com um emoji — difícil saber de que tipo.`;
      }
      break;
    }
    case 'saudade': case 'noticia': {
      const apoio = m.assunto?.startsWith('desemprego') || m.assunto?.startsWith('perda') || m.assunto?.startsWith('saude');
      if (op === 'ligar') {
        perto(vin, r.int(3, 6), true, v.t);
        if (vin) vin.confianca = clamp(vin.confianca + 2);
        humor(v, 2);
        lembrarCom(v, p!.id, apoio ? 'Ligou para dar apoio num momento difícil.' : m.tipo === 'noticia' ? 'Ligou para comemorar uma conquista.' : 'Uma ligação comprida, depois de muito tempo.', apoio ? 'apoio' : 'amizade', 1);
        texto = apoio ? `A ligação com ${p!.nome} durou mais de uma hora. No fim, ${ele(p!)} disse que precisava ouvir aquilo.` : m.tipo === 'noticia' ? `Você ligou para comemorar. ${p!.nome} ficou feliz de você ter lembrado.` : `Conversaram como se fosse ontem. ${p!.nome} desligou dizendo "a gente não pode deixar passar tanto tempo".`;
        tom = 'bom';
      } else if (op === 'marcar') {
        v.financas.conta -= 80;
        perto(vin, r.int(6, 9), true, v.t);
        humor(v, 4, -2);
        lembrarCom(v, p!.id, 'Marcaram de se ver depois de muito tempo.', 'reconciliacao', 1);
        texto = `Vocês se viram naquele mesmo mês. ${p!.nome} ${r.pick(['estava igual — só o cabelo, diferente', 'tinha mil histórias para contar', 'chorou um pouco na despedida'])}.`;
        tom = 'bom';
      } else {
        perto(vin, 1, true, v.t);
        texto = m.tipo === 'noticia' ? `Você mandou um coração. ${p!.nome} visualizou.` : `"Tudo ótimo por aqui, e você?" — e a conversa parou por aí.`;
      }
      break;
    }
    case 'reencontro': {
      if (op === 'marcar') {
        v.financas.conta -= 40;
        perto(vin, r.int(8, 12), true, v.t);
        if (vin && vin.proximidade >= 40 && (vin.estagio === 'conhecido' || vin.estagio === 'colega' || vin.estagio === 'afastado')) { vin.estagio = 'amigo'; registrarFase(v, vin, 'amigo'); }
        lembrarCom(v, p!.id, `O reencontro, anos depois (${m.assunto ?? 'de outra época'}).`, 'antigo', 1);
        escrever(v, { texto: `Reencontrou ${p!.nome}, ${m.assunto ?? 'de outra época'}, depois de anos.`, relevancia: 'cotidiano', tema: 'amizade', escolha: true, pessoas: [p!.id] });
        texto = `O café virou almoço. Vocês riram das mesmas histórias e descobriram que ${p!.nome} ${r.pick(['mora a três quadras de você', 'mudou completamente de vida', 'guardou uma foto de vocês da época'])}.`;
        tom = 'bom';
      } else if (op === 'conversar') { perto(vin, 3, true, v.t); texto = `Trocaram mensagens por uns dias: as fotos antigas, quem casou, quem sumiu.`; }
      else texto = 'A mensagem ficou lá, sem resposta.';
      break;
    }
    case 'ex': {
      if (op === 'marcar') {
        perto(vin, 6, true, v.t);
        if (vin) vin.tensao = clamp(vin.tensao - 10);
        const par = parceiro(v);
        const exclusivo = !!par && !acordoConsentido(par.vin.romance);
        if (exclusivo && r.chance(0.35)) {
          par!.vin.tensao = clamp(par!.vin.tensao + 15);
          par!.vin.confianca = clamp(par!.vin.confianca - 8);
          lembrarCom(v, par!.p.id, `Soube do café com ${p!.nome}.`, 'conflito', 2);
          texto = `O café com ${p!.nome} foi tranquilo. ${par!.p.nome} soube — e a conversa em casa não foi.`;
          tom = 'ruim';
        } else if (!par && vin && atraiGenero(v.eu.atracao, p!.genero) && atraiGenero(p!.atracao, v.eu.genero) && !p!.parceiroId && podeTerRomance(v, p!, vin) && r.chance(0.3 + compatibilidade(v, p!) * 0.3)) {
          vin.romance = { ...(vin.romance ?? { tEstagio: v.t, envolvimento: 55 }), estagio: 'interesse', tEstagio: v.t, envolvimento: 58 };
          registrarFase(v, vin, 'reconciliacao');
          lembrarCom(v, p!.id, 'Um café, anos depois — e alguma coisa voltou.', 'romance', 2);
          texto = `O café durou a tarde inteira. Na despedida, ficou no ar uma coisa que os dois conhecem bem.`;
          tom = 'bom';
        } else {
          lembrarCom(v, p!.id, 'Um café, anos depois: as pazes com o passado.', 'reconciliacao', 1);
          texto = `Foi bom. Estranho, mas bom: deu para falar do que acabou sem doer como antes.`;
        }
      } else if (op === 'cordial') { perto(vin, 2, true, v.t); if (vin) vin.tensao = clamp(vin.tensao - 4); texto = `"Tô bem, sim. Espero que você também." Educado e curto.`; }
      else texto = 'Você leu e deixou lá. Tem coisas que é melhor não mexer.';
      break;
    }
    case 'proposta': {
      if (op === 'aceitar') {
        const base = Math.max(1200, Math.round((v.trabalho.atual?.salario ?? 2500) * 0.8));
        if (m.assunto === 'extra' && m.texto.includes('extra')) {
          v.financas.conta += base;
          humor(v, 1, 6);
          perto(vin, 3, true, v.t);
          lembrarCom(v, p!.id, 'Indicou um trabalho extra.', 'trabalho', 1);
          texto = `Foram semanas puxadas, noites incluídas — e um pagamento de ${base.toLocaleString('pt-BR')} na conta.`;
          tom = 'bom';
        } else {
          perto(vin, 3, true, v.t);
          if (vin) vin.confianca = clamp(vin.confianca + 3);
          v.fatos['indicado_cel15'] = v.t;
          lembrarCom(v, p!.id, 'Indicou o seu nome para um trabalho.', 'trabalho', 1);
          texto = `${p!.nome} passou o seu nome adiante. Quando uma vaga aparecer, uma indicação pesa — e ${ele(p!)} lembrou de você.`;
          tom = 'bom';
        }
      } else texto = `Você agradeceu. ${p!.nome} disse que a porta fica aberta.`;
      break;
    }
    case 'fa': {
      if (op === 'atender') {
        humor(v, 2);
        contarReacao(v, 'fa_atendido');
        texto = m.assunto === 'foto' ? 'A foto saiu tremida, o abraço foi apertado. A pessoa saiu dizendo que ia guardar para sempre.' : 'Você respondeu. Do outro lado, um print com a legenda "ELE(A) RESPONDEU" rodou o dia inteiro.'.replace('ELE(A)', flex(v.eu.genero, 'ELE', 'ELA', 'ELU'));
        tom = 'bom';
      } else {
        contarReacao(v, 'fa_recusado');
        if (r.chance(0.2)) { somarAoNome(v, origemDoNome(v) ?? 'rede', -1); texto = 'Você recusou com educação. Mesmo assim, alguém postou que você foi "metid' + flex(v.eu.genero, 'o', 'a', 'e') + '".'; tom = 'ruim'; }
        else texto = 'Você agradeceu e explicou que não dava. A pessoa entendeu.';
      }
      break;
    }
    case 'evento': case 'celebridade': {
      if (op === 'ir' || op === 'aceitar') {
        if (m.custo) v.financas.conta -= m.custo;
        humor(v, 3, 2);
        if (m.tipo === 'evento') somarAoNome(v, origemDoNome(v) ?? 'arte', 1);
        const c = m.molde ? conhecerCelebridade(v, r, m.molde, m.tipo === 'evento' ? 'evento' : 'online') : undefined;
        pessoaId = c?.p.id;
        texto = m.tipo === 'evento'
          ? `${cap(ONDE[m.onde ?? 'evento'])}: flashes, gente que você só conhecia da tela. ${c ? `Na saída, ${c.p.nome} (${rotuloArea(c.p)}) puxou conversa${c.faisca ? ' — e o olhar demorou mais do que o normal' : ''}. Trocaram contato.` : ''}`
          : `Marcaram um café discreto. ${c ? `${c.p.nome} é mais engraçad${o(c.p)} do que parece na tela${c.faisca ? ' — e a conversa foi além do profissional' : ''}.` : ''}`;
        escrever(v, { texto: m.tipo === 'evento' ? `Foi a um evento de gente famosa${c ? ` e conheceu ${c.p.nome}` : ''}.` : `Conheceu ${c?.p.nome ?? 'uma pessoa famosa'}.`, relevancia: 'cotidiano', tema: 'lazer', escolha: true, pessoas: c ? [c.p.id] : undefined });
        tom = 'bom';
      } else texto = m.tipo === 'evento' ? 'Você declinou. A foto do evento saiu nas colunas sem você — e tudo bem.' : 'Você agradeceu com simpatia, sem marcar nada.';
      break;
    }
    case 'imprensa': {
      const alvo = m.assunto ? v.pessoas[m.assunto] : undefined;
      const av = m.assunto ? v.vinculos[m.assunto] : undefined;
      if (op === 'confirmar') {
        somarAoNome(v, origemDoNome(v) ?? 'arte', 2);
        if (av?.romance) av.romance.envolvimento = clamp(av.romance.envolvimento + 4);
        texto = `A notícia saiu com a sua confirmação: "${v.eu.nome} e ${alvo?.nome ?? 'o par'} assumem o romance". ${alvo?.nome ?? 'A pessoa'} gostou de não ser escondid${alvo ? o(alvo) : 'o'}.`;
        tom = 'bom';
      } else if (op === 'negar') {
        if (av?.romance && ['namoro', 'morando_junto', 'casamento'].includes(av.romance.estagio)) { av.tensao = clamp(av.tensao + 12); av.romance.envolvimento = clamp(av.romance.envolvimento - 5); texto = `Você negou. ${alvo?.nome} leu a matéria — e não gostou nada de ser "só amizade".`; tom = 'ruim'; }
        else texto = 'Você negou. A matéria saiu mesmo assim, com um "fontes próximas dizem que...".';
      } else texto = 'A matéria saiu com o seu "sem comentários" — o que, na prática, comentou tudo.';
      contarReacao(v, `imprensa_${op}`);
      break;
    }
    case 'encontro': {
      const papel = p && vin ? papelDe(p, vin) : 'conhecido';
      if (op === 'conversar') {
        perto(vin, papel === 'ex' ? 2 : r.int(4, 7), true, v.t);
        if (vin && papel === 'ex') vin.tensao = clamp(vin.tensao - 6);
        lembrarCom(v, p!.id, `Encontraram-se por acaso ${ONDE[m.onde ?? 'rua']}.`, papel === 'ex' ? 'reconciliacao' : 'amizade', 1);
        texto = papel === 'ex' ? `Conversaram uns minutos, educados. Na despedida, um "se cuida" sincero.` : `Ficaram meia hora ali mesmo, ${ONDE[m.onde ?? 'rua']}. Saíram com a promessa de marcar — e o número salvo de novo.`;
        tom = 'bom';
      } else if (op === 'cumprimentar') { perto(vin, 1, true, v.t); texto = `Um aceno, um "quanto tempo!", cada um para o seu lado.`; }
      else { perto(vin, papel === 'amigo' || papel === 'amigo_proximo' ? -3 : 0, false); texto = `Você olhou para o outro lado. ${papel === 'amigo' || papel === 'amigo_proximo' ? `${p!.nome} viu — e percebeu.` : 'Ninguém percebeu. Talvez.'}`; }
      break;
    }
  }
  m.resposta = { op, t: v.t, texto };
  m.lida = true;
  return { texto, titulo: nome, pessoaId, tom };
}

const nomeDoAssunto = (m: Msg15) => [...PROGRAMAS, ...A_DOIS].find(x => x.id === m.assunto)?.nome ?? 'um programa';
export const rotuloArea = (p: Pessoa) => (p.celebridade15 ? ROTULO_AREA15[p.celebridade15.area][p.genero === 'feminino' ? 1 : 0] : p.ocupacao ?? '');

function contarReacao(v: Vida, id: string): void {
  const f = (v.fama13 ??= {});
  const re = (f.reacoes ??= {});
  re[id] = (re[id] ?? 0) + 1;
}

/** A pessoa famosa entra na vida (com nome, ofício, cidade); às vezes, a faísca. */
export function conhecerCelebridade(v: Vida, r: Rng, m: Molde15, via: 'evento' | 'online'): { p: Pessoa; vin: Vinculo; faisca: boolean } {
  const p = criarPessoa(v, r, { idade: m.idade, genero: m.genero, municipioId: v.moradia.municipioId, nome: m.nome, sobrenome: m.sobrenome, ocupacao: ROTULO_AREA15[m.area][m.genero === 'feminino' ? 1 : 0], renda: 40000 * m.nivel });
  p.celebridade15 = { area: m.area, nivel: m.nivel, desde: v.t };
  const vin = vincular(v, p, { origem: via === 'online' ? 'online' : 'apresentado', proximidade: r.int(24, 34), estagio: 'conhecido' });
  vin.contexto = novoContexto(via === 'online' ? 'outro' : 'evento', {});
  registrarFase(v, vin, 'conhecido');
  lembrarCom(v, p.id, via === 'evento' ? 'Conheceram-se num evento.' : 'Conheceram-se por mensagem.', 'inicio', 1);
  let faisca = false;
  if (!parceiro(v) && v.eu.atracao && atraiGenero(v.eu.atracao, p.genero) && atraiGenero(p.atracao, v.eu.genero) && podeTerRomance(v, p, vin)) {
    const interesse = interesseInicial(v, p) + nivelDaFama15(v) * 3 + r.normal() * 8;
    if (interesse >= 55) { vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: Math.round(clamp(interesse)) }; faisca = true; }
  }
  return { p, vin, faisca };
}

/* ------------------------------------------------------------------ O aplicativo de namoro */

const INTERESSES = ['cinema', 'trilha', 'cozinhar', 'praia', 'séries', 'futebol', 'música ao vivo', 'livros', 'viajar', 'academia', 'cachorros', 'gatos', 'vinho', 'café', 'jogos', 'fotografia', 'dança', 'yoga', 'samba', 'rock', 'sertanejo', 'museus', 'corrida', 'bicicleta', 'bares', 'teatro', 'plantas', 'astrologia'];
const BIOS = [
  'Sem paciência para joguinho. Bom papo e um café já me ganham.',
  'Meio caseir{o}, meio aventureir{o}. Depende do dia (e do convite).',
  'Procurando alguém para dividir a pizza e as séries.',
  'Trabalho muito, rio mais ainda. Me conta a sua melhor história.',
  'Se você não gosta de cachorro, nem dá match.',
  'Recém-chegad{o} na cidade, me mostra os lugares bons?',
  'Sincer{o} demais, às vezes. Pontual sempre.',
  'Viajar é o meu salário. O resto é detalhe.',
  'Domingo de sol, roda de samba e gente boa. Simples assim.',
  'Já fui mais tímid{o}. Hoje mando o primeiro oi.'
];

/** O aplicativo de namoro: a partir dos 18, dizendo por quem se interessa. */
export function disponibilidadeNamoro15(v: Vida): Veredito {
  const i = idade(v);
  if (i < 18) return bloqueio('impossivel', 'Os aplicativos de namoro são a partir dos 18.');
  // ERAS HISTÓRICAS: antes de existirem (e de chegarem à pessoa), não há aplicativo de namoro.
  if (v.era && !existeNoBrasil(v, 'app_namoro')) return bloqueio('impossivel', `Ainda não existem aplicativos de namoro (chegam ao Brasil em ${anoNoBrasil('app_namoro')}).`);
  if (v.era && !temAcesso(v, 'app_namoro')) return bloqueio('requisito', 'Precisa de um smartphone com internet.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não daqui.');
  if (!v.eu.atracao) return bloqueio('requisito', 'Diga antes por quem você se interessa (em Pessoas).');
  // VIDA 16: o estado civil não bloqueia o aplicativo — o aviso diz o que está em jogo (`v16/romance/namoro16`).
  const aviso = avisoDoApp16(v);
  if (aviso) return { grau: 'irregular', motivo: aviso };
  const saindo = vinculosVivos(v).find(x => x.vin.romance?.estagio === 'saindo' && !foraDaParceria(x.vin.romance));
  if (saindo) return { grau: 'irregular', motivo: `Você está saindo com ${saindo.p.nome}: nada foi combinado, mas ${ele(saindo.p)} pode não gostar de saber.` };
  return PERMITIDO;
}

/** As conversas do aplicativo em andamento (match ou conversa). */
export function matches15(v: Vida): { p: Pessoa; vin: Vinculo; etapa: 'match' | 'conversa' | 'encontro' }[] {
  return vinculosVivos(v).filter(x => etapaDoApp(v, x.vin) && x.vin.contexto?.etapa !== 'encerrado').map(x => ({ ...x, etapa: x.vin.contexto!.etapa as 'match' | 'conversa' | 'encontro' }));
}

const TAMANHO_DO_DECK = 8;

function gerarPerfis(v: Vida, n: number, lote: number): PerfilApp15[] {
  const r = rngDe(v.id, 'namoro15', v.t, lote);
  const i = idade(v);
  const at = v.eu.atracao!;
  const out: PerfilApp15[] = [];
  for (let k = 0; k < n; k++) {
    const genero = at === 'homens' ? 'masculino' : at === 'mulheres' ? 'feminino' : r.chance(0.5) ? 'masculino' : 'feminino';
    const faixa = [Math.max(18, i - 7), Math.min(80, i + 7)];
    const p = criarPessoa(v, r, { idade: r.int(faixa[0], faixa[1]), genero, municipioId: v.moradia.municipioId });
    // Fica fora da vida até o match (o perfil não é ninguém que você conheça).
    delete v.pessoas[p.id];
    p.atracao = v.eu.genero === 'masculino' ? (r.chance(0.85) ? 'homens' : 'ambos') : v.eu.genero === 'feminino' ? (r.chance(0.85) ? 'mulheres' : 'ambos') : 'ambos';
    p.parceiroId = undefined;
    const ints = [...INTERESSES].sort(() => r.next() - 0.5).slice(0, 3);
    out.push({ pessoa: p, bio: r.pick(BIOS).replace(/\{o\}/g, flex(p.genero, 'o', 'a', 'e')), busca: buscaDoPerfil(v, p, r), km: r.int(1, 18), interesses: ints });
  }
  return out;
}

export type OqueCelular15 =
  | { op: 'ler' }
  | { op: 'responder'; id: string; escolha: string }
  | { op: 'namoro_abrir' }
  | { op: 'namoro_mais' }
  | { op: 'curtir'; pid: string }
  | { op: 'passar'; pid: string }
  | { op: 'desfazer'; pid: string }
  | { op: 'curtir_post'; chave: string; pid: string }
  /** VIDA 16: escrever para alguém (a intenção decide a frase; a resposta é da pessoa). */
  | { op: 'escrever'; pid: string; intencao: IntencaoMsg16 }
  /** VIDA 17: preso, o celular fica retido — só a ligação do telefone da unidade para um contato autorizado. */
  | { op: 'ligacao_unidade'; pid: string };

export function disponibilidadeCelular15(v: Vida, q: OqueCelular15): Veredito {
  // VIDA 17: preso, o aparelho fica retido — nenhum aplicativo; só o telefone da unidade (que não depende de ter celular).
  if (q.op === 'ligacao_unidade') return disponibilidadeLigacao17(v, q.pid);
  if (preso17(v)) return bloqueio('impossivel', MOTIVO_PRESO17);
  if (!temCelular15(v)) return bloqueio('impossivel', 'Ainda sem celular.');
  switch (q.op) {
    case 'ler': return PERMITIDO;
    case 'responder': {
      const m = v.celular15?.msgs.find(x => x.id === q.id);
      if (!m) return bloqueio('impossivel', 'Essa mensagem não está mais aqui.');
      if (m.resposta) return bloqueio('incompativel', 'Você já respondeu.');
      const op = opcoesDaMsg15(v, m).find(x => x.op === q.escolha);
      return op ? op.veredito : bloqueio('impossivel', 'Não dá para responder assim.');
    }
    case 'namoro_abrir': return disponibilidadeNamoro15(v);
    case 'namoro_mais': {
      const d = disponibilidadeNamoro15(v);
      if (d.grau === 'impossivel' || d.grau === 'requisito' || d.grau === 'incompativel') return d;
      const deck = v.celular15?.deck;
      if (!deck || deck.ano !== anoDe(v.t)) return bloqueio('requisito', 'Abra o aplicativo primeiro.');
      if (deck.perfis.some(x => !x.decisao)) return bloqueio('incompativel', 'Ainda há perfis para ver.');
      if ((deck.extras ?? 0) >= 2) return bloqueio('incompativel', 'Por este ano, você já viu todo mundo da região. No ano que vem, gente nova.');
      return d;
    }
    case 'curtir': case 'passar': {
      const d = disponibilidadeNamoro15(v);
      if (d.grau === 'impossivel' || d.grau === 'requisito' || d.grau === 'incompativel') return d;
      const pf = v.celular15?.deck?.perfis.find(x => x.pessoa.id === q.pid);
      if (!pf || pf.decisao) return bloqueio('impossivel', 'Esse perfil já passou.');
      if (q.op === 'curtir' && matches15(v).length >= 3) return bloqueio('incompativel', 'Já são três conversas abertas: dê atenção a elas (ou desfaça um match) antes de curtir mais.');
      return d;
    }
    case 'desfazer': return v.vinculos[q.pid] && etapaDoApp(v, v.vinculos[q.pid]) ? PERMITIDO : bloqueio('impossivel', 'Não há match com essa pessoa.');
    case 'escrever': return disponibilidadeEscrever16(v, q.pid, q.intencao);
    case 'curtir_post': return v.celular15?.curtidas?.includes(q.chave) ? bloqueio('incompativel', 'Já curtiu.') : v.vinculos[q.pid] ? PERMITIDO : bloqueio('impossivel', 'Essa pessoa saiu da sua rede.');
  }
}

export function executarCelular15(v: Vida, r: Rng, q: OqueCelular15): SaidaCelular15 {
  const c = celularDe(v);
  switch (q.op) {
    case 'ler': for (const m of c.msgs) m.lida = true; return { texto: '' };
    case 'responder': return responderMsg15(v, r, c.msgs.find(x => x.id === q.id)!, q.escolha);
    case 'ligacao_unidade': return ligarDaUnidade17(v, r, q.pid);
    case 'namoro_abrir': {
      if (c.deck?.ano !== anoDe(v.t)) c.deck = { ano: anoDe(v.t), perfis: gerarPerfis(v, TAMANHO_DO_DECK, 0), instalado: true };
      c.deck.instalado = true;
      // VIDA 16: o aplicativo instalado é a primeira pista (conta uma vez por ano).
      const x = deixarRastro16(v, 'perfil', undefined, r);
      return x.texto ? { texto: x.texto, titulo: 'Descoberto', tom: 'ruim' } : { texto: '' };
    }
    case 'namoro_mais': {
      const d = c.deck!;
      d.extras = (d.extras ?? 0) + 1;
      d.perfis = [...d.perfis.filter(x => x.decisao === 'match'), ...gerarPerfis(v, 6, d.extras)];
      return { texto: 'Gente nova apareceu na região.' };
    }
    case 'passar': { const pf = c.deck!.perfis.find(x => x.pessoa.id === q.pid)!; pf.decisao = 'passou'; return { texto: '' }; }
    case 'curtir': return curtirPerfil(v, r, c.deck!.perfis.find(x => x.pessoa.id === q.pid)!);
    case 'desfazer': {
      const vin = v.vinculos[q.pid];
      if (vin.contexto) vin.contexto.etapa = 'encerrado';
      vin.romance = undefined;
      registrarFase(v, vin, 'sem_quimica');
      return { texto: `Match desfeito com ${v.pessoas[q.pid].nome}.` };
    }
    case 'escrever': return escrever16(v, r, q.pid, q.intencao);
    case 'curtir_post': {
      const l = (c.curtidas ??= []);
      l.push(q.chave);
      if (l.length > 160) l.splice(0, l.length - 160);
      // Uma curtida aproxima pouco — e só a primeira do ano com cada pessoa conta.
      const k = `cel15c_${q.pid}_${anoDe(v.t)}`;
      if (v.fatos[k] === undefined) { v.fatos[k] = v.t; perto(v.vinculos[q.pid], 1, false); }
      return { texto: '' };
    }
  }
}

/** A curtida: o match é da outra pessoa (o mesmo interesse do resto do jogo). Com match, a pessoa entra na vida. */
function curtirPerfil(v: Vida, r: Rng, pf: PerfilApp15): SaidaCelular15 {
  pf.decisao = 'curtiu';
  const p = pf.pessoa;
  if (!v.anoAtual.acoes.includes('buscar:app')) v.anoAtual.acoes.push('buscar:app');
  v.fatos['buscas_romance'] = (v.fatos['buscas_romance'] ?? 0) + 1;
  const comp = compatibilidade(v, p);
  const interesse = clamp(Math.round(interesseInicial(v, p) + (0.78 - 0.4) * 22 + comp * 12 + r.normal() * 9));
  const mutuo = atraiGenero(p.atracao, v.eu.genero) && interesse >= 50;
  if (!mutuo) return { texto: '' };
  pf.decisao = 'match';
  v.pessoas[p.id] = p;
  const vin = vincular(v, p, { origem: 'online', proximidade: r.int(18, 26), estagio: 'conhecido' });
  vin.contexto = novoContexto('app', { busca: pf.busca, etapa: 'match' });
  registrarFase(v, vin, 'conhecido');
  if (!podeTerRomance(v, p, vin)) { vin.contexto.etapa = 'encerrado'; return { texto: '' }; }
  vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: interesse };
  vin.proximidade = clamp(vin.proximidade + 4);
  registrarFase(v, vin, 'match');
  lembrarCom(v, p.id, 'Deram match num aplicativo.', 'inicio', 1);
  escrever(v, { texto: `Deu match com ${p.nome} num aplicativo de encontros.`, relevancia: 'cotidiano', tema: 'amor', escolha: true, pessoas: [p.id] });
  // Num relacionamento exclusivo, a parceria pode perceber (o celular na mesa, a notificação).
  // VIDA 16: a chance e a reação são da parceria (o jeito, a casa, a confiança, o que já foi achado) — `namoro16`.
  const achado = deixarRastro16(v, 'match', p.id, r);
  const extra = achado.texto ? ` ${achado.texto}` : '';
  return { texto: `Deu match com ${p.nome}!${extra}`, titulo: 'Match', pessoaId: p.id, tom: extra ? 'ruim' : 'bom' };
}

/* ------------------------------------------------------------------ A rede dos amigos */

export interface Post15 { chave: string; pid: string; t: number; texto: string; tipo: string; curtiu: boolean }

/** O que as pessoas da sua vida postaram (a trajetória delas, contada por elas). */
export function feed15(v: Vida): Post15[] {
  const curtidas = new Set(v.celular15?.curtidas ?? []);
  const out: Post15[] = [];
  for (const { p, vin } of vinculosVivos(v)) {
    if (!humano(p) || !p.vida?.trajetoria?.length) continue;
    if (vin.ruptura && vin.estagio !== 'ex_amigo') continue;
    for (const x of p.vida.trajetoria) {
      if (x.t < v.t - 24 || x.t > v.t || x.tipo === 'escola' && idadePessoa(v, p) < 14) continue;
      const chave = `${p.id}:${x.t}:${x.tipo}`;
      out.push({ chave, pid: p.id, t: x.t, texto: x.texto, tipo: x.tipo, curtiu: curtidas.has(chave) });
    }
  }
  // A mesma perda contada por dois irmãos é uma notícia só (a de quem é mais próximo de você fica).
  const vistos = new Set<string>();
  return out.sort((a, b) => b.t - a.t || (v.vinculos[b.pid]?.proximidade ?? 0) - (v.vinculos[a.pid]?.proximidade ?? 0))
    .filter(x => { const k = `${x.tipo}|${x.t}|${x.texto}`; if (x.tipo === 'perda' && vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 30);
}

/** Normaliza um save (antigo ou novo): nada a criar; só a forma. Idempotente. */
export function normalizarCelular15(v: Vida): void {
  const c = v.celular15;
  if (!c) return;
  if (!Array.isArray(c.msgs)) c.msgs = [];
  if (c.deck && !Array.isArray(c.deck.perfis)) c.deck = undefined;
}

export type { Celular15, Msg15, PerfilApp15 };
