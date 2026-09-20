/**
 * Opções de aparência do avatar.
 *
 * Princípios:
 * - Poucas opções, bem diferenciadas. Melhor 6 cabelos distintos do que 50
 *   variações quase iguais.
 * - Tudo é **dado**, não código: acrescentar uma opção é uma linha aqui, e
 *   ela aparece na criação sem tocar em componente.
 * - Aparência **não tem efeito nenhum** em gameplay. Nenhum campo daqui
 *   alimenta atributo, personalidade, classe social ou evento. Há teste
 *   garantindo isso.
 * - Nada de IA, foto, API externa ou editor complexo. O avatar é desenhado
 *   com SVG inline a partir destes valores.
 */

export interface OpcaoAparencia {
  id: string;
  /** Rótulo legível, usado na seleção. */
  nome: string;
  /** Cor aplicada no SVG. */
  cor: string;
}

/** Tons de pele. Ordem clara do mais claro ao mais escuro. */
export const TONS_DE_PELE: readonly OpcaoAparencia[] = [
  { id: 'pele_1', nome: 'Clara', cor: '#f2d3bb' },
  { id: 'pele_2', nome: 'Clara dourada', cor: '#e5b894' },
  { id: 'pele_3', nome: 'Morena clara', cor: '#c98f63' },
  { id: 'pele_4', nome: 'Morena', cor: '#a4673c' },
  { id: 'pele_5', nome: 'Morena escura', cor: '#7a4526' },
  { id: 'pele_6', nome: 'Retinta', cor: '#4d2a17' }
] as const;

export const CORES_DE_CABELO: readonly OpcaoAparencia[] = [
  { id: 'cab_preto', nome: 'Preto', cor: '#1c1a1a' },
  { id: 'cab_castanho_escuro', nome: 'Castanho escuro', cor: '#3b2318' },
  { id: 'cab_castanho', nome: 'Castanho', cor: '#6b4227' },
  { id: 'cab_loiro', nome: 'Loiro', cor: '#c9a15a' },
  { id: 'cab_ruivo', nome: 'Ruivo', cor: '#9c4a22' },
  { id: 'cab_grisalho', nome: 'Grisalho', cor: '#9b9b9b' },
  { id: 'cab_colorido', nome: 'Colorido', cor: '#5b8def' }
] as const;

export const CORES_DE_OLHOS: readonly OpcaoAparencia[] = [
  { id: 'olho_castanho_escuro', nome: 'Castanho escuro', cor: '#3a2416' },
  { id: 'olho_castanho', nome: 'Castanho', cor: '#6b4423' },
  { id: 'olho_mel', nome: 'Mel', cor: '#a97d3c' },
  { id: 'olho_verde', nome: 'Verde', cor: '#4a7c59' },
  { id: 'olho_azul', nome: 'Azul', cor: '#4a6f9c' },
  { id: 'olho_cinza', nome: 'Cinza', cor: '#7b8794' }
] as const;

/**
 * Estilos de cabelo.
 *
 * `forma` identifica o desenho no componente de avatar. São silhuetas
 * simples e bem distintas entre si — não é um editor de penteados.
 */
export type FormaCabelo =
  | 'raspado'
  | 'curto'
  | 'ondulado'
  | 'cacheado'
  | 'crespo'
  | 'longo'
  | 'preso'
  | 'trancas';

export interface EstiloCabelo {
  id: string;
  nome: string;
  forma: FormaCabelo;
}

export const ESTILOS_DE_CABELO: readonly EstiloCabelo[] = [
  { id: 'estilo_raspado', nome: 'Raspado', forma: 'raspado' },
  { id: 'estilo_curto', nome: 'Curto', forma: 'curto' },
  { id: 'estilo_ondulado', nome: 'Ondulado', forma: 'ondulado' },
  { id: 'estilo_cacheado', nome: 'Cacheado', forma: 'cacheado' },
  { id: 'estilo_crespo', nome: 'Crespo', forma: 'crespo' },
  { id: 'estilo_longo', nome: 'Longo', forma: 'longo' },
  { id: 'estilo_preso', nome: 'Preso', forma: 'preso' },
  { id: 'estilo_trancas', nome: 'Tranças', forma: 'trancas' }
] as const;

/** Busca auxiliar: devolve a cor de uma opção, com fallback seguro. */
export function corDaOpcao(
  lista: readonly OpcaoAparencia[],
  id: string
): string {
  return lista.find(o => o.id === id)?.cor ?? lista[0].cor;
}

export function formaDoCabelo(id: string): FormaCabelo {
  return ESTILOS_DE_CABELO.find(e => e.id === id)?.forma ?? 'curto';
}
