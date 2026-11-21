# VIDA 31 — Rework geral (visual, navegação, clube, copas)

Branch `claude/rework-visual-geral` (a partir de `141ed2b`, a VIDA 30 publicada). Publicado com autorização do dono do
projeto depois de revisão local (http://localhost:4173) em quatro rodadas.

## O que mudou
- **Visual de app moderno** (`src/ui/visual31.css`, carregada por último; paletas Memória Clara/Escura em `tokens.css`):
  fundo claro, cartões, cores por área, letra sem serifa, moldura branca (tema, PWA e `index.html`). Contraste: 348 pares OK.
- **Navegação**: Hoje (antiga História: retrato, barras da vida, o que pede você, o ano que passou) · Eu · Pessoas ·
  Caminhos · Minha Semana (com as abas de sempre) · Vida. A coluna lateral "Agora" saiu (mora no Hoje).
- **Páginas iniciais** no molde da Minha Trajetória: Caminhos (`v31/Trajetoria31`), Vida, Pessoas e Eu
  (`v31/Inicio31`, `v31/InicioDasAreas31`), mantendo as cenas vivas (a rua, a constelação, a agenda, a fita, o celular).
- **Nenhuma ação como texto solto** (varredura `scripts`-like em `~/vida-trabalho/rvq/textosolto.mjs`).
- **Namoro**: 4 fotos por perfil (rosto, corpo inteiro, um lugar dos interesses, sorrindo) — `v31/namoro/FotosDoPerfil31`.
- **Futebol**: Mundial de Clubes / Copa Intercontinental (`competicoes.mundialDeClubes`) para o campeão continental,
  jogador e técnico; técnico com Copa do Brasil e copa continental (`tecnico.copasInternacionais`).
- **Dono de clube**: jogadores com posição fina, atributos e os arquétipos do atleta (`v20/clubes/perfil31`), química
  do elenco na força, filtros por setor/arquétipo, aba Comando e negócios (técnico, capitão, empréstimo, ingressos,
  patrocínio master). Campos novos opcionais em `Clube20` (`*31`) e `TemporadaDeTecnico` (`continental`, `mundial`).
- Processos na Justiça movidos de Trabalho para Vida · Dinheiro. Notas da atualização: versão 31.

## Testes
- UI: 660/660. Suíte completa: 3.324 passaram; 4 limites de tempo antigos do motor (fechamentoMundo #4, agência,
  política, profissão) — os mesmos da VIDA 30. Testes novos: `vida31Copas.test.ts`, `vida31Clube.test.ts`; 34 testes de
  interface ajustados à navegação nova (comentados "VIDA 31").
- Build com tsc OK; maior pacote 794 kB (< 800); smoke de produção 36/36.

## Deploy
- `main` e `claude/fix-pos-rework3-playtest` (produção do Cloudflare Pages) avançados por fast-forward até `ba58119`.
- https://vida-game.pages.dev/ serve `assets/index-i5xHNS04.js`; a raiz e os 203 arquivos JS/CSS com sha256 idêntico
  ao build local.
- Navegação no site real (computador e celular, duas passadas): nascer, as seis áreas e abas, Caminhos, menu, celular e
  três anos vividos com saves da VIDA 30 (adulta, dona de clube, base) — nenhum erro de página.
