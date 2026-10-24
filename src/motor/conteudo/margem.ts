/**
 * REWORK 10 · CRI-01 — as decisões da vida à margem e do processo (`sistemas/margem`, `sistemas/tribunal`).
 *
 * Disparadas por estado (um fato marcado pelo sistema naquele ano). O texto narra o que acontece com a vida; nenhuma
 * opção descreve como se comete, se esconde ou se foge de coisa alguma.
 */

import type { Conteudo, Ctx } from './base';
import { estresse, feliz, local } from './efeitos';
import { marcarFato, parceiro } from '../nucleo';
import { parar, moita } from '../sistemas/ilicito';
import { novoContatoDoCaminho } from '../sistemas/margem';
import { machucarNaBriga } from '../sistemas/lesoes';
import { pagar, disponivel } from '../sistemas/dinheiro';
import { abrirProcesso } from '../sistemas/justica';
import { aceitarAcordo, assumir, contratarAdvogado, cooperar, honorarios, pagarFianca, perfilDaVida, recorrer } from '../sistemas/tribunal';
import { dinheiro as fmt } from '../texto';
import { clamp } from '../rng';
import { economiaLocal } from '../dados/lugares';

const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] === c.v.t;
const env = (c: Ctx) => c.v.caminhos.envolvimento!;
const proc = (c: Ctx) => c.v.justica!.processo!;
/** O dinheiro de um trabalho maior (uns meses de renda de uma vez), no custo de onde se vive. */
const ganhoGrande = (c: Ctx) => Math.round((1000 + env(c).nivel * 1100) * 6 * economiaLocal(c.v.moradia.municipioId).custo / 100) * 100;
const naoPreso = (c: Ctx) => !c.v.justica?.prisao;

export const MARGEM: Conteudo[] = [
  /* ------------------------------------------------------------- o trabalho maior */
  {
    id: 'ilic_trabalho', tipo: 'decisao', idade: [14, 75], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    quando: c => deHoje(c, 'ilic_trabalho') && !!c.v.caminhos.envolvimento && c.v.caminhos.envolvimento.parou === undefined && naoPreso(c),
    titulo: 'Um trabalho maior',
    texto: c => `Quem está acima chamou você para uma coisa maior do que o de sempre — dinheiro de meses, de uma vez, e mais gente sabendo. ${env(c).reputacao! >= 60 ? 'Chamaram você porque confiam.' : 'É a chance de passarem a confiar em você.'} ${parceiro(c.v) ? `${parceiro(c.v)!.p.nome} não sabe de nada.` : ''}`,
    opcoes: [
      { id: 'participar', texto: 'Participar', comportamento: { impulsividade: 1, coragem: 1 },
        consequencia: c => `Uns ${fmt(ganhoGrande(c))}, a confiança do meio — e muito mais gente sabendo.`,
        resolver: c => {
          const deuErrado = c.r.chance(0.12 + env(c).nivel * 0.04);
          return {
            texto: deuErrado ? 'Deu errado no meio do caminho. Você saiu de lá correndo, machucado, e sem o dinheiro.'.replace('machucado', c.g('machucado', 'machucada', 'machucade')) : 'Deu certo. O dinheiro veio inteiro — e com ele, um nome no meio.',
            memoria: deuErrado ? 'Um trabalho maior que deu errado.' : 'Fez um trabalho maior no esquema.', relevancia: 'marco', tom: 'ruim',
            efeito: () => {
              const e = env(c);
              e.trabalhos = (e.trabalhos ?? 0) + 1;
              e.exposicao = clamp(e.exposicao + (deuErrado ? 22 : 12));
              if (deuErrado) { machucarNaBriga(c.v, c.r, 2); e.reputacao = clamp((e.reputacao ?? 0) - 6); }
              // REWORK 11 · SUB-03: quem fez o trabalho maior junto passa a conhecer você (mais um contato do caminho).
              else { const g = ganhoGrande(c); c.v.financas.conta += g; e.ganhos += g; e.reputacao = clamp((e.reputacao ?? 0) + 12); novoContatoDoCaminho(c.v); }
            }
          };
        } },
      { id: 'negociar', texto: 'Participar, mas exigir uma parte maior', comportamento: { coragem: 1 },
        consequencia: () => 'Mais dinheiro se aceitarem — e um atrito com quem manda, se não.',
        resolver: c => {
          const aceitam = c.r.chance(clamp(0.3 + (env(c).reputacao ?? 0) / 150, 0.2, 0.8));
          return { texto: aceitam ? 'Aceitaram a sua parte. Você ganhou mais — e passou a ser lembrado como quem cobra.' : 'Não aceitaram, e não esqueceram que você pediu.', memoria: null,
            efeito: () => { const e = env(c); if (aceitam) { const g = Math.round(ganhoGrande(c) * 1.3); c.v.financas.conta += g; e.ganhos += g; e.trabalhos = (e.trabalhos ?? 0) + 1; e.exposicao = clamp(e.exposicao + 12); } else { e.atritos = (e.atritos ?? 0) + 1; e.reputacao = clamp((e.reputacao ?? 0) - 5); } } };
        } },
      { id: 'recusar', texto: 'Recusar este', comportamento: { disciplina: 1 },
        consequencia: c => (env(c).nivel >= 3 ? 'O grupo vai cobrar a recusa.' : 'O meio esfria com você — e você dorme melhor.'),
        resolver: c => ({ texto: 'Você disse que esse não. Ficou um silêncio estranho do outro lado.', memoria: null, efeito: () => { const e = env(c); e.reputacao = clamp((e.reputacao ?? 0) - 8); if (e.nivel >= 3) e.atritos = (e.atritos ?? 0) + 1; } }) },
      { id: 'sair', texto: 'Aproveitar e sair de vez', comportamento: { disciplina: 1, coragem: 1 },
        resolver: c => ({ texto: c.v.caminhos.envolvimento!.nivel >= 3 ? 'Você avisou que estava fora. Ninguém disse nada — e isso era o que dava medo.' : 'Você disse que não ia mais. E não foi.', memoria: null, efeito: () => parar(c.v, 'recusou um trabalho maior e saiu') }) }
    ]
  },
  /* ------------------------------------------------------------- o atrito no grupo */
  {
    id: 'ilic_atrito', tipo: 'decisao', idade: [16, 75], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    quando: c => deHoje(c, 'ilic_atrito') && !!c.v.caminhos.envolvimento && c.v.caminhos.envolvimento.parou === undefined && naoPreso(c),
    titulo: 'Um desentendimento no grupo',
    texto: () => 'Uma conta que não fechou, uma acusação atravessada: alguém do grupo acha que você ficou com o que não era seu.',
    opcoes: [
      { id: 'ceder', texto: 'Pagar a diferença e encerrar o assunto', comportamento: { disciplina: 1 },
        disponivel: c => (disponivel(c.v) >= local(c, 1000) ? true : 'Não há dinheiro para pagar a diferença.'),
        resolver: c => ({ texto: 'Você pagou. O assunto morreu ali — e ficou a impressão de que você paga quando apertam.', memoria: null, efeito: () => { pagar(c.v, Math.min(disponivel(c.v), Math.round(env(c).ganhos * 0.08))); env(c).reputacao = clamp((env(c).reputacao ?? 0) - 4); } }) },
      { id: 'enfrentar', texto: 'Enfrentar', comportamento: { coragem: 2, impulsividade: 1 },
        resolver: c => {
          const machucou = c.r.chance(0.35);
          return { texto: machucou ? 'A conversa virou briga. Você ganhou o respeito do grupo e uma cicatriz.' : 'Você não abaixou a cabeça, e o outro recuou. O grupo reparou.', memoria: machucou ? 'Uma briga dentro do esquema.' : null, tom: 'ruim',
            efeito: () => { const e = env(c); e.atritos = (e.atritos ?? 0) + 1; e.reputacao = clamp((e.reputacao ?? 0) + 6); if (machucou) machucarNaBriga(c.v, c.r, 3); estresse(c, 8); } };
        } },
      { id: 'sair', texto: 'Sair de vez', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você disse que estava fora — e foi embora antes que a conversa continuasse.', memoria: null, efeito: () => parar(c.v, 'saiu depois de um atrito no grupo') }) }
    ]
  },
  /* ------------------------------------------------------------- o cerco */
  {
    id: 'ilic_cerco', tipo: 'decisao', idade: [14, 80], tema: 'escolha', prioritario: true, prioridade: 4, repetir: 1,
    quando: c => deHoje(c, 'ilic_cerco') && !!c.v.caminhos.envolvimento && c.v.caminhos.envolvimento.investigado !== undefined && !c.v.justica?.processo && naoPreso(c),
    titulo: 'A investigação chegou perto',
    texto: c => `Um conhecido avisou: perguntaram por você. Há uma investigação, e o seu nome está nela. ${parceiro(c.v) ? `${parceiro(c.v)!.p.nome} percebeu que você não dorme.` : ''}`,
    opcoes: [
      { id: 'sumir', texto: 'Parar tudo e esperar esfriar', comportamento: { disciplina: 1 },
        consequencia: () => 'O que existe contra você esfria com o tempo — às vezes não o bastante.',
        resolver: c => ({ texto: 'Telefone novo, nenhum contato com ninguém do caminho. A espera é a parte pior.', memoria: null, efeito: () => { moita(c.v, true); parar(c.v, 'a investigação chegou perto'); env(c).exposicao = clamp(env(c).exposicao - 10); } }) },
      { id: 'advogado', texto: c => `Procurar um advogado antes de tudo (uns ${fmt(honorarios(c.v))})`, disponivel: c => (disponivel(c.v) >= honorarios(c.v) ? true : 'Não há dinheiro para um advogado agora.'),
        consequencia: () => 'Se virar processo, a defesa já está pronta (e mais forte).',
        resolver: c => ({ texto: 'O advogado ouviu tudo, anotou pouco e disse: "Daqui para a frente, você não fala com ninguém sem mim."', memoria: null, efeito: () => { pagar(c.v, honorarios(c.v)); marcarFato(c.v, 'advogado_preventivo'); env(c).exposicao = clamp(env(c).exposicao - 6); } }) },
      { id: 'assumir', texto: 'Procurar as autoridades e assumir', comportamento: { coragem: 2 },
        consequencia: () => 'Vira processo agora — com a pena menor de quem assumiu, e o fim da espera.',
        resolver: c => ({ texto: 'Você foi até lá e contou o que fez. Saiu com um processo nas costas e o peso fora do peito.', memoria: 'Procurou as autoridades e assumiu o que tinha feito.', relevancia: 'marco',
          efeito: () => { const e = env(c); e.investigado = undefined; parar(c.v, 'assumiu o que fez'); abrirProcesso(c.v, c.r, e.categoria); if (c.v.justica?.processo) { assumir(c.v); } } }) },
      { id: 'cooperar', texto: 'Oferecer o que sabe sobre os outros', comportamento: { coragem: 1, empatia: -1 },
        disponivel: c => (perfilDaVida(c.v).colaboracao ? true : 'A lei daqui não prevê redução de pena por colaboração.'),
        consequencia: () => 'A investigação muda de alvo; o grupo, de assunto: você.',
        resolver: c => {
          const arquiva = c.r.chance(0.55);
          return { texto: arquiva ? 'O que você contou valeu mais do que o que tinham contra você: o seu caso foi deixado de lado. Do lado de fora, o recado chegou.' : 'Você contou o que sabia. Mesmo assim, virou processo — com a colaboração registrada a seu favor.', memoria: 'Colaborou com a investigação.', relevancia: 'marco',
            efeito: () => { const e = env(c); parar(c.v, 'colaborou com a investigação'); e.investigado = undefined; if (arquiva) { e.exposicao = 0; c.v.fatos['pressao_grupo'] = c.v.t; marcarFato(c.v, 'cooperou_com_a_justica'); } else { abrirProcesso(c.v, c.r, e.categoria); if (c.v.justica?.processo) cooperar(c.v); } } };
        } }
    ]
  },
  /* ------------------------------------------------------------- o processo: a defesa */
  {
    id: 'jus_defesa', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 5, repetir: 0,
    quando: c => deHoje(c, 'jus_defesa') && !!c.v.justica?.processo && !c.v.justica.processo.defesaEscolhida,
    titulo: 'A defesa',
    texto: c => `O processo está aberto: ${proc(c).provas! >= 70 ? 'as provas contra você são fortes' : proc(c).provas! >= 40 ? 'há provas consideráveis contra você' : 'as provas são frágeis'}. Quem vai defender você?`,
    opcoes: [
      { id: 'publica', texto: c => `Ficar com ${perfilDaVida(c.v).defensoria}`, consequencia: () => 'De graça; sobrecarregada — a chance de absolvição é menor.',
        resolver: c => ({ texto: 'Uma defensora com quarenta processos na mesa e cinco minutos para o seu. Fez o que pôde.', memoria: null, efeito: () => { proc(c).defesaEscolhida = true; } }) },
      { id: 'particular', texto: c => `Contratar um advogado particular (uns ${fmt(honorarios(c.v))})`, disponivel: c => (proc(c).defesa === 'particular' ? false : disponivel(c.v) >= honorarios(c.v) ? true : 'O que você tem não paga um advogado.'),
        consequencia: () => 'Mais chance de absolvição, ou de uma pena menor.',
        resolver: c => ({ texto: contratarAdvogado(c.v), memoria: null }) },
      { id: 'assumir', texto: 'Assumir o que fez', comportamento: { coragem: 1 }, consequencia: () => 'A absolvição fica mais longe; a pena, se vier, menor.',
        resolver: c => ({ texto: assumir(c.v), memoria: 'Assumiu o que fez, no processo.', efeito: () => { proc(c).defesaEscolhida = true; } }) }
    ]
  },
  /* ------------------------------------------------------------- o processo: o acordo */
  {
    id: 'jus_acordo', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 5, repetir: 0,
    quando: c => deHoje(c, 'jus_acordo') && !!c.v.justica?.processo?.acordo && !c.v.justica.processo.acordo.aceito && !c.v.justica.processo.acordo.recusado,
    titulo: 'A proposta da acusação',
    texto: c => perfilDaVida(c.v).acordo === 'amplo'
      ? 'A acusação propõe: você se declara culpado e a pena cai bastante — sem julgamento, sem a incerteza do júri.'.replace('culpado', c.g('culpado', 'culpada', 'culpade'))
      : 'A acusação propõe um acordo: reparar o dano, pagar e cumprir condições por um tempo. Cumprido, o processo se encerra.',
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar o acordo', comportamento: { disciplina: 1 }, consequencia: c => (perfilDaVida(c.v).acordo === 'amplo' ? 'Uma pena certa e menor; a condenação na ficha.' : 'Sem julgamento — e, se for leve, sem condenação na ficha.'),
        resolver: c => ({ texto: aceitarAcordo(c.v, c.r), memoria: 'Fechou um acordo no processo.', relevancia: 'marco' }) },
      { id: 'recusar', texto: 'Recusar e ir a julgamento', comportamento: { coragem: 1 }, consequencia: () => 'A chance de absolvição — e o risco de uma pena maior.',
        resolver: c => ({ texto: 'Você disse que queria o julgamento. O promotor guardou a proposta na pasta.', memoria: null, efeito: () => { proc(c).acordo!.recusado = true; } }) }
    ]
  },
  /* ------------------------------------------------------------- o processo: a fiança */
  {
    id: 'jus_fianca', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 6, repetir: 0,
    quando: c => deHoje(c, 'jus_fianca') && !!c.v.justica?.processo?.fianca && !!c.v.justica.prisao,
    titulo: 'A fiança',
    texto: c => `O juiz arbitrou a fiança: ${fmt(proc(c).fianca!)} para esperar o julgamento em liberdade.`,
    opcoes: [
      { id: 'pagar', texto: 'Pagar e sair', disponivel: c => (disponivel(c.v) >= proc(c).fianca! ? true : 'O que você tem não cobre a fiança.'),
        resolver: c => ({ texto: pagarFianca(c.v), memoria: null }) },
      { id: 'esperar', texto: 'Esperar o julgamento preso', resolver: c => ({ texto: 'Você ficou. Os dias de espera contam na pena, se ela vier.'.replace('preso', c.g('preso', 'presa', 'prese')), memoria: null, efeito: () => { proc(c).fianca = undefined; } }) }
    ]
  },
  /* ------------------------------------------------------------- o processo: o recurso */
  {
    id: 'jus_recurso', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 4, repetir: 0,
    quando: c => deHoje(c, 'jus_recurso') && !!c.v.justica?.prisao && !c.v.justica.recurso,
    titulo: 'Recorrer?',
    texto: () => 'A condenação saiu. A defesa diz que dá para recorrer: a resposta leva um ano, e quase sempre confirma o que foi decidido.',
    opcoes: [
      { id: 'recorrer', texto: 'Recorrer', consequencia: () => 'Às vezes a pena cai; raramente, a condenação.', resolver: c => ({ texto: recorrer(c.v), memoria: null }) },
      { id: 'aceitar', texto: 'Aceitar e cumprir', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Você decidiu cumprir e olhar para a frente. A contagem dos dias começou.', memoria: null, efeito: () => feliz(c, 1) }) }
    ]
  }
];

/** Para os testes e a contagem de conteúdo. */
export const IDS_DA_MARGEM = MARGEM.map(x => x.id);
