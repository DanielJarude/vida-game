# VIDA 22 — Propriedades, fama, vestuário e lojas · relatório

Branch `claude/vida22` (a partir de `ecab68f` = `origin/main`, VIDA 21 publicada em `9571459`). Data: 2026-11-14/15.

Legenda: **[T]** implementado e validado · **[V]** implementado, validação parcial · **[P]** parcial · **[N]** não implementado · **[B]** bloqueado.

## 1. Escopo e interpretação
Atualização intermediária em cinco frentes (prompt §2.1–2.6): representação das propriedades rurais; moradia integrada ao entorno e às melhorias reais; ficha do imóvel; fama com convites contextualizados e reação do mundo; guarda-roupa com peças realmente distintas, provador e looks; loja de móveis por ambiente com prévia no cômodo. Fora do escopo e não tocado: Eras Históricas (branch `claude/vida-eras-historicas` intacta), expansão de simulação rural, sistemas não citados.

## 2. Situação encontrada
- Produção servia `index-BwgQJgvv.js` (= VIDA 21, `9571459`); `main` em `ecab68f`. Trabalho no clone `~/vida-trabalho/r129`.
- O "Manual Mestre de Diretrizes" não está no repositório nem foi anexado (como na VIDA 21): segui as diretrizes do próprio prompt e as regras do projeto (`REGRAS-COMUNS`, memórias de ambiente).
- Auditoria direcionada (código + renderização):
  - **Rural** (`ui/v18/campo/Paisagem18.tsx`): a sede era desenhada em coordenada fixa (`x=34,y=120`) por cima das faixas de lavoura; galpão, silo, curral, estufa também em posições fixas; sem quintal, sem carreador estruturado, sem máquinas.
  - **Moradia** (`ui/v14/fachadas/casas14.ts`): lote isolado, sem vizinhos nem mobiliário urbano; cômodos de fora existentes no motor (`lar.extras`, planta) não apareciam (ex.: a casa de 2 quartos tem garagem na planta e não no desenho; piscina construída não aparecia).
  - **Ficha do imóvel**: não existia; os dados (valor, área, cômodos, conservação, custos) estavam espalhados.
  - **Fama**: 7 usos genéricos (`sistemas/visibilidade.ts`), uma vez por ano cada, + 13 reações do mundo da VIDA 13 (preservadas).
  - **Roupas**: script de auditoria (assinatura de silhueta sem cor) sobre 107 peças de vestir: **3 pares idênticos** (terno × terno de vicunha, polo × polo premium, bomber × jaqueta de corrida) e várias lisas diferenciadas só por `folga` mínima; a marca/segmento não mudava nada no desenho. Looks salvos já existiam (12.9). Produto → compra → inventário → corpo já usavam a mesma variante (12.9).
  - **Móveis**: vitrine agrupada por tipo de móvel (17 tipos); cômodo só como rótulo; "Ver no cômodo" era uma barra de ocupação.

## 3. Problemas por gravidade
| Grav. | Problema | Correção | Estado |
|---|---|---|---|
| Alta | Sede rural desenhada sobre a plantação | Composição em zonas (§4.1) | [T] |
| Alta | Melhorias compradas/construídas invisíveis na casa | Anexos e quintal lidos de `comodosDe` e das coisas (§4.2) | [T] |
| Média | 3 pares de roupas com desenho idêntico; marca sem efeito visual | Construção por peça + acabamento da marca (§4.5) | [T] |
| Média | Fama repetitiva (mesmos 7 botões) | Agenda de convites contextualizados (§4.4) | [T] |
| Baixa | Casa de 2 quartos sem a garagem da planta | Anexo de garagem | [T] |
| Baixa | "Iria para o sala" / "Cabe no sala" (artigo pela 1ª letra) | `artigoDoComodo22` | [T] |

## 4. Implementado
### 4.1 Propriedades rurais — [T]
`Paisagem18` reescrito (mesma API): chão em zonas — reserva legal (fração real) no fundo; glebas de produção proporcionais à área (talhões, pasto, tanques), cercadas; carreador da porteira às glebas (cascalhado quando há `estradas`); **sede num quintal gramado e cercado**, com jardim, árvores de sombra e caminho, fora da lavoura; **terreiro** com as estruturas que existem (galpão em arco, silos, curral com tronco, estábulo/ordenha com tanque, cocheiras, aprisco, granja com esterqueira, aviário, terreiro de café, viveiro, estufas, solar, poço), ordenadas por profundidade e dimensionado pelo que contém; máquinas reais na frente (trator, colheitadeira, pulverizador, plantadeira, caminhão, microtrator). Diferenças por tipo/uso: pivô central em círculo, café em curvas de nível, horta em canteiros, pomar/cacau/açaí/eucalipto/pínus como árvores em fileira, arroz com taipas, algodão, haras com cerca branca e pista oval, piscicultura com quadras de tanques, represa com contorno irregular; casa de fazenda (varanda comprida, janelas de madeira), casa de sítio (alpendre), chalé na florestal. Sem sede, não há casa. Placa do palco movida para o alto (não cobre a sede).
### 4.2 Moradia e entorno — [T]
`entorno22.ts` + `casas14.ts`: vizinhos atrás das divisas (mais claros), postes nas divisas, fiação aérea, árvores de calçada, grama de calçada — variando por **bairro** (`moradia.bairro`), **porte da cidade** e **forma**: periferia, bairro, centro (prédios), nobre, condomínio, cidade pequena, rural (pasto, sem vizinho). **Anexos** (lote alargado à direita): garagem, piscina com deck e espreguiçadeiras, área de lazer (churrasqueira de alvenaria, chaminé, pergolado, mesa), quadra com alambrado; varanda (alpendre na térrea, laje com pilares no sobrado); jardim sem projeto vira gramado. **Quintal**: churrasqueira, espaço gourmet, forno, gazebo, pergolado, fonte, escultura, playground, cama elástica, guarda-sol, espreguiçadeiras — só o que está em casa. Nada sem o cômodo ou a coisa correspondente.
### 4.3 Ficha do imóvel — [T]
`ui/v22/casa/FichaDoImovel22.tsx` em Vida · Casa: tipo, onde (cidade, bairro, porte), situação (própria/financiada/herdada/alugada), desde e preço pago; **valor estimado separado de "Na conta agora" e de "Patrimônio líquido"** (alugada: diz que o valor não é patrimônio); saldo devedor; área útil, terreno livre para obra, quartos/banheiros/suítes/lavabo, outros cômodos, vagas, o que há do lado de fora; ocupação (moradores × quartos, aperto), conforto, conservação (estado, problema, última manutenção), custos fixos (condomínio, imposto e manutenção, o que se acrescentou); melhorias feitas (obras com ano, conversões, acabamentos, lado de fora).
### 4.4 Fama — [T]
`motor/v22/fama/agenda22.ts` (pacote `motor22-fama`): 27 modelos de convite com quem convida (nomes genéricos), o que pede, o que pode trazer, nível mínimo, origem do nome, requisitos (conquista recente para premiação/coletiva; negócio para inauguração; vida política para debate/cerimônia; imagem boa para marcas e gala; talk show só depois de auditório bem-sucedido; embaixador só depois de campanha) e consequências (nome, `vis_boa`/`vis_polemica`, cachê por `receberDaFama13`, público da obra, reputação/freguesia do negócio, apoio/desgaste político, estresse/felicidade, biografia). Quantidade proporcional ao nome (0 a 5/ano). Lidos na hora por `rngDe(v.id,'agenda22',ano)` — nada novo no processamento anual (saves e sementes intactos); só as respostas ficam em `Vida.fama22` (opcional). "Na imprensa e nas ruas": o que se respondeu no ano, os marcos do ano e reações proporcionais (pedido de foto → fotógrafo na porta). Os 7 usos e as 13 reações da VIDA 13 continuam.
### 4.5 Guarda-roupa — [T]
Vocabulário de construção em `pecas.ts`/`Figura.tsx`: tecido (leve/médio/encorpado/técnico/canelado), comprimento (cropped/longline), ribana da gola, raglan (com cor da manga), recortes laterais, carcela, bolso no peito, barra dupla, cava funda, alças finas/nadador, bordado, friso; casaco com ribana, bolso de manga, faixas, lapela de bico; terno trespassado, lenço, colete; calça com barra dobrada. **Acabamento da marca** (segmento 1–5): econômico mais solto; premium/luxo com pesponto de contraste, etiqueta e caimento justo — passado da marca do item (`PecaEmUso.marca`) na vitrine, provador, Aparência e corpo. Peças existentes diferenciadas (camiseta lisa, gola V leve, dry-fit com raglan e recortes, grife encorpada, regata cavada, top nadador, cropped, body canelado, polo × polo premium, terno × vicunha, smoking com lapela de bico, bomber × corrida, jeans japonês com barra dobrada). **7 básicas novas** (`dados22/estilo`). `construcaoDaPeca` descreve a peça em palavras (cartão e provador). **Provador**: várias peças; uma por lugar monta a combinação; duas do mesmo lugar aparecem lado a lado com a construção; "como você está" ao lado; esconde o casaco quando se prova peça de cima. **Looks**: ocasião (casual, trabalho, formal, esporte, festa, noite, casa) ao guardar e depois, filtro por ocasião, aviso de peças que não são mais suas (vestir continua só com as que são — regra da 12.9).
### 4.6 Loja de móveis — [T]
`dados22/moveis/ambientes22.ts`: 12 ambientes (sala de estar, quarto, cozinha e jantar, banheiro, iluminação, decoração, closet e organização, escritório, área externa e jardim, piscina e lazer, lavanderia e serviço, garagem e oficina); todos os 97 produtos de móveis/eletrodomésticos classificados, alguns em dois ambientes (mesma linha, mesma compra). Filtro "Ambiente" → tipo de móvel dentro do ambiente; ordem "Melhor qualidade"; busca, marca, segmento e preço mantidos. **Prévia**: "Ver no cômodo" desenha o cômodo real (acabamentos e o que já está lá) com a peça do cartão (mesma marca/cor); se não cabe, mostra o cômodo como está e diz por quê; a barra de ocupação continua. Compra, posse e posicionamento (VIDA 14/17) inalterados.

## 5. Integrações verificadas
Obra/coisa comprada → desenho da casa e ficha · bairro/cidade → entorno · estrutura/máquina/rebanho/talhão rural → paisagem · trajetória/marcos/imagem → convites → nome, imagem, dinheiro (extrato), carreira, biografia → imprensa do ano · marca da compra → desenho no corpo · look → só peças possuídas · prévia de móvel → mesmo produto que se compra e posiciona.

## 6. Preservado
Usos da visibilidade e reações da VIDA 13; reconhecimento local (21); looks da 12.9; variante única vitrine = provador = compra; compra/posse/depósito dos móveis (14/17); fachadas, lado de fora (12.8) e correções da VIDA 21; simulação rural (VIDA 18/19) sem mudança.

## 7. Testes (resultados reais)
- Novos: `vida22Casa` (6), `vida22Loja` (4), `vida22Roupas` (6), `vida22Fama` (6).
- Suíte completa (árvore de trabalho, antes dos ajustes finais): **2.876 aprovados, 5 falhas, 1 ignorado**. 3 eram minhas e foram corrigidas no código (provador: figura com as peças vem antes de "como você está"; regata de alcinha sem modelagem declarada) — os testes antigos não foram alterados. 2 da lista de instáveis da linha de base: `fechamentoMundo #4` (passou ao rodar sozinho) e `motor.test agência` (tempo-limite fixo de 60 s; passa com tempo maior — conferido só na cópia).
- Depois dos ajustes finais: 13 arquivos afetados, 87/87.
- **Suíte completa na árvore exata do commit publicado (`git archive aa985fd`): 2.879 aprovados, 2 falhas, 1 ignorado** — as duas por tempo-limite fixo de 60 s, da lista de instáveis da linha de base (`fechamentoMundo #4`, `motor.test agência`).
- Saves antigos (VIDA 20/21): abrir, avançar, salvar, reabrir — **0 falhas**.
- Build: `tsc` limpo; `vite build` ok; maior pacote `motor-textos` 799.568 B (inalterado), `motor-dados` 791.533 B, `Jogo` 757.896 B; novos `motor22-fama`, `dados22-estilo`, `dados22-moveis`. Smoke de distribuição **30/30**.
- Inspeção visual no build de produção (Playwright, 1440 e 390, claro e escuro): Casa com entorno e ficha, Campo (5 propriedades compradas), Fama (aceitar convite → resultado), loja de móveis (ambiente + prévia), provador (comparação) — sem erro de console, sem rolagem lateral. Galerias: `scripts/playtest/galeria22{Campo,Casas,Roupas}.tsx`; capturas em `~/vida-trabalho/a22/qa/`.

## 8. Limitações e pendências
- [P] O entorno usa o bairro do mercado e o porte da cidade; não há região/clima no desenho (praia, serra).
- [P] Apartamentos não ganham anexos (o prédio decide; só a cobertura tem obras permitidas, desenhada como antes).
- [P] O acabamento da marca é sutil nas miniaturas (< 110 px a figura não desenha pesponto); visível no provador e na Aparência.
- [P] Prévia de móveis: mostra o cômodo e o encaixe por área (m²), não dimensões lineares (o catálogo não tem largura/profundidade).
- [P] Convites não ocupam tempo da agenda semanal (custam estresse); paparazzi/boato seguem os eventos da VIDA 13.
- [N] Fotos de referência reais não foram anexadas ao repositório; as silhuetas seguem peças reais conhecidas, traduzidas para a linguagem do jogo.

## 9. Commits
`08cef50` rural · `8b9b8ce` moradia e entorno · `822e568` ficha · `2031aa9` loja por ambiente · `4d31cae` guarda-roupa · `570605b` fama · `a3d802c` notas e QA · **`aa985fd`** ajustes da inspeção visual (código publicado). Este relatório vem num commit de documentação depois.

## 10. Publicação — confirmada
- Branch `claude/vida22` enviada ao GitHub. `main` (de `ecab68f`) e a branch de produção do Cloudflare Pages `claude/fix-pos-rework3-playtest` (de `9571459`) avançadas por **fast-forward** até `aa985fd`. Nenhuma configuração de produção alterada; sem proteção de branch no caminho.
- Push às 03:43:18 UTC (2026-11-15); https://vida-game.pages.dev/ passou a servir o novo build às 03:48:40 UTC (`index-DcCud0yZ.js`, igual ao do build local).
- Conferência byte a byte com o build local da mesma árvore: **`/` + 149 JS/CSS = 150 arquivos idênticos (SHA-256), 0 diferentes**.
- Smoke de distribuição no mesmo build: 30/30. Verificação funcional no site oficial (Playwright): Casa com entorno e ficha (1440), Campo (390, escuro), Fama aceitando um convite (1440), provador na loja (390) — sem erro de console, sem rolagem lateral.
- Sem acesso ao painel do Cloudflare nesta máquina: o deploy é confirmado pelo conteúdo servido, não pelo painel.
- Este relatório vai num commit só de documentação em `main` e `claude/vida22` (a branch de produção fica no código publicado).
