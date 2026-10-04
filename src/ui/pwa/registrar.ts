/// <reference types="vite-plugin-pwa/vanillajs" />
/**
 * O service worker do VIDA (PWA offline).
 *
 * Registro silencioso: se o navegador não tem service worker, se o registro
 * falha, ou se o jogo está dentro de um iframe (o itch.io serve o jogo de
 * html-classic.itch.zone dentro da página do itch), nada acontece e o jogo
 * segue igual — online, como sempre foi.
 *
 * Atualização com AVISO (registerType 'prompt'): uma versão nova fica
 * esperando até o jogador aceitar; nunca recarrega sozinha no meio de um ano.
 * Ao aceitar, as gravações pendentes são esperadas antes (ver AvisoAtualizacao).
 */

/** Atualizar: ativa o service worker que espera e recarrega a página. */
export type Atualizar = () => Promise<void>;

/** Uma hora: numa sessão longa, procura versão nova de tempos em tempos (só online). */
const INTERVALO_DE_PROCURA = 60 * 60 * 1000;

/**
 * Embutido num iframe (itch.io e afins): sem service worker. Lá ele seria de terceiros — o Safari o bloqueia,
 * o Chrome o isola por site — e cada envio ao itch muda o caminho, deixando caches órfãos para trás.
 */
export function deveRegistrar(): boolean {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    if (!('serviceWorker' in navigator)) return false;
    if (window.self !== window.top) return false;
    // Dentro do app Android (Capacitor) os arquivos já estão no aparelho: o service worker nem vai no APK.
    if ((window as unknown as { Capacitor?: unknown }).Capacitor) return false;
    if (/(^|\.)itch\.(io|zone)$/.test(location.hostname)) return false;
    return true;
  } catch {
    // Acessar `window.top` de outra origem pode lançar: é um iframe, então não registra.
    return false;
  }
}

/**
 * Registra (só na build de produção). `aoHaverVersaoNova` é chamado quando uma versão nova terminou de baixar
 * e está esperando — com a função que a ativa.
 */
export async function registrarServiceWorker(aoHaverVersaoNova: (atualizar: Atualizar) => void): Promise<void> {
  if (!import.meta.env.PROD || !deveRegistrar()) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    const atualizar = registerSW({
      immediate: true,
      onNeedRefresh: () => aoHaverVersaoNova(() => atualizar(true)),
      onRegisteredSW: (_url, reg) => {
        if (!reg) return;
        setInterval(() => { if (navigator.onLine) void reg.update().catch(() => undefined); }, INTERVALO_DE_PROCURA);
      },
      onRegisterError: () => { /* silencioso: o jogo funciona sem service worker */ }
    });
  } catch {
    /* idem */
  }
}
