/**
 * Simulador dos CAMINHOS DE VIDA (auditoria e expansão).
 *
 *   npx esbuild scripts/sim/trajetorias.ts --bundle --platform=node --outfile=/tmp/traj.cjs
 *   VIDAS=20 SAIDA=/tmp/traj node /tmp/traj.cjs
 *
 * Dezessete jeitos de tentar viver — acadêmico, técnico, ofício, informal,
 * servidor, militar, segurança, artista, atleta, empreendedor, autônomo,
 * rural, cuidador, envolvimento ilegal (dois: quem persiste e quem sai),
 * convencional, mudança tardia, pouco engajado. Cada estratégia só escolhe
 * entre o que o motor oferece (`disponibilidade`): não força sucesso.
 *
 * Mede famílias de carreira, concentração, ocupações nunca alcançadas,
 * funis (militar, segurança, crime, cuidado, campo, arte, esporte), segunda
 * carreira, e procura biografias-exemplo das vinte histórias pedidas.
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
import { OCUPACOES, ocupacao, type Ocupacao } from '../../src/motor/dados/ocupacoes';
import { ORDEM_NIVEL, cursoOuNulo } from '../../src/motor/dados/cursos';
import { familiaDaTrilha, FAMILIAS } from '../../src/motor/dados/carreiras';
import { interacoesPara } from '../../src/motor/sistemas/interacoes';
import { moraComFamiliaDeOrigem } from '../../src/motor/sistemas/domicilio';
import { saldoMensal, patrimonio } from '../../src/motor/sistemas/dinheiro';
import { editaisAbertos } from '../../src/motor/sistemas/concurso';
import { negociosPossiveis } from '../../src/motor/sistemas/negocio';
import { capitalDoEstado, ROTULO_ESCOLARIDADE } from '../../src/motor/sistemas/escola';
import { porContaPropria } from '../../src/motor/sistemas/trabalho';

const VIDAS = Number(process.env.VIDAS ?? 20);
const SAIDA = process.env.SAIDA ?? '/tmp/traj';
mkdirSync(SAIDA, { recursive: true });

interface Perfil {
  nome: string;
  atividades: [string, number, number][];
  postura: Vida['educacao']['postura'];
  estudo: 'superior' | 'tecnico' | 'qualificacao' | 'nenhum' | 'tardio';
  areas?: string[];
  cursos?: string[];
  concursos?: string[];
  setores: string[];
  preferir?: string[];
  aceita: string[];
  empreende?: boolean;
  mudaCidade?: boolean;
  preferencias: string[];
  /** Onde nasce (perfil de município), para caminhos que dependem do lugar. */
  lugar?: 'interior' | 'litoral' | 'grande';
  cnh?: boolean;
  trabalhaCedo?: boolean;
  passivo?: boolean;
}

const P = (x: Perfil) => x;
const PERFIS: Perfil[] = [
  P({ nome: 'academico', atividades: [['leitura', 7, 1], ['clube_ciencias', 10, 1], ['ingles', 10, 2]], postura: 'dedicada', estudo: 'superior', cursos: ['medicina', 'direito', 'computacao', 'eng_civil', 'enfermagem', 'psicologia', 'mestrado', 'doutorado'], setores: ['saude', 'tecnologia', 'juridico', 'engenharia', 'educacao'], aceita: ['bolsa', 'estagio', 'proposta', 'vaga'], mudaCidade: true, preferencias: ['recusar_proposta', 'enem', 'atualizar', 'fazer', 'procurar', 'estudar', 'ficar', 'publica', 'seguir', 'guardar', 'aceitar', 'voltar'] }),
  P({ nome: 'tecnico', atividades: [['consertar', 12, 1], ['programacao', 12, 1]], postura: 'dedicada', estudo: 'tecnico', setores: ['industria', 'tecnologia', 'manutencao', 'saude', 'construcao'], aceita: ['selecao_tecnico', 'estagio', 'aprendiz', 'proposta', 'indicacao', 'vaga'], preferencias: ['recusar_proposta', 'curso0', 'curso1', 'atualizar', 'tecnico', 'estudar', 'ficar', 'aceitar', 'voltar'] }),
  P({ nome: 'oficio', atividades: [['consertar', 11, 1], ['ajudar_familia', 12, 2]], postura: 'normal', estudo: 'qualificacao', cursos: ['q_eletricista', 'q_mecanica', 'q_solda'], setores: ['manutencao', 'construcao'], preferir: ['eletricista', 'encanador', 'marceneiro', 'mecanico', 'pedreiro', 'pintor', 'tecnico_refrigeracao'], aceita: ['clientela', 'indicacao', 'aprendiz', 'temporario', 'vaga'], empreende: true, preferencias: ['recusar_proposta', 'atualizar', 'conta', 'aceitar', 'formalizar', 'insistir', 'voltar'], trabalhaCedo: true }),
  P({ nome: 'informal', atividades: [['bico', 16, 1]], postura: 'relaxada', estudo: 'nenhum', setores: ['comercio'], preferir: ['ambulante', 'feirante', 'catador', 'diarista', 'entregador_app'], aceita: ['temporario', 'clientela', 'indicacao'], preferencias: ['recusar_proposta', 'formalizar', 'qualquer', 'conta', 'aceitar', 'seguir'], trabalhaCedo: true }),
  P({ nome: 'servidor', atividades: [['leitura', 8, 1]], postura: 'dedicada', estudo: 'superior', cursos: ['direito', 'administracao', 'contabeis', 'pedagogia', 'licenciatura'], concursos: ['tecnico_publico', 'analista_judiciario', 'auditor_fiscal', 'professor_concursado', 'escriturario_banco', 'agente_saude', 'professor_substituto'], setores: ['publico', 'educacao', 'administrativo'], aceita: ['estagio', 'vaga'], preferencias: ['recusar_proposta', 'concurso', 'enem', 'aceitar', 'estudar', 'ficar', 'recusar', 'atualizar', 'procurar'] }),
  P({ nome: 'militar', atividades: [['futebol', 6, 1], ['corrida', 13, 1], ['academia', 16, 1]], postura: 'dedicada', estudo: 'nenhum', concursos: ['aluno_sargento', 'cadete', 'aluno_oficial_tecnico'], setores: ['seguranca'], aceita: ['vaga', 'indicacao'], preferencias: ['recusar_proposta', 'servir', 'carreira', 'engajar', 'fazer', 'familia', 'comba', 'manutencao', 'segunda', 'voltar', 'aceitar'] }),
  P({ nome: 'seguranca', atividades: [['corrida', 13, 1], ['lutas', 10, 1], ['academia', 16, 1]], postura: 'normal', estudo: 'nenhum', concursos: ['aluno_pm', 'aluno_bombeiro', 'guarda_municipal', 'policial_penal', 'policial_civil'], setores: ['seguranca'], preferir: ['vigilante'], cursos: ['q_vigilante'], aceita: ['vaga', 'indicacao'], cnh: true, preferencias: ['recusar_proposta', 'tanto_faz', 'aceitar', 'fazer', 'estudar', 'ficar', 'procurar'] }),
  P({ nome: 'artista', atividades: [['musica', 7, 2], ['teatro', 10, 1], ['desenho', 6, 1], ['escrever', 12, 1]], postura: 'normal', estudo: 'nenhum', setores: ['criativo', 'comunicacao', 'educacao'], preferir: ['musico_noite', 'professor_musica', 'ilustrador', 'tatuador', 'atendente'], aceita: ['banda', 'grupo', 'convite', 'clientela', 'retomar', 'vaga'], mudaCidade: true, preferencias: ['recusar_proposta', 'entrar', 'inscrever', 'aceitar', 'antiga', 'mudar', 'guardar'] }),
  P({ nome: 'atleta', atividades: [['futebol', 5, 2], ['academia', 16, 1]], postura: 'normal', estudo: 'nenhum', setores: ['esporte', 'comercio'], aceita: ['peneira', 'seletiva', 'convite', 'indicacao', 'vaga'], mudaCidade: true, preferencias: ['recusar_proposta', 'p0', 'p1', 'ir', 'assinar', 'tentar', 'treinador', 'comissao', 'preparo', 'aceitar'] }),
  P({ nome: 'empreendedor', atividades: [['cozinhar', 11, 1], ['cortar_cabelo', 13, 1]], postura: 'normal', estudo: 'qualificacao', cursos: ['q_cozinha', 'q_cabeleireiro', 'q_confeitaria'], setores: ['comercio', 'alimentacao', 'beleza'], aceita: ['clientela', 'temporario', 'indicacao', 'vaga'], empreende: true, preferencias: ['recusar_proposta', 'mudar', 'insistir', 'conta', 'formalizar', 'aceitar', 'atualizar'] }),
  P({ nome: 'autonomo', atividades: [['fotografia', 13, 1], ['desenho', 8, 1], ['programacao', 12, 1]], postura: 'normal', estudo: 'nenhum', setores: ['criativo', 'tecnologia'], preferir: ['fotografo', 'ilustrador', 'tatuador', 'suporte_ti'], aceita: ['clientela', 'indicacao', 'vaga'], empreende: true, preferencias: ['recusar_proposta', 'formalizar', 'atualizar', 'conta', 'aceitar'] }),
  P({ nome: 'rural', atividades: [['ajudar_familia', 12, 2]], postura: 'normal', estudo: 'tecnico', cursos: ['tec_agropecuaria', 'agronomia'], setores: ['agro'], preferir: ['trabalhador_rural', 'operador_maquinas', 'tecnico_agricola', 'pescador'], aceita: ['convite', 'temporario', 'indicacao', 'vaga'], lugar: 'interior', preferencias: ['recusar_proposta', 'cooperativa', 'entrar', 'credito', 'vista', 'diversificar', 'aguentar', 'atualizar', 'aceitar'] }),
  P({ nome: 'cuidador', atividades: [['igreja', 3, 1], ['cozinhar', 12, 1]], postura: 'normal', estudo: 'tecnico', cursos: ['tec_enfermagem'], setores: ['saude', 'cuidado', 'educacao'], preferir: ['cuidador', 'tec_enfermagem', 'aux_creche'], aceita: ['indicacao', 'vaga'], preferencias: ['recusar_proposta', 'parar', 'reduzir', 'trazer', 'facultativo', 'ficar', 'procurar', 'aceitar', 'sim'] }),
  P({ nome: 'crime', atividades: [['sair_noite', 18, 1]], postura: 'relaxada', estudo: 'nenhum', setores: ['comercio'], aceita: ['temporario', 'indicacao'], preferencias: ['aceitar_proposta', 'fundo', 'seguir_esquema', 'antigos', 'quieto', 'escondido', 'beber', 'puxar', 'copiar', 'revidar', 'gritar', 'qualquer', 'conta'] }),
  P({ nome: 'crime_saida', atividades: [['futebol', 7, 1]], postura: 'normal', estudo: 'qualificacao', cursos: ['q_eletricista', 'q_mecanica', 'q_cozinha'], setores: ['manutencao', 'comercio', 'alimentacao'], aceita: ['reinsercao', 'indicacao', 'clientela', 'temporario', 'vaga'], preferencias: ['aceitar_proposta', 'parar_esquema', 'escondido', 'puxar', 'copiar', 'revidar', 'estudar', 'programa', 'os_dois', 'trabalhar', 'conta', 'qualquer', 'formalizar', 'aceitar'] }),
  P({ nome: 'convencional', atividades: [['futebol', 6, 1], ['igreja', 10, 1]], postura: 'normal', estudo: 'qualificacao', setores: ['comercio', 'administrativo', 'logistica', 'industria'], aceita: ['aprendiz', 'indicacao', 'temporario', 'proposta', 'vaga'], preferencias: ['recusar_proposta', 'voltar', 'ficar', 'seguir', 'aceitar', 'procurar', 'sim'] }),
  P({ nome: 'mudanca_tardia', atividades: [['leitura', 10, 1], ['corrida', 14, 1]], postura: 'normal', estudo: 'tardio', cursos: ['enfermagem', 'pedagogia', 'ads', 'direito', 'tec_enfermagem', 'tec_informatica', 'psicologia'], setores: ['comercio', 'administrativo', 'logistica'], aceita: ['vaga', 'indicacao', 'estagio', 'proposta'], preferencias: ['recusar_proposta', 'estudar', 'vizinha', 'mudar', 'concurso', 'aceitar', 'procurar'] }),
  P({ nome: 'volta_estudos', atividades: [['futebol', 6, 1]], postura: 'relaxada', estudo: 'tardio', cursos: ['tec_enfermagem', 'tec_informatica', 'tec_administracao', 'pedagogia', 'enfermagem', 'ads'], setores: ['comercio', 'alimentacao', 'logistica'], aceita: ['aprendiz', 'temporario', 'indicacao', 'vaga'], trabalhaCedo: true, preferencias: ['recusar_proposta', 'trabalhar', 'estudar', 'aceitar', 'voltar', 'procurar'] }),
  P({ nome: 'tentado', atividades: [['sair_noite', 18, 1]], postura: 'normal', estudo: 'superior', cursos: ['administracao', 'contabeis', 'economia'], setores: ['administrativo', 'financas'], preferir: ['analista_adm', 'analista_financeiro', 'contador', 'assistente_adm'], aceita: ['estagio', 'indicacao', 'proposta', 'vaga'], preferencias: ['aceitar_proposta', 'seguir_esquema', 'parar_esquema', 'aceitar', 'enem', 'publica', 'programa'] }),
  P({ nome: 'pouco_engajado', atividades: [['videogame', 6, 1]], postura: 'relaxada', estudo: 'nenhum', setores: [], aceita: [], preferencias: [], passivo: true })
];

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

function escolher(m: Momento, r: Rng, p: Perfil): string {
  const livres = m.opcoes.filter(o => !o.bloqueio);
  for (const x of p.preferencias) {
    const o = livres.find(y => y.id === x || y.id.startsWith(x));
    if (o) return o.id;
  }
  if (p.passivo && livres.length) return livres[livres.length - 1].id;
  return r.pick(livres.length ? livres : m.opcoes).id;
}

function agir(v: Vida, r: Rng, p: Perfil): Acao[] {
  const i = idade(v);
  const out: Acao[] = [];
  if (p.passivo && r.chance(0.6)) return out;
  if ((v.educacao.basica || v.educacao.matricula) && v.educacao.postura !== p.postura && i >= 7) out.push({ tipo: 'postura', valor: p.postura });
  for (const [id, min, nivel] of p.atividades) {
    if (i < min) continue;
    const atual = v.rotinas.find(x => x.id === id);
    if (!atual) { if (tenta(v, { tipo: 'rotina', id, ativa: true, nivel: 1 })) out.push({ tipo: 'rotina', id, ativa: true, nivel: 1 }); }
    else if ((atual.nivel ?? 1) < nivel && i >= min + 2 && tenta(v, { tipo: 'rotina', id, ativa: true, nivel: ((atual.nivel ?? 1) + 1) as 2 | 3 })) out.push({ tipo: 'rotina', id, ativa: true, nivel: ((atual.nivel ?? 1) + 1) as 2 | 3 });
  }
  for (const o of v.caminhos.oportunidades) if (p.aceita.includes(o.tipo) && tenta(v, { tipo: 'oportunidade', id: o.id, aceitar: true })) { out.push({ tipo: 'oportunidade', id: o.id, aceitar: true }); break; }
  if (p.cnh && i >= 18 && !v.trabalho.licencas.includes('cnh') && tenta(v, { tipo: 'cnh' })) out.push({ tipo: 'cnh' });

  // Concursos (inclui as carreiras militares e de segurança).
  const servidor = v.trabalho.atual && /servidor|militar/.test(v.trabalho.atual.contrato);
  if (p.concursos && i >= 17 && i <= 50 && !servidor) {
    if (!v.rotinas.some(x => x.id === 'estudar_concurso')) {
      if (tenta(v, { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 2 })) out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 2 });
      else if (tenta(v, { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 1 })) out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 1 });
    }
    for (const oc of editaisAbertos(v).filter(x => p.concursos!.includes(x.id))) if (tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })) { out.push({ tipo: 'candidatar', ocupacaoId: oc.id }); break; }
  }
  if (servidor && v.rotinas.some(x => x.id === 'estudar_concurso') && p.nome !== 'servidor') out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: false });

  // Estudo.
  const temSup = v.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= 2);
  const temTec = v.educacao.concluidos.some(c => c.nivel === 'tecnico');
  const temQ = v.educacao.concluidos.some(c => c.nivel === 'livre');
  if ((p.estudo === 'superior' || (p.estudo === 'tardio' && i >= 32)) && i >= 17 && !v.educacao.matricula && !temSup && tenta(v, { tipo: 'enem' })) out.push({ tipo: 'enem' });
  if (!v.educacao.matricula && i >= 15 && i <= 55) {
    const quer = (o: ReturnType<typeof opcoesDeCurso>[number]) => {
      const n = o.curso.nivel;
      if (p.cursos?.includes(o.curso.id)) return (n === 'livre' && !temQ) || (n === 'tecnico' && !temTec && i >= 16) || (n === 'superior' && !temSup && (p.estudo !== 'tardio' || i >= 32)) || ((n === 'mestrado' || n === 'doutorado') && temSup && i < 38);
      if (p.estudo === 'superior') return n === 'superior' && !temSup && i >= 17;
      if (p.estudo === 'tecnico') return n === 'tecnico' && !temTec && i >= 16;
      if (p.estudo === 'qualificacao') return n === 'livre' && !temQ && i >= 16;
      if (p.estudo === 'tardio') return i >= 32 && ((n === 'tecnico' && !temTec) || (n === 'superior' && !temSup));
      return false;
    };
    const ops = opcoesDeCurso(v).map((o, idx) => ({ o, idx })).filter(x => podeTentar(x.o.veredito) && quer(x.o) && v.fatos[`tentou_${x.o.curso.id}_${Math.floor(v.t / 12)}`] === undefined)
      .filter(x => x.o.mensalidade <= Math.max(600, saldoMensal(v).renda * 0.3) || ['sisu', 'prouni', 'fies', 'selecao_publica'].includes(x.o.via))
      .filter(x => x.o.municipioId === v.moradia.municipioId || x.o.modalidade === 'ead' || p.mudaCidade);
    const nota = (x: typeof ops[number]) => (p.cursos?.includes(x.o.curso.id) ? 5 : 0) + ({ sisu: 4, selecao_publica: 4, prouni: 3, fies: 2, ead: 1.5, privada: 1.5 } as Record<string, number>)[x.o.via] + (x.o.veredito.chance ?? 0) * 2 + r.next();
    const melhor = ops.sort((a, b) => nota(b) - nota(a))[0];
    if (melhor) out.push({ tipo: 'matricular', indice: melhor.idx });
  }

  // Trabalho.
  const sem = !v.trabalho.atual && !v.trabalho.aposentadoria && !v.trabalho.pausa && !v.justica?.prisao;
  const pode = i >= 16 && (i >= 18 || p.trabalhaCedo) && !(v.educacao.matricula && ORDEM_NIVEL[cursoOuNulo(v.educacao.matricula.cursoId)?.nivel ?? 'livre'] >= 2 && cursoOuNulo(v.educacao.matricula.cursoId)?.carga === 'integral' && i < 23);
  const esporte = v.caminhos.esporte?.fase === 'base' || v.caminhos.esporte?.fase === 'profissional';
  if (sem && pode && !esporte && !(p.concursos && i < 22 && v.educacao.matricula)) {
    const vagas = OCUPACOES.filter(oc => !oc.concurso && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id }));
    const pts = (oc: Ocupacao) => (p.preferir?.includes(oc.id) ? 10 : 0) + (p.setores.includes(oc.setor) ? 6 : 0) + oc.nivel + (disponibilidade(v, { tipo: 'candidatar', ocupacaoId: oc.id }).chance ?? 0.5) * 4 + r.next() * 2;
    const alvo = vagas.sort((a, b) => pts(b) - pts(a))[0];
    if (alvo) out.push({ tipo: 'candidatar', ocupacaoId: alvo.id });
  }
  if (p.empreende && i >= 22 && i <= 60) { const n = negociosPossiveis(v).filter(x => x.veredito.grau === 'permitido').sort((a, b) => b.custo - a.custo)[0]; if (n) out.push({ tipo: 'abrir_negocio', negocio: n.t.id }); }
  if (tenta(v, { tipo: 'mei' }) && (p.nome === 'informal' || p.nome === 'oficio' || p.nome === 'autonomo') && r.chance(0.3)) out.push({ tipo: 'mei' });
  if (p.nome === 'cuidador' && v.trabalho.pausa?.intensidade === 'total' && tenta(v, { tipo: 'facultativo', ativo: true })) out.push({ tipo: 'facultativo', ativo: true });
  if (p.nome === 'crime_saida' && tenta(v, { tipo: 'parar_por_fora' }) && v.caminhos.envolvimento && v.t - v.caminhos.envolvimento.tInicio >= 12) out.push({ tipo: 'parar_por_fora' });
  if (p.nome === 'mudanca_tardia' && i >= 40 && i <= 50 && v.trabalho.atual && r.chance(0.2)) { const alvo = OCUPACOES.filter(oc => !oc.concurso && oc.trilha !== ocupacao(v.trabalho.atual!.ocupacaoId).trilha && !porContaPropria(oc) && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })).sort((a, b) => b.nivel - a.nivel)[0]; if (alvo) out.push({ tipo: 'candidatar', ocupacaoId: alvo.id }); }
  if (p.mudaCidade && i >= 19 && i <= 30 && nivelDeOferta(v.moradia.municipioId) <= 1 && !v.fatos['mudou_de_cidade'] && r.chance(0.3)) { const d = capitalDoEstado(v.moradia.municipioId); if (tenta(v, { tipo: 'mudar_cidade', municipioId: d })) out.push({ tipo: 'mudar_cidade', municipioId: d }); }
  if (tenta(v, { tipo: 'aposentar' }) && i >= 64) out.push({ tipo: 'aposentar' });
  // Vida social mínima (família existe e compete por tempo).
  const par = parceiro(v);
  if (par) { const x = interacoesPara(v, par.p.id).find(y => ['apoiar', 'relacao', 'sair_juntos'].includes(y.id)); if (x) out.push({ tipo: 'pessoa', pessoaId: par.p.id, interacao: x.id }); }
  for (const f of filhos(v)) if (r.chance(0.5)) { const x = interacoesPara(v, f.id).find(y => ['apoiar', 'cuidar', 'brincar', 'estudos', 'conversar'].includes(y.id)); if (x) out.push({ tipo: 'pessoa', pessoaId: f.id, interacao: x.id }); }
  if (!p.passivo) {
    for (const x of vinculosVivos(v)) {
      const rom = x.vin.romance;
      if (!rom || rom.secreto) continue;
      if (rom.estagio === 'saindo') out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'pedir_namoro' });
      if (rom.estagio === 'namoro' && i >= 23) out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'morar_junto' });
      if ((rom.estagio === 'namoro' || rom.estagio === 'morando_junto') && i >= 26) out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'pedir_casamento' });
    }
    if (!par && i >= 18 && r.chance(0.35)) { const alvo = vinculosVivos(v).find(x => !x.vin.parentesco && !x.vin.romance && (x.vin.estagio === 'amigo' || x.vin.estagio === 'colega')); if (alvo) out.push({ tipo: 'pessoa', pessoaId: alvo.p.id, interacao: 'convidar' }); }
    if (par && i >= 25 && i <= 40 && filhos(v).length < 2) out.push({ tipo: 'pessoa', pessoaId: par.p.id, interacao: 'planejar_filhos' });
    if (par && filhos(v).length >= 2) out.push({ tipo: 'pessoa', pessoaId: par.p.id, interacao: 'evitar_filhos' });
  }
  if (moraComFamiliaDeOrigem(v) && i >= 23 && v.trabalho.atual) { const alvo = opcoesDeAluguel(v).filter(o => podeTentar(o.veredito)).sort((a, b) => a.aluguel - b.aluguel)[0]; if (alvo) out.push({ tipo: 'sair_de_casa', modeloId: alvo.m.id }); }
  return out;
}

/* ---------------------------------------------------------------- Simular */

interface VidaSim { desempregoMax: number; semente: number; perfil: string; vida: Vida; fotos: Record<number, string>; familias: Record<number, string>; renda: Record<number, number>; patrimonio: Record<number, number>; anosPresos: number; anosAdultos: number; violacoes: string[] }

const INTERIOR = MUNICIPIOS.filter(m => m.perfil === 'pequena' && ['Centro-Oeste', 'Sul', 'Norte', 'Nordeste'].includes(m.regiao));

export function simular(semente: number, p: Perfil): VidaSim {
  const r = criarRng(semente * 17 + 3);
  const m = p.lugar === 'interior' ? INTERIOR[semente % INTERIOR.length] : MUNICIPIOS[semente % MUNICIPIOS.length];
  const genero = semente % 3 === 0 ? 'feminino' : semente % 3 === 1 ? 'masculino' : (semente % 2 === 0 ? 'feminino' : 'masculino');
  let v = criarVida({ nome: 'Vida', sobrenome: 'Sim', genero, municipioId: m.id, semente });
  const fotos: Record<number, string> = {};
  const familias: Record<number, string> = {};
  const renda: Record<number, number> = {};
  const pat: Record<number, number> = {};
  const violacoes: string[] = [];
  let presos = 0, adultos = 0, guarda = 0, desempregoMax = 0;
  while (!v.morte && idade(v) < 110 && guarda++ < 120) {
    for (const a of agir(v, r, p)) {
      if (!tenta(v, a)) continue;
      v = executar(v, a).vida;
      while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: escolher(v.momento, r, p) }).vida;
    }
    v = avancarAno(v).vida;
    let k = 0;
    while (v.momento && k++ < 6) v = executar(v, { tipo: 'decidir', opcaoId: escolher(v.momento, r, p) }).vida;
    const i = idade(v);
    const e = v.trabalho.atual;
    if (i >= 18 && i <= 64) { adultos++; if (v.justica?.prisao) presos++; }
    if (!e && !v.trabalho.aposentadoria && !v.trabalho.pausa && !v.justica?.prisao && !v.educacao.matricula && v.trabalho.desempregadoDesde !== undefined && i < 62) desempregoMax = Math.max(desempregoMax, Math.floor((v.t - v.trabalho.desempregadoDesde) / 12));
    if ([20, 25, 30, 35, 40, 45, 50, 55, 60, 65].includes(i)) {
      fotos[i] = e ? e.ocupacaoId : v.justica?.prisao ? 'preso' : v.trabalho.pausa ? 'cuidando' : v.trabalho.aposentadoria ? 'aposentado' : v.educacao.matricula ? 'estudante' : 'sem_trabalho';
      familias[i] = e ? familiaDaTrilha(ocupacao(e.ocupacaoId).trilha).id : fotos[i];
      renda[i] = saldoMensal(v).renda;
      pat[i] = Math.round(patrimonio(v));
    }
    // Coerência: requisitos duros nunca furados.
    if (e) {
      const oc = ocupacao(e.ocupacaoId);
      if (oc.idoneidade && v.justica?.antecedentes.some(a => a.desfecho === 'prisao' || a.desfecho === 'alternativa') && v.justica.antecedentes.every(a => a.t > e.tInicio) === false && e.tInicio > Math.max(...v.justica.antecedentes.map(a => a.t))) violacoes.push(`${i}: ${oc.id} com antecedentes`);
      if (v.justica?.prisao?.regime === 'fechado') violacoes.push(`${i}: trabalhando (${oc.id}) em regime fechado`);
      if (oc.licenca && oc.licenca !== 'cnh' && !v.trabalho.licencas.includes(oc.licenca)) violacoes.push(`${i}: ${oc.id} sem ${oc.licenca}`);
    }
    if (v.trabalho.pausa && e && !e.reduzida) violacoes.push(`${i}: pausa total com emprego`);
  }
  return { desempregoMax, semente, perfil: p.nome, vida: v, fotos, familias, renda, patrimonio: pat, anosPresos: presos, anosAdultos: adultos, violacoes };
}

/* --------------------------------------------------------------- Biografia */

function biografia(s: VidaSim): string {
  const v = s.vida;
  const l: string[] = [];
  l.push(`# ${s.perfil} · semente ${s.semente} · ${v.eu.genero} · ${nomeLugar(v.eu.municipioNatal)} · ${v.origem.classe}`);
  l.push(`morreu aos ${idade(v)} · ${ROTULO_ESCOLARIDADE[v.educacao.escolaridade]} · empregos ${v.trabalho.historico.length + (v.trabalho.atual ? 1 : 0)} · filhos ${filhos(v).length} · INSS ${Math.floor(v.trabalho.contribuicao / 12)} anos`);
  l.push('');
  l.push('## Fotos (idade: ocupação · família · renda · patrimônio)');
  for (const i of Object.keys(s.fotos).map(Number)) l.push(`- ${i}: ${s.fotos[i]} · ${s.familias[i]} · R$ ${s.renda[i]} · R$ ${s.patrimonio[i]}`);
  l.push('');
  l.push('## Marcas');
  for (const m of v.caminhos.marcas) l.push(`- ${Math.floor((m.t - v.eu.tNasc) / 12)} [${m.tipo}${m.peso === 3 ? '★' : ''}] ${m.texto}`);
  l.push('');
  l.push('## Linha da Vida (biografia e marcos)');
  let ant = -1;
  for (const e of v.biografia) {
    if (e.relevancia === 'tecnico' || e.relevancia === 'cotidiano') continue;
    const cab = e.idade !== ant ? String(e.idade).padStart(3) : '   ';
    ant = e.idade;
    l.push(`${cab} ${e.relevancia === 'marco' ? '★' : '–'} ${e.escolha ? '[escolha] ' : ''}${e.texto}`);
  }
  if (s.violacoes.length) { l.push(''); l.push('## Violações'); for (const x of s.violacoes) l.push(`- ${x}`); }
  return l.join('\n');
}

/* ---------------------------------------------------------------- Rodar */

if (process.env.SEMENTE) {
  const p = PERFIS.find(x => x.nome === process.env.PERFIL) ?? PERFIS[0];
  console.log(biografia(simular(Number(process.env.SEMENTE), p)));
  process.exit(0);
}
const soPerfis = process.env.PERFIS?.split(',');
const todas: VidaSim[] = [];
for (const p of PERFIS.filter(x => !soPerfis || soPerfis.includes(x.nome))) for (let k = 0; k < VIDAS; k++) todas.push(simular(2000 + k * 7919, p));

const out: string[] = [];
const log = (s = '') => { out.push(s); console.log(s); };
const frac = (f: (s: VidaSim) => boolean, vs = todas) => `${vs.filter(f).length}/${vs.length} (${Math.round(100 * vs.filter(f).length / Math.max(1, vs.length))}%)`;
const pct = (a: number[], q: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : 0; };
const media = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const marca = (s: VidaSim, tipo: string, f?: (m: Vida['caminhos']['marcas'][number]) => boolean) => s.vida.caminhos.marcas.some(m => m.tipo === tipo && (!f || f(m)));
const bio = (s: VidaSim, re: RegExp) => s.vida.biografia.some(b => re.test(b.texto));
const empregos = (s: VidaSim) => [...s.vida.trabalho.historico, ...(s.vida.trabalho.atual ? [s.vida.trabalho.atual] : [])];
const idadeEm = (s: VidaSim, t: number) => Math.floor((t - s.vida.eu.tNasc) / 12);
const porPerfil = (nome: string) => todas.filter(s => s.perfil === nome);

log(`# Caminhos de vida — ${todas.length} vidas (${new Set(todas.map(s => s.perfil)).size} estratégias × ${VIDAS})`);
log('');
log('## Diversidade de famílias de carreira');
for (const i of [25, 35, 50]) {
  const m = new Map<string, number>();
  for (const s of todas) if (s.familias[i]) m.set(s.familias[i], (m.get(s.familias[i]) ?? 0) + 1);
  const tot = [...m.values()].reduce((a, b) => a + b, 0);
  const trab = [...m.entries()].filter(([k]) => FAMILIAS.some(f => f.id === k));
  const tt = trab.reduce((a, [, x]) => a + x, 0);
  const hhi = trab.reduce((a, [, x]) => a + (x / Math.max(1, tt)) ** 2, 0);
  log(`- aos ${i}: ${[...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, x]) => `${k} ${x}`).join(' · ')} (total ${tot})`);
  log(`  · famílias com alguém trabalhando: ${trab.length}/${FAMILIAS.length} · concentração (HHI) ${hhi.toFixed(3)} · maior fatia ${Math.round(100 * Math.max(0, ...trab.map(([, x]) => x)) / Math.max(1, tt))}%`);
}
const exercidas = new Set(todas.flatMap(s => empregos(s).map(h => h.ocupacaoId)));
const nunca = OCUPACOES.filter(oc => !exercidas.has(oc.id)).map(oc => oc.id);
log(`- ocupações exercidas por alguém: ${exercidas.size}/${OCUPACOES.length} · nunca (${nunca.length}): ${nunca.join(', ')}`);
const top = new Map<string, number>();
for (const s of todas) for (const h of empregos(s)) top.set(h.ocupacaoId, (top.get(h.ocupacaoId) ?? 0) + 1);
log(`- ocupações mais frequentes (qualquer momento): ${[...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, x]) => `${k} ${x}`).join(' · ')}`);
log('');
log('## Trabalho, formação e trajetória');
const primeiro = todas.map(s => empregos(s)[0]).filter(Boolean).map((h, k) => idadeEm(todas[k], h!.tInicio));
log(`- idade do primeiro trabalho: mediana ${pct(primeiro, 0.5)} · p10 ${pct(primeiro, 0.1)} · p90 ${pct(primeiro, 0.9)}`);
log(`- superior completo: ${frac(s => s.vida.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= 2))} · técnico: ${frac(s => s.vida.educacao.concluidos.some(c => c.nivel === 'tecnico'))} · qualificação: ${frac(s => s.vida.educacao.concluidos.some(c => c.nivel === 'livre'))} · estudou depois dos 30: ${frac(s => s.vida.educacao.concluidos.some(c => idadeEm(s, c.tFim) >= 30 && ORDEM_NIVEL[c.nivel] <= 2))}`);
log(`- mudança de carreira (3+ anos, outro setor): ${frac(s => (s.vida.fatos['mudancas_de_carreira'] ?? 0) > 0)} · mudança depois dos 40: ${frac(s => s.vida.caminhos.marcas.some(m => m.tipo === 'mudanca_carreira' && idadeEm(s, m.t) >= 40))}`);
log(`- desemprego de 3+ anos: ${frac(s => s.desempregoMax >= 3)} · 10+: ${frac(s => s.desempregoMax >= 10)} · informal alguma vez: ${frac(s => empregos(s).some(h => h.contrato === 'informal'))} · formalizou (MEI): ${frac(s => !!s.vida.fatos['formalizou_mei'])}`);
log(`- por conta (autônomo): ${frac(s => empregos(s).some(h => h.contrato === 'autonomo'))} · negócio aberto: ${frac(s => marca(s, 'negocio_aberto'))} · fechado: ${frac(s => marca(s, 'negocio_fechado'))} · tipos de negócio: ${[...new Set(todas.filter(s => s.vida.caminhos.negocio).map(s => s.vida.caminhos.negocio!.tipo))].join(', ')}`);
log(`- servidor público alguma vez: ${frac(s => empregos(s).some(h => h.contrato === 'servidor'))} · função de chefia: ${frac(s => Object.keys(s.vida.fatos).some(k => k.startsWith('funcao_')) && marca(s, 'lideranca'))}`);
log(`- aposentou (INSS/reserva): ${frac(s => !!s.vida.trabalho.aposentadoria && !s.vida.fatos['bpc'])} · BPC: ${frac(s => !!s.vida.fatos['bpc'])} · trabalhou depois de aposentar: ${frac(s => empregos(s).some(h => h.posAposentadoria))}`);
log(`- atualizou-se numa onda do trabalho: ${frac(s => bio(s, /curso de atualização/))} · ondas vividas: ${frac(s => Object.keys(s.vida.fatos).some(k => k.startsWith('onda_')))}`);
log('');
log('## Forças Armadas');
const mil = (s: VidaSim) => !!s.vida.caminhos.militar || Object.keys(s.vida.fatos).some(k => k.startsWith('serviu_'));
log(`- serviu (qualquer quadro): ${frac(mil)} · temporário: ${frac(s => empregos(s).some(h => h.ocupacaoId === 'soldado_ep'))} · carreira de praça: ${frac(s => (s.vida.trabalho.experiencia['exercito_sargento'] ?? 0) > 0)} · oficial: ${frac(s => (s.vida.trabalho.experiencia['exercito_oficial'] ?? 0) > 0)}`);
log(`- forças: ${['exercito', 'marinha', 'aeronautica'].map(f => `${f} ${todas.filter(s => s.vida.fatos[`serviu_${f}`] !== undefined).length}`).join(' · ')} · mulheres que serviram: ${todas.filter(s => mil(s) && s.vida.eu.genero === 'feminino').length}`);
log(`- transferências por carreira (quem é de carreira): mediana ${pct(todas.filter(s => s.vida.caminhos.militar && s.vida.caminhos.militar.quadro !== 'temporario').map(s => s.vida.caminhos.militar!.transferencias), 0.5)} · reserva: ${frac(s => marca(s, 'reserva'))} · segunda carreira depois da reserva: ${frac(s => s.vida.caminhos.marcas.some(m => /Segunda carreira depois da reserva/.test(m.texto)))}`);
{ const vs = porPerfil('militar'); log(`  · perfil militar: serviu ${frac(mil, vs)} · carreira ${frac(s => !!s.vida.caminhos.militar && s.vida.caminhos.militar.quadro !== 'temporario', vs)} · baixa como temporário ${frac(s => s.vida.fatos['mil_baixa'] !== undefined, vs)} · postos finais: ${vs.map(s => s.vida.trabalho.historico.filter(h => ocupacao(h.ocupacaoId).setor === 'seguranca').pop()?.ocupacaoId ?? s.vida.trabalho.atual?.ocupacaoId ?? '—').join(' ')}`); }
log('');
log('## Segurança pública');
const segT = ['pm', 'pm_oficial', 'bombeiro', 'guarda', 'policia_civil', 'penal', 'pericia', 'federal'];
const seg = segT;
log(`- entrou: ${frac(s => segT.some(t => (s.vida.trabalho.experiencia[t] ?? 0) > 0))} · por carreira: ${segT.map(t => `${t} ${todas.filter(s => (s.vida.trabalho.experiencia[t] ?? 0) > 0).length}`).join(' · ')}`);
{ const vs = porPerfil('seguranca'); log(`  · perfil segurança: entrou ${frac(s => seg.some(t => (s.vida.trabalho.experiencia[t] ?? 0) > 0), vs)} · vigilante ${frac(s => empregos(s).some(h => h.ocupacaoId === 'vigilante'), vs)} · tentativas de concurso (mediana) ${pct(vs.map(s => s.vida.caminhos.concurso.tentativas), 0.5)}`); }
log('');
log('## Envolvimento ilegal, justiça, prisão');
const prop = (s: VidaSim) => s.vida.fatos['proposta_ilicita'] !== undefined || bio(s, /Recusou entrar|não entrou|esquema|turma/);
log(`- recebeu proposta: ${frac(s => s.vida.caminhos.ultimas['proposta_ilicita'] !== undefined)} · recusou alguma: ${frac(s => !!s.vida.fatos['recusou_ilicito'])} · entrou: ${frac(s => !!s.vida.fatos['envolveu_se'])} · saiu: ${frac(s => !!s.vida.fatos['saiu_do_esquema'])} · reincidiu: ${frac(s => !!s.vida.fatos['reincidiu'])}`);
log(`- processo: ${frac(s => !!s.vida.fatos['respondeu_processo'])} · medida socioeducativa: ${frac(s => !!s.vida.fatos['medida_socioeducativa'])} · preso: ${frac(s => !!s.vida.fatos['esteve_preso'])} · anos presos (média entre presos) ${media(todas.filter(s => s.anosPresos).map(s => s.anosPresos)).toFixed(1)} · pena alternativa: ${frac(s => !!s.vida.justica?.antecedentes.some(a => a.desfecho === 'alternativa'))}`);
log(`- depois da saída, trabalho com carteira: ${frac(s => !!s.vida.justica?.tSaida && empregos(s).some(h => h.tInicio > s.vida.justica!.tSaida! && h.contrato === 'clt'), todas.filter(s => !!s.vida.justica?.tSaida))} · por conta: ${frac(s => !!s.vida.justica?.tSaida && empregos(s).some(h => h.tInicio > s.vida.justica!.tSaida! && (h.contrato === 'autonomo' || h.contrato === 'informal')), todas.filter(s => !!s.vida.justica?.tSaida))}`);
for (const nome of ['crime', 'crime_saida']) { const vs = porPerfil(nome); log(`  · ${nome}: entrou ${frac(s => !!s.vida.fatos['envolveu_se'], vs)} · preso ${frac(s => !!s.vida.fatos['esteve_preso'], vs)} · ganhos por fora (mediana) R$ ${pct(vs.map(s => s.vida.caminhos.envolvimento?.ganhos ?? 0), 0.5)} · patrimônio aos 50 (mediana) R$ ${pct(vs.map(s => s.patrimonio[50] ?? 0), 0.5)} · renda aos 40 (mediana) R$ ${pct(vs.map(s => s.renda[40] ?? 0), 0.5)}`); }
{ const pobres = todas.filter(s => ['vulneravel', 'trabalhadora'].includes(s.vida.origem.classe) && !['crime', 'crime_saida'].includes(s.perfil)); const ricos = todas.filter(s => ['media', 'alta'].includes(s.vida.origem.classe) && !['crime', 'crime_saida'].includes(s.perfil)); log(`- proposta por origem (fora dos perfis de crime): baixa renda ${frac(s => s.vida.caminhos.ultimas['proposta_ilicita'] !== undefined, pobres)} · média/alta ${frac(s => s.vida.caminhos.ultimas['proposta_ilicita'] !== undefined, ricos)} · fraude (qualquer perfil): ${frac(s => s.vida.caminhos.envolvimento?.categoria === 'fraude')}`); }
{ const ref = porPerfil('convencional'); log(`- comparação: patrimônio aos 50 — convencional ${pct(ref.map(s => s.patrimonio[50] ?? 0), 0.5)} · crime ${pct(porPerfil('crime').map(s => s.patrimonio[50] ?? 0), 0.5)} · crime_saida ${pct(porPerfil('crime_saida').map(s => s.patrimonio[50] ?? 0), 0.5)}`); }
log('');
log('## Cuidado não remunerado');
log(`- pausou ou reduziu para cuidar: ${frac(s => (s.vida.fatos['pausas_de_cuidado'] ?? 0) > 0)} · voltou ao mercado: ${frac(s => !!s.vida.fatos['voltou_ao_mercado'])} · parceria reduziu para cuidar: ${frac(s => Object.keys(s.vida.fatos).some(k => k.startsWith('parceria_cuidou_')))} · cuidou até o fim: ${frac(s => Object.keys(s.vida.fatos).some(k => k.startsWith('cuidou_ate_o_fim_')))}`);
{ const vs = porPerfil('cuidador'); log(`  · perfil cuidador: pausou ${frac(s => (s.vida.fatos['pausas_de_cuidado'] ?? 0) > 0, vs)} · INSS (mediana de anos) ${pct(vs.map(s => Math.floor(s.vida.trabalho.contribuicao / 12)), 0.5)} vs convencional ${pct(porPerfil('convencional').map(s => Math.floor(s.vida.trabalho.contribuicao / 12)), 0.5)} · aposentou ${frac(s => !!s.vida.trabalho.aposentadoria && !s.vida.fatos['bpc'], vs)}`); }
log('');
log('## Campo');
log(`- produziu (produtor rural): ${frac(s => empregos(s).some(h => h.ocupacaoId === 'produtor_rural'))} · pescador: ${frac(s => empregos(s).some(h => h.ocupacaoId === 'pescador'))} · agro com carteira (trabalhador, operador, técnico, agrônomo): ${frac(s => empregos(s).some(h => ['trabalhador_rural', 'operador_maquinas', 'tecnico_agricola', 'agronomo', 'operador_drone', 'gerente_fazenda'].includes(h.ocupacaoId)))} · cooperativa: ${frac(s => !!s.vida.caminhos.rural?.cooperativa)} · comprou terra: ${frac(s => s.vida.financas.bens.some(b => b.modeloId === 'sitio') || bio(s, /Comprou a terra/))}`);
{ const vs = porPerfil('rural'); log(`  · perfil rural (nasce no interior): agro aos 35 ${frac(s => s.familias[35] === 'rural', vs)} · aos 50 ${frac(s => s.familias[50] === 'rural', vs)}`); }
log('');
log('## Arte e esporte');
log(`- banda/grupo: ${frac(s => marca(s, 'ingresso', m => !!m.dominio && ['musica', 'teatro', 'danca'].includes(m.dominio)))} · edital aprovado: ${frac(s => bio(s, /edital de cultura/))} · viveu de arte: ${frac(s => !!s.vida.fatos['artista_profissional'])} · arte com trabalho paralelo (20+ anos praticando): ${frac(s => ['musica', 'teatro', 'danca', 'desenho', 'escrita', 'fotografia'].some(d => (s.vida.caminhos.frentes[d as 'musica']?.meses ?? 0) >= 120) && empregos(s).some(h => familiaDaTrilha(ocupacao(h.ocupacaoId).trilha).id !== 'palco'))}`);
log(`- peneira: ${frac(s => Object.keys(s.vida.fatos).some(k => k.startsWith('peneiras_')))} · base: ${frac(s => marca(s, 'ingresso', m => !!m.dominio && ['futebol', 'volei', 'natacao', 'atletismo', 'lutas'].includes(m.dominio)))} · profissional: ${frac(s => !!s.vida.fatos['atleta_profissional'])} · depois do esporte, treinar/preparar: ${frac(s => empregos(s).some(h => ['treinador_escolinha', 'auxiliar_tecnico', 'preparador_fisico', 'instrutor_lutas', 'personal'].includes(h.ocupacaoId)))}`);
log('');
log('## Por estratégia (aos 35 e 50: família · renda mediana · patrimônio mediano)');
for (const p of PERFIS) {
  const vs = porPerfil(p.nome);
  if (!vs.length) continue;
  const fam = (i: number) => { const m = new Map<string, number>(); for (const s of vs) if (s.familias[i]) m.set(s.familias[i], (m.get(s.familias[i]) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, x]) => `${k} ${x}`).join(', '); };
  log(`- ${p.nome}: 35 → ${fam(35)} | 50 → ${fam(50)} · renda 40: ${pct(vs.map(s => s.renda[40] ?? 0), 0.5)} · patrimônio 60: ${pct(vs.map(s => s.patrimonio[60] ?? 0), 0.5)}`);
}
log('');
log('## Coerência');
const viol = todas.flatMap(s => s.violacoes.map(x => `[${s.perfil} ${s.semente}] ${x}`));
log(viol.length ? viol.slice(0, 20).map(x => `- ${x}`).join('\n') + (viol.length > 20 ? `\n- (+${viol.length - 20})` : '') : '- nenhuma violação');

/* ----------------------------------------------- As vinte histórias pedidas */

const HISTORIAS: [string, (s: VidaSim) => boolean][] = [
  ['1. universidade → profissão tradicional', s => s.vida.educacao.concluidos.some(c => c.nivel === 'superior') && empregos(s).some(h => ['medico', 'advogado', 'advogado_jr', 'eng_jr', 'enfermeiro', 'dentista', 'psicologo', 'contador', 'professor_fund'].includes(h.ocupacaoId))],
  ['2. técnico → ofício → autonomia', s => s.vida.educacao.concluidos.some(c => c.nivel === 'tecnico' || c.nivel === 'livre') && empregos(s).some(h => familiaDaTrilha(ocupacao(h.ocupacaoId).trilha).id === 'oficio' && h.contrato === 'autonomo')],
  ['3. trabalha cedo → estuda aos 30+', s => (empregos(s)[0] ? idadeEm(s, empregos(s)[0]!.tInicio) <= 17 : false) && s.vida.educacao.concluidos.some(c => idadeEm(s, c.tFim) >= 30 && c.nivel !== 'livre')],
  ['4. serviço militar → carreira → reserva → segunda carreira', s => marca(s, 'reserva') && empregos(s).some(h => h.posAposentadoria)],
  ['5. tenta carreira militar e não entra → outro caminho', s => s.vida.caminhos.marcas.some(m => m.tipo === 'reprovacao' && /sargento|cadete|oficiais|escola|academia/.test(m.texto)) && !s.vida.caminhos.militar?.quadro?.match(/praca|oficial/)],
  ['6. esporte na adolescência → profissional', s => !!s.vida.fatos['atleta_profissional']],
  ['7. esporte → fracasso → outra carreira', s => !!s.vida.fatos['dispensado_base'] || s.vida.caminhos.marcas.some(m => m.tipo === 'fracasso' && !!m.dominio && ['futebol', 'volei', 'natacao', 'atletismo', 'lutas'].includes(m.dominio))],
  ['8. arte + trabalho paralelo → reconhecimento gradual', s => (bio(s, /edital de cultura|primeiro show pago|gravou as primeiras|ganhou um concurso literário/)) && empregos(s).some(h => familiaDaTrilha(ocupacao(h.ocupacaoId).trilha).id !== 'palco')],
  ['9. concurso depois de várias tentativas', s => s.vida.biografia.some(b => /Na \d+ª tentativa/.test(b.texto))],
  ['10. pequeno negócio → crescimento', s => marca(s, 'conquista', m => /firmou/.test(m.texto))],
  ['11. negócio → fracasso → emprego', s => marca(s, 'negocio_fechado') && empregos(s).some(h => h.contrato === 'clt' && h.tInicio > (s.vida.caminhos.marcas.find(m => m.tipo === 'negocio_fechado')?.t ?? 0))],
  ['12. informal → formalização', s => !!s.vida.fatos['formalizou_mei']],
  ['13. carreira rural', s => empregos(s).filter(h => familiaDaTrilha(ocupacao(h.ocupacaoId).trilha).id === 'rural').reduce((a, h) => a + ((h as { tFim?: number }).tFim ?? s.vida.t) - h.tInicio, 0) >= 180],
  ['14. cuidado interrompe a carreira → retorno', s => (s.vida.fatos['pausas_de_cuidado'] ?? 0) > 0 && (!!s.vida.fatos['voltou_ao_mercado'] || marca(s, 'retorno'))],
  ['15. crime → consequência → saída', s => !!s.vida.fatos['respondeu_processo'] && !!s.vida.justica?.tSaida && !s.vida.fatos['reincidiu']],
  ['16. crime → reincidência', s => !!s.vida.fatos['reincidiu']],
  ['17. vida convencional → crime tardio → consequência', s => s.vida.caminhos.envolvimento?.categoria === 'fraude' && !!s.vida.fatos['respondeu_processo']],
  ['18. mudança radical aos 40+', s => s.vida.caminhos.marcas.some(m => m.tipo === 'mudanca_carreira' && idadeEm(s, m.t) >= 40)],
  ['19. aposentado trabalhando', s => empregos(s).some(h => h.posAposentadoria)],
  ['20. vida sem prestígio, mas coerente', s => !s.vida.educacao.concluidos.some(c => c.nivel === 'superior') && empregos(s).length >= 2 && !!s.vida.trabalho.aposentadoria && !s.vida.fatos['esteve_preso']]
];
log('');
log('## As vinte histórias (quantas vidas contam cada uma; exemplo gravado)');
mkdirSync(`${SAIDA}/historias`, { recursive: true });
for (const [nome, f] of HISTORIAS) {
  const achadas = todas.filter(f);
  log(`- ${nome}: ${achadas.length} vidas${achadas[0] ? ` · ex.: ${achadas[0].perfil} ${achadas[0].semente}` : ''}`);
  if (achadas[0]) writeFileSync(`${SAIDA}/historias/${nome.split('.')[0].padStart(2, '0')}-${achadas[0].perfil}-${achadas[0].semente}.md`, `# ${nome}\n\n` + biografia(achadas[0]));
}
writeFileSync(`${SAIDA}/resumo.md`, out.join('\n'));
for (const s of todas.filter((_, k) => k % Math.max(1, Math.floor(VIDAS / 2)) === 0)) writeFileSync(`${SAIDA}/vida-${s.perfil}-${s.semente}.md`, biografia(s));
console.log(`\nbiografias em ${SAIDA}`);
void prop; void MUNICIPIOS;
