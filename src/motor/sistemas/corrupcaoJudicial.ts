/**
 * REWORK 12.3 · PILAR C — A TENTATIVA DE CORROMPER O PROCESSO. Uma decisão narrativa, abstrata: o jogo não descreve como se
 * faz (nem quanto, nem a quem, nem por onde, na vida real) — descreve o que se decidiu e o que aconteceu depois.
 *
 *   QUEM PODE     quem tem um processo andando, dinheiro, e um CAMINHO até quem julga: um contato do meio de confiança
 *                 (intermediário, informante, quem manda), uma organização de que é de dentro e que tem gente no fórum, ou
 *                 o próprio peso (nome público, mandato, fortuna). Sem caminho, não há a quem levar a proposta. Uma tentativa
 *                 por processo.
 *   O QUE PODE    o intermediário sumir com o dinheiro (o golpe); quem julga recusar (o dinheiro volta em parte); recusar e
 *                 DENUNCIAR (uma investigação por corrupção, e as provas do processo crescem); aceitar e entregar pouco (a pena
 *                 menor, o "sucesso parcial"); aceitar — e a influência entra na conta, sem garantir absolvição (o processo
 *                 tem provas, e há teto).
 *   DEPOIS        o que foi aceito fica como risco que cai com os anos: pode vir à tona (outra investigação, um juiz
 *                 afastado, a absolvição comprada anulada, o nome na imprensa, o emprego).
 *   QUEM JULGA    a maioria é íntegra (`atoresJudiciais`): quem é íntegro recusa — e o muito íntegro denuncia. Ninguém é
 *                 comprável por natureza; o mesmo juiz, se já aceitou uma vez, fica mais vulnerável (e mais perigoso).
 *
 * Honorários de advogado NÃO são isto: contratar defesa é legal e mora em `tribunal`. Aqui é sempre ilegal, e a tela diz.
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { TentativaDeCorrupcao, Vida } from '../tipos';
import { escrever, marcarFato } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { balanco, vereditoDePagar } from './dinheiro';
import { economiaLocal } from '../dados/lugares';
import { abrirProcesso, NOME_CATEGORIA, registrarCorrupcaoAnual } from './justica';
import { ator, lembrarAtor, quemE } from './atoresJudiciais';
import { movimentoPorFora, pagarPorFora } from './porFora';
import { abalar } from './abalo';
import { marcar } from './marcas';
import { registrarAssuntoDaJustica } from './exposicao';
import { encerrarEmprego } from './trabalho';
import { dinheiro } from '../texto';
import { anoDe } from '../tempo';

export type CanalDeCorrupcao = 'contato' | 'org' | 'influencia';
export const NOME_DO_CANAL: Record<CanalDeCorrupcao, string> = { contato: 'por um contato do meio', org: 'pela organização', influencia: 'pelo seu próprio peso' };

const env = (v: Vida) => v.caminhos.envolvimento;
/** O processo de agora, lido de novo (depois de `abrirProcesso`, o estreitamento de tipos não vale). */
const procAgora = (v: Vida) => v.justica?.processo;

/** Os caminhos que a pessoa tem até quem julga (cada um com quem leva a proposta). */
export function canais(v: Vida): { canal: CanalDeCorrupcao; quem: string; pessoaId?: string; orgId?: string }[] {
  const e = env(v);
  const out: { canal: CanalDeCorrupcao; quem: string; pessoaId?: string; orgId?: string }[] = [];
  const contato = Object.entries(e?.fichas ?? {})
    .filter(([id, f]) => f.afastado === undefined && f.traiu === undefined && f.confianca >= 45 && ['intermediario', 'informante', 'chefe'].includes(f.papel) && v.pessoas[id]?.vivo)
    .sort((a, b) => b[1].confianca - a[1].confianca)[0];
  if (contato) out.push({ canal: 'contato', quem: v.pessoas[contato[0]].nome, pessoaId: contato[0] });
  const org = (e?.organizacoes ?? []).find(o => (o.relacao === 'membro' || o.propria) && o.saiu === undefined && o.expulso === undefined && ((o.nivel ?? 0) >= 2 || !!o.propria));
  const ov = org ? v.mundoCriminal?.orgs[org.id] : undefined;
  if (org && ov && ov.forca >= 35) out.push({ canal: 'org', quem: org.nome, orgId: org.id });
  const peso = (v.notoriedade?.valor ?? 0) >= 30 || !!v.caminhos.politica?.mandato || balanco(v).liquido >= 2_000_000 * economiaLocal(v.moradia.municipioId).custo;
  if (peso) out.push({ canal: 'influencia', quem: 'você mesmo' });
  return out;
}

/** O valor que a proposta precisa ter para ser levada a sério (pelo lugar, pela gravidade e pelo que a pessoa tem). */
export function valorDaProposta(v: Vida): number {
  const p = v.justica?.processo;
  const grave = p ? ({ pequenos: 0.5, violencia: 0.7, patrimonial: 1, fraude: 1.6, mercado: 1.8, corrupcao: 2, grupo: 2.5 } as const)[p.categoria] : 1;
  const base = 20000 * economiaLocal(v.moradia.municipioId).custo * grave;
  return Math.round(Math.max(base, Math.min(balanco(v).liquido * 0.04, base * 15)) / 1000) * 1000;
}

export function disponibilidadeCorrupcao(v: Vida, canal: CanalDeCorrupcao): Veredito {
  const p = v.justica?.processo;
  if (!p) return bloqueio('impossivel', 'Não há processo em andamento.');
  if (v.justica?.prisao && !p) return bloqueio('impossivel', 'Não há processo em andamento.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  if (p.tentouSubornar !== undefined) return bloqueio('incompativel', 'Você já tentou neste processo. Uma segunda tentativa só aumentaria o risco de tudo vir à tona.');
  if (v.t >= p.tJulgamento) return bloqueio('incompativel', 'O julgamento já está marcado para agora: não há mais tempo.');
  const c = canais(v).find(x => x.canal === canal);
  if (!c) {
    const motivo = canal === 'contato' ? 'Falta um caminho até quem julga: um contato do meio que confie em você (intermediário, informante ou quem manda, com confiança 45 ou mais).'
      : canal === 'org' ? 'Falta uma organização que tenha gente no fórum: é preciso ser de dentro (posto 2 ou mais) de uma organização com força.'
        : 'Falta peso próprio: um nome público, um mandato ou uma fortuna grande.';
    return bloqueio('requisito', motivo);
  }
  const juiz = ator(v, p.juizId);
  if (juiz?.historia.some(h => h.texto.startsWith('denunciou'))) return bloqueio('incompativel', `${quemE(juiz).charAt(0).toUpperCase()}${quemE(juiz).slice(1)} já denunciou uma tentativa sua. Nem pensar.`);
  const d = vereditoDePagar(v, valorDaProposta(v), 'A proposta só é levada a sério com uns');
  if (d.grau !== 'permitido') return d;
  return { grau: 'irregular', motivo: `É crime (corrupção). Não garante nada: quem julga pode recusar, denunciar, ou aceitar e entregar pouco; quem leva a proposta pode sumir com ela; e o que acontecer pode vir à tona anos depois.` };
}

/** A tentativa: o que aconteceu (sorteio derivado do estado: a integridade de quem julga, o caminho, a confiança). */
export function tentarCorromper(v: Vida, canal: CanalDeCorrupcao): { texto: string; tom?: 'bom' | 'ruim' } {
  const j = v.justica!;
  const p = j.processo!;
  const r = rngDe(v.id, 'corrupcao', p.tInicio, v.t, canal);
  const c = canais(v).find(x => x.canal === canal)!;
  const juiz = ator(v, p.juizId);
  const valor = valorDaProposta(v);
  p.tentouSubornar = v.t;
  pagarPorFora(v, 'corrupcao', valor);
  marcarFato(v, 'tentou_corromper');
  const t: TentativaDeCorrupcao = { t: v.t, alvoId: p.juizId ?? '', valor, via: canal === 'org' ? 'intermediario' : canal, ...(c.pessoaId ? { viaPessoaId: c.pessoaId } : {}), resultado: 'recusa', risco: 0, categoria: p.categoria };
  (j.corrupcoes ??= []).push(t);
  const nomeJuiz = juiz ? quemE(juiz) : 'quem julga';
  const quem = c.canal === 'influencia' ? 'Você mesmo fez chegar o recado' : `${c.quem} levou a proposta`;
  // O golpe: quem leva some com o dinheiro (menos quando é o próprio peso; menos quando a confiança é alta).
  const f = c.pessoaId ? env(v)?.fichas?.[c.pessoaId] : undefined;
  const golpe = canal === 'influencia' ? 0 : canal === 'org' ? 0.06 : clamp(0.2 - (f?.confianca ?? 45) / 400, 0.04, 0.2);
  if (r.chance(golpe)) {
    t.resultado = 'golpe';
    t.risco = 0.04;
    if (f && c.pessoaId) { f.traiu = v.t; f.confianca = clamp(f.confianca - 30); }
    escrever(v, { texto: `Tentou comprar ${nomeJuiz} no processo por ${NOME_CATEGORIA[p.categoria]}. O dinheiro sumiu no meio do caminho.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
    return { texto: `${quem}. Depois, silêncio: ${c.canal === 'contato' ? `${c.quem} sumiu` : 'ninguém sabe dizer onde o dinheiro parou'}, e com ${dinheiro(valor)}. Não há a quem reclamar — e o processo segue como estava.`, tom: 'ruim' };
  }
  const integridade = juiz?.integridade ?? 85;
  const jaComprometido = juiz?.comprometido !== undefined;
  const aceita = clamp((68 - integridade) / 55 + (jaComprometido ? 0.25 : 0) + (canal === 'org' ? 0.08 : 0), 0.01, 0.85);
  const y = r.next();
  if (y < aceita) {
    // Aceitou: entrega muito (a influência) — ou pouco (o "parcial": a pena menor, a absolvição ainda longe).
    const parcial = r.chance(0.35);
    t.resultado = parcial ? 'parcial' : 'aceito';
    p.influencia = parcial ? 0.08 : 0.15 + r.next() * 0.15;
    t.risco = 0.1 + (ator(v, p.promotorId)?.rigor ?? 50) / 1000;
    if (juiz) { juiz.comprometido = juiz.comprometido ?? v.t; lembrarAtor(v, juiz.id, 'aceitou dinheiro seu, por fora dos autos'); }
    escrever(v, { texto: `Pôs dinheiro por fora dos autos no processo por ${NOME_CATEGORIA[p.categoria]}. Ninguém diz nada.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
    return { texto: parcial
      ? `${quem}. A resposta veio de lado: o dinheiro ficou, e a promessa foi pequena — "vai pesar na pena, não no resto". Nada está garantido, e agora há um segredo entre você e ${nomeJuiz}.`
      : `${quem}. Aceitaram. Não houve aperto de mão, nem papel, nem prazo — só a sensação de que o processo mudou de peso. Absolvição, ninguém prometeu. E agora há um segredo entre você e ${nomeJuiz}.`, tom: undefined };
  }
  // Recusou. O muito íntegro denuncia (quanto mais íntegro, mais).
  if (r.chance(clamp((integridade - 55) / 80, 0.05, 0.55))) {
    t.resultado = 'denuncia';
    t.descoberta = v.t;
    t.risco = 0;
    p.provas = clamp((p.provas ?? 50) + 15);
    if (juiz) lembrarAtor(v, juiz.id, 'denunciou a sua tentativa de suborno');
    abalar(v, 'a tentativa denunciada', -8, 12);
    escrever(v, { texto: `Tentou comprar ${nomeJuiz}, que recusou e denunciou. Agora há também uma investigação por corrupção.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
    return { texto: `${quem}. A resposta foi um ofício: ${nomeJuiz} recusou, mandou registrar a tentativa e pediu investigação. O dinheiro ficou retido como prova, as provas do processo pesaram mais — e vem outro processo, por corrupção.`, tom: 'ruim' };
  }
  t.resultado = 'recusa';
  t.risco = 0.03;
  const volta = canal === 'influencia' ? valor : Math.round(valor * 0.7 / 100) * 100;
  movimentoPorFora(v, 'corrupcao', volta);
  if (juiz) lembrarAtor(v, juiz.id, 'recusou uma proposta sua');
  return { texto: `${quem}. ${nomeJuiz.charAt(0).toUpperCase()}${nomeJuiz.slice(1)} não quis ouvir. ${volta < valor ? `Voltaram ${dinheiro(volta)} dos ${dinheiro(valor)}; o resto ficou com quem levou o recado.` : 'O dinheiro voltou inteiro.'} O processo segue — e a recusa ficou na memória de alguém.`, tom: 'ruim' };
}

/**
 * O ano: a tentativa denunciada vira processo (quando o processo de agora termina); a aceita pode vir à tona — o juiz é
 * afastado, a absolvição comprada é anulada (o processo volta), a imprensa fala, o emprego pode ir junto.
 */
function anoDaCorrupcao(v: Vida, _r: Rng): void {
  const j = v.justica;
  if (!j?.corrupcoes?.length) return;
  for (const t of j.corrupcoes) {
    if (t.processada !== undefined) continue;
    // A denúncia: o processo por corrupção abre quando não há outro correndo (a Justiça faz uma coisa por vez, aqui).
    if (t.resultado === 'denuncia' || t.descoberta !== undefined) {
      if (!j.processo && !j.prisao && !j.foragido) {
        t.processada = v.t;
        abrirProcesso(v, rngDe(v.id, 'corrupcao_proc', t.t, v.t), 'corrupcao');
        const np = procAgora(v);
        if (np) np.provas = clamp(Math.max(np.provas ?? 50, t.resultado === 'denuncia' ? 70 : 60));
      }
      continue;
    }
    if (t.risco <= 0.005) continue;
    const r = rngDe(v.id, 'corrupcao_vem', t.t, v.t);
    if (r.chance(t.risco)) {
      t.descoberta = v.t;
      const juiz = ator(v, t.alvoId);
      if (juiz) { juiz.afastado = v.t; lembrarAtor(v, juiz.id, 'foi afastado quando a história veio à tona'); }
      registrarAssuntoDaJustica(v, 'processo');
      abalar(v, 'a corrupção descoberta', -10, 14);
      marcar(v, 'fracasso', 'A tentativa de comprar um juiz veio à tona.', 3);
      // A absolvição comprada cai: o processo antigo volta (com o que já se sabia — e mais).
      const anulada = t.desfecho === 'absolvicao' && !j.processo && !j.prisao;
      if (anulada) {
        const ult = [...j.antecedentes].reverse().find(a => a.categoria === t.categoria && a.desfecho === 'absolvicao' && a.t >= t.t);
        if (ult) ult.desfecho = 'acordo';
        abrirProcesso(v, rngDe(v.id, 'corrupcao_anula', t.t, v.t), t.categoria);
        const np = procAgora(v);
        if (np) np.provas = clamp((np.provas ?? 50) + 20);
      }
      // O emprego: quem tem carteira e vê o nome no jornal por isso pode perder o lugar.
      const e = v.trabalho.atual;
      const perdeu = e && rngDe(v.id, 'corrupcao_emprego', t.t).chance(0.45);
      if (perdeu) encerrarEmprego(v, 'justa causa');
      escrever(v, { texto: `Veio à tona que, em ${anoDe(t.t)}, houve dinheiro seu por fora num processo${juiz ? `: ${quemE(juiz)} foi afastad${juiz.genero === 'feminino' ? 'a' : 'o'}` : ''}.${anulada ? ' A absolvição daquele processo foi anulada: o caso voltou a correr.' : ''}${perdeu ? ' No trabalho, a resposta foi a demissão.' : ''} Vem um processo por corrupção.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
      continue;
    }
    t.risco = Math.round(t.risco * 0.82 * 1000) / 1000;
  }
}
registrarCorrupcaoAnual(anoDaCorrupcao);

/** Para a tentativa: o processo terminou (a absolvição comprada fica registrada — é ela que pode cair depois). */
export function registrarDesfechoComInfluencia(v: Vida, absolveu: boolean): void {
  const t = [...(v.justica?.corrupcoes ?? [])].reverse().find(x => (x.resultado === 'aceito' || x.resultado === 'parcial') && x.desfecho === undefined);
  if (t) t.desfecho = absolveu ? 'absolvicao' : 'condenacao';
}

/** A leitura da tela: o que está em aberto (sem número de probabilidade: o jogador sabe o que fez, não o que vai vir). */
export function leituraDaCorrupcao(v: Vida): string[] {
  return (v.justica?.corrupcoes ?? []).map(t => {
    const a = ator(v, t.alvoId);
    const quem = a ? quemE(a) : 'quem julgava';
    const como = { golpe: 'o dinheiro sumiu no caminho', recusa: `${quem} recusou`, denuncia: `${quem} recusou e denunciou`, aceito: `${quem} aceitou`, parcial: `${quem} aceitou e prometeu pouco` }[t.resultado];
    return `${anoDe(t.t)}: tentativa de influenciar o processo por ${NOME_CATEGORIA[t.categoria]} (${dinheiro(t.valor)}) — ${como}${t.descoberta !== undefined ? `; veio à tona em ${anoDe(t.descoberta)}` : t.resultado === 'aceito' || t.resultado === 'parcial' ? '; por enquanto, ninguém sabe' : ''}.`;
  });
}

/* ================================================================ C8 · o dinheiro que entrou por fora */

/** O que entrou por fora e ainda não foi "posto em ordem" (a parte que a Justiça mais facilmente acha). */
export const naoRegularizado = (v: Vida) => { const e = env(v); return e ? Math.max(0, e.ganhos - (e.regularizado ?? 0) - (v.fatos['confiscado_total'] ?? 0)) : 0; };

/** Por onde se pode pôr o dinheiro em ordem (abstrato: um negócio, uma empresa, a organização, um contato das fraudes). */
function meioDeRegularizar(v: Vida): string | undefined {
  const e = env(v);
  if (!e) return undefined;
  const neg = (e.negocios ?? []).find(n => n.estado === 'ativo');
  if (neg) return neg.nome;
  const emp = (v.financas.empresas ?? []).find(x => x.estado !== 'encerrada');
  if (emp) return emp.nome;
  const org = (e.organizacoes ?? []).find(o => (o.relacao === 'membro' || o.propria) && o.saiu === undefined && o.expulso === undefined);
  if (org) return org.nome;
  const c = Object.entries(e.fichas ?? {}).find(([id, f]) => f.especialidade === 'fraudes' && f.confianca >= 40 && f.afastado === undefined && v.pessoas[id]?.vivo);
  return c ? v.pessoas[c[0]].nome : undefined;
}

export function disponibilidadeRegularizar(v: Vida): Veredito {
  const e = env(v);
  if (!e) return bloqueio('impossivel', 'Não há dinheiro de fora para pôr em ordem.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Da prisão, não.');
  if (e.anoRegularizou === v.t) return bloqueio('incompativel', 'Isso já foi feito neste ano.');
  const valor = naoRegularizado(v);
  if (valor < 20000) return bloqueio('incompativel', 'O que entrou por fora e ainda está "solto" é pouco para valer o custo.');
  if (!meioDeRegularizar(v)) return bloqueio('requisito', 'Falta por onde: um negócio, uma empresa, uma organização ou alguém das fraudes de confiança.');
  const custo = custoDeRegularizar(v);
  const d = vereditoDePagar(v, custo, 'O custo de pôr o dinheiro em ordem é de uns');
  if (d.grau !== 'permitido') return d;
  return { grau: 'irregular', motivo: `É crime (lavagem, na lei). Custa uns ${dinheiro(custo)} e deixa rastro de papel: protege uma parte — não tudo, e não para sempre.` };
}
export const custoDeRegularizar = (v: Vida) => Math.round(Math.min(naoRegularizado(v), 2_000_000 * economiaLocal(v.moradia.municipioId).custo) * 0.2 / 100) * 100;

export function regularizar(v: Vida): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const meio = meioDeRegularizar(v)!;
  const custo = custoDeRegularizar(v);
  const valor = Math.round(custo / 0.2);
  pagarPorFora(v, 'custos', custo);
  e.regularizado = (e.regularizado ?? 0) + valor;
  e.anoRegularizou = v.t;
  e.exposicao = clamp(e.exposicao + 3);
  escrever(v, { texto: `Passou ${dinheiro(valor)} que tinham entrado por fora por ${meio}, para parecer dinheiro de outro lugar.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
  return { texto: `${dinheiro(valor)} passaram por ${meio} e voltaram com outra cara. Custou ${dinheiro(custo)} — e ficou um rastro de papel que, numa investigação séria, alguém pode seguir.` };
}
