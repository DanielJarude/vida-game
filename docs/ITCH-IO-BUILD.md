# VIDA — Build HTML5 para o itch.io

Guia para gerar o pacote do VIDA e publicá-lo no itch.io. Escrito para quem
nunca fez o processo: siga na ordem.

Nada aqui depende de conhecer o código do jogo.

---

## Antes de começar

Você precisa de:

- **Node.js 20 ou mais novo** — confira com `node -v`;
- uma cópia do repositório;
- uma conta no itch.io.

Não é preciso instalar mais nada. O empacotador usa só o que vem com o Node.

---

## Gerar o pacote (o caminho curto)

```bash
git pull                 # 1. atualizar o código
npm install              # 2. instalar dependências
npm run package:itch     # 3. compilar e empacotar
```

Ao final você verá algo como:

```
vida-itch.zip gerado em: /caminho/do/projeto/vida-itch.zip
3 arquivos · 178.5 kB comprimido

  assets/index-XXXXXXXX.css  (40.4 kB)
  assets/index-XXXXXXXX.js   (596.3 kB)
  index.html                 (2.4 kB)

O index.html está na RAIZ do ZIP, como o itch.io exige.
```

**O arquivo `vida-itch.zip` fica na raiz do projeto.** É esse o arquivo que
você envia.

> Os nomes dos arquivos em `assets/` mudam a cada build (têm um hash no nome).
> Isso é proposital: garante que o navegador do jogador baixe a versão nova em
> vez de usar a antiga do cache.

---

## Enviar para o itch.io

1. Acesse <https://itch.io/game/new> (ou abra um projeto existente e clique em
   **Edit game**).
2. Em **Kind of project**, escolha **HTML**.
   Esse passo é o que faz o jogo rodar na página em vez de virar um download.
3. Em **Uploads**, clique em **Upload files** e escolha o `vida-itch.zip`.
4. Quando o envio terminar, marque a caixa
   **"This file will be played in the browser"** que aparece ao lado do arquivo.
5. Em **Embed options**, use:
   - **Viewport dimensions**: `960 × 640` é um bom ponto de partida.
     O VIDA é responsivo e se adapta ao tamanho que receber.
   - **Fullscreen button**: ligado — ajuda bastante no celular.
   - **Mobile friendly**: ligado (a opção costuma aparecer como
     *"Enable scrollbars"* / *"Mobile friendly"*).
6. Salve com **Save & view page** e teste.

Não é necessário configurar mais nada. O jogo não usa servidor, banco de dados
nem login.

---

## Validar ANTES de enviar (recomendado)

Duas verificações rápidas, na sua máquina:

```bash
npm run smoke:itch
```

Carrega a build recém-compilada **a partir de um subdiretório**, igual ao
itch.io, e confere: caminhos dos assets, montagem da interface, `localStorage`,
persistência do save após recarregar, e erros de console. Deve terminar com
`15/15 verificações passaram.`

E para ver com os próprios olhos:

```bash
npx vite preview
```

Abra o endereço que aparecer. Essa é a build de produção, não o modo de
desenvolvimento.

---

## Gerar uma versão nova no futuro

Exatamente o mesmo comando:

```bash
git pull
npm install
npm run package:itch
```

Depois, no itch.io, envie o novo ZIP. Você pode **apagar o upload antigo** ou
deixar os dois — se deixar, marque só o novo como jogável no navegador.

Os saves dos jogadores **não** são apagados quando você publica uma versão
nova: eles vivem no navegador de cada pessoa, não no arquivo enviado.

---

## Onde fica o save

O VIDA salva no **`localStorage` do navegador do jogador**, em duas chaves:

| chave | conteúdo |
|---|---|
| `VIDA_GAME_SAVE_V1` | a partida em andamento |
| `VIDA_GLOBAL_STATS_V1` | estatísticas acumuladas entre vidas |

O que isso significa na prática:

- o save é **por navegador e por dispositivo** — quem joga no celular e no
  computador tem duas partidas separadas;
- o jogo salva sozinho a cada mudança; não existe botão de salvar;
- fechar a aba e voltar depois mantém a vida: a tela inicial mostra
  **Continuar**;
- limpar os dados do navegador apaga a partida;
- em **aba anônima** o save dura só enquanto a aba estiver aberta;
- o save **não** vai para a nuvem e não é transferível entre aparelhos.

---

## Limitações conhecidas

- **Fontes externas.** O jogo pede duas fontes ao Google Fonts (Newsreader e
  Inter). Se elas não carregarem — rede bloqueada, modo offline — o jogo
  funciona normalmente com as fontes locais de reserva; muda só o desenho das
  letras.
- **Um arquivo JavaScript grande.** O bundle tem cerca de 600 kB (≈175 kB
  comprimido na transferência). Carrega numa tacada só. É aceitável para o
  itch.io, mas numa rede móvel ruim a primeira abertura demora alguns segundos.
  Dividir em pedaços é possível, mas não foi feito: exigiria mexer no código do
  jogo, o que está fora do escopo desta tarefa.
- **Sem suporte offline.** Não há service worker nem PWA: é preciso estar online
  para abrir a página (depois de aberta, o jogo não usa rede).
- **Save preso ao navegador.** Sem conta, sem nuvem, sem exportar/importar.
- **Armazenamento bloqueado.** Se o navegador proibir `localStorage` dentro do
  iframe do itch.io (configuração rara, mas existe), o jogo **abre e roda
  normalmente**, só não consegue salvar. Nesse caso, o botão *Fullscreen* ou
  abrir o jogo em aba própria resolve.
- **iOS com pouca memória.** Em iPhones antigos, o Safari pode descartar a aba
  em segundo plano. O save automático protege o progresso até o último ano
  jogado.

---

## Se der errado

| sintoma | causa provável | o que fazer |
|---|---|---|
| Página em branco no itch.io | o ZIP foi criado com a pasta `dist/` dentro | Gere de novo com `npm run package:itch`; o `index.html` precisa estar na raiz do ZIP |
| "Index file not found" | o projeto não está marcado como **HTML** | Mude **Kind of project** para HTML |
| Aparece um link de download | falta marcar o arquivo como jogável | Marque *"This file will be played in the browser"* |
| Jogo cortado na página | viewport pequeno demais nas embed options | Aumente as **Viewport dimensions** e ligue o botão de fullscreen |
| Progresso some a cada visita | navegador em modo anônimo ou limpando dados | Jogar em aba normal |

---

## Para quem for mexer no código

- `npm run build` — só compila, gera `dist/`.
- `npm run build:itch` — compila **e** empacota (é o mesmo que `package:itch`).
- `npm run smoke:itch` — valida a build já compilada.
- `scripts/itch/empacotar.mjs` — o empacotador, em Node puro, sem dependências.
- `scripts/itch/smoke.mjs` — o teste de distribuição.
- `vite.config.ts` — a linha `base: './'` é o que permite o jogo rodar num
  subdiretório. **Não troque para `'/'`**: com caminho absoluto o itch.io abre
  em tela branca.
- `dist/` e `vida-itch.zip` **não** são versionados: são gerados quando
  necessários.
