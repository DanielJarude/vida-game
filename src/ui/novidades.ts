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
