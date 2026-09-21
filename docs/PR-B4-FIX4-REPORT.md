# B4-FIX4 — Fundação de ritmo

> "A vida acontece. Às vezes você decide."

## Objetivo

Separar **acontecimento** de **decisão**, dar ao VIDA uma camada real de
pacing e acabar com as interrupções artificiais — sem reduzir diversidade de
conteúdo nem quebrar o que o B4-FIX3 construiu.

## Diagnóstico

Três causas independentes se somavam:

1. **Todo evento era decisão.** `GameEvent` exige `opcoes`; o motor sempre
   abria modal perguntando "o que você faz?". Um bebê de 1 ano "decidia"
   entre rir do próprio reflexo ou perder o interesse.
2. **O ritmo era uma porcentagem global.** `haEventoNesteAno()` era
   `rollChance(75)` — um número só, igual aos 0 e aos 80 anos.
3. **Todo ano abria pelo menos um modal.** `setResumoAnual` era chamado
   incondicionalmente; num ano silencioso o modal existia apenas para dizer
   *"Um ano sem grandes acontecimentos"*. Em paralelo, `agingSystem`
   escrevia texto de preenchimento na Linha da Vida.

Somados: 100% dos anos interrompiam, ~75% exigiam decisão, e os anos
tranquilos poluíam a biografia.

## O que foi implementado

### 1. Camada de ritmo (`systems/pacing/lifeRhythm.ts`)

Responde a uma pergunta por ano, **antes** de qualquer sorteio de conteúdo:
silêncio, acontecimento ou decisão. Quatro forças, nenhuma delas global:

| Força | Efeito |
| --- | --- |
| **Autonomia por idade** | 0-2 anos: 0% de decisão (estrutural, não probabilístico). 3-5: 20%. 6-11: 45%. 12-14: 60%. 15-17: 75%. 18+: 85% |
| **Densidade estrutural do ano** | 2+ acontecimentos que o próprio motor produziu (formatura, emprego, nascimento) → o ano se bastou, nada é sorteado |
| **Fadiga** | Eventos recentes reduzem a chance; a fadiga de *decisão* é contada à parte da de acontecimento |
| **Secura** | 3+ anos calados aumentam a chance — silêncio longo demais deixa de ser ritmo |

Mais um **teto duro** de decisões por janela móvel (0 na primeira infância,
1-2 na infância/adolescência, 3 na vida adulta) que nenhuma rolagem fura.

### 2. Acontecimento × decisão (`systems/events/happenings.ts`, `nature.ts`)

`GameEvent.natureza` distingue os dois. Num acontecimento o motor sorteia o
desfecho entre as `opcoes` (por `peso`), aplica, narra — e **nunca abre
modal**.

**Regra dura:** um acontecimento jamais move a personalidade.
`desfechoSemMarcaDeEscolha()` remove `impactosComportamentais` antes de
qualquer aplicação. Quem não escolheu não é caracterizado.

### 3. Anos tranquilos de verdade

- `gerarTextoAnoTranquilo()` **removida**. Ano silencioso não escreve nada.
- O resumo anual só abre quando tem o que dizer (`useGame.envelhecerAno`).
- `AnnualSummary` perdeu o galho de ano vazio.

### 4. Curadoria da Linha da Vida

- `LifeLogEntry.relevancia` (`marco` / `normal` / `textura`) substitui a
  heurística "se for cotidiano, ignore" na montagem do resumo anual.
- Duas categorias novas — `amizade` e `lazer` — dão lugar próprio a eventos
  de hobby, esporte, comunidade e tecnologia, que antes caíam todos no
  rótulo genérico "Escolha".

### 5. Classificação do catálogo

99 eventos auditados um a um: **43 viraram acontecimento, 56 seguem
decisão**. Critério: acontecimento quando a janela inteira cabe em 0-2 anos,
quando as opções são reações/temperamento em vez de deliberação, ou quando a
situação é textura de vida e não encruzilhada.

## Bugs corrigidos

| Bug | Correção |
| --- | --- |
| Todo resultado de evento entrava na Linha da Vida como `tipo: 'positivo'` fixo — um desfecho em que a pessoa se machucou ou foi demitida aparecia com ênfase de boa notícia | `tomDoDesfecho()` deriva o tom das consequências reais |
| Todo resultado entrava como `categoria: 'evento'`, rotulada "Escolha" | `categoriaDeLogDoEvento()` mapeia a categoria real |
| **33 das 56 decisões (59%) não declaravam nenhum impacto comportamental** — quase todas as adultas. Com o ritmo correto, a personalidade deixaria de emergir por completo | Impacto comportamental atribuído a todas as 33, com magnitude proporcional ao quanto a escolha caracteriza |
| 40 acontecimentos ainda declaravam impacto comportamental no dado | Removidos do conteúdo; teste permanente impede a volta |

## Mudanças de comportamento

| Antes | Depois |
| --- | --- |
| 75% dos anos com evento interativo, quase sempre pergunta | ~20% dos anos com decisão; ~15% com acontecimento; o resto passa |
| Modal de resumo em 100% dos anos | Só quando o ano tem o que relatar |
| Ano tranquilo escrevia log de preenchimento | Silêncio total |
| Bebês respondiam perguntas | 0-2 anos é 100% acontecimento, estruturalmente |
| Personalidade formada aos 15 | ~3 em 15 vidas têm traço percebido aos 18; todas têm aos 40 |

### Números medidos (15 seeds, motor real)

| Horizonte | Decisões | Acontecimentos | Anos silenciosos | Vidas com traço percebido |
| --- | --- | --- | --- | --- |
| 0 → 18 | 4,3 | 5,2 | 8,5 | 3/15 |
| 0 → 60 | 16,0 | 10,2 | 33,8 | 15/15 |

## Save

`VERSAO_SAVE` 3 → **4**. Migração aditiva: ocorrências antigas ganham
`natureza` e `categoria` consultando o catálogo atual (fonte de verdade sobre
o que aquele evento é), em vez de assumir cegamente "decisão". Ocorrência de
evento que não existe mais no catálogo é preservada como está.

## Sistemas preservados

`events/eligibility`, `events/repetitionPolicy`, `events/contextWeighting`,
`events/history`, `personalitySystem`, `availabilitySystem`,
`outcomePresentation`, todo o schema de avatar.

## Sistemas reaproveitados e evoluídos

`GameEvent` (ganhou `natureza`; `opcoes` passou a servir também como leque de
desfechos), `EventOccurrence` (ganhou `natureza`), `agingSystem`,
`saveSystem`, `eventSystem` (perdeu a decisão de *se* há evento; ganhou o
filtro por natureza).

## Refatorações

`avaliarRequisitoOpcao` extraída para `events/optionRequirements.ts` —
`events/happenings` precisa dela e não pode importar `eventSystem` sem criar
ciclo. `eventSystem` continua reexportando por compatibilidade.

## Testes

| Arquivo | Conteúdo |
| --- | --- |
| `systems/pacing/__tests__/lifeRhythm.test.ts` | 17 testes: autonomia por idade (com fonte aleatória fixada no valor mais favorável, para provar que é impossível e não improvável), teto duro, fadiga, secura, saturação |
| `systems/events/__tests__/acontecimentos.test.ts` | 12 testes: sorteio por peso, requisitos, remoção da marca de escolha, vida só de acontecimentos não move traço |
| `systems/__tests__/anosTranquilos.test.ts` | 8 testes: 5 sementes × 80 anos verificando ausência de texto de preenchimento, proporção de decisões, sequências de silêncio |
| `data/events/__tests__/coerenciaCatalogo.test.ts` | +6 regras: bebê nunca decide, acontecimento nunca caracteriza, acontecimento nunca é mudo, pool mínimo das duas naturezas por faixa |

**Testes recalibrados** (com justificativa registrada no próprio arquivo):
`cicloVida` passou de 0→25 para 0→40 e o marco de consolidação de 15 para 30
anos; `personalidadeEntreVidas` mede distribuição aos 40 em vez de aos 18.
Não foi para "fazer passar": medir viés de eixo sobre 4 escolhas mede sorte
de sorteio, não viés de conteúdo — que é o que aqueles testes existem para
detectar.

## Resultados

```
npm test        653 testes / 40 arquivos — todos verdes  (baseline: 608/37)
npm run typecheck   sem erros
npm run build       sucesso
```

## Limitações e pendências

- **Cobertura de conteúdo 41-59 anos continua rala** — a faixa depende muito
  de eventos de janela larga. Registrado para uma etapa de conteúdo.
- O pool de **acontecimentos adultos** (11 eventos) é menor que o de
  decisões (33), então a vida adulta ainda pende para o lado da pergunta.
- `useGame.ts` continua com ~990 linhas. Não virou god file, mas está no
  limite: a próxima etapa que mexer em comandos deve dividi-lo.
- **Nada aqui foi verificado visualmente.** Não houve acesso a browser nesta
  sessão; toda a validação é estrutural e por simulação.

## Playtest humano necessário

1. Criar uma vida e avançar de 0 a 10 anos **sem parar**: confirmar que a
   maioria dos anos passa sem modal nenhum e que nada é perguntado ao bebê.
2. Avançar até os 40: confirmar que as decisões aparecem espaçadas e que os
   anos entre elas não parecem vazios.
3. Olhar a Linha da Vida aos 40: confirmar que ela lê como uma biografia e
   não como um log.
4. Confirmar que um ano com formatura ou emprego novo **não** abre um evento
   sorteado por cima.

---

# Avatar 2.0 — retrato vetorial editorial

## Objetivo

Trocar o "rosto" anterior — uma elipse com círculos — por um retrato que
pareça uma pessoa, preservando integralmente o schema, a persistência e as
opções já existentes.

## Diagnóstico

| Elemento | Antes |
| --- | --- |
| Rosto | uma `<ellipse>` |
| Orelhas | dois `<circle>` |
| Olhos | dois `<circle>` da cor escolhida |
| Sobrancelhas | dois arcos de traço fino |
| Nariz | **não existia** |
| Boca | um arco de círculo (sorriso de desenho infantil) |
| Pescoço e ombros | **não existiam** — uma cabeça flutuando |
| Implantação do cabelo | **não existia** — o cabelo começava no topo do crânio |
| Cabelo cacheado | `a6 6 0 1 1` × 6 — seis arcos circulares de raio idêntico: bolinhas coladas |
| Envelhecimento | trocar a cor do cabelo aos 65 e duas ruguinhas |

## O que foi implementado

### Arquitetura (`src/presentation/avatar/`)

| Módulo | Responsabilidade |
| --- | --- |
| `faceProportions.ts` | O rosto descrito por MEDIDAS, com seis quadros-chave etários interpolados ano a ano |
| `facePaths.ts` | Geometria: silhueta com mandíbula, orelha com hélice, olho amendoado, nariz sugerido, boca com lábios, busto, marcas de idade |
| `hairPaths.ts` | Cabelo com implantação real, gerador de volume por silhueta contínua, barba |
| `avatarRenderer.ts` | Monta a especificação completa (puro, testável) |
| `AvatarFace.tsx` | Só a ordem de pintura — nenhuma decisão de desenho |

### O cacheado

A silhueta é gerada amostrando a elipse do crânio com raio variável por
amostra e controles empurrados para FORA entre as amostras — os lóbulos se
fundem numa massa única em vez de ficarem tangentes como moedas. Somam-se
traços em S internos: é a combinação de contorno irregular com movimento
interno que lê como cacho. Um teste permanente falha se um comando de arco
(`A`/`a`) voltar a aparecer na silhueta.

### Envelhecimento contínuo

Proporções interpoladas (nenhuma medida pula mais de 1 unidade em 100 por
aniversário — verificado em teste) mais marcas em faixas próprias: sulcos
nasogenianos a partir de 38, pés de galinha e olheiras a partir de 50,
linhas de testa a partir de 58 (uma terceira aos 70), recuo gradual da
implantação a partir de 55, grisalho aos 65.

### Barba e NPCs

- `AparenciaAvatar.barba` (opcional): bigode, cavanhaque, barba cheia,
  seguindo a mandíbula real. Só renderiza a partir dos 16.
- `derivarAparenciaDeSemente(id)`: rosto determinístico a partir do id
  estável do NPC. Toda a família e todo NPC persistente ganham rosto
  próprio, igual entre sessões, **sem um byte de persistência nova e sem
  migração**.

## Validação visual — feita de verdade

Diferente das etapas anteriores, esta teve inspeção visual real: o
`AvatarFace` foi renderizado em servidor para uma folha de contato
(`src/__visual__/gerarAvatares.test.tsx`) e capturado em navegador via
Playwright. A folha está em `docs/references/avatar-2.0.png`.

Três rodadas de correção saíram dessa inspeção, e nenhuma delas teria sido
detectada por teste automatizado:

1. **O bebê não parecia bebê** — as proporções mudavam pouco demais.
   Corrigido: crânio muito mais largo, queixo arredondado em vez de
   afunilado, olhos maiores, cabelo ralo sem costeleta.
2. **Os "ombros" pareciam um monte marrom** — a forma era um domo no rodapé
   e a cor derivava do tom de pele (a camisa mudava de cor conforme a
   pele). Corrigido: trapézio com gola e cor neutra fixa.
3. **Todo retrato nascia emburrado** — os cantos da boca ficavam abaixo do
   centro. Corrigido: cantos levemente acima.
4. **As orelhas viraram abas retangulares escuras** — borda interna reta e
   cor destacada. Corrigido: hélice com borda curva, cor do próprio rosto,
   encaixada mais para dentro do crânio.

## Preservado

Schema de `AparenciaAvatar` (as quatro escolhas originais), persistência,
normalização defensiva, catálogo de opções, `AvatarEditor`, integração com
`PersonAvatar`, regra de envelhecimento do cabelo, e todos os campos que o
renderer anterior exportava (`corPele`, `corCabelo`, `corOlhos`, `cabelo`,
`escalaRosto`, `mostrarRugas`, `simplificado`).

## Testes

`presentation/avatar/__tests__/retrato.test.ts` — 25 testes:
integridade geométrica (todo path desenhável em 20 idades × 6 cabelos × 4
barbas; nenhum `NaN` silencioso), proporção que realmente envelhece,
continuidade sem degraus, o cacheado sem arcos, implantação que deixa a
testa à mostra, barba por idade, rostos de NPC determinísticos e variados.

## Resultados

```
npm test        680 testes / 42 arquivos — todos verdes
npm run typecheck   sem erros
npm run build       sucesso
```

## Limitações

- **Acessórios (óculos, brincos) não foram implementados** — a arquitetura
  está pronta (tudo se posiciona pelas medidas do rosto), mas entregar mal
  seria pior que não entregar.
- O coque ainda lê pequeno; o traço do nariz tem uma leve curvatura de
  gancho; a borda entre pescoço e ombro é visível de perto.
- Não há variação de expressão: todo retrato é neutro.

---

# Rework visual — de painel para página

## Objetivo

Dar identidade ao VIDA: editorial, contemplativa, humana, adulta, ligada à
memória e à passagem do tempo. Sair de "estou administrando um dashboard"
para "estou acompanhando a história de uma pessoa".

## Diagnóstico — feito no navegador, não no editor

Esta etapa começou com o produto rodando em Chromium e capturado em sete
larguras. O diagnóstico não é estético, é de composição:

| Achado | Natureza |
| --- | --- |
| **As opções de evento mostravam o desfecho antes da escolha** | bug grave |
| Três colunas com barras de progresso numeradas à direita | dashboard |
| Verde-esmeralda saturado como marca (botão, barras, estados, idade) | fintech |
| Rótulos em caixa alta espalhados (ATRIBUTOS, TRAÇOS, PESSOAS, e um por entrada da Linha da Vida) | ruído |
| Linha da Vida em sans de 15px, uma linha por entrada, perdida numa coluna de 1200px | sem peso |
| Sans geométrico que poderia ser de qualquer produto | sem identidade |

## Bug crítico corrigido

`EventChoice` renderizava `opcao.descricaoResultado` como "consequência
insinuada" abaixo de cada opção. Mas `descricaoResultado` **é a narração do
desfecho, escrita no passado**. O jogador lia *"O dono, um senhor
aposentado, chorou de emoção e te agradeceu pela sua honestidade!"* antes de
decidir se devolveria a carteira — e lia também o desfecho da outra opção.

Isso não enfraquecia a decisão: **eliminava a decisão**. Escolher conhecendo
os dois resultados é preencher formulário. O desfecho agora só aparece em
`EventResult`, depois da escolha.

## Identidade — três decisões, nesta ordem de efeito

### 1. Tipografia

Uma serifa editorial (**Newsreader**, com Georgia/Charter como reserva
local real) assume TODA a voz narrativa: Linha da Vida, descrição de
acontecimento, resultado, nomes, títulos. Um sans neutro (**Inter**) fica
só com a mobília: rótulos, botões, navegação, números.

É a mudança que mais distancia o VIDA de um painel, e não custa um pixel de
decoração. Há teste permanente para os dois lados da regra: os elementos de
conteúdo têm de usar `--font-serif`, e a mobília, `--font-sans`.

### 2. Cor como memória

O acento deixou de ser `#3ddc97` (esmeralda) e virou `#d9a05b` (âmbar
terroso) — luz de fim de tarde, papel guardado. O verde sobreviveu apenas
como `--success`, sinal semântico de "melhorou", nunca marca.

O teste de paleta pegou um efeito colateral antes de virar bug visual: o tom
de "família/memória" era terracota e ficou indistinguível do âmbar novo. Foi
trocado por um rosa empoeirado.

### 3. Base quente

O fundo saiu do petróleo azulado para um quase-preto de tinta. Azul frio
empurra para ficção científica; marrom-tinta empurra para arquivo e
lembrança. Há teste: todo tom de fundo tem de ter vermelho ≥ azul.

## Composição

- **A Linha da Vida virou a página.** Idade como número de capítulo em
  serifa; entradas em corpo de leitura; medida limitada a ~62 caracteres; o
  rótulo de categoria repetido saiu da composição (continua no HTML para
  leitor de tela).
- **Os atributos deixaram de ser um painel.** As quatro barras verdes
  numeradas viraram uma lista de linhas finas com o número recuado. A
  informação é a mesma; o peso visual, não.
- **A coluna de conteúdo virou uma página**, com medida máxima e centrada,
  em vez de uma faixa esticada até a borda do monitor.
- **Raios reduzidos** e a pílula do `+1 ANO` virou um bloco. Continua sendo
  o único preenchimento sólido de acento — impossível de não achar.
- **Opção morta não é mais exibida.** Uma opção recusada em definitivo (a
  idade já passou) some; uma recusa reversível — dinheiro, atributo,
  histórico — continua visível com o motivo, porque aí o bloqueio ensina.

## Responsividade — medida, não estimada

`scripts/playtest/auditoria.mjs` percorre 320, 390, 430, 768, 1024, 1366 e
1920 px com uma vida real em andamento.

| Verificação | Antes | Depois |
| --- | --- | --- |
| Rolagem horizontal | 4px em 320px | nenhuma em nenhuma largura |
| Alvos de toque < 40×32 | 1 (a marca, 62×36) | nenhum |
| Controles sem nome acessível | 0 | 0 |
| `+1 ANO` visível | sim | sim em todas as sete |

## Acessibilidade

Preservada e verificada por teste: foco sempre visível e nunca removido,
`prefers-reduced-motion` ativo, alvo de toque mínimo definido e em uso,
contraste AA de todos os tokens de texto (o teste existente continua
passando com a paleta nova), diferenciação por ícone + rótulo textual além
de cor.

## Testes

`styles/__tests__/identidadeEditorial.test.ts` — 15 testes que transformam
as decisões de identidade em regras: serifa no conteúdo e sans na mobília,
medida de leitura limitada, nenhuma cor literal fora de `tokens.css`, acento
não-verde e quente, base quente, rótulo de categoria oculto, medidor de
atributo fino e sem cor de marca, caixa alta restrita a metadados, teto de
superfícies sólidas de acento, foco/reduced-motion/alvo de toque.

Esse arquivo pagou por si na primeira execução: apontou sete valores rgba
coloridos ainda cravados em componentes e um uso a mais do acento sólido.

## Resultados

```
npm test        695 testes / 43 arquivos — todos verdes
npm run typecheck   sem erros
npm run build       sucesso
```

## Verificado visualmente

Sim — em navegador real, com capturas de início, criação, bebê, adolescente,
adulto, Linha da Vida de 38 anos e celular, mais a auditoria estrutural nas
sete larguras.

## Limitações

- A tela de morte/obituário e a tela de estatísticas **não foram revisadas
  visualmente** nesta etapa; herdaram os tokens novos, mas a composição
  delas não foi auditada.
- Não há tema claro nem alternância.
- A faixa 1181–1366px empilha a lateral como rodapé; funciona, mas a
  composição de tablet em paisagem merece um olhar humano.
