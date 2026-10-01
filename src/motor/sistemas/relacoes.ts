/**
 * Relações como TRAJETÓRIAS (pacote pós-playtest, Relações 2.0).
 *
 * Proximidade, confiança e afinidade continuam existindo — mas uma relação é
 * também a HISTÓRIA que ela acumula: de onde veio, as fases por que passou
 * (conhecido → colega → amigo → amigo próximo → afastado → reconciliação;
 * interesse → match → conversa → encontro → saindo → namoro → morar junto...),
 * os marcos (`historia`).
 *
 *   ORIGEM DEFINE CONTEXTO E INTENÇÃO INICIAL — NÃO DETERMINA O RESULTADO.
 *
 * Conhecer pelo aplicativo abre mais a porta romântica do que conhecer no
 * trabalho; um amigo de infância traz história. Nada disso garante nada:
 * a outra pessoa pode gostar como amigo, não sentir química, procurar outra
 * coisa, estar noutro momento — e o motivo, quando é razoavelmente
 * conhecível, é dito em palavras humanas (nunca um número).
 *
 * O aplicativo tem fluxo próprio: match (os dois deram like) → conversa →
 * encontro → química → continuar ou encerrar → (saindo) → exclusividade.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { ContextoDaRelacao, Pessoa, Vida, Vinculo } from '../tipos';
import { idade, idadePessoa, lembrarCom } from '../nucleo';
import { anoDe } from '../tempo';
import { compatibilidade } from './social';

/** A abertura romântica de cada origem (0..1). */
const ABERTURA: Record<ContextoDaRelacao['via'], number> = {
  app: 0.78, noite: 0.55, amigos: 0.5, evento: 0.45, viagem: 0.5, atividade: 0.4, esporte: 0.38, faculdade: 0.4, escola: 0.38,
  infancia: 0.35, vizinhanca: 0.3, trabalho: 0.22, familia: 0, outro: 0.3
};

/** O contexto de uma relação: o guardado, ou o derivado da origem (saves de antes não têm o campo — nada é inventado além da origem). */
export function contextoDaRelacao(v: Vida, vin: Vinculo): ContextoDaRelacao {
  if (vin.contexto) return vin.contexto;
  const p = v.pessoas[vin.pessoaId];
  const desdeCrianca = p && idade(v) - (v.t - vin.tInicio) / 12 < 12 && !vin.parentesco;
  const via: ContextoDaRelacao['via'] = vin.parentesco ? 'familia'
    : vin.origem === 'online' ? 'app'
      : desdeCrianca ? 'infancia'
        : vin.origem === 'trabalho' ? 'trabalho'
          : vin.origem === 'escola' ? 'escola'
            : vin.origem === 'faculdade' ? 'faculdade'
              : vin.origem === 'rotina' ? (/^rotina:(futebol|volei|basquete|tenis|natacao|corrida|academia|lutas)/.test(vin.ambiente ?? '') ? 'esporte' : 'atividade')
                : vin.origem === 'apresentado' ? 'amigos'
                  : vin.origem === 'vizinhanca' ? 'vizinhanca' : 'outro';
  return { via, abertura: ABERTURA[via] };
}

/** Cria o contexto de uma relação que começa agora (a busca ativa, o evento, a viagem). */
export function novoContexto(via: ContextoDaRelacao['via'], extra: Partial<ContextoDaRelacao> = {}): ContextoDaRelacao {
  return { via, abertura: ABERTURA[via], ...extra };
}

/**
 * O que a abertura do contexto soma ao interesse da outra pessoa (no mesmo
 * ponto em que proximidade, confiança e história somam): o app abre, o
 * trabalho fecha um pouco, a infância traz história. Nunca decide sozinho.
 */
export function pesoDoContexto(v: Vida, vin: Vinculo): number {
  const c = contextoDaRelacao(v, vin);
  return (c.abertura - 0.4) * 22 + (c.via === 'infancia' ? 3 : 0) + (c.quimica !== undefined ? (c.quimica - 50) * 0.3 : 0);
}

/** Registra uma fase da relação (sem repetir a última). */
export function registrarFase(v: Vida, vin: Vinculo, fase: string): void {
  const f = (vin.fases ??= []);
  if (f[f.length - 1]?.fase === fase) return;
  f.push({ fase, t: v.t });
  if (f.length > 24) f.splice(0, f.length - 24);
}

const NOME_FASE: Record<string, string> = {
  conhecido: 'se conheceram', colega: 'colegas', amigo: 'amigos', amigo_proximo: 'amigos próximos', afastado: 'se afastaram', reconciliacao: 'reaproximação',
  interesse: 'interesse no ar', match: 'match', conversa: 'conversas', encontro: 'primeiro encontro', saindo: 'saindo juntos', namoro: 'namoro',
  morando_junto: 'morando juntos', casamento: 'casamento', ex: 'separação', sem_quimica: 'sem química', so_amizade: 'ficaram na amizade'
};

const NOME_VIA: Record<ContextoDaRelacao['via'], string> = {
  app: 'pelo aplicativo', trabalho: 'no trabalho', escola: 'na escola', faculdade: 'na faculdade', esporte: 'no esporte', atividade: 'numa atividade da semana',
  amigos: 'por amigos', noite: 'numa noite fora', vizinhanca: 'na vizinhança', infancia: 'na infância', evento: 'num evento', viagem: 'numa viagem', familia: 'na família', outro: ''
};

/** A trajetória em palavras, para a ficha da pessoa: "Pelo aplicativo (2041) → conversas → primeiro encontro → saindo juntos (2042) → namoro (2042)". */
export function trajetoriaDaRelacao(v: Vida, vin: Vinculo): string | undefined {
  const c = contextoDaRelacao(v, vin);
  if (c.via === 'familia') return undefined;
  const f = vin.fases ?? [];
  const inicio = NOME_VIA[c.via] ? `Conheceram-se ${NOME_VIA[c.via]} (${anoDe(vin.tInicio)})` : `Desde ${anoDe(vin.tInicio)}`;
  const passos = f.filter(x => x.fase !== 'conhecido').map(x => `${NOME_FASE[x.fase] ?? x.fase} (${anoDe(x.t)})`);
  return [inicio, ...passos].join(' → ');
}

/* ------------------------------------------------------------ O aplicativo */

/** O que alguém do aplicativo procura (no perfil): pela idade, com acaso. */
export function buscaDoPerfil(v: Vida, p: Pessoa, r: Rng): NonNullable<ContextoDaRelacao['busca']> {
  const i = idadePessoa(v, p);
  const x = r.next();
  const casual = i < 26 ? 0.38 : i < 41 ? 0.24 : 0.18;
  const incerto = i < 26 ? 0.17 : 0.2;
  return x < casual ? 'casual' : x < casual + incerto ? 'incerto' : 'relacionamento';
}

export const etapaDoApp = (v: Vida, vin: Vinculo) => (contextoDaRelacao(v, vin).via === 'app' && vin.romance?.estagio === 'interesse' ? vin.contexto?.etapa : undefined);

/** A conversa no aplicativo: segue, esfria ou some (o "sumiço" é da outra pessoa). */
export function conversarNoApp(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const c = vin.contexto!;
  const comp = compatibilidade(v, p);
  const x = 0.45 + comp * 0.35 + v.personalidade.tracos.sociabilidade / 300 + ((vin.romance?.envolvimento ?? 50) - 50) / 120;
  if (r.chance(clamp(x, 0.15, 0.85))) {
    c.etapa = 'conversa';
    vin.proximidade = clamp(vin.proximidade + 6);
    // A conversa é atitude: o interesse continua vivo (o "interesse sem atitude" se dissolve em dois anos — `romance`).
    if (vin.romance) { vin.romance.envolvimento = clamp(vin.romance.envolvimento + 4); vin.romance.tEstagio = v.t; }
    registrarFase(v, vin, 'conversa');
    lembrarCom(v, p.id, 'Semanas de conversa pelo aplicativo.', 'romance', 1);
    return { texto: comp > 0.3 ? `A conversa com ${p.nome} foi longe: áudios compridos, uma série em comum, a vontade de marcar.` : `A conversa com ${p.nome} andou — devagar, mas andou.`, tom: 'bom' };
  }
  c.etapa = 'encerrado';
  vin.romance = undefined;
  registrarFase(v, vin, 'sem_quimica');
  return { texto: `${p.nome} parou de responder depois de alguns dias. No aplicativo, acontece — e não diz nada sobre você.`, tom: 'neutro' };
}

/**
 * O encontro: a QUÍMICA (oculta) nasce da afinidade, de como cada um se
 * mostra, do dia. O que a pessoa procura pesa no depois. Pode virar saída,
 * segundo encontro, amizade — ou acabar ali.
 */
export function encontroDoApp(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): { resultado: 'saindo' | 'talvez' | 'amizade' | 'sem_quimica'; quimica: number } {
  const c = vin.contexto!;
  const comp = compatibilidade(v, p);
  // O segundo encontro (depois de um "talvez") decide: ou engata, ou acaba ali.
  const segundo = c.quimica !== undefined;
  const quimica = clamp(Math.round(48 + comp * 26 + (v.corpo.aparencia - 50) / 6 + v.personalidade.tracos.sociabilidade / 12 - (v.mente.estresse - 50) / 10 + r.normal() * 12 + (segundo ? (c.quimica! - 50) * 0.4 : 0)));
  c.quimica = quimica;
  c.etapa = 'encontro';
  if (vin.romance) vin.romance.tEstagio = v.t;
  registrarFase(v, vin, 'encontro');
  const interesse = (vin.romance?.envolvimento ?? 50) + (quimica - 50) * 0.6;
  if (quimica >= 60 && interesse >= 54) return { resultado: 'saindo', quimica };
  if (quimica >= 50 && !segundo) return { resultado: 'talvez', quimica };
  if (comp > 0.35) return { resultado: 'amizade', quimica };
  return { resultado: 'sem_quimica', quimica };
}
