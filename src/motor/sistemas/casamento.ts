/**
 * REWORK 11 · REL-16 — O CASAMENTO EM ETAPAS.
 *
 *   PEDIDO → ACEITAÇÃO, RECUSA OU "PRECISO PENSAR" → NOIVADO (estado do romance) → PLANEJAMENTO → CERIMÔNIA → LUA DE MEL
 *
 * O planejamento é uma escolha de verdade: o lugar, o tipo de cerimônia, quantos convidados, o estilo — e o preço sai
 * dos preços do lugar onde se mora (`economiaLocal`). A outra pessoa tem a sua preferência (o tamanho da festa, o
 * dinheiro) e pode discordar: casa assim mesmo, mas fica dito. A família e a parceria pagam uma parte; o que faltar do
 * seu lado, se couber na renda do casal, vira parcelamento de 24 meses — e só então se fala em parcela (o rico não é
 * chamado a parcelar). A lua de mel reutiliza a viagem de sempre (`experiencias`): um sinal deixa a primeira viagem
 * depois do casamento ignorar o intervalo entre viagens, uma vez.
 */

import type { Pessoa, PlanoDeCasamento, Vida, Vinculo } from '../tipos';
import { clamp, rngDe } from '../rng';
import { escrever, idade, idadePessoa, lembrarCom, parceiro, vinculosVivos } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { registroCivilDe } from '../mundo/locais';
import { disponivel as guardado, pagar, parcelaPrice, rendaPropriaMensal } from './dinheiro';
import { desfazerNoivado, estaNoivo, mudarEstagio } from './romance';
import { morarJuntos } from './moradia';
import { marcoAfetivo } from './convivio';
import { dinheiro as moeda, flex } from '../texto';

/* ------------------------------------------------------------------ O catálogo do planejamento */

export const LOCAIS: Record<PlanoDeCasamento['local'], { rotulo: string; base: number; max?: number }> = {
  cartorio: { rotulo: 'Só o registro civil, com um almoço', base: 0, max: 40 },
  casa: { rotulo: 'Na casa da família', base: 1500, max: 80 },
  salao: { rotulo: 'Num salão de festas', base: 9000 },
  religioso: { rotulo: 'Num templo, com recepção depois', base: 12000 },
  ar_livre: { rotulo: 'Ao ar livre (um sítio, um jardim, a praia)', base: 11000 },
  destino: { rotulo: 'Num destino longe de casa, para poucos', base: 25000, max: 60 }
};
export const CERIMONIAS: Record<PlanoDeCasamento['cerimonia'], { rotulo: string; custo: number }> = {
  civil: { rotulo: 'Só a cerimônia civil', custo: 0 },
  religiosa: { rotulo: 'Cerimônia religiosa', custo: 2000 },
  simbolica: { rotulo: 'Cerimônia simbólica, com celebrante', custo: 1200 }
};
export const ESTILOS: Record<PlanoDeCasamento['estilo'], { rotulo: string; porConvidado: number; fator: number }> = {
  simples: { rotulo: 'Simples', porConvidado: 70, fator: 0.7 },
  classico: { rotulo: 'Clássico', porConvidado: 200, fator: 1 },
  luxo: { rotulo: 'De luxo', porConvidado: 650, fator: 2.5 }
};
export const CONVIDADOS = [10, 30, 60, 120, 250, 400] as const;

/** O tamanho da festa em três faixas (o que a outra pessoa sonha também se diz assim). */
const tamanho = (n: number) => (n <= 30 ? 0 : n <= 120 ? 1 : 2);
const TAMANHO = ['algo pequeno, só os mais próximos', 'uma festa média, com a família e os amigos', 'uma festa grande, com todo mundo'];

/** O custo do casamento planejado, nos preços de onde se mora (arredondado). */
export function custoDoCasamento(v: Vida, plano: Pick<PlanoDeCasamento, 'local' | 'cerimonia' | 'convidados' | 'estilo'>): number {
  const l = LOCAIS[plano.local], e = ESTILOS[plano.estilo];
  const bruto = l.base * e.fator + plano.convidados * e.porConvidado + CERIMONIAS[plano.cerimonia].custo + 400;
  return Math.round(bruto * economiaLocal(v.moradia.municipioId).custo / 100) * 100;
}

/** O que a outra pessoa prefere (estável para ela): o tamanho e se aceita dívida por festa. */
export function preferenciaDoPar(v: Vida, p: Pessoa): { tamanho: 0 | 1 | 2; semDivida: boolean; texto: string } {
  const t = p.temperamento;
  // Quem tem de sobra sonha um pouco maior (o que o casal tem guardado pesa no sonho, não só no bolso).
  const x = rngDe(p.id, 'casamento_pref').next() + t.extroversao * 0.35 - t.responsabilidade * 0.1 + (guardado(v) >= 200000 ? 0.15 : 0);
  const tam = (x < 0.38 ? 0 : x < 0.8 ? 1 : 2) as 0 | 1 | 2;
  const semDivida = t.responsabilidade >= 0.3;
  return { tamanho: tam, semDivida, texto: `${p.nome} sonha com ${TAMANHO[tam]}${semDivida ? ', e não quer começar a vida a dois com dívida de festa' : ''}.` };
}

/** Quem paga o quê: a parceria e a família ajudam; o que faltar do seu lado vira parcela (24 meses) se couber na renda. */
export function pagamentoDoCasamento(v: Vida, p: Pessoa, custo: number): { parte: number; tem: number; falta: number; parcela: number; cabe: boolean } {
  const parte = Math.round(custo * (p.renda > 0 ? 0.55 : 0.8));
  const tem = guardado(v);
  const falta = Math.max(0, parte - tem);
  const parcela = falta > 0 ? Math.round(parcelaPrice(falta, 0.025, PRAZO_DA_FESTA)) : 0;
  const renda = rendaPropriaMensal(v) + p.renda;
  return { parte, tem, falta, parcela, cabe: falta === 0 || parcela <= renda * 0.25 };
}
export const PRAZO_DA_FESTA = 24;

/** A outra pessoa discorda do plano? (Duas faixas de diferença no tamanho, o luxo para quem quer pouco, dívida para quem não quer.) */
export function discordaDoPlano(v: Vida, p: Pessoa, plano: Pick<PlanoDeCasamento, 'local' | 'cerimonia' | 'convidados' | 'estilo'>): string | undefined {
  const pref = preferenciaDoPar(v, p);
  const tam = tamanho(plano.convidados);
  if (Math.abs(tam - pref.tamanho) >= 2) return `${p.nome} preferia ${TAMANHO[pref.tamanho]}.`;
  if (plano.estilo === 'luxo' && pref.tamanho === 0) return `${p.nome} acha o luxo um exagero.`;
  if (pref.semDivida && pagamentoDoCasamento(v, p, custoDoCasamento(v, plano)).falta > 0) return `${p.nome} não queria parcelar a festa.`;
  return undefined;
}

/* ------------------------------------------------------------------ As ações */

export type OpCasamento =
  | { op: 'planejar'; plano: Omit<PlanoDeCasamento, 't' | 'discorda'> }
  | { op: 'celebrar' };

const MESES_DE_NOIVADO = 4;

export function disponibilidadeCasamento(v: Vida, pessoaId: string, o: OpCasamento): Veredito {
  const p = v.pessoas[pessoaId], vin = v.vinculos[pessoaId];
  const par = parceiro(v);
  if (!p?.vivo || !vin || !par || par.p.id !== pessoaId) return bloqueio('impossivel', 'Casar, só com a sua parceria.');
  if (!estaNoivo(v, vin)) return bloqueio('requisito', 'Antes do casamento, o pedido (e o sim).');
  if (idade(v) < 18 || idadePessoa(v, p) < 18) return bloqueio('ilegal', 'Casamento exige maioridade.');
  if (o.op === 'planejar') {
    const l = LOCAIS[o.plano.local];
    if (!l || !CERIMONIAS[o.plano.cerimonia] || !ESTILOS[o.plano.estilo] || !CONVIDADOS.includes(o.plano.convidados as typeof CONVIDADOS[number])) return bloqueio('impossivel', 'Essa opção não existe.');
    if (l.max !== undefined && o.plano.convidados > l.max) return bloqueio('incompativel', `${l.rotulo} não comporta ${o.plano.convidados} convidados (até ${l.max}).`);
    return PERMITIDO;
  }
  const plano = vin.romance?.noivado?.plano;
  if (!plano) return bloqueio('requisito', 'Falta planejar o casamento.');
  const desde = vin.romance?.noivado?.t ?? v.fatos[`noivado_${pessoaId}`] ?? v.t;
  if (v.t - desde < MESES_DE_NOIVADO) return bloqueio('requisito', 'Ficaram noivos agora: casamento leva uns meses para organizar.');
  const pg = pagamentoDoCasamento(v, p, custoDoCasamento(v, plano));
  if (!pg.cabe) return { ...bloqueio('incompativel', 'Não cabe: nem juntando o que têm, a parcela da festa caberia na renda de vocês. Um plano menor cabe.'), dinheiro: true };
  return pg.falta > 0 ? { grau: 'permitido', motivo: `Falta ${moeda(pg.falta)} da sua parte: vira ${PRAZO_DA_FESTA} parcelas de ${moeda(pg.parcela)}.` } : PERMITIDO;
}

export function executarCasamento(v: Vida, pessoaId: string, o: OpCasamento): string {
  const p = v.pessoas[pessoaId], vin = v.vinculos[pessoaId];
  if (o.op === 'planejar') {
    const discorda = discordaDoPlano(v, p, o.plano);
    vin.romance!.noivado = { t: vin.romance!.noivado?.t ?? v.fatos[`noivado_${pessoaId}`] ?? v.t, plano: { ...o.plano, t: v.t, ...(discorda ? { discorda: true } : {}) } };
    const custo = custoDoCasamento(v, o.plano);
    return `Planejado: ${LOCAIS[o.plano.local].rotulo.toLowerCase()}, ${CERIMONIAS[o.plano.cerimonia].rotulo.toLowerCase()}, ${o.plano.convidados} convidados, estilo ${ESTILOS[o.plano.estilo].rotulo.toLowerCase()} — uns ${moeda(custo)} ao todo.${discorda ? ` ${discorda} Topou, mas disse.` : ` ${p.nome} gostou do plano.`}`;
  }
  const plano = vin.romance!.noivado!.plano!;
  const custo = custoDoCasamento(v, plano);
  const { parcelou, parcela } = casar(v, p, custo, `${LOCAIS[plano.local].rotulo.toLowerCase()}, com ${plano.convidados} convidados`);
  // Sem lua de mel no plano, o sinal não fica (a viagem do ano segue a regra de sempre).
  if (!plano.luaDeMel) delete v.fatos[`lua_de_mel_pendente_${p.id}`];
  if (plano.discorda) {
    vin.tensao = clamp(vin.tensao + 10);
    lembrarCom(v, p.id, `Casaram do seu jeito — não do jeito que ${flex(p.genero, 'ele', 'ela', 'elu')} queria.`, 'conflito', 1);
  }
  const onde = plano.local === 'cartorio' ? `n${registroCivilDe(v).slice(1)}` : LOCAIS[plano.local].rotulo.charAt(0).toLowerCase() + LOCAIS[plano.local].rotulo.slice(1);
  return `Casaram-se ${onde}, com ${plano.convidados} convidados.${parcelou ? ` A sua parte que faltou virou ${PRAZO_DA_FESTA} parcelas de ${moeda(parcela)}.` : ''}${plano.discorda ? ` ${p.nome} sorriu nas fotos; a conversa sobre como foi fica para depois.` : ''}${plano.luaDeMel ? ` A lua de mel espera na ficha de ${p.nome}, em Pessoas (uma viagem a dois, dentro de um ano).` : ''}`;
}

/* ------------------------------------------------------------------ A cerimônia (também a do conteúdo `rom_casamento`) */

/**
 * O casamento: o estágio, a casa em comum, quem paga o quê (o que falta do seu lado vira parcelamento de 24 meses, só se
 * faltar), a memória e a família. Devolve se parcelou (e a parcela) — o texto do resultado diz o que aconteceu.
 */
export function casar(v: Vida, p: Pessoa, custo: number, descricao?: string): { parcelou: boolean; parcela: number } {
  const vin = v.vinculos[p.id];
  mudarEstagio(v, vin, 'casamento');
  desfazerNoivado(v, vin);
  if (!vin.convivio.includes('casa')) morarJuntos(v, p);
  const pg = pagamentoDoCasamento(v, p, custo);
  pagar(v, Math.min(pg.parte, pg.tem));
  if (pg.falta > 0) {
    v.financas.dividas.push({ id: `festa${v.seq++}`, tipo: 'emprestimo', saldo: pg.falta, jurosMes: 0.025, parcela: pg.parcela, descricao: 'Parcelas da festa de casamento', tInicio: v.t, prazo: PRAZO_DA_FESTA });
  }
  v.mente.felicidade = clamp(v.mente.felicidade + 12);
  lembrarCom(v, p.id, 'Casaram-se.', 'casamento', 3);
  marcoAfetivo(v, p, vin, 'casamento');
  for (const x of vinculosVivos(v)) if (['mae', 'pai', 'irmao', 'meio_irmao'].includes(x.vin.parentesco ?? '') && x.vin.proximidade >= 40) lembrarCom(v, x.p.id, `Esteve no seu casamento com ${p.nome}.`, 'casamento', 1);
  // A lua de mel fica possível (uma vez, no primeiro ano): o sinal que a viagem lê.
  v.fatos[`lua_de_mel_pendente_${p.id}`] = v.t;
  if (descricao) escrever(v, { texto: `Casou-se com ${p.nome}: ${descricao}.`, relevancia: 'marco', tema: 'amor', tom: 'bom', escolha: true, pessoas: [p.id], evento: { tipo: 'casamento', pessoaId: p.id, peso: 70 } });
  return { parcelou: pg.falta > 0, parcela: pg.parcela };
}

/** O cônjuge com a lua de mel por fazer (casou há no máximo 12 meses e a viagem ainda não aconteceu). */
export function luaDeMelPendente(v: Vida): Pessoa | undefined {
  const par = parceiro(v);
  if (!par || par.vin.romance?.estagio !== 'casamento') return undefined;
  const t = v.fatos[`lua_de_mel_pendente_${par.p.id}`];
  return t !== undefined && v.t - t <= 12 ? par.p : undefined;
}

/** A viagem foi a lua de mel: o sinal se consome (uma vez só) e fica a memória do casal. */
export function viverLuaDeMel(v: Vida, p: Pessoa, destino: string): void {
  delete v.fatos[`lua_de_mel_pendente_${p.id}`];
  v.fatos[`lua_de_mel_${p.id}`] = v.t;
  const vin: Vinculo | undefined = v.vinculos[p.id];
  if (vin?.romance) vin.romance.envolvimento = clamp(vin.romance.envolvimento + 5);
  lembrarCom(v, p.id, `A lua de mel em ${destino}.`, 'casamento', 3);
}

/* ------------------------------------------------------------------ O conteúdo `rom_casamento` (a decisão rápida) */

/** O que falta da sua parte para uma festa de referência (`base`, antes do custo local). */
export function faltaDaFesta(v: Vida, p: Pessoa, base: number): number {
  return pagamentoDoCasamento(v, p, Math.round(base * economiaLocal(v.moradia.municipioId).custo)).falta;
}
/** A festa cabe? O que faltar vira parcela, e a parcela precisa caber na renda do casal. */
export function cabeFesta(v: Vida, p: Pessoa, base: number): true | string {
  return pagamentoDoCasamento(v, p, Math.round(base * economiaLocal(v.moradia.municipioId).custo)).cabe ? true : 'Não cabe: nem juntando o que têm, a parcela da festa caberia na renda de vocês.';
}
/** A festa de luxo é para quem tem com folga (três vezes o que lhe cabe pagar): nunca parcelada. */
export function cabeLuxo(v: Vida, p: Pessoa, base: number): true | string {
  const pg = pagamentoDoCasamento(v, p, Math.round(base * economiaLocal(v.moradia.municipioId).custo));
  return pg.tem >= pg.parte * 3 ? true : 'Uma festa assim é para quem tem de sobra.';
}
