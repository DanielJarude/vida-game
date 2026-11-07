# Frente Tatuagens — VIDA 12.9

## Resumo
O estúdio passa de 88 desenhos (83 soltos + 5 peças inteiras — a contagem real; o "98" da auditoria estava inflado) para
**256**: **168 desenhos novos**, cada um com arte SVG própria (nenhum renomeado, nenhum par com o mesmo SVG — testado).

| Grupo | Novos | Observação |
|---|---|---|
| Cultura pop (estilo `cultura_pop`, campo `referencia`) | 79 | 33 obras: Pokémon, Naruto, Dragon Ball, One Piece, Studio Ghibli, Breaking Bad, Game of Thrones, Stranger Things, The Walking Dead, Peaky Blinders, Star Wars, Harry Potter, O Senhor dos Anéis, Matrix, Jurassic Park, Marvel, DC, Jogos Vorazes, Piratas do Caribe, The Office, Zelda, Super Mario, Sailor Moon, Attack on Titan, Os Simpsons, Doctor Who, De Volta para o Futuro, Avatar (Aang), A Bela e a Fera, O Mágico de Oz, O Rei Leão, Tubarão, Guia do Mochileiro |
| Bichos (`tema: 'animais'`) | 36 | domésticos (cão, gato, coelho, cavalo), selvagens (urso, elefante, cervo, onça, preguiça, girafa), raposas (2), lobo, aves (coruja, tucano, arara, flamingo, garça), répteis (camaleão, tartaruga, lagartixa), mar (polvo, baleia, tubarão, água-viva, cavalo-marinho, arraia), insetos/aracnídeos (abelha, mariposa, escorpião, escaravelho, libélula, joaninha, louva-a-deus), baleia nas nuvens |
| Natureza (`tema: 'natureza'`) | 12 | cogumelos, paisagem no círculo, cacto, ilha, costela-de-adão, samambaia, terrário, lua sobre o mar, cachoeira, ginkgo, pinheiros, vulcão |
| Autorais | 41 | geométrico, abstrato, minimalista, ornamental, surrealista, conceitual, blackwork, old school, oriental, fine line, tribal, realista, neotradicional, pontilhismo, sketch, aquarela |

Cultura pop = desenhos ORIGINAIS que lembram a obra (objeto, bicho, emblema reinterpretado, frase curta): chapéu de palha,
raio + óculos redondos, tordo com flecha, anel com inscrição, cartaz de PROCURADO com um chapéu no lugar do rosto,
"CORRA" sob luzes de Natal etc. Nenhum logotipo copiado; os que ficam mais perto do objeto icônico (esfera de captura,
escudo com estrela, capacete sombrio, droide de cúpula) são redesenhados no traço chapado do jogo, com riscos e detalhes
próprios. Nomes descritivos em pt-BR (sem marca no nome); a obra aparece no estúdio como "inspirado em X".

## O que mudou (arquivo:função)
- `src/motor/dados/tatuagens129.ts` (NOVO, puro, só `import type`): `DESENHOS_129`, `NOME_ESTILO_129` (7 estilos
  novos: cultura_pop, neotradicional, surrealista, conceitual, pontilhismo, sketch, aquarela), `NOME_TEMA`,
  `TEMA_DOS_ANTIGOS` (26 desenhos antigos ganham tema sem mexer no catálogo), `temaDoDesenho`, `REFERENCIAS_129`.
  O tamanho padrão é derivado (meio da lista de tamanhos).
- `src/motor/dados/tatuagens.ts` (motor-dados, ~0,2 kB): o tipo `EstiloDeTatuagem` aceita os novos; `NOME_ESTILO`
  espalha `NOME_ESTILO_129` (antes de "Peças inteiras"); `DesenhoDeTatuagem` ganha `referencia?` e `tema?`;
  `DESENHOS` espalha `...DESENHOS_129` numa linha.
- `vite.config.ts`: `tatuagens129` na regex do pacote `motor-casa` (uma palavra, via Edit).
- `src/ui/avatar/tatuagens129.tsx` (NOVO): `desenho129(id, pincel)` → arte ou `undefined`; helpers de estrela, espiral,
  felpa, ondas, mancha de aquarela, rascunho (sketch), pontilhismo com teste ponto-no-polígono. Caixa nativa 20,
  contorno sempre em `tinta` (legível em preto/cinza), cores via `cor()` (paletas e tons funcionam como antes).
- `src/ui/avatar/tatuagens.tsx:desenho`: antes do círculo de reserva, chama `desenho129` (3 linhas).
- `src/ui/jogo/Tatuagens.tsx`: `desenhosDoFiltro` (exportado; estilo + tema + obra + busca sem acento em nome,
  descrição, estilo e obra); filtros "Tema" e "Buscar" sempre, "Obra" quando o estilo é Cultura pop; aviso "Nenhum
  desenho com esse filtro"; a nota do desenho mostra "(inspirado em X)"; o `title` da miniatura também.
- `src/ui/personalizar.css`: `.estudio-tatuagem__filtros` (grade auto-fit 140 px; 390 px sem rolagem lateral — foto).
- `src/motor/sistemas/tatuagens.ts` (COBREM): neotradicional e surrealista cobrem tatuagem antiga (2 strings).
- Scripts: `scripts/playtest/galeria129Tatuagens.tsx` (galeria em 3 tamanhos + 24 px; filtros FILTRO/IDS/DE/ATE),
  `scripts/playtest/estudio129Tatuagens.tsx` (estúdio estático), `scripts/playtest/foto390.mjs` (foto 390 px, opcional
  por seletor).

Preservado: regiões, tamanhos (a geometria decide onde cabe), posição, rotação, escala, espelhamento, cor/paleta/tom,
retoque, laser, cobertura, composições, histórico. Save: guarda só o id; **nenhum campo novo, nenhum normalizador**.

## Revisão visual (Playwright + Read)
Galeria completa: `/home/iego_ossi/vida-trabalho/a129/tat/galeria129-todas.html` (+ `.png`); cada desenho ampliado
(150 px, pele clara, na cor padrão), médio (72 px, pele escura, só preto), miniatura do estúdio (44 px) e 24 px.
Olhei todas as páginas e refiz o que estava feio/ilegível: brasão do lobo (virava borrão), asas da coruja (pareciam de
morcego), chuva de código (apagada), morcego na lua (perto demais do logotipo → morcego inclinado, lua deslocada),
gigante no muro (rosto pequeno), toalha 42 (texto cortado), rastro de fogo (parecia pão), garça (2 refações), cavalo
(cabeça), cavalo-marinho (pontilhismo agora preenche a silhueta), costela-de-adão (os furos viravam "olhos"), cubos
(face de cima invertida), "mão que desenha" (substituída por "Lápis que desenha"), manchas de aquarela (suavizadas).
Estúdio a 390 px: `/home/iego_ossi/vida-trabalho/a129/tat/estudio-desenho.png` (scrollWidth 390).

## Testes (resultados reais)
- `src/motor/__tests__/vida129Tatuagens.test.ts` — **7/7**: ≥120 novos, 88 antigos intactos, ids e nomes únicos no
  catálogo inteiro; todo novo tem arte (`desenho129` ≠ undefined e ≠ círculo de reserva) e os antigos também; os 168
  SVGs são todos diferentes; estilo/tamanhos/regiões válidos (todo tamanho oferecido cabe em alguma região);
  cultura pop sempre com obra (as 20 obras pedidas presentes); filtros (estilo, obra, busca sem acento, tema incluindo
  antigos); tatuar desenhos novos com ajuste/cor/tom e reler o save; cobertura neotradicional aceita, fine line não;
  save antigo com tatuagens antigas idêntico após `interpretar` + `normalizarTatuagens`, id desconhecido não quebra.
- Existentes: `vida126Tatuagens` + `hotfix1151Vida` (passaram, 25 testes junto com o novo), UI `hotfix1151`,
  `vida125`, `vida126`, `rework96` — **33/33**.
- `tsc --noEmit`: nenhum erro nos arquivos desta frente.

## Pacotes (build próprio: `/home/iego_ossi/vida-trabalho/a129/dist-tatuagens`, com as outras frentes no diretório)
- Metadados → `motor-casa` 174,6 kB. Arte → pacote lazy `tatuagens` 166,3 kB (gzip 44,7), carregado só por Figura/
  estúdio/retrospectiva (Jogo só o lista no mapa de preload). Tatuagens (estúdio) 22,0 kB.
- motor-dados 797,98 kB e motor 799,73 kB no build conjunto (outras frentes em andamento): a contribuição desta frente
  é ~0,2 kB e ~40 bytes respectivamente — mas os dois estão a <2,1 kB do limite: o integrador precisa olhar.

## Limitações honestas
- Os desenhos são flash simplificado no traço do jogo (SVG chapado), não ilustração detalhada; alguns sketches
  (louva-a-deus, lápis) e o lobo do brasão são legíveis mas modestos.
- As cores de obras icônicas (esfera vermelha/branca, escudo de anéis) remetem à obra por natureza do objeto; não há
  logotipos/arte oficial, mas a revisão jurídica fina fica para o integrador.
- Nenhuma composição pronta (manga/costas) nova usa os desenhos novos; os NPCs não sorteiam tatuagens novas (não há
  sorteio de catálogo no motor — nada de RNG mudou).
- Foto do estúdio é render estático (sem o filtro "Obra" aberto, que só aparece com Cultura pop selecionado).
