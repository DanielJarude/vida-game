/**
 * REWORK 11.5 · REL-20 — o pedido de casamento como cena: primeiro ONDE (em casa, num jantar, em público), depois COM
 * QUE ANEL (ou sem). Quem recebe o pedido tem o seu jeito: a pessoa reservada prefere a casa; a expansiva gosta do
 * gesto em público; a cuidadosa com dinheiro estranha o anel caro. O que combina soma na resposta — que continua sendo
 * a mesma conta do pedido (`interacoes.responderAoPedido`): o envolvimento, a tensão, quem não quer casar.
 */
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { disponivel, pagar } from '../sistemas/dinheiro';
import { responderAoPedido } from '../sistemas/interacoes';
import { estaNoivo } from '../sistemas/romance';
import { local } from './efeitos';
import { clamp } from '../rng';
import { escrever, lembrarCom } from '../nucleo';
import { desfazerTrio, trioDe } from '../sistemas/afetosAdultos';
import { terminar } from '../sistemas/romance';
import { dinheiroCurto as fmt } from '../texto';

const LUGARES = ['casa', 'jantar', 'publico'] as const;
const lugarDe = (c: Ctx) => LUGARES[(c.v.fatos['pedido_lugar'] ?? 0) - 1];
const etapa = (c: Ctx) => (c.v.fatos['pedido_lugar'] === undefined ? 0 : 1);
const quem = (c: Ctx) => c.p.pessoa;
const ANEL = { simples: 1500, classico: 6000, caro: 25000 } as const;
const preco = (c: Ctx, a: keyof typeof ANEL) => local(c, ANEL[a]);

/** O quanto o lugar combina com quem recebe o pedido (e a frase que ela diria depois). */
function combinaLugar(p: Pessoa, lugar: typeof LUGARES[number]): number {
  const ex = p.temperamento.extroversao;
  if (lugar === 'publico') return ex > 0.2 ? 0.08 : ex < -0.2 ? -0.12 : -0.02;
  if (lugar === 'casa') return ex < 0 ? 0.06 : 0;
  return 0.03;
}
function combinaAnel(p: Pessoa, anel: keyof typeof ANEL | 'nenhum'): number {
  const cuidadosa = p.temperamento.responsabilidade > 0.3;
  if (anel === 'nenhum') return p.temperamento.abertura > 0.3 ? 0 : -0.04;
  if (anel === 'caro') return cuidadosa ? -0.02 : 0.06;
  return anel === 'classico' ? 0.05 : 0.02;
}

const papelDoPedido = Object.assign((v: Vida): Pessoa[] => Object.values(v.vinculos).filter(x => x.romance && ['namoro', 'morando_junto'].includes(x.romance.estagio) && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]), { fixo: true });

function responder(c: Ctx, anel: keyof typeof ANEL | 'nenhum') {
  const p = quem(c);
  const vin = c.v.vinculos[p.id];
  const lugar = lugarDe(c) ?? 'jantar';
  if (anel !== 'nenhum') pagar(c.v, preco(c, anel));
  delete c.v.fatos['pedido_lugar'];
  delete c.v.fatos['pedido_cena'];
  const detalhe = anel === 'nenhum' ? ', sem anel — só a pergunta' : `, com um anel ${anel === 'simples' ? 'simples' : anel === 'classico' ? 'clássico' : 'caro'}`;
  const res = responderAoPedido(c.v, c.r, p, vin, combinaLugar(p, lugar) + combinaAnel(p, anel), detalhe);
  if (estaNoivo(c.v, vin) && vin.romance?.noivado) { vin.romance.noivado.anel = anel; vin.romance.noivado.lugar = lugar; }
  const comoFoi = lugar === 'casa' ? 'Em casa, sem plateia' : lugar === 'publico' ? 'Na frente de todo mundo' : 'Num jantar';
  return { texto: `${comoFoi}${detalhe}. ${res.resultado ?? ''}`.trim(), memoria: null };
}

/** O filho da dúvida de hoje (papel fixo). */
const duvida = Object.assign((v: Vida): Pessoa[] => Object.values(v.pessoas).filter(p => p.vivo && v.fatos[`paternidade_duvida:${p.id}`] === v.t && !!p.reconhecidoPor), { fixo: true });

export const RELACOES_115: Conteudo[] = [
  {
    id: 'rel115_pedido', tipo: 'decisao', idade: [18, 99], tema: 'amor', manual: true, repetir: 0,
    papeis: { pessoa: papelDoPedido },
    quando: c => c.v.fatos['pedido_cena'] === c.v.t && !!quem(c),
    titulo: c => (etapa(c) === 0 ? `O pedido a ${quem(c).nome}` : 'O anel'),
    texto: c => etapa(c) === 0
      ? `Você vai pedir ${quem(c).nome} em casamento. ${quem(c).temperamento.extroversao > 0.2 ? `${quem(c).nome} adora uma cena.` : quem(c).temperamento.extroversao < -0.2 ? `${quem(c).nome} é de pouca plateia.` : `${quem(c).nome} não é de extremos.`} Onde?`
      : `${lugarDe(c) === 'casa' ? 'Em casa' : lugarDe(c) === 'publico' ? 'Em público' : 'No jantar'}. E o anel? (Você tem ${fmt(disponivel(c.v))} ao alcance.)`,
    opcoes: [
      ...LUGARES.map((l, k) => ({
        id: l, texto: l === 'casa' ? 'Em casa, só os dois' : l === 'jantar' ? 'Num jantar especial' : 'Em público, com gente em volta',
        disponivel: (c: Ctx) => (etapa(c) === 0 ? true : false),
        resolver: (c: Ctx) => ({ texto: 'O lugar está escolhido.', memoria: null, reabrir: true, efeito: () => { c.v.fatos['pedido_lugar'] = k + 1; } })
      })),
      ...(['simples', 'classico', 'caro'] as const).map(a => ({
        id: `anel_${a}`, texto: (c: Ctx) => `Com um anel ${a === 'simples' ? 'simples' : a === 'classico' ? 'clássico' : 'caro'} (${fmt(preco(c, a))})`,
        disponivel: (c: Ctx) => (etapa(c) === 0 ? false : disponivel(c.v) >= preco(c, a) ? true : 'O dinheiro não chega.'),
        consequencia: (c: Ctx) => (a === 'caro' && quem(c).temperamento.responsabilidade > 0.3 ? `${quem(c).nome} cuida muito do dinheiro: pode estranhar.` : undefined),
        resolver: (c: Ctx) => responder(c, a)
      })),
      { id: 'sem_anel', texto: 'Sem anel — só a pergunta', disponivel: (c: Ctx) => (etapa(c) === 0 ? false : true), resolver: (c: Ctx) => responder(c, 'nenhum') }
    ]
  },
  /* --------------------------------------------------- REWORK 11.5 · REL-21: a dúvida sobre a origem de um filho */
  {
    id: 'rel115_paternidade', tipo: 'decisao', idade: [18, 99], tema: 'amor', prioritario: true, prioridade: 6, repetir: 2,
    papeis: { filho: duvida, parceria: Object.assign((v: Vida): Pessoa[] => duvida(v).map(f => v.pessoas[f.reconhecidoPor!]).filter(p => p?.vivo), { fixo: true }) },
    quando: c => c.v.fatos['paternidade_duvida'] === c.v.t,
    titulo: c => `${c.p.parceria.nome} desconfia`,
    texto: c => `${c.p.parceria.nome} olhou para ${c.p.filho.nome} por tempo demais e perguntou, baixo: "É meu${c.p.filho.genero === 'feminino' ? 'a' : ''}?" ${c.v.fatos[`caso_descoberto:${c.p.filho.genitores?.find(x => x !== 'eu')}`] !== undefined ? 'Desde que o caso veio à tona, a pergunta estava no ar.' : 'Ninguém contou nada — mas a dúvida chegou.'}`,
    opcoes: [
      { id: 'contar', texto: 'Contar a verdade', comportamento: { coragem: 2 }, consequencia: () => 'A confiança despenca; a mentira acaba aqui.',
        resolver: c => ({ texto: 'Você contou. O silêncio que veio depois foi o mais longo da relação.', memoria: `Contou a ${c.p.parceria.nome} quem é o pai de ${c.p.filho.nome}.`.replace('o pai', c.v.eu.genero === 'masculino' ? 'a mãe' : 'o pai'), relevancia: 'marco', tom: 'ruim',
          efeito: () => revelar(c, 40) }) },
      { id: 'exame', texto: 'Propor um exame', comportamento: { coragem: 1 }, consequencia: () => 'O exame diz a verdade — e você não precisou dizer.',
        resolver: c => ({ texto: 'O exame confirmou o que você já sabia. Pelo menos não foi uma mentira a mais.', memoria: `O exame mostrou a ${c.p.parceria.nome} a verdade sobre ${c.p.filho.nome}.`, relevancia: 'marco', tom: 'ruim', efeito: () => revelar(c, 28) }) },
      { id: 'negar', texto: 'Dizer que é claro que sim', comportamento: { empatia: -1 }, consequencia: () => 'A dúvida não some; se voltar, volta maior.',
        resolver: c => ({ texto: `"Claro que é." ${c.p.parceria.nome} quis acreditar.`, memoria: null, efeito: () => { c.v.fatos[`negou_paternidade_${c.p.filho.id}`] = c.v.t; const vin = c.v.vinculos[c.p.parceria.id]; if (vin) { vin.confianca = clamp(vin.confianca - 8); vin.tensao = clamp(vin.tensao + 10); } } }) }
    ]
  }
];

RELACOES_115.push({
  id: 'rel115_trio_crise', tipo: 'decisao', idade: [18, 99], tema: 'amor', prioritario: true, prioridade: 5, repetir: 2,
  quando: c => c.v.fatos['trio_crise'] === c.v.t && !!trioDe(c.v),
  titulo: () => 'O trio em crise',
  texto: c => { const t = trioDe(c.v)!; const A = c.v.pessoas[t.a], B = c.v.pessoas[t.b]; return `${A.nome} e ${B.nome} quase não se falam mais. ${t.ciumes >= 30 ? 'Os ciúmes viraram o assunto da casa.' : 'O que os unia esfriou.'} Do jeito que está, não fica.`; },
  opcoes: [
    { id: 'tentar', texto: 'Tentar de novo, os três (com regras novas)', comportamento: { empatia: 1 },
      resolver: c => ({ texto: 'Os três sentaram e reescreveram o combinado. Ninguém saiu prometendo que vai dar certo.', memoria: null, efeito: () => { const t = trioDe(c.v)!; t.harmonia += 18; t.ciumes = Math.max(0, t.ciumes - 20); } }) },
    { id: 'dois', texto: 'Desfazer o trio e manter os dois vínculos', resolver: c => ({ texto: 'O trio acabou. Cada vínculo segue sozinho — como era antes.', memoria: null, efeito: () => desfazerTrio(c.v, 'a crise mostrou que os dois não se queriam mais') }) },
    { id: 'principal', texto: c => `Ficar com ${c.v.pessoas[trioDe(c.v)!.a].nome}`, comportamento: { disciplina: 1 },
      resolver: c => { const t = trioDe(c.v)!; const B = c.v.pessoas[t.b]; return { texto: `Você escolheu ${c.v.pessoas[t.a].nome}. ${B.nome} foi embora sem bater a porta.`, memoria: `Escolheu ${c.v.pessoas[t.a].nome}, e o trio acabou.`, relevancia: 'marco', tom: 'ruim', efeito: () => { desfazerTrio(c.v, `você escolheu ${c.v.pessoas[t.a].nome}`); terminar(c.v, B, c.v.vinculos[B.id], 'jogador'); } }; } },
    { id: 'segundo', texto: c => `Ficar com ${c.v.pessoas[trioDe(c.v)!.b].nome}`, comportamento: { independencia: 1 },
      resolver: c => { const t = trioDe(c.v)!; const A = c.v.pessoas[t.a]; return { texto: `Você escolheu ${c.v.pessoas[t.b].nome}. Com ${A.nome}, acabou.`, memoria: `Escolheu ${c.v.pessoas[t.b].nome}, e o trio acabou.`, relevancia: 'marco', tom: 'ruim', efeito: () => { desfazerTrio(c.v, `você escolheu ${c.v.pessoas[t.b].nome}`); terminar(c.v, A, c.v.vinculos[A.id], 'jogador'); } }; } }
  ]
});


/** A verdade dita (ou mostrada): quem reconhece passa a saber; a confiança e a tensão pagam o preço. */
function revelar(c: Ctx, peso: number): void {
  const f = c.p.filho, par = c.p.parceria;
  (f.origemSabida ??= []).push(par.id);
  const vin = c.v.vinculos[par.id];
  if (vin) { vin.confianca = clamp(vin.confianca - peso); vin.tensao = clamp(vin.tensao + peso + 5); }
  lembrarCom(c.v, par.id, `Soube que ${f.nome} não é filh${f.genero === 'feminino' ? 'a' : 'o'} biológic${f.genero === 'feminino' ? 'a' : 'o'} ${par.genero === 'feminino' ? 'dela' : 'dele'}.`, 'conflito', 3);
  escrever(c.v, { texto: `${par.nome} soube a verdade sobre ${f.nome}.`, relevancia: 'marco', tema: 'amor', tom: 'ruim', pessoas: [par.id, f.id] });
}
