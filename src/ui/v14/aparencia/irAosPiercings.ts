/**
 * VIDA 14 — o caminho da loja até o painel de piercings (Você · Aparência · Piercings). A loja não sabe navegar: pede por
 * um evento da janela (o Jogo escuta e abre Você · Aparência) e deixa anotado o furo da joia (o painel abre nele e rola
 * até a seção). Tudo protegido: sem armazenamento ou fora do navegador, só não leva.
 */
export const EVENTO_IR_PIERCINGS = 'vida-ir-piercings';
const CHAVE = 'VIDA_IR_PIERCINGS';

export function irAosPiercings(furo?: string): void {
  try { sessionStorage.setItem(CHAVE, furo ?? '-'); } catch { /* sem armazenamento */ }
  try { window.dispatchEvent(new Event(EVENTO_IR_PIERCINGS)); } catch { /* fora do navegador */ }
}

/** O pedido pendente (o furo, ou '-' para só a seção). Ler não consome: `atenderPedido` consome. */
export function pedidoDosPiercings(): string | undefined {
  try { return sessionStorage.getItem(CHAVE) ?? undefined; } catch { return undefined; }
}
export function atenderPedido(): void {
  try { sessionStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ }
}
