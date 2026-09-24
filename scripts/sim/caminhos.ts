/**
 * Simulador de CAMINHOS DE VIDA (ATT 2).
 *
 *   npx esbuild scripts/sim/caminhos.ts --bundle --platform=node --outfile=/tmp/caminhos.cjs
 *   VIDAS=25 SAIDA=/tmp/caminhos node /tmp/caminhos.cjs
 *
 * Doze jeitos de viver, escolhendo SEMPRE entre opções que o motor oferece
 * (nada de trapaça: toda ação passa por `disponibilidade`). Mede formação,
 * trabalho, carreira, esporte, arte, concurso, autonomia, cidade, e procura
 * incoerências (cargo sem requisito, recém-formado "sênior", promoção de
 * aposentado, desemprego sem fim). Grava biografias para leitura e uma
 * comparação de trajetórias com as mesmas sementes em idades fixas.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, opcoesDeCurso, opcoesDeAluguel, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Momento, Vida } from '../../src/motor/tipos';
import { filhos, idade, parceiro, vinculosVivos } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { MUNICIPIOS, nomeLugar, nivelDeOferta } from '../../src/motor/dados/lugares';
import { OCUPACOES, ocupacao, ROTULO_TRILHA, type Ocupacao } from '../../src/motor/dados/ocupacoes';
import { ORDEM_NIVEL, cursoOuNulo } from '../../src/motor/dados/cursos';
import { interacoesPara } from '../../src/motor/sistemas/interacoes';
import { moraComFamiliaDeOrigem } from '../../src/motor/sistemas/domicilio';
import { saldoMensal } from '../../src/motor/sistemas/dinheiro';
import { editaisAbertos } from '../../src/motor/sistemas/concurso';
import { negociosPossiveis } from '../../src/motor/sistemas/negocio';
import { habilidade } from '../../src/motor/sistemas/frentes';
import { capitalDoEstado, ROTULO_ESCOLARIDADE } from '../../src/motor/sistemas/escola';
import { elegibilidade, porContaPropria } from '../../src/motor/sistemas/trabalho';
import { semana } from '../../src/motor/sistemas/semana';

const VIDAS = Number(process.env.VIDAS ?? 20);
const SAIDA = process.env.SAIDA ?? '/tmp/caminhos';
mkdirSync(SAIDA, { recursive: true });

/* ---------------------------------------------------------------- Perfis */

interface Perfil {
  nome: string;
  /** Atividades que tenta ter, por idade: [id, idade mínima, nível desejado]. */
  atividades: [string, number, number][];
  postura: Vida['educacao']['postura'];
  estudo: 'superior' | 'tecnico' | 'qualificacao' | 'nenhum';
  areas?: string[];
  trabalhaCedo: boolean;
  concurso: boolean;
  empreende: boolean;
  setores: string[];
  aceita: string[];
  mudaCidade: boolean;
  persiste: boolean;
  familia: 'muita' | 'normal' | 'pouca';
  preferencias: string[];
  /** Muda de atividade de tempos em tempos. */
  experimenta?: boolean;
}

const P = (x: Perfil) => x;
const PERFIS: Perfil[] = [
  P({ nome: 'academico', atividades: [['leitura', 7, 1], ['xadrez', 8, 2], ['clube_ciencias', 10, 1], ['ingles', 10, 2]], postura: 'dedicada', estudo: 'superior', trabalhaCedo: false, concurso: false, empreende: false, setores: ['tecnologia', 'saude', 'engenharia', 'educacao', 'juridico', 'financas'], aceita: ['bolsa', 'estagio', 'proposta', 'vaga'], mudaCidade: true, persiste: true, familia: 'normal', preferencias: ['enem', 'preparo', 'estudar', 'curso0', 'ficar', 'recusar', 'publica', 'seguir', 'guardar', 'aceitar'] }),
  P({ nome: 'tecnico', atividades: [['consertar', 12, 1], ['programacao', 12, 1]], postura: 'dedicada', estudo: 'tecnico', trabalhaCedo: false, concurso: false, empreende: false, setores: ['industria', 'tecnologia', 'manutencao', 'saude', 'construcao', 'logistica'], aceita: ['selecao_tecnico', 'estagio', 'aprendiz', 'proposta', 'indicacao', 'vaga'], mudaCidade: false, persiste: false, familia: 'normal', preferencias: ['curso0', 'curso1', 'tecnico', 'preparo', 'estudar', 'ficar', 'aceitar'] }),
  P({ nome: 'trabalha_cedo', atividades: [['ajudar_familia', 12, 2], ['futebol', 6, 1]], postura: 'normal', estudo: 'qualificacao', trabalhaCedo: true, concurso: false, empreende: false, setores: ['comercio', 'alimentacao', 'manutencao', 'construcao', 'logistica', 'transporte', 'beleza'], aceita: ['aprendiz', 'temporario', 'indicacao', 'clientela', 'proposta', 'vaga'], mudaCidade: false, persiste: false, familia: 'normal', preferencias: ['aceitar', 'trabalhar', 'qualquer', 'confianca', 'conta', 'ficar'] }),
  P({ nome: 'esportista', atividades: [['futebol', 5, 2], ['academia', 16, 1]], postura: 'normal', estudo: 'nenhum', trabalhaCedo: false, concurso: false, empreende: false, setores: ['esporte', 'comercio', 'seguranca'], aceita: ['peneira', 'seletiva', 'convite', 'indicacao', 'vaga'], mudaCidade: true, persiste: true, familia: 'normal', preferencias: ['arriscar', 'ir', 'assinar', 'tentar', 'treinador', 'comissao', 'aceitar', 'confianca'] }),
  P({ nome: 'artista', atividades: [['musica', 7, 2], ['teatro', 10, 1], ['desenho', 6, 1]], postura: 'normal', estudo: 'nenhum', areas: ['musica_formacao', 'artes_cenicas', 'design'], trabalhaCedo: false, concurso: false, empreende: false, setores: ['criativo', 'comunicacao', 'educacao'], aceita: ['banda', 'grupo', 'convite', 'clientela', 'vaga'], mudaCidade: true, persiste: true, familia: 'normal', preferencias: ['entrar', 'aceitar', 'antiga', 'mudar', 'confianca', 'guardar'] }),
  P({ nome: 'concurseiro', atividades: [['leitura', 8, 1]], postura: 'dedicada', estudo: 'superior', areas: ['direito', 'administracao', 'contabilidade', 'economia'], trabalhaCedo: false, concurso: true, empreende: false, setores: ['publico', 'administrativo', 'financas'], aceita: ['estagio', 'vaga', 'indicacao'], mudaCidade: false, persiste: true, familia: 'normal', preferencias: ['concurso', 'enem', 'preparo', 'estudar', 'ficar', 'recusar', 'aceitar'] }),
  P({ nome: 'empreendedor', atividades: [['cozinhar', 11, 1], ['cortar_cabelo', 13, 1], ['consertar', 12, 1]], experimenta: true, postura: 'normal', estudo: 'qualificacao', trabalhaCedo: true, concurso: false, empreende: true, setores: ['comercio', 'alimentacao', 'beleza', 'manutencao'], aceita: ['clientela', 'temporario', 'indicacao', 'aprendiz', 'vaga'], mudaCidade: false, persiste: true, familia: 'normal', preferencias: ['entrar', 'insistir', 'mudar', 'conta', 'aceitar', 'confianca'] }),
  P({ nome: 'generalista', atividades: [['futebol', 6, 1], ['musica', 8, 1], ['desenho', 7, 1], ['volei', 10, 1], ['teatro', 11, 1], ['fotografia', 14, 1]], postura: 'normal', estudo: 'superior', trabalhaCedo: false, concurso: false, empreende: false, setores: [], aceita: ['banda', 'grupo', 'clientela', 'estagio', 'indicacao', 'temporario', 'retomar', 'vaga', 'proposta', 'selecao_tecnico'], mudaCidade: true, persiste: false, familia: 'normal', preferencias: ['aceitar', 'entrar', 'mudar', 'outra_empresa', 'antiga', 'curso1'], experimenta: true }),
  P({ nome: 'familiar', atividades: [['igreja', 3, 1], ['futebol', 6, 1]], postura: 'normal', estudo: 'tecnico', trabalhaCedo: false, concurso: false, empreende: false, setores: ['educacao', 'saude', 'administrativo', 'comercio'], aceita: ['indicacao', 'estagio', 'vaga'], mudaCidade: false, persiste: false, familia: 'muita', preferencias: ['ficar', 'recusar', 'nervoso', 'estudar', 'descansar', 'sim', 'ouvir'] }),
  P({ nome: 'desatento', atividades: [['videogame', 6, 1]], postura: 'relaxada', estudo: 'nenhum', trabalhaCedo: false, concurso: false, empreende: false, setores: [], aceita: [], mudaCidade: false, persiste: false, familia: 'pouca', preferencias: [] }),
  P({ nome: 'persistente', atividades: [['futebol', 6, 2], ['estudar_concurso', 22, 2]], postura: 'dedicada', estudo: 'superior', trabalhaCedo: false, concurso: true, empreende: false, setores: ['publico', 'esporte', 'administrativo'], aceita: ['peneira', 'seletiva', 'convite', 'estagio', 'vaga', 'indicacao'], mudaCidade: false, persiste: true, familia: 'normal', preferencias: ['tentar', 'insistir', 'ficar', 'arriscar', 'ir', 'assinar', 'estudar', 'enem', 'preparo'] }),
  P({ nome: 'mudanca', atividades: [['ingles', 10, 1], ['corrida', 14, 1]], postura: 'normal', estudo: 'superior', trabalhaCedo: false, concurso: false, empreende: false, setores: ['tecnologia', 'comercio', 'administrativo', 'logistica'], aceita: ['proposta', 'indicacao', 'estagio', 'vaga'], mudaCidade: true, persiste: false, familia: 'normal', preferencias: ['aceitar', 'sozinho', 'cidade', 'mudar', 'outra_empresa', 'enem'], experimenta: true })
];

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

function escolher(m: Momento, r: Rng, pref: string[], p: Perfil): string {
  const livres = m.opcoes.filter(o => !o.bloqueio);
  for (const x of pref) {
    const o = livres.find(y => y.id === x || y.id.startsWith(x));
    if (o) return o.id;
  }
  if (p.nome === 'desatento' && livres.length) return livres[livres.length - 1].id;
  return r.pick(livres.length ? livres : m.opcoes).id;
}

function agir(v: Vida, r: Rng, p: Perfil): Acao[] {
  const i = idade(v);
  const out: Acao[] = [];
  if (p.nome === 'desatento' && r.chance(0.5)) return out;
  if ((v.educacao.basica || v.educacao.matricula) && v.educacao.postura !== p.postura && i >= 7) out.push({ tipo: 'postura', valor: p.postura });

  // Atividades: começar e subir até o nível desejado; o generalista troca de tempos em tempos.
  const lista = p.experimenta ? p.atividades.filter((_, k) => (Math.floor(i / 4) + k) % 3 === 0) : p.atividades;
  if (p.experimenta && i % 4 === 0) for (const rot of v.rotinas) if (!lista.some(x => x[0] === rot.id) && r.chance(0.5) && !['estudar_concurso', 'cursinho'].includes(rot.id)) out.push({ tipo: 'rotina', id: rot.id, ativa: false });
  for (const [id, min, nivel] of lista) {
    if (i < min) continue;
    const atual = v.rotinas.find(x => x.id === id);
    if (!atual) { if (tenta(v, { tipo: 'rotina', id, ativa: true, nivel: 1 })) out.push({ tipo: 'rotina', id, ativa: true, nivel: 1 }); }
    else if ((atual.nivel ?? 1) < nivel && i >= min + 2 && tenta(v, { tipo: 'rotina', id, ativa: true, nivel: ((atual.nivel ?? 1) + 1) as 2 | 3 })) out.push({ tipo: 'rotina', id, ativa: true, nivel: ((atual.nivel ?? 1) + 1) as 2 | 3 });
  }
  // Oportunidades que o perfil aceita.
  for (const o of v.caminhos.oportunidades) if (p.aceita.includes(o.tipo) && tenta(v, { tipo: 'oportunidade', id: o.id, aceitar: true })) { out.push({ tipo: 'oportunidade', id: o.id, aceitar: true }); break; }

  // Concurso: estudar e prestar.
  if (p.concurso && i >= 18 && i <= 55 && !v.trabalho.atual?.contrato.match(/servidor|militar/)) {
    const est = v.rotinas.find(x => x.id === 'estudar_concurso');
    if (!est && tenta(v, { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 2 })) out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 2 });
    else if (!est && tenta(v, { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 1 })) out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 1 });
    const edital = editaisAbertos(v).filter(oc => tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })).sort((a, b) => (disponibilidade(v, { tipo: 'candidatar', ocupacaoId: b.id }).chance ?? 0) * b.salario - (disponibilidade(v, { tipo: 'candidatar', ocupacaoId: a.id }).chance ?? 0) * a.salario)[0];
    if (edital && (v.caminhos.concurso.meses >= 8 || p.persiste)) out.push({ tipo: 'candidatar', ocupacaoId: edital.id });
  }
  if (v.trabalho.atual?.contrato === 'servidor') { if (v.rotinas.some(x => x.id === 'estudar_concurso') && !p.persiste) out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: false }); }

  // Estudo.
  const temSuperior = v.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= 2);
  const temTecnico = v.educacao.concluidos.some(c => c.nivel === 'tecnico');
  const temQualif = v.educacao.concluidos.some(c => c.nivel === 'livre');
  if (p.estudo === 'superior' && i >= 17 && i <= 30 && !v.educacao.matricula && !temSuperior && tenta(v, { tipo: 'enem' })) out.push({ tipo: 'enem' });
  const voltaEstudar = r.chance(0.06);
  if (!v.educacao.matricula && i >= 15 && i <= 45) {
    const quer = (o: ReturnType<typeof opcoesDeCurso>[number]) => {
      const n = o.curso.nivel;
      if (p.estudo === 'superior') return (n === 'superior' && !temSuperior && i >= 17) || (temSuperior && p.nome === 'academico' && (n === 'mestrado' || n === 'doutorado' || n === 'pos') && i < 35);
      if (p.estudo === 'tecnico') return (n === 'tecnico' && !temTecnico && i >= 16) || (temTecnico && n === 'superior' && i >= 25 && i <= 40 && !temSuperior && v.trabalho.atual !== undefined && voltaEstudar);
      if (p.estudo === 'qualificacao') return n === 'livre' && !temQualif && i >= 16;
      return n === 'livre' && i >= 18 && !temQualif && r.chance(0.2);
    };
    const opcoes = opcoesDeCurso(v).map((o, idx) => ({ o, idx }))
      .filter(x => podeTentar(x.o.veredito) && quer(x.o) && v.fatos[`tentou_${x.o.curso.id}_${Math.floor(v.t / 12)}`] === undefined)
      .filter(x => x.o.mensalidade <= Math.max(500, saldoMensal(v).renda * 0.3) || ['sisu', 'prouni', 'fies', 'selecao_publica'].includes(x.o.via))
      .filter(x => x.o.municipioId === v.moradia.municipioId || x.o.modalidade === 'ead' || p.mudaCidade);
    // Cada vida tem um curso dos sonhos (sorteado pela semente), que pesa na escolha.
    const SONHOS = ['medicina', 'direito', 'eng_civil', 'computacao', 'psicologia', 'enfermagem', 'arquitetura', 'odontologia', 'veterinaria', 'jornalismo', 'design', 'eng_mecanica', 'economia', 'fisioterapia', 'nutricao', 'pedagogia', 'agronomia', 'letras'];
    const sonho = SONHOS[(v.eu.tNasc * 7 + v.id.length * 13 + v.id.charCodeAt(v.id.length - 1)) % SONHOS.length];
    const nota = (x: typeof opcoes[number]) => (x.o.curso.id === sonho ? 4 : 0) + (p.areas?.includes(x.o.curso.area) ? 3 : 0) + ({ sisu: 4, selecao_publica: 4, prouni: 3, fies: 2, ead: 1.5, privada: 1.5 } as Record<string, number>)[x.o.via] + (x.o.veredito.chance ?? 0) * 2 + (p.setores.length && OCUPACOES.some(oc => oc.area?.includes(x.o.curso.area as never) && p.setores.includes(oc.setor)) ? 1.5 : 0) + r.next();
    const melhor = opcoes.sort((a, b) => nota(b) - nota(a))[0];
    if (melhor) out.push({ tipo: 'matricular', indice: melhor.idx });
  }

  // Trabalho.
  const semEmprego = !v.trabalho.atual && !v.trabalho.aposentadoria;
  const podeTrabalhar = i >= 16 && (i >= 18 || p.trabalhaCedo) && !(v.educacao.matricula && ORDEM_NIVEL[cursoOuNulo(v.educacao.matricula.cursoId)?.nivel ?? 'livre'] >= 2 && cursoOuNulo(v.educacao.matricula.cursoId)?.carga === 'integral' && i < 22);
  const esporteSerio = v.caminhos.esporte?.fase === 'base' || v.caminhos.esporte?.fase === 'profissional';
  if (semEmprego && podeTrabalhar && !esporteSerio && !(p.concurso && i < 24 && v.educacao.matricula)) {
    const vagas = OCUPACOES.filter(oc => !oc.concurso && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id }) && (i >= 18 || oc.contrato === 'aprendiz' || oc.contrato === 'estagio' || oc.nivel <= 1));
    const pontos = (oc: Ocupacao) => (p.setores.includes(oc.setor) ? 8 : 0) + oc.nivel + (disponibilidade(v, { tipo: 'candidatar', ocupacaoId: oc.id }).chance ?? 0.5) * 4 + (p.empreende && porContaPropria(oc) ? 5 : 0) + r.next() * 2;
    const alvo = vagas.sort((a, b) => pontos(b) - pontos(a))[0];
    if (alvo) out.push({ tipo: 'candidatar', ocupacaoId: alvo.id });
  } else if (v.trabalho.atual && !v.trabalho.atual.posAposentadoria && i < 60 && (p.nome === 'academico' || p.nome === 'mudanca' || p.nome === 'generalista') && r.chance(0.25)) {
    const atual = ocupacao(v.trabalho.atual.ocupacaoId);
    const melhor = OCUPACOES.filter(oc => !oc.concurso && oc.salario > atual.salario * 1.2 && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id }) && !porContaPropria(oc)).sort((a, b) => b.salario - a.salario)[0];
    if (melhor) out.push({ tipo: 'candidatar', ocupacaoId: melhor.id });
    if (tenta(v, { tipo: 'pedir_aumento' }) && r.chance(0.3)) out.push({ tipo: 'pedir_aumento' });
  }
  // Empreender quando der.
  if (p.empreende && i >= 22 && i <= 60) {
    const n = negociosPossiveis(v).find(x => x.veredito.grau === 'permitido');
    if (n) out.push({ tipo: 'abrir_negocio', negocio: n.t.id });
  }
  // Mudar para cidade maior atrás de estudo/trabalho.
  if (p.mudaCidade && i >= 19 && i <= 30 && nivelDeOferta(v.moradia.municipioId) <= 1 && !v.fatos['mudou_de_cidade'] && r.chance(0.3)) {
    const destino = capitalDoEstado(v.moradia.municipioId);
    if (destino !== v.moradia.municipioId && tenta(v, { tipo: 'mudar_cidade', municipioId: destino })) out.push({ tipo: 'mudar_cidade', municipioId: destino });
  }
  if (tenta(v, { tipo: 'aposentar' }) && i >= (p.nome === 'familiar' ? 62 : 66)) out.push({ tipo: 'aposentar' });

  // Vida social (mínima, para a família existir e competir por tempo).
  const par = parceiro(v);
  if (par && p.familia !== 'pouca') { const x = interacoesPara(v, par.p.id).find(y => ['apoiar', 'relacao', 'sair_juntos'].includes(y.id)); if (x) out.push({ tipo: 'pessoa', pessoaId: par.p.id, interacao: x.id }); }
  for (const f of filhos(v)) if (p.familia === 'muita' || r.chance(0.4)) { const x = interacoesPara(v, f.id).find(y => ['apoiar', 'cuidar', 'brincar', 'estudos', 'conversar', 'ler'].includes(y.id)); if (x) out.push({ tipo: 'pessoa', pessoaId: f.id, interacao: x.id }); }
  if (p.familia !== 'pouca') {
    for (const x of vinculosVivos(v)) {
      const rom = x.vin.romance;
      if (!rom || rom.secreto) continue;
      if (rom.estagio === 'saindo') out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'pedir_namoro' });
      if (rom.estagio === 'namoro' && i >= 22) out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'morar_junto' });
      if ((rom.estagio === 'namoro' || rom.estagio === 'morando_junto') && i >= 25) out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'pedir_casamento' });
    }
    if (!par && i >= 18 && r.chance(0.35)) { const alvo = vinculosVivos(v).find(x => !x.vin.parentesco && !x.vin.romance && (x.vin.estagio === 'amigo' || x.vin.estagio === 'colega')); if (alvo) out.push({ tipo: 'pessoa', pessoaId: alvo.p.id, interacao: 'convidar' }); }
    if (par && i >= 25 && i <= 40 && filhos(v).length < (p.familia === 'muita' ? 3 : 2)) out.push({ tipo: 'pessoa', pessoaId: par.p.id, interacao: 'planejar_filhos' });
    if (par && filhos(v).length >= (p.familia === 'muita' ? 3 : 2)) out.push({ tipo: 'pessoa', pessoaId: par.p.id, interacao: 'evitar_filhos' });
    if (p.familia === 'muita' && (par || filhos(v).length) && tenta(v, { tipo: 'rotina', id: 'tempo_familia', ativa: true, nivel: 1 })) out.push({ tipo: 'rotina', id: 'tempo_familia', ativa: true, nivel: 1 });
  }
  // Casa própria de aluguel em algum momento.
  if (moraComFamiliaDeOrigem(v) && i >= (p.nome === 'familiar' ? 24 : 22) && v.trabalho.atual) {
    const alvo = opcoesDeAluguel(v).filter(o => podeTentar(o.veredito)).sort((a, b) => a.aluguel - b.aluguel)[0];
    if (alvo) out.push({ tipo: 'sair_de_casa', modeloId: alvo.m.id });
  }
  if (i >= 18 && !v.trabalho.licencas.includes('cnh') && i >= 20 && tenta(v, { tipo: 'cnh' })) out.push({ tipo: 'cnh' });
  return out;
}

/* -------------------------------------------------------------- Simular */

interface Foto { idade: number; ocupacao: string; trilha: string; setor: string; escolaridade: string; frentes: string; cidade: string; renda: number }
interface VidaSim { semente: number; perfil: string; vida: Vida; fotos: Foto[]; violacoes: string[]; anosSemCaminho: number; anosSemNada: number; anosAdultos: number; desempregoMax: number; salarios: Record<number, number> }

function checar(v: Vida, out: string[], ant: { promocoes: number; aposentado: boolean }): void {
  const i = idade(v);
  const e = v.trabalho.atual;
  if (e) {
    const oc = ocupacao(e.ocupacaoId);
    if (oc.area && !oc.entrada) {
      const formado = v.educacao.concluidos.some(c => (oc.area!.includes('qualquer') || oc.area!.includes(c.area as never)) && ORDEM_NIVEL[c.nivel] >= ORDEM_NIVEL[oc.nivelCurso ?? 'livre']);
      const alt = oc.habilidade?.ouFormacao && habilidade(v, oc.habilidade.dominio) >= oc.habilidade.minimo - 12;
      const cursando = oc.matriculado && (v.educacao.matricula || v.educacao.basica);
      if (!formado && !alt && !cursando && oc.contrato !== 'estagio') out.push(`${i}: ${oc.id} sem formação` + (process.env.DEBUG ? ' ← ' + v.biografia.filter(b => b.tema === 'trabalho').slice(-2).map(b => b.texto).join(' | ') + ' via ' + e.via : ''));
    }
    if (oc.licenca && oc.licenca !== 'cnh' && !v.trabalho.licencas.includes(oc.licenca)) out.push(`${i}: ${oc.id} sem registro ${oc.licenca}`);
    if (i < 14) out.push(`${i}: trabalho aos ${i}`);
    if (i < 16 && e.contrato !== 'aprendiz') out.push(`${i}: ${e.contrato} aos ${i}`);
  }
  const prom = v.fatos['promocoes'] ?? 0;
  if (ant.aposentado && prom > ant.promocoes && e?.posAposentadoria) out.push(`${i}: promovido depois de aposentado`);
  ant.promocoes = prom;
  ant.aposentado = !!v.trabalho.aposentadoria;
}

const foto = (v: Vida): Foto => {
  const e = v.trabalho.atual;
  const oc = e ? ocupacao(e.ocupacaoId) : undefined;
  const fr = Object.entries(v.caminhos.frentes).filter(([d, f]) => f && f.habilidade >= 45 && !['exatas', 'linguagens', 'ciencias', 'humanas'].includes(d)).map(([d]) => d).join('+') || '—';
  return {
    idade: idade(v), ocupacao: oc ? oc.id : v.caminhos.esporte?.fase === 'base' ? 'base_esportiva' : v.trabalho.aposentadoria ? 'aposentado' : v.educacao.matricula ? `estudante:${v.educacao.matricula.cursoId}` : v.educacao.basica ? 'escola' : 'sem_trabalho',
    trilha: oc?.trilha ?? '—', setor: oc?.setor ?? '—', escolaridade: v.educacao.escolaridade, frentes: fr, cidade: nomeLugar(v.moradia.municipioId), renda: saldoMensal(v).renda
  };
};

export function simular(semente: number, perfil: Perfil): VidaSim {
  const r = criarRng(semente * 13 + 5);
  const m = MUNICIPIOS[semente % MUNICIPIOS.length];
  const genero = semente % 2 === 0 ? 'feminino' : 'masculino';
  let v = criarVida({ nome: 'Vida', sobrenome: 'Sim', genero, municipioId: m.id, semente });
  const fotos: Foto[] = [];
  const violacoes: string[] = [];
  const ant = { promocoes: 0, aposentado: false };
  let anosSemCaminho = 0, anosSemNada = 0, anosAdultos = 0, desempregoMax = 0;
  const salarios: Record<number, number> = {};
  let guarda = 0;
  while (!v.morte && idade(v) < 110 && guarda++ < 120) {
    for (const a of agir(v, r, perfil)) {
      if (!tenta(v, a)) continue;
      v = executar(v, a).vida;
      if (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: escolher(v.momento, r, perfil.preferencias, perfil) }).vida;
    }
    const antes = v.biografia.length;
    const marcasAntes = v.caminhos.marcas.length;
    v = avancarAno(v).vida;
    while (v.momento) { const mm = v.momento; const op = escolher(mm, r, perfil.preferencias, perfil); try { v = executar(v, { tipo: "decidir", opcaoId: op }).vida; } catch (err) { console.error("ERRO", mm.situacaoId, op, idade(v)); throw err; } }
    const i = idade(v);
    checar(v, violacoes, ant);
    if ([18, 25, 35, 50, 65].includes(i)) fotos.push(foto(v));
    if (i >= 25 && i <= 60 && v.trabalho.atual && !v.trabalho.atual.posAposentadoria) salarios[i] = v.trabalho.atual.salario;
    if (i >= 22 && i <= 60) {
      anosAdultos++;
      const caminho = v.biografia.slice(antes).some(b => (b.tema === 'trabalho' || b.tema === 'estudo') && b.relevancia !== 'tecnico') || v.caminhos.marcas.length > marcasAntes;
      if (!caminho) anosSemCaminho++;
      if (!caminho && !v.biografia.slice(antes).some(b => b.tema === 'lazer' && b.relevancia !== 'tecnico')) anosSemNada++;
    }
    if (!v.trabalho.atual && !v.trabalho.aposentadoria && !v.educacao.matricula && v.trabalho.desempregadoDesde !== undefined && i < 62) desempregoMax = Math.max(desempregoMax, Math.floor((v.t - v.trabalho.desempregadoDesde) / 12));
  }
  return { semente, perfil: perfil.nome, vida: v, fotos, violacoes, anosSemCaminho, anosSemNada, anosAdultos, desempregoMax, salarios };
}

/* ------------------------------------------------------------ Biografia */

function biografia(s: VidaSim): string {
  const v = s.vida;
  const l: string[] = [];
  l.push(`# ${s.perfil} · semente ${s.semente} · ${v.eu.genero} · ${nomeLugar(v.eu.municipioNatal)} · ${v.origem.classe}`);
  l.push(`morreu aos ${idade(v)} · ${ROTULO_ESCOLARIDADE[v.educacao.escolaridade]} · empregos ${v.trabalho.historico.length + (v.trabalho.atual ? 1 : 0)} · filhos ${filhos(v).length}`);
  l.push('');
  l.push('## Fotos');
  for (const f of s.fotos) l.push(`- ${f.idade}: ${f.ocupacao} (${f.setor}) · ${f.escolaridade} · faz bem: ${f.frentes} · ${f.cidade} · renda R$ ${f.renda}`);
  l.push('');
  l.push('## Marcas do caminho');
  for (const m of v.caminhos.marcas) l.push(`- ${Math.floor((m.t - v.eu.tNasc) / 12)} [${m.tipo}${m.peso === 3 ? '★' : ''}] ${m.texto}`);
  l.push('');
  l.push('## Linha da Vida (biografia e marcos)');
  let idadeAnt = -1;
  for (const e of v.biografia) {
    if (e.relevancia === 'tecnico' || e.relevancia === 'cotidiano') continue;
    const cab = e.idade !== idadeAnt ? String(e.idade).padStart(3) : '   ';
    idadeAnt = e.idade;
    l.push(`${cab} ${e.relevancia === 'marco' ? '★' : '–'} ${e.escolha ? '[escolha] ' : ''}${e.texto}`);
  }
  if (s.violacoes.length) { l.push(''); l.push('## Violações'); for (const x of s.violacoes) l.push(`- ${x}`); }
  return l.join('\n');
}

/* ---------------------------------------------------------------- Rodar */

if (process.env.SEMENTE) {
  // Uma vida só, para leitura: SEMENTE=8919 PERFIL=esportista
  const p = PERFIS.find(x => x.nome === process.env.PERFIL) ?? PERFIS[0];
  console.log(biografia(simular(Number(process.env.SEMENTE), p)));
  process.exit(0);
}
const todas: VidaSim[] = [];
for (const p of PERFIS) for (let k = 0; k < VIDAS; k++) todas.push(simular(1000 + k * 7919, p));

const pct = (a: number[], q: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : 0; };
const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const out: string[] = [];
const log = (s = '') => { out.push(s); console.log(s); };
const n = todas.length;
const frac = (f: (s: VidaSim) => boolean, vs = todas) => `${vs.filter(f).length}/${vs.length} (${Math.round(100 * vs.filter(f).length / Math.max(1, vs.length))}%)`;
const marca = (s: VidaSim, tipo: string, f?: (m: Vida['caminhos']['marcas'][number]) => boolean) => s.vida.caminhos.marcas.some(m => m.tipo === tipo && (!f || f(m)));
const bio = (s: VidaSim, re: RegExp) => s.vida.biografia.some(b => re.test(b.texto));
const adultos = todas.filter(s => idade(s.vida) >= 30);

log(`# Caminhos de vida — ${n} vidas (${PERFIS.length} jeitos de viver × ${VIDAS})`);
log('');
log('## Formação');
log(`- concluiu o ensino médio: ${frac(s => ['medio', 'tecnico', 'superior_incompleto', 'superior', 'pos', 'mestrado', 'doutorado'].includes(s.vida.educacao.escolaridade))}`);
log(`- ensino técnico (inclui integrado): ${frac(s => s.vida.educacao.concluidos.some(c => c.nivel === 'tecnico'))} · médio integrado: ${frac(s => marca(s, 'ingresso', m => /integrado/.test(m.texto)))}`);
log(`- qualificação de ofício: ${frac(s => s.vida.educacao.concluidos.some(c => c.nivel === 'livre'))}`);
log(`- superior completo: ${frac(s => s.vida.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= 2))} · sem ensino superior (vidas que passaram dos 30): ${frac(s => !s.vida.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= 2), adultos)}`);
log(`- repetiu de ano alguma vez: ${frac(s => s.vida.biografia.some(b => /^Repetiu|reprovação:/.test(b.texto)))} · largou a escola: ${frac(s => s.vida.biografia.some(b => /^Largou a escola/.test(b.texto)))} · voltou pelo supletivo: ${frac(s => s.vida.biografia.some(b => /supletivo/.test(b.texto)))}`);
const enems = todas.flatMap(s => s.vida.educacao.enem.map(x => x.nota));
log(`- ENEM: mediana ${pct(enems, 0.5)} · p10 ${pct(enems, 0.1)} · p90 ${pct(enems, 0.9)} (${enems.length} provas)`);
const cursosSup = new Map<string, number>();
for (const s of todas) for (const c of s.vida.educacao.concluidos) if (c.nivel !== 'livre') cursosSup.set(c.cursoId, (cursosSup.get(c.cursoId) ?? 0) + 1);
log(`- cursos concluídos: ${[...cursosSup.entries()].sort((a, b) => b[1] - a[1]).map(([k, x]) => `${k} ${x}`).join(' · ')}`);
log(`- voltou a estudar depois dos 30: ${frac(s => s.vida.educacao.concluidos.some(c => (c.tFim - s.vida.eu.tNasc) / 12 >= 30 && ORDEM_NIVEL[c.nivel] <= 2))}`);
const idadeFormacao = todas.flatMap(s => s.vida.educacao.concluidos.filter(c => c.nivel !== 'livre').map(c => Math.floor((c.tFim - s.vida.eu.tNasc) / 12)));
log(`- idade ao concluir formação (técnico/superior): mediana ${pct(idadeFormacao, 0.5)} · p10 ${pct(idadeFormacao, 0.1)} · p90 ${pct(idadeFormacao, 0.9)}`);
log('');
log('## Trabalho');
const primeiroEmp = todas.map(s => { const h = [...s.vida.trabalho.historico, ...(s.vida.trabalho.atual ? [s.vida.trabalho.atual] : [])][0]; return h ? Math.floor((h.tInicio - s.vida.eu.tNasc) / 12) : -1; }).filter(x => x >= 0);
log(`- idade do primeiro emprego: mediana ${pct(primeiroEmp, 0.5)} · p10 ${pct(primeiroEmp, 0.1)} · p90 ${pct(primeiroEmp, 0.9)} · nunca trabalhou: ${n - primeiroEmp.length}`);
const nEmpregos = todas.map(s => s.vida.trabalho.historico.length + (s.vida.trabalho.atual ? 1 : 0));
log(`- empregos por vida: mediana ${pct(nEmpregos, 0.5)} · p90 ${pct(nEmpregos, 0.9)}`);
const tempos = todas.flatMap(s => s.vida.trabalho.historico.map(h => (h.tFim - h.tInicio) / 12));
log(`- tempo médio num emprego: ${media(tempos).toFixed(1)} anos (mediana ${pct(tempos, 0.5).toFixed(1)})`);
const mudancas = todas.map(s => s.vida.fatos['mudancas_de_carreira'] ?? 0);
log(`- mudanças de carreira (setor, depois de 3+ anos): média ${media(mudancas).toFixed(2)} · vidas com alguma: ${frac(s => (s.vida.fatos['mudancas_de_carreira'] ?? 0) > 0)}`);
log(`- demitido alguma vez: ${frac(s => marca(s, 'demissao'))} · desemprego de 3+ anos seguidos: ${frac(s => s.desempregoMax >= 3)} · 10+ anos: ${frac(s => s.desempregoMax >= 10)}`);
const promocoes = todas.map(s => s.vida.fatos['promocoes'] ?? 0);
log(`- promoções por vida: mediana ${pct(promocoes, 0.5)} · p90 ${pct(promocoes, 0.9)} · máx ${Math.max(...promocoes)} · por perfil: ${PERFIS.map(p => `${p.nome} ${media(todas.filter(s => s.perfil === p.nome).map(s => s.vida.fatos['promocoes'] ?? 0)).toFixed(1)}`).join(' · ')}`);
log(`- habilidade máxima no futebol (esportistas): ${todas.filter(s => s.perfil === 'esportista').map(s => Math.round(s.vida.caminhos.frentes.futebol?.auge ?? 0)).join(' ')} · música (artistas): ${todas.filter(s => s.perfil === 'artista').map(s => Math.round(s.vida.caminhos.frentes.musica?.auge ?? 0)).join(' ')}`);
const progressao = todas.filter(s => s.salarios[30] && s.salarios[50]).map(s => s.salarios[50] / s.salarios[30]);
log(`- salário aos 50 ÷ salário aos 30 (quem trabalhava nas duas idades): mediana ${pct(progressao, 0.5).toFixed(2)} · p90 ${pct(progressao, 0.9).toFixed(2)} · máx ${Math.max(0, ...progressao).toFixed(2)}`);
log(`- aposentou-se (INSS/reserva): ${frac(s => !!s.vida.trabalho.aposentadoria && !s.vida.fatos['bpc'])} · BPC: ${frac(s => !!s.vida.fatos['bpc'])}`);
log(`- trabalho por conta alguma vez: ${frac(s => [...s.vida.trabalho.historico, ...(s.vida.trabalho.atual ? [s.vida.trabalho.atual] : [])].some(h => h.contrato === 'autonomo'))} · negócio aberto: ${frac(s => marca(s, 'negocio_aberto'))} · fechado: ${frac(s => marca(s, 'negocio_fechado'))}`);
log(`- mudou de cidade por trabalho/estudo: ${frac(s => !!s.vida.fatos['mudou_por_trabalho'] || bio(s, /para estudar|atrás de trabalho|proposta de trabalho/))}`);
log('');
log('## Atividades');
log(`- vidas com alguma atividade na infância (6–11): ${frac(s => s.vida.caminhos.marcas.some(m => m.tipo === 'comecou' && (m.t - s.vida.eu.tNasc) / 12 <= 11) || Object.values(s.vida.caminhos.frentes).some(f => f && (f.tInicio - s.vida.eu.tNasc) / 12 <= 11 && f.meses >= 6 && !['exatas', 'linguagens', 'ciencias', 'humanas'].includes('')))}`);
log(`- atividade mantida 5+ anos: ${frac(s => Object.entries(s.vida.caminhos.frentes).some(([d, f]) => f && !['exatas', 'linguagens', 'ciencias', 'humanas'].includes(d) && f.meses >= 36))}`);
log(`- retomou algo parado: ${frac(s => marca(s, 'retomada'))}`);
log('');
log('## Esporte e arte');
const esp = (s: VidaSim) => !!s.vida.fatos['peneiras_futebol'] || Object.keys(s.vida.fatos).some(k => k.startsWith('peneiras_'));
log(`- tentou peneira/seletiva: ${frac(esp)} · entrou numa base: ${frac(s => marca(s, 'ingresso', m => !!m.dominio && ['futebol', 'volei', 'natacao', 'atletismo', 'lutas'].includes(m.dominio)))} · virou profissional: ${frac(s => !!s.vida.fatos['atleta_profissional'])}`);
for (const p of ['esportista', 'persistente']) { const vs = todas.filter(s => s.perfil === p); log(`  · ${p}: peneira ${frac(esp, vs)} · base ${frac(s => marca(s, 'ingresso', m => !!m.dominio && ['futebol', 'volei', 'natacao', 'atletismo', 'lutas'].includes(m.dominio)), vs)} · profissional ${frac(s => !!s.vida.fatos['atleta_profissional'], vs)}`); }
const naoEsp = todas.filter(s => !['esportista', 'persistente'].includes(s.perfil));
log(`  · outros perfis: profissional ${frac(s => !!s.vida.fatos['atleta_profissional'], naoEsp)}`);
log(`- tentativa artística (banda/grupo): ${frac(s => marca(s, 'ingresso', m => !!m.dominio && ['musica', 'teatro', 'danca'].includes(m.dominio)))} · viveu de arte: ${frac(s => !!s.vida.fatos['artista_profissional'])} · arte como hobby por 20+ anos: ${frac(s => ['musica', 'teatro', 'danca', 'desenho', 'escrita', 'fotografia'].some(d => (s.vida.caminhos.frentes[d as 'musica']?.meses ?? 0) >= 120))}`);
{ const vs = todas.filter(s => s.perfil === 'artista'); log(`  · artista: banda/grupo ${frac(s => marca(s, 'ingresso', m => !!m.dominio && ['musica', 'teatro', 'danca'].includes(m.dominio)), vs)} · profissional ${frac(s => !!s.vida.fatos['artista_profissional'], vs)}`); }
log('');
log('## Concurso');
log(`- prestou concurso: ${frac(s => s.vida.caminhos.concurso.tentativas > 0)} · aprovado: ${frac(s => s.vida.caminhos.concurso.aprovacoes > 0)} · aprovado sem ter estudado (preparo 0 na prova): ${frac(s => s.vida.biografia.some(b => /Aprovad[oa] no concurso/.test(b.texto)) && !s.vida.caminhos.marcas.some(() => true) )}`);
{ const vs = todas.filter(s => s.perfil === 'concurseiro' || s.perfil === 'persistente'); const tent = vs.map(s => s.vida.caminhos.concurso.tentativas); log(`  · concurseiro/persistente: tentativas mediana ${pct(tent, 0.5)} · aprovado ${frac(s => s.vida.caminhos.concurso.aprovacoes > 0, vs)}`); }
const aprovados = new Map<string, number>();
for (const s of todas) for (const m of s.vida.caminhos.marcas) if (m.tipo === 'aprovacao' && m.ocupacaoId) aprovados.set(m.ocupacaoId, (aprovados.get(m.ocupacaoId) ?? 0) + 1);
log(`  · aprovações por cargo: ${[...aprovados.entries()].sort((a, b) => b[1] - a[1]).map(([k, x]) => `${k} ${x}`).join(' · ')}`);
log('');
log('## Diversidade profissional (aos 35)');
const aos = (i: number) => todas.map(s => s.fotos.find(f => f.idade === i)).filter((f): f is Foto => !!f);
const f35 = aos(35);
const cont = (fs: Foto[], k: keyof Foto) => { const m = new Map<string, number>(); for (const f of fs) m.set(String(f[k]), (m.get(String(f[k])) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
const ocs35 = cont(f35.filter(f => !f.ocupacao.startsWith('sem') && !f.ocupacao.startsWith('estud')), 'ocupacao');
const trabalhando35 = ocs35.reduce((s, [, x]) => s + x, 0);
log(`- ocupações distintas: ${ocs35.length} entre ${trabalhando35} trabalhando · a mais comum: ${ocs35[0]?.[0]} (${Math.round(100 * (ocs35[0]?.[1] ?? 0) / Math.max(1, trabalhando35))}%) · as 5 mais comuns somam ${Math.round(100 * ocs35.slice(0, 5).reduce((s, [, x]) => s + x, 0) / Math.max(1, trabalhando35))}%`);
log(`- top 15: ${ocs35.slice(0, 15).map(([k, x]) => `${k} ${x}`).join(' · ')}`);
log(`- setores: ${cont(f35, 'setor').map(([k, x]) => `${k} ${x}`).join(' · ')}`);
const todasOcs = new Set(todas.flatMap(s => [...s.vida.trabalho.historico, ...(s.vida.trabalho.atual ? [s.vida.trabalho.atual] : [])].map(h => h.ocupacaoId).concat(s.vida.caminhos.marcas.map(m => m.ocupacaoId ?? '').filter(Boolean))));
const nunca = OCUPACOES.filter(oc => !todasOcs.has(oc.id)).map(oc => oc.id);
log(`- ocupações exercidas por alguém em algum momento: ${todasOcs.size}/${OCUPACOES.length} · nunca apareceram (${nunca.length}): ${nunca.join(', ')}`);
log(`- trajetórias sem faculdade que chegaram aos 35 trabalhando: ${frac(s => { const f = s.fotos.find(x => x.idade === 35); return !!f && !f.ocupacao.startsWith('sem') && !s.vida.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= 2); }, todas.filter(s => s.fotos.some(f => f.idade === 35)))}`);
log(`- sem faculdade, aos 35: ${cont(f35.filter(f => !['superior', 'pos', 'mestrado', 'doutorado'].includes(f.escolaridade)), 'setor').map(([k, x]) => `${k} ${x}`).join(' · ')}`);
log('');
log('## Por jeito de viver (aos 35)');
for (const p of PERFIS) {
  const vs = todas.filter(s => s.perfil === p.nome);
  const fs = vs.map(s => s.fotos.find(f => f.idade === 35)).filter((f): f is Foto => !!f);
  log(`- ${p.nome}: superior ${frac(s => s.vida.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= 2), vs)} · técnico ${frac(s => s.vida.educacao.concluidos.some(c => c.nivel === 'tecnico'), vs)} · ocupações ${new Set(fs.map(f => f.ocupacao)).size}/${fs.length}: ${cont(fs, 'ocupacao').slice(0, 5).map(([k, x]) => `${k} ${x}`).join(', ')}`);
}
log('');
log('## Coerência');
const tipos = new Map<string, { n: number; ex: string }>();
for (const s of todas) for (const x of s.violacoes) { const k = x.replace(/^\d+: /, '').replace(/\d+/g, '#'); const t = tipos.get(k) ?? { n: 0, ex: `[${s.perfil} ${s.semente}] ${x}` }; t.n++; tipos.set(k, t); }
log(tipos.size ? [...tipos.entries()].sort((a, b) => b[1].n - a[1].n).map(([k, t]) => `- ${t.n}× ${k} — ${t.ex}`).join('\n') : '- nenhuma violação');
const senRecem = todas.reduce((acc, s) => acc + s.vida.educacao.concluidos.filter(c => c.nivel === 'superior').filter(c => [...s.vida.trabalho.historico, ...(s.vida.trabalho.atual ? [s.vida.trabalho.atual] : [])].some(h => h.tInicio >= c.tFim && h.tInicio <= c.tFim + 24 && ocupacao(h.ocupacaoId).nivel >= 4 && !ocupacao(h.ocupacaoId).concurso && ocupacao(h.ocupacaoId).nivelCurso !== 'residencia' && !ocupacao(h.ocupacaoId).entrada && (s.vida.trabalho.experiencia[ocupacao(h.ocupacaoId).trilha] ?? 0) < 36)).length, 0);
log(`- recém-formados em cargo experiente sem estrada (até 2 anos depois do diploma, nível 4+, fora de concurso/residência): ${senRecem}`);
const semCaminho = todas.reduce((s, x) => s + x.anosSemCaminho, 0), totAd = todas.reduce((s, x) => s + x.anosAdultos, 0);
log(`- anos adultos (22–60) sem nenhum acontecimento de estudo/trabalho: ${Math.round(100 * semCaminho / Math.max(1, totAd))}% · sem nada de caminho nem de atividade (lazer incluído): ${Math.round(100 * todas.reduce((s, x) => s + x.anosSemNada, 0) / Math.max(1, totAd))}%`);
const semanaOk = todas.every(s => { const w = semana(s.vida); return Number.isFinite(w.capacidade) && w.capacidade >= 0.5; });
log(`- semana coerente ao fim de todas as vidas: ${semanaOk ? 'sim' : 'NÃO'}`);
log('');
log('## Diversidade com a mesma semente (5 primeiras sementes, cada jeito de viver)');
for (let k = 0; k < Math.min(5, VIDAS); k++) {
  const semente = 1000 + k * 7919;
  log(`### semente ${semente} (${nomeLugar(MUNICIPIOS[semente % MUNICIPIOS.length].id)})`);
  for (const s of todas.filter(x => x.semente === semente)) log(`- ${s.perfil.padEnd(13)} ${[18, 25, 35, 50, 65].map(i => { const f = s.fotos.find(x => x.idade === i); return f ? `${i}: ${f.ocupacao}` : `${i}: —`; }).join(' | ')}`);
}

writeFileSync(`${SAIDA}/resumo.md`, out.join('\n'));
for (const s of todas.filter((_, k) => k % Math.max(1, Math.floor(VIDAS / 3)) === 0)) writeFileSync(`${SAIDA}/vida-${s.perfil}-${s.semente}.md`, biografia(s));
console.log(`\nbiografias em ${SAIDA}`);
void ROTULO_TRILHA;
