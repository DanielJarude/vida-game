/**
 * Atividades: o que a pessoa escolhe fazer com a semana, ano após ano.
 *
 * Uma atividade é compromisso contínuo, não clique: dura até o jogador
 * mudar. Tem INTENSIDADE (leve, regular, a sério), que muda o tempo que come
 * da semana, o custo e o quanto rende. Pratica FRENTES (o futebol treina o
 * futebol; a leitura, o português). Coloca o jogador num lugar com gente.
 * Mantida por anos, é evidência de comportamento.
 *
 * Nem toda atividade existe para toda criança: natação pede piscina,
 * teatro pede um grupo, aula paga pede dinheiro em casa. A oferta local abre
 * e fecha em janelas de alguns anos (um projeto social chega ao bairro, um
 * professor novo monta o grupo de teatro) — azar num ano não fecha a porta
 * para sempre, e o que já se pratica continua disponível.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Rotina, Traco, Vida } from '../tipos';
import { escrever, filhos, idade, marcarFato, temFato, parceiro, parentes } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { ROTINAS_SOCIAIS } from './social';
import { CUSTO_ROTINA } from './dinheiro';
import { aplicarPersonalidade } from '../personalidade';
import { moraComFamiliaDeOrigem, rendaPerCapita } from './domicilio';
import { nivelDeOferta } from '../dados/lugares';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { esquecerFrentes, habilidade, praticar } from './frentes';
import { cabeNaSemana } from './semana';
import type { Categoria } from '../dados/frentes';

export type CategoriaAtividade = Categoria | 'corpo' | 'lazer' | 'renda' | 'cuidado';

export interface NivelRotina {
  rotulo: string;
  /** Quanto da semana ocupa (0.5 uma vez por semana · 1 algumas vezes · 2 quase todo dia). */
  tempo: number;
  /** Custo mensal (antes do custo de vida local). */
  custo: number;
  /** Qualidade do contexto para a prática (1 normal). */
  qualidade?: number;
  requer?: (v: Vida) => true | string;
}

export interface ModeloRotina {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaAtividade;
  idadeMin: number;
  idadeMax?: number;
  /** Intensidades possíveis. A primeira é o jeito mais leve. */
  niveis: NivelRotina[];
  /** Frentes praticadas (peso por frente). */
  pratica?: Partial<Record<Dominio, number>>;
  social?: { onde: string; fluxo: number; amplitude: number };
  /** Evidência comportamental acumulada por ano de prática. */
  comportamento?: Partial<Record<Traco, number>>;
  efeito?: (v: Vida, r: Rng, nivel: number) => void;
  /** Requisito pessoal (idade, escola, situação). Motivo aparece. */
  requer?: (v: Vida) => true | string;
  /** Existe no lugar e no momento? Se não, a atividade nem aparece. */
  oferta?: (v: Vida) => boolean;
  irregular?: (v: Vida) => string | undefined;
  /** Renda mensal que a atividade traz (bicos), já escalada pela habilidade. */
  renda?: (v: Vida, nivel: number) => number;
}

/* ------------------------------------------------------------ Oferta local */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/**
 * Janela de oferta: numa janela de três anos, o lugar tem (ou não) aquela
 * atividade. Muda de janela em janela. Estável ao recarregar.
 */
export function janela(v: Vida, id: string, chance: number): boolean {
  const bloco = Math.floor(idade(v) / 3);
  return hash(`${v.id}:${v.moradia.municipioId}:${id}:${bloco}`) < chance;
}

const cidade = (v: Vida) => nivelDeOferta(v.moradia.municipioId);
const escolaPrivada = (v: Vida) => v.educacao.basica?.rede === 'privada';
const naEscola = (v: Vida) => !!v.educacao.basica && ['fundamental1', 'fundamental2', 'medio'].includes(v.educacao.basica.etapa);
const pc = (v: Vida) => rendaPerCapita(v);
/** A casa consegue pagar uma atividade de criança/adolescente? */
const casaPaga = (v: Vida, custo: number) => !(idade(v) < 18 && moraComFamiliaDeOrigem(v)) || custo <= 40 || pc(v) >= 1100 + custo * 4;
const semDinheiro = 'A família não tem como pagar isso agora.';

/** Projeto social gratuito (escolinha de bairro, ONG): existe em algumas janelas. */
const projetoSocial = (v: Vida, id: string) => idade(v) < 18 && janela(v, `projeto:${id}`, cidade(v) >= 1 ? 0.45 : 0.3);

function pago(custo: number, id: string, extra?: (v: Vida) => true | string): (v: Vida) => true | string {
  return v => {
    if (!casaPaga(v, custo) && !projetoSocial(v, id)) return semDinheiro;
    return extra ? extra(v) : true;
  };
}

const naBase = (d: Dominio) => (v: Vida) => (v.caminhos.esporte?.fase === 'base' || v.caminhos.esporte?.fase === 'profissional') && v.caminhos.esporte.modalidade === d ? true : 'Só para quem está numa equipe de competição.';
const comProjeto = (d: Dominio, minimo: number) => (v: Vida) => (v.caminhos.arte?.ativo && v.caminhos.arte.linguagem === d) || habilidade(v, d) >= minimo || v.educacao.matricula?.cursoId === (d === 'musica' ? 'musica_grad' : 'artes_cenicas') ? true : 'Precisa de um grupo, uma banda ou um curso sério para isso.';

/** Trilha → frente que o trabalho da família ensina. */
const OFICIO_DA_TRILHA: Record<string, Dominio> = {
  mecanica: 'manual', manutencao: 'manual', eletrica: 'manual', construcao: 'manual', beleza: 'beleza', alimentacao: 'cozinha',
  confeitaria: 'cozinha', comercio: 'vendas', informal: 'vendas', agro: 'campo', campo: 'campo', pesca: 'campo', artesanato: 'manual', marcenaria: 'manual', hidraulica: 'manual', costura: 'manual'
};

/** Um adulto da família com um ofício que se aprende ajudando. */
export function oficioDaFamilia(v: Vida): { nome: string; trilha: string; dominio: Dominio; pessoaId: string } | undefined {
  for (const p of parentes(v, 'mae', 'pai', 'avo', 'tio', 'padrasto', 'madrasta')) {
    const oc = p.ocupacaoId ? ocupacaoOuNula(p.ocupacaoId) : undefined;
    if (!oc || p.municipioId !== v.moradia.municipioId || p.renda === 0) continue;
    const d = OFICIO_DA_TRILHA[oc.trilha];
    if (d && (oc.contrato === 'autonomo' || oc.contrato === 'informal' || oc.entrada === 'negocio')) return { nome: p.nome, trilha: oc.trilha, dominio: d, pessoaId: p.id };
  }
  return undefined;
}

const melhorDe = (v: Vida, ds: Dominio[]) => Math.max(...ds.map(d => habilidade(v, d)));

/* --------------------------------------------------------------- Catálogo */

export const ROTINAS: readonly ModeloRotina[] = [
  // ------------------------------------------------------------- esporte
  {
    id: 'futebol', nome: 'Jogar bola', descricao: 'Pelada no campinho, futsal na quadra, time do bairro.', categoria: 'esporte', idadeMin: 5,
    niveis: [
      { rotulo: 'Pelada, por diversão', tempo: 0.5, custo: 0, qualidade: 0.8 },
      // Todo bairro tem um time: o futebol regular não depende de dinheiro em casa (a chuteira, sim, um pouco).
      { rotulo: 'Escolinha ou time do bairro', tempo: 1, custo: 40, qualidade: 1.1 },
      { rotulo: 'Treino de base, todo dia', tempo: 2, custo: 0, qualidade: 1.45, requer: naBase('futebol') }
    ],
    pratica: { futebol: 1 }, social: { onde: 'no futebol', fluxo: 1.2, amplitude: 4 },
    efeito: (v, _r, n) => { v.corpo.forma = clamp(v.corpo.forma + 5 + n * 3); }
  },
  {
    id: 'volei', nome: 'Vôlei', descricao: 'Quadra da escola, treino de equipe.', categoria: 'esporte', idadeMin: 8,
    oferta: v => cidade(v) >= 1 || escolaPrivada(v) || janela(v, 'volei', 0.55),
    niveis: [
      { rotulo: 'Na quadra, com a turma', tempo: 0.5, custo: 0, qualidade: 0.8 },
      { rotulo: 'Treino em equipe', tempo: 1, custo: 80, qualidade: 1.15, requer: pago(80, 'volei') },
      { rotulo: 'Equipe de competição', tempo: 1.8, custo: 0, qualidade: 1.4, requer: naBase('volei') }
    ],
    pratica: { volei: 1 }, social: { onde: 'no vôlei', fluxo: 1, amplitude: 4 },
    efeito: (v, _r, n) => { v.corpo.forma = clamp(v.corpo.forma + 4 + n * 3); }
  },
  {
    id: 'natacao', nome: 'Natação', descricao: 'Piscina do clube, do SESC ou da prefeitura.', categoria: 'esporte', idadeMin: 4,
    oferta: v => cidade(v) >= 1 || janela(v, 'natacao', 0.35),
    niveis: [
      { rotulo: 'Aulas de natação', tempo: 1, custo: 150, qualidade: 1, requer: pago(150, 'natacao') },
      { rotulo: 'Equipe de natação', tempo: 1.6, custo: 120, qualidade: 1.3, requer: pago(120, 'natacao', v => (habilidade(v, 'natacao') >= 42 ? true : 'A equipe só aceita quem já nada bem.')) },
      { rotulo: 'Treino de alto rendimento', tempo: 2, custo: 0, qualidade: 1.45, requer: naBase('natacao') }
    ],
    pratica: { natacao: 1 }, social: { onde: 'na natação', fluxo: 0.6, amplitude: 4 },
    efeito: (v, _r, n) => { v.corpo.forma = clamp(v.corpo.forma + 5 + n * 3); }
  },
  {
    id: 'atletismo', nome: 'Atletismo', descricao: 'Pista, corrida, salto. Projeto da escola ou clube.', categoria: 'esporte', idadeMin: 9, idadeMax: 40,
    oferta: v => cidade(v) >= 2 || janela(v, 'atletismo', 0.45),
    niveis: [
      { rotulo: 'Correr com a turma', tempo: 0.5, custo: 0, qualidade: 0.85 },
      { rotulo: 'Treino de atletismo', tempo: 1, custo: 40, qualidade: 1.2 },
      { rotulo: 'Equipe de competição', tempo: 1.8, custo: 0, qualidade: 1.4, requer: naBase('atletismo') }
    ],
    pratica: { atletismo: 1 }, social: { onde: 'no atletismo', fluxo: 0.6, amplitude: 4 },
    efeito: (v, _r, n) => { v.corpo.forma = clamp(v.corpo.forma + 5 + n * 3); }
  },
  {
    id: 'lutas', nome: 'Arte marcial', descricao: 'Judô, jiu-jítsu, karatê ou capoeira.', categoria: 'esporte', idadeMin: 6,
    oferta: v => cidade(v) >= 1 || janela(v, 'lutas', 0.6),
    niveis: [
      { rotulo: 'Aulas', tempo: 1, custo: 110, qualidade: 1.1, requer: pago(110, 'lutas') },
      { rotulo: 'Treino de competição', tempo: 1.5, custo: 130, qualidade: 1.3, requer: pago(130, 'lutas', v => (habilidade(v, 'lutas') >= 42 ? true : 'Competição é para quem já tem algumas faixas.')) }
    ],
    pratica: { lutas: 1 }, social: { onde: 'no tatame', fluxo: 0.8, amplitude: 5 }, comportamento: { disciplina: 1 },
    efeito: (v, _r, n) => { v.corpo.forma = clamp(v.corpo.forma + 5 + n * 3); }
  },
  {
    id: 'academia', nome: 'Academia', descricao: 'Musculação e esteira, três vezes por semana.', categoria: 'corpo', idadeMin: 15,
    niveis: [{ rotulo: 'Três vezes por semana', tempo: 1, custo: 110 }],
    social: { onde: 'na academia', fluxo: 0.5, amplitude: 10 }, comportamento: { disciplina: 1 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 11); v.corpo.aparencia = clamp(v.corpo.aparencia + 2); }
  },
  {
    id: 'corrida', nome: 'Correr ou caminhar', descricao: 'Na praça, na orla, no parque. De graça.', categoria: 'corpo', idadeMin: 12,
    niveis: [{ rotulo: 'Algumas vezes por semana', tempo: 0.5, custo: 0 }],
    comportamento: { disciplina: 1 }, pratica: { atletismo: 0.25 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 7); }
  },

  // ---------------------------------------------------------------- arte
  {
    id: 'musica', nome: 'Tocar um instrumento', descricao: 'Violão, teclado, bateria, cavaquinho.', categoria: 'arte', idadeMin: 6,
    niveis: [
      { rotulo: 'Tocar em casa, por conta', tempo: 0.5, custo: 0, qualidade: 0.75 },
      { rotulo: 'Aulas de instrumento', tempo: 1, custo: 140, qualidade: 1.2, requer: pago(140, 'musica') },
      { rotulo: 'Ensaiar a sério', tempo: 1.6, custo: 50, qualidade: 1.35, requer: comProjeto('musica', 60) }
    ],
    pratica: { musica: 1 }, social: { onde: 'na música', fluxo: 0.6, amplitude: 8 }, comportamento: { disciplina: 1 },
    efeito: v => { marcarAnos(v, 'musica'); }
  },
  {
    id: 'danca', nome: 'Dança', descricao: 'Balé, jazz, forró, hip-hop, dança de salão.', categoria: 'arte', idadeMin: 4,
    niveis: [
      { rotulo: 'Aulas de dança', tempo: 1, custo: 150, qualidade: 1.1, requer: pago(150, 'danca') },
      { rotulo: 'Grupo ou companhia', tempo: 1.6, custo: 180, qualidade: 1.35, requer: pago(180, 'danca', v => (habilidade(v, 'danca') >= 48 ? true : 'O grupo pede quem já dança bem.')) }
    ],
    pratica: { danca: 1 }, social: { onde: 'nas aulas de dança', fluxo: 1, amplitude: 5 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 6); v.corpo.aparencia = clamp(v.corpo.aparencia + 1); }
  },
  {
    id: 'teatro', nome: 'Teatro', descricao: 'Grupo da escola, da igreja ou um curso livre.', categoria: 'arte', idadeMin: 9,
    oferta: v => cidade(v) >= 1 || janela(v, 'teatro', 0.5) || !!v.caminhos.frentes.teatro,
    niveis: [
      { rotulo: 'Grupo da escola ou do bairro', tempo: 0.5, custo: 0, qualidade: 0.9 },
      { rotulo: 'Curso livre de teatro', tempo: 1, custo: 160, qualidade: 1.2, requer: pago(160, 'teatro', v => (cidade(v) >= 1 ? true : 'Não há curso de teatro na cidade.')) },
      { rotulo: 'Grupo de teatro, ensaio sério', tempo: 1.5, custo: 40, qualidade: 1.35, requer: comProjeto('teatro', 58) }
    ],
    pratica: { teatro: 1, linguagens: 0.2 }, social: { onde: 'no teatro', fluxo: 1, amplitude: 6 }, comportamento: { coragem: 1 }
  },
  {
    id: 'desenho', nome: 'Desenhar', descricao: 'Caderno, lápis, depois tablet.', categoria: 'arte', idadeMin: 5,
    niveis: [
      { rotulo: 'Por conta própria', tempo: 0.5, custo: 15, qualidade: 0.85 },
      { rotulo: 'Curso de desenho', tempo: 1, custo: 130, qualidade: 1.2, requer: pago(130, 'desenho') }
    ],
    pratica: { desenho: 1 }
  },
  {
    id: 'escrever', nome: 'Escrever', descricao: 'Contos, poemas, um blog, um caderno que ninguém lê.', categoria: 'arte', idadeMin: 10,
    niveis: [
      { rotulo: 'Por conta própria', tempo: 0.5, custo: 0, qualidade: 0.9 },
      { rotulo: 'Oficina literária', tempo: 1, custo: 90, qualidade: 1.2, requer: v => (cidade(v) >= 1 || idade(v) >= 18 ? true : 'Não há oficina na cidade.') }
    ],
    pratica: { escrita: 1, linguagens: 0.3 }
  },
  {
    id: 'fotografia', nome: 'Fotografar', descricao: 'Primeiro o celular, depois uma câmera usada.', categoria: 'arte', idadeMin: 13,
    niveis: [
      { rotulo: 'Por conta própria', tempo: 0.5, custo: 20, qualidade: 0.85 },
      { rotulo: 'Curso de fotografia', tempo: 1, custo: 180, qualidade: 1.2, requer: pago(180, 'fotografia') }
    ],
    pratica: { fotografia: 1 }
  },
  {
    id: 'criar_conteudo', nome: 'Fazer vídeos para a internet', descricao: 'Gravar, editar, postar. Quase ninguém assiste no começo.', categoria: 'arte', idadeMin: 13,
    niveis: [
      { rotulo: 'De vez em quando', tempo: 0.5, custo: 0, qualidade: 0.8 },
      { rotulo: 'Toda semana', tempo: 1, custo: 60, qualidade: 1.1 },
      { rotulo: 'Como trabalho', tempo: 1.8, custo: 120, qualidade: 1.3, requer: v => ((v.fatos['audiencia'] ?? 0) >= 35 ? true : 'Ainda não há gente assistindo para isso virar trabalho.') }
    ],
    pratica: { fotografia: 0.5, escrita: 0.3 },
    efeito: (v, r, n) => { v.fatos['audiencia'] = clamp(Math.round((v.fatos['audiencia'] ?? 0) + (n * 2.5 + habilidade(v, 'fotografia') / 20 + v.personalidade.tracos.sociabilidade / 40) * (0.4 + r.next() * 1.2) - 2)); }
  },

  // --------------------------------------------------------------- estudo
  {
    id: 'leitura', nome: 'Ler', descricao: 'Livros emprestados, da biblioteca ou do celular.', categoria: 'estudo', idadeMin: 7,
    niveis: [{ rotulo: 'Um livro por mês', tempo: 0.5, custo: 30 }],
    pratica: { linguagens: 0.5, escrita: 0.25, humanas: 0.3 },
    efeito: v => { v.mente.cognicao = clamp(v.mente.cognicao + 1); }
  },
  {
    id: 'ingles', nome: 'Inglês', descricao: 'Séries, aplicativos, um curso de idiomas.', categoria: 'estudo', idadeMin: 8,
    niveis: [
      { rotulo: 'Séries e aplicativos', tempo: 0.5, custo: 0, qualidade: 0.7 },
      { rotulo: 'Curso de inglês', tempo: 1, custo: 260, qualidade: 1.2, requer: pago(260, 'ingles') }
    ],
    pratica: { idiomas: 1 }, social: { onde: 'no curso de inglês', fluxo: 0.5, amplitude: 6 }, comportamento: { disciplina: 1 },
    efeito: v => { if (habilidade(v, 'idiomas') >= 55 && !temFato(v, 'fala_ingles')) { marcarFato(v, 'fala_ingles'); escrever(v, { texto: 'O inglês ficou de verdade: já dá para conversar sem travar.', relevancia: 'biografia', tema: 'estudo', tom: 'bom' }); } }
  },
  {
    id: 'xadrez', nome: 'Xadrez', descricao: 'Tabuleiro na escola, partidas online, torneios.', categoria: 'estudo', idadeMin: 6,
    niveis: [
      { rotulo: 'Jogar por gosto', tempo: 0.5, custo: 0, qualidade: 0.9 },
      { rotulo: 'Clube de xadrez', tempo: 1, custo: 30, qualidade: 1.25, requer: v => (cidade(v) >= 1 || janela(v, 'clube_xadrez', 0.5) ? true : 'Não há clube de xadrez perto.') }
    ],
    pratica: { xadrez: 1, exatas: 0.25 }, social: { onde: 'no xadrez', fluxo: 0.5, amplitude: 5 }
  },
  {
    id: 'programacao', nome: 'Programar', descricao: 'Tutoriais, joguinhos, sites. Depois, coisa séria.', categoria: 'estudo', idadeMin: 10,
    requer: v => (pc(v) >= 900 || !moraComFamiliaDeOrigem(v) || janela(v, 'telecentro', 0.5) ? true : 'Não tem computador em casa.'),
    niveis: [
      { rotulo: 'Por conta, com tutoriais', tempo: 0.5, custo: 0, qualidade: 0.85 },
      { rotulo: 'Curso de programação', tempo: 1, custo: 160, qualidade: 1.2, requer: pago(160, 'programacao') }
    ],
    pratica: { programacao: 1, exatas: 0.25 }
  },
  {
    id: 'clube_ciencias', nome: 'Clube de ciências e robótica', descricao: 'Feira de ciências, olimpíada, robô de sucata.', categoria: 'estudo', idadeMin: 10, idadeMax: 17,
    requer: v => (naEscola(v) ? true : 'É uma atividade da escola.'),
    oferta: v => janela(v, 'clube_ciencias', escolaPrivada(v) ? 0.75 : 0.4),
    niveis: [{ rotulo: 'Depois da aula', tempo: 0.5, custo: 0 }],
    pratica: { ciencias: 0.8, exatas: 0.4, programacao: 0.3 }, social: { onde: 'no clube de ciências', fluxo: 0.6, amplitude: 2 }
  },
  {
    id: 'cursinho', nome: 'Cursinho pré-vestibular', descricao: 'Aulas para o ENEM. Ajuda muito na nota.', categoria: 'estudo', idadeMin: 16,
    niveis: [{ rotulo: 'Todas as noites', tempo: 1, custo: 0 }],
    social: { onde: 'no cursinho', fluxo: 1, amplitude: 3 },
    requer: v => (v.educacao.matricula ? 'Já está fazendo faculdade.' : true),
    pratica: { exatas: 0.5, linguagens: 0.5, ciencias: 0.5, humanas: 0.5 },
    efeito: v => { v.educacao.cursinho = true; }
  },
  {
    id: 'estudar_concurso', nome: 'Estudar para concurso', descricao: 'Apostilas, videoaulas e simulados à noite.', categoria: 'estudo', idadeMin: 17,
    niveis: [
      { rotulo: 'Um pouco, à noite', tempo: 0.5, custo: 60 },
      { rotulo: 'Estudo firme', tempo: 1, custo: 180 },
      { rotulo: 'Rotina de concurseiro', tempo: 1.8, custo: 280, requer: v => (v.trabalho.atual?.carga === 'integral' ? 'Com trabalho integral não sobra tempo para estudar o dia inteiro.' : true) }
    ],
    pratica: { linguagens: 0.4, humanas: 0.4, exatas: 0.3 }, comportamento: { disciplina: 1 },
    efeito: (v, _r, n) => {
      marcarFato(v, 'estudando_concurso');
      v.caminhos.concurso.meses += [6, 12, 20][n - 1];
    }
  },

  // --------------------------------------------------------------- social
  {
    id: 'gremio', nome: 'Grêmio estudantil', descricao: 'Reunião, eleição, festa junina, briga com a diretoria.', categoria: 'social', idadeMin: 12, idadeMax: 18,
    requer: v => (v.educacao.basica && ['fundamental2', 'medio'].includes(v.educacao.basica.etapa) ? true : 'É coisa da escola.'),
    niveis: [{ rotulo: 'Participar', tempo: 0.5, custo: 0 }],
    pratica: { lideranca: 1.2, linguagens: 0.2 }, social: { onde: 'no grêmio', fluxo: 1, amplitude: 3 }, comportamento: { sociabilidade: 1 }
  },
  {
    id: 'igreja', nome: 'Frequentar a igreja', descricao: 'Cultos ou missas, grupo de jovens, festas da comunidade.', categoria: 'social', idadeMin: 0,
    niveis: [{ rotulo: 'Toda semana', tempo: 0.5, custo: 0 }],
    pratica: { comunidade: 0.4 }, social: { onde: 'na igreja', fluxo: 1.2, amplitude: 25 }
  },
  {
    id: 'voluntariado', nome: 'Voluntariado', descricao: 'ONG, cozinha comunitária, projeto social do bairro.', categoria: 'social', idadeMin: 14,
    niveis: [{ rotulo: 'Algumas vezes por mês', tempo: 0.5, custo: 0 }, { rotulo: 'Toda semana, com responsabilidade', tempo: 1, custo: 0 }],
    pratica: { comunidade: 1, lideranca: 0.3 }, social: { onde: 'no voluntariado', fluxo: 0.8, amplitude: 25 }, comportamento: { generosidade: 1, empatia: 1 }
  },
  {
    id: 'sair_noite', nome: 'Sair à noite', descricao: 'Bar, balada, show. Gente nova toda semana.', categoria: 'lazer', idadeMin: 18,
    niveis: [{ rotulo: 'Fins de semana', tempo: 1, custo: 280 }],
    social: { onde: 'na noite', fluxo: 1.5, amplitude: 8 }, comportamento: { sociabilidade: 1 },
    efeito: (v, r) => {
      v.corpo.saude = clamp(v.corpo.saude - 1);
      if (v.corpo.habitos.bebe === 'nao' && r.chance(0.35)) v.corpo.habitos.bebe = 'social';
      else if (v.corpo.habitos.bebe === 'social' && r.chance(0.06 + Math.max(0, v.personalidade.tracos.impulsividade) / 400)) v.corpo.habitos.bebe = 'muito';
    }
  },
  {
    id: 'videogame', nome: 'Jogar videogame', descricao: 'Horas no console, no PC ou no celular.', categoria: 'lazer', idadeMin: 6,
    niveis: [{ rotulo: 'Umas horas por semana', tempo: 0.5, custo: 50 }],
    social: { onde: 'jogando online', fluxo: 0.4, amplitude: 6 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma - 2); }
  },
  {
    id: 'terapia', nome: 'Terapia', descricao: 'Sessão semanal com psicólogo (particular ou pelo SUS, com fila).', categoria: 'cuidado', idadeMin: 12,
    niveis: [{ rotulo: 'Uma sessão por semana', tempo: 0.5, custo: 280 }],
    efeito: v => {
      for (const c of v.corpo.condicoes) if (c.id === 'depressao' || c.id === 'ansiedade') c.tratando = true;
    }
  },
  {
    id: 'tempo_familia', nome: 'Tempo com a família', descricao: 'Almoço de domingo, dever de casa junto, passeio. Tempo que não volta.', categoria: 'cuidado', idadeMin: 18,
    niveis: [{ rotulo: 'Todo fim de semana', tempo: 1, custo: 0 }],
    requer: v => (filhos(v).some(f => v.vinculos[f.id].convivio.includes('casa')) || parceiro(v) ? true : 'Precisa ter parceiro ou filhos em casa.'),
    comportamento: { familia: 1 },
    efeito: v => {
      for (const f of filhos(v)) v.vinculos[f.id].proximidade = clamp(v.vinculos[f.id].proximidade + 5);
      const par = parceiro(v);
      if (par?.vin.romance) par.vin.romance.envolvimento = clamp(par.vin.romance.envolvimento + 6);
    }
  },

  // ---------------------------------------------------------------- ofício
  {
    id: 'ajudar_familia', nome: 'Ajudar no trabalho da família', descricao: 'Oficina, salão, barraca, roça: aprender olhando e fazendo.', categoria: 'oficio', idadeMin: 12, idadeMax: 17,
    requer: v => (oficioDaFamilia(v) ? true : 'Ninguém da família tem um negócio ou ofício por perto.'),
    oferta: v => !!oficioDaFamilia(v),
    irregular: v => (idade(v) < 14 ? 'Ajudar a família é comum, mas trabalho antes dos 14 é proibido. Com moderação.' : undefined),
    niveis: [{ rotulo: 'Nas férias e fins de semana', tempo: 0.5, custo: 0 }, { rotulo: 'Todas as tardes', tempo: 1, custo: 0 }],
    comportamento: { disciplina: 1, familia: 1 },
    efeito: (v, r, n) => {
      const o = oficioDaFamilia(v);
      if (!o) return;
      praticar(v, r, o.dominio, n === 2 ? 1.1 : 0.6, 1.15);
      if (idade(v) >= 14) v.trabalho.experiencia[o.trilha] = (v.trabalho.experiencia[o.trilha] ?? 0) + (n === 2 ? 6 : 3);
      v.financas.conta += n === 2 ? 1800 : 700;
      if (v.educacao.basica && n === 2) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - 3);
    }
  },
  {
    id: 'cozinhar', nome: 'Cozinhar', descricao: 'Receita de avó, vídeo da internet, almoço de domingo.', categoria: 'oficio', idadeMin: 11,
    niveis: [{ rotulo: 'Quando dá', tempo: 0.5, custo: 30 }],
    pratica: { cozinha: 1 }
  },
  {
    id: 'consertar', nome: 'Mexer com conserto', descricao: 'Bicicleta, motor, ventilador, tomada. Desmontar para entender.', categoria: 'oficio', idadeMin: 12,
    niveis: [{ rotulo: 'Quando aparece', tempo: 0.5, custo: 20 }],
    pratica: { manual: 1 }
  },
  {
    id: 'cortar_cabelo', nome: 'Cortar cabelo', descricao: 'Primeiro do irmão, depois dos amigos, depois de quem paga.', categoria: 'oficio', idadeMin: 13,
    niveis: [{ rotulo: 'Dos amigos', tempo: 0.5, custo: 20 }],
    pratica: { beleza: 1 }
  },

  // ------------------------------------------------------------ renda por fora
  {
    id: 'bico', nome: 'Fazer bicos', descricao: 'Trabalho avulso nos fins de semana: entrega, evento, faxina, obra.', categoria: 'renda', idadeMin: 16,
    niveis: [{ rotulo: 'Fins de semana', tempo: 1, custo: 0 }],
    renda: () => 750,
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 1); }
  },
  {
    id: 'tocar_na_noite', nome: 'Tocar em bares e festas', descricao: 'Voz e violão, banda de baile, casamento. Paga por noite.', categoria: 'renda', idadeMin: 16,
    requer: v => (habilidade(v, 'musica') >= 50 ? true : 'Ainda não toca o bastante para alguém pagar.'),
    niveis: [{ rotulo: 'Alguns fins de semana', tempo: 0.5, custo: 0 }, { rotulo: 'Quase todo fim de semana', tempo: 1, custo: 0 }],
    pratica: { musica: 0.6 }, social: { onde: 'tocando na noite', fluxo: 0.8, amplitude: 10 },
    renda: (v, n) => Math.round((n === 2 ? 1100 : 500) * (0.5 + habilidade(v, 'musica') / 100))
  },
  {
    id: 'encomendas', nome: 'Aceitar encomendas de comida', descricao: 'Bolo, marmita, salgado para festa. Primeiro para conhecidos.', categoria: 'renda', idadeMin: 15,
    requer: v => (habilidade(v, 'cozinha') >= 38 ? true : 'Ainda não cozinha o bastante para vender.'),
    niveis: [{ rotulo: 'Quando pedem', tempo: 0.5, custo: 0 }, { rotulo: 'Toda semana', tempo: 1, custo: 0 }],
    pratica: { cozinha: 0.6, vendas: 0.3 },
    renda: (v, n) => Math.round((n === 2 ? 1000 : 450) * (0.5 + habilidade(v, 'cozinha') / 100))
  },
  {
    id: 'consertos', nome: 'Fazer consertos por fora', descricao: 'Instalação, reparo, manutenção para vizinhos e conhecidos.', categoria: 'renda', idadeMin: 16,
    requer: v => (habilidade(v, 'manual') >= 40 ? true : 'Ainda não tem mão para cobrar por isso.'),
    niveis: [{ rotulo: 'Quando chamam', tempo: 0.5, custo: 0 }, { rotulo: 'Toda semana', tempo: 1, custo: 0 }],
    pratica: { manual: 0.6 },
    renda: (v, n) => Math.round((n === 2 ? 1100 : 500) * (0.5 + habilidade(v, 'manual') / 100))
  },
  {
    id: 'cortes_por_fora', nome: 'Cortar cabelo por fora', descricao: 'Na garagem, em casa, na casa do cliente.', categoria: 'renda', idadeMin: 16,
    requer: v => (habilidade(v, 'beleza') >= 38 ? true : 'Ainda não corta o bastante para cobrar.'),
    niveis: [{ rotulo: 'Fins de semana', tempo: 0.5, custo: 0 }],
    pratica: { beleza: 0.6 },
    renda: v => Math.round(600 * (0.5 + habilidade(v, 'beleza') / 100))
  },
  {
    id: 'freelas', nome: 'Pegar freelas', descricao: 'Arte, foto, texto ou código para quem encomenda.', categoria: 'renda', idadeMin: 16,
    requer: v => (melhorDe(v, ['desenho', 'fotografia', 'escrita', 'programacao']) >= 55 ? true : 'Ainda não tem trabalho para mostrar.'),
    niveis: [{ rotulo: 'Um ou outro', tempo: 0.5, custo: 0 }, { rotulo: 'Toda semana', tempo: 1, custo: 0 }],
    renda: (v, n) => Math.round((n === 2 ? 1400 : 600) * (0.5 + melhorDe(v, ['desenho', 'fotografia', 'escrita', 'programacao']) / 100))
  },
  {
    id: 'aulas_particulares', nome: 'Dar aulas particulares', descricao: 'Reforço, idioma ou instrumento, por hora.', categoria: 'renda', idadeMin: 16,
    requer: v => (melhorDe(v, ['exatas', 'linguagens', 'idiomas', 'musica']) >= 62 ? true : 'Ainda não sabe o bastante para ensinar.'),
    niveis: [{ rotulo: 'Algumas horas', tempo: 0.5, custo: 0 }],
    pratica: { lideranca: 0.2 },
    renda: v => Math.round(550 * (0.5 + melhorDe(v, ['exatas', 'linguagens', 'idiomas', 'musica']) / 100))
  },
  {
    id: 'vender_doces', nome: 'Vender doces na rua', descricao: 'Bala, brigadeiro, paçoca no semáforo ou na porta da escola.', categoria: 'renda', idadeMin: 8, idadeMax: 15,
    niveis: [{ rotulo: 'Depois da aula', tempo: 1, custo: 0 }],
    requer: v => (moraComFamiliaDeOrigem(v) ? true : 'Só faz sentido morando com a família.'),
    irregular: () => 'Trabalho infantil é proibido. Acontece — e tem consequência.',
    pratica: { vendas: 0.5 },
    renda: () => 220,
    efeito: (v, r) => {
      if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - 8);
      if (!temFato(v, 'conselho_tutelar') && r.chance(0.25)) {
        marcarFato(v, 'conselho_tutelar');
        escrever(v, { texto: 'O Conselho Tutelar apareceu em casa depois de alguém denunciar criança trabalhando na rua. A família levou uma advertência.', relevancia: 'biografia', tema: 'familia', tom: 'ruim' });
      }
    }
  }
];

const POR_ID = new Map(ROTINAS.map(r => [r.id, r]));
export const modeloRotina = (id: string) => POR_ID.get(id);

export const nivelDa = (r: Rotina) => (r.nivel ?? 1) as 1 | 2 | 3;
export function nivelModelo(m: ModeloRotina, n: number): NivelRotina {
  return m.niveis[Math.min(m.niveis.length, Math.max(1, n)) - 1];
}
export const tempoDaRotina = (r: Rotina) => {
  const m = modeloRotina(r.id);
  return m ? nivelModelo(m, nivelDa(r)).tempo : 0;
};

for (const r of ROTINAS) if (r.social) ROTINAS_SOCIAIS[r.id] = r.social;
CUSTO_ROTINA.de = (_v, rot) => { const m = modeloRotina(rot.id); return m ? nivelModelo(m, nivelDa(rot)).custo : 0; };
CUSTO_ROTINA.rotulo = rot => { const m = modeloRotina(rot.id); if (!m) return rot.id; return m.niveis.length > 1 ? `${m.nome} (${nivelModelo(m, nivelDa(rot)).rotulo.toLowerCase()})` : m.nome; };

function marcarAnos(v: Vida, chave: string): number {
  const k = `anos_${chave}`;
  v.fatos[k] = (v.fatos[k] ?? 0) + 1;
  return v.fatos[k];
}

/* ------------------------------------------------------- Disponibilidade */

/** A atividade existe para esta pessoa, aqui e agora (mesmo que não caiba)? */
/** O que cabe numa unidade prisional (ler, escrever, desenhar, xadrez, o culto). */
export const NA_PRISAO = new Set(['leitura', 'escrever', 'desenho', 'xadrez', 'igreja']);

export function atividadeExiste(v: Vida, m: ModeloRotina): boolean {
  const i = idade(v);
  if (v.justica?.prisao && !NA_PRISAO.has(m.id)) return false;
  if (i < m.idadeMin || (m.idadeMax && i > m.idadeMax)) return false;
  if (v.rotinas.some(r => r.id === m.id)) return true;
  if (v.caminhos.frentes && m.pratica && Object.keys(m.pratica).some(d => (v.caminhos.frentes[d as Dominio]?.meses ?? 0) >= 12)) return true;
  return m.oferta ? m.oferta(v) : true;
}

/**
 * Pode começar a atividade (no nível pedido)? O tempo vem da MESMA conta
 * que a interface mostra (`semana`).
 */
export function podeComecarRotina(v: Vida, id: string, nivel = 1): Veredito {
  const m = modeloRotina(id);
  if (!m) return bloqueio('impossivel', 'Atividade desconhecida.');
  const i = idade(v);
  if (i < m.idadeMin) return bloqueio('impossivel', `A partir dos ${m.idadeMin} anos.`);
  if (m.idadeMax && i > m.idadeMax) return bloqueio('impossivel', 'Não é para a sua idade.');
  if (!atividadeExiste(v, m)) return bloqueio('impossivel', 'Não há isso por aqui agora.');
  const atual = v.rotinas.find(r => r.id === id);
  if (atual && nivelDa(atual) === nivel) return bloqueio('incompativel', 'Já faz parte da sua semana.');
  if (nivel > m.niveis.length) return bloqueio('impossivel', 'Não há esse ritmo.');
  const req = m.requer?.(v);
  if (typeof req === 'string') return bloqueio('requisito', req);
  const n = nivelModelo(m, nivel);
  const reqNivel = n.requer?.(v);
  if (typeof reqNivel === 'string') return bloqueio('requisito', reqNivel);
  const cabe = cabeNaSemana(v, n.tempo - (atual ? tempoDaRotina(atual) : 0), id);
  if (!cabe.cabe) return bloqueio('incompativel', cabe.motivo);
  if (i < 12 && n.custo > 60 && !casaPaga(v, n.custo) && !projetoSocial(v, id)) return bloqueio('requisito', semDinheiro);
  const irr = m.irregular?.(v);
  if (irr) return { grau: 'irregular', motivo: irr };
  return { grau: 'permitido' };
}

/* ---------------------------------------------------------------- O ano */

export function processarRotinas(v: Vida, r: Rng): void {
  const praticadas = new Set<Dominio>();
  for (const rot of [...v.rotinas]) {
    const m = modeloRotina(rot.id);
    if (!m) { v.rotinas = v.rotinas.filter(x => x !== rot); continue; }
    const i = idade(v);
    if (i < m.idadeMin || (m.idadeMax && i > m.idadeMax)) {
      v.rotinas = v.rotinas.filter(x => x.id !== rot.id);
      if (m.pratica && v.t - rot.tInicio >= 24) {
        escrever(v, { texto: m.idadeMax && i > m.idadeMax ? `${m.nome} ficou para trás junto com a escola.` : `${m.nome} deixou de fazer parte da semana.`, relevancia: 'cotidiano', tema: 'lazer' });
      }
      continue;
    }
    // O nível pedido deixou de ser possível (a base acabou, a banda acabou): volta um degrau, e o jogo conta.
    let n = nivelDa(rot);
    while (n > 1 && typeof nivelModelo(m, n).requer?.(v) === 'string') n -= 1;
    if (n !== nivelDa(rot)) {
      rot.nivel = n as 1 | 2 | 3;
      escrever(v, { texto: `${m.nome}: ${nivelModelo(m, n).rotulo.toLowerCase()}, agora.`, relevancia: 'tecnico', tema: 'lazer' });
    }
    const nm = nivelModelo(m, n);
    const peso = n === 1 ? 0.5 : n === 2 ? 1 : 1.6;
    if (m.pratica) {
      for (const [d, w] of Object.entries(m.pratica) as [Dominio, number][]) {
        praticar(v, r, d, peso * w, nm.qualidade ?? 1);
        praticadas.add(d);
      }
    }
    m.efeito?.(v, r, n);
    if (m.comportamento && v.t - rot.tInicio >= 12) aplicarPersonalidade(v, `rotina:${m.id}`, m.comportamento);
    const renda = m.renda?.(v, n);
    if (renda) v.financas.conta += Math.round(renda * 12 * (0.8 + r.next() * 0.4));
  }
  // Frentes praticadas por outras vias (escola, curso, trabalho) são registradas por quem as pratica.
  for (const [d, f] of Object.entries(v.caminhos.frentes)) if (f && v.t - f.tUltimo < 12) praticadas.add(d as Dominio);
  esquecerFrentes(v, praticadas);
  v.corpo.habitos.sedentario = !v.rotinas.some(x => ['futebol', 'academia', 'corrida', 'danca', 'volei', 'natacao', 'atletismo', 'lutas'].includes(x.id)) && idade(v) >= 12;
  if (!v.rotinas.some(x => x.id === 'cursinho')) v.educacao.cursinho = false;
  if (!v.rotinas.some(x => x.id === 'estudar_concurso')) delete v.fatos['estudando_concurso'];
}
