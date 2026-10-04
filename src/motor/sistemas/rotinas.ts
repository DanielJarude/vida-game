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

import { paisCorrente } from '../mundo/moeda';
import { bonusDaAtividade } from './coisas';
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
import { encaixe } from './semana';
import type { Categoria } from '../dados/frentes';
import { categoriaDoVeiculo } from './veiculos';
import { esfriarPreparo, prepararVestibular } from './vestibular';
import { diagnosticar, encaminhado } from './saude';

import { modeloFrente } from '../dados/frentes';
import { anoDaAtividade, ofereceAqui } from './formacao';
import { cursoOuNulo } from '../dados/cursos';
import { textoLocal, type ChaveLocal } from '../mundo/locais';
import { lugarDe, noEscopo, type Escopo } from '../mundo/escopo';
import { regrasDaVida } from '../mundo/regras';
import { educacaoDaVida, perfilDaVida } from '../mundo/vida';
import { redeDeSaude } from './saude';

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
  /** A descrição universal (vale em qualquer país); o que muda com o lugar vem de `local` (`mundo/locais`) ou é função. */
  descricao: string | ((v: Vida) => string);
  /** A descrição tem variante por lugar (o SESC no Brasil, a YMCA nos EUA; o universal em todo o resto). */
  local?: ChaveLocal;
  /** Onde a atividade existe (ausente: em todo lugar). */
  escopo?: Escopo;
  /** A atividade só existe onde o SISTEMA do país a tem (o concurso, a prova de ingresso) — vale antes de qualquer prática. */
  existeNoPais?: (v: Vida) => boolean;
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
    // FIX pós-playtest humano (auditoria Mundo): "pelada" e "campinho" são do Brasil — no resto do mundo, a bola na rua.
    id: 'futebol', nome: 'Jogar bola', descricao: v => (paisCorrente() === 'BR' || !v ? 'Pelada no campinho, futsal na quadra, time do bairro.' : 'Bola na rua ou no parque, futsal na quadra, o time do bairro.'), categoria: 'esporte', idadeMin: 5,
    niveis: [
      { get rotulo() { return paisCorrente() === 'BR' ? 'Pelada, por diversão' : 'Bola com os amigos, por diversão'; }, tempo: 0.5, custo: 0, qualidade: 0.8 },
      // Todo bairro tem um time: o futebol regular não depende de dinheiro em casa (a chuteira, sim, um pouco).
      { rotulo: 'Escolinha ou time do bairro', tempo: 1, custo: 40, qualidade: 1.1 },
      { rotulo: 'Treino de base, todo dia', tempo: 2, custo: 0, qualidade: 1.45, requer: naBase('futebol') }
    ],
    pratica: { futebol: 1 }, social: { onde: 'no futebol', fluxo: 1.2, amplitude: 4 }
  },
  {
    id: 'volei', nome: 'Vôlei', descricao: 'Quadra da escola, treino de equipe.', categoria: 'esporte', idadeMin: 8,
    oferta: v => cidade(v) >= 1 || escolaPrivada(v) || janela(v, 'volei', 0.55),
    niveis: [
      { rotulo: 'Na quadra, com a turma', tempo: 0.5, custo: 0, qualidade: 0.8 },
      { rotulo: 'Treino em equipe', tempo: 1, custo: 80, qualidade: 1.15, requer: pago(80, 'volei') },
      { rotulo: 'Equipe de competição', tempo: 1.8, custo: 0, qualidade: 1.4, requer: naBase('volei') }
    ],
    pratica: { volei: 1 }, social: { onde: 'no vôlei', fluxo: 1, amplitude: 4 }
  },
  {
    id: 'basquete', nome: 'Basquete', descricao: 'Tabela na quadra da escola, clube, equipe de base.', categoria: 'esporte', idadeMin: 8,
    oferta: v => cidade(v) >= 1 || escolaPrivada(v) || janela(v, 'basquete', 0.45),
    niveis: [
      { rotulo: 'Arremessando na quadra', tempo: 0.5, custo: 0, qualidade: 0.8 },
      { rotulo: 'Escolinha ou equipe do clube', tempo: 1, custo: 90, qualidade: 1.15, requer: pago(90, 'basquete') },
      { rotulo: 'Equipe de base, todo dia', tempo: 1.9, custo: 0, qualidade: 1.4, requer: naBase('basquete') }
    ],
    pratica: { basquete: 1 }, social: { onde: 'no basquete', fluxo: 1, amplitude: 4 }
  },
  {
    // Tênis é caro desde cedo: aula, raquete, quadra — e a competição pede treinador e viagem (sem projeto social que cubra).
    id: 'tenis', nome: 'Tênis', descricao: 'Aulas no clube, treino com treinador, torneios.', categoria: 'esporte', idadeMin: 6,
    oferta: v => cidade(v) >= 2 || escolaPrivada(v) || janela(v, 'tenis', 0.3),
    niveis: [
      { rotulo: 'Aulas de tênis', tempo: 0.8, custo: 280, qualidade: 1, requer: pago(280, 'tenis') },
      { rotulo: 'Treino de competição, com treinador', tempo: 1.6, custo: 900, qualidade: 1.3, requer: v => (!casaPaga(v, 900) ? semDinheiro : habilidade(v, 'tenis') >= 40 ? true : 'O treinador só pega quem já troca bola com segurança.') },
      { rotulo: 'Academia de tênis, alto rendimento', tempo: 2.2, custo: 0, qualidade: 1.45, requer: naBase('tenis') }
    ],
    pratica: { tenis: 1 }, social: { onde: 'no tênis', fluxo: 0.6, amplitude: 3 }
  },
  {
    id: 'natacao', nome: 'Natação', descricao: '', local: 'natacao', categoria: 'esporte', idadeMin: 4,
    oferta: v => cidade(v) >= 1 || janela(v, 'natacao', 0.35),
    niveis: [
      { rotulo: 'Aulas de natação', tempo: 1, custo: 150, qualidade: 1, requer: pago(150, 'natacao') },
      { rotulo: 'Equipe de natação', tempo: 1.6, custo: 120, qualidade: 1.3, requer: pago(120, 'natacao', v => (habilidade(v, 'natacao') >= 42 ? true : 'A equipe só aceita quem já nada bem.')) },
      { rotulo: 'Treino de alto rendimento', tempo: 2, custo: 0, qualidade: 1.45, requer: naBase('natacao') }
    ],
    pratica: { natacao: 1 }, social: { onde: 'na natação', fluxo: 0.6, amplitude: 4 }
  },
  {
    id: 'atletismo', nome: 'Atletismo', descricao: 'Pista, corrida, salto. Projeto da escola ou clube.', categoria: 'esporte', idadeMin: 9, idadeMax: 40,
    oferta: v => cidade(v) >= 2 || janela(v, 'atletismo', 0.45),
    niveis: [
      { rotulo: 'Correr com a turma', tempo: 0.5, custo: 0, qualidade: 0.85 },
      { rotulo: 'Treino de atletismo', tempo: 1, custo: 40, qualidade: 1.2 },
      { rotulo: 'Equipe de competição', tempo: 1.8, custo: 0, qualidade: 1.4, requer: naBase('atletismo') }
    ],
    pratica: { atletismo: 1 }, social: { onde: 'no atletismo', fluxo: 0.6, amplitude: 4 }
  },
  {
    id: 'lutas', nome: 'Arte marcial', descricao: '', local: 'lutas', categoria: 'esporte', idadeMin: 6,
    oferta: v => cidade(v) >= 1 || janela(v, 'lutas', 0.6),
    niveis: [
      { rotulo: 'Aulas', tempo: 1, custo: 110, qualidade: 1.1, requer: pago(110, 'lutas') },
      { rotulo: 'Treino de competição', tempo: 1.5, custo: 130, qualidade: 1.3, requer: pago(130, 'lutas', v => (habilidade(v, 'lutas') >= 42 ? true : 'Competição é para quem já tem algumas faixas.')) }
    ],
    pratica: { lutas: 1 }, social: { onde: 'no tatame', fluxo: 0.8, amplitude: 5 }, comportamento: { disciplina: 1 }
  },
  {
    id: 'academia', nome: 'Academia', descricao: 'Musculação e esteira, três vezes por semana.', categoria: 'corpo', idadeMin: 15,
    niveis: [{ rotulo: 'Três vezes por semana', tempo: 1, custo: 110 }],
    // Academia treina o CORPO (condicionamento: `sistemas/pessoa`), não um esporte: não pratica frente nenhuma.
    social: { onde: 'na academia', fluxo: 0.5, amplitude: 10 }, comportamento: { disciplina: 1 }
  },
  {
    id: 'corrida', nome: 'Correr ou caminhar', descricao: '', local: 'corrida', categoria: 'corpo', idadeMin: 12,
    niveis: [{ rotulo: 'Algumas vezes por semana', tempo: 0.5, custo: 0 }],
    comportamento: { disciplina: 1 }, pratica: { atletismo: 0.25 }
  },

  // ---------------------------------------------------------------- arte
  {
    id: 'musica', nome: 'Tocar um instrumento', descricao: '', local: 'musica', categoria: 'arte', idadeMin: 6,
    niveis: [
      { rotulo: 'Tocar em casa, por conta', tempo: 0.5, custo: 0, qualidade: 0.75 },
      { rotulo: 'Aulas de instrumento', tempo: 1, custo: 140, qualidade: 1.2, requer: pago(140, 'musica') },
      { rotulo: 'Ensaiar a sério', tempo: 1.6, custo: 50, qualidade: 1.35, requer: comProjeto('musica', 60) }
    ],
    pratica: { musica: 1 }, social: { onde: 'na música', fluxo: 0.6, amplitude: 8 }, comportamento: { disciplina: 1 },
    efeito: v => { marcarAnos(v, 'musica'); }
  },
  {
    id: 'danca', nome: 'Dança', descricao: '', local: 'danca', categoria: 'arte', idadeMin: 4,
    niveis: [
      { rotulo: 'Aulas de dança', tempo: 1, custo: 150, qualidade: 1.1, requer: pago(150, 'danca') },
      { rotulo: 'Grupo ou companhia', tempo: 1.6, custo: 180, qualidade: 1.35, requer: pago(180, 'danca', v => (habilidade(v, 'danca') >= 48 ? true : 'O grupo pede quem já dança bem.')) }
    ],
    pratica: { danca: 1 }, social: { onde: 'nas aulas de dança', fluxo: 1, amplitude: 5 }
  },
  {
    id: 'teatro', nome: 'Teatro', descricao: 'Grupo da escola, da igreja ou um curso livre.', categoria: 'arte', idadeMin: 9,
    oferta: v => cidade(v) >= 1 || janela(v, 'teatro', 0.5) || !!v.caminhos.frentes.teatro || ofereceAqui(v, 'teatro'),
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
    // Além das matérias, a leitura exercita o aprendizado em geral — devagar e com teto (`sistemas/pessoa`).
    pratica: { linguagens: 0.5, escrita: 0.25, humanas: 0.3 }
  },
  {
    id: 'ingles', nome: 'Inglês', descricao: 'Séries, aplicativos, um curso de idiomas.',
    // Para quem mora num país de língua inglesa, inglês não é atividade de tempo livre: é a língua da rua.
    escopo: { excetoPaises: ['US', 'GB', 'CA', 'AU', 'NZ'] }, categoria: 'estudo', idadeMin: 8,
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
    pratica: { xadrez: 1, exatas: 0.25 }, social: { onde: 'no xadrez', fluxo: 0.5, amplitude: 5 },
    // Na escola, o xadrez tem história: a equipe, os torneios entre escolas (`arcos`).
    efeito: (v, _r, n) => anoDaAtividade(v, 'xadrez', n)
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
    // Existe onde a escola tem laboratório e clube (o perfil da instituição: `formacao`).
    oferta: v => ofereceAqui(v, 'ciencias'),
    niveis: [{ rotulo: 'Depois da aula', tempo: 0.5, custo: 0 }],
    pratica: { ciencias: 0.8, exatas: 0.4, programacao: 0.3 }, social: { onde: 'no clube de ciências', fluxo: 0.6, amplitude: 2 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'clube_ciencias', n)
  },
  {
    id: 'cursinho', nome: 'Cursinho preparatório', descricao: v => `Aulas para ${educacaoDaVida(v).o}. Ajuda muito na nota.`, categoria: 'estudo', idadeMin: 16,
    // Só onde há prova para entrar: no acesso aberto (Argentina, Uruguai, Itália...) não há para que se preparar.
    existeNoPais: v => !educacaoDaVida(v).aberto,
    niveis: [{ rotulo: 'Todas as noites', tempo: 1, custo: 0 }],
    social: { onde: 'no cursinho', fluxo: 1, amplitude: 3 },
    requer: v => (v.educacao.matricula ? 'Já está fazendo faculdade.' : true),
    // A prática das matérias é dirigida pelo curso que se quer (`sistemas/vestibular`); aqui só a preparação acumula.
    efeito: (v, r) => { prepararVestibular(v, r); }
  },
  {
    id: 'estudar_concurso', nome: 'Estudar para concurso', descricao: 'Apostilas, videoaulas e simulados à noite.', categoria: 'estudo', idadeMin: 17,
    // Só onde o serviço público entra por concurso (o perfil do país).
    existeNoPais: v => perfilDaVida(v).trabalho.concurso,
    niveis: [
      { rotulo: 'Um pouco, à noite', tempo: 0.5, custo: 60 },
      { rotulo: 'Estudo firme', tempo: 1, custo: 180 },
      { rotulo: 'Rotina de concurseiro', tempo: 1.8, custo: 280, requer: v => (v.trabalho.atual?.carga === 'integral' ? 'Com trabalho integral não sobra tempo para estudar o dia inteiro.' : true) }
    ],
    pratica: { linguagens: 0.4, humanas: 0.4, exatas: 0.3 }, comportamento: { disciplina: 1 },
    efeito: (v, _r, n) => {
      marcarFato(v, 'estudando_concurso');
      const ganho = [6, 12, 20][n - 1];
      v.caminhos.concurso.meses += ganho;
      if (v.caminhos.concurso.foco) v.caminhos.concurso.mesesFoco = (v.caminhos.concurso.mesesFoco ?? 0) + ganho;
    }
  },

  // --------------------------------------------------------------- social
  {
    id: 'gremio', nome: 'Grêmio estudantil', descricao: '', local: 'gremio', categoria: 'social', idadeMin: 12, idadeMax: 18,
    requer: v => (v.educacao.basica && ['fundamental2', 'medio'].includes(v.educacao.basica.etapa) ? true : 'É coisa da escola.'),
    oferta: v => ofereceAqui(v, 'gremio'),
    niveis: [{ rotulo: 'Participar', tempo: 0.5, custo: 0 }],
    pratica: { lideranca: 1.2, linguagens: 0.2 }, social: { onde: 'no grêmio', fluxo: 1, amplitude: 3 }, comportamento: { sociabilidade: 1 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'gremio', n)
  },
  // ------------------------------------------------ formação (REWORK 3)
  // Atividades que só existem numa instituição (o perfil dela: `formacao`). Moram em Formação.
  {
    id: 'time_escola', nome: 'Time da escola', descricao: 'Treino depois da aula e os jogos escolares da cidade.', categoria: 'esporte', idadeMin: 8, idadeMax: 18,
    requer: v => (naEscola(v) ? true : 'É uma atividade da escola.'),
    oferta: v => ofereceAqui(v, 'time'),
    niveis: [{ rotulo: 'Treinar com o time', tempo: 1, custo: 0, qualidade: 1.1 }],
    pratica: { futebol: 1 }, social: { onde: 'no time da escola', fluxo: 1, amplitude: 2 }, comportamento: { disciplina: 1 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'time_escola', n)
  },
  {
    id: 'olimpiada', nome: 'Preparação para as olimpíadas', descricao: 'Matemática, ciências, astronomia: lista de problemas, simulado, a prova.', categoria: 'estudo', idadeMin: 10, idadeMax: 18,
    requer: v => (naEscola(v) ? true : 'É uma atividade da escola.'),
    oferta: v => ofereceAqui(v, 'olimpiada'),
    niveis: [{ rotulo: 'A turma da olimpíada', tempo: 0.5, custo: 0 }, { rotulo: 'Estudar a sério para a prova', tempo: 1, custo: 0, qualidade: 1.2 }],
    pratica: { exatas: 0.9, ciencias: 0.45 }, social: { onde: 'na turma da olimpíada', fluxo: 0.5, amplitude: 2 }, comportamento: { disciplina: 1 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'olimpiada', n)
  },
  {
    id: 'reforco', nome: 'Aula de reforço', descricao: 'Pedir ajuda: no contraturno, a professora explica de novo.', categoria: 'estudo', idadeMin: 7, idadeMax: 18,
    requer: v => (naEscola(v) ? true : 'É uma atividade da escola.'),
    oferta: v => ofereceAqui(v, 'reforco'),
    niveis: [{ rotulo: 'No contraturno', tempo: 0.5, custo: 0 }],
    pratica: { exatas: 0.35, linguagens: 0.35 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'reforco', n)
  },
  {
    id: 'projeto_escola', nome: 'Projeto da escola', descricao: 'Horta, rádio, jornal, oficina: um projeto de alunos e professores.', categoria: 'estudo', idadeMin: 9, idadeMax: 18,
    requer: v => (naEscola(v) ? true : 'É uma atividade da escola.'),
    oferta: v => ofereceAqui(v, 'projeto'),
    niveis: [{ rotulo: 'Participar', tempo: 0.5, custo: 0 }],
    pratica: { ciencias: 0.4, linguagens: 0.4, comunidade: 0.5 }, social: { onde: 'no projeto da escola', fluxo: 0.7, amplitude: 3 }, comportamento: { empatia: 1 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'projeto_escola', n)
  },
  {
    id: 'fanfarra', nome: 'Fanfarra da escola', descricao: '', local: 'fanfarra', categoria: 'arte', idadeMin: 9, idadeMax: 18,
    requer: v => (naEscola(v) ? true : 'É uma atividade da escola.'),
    oferta: v => ofereceAqui(v, 'fanfarra'),
    niveis: [{ rotulo: 'Ensaios depois da aula', tempo: 0.5, custo: 0 }],
    pratica: { musica: 0.8 }, social: { onde: 'na fanfarra', fluxo: 0.8, amplitude: 3 }
  },
  {
    id: 'projeto_tecnico', nome: 'Projeto no laboratório', descricao: 'Um projeto técnico de verdade, com um professor orientando.', categoria: 'estudo', idadeMin: 14,
    requer: v => (v.educacao.basica?.integrado || cursoOuNulo(v.educacao.matricula?.cursoId ?? '')?.nivel === 'tecnico' ? true : 'É do curso técnico.'),
    oferta: v => ofereceAqui(v, 'projeto_tecnico'),
    niveis: [{ rotulo: 'Algumas tardes', tempo: 0.5, custo: 0 }, { rotulo: 'Dedicação de verdade', tempo: 1, custo: 0, qualidade: 1.2 }],
    social: { onde: 'no laboratório', fluxo: 0.6, amplitude: 3 }, comportamento: { disciplina: 1 },
    // Pratica o que o curso ensina (quem faz Eletrotécnica mexe com elétrica).
    efeito: (v, r, n) => { const c = cursoOuNulo(v.educacao.basica?.integrado ?? v.educacao.matricula?.cursoId ?? ''); for (const [d, w] of Object.entries(c?.pratica ?? {}) as [Dominio, number][]) praticar(v, r, d, w * (n === 2 ? 0.9 : 0.5), 1.15); anoDaAtividade(v, 'projeto_tecnico', n); }
  },
  {
    id: 'iniciacao', nome: 'Iniciação científica', descricao: 'Pesquisa com um professor: leitura, laboratório, relatório — e uma bolsa pequena.', categoria: 'estudo', idadeMin: 17,
    requer: v => { const m = v.educacao.matricula; const c = cursoOuNulo(m?.cursoId ?? ''); return m && !m.trancado && c?.nivel === 'superior' ? (m.desempenho >= 55 ? true : 'O grupo de pesquisa pede notas firmes.') : 'É da graduação.'; },
    oferta: v => ofereceAqui(v, 'iniciacao'),
    niveis: [{ rotulo: 'Vinte horas por semana', tempo: 1, custo: 0, qualidade: 1.2 }],
    comportamento: { disciplina: 1 },
    renda: v => (v.educacao.matricula?.rede === 'publica' ? 700 : 400),
    efeito: (v, r, n) => { const c = cursoOuNulo(v.educacao.matricula?.cursoId ?? ''); for (const [d, w] of Object.entries(c?.pesos ?? {}) as [Dominio, number][]) praticar(v, r, d, Math.min(1, w * 0.5), 1.1); anoDaAtividade(v, 'iniciacao', n); }
  },
  {
    id: 'monitoria', nome: 'Monitoria', descricao: 'Ajudar o professor: tirar dúvidas da turma, corrigir lista.', categoria: 'estudo', idadeMin: 17,
    requer: v => { const m = v.educacao.matricula; return m && !m.trancado && ['superior', 'mestrado', 'doutorado'].includes(cursoOuNulo(m.cursoId)?.nivel ?? '') ? (m.desempenho >= 62 ? true : 'A monitoria é para quem vai bem na disciplina.') : 'É da faculdade.'; },
    oferta: v => ofereceAqui(v, 'monitoria'),
    niveis: [{ rotulo: 'Algumas horas por semana', tempo: 0.5, custo: 0 }],
    pratica: { linguagens: 0.25 },
    renda: v => (v.educacao.matricula?.rede === 'publica' ? 400 : 0),
    efeito: (v, _r, n) => anoDaAtividade(v, 'monitoria', n)
  },
  {
    id: 'extensao', nome: 'Projeto de extensão', descricao: 'A universidade fora dos muros: atendimento, cursinho popular, assessoria.', categoria: 'social', idadeMin: 17,
    requer: v => (v.educacao.matricula && !v.educacao.matricula.trancado ? true : 'É da faculdade.'),
    oferta: v => ofereceAqui(v, 'extensao'),
    niveis: [{ rotulo: 'Algumas vezes por mês', tempo: 0.5, custo: 0 }, { rotulo: 'Toda semana', tempo: 1, custo: 0 }],
    pratica: { comunidade: 1 }, social: { onde: 'na extensão', fluxo: 0.8, amplitude: 8 }, comportamento: { empatia: 1, generosidade: 1 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'extensao', n)
  },
  {
    id: 'centro_academico', nome: 'Centro acadêmico', descricao: 'Representar a turma: reunião, assembleia, briga com a coordenação.', categoria: 'social', idadeMin: 17,
    requer: v => (v.educacao.matricula && !v.educacao.matricula.trancado ? true : 'É da faculdade.'),
    oferta: v => ofereceAqui(v, 'centro_academico'),
    niveis: [{ rotulo: 'Participar', tempo: 0.5, custo: 0 }],
    pratica: { lideranca: 1.1 }, social: { onde: 'no centro acadêmico', fluxo: 1, amplitude: 4 }, comportamento: { sociabilidade: 1 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'centro_academico', n)
  },
  {
    id: 'atletica', nome: 'Atlética', descricao: 'O time do curso, os jogos universitários — e a festa depois.', categoria: 'esporte', idadeMin: 17,
    requer: v => (v.educacao.matricula && !v.educacao.matricula.trancado && v.educacao.matricula.modalidade === 'presencial' ? true : 'É da faculdade presencial.'),
    oferta: v => ofereceAqui(v, 'atletica'),
    niveis: [{ rotulo: 'Treinos e jogos', tempo: 1, custo: 30 }],
    pratica: { futebol: 0.6, volei: 0.4 }, social: { onde: 'na atlética', fluxo: 1.4, amplitude: 5 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'atletica', n)
  },
  {
    id: 'grupo_estudos', nome: 'Grupo de estudos', descricao: 'Estudar junto antes da prova: quem entendeu explica.', categoria: 'estudo', idadeMin: 15,
    requer: v => (v.educacao.matricula && !v.educacao.matricula.trancado ? true : 'É de quem está num curso.'),
    oferta: v => ofereceAqui(v, 'grupo_estudos'),
    niveis: [{ rotulo: 'Antes das provas', tempo: 0.5, custo: 0 }],
    social: { onde: 'no grupo de estudos', fluxo: 0.8, amplitude: 4 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'grupo_estudos', n)
  },
  {
    id: 'empresa_junior', nome: 'Empresa júnior', descricao: 'Projetos para clientes de verdade, tocados por estudantes.', categoria: 'estudo', idadeMin: 17,
    requer: v => (v.educacao.matricula && !v.educacao.matricula.trancado ? true : 'É da faculdade.'),
    oferta: v => ofereceAqui(v, 'empresa_junior'),
    niveis: [{ rotulo: 'Meio período', tempo: 1, custo: 0 }],
    pratica: { lideranca: 0.5, vendas: 0.3 }, social: { onde: 'na empresa júnior', fluxo: 0.8, amplitude: 4 }, comportamento: { disciplina: 1 },
    efeito: (v, _r, n) => anoDaAtividade(v, 'empresa_junior', n)
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
    // A idade de entrar no bar é a do lugar (21 nos EUA, 20 no Japão): `mundo/regras`.
    requer: v => (idade(v) >= regrasDaVida(v).vidaNoturna ? true : `Aqui, bar e balada só a partir dos ${regrasDaVida(v).vidaNoturna}.`),
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
    social: { onde: 'jogando online', fluxo: 0.4, amplitude: 6 }
  },
  {
    id: 'terapia', nome: 'Terapia', descricao: v => (redeDeSaude(v).sistema === 'seguro' ? 'Sessão semanal com psicólogo (particular ou pelo plano).' : `Sessão semanal com psicólogo (particular ou ${redeDeSaude(v).pelo}, com fila).`), categoria: 'cuidado', idadeMin: 12,
    niveis: [{ rotulo: 'Uma sessão por semana', tempo: 0.5, custo: 280 }],
    efeito: v => {
      for (const c of v.corpo.condicoes) {
        if (c.id !== 'depressao' && c.id !== 'ansiedade') continue;
        // Na terapia, o que se sentia ganha nome — e já é tratamento.
        if (c.diagnosticada === false) { diagnosticar(v, c, 'consulta'); escrever(v, { texto: `Na terapia, o que vinha sentindo ganhou nome: ${c.nome}.`, relevancia: 'biografia', tema: 'saude' }); }
        c.tratando = true;
      }
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
    renda: () => 750
  },
  {
    // O veículo que é seu vira ferramenta: entrega ou corrida por aplicativo, nas horas vagas (e o veículo gasta mais).
    id: 'corridas_app', nome: 'Fazer entregas e corridas por aplicativo', descricao: 'Com a moto ou o carro, nas horas vagas: pedido, corrida, avaliação de cinco estrelas.', categoria: 'renda', idadeMin: 18,
    niveis: [{ rotulo: 'Nas horas vagas', tempo: 1, custo: 0 }],
    requer: v => {
      if (!v.trabalho.licencas.includes('cnh')) return 'Precisa de carteira de motorista.';
      return v.financas.bens.some(b => b.tipo === 'veiculo' && (categoriaDoVeiculo(b) === 'moto' || categoriaDoVeiculo(b) === 'carro') && !b.parado && (b.problema?.gravidade ?? 0) < 3) ? true : 'Precisa de uma moto ou um carro rodando.';
    },
    renda: v => (v.financas.bens.some(b => b.tipo === 'veiculo' && categoriaDoVeiculo(b) === 'carro' && !b.parado) ? 1300 : 950),
    efeito: v => { for (const b of v.financas.bens) if (b.tipo === 'veiculo' && !b.parado && categoriaDoVeiculo(b) !== 'bicicleta') b.estado = Math.max(0, b.estado - 4); }
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
    id: 'vender_doces', nome: 'Vender doces na rua', descricao: '', local: 'vender_doces', categoria: 'renda', idadeMin: 8, idadeMax: 15,
    niveis: [{ rotulo: 'Depois da aula', tempo: 1, custo: 0 }],
    requer: v => (moraComFamiliaDeOrigem(v) ? true : 'Só faz sentido morando com a família.'),
    irregular: () => 'Trabalho infantil é proibido. Acontece — e tem consequência.',
    pratica: { vendas: 0.5 },
    renda: () => 220,
    efeito: (v, r) => {
      if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - 8);
      if (!temFato(v, 'conselho_tutelar') && r.chance(0.25)) {
        marcarFato(v, 'conselho_tutelar');
        escrever(v, { texto: `${textoLocal(v, 'conselho_tutelar')} Alguém tinha denunciado criança trabalhando na rua; a família levou uma advertência.`, relevancia: 'biografia', tema: 'familia', tom: 'ruim' });
      }
    }
  }
];

const POR_ID = new Map(ROTINAS.map(r => [r.id, r]));

/**
 * Atividades que ocupam a semana mas pertencem a Estudos (preparação formal:
 * o cursinho para o vestibular, o estudo para concurso): a rotina é a fonte
 * única, o lugar de começar, mudar e parar é Estudos — o Tempo livre só as
 * mostra na semana (elas ocupam tempo), nunca as oferece como lazer.
 */
export const DE_ESTUDOS = new Set(['cursinho', 'estudar_concurso']);
export const modeloRotina = (id: string) => POR_ID.get(id);
/** A descrição da atividade para esta vida (com o lugar: `local`; ou a função). */
export const descricaoDaRotina = (v: Vida, m: ModeloRotina): string => (m.local ? textoLocal(v, m.local) : typeof m.descricao === 'function' ? m.descricao(v) : m.descricao);

export const nivelDa = (r: Rotina) => (r.nivel ?? 1) as 1 | 2 | 3;
export function nivelModelo(m: ModeloRotina, n: number): NivelRotina {
  return m.niveis[Math.min(m.niveis.length, Math.max(1, n)) - 1];
}
export const tempoDaRotina = (r: Rotina) => {
  const m = modeloRotina(r.id);
  return m ? nivelModelo(m, nivelDa(r)).tempo : 0;
};

for (const r of ROTINAS) if (r.social) ROTINAS_SOCIAIS[r.id] = r.social;
/** A terapia com encaminhamento sai pela rede pública, de graça — onde a rede pública existe (no sistema de seguro, não). */
export const terapiaPublica = (v: Vida) => encaminhado(v) && redeDeSaude(v).sistema !== 'seguro';
/** O custo de uma atividade para esta vida. */
export function custoDaRotina(v: Vida, id: string, nivel: number): number {
  const m = modeloRotina(id);
  if (!m) return 0;
  if (id === 'terapia' && terapiaPublica(v)) return 0;
  return nivelModelo(m, nivel).custo;
}
CUSTO_ROTINA.de = (v, rot) => custoDaRotina(v, rot.id, nivelDa(rot));
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
  if (!noEscopo(m.escopo, lugarDe(v.moradia.municipioId))) return false;
  if (m.existeNoPais && !m.existeNoPais(v)) return false;
  if (v.caminhos.frentes && m.pratica && Object.keys(m.pratica).some(d => (v.caminhos.frentes[d as Dominio]?.meses ?? 0) >= 12)) return true;
  return m.oferta ? m.oferta(v) : true;
}

/**
 * Pode começar a atividade (no nível pedido)? O tempo vem da MESMA conta
 * que a interface mostra (`semana`).
 */
/** O que cuida da cabeça (e não acrescenta carga de verdade): nunca fica de fora por a semana estar cheia. */
const CUIDAR_DE_SI = new Set(['terapia']);

export function podeComecarRotina(v: Vida, id: string, nivel = 1): Veredito {
  const m = modeloRotina(id);
  if (!m) return bloqueio('impossivel', 'Atividade desconhecida.');
  const i = idade(v);
  if (i < m.idadeMin) return bloqueio('impossivel', `A partir dos ${m.idadeMin} anos.`);
  if (m.idadeMax && i > m.idadeMax) return bloqueio('impossivel', 'Não é para a sua idade.');
  if (!atividadeExiste(v, m)) return bloqueio('impossivel', 'Não há isso por aqui agora.');
  // O atleta profissional treina no clube: a mesma modalidade não vira "atividade de tempo livre" (contaria duas vezes).
  const es = v.caminhos.esporte;
  if (es?.fase === 'profissional' && es.modalidade === id) return bloqueio('incompativel', 'Seu treino agora é o do clube (em Trabalho).');
  const atual = v.rotinas.find(r => r.id === id);
  if (atual && nivelDa(atual) === nivel) return bloqueio('incompativel', 'Já faz parte da sua semana.');
  if (nivel > m.niveis.length) return bloqueio('impossivel', 'Não há esse ritmo.');
  const req = m.requer?.(v);
  if (typeof req === 'string') return bloqueio('requisito', req);
  const n = nivelModelo(m, nivel);
  const reqNivel = n.requer?.(v);
  if (typeof reqNivel === 'string') return bloqueio('requisito', reqNivel);
  // REWORK 4 + FIX pós-playtest humano: a semana cheia não é um muro — é um custo. A conta é UMA (`semana.encaixe`,
  // a mesma do painel "Dá para assumir mais?"): folgada/ocupada entram; cheia entra tirando do descanso; sobrecarregada
  // entra com o preço dito; só "além" (não há horas — ou, criança, a semana dela não comporta) bloqueia, com o porquê.
  const extra = n.tempo - (atual ? tempoDaRotina(atual) : 0);
  const enc = encaixe(v, extra, id);
  // FIX pós-REWORK 4 (achado do playtest adversarial): quem está no limite não pode ser impedido de cuidar da cabeça —
  // a terapia é uma hora por semana, e é justamente para isso. Passa do teto, com o preço dito.
  if (!enc.possivel && CUIDAR_DE_SI.has(id) && idade(v) >= 14) return { grau: 'permitido', motivo: `${enc.motivo} A terapia é uma hora por semana — e é para isso mesmo.` };
  if (!enc.possivel) return bloqueio('incompativel', enc.motivo ?? 'Não há horas na semana.');
  if (i < 12 && n.custo > 60 && !casaPaga(v, n.custo) && !projetoSocial(v, id)) return bloqueio('requisito', semDinheiro);
  const irr = m.irregular?.(v);
  if (irr) return { grau: 'irregular', motivo: irr };
  if (extra > 0 && enc.motivo) return { grau: 'permitido', motivo: enc.motivo };
  return { grau: 'permitido' };
}

/* ---------------------------------------------------------------- O ano */

export function processarRotinas(v: Vida, r: Rng): void {
  const praticadas = new Set<Dominio>();
  // A semana que passa do que cabe cobra AQUI também: cansado, treina e estuda pior (cheia: um pouco; além: muito).
  const faixa = encaixe(v, 0).faixa;
  const cansaco = faixa === 'sobrecarregada' || faixa === 'alem' ? 0.7 : faixa === 'cheia' ? 0.88 : 1;
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
        // O que se tem em casa (o instrumento, o notebook, a câmera) faz a mesma hora render mais (`coisas`).
        // REWORK 4: a semana que passa do que cabe também cobra AQUI — cansado, treina e estuda pior.
        praticar(v, r, d, peso * w, (nm.qualidade ?? 1) * (1 + bonusDaAtividade(v, m.id)) * cansaco);
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
  // O sedentarismo e o condicionamento do ano já foram lidos das atividades antes do corpo (`sistemas/pessoa`).
  // Cursinho é preparação para uma prova: dois anos sem fazer o ENEM, ele fica para trás (antes, durava décadas).
  const cursinho = v.rotinas.find(x => x.id === 'cursinho');
  if (cursinho && v.t - cursinho.tInicio >= 24 && !v.educacao.enem.some(x => x.t >= v.t - 24)) {
    v.rotinas = v.rotinas.filter(x => x !== cursinho);
    escrever(v, { texto: 'O cursinho ficou para trás: sem prova à vista, a preparação perdeu o sentido.', relevancia: 'cotidiano', tema: 'estudo' });
  }
  if (!v.rotinas.some(x => x.id === 'cursinho')) esfriarPreparo(v);
  if (!v.rotinas.some(x => x.id === 'estudar_concurso')) delete v.fatos['estudando_concurso'];
  marcarPraticaDeVida(v);
}

/* ------------------------------------------------ Prática que virou vida */

const VERBO_DA_PRATICA: Partial<Record<Dominio, string>> = {
  futebol: 'Jogar bola', volei: 'O vôlei', basquete: 'O basquete', tenis: 'O tênis', natacao: 'Nadar', atletismo: 'Correr', lutas: 'O tatame', musica: 'Tocar', teatro: 'O teatro',
  danca: 'Dançar', desenho: 'Desenhar', escrita: 'Escrever', fotografia: 'Fotografar', xadrez: 'O xadrez', programacao: 'Programar'
};

/**
 * Uma prática que durou (três anos, com regularidade) vira parte de quem a
 * pessoa é — e entra na Linha da Vida uma vez. A ida de cada semana, não.
 */
function marcarPraticaDeVida(v: Vida): void {
  for (const rot of v.rotinas) {
    const m = modeloRotina(rot.id);
    if (!m?.pratica) continue;
    const d = Object.keys(m.pratica)[0] as Dominio;
    const verbo = VERBO_DA_PRATICA[d];
    const f = v.caminhos.frentes[d];
    if (!verbo || !f || m.pratica[d]! < 1 || v.t - rot.tInicio < 36 || nivelDa(rot) < 2 && f.habilidade < 55) continue;
    if (temFato(v, `pratica_vida_${d}`)) continue;
    marcarFato(v, `pratica_vida_${d}`);
    const anos = Math.floor((v.t - rot.tInicio) / 12);
    escrever(v, { texto: `${verbo} virou parte da vida: ${anos} anos de ${modeloFrente(d).nome}, toda semana.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
  }
}
