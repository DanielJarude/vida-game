/**
 * Gera o APK do VIDA para Android a partir do build (`dist/`), com o Capacitor: o jogo inteiro vai DENTRO do app
 * (roda sem internet desde a instalação; os saves ficam no IndexedDB do aparelho). O APK sai assinado com a chave de
 * depuração (instalação direta, fora da loja) e é copiado para `public/android/vida.apk`, de onde o site oferece o
 * download ("Baixar o app para Android").
 *
 * Pré-requisitos (fora do projeto — nada disso entra no package.json do jogo):
 *   JAVA_HOME     um JDK 17
 *   ANDROID_HOME  um Android SDK com platforms;android-34 e build-tools;34.0.0
 * Uso:
 *   npm run build && node scripts/android/gerar-apk.mjs
 *   APK_DIR=/caminho/de/trabalho node scripts/android/gerar-apk.mjs   (padrão: .android/, ignorado pelo git)
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(raiz, 'dist');
const dir = resolve(process.env.APK_DIR ?? join(raiz, '.android'));
const sh = (cmd, cwd = dir) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });

if (!existsSync(join(dist, 'index.html'))) { console.error('ERRO: rode `npm run build` antes.'); process.exit(1); }
if (!process.env.JAVA_HOME || !process.env.ANDROID_HOME) { console.error('ERRO: defina JAVA_HOME (JDK 17) e ANDROID_HOME (SDK com android-34).'); process.exit(1); }
mkdirSync(dir, { recursive: true });

// 1. O Capacitor, num diretório de trabalho próprio (não mexe nas dependências do jogo).
if (!existsSync(join(dir, 'node_modules/@capacitor/android'))) {
  if (!existsSync(join(dir, 'package.json'))) writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'vida-android', private: true }, null, 2));
  sh('npm i @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6');
}
writeFileSync(join(dir, 'capacitor.config.json'), JSON.stringify({ appId: 'br.vida.jogo', appName: 'VIDA', webDir: 'www', android: { backgroundColor: '#121010' } }, null, 2));

// 2. O jogo dentro do app: o build inteiro, menos o service worker (no app, os arquivos já estão no aparelho) e o
//    próprio APK (que não cabe dentro dele mesmo).
rmSync(join(dir, 'www'), { recursive: true, force: true });
cpSync(dist, join(dir, 'www'), { recursive: true, filter: s => !/[\\/](sw\.js|workbox-[\w-]+\.js)(\.map)?$/.test(s) && !/[\\/]android([\\/]|$)/.test(s.slice(dist.length)) });

// 3. O projeto Android (uma vez) e a cópia do jogo para dentro dele.
if (!existsSync(join(dir, 'android'))) sh('npx cap add android');
sh('npx cap copy android');

// 4. O ícone do VIDA (o mesmo do PWA) em todas as densidades; sem o ícone adaptativo padrão do Capacitor.
const res = join(dir, 'android/app/src/main/res');
const icone = join(raiz, 'public/icones/icone-512.png');
for (const d of readdirSync(res)) {
  if (d.startsWith('mipmap-anydpi')) { rmSync(join(res, d), { recursive: true, force: true }); continue; }
  if (!d.startsWith('mipmap-') || !statSync(join(res, d)).isDirectory()) continue;
  for (const f of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) if (existsSync(join(res, d, f))) copyFileSync(icone, join(res, d, f));
}

// 5. O APK (assinado com a chave de depuração) → public/android/vida.apk.
writeFileSync(join(dir, 'android/local.properties'), `sdk.dir=${process.env.ANDROID_HOME}\n`);
sh(process.platform === 'win32' ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug --no-daemon', join(dir, 'android'));
const apk = join(dir, 'android/app/build/outputs/apk/debug/app-debug.apk');
mkdirSync(join(raiz, 'public/android'), { recursive: true });
copyFileSync(apk, join(raiz, 'public/android/vida.apk'));
console.log(`APK: public/android/vida.apk (${(statSync(apk).size / 1048576).toFixed(1)} MB)`);
