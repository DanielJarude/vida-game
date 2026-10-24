/**
 * REWORK 10.6 · UX-24 — AS NOTAS DE ATUALIZAÇÃO ("VIDA — Novidades da atualização").
 *
 * Cada versão entregue cadastra aqui o que mudou, em três partes (Novidades, Melhorias, Correções), SÓ com o que está
 * de fato no jogo e sem spoilers (nada de "agora dá para virar presidente"). A versão mais nova vem primeiro.
 *
 * Por que a versão é a do pacote carregado: as notas moram DENTRO do código que o navegador está rodando. Uma versão nova
 * baixada pelo service worker (PWA) fica esperando o jogador aceitar; enquanto isso, quem roda é a antiga — e as notas
 * dela. Só depois do recarregamento o código novo (com as notas novas) existe, e só então elas aparecem. Funciona offline
 * (está no pacote) e não toca no save (a lembrança de "já vi" é uma chave própria do navegador).
 *
 * Como cadastrar uma versão nova (faz parte da entrega — docs/notas/NOVIDADES.md):
 *   1. acrescente um item NO ALTO de `NOTAS`, com `versao` nova (a que o relatório da entrega usa) e a data;
 *   2. escreva só o que foi implementado e testado, em frases curtas, para quem joga;
 *   3. rode o teste `novidades` (a versão não pode repetir; as três partes não podem estar todas vazias).
 */

export interface NotaDeVersao {
  versao: string;
  data: string;
  titulo: string;
  novidades: string[];
  melhorias: string[];
  correcoes: string[];
}

export const NOTAS: NotaDeVersao[] = [
  {
    versao: '11.5',
    data: '2026-10-24',
    titulo: 'Carreiras, Submundo e vida em movimento',
    novidades: [
      'Um ano pode ter mais de uma decisão: as outras esperam a vez e aparecem uma depois da outra, sempre conferidas de novo — uma vida movimentada pede mais escolhas; uma vida mansa continua mansa.',
      'O Submundo tem frentes próprias (furtos e roubos, contrabando, crime organizado, crimes digitais, fraudes e corrupção), cada uma com prática, nome, ações, riscos e cenas — e gente com memória: contatos que confiam, cobram, se afastam e traem, e organizações que lembram.',
      'Cada carreira especial abre com o seu lugar: o campo (ou a quadra) do atleta, a prancheta do técnico, o set do ator, o palco do músico, o plenário do político e o dossiê do Submundo.',
      'A galeria de conquistas mostra cada título com o troféu da sua competição, os prêmios individuais, os títulos como técnico e os prêmios artísticos.',
      'Na política, alianças com gente de verdade (confiança e favores) e promessas com prazo, cobradas no fim — e lembradas na eleição.',
      'O técnico escolhe a estratégia do time (e ela muda os jogos); ex-goleiros podem virar treinadores de goleiros, da base à seleção.',
      'Basquete e vôlei têm as suas copas, no formato delas.',
      'Relações: o pedido de casamento é uma cena (onde, com que anel), um trio pode morar junto e dividir a casa, e dá para bloquear um ex.'
    ],
    melhorias: [
      'Os clubes têm fase: a boa temporada pesa na seguinte, e nenhum clube domina pelo nome.',
      'Os rivais do técnico são os clubes que estão na divisão, e o campeão do ano é o mesmo da tabela do país.',
      'Ator conhecido ficou mais raro; quem vive de música também ganha com aulas e gravações, e os anos bons e ruins continuam existindo.',
      'Uma gravidez de um caso: a parceria pode achar que é dela — e a dúvida só chega com causa.',
      'No celular, os botões, abas e links pequenos ganharam a área de toque de 44 px.'
    ],
    correcoes: [
      'Títulos, copas e prêmios ficam com o ano da temporada também na biografia.',
      'Quem tem dinheiro para acertar uma conta atrasada não aparece mais "no vermelho": o painel diz a pendência e que acertar resolve.'
    ]
  },
  {
    versao: '11',
    data: '2026-10-24',
    titulo: 'Carreiras vivas',
    novidades: [
      'No futebol, as copas nacionais e continentais e os torneios de seleções são jogados fase a fase, com o nome de cada competição conforme o país.',
      'Cada posição tem atributos próprios (o goleiro tem reflexos e saídas; o atacante, finalização e movimentação) que pesam na nota e na temporada.',
      'A comissão técnica tem clube de verdade e um ofício próprio: licenças de treinador, análise tática, elenco e diretoria.',
      'No mandato, cada cargo tem as suas ações (projeto de lei, fiscalização, orçamento, veto) com efeitos na aprovação e no desgaste.',
      'Dá para fazer amizades em qualquer estado civil, combinar uma relação aberta ou poliamor e falar com ex-parceiros (que podem não responder).',
      'O casamento tem noivado e planejamento: lugar, cerimônia, convidados, estilo, orçamento, a opinião da outra pessoa e a lua de mel.',
      'Publicar nas redes é feito em passos, e a moderação sempre diz o motivo: advertência, suspensão, banimento e recurso.'
    ],
    melhorias: [
      'O atleta, o técnico e o artista sem contrato continuam na própria carreira, em Trabalho — nunca mais com o antigo clube como se fosse o atual.',
      'Indicações de conhecidos levam em conta a sua carreira; uma vaga de outra área é dita como mudança de carreira, e a vida pergunta antes.',
      'A colocação do seu clube sai da mesma tabela do campeonato, e o que você joga conta; o goleiro fica sem sofrer gol quando o time não sofre.',
      'Ator e músico crescem aos poucos: testes mais disputados, crítica e público separados, direitos das obras lançadas e sucessos grandes raros.',
      'Os momentos da carreira aparecem agrupados por carreira e lembram o que já aconteceu (o ex-clube, o título, o atrito antigo).',
      'A agenda segue cada ofício (treino e jogo, ensaio e show, plantão), e o cuidado com bichos e filhos procura um horário livre.',
      'A felicidade conta as conquistas recentes, e mudanças de país seguidas não pesam como se fossem todas novas.'
    ],
    correcoes: [
      'Uma lembrança antiga não contradiz mais o que veio depois (o sonho que se realizou não é tratado como abandonado).',
      'Euro para euro não perde mais na conversão, e as luvas entram depois da mudança de país.',
      'O noivado não fica mais pendurado depois do casamento ou do término; quem tem dinheiro não recebe a festa parcelada.',
      'Cancelar o plano de saúde ou largar a terapia agora diz o que acontece com o tratamento; a criança pede a bicicleta a quem cuida dela.'
    ]
  },
  {
    versao: '10.6',
    data: '2026-10-22',
    titulo: 'Uma vida ao seu alcance',
    novidades: [
      'Caminhos · Estudos abre com "Minha formação" e as ações principais: entrar na faculdade, fazer cursos, bolsas e auxílios, histórico acadêmico.',
      'Entrar na faculdade tem passos próprios: escolher o curso (com o que pede, quanto custa e quanto dura), candidatar-se, ver o resultado e confirmar a matrícula.',
      'Os convites do painel "Portas abertas" abrem o próprio convite: quem chamou, o prazo, o que pede, o que muda — aceitar, deixar passar ou decidir depois.',
      'Crianças pedem aos responsáveis: para ir ao estádio ou ao cinema, e para comprar algo da loja (inteiro, ou completando o que há no cofrinho).',
      'Parar um tratamento médico agora tem risco dito antes e consequências conforme a condição; dá para retomar procurando atendimento.',
      'Esta janela de novidades — que também fica no Menu, com o histórico.'
    ],
    melhorias: [
      'Caminhos · Trabalho mostra logo no alto: procurar (ou mudar de) trabalho, candidaturas, minha carreira e outras possibilidades.',
      'Outros caminhos destaca a carreira já começada em "Em andamento"; Vida pública mostra as causas do desgaste e as respostas.',
      'O fim do ensino médio reconhece quem já tem carreira (atleta, trabalho de verdade) e oferece escolhas que cabem nela.',
      'Os treinos extras do atleta seguem a posição (o goleiro treina reflexos e saídas) e aparecem na temporada.',
      'A confiança de quem se acabou de conhecer aparece como "ainda se formando" — "abalada" só quando algo a abalou.'
    ],
    correcoes: [
      'A escola e o trabalho não ficam mais no mesmo horário: o conflito é impedido antes de aceitar e reconciliado nos saves antigos.',
      'A mesma carreira artística não aparece mais duas vezes (principal e paralela) nem rende em dobro.',
      'Convites que passaram do prazo saem das portas abertas e ficam registrados.'
    ]
  }
];

export const VERSAO_ATUAL = NOTAS[0].versao;
const CHAVE = 'VIDA_NOVIDADES_VISTAS';

/**
 * Quem já jogava antes desta funcionalidade existir: algum dado do VIDA no navegador ANTES desta sessão (lido quando o
 * módulo carrega — antes de o jogo gravar qualquer coisa). Quem chega pela primeira vez não recebe notas de uma versão
 * que nunca conheceu.
 */
const jaJogava = (() => {
  try {
    for (let k = 0; k < localStorage.length; k++) { const x = localStorage.key(k); if (x && x.startsWith('VIDA_') && x !== CHAVE) return true; }
  } catch { /* sem armazenamento */ }
  return false;
})();

/** As notas desta versão devem abrir sozinhas? (uma vez por versão; nunca para quem chega agora) */
export function deveMostrarNovidades(): boolean {
  try {
    const vista = localStorage.getItem(CHAVE);
    if (vista === VERSAO_ATUAL) return false;
    if (vista === null && !jaJogava) { localStorage.setItem(CHAVE, VERSAO_ATUAL); return false; }
    return true;
  } catch { return false; }
}

export function marcarNovidadesVistas(): void {
  try { localStorage.setItem(CHAVE, VERSAO_ATUAL); } catch { /* sem armazenamento: tudo bem, aparece de novo */ }
}
