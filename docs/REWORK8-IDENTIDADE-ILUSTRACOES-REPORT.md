# REWORK 8 · Fase B — Identidade das ilustrações (relatório)

Direção aprovada: **híbrida A + B, com predominância de A — Catálogo editorial**. Formas precisas, contorno discreto,
cores materiais, leitura excelente em miniatura; de B, só o volume sutil (uma luz de cima), a sombra de contato e a
profundidade que dá presença física. Nem ícone genérico, nem miniatura 3D.

A prioridade foi o **reconhecimento**: cada categoria e cada modelo se distinguem antes de ler o nome — veículos,
instrumentos, eletrodomésticos, móveis e animais primeiro.

## 1. A linguagem (um renderizador, peças semânticas)

`src/ui/ilustracao/` — 2 063 linhas, sem nenhum SVG copiado: famílias de formas com parâmetros.

| Arquivo | O que desenha |
|---|---|
| `nucleo.tsx` | As peças (`massa`, `vidro`, `metal`, `linha`, `pneu`, `luz`, `texto`, `grupo`) e o renderizador único `Ilustracao` |
| `carros.ts` | 8 famílias de carroceria + **28 modelos** com números próprios |
| `duasRodas.ts` | 6 formas de moto e 4 de bicicleta, com o modelo |
| `aguaEAr.ts` | Barcos (jet ski, lancha, veleiro) e aviões (ultraleve, mono, asa baixa, bimotor, jato) |
| `objetos.ts` | **As 35 coisas do catálogo**, cada uma com a sua forma |
| `lugares.ts` + `Fachada.tsx` | **17 fachadas** de lugares da cidade |
| `casas.ts` | **15 formas de moradia**, o estado, o veículo na porta, os bichos |

O renderizador aplica a mesma receita a tudo:

- **Massa:** cor material chapada + **contorno discreto** (a própria cor escurecida e puxada ao grafite;
  `non-scaling-stroke`, 0,9 / 1 / 1,15 px conforme o tamanho) + uma **luz de cima** sutil (um gradiente compartilhado).
- **Profundidade:** **sombra de contato** no chão; vidro com reflexo.
- **Objeto quase preto:** fio claro (`#857e75`), para não sumir no papel escuro.
- **Objeto quase branco:** fio mais firme.

**Nível de detalhe por tamanho:**

| Nível | Largura | O que aparece |
|---|---|---|
| 1 | < 48 px, navegação | só a silhueta e as massas; somem os fios, os textos e o miúdo |
| 2 | < 140 px, identificação | o detalhe que identifica: trastes, grades, faróis |
| 3 | ≥ 140 px, destaque | o detalhe completo: tarraxas, ripas, tijolo |

Cada parte leva `data-peca` (o que ela é: `helice`, `cacamba`, `lataria`, `janela`…). É por aí que os testes leem o
desenho.

**Identidade só de dados que já existem.** Nada vai para o save. O desenho deriva de:

- `versaoId` — o modelo;
- `cor` — o anúncio, o bem, a variante da coisa;
- o estado — zero com brilho, usado com riscos, cansado com ferrugem e pintura gasta;
- a semente — a variação de quem não tem modelo.

O id dos gradientes vem do próprio desenho, então a mesma entrada dá **sempre o mesmo SVG**.

## 2. O que mudou, na ordem do escopo

1. **Carros por modelo, motos e bicicletas** (`13`).
   - Kwid, Mobi e C3 não são mais o mesmo carro. Os 28 modelos de carro saem com 28 desenhos diferentes, na mesma cor e
     no mesmo tamanho.
   - O que diferencia cada um: a cava, o rack, o estribo, a caçamba, o santo-antônio, o teto em outra cor e o farol.
   - Motos (de rua, esportiva, trilha, scooter, motoneta, clássica) e bicicletas (urbana com cesta, speed, MTB,
     elétrica com bateria e motor no cubo) por modelo. O teste achou duas motos de rua e duas MTB iguais; ganharam o
     bagageiro da CG, o escapamento curto da MT-03, o freio de aro da Vulcan e o amortecedor da Fun Comp.
   - O modelo agora chega ao desenho em todo lugar: concessionária, usados, Pertences, oficina, os bens da Casa e o
     carro na porta de casa.
2. **Lugares como fachadas** (`16`, `19`, `20`, `23`). A arquitetura diz o que é antes da placa:
   - o banco tem colunas e frontão;
   - a clínica, o branco e a cruz;
   - a oficina, o tijolo, o portão e o elevador;
   - a concessionária, a caixa de vidro e as bandeirolas;
   - os usados, o pátio com bandeirinhas;
   - o aeroclube, o hangar e a biruta;
   - o abrigo, a casa, o cercado e a casinha.

   **A fachada é o fundo da vitrine**, e os objetos de verdade deste ano ficam na calçada, em frente à loja: os carros do
   anúncio, as coisas da loja, os bichos do abrigo, o carro da oficina. Sem objetos, a vitrine mostra o interior da
   loja. A regra de 34 % da vitrine continua para os objetos; a fachada preenche a caixa (`xMidYMax slice`). As lojas da
   Cidade usam a fachada recortada, no lugar do ícone de traço. Nas paletas escuras, a rua fica um pouco mais baixa de
   luz (`--p-filtro-rua`, um token da paleta).
3. **Os objetos** (`14`, `15`, `21`). Cada uma das 35 coisas tem forma própria, na cor da variante que esta vida tem:
   - a **máquina de lavar** tem porta redonda; a **lava-louças**, porta lisa com puxador; o **aspirador robô** é um disco;
     o **ar-condicionado** é a split na parede, com o vento;
   - os **celulares** aparecem de costas: uma, duas ou três lentes;
   - a **guitarra** vem com o amplificador; a **raquete** tem cordas em grade e bolinha;
   - o **violino** vem com o arco, e o **piano** é de armário.

   Sem cor (a vitrine, o presente), a coisa aparece no acabamento mais comum: a primeira variante.
   *(O catálogo tem 35 coisas, não 37 como dizia a Fase A.)*
4. **Cães e gatos** (`18`).
   - O bicho **preenche o retrato**: antes ficava pequeno, com fundo vazio em cima. A escala sai da caixa do corpo, e o
     porte ainda se lê (o pequeno continua menor que o grande).
   - O gato é enquadrado pela caixa da postura: sentado, cauda erguida, deitado, em pé.
   - O gato em pé ganhou pernas que afinam até a pata, no lugar do bastão do mesmo grosso.
   - A morfologia (9 famílias de cão, 5 tipos de gato) continua a mesma.
5. **As casas** (`17`, `22`). As 15 formas foram redesenhadas na linguagem nova:
   - parede no material (reboco, cal do sítio, tijolo à vista, a torre de vidro, a cor da fachada);
   - telhado de barro, laje, vidro;
   - a **janela acesa em luz quente**: quem mora ali.

   O estado aparece com forma: mancha de umidade, rachadura, andaime com tábuas, lata e rolo de tinta. O veículo na
   porta é a mesma ilustração da garagem, encolhida. Os contratos de antes continuam: `.cena__janela--acesa`,
   `.cena__veiculo`, `.cena__bicho`, `data-condicao`, `data-detalhe`, o nome acessível.
6. **A reação ao presente** (`motor/sistemas/presentes.ts`, `reacaoAoPresente`). A reação sai do contexto:
   - **o tipo da coisa:** um instrumento se experimenta, uma tela se configura, um jogo se joga, um livro se lê;
   - **a idade:** a criança rasga o papel; o adolescente disfarça; quem tem mais idade pede ajuda para configurar;
   - **o jeito:** quem é expansivo mostra para todo mundo; quem é reservado agradece baixinho;
   - **a relação:** o par, o pai ou a mãe ("não precisava gastar com isso"), o filho pequeno;
   - **o tamanho do gesto.**

   **Um presente simples e certeiro é lido como certeiro**: "Não era caro — e não precisava ser". A reação **nunca
   inventa uma lembrança em comum**: fala só do que acontece agora. As variações são estáveis por presente e não se
   repetem entre presentes diferentes.

O código antigo foi removido: os veículos em traço, os 15 desenhos de casa, a moto e a bicicleta de 48 px, o `Desgaste`
e o `ICONE_DA_LOJA`. `Desenhos.tsx` passou de 1 040 para 180 linhas. As regras mortas `cena__*` saíram do CSS.

## 3. Auditoria visual nas telas reais

`scripts/playtest/rework8/telasB.mjs`, sobre o build:

- **Escopo:** 18 telas × 4 paletas × 1440, 820, 390 e 360 px, mais 390×560 — **360 capturas** (e a página inteira em 1440
  e 390).
- **Telas:**
  - Compras de três vidas;
  - as lojas: concessionária, usados, motos, instrumentos, casa, abrigo, oficina;
  - Pertences com posses reais;
  - a Casa com o carro na porta;
  - as lojas da Cidade;
  - a ficha com os presentes;
  - Pessoas.
- **Medições:** as de antes (texto sobre texto, rolagem horizontal, borda estourada, o avançar à mão, alvos de toque) e
  mais as das ilustrações (todo desenho visível tem tamanho e cabe na janela; a fachada cobre a vitrine inteira).
- **Resultado: 0 problemas, 0 notas.** A primeira rodada acusou 144 "bordas estouradas" — eram os prédios vizinhos da
  fachada, recortados pelo próprio SVG. O medidor passou a medir o SVG, não o que ele recorta.
- **Save de posses:** `scripts/playtest/rework8/gerarB.ts` faz a vida rica comprar, por ações de verdade, um Argo zero,
  um Nivus usado, uma Pop e 12 coisas. A carteira de motorista entra direto no dado (`licencas`), sem a autoescola —
  o que se audita é o desenho.
- **Galeria de todos os desenhos do jogo, nas quatro paletas:** `scripts/playtest/rework8/galeriaB.tsx` (64 veículos, 35
  coisas, 17 fachadas, 15 casas em dois estados, cães e gatos).

## 4. Desempenho e tamanho

`scripts/playtest/rework8/desempenhoB.mjs`: o clique numa seção de Vida até a tela renderizada com o layout calculado.
Mediana de 7 cliques, 1440 px, no mesmo build de produção, Fase A × Fase B.

| Tela | Fase A | Fase B |
|---|---|---|
| Compras (17 vitrines desenhadas) | 13–15 ms | 20–25 ms |
| Pertences (15 posses) | 13 ms | 15 ms |
| Casa | 3–9 ms | 5–10 ms |
| Cidade | 4–5 ms | 4–7 ms |

A primeira versão da Fase B custava 40–45 ms em Compras. Duas coisas trouxeram de volta:

- um cache das amostras (o desenho é função pura dos dados);
- `content-visibility: auto` nas vitrines e nos cartões de Pertences: o que está fora da tela não entra no layout.

Os +7–10 ms que sobram em Compras são o preço das 17 fachadas.

**Bundle:** o chunk do jogo foi de ~442 kB para **~479 kB** (+37 kB). O maior chunk continua sendo o do motor (~765 kB);
**todos abaixo do limite de 800 kB**. O CSS não mudou de tamanho (~183 kB).

## 5. Testes

- **Novo:** `src/ui/__tests__/rework8b.test.tsx`, com **16 testes**:
  - os 28 carros distintos; todo veículo com o modelo marcado; motos e bicicletas sem repetir dentro da forma;
  - a cor do anúncio na lataria e o desgaste com forma;
  - toda coisa com desenho próprio; a cor da variante, e não a da paleta; o fio claro do objeto escuro;
  - o nível de detalhe; o determinismo;
  - as 17 fachadas distintas; o interior com e sem objetos; Compras com uma fachada por lugar e sem ícone de traço;
  - o carro do modelo na porta de casa;
  - o cão e o gato preenchendo o retrato, com o porte ainda legível;
  - a reação ao presente por tipo, idade e jeito; o simples e certeiro; a tensão; nenhuma lembrança inventada; frases
    que não se repetem.
- **Reescritos, com a justificativa no próprio teste:** liam detalhes do traço antigo (a opacidade do disco da hélice, a
  espessura da linha da asa, `path[fill-opacity="0.5"]` como vidro) e agora leem `data-peca` — a regra continua a
  mesma.
  - `desenhos.test.tsx`: o vidro.
  - `visuaisIcones.test.tsx`: a hélice, a nacele, as janelinhas do jato, a asa alta × baixa pela altura, a escora; o jet
    ski com banco, guidão e espuma.
  - `fixPosRework4.test.tsx`: o fio claro do violão preto passou de `#d8cbb8` para `#857e75`.
- **Contratos mantidos sem tocar no teste:** `casas.test.tsx`, as variáveis `--cor-veiculo`/`--lataria` dos cartões
  coloridos, `data-forma`, `.desenho-veiculo`, os testes de morfologia dos bichos e a auditoria de CSS (nenhum
  componente pergunta qual é o tema; o tema escuro só redefine `--p-*`).
- **Suíte completa (Node 22): 1 391 testes, 1 391 passando.**
  - A rodada completa deu 1 390/1 391. A falha era real: o token novo `--p-filtro-rua` faltava em Horizonte e no
    Atlântico, e cada paleta precisa redefinir toda a camada `--p-*`. Foi corrigido, e os 68 testes de paleta e da
    Fase B passaram de novo.
  - Esta máquina está mais lenta que na Fase A. Com o tempo-limite padrão, testes longos de simulação do motor estouram
    o tempo, e o commit da Fase A (17dd31f) estoura nos **mesmos** testes, com os mesmos tempos. A suíte foi rodada
    com `--testTimeout=400000`.
- **typecheck** limpo; **build** ok; **build:itch** ok; **smoke:itch 21/21**; **offline PWA 36/36** (o save sobrevive à
  versão nova).

## 6. O que fica para depois

- Na vitrine larga do celular, o terceiro objeto pode cair na frente da porta da loja. A leitura fica certa, mas a
  composição poderia evitar a porta.
- As casas da imobiliária na vitrine ficam pequenas (três miniaturas de 84 px).
- Os aviões e os barcos não têm números por modelo (só por forma). Há poucos modelos de cada, todos de formas diferentes.

## 7. Git e publicação

- Um commit só, na `claude/fix-pos-rework3-playtest`, com push. Sem merge na `main`, sem force-push, `.claude/` fora.
- A publicação é automática pelo Cloudflare Pages; não houve deploy manual.
- **O APK não foi regenerado nesta fase.**
