/**
 * Trabalho e carreira.
 *
 * ENTRAR — a elegibilidade é graduada (ilegal, requisito, improvável,
 * permitido) e depende de COMO aquela ocupação se entra: por currículo (com
 * entrevista), por diploma, por qualificação curta, por um ofício aprendido,
 * por concurso (edital, prova, preparação), por oportunidade (peneira,
 * convite, contrato) ou abrindo o próprio negócio. Experiência conta por
 * trilha, e trilhas afins contam pela metade.
 *
 * SUBIR — por mérito (desempenho, tempo no posto, vaga acima existindo na
 * cidade), por antiguidade (militares, servidores: tempo no posto) ou por
 * clientela (autônomos: a renda cresce com a freguesia, não com o cargo).
 * Nem toda carreira tem escada, e ficar parado tem explicação (`horizonte`).
 *
 * GANHAR — o salário anda dentro de uma faixa do cargo; crescer além dela é
 * mudar de cargo. Não existe escada infinita.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Emprego, Vida } from '../tipos';
import { emRecessao, escrever, idade, marcarFato, temFato } from '../nucleo';
import { ajusteClientela, ajusteContratacao, fatorDemissao, reajusteReal } from './economia';
import { veiculoUtil } from './veiculos';
import { OCUPACOES, AFINS, daTrilha, ocupacao, ocupacaoOuNula, ROTULO_TRILHA, type Ocupacao } from '../dados/ocupacoes';
import { economiaLocal, municipio, nivelDeOferta, nomeLugar } from '../dados/lugares';
import { ORDEM_NIVEL, ROTULO_AREA, cursoOuNulo } from '../dados/cursos';
import { forcaDoSetor, sobraNaEpoca } from '../dados/mercado';
import { bloqueio, type Veredito } from '../plausibilidade';
import { contribui, liquido, salarioLocal, SALARIO_MINIMO, TETO_INSS } from './renda';
import { em, nivelEsc, ROTULO_ESCOLARIDADE, temEscolaridade } from './escola';
import { habilidade, praticar } from './frentes';
import { marcar } from './marcas';
import { chanceNoConcurso, editalAberto } from './concurso';
import { flex, ge } from '../texto';
import { anoDe } from '../tempo';
import { abalar } from './abalo';
import { NOME_FORCA, OCUPACOES_DAS_FORCAS, nomeDoPosto } from '../dados/forcas';
import { pertoDaAgua } from '../dados/lugares';
import { antecedenteAdulto, penaDeAntecedentes } from './justica';
import { fatorDaEpoca, riscoDaEpoca } from './carreira';
import { familiaDaTrilha } from '../dados/carreiras';
import { aoEntrarNasForcas, aoFormarNasForcas, horizonteMilitar, processarMilitar } from './militar';
import { climaDe, deltaDeFreguesia, fatorDeFreguesia, fatorJornada, ritmoDe } from './ritmo';

export const nomeOcupacao = (v: Vida, oc: Ocupacao) => nomeDoPosto(oc.id, v.caminhos?.militar?.forca, ge(v) === 'feminino') ?? (ge(v) === 'feminino' ? oc.nome[1] : oc.nome[0]);
export const nomeOcupacaoId = (v: Vida, id: string) => nomeOcupacao(v, ocupacao(id));

/** Experiência que conta numa trilha: a própria, mais metade das afins. */
export function experienciaNaTrilha(v: Vida, trilha: string): number {
  const x = v.trabalho.experiencia;
  // A estrada afim conta pela metade — e só até certo ponto: vinte anos de rua não fazem ninguém gerente de loja.
  const afins = (AFINS[trilha] ?? []).reduce((s, t) => s + (x[t] ?? 0), 0);
  return (x[trilha] ?? 0) + Math.min(48, Math.round(afins * 0.5));
}

const MILITARES = new Set(['exercito_praca', 'exercito_sargento', 'exercito_oficial', 'pm', 'pm_oficial', 'bombeiro']);
export const eMilitar = (oc: Ocupacao) => MILITARES.has(oc.trilha);
/** Forças Armadas (não PM nem bombeiros): a carreira tem sistema próprio (`militar.ts`). */
export const eDasForcas = (oc: Ocupacao) => OCUPACOES_DAS_FORCAS.has(oc.id);
export const anosDeServicoMilitar = (v: Vida) => Math.floor([...MILITARES].reduce((s, t) => s + (v.trabalho.experiencia[t] ?? 0), 0) / 12);

const EMPREGADORES: Record<string, string[]> = {
  informal: ['por conta própria'], cuidado: ['uma família do bairro', 'uma casa de repouso'], transporte: ['os aplicativos'], estrada: ['uma transportadora', 'uma empresa de ônibus'],
  beleza: ['um salão do bairro'], comercio: ['um supermercado', 'uma loja de roupas', 'uma loja de departamento', 'uma farmácia de rede', 'uma loja de materiais de construção'],
  vendas: ['uma distribuidora', 'uma imobiliária'], alimentacao: ['um restaurante', 'uma lanchonete', 'uma padaria', 'um bar do centro'], confeitaria: ['por encomenda'],
  administrativo: ['um escritório de contabilidade', 'uma distribuidora', 'uma clínica', 'uma empresa de logística', 'uma concessionária'], contabil: ['um escritório de contabilidade'],
  logistica: ['um centro de distribuição', 'uma transportadora', 'um atacadista'], ti: ['uma empresa de software', 'uma startup', 'um banco digital', 'uma consultoria de tecnologia'],
  dados: ['um banco', 'uma varejista grande', 'uma consultoria'], enfermagem: ['o hospital municipal', 'um hospital particular', 'uma UPA'], radiologia: ['uma clínica de imagem', 'o hospital regional'],
  saude_publica: ['a Unidade Básica de Saúde'], medicina: ['o hospital municipal', 'uma rede de clínicas', 'um hospital particular'], psicologia: ['uma clínica', 'o CAPS da cidade'],
  nutricao: ['uma clínica', 'uma rede de academias'], fisioterapia: ['uma clínica de reabilitação', 'o hospital regional'], odontologia: ['um consultório'], farmacia: ['uma farmácia', 'um laboratório'],
  veterinaria: ['uma clínica veterinária', 'uma cooperativa agrícola'], educacao_fisica: ['uma academia'], direito: ['um escritório de advocacia'], engenharia: ['uma construtora', 'uma incorporadora'],
  arquitetura: ['por conta própria'], eng_industrial: ['uma fábrica', 'uma montadora'], educacao: ['uma escola particular', 'uma creche', 'a rede municipal de ensino'], idiomas: ['um curso de idiomas'],
  ensino_tecnico: ['uma escola técnica'], academia: ['a universidade'], construcao: ['uma empreiteira', 'obras do bairro'], manutencao: ['uma empresa de manutenção'], eletrica: ['uma empresa de instalações'],
  mecanica: ['uma oficina', 'uma concessionária'], industria: ['uma fábrica', 'uma metalúrgica'], tecnico_industrial: ['uma fábrica', 'uma indústria da região'], seguranca_trabalho: ['uma construtora', 'uma fábrica'],
  agro: ['uma fazenda da região', 'uma cooperativa agrícola'], campo: ['a própria terra'], design: ['uma agência', 'uma editora'], ilustracao: ['por encomenda'], artesanato: ['feiras e encomendas'],
  imagem: ['por encomenda'], comunicacao: ['um portal de notícias', 'uma agência', 'um jornal da região'], conteudo: ['a internet'], literatura: ['uma editora'], musica: ['bares, festas e casamentos'],
  orquestra: ['a orquestra sinfônica'], cena: ['uma companhia de teatro'], danca: ['uma companhia de dança'], atleta: ['o clube'], treino: ['uma escolinha do bairro', 'um clube'], arbitragem: ['a federação'],
  vigilancia: ['uma empresa de segurança'], exercito_praca: ['o Exército'], exercito_sargento: ['o Exército'], exercito_oficial: ['o Exército'], pm: ['a Polícia Militar'], bombeiro: ['o Corpo de Bombeiros'],
  guarda: ['a prefeitura'], policia_civil: ['a Polícia Civil'], financas: ['um banco', 'uma corretora'], publico: ['a prefeitura'], judiciario: ['o Tribunal Regional'], fiscal: ['a Receita']
};

/* ---------------------------------------------------------- Elegibilidade */

export type ViaDeEntrada = 'curriculo' | 'oportunidade' | 'negocio' | 'promocao' | 'eleicao';

const MOTIVO_ENTRADA: Record<string, string> = {
  atleta: 'Ninguém vira atleta profissional mandando currículo: é preciso passar por uma peneira e ser chamado.',
  cena: 'Papel se conquista em teste, depois de anos de grupo e de palco.',
  musica: 'Viver de música depende de um convite, de um contrato, de público.',
  danca: 'Companhia de dança seleciona por audição, entre quem já dança há anos.',
  exercito_praca: 'Esse posto vem pelo serviço militar ou pela carreira, não por currículo.',
  exercito_sargento: 'Esse posto vem pela carreira militar, depois da escola de formação.',
  exercito_oficial: 'Esse posto vem pela carreira militar, depois da academia.',
  pm: 'Esse posto vem pela carreira, depois do concurso e do curso de formação.',
  bombeiro: 'Esse posto vem pela carreira, depois do concurso e do curso de formação.',
  academia: 'Bolsa de pesquisa vem pela seleção de um programa, depois do doutorado.',
  campo: 'Para produzir é preciso terra — da família, arrendada ou comprada.',
  conteudo: 'Vive disso quem já tem público.',
  literatura: 'Livro publicado vem de editora ou de edital, depois de muito texto na gaveta.',
  treino: 'Vaga em comissão técnica vem por convite de quem conhece o seu trabalho.'
};

function temFormacaoPara(v: Vida, oc: Ocupacao): boolean {
  if (!oc.area) return true;
  const nivel = oc.nivelCurso ? ORDEM_NIVEL[oc.nivelCurso] : 0;
  return v.educacao.concluidos.some(c =>
    (oc.area!.includes('qualquer') || oc.area!.includes(c.area as never)) && ORDEM_NIVEL[c.nivel] >= nivel);
}

function cursandoNaArea(v: Vida, oc: Ocupacao): boolean {
  const m = v.educacao.matricula;
  const c = m ? cursoOuNulo(m.cursoId) : undefined;
  const integrado = v.educacao.basica?.integrado ? cursoOuNulo(v.educacao.basica.integrado) : undefined;
  return !!oc.area && [c, integrado].some(x => x && (oc.area!.includes('qualquer') || oc.area!.includes(x.area as never)));
}

export function elegibilidade(v: Vida, oc: Ocupacao, via: ViaDeEntrada = 'curriculo', bonus = 0): Veredito {
  const i = idade(v);
  const t = v.trabalho;
  const ano = anoDe(v.t);

  if (oc.surge && ano < oc.surge) return bloqueio('impossivel', 'Ainda não existe.');
  if (i < 14) return bloqueio('ilegal', 'Trabalho é proibido antes dos 14 anos.');
  if (i < 16 && oc.contrato !== 'aprendiz') return bloqueio('ilegal', 'Entre 14 e 15 anos, só como jovem aprendiz.');
  if (i < oc.idadeMin) return bloqueio(oc.idadeMin <= 18 ? 'ilegal' : 'requisito', `Exige ${oc.idadeMin} anos.`);
  if (oc.idadeMax && i > oc.idadeMax) return bloqueio('requisito', `É para quem tem até ${oc.idadeMax} anos.`);
  if (via !== 'promocao' && oc.idadeMaxIngresso && i > oc.idadeMaxIngresso) return bloqueio('requisito', `A seleção tem limite de idade (até ${oc.idadeMaxIngresso} anos).`);
  if (t.atual?.ocupacaoId === oc.id) return bloqueio('incompativel', 'Você já trabalha nisso.');
  if (t.candidaturas.some(c => c.ocupacaoId === oc.id)) return bloqueio('incompativel', 'Já está no processo seletivo desta vaga.');
  if (t.aposentadoria && oc.concurso && i >= 60) return bloqueio('incompativel', 'Depois de aposentado e dos 60, os editais que valem a pena já não cabem na vida.');
  if (t.aposentadoria && eMilitar(oc)) return bloqueio('incompativel', 'Carreira militar não recebe quem já se aposentou.');
  if (v.justica?.prisao && v.justica.prisao.regime === 'fechado') return bloqueio('impossivel', 'Cumprindo pena em regime fechado, o trabalho possível é o da unidade.');
  if (oc.idoneidade && via !== 'promocao' && antecedenteAdulto(v)) return bloqueio('requisito', 'A investigação social pede ficha limpa: os antecedentes fecham esta porta.');
  if (oc.lugar === 'agua' && !pertoDaAgua(v.moradia.municipioId)) return bloqueio('requisito', `Não há mar nem rio de pesca por perto de ${municipio(v.moradia.municipioId).nome}.`);

  if (oc.entrada === 'oportunidade' && via !== 'oportunidade' && via !== 'promocao') {
    return bloqueio('requisito', MOTIVO_ENTRADA[oc.trilha] ?? 'Não se entra por currículo: depende de uma oportunidade concreta.');
  }
  if (oc.entrada === 'negocio' && via !== 'negocio') return bloqueio('requisito', 'É preciso abrir o próprio negócio.');
  if (oc.entrada === 'eleicao' && via !== 'eleicao') return bloqueio('impossivel', 'Mandato não é vaga: é eleição.');

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
    const formado = temFormacaoPara(v, oc);
    const alternativa = oc.habilidade?.ouFormacao && habilidade(v, oc.habilidade.dominio) >= oc.habilidade.minimo;
    if (!formado && !alternativa && !(oc.matriculado && cursandoNaArea(v, oc))) {
      const areas = oc.area.map(a => ROTULO_AREA[a]).join(' ou ');
      const n = oc.nivelCurso;
      const nivelTxt = n === 'livre' ? 'curso de qualificação' : n === 'tecnico' ? 'curso técnico ou superior' : n === 'superior' ? 'graduação' : n === 'residencia' ? 'residência' : n === 'doutorado' ? 'doutorado' : 'formação';
      const ou = oc.habilidade?.ouFormacao ? ' (ou saber fazer muito bem, com trabalho para mostrar)' : '';
      return bloqueio('requisito', `Exige ${nivelTxt} em ${areas}${ou}.${oc.fundamento ? ' ' + oc.fundamento : ''}`);
    }
  }
  if (oc.habilidade && !oc.habilidade.ouFormacao && habilidade(v, oc.habilidade.dominio) < oc.habilidade.minimo) {
    return bloqueio('requisito', MOTIVO_HABILIDADE[oc.habilidade.dominio] ?? 'Ainda não sabe fazer isso bem o bastante.');
  }
  if (oc.licenca && oc.licenca !== 'cnh' && !t.licencas.includes(oc.licenca)) {
    return bloqueio('requisito', `Exige registro profissional (${oc.licenca.toUpperCase()}).`);
  }
  if (oc.licenca === 'cnh' && !t.licencas.includes('cnh')) return bloqueio('requisito', 'Exige carteira de motorista.');
  if (oc.veiculo) {
    const bens = v.financas.bens.filter(b => b.tipo === 'veiculo' && veiculoUtil(b));
    const temCarro = bens.some(b => b.modeloId.startsWith('carro'));
    const temMoto = bens.some(b => b.modeloId.startsWith('moto'));
    const temBike = bens.some(b => b.modeloId.startsWith('bike'));
    const ok = oc.veiculo === 'carro' ? temCarro : oc.veiculo === 'moto_ou_bike' ? temMoto || temBike : temCarro || temMoto;
    if (!ok) return bloqueio('requisito', oc.veiculo === 'carro' ? 'Exige carro próprio.' : 'Exige moto ou bicicleta.');
  }
  if (oc.forma && via !== 'promocao' && v.corpo.forma < oc.forma) return bloqueio('requisito', 'O teste físico pede um preparo que você ainda não tem.');
  if (oc.forma && via !== 'promocao' && (v.corpo.saude < 55 || v.corpo.condicoes.some(c => c.cronica && c.gravidade >= 2))) return bloqueio('requisito', 'A inspeção de saúde não aprovaria.');
  if (nivelDeOferta(v.moradia.municipioId) < oc.oferta && via !== 'oportunidade') {
    return bloqueio('requisito', `Quase não há vagas assim em ${municipio(v.moradia.municipioId).nome}. Seria preciso morar numa cidade maior.`);
  }
  if (oc.concurso && via === 'curriculo') {
    if (!editalAberto(v, oc)) return bloqueio('incompativel', 'Não há edital aberto para este cargo agora. Os concursos abrem em anos diferentes.');
    const chance = chanceNoConcurso(v, oc);
    return { grau: chance < 0.2 ? 'improvavel' : 'permitido', chance };
  }

  // Experiência: requisito duro abaixo da metade; improvável entre metade e o total.
  // Para liderar, só conta a estrada na própria área: afins ajudam a entrar, não a chefiar.
  const exp = oc.nivel >= 4 ? (v.trabalho.experiencia[oc.trilha] ?? 0) : experienciaNaTrilha(v, oc.trilha);
  let chance = chanceBase(v, oc, bonus);
  if (oc.experiencia && via !== 'promocao') {
    if (exp < oc.experiencia / 2) return bloqueio('requisito', `Pedem ${anosTxt(oc.experiencia)} de experiência na área; você tem ${anosTxt(exp)}.`);
    if (exp < oc.experiencia) {
      chance *= 0.35;
      return { grau: 'improvavel', chance, motivo: `Pedem ${anosTxt(oc.experiencia)} de experiência; você tem ${anosTxt(exp)}.` };
    }
  }
  if (via === 'promocao' && oc.experiencia && exp < oc.experiencia) return bloqueio('requisito', `Pede ${anosTxt(oc.experiencia)} de estrada na área.`);
  if (v.financas.negativado && oc.trilha === 'financas') chance *= 0.3;
  return { grau: chance < 0.25 ? 'improvavel' : 'permitido', chance };
}

const MOTIVO_HABILIDADE: Partial<Record<Dominio, string>> = {
  musica: 'Ainda não toca bem o bastante para alguém pagar por isso.',
  desenho: 'Ainda não desenha o bastante para viver disso.',
  fotografia: 'Ainda não fotografa o bastante para cobrar.',
  escrita: 'Ainda não escreve o bastante para viver disso.',
  teatro: 'Ainda não atua o bastante para um teste.',
  danca: 'Ainda não dança o bastante para dar aula ou para uma audição.',
  idiomas: 'O inglês ainda não é de professor.',
  futebol: 'Precisa conhecer a bola de verdade para treinar crianças.',
  vendas: 'Ainda não tem traquejo de vendas para viver de comissão.',
  manual: 'Ainda não tem mão para cobrar por isso.',
  campo: 'Precisa conhecer o trabalho da terra.'
};

export function anosTxt(meses: number): string {
  const a = Math.floor(meses / 12);
  if (a === 0) return meses === 0 ? 'nenhuma' : 'menos de um ano';
  return a === 1 ? '1 ano' : `${a} anos`;
}

function chanceBase(v: Vida, oc: Ocupacao, bonus: number): number {
  const i = idade(v);
  let c = 0.52;
  c += (v.mente.cognicao - 50) / 450;
  c += (v.corpo.aparencia - 50) / 600;
  c += v.personalidade.tracos.sociabilidade / 600;
  c -= oc.nivel * 0.035;
  // Mais estrada do que pedem e um ofício bem aprendido contam.
  const exp = experienciaNaTrilha(v, oc.trilha);
  if (exp > (oc.experiencia ?? 0)) c += Math.min(0.12, (exp - (oc.experiencia ?? 0)) / 300);
  if (oc.habilidade) c += Math.max(-0.1, Math.min(0.12, (habilidade(v, oc.habilidade.dominio) - oc.habilidade.minimo) / 150));
  if (!oc.area && v.educacao.concluidos.some(x => x.nivel !== 'livre' && x.tFim > v.t - 60)) c += 0.04;
  const setor = forcaDoSetor(v.moradia.municipioId, oc.setor, anoDe(v.t));
  c *= 0.7 + setor * 0.3;
  c *= sobraNaEpoca(oc.declinio, anoDe(v.t)) * fatorDaEpoca(oc, anoDe(v.t));
  if (v.trabalho.desempregadoDesde !== undefined && v.t - v.trabalho.desempregadoDesde > 24) c -= 0.1;
  c += ajusteContratacao(v);
  if (i > 50 && oc.nivel < 4) c -= (i - 50) / 60; // etarismo real no mercado
  // Antecedentes pesam em quem contrata com carteira (o autônomo não passa por isso).
  if (oc.contrato === 'clt' || oc.contrato === 'estagio' || oc.contrato === 'aprendiz') c -= penaDeAntecedentes(v);
  c += bonus;
  return clamp(c, 0.05, 0.92);
}

/** Todas as ocupações com o veredito (para testes e para quem precisa da lista crua). */
export function vagasDisponiveis(v: Vida): { oc: Ocupacao; veredito: Veredito }[] {
  return OCUPACOES.map(oc => ({ oc, veredito: elegibilidade(v, oc) }));
}

/** Autônomos e informais não passam por entrevista: começam a pegar trabalho. */
export const porContaPropria = (oc: Ocupacao) => (oc.contrato === 'autonomo' || oc.contrato === 'informal') && !oc.entrada;

/* ------------------------------------------------------------ Contratar */

export function contratar(v: Vida, r: Rng, oc: Ocupacao, via = 'curriculo'): Emprego {
  const t = v.trabalho;
  const primeiro = !temFato(v, 'primeiro_emprego');
  if (t.atual) encerrarEmprego(v, 'trocou de emprego');
  // Quem estava fora do mercado cuidando de alguém, voltou: a pausa acaba com o primeiro emprego.
  if (t.pausa) {
    const anos = Math.max(1, Math.round((v.t - t.pausa.tInicio) / 12));
    t.pausa = undefined;
    delete v.fatos['pausa_voltar'];
    marcarFato(v, 'voltou_ao_mercado');
    marcar(v, 'retorno', `Voltou ao trabalho pago depois de ${anos} ${anos === 1 ? 'ano' : 'anos'} cuidando.`, 3, { ocupacaoId: oc.id });
  }
  const clientela = oc.promocao === 'clientela' ? clientelaInicial(v, oc) : undefined;
  if (eDasForcas(oc)) aoEntrarNasForcas(v, r, oc);
  const e: Emprego = {
    ocupacaoId: oc.id,
    empregador: eDasForcas(oc) && v.caminhos.militar ? NOME_FORCA[v.caminhos.militar.forca] : oc.concurso ? orgaoDoConcurso(oc) : r.pick(EMPREGADORES[oc.trilha] ?? ['uma empresa']),
    contrato: oc.contrato,
    salario: clientela !== undefined ? rendaDeClientela(v, oc, clientela) : salarioLocal(oc, v.moradia.municipioId, 0.9 + r.next() * 0.2),
    tInicio: v.t,
    tPosto: v.t,
    desempenho: 60,
    municipioId: v.moradia.municipioId,
    carga: oc.carga,
    via,
    clientela,
    formacaoAte: oc.formacaoInicial ? v.t + oc.formacaoInicial.meses : undefined,
    posAposentadoria: t.aposentadoria ? true : undefined
  };
  t.atual = e;
  t.desempregadoDesde = undefined;
  if (primeiro) {
    marcarFato(v, 'primeiro_emprego');
    marcar(v, 'primeiro_emprego', `Primeiro trabalho: ${nomeOcupacao(v, oc)}, aos ${idade(v)}.`, 2, { trilha: oc.trilha, ocupacaoId: oc.id });
  } else {
    const ultima = t.historico[t.historico.length - 1];
    const antes = ultima ? ocupacaoOuNula(ultima.ocupacaoId) : undefined;
    const mesmaFamilia = antes && (antes.trilha === oc.trilha || (AFINS[antes.trilha] ?? []).includes(oc.trilha) || ROTULO_TRILHA[antes.trilha] === ROTULO_TRILHA[oc.trilha]);
    if (antes && !mesmaFamilia && antes.setor !== oc.setor && antes.contrato !== 'estagio' && antes.contrato !== 'aprendiz' && (t.experiencia[antes.trilha] ?? 0) >= 36) {
      marcar(v, 'mudanca_carreira', `Deixou ${ROTULO_TRILHA[antes.trilha] ?? antes.trilha} para ${ROTULO_TRILHA[oc.trilha] ?? oc.trilha}, aos ${idade(v)}.`, 3, { trilha: oc.trilha, ocupacaoId: oc.id });
      marcarFato(v, 'mudou_de_carreira');
      v.fatos['mudancas_de_carreira'] = (v.fatos['mudancas_de_carreira'] ?? 0) + 1;
    }
  }
  if (oc.concurso && !oc.duracao) marcar(v, 'aprovacao', `${flex(ge(v), 'Aprovado', 'Aprovada', 'Aprovade')} no concurso: ${nomeOcupacao(v, oc)}.`, 3, { trilha: oc.trilha, ocupacaoId: oc.id });
  return e;
}

function orgaoDoConcurso(oc: Ocupacao): string {
  return ({
    tecnico_publico: 'a prefeitura', analista_judiciario: 'o Tribunal Regional', auditor_fiscal: 'a Receita', professor_concursado: 'a rede pública de ensino',
    escriturario_banco: 'um banco público', professor_univ: 'a universidade federal', agente_saude: 'a Unidade Básica de Saúde', guarda_municipal: 'a prefeitura',
    policial_civil: 'a Polícia Civil', delegado: 'a Polícia Civil', aluno_pm: 'a Polícia Militar', aluno_bombeiro: 'o Corpo de Bombeiros',
    aluno_sargento: 'o Exército', cadete: 'o Exército', musico_orquestra: 'a orquestra sinfônica', professor_substituto: 'a rede pública de ensino',
    pesquisador_instituto: 'um instituto público de pesquisa', policial_penal: 'a Polícia Penal', perito_criminal: 'a Polícia Científica', policial_rodoviario: 'a Polícia Rodoviária Federal',
    aluno_oficial_pm: 'a Polícia Militar', aluno_oficial_tecnico: 'o Exército'
  } as Record<string, string>)[oc.id] ?? 'o serviço público';
}

export function encerrarEmprego(v: Vida, motivo: string): void {
  const t = v.trabalho;
  if (!t.atual) return;
  t.historico.push({ ...t.atual, tFim: v.t, motivo });
  t.atual = undefined;
  t.horasExtras = false;
  // Sem emprego, a jornada reduzida para cuidar vira cuidado em tempo integral.
  if (t.pausa?.intensidade === 'parcial') { t.pausa.intensidade = 'total'; t.desempregadoDesde = undefined; return; }
  t.desempregadoDesde = t.pausa ? undefined : v.t;
}

export function textoDeContratacao(v: Vida, oc: Ocupacao, e: Emprego): string {
  const nome = nomeOcupacao(v, oc);
  const primeira = v.trabalho.historico.length === 0;
  if (oc.formacaoInicial) return `${flex(ge(v), 'Aprovado', 'Aprovada')} no concurso: começou o curso de formação ${em(e.empregador)}.`;
  if (oc.concurso && oc.duracao) return `${flex(ge(v), 'Aprovado', 'Aprovada')} no processo seletivo: ${nome}, com contrato de ${Math.round(oc.duracao / 12)} anos.`;
  if (oc.concurso) return `${flex(ge(v), 'Aprovado', 'Aprovada')} no concurso: ${nome} ${em(e.empregador)}, com estabilidade.`;
  if (e.contrato === 'autonomo' || e.contrato === 'informal') return `${primeira ? 'Começou a ganhar a vida' : 'Passou a trabalhar'} como ${nome}${e.via === 'indicacao' ? ', por indicação' : ''}.`;
  return `${primeira ? 'Primeiro emprego' : 'Novo emprego'}: ${nome} ${em(e.empregador)}${e.via === 'indicacao' ? ', por indicação' : ''}.`;
}

/* ----------------------------------------------------------- Clientela */

function clientelaInicial(v: Vida, oc: Ocupacao): number {
  const exp = experienciaNaTrilha(v, oc.trilha);
  const hab = oc.habilidade ? habilidade(v, oc.habilidade.dominio) : 50;
  return Math.round(clamp(12 + exp / 8 + (hab - 50) / 3, 8, 55));
}

/**
 * Renda de quem trabalha por conta: da freguesia, não do cargo. Com o
 * emprego em mãos, entram o ritmo, o preço e o que foi investido no trabalho.
 */
export function rendaDeClientela(v: Vida, oc: Ocupacao, clientela: number, e?: Emprego): number {
  const ref = salarioLocal(oc, v.moradia.municipioId);
  return Math.round(ref * (0.4 + clientela / 100 * 1.05) * fatorDeFreguesia(e) / 10) * 10;
}

/* ---------------------------------------------------------- Trabalho → ofício */

const PRATICA_DO_TRABALHO: Record<string, Partial<Record<Dominio, number>>> = {
  comercio: { vendas: 0.5 }, vendas: { vendas: 0.8 }, informal: { vendas: 0.4 }, alimentacao: { cozinha: 0.8 }, confeitaria: { cozinha: 0.8 },
  beleza: { beleza: 0.8 }, manutencao: { manual: 0.7 }, mecanica: { manual: 0.9 }, eletrica: { manual: 0.8 }, construcao: { manual: 0.7 },
  industria: { manual: 0.5 }, tecnico_industrial: { manual: 0.5, exatas: 0.2 }, artesanato: { manual: 0.8 }, agro: { campo: 0.8 }, campo: { campo: 1 },
  ti: { programacao: 0.8 }, dados: { programacao: 0.5, exatas: 0.4 }, design: { desenho: 0.8 }, ilustracao: { desenho: 0.9 }, imagem: { fotografia: 0.9 },
  comunicacao: { escrita: 0.8 }, literatura: { escrita: 0.9 }, conteudo: { fotografia: 0.5, escrita: 0.3 }, musica: { musica: 0.9 }, orquestra: { musica: 1 },
  cena: { teatro: 1 }, danca: { danca: 1 }, idiomas: { idiomas: 0.5 }, direito: { linguagens: 0.3 }, contabil: { exatas: 0.3 }, financas: { exatas: 0.3 },
  treino: { futebol: 0.3 }, educacao: { lideranca: 0.2 }
};

/* ---------------------------------------------------------- Ano de trabalho */

export function processarTrabalho(v: Vida, r: Rng): void {
  const t = v.trabalho;
  const i = idade(v);
  const e = t.atual;

  if (!e) {
    if (t.desempregadoDesde !== undefined && i >= 18 && !t.aposentadoria && !v.educacao.matricula) {
      const anos = Math.floor((v.t - t.desempregadoDesde) / 12);
      if (anos === 1) abalar(v, 'um ano inteiro sem trabalho', -6, 8);
    }
    aposentadoriaAutomatica(v);
    return;
  }

  const oc = ocupacao(e.ocupacaoId);
  const tPosto = e.tPosto ?? e.tInicio;

  // Experiência, ofício e contribuição
  t.experiencia[oc.trilha] = (t.experiencia[oc.trilha] ?? 0) + (e.carga === 'parcial' ? 8 : 12);
  const pratica = PRATICA_DO_TRABALHO[oc.trilha];
  if (pratica) for (const [d, w] of Object.entries(pratica) as [Dominio, number][]) praticar(v, r, d, w, 1);
  if (oc.nivel >= 4 && oc.promocao !== 'clientela') praticar(v, r, 'lideranca', 0.4, 1);
  if (contribui(e.contrato)) t.contribuicao += 12;
  if (eMilitar(oc)) v.corpo.forma = clamp(v.corpo.forma + 4);

  // Desempenho: disciplina, estresse, saúde, esforço, os anos no ofício — e o ofício, quando o trabalho é um.
  const oficio = oc.habilidade ? (habilidade(v, oc.habilidade.dominio) - oc.habilidade.minimo) * 0.25 : 0;
  const estrada = Math.min(8, (v.trabalho.experiencia[oc.trilha] ?? 0) / 18);
  // O ritmo e o clima também contam: quem puxa entrega mais; quem briga com a chefia, menos.
  const alvo = 54 + estrada + (v.mente.cognicao - 50) * 0.2 + v.personalidade.tracos.disciplina * 0.25 + oficio
    + (t.horasExtras ? 10 : 0) - Math.max(0, v.mente.estresse - 65) * 0.4 - Math.max(0, 50 - v.corpo.saude) * 0.3
    + (ritmoDe(e) === 'puxado' ? 6 : ritmoDe(e) === 'leve' ? -3 : 0) + (climaDe(e) - 50) * 0.08;
  e.desempenho = clamp(Math.round(e.desempenho * 0.5 + alvo * 0.5 + r.normal() * 8));

  // Estresse do cargo
  t.horasExtras = false;

  // Curso de formação (escola de sargentos, academia de polícia): termina e vira o posto.
  if (e.formacaoAte !== undefined) {
    if (v.t >= e.formacaoAte && oc.formacaoInicial) {
      const destino = ocupacao(oc.formacaoInicial.destino);
      e.ocupacaoId = destino.id;
      e.formacaoAte = undefined;
      e.tPosto = v.t;
      e.salario = salarioLocal(destino, e.municipioId);
      escrever(v, { texto: `Concluiu o curso de formação: agora é ${nomeOcupacao(v, destino)}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
      marcar(v, 'ingresso', `Formado no curso de formação: ${nomeOcupacao(v, destino)}.`, 3, { trilha: destino.trilha, ocupacaoId: destino.id });
      if (eDasForcas(destino)) aoFormarNasForcas(v, r, destino);
    }
    return;
  }

  // Forças Armadas: antiguidade, cursos, teste físico, transferências e reserva (`militar.ts`).
  if (eDasForcas(oc)) { ajustarSalario(v, r, e, oc); processarMilitar(v, r, e, oc); return; }

  // Mandato: subsídio fixo, prazo marcado, sem chefe nem promoção — quem avalia é o eleitor (`politica.ts`).
  if (e.contrato === 'eletivo') return;

  // Contrato com prazo (professor substituto, pós-doutorado): acaba — e aí é procurar o próximo.
  if (oc.duracao && v.t - e.tInicio >= oc.duracao) {
    const nome = nomeOcupacao(v, oc);
    encerrarEmprego(v, 'fim do contrato');
    escrever(v, { texto: oc.id === 'pesquisador' ? 'A bolsa de pós-doutorado acabou. O projeto terminou; o próximo edital, ninguém sabe quando sai.' : `O contrato de ${nome} chegou ao fim, como estava escrito desde o começo.`, relevancia: 'biografia', tema: 'trabalho' });
    marcar(v, 'fim_carreira', `Fim do contrato: ${nome}.`, 1, { trilha: oc.trilha, ocupacaoId: oc.id });
    return;
  }

  // Salário: anda dentro da faixa do cargo.
  ajustarSalario(v, r, e, oc);

  // Aprendiz: contrato de no máximo dois anos.
  if (e.contrato === 'aprendiz' && v.t - e.tInicio >= 24) {
    const efetiva = e.desempenho >= 60 && i >= 18 && ['permitido', 'improvavel'].includes(elegibilidade(v, ocupacao('aux_adm')).grau) && r.chance(0.45);
    encerrarEmprego(v, 'fim do contrato de aprendiz');
    if (efetiva) {
      contratar(v, r, ocupacao('aux_adm'), 'efetivacao');
      escrever(v, { texto: `O contrato de aprendiz acabou e a empresa ${flex(ge(v), 'o', 'a')} efetivou como auxiliar administrativ${flex(ge(v), 'o', 'a')}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    } else {
      escrever(v, { texto: 'O contrato de jovem aprendiz chegou ao fim.', relevancia: 'biografia', tema: 'trabalho' });
    }
    return;
  }

  // Estágio acaba quando o curso acaba.
  if (e.contrato === 'estagio' && !v.educacao.matricula && !v.educacao.basica) {
    const proximo = OCUPACOES.find(x => x.trilha === oc.trilha && x.nivel >= 1 && x.nivel <= 3 && !x.concurso && !x.entrada && elegibilidade(v, x).grau === 'permitido');
    encerrarEmprego(v, 'fim do estágio');
    if (proximo && e.desempenho >= 55 && r.chance(0.5)) {
      const novo = contratar(v, r, proximo, 'estagio');
      escrever(v, { texto: `O estágio acabou em contratação: ${nomeOcupacao(v, proximo)} em ${novo.empregador}.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    } else {
      escrever(v, { texto: 'O estágio terminou junto com o curso, sem efetivação.', relevancia: 'biografia', tema: 'trabalho' });
    }
    return;
  }

  // Serviço público: progressão por tempo e por titulação (não por conversa).
  if (e.contrato === 'servidor') progressaoDoServidor(v, e, oc);

  // Autônomos: a freguesia cresce ou míngua. Quem trabalha por conta não é "promovido";
  // com a clientela madura, às vezes dá um passo (abrir o próprio escritório).
  if (e.clientela !== undefined) {
    if (processarClientela(v, r, e, oc)) return;
    if (!e.posAposentadoria) passoDeClientela(v, r, e, oc);
    marcoDeEstrada(v, oc);
    return;
  } else if (demissao(v, r, e, oc)) return;
  marcoDeEstrada(v, oc);

  // Aposentado que voltou a trabalhar não entra na escada.
  if (e.posAposentadoria) return;
  promover(v, r, e, oc, tPosto);
}

/** O quanto um cargo costuma pagar no máximo, nesta cidade (negociar acima disso não cola). */
export function tetoSalarial(e: Emprego): number {
  const oc = ocupacao(e.ocupacaoId);
  return salarioLocal(oc, e.municipioId) * (oc.promocao === 'antiguidade' ? 1.5 : 1.45);
}

function ajustarSalario(v: Vida, r: Rng, e: Emprego, oc: Ocupacao): void {
  if (e.clientela !== undefined) return;
  // A faixa do cargo vale para a jornada cheia: turmas a mais ou jornada reduzida multiplicam depois.
  const jornada = fatorJornada(e);
  if (jornada !== 1) {
    e.salario = Math.round(e.salario / jornada);
    ajustarSalarioCheio(v, r, e, oc);
    e.salario = Math.round(e.salario * jornada / 10) * 10;
    return;
  }
  ajustarSalarioCheio(v, r, e, oc);
}

function ajustarSalarioCheio(v: Vida, r: Rng, e: Emprego, oc: Ocupacao): void {
  const ref = salarioLocal(oc, e.municipioId);
  const teto = tetoSalarial(e);
  const piso = ref * 0.85;
  if (e.contrato === 'informal') {
    e.salario = Math.round(clamp(e.salario * (0.88 + r.next() * 0.24), ref * 0.6, ref * 1.3) / 10) * 10;
    return;
  }
  // Quem vende vive de comissão: fixo baixo, variável que acompanha a mão para vender e o ano do comércio.
  if (oc.trilha === 'comercio' && oc.nivel === 2 || oc.trilha === 'vendas') {
    const mao = (habilidade(v, 'vendas') - 50) / 250;
    e.salario = Math.round(clamp(ref * (0.95 + mao + reajusteReal(v) * 2 + (r.next() - 0.5) * 0.25), ref * 0.7, teto) / 10) * 10;
    return;
  }
  // Reajuste real: acima da inflação na expansão, abaixo na crise (o servidor, por lei, só repõe).
  let fator = 1.01 + (e.contrato === 'servidor' || e.contrato === 'militar' ? Math.min(0, reajusteReal(v)) * 0.5 : reajusteReal(v));
  if (oc.promocao === 'antiguidade') fator += 0.005;
  else if (e.desempenho >= 70 && r.chance(0.5)) fator += 0.025;
  e.salario = Math.round(clamp(e.salario * fator, piso, Math.max(teto, e.salario)) / 10) * 10;
  if (e.salario > teto) e.salario = Math.round(Math.max(teto, e.salario * 0.995) / 10) * 10;
}

function processarClientela(v: Vida, r: Rng, e: Emprego, oc: Ocupacao): boolean {
  const hab = oc.habilidade ? habilidade(v, oc.habilidade.dominio) : 55;
  const exp = experienciaNaTrilha(v, oc.trilha) / 12;
  const setor = forcaDoSetor(e.municipioId, oc.setor, anoDe(v.t));
  const porte = nivelDeOferta(e.municipioId);
  const delta = (hab - 50) / 12 + Math.min(4, exp / 3) + v.personalidade.tracos.sociabilidade / 40 + (setor - 1) * 8 + (porte - 1.5) * 1.5
    + ajusteClientela(v) - Math.max(0, (e.clientela ?? 0) - 70) / 6 + r.normal() * 6 + 1 + deltaDeFreguesia(e, hab);
  e.clientela = Math.round(clamp((e.clientela ?? 20) + delta, 0, 100));
  e.salario = rendaDeClientela(v, oc, e.clientela, e);
  if (e.clientela <= 6 && v.t - e.tInicio >= 24) {
    escrever(v, { texto: `O trabalho como ${nomeOcupacao(v, oc)} foi minguando até não pagar mais as contas.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'demissao', `Parou de trabalhar como ${nomeOcupacao(v, oc)}: faltou freguesia.`, 2, { trilha: oc.trilha, ocupacaoId: oc.id });
    encerrarEmprego(v, 'falta de clientela');
    v.mente.estresse = clamp(v.mente.estresse + 8);
    return true;
  }
  if (e.clientela >= 70 && !temFato(v, `clientela_firme_${oc.id}`)) {
    marcarFato(v, `clientela_firme_${oc.id}`);
    escrever(v, { texto: `A freguesia firmou: já não falta trabalho como ${nomeOcupacao(v, oc)}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }
  return false;
}

/** Autônomo com clientela madura sobe um degrau que exista na trilha (advogado → sócio). */
function passoDeClientela(v: Vida, r: Rng, e: Emprego, oc: Ocupacao): void {
  if ((e.clientela ?? 0) < 75 || v.t - (e.tPosto ?? e.tInicio) < 60) return;
  const x = degrausAcima(oc).find(d => d.promocao !== 'clientela' || d.contrato === 'autonomo');
  if (!x || elegibilidade(v, x, 'promocao').grau !== 'permitido' || !r.chance(0.2)) return;
  const antes = nomeOcupacao(v, oc);
  e.ocupacaoId = x.id;
  e.tPosto = v.t;
  e.clientela = Math.round((e.clientela ?? 50) * 0.8);
  e.salario = rendaDeClientela(v, x, e.clientela, e);
  const texto = `Com a clientela que construiu como ${antes}, passou a ${nomeOcupacao(v, x)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  marcar(v, 'promocao', texto, 3, { trilha: x.trilha, ocupacaoId: x.id });
  v.fatos['promocoes'] = (v.fatos['promocoes'] ?? 0) + 1;
}

/** Anos de estrada que viram marco: dez, vinte, trinta anos na mesma área. */
function marcoDeEstrada(v: Vida, oc: Ocupacao): void {
  const anos = (v.trabalho.experiencia[oc.trilha] ?? 0) / 12;
  const area = ROTULO_TRILHA[oc.trilha] ?? oc.trilha;
  for (const alvo of [10, 20, 30]) {
    if (anos >= alvo && anos < alvo + 1 && !temFato(v, `estrada_${oc.trilha}_${alvo}`)) {
      marcarFato(v, `estrada_${oc.trilha}_${alvo}`);
      const texto = alvo === 10 ? `Dez anos de ${area}. Já não é ${flex(ge(v), 'o novato', 'a novata', 'e novate')} de ninguém.`
        : alvo === 20 ? `Vinte anos de ${area}. Muita gente aprendeu o ofício com você.`
          : `Trinta anos de ${area}. Não há canto desse trabalho que você não conheça.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho' });
      marcar(v, 'lideranca', texto, alvo === 10 ? 1 : 2, { trilha: oc.trilha });
    }
  }
}

function demissao(v: Vida, r: Rng, e: Emprego, oc: Ocupacao): boolean {
  const i = idade(v);
  const epoca = 1 - sobraNaEpoca(oc.declinio, anoDe(v.t));
  const base = e.contrato === 'servidor' ? 0.002 : e.contrato === 'militar' ? 0.003 : e.desempenho < 35 ? 0.3 : e.contrato === 'clt' ? 0.045 : 0.03;
  const clima = climaDe(e) < 30 ? 1.7 : climaDe(e) > 70 ? 0.8 : 1;
  const risco = (base + (e.contrato === 'clt' ? epoca * 0.12 + riscoDaEpoca(oc, anoDe(v.t)) : 0)) * (e.contrato !== 'servidor' && e.contrato !== 'militar' ? fatorDemissao(v) * clima : 1) * (i >= 55 && e.contrato === 'clt' ? 1.3 : 1);
  if (!r.chance(risco)) return false;
  const anos = Math.max(1, Math.floor((v.t - e.tInicio) / 12));
  const noPosto = Math.max(1, Math.floor((v.t - (e.tPosto ?? e.tInicio)) / 12));
  const nome = nomeOcupacao(v, oc);
  const tempo = noPosto < anos ? `${anos} anos ali, ${noPosto} ${noPosto === 1 ? 'deles' : 'deles'} como ${nome}` : `${anos} ${anos === 1 ? 'ano' : 'anos'} como ${nome}`;
  if (e.contrato === 'clt') {
    // Rescisão: saldo do FGTS + multa de 40% (aprox.) e seguro-desemprego.
    const fgts = Math.round(e.salario * 0.08 * 12 * anos * 1.4);
    const seguro = Math.round(Math.min(2400, Math.max(SALARIO_MINIMO, e.salario * 0.8)) * (anos >= 2 ? 5 : 3));
    v.financas.conta += fgts + seguro;
    const motivo = e.desempenho < 35 ? 'O desempenho vinha caindo.' : epoca > 0.2 && r.chance(0.6) ? 'A função vinha sendo automatizada.' : '';
    escrever(v, { texto: e.desempenho < 35 ? `Foi ${flex(ge(v), 'demitido', 'demitida')} de ${e.empregador}, onde era ${nome}. ${motivo}` : `Foi ${flex(ge(v), 'demitido', 'demitida')} num corte de pessoal ${em(e.empregador)}, depois de ${tempo}.${motivo ? ' ' + motivo : ''}`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'demissao', `${flex(ge(v), 'Demitido', 'Demitida', 'Demitide')} de ${e.empregador} depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}.`, anos >= 5 ? 3 : 2, { trilha: oc.trilha, ocupacaoId: oc.id });
  } else {
    escrever(v, { texto: `O trabalho como ${nome} minguou até acabar.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
  encerrarEmprego(v, 'demissão');
  abalar(v, 'a demissão', -10, 12);
  return true;
}

/**
 * O próximo degrau da trilha (quando existe). Promoção nunca leva para uma
 * ocupação que só se alcança por oportunidade (viver de música, jogar
 * profissionalmente) a partir de um trabalho comum — só dentro de uma
 * carreira que já é assim (soldado → cabo, tenente → capitão).
 */
export function degrausAcima(oc: Ocupacao): Ocupacao[] {
  return daTrilha(oc.trilha).filter(x => x.nivel === oc.nivel + 1 && !x.concurso && x.contrato !== 'estagio' && x.entrada !== 'negocio' && x.entrada !== 'eleicao' && !x.formacaoInicial
    && (x.entrada !== 'oportunidade' || oc.entrada === 'oportunidade' || !!oc.formacaoInicial || eMilitar(oc)));
}

function promover(v: Vida, r: Rng, e: Emprego, oc: Ocupacao, tPosto: number): void {
  const anosNoPosto = (v.t - tPosto) / 12;
  const acima = degrausAcima(oc).filter(x => x.id !== oc.id);
  if (!acima.length) return;
  // Servidor não vira empregado de empresa por "promoção": a carreira dele é o plano de carreira.
  const possiveis = acima.filter(x => (e.contrato !== 'servidor' || x.contrato === 'servidor') && (elegibilidade(v, x, 'promocao').grau === 'permitido' || elegibilidade(v, x, 'promocao').grau === 'improvavel'));
  if (!possiveis.length) return;
  const proximo = possiveis[0];
  let chance: number;
  if (oc.promocao === 'antiguidade') {
    if (anosNoPosto < (oc.anosNoPosto ?? 5) || e.desempenho < 40) return;
    chance = 0.75;
  } else {
    if (anosNoPosto < (oc.anosNoPosto ?? 2) || e.desempenho < 62) return;
    chance = (0.22 + (e.desempenho - 62) / 100) * (0.6 + forcaDoSetor(e.municipioId, proximo.setor, anoDe(v.t)) * 0.4) * (0.7 + climaDe(e) / 100 * 0.6);
    // Quem conversou sobre a promoção (e ouviu que dava) entra na frente na próxima vaga.
    if (v.fatos['promocao_pedida'] !== undefined && v.t - v.fatos['promocao_pedida'] <= 24) chance *= 1.5;
    if (proximo.nivel >= 4 && nivelDeOferta(e.municipioId) === 0) chance *= 0.6;
    if (emRecessao(v)) chance *= 0.4;
  }
  if (!r.chance(chance)) return;
  const anterior = nomeOcupacao(v, oc);
  const salarioAntigo = e.salario;
  e.ocupacaoId = proximo.id;
  e.contrato = proximo.contrato === 'autonomo' && e.contrato !== 'autonomo' ? e.contrato : proximo.contrato;
  e.carga = proximo.carga;
  e.salario = Math.max(Math.round(salarioAntigo * 1.1 / 10) * 10, salarioLocal(proximo, e.municipioId));
  e.tPosto = v.t;
  const texto = oc.promocao === 'antiguidade'
    ? `${flex(ge(v), 'Promovido', 'Promovida')} a ${nomeOcupacao(v, proximo)}, depois de ${Math.round(anosNoPosto)} anos como ${anterior}.`
    : `${flex(ge(v), 'Promovido', 'Promovida')} de ${anterior} a ${nomeOcupacao(v, proximo)}${/^por /.test(e.empregador) ? '' : ` ${em(e.empregador)}`}.`;
  escrever(v, { texto, relevancia: proximo.nivel >= 4 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
  marcar(v, proximo.nivel >= 5 ? 'lideranca' : 'promocao', texto, proximo.nivel >= 4 ? 3 : 2, { trilha: proximo.trilha, ocupacaoId: proximo.id });
  v.fatos['promocoes'] = (v.fatos['promocoes'] ?? 0) + 1;
  abalar(v, 'a promoção', 6, 0);
}

/**
 * Servidor: a cada três anos, a progressão da carreira (um passo na tabela);
 * ao concluir pós, mestrado ou doutorado, o adicional de titulação (o
 * professor da rede pública sobe assim — não virando "gerente").
 */
function progressaoDoServidor(v: Vida, e: Emprego, oc: Ocupacao): void {
  const anos = Math.floor((v.t - e.tInicio) / 12);
  const teto = tetoSalarial(e);
  if (anos > 0 && anos % 3 === 0 && e.salario < teto) {
    e.salario = Math.round(Math.min(teto, e.salario * 1.035) / 10) * 10;
    if (anos === 3) escrever(v, { texto: `Passou do estágio probatório: servidor${flex(ge(v), '', 'a', 'e')} estável, com a primeira progressão na carreira.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }
  const titulo = v.educacao.concluidos.filter(c => ['pos', 'mestrado', 'doutorado'].includes(c.nivel) && c.tFim >= v.t - 12 && c.tFim >= e.tInicio && !temFato(v, `titulacao_${c.cursoId}`)).pop();
  if (titulo) {
    marcarFato(v, `titulacao_${titulo.cursoId}`);
    const ganho = titulo.nivel === 'doutorado' ? 0.2 : titulo.nivel === 'mestrado' ? 0.12 : 0.06;
    e.salario = Math.round(e.salario * (1 + ganho) / 10) * 10;
    escrever(v, { texto: `Com ${titulo.nivel === 'pos' ? 'a especialização' : `o ${titulo.nivel}`}, o salário de ${nomeOcupacao(v, oc)} subiu um degrau na tabela da carreira.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }
}

/* ------------------------------------------------------------ Horizonte */

/**
 * Para onde a carreira pode ir agora — em palavras. É o que explica uma
 * estagnação: não subiu porque o próximo passo pede diploma, porque a cidade
 * é pequena, porque é cedo, ou porque ali é o topo.
 */
export function horizonte(v: Vida): string | undefined {
  const e = v.trabalho.atual;
  if (!e) return undefined;
  const oc = ocupacao(e.ocupacaoId);
  if (e.formacaoAte && oc.formacaoInicial) return `Em formação até ${anoDe(e.formacaoAte)}. Depois, ${nomeOcupacaoId(v, oc.formacaoInicial.destino)}.`;
  if (e.posAposentadoria) return 'Trabalho depois da aposentadoria: sem escada, pelo gosto ou pela conta.';
  if (oc.duracao && !eDasForcas(oc)) return `Contrato com prazo: termina por volta de ${anoDe(e.tInicio + oc.duracao)}. Depois, é outro edital, outra seleção.`;
  if (eDasForcas(oc)) return horizonteMilitar(v);
  if (e.contrato === 'servidor' && oc.promocao === 'antiguidade' && !degrausAcima(oc).length) return 'A carreira anda pela tabela: progressão a cada três anos e adicional quando conclui pós, mestrado ou doutorado. Mudar de cargo é outro concurso.';
  if (e.clientela !== undefined) {
    const c = e.clientela;
    const fam = familiaDaTrilha(oc.trilha);
    if (fam.id === 'rural') return c < 20 ? 'A produção ainda mal paga os custos.' : c < 45 ? 'A produção vem rendendo mais a cada safra.' : c < 70 ? 'Já tem compradores certos para o que produz.' : 'A produção paga bem: comprador disputa o que sai da terra.';
    if (fam.progressao === 'arte') return c < 20 ? 'Os trabalhos ainda são poucos: cada convite conta.' : c < 45 ? 'Os trabalhos vêm aparecendo, devagar.' : c < 70 ? 'Já tem quem chame você de novo.' : 'Não falta trabalho: a agenda está cheia.';
    return c < 20 ? 'A freguesia ainda é pouca: cada cliente conta.' : c < 45 ? 'A freguesia vem crescendo, devagar.' : c < 70 ? 'Já tem clientela fiel.' : 'Não falta trabalho: a agenda está cheia.';
  }
  const acima = degrausAcima(oc);
  const anosNoPosto = (v.t - (e.tPosto ?? e.tInicio)) / 12;
  if (!acima.length) return oc.nivel >= 4 ? 'É o topo do que essa carreira costuma oferecer.' : 'Não há cargo acima deste nesse tipo de trabalho. Crescer é mudar de área, estudar ou trabalhar por conta.';
  const x = acima[0];
  const nome = nomeOcupacao(v, x);
  const d = elegibilidade(v, x, 'promocao');
  if (d.grau !== 'permitido' && d.grau !== 'improvavel') {
    const m = d.motivo ?? '';
    if (/graduação|curso técnico|formação|Exige /.test(m)) return `O próximo passo (${nome}) pede formação: ${m.replace(/^Exige /, '').replace(/\.$/, '').split('. ')[0].toLowerCase()}.`;
    if (/estrada|experiência/.test(m)) return `O próximo passo (${nome}) pede mais tempo de estrada.`;
    if (/cidade maior|Quase não há/.test(m)) return `Cargos de ${nome} quase não existem numa cidade do tamanho de ${municipio(e.municipioId).nome}.`;
    return `O próximo passo (${nome}) ainda não está ao alcance: ${m.toLowerCase()}`;
  }
  if (oc.promocao === 'antiguidade') {
    const falta = Math.max(0, Math.ceil((oc.anosNoPosto ?? 5) - anosNoPosto));
    return falta > 0 ? `Pela antiguidade, a promoção a ${nome} vem por volta de ${anoDe(v.t) + falta}.` : `A promoção a ${nome} está perto: é questão de tempo e de vaga.`;
  }
  if (anosNoPosto < (oc.anosNoPosto ?? 2)) return `Ainda é cedo: promoção a ${nome} costuma levar uns ${oc.anosNoPosto ?? 2} anos no cargo.`;
  if (e.desempenho < 62) return `Para chegar a ${nome}, o trabalho precisaria estar indo melhor.`;
  if (x.nivel >= 4 && nivelDeOferta(e.municipioId) === 0) return `O próximo passo (${nome}) existe, mas em cidade pequena essas vagas são raras.`;
  return `O próximo passo (${nome}) está ao alcance; depende de uma vaga abrir.`;
}

/** Tempo de estrada na área, em palavras. */
export function estradaNaArea(v: Vida): string | undefined {
  const e = v.trabalho.atual;
  if (!e) return undefined;
  const oc = ocupacao(e.ocupacaoId);
  const anos = Math.floor((v.trabalho.experiencia[oc.trilha] ?? 0) / 12);
  const area = ROTULO_TRILHA[oc.trilha] ?? oc.trilha;
  if (anos < 1) return `Começando em ${area}.`;
  if (anos < 3) return `${anos === 1 ? 'Um ano' : `${anos} anos`} em ${area}: ainda aprendendo o ofício.`;
  if (anos < 8) return `${anos} anos em ${area}: já confiam trabalho maior a você.`;
  if (anos < 20) return `${anos} anos em ${area}: gente da área conhece o seu nome.`;
  return `${anos} anos em ${area}: virou referência para quem está chegando.`;
}

/* ------------------------------------------------------------ Aposentadoria */

export function podeAposentar(v: Vida): Veredito {
  const i = idade(v);
  const t = v.trabalho;
  if (t.aposentadoria) return bloqueio('incompativel', 'Já está aposentado.');
  if (t.atual?.contrato === 'eletivo') return bloqueio('incompativel', 'Primeiro, terminar (ou renunciar a) o mandato.');
  const atual = t.atual ? ocupacao(t.atual.ocupacaoId) : undefined;
  if (atual && eMilitar(atual)) {
    const anos = anosDeServicoMilitar(v);
    if (anos >= 35 || i >= 62) return { grau: 'permitido' };
    return bloqueio('requisito', `A reserva vem com 35 anos de serviço; você tem ${anos}.`);
  }
  const idadeMin = v.eu.genero === 'feminino' ? 62 : 65;
  const contribMin = v.eu.genero === 'feminino' ? 180 : 240;
  if (i < idadeMin) return bloqueio('requisito', `A aposentadoria por idade é aos ${idadeMin}.`);
  if (t.contribuicao < contribMin) return bloqueio('requisito', `Faltam ${Math.ceil((contribMin - t.contribuicao) / 12)} anos de contribuição ao INSS.`);
  return { grau: 'permitido' };
}

export function valorAposentadoria(v: Vida): number {
  const t = v.trabalho;
  const atual = t.atual ? ocupacao(t.atual.ocupacaoId) : undefined;
  // Militares vão para a reserva com a remuneração do posto.
  if (atual && eMilitar(atual) && t.atual) return Math.round(t.atual.salario * 0.95 / 10) * 10;
  const salarios = [...t.historico.filter(h => contribui(h.contrato)).map(h => h.salario), ...(t.atual && contribui(t.atual.contrato) ? [t.atual.salario] : [])];
  const media = salarios.length ? salarios.reduce((s, x) => s + x, 0) / salarios.length : SALARIO_MINIMO;
  const anos = Math.floor(t.contribuicao / 12);
  const minimo = v.eu.genero === 'feminino' ? 15 : 20;
  const pct = Math.min(1, 0.6 + Math.max(0, anos - minimo) * 0.02);
  return Math.round(clamp(media * pct, SALARIO_MINIMO, TETO_INSS));
}

export function aposentar(v: Vida): void {
  const beneficio = valorAposentadoria(v);
  const e = v.trabalho.atual;
  const oc = e ? ocupacao(e.ocupacaoId) : undefined;
  const militar = oc && eMilitar(oc);
  const trilha = maiorTrilha(v);
  if (v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado' && e?.ocupacaoId === v.caminhos.negocio.ocupacaoId) fecharNegocioAposentando(v);
  if (e) encerrarEmprego(v, 'aposentadoria');
  v.trabalho.desempregadoDesde = undefined;
  v.trabalho.aposentadoria = { t: v.t, beneficio };
  const anosNaTrilha = trilha ? Math.floor((v.trabalho.experiencia[trilha] ?? 0) / 12) : 0;
  const vida = trilha && anosNaTrilha >= 10 ? ` — ${anosNaTrilha} deles em ${ROTULO_TRILHA[trilha] ?? trilha}` : '';
  const texto = militar
    ? `Foi para a reserva depois de ${anosDeServicoMilitar(v)} anos de serviço, como ${nomeOcupacao(v, oc)}.`
    : `Aposentou-se depois de ${Math.floor(v.trabalho.contribuicao / 12)} anos de contribuição${vida}, com um benefício de R$ ${beneficio.toLocaleString('pt-BR')} por mês.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, militar ? 'reserva' : 'aposentadoria', texto, 3, { trilha });
  if (militar && oc && eDasForcas(oc)) v.fatos['mil_reserva'] = v.t;
  if (v.moradia.funcional) v.fatos['sair_funcional'] = v.t;
}

function fecharNegocioAposentando(v: Vida): void {
  const n = v.caminhos.negocio!;
  n.estado = 'fechado';
  n.tFim = v.t;
  const anos = Math.max(1, Math.round((v.t - n.tInicio) / 12));
  const texto = `Passou ${n.nome} adiante ao se aposentar, depois de ${anos} ${anos === 1 ? 'ano' : 'anos'}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho' });
  marcar(v, 'negocio_fechado', texto, 2, { ocupacaoId: n.ocupacaoId });
}

/** A trilha em que a pessoa passou mais tempo. */
export function maiorTrilha(v: Vida): string | undefined {
  return Object.entries(v.trabalho.experiencia).sort((a, b) => b[1] - a[1])[0]?.[0];
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
    marcar(v, 'aposentadoria', 'Passou a receber o BPC.', 2);
  }
}

export function descricaoEmprego(v: Vida): string {
  const e = v.trabalho.atual;
  if (!e) return v.trabalho.aposentadoria ? flex(ge(v), 'aposentado', 'aposentada') : 'sem trabalho';
  return `${nomeOcupacaoId(v, e.ocupacaoId)} · ${e.empregador}`;
}

export const salarioLiquidoAtual = (v: Vida) => (v.trabalho.atual ? liquido(v.trabalho.atual.salario, v.trabalho.atual.contrato) : 0);

export { nomeLugar, economiaLocal, nivelEsc };
