/**
 * VIDA 30 · a versão atual e a lembrança de "já vi as notas" (separadas das notas inteiras, `novidades.ts`, que só a
 * janela sob demanda carrega). Ao cadastrar uma versão nova nas notas, atualize VERSAO_ATUAL aqui — o teste
 * `vida30Novidades` confere que as duas batem.
 */
export const VERSAO_ATUAL = '37';
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
