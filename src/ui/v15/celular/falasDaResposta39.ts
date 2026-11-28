/**
 * VIDA 39 · respostas visíveis no celular. Antes, uma resposta sem tradução em `RESPOSTAS21` aparecia como "Respondido.":
 * o balão do jogador dizia só isso, e a caixa de entrada também. Aqui cada código de resposta tem a sua fala (o que
 * você disse, em primeira pessoa) e um tom (carinho, humor, firmeza, cautela, disposição), que aparece como etiqueta.
 *
 * Ordem de precedência, na UI: a `fala` que o motor gravou (quando existe) → as falas fixas deste módulo → as falas
 * antigas de `opcaoRotulo` → uma fala neutra. Nada aqui muda o motor nem o save.
 */

export type TomDaResposta39 = 'carinho' | 'humor' | 'firmeza' | 'cautela' | 'disposicao';

export const ROTULO_DO_TOM39: Record<TomDaResposta39, string> = {
  carinho: 'Carinho',
  humor: 'Com humor',
  firmeza: 'Com firmeza',
  cautela: 'Com cautela',
  disposicao: 'Aberto',
};

/** Falas em primeira pessoa para os códigos de resposta que ainda não tinham uma. */
export const FALA_DA_RESPOSTA39: Record<string, string> = {
  apoio: 'Estou aqui pra você. Pode contar comigo.',
  conselho: 'Olha, eu faria assim…',
  ajudar: 'Deixa comigo, eu te ajudo com isso.',
  engracada: 'Haha, essa foi boa!',
  evasiva: 'Hm, é… a gente se fala depois.',
  provocar: 'Aceito o desafio, e não esqueço!',
  carinhosa: 'Fico feliz que você me contou. Um beijo!',
  desinteresse: 'Acho que mudei de ideia, desculpa.',
  interesse: 'Gostei de você também. Vamos ver o que dá.',
  devagar: 'Vamos com calma, sem pressa.',
  negociar: 'Consigo ajudar em parte. Dá pra combinar?',
  recusa: 'Não vai dar, desculpa.',
  cumprir: 'Bora marcar agora, de verdade.',
  desculpas: 'Desculpa, eu errei.',
  firme: 'Preciso ser sincero: não vai rolar.',
  confrontar: 'Você também errou nisso. A gente precisa conversar.',
  cache: 'Isso aqui tem um cachê, né?',
  agradecimento: 'Obrigado, de coração!',
  abrir: 'Vou te contar como estou, de verdade.',
  tranquilizar: 'Tá tudo bem, pode ficar tranquilo.',
  irritar: 'Preciso de um espaço, por favor.',
  explicar: 'Deixa eu explicar os meus motivos.',
  ouvir: 'Me conta, quero entender.',
  cortar: 'A vida é minha, e eu decido.',
  dar: 'Vou mandar o valor todo.',
  parte: 'Vou mandar uma parte, o que dá agora.',
  topar: 'Topo! Pode contar comigo.',
  negar: 'Prefiro que a gente não siga por esse caminho.',
  adiar: 'Deixa pra depois?',
  desviar: '(fingiu que não viu)',
};

/** Tom de cada código: a etiqueta que mostra como a resposta foi dada. */
export const TOM_DA_RESPOSTA39: Record<string, TomDaResposta39> = {
  carinhosa: 'carinho', agradecimento: 'carinho', apoio: 'carinho', abrir: 'carinho', tranquilizar: 'carinho',
  cordial: 'carinho', desculpas: 'carinho', ouvir: 'carinho', curto: 'carinho', cumprimentar: 'carinho',
  engracada: 'humor', provocar: 'humor', atender: 'humor',
  firme: 'firmeza', cortar: 'firmeza', confrontar: 'firmeza', irritar: 'firmeza', negar: 'firmeza',
  recusa: 'firmeza', recusar: 'firmeza', desinteresse: 'firmeza', cache: 'firmeza', explicar: 'firmeza',
  evasiva: 'cautela', adiar: 'cautela', devagar: 'cautela', ignorar: 'cautela', desviar: 'cautela',
  outro_dia: 'cautela', negociar: 'cautela', sem_comentar: 'cautela',
  aceitar: 'disposicao', topar: 'disposicao', ir: 'disposicao', marcar: 'disposicao', conversar: 'disposicao',
  ligar: 'disposicao', interesse: 'disposicao', cumprir: 'disposicao', ajudar: 'disposicao', dar: 'disposicao',
  parte: 'disposicao', conselho: 'disposicao', confirmar: 'disposicao', conhecer: 'disposicao',
};

/** O efeito de uma resposta na relação, em etiquetas curtas (só o que mudou de verdade). */
export function etiquetasDoEfeito39(efeito?: { prox: number; tensao: number; confianca: number }): { texto: string; tom: 'bom' | 'ruim' }[] {
  if (!efeito) return [];
  const out: { texto: string; tom: 'bom' | 'ruim' }[] = [];
  if (efeito.prox >= 2) out.push({ texto: 'Mais perto', tom: 'bom' });
  else if (efeito.prox <= -2) out.push({ texto: 'Mais distante', tom: 'ruim' });
  if (efeito.confianca >= 2) out.push({ texto: 'Mais confiança', tom: 'bom' });
  else if (efeito.confianca <= -2) out.push({ texto: 'Menos confiança', tom: 'ruim' });
  if (efeito.tensao >= 3) out.push({ texto: 'Tensão subiu', tom: 'ruim' });
  else if (efeito.tensao <= -3) out.push({ texto: 'Tensão diminuiu', tom: 'bom' });
  return out;
}
