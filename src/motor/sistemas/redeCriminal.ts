/**
 * REWORK 12.25 · NPC-12.25-01 — OS CONTATOS DO CAMINHO COMO GENTE. A ficha (`FichaDeContato`) já tinha papel, confiança,
 * promessas e traição; faltava o que se faz com cada pessoa. Agora cada papel tem as suas ações (o parceiro topa um
 * trabalho junto, o fornecedor negocia o lote, o comprador apresenta gente, quem manda conta do grupo, quem fica sabendo
 * avisa) — e a pessoa responde: aceita, recusa, volta com outra proposta, pede algo em troca, cobra o que se deve.
 *
 *   FAVORES     quem deve a quem (positivo: ele deve a você). Pedir um favor gasta o crédito — ou cria uma dívida; fazer
 *               um favor custa e fica lembrado; a dívida velha é cobrada (a cena da cobrança)
 *   AMIZADE     diferente da confiança no caminho: o amigo perdoa um atraso, aceita uma conversa, volta depois de brigar
 *   INTERESSE   o que a pessoa quer agora (dinheiro, subir, sair, a família, a vingança, segurança) — muda com o tempo, e
 *               muda o que ela aceita
 *   LIMITES     cada ação, uma vez por ano com cada pessoa; a confiança que se ganha conversando tem teto no ano. Não há
 *               máquina de confiança infinita: o que constrói confiança de verdade é cumprir o que se combinou
 *
 * Nada aqui descreve como se faz coisa alguma: são conversas, pedidos e consequências. Sorteios derivados (`rngDe`).
 */
import { clamp, rngDe } from '../rng';
import type { FichaDeContato, PapelDoContato, Vida } from '../tipos';
import { idadePessoa, lembrarCom } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { vereditoDePagar } from './dinheiro';
import { ativo } from './ilicito';
import { preso } from './justica';
import { afastar, anotar, contatosAtivos, criarContato, lembrarOrg, orgPorId, NOME_DO_PAPEL } from './submundo';
import { NOME_DO_RAMO, ramosAtivos } from './ramos';
import { escalaDe, movimentoPorFora, nivelNaOrganizacao, pagarPorFora } from './carreiraCriminal';
import { proporEncomenda, tipoDeEncomenda } from './encomendas';
import { assuntoDaConversa } from './relatoDoCrime';
import { dinheiroCurto } from '../texto';

const env = (v: Vida) => v.caminhos.envolvimento;
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo * escalaDe(v) / 100) * 100;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- a memória entre vocês */

/** O que aconteceu entre você e essa pessoa (no máximo 10 linhas). */
export function historiaDoContato(v: Vida, id: string, texto: string, tom?: 'bom' | 'ruim'): void {
  const f = env(v)?.fichas?.[id];
  if (!f) return;
  (f.historia ??= []).push({ t: v.t, texto, ...(tom ? { tom } : {}) });
  if (f.historia.length > 10) f.historia.splice(0, f.historia.length - 10);
}

/**
 * A confiança muda. A que vem de conversa e gentileza (`social`) tem teto no ano: dez pontos. A que vem de cumprir (o
 * trabalho que deu certo, a dívida paga) não tem — é o jeito de verdade de construir confiança.
 */
export function mudarConfianca(v: Vida, id: string, x: number, social = false): number {
  const f = env(v)?.fichas?.[id];
  if (!f) return 0;
  let d = x;
  if (social && d > 0) {
    const g = f.ganhoNoAno?.t === v.t ? f.ganhoNoAno.x : 0;
    d = Math.max(0, Math.min(d, 10 - g));
    f.ganhoNoAno = { t: v.t, x: g + d };
  }
  f.confianca = clamp(f.confianca + d);
  return d;
}

/* ---------------------------------------------------------------- as ações de cada papel */

export type OqueContato = 'conversar' | 'pedir_favor' | 'fazer_favor' | 'cobrar' | 'acertar' | 'propor_trabalho' | 'convidar' | 'negociar_lote' | 'oferecer_bens' | 'apresentar' | 'falar_do_grupo' | 'encerrar' | 'reconciliar';

export const ACOES_DO_PAPEL: Record<PapelDoContato, OqueContato[]> = {
  parceiro: ['conversar', 'propor_trabalho', 'pedir_favor', 'fazer_favor', 'convidar', 'encerrar'],
  protegido: ['conversar', 'propor_trabalho', 'pedir_favor', 'fazer_favor', 'convidar', 'encerrar'],
  tecnico: ['conversar', 'propor_trabalho', 'pedir_favor', 'fazer_favor', 'encerrar'],
  fornecedor: ['conversar', 'negociar_lote', 'propor_trabalho', 'pedir_favor', 'fazer_favor', 'encerrar'],
  comprador: ['conversar', 'oferecer_bens', 'apresentar', 'pedir_favor', 'fazer_favor', 'encerrar'],
  chefe: ['conversar', 'falar_do_grupo', 'pedir_favor', 'fazer_favor'],
  intermediario: ['conversar', 'propor_trabalho', 'apresentar', 'pedir_favor', 'fazer_favor', 'encerrar'],
  informante: ['conversar', 'falar_do_grupo', 'pedir_favor', 'fazer_favor', 'encerrar']
};

export function rotuloDaAcaoComContato(oque: OqueContato, papel: PapelDoContato, nome: string): string {
  switch (oque) {
    case 'conversar': return `Conversar com ${nome}`;
    case 'pedir_favor': return papel === 'fornecedor' ? 'Pedir um lote fiado' : papel === 'informante' ? 'Pedir que fique de olho' : papel === 'chefe' ? 'Pedir proteção' : papel === 'comprador' ? 'Pedir que compre agora' : 'Pedir um favor';
    case 'fazer_favor': return `Fazer um favor a ${nome}`;
    case 'cobrar': return 'Cobrar o favor que ele deve';
    case 'acertar': return 'Acertar o que você deve';
    case 'propor_trabalho': return papel === 'fornecedor' ? 'Perguntar se há trabalho' : 'Propor um trabalho juntos';
    case 'convidar': return 'Chamar para a sua organização';
    case 'negociar_lote': return 'Negociar o preço do próximo lote';
    case 'oferecer_bens': return 'Oferecer mercadoria';
    case 'apresentar': return 'Pedir que apresente alguém';
    case 'falar_do_grupo': return papel === 'informante' ? 'Perguntar o que se comenta' : 'Conversar sobre o grupo';
    case 'encerrar': return 'Encerrar a parceria';
    case 'reconciliar': return `Procurar ${nome} de novo`;
  }
}

/** As ações possíveis com essa pessoa agora (as do papel, mais as dos favores e da reconciliação). */
export function acoesComContato(v: Vida, id: string): OqueContato[] {
  const f = env(v)?.fichas?.[id];
  if (!f) return [];
  if (f.afastado !== undefined || f.traiu !== undefined) return ['reconciliar'];
  const xs = [...ACOES_DO_PAPEL[f.papel]];
  if ((f.favores ?? 0) > 0) xs.splice(3, 0, 'cobrar');
  if ((f.favores ?? 0) < 0) xs.splice(1, 0, 'acertar');
  return xs;
}

const feitaNoAno = (f: FichaDeContato, oque: string, v: Vida) => f.tAcoes?.[oque] === v.t;
const marcarFeita = (f: FichaDeContato, oque: string, v: Vida) => { (f.tAcoes ??= {})[oque] = v.t; };
/** O valor de um favor (no lugar e no patamar): o miúdo do caminho. */
export const valorDeFavor = (v: Vida) => preco(v, 1200);

export function disponibilidadeContato(v: Vida, id: string, oque: OqueContato): Veredito {
  const e = env(v);
  const f = e?.fichas?.[id];
  const p = v.pessoas[id];
  if (!e || !f || !p) return bloqueio('impossivel', 'Essa pessoa não é do seu caminho.');
  if (!p.vivo) return bloqueio('impossivel', `${p.nome} morreu.`);
  if (preso(v)) return bloqueio('impossivel', 'Da prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  if (!acoesComContato(v, id).includes(oque)) return bloqueio('impossivel', 'Isso não cabe com essa pessoa agora.');
  if (feitaNoAno(f, oque, v)) return bloqueio('incompativel', 'Isso já foi feito com essa pessoa neste ano.');
  if (oque === 'reconciliar') {
    if (f.traiu !== undefined && v.t - f.traiu < 60) return bloqueio('incompativel', `${p.nome} falou o seu nome há pouco tempo. Isso não se conserta tão cedo.`);
    return PERMITIDO;
  }
  // Fora do caminho, a conversa continua (gente é gente); o trabalho, não.
  const deTrabalho: OqueContato[] = ['propor_trabalho', 'negociar_lote', 'oferecer_bens', 'convidar', 'apresentar'];
  if (deTrabalho.includes(oque) && !ativo(v)) return bloqueio('incompativel', 'Você não está mais nisso.');
  switch (oque) {
    case 'fazer_favor': return vereditoDePagar(v, valorDeFavor(v), 'Um favor desses custa uns');
    case 'acertar': return vereditoDePagar(v, valorDeFavor(v) * -(f.favores ?? 0), 'O que você deve vale uns');
    case 'convidar': {
      const propria = e.organizacoes?.find(o => o.propria && o.saiu === undefined);
      if (!propria && nivelNaOrganizacao(v) < 3) return bloqueio('requisito', 'Para chamar alguém, é preciso ter onde: uma organização sua, ou um posto que permita.');
      if (f.organizacao && (propria ? f.organizacao === propria.id : e.organizacoes?.some(o => o.id === f.organizacao && o.relacao === 'membro'))) return bloqueio('incompativel', `${p.nome} já está com vocês.`);
      return PERMITIDO;
    }
    case 'oferecer_bens': return PERMITIDO;
    case 'negociar_lote': return ramosAtivos(e).includes('contrabando') ? PERMITIDO : bloqueio('requisito', 'Você não compra lote de ninguém (não atua no contrabando).');
  }
  return PERMITIDO;
}

/** A disposição dessa pessoa com você: a confiança, a amizade, o que um deve ao outro, o que ficou quebrado. */
export function disposicao(f: FichaDeContato): number {
  return clamp(f.confianca * 0.55 + (f.amizade ?? 20) * 0.3 + (f.favores ?? 0) * 7 - Math.max(0, f.quebradas - f.cumpridas) * 10, 0, 100);
}

export function executarContato(v: Vida, id: string, oque: OqueContato): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const f = e.fichas![id];
  const p = v.pessoas[id];
  const r = rngDe(v.id, 'contato', id, oque, v.t);
  marcarFeita(f, oque, v);
  const d = disposicao(f);
  const nome = p.nome;
  switch (oque) {
    case 'conversar': {
      f.amizade = clamp((f.amizade ?? 20) + 5);
      const subiu = mudarConfianca(v, id, 3, true);
      f.interesse ??= interesseDe(v, id);
      const quer = QUER[f.interesse];
      lembrarCom(v, id, 'Uma conversa longa, sem pressa.', 'apoio', 1);
      // REWORK 12.3 · D: do que se falou sai do estado (o trabalho de vocês, a organização dele, a sua investigação...).
      const assunto = assuntoDaConversa(v, id, quer);
      // Às vezes, a conversa traz trabalho; às vezes, um pedido.
      if (ativo(v) && f.papel !== 'chefe' && r.chance(0.3 + d / 400)) {
        const x = proporEncomenda(v, r, f.especialidade, { pessoaId: id });
        if (x) return { texto: `${assunto} No fim, ${nome} trouxe um trabalho: ${tipoDeEncomenda(x.tipo)?.nome ?? 'uma proposta'} (está em Encomendas).`, tom: 'bom' };
      }
      if (r.chance(0.22)) {
        v.fatos['sub125_pedido'] = v.t;
        (e.cenas125 ??= {})['sub125_pedido'] = id;
        return { texto: `${assunto} Antes de ir embora, ${nome} pediu uma coisa a você.` };
      }
      return { texto: `${assunto}${subiu ? '' : ' (Vocês já se falaram muito neste ano: a confiança agora vem do que se cumpre.)'}` };
    }
    case 'pedir_favor': {
      const devia = (f.favores ?? 0) > 0;
      if (!devia && !r.chance(clamp(0.25 + d / 120, 0.1, 0.9))) {
        // Não de graça: a contraproposta (pagar agora) ou a recusa.
        if (r.chance(0.5) && v.financas.conta >= valorDeFavor(v)) {
          pagarPorFora(v, 'custos', valorDeFavor(v));
          aplicarFavor(v, id, f);
          historiaDoContato(v, id, 'Fez o que você pediu, mas cobrou.');
          return { texto: `${nome} topou, mas não de graça: ${dinheiroCurto(valorDeFavor(v))} agora. ${efeitoDoFavor(f.papel)}` };
        }
        historiaDoContato(v, id, 'Recusou um pedido seu.');
        return { texto: `${nome} disse que não dá agora${f.interesse === 'sair' ? ': anda querendo distância disso tudo' : ''}.`, tom: 'ruim' };
      }
      f.favores = (f.favores ?? 0) - 1;
      aplicarFavor(v, id, f);
      historiaDoContato(v, id, devia ? 'Pagou o favor que devia.' : 'Fez um favor a você.', 'bom');
      return { texto: `${devia ? `${nome} pagou o que devia.` : `${nome} fez o favor — agora você deve uma.`} ${efeitoDoFavor(f.papel)}`, tom: 'bom' };
    }
    case 'fazer_favor': {
      pagarPorFora(v, 'custos', valorDeFavor(v));
      f.favores = (f.favores ?? 0) + 1;
      f.amizade = clamp((f.amizade ?? 20) + 3);
      mudarConfianca(v, id, 4, true);
      historiaDoContato(v, id, 'Você fez um favor a ele.', 'bom');
      return { texto: `Você resolveu um problema de ${nome} (${dinheiroCurto(valorDeFavor(v))} e um pouco de tempo). Agora ${nome} deve uma — e lembra.`, tom: 'bom' };
    }
    case 'cobrar': {
      if (d < 35 && r.chance(0.4)) {
        f.favores = Math.max(0, (f.favores ?? 0) - 1);
        mudarConfianca(v, id, -8);
        f.amizade = clamp((f.amizade ?? 20) - 10);
        historiaDoContato(v, id, 'Você cobrou um favor do jeito errado.', 'ruim');
        return { texto: `${nome} pagou — de cara fechada. Cobrar desse jeito custou mais do que rendeu.`, tom: 'ruim' };
      }
      const x = valorDeFavor(v) * (f.favores ?? 1);
      f.favores = 0;
      movimentoPorFora(v, 'ocasional', x);
      historiaDoContato(v, id, 'Pagou o que devia a você.');
      return { texto: `${nome} acertou o que devia: ${dinheiroCurto(x)}. Contas zeradas entre vocês.` };
    }
    case 'acertar': {
      pagarPorFora(v, 'custos', valorDeFavor(v) * -(f.favores ?? 0));
      f.favores = 0;
      f.cumpridas++;
      mudarConfianca(v, id, 5);
      historiaDoContato(v, id, 'Você acertou o que devia.', 'bom');
      return { texto: `Você acertou o que devia a ${nome}. Nenhum assunto pendente entre vocês.`, tom: 'bom' };
    }
    case 'propor_trabalho': {
      const y = r.next();
      if (f.interesse === 'sair' || y > 0.35 + d / 100) {
        historiaDoContato(v, id, 'Recusou um trabalho que você propôs.');
        return { texto: `${nome} não quis${f.interesse === 'sair' ? ': quer distância disso' : ' agora: o momento não é bom'}.`, tom: 'ruim' };
      }
      const x = proporEncomenda(v, r, f.especialidade, { pessoaId: id });
      if (!x) return { texto: 'Nada saiu da conversa.' };
      x.chance = Math.min(0.95, Math.round((x.chance + 0.06) * 100) / 100);
      if (y > 0.25 + d / 150) {
        x.valor = Math.round(x.valor * 0.8 / 100) * 100;
        x.negociada = true;
        return { texto: `${nome} topou, com uma condição: a parte dele é maior. A proposta (${dinheiroCurto(x.valor)} para você) está em Encomendas.` };
      }
      return { texto: `${nome} topou fazer junto. A proposta está em Encomendas — com alguém de confiança do lado, a chance é melhor.`, tom: 'bom' };
    }
    case 'convidar': {
      const propria = e.organizacoes?.find(o => o.propria && o.saiu === undefined);
      const destino = propria ?? e.organizacoes?.find(o => o.relacao === 'membro' && o.saiu === undefined);
      const aceita = r.chance(clamp(0.2 + d / 150 + (f.interesse === 'subir' ? 0.25 : f.interesse === 'sair' ? -0.4 : 0), 0.05, 0.9));
      if (!aceita || !destino) { historiaDoContato(v, id, 'Recusou entrar na organização.'); return { texto: `${nome} agradeceu e recusou: ${f.interesse === 'sair' ? 'quer ir para o outro lado' : 'prefere continuar por conta própria'}.` }; }
      f.organizacao = destino.id;
      if (propria?.propria && !propria.propria.tenentes.includes(id) && propria.propria.tenentes.length < 4) propria.propria.tenentes.push(id);
      lembrarOrg(destino, v.t, 'alianca', 3);
      historiaDoContato(v, id, `Entrou para ${destino.nome} a seu convite.`, 'bom');
      return { texto: `${nome} topou: agora é de ${destino.nome}. Gente sua dentro conta — e gente sua que erra também.`, tom: 'bom' };
    }
    case 'negociar_lote': {
      if (r.chance(0.3 + d / 150)) { v.fatos['sub125_desconto'] = v.t; return { texto: `${nome} fechou um preço melhor para o próximo lote (uns 20% a menos).`, tom: 'bom' }; }
      mudarConfianca(v, id, -2);
      return { texto: `${nome} não baixou: "o preço é esse, e tem fila".` };
    }
    case 'oferecer_bens': {
      const s = e.especializacoes?.contrabando;
      if (s && (s.estoque ?? 0) > 0) {
        const custo = s.estoque!;
        const valor = Math.round(custo * (1.05 + (s.mercado ?? 0) * 0.12 + d / 500) / 100) * 100;
        s.estoque = 0;
        s.operacoes++;
        s.ganhos += Math.max(0, valor - custo);
        e.ganhos += Math.max(0, valor - custo);
        movimentoPorFora(v, 'ocasional', valor);
        f.cumpridas++;
        historiaDoContato(v, id, 'Comprou o seu lote inteiro.', 'bom');
        return { texto: `${nome} levou tudo: ${dinheiroCurto(valor)} por ${dinheiroCurto(custo)} investidos.`, tom: valor >= custo ? 'bom' : 'ruim' };
      }
      const x = ativo(v) ? proporEncomenda(v, r, f.especialidade, { pessoaId: id }, 1) : undefined;
      return { texto: x ? `Sem mercadoria sua para vender, ${nome} fez uma encomenda. Está em Encomendas.` : `${nome} ouviu, mas não precisa de nada agora.` };
    }
    case 'apresentar': {
      if (v.fatos[`sub125_apresentou_${id}`] !== undefined && v.t - v.fatos[`sub125_apresentou_${id}`] < 24) return { texto: `${nome} já apresentou gente há pouco. "Deixa assentar."` };
      if (!r.chance(0.35 + d / 150)) return { texto: `${nome} disse que vai pensar em alguém. Não pensou.` };
      v.fatos[`sub125_apresentou_${id}`] = v.t;
      const ramo = r.chance(0.6) ? f.especialidade : r.pick(ramosAtivos(e).length ? ramosAtivos(e) : [f.especialidade]);
      const novo = criarContato(v, ramo, undefined, 11);
      const nf = e.fichas![novo];
      nf.confianca = clamp(nf.confianca + Math.round(f.confianca / 8));
      historiaDoContato(v, id, `Apresentou ${v.pessoas[novo].nome} a você.`, 'bom');
      return { texto: `${nome} apresentou ${v.pessoas[novo].nome} (${NOME_DO_PAPEL[nf.papel]}, ${NOME_DO_RAMO[nf.especialidade].toLowerCase()}). Quem chega indicado chega com um pouco de confiança.`, tom: 'bom' };
    }
    case 'falar_do_grupo': {
      if (f.papel === 'informante') {
        if (e.investigado !== undefined) { v.fatos['sabe_da_investigacao'] = v.t; return { texto: `${nome} avisou: há alguém fazendo perguntas sobre você, e não é do meio. Melhor saber agora do que depois.` }; }
        if (e.exposicao >= 25 && (v.fatos['sub125_avisado'] === undefined || v.t - v.fatos['sub125_avisado'] >= 24)) {
          v.fatos['sub125_avisado'] = v.t;
          e.exposicao = clamp(e.exposicao - 6);
          return { texto: `${nome} contou quem anda falando demais por aí. Dá para se cuidar — a exposição baixou um pouco.`, tom: 'bom' };
        }
        return { texto: `${nome} não ouviu nada de novo. "Por enquanto, quieto."` };
      }
      const org = f.organizacao ? orgPorId(v, f.organizacao) : undefined;
      if (org) { lembrarOrg(org, v.t, 'favor', 2); v.fatos[`sub125_ouviu_${org.id}`] = v.t; }
      return { texto: org ? `${nome} contou como andam as coisas em ${org.nome}: quem sobe, quem cai, o que se espera de você.` : `${nome} contou como as coisas funcionam por ali — o que se espera de quem chega.` };
    }
    case 'encerrar': {
      const magoa = f.espera === 'lealdade' || (f.favores ?? 0) < 0 || f.quebradas > f.cumpridas;
      f.afastado = v.t;
      if (magoa && r.chance(0.3)) {
        f.traiu = v.t;
        e.exposicao = clamp(e.exposicao + 8);
        historiaDoContato(v, id, 'Não aceitou bem o fim da parceria e falou demais.', 'ruim');
        anotar(v, `${nome} não aceitou o fim da parceria — e falou demais.`, 'ruim');
        return { texto: `${nome} não aceitou bem: saiu falando o seu nome para quem quisesse ouvir.`, tom: 'ruim' };
      }
      historiaDoContato(v, id, 'Vocês encerraram a parceria.');
      anotar(v, `Encerrou a parceria com ${nome}.`);
      return { texto: `Vocês encerraram a parceria${magoa ? ', com alguma mágoa' : ', sem briga'}.` };
    }
    case 'reconciliar': {
      const tempo = (v.t - (f.traiu ?? f.afastado ?? v.t)) / 12;
      const chance = clamp(0.2 + (f.amizade ?? 20) / 150 + tempo * 0.05 + (f.traiu !== undefined ? -0.15 : 0), 0.05, 0.85);
      if (!r.chance(chance)) { historiaDoContato(v, id, 'Você o procurou; ele não quis conversa.'); return { texto: `${nome} não quis conversa. Há coisas que demoram mais.`, tom: 'ruim' }; }
      delete f.afastado;
      delete f.traiu;
      f.reconciliado = v.t;
      f.confianca = Math.max(f.confianca, 30);
      f.quebradas = Math.min(f.quebradas, f.cumpridas);
      historiaDoContato(v, id, 'Vocês se reconciliaram.', 'bom');
      lembrarCom(v, id, 'Fizeram as pazes depois de tudo.', 'reconciliacao', 2);
      anotar(v, `Fez as pazes com ${nome}.`, 'bom');
      return { texto: `${nome} topou conversar — e a conversa terminou num aperto de mão. Do zero, mas de volta.`, tom: 'bom' };
    }
  }
}

const QUER: Record<NonNullable<FichaDeContato['interesse']>, string> = {
  dinheiro: 'dinheiro (as contas, o que falta, o que quer comprar)', subir: 'subir no meio (quer mais, e quer que saibam)',
  sair: 'sair disso (cansou, ou tem medo)', familia: 'a família (um filho, uma mãe doente)', vinganca: 'uma conta antiga que quer acertar com alguém',
  seguranca: 'segurança (dormir em paz, não ser o próximo)'
};

/** O que a pessoa quer agora (estável por alguns anos; a idade e o que viveu pesam). */
export function interesseDe(v: Vida, id: string): NonNullable<FichaDeContato['interesse']> {
  const p = v.pessoas[id];
  const r = rngDe(v.id, 'interesse', id, Math.floor(v.t / 36));
  const i = p ? idadePessoa(v, p) : 30;
  if (i >= 55 && r.chance(0.5)) return 'sair';
  return r.weighted(['dinheiro', 'subir', 'sair', 'familia', 'vinganca', 'seguranca'] as const, k => ({ dinheiro: 3, subir: i < 35 ? 3 : 1, sair: 1, familia: i >= 30 ? 2 : 0.5, vinganca: 0.6, seguranca: 1.2 }[k]))!;
}

function aplicarFavor(v: Vida, id: string, f: FichaDeContato): void {
  const e = env(v)!;
  switch (f.papel) {
    case 'fornecedor': v.fatos['sub125_desconto'] = v.t; break;
    case 'informante': e.exposicao = clamp(e.exposicao - 5); break;
    case 'chefe': { const o = f.organizacao ? orgPorId(v, f.organizacao) : undefined; if (o) o.lealdade = clamp(o.lealdade + 5); break; }
    case 'comprador': { const s = e.especializacoes?.contrabando; if (s && (s.estoque ?? 0) > 0) { const valor = Math.round(s.estoque! * 1.02 / 100) * 100; s.ganhos += Math.max(0, valor - s.estoque!); e.ganhos += Math.max(0, valor - s.estoque!); s.estoque = 0; movimentoPorFora(v, 'ocasional', valor); } else v.fatos['sub125_apoio'] = v.t; break; }
    default: v.fatos['sub125_apoio'] = v.t;
  }
  void id;
}

function efeitoDoFavor(papel: PapelDoContato): string {
  switch (papel) {
    case 'fornecedor': return 'O próximo lote sai mais barato.';
    case 'informante': return 'Alguém passa a olhar por você: a exposição baixa um pouco.';
    case 'chefe': return 'Lá dentro, falam melhor de você.';
    case 'comprador': return 'O que estava guardado saiu.';
    default: return 'No próximo trabalho deste ano, você não está sozinho (a chance sobe).';
  }
}

/* ---------------------------------------------------------------- o ano da rede */

/**
 * As pessoas do caminho vivem: a amizade esfria sem conversa, o interesse muda, quem envelhece quer sair, alguém muda de
 * organização, alguém é preso; a dívida antiga vira cobrança (a cena `sub125_cobra`).
 */
export function processarRede(v: Vida): void {
  const e = env(v);
  if (!e?.fichas) return;
  const r = rngDe(v.id, 'rede_sub', v.t);
  for (const [id, f] of Object.entries(e.fichas)) {
    const p = v.pessoas[id];
    if (!p?.vivo || f.afastado !== undefined || f.traiu !== undefined) continue;
    if (f.amizade !== undefined && f.tAcoes?.conversar !== v.t - 12) f.amizade = clamp(f.amizade - 2);
    if (f.interesse === undefined || r.chance(0.25)) f.interesse = interesseDe(v, id);
    const i = idadePessoa(v, p);
    // Quem envelhece e quer sair, sai (sem briga).
    if (f.interesse === 'sair' && (i >= 60 || r.chance(0.08))) {
      afastar(v, id, i >= 60 ? 'disse que estava velho para isso' : 'decidiu ir para o outro lado da vida');
      historiaDoContato(v, id, 'Saiu do meio.');
      continue;
    }
    // Uma prisão de quem está em volta (o caminho é o mesmo para todos).
    if (r.chance(0.025 + e.exposicao / 4000)) {
      f.afastado = v.t;
      historiaDoContato(v, id, 'Foi preso.', 'ruim');
      anotar(v, `${p.nome} foi preso. Ninguém sabe ainda o que ele vai dizer.`, 'ruim');
      if (r.chance(0.2 + Math.max(0, 50 - f.confianca) / 200)) { e.exposicao = clamp(e.exposicao + 8); anotar(v, `${p.nome}, preso, falou de você.`, 'ruim'); }
      continue;
    }
    // A mudança de organização (o contato vai para outra — e leva o que sabe).
    if (f.organizacao && r.chance(0.035)) {
      const outra = (e.organizacoes ?? []).find(o => o.id !== f.organizacao && o.especialidade === f.especialidade);
      const antes = orgPorId(v, f.organizacao);
      if (outra && antes) {
        f.organizacao = outra.id;
        historiaDoContato(v, id, `Trocou ${antes.nome} por ${outra.nome}.`);
        anotar(v, `${p.nome} trocou ${antes.nome} por ${outra.nome}.`);
        if (antes.relacao === 'membro' && antes.saiu === undefined) { v.fatos['sub125_mudou_org'] = v.t; (e.cenas125 ??= {})['sub125_mudou_org'] = id; }
      }
    }
  }
  // Um parceiro antigo reaparece (quem se afastou sem trair, há anos, e de quem se gostava).
  if (!(v.fatos['sub125_reaparece'] !== undefined && v.t - v.fatos['sub125_reaparece'] < 48) && !v.justica?.prisao) {
    const antigo = Object.entries(e.fichas).find(([id, f]) => f.afastado !== undefined && f.traiu === undefined && v.t - f.afastado >= 36 && v.pessoas[id]?.vivo && (f.amizade ?? 30) >= 25);
    if (antigo && r.chance(0.15)) { v.fatos['sub125_reaparece'] = v.t; (e.cenas125 ??= {})['sub125_reaparece'] = antigo[0]; }
  }
  // A dívida velha é cobrada (uma por ano).
  if (ativo(v) && !(v.fatos['sub125_cobra'] !== undefined && v.t - v.fatos['sub125_cobra'] < 24)) {
    const devedor = contatosAtivos(v).find(c => (c.f.favores ?? 0) <= -2);
    if (devedor && r.chance(0.5)) { v.fatos['sub125_cobra'] = v.t; (e.cenas125 ??= {})['sub125_cobra'] = devedor.id; }
  }
}

export { cap as capitalizar };
