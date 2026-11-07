# VIDA 13 — Frente 1 · Aparência (piercings + identidade visual)

Seções do pedido: 1 (piercings), 13 (cabelos, barbas, maquiagem, acessórios, ângulos), testes de Aparência da 15.
Nada commitado (o integrador commita). Save continua v20.

## Auditoria (o que havia)
- Piercings 12.9: 22 joias, 7 furos (nariz, septo, sobrancelha, lábio, helix, tragus, umbigo), um item por furo
  (`estilo.umPorLugar`), comprados na loja e trocados num cartão por furo em "O que você está usando" — sem lupa, sem
  experimentar. Bug achado: os dois "diamantes em ouro branco" eram desenhados com metal `ouro` (amarelo).
- Identidade: 17 cortes, 9 barbas, 4 tintas, sem mechas, sem maquiagem; prévia só da figura de corpo inteiro (150 px),
  e de costas a cabeça era "curto" ou "longo" (`startsWith('longo')`).
- Modelo visual: SVG 2D de frente; a figura tem `vista` frente/costas. **Não há perfil nem 3/4** — não inventei ângulo.

## O que mudou
### Piercings (seção 1)
- `src/motor/dados/piercings13.ts` (novo, pacote motor-casa): 8 furos novos — 2º furo do lóbulo, concha, daith,
  industrial, narina direita, ponte, medusa, outro canto do lábio — e **47 joias novas** (total 69): clicker cravejado,
  flor de pedras (cluster), barra reta, espeto, pingentes/charmes (lua, estrela, coração, cascata), ouro branco,
  titânio anodizado azul e arco-íris, acabamento fosco/martelado; preços de R$ 90 a R$ 14 mil (níveis 1–5).
  `ZONAS_DE_PIERCING` agrupa os furos por zona (orelha 7 furos com o lóbulo, nariz 4, boca 3, sobrancelha, umbigo).
  5 brincos novos no lóbulo (pérola, argola grande, gota, cruz, alargador).
- `piercings129.ts`: tipos estendidos (regiões, formas, metais, `acabamento?`, `simbolo?`), catálogo soma os novos;
  correção: diamantes do nariz/tragus agora `ouro_branco`. `lojas.ts`: ouro branco → joalheria; brincos baratos → acessórios.
- Cada furo é um LUGAR → vários na mesma zona convivem sem sistema novo (o `umPorLugar`/`usar_item` de sempre).
- `ui/avatar/piercings.tsx`: desenho de cada forma/metal (cada joia do mesmo furo tem desenho diferente — testado);
  medusa escondido sob bigode; `OrelhaDePerto` (a orelha do retrato tem 5×8 unidades, metade atrás do rosto: a lupa
  da orelha desenha a orelha em detalhe — helix, anti-hélice, concha, tragus, lóbulo — com a pele da pessoa; cabelo
  que cobre a orelha aparece por cima); `BrincoNovo`.
- `ui/jogo/Piercings13.tsx` (novo, sob demanda): seção "Piercings" em Você → Aparência, logo após o estúdio de
  tatuagem. Zonas (Orelha/Nariz/Sobrancelha/Boca/Umbigo, com contagem), lupa (Figura com `foco` — a ideia da lupa das
  tatuagens, sem editar os arquivos da Frente 2 — "De perto"/"O rosto"; umbigo sem a blusa), lista por furo com as
  joias suas: tocar = experimentar só na prévia; "Usar esta"/"Trocar por esta" e "Tirar" = `usar_item` com o id da
  peça. "Prender o cabelo (só na prévia)" quando o corte cobre a orelha; chapéu sai só na lupa; avisos do bigode e da
  blusa; furos livres + link para a loja. Os cartões de piercing saíram de "O que você está usando" (sem duplicar).
- `MiniaturaDaPeca`: a vitrine prende o cabelo para todos os furos da orelha.

### Identidade visual (seção 13)
- `src/motor/dados/aparencia13.ts` (novo, motor-casa): 11 cortes (degradê, moicano, undercut, raspado de um lado,
  mullet, bob com franja reta, shag, longo com franja, meio preso, dois coques, maria-chiquinha; `restrito` antes dos 13),
  8 barbas (desenhada, lenhador, de queixo, Van Dyke, mosca, bigode fino, guidão, ferradura), 5 tintas (verde, roxo,
  cobre, mel, prata), mechas (luzes, ombré, mecha na frente; qualquer cor), maquiagem (3 delineados, 8 sombras,
  8 batons, 3 blushes). `dados/estilo.ts` só ganhou os spreads.
- Desenho: cortes em `cabelos.tsx` (`cortes13`, mesmas peças do crânio/linha da testa/textura, todas as 5 texturas);
  barbas no `Barba` do `Retrato`; `ui/avatar/identidade13.tsx` (novo): maquiagem (sombra sob o olho, delineado,
  blush, batom que segue a expressão), mechas por máscara com a forma do próprio cabelo (serve a qualquer corte),
  `CabeloDeCostas` (comprimento, volume, presos, cordões, mechas, chapéu) usado pela Figura de costas.
- Campos de save novos (opcionais, ausentes = sem): `Visual.mechas`, `mechasEstilo`, `delineado`, `sombraOlhos`,
  `batom`, `blush`. Normalizador `normalizarVida13Aparencia` (`sistemas/aparencia13.ts`, chamado em `save.interpretar`):
  remove valor inexistente, completa o jeito das mechas. Validação no fluxo de sempre (`disponibilidadeAparencia` →
  `vereditoAparencia13`; "nenhum" tira; antes dos 13 a família decide). Nada vai para os genes
  (`geneticaDe` remove mechas/maquiagem/piercings; tintas novas em `TINTAS`).
- NPCs: `variarBarba` (gerador derivado do rosto, não consome o RNG principal) passa a produzir as barbas novas.
- Tela (`Aparencia.tsx`): prévia em dois enquadramentos (rosto 132 px + corpo inteiro), "antes" ao lado enquanto há
  mudança, De frente/De costas, seletores de mechas e maquiagem (fieldset). CSS próprio `ui/aparencia13.css`.

## Testes (resultados reais)
- `src/motor/__tests__/vida13Aparencia.test.ts`: 11 testes ✓ (catálogo, variedade sem duplicata disfarçada, 6 furos
  + brinco na orelha, troca/tirar por id, 7 furos no rosto, idade/loja, saves antigos, identidade, autonomia, genes,
  normalizador). `vida129Piercings.test.ts`: 4 ✓.
- `src/ui/__tests__/vida13Aparencia.test.tsx`: 8 ✓ (cada joia no seu furo e diferente das do mesmo furo, medusa/bigode,
  criança sem piercing/maquiagem, orelha de perto, cortes e barbas distintos sem NaN, mechas/maquiagem, costas, seção:
  experimentar não age, trocar/tirar mandam `usar_item` com o id).
- Existentes: cabelos, barbas, rework6, vida127, vida129Provador, rework1241, vida129Piercings ✓ (85+ testes).
  Ajustes documentados: `barbas.test.tsx` — timeout do teste cartesiano 20 s → 90 s (dobrou com 8 barbas novas);
  rótulo da figura mantido "Como ficaria" (o teste de cabelos procura por ele).
  `fixPosPlaytestHumano.test.ts`: 2 testes estouraram 20 s com a máquina cheia (cirurgia/romance, não tocados por
  mim); ver resultado da nova rodada com timeout maior no fim deste arquivo.
- Auditorias geométricas: `playtest/cabelos.mjs` 1782 retratos, 4353 raízes, 0 problemas; `playtest/barbas.mjs`
  2960 retratos, 0 problemas (antes da correção: lenhador aos 80 em rosto longo saía do quadro → desce 16→13).

## Auditoria visual
Fotos em `/home/iego_ossi/vida-trabalho/a13/fotos/Aparencia/` (todas olhadas):
galerias `cortes-1`, `z-cortes-*`, `barbas-*`, `z-barbas`, `mechas-1`, `maquiagem-1`, `z-maq`, `piercings-1/2`,
`z-orelha`, `costas-1`; app (save `a13/qa-Aparencia/saves/vida-a13-piercings.json`, 13 furos em uso, mechas, maquiagem)
`app-aparencia-*`, `app-previa-*`, `app-piercings-{orelha,prova,nariz,boca,umbigo}-{1440,390}-{claro,escuro}.png`.
Sem rolagem horizontal em 390 (scrollWidth = 390), sem erro de página. Corrigido durante a inspeção: lupa da orelha
inútil no retrato → `OrelhaDePerto`; batom com lábio inferior gordo no sorriso; ombré invisível em cabelo curto;
cartões de furo enormes → linhas compactas; coluna da lupa larga demais.
Scripts: `scripts/playtest/galeria13Aparencia.tsx`, `scripts/playtest/olhar13Aparencia.mjs` (porta 4181).

## Pacotes (build próprio `a13/dist-Aparencia`, com as outras frentes no meio)
motor-dados 798,9 kB (limite 800; minha parte ≈ 0,8 kB: spreads em `dados/estilo`, `variarBarba` e `geneticaDe` em
`identidade`; o sistema `aparencia13` foi para pacote próprio `motor-aparencia` 1,2 kB — antes caía na base),
motor-textos 794,3, motor-casa 281,8 (catálogos novos), Jogo 629,7, Retrato 141,7, Piercings13 7,2 (sob demanda).

## Limitações honestas
- Ângulos: só frente e costas (o modelo é 2D de frente); de costas é silhueta (sem rosto, sem piercings). Perfil/3/4
  não feito.
- No retrato pequeno (≤ 64 px) as joias de cartilagem viram pontos; a leitura está na lupa.
- O chapéu de costas é uma forma genérica (cinza), não o modelo comprado.
- A lupa de nariz/boca/sobrancelha é a figura com zoom (a lupa da Frente 2 não foi reutilizada como componente: não
  editei `Tatuagens.tsx`; usei a mesma mecânica `Figura foco`).
- "Remover" = tirar e guardar (o furo continua); não há "deixar o furo fechar".
- Acessórios: só brincos novos; óculos/chapéus/colares não ganharam modelos nesta frente.

## Rodada final (depois de todas as correções)
`fixPosPlaytestHumano`, `vida13Aparencia` (motor e UI), `vida129Piercings` (UI), `cabelos`: 5 arquivos, **64/64 ✓**
(com `--testTimeout=90000`: os dois estouros anteriores do fixPosPlaytestHumano eram carga da máquina).
