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
import { lembrarCom, parceiro } from '../nucleo';
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
  }
];
