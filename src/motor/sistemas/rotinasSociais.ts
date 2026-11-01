/**
 * Onde cada atividade junta gente (preenchido por `rotinas`, lido por `social` e `busca`). VIDA 12.6: num módulo sem
 * dependências — antes morava em `social`, e o ciclo rotinas → social → … → rotinas deixava o registro indefinido
 * conforme a ordem em que os módulos carregavam.
 */
export const ROTINAS_SOCIAIS: Record<string, { onde: string; fluxo: number; amplitude: number }> = {};
