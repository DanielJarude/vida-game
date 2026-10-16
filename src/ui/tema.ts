/**
 * REWORK 6.5 — a aparência do jogo: Claro, Escuro ou Automático (segue o sistema).
 *
 * UMA porta para o tema. A preferência é do APARELHO, não da vida: mora no localStorage (`VIDA_APARENCIA`), como o
 * som — o save da personagem não muda de versão por causa disso, e trocar de vida não troca o tema.
 *
 * Como o tema chega à tela: um atributo só, `data-tema="claro" | "escuro"`, no <html>. Toda a cor do jogo sai de
 * `tokens.css`, e lá o tema escuro redefine apenas a camada de PALETA (`--p-*`); a semântica e os nomes antigos seguem
 * sozinhos. Nenhum componente pergunta qual é o tema.
 *
 * Sem flash: `index.html` tem um script em linha (o mesmo algoritmo de `resolverTema`, em poucas linhas) que aplica o
 * atributo ANTES do CSS e do React — a primeira pintura já sai no tema certo, também offline (não há rede envolvida).
 * Este módulo assume depois: troca, persiste e, no Automático, acompanha o sistema ao vivo.
 */

export type Aparencia = 'claro' | 'escuro' | 'auto';
export type Tema = 'claro' | 'escuro';

export const CHAVE_APARENCIA = 'VIDA_APARENCIA';
export const APARENCIAS: readonly { id: Aparencia; rotulo: string; nota: string }[] = [
  { id: 'claro', rotulo: 'Claro', nota: 'papel marfim' },
  { id: 'escuro', rotulo: 'Escuro', nota: 'grafite' },
  { id: 'auto', rotulo: 'Automático', nota: 'segue o aparelho' }
];

/** A cor da moldura em cada tema (barra do navegador, PWA): a mesma de `--p-moldura` em tokens.css. */
export const COR_DA_MOLDURA: Record<Tema, string> = { claro: '#22262c', escuro: '#131518' };

const CONSULTA_ESCURO = '(prefers-color-scheme: dark)';

export function lerAparencia(armazem: Pick<Storage, 'getItem'> | null = armazemPadrao()): Aparencia {
  try {
    const v = armazem?.getItem(CHAVE_APARENCIA);
    return v === 'claro' || v === 'escuro' || v === 'auto' ? v : 'auto';
  } catch { return 'auto'; }
}

export function guardarAparencia(a: Aparencia, armazem: Pick<Storage, 'setItem'> | null = armazemPadrao()) {
  try { armazem?.setItem(CHAVE_APARENCIA, a); } catch { /* sem armazenamento: vale até fechar */ }
}

export function sistemaEscuro(): boolean {
  try { return typeof matchMedia === 'function' && matchMedia(CONSULTA_ESCURO).matches; } catch { return false; }
}

/** A preferência vira um tema de verdade (o Automático pergunta ao sistema). */
export function resolverTema(a: Aparencia, escuroNoSistema = sistemaEscuro()): Tema {
  return a === 'auto' ? (escuroNoSistema ? 'escuro' : 'claro') : a;
}

/** Põe o tema na página: o atributo do <html>, o `color-scheme` dos controles nativos e a cor da barra do navegador. */
export function aplicarTema(t: Tema, a: Aparencia, doc: Document | null = typeof document !== 'undefined' ? document : null) {
  if (!doc) return;
  const raiz = doc.documentElement;
  raiz.dataset.tema = t;
  raiz.dataset.aparencia = a;
  let meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) { meta = doc.createElement('meta'); meta.name = 'theme-color'; doc.head.appendChild(meta); }
  meta.content = COR_DA_MOLDURA[t];
}

/** Troca a aparência: guarda, aplica e devolve o tema que ficou valendo. */
export function escolherAparencia(a: Aparencia): Tema {
  guardarAparencia(a);
  const t = resolverTema(a);
  // A troca pedida pelo jogador é suave (sistema.css, só sem movimento reduzido); a da primeira pintura, não.
  const raiz = typeof document !== 'undefined' ? document.documentElement : null;
  raiz?.setAttribute('data-trocando-tema', '');
  aplicarTema(t, a);
  if (raiz) setTimeout(() => raiz.removeAttribute('data-trocando-tema'), 260);
  return t;
}

/** No Automático, o tema acompanha o sistema enquanto o jogo está aberto. Devolve a função de desligar. */
export function acompanharSistema(aoMudar: (escuro: boolean) => void): () => void {
  try {
    if (typeof matchMedia !== 'function') return () => {};
    const mq = matchMedia(CONSULTA_ESCURO);
    const f = (e: MediaQueryListEvent) => aoMudar(e.matches);
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  } catch { return () => {}; }
}

function armazemPadrao(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

/**
 * Ao abrir o jogo: confirma o tema (o script de index.html já o pôs — aqui vale para quem abre sem ele, como os
 * testes) e, enquanto o jogo estiver aberto, faz o Automático acompanhar o sistema — leia-se a preferência na hora
 * da mudança, não a de quando o jogo abriu.
 */
export function iniciarTema(): () => void {
  const a = lerAparencia();
  aplicarTema(resolverTema(a), a);
  return acompanharSistema(escuro => { const agora = lerAparencia(); if (agora === 'auto') aplicarTema(resolverTema('auto', escuro), 'auto'); });
}
