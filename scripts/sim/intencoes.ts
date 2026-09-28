/**
 * Simulador de INTENÇÕES (REWORK Caminhos, Agência e UX).
 *
 *   npx esbuild scripts/sim/intencoes.ts --bundle --platform=node --outfile=/tmp/int.cjs
 *   VIDAS=40 SAIDA=/tmp/int node /tmp/int.cjs
 *
 * Não são vidas aleatórias: cada estratégia é um jogador que QUER uma vida —
 * "quero ser atleta", "quero seguir carreira acadêmica" — e a persegue só com
 * o que o jogador pode fazer (`disponibilidade` → `executar`). Nada é
 * concedido por função interna. Mede se o caminho é descobrível, se dá para
 * se preparar, tentar, receber devolutiva, e se o fracasso aponta um próximo
 * passo. Sucesso não é meta; ser perseguível é.
 *
 * Ações novas deste rework (`perseguir`) são tentadas com cuidado: numa base
 * que não as conhece, a tentativa só falha — e isso é medido como "não havia
 * como pedir".
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, opcoesDeCurso, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import type { Momento, Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { MUNICIPIOS } from '../../src/motor/dados/lugares';
import { OCUPACOES, ocupacao } from '../../src/motor/dados/ocupacoes';
import { ORDEM_NIVEL, cursoOuNulo } from '../../src/motor/dados/cursos';
import { familiaDaTrilha } from '../../src/motor/dados/carreiras';
import { editaisAbertos } from '../../src/motor/sistemas/concurso';
import { vagasParaVoce } from '../../src/motor/sistemas/relevancia';
import { negociosPossiveis } from '../../src/motor/sistemas/negocio';
import { saldoMensal } from '../../src/motor/sistemas/dinheiro';
import { porContaPropria } from '../../src/motor/sistemas/trabalho';

const VIDAS = Number(process.env.VIDAS ?? 40);
const SAIDA = process.env.SAIDA ?? '/tmp/int';
const IDADE_FIM = Number(process.env.IDADE ?? 58);
mkdirSync(SAIDA, { recursive: true });

/** Tenta sem quebrar: numa base sem a ação, "não dá". */
function veredito(v: Vida, a: Acao) {
  try { return disponibilidade(v, a); } catch { return undefined; }
}
const tenta = (v: Vida, a: Acao) => { const d = veredito(v, a); return !!d && podeTentar(d); };
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);

interface Intencao {
  nome: string;
  /** O que a estratégia faz no ano (só ações do jogador). */
  agir(v: Vida, r: Rng): Acao[];
  /** Preferências nas decisões. */
  prefere: string[];
  /** O caminho já está à vista e ao alcance de uma ação? */
  descobriu(v: Vida): boolean;
  /** Chegou lá (a vida que queria). */
  chegou(v: Vida): boolean;
  /** O que conta como tentativa (lido do estado, por ano). */
  tentativas(v: Vida): number;
  cursos?: string[];
  rotinas?: [string, number, number][];
  nasceEm?: 'grande' | 'qualquer';
}

/* ------------------------------------------------------------ utilidades */

function escolher(m: Momento, r: Rng, pref: string[], quemE = ''): string {
  const livres = m.opcoes.filter(o => !o.bloqueio);
  // Quem não quer política diz não ao convite (o convite continua sendo medido).
  if (m.situacaoId === 'pol_convite' && quemE !== 'politica') { const nao = livres.find(o => o.id === 'nao'); if (nao) return nao.id; }
  for (const p of pref) {
    const o = livres.find(x => x.id === p || x.id.startsWith(p));
    if (o) return o.id;
  }
  return r.pick(livres.length ? livres : m.opcoes).id;
}

function rotinas(v: Vida, lista: [string, number, number][]): Acao[] {
  const i = idade(v);
  const out: Acao[] = [];
  for (const [id, min, nivel] of lista) {
    if (i < min) continue;
    const atual = v.rotinas.find(x => x.id === id);
    if (!atual) { const a: Acao = { tipo: 'rotina', id, ativa: true, nivel: 1 }; if (tenta(v, a)) out.push(a); }
    else if ((atual.nivel ?? 1) < nivel) { const a: Acao = { tipo: 'rotina', id, ativa: true, nivel: ((atual.nivel ?? 1) + 1) as 2 | 3 }; if (tenta(v, a)) out.push(a); }
  }
  return out;
}

const temNivel = (v: Vida, n: number) => v.educacao.concluidos.some(c => ORDEM_NIVEL[c.nivel] >= n);
const aceitar = (v: Vida, tipos: string[]): Acao[] => v.caminhos.oportunidades.filter(o => tipos.includes(o.tipo)).map(o => ({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao)).filter(a => tenta(v, a)).slice(0, 1);

/** Estudar um curso (pelo id), pelo caminho mais barato que existe. */
function estudar(v: Vida, r: Rng, ids: string[], nivelMin = 0): Acao[] {
  if (v.educacao.matricula || idade(v) < 17) return [];
  const ops = opcoesDeCurso(v).map((o, idx) => ({ o, idx })).filter(x => ids.includes(x.o.curso.id) && ORDEM_NIVEL[x.o.curso.nivel] >= nivelMin && podeTentar(x.o.veredito) && v.fatos[`tentou_${x.o.curso.id}_${Math.floor(v.t / 12)}`] === undefined)
    .filter(x => !v.educacao.concluidos.some(c => c.cursoId === x.o.curso.id))
    .filter(x => x.o.mensalidade <= Math.max(700, saldoMensal(v).renda * 0.35) || ['sisu', 'prouni', 'fies', 'selecao_publica'].includes(x.o.via));
  const nota = (x: typeof ops[number]) => ({ sisu: 4, selecao_publica: 4, prouni: 3, fies: 2, ead: 1.5, privada: 1.5 } as Record<string, number>)[x.o.via] + (x.o.veredito.chance ?? 0) * 2 + r.next();
  const m = ops.sort((a, b) => nota(b) - nota(a))[0];
  return m ? [{ tipo: 'matricular', indice: m.idx }] : [];
}

/** Candidatar-se ao que combina (trilhas preferidas primeiro; o degrau mais alto que dá). */
function candidatar(v: Vida, r: Rng, trilhas: string[], so = false): Acao[] {
  const atual = v.trabalho.atual ? ocupacao(v.trabalho.atual.ocupacaoId) : undefined;
  const vagas = OCUPACOES.filter(oc => !oc.concurso && !porContaPropria(oc) && oc.id !== atual?.id && (!so || trilhas.includes(oc.trilha)) && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id }))
    .filter(oc => !atual || oc.salario > atual.salario * 1.05 || !trilhas.includes(atual.trilha));
  const pts = (oc: typeof OCUPACOES[number]) => (trilhas.includes(oc.trilha) ? 10 : 0) + oc.nivel * 1.5 + (veredito(v, { tipo: 'candidatar', ocupacaoId: oc.id })?.chance ?? 0.4) * 4 + r.next();
  const alvo = vagas.sort((a, b) => pts(b) - pts(a))[0];
  return alvo ? [{ tipo: 'candidatar', ocupacaoId: alvo.id }] : [];
}

/**
 * "Enquanto isso": o trabalho de quem persegue outra coisa (a base, a banda, o
 * edital). Segue as sugestões da própria tela de Trabalho (`vagasParaVoce`),
 * como um jogador faria — e não "comércio, no degrau mais alto que dá", que
 * fazia 25 de 40 atletas virarem gerente de loja aos 40 (REWORK 2).
 */
function candidatarPelaTela(v: Vida, r: Rng): Acao[] {
  const { para } = vagasParaVoce(v);
  const ok = para.filter(x => tenta(v, { tipo: 'candidatar', ocupacaoId: x.item.oc.id }));
  return ok.length ? [{ tipo: 'candidatar', ocupacaoId: r.pick(ok).item.oc.id }] : [];
}

const trabalhaEm = (v: Vida, trilhas: string[]) => !!v.trabalho.atual && trilhas.includes(ocupacao(v.trabalho.atual.ocupacaoId).trilha);
const jaFoi = (v: Vida, ids: string[]) => ids.includes(v.trabalho.atual?.ocupacaoId ?? '') || v.trabalho.historico.some(h => ids.includes(h.ocupacaoId));
const devs = (v: Vida, tipo?: string) => v.caminhos.devolutivas.filter(d => !tipo || d.tipo === tipo);

/* ------------------------------------------------------------ as vidas pedidas */

const ACADEMIA = ['professor_univ', 'pesquisador', 'pesquisador_instituto', 'professor_faculdade', 'coordenador_curso'];
const CONCURSOS_ADM = ['tecnico_publico', 'escriturario_banco', 'analista_judiciario', 'auditor_fiscal', 'agente_saude'];
const MILITAR = ['aluno_sargento', 'cadete', 'aluno_pm', 'aluno_oficial_pm', 'aluno_bombeiro'];
const MILITAR_OC = OCUPACOES.filter(o => ['exercito_praca', 'exercito_sargento', 'exercito_oficial', 'pm', 'pm_oficial', 'bombeiro'].includes(o.trilha) && !['soldado_ep', 'cabo_ep'].includes(o.id)).map(o => o.id);
const ESPORTE_OC = ['jogador_futebol', 'atleta'];
/** Viver da arte (não só dar aula dela nem tocar por uns trocados). */
const ARTE_OC = ['musico_profissional', 'musico_orquestra', 'produtor_musical', 'ator', 'ator_reconhecido', 'bailarino', 'escritor', 'criador_conteudo'];
void familiaDaTrilha;

const concursoTentado = (v: Vida) => v.caminhos.concurso.tentativas + v.trabalho.candidaturas.filter(c => c.concurso).length;

const INTENCOES: Intencao[] = [
  {
    nome: 'privado', prefere: ['aceitar', 'preparo', 'experiencia', 'resultados', 'enem', 'ficar', 'publica'],
    rotinas: [['ingles', 14, 2]],
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [...rotinas(v, [['ingles', 14, 2]])];
      if (i >= 17 && !temNivel(v, 2) && !v.educacao.matricula && tenta(v, { tipo: 'enem' })) out.push({ tipo: 'enem' });
      out.push(...estudar(v, r, ['administracao', 'contabeis', 'economia']));
      if (temNivel(v, 2) && i >= 28 && !temNivel(v, 3)) out.push(...estudar(v, r, ['mba'], 3));
      out.push(...aceitar(v, ['estagio', 'indicacao', 'vaga', 'proposta']));
      if (i >= 18 && (!v.trabalho.atual || r.chance(0.35))) out.push(...candidatar(v, r, ['administrativo', 'financas', 'contabil']));
      return out;
    },
    descobriu: v => OCUPACOES.some(oc => ['administrativo', 'financas', 'contabil'].includes(oc.trilha) && oc.nivel >= 3 && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })),
    chegou: v => [v.trabalho.atual, ...v.trabalho.historico].some(e => e && ['administrativo', 'financas', 'contabil'].includes(ocupacao(e.ocupacaoId).trilha) && ocupacao(e.ocupacaoId).nivel >= 4),
    tentativas: v => devs(v, 'entrevista').length
  },
  {
    nome: 'academico', prefere: ['aceitar', 'preparo', 'experiencia', 'enem', 'ficar', 'publica', 'matricular', 'curso'],
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [...rotinas(v, [['leitura', 12, 2], ['clube_ciencias', 12, 2]])];
      if (i >= 16 && i <= 19 && !v.educacao.matricula && !temNivel(v, 2) && tenta(v, { tipo: 'rotina', id: 'cursinho', ativa: true })) out.push({ tipo: 'rotina', id: 'cursinho', ativa: true });
      if (i >= 17 && !temNivel(v, 2) && !v.educacao.matricula && tenta(v, { tipo: 'enem' })) out.push({ tipo: 'enem' });
      out.push(...estudar(v, r, ['nutricao', 'psicologia', 'enfermagem', 'licenciatura', 'estatistica']));
      if (temNivel(v, 2) && !temNivel(v, 4)) out.push(...estudar(v, r, ['mestrado'], 4));
      if (temNivel(v, 4) && !temNivel(v, 5)) out.push(...estudar(v, r, ['doutorado'], 5));
      out.push(...aceitar(v, ['bolsa', 'vaga', 'convite']));
      for (const x of [P('bolsa_pesquisa')]) if (tenta(v, x)) out.push(x);
      for (const oc of editaisAbertos(v).filter(x => ['professor_univ', 'pesquisador_instituto'].includes(x.id))) if (tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })) { out.push({ tipo: 'candidatar', ocupacaoId: oc.id }); break; }
      if (!jaFoi(v, ACADEMIA)) for (const id of ['professor_faculdade']) if (OCUPACOES.some(o => o.id === id) && tenta(v, { tipo: 'candidatar', ocupacaoId: id })) out.push({ tipo: 'candidatar', ocupacaoId: id });
      if (i >= 22 && !v.trabalho.atual && !v.educacao.matricula) out.push(...candidatar(v, r, ['nutricao', 'psicologia', 'enfermagem', 'educacao', 'dados']));
      return out;
    },
    descobriu: v => temNivel(v, 2) && opcoesDeCurso(v).some(o => o.curso.nivel === 'mestrado' && podeTentar(o.veredito)),
    chegou: v => jaFoi(v, ACADEMIA),
    tentativas: v => (v.fatos['concurso_professor_univ'] ?? 0) + devs(v, 'entrevista').filter(d => ACADEMIA.includes(d.ocupacaoId ?? '')).length + (jaFoi(v, ['pesquisador']) ? 1 : 0)
  },
  {
    nome: 'concurso', prefere: ['aceitar', 'enem', 'publica', 'ficar', 'tomar_posse', 'posse', 'assumir'],
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [];
      if (i >= 17 && !temNivel(v, 2) && !v.educacao.matricula && tenta(v, { tipo: 'enem' })) out.push({ tipo: 'enem' });
      out.push(...estudar(v, r, ['direito', 'administracao', 'contabeis']));
      const servidor = v.trabalho.atual?.contrato === 'servidor';
      if (i >= 18 && !servidor) {
        if (!v.rotinas.some(x => x.id === 'estudar_concurso')) { for (const n of [2, 1] as const) { const a: Acao = { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: n }; if (tenta(v, a)) { out.push(a); break; } } }
        else if ((v.rotinas.find(x => x.id === 'estudar_concurso')!.nivel ?? 1) < 2) { const a: Acao = { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 2 }; if (tenta(v, a)) out.push(a); }
        const foco = P('foco_concurso', 'administrativo');
        if (v.caminhos.concurso && (v.caminhos.concurso as { foco?: string }).foco !== 'administrativo' && tenta(v, foco)) out.push(foco);
        for (const oc of editaisAbertos(v).filter(x => CONCURSOS_ADM.includes(x.id))) if (tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })) { out.push({ tipo: 'candidatar', ocupacaoId: oc.id }); break; }
      }
      if (servidor && v.rotinas.some(x => x.id === 'estudar_concurso')) out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: false });
      if (i >= 18 && !v.trabalho.atual) out.push(...candidatarPelaTela(v, r));
      return out;
    },
    descobriu: v => editaisAbertos(v).some(oc => CONCURSOS_ADM.includes(oc.id) && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })),
    chegou: v => jaFoi(v, CONCURSOS_ADM),
    tentativas: concursoTentado
  },
  {
    nome: 'militar', prefere: ['engajar', 'aceitar', 'ir', 'ficar', 'combatente', 'posse', 'assumir', 'tomar_posse'],
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [...rotinas(v, [['corrida', 14, 2], ['academia', 16, 2]])];
      const na = !!v.trabalho.atual && MILITAR_OC.includes(v.trabalho.atual.ocupacaoId) || MILITAR.includes(v.trabalho.atual?.ocupacaoId ?? '');
      if (!na && i >= 17 && i <= 32) {
        if (!v.rotinas.some(x => x.id === 'estudar_concurso')) { const a: Acao = { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 2 }; if (tenta(v, a)) out.push(a); }
        const foco = P('foco_concurso', 'policial');
        if ((v.caminhos.concurso as { foco?: string }).foco !== 'policial' && tenta(v, foco)) out.push(foco);
        for (const oc of editaisAbertos(v).filter(x => MILITAR.includes(x.id))) if (tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })) { out.push({ tipo: 'candidatar', ocupacaoId: oc.id }); break; }
      }
      if (na && v.rotinas.some(x => x.id === 'estudar_concurso')) out.push({ tipo: 'rotina', id: 'estudar_concurso', ativa: false });
      if (!na && i >= 18 && !v.trabalho.atual) out.push(...candidatarPelaTela(v, r));
      return out;
    },
    descobriu: v => editaisAbertos(v).some(oc => MILITAR.includes(oc.id) && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })) || !!v.caminhos.militar,
    chegou: v => jaFoi(v, MILITAR_OC),
    tentativas: v => MILITAR.reduce((s, id) => s + (v.fatos[`concurso_${id}`] ?? 0), 0) + (jaFoi(v, MILITAR_OC) ? 1 : 0)
  },
  {
    nome: 'esporte', prefere: ['p1', 'p2', 'p0', 'ir', 'assinar', 'tentar', 'forcar', 'renovar', 'ficar_clube'],
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [...rotinas(v, [[v.fatos['int_mod'] === 1 ? 'volei' : 'futebol', 6, 3], ['corrida', 12, 1]])];
      out.push(...aceitar(v, ['peneira', 'seletiva', 'convite']));
      // Um jogador que quer isso segue a orientação da tela: pede o teste quando a técnica já está perto
      // (ou quando a janela da base vai fechar), não aos 11 anos só porque pode.
      const d = v.fatos['int_mod'] === 1 ? 'volei' : 'futebol';
      const h = v.caminhos.frentes[d as 'volei']?.habilidade ?? 0;
      const fimJanela = d === 'futebol' ? 17 : 19;
      if (!v.caminhos.esporte && (h >= 66 || i >= fimJanela - 1)) for (const x of [P('pedir_teste', d)]) if (tenta(v, x)) out.push(x);
      if (i >= 20 && !v.trabalho.atual && v.caminhos.esporte?.fase !== 'profissional' && v.caminhos.esporte?.fase !== 'base') out.push(...candidatarPelaTela(v, r));
      void r;
      return out;
    },
    descobriu: v => v.caminhos.oportunidades.some(o => o.tipo === 'peneira' || o.tipo === 'seletiva') || !!v.caminhos.esporte || tenta(v, P('pedir_teste')),
    chegou: v => !!v.caminhos.esporte && (v.caminhos.esporte.fase === 'profissional' || jaFoi(v, ESPORTE_OC)),
    tentativas: v => devs(v, 'peneira').length
  },
  {
    nome: 'arte', prefere: ['entrar', 'aceitar', 'inscrever', 'ir', 'fins', 'viver', 'arte'],
    agir: (v, r) => {
      const out: Acao[] = [...rotinas(v, [['musica', 8, 3], ['teatro', 12, 2]])];
      out.push(...aceitar(v, ['banda', 'grupo', 'convite', 'clientela']));
      for (const x of [P('montar_grupo', 'musica'), P('mostrar_trabalho')]) if (tenta(v, x)) out.push(x);
      for (const oc of OCUPACOES.filter(o => ARTE_OC.includes(o.id))) if (!jaFoi(v, ARTE_OC) && tenta(v, { tipo: 'candidatar', ocupacaoId: oc.id })) { out.push({ tipo: 'candidatar', ocupacaoId: oc.id }); break; }
      if (idade(v) >= 19 && !v.trabalho.atual) out.push(...candidatarPelaTela(v, r));
      return out;
    },
    descobriu: v => v.caminhos.oportunidades.some(o => o.tipo === 'banda' || o.tipo === 'grupo') || !!v.caminhos.arte || tenta(v, P('montar_grupo', 'musica')),
    chegou: v => jaFoi(v, ARTE_OC),
    tentativas: v => (v.caminhos.arte ? 1 : 0) + v.caminhos.marcas.filter(m => /edital de cultura/.test(m.texto)).length + devs(v, 'arte').length
  },
  {
    nome: 'empreendedor', prefere: ['guardado', 'pequeno', 'casa', 'dedicar', 'integral', 'aceitar', 'crescer'],
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [];
      if (!v.caminhos.negocio || v.caminhos.negocio.estado === 'fechado') {
        if (i >= 18 && !v.trabalho.atual) out.push(...candidatarPelaTela(v, r));
        if (i >= 23) { const n = negociosPossiveis(v).filter(x => podeTentar(x.veredito)).sort((a, b) => a.custo - b.custo)[0]; if (n) out.push({ tipo: 'abrir_negocio', negocio: n.t.id }); }
      }
      return out;
    },
    descobriu: v => negociosPossiveis(v).some(x => podeTentar(x.veredito)),
    chegou: v => !!v.caminhos.negocio,
    tentativas: v => (v.caminhos.negocio ? 1 : 0) + (v.fatos['negocios_abertos'] ?? 0)
  },
  {
    nome: 'autonomo', prefere: ['aceitar', 'mei', 'preco_normal', 'ficar', 'publica'],
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [...rotinas(v, [['cozinhar', 12, 2]])];
      if (i >= 16 && !temNivel(v, 0.5)) out.push(...estudar(v, r, ['q_confeitaria', 'q_cabeleireiro']));
      if (i >= 17 && !v.trabalho.atual) {
        for (const id of ['confeiteiro', 'cabeleireiro', 'manicure']) if (tenta(v, { tipo: 'candidatar', ocupacaoId: id })) { out.push({ tipo: 'candidatar', ocupacaoId: id }); break; }
      }
      if (tenta(v, { tipo: 'mei' }) && r.chance(0.3)) out.push({ tipo: 'mei' });
      return out;
    },
    descobriu: v => ['confeiteiro', 'cabeleireiro', 'manicure'].some(id => tenta(v, { tipo: 'candidatar', ocupacaoId: id })),
    chegou: v => jaFoi(v, ['confeiteiro', 'cabeleireiro', 'manicure']),
    tentativas: v => (jaFoi(v, ['confeiteiro', 'cabeleireiro', 'manicure']) ? 1 : 0)
  },
  {
    nome: 'politica', prefere: ['aceitar', 'entrar', 'p0', 'p1', 'registrar', 'vereador', 'campanha', 'rua', 'seguranca', 'saude'],
    agir: v => {
      const out: Acao[] = [...rotinas(v, [['voluntariado', 16, 2]])];
      const pol = v.caminhos.politica;
      if (!pol || pol.fase === 'encerrada') { const a = { tipo: 'politica', oque: 'aproximar' } as unknown as Acao; if (tenta(v, a)) out.push(a); }
      else {
        for (const oque of ['filiar', 'bandeira', 'comunidade', 'candidatura']) { const a = { tipo: 'politica', oque, valor: oque === 'bandeira' ? 'seguranca' : undefined } as unknown as Acao; if (tenta(v, a)) out.push(a); }
      }
      return out;
    },
    descobriu: v => tenta(v, { tipo: 'politica', oque: 'aproximar' } as unknown as Acao) || !!v.caminhos.politica,
    chegou: v => v.caminhos.politica?.historico?.some(h => h.resultado === 'eleito') ?? false,
    tentativas: v => v.caminhos.politica?.historico?.filter(h => h.resultado === 'eleito' || h.resultado === 'derrotado').length ?? 0
  }
];

/* ---------------------------------------------------------------- viver */

interface Registro {
  intencao: string; semente: number;
  descobriu?: number; comecou?: number; tentou?: number; chegou?: number; meio?: number;
  tentativas: number; devolutivas: number; devolutivasComPasso: number; progressoDito: number;
  bloqueiosSemMotivo: number; politica: boolean; politicaConvite: boolean;
  ocupacoes: Record<number, string>;
  biografia: string[];
}

const COMECO: Record<string, (v: Vida) => boolean> = {
  privado: v => !!v.educacao.matricula || temNivel(v, 2),
  academico: v => v.educacao.matricula?.cursoId === 'mestrado' || temNivel(v, 4),
  concurso: v => v.rotinas.some(x => x.id === 'estudar_concurso'),
  militar: v => v.rotinas.some(x => x.id === 'estudar_concurso') || !!v.caminhos.militar,
  esporte: v => (v.rotinas.find(x => x.id === 'futebol' || x.id === 'volei')?.nivel ?? 0) >= 2,
  arte: v => (v.rotinas.find(x => x.id === 'musica')?.nivel ?? 0) >= 2,
  empreendedor: v => !!v.caminhos.negocio,
  autonomo: v => v.educacao.concluidos.some(c => c.nivel === 'livre') || !!v.educacao.matricula,
  politica: v => !!v.caminhos.politica
};

/** Marcos intermediários (o caminho não é só o topo): entrou na base, entrou num grupo, começou a pós. */
const MEIO: Record<string, (v: Vida) => boolean> = {
  esporte: v => !!v.caminhos.esporte,
  arte: v => !!v.caminhos.arte || jaFoi(v, ['musico_noite', 'professor_musica']),
  academico: v => v.educacao.concluidos.some(c => c.nivel === 'mestrado'),
  militar: v => !!v.caminhos.militar || MILITAR.some(id => jaFoi(v, [id])),
  concurso: v => v.caminhos.concurso.tentativas > 0,
  privado: v => [v.trabalho.atual, ...v.trabalho.historico].some(e => e && ocupacao(e.ocupacaoId).nivel >= 3),
  empreendedor: v => !!v.caminhos.negocio,
  autonomo: v => jaFoi(v, ['confeiteiro', 'cabeleireiro', 'manicure']),
  politica: v => (v.caminhos.politica?.historico.length ?? 0) > 0
};

function viver(semente: number, it: Intencao): Registro {
  const r = criarRng(semente * 31 + 7);
  const lista = it.nasceEm === 'grande' ? MUNICIPIOS.filter(m => m.perfil !== 'pequena') : MUNICIPIOS;
  const m = lista[semente % lista.length];
  const genero = semente % 2 === 0 ? 'feminino' : 'masculino';
  let v = criarVida({ nome: 'Vida', sobrenome: 'Sim', genero, municipioId: m.id, semente: semente + 1000 * INTENCOES.indexOf(it) });
  v.fatos['int_mod'] = semente % 3 === 0 ? 1 : 0;
  const reg: Registro = { intencao: it.nome, semente, tentativas: 0, devolutivas: 0, devolutivasComPasso: 0, progressoDito: 0, bloqueiosSemMotivo: 0, politica: false, politicaConvite: false, ocupacoes: {}, biografia: [] };
  let guarda = 0;
  let devsVistas = 0;
  while (!v.morte && idade(v) < IDADE_FIM && guarda++ < 80) {
    const i = idade(v);
    if (reg.descobriu === undefined && i >= 10 && it.descobriu(v)) reg.descobriu = i;
    for (const a of it.agir(v, r)) {
      const d = veredito(v, a);
      if (!d) continue;
      if (!podeTentar(d)) { if (!d.motivo && d.grau !== 'impossivel') reg.bloqueiosSemMotivo++; continue; }
      try { v = executar(v, a).vida; } catch { continue; }
      let k = 0;
      while (v.momento && k++ < 8) v = executar(v, { tipo: 'decidir', opcaoId: escolher(v.momento, r, it.prefere, it.nome) }).vida;
    }
    v = avancarAno(v).vida;
    let k = 0;
    while (v.momento && k++ < 8) {
      if (v.momento.situacaoId === 'pol_convite') reg.politicaConvite = true;
      v = executar(v, { tipo: 'decidir', opcaoId: escolher(v.momento, r, it.prefere, it.nome) }).vida;
    }
    const ia = idade(v);
    if (reg.comecou === undefined && COMECO[it.nome](v)) reg.comecou = ia;
    const t = it.tentativas(v);
    if (t > 0 && reg.tentou === undefined) reg.tentou = ia;
    reg.tentativas = Math.max(reg.tentativas, t);
    if (reg.chegou === undefined && it.chegou(v)) reg.chegou = ia;
    if (reg.meio === undefined && MEIO[it.nome](v)) reg.meio = ia;
    const lista = v.caminhos.devolutivas;
    for (const dv of lista.slice(Math.max(0, lista.length - (lista.length - Math.min(devsVistas, lista.length))))) void dv;
    if ([25, 30, 35, 40, 45, 50, 55].includes(ia)) reg.ocupacoes[ia] = v.trabalho.atual?.ocupacaoId ?? (v.educacao.matricula ? `estudando:${v.educacao.matricula.cursoId}` : 'sem_trabalho');
    if (v.caminhos.politica && v.caminhos.politica.fase !== 'encerrada' && it.nome !== 'politica') reg.politica = true;
    devsVistas = lista.length;
  }
  // Devolutivas: o que a vida contou de cada tentativa.
  const todas = v.caminhos.devolutivas.filter(d => !d.passou);
  reg.devolutivas = todas.length;
  reg.devolutivasComPasso = todas.filter(d => !!d.falta).length;
  reg.progressoDito = todas.filter(d => /desde a última|da outra vez|melhorou|subiu|evoluiu|cresceu|mais forte|mais perto|ainda longe|quase lá/i.test(d.texto)).length;
  reg.biografia = v.biografia.filter(b => b.tema === 'trabalho' || b.tema === 'estudo' || b.tema === 'lazer').filter(b => b.relevancia === 'marco' || b.relevancia === 'biografia').map(b => `${idade({ ...v, t: b.t } as Vida)}: ${b.texto}`).slice(0, 60);
  return reg;
}

/* ---------------------------------------------------------------- medir */

const regs: Registro[] = [];
for (const it of INTENCOES) for (let s = 1; s <= VIDAS; s++) regs.push(viver(s, it));

const pct = (x: number, n: number) => (n ? `${Math.round((x / n) * 100)}%` : '—');
const med = (xs: number[]) => { const a = xs.filter(x => Number.isFinite(x)).sort((p, q) => p - q); return a.length ? a[Math.floor(a.length / 2)] : NaN; };
const linhas: string[] = [];
const log = (s: string) => { linhas.push(s); console.log(s); };
log(`# Intenções — ${VIDAS} vidas por estratégia, até ${IDADE_FIM} anos\n`);
log('| intenção | descobriu | idade (mediana) | começou a se preparar | tentou | 1ª tentativa (idade) | tentativas (mediana) | devolutivas c/ próximo passo | progresso dito | meio do caminho | chegou | idade ao chegar | bloqueio sem motivo | entrou na política |');
log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
const resumo: Record<string, unknown> = {};
for (const it of INTENCOES) {
  const g = regs.filter(x => x.intencao === it.nome);
  const n = g.length;
  const d = g.filter(x => x.descobriu !== undefined).length;
  const c = g.filter(x => x.comecou !== undefined).length;
  const t = g.filter(x => x.tentou !== undefined).length;
  const ch = g.filter(x => x.chegou !== undefined).length;
  const dv = g.reduce((s, x) => s + x.devolutivas, 0);
  const dp = g.reduce((s, x) => s + x.devolutivasComPasso, 0);
  const pr = g.reduce((s, x) => s + x.progressoDito, 0);
  const bl = g.reduce((s, x) => s + x.bloqueiosSemMotivo, 0);
  const pol = g.filter(x => x.politica).length;
  resumo[it.nome] = { n, descobriu: d, comecou: c, tentou: t, chegou: ch, devolutivas: dv, comPasso: dp, progresso: pr, bloqueiosSemMotivo: bl, politica: pol };
  const meio = g.filter(x => x.meio !== undefined).length;
  log(`| ${it.nome} | ${pct(d, n)} | ${med(g.map(x => x.descobriu ?? NaN))} | ${pct(c, n)} | ${pct(t, n)} | ${med(g.map(x => x.tentou ?? NaN))} | ${med(g.filter(x => x.tentou !== undefined).map(x => x.tentativas))} | ${dv ? pct(dp, dv) : '—'} (${dv}) | ${dv ? pct(pr, dv) : '—'} | ${pct(meio, n)} | ${pct(ch, n)} | ${med(g.map(x => x.chegou ?? NaN))} | ${bl} | ${it.nome === 'politica' ? '—' : pct(pol, n)} |`);
}

// Convergência: a ocupação aos 40 de cada intenção.
log('\n## Aos 40 anos (ocupação mais comum por intenção)\n');
const aos40: Record<string, Map<string, number>> = {};
for (const it of INTENCOES) {
  const mapa = new Map<string, number>();
  for (const x of regs.filter(y => y.intencao === it.nome)) { const o = x.ocupacoes[40] ?? '—'; mapa.set(o, (mapa.get(o) ?? 0) + 1); }
  aos40[it.nome] = mapa;
  const top = [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([o, k]) => `${o} ${k}`).join(' · ');
  log(`- **${it.nome}**: ${top}`);
}
// Semelhança entre intenções (Jaccard das ocupações aos 40).
log('\n## Convergência entre intenções (sobreposição das ocupações aos 40, 0–1)\n');
const nomes = INTENCOES.map(x => x.nome);
for (let a = 0; a < nomes.length; a++) for (let b = a + 1; b < nomes.length; b++) {
  const A = new Set([...aos40[nomes[a]].keys()].filter(k => k !== '—' && k !== 'sem_trabalho'));
  const B = new Set([...aos40[nomes[b]].keys()].filter(k => k !== '—' && k !== 'sem_trabalho'));
  const inter = [...A].filter(k => B.has(k)).length;
  const uni = new Set([...A, ...B]).size;
  const j = uni ? inter / uni : 0;
  if (j >= 0.25) log(`- ${nomes[a]} × ${nomes[b]}: ${j.toFixed(2)}`);
}
const convites = regs.filter(x => x.intencao !== 'politica' && x.politicaConvite).length;
log(`\nConvites políticos recebidos por quem não queria política: ${pct(convites, regs.filter(x => x.intencao !== 'politica').length)} das vidas.`);

writeFileSync(`${SAIDA}/intencoes.md`, linhas.join('\n'));
writeFileSync(`${SAIDA}/intencoes.json`, JSON.stringify({ resumo, regs: regs.map(x => ({ ...x, biografia: undefined })) }, null, 1));
for (const it of INTENCOES) {
  const g = regs.filter(x => x.intencao === it.nome).slice(0, 3);
  writeFileSync(`${SAIDA}/bio_${it.nome}.txt`, g.map(x => `== ${it.nome} #${x.semente} (chegou: ${x.chegou ?? 'não'})\n${x.biografia.join('\n')}`).join('\n\n'));
}
