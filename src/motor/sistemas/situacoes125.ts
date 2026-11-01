/**
 * VIDA 12.5 · CAR-11.9 — AS CARREIRAS QUE FICAVAM SECAS. A auditoria (25 anos × 8 vidas × 18 carreiras) achou o tênis
 * com 3 cenas e 70% dos anos de veterano em silêncio; o vôlei e o atletismo com meia cena disponível no 10º ano; o
 * basquete com 3; a medicina repetindo o mesmo desafio; a academia, o negócio, o policial, o administrativo e o
 * eletricista com metade dos anos vazios. Aqui, cenas próprias de cada uma — com o que a profissão tem de específico
 * (o wildcard, o tie-break do vôlei, a queima de largada, a glosa do convênio, a greve, a fiscalização, a corregedoria,
 * o fechamento do mês, a NR-10) — no mesmo molde das outras (`situacoes.ModeloSituacao`).
 *
 * Os ajudantes são locais (como em `situacoesArte`): este módulo não importa `situacoes` em tempo de execução.
 */
import type { Desfecho, DesfechoModelo, Efeitos, Fator, ModeloSituacao } from './situacoes';
import type { Vida } from '../tipos';
import { clamp } from '../rng';
import { idade } from '../nucleo';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { habilidade } from './frentes';

const F = (id: string, valor: number): Fator => ({ id, valor: Math.round(valor * 100) / 100 });
const D = (otimo: string, bom: string, ruim: string, pessimo: string, ef: Partial<Record<Desfecho, Efeitos>> = {}, mem: Partial<Record<Desfecho, string>> = {}): Record<Desfecho, DesfechoModelo> => ({
  otimo: { texto: otimo, efeitos: { nome: 2, humor: 3, ...ef.otimo }, memoria: mem.otimo },
  bom: { texto: bom, efeitos: { nome: 1, ...ef.bom }, memoria: mem.bom },
  ruim: { texto: ruim, efeitos: { estresse: 3, ...ef.ruim }, memoria: mem.ruim },
  pessimo: { texto: pessimo, efeitos: { nome: -2, estresse: 6, ...ef.pessimo }, memoria: mem.pessimo }
});

const leitura = (v: Vida) => F('leitura', (v.mente.cognicao - 50) / 90);
const cabeca = (v: Vida) => F('cabeça', -(v.mente.estresse - 45) / 110);
const coragem = (v: Vida) => F('coragem', v.personalidade.tracos.coragem / 300);
const social = (v: Vida) => F('jeito com gente', v.personalidade.tracos.sociabilidade / 250);
const disciplina = (v: Vida) => F('disciplina', v.personalidade.tracos.disciplina / 300);
const competencia = (v: Vida) => { const e = v.trabalho.atual; const anos = e ? Math.min(20, (v.t - e.tInicio) / 12) : 0; return F('competência', ((e?.desempenho ?? 50) - 55) / 90 + anos / 60); };
const forma = (v: Vida) => F('forma', (v.corpo.forma - 65) / 70);
const tecnica = (v: Vida) => { const es = v.caminhos.esporte; return F('técnica', es ? (habilidade(v, es.modalidade) - 60) / 40 : 0); };
const caixa = (v: Vida, quanto: number) => F('caixa', v.financas.conta >= quanto ? 0.1 : -0.3);

const trilha = (v: Vida) => (v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.trilha : undefined);
const naTrilha = (...ts: string[]) => (v: Vida) => { const t = trilha(v); return !!t && ts.includes(t); };
const modalidade = (m: string) => (v: Vida) => v.caminhos.esporte?.modalidade === m && v.caminhos.esporte?.fase === 'profissional';
const nivelEsp = (v: Vida) => v.caminhos.esporte?.nivel ?? 1;
const anosDeCasa = (v: Vida) => (v.trabalho.atual ? (v.t - v.trabalho.atual.tInicio) / 12 : 0);
const musico = (v: Vida) => trilha(v) === 'musica' || trilha(v) === 'orquestra';
const POLICIA = ['pm', 'pm_oficial', 'policia_civil', 'federal', 'pericia', 'guarda', 'penal'];
const ESCRITORIO = ['administrativo', 'financas', 'contabil', 'logistica', 'atendimento'];
const OBRA = ['eletrica', 'construcao', 'hidraulica', 'predial', 'manutencao', 'reparos'];
const PESO = () => 1.6;

const BASE_125: ModeloSituacao[] = [
  /* ---------------------------------------------------------------- Tênis */
  { id: 'ten125_wildcard', trajetoria: 'tenis', tema: 'ten_circuito', recarga: 6, peso: () => 1.2, cabe: modalidade('tenis'),
    titulo: 'O convite para o torneio grande',
    texto: () => 'A organização de um torneio acima do seu ranking ofereceu um convite (wildcard) para a chave principal. Se aceitar, perde a semana em que defenderia pontos num torneio menor.',
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar o convite', dica: 'Uma vitória ali vale uma temporada. Uma surra também ensina.', risco: 0.6, fatores: v => [tecnica(v), coragem(v), cabeca(v)],
        desfechos: D('Passou duas rodadas e derrubou um cabeça de chave. O seu nome apareceu no placar central.', 'Ganhou um jogo e perdeu com dignidade para um top 50.', 'Perdeu na estreia, sem chance.', 'Levou um pneu no primeiro set e perdeu os pontos do torneio menor.', { otimo: { noto: 1, extra: v => { const es = v.caminhos.esporte; if (es) es.reputacao = clamp((es.reputacao ?? 30) + 5); } } }, { otimo: 'Entrou de convidado num torneio grande e derrubou um cabeça de chave.' }) },
      { id: 'recusar', texto: 'Defender os pontos no torneio menor', dica: 'O ranking agradece; a história, talvez não.', risco: 0.15, fatores: v => [disciplina(v), tecnica(v)],
        desfechos: D('Ganhou o torneio menor e subiu no ranking.', 'Defendeu os pontos.', 'Caiu cedo no torneio menor e ficou sem nenhum dos dois.', 'Perdeu na estreia e ainda ficou pensando no convite.') }
    ] },
  { id: 'ten125_patrocinio', trajetoria: 'tenis', tema: 'ten_dinheiro', recarga: 4, cabe: v => modalidade('tenis')(v) && nivelEsp(v) >= 2,
    titulo: 'A marca de raquetes',
    texto: () => 'Uma marca de material oferece raquetes, cordas e roupas para a temporada — e um bônus por resultado. A raquete deles é mais pesada que a sua.',
    intencoes: [
      { id: 'assinar', texto: 'Assinar e se adaptar à raquete', dica: 'Dinheiro certo; o braço precisa de semanas.', risco: 0.45, fatores: v => [tecnica(v), disciplina(v)], desfechos: D('Em um mês, a raquete nova virou sua. O backhand ganhou peso.', 'A adaptação foi rápida e o material veio sem custo.', 'Perdeu a mão no saque por meio ano.', 'O cotovelo reclamou do peso novo.', { otimo: { dinheiro: 30000 }, bom: { dinheiro: 20000 }, ruim: { dinheiro: 15000 }, pessimo: { dinheiro: 10000, estresse: 6 } }) },
      { id: 'negociar', texto: 'Pedir para manter o modelo antigo pintado', dica: 'Muitos fazem isso. Nem todos conseguem.', risco: 0.3, fatores: v => [social(v), leitura(v)], desfechos: D('Aceitaram: o seu modelo de sempre, com a marca deles.', 'Aceitaram por um valor menor.', 'Não aceitaram; a proposta foi para outro jogador.', 'A negociação esfriou e a marca sumiu.', { otimo: { dinheiro: 22000 }, bom: { dinheiro: 12000 } }) },
      { id: 'recusar', texto: 'Recusar', dica: 'A raquete de sempre, do seu bolso.', risco: 0.05, fatores: () => [], desfechos: D('Seguiu com o que conhece — e jogou bem.', 'Nada mudou.', 'O material pesou no orçamento.', 'O material pesou no orçamento num ano ruim.', { otimo: { nome: 0 }, bom: { nome: 0 }, ruim: { dinheiro: -4000 }, pessimo: { dinheiro: -6000 } }) }
    ] },
  { id: 'ten125_equipe_nacional', trajetoria: 'tenis', tema: 'ten_pais', recarga: 5, peso: v => (nivelEsp(v) >= 3 ? 1.4 : 0.3), cabe: v => modalidade('tenis')(v) && nivelEsp(v) >= 2,
    titulo: 'A convocação para a equipe do país',
    texto: () => 'O capitão da equipe nacional chamou você para a disputa por países (a Copa Davis, ou a Billie Jean King Cup). A semana coincide com um torneio onde você tinha pontos a ganhar.',
    intencoes: [
      { id: 'ir', texto: 'Jogar pelo país', dica: 'Sem prêmio em dinheiro. Com a bandeira.', risco: 0.5, fatores: v => [tecnica(v), cabeca(v), coragem(v)], desfechos: D('Ganhou o ponto decisivo, com o ginásio cantando o hino.', 'Ganhou o seu jogo; a equipe perdeu no total.', 'Perdeu o seu jogo.', 'Perdeu o ponto decisivo — e a imprensa lembrou por semanas.', { otimo: { noto: 1 } }, { otimo: 'Ganhou o ponto decisivo jogando pela equipe do país.' }) },
      { id: 'recusar', texto: 'Ficar no circuito', dica: 'O ranking agradece. O capitão, não.', risco: 0.2, fatores: v => [tecnica(v)], desfechos: D('O torneio rendeu o melhor resultado do ano.', 'Pontos no ranking.', 'Caiu cedo no torneio — e não foi pelo país.', 'Caiu cedo, e o capitão não chamou mais.', { pessimo: { imagem: 'polemica' } }) }
    ] },
  { id: 'ten125_rival', trajetoria: 'tenis', tema: 'ten_rival', recarga: 6, cabe: v => modalidade('tenis')(v) && idade(v) >= 21,
    titulo: 'O rival da juventude',
    texto: () => 'Na chave, o nome de quem ganhava de você em todos os torneios juvenis. Hoje, os dois estão no mesmo patamar. Ele disse a um jornalista que "conhece todos os seus pontos fracos".',
    intencoes: [
      { id: 'plano', texto: 'Montar um plano de jogo só para ele', dica: 'Estudar os vídeos, mudar o padrão.', risco: 0.35, fatores: v => [leitura(v), disciplina(v), tecnica(v)], desfechos: D('Venceu em dois sets, jogando o oposto do que ele esperava.', 'Ganhou no terceiro set.', 'Perdeu num jogo duro.', 'Perdeu como nos tempos juvenis.', {}, { otimo: 'Venceu, enfim, o rival da juventude — jogando como ele não esperava.' }) },
      { id: 'ignorar', texto: 'Jogar o seu jogo e não ler nada', dica: 'A cabeça fria também é tática.', risco: 0.3, fatores: v => [cabeca(v), tecnica(v)], desfechos: D('Venceu sem olhar para o outro lado da rede.', 'Ganhou apertado.', 'Perdeu, mas sem se desmontar.', 'A provocação entrou: perdeu a cabeça no segundo set.') }
    ] },
  { id: 'ten125_calendario', trajetoria: 'tenis', tema: 'ten_corpo', recarga: 4, cabe: v => modalidade('tenis')(v) && idade(v) >= 26,
    titulo: 'O calendário',
    texto: () => 'O corpo pede descanso, e a gira de torneios do outro continente começa em duas semanas: três meses de avião, hotel e pontos para defender.',
    intencoes: [
      { id: 'pular', texto: 'Pular a gira e treinar em casa', dica: 'Perde ranking; ganha corpo.', risco: 0.2, fatores: v => [disciplina(v), forma(v)], desfechos: D('Voltou inteiro e ganhou o primeiro torneio depois da pausa.', 'Voltou descansado.', 'O ranking caiu mais do que esperava.', 'O ranking despencou e os convites sumiram.', { otimo: { extra: v => { v.corpo.forma = clamp(v.corpo.forma + 4); } }, bom: { estresse: -4 } }) },
      { id: 'ir', texto: 'Ir para a gira assim mesmo', dica: 'Os pontos estão lá. O cansaço também.', risco: 0.5, fatores: v => [forma(v), cabeca(v)], desfechos: D('A gira foi a melhor da carreira.', 'Defendeu os pontos.', 'O cansaço cobrou: três derrotas na estreia.', 'Uma lesão no meio da gira encerrou a temporada.', { pessimo: { estresse: 8 } }) }
    ] },
  { id: 'ten125_tecnico', trajetoria: 'tenis', tema: 'ten_equipe', recarga: 7, cabe: v => modalidade('tenis')(v) && idade(v) >= 22,
    titulo: 'O treinador de sempre',
    texto: () => 'O treinador que está com você desde os quinze anos anda repetindo os mesmos treinos. Um técnico estrangeiro, de nome, procurou o seu empresário.',
    intencoes: [
      { id: 'trocar', texto: 'Trocar pelo técnico de nome', dica: 'Um olhar de fora. Uma despedida difícil.', risco: 0.5, fatores: v => [leitura(v), coragem(v)], desfechos: D('O técnico novo mudou a sua devolução. O ranking subiu na mesma temporada.', 'Ajustes pequenos, resultados melhores.', 'O método novo não encaixou.', 'Perdeu o técnico antigo e o novo foi embora no meio do ano.', { otimo: { extra: v => { const es = v.caminhos.esporte; const f = es ? v.caminhos.frentes[es.modalidade] : undefined; if (f) f.habilidade = clamp(f.habilidade + 1.5); } } }) },
      { id: 'ficar', texto: 'Ficar com quem conhece você', dica: 'Lealdade. Ou acomodação.', risco: 0.2, fatores: v => [social(v), disciplina(v)], desfechos: D('Conversaram e mudaram o treino juntos. Funcionou.', 'Seguiram, mais atentos.', 'O jogo estacionou.', 'A temporada repetiu a anterior — para pior.') }
    ] },

  /* ---------------------------------------------------------------- Vôlei */
  { id: 'vol125_tiebreak', trajetoria: 'atleta', tema: 'vol_jogo', recarga: 4, peso: () => 1.4, cabe: modalidade('volei'),
    titulo: 'O tie-break',
    texto: () => 'Quinto set, 13 a 13, decisão do campeonato. O levantador olha para você antes do saque adversário.',
    intencoes: [
      { id: 'pedir', texto: 'Pedir a bola', dica: 'Quem pede, carrega.', risco: 0.55, fatores: v => [tecnica(v), coragem(v), cabeca(v)], desfechos: D('Ataque na diagonal, bola no chão. No ponto seguinte, o bloqueio fechou o jogo.', 'Ponto seu; o time fechou depois.', 'O bloqueio adversário parou o seu ataque.', 'Duas bolas suas no bloqueio. O título ficou do outro lado.', { otimo: { noto: 1 } }, { otimo: 'Pediu a bola no tie-break da final e decidiu.' }) },
      { id: 'servir', texto: 'Segurar o passe e deixar o jogo fluir', dica: 'O ponto nasce no passe.', risco: 0.25, fatores: v => [tecnica(v), disciplina(v)], desfechos: D('Passe na mão do levantador duas vezes seguidas. O time fechou.', 'O passe segurou.', 'O passe saiu longe da rede.', 'Um ace no seu passe, no 14 a 14.') }
    ] },
  { id: 'vol125_posicao', trajetoria: 'atleta', tema: 'vol_rumo', recarga: 7, cabe: v => modalidade('volei')(v) && idade(v) >= 22,
    titulo: 'A troca de posição',
    texto: () => 'O técnico acha que o time precisa de você em outra função — do ataque de ponta para a saída de rede, ou o contrário. É reaprender um jogo que você já sabia.',
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar e treinar dobrado', dica: 'Quem é útil em duas, joga mais.', risco: 0.4, fatores: v => [disciplina(v), tecnica(v)], desfechos: D('Virou peça que o técnico não tira mais.', 'Adaptou-se em meio ano.', 'Ficou no meio do caminho entre as duas.', 'Perdeu a vaga nas duas funções.') },
      { id: 'recusar', texto: 'Pedir para seguir na sua', dica: 'A especialidade é o seu nome.', risco: 0.3, fatores: v => [social(v), tecnica(v)], desfechos: D('O técnico aceitou e você respondeu em quadra.', 'Seguiu na sua.', 'Perdeu minutos para quem aceitou.', 'Foi para o banco.', { pessimo: { clima: -6 } }) }
    ] },
  { id: 'vol125_exterior', trajetoria: 'atleta', tema: 'vol_mercado', recarga: 5, cabe: v => modalidade('volei')(v) && nivelEsp(v) >= 3,
    titulo: 'A proposta de fora',
    texto: () => 'Um clube da Itália oferece contrato de uma temporada, com salário em euro. Aqui, a liga nacional; lá, outra língua e um inverno longo.',
    intencoes: [
      { id: 'ir', texto: 'Ir para o exterior', dica: 'Dinheiro e vitrine. Saudade também.', risco: 0.45, fatores: v => [tecnica(v), coragem(v)], desfechos: D('Virou titular lá e voltou à seleção pela porta da frente.', 'Uma temporada boa, de experiência.', 'Pouco tempo de quadra e muita saudade.', 'O clube atrasou salários e você voltou no meio do ano.', { otimo: { dinheiro: 60000 }, bom: { dinheiro: 35000 }, ruim: { dinheiro: 15000 } }) },
      { id: 'ficar', texto: 'Ficar na liga daqui', dica: 'Perto de casa, perto da torcida.', risco: 0.15, fatores: v => [tecnica(v)], desfechos: D('Temporada de destaque em casa.', 'Seguiu firme.', 'Ficou pensando no que perdeu.', 'O clube daqui cortou salários no meio do ano.') }
    ] },
  { id: 'vol125_capitania', trajetoria: 'atleta', tema: 'vol_grupo', recarga: 6, cabe: v => modalidade('volei')(v) && idade(v) >= 26,
    titulo: 'A braçadeira',
    texto: () => 'O capitão se aposentou, e o técnico quer você com a braçadeira. Capitão fala com o árbitro, segura o vestiário e responde à imprensa depois da derrota.',
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar a capitania', dica: 'Mais voz, mais cobrança.', risco: 0.35, fatores: v => [social(v), cabeca(v)], desfechos: D('O vestiário fechou com você. O time foi longe.', 'Fez o papel bem.', 'O peso da braçadeira pesou no seu jogo.', 'Um racha no grupo caiu no seu colo.', {}, { otimo: 'Foi capitão de um time que fechou com você.' }) },
      { id: 'recusar', texto: 'Indicar um colega', dica: 'Liderar também é saber escolher.', risco: 0.1, fatores: v => [leitura(v)], desfechos: D('O colega cresceu com a braçadeira, e lembrou de você.', 'O grupo seguiu em paz.', 'O colega não segurou o grupo.', 'O vestiário rachou.') }
    ] },

  /* ---------------------------------------------------------------- Atletismo */
  { id: 'atl125_largada', trajetoria: 'atleta', tema: 'atl_prova', recarga: 4, peso: () => 1.4, cabe: modalidade('atletismo'),
    titulo: 'A final',
    texto: () => 'Na final do campeonato nacional, o vento está no limite para validar recorde e o atleta da raia ao lado já queimou uma largada.',
    intencoes: [
      { id: 'arriscar', texto: 'Antecipar a largada', dica: 'Um centésimo ganho — ou a desclassificação.', risco: 0.65, fatores: v => [tecnica(v), coragem(v), forma(v)], desfechos: D('Saiu no tiro perfeito e cravou o melhor tempo da vida.', 'Boa saída, pódio.', 'Saiu atrasado de tanto se segurar.', 'Queimou a largada: desclassificado na final.', { otimo: { noto: 1 } }, { otimo: 'Cravou o melhor tempo da vida numa final nacional.', pessimo: 'Queimou a largada numa final nacional.' }) },
      { id: 'segurar', texto: 'Esperar o tiro e correr limpo', dica: 'Correr o que treinou.', risco: 0.2, fatores: v => [disciplina(v), forma(v)], desfechos: D('Correu limpo e ganhou no fim.', 'Pódio com tempo bom.', 'Ficou fora do pódio por pouco.', 'A perna travou na metade da prova.') }
    ] },
  { id: 'atl125_prova', trajetoria: 'atleta', tema: 'atl_rumo', recarga: 7, cabe: v => modalidade('atletismo')(v) && idade(v) >= 23,
    titulo: 'A troca de prova',
    texto: () => 'O treinador acha que o seu corpo rende mais numa prova vizinha — dos 400 para os 800, do salto em distância para o triplo. Seria recomeçar o ranking.',
    intencoes: [
      { id: 'trocar', texto: 'Trocar de prova', dica: 'Um teto mais alto. Um caminho mais longo.', risco: 0.5, fatores: v => [disciplina(v), forma(v), leitura(v)], desfechos: D('Na prova nova, encontrou índice olímpico em dois anos.', 'Adaptou-se e melhorou as marcas.', 'Um ano de marcas piores.', 'Não encaixou em nenhuma das duas.', {}, { otimo: 'Trocou de prova e encontrou o índice que nunca tinha chegado perto.' }) },
      { id: 'ficar', texto: 'Insistir na sua prova', dica: 'Quem conhece, refina.', risco: 0.2, fatores: v => [tecnica(v)], desfechos: D('Baixou a marca pessoal.', 'Seguiu evoluindo devagar.', 'A marca estacionou.', 'A marca piorou e o treinador se afastou.') }
    ] },
  { id: 'atl125_revezamento', trajetoria: 'atleta', tema: 'atl_grupo', recarga: 5, cabe: v => modalidade('atletismo')(v) && nivelEsp(v) >= 2,
    titulo: 'O revezamento',
    texto: () => 'Convocado para o revezamento da seleção. A passagem de bastão com quem corre antes de você ainda não está acertada.',
    intencoes: [
      { id: 'treinar', texto: 'Treinar a passagem até cansar', dica: 'O revezamento se ganha na troca.', risco: 0.3, fatores: v => [disciplina(v), social(v)], desfechos: D('A passagem perfeita. Medalha.', 'Passagem limpa, final.', 'A troca saiu lenta.', 'O bastão caiu no chão.', { otimo: { noto: 1 } }, { otimo: 'Ganhou medalha no revezamento da seleção.', pessimo: 'Deixou o bastão cair no revezamento da seleção.' }) },
      { id: 'confiar', texto: 'Confiar no instinto na hora', dica: 'Corredor corre.', risco: 0.55, fatores: v => [tecnica(v), cabeca(v)], desfechos: D('Na hora, deu certo — e o tempo foi recorde do país.', 'Passou bem.', 'Quase saiu da zona de troca.', 'Desclassificados por passagem fora da zona.') }
    ] },
  { id: 'atl125_patrocinio', trajetoria: 'atleta', tema: 'atl_dinheiro', recarga: 4, cabe: v => (modalidade('atletismo')(v) || modalidade('natacao')(v)) && nivelEsp(v) >= 2,
    titulo: 'O patrocinador de material',
    texto: () => 'Uma marca de material esportivo oferece bolsa mensal e equipamento, com uma cláusula: presença em eventos e fotos para as redes.',
    intencoes: [
      { id: 'assinar', texto: 'Assinar', dica: 'Dinheiro para treinar. Tempo para a marca.', risco: 0.3, fatores: v => [social(v), disciplina(v)], desfechos: D('A bolsa pagou o treinador e a fisioterapia do ano.', 'Material e um dinheiro certo.', 'Os eventos tomaram dias de treino.', 'A marca cortou o contrato depois de um ano fraco.', { otimo: { dinheiro: 24000 }, bom: { dinheiro: 14000 }, ruim: { dinheiro: 8000 } }) },
      { id: 'recusar', texto: 'Recusar e focar no treino', dica: 'Tudo para a pista; nada para a conta.', risco: 0.1, fatores: () => [], desfechos: D('O treino rendeu a melhor marca do ano.', 'Seguiu treinando.', 'O dinheiro fez falta.', 'Faltou dinheiro para a fisioterapia.', { otimo: { nome: 1 }, ruim: { dinheiro: -3000 }, pessimo: { dinheiro: -5000 } }) }
    ] },

  /* ---------------------------------------------------------------- Basquete */
  { id: 'bas125_lance_livre', trajetoria: 'basquete', tema: 'bas_jogo', recarga: 4, peso: () => 1.4, cabe: modalidade('basquete'),
    titulo: 'Dois lances livres',
    texto: () => 'Um ponto atrás, dois segundos no relógio, dois lances livres. O ginásio adversário inteiro está de pé, gritando.',
    intencoes: [
      { id: 'rotina', texto: 'A rotina de sempre: três quiques e respira', dica: 'O corpo sabe; a cabeça atrapalha.', risco: 0.4, fatores: v => [tecnica(v), cabeca(v), disciplina(v)], desfechos: D('Os dois caíram. Vitória.', 'Converteu os dois; o jogo foi para a prorrogação e vocês venceram.', 'Errou o primeiro, acertou o segundo: prorrogação perdida.', 'Errou os dois.', { otimo: { noto: 1 } }, { otimo: 'Converteu os dois lances livres da vitória com o ginásio contra.', pessimo: 'Errou os dois lances livres no último segundo.' }) },
      { id: 'errar', texto: 'Errar o segundo de propósito, buscando o rebote', dica: 'Só se o primeiro cair.', risco: 0.65, fatores: v => [leitura(v), tecnica(v)], desfechos: D('O rebote veio na mão do pivô, que virou o jogo.', 'Deu certo: prorrogação.', 'O rebote foi deles.', 'Errou o primeiro também.') }
    ] },
  { id: 'bas125_europa', trajetoria: 'basquete', tema: 'bas_mercado', recarga: 5, cabe: v => modalidade('basquete')(v) && nivelEsp(v) >= 3,
    titulo: 'A Europa',
    texto: () => 'Um time espanhol procurou o seu agente: contrato de dois anos, liga mais forte, banco no começo.',
    intencoes: [
      { id: 'ir', texto: 'Ir para a Europa', dica: 'Vitrine e banco.', risco: 0.5, fatores: v => [tecnica(v), coragem(v)], desfechos: D('Ganhou minutos no meio da temporada e virou rotação.', 'Aprendeu muito, jogou pouco.', 'Banco quase o ano todo.', 'Cortado antes do fim do contrato.', { otimo: { dinheiro: 80000 }, bom: { dinheiro: 50000 }, ruim: { dinheiro: 40000 } }) },
      { id: 'ficar', texto: 'Ser a estrela aqui', dica: 'Bola na mão, nome na liga.', risco: 0.15, fatores: v => [tecnica(v)], desfechos: D('Cestinha da liga.', 'Temporada sólida como titular.', 'O time não acompanhou.', 'Uma temporada de derrotas.') }
    ] },
  { id: 'bas125_mentor', trajetoria: 'basquete', tema: 'bas_grupo', recarga: 6, cabe: v => modalidade('basquete')(v) && idade(v) >= 29,
    titulo: 'O garoto da base',
    texto: () => 'O técnico subiu um garoto da base para a sua posição e pediu que você o ajudasse. Ele joga como você jogava aos dezoito — e quer os seus minutos.',
    intencoes: [
      { id: 'ensinar', texto: 'Ensinar o que sabe', dica: 'Quem ensina dura mais no vestiário.', risco: 0.2, fatores: v => [social(v), leitura(v)], desfechos: D('O garoto virou titular e agradeceu em público.', 'Dividiram os minutos em paz.', 'Ele pegou os seus minutos rápido demais.', 'Você virou reserva do aluno.', {}, { otimo: 'Ensinou o garoto que herdou a sua posição — e ele agradeceu em público.' }) },
      { id: 'competir', texto: 'Competir pela vaga', dica: 'Veterano não entrega.', risco: 0.45, fatores: v => [forma(v), tecnica(v)], desfechos: D('Manteve a vaga com a melhor temporada em anos.', 'Seguiu titular.', 'Perdeu a vaga.', 'Perdeu a vaga e o clima com o grupo.') }
    ] },
  { id: 'bas125_provocacao', trajetoria: 'basquete', tema: 'bas_rival', recarga: 5, cabe: modalidade('basquete'),
    titulo: 'A provocação',
    texto: () => 'O armador do time rival passou o jogo falando no seu ouvido. No terceiro quarto, deu um empurrão depois do apito.',
    intencoes: [
      { id: 'responder', texto: 'Responder na quadra, com cesta', dica: 'O placar fala mais alto.', risco: 0.35, fatores: v => [cabeca(v), tecnica(v)], desfechos: D('Doze pontos seguidos no último quarto. Ele calou.', 'Venceram, e você jogou bem.', 'Ele tirou você do jogo.', 'Uma falta técnica sua mudou o jogo.') },
      { id: 'encarar', texto: 'Encarar de frente', dica: 'Às vezes é preciso. Às vezes, é expulsão.', risco: 0.6, fatores: v => [coragem(v), cabeca(v)], desfechos: D('O time inteiro cresceu junto com você.', 'Ele recuou.', 'Os dois levaram técnica.', 'Expulso — e suspenso por dois jogos.', { pessimo: { imagem: 'polemica' } }) }
    ] },

  /* ---------------------------------------------------------------- Medicina */
  { id: 'med125_processo', trajetoria: 'medicina', tema: 'med_erro', recarga: 8, peso: () => 0.7, cabe: () => true,
    titulo: 'O processo',
    texto: () => 'A família de um paciente que teve uma complicação abriu um processo e uma denúncia no conselho. O prontuário está completo — quase.',
    intencoes: [
      { id: 'defender', texto: 'Contratar advogado e defender a conduta', dica: 'A conduta estava certa. Provar leva tempo.', risco: 0.35, fatores: v => [competencia(v), disciplina(v)], desfechos: D('O conselho arquivou: conduta adequada.', 'Arquivado depois de um ano de espera.', 'Um acordo para encerrar o processo civil.', 'Uma advertência no conselho, para a vida inteira.', { otimo: { dinheiro: -8000 }, bom: { dinheiro: -12000, estresse: 4 }, ruim: { dinheiro: -30000 }, pessimo: { dinheiro: -20000, imagem: 'polemica' } }, { pessimo: 'Levou uma advertência do conselho por um caso que nunca esqueceu.' }) },
      { id: 'conversar', texto: 'Procurar a família e conversar', dica: 'Muita denúncia é dor sem resposta.', risco: 0.4, fatores: v => [social(v), cabeca(v)], desfechos: D('A família retirou a denúncia depois de entender o que aconteceu.', 'A conversa acalmou; o processo seguiu, mais brando.', 'A conversa não mudou nada.', 'O advogado da família usou a conversa contra você.') }
    ] },
  { id: 'med125_catastrofe', trajetoria: 'medicina', tema: 'med_plantao', recarga: 7, peso: () => 0.8, cabe: () => true,
    titulo: 'O plantão da tragédia',
    texto: () => 'Um ônibus tombou na estrada. Doze feridos chegando ao mesmo tempo, duas salas de cirurgia e você de plantão.',
    intencoes: [
      { id: 'triagem', texto: 'Assumir a triagem', dica: 'Decidir quem vem primeiro é o mais difícil.', risco: 0.45, fatores: v => [competencia(v), cabeca(v), coragem(v)], desfechos: D('Nenhuma morte evitável naquela noite. O hospital lembra até hoje.', 'Uma noite dura, bem conduzida.', 'Um paciente piorou na espera.', 'Uma decisão da triagem vai voltar em sonho por anos.', { otimo: { feito: 1 } }, { otimo: 'Coordenou a triagem na noite da tragédia da estrada.', pessimo: 'Teve que escolher quem esperava numa noite de tragédia.' }) },
      { id: 'operar', texto: 'Ir direto para a sala de cirurgia', dica: 'Fazer o que só você faz.', risco: 0.3, fatores: v => [competencia(v), disciplina(v)], desfechos: D('Três cirurgias seguidas, três pacientes salvos.', 'Operou até o sol nascer.', 'O cansaço cobrou na terceira.', 'Uma complicação na terceira cirurgia.') }
    ] },
  { id: 'med125_glosa', trajetoria: 'medicina', tema: 'med_dinheiro', recarga: 5, cabe: () => true,
    titulo: 'A glosa',
    texto: () => 'O convênio glosou (recusou pagar) três meses de procedimentos seus, alegando "falta de justificativa". A clínica quer que você reveja as indicações dali para a frente.',
    intencoes: [
      { id: 'recorrer', texto: 'Recorrer de cada glosa', dica: 'Horas de papel. Dinheiro de volta — talvez.', risco: 0.3, fatores: v => [disciplina(v), leitura(v)], desfechos: D('Recuperou quase tudo e o convênio mudou o critério.', 'Recuperou metade.', 'Ganhou pouco e perdeu muitas noites.', 'O convênio descredenciou você.', { otimo: { dinheiro: 9000 }, bom: { dinheiro: 4000 } }) },
      { id: 'ceder', texto: 'Indicar menos procedimentos', dica: 'Fecha a conta. Abre uma dúvida.', risco: 0.35, fatores: v => [competencia(v)], desfechos: D('Os pacientes não perderam nada; o papel diminuiu.', 'A clínica ficou satisfeita.', 'Um paciente precisou do exame que você deixou de pedir.', 'Um diagnóstico atrasou por um exame que não pediu.', { pessimo: { estresse: 8 } }) }
    ] },
  { id: 'med125_consultorio', trajetoria: 'medicina', tema: 'med_rumo', recarga: 8, cabe: v => idade(v) >= 32,
    titulo: 'O consultório',
    texto: () => 'Uma colega vai se aposentar e oferece passar o consultório: os pacientes, a secretária, o aluguel. O preço é um ano de economias.',
    intencoes: [
      { id: 'comprar', texto: 'Ficar com o consultório', dica: 'Agenda própria, conta própria.', risco: 0.45, fatores: v => [competencia(v), caixa(v, 60000), social(v)], desfechos: D('Os pacientes ficaram, e em dois anos a agenda lotou.', 'A clientela ficou quase toda.', 'Metade dos pacientes foi embora com a aposentadoria dela.', 'O aluguel comeu o lucro por dois anos.', { otimo: { dinheiro: -60000, extra: v => { const e = v.trabalho.atual; if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + 10); } }, bom: { dinheiro: -60000 }, ruim: { dinheiro: -60000 }, pessimo: { dinheiro: -70000 } }, { otimo: 'Assumiu o consultório de uma colega que se aposentava — e a agenda lotou.' }) },
      { id: 'recusar', texto: 'Recusar', dica: 'O hospital paga em dia.', risco: 0.05, fatores: () => [], desfechos: D('Seguiu no hospital, tranquilo.', 'Nada mudou.', 'Ficou pensando no consultório por anos.', 'Ficou pensando no consultório por anos.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] },
  { id: 'med125_chefia', trajetoria: 'medicina', tema: 'med_chefia', recarga: 8, peso: v => (idade(v) >= 40 ? 1.2 : 0.4), cabe: v => idade(v) >= 36,
    titulo: 'A chefia do serviço',
    texto: () => 'A diretoria convidou você para chefiar o serviço. Escalas, conflitos, metas — e menos tempo com pacientes.',
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar a chefia', dica: 'Mudar o serviço por dentro.', risco: 0.4, fatores: v => [social(v), competencia(v), cabeca(v)], desfechos: D('Em dois anos, o serviço virou referência.', 'Fez uma gestão correta.', 'As escalas engoliram o seu tempo.', 'Um conflito com a diretoria acabou em renúncia.', { otimo: { feito: 1, dinheiro: 15000 }, bom: { dinheiro: 8000 } }, { otimo: 'Chefiou o serviço que virou referência.' }) },
      { id: 'recusar', texto: 'Recusar: o lugar é com o paciente', dica: 'Medicina é na beira do leito.', risco: 0.1, fatores: () => [], desfechos: D('Seguiu na clínica, onde rende.', 'Nada mudou.', 'O novo chefe complicou a sua escala.', 'O novo chefe complicou a sua escala.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] },
  { id: 'med125_colega', trajetoria: 'medicina', tema: 'med_equipe', recarga: 6, cabe: () => true,
    titulo: 'O colega no limite',
    texto: () => 'Um colega de plantão anda esquecendo prescrições e chorando no conforto médico. Ninguém comenta; todo mundo percebe.',
    intencoes: [
      { id: 'conversar', texto: 'Conversar com ele', dica: 'É delicado. É necessário.', risco: 0.3, fatores: v => [social(v), cabeca(v)], desfechos: D('Ele aceitou ajuda e voltou meses depois, inteiro.', 'Ele tirou uma licença.', 'Ele se fechou e negou tudo.', 'Ele se ofendeu, e o plantão virou um campo minado.') },
      { id: 'chefia', texto: 'Avisar a chefia', dica: 'O paciente vem primeiro.', risco: 0.35, fatores: v => [coragem(v), leitura(v)], desfechos: D('A chefia afastou com cuidado e ofereceu tratamento.', 'Ele foi afastado.', 'A chefia ignorou.', 'Ele descobriu quem avisou.') }
    ] },

  /* ---------------------------------------------------------------- Academia */
  { id: 'aca125_produtividade', trajetoria: 'academia', tema: 'aca_dinheiro', recarga: 5, cabe: () => true,
    titulo: 'A bolsa de produtividade',
    texto: () => 'Abriu o edital da bolsa de produtividade em pesquisa. O seu currículo está no limite — falta um artigo forte.',
    intencoes: [
      { id: 'concorrer', texto: 'Concorrer assim mesmo', dica: 'O parecer é implacável.', risco: 0.45, fatores: v => [competencia(v), leitura(v)], desfechos: D('Bolsa aprovada. O currículo ganhou um selo.', 'Aprovada no nível de entrada.', 'Não foi desta vez.', 'Reprovada, com um parecer que doeu.', { otimo: { dinheiro: 18000 }, bom: { dinheiro: 9000 } }, { otimo: 'Ganhou a bolsa de produtividade em pesquisa.' }) },
      { id: 'esperar', texto: 'Esperar o próximo edital com o artigo pronto', dica: 'Um ano a mais, currículo mais forte.', risco: 0.15, fatores: v => [disciplina(v)], desfechos: D('O artigo saiu numa revista de peso.', 'O artigo saiu.', 'O artigo atrasou.', 'Outro grupo publicou primeiro.') }
    ] },
  { id: 'aca125_coordenacao', trajetoria: 'academia', tema: 'aca_gestao', recarga: 7, cabe: v => idade(v) >= 35,
    titulo: 'A coordenação do curso',
    texto: () => 'Ninguém quer a coordenação do curso. Os colegas olham para você na reunião do departamento.',
    intencoes: [
      { id: 'aceitar', texto: 'Aceitar', dica: 'Reformar o currículo. Perder as férias.', risco: 0.35, fatores: v => [social(v), disciplina(v)], desfechos: D('O curso subiu na avaliação nacional.', 'Uma gestão sem crise.', 'A pesquisa parou por dois anos.', 'Uma briga de departamento caiu na sua mesa.', { otimo: { feito: 1 } }, { otimo: 'Coordenou o curso que subiu na avaliação nacional.' }) },
      { id: 'recusar', texto: 'Recusar com jeito', dica: 'A pesquisa agradece.', risco: 0.2, fatores: v => [social(v)], desfechos: D('Recusou sem estragar nada.', 'Outro aceitou.', 'Ficou com fama de quem não ajuda.', 'Ficou de fora das decisões do departamento.') }
    ] },
  { id: 'aca125_greve', trajetoria: 'academia', tema: 'aca_greve', recarga: 6, cabe: () => true,
    titulo: 'A greve',
    texto: () => 'Os professores entraram em greve por salário e verba de pesquisa. Os seus orientandos têm prazos de bolsa correndo.',
    intencoes: [
      { id: 'aderir', texto: 'Aderir à greve', dica: 'A causa é sua também.', risco: 0.3, fatores: v => [social(v), coragem(v)], desfechos: D('A greve terminou com conquista, e a sua voz foi ouvida.', 'Acordo parcial.', 'O semestre se arrastou meses.', 'Corte de ponto e um semestre perdido.', { pessimo: { dinheiro: -6000 } }) },
      { id: 'orientar', texto: 'Parar as aulas, mas seguir com os orientandos', dica: 'O meio-termo de muita gente.', risco: 0.2, fatores: v => [disciplina(v)], desfechos: D('Os orientandos defenderam no prazo.', 'O laboratório seguiu.', 'Os colegas acharam pouco.', 'O comando de greve criticou você em assembleia.') }
    ] },
  { id: 'aca125_exterior', trajetoria: 'academia', tema: 'aca_mundo', recarga: 8, cabe: v => idade(v) >= 30,
    titulo: 'O convite de fora',
    texto: () => 'Um grupo de pesquisa de uma universidade estrangeira convidou você para um ano de colaboração. A bolsa é curta; a vitrine, enorme.',
    intencoes: [
      { id: 'ir', texto: 'Ir por um ano', dica: 'Artigos, rede, saudade.', risco: 0.35, fatores: v => [competencia(v), coragem(v)], desfechos: D('Voltou com três artigos e uma colaboração que dura até hoje.', 'Um ano produtivo.', 'O projeto rendeu menos do que prometia.', 'O ano lá custou o laboratório daqui.', { otimo: { feito: 1 } }, { otimo: 'Passou um ano num grupo de pesquisa de fora e voltou com uma colaboração para a vida.' }) },
      { id: 'ficar', texto: 'Ficar e colaborar à distância', dica: 'Menos vitrine, menos risco.', risco: 0.15, fatores: v => [disciplina(v)], desfechos: D('A colaboração à distância rendeu um artigo forte.', 'Rendeu um artigo.', 'A colaboração esfriou.', 'O grupo convidou outra pessoa.') }
    ] },
  { id: 'aca125_plagio', trajetoria: 'academia', tema: 'aca_etica', recarga: 9, peso: () => 0.6, cabe: () => true,
    titulo: 'O parágrafo conhecido',
    texto: () => 'Lendo o artigo de um colega de departamento, você reconhece parágrafos inteiros da tese de um aluno seu, sem citação.',
    intencoes: [
      { id: 'denunciar', texto: 'Levar à comissão de ética', dica: 'O certo tem preço.', risco: 0.45, fatores: v => [coragem(v), leitura(v)], desfechos: D('A comissão reconheceu o plágio, e o aluno ganhou o crédito.', 'O artigo foi corrigido.', 'O processo se arrastou e o clima azedou.', 'O colega virou inimigo declarado no departamento.', {}, { otimo: 'Defendeu o crédito de um aluno num caso de plágio.' }) },
      { id: 'conversar', texto: 'Falar direto com o colega', dica: 'Resolver sem barulho.', risco: 0.3, fatores: v => [social(v)], desfechos: D('Ele pediu desculpas e corrigiu o artigo.', 'Corrigiu a citação.', 'Ele negou tudo.', 'Ele negou e espalhou que você tinha inveja.') }
    ] },

  /* ---------------------------------------------------------------- Música */
  { id: 'mus125_festival', trajetoria: 'cena', tema: 'mus_palco', recarga: 4, peso: () => 1.2, cabe: musico,
    titulo: 'O festival',
    texto: () => 'Um festival grande chamou para tocar às quatro da tarde, no palco menor, com sol na cara e o público ainda chegando.',
    intencoes: [
      { id: 'tocar', texto: 'Tocar e fazer do horário um trunfo', dica: 'Quem ganha a tarde, ganha o ano.', risco: 0.45, fatores: v => [social(v), coragem(v), F('ofício', (habilidade(v, 'musica') - 55) / 50)], desfechos: D('A tenda lotou no meio do show. O vídeo correu as redes.', 'Show bom, público crescendo.', 'Tocou para pouca gente.', 'O som falhou na segunda música.', { otimo: { noto: 1 } }, { otimo: 'Lotou a tenda de um festival às quatro da tarde.' }) },
      { id: 'recusar', texto: 'Recusar o horário ruim', dica: 'Quem se valoriza, espera.', risco: 0.2, fatores: v => [leitura(v)], desfechos: D('No ano seguinte, voltaram com o horário nobre.', 'Nada mudou.', 'Não chamaram de novo.', 'Outra banda pegou o espaço — e o público.') }
    ] },
  { id: 'mus125_credito', trajetoria: 'cena', tema: 'mus_direitos', recarga: 7, cabe: musico,
    titulo: 'A música sem crédito',
    texto: () => 'Uma propaganda de televisão usa uma canção sua — arranjo diferente, mesma melodia, nenhum crédito.',
    intencoes: [
      { id: 'processar', texto: 'Acionar a associação de direitos e um advogado', dica: 'O direito é seu. O tempo, também.', risco: 0.4, fatores: v => [disciplina(v), coragem(v)], desfechos: D('Acordo com os direitos pagos e o crédito na tela.', 'Um acordo modesto.', 'O processo vai levar anos.', 'Perdeu: a perícia não viu cópia.', { otimo: { dinheiro: 25000 }, bom: { dinheiro: 8000 }, pessimo: { dinheiro: -4000 } }) },
      { id: 'expor', texto: 'Contar nas redes', dica: 'O barulho às vezes paga.', risco: 0.5, fatores: v => [social(v)], desfechos: D('A história viralizou e a agência pediu desculpas em público.', 'Muita gente conheceu a sua versão.', 'Pouca repercussão.', 'Viraram a história contra você.', { otimo: { noto: 1 }, pessimo: { imagem: 'polemica' } }) }
    ] },
  { id: 'mus125_calote', trajetoria: 'cena', tema: 'mus_dinheiro', recarga: 4, cabe: musico,
    titulo: 'O calote',
    texto: () => 'O contratante de uma casa de shows sumiu depois da apresentação, devendo o cachê da noite inteira — e a equipe quer receber.',
    intencoes: [
      { id: 'pagar', texto: 'Pagar a equipe do seu bolso', dica: 'O nome fica limpo; a conta, não.', risco: 0.15, fatores: v => [caixa(v, 4000)], desfechos: D('A equipe nunca esqueceu.', 'Pagou e seguiu.', 'Apertou o mês.', 'Apertou o trimestre.', { otimo: { dinheiro: -3000 }, bom: { dinheiro: -3000 }, ruim: { dinheiro: -3000 }, pessimo: { dinheiro: -4500 } }) },
      { id: 'cobrar', texto: 'Cobrar na justiça e avisar os colegas', dica: 'Demora, mas protege os próximos.', risco: 0.4, fatores: v => [disciplina(v), social(v)], desfechos: D('Recebeu com juros, e a casa ficou marcada.', 'Recebeu parte.', 'Nada ainda.', 'Gastou com advogado mais do que o cachê.', { otimo: { dinheiro: 1500 }, pessimo: { dinheiro: -1500 } }) }
    ] },
  { id: 'mus125_viral', trajetoria: 'cena', tema: 'mus_publico', recarga: 6, peso: () => 0.7, cabe: musico,
    titulo: 'A música antiga',
    texto: () => 'Uma música sua de anos atrás virou trilha de vídeos curtos. Os números do streaming subiram como nunca.',
    intencoes: [
      { id: 'aproveitar', texto: 'Lançar uma versão nova e uma turnê curta', dica: 'O vento sopra pouco tempo.', risco: 0.45, fatores: v => [social(v), disciplina(v)], desfechos: D('A turnê esgotou e o público novo ficou.', 'Shows cheios por um semestre.', 'O interesse passou antes da turnê.', 'A turnê deu prejuízo.', { otimo: { dinheiro: 30000, noto: 1 }, bom: { dinheiro: 12000 }, pessimo: { dinheiro: -8000 } }, { otimo: 'Uma música antiga renasceu nas redes, e a turnê esgotou.' }) },
      { id: 'seguir', texto: 'Seguir com o disco novo', dica: 'O passado ajuda o presente — se você deixar.', risco: 0.25, fatores: v => [leitura(v)], desfechos: D('O público que chegou pela antiga ficou para a nova.', 'Alguns ficaram.', 'O público queria só a antiga.', 'O disco novo passou despercebido.') }
    ] },
  { id: 'mus125_parceria', trajetoria: 'cena', tema: 'mus_parceria', recarga: 6, cabe: v => musico(v) && idade(v) >= 24,
    titulo: 'O convite de um nome grande',
    texto: () => 'Um artista conhecido no país inteiro quer gravar uma música com você — do jeito dele, no estúdio dele.',
    intencoes: [
      { id: 'gravar', texto: 'Gravar do jeito dele', dica: 'Vitrine enorme, voz menor.', risco: 0.35, fatores: v => [social(v)], desfechos: D('A parceria tocou no país inteiro.', 'Boa repercussão.', 'A música saiu com pouco de você.', 'A parceria virou briga pelos créditos.', { otimo: { noto: 1, dinheiro: 15000 } }, { otimo: 'Gravou uma parceria com um nome grande que tocou no país inteiro.' }) },
      { id: 'propor', texto: 'Propor fazer a sua versão', dica: 'Arriscar a parceria pela identidade.', risco: 0.5, fatores: v => [coragem(v), F('ofício', (habilidade(v, 'musica') - 55) / 50)], desfechos: D('Ele topou — e a música ficou melhor do que os dois esperavam.', 'Chegaram a um meio-termo.', 'Ele desistiu da parceria.', 'Ele desistiu e falou mal de você nos bastidores.') }
    ] },
  { id: 'mus125_turne', trajetoria: 'cena', tema: 'mus_estrada', recarga: 4, cabe: musico,
    titulo: 'A estrada',
    texto: () => 'Turnê de doze cidades numa van. Na quinta, a van quebra a 200 km do próximo show.',
    intencoes: [
      { id: 'improvisar', texto: 'Alugar o que der e chegar de qualquer jeito', dica: 'O show não pode parar.', risco: 0.4, fatores: v => [social(v), coragem(v)], desfechos: D('Chegaram em cima da hora e fizeram o melhor show da turnê.', 'Chegaram atrasados, mas tocaram.', 'Tocaram um show curto.', 'Perderam o show e o cachê.', { otimo: { dinheiro: -1500 }, bom: { dinheiro: -1500 }, ruim: { dinheiro: -1500 }, pessimo: { dinheiro: -3000 } }, { otimo: 'Fez o melhor show de uma turnê depois de a van quebrar na estrada.' }) },
      { id: 'cancelar', texto: 'Cancelar a data e consertar a van', dica: 'Prudência custa um show.', risco: 0.1, fatores: () => [], desfechos: D('Remarcaram com casa cheia.', 'Remarcaram.', 'O contratante não remarcou.', 'O contratante cobrou multa.', { otimo: { nome: 0 }, pessimo: { dinheiro: -2500 } }) }
    ] },

  /* ---------------------------------------------------------------- Negócio */
  { id: 'neg125_fiscalizacao', trajetoria: 'negocio', tema: 'neg_estado', recarga: 5, cabe: () => true,
    titulo: 'A fiscalização',
    texto: () => 'A fiscalização apareceu sem aviso: alvará, extintores, nota fiscal, carteira dos funcionários. Uma coisa está fora do lugar.',
    intencoes: [
      { id: 'regularizar', texto: 'Mostrar tudo e regularizar o que faltar', dica: 'Custa agora; protege depois.', risco: 0.2, fatores: v => [disciplina(v)], desfechos: D('Saiu com um elogio do fiscal.', 'Prazo para ajustar, sem multa.', 'Uma multa pequena.', 'Uma multa grande.', { otimo: { dinheiro: -500 }, bom: { dinheiro: -1500 }, ruim: { dinheiro: -4000 }, pessimo: { dinheiro: -12000 } }) },
      { id: 'jeitinho', texto: 'Tentar resolver "por fora"', dica: 'Pode sair barato. Pode sair muito caro.', risco: 0.7, fatores: v => [social(v), coragem(v)], desfechos: D('O fiscal fingiu que não viu.', 'Resolveu, desconfortável.', 'O fiscal recusou e aplicou a multa cheia.', 'O fiscal registrou a tentativa: processo e interdição.', { otimo: { dinheiro: -1000 }, bom: { dinheiro: -2000 }, ruim: { dinheiro: -8000 }, pessimo: { dinheiro: -20000, imagem: 'polemica' } }) }
    ] },
  { id: 'neg125_concorrente', trajetoria: 'negocio', tema: 'neg_mercado', recarga: 5, cabe: () => true,
    titulo: 'O vizinho novo',
    texto: () => 'Uma rede grande abriu do mesmo ramo, na mesma rua, com preço de inauguração.',
    intencoes: [
      { id: 'preco', texto: 'Baixar o preço', dica: 'Guerra de preço: quem tem mais caixa ganha.', risco: 0.55, fatores: v => [caixa(v, 20000)], desfechos: D('Segurou a clientela; a rede subiu o preço depois.', 'Segurou a maioria.', 'A margem sumiu.', 'O caixa secou antes da rede.', { ruim: { dinheiro: -5000 }, pessimo: { dinheiro: -15000 } }) },
      { id: 'diferenciar', texto: 'Apostar no que a rede não tem', dica: 'Atendimento, especialidade, nome.', risco: 0.35, fatores: v => [social(v), leitura(v)], desfechos: D('A clientela fiel virou propaganda.', 'Perdeu pouco movimento.', 'Perdeu movimento por um ano.', 'O movimento caiu pela metade.', { pessimo: { dinheiro: -8000 } }) }
    ] },
  { id: 'neg125_caixa', trajetoria: 'negocio', tema: 'neg_equipe', recarga: 7, peso: () => 0.7, cabe: () => true,
    titulo: 'O caixa que não fecha',
    texto: () => 'Há três meses o caixa fecha com uma diferença pequena, sempre no turno do mesmo funcionário — o mais antigo da casa.',
    intencoes: [
      { id: 'confrontar', texto: 'Conversar com ele, com os números na mão', dica: 'Ou há explicação, ou há confissão.', risco: 0.4, fatores: v => [social(v), coragem(v)], desfechos: D('Era um erro de sistema. Ele agradeceu a confiança.', 'Ele confessou, devolveu e saiu.', 'Ele negou e saiu ofendido.', 'Ele saiu e levou clientes junto.', { pessimo: { dinheiro: -5000 } }) },
      { id: 'camera', texto: 'Instalar câmera sem dizer nada', dica: 'A prova primeiro.', risco: 0.3, fatores: v => [disciplina(v), leitura(v)], desfechos: D('A câmera mostrou outra pessoa. O antigo estava certo.', 'A prova veio; a demissão foi limpa.', 'A equipe descobriu a câmera e se sentiu vigiada.', 'Um processo trabalhista por uso da imagem.', { otimo: { dinheiro: -800 }, bom: { dinheiro: -800 }, pessimo: { dinheiro: -9000 } }) }
    ] },
  { id: 'neg125_fornecedor', trajetoria: 'negocio', tema: 'neg_fornecedor', recarga: 5, cabe: () => true,
    titulo: 'O fornecedor que sumiu',
    texto: () => 'O fornecedor principal parou de entregar sem aviso, com o pedido pago. O estoque dura duas semanas.',
    intencoes: [
      { id: 'outro', texto: 'Fechar com outro fornecedor, mais caro', dica: 'A porta não pode fechar.', risco: 0.2, fatores: v => [leitura(v)], desfechos: D('O fornecedor novo era melhor que o antigo.', 'Seguiu aberto, com margem menor.', 'A margem apertou o ano todo.', 'O novo também falhou.', { bom: { dinheiro: -2000 }, ruim: { dinheiro: -5000 }, pessimo: { dinheiro: -9000 } }) },
      { id: 'cobrar', texto: 'Ir atrás do dinheiro pago', dica: 'O certo. O lento.', risco: 0.45, fatores: v => [disciplina(v), coragem(v)], desfechos: D('Recuperou o dinheiro e achou um fornecedor melhor.', 'Recuperou parte.', 'Nada voltou.', 'Ficou sem dinheiro e sem estoque por um mês.', { pessimo: { dinheiro: -10000 } }) }
    ] },
  { id: 'neg125_reforma', trajetoria: 'negocio', tema: 'neg_crescer', recarga: 6, cabe: v => v.financas.conta >= 15000,
    titulo: 'A reforma',
    texto: () => 'O ponto ao lado vagou. Daria para dobrar o espaço — e o aluguel.',
    intencoes: [
      { id: 'expandir', texto: 'Expandir', dica: 'Crescer é arriscar.', risco: 0.55, fatores: v => [caixa(v, 40000), leitura(v)], desfechos: D('O movimento dobrou junto com o espaço.', 'O espaço maior se pagou em dois anos.', 'O espaço novo ficou meio vazio.', 'A reforma estourou o orçamento e o movimento não veio.', { otimo: { dinheiro: -15000 }, bom: { dinheiro: -15000 }, ruim: { dinheiro: -20000 }, pessimo: { dinheiro: -35000 } }, { otimo: 'Dobrou o negócio quando o ponto ao lado vagou.' }) },
      { id: 'esperar', texto: 'Esperar', dica: 'O seguro morreu de velho.', risco: 0.1, fatores: () => [], desfechos: D('Seguiu firme no tamanho certo.', 'Nada mudou.', 'Um concorrente pegou o ponto.', 'Um concorrente pegou o ponto e a clientela nova.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] },
  { id: 'neg125_aplicativo', trajetoria: 'negocio', tema: 'neg_mercado', recarga: 5, cabe: () => true,
    titulo: 'O aplicativo',
    texto: () => 'O aplicativo de entregas por onde sai metade das vendas aumentou a taxa de novo.',
    intencoes: [
      { id: 'proprio', texto: 'Montar a entrega própria', dica: 'Motoboy, telefone, trabalho.', risco: 0.45, fatores: v => [disciplina(v), social(v)], desfechos: D('A entrega própria virou o canal principal.', 'Metade dos clientes migrou.', 'Pouca gente migrou.', 'Os pedidos caíram pela metade.', { otimo: { dinheiro: 6000 }, pessimo: { dinheiro: -6000 } }) },
      { id: 'repassar', texto: 'Repassar a taxa no preço', dica: 'Quem compra decide.', risco: 0.3, fatores: v => [leitura(v)], desfechos: D('Ninguém reclamou.', 'Alguns reclamaram; a margem voltou.', 'As vendas caíram um pouco.', 'As vendas caíram muito.', { ruim: { dinheiro: -2000 }, pessimo: { dinheiro: -6000 } }) }
    ] },

  /* ---------------------------------------------------------------- Polícia */
  { id: 'pol125_operacao', trajetoria: 'emprego', tema: 'seg_rua', recarga: 4, peso: PESO, cabe: naTrilha(...POLICIA),
    titulo: 'A operação',
    texto: () => 'Operação de madrugada num endereço que a inteligência garante ser o depósito de uma quadrilha. O mandado está na mão; a informação, nem tanto.',
    intencoes: [
      { id: 'protocolo', texto: 'Seguir o protocolo à risca', dica: 'Mais lento. Mais seguro para todos.', risco: 0.25, fatores: v => [disciplina(v), competencia(v)], desfechos: D('Apreensão grande, ninguém ferido, prisão em flagrante.', 'Apreensão limpa.', 'O depósito estava vazio.', 'A informação era falsa: a casa era de uma família.', { otimo: { feito: 1 } }, { otimo: 'Comandou uma apreensão grande sem ninguém ferido.' }) },
      { id: 'entrar', texto: 'Entrar rápido antes que fujam', dica: 'A surpresa conta. O risco também.', risco: 0.6, fatores: v => [coragem(v), competencia(v)], desfechos: D('Pegaram todos dentro.', 'Prenderam os principais.', 'Houve troca de tiros, sem feridos.', 'Um colega ferido na entrada.', { pessimo: { estresse: 10 } }) }
    ] },
  { id: 'pol125_corregedoria', trajetoria: 'emprego', tema: 'seg_etica', recarga: 7, peso: () => 0.8, cabe: naTrilha(...POLICIA),
    titulo: 'A corregedoria',
    texto: () => 'A corregedoria abriu uma apuração sobre uma ocorrência em que você estava. O relato do seu parceiro não bate com o que você viu.',
    intencoes: [
      { id: 'verdade', texto: 'Contar o que viu', dica: 'A farda não protege mentira.', risco: 0.4, fatores: v => [coragem(v)], desfechos: D('A apuração foi justa, e o seu nome saiu limpo.', 'Saiu limpo; o parceiro, não.', 'Os colegas passaram a desconfiar de você.', 'Virou "o que entregou": transferido para longe.', { pessimo: { estresse: 8, clima: -10 } }) },
      { id: 'calar', texto: 'Confirmar a versão do parceiro', dica: 'A lealdade da tropa.', risco: 0.5, fatores: v => [social(v)], desfechos: D('A apuração foi arquivada.', 'Arquivada, com um peso na consciência.', 'Uma câmera mostrou outra coisa.', 'Os dois responderam processo administrativo.', { ruim: { estresse: 6 }, pessimo: { imagem: 'polemica', estresse: 8 } }) }
    ] },
  { id: 'pol125_delegado', trajetoria: 'emprego', tema: 'seg_chefia', recarga: 6, cabe: naTrilha(...POLICIA),
    titulo: 'O comando novo',
    texto: () => 'Assumiu um comando novo, que quer números: mais abordagens, mais apreensões, metas por turno.',
    intencoes: [
      { id: 'metas', texto: 'Entregar as metas', dica: 'Quem bate meta é visto.', risco: 0.35, fatores: v => [disciplina(v), competencia(v)], desfechos: D('Bateu as metas sem atropelar ninguém. Elogio em boletim.', 'Bateu as metas.', 'As metas forçaram abordagens que não precisavam.', 'Uma abordagem por meta virou denúncia.', { otimo: { feito: 1 } }) },
      { id: 'qualidade', texto: 'Mostrar resultado de outro jeito', dica: 'Uma investigação boa vale cem abordagens.', risco: 0.4, fatores: v => [leitura(v), coragem(v)], desfechos: D('Um caso bem investigado convenceu o comando.', 'O comando aceitou.', 'O comando não gostou.', 'Escalado para o pior turno.', { pessimo: { clima: -8 } }) }
    ] },
  { id: 'pol125_caso', trajetoria: 'emprego', tema: 'seg_memoria', recarga: 8, cabe: v => naTrilha(...POLICIA)(v) && anosDeCasa(v) >= 4,
    titulo: 'O caso que não sai da cabeça',
    texto: () => 'Uma ocorrência com uma criança, anos atrás, voltou em sonho três noites seguidas.',
    intencoes: [
      { id: 'terapia', texto: 'Procurar o apoio psicológico da corporação', dica: 'Pedir ajuda também é coragem.', risco: 0.2, fatores: v => [F('abertura', v.personalidade.tracos.sociabilidade / 300)], desfechos: D('As noites voltaram a ser noites.', 'Melhorou devagar.', 'Os colegas fizeram piada.', 'O afastamento virou anotação na ficha.', { otimo: { estresse: -10 }, bom: { estresse: -6 } }) },
      { id: 'aguentar', texto: 'Aguentar calado', dica: 'Como todo mundo.', risco: 0.4, fatores: v => [cabeca(v)], desfechos: D('Passou com o tempo.', 'Foi esmaecendo.', 'O sono não voltou.', 'Explodiu em casa, por nada.', { ruim: { estresse: 6 }, pessimo: { estresse: 10 } }) }
    ] },

  /* ---------------------------------------------------------------- Escritório */
  { id: 'adm125_sistema', trajetoria: 'emprego', tema: 'adm_rotina', recarga: 5, peso: PESO, cabe: naTrilha(...ESCRITORIO),
    titulo: 'O sistema novo',
    texto: () => 'A empresa trocou o sistema de gestão. Ninguém sabe usar direito, e o treinamento foi um vídeo de quarenta minutos.',
    intencoes: [
      { id: 'dominar', texto: 'Virar quem entende do sistema', dica: 'Horas extras agora; importância depois.', risco: 0.3, fatores: v => [disciplina(v), leitura(v)], desfechos: D('Virou referência: a diretoria chama você para treinar os outros.', 'Aprendeu rápido e ajudou o setor.', 'Aprendeu, mas ninguém notou.', 'O sistema travou no fechamento e a culpa caiu em você.', { otimo: { feito: 1 } }) },
      { id: 'reclamar', texto: 'Reclamar com a chefia', dica: 'Alguém precisa falar.', risco: 0.35, fatores: v => [social(v), coragem(v)], desfechos: D('A chefia contratou um treinamento de verdade.', 'Melhorou um pouco.', 'Ficou com fama de resistente.', 'A chefia anotou a reclamação na avaliação.', { pessimo: { clima: -8 } }) }
    ] },
  { id: 'adm125_auditoria', trajetoria: 'emprego', tema: 'adm_auditoria', recarga: 6, peso: PESO, cabe: naTrilha(...ESCRITORIO),
    titulo: 'A auditoria',
    texto: () => 'A auditoria externa pediu os documentos de dois anos. Uma pasta do seu setor está incompleta — de antes de você chegar.',
    intencoes: [
      { id: 'reconstruir', texto: 'Reconstruir a pasta, documento por documento', dica: 'Trabalho de formiga.', risco: 0.25, fatores: v => [disciplina(v), competencia(v)], desfechos: D('A auditoria elogiou o setor.', 'Passou sem apontamento.', 'Um apontamento leve.', 'Um apontamento grave com o seu nome no relatório.', { otimo: { feito: 1 } }) },
      { id: 'avisar', texto: 'Avisar que a falha é anterior', dica: 'Verdade — e pode soar como desculpa.', risco: 0.35, fatores: v => [social(v), coragem(v)], desfechos: D('A diretoria agradeceu a transparência.', 'Ficou registrado como herdado.', 'O antigo responsável ficou chateado.', 'A chefia achou que você estava se eximindo.') }
    ] },
  { id: 'adm125_fechamento', trajetoria: 'emprego', tema: 'adm_rotina', recarga: 4, cabe: naTrilha(...ESCRITORIO),
    titulo: 'O fechamento do mês',
    texto: () => 'Último dia do fechamento, uma diferença de centavos que não aparece em lugar nenhum, e o relatório tem que sair hoje.',
    intencoes: [
      { id: 'achar', texto: 'Ficar até achar', dica: 'O centavo é a ponta de alguma coisa.', risco: 0.3, fatores: v => [disciplina(v)], desfechos: D('Achou um erro de lançamento que vinha de meses — e evitou uma multa.', 'Achou às onze da noite.', 'Não achou; o relatório saiu com ressalva.', 'Não achou, e a diferença virou problema no mês seguinte.', { otimo: { feito: 1 }, ruim: { estresse: 5 } }) },
      { id: 'ajustar', texto: 'Fazer um ajuste e investigar depois', dica: 'Prático. Arriscado.', risco: 0.45, fatores: v => [leitura(v)], desfechos: D('Achou a origem com calma na semana seguinte.', 'O ajuste se resolveu sozinho.', 'O ajuste chamou atenção da controladoria.', 'A controladoria tratou o ajuste como irregularidade.') }
    ] },
  { id: 'adm125_reestruturacao', trajetoria: 'emprego', tema: 'adm_reestruturacao', recarga: 6, cabe: v => naTrilha(...ESCRITORIO)(v) && anosDeCasa(v) >= 3,
    titulo: 'A reestruturação',
    texto: () => 'Uma consultoria está redesenhando os setores. Corre a lista de quem fica — e o seu chefe pediu uma "proposta de melhoria" para o seu processo até sexta.',
    intencoes: [
      { id: 'propor', texto: 'Propor cortar o que você mesmo faz de inútil', dica: 'Honestidade que pode custar o cargo.', risco: 0.5, fatores: v => [competencia(v), coragem(v)], desfechos: D('A proposta foi adotada e você foi para um cargo novo.', 'Ficou, com mais responsabilidade.', 'A proposta foi usada, e você mudou de setor.', 'A proposta cortou o seu próprio cargo.', { otimo: { feito: 1 } }, { otimo: 'Propôs cortar o próprio trabalho inútil — e ganhou um cargo novo.' }) },
      { id: 'proteger', texto: 'Mostrar por que o seu processo é essencial', dica: 'Defender o terreno.', risco: 0.3, fatores: v => [social(v), leitura(v)], desfechos: D('Convenceu a consultoria.', 'O setor ficou como estava.', 'Pareceu resistência à mudança.', 'O setor foi fundido, e você ficou sem lugar claro.') }
    ] },

  /* ---------------------------------------------------------------- Obra e elétrica */
  { id: 'obr125_calote', trajetoria: 'emprego', tema: 'obr_cliente', recarga: 4, peso: PESO, cabe: naTrilha(...OBRA),
    titulo: 'O cliente que não paga',
    texto: () => 'Serviço entregue há dois meses, e o cliente diz que "semana que vem acerta". A terceira semana que vem.',
    intencoes: [
      { id: 'cobrar', texto: 'Ir até lá cobrar', dica: 'Cara a cara costuma funcionar.', risco: 0.35, fatores: v => [social(v), coragem(v)], desfechos: D('Recebeu tudo e ainda ganhou outro serviço.', 'Recebeu parcelado.', 'Recebeu metade.', 'O cliente sumiu.', { otimo: { dinheiro: 1500 }, bom: { dinheiro: 800 }, ruim: { dinheiro: 400 } }) },
      { id: 'pequenas', texto: 'Entrar no juizado de pequenas causas', dica: 'Sem advogado, com paciência.', risco: 0.25, fatores: v => [disciplina(v)], desfechos: D('Ganhou e recebeu com correção.', 'Ganhou; recebeu depois de meses.', 'Ganhou e não recebeu.', 'O processo arquivou por falta de endereço.', { otimo: { dinheiro: 1600 }, bom: { dinheiro: 1200 } }) }
    ] },
  { id: 'obr125_norma', trajetoria: 'emprego', tema: 'obr_norma', recarga: 6, cabe: naTrilha('eletrica', 'construcao', 'predial', 'manutencao'),
    titulo: 'A norma',
    texto: () => 'Os clientes grandes passaram a exigir o certificado de segurança em eletricidade (NR-10) e o de trabalho em altura. O curso custa uma semana sem trabalhar.',
    intencoes: [
      { id: 'fazer', texto: 'Fazer os cursos', dica: 'Abre a porta das obras grandes.', risco: 0.15, fatores: v => [disciplina(v)], desfechos: D('Com o certificado, veio o contrato de manutenção de um prédio comercial.', 'Certificado na mão, clientes melhores.', 'O certificado ainda não trouxe nada.', 'Pagou o curso e perdeu dois serviços na semana.', { otimo: { dinheiro: 4000, feito: 1 }, bom: { dinheiro: -800 }, ruim: { dinheiro: -1200 }, pessimo: { dinheiro: -2000 } }) },
      { id: 'seguir', texto: 'Seguir com os clientes pequenos', dica: 'O que já funciona.', risco: 0.1, fatores: () => [], desfechos: D('Os clientes pequenos seguraram o ano.', 'Nada mudou.', 'Perdeu um cliente grande.', 'Perdeu os clientes grandes.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] },
  { id: 'obr125_ajudante', trajetoria: 'emprego', tema: 'obr_equipe', recarga: 5, cabe: v => naTrilha(...OBRA)(v) && idade(v) >= 26,
    titulo: 'O ajudante',
    texto: () => 'Um rapaz do bairro pediu para trabalhar de ajudante. Esforçado, mas nunca segurou uma ferramenta.',
    intencoes: [
      { id: 'ensinar', texto: 'Levar e ensinar', dica: 'Mais lento hoje; mais forte amanhã.', risco: 0.3, fatores: v => [social(v), disciplina(v)], desfechos: D('Em um ano, ele fazia sozinho a metade do serviço.', 'Virou um bom ajudante.', 'Deu trabalho dobrado.', 'Ele aprendeu e abriu concorrência na rua de cima.', {}, { otimo: 'Ensinou o ofício a um rapaz do bairro, que virou braço direito.' }) },
      { id: 'recusar', texto: 'Recusar', dica: 'Sozinho, sem surpresas.', risco: 0.05, fatores: () => [], desfechos: D('Seguiu no seu ritmo.', 'Nada mudou.', 'Faltou braço num serviço grande.', 'Perdeu um serviço grande por falta de gente.', { otimo: { nome: 0 }, bom: { nome: 0 } }) }
    ] },
  { id: 'obr125_choque', trajetoria: 'emprego', tema: 'obr_risco', recarga: 7, peso: () => 0.8, cabe: naTrilha('eletrica', 'manutencao', 'predial'),
    titulo: 'O quadro energizado',
    texto: () => 'O cliente jura que desligou o disjuntor geral. O quadro é velho, a etiqueta apagou, e o serviço precisa ficar pronto hoje.',
    intencoes: [
      { id: 'testar', texto: 'Testar tudo antes de pôr a mão', dica: 'Meia hora a mais. Uma vida a menos de risco.', risco: 0.1, fatores: v => [disciplina(v)], desfechos: D('Havia um circuito ligado por fora. O teste salvou o dia.', 'Tudo certo, com calma.', 'O serviço atrasou e o cliente reclamou.', 'O serviço atrasou e o cliente não chamou mais.') },
      { id: 'confiar', texto: 'Confiar no cliente e trabalhar', dica: 'Quase sempre dá certo.', risco: 0.6, fatores: v => [competencia(v)], desfechos: D('Estava mesmo desligado. Serviço pronto cedo.', 'Tudo certo.', 'Um choque leve e um susto grande.', 'Um choque que mandou você para o pronto-socorro.', { ruim: { estresse: 6 }, pessimo: { estresse: 10, extra: v => { v.corpo.saude = clamp(v.corpo.saude - 6); } } }, { pessimo: 'Levou um choque num quadro que o cliente jurava estar desligado.' }) }
    ] }
];

/** O ofício de obra e elétrica vale para o empregado e para quem trabalha por conta (o mesmo quadro, o mesmo calote). */
const DE_OBRA_POR_CONTA = BASE_125.filter(m => m.id.startsWith('obr125_')).map(m => ({ ...m, id: `${m.id}_aut`, trajetoria: 'autonomo' as const }));
export const MODELOS_125: ModeloSituacao[] = [...BASE_125, ...DE_OBRA_POR_CONTA];
