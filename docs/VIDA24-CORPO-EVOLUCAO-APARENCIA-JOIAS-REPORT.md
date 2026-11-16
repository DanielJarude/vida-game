# VIDA 24 — Evolução corporal, constituição desde o nascimento, anatomia, pelos e organização da Aparência

Data: 15/11/2026 · Commit `9132b06` (branch `claude/vida24-corpo-evolucao`, de `1fcf33b` = VIDA 23 + relatório).
Notas da versão: `'24'`. Save continua v20 (só campos opcionais).

O "Manual Mestre de Diretrizes" não está no repositório nem foi anexado (como nas entregas anteriores); as capturas citadas
no pedido também não chegaram. Seguidas as regras do projeto (limite de 800 kB por pacote, nada de acaso novo no gerador
principal, saves antigos intactos, só mostrar o que o motor faz) e reproduzidos os defeitos no código publicado (seção 12).

Legenda: **[OK]** implementado e validado · **[NV]** implementado, não validado · **[PARCIAL]** · **[PENDENTE]** · **[BLOQUEADO]**

## 1. Diagnóstico

- **Proporções editáveis a qualquer hora** (VIDA 23): a aba Aparência tinha 11 controles deslizantes (estrutura óssea,
  pernas, músculo, ombros…) e "Confirmar" trocava o corpo na hora. A condição física era só 5 tipos lidos do momento
  (`silhueta.tipoDeCorpo`): começar academia virava "musculoso" no mesmo instante em que as condições batiam.
- **Nada antes de nascer**: a tela Nascer não tinha nenhuma escolha de corpo; a constituição vinha dos pais sem o jogador ver.
- **Gordura triangular**: o lado do tronco era uma curva com o ponto de controle em `cintura + barriga` 6 unidades acima da
  cintura e o ponto final em `cintura + 0,6·barriga` — a curva fazia uma ponta para fora e voltava (captura `01`). O mesmo
  desenho no casaco. Braços e pernas eram polígonos (quinas no joelho e no cotovelo com coxa grossa).
- **Pelos**: traços retos de 0,8–1,1 unidade e 0,22–0,28 de espessura, sorteados sem direção — pontinhos (captura `02`);
  apareciam inteiros de uma vez aos 14 anos.
- **Criança com corpo de adulto**: a menina de 9 anos tinha cintura de ampulheta (captura `03`).
- **Joias iguais** — auditoria (`scripts/playtest/auditoriaJoias24.tsx`): 308 peças desenhadas de perto e no corpo, agrupadas
  pelo desenho sem cor. **14 grupos de modelos diferentes com desenho idêntico**: 9 relógios analógicos (um círculo numa tira),
  2 digitais, corrente grossa = gargantilha de couro, guias = colar de pérolas, pulseira de couro = de prata = "fina" do
  catálogo novo, pulseira de ouro = "elos", anel de prata/aço escovado = "aro liso", anel de ouro com pedra = solitário de
  diamante, e 6 pares de piercings que só mudavam a cor. 4 peças idênticas até na cor. No corpo, os pingentes do catálogo
  novo (coração, inicial, medalha, ponto de luz) eram todos o mesmo círculo. No retrato, todas as correntes antigas eram a
  mesma linha.
- **Aparência**: uma página longa com 7 seções empilhadas (cabelo e maquiagem, rosto, corpo e pele com 3 abas, roupas,
  guarda-roupa, tatuagem, piercings).

## 2. Criação do personagem — [OK]

Nova seção **"Corpo de nascença"** na tela Nascer (`ui/telas/CorpoDeNascenca.tsx`), ao lado dos atributos iniciais:
- **Puxar dos pais** (padrão), **Escolher** ou **Ao acaso**; "Tudo ao acaso" volta a "Puxar dos pais".
- Em "Escolher": as 13 formas de partida e os 12 eixos agrupados como predisposição — *Estrutura e crescimento* (altura,
  ombros, estrutura óssea, peito e tórax, quadril/bacia, pernas), *Onde o corpo acumula* (cintura e flancos, barriga, coxas,
  braços, panturrilhas), *Músculo* (facilidade para ganhar) — e os pelos do corpo (quase nenhum a muitos).
- Prévia do corpo **aos 6, aos 16, aos 30 sem treino e aos 30 treinando** (a conta do motor), altura adulta prevista e as
  tendências em palavras; com herança, o texto diz o que vem da mãe e do pai.
- O texto diz que não é o atributo Físico; os atributos (saúde, físico, felicidade, beleza, inteligência) ficaram intactos
  (teste: Físico 20 com dois corpos opostos → os dois nascem com 20).
- Validado no site oficial: nascer com "Escolher" grava exatamente os eixos escolhidos e `nasc24: "escolher"` (seção 13).

## 3. Herança e predisposições — [OK]

- `motor/criacao` (`corpo24`): herança = `sortearCorpo23` com a média dos dois pais (×0,7) mais variação própria (×0,55),
  de um gerador próprio da semente — nunca a cópia de um deles (teste); "ao acaso" ignora os pais; "escolher" grava o escolhido.
  Escolher o corpo não muda família, cidade nem aparência (teste).
- Papel de cada eixo (`v24/corpo/corpo24.ts · PAPEL24`): **estrutura** (aparece com o crescimento: dos 6 aos 15 anos a
  figura passa de corpo de criança a adulto), **distribuição** (pesa no desenho mais quanto mais gordura houver: com pouca
  gordura quase não aparece) e **músculo** (velocidade ±12%/nível e teto do ganho; não desenha músculo pronto).
- A tendência de altura escolhida/herdada entra na altura adulta de quem nasce a partir da VIDA 24
  (`modalidades.estaturaDaSemente`: 0,55·sorte + 0,8·eixo): bem alta × bem baixa = ≥ 15 cm (teste). Vidas antigas: a mesma
  altura de sempre (teste).

## 4. Evolução da condição corporal — [OK]

`Corpo.composicao24 = { g (gordura), m (músculo), r (regiões), h (histórico) }`, atualizada uma vez por ano
(`silhueta.evoluirCorpo24`, logo depois do condicionamento do ano, em `ano.ts`). Cada ano anda ~30% do caminho até o alvo
(gordura: no máximo 0,6/ano; músculo: no máximo 0,5/ano, mais lento depois dos 50; perder músculo é mais rápido que ganhar).
O alvo é a soma de fatores reais (`fatores24`), os mesmos que a tela mostra:
treino de força e aeróbico (das rotinas, do esporte de base/profissional, da farda e do trabalho braçal — `estimuloFisico`),
sedentarismo, condicionamento baixo, bebida, alimentação, objetivo, metabolismo com a idade (30–65), perda de músculo
(depois dos 45), bariátrica, doença sem tratamento e a predisposição. Testado ano a ano:
sedentário (sobe sempre, nunca > 0,6/ano, acima do peso só depois de anos), musculação (atlético no 2º ano, musculoso só
depois de vários), esporte (gordura desce sem virar fisiculturista), dieta (menos/mais), parar de treinar, predisposições
opostas e a criança (quase sem músculo). O "tipo de corpo" que o resto do jogo usa (lipo, bariátrica, textos) passa a ser
lido da composição. Comer menos custa 2 de felicidade por ano. Não é simulação médica: duas grandezas e fatores legíveis.

## 5. Objetivos físicos — [OK]

Aparência · Corpo · Objetivo (ação `corpo24 · plano`, a partir dos 13): ganhar massa, ganhar definição, aumentar a força,
melhorar o condicionamento, reduzir gordura, ganhar peso, melhorar a resistência, desenvolver uma região (braços, ombros,
peitoral, costas, abdômen, pernas, glúteos); e a alimentação (como sempre, equilibrada, comer mais, comer menos).
- O objetivo só pesa com a atividade que pede (massa/força/região: treino de força; condicionamento/resistência: aeróbico —
  e estes também sobem o condicionamento em +3/+2 por ano). A tela diz "a sua rotina já tem o que ele pede" ou o que falta.
- "Seguir esse plano" grava o plano e **não muda o corpo** (teste e QA: a figura de hoje fica idêntica). A prévia ao lado é a
  **projeção de 5 anos** mantendo rotina e plano (`projetar24`), marcada como "projeção" e tracejada.

## 6. Gordura — anatomia e desenho — [OK]

- `Figura.perfilDoTronco` + `curva` (Catmull-Rom em Bézier): o lado do tronco passa por axila, costelas, cintura, barriga,
  alto do quadril e quadril com transições contínuas; a barriga alarga em volta do umbigo e desce suave (limite: até 3,5 além
  do maior entre peito e quadril). O mesmo perfil no casaco; braços e pernas também em curva. Arco suave abaixo do umbigo na
  pele quando há muita barriga. Capturas `07`–`09`.
- Distribuições diferentes com a mesma gordura: maçã (barriga e cintura), pera (quadril e coxas), braços (captura `08`).
- Gordura, músculo e estrutura são camadas separadas (deltas de gordura, de músculo e da constituição).
- Os 5 corpos de antes são reproduzidos exatamente pelas âncoras da composição (captura `11`), então nenhum save "pula".

## 7. Pelos — [OK]

- Fios curvos na direção do crescimento (antebraço para baixo e para fora, canela e coxa para baixo, peito abrindo do
  esterno, linha do umbigo, costas em leque com "muitos"), numa grade com sorteio (sem amontoar), comprimento 1,6/2,1/2,6,
  espessura 0,34/0,37/0,42, e com "muitos" uma sombra leve da cor do pelo (captura `12`).
- Idade: nada antes dos 11, completos aos 19 (`pelosDaIdade24`) — captura `13`.
- Cuidados (Aparência · Pelos, ação `corpo24 · pelos`): aparar (de graça, menos e curtos), raspar (some), cera (cobra por ano;
  sem dinheiro, para), laser (pago uma vez; depois de um ano de sessões, a região fica sem pelos para sempre — `laser24`).
  O nível natural é de nascença (não se edita depois).

## 8. Aparência reorganizada — [OK]

Categorias em abas: **Corpo · Pele e marcas · Pelos · Cabelo e rosto · Piercings e joias · Roupas e estilo · Tatuagens**
(tatuagens a partir dos 16 ou se já tiver). Uma categoria por vez, cada uma com figura na escala de referência (132 px);
a escolhida fica lembrada (sessionStorage, com fallback em memória). Nada foi removido: cabelo, maquiagem e detalhes do rosto
em "Cabelo e rosto"; piercings e as joias em uso em "Piercings e joias"; roupas, looks e guarda-roupa em "Roupas e estilo".
No celular as abas quebram em linhas (nenhuma escondida).

## 9. Joias e piercings — [OK]

Depois da correção, a auditoria dá **0 grupos de modelos diferentes com o mesmo desenho** e 0 peças idênticas na cor
(`docs/vida24/auditoria-joias-{antes,depois}.json`). Os 58 grupos restantes são o mesmo modelo em metais diferentes
(diferem pelo acabamento: polido, acetinado, espelhado, escovado, fosco).
- **Relógios** (`avatar/joiasAntigas24.tsx`): caixa redonda/quadrada/tonel e tamanho, pulseira de couro com pesponto, de
  elos, de borracha ou malha, luneta graduada (mergulho), submostradores (cronógrafo), turbilhão, botões, índices; os digitais
  com visor e botões (captura `15`).
- **Correntes**: fina com elos, grossa com elos marcados, gargantilha alta de couro com argola, guias em duas voltas de
  contas, pérolas com brilho, riviera de diamantes com gota, medalha — no corpo e no retrato/vitrine (antes, uma linha só).
  Os pingentes do catálogo novo usam no corpo o mesmo desenho da vitrine (coração, inicial, medalha, gota) — captura `16`.
- **Pulseiras e anéis**: couro trançado com fecho, elos finos, grumet; aro largo polido, aro largo escovado com frisos,
  cabochão no engaste, solitário em garras (capturas `17`, `18`).
- **Piercings**: calibre (argola delicada × grossa), septo encorpado, ferradura e coração na sobrancelha, pedra em garras na
  medusa e no umbigo; o brinco meia-lua maior (capturas `19`, `20`). Nenhum item novo foi criado e nenhum preço mudou
  (o nome ou a descrição de 5 piercings ajustados para dizer o que o desenho mostra).

## 10. Compatibilidade — [OK]

- Campos novos opcionais: `Corpo.composicao24`, `plano24`, `nasc24`; `Visual.pelos24`, `laser24`. Normalizador
  `normalizarVida24` (estragado é limpo — teste). Abrir um save não cria nada (teste).
- Save antigo: a composição nasce no primeiro ano jogado, igual à condição em que estava (âncoras), e evolui a partir daí.
- Constituição, marcas e pelos da VIDA 23 preservados (a constituição só deixa de ser editável). Roupas, joias e piercings
  comprados e em uso intactos (o modelo da corrente em uso passa a ir para o retrato).
- A altura só muda para vidas criadas com o corpo de nascença (`nasc24`).

## 11. Testes e resultados reais

- **Novos**: `motor/__tests__/vida24Corpo.test.ts` (16) e `ui/__tests__/vida24.test.tsx` (10) — passam.
- **Atualizados por mudança de requisito** (sem afrouxar): `vida23Corpo` e `vida23` (a ação de proporções agora é recusada;
  marcas continuam), `rework1241` motor (o tipo instantâneo continua valendo sem composição; com composição, não muda na hora),
  `vida17` (o cenário "acima do peso" ganha a composição de quem já está assim), `rework1241` tela (abre "Roupas e estilo").
- **Suíte completa**: 2.941 passaram, 8 falharam, 1 pulado. 1 falha era desta entrega (o teste de tela acima) e passa depois
  do ajuste (os 10 arquivos afetados: 99/99). As outras 7 são limites de tempo fixos estourados sob carga: `att3` e
  `profissao` passam sozinhos; `fechamentoMundo #4` e a "regra de agência" (`motor`) já falhavam antes; `fixPosPlaytestHumano`
  ("o resultado não é garantido") e `rework115Esportes` ("basquete e vôlei") estouram 20 s e **falham igual no commit
  publicado anterior (`30f9cf1`) nesta máquina**. Os 18 avisos de "EnvironmentTeardown" já existiam (22 na VIDA 23).
- `tsc` limpo; build sem avisos (maior pacote `motor-textos` 799.896 B < 800 kB; pacotes novos `motor24-corpo`,
  `motor24-acao`, `Corpo24`); smoke de produção **32/32**.
- **QA no app** (`scripts/playtest/vida24.mjs`), 1440 claro, 820 escuro, 390 escuro, 360 claro: nascer (herança e escolher,
  12 eixos, 4 prévias), Corpo (2 figuras de 132 px), objetivo confirmado sem mudar a figura de hoje, Pele e marcas, Pelos
  (aparar confirmado), Cabelo e rosto, Piercings e joias, Roupas e estilo; sem rolagem horizontal; 0 erros de console;
  depois de recarregar: categoria lembrada, plano e cuidado gravados.

## 12. Evidências (docs/vida24)

Antes: `01` gordura triangular, `02` pelos em pontinhos, `03` idades, `04` relógios, `05` colares, `06` pulseiras.
Depois: `07` gordura −1,5 a +3, `08` distribuições, `09` costas/casaco/vestido, `10` músculo e regiões, `11` âncoras = antes,
`12` pelos 0–3, `13` pelos por idade e cuidados, `14` crianças, `15`–`20` joias e piercings, `21`–`27` app,
`28`–`30` produção.

## 13. Commit e branch de produção — [OK]

Código em `9132b06`. `main` e a branch de produção `claude/fix-pos-rework3-playtest` avançaram por fast-forward
(`30f9cf1..9132b06` e `1fcf33b..9132b06`), sem force-push. Este relatório vai num commit só de documentação em `main` e na
branch da entrega.

## 14. Deploy e versão publicada — [OK]

Cloudflare Pages publicou ~6 min depois do push: https://vida-game.pages.dev/ serve `index-Brgy1MY4.js`. A página inicial e
os 158 arquivos JS/CSS servidos são idênticos (sha256) ao build local do commit. QA no site oficial a 1440 (claro) e 390
(escuro): todos os passos acima, 0 erros. Nascimento real no site com "Escolher": o save gravado no IndexedDB tem
`nasc24: "escolher"`, `corpo23: "411131141233"` (altura +2, ombros −1, coxas +2, músculo +1, como escolhido) e pelos 3.

## 15. Pendências e limitações reais

- **[PENDENTE]** Playtest humano: só testes automáticos e QA visual.
- **[PARCIAL]** NPCs: continuam com a constituição, marcas e pelos da VIDA 23 (diversos, com muita gente sem marca), mas não
  têm composição que evolui — o corpo inteiro (figura) só existe para o jogador; as pessoas do mundo aparecem em retrato.
- **[PARCIAL]** Pelos: densidade, comprimento e cor seguem o nível natural e a cor do cabelo; não há escolha separada de
  comprimento/densidade por região além dos cuidados (aparar, raspar, cera, laser por região).
- **[OK, por desenho]** A altura de quem nasceu antes da VIDA 24 não muda (é a mesma do esporte); só as vidas novas seguem a
  tendência escolhida.
- Os 58 grupos de "mesmo modelo, outro metal" diferem pelo acabamento e pela cor, não pela forma — por decisão (é a mesma peça
  em outro metal).
- O Manual Mestre e as capturas do pedido não foram recebidos.
