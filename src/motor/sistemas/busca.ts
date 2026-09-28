/**
 * "Quero conhecer alguém": a busca ativa, sem virar aplicativo de encontros.
 *
 *   INTENÇÃO     o jogador escolhe procurar (uma vez por ano)
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
import type { Vida } from '../tipos';
import { escrever, idade, lembrarCom, parceiro, vinculosVivos } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { criarPessoa, vincular } from '../pessoas';
import { interesseInicial, podeTerRomance } from './romance';
import { compatibilidade, ROTINAS_SOCIAIS } from './social';
import { nivelDeOferta } from '../dados/lugares';
import { vereditoDePagar } from './dinheiro';
import { flex } from '../texto';

export type ContextoBusca = 'amigos' | 'atividade' | 'estudo_trabalho' | 'noite' | 'app';

export const ROTULO_BUSCA: Record<ContextoBusca, string> = {
  amigos: 'Pedir aos amigos que apresentem alguém',
  atividade: 'Prestar atenção em quem aparece na sua atividade',
  estudo_trabalho: 'Se abrir para alguém do dia a dia',
  noite: 'Sair para conhecer gente',
  app: 'Tentar um aplicativo de encontros'
};

const CUSTO_NOITE = 150;
const feitaNoAno = (v: Vida) => v.anoAtual.acoes.some(a => a.startsWith('buscar:'));

function amigosNaCidade(v: Vida) {
  return vinculosVivos(v).filter(x => !x.p.especie && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && x.p.municipioId === v.moradia.municipioId);
}
function atividadeSocial(v: Vida) {
  return v.rotinas.find(r => ROTINAS_SOCIAIS[r.id]);
}
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
  if (par) return bloqueio('incompativel', `Você está com ${par.p.nome}.`);
  if (vinculosVivos(v).some(x => x.vin.romance && !x.vin.romance.secreto && (x.vin.romance.estagio === 'saindo' || x.vin.romance.pediuTempo !== undefined))) return bloqueio('incompativel', 'Você já está saindo com alguém (ou esperando uma resposta).');
  if (!v.eu.atracao) return bloqueio('requisito', 'Diga antes por quem você se interessa (logo abaixo).');
  if (feitaNoAno(v)) return bloqueio('incompativel', 'Você já procurou este ano. A vida também precisa de tempo.');
  switch (ctx) {
    case 'amigos': return amigosNaCidade(v).length ? PERMITIDO : bloqueio('requisito', 'Precisa de amigos por perto para apresentarem alguém.');
    case 'atividade': return atividadeSocial(v) ? PERMITIDO : bloqueio('requisito', 'Nenhuma atividade da semana põe você no meio de gente.');
    case 'estudo_trabalho': return diaADia(v) ? PERMITIDO : bloqueio('requisito', 'Sem escola, faculdade ou trabalho com gente em volta.');
    case 'noite': return i < 18 ? bloqueio('impossivel', 'A partir dos 18.') : vereditoDePagar(v, CUSTO_NOITE, 'Uma noite fora custa uns');
    case 'app': return i < 18 ? bloqueio('impossivel', 'A partir dos 18.') : PERMITIDO;
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
  app: { acha: 0.68, interesse: -4 }
};

export function buscarAlguem(v: Vida, r: Rng, ctx: ContextoBusca): SaidaBusca {
  v.anoAtual.acoes.push(`buscar:${ctx}`);
  const i = idade(v);
  v.fatos['buscas_romance'] = (v.fatos['buscas_romance'] ?? 0) + 1;
  if (ctx === 'noite') v.financas.conta -= CUSTO_NOITE;
  const cidade = nivelDeOferta(v.moradia.municipioId);
  const soc = v.personalidade.tracos.sociabilidade;
  let acha = MOD[ctx].acha + soc / 250 + (v.mente.felicidade - 50) / 300 - (i >= 45 ? 0.1 : 0);
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
  const comp = compatibilidade(v, p);
  const interesse = clamp(Math.round(interesseInicial(v, p) + MOD[ctx].interesse + comp * 12 + r.normal() * 8));
  const onde = ctx === 'app' ? `Pelo aplicativo, você conheceu ${p.nome}`
    : ctx === 'amigos' ? `${amigo?.p.nome ?? 'Uma amiga'} apresentou ${p.nome} num aniversário`
      : ctx === 'atividade' ? `${cap(ROTINAS_SOCIAIS[rot!.id].onde)}, você e ${p.nome} começaram a conversar`
        : ctx === 'noite' ? `Numa noite fora, você conheceu ${p.nome}`
          : `${diaADia(v) === 'trabalho' ? 'No trabalho' : diaADia(v) === 'faculdade' ? 'Na faculdade' : 'Na escola'}, você e ${p.nome} começaram a conversar de verdade`;
  if (amigo) lembrarCom(v, amigo.p.id, `Apresentou ${p.nome} a você.`, 'amizade', 1);
  const pode = podeTerRomance(v, p, vin);
  if (!pode || interesse < 45) {
    const texto = `${onde}. A conversa foi educada — e só. ${flex(p.genero, 'Ele', 'Ela', 'Elu')} não pareceu ${ctx === 'app' ? 'querer marcar nada' : 'interessad' + flex(p.genero, 'o', 'a', 'e')}.`;
    return { resultado: texto, titulo: p.nome, pessoaId: p.id };
  }
  vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: interesse };
  vin.proximidade = clamp(vin.proximidade + 8);
  lembrarCom(v, p.id, ctx === 'app' ? 'Se conheceram por um aplicativo.' : ctx === 'amigos' ? `Foram apresentados por ${amigo?.p.nome ?? 'amigos'}.` : 'A primeira conversa de verdade.', 'inicio', 1);
  const faisca = interesse >= 62 ? 'Houve faísca dos dois lados: a conversa foi longe.' : 'Pareceu haver interesse — dá para chamar para sair e ver.';
  escrever(v, { texto: `${onde}.`, relevancia: 'cotidiano', tema: 'amor', escolha: true, pessoas: [p.id] });
  return { resultado: `${onde}. ${faisca}`, titulo: p.nome, pessoaId: p.id };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
