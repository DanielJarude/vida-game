# VIDA como PWA offline-first

Notas da implementação: o VIDA instala como aplicativo, abre e joga sem rede depois da primeira visita, e guarda as vidas no IndexedDB (o localStorage fica de reserva).

## Solução escolhida

- **vite-plugin-pwa 1.3 (Workbox 7), estratégia `generateSW`.** O service worker só precisa de precache e de resposta à navegação; não há push, sincronização em segundo plano nem rotas próprias. Escrever um SW próprio (`injectManifest`) seria código a manter sem ganho. Se um dia precisar de lógica no SW, a troca é só de estratégia.
- **Registro próprio** (`src/ui/pwa/registrar.ts`, `injectRegister: false`), usando `virtual:pwa-register` importado sob demanda:
  - só roda na build de produção, só se existe `navigator.serviceWorker` e só fora de iframe e de `*.itch.io` / `*.itch.zone`;
  - qualquer falha é engolida: o jogo segue online como antes;
  - procura versão nova a cada hora numa sessão longa (só online).
- **`registerType: 'prompt'`**, sem `skipWaiting` nem `clientsClaim` automáticos. Uma versão nova baixa em segundo plano e **espera**. Enquanto ela espera, aparece uma faixa discreta no alto da tela (`src/ui/pwa/AvisoAtualizacao.tsx`) com "Há uma versão nova do VIDA.", **Atualizar agora** e **Agora não**. Nunca é um modal e nunca aparece só por abrir o jogo. Ao aceitar, o jogo espera a fila de gravação esvaziar (`aguardarGravacoes()`) e só então chama `updateSW(true)`, que ativa o SW novo e recarrega a página. "Agora não" esconde a faixa; ela volta na próxima abertura enquanto a versão nova continuar esperando.

## Manifesto

`manifest.webmanifest` é gerado pelo plugin e ligado no `index.html` por `<link rel="manifest" href="./manifest.webmanifest">`:

| campo | valor |
| --- | --- |
| name / short_name | VIDA / VIDA |
| id, start_url, scope | `./` (relativos ao manifesto: servem na raiz do Netlify e em qualquer subdiretório) |
| display | standalone |
| theme_color / background_color | `#121010` (o mesmo do `index.html`) |
| lang / dir | pt-BR / ltr |
| categories | games, entertainment |
| icons | 192 e 512 `any`, 512 `maskable` |

Para o iOS, o `index.html` ganhou `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` e `apple-mobile-web-app-status-bar-style=black`. Com `black`, o conteúdo fica abaixo da barra de status (não usamos `black-translucent`, que exigiria tratar o recuo do topo).

## Ícones

Os ícones são gerados por `scripts/pwa/gerarIcones.mjs`: o Playwright desenha o SVG no Chromium e tira a captura (não há PIL nem sharp no projeto). Eles ficam versionados em `public/icones/`:

- `icone-192.png` e `icone-512.png`: o quadrado arredondado do favicon (`#121010`) com o V âmbar (`#d9a05b`) e cantos transparentes.
- `icone-maskable-512.png`: fundo até a borda e o V a 0,8×, dentro da zona segura (o círculo de 80%).
- `apple-touch-icon.png` (180): fundo cheio, sem transparência. O iOS arredonda sozinho.

O V é um polígono, não texto. O favicon usa `system-ui` em negrito, que muda de máquina para máquina, e um ícone instalado tem de sair sempre igual. O favicon em data-URI no `index.html` não mudou.

## Service worker: precache e atualização

- O `globPatterns` é `**/*.{js,css,html,woff2,woff,ttf,png,svg,jpg,jpeg,webp,ico,json}`. Isso pega **tudo** o que o build gera: o app, cada pacote sob demanda (`motor`, `motor-conteudo`, `motor-carreira`, `motor-dados`, `Jogo`, `Criacao`, `Vidas`…), o CSS, as fontes e os ícones. Os pacotes de dados que a refatoração do mundo vai criar em `assets/` entram sozinhos.
- O manifesto entra uma vez só, pelo próprio plugin. Com `includeManifestIcons: false` e sem `webmanifest` no glob, o precache não fica com entradas duplicadas.
- `maximumFileSizeToCacheInBytes` é 4 MB. Hoje o maior pacote, `motor-conteudo`, tem 787 kB, e o limite de aviso continua em 800 kB.
- `navigateFallback: 'index.html'` e `cleanupOutdatedCaches: true` (os caches de versões antigas são apagados).
- **Sem cache em tempo de execução.** Depois das fontes, o jogo não pede mais nada à rede, então não há o que cachear além do precache.
- **Tamanho (build atual): 27 entradas, 3.327,84 KiB de precache** (3,4 MB em disco: `assets` + `index.html` + ícones + manifesto). O `sw.js` tem 2,5 kB e o runtime `workbox-*.js` tem 15 kB. Em gzip, o JS do jogo é bem menor (o motor inteiro dá cerca de 650 kB). O precache baixa uma vez e depois só os arquivos que mudaram (pelo hash/revisão).
- **Netlify:** `sw.js` não deve ficar em cache HTTP longo. O Netlify, por padrão, serve com `max-age=0, must-revalidate`, e os navegadores também ignoram cache HTTP acima de 24 h para o script do SW. Não foi preciso criar `_headers`.

## Fontes: tudo local

- As fontes eram carregadas do Google Fonts. Os `<link>` e os `preconnect` para `fonts.googleapis.com` e `fonts.gstatic.com` saíram do `index.html`.
- Agora vêm de `src/ui/fontes.css` (importado em `main.tsx`), que aponta para os arquivos dos pacotes `@fontsource-variable/newsreader` e `@fontsource-variable/inter` (licença OFL, devDependencies, entram no bundle no build).
  - **Newsreader**: variável com eixo de tamanho óptico (opsz) e peso, normal e itálico. É a mesma família que o Google servia (`ital,opsz,wght`).
  - **Inter**: variável só no peso, normal (a interface usa 400 a 600 e não tem itálico).
  - **Só os subconjuntos latin e latin-ext.** O CSS foi escrito à mão, com os `unicode-range` dos pacotes. Os CSS prontos do fontsource trazem também cirílico, grego e vietnamita, e todos entrariam no precache.
  - Os nomes de família continuam `'Newsreader'` e `'Inter'`, os mesmos do `tokens.css`, e as pilhas locais de lá seguem como reserva.
- **Peso: 594 kB em 6 arquivos woff2.** Newsreader latin 132 + 147 (itálico), Newsreader latin-ext 87 + 96, Inter latin 48, Inter latin-ext 85. Online, o navegador baixa só o que a página usa (pelo `unicode-range`); o precache guarda os seis. Se precisar reduzir: a versão só com peso da Newsreader (sem opsz) cai para cerca de 200 kB nos quatro arquivos, mas perde o tamanho óptico.

## Auditoria de rede

Busca por `http(s)://`, `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket` e domínios em `src/`, `index.html` e `public/`:

- **Google Fonts** (4 referências no `index.html`): removidas e trocadas pelas fontes locais acima.
- O único outro `http://` é o `xmlns='http://www.w3.org/2000/svg'` do favicon em data-URI. É um identificador de namespace e não gera pedido de rede.
- Não há analytics, CDN, imagem remota nem `fetch` no jogo. Os retratos e ícones são SVG/React gerados localmente.
- O teste offline confirma: com a rede desligada, o jogo abre, carrega todos os pacotes e joga, sem nenhum erro de console.

## Armazenamento

### Desenho

O motor continua sem saber onde a vida fica. Ele só transforma texto em vida e vida em texto:

- `interpretar(bruto)`, `importarVida` e `exportarVida` (em `src/motor/save.ts`) continuam sendo o ponto único de leitura, validação e migração de versão;
- `salvar`, `ler`, `apagarSave`, `lerEstatisticas` e `registrarVidaPassada` (com `Armazenamento`) **ficaram como estavam**, porque os testes do motor e o smoke os usam. **O `save.ts` não foi alterado.**

A interface lê e grava pela camada nova, `src/ui/persistencia/`:

- `armazens.ts`: os dois armazéns (`Armazem`), IndexedDB e localStorage, ambos só de **texto**;
- `index.ts`: `Persistencia` (fila, migração, escolha do armazém), `persistenciaDoJogo(validar)` (a instância única do jogo, criada quando o motor chega) e `aguardarGravacoes()`;
- `abrir.ts`: `abrirSalva(carga, interpretar)`, que decide entre o save principal e o anterior.

`src/ui/motor.ts` passou a carregar, junto com a fachada, o `interpretar` do `save.ts`. Os dois estão no mesmo pacote (`motor-conteudo`), então não há pedido a mais e `fachada.ts` não foi alterada. As estatísticas passam pelas funções do motor (`lerEstatisticas`/`registrarVidaPassada`) com um `Armazenamento` em memória (`gaveta()` no `useVida`), sem regra duplicada.

### Esquema do IndexedDB

- Banco `VIDA`, versão 1, object store `gavetas` (chaves fora da linha).
- Gavetas: `principal` (o save atual), `anterior` (o save bom de antes da última gravação), `backup` (um save que não abriu, ou o original de um save convertido de versão) e `estatisticas` (as vidas passadas). Cada uma é `{ bruto: string, em: number }`.
- `meta`: `{ migradoDoLocalStorage: <timestamp> }`.
- No localStorage de reserva, as chaves são as de sempre (`VIDA_GAME_SAVE_V1`, `VIDA_GAME_SAVE_BACKUP`, `VIDA_GLOBAL_STATS_V1`) mais `VIDA_GAME_SAVE_ANTERIOR`. Há um teste que garante que essas chaves não se separem das do motor.

### Atomicidade e ordem

- **Gravar um save** é **uma transação** `readwrite` com `durability: 'strict'`: lê o principal, copia para o anterior e grava o novo principal. Se ela cair no meio (cota, aba fechada, erro), o navegador desfaz tudo e o principal e o anterior de antes continuam intactos. Isso está testado com uma falha injetada no `put` do principal.
- No **localStorage**, sem transação, quem garante é a ordem: o anterior é escrito antes do principal, e um `setItem` que falha não altera o valor antigo. Se faltar espaço, o anterior é sacrificado primeiro e o principal é tentado de novo.
- **Fila:** as operações rodam uma de cada vez. Um save que chega enquanto outro ainda não começou só troca o texto dele (a vida mais nova vence, e as do meio não são gravadas à toa). Um `apagar` no meio da fila respeita a ordem: um save pedido antes dele não reaparece depois.
- **`aguardarGravacoes()`** espera a fila esvaziar. É chamado antes de atualizar a versão (PWA) e em `visibilitychange` (página escondida) e `pagehide`.
- `navigator.storage.persist()` é pedido uma vez, em silêncio, onde existe.

### Migração do localStorage (saves v19 de antes do PWA)

Na primeira abertura com IndexedDB, se o IndexedDB **não tem save** e a marca `meta.migradoDoLocalStorage` **não existe**:

1. o save do localStorage é **validado** com `interpretar` (o validador que o motor passa à persistência);
2. se é válido, vai para o `principal` do IndexedDB pela mesma transação atômica. Se não é, vai para o `backup` e o jogador vê um aviso (`avisoSave`);
3. o backup e as estatísticas também são copiados, se o IndexedDB não os tiver;
4. só no fim, com tudo confirmado, a marca é gravada. Se algo falhar antes disso, a próxima abertura tenta de novo.

**O localStorage não é apagado.** A cópia antiga fica como reserva por pelo menos uma versão (se o IndexedDB falhar, ou o navegador despejá-lo, a vida de antes ainda está lá). A marca impede uma segunda cópia por cima. Quando o jogador **apaga** a vida (abandonar, encerrar a história), a cópia antiga do localStorage vai junto, porque ele não a quer de volta. Numa versão futura, depois de um tempo, essa reserva pode ser removida (ver pendências).

O save migrado é o texto **cru** (v19, ou mais antigo). A conversão de versão continua acontecendo na abertura, como sempre: `interpretar` → `migrado` → o original vai para o `backup` e a vida convertida é gravada. A migração v20 que vem aí, no `save.ts`, entra sozinha por esse caminho.

### Reserva (sem IndexedDB)

Sem `indexedDB` (jsdom, navegadores antigos) ou com uma falha ao abrir (`SecurityError` em modo privado, `open` que nunca responde: o prazo é de 4 s), a persistência cai no localStorage, sem erro.

Com o localStorage como armazém, tudo é **síncrono**: a carga sai na hora (a primeira tela já abre com "Continuar") e o save é gravado no ato. Por isso os testes de interface que semeiam o localStorage e leem com `ler()` do motor continuam passando sem mudança nenhuma.

### Recuperação

Na abertura, `abrirSalva` tenta o principal. Se ele não abre, tenta o anterior:

- se o anterior abre, a vida volta de um passo atrás, o texto danificado vai para o `backup`, a vida recuperada é gravada de novo como principal, e o jogador vê o aviso: *"A última gravação da sua vida estava danificada e não abriu. O jogo voltou ao salvamento anterior — o último passo pode ter se perdido. Uma cópia da gravação danificada foi guardada."*;
- se nenhum dos dois abre, aparece o aviso de sempre, *"Não foi possível abrir a vida salva: … Uma cópia foi guardada."*, e o texto vai para o `backup`.

Se uma gravação falhar (sem espaço), o jogador é avisado **uma vez** e convidado a exportar a vida.

### `useVida`

A API pública não mudou: as telas usam os mesmos campos. Mudou por dentro:

- `pronto` agora é "motor carregado **e** save lido". Com IndexedDB, a tela inicial mostra "Carregando…" até a leitura chegar, para não se nascer por cima de uma vida que ainda vai aparecer;
- `estatisticas` virou estado, lido pela persistência;
- a tela **Vidas passadas** passou a ler `c.estatisticas` em vez de ir direto ao localStorage;
- `continuar` usa a vida já aberta na carga (IndexedDB) ou relê, se o armazém é síncrono.

## Exportar e importar: auditoria

- **Onde está:** na tela inicial ("Importar uma vida (arquivo)") e no menu do jogo (☰ → "Exportar esta vida (arquivo)" e "Importar uma vida (arquivo)"). As duas telas estão acessíveis.
- **Formato:** um envelope JSON `{ formato: 'vida-save', versao, exportadoEm, nome, vida }`. Também aceita um save cru.
- **Validação:** texto vazio é recusado; o limite é `LIMITE_IMPORTACAO` (12 MB, verificado também pelo tamanho do arquivo antes de ler); só `JSON.parse` (nada é executado); não aceita array nem tipo primitivo; versão maior que `VERSAO_SAVE` é recusada com mensagem clara; vida já encerrada é recusada; depois passa por `interpretar` (forma, validação profunda, migração de versões antigas) e confere o `rng`.
- **Sem estragar o estado:** a importação é em dois passos (prévia e confirmação). Um erro só mostra a mensagem (`role="alert"`) e não mexe na vida salva nem na tela. Ao confirmar, a vida de antes vai para o slot `anterior`, ficando recuperável por um passo.
- **Testes:** o motor já cobria vazio, JSON inválido, array, versão mais nova, vida morta, limite de tamanho e código embutido (`fix3.test.ts` e outros), além do vai-e-volta export→import em vários pacotes. Foram acrescentados testes de interface (`src/ui/__tests__/pwa.test.tsx`): o arquivo inválido mostra o erro e mantém save e tela; o arquivo válido pede confirmação, substitui e deixa a vida anterior no slot `anterior`.
- Nenhum problema encontrado.

## Testes

| teste | o que cobre | resultado |
| --- | --- | --- |
| `src/ui/persistencia/__tests__/persistencia.test.ts` (fake-indexeddb) | IndexedDB ida e volta e slot anterior; apagar; **gravação interrompida mantém os dois saves**; **principal corrompido → anterior**; **fila (a última vence, em ordem)**; apagar no meio da fila; `aguardarGravacoes`; **migração do localStorage v19** (save, backup, estatísticas, cópia mantida, uma vez só, não sobrescreve, save inválido → backup + aviso); reserva no localStorage (síncrona, IndexedDB que falha, sem espaço para o anterior, sem armazenamento nenhum); chaves iguais às do motor | 16/16 |
| `src/ui/__tests__/pwa.test.tsx` (jsdom) | recuperação com aviso na interface; slot anterior a cada passo; vidas passadas pela persistência; importar inválido/válido; aviso de versão nova (espera as gravações; "Agora não"); sem SW fora da produção | 8/8 |
| `src/ui/__tests__/*.test.tsx` existentes + os dois novos | todos os testes de interface, nenhum alterado | **22 arquivos, 142 testes, todos passam** |
| `scripts/pwa/offline.mjs` (Playwright, build real) | SW ativo; precache completo (27/27, com os pacotes do motor e as fontes); página controlada; nascer e viver 4 anos (save no IndexedDB, nada no localStorage); **offline**: abre, continua, vive 3 anos e decide; recarrega offline com **JSON idêntico** e a mesma idade na tela; **online, versão nova publicada** (o sw.js muda): o aviso aparece, aceitar ativa o SW novo e recarrega, o aviso não volta, **o save sobrevive idêntico** e a vida continua; nenhum erro de console | **18/18** |
| `npm run smoke:itch` | o pacote do itch | **19/19**. Eram 18; o smoke confere cada `./` do `index.html`, e o `./manifest.webmanifest` acrescentou uma verificação |
| `npx tsc --noEmit`, `npm run build:itch` | tipos, build e ZIP (27 arquivos, 1.443,7 kB; sem `sw.js`/`workbox-*.js`) | ok |

Para rodar: `npm run build && node scripts/pwa/offline.mjs` (fotos em `$SP`, por padrão `/tmp/vida-pwa`).

Ambiente: no WSL, com o checkout em `/mnt/c`, os testes jsdom batem no "Failed to start … worker" (só carregar o jsdom de um `node_modules` frio leva cerca de 90 s, e o limite do vitest é 60 s), mesmo um arquivo sozinho. Os resultados acima são de uma cópia da árvore no disco Linux (`/tmp`), onde a suíte de interface inteira roda em 79 s.

## iOS: limitações

- **Sem `beforeinstallprompt`.** No iOS/iPadOS não existe convite de instalação. Instalar é manual: Safari → Compartilhar → "Adicionar à Tela de Início" (desde o iOS 16.4, também pelo Chrome, Edge e outros navegadores do iOS). O jogo não mostra instrução de instalação hoje.
- **Despejo de dados.** Sem a interação do usuário, o Safari pode apagar os dados de um site (IndexedDB, localStorage, caches) depois de cerca de 7 dias sem uso, pela regra de ITP. **Instalado na Tela de Início**, o app tem armazenamento próprio e não entra nessa regra de 7 dias, mas o sistema ainda pode despejar dados quando falta espaço. O `navigator.storage.persist()` existe no Safari 17+, mas a concessão é decisão do sistema. **A garantia real para quem joga no iPhone é exportar a vida de vez em quando.** O menu já explica isso.
- O app instalado e o Safari **não compartilham dados**: a vida jogada no Safari não aparece no app da Tela de Início (e vice-versa). Para levar, é preciso exportar e importar.
- No iOS, o service worker e o precache funcionam como nos outros navegadores. A cota de armazenamento é menor, mas os 3,3 MB do precache e as vidas cabem com folga.

## itch.io: decisão

**No pacote do itch, o service worker fica desligado; o IndexedDB fica ligado.**

- O itch serve o jogo de `html-classic.itch.zone/html/<id>/` **dentro de um iframe** na página do itch.io. Um SW ali é de terceiros: o Safari o bloqueia, o Chrome o isola por site, e cada envio novo (outro `<id>`) deixaria caches órfãos que nunca seriam limpos. Lá o jogo já depende do itch online.
- Duas camadas garantem isso: (1) `registrar.ts` não registra dentro de iframe nem em `*.itch.io`/`*.itch.zone`; (2) `scripts/itch/empacotar.mjs` tira `sw.js` e `workbox-*.js` do ZIP, para que uma regressão no registro não ative nada.
- O manifesto e os ícones vão no pacote, sem efeito (não se instala um iframe).
- O save no itch usa o IndexedDB do iframe (isolado por site, como o localStorage já era), com a mesma reserva no localStorage. O smoke do itch semeia um save no localStorage e confere que o jogo oferece "Continuar", passando pela migração.

## Pendências e observações

- **Netlify:** antes de publicar, conferir num aparelho real a instalação (Android Chrome: menu → Instalar; iOS: Compartilhar → Tela de Início) e o ícone maskable.
- **Reserva do localStorage:** depois de uma ou duas versões com IndexedDB, decidir se a cópia antiga é apagada depois da migração (hoje ela fica). Em navegadores com IndexedDB, ela fica congelada no estado da migração.
- **Instruções de instalação:** não há botão "Instalar" (dava para usar `beforeinstallprompt` no Android e Chrome desktop) nem dica para o iOS. Ficou de fora para não poluir a tela inicial.
- **Abas simultâneas:** duas abas do jogo abertas gravam na mesma gaveta, e a última vence (como era com o localStorage). Não há trava entre abas (daria para fazer com `BroadcastChannel` ou Web Locks).
- **Vidas muito grandes:** o save ainda é serializado por inteiro (`JSON.stringify`) a cada passo, na thread principal. O IndexedDB tira o limite de cerca de 5 MB do localStorage, mas não o custo da serialização. Se as vidas de várias gerações passarem de alguns MB, vale gravar em pedaços ou num worker.
- **Modo desenvolvedor:** `devOptions.enabled: false`, então `npm run dev` não registra SW. Para ver o PWA, use `npm run build && npx vite preview`.
