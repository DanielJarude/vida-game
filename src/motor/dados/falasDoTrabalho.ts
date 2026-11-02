/**
 * VIDA 12.7 — AS FALAS DO TRABALHO POR AMBIENTE. A conversa do aumento e a leitura do ano ("o trabalho vai bem") eram as
 * mesmas para o garçom, a enfermeira, o motorista e o analista ("sala fechada, café frio"). Aqui, cada ambiente tem o seu
 * cenário e o seu jeito de dizer sim e não. A escolha da frase é estável (do ano e do lugar): a mesma tela não troca de
 * frase a cada abertura, e o ano seguinte não repete a do anterior.
 */
export type AmbienteDeTrabalho = 'balcao' | 'saude' | 'educacao' | 'escritorio' | 'operacao' | 'transporte' | 'seguranca' | 'outro';

const AMBIENTE: Record<string, AmbienteDeTrabalho> = {
  comercio: 'balcao', alimentacao: 'balcao', beleza: 'balcao', saude: 'saude', cuidado: 'saude', educacao: 'educacao',
  administrativo: 'escritorio', financas: 'escritorio', juridico: 'escritorio', tecnologia: 'escritorio', comunicacao: 'escritorio', engenharia: 'escritorio',
  industria: 'operacao', manutencao: 'operacao', construcao: 'operacao', logistica: 'operacao', agro: 'operacao', transporte: 'transporte',
  seguranca: 'seguranca', publico: 'seguranca'
};
export const ambienteDoSetor = (setor: string | undefined): AmbienteDeTrabalho => AMBIENTE[setor ?? ''] ?? 'outro';

/** O começo da conversa do aumento (com quem e onde). */
export const ABERTURA_DO_AUMENTO: Record<AmbienteDeTrabalho, string[]> = {
  balcao: ['Você pediu para falar com a gerência no fim do turno, com o salão vazio e as cadeiras em cima das mesas.', 'Depois de fechar o caixa, você bateu na porta do escritório dos fundos. O gerente fez sinal para entrar.'],
  saude: ['Entre um plantão e outro, você conseguiu dez minutos com a coordenação, no posto, com o telefone tocando.', 'Você pediu uma conversa com a chefia do setor na troca de turno, ainda de jaleco.'],
  educacao: ['Você pediu uma conversa com a direção no intervalo, com a pilha de provas embaixo do braço.', 'Na sala da coordenação, depois da última aula, você puxou o assunto do salário.'],
  escritorio: ['Você marcou quinze minutos com a chefia. Sala fechada, café frio. É a sua vez de falar.', 'Uma reunião de meia hora na agenda, com o título vago de "alinhamento". Você levou os números impressos.'],
  operacao: ['No fim do turno, no escritório do encarregado, com o barulho das máquinas ainda do lado de fora.', 'Você chamou o encarregado de lado no canteiro, na hora do café, e falou do salário.'],
  transporte: ['Na garagem, antes da última viagem do dia, você chamou o supervisor de lado.', 'Você esperou o despachante terminar a escala da semana e puxou a conversa do aumento.'],
  seguranca: ['Você pediu uma conversa com a chefia no fim do expediente, na sala com o quadro de escalas.', 'Na troca de turno, você pediu cinco minutos ao supervisor — e foram vinte.'],
  outro: ['Você marcou uma conversa com quem decide o seu salário. É a sua vez de falar.']
};

/** O "sim" (com o salário novo). */
export const AUMENTO_SIM: Record<AmbienteDeTrabalho, ((s: string) => string)[]> = {
  balcao: [s => `O gerente olhou a planilha de vendas, pensou e aprovou: ${s} a partir do mês que vem.`, s => `"Você segura o salão nos dias cheios", disse a gerência. O salário foi para ${s}.`],
  saude: [s => `A coordenação levou o pedido para a diretoria e voltou com o sim: ${s}.`, s => `Com a escala que você cobre, não tinha como dizer não. O salário foi para ${s}.`],
  educacao: [s => `A direção conseguiu encaixar no orçamento do ano: o salário foi para ${s}.`, s => `Depois de uma semana de espera, o sim veio num bilhete na sua caixinha: ${s}.`],
  escritorio: [s => `A chefia pensou dois dias e aprovou: o salário foi para ${s}.`, s => `O RH mandou o e-mail na sexta: reajuste aprovado, ${s}.`],
  operacao: [s => `O encarregado levou a conversa para cima e voltou com a resposta: ${s} no próximo holerite.`, s => `"Quem não falta e não erra, merece", disse o encarregado. O salário foi para ${s}.`],
  transporte: [s => `O supervisor bateu nas suas viagens sem atraso e aprovou: ${s}.`, s => `A empresa aprovou o aumento: ${s} a partir da próxima folha.`],
  seguranca: [s => `A chefia reconheceu os turnos que você cobriu: o salário foi para ${s}.`, s => `Saiu o aumento: ${s}. Veio com um "não espalha".`],
  outro: [s => `Aprovaram: o salário foi para ${s}.`]
};

/** O "não" de sempre (sem dinheiro este ano). */
export const AUMENTO_NAO: Record<AmbienteDeTrabalho, string[]> = {
  balcao: ['O movimento caiu, disse o gerente: "quando a casa voltar a encher, a gente conversa".', 'Disseram que o dono só mexe em salário em janeiro. Faltam meses.'],
  saude: ['A coordenação até concordou, mas a diretoria segurou: "orçamento congelado até o fim do ano".', 'Disseram que o hospital está renegociando o contrato com o convênio. Nada de aumento por enquanto.'],
  educacao: ['A direção lamentou: o reajuste depende da mantenedora, e a mantenedora disse não.', 'Disseram que a matrícula caiu este ano. Talvez no próximo semestre.'],
  escritorio: ['Disseram que não havia orçamento este ano. Talvez no próximo.', '"Excelente conversa", disse a chefia — e mandou esperar o ciclo de avaliação de dezembro.'],
  operacao: ['O encarregado disse que a obra está com o prazo apertado e o dinheiro contado. Fica para depois.', 'A resposta veio de cima: só o dissídio da categoria, mais nada.'],
  transporte: ['O supervisor disse que a tarifa não sobe, e o salário também não.', 'Disseram que a empresa está trocando a frota: o dinheiro está todo lá.'],
  seguranca: ['A resposta foi a de sempre: "depende do contrato com o cliente".', 'A chefia disse que a tabela é fixa e que não depende dela.'],
  outro: ['Disseram que não havia como este ano.']
};

/** A leitura do ano no trabalho, por desempenho (muito bem, bem, sem destaque, mal). */
export const COMO_VAI: Record<AmbienteDeTrabalho, [string[], string[], string[], string[]]> = {
  balcao: [['O trabalho vai muito bem: tem cliente que pergunta por você pelo nome.', 'O trabalho vai muito bem: é você que a gerência chama no dia de casa cheia.'], ['O trabalho vai bem: o turno corre, o cliente volta.', 'O trabalho vai bem.'], ['O trabalho vai, sem destaque: o turno passa, o mês fecha.', 'O trabalho vai, sem destaque.'], ['O trabalho vem indo mal: reclamação no balcão, bronca no fim do turno.', 'O trabalho vem indo mal, e a gerência já percebeu.']],
  saude: [['O trabalho vai muito bem: a equipe confia em você nos casos difíceis.', 'O trabalho vai muito bem: paciente que volta pergunta por você.'], ['O trabalho vai bem: os plantões fecham sem susto.', 'O trabalho vai bem.'], ['O trabalho vai, sem destaque: plantão atrás de plantão.', 'O trabalho vai, sem destaque.'], ['O trabalho vem indo mal: um erro de escala, uma advertência no prontuário.', 'O trabalho vem indo mal, e a coordenação anda de olho.']],
  educacao: [['O trabalho vai muito bem: as turmas respondem, e outros professores pedem o seu material.', 'O trabalho vai muito bem: a direção cita a sua turma nas reuniões.'], ['O trabalho vai bem: as aulas andam, as provas saem no prazo.', 'O trabalho vai bem.'], ['O trabalho vai, sem destaque: o programa é cumprido, mais nada.', 'O trabalho vai, sem destaque.'], ['O trabalho vem indo mal: turma agitada, nota baixa, reclamação de pai.', 'O trabalho vem indo mal, e a coordenação já chamou para conversar.']],
  escritorio: [['O trabalho vai muito bem: é de você que lembram quando aparece algo difícil.', 'O trabalho vai muito bem: o seu nome aparece nos projetos que importam.'], ['O trabalho vai bem.', 'O trabalho vai bem: as entregas saem, a chefia confia.'], ['O trabalho vai, sem destaque.', 'O trabalho vai, sem destaque: reunião, planilha, e-mail.'], ['O trabalho vem indo mal, e todo mundo percebe.', 'O trabalho vem indo mal: prazos estourados, reuniões tensas.']],
  operacao: [['O trabalho vai muito bem: o encarregado põe você no serviço mais difícil.', 'O trabalho vai muito bem: o que passa pela sua mão não volta.'], ['O trabalho vai bem: sem acidente, sem retrabalho.', 'O trabalho vai bem.'], ['O trabalho vai, sem destaque: bate o ponto, cumpre a meta.', 'O trabalho vai, sem destaque.'], ['O trabalho vem indo mal: retrabalho, atraso, o encarregado de cara feia.', 'O trabalho vem indo mal, e já falaram em advertência.']],
  transporte: [['O trabalho vai muito bem: as viagens sem atraso, nenhuma multa no ano.', 'O trabalho vai muito bem: a escala boa vem para você primeiro.'], ['O trabalho vai bem: as rotas fecham no horário.', 'O trabalho vai bem.'], ['O trabalho vai, sem destaque: estrada, trânsito, volta para a garagem.', 'O trabalho vai, sem destaque.'], ['O trabalho vem indo mal: atraso, reclamação de passageiro, multa.', 'O trabalho vem indo mal, e o supervisor anotou.']],
  seguranca: [['O trabalho vai muito bem: a chefia confia em você no posto mais delicado.', 'O trabalho vai muito bem: elogio formal na ficha.'], ['O trabalho vai bem: turnos tranquilos, nenhuma ocorrência mal resolvida.', 'O trabalho vai bem.'], ['O trabalho vai, sem destaque: ronda, relatório, troca de turno.', 'O trabalho vai, sem destaque.'], ['O trabalho vem indo mal: uma falha no posto, uma advertência na ficha.', 'O trabalho vem indo mal, e a chefia já percebeu.']],
  outro: [['O trabalho vai muito bem: é de você que lembram quando aparece algo difícil.'], ['O trabalho vai bem.'], ['O trabalho vai, sem destaque.'], ['O trabalho vem indo mal, e todo mundo percebe.']]
};

/** Uma escolha estável (de uma chave: o ano, o lugar). */
export function frasePor<T>(chave: string, xs: T[]): T {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) { h ^= chave.charCodeAt(i); h = Math.imul(h, 16777619); }
  return xs[(h >>> 0) % xs.length];
}
