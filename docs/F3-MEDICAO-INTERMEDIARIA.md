# Fase 3 — Medição intermediária (após o passo 3)

Efeito **isolado** de três mudanças, sem calendário, sem marcos, sem pequenas memórias:

1. classificação taxonômica dos 134 eventos (passo 1);
2. `relevancia` declarada nos 36 produtores de log (passo 2);
3. densidade biográfica: `textura` deixa de ocupar o ano (passo 3).

Mesmas 105 vidas, mesmos seeds das Fases 1 e 2. `scripts/audit/pacing.ts`.

---

## O alvo principal: saturação

| métrica | baseline | após passo 3 | efeito |
|---|---|---|---|
| anos de silêncio por saturação estrutural | 2.380 (44,4% do silêncio) | **296 (6,3%)** | **−87,6%** |
| saturação vinda só de finanças/carreira | 89,2% | **53,7% de um total 8× menor** (159 anos) | **2.123 → 159** |
| saturação 18-29 | 40,8% | **6,6%** | |
| saturação 30-44 | 41,3% | **3,9%** | |
| saturação 45-59 | 40,2% | **2,8%** | |
| saturação 60+ | 32,6% | **5,1%** | |

O portão abriu. A hipótese do diagnóstico se confirmou de forma quase exata: era um bug de
contabilidade, não falta de conteúdo.

## Pacing por faixa

| faixa | % ano c/ decisão | | % ano c/ acontecimento | | % pulso silêncio | |
|---|---|---|---|---|---|---|
| | antes | depois | antes | depois | antes | depois |
| 0-2 | 0,0% | 0,0% | 64,3% | 64,3% | 35,7% | 35,7% |
| 3-5 | 6,7% | 6,7% | 38,1% | 38,1% | 55,2% | 55,2% |
| 6-11 | 12,2% | 12,7% | 26,7% | **32,5%** | 61,1% | **54,8%** |
| 12-14 | 18,7% | 17,1% | 22,9% | **31,1%** | 58,4% | **51,7%** |
| 15-17 | 17,1% | **20,0%** | 24,8% | 27,6% | 58,1% | 52,4% |
| 18-29 | 12,9% | **18,7%** | 15,5% | **23,7%** | 71,7% | **57,5%** |
| 30-44 | 10,8% | **15,8%** | **13,1%** | **22,3%** | 76,1% | **61,9%** |
| 45-59 | 12,3% | 16,1% | 14,5% | **21,6%** | 73,3% | **62,3%** |
| 60+ | 10,0% | 12,7% | 15,8% | **24,4%** | 74,2% | **62,9%** |

As faixas 0-5 não se moveram **nada**, o que é a confirmação mais limpa do diagnóstico: um bebê nunca
teve contracheque, logo nunca sofreu do problema. A correção agiu exatamente onde o problema estava.

## Inundação? Não

Item explicitamente vigiado (risco R1 da proposta).

| guarda | limite | antes | depois | ok? |
|---|---|---|---|---|
| razão acontecimento : decisão | entre 1,2 e 3 | 1,63 : 1 | **1,75 : 1** | sim — e melhorou |
| maior % de anos com decisão em qualquer faixa | < ~25% | 18,7% | **20,0%** (15-17) | sim |
| decisões/vida (mediana) | não explodir | 8 | 11 | aceitável |

A razão **subiu** a favor dos acontecimentos: o que voltou ao jogo foi majoritariamente vida
acontecendo, não pergunta. Os tetos e a fadiga do `lifeRhythm` continuam intactos e fizeram seu
trabalho — nenhuma compensação em `densidadeBase` foi necessária, conforme instruído.

## Linha da Vida

| métrica | antes | depois |
|---|---|---|
| logs com `relevancia` declarada | ~2% | **100% dos 36 produtores** |
| entradas `textura` emitidas | **0** | 4.591 |
| entradas `marco` emitidas | 198 | **2.718** |
| anos adultos só com rotina financeira | 28,0% | **22,1%** |
| anos adultos com alguma linha | 87,0% | 85,3% |
| maior sequência muda por vida | máx 5 | máx 5 |
| vidas com ≥5 anos mudos | 3/105 | 2/105 |

## Efeitos colaterais observados

**Vidas ficaram mais longas.** Anos adultos 5.900 → 6.137; faixa 60+ 1.515 → 1.739 anos-jogador. Não
é bug: com mais acontecimentos sendo resolvidos, mais desfechos de saúde positiva são aplicados, e a
mortalidade cai um pouco. Vale observar na medição final.

**Anos adultos completamente vazios: 12,9% → 14,6%.** Subiu, e é esperado: antes, um ano "saturado"
por dois logs de rotina não era vazio — ele tinha as duas linhas de contracheque. Agora essas linhas
são `textura` e o ano que só tem elas conta como sem biografia. É exatamente o buraco que as
**pequenas memórias** (passo 7) existem para preencher. Não vou compensar isso agora.

**Um evento saiu de cena:** `ado_pressao_grupo_festa` (15-17) deixou de aparecer nas 105 vidas —
antes aparecia. Eventos nunca vistos: 2 → 3. Efeito de redistribuição do sorteio, não de bloqueio;
reavaliar na medição final.

## Ainda não resolvido nesta etapa

Os marcos continuam em sorteio: *A Primeira Palavra* **17%**, *Primeiros Passos* **13%** — idênticos
ao baseline, como esperado (o calendário é o passo 5).

Vidas que chegam aos 18 com zero decisões: **4/105**, inalterado. A nova métrica de conversão de
oportunidade (Revisão 3) vai dizer se são falha do scheduler ou trajetórias coerentes.
