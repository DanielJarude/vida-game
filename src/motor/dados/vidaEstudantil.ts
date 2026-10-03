/**
 * Formação 2.0 (REWORK 4): a história de dentro da escola e da faculdade.
 *
 * "Formação também precisa ter história interna." Matrícula → nota → diploma
 * era tudo o que o jogo contava. Aqui moram os MOMENTOS — a base comum e o que
 * é próprio de cada família de cursos (Medicina não é Ciência da Computação
 * com outro nome: tem o laboratório de anatomia, o primeiro paciente, o
 * internato; Computação tem o primeiro programa grande, a maratona, o
 * estágio na empresa). Cada momento:
 *   - acontece sozinho, pelo contexto (a vida acontece);
 *   - mexe em sistemas que já existem (a prática de uma frente, a cabeça, o
 *     desempenho, a saúde, um professor ou um colega de verdade);
 *   - fica na história da formação (`Educacao.trajetoria`) — o que se consulta
 *     aos 45 anos, além de "Medicina — concluído".
 */

import type { Dominio } from '../tipos';

export type TipoMomentoFormacao = 'aula' | 'prova' | 'professor' | 'colega' | 'conflito' | 'atividade' | 'reconhecimento' | 'dificuldade' | 'pratica' | 'estagio' | 'pesquisa' | 'projeto' | 'disciplina' | 'formatura';

export interface MomentoDeFormacao {
  id: string;
  tipo: TipoMomentoFormacao;
  /** Escola: idades; curso: o ano do curso (1 = primeiro). */
  de: number;
  ate: number;
  textos: string[];
  pratica?: [Dominio, number][];
  estresse?: number;
  desempenho?: number;
  saude?: number;
  /** Envolve um professor (o que repara, ou um novo) / um colega da turma (que pode virar amigo). */
  professor?: boolean;
  colega?: boolean;
  /** Vira conquista (marca da trajetória). */
  conquista?: string;
  peso?: number;
  /** Condição de contexto: matéria forte, fraca, desempenho alto/baixo, rede, impulsividade. */
  se?: 'forte' | 'fraca' | 'alto' | 'baixo' | 'publica' | 'privada' | 'impulsivo' | 'esporte' | 'arte';
}

const M = (id: string, tipo: TipoMomentoFormacao, de: number, ate: number, textos: string[], extra: Partial<MomentoDeFormacao> = {}): MomentoDeFormacao => ({ id, tipo, de, ate, textos, ...extra });

/** A vida na escola (idades). {materia} = a matéria do momento; {prof}, {colega} = gente de verdade. */
export const MOMENTOS_DA_ESCOLA: MomentoDeFormacao[] = [
  M('esc_destaque', 'reconhecimento', 9, 17, ['{prof} leu a sua prova de {materia} em voz alta, como exemplo. Metade da sala olhou para você.', 'Em {materia}, você terminou a lista antes de todo mundo — e {prof} trouxe outra só para você.'], { se: 'forte', professor: true, desempenho: 3 }),
  M('esc_nota_vermelha', 'dificuldade', 10, 17, ['A primeira nota vermelha em {materia}. O boletim ficou na mochila por dois dias.', 'Em {materia}, a matéria passou da sua cabeça e não voltou. A recuperação ficou marcada.'], { se: 'fraca', estresse: 4, desempenho: -2 }),
  M('esc_feira', 'atividade', 8, 15, ['Na feira de ciências, {projeto} funcionou na frente da diretora.', 'O trabalho da feira de ciências — {projeto}, com {colega} na maquete e você na explicação — ganhou menção.', 'Na feira de ciências, {projeto} não funcionou na hora; você explicou por que não funcionou, e a banca gostou mais disso.', 'Uma semana inteira montando {projeto} na garagem. Na feira, uma criança menor perguntou como fazia.'], { colega: true, pratica: [['ciencias', 0.3]] }),
  M('esc_apresentacao', 'atividade', 6, 12, ['Na apresentação de fim de ano, você esqueceu a fala, inventou outra — e a plateia riu no lugar certo.', 'A peça da escola: você foi a árvore, depois o narrador, e descobriu que gosta de palco.', 'No coral da escola, você cantou mais alto do que devia. {prof} fingiu não ouvir.', 'Na mostra de dança da escola, errou o passo e seguiu como se fosse de propósito.'], { pratica: [['teatro', 0.3]], se: 'arte' }),
  M('esc_jogos', 'atividade', 10, 17, ['Nos jogos escolares, o seu time perdeu a final no último minuto. O ônibus da volta foi o mais silencioso da história.', 'Nos jogos escolares, você fez o ponto decisivo. Por uma semana, o corredor sabia o seu nome.'], { se: 'esporte', pratica: [['futebol', 0.2]], colega: true }),
  M('esc_excursao', 'colega', 8, 15, ['Na excursão da escola, {colega} sentou do seu lado no ônibus. Voltaram amigos.', 'A excursão ao {passeio}: o guia falou duas horas; você e {colega} lembram só do lanche e das risadas.', 'Na excursão ao {passeio}, você e {colega} se perderam do grupo por dez minutos e voltaram com a melhor história da viagem.'], { colega: true }),
  M('esc_briga', 'conflito', 9, 15, ['Uma briga no recreio. A coordenação chamou os pais.', 'Você respondeu a {prof} na frente da turma. Ficou uma semana sem recreio.'], { se: 'impulsivo', estresse: 3, professor: true }),
  M('esc_grupo', 'colega', 11, 17, ['No trabalho em grupo sobre {tema}, {colega} fez a parte mais difícil — e você descobriu que dá para confiar em alguém da sala.', 'O trabalho sobre {tema} virou noite na casa de {colega}. Deu certo, e virou costume.', 'No trabalho sobre {tema}, ninguém do grupo fez nada além de você e {colega}. Vocês apresentaram sozinhos — e tiraram a maior nota.'], { colega: true, pratica: [['linguagens', 0.1]] }),
  M('esc_prova_etapa', 'prova', 14, 14, ['A prova de fim do fundamental: a sala inteira em silêncio, o relógio alto demais.', 'O último ano do fundamental terminou com uma prova que parecia decidir a vida. Não decidia — mas pesou.'], { estresse: 3 }),
  M('esc_prova_medio', 'prova', 17, 17, ['O último ano do médio: simulados toda semana, a turma dividida entre quem sabia o que queria e quem fingia.', 'O fim do médio: a última prova, a última fila do recreio, a foto da turma.'], { estresse: 4 }),
  M('esc_bolsa_merito', 'reconhecimento', 12, 17, ['O seu nome saiu no mural: menção honrosa pelo desempenho do ano.'], { se: 'alto', desempenho: 2, conquista: 'Menção honrosa na escola' }),
  M('esc_reforco_professor', 'professor', 10, 16, ['{prof} ficou depois da aula para explicar {materia} de novo, do zero. Na semana seguinte, entrou.'], { se: 'fraca', professor: true, desempenho: 3 }),
  M('esc_escola_cheia', 'dificuldade', 8, 16, ['A sala com quarenta alunos e o ventilador quebrado: aprender, ali, era resistência.', 'Faltou professor de {materia} metade do ano. A turma aprendeu sozinha — ou não aprendeu.'], { se: 'publica', desempenho: -1 }),
  M('esc_cobranca', 'dificuldade', 12, 17, ['Na escola particular, a cobrança veio cedo: ranking de notas no corredor.', 'O colégio mandou um e-mail para casa sobre o seu desempenho em {materia}. A conversa no jantar foi longa.', 'Aula extra no sábado, simulado no domingo: no colégio, {materia} virou assunto de toda reunião de pais.'], { se: 'privada', estresse: 4 })
];

/** Os momentos comuns a qualquer graduação (o ano do curso). */
export const MOMENTOS_DA_FACULDADE: MomentoDeFormacao[] = [
  M('fac_calouro', 'colega', 1, 1, ['A primeira semana em {inst}: trote, sala errada, e {colega} perguntando se você também estava perdid{o}.'], { colega: true }),
  M('fac_reprovacao', 'dificuldade', 1, 3, ['A primeira reprovação numa disciplina. Ficou para o semestre que vem — e para a conversa em casa.'], { se: 'baixo', estresse: 5, desempenho: -3 }),
  M('fac_professor', 'professor', 2, 4, ['{prof} devolveu o seu trabalho com uma frase a lápis: "isso aqui é bom; continue". Você guardou a folha.', '{prof} usou o seu trabalho como exemplo na aula seguinte — sem dizer de quem era, mas olhando para você.', 'Depois da aula, {prof} perguntou se você já tinha pensado em pesquisa. Você não tinha. Passou a pensar.'], { professor: true, desempenho: 2 }),
  M('fac_tcc', 'projeto', 4, 6, ['O trabalho de conclusão sobre {tema}: meses de leitura, um orientador ocupado e a madrugada antes da entrega.', 'A banca do trabalho de conclusão fez uma pergunta sobre {tema} que você não esperava — e você respondeu.', 'O trabalho de conclusão quase não saiu: o tema ({tema}) mudou duas vezes, e a versão final foi escrita em um mês.'], { estresse: 5, desempenho: 2 })
];

/** O que é próprio de cada família de cursos (pela área do curso). */
export const MOMENTOS_DO_CURSO: Record<string, MomentoDeFormacao[]> = {
  medicina: [
    M('med_anatomia', 'pratica', 1, 2, ['O laboratório de anatomia: o cheiro de formol, o silêncio da turma, o primeiro corpo. Você não dormiu direito naquela semana.'], { estresse: 4, pratica: [['ciencias', 0.3]] }),
    M('med_liga', 'atividade', 2, 4, ['Entrou numa liga acadêmica com {colega}: plantões de observação aos sábados, e a sensação de estar começando de verdade.'], { colega: true, pratica: [['ciencias', 0.2]] }),
    M('med_primeiro_paciente', 'pratica', 3, 4, ['O primeiro paciente que você examinou sozinh{o}: uma senhora que agradeceu como se você já fosse médic{o}.'], { pratica: [['comunidade', 0.2]], desempenho: 2 }),
    M('med_internato', 'estagio', 5, 6, ['O internato: plantões de doze horas, a primeira morte de um paciente que você acompanhou, o café frio às quatro da manhã.', 'No internato, {prof} pediu a sua opinião na frente da equipe. Você acertou.'], { estresse: 9, saude: -2, professor: true, pratica: [['ciencias', 0.3]] })
  ],
  saude: [
    M('sau_laboratorio', 'pratica', 1, 2, ['As aulas práticas no laboratório: luva, jaleco, e a primeira vez que a teoria virou mão.'], { pratica: [['ciencias', 0.25]] }),
    M('sau_estagio', 'estagio', 3, 5, ['O estágio supervisionado: a clínica-escola, os primeiros atendimentos, {prof} olhando por cima do ombro.', 'No estágio, um paciente voltou só para agradecer. Você contou para todo mundo em casa.'], { professor: true, pratica: [['comunidade', 0.2]], estresse: 3 })
  ],
  psicologia: [
    M('psi_primeiro_atendimento', 'estagio', 3, 5, ['O primeiro atendimento supervisionado: cinquenta minutos em que você mais ouviu do que falou — que era o certo.'], { pratica: [['comunidade', 0.3]], estresse: 3, professor: true })
  ],
  direito: [
    M('dir_juri', 'atividade', 2, 4, ['O júri simulado: você ficou com a defesa, e a sala votou pela absolvição. {prof} disse que você tem voz de tribuna.'], { professor: true, pratica: [['linguagens', 0.3]], conquista: 'Venceu um júri simulado' }),
    M('dir_escritorio_modelo', 'estagio', 3, 5, ['No escritório-modelo da faculdade, o primeiro caso de verdade: uma pensão atrasada, uma mãe com três filhos.'], { pratica: [['humanas', 0.2], ['comunidade', 0.15]] }),
    M('dir_codigos', 'aula', 1, 2, ['Os códigos grossos na mochila, o latim das aulas, o colega que já falava como desembargador.'], { colega: true })
  ],
  engenharia: [
    M('eng_calculo', 'dificuldade', 1, 2, ['Cálculo I: a disciplina que reprova metade da turma. Você e {colega} estudaram juntos até a prova final.'], { colega: true, estresse: 5, pratica: [['exatas', 0.35]] }),
    M('eng_competicao', 'projeto', 2, 4, ['A equipe de competição: um protótipo montado em garagem, uma viagem de ônibus até a competição nacional.', 'O protótipo da equipe quebrou na véspera. Consertaram de madrugada — e terminaram em quinto.'], { colega: true, pratica: [['exatas', 0.25], ['lideranca', 0.1]] }),
    M('eng_estagio_obra', 'estagio', 4, 5, ['O estágio obrigatório: capacete, bota, e um mestre de obras que sabia mais do que o livro.'], { pratica: [['exatas', 0.2]] })
  ],
  computacao: [
    M('comp_primeiro_programa', 'pratica', 1, 2, ['O primeiro programa grande que funcionou de primeira — e você desconfiou, rodou de novo, e funcionou de novo.'], { pratica: [['programacao', 0.4]] }),
    M('comp_maratona', 'atividade', 2, 3, ['A maratona de programação: você, {colega} e um terceiro, doze horas, três problemas resolvidos e muita pizza fria.'], { colega: true, pratica: [['programacao', 0.35], ['exatas', 0.15]] }),
    M('comp_estagio', 'estagio', 3, 4, ['O estágio numa empresa de software: o primeiro código seu em produção, e o primeiro bug seu também.'], { pratica: [['programacao', 0.35]] }),
    M('comp_projeto', 'projeto', 3, 4, ['Um projeto paralelo com {colega} — um aplicativo que três pessoas usam, contando vocês dois.'], { colega: true, pratica: [['programacao', 0.25]] })
  ],
  exatas: [
    M('ex_lista', 'aula', 1, 3, ['As listas de exercícios de toda semana. Em algum momento, a matemática deixou de ser obstáculo e virou linguagem.'], { pratica: [['exatas', 0.35]] })
  ],
  educacao: [
    M('edu_estagio_docencia', 'estagio', 3, 4, ['O estágio de docência: a primeira aula que você deu, para uma turma que testou você nos primeiros cinco minutos.', 'No estágio, um aluno que não lia leu um parágrafo inteiro em voz alta. Você quase chorou na frente da turma.'], { pratica: [['comunidade', 0.25], ['linguagens', 0.15]], estresse: 3 })
  ],
  negocios: [
    M('neg_caso', 'aula', 1, 3, ['Um estudo de caso que virou debate de três horas — e você mudou de lado no meio.'], { pratica: [['lideranca', 0.15]] }),
    M('neg_estagio', 'estagio', 3, 4, ['O estágio no banco: planilha, reunião, e a primeira vez que alguém pediu a sua opinião sobre um número.'], { pratica: [['exatas', 0.2]] })
  ],
  comunicacao: [
    M('com_jornal', 'atividade', 1, 3, ['O jornal-laboratório: a sua primeira matéria assinada, com dois erros de revisão que só você viu.'], { pratica: [['escrita', 0.35]] }),
    M('com_portfolio', 'projeto', 3, 4, ['O portfólio: dois anos de trabalhos escolhidos a dedo para caber em dez páginas.'], { pratica: [['escrita', 0.15], ['fotografia', 0.15]] })
  ],
  artes: [
    M('art_mostra', 'atividade', 2, 4, ['A mostra de fim de semestre: a sala lotada de colegas, professores e a sua família na primeira fila.'], { pratica: [['teatro', 0.2], ['musica', 0.2], ['desenho', 0.2]], conquista: 'Mostra de fim de curso' })
  ],
  agro: [
    M('agro_campo', 'pratica', 2, 4, ['A aula de campo na fazenda experimental: barro até o joelho e uma vaca que não queria colaborar.'], { pratica: [['campo', 0.3]] })
  ],
  tecnico: [
    M('tec_oficina', 'pratica', 1, 2, ['A primeira aula prática no laboratório de {curso}: o instrutor mostrou uma vez, você errou três, e na quarta saiu.', 'No laboratório de {curso}, a primeira peça (ou o primeiro programa) feita do começo ao fim. Torta — mas sua.', 'O primeiro trabalho prático de {curso} valeu nota e valeu um cliente: o vizinho que precisava de ajuda.'], { pratica: [['manual', 0.3]] })
  ]
};

/** A família de momentos de uma área de formação. */
export function familiaDoCurso(area: string, nivel: string): string {
  if (nivel === 'tecnico' || nivel === 'livre') return 'tecnico';
  if (area === 'medicina') return 'medicina';
  if (area === 'psicologia') return 'psicologia';
  if (['enfermagem', 'nutricao', 'fisioterapia', 'odontologia', 'farmacia', 'veterinaria', 'radiologia', 'educacao_fisica'].includes(area)) return 'saude';
  if (area === 'direito') return 'direito';
  if (['engenharia_civil', 'engenharia', 'arquitetura', 'eletrotecnica', 'eletrica', 'mecanica', 'automacao'].includes(area)) return 'engenharia';
  if (area === 'computacao') return 'computacao';
  if (area === 'exatas') return 'exatas';
  if (['educacao', 'letras'].includes(area)) return 'educacao';
  if (['administracao', 'contabilidade', 'economia', 'logistica'].includes(area)) return 'negocios';
  if (['comunicacao', 'design'].includes(area)) return 'comunicacao';
  if (['musica_formacao', 'artes_cenicas'].includes(area)) return 'artes';
  if (area === 'agro') return 'agro';
  return 'geral';
}

/** Os detalhes que mudam de vida para vida (o projeto da feira, o passeio, o tema do trabalho). */
export const DETALHES: Record<string, string[]> = {
  projeto: ['o vulcão de bicarbonato', 'uma horta vertical de garrafa', 'um robô feito de sucata', 'um forno solar de papelão', 'um purificador de água com areia e carvão', 'um sismógrafo de lata', 'uma maquete do bairro com a enchente'],
  passeio: ['museu', 'zoológico', 'planetário', 'jardim botânico', 'centro histórico', 'fábrica de chocolate', 'observatório'],
  tema: ['a água da cidade', 'a história do bairro', 'o lixo da escola', 'as abelhas', 'a migração', 'o trânsito', 'a energia solar', 'o trabalho infantil', 'a memória dos avós']
};
