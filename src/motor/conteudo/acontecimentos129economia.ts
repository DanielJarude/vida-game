/**
 * VIDA 12.9 — A VIDA EM CADA FAIXA DE FORTUNA (e as cenas das empresas). Sorteadas pelo fluxo derivado próprio
 * (`fortuna129.vidaEconomicaDoAno129`, ids `eco129_`): as vidas que não as vivem seguem iguais.
 *
 *   POBREZA       a geladeira que para, a conta velha que volta com multa, o bico de fim de semana, o dinheiro rápido do agiota;
 *   MÉDIA E ALTA  o imprevisto grande (à vista, parcelado ou adiado), o negócio do amigo;
 *   MILIONÁRIOS   o fundo que promete demais, o processo (acordo ou briga);
 *   BILIONÁRIOS   a filantropia de verdade, o megaprojeto, a Receita, o empréstimo que vence com tudo preso em empresas;
 *   EMPRESAS      a empresa sem caixa que pede dinheiro, a proposta de compra, o diretor que a concorrência quer levar.
 *
 * Todo número dito é o número aplicado; as perdas saem de verdade (`fortuna129.aplicarPerda`): da conta, das aplicações e,
 * conforme a escolha, de bens vendidos ou de dívida nova. O que só se sabe depois (o negócio do amigo, o fundo, o megaprojeto)
 * fica pendente e é resolvido anos depois (`fortuna129.processarFortuna129`).
 */
import type { Conteudo, Ctx } from './base';
import type { Empresa } from '../tipos';
import { clamp, rngDe } from '../rng';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { custa, estresse, feliz, local, perda, saude } from './efeitos';
import { balanco, orcamento, parcelaPrice } from '../sistemas/dinheiro';
import { liquidez } from '../sistemas/investimentos';
import { escala, indicadores, pendurar, receberGanho, temPendente, type Escala } from '../sistemas/fortuna129';
import { empresasAtivas, valorDaParte } from '../sistemas/empresas';
import { decidirEmpresa129, disponibilidadeEmpresa129 } from '../sistemas/empresas129';
import { NOME_CARGO } from '../dados/empresas129';

const r1000 = (x: number) => Math.round(x / 1000) * 1000;
const esc = (c: Ctx): Escala => escala(c.v);
const em = (c: Ctx, ...xs: Escala[]) => xs.includes(esc(c));
const liq = (c: Ctx) => liquidez(c.v).mobilizavel;
const pat = (c: Ctx) => balanco(c.v).liquido;
const sozinho = (c: Ctx) => orcamento(c.v).arranjo !== 'familia';
const rr = (c: Ctx, chave: string) => rngDe(c.v.id, chave, anoDe(c.v.t));
const novaDivida = (c: Ctx, valor: number, juros: number, meses: number, descricao: string) => {
  c.v.financas.dividas.push({ id: `d${c.v.seq++}`, tipo: 'emprestimo', saldo: valor, jurosMes: juros, parcela: Math.round(parcelaPrice(valor, juros, meses)), descricao, tInicio: c.v.t, prazo: meses });
};

/* Os valores de cada cena (fixos no ano, sem gastar o gerador da vida). */
const geladeira = (c: Ctx) => local(c, 2400);
const contaVelha = (c: Ctx) => local(c, 900 + rr(c, 'eco129_conta').int(0, 6) * 150);
const imprevisto = (c: Ctx) => r1000(clamp(orcamento(c.v).despesa * (3 + rr(c, 'eco129_impr').next() * 3), local(c, 4000), local(c, 120_000)));
const amigo = (c: Ctx) => r1000(clamp(liq(c) * 0.15, local(c, 10_000), local(c, 400_000)));
const fundo = (c: Ctx) => r1000(Math.min(pat(c) * 0.1, liq(c) * 0.6));
const processo = (c: Ctx) => r1000(clamp(pat(c) * 0.015, local(c, 150_000), local(c, 80_000_000)));
const mega = (c: Ctx) => r1000(Math.max(0, pat(c)) * 0.12);
const fisco = (c: Ctx) => r1000(Math.max(0, pat(c)) * 0.02);
const vencimento = (c: Ctx) => r1000(Math.max(0, pat(c)) * 0.05);

const comPedido = (c: Ctx) => empresasAtivas(c.v).find(e => e.papel !== 'investidor' && !!e.corp?.pedido);
const cobicada = (c: Ctx) => empresasAtivas(c.v).filter(e => e.papel !== 'investidor' && e.estado === 'operando' && valorDaParte(e) > 0 && (e.historico ?? []).slice(-2).every(x => x > 0) && c.v.t - e.tInicio >= 36).sort((a, b) => valorDaParte(b) - valorDaParte(a))[0];
const premio = (c: Ctx, e: Empresa) => r1000(valorDaParte(e) * (1.15 + rngDe(c.v.id, e.id, 'eco129_proposta', anoDe(c.v.t)).next() * 0.25));
/** VIDA 13: a concorrente com nome (das rivais gravadas da empresa), escolhida sem sorteio — ou "uma concorrente". */
const rivalQueChama = (e: { corp?: { rivais?: string[] } }, quem: string) => { const r = e.corp?.rivais; return r?.length ? r[[...quem].reduce((t, ch) => t + ch.charCodeAt(0), 0) % r.length] : undefined; };
const diretorCobicado = (c: Ctx) => { for (const e of empresasAtivas(c.v)) { if (e.papel === 'investidor') continue; const d = (e.executivos ?? []).find(x => x.competencia >= 70 && c.v.t - x.t >= 24); if (d) return { e, d }; } return undefined; };

export const ACONTECIMENTOS_129_ECONOMIA: Conteudo[] = [
  /* ============================================================== pobreza */
  {
    id: 'eco129_pob_geladeira', manual: true, tipo: 'decisao', idade: [18, 95], tema: 'dinheiro', repetir: 8,
    quando: c => em(c, 'pobreza') && sozinho(c),
    titulo: 'A geladeira parou',
    texto: c => `A geladeira parou numa terça, cheia. O técnico olhou o motor e balançou a cabeça: não compensa consertar. Uma nova custa uns ${fmt(geladeira(c))}; na conta há ${fmt(Math.max(0, c.v.financas.conta))}.`,
    opcoes: [
      { id: 'carne', texto: 'Comprar nova no carnê da loja', consequencia: c => `Doze parcelas de uns ${fmt(Math.round(parcelaPrice(geladeira(c), 0.045, 12)))} — no fim, bem mais que o preço.`,
        resolver: c => { const v = geladeira(c); return { texto: 'Geladeira nova na cozinha e um carnê na gaveta: doze meses de parcela.', memoria: 'Comprou a geladeira no carnê.', efeito: () => novaDivida(c, v, 0.045, 12, 'Carnê da geladeira') }; } },
      { id: 'usada', texto: 'Procurar uma usada', disponivel: c => custa(c, Math.round(geladeira(c) * 0.35)),
        resolver: c => { const v = Math.round(geladeira(c) * 0.35); const quebrou = rr(c, 'eco129_usada').chance(0.35); return { texto: quebrou ? `Uma usada por ${fmt(v)}, de um vizinho. Durou oito meses.` : `Uma usada por ${fmt(v)}, barulhenta e firme.`, memoria: null, tom: quebrou ? 'ruim' : 'neutro', efeito: () => { perda(c, v, 'a geladeira usada'); if (quebrou) estresse(c, 5); } }; } },
      { id: 'sem', texto: 'Ficar sem por um tempo', consequencia: () => 'Isopor com gelo, compra do dia, comida que estraga.',
        resolver: c => ({ texto: 'Dois meses de isopor, compra do dia e comida jogada fora. Depois, deu para juntar.', memoria: 'Ficou meses sem geladeira.', tom: 'ruim', efeito: () => { estresse(c, 6); feliz(c, -4); saude(c, -1); } }) }
    ]
  },
  {
    id: 'eco129_pob_conta_velha', manual: true, tipo: 'decisao', idade: [18, 95], tema: 'dinheiro', repetir: 6,
    quando: c => em(c, 'pobreza') && sozinho(c),
    titulo: 'A conta que voltou',
    texto: c => `Chegou uma carta de cobrança: uma conta de meses atrás, que ficou para depois, voltou com multa e juros — ${fmt(contaVelha(c))}.`,
    opcoes: [
      { id: 'pagar', texto: 'Pagar e apertar o mercado do mês', disponivel: c => custa(c, contaVelha(c)),
        resolver: c => ({ texto: 'Pagou. O mês foi de arroz, ovo e nenhum passeio.', memoria: null, efeito: () => { perda(c, contaVelha(c), 'a conta atrasada com multa'); feliz(c, -2); } }) },
      { id: 'parcelar', texto: 'Parcelar com a empresa', consequencia: c => `Seis parcelas de uns ${fmt(Math.round(parcelaPrice(contaVelha(c), 0.02, 6)))}.`,
        resolver: c => ({ texto: 'Seis parcelas, com juros. Uma a mais todo mês.', memoria: null, efeito: () => novaDivida(c, contaVelha(c), 0.02, 6, 'Conta atrasada parcelada') }) },
      { id: 'ignorar', texto: 'Deixar para depois de novo', consequencia: () => 'A dívida cresce e o nome pode ir para o cadastro de devedores.',
        resolver: c => ({ texto: 'A carta foi para a gaveta. A dívida, para o cadastro.', memoria: null, tom: 'ruim', efeito: () => { perda(c, Math.round(contaVelha(c) * 1.3), 'a conta deixada para depois', { endividar: true, humor: false }); estresse(c, 4); } }) }
    ]
  },
  {
    id: 'eco129_pob_bico', manual: true, tipo: 'decisao', idade: [18, 70], tema: 'trabalho', repetir: 5, peso: 2,
    quando: c => em(c, 'pobreza', 'media') && c.v.corpo.saude >= 45,
    titulo: 'Um bico no fim de semana',
    texto: c => `Um conhecido precisa de alguém nos sábados e domingos, o ano inteiro: uns ${fmt(local(c, 400))} por mês. É o descanso que vai embora.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `Um ano sem fim de semana. No fim, ${fmt(local(c, 4800))} a mais — e um cansaço que não sai no domingo.`, memoria: 'Trabalhou um ano inteiro nos fins de semana para fechar as contas.', efeito: () => { receberGanho(c.v, local(c, 4800), 'O bico de fim de semana'); estresse(c, 8); feliz(c, -2); } }) },
      { id: 'recusar', texto: 'Recusar: o fim de semana é o que sobra', resolver: () => ({ texto: 'Recusou. O dinheiro continua curto; o domingo, seu.', memoria: null }) }
    ]
  },
  {
    id: 'eco129_pob_agiota', manual: true, tipo: 'decisao', idade: [18, 90], tema: 'dinheiro', repetir: 8,
    quando: c => em(c, 'pobreza') && c.v.financas.negativado && sozinho(c),
    titulo: 'Dinheiro rápido',
    texto: c => `Com o nome sujo, banco nenhum empresta. Um homem do bairro empresta ${fmt(local(c, 3000))} na hora, "sem consulta" — a 15% ao mês.`,
    opcoes: [
      { id: 'pegar', texto: 'Pegar o dinheiro', comportamento: { impulsividade: 2 }, consequencia: c => `Doze parcelas de uns ${fmt(Math.round(parcelaPrice(local(c, 3000), 0.15, 12)))}: quase o triplo.`,
        resolver: c => ({ texto: 'O dinheiro veio em notas, num envelope. As parcelas vêm todo mês, com visita se atrasar.', memoria: 'Pegou dinheiro com agiota.', tom: 'ruim', efeito: () => { c.v.financas.conta += local(c, 3000); novaDivida(c, local(c, 3000), 0.15, 12, 'Empréstimo do agiota'); estresse(c, 6); } }) },
      { id: 'nao', texto: 'Não pegar', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Não pegou. O mês foi mais duro — e só ele.', memoria: null }) }
    ]
  },

  /* ============================================================== média e alta */
  {
    id: 'eco129_med_imprevisto', manual: true, tipo: 'decisao', idade: [22, 90], tema: 'dinheiro', repetir: 5,
    quando: c => em(c, 'media', 'alta') && sozinho(c),
    titulo: 'O imprevisto grande',
    texto: c => `${['O motor do carro', 'Um tratamento dentário que não dá para adiar', 'O telhado, depois da chuva'][rr(c, 'eco129_impr_q').int(0, 2)]}: o orçamento veio em ${fmt(imprevisto(c))}.`,
    opcoes: [
      { id: 'vista', texto: 'Pagar à vista', disponivel: c => custa(c, imprevisto(c)),
        resolver: c => ({ texto: 'Pagou à vista. A reserva encolheu; a dívida não veio.', memoria: null, efeito: () => { perda(c, imprevisto(c), 'o imprevisto grande'); } }) },
      { id: 'parcelar', texto: 'Parcelar em dez vezes', consequencia: c => `Dez parcelas de uns ${fmt(Math.round(parcelaPrice(imprevisto(c), 0.025, 10)))}.`,
        resolver: c => ({ texto: 'Parcelado. O mês ficou mais curto por quase um ano.', memoria: null, efeito: () => novaDivida(c, imprevisto(c), 0.025, 10, 'O imprevisto parcelado') }) },
      { id: 'adiar', texto: 'Adiar o quanto der', consequencia: () => 'Fica mais caro depois.',
        resolver: c => ({ texto: 'Adiou. Meses depois, saiu mais caro — e com mais dor de cabeça.', memoria: null, tom: 'ruim', efeito: () => { perda(c, Math.round(imprevisto(c) * 1.4), 'o imprevisto adiado', { endividar: true }); estresse(c, 5); } }) }
    ]
  },
  {
    id: 'eco129_med_amigo', manual: true, tipo: 'decisao', idade: [24, 75], tema: 'dinheiro', repetir: 10,
    quando: c => em(c, 'media', 'alta', 'milionaria') && liq(c) >= local(c, 20_000) && !temPendente(c.v, 'amigo'),
    titulo: 'O negócio do amigo',
    texto: c => `Um amigo de anos vai abrir um negócio e quer você de sócio: ${fmt(amigo(c))} por uma parte. O plano parece bom. Plano sempre parece.`,
    opcoes: [
      { id: 'entrar', texto: 'Entrar', disponivel: c => custa(c, amigo(c)), consequencia: () => 'Só daqui a uns anos se sabe se valeu.',
        resolver: c => ({ texto: 'Assinou. Agora é torcer — e acompanhar.', memoria: 'Entrou de sócio no negócio de um amigo.', efeito: () => { perda(c, amigo(c), 'a sociedade no negócio do amigo', { humor: false }); pendurar(c.v, 'amigo', amigo(c)); } }) },
      { id: 'nao', texto: 'Agradecer e ficar fora', resolver: () => ({ texto: 'Ficou fora. O amigo entendeu — mais ou menos.', memoria: null }) }
    ]
  },

  /* ============================================================== milionários */
  {
    id: 'eco129_mil_fundo', manual: true, tipo: 'decisao', idade: [25, 90], tema: 'dinheiro', repetir: 12,
    quando: c => em(c, 'milionaria', 'multimilionaria') && fundo(c) >= local(c, 200_000) && !temPendente(c.v, 'fundo'),
    titulo: 'O fundo que rende demais',
    texto: c => `Um gestor indicado por gente importante oferece um fundo exclusivo: "3% ao mês, garantido, há dez anos". O mínimo para entrar é ${fmt(fundo(c))}.`,
    opcoes: [
      { id: 'entrar', texto: 'Entrar no fundo', comportamento: { impulsividade: 1 }, disponivel: c => custa(c, fundo(c)),
        resolver: c => ({ texto: 'O extrato do primeiro mês veio lindo.', memoria: null, efeito: () => { perda(c, fundo(c), 'o fundo exclusivo', { humor: false }); pendurar(c.v, 'fundo', fundo(c)); } }) },
      { id: 'desconfiar', texto: 'Desconfiar e recusar', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Ninguém garante 3% ao mês. Você recusou.', memoria: null }) }
    ]
  },
  {
    id: 'eco129_mil_processo', manual: true, tipo: 'decisao', idade: [25, 95], tema: 'dinheiro', repetir: 8,
    quando: c => em(c, 'milionaria', 'multimilionaria', 'bilionaria'),
    titulo: 'O processo',
    texto: c => `${['Um ex-sócio', 'Um antigo funcionário', 'O vizinho da obra'][rr(c, 'eco129_proc_q').int(0, 2)]} entrou na Justiça contra você. O advogado acha que dá para ganhar; o outro lado aceita um acordo de ${fmt(processo(c))}.`,
    opcoes: [
      { id: 'acordo', texto: 'Fechar o acordo', disponivel: c => custa(c, processo(c)),
        resolver: c => ({ texto: 'Acordo assinado. O assunto acabou — pelo preço combinado.', memoria: null, efeito: () => { perda(c, processo(c), 'o acordo do processo', { vender: true }); } }) },
      { id: 'lutar', texto: 'Lutar na Justiça', comportamento: { coragem: 1 }, consequencia: c => `Pode não custar nada além do advogado (uns ${fmt(r1000(processo(c) * 0.1))}) — ou perder e pagar mais que o dobro.`,
        resolver: c => {
          const ganhou = rr(c, 'eco129_proc').chance(0.55);
          const custo = ganhou ? r1000(processo(c) * 0.1) : r1000(processo(c) * 2.3);
          return { texto: ganhou ? `Dois anos de processo e a vitória. Ficou o advogado: ${fmt(custo)}.` : `Perdeu. A condenação, com juros e custas: ${fmt(custo)}.`, memoria: ganhou ? 'Ganhou um processo que preferiu enfrentar.' : 'Perdeu um processo caro.', tom: ganhou ? 'bom' : 'ruim', relevancia: 'biografia', efeito: () => { perda(c, custo, ganhou ? 'o advogado do processo' : 'a condenação no processo', { vender: true, endividar: true }); } };
        } }
    ]
  },

  /* ============================================================== bilionários */
  {
    id: 'eco129_bi_filantropia', manual: true, tipo: 'decisao', idade: [30, 100], tema: 'dinheiro', repetir: 6,
    quando: c => em(c, 'multimilionaria', 'bilionaria'),
    titulo: 'O que fazer com tanto',
    texto: c => `Uma fundação de pesquisa médica, um programa de bolsas, hospitais no interior: os pedidos chegam toda semana. Com o que você tem (${fmt(pat(c))}), uma doação de verdade muda a vida de muita gente.`,
    opcoes: [
      { id: 'grande', texto: c => `Doar ${fmt(r1000(pat(c) * 0.05))} (5%)`, disponivel: c => (liq(c) >= pat(c) * 0.05 ? true : 'Não há tanto dinheiro à mão: quase tudo está em empresas e bens.'),
        resolver: c => ({ texto: 'Uma doação que virou prédio, bolsas e nome em placa. E cartas de quem foi ajudado.', memoria: `Doou ${fmt(r1000(pat(c) * 0.05))} a causas sociais.`, relevancia: 'marco', tom: 'bom', efeito: () => { perda(c, r1000(pat(c) * 0.05), 'a doação', { humor: false }); feliz(c, 6); } }) },
      { id: 'pequena', texto: c => `Doar ${fmt(r1000(pat(c) * 0.01))} (1%)`, disponivel: c => custa(c, r1000(pat(c) * 0.01)),
        resolver: c => ({ texto: 'Uma doação discreta, sem placa.', memoria: null, tom: 'bom', efeito: () => { perda(c, r1000(pat(c) * 0.01), 'a doação', { humor: false }); feliz(c, 2); } }) },
      { id: 'nao', texto: 'Agora não', resolver: () => ({ texto: 'Os pedidos foram para a pilha.', memoria: null }) }
    ]
  },
  {
    id: 'eco129_bi_megaprojeto', manual: true, tipo: 'decisao', idade: [30, 90], tema: 'dinheiro', repetir: 10,
    quando: c => em(c, 'bilionaria') && !temPendente(c.v, 'mega'),
    titulo: 'O megaprojeto',
    texto: c => `${['Uma cidade planejada no Centro-Oeste', 'Um porto e uma ferrovia para escoar grãos', 'Um fundo para financiar empresas de tecnologia do país inteiro'][rr(c, 'eco129_mega_q').int(0, 2)]}: os sócios querem ${fmt(mega(c))} seus. Se der certo, multiplica; se der errado, some.`,
    opcoes: [
      { id: 'entrar', texto: 'Entrar com tudo', comportamento: { coragem: 1 }, consequencia: () => 'Se faltar dinheiro à mão, vende participações e bens para entrar.',
        resolver: c => ({ texto: 'Assinou. Anos de obra, reunião e manchete pela frente.', memoria: 'Entrou num megaprojeto bilionário.', relevancia: 'marco', efeito: () => { const r = perda(c, mega(c), 'o megaprojeto', { vender: true, humor: false }); pendurar(c.v, 'mega', mega(c) - r.naoCoberto); } }) },
      { id: 'nao', texto: 'Ficar fora', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Ficou fora. Outros entraram.', memoria: null }) }
    ]
  },
  {
    id: 'eco129_bi_fisco', manual: true, tipo: 'decisao', idade: [25, 100], tema: 'dinheiro', repetir: 8,
    quando: c => em(c, 'multimilionaria', 'bilionaria'),
    titulo: 'A Receita bateu',
    texto: c => `A Receita questiona a estrutura das suas empresas e dos seus investimentos: um auto de infração de ${fmt(fisco(c))}. Os advogados acham que dá para contestar — e não prometem nada.`,
    opcoes: [
      { id: 'pagar', texto: 'Pagar e encerrar', disponivel: c => custa(c, fisco(c)),
        resolver: c => ({ texto: 'Pago. O assunto saiu da mesa.', memoria: null, efeito: () => { perda(c, fisco(c), 'o auto de infração', { vender: true }); } }) },
      { id: 'contestar', texto: 'Contestar', comportamento: { coragem: 1 },
        resolver: c => {
          const ganhou = rr(c, 'eco129_fisco').chance(0.5);
          const custo = ganhou ? r1000(fisco(c) * 0.05) : r1000(fisco(c) * 2.2);
          return { texto: ganhou ? `Anos de recurso e a vitória: ficaram os honorários (${fmt(custo)}).` : `Perdeu em todas as instâncias: ${fmt(custo)} com multa e juros.`, memoria: ganhou ? null : 'Perdeu uma disputa bilionária com a Receita.', tom: ganhou ? 'bom' : 'ruim', relevancia: ganhou ? 'cotidiano' : 'biografia', efeito: () => { perda(c, custo, ganhou ? 'os honorários da disputa com a Receita' : 'a autuação da Receita', { vender: true, endividar: true }); } };
        } }
    ]
  },
  {
    id: 'eco129_bi_vencimento', manual: true, tipo: 'decisao', idade: [25, 100], tema: 'dinheiro', repetir: 6,
    quando: c => em(c, 'milionaria', 'multimilionaria', 'bilionaria') && indicadores(c.v).iliquida && vencimento(c) > liq(c),
    titulo: 'O empréstimo que venceu',
    texto: c => `Um empréstimo pessoal grande, tomado com as suas participações de garantia, vence agora: ${fmt(vencimento(c))}. À mão, há ${fmt(liq(c))}. O resto está em empresas, imóveis e coleção.`,
    opcoes: [
      { id: 'vender', texto: 'Vender o que for preciso', consequencia: () => 'Venda às pressas: as participações, as peças, o imóvel que não é a casa — por menos do que valem.',
        resolver: c => ({ texto: 'Vendeu às pressas. O empréstimo foi pago; o patrimônio, menor.', memoria: 'Vendeu bens às pressas para pagar um empréstimo.', tom: 'ruim', efeito: () => { perda(c, vencimento(c), 'o empréstimo que venceu', { vender: true, endividar: true }); } }) },
      { id: 'rolar', texto: 'Rolar a dívida (três anos, juro alto)', consequencia: c => `Parcelas de uns ${fmt(Math.round(parcelaPrice(vencimento(c), 0.012, 36)))} por mês.`,
        resolver: c => ({ texto: 'O banco rolou — com juro de quem precisa.', memoria: null, efeito: () => novaDivida(c, vencimento(c), 0.012, 36, 'Empréstimo rolado') }) }
    ]
  },

  /* ============================================================== empresas */
  {
    id: 'eco129_emp_pedido', manual: true, tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 0, peso: 8,
    quando: c => !!comPedido(c),
    titulo: c => `${comPedido(c)!.nome} precisa de dinheiro`,
    texto: c => { const e = comPedido(c)!; return `O caixa de ${e.nome} acabou e os bancos não emprestam mais: a empresa precisa de ${fmt(e.corp!.pedido!.valor)} para seguir. ${e.anosNoVermelho >= 2 ? 'Mais um ano assim e vai à Justiça.' : 'Sem isso, entra em crise.'}`; },
    opcoes: [
      { id: 'aportar', texto: c => `Pôr ${fmt(comPedido(c)!.corp!.pedido!.valor)} do seu bolso`, disponivel: c => { const e = comPedido(c)!; const d = disponibilidadeEmpresa129(c.v, e, 'aportar', String(e.corp!.pedido!.valor)); return d.ok ? true : d.resgate ? { motivo: d.motivo!, resgate: d.resgate.valor } : d.motivo ?? false; },
        resolver: c => { const e = comPedido(c)!; return { texto: decidirEmpresa129(c.v, e, 'aportar', String(e.corp!.pedido!.valor)), memoria: null }; } },
      { id: 'investidores', texto: 'Trazer investidores (a sua parte dilui)', disponivel: c => { const d = disponibilidadeEmpresa129(c.v, comPedido(c)!, 'investidores'); return d.ok ? true : d.motivo ?? false; },
        resolver: c => ({ texto: decidirEmpresa129(c.v, comPedido(c)!, 'investidores'), memoria: null }) },
      { id: 'cortar', texto: 'Cancelar o projeto mais caro', disponivel: c => ((comPedido(c)!.corp!.projetos.some(p => p.estado === 'desenvolvimento')) ? true : 'Não há projeto em andamento para cancelar.'),
        resolver: c => { const e = comPedido(c)!; const p = [...e.corp!.projetos.filter(x => x.estado === 'desenvolvimento')].sort((a, b) => (b.orcamento - b.investido) - (a.orcamento - a.investido))[0]; return { texto: decidirEmpresa129(c.v, e, 'descontinuar', p.id), memoria: null, tom: 'ruim' }; } },
      { id: 'nada', texto: 'Não fazer nada', consequencia: () => 'A empresa segue no vermelho: crise, recuperação judicial, talvez falência.', resolver: () => ({ texto: 'Nada foi feito. O vermelho segue.', memoria: null, tom: 'ruim' }) }
    ]
  },
  {
    id: 'eco129_emp_proposta', manual: true, tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => !!cobicada(c),
    titulo: c => `Querem comprar ${cobicada(c)!.nome}`,
    texto: c => { const e = cobicada(c)!; const quem = rivalQueChama(e, e.nome); return `${quem ? `A concorrente ${quem}` : 'Um grupo maior'} quer comprar ${e.nome}. Pela sua parte, oferecem ${fmt(premio(c, e))} — acima do que o mercado diria que ela vale (${fmt(valorDaParte(e))}).`; },
    opcoes: [
      { id: 'vender', texto: 'Vender', consequencia: () => 'O dinheiro na conta; a empresa deixa de ser sua.',
        resolver: c => { const e = cobicada(c)!; const p = premio(c, e); const quem = rivalQueChama(e, e.nome); return { texto: `Vendida por ${fmt(p)}${quem ? ` à concorrente ${quem}` : ''}.`, memoria: `Vendeu ${e.nome} por ${fmt(p)}${quem ? ` à concorrente ${quem}` : ''}.`, relevancia: 'marco', tom: 'bom', efeito: () => { receberGanho(c.v, p, `A venda de ${e.nome}`); e.estado = 'encerrada'; e.tFim = c.v.t; (e.historia ??= []).push({ t: c.v.t, texto: `Vendida por ${fmt(p)}.` }); c.v.financas.empresas = (c.v.financas.empresas ?? []).filter(x => x.id !== e.id); } }; } },
      { id: 'recusar', texto: 'Recusar: não está à venda', resolver: c => ({ texto: `${cobicada(c)!.nome} continua sua.`, memoria: null }) }
    ]
  },
  {
    id: 'eco129_emp_diretor', manual: true, tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 3,
    quando: c => !!diretorCobicado(c),
    titulo: 'Querem levar a sua diretoria',
    texto: c => { const { e, d } = diretorCobicado(c)!; return `${d.nome}, da ${NOME_CARGO[d.cargo].toLowerCase()} de ${e.nome}, recebeu uma proposta ${rivalQueChama(e, d.nome) ? `da concorrente ${rivalQueChama(e, d.nome)}` : 'de uma concorrente'}: 40% a mais.`; },
    opcoes: [
      { id: 'cobrir', texto: 'Cobrir a proposta', consequencia: c => `O salário passa a uns ${fmt(Math.round(diretorCobicado(c)!.d.salario * 1.4))} por mês.`,
        resolver: c => { const { d } = diretorCobicado(c)!; return { texto: `${d.nome} ficou.`, memoria: null, efeito: () => { d.salario = Math.round(d.salario * 1.4); d.t = c.v.t - 24; } }; } },
      { id: 'deixar', texto: 'Deixar ir', resolver: c => { const { e, d } = diretorCobicado(c)!; return { texto: `${d.nome} saiu de ${e.nome} e foi para ${rivalQueChama(e, d.nome) ? `a concorrente ${rivalQueChama(e, d.nome)}` : 'a concorrência'}. O cargo ficou vago.`, memoria: null, tom: 'ruim', efeito: () => { e.executivos = (e.executivos ?? []).filter(x => x !== d); } }; } }
    ]
  }
];
