# F5-FIX — Continuidade biográfica e qualidade das pequenas memórias

Correção curta da F5, motivada por playtest humano (Igor Rodrigues, vida 0→18).
Não é uma fase nova: é o conserto de três defeitos que só apareceram quando
alguém leu uma Linha da Vida inteira, de ponta a ponta, como leitura — e não
como métrica agregada.

**Princípio que governou todas as decisões:** pequena memória não é
preenchimento. É algo verdadeiro e biograficamente relevante da fase.
Frase diferente ≠ memória diferente. Ausência de texto ≠ problema.
O objetivo é **continuidade sem filler**.

---

## 1. Os achados do playtest

| # | Achado | Sintoma relatado |
|---|---|---|
| 1 | **Lacuna 2→6** | A vida "desaparecia" entre os 2 e os 6 anos. Nada aos 3, 4 e 5. |
| 2 | **Repetição semântica** | Memórias com redação diferente dizendo a mesma coisa (irmãos, de novo irmãos). |
| 3 | **Memória econômica inventando passado** | Aos 18: "Você passou a viver com bem menos: trocou marca por preço." |

Três observações do próprio playtest que definiram o alvo com precisão:

- **1 ano silencioso é normal. 2 é aceitável. 3+ consecutivos na infância
  parecem vida desaparecida.** A sequência 6→7→8→10 do mesmo playtest **não**
  incomodou — o que confirma que o problema é a sequência longa, não o silêncio.
- **Frase diferente não é memória diferente.** A repetição é de assunto.
- **A dívida aos 18 é um problema econômico** (registrado como F7-P1). O
  problema de F5 é outro: a frase afirma uma **transição sem histórico**.

---

## 2. Causa raiz

### 2.1 — A cadência não olhava para a vida

`gerarPequenaMemoria` decidia com base em três coisas: o estado atual, a faixa
etária da candidata e a paridade do ano (`cadencia: 'alternada'` = só em anos
pares). Nunca olhava para a **Linha da Vida**. A função não tinha como saber
que já havia dois anos vazios atrás dela — a informação existia, estava
persistida no save, e simplesmente não era consultada.

> Este é o padrão recorrente da auditoria: o dado já existia e não estava
> conectado. Não foi preciso sistema novo.

### 2.2 — Tema era uma propriedade do texto, não do dado

Nada no catálogo dizia de que **assunto** cada memória tratava. Duas candidatas
sobre irmãos eram, para o motor, dois textos sem relação. Não havia como
evitar repetição de assunto porque o assunto não era um dado.

### 2.3 — Um downgrade a partir de um patamar que ninguém viveu

`criarEconomiaInicial` atribui `padraoDeVida: 'confortavel'` a **todo mundo**,
por padrão (só o saldo inicial varia: alta 5000 / média 1000 / média-baixa 300
/ demais 50). Varredura em `src/`: **nada, em lugar nenhum, jamais eleva o
padrão de vida.** O único movimento possível é para baixo, em
`aplicarFaltaDeDinheiro`.

Ou seja: a frase narrava a queda de um patamar que era apenas o valor default
do construtor. O personagem de 18 anos nunca "comprou por marca" — ele nunca
comprou nada.

---

## 3. Arquitetura da correção

Três peças pequenas, todas declarativas, nenhuma na UI:

| Peça | Onde | O que é |
|---|---|---|
| **Tema semântico** | `pequenaMemoria.ts` | Campo `tema` **obrigatório** em `MemoriaCandidata`; tipo `TemaDeMemoria`. |
| **Cooldown temático** | `pequenaMemoria.ts` | `JANELA_TEMATICA = 3`; lê o tema das entradas recentes da Linha da Vida. |
| **Política de continuidade** | `pequenaMemoria.ts` | `SILENCIO_QUE_VIRA_BURACO = 2`; `anosSilenciososAntesDe(timeline, idade)`. |

Fiação (parâmetros **opcionais**, nada quebra quem não passa):
`agingSystem.executarPassagemDeAno(..., timelineAteAqui = [])` →
`gerarPequenaMemoria(ctx, logsDoAno, idade, ano, timeline = [])`;
`useGame` passa a `timeline` real.

**O motor continua escolhendo entre textos existentes. Nunca gera texto.**

---

## 4. Taxonomia temática

Derivada do catálogo **real** — não de uma ontologia inventada. 11 temas para
17 memórias, deliberadamente **mínima**: um tema por memória tornaria o
cooldown decorativo (nada jamais colidiria). Há um teste permanente que trava
essa propriedade.

`primeira_infancia` · `familia_irmaos` · `familia_pet` · `familia_filhos` ·
`familia_parceiro` · `amizade` · `escola` · `estudo_superior` · `trabalho` ·
`financeiro` · `cidade`

O tema é **classificação biográfica, não traço de personalidade** — não
alimenta `personalitySystem` e não move nada.

---

## 5. Cooldown temático

Regra, por inteiro: *um tema usado nos últimos 3 anos não é escolhido de novo
enquanto houver outro tema verdadeiro disponível.*

- Janela explicável e curta (3 anos), sem sistema de pontos e sem pesos.
- **Nunca bloqueia um tema permanentemente** — passada a janela, ele volta.
- **Fallback honesto:** se a única memória disponível é de tema recente e não
  há buraco se formando, o ano fica **em silêncio**. Repetir o assunto seria
  pior que não dizer nada.
- O tema é **lido do campo declarado**, nunca inferido por regex em runtime.
  (`scripts/audit/temaDeMemoria.ts`, que infere tema por texto, é exclusivo da
  auditoria do baseline histórico — nada em `src/` o importa.)

---

## 6. Política de continuidade

Duas preferências, nesta ordem:

1. **PREFERÊNCIA 1 — tema novo, respeitando a cadência.** O caso normal.
2. **PREFERÊNCIA 2 — só quando um buraco está se formando** (2+ anos
   silenciosos atrás): aceita tema recente e relaxa a cadência.

E a regra que impede isto de virar filler:

> **Se não houver memória verdadeira, nada é emitido.** A política nunca
> inventa contexto — ela apenas deixa de recusar uma memória verdadeira que já
> estava disponível.

Não é "todo terceiro ano gera memória", não há `if (idade === 4)`, não há meta
de zero gaps.

**Bug encontrado durante a implementação, pelo teste `anosTranquilos`:** a
primeira versão de `anosSilenciososAntesDe` tratava timeline vazia como "a vida
inteira foi silenciosa", fazendo a política disparar sempre e ignorar a
cadência em todo chamador que não passa a Linha da Vida. Corrigido: timeline
vazia é **ausência de informação**, retorna 0. O teste que pegou isso é da F3 e
**não foi alterado**.

---

## 7. Auditoria de TODAS as memórias — estado vs transição

Critério: **transição exige evidência ANTES→DEPOIS no estado.** Localizei
candidatos por expressões ("passou a", "começou a", "deixou de", "voltou a",
"trocou", "reduziu", "tornou-se", "agora", "antes") — mas **a decisão foi
semântica, lendo cada texto**. Classificação usada:
A) estado · B) transição comprovável · C) transição sem histórico ·
D) pressupõe comportamento inexistente · E) pressupõe entidade inexistente.

| ID | Faixa | Tema | Contexto necessário | Tipo | Hist. nec.? | Hist. existe? | Risco de repetição | Ação |
|---|---|---|---|---|---|---|---|---|
| `mem_bebe_crescendo` | 0-2 | primeira_infancia | — | A estado | não | n/a | baixo (faixa curta) | mantida |
| `mem_infancia_irmaos` | 3-11 | familia_irmaos | irmão vivo | A estado | não | n/a | **alto** (achado 2) | tema + cadência |
| `mem_infancia_pet` | 3-11 | familia_pet | pet | A estado | não | n/a | médio | tema + cadência |
| `mem_infancia_escola` | 6-11 | escola | escola em curso | A estado | não | n/a | médio | tema + cadência |
| `mem_primeira_infancia_casa` | 3-5 | primeira_infancia | **responsável vivo** | A estado | não | n/a | médio | **nova** (§8) |
| `mem_adolescencia_amigo` | 12-17 | amizade | amigo | A estado | não | n/a | baixo | tema + cadência |
| `mem_adolescencia_escola` | 12-17 | escola | escola em curso | A estado | não | n/a | médio | tema + cadência |
| `mem_filhos_pequenos` | adulto | familia_filhos | filho pequeno | A estado | não | n/a | **alto** (dominava) | tema |
| `mem_filhos_escola` | adulto | familia_filhos | filho em idade escolar | A estado | não | n/a | **alto** | tema |
| `mem_divida` | adulto | financeiro | dívida > 0 | A estado | não | n/a | médio | tema |
| `mem_estudo` | adulto | estudo_superior | curso em andamento | A estado | não | n/a | médio | tema |
| `mem_trabalho_longo` | adulto | trabalho | emprego longo | A estado | não | n/a | **alto** | tema |
| `mem_trabalho` | adulto | trabalho | emprego | A estado | não | n/a | **alto** | tema |
| `mem_aposentado_parceiro` | idoso | familia_parceiro | aposentado + parceiro vivo | A estado | não | n/a | médio | tema |
| `mem_aposentado` | idoso | cidade | aposentado | A estado | não | n/a | médio | tema |
| `mem_desempregado` | 25+ | trabalho | sem emprego, não aposentado | A estado | não | n/a | médio | tema |
| `mem_cidade` | 18+ | cidade | cidade definida | A estado | não | n/a | médio | tema |

**Resultado: as 17 pequenas memórias são todas do tipo A (estado).** Nenhuma
afirma transição; todas usam construções de estado ("Um ano de…", "Os dias…").
Nenhuma precisou de reescrita por falsidade. Nenhuma inventa amigo, pet,
parceiro, filho, irmão, emprego, estudo, carro, imóvel, dívida ou localização —
todas passam pelos predicados F4 de `contextoDaVida.ts`.

A **única falsa transição do código** estava fora do catálogo de memórias, em
`economySystem.ts` (§9).

---

## 8. A memória nova — e por que ela não é uma rede incondicional

Depois do cooldown, a repetição a 1-2 anos foi a zero **mas os 9 gaps de 3 anos
continuaram idênticos**. Diagnóstico (não suposição): as 9 vidas afetadas eram
todas crianças de 3-5 anos **sem irmão ainda nascido** (87/105 vidas têm irmão,
mas nessas os irmãos nascem aos 6-7), **sem escola** (começa aos 6) e **sem
pet**. O contexto era genuinamente escasso — não havia bloqueio de tema.

A verdade que existia no estado e não era usada: **alguém está criando essa
criança.** Daí `mem_primeira_infancia_casa` (3-5 anos, cadência alternada),
exigindo o novo predicado F4 `temResponsavel()`.

Não é rede incondicional, e há teste permanente para isso: **criança sem
vínculo vivo continua em silêncio.** Foi posicionada **depois** de
irmãos/pet/escola — a ordem da lista é a regra de prioridade, então ela só fala
quando nada mais verdadeiro existe.

---

## 9. O caso econômico dos 18 anos

**Antes** (`economySystem.ts`, ramo `confortavel → modesto`):

> "Você passou a viver com bem menos: trocou marca por preço e cortou o que
> dava para cortar."

**Classificação: tipo D** — pressupõe um comportamento anterior inexistente.

**Depois:**

> "As contas do ano não fecharam, e o que dava para cortar foi cortado."

O aperto é real (o saldo ficou negativo de fato) e continua narrado. O que saiu
foi só a alegação sobre um passado de consumo que nunca existiu.

**O que NÃO foi feito, por instrução explícita:** nenhuma despesa, saldo, idade
econômica, custo de vida ou perdão de dívida. A entrada de dívida **não foi
removida** — medido: **60/105 vidas** registram aperto financeiro aos 18, e
isso continua visível na Linha da Vida. Há teste permanente que falha se
alguém esconder o aperto. **A causa econômica é F7-P1.**

**Achado adicional:** o ramo `luxuoso → confortavel` afirma transição
("cortar o padrão de vida"). Verifiquei: **nada no motor atribui `luxuoso` a
ninguém**, logo o ramo é hoje inalcançável. O texto foi **mantido** — no dia em
que a F7 criar uma forma de ascender, a transição passa a ser verdadeira.
Registrado como **F7-P2**.

---

## 10. Antes → depois (mesmas 105 vidas, 7794 anos)

### Sequências de silêncio, por faixa

| faixa | anos | % sem linha | 1 ano | 2 anos | 3 anos | 4+ |
|---|---|---|---|---|---|---|
| 0-2 | 210 | 0,0% → 0,0% | 0→0 | 0→0 | 0→0 | 0→0 |
| 3-5 | 315 | 46,7% → **38,4%** | 92→121 | 14→**0** | **9→0** | 0→0 |
| 6-11 | 630 | 15,4% → 15,2% | 93→88 | 1→5 | **1→0** | 0→0 |
| 12-14 | 315 | 11,1% → 11,7% | 32→31 | 1→2 | 0→0 | 0→0 |
| 15-17 | 315 | 6,0% → 6,3% | 19→20 | 0→0 | 0→0 | 0→0 |
| 18+ | 6009 | 0,2% → 0,7% | 14→40 | 0→1 | 0→0 | 0→0 |
| **TOTAL** | 7794 | | 250→**300** | 16→**8** | **10→0** | **0→0** |

### 11. Gaps

- Vidas com gap ≥3 anos na infância: **9/105 (8,6%) → 0/105 (0,0%)**
- Maior gap na infância: **3 → 2**
- p90 de sequência silenciosa na infância: **1**

O aumento de lacunas de 1 ano (250→300) é o resultado **desejado**: buracos
longos viraram silêncios curtos. Nada foi preenchido a mais — 1051 memórias
emitidas contra 1081 antes, ou seja, o sistema passou a falar **menos** e melhor
distribuído.

### 12. Silêncio (preservado de propósito)

3-5 anos continua **38,4% silencioso**. O silêncio não foi eliminado e não
deveria ser: a meta nunca foi zero gaps. Um gap de 3 por falta de contexto real
pode estar correto — depois da correção, porém, não sobrou nenhum, porque em
todos os casos havia uma verdade disponível que não estava sendo consultada.

### 13. Repetição temática

| Mesmo tema em | Antes | Depois |
|---|---|---|
| 1 ano | 225 | **0** |
| 2 anos | 207 | **0** |
| 3 anos | 182 | **2** |

Distribuição por tema (depois): `familia_filhos` 394 · `trabalho` 183 ·
`financeiro` 131 · `cidade` 98 · `familia_irmaos` 95 · `estudo_superior` 77 ·
`escola` 70 · `amizade` 2 · `familia_pet` 1.

`familia_filhos` caiu de **585 → 394**: a timeline deixou de ser dominada por
família, e `cidade` passou a aparecer.

### 14. Densidade (o teste de que não houve filler)

| Métrica | F5 | F5-FIX |
|---|---|---|
| linhas por ano | 1,673 | **1,673** |
| anos com 2+ linhas | 3790 | **3790** |
| anos com 3+ | 1434 | **1434** |
| anos com 4+ | 311 | **311** |

**Densidade idêntica.** É o efeito da guarda "só preenche ano vazio": a
correção redistribuiu memórias para anos que estavam vazios, sem nunca
empilhar linha em ano que já falava.

### Critério conjunto

Os seis critérios tinham de valer **ao mesmo tempo** — e valem: gaps longos
caíram (9→0) · silêncio continua existindo (38,4% em 3-5) · repetição temática
caiu (225/207→0/0) · densidade não explodiu (idêntica) · fatos inventados
seguem zero · contexto F4 segue **0/174 violações**.

---

## 15. Exemplos qualitativos

Li **10 timelines 0-10 e 10 timelines 0-18** (`scripts/audit/linhaDaVidaExemplos.ts`).

**Continuidade na faixa crítica (seed 5) — silêncio existe, mas não some a vida:**

```
  4 – A outra criança foi chorar longe, e você ficou brincando sozinho com o carrinho.
  5 ·  (silêncio)
  6 ★ Você ingressou no 1º ano do Ensino Fundamental.
  7 ·  (silêncio)
  8 – Completou o álbum de figurinhas da Copa inteiro, trocando repetidas no pátio.
```

**A correção do buraco 2→6 (seed 6) — antes, 3, 4 e 5 eram todos vazios:**

```
  3 ·  (silêncio)
  4 · Um ano de brincadeira inventada no chão da sala e sono cedo.
  5 ·  (silêncio)
```

**Irmãos sem repetir assunto (seed 9) — nasce irmão aos 4 e 5, e a memória de
irmãos só aparece aos 10:**

```
  5 ★ Nasceu seu irmão, Enzo!
 ...
 10 · Um ano dividindo quarto, brinquedo e paciência com os irmãos.
```

Avaliação da leitura: sem fatos inventados, sem transição sem passado, sem
família dominando tudo, tom editorial consistente, silêncio natural.

**Defeito observado na leitura, fora do escopo:** em seed 6, os anos 7-10
repetem quase literalmente "Você dedicou o ano aos estudos…". Verifiquei a
origem: é `narrativeVariants.ts` (postura escolar, atividade voluntária), **não
pequena memória**. Não mexi — é o defeito já catalogado para **F7**.

---

## 16. Testes

**956/956 passando** (933 antes; **+23 novos**), typecheck limpo, build limpo.

`src/systems/memorias/__tests__/temaEContinuidade.test.ts` (19) e
`src/systems/narrativa/__tests__/estadoVsTransicao.test.ts` (4) cobrem:
tema existe e é declarativo · taxonomia mínima · duas variantes do mesmo tema
são reconhecidas como o mesmo tema · tema recente evitado havendo alternativa ·
tema reaparece após a janela · silêncio preferido a repetição inadequada ·
continuidade tenta memória após sequência longa · continuidade nunca inventa
contexto · timeline vazia ≠ vida silenciosa · irmãos exige irmão · amigo exige
amigo · pet exige pet · primeira infância exige responsável · transição exige
histórico · sem histórico vira estado · o aperto real continua visível · não
altera atributos/personalidade/NPC/dinheiro · não abre modal · tema não é traço.

**Canários A, B e C** implementados como testes permanentes — o canário A não
exige idade exata por seed, apenas que a sequência seja reconhecida.

**Verificação por mutação** (teste que passa de primeira não prova nada):

| Mutação | Resultado |
|---|---|
| Restaurar a falsa transição econômica | **2 testes falham** ✔ |
| Remover o cooldown temático | **2 testes falham** ✔ |

**Dois testes da F5 tiveram a expectativa alterada** — classificados como
**contrato obsoleto**, não como teste ajustado para passar. Ambos afirmavam que
uma criança de 4-5 anos **com pai e mãe** ficava em silêncio; essa era
exatamente a faixa do achado 1. Reescritos para verificar o contrato que
continua valendo, de forma mais exigente: **sem nenhum vínculo vivo**, o
silêncio permanece; e a cadência ainda produz silêncio em ano ímpar quando não
há buraco. O teste `anosTranquilos.test.ts` (F3) **não foi tocado** — ele
inclusive pegou um bug real meu.

---

## 17. Save

**`VERSAO_SAVE` continua 5. Nenhum bump.**

O cooldown é **derivado da própria Linha da Vida**, que já é persistida. O único
campo novo é `LifeLogEntry.temaDeMemoria?: string` — **opcional**, portanto
compatível com saves v5: entradas antigas simplesmente não têm tema e contam
como tema desconhecido, o que só torna a política **mais permissiva** no
passado. Saves legados não são destruídos.

Tipado como `string` e não `TemaDeMemoria` por uma restrição real:
`types/index.ts` não pode importar de `systems/`.

---

## 18. Guards F1-F5 preservados

| Fase | Guard | Status |
|---|---|---|
| F1 | Plausibilidade profissional | intacta |
| F2 | Tempo, matrícula, processos, duração de cursos | intacta |
| F3 | Ritmo, calendário, agência, marcos, composição | intacta (`anosTranquilos` não tocado) |
| F4 | Zero pressupostos inválidos | **0/174 violações** |
| F5 | Narrativa contextual, memória compreensível isolada | intacta |

Cobertura **131/134** e agência **A=1180 · B=105 · C=105 · D=17258 ·
conversão 100,0%** — idênticas à F5. Pequena memória continua sem mover
stats, flags ou personalidade, e continua sem abrir modal.

---

## 19. Limitações

- **Repetição de tema a 3 anos ainda existe (2 casos).** Dentro do previsto: a
  janela é de 3 anos, e alargá-la esvaziaria a timeline.
- **`amizade` (2) e `familia_pet` (1) quase não aparecem.** Não é defeito de
  tema: 63/105 vidas não têm amigo e só 29 têm pet. É **F6**.
- **A faixa 3-5 depende de um responsável vivo.** Órfão em 3-5 continua em
  silêncio. Correto por ora: inventar seria pior.
- **O aumento de silêncio em 18+ (0,2%→0,7%)** é efeito do cooldown em adultos
  com pouco contexto. São 40 anos em 6009 e a leitura não acusou estranheza.
- A métrica `continuidade.ts` sozinha não teria pego nenhum destes achados —
  "% de anos sem linha" não representa a experiência. Foi preciso medir
  **distribuição por comprimento de sequência**.

---

## 20. Adiado, com destino

| Item | Fase |
|---|---|
| Choque financeiro aos 18 (60/105 vidas) | **F7-P1** |
| Ramo `luxuoso` inalcançável — nada eleva o padrão de vida | **F7-P2** |
| Atividade voluntária repetindo texto literal por até 8 anos | **F7** |
| Padrão de consumo persistente, histórico financeiro, renda familiar | **F7** |
| Poucos amigos (63/105 sem amigo), poucos pets, zero gestação | **F6** |
| Predicado de escolaridade (`ado_trote_festa`, `ado_preparacao_enem`) | **F8** |
| Casos opacos: `adm_bairro_mudou`, `adm_rotina_remota`, `adm_amigos_se_espalham` | F7/F8 |
| `ado_grupo_amigos_turma` referencia evento inexistente | F6 |
| Gênero ausente do pipeline visual | **F9** |

Nada de F6 foi iniciado. Nenhuma economia foi rebalanceada. Avatar e educação
não foram tocados. Nenhum conteúdo foi adicionado em massa — **uma** memória
nova, com necessidade estrutural demonstrada em §8.
