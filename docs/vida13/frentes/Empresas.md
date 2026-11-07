# Frente 5 — Empresas (VIDA 13 complemento: seções 5, 6, 7 e os testes de Empresas da 15)

Clone `/home/iego_ossi/vida-trabalho/r129`, branch `claude/vida13-complemento`. Nada commitado (o integrador commita).

## Auditoria (o ponto de partida)
- `empresas129.ts`: projetos = ITENS genéricos do ramo (4–6 por ramo: "uma linha de alimentos", "um SUV premium"). "Mais uma
  linha de produção" (`capacidade`) só construía capacidade — sem dizer o que produzir. Nenhuma decisão por linha além de
  ampliar/descontinuar. O texto devolvido por `decidirEmpresa129` não dizia de onde saiu o dinheiro nem o que mudou.
- UI: "Estratégia de {nome}" era o `<summary>` de um `<details>` com cara de título; todas as alavancas, projetos, capital
  num bloco só; muitas ações com `ocultarImpossivel` (sumiam em vez de dizer o motivo).
- Nomes: 5 nomes fixos por ramo (`SetorGrande.nomes`). **Causa raiz do bug "Fortaleza Industrial comprou a concorrente
  Fortaleza Industrial"**: `decidirEmpresa129('concorrente')` sorteava `r.pick(s.nomes)` — a mesma lista de 5 de onde saiu
  o nome da própria empresa — sem checar contexto. O mesmo valia para as ofertas de aquisição, as participações e a
  fundação (duas empresas da pessoa podiam ter o mesmo nome).

## O que mudou (arquivo: função)
**Novos**
- `src/motor/dados/produtos13.ts` (catálogo puro → chunk motor-casa): **129 produtos** dos 10 ramos grandes (indústria 26:
  biscoitos, salgadinhos, cereais, bolachas, refrigerantes, massas, chocolates, iogurtes, congelados, café, linha saudável,
  ração, higiene/beleza, embalagens, química; montadora 22: hatch, picapes, sedãs, minivan, SUVs, esportivo,
  superesportivo, conversível, elétrico/híbrido, van, caminhão leve, motos urbana/trail/esportiva; tecnologia 19: apps,
  rede social, jogo, fintech, streaming, ERP, CRM, segurança, sistema operacional, smartphone, notebook, hardware
  especializado, vestíveis, IA, nuvem, data center; aeroespacial 12: satélites, sonda, lançadores, reutilizável,
  internet via satélite, cápsula, turismo espacial, estação; construtora 10; banco 11; aérea 9; semicondutores 8;
  energia 10; infraestrutura 8) + **32 produtos/serviços das empresas pequenas** (restaurante: brunch, executivo,
  degustação, rodízio, bar, café da manhã, congelados…; clínica, academia, estúdio, hotel, loja). Cada produto: família,
  público, posicionamento, investimento, prazo, faturamento, margem, capacidade, risco, concorrência (1–5), crescimento do
  mercado, elasticidade-preço, ciclo de envelhecimento, tamanho do mercado, banco de marcas. O 1º produto de cada item é
  NEUTRO (números do item) — gestão delegada e empresas à venda usam ele.
- `src/motor/dados/nomes13.ts` (puro → motor-casa): ~130 raízes gerais, 52 sobrenomes, peças por ramo (sufixos, prefixos,
  raízes próprias, padrões de família) para os 18 tipos, padrões por porte, 14 bancos de marcas de produto (inventadas,
  sem modelo real), fundos.
- `src/motor/sistemas/empresas13.ts` (→ motor-patrimonio): `nomesConfundem13` (igual, núcleo igual, um contido no outro,
  1 letra de diferença), `nomeDeEmpresa13` (ramo + porte, recusa confusão com `usados`), `nomeDeFundo13`, `nomeDaLinha13`,
  `nomesEmUso13`, rivais com nome (`rivaisDe13`/`garantirRivais13`/`trocarRival13`), `resolverProjeto13`/`itemEfetivo13`/
  `itemDoProjeto13`, `fatorDaLinha13` (mercado, concorrência relativa ao neutro, posicionamento, preço×elasticidade,
  qualidade, envelhecimento), `bonusDeReputacao13`, `fichaDoProduto13`, `normalizarVida13Empresas`.
**Editados**
- `empresas129.ts`: contas do ano usam `itemDoProjeto13` + `fatorDaLinha13` (receita, margem, custo variável, aceitação,
  maturidade), fatia por produto (`linha.fatia`), reputação + `bonusDeReputacao13`, riscos com concorrente nomeiam a rival
  e a vítima (`textoComRival`), `fecharDecisoes13` (preenche "o que aconteceu" e vira causa no painel); decisões novas
  `linha` (constrói só a capacidade que falta + projeto do produto), `melhorar` (versão nova: aceitação, relógio do
  envelhecimento recomeça), `qualidade` (0–3 degraus), `reposicionar` (um degrau por vez), `preco` (±10%, −20%…+30%),
  `projeto` aceita produto; `decidirEmpresa129` virou um invólucro que registra cada decisão (`decisoes13`: título, custo,
  de onde saiu — caixa/crédito/conta —, o que mudou, o esperado) e devolve texto com "Pago agora…" e "Caixa: A → B";
  `concorrente` compra uma das rivais com nome (nunca a própria) e a substitui; `investidores` com fundo nomeado; fundação,
  ofertas de aquisição (com `vendedor`) e compra com nomes do gerador; gestão delegada lança o produto neutro e renova
  linha envelhecida; `projetosPossiveis` lista produtos; novas leituras `catalogoDeProdutos13`, `catalogoPequeno13`,
  `leituraDaLinha13`, `decisoesRecentes13`. Linha antiga (sem produto) adota o produto neutro só quando o jogador mexe
  nela (nome mantido, relógio da versão recomeça).
- `empresas.ts`: `novaEmpresa` e `ofertasDeParticipacao` com `nomeDeEmpresa13` (únicos no contexto).
- `tipos.ts`: `ProjetoDaEmpresa.produto?`, `.linha?: LinhaDoProduto13`, `CorporacaoDaEmpresa.rivais?`,
  `Empresa.decisoes13?: DecisaoDaEmpresa13[]`.
- `save.ts`: chamada de `normalizarVida13Empresas`. `vite.config.ts`: `empresas13` em motor-patrimonio; `produtos13|nomes13`
  em motor-casa.
- `ui/jogo/Empresas129.tsx` + `ui/empresas129.css`: hierarquia em títulos reais (h4 "Como a empresa está", "O que você
  decidiu", "Produtos e linhas", "Decisões de {nome}", "A diretoria"; h5 nos grupos) — o `<summary>` foi removido;
  descrições curtas sob cada título; decisões em abas (`tablist` com teclado: Lançar produto · Mercado e operação ·
  Crescer e financiar · Lucro e capital; pequena: Lançar · Estratégia · Capital); catálogo de produtos por família em
  botões `aria-pressed` + ficha com os 12 atributos + "Lançar com a capacidade que sobra" e "Nova {unidade} para este
  produto"; cada linha à venda com ficha (posicionamento, preço, qualidade, versão, margem, fatia) e ações (expandir,
  versão nova, qualidade, reposicionar em radio, preço ±10%, descontinuar em vermelho, separado); `Escolha` = opção com
  hover/pressionado/✓ selecionado/foco, indisponível tracejada com `aria-disabled` e o motivo escrito; botões sem
  `ocultarImpossivel` (dizem o motivo); quadro "O que você decidiu" (custo e origem, chips do que mudou, o esperado, e
  depois do fechamento "O que aconteceu"); fundar escolhe o 1º PRODUTO (optgroup por família); oferta mostra quem vende.

## Campos de save novos (todos opcionais) + normalizador
`ProjetoDaEmpresa.produto`, `ProjetoDaEmpresa.linha {pos, preco, qualidade, versao, tRenov, fatia}`, `Corporacao.rivais`,
`Empresa.decisoes13` (≤ 8). `normalizarVida13Empresas` (idempotente): tira produto inexistente, corrige pos/preço/qualidade
fora do lugar, descarta listas tortas; **não toca em nenhum nome**. Nomes gravados não mudam (o gerador só roda na
criação; os sorteios antigos são feitos e descartados para perfil/sócio/oferta saírem iguais aos da 12.9.1).

## Testes (resultados reais)
- `src/motor/__tests__/vida13Empresas.test.ts` — 17 testes, todos passando (produtos por ramo e os pedidos pelo usuário,
  ficha completa, lançar × nova linha, escolhas diferentes → resultados diferentes e plausíveis, preço/posição/qualidade/
  versão, envelhecimento, descontinuar libera capacidade, pequena com produtos próprios, economia de 20 anos, nomes
  (confusão, 60 nomes únicos × 7 ramos, >120 distintos em 200), o bug com 25 sementes, ofertas únicas + vendedor, compra
  mantém o nome, save antigo sem produto = fator neutro e nomes intactos, normalizador idempotente, texto do resultado).
- `src/ui/__tests__/vida13Empresas.test.tsx` — 2 testes passando (títulos reais/abas/catálogo/ficha/ação `linha`; linha
  com indisponível + motivo; quadro de decisões).
- `vida129Economia` (motor 27 + UI 3) passando; o teste de UI da 12.9 ganhou um clique na aba "Mercado e operação"
  (mudança pedida: as alavancas foram para uma aba). Rodada final (8 arquivos: vida13Empresas ×2, vida129Economia ×2, rework12 ×2, rework122 ×2): 128 passam, 2 falham em rework122 (Submundo: exposição do negócio por fora e investigação) — testes que não usam empresas nem nomes; atribuo às mudanças de outras frentes em acoes/ano (não investiguei a fundo). O teste de fachada com empresa (que usa empresa_abrir) passa.
- `npx tsc --noEmit -p .`: nenhum erro nos meus arquivos.

## Sim (`scripts/sim/empresas13.ts`; base = `git archive HEAD` da 12.9.1 em a13/base1291-empresas)
A) 10 ramos × 2 sementes, fundar com o 1º item, gestão delegada, 15 anos:
- 12.9.1: receita total R$ 58,3 bi, lucro 5,35 bi, valor 159,9 bi, 1 falência.
- 13: receita 54,5 bi (−6,5%), lucro 4,81 bi (−10%), valor 149,9 bi (−6%), 1 falência (a mesma). A diferença vem do
  envelhecimento dos produtos (mecânica nova, compensada pela versão nova); nada explode.
B) Escolhas (8 anos, semente 41/77): indústria base rec 45,5/54,8 mi · + salgadinhos 94,8/118,8 mi (lucro 8a 83/113 mi)
· + massas 79,5/98,9 (36/59) · + saudável 92,7/117 (79/108) · nova linha chocolates 100/120 (61/85) · biscoito +10% preço
rec 42/50,4 mas lucro 8a 12/26 (> base −0,3/15) · −10% rec 47,7/57,4, lucro −26/−6,5 · intermediário rec 32,6/39,1 ·
qualidade +1 rec 50,9/61,3, rep +2 · descontinuar rec 0. Montadora: hatch só lucro 8a −1,3/+0,65 bi; + SUV compacto
+1,55/+4,1 bi; + moto urbana +0,36/+2,6 bi (fatia 8%); + superesportivo −0,38/+1,2 bi (fatia 17% de um mercado pequeno).
Tecnologia: ERP −12,8/4,2 mi; + rede social −7/6,8; + segurança digital +12/+26 mi. Saídas em a13/sim-empresas-*.txt.

## Pacotes (build próprio em a13/dist-empresas; inclui as outras frentes)
motor-patrimonio 224 → 255 kB (minha parte: empresas13 + empresas129), motor-casa 171 → 282 kB (minha parte ~45 kB de
catálogos; o resto de outras frentes), Empresas129 (lazy) 31 kB + 10 kB CSS. **Não toquei** motor, motor-dados,
motor-textos (motor-dados 798,8 kB nesse build vem das outras frentes — atenção do integrador).

## Auditoria visual
Galeria interativa (`scripts/playtest/galeria13Empresas.tsx` + `fotos13Empresas.mjs`, porta 4185): indústria, montadora,
restaurante; claro/escuro; 1440/390; abas, ficha, hover, depois de decidir — 66 PNGs em a13/fotos/empresas, sem erro de
console e sem rolagem horizontal. Olhei: lançar (1440 claro), crescer (montadora escuro), linha (390 escuro), restaurante
(390 claro).

## Limitações honestas
- A marca de produto vem de um banco por tipo (alimentos), não por produto: pode sair "Salgadinho Cacau Real".
- Concorrentes com nome só nas empresas grandes; nos eventos de `acontecimentos129economia` ("uma concorrente") não mexi.
- "Qualidade/reposicionar/preço" só nas grandes; na pequena: lançar produto específico, renovar e descontinuar.
- O resultado imediato genérico (modal/BotaoAcao) é da Frente 6; aqui o conteúdo é o texto rico + o quadro na tela.
- O gráfico "Resultado, ano a ano" aparece vazio na galeria estática (componente `Evolucao` existente; não investiguei).
- O envelhecimento reduz ~6% a receita da base delegada (documentado acima).

## Rodada 2 (pedido do integrador, após o checkpoint fcd93a3)
- Gráfico "Resultado, ano a ano" vazio: **artefato da galeria**, não bug. Reproduzido no app real (build a13/dist-empresas,
  preview 4185, save qa129/saves/vida-r129-empresaria.json, Vida → Patrimônio → Empresas): o SVG tem 1007×44 px, polyline
  com 4 pontos e traço na cor de acento (foto a13/fotos/empresas/app-evolucao.png). Causa: a galeria não importava
  `material.css` (onde mora `.evolucao`; no app vem por Casa.tsx). Corrigido em scripts/playtest/galeria13Empresas.tsx.
  Script do app: scripts/playtest/_e13app.mjs.
- `conteudo/acontecimentos129economia.ts`: o diretor cobiçado recebe proposta "da concorrente {rival}" e sai para ela; a
  proposta de compra vem "A concorrente {rival} quer comprar {empresa}" e a venda diz a quem foi. A rival vem de
  `corp.rivais` (gravadas), escolhida por uma soma de caracteres — sem sorteio (sementes intactas). Sem rival (empresa
  pequena ou save antigo antes do primeiro ano): o texto de antes.
- Testes: vida13Empresas (motor 17 + UI 2) e vida129Economia (motor 27 + UI 3): 49/49 passando.
