/**
 * Trabalho e carreira.
 *
 * Elegibilidade é graduada: aos 12 anos carteira assinada é ILEGAL; sem
 * diploma de Medicina ser médico é REQUISITO; com metade da experiência
 * pedida a vaga é IMPROVÁVEL. A experiência conta por trilha.
 *
 * O emprego não é um clique: candidatar-se abre uma entrevista (um desafio
 * em que a postura do jogador pesa); concurso tem inscrição e prova meses
 * depois. Promoção, demissão e fim de contrato acontecem pelo mundo.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Emprego, Vida } from '../tipos';
import { escrever, idade, marcarFato, temFato } from '../nucleo';
import { OCUPACOES, ocupacao, type Ocupacao } from '../dados/ocupacoes';
import { economiaLocal, municipio, nivelDeOferta, nomeLugar } from '../dados/lugares';
import { ROTULO_AREA } from '../dados/cursos';
import { bloqueio, type Veredito } from '../plausibilidade';
import { contribui, liquido, salarioLocal, SALARIO_MINIMO, TETO_INSS } from './renda';
import { nivelEsc, ROTULO_ESCOLARIDADE, temEscolaridade } from './escola';
import { flex, ge } from '../texto';

export const nomeOcupacao = (v: Vida, oc: Ocupacao) => (ge(v) === 'feminino' ? oc.nome[1] : oc.nome[0]);
export const nomeOcupacaoId = (v: Vida, id: string) => nomeOcupacao(v, ocupacao(id));

export function experienciaNaTrilha(v: Vida, trilha: string): number {
  return v.trabalho.experiencia[trilha] ?? 0;
}

const EMPREGADORES: Record<string, string[]> = {
  informal: ['por conta própria'],
  cuidado: ['uma família do bairro', 'uma casa de repouso'],
  transporte: ['os aplicativos'],
  beleza: ['um salão do bairro'],
  comercio: ['um supermercado', 'uma loja de roupas', 'uma loja de departamento', 'uma farmácia de rede', 'uma loja de materiais de construção'],
  alimentacao: ['um restaurante', 'uma lanchonete', 'uma padaria', 'um bar do centro'],
  administrativo: ['um escritório de contabilidade', 'uma distribuidora', 'uma clínica', 'uma empresa de logística', 'uma concessionária'],
  ti: ['uma empresa de software', 'uma startup', 'um banco digital', 'uma consultoria de tecnologia'],
  enfermagem: ['o hospital municipal', 'um hospital particular', 'uma UPA'],
  medicina: ['o hospital municipal', 'uma rede de clínicas', 'um hospital particular'],
  psicologia: ['uma clínica', 'o CAPS da cidade'],
  nutricao: ['uma clínica', 'uma rede de academias'],
  educacao_fisica: ['uma academia'],
  direito: ['um escritório de advocacia'],
  engenharia: ['uma construtora', 'uma incorporadora'],
  educacao: ['uma escola particular', 'uma creche', 'a rede municipal de ensino'],
  construcao: ['uma empreiteira', 'obras do bairro'],
  manutencao: ['uma fábrica', 'uma oficina', 'uma empresa de manutenção'],
  agro: ['uma fazenda da região', 'uma cooperativa agrícola'],
  design: ['uma agência', 'uma editora'],
  financas: ['um banco', 'uma corretora'],
  publico: ['o serviço público']
};

/* ---------------------------------------------------------- Elegibilidade */

export function elegibilidade(v: Vida, oc: Ocupacao): Veredito {
  const i = idade(v);
  const t = v.trabalho;

  if (i < 14) return bloqueio('ilegal', 'Trabalho é proibido antes dos 14 anos.');
  if (i < 16 && oc.contrato !== 'aprendiz') return bloqueio('ilegal', 'Entre 14 e 15 anos, só como jovem aprendiz.');
  if (i < oc.idadeMin) return bloqueio(oc.idadeMin <= 18 ? 'ilegal' : 'requisito', `Exige ${oc.idadeMin} anos.`);
  if (oc.idadeMax && i > oc.idadeMax) return bloqueio('requisito', `É para quem tem até ${oc.idadeMax} anos.`);
  if (t.atual?.ocupacaoId === oc.id) return bloqueio('incompativel', 'Você já trabalha nisso.');
  if (t.candidaturas.some(c => c.ocupacaoId === oc.id)) return bloqueio('incompativel', 'Já está no processo seletivo desta vaga.');
  if (t.aposentadoria && oc.concurso) return bloqueio('incompativel', 'Aposentados não prestam concurso para cargo efetivo.');

  if (oc.matriculado === 'basica' && !v.educacao.basica && !temEscolaridade(v, 'medio')) {
    return bloqueio('requisito', 'Aprendiz precisa estar na escola (ou ter concluído o médio).');
  }
  if (oc.matriculado === 'superior' && !v.educacao.matricula) return bloqueio('requisito', 'Estágio exige estar matriculado numa faculdade.');
  if (oc.matriculado === 'qualquer' && !v.educacao.matricula && !(v.educacao.basica && i >= 16)) {
    return bloqueio('requisito', 'Estágio exige estar estudando.');
  }
  if (oc.escolaridade && !temEscolaridade(v, oc.escolaridade)) {
    return bloqueio('requisito', `Exige ${ROTULO_ESCOLARIDADE[oc.escolaridade]}.`);
  }
  if (oc.area) {
    const nivel = oc.nivelCurso;
    const ok = v.educacao.concluidos.some(c =>
      (oc.area!.includes('qualquer') || oc.area!.includes(c.area as never)) &&
      (!nivel || nivelFormacao(c.nivel) >= nivelFormacao(nivel)));
    const cursandoNaArea = oc.matriculado && v.educacao.matricula && oc.area.some(a => a === 'qualquer' || v.educacao.matricula && cursoArea(v.educacao.matricula.cursoId) === a);
    if (!ok && !(oc.matriculado && cursandoNaArea)) {
      const areas = oc.area.map(a => ROTULO_AREA[a]).join(' ou ');
      const nivelTxt = nivel === 'tecnico' ? 'curso técnico ou superior' : nivel === 'superior' ? 'graduação' : nivel === 'residencia' ? 'residência' : nivel === 'doutorado' ? 'doutorado' : 'formação';
      return bloqueio('requisito', `Exige ${nivelTxt} em ${areas}.${oc.fundamento ? ' ' + oc.fundamento : ''}`);
    }
  }
  if (oc.licenca && oc.licenca !== 'cnh' && !t.licencas.includes(oc.licenca)) {
    return bloqueio('requisito', `Exige registro profissional (${oc.licenca.toUpperCase()}).`);
  }
  if (oc.licenca === 'cnh' && !t.licencas.includes('cnh')) return bloqueio('requisito', 'Exige carteira de motorista.');
  if (oc.veiculo) {
    const bens = v.financas.bens.filter(b => b.tipo === 'veiculo');
    const temCarro = bens.some(b => b.modeloId.startsWith('carro'));
    const temMoto = bens.some(b => b.modeloId.startsWith('moto'));
    const temBike = bens.some(b => b.modeloId.startsWith('bike'));
    const ok = oc.veiculo === 'carro' ? temCarro : oc.veiculo === 'moto_ou_bike' ? temMoto || temBike : temCarro || temMoto;
    if (!ok) return bloqueio('requisito', oc.veiculo === 'carro' ? 'Exige carro próprio.' : 'Exige moto ou bicicleta.');
  }
  if (nivelDeOferta(v.moradia.municipioId) < oc.oferta) {
    return bloqueio('requisito', `Quase não há vagas assim em ${municipio(v.moradia.municipioId).nome}. Seria preciso morar numa cidade maior.`);
  }

  // Experiência: requisito duro abaixo da metade; improvável entre metade e o total.
  const exp = experienciaNaTrilha(v, oc.trilha);
  let chance = chanceBase(v, oc);
  if (oc.experiencia) {
    if (exp < oc.experiencia / 2) return bloqueio('requisito', `Pedem ${anosTxt(oc.experiencia)} de experiência na área; você tem ${anosTxt(exp)}.`);
    if (exp < oc.experiencia) {
      chance *= 0.35;
      return { grau: 'improvavel', chance, motivo: `Pedem ${anosTxt(oc.experiencia)} de experiência; você tem ${anosTxt(exp)}.` };
    }
  }
  if (v.financas.negativado && oc.trilha === 'financas') chance *= 0.3;
  return { grau: chance < 0.25 ? 'improvavel' : 'permitido', chance };
}

const nivelFormacao = (n: string) => ({ tecnico: 1, superior: 2, pos: 3, residencia: 3, mestrado: 4, doutorado: 5 } as Record<string, number>)[n] ?? 0;

function cursoArea(cursoId: string): string {
  // Import tardio evitado: tabela mínima local.
  return cursoId === 'direito' ? 'direito' : cursoId === 'computacao' || cursoId === 'ads' || cursoId === 'tec_informatica' ? 'computacao' : cursoId === 'eng_civil' ? 'engenharia_civil' : cursoId === 'arquitetura' ? 'arquitetura' : cursoId;
}

function anosTxt(meses: number): string {
  const a = Math.floor(meses / 12);
  if (a === 0) return meses === 0 ? 'nenhuma' : 'menos de um ano';
  return a === 1 ? '1 ano' : `${a} anos`;
}

function chanceBase(v: Vida, oc: Ocupacao): number {
  let c = 0.55;
  c += (v.mente.cognicao - 50) / 250;
  c += (v.corpo.aparencia - 50) / 500;
  c += v.personalidade.tracos.sociabilidade / 600;
  c -= oc.nivel * 0.04;
  if (v.trabalho.desempregadoDesde !== undefined && v.t - v.trabalho.desempregadoDesde > 24) c -= 0.1;
  if (idade(v) > 50 && oc.nivel < 4) c -= (idade(v) - 50) / 60; // etarismo real no mercado
  if (oc.concurso) c = clamp(0.06 + (v.mente.cognicao - 50) / 400 + (temFato(v, 'estudando_concurso') ? 0.1 : 0), 0.02, 0.4);
  return clamp(c, 0.05, 0.92);
}

export function vagasDisponiveis(v: Vida): { oc: Ocupacao; veredito: Veredito }[] {
  return OCUPACOES.map(oc => ({ oc, veredito: elegibilidade(v, oc) }));
}

/* ------------------------------------------------------------ Contratar */

export function contratar(v: Vida, r: Rng, oc: Ocupacao): Emprego {
  const t = v.trabalho;
  if (t.atual) encerrarEmprego(v, 'trocou de emprego');
  const e: Emprego = {
    ocupacaoId: oc.id,
    empregador: oc.concurso ? orgaoDoConcurso(oc) : r.pick(EMPREGADORES[oc.trilha] ?? ['uma empresa']),
    contrato: oc.contrato,
    salario: salarioLocal(oc, v.moradia.municipioId, 0.9 + r.next() * 0.2),
    tInicio: v.t,
    desempenho: 60,
    municipioId: v.moradia.municipioId,
    carga: oc.carga
  };
  t.atual = e;
  t.desempregadoDesde = undefined;
  if (!temFato(v, 'primeiro_emprego')) marcarFato(v, 'primeiro_emprego');
  return e;
}

function orgaoDoConcurso(oc: Ocupacao): string {
  return ({ tecnico_publico: 'a prefeitura', analista_judiciario: 'o Tribunal Regional', auditor_fiscal: 'a Receita', professor_concursado: 'a rede pública de ensino', escriturario_banco: 'um banco público', professor_univ: 'a universidade federal' } as Record<string, string>)[oc.id] ?? 'o serviço público';
}

export function encerrarEmprego(v: Vida, motivo: string): void {
  const t = v.trabalho;
  if (!t.atual) return;
  t.historico.push({ ...t.atual, tFim: v.t, motivo });
  t.atual = undefined;
  t.horasExtras = false;
  t.desempregadoDesde = v.t;
}

export function textoDeContratacao(v: Vida, oc: Ocupacao, e: Emprego): string {
  const nome = nomeOcupacao(v, oc);
  const primeira = v.trabalho.historico.length === 0;
  if (oc.concurso) return `${flex(ge(v), 'Aprovado', 'Aprovada')} no concurso: ${nome} em ${e.empregador.replace(/^(a|o) /, '')}, com estabilidade.`;
  if (e.contrato === 'autonomo' || e.contrato === 'informal') return `${primeira ? 'Começou a ganhar a vida' : 'Passou a trabalhar'} como ${nome}.`;
  return `${primeira ? 'Primeiro emprego' : 'Novo emprego'}: ${nome} em ${e.empregador}.`;
}

/* ---------------------------------------------------------- Ano de trabalho */

export function processarTrabalho(v: Vida, r: Rng): void {
  const t = v.trabalho;
  const i = idade(v);
  const e = t.atual;

  // Concursos: a prova acontece e o resultado sai.
  for (const cand of [...t.candidaturas]) {
    if (cand.tResultado > v.t) continue;
    t.candidaturas = t.candidaturas.filter(c => c.id !== cand.id);
    const oc = ocupacao(cand.ocupacaoId);
    const estudou = temFato(v, 'estudando_concurso') ? 0.1 : 0;
    if (r.chance(clamp(cand.chance + estudou, 0.02, 0.6))) {
      const novo = contratar(v, r, oc);
      escrever(v, { texto: textoDeContratacao(v, oc, novo), relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    } else {
      const tentativas = (v.fatos[`concurso_${oc.id}`] ?? 0) + 1;
      v.fatos[`concurso_${oc.id}`] = tentativas;
      escrever(v, {
        texto: tentativas === 1 ? `Não passou no concurso para ${nomeOcupacao(v, oc)}.` : `Mais uma reprovação no concurso para ${nomeOcupacao(v, oc)} — a ${tentativas}ª.`,
        relevancia: tentativas === 1 || tentativas % 3 === 0 ? 'cotidiano' : 'tecnico', tema: 'trabalho', tom: 'ruim'
      });
    }
  }

  if (!e) {
    if (t.desempregadoDesde !== undefined && i >= 18 && !t.aposentadoria && !v.educacao.matricula) {
      const anos = Math.floor((v.t - t.desempregadoDesde) / 12);
      if (anos === 1) {
        v.mente.felicidade = clamp(v.mente.felicidade - 6);
        v.mente.estresse = clamp(v.mente.estresse + 8);
      }
    }
    aposentadoriaAutomatica(v);
    return;
  }

  const oc = ocupacao(e.ocupacaoId);

  // Experiência e contribuição
  t.experiencia[oc.trilha] = (t.experiencia[oc.trilha] ?? 0) + 12;
  if (contribui(e.contrato)) t.contribuicao += 12;

  // Desempenho: capacidade, disciplina, estresse e esforço.
  const alvo = 45 + (v.mente.cognicao - 50) * 0.3 + v.personalidade.tracos.disciplina * 0.2
    + (t.horasExtras ? 10 : 0) - Math.max(0, v.mente.estresse - 65) * 0.4 - Math.max(0, 50 - v.corpo.saude) * 0.3;
  e.desempenho = clamp(Math.round(e.desempenho * 0.5 + alvo * 0.5 + r.normal() * 8));

  // Estresse do cargo
  v.mente.estresse = clamp(v.mente.estresse + (oc.estresse - 2.5) * 2.5 + (t.horasExtras ? 6 : 0) - 2);
  if (t.horasExtras) e.salario = e.salario; // horas extras pagam no orçamento
  t.horasExtras = false;

  // Informal/autônomo oscila
  if (e.contrato === 'autonomo' || e.contrato === 'informal') {
    const base = salarioLocal(oc, e.municipioId);
    e.salario = Math.round(clamp(e.salario * (0.85 + r.next() * 0.3), base * 0.6, base * 1.6) / 10) * 10;
  } else if (e.desempenho >= 70 && r.chance(0.5)) {
    e.salario = Math.round(e.salario * 1.04 / 10) * 10;
  } else {
    e.salario = Math.round(e.salario * 1.01 / 10) * 10;
  }

  // Aprendiz: contrato de no máximo dois anos.
  if (e.contrato === 'aprendiz' && v.t - e.tInicio >= 24) {
    const efetiva = e.desempenho >= 60 && i >= 18 && r.chance(0.45);
    encerrarEmprego(v, 'fim do contrato de aprendiz');
    if (efetiva) {
      const novo = contratar(v, r, ocupacao('aux_adm'));
      escrever(v, { texto: `O contrato de aprendiz acabou e a empresa ${flex(ge(v), 'o', 'a')} efetivou como auxiliar administrativ${flex(ge(v), 'o', 'a')}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
      void novo;
    } else {
      escrever(v, { texto: 'O contrato de jovem aprendiz chegou ao fim.', relevancia: 'biografia', tema: 'trabalho' });
    }
    return;
  }

  // Estágio acaba quando o curso acaba.
  if (e.contrato === 'estagio' && !v.educacao.matricula && !v.educacao.basica) {
    const proximo = OCUPACOES.find(x => x.trilha === oc.trilha && x.nivel >= 2 && x.nivel <= 3 && elegibilidade(v, x).grau === 'permitido');
    encerrarEmprego(v, 'fim do estágio');
    if (proximo && e.desempenho >= 55 && r.chance(0.5)) {
      const novo = contratar(v, r, proximo);
      escrever(v, { texto: `O estágio acabou em contratação: ${nomeOcupacao(v, proximo)} em ${novo.empregador}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    } else {
      escrever(v, { texto: 'O estágio terminou junto com o curso, sem efetivação.', relevancia: 'biografia', tema: 'trabalho' });
    }
    return;
  }

  // Demissão
  const risco = e.contrato === 'servidor' ? 0.002 : e.desempenho < 35 ? 0.3 : e.contrato === 'clt' ? 0.05 : 0.03;
  if (r.chance(risco)) {
    const anos = Math.max(1, Math.floor((v.t - e.tInicio) / 12));
    const nome = nomeOcupacao(v, oc);
    if (e.contrato === 'clt') {
      // Rescisão: saldo do FGTS + multa de 40% (aprox.) e seguro-desemprego.
      const fgts = Math.round(e.salario * 0.08 * 12 * anos * 1.4);
      const seguro = Math.round(Math.min(2400, Math.max(SALARIO_MINIMO, e.salario * 0.8)) * (anos >= 2 ? 5 : 3));
      v.financas.conta += fgts + seguro;
      escrever(v, { texto: e.desempenho < 35 ? `Foi ${flex(ge(v), 'demitido', 'demitida')} de ${e.empregador}, onde era ${nome}. O desempenho vinha caindo.` : `Foi ${flex(ge(v), 'demitido', 'demitida')} num corte de pessoal em ${e.empregador}, depois de ${anos} ${anos === 1 ? 'ano' : 'anos'} como ${nome}.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    } else {
      escrever(v, { texto: `O trabalho como ${nome} minguou até acabar.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    }
    encerrarEmprego(v, 'demissão');
    v.mente.felicidade = clamp(v.mente.felicidade - 10);
    v.mente.estresse = clamp(v.mente.estresse + 12);
    return;
  }

  // Promoção: o mundo reconhece (ou não) o trabalho.
  const proximo = OCUPACOES
    .filter(x => x.trilha === oc.trilha && x.nivel === oc.nivel + 1 && !x.concurso && x.contrato !== 'estagio')
    .find(x => elegibilidade(v, x).grau === 'permitido');
  if (proximo && e.desempenho >= 62 && v.t - e.tInicio >= 18 && r.chance(0.3 + (e.desempenho - 62) / 100)) {
    const anterior = nomeOcupacao(v, oc);
    const salarioAntigo = e.salario;
    e.ocupacaoId = proximo.id;
    e.contrato = proximo.contrato === 'autonomo' ? e.contrato : proximo.contrato;
    e.salario = Math.max(Math.round(salarioAntigo * 1.12 / 10) * 10, salarioLocal(proximo, e.municipioId));
    e.tInicio = v.t;
    escrever(v, { texto: `${flex(ge(v), 'Promovido', 'Promovida')} de ${anterior} a ${nomeOcupacao(v, proximo)} em ${e.empregador}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    v.mente.felicidade = clamp(v.mente.felicidade + 6);
  }
}

/* ------------------------------------------------------------ Aposentadoria */

export function podeAposentar(v: Vida): Veredito {
  const i = idade(v);
  const t = v.trabalho;
  if (t.aposentadoria) return bloqueio('incompativel', 'Já está aposentado.');
  const idadeMin = v.eu.genero === 'feminino' ? 62 : 65;
  const contribMin = v.eu.genero === 'feminino' ? 180 : 240;
  if (i < idadeMin) return bloqueio('requisito', `A aposentadoria por idade é aos ${idadeMin}.`);
  if (t.contribuicao < contribMin) return bloqueio('requisito', `Faltam ${Math.ceil((contribMin - t.contribuicao) / 12)} anos de contribuição ao INSS.`);
  return { grau: 'permitido' };
}

export function valorAposentadoria(v: Vida): number {
  const t = v.trabalho;
  const salarios = [...t.historico.filter(h => contribui(h.contrato)).map(h => h.salario), ...(t.atual && contribui(t.atual.contrato) ? [t.atual.salario] : [])];
  const media = salarios.length ? salarios.reduce((s, x) => s + x, 0) / salarios.length : SALARIO_MINIMO;
  const anos = Math.floor(t.contribuicao / 12);
  const minimo = v.eu.genero === 'feminino' ? 15 : 20;
  const pct = Math.min(1, 0.6 + Math.max(0, anos - minimo) * 0.02);
  return Math.round(clamp(media * pct, SALARIO_MINIMO, TETO_INSS));
}

export function aposentar(v: Vida): void {
  const beneficio = valorAposentadoria(v);
  if (v.trabalho.atual) encerrarEmprego(v, 'aposentadoria');
  v.trabalho.desempregadoDesde = undefined;
  v.trabalho.aposentadoria = { t: v.t, beneficio };
  escrever(v, { texto: `${flex(ge(v), 'Aposentou-se', 'Aposentou-se')} depois de ${Math.floor(v.trabalho.contribuicao / 12)} anos de contribuição, com um benefício de R$ ${beneficio.toLocaleString('pt-BR')} por mês.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
}

/** Quem nunca contribuiu o bastante recebe o BPC aos 65 se a renda for baixa. */
function aposentadoriaAutomatica(v: Vida): void {
  const i = idade(v);
  if (v.trabalho.aposentadoria || i < 65) return;
  if (podeAposentar(v).grau === 'permitido') return; // essa é escolha do jogador
  if (!temFato(v, 'bpc')) {
    marcarFato(v, 'bpc');
    v.trabalho.aposentadoria = { t: v.t, beneficio: SALARIO_MINIMO };
    escrever(v, { texto: 'Sem tempo de contribuição para se aposentar, passou a receber o BPC: um salário mínimo por mês.', relevancia: 'biografia', tema: 'dinheiro' });
  }
}

export function descricaoEmprego(v: Vida): string {
  const e = v.trabalho.atual;
  if (!e) return v.trabalho.aposentadoria ? flex(ge(v), 'aposentado', 'aposentada') : 'sem trabalho';
  return `${nomeOcupacaoId(v, e.ocupacaoId)} · ${e.empregador}`;
}

export const salarioLiquidoAtual = (v: Vida) => (v.trabalho.atual ? liquido(v.trabalho.atual.salario, v.trabalho.atual.contrato) : 0);

export { nomeLugar, economiaLocal, nivelEsc };
