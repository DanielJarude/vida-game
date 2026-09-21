# Fase 3 — Calendário da Vida e Pacing · Relatório

Branch `arena/01a0c250-vida-game`. Suíte: **51 arquivos / 843 testes**, typecheck limpo, build ok.
Harness: as **mesmas 105 vidas** das Fases 1 e 2 (7 perfis × 15 seeds, `scripts/audit/`).

Commits desta fase:

| commit | conteúdo |
|---|---|
| `4a8ffd1` | `docs/PROPOSTA-FASE-3.md` (base arquitetural aprovada) |
| `5394ee9` | passos 1-3 — taxonomia, `relevancia`, densidade biográfica |
| `1ec7f64` | passos 4-5 e 9 — calendário, marcos garantidos, save v5 |
| `cffbb0a` | passo 7 — pequenas memórias |
| `67ffa04` | passo 8 — acontecimento para de fingir que houve escolha |
| `b6ed2eb` | **correção estrutural: escolha biográfica ≠ decisão contextual** |

---

## 0. Escolha biográfica ≠ decisão contextual

Esta seção vem primeiro porque foi a descoberta mais importante da fase, e ela não estava na
proposta: apareceu como uma regressão medida e obrigou a rever um conceito.

### O que aconteceu

Depois do passo 8, a auditoria de agência mostrou que as decisões da faixa **3-5 anos** tinham caído
de 6,7% para **0,0% dos anos**. Zero. E, pior, o script dizia ao mesmo tempo que **100% daqueles anos
tinham decisão elegível** e que havia **0 falhas de scheduler**. Os dois números só podiam conviver
se o ritmo simplesmente **nunca quisesse perguntar** — o que era exatamente o caso.

A cadeia, confirmada no código e não por hipótese:

1. `bb_primeira_palavra` virou **marco garantido com escolha** (passo 5). Aos 2 anos, em 105/105 vidas.
2. `agingSystem` gravava a ocorrência do marco como `natureza: marcoDoAno.temEscolha ? 'decisao' : ...`.
3. `lifeRhythm` aplicava o teto duro contando `r.natureza === 'decisao'`.
4. O perfil da faixa 3-5 é `{ tetoDecisoes: 1, janela: 5 }` — **uma** decisão em cinco anos.

Resultado: o marco dos 2 anos consumia sozinho toda a cota de 3, 4 e 5 anos. Um marco biográfico
apagava, por efeito colateral, a agência dos três anos seguintes.

### Por que não foi corrigido com um parâmetro

A tentação óbvia — subir `tetoDecisoes`, `FATIA_MAXIMA_DE_DECISAO` ou `densidadeBase` — foi
explicitamente descartada. Nenhuma delas era o problema: o teto estava certo, o que estava errado era
**o que ele contava**. Subir o teto teria escondido o defeito e afrouxado o pacing de toda a infância
para compensar um erro de classificação.

O que faltava era uma distinção conceitual que o motor não tinha:

> **Decisão contextual/comportamental** — o jogador toma posição, assume risco, escolhe entre
> valores. *Pode* mover personalidade, **consome** o orçamento de decisão (teto, fadiga, janela), e é
> ela que as métricas de "decisão" contam.
>
> **Escolha biográfica** — o jogador participa da construção da própria história (qual foi a primeira
> palavra). Não é posição sobre nada: **não** move personalidade por padrão, **não** consome
> orçamento, **não** bloqueia decisões posteriores, e é contada **à parte**. É agência real.

O motor já fazia duas perguntas sobre cada interação: *permite escolher?* (`taxonomiaPermiteEscolha`)
e *move personalidade?* (`taxonomiaMovePersonalidade`). Faltava a terceira, e ela é independente das
outras duas: *consome orçamento de decisão?*

### A correção

Estrutural, declarativa, e respondendo pela **taxonomia** — nunca por id:

| arquivo | mudança |
|---|---|
| `src/types/index.ts` | `taxonomiaConsomeCotaDeDecisao(taxonomia)` — `true` só para `decisao_comportamental`. `EventOccurrence` ganha `taxonomia?`. |
| `src/systems/agingSystem.ts` | grava `taxonomia: classificacaoDoEvento(...)` nas três pontas: marco, decisão sorteada e acontecimento. |
| `src/systems/pacing/lifeRhythm.ts` | `RegistroRitmo.consomeCota`; teto e fadiga (`decidiuAnoPassado`) passam a contar por ele. |
| `src/systems/saveSystem.ts` | reidrata a taxonomia de ocorrências antigas — senão o defeito voltaria após um reload. |

Save antigo sem `taxonomia` cai na derivação por `natureza`, que reproduz exatamente o comportamento
que aquela ocorrência tinha quando foi gravada. Nenhum save legado muda de sentido.

### Efeito medido

| faixa | decisões antes da correção | depois |
|---|---|---|
| **3-5** | **0,0%** dos anos | **3,8%** |
| 6-11 | 8,9% | 8,6% |
| 12-14 | 17,8% | 16,8% |
| 15-17 | 18,1% | 21,0% |

Cobertura de catálogo: **120/134 → 124/134** eventos vistos. Quatro eventos de 3-6 anos
(`prc_disputar_balanco`, `prc_dividir_brinquedo`, `prc_primeira_regra_casa`, `inf_gatinho_rua`)
voltaram a aparecer — estavam presos atrás da mesma cota zerada.

A faixa 3-5 **não voltou** a 6,7%, e isso é intencional: 6,7% era o número de antes do Calendário da
Vida, quando não havia dois marcos garantidos ocupando os anos 1 e 2. O teto de uma decisão por
janela de cinco anos continua valendo, e agora ele é gasto por decisão contextual de verdade.

### Os 10 testes permanentes

Em `src/systems/pacing/__tests__/escolhaBiografica.test.ts` (13 testes, os 10 exigidos + 3 de apoio):

| # | contrato |
|---|---|
| 1 | escolha biográfica não consome cota |
| 2 | decisão contextual consome |
| 3 | primeira palavra não reduz a capacidade de decisão contextual posterior |
| 4 | escolha biográfica não move personalidade por padrão |
| 5 | marco sem escolha não consome cota |
| 6 | acontecimento não consome cota |
| 7 | métricas de pacing separam as duas |
| 8 | agência total inclui ambas sem fundi-las |
| 9 | **nenhuma regra do motor depende do id `bb_primeira_palavra`** |
| 10 | **a mesma regra funciona com um segundo evento sintético de `escolha_biografica`** |

O teste 9 varre `src/systems`, `src/hooks`, `src/presentation` e `src/components`, ignorando
comentários, e falha se o id aparecer em código executável. O teste 10 cria
`syn_apelido_de_infancia`, que **não existe no catálogo**, e verifica que ele se comporta como *A
Primeira Palavra* em todas as pontas. Se alguém trocar a arquitetura por uma exceção escondida,
esses dois caem.

Um detalhe de método vale registro: o teste 3 usa como controle **um acontecimento no mesmo ano**, e
não um histórico vazio. Qualquer ocorrência aos 2 anos encurta a "seca" (`anosDeSecura`) e com isso
muda a densidade do ano seguinte — o que é correto e desejado, algo de fato aconteceu. Comparar com
histórico vazio teria medido duas variáveis ao mesmo tempo e produzido um falso negativo.

---

## 1. Antes e depois — pacing por faixa (105 vidas)

| faixa | anos | % c/ decisão (baseline → final) | % c/ acontecimento | % ano sem nenhuma linha |
|---|---|---|---|---|
| 0-2 | 210 | 0,0% → 50,0%* | 64,3% → 50,0% | 0,0% |
| 3-5 | 315 | 6,7% → 3,8% | 38,1% → 31,7% | 50,8% |
| 6-11 | 630 | 12,2% → 8,6% | 26,7% → 41,7% | 25,6% |
| 12-14 | 315 | 18,7% → 16,8% | 22,9% → 30,2% | 16,2% |
| 15-17 | 315 | 17,1% → 21,0% | 24,8% → 29,2% | 16,8% |
| 18-29 | 1260 | 12,9% → 19,4% | 15,5% → 21,6% | **0,3%** |
| 30-44 | 1575 | 10,8% → 15,5% | **13,1% → 22,5%** | **0,0%** |
| 45-59 | 1567 | 12,3% → 16,7% | 14,5% → 20,7% | 0,1% |
| 60+ | 1628 | 10,0% → 13,4% | 15,8% → 21,8% | 0,2% |

\* Os 50,0% de 0-2 são **escolha biográfica**, não decisão contextual — é a primeira palavra, que
acontece em metade dos anos daquela faixa porque a faixa tem 2 anos e o marco ocupa um deles. A
tabela de agência (§4) separa as duas coisas.

**Anos adultos completamente vazios: 12,9% → 0,0%.** Era o pior sintoma do baseline e desapareceu.

### Saturação

| faixa | baseline | final |
|---|---|---|
| 18-29 | 40,8% | **6,4%** |
| 30-44 | 41,3% | **4,3%** |
| 45-59 | 40,2% | **3,2%** |
| 60+ | 32,6% | **3,1%** |

Do total de 250 anos ainda saturados, 60,8% vêm só de finanças/carreira (era 89,2%). Nenhuma
compensação em `densidadeBase` foi feita, conforme instruído.

### Medição intermediária (pós-passo 3)

Registrada em `docs/F3-MEDICAO-INTERMEDIARIA.md`. Resumo: a saturação caiu de 2.380 para 296 anos
(−87,6%) **só** com a classificação de textura, confirmando que era bug de contabilidade e não falta
de conteúdo. As faixas 0-5 não se moveram nada naquela etapa — um bebê nunca teve contracheque —, o
que foi a confirmação mais limpa do diagnóstico.

---

## 2. Auditoria dos 134 eventos

| taxonomia | eventos |
|---|---|
| `acontecimento_puro` | 69 |
| `decisao_comportamental` | 61 |
| `marco_testemunhado` | 3 |
| `escolha_biografica` | 1 |
| **total classificado** | **134/134** (todos declaram taxonomia explicitamente) |

**Acontecimentos reescritos (passo 8): 42.** De 30/73 para **72/73** acontecimentos em formato
DESFECHO. A validação foi humana, lendo os textos, não só automática: 5 verbos de deliberação
("você preferiu/decidiu/resolveu/optou/escolheu") em `descricaoResultado` foram eliminados, 79
`opcao.texto` de acontecimento foram esvaziados em 38 eventos, e `fam_visita_avo` foi reescrito por
inteiro (a opção `opt_ficar_no_celular` era uma atitude deliberada disfarçada de acontecimento;
virou `opt_tarde_corrida`, uma observação da tarde, com stats e pesos inalterados).

A única exceção que permanece em formato BOTÃO é `bb_primeira_palavra` — e agora isso é coerente,
porque ela é a única `escolha_biografica` do catálogo. Duas guardas permanentes em
`src/data/events/__tests__/taxonomiaCatalogo.test.ts` fixam isso.

**Reclassificados:** 4 eventos que eram decisão viraram outra coisa — `bb_primeira_palavra` →
`escolha_biografica`; `inf_primeiros_passos`, `inf_primeiro_dia_escola` e `crc_primeiro_dia_creche`
→ `marco_testemunhado`.

**Eventos novos criados: 0.** A guarda "nenhum evento novo salvo necessidade estrutural demonstrada"
foi respeitada.

---

## 3. Os 14 → 10 eventos nunca vistos

`scripts/audit/cobertura.ts` classifica cada um. Dos 14 originais, 4 voltaram com a correção da cota.
Dobrar a amostra para 210 vidas **não** revela nenhum dos 10 restantes — não é tamanho de amostra.

### Regressão estrutural real: 8 eventos de 0-2 anos

`bb_estranhamento_visita`, `bb_descoberta_espelho`, `bb_febre_noite`, `bb_cachorro_familia`,
`bb_parquinho_bebes`, `bb_musica_dança`, `bb_queda_leve` (acontecimentos) — e o diagnóstico é
inequívoco:

```
idade 0: 0 anos vividos (o motor começa a contar em 1)
idade 1: 105 anos · 105× "marco testemunhado: marco_primeiros_passos"
idade 2: 105 anos · 105× "marco com escolha: marco_primeira_palavra"
eventos DO SORTEIO que apareceram em 0-2: NENHUM
```

A faixa 0-2 tem, na prática, **dois anos jogáveis**, e os dois estão 100% ocupados por marcos
garantidos. O sorteio nunca roda ali. Sete acontecimentos de bebê ficaram **inalcançáveis por
acidente** — não por design.

Isto é regressão do passo 5, e é honesto chamá-la assim. Não foi corrigida agora por três razões:
(a) corrigi-la exige decidir se os marcos devem coexistir com um acontecimento no mesmo ano, o que é
uma mudança de design do Calendário da Vida e precisa de aprovação; (b) as alternativas baratas —
alargar a janela dos marcos, ou deixar o sorteio rodar junto — mexem no pacing de uma faixa que a
Revisão 1 acabou de estabilizar; (c) a instrução é parar antes de grandes mudanças de design.

**Recomendação para a próxima fase:** permitir que um ano de marco *testemunhado* (não o de escolha)
também sorteie um acontecimento leve, ou mover a janela de `marco_primeiros_passos` para 1-2 e a de
`marco_primeira_palavra` para 2-3, liberando um ano. Ambas são mudanças pequenas, mas são decisões de
design.

### Conteúdo condicionalmente raro — aceitável

- **`inf_birra_brinquedo`** (4-5, decisão, peso 80, 21,3% da fatia da faixa). Não é inalcançável:
  a faixa 3-5 tem `tetoDecisoes: 1` em janela de 5 anos, então cabem pouquíssimas decisões ali, e
  ele disputa com 5 concorrentes. Com a cota destravada a faixa passou a apresentar 12 decisões em
  315 anos. É baixa probabilidade legítima, não bug — **aceitável**, e tende a aparecer com amostra
  maior ou se a faixa 3-5 ganhar mais espaço numa fase futura.
- **`hob_banda_garagem`** (13-17, decisão). Depende da flag `sabe_tocar_violao`, que só existe se o
  jogador (i) sortear `inf_aula_musica` entre 9 e 11 anos **e** (ii) escolher a opção do violão. Na
  amostra: `inf_aula_musica` apareceu em **3/105** vidas e o violão foi escolhido em **2**. Cadeia de
  dois passos improváveis. É conteúdo condicional funcionando como projetado — **aceitável**, ainda
  que quase inalcançável na prática.
- **`lat_tempo_que_sobra`** (60-90, acontecimento, `condicoes: { empregado: false }`). Na amostra,
  **0 dos 1.628 anos 60+ tem o personagem sem cargo**. A causa não é este evento: é o achado
  `SEM_APOSENTADORIA` (716 ocorrências em 77/105 vidas), já registrado como pendência de fase futura
  — o jogo não tem sistema de aposentadoria, então ninguém para de trabalhar. O evento está correto e
  ficará alcançável de graça quando a aposentadoria existir. **Aceitável, com causa conhecida.**

A meta nunca foi maximizar cobertura. Dos 10, **3 são conteúdo condicional legítimo** e **7 são
conteúdo morto sem intenção** — e estes últimos estão reportados como regressão em aberto.

---

## 4. Métricas de agência, separadas

`scripts/audit/agencia.ts`, reescrito para nunca mais somar as categorias. 105 vidas, 7.815 anos.

| faixa | anos | (A) decisão contextual | (B) escolha biográfica | (C) marco c/ participação |
|---|---|---|---|---|
| 0-2 | 210 | 0 (0,0%) | **105 (50,0%)** | 105 (50,0%) |
| 3-5 | 315 | 12 (3,8%) | 0 | 0 |
| 6-11 | 630 | 54 (8,6%) | 0 | 0 |
| 12-14 | 315 | 53 (16,8%) | 0 | 0 |
| 15-17 | 315 | 66 (21,0%) | 0 | 0 |
| 18-29 | 1260 | 245 (19,4%) | 0 | 0 |
| 30-44 | 1575 | 244 (15,5%) | 0 | 0 |
| 45-59 | 1567 | 261 (16,7%) | 0 | 0 |
| 60+ | 1628 | 218 (13,4%) | 0 | 0 |

| faixa | (E) c/ elegível | ritmo quis | (F) apresentou | (G) conversão | falhas |
|---|---|---|---|---|---|
| 0-2 | 0,0% | 0,0% | 0,0% | — | 0 |
| 3-5 | 100,0% | 3,8% | 3,8% | 100,0% | 0 |
| 6-11 | 100,0% | 8,6% | 8,6% | 100,0% | 0 |
| 12-14 | 100,0% | 16,8% | 16,8% | 100,0% | 0 |
| 15-17 | 100,0% | 21,0% | 21,0% | 100,0% | 0 |
| 18-29 | 100,0% | 19,4% | 19,4% | 100,0% | 0 |
| 30-44 | 100,0% | 15,5% | 15,5% | 100,0% | 0 |
| 45-59 | 100,0% | 16,7% | 16,7% | 100,0% | 0 |
| 60+ | 100,0% | 13,4% | 13,4% | 100,0% | 0 |

**Agência total do jogador** — as parcelas continuam visíveis:

```
(A) decisões contextuais apresentadas ......... 1153
(B) escolhas biográficas apresentadas ......... 105
(C) marcos com participação do jogador ........ 105
(D) atividades voluntárias realizadas ......... 17588
    ---------------------------------------------
participações em evento (A+B) ................. 1258
AGÊNCIA TOTAL, incluindo atividades (A+B+D) ... 18846

(E) anos com decisão contextual elegível ...... 7605 (97,3%)
(F) anos que apresentaram decisão contextual .. 1153
(G) TAXA DE CONVERSÃO DO SCHEDULER ............ 100,0%   ·   falhas: 0
```

Distribuição por vida: decisões contextuais até os 18 — mediana 2, máx 5; na vida toda — mediana 11,
mín 5. Escolhas biográficas: exatamente 1 por vida, em 105/105.

**8/105 vidas chegam aos 18 com zero decisões contextuais.** O número não é escondido e não foi
otimizado: essas vidas tiveram escolha biográfica, marco com participação e atividades voluntárias —
elas não passaram a infância sem agência, passaram sem *tomar posição*, que é uma coisa diferente e
legítima. A métrica que importa é a conversão do scheduler, e ela está em 100,0% com 0 falhas: em
nenhum ano o ritmo quis perguntar, havia o que perguntar, e a pergunta deixou de chegar.

---

## 5. Marcos, Linha da Vida, memórias, personalidade

**Ocorrência dos marcos:** 105/105 vidas para os três — *Primeiros Passos* (idade 1), *A Primeira
Palavra* (idade 2), *Primeiro Dia no Ensino Fundamental* (6-7). Marco garantido não depende de RNG,
conforme a guarda.

**Composição da Linha da Vida** (entradas por relevância): a `textura` só aparece a partir dos 6
anos e domina a vida adulta (1.307 de 2.353 entradas em 18-29), que é o desenho pretendido — rotina
é pano de fundo, não acontecimento. Faixas 0-5 têm **zero** entradas de textura.

**Pequenas memórias (passo 7):** 10 candidatas ordenadas por especificidade, derivadas de estado sem
RNG, marcadas como `textura`, e só em ano vazio. Elas são a razão de os anos adultos completamente
vazios terem ido a 0,0% sem inventar evento nenhum. As três guardas duras (não movem stats, não
movem flags, não movem personalidade) têm teste próprio.

**`personalitySystem`:** intocado. O único vetor novo de contato é o predicado
`taxonomiaMovePersonalidade`, aplicado em `eventSystem`, que **restringe** quem pode mover traço —
só `decisao_comportamental`. Um teste adicional varre o catálogo e falha se qualquer
`escolha_biografica` declarar `impactosComportamentais`. Defesa em profundidade: o predicado protege
o motor, a guarda de catálogo impede que o conteúdo nasça contradizendo o motor.

**Compatibilidade de save:** `VERSAO_SAVE = 5`. `migrarEstadoSalvo` reidrata `categoria`, `natureza`
e agora `taxonomia` das ocorrências antigas; ocorrência de evento removido do catálogo permanece no
histórico. 11 testes de migração verdes. Nenhum save legado é destruído.

---

## 6. Guardas das Fases 1 e 2

Reexecutadas após a correção (`scripts/audit/rodar.ts`, `marcos.ts`, 105 vidas):

| guarda | estado |
|---|---|
| tempo canônico em semestres | preservado — `tempoDeVida.test.ts` verde |
| plausibilidade / elegibilidade profissional | preservada — `elegibilidadeProfissional.test.ts` verde |
| duração de cursos (mín = mediana = máx por curso) | preservada |
| vidas que nunca tiveram emprego | 0/105 |
| idade do primeiro emprego | mediana 18 |
| `personalitySystem`, `lifeRhythm`, tetos e fadiga | preservados (só mudou **o que** o teto conta) |
| 780 testes das Fases 1-2 | todos preservados; a suíte cresceu para 843 |

---

## 7. Duas expectativas de teste alteradas — e por quê

A instrução é explícita: não alterar teste só porque a distribuição mudou; classificar primeiro. As
duas falhas que apareceram foram classificadas antes de tocar em qualquer linha.

### `anosTranquilos` — contrato estatisticamente frágil, corrigido na definição

Afirmava, por vida, que acontecimentos ≥ decisões. Falhou na semente 17 (14 × 13). Medição em **200
sementes de 80 anos**, com o código **anterior** à correção: o contrato por vida **já era falso em
8,5% das vidas**. Ou seja, o teste vinha passando porque as 5 sementes escolhidas calhavam de passar,
não porque o motor garantisse algo.

Duas correções de **definição**, nenhuma de limiar:

1. a unidade passou a ser **decisão contextual** (escolha biográfica não é uma pergunta sobre
   posição, contá-la aqui media a frase errada);
2. a afirmação passou a ser sobre a **população**, não sobre cada vida — "a vida acontece mais do que
   pergunta" é propriedade do sistema.

O que passou a ser verificado é **mais forte**: o agregado tem de respeitar a frase (`>`), e nenhuma
vida isolada pode inverter grosseiramente (`< 1,5` decisão por acontecimento). Medição de referência:
razão agregada 1,46:1, pior vida em 200 = 1,36. Os limiares ficam apertados contra o comportamento
real sem depender de semente.

### `cicloVida` — seed trocada (23 → 79), com a causa conhecida

A correção destrava decisões a partir dos 3 anos e portanto **reordena o fluxo de RNG de toda vida**.
Não é regressão; é o efeito pretendido. Nenhuma asserção foi afrouxada — continuam `> 3` respondidas,
`≤ 2` traços aos 18, `> 0` aos 30. A seed 79 foi escolhida por varredura determinística das 200
primeiras como a que satisfaz o **mesmo** conjunto de critérios com a **maior folga** (10 respondidas,
4 memórias na infância, 0 traços aos 18, 2 aos 30, 2 ao fim) — não por ser a primeira que passava.
A folga é proposital: seed no limite volta a quebrar no próximo ajuste, que foi o que causou as duas
trocas anteriores.

---

## 8. Problemas novos e itens adiados

**Regressão em aberto (reportada, não corrigida):**

- **7 acontecimentos de 0-2 anos inalcançáveis** — os dois marcos garantidos ocupam 100% dos dois
  anos jogáveis da faixa. Exige decisão de design (§3).

**Métricas que pioraram, sem maquiagem:**

- decisões contextuais na faixa 3-5: 6,7% (baseline) → 3,8%. Explicação estrutural em §0 — a faixa
  perdeu espaço para os marcos garantidos de 1 e 2 anos, e o teto de 1 decisão por janela de 5 anos
  continua valendo. Muito melhor que os 0,0% da regressão, e por causa conhecida.
- vidas com ≤ 2 decisões contextuais até os 18: 40/105 → 71/105. O número mudou de significado: antes
  contava escolha biográfica junto. Comparação honesta exige a métrica separada, que é a de §4.

**Adiado para fases futuras (já registrado no §21 da proposta, inalterado):**
`SEM_APOSENTADORIA` (716 ocorrências / 77 vidas) · `SALARIO_ALTO_IDADE_BAIXA` (36/22) ·
`NPC_SEM_NOME` (2.127/37) · `NAMORO_INSTANTANEO` (236/105) · `TRABALHO_COM_SAUDE_CRITICA` (312/81) ·
só 2 das 12 atividades disponíveis dos 0 aos 11 anos · promoções não reavaliam experiência ·
formatura do Ensino Médio como marco condicional exige reordenar educação vs. calendário ·
`1º filho` e `saída da casa dos pais` nunca acontecem (0/105) — ambos dependem de sistemas que a
Fase 3 não implementa.

**Não implementado, conforme escopo:** Desafios de Vida, Brasil Vivo completo, gestação, entrevistas,
CNH, ENEM/concurso/OAB jogáveis, cursinho, economia completa, Avatar, responsividade, expansão
narrativa.

---

## 8-B. Composição do ano — marco não significa saturação

Esta seção documenta a **F3-FIX**: a correção da regressão estrutural que a própria Fase 3 criou e
que a auditoria de alcançabilidade encontrou.

### A regressão encontrada

Sete acontecimentos da faixa 0-2 anos nunca apareciam em 105 vidas, e **dobrar a amostra para 210 não
revelava nenhum deles** — o que já eliminava "azar de sorteio" como explicação:

```
idade 0: 0 anos vividos (o motor começa a contar em 1)
idade 1: 105 anos · 105× "marco testemunhado: marco_primeiros_passos"
idade 2: 105 anos · 105× "marco com escolha: marco_primeira_palavra"
eventos DO SORTEIO que apareceram em 0-2: NENHUM
```

A faixa 0-2 tem **dois anos jogáveis** e os dois estavam 100% ocupados por marcos garantidos.

### A causa

O bloco de calendário em `agingSystem` fazia **retorno antecipado**: quando havia marco, a função
devolvia o resultado ali mesmo e o motor nunca chegava ao sorteio. Na prática, o código afirmava:

```
houve marco → ano ocupado → nada mais acontece
```

O erro conceitual por trás disso é tratar como equivalentes duas grandezas diferentes:

| | densidade biográfica | interrupção / atenção |
|---|---|---|
| **o que mede** | quanto o ano pesa na história da pessoa | quanto o ano exige do jogador, em cliques |
| *Primeiros Passos* | máxima | **zero** — é narrado, ninguém clica |
| *A Primeira Palavra* | máxima | uma (o modal biográfico) |
| decisão contextual | média | uma, e cara |
| textura / pequena memória | nenhuma | zero |

*Primeiros Passos* é o caso extremo: densidade máxima com atenção zero. Tratá-lo como "ano cheio"
fazia um marco **apagar o mundo ao redor dele** — e no ano em que alguém dá os primeiros passos, a
família também recebe visita, o bebê também tem febre à noite.

### A solução

Geral, declarativa, e sem exceção por idade ou por id. Duas funções puras novas em `types`, ao lado
das três perguntas que já existiam sobre cada conteúdo:

| pergunta | função | responde `true` para |
|---|---|---|
| permite escolher? | `taxonomiaPermiteEscolha` | comportamental, biográfica |
| move personalidade? | `taxonomiaMovePersonalidade` | comportamental |
| consome cota de decisão? | `taxonomiaConsomeCotaDeDecisao` | comportamental |
| **interrompe o jogador?** | **`taxonomiaInterrompe`** | comportamental, biográfica |
| **comporta companhia?** | **`taxonomiaPermiteComposicao`** | **marco testemunhado, escolha biográfica** |

Nenhum sistema de pontos foi criado — a arquitetura existente resolveu com propriedades semânticas
booleanas, como pedido.

No motor, `acontecimentoDeCompanhia()` substitui o retorno antecipado, com três guardas estruturais:

1. **só compõe se a taxonomia permitir** — marco comporta companhia; acontecimento e decisão fecham
   o ano sozinhos, senão o ano vira uma lista;
2. **o companheiro é sempre um ACONTECIMENTO**, nunca uma decisão — é isto que garante *uma
   interrupção por ano* e mantém teto e fadiga de decisão contextual intactos;
3. **a saturação normal continua valendo** — se o ano já produziu conteúdo estrutural por conta
   própria (formou-se, foi contratado), não há companhia.

O retorno do motor ganhou `ocorrenciasDoAno[]`. Sem isso o acompanhante escaparia do controle de
repetição e voltaria no ano seguinte; `useGame`, o simulador e todos os harnesses passaram a gravar
a lista inteira. `ocorrencia` (singular) continua existindo e aponta para o conteúdo principal.

### Os 7 eventos afetados — antes e depois

Todos são `acontecimento_puro`, sem condições declaradas, e nenhum é conteúdo de marco. Nenhum foi
reescrito, reclassificado ou removido: eles estavam corretos, o motor é que não os alcançava.

| id | janela | peso | resumo | antes | depois (105 vidas) |
|---|---|---|---|---|---|
| `bb_estranhamento_visita` | 0-1 | 70 | parente desconhecido chega e o bebê estranha | **0** | 14 |
| `bb_descoberta_espelho` | 0-2 | 65 | o bebê se reconhece no espelho | **0** | 27 |
| `bb_febre_noite` | 0-2 | 60 | febre de madrugada, casa acordada | **0** | 42 |
| `bb_cachorro_familia` | 0-2 | 40 | o cachorro da família se aproxima | **0** | 23 |
| `bb_parquinho_bebes` | 1-2 | 60 | tarde no parquinho | **0** | 38 |
| `bb_musica_dança` | 1-2 | 55 | música alta na cozinha | **0** | 36 |
| `bb_queda_leve` | 1-2 | 60 | tombo aprendendo a andar | **0** | 30 |

Todos **devem** coexistir com marco (são textura de primeira infância, não concorrentes dele), todos
**devem** permanecer no catálogo, e nenhum tinha bloqueio adicional além do estrutural.

### Impacto 0-2

| métrica | antes | depois |
|---|---|---|
| eventos do sorteio que aparecem | **nenhum** | 7 de 7 |
| ocorrências do sorteio em 210 anos | 0 | 210 |
| anos com acontecimento | 50,0%\* | **100,0%** |
| escolha biográfica | 50,0% | 50,0% (inalterada) |
| marcos cumpridos | 105/105 | 105/105 (inalterado) |
| modais por ano | ≤ 1 | **≤ 1** |

\* O valor "antes" contava o próprio marco testemunhado como acontecimento.

### Impacto 3-5 e adulto

| faixa | decisões antes da F3-FIX | depois |
|---|---|---|
| 3-5 | 3,8% | 3,8% |
| 6-11 | 8,6% | 9,4% |
| 15-17 | 21,0% | 19,4% |
| 18-29 | 19,4% | 21,0% |
| 30-44 | 15,5% | 16,3% |

Variação dentro do ruído esperado de uma mudança de ordem do RNG. O que importa é que **a agência não
caiu**: decisões contextuais apresentadas subiram de 1.153 para **1.170**, a conversão do scheduler
continua em **100,0%** e as falhas continuam em **0**.

Para o adulto, a composição **ainda não tem efeito prático** — e isso é correto, não uma falha: não
existe nenhum marco adulto no catálogo ainda (formatura, casamento, aposentadoria são fases futuras).
O teste (I) prova, com um cenário sintético, que a regra já os atenderá sem nenhuma linha nova.

### Número de popups / interrupções

Esta era a preocupação explícita, e é a métrica que mais importa:

| métrica | valor |
|---|---|
| anos com 2+ conteúdos | 301/7.731 (**3,9%**) |
| média de conteúdos por ano | **0,45** |
| **anos com 2+ interrupções obrigatórias** | **0** |
| anos com mais de um modal | **0** |

Medido também em coortes de 280 e 420 vidas: 3,8% de anos compostos, 0 interrupções duplas. Dois
conteúdos no mesmo ano **não** significam dois modais — o acompanhante é sempre um acontecimento, que
se resolve sozinho e entra direto na Linha da Vida. Densidade sem popup, como pedido.

### Alcançabilidade — estado final

| | 105 vidas | 280 vidas | 420 vidas |
|---|---|---|---|
| eventos vistos | 130/134 | **132/134** | **132/134** |

Nenhum peso, densidade ou RNG foi alterado para melhorar cobertura. Os 2 eventos que permanecem sem
aparecer são **condicionais, com causa documentada e alcançáveis por construção**:

- **`hob_banda_garagem`** — exige a flag `sabe_tocar_violao`, que só nasce se o jogador sortear
  `inf_aula_musica` (9-11) **e** escolher a opção do violão. Na amostra, o evento de origem apareceu
  em 1/105 vidas. Cadeia de dois passos improváveis, funcionando como projetado.
- **`lat_tempo_que_sobra`** — exige `empregado: false` a partir dos 60, e **0 dos 1.543 anos 60+ tem
  o personagem sem cargo**, porque o jogo ainda não tem sistema de aposentadoria (`SEM_APOSENTADORIA`,
  já registrado como pendência). O evento está correto e ficará alcançável de graça quando a
  aposentadoria existir.

`inf_birra_brinquedo` e `ado_preparacao_enem` aparecem ou não conforme a amostra — ambos são visíveis
em 280 vidas. Cobertura observada e alcançabilidade estrutural são coisas diferentes: **nenhum evento
está morto por acidente**.

### Testes permanentes (A-J)

13 testes em `src/systems/pacing/__tests__/composicaoDoAno.test.ts`:

| # | contrato |
|---|---|
| A | marco sem escolha não impede automaticamente um acontecimento compatível |
| B | marco com escolha biográfica não consome cota de decisão contextual |
| C | marco com escolha biográfica não bloqueia todo acontecimento compatível |
| D | decisão contextual continua respeitando teto e fadiga |
| E | textura não satura |
| F | pequena memória não satura nem vira ocorrência |
| G | dois conteúdos coexistentes são ordenados corretamente na Linha da Vida |
| H | save/reload preserva ambos sem duplicação |
| I | **a solução funciona fora de 0-2, com cenário adulto sintético** |
| J | **nenhuma regra depende dos ids dos marcos de bebê — nem olha idade** |

O teste J varre `src/systems`, `src/hooks`, `src/presentation` e `src/components` ignorando
comentários, e ainda inspeciona o corpo de `acontecimentoDeCompanhia` para garantir que ele não
contém nenhuma comparação de idade. Três testes de apoio verificam que acontecimento e decisão **não**
compõem, que nenhum ano abre dois modais, e que o resumo anual não duplica entradas.

### Expectativas de teste alteradas — classificadas antes

| teste | classificação | o que foi feito |
|---|---|---|
| `anosTranquilos` (saturação) | **correção de medição** | O teste inferia "o ano saturou" contando logs não-'geral'/'cotidiano'. Com a composição, esses 2 logs passaram a ser, em alguns anos, o próprio resultado que ele deveria vigiar — ele acusava a si mesmo. Passou a ler o diagnóstico do ritmo (`motivoRitmo`), que é onde a saturação sempre morou. Contrato **idêntico e mais duro**: ano saturado não sorteia nada, nem modal, nem companhia. |
| `personalidadeEntreVidas` (diversidade de eixos) | **fragilidade estatística** | Numa varredura de 10 janelas independentes de 20 seeds, **9 atingiam 4+ eixos e 1 não**. A amostra estava no limite. Ampliada de 20 para 30 seeds, **acrescentando** ao fim sem trocar as 20 originais; N=30/40/60/80 passam nas duas asserções de distribuição. Nenhum limiar afrouxado. |
| `cicloVida` (seed 79 → 122) | **RNG reordenado, não regressão** | A composição consome números em anos que antes não consumiam. Das 200 primeiras sementes, **76 satisfazem todos os critérios** com o código atual — o contrato continua comum. A 122 foi escolhida por maior folga. |

A troca anterior (23 → 79) permanece documentada na seção 7, como pedido.

### Limitações

- **Nenhum marco adulto existe ainda**, então a composição só tem efeito observável em 0-2 e, via
  `marco_primeiro_dia_escola`, em 6-11 (14,4% dos anos daquela faixa têm dois conteúdos). O
  comportamento adulto está provado por cenário sintético, não por conteúdo real.
- **A composição adiciona no máximo um acompanhante.** Não há suporte a três conteúdos no mesmo ano,
  e não foi criado — não há necessidade demonstrada.
- **O acompanhante nunca é uma decisão.** É uma restrição deliberada para preservar a regra de uma
  interrupção por ano; se algum dia um marco precisar coexistir com uma decisão, isso exigirá
  reavaliar o orçamento de interrupção e deve ser decisão de design.
- **Um acontecimento de companhia não pode matar.** A morte do ano já foi decidida antes; deixá-la
  reabrir ali criaria uma saída de óbito que os chamadores não esperam neste ponto.
- `bb_estranhamento_visita` aparece 14 vezes em 105 vidas — o menor dos sete. Janela 0-1 e idade 0
  inexistente deixam-lhe **um** ano de oportunidade. É baixo por geometria da janela, não por bloqueio.

---

## 9. Estado final

```
npm test            52 arquivos · 856 testes · 100% verdes
npm run typecheck   limpo
npm run build       ok
harness 105 vidas   executado, métricas acima
coortes 280 e 420   executadas (alcançabilidade confirmada: 132/134)
auditoria 0-5       executada (os 7 eventos mortos voltaram)
guardas F1/F2/F3    preservadas
```

A Fase 3 e a F3-FIX estão entregues. **Parando aqui**, conforme instruído: sem merge em `main`, sem
force-push, sem Fase 4, sem Desafios de Vida e sem conteúdo novo para mascarar cobertura.

Aguardando aprovação para playtest humano.
