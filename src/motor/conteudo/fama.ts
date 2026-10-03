/**
 * A fama vivida (pacote pós-playtest, Fama 2.0): o nome conhecido produz
 * acontecimentos — o pedido de foto na fila, o jantar interrompido, o
 * pedido de ajuda, o boato, a cobrança — proporcionais à notoriedade, e
 * nunca todo ano. E a causa que se escolhe apoiar (`visibilidade`).
 *
 * A origem do nome muda a cena (quem conhece você pelo futebol pede foto de
 * camisa; pela novela, pede para repetir a fala) — `notoriedade.origemDoNome`.
 */

import { dinheiroCurto as moedaCurta } from '../texto';
import type { Conteudo, Ctx } from './base';
import { clamp } from '../rng';
import { dinheiro as fmt } from '../texto';
import { origemDoNome, porOrigem } from '../sistemas/notoriedade';
import { perfilDe } from '../sistemas/perfisEsportivos';
import { apoiarCausa, causasPossiveis } from '../sistemas/visibilidade';
import { disponivel, pagar } from '../sistemas/dinheiro';
import * as P from './papeis';

const nome = (v: { notoriedade?: { valor: number } }) => v.notoriedade?.valor ?? 0;

export const FAMA: Conteudo[] = [
  {
    // Ser reconhecido: a foto na fila, o "você não é...?". Mais comum quanto mais conhecido.
    id: 'fama_rua', tipo: 'acontecimento', idade: [16, 99], tema: 'lazer', repetir: 3,
    peso: c => 0.6 + nome(c.v) / 50,
    quando: c => nome(c.v) >= 30,
    narrar: c => {
      const o = origemDoNome(c.v);
      const muito = nome(c.v) >= 60;
      const mod = c.v.caminhos.esporte?.modalidade ?? c.v.caminhos.carreirasEsportivas?.[c.v.caminhos.carreirasEsportivas.length - 1]?.modalidade;
      const cena = o === 'esporte' ? `Na fila da padaria, um menino ${!mod || perfilDe(mod).estrutura === 'clube' ? 'de camisa do clube' : 'que tinha visto você competir'} pediu uma foto — e o pai, outra.`
        : o === 'arte' ? 'No mercado, uma senhora pediu para você repetir uma fala de um trabalho seu. Você repetiu.'
          : o === 'politica' ? 'Na feira, alguém parou você para reclamar do buraco da rua — e depois pediu uma foto.'
            : 'Num restaurante, o dono veio à mesa: tinha lido sobre o seu negócio.';
      return { texto: muito ? `${cena} Já não dá para ir a lugar nenhum sem isso.` : cena, relevancia: 'cotidiano', efeito: x => { x.v.mente.felicidade = clamp(x.v.mente.felicidade + (muito ? 0 : 2)); if (muito) x.v.mente.estresse = clamp(x.v.mente.estresse + 2); } };
    }
  },
  {
    // O encontro com alguém de quem se gosta, atravessado pelo nome.
    id: 'fama_encontro', tipo: 'acontecimento', idade: [18, 80], tema: 'amor', repetir: 4,
    papeis: { par: P.parceiro },
    quando: c => nome(c.v) >= 40,
    narrar: c => ({
      texto: `No meio do jantar com ${c.p.par.nome}, uma mesa inteira veio pedir foto. ${c.p.par.nome} riu — da segunda vez, já não tanto.`,
      relevancia: 'cotidiano',
      lembrar: ['par', 'O jantar interrompido pelos pedidos de foto.', 'ritual'],
      efeito: x => { const vin = x.v.vinculos[x.p.par.id]; if (vin) vin.tensao = clamp(vin.tensao + (nome(x.v) >= 60 ? 3 : 1)); }
    })
  },
  {
    // A cobrança pública: o nome conhecido também é alvo.
    id: 'fama_cobranca', tipo: 'acontecimento', idade: [16, 99], tema: 'trabalho', repetir: 3,
    quando: c => nome(c.v) >= 50 && ((c.v.caminhos.esporte?.temporadas?.slice(-1)[0]?.nota ?? 7) < 5.6 || (c.v.caminhos.politica?.mandato?.aprovacao ?? 60) < 35 || !!c.v.caminhos.politica?.escandalo),
    narrar: c => ({ texto: c.v.caminhos.esporte?.fase === 'profissional' ? 'A temporada fraca virou assunto nas redes: xingamentos, montagens, gente na porta do treino.' : 'A cobrança chegou pelo celular, pela rua, pelos jornais — tudo ao mesmo tempo.', relevancia: 'biografia', tom: 'ruim', efeito: x => { x.v.mente.estresse = clamp(x.v.mente.estresse + 6); x.v.mente.felicidade = clamp(x.v.mente.felicidade - 3); } })
  },
  {
    // Quem é conhecido recebe pedidos — de dinheiro, de visita, de ajuda. Ninguém responde por você.
    id: 'fama_pedido', tipo: 'decisao', idade: [18, 99], tema: 'escolha', repetir: 4,
    peso: c => 0.5 + nome(c.v) / 60,
    quando: c => nome(c.v) >= 35,
    titulo: 'Um pedido',
    texto: c => `Uma mensagem chegou por um conhecido da sua cidade natal: uma família ${porOrigem(c.v) ? `que acompanha você ${porOrigem(c.v)}` : 'que conhece o seu nome'} precisa pagar um tratamento, e o filho pediu para conhecer você.`,
    opcoes: [
      { id: 'pagar', texto: 'Ajudar com o tratamento',
        disponivel: c => (disponivel(c.v) >= 8000 ? true : 'Não há dinheiro para isso agora.'),
        consequencia: () => `Uns ${moedaCurta(8000)}.`,
        resolver: c => ({ texto: 'O tratamento começou no mês seguinte. A mãe mandou um áudio que você ouviu três vezes.', memoria: 'Pagou o tratamento de um menino que pediu para conhecer você.', relevancia: 'biografia', tom: 'bom', efeito: () => { pagar(c.v, 8000); c.v.mente.felicidade = clamp(c.v.mente.felicidade + 5); c.v.fatos['vis_boa'] = c.v.t; } }) },
      { id: 'visitar', texto: 'Visitar o menino',
        resolver: c => ({ texto: 'Uma tarde no hospital, camisa autografada, um sorriso que você não esquece.', memoria: 'Visitou no hospital um menino que tinha pedido para conhecer você.', relevancia: 'biografia', tom: 'bom', efeito: () => { c.v.mente.felicidade = clamp(c.v.mente.felicidade + 4); c.v.fatos['vis_boa'] = c.v.t; } }) },
      { id: 'recusar', texto: 'Agradecer e dizer que não pode',
        resolver: c => ({ texto: 'Você respondeu com cuidado. Não dá para atender todo mundo — e isso também pesa.', memoria: null, efeito: () => { c.v.mente.estresse = clamp(c.v.mente.estresse + 2); } }) }
    ]
  },
  {
    // Exposição negativa: um boato. A resposta é sua; o efeito, nem tanto.
    id: 'fama_boato', tipo: 'decisao', idade: [18, 99], tema: 'trabalho', repetir: 5,
    quando: c => nome(c.v) >= 45,
    titulo: 'Um boato',
    texto: () => 'Um perfil de fofoca publicou uma história sobre você que não aconteceu. Em um dia, já estava em todo canto.',
    opcoes: [
      { id: 'desmentir', texto: 'Desmentir publicamente', comportamento: { coragem: 1 },
        resolver: c => { const deu = c.r.chance(clamp(0.45 + (nome(c.v) - 45) / 200 + (c.v.fatos['vis_boa'] !== undefined && c.v.t - c.v.fatos['vis_boa'] <= 24 ? 0.15 : 0))); return deu ? { texto: 'O desmentido circulou mais que a mentira. Quem inventou apagou.', memoria: null, tom: 'bom', efeito: () => { c.v.mente.estresse = clamp(c.v.mente.estresse + 2); } } : { texto: 'O desmentido virou mais combustível: agora são duas histórias.', memoria: 'Um boato sobre você virou assunto nacional por semanas.', relevancia: 'biografia', tom: 'ruim', efeito: () => { c.v.fatos['vis_polemica'] = c.v.t; c.v.mente.estresse = clamp(c.v.mente.estresse + 6); } }; } },
      { id: 'ignorar', texto: 'Não responder', comportamento: { independencia: 1 },
        resolver: c => { const passou = c.r.chance(0.55); return { texto: passou ? 'Em duas semanas, ninguém lembrava.' : 'O silêncio foi lido como confirmação, por um tempo.', memoria: null, tom: passou ? 'neutro' : 'ruim', efeito: () => { if (!passou) c.v.fatos['vis_polemica'] = c.v.t; c.v.mente.estresse = clamp(c.v.mente.estresse + 3); } }; } },
      { id: 'processar', texto: 'Processar quem publicou',
        consequencia: () => `Advogado: uns ${fmt(12000)}. Demora.`,
        resolver: c => ({ texto: 'O processo correu devagar. A retratação saiu meses depois, menor que o estrago — mas saiu.', memoria: 'Processou um perfil que publicou um boato sobre você — e ganhou a retratação.', relevancia: 'biografia', tom: 'neutro', efeito: () => { pagar(c.v, 12000); c.v.mente.estresse = clamp(c.v.mente.estresse + 4); } }) }
    ]
  },
  {
    // A porta de "apoiar uma causa" (`visibilidade`): QUAL causa é escolha — a consequência vem de quem você é para ela.
    id: 'vis_causa', tipo: 'decisao', idade: [16, 99], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'Apoiar uma causa',
    texto: c => `O seu nome chega a muita gente${porOrigem(c.v) ? ` (${porOrigem(c.v)})` : ''}. Para onde emprestá-lo?`,
    opcoes: [0, 1, 2, 3].map(k => ({
      id: `c${k}`,
      texto: (c: Ctx) => causasPossiveis(c.v)[k]?.nome ?? '—',
      disponivel: (c: Ctx) => (causasPossiveis(c.v)[k] ? true : false),
      resolver: (c: Ctx) => {
        const causa = causasPossiveis(c.v)[k];
        const res = apoiarCausa(c.v, c.r, causa.id);
        return { texto: res.texto, memoria: res.memoria, relevancia: 'biografia' as const, tom: res.tom };
      }
    }))
  }
];

