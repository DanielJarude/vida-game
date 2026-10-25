/**
 * REWORK 12.2 — os acontecimentos dos negócios vivos e do Submundo novo: a crítica dura ao restaurante, o chef
 * cobiçado, a doação ao museu, o sócio do negócio por fora que quer mais, o funcionário que desconfia da fachada.
 * Regras da casa: `quando` sem sorteio (o estado decide se cabe), nenhuma resposta cosmética (cada opção muda o estado
 * da empresa, do negócio ou da relação), e a fila do ano decide quando a decisão abre.
 */

import type { Conteudo } from './base';
import type { Empresa, NegocioClandestino, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { conversao, custoLocal, empresasAtivas } from '../sistemas/empresas';
import { notaDoRestaurante } from '../sistemas/setores';
import { TEMAS_MUSEU } from '../dados/setores';
import { negociosAtivos, decidirClandestino } from '../sistemas/clandestinos';
import { lembrarOrg, orgPorId } from '../sistemas/submundo';

/** O custo de uma correção na moeda da vida (os preços são os da cidade da empresa). */
const correcao = (v: Vida, e: Empresa) => Math.round(60000 * custoLocal(e.municipioId) * conversao(v, e) / 1000) * 1000;
const manda = (e: Empresa) => e.papel !== 'investidor' && e.estado === 'operando';
const restauranteMalAvaliado = (v: Vida) => empresasAtivas(v).find(e => manda(e) && e.setor?.restaurante && (e.setor.restaurante.nota ?? notaDoRestaurante(e)) < 3.1);
const chefCobicado = (v: Vida) => empresasAtivas(v).find(e => manda(e) && e.setor?.restaurante?.chef && e.setor.restaurante.chef.talento >= 70 && e.setor.restaurante.prestigio >= 35 && v.t - e.setor.restaurante.chef.t >= 24);
const museuRespeitado = (v: Vida) => empresasAtivas(v).find(e => manda(e) && e.setor?.museu && e.reputacao >= 55);
const socioQueCobra = (v: Vida): { n: NegocioClandestino; id: string } | undefined => {
  const env = v.caminhos.envolvimento;
  for (const n of negociosAtivos(v)) for (const s of n.socios) { const f = env?.fichas?.[s.pessoaId]; if (f && f.confianca < 45 && f.traiu === undefined && v.pessoas[s.pessoaId]?.vivo && n.reputacao >= 35) return { n, id: s.pessoaId }; }
  return undefined;
};
const fachadaDesconfiada = (v: Vida) => empresasAtivas(v).find(e => e.fachada && e.fachada.tFim === undefined && e.fachada.suspeita >= 30);

export const ACONTECIMENTOS_122: Conteudo[] = [
  {
    // A crítica que viralizou: o restaurante que entrega menos do que cobra ouve isso em público.
    id: 'neg122_critica', tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 3, peso: 3,
    quando: c => !!restauranteMalAvaliado(c.v),
    titulo: c => `${restauranteMalAvaliado(c.v)!.nome} na boca do povo`,
    texto: c => { const e = restauranteMalAvaliado(c.v)!; const ult = e.setor!.restaurante!.avaliacoes?.slice(-1)[0]; return `Uma avaliação dura de ${e.nome} correu as redes${ult ? `: ${ult.texto}` : ''}. Outras vieram atrás. A casa ainda enche no sábado — por enquanto.`; },
    opcoes: [
      { id: 'corrigir', texto: 'Responder com educação e corrigir o que é verdade', comportamento: { disciplina: 1 },
        consequencia: c => `Treino, reparos e uma semana de portas abertas a quem reclamou (uns ${fmt(correcao(c.v, restauranteMalAvaliado(c.v)!))}).`,
        resolver: c => { const e = restauranteMalAvaliado(c.v)!; const x = e.setor!.restaurante!; x.atendimento = clamp(x.atendimento + 15); x.ambiente = clamp(x.ambiente + 8); e.caixa -= correcao(c.v, e); e.reputacao = clamp(e.reputacao + 3); return { texto: 'Respondeu um por um, chamou quem reclamou para voltar, trocou o que não funcionava. Parte do público deu outra chance.', memoria: `Respondeu às críticas de ${e.nome} — e corrigiu.`, relevancia: 'cotidiano' }; } },
      { id: 'rebater', texto: 'Rebater o crítico em público', comportamento: { impulsividade: 1 },
        consequencia: () => 'Mais gente fica sabendo da casa; nem toda a atenção é boa.',
        resolver: c => { const e = restauranteMalAvaliado(c.v)!; e.reputacao = clamp(e.reputacao - 6); e.setor!.divulgacao = clamp((e.setor!.divulgacao ?? 20) + 25); return { texto: 'A resposta virou outro assunto: metade aplaudiu, metade riu. O nome da casa circulou — com a briga junto.', memoria: `Brigou em público com um crítico de ${e.nome}.`, relevancia: 'cotidiano', tom: 'ruim' }; } },
      { id: 'ignorar', texto: 'Deixar passar', consequencia: () => 'Sem custo agora; o prestígio sente.',
        resolver: c => { const e = restauranteMalAvaliado(c.v)!; e.setor!.restaurante!.prestigio = clamp(e.setor!.restaurante!.prestigio - 4); return { texto: 'Deixou passar. A conversa esfriou — e uns clientes não voltaram.', memoria: null }; } }
    ]
  },
  {
    // O chef bom é cobiçado: um concorrente oferece o dobro.
    id: 'neg122_chef', tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => !!chefCobicado(c.v),
    titulo: 'Querem levar o seu chef',
    texto: c => { const e = chefCobicado(c.v)!; const ch = e.setor!.restaurante!.chef!; return `${ch.nome} recebeu uma proposta de um restaurante maior: salário bem acima, cozinha nova, o nome na porta. Veio conversar antes de responder.`; },
    opcoes: [
      { id: 'cobrir', texto: 'Cobrir a proposta (e dar sociedade nos pratos)', consequencia: c => { const ch = chefCobicado(c.v)!.setor!.restaurante!.chef!; return `O salário sobe uns 35% (de ${fmt(ch.salario)} na base).`; },
        resolver: c => { const e = chefCobicado(c.v)!; const ch = e.setor!.restaurante!.chef!; ch.salario = Math.round(ch.salario * 1.35 / 100) * 100; ch.t = c.v.t; return { texto: `${ch.nome} ficou. A folha pesou; a cozinha continua sendo o motivo de quem volta.`, memoria: `Segurou ${ch.nome} na cozinha de ${e.nome}.`, relevancia: 'cotidiano' }; } },
      { id: 'liberar', texto: 'Desejar boa sorte', comportamento: { independencia: 1 },
        consequencia: () => 'Sem chef, a cozinha cai — até achar outro.',
        resolver: c => { const e = chefCobicado(c.v)!; const ch = e.setor!.restaurante!.chef!; delete e.setor!.restaurante!.chef; e.setor!.restaurante!.prestigio = clamp(e.setor!.restaurante!.prestigio - 10); (e.historia ??= []).push({ t: c.v.t, texto: `${ch.nome} saiu para a concorrência.` }); return { texto: `${ch.nome} foi embora com um abraço — e levou dois cozinheiros junto. A cozinha vai precisar de um nome novo.`, memoria: `Perdeu ${ch.nome} para a concorrência.`, relevancia: 'biografia', tom: 'ruim' }; } }
    ]
  },
  {
    // A doação ao museu: uma família quer deixar uma obra — com a condição de que fique exposta (e o restauro é seu).
    id: 'neg122_doacao', tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => !!museuRespeitado(c.v),
    titulo: 'Uma família quer doar uma obra',
    texto: c => { const e = museuRespeitado(c.v)!; const r = rngDe(c.v.id, e.id, 'doacao', anoDe(c.v.t)); const t = r.pick(TEMAS_MUSEU); return `Os herdeiros de um colecionador querem doar a ${e.nome} ${r.pick(t.obras)} (${t.nome.toLowerCase()}). A condição: ficar exposta, com o nome da família. A peça precisa de restauro.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar (e pagar o restauro)', consequencia: () => 'O acervo cresce; o restauro e a parede são seus.',
        resolver: c => { const e = museuRespeitado(c.v)!; const r = rngDe(c.v.id, e.id, 'doacao', anoDe(c.v.t)); const t = r.pick(TEMAS_MUSEU); const nome = r.pick(t.obras); e.setor!.museu!.obras.push({ id: `${e.id}-doa${c.v.t}`, nome, tema: t.id, periodo: r.pick(t.periodos), valor: Math.round(e.ativos * 0.04 / 1000) * 1000, conservacao: 45, exposta: true, autenticidade: 'presumida', origem: 'doacao' }); e.caixa -= Math.round(e.ativos * 0.004 / 1000) * 1000; e.reputacao = clamp(e.reputacao + 3); (e.historia ??= []).push({ t: c.v.t, texto: `Recebeu em doação ${nome}.` }); return { texto: `${nome.charAt(0).toUpperCase() + nome.slice(1)} entrou no acervo, com a placa da família. O restauro começou.`, memoria: `${e.nome} recebeu uma doação importante.`, relevancia: 'cotidiano', tom: 'bom' }; } },
      { id: 'recusar', texto: 'Recusar: a parede não está à venda', comportamento: { independencia: 1 },
        resolver: () => ({ texto: 'Recusou com cuidado. A família levou a obra para outro museu — e o assunto, para outras rodas.', memoria: null }) }
    ]
  },
  {
    // O sócio do negócio por fora quer mais: a confiança baixa vira cobrança.
    id: 'neg122_socio', tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 2, peso: 3,
    quando: c => !!socioQueCobra(c.v) && !c.v.justica?.prisao,
    titulo: 'O sócio quer uma parte maior',
    texto: c => { const s = socioQueCobra(c.v)!; return `${c.v.pessoas[s.id].nome} apareceu sem avisar: "eu corro o risco, eu quero mais". Quer uma parte maior de ${s.n.nome} — e deixou claro que sabe muito sobre ele.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Dar uma parte maior', consequencia: () => 'Menos para você, mais calma — por enquanto.',
        resolver: c => { const s = socioQueCobra(c.v)!; const sc = s.n.socios.find(x => x.pessoaId === s.id)!; sc.parte = Math.min(0.5, sc.parte + 0.15); const f = c.v.caminhos.envolvimento!.fichas![s.id]; f.confianca = clamp(f.confianca + 18); f.cumpridas++; s.n.historia.push({ t: c.v.t, texto: `${c.v.pessoas[s.id].nome} passou a ficar com ${Math.round(sc.parte * 100)}%.` }); return { texto: `${c.v.pessoas[s.id].nome} saiu satisfeito. A conta ficou mais curta; o silêncio, mais firme.`, memoria: null }; } },
      { id: 'recusar', texto: 'Recusar', comportamento: { independencia: 1 }, consequencia: () => 'Quem se sente passado para trás pode sair com o caixa — ou falar.',
        resolver: c => { const s = socioQueCobra(c.v)!; const f = c.v.caminhos.envolvimento!.fichas![s.id]; f.confianca = clamp(f.confianca - 15); f.quebradas++; const o = f.organizacao ? orgPorId(c.v, f.organizacao) : undefined; if (o) lembrarOrg(o, c.v.t, 'conflito', -6); return { texto: `${c.v.pessoas[s.id].nome} foi embora sem dizer nada. Esse silêncio pesa mais do que uma ameaça.`, memoria: null, tom: 'ruim' }; } },
      { id: 'romper', texto: 'Romper a sociedade agora', consequencia: () => 'Acaba a cobrança; começa a inimizade.',
        resolver: c => { const s = socioQueCobra(c.v)!; const t = decidirClandestino(c.v, 'romper_socio', s.n.id, s.id); return { texto: t, memoria: null, tom: 'ruim' }; } }
    ]
  },
  {
    // A fachada: alguém de dentro percebeu que as contas não batem.
    id: 'neg122_fachada', tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 2, peso: 4, prioritario: true, prioridade: 4,
    quando: c => !!fachadaDesconfiada(c.v) && !c.v.justica?.prisao,
    titulo: c => `Em ${fachadaDesconfiada(c.v)!.nome}, perguntas`,
    texto: c => { const e = fachadaDesconfiada(c.v)!; return `A gerente financeira de ${e.nome} pediu uma conversa: notas que não fecham, movimento que não bate com o caixa. "Eu não vou assinar o que eu não entendo."`; },
    opcoes: [
      { id: 'desligar', texto: 'Desligar a empresa do negócio por fora', comportamento: { disciplina: 1 },
        consequencia: () => 'A empresa para de carregar o risco; o que já foi feito ainda pode aparecer.',
        resolver: c => { const e = fachadaDesconfiada(c.v)!; const n = negociosAtivos(c.v).find(x => x.fachadaId === e.id); const t = n ? decidirClandestino(c.v, 'desligar_fachada', n.id) : 'A empresa já não carregava nada.'; return { texto: `${t} A gerente ficou — desconfiada, mas ficou.`, memoria: `Tirou ${e.nome} do que não devia.`, relevancia: 'biografia' }; } },
      { id: 'demitir', texto: 'Demitir a gerente', comportamento: { impulsividade: 1 },
        consequencia: () => 'Quem sai sabendo de algo pode contar a alguém.',
        resolver: c => { const e = fachadaDesconfiada(c.v)!; e.fachada!.suspeita = clamp(e.fachada!.suspeita + 12); e.reputacao = clamp(e.reputacao - 4); const env = c.v.caminhos.envolvimento; if (env) env.exposicao = clamp(env.exposicao + 6); (e.historia ??= []).push({ t: c.v.t, texto: 'A gerente financeira foi demitida depois de fazer perguntas.' }); return { texto: 'A gerente saiu com a caixa de papelão e um olhar que você não esqueceu. Os outros viram.', memoria: null, tom: 'ruim' }; } },
      { id: 'contornar', texto: 'Dizer que vai ver e não mudar nada', consequencia: () => 'A desconfiança cresce em silêncio.',
        resolver: c => { const e = fachadaDesconfiada(c.v)!; e.fachada!.suspeita = clamp(e.fachada!.suspeita + 6); return { texto: 'Prometeu olhar. Não olhou. A conversa da gerente com o contador ficou mais longa.', memoria: null }; } }
    ]
  }
];
