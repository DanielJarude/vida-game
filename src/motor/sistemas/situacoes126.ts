/**
 * VIDA 12.6 — O TRABALHO DE CADA UM. A auditoria achou as profissões que só recebiam as cenas genéricas de escritório
 * ("o relatório que já foi para o cliente", "a apresentação para a diretoria") — a auxiliar de limpeza, o motorista, a
 * cuidadora, o frentista, a costureira, a confeiteira, o catador, o servidor do balcão público, o fiscal, a
 * veterinária, o professor de educação física, a pesquisadora, o técnico de segurança do trabalho. Aqui, as cenas de
 * cada rotina de verdade (o produto que mancha o mármore, o passageiro que passa mal, a família que discorda do
 * cuidado, a bomba que dá defeito, a encomenda de casamento, a fiscalização que pressiona); e as genéricas de
 * escritório deixam de chegar a quem não trabalha em escritório (`TRILHAS_SEM_ESCRITORIO`).
 *
 * E o que a 12.6 traz para qualquer emprego: o JEITO DO CHEFE (exigente, compreensivo, injusto, incentivador,
 * autoritário, desorganizado — lido do temperamento dele, `jeito.perfilDoChefe`) e a DISPUTA pela vaga com um colega de
 * verdade; e o tênis do jovem profissional, que ficava anos sem cena.
 *
 * Os ajudantes são locais (como em `situacoes125`): este módulo não importa `situacoes` em tempo de execução.
 */
import type { Desfecho, DesfechoModelo, Efeitos, Fator, ModeloSituacao } from './situacoes';
import type { Vida } from '../tipos';
import { idade } from '../nucleo';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { habilidade } from './frentes';
import { NOME_PERFIL_CHEFE, perfilDoChefe } from './jeito';

const F = (id: string, valor: number): Fator => ({ id, valor: Math.round(valor * 100) / 100 });
type T = DesfechoModelo['texto'];
const D = (otimo: T, bom: T, ruim: T, pessimo: T, ef: Partial<Record<Desfecho, Efeitos>> = {}, mem: Partial<Record<Desfecho, string>> = {}): Record<Desfecho, DesfechoModelo> => ({
  otimo: { texto: otimo, efeitos: { nome: 2, humor: 3, ...ef.otimo }, memoria: mem.otimo },
  bom: { texto: bom, efeitos: { nome: 1, ...ef.bom }, memoria: mem.bom },
  ruim: { texto: ruim, efeitos: { estresse: 3, ...ef.ruim }, memoria: mem.ruim },
  pessimo: { texto: pessimo, efeitos: { nome: -2, estresse: 6, ...ef.pessimo }, memoria: mem.pessimo }
});
const cabeca = (v: Vida) => F('cabeça', -(v.mente.estresse - 45) / 110);
const coragem = (v: Vida) => F('coragem', v.personalidade.tracos.coragem / 300);
const social = (v: Vida) => F('jeito com gente', v.personalidade.tracos.sociabilidade / 250);
const empatia = (v: Vida) => F('empatia', v.personalidade.tracos.empatia / 280);
const disciplina = (v: Vida) => F('disciplina', v.personalidade.tracos.disciplina / 300);
const competencia = (v: Vida) => { const e = v.trabalho.atual; const anos = e ? Math.min(20, (v.t - e.tInicio) / 12) : 0; return F('competência', ((e?.desempenho ?? 50) - 55) / 90 + anos / 60); };
const forma = (v: Vida) => F('forma', (v.corpo.forma - 65) / 70);
const tecnica = (v: Vida) => { const es = v.caminhos.esporte; return F('técnica', es ? (habilidade(v, es.modalidade) - 60) / 40 : 0); };
const trilha = (v: Vida) => (v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.trilha : undefined);
const naTrilha = (...ts: string[]) => (v: Vida) => { const t = trilha(v); return !!t && ts.includes(t); };
const PESO = () => 1.7;
const anosDeCasa = (v: Vida) => (v.trabalho.atual ? (v.t - v.trabalho.atual.tInicio) / 12 : 0);

/** As profissões que não trabalham num escritório: as cenas genéricas de escritório (o relatório, a diretoria) não chegam a elas. */
export const TRILHAS_SEM_ESCRITORIO = ['limpeza', 'domestico', 'cuidado', 'transporte', 'estrada', 'posto', 'costura', 'confeitaria', 'reciclagem', 'veterinaria', 'educacao_fisica', 'seguranca_trabalho', 'alimentacao', 'beleza'];

/** O chefe de agora (quando a equipe tem um, vivo). */
const chefe = (v: Vida) => { const id = v.trabalho.atual?.equipe?.chefeId; const p = id ? v.pessoas[id] : undefined; return p?.vivo ? p : undefined; };
const comChefe = (perfis: string[]) => (v: Vida) => { const c = chefe(v); return !!c && perfis.includes(perfilDoChefe(c)); };
const nomeChefe = (v: Vida) => chefe(v)?.nome ?? 'a chefia';

const BASE_126: ModeloSituacao[] = [
  /* ---------------------------------------------------------------- Limpeza */
  { id: 'lim126_marmore', trajetoria: 'emprego', tema: 'lim_produto', recarga: 6, peso: PESO, cabe: naTrilha('limpeza', 'domestico'),
    titulo: 'O produto errado',
    texto: () => 'O produto novo que mandaram usar mancha o piso de mármore da recepção. A supervisora quer tudo brilhando até as oito.',
    intencoes: [
      { id: 'avisar', texto: 'Parar e avisar antes de estragar mais', dica: 'Quem conhece o piso sabe.', risco: 0.3, fatores: v => [competencia(v), coragem(v)], desfechos: D('Trocaram o produto; a supervisora agradeceu na frente de todo mundo.', 'Trocaram o produto.', 'A supervisora achou que era desculpa para não terminar.', 'Levou a culpa pela mancha que já estava lá.', { otimo: { feito: 1, clima: 6 } }) },
      { id: 'terminar', texto: 'Terminar do jeito que mandaram', dica: 'Ordem é ordem.', risco: 0.4, fatores: v => [disciplina(v)], desfechos: D('Ninguém reparou nas manchas.', 'Terminou a tempo.', 'A mancha apareceu com a luz do dia.', 'Descontaram o piso do contrato da empresa — e de você ouviram.', { pessimo: { clima: -10 } }) }
    ] },
  { id: 'lim126_achado', trajetoria: 'emprego', tema: 'lim_etica', recarga: 8, cabe: naTrilha('limpeza', 'domestico'),
    titulo: 'O envelope no chão',
    texto: () => 'Debaixo de uma mesa, um envelope com dinheiro. Ninguém por perto; a câmera do corredor está quebrada há semanas.',
    intencoes: [
      { id: 'devolver', texto: 'Entregar para a administração', dica: 'Honestidade de quem limpa ninguém vê. Até ver.', risco: 0.2, fatores: v => [F('consciência', v.personalidade.tracos.empatia / 250)], desfechos: D('O dono veio agradecer pessoalmente — e virou alguém que pergunta por você.', 'Entregou; agradeceram.', 'Ninguém agradeceu; sumiu na administração.', 'Desconfiaram que tinha mais dinheiro no envelope.', { otimo: { feito: 1, humor: 4 } }, { otimo: 'Devolveu um envelope de dinheiro achado no trabalho.' }) },
      { id: 'deixar', texto: 'Deixar onde está', dica: 'Não é problema seu.', risco: 0.1, fatores: () => [], desfechos: D('Alguém achou depois; não houve conversa.', 'Ficou lá.', 'O dono apareceu perguntando quem limpou a sala.', 'A suspeita caiu sobre a equipe da limpeza.', { pessimo: { clima: -6, estresse: 6 } }) }
    ] },
  /* ---------------------------------------------------------------- Cuidado (cuidadora, babá) */
  { id: 'cui126_familia', trajetoria: 'emprego', tema: 'cui_familia', recarga: 5, peso: PESO, cabe: naTrilha('cuidado'),
    titulo: 'A família que discorda',
    texto: () => 'A filha da senhora de quem você cuida quer cortar o passeio da tarde ("ela cansa"); o filho acha que ela precisa sair. Os dois ligam para você.',
    intencoes: [
      { id: 'medico', texto: 'Propor ouvir o médico dela', dica: 'Tira você do meio.', risco: 0.25, fatores: v => [social(v), competencia(v)], desfechos: D('O médico liberou o passeio curto; a família parou de brigar por isso.', 'Ficou combinado assim.', 'A família continuou brigando — com você no meio.', 'A filha achou que você tomou partido do irmão.', { pessimo: { clima: -8 } }) },
      { id: 'ela', texto: 'Perguntar o que ela quer', dica: 'É a vida dela.', risco: 0.4, fatores: v => [empatia(v), coragem(v)], desfechos: D('Ela quis o passeio — e a família respeitou a vontade dela.', 'Ela escolheu; os filhos aceitaram.', 'Os filhos acharam que não era seu lugar.', 'Perdeu o trabalho por "passar dos limites".', { otimo: { humor: 5 }, pessimo: { clima: -14, estresse: 8 } }) }
    ] },
  { id: 'cui126_noite', trajetoria: 'emprego', tema: 'cui_urgencia', recarga: 6, cabe: naTrilha('cuidado'),
    titulo: 'A noite que piorou',
    texto: () => 'Três da manhã, a respiração mudou. A família não atende o telefone.',
    intencoes: [
      { id: 'samu', texto: 'Chamar a ambulância e ir junto', dica: 'Melhor errar para mais.', risco: 0.3, fatores: v => [competencia(v), cabeca(v)], desfechos: D('Era uma pneumonia no começo — pega a tempo. A família não sabe como agradecer.', 'Ficou internada dois dias e voltou.', 'Era só um susto, e a família reclamou da conta da ambulância.', 'Chegou tarde demais ao hospital.', { otimo: { feito: 1 }, pessimo: { estresse: 14 } }, { otimo: 'Uma madrugada, levou a tempo ao hospital quem cuidava.' }) },
      { id: 'esperar', texto: 'Ficar observando e tentar a família de novo', dica: 'Às vezes é só uma noite ruim.', risco: 0.5, fatores: v => [competencia(v)], desfechos: D('Melhorou sozinha antes do amanhecer.', 'A família atendeu e decidiu levar de manhã.', 'Piorou; a ambulância veio de manhã.', 'Não deu tempo.', { pessimo: { estresse: 16 } }) }
    ] },
  /* ---------------------------------------------------------------- Transporte e estrada */
  { id: 'tra126_passageiro', trajetoria: 'emprego', tema: 'tra_passageiro', recarga: 5, peso: PESO, cabe: naTrilha('transporte', 'estrada'),
    titulo: 'O passageiro que passou mal',
    texto: () => 'No meio do trajeto, um passageiro fica pálido e cai no banco. O próximo ponto é longe; o hospital, um desvio de quinze minutos.',
    intencoes: [
      { id: 'desviar', texto: 'Desviar para o hospital', dica: 'O horário que se dane.', risco: 0.3, fatores: v => [coragem(v), cabeca(v)], desfechos: D('Chegou a tempo; a empresa publicou a história no mural.', 'Chegou a tempo; levou uma advertência pelo atraso, depois retirada.', 'Era desmaio de fome; a advertência ficou.', 'Os outros passageiros fizeram reclamação formal.', { otimo: { feito: 1, humor: 4 }, pessimo: { clima: -6 } }) },
      { id: 'ambulancia', texto: 'Parar e chamar a ambulância', dica: 'O protocolo.', risco: 0.2, fatores: v => [disciplina(v)], desfechos: D('A ambulância chegou rápido. Tudo certo.', 'Esperaram vinte minutos; deu certo.', 'A ambulância demorou quarenta.', 'Demorou demais.', { pessimo: { estresse: 10 } }) }
    ] },
  { id: 'tra126_jornada', trajetoria: 'emprego', tema: 'tra_jornada', recarga: 5, cabe: naTrilha('transporte', 'estrada'),
    titulo: 'A jornada que não fecha',
    texto: v => naTrilha('estrada')(v) ? 'A carga tem que estar no destino amanhã cedo; pelas suas contas, só dirigindo a noite inteira.' : 'A escala da semana dobrou: dois motoristas de licença, e a empresa quer que você cubra os dois turnos.',
    intencoes: [
      { id: 'recusar', texto: 'Cumprir o descanso e avisar do atraso', dica: 'Cansaço mata na estrada.', risco: 0.35, fatores: v => [coragem(v), disciplina(v)], desfechos: D('O cliente entendeu; a empresa reviu o prazo.', 'Atrasou, sem problema maior.', 'A empresa reclamou e cortou uma viagem sua.', 'Perdeu o cliente para outro motorista.', { ruim: { clima: -6 }, pessimo: { clima: -10, dinheiro: -800 } }) },
      { id: 'virar', texto: 'Virar a noite', dica: 'É só dessa vez.', risco: 0.6, fatores: v => [forma(v), cabeca(v)], desfechos: D('Chegou no horário, morto de cansaço.', 'Chegou, com um cochilo no acostamento.', 'Uma raspada no guard-rail às quatro da manhã.', 'Dormiu ao volante por um segundo. Foi por pouco.', { ruim: { estresse: 8 }, pessimo: { estresse: 16 } }) }
    ] },
  /* ---------------------------------------------------------------- Posto */
  { id: 'pos126_bomba', trajetoria: 'emprego', tema: 'pos_cliente', recarga: 5, peso: PESO, cabe: naTrilha('posto'),
    titulo: 'A bomba que marcou errado',
    texto: () => 'A bomba três marcou vinte litros a mais do que cabia no tanque. O cliente percebeu e está gritando no pátio.',
    intencoes: [
      { id: 'devolver', texto: 'Devolver a diferença e travar a bomba', dica: 'O gerente pode não gostar.', risco: 0.3, fatores: v => [coragem(v), social(v)], desfechos: D('O cliente acalmou; o gerente chamou a manutenção e ainda elogiou.', 'Resolveu; a bomba foi para conserto.', 'O gerente descontou a diferença do caixa do turno.', 'O cliente filmou e postou mesmo assim.', { ruim: { dinheiro: -150 }, pessimo: { estresse: 8 } }) },
      { id: 'gerente', texto: 'Chamar o gerente', dica: 'Não é você quem decide.', risco: 0.2, fatores: v => [disciplina(v)], desfechos: D('O gerente resolveu bem.', 'Resolveram.', 'O gerente demorou; o cliente xingou você.', 'Virou ocorrência no Procon.', { pessimo: { clima: -6 } }) }
    ] },
  /* ---------------------------------------------------------------- Costura */
  { id: 'cos126_encomenda', trajetoria: 'emprego', tema: 'cos_prazo', recarga: 5, peso: PESO, cabe: naTrilha('costura'),
    titulo: 'O vestido da noiva',
    texto: () => 'Na última prova, a noiva emagreceu dois números. O casamento é sábado.',
    intencoes: [
      { id: 'refazer', texto: 'Desmanchar e ajustar tudo', dica: 'Noites em claro.', risco: 0.35, fatores: v => [competencia(v), forma(v)], desfechos: D('O vestido caiu perfeito; a foto da noiva virou propaganda boca a boca.', 'Ficou bom, a tempo.', 'Ficou bom, mas a mão doeu a semana inteira.', 'Não deu tempo de acertar a cintura.', { otimo: { feito: 1 }, ruim: { estresse: 6 } }) },
      { id: 'pences', texto: 'Ajustar só com pences por dentro', dica: 'Ninguém vai ver.', risco: 0.45, fatores: v => [competencia(v)], desfechos: D('Ninguém viu.', 'Ficou bom.', 'Marcou um pouco nas fotos.', 'A noiva viu nas fotos e reclamou com todo mundo.', { pessimo: { nome: -3 } }) }
    ] },
  /* ---------------------------------------------------------------- Confeitaria */
  { id: 'con126_bolo', trajetoria: 'emprego', tema: 'con_encomenda', recarga: 5, peso: PESO, cabe: naTrilha('confeitaria', 'alimentacao'),
    titulo: 'O bolo de três andares',
    texto: () => 'Uma encomenda de bolo de três andares para uma festa de quinze anos, com uma decoração que você nunca fez.',
    intencoes: [
      { id: 'treinar', texto: 'Treinar a decoração antes, em casa', dica: 'Custa os fins de semana.', risco: 0.3, fatores: v => [disciplina(v), competencia(v)], desfechos: D('O bolo foi o assunto da festa; vieram três encomendas novas.', 'Ficou bonito.', 'A decoração ficou diferente da foto.', 'O andar de cima cedeu no transporte.', { otimo: { feito: 1 }, pessimo: { estresse: 8 } }) },
      { id: 'simplificar', texto: 'Propor uma decoração mais simples', dica: 'Vender o que sabe fazer.', risco: 0.2, fatores: v => [social(v)], desfechos: D('A família adorou a ideia.', 'Aceitaram.', 'Aceitaram, decepcionados.', 'Cancelaram a encomenda.', { pessimo: { dinheiro: -300 } }) }
    ] },
  /* ---------------------------------------------------------------- Reciclagem */
  { id: 'rec126_cooperativa', trajetoria: 'emprego', tema: 'rec_coop', recarga: 6, peso: PESO, cabe: naTrilha('reciclagem'),
    titulo: 'O preço do papelão',
    texto: () => 'O atravessador baixou o preço do papelão pela metade. A cooperativa discute vender direto para a indústria, que fica a 80 quilômetros.',
    intencoes: [
      { id: 'direto', texto: 'Defender a venda direta', dica: 'Precisa de caminhão e de paciência.', risco: 0.45, fatores: v => [social(v), coragem(v)], desfechos: D('Conseguiram um contrato com a indústria: o preço dobrou.', 'Venderam direto uma vez; deu lucro.', 'O frete comeu a diferença.', 'A cooperativa rachou na discussão.', { otimo: { feito: 1, dinheiro: 600 } }) },
      { id: 'aceitar', texto: 'Aceitar o preço por enquanto', dica: 'Pelo menos entra alguma coisa.', risco: 0.15, fatores: () => [], desfechos: D('O preço voltou a subir no mês seguinte.', 'Segurou o mês.', 'O mês foi apertado.', 'Faltou para as contas.', { ruim: { dinheiro: -200 }, pessimo: { dinheiro: -400, estresse: 6 } }) }
    ] },
  /* ---------------------------------------------------------------- Serviço público e fiscalização */
  { id: 'pub126_balcao', trajetoria: 'emprego', tema: 'pub_publico', recarga: 5, peso: PESO, cabe: naTrilha('publico'),
    titulo: 'O balcão às cinco da tarde',
    texto: () => 'Cinco minutos para fechar o atendimento, e uma senhora com um processo de aposentadoria que já voltou três vezes por falta de um papel.',
    intencoes: [
      { id: 'resolver', texto: 'Ficar além do horário e resolver de vez', dica: 'Ninguém paga a hora extra.', risco: 0.3, fatores: v => [competencia(v), empatia(v)], desfechos: D('Achou o erro no sistema que travava o processo — e o de mais doze pessoas.', 'Resolveu o dela.', 'Não deu para resolver hoje, mas deixou encaminhado.', 'O sistema caiu no meio.', { otimo: { feito: 1, humor: 4 } }, { otimo: 'Destravou no balcão um processo de aposentadoria parado havia meses.' }) },
      { id: 'agendar', texto: 'Agendar para amanhã cedo', dica: 'O regulamento.', risco: 0.15, fatores: v => [disciplina(v)], desfechos: D('Ela voltou de manhã e saiu resolvida.', 'Resolveram no dia seguinte.', 'Ela não conseguiu voltar.', 'A reclamação na ouvidoria tinha o seu nome.', { pessimo: { clima: -6 } }) }
    ] },
  { id: 'fis126_pressao', trajetoria: 'emprego', tema: 'fis_etica', recarga: 7, cabe: naTrilha('fiscal', 'seguranca_trabalho'),
    titulo: 'A fiscalização incômoda',
    texto: v => naTrilha('seguranca_trabalho')(v) ? 'O andaime da obra não passa na NR-35. O mestre de obras diz que o prazo não espera; o dono pede "um jeitinho".' : 'Uma empresa grande da cidade, com amigos na prefeitura, tem irregularidades que você encontrou. O telefone começou a tocar.',
    intencoes: [
      { id: 'autuar', texto: 'Seguir com a autuação / embargo', dica: 'É o seu trabalho.', risco: 0.45, fatores: v => [coragem(v), competencia(v)], desfechos: D('A autuação ficou de pé; ganhou respeito na área.', 'Fez o que devia.', 'Foi transferido de setor "por reorganização".', 'Abriram uma sindicância contra você, depois arquivada.', { otimo: { feito: 1 }, ruim: { clima: -8 }, pessimo: { estresse: 12 } }, { otimo: 'Manteve uma autuação contra uma empresa poderosa.' }) },
      { id: 'prazo', texto: 'Dar um prazo para corrigir', dica: 'Corrigir é o que importa.', risco: 0.3, fatores: v => [social(v)], desfechos: D('Corrigiram dentro do prazo.', 'Corrigiram, devagar.', 'Não corrigiram; ficou a sua assinatura no prazo.', 'Houve um acidente antes da correção.', { pessimo: { estresse: 16, imagem: 'polemica' } }) }
    ] },
  /* ---------------------------------------------------------------- Veterinária */
  { id: 'vet126_tutor', trajetoria: 'emprego', tema: 'vet_tutor', recarga: 5, peso: PESO, cabe: naTrilha('veterinaria'),
    titulo: 'O tutor que não pode pagar',
    texto: () => 'Um cachorro atropelado, um tutor que não tem como pagar a cirurgia, e uma clínica com regra clara sobre fiado.',
    intencoes: [
      { id: 'operar', texto: 'Operar e negociar depois', dica: 'A regra da clínica é outra.', risco: 0.45, fatores: v => [competencia(v), coragem(v)], desfechos: D('O cachorro saiu andando; o tutor pagou em seis vezes e virou cliente para sempre.', 'Salvou o cachorro; a clínica aceitou parcelar.', 'O dono da clínica descontou do seu salário.', 'Perdeu o cachorro na mesa e ouviu do dono da clínica.', { otimo: { feito: 1, humor: 5 }, ruim: { dinheiro: -400 }, pessimo: { estresse: 10 } }) },
      { id: 'estabilizar', texto: 'Estabilizar e indicar o hospital público veterinário', dica: 'O possível.', risco: 0.25, fatores: v => [competencia(v)], desfechos: D('O hospital público operou no mesmo dia.', 'Chegou bem lá.', 'A fila do hospital era longa.', 'Não resistiu à espera.', { pessimo: { estresse: 10 } }) }
    ] },
  /* ---------------------------------------------------------------- Educação física */
  { id: 'edf126_aluno', trajetoria: 'emprego', tema: 'edf_aluno', recarga: 5, peso: PESO, cabe: naTrilha('educacao_fisica'),
    titulo: 'O aluno que exagera',
    texto: () => 'Um aluno da academia quer dobrar a carga em um mês para um campeonato — e já comentou de "uma ajudinha" que um conhecido vende.',
    intencoes: [
      { id: 'conversar', texto: 'Conversar sério e montar um plano honesto', dica: 'Pode perder o aluno.', risco: 0.35, fatores: v => [social(v), competencia(v)], desfechos: D('Ele seguiu o plano e fez a melhor marca da vida, limpo.', 'Ele topou, desconfiado.', 'Ele trocou de professor.', 'Ele foi atrás da "ajudinha" e passou mal no campeonato.', { otimo: { feito: 1 } }) },
      { id: 'deixar', texto: 'Montar o treino que ele pediu', dica: 'O cliente quer.', risco: 0.5, fatores: v => [competencia(v)], desfechos: D('Ele aguentou e foi bem.', 'Ele foi razoável.', 'Uma lesão no ombro no meio do mês.', 'Uma lesão séria — e a família culpou o professor.', { pessimo: { nome: -4, estresse: 8 } }) }
    ] },
  /* ---------------------------------------------------------------- Pesquisa */
  { id: 'pes126_dados', trajetoria: 'emprego', tema: 'pes_etica', recarga: 7, peso: PESO, cabe: naTrilha('pesquisa'),
    titulo: 'O resultado que não bate',
    texto: () => 'O experimento de dois anos não reproduziu o resultado que o laboratório já anunciou num congresso.',
    intencoes: [
      { id: 'publicar', texto: 'Mostrar o resultado como ele é', dica: 'A ciência agradece; o chefe do laboratório, não.', risco: 0.4, fatores: v => [coragem(v), competencia(v)], desfechos: D('Acharam o erro do experimento original e o artigo novo virou referência.', 'O laboratório corrigiu o anúncio.', 'O chefe do laboratório ficou frio com você.', 'Perdeu a bolsa na renovação.', { otimo: { feito: 1, noto: 1 }, pessimo: { dinheiro: -1500, estresse: 10 } }, { otimo: 'Corrigiu um resultado do próprio laboratório — e ganhou respeito por isso.' }) },
      { id: 'repetir', texto: 'Repetir o experimento antes de dizer qualquer coisa', dica: 'Mais seis meses.', risco: 0.25, fatores: v => [disciplina(v)], desfechos: D('Na repetição, achou a variável que faltava: os dois resultados estavam certos.', 'Confirmou que não reproduz.', 'O financiamento acabou no meio.', 'Outro grupo publicou antes.', { otimo: { feito: 1 } }) }
    ] },
  /* ---------------------------------------------------------------- Beleza (salão) */
  { id: 'bel126_cliente', trajetoria: 'emprego', tema: 'bel_cliente', recarga: 5, peso: PESO, cabe: naTrilha('beleza'),
    titulo: 'A cor que não ficou como na foto',
    texto: () => 'A cliente trouxe a foto de um loiro platinado — o cabelo dela é preto, com química de anos. Ela quer hoje.',
    intencoes: [
      { id: 'etapas', texto: 'Explicar e propor fazer em etapas', dica: 'Pode ir embora sem nada.', risco: 0.3, fatores: v => [social(v), competencia(v)], desfechos: D('Ela voltou nas três sessões e virou cliente fiel.', 'Ela topou começar.', 'Ela foi para outro salão.', 'Ela saiu falando mal do salão para as amigas.', { otimo: { feito: 1 } }) },
      { id: 'tentar', texto: 'Tentar chegar perto hoje', dica: 'Química forte em cabelo cansado.', risco: 0.6, fatores: v => [competencia(v)], desfechos: D('Chegou perto — e o cabelo aguentou.', 'Ficou bonito, não platinado.', 'O cabelo ficou elástico.', 'Cortes químicos: ela chorou no espelho.', { pessimo: { nome: -4, estresse: 10 } }) }
    ] },

  /* ---------------------------------------------------------------- O jeito do chefe (qualquer emprego com equipe) */
  { id: 'che126_exigente', trajetoria: 'emprego', tema: 'che_jeito', recarga: 6, peso: () => 1.3, cabe: comChefe(['exigente', 'autoritario']),
    titulo: v => `${nomeChefe(v)} quer mais`,
    texto: v => `${nomeChefe(v)} — ${NOME_PERFIL_CHEFE[perfilDoChefe(chefe(v)!)]} — devolveu o seu trabalho pela terceira vez, na frente da equipe, com uma lista de correções.`,
    intencoes: [
      { id: 'refazer', texto: 'Refazer tudo, melhor', dica: 'Quem é exigente respeita quem entrega.', risco: 0.3, fatores: v => [disciplina(v), competencia(v)], desfechos: D(v => `${nomeChefe(v)} não elogia — mas passou a mandar os trabalhos importantes para você.`, 'Aprovou, enfim.', 'Aprovou com mais uma ressalva; a semana acabou com você.', 'Deu errado de novo, e a fama ficou.', { otimo: { feito: 1, clima: 6 }, ruim: { estresse: 6 } }) },
      { id: 'conversar', texto: 'Pedir uma conversa a sós sobre o jeito de cobrar', dica: 'Pode virar respeito — ou marcação.', risco: 0.55, fatores: v => [coragem(v), social(v)], desfechos: D('A conversa mudou o tom; as correções passaram a vir por escrito, a sós.', 'Ouviu; mudou um pouco.', 'Ouviu e não mudou nada.', 'Virou marcação: tudo seu passou a ter problema.', { otimo: { clima: 8 }, pessimo: { clima: -12 } }) }
    ] },
  { id: 'che126_injusto', trajetoria: 'emprego', tema: 'che_jeito', recarga: 7, peso: () => 1.2, cabe: comChefe(['injusto']),
    titulo: 'O crédito que foi para outro',
    texto: v => `Na reunião com a diretoria, ${nomeChefe(v)} apresentou o seu trabalho como se fosse de um colega preferido.`,
    intencoes: [
      { id: 'provas', texto: 'Mandar um e-mail com o histórico do trabalho, com cópia', dica: 'Fica registrado. Ele também registra.', risco: 0.55, fatores: v => [coragem(v), competencia(v)], desfechos: D('A diretoria viu quem fez — e passou a te chamar direto.', 'O crédito foi corrigido.', 'O clima com a chefia azedou de vez.', 'Ganhou fama de encrenqueiro.', { otimo: { feito: 1, nome: 3 }, ruim: { clima: -10 }, pessimo: { clima: -14 } }) },
      { id: 'engolir', texto: 'Deixar passar e procurar outra área', dica: 'Escolher as brigas.', risco: 0.2, fatores: v => [cabeca(v)], desfechos: D('Uma vaga em outra área apareceu meses depois.', 'Seguiu, mais atento.', 'Aconteceu de novo.', 'Aconteceu de novo, e você adoeceu de raiva.', { ruim: { estresse: 6 }, pessimo: { estresse: 12 } }) }
    ] },
  { id: 'che126_mentor', trajetoria: 'emprego', tema: 'che_jeito', recarga: 7, peso: () => 1.2, cabe: comChefe(['incentivador', 'compreensivo']),
    titulo: v => `${nomeChefe(v)} aposta em você`,
    texto: v => `${nomeChefe(v)} ofereceu indicar você para um curso pago pela empresa — com a condição de ficar dois anos depois dele.`,
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar o curso', dica: 'Dois anos presos, uma porta aberta.', risco: 0.25, fatores: v => [disciplina(v)], desfechos: D(v => `Terminou o curso entre os primeiros; ${nomeChefe(v)} contou para todo mundo.`, 'Terminou o curso.', 'O curso ocupou as noites e cansou.', 'Não conseguiu terminar — e a cláusula ficou.', { otimo: { feito: 1, clima: 6 }, ruim: { estresse: 6 } }) },
      { id: 'recusar', texto: 'Agradecer e recusar', dica: 'Sem amarras.', risco: 0.15, fatores: () => [], desfechos: D('A chefia entendeu e deixou a porta aberta.', 'Ficou para outra vez.', 'A oferta foi para um colega.', 'Nunca mais ofereceram nada.', {}) }
    ] },
  { id: 'che126_bagunca', trajetoria: 'emprego', tema: 'che_jeito', recarga: 6, cabe: comChefe(['desorganizado']),
    titulo: 'A chefia que esqueceu',
    texto: v => `${nomeChefe(v)} esqueceu de pedir o material para a entrega de amanhã — e a culpa vai cair na equipe.`,
    intencoes: [
      { id: 'salvar', texto: 'Dar um jeito por fora e salvar a entrega', dica: 'Ninguém vai saber.', risco: 0.4, fatores: v => [competencia(v), coragem(v)], desfechos: D(v => `Salvou a entrega; ${nomeChefe(v)} sabe que te deve uma.`, 'A entrega saiu.', 'Saiu pela metade.', 'Não deu, e a culpa veio para você.', { otimo: { clima: 8, feito: 1 }, pessimo: { clima: -8 } }) },
      { id: 'registrar', texto: 'Avisar por escrito o que falta', dica: 'Cada um com a sua parte.', risco: 0.3, fatores: v => [disciplina(v)], desfechos: D('Ficou claro de quem era a falha; a chefia se organizou.', 'Adiaram a entrega.', 'A chefia não gostou do e-mail.', 'A chefia te isolou nas reuniões.', { ruim: { clima: -6 }, pessimo: { clima: -10 } }) }
    ] },
  /* ---------------------------------------------------------------- A vaga disputada (um colega de verdade) */
  { id: 'col126_vaga', trajetoria: 'emprego', tema: 'col_vaga', recarga: 6, peso: () => 1.1,
    cabe: v => !!v.trabalho.atual?.equipe?.colegas?.some(id => v.pessoas[id]?.vivo) && anosDeCasa(v) >= 2 && idade(v) >= 22,
    contexto: v => { const id = v.trabalho.atual!.equipe!.colegas!.find(x => v.pessoas[x]?.vivo)!; return { colega: v.pessoas[id].nome }; },
    titulo: 'A vaga acima',
    texto: (_, d) => `Abriu uma vaga de coordenação, e só sobraram dois nomes: o seu e o de ${d.colega}. A decisão sai no mês que vem.`,
    intencoes: [
      { id: 'mostrar', texto: 'Mostrar o seu trabalho, sem atropelar ninguém', dica: 'Quem decide vê os dois.', risco: 0.45, fatores: v => [competencia(v), social(v)], desfechos: D(v => `A vaga foi sua — e ${v.pessoas[v.trabalho.atual!.equipe!.colegas![0]]?.nome ?? 'o colega'} foi o primeiro a dar os parabéns.`, (_, d) => `A vaga foi de ${d.colega}, por pouco. Ficou combinado que a próxima é sua.`, (_, d) => `A vaga foi de ${d.colega}; você ficou sob a coordenação dele.`, (_, d) => `A vaga foi de ${d.colega}, e o clima entre vocês azedou.`, { otimo: { feito: 2, clima: 6 }, pessimo: { clima: -6 } }, { otimo: 'Ganhou a disputa por uma vaga de coordenação.' }) },
      { id: 'apoiar', texto: (_, d) => `Apoiar ${d.colega} para a vaga`, dica: 'Generosidade também é estratégia.', risco: 0.2, fatores: v => [social(v)], desfechos: D((_, d) => `${d.colega} ficou com a vaga e levou você para o lado dele: a próxima é sua, de verdade.`, (_, d) => `${d.colega} agradeceu e não esqueceu.`, 'A chefia achou que você não tinha ambição.', (_, d) => `${d.colega} subiu e esqueceu quem ajudou.`, { otimo: { clima: 6 } }) }
    ] },

  /* ---------------------------------------------------------------- Tênis: o profissional jovem */
  { id: 'ten126_viagem', trajetoria: 'tenis', tema: 'ten_estrada', recarga: 4, peso: () => 1.3, cabe: v => v.caminhos.esporte?.modalidade === 'tenis' && v.caminhos.esporte.fase === 'profissional' && (v.caminhos.esporte.nivel ?? 1) <= 2,
    titulo: 'A gira pelos torneios pequenos',
    texto: () => 'Seis semanas de torneios pequenos em outro continente: pontos baratos de ganhar, hotel barato, sem técnico, sem ninguém.',
    intencoes: [
      { id: 'ir', texto: 'Ir sozinho, com a mala e as raquetes', dica: 'É assim que quase todo mundo começa.', risco: 0.5, fatores: v => [tecnica(v), cabeca(v)], desfechos: D('Dois títulos pequenos e uma final: o ranking deu um salto.', 'Pontos suficientes para subir.', 'Voltou com poucos pontos e muita saudade.', 'Uma lesão na terceira semana e a conta do hotel no cartão.', { otimo: { noto: 1 }, pessimo: { dinheiro: -3000, estresse: 10 } }) },
      { id: 'perto', texto: 'Jogar os torneios do próprio país', dica: 'Menos pontos, mais perto de casa.', risco: 0.25, fatores: v => [tecnica(v)], desfechos: D('Ganhou o nacional e subiu no ranking.', 'Jogou bem.', 'Os pontos não vieram.', 'Caiu na primeira rodada em todos.', {}) }
    ] },
  { id: 'ten126_tecnico', trajetoria: 'tenis', tema: 'ten_equipe', recarga: 6, cabe: v => v.caminhos.esporte?.modalidade === 'tenis' && v.caminhos.esporte.fase === 'profissional',
    titulo: 'Trocar de técnico',
    texto: () => 'O técnico que te formou não viaja mais. Um técnico estrangeiro, caro, ofereceu acompanhar a temporada.',
    intencoes: [
      { id: 'trocar', texto: 'Contratar o técnico novo', dica: 'Caro. Pode mudar o seu jogo.', risco: 0.5, fatores: v => [tecnica(v), coragem(v)], desfechos: D('O saque novo mudou a temporada.', 'Ajustou o jogo aos poucos.', 'Não se entenderam; meio ano perdido.', 'Brigaram em público num torneio.', { otimo: { noto: 1 }, ruim: { dinheiro: -4000 }, pessimo: { dinheiro: -6000, estresse: 10 } }) },
      { id: 'ficar', texto: 'Seguir com o técnico de sempre, à distância', dica: 'A confiança conta.', risco: 0.2, fatores: v => [disciplina(v)], desfechos: D('As conversas por vídeo funcionaram.', 'Seguiu o plano.', 'Faltou alguém no torneio.', 'O jogo estagnou.', {}) }
    ] },
  { id: 'ten126_quali', trajetoria: 'tenis', tema: 'ten_circuito', recarga: 3, peso: () => 1.2, cabe: v => v.caminhos.esporte?.modalidade === 'tenis' && v.caminhos.esporte.fase === 'profissional',
    titulo: 'O quali',
    texto: () => 'Três jogos de qualificação em três dias para entrar na chave de um torneio grande.',
    intencoes: [
      { id: 'tudo', texto: 'Jogar cada ponto como se fosse o último', dica: 'Chega cansado na chave — se chegar.', risco: 0.55, fatores: v => [forma(v), tecnica(v)], desfechos: D('Passou o quali e ganhou um jogo na chave principal.', 'Passou o quali.', 'Caiu no último jogo do quali.', 'Caiu no primeiro, com cãibra.', { otimo: { noto: 1 } }) },
      { id: 'dosar', texto: 'Dosar a energia', dica: 'Tênis é longo.', risco: 0.3, fatores: v => [cabeca(v), tecnica(v)], desfechos: D('Entrou na chave inteiro e foi longe.', 'Passou o quali.', 'Faltou pressão no jogo decisivo.', 'Perdeu para alguém muito pior.', {}) }
    ] }
];

const POR_CONTA = BASE_126.filter(m => /^(cos126|con126|bel126|tra126_passageiro|cui126_familia)/.test(m.id)).map(m => ({ ...m, id: `${m.id}_aut`, trajetoria: 'autonomo' as const }));
export const MODELOS_126: ModeloSituacao[] = [...BASE_126, ...POR_CONTA];
