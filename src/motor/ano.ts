/**
 * Um ano de vida.
 *
 * O ano é preenchido primeiro pela VIDA SISTÊMICA — o corpo, a escola, o
 * trabalho, a casa, as pessoas, os processos em curso — e só depois pelo
 * conteúdo: marcos garantidos, situações disparadas pelo estado (um pedido de
 * namoro, um bebê que nasceu) e, se sobrar espaço, algo sorteado do mundo.
 * Silêncio é permitido: nem todo ano precisa de uma história.
 */

import { fotografarEvolucao, praticandoPor } from './sistemas/progressao';
import { cansacoNosEstudos, faixaDaSemana, estudaAgora } from './sistemas/semana';
import { agendaDaSemana, presencaNaEscola, presencaNoCurso, presencaNoEstudo, processarAgenda } from './sistemas/agenda';
import { processarEstetica } from './sistemas/estetica';
import { processarCoisas } from './sistemas/coisas';
import { educacaoDaVida } from './mundo/vida';
import { processarMundo } from './sistemas/migracao';
import type { Rng } from './rng';
import { entrarNaVida, paisDaVida } from './mundo/vida';
import { clamp } from './rng';
import type { Retorno, Vida } from './tipos';
import { escrever, idade, transacao } from './nucleo';
import { morreEsteAno, processarCorpo } from './sistemas/corpo';
import { desenvolverPessoa } from './sistemas/pessoa';
import { processarOrigem } from './sistemas/origem';
import { processarFormacao } from './sistemas/formacao';
import { processarIndependencia } from './sistemas/independencia';
import { processarEstilo } from './sistemas/estilo';
import { processarFamiliaDeOrigem, processarConcepcao, processarGestacoes, processarMortes, processarPaternidade } from './sistemas/familia';
import { processarDescendentes, processarPartosDaFamilia } from './sistemas/filhos';
import { processarLuto } from './sistemas/luto';
import { alvoCabeca, alvoHumor, registrarEstado } from './sistemas/estado';
import { processarCurso, processarEscola, processarOab } from './sistemas/escola';
import { processarParalelas, tempoParaAObra } from './sistemas/paralelas';
import { processarAcademia } from './sistemas/academia';
import { processarHabilitacoes } from './sistemas/habilitacoes';
import { processarTrabalho } from './sistemas/trabalho';
import { processarProfissao } from './sistemas/profissao';
import { processarPolitica } from './sistemas/politica';
import { processarRotinas } from './sistemas/rotinas';
import { processarFundamentos } from './sistemas/perseguir';
import { processarPrisao } from './sistemas/prisao';
import { processarMundoVivo } from './sistemas/mundoVivo';
import { processarConcursos } from './sistemas/concurso';
import { processarEsporte, treinoProfissional } from './sistemas/esporte';
import { processarLesoes } from './sistemas/lesoes';
import { processarSobrecarga } from './sistemas/sobrecarga';
import { processarNotoriedade } from './sistemas/notoriedade';
import { processarArte } from './sistemas/arte';
import { processarAudiovisual } from './sistemas/audiovisual';
import { processarSituacoes } from './sistemas/situacoes';
import { processarTecnico } from './sistemas/tecnico';
import { processarNegocio } from './sistemas/negocio';
import { processarOportunidades } from './sistemas/oportunidades';
import { conhecerGente, envelhecerConhecidos, limparApertos, processarSocial, recalcularConvivio } from './sistemas/social';
import { processarRomance, surgirInteresse } from './sistemas/romance';
import { processarIniciativas } from './sistemas/iniciativas';
import { processarExposicao } from './sistemas/exposicao';
import { processarProcessos } from './sistemas/processos';
import { fotografar, processarDinheiro } from './sistemas/dinheiro';
import { avancarEconomia } from './sistemas/economia';
import { processarVeiculos } from './sistemas/veiculos';
import { processarImoveis } from './sistemas/imoveis';
import { processarColecao } from './sistemas/colecao';
import { processarExoticos } from './sistemas/exoticos';
import { processarParalelos } from './sistemas/paralelos';
import { processarClandestinos } from './sistemas/clandestinos';
import { processarEmpresas } from './sistemas/empresas';
import { processarPets } from './sistemas/pets';
import { processarObrigacoes } from './sistemas/obrigacoes';
import { calcularHeranca } from './sistemas/partilha';
import { processarJustica } from './sistemas/justica';
import { processarIlicito } from './sistemas/ilicito';
import { processarServicos } from './sistemas/servicosPorFora';
import { processarEquipe } from './sistemas/equipe';
import { processarPausa } from './sistemas/pausa';
import { processarRural } from './sistemas/rural';
import { processarTransformacao } from './sistemas/carreira';
import { efetivarMudancaMilitar } from './sistemas/militar';
import { abrirDecisao, abrirProximaDaFila, aplicarAcontecimento, candidatos, conteudoPorId, montarFila, preparar, sortear, vidaComumDoAno } from './conteudo/motor';
import { contexto } from './conteudo/base';
import { CATALOGO } from './conteudo/catalogo';
import type { Conteudo } from './conteudo/base';
// REWORK 4 (por último: não muda a ordem de inicialização dos módulos que já vinham antes).
import { processarRedes } from './sistemas/redes';
import { processarVidaEstudantil } from './sistemas/vidaEstudantil';
import { processarEstresseProlongado } from './sistemas/estresseProlongado';
import { processarConhecimento } from './sistemas/conhecimento';
import { processarBolsaDeAtleta } from './sistemas/naFormacao';
import { processarConvivio } from './sistemas/convivio';
import { processarTribunal } from './sistemas/tribunal';
import { processarSubmundo } from './sistemas/submundo';
import { processarCarreiraCriminal, processarLegado } from './sistemas/carreiraCriminal';
import { processarEncomendas } from './sistemas/encomendas';
import { processarRede } from './sistemas/redeCriminal';
import { processarFaccoes } from './sistemas/faccoes';
// REWORK 12.25: a vida de quem é procurado se registra em `justica` ao carregar (como o tribunal).
import './sistemas/defesa';
import { processarTrio } from './sistemas/afetosAdultos';
import { processarAliancas } from './sistemas/aliancas';
import { processarTreinadorDeGoleiros } from './sistemas/treinadorDeGoleiros';
import { processarMargem } from './sistemas/margem';
import { processarApostas } from './sistemas/apostas';
import { processarEcos } from './sistemas/ecos';
import { processarDistantes, processarIndiretos } from './sistemas/indiretos';
import { processarSeguroDesemprego } from './sistemas/seguroDesemprego';
import { fixarEstatura } from './sistemas/modalidades';
import { processarMagoas } from './sistemas/magoas';
import { processarAfetos } from './sistemas/afetos';
import { presenteDeAniversario } from './sistemas/dinheiroDaCrianca';

export interface ResumoDoAno {
  idade: number;
  entradas: string[];
}

export function avancarAno(vida: Vida): Retorno {
  entrarNaVida(vida);
  if (vida.morte) return { vida, aviso: { texto: 'Esta vida terminou.', tom: 'neutro' } };
  if (vida.momento) return { vida, aviso: { texto: 'Há uma decisão esperando por você.', tom: 'neutro' } };
  // Uma escolha de trajetória pendente (duas coisas que não cabem juntas) não fica esquecida: vira pergunta antes do ano andar.
  if (vida.caminhos.pendente && !vida.caminhos.pendente.perguntado) {
    const { vida: comPergunta } = transacao(vida, (v, r) => { const d = conteudoPorId('comp_conflito'); if (d && d.tipo === 'decisao') abrirDecisao(v, d, contexto(v, r)); });
    if (comPergunta.momento) return { vida: comPergunta, aviso: { texto: 'Há uma escolha esperando por você.', tom: 'neutro' } };
  }
  const { vida: nova } = transacao(vida, (v, r) => {
    // Um processo seletivo só existe com a etapa aberta; sem ela, acabou.
    if (v.caminhos.processo) v.caminhos.processo = undefined;
    // Uma escolha que foi perguntada e ficou sem resposta (a pergunta sumiu) é uma oferta que passou.
    if (v.caminhos.pendente?.perguntado) v.caminhos.pendente = undefined;
    viverAno(v, r);
  });
  return { vida: nova };
}

function viverAno(v: Vida, r: Rng): void {
  const inicioBio = v.biografia.length;
  v.t += 12;
  // A economia do país anda antes de tudo (e não depende de nada que a pessoa fez).
  const ec = avancarEconomia(v.economia, v.t, paisDaVida(v));

  // O que a semana do ano faz pela pessoa (treino, leitura) vale no MESMO ano: vem antes do corpo e da escola.
  praticandoPor('vida', () => desenvolverPessoa(v, r));
  processarCorpo(v, r);
  // A vista que pede óculos (a família compra, na infância).
  processarEstilo(v);
  processarLuto(v);
  limparApertos(v);
  processarPets(v, r);
  processarExoticos(v);
  processarCoisas(v);
  processarMortes(v, r);
  processarIndiretos(v);
  processarDistantes(v);
  processarFamiliaDeOrigem(v, r);
  // A casa de onde a pessoa veio: a folga real, a reserva que cresce ou se gasta, a família que pode precisar.
  processarOrigem(v);
  // REWORK 10.5 · ECO-04: o aniversário com os avós por perto, às vezes, vem com dinheiro no envelope.
  presenteDeAniversario(v);
  // Quem mudou de país: a adaptação, a língua, a naturalização (`migracao`). Quem nunca saiu não passa por aqui.
  processarMundo(v, r);
  // REWORK 9: a semana do ano em horários — o que acontece de fato (as aulas atravessadas viram falta; as atividades
  // sem horário não treinam). Uma conta só, lida pela escola, pelo curso e pelas atividades.
  const semanaDoAno = agendaDaSemana(v);
  // REWORK 9.5 · ROT-03: a dedicação rende o que o estudo em casa achou de horário na semana.
  const estudoDoAno = presencaNoEstudo(v, semanaDoAno);
  const cansaco = cansacoNosEstudos(v);
  praticandoPor('escola', () => processarEscola(v, r, presencaNaEscola(v, semanaDoAno), estudoDoAno, cansaco));
  praticandoPor('curso', () => processarCurso(v, r, presencaNoCurso(v, semanaDoAno), estudoDoAno, cansaco));
  // REWORK 10 · ROT-05: a bolsa de atleta se mantém treinando e indo bem no curso (ou acaba).
  processarBolsaDeAtleta(v);
  processarOab(v, r);
  // REWORK 10 · CRI-01: o processo como caminho (o acordo que a acusação oferece, a resposta do recurso).
  processarTribunal(v, r);
  processarJustica(v, r);
  processarPrisao(v);
  praticandoPor('trabalho', () => processarTrabalho(v, r));
  // A segunda trajetória (a paralela) e as pausadas: experiência, freguesia, prazo (`paralelas`).
  praticandoPor('paralela', () => processarParalelas(v));
  // A vida acadêmica: projetos que terminam em artigo, orientandos que defendem (`academia`).
  processarAcademia(v);
  // Os cursos de habilitação rara (barco, avião) que terminam no ano (`habilitacoes`).
  processarHabilitacoes(v);
  // Quem vive da arte e guardou tempo para a própria obra pratica mais (o efeito do ritmo leve).
  praticandoPor('obra', () => tempoParaAObra(v));
  praticandoPor('trabalho', () => processarProfissao(v, r));
  processarPolitica(v, r);
  // REWORK 11.5 · POL-05: as alianças e as promessas (os prazos que vencem, o aliado que pede ou rompe).
  processarAliancas(v);
  processarTransformacao(v);
  processarRural(v, r);
  processarPausa(v);
  processarNegocio(v, r);
  praticandoPor('treino', () => treinoProfissional(v, r));
  // O programa de fundamentos ANTES das rotinas: o ano de treino conta como prática (a frente não 'esfria' no mesmo ano).
  praticandoPor('treino', () => processarFundamentos(v));
  // REWORK 9: a agenda da semana (o que não existe mais sai; o conflito novo vira nota) — antes das rotinas, que leem a presença.
  const agendaDoAno = processarAgenda(v);
  processarRotinas(v, r, agendaDoAno.presenca);
  processarEstetica(v);
  // A formação como lugar: o que ficou para trás com a escola, o professor que repara.
  processarFormacao(v);
  // REWORK 4: o momento do ano dentro da escola ou do curso (a história interna da formação).
  praticandoPor('escola', () => processarVidaEstudantil(v));
  processarConcursos(v, r);
  efetivarMudancaMilitar(v);
  praticandoPor('treino', () => processarEsporte(v, r, agendaDoAno.presenca));
  // O banco: a temporada de quem dirige um time (clube real, jogos, pressão, contrato, propostas) — `tecnico`.
  processarTecnico(v, r);
  // REWORK 11.5 · ESP-04: o treinador de goleiros (a comissão, o degrau, os técnicos que mudam).
  processarTreinadorDeGoleiros(v);
  // A lesão volta (ou piora) depois da temporada que ela atravessou.
  processarLesoes(v, r);
  praticandoPor('obra', () => processarArte(v, r));
  processarAudiovisual(v, r);
  // A carreira, às vezes, produz um momento (o lance, o caso difícil, o crédito roubado): a escolha vem na fase de conteúdo.
  praticandoPor('acontecimento', () => processarSituacoes(v, r));
  processarProcessos(v, r);
  // REWORK 10.5 · REL-07: o que ficou das brigas (antes de a tensão e o conflito esfriarem no ano social).
  processarMagoas(v);
  recalcularConvivio(v);
  conhecerGente(v, r);
  envelhecerConhecidos(v, r);
  processarSocial(v, r);
  processarRomance(v, r);
  // REWORK 10.5 · REL-06: a parceria também pode sair do combinado (e você pode descobrir); a intimidade esfria sem contato.
  processarAfetos(v);
  // REWORK 11.5 · REL-22: o trio (a harmonia entre as duas pessoas, os ciúmes, a casa, o dinheiro, a crise).
  processarTrio(v);
  // As outras pessoas também agem: pedem, convidam, cobram, aparecem — e o silêncio do ano passado responde.
  processarIniciativas(v, r);
  // REWORK 10 · Fase C: o que se fez com as pessoas volta (a mentira descoberta, o segredo que vaza, a briga que esfria).
  processarConvivio(v);
  processarExposicao(v, r);
  surgirInteresse(v, r);
  processarConcepcao(v, r);
  processarGestacoes(v, r);
  // REWORK 11.5 · REL-21: a dúvida sobre a origem de um filho (quem reconhece × quem é), quando há causa.
  processarPaternidade(v);
  processarPartosDaFamilia(v, r);
  processarDescendentes(v, r);
  recalcularConvivio(v);
  processarOportunidades(v, r);
  processarMundoVivo(v);
  // REWORK 12.3 · E1: a equipe do trabalho (quem chefia, os colegas, o mentor, o rival, o reencontro, as sanções).
  processarEquipe(v);
  processarIlicito(v, r);
  // REWORK 12.3 · B2: o que o contratante ocasional encomendou pode vir à tona (sem envolvimento, sem carreira).
  processarServicos(v);
  // REWORK 10 · CRI-01: a trajetória à margem (a confiança do meio, os trabalhos maiores, os atritos, o cerco).
  processarMargem(v);
  // REWORK 11.5 · SUB-11: os ramos do Submundo (a prática, o mercado, a organização, as pessoas com ficha, as cenas).
  processarSubmundo(v);
  processarClandestinos(v, r);
  // REWORK 12.25: o Submundo vivo — as pessoas do caminho, as organizações (que andam sozinhas), as encomendas, a carreira
  // (o patamar, os marcos, a família, a saída aos poucos) e o legado de quem herdou esse nome.
  processarRede(v);
  processarFaccoes(v);
  processarEncomendas(v);
  processarCarreiraCriminal(v);
  processarLegado(v);
  processarVeiculos(v, r);
  processarImoveis(v, r, ec);
  // REWORK 12: a coleção (o mercado das peças) e as empresas (o ano de cada uma; a distribuição cai na conta).
  processarColecao(v, r);
  processarParalelos(v, r);
  processarEmpresas(v, r);
  // REWORK 10 · JOG-01: a mão esquecida na mesa, e o jogo que virou assunto (antes das contas do ano).
  processarSeguroDesemprego(v);
  processarApostas(v);
  processarEcos(v);
  fixarEstatura(v);
  processarDinheiro(v, r, ec);
  processarObrigacoes(v);
  // A primeira vez que as contas foram todas suas (a transição, não uma data): `independencia`.
  processarIndependencia(v);
  // O que o público sabe de você (esporte, obra, mandato, negócio) — depois do ano de cada um.
  processarNotoriedade(v, r);
  // REWORK 4: a rede (quem some perde gente; o comprado pode ser descoberto) e o que se fica sabendo de quem convive.
  processarRedes(v);
  processarConhecimento(v);
  // A semana do ano inteiro, contada: se passou do que cabe, cobra (e a vida pergunta).
  processarSobrecarga(v);
  equilibrarMente(v);
  // REWORK 4: a cabeça no limite por anos passa a conta ao corpo (causal: hábitos, a condição que piora, o risco).
  processarEstresseProlongado(v);
  registrarEstado(v);
  // REWORK 9 · PROG-01: a fotografia do ano (o que andou, por quê) — depois de tudo o que pratica e dá nota.
  fotografarEvolucao(v);
  // REWORK 9.5: a rotina que o ano de fato teve (a mesma semana que a escola, o curso e as atividades leram).
  const foto = v.evolucao?.[v.evolucao.length - 1];
  if (foto && idade(v) >= 4) foto.rotina = { faixa: faixaDaSemana(v), estresse: Math.round(v.mente.estresse), conflitos: agendaDoAno.conflitos.filter(c => c.perda >= 0.05).length, ...(estudaAgora(v) ? { postura: v.educacao.postura, ...(v.educacao.postura === 'dedicada' ? { estudo: Math.round(estudoDoAno * 100) / 100 } : {}) } : {}) };
  // As horas extras valiam para ESTE ano (semana, cabeça, sobrecarga, desempenho); no próximo, é outra escolha.
  v.trabalho.horasExtras = false;
  fotografar(v);

  const causa = morreEsteAno(v, r);
  if (causa) {
    v.morte = { t: v.t, causa, heranca: calcularHeranca(v) };
    escrever(v, { texto: `Morreu aos ${idade(v)} anos (${causa}).`, relevancia: 'marco', tema: 'morte' });
    v.anoAtual = { acoes: [] };
    return;
  }

  faseDeConteudo(v, r, v.biografia.length - inicioBio);
  v.anoAtual = { acoes: [] };
}

/**
 * Felicidade e estresse tendem a um ponto de equilíbrio que depende da vida
 * real: gente por perto, saúde, dinheiro, trabalho, a semana, perdas
 * recentes, atrito dentro de casa, o que se faz com o tempo livre.
 * Acontecimentos empurram (abalos); o equilíbrio puxa de volta, devagar.
 *
 * As causas e seus pesos moram em `sistemas/estado.ts` — a mesma conta que
 * a tela "Você" lê para dizer o que tem ajudado e o que tem pesado.
 */
function equilibrarMente(v: Vida): void {
  const m = v.mente;
  const humor = alvoHumor(v);
  const cabeca = alvoCabeca(v);
  m.felicidade = clamp(Math.round(m.felicidade * 0.65 + humor * 0.35));
  m.estresse = clamp(Math.round(m.estresse * 0.7 + cabeca * 0.3));
}

/* ---------------------------------------------------------------- Conteúdo */

const FAIXA_DECISAO: [number, number][] = [
  [2, 0], [5, 0.12], [11, 0.3], [17, 0.45], [29, 0.5], [59, 0.42], [200, 0.35]
];
const chanceDeDecisao = (i: number) => FAIXA_DECISAO.find(([max]) => i <= max)![1];

function decidiuRecentemente(v: Vida): boolean {
  return v.biografia.some(e => e.escolha && e.t === v.t - 12 && !e.texto.startsWith(`Fez ${educacaoDaVida(v).o}`));
}

function faseDeConteudo(v: Vida, r: Rng, linhasSistemicas: number): void {
  const i = idade(v);
  let acontecimentos = 0;

  // O mundo age primeiro (marcos, situações disparadas pelo estado, o sorteio); só DEPOIS a vida
  // pergunta — com o estado já mudado. Antes, um acontecimento do mesmo ano podia desfazer a
  // premissa de uma decisão já aberta (a decisão sobre a carreira, e a demissão logo depois).

  // 1. Marcos garantidos que são acontecimentos (desenvolvimento, passagens).
  for (const { c, ctx } of candidatos(v, r, c => !!c.garantido && c.tipo === 'acontecimento')) {
    if (c.tipo === 'acontecimento' && aplicarAcontecimento(v, c, ctx)) acontecimentos++;
  }

  // 2. Acontecimentos disparados pelo estado.
  const prioritarios = candidatos(v, r, c => !!c.prioritario && !c.garantido && c.tipo === 'acontecimento')
    .sort((a, b) => (b.c.prioridade ?? 1) - (a.c.prioridade ?? 1));
  for (const x of prioritarios) {
    if (x.c.tipo === 'acontecimento' && acontecimentos < 2 && preparar(x.c, v, r)) {
      if (aplicarAcontecimento(v, x.c, x.ctx)) acontecimentos++;
    }
  }

  // 3. O mundo: acontecimento sorteado, se o ano ainda comporta.
  const cheio = linhasSistemicas + acontecimentos;
  const chanceAcontecimento = i <= 2 ? 0.45 : cheio >= 4 ? 0.12 : cheio >= 2 ? 0.35 : 0.6;
  if (acontecimentos < 2 && r.chance(chanceAcontecimento)) {
    const x = sortear(v, r, c => c.tipo === 'acontecimento' && !c.prioritario && !c.garantido);
    if (x && x.c.tipo === 'acontecimento') aplicarAcontecimento(v, x.c, x.ctx);
  }

  // 4. As decisões, com o estado de agora: a garantida, a disparada pelo estado, ou uma sorteada.
  const garantida = candidatos(v, r, c => !!c.garantido && c.tipo === 'decisao')[0];
  if (garantida && !v.momento && garantida.c.tipo === 'decisao') abrirDecisao(v, garantida.c, garantida.ctx);
  if (!v.momento) {
    const decisaoPrioritaria = candidatos(v, r, c => !!c.prioritario && !c.garantido && c.tipo === 'decisao')
      .sort((a, b) => (b.c.prioridade ?? 1) - (a.c.prioridade ?? 1))[0];
    if (decisaoPrioritaria && decisaoPrioritaria.c.tipo === 'decisao') abrirDecisao(v, decisaoPrioritaria.c, decisaoPrioritaria.ctx);
  }
  if (!v.momento) {
    let chance = chanceDeDecisao(i);
    if (decidiuRecentemente(v)) chance *= 0.55;
    if (r.chance(chance)) {
      const x = sortear(v, r, c => c.tipo === 'decisao' && !c.prioritario && !c.garantido);
      if (x && x.c.tipo === 'decisao') abrirDecisao(v, x.c, x.ctx);
    }
  }

  // 5. REWORK 11.5 · EVT-01: o resto do ano — as outras decisões disparadas pelo estado, as que esperavam do ano passado e,
  // numa vida cheia, às vezes uma segunda. Abrem uma de cada vez, conferidas de novo (`conteudo/motor.montarFila`).
  montarFila(v);
  abrirProximaDaFila(v);
  vidaComumDoAno(v);
}

export function totalDeConteudo(): { acontecimentos: number; decisoes: number } {
  const acontecimentos = CATALOGO.filter((c: Conteudo) => c.tipo === 'acontecimento').length;
  return { acontecimentos, decisoes: CATALOGO.length - acontecimentos };
}
