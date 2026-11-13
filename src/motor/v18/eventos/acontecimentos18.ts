/**
 * VIDA 18 · OS ACONTECIMENTOS DO CAMPO E DO PRÊMIO — decisões que só abrem quando o estado pede (um fato do ano):
 *
 *   premio18          o prêmio grande caiu na conta: o que fazer com ele (aplicar com calma, mudar de vida, dividir com a
 *                     família, guardar segredo). O dinheiro já entrou UMA vez; aqui ele só muda de lugar.
 *   premio18_pedido   os pedidos que vêm depois (o parente, o amigo de infância); premio18_convite, as aproximações e os
 *                     "negócios"; premio18_bolao, a cota de bolão que alguém diz ter pago; premio18_acabou, o dinheiro que
 *                     foi embora.
 *   rural18_herdou    a terra que ficou de herança: continuar a atividade, arrendar, vender ou guardar para a família.
 *   rural18_prejuizo  o ano no vermelho na propriedade.
 *   rural18_infancia  (acontecimento) as férias e os fins de semana na terra da família, para quem cresce perto dela.
 */
import type { Conteudo, Ctx } from '../../conteudo/base';
import type { Vida } from '../../tipos';
import { estresse, feliz, fato } from '../../conteudo/efeitos';
import { clamp } from '../../rng';
import { parceiro, vinculosVivos } from '../../nucleo';
import { dinheiro as fmt } from '../../texto';
import { aplicar } from '../../sistemas/investimentos';
import { lancar } from '../../sistemas/extrato';
import { estadoApostas18 } from '../apostas/estado18';
import { acharPropriedade, todasAsPropriedades } from '../rural/fazenda18';
import { executarRural18 } from '../rural/acoes18';
import { valorDeVendaImovel } from '../../sistemas/imoveis';

const ultimoDe = (p: { historico: { resultado: number }[] }) => p.historico[p.historico.length - 1];
const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] === c.v.t;
const premio = (c: Ctx) => c.v.apostas18?.premio;
const familia = (c: Ctx) => vinculosVivos(c.v).filter(x => ['mae', 'pai', 'irmao', 'filho'].includes(x.vin.parentesco ?? '') && !x.p.especie);
/**
 * Os papéis são `fixo` (já em ordem, sem gastar o gerador do ano: `conteudo/motor` só sorteia papel que não é fixo) e
 * vazios fora do ano do fato — o catálogo inteiro passa por aqui todo ano, e nenhuma vida pode ter o acaso mexido por isso.
 */
const fixo = <T extends (v: Vida) => unknown[]>(f: T) => Object.assign(f, { fixo: true });
const quemPede = fixo((v: Vida) => (v.fatos['premio18_pedido'] !== v.t ? [] : vinculosVivos(v).filter(x => (x.vin.parentesco || x.vin.proximidade >= 40) && !x.p.especie).sort((a, b) => b.vin.proximidade - a.vin.proximidade || a.p.id.localeCompare(b.p.id)).map(x => x.p)));
const tirar = (c: Ctx, valor: number, rotulo: string) => { c.v.financas.conta -= valor; lancar(c.v, rotulo, 'escolha', -valor); };

/** A terra herdada que ainda espera decisão. */
const terraHerdada = (c: Ctx) => todasAsPropriedades(c.v).find(x => x.imovel?.herdado && c.v.fatos[`rural18_decidiu_${x.imovel.id}`] === undefined)?.imovel;

export const ACONTECIMENTOS_18: Conteudo[] = [
  {
    id: 'premio18', tipo: 'decisao', idade: [18, 110], tema: 'dinheiro', prioritario: true, prioridade: 4, repetir: 1,
    quando: c => deHoje(c, 'premio18') && !!premio(c),
    titulo: 'O prêmio',
    texto: c => { const p = premio(c)!; const par = parceiro(c.v); return `${fmt(p.valor)}. O gerente do banco ligou antes de você terminar de ler o extrato. ${par ? `${par.p.nome} não para de rir. ` : ''}Ninguém ensina o que fazer com isso — e todo mundo vai ter uma opinião.`; },
    opcoes: [
      { id: 'aplicar', texto: 'Aplicar quase tudo com calma (um assessor, renda fixa e diversificação) e viver dos rendimentos', comportamento: { disciplina: 2 },
        consequencia: c => `${fmt(Math.round(premio(c)!.valor * 0.75))} vão para aplicações; a vida muda devagar.`,
        resolver: c => ({ texto: 'Você assinou uma pilha de papéis, dividiu o dinheiro em quatro aplicações e marcou de não decidir mais nada grande por seis meses.', memoria: 'Aplicou o prêmio com calma.', relevancia: 'biografia', efeito: () => { const p = premio(c)!; const x = Math.min(c.v.financas.conta, Math.round(p.valor * 0.75)); aplicar(c.v, 'pos_fixado', Math.round(x * 0.5)); aplicar(c.v, 'inflacao', Math.round(x * 0.3)); aplicar(c.v, 'multimercado', Math.round(x * 0.2)); p.destino = 'aplicar'; estresse(c, -4); } }) },
      { id: 'gastar', texto: 'Mudar de vida já: a casa, o carro, as viagens, os presentes', comportamento: { impulsividade: 2 },
        consequencia: c => `Uns ${fmt(Math.round(premio(c)!.valor * 0.4))} vão embora no primeiro ano.`,
        resolver: c => ({ texto: 'Um ano de sim: a festa, a viagem que sempre adiou, presentes para quem nem esperava. Foi bom — e foi rápido.', memoria: 'Gastou boa parte do prêmio no primeiro ano.', relevancia: 'biografia', tom: 'bom', efeito: () => { const p = premio(c)!; tirar(c, Math.min(c.v.financas.conta, Math.round(p.valor * 0.4)), 'Os gastos do prêmio'); p.destino = 'gastar'; feliz(c, 10); } }) },
      { id: 'familia', texto: 'Dividir uma parte com a família (pais e irmãos)', comportamento: { empatia: 2 }, disponivel: c => (familia(c).length ? true : 'Não há família por perto para dividir.'),
        consequencia: c => `${fmt(Math.round(premio(c)!.valor * 0.2))} divididos entre ${familia(c).length} ${familia(c).length === 1 ? 'pessoa' : 'pessoas'}.`,
        resolver: c => ({ texto: 'Você chamou todo mundo para um almoço e entregou os envelopes. A sua mãe chorou; um irmão achou pouco.', memoria: 'Dividiu parte do prêmio com a família.', relevancia: 'biografia', tom: 'bom', efeito: () => { const p = premio(c)!; const xs = familia(c); const total = Math.min(c.v.financas.conta, Math.round(p.valor * 0.2)); const parte = Math.floor(total / xs.length); for (const x of xs) { (x.p.posses ??= { dinheiro: 0, bens: [], historia: [] }).dinheiro += parte; x.p.posses.historia.push({ t: c.v.t, texto: 'Presente do prêmio', valor: parte }); x.vin.proximidade = clamp(x.vin.proximidade + 6); } tirar(c, parte * xs.length, 'Presentes do prêmio à família'); p.destino = 'familia'; feliz(c, 5); } }) },
      { id: 'segredo', texto: 'Não contar a ninguém e seguir a vida como estava', comportamento: { independencia: 1 },
        consequencia: () => 'Menos pedidos. E um segredo grande para guardar.',
        resolver: c => ({ texto: 'Você guardou o bilhete, o extrato e a notícia. No trabalho, ninguém percebeu nada — por enquanto.', memoria: null, efeito: () => { premio(c)!.destino = 'segredo'; estresse(c, 3); } }) }
    ]
  },
  {
    id: 'premio18_pedido', tipo: 'decisao', idade: [18, 110], tema: 'familia', prioritario: true, prioridade: 2, repetir: 6,
    papeis: { pede: quemPede },
    quando: c => deHoje(c, 'premio18_pedido') && !!premio(c) && premio(c)!.destino !== 'segredo' && !!c.p.pede,
    titulo: 'O pedido',
    texto: c => { const p = c.p.pede; const valor = Math.round(premio(c)!.valor * 0.03 / 1000) * 1000; return `${p.nome} apareceu com um assunto ensaiado: uma dívida, um negócio, uma reforma. Precisa de ${fmt(valor)}. "Para você não é nada", disse, e o "nada" ficou na mesa.`; },
    opcoes: [
      { id: 'dar', texto: 'Ajudar', comportamento: { empatia: 1 }, disponivel: c => (c.v.financas.conta >= Math.round(premio(c)!.valor * 0.03 / 1000) * 1000 ? true : 'Não há esse dinheiro na conta.'),
        resolver: c => ({ texto: 'Você fez a transferência na hora. Ficou o alívio dela — e a certeza de que outros vão saber.', memoria: null, efeito: () => { const v = Math.round(premio(c)!.valor * 0.03 / 1000) * 1000; tirar(c, v, `Ajuda a ${c.p.pede.nome}`); const vin = c.v.vinculos[c.p.pede.id]; if (vin) vin.proximidade = clamp(vin.proximidade + 5); (c.p.pede.posses ??= { dinheiro: 0, bens: [], historia: [] }).dinheiro += v; } }) },
      { id: 'emprestar', texto: 'Emprestar, com prazo combinado',
        resolver: c => ({ texto: 'Um papel simples, assinado pelos dois. Combinaram de pagar em dois anos. Vocês dois sabiam que talvez não.', memoria: null, efeito: () => { const v = Math.round(premio(c)!.valor * 0.03 / 1000) * 1000; tirar(c, v, `Empréstimo a ${c.p.pede.nome}`); (c.p.pede.posses ??= { dinheiro: 0, bens: [], historia: [] }).dinheiro += v; } }) },
      { id: 'recusar', texto: 'Dizer não', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Você explicou que o dinheiro tinha destino. A conversa acabou educada. A próxima reunião de família, menos.', memoria: null, efeito: () => { const vin = c.v.vinculos[c.p.pede.id]; if (vin) { vin.tensao = clamp(vin.tensao + 15); vin.proximidade = clamp(vin.proximidade - 6); } estresse(c, 3); } }) }
    ]
  },
  {
    id: 'premio18_convite', tipo: 'decisao', idade: [18, 110], tema: 'dinheiro', prioritario: true, prioridade: 1, repetir: 4,
    quando: c => deHoje(c, 'premio18_convite') && !!premio(c) && premio(c)!.destino !== 'segredo',
    titulo: 'Gente nova',
    texto: () => 'Desde o prêmio, os convites não param: uma festa num clube que nunca te chamou, um "amigo de um amigo" com um negócio que "não tem como dar errado", uma ONG, uma igreja nova, um primo distante que achou o seu número.',
    opcoes: [
      { id: 'negocio', texto: 'Entrar no negócio do conhecido', comportamento: { impulsividade: 1, coragem: 1 },
        resolver: c => { const valor = Math.min(c.v.financas.conta, Math.round(premio(c)!.valor * 0.1 / 1000) * 1000); const deu = c.r.chance(0.3); return { texto: deu ? 'Contra todas as previsões, o negócio andou: um retorno modesto, mas real.' : 'Seis meses depois, o sócio sumiu com o CNPJ e o dinheiro. O advogado disse que dá para tentar, mas que não conte com isso.', memoria: deu ? null : 'Perdeu dinheiro num negócio de um conhecido depois do prêmio.', relevancia: deu ? 'cotidiano' : 'biografia', tom: deu ? 'bom' : 'ruim', efeito: () => { tirar(c, valor, 'O negócio do conhecido'); if (deu) { c.v.financas.conta += Math.round(valor * 1.3); lancar(c.v, 'O negócio do conhecido (retorno)', 'escolha', Math.round(valor * 1.3)); } else estresse(c, 8); } }; } },
      { id: 'doar', texto: 'Escolher uma causa e doar com critério', comportamento: { empatia: 2 },
        resolver: c => ({ texto: 'Você pesquisou, visitou, escolheu uma causa só. A doação veio com recibo e com uma visita que você não esqueceu.', memoria: 'Fez uma doação grande depois do prêmio.', relevancia: 'biografia', tom: 'bom', efeito: () => { tirar(c, Math.min(c.v.financas.conta, Math.round(premio(c)!.valor * 0.03 / 1000) * 1000), 'Doação'); feliz(c, 5); } }) },
      { id: 'festas', texto: 'Aproveitar as festas, sem assinar nada', resolver: c => ({ texto: 'Você foi, comeu bem, conheceu gente. E não assinou nada.', memoria: null, efeito: () => { feliz(c, 3); } }) },
      { id: 'fechar', texto: 'Fechar a porta: número novo, só a gente de antes', comportamento: { independencia: 1 }, resolver: c => ({ texto: 'Chip novo, perfil fechado. Ficou mais quieto — e um pouco mais sozinho.', memoria: null, efeito: () => { estresse(c, -3); } }) }
    ]
  },
  {
    id: 'premio18_bolao', tipo: 'decisao', idade: [18, 110], tema: 'amizade', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { quem: fixo((v: Vida) => (v.fatos['premio18_bolao'] !== v.t ? [] : (v.apostas18?.premio?.pessoas ?? []).map(id => v.pessoas[id]).filter(p => p?.vivo))) },
    quando: c => deHoje(c, 'premio18_bolao') && !!c.p.quem,
    titulo: 'A cota do bolão',
    texto: c => `${c.p.quem.nome} diz que entrou no bolão com mais duas cotas, pagas em dinheiro, "lembra?". Não está no papel. A parte que diz ser dela dá ${fmt(Math.round(premio(c)!.valor * 0.25 / 1000) * 1000)}.`,
    opcoes: [
      { id: 'pagar', texto: 'Pagar o que ela diz (paz na turma)', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'Você pagou. A turma voltou a se falar; você nunca soube se ela tinha razão.', memoria: null, efeito: () => { const v = Math.min(c.v.financas.conta, Math.round(premio(c)!.valor * 0.25 / 1000) * 1000); tirar(c, v, 'Acerto do bolão'); (c.p.quem.posses ??= { dinheiro: 0, bens: [], historia: [] }).dinheiro += v; } }) },
      { id: 'papel', texto: 'Ficar com o que está no papel', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Você mostrou o comprovante das cotas. A amizade não sobreviveu ao comprovante.', memoria: 'Brigou com um amigo por causa do bolão premiado.', relevancia: 'biografia', tom: 'ruim', efeito: () => { const vin = c.v.vinculos[c.p.quem.id]; if (vin) { vin.tensao = clamp(vin.tensao + 35); vin.proximidade = clamp(vin.proximidade - 25); } } }) },
      { id: 'meio', texto: 'Propor a metade', resolver: c => ({ texto: 'Metade. Ela aceitou, de cara feia. É o que se chama de acordo.', memoria: null, efeito: () => { const v = Math.min(c.v.financas.conta, Math.round(premio(c)!.valor * 0.125 / 1000) * 1000); tirar(c, v, 'Acerto do bolão'); (c.p.quem.posses ??= { dinheiro: 0, bens: [], historia: [] }).dinheiro += v; const vin = c.v.vinculos[c.p.quem.id]; if (vin) vin.tensao = clamp(vin.tensao + 8); } }) }
    ]
  },
  {
    id: 'premio18_acabou', tipo: 'decisao', idade: [18, 110], tema: 'dinheiro', prioritario: true, prioridade: 2, repetir: 1,
    quando: c => deHoje(c, 'premio18_acabou') && !!premio(c),
    titulo: 'Onde foi parar',
    texto: c => `Faz ${Math.floor((c.v.t - premio(c)!.t) / 12)} anos do prêmio de ${fmt(premio(c)!.valor)}. Sobrou quase nada. As despesas da vida nova continuam chegando como se ele ainda existisse.`,
    opcoes: [
      { id: 'cortar', texto: 'Cortar tudo e voltar ao tamanho de antes', comportamento: { disciplina: 2 }, resolver: c => ({ texto: 'Você vendeu o que dava, cancelou o que pesava e voltou a contar o mês. Doeu menos do que o medo de doer.', memoria: 'Viu o dinheiro do prêmio acabar e recomeçou.', relevancia: 'biografia', efeito: () => { estresse(c, 4); } }) },
      { id: 'negar', texto: 'Esperar que as coisas se ajeitem', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'O cartão foi segurando. Por um tempo.', memoria: null, tom: 'ruim', efeito: () => { estresse(c, 8); } }) }
    ]
  },
  {
    id: 'rural18_herdou', tipo: 'decisao', idade: [18, 110], tema: 'familia', prioritario: true, prioridade: 3, repetir: 4,
    quando: c => deHoje(c, 'rural18_herdou') && !!terraHerdada(c),
    titulo: 'A terra que ficou',
    texto: c => { const b = terraHerdada(c)!; return `${b.nome} agora é sua: ${b.rural!.ha.toLocaleString('pt-BR')} hectares, a casa onde se passavam os fins de semana, o que a família plantou por anos. Os vizinhos perguntam o que você vai fazer.`; },
    opcoes: [
      { id: 'tocar', texto: 'Continuar o que a família fazia: viver da terra', comportamento: { coragem: 1 }, disponivel: c => (c.v.trabalho.atual?.ocupacaoId === 'produtor_rural' ? 'Você já vive de produzir: a terra entra na conta da sua produção.' : true),
        resolver: c => ({ texto: 'Você largou o que fazia e foi para a terra. No primeiro ano, os vizinhos ensinaram mais do que qualquer curso.', memoria: 'Assumiu a terra da família.', relevancia: 'marco', efeito: () => { const b = terraHerdada(c)!; c.v.fatos[`rural18_decidiu_${b.id}`] = c.v.t; b.rural!.uso = 'producao'; executarRural18(c.v, c.r, { op: 'tocar', id: b.rural!.id }); } }) },
      { id: 'gerente', texto: 'Manter a produção com um gerente, sem largar a sua vida', resolver: c => ({ texto: 'Um gerente de confiança, uma visita por mês, as contas por mensagem.', memoria: 'Manteve a terra da família produzindo, com um gerente.', relevancia: 'biografia', efeito: () => { const b = terraHerdada(c)!; c.v.fatos[`rural18_decidiu_${b.id}`] = c.v.t; b.rural!.uso = 'producao'; } }) },
      { id: 'arrendar', texto: 'Arrendar para um vizinho', resolver: c => ({ texto: 'O vizinho que sempre quis aquela terra pagou o primeiro ano adiantado.', memoria: 'Arrendou a terra herdada.', relevancia: 'biografia', efeito: () => { const b = terraHerdada(c)!; c.v.fatos[`rural18_decidiu_${b.id}`] = c.v.t; executarRural18(c.v, c.r, { op: 'arrendar_para', id: b.rural!.id }); } }) },
      { id: 'vender', texto: 'Vender e seguir a própria carreira', comportamento: { independencia: 1 }, disponivel: c => (terraHerdada(c)!.bloqueio ? 'A Justiça bloqueou o imóvel.' : true),
        consequencia: c => `Cerca de ${fmt(valorDeVendaImovel(terraHerdada(c)!))}.`,
        resolver: c => ({ texto: 'A escritura passou para outro nome. Você ficou com o dinheiro e com uma foto da porteira.', memoria: 'Vendeu a terra que herdou.', relevancia: 'marco', efeito: () => { const b = terraHerdada(c)!; const v = valorDeVendaImovel(b); c.v.financas.conta += v; lancar(c.v, `Venda: ${b.nome}`, 'escolha', v); c.v.financas.bens = c.v.financas.bens.filter(x => x.id !== b.id); if (c.v.moradia.imovelId === b.id) c.v.moradia.imovelId = undefined; } }) },
      { id: 'guardar', texto: 'Guardar como lugar da família (fins de semana, férias)', resolver: c => ({ texto: 'A terra fica parada, a casa fica aberta. Os netos vão conhecer o lugar.', memoria: null, efeito: () => { const b = terraHerdada(c)!; c.v.fatos[`rural18_decidiu_${b.id}`] = c.v.t; b.rural!.uso = 'residencia'; } }) }
    ]
  },
  {
    id: 'rural18_prejuizo', tipo: 'decisao', idade: [18, 110], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 3,
    quando: c => deHoje(c, 'rural18_prejuizo') && todasAsPropriedades(c.v).some(x => x.p.uso === 'producao'),
    titulo: 'Um ano no vermelho',
    texto: c => { const x = todasAsPropriedades(c.v).filter(y => y.p.uso === 'producao').sort((a, b) => (ultimoDe(a.p)?.resultado ?? 0) - (ultimoDe(b.p)?.resultado ?? 0))[0]; return `${x.p.nome} fechou o ano devendo: ${fmt(-(ultimoDe(x.p)?.resultado ?? 0))}. O técnico da cooperativa olhou a planilha e perguntou o que você pretende mudar.`; },
    opcoes: [
      { id: 'enxugar', texto: 'Enxugar: menos área plantada, rebanho do tamanho do pasto', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você vendeu o excesso do rebanho e deixou a área mais fraca descansar.', memoria: null, efeito: () => { for (const { p } of todasAsPropriedades(c.v)) for (const rb of p.rebanhos) if (rb.estrategia === 'crescer') rb.estrategia = 'manter'; } }) },
      { id: 'cooperativa', texto: 'Entrar para a cooperativa (assistência técnica, compra conjunta)', disponivel: c => (todasAsPropriedades(c.v).some(x => x.p.uso === 'producao' && !x.p.cooperativa) ? true : false),
        resolver: c => ({ texto: 'Na cooperativa, o insumo veio mais barato e o técnico passou a visitar.', memoria: 'Entrou para a cooperativa depois de um ano ruim.', efeito: () => { const x = todasAsPropriedades(c.v).find(y => y.p.uso === 'producao' && !y.p.cooperativa); if (x) x.p.cooperativa = true; } }) },
      { id: 'seguro', texto: 'Fazer seguro rural daqui para a frente', resolver: c => ({ texto: 'O seguro custa, mas o próximo ano ruim não leva tudo.', memoria: null, efeito: () => { for (const { p } of todasAsPropriedades(c.v)) if (p.uso === 'producao') p.seguro = true; } }) },
      { id: 'aguentar', texto: 'Aguentar: a terra dá e tira', resolver: c => ({ texto: 'Você apertou o cinto e esperou a próxima chuva.', memoria: null, efeito: () => estresse(c, 5) }) }
    ]
  },
  {
    id: 'rural18_infancia', tipo: 'acontecimento', idade: [5, 15], tema: 'familia', repetir: 3, peso: 0.5,
    quando: c => Object.values(c.v.pessoas).some(p => p.vivo && p.posses?.bens.some(b => b.tipo === 'imovel' && b.rural) && ['mae', 'pai', 'avo'].includes(c.v.vinculos[p.id]?.parentesco ?? '')),
    narrar: c => {
      const dono = Object.values(c.v.pessoas).find(p => p.vivo && p.posses?.bens.some(b => b.tipo === 'imovel' && b.rural))!;
      const b = dono.posses!.bens.find(x => x.tipo === 'imovel' && x.rural)!;
      fato(c, 'cresceu_no_campo');
      return { texto: c.r.pick([`As férias em ${b.nome}: tirar leite de manhã cedo, subir no pé de manga, voltar com o joelho ralado e a roupa vermelha de terra.`, `${dono.nome} deixou você ajudar na colheita. Ganhou um chapéu de palha e uma bolha na mão, e voltou para casa contando para todo mundo.`, `Um bezerro nasceu em ${b.nome} numa noite de chuva, e você ficou acordado para ver. Escolheu o nome dele.`]), relevancia: 'biografia', tom: 'bom' };
    }
  }
];

export { acharPropriedade, estadoApostas18 };
