# VIDA para Android (APK)

O site oferece **"Baixar o app para Android"** na tela inicial e no menu do jogo (`src/ui/telas/BaixarApp.tsx`). O link
aponta para `android/vida.apk`, que mora em `public/android/` e entra no `dist/` do site como qualquer arquivo
estático.

## O que é o APK

- O jogo inteiro, **dentro do app** (Capacitor 6, WebView do Android): roda sem internet desde a instalação; os saves
  ficam no IndexedDB do aparelho, como no navegador.
- Pacote `br.vida.jogo`, Android 6+ (minSdk 22 do Capacitor 6), alvo SDK 34.
- O service worker do PWA **não** vai para dentro do app (os arquivos já estão no aparelho).
- Assinado com a **chave de depuração**: instala por "arquivo baixado" (o Android pede para permitir a instalação de
  fontes desconhecidas). Não é um APK de loja — para a Play Store, seria preciso uma chave de release e um AAB.

## Onde o botão aparece (e onde não)

- Aparece no navegador (site e PWA instalado).
- Não aparece dentro do próprio app (Capacitor) nem dentro do iframe do itch.io (o pacote do itch não leva o APK:
  `scripts/itch/empacotar.mjs` exclui `android/`).
- O APK **não** entra no precache do service worker (as `globPatterns` do `vite.config.ts` não incluem `.apk`):
  quem joga no navegador não baixa 5 MB à toa.

## Como gerar de novo

Pré-requisitos, fora do projeto (nada disso entra no `package.json` do jogo): um JDK 17 (`JAVA_HOME`) e um Android SDK
com `platforms;android-34` e `build-tools;34.0.0` (`ANDROID_HOME`).

```sh
npm run build
JAVA_HOME=/caminho/jdk-17 ANDROID_HOME=/caminho/android-sdk node scripts/android/gerar-apk.mjs
# opcional: APK_DIR=/caminho/de/trabalho (padrão: .android/, ignorado pelo git)
```

O script instala o Capacitor numa pasta de trabalho própria, copia o `dist/` (sem service worker e sem o próprio APK)
para dentro do projeto Android, gera os ícones, roda `gradlew assembleDebug` e copia o resultado para
`public/android/vida.apk`. Depois, um novo `npm run build` leva o APK para o `dist/`.

**Atenção:** o APK leva o jogo da build em que foi gerado. Ao publicar uma versão nova do jogo, gerar o APK de novo
(senão o app instalado fica na versão antiga — não há atualização automática fora da loja).

## Limitações conhecidas

- Testado em build (estrutura do APK, `index.html` e pacotes dentro de `assets/public`, sem service worker); **não foi
  instalado num aparelho real** nesta etapa.
- Assinatura de depuração (veja acima).
- O APK é um binário de ~5,5 MB versionado em `public/android/`: cada regeneração acrescenta esse tamanho ao histórico.
