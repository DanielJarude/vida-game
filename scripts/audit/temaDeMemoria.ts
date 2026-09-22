/**
 * F5-FIX — mapeamento TEXTO → TEMA, **exclusivo da auditoria**.
 *
 * LEIA ISTO ANTES DE COPIAR O PADRÃO: este arquivo faz exatamente o que a
 * seção 7 do escopo PROÍBE no sistema — inferir tema por texto. Ele existe
 * porque a medição de BASELINE precisa classificar memórias que foram
 * emitidas ANTES de o tema declarativo existir. Não há outra forma de saber
 * o tema de uma linha histórica senão lendo a linha.
 *
 * No motor, o tema é dado declarativo do catálogo (`MemoriaCandidata.tema`).
 * Nada em `src/` importa este arquivo, e nada deve importar.
 *
 * Depois da correção, este mapeamento continua servindo à auditoria: ele lê
 * a Linha da Vida gerada (que só tem texto) e reconstrói o tema para medir
 * repetição. A checagem de consistência entre os dois vive no teste
 * permanente, não aqui.
 */

/** Frases-âncora de cada memória do catálogo, por tema. */
const ANCORAS: { tema: string; marcas: RegExp }[] = [
  { tema: 'familia_irmaos', marcas: /irmãos/i },
  { tema: 'familia_pet', marcas: /(bicho de estimação|animal de estimação|o bicho estava junto)/i },
  { tema: 'familia_filhos', marcas: /(girando em torno de|crianças pequenas em casa|escola de |escola das crianças)/i },
  { tema: 'familia_parceiro', marcas: /quase sempre ao lado de/i },
  { tema: 'amizade', marcas: /amigos/i },
  { tema: 'escola', marcas: /(um ano comum de escola|caderno, recreio|ano escolar sem nada|escola, com a pergunta|aula e de gente perguntando|ensino médio, com o futuro)/i },
  { tema: 'estudo_superior', marcas: /(dividido entre .* e o resto da vida|dividido entre os estudos)/i },
  { tema: 'trabalho', marcas: /(ano comum de trabalho|mais um ano como|mais um ano no mesmo trabalho|procurando o que fazer)/i },
  { tema: 'financeiro', marcas: /(contas apertadas|fechando o mês com cuidado)/i },
  { tema: 'primeira_infancia', marcas: /(colo, papinha|descobrir o mundo no ritmo)/i },
  { tema: 'cidade', marcas: /(sem grandes novidades em|dias em .* foram passando sem pressa)/i }
];

/**
 * O tema de uma linha de textura, ou `null` se ela não for uma pequena
 * memória (logs de atividade voluntária também são textura).
 */
export function temaDoTexto(texto: string): string | null {
  for (const a of ANCORAS) {
    if (a.marcas.test(texto)) return a.tema;
  }
  return null;
}
