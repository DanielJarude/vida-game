/**
 * Compromissos: quando uma trajetória nova não cabe junto com a vida que já
 * existe, o jogo PERGUNTA. Nunca resolve em silêncio.
 *
 *   A vida acontece (a peneira deu certo, a vaga saiu, o concurso chamou, a
 *   convocação veio); o que a pessoa larga para caber — ou se tenta dar conta
 *   de tudo — é escolha dela. Aqui mora a regra: o que conflita com o quê, o
 *   que dá para conciliar, o que cada plano custa. A pergunta mora em
 *   `conteudo/compromissos` (e, quando a oferta já chega com conflito, nas
 *   próprias decisões, pelas opções de plano).
 *
 *   CONFLITO não é só tempo. Há o lugar (a faculdade presencial é em outra
 *   cidade), a regra (conscrito não troca o quartel por um emprego) e o
 *   tempo (treino de base todo dia não cabe com expediente inteiro).
 *
 *   Todo plano diz, ANTES, o que acontece; e, depois, cada coisa deixada
 *   entra na Linha da Vida com o motivo ("Trancou Direito para entrar na
 *   base do Bahia").
 */

import { aEquipe } from './esporte';
import type { Rng } from '../rng';
import type { AjusteDeEmprego, CompromissoPendente, Dominio, Emprego, Negocio, NovoCompromisso, PlanoDeConflito, Vida } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { iniciarRural } from './rural';
import { doClube, oClube } from '../dados/clubes';
import { curso, cursoOuNulo } from '../dados/cursos';
import { ocupacao, ocupacaoOuNula } from '../dados/ocupacoes';
import { municipio } from '../dados/lugares';
import { listaNatural } from '../texto';
import { contratar, eDasForcas, encerrarEmprego, nomeOcupacao, textoDeContratacao } from './trabalho';
import { encerrarCarreira, entrarNaBase, profissionalizar, NOME_MOD, OCUPACOES_DE_ATLETA } from './esporte';
import { atletaSemClube, tecnicoSemClube } from './situacaoProfissional';
import { flex, ge } from '../texto';
import type { Ocupacao } from '../dados/ocupacoes';
import { fem, negocioFeminino, presencaDe, socioVivo, abrirNegocio, dedicarAoNegocio, fecharNegocio, negocioAberto, passarParaHorasVagas, podeTocarNasHorasVagas, tipoDoNegocio, tipoNegocio, valorDoNegocio, venderNegocio } from './negocio';
import { marcar } from './marcas';
import { incorporarAoServico } from './militar';
import { tDe } from '../tempo';
import { efetivarMatricula } from './escola';
import { mudarAgora } from './processos';
import { modeloRotina } from './rotinas';
import { largarEscola } from './escola';
import type { Turno } from '../tipos';
import { entrarComoParalela, moverParaParalela, novaViraPrincipal, pausadaDe, pausarAtual, podeConciliar, podePausar, retomarPausada, TRILHAS_ARTISTICAS } from './paralelas';

/**
 * Vias em que a pessoa JÁ escolheu trocar, sabendo antes o que perdia: a
 * candidatura feita na tela de vagas (que diz "entrar aqui é deixar o trabalho
 * de X") e começar por conta. Toda outra porta (convite, bolsa, indicação,
 * concurso, retorno) pergunta o que fazer com o trabalho de agora.
 */
const VIAS_DE_TROCA_ESCOLHIDA = new Set(['curriculo', 'por_conta']);
/** Via interna: o conflito do emprego de agora com um curso (só "deixar o trabalho" — o plano de conciliar é do próprio curso). */
const VIA_CURSO = '__curso__';

/* ============================================================== O que existe */

type IdAtual = 'curso' | 'emprego' | 'base' | 'negocio' | 'servico' | 'mandato' | 'cidade' | 'agenda' | 'carreira';

export interface Alternativa {
  /** O que se larga (id aplicável) — ou `conciliar`. */
  larga?: string;
  conciliar?: boolean;
  /** Verbo no infinitivo: "trancar a faculdade de Direito". */
  texto: string;
  /** O que acontece, dito antes. */
  consequencia: string;
}

export interface ConflitoDeEntrada {
  com: IdAtual;
  /** Em palavras, para a pergunta ("a faculdade de Direito, em período integral"). */
  rotulo: string;
  /** Por que não cabe. */
  motivo: string;
  alternativas: Alternativa[];
  /** Não há como largar isto (o serviço militar inicial, por exemplo): o novo não entra. */
  impede?: boolean;
}

const cursoEmAndamento = (v: Vida) => { const m = v.educacao.matricula; return m && !m.trancado ? m : undefined; };
const nomeDoCurso = (id: string) => curso(id).nome;
const MFDV = new Set(['medicina', 'farmacia', 'odontologia', 'veterinaria']);

/** Está no serviço militar inicial (os doze meses obrigatórios)? */
export function noServicoInicial(v: Vida): boolean {
  const m = v.caminhos.militar;
  const e = v.trabalho.atual;
  return !!m && !!e && eDasForcas(ocupacao(e.ocupacaoId)) && m.quadro === 'temporario' && v.t - m.tIngresso < 12;
}

/** O emprego é o do próprio negócio (dono em tempo integral)? */
const ehDono = (v: Vida) => { const n = negocioAberto(v); return !!n && (n.dedicacao ?? 'integral') === 'integral' && v.trabalho.atual?.ocupacaoId === n.ocupacaoId; };

function nomeEmprego(v: Vida): string {
  const e = v.trabalho.atual!;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  return oc ? nomeOcupacao(v, oc) : 'o trabalho';
}

/* ======================================================= Conflitos, por novo */

function conflitoComCurso(v: Vida, novo: NovoCompromisso, pesado: boolean, municipioDoNovo?: string): ConflitoDeEntrada | undefined {
  const m = cursoEmAndamento(v);
  if (!m || m.modalidade === 'ead') return undefined;
  const c = curso(m.cursoId);
  const outraCidade = municipioDoNovo && m.municipioId !== municipioDoNovo;
  const integral = c.carga === 'integral';
  if (!pesado && !outraCidade) return undefined;
  const nomeC = c.nivel === 'superior' ? `a faculdade de ${c.nome}` : `o curso de ${c.nome}`;
  const alternativas: Alternativa[] = [{ larga: 'curso', texto: `trancar ${nomeC}`, consequencia: `${cap(nomeC)} fica trancad${c.nivel === 'superior' ? 'a' : 'o'}: a vaga espera até quatro anos.` }];
  if (!integral && !outraCidade && novo.tipo !== 'servico_militar') alternativas.push({ conciliar: true, texto: 'tentar dar conta dos dois', consequencia: `${cap(nomeC)} continua à noite. A semana passa do que cabe: a cabeça e as notas sentem.` });
  // REWORK 10.6 · AGE-01: o REWORK 4 deixava tentar curso integral + emprego ("aula de dia, trabalho no resto") — na agenda,
  // os dois das 8h às 17h, de segunda a sexta. Dois compromissos presenciais obrigatórios ao mesmo tempo não existem:
  // com o curso integral, o emprego de dia não entra (trancar o curso, recusar, ou procurar trabalho à noite/fim de semana).
  if (!integral && !outraCidade && novo.tipo === 'servico_militar') alternativas.push({ conciliar: true, texto: 'seguir estudando à noite', consequencia: 'Quartel de dia, aula à noite. A semana fica no limite.' });
  const motivo = municipioDoNovo === '__longe__' ? `O curso de formação é em regime de internato, longe: ${nomeC} não tem como seguir` : outraCidade ? `${cap(nomeC)} é presencial em ${municipio(m.municipioId).nome}` : integral ? `${cap(nomeC)} é em período integral` : `${cap(nomeC)} ocupa as noites`;
  return { com: 'curso', rotulo: nomeC, motivo, alternativas };
}

/**
 * REWORK 9 · a agenda: o conflito de HORÁRIO (o expediente novo atravessa a escola, uma atividade marcada) é dito pela
 * agenda (`sistemas/agenda`, que mora num pacote acima deste e registra a regra aqui ao carregar). Sem a agenda
 * carregada, só os conflitos grandes de sempre.
 */
export type AnaliseDeHorario = (v: Vida, ocupacaoId: string) => ConflitoDeEntrada | undefined;
let analiseDeHorario: AnaliseDeHorario | undefined;
export function registrarAnaliseDeHorario(f: AnaliseDeHorario): void { analiseDeHorario = f; }
/** REWORK 10.6 · AGE-01: a reconciliação da agenda (registrada por `agenda`, que mora acima) — logo depois de algo entrar. */
let reconciliacao: ((v: Vida) => unknown) | undefined;
export function registrarReconciliacao(f: (v: Vida) => unknown): void { reconciliacao = f; }
const conflitoDeHorario = (v: Vida, ocupacaoId: string) => analiseDeHorario?.(v, ocupacaoId);
/**
 * REWORK 10.6 · AGE-01: o horário que IMPEDE (o expediente em cima da aula, sem turno que resolva) — dito antes de se
 * candidatar, não depois de aprovado. Só para quem está na escola: é o único compromisso que não se troca por outro.
 */
export function horarioQueImpede(v: Vida, ocupacaoId: string): ConflitoDeEntrada | undefined {
  if (!v.educacao.basica || v.educacao.evadiu) return undefined;
  const c = conflitoDeHorario(v, ocupacaoId);
  return c?.impede ? c : undefined;
}

function conflitoComEmprego(v: Vida, novo: NovoCompromisso): ConflitoDeEntrada | undefined {
  const e = v.trabalho.atual;
  if (!e || e.contrato === 'eletivo') return undefined;
  if (noServicoInicial(v)) return { com: 'servico', rotulo: 'o serviço militar', motivo: 'Durante o serviço militar inicial, o quartel não libera: são doze meses obrigatórios', alternativas: [], impede: true };
  if (ehDono(v)) {
    const n = negocioAberto(v)!;
    const alternativas: Alternativa[] = [];
    if (podeTocarNasHorasVagas(v, n)) alternativas.push({ larga: 'negocio_paralelo', texto: `deixar ${n.nome} para as horas vagas`, consequencia: `${n.nome} continua seu, ${fem(n.nome, 'tocado')} nas horas vagas${(n.equipe?.length ?? 0) > 0 ? ' e pela equipe' : ''}: cresce mais devagar e não paga retirada fixa.` });
    alternativas.push({ larga: 'negocio_fechar', texto: valorDoNegocio(v, n) > 0 ? `vender ${n.nome}` : `fechar ${n.nome}`, consequencia: valorDoNegocio(v, n) > 0 ? `${n.nome} é ${fem(n.nome, 'vendido')}: o dinheiro entra, a história acaba.` : `${n.nome} ${fechaAs(n)}.` });
    return { com: 'negocio', rotulo: n.nome, motivo: `${n.nome} é o seu trabalho de todo dia`, alternativas };
  }
  // REWORK 11 · Fase B: a contratação que vem de um acontecimento que JÁ decidiu a troca (a efetivação do aprendiz, o
  // "pedir as contas para trabalhar por conta", a proposta em outra cidade aceita) não pergunta de novo pelo emprego.
  if (novo.tipo === 'emprego' && novo.substitui) return undefined;
  const nome = nomeEmprego(v);
  // Emprego novo no lugar do atual: quem se candidatou pela tela de vagas já escolheu trocar (e foi avisado antes).
  // Convite, bolsa, indicação, concurso, retorno: ninguém escolheu ainda o que fazer com o trabalho de agora — pergunta.
  if (novo.tipo === 'emprego' && VIAS_DE_TROCA_ESCOLHIDA.has(novo.via)) return undefined;
  if (novo.tipo === 'emprego' && novo.ocupacaoId === e.ocupacaoId && novo.via !== VIA_CURSO) return undefined;
  // REWORK 10.5 · CAR-12: na mesma carreira artística (de ator a ator conhecido, de músico a músico profissional), o
  // convite é um degrau dela — não um emprego concorrente. Antes, o ator conhecido ouvia "Você trabalha como ator
  // conhecido, o dia inteiro: deixar o trabalho / pausar a carreira" diante de um papel. O conflito real de agenda
  // (duas produções integrais) é do contrato (`audiovisual.conflitoDoContrato`), não da profissão.
  if (novo.tipo === 'emprego' && novo.via !== VIA_CURSO && mesmaCarreiraArtistica(e.ocupacaoId, novo.ocupacaoId)) return undefined;
  if (novo.tipo === 'servico_militar') return undefined; // o emprego fica guardado (lei), não é conflito
  if (novo.tipo === 'negocio') {
    return {
      com: 'emprego', rotulo: `o trabalho de ${nome}`, motivo: `Você trabalha como ${nome}`,
      alternativas: [
        { larga: 'negocio_nas_horas_vagas', texto: `manter o trabalho de ${nome} e tocar o negócio nas horas vagas`, consequencia: 'O salário continua. O negócio cresce devagar, pede noites e fins de semana, e não paga retirada fixa.' },
        { larga: 'emprego', texto: `deixar o trabalho de ${nome} e se dedicar ao negócio`, consequencia: `O salário de ${nome} acaba. O negócio vira o trabalho de todo dia: cresce mais — e o risco é todo seu.` }
      ]
    };
  }
  const oc = ocupacao(e.ocupacaoId);
  const estavel = e.contrato === 'servidor' ? ' — e a estabilidade do cargo' : '';
  // REWORK 11 · Fase B: deixar o clube por outro trabalho é encerrar a carreira de atleta (dito antes; feito na hora, com registro).
  const atleta = OCUPACOES_DE_ATLETA.includes(e.ocupacaoId) && v.caminhos.esporte?.fase === 'profissional';
  const alternativas: Alternativa[] = [{ larga: 'emprego', texto: atleta ? `deixar o clube e encerrar a carreira de ${nome}` : `deixar o trabalho de ${nome}`, consequencia: atleta ? `A carreira de ${nome} acaba agora: temporadas, números e títulos ficam no histórico; proposta de clube deixa de chegar.` : `O trabalho de ${nome}${oc.concurso ? ' (concursado)' : ''} acaba${estavel}. O que você fez ali fica no currículo.` }];
  if (novo.tipo === 'emprego' && novo.via !== VIA_CURSO) {
    const noc = ocupacao(novo.ocupacaoId);
    // Pausar não é apagar: quem trabalha por projeto pausa a agenda; o servidor pede licença sem salário.
    if (podePausar(v)) alternativas.push(e.contrato === 'servidor'
      ? { larga: 'emprego_licenca', texto: `pedir licença sem salário do cargo de ${nome}`, consequencia: `O cargo de ${nome} espera por um tempo (sem salário). Dá para voltar; se não voltar, ele acaba.` }
      : { larga: 'emprego_pausa', texto: `pôr a carreira de ${nome} em pausa`, consequencia: `A agenda de ${nome} para. Trabalhos, contatos e nome continuam: voltar depois é retorno, não recomeço.` });
    // Conciliar só quando é plausível (uma das duas é por conta, por projeto ou de meio período).
    if (podeConciliar(v, noc)) {
      const principal = novaViraPrincipal(v, noc);
      alternativas.push({ conciliar: true, larga: principal ? 'emprego_paralela' : 'novo_paralela', texto: principal ? `manter ${nome} em paralelo` : `seguir como ${nome} e fazer isso em paralelo`, consequencia: principal ? `${cap(nome)} continua, com menos trabalhos. A semana fica mais cheia.` : `${cap(nome)} continua sendo o trabalho principal; o novo entra em parte da semana, rendendo menos.` });
    }
  }
  return { com: 'emprego', rotulo: `o trabalho de ${nome}`, motivo: `Você trabalha como ${nome}${e.carga === 'integral' ? ', o dia inteiro' : ''}`, alternativas };
}

/**
 * REWORK 11 · Fase B — a carreira especial SEM contrato não é desemprego. O atleta sem clube que aceita um emprego
 * comum (a indicação da amiga manicure) deixava de ser atleta na virada do ano, em silêncio (`esporte`: quem tem outro
 * trabalho sai da carreira). Agora a vida pergunta ANTES, e o plano encerra a carreira NA HORA, com o registro de
 * sempre (`esporte.encerrarCarreira`: "Pendurou as chuteiras"). O técnico sem clube segue com o telefone ligado mesmo
 * em outro trabalho (`tecnico`: as propostas continuam, um pouco menos, até quatro anos sem banco) — a pergunta diz
 * que dá para fazer em paralelo. A carreira artística em pausa continua em pausa (não se perde nada: sem pergunta).
 */
function conflitoComCarreiraEspecial(v: Vida, novo: NovoCompromisso): ConflitoDeEntrada | undefined {
  if (novo.tipo !== 'emprego' || v.trabalho.atual) return undefined;
  const noc = ocupacaoOuNula(novo.ocupacaoId);
  if (!noc || OCUPACOES_DE_ATLETA.includes(noc.id)) return undefined;
  const g = ge(v);
  const es = atletaSemClube(v);
  if (es) {
    const jog = es.modalidade === 'futebol' ? flex(g, 'jogador', 'jogadora') : 'atleta';
    const sem = es.modalidade === 'tenis' ? 'sem quem banque o circuito' : ['futebol', 'basquete', 'volei'].includes(es.modalidade) ? 'sem clube' : 'sem equipe';
    return { com: 'carreira', rotulo: `a carreira de ${jog} (${sem})`, motivo: `Você é ${jog} profissional ${sem}, esperando proposta — e um trabalho fixo encerra a carreira`,
      alternativas: [{ larga: 'carreira_esporte', texto: `encerrar a carreira de ${jog}`, consequencia: `A carreira de ${jog} acaba agora: temporadas, números e títulos ficam no histórico; proposta de clube deixa de chegar.` }] };
  }
  if (tecnicoSemClube(v) && noc.trilha !== 'treino') {
    const tec = flex(g, 'técnico', 'técnica');
    return { com: 'carreira', rotulo: `a carreira de ${tec} (sem clube)`, motivo: `Você é ${tec} sem clube, esperando proposta`,
      alternativas: [{ texto: `seguir como ${tec} sem clube, em paralelo`, consequencia: `A carreira de ${tec} continua: proposta de clube ainda pode chegar (um pouco menos, com outro trabalho) — quatro anos sem banco a encerram.` }] };
  }
  return undefined;
}

/** Duas ocupações da mesma trilha artística (a identidade profissional é uma só; muda o degrau). */
export function mesmaCarreiraArtistica(a: string, b: string): boolean {
  const x = ocupacaoOuNula(a), y = ocupacaoOuNula(b);
  return !!x && !!y && x.trilha === y.trilha && TRILHAS_ARTISTICAS.has(x.trilha);
}

/** Um curso presencial em outra cidade: ninguém muda de cidade sem dizer que sim. */
function conflitoComCidade(v: Vida, municipioId: string, oque: string): ConflitoDeEntrada | undefined {
  if (municipioId === v.moradia.municipioId) return undefined;
  const destino = municipio(municipioId).nome;
  return { com: 'cidade', rotulo: `a vida em ${municipio(v.moradia.municipioId).nome}`, motivo: `${cap(oque)} é presencial em ${destino} — e você mora em ${municipio(v.moradia.municipioId).nome}`, alternativas: [{ larga: 'mudar', texto: `se mudar para ${destino}`, consequencia: `Você se muda para ${destino}: casa nova, custo de mudança, e o que é de lugar fixo aqui fica para trás.` }] };
}

/**
 * REWORK 10 · ROT-05 — a base junto com a faculdade e o trabalho. Antes, estar numa base era ocupação EXCLUSIVA: todo
 * emprego e todo curso presencial perguntavam "deixar a base?", e só isso — mesmo a faculdade à noite, com o treino à
 * tarde. Agora a resposta é a conta da agenda (`agenda.baseComONovo`, registrada aqui ao carregar): os horários do clube,
 * o lugar (o alojamento é noutra cidade?), o turno que deixa o treino acontecer e o descanso da semana. Cabe: entra, sem
 * pergunta. Cabe apertado (alguns treinos se perdem, ou a semana passa do que se aguenta): a pergunta tem o plano de
 * conciliar, com o preço dito. Não cabe: diz por quê — o horário, o lugar, o descanso.
 */
export type AnaliseDaBase = (v: Vida, novo: NovoCompromisso) => { vezes: number; cabem: number; turno?: Turno; faixa: string; ocupam?: string; quando: string } | undefined;
let analiseDaBase: AnaliseDaBase | undefined;
export function registrarAnaliseDaBase(f: AnaliseDaBase): void { analiseDaBase = f; }
export const leituraDaBaseCom = (v: Vida, novo: NovoCompromisso) => analiseDaBase?.(v, novo);

function deixarABase(v: Vida): Alternativa {
  const es = v.caminhos.esporte!;
  const equipe = es.modalidade === 'futebol' ? 'a base' : 'a equipe';
  return { larga: 'base', texto: `deixar ${equipe} ${doClube(es.clube)}`, consequencia: `O sonho de viver do ${NOME_MOD[es.modalidade] ?? 'esporte'} fica para trás; ${NOME_MOD[es.modalidade] ?? 'o esporte'} volta a ser por gosto.` };
}

function conflitoComBase(v: Vida, novo: NovoCompromisso): ConflitoDeEntrada | undefined {
  const es = v.caminhos.esporte;
  if (es?.fase !== 'base') return undefined;
  const equipe = es.modalidade === 'futebol' ? 'a base' : 'a equipe';
  const rotulo = `${equipe} ${doClube(es.clube)}`;
  const deixar = deixarABase(v);
  // O negócio de dono, o quartel: tomam o dia inteiro, todos os dias — a regra de sempre.
  if (novo.tipo !== 'curso' && novo.tipo !== 'emprego') return { com: 'base', rotulo, motivo: `${cap(equipe)} ${doClube(es.clube)} treina quase todo dia`, alternativas: [deixar] };
  if (novo.tipo === 'curso' && novo.modalidade === 'ead') return undefined;
  // O LUGAR: quem treina longe de casa fica no alojamento durante a semana.
  const alojamento = !!es.municipioId && es.municipioId !== v.moradia.municipioId;
  const ondeTreina = es.municipioId ? municipio(es.municipioId).nome : '';
  if (alojamento && novo.tipo === 'curso' && novo.municipioId !== es.municipioId)
    return { com: 'base', rotulo, motivo: `${cap(equipe)} ${doClube(es.clube)} treina em ${ondeTreina}, onde você fica no alojamento durante a semana — e o curso é presencial em ${municipio(novo.municipioId).nome}`, alternativas: [deixar] };
  if (alojamento && novo.tipo === 'emprego')
    return { com: 'base', rotulo, motivo: `Durante a semana você fica no alojamento ${doClube(es.clube)}, em ${ondeTreina}: o trabalho é em ${municipio(v.moradia.municipioId).nome}`, alternativas: [deixar] };
  const a = analiseDaBase?.(v, novo);
  // Sem a agenda carregada (só o pacote de baixo), a resposta conservadora de antes.
  if (!a) return { com: 'base', rotulo, motivo: `${cap(equipe)} ${doClube(es.clube)} treina quase todo dia`, alternativas: [deixar] };
  const oQue = novo.tipo === 'curso' ? (curso(novo.cursoId).nivel === 'superior' ? 'a faculdade' : 'o curso') : 'o trabalho';
  const folga = a.faixa === 'folgada' || a.faixa === 'ocupada' || a.faixa === 'cheia';
  if (a.cabem >= a.vezes && folga) return undefined;
  const treinos = `${a.cabem === 0 ? 'nenhum' : `só ${a.cabem}`} dos ${a.vezes} treinos da semana`;
  // Não cabe: metade ou mais dos treinos sem horário, ou a semana além do que um corpo aguenta.
  if (a.faixa === 'alem' || a.cabem * 2 < a.vezes) {
    const motivo = a.faixa === 'alem' && a.cabem >= a.vezes
      ? `Descanso insuficiente: ${equipe} ${doClube(es.clube)} (treino quase todo dia), ${oQue} e o que você já tem passam do que uma pessoa aguenta numa semana`
      : `Horário incompatível: ${equipe} ${doClube(es.clube)} treina ${a.quando}, e com ${oQue} ${treinos} ${a.cabem === 1 ? 'acha' : 'acham'} horário${a.ocupam ? ` (${a.ocupam} ocupam esses horários)` : ''}`;
    return { com: 'base', rotulo, motivo, alternativas: [deixar] };
  }
  // Cabe apertado: dá para tentar — com o preço dito.
  const perde = a.cabem < a.vezes;
  const motivo = perde
    ? `${cap(equipe)} ${doClube(es.clube)} treina ${a.quando}: com ${oQue}, ${treinos} ${a.cabem === 1 ? 'acha' : 'acham'} horário${a.ocupam ? ` (${a.ocupam} ocupam os outros)` : ''}`
    : `${cap(equipe)} ${doClube(es.clube)}, ${oQue} e o que você já tem cabem nos horários — mas a semana passa do que se aguenta descansando`;
  const consequencia = perde
    ? `Treina nas vezes que sobram. O treinador repara em quem falta: a técnica anda menos e a vaga na base fica mais arriscada.`
    : `Treino, ${oQue === 'o trabalho' ? 'expediente' : 'aula'} e descanso curto: dá para tentar — o cansaço, o estresse e o rendimento cobram.`;
  return { com: 'base', rotulo, motivo, alternativas: [deixar, { conciliar: true, texto: `seguir n${equipe} ${doClube(es.clube)}, tentando dar conta de tudo`, consequencia }] };
}

const PALAVRA_DO_TURNO: Record<Turno, string> = { manha: 'manhã', tarde: 'tarde', noite: 'noite', integral: 'dia inteiro' };
/** Dito antes de tentar: o curso ou o trabalho cabe junto com a base (e em que turno o treino deixa). */
export function notaDaBaseCom(v: Vida, novo: NovoCompromisso): string | undefined {
  const es = v.caminhos.esporte;
  if (es?.fase !== 'base' || (novo.tipo !== 'curso' && novo.tipo !== 'emprego')) return undefined;
  if (novo.tipo === 'curso' && novo.modalidade === 'ead') return undefined;
  if (analisarEntrada(v, novo).some(c => c.com === 'base')) return undefined;
  const a = analiseDaBase?.(v, novo);
  if (!a) return undefined;
  const equipe = es.modalidade === 'futebol' ? 'a base' : 'a equipe';
  const oQue = novo.tipo === 'curso' ? 'as aulas' : 'o trabalho';
  return `Cabe junto com ${equipe} ${doClube(es.clube)}: os ${a.vezes} treinos da semana acham horário${a.turno ? `, com ${oQue} no turno da ${PALAVRA_DO_TURNO[a.turno]}` : ''}.`;
}

/** A entrada que aconteceu ao lado da base guarda o turno em que o treino cabe (a conta acima o escolheu). */
function guardarTurnoAoLadoDaBase(v: Vida, novo: NovoCompromisso, a = v.caminhos.esporte?.fase === 'base' ? analiseDaBase?.(v, novo) : undefined): void {
  if (!a?.turno) return;
  const fonte = novo.tipo === 'curso' ? 'curso' : novo.tipo === 'emprego' ? 'trabalho' : undefined;
  if (!fonte) return;
  const ag = (v.agenda ??= {});
  (ag.turnos ??= {})[fonte] = a.turno;
}

function conflitoComNegocioParalelo(v: Vida, novo: NovoCompromisso): ConflitoDeEntrada | undefined {
  const n = negocioAberto(v);
  if (!n || (n.dedicacao ?? 'integral') !== 'paralela' || novo.tipo === 'negocio' || novo.tipo === 'dedicar_negocio') return undefined;
  if (novo.tipo !== 'base' && novo.tipo !== 'servico_militar') return undefined;
  const sozinho = (n.equipe?.length ?? 0) === 0 && !socioVivo(v, n);
  if (!sozinho) return undefined;
  const t = tipoDoNegocio(n);
  if (t?.presenca === 'online' || n.emCasa) return undefined;
  return { com: 'negocio', rotulo: n.nome, motivo: `${n.nome} depende de você nas horas vagas — e elas acabariam`, alternativas: [{ larga: 'negocio_fechar', texto: valorDoNegocio(v, n) > 0 ? `vender ${n.nome}` : `fechar ${n.nome}`, consequencia: `${n.nome} ${valorDoNegocio(v, n) > 0 ? `é ${fem(n.nome, 'vendido')}` : fechaAs(n)}.` }, { conciliar: true, texto: `manter ${n.nome} de qualquer jeito`, consequencia: 'O negócio fica quase parado: o movimento cai ano a ano.' }] };
}

/** O que conflita com a entrada de algo novo. */
export function analisarEntrada(v: Vida, novo: NovoCompromisso): ConflitoDeEntrada[] {
  const out: ConflitoDeEntrada[] = [];
  const push = (c?: ConflitoDeEntrada) => { if (c) out.push(c); };
  // Durante o serviço inicial, nada novo entra — a não ser estudar à noite na cidade do quartel.
  const cursoLeve = novo.tipo === 'curso' && (novo.modalidade === 'ead' || (curso(novo.cursoId).carga !== 'integral' && novo.municipioId === v.moradia.municipioId));
  if (noServicoInicial(v) && novo.tipo !== 'servico_militar' && !cursoLeve) return [{ com: 'servico', rotulo: 'o serviço militar', motivo: 'Durante o serviço militar inicial, o quartel não libera: são doze meses obrigatórios', alternativas: [], impede: true }];
  switch (novo.tipo) {
    case 'base': {
      // REWORK 10 · ROT-05: entrar na base com o curso ou o trabalho que já existem — a mesma conta de horário, lugar e
      // descanso. O curso noturno na cidade do clube e o meio período no contraturno cabem; o resto pergunta, como antes.
      const a = analiseDaBase?.(v, novo);
      const cabe = !!a && a.cabem >= a.vezes && (a.faixa === 'folgada' || a.faixa === 'ocupada' || a.faixa === 'cheia');
      const m = cursoEmAndamento(v);
      const cursoCabe = cabe && (!m || m.modalidade === 'ead' || (m.municipioId === novo.municipioId && cursoOuNulo(m.cursoId)?.carga !== 'integral'));
      const e = v.trabalho.atual;
      const empregoCabe = cabe && novo.municipioId === v.moradia.municipioId && !!e && !ehDono(v) && !noServicoInicial(v) && e.contrato !== 'eletivo' && !ocupacaoOuNula(e.ocupacaoId)?.jornada;
      if (!cursoCabe) push(conflitoComCurso(v, novo, true, novo.municipioId));
      if (!empregoCabe) push(conflitoComEmprego(v, novo));
      push(conflitoComNegocioParalelo(v, novo));
      break;
    }
    case 'contrato_esporte':
      push(conflitoComCurso(v, novo, true));
      push(conflitoComEmprego(v, novo));
      break;
    case 'emprego': {
      const oc = ocupacao(novo.ocupacaoId);
      const pesado = oc.carga === 'integral' || !!oc.formacaoInicial;
      const m = cursoEmAndamento(v);
      const cursoIntegral = !!m && cursoOuNulo(m.cursoId)?.carga === 'integral';
      push(conflitoComCurso(v, novo, pesado && cursoIntegral, oc.formacaoInicial ? '__longe__' : undefined));
      push(conflitoComBase(v, novo));
      push(conflitoComEmprego(v, novo));
      push(conflitoComCarreiraEspecial(v, novo));
      // REWORK 9: o horário — a escola, as atividades da semana. Os conflitos grandes (o curso integral, outro
      // emprego) já foram ditos acima; aqui, o que o expediente novo atravessa na agenda.
      if (!oc.formacaoInicial) push(conflitoDeHorario(v, oc.id));
      break;
    }
    case 'negocio':
      push(conflitoComEmprego(v, novo));
      push(conflitoComBase(v, novo));
      break;
    case 'dedicar_negocio': {
      const e = v.trabalho.atual;
      if (e && e.contrato !== 'eletivo') {
        const nome = nomeEmprego(v);
        out.push({ com: 'emprego', rotulo: `o trabalho de ${nome}`, motivo: `Você trabalha como ${nome}`, alternativas: [{ larga: 'emprego', texto: `deixar o trabalho de ${nome}`, consequencia: `O salário de ${nome} acaba; o negócio passa a pagar a sua retirada.` }] });
      }
      push(conflitoComCurso(v, novo, true));
      push(conflitoComBase(v, novo));
      break;
    }
    case 'curso': {
      // O curso integral presencial toma o dia; em outra cidade, a mudança leva junto o emprego de lugar fixo.
      const c = curso(novo.cursoId);
      const presencial = novo.modalidade === 'presencial';
      const integral = presencial && c.carga === 'integral';
      const outraCidade = presencial && novo.municipioId !== v.moradia.municipioId;
      const e = v.trabalho.atual;
      if (e && e.contrato !== 'eletivo' && !noServicoInicial(v)) {
        const oc = ocupacaoOuNula(e.ocupacaoId);
        const pesado = e.carga === 'integral' || !!e.formacaoAte || oc?.jornada === 'fora';
        const deLugar = !['autonomo', 'informal'].includes(e.contrato) || ehDono(v);
        // Integral presencial: com trabalho de dia inteiro, não cabe; com meio período, cabe apertado (há o plano de conciliar).
        if ((integral && (pesado || e.carga === 'parcial')) || (outraCidade && deLugar)) {
          const conf = conflitoComEmprego(v, { tipo: 'emprego', ocupacaoId: e.ocupacaoId, via: VIA_CURSO });
          if (conf) {
            conf.motivo = outraCidade ? `${conf.motivo}, em ${municipio(v.moradia.municipioId).nome} — e o curso é em ${municipio(novo.municipioId).nome}` : `${conf.motivo}; ${c.nivel === 'superior' ? 'a faculdade' : 'o curso'} de ${c.nome} é em período integral`;
            // REWORK 10.6 · AGE-01: sem "tentar dar conta dos dois" com o curso integral — o meio período (manhã ou tarde) e o
            // emprego de dia caem dentro das 8h–17h do curso. Antes, o REWORK 4 aceitava (a agenda acusava falta o ano todo).
            out.push(conf);
          }
        }
      }
      if (presencial) push(conflitoComBase(v, novo));
      if (outraCidade) push(conflitoComCidade(v, novo.municipioId, c.nivel === 'superior' ? `a faculdade de ${c.nome}` : c.nome));
      break;
    }
    case 'servico_militar': {
      const m = cursoEmAndamento(v);
      if (m && m.modalidade === 'presencial') {
        const c = curso(m.cursoId);
        const base = conflitoComCurso(v, novo, true);
        if (base) {
          // Estudante de medicina, farmácia, odontologia ou veterinária pode adiar a incorporação (Lei 4.375/1964, art. 29).
          if (MFDV.has(c.area)) base.alternativas.unshift({ larga: 'adiar_servico', texto: 'pedir o adiamento da incorporação pelo curso', consequencia: `A lei permite adiar a incorporação de quem cursa ${c.nome}: o curso segue, o quartel espera.` });
          out.push(base);
        }
      }
      push(conflitoComBase(v, novo));
      push(conflitoComNegocioParalelo(v, novo));
      if (ehDono(v)) {
        const n = negocioAberto(v)!;
        out.push({ com: 'negocio', rotulo: n.nome, motivo: `${n.nome} é o seu trabalho de todo dia — e o quartel toma o dia`, alternativas: [
          ...(podeTocarNasHorasVagas(v, n) ? [{ larga: 'negocio_paralelo', texto: `deixar ${n.nome} com ${(n.equipe?.length ?? 0) > 0 ? 'a equipe' : socioVivo(v, n) ? 'o sócio' : 'a família'} durante o serviço`, consequencia: `${n.nome} segue sem você no dia a dia: o movimento cai.` }] : []),
          { larga: 'negocio_fechar', texto: presencaDe(n) === 'online' ? `tirar ${n.nome} do ar` : `fechar ${n.nome}`, consequencia: `${n.nome} ${fechaAs(n)}.` }
        ] });
      }
      break;
    }
  }
  return out;
}

/* ================================================================== Planos */

/** Pode recusar a oferta? (a convocação militar não se recusa). */
const recusavel = (novo: NovoCompromisso) => novo.tipo !== 'servico_militar';

export function descreverOferta(v: Vida, novo: NovoCompromisso): { oferta: string; curto: string; motivo: string } {
  switch (novo.tipo) {
    case 'base': {
      const equipe = novo.dominio === 'futebol' ? 'a base' : 'a equipe de competição';
      const longe = novo.municipioId !== v.moradia.municipioId ? `, com alojamento em ${municipio(novo.municipioId).nome}` : '';
      return { oferta: `${cap(oClube(novo.clube))} quer você n${novo.dominio === 'futebol' ? 'a base' : 'a equipe'}: treino quase todo dia${longe}.`, curto: `${equipe} ${doClube(novo.clube)}`, motivo: `para entrar n${novo.dominio === 'futebol' ? 'a base' : 'a equipe'} ${doClube(novo.clube)}` };
    }
    case 'contrato_esporte': return { oferta: 'O contrato profissional está na mesa: salário, prazo, treino em tempo integral.', curto: 'o contrato profissional', motivo: 'para assinar o contrato profissional' };
    case 'emprego': {
      const oc = ocupacao(novo.ocupacaoId);
      const nome = nomeOcupacao(v, oc);
      return { oferta: novo.texto ?? (novo.via === 'concurso' ? `A convocação do concurso chegou: ${nome}.` : `A vaga de ${nome} é sua.`), curto: novo.via === 'concurso' ? `a posse como ${nome}` : `o trabalho de ${nome}`, motivo: novo.via === 'concurso' ? `para tomar posse como ${nome}` : `para trabalhar como ${nome}` };
    }
    case 'negocio': {
      const t = tipoNegocio(novo.negocioId)!;
      return { oferta: `Tudo pronto para abrir ${t.nome}.`, curto: t.nome, motivo: `para abrir ${t.nome}` };
    }
    case 'dedicar_negocio': {
      const n = negocioAberto(v);
      const ao = n ? `${negocioFeminino(n.nome) ? 'à' : 'ao'} ${n.nome}` : 'ao negócio';
      return { oferta: `Dedicar-se de vez ${ao}.`, curto: n?.nome ?? 'o negócio', motivo: `para se dedicar ${ao}` };
    }
    case 'servico_militar': return { oferta: 'A convocação para o serviço militar chegou: doze meses de quartel.', curto: 'o serviço militar', motivo: 'para servir' };
    case 'curso': {
      const c = curso(novo.cursoId);
      const g = v.eu.tratamento ?? v.eu.genero;
      const nomeC = c.nivel === 'superior' ? `a faculdade de ${c.nome}` : `o curso de ${c.nome}`;
      const integral = novo.modalidade === 'presencial' && c.carga === 'integral';
      return {
        oferta: novo.destrancar ? `Dá para voltar ${c.nivel === 'superior' ? 'à faculdade' : 'ao curso'} de ${c.nome}${integral ? ', em período integral' : ''}.` : `${g === 'feminino' ? 'Aprovada' : 'Aprovado'} em ${c.nome}, ${novo.instituicao}${integral ? ': período integral' : ''}.`,
        curto: nomeC, motivo: `para cursar ${c.nome}`
      };
    }
  }
}

/** Monta os planos possíveis (no máximo três de aceitar, e o de recusar quando dá). */
export function planosDeConflito(v: Vida, novo: NovoCompromisso, conflitos: ConflitoDeEntrada[]): PlanoDeConflito[] {
  const { curto } = descreverOferta(v, novo);
  const planos: PlanoDeConflito[] = [];
  const impede = conflitos.find(c => c.impede);
  const aceitar = (escolhas: Alternativa[]): PlanoDeConflito => {
    const larga = escolhas.filter(a => a.larga).map(a => a.larga!);
    const conciliar = escolhas.some(a => a.conciliar);
    const verbo = novo.tipo === 'servico_militar' ? 'Servir' : novo.tipo === 'curso' ? (novo.destrancar ? 'Destrancar' : 'Matricular-se') : novo.tipo === 'negocio' ? 'Abrir' : novo.tipo === 'dedicar_negocio' ? 'Dedicar-se' : novo.tipo === 'emprego' && novo.via === 'concurso' ? 'Tomar posse' : 'Aceitar';
    const partes = escolhas.map(a => a.texto);
    const texto = partes.length ? `${verbo} e ${listaNatural(partes)}` : verbo;
    return { texto, consequencias: escolhas.map(a => a.consequencia), larga, conciliar: conciliar || undefined };
  };
  if (!impede && conflitos.length) {
    const padrao = conflitos.map(c => c.alternativas.find(a => !a.conciliar) ?? c.alternativas[0]);
    planos.push(aceitar(padrao));
    const idxConc = conflitos.findIndex(c => c.alternativas.some(a => a.conciliar));
    if (idxConc >= 0) planos.push(aceitar(conflitos.map((c, k) => (k === idxConc ? c.alternativas.find(a => a.conciliar)! : padrao[k]))));
    const idxAlt = conflitos.findIndex(c => c.alternativas.filter(a => !a.conciliar).length > 1);
    if (idxAlt >= 0 && planos.length < 3) planos.push(aceitar(conflitos.map((c, k) => (k === idxAlt ? c.alternativas.filter(a => !a.conciliar)[1] : padrao[k]))));
  }
  if (recusavel(novo)) {
    const fica = listaNatural(conflitos.map(c => c.rotulo));
    planos.push({ texto: novo.tipo === 'curso' ? (novo.destrancar ? 'Deixar o curso trancado' : 'Não fazer a matrícula') : novo.tipo === 'negocio' ? 'Não abrir agora' : novo.tipo === 'dedicar_negocio' ? 'Seguir como está' : novo.tipo === 'emprego' && novo.via === 'concurso' ? 'Não tomar posse' : `Recusar ${curto}`, consequencias: [impede ? `${impede.motivo}.` : `Fica tudo como está: ${fica}.`], larga: [], recusa: true });
  }
  // Planos iguais (mesmo texto) não aparecem duas vezes.
  return planos.filter((p, k) => planos.findIndex(q => q.texto === p.texto) === k).slice(0, 4);
}

/* ================================================================= Entrar */

/**
 * Propõe a entrada de algo novo. Sem conflito, entra agora. Com conflito,
 * fica pendente — e a pergunta abre (`conteudo/compromissos`).
 */
export function propor(v: Vida, r: Rng, novo: NovoCompromisso): 'feito' | 'pendente' | 'perdido' {
  // A convocação não espera e não se recusa: uma escolha que estava em aberto passa (e fica dito).
  if (v.caminhos.pendente && novo.tipo === 'servico_militar') {
    const antes = descreverOferta(v, v.caminhos.pendente.novo);
    escrever(v, { texto: `${cap(antes.curto)} chegou junto com a convocação para o serviço militar — e o quartel não espera: a outra oferta passou.`, relevancia: 'biografia', tema: 'trabalho' });
    v.caminhos.pendente = undefined;
    if (v.momento?.situacaoId === 'comp_conflito') v.momento = null;
  }
  const conflitos = analisarEntrada(v, novo);
  if (!conflitos.length) { const a = v.caminhos.esporte?.fase === 'base' ? analiseDaBase?.(v, novo) : undefined; aplicarNovo(v, r, novo, false, []); guardarTurnoAoLadoDaBase(v, novo, a); reconciliacao?.(v); return 'feito'; }
  const d = descreverOferta(v, novo);
  if (v.caminhos.pendente && v.caminhos.pendente.t === v.t) {
    // Duas ofertas que não cabem no mesmo ano: a segunda passa, e fica dito por quê.
    escrever(v, { texto: `${cap(d.curto)} chegou quando outra escolha grande estava em aberto — e o prazo passou.`, relevancia: 'cotidiano', tema: 'trabalho' });
    return 'perdido';
  }
  const p: CompromissoPendente = {
    novo, t: v.t, oferta: d.oferta,
    conflitos: conflitos.map(c => c.motivo),
    planos: planosDeConflito(v, novo, conflitos)
  };
  v.caminhos.pendente = p;
  return 'pendente';
}

/** Aplica o plano escolhido: larga o que for, e o novo entra (ou não, na recusa). */
export function resolverPendente(v: Vida, r: Rng, k: number): string {
  const p = v.caminhos.pendente;
  if (!p) return 'Essa escolha já passou.';
  const plano = p.planos[k];
  v.caminhos.pendente = undefined;
  if (!plano) return 'Essa escolha já passou.';
  const { motivo, curto } = descreverOferta(v, p.novo);
  if (plano.recusa) {
    escrever(v, { texto: textoDaRecusa(v, p.novo, curto), relevancia: p.novo.tipo === 'curso' || p.novo.tipo === 'base' || p.novo.tipo === 'contrato_esporte' || (p.novo.tipo === 'emprego' && p.novo.via === 'concurso') ? 'marco' : 'biografia', tema: p.novo.tipo === 'base' ? 'lazer' : 'trabalho', escolha: true });
    return plano.consequencias[0] ?? 'Ficou tudo como estava.';
  }
  // A pergunta pode ter ficado velha: se agora algo impede a entrada (o quartel, por exemplo), nada é largado.
  const impede = analisarEntrada(v, p.novo).find(c => c.impede);
  if (impede) {
    escrever(v, { texto: `${cap(curto)} já não cabia: ${impede.motivo.charAt(0).toLowerCase() + impede.motivo.slice(1)}.`, relevancia: 'cotidiano', tema: 'trabalho' });
    return `${impede.motivo}.`;
  }
  for (const id of plano.larga) largar(v, id, motivo, p.novo);
  const daBase = v.caminhos.esporte?.fase === 'base' ? analiseDaBase?.(v, p.novo) : undefined;
  aplicarNovo(v, r, p.novo, plano.larga.includes('negocio_nas_horas_vagas'), plano.larga);
  // O que entrou com a escola ou o curso no mesmo horário (o quartel aos 18, com o médio de manhã) se ajeita na hora — e fica dito.
  reconciliacao?.(v);
  guardarTurnoAoLadoDaBase(v, p.novo, daBase);
  if (plano.conciliar) v.fatos['conciliando'] = v.t;
  return plano.consequencias.join(' ');
}

function textoDaRecusa(v: Vida, novo: NovoCompromisso, curto: string): string {
  const fica = cursoEmAndamento(v) ? `para não largar ${nomeDoCurso(cursoEmAndamento(v)!.cursoId)}` : v.trabalho.atual ? `para ficar como ${nomeEmprego(v)}` : 'para seguir o caminho que já tinha';
  if (novo.tipo === 'base') return `Recusou ${curto} ${fica}.`;
  if (novo.tipo === 'contrato_esporte') return `Recusou o contrato profissional ${fica}.`;
  if (novo.tipo === 'emprego' && novo.via === 'concurso') return `Aprovado no concurso, não tomou posse: ${curto.replace(/^a posse como /, '')} ficou para outra pessoa.`.replace('Aprovado', v.eu.genero === 'feminino' ? 'Aprovada' : 'Aprovado');
  if (novo.tipo === 'negocio') return `Desistiu de abrir ${curto}, por ora.`;
  if (novo.tipo === 'curso') return novo.destrancar ? `Deixou ${curto} trancad${curso(novo.cursoId).nivel === 'superior' ? 'a' : 'o'} ${fica}.` : `${v.eu.genero === 'feminino' ? 'Aprovada' : 'Aprovado'} em ${curso(novo.cursoId).nome}, não fez a matrícula ${fica}.`;
  return `Recusou ${curto} ${fica}.`;
}

/** Larga uma coisa, com o motivo escrito na Linha da Vida. */
function largar(v: Vida, id: string, motivo: string, novo: NovoCompromisso): void {
  switch (id) {
    case 'curso': {
      const m = v.educacao.matricula;
      if (!m || m.trancado) return;
      m.trancado = true;
      m.tTrancou = v.t;
      escrever(v, { texto: `Trancou ${nomeDoCurso(m.cursoId)} ${motivo}.`, relevancia: 'biografia', tema: 'estudo', escolha: true });
      return;
    }
    case 'carreira_esporte': {
      const es = v.caminhos.esporte;
      if (es?.fase !== 'profissional') return;
      delete v.fatos['esp_sem_clube'];
      encerrarCarreira(v, es, 'escolha');
      return;
    }
    case 'emprego': {
      const e = v.trabalho.atual;
      if (!e) return;
      const nome = nomeEmprego(v);
      const es = v.caminhos.esporte;
      // REWORK 11 · Fase B: o atleta que deixa o clube por outra trajetória encerra a carreira agora — com o registro de
      // sempre (antes, o motor do esporte a encerrava na virada do ano, sem texto).
      if (es?.fase === 'profissional' && OCUPACOES_DE_ATLETA.includes(e.ocupacaoId)) {
        delete v.fatos['esp_sem_clube'];
        encerrarCarreira(v, es, 'escolha');
        escrever(v, { texto: `Deixou o clube ${motivo}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
        return;
      }
      encerrarEmprego(v, novo.tipo === 'negocio' || novo.tipo === 'dedicar_negocio' ? 'deixou para se dedicar ao negócio' : 'deixou por outra trajetória');
      escrever(v, { texto: `Deixou o trabalho de ${nome} ${motivo}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return;
    }
    case 'base': {
      const es = v.caminhos.esporte;
      if (es?.fase !== 'base') return;
      es.fase = 'encerrada';
      es.tFim = v.t;
      es.motivoFim = 'escolha';
      const rot = v.rotinas.find(x => x.id === es.modalidade);
      if (rot) rot.nivel = 1;
      const texto = `Deixou ${aEquipe(es.modalidade, es.clube)} ${motivo}.`;
      escrever(v, { texto, relevancia: 'marco', tema: 'lazer', escolha: true });
      marcar(v, 'abandono', texto, 3, { dominio: es.modalidade as Dominio });
      return;
    }
    case 'negocio_paralelo': { const n = negocioAberto(v); if (n) passarParaHorasVagas(v, n, motivo); return; }
    case 'negocio_fechar': {
      const n = negocioAberto(v);
      if (!n) return;
      const valor = valorDoNegocio(v, n);
      if ((n.dedicacao ?? 'integral') === 'integral' && v.trabalho.atual?.ocupacaoId === n.ocupacaoId) {
        if (valor > 0) venderNegocio(v, valor); else { fecharNegocio(v, `você foi seguir outro caminho (${motivo.replace(/^para /, '')})`); encerrarEmprego(v, 'fechou o negócio'); }
      } else if (valor > 0) venderNegocio(v, valor);
      else fecharNegocio(v, `você foi seguir outro caminho (${motivo.replace(/^para /, '')})`);
      return;
    }
    case 'negocio_nas_horas_vagas': return; // o negócio nasce paralelo (ver `aplicarNovo`)
    case 'emprego_pausa': case 'emprego_licenca': pausarAtual(v, motivo); return;
    case 'emprego_paralela': moverParaParalela(v, motivo); return;
    case 'novo_paralela': case 'mudar': return; // o novo entra em paralelo / a mudança vai junto com o novo (ver `aplicarNovo`)
    default: {
      // REWORK 9: as saídas de horário (a agenda).
      if (id.startsWith('turno_trabalho:')) { ((v.agenda ??= {}).turnos ??= {}).trabalho = id.slice(15) as Turno; return; }
      if (id.startsWith('turno_escola:')) { ((v.agenda ??= {}).turnos ??= {}).escola = id.slice(13) as Turno; escrever(v, { texto: `Passou a escola para o turno da ${({ manha: 'manhã', tarde: 'tarde', noite: 'noite', integral: 'período integral' } as Record<Turno, string>)[id.slice(13) as Turno]} ${motivo}.`, relevancia: 'cotidiano', tema: 'escola', escolha: true }); return; }
      if (id === 'escola') { largarEscola(v); escrever(v, { texto: `Largou a escola ${motivo}.`, relevancia: 'biografia', tema: 'escola', escolha: true }); return; }
      if (id.startsWith('soltar:')) { delete v.agenda?.lugares?.[id.slice(7)]; return; }
      if (id.startsWith('rotina:')) {
        const rid = id.slice(7);
        const m = modeloRotina(rid);
        v.rotinas = v.rotinas.filter(x => x.id !== rid);
        if (m) escrever(v, { texto: `Largou ${m.nome.charAt(0).toLowerCase()}${m.nome.slice(1)} ${motivo}: o horário não cabia mais.`, relevancia: 'cotidiano', tema: 'lazer', escolha: true });
        return;
      }
      return;
    }
    case 'adiar_servico': {
      v.fatos['mil_adiado'] = v.t;
      escrever(v, { texto: 'Pediu o adiamento da incorporação pelo curso: o serviço militar fica para depois da formatura.', relevancia: 'biografia', tema: 'lugar', escolha: true });
      return;
    }
  }
}

/** O novo entra na vida. */
function aplicarNovo(v: Vida, r: Rng, novo: NovoCompromisso, nasHorasVagas: boolean, larga: string[]): void {
  switch (novo.tipo) {
    case 'base': entrarNaBase(v, novo.dominio, novo.municipioId, novo.clube); return;
    case 'contrato_esporte': profissionalizar(v, r, novo.nivel); return;
    case 'emprego': {
      const oc = ocupacao(novo.ocupacaoId);
      // A volta a uma trajetória pausada não é contratação: o emprego guardado retorna.
      const k = novo.retoma !== undefined ? novo.retoma : novo.via === 'retorno' ? pausadaDe(v, oc.id) : -1;
      if (k >= 0 && (v.trabalho.pausadas ?? [])[k]) {
        if (larga.includes('novo_paralela')) {
          const guardado = v.trabalho.atual;
          v.trabalho.atual = undefined;
          const e = retomarPausada(v, k);
          v.trabalho.atual = guardado;
          if (e) entrarComoParalela(v, e);
        } else retomarPausada(v, k);
        return;
      }
      let e;
      if (larga.includes('novo_paralela') && v.trabalho.atual) {
        // Conciliar com o novo em paralelo: o trabalho de agora continua sendo o principal.
        const guardado = v.trabalho.atual;
        v.trabalho.atual = undefined;
        e = entrarComoParalela(v, contratar(v, r, oc, novo.via));
        v.trabalho.atual = guardado;
        v.trabalho.desempregadoDesde = undefined;
      } else e = contratar(v, r, oc, novo.via);
      aplicarAjuste(e, novo.ajuste);
      if (novo.extra === 'rural_familia' || novo.extra === 'rural_arrendada') iniciarRural(v, novo.extra === 'rural_familia' ? 'familia' : 'arrendada');
      if (novo.extra === 'arte') {
        marcar(v, 'profissional', larga.includes('novo_paralela') ? `Começou a trabalhar como ${nomeOcupacao(v, oc)} em paralelo, aos ${idade(v)}.` : `Passou a viver da arte: ${nomeOcupacao(v, oc)}, aos ${idade(v)}.`, 3, { ocupacaoId: oc.id, dominio: oc.habilidade?.dominio });
        v.fatos['artista_profissional'] ??= v.t;
        if (v.caminhos.arte?.ativo && e.clientela !== undefined) e.clientela = Math.max(e.clientela, Math.round(v.caminhos.arte.publico * 0.8));
      }
      if (novo.pessoaId && v.vinculos[novo.pessoaId]) lembrarCom(v, novo.pessoaId, `Abriu a porta para você: ${nomeOcupacao(v, oc)}.`, 'apoio', 2);
      // A Linha da Vida registra a entrada (concurso e convocação não são escolha de quem foi chamado; as vagas, sim).
      const escolha = !['concurso', 'reserva'].includes(novo.via);
      escrever(v, { texto: textoDeContratacao(v, oc, e), relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha });
      return;
    }
    case 'negocio': {
      // Com trabalho (e sem querer largá-lo) ou estudando o dia inteiro, o negócio nasce paralelo.
      const paralela = nasHorasVagas || (!v.trabalho.atual && !!cursoEmAndamento(v) && curso(cursoEmAndamento(v)!.cursoId).carga === 'integral');
      abrirNegocio(v, r, novo.negocioId, { modo: novo.modo, socioId: novo.socioId, dedicacao: paralela ? 'paralela' : 'integral' });
      return;
    }
    case 'dedicar_negocio': { const n = negocioAberto(v); if (n) dedicarAoNegocio(v, r, n); return; }
    case 'servico_militar': {
      if (v.fatos['mil_adiado'] === v.t) return;
      incorporarAoServico(v, r);
      return;
    }
    case 'curso': {
      efetivarMatricula(v, novo);
      if (novo.modalidade === 'presencial' && novo.municipioId !== v.moradia.municipioId) mudarAgora(v, novo.municipioId, `para estudar ${curso(novo.cursoId).nome}`);
      return;
    }
  }
}

/* ===================================================== Contratar fora de `propor` */

/** O que a contratação ajusta no emprego novo (guardado no pendente: a pergunta pode ficar para depois). */
function aplicarAjuste(e: Emprego, a?: AjusteDeEmprego): void {
  if (!a) return;
  if (a.posAposentadoria) e.posAposentadoria = true;
  if (a.especialidade) e.especialidade = a.especialidade;
  if (a.clientelaMais && e.clientela !== undefined) e.clientela = Math.max(0, Math.min(100, e.clientela + a.clientelaMais));
  if (a.salarioMinimo) e.salario = Math.max(e.salario, a.salarioMinimo);
}

/**
 * Os conflitos que PEDEM pergunta numa contratação que não passa por `propor` (o curso integral, a base, a carreira
 * especial sem contrato, a escola sem turno que resolva). O horário que um turno resolve não pergunta: a agenda se
 * reconcilia depois de contratar, e diz (`agenda.reconciliarObrigacoes`). Pura: os textos dos acontecimentos a leem
 * antes de dizer "começou".
 */
export function conflitosDaContratacao(v: Vida, oc: Ocupacao, via: string, substitui = true): ConflitoDeEntrada[] {
  return analisarEntrada(v, { tipo: 'emprego', ocupacaoId: oc.id, via, substitui }).filter(c => c.com !== 'agenda' || c.impede);
}

/**
 * REWORK 11 · Fase B (pendência 10.6) — CONTRATAR COM ANÁLISE: as contratações que não passavam por `propor` (a
 * efetivação do aprendiz, a proposta em outra cidade, o pós-carreira, a procura longa, o trabalho por conta, a segunda
 * carreira da reserva) entravam sem olhar o curso integral, a base, a carreira parada nem a agenda. Agora:
 *   · sem conflito grande → contrata, ajusta e reconcilia a agenda (o turno que bate muda, e fica dito);
 *   · com conflito grande → a vida pergunta, como numa vaga (o pendente guarda o ajuste e o texto da oferta);
 *   · com outra escolha grande em aberto → a oferta passa, dita.
 * `substitui` (padrão): o acontecimento já decidiu trocar o trabalho de agora — ele não volta a ser perguntado.
 */
export function contratarComAnalise(v: Vida, r: Rng, oc: Ocupacao, via: string, o: { texto?: string; ajuste?: AjusteDeEmprego; substitui?: boolean } = {}): { resultado: 'feito' | 'pendente' | 'perdido'; emprego?: Emprego } {
  const novo: NovoCompromisso = { tipo: 'emprego', ocupacaoId: oc.id, via, texto: o.texto, substitui: o.substitui ?? true, ...(o.ajuste ? { ajuste: o.ajuste } : {}) };
  const grandes = analisarEntrada(v, novo).filter(c => c.com !== 'agenda' || c.impede);
  if (!grandes.length) {
    const e = contratar(v, r, oc, via);
    aplicarAjuste(e, o.ajuste);
    reconciliacao?.(v);
    return { resultado: 'feito', emprego: e };
  }
  const d = descreverOferta(v, novo);
  if (v.caminhos.pendente) {
    escrever(v, { texto: `${cap(d.curto)} chegou quando outra escolha grande estava em aberto — e o prazo passou.`, relevancia: 'cotidiano', tema: 'trabalho' });
    return { resultado: 'perdido' };
  }
  v.caminhos.pendente = { novo, t: v.t, oferta: d.oferta, conflitos: grandes.map(c => c.motivo), planos: planosDeConflito(v, novo, grandes) };
  return { resultado: 'pendente' };
}

/**
 * Para os acontecimentos (os `resolver` das decisões): o texto de sempre quando cabe; quando há conflito grande, o
 * texto diz a escolha que vem (e o `efeito` abre a pergunta) — nunca "começou" para um trabalho que ainda não entrou.
 * `depois` roda só se o emprego entrou agora (o registro e as marcas do acontecimento).
 */
export function contratacaoDoEvento(v: Vida, r: Rng, oc: Ocupacao, via: string, texto: string, o: { ajuste?: AjusteDeEmprego; substitui?: boolean; depois?: (e: Emprego) => void } = {}): { texto: string; efeito: () => void } {
  const conf = conflitosDaContratacao(v, oc, via, o.substitui ?? true);
  const m = conf[0]?.motivo;
  return {
    texto: m ? `${cap(nomeOcupacao(v, oc))}: dá para começar — mas ${m.charAt(0).toLowerCase()}${m.slice(1)}. Antes, uma escolha.` : texto,
    efeito: () => { const res = contratarComAnalise(v, r, oc, via, { ajuste: o.ajuste, substitui: o.substitui }); if (res.emprego) o.depois?.(res.emprego); }
  };
}

/* ============================================================== Utilidades */

/** "fecha as portas" / "sai do ar": loja on-line não tem porta. */
const fechaAs = (n: Negocio) => (presencaDe(n) === 'online' ? 'sai do ar' : 'fecha as portas');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** O conflito pendente já está velho demais (a oferta expirou)? */
export function pendenteVencido(v: Vida): boolean {
  const p = v.caminhos.pendente;
  return !!p && v.t - p.t >= 12;
}

export { idade, tDe, type Negocio };
