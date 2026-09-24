/**
 * Entrevista de emprego: um processo curto, não um sorteio num clique.
 *
 *   porta (currículo, indicação, estágio) → 2 ou 3 perguntas escolhidas
 *   PARA ESTA VAGA → cada resposta é uma ABORDAGEM → decisão → devolutiva
 *
 * As perguntas vêm de famílias (motivação, experiência, erro, prazo,
 * conflito, atendimento, segurança, liderança, ética, aprendizado...) e são
 * filtradas pelo tipo de trabalho, pela senioridade, pela estrada da pessoa
 * e pela situação dela (primeiro emprego, mudança de área). Perguntas
 * recentes não voltam logo.
 *
 * NÃO HÁ RESPOSTA CERTA UNIVERSAL. Cada abordagem "cai" de um jeito conforme
 * o contexto: avisar o supervisor antes de mexer é o certo num hospital e
 * soa inseguro para quem vai liderar; contar a experiência que se tem vale
 * ouro — para quem tem. Inventar estrada que não tem aparece na segunda
 * pergunta.
 *
 * A entrevista pesa, mas não sozinha: formação, estrada e o mercado vêm de
 * `elegibilidade`. Uma ótima entrevista não faz de ninguém especialista; uma
 * mediana não derruba quem tem muita estrada. A resposta da empresa volta
 * com um motivo plausível — e, às vezes, com uma porta para depois.
 *
 * Personalidade: responder de um jeito numa entrevista não redefine quem a
 * pessoa é. Nada aqui move traços.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Devolutiva, Vida } from '../tipos';
import type { Ocupacao, Setor } from '../dados/ocupacoes';
import { idade } from '../nucleo';
import { experienciaNaTrilha } from './trabalho';

export type Familia =
  | 'motivacao' | 'experiencia' | 'primeiro' | 'mudanca' | 'erro' | 'prazo' | 'conflito' | 'atendimento'
  | 'seguranca' | 'lideranca' | 'etica' | 'aprendizado' | 'iniciativa' | 'responsabilidade' | 'criatividade' | 'fraqueza' | 'equipe';

/** O que a entrevista sabe da vaga e da pessoa. */
export interface CtxEntrevista {
  v: Vida;
  oc: Ocupacao;
  /** Meses de estrada na trilha (e afins). */
  exp: number;
  /** Estrada que a vaga pede. */
  pede: number;
  primeiro: boolean;
  /** Vem de outra área (estrada em outra trilha, pouca nesta). */
  mudanca: boolean;
  /** Vai liderar gente. */
  lidera: boolean;
  junior: boolean;
  /** Formado (ou formando) para o que a vaga pede. */
  formado: boolean;
}

export interface Resposta {
  id: string;
  texto: string;
  /** Como a abordagem cai neste contexto: −1 (pesa contra) a 1 (conta muito a favor). */
  ajuste: (c: CtxEntrevista) => number;
  /** O que a empresa comenta quando essa abordagem foi o ponto alto. */
  bom: string;
  /** ...e quando foi o ponto fraco. */
  ruim: string;
}

export interface Pergunta {
  id: string;
  familia: Familia;
  texto: (c: CtxEntrevista) => string;
  quando?: (c: CtxEntrevista) => boolean;
  /** Mais comum neste tipo de vaga. */
  peso?: (c: CtxEntrevista) => number;
  respostas: Resposta[];
}

/* ------------------------------------------------------------ Setores */

const REGULADO: Setor[] = ['saude', 'financas', 'juridico', 'engenharia', 'publico', 'seguranca'];
const RISCO: Setor[] = ['construcao', 'industria', 'manutencao', 'logistica', 'transporte', 'agro'];
const PUBLICO: Setor[] = ['comercio', 'alimentacao', 'beleza', 'cuidado', 'saude', 'educacao'];
const CRIATIVO: Setor[] = ['criativo', 'comunicacao', 'tecnologia'];

const em = (c: CtxEntrevista, setores: Setor[]) => setores.includes(c.oc.setor);

/* -------------------------------------------------------------- Banco */

export const PERGUNTAS: Pergunta[] = [
  /* --------------------------------------------------------- abertura */
  {
    id: 'mot_agora', familia: 'motivacao',
    texto: () => '"Por que esta vaga faz sentido para você agora?"',
    respostas: [
      { id: 'caminho', texto: 'Explicar como ela continua o que você já vem fazendo', ajuste: c => (c.exp >= 12 || c.formado ? 0.6 : -0.2), bom: 'gostaram de ver que a vaga faz sentido na sua trajetória', ruim: 'a história do "caminho" não fechou com o que o currículo mostra' },
      { id: 'aprender', texto: 'Dizer que quer aprender e crescer ali dentro', ajuste: c => (c.junior ? 0.5 : c.lidera ? -0.3 : 0.1), bom: 'a vontade de aprender contou', ruim: 'para esse nível, esperavam alguém que já chegasse sabendo' },
      { id: 'dinheiro', texto: 'Ser franco: precisa do salário e da estabilidade', ajuste: c => (c.junior && em(c, ['comercio', 'logistica', 'alimentacao', 'industria']) ? 0.2 : -0.3), bom: 'gostaram da franqueza', ruim: 'a resposta soou como se qualquer vaga servisse' },
      { id: 'empresa', texto: 'Falar do que sabe sobre a empresa e o trabalho dela', ajuste: c => (c.lidera || em(c, CRIATIVO) || em(c, ['administrativo', 'financas', 'juridico']) ? 0.5 : 0.2), bom: 'notaram que você chegou sabendo onde estava', ruim: 'o discurso sobre a empresa pareceu decorado' }
    ]
  },
  {
    id: 'exp_conte', familia: 'experiencia',
    quando: c => !c.primeiro,
    texto: () => '"Me conte do trabalho mais parecido com este que você já fez."',
    respostas: [
      { id: 'exemplos', texto: 'Contar o que fez, com exemplos concretos', ajuste: c => (c.exp >= c.pede && c.exp >= 12 ? 0.8 : c.exp >= 12 ? 0.35 : -0.4), bom: 'os exemplos concretos convenceram', ruim: 'faltou o que contar: a experiência ainda é pouca para a vaga' },
      { id: 'estudo', texto: 'Falar do que aprendeu estudando a área', ajuste: c => (c.formado ? 0.45 : -0.35), bom: 'a formação chamou atenção', ruim: 'a formação não sustentou a conversa' },
      { id: 'honesto', texto: 'Admitir que é pouca e mostrar como aprende rápido', ajuste: c => (c.exp < c.pede ? (c.junior ? 0.45 : 0.1) : -0.1), bom: 'a honestidade sobre a pouca estrada pesou a favor', ruim: 'a vaga precisava de alguém que já tivesse feito isso' },
      { id: 'aumentar', texto: 'Aumentar um pouco o que já fez', ajuste: c => (c.exp >= c.pede ? 0 : c.exp < c.pede / 2 ? -0.8 : -0.4), bom: 'a segurança ao falar impressionou', ruim: 'duas perguntas depois, ficou claro que a experiência era menor do que parecia' }
    ]
  },
  {
    id: 'primeiro_destaque', familia: 'primeiro',
    quando: c => c.primeiro || c.exp < 6,
    texto: () => '"Você ainda não tem experiência nessa função. O que destacaria sobre você?"',
    respostas: [
      { id: 'escola', texto: 'Falar do que fez na escola, no curso, em projetos', ajuste: c => (c.formado || !!c.v.educacao.matricula || !!c.v.educacao.basica ? 0.5 : 0), bom: 'o que você fez estudando contou como estrada', ruim: 'faltou algo concreto para mostrar' },
      { id: 'vida', texto: 'Contar como ajuda em casa, cuida de gente, se vira', ajuste: c => (em(c, PUBLICO) || em(c, ['logistica', 'agro']) ? 0.5 : 0.1), bom: 'gostaram de ver responsabilidade fora do currículo', ruim: 'a história foi boa, mas não chegou na vaga' },
      { id: 'pontual', texto: 'Garantir pontualidade e vontade de aprender', ajuste: c => (c.oc.nivel <= 1 ? 0.35 : -0.1), bom: 'para começar, era isso que precisavam ouvir', ruim: 'todo candidato disse a mesma coisa' },
      { id: 'hobby', texto: 'Mostrar algo que faz bem por conta própria', ajuste: c => (c.oc.habilidade ? 0.7 : em(c, CRIATIVO) ? 0.4 : 0), bom: 'o que você faz por conta própria mostrou mais que o currículo', ruim: 'não ficou claro o que aquilo tinha a ver com a vaga' }
    ]
  },
  {
    id: 'mud_area', familia: 'mudanca',
    quando: c => c.mudanca,
    texto: () => '"Você vem de outra área. Por que mudar agora?"',
    respostas: [
      { id: 'ponte', texto: 'Mostrar o que da área antiga serve aqui', ajuste: () => 0.6, bom: 'gostaram de como você ligou uma área à outra', ruim: 'a ponte entre as duas áreas não convenceu' },
      { id: 'cansou', texto: 'Dizer que cansou do trabalho antigo', ajuste: () => -0.4, bom: 'a franqueza foi notada', ruim: 'pareceu mais fuga do que escolha' },
      { id: 'estudou', texto: 'Contar o que já estudou para a mudança', ajuste: c => (c.formado ? 0.7 : -0.2), bom: 'o preparo para a mudança pesou a favor', ruim: 'ainda falta formação para a troca' },
      { id: 'humilde', texto: 'Aceitar recomeçar de baixo, sem problema', ajuste: c => (c.junior ? 0.4 : -0.1), bom: 'a disposição de recomeçar contou', ruim: 'para esse nível, recomeçar do zero não bastava' }
    ]
  },

  /* ------------------------------------------------------ situações */
  {
    id: 'erro_ninguem', familia: 'erro',
    texto: () => '"Você percebe um erro que ninguém mais notou. O que faz?"',
    respostas: [
      { id: 'corrige_avisa', texto: 'Corrige na hora e avisa quem é responsável', ajuste: c => (c.lidera ? 0.5 : em(c, REGULADO) ? 0.2 : 0.5), bom: 'gostaram de como você lidaria com o erro', ruim: 'mexer antes de avisar não caiu bem ali' },
      { id: 'supervisor', texto: 'Leva ao supervisor antes de mexer em qualquer coisa', ajuste: c => (em(c, REGULADO) || em(c, RISCO) ? 0.7 : c.lidera ? -0.3 : 0.2), bom: 'o cuidado com o procedimento contou muito', ruim: 'para quem vai liderar, esperavam mais autonomia' },
      { id: 'discreto', texto: 'Resolve sem alarde, para não expor ninguém', ajuste: c => (em(c, REGULADO) ? -0.5 : em(c, PUBLICO) ? 0.25 : 0), bom: 'a discrição foi bem vista', ruim: 'resolver sem registrar é justamente o que ali não pode' },
      { id: 'depende', texto: 'Depende do tamanho: se for grave, para tudo', ajuste: c => (c.lidera || c.oc.nivel >= 3 ? 0.6 : 0), bom: 'o julgamento sobre gravidade impressionou', ruim: 'a resposta ficou vaga' }
    ]
  },
  {
    id: 'prazo_tudo', familia: 'prazo',
    texto: () => '"O prazo apertou e há várias tarefas ao mesmo tempo. Como você se organiza?"',
    respostas: [
      { id: 'lista', texto: 'Faz uma lista e ataca pela ordem de prioridade', ajuste: c => (em(c, ['administrativo', 'financas', 'juridico', 'tecnologia', 'engenharia']) ? 0.6 : 0.3), bom: 'a organização convenceu', ruim: 'soou bonito, mas genérico' },
      { id: 'pergunta', texto: 'Pergunta ao chefe o que vem primeiro', ajuste: c => (c.junior ? 0.5 : c.lidera ? -0.4 : 0.1), bom: 'saber perguntar é o que esperavam de quem começa', ruim: 'para esse nível, queriam alguém que decidisse' },
      { id: 'hora_extra', texto: 'Fica até mais tarde e dá conta de tudo', ajuste: c => (em(c, ['comercio', 'alimentacao']) ? 0.2 : -0.1), bom: 'a disposição foi notada', ruim: 'a empresa não queria alguém que resolve tudo virando a noite' },
      { id: 'divide', texto: 'Divide o trabalho com a equipe', ajuste: c => (c.lidera ? 0.7 : 0.1), bom: 'o jeito de dividir o trabalho mostrou liderança', ruim: 'na vaga, você seria quem recebe a tarefa, não quem distribui' }
    ]
  },
  {
    id: 'conflito_colega', familia: 'conflito',
    texto: () => '"Você discorda da forma como um colega está fazendo uma tarefa. Como lida com isso?"',
    respostas: [
      { id: 'conversa', texto: 'Conversa com ele, a sós, e mostra o seu jeito', ajuste: () => 0.4, bom: 'gostaram do jeito de lidar com a divergência', ruim: 'faltou dizer o que faria se ele não mudasse' },
      { id: 'chefe', texto: 'Leva ao chefe para ele decidir', ajuste: c => (em(c, RISCO) || em(c, REGULADO) ? 0.35 : -0.3), bom: 'quando o erro pode machucar alguém, subir o assunto é o certo', ruim: 'pareceu que qualquer atrito viraria problema do chefe' },
      { id: 'deixa', texto: 'Deixa: cada um tem seu jeito', ajuste: c => (em(c, CRIATIVO) ? 0.2 : em(c, RISCO) ? -0.5 : -0.1), bom: 'a tolerância com jeitos diferentes contou', ruim: 'ali, jeito errado de fazer tem consequência' },
      { id: 'mostra', texto: 'Faz do seu jeito e deixa o resultado falar', ajuste: c => (c.lidera ? -0.2 : -0.3), bom: 'a confiança no próprio trabalho apareceu', ruim: 'soou como quem não trabalha bem em equipe' }
    ]
  },
  {
    id: 'cliente_bravo', familia: 'atendimento',
    quando: c => em(c, PUBLICO) || em(c, ['transporte', 'financas', 'juridico']),
    peso: () => 2,
    texto: c => (em(c, ['saude', 'cuidado']) ? '"Um paciente chega nervoso, reclamando de tudo. O que você faz?"' : '"Um cliente chega bravo, falando alto. Como você reage?"'),
    respostas: [
      { id: 'escuta', texto: 'Escuta até o fim antes de responder', ajuste: c => (em(c, ['saude', 'cuidado']) ? 0.7 : 0.5), bom: 'o jeito de acolher o cliente convenceu', ruim: 'faltou dizer como resolveria depois de ouvir' },
      { id: 'resolve', texto: 'Vai direto ao problema e resolve rápido', ajuste: c => (em(c, ['comercio', 'alimentacao']) ? 0.5 : 0.15), bom: 'a objetividade foi o ponto alto', ruim: 'pular a escuta, ali, piora a situação' },
      { id: 'gerente', texto: 'Chama o gerente', ajuste: c => (c.junior ? 0.1 : -0.4), bom: 'saber o limite de cada um foi bem visto', ruim: 'esperavam que você conseguisse segurar a situação' },
      { id: 'firme', texto: 'Mantém a regra, com educação e firmeza', ajuste: c => (em(c, ['financas', 'juridico', 'saude']) ? 0.45 : 0.1), bom: 'a firmeza educada foi notada', ruim: 'pareceu rígido demais para atendimento' }
    ]
  },
  {
    id: 'seguranca_ritmo', familia: 'seguranca',
    quando: c => em(c, RISCO),
    peso: () => 2,
    texto: () => '"O equipamento de segurança atrasa o serviço e a equipe quer pular essa parte. O que você faz?"',
    respostas: [
      { id: 'nao_pula', texto: 'Não pula: segurança antes do prazo', ajuste: () => 0.8, bom: 'a resposta sobre segurança foi exatamente o que queriam ouvir', ruim: '—' },
      { id: 'pula_rapido', texto: 'Pula só dessa vez, para não atrasar', ajuste: () => -0.8, bom: '—', ruim: 'a resposta sobre segurança pesou muito contra' },
      { id: 'avisa', texto: 'Avisa o encarregado e segue a decisão dele', ajuste: c => (c.junior ? 0.4 : 0.1), bom: 'saber a quem recorrer contou', ruim: 'esperavam firmeza, não transferir a decisão' },
      { id: 'jeito', texto: 'Procura um jeito de ser seguro e rápido', ajuste: c => (c.oc.nivel >= 2 ? 0.5 : 0.2), bom: 'a busca por um jeito melhor impressionou', ruim: 'não ficou claro o que faria no dia' }
    ]
  },
  {
    id: 'lider_baixo', familia: 'lideranca',
    quando: c => c.lidera,
    peso: () => 3,
    texto: () => '"Alguém da sua equipe vem rendendo abaixo do esperado há meses. O que você faz?"',
    respostas: [
      { id: 'conversa', texto: 'Conversa para entender o que está acontecendo', ajuste: () => 0.6, bom: 'o jeito de lidar com a equipe convenceu', ruim: 'faltou dizer o que faria se nada mudasse' },
      { id: 'metas', texto: 'Define metas claras e acompanha de perto', ajuste: c => (em(c, ['comercio', 'financas', 'industria', 'logistica']) ? 0.6 : 0.3), bom: 'a clareza na gestão foi o ponto alto', ruim: 'pareceu mais cobrança do que liderança' },
      { id: 'troca', texto: 'Substitui a pessoa: a equipe não pode esperar', ajuste: () => -0.3, bom: 'a firmeza foi notada', ruim: 'a pressa em trocar gente assustou' },
      { id: 'faz', texto: 'Assume a parte dela até resolver', ajuste: () => -0.4, bom: 'o comprometimento apareceu', ruim: 'quem lidera não pode virar o gargalo da equipe' }
    ]
  },
  {
    id: 'etica_pedido', familia: 'etica',
    quando: c => c.oc.nivel >= 1,
    peso: c => (em(c, REGULADO) ? 2 : 0.7),
    texto: c => (em(c, ['financas', 'administrativo', 'juridico']) ? '"O chefe pede para ajustar um número num relatório, \'só dessa vez\'. O que você faz?"' : '"Um colega pede para você registrar que ele chegou no horário, e ele não chegou. O que você faz?"'),
    respostas: [
      { id: 'recusa', texto: 'Recusa com educação e explica por quê', ajuste: () => 0.6, bom: 'a postura ética pesou muito', ruim: '—' },
      { id: 'faz', texto: 'Faz, para não criar problema', ajuste: () => -0.7, bom: '—', ruim: 'a resposta sobre o pedido errado pesou contra' },
      { id: 'registra', texto: 'Faz o certo e deixa registrado', ajuste: c => (em(c, REGULADO) ? 0.7 : 0.4), bom: 'a preocupação com o registro chamou atenção', ruim: 'soou burocrático demais para o lugar' },
      { id: 'pergunta', texto: 'Pergunta a alguém de confiança o que fazer', ajuste: c => (c.junior ? 0.2 : -0.1), bom: 'a prudência foi notada', ruim: 'ali, esperavam certeza nessa resposta' }
    ]
  },
  {
    id: 'aprender_novo', familia: 'aprendizado',
    texto: c => (em(c, ['tecnologia']) ? '"Te pedem para usar uma ferramenta que você nunca viu, para amanhã. O que você faz?"' : '"Te pedem uma tarefa que você nunca fez e ninguém tem tempo de ensinar. O que você faz?"'),
    respostas: [
      { id: 'estuda', texto: 'Estuda por conta e volta com uma primeira versão', ajuste: c => (em(c, CRIATIVO) || c.oc.nivel >= 2 ? 0.6 : 0.3), bom: 'o jeito de aprender sozinho convenceu', ruim: 'arriscar sozinho, ali, pode sair caro' },
      { id: 'pede', texto: 'Pede dez minutos a alguém que já fez', ajuste: c => (c.junior || em(c, RISCO) ? 0.5 : 0.2), bom: 'saber pedir ajuda na hora certa foi bem visto', ruim: 'esperavam mais autonomia' },
      { id: 'avisa_prazo', texto: 'Avisa que vai precisar de mais tempo', ajuste: c => (em(c, REGULADO) ? 0.4 : 0), bom: 'a franqueza sobre o prazo foi notada', ruim: 'pareceu que qualquer coisa nova vira atraso' },
      { id: 'tenta', texto: 'Tenta do jeito que der e vê no que dá', ajuste: c => (em(c, REGULADO) || em(c, RISCO) ? -0.5 : -0.1), bom: 'a coragem de tentar apareceu', ruim: '"ver no que dá" não é o que se quer ouvir ali' }
    ]
  },
  {
    id: 'processo_ruim', familia: 'iniciativa',
    quando: c => !c.primeiro,
    texto: () => '"Você nota que um processo do setor faz todo mundo perder tempo. O que faz?"',
    respostas: [
      { id: 'propoe', texto: 'Propõe uma mudança, com um jeito de testar', ajuste: c => (c.oc.nivel >= 2 ? 0.6 : 0.2), bom: 'a iniciativa com cuidado impressionou', ruim: 'para quem acaba de chegar, pareceu cedo para mudar tudo' },
      { id: 'faz_seu', texto: 'Faz do seu jeito, mais rápido, sem avisar', ajuste: c => (em(c, REGULADO) || em(c, RISCO) ? -0.6 : -0.2), bom: 'a eficiência foi notada', ruim: 'mudar sem avisar foi mal visto' },
      { id: 'segue', texto: 'Segue o processo: deve ter um motivo', ajuste: c => (c.junior ? 0.3 : c.lidera ? -0.4 : 0), bom: 'o respeito pelo processo contou', ruim: 'esperavam alguém que melhorasse as coisas' },
      { id: 'dados', texto: 'Mede quanto tempo se perde antes de propor', ajuste: c => (em(c, ['administrativo', 'financas', 'tecnologia', 'engenharia', 'industria', 'logistica']) ? 0.7 : 0.2), bom: 'chegar com números foi o ponto alto', ruim: 'pareceu complicar o simples' }
    ]
  },
  {
    id: 'falta_turno', familia: 'responsabilidade',
    quando: c => em(c, ['saude', 'cuidado', 'alimentacao', 'comercio', 'seguranca', 'transporte', 'industria']),
    texto: () => '"Faltou gente no turno e pedem para você cobrir, no seu dia de folga. O que você responde?"',
    respostas: [
      { id: 'cobre', texto: 'Cobre, e combina a folga para outro dia', ajuste: () => 0.5, bom: 'a disponibilidade combinada foi bem vista', ruim: '—' },
      { id: 'sempre', texto: 'Cobre sempre que precisarem', ajuste: c => (c.junior ? 0.3 : 0), bom: 'a disposição foi notada', ruim: 'prometer "sempre" soou pouco realista' },
      { id: 'nao', texto: 'Diz que folga é folga', ajuste: () => -0.3, bom: 'a clareza sobre limites apareceu', ruim: 'a resposta sobre o turno pesou contra' },
      { id: 'depende', texto: 'Depende: se for emergência, vai', ajuste: () => 0.3, bom: 'o equilíbrio da resposta contou', ruim: 'ficou vago' }
    ]
  },
  {
    id: 'ideia_nova', familia: 'criatividade',
    quando: c => em(c, CRIATIVO) || em(c, ['comercio', 'alimentacao', 'beleza', 'educacao']),
    texto: () => '"Conte uma ideia sua que deu certo — ou que deu errado e ensinou alguma coisa."',
    respostas: [
      { id: 'deu_certo', texto: 'Contar uma que deu certo, com detalhe', ajuste: c => (c.exp >= 12 || c.oc.habilidade ? 0.6 : 0), bom: 'a ideia que você contou chamou atenção', ruim: 'faltou um exemplo de verdade' },
      { id: 'deu_errado', texto: 'Contar uma que deu errado e o que aprendeu', ajuste: () => 0.45, bom: 'contar um erro com clareza impressionou', ruim: 'o aprendizado ficou pouco claro' },
      { id: 'nenhuma', texto: 'Dizer que prefere seguir o que já funciona', ajuste: c => (em(c, CRIATIVO) ? -0.6 : -0.1), bom: 'a honestidade foi notada', ruim: 'para essa vaga, queriam alguém com ideias' },
      { id: 'equipe', texto: 'Contar uma ideia que foi da equipe toda', ajuste: () => 0.3, bom: 'o jeito de falar do time contou', ruim: 'não ficou claro qual foi a sua parte' }
    ]
  },
  {
    id: 'ponto_fraco', familia: 'fraqueza',
    texto: () => '"Qual é o seu ponto fraco?"',
    peso: () => 0.7,
    respostas: [
      { id: 'real', texto: 'Contar um de verdade e o que faz a respeito', ajuste: () => 0.5, bom: 'a sinceridade sobre o ponto fraco foi o ponto alto', ruim: '—' },
      { id: 'perfeccionista', texto: '"Sou perfeccionista demais"', ajuste: () => -0.3, bom: '—', ruim: 'a resposta pronta sobre o ponto fraco não ajudou' },
      { id: 'nenhum', texto: 'Dizer que não lembra de nenhum', ajuste: () => -0.5, bom: '—', ruim: 'não ter ponto fraco soou pouco sincero' },
      { id: 'vaga', texto: 'Um que não atrapalha nessa vaga', ajuste: () => 0.25, bom: 'a escolha do exemplo foi esperta', ruim: 'pareceu estratégia demais' }
    ]
  },
  {
    id: 'equipe_gosta', familia: 'equipe',
    texto: () => '"Como você prefere trabalhar: sozinho ou em equipe?"',
    peso: () => 0.8,
    respostas: [
      { id: 'equipe', texto: 'Em equipe, trocando o tempo todo', ajuste: c => (em(c, ['saude', 'alimentacao', 'construcao', 'industria', 'comercio']) ? 0.5 : 0.2), bom: 'o gosto por trabalhar junto contou', ruim: 'ali, boa parte do trabalho é solitária' },
      { id: 'sozinho', texto: 'Sozinho, com autonomia', ajuste: c => (em(c, ['tecnologia', 'criativo', 'transporte']) ? 0.4 : -0.2), bom: 'a autonomia foi bem vista', ruim: 'soou como quem não gosta de dividir' },
      { id: 'depende', texto: 'Depende da tarefa — e dá exemplos', ajuste: () => 0.45, bom: 'os exemplos concretos convenceram', ruim: 'ficou vago' },
      { id: 'tanto', texto: 'Tanto faz', ajuste: () => -0.3, bom: '—', ruim: '"tanto faz" não ajudou' }
    ]
  }
];

const POR_ID = new Map(PERGUNTAS.map(p => [p.id, p]));
export const perguntaPorId = (id: string) => POR_ID.get(id);

const LIMITE_RECENTES = 10;

/* -------------------------------------------------------------- Contexto */

export function ctxEntrevista(v: Vida, oc: Ocupacao): CtxEntrevista {
  const exp = experienciaNaTrilha(v, oc.trilha);
  const trabalhou = v.trabalho.historico.length > 0 || !!v.trabalho.atual;
  const outras = Object.entries(v.trabalho.experiencia).filter(([t, m]) => t !== oc.trilha && m >= 24).length > 0;
  const areas = new Set(v.educacao.concluidos.map(x => x.area));
  const formado = !!oc.area?.some(a => a === 'qualquer' || areas.has(a)) || (!!v.educacao.matricula && !!oc.matriculado);
  return {
    v, oc, exp, pede: oc.experiencia ?? 0,
    primeiro: !trabalhou,
    mudanca: outras && exp < 12 && idade(v) >= 22,
    lidera: oc.nivel >= 4,
    junior: oc.nivel <= 2,
    formado
  };
}

/** Quantas perguntas: vaga de entrada é conversa rápida; o resto, três. */
export const numeroDePerguntas = (oc: Ocupacao) => (oc.nivel <= 1 ? 2 : 3);

/**
 * Escolhe as perguntas desta entrevista: uma de abertura (a que faz sentido
 * para a situação da pessoa) e as outras das situações do tipo de trabalho —
 * famílias diferentes, sem repetir as usadas recentemente.
 */
export function escolherPerguntas(v: Vida, r: Rng, oc: Ocupacao): string[] {
  const c = ctxEntrevista(v, oc);
  const recentes = new Set(v.caminhos.entrevistas.recentes);
  const cabem = PERGUNTAS.filter(p => !p.quando || p.quando(c));
  const frescas = (lista: Pergunta[]) => (lista.some(p => !recentes.has(p.id)) ? lista.filter(p => !recentes.has(p.id)) : lista);
  const aberturas = frescas(cabem.filter(p => ['motivacao', 'experiencia', 'primeiro', 'mudanca'].includes(p.familia)));
  // A abertura segue a situação: primeiro emprego, mudança de área, estrada.
  const preferida = aberturas.filter(p => (c.mudanca ? p.familia === 'mudanca' : c.primeiro || c.exp < 6 ? p.familia === 'primeiro' : p.familia === 'experiencia'));
  const primeira = r.pick(preferida.length && r.chance(0.7) ? preferida : aberturas);
  const escolhidas = [primeira];
  const familias = new Set([primeira.familia]);
  const n = numeroDePerguntas(oc);
  while (escolhidas.length < n) {
    const resto = frescas(cabem.filter(p => !familias.has(p.familia) && !['motivacao', 'experiencia', 'primeiro', 'mudanca'].includes(p.familia) && !escolhidas.includes(p)));
    const p = r.weighted(resto, x => x.peso?.(c) ?? 1);
    if (!p) break;
    escolhidas.push(p);
    familias.add(p.familia);
  }
  const ids = escolhidas.map(p => p.id);
  const lista = v.caminhos.entrevistas.recentes;
  lista.push(...ids);
  if (lista.length > LIMITE_RECENTES) lista.splice(0, lista.length - LIMITE_RECENTES);
  return ids;
}

/** Como a resposta caiu (−1..1). */
export function notaDaResposta(v: Vida, oc: Ocupacao, perguntaId: string, respostaId: string): number {
  const p = perguntaPorId(perguntaId);
  const resp = p?.respostas.find(x => x.id === respostaId);
  if (!p || !resp) return 0;
  return clamp(resp.ajuste(ctxEntrevista(v, oc)), -1, 1);
}

/** A reação do entrevistador, entre uma pergunta e outra — sem entregar a nota. */
export function reacao(r: Rng, nota: number): string {
  if (nota >= 0.45) return r.pick(['A entrevistadora anotou alguma coisa e sorriu de leve.', 'O entrevistador concordou com a cabeça antes de você terminar.', 'Anotaram algo. Pareceu bom.']);
  if (nota <= -0.2) return r.pick(['Um silêncio curto. A próxima pergunta veio rápido.', 'O entrevistador não anotou nada.', 'Uma sobrancelha levantou, discreta.']);
  return r.pick(['Assentiram, sem pista nenhuma.', 'Anotaram. Não deu para saber o quê.', 'Seguiram para a próxima.']);
}

/* ------------------------------------------------------------ Resultado */

export interface Avaliacao {
  chance: number;
  media: number;
  melhor?: Resposta;
  pior?: Resposta;
  /** O que mais pesou contra, se não passar. */
  falta: NonNullable<Devolutiva['falta']>;
}

/**
 * A chance final: o perfil (formação, estrada, mercado, porta) é a base; a
 * entrevista soma ou tira até ~0,2; a prática de outras entrevistas ajuda
 * um pouco. Deterministico dado o estado.
 */
export function avaliar(v: Vida, oc: Ocupacao, base: number, porta: number, etapas: { id: string; resposta?: string; nota?: number }[]): Avaliacao {
  const notas = etapas.map(e => e.nota ?? 0);
  const media = notas.length ? notas.reduce((s, x) => s + x, 0) / notas.length : 0;
  const pratica = Math.min(0.05, v.caminhos.entrevistas.feitas * 0.01);
  const chance = clamp(base + porta + media * 0.2 + pratica, 0.03, 0.95);
  const respostas = etapas.map(e => ({ e, resp: perguntaPorId(e.id)?.respostas.find(x => x.id === e.resposta) })).filter(x => x.resp);
  const ordem = [...respostas].sort((a, b) => (b.e.nota ?? 0) - (a.e.nota ?? 0));
  const melhor = ordem[0] && (ordem[0].e.nota ?? 0) >= 0.3 ? ordem[0].resp : undefined;
  const pior = ordem.length && (ordem[ordem.length - 1].e.nota ?? 0) <= -0.1 ? ordem[ordem.length - 1].resp : undefined;
  const c = ctxEntrevista(v, oc);
  const falta: Avaliacao['falta'] = c.pede > 0 && c.exp < c.pede ? 'experiencia' : base < 0.28 && !c.formado && !!oc.area ? 'formacao' : media < -0.1 ? 'entrevista' : 'concorrencia';
  return { chance, media, melhor, pior, falta };
}
