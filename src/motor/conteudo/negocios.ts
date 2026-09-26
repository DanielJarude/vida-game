/**
 * O negócio acontece: cada ofício tem os próprios dias bons e ruins.
 *
 *   Loja on-line: a plataforma muda o algoritmo, um vídeo viraliza, uma leva
 *   de devoluções, a Black Friday. Nunca freguês entrando pela porta.
 *   Porta aberta: o vizinho que abriu igual, o dono do ponto reajustando o
 *   aluguel, a vigilância sanitária, o cliente conhecido que elogiou.
 *   Oficina: a frota de uma transportadora, o carro que voltou.
 *   Salão: a noiva e a comitiva, a cliente que teve reação ao produto.
 *   Atendimento: o convênio que atrasa, a indicação da família inteira.
 *   Obra: a chuva que para tudo, o cliente que não paga a última medição.
 *
 * E o sócio: não é um campo — é uma pessoa, com vontade própria. Quer crescer
 * quando você quer segurar, quer tirar dinheiro quando o caixa aperta, um
 * dia quer sair. As reações são sempre do jogador.
 */

import type { Conteudo, Ctx, Resultado } from './base';
import type { Negocio } from '../tipos';
import { clamp } from '../rng';
import { escrever, idadePessoa, lembrarCom } from '../nucleo';
import { estresse } from './efeitos';
import { dinheiro as fmt } from '../texto';
import { disponivel, pagar } from '../sistemas/dinheiro';
import {
  abrirUnidade, ampliar, comprarParteDoSocio, dedicacaoDe, donoIntegral, estrategiaDe, fecharNegocio, mudarEstrategia, negocioAberto, pagarPeloCaixa,
  parteDoSocio, podeAbrirUnidade, podeAmpliar, precoDaParteDoSocio, presencaDe, reservaDoCaixa, tetoDoMovimento, tipoDoNegocio, valorDoNegocio, valorInteiro
} from '../sistemas/negocio';
import { encerrarEmprego } from '../sistemas/trabalho';
import { criarPessoa, vincular } from '../pessoas';
import { podeTentar } from '../plausibilidade';
import { marcar } from '../sistemas/marcas';

const neg = (c: Ctx) => negocioAberto(c.v)!;
const tipoDe = (c: Ctx) => tipoDoNegocio(neg(c))?.id ?? '';
const eh = (...tipos: string[]) => (c: Ctx) => !!negocioAberto(c.v) && tipos.includes(tipoDe(c));
const presente = (...p: string[]) => (c: Ctx) => !!negocioAberto(c.v) && p.includes(presencaDe(neg(c)));
const anos = (c: Ctx) => (c.v.t - neg(c).tInicio) / 12;

function mov(c: Ctx, x: number): void {
  const n = neg(c);
  n.clientela = Math.round(clamp(n.clientela + x, 0, tetoDoMovimento(n)));
  if (donoIntegral(c.v)) c.v.trabalho.atual!.clientela = n.clientela;
}
const rep = (c: Ctx, x: number) => { const n = neg(c); n.reputacao = clamp((n.reputacao ?? 40) + x); };
function caixa(c: Ctx, x: number): void {
  const n = neg(c);
  if (x >= 0) n.caixa = (n.caixa ?? 0) + x;
  else pagarPeloCaixa(c.v, n, -x);
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const valor = (c: Ctx, f: number) => Math.round(neg(c).capital * f / 100) * 100;

/* ------------------------------------------------------------------ Sócio */

const socio = (c: Ctx) => { const n = negocioAberto(c.v); return n?.socioId ? c.v.pessoas[n.socioId] : undefined; };
const temSocio = (c: Ctx) => { const s = socio(c); return !!s && s.vivo; };
function comSocio(c: Ctx, tensao: number, confianca = 0, prox = 0): void {
  const s = socio(c);
  const vin = s && c.v.vinculos[s.id];
  if (!vin) return;
  vin.tensao = clamp(vin.tensao + tensao);
  vin.confianca = clamp(vin.confianca + confianca);
  vin.proximidade = clamp(vin.proximidade + prox);
  vin.tUltimoContato = c.v.t;
}
const ele = (c: Ctx) => (socio(c)?.genero === 'feminino' ? 'ela' : 'ele');

/** O sócio sai, e alguém de fora compra a parte (um sócio novo, que você mal conhece). */
function socioDeFora(c: Ctx): void {
  const n = neg(c);
  const velho = socio(c);
  const novo = criarPessoa(c.v, c.r, { idade: c.r.int(35, 60), municipioId: c.v.moradia.municipioId, ocupacao: 'investidor', renda: 9000 });
  const vin = vincular(c.v, novo, { origem: 'trabalho', proximidade: 10, estagio: 'conhecido', convivio: ['trabalho'] });
  vin.ambiente = `negocio:${n.nome}:${n.tInicio}`;
  n.socioId = novo.id;
  if (velho && c.v.vinculos[velho.id]) { c.v.vinculos[velho.id].ambiente = undefined; c.v.vinculos[velho.id].convivio = c.v.vinculos[velho.id].convivio.filter(x => x !== 'trabalho'); }
  escrever(c.v, { texto: `${velho?.nome ?? 'O sócio'} vendeu a parte em ${n.nome} para ${novo.nome}, alguém de fora.`, relevancia: 'biografia', tema: 'trabalho', pessoas: [novo.id] });
}

export const NEGOCIOS_CONTEUDO: Conteudo[] = [
  {
    id: 'neg_comprar_parte', tipo: 'decisao', idade: [18, 95], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => `A parte de ${c.p.socio?.nome ?? 'o sócio'}`,
    texto: c => { const n = neg(c); return `${c.p.socio?.nome ?? 'O sócio'} tem ${Math.round(parteDoSocio(n) * 100)}% de ${n.nome}. Pelo que o negócio vale hoje (${fmt(valorInteiro(c.v, n))}), a parte sai por uns ${fmt(precoDaParteDoSocio(c.v, n))}.`; },
    opcoes: [
      { id: 'comprar', texto: 'Propor a compra', consequencia: c => `Sai ${fmt(precoDaParteDoSocio(c.v, neg(c)))} do seu dinheiro; o negócio fica todo seu — o lucro e o risco.`,
        disponivel: c => (disponivel(c.v) >= precoDaParteDoSocio(c.v, neg(c)) ? true : 'Não há esse dinheiro.'),
        resolver: c => {
          const vin = c.p.socio && c.v.vinculos[c.p.socio.id];
          const topa = c.r.chance(0.5 + ((vin?.tensao ?? 0) > 40 ? 0.3 : 0) + (idadePessoa(c.v, c.p.socio) >= 60 ? 0.2 : 0) - ((vin?.proximidade ?? 50) > 70 ? 0.1 : 0));
          if (!topa) return { texto: `${c.p.socio?.nome ?? 'O sócio'} ouviu, pensou e disse que ainda não quer sair. "Isso aqui também é meu."`, memoria: null, efeito: () => comSocio(c, 4) };
          return { texto: 'Um aperto de mão, um contador, uma assinatura. Agora é tudo seu.', memoria: null, tom: 'bom', efeito: () => { comprarParteDoSocio(c.v); } };
        } },
      { id: 'nao', texto: 'Deixar como está', resolver: () => ({ texto: 'Vocês seguem sócios.', memoria: null }) }
    ]
  },
  {
    id: 'negsoc_conversa', tipo: 'decisao', idade: [18, 95], tema: 'trabalho', manual: true, repetir: 0,
    titulo: c => `Uma conversa com ${c.p.socio?.nome ?? 'o sócio'}`,
    texto: c => {
      const n = neg(c);
      const vin = c.p.socio && c.v.vinculos[c.p.socio.id];
      const clima = (vin?.tensao ?? 0) > 40 ? 'O clima entre vocês não anda bom.' : (vin?.confianca ?? 50) > 65 ? 'Vocês se entendem bem.' : '';
      const sobra = Math.max(0, (n.caixa ?? 0) - reservaDoCaixa(c.v, n));
      return `Café, planilha, ${n.nome} na mesa. ${clima} ${sobra > 3000 ? `Sobram ${fmt(sobra)} no caixa.` : n.estado === 'apertado' ? 'O caixa está apertado.' : ''}`;
    },
    opcoes: [
      { id: 'dividir', texto: 'Dividir o que sobrou no caixa', consequencia: c => { const n = neg(c); const sobra = Math.max(0, (n.caixa ?? 0) - reservaDoCaixa(c.v, n)); return sobra > 0 ? `Sai ${fmt(sobra)} do caixa; a sua parte vai para a sua conta.` : undefined; },
        disponivel: c => { const n = neg(c); return (n.caixa ?? 0) - reservaDoCaixa(c.v, n) > 1000 ? true : 'Não há sobra para dividir.'; },
        resolver: c => { const n = neg(c); const sobra = Math.max(0, (n.caixa ?? 0) - reservaDoCaixa(c.v, n)); const sua = Math.round(sobra / 100) * 100; return { texto: `Cada um levou a sua parte. ${c.p.socio.nome} saiu sorrindo.`, memoria: null, tom: 'bom', efeito: () => { n.caixa = (n.caixa ?? 0) - sua; c.v.financas.conta += sua; comSocio(c, -6, 3, 3); } }; } },
      { id: 'reinvestir', texto: 'Propor reinvestir tudo no negócio', comportamento: { disciplina: 1 },
        resolver: c => { const quer = c.r.chance(0.55); return { texto: quer ? `${c.p.socio.nome} topou: o dinheiro fica, o negócio cresce.` : `${c.p.socio.nome} queria ver algum dinheiro. Topou, mas não gostou.`, memoria: null, efeito: () => { comSocio(c, quer ? -2 : 6, quer ? 2 : -2); if (quer) mov(c, 2); } }; } },
      { id: 'ouvir', texto: c => `Ouvir o que ${ele(c)} quer mudar`, comportamento: { empatia: 1 },
        resolver: c => {
          const n = neg(c);
          const ideia = n.estado === 'firme' && podeTentar(podeAmpliar(c.v)) ? 'ampliar' : n.estado === 'apertado' ? 'preco' : 'divulgar';
          const texto = ideia === 'ampliar' ? `${c.p.socio.nome} acha que está na hora de crescer. Você concordou — e a obra começou.` : ideia === 'preco' ? `${c.p.socio.nome} quer baixar o preço para encher de novo. Vocês tentaram.` : `${c.p.socio.nome} trouxe gente conhecida como cliente. Deu movimento.`;
          return { texto, memoria: null, tom: 'bom', efeito: () => { comSocio(c, -5, 5, 4); if (ideia === 'ampliar') ampliar(c.v); else if (ideia === 'preco' && tipoDoNegocio(n)?.estrategias.includes('preco')) mudarEstrategia(c.v, 'preco'); else mov(c, 5); } };
        } },
      { id: 'divergencias', texto: 'Pôr as divergências na mesa', comportamento: { coragem: 1 },
        resolver: c => { const deu = c.r.chance(0.55 + (c.v.personalidade.tracos.empatia > 20 ? 0.15 : 0)); return { texto: deu ? 'Foi duro e foi bom: saíram com um acordo por escrito.' : 'A conversa subiu de tom. Ficou pior do que estava.', memoria: deu ? null : `Discutiu feio com ${c.p.socio.nome}, sócio em ${neg(c).nome}.`, tom: deu ? 'bom' : 'ruim', efeito: () => comSocio(c, deu ? -15 : 14, deu ? 6 : -8), lembrar: deu ? undefined : ['socio', 'A briga sobre o negócio.', 'conflito'] }; } }
    ]
  },
  {
    id: 'negsoc_diverge', tipo: 'decisao', idade: [20, 90], tema: 'trabalho', repetir: 3, peso: 3,
    quando: c => temSocio(c) && anos(c) >= 1.5 && c.r.chance(0.6),
    papeis: { socio: v => { const n = negocioAberto(v); return n?.socioId && v.pessoas[n.socioId]?.vivo ? [v.pessoas[n.socioId]] : []; } },
    titulo: c => `${c.p.socio.nome} quer outra coisa`,
    texto: c => {
      const n = neg(c);
      if (n.estado === 'firme') return `${c.p.socio.nome} acha que ${n.nome} está pronto para crescer: ${podeTentar(podeAbrirUnidade(c.v)) ? 'outra frente' : 'mais espaço, mais gente'}. Você acha que é cedo — ou não?`;
      if (n.estado === 'apertado') return `${c.p.socio.nome} quer cortar custos já: demitir, reduzir, talvez fechar antes que o prejuízo cresça.`;
      return `${c.p.socio.nome} quer tirar mais dinheiro do negócio todo mês. "Para que ter um negócio, se nunca sobra nada?"`;
    },
    opcoes: [
      { id: 'concordar', texto: 'Concordar', consequencia: c => (neg(c).estado === 'firme' ? 'O negócio cresce — e a conta também.' : neg(c).estado === 'apertado' ? 'Menos custo agora; menos gente e menos movimento depois.' : 'Mais dinheiro na mão de cada um; menos no caixa.'),
        resolver: c => {
          const n = neg(c);
          if (n.estado === 'firme') return { texto: 'Vocês foram em frente juntos.', memoria: null, efeito: () => { comSocio(c, -6, 4); if (podeTentar(podeAbrirUnidade(c.v))) abrirUnidade(c.v); else if (podeTentar(podeAmpliar(c.v))) ampliar(c.v); else mov(c, 3); } };
          if (n.estado === 'apertado') return { texto: 'Cortaram o que dava. O negócio ficou mais magro.', memoria: null, efeito: () => { comSocio(c, -6, 3); n.capital = Math.round(n.capital * 0.92); mov(c, -2); } };
          return { texto: 'Cada um passou a tirar um pouco mais. O caixa ficou mais curto.', memoria: null, efeito: () => { comSocio(c, -5, 2); const x = Math.min(n.caixa ?? 0, valor(c, 0.1)); n.caixa = (n.caixa ?? 0) - x; c.v.financas.conta += Math.round(x * (1 - parteDoSocio(n))); } };
        } },
      { id: 'discordar', texto: 'Discordar e segurar', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${c.p.socio.nome} ficou quieto o resto da semana.`.replace('quieto', c.p.socio.genero === 'feminino' ? 'quieta' : 'quieto'), memoria: null, efeito: () => comSocio(c, 10, -4) }) },
      { id: 'meio', texto: 'Propor um meio-termo', comportamento: { empatia: 1 },
        resolver: c => { const deu = c.r.chance(0.6); return { texto: deu ? 'Acharam um meio-termo que os dois conseguem defender.' : 'O meio-termo não agradou ninguém.', memoria: null, efeito: () => comSocio(c, deu ? -4 : 5, deu ? 3 : -1) }; } }
    ]
  },
  {
    id: 'negsoc_sair', tipo: 'decisao', idade: [20, 95], tema: 'trabalho', repetir: 6, peso: 2, prioritario: true, prioridade: 2,
    quando: c => { const s = socio(c); if (!s || !s.vivo) return false; const vin = c.v.vinculos[s.id]; return anos(c) >= 3 && ((vin?.tensao ?? 0) > 55 || idadePessoa(c.v, s) >= 66) && c.r.chance(0.35); },
    papeis: { socio: v => { const n = negocioAberto(v); return n?.socioId && v.pessoas[n.socioId]?.vivo ? [v.pessoas[n.socioId]] : []; } },
    titulo: c => `${c.p.socio.nome} quer sair`,
    texto: c => { const n = neg(c); const vin = c.v.vinculos[c.p.socio.id]; return `${(vin?.tensao ?? 0) > 55 ? 'Depois de tanta discussão' : 'Com a idade pesando'}, ${c.p.socio.nome} quer vender a parte em ${n.nome}. Pela conta de hoje, uns ${fmt(precoDaParteDoSocio(c.v, n))}.`; },
    opcoes: [
      { id: 'comprar', texto: 'Comprar a parte', consequencia: c => `Sai ${fmt(precoDaParteDoSocio(c.v, neg(c)))}; o negócio fica todo seu.`, disponivel: c => (disponivel(c.v) >= precoDaParteDoSocio(c.v, neg(c)) ? true : 'Não há esse dinheiro.'),
        resolver: c => ({ texto: 'Assinaram numa tarde de chuva. Depois, um abraço meio sem jeito.', memoria: null, tom: 'bom', efeito: () => { comprarParteDoSocio(c.v); } }) },
      { id: 'terceiro', texto: 'Deixar que venda para alguém de fora', consequencia: () => 'Entra um sócio novo, que você mal conhece.',
        resolver: c => ({ texto: 'O comprador apareceu em um mês: educado, de terno, cheio de ideias para o seu negócio.', memoria: null, efeito: () => socioDeFora(c) }) },
      { id: 'fechar', texto: 'Fechar e dividir o que sobrar', consequencia: c => `${neg(c).nome} fecha; cada um leva a sua parte do que se recupera.`,
        resolver: c => ({ texto: 'Vocês fecharam juntos, do jeito que abriram.', memoria: null, tom: 'ruim', efeito: () => { const dono = !!donoIntegral(c.v); fecharNegocio(c.v, `${c.p.socio.nome} quis sair e vocês decidiram fechar`); if (dono) encerrarEmprego(c.v, 'fechou o negócio'); } }) },
      { id: 'convencer', texto: c => `Tentar convencer ${c.p.socio.nome} a ficar`, comportamento: { sociabilidade: 1 },
        resolver: c => { const vin = c.v.vinculos[c.p.socio.id]; const deu = c.r.chance(0.3 + (vin?.proximidade ?? 40) / 200 - (vin?.tensao ?? 0) / 300); return { texto: deu ? 'Topou ficar mais um tempo. Mas agora vocês sabem que é um tempo.' : 'Não teve jeito: a decisão estava tomada.', memoria: null, efeito: () => { if (deu) comSocio(c, -10, 3); else socioDeFora(c); } }; } }
    ]
  },
  {
    id: 'negsoc_aporte', tipo: 'decisao', idade: [20, 95], tema: 'trabalho', repetir: 3, prioritario: true, prioridade: 1,
    quando: c => temSocio(c) && neg(c).estado === 'apertado' && (neg(c).caixa ?? 0) < reservaDoCaixa(c.v, neg(c)) && c.r.chance(0.5),
    papeis: { socio: v => { const n = negocioAberto(v); return n?.socioId && v.pessoas[n.socioId]?.vivo ? [v.pessoas[n.socioId]] : []; } },
    titulo: 'O caixa secou',
    texto: c => `O caixa de ${neg(c).nome} não aguenta mais um mês ruim. ${c.p.socio.nome} topa pôr ${fmt(valor(c, 0.3))} — em troca de uma parte maior do negócio.`,
    opcoes: [
      { id: 'aceitar', texto: c => `Aceitar o dinheiro de ${c.p.socio.nome}`, consequencia: c => `Entra ${fmt(valor(c, 0.3))} no caixa; a parte de ${c.p.socio.nome} sobe para ${Math.round(Math.min(0.7, parteDoSocio(neg(c)) + 0.1) * 100)}%.`,
        resolver: c => ({ texto: 'O dinheiro entrou. A sua parte do negócio ficou menor.', memoria: null, efeito: () => { const n = neg(c); n.caixa = (n.caixa ?? 0) + valor(c, 0.3); n.parteSocio = Math.min(0.7, parteDoSocio(n) + 0.1); comSocio(c, -3, 3); } }) },
      { id: 'bolso', texto: 'Pôr do seu bolso, e aumentar a sua parte', consequencia: c => `Sai ${fmt(valor(c, 0.3))} da sua conta; a sua parte sobe.`, disponivel: c => (disponivel(c.v) >= valor(c, 0.3) ? true : 'Não há esse dinheiro.'),
        resolver: c => ({ texto: 'Você pôs o dinheiro. O negócio ficou mais seu.', memoria: null, efeito: () => { const n = neg(c); pagar(c.v, valor(c, 0.3)); n.caixa = (n.caixa ?? 0) + valor(c, 0.3); n.parteSocio = Math.max(0.3, parteDoSocio(n) - 0.1); comSocio(c, 2, 0); } }) },
      { id: 'nada', texto: 'Ninguém põe nada: cortar até caber', resolver: c => ({ texto: 'Cortaram luz, gente, estoque. O negócio encolheu.', memoria: null, efeito: () => { mov(c, -4); comSocio(c, 4); } }) }
    ]
  },

  /* ============================================================== Loja on-line */
  {
    id: 'negol_algoritmo', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => presente('online')(c) && estrategiaDe(neg(c)) === 'escala' && c.r.chance(0.5),
    narrar: c => ({ texto: `A plataforma mudou o jeito de mostrar os produtos: as vendas de ${neg(c).nome} caíram da noite para o dia.`, relevancia: 'cotidiano', tom: 'ruim', efeito: () => { mov(c, -8); estresse(c, 4); } })
  },
  {
    id: 'negol_viral', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 6, peso: 1.5,
    quando: c => presente('online')(c) && (neg(c).reputacao ?? 40) >= 40 && c.r.chance(0.4),
    narrar: c => ({ texto: `Um vídeo de uma cliente mostrando um produto de ${neg(c).nome} viralizou: centenas de pedidos numa semana.`, relevancia: 'biografia', tom: 'bom', efeito: () => { mov(c, 10); rep(c, 5); caixa(c, valor(c, 0.2)); } })
  },
  {
    id: 'negol_devolucoes', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => presente('online')(c) && anos(c) >= 1,
    titulo: 'As devoluções',
    texto: c => `Uma leva do fornecedor veio com defeito. Todo dia chega uma devolução em ${neg(c).nome} — e uma avaliação de uma estrela.`,
    opcoes: [
      { id: 'trocar', texto: 'Trocar tudo por conta da loja', comportamento: { generosidade: 1 }, consequencia: c => `Sai uns ${fmt(valor(c, 0.12))} do caixa; a nota da loja se salva.`,
        resolver: c => ({ texto: 'Troca sem pergunta, frete por sua conta. As avaliações viraram elogio.', memoria: null, tom: 'bom', efeito: () => { caixa(c, -valor(c, 0.12)); rep(c, 4); } }) },
      { id: 'cobrar', texto: 'Cobrar o fornecedor e esperar', resolver: c => { const deu = c.r.chance(0.5); return { texto: deu ? 'O fornecedor reconheceu e mandou peça nova. Demorou, mas veio.' : 'O fornecedor sumiu. As estrelas ficaram.', memoria: null, tom: deu ? 'neutro' : 'ruim', efeito: () => { rep(c, deu ? -1 : -6); mov(c, deu ? 0 : -4); } }; } },
      { id: 'mudar', texto: 'Trocar de fornecedor de vez', resolver: c => ({ texto: 'Você achou outro fornecedor, mais caro e mais confiável.', memoria: null, efeito: () => { rep(c, 1); (neg(c).melhorias ??= []).push('fornecedor'); neg(c).melhorias = neg(c).melhorias!.filter(m => m !== 'fornecedor_ruim'); } }) }
    ]
  },
  {
    id: 'negol_blackfriday', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => presente('online')(c) && anos(c) >= 1,
    titulo: 'A Black Friday',
    texto: c => `Novembro chegando. O concorrente já anunciou desconto de metade do preço. ${neg(c).nome} pode estocar pesado — ou ficar de fora.`,
    opcoes: [
      { id: 'estocar', texto: 'Estocar pesado e entrar na briga', comportamento: { coragem: 1 }, consequencia: c => `Sai uns ${fmt(valor(c, 0.3))} em estoque. Se vender, sobra; se não, encalha.`,
        resolver: c => { const deu = c.r.chance(0.5 + neg(c).clientela / 250); return { texto: deu ? 'O estoque evaporou em quatro dias.' : 'Metade encalhou. Janeiro foi de liquidação.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { caixa(c, deu ? valor(c, 0.25) : -valor(c, 0.2)); mov(c, deu ? 4 : 0); } }; } },
      { id: 'modesto', texto: 'Um desconto modesto no que já tem', resolver: c => ({ texto: 'Vendeu um pouco mais do que um mês comum. Sem susto.', memoria: null, efeito: () => caixa(c, valor(c, 0.05)) }) },
      { id: 'fora', texto: 'Ficar de fora', resolver: () => ({ texto: 'Você deixou a guerra de preço para os outros.', memoria: null }) }
    ]
  },

  /* =========================================================== Porta aberta */
  {
    id: 'negrua_vizinho', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 6, peso: 1.5,
    quando: c => presente('rua')(c) && !neg(c).emCasa && anos(c) >= 1 && c.r.chance(0.5),
    narrar: c => ({ texto: `Abriu ${tipoDoNegocio(neg(c))?.nome.replace(/^um /, 'outro ').replace(/^uma /, 'outra ')} do outro lado da rua de ${neg(c).nome}. Os primeiros meses foram de freguês dividido.`, relevancia: 'cotidiano', tom: 'ruim', efeito: () => mov(c, -6) })
  },
  {
    id: 'negrua_famoso', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 8, peso: 1,
    quando: c => eh('salao', 'lanchonete', 'comercio', 'marcenaria')(c) && (neg(c).reputacao ?? 40) >= 45 && c.r.chance(0.4),
    narrar: c => ({ texto: `Alguém conhecido na cidade elogiou ${neg(c).nome} nas redes. No fim de semana seguinte, tinha fila na porta.`, relevancia: 'biografia', tom: 'bom', efeito: () => { mov(c, 7); rep(c, 5); } })
  },
  {
    id: 'negrua_aluguel', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => presente('rua')(c) && !neg(c).emCasa && anos(c) >= 2,
    titulo: 'O aluguel do ponto',
    texto: c => `O dono do ponto de ${neg(c).nome} quer reajustar o aluguel bem acima da inflação. "O bairro valorizou", ele diz.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar o reajuste', consequencia: () => 'O custo fixo sobe todo ano.', resolver: c => ({ texto: 'Você assinou o aditivo. A conta do mês ficou mais pesada.', memoria: null, efeito: () => { neg(c).capital = Math.round(neg(c).capital * 1.08); } }) },
      { id: 'negociar', texto: 'Negociar', comportamento: { coragem: 1 }, resolver: c => { const deu = c.r.chance(0.55); return { texto: deu ? 'Fecharam no meio do caminho.' : 'O dono não cedeu um real. Você aceitou, contrariado.'.replace('contrariado', c.g('contrariado', 'contrariada', 'contrariade')), memoria: null, efeito: () => { neg(c).capital = Math.round(neg(c).capital * (deu ? 1.03 : 1.08)); } }; } },
      { id: 'mudar', texto: 'Mudar de ponto', consequencia: c => `A mudança custa uns ${fmt(valor(c, 0.2))}, e parte da freguesia não acompanha.`,
        resolver: c => ({ texto: 'Um ponto novo, três ruas adiante. Parte da freguesia achou; parte, não.', memoria: `Mudou ${neg(c).nome} de ponto por causa do aluguel.`, relevancia: 'cotidiano', efeito: () => { caixa(c, -valor(c, 0.2)); mov(c, -8); } }) }
    ]
  },
  {
    id: 'negrua_vigilancia', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => eh('lanchonete')(c) && anos(c) >= 1,
    titulo: 'A vigilância sanitária',
    texto: c => `A fiscalização apareceu sem avisar em ${neg(c).nome}: geladeira, validade, azulejo, pia. Anotaram três coisas.`,
    opcoes: [
      { id: 'corrigir', texto: 'Corrigir tudo na mesma semana', comportamento: { disciplina: 1 }, consequencia: c => `Uns ${fmt(valor(c, 0.08))} em reparos.`, resolver: c => ({ texto: 'Na volta do fiscal, estava tudo em ordem.', memoria: null, tom: 'bom', efeito: () => { caixa(c, -valor(c, 0.08)); rep(c, 2); } }) },
      { id: 'multa', texto: 'Pagar a multa e ir ajeitando', resolver: c => ({ texto: 'A multa veio. O resto, você foi ajeitando aos poucos.', memoria: null, efeito: () => { caixa(c, -valor(c, 0.05)); rep(c, -2); } }) },
      { id: 'fechar_dias', texto: 'Fechar uns dias e reformar a cozinha', consequencia: c => `Uns ${fmt(valor(c, 0.15))} e duas semanas sem vender.`, resolver: c => ({ texto: 'Duas semanas de porta fechada. Reabriu com cozinha nova.', memoria: null, tom: 'bom', efeito: () => { caixa(c, -valor(c, 0.15)); mov(c, -2); rep(c, 4); } }) }
    ]
  },
  {
    id: 'negcom_fiado', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 1.5,
    quando: c => eh('comercio', 'lanchonete')(c) && anos(c) >= 2,
    titulo: 'O fiado',
    texto: c => `Um freguês de muitos anos de ${neg(c).nome} está desempregado e pergunta, baixinho, se pode pagar no fim do mês.`,
    opcoes: [
      { id: 'sim', texto: 'Deixar marcar no caderno', comportamento: { generosidade: 1, empatia: 1 }, resolver: c => { const pagou = c.r.chance(0.6); return { texto: pagou ? 'Dois meses depois, ele voltou com o dinheiro e um bolo de agradecimento.' : 'O caderno ficou com o nome dele. O freguês, não voltou mais.', memoria: null, efeito: () => { rep(c, pagou ? 3 : 1); if (!pagou) caixa(c, -valor(c, 0.01)); } }; } },
      { id: 'nao', texto: 'Explicar que não dá', resolver: () => ({ texto: 'Ele entendeu. Ou disse que entendeu.', memoria: null }) }
    ]
  },

  /* =================================================================== Ofícios */
  {
    id: 'negof_frota', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => eh('oficina')(c) && estrategiaDe(neg(c)) !== 'escala' && anos(c) >= 2 && (neg(c).reputacao ?? 40) >= 40,
    titulo: 'A frota',
    texto: c => `Uma transportadora quer ${neg(c).nome} cuidando da frota inteira: volume garantido, preço apertado, prazo de ferro.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar o contrato', consequencia: () => 'Movimento certo todo mês; margem menor; se a transportadora atrasar, o caixa sente.',
        resolver: c => ({ texto: 'Os caminhões começaram a chegar às seis da manhã.', memoria: null, efeito: () => { mudarEstrategia(c.v, 'escala'); mov(c, 8); } }) },
      { id: 'recusar', texto: 'Recusar: o cliente do bairro vem primeiro', resolver: () => ({ texto: 'Você agradeceu. A oficina seguiu do jeito que era.', memoria: null }) }
    ]
  },
  {
    id: 'negof_retorno', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 1.5,
    quando: c => eh('oficina')(c) && c.r.chance(0.4),
    narrar: c => ({ texto: `Um carro voltou para ${neg(c).nome} com o mesmo defeito. O dono reclamou alto, na porta, com gente ouvindo.`, relevancia: 'cotidiano', tom: 'ruim', efeito: () => rep(c, -3) })
  },
  {
    id: 'negsal_noiva', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 1.5,
    quando: c => eh('salao')(c) && c.r.chance(0.5),
    narrar: c => ({ texto: `Uma noiva trouxe a mãe, as madrinhas e as primas para ${neg(c).nome}: um sábado inteiro de cadeira ocupada.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => { caixa(c, valor(c, 0.06)); rep(c, 2); } })
  },
  {
    id: 'negsal_alergia', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 6, peso: 1.5,
    quando: c => eh('salao')(c) && anos(c) >= 1,
    titulo: 'A reação',
    texto: c => `Uma cliente de ${neg(c).nome} teve reação a um produto de coloração: couro cabeludo vermelho, foto no celular, marido ligando.`,
    opcoes: [
      { id: 'cuidar', texto: 'Pagar a consulta e pedir desculpas', comportamento: { empatia: 1 }, consequencia: () => 'Custa algum dinheiro; a cliente fica.', resolver: c => ({ texto: 'Você acompanhou até o dermatologista. Ela voltou no mês seguinte.', memoria: null, tom: 'bom', efeito: () => { caixa(c, -valor(c, 0.02)); rep(c, 2); } }) },
      { id: 'raro', texto: 'Explicar que é raro e que o produto é aprovado', resolver: c => ({ texto: 'Ela não voltou. A história, circulou.', memoria: null, tom: 'ruim', efeito: () => rep(c, -5) }) },
      { id: 'marca', texto: 'Trocar a marca dos produtos', resolver: c => ({ texto: 'Produto novo, mais caro, teste de mecha para todo mundo.', memoria: null, efeito: () => { rep(c, 1); neg(c).capital = Math.round(neg(c).capital * 1.03); } }) }
    ]
  },
  {
    id: 'negmar_encomenda', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 1.5,
    quando: c => eh('marcenaria')(c) && neg(c).clientela >= 35 && c.r.chance(0.5),
    narrar: c => ({ texto: `Um casal encomendou a ${neg(c).nome} os móveis de um apartamento inteiro: três meses de serragem e pagamento em dia.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => { caixa(c, valor(c, 0.15)); rep(c, 2); } })
  },
  {
    id: 'negest_casamento', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 1.5,
    quando: c => eh('estudio')(c) && c.r.chance(0.5),
    narrar: c => ({ texto: `${neg(c).nome} fotografou um casamento grande. As fotos rodaram entre os convidados — e vieram três orçamentos.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => { mov(c, 4); rep(c, 3); } })
  },

  /* ============================================================ Atendimento */
  {
    id: 'negat_convenio', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => eh('consultorio_psicologia', 'clinica_fisio', 'clinica_vet')(c) && estrategiaDe(neg(c)) === 'escala',
    titulo: 'O convênio atrasou',
    texto: c => `O convênio que mais manda gente para ${neg(c).nome} atrasou três meses de pagamento. A agenda continua cheia; o caixa, não.`,
    opcoes: [
      { id: 'esperar', texto: 'Esperar e continuar atendendo', consequencia: c => `O caixa segura uns ${fmt(valor(c, 0.15))} a menos por um tempo.`, resolver: c => { const pagou = c.r.chance(0.7); return { texto: pagou ? 'O pagamento veio, atrasado e sem juros.' : 'Veio só metade. A outra metade virou discussão.', memoria: null, efeito: () => caixa(c, pagou ? 0 : -valor(c, 0.08)) }; } },
      { id: 'sair', texto: 'Descredenciar e atender só particular', consequencia: () => 'A agenda esvazia; cada horário vale mais.', resolver: c => ({ texto: 'Você saiu do convênio. Parte dos pacientes foi junto; parte, não.', memoria: null, efeito: () => { mudarEstrategia(c.v, 'qualidade'); mov(c, -10); } }) }
    ]
  },
  {
    id: 'negat_indicacao', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 1.5,
    quando: c => presente('atendimento')(c) && (neg(c).reputacao ?? 40) >= 45 && c.r.chance(0.45),
    narrar: c => { const t = tipoDoNegocio(neg(c)); const quem = t?.cliente === 'paciente' ? 'Um paciente satisfeito indicou a família inteira' : t?.cliente === 'tutor' ? 'Uma tutora agradecida indicou o grupo inteiro do condomínio' : 'Um cliente grande indicou outros três'; return { texto: `${quem} para ${neg(c).nome}.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => { mov(c, 5); rep(c, 2); } }; }
  },
  {
    id: 'negvet_plantao', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 4, peso: 1.5,
    quando: c => eh('clinica_vet')(c),
    titulo: 'Onze da noite',
    texto: c => `O telefone de ${neg(c).nome} tocou às onze da noite: um cachorro atropelado, a dona chorando do outro lado.`,
    opcoes: [
      { id: 'atender', texto: 'Abrir a clínica e atender', comportamento: { empatia: 1 }, resolver: c => { const salvou = c.r.chance(0.6); return { texto: salvou ? 'Três horas de cirurgia. Ele sobreviveu. A dona contou para a cidade inteira.' : 'Você tentou tudo. Não deu. A dona agradeceu mesmo assim.', memoria: null, tom: salvou ? 'bom' : 'ruim', efeito: () => { rep(c, salvou ? 5 : 2); estresse(c, 4); } }; } },
      { id: 'encaminhar', texto: 'Indicar o hospital 24 horas', resolver: () => ({ texto: 'Você passou o endereço e ficou um tempo acordado.', memoria: null }) }
    ]
  },
  {
    id: 'negti_contrato', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => eh('consultoria_ti', 'escritorio_contabil')(c) && anos(c) >= 2 && (neg(c).reputacao ?? 40) >= 45,
    titulo: 'O cliente grande',
    texto: c => `Uma empresa grande quer um contrato longo com ${neg(c).nome} — e exclusividade: nada de atender concorrente.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', consequencia: () => 'Dinheiro certo por anos; se esse cliente sair, sai metade do negócio.', resolver: c => ({ texto: 'Assinaram por três anos. A agenda encheu de um dia para o outro.', memoria: `Fechou um contrato longo e exclusivo para ${neg(c).nome}.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => { mov(c, 12); c.v.fatos[`neg_exclusivo_${neg(c).tInicio}`] = c.v.t; } }) },
      { id: 'recusar', texto: 'Recusar a exclusividade', comportamento: { independencia: 1 }, resolver: () => ({ texto: 'A empresa foi atrás de outro escritório. Os seus clientes continuaram seus.', memoria: null }) }
    ]
  },

  /* ==================================================================== Obra */
  {
    id: 'negob_chuva', tipo: 'acontecimento', idade: [18, 90], tema: 'trabalho', repetir: 4, peso: 1.5,
    quando: c => presente('obra')(c) && c.r.chance(0.4),
    narrar: c => ({ texto: `Um mês inteiro de chuva parou duas obras de ${neg(c).nome}. Os prazos estouraram; os clientes ligavam todo dia.`, relevancia: 'cotidiano', tom: 'ruim', efeito: () => { caixa(c, -valor(c, 0.06)); rep(c, -2); } })
  },
  {
    id: 'negob_calote', tipo: 'decisao', idade: [18, 90], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => presente('obra')(c) && anos(c) >= 1,
    titulo: 'A última medição',
    texto: c => `O cliente de uma obra de ${neg(c).nome} não pagou a última medição. A equipe espera o pagamento; o material já foi comprado.`,
    opcoes: [
      { id: 'parar', texto: 'Parar a obra até pagar', comportamento: { coragem: 1 }, resolver: c => { const pagou = c.r.chance(0.65); return { texto: pagou ? 'Na segunda-feira, o dinheiro caiu. A obra voltou.' : 'O cliente trocou de empreiteira e não pagou nada.', memoria: null, efeito: () => caixa(c, pagou ? 0 : -valor(c, 0.15)) }; } },
      { id: 'terminar', texto: 'Terminar e cobrar depois', comportamento: { generosidade: 1 }, resolver: c => { const pagou = c.r.chance(0.5); return { texto: pagou ? 'Pagou depois, em três vezes. Indicou você para o vizinho.' : 'Obra entregue, dinheiro nenhum. Ficou a lição.', memoria: null, efeito: () => { caixa(c, pagou ? 0 : -valor(c, 0.2)); rep(c, pagou ? 3 : 0); } }; } },
      { id: 'justica', texto: 'Cobrar na Justiça', resolver: c => ({ texto: 'O processo vai demorar. O advogado cobrou adiantado.', memoria: null, efeito: () => { caixa(c, -valor(c, 0.04)); c.v.fatos[`neg_processo_${neg(c).tInicio}`] = c.v.t; } }) }
    ]
  }
];

/** Evita avisos de símbolos importados só para tipos. */
export type { Negocio, Resultado };
void dedicacaoDe; void valorDoNegocio; void lembrarCom; void cap; void marcar;
