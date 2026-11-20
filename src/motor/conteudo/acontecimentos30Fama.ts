/**
 * VIDA 30 · §3 — A FAMA EM PESSOA (manuais: abertas pelo fluxo do ano `v30/fama/rede30.fama30DoAno` ou pelo convite
 * aceito no celular). O tamanho do nome muda a cena: o caixa da padaria (o nome local) não é a fila no aeroporto (o nome
 * nacional), que não é a aglomeração com segurança (o nome enorme). O evento traz UMA figura do meio, com o que ela é e
 * o que viveu; conhecê-la faz dela uma Pessoa da sua vida.
 *
 *   fama30_rua         reconhecido num lugar do dia a dia (às vezes lembram do que acabou de acontecer)
 *   fama30_proposta    alguém se aproxima com uma proposta profissional, no ramo de onde vem o seu nome
 *   fama30_paparazzi   o fotógrafo na saída (só o nome muito grande, e raro)
 *   fama30_evento      a festa, a premiação, o jogo beneficente, o lançamento — e a figura do meio
 */
import type { Conteudo, Ctx } from './base';
import { clamp } from '../rng';
import { lembrarCom, parceiro } from '../nucleo';
import { conhecerFigura30, faisca30, figura30, jeitoDaFigura30, nomeDaFigura30, oQueSabeDeVoce30, quemE30, viverCena30, type Cena30 } from '../v30/fama/rede30';
import { origensDaFama13, receberDaFama13 } from '../sistemas/reconhecimento13';
import { deixarFio17 } from '../v17/celular/mensagens17';
import { flex } from '../texto';

const cena = (c: Ctx): Cena30 | undefined => c.v.fama30?.cena;
const viva = (id: string) => (c: Ctx) => cena(c)?.t === c.v.t && cena(c)?.tipo === id;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const o = (c: Ctx) => flex(c.v.eu.genero, 'o', 'a', 'e');
const estresse = (c: Ctx, x: number) => { c.v.mente.estresse = clamp(Math.round(c.v.mente.estresse + x)); };
const feliz = (c: Ctx, x: number) => { c.v.mente.felicidade = clamp(Math.round(c.v.mente.felicidade + x)); };
const priv = (c: Ctx, x: number) => { const m = c.v.fama30; if (m) m.privacidade = clamp(Math.round(m.privacidade + x), 5, 100); };
const lembrou = (c: Ctx) => { const l = cena(c)?.lembrou; return l ? ` Alguém comentou: "${l.replace(/\.$/, '')} — eu vi!"` : ''; };

function textoDaRua(c: Ctx): string {
  const x = cena(c)!;
  const onde = x.onde;
  if (x.nivel <= 1) return `Em ${onde}, a pessoa do caixa olhou duas vezes antes de perguntar: "você não é ${c.v.eu.nome}?". Um senhor atrás na fila sorriu, sem saber muito bem quem era você.${lembrou(c)}`;
  if (x.nivel === 2) return `Em ${onde}, um grupo cochichou, apontou e se aproximou com os celulares na mão: "tira uma foto com a gente?".${lembrou(c)}`;
  if (x.nivel === 3) return `Em ${onde}, alguém gritou o seu nome — e em um minuto havia uma pequena fila de gente querendo foto, autógrafo, um vídeo para a mãe.${lembrou(c)}`;
  return `Em ${onde}, a notícia de que você estava ali correu mais rápido do que você: celulares erguidos, gente se empurrando, um segurança do lugar pedindo calma.${lembrou(c)}`;
}

/** A proposta pelo que é o seu nome (quem chega e o que quer). */
function quemPropoe(c: Ctx): { quem: string; oque: string; valor: number } {
  const n = cena(c)?.nivel ?? 2;
  const valor = Math.round((n >= 4 ? 120000 : n === 3 ? 45000 : 12000) / 1000) * 1000;
  switch (origensDaFama13(c.v)[0]?.origem) {
    case 'esportiva': return { quem: 'o dono de uma marca de material esportivo', oque: 'uma campanha com o seu rosto e uma clínica para crianças', valor };
    case 'musical': return { quem: 'um produtor de shows', oque: 'uma participação num festival de verão', valor };
    case 'artistica': return { quem: 'uma diretora de elenco', oque: 'uma participação especial numa série', valor };
    case 'empresarial': return { quem: 'um investidor conhecido', oque: 'uma palestra num fórum e uma conversa sobre sociedade', valor };
    case 'digital': return { quem: 'uma agência de publicidade', oque: 'uma série de publicidades', valor };
    case 'politica': return { quem: 'a organização de um congresso', oque: 'uma palestra de abertura', valor: Math.round(valor / 2) };
    default: return { quem: 'o dono de uma marca local', oque: 'uma propaganda para a cidade', valor: Math.round(valor / 2) };
  }
}

export const ACONTECIMENTOS_30_FAMA: Conteudo[] = [
  {
    id: 'fama30_rua', tipo: 'decisao', idade: [14, 120], tema: 'lazer', manual: true, repetir: 0,
    quando: viva('rua'),
    titulo: c => cap(cena(c)!.onde),
    texto: textoDaRua,
    opcoes: [
      { id: 'fotos', texto: c => (cena(c)!.nivel <= 1 ? 'Conversar um pouco, com simpatia' : 'Tirar as fotos e conversar'),
        consequencia: c => (cena(c)!.nivel >= 3 ? 'Simpatia que vira comentário bom — e meia hora a menos no dia.' : undefined),
        resolver: c => {
          const n = cena(c)!.nivel;
          return { texto: n <= 1 ? 'Você conversou, agradeceu, e saiu com o pão e a sensação boa de ser lembrad' + o(c) + ' na sua rua.' : n === 2 ? 'Foram umas dez fotos e uma conversa rápida. À noite, as fotos estavam nas redes, com legendas carinhosas.' : 'Meia hora de fotos. Na saída, o cansaço — e, no dia seguinte, os comentários: "gente como a gente".',
            memoria: n >= 2 ? `Reconhecid${o(c)} em ${cena(c)!.onde}: tirou fotos com quem pediu.` : null, tom: 'bom',
            efeito: () => { c.v.fatos['vis_boa'] = c.v.t; estresse(c, n >= 3 ? 3 : 0); feliz(c, 2); priv(c, -n); viverCena30(c.v, 'fotos', n >= 2); } };
        } },
      { id: 'rapido', texto: 'Uma foto rápida e seguir', resolver: c => ({ texto: 'Uma foto, um "obrigad' + o(c) + '!", e você seguiu. Ninguém se ofendeu.', memoria: null, efeito: () => { priv(c, -1); viverCena30(c.v, 'rapido', false); } }) },
      { id: 'recusar', texto: 'Recusar com educação',
        consequencia: c => (cena(c)!.nivel >= 3 ? 'Num nome grande, o "não" às vezes vira comentário.' : undefined),
        resolver: c => {
          const n = cena(c)!.nivel;
          const pegou = n >= 3 && c.r.chance(0.3);
          return { texto: pegou ? 'Você pediu desculpas e recusou. Alguém filmou o "não" — e o vídeo rodou com a legenda "antipátic' + o(c) + '".' : 'Você explicou que não era um bom momento. A maioria entendeu.', memoria: pegou ? 'Um vídeo recusando fotos rodou as redes.' : null, tom: pegou ? 'ruim' : 'neutro',
            efeito: () => { if (pegou) c.v.fatos['vis_polemica'] = c.v.t; priv(c, 1); viverCena30(c.v, 'recusar', pegou); } };
        } },
      { id: 'fugir', texto: 'Sair por onde ninguém vê', disponivel: c => cena(c)!.nivel >= 3 || false,
        resolver: c => ({ texto: 'Um funcionário mostrou a porta dos fundos. Você saiu sem ninguém perceber — e com a sensação estranha de ter fugido da própria vida.', memoria: null, efeito: () => { priv(c, 4); feliz(c, -1); viverCena30(c.v, 'fugir', false); } }) }
    ]
  },
  {
    id: 'fama30_proposta', tipo: 'decisao', idade: [16, 120], tema: 'trabalho', manual: true, repetir: 0,
    quando: viva('proposta'),
    titulo: c => cap(cena(c)!.onde),
    texto: c => { const q = quemPropoe(c); return `Em ${cena(c)!.onde}, depois das fotos de sempre, ${q.quem} se apresentou: tinha reconhecido você e queria propor ${q.oque}. Falou em cerca de ${q.valor.toLocaleString('pt-BR')} de cachê.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Trocar contato e fechar', consequencia: () => 'Dinheiro e exposição; o nome passa a ser ligado à marca.',
        resolver: c => { const q = quemPropoe(c); return { texto: `Fecharam em uma semana. ${cap(q.oque)} saiu do jeito combinado.`, memoria: `Um encontro na rua virou trabalho: ${q.oque}.`, tom: 'bom', efeito: () => { receberDaFama13(c.v, q.valor, 'Proposta que surgiu num encontro'); estresse(c, 3); viverCena30(c.v, 'aceitou', true); } }; } },
      { id: 'pensar', texto: 'Pegar o cartão e pensar', resolver: c => ({ texto: 'Você guardou o cartão. Na semana seguinte, a proposta já tinha ido para outro nome.', memoria: null, efeito: () => viverCena30(c.v, 'pensou', false) }) },
      { id: 'recusar', texto: 'Agradecer e recusar', resolver: c => ({ texto: 'Você agradeceu. Nem todo convite combina com quem você é.', memoria: null, efeito: () => viverCena30(c.v, 'recusou', false) }) }
    ]
  },
  {
    id: 'fama30_paparazzi', tipo: 'decisao', idade: [16, 120], tema: 'lazer', manual: true, repetir: 0,
    quando: viva('paparazzi'),
    titulo: () => 'O fotógrafo na porta',
    texto: c => { const par = parceiro(c.v); return `Na saída de ${cena(c)!.onde}, um fotógrafo estava esperando — sabia o horário${par ? `, e sabia que você estava com ${par.p.nome}` : ''}. O flash disparou antes de você chegar à calçada.`; },
    opcoes: [
      { id: 'posar', texto: 'Sorrir e deixar fotografar', resolver: c => ({ texto: 'A foto saiu no dia seguinte, bonita e sem assunto. Às vezes é o melhor que dá para fazer.', memoria: null, tom: 'neutro', efeito: () => { priv(c, -4); viverCena30(c.v, 'posou', true); } }) },
      { id: 'esconder', texto: 'Cobrir o rosto e entrar no carro', resolver: c => { const par = parceiro(c.v); return { texto: `A foto que saiu foi a da fuga, com a legenda "${c.v.eu.nome} foge dos fotógrafos"${par && !par.p.celebridade15 ? ` — e ${par.p.nome} odiou aparecer de canto` : ''}.`, memoria: null, tom: 'ruim', efeito: () => { estresse(c, 3); if (par && !par.p.celebridade15) { par.vin.tensao = clamp(par.vin.tensao + 4); lembrarCom(c.v, par.p.id, 'Saiu numa foto de paparazzi sem ter escolhido.', 'conflito'); } viverCena30(c.v, 'escondeu', true); } }; } },
      { id: 'confrontar', texto: 'Pedir, com firmeza, para parar', resolver: c => { const viral = c.r.chance(0.4); return { texto: viral ? 'Alguém filmou a discussão. O vídeo rodou: metade achou você coberto de razão, metade achou exagero.' : 'O fotógrafo baixou a câmera e foi embora resmungando. Funcionou — dessa vez.', memoria: viral ? 'Uma discussão com um fotógrafo virou vídeo.' : null, tom: viral ? 'ruim' : 'neutro', efeito: () => { if (viral) c.v.fatos['vis_polemica'] = c.v.t; else priv(c, 3); estresse(c, 4); viverCena30(c.v, 'confrontou', viral); } }; } }
    ]
  },
  {
    id: 'fama30_evento', tipo: 'decisao', idade: [16, 120], tema: 'amizade', manual: true, repetir: 0,
    quando: c => viva('evento')(c) && !!figura30(c.v, cena(c)!.figuraId),
    titulo: c => cap(cena(c)!.onde),
    texto: c => { const f = figura30(c.v, cena(c)!.figuraId)!; return `${cap(cena(c)!.onde)}: flashes, gente que você só conhecia da tela. ${jeitoDaFigura30(f)} Era ${quemE30(c.v, f)}. ${oQueSabeDeVoce30(c.v, f)}`; },
    opcoes: [
      { id: 'conversar', texto: c => `Conversar sobre ${figura30(c.v, cena(c)!.figuraId)!.genero === 'feminino' ? 'a vida dela' : 'a vida dele'}`,
        resolver: c => { const f = figura30(c.v, cena(c)!.figuraId)!; return { texto: `Conversaram sobre ${f.fatos.slice(-1)[0]?.texto ?? 'o trabalho'}, sobre a cidade, sobre o que ninguém pergunta. ${f.traco === 'reservado' ? 'Demorou a se abrir — mas se abriu.' : 'O tempo passou rápido.'}`, memoria: `Conheceu ${nomeDaFigura30(f)} (${f.oficio}) em ${cena(c)!.onde}.`, tom: 'bom', efeito: () => { conhecerFigura30(c.v, c.r, f, cena(c)!.onde, 30); feliz(c, 2); viverCena30(c.v, 'conversou', true); } }; } },
      { id: 'contato', texto: 'Trocar contato e combinar de se ver',
        resolver: c => { const f = figura30(c.v, cena(c)!.figuraId)!; return { texto: `Trocaram os números ali mesmo. "Semana que vem tem ${f.area === 'futebol' || f.area === 'esporte' ? 'um jogo meu' : f.area === 'musica' ? 'um show meu' : 'uma coisa minha'} — aparece", ${f.genero === 'feminino' ? 'disse ela' : 'disse ele'}.`, memoria: `Conheceu ${nomeDaFigura30(f)} (${f.oficio}) e trocaram contato.`, tom: 'bom', efeito: () => { const { p } = conhecerFigura30(c.v, c.r, f, cena(c)!.onde, 38); deixarFio17(c.v, { pid: p.id, tipo: 'promessa', t: c.v.t, dado: 'aquele convite' }); feliz(c, 3); viverCena30(c.v, 'contato', true); } }; } },
      { id: 'flertar', texto: 'Flertar',
        disponivel: c => (parceiro(c.v) ? false : !!c.v.eu.atracao || 'Diga antes por quem você se interessa (em Pessoas).'),
        resolver: c => {
          const f = figura30(c.v, cena(c)!.figuraId)!;
          const { p, vin } = conhecerFigura30(c.v, c.r, f, cena(c)!.onde, 34);
          const deu = faisca30(c.v, p, vin);
          if (deu) deixarFio17(c.v, { pid: p.id, tipo: 'paquera', t: c.v.t });
          viverCena30(c.v, deu ? 'flertou' : 'flerte_sem_eco', true);
          return { texto: deu ? `O olhar demorou mais do que o normal. No fim da noite, ${f.nome} pediu o seu número "para continuar a conversa".` : `${f.nome} riu, simpátic${f.genero === 'feminino' ? 'a' : 'o'} — e mudou de assunto com elegância. Não era por aí.`, memoria: deu ? `Um flerte com ${nomeDaFigura30(f)} numa noite de festa.` : null, tom: deu ? 'bom' : 'neutro' };
        } },
      { id: 'cumprimentar', texto: 'Só cumprimentar e circular', resolver: c => ({ texto: 'Um cumprimento educado e cada um para um lado. A noite seguiu.', memoria: null, efeito: () => viverCena30(c.v, 'cumprimentou', true) }) }
    ]
  }
];
