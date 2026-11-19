/**
 * VIDA 28 — os MOMENTOS da carreira de e-sports. O jogador de e-sports não tinha cena própria: pelo contrato 'autonomo'
 * do papel, caía na trajetória do trabalho por conta e recebia "o cliente que não aprova o trabalho", "o orçamento", "a
 * ferramenta quebrada" (corrigido em `mercados.ehCompetidor`). Aqui, a vida de quem compete: a rodada decisiva da
 * final, o atrito com um companheiro sobre a call, a transmissão que dá nome e cansa, a sequência de derrotas que tira
 * a cabeça do lugar, a organização rival que sonda no meio do contrato. Cada desfecho mexe no que a carreira lê: o nome
 * no cenário (`Esports25.reputacao`), os atributos (mental, comunicação, consistência), o estresse.
 *
 * Os ajudantes são locais (como em `situacoes126`): este módulo não importa `situacoes` em tempo de execução.
 */
import type { Desfecho, DesfechoModelo, Efeitos, Fator, ModeloSituacao } from './situacoes';
import type { Vida } from '../tipos';
import type { AtributoEsports } from '../v25/esports/jogos25';

const F = (id: string, valor: number): Fator => ({ id, valor: Math.round(valor * 100) / 100 });
type T = DesfechoModelo['texto'];
const D = (otimo: T, bom: T, ruim: T, pessimo: T, ef: Partial<Record<Desfecho, Efeitos>> = {}, mem: Partial<Record<Desfecho, string>> = {}): Record<Desfecho, DesfechoModelo> => ({
  otimo: { texto: otimo, efeitos: { nome: 3, humor: 3, ...ef.otimo }, memoria: mem.otimo },
  bom: { texto: bom, efeitos: { nome: 1, ...ef.bom }, memoria: mem.bom },
  ruim: { texto: ruim, efeitos: { estresse: 3, ...ef.ruim }, memoria: mem.ruim },
  pessimo: { texto: pessimo, efeitos: { nome: -3, estresse: 6, ...ef.pessimo }, memoria: mem.pessimo }
});
const e25 = (v: Vida) => v.esports25;
/** O atributo do jogo, se o jogo o tem (cada jogo tem o seu conjunto). */
const at = (v: Vida, id: AtributoEsports) => e25(v)?.atributos[id];
const nivelDeJogo = (v: Vida) => { const e = e25(v); if (!e) return 40; const xs = Object.values(e.atributos).filter((x): x is number => typeof x === 'number'); return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 40; };
const mao = (v: Vida) => F('mão', (nivelDeJogo(v) - 55) / 45);
const mental = (v: Vida) => F('cabeça no jogo', ((at(v, 'mental') ?? 45) - 50) / 60 - (v.mente.estresse - 45) / 140);
const comunicacao = (v: Vida) => F('comunicação', ((at(v, 'comunicacao') ?? 45) - 50) / 70);
const coragem = (v: Vida) => F('coragem', v.personalidade.tracos.coragem / 300);
const social = (v: Vida) => F('jeito com gente', v.personalidade.tracos.sociabilidade / 250);
const disciplina = (v: Vida) => F('disciplina', v.personalidade.tracos.disciplina / 300);
/** Mexe num atributo do jogo (dentro de 1..99), se o jogo o tem. */
const mexer = (id: AtributoEsports, delta: number) => (v: Vida) => { const e = e25(v); if (e && e.atributos[id] !== undefined) e.atributos[id] = Math.round(Math.min(99, Math.max(1, e.atributos[id]! + delta)) * 10) / 10; };
const comEquipe = (v: Vida) => { const e = e25(v); return !!e && e.fase !== 'encerrada' && !!e.equipe; };
const equipe = (v: Vida) => e25(v)?.equipe?.nome ?? 'a equipe';

export const MODELOS_ESPORTS28: ModeloSituacao[] = [
  { id: 'esp28_final', trajetoria: 'esports', peso: () => 2, tema: 'decisao', recarga: 3,
    cabe: v => comEquipe(v) && !!e25(v)!.equipe!.titular && (e25(v)!.nivel ?? 1) >= 2,
    contexto: (_v, r) => ({ placar: r.pick(['empatada em 1 a 1, mapa final', 'no último round antes da prorrogação', 'match point deles']) }),
    titulo: 'A rodada da final',
    texto: (v, d) => `Final do campeonato, ${d.placar}. A ${equipe(v)} pede tempo. O plano é seu ou é do capitão — e a torcida do chat está contando os segundos.`,
    intencoes: [
      { id: 'agressivo', texto: 'Chamar a jogada agressiva', dica: 'Se der certo, é o lance do ano. Se não, a final acaba ali.', risco: 0.7, fatores: v => [mao(v), coragem(v), mental(v)],
        desfechos: D('Você abriu o round sozinho e a equipe fechou. Título — e o clipe rodou o cenário inteiro.', 'Deu certo, por pouco: a final foi de vocês.', 'A jogada não encaixou. Perderam a final no detalhe.', 'Você caiu primeiro, sem trocar. O chat não perdoou.',
          { otimo: { extra: mexer('mental', 2), noto: 2 }, pessimo: { extra: mexer('mental', -1) } }, { otimo: 'Decidiu uma final com uma jogada agressiva que virou clipe.', pessimo: 'Perdeu uma final numa jogada arriscada que não deu certo.' }) },
      { id: 'plano', texto: 'Seguir o plano treinado', dica: 'Menos brilho, mais chance de não errar.', risco: 0.25, fatores: v => [disciplina(v), comunicacao(v), mao(v)],
        desfechos: D('O plano saiu como no treino: cada um no seu lugar. Campeões.', 'Executaram limpo. Venceram a final.', 'O outro lado leu o plano. Vice.', 'Ninguém se falou direito e o plano desmontou. Vice, com gosto ruim.',
          { otimo: { extra: mexer('comunicacao', 1.5) }, bom: { extra: mexer('consistencia', 1) } }) },
      { id: 'capitao', texto: 'Deixar a call com o capitão', dica: 'Confia no grupo; a decisão não é sua.', risco: 0.35, fatores: v => [social(v), comunicacao(v)],
        desfechos: D('O capitão leu o jogo e você executou perfeito. O título é do grupo.', 'Vocês ganharam junto.', 'A call não foi a melhor. Perderam juntos, ao menos.', 'Você discordou da call no meio do round — e todo mundo ouviu na transmissão.',
          { otimo: { extra: mexer('comunicacao', 1) } }) }
    ] },
  { id: 'esp28_companheiro', trajetoria: 'esports', peso: () => 1.5, tema: 'grupo', recarga: 4,
    cabe: v => comEquipe(v),
    titulo: 'A call que ninguém respeita',
    texto: v => `Na ${equipe(v)}, um companheiro vive mudando a sua função no meio da partida e diz no chat de voz que a culpa das derrotas é sua. O técnico ainda não se meteu.`,
    intencoes: [
      { id: 'conversar', texto: 'Chamar para conversar fora do jogo', dica: 'Pode resolver; pode virar briga.', risco: 0.35, fatores: v => [social(v), comunicacao(v)],
        desfechos: D('Uma conversa longa, de madrugada, na gaming house. Viraram dupla de verdade.', 'Combinaram o que cada um faz. Melhorou.', 'Ele ouviu, mas nada mudou.', 'A conversa virou discussão — e o resto da equipe tomou partido.',
          { otimo: { extra: mexer('comunicacao', 2) }, pessimo: { estresse: 8 } }) },
      { id: 'tecnico', texto: 'Levar ao técnico', dica: 'A hierarquia resolve — e todos sabem que foi você.', risco: 0.3, fatores: v => [disciplina(v), F('nome no cenário', ((e25(v)?.reputacao ?? 20) - 30) / 80)],
        desfechos: D('O técnico redesenhou as funções e a sua ficou clara. A equipe rendeu mais.', 'O técnico mediou. Paz, por enquanto.', 'O técnico ficou do lado dele.', 'Você virou "o que reclama". O banco ficou mais perto.') },
      { id: 'jogar', texto: 'Engolir e jogar melhor', dica: 'Responder no jogo. Cansa.', risco: 0.45, fatores: v => [mao(v), mental(v)],
        desfechos: D('Você calou o chat com o melhor mês da carreira.', 'Os números falaram por você.', 'O jogo não respondeu, e o atrito ficou.', 'Você engoliu até não dar: tilt no meio de uma partida oficial.',
          { otimo: { extra: mexer('consistencia', 1.5) }, pessimo: { extra: mexer('mental', -1.5), estresse: 8 } }) }
    ] },
  { id: 'esp28_stream', trajetoria: 'esports', peso: () => 1, tema: 'exposicao', recarga: 5,
    cabe: v => { const e = e25(v); return !!e && e.fase !== 'encerrada' && (e.reputacao ?? 0) >= 18; },
    titulo: 'A transmissão',
    texto: () => 'Uma plataforma de transmissão quer você ao vivo todo dia: um contrato pequeno, um público que cresce — e as horas saem do treino e do sono.',
    intencoes: [
      { id: 'todo_dia', texto: 'Transmitir todo dia', dica: 'Nome e dinheiro. O treino sente.', risco: 0.5, fatores: v => [social(v), F('nome no cenário', ((e25(v)?.reputacao ?? 20) - 30) / 70)],
        desfechos: D('O canal explodiu: o público acompanha você até nos treinos.', 'Um público fiel, todo dia.', 'Pouca gente, muita hora de câmera.', 'Um comentário ao vivo, de cabeça quente, virou polêmica no cenário.',
          { otimo: { noto: 3, extra: mexer('consistencia', -1) }, bom: { noto: 1 }, pessimo: { imagem: 'polemica' } }) },
      { id: 'fim_de_semana', texto: 'Só nos fins de semana', dica: 'Um pouco de tudo, sem atrapalhar o treino.', risco: 0.2, fatores: v => [disciplina(v), social(v)],
        desfechos: D('O público dos fins de semana virou comunidade.', 'Um canal pequeno e tranquilo.', 'Ninguém aparece no domingo à noite.', 'O fim de semana de live virou fim de semana sem descanso.') },
      { id: 'recusar', texto: 'Recusar: agora é treino', dica: 'Nada de nome fora do jogo.', risco: 0.1, fatores: () => [],
        desfechos: D('As horas a mais de treino apareceram no campeonato.', 'Seguiu focado.', 'Viu colegas crescendo na transmissão.', 'O nome não cresceu, e o resultado também não veio.', { otimo: { extra: mexer('consistencia', 1) } }) }
    ] },
  { id: 'esp28_tilt', trajetoria: 'esports', peso: () => 1.2, tema: 'cabeca', recarga: 4,
    cabe: v => { const e = e25(v); return !!e && e.fase !== 'encerrada' && e.temporadas.length >= 1; },
    titulo: 'Sete derrotas seguidas',
    texto: () => 'Sete derrotas seguidas, no ranqueado e no oficial. A mira treme no clutch, e você começou a ler os comentários.',
    intencoes: [
      { id: 'pausa', texto: 'Parar três dias, longe do computador', dica: 'O corpo e a cabeça descansam. O ranking não espera.', risco: 0.2, fatores: v => [disciplina(v), F('descanso', (60 - v.mente.estresse) / 100)],
        desfechos: D('Voltou leve e ganhou as dez seguintes.', 'A pausa quebrou a sequência.', 'Voltou, e a sequência continuou um pouco.', 'Os três dias viraram uma semana e a vaga de titular balançou.', { otimo: { estresse: -8, extra: mexer('mental', 1.5) }, bom: { estresse: -5 } }) },
      { id: 'psicologo', texto: 'Procurar o psicólogo da equipe', dica: 'Trabalho de cabeça; leva tempo.', risco: 0.15, fatores: v => [social(v), F('equipe', comEquipe(v) ? 0.15 : -0.15)],
        desfechos: D('Aprendeu a respirar no clutch. Os números de decisão subiram.', 'Algumas sessões, e o jogo voltou.', 'Ainda está no começo.', 'Não encaixou com o profissional — e a sequência seguiu.', { otimo: { extra: mexer('mental', 2.5), estresse: -6 }, bom: { extra: mexer('mental', 1) } }) },
      { id: 'mais_horas', texto: 'Jogar mais horas até virar', dica: 'Às vezes funciona. Às vezes afunda.', risco: 0.6, fatores: v => [mao(v), mental(v)],
        desfechos: D('Virou na raça: a mão voltou.', 'Saiu da sequência, cansado.', 'Mais horas, mesmas derrotas.', 'Doze horas por dia e o pulso começou a doer.', { otimo: { extra: mexer('mental', 1) }, pessimo: { estresse: 10, extra: mexer('mental', -1.5) } }) }
    ] },
  { id: 'esp28_sondagem', trajetoria: 'esports', peso: () => 1, tema: 'mercado', recarga: 5,
    cabe: v => { const e = e25(v); return comEquipe(v) && (e!.reputacao ?? 0) >= 30 && (e!.equipe!.contratoAte ?? 0) > v.t; },
    titulo: 'Uma organização rival sonda',
    texto: v => `O empresário de uma organização maior mandou mensagem: querem você — mas você tem contrato com a ${equipe(v)}. A multa existe; a vontade, também.`,
    intencoes: [
      { id: 'contar', texto: 'Contar à sua organização e pedir renovação', dica: 'Pode virar aumento. Pode virar desconfiança.', risco: 0.4, fatores: v => [social(v), F('nome no cenário', ((e25(v)?.reputacao ?? 20) - 35) / 60)],
        desfechos: D('A organização cobriu o interesse: contrato renovado, salário maior.', 'Conversaram; ficou registrado o seu valor.', 'Ficou um clima: "quer sair?"', 'A diretoria achou que você estava de saída e começou a procurar outro.',
          { otimo: { extra: v => { const eq = e25(v)?.equipe; if (eq && eq.salario > 0) { eq.salario = Math.round(eq.salario * 1.15 / 10) * 10; const emp = v.trabalho.atual?.ocupacaoId === 'jogador_esports' ? v.trabalho.atual : v.trabalho.paralela?.ocupacaoId === 'jogador_esports' ? v.trabalho.paralela : undefined; if (emp) emp.salario = eq.salario; } } } }) },
      { id: 'ignorar', texto: 'Respeitar o contrato e não responder', dica: 'Lealdade. A porta pode não voltar.', risco: 0.15, fatores: v => [disciplina(v)],
        desfechos: D('A organização soube e reconheceu a lealdade.', 'Seguiu na equipe, sem barulho.', 'A outra organização contratou outro.', 'Viu a outra organização ganhar o campeonato com o jogador que foi no seu lugar.') },
      { id: 'forcar', texto: 'Forçar a saída', dica: 'Você pode conseguir — ou ficar marcado.', risco: 0.65, fatores: v => [coragem(v), F('nome no cenário', ((e25(v)?.reputacao ?? 20) - 40) / 50)],
        desfechos: D('A sua organização aceitou negociar: a proposta formal virá na próxima janela.', 'Abriram conversa sobre a sua saída.', 'Não liberaram, e o vestiário ficou sabendo.', 'Foi afastado do time titular até o fim do contrato.',
          { otimo: { extra: v => { const e = e25(v); if (e) e.reputacao = Math.min(100, e.reputacao + 4); } }, pessimo: { extra: v => { const eq = e25(v)?.equipe; if (eq) eq.titular = false; } } }) }
    ] }
];
