# REWORK 8 — IDENTIDADE DAS ILUSTRAÇÕES E MATERIALIDADE DO MUNDO · FASE A (propostas)

Branch `claude/fix-pos-rework3-playtest`, sobre `c1465e5` (REWORK 7.5 concluído, validado e enviado; HEAD conferido
igual ao `origin` antes de começar). **Esta é só a Fase A**: diagnóstico, três direções comparáveis, a aplicação nas
telas reais, custos e riscos — e a correção isolada do bug dos presentes. **Nenhuma direção foi escolhida e o catálogo
não foi redesenhado**: a Fase B espera a escolha do usuário.

> Nada do protótipo entra no jogo: as três direções vivem em `scripts/playtest/rework8/` (fora do bundle). O jogo só
> mudou na correção dos presentes (§6).

---

## 1. Diagnóstico — o que existe hoje (galeria real, `scripts/playtest/rework8/galeriaAtual.tsx`)

Tudo o que o jogo desenha, renderizado pelos componentes de verdade, nos tamanhos em que aparece, claro e escuro
(`docs/rework8/01-diagnostico-veiculos.jpg`, `02-diagnostico-objetos-animais.jpg`).

### Como cada família é feita hoje
| Família | Arquivo | Como é feita | Problema estrutural |
|---|---|---|---|
| Carros | `material/Desenhos.tsx` (`CARROCERIAS`) | 8 perfis paramétricos (a ideia certa), com ±1 px de variação por semente | **um perfil por CLASSE, não por modelo**: os 37 modelos do catálogo caem em 8 desenhos (Mobi = Kwid = C3; Mustang = 911; Onix Plus = Corolla = BMW 320i = Mercedes C 300) |
| Motos e bicicletas | idem (`MOTOS`, bicicletas) | um desenho fixo por forma | peças soltas (o escudo da motoneta, a scooter sem traseira); as 4 bicicletas são o mesmo quadro com pneus pretos cheios |
| Barcos e aviões | idem | barcos em traço sem cor; aviões cheios | duas linguagens na mesma família |
| Objetos | `material/Objetos.tsx` | um desenho por "forma"; 37 coisas → 26 formas | **4 eletrodomésticos = 1 desenho** (máquina de lavar, lava-louças, aspirador robô, ar-condicionado — e o desenho parece uma caixa de som); **3 celulares iguais**; 2 "livros"; o que não tem forma cai em "jogos de tabuleiro" |
| Animais | `avatar/caesEGatos.tsx` + `Retrato` | cães (9 famílias) e gatos (5 tipos) por morfologia + 13 outras espécies | os pequenos estão bons; cães e gatos ficam **pequenos dentro do quadro** do retrato (muito fundo), os gatos repetem a mesma pose sentada |
| Casas | `MiniaturaDaCasa` | traço fino coral | outra linguagem (linha) ao lado dos veículos (massa); some a 28 px |
| Lugares | `Icone` (traço 24×24) | **ícones de biblioteca**: uma linha só para tudo | "usados" é uma sineta de hotel; "instrumentos" parece uma chave; "abrigo" é uma carinha; "esportes" é um globo; banco, clínica e loja são o mesmo traço |

### Matriz de diagnóstico (prioridade: 1 = primeiro)
| Problema | Onde | Visível em | Prioridade |
|---|---|---|---|
| Desenhos quase idênticos | 37 carros → 8 perfis; 4 eletrodomésticos → 1; 3 celulares → 1; 4 bicicletas ≈ 1 | Compras, Pertences, Casa | **1** |
| Silhueta que não representa o objeto | motoneta e scooter desmontadas; o eletrodoméstico que parece caixa de som; a raquete que parece lupa; a guitarra-bolha | lojas, pertences | **1** |
| Lugares como ícones genéricos | as 15 vitrines com ícone de traço | Compras (o primeiro contato com o mundo material) | **1** |
| Diferença só de cor | carros da mesma classe; os 3 celulares | anúncios | 2 |
| Ilegível pequeno | motos a 72 px; casas a 28 px; contorno grosso que engole o desenho | vitrines, Linha da Vida, celular | 2 |
| Objeto claro/escuro que some no fundo | carro branco "quebrado" em vidros pretos; lancha branca invisível no papel; bicicleta preta no escuro | todas as paletas | 2 |
| Proporção/anatomia | cães pequenos no quadro; gato sempre sentado; patas em bloco | Pessoas, abrigo | 3 |
| Linguagens desconectadas | casas em traço × veículos em massa × lugares em ícone × retratos em massa com pele | toda a área Vida | 3 |

## 2. As três direções (`scripts/playtest/rework8/propostas.tsx`)

As mesmas dez amostras pedidas — carro popular compacto, carro esportivo, picape, bicicleta urbana, motocicleta,
cachorro, gato, violão, casa, fachada de concessionária —, **a mesma geometria**, três renderizadores. Cada amostra
em três tamanhos (miniatura 32 px · identificação 88 px · destaque 220 px), sobre o papel e a moldura reais das
**quatro paletas** do REWORK 7.5 (`docs/rework8/03` a `06`), e de perto (`07-destaque-de-perto.jpg`).

| | **A · Catálogo editorial** | **B · Miniaturas de mundo** | **C · Ilustração narrativa** |
|---|---|---|---|
| Ideia | o guia ilustrado: cor material chapada, contorno fino e controlado, o detalhe que distingue | o objeto em miniatura: luz de cima, borda de baixo mais escura, sombra no chão, sem contorno | o desenho à mão: nanquim levemente irregular em duas passadas, aguada que escapa do traço, hachura no lado da sombra |
| Vidro | escuro, chapado | gradiente de céu com reflexo | lavado com hachura |
| Pequeno (32 px) | **o mais legível** (o contorno segura a forma) | bom (a forma macia vira mancha nos menores) | o mais fraco (a hachura vira ruído) |
| Grande (220 px) | limpo, editorial | o mais "objeto" | o mais pessoal |
| Com a interface | **a mesma família tipográfica da UI** (fios finos, papel) | um pouco mais "app" | mais livro do que app |
| Nas 4 paletas | estável (o contorno é do objeto) | o brilho some um pouco no escuro | o traço sépia some um pouco no Atlântico |
| Markup médio por desenho a 88 px | **≈ 3,6 KB** | ≈ 8,8 KB (gradientes por cor) | ≈ 9,7 KB (dupla passada, máscara, hachura) |

Nenhuma direção copia outro jogo: são três modos de pintar as mesmas peças.

### A arquitetura que a Fase B usaria (já demonstrada no protótipo)
1. **Famílias de forma com parâmetros** — um carro é um perfil: comprimento, altura, entre-eixos, vão livre, linha de
   cintura, teto, capô, traseira (hatch, três volumes, fastback, caçamba, caixa), colunas, rodas, e os detalhes da
   família (o farol redondo no para-lama, o ombro traseiro, o rack, o estribo, o pneu de trilha). O protótipo tira
   **nove carros** do mesmo gerador — e o "esportivo" vira um **911** (bolha que desce até o para-choque, farol no
   para-lama) ou um **Mustang** (capô longo, traseira curta) só mudando números. A Fase B daria a cada MODELO os seus
   números (`VersaoVeiculo` ganha um perfil opcional; quem não tiver usa o da classe).
2. **Peças semânticas** (`massa`, `vidro`, `metal`, `pneu`, `luz`, `linha`, `texto`, `grupo`) — a amostra diz o que é
   cada parte; o renderizador da direção decide traço, luz e textura. Um membro (`membro()`) é uma linha do meio com a
   largura de cada ponto: perna com coxa, jarrete e pata; cauda que sai grossa do quadril — anatomia contínua.
3. **Cor = dado do objeto** (a do anúncio, a da pelagem, a madeira do violão), nunca da paleta: um carro vermelho é
   vermelho nas quatro. Objeto quase preto ganha um fio claro (não some no Atlântico).
4. **Nada no save**: o desenho sai da família + a semente que o jogo já guarda (`versaoId`, a cor, a semente do
   bicho). Identidade estável ao recarregar, ao vender, ao mudar de país.
5. **Três níveis** (pedido §7): o nível 1 (navegação: a barra, as abas, a agenda) continua em **símbolos de traço** (os
   emblemas do REWORK 7) — não se encolhe uma ilustração até 16 px; o nível 2 (identificação, 64–96 px: vitrines,
   anúncios, pertences, a ficha da prática) e o nível 3 (destaque, 200+ px: o detalhe do anúncio, a ficha do bicho) são
   o mesmo desenho, com o detalhe que o tamanho comporta (a direção decide: em A, as linhas de porta somem abaixo de
   48 px).

## 3. Aplicadas nas telas reais (`scripts/playtest/rework8/telas8.mjs`)

As três direções **injetadas no jogo de verdade** (o build, os tokens, as quatro paletas, 1440 e 390 px): a página de
Compras — a concessionária vira a **fachada** com os carros no salão; os usados, os carros do anúncio na cor do
anúncio; motos e bicicletas; o abrigo, o cachorro e o gato; a imobiliária, a casa — e a folha da concessionária, cada
anúncio com o carro da família dele na cor dele (`docs/rework8/08` a `11`; 64 capturas em `telas8/`).

O que a aplicação mostrou:
- A vitrine de hoje reserva 34% da largura para cada um de três objetos (`.vitrine__objetos > *`): uma fachada
  sozinha precisa do espaço dela — a Fase B ajusta essa regra (a demonstração faz isso só na captura).
- A cor do anúncio carrega a identidade sem pedir ajuda à paleta; nas paletas escuras, o fio claro dos objetos escuros
  é necessário nas três direções (já está no protótipo).
- Kwid, Mobi e C3 ainda saem iguais (a mesma família "compacto") — por isso a Fase B dá números a cada modelo.

## 4. Custos de implementação (estimativa para a Fase B)

| Etapa | A | B | C |
|---|---|---|---|
| Renderizador e peças | 1 | 1,5 | 2 |
| Carros por modelo (37 perfis numéricos) | 1 | 1 | 1 |
| Motos (6 formas) e bicicletas (4) redesenhadas | 1,5 | 1,5 | 2 |
| Objetos (37, com as 11 formas que faltam) | 2 | 2,5 | 3 |
| Animais (cão e gato com membros e poses; ajuste do quadro) | 1,5 | 1,5 | 2 |
| Lugares (15 fachadas/ambientes) | 2 | 2,5 | 3 |
| Casas (11 formas, mesma linguagem) | 1 | 1,5 | 1,5 |
| Auditoria visual (quatro paletas, tamanhos) | 1 | 1,5 | 1,5 |
| **Total (unidades relativas)** | **11** | **13,5** | **16** |

Bundle: o protótipo inteiro (dez amostras, nove perfis, três renderizadores) tem 41 KB de fonte TS; um renderizador
só, com as famílias completas, deve ficar entre 25 e 45 KB minificado no pacote `Jogo` (hoje 441 kB) — longe do
limite de 800 kB. O pacote `motor` (764,6 kB) **não** muda: desenho é tela. Desempenho: B e C pesam 2,4–2,7× o markup
de A; nas vitrines (até 15 lugares × 3 objetos) e na Linha da Vida isso conta (o retrato custa ~1,4 ms; uma
ilustração B/C deve custar parecido) — A é a mais barata.

## 5. Riscos e limitações
- **Reconhecimento de marca**: os perfis evocam categorias e modelos ("o perfil de um 911") sem logotipo, grade ou
  desenho registrado; nomes de modelo continuam só no texto do anúncio, como hoje.
- **Escopo**: redesenhar tudo de uma vez é o maior risco; a proposta é por família, na ordem da matriz (§1).
- **Retratos de bichos**: mexer no quadro do retrato afeta Pessoas, a Linha da Vida e o abrigo ao mesmo tempo
  (testes de retrato existentes: `galeriaRetratos`, auditorias de cabelo/barba não tocam bichos).
- **Os ícones de nível 1** continuam de traço: o pedido diz para não usar o mesmo desenho reduzido; se o usuário quiser
  ilustrações também ali, é outro trabalho.
- **Direção C** depende de tremor determinístico (sem `Math.random`), já feito; mas a hachura em 32 px vira ruído.

## 6. Correção isolada — o bug dos presentes (no jogo, com teste)

**O que o playtest viu**: ao "Dar um presente", os nomes numa coluna estreitíssima, quebrando letra por letra; "Dar",
o preço e o resto desalinhados. Reproduzido (`docs/rework8/12-presentes.jpg`, antes × depois; `colunas8.mjs` o mede no build antigo: nomes com 24–67 px
de largura em 4–7 linhas, nos três tamanhos de tela).

**As causas reais** (estilos compartilhados, não a captura):
1. A grade do presente era `36px 1fr auto`. Quando o presente não podia ser dado, o `BotaoAcao` punha o **motivo**
   ("Custa R$ 570; na conta há R$ 0.") **dentro da coluna `auto` do botão**, que crescia até caber a frase e espremia o
   `1fr` do nome.
2. `.objeto` era a classe de **dois componentes**: o cartão de Pertences (padding de 16 px, em `material.css`) e o
   SVG de `DesenhoObjeto` (`vivida.css`). O desenho do presente virava um quadradinho cinza. A auditoria de CSS tinha
   essa duplicata na lista de "intencionais" — não era.

**A correção**: o presente é `40px minmax(0, 1fr) auto` com áreas `objeto texto botao` / `. motivo motivo`; o `.acao`
sai da grade (`display: contents`), o botão vai para a área dele e o motivo vira a linha de baixo, em toda a largura.
Cada presente mostra **nome, tipo, descrição breve, preço (moeda e valores grandes), o gosto, a disponibilidade e o
botão** (desabilitado com o motivo). O desenho virou `.desenho-objeto` (a duplicata saiu da lista do teste — aperto).

**Auditoria das outras interfaces com a mesma estrutura** (`scripts/playtest/colunas8.mjs`): os presentes, **todas as
lojas** (abertas uma a uma), Pertences e a ficha da prática, numa vida sem dinheiro e numa rica, em 360/390/1440 px —
**102 telas, 0 problemas** depois da correção. A auditoria achou e corrigiu também a tabela "Comparar as opções" do
REWORK 7.5 espremida no celular (largura mínima e rolagem própria).

**Teste de regressão**: `src/ui/__tests__/rework8.test.tsx` (4 testes) — cada presente com nome, tipo, descrição,
preço e o motivo como irmão do botão (fora da coluna dele); com dinheiro, dá para dar; o contrato do CSS da grade; e
`.objeto` só em `material.css`. Alteração em teste existente: `fixPosPlaytestHumano.test.tsx` tirou `objeto` da lista
de redefinições "conhecidas" (era um falso intencional) — mais estrito.

As **reações** ao presente (tipo, contexto, idade, personalidade; o presente simples que vale muito) ficam para a Fase B
(pedido §9, segunda parte): o motor já tem o `gosto` (certeiro/bom/neutro); falta a reação contextual.

## 7. Recomendação técnica

**Direção A (Catálogo editorial) como base**, com duas coisas emprestadas: a **sombra no chão** de B nos níveis 2 e 3
(dá "objeto do mundo" sem custo de gradiente) e, eventualmente, o **traço de C só no nível 3** de lugares e bichos
(onde há espaço para personalidade). Razões: é a mais legível pequena (o maior uso do jogo é 64–96 px), a mais coerente
com a interface editorial (fios finos, papel), a mais estável nas quatro paletas e a mais barata (≈ 3,6 KB por desenho;
11 unidades de trabalho contra 13,5 e 16).

Ordem sugerida para a Fase B (a matriz): (1) carros por modelo + motos + bicicletas; (2) lugares como fachadas;
(3) os objetos que faltam (os 4 eletrodomésticos, os 3 celulares, guitarra, raquete); (4) cães e gatos (membros,
poses, quadro); (5) casas na mesma linguagem; (6) reações aos presentes.

**A escolha é do usuário** — A, B, C, ou uma combinação diferente da recomendada.

## 8. Arquivos desta fase
| Arquivo | O quê |
|---|---|
| `scripts/playtest/rework8/galeriaAtual.tsx` | a galeria do que existe (diagnóstico) |
| `scripts/playtest/rework8/propostas.tsx` | as peças, as famílias, os três renderizadores, as dez amostras |
| `scripts/playtest/rework8/galeriaPropostas.tsx` | as três direções nas quatro paletas; o destaque de perto |
| `scripts/playtest/rework8/api.tsx` + `telas8.mjs` | as direções aplicadas nas telas reais |
| `scripts/playtest/rework8/foto.mjs`, `fatiar.mjs`, `montagem8.mjs` | capturas e montagens |
| `scripts/playtest/colunas8.mjs` | a auditoria do texto espremido (presentes, lojas, pertences, prática) |
| `docs/rework8/*.jpg` | as 12 montagens |
| `src/ui/jogo/Pessoas.tsx`, `src/ui/vivida.css`, `src/ui/agir.css`, `src/ui/jogo/material/Objetos.tsx`, `src/ui/cotidiano.css` | a correção dos presentes (e da tabela de comparar) |
| `src/ui/__tests__/rework8.test.tsx` | o teste de regressão |

## 9. Validação desta fase
| Verificação | Resultado |
|---|---|
| Suíte completa (Node 22) | **1375/1375** (1371 + 4 de `rework8.test.tsx`); um teste longo de 80 anos (`fix4` · retrospectiva) estourou o tempo uma vez sob carga das capturas e passou isolado (71/71) — sem mudança de código |
| Typecheck | ok |
| Build / build:itch | ok; `Jogo.js` 441,6 kB, `index.css` 182,5 kB, `motor.js` 764,6 kB (todos < 800 kB) |
| Smoke itch.io | 21/21 |
| Texto espremido (`colunas8.mjs`) | 102 telas, 0 problemas (antes da correção: presentes e a tabela de comparar, em 360/390/1440) |
| Protótipos | 10 amostras × 3 direções × 3 tamanhos × 4 paletas; 64 capturas das direções nas telas reais |

**APK não regenerado** (como pedido). Fase B: aguardando a escolha da direção.
