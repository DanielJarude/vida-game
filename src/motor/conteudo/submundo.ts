/**
 * REWORK 11.5 · SUB-16 — as cenas de cada ramo do Submundo e as que voltam (encadeadas): o parceiro, o serviço grande,
 * o mercado que virou, a conta da apreensão, a disputa e a subida no grupo, a encomenda grande, o apelido exposto, o
 * pedido de quem tem cargo, a ameaça de denúncia, a promessa cobrada, a reconciliação, a dívida que ficou.
 *
 * Disparadas por `sistemas/submundo.processarSubmundo` (um fato de hoje e a pessoa da cena). Cada ramo tem a sua família
 * de id (`subf_`, `subc_`, `subo_`, `subd_`, `subx_`): quem atua em várias frentes pode viver mais de uma cena no ano
 * (a fila do ano decide quantas cabem). Nenhuma opção descreve como se faz coisa alguma.
 */
import type { Conteudo, Ctx, Papel } from './base';
import type { Pessoa, Vida } from '../tipos';
import { estresse, feliz } from './efeitos';
import { parceiro } from '../nucleo';
import { clamp } from '../rng';
import { dinheiroCurto as fmt } from '../texto';
import { disponivel, pagar } from '../sistemas/dinheiro';
import { parar } from '../sistemas/ilicito';
import { machucarNaBriga } from '../sistemas/lesoes';
import { abalar } from '../sistemas/abalo';
import { afastar, anotar, contatosAtivos, criarContato, lembrarOrg, orgPorId, POSTO, promessa, valorDaOperacao } from '../sistemas/submundo';
import { ramosAtivos } from '../sistemas/ramos';

const deHoje = (c: Ctx, id: string) => c.v.fatos[id] === c.v.t;
const env = (c: Ctx) => c.v.caminhos.envolvimento!;
const e = env;
const ativo = (c: Ctx) => !!c.v.caminhos.envolvimento && c.v.caminhos.envolvimento.parou === undefined && !c.v.justica?.prisao;
const noRamo = (c: Ctx, r: Parameters<typeof valorDaOperacao>[1]) => ativo(c) && ramosAtivos(env(c)).includes(r);
const esp = (c: Ctx, r: Parameters<typeof valorDaOperacao>[1]) => env(c).especializacoes![r]!;
const org = (c: Ctx, id: string) => { const o = c.v.caminhos.envolvimento?.cenasOrg?.[id]; return o ? orgPorId(c.v, o) : undefined; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ganhar = (c: Ctx, x: number, ramo?: Parameters<typeof valorDaOperacao>[1]) => { const liq = Math.round(x * 0.7 / 100) * 100; c.v.financas.conta += liq; env(c).ganhos += x; if (ramo) esp(c, ramo).ganhos += x; return liq; };

/** A pessoa da cena de hoje (a que `processarSubmundo` escolheu) — papel fixo, não gasta o gerador do ano. */
const daCena = (id: string): Papel => Object.assign((v: Vida): Pessoa[] => { const p = v.caminhos.envolvimento?.cenas?.[id]; return p && v.pessoas[p]?.vivo ? [v.pessoas[p]] : []; }, { fixo: true });
const quem = (c: Ctx) => c.p.contato;

export const SUBMUNDO: Conteudo[] = [
  /* ------------------------------------------------------------- furtos e roubos: o parceiro */
  {
    id: 'subf_parceiro', tipo: 'decisao', idade: [14, 80], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('subf_parceiro') },
    quando: c => deHoje(c, 'subf_parceiro') && noRamo(c, 'furtos'),
    titulo: c => (deHoje(c, 'subf_pego') ? `${quem(c).nome} foi pego` : `${quem(c).nome} quer trazer mais gente`),
    texto: c => deHoje(c, 'subf_pego')
      ? `Depois do serviço que deu errado, ${quem(c).nome} não conseguiu sair a tempo. Está detido, e sabe o seu nome. O que você faz agora ele vai lembrar.`
      : `${quem(c).nome}, o seu parceiro, quer trazer um conhecido "de confiança" para os próximos serviços. Mais gente, mais dinheiro — e mais gente sabendo.`,
    opcoes: [
      { id: 'ajudar', texto: c => (deHoje(c, 'subf_pego') ? 'Pagar a defesa dele' : 'Topar o conhecido'), comportamento: { empatia: 1 },
        disponivel: c => (!deHoje(c, 'subf_pego') || disponivel(c.v) >= valorDaOperacao(c.v, 'furtos', 1.5) ? true : 'Não há dinheiro para isso agora.'),
        consequencia: c => (deHoje(c, 'subf_pego') ? `Uns ${fmt(valorDaOperacao(c.v, 'furtos', 1.5))}; ele vai lembrar de quem não o deixou sozinho.` : 'Mais gente no caminho (e mais gente sabendo).'),
        resolver: c => ({ texto: deHoje(c, 'subf_pego') ? `O advogado foi pago. ${quem(c).nome} mandou dizer que não esquece.` : `O conhecido chegou. Os serviços ficaram maiores — e a roda, também.`, memoria: null,
          efeito: () => { promessa(c.v, quem(c).id, true); if (deHoje(c, 'subf_pego')) pagar(c.v, valorDaOperacao(c.v, 'furtos', 1.5)); else { criarContato(c.v, 'furtos', 'parceiro', 1); env(c).exposicao = clamp(env(c).exposicao + 5); } anotar(c.v, deHoje(c, 'subf_pego') ? `Pagou a defesa de ${quem(c).nome}.` : `Topou trazer mais gente para os serviços.`); } }) },
      { id: 'cortar', texto: c => (deHoje(c, 'subf_pego') ? 'Sumir e cortar o contato' : 'Recusar: quanto menos gente, melhor'), comportamento: { disciplina: 1 },
        consequencia: c => (deHoje(c, 'subf_pego') ? 'Menos ligação com o caso — e um parceiro que pode falar.' : 'O parceiro não gosta de ouvir não.'),
        resolver: c => ({ texto: deHoje(c, 'subf_pego') ? 'Você trocou de número e não apareceu mais. O silêncio do outro lado não dura para sempre.' : 'Você disse que não. Ele ficou de cara fechada.', memoria: null,
          efeito: () => { const f = env(c).fichas?.[quem(c).id]; if (deHoje(c, 'subf_pego')) { promessa(c.v, quem(c).id, false); afastar(c.v, quem(c).id, 'você sumiu quando ele foi pego'); env(c).exposicao = clamp(env(c).exposicao - 4 + (c.r.chance(0.35) ? 18 : 0)); } else if (f) f.confianca = clamp(f.confianca - 8); } }) },
      { id: 'parar', texto: 'Largar isso de vez', comportamento: { disciplina: 2 },
        resolver: c => ({ texto: 'Foi o aviso que faltava. Você saiu.', memoria: null, efeito: () => parar(c.v, deHoje(c, 'subf_pego') ? 'o parceiro foi pego' : 'não quis mais gente no caminho') }) }
    ]
  },
  /* ------------------------------------------------------------- furtos e roubos: a escala */
  {
    id: 'subf_escala', tipo: 'decisao', idade: [16, 75], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 2,
    papeis: { contato: daCena('subf_escala') },
    quando: c => deHoje(c, 'subf_escala') && noRamo(c, 'furtos'),
    titulo: 'Um serviço maior do que tudo',
    texto: c => `${quem(c).nome} apareceu com uma coisa muito maior do que vocês costumam fazer. Dinheiro de muitos meses — e, se der errado, o tipo de erro que não se apaga. ${esp(c, 'furtos').experiencia >= 60 ? 'O seu nome no meio é a razão de terem chamado você.' : 'É a chance de o meio passar a levar você a sério.'}`,
    opcoes: [
      { id: 'topar', texto: 'Topar', comportamento: { coragem: 1, impulsividade: 1 },
        consequencia: c => `Uns ${fmt(valorDaOperacao(c.v, 'furtos', 3))} a ${fmt(valorDaOperacao(c.v, 'furtos', 6))}; o risco é alto.`,
        resolver: c => {
          const falha = c.r.chance(clamp(0.38 - esp(c, 'furtos').experiencia / 300, 0.15, 0.4));
          return { texto: falha ? 'Deu errado, e feio. Você saiu de lá sem nada, com o coração na boca.' : 'Deu certo. Por um tempo, o dinheiro não é problema — e o seu nome corre.', memoria: falha ? 'Um serviço grande que deu errado.' : 'Fez um serviço grande.', relevancia: 'marco', tom: 'ruim',
            efeito: () => { const s = esp(c, 'furtos'); s.operacoes++; e(c).trabalhos = (e(c).trabalhos ?? 0) + 1; if (falha) { s.falhas++; e(c).exposicao = clamp(e(c).exposicao + 22); if (c.r.chance(0.45)) machucarNaBriga(c.v, c.r, 2); anotar(c.v, 'O serviço grande deu errado.', 'ruim'); } else { const l = ganhar(c, c.r.int(valorDaOperacao(c.v, 'furtos', 3), valorDaOperacao(c.v, 'furtos', 6)), 'furtos'); s.nome = clamp(s.nome + 12); e(c).exposicao = clamp(e(c).exposicao + 12); promessa(c.v, quem(c).id, true); anotar(c.v, `O serviço grande deu certo: ${fmt(l)}.`, 'bom'); } } };
        } },
      { id: 'parte', texto: 'Topar só com uma parte maior', comportamento: { coragem: 1 },
        resolver: c => { const aceitam = c.r.chance(clamp(0.25 + esp(c, 'furtos').nome / 150, 0.2, 0.75)); return { texto: aceitam ? 'Aceitaram a sua parte — e passaram a lembrar de você como quem cobra caro.' : 'Não aceitaram, e chamaram outro.', memoria: null, efeito: () => { if (aceitam) { const l = ganhar(c, valorDaOperacao(c.v, 'furtos', 4.5), 'furtos'); e(c).exposicao = clamp(e(c).exposicao + 14); anotar(c.v, `Fez o serviço grande, com a parte maior: ${fmt(l)}.`, 'bom'); } else { const f = e(c).fichas?.[quem(c).id]; if (f) f.confianca = clamp(f.confianca - 10); } } }; } },
      { id: 'recusar', texto: 'Recusar este', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você disse que esse não. O meio esfriou um pouco com você.', memoria: null, efeito: () => { esp(c, 'furtos').nome = clamp(esp(c, 'furtos').nome - 6); } }) }
    ]
  },
  /* ------------------------------------------------------------- contrabando: o mercado e a rival */
  {
    id: 'subc_mercado', tipo: 'decisao', idade: [18, 80], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('subc_mercado') },
    quando: c => deHoje(c, 'subc_mercado') && noRamo(c, 'contrabando') && !!org(c, 'subc_mercado'),
    titulo: c => `${cap(org(c, 'subc_mercado')!.nome)} quer conversar`,
    texto: c => {
      const o = org(c, 'subc_mercado')!;
      const m = esp(c, 'contrabando').mercado ?? 0;
      return `O mercado ${m >= 1 ? 'está aquecido, e todo mundo quer um pedaço' : m <= -1 ? 'está fraco: não tem comprador para todo mundo' : 'está como sempre, apertado'}. ${cap(o.nome)}, que disputa os mesmos compradores, mandou recado por ${quem(c).nome}: ou vocês dividem, ou vão continuar se esbarrando.${o.memoria.some(x => x.fato === 'conflito') ? ' Eles lembram das outras vezes.' : ''}`;
    },
    opcoes: [
      { id: 'alianca', texto: 'Fazer um acordo e dividir os compradores', comportamento: { empatia: 1 },
        consequencia: () => 'Menos briga e menos lucro por lote; a outra rede passa a ser aliada (e a cobrar o combinado).',
        resolver: c => ({ texto: 'Apertaram as mãos. Cada um no seu pedaço — por enquanto.', memoria: null, efeito: () => { const o = org(c, 'subc_mercado')!; o.relacao = 'aliada'; lembrarOrg(o, c.v.t, 'alianca', 25); const s = esp(c, 'contrabando'); s.mercado = Math.min(2, (s.mercado ?? 0) + 1); e(c).exposicao = clamp(e(c).exposicao - 4); anotar(c.v, `Fez um acordo com ${o.nome}.`, 'bom'); } }) },
      { id: 'brigar', texto: 'Baixar o preço e disputar os compradores', comportamento: { coragem: 1, impulsividade: 1 },
        consequencia: () => 'Pode render mais neste ano; a rivalidade fica — e rival lembra.',
        resolver: c => { const ganhou = c.r.chance(0.5); return { texto: ganhou ? 'Os compradores vieram para você. O recado seguinte não foi tão educado.' : 'Você baixou o preço e eles baixaram mais. Ano de prejuízo.', memoria: null, tom: ganhou ? 'bom' : 'ruim',
          efeito: () => { const o = org(c, 'subc_mercado')!; o.relacao = 'rival'; lembrarOrg(o, c.v.t, 'conflito', -15); if (ganhou) { const l = ganhar(c, valorDaOperacao(c.v, 'contrabando', 2), 'contrabando'); anotar(c.v, `Tomou compradores de ${o.nome}: ${fmt(l)}.`, 'bom'); } else { const perda = Math.min(disponivel(c.v), valorDaOperacao(c.v, 'contrabando', 1)); pagar(c.v, perda); anotar(c.v, `A guerra de preço com ${o.nome} deu prejuízo.`, 'ruim'); } e(c).exposicao = clamp(e(c).exposicao + 6); } }; } },
      { id: 'ignorar', texto: 'Ignorar o recado',
        resolver: c => ({ texto: 'Você não respondeu. O assunto ficou no ar.', memoria: null, efeito: () => { lembrarOrg(org(c, 'subc_mercado')!, c.v.t, 'conflito', -5); } }) }
    ]
  },
  /* ------------------------------------------------------------- contrabando: a conta da apreensão */
  {
    id: 'subc_apreensao', tipo: 'decisao', idade: [18, 80], tema: 'escolha', prioritario: true, prioridade: 4, repetir: 1,
    papeis: { contato: daCena('subc_apreensao') },
    quando: c => deHoje(c, 'subc_apreensao') && ativo(c) && (env(c).divida ?? 0) > 0,
    titulo: c => `${quem(c).nome} quer o dinheiro do lote`,
    texto: c => `A mercadoria apreendida tinha sido adiantada por ${quem(c).nome}, o seu fornecedor. Para ele, o prejuízo é seu: ${fmt(env(c).divida!)}.`,
    opcoes: [
      { id: 'pagar', texto: c => `Pagar agora (${fmt(env(c).divida!)})`, disponivel: c => (disponivel(c.v) >= env(c).divida! ? true : 'O que você tem não cobre.'),
        resolver: c => ({ texto: 'Você pagou. O fornecedor não disse obrigado — disse "até a próxima".', memoria: null, efeito: () => { pagar(c.v, env(c).divida!); env(c).divida = 0; promessa(c.v, quem(c).id, true); anotar(c.v, 'Pagou o lote apreendido ao fornecedor.'); } }) },
      { id: 'prazo', texto: 'Pedir prazo e prometer pagar',
        consequencia: () => 'A dívida fica — e a promessa também (ele vai cobrar).',
        resolver: c => ({ texto: '"Um ano." Ele aceitou o prazo. A palavra agora é o que você tem.', memoria: null, efeito: () => { const f = env(c).fichas?.[quem(c).id]; if (f) f.espera = 'parte'; anotar(c.v, `Prometeu pagar ${fmt(env(c).divida!)} a ${quem(c).nome}.`); c.v.fatos[`sub_prazo_${quem(c).id}`] = c.v.t; } }) },
      { id: 'culpa', texto: 'Dizer que o comprador avisou a polícia', comportamento: { empatia: -1 },
        consequencia: () => 'Pode livrar você da conta — ou queimar duas pessoas de uma vez.',
        resolver: c => { const colou = c.r.chance(0.4); return { texto: colou ? 'Ele acreditou. A conta foi para outro — e você sabe que não era dele.' : 'Ele não acreditou. Agora, além da dívida, há a mentira.', memoria: null, tom: 'ruim',
          efeito: () => { const comp = contatosAtivos(c.v, 'contrabando', 'comprador')[0]; if (colou) { env(c).divida = 0; if (comp) afastar(c.v, comp.id, 'levou a culpa de uma apreensão'); } else promessa(c.v, quem(c).id, false); } }; } }
    ]
  },
  /* ------------------------------------------------------------- crime organizado: a disputa interna */
  {
    id: 'subo_disputa', tipo: 'decisao', idade: [16, 80], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('subo_disputa') },
    quando: c => deHoje(c, 'subo_disputa') && noRamo(c, 'organizado') && !!org(c, 'subo_disputa'),
    titulo: c => `Uma disputa dentro de ${org(c, 'subo_disputa')!.nome}`,
    texto: c => `Dentro de ${org(c, 'subo_disputa')!.nome}, alguém quer o lugar de quem manda. ${quem(c).nome} veio perguntar de que lado você fica. Você é ${POSTO[esp(c, 'organizado').posto ?? 1]}: o seu lado conta.`,
    opcoes: [
      { id: 'lealdade', texto: 'Ficar com quem manda', comportamento: { disciplina: 1 },
        consequencia: () => 'A organização lembra de quem foi leal; quem perdeu, de quem não ajudou.',
        resolver: c => ({ texto: 'Você ficou onde estava. A disputa passou — e quem manda reparou em quem não mudou de lado.', memoria: null, efeito: () => { const o = org(c, 'subo_disputa')!; lembrarOrg(o, c.v.t, 'alianca', 12); const f = env(c).fichas?.[quem(c).id]; if (f && f.papel !== 'chefe') f.confianca = clamp(f.confianca - 12); anotar(c.v, `Ficou com quem manda em ${o.nome}.`); } }) },
      { id: 'mudar', texto: 'Apostar em quem quer o lugar', comportamento: { coragem: 1, impulsividade: 1 },
        consequencia: () => 'Se ganhar, você sobe junto. Se perder, cai junto.',
        resolver: c => { const ganhou = c.r.chance(0.42); return { texto: ganhou ? 'Quem você apoiou ganhou. Você subiu junto.' : 'Quem você apoiou perdeu. Agora há gente que não confia mais em você — de nenhum lado.', memoria: ganhou ? 'Ficou do lado que venceu uma disputa no grupo.' : 'Ficou do lado errado numa disputa do grupo.', relevancia: 'biografia', tom: ganhou ? 'bom' : 'ruim',
          efeito: () => { const o = org(c, 'subo_disputa')!; const s = esp(c, 'organizado'); if (ganhou) { s.posto = Math.min(4, (s.posto ?? 1) + 1) as 1 | 2 | 3 | 4; lembrarOrg(o, c.v.t, 'alianca', 10); promessa(c.v, quem(c).id, true); } else { lembrarOrg(o, c.v.t, 'traicao', -30); for (const x of contatosAtivos(c.v, 'organizado', 'chefe')) x.f.confianca = clamp(x.f.confianca - 25); estresse(c, 8); } } }; } },
      { id: 'neutro', texto: 'Não se meter',
        resolver: c => ({ texto: 'Você ficou de fora. Ninguém agradeceu, ninguém cobrou — por enquanto.', memoria: null, efeito: () => lembrarOrg(org(c, 'subo_disputa')!, c.v.t, 'conflito', -4) }) },
      { id: 'sair', texto: 'Aproveitar a confusão para sair', comportamento: { disciplina: 1, coragem: 1 },
        resolver: c => { const deixam = c.r.chance(0.55); return { texto: deixam ? 'No meio da confusão, ninguém teve tempo de segurar você. Você saiu.' : 'Você saiu — e a disputa terminou com os dois lados achando que você traiu.', memoria: null, tom: deixam ? 'bom' : 'ruim',
          efeito: () => { const o = org(c, 'subo_disputa')!; o.saiu = c.v.t; lembrarOrg(o, c.v.t, deixam ? 'saida' : 'traicao', deixam ? -5 : -30); esp(c, 'organizado').largou = c.v.t; if (!deixam) c.v.fatos['pressao_grupo'] = c.v.t; if (!ramosAtivos(env(c)).length) parar(c.v, `saiu de ${o.nome} no meio de uma disputa`); } }; } }
    ]
  },
  /* ------------------------------------------------------------- crime organizado: subir */
  {
    id: 'subo_promocao', tipo: 'decisao', idade: [18, 80], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('subo_promocao') },
    quando: c => deHoje(c, 'subo_promocao') && noRamo(c, 'organizado') && !!org(c, 'subo_promocao') && (esp(c, 'organizado').posto ?? 1) < 4,
    titulo: c => `${cap(org(c, 'subo_promocao')!.nome)} quer você mais perto`,
    texto: c => `${quem(c).nome} disse, sem rodeio: querem você como ${POSTO[Math.min(4, (esp(c, 'organizado').posto ?? 1) + 1) as 1 | 2 | 3 | 4]}. Mais dinheiro e mais gente dependendo de você. E, quando algo cai, cai primeiro em quem está mais perto do topo.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { coragem: 1 },
        consequencia: () => 'Mais renda e mais poder; mais exposição — e sair fica mais difícil.',
        resolver: c => ({ texto: 'Você aceitou. Agora há quem espere ordens suas.', memoria: 'Subiu dentro do grupo criminoso.', relevancia: 'marco', tom: 'ruim', efeito: () => { const s = esp(c, 'organizado'); s.posto = Math.min(4, (s.posto ?? 1) + 1) as 1 | 2 | 3 | 4; e(c).exposicao = clamp(e(c).exposicao + 8); e(c).reputacao = clamp((e(c).reputacao ?? 0) + 8); lembrarOrg(org(c, 'subo_promocao')!, c.v.t, 'alianca', 8); if (s.posto === 4) criarContato(c.v, 'organizado', 'protegido', 2); anotar(c.v, `Passou a ser ${POSTO[s.posto]}.`, 'bom'); } }) },
      { id: 'recusar', texto: 'Recusar e ficar onde está', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: '"Ainda não." Aceitaram — e anotaram.', memoria: null, efeito: () => lembrarOrg(org(c, 'subo_promocao')!, c.v.t, 'conflito', -5) }) }
    ]
  },
  /* ------------------------------------------------------------- crimes digitais: a encomenda grande */
  {
    id: 'subd_encomenda', tipo: 'decisao', idade: [16, 75], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('subd_encomenda') },
    quando: c => deHoje(c, 'subd_encomenda') && noRamo(c, 'digital'),
    titulo: 'Uma encomenda grande',
    texto: c => `${quem(c).nome} tem uma encomenda maior do que as de sempre, de alguém que paga bem e não diz o nome. Se der certo, é muito dinheiro; se der errado, o rastro aparece de uma vez.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar sozinho', comportamento: { coragem: 1, impulsividade: 1 },
        consequencia: c => `Até uns ${fmt(valorDaOperacao(c.v, 'digital', 6))}; se der errado, muita gente sabendo de uma vez.`,
        resolver: c => { const falha = c.r.chance(clamp(0.4 - esp(c, 'digital').experiencia / 250, 0.15, 0.4)); return { texto: falha ? 'Deu errado — e o rastro ficou. Agora é esperar para saber quem viu.' : 'Entregue. O dinheiro caiu, e o seu apelido subiu no meio.', memoria: null, tom: falha ? 'ruim' : 'bom',
          efeito: () => { const s = esp(c, 'digital'); s.operacoes++; if (falha) { s.falhas++; e(c).exposicao = clamp(e(c).exposicao + 28); anotar(c.v, 'A encomenda grande deixou rastro.', 'ruim'); abalar(c.v, 'o rastro', -5, 10); } else { const l = ganhar(c, c.r.int(valorDaOperacao(c.v, 'digital', 1.5), valorDaOperacao(c.v, 'digital', 6)), 'digital'); s.nome = clamp(s.nome + 10); e(c).exposicao = clamp(e(c).exposicao + 4); anotar(c.v, `A encomenda grande rendeu ${fmt(l)}.`, 'bom'); } } }; } },
      { id: 'dividir', texto: 'Aceitar e dividir com quem trouxe',
        consequencia: () => 'Metade do dinheiro; metade do risco.',
        resolver: c => { const falha = c.r.chance(clamp(0.24 - esp(c, 'digital').experiencia / 300, 0.08, 0.25)); return { texto: falha ? 'Deu errado mesmo assim. Pelo menos não foi só com você.' : 'Entregue, dividido. Menos dinheiro, mais sono.', memoria: null,
          efeito: () => { const s = esp(c, 'digital'); s.operacoes++; promessa(c.v, quem(c).id, true); if (falha) { s.falhas++; e(c).exposicao = clamp(e(c).exposicao + 12); } else { ganhar(c, valorDaOperacao(c.v, 'digital', 2), 'digital'); e(c).exposicao = clamp(e(c).exposicao + 2); } } }; } },
      { id: 'recusar', texto: 'Recusar',
        resolver: c => ({ texto: 'Você disse que não. Encomenda não falta — quem traz é que some.', memoria: null, efeito: () => { const f = env(c).fichas?.[quem(c).id]; if (f) f.confianca = clamp(f.confianca - 6); } }) }
    ]
  },
  /* ------------------------------------------------------------- crimes digitais: exposto */
  {
    id: 'subd_exposto', tipo: 'decisao', idade: [16, 75], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 2,
    quando: c => deHoje(c, 'subd_exposto') && noRamo(c, 'digital'),
    titulo: 'O seu apelido apareceu',
    texto: () => 'Alguém juntou as pontas: o apelido que você usa no meio apareceu ligado a coisas que você fez. Ainda não ligaram ao seu nome de verdade.',
    opcoes: [
      { id: 'sumir', texto: 'Sumir de vez desse apelido', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'O apelido morreu ali. O que se construiu com ele, também.', memoria: null, efeito: () => { const s = esp(c, 'digital'); s.nome = clamp(s.nome - 20); e(c).exposicao = clamp(e(c).exposicao - 12); anotar(c.v, 'Abandonou o apelido que tinha no meio digital.'); } }) },
      { id: 'seguir', texto: 'Seguir como se nada fosse', comportamento: { impulsividade: 1 },
        consequencia: () => 'O nome que você tem no meio fica; a exposição sobe.',
        resolver: c => ({ texto: 'Você seguiu. Até agora, ninguém bateu na porta.', memoria: null, efeito: () => { e(c).exposicao = clamp(e(c).exposicao + 14); } }) },
      { id: 'entregar', texto: 'Desviar a atenção para outra pessoa do meio', comportamento: { empatia: -1 },
        consequencia: () => 'A atenção vai para outro — e o meio fica sabendo de quem entrega.',
        resolver: c => ({ texto: 'A atenção mudou de alvo. No meio, a história de quem fez isso correu rápido.', memoria: null, tom: 'ruim', efeito: () => { e(c).exposicao = clamp(e(c).exposicao - 8); for (const x of contatosAtivos(c.v, 'digital')) x.f.confianca = clamp(x.f.confianca - 20); anotar(c.v, 'Desviou a atenção para outra pessoa do meio.', 'ruim'); } }) }
    ]
  },
  /* ------------------------------------------------------------- fraudes e corrupção: o conflito de interesse */
  {
    id: 'subx_conflito', tipo: 'decisao', idade: [18, 85], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('subx_conflito') },
    quando: c => deHoje(c, 'subx_conflito') && noRamo(c, 'fraudes'),
    titulo: c => `Um pedido de ${quem(c).nome}`,
    texto: c => `${quem(c).nome} pediu "uma ajuda" que passa pelo seu ${c.v.caminhos.politica?.mandato ? 'mandato' : 'cargo'}: uma decisão que favorece quem já pagou por ela. ${c.v.caminhos.politica?.mandato ? 'Se vazar, é o seu nome no jornal e o apoio indo embora.' : 'Se vazar, é o seu emprego e o seu patrimônio.'}`,
    opcoes: [
      { id: 'aceitar', texto: 'Fazer o que pediram', comportamento: { empatia: -1 },
        consequencia: c => `Uns ${fmt(valorDaOperacao(c.v, 'fraudes', 3))}, e um favor a mais devido a quem lembra.`,
        resolver: c => { const vazou = c.r.chance(0.18 + e(c).exposicao / 400); return { texto: vazou ? 'Fez — e vazou. Já há quem pergunte.' : 'Fez. O dinheiro chegou por um caminho que não leva até você. Por enquanto.', memoria: null, tom: 'ruim',
          efeito: () => { const s = esp(c, 'fraudes'); s.operacoes++; ganhar(c, valorDaOperacao(c.v, 'fraudes', 3), 'fraudes'); e(c).exposicao = clamp(e(c).exposicao + (vazou ? 18 : 6)); if (vazou) { s.falhas++; if (c.v.caminhos.politica?.mandato) c.v.caminhos.politica.apoio = clamp(c.v.caminhos.politica.apoio - 8); } promessa(c.v, quem(c).id, true); anotar(c.v, vazou ? 'Um favor de cargo vazou.' : 'Fez um favor de cargo por dinheiro.', vazou ? 'ruim' : undefined); } }; } },
      { id: 'recusar', texto: 'Recusar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você disse que não podia. Do outro lado, um "entendo" que não entendia nada.', memoria: null, efeito: () => { promessa(c.v, quem(c).id, false); e(c).exposicao = clamp(e(c).exposicao - 3); } }) },
      { id: 'denunciar', texto: 'Recusar e levar o pedido a quem fiscaliza', comportamento: { coragem: 2 },
        consequencia: () => 'Você sai do esquema com o seu lado da história registrado; quem pediu não esquece.',
        resolver: c => ({ texto: 'Você levou o pedido a quem fiscaliza. A sua parte no que veio antes também vai ser perguntada — mas quem chega primeiro conta a história.', memoria: 'Denunciou um pedido de corrupção.', relevancia: 'marco',
          efeito: () => { const s = esp(c, 'fraudes'); s.largou = c.v.t; afastar(c.v, quem(c).id, 'você o denunciou'); e(c).exposicao = clamp(e(c).exposicao - 15); c.v.fatos['denunciou_esquema'] = c.v.t; if (!ramosAtivos(env(c)).length) parar(c.v, 'denunciou um pedido de corrupção'); } }) }
    ]
  },
  /* ------------------------------------------------------------- fraudes e corrupção: a ameaça */
  {
    id: 'subx_denuncia', tipo: 'decisao', idade: [18, 85], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 2,
    papeis: { contato: daCena('subx_denuncia') },
    quando: c => deHoje(c, 'subx_denuncia') && noRamo(c, 'fraudes'),
    titulo: c => `${quem(c).nome} ameaça contar`,
    texto: c => `${quem(c).nome} sabe do que você participou e quer alguma coisa em troca do silêncio. ${parceiro(c.v) ? `${parceiro(c.v)!.p.nome} não sabe de nada disso.` : ''}`,
    opcoes: [
      { id: 'pagar', texto: c => `Pagar pelo silêncio (uns ${fmt(valorDaOperacao(c.v, 'fraudes', 2))})`, disponivel: c => (disponivel(c.v) >= valorDaOperacao(c.v, 'fraudes', 2) ? true : 'Não há dinheiro para isso.'),
        consequencia: () => 'Resolve agora; quem cobra uma vez costuma voltar.',
        resolver: c => ({ texto: 'Pagou. Ele sorriu do jeito de quem vai voltar.', memoria: null, efeito: () => { pagar(c.v, valorDaOperacao(c.v, 'fraudes', 2)); const f = env(c).fichas?.[quem(c).id]; if (f) { f.espera = 'discricao'; f.quebradas++; } } }) },
      { id: 'enfrentar', texto: 'Dizer que ele também cai junto', comportamento: { coragem: 1 },
        resolver: c => { const recua = c.r.chance(0.55); return { texto: recua ? 'Ele fez as contas e recuou.' : 'Ele não recuou. Contou.', memoria: null, tom: recua ? 'bom' : 'ruim', efeito: () => { if (!recua) { e(c).exposicao = clamp(e(c).exposicao + 25); const f = env(c).fichas?.[quem(c).id]; if (f) f.traiu = c.v.t; anotar(c.v, `${quem(c).nome} contou o que sabia.`, 'ruim'); } } }; } },
      { id: 'antes', texto: 'Contar você mesmo, antes dele', comportamento: { coragem: 2 },
        resolver: c => ({ texto: 'Você procurou quem investiga e contou primeiro. Ele perdeu a moeda de troca — e você, o esquema.', memoria: 'Contou o esquema às autoridades antes de ser denunciado.', relevancia: 'marco',
          efeito: () => { esp(c, 'fraudes').largou = c.v.t; e(c).exposicao = clamp(e(c).exposicao - 10); c.v.fatos['denunciou_esquema'] = c.v.t; if (!ramosAtivos(env(c)).length) parar(c.v, 'contou o esquema antes de ser denunciado'); } }) }
    ]
  },
  /* ------------------------------------------------------------- encadeada: a promessa cobrada */
  {
    id: 'sub_cobranca', tipo: 'decisao', idade: [14, 85], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('sub_cobranca') },
    quando: c => deHoje(c, 'sub_cobranca') && ativo(c) && (env(c).fichas?.[quem(c).id]?.quebradas ?? 0) > 0,
    titulo: c => `${quem(c).nome} veio cobrar`,
    texto: c => { const f = env(c).fichas![quem(c).id]; return `${quem(c).nome} não esqueceu: ${f.quebradas === 1 ? 'uma promessa' : `${f.quebradas} promessas`} que você não cumpriu. ${f.organizacao ? `E quem está com ele, também não.` : ''} A conversa é curta.`; },
    opcoes: [
      { id: 'acertar', texto: c => `Acertar o que devia (uns ${fmt(valorDaOperacao(c.v, env(c).fichas![quem(c).id].especialidade, 1))})`, disponivel: c => (disponivel(c.v) >= valorDaOperacao(c.v, env(c).fichas![quem(c).id].especialidade, 1) ? true : 'O que você tem não cobre.'),
        resolver: c => ({ texto: 'Você pagou o que devia e pediu desculpas do jeito que se pede ali. A confiança voltou um pouco.', memoria: null, efeito: () => { pagar(c.v, valorDaOperacao(c.v, env(c).fichas![quem(c).id].especialidade, 1)); const f = env(c).fichas![quem(c).id]; f.quebradas = Math.max(0, f.quebradas - 1); promessa(c.v, quem(c).id, true); anotar(c.v, `Acertou o que devia a ${quem(c).nome}.`, 'bom'); } }) },
      { id: 'palavra', texto: 'Dar a palavra de novo',
        consequencia: () => 'Ganha tempo. Se falhar de novo, ele não vai cobrar — vai contar.',
        resolver: c => ({ texto: 'Ele aceitou a sua palavra. Uma última vez, foi o que disse.', memoria: null, efeito: () => { const f = env(c).fichas![quem(c).id]; f.confianca = clamp(f.confianca - 5); c.v.fatos[`sub_ultima_${quem(c).id}`] = c.v.t; } }) },
      { id: 'ignorar', texto: 'Mandar ele procurar outro', comportamento: { impulsividade: 1 },
        resolver: c => { const fala = c.r.chance(0.45); return { texto: fala ? 'Ele foi embora — e foi contar a quem não devia.' : 'Ele foi embora. Você não sabe se isso é o fim.', memoria: null, tom: 'ruim', efeito: () => { if (fala) { const f = env(c).fichas![quem(c).id]; f.traiu = c.v.t; env(c).exposicao = clamp(env(c).exposicao + 15); env(c).traicoes = (env(c).traicoes ?? 0) + 1; anotar(c.v, `${quem(c).nome} falou o seu nome depois da cobrança.`, 'ruim'); } else afastar(c.v, quem(c).id, 'você não cumpriu o combinado'); } }; } }
    ]
  },
  /* ------------------------------------------------------------- encadeada: a reconciliação */
  {
    id: 'sub_reconciliacao', tipo: 'decisao', idade: [16, 85], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 3,
    quando: c => deHoje(c, 'sub_reconciliacao') && ativo(c) && !!org(c, 'sub_reconciliacao'),
    titulo: c => `${cap(org(c, 'sub_reconciliacao')!.nome)} quer fazer as pazes`,
    texto: c => { const o = org(c, 'sub_reconciliacao')!; const ult = o.memoria.filter(m => m.fato === 'conflito' || m.fato === 'promessa_quebrada' || m.fato === 'traicao').slice(-1)[0]; return `Faz tempo desde ${ult ? `o que aconteceu em ${Math.floor(ult.t / 12)}` : 'a última briga'}. ${cap(o.nome)} mandou dizer que o passado pode ficar no passado — se você também quiser.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar a paz', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'Um aperto de mão, um copo, ninguém tocou no assunto. A paz, ali, é isso.', memoria: null, efeito: () => { const o = org(c, 'sub_reconciliacao')!; lembrarOrg(o, c.v.t, 'reconciliacao', 20); if (o.relacao === 'rival') o.relacao = 'neutra'; anotar(c.v, `Fez as pazes com ${o.nome}.`, 'bom'); } }) },
      { id: 'recusar', texto: 'Recusar: o que foi feito, foi feito', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Você não aceitou. A rivalidade segue — agora, declarada.', memoria: null, efeito: () => { const o = org(c, 'sub_reconciliacao')!; o.relacao = 'rival'; lembrarOrg(o, c.v.t, 'conflito', -10); } }) }
    ]
  },
  /* ------------------------------------------------------------- depois de sair: a dívida que ficou */
  {
    id: 'sub_divida', tipo: 'decisao', idade: [14, 90], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { contato: daCena('sub_divida') },
    quando: c => deHoje(c, 'sub_divida') && !!c.v.caminhos.envolvimento && c.v.caminhos.envolvimento.parou !== undefined && (c.v.caminhos.envolvimento.divida ?? 0) > 0 && !c.v.justica?.prisao,
    titulo: 'A dívida que ficou',
    texto: c => `Você saiu, mas a dívida de ${fmt(env(c).divida!)} não saiu junto. ${quem(c).nome} lembrou disso.`,
    opcoes: [
      { id: 'pagar', texto: 'Pagar e fechar a porta', disponivel: c => (disponivel(c.v) >= env(c).divida! ? true : 'O que você tem não cobre.'),
        resolver: c => ({ texto: 'Pagou. Agora sim, não há nada pendente.', memoria: 'Pagou a dívida que tinha ficado do passado.', efeito: () => { pagar(c.v, env(c).divida!); env(c).divida = 0; feliz(c, 2); } }) },
      { id: 'parte', texto: 'Pagar uma parte e prometer o resto',
        resolver: c => ({ texto: 'Ele levou uma parte. O resto ficou na palavra.', memoria: null, efeito: () => { const x = Math.min(disponivel(c.v), Math.round(env(c).divida! / 2)); pagar(c.v, x); env(c).divida = Math.max(0, env(c).divida! - x); } }) },
      { id: 'ignorar', texto: 'Ignorar', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Você fingiu que não ouviu. A pressão voltou.', memoria: null, tom: 'ruim', efeito: () => { c.v.fatos['pressao_grupo'] = c.v.t; abalar(c.v, 'a dívida do passado', -5, 8); } }) }
    ]
  }
];


/** Para os testes e a contagem de conteúdo. */
export const IDS_DO_SUBMUNDO = SUBMUNDO.map(x => x.id);

