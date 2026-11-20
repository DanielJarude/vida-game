/**
 * REWORK 10 — os acontecimentos novos: o jogo que virou assunto (JOG-01) e, na Fase F, a vida em mais situações (EVT-01),
 * com respostas que mudam coisas diferentes (EVT-02) e consequências que voltam anos depois.
 *
 * Disparados por estado ou sorteados pelo contexto (idade, lugar, o que a pessoa faz, quem está na vida dela). Nenhuma
 * opção existe só para enfeitar: cada uma muda alguma coisa que as outras não mudam.
 */

import type { Conteudo, Ctx } from './base';
import { estresse, feliz } from './efeitos';
import { clamp } from '../rng';
import { filhos, idadePessoa, lembrarCom, moraCom, parceiro } from '../nucleo';
import { autoexcluir, limitar, balancoDasApostas } from '../sistemas/apostas';
import { rendaPropriaMensal } from '../sistemas/dinheiro';
import { dinheiro as fmt } from '../texto';

const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] === c.v.t;
/** O atrito com a parceria (quem divide a vida e o extrato). */
const comPar = (c: Ctx, n: number) => { const par = parceiro(c.v); if (par) par.vin.tensao = clamp(par.vin.tensao + n); };

export const POSSIBILIDADES: Conteudo[] = [
  /* ------------------------------------------------------------- JOG-01: o jogo virou assunto */
  {
    id: 'apo_conversa', tipo: 'decisao', idade: [18, 99], tema: 'dinheiro', prioritario: true, prioridade: 3, repetir: 2,
    quando: c => deHoje(c, 'apo_conversa') && !!c.v.apostas,
    titulo: 'O que o jogo está levando',
    texto: c => {
      const b = balancoDasApostas(c.v);
      const par = parceiro(c.v);
      return `Dois anos seguidos perdendo mais do que a renda aguenta. ${b.frase} ${par ? `${par.p.nome} viu o extrato e perguntou, sem levantar a voz, o que estava acontecendo.` : 'O extrato do mês perguntou sozinho.'}`;
    },
    opcoes: [
      { id: 'excluir', texto: 'Pedir a autoexclusão: dois anos sem apostar', comportamento: { disciplina: 2 },
        consequencia: () => 'As apostas ficam fechadas para você por dois anos.',
        resolver: c => ({ texto: 'Você assinou o pedido. Fechar a porta foi mais fácil do que ficar olhando para ela.', memoria: 'Pediu a autoexclusão das apostas.', relevancia: 'biografia', efeito: () => { autoexcluir(c.v, 2); feliz(c, 3); estresse(c, -6); comPar(c, -10); const par = parceiro(c.v); if (par) lembrarCom(c.v, par.p.id, 'Você parou com as apostas.', 'reconciliacao', 2); } }) },
      { id: 'limite', texto: c => `Pôr um limite: no máximo ${fmt(Math.round(Math.max(rendaPropriaMensal(c.v), 1000) * 0.5))} de perda por ano`, comportamento: { disciplina: 1 },
        consequencia: () => 'Joga quem quer — até o limite. Passou dele, a mesa fecha até o ano que vem.',
        resolver: c => ({ texto: 'Um número escrito, um limite combinado consigo mesmo. A primeira vez que ele chegar vai ser o teste.', memoria: null, efeito: () => limitar(c.v, Math.round(Math.max(rendaPropriaMensal(c.v), 1000) * 0.5)) }) },
      { id: 'ajuda', texto: 'Procurar ajuda (um grupo de apoio, terapia)', comportamento: { empatia: 1, disciplina: 1 },
        consequencia: () => 'Toma tempo da semana; a cabeça agradece.',
        resolver: c => ({ texto: 'Uma sala com cadeiras em círculo e gente contando a mesma história com outros números. Você voltou na semana seguinte.', memoria: 'Procurou ajuda por causa das apostas.', relevancia: 'biografia', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'terapia')) c.v.rotinas.push({ id: 'terapia', tInicio: c.v.t, nivel: 1 }); autoexcluir(c.v, 1); estresse(c, -4); } }) },
      { id: 'continuar', texto: 'Dizer que está sob controle', comportamento: { impulsividade: 1 },
        consequencia: () => 'Nada muda — inclusive o extrato.',
        resolver: c => ({ texto: 'Você disse que estava tudo sob controle. A pergunta voltou a ser feita, de outros jeitos.', memoria: null, efeito: () => { comPar(c, 12); estresse(c, 4); } }) }
    ]
  },

  /* ------------------------------------------------------------- VIDA 29: os degraus do jogo na família */
  {
    id: 'apo_notou29', tipo: 'decisao', idade: [18, 99], tema: 'dinheiro', prioritario: true, prioridade: 2, repetir: 1,
    quando: c => deHoje(c, 'apo_notou29') && !!c.v.apostas,
    titulo: 'Alguém em casa reparou',
    texto: c => {
      const par = parceiro(c.v);
      const quem = par?.p ?? moraCom(c.v).find(p => !p.especie);
      return `${quem ? `${quem.nome} reparou` : 'Reparam'} nas notificações do aplicativo de apostas e no extrato do mês. Não foi uma briga: foi uma pergunta, no jantar, sobre quanto tem ido para o jogo.`;
    },
    opcoes: [
      { id: 'contar', texto: 'Contar quanto foi, sem diminuir', comportamento: { empatia: 1 },
        consequencia: () => 'A conversa fica desconfortável hoje e mais fácil depois.',
        resolver: c => ({ texto: 'Você mostrou o número. Houve um silêncio, depois um "obrigado por contar".', memoria: null, efeito: () => { comPar(c, -3); estresse(c, 2); } }) },
      { id: 'limite', texto: c => `Combinar um limite junto: ${fmt(Math.round(Math.max(rendaPropriaMensal(c.v), 1000) * 0.3))} por ano`, comportamento: { disciplina: 1 },
        consequencia: () => 'O limite vale para todo jogo; passou dele, a mesa fecha até o ano que vem.',
        resolver: c => ({ texto: 'O limite ficou escrito na porta da geladeira, meio de brincadeira, meio a sério.', memoria: null, efeito: () => { limitar(c.v, Math.round(Math.max(rendaPropriaMensal(c.v), 1000) * 0.3)); comPar(c, -4); } }) },
      { id: 'esconder', texto: 'Dizer que foi pouco e desligar as notificações', comportamento: { impulsividade: 1 },
        consequencia: () => 'O assunto sai da mesa; a desconfiança, não.',
        resolver: c => ({ texto: 'A pergunta morreu ali. A confiança ficou com um risquinho que você não vê.', memoria: null, efeito: () => { comPar(c, 6); c.v.fatos['apo_escondeu29'] = c.v.t; } }) }
    ]
  },
  {
    id: 'apo_contas29', tipo: 'decisao', idade: [18, 99], tema: 'dinheiro', prioritario: true, prioridade: 4, repetir: 3,
    quando: c => deHoje(c, 'apo_contas29') && !!c.v.apostas,
    titulo: 'O dinheiro das contas',
    texto: c => {
      const par = parceiro(c.v);
      const escondeu = c.v.fatos['apo_escondeu29'] !== undefined;
      return `A conta foi para o vermelho num ano em que o jogo levou mais do que devia — e a parcela atrasou. ${par ? `${par.p.nome} descobriu pelo banco${escondeu ? ', depois de ouvir que era pouco' : ''}.` : 'Em casa, todo mundo sentiu no mês.'} Não é mais um assunto seu: é da casa.`;
    },
    opcoes: [
      { id: 'excluir', texto: 'Autoexclusão por dois anos e o cartão com a família', comportamento: { disciplina: 2 },
        consequencia: () => 'As apostas fecham para você; o dinheiro passa a ter duas chaves.',
        resolver: c => ({ texto: 'Você entregou o cartão e pediu a autoexclusão. Doeu menos do que o extrato.', memoria: 'Entregou o cartão à família e pediu a autoexclusão das apostas.', relevancia: 'biografia', efeito: () => { autoexcluir(c.v, 2); comPar(c, -8); estresse(c, -3); } }) },
      { id: 'ajuda', texto: 'Pedir ajuda: grupo de apoio e terapia', comportamento: { empatia: 1, disciplina: 1 },
        consequencia: () => 'Toma tempo e dinheiro da semana; é o caminho que mais dura.',
        resolver: c => ({ texto: 'Na primeira reunião, alguém contou a sua história com outro nome. Você voltou.', memoria: 'Procurou ajuda por causa das apostas.', relevancia: 'biografia', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'terapia')) c.v.rotinas.push({ id: 'terapia', tInicio: c.v.t, nivel: 1 }); autoexcluir(c.v, 1); comPar(c, -6); estresse(c, -4); } }) },
      { id: 'recuperar', texto: 'Apostar mais para recuperar', comportamento: { impulsividade: 2 },
        consequencia: () => 'É assim que o buraco aumenta: quem corre atrás do prejuízo costuma achar mais prejuízo.',
        resolver: c => ({ texto: 'Você prometeu que era a última, para cobrir o mês. A casa não acreditou — e tinha razão para isso.', memoria: null, efeito: () => { comPar(c, 15); estresse(c, 8); for (const p of moraCom(c.v)) { const vin = c.v.vinculos[p.id]; if (vin && !p.especie) vin.tensao = clamp(vin.tensao + 6); } const e = c.v.apostas; if (e) e.anosPesados = (e.anosPesados ?? 0) + 1; } }) }
    ]
  },
  {
    id: 'apo_ultimato29', tipo: 'decisao', idade: [18, 99], tema: 'dinheiro', prioritario: true, prioridade: 5, repetir: 2,
    quando: c => deHoje(c, 'apo_ultimato29') && !!c.v.apostas,
    titulo: 'Três anos de jogo pesado',
    texto: c => {
      const par = parceiro(c.v);
      const fs = filhos(c.v).filter(f => idadePessoa(c.v, f) >= 18);
      return `${par ? `${par.p.nome} pôs na mesa: ou o jogo, ou a vida juntos.` : 'Ninguém mais pergunta: as pessoas só se afastam.'}${fs.length ? ` ${fs[0].nome} ligou menos este ano, e quando ligou não perguntou de dinheiro — perguntou se você estava bem.` : ''}`;
    },
    opcoes: [
      { id: 'tratar', texto: 'Tratamento de verdade e autoexclusão por três anos', comportamento: { disciplina: 2, empatia: 1 },
        consequencia: () => 'Fecha a porta, abre a terapia; a família volta devagar.',
        resolver: c => ({ texto: 'Você começou o tratamento. A primeira semana sem aposta foi a mais longa do ano.', memoria: 'Começou um tratamento para parar de apostar.', relevancia: 'biografia', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'terapia')) c.v.rotinas.push({ id: 'terapia', tInicio: c.v.t, nivel: 1 }); autoexcluir(c.v, 3); comPar(c, -15); const par = parceiro(c.v); if (par) lembrarCom(c.v, par.p.id, 'Você começou a se tratar das apostas.', 'reconciliacao', 2); for (const f of filhos(c.v)) { const vin = c.v.vinculos[f.id]; if (vin) vin.proximidade = clamp(vin.proximidade + 4); } } }) },
      { id: 'negar', texto: 'Dizer que não tem problema nenhum', comportamento: { impulsividade: 1 },
        consequencia: () => 'A parceria pode não aguentar.',
        resolver: c => ({ texto: 'Você negou. A porta do quarto ficou fechada naquela noite — e em outras.', memoria: null, efeito: () => { comPar(c, 25); estresse(c, 6); const par = parceiro(c.v); if (par) lembrarCom(c.v, par.p.id, 'Você negou o problema com o jogo.', 'conflito', 2); } }) }
    ]
  }
];
