# VIDA 13 · FRENTE 3 — Móveis: representação espacial com volume

Estado: **feito** (sistema geral de volume + orientação + oclusão), com limitações listadas no fim.

## Decisão: 3D de verdade × volume ilustrado
- 3D real (WebGL/three.js + malhas) foi descartado: centenas de kB num pacote já perto do limite, outra linguagem visual
  (iluminação/sombreamento de malha, não o traço chapado do VIDA), custo em celular simples e todos os ~90 desenhos de
  móveis teriam de virar modelos.
- Escolhido: **2.5D geométrico calculado** sobre a perspectiva que a cena já tinha (um ponto de fuga, metros reais).
  Cada móvel vira um conjunto de BLOCOS (paralelepípedos em metros) tirados do próprio desenho + profundidade de catálogo
  (`medidas.ts`). A cena projeta os blocos e pinta só as faces que a câmera vê (lateral do lado do meio do cômodo, tampo
  abaixo do olho, ponta do móvel girado), com um tom de sombra por face — mesma linguagem chapada, sem fotorrealismo.

## O que mudou (arquivo:função)
- **NOVO `src/ui/ilustracao/volumes13.ts`** (puro, testável):
  - `VOLUMES` — blocos de 40 móveis/fixos (penteadeira: espelho recuado com as lâmpadas, tampo, corpo das gavetas,
    pernas da frente E de trás, banqueta à frente; cômoda, aparador, escrivaninha, mesa executiva, mesa de jantar,
    ilha, armários planejados (aéreos rasos recuados + revestimento + despensa + bancada), geladeiras, fogões, adega,
    lareira, piano, gabinete, bancada de mármore (espelho na parede), bancada de ferramentas (painel na parede),
    organizadores (prateleiras + montantes), fixos `_bancada`, `_fogao`, `_pia`, `_vaso`, `_churrasqueira`…). Todo
    móvel `gira` sem spec ganha um bloco (a caixa do desenho).
  - `referencial` — o eixo do desenho no mundo para de frente / girado esq / girado dir. **Bug corrigido**: o móvel
    girado saía ESPELHADO (a esquerda do desenho ia para o fundo na parede esquerda e para perto na direita); agora a
    largura corre na direção certa (teste: esquerda do desenho fica à esquerda na tela).
  - `passosDoMovel` — faces visíveis por teste de normal × câmera (`camera(g)`), ordem do mais longe ao mais perto; o que
    fica à frente (banqueta, cadeira) depois da frente desenhada.
  - `fatias` — no girado o plano da frente foge para o fundo (perspectiva não afim): o desenho vai em fatias verticais
    afins (erro < ~0,5 px, adaptado à largura de tela; 1 fatia de frente; até 72 no girado perto da câmera).
  - `partesDoDesenho` — peças por plano (índices das peças): o espelho vai para o fundo do móvel, os aéreos para a
    parede, o vaso/porta-retrato para o meio do tampo; a cadeira desenhada na escrivaninha sai quando o cômodo já tem a
    `cadeira_ergonomica` (antes apareciam duas).
  - `projetar` sem limitar z (antes o armário que seguia além de `Dv` achatava).
  - `ALTURA_PELO_TAMPO` — a bancada fixa da cozinha media a altura pela largura: em cozinha estreita o tampo ficava a
    ~0,56 m; agora a 0,92 m (o micro-ondas em cima dela deixou de flutuar na altura dos aéreos).
- **`comodos.tsx`**: `Girado` (cartão chapado + lateral cinza) substituído por `Volume` (sombra do tamanho real no chão,
  faces, planos, frente em fatias); móvel de frente com volume desenhado no plano da frente real (z1); objeto em cima
  de tampo de móvel com volume fica no meio do tampo; ids de `<use>/<clipPath>` com assinatura da cena (duas cenas
  renderizadas à parte não se confundem); removido `corPrincipal` (agora `corDoCorpo`: a massa de maior área).
- **`disposicao.ts`**: `custoDeOclusao` + modo coletor — sem lugar que não tape nada (o modo sem rigor), em vez do
  PRIMEIRO lugar que cabe, fica o que menos esconde (fração da figura do de trás coberta, em perspectiva). Ex.: banheiro
  10 m² — a banheira escondia o vaso inteiro; agora vai para frente do box. Quarto 12 m² — a penteadeira escondia a
  mesa de cabeceira direita; agora vai mais à frente na lateral e as duas aparecem.
- Ferramentas: `scripts/playtest/galeria13Moveis.tsx` (29 cenas: as 20 da 12.9 + quarto 6/9 m², banheiros 4/10 m²,
  lavabo, escritório 20 m², cozinha 6 m², sala 10 m², garagem), `fotos13Moveis.mjs`, `zoom13Moveis.mjs`,
  `olhar13Moveis.mjs` (jogo real, sem o aviso de novidades), `tempo13Moveis.mjs`.

## Campos de save
Nenhum (só renderização e disposição; nada no motor).

## Testes (reais)
- NOVO `src/ui/__tests__/vida13Moveis.test.ts`: 9 testes — blocos dentro do desenho/peças válidas; todo girado tem volume;
  girado com ponta visível, frente na borda que dá para o meio, sem espelhar, volume dentro do cômodo (>15 girados nas
  29 cenas); penteadeira (≥3 tampos, ≥5 pontas, espelho recuado fora da frente, pernas frente+trás); de frente: tampo só
  abaixo do olho e lateral só do lado do meio; fatias contínuas e crescendo para perto; cadeira dupla; banheira × vaso;
  29 cenas sem sobreposição de móveis grandes, tudo dentro do cômodo, ≤6 de fora.
- `vida13Moveis + vida129Comodos + vida128Cena + vida1281 + casas.test.tsx`: **5 arquivos, 34/34 passaram**.
- tsc: sem erros nos meus arquivos (ver resposta).

## Auditoria visual (OLHADA)
- Antes: `/home/iego_ossi/vida-trabalho/a13/fotos/moveis/antes-c0..c28.png`; depois: `v9-c0..c28.png` (mesmas cenas).
  Pares-chave: c2/c3/c20/c21 (quartos — penteadeira com tampo, gavetas, pernas, espelho atrás, banqueta), c12/c13/c26
  (cozinhas — ilha com tampo, aéreos recuados, bancada na altura certa), c9/c10 (salas grandes), c16/c25 (escritórios),
  c22/c23/c24 (banheiros/lavabo — vaso volta a aparecer), c28 (garagem). Zoom: `zoom-pent2.png`.
- Jogo real (build limpo HEAD + só a frente, preview 4183, save qa128 r128-mansao, claro/escuro × 1440/390, DPR 2):
  `fotos/moveis/jogo/{suite,cozinha,banho,sala}-{claro,escuro}-{1440,390}.png` — sem erro de página, sem rolagem lateral.

## Desempenho e pacote
- Build limpo (HEAD + só esta frente) × HEAD: só o chunk lazy **Personalizar 83,4 → 93,4 kB**; nenhum outro muda
  (motor, motor-dados, motor-textos intactos).
- Pintura: galeria de 29 cenas a 760 px: ~4,0–6,3 s antes × ~6,9–10,8 s depois (máquina compartilhada, ruidoso) — custo
  real das fatias (`<use>` repetido no girado). No jogo a cena aberta tem 320 px e as miniaturas 132 px: as fatias se
  adaptam à largura (menos fatias em tela pequena). A disposição continua memorizada por cômodo.

## Limitações honestas
- Camas, sofás, poltronas, banheiras, mesas de jogo, aparelhos de academia continuam desenho único de frente/perfil (os
  desenhos deles já trazem a própria pseudo-perspectiva; caixa em cima ficaria errada). A mesa de cabeceira (par) não
  ganhou volume.
- As faces laterais/tampos são lisas (cor do material + sombra), sem gaveta/porta desenhada na lateral.
- Desenhos com tampo já desenhado em trapézio (fogão, freezer, cooktop, mesa executiva) mantêm o trapézio por cima do
  tampo 3D — coerente, mas não refeito.
- Costura das fatias: em zoom 3× aparece serrilhado leve na borda de baixo do móvel girado muito perto da câmera.
- Objetos pequenos em cima de móvel GIRADO seguem a lógica antiga (não refeita).
- Não rodei a suíte inteira nem o smoke do itch (não mexi em imports entre pacotes; comodos já estava no Personalizar).
