/**
 * Baixar o VIDA para Android (o APK): o mesmo jogo, com tudo dentro — roda sem internet desde a instalação, e os
 * saves ficam no aparelho. Não aparece dentro do próprio app (lá já se está nele) nem no itch.io (lá o jogo roda
 * num iframe de terceiros, e o pacote do itch não leva o APK). Ver `docs/notas/ANDROID-APK.md`.
 */
export const ARQUIVO_APK = 'android/vida.apk';

export function podeBaixarApp(): boolean {
  if (typeof window === 'undefined') return false;
  const dentroDoApp = !!(window as unknown as { Capacitor?: unknown }).Capacitor;
  let emIframe = false;
  try { emIframe = window.self !== window.top; } catch { emIframe = true; }
  return !dentroDoApp && !emIframe;
}

export function BaixarApp({ compacto }: { compacto?: boolean }) {
  if (!podeBaixarApp()) return null;
  return (
    <div className={`baixar-app${compacto ? ' baixar-app--compacto' : ''}`}>
      <a className="botao botao--secundario baixar-app__botao" href={ARQUIVO_APK} download="VIDA.apk">Baixar o app para Android (APK)</a>
      {!compacto && <p className="nota baixar-app__nota">Para celular Android. Ao instalar, o aparelho pede para permitir apps de fora da loja. O app funciona sem internet; uma vida pode ir do navegador para o app pelo "Exportar esta vida".</p>}
    </div>
  );
}
