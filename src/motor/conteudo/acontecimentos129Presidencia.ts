/**
 * VIDA 12.9 · A PRESIDÊNCIA EM CENAS (`sistemas/presidencia129` faz as contas; aqui, as decisões):
 *
 *   presc_campanha   a corrida: a indicação (convenção ou primárias), a chapa, o eixo, a estratégia, o debate, a reta final
 *   prest_segundo_turno  a última semana antes do segundo turno — e a apuração
 *   presg_*          o governo do país: os eixos, a reforma, a base no Congresso, a política econômica, o mundo, as crises
 *   presi_impeachment    o processo de afastamento, casa por casa
 *   presd_depois     o que fazer depois da Presidência
 *   presx_independente   a candidatura sem partido (onde a lei deixa)
 *   govg_crise       as crises do ESTADO (a polícia, a rodovia, o hospital regional, o repasse, a chuva no interior, o presídio)
 *
 * Nada tem lado: as decisões são sobre COMO governar e fazer campanha (com quem, com que prioridade, com que método),
 * nunca sobre o que defender ideologicamente. Partidos reais só pelo nome; adversários, crises e números são simulação.
 */
import type { Conteudo, Ctx, Opcao, Resultado } from './base';
import { clamp, rngDe } from '../rng';
import { escrever, parceiro } from '../nucleo';
import { custa, estresse, feliz, local } from './efeitos';
import { pagar } from '../sistemas/dinheiro';
import { marcar } from '../sistemas/marcas';
import { abalar } from '../sistemas/abalo';
import { habilidade } from '../sistemas/frentes';
import { municipio } from '../dados/lugares';
import { sortearNome, sortearSobrenome } from '../dados/nomes';
import { oPartido, partidoDe } from '../dados/partidos';
import { paisDaVida } from '../mundo/vida';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import {
  apurar, basePartidaria, criarAliado, eleicaoNaJanela, encerrarVidaPolitica, nomeCargo, nomePublico, registrarNoMandato, renunciar, voltarAoTrabalho
} from '../sistemas/politica';
import {
  EIXOS_129, POLITICAS_129, REFORMAS_129, aliviar, anotarPesquisa, chanceEmPalavras, chancePresidencial, desgastar, doAdversario,
  encerrarCorrida, governoAtual, julgarImpeachment, liderAdversario, pesquisaEmTexto, posicaoNaPesquisa, presidencia,
  regraDaPresidencia, registrarIndependente, type Eixo129, type Reforma129
} from '../sistemas/presidencia129';
import type { PoliticaEconomica129 } from '../dados/presidencia129';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pol = (c: Ctx) => c.v.caminhos.politica!;
const camp = (c: Ctx) => c.v.caminhos.politica?.presidencia?.campanha;
const etapa = (c: Ctx) => camp(c)?.etapa ?? -1;
const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] !== undefined && c.v.fatos[chave] === c.v.t;
const nomeNacional = (c: Ctx) => Math.max(pol(c).reputacao, nomePublico(c.v));
const sig = (x: number) => 1 / (1 + Math.exp(-x));
const presidente = (c: Ctx) => nomeCargo(c.v, 'presidente');

/** Um passo da campanha: a nota (o que a campanha soma na urna), a etapa seguinte, a pesquisa nova. */
function passo(c: Ctx, nota: number, f?: (x: NonNullable<ReturnType<typeof camp>>) => void): void {
  const x = camp(c);
  const pc = pol(c).campanha;
  if (!x || !pc) return;
  f?.(x);
  pc.nota += nota;
  x.etapa += 1;
  anotarPesquisa(c.v);
}

/** Quanto subiu ou caiu na pesquisa com o passo (para o texto do resultado). */
function variacao(c: Ctx): string {
  const h = camp(c)?.pesquisas ?? [];
  if (h.length < 2) return '';
  const d = Math.round((h[h.length - 1] - h[h.length - 2]) * 10) / 10;
  return Math.abs(d) < 0.5 ? ' Na pesquisa seguinte, tudo igual.' : d > 0 ? ` Na pesquisa seguinte, você subiu ${String(d).replace('.', ',')} pontos.` : ` Na pesquisa seguinte, você caiu ${String(-d).replace('.', ',')} pontos.`;
}

/** A bandeira de sempre e o eixo da campanha combinam? */
const EIXO_DA_BANDEIRA: Record<string, Eixo129> = { saude: 'educacao_saude', educacao: 'educacao_saude', mobilidade: 'infraestrutura', emprego: 'economia', contas: 'economia', seguranca: 'seguranca', ambiente: 'ambiente', cultura: 'social' };

type Reta = 'denuncia' | 'fake' | 'apoio' | 'adversario' | 'economia';
function retaDe(c: Ctx): Reta {
  const x = camp(c);
  const lista: Reta[] = ['denuncia', 'fake', 'apoio', 'adversario', ...(c.v.economia?.fase === 'crise' || c.v.economia?.fase === 'desaceleracao' ? ['economia' as const] : [])];
  return rngDe(c.v.id, 'pres_reta', x?.ano ?? 0).pick(lista);
}

const ok = (o: Opcao): Opcao => o;

/* ================================================================ A campanha */

const ETAPA_0: Opcao[] = [
  ok({ id: 'previas', texto: c => (camp(c)?.via === 'primarias' ? 'Disputar as primárias estado por estado' : 'Disputar as prévias voto a voto com a militância'), comportamento: { coragem: 1 },
    disponivel: c => etapa(c) === 0,
    consequencia: c => `Quem decide é a base do partido: o seu nome no país (${nomeNacional(c) >= 60 ? 'forte' : nomeNacional(c) >= 45 ? 'razoável' : 'fraco'}) e o seu lugar dentro dele pesam. Perder é ficar fora da corrida.`,
    resolver: c => {
      const ch = sig((basePartidaria(c.v) + nomeNacional(c) * 0.5 - 45) / 12);
      const deu = c.r.chance(ch);
      const rival = camp(c)?.rival ?? 'o outro nome';
      if (!deu) return { texto: `${rival} venceu ${camp(c)?.via === 'primarias' ? 'as primárias' : 'as prévias'}. Você subiu ao palco para levantar o braço de quem ganhou.`, memoria: null, tom: 'ruim', efeito: () => { encerrarCorrida(c.v, 'preterido', `Perdeu ${camp(c)?.via === 'primarias' ? 'as primárias' : 'as prévias do partido'}: a vaga para ${presidente(c)} ficou com ${rival}.`); abalar(c.v, 'a indicação perdida', -6, 4); } };
      return { texto: `Venceu ${camp(c)?.via === 'primarias' ? 'as primárias, estado por estado' : 'as prévias'}: ${rival} reconheceu no fim da noite. O nome do partido para ${presidente(c)} é o seu.`, memoria: null, reabrir: true, tom: 'bom', efeito: () => { passo(c, 4); estresse(c, 4); } };
    } }),
  ok({ id: 'acordo', texto: c => (camp(c)?.via === 'primarias' ? 'Costurar o apoio dos caciques e dos grandes doadores' : 'Costurar a indicação com a direção do partido'), disponivel: c => etapa(c) === 0,
    consequencia: () => 'Sem disputa aberta: o que pesa é o seu lugar no partido. A conta vem depois, em cargos.',
    resolver: c => {
      const p = pol(c);
      const deu = c.r.chance(sig((basePartidaria(c.v) * 1.2 + p.apoio * 0.3 - 40) / 10));
      const rival = camp(c)?.rival ?? 'o outro nome';
      if (!deu) return { texto: `A direção fechou com ${rival}. Ninguém precisou votar.`, memoria: null, tom: 'ruim', efeito: () => encerrarCorrida(c.v, 'preterido', `O partido escolheu ${rival} para disputar ${presidente(c)}; a indicação não foi sua.`) };
      return { texto: `Três jantares e uma promessa de espaço no governo: a direção fechou com você, e ${rival} aceitou ser coordenador da campanha.`, memoria: null, reabrir: true, efeito: () => { desgastar(p, 3, 'partido'); c.v.fatos['pol_divida'] = c.v.t; passo(c, 2); } };
    } }),
  ok({ id: 'desistir', texto: c => `Abrir mão e apoiar ${camp(c)?.rival ?? 'o outro nome'}`, disponivel: c => etapa(c) === 0,
    resolver: c => ({ texto: 'Você anunciou o apoio numa entrevista curta. No partido, ganhou gratidão; no país, ninguém soube.', memoria: null, efeito: () => { aliviar(pol(c), 4, ['partido']); encerrarCorrida(c.v, 'desistiu', `Abriu mão da candidatura a ${presidente(c)} em ${camp(c)?.ano ?? anoDe(c.v.t)} e apoiou ${camp(c)?.rival ?? 'outro nome do partido'}.`); } }) })
];

const ETAPA_1: Opcao[] = [
  ok({ id: 'chapa_partido', texto: 'Um nome do seu partido, de confiança', disponivel: c => etapa(c) === 1,
    consequencia: () => 'Lealdade garantida; poucos votos a mais e menos cadeiras no Congresso, se ganhar.',
    resolver: c => { const x = vice(c); return { texto: `${x.nome}, ${x.fem ? 'companheira' : 'companheiro'} de anos no partido, vai na chapa: ninguém vai trair você no segundo ano.`, memoria: null, reabrir: true, efeito: () => passo(c, 2, y => { y.chapa = 'partido'; y.vice = x.nome; }) }; } }),
  ok({ id: 'chapa_coligacao', texto: 'Um vice de outro partido grande: palanques e tempo de TV', comportamento: { sociabilidade: 1 }, disponivel: c => etapa(c) === 1,
    consequencia: () => 'Mais votos e uma base maior no Congresso, se ganhar; a militância torce o nariz.',
    resolver: c => { const x = vice(c); return { texto: `A coligação saiu numa madrugada de hotel: tempo de TV dobrado, palanque em quase todos os estados — e ${x.nome} na vice, ${x.fem ? 'uma aliada' : 'um aliado'} que você mal conhece.`, memoria: null, reabrir: true, efeito: () => { desgastar(pol(c), 3, 'partido'); passo(c, 6, y => { y.chapa = 'coligacao'; y.vice = x.nome; }); } }; } }),
  ok({ id: 'chapa_tecnica', texto: 'Um nome técnico, respeitado na economia', disponivel: c => etapa(c) === 1,
    consequencia: () => 'O mercado se acalma; o eleitor comum nem sabe quem é.',
    resolver: c => { const x = vice(c); return { texto: `${x.nome}, ${x.fem ? 'economista respeitada' : 'economista respeitado'}, aceitou ser vice: os jornais de economia elogiaram; na feira, ninguém comentou.`, memoria: null, reabrir: true, efeito: () => passo(c, c.v.economia?.fase === 'crise' ? 6 : 4, y => { y.chapa = 'tecnica'; y.vice = x.nome; }) }; } })
];
/** O nome de quem vai na vice (sorteio derivado: o mesmo nome em qualquer das três opções). */
function vice(c: Ctx): { nome: string; fem: boolean } {
  const rng = rngDe(c.v.id, 'pres_vice', camp(c)?.ano ?? 0);
  const fem = rng.chance(0.4);
  return { nome: `${sortearNome(rng, fem ? 'feminino' : 'masculino', (camp(c)?.ano ?? 2030) - rng.int(40, 68), paisDaVida(c.v))} ${sortearSobrenome(rng, paisDaVida(c.v))}`, fem };
}

const ETAPA_2: Opcao[] = (Object.keys(EIXOS_129) as Eixo129[]).map(eixo => ok({
  id: `eixo_${eixo}`, texto: () => cap(EIXOS_129[eixo]), disponivel: c => etapa(c) === 2,
  consequencia: c => {
    const band = pol(c).prioridade ? EIXO_DA_BANDEIRA[pol(c).prioridade!] : undefined;
    return band === eixo ? 'É a sua bandeira de sempre: soa verdadeiro.' : band ? 'Não é a sua bandeira de sempre: vai ter quem cobre a coerência.' : 'Se ganhar, é o que vão cobrar.';
  },
  resolver: c => {
    const band = pol(c).prioridade ? EIXO_DA_BANDEIRA[pol(c).prioridade!] : undefined;
    const crise = c.v.economia?.fase === 'crise' || c.v.economia?.fase === 'desaceleracao';
    const nota = 3 + (band === eixo ? 3 : 0) + (eixo === 'economia' && crise ? 3 : 0);
    return { texto: `A campanha vai falar de ${EIXOS_129[eixo]}: programa de governo impresso, números na mão, e um jingle que gruda.${band && band !== eixo ? ' Um jornal lembrou que não era a sua bandeira de antes.' : ''}`, memoria: null, reabrir: true, efeito: () => { if (band && band !== eixo) desgastar(pol(c), 2, 'promessas'); passo(c, nota, x => { x.eixo = eixo; }); } };
  }
}));

const ETAPA_3: Opcao[] = [
  ok({ id: 'rua', texto: 'Caravana pelo país: comício, carreata, cidade pequena', comportamento: { sociabilidade: 1 }, disponivel: c => etapa(c) === 3,
    consequencia: () => 'Funciona onde você vai; cansa o corpo e esvazia a casa.',
    resolver: c => ({ texto: 'Quatro meses de avião pequeno, palanque e cachorro-quente de beira de estrada. Em casa, você virou voz no telefone.', memoria: null, reabrir: true,
      efeito: () => { passo(c, 4 + Math.max(0, c.v.personalidade.tracos.sociabilidade) / 20, x => { x.estrategia = 'rua'; }); estresse(c, 6); c.v.corpo.saude = clamp(c.v.corpo.saude - 2); const par = parceiro(c.v); if (par) par.vin.tensao = clamp(par.vin.tensao + 4); } }) }),
  ok({ id: 'tv', texto: 'Televisão e redes, com um marqueteiro famoso', disponivel: c => etapa(c) === 3,
    consequencia: () => 'Chega a todo mundo de uma vez; quem paga a conta costuma voltar.',
    resolver: c => ({ texto: 'O marqueteiro mudou o seu corte de cabelo, o seu jeito de falar e a trilha das propagandas. As inserções começaram a pegar.', memoria: null, reabrir: true,
      efeito: () => { passo(c, 5 + (nomeNacional(c) > 60 ? 2 : 0), x => { x.estrategia = 'tv'; }); if (rngDe(c.v.id, 'pres_doador', camp(c)?.ano ?? 0).chance(0.3)) c.v.fatos['pol_empresario'] = c.v.t; } }) }),
  ok({ id: 'aliancas', texto: 'Palanques com governadores e prefeitos de todo canto', disponivel: c => etapa(c) === 3,
    consequencia: () => 'Votos que vêm de quem já tem voto; cada apoio traz um pedido.',
    resolver: c => ({ texto: 'Uma foto com cada governador que topou, um jantar com cada prefeito de cidade grande. A agenda de pedidos para depois da posse ficou grossa.', memoria: null, reabrir: true,
      efeito: () => { const p = pol(c); desgastar(p, 4, 'campanha'); p.apoio = clamp(p.apoio + 4); criarAliado(c.v, c.r); passo(c, 6, x => { x.estrategia = 'aliancas'; }); } }) })
];

const ETAPA_4: Opcao[] = [
  ok({ id: 'debate_propostas', texto: 'Falar de propostas, com números', disponivel: c => etapa(c) === 4,
    consequencia: () => 'Não costuma viralizar; quando convence, convence quem estava em dúvida.',
    resolver: c => {
      const bem = c.r.chance(clamp(0.35 + c.v.mente.cognicao / 200 + habilidade(c.v, 'lideranca') / 300, 0.15, 0.85));
      return { texto: bem ? 'Você respondeu tudo com número e prazo. No dia seguinte, quem estava em dúvida dizia que você "parecia saber o que estava fazendo".' : 'Você tinha os números, mas se enrolou no tempo: o mediador cortou a resposta no meio da frase.', memoria: null, reabrir: true, tom: bem ? 'bom' : 'neutro',
        efeito: () => passo(c, bem ? 7 : 1, x => { x.debate = 'propostas'; x.debateFoi = bem ? 'bem' : 'empate'; }) };
    } }),
  ok({ id: 'debate_ataque', texto: c => `Partir para cima de ${liderAdversario(c.v)?.nome ?? 'quem lidera'}`, comportamento: { impulsividade: 1 }, disponivel: c => etapa(c) === 4,
    consequencia: () => 'Se colar, o líder passa a semana se explicando; se não, o assunto vira o seu tom.',
    resolver: c => {
      const lider = liderAdversario(c.v);
      const bem = c.r.chance(clamp(0.45 + c.v.personalidade.tracos.coragem / 300, 0.2, 0.75));
      return { texto: bem ? `A pergunta sobre o passado de ${lider?.nome ?? 'quem liderava'} ficou sem resposta: o vídeo do silêncio correu o país.` : `${lider?.nome ?? 'Quem liderava'} devolveu o ataque com calma — e a plateia riu de você.`, memoria: null, reabrir: true, tom: bem ? 'bom' : 'ruim',
        efeito: () => { desgastar(pol(c), 4, 'campanha'); if (bem && lider) lider.forca -= 5; passo(c, bem ? 3 : -5, x => { x.debate = 'ataque'; x.debateFoi = bem ? 'bem' : 'mal'; }); } };
    } }),
  ok({ id: 'debate_calma', texto: 'Não cair em provocação: calma e firmeza', disponivel: c => etapa(c) === 4,
    consequencia: () => 'Não perde nada; ganha pouco.',
    resolver: c => ({ texto: 'Você não levantou a voz uma vez. Quem já votava em você gostou; quem não votava não mudou.', memoria: null, reabrir: true, efeito: () => passo(c, 3 + (camp(c)?.via === 'reeleicao' ? 2 : 0), x => { x.debate = 'calma'; x.debateFoi = 'empate'; }) }) }),
  ok({ id: 'debate_faltar', texto: 'Não ir ao debate', disponivel: c => etapa(c) === 4,
    consequencia: c => (posicaoNaPesquisa(c.v) === 1 ? 'Quem lidera às vezes falta: perde pouco.' : 'A cadeira vazia vira a imagem da noite.'),
    resolver: c => ({ texto: 'O púlpito vazio com o seu nome ficou duas horas no ar. Os adversários falaram com ele.', memoria: null, reabrir: true, tom: 'ruim', efeito: () => passo(c, posicaoNaPesquisa(c.v) === 1 ? -1 : -4, x => { x.debate = 'faltou'; x.debateFoi = 'mal'; }) }) })
];

/** A reta final: o que acontece nas últimas semanas, e a resposta. */
const fimDaCampanha = (c: Ctx, texto: string): string => `${texto} A última pesquisa: ${pesquisaEmTexto(c.v)}. Agora, é a urna.`;
function reta(id: string, quando: Reta, texto: string | ((c: Ctx) => string), f: (c: Ctx) => { texto: string; nota: number; tom?: 'bom' | 'ruim'; efeito?: () => void }, consequencia?: string): Opcao {
  return {
    id, texto, consequencia: consequencia ? () => consequencia : undefined,
    disponivel: c => etapa(c) === 5 && retaDe(c) === quando,
    resolver: c => {
      const x = f(c);
      return { texto: x.texto, memoria: null, tom: x.tom, reabrir: true, efeito: () => { x.efeito?.(); passo(c, x.nota, y => { y.reta = quando; y.resposta = id; }); escrever(c.v, { texto: `A reta final da campanha: ${x.texto.charAt(0).toLowerCase()}${x.texto.slice(1)}`.replace(/\.$/, '') + `.${variacao(c)}`, relevancia: 'cotidiano', tema: 'trabalho' }); } };
    }
  };
}
const ETAPA_5: Opcao[] = [
  reta('docs', 'denuncia', 'Abrir as contas da campanha e responder ponto por ponto', c => { const deu = c.r.chance(0.6); return { texto: deu ? 'As contas abertas desmontaram a reportagem em dois dias.' : 'As contas abertas mostraram um doador que ninguém sabia explicar.', nota: deu ? 2 : -4, tom: deu ? 'bom' : 'ruim' }; }, 'Se as contas fecharem, a denúncia morre; se não, cresce.'),
  reta('processar', 'denuncia', 'Processar o jornal', c => ({ texto: 'O processo virou a notícia: "candidato processa jornal". A denúncia ficou mais lida do que antes.', nota: -2, tom: 'ruim', efeito: () => desgastar(pol(c), 3, 'exposicao') })),
  reta('ignorar_den', 'denuncia', 'Não responder e seguir a agenda', c => { const passou = c.r.chance(0.5); return { texto: passou ? 'Uma semana depois, ninguém falava mais disso.' : 'O silêncio pareceu confissão: o assunto foi ao último debate.', nota: passou ? 0 : -6, tom: passou ? undefined : 'ruim' }; }),
  reta('desmentir', 'fake', 'Desmentir em vídeo, com a sua cara e a sua voz', c => { const deu = c.r.chance(0.55 + habilidade(c.v, 'lideranca') / 400); return { texto: deu ? 'O desmentido teve mais visualizações que o vídeo falso.' : 'O desmentido chegou depois: o vídeo falso já tinha rodado nos grupos de família.', nota: deu ? 2 : -3, tom: deu ? 'bom' : 'ruim' }; }),
  reta('justica', 'fake', 'Pedir à Justiça Eleitoral que tire o vídeo do ar', c => { const deu = c.r.chance(0.6); return { texto: deu ? 'A Justiça mandou tirar o vídeo do ar em um dia, e mandou investigar quem pagou.' : 'A decisão saiu depois da eleição.', nota: deu ? 1 : -3, tom: deu ? 'bom' : 'ruim' }; }),
  reta('ignorar_fake', 'fake', 'Deixar passar', c => { const passou = c.r.chance(0.45); return { texto: passou ? 'O vídeo morreu sozinho.' : 'O vídeo falso virou "verdade" para muita gente.', nota: passou ? 0 : -5 }; }),
  reta('aceitar_apoio', 'apoio', 'Aceitar o apoio, com o preço', c => ({ texto: 'A foto do apoio saiu em todos os jornais. A lista de ministérios prometidos ficou numa gaveta.', nota: 6, tom: 'bom', efeito: () => { c.v.fatos['pol_divida'] = c.v.t; desgastar(pol(c), 3, 'promessas'); } }), 'Votos agora; cobrança depois.'),
  reta('recusar_apoio', 'apoio', 'Recusar: apoio sem condição ou nada', () => ({ texto: 'Você recusou em público. Perdeu um palanque; ganhou uma fama de independência.', nota: 1 })),
  reta('explorar', 'adversario', c => `Explorar o escândalo de ${liderAdversario(c.v)?.nome ?? 'quem lidera'}`, c => {
    const lider = liderAdversario(c.v);
    const colou = c.r.chance(0.65);
    return { texto: colou ? `O escândalo de ${lider?.nome ?? 'quem liderava'} virou o assunto da sua propaganda — e da semana.` : 'A propaganda sobre o escândalo do outro pareceu baixaria: o eleitor puniu os dois.', nota: colou ? 2 : -3, tom: colou ? 'bom' : 'ruim', efeito: () => { if (lider) lider.forca -= colou ? 5 : 2; desgastar(pol(c), 4, 'campanha'); } };
  }),
  reta('silencio_adv', 'adversario', 'Não comentar: o eleitor já viu', c => ({ texto: 'Você não tocou no assunto. A imprensa tocou por você.', nota: 2, efeito: () => { const l = liderAdversario(c.v); if (l) l.forca -= 3; } })),
  reta('plano', 'economia', 'Apresentar um plano para a crise, com prazo', c => { const deu = c.r.chance(0.5 + c.v.mente.cognicao / 300); return { texto: deu ? 'O plano para a crise convenceu: os economistas discutiram os detalhes, o eleitor entendeu a ideia.' : 'O plano para a crise foi chamado de "promessa" pelos dois lados.', nota: deu ? 4 : 0, tom: deu ? 'bom' : undefined }; }),
  reta('culpar', 'economia', c => (camp(c)?.via === 'reeleicao' ? 'Culpar o cenário externo' : 'Culpar quem governa'), c => {
    const governa = camp(c)?.via === 'reeleicao';
    return { texto: governa ? 'Culpar o mundo pela crise de casa não convenceu quem perdeu o emprego.' : 'Pôr a crise na conta de quem governa colou: é o que o eleitor já pensava.', nota: governa ? -2 : 3, tom: governa ? 'ruim' : 'bom' };
  })
];

const TITULO_DA_RETA: Record<Reta, string> = { denuncia: 'A denúncia da última semana', fake: 'O vídeo falso', apoio: 'O apoio com preço', adversario: 'O escândalo do outro lado', economia: 'O dado da economia' };
function textoDaReta(c: Ctx): string {
  const r = retaDe(c);
  const lider = liderAdversario(c.v);
  const texto = {
    denuncia: 'A duas semanas da eleição, uma reportagem diz que a sua campanha recebeu dinheiro por fora. O telefone da coordenação não para.',
    fake: 'Um vídeo com a sua voz — que não é a sua — dizendo o que você nunca disse viralizou nos grupos de mensagem.',
    apoio: 'Uma liderança com milhões de votos oferece apoio no último mês. Em troca, quer três ministérios "da área dela".',
    adversario: `${lider ? doAdversario(lider) : 'Quem lidera'} apareceu numa investigação. As pesquisas ainda não mediram o estrago.`,
    economia: 'Saiu o dado do trimestre: o desemprego subiu de novo. Todo debate agora começa por aí.'
  }[r];
  return `${texto} ${pesquisaTexto(c)}`;
}
const pesquisaTexto = (c: Ctx) => `A pesquisa: ${pesquisaEmTexto(c.v)}.`;

function tituloDaCampanha(c: Ctx): string {
  const x = camp(c);
  const e = etapa(c);
  if (!x) return 'A campanha';
  if (e === 0) return x.via === 'primarias' ? 'As primárias' : 'A convenção do partido';
  if (e === 5) return TITULO_DA_RETA[retaDe(c)];
  return ['', 'A chapa', 'O que a campanha promete', 'Como chegar ao país inteiro', 'O debate na TV'][e] ?? 'Às vésperas da eleição';
}
function textoDaCampanha(c: Ctx): string {
  const x = camp(c);
  const e = etapa(c);
  const p = pol(c);
  if (!x) return 'A campanha.';
  const adv = x.adversarios.map(a => `${a.nome} (${a.partido ? partidoDe(a.partido)?.chamado ?? a.partido : 'sem partido'}), ${a.perfil}`).join('; ');
  if (e === 0) return `${cap(oPartido(p.partido))} vai escolher quem disputa ${presidente(c)} em ${x.ano}. ${x.rival ?? 'Outro nome'} também quer a vaga e tem os seus votos lá dentro. Do outro lado, já estão na rua: ${adv}.`;
  if (e === 1) return `${x.via === 'reeleicao' ? 'A reeleição começa pela chapa. ' : ''}Quem vai na chapa com você? ${pesquisaTexto(c)}`;
  if (e === 2) return `O programa de governo precisa de um centro: o que você promete ao país? ${pesquisaTexto(c)}`;
  if (e === 3) return `O país é grande demais para uma agenda só. Como chegar a quem vota? ${pesquisaTexto(c)}`;
  if (e === 4) { const l = liderAdversario(c.v); return `O último debate antes da eleição, em rede nacional.${l ? ` ${l.nome} chega como ${posicaoNaPesquisa(c.v) === 1 ? 'quem persegue você' : 'quem lidera'}.` : ''} ${pesquisaTexto(c)}`; }
  if (e === 5) return textoDaReta(c);
  return fimDaCampanha(c, `A campanha para ${presidente(c)} acabou.${x.chapa ? ` Na chapa, ${x.vice ?? 'o vice'}.` : ''}${x.eixo ? ` A promessa: ${EIXOS_129[x.eixo]}.` : ''} Hoje, ${chanceEmPalavras(chancePresidencial(c.v, 160))}.`);
}

/* ================================================================ O governo: crises do país e do estado */

interface Efeito { aprovacao?: number; base?: number; mundo?: number; conflito?: number; inflacao?: number; pib?: number; desemprego?: number; ajustePib?: number; desgaste?: number; escandalo?: boolean; feito?: number; apoio?: number; risco?: boolean }
function aplicar(c: Ctx, ef: Efeito): void {
  const p = pol(c);
  const m = p.mandato;
  const g = governoAtual(c.v);
  if (m) { m.aprovacao = Math.round(clamp(m.aprovacao + (ef.aprovacao ?? 0))); m.feito += ef.feito ?? 0; }
  if (g) {
    g.base = Math.round(clamp(g.base + (ef.base ?? 0)));
    g.mundo = Math.round(clamp(g.mundo + (ef.mundo ?? 0)));
    g.conflito = Math.round(clamp(g.conflito + (ef.conflito ?? 0)));
    g.inflacao = Math.round((g.inflacao + (ef.inflacao ?? 0)) * 10) / 10;
    g.pib = Math.round((g.pib + (ef.pib ?? 0)) * 10) / 10;
    g.desemprego = Math.round(clamp(g.desemprego + (ef.desemprego ?? 0), 1, 40) * 10) / 10;
    g.ajuste.pib = Math.round((g.ajuste.pib + (ef.ajustePib ?? 0)) * 10) / 10;
    if (ef.escandalo) g.escandalos += 1;
  }
  if (ef.desgaste) { if (ef.desgaste > 0) desgastar(p, ef.desgaste, ef.escandalo ? 'escandalo' : 'mandato'); else aliviar(p, -ef.desgaste); }
  if (ef.apoio) p.apoio = clamp(p.apoio + ef.apoio);
  if (ef.escandalo && !g) desgastar(p, 4, 'escandalo');
  if (ef.risco && c.v.fatos['pol_risco'] === undefined) c.v.fatos['pol_risco'] = c.v.t;
}

interface Resposta { id: string; texto: string | ((c: Ctx) => string); consequencia?: string; chance: (c: Ctx) => number; bom: Efeito; mau: Efeito; textoBom: string | ((c: Ctx) => string); textoMau: string | ((c: Ctx) => string); comportamento?: Opcao['comportamento'] }
interface Crise { titulo: string; nome: string; texto: (c: Ctx) => string; respostas: Resposta[] }

const lid = (c: Ctx) => habilidade(c.v, 'lideranca') / 250;
const cab = (c: Ctx) => (c.v.mente.cognicao - 50) / 200;
const rua = (c: Ctx) => ((pol(c).mandato?.aprovacao ?? 50) - 45) / 150;
const daBase = (c: Ctx) => ((governoAtual(c.v)?.base ?? 40) - 40) / 150;
const estadoAqui = (c: Ctx) => { const m = municipio(c.v.moradia.municipioId); return m.uf ? `no estado (${m.uf})` : 'no estado'; };

const CRISES_PRES: Record<string, Crise> = {
  pres_inflacao: { titulo: 'A inflação disparou', nome: 'a inflação disparada', texto: c => `A inflação do ano passou de ${String(Math.max(6, Math.round((governoAtual(c.v)?.inflacao ?? 7) + 3))).replace('.', ',')}% e o preço do arroz virou assunto de toda mesa. O Banco Central espera um sinal do governo.`,
    respostas: [
      { id: 'juros', texto: 'Deixar o Banco Central subir os juros e cortar gastos', consequencia: 'A inflação cede; a economia esfria e a rua reclama.', chance: c => 0.6 + cab(c), bom: { inflacao: -1.6, pib: -0.5, aprovacao: -2, feito: 1 }, mau: { inflacao: -0.6, pib: -0.8, aprovacao: -5 }, textoBom: 'Os juros subiram, o gasto apertou — e em seis meses a inflação voltou para baixo. A conta veio no emprego.', textoMau: 'Os juros subiram e a inflação demorou a ceder: o pior dos mundos por um ano inteiro.' },
      { id: 'congelar', texto: 'Segurar os preços na marra (combustível, tarifas)', comportamento: { impulsividade: 1 }, consequencia: 'Alívio agora; a conta chega depois — e o mundo desconfia.', chance: () => 0.35, bom: { inflacao: -0.8, aprovacao: 3, mundo: -3 }, mau: { inflacao: 0.8, aprovacao: -3, mundo: -5, ajustePib: -0.2 }, textoBom: 'Os preços pararam na bomba e na conta de luz. Os economistas avisaram que a conta volta.', textoMau: 'O congelamento faltou nas prateleiras: fila no posto e a inflação de volta, mais alta.' },
      { id: 'explicar', texto: 'Ir à TV, explicar e pedir paciência', chance: c => 0.4 + lid(c) + rua(c), bom: { aprovacao: 3 }, mau: { aprovacao: -4 }, textoBom: 'O pronunciamento sobre a inflação foi ouvido: o país aceitou esperar.', textoMau: 'Pedir paciência a quem não fecha o mês soou como deboche.' }
    ] },
  pres_greve: { titulo: 'A greve que parou o país', nome: 'a greve nacional', texto: () => 'Os caminhoneiros fecharam as rodovias do país inteiro: falta combustível nos postos, comida nos mercados e remédio nas farmácias. Eles querem falar com você.',
    respostas: [
      { id: 'negociar', texto: 'Receber os líderes e negociar', comportamento: { sociabilidade: 1 }, consequencia: 'Acaba mais rápido; o acordo custa caro.', chance: c => 0.55 + lid(c), bom: { aprovacao: 3, inflacao: 0.3, feito: 1 }, mau: { aprovacao: -2, inflacao: 0.4 }, textoBom: 'O acordo saiu numa madrugada no palácio: as estradas reabriram em dois dias.', textoMau: 'O acordo assinado não valeu para a base dos caminhoneiros: a greve seguiu mais uma semana.' },
      { id: 'endurecer', texto: 'Endurecer: multar e liberar as estradas com a polícia', comportamento: { coragem: 1 }, consequencia: 'Pode acabar a greve; pode virar confronto.', chance: () => 0.45, bom: { aprovacao: 2, conflito: 5 }, mau: { aprovacao: -6, conflito: 12 }, textoBom: 'As estradas foram liberadas sem ninguém ferido. Parte do país aplaudiu.', textoMau: 'A liberação das estradas virou confronto, com feridos — e a greve ganhou o apoio que não tinha.' },
      { id: 'esperar', texto: 'Esperar a greve perder força', chance: () => 0.3, bom: { aprovacao: -1 }, mau: { aprovacao: -6, pib: -0.3 }, textoBom: 'Em dez dias, a greve se esvaziou sozinha.', textoMau: 'A espera custou duas semanas de país parado e prateleira vazia.' }
    ] },
  pres_desastre: { titulo: 'A tragédia', nome: 'a tragédia das enchentes', texto: () => 'Uma enchente histórica deixou cidades inteiras debaixo d’água num estado do país. Há mortos, desabrigados e estradas destruídas.',
    respostas: [
      { id: 'ir', texto: 'Ir ao local e liberar verba de emergência', comportamento: { coragem: 1 }, consequencia: 'A presença conta; a verba precisa chegar.', chance: c => 0.55 + lid(c) + daBase(c), bom: { aprovacao: 5, feito: 2, pib: -0.1 }, mau: { aprovacao: -2, pib: -0.1 }, textoBom: 'Você pisou na lama no segundo dia; a verba chegou no quinto. As cidades começaram a se reconstruir.', textoMau: 'A visita teve foto; a verba ficou presa na burocracia por meses.' },
      { id: 'gabinete', texto: 'Montar um gabinete de crise com os governadores', comportamento: { disciplina: 1 }, chance: c => 0.55 + cab(c), bom: { aprovacao: 3, feito: 1 }, mau: { aprovacao: -2 }, textoBom: 'O gabinete de crise funcionou: abrigo, água e estrada provisória em uma semana.', textoMau: 'O gabinete virou reunião de culpados: estado e União se acusando na TV.' },
      { id: 'minimizar', texto: 'Tratar como problema do estado', chance: () => 0.2, bom: { aprovacao: -1 }, mau: { aprovacao: -8 }, textoBom: 'O estado deu conta. Ninguém lembrou de você — para o bem e para o mal.', textoMau: 'A frase "é problema do estado" virou o slogan da oposição.' }
    ] },
  pres_diplomatica: { titulo: 'A crise com o vizinho', nome: 'a crise diplomática', texto: () => 'Depois de uma declaração do seu governo, um país vizinho chamou de volta o embaixador e fechou um posto de fronteira.',
    respostas: [
      { id: 'retaliar', texto: 'Responder à altura: expulsar o embaixador deles', comportamento: { impulsividade: 1 }, chance: () => 0.5, bom: { aprovacao: 2, mundo: -6 }, mau: { aprovacao: -1, mundo: -12, pib: -0.2 }, textoBom: 'A resposta dura agradou em casa; lá fora, o país ficou mais sozinho.', textoMau: 'A escalada fechou a fronteira por meses: o comércio da região quebrou.' },
      { id: 'silencio', texto: 'Negociar em silêncio, pela diplomacia de bastidor', comportamento: { disciplina: 1 }, chance: c => 0.5 + cab(c) + (governoAtual(c.v)?.mundo ?? 50) / 300, bom: { mundo: 6, feito: 1 }, mau: { mundo: -4, aprovacao: -2 }, textoBom: 'Em um mês, os embaixadores voltaram. Ninguém precisou pedir desculpas em público.', textoMau: 'A negociação silenciosa vazou — e pareceu fraqueza dos dois lados.' },
      { id: 'mediacao', texto: 'Pedir a mediação de um terceiro país', chance: () => 0.6, bom: { mundo: 3 }, mau: { mundo: -2 }, textoBom: 'A mediação fechou um acordo morno, mas fechou.', textoMau: 'A mediação arrastou a crise por um ano.' }
    ] },
  pres_ministro: { titulo: 'O ministro no noticiário', nome: 'o ministro investigado', texto: () => 'Um ministro do seu governo apareceu numa investigação de desvio de dinheiro público. Os jornais querem saber se você sabia.',
    respostas: [
      { id: 'demitir', texto: 'Demitir no mesmo dia', comportamento: { coragem: 1 }, chance: () => 0.75, bom: { aprovacao: 3, base: -4 }, mau: { aprovacao: 1, base: -6 }, textoBom: 'A demissão saiu antes do jornal da noite. O caso ficou com o ex-ministro.', textoMau: 'A demissão veio, mas o partido dele saiu da base junto.' },
      { id: 'afastar', texto: 'Afastar até a investigação acabar', chance: () => 0.55, bom: { aprovacao: 1, base: -1 }, mau: { aprovacao: -3, escandalo: true, desgaste: 4 }, textoBom: 'O afastamento acalmou a imprensa; a investigação seguiu sem você nela.', textoMau: 'A investigação achou mais gente do governo: o caso ganhou o seu nome no título.' },
      { id: 'defender', texto: 'Defender o ministro em público', comportamento: { empatia: -1 }, chance: () => 0.3, bom: { base: 3 }, mau: { aprovacao: -6, escandalo: true, desgaste: 8 }, textoBom: 'A investigação não achou nada contra ele. A sua palavra valeu.', textoMau: 'As provas apareceram uma semana depois da sua defesa: o escândalo agora é do governo.' }
    ] },
  pres_supremo: { titulo: 'O Supremo derrubou a medida', nome: 'o conflito com o Supremo', texto: () => 'O tribunal constitucional derrubou a principal medida do seu governo por unanimidade. A base pede uma reação; os juristas, cautela.',
    respostas: [
      { id: 'acatar', texto: 'Acatar e reescrever a medida', comportamento: { disciplina: 1 }, chance: () => 0.7, bom: { conflito: -10, feito: 1 }, mau: { conflito: -5, aprovacao: -2 }, textoBom: 'A medida reescrita passou no tribunal. Demorou, mas ficou de pé.', textoMau: 'A medida reescrita perdeu o que tinha de bom.' },
      { id: 'atacar', texto: 'Atacar o tribunal publicamente', comportamento: { impulsividade: 1 }, chance: () => 0.35, bom: { aprovacao: 2, conflito: 18 }, mau: { aprovacao: -4, conflito: 28, mundo: -4, base: -4 }, textoBom: 'A base aplaudiu o ataque; o tribunal anotou.', textoMau: 'O ataque ao tribunal virou crise institucional: o Congresso fechou com os juízes.' },
      { id: 'emenda', texto: 'Mandar ao Congresso uma emenda que contorne a decisão', chance: c => 0.3 + daBase(c) * 2, bom: { conflito: 8, feito: 2 }, mau: { conflito: 12, base: -3 }, textoBom: 'A emenda passou: a medida voltou, agora na Constituição.', textoMau: 'A emenda morreu na comissão, e o tribunal não esqueceu.' }
    ] },
  pres_cambio: { titulo: 'O dólar disparou', nome: 'a disparada do câmbio', texto: () => 'Uma fuga de capitais fez a moeda do país despencar em uma semana. Importado mais caro, combustível mais caro, empresa com dívida em dólar quebrando.',
    respostas: [
      { id: 'reservas', texto: 'Queimar reservas para segurar a moeda', chance: () => 0.55, bom: { inflacao: -0.4, mundo: 2 }, mau: { inflacao: 0.6, mundo: -3 }, textoBom: 'As reservas seguraram a moeda: a tempestade passou.', textoMau: 'As reservas foram embora e a moeda caiu mesmo assim.' },
      { id: 'corte', texto: 'Anunciar um corte de gastos para acalmar o mercado', comportamento: { disciplina: 1 }, chance: c => 0.5 + cab(c), bom: { inflacao: -0.6, aprovacao: -2, mundo: 3 }, mau: { aprovacao: -4, pib: -0.3 }, textoBom: 'O anúncio acalmou o mercado em dias; a rua sentiu no serviço público.', textoMau: 'O corte não convenceu o mercado e assustou a rua.' },
      { id: 'deixar', texto: 'Deixar a moeda achar o preço', chance: () => 0.4, bom: { pib: 0.2 }, mau: { inflacao: 1.2, aprovacao: -3 }, textoBom: 'A moeda achou o preço, e a exportação agradeceu.', textoMau: 'A moeda não parou de cair: a inflação veio atrás.' }
    ] },
  pres_surto: { titulo: 'O surto', nome: 'o surto de uma doença nova', texto: () => 'Um vírus novo encheu os hospitais de três estados em um mês. Os médicos pedem medidas; o comércio pede que nada feche.',
    respostas: [
      { id: 'cedo', texto: 'Medidas duras cedo, com o que a ciência recomenda', comportamento: { disciplina: 1 }, chance: c => 0.6 + cab(c), bom: { aprovacao: 2, pib: -0.5, feito: 2 }, mau: { aprovacao: -3, pib: -0.7 }, textoBom: 'As medidas cedo seguraram o surto: os hospitais aguentaram, a economia sentiu um trimestre.', textoMau: 'As medidas vieram, mas o surto já estava espalhado: o pior dos dois mundos.' },
      { id: 'insumos', texto: 'Comprar vacinas e insumos a qualquer preço', chance: c => 0.5 + (governoAtual(c.v)?.mundo ?? 50) / 200, bom: { aprovacao: 4, inflacao: 0.2, feito: 1 }, mau: { aprovacao: -2, escandalo: true, desgaste: 4 }, textoBom: 'As vacinas chegaram antes do que em quase todo lugar.', textoMau: 'A compra apressada virou caso de superfaturamento.' },
      { id: 'minimizar', texto: 'Minimizar para não parar a economia', comportamento: { impulsividade: 1 }, chance: () => 0.2, bom: { pib: 0.2 }, mau: { aprovacao: -10, pib: -0.6, mundo: -6, conflito: 10 }, textoBom: 'O surto perdeu força sozinho. Desta vez.', textoMau: 'O surto virou epidemia: os hospitais colapsaram e o seu nome ficou ligado às mortes.' }
    ] },
  pres_protestos: { titulo: 'A rua contra o governo', nome: 'os protestos contra o governo', texto: () => 'Centenas de milhares de pessoas foram às ruas das capitais contra o governo. As faixas falam de tudo: o preço, a corrupção, você.',
    respostas: [
      { id: 'ouvir', texto: 'Receber os organizadores e ceder em um ponto', comportamento: { sociabilidade: 1 }, chance: c => 0.5 + lid(c), bom: { aprovacao: 4, base: -2 }, mau: { aprovacao: -1, base: -2 }, textoBom: 'O ponto cedido esvaziou a rua em duas semanas.', textoMau: 'Ceder um ponto pareceu pouco: os protestos continuaram.' },
      { id: 'ignorar', texto: 'Seguir governando e deixar a rua passar', chance: () => 0.35, bom: { aprovacao: -1 }, mau: { aprovacao: -5 }, textoBom: 'Os protestos passaram.', textoMau: 'Os protestos cresceram a cada semana em que você fingiu não ver.' },
      { id: 'reprimir', texto: 'Pôr a polícia na rua para conter os atos', comportamento: { impulsividade: 1 }, chance: () => 0.25, bom: { aprovacao: -2, conflito: 10 }, mau: { aprovacao: -8, conflito: 22, mundo: -6 }, textoBom: 'A rua esvaziou. Ficou o silêncio — e a desconfiança.', textoMau: 'A repressão rendeu imagens que correram o mundo: o protesto seguinte foi duas vezes maior.' }
    ] }
};

const CRISES_GOV: Record<string, Crise> = {
  gov_seguranca: { titulo: 'A onda de violência', nome: 'a onda de violência no estado', texto: c => `Ataques a ônibus e a delegacias pararam a capital ${estadoAqui(c).replace('no estado', 'do estado')} por dois dias. A polícia é do estado: a cobrança é sua.`,
    respostas: [
      { id: 'comando', texto: 'Assumir o comando e pôr a polícia na rua', comportamento: { coragem: 1 }, chance: c => 0.5 + lid(c), bom: { aprovacao: 5, feito: 1 }, mau: { aprovacao: -4 }, textoBom: 'Com o comando no palácio e a polícia nas ruas, os ataques pararam em uma semana.', textoMau: 'A polícia na rua não achou quem mandava os ataques; a cidade viveu com medo um mês.' },
      { id: 'inteligencia', texto: 'Força-tarefa de inteligência com o Ministério Público', comportamento: { disciplina: 1 }, chance: c => 0.5 + cab(c), bom: { aprovacao: 3, feito: 2 }, mau: { aprovacao: -2 }, textoBom: 'A força-tarefa chegou a quem mandava de dentro do presídio. Prisões, e silêncio nas ruas.', textoMau: 'A força-tarefa demorou: a cobrança veio antes do resultado.' },
      { id: 'federal', texto: 'Pedir a Força Nacional ao governo federal', chance: () => 0.6, bom: { aprovacao: 2 }, mau: { aprovacao: -3, desgaste: 2 }, textoBom: 'A Força Nacional chegou em três dias e ajudou a segurar.', textoMau: 'O pedido de ajuda virou "o governador que não dá conta".' }
    ] },
  gov_rodovia: { titulo: 'A ponte que caiu', nome: 'a ponte da rodovia estadual', texto: () => 'Uma ponte de rodovia estadual cedeu na madrugada. O interior ficou isolado, o frete subiu e os prefeitos ligam para o palácio.',
    respostas: [
      { id: 'emergencia', texto: 'Obra emergencial, sem licitação', comportamento: { impulsividade: 1 }, chance: () => 0.6, bom: { aprovacao: 4, feito: 2 }, mau: { aprovacao: -2, risco: true, desgaste: 3 }, textoBom: 'A ponte provisória ficou pronta em vinte dias; a definitiva, no ano seguinte.', textoMau: 'A obra emergencial foi parar no Tribunal de Contas: a empreiteira era de um amigo do partido.' },
      { id: 'balsa', texto: 'Balsa agora, obra licitada com calma', comportamento: { disciplina: 1 }, chance: c => 0.55 + cab(c), bom: { aprovacao: 2, feito: 1 }, mau: { aprovacao: -3 }, textoBom: 'A balsa resolveu o mês; a ponte nova saiu dentro da lei.', textoMau: 'A balsa virou fila de dez horas, e a licitação empacou.' },
      { id: 'culpar', texto: 'Culpar a manutenção do governo anterior', chance: c => 0.4 - ((c.v.t - (pol(c).mandato?.tInicio ?? c.v.t)) / 12) * 0.08, bom: { aprovacao: 0 }, mau: { aprovacao: -4 }, textoBom: 'A culpa colou no antecessor. A ponte continua caída.', textoMau: 'Ninguém quis saber de quem era a culpa: queriam a ponte.' }
    ] },
  gov_hospital: { titulo: 'O hospital regional lotado', nome: 'o hospital regional lotado', texto: () => 'No hospital regional, gente esperando leito no corredor há dias. A imprensa mostrou as macas, e o Ministério Público abriu um procedimento.',
    respostas: [
      { id: 'leitos', texto: 'Abrir leitos de campanha e contratar médicos', comportamento: { coragem: 1 }, chance: c => 0.55 + daBase(c) + lid(c) / 2, bom: { aprovacao: 4, feito: 2 }, mau: { aprovacao: -2 }, textoBom: 'Em duas semanas, os corredores esvaziaram.', textoMau: 'Os leitos abriram; os médicos não vieram.' },
      { id: 'convenio', texto: 'Convênio com hospitais privados da região', chance: () => 0.6, bom: { aprovacao: 3, feito: 1 }, mau: { aprovacao: -1, risco: true }, textoBom: 'O convênio absorveu a fila em um mês.', textoMau: 'O convênio virou suspeita: um dos hospitais era de um deputado da base.' },
      { id: 'municipios', texto: 'Cobrar os municípios que mandam pacientes', chance: () => 0.3, bom: { aprovacao: 0 }, mau: { aprovacao: -5 }, textoBom: 'Os municípios reforçaram os postos; a fila andou.', textoMau: 'Os prefeitos devolveram a culpa na mesma hora, na TV.' }
    ] },
  gov_repasse: { titulo: 'O repasse que não veio', nome: 'o repasse federal atrasado', texto: () => 'O repasse federal atrasou e a folha do estado — professores, policiais, médicos — não fecha no fim do mês.',
    respostas: [
      { id: 'brasilia', texto: c => `Ir ${paisDaVida(c.v) === 'BR' ? 'a Brasília' : 'à capital do país'} negociar pessoalmente`, chance: c => 0.45 + ([0.1, 0, -0.08][c.v.fatos['pol_partido_porte'] ?? 1] ?? 0) + lid(c), bom: { aprovacao: 3, feito: 1 }, mau: { aprovacao: -3 }, textoBom: 'Voltou com o repasse liberado: a folha saiu em dia.', textoMau: 'Voltou com uma promessa: a folha atrasou.' },
      { id: 'parcelar', texto: 'Parcelar os salários e explicar', chance: () => 0.4, bom: { aprovacao: -2 }, mau: { aprovacao: -6, desgaste: 3 }, textoBom: 'O parcelamento foi entendido como o que era: falta de dinheiro.', textoMau: 'O parcelamento virou greve de professores e policiais ao mesmo tempo.' },
      { id: 'custeio', texto: 'Cortar no custeio do próprio governo', comportamento: { disciplina: 1 }, chance: c => 0.5 + cab(c), bom: { aprovacao: 2, feito: 1 }, mau: { aprovacao: -2 }, textoBom: 'Carro oficial vendido, contrato revisto: a folha fechou.', textoMau: 'O corte não chegou ao valor da folha.' }
    ] },
  gov_chuva: { titulo: 'As chuvas no interior', nome: 'as chuvas no interior do estado', texto: () => 'Três semanas de chuva isolaram cidades do interior. Os prefeitos pedem socorro ao estado; há famílias em ginásios.',
    respostas: [
      { id: 'ir', texto: 'Levar o gabinete de crise para o interior', comportamento: { coragem: 1 }, chance: c => 0.55 + lid(c), bom: { aprovacao: 5, feito: 1, apoio: 3 }, mau: { aprovacao: -1 }, textoBom: 'O governo despachou do interior por dez dias: as estradas reabriram e as famílias voltaram.', textoMau: 'O gabinete no interior teve foto; a água demorou a baixar.' },
      { id: 'emergencia', texto: 'Decretar emergência e pedir ajuda federal', comportamento: { disciplina: 1 }, chance: () => 0.6, bom: { aprovacao: 3, feito: 1 }, mau: { aprovacao: -2 }, textoBom: 'O decreto destravou dinheiro federal em uma semana.', textoMau: 'A ajuda federal chegou quando a chuva já tinha parado.' },
      { id: 'defesa', texto: 'Deixar com a Defesa Civil', chance: () => 0.35, bom: { aprovacao: 0 }, mau: { aprovacao: -5 }, textoBom: 'A Defesa Civil deu conta.', textoMau: 'Os prefeitos do interior disseram que o governador "sumiu".' }
    ] },
  gov_presidio: { titulo: 'A rebelião', nome: 'a rebelião no presídio estadual', texto: () => 'Uma rebelião tomou o maior presídio do estado. Há agentes reféns, e as facções mandam recado para fora.',
    respostas: [
      { id: 'negociar', texto: 'Negociar a saída dos reféns', comportamento: { sociabilidade: 1 }, chance: c => 0.5 + lid(c), bom: { aprovacao: 4, feito: 1 }, mau: { aprovacao: -4 }, textoBom: 'Os reféns saíram vivos depois de trinta horas de negociação.', textoMau: 'A negociação arrastou-se por dias e terminou com mortos.' },
      { id: 'invadir', texto: 'Mandar a tropa de choque entrar', comportamento: { impulsividade: 1 }, chance: () => 0.45, bom: { aprovacao: 3 }, mau: { aprovacao: -8, desgaste: 5 }, textoBom: 'A tropa retomou o presídio em uma hora, sem morte de refém.', textoMau: 'A invasão terminou em massacre — e o estado no noticiário do mundo.' },
      { id: 'federal', texto: 'Pedir transferência dos líderes para presídio federal', chance: () => 0.6, bom: { aprovacao: 2, feito: 1 }, mau: { aprovacao: -2 }, textoBom: 'Os líderes foram transferidos; a rebelião acabou sem cabeça.', textoMau: 'A transferência demorou, e a rebelião se espalhou para outra unidade.' }
    ] }
};

function opcoesDaCrise(tabela: Record<string, Crise>): Opcao[] {
  const out: Opcao[] = [];
  for (const [tipo, cr] of Object.entries(tabela)) {
    for (const x of cr.respostas) {
      out.push({
        id: `${tipo}_${x.id}`, texto: x.texto, comportamento: x.comportamento, consequencia: x.consequencia ? () => x.consequencia : undefined,
        disponivel: c => pol(c).mandato?.crise?.tipo === tipo,
        resolver: c => {
          const deu = c.r.chance(clamp(x.chance(c) - pol(c).desgaste / 300, 0.08, 0.9));
          const ef = deu ? x.bom : x.mau;
          const t = deu ? x.textoBom : x.textoMau;
          const texto = typeof t === 'string' ? t : t(c);
          const como = typeof x.texto === 'string' ? x.texto.toLowerCase() : x.texto(c).toLowerCase();
          return { texto, memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => fecharCrise(c, cr, ef, deu, como, texto) };
        }
      });
    }
  }
  return out;
}

function fecharCrise(c: Ctx, cr: Crise, ef: Efeito, deu: boolean, como: string, texto: string): void {
  const m = pol(c).mandato;
  if (!m) return;
  aplicar(c, ef);
  const saiu = (ef.aprovacao ?? 0) >= 3 ? 'saiu maior do que entrou' : (ef.aprovacao ?? 0) <= -4 ? 'saiu mal' : 'atravessou sem ganhar nem perder muito';
  registrarNoMandato(c.v, `${anoDe(c.v.t)} · ${cr.nome} (${como}): ${saiu}`);
  if (deu && (ef.aprovacao ?? 0) >= 3) governoAtual(c.v)?.conquistas.push(`${anoDe(c.v.t)} · ${cr.nome}: ${como}`);
  m.crise = undefined;
  estresse(c, deu ? 3 : 7);
  escrever(c.v, { texto: `${cap(cr.nome)}: ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`, relevancia: (ef.aprovacao ?? 0) >= 4 || (ef.aprovacao ?? 0) <= -5 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: deu ? 'bom' : 'ruim', escolha: true });
  if ((ef.aprovacao ?? 0) <= -6) abalar(c.v, 'a crise que saiu mal', -3, 4);
}

const crise = (c: Ctx) => c.v.caminhos.politica?.mandato?.crise?.tipo ?? '';

/* ================================================================ As decisões de governo */

const EIXO_OPCOES: Opcao[] = (Object.keys(EIXOS_129) as Eixo129[]).map(eixo => ok({
  id: `g_${eixo}`, texto: () => cap(EIXOS_129[eixo]),
  disponivel: c => !(governoAtual(c.v)?.eixos ?? []).includes(eixo),
  consequencia: c => {
    const g = governoAtual(c.v);
    const prometido = [...(presidencia(c.v).candidaturas)].reverse().find(x => x.resultado === 'eleito')?.eixo;
    const sai = g && g.eixos.length >= 2 ? ` Sai da frente: ${EIXOS_129[g.eixos[0]]}.` : '';
    return `${prometido === eixo ? 'Foi a promessa de campanha: soa como palavra cumprida.' : prometido ? `A campanha prometeu ${EIXOS_129[prometido]}: vai ter cobrança.` : 'O ministério inteiro passa a correr atrás disso.'}${sai}`;
  },
  resolver: c => {
    const g = governoAtual(c.v)!;
    const prometido = [...(presidencia(c.v).candidaturas)].reverse().find(x => x.resultado === 'eleito')?.eixo;
    return { texto: `O governo passou a ter um rumo: ${EIXOS_129[eixo]}. Os ministérios receberam metas, e os que ficaram de fora, cortes.`, memoria: `Definiu ${EIXOS_129[eixo]} como prioridade do governo.`, relevancia: 'biografia',
      efeito: () => {
        if (g.eixos.length >= 2) g.eixos.shift();
        g.eixos.push(eixo);
        const p = pol(c);
        if (prometido === eixo) aliviar(p, 4, ['promessas']); else if (prometido && !g.eixos.includes(prometido)) desgastar(p, 3, 'promessas');
        const ef: Efeito = { economia: { mundo: 2 }, social: { aprovacao: 2 }, seguranca: { conflito: 3, aprovacao: 1 }, infraestrutura: { ajustePib: 0.1 }, ambiente: { mundo: 4 }, educacao_saude: { aprovacao: 1 } }[eixo];
        aplicar(c, { ...ef, feito: 1 });
      } };
  }
}));

const REFORMA_OPCOES: Opcao[] = (Object.keys(REFORMAS_129) as Reforma129[]).map(id => ok({
  id: `r_${id}`, texto: () => cap(REFORMAS_129[id].nome),
  disponivel: c => !(governoAtual(c.v)?.reformas ?? []).some(x => x.id === id && x.aprovada),
  consequencia: c => {
    const r = regraDaPresidencia(c.v)!;
    const md = REFORMAS_129[id];
    const q = md.emenda ? r.quorum.emenda : r.quorum.lei;
    const g = governoAtual(c.v)!;
    const casas = r.casas[1] ? `${r.casas[0]} e ${r.casas[1]}` : r.casas[0];
    return `${cap(md.texto)}. ${md.emenda ? 'É emenda à Constituição' : 'É lei'}: precisa de ${q}% em ${casas}, uma casa por ano. A base tem ${g.base}%${(governoAtual(c.v)?.eixos ?? []).includes(md.eixo) ? '; está no eixo do governo' : ''}.`;
  },
  resolver: c => ({ texto: `${cap(REFORMAS_129[id].nome)} chegou ao Congresso com a assinatura do governo. Agora é comissão, relator, emenda — e voto.`, memoria: `Enviou ${REFORMAS_129[id].nome} ao Congresso.`, relevancia: 'biografia',
    efeito: () => {
      const g = governoAtual(c.v)!;
      g.reforma = { id, etapa: 1, t: c.v.t };
      if ((g.eixos ?? []).includes(REFORMAS_129[id].eixo)) g.base = Math.round(clamp(g.base + 2));
      if (id === 'previdencia' || id === 'administrativa') aplicar(c, { aprovacao: -2 });
    } })
}));

const BASE_OPCOES: Opcao[] = [
  ok({ id: 'ministerios', texto: 'Entregar ministérios a partidos do centro em troca de votos', comportamento: { impulsividade: 1 }, consequencia: () => 'A base cresce de uma vez; o risco de nome ruim por perto cresce junto.',
    resolver: c => ({ texto: 'Três ministérios mudaram de mãos numa semana. Na votação seguinte, o painel ficou verde.', memoria: 'Entregou ministérios ao centro para ter base no Congresso.', relevancia: 'biografia',
      efeito: () => { aplicar(c, { base: 12 }); desgastar(pol(c), 4, 'partido'); if (rngDe(c.v.id, 'pres_ministerios', c.v.t).chance(0.25)) aplicar(c, { risco: true }); } }) }),
  ok({ id: 'emendas', texto: 'Liberar emendas para as bases dos parlamentares', consequencia: () => 'Votos no curto prazo; dinheiro carimbado que não volta.',
    resolver: c => ({ texto: 'A liberação de emendas saiu no Diário Oficial numa sexta à noite. Na terça, a base estava mais calma.', memoria: null, efeito: () => aplicar(c, { base: 7, aprovacao: -1, inflacao: 0.1 }) }) }),
  ok({ id: 'programa', texto: 'Negociar ponto a ponto, pelo programa, sem cargos', comportamento: { independencia: 1 }, consequencia: () => 'Limpo e lento: a base cresce pouco, quando cresce.',
    resolver: c => { const deu = c.r.chance(clamp(0.45 + habilidade(c.v, 'lideranca') / 300, 0.2, 0.8)); return { texto: deu ? 'Reunião por reunião, projeto por projeto: uma bancada inteira passou a votar com o governo.' : 'As reuniões foram cordiais; os votos, não.', memoria: null, tom: deu ? 'bom' : undefined, efeito: () => aplicar(c, { base: deu ? 6 : 1 }) }; } }),
  ok({ id: 'confronto', texto: 'Governar no confronto: decretos e a rua pressionando o Congresso', comportamento: { impulsividade: 1 }, consequencia: () => 'Agrada quem já apoia; o Congresso e o tribunal anotam.',
    resolver: c => { const m = pol(c).mandato!; const forte = m.aprovacao >= 50; return { texto: forte ? 'Com a rua do seu lado, os decretos saíram e o Congresso engoliu em seco.' : 'Os decretos saíram — e o Congresso começou a derrubá-los um por um.', memoria: null, tom: forte ? undefined : 'ruim', efeito: () => aplicar(c, { base: -5, conflito: 18, aprovacao: forte ? 2 : -2 }) }; } })
];

const POLITICA_OPCOES: Opcao[] = [
  ...(Object.keys(POLITICAS_129) as PoliticaEconomica129[]).map(id => ok({
    id: `e_${id}`, texto: () => cap(POLITICAS_129[id].nome),
    consequencia: () => { const x = POLITICAS_129[id]; const s = (n: number, a: string, b: string) => (n > 0 ? a : n < 0 ? b : ''); return [s(x.pib, 'a economia acelera', 'a economia esfria'), s(x.inflacao, 'a inflação sobe', 'a inflação cede'), s(x.desemprego, 'o desemprego sobe', 'o desemprego cai'), s(x.aprovacao, 'a rua gosta', 'a rua sente')].filter(Boolean).join('; ') + ' — no balanço do ano.'; },
    resolver: (c: Ctx): Resultado => ({ texto: `A equipe econômica recebeu a ordem: ${POLITICAS_129[id].nome}. O resultado aparece nos números do ano.`, memoria: `Escolheu ${POLITICAS_129[id].nome} como política econômica do ano.`, relevancia: 'cotidiano',
      efeito: () => { const g = governoAtual(c.v)!; g.politica = { id, t: c.v.t }; } })
  })),
  ok({ id: 'e_manter', texto: 'Manter o rumo e não mexer', resolver: () => ({ texto: 'A equipe econômica seguiu o plano. A economia andou no ritmo do mundo.', memoria: null }) })
];

const MUNDO_OPCOES: Opcao[] = [
  ok({ id: 'cupula', texto: 'Ir às cúpulas e às viagens de Estado', resolver: c => ({ texto: 'Cúpula, foto de família, discurso de quinze minutos. Lá fora, o país voltou a ser convidado; aqui, disseram que você viaja demais.', memoria: null, efeito: () => aplicar(c, { mundo: 7, aprovacao: -1 }) }) }),
  ok({ id: 'acordo', texto: 'Fechar um acordo comercial', consequencia: () => 'Abre mercado para quem exporta; quem concorre com importado reclama.',
    resolver: c => { const deu = c.r.chance(clamp(0.45 + (governoAtual(c.v)?.mundo ?? 50) / 200, 0.2, 0.85)); return { texto: deu ? 'O acordo comercial foi assinado: a indústria que exporta comemorou; a que compete com importado foi à TV reclamar.' : 'O acordo empacou na última rodada: a outra parte pediu o que o país não podia dar.', memoria: deu ? 'Assinou um acordo comercial histórico.' : null, relevancia: 'biografia', tom: deu ? 'bom' : undefined,
      efeito: () => { if (deu) { aplicar(c, { mundo: 5, ajustePib: 0.2, aprovacao: -1 }); governoAtual(c.v)?.conquistas.push(`${anoDe(c.v.t)} · acordo comercial assinado`); registrarNoMandato(c.v, `${anoDe(c.v.t)} · assinou um acordo comercial`); } else aplicar(c, { mundo: -2 }); } }; } }),
  ok({ id: 'mediar', texto: 'Oferecer-se para mediar um conflito na região', comportamento: { coragem: 1 }, consequencia: () => 'Se der certo, o país vira referência; se não, vira piada.',
    resolver: c => { const deu = c.r.chance(clamp(0.3 + habilidade(c.v, 'lideranca') / 300 + (governoAtual(c.v)?.mundo ?? 50) / 400, 0.1, 0.7)); return { texto: deu ? 'As duas partes assinaram o cessar-fogo na sua capital. A foto do aperto de mão foi capa no mundo inteiro.' : 'A mediação fracassou na segunda rodada, e as duas partes culparam você.', memoria: deu ? 'Mediou um cessar-fogo entre dois países.' : null, relevancia: 'marco', tom: deu ? 'bom' : 'ruim',
      efeito: () => { if (deu) { aplicar(c, { mundo: 12, aprovacao: 3 }); governoAtual(c.v)?.conquistas.push(`${anoDe(c.v.t)} · mediou um cessar-fogo`); registrarNoMandato(c.v, `${anoDe(c.v.t)} · mediou um cessar-fogo`); } else aplicar(c, { mundo: -5 }); } }; } }),
  ok({ id: 'casa', texto: 'Ficar em casa e cuidar do país', resolver: c => ({ texto: 'Você cancelou as viagens do ano. A rua gostou; os diplomatas, não.', memoria: null, efeito: () => aplicar(c, { aprovacao: 1, mundo: -3 }) }) })
];

/* ================================================================ O impeachment */

function defesa(c: Ctx, id: string): number {
  const m = pol(c).mandato!;
  if (id === 'negociar') return 12;
  if (id === 'rua') return (m.aprovacao - 30) * 0.4 + Math.max(0, c.v.personalidade.tracos.sociabilidade) / 10;
  return 0;
}
const IMPEACHMENT_OPCOES: Opcao[] = [
  ok({ id: 'negociar', texto: 'Negociar voto a voto com o centro (cargos e emendas)', comportamento: { impulsividade: 1 }, consequencia: () => 'A forma mais segura de somar votos; a que mais deixa rastro.',
    resolver: c => julgar(c, 'negociar', () => { desgastar(pol(c), 6, 'partido'); if (c.r.chance(0.3)) aplicar(c, { risco: true }); }) }),
  ok({ id: 'rua', texto: 'Falar à nação e chamar a rua', comportamento: { coragem: 1 }, consequencia: c => ((pol(c).mandato?.aprovacao ?? 30) >= 30 ? 'Com alguma rua do seu lado, pressiona o plenário.' : 'Com a rua contra, pode piorar.'),
    resolver: c => julgar(c, 'rua', () => aplicar(c, { conflito: 8 })) }),
  ok({ id: 'justica', texto: 'Recorrer ao tribunal constitucional contra o rito', comportamento: { disciplina: 1 }, consequencia: () => 'Raramente para o processo; sempre tensiona.',
    resolver: c => {
      const g = governoAtual(c.v)!;
      if (c.r.chance(0.2)) return { texto: 'O tribunal suspendeu o processo por vício no rito. O pedido voltou à estaca zero — e a oposição, à rua.', memoria: 'O tribunal suspendeu o processo de afastamento.', relevancia: 'marco', tom: 'bom', efeito: () => { g.impeachment = undefined; delete c.v.fatos['pres_impeachment']; aplicar(c, { conflito: 12 }); } };
      return julgar(c, 'justica', () => aplicar(c, { conflito: 12 }));
    } }),
  ok({ id: 'renunciar', texto: 'Renunciar antes do julgamento', comportamento: { independencia: 1 }, consequencia: () => 'O cargo acaba agora; sem condenação, a volta não fica proibida.',
    resolver: c => ({ texto: 'A carta de renúncia foi lida no Congresso numa sessão em silêncio.', memoria: `Renunciou à Presidência antes do julgamento.`, relevancia: 'marco', efeito: () => { const g = governoAtual(c.v); if (g) g.impeachment = undefined; delete c.v.fatos['pres_impeachment']; renunciar(c.v, 'antes do julgamento do processo de afastamento'); voltarAoTrabalho(c.v, 'depois da renúncia'); } }) })
];
function julgar(c: Ctx, id: string, antes: () => void): Resultado {
  antes();
  const x = julgarImpeachment(c.v, c.r, defesa(c, id));
  const r = regraDaPresidencia(c.v)!;
  if (x.seguiu) return { texto: `${cap(r.casas[0])} autorizou: ${x.contra}% contra você. O julgamento segue em ${r.casas[1]}.`, memoria: null, reabrir: true, tom: 'ruim' };
  return { texto: x.caiu ? `Condenado: ${x.contra}% dos votos. Acabou.`.replace('Condenado', c.g('Condenado', 'Condenada', 'Condenade')) : `O processo caiu: ${x.contra}% contra, abaixo do que precisavam.`, memoria: null, tom: x.caiu ? 'ruim' : 'bom' };
}

/* ================================================================ O catálogo */

export const ACONTECIMENTOS_129_PRESIDENCIA: Conteudo[] = [
  {
    id: 'presc_campanha', tipo: 'decisao', idade: [18, 99], tema: 'escolha', manual: true, repetir: 0,
    titulo: c => tituloDaCampanha(c),
    texto: c => textoDaCampanha(c),
    opcoes: [...ETAPA_0, ...ETAPA_1, ...ETAPA_2, ...ETAPA_3, ...ETAPA_4, ...ETAPA_5,
      { id: 'fim', texto: 'Esperar a urna', disponivel: c => etapa(c) >= 6, resolver: () => ({ texto: 'O programa de governo está impresso, o jingle está gravado, e a última noite de campanha acabou num comício com chuva. Agora, é a urna.', memoria: null }) }]
  },
  {
    id: 'prest_segundo_turno', tipo: 'decisao', idade: [18, 99], tema: 'escolha', prioritario: true, prioridade: 6, repetir: 0,
    quando: c => deHoje(c, 'pres_2turno') && !!camp(c)?.segundo && !camp(c)!.segundo!.escolha && !!c.v.caminhos.politica?.campanha,
    titulo: 'O segundo turno',
    texto: c => {
      const x = camp(c)!;
      const adv = x.adversarios[x.segundo!.adv];
      const terceiro = (x.primeiro ?? []).find(y => !y.voce && y.nome !== adv.nome);
      const eu = x.primeiro?.find(y => y.voce)?.pct ?? 0;
      const ele = x.primeiro?.find(y => y.nome === adv.nome)?.pct ?? 0;
      return `Quatro semanas até o segundo turno contra ${doAdversario(adv)}. No primeiro, você teve ${String(eu).replace('.', ',')}%; ${adv.nome}, ${String(ele).replace('.', ',')}%.${terceiro ? ` ${terceiro.nome}, que ficou em terceiro, ainda não disse quem apoia.` : ''} ${chanceEmPalavras(chancePresidencial(c.v, 120)) === 'favorito na urna' ? 'Você chega na frente.' : 'Vai ser voto a voto.'}`;
    },
    opcoes: [
      { id: 'apoio', texto: c => { const x = camp(c)!; const t = (x.primeiro ?? []).find(y => !y.voce && y.nome !== x.adversarios[x.segundo!.adv].nome); return t ? `Buscar o apoio de ${t.nome}` : 'Buscar o apoio de quem ficou de fora'; }, comportamento: { sociabilidade: 1 },
        consequencia: () => 'Se vier, traz votos — e um pedido.', resolver: c => segundoTurno(c, c.r.chance(clamp(0.55 + basePartidaria(c.v) / 300, 0.3, 0.85)) ? 'apoio' : 'apoio_falhou', 'Os telefonemas da primeira semana definiram o resto.') },
      { id: 'centro', texto: 'Moderar o discurso e falar com quem não votou em você', comportamento: { empatia: 1 }, consequencia: () => 'Pouco risco, pouco ganho.', resolver: c => segundoTurno(c, 'centro', 'Você trocou o tom e as cores da campanha. A militância estranhou; o eleitor do meio ouviu.') },
      { id: 'rejeicao', texto: c => `Fazer campanha sobre a rejeição de ${camp(c)!.adversarios[camp(c)!.segundo!.adv].nome}`, comportamento: { impulsividade: 1 }, consequencia: () => 'Funciona quando a rejeição é real; volta contra quando parece ódio.',
        resolver: c => { desgastar(pol(c), 5, 'campanha'); return segundoTurno(c, c.r.chance(0.5) ? 'rejeicao' : 'rejeicao_falhou', 'A propaganda do segundo turno falou mais do outro do que de você.'); } },
      { id: 'debate', texto: c => `Desafiar ${camp(c)!.adversarios[camp(c)!.segundo!.adv].nome} para todos os debates`, comportamento: { coragem: 1 }, consequencia: c => (camp(c)?.debateFoi === 'bem' ? 'Você foi bem no debate do primeiro turno.' : 'O debate é o terreno de quem fala bem.'),
        resolver: c => segundoTurno(c, c.r.chance(camp(c)?.debateFoi === 'bem' ? 0.7 : 0.4) ? 'debate' : 'debate_falhou', 'Os debates do segundo turno foram cara a cara, sem plateia.') }
    ]
  },
  {
    id: 'presg_eixos', tipo: 'decisao', idade: [18, 99], tema: 'escolha', manual: true, repetir: 0, biografica: true,
    titulo: 'As prioridades do governo',
    texto: c => { const g = governoAtual(c.v); return `${g?.eixos.length ? `Hoje o governo corre atrás de ${g.eixos.map(x => EIXOS_129[x]).join(' e ')}. ` : 'O ministério pergunta por onde começar. '}Um governo com tudo de prioridade não tem prioridade nenhuma: no máximo duas.`; },
    opcoes: [...EIXO_OPCOES, { id: 'nao', texto: 'Deixar como está', resolver: () => ({ texto: 'O rumo segue o mesmo.', memoria: null }) }]
  },
  {
    id: 'presg_reforma', tipo: 'decisao', idade: [18, 99], tema: 'escolha', manual: true, repetir: 0, biografica: true,
    titulo: 'A reforma',
    texto: c => { const g = governoAtual(c.v)!; const r = regraDaPresidencia(c.v)!; return `Uma reforma é o que fica de um governo — se passar. ${cap(r.congresso)}: a base tem ${g.base}% das cadeiras; a aprovação nas ruas, ${Math.round(pol(c).mandato!.aprovacao)}%.`; },
    opcoes: [...REFORMA_OPCOES, { id: 'nao', texto: 'Não mandar nenhuma agora', resolver: () => ({ texto: 'A reforma fica para quando houver votos.', memoria: null }) }]
  },
  {
    id: 'presg_base', tipo: 'decisao', idade: [18, 99], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'A base no Congresso',
    texto: c => { const g = governoAtual(c.v)!; return `O governo tem ${g.base}% das cadeiras. ${g.base < 40 ? 'Assim, nada passa — e um processo de afastamento passaria.' : g.base < 55 ? 'Dá para aprovar lei; emenda à Constituição, não.' : 'A base está larga; manter custa.'} O líder do governo pede uma estratégia.`; },
    opcoes: BASE_OPCOES
  },
  {
    id: 'presg_economia', tipo: 'decisao', idade: [18, 99], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'A política econômica do ano',
    texto: c => { const g = governoAtual(c.v)!; const f = c.v.economia?.fase; return `A equipe econômica pede uma direção. Inflação de ${String(g.inflacao).replace('.', ',')}%, PIB ${g.pib >= 0 ? 'crescendo' : 'caindo'} ${String(Math.abs(g.pib)).replace('.', ',')}%, desemprego de ${String(g.desemprego).replace('.', ',')}%.${f === 'crise' ? ' O mundo está em crise.' : f === 'expansao' ? ' O mundo vai bem.' : ''}`; },
    opcoes: POLITICA_OPCOES
  },
  {
    id: 'presg_mundo', tipo: 'decisao', idade: [18, 99], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'A agenda internacional',
    texto: c => { const g = governoAtual(c.v)!; return `O Itamaraty${paisDaVida(c.v) === 'BR' ? '' : ' (o ministério das relações exteriores)'} montou a agenda do ano. Hoje o país é visto lá fora como ${g.mundo >= 65 ? 'um parceiro procurado' : g.mundo >= 45 ? 'um país como outro qualquer' : 'um país isolado'}.`.replace('O Itamaraty (o ministério das relações exteriores)', 'O ministério das relações exteriores'); },
    opcoes: MUNDO_OPCOES
  },
  {
    id: 'presg_crise', tipo: 'decisao', idade: [18, 99], tema: 'escolha', prioritario: true, prioridade: 4, repetir: 0,
    quando: c => !!c.v.caminhos.politica?.mandato?.crise && c.v.caminhos.politica.mandato.crise.t === c.v.t && !!CRISES_PRES[crise(c)],
    titulo: c => CRISES_PRES[crise(c)]?.titulo ?? 'A crise',
    texto: c => CRISES_PRES[crise(c)]?.texto(c) ?? 'Uma crise.',
    opcoes: opcoesDaCrise(CRISES_PRES)
  },
  {
    id: 'govg_crise', tipo: 'decisao', idade: [18, 99], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 0,
    quando: c => !!c.v.caminhos.politica?.mandato?.crise && c.v.caminhos.politica.mandato.crise.t === c.v.t && !!CRISES_GOV[crise(c)],
    titulo: c => CRISES_GOV[crise(c)]?.titulo ?? 'A crise',
    texto: c => CRISES_GOV[crise(c)]?.texto(c) ?? 'Uma crise.',
    opcoes: opcoesDaCrise(CRISES_GOV)
  },
  {
    id: 'presi_impeachment', tipo: 'decisao', idade: [18, 99], tema: 'escolha', prioritario: true, prioridade: 7, repetir: 0,
    quando: c => deHoje(c, 'pres_impeachment') && !!governoAtual(c.v)?.impeachment,
    titulo: c => cap(regraDaPresidencia(c.v)?.impeachment.nome ?? 'o processo de afastamento'),
    texto: c => {
      const g = governoAtual(c.v)!;
      const r = regraDaPresidencia(c.v)!;
      const casa = r.casas[(g.impeachment?.etapa ?? 1) - 1] ?? r.congresso;
      const q = (g.impeachment?.etapa ?? 1) === 1 ? r.impeachment.acusa : r.impeachment.condena;
      return `${cap(casa)} vai votar ${r.impeachment.nome}. Para ${(g.impeachment?.etapa ?? 1) === 1 ? 'aceitar a acusação' : 'condenar'}, a oposição precisa de ${q}% dos votos. A sua base tem ${g.base}%; a aprovação nas ruas é de ${Math.round(pol(c).mandato!.aprovacao)}%.${parceiro(c.v) ? ` Em casa, ${parceiro(c.v)!.p.nome} não dorme.` : ''}`;
    },
    opcoes: IMPEACHMENT_OPCOES
  },
  {
    id: 'presd_depois', tipo: 'decisao', idade: [18, 99], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 0, biografica: true,
    quando: c => deHoje(c, 'pres_depois') && !!c.v.caminhos.politica && c.v.caminhos.politica.fase !== 'encerrada',
    titulo: 'Depois da Presidência',
    texto: c => { const m = presidencia(c.v).mandatos[presidencia(c.v).mandatos.length - 1]; return `A faixa já é de outra pessoa.${m ? ` Ficou ${m.legado}.` : ''} Ex-presidente é título para o resto da vida — o que fazer com ele?`; },
    opcoes: [
      { id: 'partido', texto: 'Seguir na política: a voz mais ouvida do partido', resolver: c => ({ texto: 'Você continuou indo às reuniões do partido. Quando fala, a sala para.', memoria: 'Depois da Presidência, seguiu como liderança do partido.', relevancia: 'biografia', efeito: () => { const p = pol(c); p.apoio = clamp(p.apoio + 3); } }) },
      { id: 'memorias', texto: 'Escrever as memórias e dar palestras', resolver: c => ({ texto: `O livro de memórias vendeu bem; as palestras pagam ${fmt(local(c, 600000))} por ano, por um tempo.`, memoria: 'Escreveu as memórias da Presidência.', relevancia: 'biografia', efeito: () => { c.v.financas.conta += local(c, 600000); feliz(c, 4); marcar(c.v, 'politica', 'Publicou as memórias do governo.', 2); } }) },
      { id: 'fundacao', texto: 'Criar uma fundação com o seu nome', disponivel: c => custa(c, local(c, 150000), 'Não há esse dinheiro guardado.'),
        resolver: c => ({ texto: 'A fundação abriu com um seminário e uma biblioteca do seu governo. É onde o legado vai morar.', memoria: 'Criou uma fundação com o próprio nome.', relevancia: 'biografia', efeito: () => { pagar(c.v, local(c, 150000)); pol(c).reputacao = clamp(pol(c).reputacao + 3); } }) },
      { id: 'encerrar', texto: 'Encerrar a vida pública', comportamento: { familia: 1 }, resolver: c => ({ texto: 'Você devolveu o crachá de tudo. A primeira manhã sem agenda foi estranha; a segunda, nem tanto.', memoria: null, efeito: () => encerrarVidaPolitica(c.v, 'depois da Presidência') }) }
    ]
  },
  {
    id: 'presx_independente', tipo: 'decisao', idade: [18, 99], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'Sem partido',
    texto: c => `Para disputar ${presidente(c)} sem partido, a lei pede assinaturas de eleitores — centenas de milhares, em vários estados — e o dinheiro sai do seu bolso e de doações. Uma estrutura de coleta custa uns ${fmt(local(c, 250000))}.`,
    opcoes: [
      { id: 'coletar', texto: 'Montar a coleta de assinaturas', comportamento: { independencia: 1 }, disponivel: c => custa(c, local(c, 250000), 'Não há esse dinheiro guardado.'),
        consequencia: c => `Com o seu nome hoje: ${nomeNacional(c) >= 60 ? 'chance boa de chegar lá' : 'chance apertada'}.`,
        resolver: c => {
          const e = eleicaoNaJanela(c.v);
          const deu = !!e && c.r.chance(clamp(0.3 + nomeNacional(c) / 200 + pol(c).apoio / 300, 0.1, 0.9));
          if (!deu) return { texto: 'Faltaram assinaturas válidas em dois estados: a candidatura não saiu.', memoria: 'Tentou a candidatura independente à Presidência e não reuniu as assinaturas.', relevancia: 'biografia', tom: 'ruim', efeito: () => pagar(c.v, local(c, 250000)) };
          return { texto: 'As caixas de assinaturas chegaram ao tribunal eleitoral num caminhão. A candidatura foi aceita.', memoria: null, tom: 'bom', abrir: { id: 'presc_campanha' }, efeito: () => { pagar(c.v, local(c, 250000)); registrarIndependente(c.v, e!.t); } };
        } },
      { id: 'nao', texto: 'Desistir', resolver: () => ({ texto: 'A ideia ficou para outra eleição.', memoria: null }) }
    ]
  }
];

/** O segundo turno: a escolha da última semana e a apuração (`politica.apurar` → `presidencia129`). */
function segundoTurno(c: Ctx, escolha: string, abertura: string): Resultado {
  const x = camp(c)!;
  x.segundo!.escolha = escolha;
  if (escolha === 'apoio') c.v.fatos['pol_divida'] = c.v.t;
  apurar(c.v, c.r);
  const ultima = presidencia(c.v).candidaturas[presidencia(c.v).candidaturas.length - 1];
  const ganhou = ultima?.resultado === 'eleito';
  const falhou = /_falhou$/.test(escolha);
  return { texto: `${abertura}${falhou ? ' Não funcionou como se esperava.' : ''} ${ganhou ? `Na noite da apuração, deu você: ${String(ultima.segundo?.voce ?? 0).replace('.', ',')}%.` : `Na noite da apuração, deu ${ultima?.segundo?.adversario ?? 'o outro lado'}: você ficou com ${String(ultima?.segundo?.voce ?? 0).replace('.', ',')}%.`}`, memoria: null, tom: ganhou ? 'bom' : 'ruim' };
}

