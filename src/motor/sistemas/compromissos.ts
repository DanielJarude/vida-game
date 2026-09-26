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

import type { Rng } from '../rng';
import type { CompromissoPendente, Dominio, Negocio, NovoCompromisso, PlanoDeConflito, Vida } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { iniciarRural } from './rural';
import { doClube, oClube } from '../dados/clubes';
import { curso, cursoOuNulo } from '../dados/cursos';
import { ocupacao, ocupacaoOuNula } from '../dados/ocupacoes';
import { municipio } from '../dados/lugares';
import { listaNatural } from '../texto';
import { contratar, eDasForcas, encerrarEmprego, nomeOcupacao, textoDeContratacao } from './trabalho';
import { entrarNaBase, profissionalizar, NOME_MOD } from './esporte';
import { fem, negocioFeminino, presencaDe, socioVivo, abrirNegocio, dedicarAoNegocio, fecharNegocio, negocioAberto, passarParaHorasVagas, podeTocarNasHorasVagas, tipoDoNegocio, tipoNegocio, valorDoNegocio, venderNegocio } from './negocio';
import { marcar } from './marcas';
import { incorporarAoServico } from './militar';
import { tDe } from '../tempo';
import { efetivarMatricula } from './escola';
import { mudarAgora } from './processos';

/* ============================================================== O que existe */

type IdAtual = 'curso' | 'emprego' | 'base' | 'negocio' | 'servico' | 'mandato';

interface Alternativa {
  /** O que se larga (id aplicável) — ou `conciliar`. */
  larga?: string;
  conciliar?: boolean;
  /** Verbo no infinitivo: "trancar a faculdade de Direito". */
  texto: string;
  /** O que acontece, dito antes. */
  consequencia: string;
}

interface Conflito {
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

function conflitoComCurso(v: Vida, novo: NovoCompromisso, pesado: boolean, municipioDoNovo?: string): Conflito | undefined {
  const m = cursoEmAndamento(v);
  if (!m || m.modalidade === 'ead') return undefined;
  const c = curso(m.cursoId);
  const outraCidade = municipioDoNovo && m.municipioId !== municipioDoNovo;
  const integral = c.carga === 'integral';
  if (!pesado && !outraCidade) return undefined;
  const nomeC = c.nivel === 'superior' ? `a faculdade de ${c.nome}` : `o curso de ${c.nome}`;
  const alternativas: Alternativa[] = [{ larga: 'curso', texto: `trancar ${nomeC}`, consequencia: `${cap(nomeC)} fica trancad${c.nivel === 'superior' ? 'a' : 'o'}: a vaga espera até quatro anos.` }];
  if (!integral && !outraCidade && novo.tipo !== 'servico_militar') alternativas.push({ conciliar: true, texto: 'tentar dar conta dos dois', consequencia: `${cap(nomeC)} continua à noite. A semana passa do que cabe: a cabeça e as notas sentem.` });
  if (!integral && !outraCidade && novo.tipo === 'servico_militar') alternativas.push({ conciliar: true, texto: 'seguir estudando à noite', consequencia: 'Quartel de dia, aula à noite. A semana fica no limite.' });
  const motivo = municipioDoNovo === '__longe__' ? `O curso de formação é em regime de internato, longe: ${nomeC} não tem como seguir` : outraCidade ? `${cap(nomeC)} é presencial em ${municipio(m.municipioId).nome}` : integral ? `${cap(nomeC)} é em período integral` : `${cap(nomeC)} ocupa as noites`;
  return { com: 'curso', rotulo: nomeC, motivo, alternativas };
}

function conflitoComEmprego(v: Vida, novo: NovoCompromisso): Conflito | undefined {
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
  const nome = nomeEmprego(v);
  // Emprego novo no lugar do atual: quem se candidatou já escolheu trocar — só o que vem de fora (concurso, convocação) pergunta.
  if (novo.tipo === 'emprego' && !['concurso', 'reserva'].includes(novo.via)) return undefined;
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
  return { com: 'emprego', rotulo: `o trabalho de ${nome}`, motivo: `Você trabalha como ${nome}${e.carga === 'integral' ? ', o dia inteiro' : ''}`, alternativas: [{ larga: 'emprego', texto: `deixar o trabalho de ${nome}`, consequencia: `O trabalho de ${nome}${oc.concurso ? ' (concursado)' : ''} acaba${estavel}.` }] };
}

function conflitoComBase(v: Vida): Conflito | undefined {
  const es = v.caminhos.esporte;
  if (es?.fase !== 'base') return undefined;
  const equipe = es.modalidade === 'futebol' ? 'a base' : 'a equipe';
  return { com: 'base', rotulo: `${equipe} ${doClube(es.clube)}`, motivo: `${cap(equipe)} ${doClube(es.clube)} treina quase todo dia`, alternativas: [{ larga: 'base', texto: `deixar ${equipe} ${doClube(es.clube)}`, consequencia: `O sonho de viver do ${NOME_MOD[es.modalidade] ?? 'esporte'} fica para trás; ${NOME_MOD[es.modalidade] ?? 'o esporte'} volta a ser por gosto.` }] };
}

function conflitoComNegocioParalelo(v: Vida, novo: NovoCompromisso): Conflito | undefined {
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
export function analisarEntrada(v: Vida, novo: NovoCompromisso): Conflito[] {
  const out: Conflito[] = [];
  const push = (c?: Conflito) => { if (c) out.push(c); };
  // Durante o serviço inicial, nada novo entra — a não ser estudar à noite na cidade do quartel.
  const cursoLeve = novo.tipo === 'curso' && (novo.modalidade === 'ead' || (curso(novo.cursoId).carga !== 'integral' && novo.municipioId === v.moradia.municipioId));
  if (noServicoInicial(v) && novo.tipo !== 'servico_militar' && !cursoLeve) return [{ com: 'servico', rotulo: 'o serviço militar', motivo: 'Durante o serviço militar inicial, o quartel não libera: são doze meses obrigatórios', alternativas: [], impede: true }];
  switch (novo.tipo) {
    case 'base':
      push(conflitoComCurso(v, novo, true, novo.municipioId));
      push(conflitoComEmprego(v, novo));
      push(conflitoComNegocioParalelo(v, novo));
      break;
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
      push(conflitoComBase(v));
      push(conflitoComEmprego(v, novo));
      break;
    }
    case 'negocio':
      push(conflitoComEmprego(v, novo));
      push(conflitoComBase(v));
      break;
    case 'dedicar_negocio': {
      const e = v.trabalho.atual;
      if (e && e.contrato !== 'eletivo') {
        const nome = nomeEmprego(v);
        out.push({ com: 'emprego', rotulo: `o trabalho de ${nome}`, motivo: `Você trabalha como ${nome}`, alternativas: [{ larga: 'emprego', texto: `deixar o trabalho de ${nome}`, consequencia: `O salário de ${nome} acaba; o negócio passa a pagar a sua retirada.` }] });
      }
      push(conflitoComCurso(v, novo, true));
      push(conflitoComBase(v));
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
          const conf = conflitoComEmprego(v, { tipo: 'emprego', ocupacaoId: e.ocupacaoId, via: 'concurso' });
          if (conf) {
            conf.motivo = outraCidade ? `${conf.motivo}, em ${municipio(v.moradia.municipioId).nome} — e o curso é em ${municipio(novo.municipioId).nome}` : `${conf.motivo}; ${c.nivel === 'superior' ? 'a faculdade' : 'o curso'} de ${c.nome} é em período integral`;
            // Meio período ao lado de um curso integral é apertado, mas possível: aí há o plano de tentar os dois.
            if (!outraCidade && e.carga === 'parcial') conf.alternativas.push({ conciliar: true, texto: 'tentar dar conta dos dois', consequencia: 'O trabalho segue em meio período. A semana passa do que cabe: a cabeça e as notas sentem.' });
            out.push(conf);
          }
        }
      }
      if (presencial) push(conflitoComBase(v));
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
      push(conflitoComBase(v));
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
export function planosDeConflito(v: Vida, novo: NovoCompromisso, conflitos: Conflito[]): PlanoDeConflito[] {
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
  if (!conflitos.length) { aplicarNovo(v, r, novo, false); return 'feito'; }
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
  aplicarNovo(v, r, p.novo, plano.larga.includes('negocio_nas_horas_vagas'));
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
    case 'emprego': {
      const e = v.trabalho.atual;
      if (!e) return;
      const nome = nomeEmprego(v);
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
      const texto = `Deixou ${es.modalidade === 'futebol' ? 'a base' : 'a equipe'} ${doClube(es.clube)} ${motivo}.`;
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
    case 'adiar_servico': {
      v.fatos['mil_adiado'] = v.t;
      escrever(v, { texto: 'Pediu o adiamento da incorporação pelo curso: o serviço militar fica para depois da formatura.', relevancia: 'biografia', tema: 'lugar', escolha: true });
      return;
    }
  }
}

/** O novo entra na vida. */
function aplicarNovo(v: Vida, r: Rng, novo: NovoCompromisso, nasHorasVagas: boolean): void {
  switch (novo.tipo) {
    case 'base': entrarNaBase(v, novo.dominio, novo.municipioId, novo.clube); return;
    case 'contrato_esporte': profissionalizar(v, r, novo.nivel); return;
    case 'emprego': {
      const oc = ocupacao(novo.ocupacaoId);
      const e = contratar(v, r, oc, novo.via);
      if (novo.extra === 'rural_familia' || novo.extra === 'rural_arrendada') iniciarRural(v, novo.extra === 'rural_familia' ? 'familia' : 'arrendada');
      if (novo.extra === 'arte') {
        marcar(v, 'profissional', `Passou a viver da arte: ${nomeOcupacao(v, oc)}, aos ${idade(v)}.`, 3, { ocupacaoId: oc.id, dominio: oc.habilidade?.dominio });
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
