/**
 * REWORK 10.5 · REL-06 / REL-09 — O QUE O AFETO SOZINHO NÃO DIZ.
 *
 * Infidelidade e relações paralelas, com o consentimento separado da traição:
 *
 *   FLERTAR COMPROMETIDO   olhar para outra pessoa estando com alguém. A outra pessoa pode corresponder (e daí o convite
 *                          escondido vira o próximo passo) ou mudar de assunto; a parceria pode perceber. Num acordo
 *                          aberto, não é traição — é o combinado.
 *   O ACORDO               propor abrir a relação é uma conversa difícil: a parceria decide pelo jeito dela (a abertura,
 *                          o quanto está na relação). Recusado, fica a tensão; aceito, sair com outra pessoa deixa de ser
 *                          segredo. Voltar a ser exclusivo é sempre possível.
 *   A OUTRA PESSOA TAMBÉM  a parceria (NPC) pode ter alguém fora do combinado — mais quando a relação vai mal, a distância
 *                          é grande e o jeito dela é mais solto. Você pode descobrir (`rom105_infiel`), ou não.
 *
 * E duas dimensões da relação que o afeto não cobre (REL-09): a INTIMIDADE (o quanto vocês se contam) e o COMPROMISSO
 * (o quanto a vida de vocês está amarrada). As ações deixam de mexer todas na mesma barra: conversar de verdade
 * aproxima por dentro; o cinema, pouco; os planos e as decisões amarram. O namoro e o casamento sobem o compromisso —
 * nunca a confiança ao máximo (essa continua sendo construída, e a traição continua contando).
 */

import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idadePessoa, lembrarCom, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO } from '../plausibilidade';
import { acordoConsentido, atraiGenero, interesseInicial, mudarEstagio } from './romance';
import { compatibilidade } from './social';
import type { CtxI, Interacao } from './interacoes';
import { flex } from '../texto';
import { municipio } from '../dados/lugares';

const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
/** Há um acordo que permite outra pessoa (aberto ou poliamor — REWORK 11 · REL-11.4). */
const aberto = (v: Vida) => acordoConsentido(parceiro(v)?.vin.romance);

/* ============================================================ Intimidade e compromisso (REL-09) */

/** O quanto cada interação aproxima por dentro (intimidade) e amarra a vida (compromisso). O resto: zero. */
const INTIMA: Record<string, number> = {
  desabafar: 8, compartilhar_segredo: 10, intimidade: 8, aprofundar: 7, falar_futuro: 5, contar_verdade: 6, pedir_conselho: 4, aconselhar: 4,
  apoiar: 5, duvidas: 4, contar_novidade: 3, conversar: 2, perguntar_vida: 2, reconhecer_erro: 4, reconstruir_confianca: 3, desculpas: 2,
  cinema: 1, jantar_fora: 1, show: 1, viajar_juntos: 3, fim_de_semana: 2, caminhar_junto: 2,
  mentir: -8, espalhar_boato: -10, insultar: -6, ameacar: -10, intimidar: -10, agredir: -15, desmarcar: -2, cortar_relacoes: -15
};
const AMARRA: Record<string, number> = {
  futuro_casal: 6, dinheiro_casal: 5, planejar_filhos: 6, conversar_mudanca: 4, dividir_financas: 10, assumir_publico: 8, marcar_casamento: 10,
  conhecer_familia: 5, falar_futuro: 2, desmarcar: -2, terminar: -40, cortar_relacoes: -30
};
/** O compromisso que cada marco firma (o mínimo depois dele; nunca a confiança). */
export const COMPROMISSO_DO_MARCO = { namoro: 30, morar: 55, noivado: 70, casamento: 80 } as const;

/** O ponto de partida de quem ainda não tinha as dimensões (saves antigos, gente nova): lido do que já existe. */
const intimidadeDe = (vin: Vinculo) => vin.intimidade ?? Math.round(vin.proximidade * 0.45 + vin.confianca * 0.15);
const COMPROMISSO_DO_ESTAGIO: Partial<Record<string, number>> = { saindo: 10, namoro: 30, morando_junto: 55, casamento: 80 };
const compromissoDe = (vin: Vinculo) => vin.compromisso ?? (vin.romance ? COMPROMISSO_DO_ESTAGIO[vin.romance.estagio] ?? 0 : 0);

/** Depois de cada interação: o que ela fez por dentro da relação (com retornos que cansam, como o afeto). */
export function aplicarDimensoes(vin: Vinculo, interacao: string, fator = 1): void {
  const di = INTIMA[interacao], dc = AMARRA[interacao];
  if (di) vin.intimidade = clamp(Math.round(intimidadeDe(vin) + di * (di > 0 ? fator : 1)));
  if (dc && (vin.romance || dc < 0)) vin.compromisso = clamp(Math.round(compromissoDe(vin) + dc * (dc > 0 ? fator : 1)));
}

/** O marco firma o compromisso (o mínimo do marco) — e só isso: a confiança continua sendo a que foi construída. */
export function firmarCompromisso(vin: Vinculo, marco: keyof typeof COMPROMISSO_DO_MARCO): void {
  vin.compromisso = Math.max(compromissoDe(vin), COMPROMISSO_DO_MARCO[marco]);
}

/** As dimensões em palavras (a ficha): só quando já existem nesta relação. */
export function dimensoesEmPalavras(vin: Vinculo): { id: string; rotulo: string; palavra: string; tom: 'bom' | 'neutro' | 'ruim' }[] {
  const out: { id: string; rotulo: string; palavra: string; tom: 'bom' | 'neutro' | 'ruim' }[] = [];
  if (vin.intimidade !== undefined) { const x = vin.intimidade; out.push({ id: 'intimidade', rotulo: 'Intimidade', palavra: x >= 70 ? 'se contam tudo' : x >= 45 ? 'se contam muito' : x >= 20 ? 'do dia a dia' : 'de superfície', tom: x >= 45 ? 'bom' : x >= 20 ? 'neutro' : 'ruim' }); }
  if (vin.compromisso !== undefined && vin.romance) { const x = vin.compromisso; out.push({ id: 'compromisso', rotulo: 'Compromisso', palavra: x >= 75 ? 'vidas amarradas' : x >= 50 ? 'firme' : x >= 25 ? 'começando' : 'solto', tom: x >= 50 ? 'bom' : 'neutro' }); }
  return out;
}

/* ============================================================ O flerte, o acordo (REL-06) */

/** Quem você pode olhar estando com alguém: adulto, de fora da família, do gênero por quem você se interessa. */
function flerteCabe(c: CtxI): boolean {
  const par = parceiro(c.v);
  if (!par || par.p.id === c.p.id || c.p.especie || c.vin.parentesco || c.eu < 18 || c.ip < 18) return false;
  if (c.vin.romance && c.vin.romance.estagio !== 'interesse') return false;
  if (c.v.eu.atracao && !atraiGenero(c.v.eu.atracao, c.p.genero)) return false;
  if (c.vin.formacao && c.vin.formacao.papel !== 'colega' && c.vin.formacao.tFim === undefined) return false;
  return c.vin.proximidade >= 15;
}

/** A parceria percebe? (O mesmo trabalho, a mesma turma, ser descuidado — num acordo aberto, não há o que perceber.) */
function parceriaPercebe(v: Vida, r: Rng, alvo: Vinculo): boolean {
  if (aberto(v)) return false;
  const perto = alvo.convivio.some(x => x === 'casa' || x === 'vizinhanca') ? 0.15 : alvo.convivio.includes('trabalho') ? 0.06 : 0;
  return r.chance(0.08 + perto + Math.max(0, v.personalidade.tracos.impulsividade) / 400);
}

function ciumeDaParceria(v: Vida, alvo: Pessoa, oque: string): string | undefined {
  const par = parceiro(v);
  if (!par) return undefined;
  const vin = par.vin;
  vin.tensao = clamp(vin.tensao + 18);
  vin.confianca = clamp(vin.confianca - 8);
  if (!vin.conflito || vin.conflito.gravidade < 2) vin.conflito = { t: v.t, assunto: `${oque} com ${alvo.nome}`, gravidade: 2, quem: 'eu' };
  lembrarCom(v, par.p.id, `Percebeu ${oque} com ${alvo.nome}.`, 'conflito', 2);
  return `${par.p.nome} percebeu. A noite terminou em silêncio — e a pergunta ficou no ar.`;
}

export const INTERACOES_DE_AFETO: Interacao[] = [
  {
    id: 'flertar_comprometido', variante: 'discreto', chance: true,
    quando: c => flerteCabe(c) && !(c.vin.romance?.estagio === 'interesse'),
    disponivel: c => (aberto(c.v) ? PERMITIDO : { grau: 'irregular', motivo: `Você está com ${parceiro(c.v)!.p.nome}: o combinado de vocês é ser só os dois.`, chance: clamp((interesseInicial(c.v, c.p) + compatibilidade(c.v, c.p) * 20 - 25) / 70, 0.05, 0.8) }),
    rotulo: c => (aberto(c.v) ? `Flertar com ${c.p.nome} (vocês combinaram que pode)` : `Flertar com ${c.p.nome}`),
    executar: (c, r) => {
      const quer = c.p.atracao ? atraiGenero(c.p.atracao, c.v.eu.genero) : true;
      const chance = quer && !c.p.parceiroId ? clamp((interesseInicial(c.v, c.p) + compatibilidade(c.v, c.p) * 20 - 25) / 70, 0.05, 0.8) : 0.04;
      const percebeu = parceriaPercebe(c.v, r, c.vin) ? ciumeDaParceria(c.v, c.p, 'o flerte') : undefined;
      if (!r.chance(chance)) {
        c.vin.proximidade = clamp(c.vin.proximidade - 1);
        return { resultado: `${c.p.nome} sorriu e mudou de assunto.${percebeu ? ` ${percebeu}` : ''}`, titulo: c.p.nome };
      }
      c.vin.romance = { estagio: 'interesse', tEstagio: c.v.t, envolvimento: clamp(Math.round(interesseInicial(c.v, c.p) + 8)) };
      return { resultado: `${c.p.nome} correspondeu — o olhar demorou um pouco mais do que devia.${aberto(c.v) ? ' Dentro do combinado.' : ' Ninguém disse nada. Ainda.'}${percebeu ? ` ${percebeu}` : ''}`, titulo: c.p.nome };
    }
  },
  {
    id: 'propor_acordo_aberto', variante: 'discreto', chance: true,
    quando: c => c.papel === 'parceiro' && c.eu >= 18 && c.ip >= 18 && !c.vin.romance?.acordo,
    disponivel: c => (c.vin.tensao >= 60 ? bloqueio('incompativel', 'Com a tensão desse tamanho, essa conversa viraria briga.') : { grau: 'improvavel', motivo: 'Uma conversa difícil: a resposta é dela — e pode ser não.', chance: chanceDoAcordo(c) }),
    rotulo: c => `Conversar com ${c.p.nome} sobre abrir a relação`,
    executar: (c, r) => {
      const rom = c.vin.romance!;
      if (r.chance(chanceDoAcordo(c))) {
        rom.acordo = 'aberto';
        lembrarCom(c.v, c.p.id, 'Combinaram abrir a relação.', 'romance', 2);
        escrever(c.v, { texto: `Você e ${c.p.nome} combinaram abrir a relação: sair com outras pessoas deixou de ser segredo.`, relevancia: 'biografia', tema: 'amor', escolha: true, pessoas: [c.p.id] });
        return { resultado: `${c.p.nome} pensou, perguntou muito — e topou, com regras ditas em voz alta.`, titulo: c.p.nome };
      }
      c.vin.tensao = clamp(c.vin.tensao + 15);
      rom.envolvimento = clamp(rom.envolvimento - 6);
      if (!c.vin.conflito) c.vin.conflito = { t: c.v.t, assunto: 'a proposta de abrir a relação', gravidade: 1, quem: 'eu' };
      lembrarCom(c.v, c.p.id, 'Você propôs abrir a relação; não foi aceito.', 'conflito', 1);
      return { resultado: `${c.p.nome} disse não — e passou uns dias perguntando o que faltava.`, titulo: c.p.nome };
    }
  },
  {
    // REWORK 11 · REL-11.4: o poliamor — mais de um vínculo romântico, todos sabendo e de acordo. A parceria principal
    // continua sendo esta (a casa, o dinheiro, os filhos); o outro vínculo é `paralelo`. A resposta é dela.
    id: 'propor_poliamor', variante: 'discreto', chance: true,
    quando: c => c.papel === 'parceiro' && c.eu >= 18 && c.ip >= 18 && c.vin.romance?.acordo !== 'poliamor',
    disponivel: c => (c.vin.tensao >= 60 ? bloqueio('incompativel', 'Com a tensão desse tamanho, essa conversa viraria briga.') : { grau: 'improvavel', motivo: 'Mais do que abrir: outro vínculo de verdade, com todo mundo sabendo. A resposta é dela — e pode ser não.', chance: chancePoliamor(c) }),
    rotulo: c => `Conversar com ${c.p.nome} sobre poliamor (outro vínculo, todos sabendo)`,
    executar: (c, r) => {
      const rom = c.vin.romance!;
      if (r.chance(chancePoliamor(c))) {
        rom.acordo = 'poliamor';
        lembrarCom(c.v, c.p.id, 'Combinaram viver o poliamor: outros vínculos, todos sabendo.', 'romance', 2);
        escrever(c.v, { texto: `Você e ${c.p.nome} combinaram o poliamor: um outro vínculo pode existir — à vista, com o acordo de todos.`, relevancia: 'biografia', tema: 'amor', escolha: true, pessoas: [c.p.id] });
        return { resultado: `${c.p.nome} quis entender cada detalhe — quem sabe o quê, o que muda em casa. E topou: a casa e a vida de vocês continuam as mesmas.`, titulo: c.p.nome };
      }
      c.vin.tensao = clamp(c.vin.tensao + 12);
      rom.envolvimento = clamp(rom.envolvimento - 5);
      if (!c.vin.conflito) c.vin.conflito = { t: c.v.t, assunto: 'a proposta de poliamor', gravidade: 1, quem: 'eu' };
      lembrarCom(c.v, c.p.id, 'Você propôs o poliamor; não foi aceito.', 'conflito', 1);
      return { resultado: `${c.p.nome} disse que não — ${rom.acordo === 'aberto' ? 'sair com alguém é uma coisa; outro amor, outra' : 'não é o que quer para vocês'}.`, titulo: c.p.nome };
    }
  },
  {
    id: 'voltar_exclusivo', variante: 'discreto',
    quando: c => c.papel === 'parceiro' && acordoConsentido(c.vin.romance),
    rotulo: c => `Combinar com ${c.p.nome} de voltar a ser só os dois`,
    executar: c => {
      delete c.vin.romance!.acordo;
      // O que havia fora, dentro do combinado, acaba aqui (continuar seria outra coisa).
      for (const x of Object.values(c.v.vinculos)) if (x.pessoaId !== c.p.id && (x.romance?.paralelo || x.romance?.secreto) && x.romance.estagio !== 'ex') mudarEstagio(c.v, x, 'ex');
      lembrarCom(c.v, c.p.id, 'Voltaram a ser só os dois.', 'romance', 1);
      return { resultado: `Vocês voltaram a ser só os dois. ${c.p.nome} pareceu aliviad${o(c.p)}.`, titulo: c.p.nome };
    }
  }
];
export const GRUPOS_DE_AFETO = { flertar_comprometido: 'romance', propor_acordo_aberto: 'decisoes', propor_poliamor: 'decisoes', voltar_exclusivo: 'decisoes' } as const;

/** O poliamor pede mais da parceria do que abrir a relação: a chance é menor (maior se já vivem um acordo aberto). */
function chancePoliamor(c: CtxI): number {
  return clamp(chanceDoAcordo(c) * 0.7 + (c.vin.romance?.acordo === 'aberto' ? 0.1 : 0), 0.02, 0.5);
}

function chanceDoAcordo(c: CtxI): number {
  const t = c.p.temperamento;
  const rom = c.vin.romance;
  return clamp(0.12 + t.abertura * 0.22 + t.extroversao * 0.05 - t.responsabilidade * 0.05 + ((rom?.envolvimento ?? 60) - 60) / 250 - (c.vin.tensao / 300), 0.03, 0.6);
}

/* ============================================================ A parceria fora do combinado (o ano) */

/**
 * Uma vez por ano: a parceria pode ter alguém fora do combinado (mais quando a relação vai mal, a distância é grande e o
 * jeito dela é mais solto) — e você pode descobrir. Num acordo aberto, não é traição: é a notícia de que ela está
 * saindo com alguém. E as dimensões esfriam sem contato. Sorteio próprio (`rngDe`): a sequência do ano não muda.
 */
export function processarAfetos(v: Vida): void {
  const r = rngDe(v.id, 'afetos', v.t);
  for (const vin of Object.values(v.vinculos)) {
    if (vin.intimidade !== undefined && v.t - vin.tUltimoContato >= 12) vin.intimidade = clamp(Math.round(vin.intimidade * 0.9));
  }
  const par = parceiro(v);
  if (!par || par.p.especie || !par.vin.romance) return;
  const { p, vin } = par;
  const rom = vin.romance!;
  if (rom.infiel?.respondido !== undefined && v.t - rom.infiel.respondido >= 36) delete rom.infiel;
  if (rom.infiel && !rom.infiel.descoberto) {
    const mesmaCasa = vin.convivio.includes('casa');
    if (r.chance(mesmaCasa ? 0.4 : 0.25)) { rom.infiel.descoberto = v.t; v.fatos[`infiel_descoberto:${p.id}`] = v.t; descobrirInfidelidade(v, p, vin); }
    else if (v.t - rom.infiel.t >= 36 && r.chance(0.3)) delete rom.infiel;
    return;
  }
  if (rom.infiel || idadePessoa(v, p) < 18 || v.t - (rom.tInicio ?? vin.tInicio) < 12) return;
  const t = p.temperamento;
  const longe = p.municipioId !== v.moradia.municipioId;
  const chance = clamp(0.008 + (rom.envolvimento < 45 ? 0.03 : 0) + (vin.tensao >= 45 ? 0.02 : 0) + (longe ? 0.02 : 0) - t.responsabilidade * 0.01 + Math.max(0, t.extroversao) * 0.005, 0.002, 0.08);
  if (!r.chance(chance)) return;
  if (acordoConsentido(rom)) {
    const poli = rom.acordo === 'poliamor';
    escrever(v, { texto: `${p.nome} começou a ${poli ? 'namorar' : 'sair com'} alguém${longe ? ` em ${municipio(p.municipioId).nome}` : ''}, como vocês combinaram. Você soube por ${flex(p.genero, 'ele', 'ela', 'elu')} mesm${o(p)}${poli ? ' — e conheceu a pessoa' : ''}.`, relevancia: 'cotidiano', tema: 'amor', pessoas: [p.id] });
    return;
  }
  rom.infiel = { t: v.t };
}

/** A traição da parceria, quando você descobre: o que isso faz na relação (antes da sua resposta). */
export function descobrirInfidelidade(v: Vida, p: Pessoa, vin: Vinculo): void {
  vin.tensao = clamp(vin.tensao + 40);
  vin.confianca = clamp(vin.confianca - 35);
  vin.conflito = { t: v.t, assunto: 'a traição', gravidade: 3, quem: 'outro' };
  lembrarCom(v, p.id, `Você descobriu que ${p.nome} tinha outra pessoa.`, 'traicao', 3);
}
