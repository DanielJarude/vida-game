/**
 * REWORK 12.3 · PILAR D — O RELATO DO QUE ACONTECEU NO SUBMUNDO. Antes, todo trabalho que dava certo dizia "Deu certo. X
 * rendeu Y depois das partes — e um pouco mais de nome no meio", viesse de quem viesse, fosse o primeiro ou o vigésimo, para
 * um novato ou para quem comanda. Agora o texto é montado do ESTADO da simulação — nunca inventa o que o motor não registrou:
 *
 *   CONTEXTO      quem propôs e o que já houve entre vocês (o primeiro trabalho juntos, o quinto, a traição de anos atrás,
 *                 o favor devido); da organização, quem passou o pedido (um nome do quadro acima de você) e quem manda;
 *                 o seu lugar (o mais novo que vai junto, quem coordena, quem só manda os seus)
 *   RESULTADO     o que aconteceu, por desfecho (completo, parcial, inesperado, fracasso de cada tipo)
 *   REAÇÃO        a de quem estava junto, pelo temperamento dele e pela confiança entre vocês (o leal, o desconfiado, o
 *                 pragmático, o esquentado) — e a da organização, pelo estilo dela
 *   CONSEQUÊNCIAS as linhas objetivas do que mudou (o dinheiro, a confiança, a exposição, a lealdade), medidas antes e
 *                 depois da ação: o texto e os números não se contradizem
 *
 * Contra a repetição: cada frase tem variantes, e a escolha evita a que apareceu nos últimos três anos (a memória fica no
 * envolvimento). A variedade mecânica vem dos desfechos e do estado; a variante só cuida para a mesma frase não voltar.
 */
import { rngDe } from '../rng';
import type { EncomendaCriminal, OrgViva, Pessoa, Vida } from '../tipos';
import { dinheiroCurto, flex } from '../texto';
import { lider, nivelDe, nomeDoNivel, orgViva } from './faccoes';
import { orgPorId } from './submundo';
import { patamarAtual } from './carreiraCriminal';
import { anoDe } from '../tempo';
import { totalAplicado } from './investimentos';
import { tipoDeEncomenda } from './encomendas';

const env = (v: Vida) => v.caminhos.envolvimento;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* ================================================================ variantes sem repetição */

/**
 * Uma das variantes, evitando as usadas nos últimos 36 meses com a mesma chave. A escolha é derivada (a vida, a chave, o
 * instante): o mesmo estado dá o mesmo texto, e a sequência do ano não muda.
 */
export function variante(v: Vida, chave: string, opcoes: string[], semente: string | number = ''): string {
  const e = env(v);
  if (!opcoes.length) return '';
  const mem = e ? (e.relatos ??= []) : [];
  const recentes = new Set(mem.filter(m => m.k.startsWith(`${chave}#`) && v.t - m.t < 36).map(m => m.k));
  const livres = opcoes.map((x, i) => ({ x, i })).filter(o => !recentes.has(`${chave}#${o.i}`));
  const lista = livres.length ? livres : opcoes.map((x, i) => ({ x, i }));
  const o = rngDe(v.id, 'relato', chave, v.t, semente, mem.length).pick(lista);
  if (e) { mem.push({ k: `${chave}#${o.i}`, t: v.t }); if (mem.length > 60) mem.splice(0, mem.length - 60); }
  return o.x;
}

/* ================================================================ quem é quem */

export type Voz = 'leal' | 'desconfiado' | 'pragmatico' | 'esquentado' | 'caloroso';

/** O jeito de reagir de um contato: o temperamento dele e a confiança entre vocês (estado real, não sorteio). */
export function vozDe(v: Vida, pessoaId: string): Voz {
  const p = v.pessoas[pessoaId];
  const f = env(v)?.fichas?.[pessoaId];
  if (!p) return 'pragmatico';
  const t = p.temperamento;
  if (f && (f.confianca < 30 || (f.quebradas ?? 0) > (f.cumpridas ?? 0))) return 'desconfiado';
  if (t.estabilidade < -0.3) return 'esquentado';
  if (f && (f.amizade ?? 0) >= 50) return 'caloroso';
  if (t.responsabilidade > 0.25 || (f && f.confianca >= 65)) return 'leal';
  return 'pragmatico';
}

/** O que já houve entre você e um contato, numa oração (ou nada, quando é a primeira vez e não há o que lembrar). */
export function historicoCom(v: Vida, pessoaId: string): string | undefined {
  const e = env(v);
  const f = e?.fichas?.[pessoaId];
  const p = v.pessoas[pessoaId];
  if (!f || !p) return undefined;
  const juntos = (e!.encomendas ?? []).filter(x => x.pessoaId === pessoaId && (x.estado === 'concluida' || x.estado === 'falhou' || x.estado === 'traida')).length;
  if (f.traiu !== undefined) return `${p.nome}, que falou o seu nome em ${anoDe(f.traiu)}`;
  if ((f.favores ?? 0) < 0) return `${p.nome}, a quem você ainda deve ${-(f.favores ?? 0) === 1 ? 'um favor' : `${-(f.favores ?? 0)} favores`}`;
  if ((f.favores ?? 0) > 0) return `${p.nome}, que ainda lhe deve ${(f.favores ?? 0) === 1 ? 'um favor' : `${f.favores} favores`}`;
  if (f.reconciliado !== undefined && v.t - f.reconciliado < 48) return `${p.nome}, com quem você fez as pazes em ${anoDe(f.reconciliado)}`;
  if (juntos >= 4) return `${p.nome}, com quem você já fez ${juntos} trabalhos`;
  if (juntos >= 1) return `${p.nome}, que já tinha trabalhado com você`;
  return undefined;
}

/** Quem passou o pedido de uma organização: um nome do quadro acima de você (ou quem manda, se você está perto do topo). */
export function quemPassou(v: Vida, o: OrgViva): string | undefined {
  const rel = env(v)?.organizacoes?.find(x => x.id === o.id);
  const meu = rel ? nivelDe(v, rel) : -1;
  const acima = o.quadro.filter(m => m.estado === 'ativo' && m.nivel > Math.max(meu, 0) && m.nivel < 6).sort((a, b) => a.nivel - b.nivel);
  const m = acima[0] ?? lider(o);
  return m ? `${m.nome} (${nomeDoNivel(o, m.nivel)})` : undefined;
}

/** O seu lugar no trabalho, pelo patamar e pelo posto: o mais novo, quem já conhece o caminho, quem coordena, quem manda. */
export function seuLugar(v: Vida, g: 1 | 2 | 3, semente: string): string {
  const p = patamarAtual(v);
  if (p >= 3) return variante(v, `lugar_lider_${g}`, ['Você não foi: mandou dois dos seus e acompanhou de longe', 'Você só deu a palavra final; quem fez foram os seus', 'Coube a você decidir quem ia — e responder pelo resultado'], semente);
  if (p === 2) return variante(v, `lugar_influente_${g}`, ['Você coordenou', 'Você organizou quem fazia o quê', 'Você ficou à frente, com gente sua do lado'], semente);
  if (p === 1) return variante(v, `lugar_experiente_${g}`, ['Você já conhecia o caminho', 'Você fez a sua parte sem precisar de ninguém explicando', 'Você foi com a calma de quem já fez isso antes'], semente);
  return variante(v, `lugar_novato_${g}`, ['Você foi junto, como o mais novo', 'Era a primeira vez com algo assim, e você foi mais olhando que fazendo', 'Você fez o que mandaram, sem perguntar muito'], semente);
}

/* ================================================================ contexto de uma encomenda */

export interface ContextoDaEncomenda { de: string; frase: string; pessoa?: Pessoa; org?: OrgViva }

/** A frase de abertura: quem propôs, com o que há entre vocês. Só o que o estado sabe. */
export function contextoDaEncomenda(v: Vida, x: EncomendaCriminal, nome: string): ContextoDaEncomenda {
  const p = x.pessoaId ? v.pessoas[x.pessoaId] : undefined;
  if (p) {
    const hist = historicoCom(v, p.id);
    // A oração do histórico ("Felipe, que já tinha trabalhado com você,") fecha com vírgula antes do verbo.
    const ja = hist ? `${cap(hist)},` : p.nome;
    return { de: p.nome, pessoa: p, frase: variante(v, 'ctx_contato', [`${ja} chamou você para ${nome}.`, `${ja} trouxe a proposta: ${nome}.`, `${ja} veio com um pedido: ${nome}.`], x.id) };
  }
  const o = x.orgId ? orgViva(v, x.orgId) : undefined;
  if (o) {
    const passou = quemPassou(v, o);
    return { de: o.nome, org: o, frase: passou ? variante(v, 'ctx_org', [`${cap(o.nome)} tinha um pedido — ${nome} —, e ${passou} o passou a você.`, `O pedido veio de ${o.nome}, pela boca de ${passou}: ${nome}.`], x.id) : `${cap(o.nome)} tinha um pedido: ${nome}.` };
  }
  const rel = x.orgId ? orgPorId(v, x.orgId) : undefined;
  return { de: rel?.nome ?? 'alguém do meio', frase: `${cap(rel?.nome ?? 'Alguém do meio')} tinha um pedido: ${nome}.` };
}

/* ================================================================ reações */

/** A reação de quem estava junto ao sucesso — pela voz dele (e o que muda: a confiança já foi mexida pelo motor). */
export function reacaoAoSucesso(v: Vida, pessoaId: string, valor: number): string {
  const p = v.pessoas[pessoaId];
  if (!p) return '';
  const k = vozDe(v, pessoaId);
  const n = p.nome;
  const T: Record<Voz, string[]> = {
    leal: [`${n} pagou a sua parte no mesmo dia e disse que da próxima vez chama você primeiro.`, `${n} não falou muito; apertou a sua mão e contou o dinheiro na sua frente.`],
    desconfiado: [`${n} contou o dinheiro duas vezes antes de passar a sua parte. Ainda não confia — mas pagou.`, `${n} pagou certinho, sem olhar nos seus olhos. A confiança vem devagar.`],
    pragmatico: [`${n} pagou e já falou do próximo: "${dinheiroCurto(valor)} assim, eu repito."`, `${n} acertou as partes sem conversa. Negócio é negócio.`],
    esquentado: [`${n} comemorou alto demais, num lugar onde não devia. Deu certo, mas o barulho ficou.`, `${n} estava eufórico. Você teve de lembrar que ninguém precisava saber.`],
    caloroso: [`${n} fez questão de pagar um jantar depois. "Com você é diferente", disse.`, `${n} riu do nervoso que vocês passaram e pagou a sua parte inteira, sem desconto.`]
  };
  return variante(v, `reacao_ok_${k}`, T[k], pessoaId);
}

export function reacaoAoFracasso(v: Vida, pessoaId: string): string {
  const p = v.pessoas[pessoaId];
  if (!p) return '';
  const k = vozDe(v, pessoaId);
  const n = p.nome;
  const T: Record<Voz, string[]> = {
    leal: [`${n} assumiu a parte ${flex(p.genero, 'dele', 'dela', 'delu')} no erro. "Acontece."`, `${n} não pôs a culpa em ninguém.`],
    desconfiado: [`${n} saiu dizendo que foi você quem errou.`, `${n} não disse nada — e isso disse muito.`],
    pragmatico: [`${n} fez as contas do prejuízo e foi embora sem drama.`, `${n} só quis saber quanto se perdeu.`],
    esquentado: [`${n} perdeu a cabeça e gritou com todo mundo.`, `${n} bateu a porta do carro e sumiu por uma semana.`],
    caloroso: [`${n} ligou no dia seguinte só para saber se você estava bem.`, `${n} disse que da próxima vai dar certo, e pareceu acreditar.`]
  };
  return variante(v, `reacao_erro_${k}`, T[k], pessoaId);
}

/** A organização reage pelo estilo dela (a família lembra; a facção cobra; a rede só olha a conta). */
export function reacaoDaOrg(v: Vida, o: OrgViva, deu: boolean): string {
  const l = lider(o);
  const quem = l ? `${l.nome}, que manda ${o.estilo === 'familia' ? 'na família' : 'ali'},` : 'Quem manda';
  if (deu) {
    const T: Record<OrgViva['estilo'], string[]> = {
      faccao: [`${quem} mandou dizer que viu.`, `O recado de ${l?.nome ?? 'cima'} chegou: "fez direito".`],
      familia: [`${quem} quis saber o seu nome inteiro. A família lembra de quem cumpre.`, `Na família, quem cumpre é chamado para o almoço de domingo. Você foi chamado.`],
      rede: [`Na rede, ninguém elogia: o próximo lote já veio com o seu nome.`, `A rede pagou na data. Só isso — e é muito.`],
      circulo: [`No círculo, o seu nome passou a ser dito em reuniões a que você não vai.`, `Um telefonema curto de ${l?.nome ?? 'quem manda'}: "continue assim".`],
      coletivo: [`No coletivo, deram o crédito em público — entre os poucos que sabem.`, `O coletivo passou a mandar trabalho mais fino para você.`],
      turma: [`A turma pagou uma rodada. Você virou assunto.`, `Na turma, o seu nome subiu.`],
      sindicato: [`${quem} anotou o seu nome. Ali, isso vale mais que dinheiro.`, `O sindicato lembra de quem entrega.`]
    };
    return variante(v, `org_ok_${o.estilo}`, T[o.estilo], o.id);
  }
  const T: Record<OrgViva['estilo'], string[]> = {
    faccao: [`${quem} quer ouvir de você o que houve.`, `O erro chegou lá em cima antes de você voltar.`],
    familia: [`Na família, ninguém comentou o erro na sua frente. Pior assim.`, `${quem} mandou dizer que espera mais de você.`],
    rede: [`A rede cortou o seu nome do próximo lote.`, `Na rede, erro é custo — e o custo tem nome: o seu.`],
    circulo: [`No círculo, ninguém atende o seu telefone por uns dias.`, `O círculo passou a confirmar duas vezes o que você diz.`],
    coletivo: [`O coletivo quis saber, ponto por ponto, onde falhou.`, `No coletivo, o erro virou conversa longa.`],
    turma: [`A turma riu de você por uma semana.`, `Na turma, a piada agora é sobre você.`],
    sindicato: [`${quem} pediu uma conversa. Não foi agradável.`, `O sindicato não esquece quem erra.`]
  };
  return variante(v, `org_erro_${o.estilo}`, T[o.estilo], o.id);
}

/* ================================================================ consequências medidas */

/** Uma fotografia do que importa no Submundo (antes e depois de uma ação): as linhas objetivas saem da diferença. */
export interface Foto { conta: number; exposicao: number; reputacao: number; confianca: Record<string, number>; lealdade: Record<string, number>; nivel: Record<string, number>; divida: number }

export function fotografar(v: Vida): Foto {
  const e = env(v);
  const confianca: Record<string, number> = {}, lealdade: Record<string, number> = {}, nivel: Record<string, number> = {};
  for (const [id, f] of Object.entries(e?.fichas ?? {})) confianca[id] = f.confianca;
  for (const o of e?.organizacoes ?? []) { lealdade[o.id] = o.lealdade; nivel[o.id] = o.nivel ?? -1; }
  return { conta: v.financas.conta + totalAplicado(v), exposicao: e?.exposicao ?? 0, reputacao: e?.reputacao ?? 0, confianca, lealdade, nivel, divida: e?.divida ?? 0 };
}

/** As linhas do que mudou (só o que mudou de verdade, com os números). */
export function consequencias(v: Vida, antes: Foto): string[] {
  const d = fotografar(v);
  const out: string[] = [];
  const dinheiro = Math.round(d.conta - antes.conta);
  if (Math.abs(dinheiro) >= 100) out.push(dinheiro > 0 ? `Entrou ${dinheiroCurto(dinheiro)} por fora.` : `Saiu ${dinheiroCurto(-dinheiro)}.`);
  for (const [id, x] of Object.entries(d.confianca)) {
    const a = antes.confianca[id];
    if (a !== undefined && Math.abs(x - a) >= 1) out.push(`Confiança de ${v.pessoas[id]?.nome ?? 'um contato'} em você: ${a} → ${x}.`);
  }
  for (const [id, x] of Object.entries(d.lealdade)) {
    const a = antes.lealdade[id];
    const o = env(v)?.organizacoes?.find(y => y.id === id);
    if (a !== undefined && Math.abs(x - a) >= 1) out.push(`O quanto ${o?.nome ?? 'a organização'} confia em você: ${a} → ${x}.`);
    if (a === undefined) out.push(`Você passou a ter relação com ${o?.nome ?? 'uma organização'}.`);
  }
  for (const [id, x] of Object.entries(d.nivel)) {
    const a = antes.nivel[id];
    const ov = orgViva(v, id);
    if (a !== undefined && a !== x && x >= 0) out.push(`Posto em ${ov?.nome ?? 'na organização'}: ${a >= 0 ? `${nomeDoNivel(ov, a)} → ` : ''}${nomeDoNivel(ov, x)}.`);
  }
  if (d.exposicao - antes.exposicao >= 2) out.push(`Mais gente sabe do que você faz (exposição ${antes.exposicao} → ${d.exposicao}).`);
  else if (antes.exposicao - d.exposicao >= 2) out.push(`Menos gente sabe do que você faz (exposição ${antes.exposicao} → ${d.exposicao}).`);
  if (d.divida - antes.divida >= 100) out.push(`Você passou a dever ${dinheiroCurto(d.divida)} a gente do meio.`);
  else if (antes.divida - d.divida >= 100) out.push(d.divida > 0 ? `A dívida com o meio caiu para ${dinheiroCurto(d.divida)}.` : 'Você não deve mais nada a ninguém do meio.');
  return out;
}

/* ================================================================ o ano por fora */

const POR_EXTENSO = ['nenhum', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
const extenso = (n: number) => POR_EXTENSO[n] ?? String(n);

/**
 * REWORK 12.3 · D2/D6: o ano no caminho, numa linha — do que o motor registrou neste ano (o que o de sempre rendeu, as
 * encomendas aceitas e como terminaram, com quem se trabalhou mais, o que se encomendou a outros). Antes, o dinheiro do ano
 * entrava calado (só o ano seco tinha frase). Nada de valores somados que o extrato não confirme: o número dito é o do
 * recorrente, lançado agora.
 */
export function resumoDoAno(v: Vida, recorrente: number, seco: boolean, perda: number): string | undefined {
  const e = env(v);
  if (!e) return undefined;
  const doAno = (x: EncomendaCriminal) => x.tFim !== undefined && x.tFim > v.t - 12 && x.tFim <= v.t;
  const feitas = (e.encomendas ?? []).filter(x => x.direcao === 'recebida' && (x.estado === 'concluida' || x.estado === 'falhou') && doAno(x));
  const deram = feitas.filter(x => x.estado === 'concluida').length;
  const delegadas = (e.encomendas ?? []).filter(x => x.direcao === 'delegada' && doAno(x));
  const porQuem = new Map<string, number>();
  for (const x of feitas) { const k = x.pessoaId ? v.pessoas[x.pessoaId]?.nome : x.orgId ? orgViva(v, x.orgId)?.nome : undefined; if (k) porQuem.set(k, (porQuem.get(k) ?? 0) + 1); }
  const top = [...porQuem.entries()].sort((a, b) => b[1] - a[1])[0];
  const partes: string[] = [];
  // REWORK 12.35 · 18.4: o ano tem cara — a guerra, a operação, a perseguição, a contestação, a traição, o ano quieto — e o
  // resumo começa por ela (o que de fato aconteceu, dos casos fechados no ano), com variação de forma.
  const casos = (e.casos ?? []).filter(c => c.t >= v.t - 12 && c.t < v.t && c.escolha !== undefined);
  const caso = (tipo: string) => casos.find(c => c.tipo === tipo);
  const guerra = caso('confronto'), busca = caso('operacao'), fuga = caso('perseguicao'), golpe = caso('contestacao'), traicao = caso('traicao');
  if (seco) partes.push(perda ? `o de sempre não rendeu nada — e deixou ${dinheiroCurto(perda)} a acertar com quem estava junto` : variante(v, 'res_seco', ['o de sempre não rendeu nada', 'a rotina por fora secou', 'nada entrou do que costumava entrar']));
  else if (recorrente > 0) partes.push(variante(v, 'res_rotina', [`o de sempre rendeu ${dinheiroCurto(recorrente)}`, `a rotina por fora deixou ${dinheiroCurto(recorrente)}`, `entraram ${dinheiroCurto(recorrente)} do que já é costume`, `o que corre sem você pensar pagou ${dinheiroCurto(recorrente)}`]));
  const abre = guerra ? variante(v, 'res_guerra', [`um ano de guerra (${guerra.tom === 'bom' ? 'e vocês levaram a melhor' : guerra.tom === 'ruim' ? 'e vocês perderam terreno' : 'sem vencedor'})`, `a guerra marcou o ano: ${guerra.tom === 'bom' ? 'saíram por cima' : guerra.tom === 'ruim' ? 'saíram menores' : 'ninguém ganhou'}`])
    : busca ? 'o ano em que a polícia bateu na sua porta'
      : fuga ? `o ano da perseguição (${fuga.tom === 'bom' ? 'você escapou' : 'terminou mal'})`
        : golpe ? `o ano em que contestaram o seu comando (${golpe.tom === 'bom' ? 'e você segurou' : 'e custou caro'})`
          : traicao ? 'o ano de uma traição de dentro'
            : undefined;
  if (abre) partes.unshift(abre);
  if (feitas.length) partes.push(`${extenso(feitas.length)} ${feitas.length === 1 ? 'trabalho aceito' : 'trabalhos aceitos'}${feitas.length > 1 ? ` (${deram === feitas.length ? 'todos deram certo' : deram === 0 ? 'nenhum deu certo' : `${extenso(deram)} ${deram === 1 ? 'deu' : 'deram'} certo`})` : deram ? ', que deu certo' : ', que deu errado'}${top && top[1] >= 2 ? `, quase todos com ${top[0]}` : top ? `, com ${top[0]}` : ''}`);
  if (delegadas.length) partes.push(`${extenso(delegadas.length)} ${delegadas.length === 1 ? 'encomenda feita' : 'encomendas feitas'} a outras pessoas`);
  if (!partes.length) return undefined;
  const frase = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join('; ')}; e ${partes[partes.length - 1]}`;
  const ano = anoDe(v.t) - 1;
  const quieto = !abre && !feitas.length && !delegadas.length;
  return variante(v, quieto ? 'res_quieto' : 'res_abre', quieto
    ? [`Por fora, em ${ano}: ${frase}. Um ano quieto.`, `${ano} foi um ano sem barulho por fora: ${frase}.`, `Em ${ano}, por fora, só a rotina: ${frase}.`]
    : [`Por fora, em ${ano}: ${frase}.`, `O ano de ${ano}, por fora: ${frase}.`, `Em ${ano}, no que você faz por fora: ${frase}.`]);
}

/**
 * REWORK 12.3 · D2/D6: por que a investigação começou, dito pelo que o motor sabe — a traição recente de um contato, o
 * trabalho que deixou rastro, o ramo de onde vem o dinheiro. Investigação não é condenação: o texto diz isso.
 */
export function textoDaInvestigacao(v: Vida, ramo?: string): string {
  const e = env(v);
  const traidor = Object.entries(e?.fichas ?? {}).filter(([, f]) => f.traiu !== undefined && v.t - f.traiu <= 24).map(([id]) => v.pessoas[id]?.nome).find(Boolean);
  const rastro = (e?.encomendas ?? []).filter(x => x.estado === 'falhou' && x.tFim !== undefined && v.t - x.tFim <= 24).length;
  const porque = traidor ? `Desde que ${traidor} falou o seu nome, alguém começou a fazer perguntas`
    : rastro ? `${rastro === 1 ? 'O trabalho que deu errado' : 'Os trabalhos que deram errado'} deixaram rastro: alguém começou a fazer perguntas`
      : 'Alguém começou a fazer perguntas';
  return `${porque}${ramo ? ` sobre ${ramo}` : ' sobre o que você faz por fora'}. É uma investigação — ainda não é processo, e muitas terminam arquivadas.`;
}

/**
 * REWORK 12.3 · D2/D6/D7: do que se falou numa conversa com um contato — escolhido do que o estado tem (o trabalho que fizeram
 * juntos, a notícia da organização dele, a sua investigação, a dívida entre vocês, a briga entre organizações) e, só na
 * falta disso, do que ele quer da vida. Antes, a conversa era sempre "X falou de dinheiro… A conversa aproximou vocês".
 */
export function assuntoDaConversa(v: Vida, pessoaId: string, quer: string): string {
  const e = env(v);
  const p = v.pessoas[pessoaId];
  const f = e?.fichas?.[pessoaId];
  if (!e || !p || !f) return `${p?.nome ?? 'O contato'} falou de ${quer}.`;
  const n = p.nome;
  const assuntos: { k: string; texto: string }[] = [];
  const junto = [...(e.encomendas ?? [])].reverse().find(x => x.pessoaId === pessoaId && x.tFim !== undefined && v.t - x.tFim <= 36 && (x.estado === 'concluida' || x.estado === 'falhou'));
  if (junto) {
    const nome = TIPO_NOME(junto.tipo);
    assuntos.push({ k: 'junto', texto: junto.estado === 'concluida' ? `${n} ainda ri do dia de ${nome}, em ${anoDe(junto.tFim!)}: "foi limpo".` : `${n} voltou ao assunto de ${nome}, que deu errado em ${anoDe(junto.tFim!)} — quer entender onde falharam.` });
  }
  const o = f.organizacao ? orgViva(v, f.organizacao) : undefined;
  const novidade = o?.historia.filter(h => v.t - h.t <= 24).slice(-1)[0];
  if (o && novidade) assuntos.push({ k: 'org', texto: `${n} contou as novidades de ${o.nome}: ${novidade.texto.charAt(0).toLowerCase()}${novidade.texto.slice(1)}` });
  if (e.investigado !== undefined) assuntos.push({ k: 'investigacao', texto: vozDe(v, pessoaId) === 'desconfiado' ? `${n} falou pouco e olhou muito para a porta: sabe que há perguntas sendo feitas sobre você.` : `${n} perguntou da investigação, baixinho, e disse para você não mudar de rotina agora.` });
  if ((f.favores ?? 0) < 0) assuntos.push({ k: 'divida', texto: variante(v, 'conv_divida', [`${n} não cobrou nada — mas mencionou, de passagem, o favor que você ainda deve.`, `${n} falou de tudo, menos do favor que você deve. Foi pior do que se tivesse falado.`, `No fim, ${n} perguntou, como quem não quer nada, quando você acerta o que deve.`], pessoaId) });
  if ((f.favores ?? 0) > 0) assuntos.push({ k: 'deve', texto: variante(v, 'conv_deve', [`${n} lembrou que ainda lhe deve uma, e que não esqueceu.`, `${n} disse que, quando você precisar, é só chamar: a dívida é dele.`, `${n} pagou a conta do bar "por conta do que te devo" — e disse que ainda não é o bastante.`], pessoaId) });
  const minha = (e.organizacoes ?? []).find(x => (x.relacao === 'membro' || x.propria) && x.saiu === undefined);
  const om = minha ? orgViva(v, minha.id) : undefined;
  const tensao = om ? Object.entries(om.relacoes ?? {}).find(([, s]) => s === 'conflito' || s === 'ruptura') : undefined;
  if (om && tensao) { const b = orgViva(v, tensao[0]); if (b) assuntos.push({ k: 'guerra', texto: `${n} quis saber como anda a briga entre ${om.nome} e ${b.nome} — no bairro, todo mundo pergunta.` }); }
  if (f.traiu !== undefined) assuntos.push({ k: 'traicao', texto: `${n} evitou o assunto de ${anoDe(f.traiu)}. Você também.` });
  const porVoz: Record<Voz, string[]> = {
    leal: [`${n} falou de ${quer}, com a franqueza de sempre.`, `Uma conversa longa com ${n}, sobre ${quer}.`],
    desconfiado: [`${n} falou de ${quer} — medindo cada palavra.`, `${n} desconversou o quanto pôde; no fim, falou de ${quer}.`],
    pragmatico: [`${n} foi direto ao ponto: ${quer}.`, `${n} falou de ${quer}, e de quanto isso custa.`],
    esquentado: [`${n} reclamou de tudo — e, no meio, de ${quer}.`, `${n} falou alto sobre ${quer}; você pediu para baixar a voz.`],
    caloroso: [`${n} pagou o café e falou de ${quer}, como quem fala com um amigo.`, `Com ${n}, a conversa foi de ${quer} até a família.`]
  };
  assuntos.push({ k: 'quer', texto: variante(v, `conv_quer_${vozDe(v, pessoaId)}`, porVoz[vozDe(v, pessoaId)], pessoaId) });
  // O assunto: o que mais pesa agora, evitando repetir o da última conversa com a mesma pessoa.
  const ultimo = v.fatos[`conv_assunto_${pessoaId}`];
  const ordem = ['investigacao', 'guerra', 'junto', 'org', 'divida', 'deve', 'traicao', 'quer'];
  const escolhido = assuntos.filter(a => ordem.indexOf(a.k) !== ultimo).sort((a, b) => ordem.indexOf(a.k) - ordem.indexOf(b.k))[0] ?? assuntos[assuntos.length - 1];
  v.fatos[`conv_assunto_${pessoaId}`] = ordem.indexOf(escolhido.k);
  return escolhido.texto;
}
const TIPO_NOME = (tipo: string) => tipoDeEncomenda(tipo)?.nome ?? 'um trabalho';
