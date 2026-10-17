# REWORK 7 — VIDA COMO JOGO

Reformulação de UX, UI, arquitetura de informação e experiência interativa.
Branch `claude/fix-pos-rework3-playtest`, sobre `40be963` (HOTFIX barbas, que já contém o HOTFIX cabelos `a795435`).
Save continua **v20** (nenhuma migração). Bundles abaixo de 800 kB (limite intocado).

> "O jogo simula o mundo, eu ajo dentro dele e nós dois produzimos a biografia."

---

## 1. Diagnóstico inicial

Auditoria feita sobre o código real e sobre **capturas reais** das telas (o build da base `40be963`, as 26 cenas do
REWORK 6.5 em 1440 e 390 px, claro e escuro — `scripts/playtest/rework65.mjs` — e depois as 38 jornadas novas deste
rework, `scripts/playtest/rework7.mjs`). A base não tinha erro técnico (0 problemas de geometria, 0 erros de console):
os problemas eram de **experiência**.

### Matriz de diagnóstico (antes)

| Área | Essencial | Ação principal | Repetido / texto demais | Componente genérico mal usado | Espaço / legibilidade | Oportunidade perdida |
|---|---|---|---|---|---|---|
| Linha da Vida | biografia, sinais | viver o ano | — | sinais cortados ("BEM-E…", "APREN…") | ok | quem estava em cada história (rosto) |
| Você | como está (3 estados) | cuidados | frase do momento contradizia o cartão ("a cabeça vem enchendo" ao lado de "Cabeça: tranquilo"; "anda para baixo" com "levando") | "No que você é bom" em `dl` de texto | retrato 176 px + título de 2,35 rem | as habilidades com progresso; personalidade escondida no fim |
| Pessoas (ficha) | quem é, como estão | o que faz sentido agora | — | cinco gavetas `<details>` com botões de peso igual | modal estreito, tudo em coluna | o estado do laço (afeto, confiança, atrito) em palavras; história como trajetória |
| Formação | onde estuda, notas | estudar, atividades | — | — | **o histórico vinha antes do agora** | como está em cada matéria; "notas bom" (concordância) |
| Trabalho | situação, renda | dia a dia, mais ações | — | `Dado` em cartões iguais para todas as carreiras | — | identidade de cada família de carreira; a trajetória profissional fechada por padrão |
| Tempo livre | a semana, o estresse | começar/parar atividades | causa do estresse duplicada ("as contas atrasadas · moderado" e "· leve") | **lista de catálogo** para o que já se pratica e para o que se começa | título de 3,2 rem em duas linhas; práticas abaixo da dobra | evolução, pessoas, objetos e história de cada atividade (o motor já tinha tudo) |
| Vida · Casa | onde mora | procurar casa | — | — | página quase vazia | quem mora com você (rostos); o que há em casa |
| Vida · Compras | lojas | abrir loja | lede explicando o óbvio | **o mesmo cartão com ícone para imobiliária, carro e violão** | título enorme, muito vazio | os objetos de verdade à venda; o que já é seu dali; o que rende no que você pratica |
| Vida · Compras (criança) | — | — | — | **parede de lojas desabilitadas** | — | a família de onde as coisas vêm |
| Vida · Cidade | custo, salários | mudar | — | grade de dados | — | os lugares desta vida; o que a cidade viveu |
| Vida · Dinheiro / Pertences | o mês, o que é seu | usar, vender | — | — | ok | o objeto ligado à prática ("você pratica há 4 anos") |
| Redes sociais | a conta, publicar | publicar | parágrafo de aviso no alto | **a mesma lista para as sete redes** | — | o formato de cada rede |
| Decisões / avisos | o momento, as opções | escolher | — | — | ok (decisão já se destaca da notificação) | — |
| Navegação | 7 áreas estáveis | — | — | — | — | intenções do playtest sem lugar; menu sem busca |
| Motor | — | — | mensagem "A uma estante de livros é seu agora" | — | — | voltar a ler/desenhar depois de anos não contava como retomada |

## 2. Problemas estruturais encontrados

1. **O motor sabia mais do que a tela mostrava.** Cada atividade já tinha frente (habilidade, auge, meses, retomadas),
   marcas do caminho, marcos de vivência, palco, pessoas conhecidas ali (o vínculo guarda o ambiente
   `rotina:<id>:<cidade>`) e objetos que rendem nela (`coisas.ajuda`) — e Tempo livre mostrava só nome, dose e preço.
2. **Um componente para tudo.** `lugar-botao` (ícone + nome + frase) servia à imobiliária, à concessionária e à livraria;
   `Dado` em cartões idênticos servia ao salário, à pena e ao contrato de atleta.
3. **A ordem das camadas invertida** em Formação (histórico antes do agora) e em Tempo livre (o estresse antes do que
   se pratica).
4. **Títulos-cartaz**: `--type-hero` de até 3,2 rem empurrava as ações para fora da primeira tela.
5. **Pequenas contradições de leitura** (frase × cartão; causa repetida; concordância).

## 3. Direção de design escolhida

**Memória, caderno vivo.** A paleta, as fontes e a moldura do REWORK 6/6.5 ficam (claro, escuro e automático
intactos — só `--p-*` muda no escuro). O que muda é a **composição**: cada coisa ganha a forma da sua natureza.

- **Títulos em tamanho de leitura** (`--type-hero: clamp(1.55rem, 1.25rem + 1.1vw, 2.15rem)`, `text-wrap: balance`):
  o alto da página diz a situação e sai do caminho.
- **Menos caixas**: dados viram uma faixa editorial (fio fino no alto, sem cartão); caixa só para o que é uma COISA
  (uma prática, uma vitrine, uma ficha).
- **Cor semântica e material**: o tom da categoria (esporte, arte, estudo, ofício…) e da família de carreira sai dos
  tons das áreas; a cor de um objeto é a do próprio objeto (a cor do carro do anúncio, o acabamento do violão).
- **Desenho de traço, não emoji**: emblemas próprios para 60 atividades e 24 famílias de carreira (`Emblemas.tsx`), na
  mesma espessura dos ícones das áreas.
- **Três peças novas de linguagem** (em `comum.tsx`): `Degraus` (os seis estágios reais de uma habilidade, em altura
  crescente, com o auge marcado — não é barra de progresso: cada degrau é uma frase do motor), `Percurso` (o fio da
  trajetória, o ano na margem, o que pesou com mais tinta) e as abas locais (um grupo de ações por vez, com a contagem).
- **Movimento discreto** só para mudança de estado e abertura (`surgir`, 200 ms), nada com `prefers-reduced-motion`.

## 4. Alterações por aba

**Linha da Vida** — o marco ganha o fio do tema na margem do texto; a escolha, a tinta cheia; a história de uma relação
traz o **rosto de quem estava nela** (a idade de então; um toque abre a ficha da pessoa); o selo "este ano" não quebra
mais. Os sinais do alto deixam de cortar o nome. A navegação entre anos, a posição de leitura e o avançar `sticky`
continuam (testes do REWORK 6 passam).

**Você** — o rosto menor e o momento em tamanho de leitura; a frase do momento **nunca contradiz o cartão** (corte de
"para baixo" alinhado a `palavraHumor`; "a cabeça segue tranquila, mas X começa a pesar" quando a tendência piora com a
cabeça ainda tranquila). Nova ordem: como está (bem-estar, cabeça, saúde) → corpo e aprendizado → **No que você é
bom** com os degraus de cada habilidade (praticando ou parada) → **O seu jeito** (os traços como marcas, não uma frase
no fim) → saúde (sinais e condições lado a lado) → aparência → dinheiro → nome, mundo, construção, linhagem.

**Pessoas** — a ficha virou o **retrato de uma relação** (modal largo, duas colunas a partir de 761 px): quem é, o estado
da relação ("em conflito", "se aproximando"), o **laço em palavras** (afeto, confiança, atrito — os números do vínculo,
lidos), o que aconteceu por último, a trajetória; do outro lado, **Conviver**: o chamado, "o que faz sentido agora"
(até três, a primeira cheia) e o resto em **abas de convivência** (Fazer juntos, Conversar, Cuidar e ajudar, Algo
mais, A relação), com a contagem; depois a memória (o que você sabe, coisas de vocês, a vida dela, o que viveram juntos
como percurso). Todas as ações continuam na página (as abas de fora só não aparecem).

**Formação** — três camadas: **agora** (o caminho passado → agora → portas; "Como você está se saindo", com cada matéria
nos degraus do motor e o nome da matéria do país onde se estuda — "japonês" no Japão; o lugar e o que dá para fazer
nele; o ano letivo), **depois** (portas, preparação, objetivos, cursos) e **histórico** (formação concluída, o que
ficou, a história de cada escola — recolhida). "Notas bom" virou "desempenho bom".

**Trabalho** — o alto da página tem o **emblema do ofício** e o **tom da família de carreira** (saúde em verde-folha,
ensino em azul, palco em ameixa, esporte em verde-mar, serviço público e segurança em cinza-azulado, a pena em cinza;
diarista = coração, atleta = bola, pedreiro = capacete, preso = grade, desempregado = lupa). "Por onde você passou" virou
um **percurso** (o trabalho de agora, os empregos com os anos, os marcos de carreira), aberto quando há história. Os
painéis próprios de cada carreira (negócio, freguesia, campo, atleta, base, farda, carreira pública, estrada, política,
pena, foragido, academia) continuam.

**Tempo livre** — ver §7.

**Vida** — ver §9.

## 5. Alterações em componentes compartilhados

| Componente | Onde | O que é |
|---|---|---|
| `Degraus` | `comum.tsx` | estágio de habilidade em degraus (6 ou 5), com auge; `role="img"` com a palavra |
| `Percurso` | `comum.tsx` | trajetória vertical (atividade, carreira, relação, cidade), "Toda a história (N)" |
| abas de convivência | `Pessoas.tsx` + `.abas-locais` | `role=tablist` com teclado (`navegarAbas`); os painéis de fora ficam na página, escondidos pelo CSS — nenhuma ação some |
| `Emblema`, `EmblemaDoOficio` | `jogo/Emblemas.tsx` | desenhos de traço por atividade / família de carreira |
| `CartaoPratica`, `FichaPratica` | `jogo/Pratica.tsx` | a prática e a sua ficha |
| `Compras`, `CartaoVitrine` | `jogo/Compras.tsx` | as vitrines |
| `.dados` / `.dado` | `vida.css` | de cartões iguais para faixa editorial (todas as áreas ganham) |
| `.folio` | `vida.css` | título em tamanho de leitura, menos respiro vazio |
| `experiencia.css` | nova folha | só tokens (0 hex; testado), nada pergunta pelo tema (testado) |

## 6. Mudanças de arquitetura de informação

Cada tela foi reorganizada nas três camadas — **visão imediata** (o que preciso saber agora), **ação e contexto** (o que
posso fazer, com o porquê) e **histórico e detalhes** (recolhido, a um toque) —, sem esconder ação importante atrás de
mais de um toque.

| Tela | Camada 1 — agora | Camada 2 — fazer | Camada 3 — histórico |
|---|---|---|---|
| Tempo livre | as portas da semana; **o que você pratica** (cartões) | o estresse (o que pesa, o que ajuda, se cabe mais); começar algo; o trajeto | a divisão da semana (recolhida); a ficha de cada prática com a história |
| Ficha da prática | como você está nisso (degraus, palavra, auge) | dedicação, porta aberta, fundamentos, usar o objeto, parar | a história da prática; a gente de lá |
| Pessoas (ficha) | quem é, o estado, o laço em palavras, o último acontecimento | conviver: o chamado, o que faz sentido agora, as abas de convivência, o presente | o que você sabe, coisas de vocês, a vida dela, o que viveram (percurso) |
| Você | o rosto, o momento, os três estados | corpo e aprendizado, habilidades, o jeito, a saúde (com os cuidados) | aparência e estilo, o nome, o mundo, o que construiu, a linhagem |
| Formação | o caminho (passado → agora → portas), como vai em cada matéria | o lugar e o que fazer nele, o ano letivo, portas, preparação, cursos | a formação concluída, o que ficou, a história de cada escola (recolhida) |
| Trabalho | o ofício (emblema, família, título), a situação agora, o painel da carreira | o dia a dia, as ações, em paralelo, as portas, procurar | as devolutivas, a trajetória, o currículo, o palmarés, os momentos, por onde passou |
| Compras | o que há na conta; as vitrines abertas | abrir a loja (comprar, alugar, adotar), a carteira de motorista | "Mais tarde" / "Quando cada lugar se abre" |
| Casa | onde e com quem mora (a cena e os rostos) | procurar casa, quem paga, viver a casa | o que há em casa → Pertences |
| Cidade | custo, salários, aluguel, transporte | os seus lugares, mudar de cidade ou de país | o que a cidade viveu nos últimos anos |
| Linha da Vida | o rosto, o momento, os sinais; o ano que passou e "Enquanto isso" | viver mais um ano | a biografia, 20 anos por vez |

## 7. Mudanças nas atividades

`ui/leituraPratica.ts` é a leitura de uma atividade, **toda derivada do estado do motor** (nenhum dado novo): a rotina
(desde quando, dedicação, custo local, quanto da semana), a técnica que ela ensina (estágio, palavra, auge, anos de
prática de verdade — `anosDePratica` —, retomadas, a frase de `leituraDaFrente`), as habilidades exercitadas ao lado,
**o que ela desenvolve quando não ensina técnica** (academia e corrida → condicionamento; leitura e xadrez →
aprendizado, com a mesma palavra, nível e linha dos últimos anos de Você), o que muda na vida (`estado.BEM_ESTAR`,
`estimuloFisico/Cognitivo`, renda), a etapa da vivência (o time, a olimpíada), **as pessoas conhecidas ali**, **os
objetos seus que rendem nela** (ou o que ajudaria e onde se compra), a história (o começo, as marcas da frente, os
marcos da vivência, os anos de palco, as tentativas) e as portas abertas da frente.

- **"O que você pratica"** vem primeiro em "A semana": cartões com emblema, tempo na semana, degraus, a linha de custo,
  o efeito, a leitura (a mesma frase de antes — "Condicionamento: razoável. Treina o corpo — não ensina um esporte."),
  o que está acontecendo agora, e "Mais a sério".
- **A ficha da prática** (um toque no cartão): como você está nisso, o que exercita, o que muda na sua vida, com o que
  pratica (com os usos do objeto: "Tocar", "Treinar em casa"), a gente de lá (um toque abre a pessoa), a dedicação
  (os três níveis com dose e custo, o atual marcado), o programa de fundamentos, a porta aberta, "tentar ir mais longe"
  (Trabalho), parar — e a história.
- **"Para começar"** virou grade de atividades com emblema, motivo (nas sugestões), dose e preço; o resto do catálogo,
  "o que não cabe nos dias" e "fora de alcance" continuam recolhidos com o motivo.
- Prática recorrente (rotina), ação pontual (usos, cuidados), evento automático (marcas/vivências) e decisão
  importante (momentos) continuam distintos.

## 8. Mudanças nas carreiras

Identidade por **família de carreira** (`dados/carreiras`, 24 famílias) e por situação (negócio, base, atleta,
artista, política, pena, procura, aposentadoria, pausa): emblema e tom próprios (`chaveDoOficio`), a família escrita no
alto ("· saúde", "· ensino"). Os painéis existentes continuam o coração de cada carreira (o placar e a temporada do
atleta, a conta do negócio, a freguesia, a terra, a farda e a escada de postos, a estrada da carteira assinada, o
mandato, a pena). A trajetória profissional virou percurso. **Não** foram criados sistemas novos de casos para Medicina
ou Direito (ver §20).

## 9. Mudanças em Compras e Vida

**Compras** (`jogo/Compras.tsx`) — cada lugar é uma **vitrine de verdade, deste ano e desta cidade**: os carros zero e
os usados que estão à venda (o desenho da forma, **a cor do anúncio**), as motos e bicicletas, as casas para alugar
(miniaturas das ofertas, "aluguel a partir de R$ 530/mês"), os instrumentos/livros/esportes (os objetos da loja, primeiro
os que rendem no que você pratica), os bichos do abrigo (o retrato de cada um). Cada vitrine diz **a partir de quanto**
(o mínimo das ofertas do motor), **o que já é seu dali** ("Seu: teclado", "Na garagem: …") e **o que rende numa
prática sua** ("Violão rende em 'tocar um instrumento'"). A ordem segue a vida: onde morar → ir e vir → as coisas do dia
a dia → o que se usa no corpo → serviços (banco, oficina, a carteira de motorista) → os bichos. O alto diz o que há na
conta e a segurança.
- **Para criança** (< 10): nada de lojas desabilitadas. A casa de onde as coisas vêm (como anda o dinheiro de casa,
  **quem compra** — os rostos, o trabalho de cada um), **o que já é seu** e, recolhido, **quando cada lugar se abre**
  (aos 10, 12, 16, 18 — com o motivo de `autonomia`). Dos 10 aos 17, as lojas abertas aparecem; as fechadas viram uma
  linha "Mais tarde: … (aos 18)".

**Casa** — **Quem mora com você** (os rostos, a relação; um toque abre a ficha) e **O que há em casa** (os objetos
desenhados; "Usar, cuidar, vender — em Pertences →").
**Cidade** — **Os seus lugares aqui** (onde estuda, onde trabalha, onde pratica cada atividade, a rede de saúde do país)
e **Na cidade, nos últimos anos** (os acontecimentos do mundo que são daqui: a festa, a obra, a crise).
**Pertences** — "Rende mais: tocar um instrumento (você pratica há 3 anos)": o objeto conhece a prática.
**Dinheiro** — sem mudança de estrutura (já era detalhado); ganhou a faixa de dados nova.

## 10. Melhorias de navegação

- Nove intenções novas no mapa (`MAPA_DE_INTENCOES`), as do playtest: sair com um amigo, tocar violão, melhorar o
  condicionamento, ver o que pratico, ver a carreira, quanto ganho, o que tenho em casa, o histórico escolar, o que
  aconteceu com a família. Cada uma é **conferida por clique** em `navegacao.test.tsx` (o lugar mostra o que promete).
- **Busca no menu "Onde fica cada coisa"** (sem acento: "violao", "salário", "mãe").
- Novos caminhos de dentro: rosto na biografia → ficha; pessoa da prática → ficha; prática → loja; prática → Trabalho
  ("tentar ir mais longe"); morador → ficha; casa → Pertences.

## 11. Melhorias de interação

- A dedicação de uma prática é um seletor de três níveis com dose e preço ditos antes.
- Abas de convivência na ficha (teclado: setas, Home, End).
- Os objetos com uso aparecem dentro da prática (usar o violão onde se toca).
- Feedback: as ações seguem o caminho do REWORK 6 (aviso breve para ação simples; "O que mudou" quando muda coisa; a
  decisão em carta com "Sua vez" e o detalhe de cada opção) — sem modal novo.

## 12. Novas conexões com o motor (e lacunas corrigidas)

| O quê | Arquivo | Efeito |
|---|---|---|
| **Retomada pela frente da atividade** | `motor/acoes.ts` | voltar a ler/desenhar/fotografar depois de anos agora é retomada (antes procurava a frente pelo id da atividade: `frentes.leitura` não existe) — biografia "Voltou a ler depois de N anos" e marca `retomada` com o domínio certo |
| **Causa do estresse sem duplicata** | `sistemas/estado.ts` (`leituraDoEstado`) | o mesmo nome (o peso de fundo e o abalo do mês) aparece uma vez, com o tamanho somado; só a leitura junta — a conta do ano não muda |
| **Concordância da compra** | `sistemas/coisas.ts` | "A estante de livros é sua", "Os livros… são seus" (era "A uma estante de livros é seu") |
| Frase do momento × cartão | `ui/estadoPessoal.ts` | sem contradição (ver §4) |
| Leitura da prática | `ui/leituraPratica.ts` | nova, derivada (nada salvo) |

Nenhum estado novo no save. Saves idênticos byte a byte para as mesmas sementes, exceto onde a correção da retomada
escreve o que antes faltava (ver §17).

## 13. Testes causais (novos — `src/ui/__tests__/rework7.test.tsx`, 18 testes)

| Cadeia | Teste |
|---|---|
| **Atividade** iniciar → praticar 3 anos → a habilidade sobe → o cartão e a ficha mostram o estágio e a palavra do motor → save → reabrir dá a MESMA leitura (`toEqual`) | `a música, três anos…` |
| dedicação: "Mais a sério" na ficha → o motor troca o nível → a ficha marca o atual | `a dedicação muda pelo motor…` |
| academia: não ensina esporte → a ficha mostra o condicionamento → a mesma palavra de Você | `a academia não ensina um esporte…` |
| **Compra** comprar o violão → bônus do motor > 0 → Pertences ("você pratica há 3 anos") → a ficha da prática mostra o violão → save preserva | `o violão comprado é seu…` |
| a vitrine mostra os veículos à venda e o mínimo do motor; os grupos na ordem da vida | `Compras mostra a vitrine de verdade…` |
| a loja diz o que é seu dali e o que rende no que você pratica | `a loja de instrumentos…` |
| **Relação** o laço em palavras é o do vínculo; depois de agir pelo motor, a ficha relê | `o laço em palavras…` |
| **Carreira** trabalhar → pedir demissão → o emprego entra no percurso; família de carreira na página | `pedir demissão leva…` |
| três ocupações de famílias diferentes → três identidades | `cada família de carreira…` |
| **Atributo** praticar desenho 4 anos → Você e Tempo livre mostram a mesma palavra do estágio (consistência entre abas) | `a habilidade praticada…` |
| a frase do momento não contradiz o cartão | `a frase do momento…` |
| **Formação** cada matéria com a palavra do estágio do motor, nome do país | `na escola, "Como você está se saindo"…` |
| **Gerações** o pai morre com um violão → a filha continua → o violão está em Pertences → a biografia "Ficou com o violão de…" traz o rosto → save | `o violão do pai fica com a filha…` |
| **Mundo** vivendo pela tela, "Enquanto isso" traz o que o mundo fez → "Ver X" abre a ficha | `vivendo os anos pela tela…` |
| **Navegação** as intenções novas existem; a busca do menu acha e leva à aba | `as intenções do REWORK 7…` |
| **Motor** retomada pela frente; causa do estresse sem duplicata | `lacunas causais corrigidas…` |
| **Offline** | `pwa.test.tsx` + `scripts/pwa/offline.mjs`, 34/34 (ver §23) |

### Testes existentes alterados (e por quê)

| Teste | Mudança | Justificativa |
|---|---|---|
| `navegacao.test.tsx` · "Compras para uma criança" | de "as lojas existem, bloqueadas com o motivo" para "primeiro a família; as lojas existem, recolhidas, com a idade e o motivo" | o REWORK 7 pede explicitamente que a criança não veja uma loja inteira de ações desabilitadas. O teste continua cobrando que as lojas existem e dizem o motivo ("Menor de idade não decide onde mora"), e agora também cobra a família e a ausência de botões desabilitados |
| `fixPosPlaytestHumano.test.tsx` · "o que faz sentido agora vem primeiro" | de `details.ficha__grupo` fechados para abas (`role=tab`/`tabpanel`, uma à vista) | a estrutura mudou (gavetas → abas); a exigência é a mesma (agora ≤ 3; o resto agrupado e recolhido; nada some; "Algo mais" com a ação dentro) e ficou mais estrita (clica na aba e confere o painel) |
| `navegacao.test.tsx` · mapa de intenções | + 9 expectativas | novas intenções |
| `rework6.test.tsx`, `rework65.test.tsx` | + `experiencia.css` e os componentes novos nas auditorias de tokens/tema | aperto, não afrouxamento |

Nenhum teste foi afrouxado para passar.

## 14. Resultados de playtest (jornadas adversariais)

Dez vidas vividas pelo motor (`scripts/playtest/gerarRework7.ts`) + as do REWORK 6 (atleta, presa, rica, decisão, morta)
e uma influencer (quatro redes com publicações). Cada uma percorrida nas telas reais, dois temas, 1440/820/390/360 e
390×560 (`rework7.mjs`, 38 cenas, **380 capturas, 0 problemas**: nenhum texto sobre texto, nenhuma rolagem horizontal,
nenhum elemento estourando a borda, o avançar sempre visível e não coberto, nenhum erro de console, nenhum alvo de
toque < 32 px).

| Jornada | Encontra as ações? | A tela explica? | Excesso? | Celular | Observações |
|---|---|---|---|---|---|
| Criança (9, futebol e desenho) | sim — Hobbies mostra o que faz e o que começar | sim | não | ok | Compras mostra a família (antes: 15 lojas desabilitadas) |
| Adolescente (15, música, violão) | sim — o violão aparece na ficha da música, com "Tocar" | sim | não | ok | a ficha diz "nos primeiros acordes" e as duas amigas da música |
| Jovem adulto (22, academia, corrida, leitura, cozinha) | sim | sim — "O que isso desenvolve: condicionamento" com a linha | não | ok | estresse sem causa duplicada |
| Adulto empregado (37, diarista) | sim — emblema do cuidado, dia a dia, mais ações | sim | o painel de freguesia ainda é denso | ok | |
| Adulto desempregado (31) | sim — a lupa, "Procurar outro caminho" aberto | sim | não | ok | |
| Pessoa com família (42, cônjuge e filhos) | sim — Casa mostra quem mora; a ficha do marido em duas colunas | sim | não | ok | |
| Várias atividades (28, cinco) | sim — cinco cartões, degraus distintos | sim | a semana tem muita informação, mas recolhida | ok | |
| Carreira especial (atleta) | sim | sim | o painel do atleta é longo (dado) | ok | emblema da bola |
| Idosa (80) | sim | sim | biografia longa paginada | ok | sinais sem corte |
| Outro país (Portugal, Japão) | sim | sim — "japonês" como matéria, € em Lisboa, SNS | não | ok | 0 vazamentos Brasil→mundo (`scripts/sim/vazamentos.ts`, 10 países × 2 vidas) |

## 15. Comparação de desempenho

Medido com o mesmo save nos dois builds (`scripts/playtest/desempenho7.mjs`: clique numa área → dois quadros pintados,
mediana de 5; e abrir a primeira ficha de pessoa), Chromium headless, 1440 px.

| Área | empregado antes | empregado depois | rica antes | rica depois | idosa antes | idosa depois |
|---|---|---|---|---|---|---|
| Você | 14.1 | 13.8 | 16.4 | 17.4 | 11.2 | 12.4 |
| Pessoas | 20.2 | 17.6 | 11.9 | 11.8 | 4.2 | 4.3 |
| Formação | 17 | 17.2 | 12.8 | 12.6 | 11.2 | 12.3 |
| Trabalho | 5.5 | 6.4 | 4 | 4.5 | 2.9 | 3.5 |
| Tempo livre | 6.3 | 9.2 | 4.8 | 4.7 | 5.3 | 5.9 |
| Vida | 4.4 | 6.3 | 4.4 | 5.2 | 3.4 | 3.2 |
| Linha da Vida | 11 | 18.1 | 12.3 | 13.6 | 8.6 | 11.3 |
| ficha | 6.3 | 9.8 | 9 | 8.8 | 0.2 | 0.2 |

Milissegundos, mediana de 9 cliques por área (a tela nova renderizada e com o layout calculado — uma tarefa postada
depois do clique roda depois da renderização do React). "ficha" = abrir a ficha da primeira pessoa (a vida idosa não
tem ninguém em "Com você": não abre ficha, por isso ~0).

- A única regressão sensível foi a **Linha da Vida** (11 → 25 ms) na primeira versão, porque cada história de gente
  desenhava o retrato de quem estava nela (~1,4 ms por retrato; medido trocando o limite de rostos entre 0, 4 e 10).
  Corrigido: os rostos desenhados ficam nas **4 primeiras histórias de gente** na ordem de leitura; as outras levam o
  nome com o mesmo toque. Resultado: 11 → 18 ms (empregado), 12 → 14 ms (rica), 9 → 11 ms (idosa).
- Você ficou ~1 ms mais lento (os degraus das habilidades); o resto está no ruído (± 2 ms).

Motor (gerar as 11 vidas do playtest, `gerarRework7.ts`, 3 rodadas, base × novo): 13,3–16,3 s nos dois (rodadas alternadas: base 16,3 / 16,3 / 13,3 s; novo 13,3 / 13,3 / 16,1 s) — sem regressão
(o motor praticamente não mudou; a diferença está no ruído da máquina).

## 16. Comparação de bundles (limite 800 kB, intocado)

| Pacote | Base (bytes) | REWORK 7 (bytes) | Diferença |
|---|---:|---:|---:|
| motor.js | 747630 | 748024 | +394 |
| motor-textos.js | 733675 | 733675 | +0 |
| motor-dados.js | 457400 | 457095 | -305 |
| Jogo.js | 381724 | 425432 | +43708 |
| motor-carreira.js | 303075 | 303075 | +0 |
| react.js | 223223 | 223223 | +0 |
| index.css | 142795 | 168573 | +25778 |
| motor-conteudo.js | 132402 | 132489 | +87 |
| motor-vida.js | 112450 | 112450 | +0 |
| Retrato.js | 98364 | 99873 | +1509 |
| mundo-africa.js | 72256 | 72256 | +0 |
| mundo-europa.js | 67463 | 67463 | +0 |
| mundo-asia.js | 63198 | 63198 | +0 |
| mundo-america-sul.js | 43950 | 43950 | +0 |

(Os demais pacotes não mudaram de tamanho. Pasta `dist/` inteira: 10,18 MB → 10,26 MB.)

O crescimento está todo no pacote das telas (`Jogo`, +43 kB: Tempo/Prática, Compras, Emblemas, a ficha nova) e no CSS
(+25,7 kB, `experiencia.css`). Os pacotes do motor não mudaram de tamanho de forma relevante. O maior continua sendo
`motor` (748 kB).

## 17. Compatibilidade de saves

- **v20 preservada**, nenhuma migração, nenhum campo novo.
- A suíte de saves antigos (`src/motor/__tests__` — migrações v9…v19 e fixtures) passa inteira.
- Mesmas sementes, base × novo (`gerarRework7.ts` nos dois): 10 de 11 saves **idênticos byte a byte**; o do adulto
  empregado tem +182 bytes — a retomada da leitura que a base não registrava (uma linha de biografia e uma marca).

## 18. Capturas antes/depois

Em `docs/rework7/` (montagens das capturas reais do jogo, não mocks):

| Arquivo | O quê |
|---|---|
| `01-tempo-livre.jpg` | Tempo livre, antes × depois (as práticas primeiro; a causa duplicada sumiu) |
| `02-ficha-da-pratica.jpg` | a ficha da prática, claro e escuro |
| `03-pratica-celular.jpg` | práticas em 390, 390 escuro, 360 e 390×560 |
| `04-compras.jpg` | Compras, antes × depois (as vitrines com os veículos e as casas deste ano) |
| `05-compras-crianca.jpg` | Compras para uma criança, antes × depois (a família em vez de lojas desabilitadas) |
| `06-compras-celular.jpg` | Compras em 390 (claro e escuro) e 820 |
| `07-ficha-pessoa.jpg` | a ficha de uma pessoa, antes × depois |
| `08-ficha-pessoa-celular.jpg` | a ficha em 390 (claro e escuro) e 360 |
| `09-voce.jpg` | Você, antes × depois (frase alinhada ao cartão; habilidades com degraus) |
| `10-formacao.jpg` | Formação no Japão, antes × depois ("japonês" como matéria; o agora antes do histórico) |
| `11-trabalho.jpg` | quatro trabalhos, quatro identidades (cuidado, atleta, a pena, a procura) |
| `12-redes.jpg` | Instagram, YouTube, X e TikTok |
| `13-linha-da-vida.jpg` | Linha da Vida depois de viver um ano, antes × depois (o rosto de quem estava na história) |
| `14-casa-cidade.jpg` | Casa (quem mora, o que há) e Cidade (Lisboa, escuro: os lugares desta vida) |
| `15-temas.jpg` | Tempo livre e Compras nos dois temas |
| `16-tablet.jpg` | 820 px |

As 380 capturas completas (38 cenas × claro/escuro × 1440/820/390/360 + 390×560) ficam fora do repositório (tamanho);
regenerá-las: `gerarRework6.ts` + `gerarRework7.ts` → `rework7.mjs` → `montagem7.mjs`.

## 19. Problemas encontrados e corrigidos

1. "A cabeça vem enchendo" ao lado de "Cabeça: tranquilo" (Você) — frase alinhada ao nível.
2. "Anda para baixo" com bem-estar "levando" — corte alinhado a `palavraHumor` (45).
3. "As contas atrasadas" duas vezes na leitura do estresse.
4. "A uma estante de livros é seu agora" — concordância e artigo.
5. Retomada de atividade procurava a frente pelo id da atividade.
6. "Notas bom" / "Notas: fraco" em Formação — "desempenho".
7. Sinais da Linha da Vida cortados com reticências.
8. Selo "este ano" quebrando em duas linhas na margem.
9. Toda chamada nova de `<Retrato>` passa a espécie (auditoria de código do FIX pós-REWORK 3 pegou duas).
10. A grade do Instagram crescia demais em 1440 px (limitada).

## 20. Pendências reais

- **APK Android não regenerado** neste rework (não era prioridade): `public/android/vida.apk` ainda é o build do HOTFIX
  barbas. Nenhum teste em aparelho real foi feito.
- O painel do atleta e o da freguesia continuam densos (muitos dados); só ganharam a faixa nova.
- Medicina, Direito, Educação, Tecnologia não ganharam sistema próprio de casos/projetos — continuam com a estrada, o
  clima, o dia a dia e as situações do REWORK 5, agora com identidade visual própria.
- Compras no celular: as vitrines ficam em coluna única (legíveis, mas longas).
- Dinheiro não foi recomposto (já era detalhado); recebeu só a faixa de dados.
- Nascimento, Fim e Legado não foram redesenhados (herdam tipografia e tokens).

## 21. Funcionalidades que permaneceram superficiais

- Leitura: não há registro de livros lidos (a prática mostra o aprendizado e a língua, não títulos).
- Viagens: a experiência é comprada e narrada; não há memória por destino na ficha da prática.
- Twitch e Facebook usam o formato de lista/mural (o motor não distingue duração de live nem comentários).
- A ficha da prática de quem não tem frente nem vivência (videogame, sair à noite) tem pouca história além do começo.

## 22. Recomendações para o próximo playtest humano

1. Abrir Tempo livre e tocar numa prática: a ficha responde "como estou, o que muda, com o quê, com quem"?
2. Comprar um instrumento e voltar à prática: o objeto aparece e o uso faz sentido?
3. Em Pessoas, a ficha em duas colunas: as abas de convivência são achadas? Alguém sente falta de ver tudo de uma vez?
4. Compras com uma criança de 8 anos e com um adulto rico: o mundo material parece desta cidade?
5. Trabalho em três carreiras diferentes: parecem ofícios diferentes?
6. No celular de 360 px: a ficha da pessoa e a da prática se leem sem esforço?
7. O menu "Onde fica cada coisa" com busca: as palavras do jogador acham o lugar?

## 23. Validação final (Node 22)

| Verificação | Resultado |
|---|---|
| Suíte completa (`vitest run`) | **1328/1328** (base: 1310; +18 em `rework7.test.tsx`), 76 arquivos |
| Typecheck (`tsc --noEmit`) | ok |
| Build (`npm run build`) | ok, todos os pacotes < 800 kB |
| Build itch.io (`build:itch`) | ok, `index.html` na raiz do ZIP |
| Smoke itch.io (`smoke:itch`) | **21/21** — ver nota abaixo |
| PWA / offline (`scripts/pwa/offline.mjs`) | **34/34** (instala, precache 36/36, joga e salva offline, redes, mundo, Japão, tema, troca de versão) |
| Saves antigos | migrações e fixtures v9→v20 na suíte: ok; v20 sem migração |
| Testes causais novos | 18/18 |
| Responsividade + sobreposição + temas (`rework7.mjs`) | 380 capturas, **0 problemas** (texto sobre texto, rolagem horizontal, borda estourada, avançar visível, console, alvos < 32 px) |
| Contraste dos tokens (`contraste.mjs`, na suíte) | ok |
| Mundo e localização (`scripts/sim/vazamentos.ts`, 10 países × 2 vidas inteiras) | **0 vazamentos** Brasil → mundo |
| Desempenho (`desempenho7.mjs`) | §15 |
| Bundles | §16 |

**Nota sobre o smoke.** A verificação "com save presente, a interface oferece continuar" falhou neste ambiente tanto
no build novo quanto **no build da base** (`40be963`, rodado no mesmo lugar): a leitura do save é assíncrona (IndexedDB)
e o script lia a tela no primeiro botão. `scripts/itch/smoke.mjs` passou a esperar o texto (até 15 s) — a exigência é a
mesma; só a corrida saiu. É a única alteração num script de verificação existente além das listadas em §13.

Commit único, enviado para `origin/claude/fix-pos-rework3-playtest` (sem merge na `main`, sem force-push, sem
`.claude/`). Cloudflare Pages publica sozinho. APK não regenerado (§20).
