/**
 * "Quero conhecer alguém": a busca ativa, sem virar aplicativo de encontros.
 *
 *   INTENÇÃO     o jogador escolhe procurar (cada lugar uma vez no ano; quantas vezes, a rotina diz — REWORK 10.5)
 *   → CONTEXTO   onde: os amigos apresentam, a atividade da semana, o
 *                trabalho ou a faculdade, sair à noite, um aplicativo
 *   → PESSOA     às vezes aparece alguém; às vezes ninguém (é válido)
 *   → INTERAÇÃO  a primeira conversa — o resultado diz como foi
 *   → INTERESSE  da OUTRA pessoa (`romance.interesseInicial` + o contexto +
 *                afinidade + o dia): pode haver, pode não haver
 *   → RELAÇÃO POTENCIAL: com interesse, a pessoa fica "no ar"
 *                (`romance.estagio = 'interesse'`) e chamar para sair vira a
 *                próxima ação (`interacoes.convidar`), com a chance dela.
 *
 * Rejeição e não encontrar ninguém são resultados normais. A pessoa
 * encontrada fica na vida (Pessoas) e segue o mesmo modelo de qualquer outra.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, lembrarCom, parceiro, vinculosVivos, foraDaParceria } from '../nucleo';
import { bloqueio, PERMITIDO, podeTentar, type Veredito } from '../plausibilidade';
import { criarPessoa, vincular } from '../pessoas';
import { acordoConsentido, interesseInicial, podeTerRomance } from './romance';
import { ambientesAtuais, compatibilidade, ROTINAS_SOCIAIS } from './social';
import { nivelDeOferta } from '../dados/lugares';
import { vereditoDePagar } from './dinheiro';
import { flex } from '../texto';
import { buscaDoPerfil, etapaDoApp, novoContexto, pesoDoContexto, registrarFase } from './relacoes';

export type ContextoBusca = 'amigos' | 'atividade' | 'estudo_trabalho' | 'noite' | 'app';

export const ROTULO_BUSCA: Record<ContextoBusca, string> = {
  amigos: 'Pedir aos amigos que apresentem alguém',
  atividade: 'Prestar atenção em quem aparece na sua atividade',
  estudo_trabalho: 'Se abrir para alguém do dia a dia',
  noite: 'Sair para conhecer gente',
  app: 'Tentar um aplicativo de encontros'
};

const CUSTO_NOITE = 150;
/** As buscas deste ano (cada uma em um lugar). */
const buscasDoAno = (v: Vida) => v.anoAtual.acoes.filter(a => a.startsWith('buscar:'));

/**
 * REWORK 10.5 · REL-08 — quantas vezes no ano dá para sair procurando alguém: não é um limite arbitrário de uma, é a
 * rotina. Quem tem a semana cheia (trabalho integral E estudo, ou a semana já pesada) tem menos noites; quem é sociável
 * e tem tempo, mais. Cada lugar uma vez no ano (o mesmo aplicativo de novo não é uma busca nova), e quem já procurou
 * muito acha menos (o círculo é o mesmo, o cansaço também).
 */
export function buscasPossiveisNoAno(v: Vida): number {
  const cheia = (v.trabalho.atual?.carga === 'integral' ? 1 : 0) + (v.educacao.matricula && !v.educacao.matricula.trancado ? 1 : 0) + (v.mente.estresse >= 65 ? 1 : 0);
  const social = v.personalidade.tracos.sociabilidade >= 3 ? 1 : 0;
  return clamp(3 + social - cheia, 1, 4);
}

function amigosNaCidade(v: Vida) {
  return vinculosVivos(v).filter(x => !x.p.especie && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && x.p.municipioId === v.moradia.municipioId);
}
function atividadeSocial(v: Vida) {
  return v.rotinas.find(r => ROTINAS_SOCIAIS[r.id]);
}
/** REWORK 11 · NPC-11.1: a chave do ambiente de hoje (o trabalho, a faculdade, a escola) — o mesmo que `conhecerGente` grava. */
const ambienteDoDiaADia = (v: Vida, tipo: string) => ambientesAtuais(v).find(a => a.tipo === tipo)?.chave;
function diaADia(v: Vida): string | undefined {
  if (v.educacao.matricula && !v.educacao.matricula.trancado && v.educacao.matricula.modalidade === 'presencial') return 'faculdade';
  if (v.trabalho.atual && v.trabalho.atual.contrato !== 'informal') return 'trabalho';
  if (v.educacao.basica && idade(v) >= 15) return 'escola';
  return undefined;
}

export function disponibilidadeBusca(v: Vida, ctx: ContextoBusca): Veredito {
  const i = idade(v);
  if (i < 15) return bloqueio('impossivel', 'Ainda é cedo para isso.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não daqui.');
  const par = parceiro(v);
  // REWORK 11 · REL-11.1: com parceria, procurar alguém é possível — dentro do combinado (acordo aberto/poliamor), ou
  // como escolha consciente: seria traição (o veredito diz, e a parceria pode perceber — `buscarAlguem`).
  const combinado = !!par && acordoConsentido(par.vin.romance);
  if (par && i < 18) return bloqueio('incompativel', `Você está com ${par.p.nome}.`);
  if (vinculosVivos(v).some(x => x.vin.romance && !foraDaParceria(x.vin.romance) && (x.vin.romance.estagio === 'saindo' || x.vin.romance.pediuTempo !== undefined))) return bloqueio('incompativel', 'Você já está saindo com alguém (ou esperando uma resposta).');
  // Uma conversa do aplicativo em andamento é uma iniciativa em curso: o próximo passo é com essa pessoa (`relacoes`).
  const conversa = vinculosVivos(v).find(x => x.vin.romance?.estagio === 'interesse' && etapaDoApp(v, x.vin) && x.vin.contexto?.etapa !== 'encerrado');
  if (conversa) return bloqueio('incompativel', `Você está conversando com ${conversa.p.nome} pelo aplicativo: o próximo passo é com ${flex(conversa.p.genero, 'ele', 'ela', 'elu')}.`);
  if (!v.eu.atracao) return bloqueio('requisito', 'Diga antes por quem você se interessa (logo abaixo).');
  const feitas = buscasDoAno(v);
  if (feitas.includes(`buscar:${ctx}`)) return bloqueio('incompativel', 'Você já tentou por aqui este ano. Outro lugar, talvez.');
  if (feitas.length >= buscasPossiveisNoAno(v)) return bloqueio('incompativel', `Este ano já foram ${feitas.length} tentativas: a semana não tem mais noites livres para isso.`);
  switch (ctx) {
    case 'amigos': return traicao(amigosNaCidade(v).length ? PERMITIDO : bloqueio('requisito', 'Precisa de amigos por perto para apresentarem alguém.'));
    case 'atividade': return traicao(atividadeSocial(v) ? PERMITIDO : bloqueio('requisito', 'Nenhuma atividade da semana põe você no meio de gente.'));
    case 'estudo_trabalho': return traicao(diaADia(v) ? PERMITIDO : bloqueio('requisito', 'Sem escola, faculdade ou trabalho com gente em volta.'));
    case 'noite': return i < 18 ? bloqueio('impossivel', 'A partir dos 18.') : traicao(vereditoDePagar(v, CUSTO_NOITE, 'Uma noite fora custa uns'));
    case 'app': return i < 18 ? bloqueio('impossivel', 'A partir dos 18.') : traicao(PERMITIDO);
  }
  function traicao(x: Veredito): Veredito {
    if (!par || combinado || !podeTentar(x)) return combinado && podeTentar(x) ? { ...x, motivo: x.motivo ?? 'Dentro do combinado de vocês.' } : x;
    return { grau: 'irregular', motivo: `Você está com ${par.p.nome}: procurar alguém seria traição — e ${flex(par.p.genero, 'ele', 'ela', 'elu')} pode perceber.` };
  }
}

/** Os contextos que fazem sentido agora (os que não se aplicam somem). */
export function contextosDeBusca(v: Vida): ContextoBusca[] {
  const i = idade(v);
  const out: ContextoBusca[] = [];
  if (amigosNaCidade(v).length) out.push('amigos');
  if (atividadeSocial(v)) out.push('atividade');
  if (diaADia(v)) out.push('estudo_trabalho');
  if (i >= 18) out.push('noite', 'app');
  return out;
}

export interface SaidaBusca { resultado: string; titulo?: string; pessoaId?: string }

const MOD: Record<ContextoBusca, { acha: number; interesse: number }> = {
  amigos: { acha: 0.55, interesse: 8 },
  atividade: { acha: 0.42, interesse: 4 },
  estudo_trabalho: { acha: 0.38, interesse: 2 },
  noite: { acha: 0.55, interesse: -6 },
  app: { acha: 0.68, interesse: 0 }
};

export function buscarAlguem(v: Vida, r: Rng, ctx: ContextoBusca): SaidaBusca {
  v.anoAtual.acoes.push(`buscar:${ctx}`);
  const i = idade(v);
  v.fatos['buscas_romance'] = (v.fatos['buscas_romance'] ?? 0) + 1;
  if (ctx === 'noite') v.financas.conta -= CUSTO_NOITE;
  const cidade = nivelDeOferta(v.moradia.municipioId);
  const soc = v.personalidade.tracos.sociabilidade;
  // REWORK 10.5 · REL-08: a segunda e a terceira busca do ano rendem menos (o mesmo círculo, o mesmo cansaço).
  const antes = buscasDoAno(v).length - 1;
  let acha = MOD[ctx].acha + soc / 250 + (v.mente.felicidade - 50) / 300 - (i >= 45 ? 0.1 : 0) - antes * 0.08;
  if (ctx === 'app' && cidade < 1) acha -= 0.18;
  if (!r.chance(clamp(acha, 0.12, 0.85))) {
    const frase = ctx === 'app' ? 'Muitas conversas começaram e pararam no "oi, tudo bem?". Ninguém especial desta vez.'
      : ctx === 'noite' ? 'A noite foi boa, a música alta demais para conversar. Ninguém especial.'
        : ctx === 'amigos' ? 'Os amigos prometeram pensar em alguém. Ninguém apareceu ainda.'
          : 'Você prestou atenção, puxou uma ou outra conversa. Nada aconteceu — por enquanto.';
    return { resultado: frase };
  }
  // A pessoa: perto da sua idade, do gênero por quem você se interessa, da mesma cidade.
  const at = v.eu.atracao!;
  const genero = at === 'homens' ? 'masculino' : at === 'mulheres' ? 'feminino' : r.chance(0.5) ? 'masculino' : 'feminino';
  const faixa = i < 18 ? [15, 18] : [Math.max(18, i - 6), Math.min(80, i + 6)];
  const p = criarPessoa(v, r, { idade: r.int(faixa[0], faixa[1]), genero, municipioId: v.moradia.municipioId });
  // No aplicativo e pela mão dos amigos, quem aparece está procurando alguém como você; nos outros lugares, nem sempre.
  if (ctx === 'app' || ctx === 'amigos') p.atracao = v.eu.genero === 'masculino' ? (r.chance(0.85) ? 'homens' : 'ambos') : v.eu.genero === 'feminino' ? (r.chance(0.85) ? 'mulheres' : 'ambos') : 'ambos';
  p.parceiroId = undefined;
  const amigo = ctx === 'amigos' ? r.pick(amigosNaCidade(v)) : undefined;
  const rot = ctx === 'atividade' ? atividadeSocial(v) : undefined;
  const origem = ctx === 'app' ? 'online' : ctx === 'amigos' ? 'apresentado' : ctx === 'atividade' ? 'rotina' : ctx === 'noite' ? 'apresentado' : diaADia(v) === 'trabalho' ? 'trabalho' : diaADia(v) === 'faculdade' ? 'faculdade' : 'escola';
  const vin = vincular(v, p, { origem, proximidade: r.int(18, 28), estagio: 'conhecido' });
  if (rot) { vin.ambiente = `rotina:${rot.id}:${v.moradia.municipioId}`; vin.convivio = ['rotina']; }
  // REWORK 11 · NPC-11.1: quem se conhece "no trabalho" (na faculdade, na escola) está MESMO lá — o ambiente de hoje vai
  // junto (antes, a pessoa ficava "do trabalho" sem dividir o trabalho: "Vocês se conheceram no trabalho" e nada mais).
  else if (origem === 'trabalho' || origem === 'faculdade' || origem === 'escola') {
    const amb = ambienteDoDiaADia(v, origem);
    if (amb) { vin.ambiente = amb; vin.convivio = [origem]; }
  }
  // O contexto da relação nasce aqui (a origem): no app, quem aparece está procurando alguém — e o perfil diz o quê.
  vin.contexto = novoContexto(ctx === 'app' ? 'app' : ctx === 'amigos' ? 'amigos' : ctx === 'noite' ? 'noite' : ctx === 'atividade' ? 'atividade' : diaADia(v) === 'trabalho' ? 'trabalho' : diaADia(v) === 'faculdade' ? 'faculdade' : 'escola', ctx === 'app' ? { busca: buscaDoPerfil(v, p, r), etapa: 'match' } : {});
  registrarFase(v, vin, 'conhecido');
  const comp = compatibilidade(v, p);
  const interesse = clamp(Math.round(interesseInicial(v, p) + MOD[ctx].interesse + pesoDoContexto(v, vin) + comp * 12 + r.normal() * 8));
  const onde = ctx === 'app' ? `Pelo aplicativo, você conheceu ${p.nome}`
    : ctx === 'amigos' ? `${amigo?.p.nome ?? 'Uma amiga'} apresentou ${p.nome} num aniversário`
      : ctx === 'atividade' ? `${cap(ROTINAS_SOCIAIS[rot!.id].onde)}, você e ${p.nome} começaram a conversar`
        : ctx === 'noite' ? `Numa noite fora, você conheceu ${p.nome}`
          : `${diaADia(v) === 'trabalho' ? 'No trabalho' : diaADia(v) === 'faculdade' ? 'Na faculdade' : 'Na escola'}, você e ${p.nome} começaram a conversar de verdade`;
  if (amigo) lembrarCom(v, amigo.p.id, `Apresentou ${p.nome} a você.`, 'amizade', 1);
  // REWORK 11 · REL-11.1: procurar alguém estando num relacionamento exclusivo é escolha com risco — a parceria pode
  // perceber (o celular, o aplicativo, a noite fora): ciúme, confiança abalada, a pergunta no ar.
  const parc = parceiro(v);
  const percebeu = parc && !acordoConsentido(parc.vin.romance) && r.chance(ctx === 'app' ? 0.22 : ctx === 'noite' ? 0.18 : 0.1) ? notarBusca(v, parc.p, parc.vin, ctx) : '';
  const pode = podeTerRomance(v, p, vin);
  if (!pode || interesse < 45) {
    if (vin.contexto) vin.contexto.etapa = 'encerrado';
    const texto = ctx === 'app' ? `Você curtiu o perfil de ${p.nome}; o match veio, a conversa não. Parou no "oi, tudo bem?".` : `${onde}. A conversa foi educada — e só. ${flex(p.genero, 'Ele', 'Ela', 'Elu')} não pareceu interessad${flex(p.genero, 'o', 'a', 'e')}.`;
    return { resultado: `${texto}${percebeu}`, titulo: p.nome, pessoaId: p.id };
  }
  vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: interesse };
  if (ctx === 'app') {
    vin.proximidade = clamp(vin.proximidade + 4);
    registrarFase(v, vin, 'match');
    lembrarCom(v, p.id, 'Deram match num aplicativo.', 'inicio', 1);
    escrever(v, { texto: `Deu match com ${p.nome} num aplicativo de encontros.`, relevancia: 'cotidiano', tema: 'amor', escolha: true, pessoas: [p.id] });
    const procura = vin.contexto!.busca === 'relacionamento' ? 'procura um relacionamento' : vin.contexto!.busca === 'casual' ? 'diz que quer algo sem compromisso' : 'diz que "ainda não sabe o que procura"';
    return { resultado: `Deu match com ${p.nome}: os dois curtiram. No perfil, ${p.ocupacao ? `${p.ocupacao}, ` : ''}${procura}. O próximo passo é conversar (em Pessoas).${percebeu}`, titulo: p.nome, pessoaId: p.id };
  }
  vin.proximidade = clamp(vin.proximidade + 8);
  lembrarCom(v, p.id, ctx === 'amigos' ? `Foram apresentados por ${amigo?.p.nome ?? 'amigos'}.` : 'A primeira conversa de verdade.', 'inicio', 1);
  const faisca = interesse >= 62 ? 'Houve faísca dos dois lados: a conversa foi longe.' : 'Pareceu haver interesse — dá para chamar para sair e ver.';
  escrever(v, { texto: `${onde}.`, relevancia: 'cotidiano', tema: 'amor', escolha: true, pessoas: [p.id] });
  return { resultado: `${onde}. ${faisca}${percebeu}`, titulo: p.nome, pessoaId: p.id };
}

/** A parceria percebeu a busca: o ciúme tem causa (a mesma leitura do flerte comprometido, `afetos`). */
function notarBusca(v: Vida, par: Pessoa, vin: Vinculo, ctx: ContextoBusca): string {
  vin.tensao = clamp(vin.tensao + 18);
  vin.confianca = clamp(vin.confianca - 10);
  const oque = ctx === 'app' ? 'o aplicativo de encontros no seu celular' : ctx === 'noite' ? 'a noite fora, procurando gente' : 'que você andava procurando alguém';
  if (!vin.conflito || vin.conflito.gravidade < 2) vin.conflito = { t: v.t, assunto: oque, gravidade: 2, quem: 'eu' };
  lembrarCom(v, par.id, `Descobriu ${oque}.`, 'conflito', 2);
  return ` ${par.nome} percebeu ${oque}. A conversa em casa foi difícil.`;
}

/* ============================================================ Fazer amizades (REWORK 11 · REL-11.1) */

/**
 * A busca que não é romântica: puxar conversa, aceitar o convite do grupo, chegar mais perto de alguém da atividade.
 * Para qualquer estado civil (fazer amigos estando com alguém não é traição). Cada lugar uma vez no ano, no mesmo
 * limite de noites livres da busca romântica; a pessoa que aparece fica como conhecida (sem romance) — a amizade, se
 * vier, é construída depois (`social`), como qualquer outra.
 */
export type ContextoAmizade = Exclude<ContextoBusca, 'app'>;
export const ROTULO_AMIZADE: Record<ContextoAmizade, string> = {
  amigos: 'Ir ao encontro dos amigos e conhecer quem eles trazem',
  atividade: 'Puxar conversa com alguém da sua atividade',
  estudo_trabalho: 'Chegar mais perto de alguém do dia a dia',
  noite: 'Sair com um grupo novo'
};
const amizadesDoAno = (v: Vida) => v.anoAtual.acoes.filter(a => a.startsWith('amizade:'));

export function contextosDeAmizade(v: Vida): ContextoAmizade[] {
  const i = idade(v);
  const out: ContextoAmizade[] = [];
  if (amigosNaCidade(v).length) out.push('amigos');
  if (atividadeSocial(v)) out.push('atividade');
  if (diaADia(v)) out.push('estudo_trabalho');
  if (i >= 18) out.push('noite');
  return out;
}

export function disponibilidadeAmizade(v: Vida, ctx: ContextoAmizade): Veredito {
  const i = idade(v);
  if (i < 10) return bloqueio('impossivel', 'Ainda é cedo para isso.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não daqui.');
  const feitas = amizadesDoAno(v);
  if (feitas.includes(`amizade:${ctx}`)) return bloqueio('incompativel', 'Você já tentou por aqui este ano.');
  if (feitas.length >= buscasPossiveisNoAno(v)) return bloqueio('incompativel', `Este ano já foram ${feitas.length} tentativas: a semana não tem mais noites livres.`);
  if (!contextosDeAmizade(v).includes(ctx)) return bloqueio('requisito', ctx === 'noite' ? 'A partir dos 18.' : ctx === 'amigos' ? 'Precisa de amigos por perto.' : ctx === 'atividade' ? 'Nenhuma atividade da semana põe você no meio de gente.' : 'Sem escola, faculdade ou trabalho com gente em volta.');
  if (ctx === 'noite') return vereditoDePagar(v, CUSTO_NOITE, 'Uma noite fora custa uns');
  return PERMITIDO;
}

export function buscarAmizade(v: Vida, r: Rng, ctx: ContextoAmizade): SaidaBusca {
  v.anoAtual.acoes.push(`amizade:${ctx}`);
  if (ctx === 'noite') v.financas.conta -= CUSTO_NOITE;
  const i = idade(v);
  const soc = v.personalidade.tracos.sociabilidade;
  const antes = amizadesDoAno(v).length - 1;
  if (!r.chance(clamp(0.55 + soc / 200 + (v.mente.felicidade - 50) / 300 - antes * 0.08, 0.15, 0.9))) {
    return { resultado: ctx === 'noite' ? 'Foi uma noite boa, mas cada um voltou para o seu canto. Ninguém novo, desta vez.' : 'Você puxou conversa; ficou na conversa. Ninguém novo, por enquanto.' };
  }
  const faixa = i < 18 ? [Math.max(10, i - 2), Math.min(17, i + 2)] : [Math.max(18, i - 10), Math.min(85, i + 10)];
  const p = criarPessoa(v, r, { idade: r.int(faixa[0], faixa[1]), municipioId: v.moradia.municipioId });
  const amigo = ctx === 'amigos' ? r.pick(amigosNaCidade(v)) : undefined;
  const rot = ctx === 'atividade' ? atividadeSocial(v) : undefined;
  const origem = ctx === 'amigos' || ctx === 'noite' ? 'apresentado' : ctx === 'atividade' ? 'rotina' : diaADia(v) === 'trabalho' ? 'trabalho' : diaADia(v) === 'faculdade' ? 'faculdade' : 'escola';
  const comp = compatibilidade(v, p);
  const vin = vincular(v, p, { origem, proximidade: clamp(Math.round(22 + comp * 10 + r.int(0, 8))), estagio: 'conhecido' });
  if (rot) { vin.ambiente = `rotina:${rot.id}:${v.moradia.municipioId}`; vin.convivio = ['rotina']; }
  vin.contexto = novoContexto(ctx === 'amigos' ? 'amigos' : ctx === 'noite' ? 'noite' : ctx === 'atividade' ? 'atividade' : diaADia(v) === 'trabalho' ? 'trabalho' : diaADia(v) === 'faculdade' ? 'faculdade' : 'escola', {});
  registrarFase(v, vin, 'conhecido');
  lembrarCom(v, p.id, amigo ? `Conheceram-se por ${amigo.p.nome}.` : 'A primeira conversa de verdade.', 'inicio', 1);
  if (amigo) lembrarCom(v, amigo.p.id, `Apresentou ${p.nome} a você.`, 'amizade', 1);
  const onde = ctx === 'amigos' ? `${amigo?.p.nome ?? 'Os amigos'} trouxe ${p.nome}` : ctx === 'noite' ? `Num grupo novo, você conheceu ${p.nome}` : ctx === 'atividade' ? `${cap(ROTINAS_SOCIAIS[rot!.id].onde)}, você e ${p.nome} começaram a conversar` : `No dia a dia, você e ${p.nome} começaram a conversar de verdade`;
  escrever(v, { texto: `${onde}.`, relevancia: 'cotidiano', tema: 'amizade', escolha: true, pessoas: [p.id] });
  return { resultado: `${onde}. ${comp > 0.15 ? 'A conversa fluiu: dá vontade de repetir.' : 'Uma conversa boa — se vira amizade, o tempo diz.'}`, titulo: p.nome, pessoaId: p.id };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
