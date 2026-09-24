/**
 * Carreira militar nas Forças Armadas — não é um emprego com outro nome.
 *
 *   TEMPORÁRIO — o serviço inicial (12 meses, a partir dos 18; obrigatório
 *   para homens, voluntário para mulheres), prorrogável ano a ano até 8
 *   anos no máximo. Não dá estabilidade: acaba em baixa, com o certificado
 *   de reservista e o que se aprendeu.
 *
 *   CARREIRA — por concurso: escola de sargentos (praças) ou academia
 *   (oficiais); para graduados, os quadros técnico e de saúde. A formação é
 *   longe de casa, em regime de internato. Depois dela, uma ESPECIALIDADE
 *   (o que se leva para a vida civil) e a primeira guarnição.
 *
 *   ANTIGUIDADE E CURSOS — sobe-se com o tempo no posto, o conceito e os
 *   cursos de carreira (aperfeiçoamento para chegar a subtenente ou major;
 *   altos estudos para os postos mais altos, que são disputados). O teste
 *   físico anual conta: quem não passa, espera.
 *
 *   TRANSFERÊNCIAS — de tempos em tempos sai a movimentação para outra
 *   cidade, às vezes do outro lado do país. A família decide junto: ir
 *   todos (a parceria recomeça a carreira, os filhos trocam de escola; às
 *   vezes há imóvel funcional), ir sozinho, pedir para adiar, sair.
 *
 *   RESERVA — a pedido com 35 anos de serviço, ou compulsória pela idade do
 *   posto, com a remuneração do posto. E depois dela, quase sempre, uma
 *   segunda carreira.
 *
 * Idades-limite e interstícios são abstrações plausíveis (a regra real
 * varia por Força e quadro); ver `dados/forcas.ts`.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraMilitar, Emprego, Especialidade, Forca, Vida } from '../tipos';
import { escrever, idade, marcarFato, parceiro, temFato } from '../nucleo';
import { ocupacao, type Ocupacao } from '../dados/ocupacoes';
import { ESCOLA, ESPECIALIDADES, GUARNICOES, NOME_FORCA, SIGLA_DA } from '../dados/forcas';
import { municipio, pertoDaAgua } from '../dados/lugares';
import { marcar } from './marcas';
import { encerrarEmprego, nomeOcupacao, salarioLiquidoAtual } from './trabalho';
import { salarioLocal } from './renda';
import { praticar } from './frentes';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';
import { capitalDoEstado } from './escola';
import { abalar } from './abalo';
import { mudarAgora } from './processos';
import { aluguelDe } from './mercado';
import { modeloMoradia } from '../dados/bens';

/**
 * A formação e a primeira guarnição são longe: a mudança acontece logo
 * depois da nomeação (o emprego vai junto; a casa vira o alojamento).
 */
export function efetivarMudancaMilitar(v: Vida): void {
  const n = v.fatos['mil_mudar_para'];
  if (n === undefined) return;
  delete v.fatos['mil_mudar_para'];
  const destino = MUNIC_POR_INDICE(n);
  const e = v.trabalho.atual;
  if (!destino || !e || destino === v.moradia.municipioId) return;
  e.municipioId = destino;
  const formacao = !!e.formacaoAte;
  mudarAgora(v, destino, formacao ? 'para o curso de formação, em regime de internato' : 'para a primeira guarnição');
  if (formacao) v.moradia = { tipo: 'cedida', funcional: true, municipioId: destino, aluguel: 0, padrao: 2, tInicio: v.t, bairro: 'no alojamento da escola', aceitaPet: false };
  else if (v.moradia.funcional || v.moradia.tipo === 'cedida') {
    if (hash(`${v.id}:${v.t}:pnr`) < 0.55) morarEmImovelFuncional(v);
    else { const k = modeloMoradia('kitnet'); v.moradia = { tipo: 'aluguel', municipioId: destino, modeloId: k.id, aluguel: aluguelDe(v, k, destino), padrao: k.padrao, tInicio: v.t, aceitaPet: true }; }
  }
}

const QUADRO: Record<string, CarreiraMilitar['quadro']> = {
  soldado_ep: 'temporario', cabo_ep: 'temporario', aluno_sargento: 'praca', sargento: 'praca', subtenente: 'praca',
  cadete: 'oficial', aluno_oficial_tecnico: 'oficial', tenente: 'oficial', capitao: 'oficial', major: 'oficial', tenente_coronel: 'oficial', coronel: 'oficial'
};

/** A escada de cada quadro: ocupação, anos mínimos no posto, curso exigido, disputa (chance por ano quando elegível). */
const ESCADA: Record<string, { proximo: string; anos: number; curso?: string; disputa: number }> = {
  cabo_ep: { proximo: '', anos: 99, disputa: 0 },
  soldado_ep: { proximo: 'cabo_ep', anos: 2, disputa: 0.45 },
  sargento: { proximo: 'subtenente', anos: 14, curso: 'aperfeicoamento', disputa: 0.55 },
  tenente: { proximo: 'capitao', anos: 6, disputa: 0.8 },
  capitao: { proximo: 'major', anos: 7, curso: 'aperfeicoamento', disputa: 0.7 },
  major: { proximo: 'tenente_coronel', anos: 5, curso: 'altos_estudos', disputa: 0.45 },
  tenente_coronel: { proximo: 'coronel', anos: 5, disputa: 0.3 }
};

/** Idade-limite para permanecer na ativa (compulsória), por posto — abstraída. */
const COMPULSORIA: Record<string, number> = { sargento: 52, subtenente: 56, tenente: 50, capitao: 52, major: 56, tenente_coronel: 59, coronel: 62 };

export const militar = (v: Vida) => v.caminhos.militar;
export const anosDeForcas = (v: Vida) => { const m = v.caminhos.militar; return m ? Math.floor((v.t - m.tIngresso) / 12) : 0; };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/**
 * Qual Força: a de quem já serviu; senão, a que tem unidade (ou edital) por
 * perto — o litoral puxa para a Marinha, as bases aéreas para a Aeronáutica.
 */
export function forcaProvavel(v: Vida): Forca {
  if (v.caminhos.militar) return v.caminhos.militar.forca;
  const aqui = v.moradia.municipioId;
  const x = hash(`${v.id}:forca:${anoDe(v.t)}`);
  const mar = GUARNICOES.marinha.includes(aqui) || (pertoDaAgua(aqui) && municipio(aqui).capital);
  const ar = GUARNICOES.aeronautica.includes(aqui);
  if (mar && x < 0.35) return 'marinha';
  if (ar && x > 0.72) return 'aeronautica';
  if (!mar && !ar) return x < 0.1 ? 'aeronautica' : x < 0.16 ? 'marinha' : 'exercito';
  return x > 0.9 ? 'aeronautica' : 'exercito';
}

function guarnicaoInicial(v: Vida, f: Forca): string {
  const aqui = v.moradia.municipioId;
  if (GUARNICOES[f].includes(aqui)) return aqui;
  const cap = capitalDoEstado(aqui);
  return GUARNICOES[f].includes(cap) ? cap : GUARNICOES[f][Math.floor(hash(`${v.id}:g0`) * GUARNICOES[f].length)];
}

/** Chamado ao contratar numa ocupação das Forças (serviço inicial, formação, promoção de carreira). */
export function aoEntrarNasForcas(v: Vida, r: Rng, oc: Ocupacao): void {
  const quadro = QUADRO[oc.id] ?? 'temporario';
  const atual = v.caminhos.militar;
  if (atual && atual.quadro === quadro) return;
  const forca = atual?.forca && (quadro === 'temporario' || r.chance(0.7)) ? atual.forca : forcaProvavel(v);
  const escola = quadro === 'praca' ? ESCOLA[forca].pracas : quadro === 'oficial' ? ESCOLA[forca].oficiais : undefined;
  const guarnicao = escola && oc.formacaoInicial && oc.id !== 'aluno_oficial_tecnico' ? escola[1] : guarnicaoInicial(v, forca);
  v.caminhos.militar = {
    forca, quadro, tIngresso: atual && quadro !== 'temporario' ? atual.tIngresso : v.t, guarnicao, tGuarnicao: v.t,
    cursos: atual?.cursos ?? [], transferencias: atual?.transferencias ?? 0, especialidade: atual?.especialidade
  };
  // Tempo de serviço de temporário conta para a carreira (a data de ingresso é a primeira).
  if (atual && quadro !== 'temporario') v.caminhos.militar.tIngresso = atual.tIngresso;
  marcarFato(v, `serviu_${forca}`);
  // A formação é longe: internato na escola.
  if (oc.formacaoInicial && guarnicao !== v.moradia.municipioId && idade(v) < 30) v.fatos['mil_mudar_para'] = MUNIC_INDICE(guarnicao);
}

const MUNIC_INDICE = (id: string) => [...GUARNICOES.exercito, ...GUARNICOES.marinha, ...GUARNICOES.aeronautica, 'juiz-de-fora-mg', 'volta-redonda-rj', 'sao-jose-dos-campos-sp', 'rio-de-janeiro-rj', 'sao-paulo-sp'].indexOf(id);
export const MUNIC_POR_INDICE = (n: number) => [...GUARNICOES.exercito, ...GUARNICOES.marinha, ...GUARNICOES.aeronautica, 'juiz-de-fora-mg', 'volta-redonda-rj', 'sao-jose-dos-campos-sp', 'rio-de-janeiro-rj', 'sao-paulo-sp'][n];

/** Fim da formação: a especialidade (decisão) e a primeira guarnição. */
export function aoFormarNasForcas(v: Vida, r: Rng, destino: Ocupacao): void {
  const m = v.caminhos.militar;
  if (!m) return;
  m.quadro = QUADRO[destino.id] ?? m.quadro;
  if (m.quadro === 'praca' && !m.especialidade) v.fatos['mil_especialidade'] = v.t;
  if (m.quadro === 'oficial' && !m.especialidade) m.especialidade = v.educacao.concluidos.some(c => c.area === 'medicina' || c.area === 'enfermagem') ? 'saude' : v.educacao.concluidos.some(c => ['engenharia', 'engenharia_civil', 'computacao'].includes(c.area)) ? 'comunicacoes' : 'combatente';
  const lista = GUARNICOES[m.forca];
  const primeira = lista[Math.floor(r.next() * lista.length)];
  m.guarnicao = primeira;
  m.tGuarnicao = v.t;
  if (primeira !== v.moradia.municipioId) v.fatos['mil_mudar_para'] = MUNIC_INDICE(primeira);
}

export function escolherEspecialidade(v: Vida, esp: Especialidade): void {
  const m = v.caminhos.militar;
  if (!m) return;
  m.especialidade = esp;
  delete v.fatos['mil_especialidade'];
  marcar(v, 'ingresso', `Especialidade na formação: ${ESPECIALIDADES[esp].nome}.`, 2);
}

/* ---------------------------------------------------------------- O ano */

export function processarMilitar(v: Vida, r: Rng, e: Emprego, oc: Ocupacao): void {
  const m = v.caminhos.militar ?? (aoEntrarNasForcas(v, r, oc), v.caminhos.militar!);
  const i = idade(v);
  const anosServico = (v.t - m.tIngresso) / 12;
  const anosNoPosto = (v.t - (e.tPosto ?? e.tInicio)) / 12;

  // Teste físico anual (TAF): a exigência cai um pouco com a idade; quem não passa, espera a promoção.
  const exigido = (m.quadro === 'oficial' ? 50 : 45) - Math.max(0, i - 35) * 0.8;
  const passouTaf = v.corpo.forma >= exigido && v.corpo.saude >= 45;
  if (!passouTaf) {
    if (m.tafFalhou === undefined || v.t - m.tafFalhou > 24) escrever(v, { texto: 'Não passou no teste físico anual. A promoção vai ter de esperar o próximo.', relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    m.tafFalhou = v.t;
  }

  // A especialidade é ofício: pratica-se e conta, pela metade, na vida civil.
  const esp = m.especialidade ? ESPECIALIDADES[m.especialidade] : undefined;
  if (esp?.trilhaCivil) v.trabalho.experiencia[esp.trilhaCivil] = (v.trabalho.experiencia[esp.trilhaCivil] ?? 0) + 5;
  if (esp?.pratica) praticar(v, r, esp.pratica as never, 0.5, 1.1);

  // Temporário: 12 meses, prorrogáveis até 8 anos (Lei 13.954/2019). Não há estabilidade.
  if (m.quadro === 'temporario') {
    if (anosServico >= 8 || i > 30) {
      encerrarEmprego(v, 'baixa do serviço militar');
      escrever(v, { texto: `Completou o tempo máximo de temporário: deu baixa ${SIGLA_DA[m.forca]} depois de ${Math.round(anosServico)} anos, sem estabilidade e com o certificado de reservista.`, relevancia: 'marco', tema: 'trabalho' });
      marcar(v, 'fim_carreira', `Baixa ${SIGLA_DA[m.forca]} (tempo máximo de temporário).`, 2, { trilha: oc.trilha });
      v.fatos['mil_baixa'] = v.t;
      return;
    }
    const x = ESCADA[oc.id];
    if (x?.proximo && anosNoPosto >= x.anos && e.desempenho >= 55 && passouTaf && r.chance(x.disputa)) promoverMilitar(v, e, oc, ocupacao(x.proximo), 'fez o curso de cabos');
    return;
  }

  // Compulsória: a idade do posto.
  const limite = COMPULSORIA[oc.id];
  if (limite && i >= limite) { irParaReserva(v, 'compulsoria'); return; }

  // Graus dentro do posto (terceiro → segundo → primeiro-sargento; segundo → primeiro-tenente): tempo e conceito.
  if (oc.id === 'sargento' && anosNoPosto >= 5 && (v.fatos['grau_sargento'] ?? 0) < 2 && anosNoPosto >= 5 * ((v.fatos['grau_sargento'] ?? 0) + 1) && passouTaf) {
    v.fatos['grau_sargento'] = (v.fatos['grau_sargento'] ?? 0) + 1;
    e.salario = Math.round(e.salario * 1.09 / 10) * 10;
    const grau = v.fatos['grau_sargento'] === 1 ? 'segundo' : 'primeiro';
    escrever(v, { texto: `Promovid${flex(ge(v), 'o', 'a', 'e')} a ${grau}-sargento, pela antiguidade.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'promocao', `${grau === 'segundo' ? 'Segundo' : 'Primeiro'}-sargento.`, 2, { trilha: oc.trilha });
  }

  // Curso de carreira: oferecido quando chega a hora; sem ele, a escada para.
  const x = ESCADA[oc.id];
  if (x?.curso && !m.cursos.includes(x.curso) && anosNoPosto >= x.anos - 2 && v.fatos['mil_curso_oferta'] === undefined) v.fatos['mil_curso_oferta'] = v.t;
  if (x?.proximo && anosNoPosto >= x.anos && passouTaf && e.desempenho >= 45 && (!x.curso || m.cursos.includes(x.curso))) {
    const proximo = ocupacao(x.proximo);
    if (r.chance(x.disputa * (e.desempenho >= 70 ? 1.2 : 1))) promoverMilitar(v, e, oc, proximo, 'pela antiguidade e pelo conceito');
    else if (x.disputa < 0.5 && anosNoPosto >= x.anos + 4 && !temFato(v, `preterido_${oc.id}`)) {
      marcarFato(v, `preterido_${oc.id}`);
      escrever(v, { texto: `A lista de promoção a ${nomeOcupacao(v, proximo)} saiu sem o seu nome. As vagas são poucas; outros passaram na frente.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      abalar(v, 'a promoção que não veio', -4, 4);
    }
  }

  // Movimentação: de tempos em tempos, outra cidade.
  if (v.t - m.tGuarnicao >= 30 && r.chance(0.32) && v.fatos['mil_transferencia'] === undefined) {
    const opcoes = GUARNICOES[m.forca].filter(g => g !== m.guarnicao && g !== v.moradia.municipioId);
    v.fatos['mil_transferencia'] = v.t;
    v.fatos['mil_destino'] = MUNIC_INDICE(opcoes[Math.floor(r.next() * opcoes.length)]);
  }
  // Rotina que só a farda tem: missão, embarque, exercício longe de casa.
  if (r.chance(m.forca === 'marinha' ? 0.3 : 0.18)) v.fatos['mil_missao'] = v.t;
}

function promoverMilitar(v: Vida, e: Emprego, oc: Ocupacao, proximo: Ocupacao, como: string): void {
  const antes = nomeOcupacao(v, oc);
  e.ocupacaoId = proximo.id;
  e.tPosto = v.t;
  e.salario = Math.max(Math.round(e.salario * 1.1 / 10) * 10, salarioLocal(proximo, e.municipioId));
  if (proximo.id === 'subtenente') delete v.fatos['grau_sargento'];
  const texto = `Promovid${flex(ge(v), 'o', 'a', 'e')} de ${antes} a ${nomeOcupacao(v, proximo)}, ${como}.`;
  escrever(v, { texto, relevancia: proximo.nivel >= 4 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
  marcar(v, proximo.nivel >= 5 ? 'lideranca' : 'promocao', texto, proximo.nivel >= 4 ? 3 : 2, { trilha: proximo.trilha, ocupacaoId: proximo.id });
  v.fatos['promocoes'] = (v.fatos['promocoes'] ?? 0) + 1;
  abalar(v, 'a promoção', 5, 0);
}

export function fazerCurso(v: Vida): void {
  const m = v.caminhos.militar;
  const e = v.trabalho.atual;
  if (!m || !e) return;
  const x = ESCADA[e.ocupacaoId];
  if (x?.curso && !m.cursos.includes(x.curso)) m.cursos.push(x.curso);
  delete v.fatos['mil_curso_oferta'];
  marcar(v, 'formacao', x?.curso === 'altos_estudos' ? 'Curso de altos estudos militares.' : 'Curso de aperfeiçoamento militar.', 2);
}

/* ---------------------------------------------------------- Movimentação */

export function transferir(v: Vida, destino: string, comFamilia: boolean, funcional: boolean): void {
  const m = v.caminhos.militar;
  const e = v.trabalho.atual;
  if (!m || !e) return;
  const par = parceiro(v);
  if (!comFamilia) {
    // A família fica: parceria e filhos continuam onde estão; o convívio vira distância.
    for (const x of Object.values(v.vinculos)) if (x.convivio.includes('casa') && v.pessoas[x.pessoaId] && !v.pessoas[x.pessoaId].especie) { x.convivio = x.convivio.filter(c => c !== 'casa'); }
    if (par) par.p.municipioId = v.moradia.municipioId;
  }
  e.municipioId = destino;
  mudarAgora(v, destino, `transferid${flex(ge(v), 'o', 'a', 'e')} ${SIGLA_DA[m.forca]}`);
  m.guarnicao = destino;
  m.tGuarnicao = v.t;
  m.transferencias += 1;
  if (comFamilia && par && par.p.renda > 0) {
    // A carreira de quem acompanha recomeça do zero na cidade nova.
    par.p.renda = Math.round(par.p.renda * 0.5);
    v.fatos[`recomecando_${par.p.id}`] = v.t;
    par.vin.tensao = clamp(par.vin.tensao + 12);
  }
  if (funcional) morarEmImovelFuncional(v);
  marcar(v, 'transferencia', `Transferid${flex(ge(v), 'o', 'a', 'e')} para ${municipio(destino).nome}${comFamilia ? ', com a família' : ', sozinh' + flex(ge(v), 'o', 'a', 'e')}.`, 2);
}

/** Imóvel funcional na guarnição nova (vila militar): cedido enquanto durar o vínculo. */
export function morarEmImovelFuncional(v: Vida): void {
  v.moradia = { tipo: 'cedida', funcional: true, municipioId: v.moradia.municipioId, aluguel: 280, padrao: 3, tInicio: v.t, bairro: 'na vila militar', aceitaPet: true };
  delete v.fatos['mil_funcional'];
}

/* --------------------------------------------------------------- Reserva */

export function irParaReserva(v: Vida, como: 'pedido' | 'compulsoria'): void {
  const e = v.trabalho.atual;
  const m = v.caminhos.militar;
  if (!e || !m) return;
  const oc = ocupacao(e.ocupacaoId);
  const anos = anosDeForcas(v);
  const beneficio = Math.round(e.salario * (anos >= 35 ? 1 : 0.85 + anos * 0.004) / 10) * 10;
  const nome = nomeOcupacao(v, oc);
  encerrarEmprego(v, 'reserva');
  v.trabalho.desempregadoDesde = undefined;
  v.trabalho.aposentadoria = { t: v.t, beneficio };
  const texto = como === 'compulsoria'
    ? `Foi para a reserva pela idade do posto, como ${nome}, depois de ${anos} anos ${SIGLA_DA[m.forca]}.`
    : `Pediu a reserva depois de ${anos} anos ${SIGLA_DA[m.forca]}, como ${nome}, com a remuneração do posto.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: como === 'pedido' });
  marcar(v, 'reserva', texto, 3, { trilha: oc.trilha, ocupacaoId: oc.id });
  v.fatos['mil_reserva'] = v.t;
  if (v.moradia.funcional) v.fatos['sair_funcional'] = v.t;
}

/** Sair antes: temporário dá baixa; de carreira, pede demissão (quem se formou há pouco indeniza a formação). */
export function sairDasForcas(v: Vida): number {
  const m = v.caminhos.militar;
  const e = v.trabalho.atual;
  if (!m || !e) return 0;
  const anos = (v.t - (e.tPosto ?? e.tInicio)) / 12;
  const indenizacao = m.quadro === 'oficial' && anosDeForcas(v) < 8 ? 45000 : m.quadro === 'praca' && anosDeForcas(v) < 5 ? 12000 : 0;
  encerrarEmprego(v, m.quadro === 'temporario' ? 'baixa do serviço militar' : 'demissão a pedido');
  escrever(v, { texto: m.quadro === 'temporario' ? `Deu baixa ${SIGLA_DA[m.forca]}.` : `Pediu demissão ${SIGLA_DA[m.forca]} depois de ${anosDeForcas(v)} anos.${indenizacao ? ' A formação que a Força pagou teve de ser indenizada.' : ''}`, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'fim_carreira', `Saiu ${SIGLA_DA[m.forca]}.`, 2);
  if (v.moradia.funcional) v.fatos['sair_funcional'] = v.t;
  void anos;
  return indenizacao;
}

/* ---------------------------------------------------------------- Tela */

export function horizonteMilitar(v: Vida): string {
  const m = v.caminhos.militar;
  const e = v.trabalho.atual;
  if (!m || !e) return '';
  const oc = ocupacao(e.ocupacaoId);
  const anosServ = anosDeForcas(v);
  const onde = `Serve em ${municipio(m.guarnicao).nome}${m.transferencias ? ` (${m.transferencias} ${m.transferencias === 1 ? 'transferência' : 'transferências'} na carreira)` : ''}.`;
  if (m.quadro === 'temporario') return `Temporário: sem estabilidade, dá para prorrogar ano a ano até oito anos de serviço (você tem ${anosServ}). ${onde}`;
  const x = ESCADA[oc.id];
  const anosNoPosto = (v.t - (e.tPosto ?? e.tInicio)) / 12;
  const reserva = `A reserva a pedido vem com 35 anos de serviço (você tem ${anosServ}).`;
  if (!x?.proximo) return `${onde} ${reserva}`;
  const proximo = nomeOcupacao(v, ocupacao(x.proximo));
  const falta = Math.max(0, Math.ceil(x.anos - anosNoPosto));
  const curso = x.curso && !m.cursos.includes(x.curso) ? ` Antes, é preciso o curso de ${x.curso === 'altos_estudos' ? 'altos estudos' : 'aperfeiçoamento'}.` : '';
  const taf = m.tafFalhou !== undefined && v.t - m.tafFalhou < 12 ? ' O teste físico deste ano não passou.' : '';
  return `${falta > 0 ? `A promoção a ${proximo} pode vir por volta de ${anoDe(v.t) + falta}` : `A promoção a ${proximo} depende de vaga${x.disputa < 0.5 ? ' — e são poucas' : ''}`}.${curso}${taf} ${onde} ${reserva}`;
}

export { NOME_FORCA, salarioLiquidoAtual };
