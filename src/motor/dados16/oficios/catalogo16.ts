/**
 * VIDA 16 · OFÍCIOS POR DENTRO — o catálogo puro (só dados) das três profissões que só tinham o "desafio" genérico de
 * `conteudo/oficios` (as mesmas palavras trocadas): DIREITO (clientes, processos, estratégia, ética), DOCÊNCIA (turmas,
 * a abordagem do ano, o aluno que precisa de você, o projeto da escola, a pressão pela nota) e TECNOLOGIA (o projeto do
 * ano, o ritmo e a dívida técnica, o incidente em produção, a falha conhecida, a liderança técnica).
 *
 * Cada profissão tem a SUA mecânica (`motor/v16/oficios`), não uma cópia de outra. A lógica não mora aqui.
 */

export type Ramo16 = 'direito' | 'docencia' | 'tecnologia'
  /** VIDA 16.1 (`v16/oficios/oficios16b`). */
  | 'engenharia' | 'enfermagem' | 'contabilidade' | 'jornalismo' | 'psicologia';

/* ------------------------------------------------------------------ Direito */

export type AreaJuridica16 = 'familia' | 'trabalhista' | 'criminal' | 'empresarial' | 'civel';

export interface ModeloDeCaso16 {
  area: AreaJuridica16;
  /** O que o cliente traz (com {c} = nome do cliente). */
  texto: string;
  titulo: string;
  /** Faixa do valor em jogo (na moeda da vida, cidade de custo 1,0). */
  valor: [number, number];
  /** O adversário pesa: 0 (uma pessoa), 1 (uma empresa), 2 (um grande escritório, o Estado). */
  adversario: 0 | 1 | 2;
}

export const CASOS16: ModeloDeCaso16[] = [
  { area: 'familia', titulo: 'Guarda compartilhada', texto: '{c} quer a guarda compartilhada dos dois filhos; o ex-cônjuge quer a guarda só para si.', valor: [4000, 12000], adversario: 0 },
  { area: 'familia', titulo: 'Pensão alimentícia', texto: '{c} cria a filha sozinha e quer revisar uma pensão fixada há oito anos.', valor: [3000, 9000], adversario: 0 },
  { area: 'familia', titulo: 'Inventário em família', texto: 'Os irmãos de {c} não chegam a acordo sobre a casa que os pais deixaram.', valor: [15000, 60000], adversario: 0 },
  { area: 'familia', titulo: 'Divórcio difícil', texto: '{c} quer o divórcio; a partilha inclui uma empresa pequena que os dois tocavam juntos.', valor: [10000, 40000], adversario: 0 },
  { area: 'trabalhista', titulo: 'Horas extras', texto: '{c} trabalhou seis anos com jornada de doze horas e nunca recebeu hora extra.', valor: [20000, 70000], adversario: 1 },
  { area: 'trabalhista', titulo: 'Acidente de trabalho', texto: '{c} perdeu parte do movimento da mão numa máquina sem proteção.', valor: [40000, 180000], adversario: 1 },
  { area: 'trabalhista', titulo: 'Demissão na estabilidade', texto: '{c} foi demitida três semanas depois de contar que estava grávida.', valor: [25000, 80000], adversario: 1 },
  { area: 'trabalhista', titulo: 'Vínculo de aplicativo', texto: '{c} entrega há quatro anos para uma plataforma e quer o vínculo reconhecido.', valor: [15000, 50000], adversario: 2 },
  { area: 'criminal', titulo: 'Acusação de furto', texto: '{c} é acusado de furtar uma loja; jura que estava em outro bairro naquela hora.', valor: [3000, 8000], adversario: 2 },
  { area: 'criminal', titulo: 'Briga de bar', texto: '{c} responde por lesão corporal depois de uma briga que, diz, não começou.', valor: [4000, 10000], adversario: 2 },
  { area: 'criminal', titulo: 'Prisão em flagrante', texto: '{c} foi preso com uma quantidade pequena de droga; é a primeira passagem.', valor: [5000, 15000], adversario: 2 },
  { area: 'empresarial', titulo: 'Contrato descumprido', texto: 'O fornecedor de {c} entregou metade do pedido e quer cobrar o contrato inteiro.', valor: [30000, 150000], adversario: 1 },
  { area: 'empresarial', titulo: 'Recuperação judicial', texto: 'A fábrica de {c} tem quarenta funcionários e dívidas maiores que o faturamento do ano.', valor: [80000, 400000], adversario: 2 },
  { area: 'empresarial', titulo: 'Sociedade desfeita', texto: '{c} quer sair da sociedade; o sócio diz que a parte dela vale quase nada.', valor: [50000, 200000], adversario: 1 },
  { area: 'civel', titulo: 'Plano de saúde negou', texto: 'O plano de saúde negou a cirurgia da mãe de {c}, com laudo e tudo.', valor: [20000, 90000], adversario: 1 },
  { area: 'civel', titulo: 'Erro do banco', texto: '{c} teve o nome negativado por uma dívida que já tinha pagado.', valor: [5000, 20000], adversario: 1 },
  { area: 'civel', titulo: 'Vizinho e a obra', texto: 'A obra do vizinho rachou a parede da casa de {c}.', valor: [8000, 30000], adversario: 0 }
];

export const AREA_JURIDICA16: Record<AreaJuridica16, string> = { familia: 'Família', trabalhista: 'Trabalhista', criminal: 'Criminal', empresarial: 'Empresarial', civel: 'Cível' };

/** A área do jogador (`Trabalho.areas`) → a área jurídica dos casos que chegam mais. */
export const AREA_DO_ESCRITORIO16: Record<string, AreaJuridica16> = {
  'direito de família': 'familia', 'direito trabalhista': 'trabalhista', 'direito criminal': 'criminal', 'direito empresarial': 'empresarial'
};

export interface DilemaEtico16 { id: string; texto: string; titulo: string }
export const DILEMAS_DIREITO16: DilemaEtico16[] = [
  { id: 'testemunha', titulo: 'A testemunha ensaiada', texto: '{c} oferece uma testemunha que "viu tudo" — e você desconfia que ela nem estava lá.' },
  { id: 'documento', titulo: 'O documento que some', texto: '{c} pede para você "esquecer" de juntar um e-mail que complica o caso.' },
  { id: 'conflito', titulo: 'Os dois lados', texto: 'A outra parte do processo de {c} também quer contratar o seu escritório, para outro assunto, pagando o triplo.' },
  { id: 'gratis', titulo: 'Quem não pode pagar', texto: 'A vizinha de {c} precisa de defesa e não tem como pagar. A defensoria está com fila de meses.' }
];

/* ------------------------------------------------------------------ Docência */

export type PerfilDeTurma16 = 'interessada' | 'agitada' | 'defasada' | 'heterogenea' | 'apatica';
export const PERFIS_DE_TURMA16: Record<PerfilDeTurma16, { nome: string; texto: string }> = {
  interessada: { nome: 'interessada', texto: 'pergunta muito, entrega no prazo, quer mais' },
  agitada: { nome: 'agitada', texto: 'barulhenta, criativa, difícil de segurar depois do recreio' },
  defasada: { nome: 'com defasagem', texto: 'metade chegou sem a base do ano anterior' },
  heterogenea: { nome: 'muito diferente entre si', texto: 'tem quem já sabe tudo e quem não sabe por onde começar' },
  apatica: { nome: 'desanimada', texto: 'quieta demais; ninguém parece achar que a escola leva a algum lugar' }
};

export type Abordagem16 = 'tradicional' | 'projetos' | 'reforco' | 'conversa';
export const ABORDAGENS16: Record<Abordagem16, { nome: string; texto: string; boaPara: PerfilDeTurma16[]; ruimPara: PerfilDeTurma16[]; cansa: number }> = {
  tradicional: { nome: 'Aula expositiva, com exercícios', texto: 'O conteúdo em ordem, prova a cada bimestre. Previsível — para você e para eles.', boaPara: ['interessada'], ruimPara: ['apatica'], cansa: 0 },
  projetos: { nome: 'Projetos em grupo', texto: 'Eles constroem, você orienta. Dá mais trabalho para preparar e rende quando a turma abraça.', boaPara: ['agitada', 'apatica', 'heterogenea'], ruimPara: ['defasada'], cansa: 4 },
  reforco: { nome: 'Recuperar a base', texto: 'Voltar dois passos para andar quatro: grupos por nível, revisão, atividade extra.', boaPara: ['defasada', 'heterogenea'], ruimPara: ['interessada'], cansa: 3 },
  conversa: { nome: 'Combinar as regras com a turma', texto: 'Primeiro o vínculo: rodas de conversa, combinados, cada um com voz.', boaPara: ['agitada', 'apatica'], ruimPara: [], cansa: 2 }
};

export interface SituacaoDeAluno16 { id: string; texto: string }
export const ALUNOS16: SituacaoDeAluno16[] = [
  { id: 'faltas', texto: '{a} começou a faltar duas vezes por semana. Quando vem, dorme na carteira.' },
  { id: 'leitura', texto: '{a} tem {i} anos e ainda lê soletrando — e esconde isso com piadas.' },
  { id: 'briga', texto: '{a} se meteu em três brigas este mês. Em casa, dizem, as coisas não andam bem.' },
  { id: 'talento', texto: '{a} resolve em minutos o que a turma leva a aula inteira — e está entediad{o} a ponto de desistir.' },
  { id: 'trabalho', texto: '{a} trabalha à tarde para ajudar em casa e não consegue fazer nada fora da escola.' },
  { id: 'isolado', texto: '{a} almoça sozinh{o} todo dia. Os colegas riem quando passa.' }
];

export interface ProjetoEscolar16 { id: string; nome: string; texto: string; premio: string }
export const PROJETOS_ESCOLARES16: ProjetoEscolar16[] = [
  { id: 'feira', nome: 'Feira de ciências', texto: 'Coordenar os trabalhos da feira de ciências da escola.', premio: 'Um projeto da sua turma ganhou a feira regional de ciências.' },
  { id: 'olimpiada', nome: 'Olimpíada de matemática', texto: 'Preparar um grupo para a olimpíada de matemática, no contraturno.', premio: 'Dois alunos seus trouxeram medalha da olimpíada.' },
  { id: 'peca', nome: 'A peça de fim de ano', texto: 'Montar a peça de teatro de fim de ano com a turma.', premio: 'A peça lotou o auditório; os pais pediram para repetir.' },
  { id: 'jornal', nome: 'O jornal da escola', texto: 'Criar o jornal da escola, feito pelos alunos.', premio: 'O jornal da escola virou matéria no jornal da cidade.' },
  { id: 'horta', nome: 'A horta', texto: 'Tirar do papel a horta que a escola nunca teve.', premio: 'A horta abasteceu a merenda o semestre inteiro.' }
];

/* ------------------------------------------------------------------ Tecnologia */

export interface ProjetoTec16 { id: string; nome: string; texto: string; complexidade: number }
export const PROJETOS_TEC16: ProjetoTec16[] = [
  { id: 'banco', nome: 'O aplicativo do banco', texto: 'Refazer o login e as transferências do aplicativo de um banco médio.', complexidade: 70 },
  { id: 'loja', nome: 'A loja na internet', texto: 'Migrar uma loja grande para um sistema novo, sem parar as vendas.', complexidade: 60 },
  { id: 'hospital', nome: 'O sistema do hospital', texto: 'O prontuário eletrônico de uma rede de hospitais: lento, antigo, crítico.', complexidade: 80 },
  { id: 'logistica', nome: 'As rotas de entrega', texto: 'O sistema que decide as rotas de mil entregadores por dia.', complexidade: 65 },
  { id: 'governo', nome: 'O portal público', texto: 'O portal onde a população agenda serviços da prefeitura.', complexidade: 55 },
  { id: 'jogo', nome: 'O jogo para celular', texto: 'Um jogo para celular com lançamento marcado em data de feriado.', complexidade: 50 },
  { id: 'dados', nome: 'O painel de dados', texto: 'Juntar dados de vinte sistemas num painel que a diretoria vai usar para decidir.', complexidade: 60 },
  { id: 'escola', nome: 'A plataforma de ensino', texto: 'A plataforma de aulas de uma rede de escolas, que precisa aguentar a volta às aulas.', complexidade: 55 }
];

export type Ritmo16 = 'prazo' | 'equilibrio' | 'qualidade';
export const RITMOS16: Record<Ritmo16, { nome: string; texto: string; entrega: number; divida: number; cansa: number }> = {
  prazo: { nome: 'Entregar no prazo, custe o que custar', texto: 'Atalhos agora, conserto depois. A dívida técnica cresce.', entrega: 0.2, divida: 16, cansa: 6 },
  equilibrio: { nome: 'Equilibrar prazo e qualidade', texto: 'Negociar escopo, testar o essencial.', entrega: 0.08, divida: 4, cansa: 3 },
  qualidade: { nome: 'Fazer direito, mesmo atrasando', texto: 'Testes, revisão, refatorar o que range. Pode atrasar — e pagar dívida antiga.', entrega: -0.08, divida: -14, cansa: 2 }
};

export const INCIDENTES16: { id: string; texto: string }[] = [
  { id: 'fora', texto: 'Sexta, 23h: o sistema caiu. Ninguém consegue entrar, e o telefone do plantão não para.' },
  { id: 'lento', texto: 'Desde a última entrega, tudo ficou três vezes mais lento — e os clientes começaram a reclamar em público.' },
  { id: 'dados', texto: 'Uma rotina apagou dados de clientes por engano. Há backup — de anteontem.' }
];
