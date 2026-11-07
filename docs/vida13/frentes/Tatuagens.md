# Frente 2 — Catálogo de tatuagens (VIDA 13, seção 10 + testes de tatuagens da 15)

## Números (antes → depois)
- Catálogo inteiro: **256 → 430** (desenhos soltos: 251 → 425; mais 5 peças inteiras). **+174 desenhos novos**, cada um com arte própria.
- Cultura pop: **79 → 167** desenhos. Obras: **33 → 71**.
- Por estilo, depois (antes): realista 16 (11), old school 29 (19), blackwork 21 (12), tribal 11 (7), geométrica 19 (13), oriental 16 (12),
  minimalista 22 (15), fine line 26 (18), ornamental 12 (8), abstrata 10 (6), surrealista 11 (5), conceitual 9 (4), neotradicional 11 (6),
  aquarela 10 (6), pontilhismo 5 (3), sketch 7 (5), floral 8 (7). Temas: bichos 61 (51), natureza 31 (23), **criaturas e mitos 10 (tema novo)**,
  **céu e espaço 8 (tema novo)**.

## O que mudou (arquivo: função)
- `src/motor/dados/tatuagens13.ts` (NOVO, pacote motor-casa): `DESENHOS_13` (174 desenhos); `MIDIA_DA_OBRA` e `NOME_MIDIA`, que dão o tipo de cada
  obra (videogames, livros, séries, filmes, animações). Cobre também as 33 obras da 12.9.
- `src/motor/dados/tatuagens.ts`: só um import e `...DESENHOS_13` no fim de `DESENHOS`. Nenhum conteúdo novo, porque este arquivo cai no motor-dados.
- `src/motor/dados/tatuagens129.ts` (motor-casa): `TemaDeTatuagem` ganhou `criaturas` e `cosmos`; `TEMA_DOS_ANTIGOS` põe 6 desenhos antigos nos
  temas novos. Isso só afeta o filtro.
- `src/ui/avatar/tatuagens13Base.tsx` (NOVO): cores, formas (estrela, espiral, onda, polígono, pixels) e atalhos de traço.
- `src/ui/avatar/tatuagens13Pop.tsx` (NOVO): `desenho13Pop`, com a arte das 87 peças de cultura pop.
- `src/ui/avatar/tatuagens13.tsx` (NOVO): `desenho13`, com a arte das 87 peças de estilos e temas, e o despacho para as peças pop.
- `src/ui/avatar/tatuagens.tsx`: `desenho()` só chama `desenho13` DEPOIS do switch de sempre e do `desenho129`. A arte dos desenhos antigos não muda.
- `src/ui/jogo/Tatuagens.tsx`:
  - `desenhosDoFiltro`: busca por várias palavras, e todas precisam bater. Procura em nome, descrição, estilo, **tema**, **obra** e **tipo de obra**
    (ex.: "videogames espada", "livro", "anime"). O índice da busca é calculado uma vez só (`TEXTO_DA_BUSCA`).
  - `OBRAS_POR_MIDIA`: o seletor "Obra" agrupa as obras por tipo (optgroup) e mostra quantas peças cada uma tem ("GTA (3)"). Aparece em "Todos" e em
    "Cultura pop".
  - Nota nova: "N desenhos cabem no <região>".
  - `Miniatura` agora é memorizada: com mais de 400 desenhos, o catálogo não redesenha a cada ajuste de posição ou cor. `escolherDesenho` usa só
    setters, para não ler valor velho da closure.
- `vite.config.ts`: `tatuagens13` entrou na regex do motor-casa.

## Cobertura das seções 10.1 e 10.3
- Videogames: GTA (3 peças), The Last of Us, God of War, Red Dead Redemption, Dark Souls, Elden Ring, Bloodborne, Minecraft, Resident Evil,
  Assassin's Creed, The Witcher, Cyberpunk 2077, Sonic, Tetris; mais peças novas de Zelda, Mario e Pokémon.
- Livros: Percy Jackson, Duna, Sherlock Holmes (3), O Pequeno Príncipe, Dom Quixote, Moby Dick, Alice, Drácula; mais peças de Harry Potter e
  O Senhor dos Anéis.
- Séries: Vikings (3), Friends, Dark, Round 6, Lost, La Casa de Papel; mais peças de GoT, Stranger Things e Peaky Blinders.
- Filmes: Indiana Jones, O Iluminado, Interestelar, Kill Bill, O Poderoso Chefão; mais peças de Star Wars, Matrix, Jurassic Park, Marvel, DC e
  De Volta para o Futuro.
- Animações: Death Note, Rick and Morty, Demon Slayer, Evangelion, Cavaleiros do Zodíaco; mais peças de Naruto, Dragon Ball, One Piece,
  Attack on Titan, Simpsons e Ghibli.
- Tipos de peça: objetos, armas, criaturas, cenários, símbolos e frases curtas ("Missão cumprida", "Elementar", "4 8 15 16 23 42", "9¾", "237").
- Estilos independentes (10.3): pelo menos 4 peças novas em cada estilo pedido. Fauna brasileira: capivara, lobo-guará, tatu-bola,
  mico-leão-dourado. Natureza brasileira: ipê-amarelo, vitória-régia.

## Decisão sobre "reproduzir as obras originais" (para o integrador e o usuário)
Mantive a linha da 12.9, documentada em `tatuagens129.ts`. Cada peça de cultura pop é um **desenho original do estúdio que lembra a obra**: o objeto,
a arma, o cenário, a criatura, o símbolo redesenhado ou uma palavra curta. **Não desenhei rostos de personagens, logotipos nem a arte oficial.**

Na revisão troquei 4 peças que estavam virando cópia de design oficial:
- bloco "?" → bloco de tijolo com moeda;
- flor com olhos → flor com pétalas de labareda;
- reator com triângulo → anel genérico;
- anel de runas que imitava o logotipo → anel rachado com runas.

Também tirei Hollow Knight, porque a única peça era o rosto do personagem.

Isso fica aquém do pedido em 10.2, que aceita reproduzir personagens e emblemas. O reconhecimento vem do contexto (obra no nome e no filtro, mais o
objeto característico), não da cópia. Fica para o integrador ou o usuário decidir.

## Auditoria visual (Playwright, imagens olhadas)
- **Galeria dos 174:** pele clara colorida (150 px), pele escura só em preto (72 px), miniatura do estúdio (44 px) e 24 px.
  - Arquivos: `a13/fotos/tatuagens/galeria-{0,24,48,72,96,120,144}.png`.
  - Correções: `correcoes-{1,2,3}.png`.
  - Refiz 22 desenhos que não liam bem: lâmina oculta, braço cibernético, triquetra, colher, marionete, espiral áurea, pingente de lua, pegada,
    rosa negra, fio vermelho, katana, kraken, galáxia e outros.
  - "Mãos dadas" estava ilegível e virou "Rei de xadrez".
  - "Triângulo impossível" não ficou um triângulo de Penrose de verdade. Renomeei para "Triângulo de três barras", que é o que aparece no desenho.
- **Na pele** (Figura de frente e de costas, lupa por região): `na-pele.png`. Pulso e mão legíveis em tamanho pequeno.
- **No jogo** (build próprio, preview na porta 4182, save qa129 jovem), claro e escuro, 1440 e 390 px:
  - Arquivos: `estudio-{claro,escuro}-{1440,390}.png` e `estudio-duna-*.png`.
  - Resultado: 425 miniaturas; seletor de obra com 5 grupos (Videogames 17 obras, Livros 13, Séries 13, Filmes 13, Animações 15).
  - A busca "criaturas dragao" acha 3 desenhos.
  - Sem erro de console e sem rolagem horizontal em 390 px.
- Bug achado nessa conferência: um caminho SVG (`d`) com "}" sobrando no crânio de cervo. Foi corrigido, e o teste agora barra esse tipo de erro.

## Testes (resultados reais)
- `src/motor/__tests__/vida13Tatuagens.test.ts` (NOVO, 7 testes), que confere:
  - ids e nomes únicos no catálogo todo;
  - catálogo antigo intacto e na mesma ordem;
  - arte própria e válida em cada desenho novo (sem NaN, undefined ou "}" nos caminhos);
  - **as 425 artes são todas diferentes entre si, também quando renderizadas só em preto** (a mesma forma com outra cor não conta);
  - cada tamanho oferecido cabe em alguma região; o tamanho pequeno cabe numa região pequena; toda região simples tem pelo menos um desenho novo;
  - as obras de 10.1 estão presentes, e há pelo menos 4 peças por estilo;
  - filtros por estilo, tema e obra, busca com várias palavras e as contagens do seletor;
  - tatuar 5 desenhos novos (pulso, costas, panturrilha, faixa, rotação) e reler o save;
  - save antigo (desenhos de sempre e da 12.9) idêntico depois de `interpretar` e `normalizarTatuagens`.
- `vida129Tatuagens.test.ts`: ajustado, com comentário no arquivo. A lista de "antigos" agora exclui os desenhos da 13, e o filtro "Cultura pop"
  conta o catálogo todo.
- Rodados:
  - vida13Tatuagens + vida129Tatuagens: **14/14**.
  - vida126Tatuagens + hotfix1151Vida + ui/hotfix1151 + ui/vida126: **31/32** na primeira rodada. Falhou "a cobertura", do vida126.
  - Rodei o vida126Tatuagens de novo, sozinho: **11/11**. Não consegui reproduzir. `acoes.ts` estava sendo editado por outra frente nessa hora,
    mas não confirmei que essa foi a causa.
- `tsc --noEmit -p .`: nenhum erro nos meus arquivos.

## Pacotes (build próprio em `a13/dist-tatuagens`)
- tatuagens (lazy): **162 → 274,6 kB**.
- motor-casa: 171 → 281,7 kB. O catálogo novo é cerca de 35 kB; o resto vem de outras frentes.
- **motor-dados: 799,0 kB.** Conferi que nenhum desenho novo está nele: o único acréscimo meu é o import e o spread em `tatuagens.ts`. O aumento vem
  de outras frentes, e o pacote está a 1 kB do limite.
- Outros: motor-textos 794,3, motor-carreira 747,8, motor 741,7, Jogo 629,4 kB.

## Saves
Nenhum campo novo e nenhum normalizador. O save guarda só o id do desenho; os ids antigos e a arte deles não mudaram.

## Limitações honestas
- Cultura pop sem personagens nem logotipos (ver a decisão acima). Algumas peças dependem do nome ou do filtro para serem reconhecidas
  (ex.: "Copo tremendo", "Colher torta").
- Os minimalistas ficam simples no tamanho grande, como esperado do estilo. O kraken e a estátua grega ficaram corretos, não excelentes.
- Não criei modelos novos de composição (manga, costas) com os desenhos da 13.
- Scripts: `scripts/playtest/galeria13Tatuagens.tsx`, `scripts/playtest/pele13Tatuagens.tsx`, `scripts/playtest/olharTat13.mjs`,
  `scripts/playtest/fotoGaleria13.mjs`.
