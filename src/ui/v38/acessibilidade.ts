/**
 * VIDA 38 · acessibilidade: texto maior, alto contraste e menos animações. A preferência é deste navegador (localStorage)
 * e vira uma classe na raiz da página; sem armazenamento, o padrão vale e o jogo segue igual.
 */
export type Preferencias = { textoMaior: boolean; altoContraste: boolean; semAnimacao: boolean };
const CHAVE = 'vida.acessibilidade.v1';
const PADRAO: Preferencias = { textoMaior: false, altoContraste: false, semAnimacao: false };

export function lerPreferencias(): Preferencias {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? { ...PADRAO, ...(JSON.parse(bruto) as Partial<Preferencias>) } : { ...PADRAO };
  } catch { return { ...PADRAO }; }
}

export function aplicarPreferencias(p: Preferencias): void {
  const raiz = document.documentElement.classList;
  raiz.toggle('acess--texto-maior', p.textoMaior);
  raiz.toggle('acess--alto-contraste', p.altoContraste);
  raiz.toggle('acess--sem-animacao', p.semAnimacao);
}

export function guardarPreferencias(p: Preferencias): void {
  aplicarPreferencias(p);
  try { window.localStorage.setItem(CHAVE, JSON.stringify(p)); } catch { /* sem armazenamento: vale só nesta página */ }
}
