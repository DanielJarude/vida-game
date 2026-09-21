# Auditoria de Coerência Humana — VIDA

**Data:** 21 de setembro de 2026
**Escopo:** auditoria completa, não implementação. Nenhum arquivo de produção foi alterado.
**Base:** branch `arena/01a0c250-vida-game`, a partir de `80b4e32` (`claude/vida-roadmap`).
**Método:** 105 vidas completas simuladas pelo pipeline real + 10 reproduções isoladas + leitura integral dos 15 sistemas.

---

## Índice

1. [Resumo executivo](#1-resumo-executivo)
2. [Metodologia](#2-metodologia)
3. [Estado atual do jogo](#3-estado-atual-do-jogo)
4. [Problemas críticos](#4-problemas-críticos)
5. [Educação](#5-educação)
6. [Carreira](#6-carreira)
7. [Economia](#7-economia)
8. [Relacionamentos e família](#8-relacionamentos-e-família)
9. [Pacing e agência](#9-pacing-e-agência)
10. [Linha da Vida](#10-linha-da-vida)
11. [Personalidade](#11-personalidade)
12. [Avatar](#12-avatar)
13. [Localização](#13-localização)
14. [Brasil como sistema](#14-brasil-como-sistema)
15. [Save e exploits](#15-save-e-exploits)
16. [Responsividade](#16-responsividade)
17. [Incoerências entre sistemas](#17-incoerências-entre-sistemas)
18. [Problemas fora do prompt](#18-problemas-fora-do-prompt)
19. [Métricas](#19-métricas)
20. [Exemplos de vidas incoerentes](#20-exemplos-de-vidas-incoerentes)
21. [O que preservar](#21-o-que-preservar)
22. [O que corrigir](#22-o-que-corrigir)
23. [O que redesenhar](#23-o-que-redesenhar)
24. [O que remover](#24-o-que-remover)
25. [Arquitetura recomendada](#25-arquitetura-recomendada)
26. [Ordem de correção](#26-ordem-de-correção)
27. [Matriz MANTER / REFINAR / REFAZER / REMOVER](#27-matriz-manter--refinar--refazer--remover)

---

## 1. Resumo executivo

O VIDA tem uma **fundação melhor do que o resultado que entrega**. A arquitetura está certa
(sistemas puros, separados, testáveis, com apresentação isolada do domínio), a suíte tem
716 testes verdes em 44 arquivos, o texto em pt-BR é de qualidade real e as camadas mais
recentes — ritmo de vida, política de repetição, natureza acontecimento×decisão,
capacidade de interação por idade — são decisões de design corretas e bem implementadas.

**O problema não é a arquitetura. É que quase nenhuma regra do mundo é conferida na hora de agir.**

Um padrão se repete em cinco sistemas diferentes: o dado que descreveria a regra **existe no tipo**,
é preenchido no catálogo, é lido pela interface — e **nunca é verificado** pelo motor.

| Dado declarado | Onde vive | Quem confere |
| --- | --- | --- |
| `Job.experienciaNecessaria` | `types/index.ts:195`, 22 de 36 profissões | **ninguém** |
| `CourseOption` ↔ profissão correspondente | `coursesData.ts` / `careersData.ts` | **ninguém** |
| `Municipio.custoVidaRelativo` | 91 municípios | **ninguém** (só 2 testes) |
| `Character.classeSocial` | criação de personagem | só o saldo inicial |
| `CareerState.aposentado` / `rendaAposentadoria` | `types/index.ts:209-210` | nada nunca escreve `true` |
| `EducationState.desempenho` | atualizado todo ano | só é exibido na tela |
| `AparenciaAvatar` ↔ `Character.genero` | criação de personagem | o renderer não lê gênero |

O efeito humano disso é a lista exata que o playtest relatou: um técnico concluído em um ano,
um mestre de obras de 18 anos ganhando R$ 7.500, R$ 166.910 aos 20 anos sem explicação, uma
namorada e uma filha surgindo no mesmo clique. Não são sete bugs. São **sete sintomas de uma
única causa estrutural: falta uma camada de validação de plausibilidade entre "o jogador pediu"
e "o motor concedeu".**

### Os cinco achados que mais custam ao jogo

1. **Nenhuma checagem de experiência, de curso ou de licença profissional em contratação.**
   Medido: uma pessoa formada **só em Pedagogia**, aos 22 anos, com zero anos de experiência,
   recebe **34 vagas** na tela — incluindo *Médico Clínico Geral* (R$ 19.500/mês), *Auditor Fiscal*
   (R$ 33.000) e *COO* (R$ 28.000) — e é **contratada como médica**. É o caso "Mestre de Obras aos 18",
   e ele não é uma exceção: é o comportamento padrão.

2. **Off-by-one na formatura + cursos de 3 semestres.** `semestreAtual` começa em 1, soma 2 por ano
   e a formatura dispara em `>= totalSemestres`. Cursos de 3 semestres formam em **1 ano**. Medido em
   todos os 17 cursos: *Técnico em Desenvolvimento de Sistemas*, *Técnico em Administração* e
   *MBA Executivo* saem em 1 ano; *Medicina* sai em 6 (correto). O relato humano estava certo.

3. **A vida adulta é 75% silêncio.** Medido por década: a **infância é a fase mais densa** do jogo
   (39,8% dos anos têm acontecimento) e dos 20 aos 80 o jogo passa ~75% dos anos sem produzir uma
   única linha, com só 10–12% de decisão. A agência está **invertida em relação à vida real**.
   Além disso, **4 de 105 vidas chegam aos 18 sem nenhuma decisão** — exatamente o relato do playtest.

4. **Nenhum marco de vida é garantido.** *A Primeira Palavra* aparece em **17%** das vidas;
   *Primeiros Passos* em **13%**. Os dois estão marcados `repeticao: { tipo: 'marco' }` no catálogo,
   mas `marco` só controla *repetição*, não *ocorrência*. O jogador pode viver uma vida inteira sem
   nunca ter falado a primeira palavra — e nunca saber que isso existia.

5. **Explosão patrimonial e demográfica na meia-idade.** Saldo mediano aos 60: **R$ 7.953.442**.
   Até **3 filhos nascidos no mesmo ano** (99 de 105 vidas), sem gestação, sem intervalo, sem custo.
   Promoção automática leva *Jovem Aprendiz* → *COO* (R$ 28.000) sem exigir um único diploma.

### Veredito de fundação

**A fundação é aproveitável. Nenhum sistema precisa ser jogado fora.**
Dos 15 sistemas auditados: **6 MANTER**, **6 REFINAR**, **3 REFAZER** (regras internas, não a
arquitetura), **0 REMOVER inteiro**. O que falta não é reescrever o que existe — é acrescentar
três peças que nunca foram construídas: **um validador de plausibilidade**, **um calendário de
vida** e **um livro-razão do dinheiro**.

---

## 2. Metodologia

Fluxo executado: **AUDITAR → REPRODUZIR → MEDIR → IDENTIFICAR CAUSA → CLASSIFICAR → DOCUMENTAR**.

### 2.1. Leitura de código

Leitura integral de `src/types/index.ts`, `src/hooks/useGame.ts` (980 linhas de orquestração) e dos
15 sistemas em `src/systems/`, mais `src/data/` (catálogos), `src/presentation/` (avatar, timeline,
desfechos) e `src/styles/`. Rastreamento por `grep` de cada campo de tipo até seu ponto de uso real —
foi assim que os "dados mortos" da tabela do resumo executivo apareceram.

### 2.2. Harness de simulação (novo)

`scripts/audit/simulador.ts` simula **uma vida inteira, do nascimento à morte**, chamando o pipeline
real de produção: `executarPassagemDeAno`, `aplicarConsequenciasEscolha`, `ingressarCurso`,
`candidatarEmprego`, `trabalharMais`, `pedirAumento`, `escolherBico`, `iniciarNamoro`,
`pedirEmCasamento`, `terFilho`, `comprarBem`, `jogarMegaSena`, `calcularEfeitoAtividade`,
`definirPosturaEscolar`.

Não há mocks de regra: a única injeção é a fonte de aleatoriedade
(`definirFonteAleatoria(mulberry32(seed))`), o que torna cada vida **reproduzível por seed**.

Sete perfis comportamentais controlam com que frequência o "jogador simulado" age em cada domínio:
`estudioso`, `social`, `trabalho`, `passivo`, `arriscado`, `conservador`, `aleatorio`.
Isso evita medir só o comportamento ótimo — o perfil `passivo` mede o que acontece com quem clica
em quase nada, e o `arriscado` mede o teto do exploit.

**Amostra: 7 perfis × 15 seeds = 105 vidas completas**, ~1,2 s de execução.

Cada vida grava três coisas:
- **cronologia ano a ano** — pulso do ritmo, logs, ação voluntária, estado de escolaridade, cargo, salário, saldo, saúde, família;
- **razão financeiro** — todo lançamento com origem declarada (`fechamento anual`, `compra X`, `atividade Y`, `herança`, `consequência de evento Z`);
- **violações** — 10 checagens automáticas de coerência humana.

### 2.3. Checagens automáticas de coerência

Cada uma responde a uma pergunta que **um jogador faria**, não a uma invariante de código:

| Código | Pergunta humana |
| --- | --- |
| `FORMACAO_RAPIDA_DEMAIS` | "Esse curso não era de dois anos?" |
| `SALARIO_ALTO_IDADE_BAIXA` | "Como eu ganho isso aos 19?" |
| `CARGO_SEM_ESCOLARIDADE` | "Eu virei médico sem faculdade?" |
| `DINHEIRO_SEM_ORIGEM` | "De onde veio esse dinheiro?" |
| `MENOR_COM_PATRIMONIO_ALTO` | "Uma criança com R$ 100 mil?" |
| `NAMORO_INSTANTANEO` | "Eu nem conheci essa pessoa." |
| `MULTIPLOS_FILHOS_MESMO_ANO` | "Três filhos em doze meses?" |
| `FILHO_IDADE_IMPOSSIVEL` | "Meu filho é mais velho que eu." |
| `SEM_APOSENTADORIA` | "Eu ainda trabalho aos 78?" |
| `TRABALHO_COM_SAUDE_CRITICA` | "Estou morrendo e fui trabalhar." |
| `VESTIBULAR_MULTIPLAS_TENTATIVAS_MESMO_ANO` | "Prestei o ENEM quatro vezes em um ano." |
| `CANDIDATURA_ILIMITADA_MESMO_ANO` | "Me candidatei até dar certo." |
| `COMPRA_DE_LUXO_COM_DIVIDA` | "Comprei uma moto devendo R$ 250 mil." |
| `ATIVIDADE_INCOMPATIVEL_COM_SAUDE` | "Fui pra academia com 18 de saúde." |

### 2.4. Reproduções mínimas

`scripts/audit/reproducoes.ts` isola cada caso suspeito num cenário de 5 linhas, sem simulação
completa, para provar a causa e não só o sintoma. Dez reproduções: R1 duração de cursos, R2 emprego
sem o curso, R3 mestre de obras aos 18, R4 experiência nunca verificada, R5 economia do menor,
R6 irmãos em série, R7 auditoria semântica do catálogo, R8 pós sem pré-requisito, R9 vestibular
ilimitado, R10 níveis de escolaridade órfãos.

### 2.5. Marcos e transições

`scripts/audit/marcos.ts` mede taxa de ocorrência de marcos de desenvolvimento, buracos na Linha da
Vida, idade de cada transição de vida e a ordem causal namoro→casamento→filho.

### 2.6. Exploits de save

`scripts/audit/exploits.ts` roda com um `localStorage` **em memória**. Nenhum dado real do usuário
foi tocado, lido ou sobrescrito, conforme exigido.

### 2.7. Baseline e verificações

- `npm test` → **44 arquivos, 716 testes, todos verdes**.
- `npm run typecheck` (`tsc --noEmit`) → **sem erros**.
- `npm run build` → **sucesso em 2,95 s** (com o aviso pré-existente de chunk > 500 kB).
- `npx playwright install chromium` → **falhou** (`ECONNRESET` no CDN da Playwright neste sandbox).
  A auditoria visual em 320px real **não pôde ser executada**; a seção 16 é baseada em leitura de CSS.

### 2.8. Limites conhecidos desta auditoria

Honestidade metodológica, para que ninguém superinterprete os números:

- O jogador simulado **não é um jogador humano**: ele age por probabilidade fixa por domínio, não
  por leitura de tela. Métricas de *agência oferecida* são confiáveis; métricas de *intenção* não.
- Alguns marcadores textuais do `marcos.ts` não casaram com o texto real do motor (o log de
  contratação e o de nascimento de filho usam outra redação), então as linhas "1º emprego: NUNCA
  ACONTECE" e "1º filho: NUNCA ACONTECE" daquele relatório são **falha do matcher, não do jogo** —
  os dados corretos estão no `resumo.md` (primeiro emprego: mediana 17 anos; filhos: 99/105 vidas).
  Onde isso ocorre, este relatório usa a fonte correta.
- Playwright indisponível ⇒ seção 16 é análise estática.
- Nenhum teste de usabilidade com humanos foi conduzido; "o que um jogador percebe" aqui é
  inferido de regras e de números, e cruzado com o playtest humano já relatado.

---

## 3. Estado atual do jogo

### 3.1. Números

| Métrica | Valor |
| --- | --- |
| Linhas em `src/` | 30.713 |
| Linhas de teste | 8.997 (29%) |
| Testes | 716 em 44 arquivos, 100% verdes |
| Sistemas | 15 (`src/systems/`, 4.645 linhas) + 9 submódulos (`events/`, `pacing/`) |
| Eventos no catálogo | **134** (73 acontecimentos / 61 decisões) em 20 módulos |
| Cursos | 17 |
| Profissões | 36 |
| Atividades | 12 |
| Bens e investimentos | 5 imóveis, 5 veículos, 5 investimentos |
| Municípios | 91, em 27 UFs |
| Build | OK, 2,95 s |
| Typecheck | OK |

### 3.2. Arquitetura, como está hoje

```
src/
├── types/index.ts          ← contratos centrais
├── systems/                ← DOMÍNIO PURO (sem React)
│   ├── agingSystem         ← orquestra a passagem do ano
│   ├── educationSystem · careerSystem · economySystem
│   ├── familySystem · relationshipSystem · deathSystem
│   ├── eventSystem · personalitySystem · activitySystem
│   ├── availabilitySystem  ← política única de disponibilidade de ação
│   ├── attributeSystem · interactionCapabilitySystem · saveSystem
│   ├── pacing/lifeRhythm   ← o que este ano merece
│   └── events/             ← eligibility, selection, contextWeighting,
│                              history, repetitionPolicy, happenings,
│                              nature, narrativeVariants, optionRequirements
├── data/                   ← catálogos (eventos, cursos, carreiras, locais, avatar)
├── presentation/           ← avatar renderer, timeline, desfechos (puro, testável)
├── hooks/useGame.ts        ← 980 linhas: TODA a orquestração de comandos
└── components/             ← React
```

**O que está estruturalmente certo e deve ser defendido:**

- `systems/` não importa React em lugar nenhum. Testável, simulável, portável.
- `availabilitySystem` é uma **política única**: a UI não inventa regra própria, ela consulta.
  Isso é raro e é o que tornou esta auditoria possível.
- `presentation/` separa "o que é" de "como se mostra". O renderer do avatar é puro e testável.
- A fonte de aleatoriedade é **injetável** (`definirFonteAleatoria`). Sem isso, as 105 vidas
  determinísticas deste relatório não existiriam.
- Documentação interna de altíssima qualidade: vários módulos explicam *por que* a regra é aquela,
  com a medição que motivou a mudança. `economySystem.ts:120-140` e `pacing/lifeRhythm.ts:1-47`
  são exemplares.

**O que está estruturalmente errado:**

- **Não existe uma camada de validação de plausibilidade.** `availabilitySystem` valida
  *disponibilidade* (idade mínima, saldo, repetição anual) mas não *plausibilidade*
  (experiência, formação compatível, licença, tempo decorrido).
- **`useGame.ts` acumula 980 linhas de orquestração de comandos** — é o ponto onde cada ação
  escreve em 4 ou 5 estados independentes, e é onde a inconsistência entre sistemas nasce.
- **Não existe um calendário de vida.** Nada no motor sabe que "primeira palavra" *tem que
  acontecer*, que gestação *dura nove meses* ou que "ano letivo" tem começo e fim.
- **Não existe um livro-razão.** `economia.dinheiro` é um número que sobe e desce; nenhum registro
  diz de onde veio — é a razão literal do "R$ 166.910 sem origem".

---

## 4. Problemas críticos

Classificação: **gravidade** (CRÍTICO / ALTO / MÉDIO / BAIXO) × **natureza** (BUG / REGRA /
BALANCEAMENTO / UX / NARRATIVA / ARQUITETURA / CONTEÚDO / COERÊNCIA ENTRE SISTEMAS).

---

### C-01 · Experiência profissional declarada e nunca verificada
**CRÍTICO · REGRA + COERÊNCIA ENTRE SISTEMAS**

`Job.experienciaNecessaria` existe em `types/index.ts:195` e está preenchido em **22 das 36
profissões**. `grep` em todo `src/` fora de testes: o campo é lido em **zero** lugares no motor.

`careerSystem.candidatarEmprego` (linhas 19-70) confere: janela de idade, escolaridade mínima, e
depois rola `60% + bônus`. Nada mais.

**Reprodução (R3, determinística):** 18 anos · técnico em TI · 0 anos de experiência →
candidatura a *Mestre de Obras e Empreiteiro* (exige `fundamental_completo` e **4 anos de
experiência**, R$ 7.500/mês) → **CONTRATADO**.

**Medido em 105 vidas:** 23 ocorrências de `SALARIO_ALTO_IDADE_BAIXA` em 14 vidas, idade média
19,6 — todas do mesmo padrão: *Técnico Judiciário Concursado*, R$ 7.500/mês, aos 19 anos, com 1 ano
de carreira.

**Salários alcançáveis hoje sem um único dia de experiência:** R$ 35.000 (Cirurgião),
R$ 33.000 (Auditor Fiscal), R$ 28.000 (COO), R$ 24.000 (Tech Lead), R$ 21.000 (Gerente de Obras).

**Causa:** falta a checagem. O dado está pronto.

---

### C-02 · A formação não conversa com a profissão
**CRÍTICO · REGRA + COERÊNCIA ENTRE SISTEMAS**

Não existe nenhum vínculo entre `CourseOption` e `Job`. A contratação olha apenas o **nível**
(`superior_completo`), nunca **qual** curso.

**Reprodução (R2):** personagem formada **exclusivamente em Pedagogia**, 22 anos, 0 experiência.
`listarVagasCompativeis` devolve **34 vagas**, entre elas:

```
· Auditor Fiscal / Juiz Substituto — R$ 33.000/mês
· Diretor de Operações (COO)       — R$ 28.000/mês
· Médico(a) Clínico Geral          — R$ 19.500/mês   ← contratada com sucesso
· Sócio(a) de Escritório de Advocacia — R$ 16.000/mês
· Engenheiro(a) Civil Pleno        — R$ 11.000/mês
```

`candidatarEmprego(medico_geral, …)` → **"Parabéns! Você foi contratado(a) como Médico(a) Clínico
Geral"**, com diploma de Pedagogia.

**Agravante (R8):** a pós-graduação também ignora a graduação. Uma pedagoga se matricula em
**Residência Médica / Especialização** — o sistema aceita e cobra a mensalidade.

**Nenhuma licença profissional existe:** sem OAB para advogar, sem CRM para clinicar, sem CREA para
assinar obra, sem concurso público para cargo concursado. *Técnico Judiciário Concursado* é uma vaga
de catálogo como outra qualquer — nem prova, nem inscrição, nem espera.

---

### C-03 · Cursos concluídos em um ano (off-by-one estrutural)
**CRÍTICO · BUG**

`educationSystem.ts:102-113`:

```ts
edu.semestreAtual = (edu.semestreAtual || 0) + 2;   // avança 2 semestres/ano
if (edu.semestreAtual >= (edu.totalSemestres || 8)) { /* formatura */ }
```

`ingressarCurso` grava `semestreAtual: 1`. No primeiro ano ele vira 3 — e `3 >= 3` é verdadeiro.
**Curso de 3 semestres forma em 1 ano.**

**Medição R1, todos os 17 cursos** (determinística, mín = mediana = máx):

| Curso | Semestres | Esperado | **Medido** |
| --- | --- | --- | --- |
| Técnico em Desenvolvimento de Sistemas | 3 | 1,5 anos | **1 ano** ⚠️ |
| Técnico em Administração | 3 | 1,5 anos | **1 ano** ⚠️ |
| MBA Executivo em Liderança e Gestão | 3 | 1,5 anos | **1 ano** ⚠️ |
| Técnico em Eletrotécnica / Enfermagem | 4 | 2 anos | 2 anos |
| Engenharia de Software / Design / Pedagogia / Administração / Economia / Ed. Física | 8 | 4 anos | 4 anos |
| Direito / Eng. Civil / Enfermagem / Psicologia | 10 | 5 anos | 5 anos |
| Medicina | 12 | 6 anos | 6 anos |

O caso exato relatado pelo playtest — *Técnico em Desenvolvimento de Sistemas* em ~1 ano — está
reproduzido. Nos cursos de duração par o erro se cancela, o que explica por que nunca foi notado.

**Duas causas compostas:** (a) o `>=` com início em 1 em vez de 0; (b) cursos de duração ímpar no
catálogo, que o modelo "2 semestres por ano" não representa.

---

### C-04 · Vestibular infinito no mesmo ano
**CRÍTICO · REGRA**

`ingressarCurso` recalcula a nota do ENEM a cada chamada:

```ts
const notaEnem = ...inteligencia... + randomInt(-20, 20);
```

O resultado **não é persistido em lugar nenhum** e `ingressar_curso` **não registra em
`acoesRealizadasAno`** (ao contrário de `pedir_aumento`, `loteria_mega_sena`, `atividade:*` e
`familia:*:*`, que registram). `availabilitySystem` bloqueia apenas `emCurso`.

**Consequência:** o jogador clica "prestar vestibular" até passar. O ENEM vira um botão de re-roll.

**Medido:** 21 aprovações confirmadas na **tentativa 2 do mesmo ano** (19 vidas), incluindo
Medicina, Direito e Psicologia — e isso com um agente que tenta no máximo 2 vezes. Um humano
clicando 50 vezes passa em qualquer coisa.

**Reprodução R9:** inteligência 72 (abaixo do mínimo 75 de Medicina), corte 810 — 200 tentativas
no mesmo ano de jogo, todas permitidas, notas oscilando entre 641 e 677. Não passou por azar
de faixa, não por regra.

**O mesmo vale para emprego:** `candidatar_emprego` também não registra ação anual. Medido: 9 casos
de contratação na tentativa 2 do mesmo ano, idade média 16,2.

---

### C-05 · Nenhum marco de vida é garantido
**CRÍTICO · REGRA + NARRATIVA**

O catálogo declara exatamente dois marcos de desenvolvimento:
`bb_primeira_palavra` e `inf_primeiros_passos`, ambos com `repeticao: { tipo: 'marco' }`.

Mas `repetitionPolicy.ts:79` trata `'marco'` **exatamente como `'unica'`** — ou seja, `marco`
governa *quantas vezes pode repetir*, **não se acontece**. A ocorrência continua sendo um sorteio
ponderado dentro da janela etária, disputando espaço com outros eventos, **e só depois de o
`lifeRhythm` decidir que o ano não é silencioso**.

**Medido em 105 vidas:**

| Marco | Janela | Ocorreu em |
| --- | --- | --- |
| A Primeira Palavra | 0–2 anos | **18/105 vidas (17%)** |
| Primeiros Passos | 1–2 anos | **14/105 vidas (13%)** |

**83% dos jogadores nunca verão a primeira palavra do seu personagem.** Não porque escolheram
outra coisa — porque o dado não caiu.

Um marco de desenvolvimento não é conteúdo opcional: é o que dá à infância a sensação de
*progressão biográfica*. Perdê-lo por RNG é perder a parte da vida que o jogador mais quer ver.

---

### C-06 · A vida adulta é 75% silêncio, e a agência está invertida
**CRÍTICO · BALANCEAMENTO + ARQUITETURA**

Medido, 105 vidas, todos os anos vividos:

| Década | anos-vida | % decisão | % acontecimento | **% silêncio** |
| --- | --- | --- | --- | --- |
| 0–9 | 945 | 7,1% | **39,8%** | 53,1% |
| 10–19 | 1.050 | 17,2% | 21,8% | 61,0% |
| 20–29 | 1.050 | 11,9% | 13,0% | **75,1%** |
| 30–39 | 1.050 | 10,7% | 13,7% | **75,6%** |
| 40–49 | 1.042 | 10,2% | 13,1% | **76,7%** |
| 50–59 | 1.015 | 10,8% | 14,0% | **75,2%** |
| 60–69 | 785 | 11,3% | 15,9% | 72,7% |
| 70–79 | 367 | 10,1% | 15,8% | 74,1% |
| 80–89 | 51 | 3,9% | 9,8% | **86,3%** |

**A infância é a fase mais densa do jogo.** Um bebê de 0 a 9 anos vive quase 40% dos anos com
algo acontecendo; um adulto de 40 a 49 — a década de casamento, filhos, promoção, crise, divórcio,
mudança, doença dos pais — vive 76,7% dos anos em branco.

**Causa 1 — o pulso é decidido antes de saber se há conteúdo.** `pacing/lifeRhythm` recebe
`densidadeEstrutural` e decide silêncio/acontecimento/decisão *antes* de qualquer consulta ao
catálogo. Com `densidadeEstrutural >= 2` o ano é **silêncio absoluto**; com `== 1`, a chance é
multiplicada por 0,55. O paradoxo: **o ano em que a vida está mais cheia é o ano em que o jogo
mais se cala.**

**Causa 2 — tetos duros por janela.** `fatiaDeDecisao` nunca passa de 0,50, e há teto de decisões
por janela móvel (bebê 0; primeira infância 1 em 5 anos; infância 2 em 4; adolescência 2 em 4;
juventude 2 em 3; adulto 3 em 4), mais um multiplicador de 0,40 se houve decisão no ano anterior.

**Causa 3 — o catálogo mingua na vida adulta em relação ao tempo disponível.** 56 eventos elegíveis
aos 40 anos para cobrir 40 anos de vida adulta, contra 23 aos 10 anos para cobrir uma infância de
12 anos. Densidade de conteúdo por ano vivido: **~2,0 eventos/ano na infância contra ~1,4 na vida
adulta** — e a vida adulta é três vezes mais longa.

A auditoria anterior (`docs/AUDITORIA-SESSAO-AUTONOMA.md`) diagnosticou "pergunta demais, acontece
de menos". A correção do `lifeRhythm` resolveu o "pergunta demais" e **criou** um "acontece de
menos" ainda maior. A medição confirma o relato humano de chegar aos 18 sem nenhuma decisão:
**4 de 105 vidas (3,8%)** chegam aos 18 com zero decisões; a mediana é apenas **2 decisões em
18 anos**.

---

### C-07 · Múltiplos filhos no mesmo ano, sem gestação
**CRÍTICO · REGRA**

`relationshipSystem.terFilho` cria o filho **instantaneamente**: sem gestação, sem risco, sem custo
de parto, sem intervalo, com `relacionamento: 100` de saída. Nada limita quantas vezes por ano.

**Medido:** `MULTIPLOS_FILHOS_MESMO_ANO` — **1.248 ocorrências em 99 de 105 vidas**, idade média
44,1. Até **3 filhos no mesmo ano**, repetidamente, na mesma vida.

Exemplo verbatim (seed 8919, perfil estudioso): filhos nascem aos 28 (×3), 32 (×2), 33 (×3),
35 (×2), 37 (×3), 40 (×3), 46 (×2), 56 (×2).

**O mesmo vale para os irmãos** (R6): `familySystem.processarEnvelhecimentoFamilia` rola uma chance
de nascimento de irmão por ano, sem nenhuma checagem. Forçando o roll, **nasce um irmão por ano,
sete anos seguidos**, sem gestação, sem intervalo, sem verificar se o pai existe, sem limite.

---

### C-08 · Namoro instantâneo em nível 85
**CRÍTICO · REGRA + NARRATIVA**

`iniciarNamoro` sorteia um parceiro pronto e o adiciona à família **já com `relacionamento: 85`** e
`+25 de felicidade`, num único clique. `pedirEmCasamento` aceita com `relacionamento >= 65` — ou
seja, **o parceiro nasce acima do limiar de casamento**.

**Medido:** `NAMORO_INSTANTANEO` — 162 ocorrências em **102 de 105 vidas**.

Sequência possível e frequente: **conhecer → namorar → casar → ter filho, tudo no mesmo ano de
jogo.** É exatamente o relato humano de "aos 18 anos apareceu namorada + filha recém-nascida".

Não existe: paquera, aproximação, conhecer alguém por contexto (trabalho, faculdade, bairro),
término por desgaste, reconciliação, tempo mínimo de relação.

---

### C-09 · Nenhuma aposentadoria
**CRÍTICO · REGRA**

`CareerState.aposentado` e `rendaAposentadoria` existem em `types/index.ts:209-210`.
`careerSystem.ts:14` inicializa `aposentado: false`. `careerSystem.ts:266` **lê** o campo.
**Nada em todo o código-fonte jamais escreve `aposentado = true`.**

Existe um evento (`sen_aposentadoria_inss`, 60–72 anos) que grava a flag `'aposentado_inss'` —
e essa flag **não é lida por nenhum sistema**. É decoração narrativa.

**Medido:** `SEM_APOSENTADORIA` — 418 ocorrências em **60 de 105 vidas**, idade média 74,5.
Exemplo: *Diretor de Operações (COO)* trabalhando **aos 78 anos** com **12 de saúde**.

Consequência em cadeia: a renda nunca para, o que alimenta diretamente a hiperinflação patrimonial
(C-10). Um jogo sobre a vida inteira **não tem terceira idade como fase** — tem "vida adulta que
continua até morrer".

---

### C-10 · Hiperinflação patrimonial e dinheiro sem origem
**CRÍTICO · BALANCEAMENTO + UX**

Medido:

| Idade | mín | mediana | máx |
| --- | --- | --- | --- |
| 20 anos | −600 | 12.117 | **182.048** |
| 30 anos | −1.400 | 0 *(teto de dívida)* | 2.409.797 |
| 60 anos | — | **7.953.442** | — |

O máximo aos 20 anos (**R$ 182.048**) reproduz o relato humano de R$ 166.910 aos 20.
E a mediana aos 60 — quase **R$ 8 milhões** — mostra que, passada a faixa dos 30, o jogo perde
completamente a tensão econômica.

**Causa A — o menor de idade não tem despesa alguma.** `economySystem.ts:69-72`:

```ts
if (idade < 18) {
  eco.dinheiro += salarioAnual;   // 100% creditado
  return { economiaAtualizada: eco, logsEconomia: logs };   // ZERO despesa
}
```

Reprodução R5, 16 → 21 anos:

```
16 anos · R$ 950/mês  · despesas: NENHUMA     · saldo R$ 13.350
17 anos · R$ 950/mês  · despesas: NENHUMA     · saldo R$ 25.700
18 anos · R$ 7.500/mês · despesas: R$ 14.000  · saldo R$ 109.200
19 anos                                        · saldo R$ 192.700
20 anos                                        · saldo R$ 276.200
```

**Causa B — salário = mensal × 13, bruto.** Sem INSS, sem imposto de renda, sem FGTS. Um salário
de R$ 7.500/mês no Brasil real rende ~R$ 5.900 líquidos; aqui rende R$ 7.500 × 13.

**Causa C — a despesa é um degrau em 18, não uma transição de vida.** Antes dos 18: R$ 0.
Aos 18 em ponto: R$ 14.000/ano fixos, como se a pessoa tivesse se mudado sozinha no aniversário.
Não existe morar com os pais aos 22, nem sair de casa aos 19, nem mesada, nem contribuir em casa.

**Causa D — não há livro-razão.** `economia.dinheiro` é um número. Nada registra procedência.
A tela de finanças mostra o saldo; o jogador não tem como reconstruir de onde veio. A "razão
financeiro" que este relatório usa **tive que construir do lado de fora**, no harness — ela não
existe no jogo.

---

### C-11 · Promoção automática ignora escolaridade e cria escadas impossíveis
**ALTO · REGRA + COERÊNCIA ENTRE SISTEMAS**

`careerSystem.ts:302`: se `desempenho >= 80` e `anosNoCargo >= 2`, há 40% de chance por ano de subir
para `progressaoPara`. **Nenhuma checagem de escolaridade, experiência ou formação.**

Cadeias reais no catálogo — todas percorríveis sem um único diploma:

```
Jovem Aprendiz [fund.] R$950
  → Auxiliar Administrativo [médio] R$2.400
  → Analista Jr [SUPERIOR] R$4.200
  → Analista Pleno [SUPERIOR] R$6.800
  → Gerente Corporativo [SUPERIOR] R$13.500
  → Diretor de Operações (COO) [SUPERIOR] R$28.000

Atendente de Comércio [fund.] R$1.650
  → Vendedor [médio] → Gerente de Loja [médio] R$5.200
  → Diretor de Operações (COO) [SUPERIOR] R$28.000     ← gerente de loja vira C-level

Ajudante Geral [fund.] R$1.700
  → Eletricista [TÉCNICO] R$3.600
  → Mestre de Obras [fund.] R$7.500

Técnico Judiciário [médio] R$7.500
  → Analista da Receita [SUPERIOR] R$16.500
  → Auditor Fiscal / Juiz Substituto [SUPERIOR] R$33.000   ← vira juiz por mérito interno

Médico Clínico [superior] → Cirurgião Especialista [PÓS] R$35.000   ← sem residência
```

Medido: **66 saltos salariais acima de 2× em um único ano**. Exemplos: R$ 950 → R$ 2.400 aos 18–26;
R$ 13.500 → R$ 28.000 aos 51.

Agravante: `pedirAumento` concede **+18% composto** sobre o salário sempre que `desempenho >= 75`
**ou** `anosNoCargo >= 2` (note o **ou**, não **e**), sem teto e uma vez por ano. Dez anos de
aumentos multiplicam o salário por **5,2**.

---

### C-12 · O jogo não reage à saúde crítica
**ALTO · REGRA**

Medido: `TRABALHO_COM_SAUDE_CRITICA` — 366 ocorrências em **90 de 105 vidas**.
Caso verbatim (seed 8919): *Gerente Corporativo* trabalhando com **saúde 0**, no ano em que morre.

E `ATIVIDADE_INCOMPATIVEL_COM_SAUDE` — 21 ocorrências: "Sair para um Barzinho / Balada" com
saúde 5 aos 79 anos; "Viagem Internacional dos Sonhos" com saúde 8 aos 56; "Treinar na Academia"
com saúde 18 aos 60.

Saúde é hoje um **contador que leva à morte**, não um **estado que limita a vida**. Não há doença
crônica, não há afastamento, não há internação, não há licença médica, não há incapacidade.

---

### C-13 · NPCs sem nome
**ALTO · NARRATIVA + BUG**

`eventSystem.adicionarFamiliar` usa defaults quando o evento não declara:
`nome: 'Novo Familiar'`, `genero: 'masculino'`, `tipo: 'pet'`, `idade: 1`, `relacionamento: 80`.

Dos 12 usos de `adicionarFamiliar` no catálogo, **apenas 5 declaram nome**. Nenhum chama
`sortearNome`, que existe em `brazilianData.ts`.

**Medido: 2.281 ocorrências de `NPC_SEM_NOME` em 43 de 105 vidas.**

O jogador vê, na tela de família, uma lista de pessoas chamadas **"Novo Familiar"** — e um evento
ainda pior por trás: um default `tipo: 'pet'` significa que um amigo mal declarado vira um
bichinho de estimação.

Casos verbatim onde o texto do evento é declaradamente genérico:
`adicionarFamiliar: { tipo: 'amigo', nome: 'Seu vizinho', relacionamento: 58, idade: 44 }`.

---

### C-14 · Acontecimentos narrados como escolhas do jogador
**ALTO · NARRATIVA**

`events/happenings.ts` faz a coisa certa em mecânica: para um acontecimento, sorteia um desfecho
entre as `opcoes` e remove `impactosComportamentais` (o jogador não ganha traço por algo que não
escolheu). **Mas o texto continua sendo o texto de uma opção de escolha.**

Medido (R7): **22 dos 73 acontecimentos** têm opções escritas com verbos de decisão.

Exemplos verbatim, que o jogador lê como se ele tivesse decidido:

| Evento | "Desfecho" exibido |
| --- | --- |
| `inf_primeiros_passos` | "**Preferir** continuar engatinhando no seu ritmo" |
| `fam_visita_avo` | "Comer dois pedaços de bolo e ouvir com carinho as histórias" |
| `ext_macarronada_domingo` | "Comer rápido e **pedir** para sair mais cedo" |
| `sen_viagem_excursao` | "**Preferir** ficar em casa cuidando da horta" |
| `car_fofoca_copa` | "**Entrar** na fofoca e **soltar** um segredo que você sabia" |
| `ado_trote_festa` | "**Preferir** não gastar com a festa e guardar o dinheiro" |

É a origem literal do relato "comeu um pedaço de bolo bem tranquilo": o jogo sorteou, mas o texto
está no infinitivo de comando. **Um acontecimento tem que ser narrado no pretérito, na voz do
mundo, não no infinitivo, na voz do menu.**

Agravante medido: **43 dos 73 acontecimentos** têm 2+ desfechos e **nenhum peso declarado** — ou
seja, "dar um golaço" e "ficar sem jogar" são equiprováveis, independentemente de qualquer atributo
do personagem.

---

### C-15 · Save em texto puro, sem qualquer validação de plausibilidade
**ALTO · ARQUITETURA + REGRA**

Testado em `localStorage` **em memória** (nenhum dado real tocado):

| Adulteração | Resultado |
| --- | --- |
| `dinheiro := 999.999.999` | **aceito sem crítica** |
| `dividas := −500.000` (dívida negativa) | **aceito sem crítica** |
| `idade := 7` (rejuvenescer) | **aceito sem crítica** |
| `inteligencia := 100` | **aceito sem crítica** |
| `nivelAtual := 'pos_graduacao'` sem estudar | **aceito sem crítica** |
| `anoAtual := 1500` | **aceito sem crítica** |
| `salarioAtual := 5.000.000` | **aceito sem crítica** |

`migrarEstadoSalvo` é **defensivo contra corrupção** (`numero()`, `lista()`, `comoObjeto()`) e faz
isso bem — mas defesa contra *dado malformado* não é defesa contra *dado implausível*. Nenhum
`clamp` de domínio, nenhuma coerência cruzada (idade × escolaridade, salário × cargo).

**Save-scumming:** o auto-save dispara em **toda** mudança de estado (`useGame.ts:190-211`), e
"Continuar" restaura exatamente o instante anterior. O jogador pode avançar o ano, ver a demissão /
a reprovação / a morte, recarregar a página e refazer — o RNG é reamostrado do zero. **Nada no save
registra "este ano já foi rolado"**, e não há seed persistida. Todo risco do jogo é opcional para
quem sabe recarregar.

**Slot único:** `SAVE_KEY = 'VIDA_GAME_SAVE_V1'` é uma constante. Uma partida por navegador;
começar uma vida nova sobrescreve a anterior.

---

## 5. Educação

**Veredito: REFINAR.** A estrutura está certa (estado único, progressão automática pela educação
básica, cursos como catálogo tipado). As regras internas estão erradas.

### 5.1. O que funciona

- Progressão automática pela educação básica é determinística e correta: **100% das 105 vidas**
  entram no Fundamental aos 6, concluem aos 14, formam no Médio aos 17. Nenhum desvio.
- `EducationState` é fonte de verdade única; `saveSystem` descarta a flag legada `escolaridade`.
- Distinção pública × privada com nota de corte do ENEM e mensalidade real.
- `posturaAno` (estudar / normal / matar aula) é uma escolha de baixo custo e efeito claro.

### 5.2. O que está errado

**E-01 · Off-by-one na formatura — CRÍTICO · BUG.** Ver C-03.

**E-02 · Vestibular ilimitado no mesmo ano — CRÍTICO · REGRA.** Ver C-04.

**E-03 · Zero abandono, zero repetência — ALTO · REGRA.**
Nível final em 105 vidas: `superior_completo` 84 · `pos_graduacao` 14 · `tecnico` 6 ·
`medio_completo` 1. **Nenhuma evasão, nenhuma reprovação, nenhum trancamento.** No Brasil real,
a taxa de conclusão do ensino superior gira em torno de 40-50% dos ingressantes. Aqui é 100%.

`educacao.desempenho` é recalculado todo ano (`educationSystem.ts:58`) e **só é exibido na tela**
(`EducationSection.tsx:93`). Nunca causa reprovação, nunca afeta a formatura, nunca afeta a
contratação.

**E-04 · Níveis de escolaridade órfãos — MÉDIO · BUG (R10).**
A escala tem 9 níveis. O motor só atribui 6. Nunca existem:
`fundamental_incompleto`, `medio_incompleto`, `superior_incompleto`.

Consequência direta: uma criança de 7 anos matriculada no Fundamental tem `nivelAtual: 'nenhuma'`,
e um universitário no 6º semestre tem `nivelAtual: 'medio_completo'`. E **2 vagas ficam
inalcançáveis por via natural**: *Estagiário Universitário* e *Desenvolvedor Júnior*, ambas
exigindo `superior_incompleto` — o estágio, que no Brasil real é a porta de entrada do universitário,
**é inacessível a universitários**.

**E-05 · Técnico inacessível na idade em que se faz técnico — MÉDIO · REGRA.**
Curso técnico exige `medio_completo` + 18 anos. No Brasil real, o técnico é feito **durante** o
ensino médio (integrado ou concomitante), dos 15 aos 17. A janela em que o curso técnico faz
sentido é justamente a que o jogo bloqueia.

**E-06 · Pós-graduação sem pré-requisito de área — ALTO · REGRA (R8).**
*Residência Médica* aceita uma pedagoga. Ver C-02.

**E-07 · Sem financiamento nem contexto brasileiro — MÉDIO · CONTEÚDO.**
Não existem ProUni, FIES, SISU, cotas, EAD, bolsa de mérito, curso noturno, transporte escolar,
supletivo/EJA. A decisão "pública gratuita × privada paga" é binária e sem contexto social.

---

## 6. Carreira

**Veredito: REFAZER as regras, MANTER o catálogo e a estrutura.**
O catálogo de 36 profissões tem títulos verossímeis, faixas salariais defensáveis para o Brasil e
cadeias de progressão bem pensadas. O que está quebrado é **tudo que decide quem entra e quem sobe**.

### 6.1. O que funciona

- 36 profissões com `escolaridadeMinima`, `inteligenciaMinima`, `estresseNivel`, `progressaoPara`.
- `obterJanelaIdadeEmprego` é uma regra real e bem aplicada (Jovem Aprendiz 14–24, por exemplo).
- Bicos (`BICOS_DISPONIVEIS`) com requisito de veículo ou escolaridade — o requisito de veículo é,
  aliás, **a única checagem de pré-requisito material do jogo inteiro**, e é excelente.
- Horas extras como compromisso anual único, com custo em estresse. Boa mecânica.

### 6.2. O que está errado

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| K-01 | `experienciaNecessaria` nunca verificada (22/36 vagas) | CRÍTICO · REGRA |
| K-02 | Contratação ignora **qual** curso foi feito | CRÍTICO · REGRA |
| K-03 | Nenhuma licença profissional (OAB/CRM/CREA/concurso) | CRÍTICO · REGRA |
| K-04 | Candidaturas ilimitadas no mesmo ano (60% base) | ALTO · REGRA |
| K-05 | Promoção automática ignora escolaridade | ALTO · REGRA |
| K-06 | `pedirAumento` +18% composto, sem teto, condição `OU` | ALTO · BALANCEAMENTO |
| K-07 | Nenhuma aposentadoria (`aposentado` nunca vira `true`) | CRÍTICO · REGRA |
| K-08 | `listarVagasCompativeis` tolera `inteligenciaMinima <= inteligencia + 15` | MÉDIO · REGRA |
| K-09 | Sem desemprego como estado (só "não empregado") | MÉDIO · REGRA |
| K-10 | Sem carteira assinada × informal × MEI × servidor | MÉDIO · CONTEÚDO |
| K-11 | Sem trabalho não remunerado (cuidado, doméstico, voluntário) | BAIXO · CONTEÚDO |

**Sobre K-09:** hoje `empregado: false` significa três coisas diferentes — criança, universitário e
desempregado — e o jogo não distingue. Não há seguro-desemprego, não há busca ativa, não há
"desempregado há 3 anos" como situação com consequência.

**Idade do primeiro emprego medida:** mín 17 · mediana 17 · máx 37. A mediana está deslocada para
cima porque o Jovem Aprendiz (14+) raramente é escolhido pelo agente — mas o teto de 37 mostra que
é perfeitamente possível chegar aos 37 sem nunca ter trabalhado, sem nenhuma consequência.

---

## 7. Economia

**Veredito: REFINAR o modelo, ACRESCENTAR o livro-razão.**
A camada de estabilização (padrão de vida cede antes de virar dívida, teto de crédito de
R$ 250.000, juros de 6% a.a.) é uma **boa peça de design** e está documentada com a medição que a
motivou. O problema é tudo que vem antes dela.

### 7.1. O que funciona

- `aplicarFaltaDeDinheiro`: o padrão de vida cai (luxuoso → confortável → modesto) antes de gerar
  dívida. Estabilizador real, não cosmético.
- Teto de crédito: impede a espiral infinita de dívida medida na auditoria anterior.
- Imóveis valorizam (2–6% a.a.), veículos depreciam (5–10% a.a.). Correto e perceptível.
- Despesa por filho (R$ 7.000/ano até os 18) e desconto de 40% na despesa base com imóvel quitado.
- Investimentos com faixas de rendimento por tipo.

### 7.2. O que está errado

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| F-01 | Menor de idade: 100% do salário, zero despesa, `return` antecipado | CRÍTICO · REGRA |
| F-02 | Sem livro-razão: nenhuma origem registrada para o dinheiro | CRÍTICO · ARQUITETURA + UX |
| F-03 | Salário bruto × 13, sem INSS/IRRF/FGTS | ALTO · REGRA |
| F-04 | Despesa vira degrau de R$ 0 → R$ 14.000 no aniversário de 18 | ALTO · REGRA |
| F-05 | Não modela morar com os pais / sair de casa | ALTO · REGRA |
| F-06 | Hiperinflação: mediana R$ 7,9 mi aos 60 | ALTO · BALANCEAMENTO |
| F-07 | `custoVidaRelativo` do município nunca é aplicado | ALTO · COERÊNCIA ENTRE SISTEMAS |
| F-08 | Compra de luxo permitida com dívida no teto | MÉDIO · REGRA |
| F-09 | `classeSocial` só afeta o saldo inicial | MÉDIO · COERÊNCIA ENTRE SISTEMAS |
| F-10 | Sem inflação, sem correção monetária ao longo de 80 anos | MÉDIO · BALANCEAMENTO |
| F-11 | Mega-Sena: 0,05% de chance de R$ 15–60 mi, custo R$ 15 | BAIXO · BALANCEAMENTO |

**Sobre F-08**, medido: 22 ocorrências de `COMPRA_DE_LUXO_COM_DIVIDA` em 20 vidas —
"comprou *Bicicleta Elétrica Urbana* (R$ 4.500) tendo **R$ 250.000 de dívida**".
O `availabilitySystem` confere `economia.dinheiro < item.preco`, mas **ignora `economia.dividas`**.
Com dívida no teto, o saldo foi zerado e recomeçou a subir — então "tem dinheiro" é verdade e
"está falido" também.

**Sobre F-10:** o jogo cobre 80 anos com valores nominais congelados. Um salário de R$ 950 em 2026
e R$ 950 em 2090 são a mesma coisa para o motor. Isso é uma **decisão legítima de simplificação**,
mas precisa ser consciente: hoje ela não está documentada em lugar nenhum e ninguém sabe se é
intencional.

---

## 8. Relacionamentos e família

**Veredito: REFAZER o modelo de relação, MANTER a estrutura de `FamilyMember`.**
Este é o sistema com a maior distância entre o que o jogo mostra e o que a vida é.

### 8.1. O que funciona

- `FamilyMember` com `tipo`, `relacionamento`, `vivo`, `idade` é um modelo simples e suficiente.
- `interactionCapabilitySystem` é **excelente** e deve ser defendido: um bebê não conversa, não
  discute e não dá presente; um pet não faz nenhuma das três em nenhuma idade. Regra única,
  revalidada pelo motor, com a UI apenas consultando. É o melhor exemplo de design do repositório.
- Herança ao perder um dos pais, com valor variável e log narrativo adequado.
- Mortalidade familiar por idade.

### 8.2. O que está errado

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| R-01 | Namoro instantâneo em nível 85, sem aproximação | CRÍTICO · REGRA + NARRATIVA |
| R-02 | Múltiplos filhos no mesmo ano, sem gestação | CRÍTICO · REGRA |
| R-03 | Namoro → casamento → filho possível no mesmo ano | CRÍTICO · REGRA |
| R-04 | Irmãos nascem indefinidamente, um por ano | ALTO · REGRA |
| R-05 | NPCs chamados "Novo Familiar" (2.281 ocorrências) | ALTO · NARRATIVA + BUG |
| R-06 | `gerarFamiliaInicial` recebe `_classeSocial` e **ignora** | MÉDIO · COERÊNCIA ENTRE SISTEMAS |
| R-07 | Mortalidade familiar só começa aos 70 | MÉDIO · REGRA |
| R-08 | Nenhum romance adolescente (12–17 é `OCULTO('acao_adulta')`) | MÉDIO · CONTEÚDO |
| R-09 | Sem término, sem divórcio, sem desgaste por ausência | MÉDIO · REGRA |
| R-10 | NPCs não têm vida própria (não estudam, não trabalham, não mudam) | MÉDIO · CONTEÚDO |
| R-11 | Parceiro herda o sobrenome do personagem nos filhos, sem escolha | BAIXO · NARRATIVA |

**Sobre R-06:** a assinatura `gerarFamiliaInicial(_classeSocial)` com underscore denuncia o
problema — o parâmetro foi previsto, é passado, e o corpo da função não o usa. Uma família de
classe alta e uma de classe baixa são geradas idênticas: mesmo número de irmãos, mesmas idades,
mesmos relacionamentos, mesma probabilidade de pai presente.

**Sobre R-07:** medido, morte de um dos pais ocorre em 104/105 vidas, idade do personagem entre
32 e 51 (mediana 42). Plausível em média — mas sem nenhum caso de perda precoce, que é uma das
experiências que mais marcam uma biografia.

**Sobre R-08:** a decisão de não modelar romance adolescente está **documentada no código** e é
defensável em escopo. Mas ela deixa a adolescência — a fase em que o primeiro amor acontece —
sem a decisão mais característica dela.

---

## 9. Pacing e agência

**Veredito: REFINAR — a arquitetura está certa, a calibração está errada e a ordem de decisão está invertida.**

`pacing/lifeRhythm` é um módulo **conceitualmente correto e bem escrito**. O diagnóstico que o
motivou ("pergunta demais") estava certo, e as quatro forças (fatia de decisão por idade, densidade
estrutural, fadiga, secura) são as forças certas.

### 9.1. O erro estrutural: a ordem

```
HOJE:     lifeRhythm decide o pulso  →  depois consulta o catálogo
          (decide o silêncio sem saber o que estava disponível)

DEVIA:    consulta o que está elegível e é relevante para este ano
          →  depois decide quanto disso vira tela
```

Consequências medidas dessa inversão:

1. **Ano cheio = ano mudo.** `densidadeEstrutural >= 2` força silêncio absoluto. O ano em que
   você se formou **e** foi contratado é justamente o ano em que o jogo não deixa acontecer mais nada.
2. **Marcos se perdem** (C-05): 83% das vidas nunca veem a primeira palavra, porque o marco compete
   num sorteio que pode nem ser realizado.
3. **Rebaixamento assimétrico:** o motor rebaixa `decisao → acontecimento` quando não acha decisão
   elegível, mas **nunca promove** `acontecimento → decisao` quando só há decisão disponível. Isso
   empurra o sistema sistematicamente para baixo.

### 9.2. Agência por faixa etária (medido)

| Faixa | decisões/vida | acontecimentos/vida | anos silenciosos/vida |
| --- | --- | --- | --- |
| 0–2 | 0,00 | 1,29 | 0,71 |
| 3–5 | 0,20 | 1,14 | 1,66 |
| 6–11 | 0,73 | 1,60 | 3,67 |
| 12–17 | 1,10 | 1,40 | 3,50 |
| 18–29 | 1,52 | 1,63 | **8,85** |
| 30–59 | 3,12 | 4,03 | **22,44** |
| 60+ | 1,38 | 2,02 | 9,55 |

Dos 30 aos 59 — 30 anos de vida — o jogador toma em média **3,1 decisões** e vê **22,4 anos
completamente vazios**. Decisões até os 18: mín 0 · **mediana 2** · máx 4;
**4/105 vidas (3,8%) chegam aos 18 sem nenhuma decisão.**

### 9.3. Autonomia por idade: o modelo está certo, a aplicação não

O princípio de `fatiaDeDecisao` (um bebê não decide; um adulto decide mais, mas nunca sempre) está
correto. O que falta é a **outra metade** do conceito de autonomia: hoje o jogo modela *quanto* o
personagem decide, mas não *o que ele pode decidir*.

Falta a noção de **quem decide por você**: aos 5 anos, os pais decidem a escola; aos 12, você opina;
aos 16, você escolhe com veto; aos 18, você decide. Nenhuma decisão do jogo é hoje uma decisão
*negociada* com um adulto responsável — todas são do personagem, em qualquer idade.

---

## 10. Linha da Vida

**Veredito: REFINAR.** `timelinePresentation` é bom: agrupa por ano, separa título de resumo,
deriva ênfase visual dos dados reais e não inventa conteúdo.

### 10.1. O problema: anos que somem

Medido — buracos (anos consecutivos sem nenhuma entrada):

```
841 buracos observados · mediana 1 ano · p90 2 anos · máximo 5 anos seguidos
maior buraco por vida: mediana 2 · p90 3 · máximo 5
```

Primeiros 20 anos de vidas reais, como a Linha da Vida os exibe:

```
social seed 151461:    1 → 3 → 6 → 7 → 9 → 10 → 12 → 14 → 15 → 16 → 17 → 18 → 19 → 20
passivo seed 436545:   2 → 3 → 5 → 6 → 7 → 8 → 10 → 13 → 14 → 15 → 17 → 18 → 19
aleatorio seed 721629: 1 → 3 → 4 → 6 → 8 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20
```

O relato humano de "1 → 3 → 6" está **exatamente reproduzido**. A causa é explícita e intencional
em `useGame.envelhecerAno`: um ano silencioso **não emite log e não abre resumo**.

A intenção estava certa — a versão anterior interrompia o jogador com um modal só para dizer "nada
aconteceu", o que é pior. Mas a solução escolhida (não registrar nada) produz uma **biografia com
buracos**, e uma biografia com buracos não parece um ano tranquilo: parece um bug.

**Um ano tranquilo é parte da vida e merece uma linha.** A diferença entre "ano tranquilo" e
"ano que sumiu" é ter ou não uma entrada discreta. Hoje não há distinção visual entre os dois
porque não há entrada nenhuma.

### 10.2. Outros pontos

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| T-01 | Anos silenciosos somem da Linha da Vida | ALTO · UX |
| T-02 | Sem filtro por categoria numa timeline de 80 anos | MÉDIO · UX |
| T-03 | Sem marcadores de fase (infância, adolescência…) | MÉDIO · UX |
| T-04 | `rotuloCategoriaTimeline` mapeia `evento → "Escolha"` mesmo para acontecimento | MÉDIO · NARRATIVA |
| T-05 | Log de horas extras repetido 258× nas 105 vidas, texto idêntico | MÉDIO · NARRATIVA |
| T-06 | Sem exportar / compartilhar a biografia | BAIXO · UX |

**Sobre T-04:** um acontecimento com `categoria: 'evento'` é rotulado **"Escolha"** na Linha da
Vida — o jogador lê "Escolha" ao lado de algo que ele não escolheu. Reforça diretamente C-14.

**Sobre T-05:** "As horas extras deste ano renderam reconhecimento…" aparece **258 vezes** nas
105 vidas, sempre com a mesma frase. Em uma vida individual, isso é a mesma frase 10-15 anos
seguidos. `events/narrativeVariants.ts` já existe e resolve isso para a postura escolar — o padrão
está no repositório e não foi aplicado aqui.

---

## 11. Personalidade

**Veredito: MANTER.** É o sistema mais bem resolvido do jogo e o único que não pediu correção.

- 8 eixos (`empatia`, `generosidade`, `disciplina`, `impulsividade`, `coragem`, `sociabilidade`,
  `independencia`, `familia`). Taxonomia pequena e coerente — resistiu à tentação de ter 30 traços.
- Emergente, não escolhida: nenhum questionário. Só a repetição consistente produz traço perceptível.
- Impacto máximo de 5 pontos por escolha, limiar de 5 para ser percebido, máximo de 3 traços exibidos.
- Traços podem ser **contrabalançados** por escolhas posteriores de sentido oposto.
- Memória de escolhas por `eventoId`/`opcaoId` com teto de 120 registros — permite que eventos
  futuros consultem "o que você fez antes", e já há um uso real disso
  (`childhoodEvents.ts:264` consulta `escolheuAnteriormente: inf_primeiros_passos/opt_correr`).
- **Nunca despeja memória interna na Linha da Vida** — separação explícita e correta.

### Ressalvas (não comprometem o sistema)

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| P-01 | Só 137 opções em todo o catálogo declaram `impactosComportamentais` | MÉDIO · CONTEÚDO |
| P-02 | Acontecimentos corretamente não geram traço — logo, 73 dos 134 eventos nunca formam personalidade | MÉDIO · CONTEÚDO |
| P-03 | Personalidade não realimenta o mundo: nenhum evento muda de peso por traço, nenhum NPC reage | ALTO · COERÊNCIA ENTRE SISTEMAS |

**P-03 é o ponto importante.** A personalidade é **medida com rigor e não é usada para nada** além
de ser exibida. Ela deveria ser exatamente o que pondera a seleção de eventos
(`events/contextWeighting.ts` existe e é o lugar natural), o que faz um parceiro compatível ou
incompatível, o que muda o desfecho de um acontecimento. Hoje é um belo relatório sobre um jogador
que o mundo não conhece.

---

## 12. Avatar

**Veredito: REFINAR.** A fundação geométrica é genuinamente boa; faltam três eixos.

### 12.1. O que funciona — e é melhor do que parece

`presentation/avatar/` é código puro, testável e bem documentado. O que o Avatar 2.0 já resolveu:

- Silhueta com crânio, maçã do rosto, ângulo de mandíbula e queixo (não uma elipse).
- Orelha com hélice e concha; olho com abertura amendoada, esclera, íris, pupila e cílio.
- Busto: pescoço em sombra própria e ombros — o retrato tem uma pessoa, não uma cabeça flutuando.
- Cabelo com linha de implantação real, entradas e costeletas; cacheado como massa contínua de
  raio irregular, não 6 arcos iguais.
- **Proporções interpoladas ano a ano** (`faceProportions.ts`, quadros em 0/6/14/24/…).
- Marcas de idade em faixas próprias (sulcos, pés de galinha, linhas de testa).
- Ordem de pintura em camadas correta (orelhas antes da cabeça, cabelo frontal por último).
- Schema de save preservado; nenhum save precisou ser descartado.

**Isto não deve ser jogado fora.** É uma base de retrato vetorial melhor do que a maioria dos jogos
do gênero tem.

### 12.2. O que falta

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| A-01 | **O renderer não conhece `genero`** — `grep genero` em `presentation/avatar/*` e em `avatarRenderer.ts`: zero ocorrências | ALTO · BUG + UX |
| A-02 | `AvatarEditor` expõe `ESTILOS_BARBA` sem filtrar por gênero | ALTO · UX |
| A-03 | Bebê é adulto reduzido: as proporções interpolam, mas o **conjunto de traços** não muda | ALTO · UX |
| A-04 | Rosto "artificial": simetria perfeita, sem variação individual | MÉDIO · UX |
| A-05 | Avatar não reflete estado (saúde, obesidade, estresse, luto, cargo) | MÉDIO · COERÊNCIA ENTRE SISTEMAS |
| A-06 | Sem roupa, contexto ou cenário por fase da vida | MÉDIO · UX |
| A-07 | Prévia do editor mostra sempre 24 anos — o jogador não vê o bebê que vai jogar primeiro | BAIXO · UX |

**Sobre A-01 e A-02:** confirmado por `grep`. `Character.genero` existe, é escolhido na criação,
é usado em textos e em nomes — e o retrato não o lê. Daí os dois relatos humanos: gênero pouco
diferenciado e pelo facial disponível para personagens femininas. Não é um problema de arte; é uma
prop que nunca foi passada.

**Sobre A-03:** `faceProportions` interpola o **tamanho relativo** das partes, o que é a metade
certa do problema. O que faz um bebê parecer bebê não é só a cabeça proporcionalmente maior — é a
ausência de ponte nasal definida, o queixo quase inexistente, as bochechas que dominam o oval, a
ausência de sobrancelha marcada, os olhos proporcionalmente enormes em relação à abertura palpebral.
Isso pede **variação de traço por faixa**, não só escala.

---

## 13. Localização

**Veredito: REFAZER como sistema (hoje ela não existe como sistema).**

### 13.1. O estado atual, medido

91 municípios em 27 UFs, com `regiao`, `capital` e `custoVidaRelativo` — um catálogo de dados bem
formado. E então:

| Campo | Onde é usado |
| --- | --- |
| `custoVidaRelativo` | **2 arquivos de teste. Nenhum sistema.** |
| `cidade` / `estado` | `CharacterIdentity.tsx`, `GameHeader.tsx`, `narrativeGenerator.ts`, `saveSystem.ts` — **tudo exibição** |
| `regiao` | agrupamento na tela de criação |
| `capital` | nada |

**Nenhum evento do catálogo condiciona por cidade, estado ou região** (`grep` confirmado).
**Nenhum curso é restrito por localidade.** Os 17 cursos estão disponíveis em Rio Branco/AC
exatamente como em São Paulo/SP — incluindo Medicina em universidade federal. As 36 profissões,
idem: *Diretor de Operações (C-Level)* a R$ 28.000/mês está disponível em Parintins/AM.

**Medido: 0 de 105 vidas mudaram de cidade.** Não existe mecanismo de mobilidade — nem evento, nem
ação, nem consequência. O jogador nasce e morre no mesmo lugar, e o lugar nunca importou.

### 13.2. Por que isso é grave neste jogo

VIDA é um jogo **sobre viver no Brasil**. O lugar onde você nasce é, no Brasil, provavelmente a
variável isolada que mais determina a vida de uma pessoa — acesso a universidade, oferta de
emprego, custo de moradia, violência, saúde pública, transporte. Hoje é um rótulo no cabeçalho.

E há um segundo problema, de design: **a cidade é escolhida pelo jogador na criação** como se fosse
uma preferência estética. Em uma vida, você não escolhe onde nasce — e essa é justamente a parte
interessante.

---

## 14. Brasil como sistema

**Veredito: REFAZER (não existe hoje).**

O Brasil aparece no VIDA como **vocabulário**, não como sistema. Vocabulário muito bem feito, aliás:
SUS, ENEM, Jovem Aprendiz, INSS, Instituto Federal, feira livre, macarronada de domingo, forró,
baile da terceira idade, xepa, pão de queijo. O texto em pt-BR é uma das maiores qualidades do
projeto e **deve ser preservado integralmente**.

O que **não** existe como regra:

| Elemento | Estado atual |
| --- | --- |
| SUS × plano de saúde | Uma atividade chamada "Check-up no SUS" (R$ 0). Nenhuma diferença de acesso, fila ou desfecho. |
| ENEM / SISU / ProUni / FIES / cotas | Só a nota de corte. Sem inscrição, sem prazo, sem política afirmativa, sem financiamento. |
| INSS | Um evento que grava uma flag que ninguém lê. |
| CLT × informal × MEI × servidor | Não modelado. Todo emprego é igual. |
| Imposto de renda, FGTS, 13º | Salário × 13 e pronto. |
| Salário mínimo | Não existe como referência. |
| Bolsa Família / BPC / auxílios | Não existem. |
| Transporte público, deslocamento | Um único evento de home office menciona "duas horas de deslocamento". |
| Violência urbana, segurança | Ausente. |
| Racismo, desigualdade estrutural | Ausente (`classeSocial` só define o saldo inicial). |
| Serviço militar, título de eleitor, CNH | CNH aparece em um evento de adolescência, sem efeito sistêmico. |

**Não é uma crítica de escopo — é a identificação do maior espaço de valor não explorado do
projeto.** O jogo já tem a *voz* brasileira. Falta ter as *regras* brasileiras. E a diferença entre
as duas coisas é exatamente a diferença entre "um BitLife traduzido" e "um jogo sobre viver aqui".

---

## 15. Save e exploits

**Veredito: REFINAR.** Ver C-15 para as medições completas.

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| S-01 | JSON em texto puro, sem assinatura nem checksum | ALTO · ARQUITETURA |
| S-02 | Nenhuma validação de plausibilidade na carga (7/7 adulterações aceitas) | ALTO · REGRA |
| S-03 | Save-scumming trivial: auto-save a cada mudança, RNG reamostrado | ALTO · REGRA |
| S-04 | Slot único; vida nova sobrescreve sem confirmação | MÉDIO · UX |
| S-05 | Sem exportar / importar save | BAIXO · UX |

**Nota de proporcionalidade:** VIDA é um jogo single-player local. **Não vale a pena criptografar o
save** — quem quer trapaçar num jogo solo tem esse direito, e gastar engenharia contra isso é
desperdício. O que **vale** a pena é a **validação de plausibilidade na carga**, e por um motivo
diferente: ela protege contra **save corrompido por bug do próprio jogo**, e evita que um estado
impossível (idade 7 com pós-graduação) quebre sistemas rio abaixo de forma difícil de depurar.

O save-scumming (S-03) é a exceção: ele afeta o **design**, não a segurança. Se todo risco é
refazível, nenhuma decisão tem peso. A solução barata é persistir a semente do ano corrente no
save, de forma que recarregar reproduza o mesmo resultado.

---

## 16. Responsividade

**Veredito: MANTER com ressalva metodológica.**

### 16.1. O relato não se reproduz na suíte atual

O playtest relatou **2 testes de responsividade falhando** (714/716). Baseline medido nesta
auditoria: **716/716 verdes**. Os testes relatados como falhando estão passando.

### 16.2. Por que isso não encerra o assunto

`src/styles/__tests__/responsividadeEstrutural.test.ts` **lê o arquivo CSS e casa expressões
regulares**. Ele verifica que as *regras existem*, não que o *layout cabe*. Um teste assim nunca
poderia ter detectado estouro de largura real em 320px.

O mesmo vale para `yearAdvanceDock.test.ts`, que é honesto sobre isso na própria documentação:
jsdom não calcula geometria de `position: fixed`/`sticky`, então a asserção é sobre a **regra
aplicada**, não sobre coordenadas.

A auditoria visual real existe: `scripts/playtest/auditoria.mjs` (Playwright, 320px).
**Não pôde ser executada nesta sessão** — `npx playwright install chromium` falhou com `ECONNRESET`
no CDN da Playwright neste sandbox. As 2 falhas relatadas vieram muito provavelmente de lá.

### 16.3. O que a análise estática mostra

Breakpoints: 1366 → 1180 → 1100 → 900 → 560 → 380. Cobertura razoável, com uma faixa dedicada a
≤380px. `--rail-width` e `--aside-width` são tokens ajustados por breakpoint. Nenhum
`grid-template-columns` com largura fixa. Um comentário em `responsive.css:195` documenta a
correção de um estouro de 4px em 320px **medido no navegador** — o time já fez esse tipo de
verificação antes.

Único ponto rígido encontrado: `screens.css:176`, `.avatar-editor__controls { min-width: 220px }`.
Combinado com o preview do avatar (112px) e os paddings laterais, é o candidato mais provável a
estourar num viewport de 320px.

| ID | Problema | Gravidade · Natureza |
| --- | --- | --- |
| V-01 | Testes de responsividade são estruturais (regex em CSS), não visuais | MÉDIO · ARQUITETURA DE TESTE |
| V-02 | `min-width: 220px` no editor de avatar é candidato a estouro em 320px | BAIXO · UX (não reproduzido) |
| V-03 | Playwright não instalável neste ambiente ⇒ auditoria visual não executada | — (limitação) |

**Recomendação:** não perseguir as "2 falhas" como bug corrente sem reprodução. Em vez disso,
**tornar a auditoria Playwright parte do fluxo** e registrar o resultado, para que "responsividade
verde" signifique "mede pixel", não "mede regex".

---

## 17. Incoerências entre sistemas

Estes são os problemas que **nenhum sistema tem sozinho** — nascem exatamente na fronteira, que é
onde `useGame.ts` costura tudo. São os mais difíceis de ver em teste unitário e os mais fáceis de
ver jogando.

### X-01 · Educação ↔ Carreira: o diploma não vale nada
**CRÍTICO · COERÊNCIA ENTRE SISTEMAS**
Formação em Pedagogia habilita a clinicar. Ver C-02. A ponte entre os dois catálogos nunca existiu.

### X-02 · Carreira ↔ Economia: renda sem fim, sem tributo e sem aposentadoria
**CRÍTICO · COERÊNCIA ENTRE SISTEMAS**
`careerSystem` produz `salarioTotalAnual = mensal × 13` bruto; `economySystem` credita integral.
Ninguém aposenta ninguém. Resultado composto: mediana de R$ 7,9 mi aos 60.

### X-03 · Localização ↔ tudo: 91 municípios que não mudam nada
**ALTO · COERÊNCIA ENTRE SISTEMAS**
`custoVidaRelativo` não chega ao `economySystem`. Cidade não filtra curso nem vaga. Ver seção 13.

### X-04 · Classe social ↔ família / educação / economia
**ALTO · COERÊNCIA ENTRE SISTEMAS**
`classeSocial` define o saldo inicial e nada mais. `gerarFamiliaInicial(_classeSocial)` ignora o
parâmetro. Nascer pobre ou rico no VIDA muda um número e nenhuma vida.

### X-05 · Personalidade ↔ eventos: medida com rigor, nunca consultada
**ALTO · COERÊNCIA ENTRE SISTEMAS**
`events/contextWeighting.ts` existe e é o lugar exato para isso. Ver P-03.

### X-06 · Saúde ↔ carreira / atividades
**ALTO · COERÊNCIA ENTRE SISTEMAS**
90/105 vidas trabalhando com saúde crítica; academia com 18 de saúde. Ver C-12.

### X-07 · Ritmo ↔ catálogo: o pulso é decidido no escuro
**CRÍTICO · ARQUITETURA**
`lifeRhythm` decide antes de saber o que existe. Ver C-06 e 9.1.

### X-08 · Família ↔ economia: filhos aparecem sem custo real de chegada
**MÉDIO · COERÊNCIA ENTRE SISTEMAS**
Há despesa recorrente por filho (R$ 7.000/ano), mas não há custo de gestação, parto, enxoval,
licença, nem impacto na carreira de quem teve o filho.

### X-09 · Avatar ↔ personagem: o retrato não conhece o gênero nem o estado
**ALTO · COERÊNCIA ENTRE SISTEMAS**
Ver A-01 e A-05.

### X-10 · Ações voluntárias ↔ `acoesRealizadasAno`: registro incompleto
**ALTO · ARQUITETURA**
Só 5 ações registram limite anual (`familia:*`, `pedir_aumento`, `loteria_mega_sena`,
`atividade:*`, e `bico`/`horasExtras` via campos próprios). **`candidatar_emprego` e
`ingressar_curso` não registram** — e são justamente as duas de maior impacto. O mecanismo existe,
funciona, e não foi aplicado onde mais importa.

### X-11 · Educação ↔ Linha da Vida: cursando sem semestre
**BAIXO · BUG**
Nas biografias simuladas aparece `cursando Ensino Fundamental (undefined/undefined sem)`:
`semestreAtual`/`totalSemestres` só são preenchidos para superior/técnico/pós, mas o estado
`emCurso` é compartilhado com a educação básica. Não quebra nada hoje, mas é um `undefined`
esperando por uma tela que o exiba.

---

## 18. Problemas fora do prompt

Achados **não relatados** pelo playtest humano e não pedidos no escopo.

### N-01 · 43 de 73 acontecimentos têm desfechos equiprováveis
**ALTO · CONTEÚDO**
Nenhum peso declarado ⇒ "marcar um golaço" e "ficar sem jogar" têm 50% cada, independentemente de
condicionamento físico, disciplina ou sorte. O desfecho de um acontecimento deveria ser onde os
atributos do personagem **aparecem sem perguntar nada** — hoje é onde eles são ignorados.

### N-02 · Uma frase de carreira repetida 258 vezes
**MÉDIO · NARRATIVA**
Ver T-05.

### N-03 · O jogo não tem fim próprio além da morte
**MÉDIO · DESIGN**
Longevidade medida: mín 41 · p25 64 · mediana 71 · p75 76 · máx 90 — curva plausível e boa.
Mas não há aposentadoria como fase (C-09), nem netos, nem legado, nem balanço de vida. A velhice
é "vida adulta com mais eventos de saúde".

### N-04 · Nenhum sistema de saúde de longo prazo
**ALTO · CONTEÚDO**
Sem doença crônica, sem diagnóstico, sem tratamento continuado, sem deficiência, sem saúde mental
como estado (existe `estresse` como stat oculto, mas não há depressão, ansiedade, terapia com
efeito). Num jogo sobre uma vida inteira, a saúde é hoje uma barra que só desce.

### N-05 · Bundle acima de 500 kB sem code-splitting
**BAIXO · ARQUITETURA**
Aviso do Vite no build. Irrelevante hoje; relevante quando o catálogo de eventos crescer 5×.

### N-06 · `useGame.ts` com 980 linhas é o gargalo estrutural
**ALTO · ARQUITETURA**
É onde cada comando escreve em 4-5 estados independentes, onde as validações *deveriam* estar e
não estão, e onde qualquer regra nova terá que passar. Não é dívida cosmética: é o motivo pelo
qual "acrescentar uma checagem" hoje significa "encontrar os 6 lugares que precisam dela".

### N-07 · 2 vagas inalcançáveis por via natural
**MÉDIO · BUG**
*Estagiário Universitário* e *Desenvolvedor Júnior* exigem `superior_incompleto`, que o motor nunca
atribui. Ver E-04.

### N-08 · Nenhuma decisão é reversível ou de longo prazo
**MÉDIO · DESIGN**
Toda decisão do jogo se resolve no mesmo ano. Não existe compromisso plurianual (um curso que você
pode trancar, uma dívida que você escolheu assumir, uma promessa a um familiar, uma mudança de
cidade com custo de adaptação). Isso achata a sensação de consequência tanto quanto o silêncio
achata a de presença.

### N-09 · A infância tem mais agência que a vida adulta — e isso é o oposto da vida
**ALTO · DESIGN**
Não é só um problema de calibração (C-06): é um problema de **leitura**. Um jogador que passa
39,8% dos anos da infância com algo acontecendo e 76,7% dos 40 aos 49 em branco conclui, com razão,
que o jogo "acaba" quando ele vira adulto.

---

## 19. Métricas

Todas medidas em **105 vidas completas** (7 perfis × 15 seeds), pipeline real, determinístico.
Artefatos: `/tmp/vida-auditoria/resumo.md`, `bruto.json`, 15 biografias `vida-<perfil>-<seed>.md`.

### 19.1. Violações de coerência

| Código | Ocorrências | Vidas afetadas | Idade média |
| --- | --- | --- | --- |
| `NPC_SEM_NOME` | 2.281 | 43 / 105 | 42,4 |
| `MULTIPLOS_FILHOS_MESMO_ANO` | 1.248 | **99 / 105** | 44,1 |
| `SEM_APOSENTADORIA` | 418 | 60 / 105 | 74,5 |
| `TRABALHO_COM_SAUDE_CRITICA` | 366 | **90 / 105** | 66,2 |
| `FORMACAO_RAPIDA_DEMAIS` | 172 | 79 / 105 | 45,2 |
| `NAMORO_INSTANTANEO` | 162 | **102 / 105** | 41,7 |
| `SALARIO_ALTO_IDADE_BAIXA` | 23 | 14 / 105 | 19,6 |
| `COMPRA_DE_LUXO_COM_DIVIDA` | 22 | 20 / 105 | 42,8 |
| `ATIVIDADE_INCOMPATIVEL_COM_SAUDE` | 21 | 17 / 105 | 67,0 |
| `VESTIBULAR_MULTIPLAS_TENTATIVAS_MESMO_ANO` | 21 | 19 / 105 | 25,5 |
| `CANDIDATURA_ILIMITADA_MESMO_ANO` | 9 | 9 / 105 | 16,2 |
| `DINHEIRO_SEM_ORIGEM` | 0 | — | — |
| `MENOR_COM_PATRIMONIO_ALTO` | 0 | — | — |
| `FILHO_IDADE_IMPOSSIVEL` | 0 | — | — |
| `CARGO_SEM_ESCOLARIDADE` | 0 | — | — |

Os quatro zeros são **resultados positivos reais**: `saveSystem` e `availabilitySystem` protegem
bem a escolaridade mínima e a idade dos filhos. `DINHEIRO_SEM_ORIGEM` deu zero porque o harness
conseguiu rastrear todo lançamento — mas **ele só conseguiu porque construiu a razão do lado de
fora**. Dentro do jogo, a origem continua invisível (F-02).

### 19.2. Ritmo por década

Ver tabela completa em C-06. Síntese: infância 39,8% de acontecimento; vida adulta ~75% de silêncio.

### 19.3. Agência por faixa

Ver tabela em 9.2. Decisões até os 18: mediana **2**; 3,8% das vidas chegam aos 18 com **zero**.

### 19.4. Economia

| Indicador | Valor |
| --- | --- |
| Saldo aos 20 | mín −600 · mediana 12.117 · **máx 182.048** |
| Saldo aos 30 | mín −1.400 · mediana 0 *(teto de dívida)* · máx 2.409.797 |
| Saldo aos 60 | **mediana 7.953.442** |
| Vidas com > R$ 20.000 antes dos 18 | 0 / 105 |
| Primeira vez com salário ≥ R$ 5.000/mês | 89 vidas · mín 19 · mediana 31 anos |
| Primeira vez com salário ≥ R$ 10.000/mês | 80 vidas · mín 21 · mediana 37 anos |
| Primeira vez com salário ≥ R$ 20.000/mês | 74 vidas · mín 26 · mediana 41 anos |

### 19.5. Educação

Nível final: `superior_completo` 84 · `pos_graduacao` 14 · `tecnico` 6 · `medio_completo` 1.
**Zero evasão, zero repetência.** Duração medida por curso: ver tabela em C-03.

### 19.6. Carreira

Primeiro emprego: mín 17 · mediana 17 · máx 37.
Saltos salariais > 2× em um ano: **66**.

### 19.7. Linha da Vida

841 buracos · mediana 1 ano · p90 2 · **máximo 5 anos seguidos sem uma linha**.

### 19.8. Marcos

*A Primeira Palavra*: **17%** das vidas. *Primeiros Passos*: **13%**.

### 19.9. Transições de vida

| Transição | Cobertura | Idade (mín / mediana / máx) |
| --- | --- | --- |
| 1º dia de Fundamental | 100% | 6 / 6 / 6 |
| Conclusão do Fundamental | 100% | 14 / 14 / 14 |
| Conclusão do Médio | 100% | 17 / 17 / 17 |
| Morte de um dos pais | 99% | 32 / 42 / 51 |
| Saída da casa dos pais | **0% — não existe** | — |
| Aposentadoria efetiva | **0% — não existe** | — |
| Mudança de cidade | **0% — não existe** | — |

### 19.10. Longevidade — **resultado bom**

mín 41 · p25 64 · **mediana 71** · p75 76 · máx 90.
Curva plausível para o Brasil, com cauda inferior realista. `deathSystem` e `attributeSystem`
(`calcularResiliencia`, 0,55–1,6) estão validados pela simulação: **MANTER sem alteração**.

### 19.11. Catálogo de eventos

134 eventos (73 acontecimentos / 61 decisões). Elegíveis por idade: 4 aos 0 anos · 23 aos 10 ·
34 aos 20 · 56 aos 40 · 47 aos 70 · 21 aos 90.
22/73 acontecimentos com texto de escolha · 43/73 sem peso declarado · 0 decisões com opção falsa
(**bom resultado**: nenhuma decisão do catálogo tem duas opções de consequência idêntica).

---

## 20. Exemplos de vidas incoerentes

Vidas reais geradas pelo motor, reproduzíveis por seed.

---

### Vida 1 — O clínico geral formado em Pedagogia
*(reprodução R2, determinística)*

> Ela se forma em Pedagogia aos 22 anos. Nunca trabalhou. Abre a aba Carreira e encontra **34 vagas
> disponíveis**, entre elas Auditor Fiscal (R$ 33.000), COO (R$ 28.000) e **Médico Clínico Geral
> (R$ 19.500)**. Candidata-se à vaga de medicina. O jogo responde:
>
> *"Parabéns! Você foi contratado(a) como Médico(a) Clínico Geral com salário de R$ 19.500/mês!"*
>
> Dois anos depois, com bom desempenho, é promovida automaticamente a **Cirurgiã Especialista**
> (R$ 35.000/mês) — sem residência, sem CRM, sem ter aberto um livro de anatomia.
>
> No mesmo ano, matricula-se em **Residência Médica / Especialização**. O sistema aceita.

**Sistemas envolvidos:** educação, carreira, disponibilidade.
**Causas:** C-02, C-11, E-06.

---

### Vida 2 — Sim8919: 25 filhos, nenhum namoro que durasse
*(seed 8919, perfil estudioso — `/tmp/vida-auditoria/vida-estudioso-8919.md`)*

> Santa Maria/RS, classe média baixa. Aos 23 anos começa a namorar **Bruno** — que surge já com
> relacionamento 85, no mesmo clique.
>
> Aos 28, **nascem três filhos no mesmo ano**. Aos 32, mais dois. Aos 33, mais três. Aos 35, dois.
> Aos 37, três. Aos 40, três. Aos 46, dois. Aos 56, dois.
> Nenhuma gestação, nenhum intervalo, nenhum custo de parto.
>
> Aos 59 tem saúde 12 e continua trabalhando como Analista Pleno. Aos 60, saúde 8, é promovido a
> Gerente Corporativo. Aos 61, saúde 2. Aos 62, **saúde 0 — e vai trabalhar.** Morre naquele ano de
> "complicações graves de saúde e falência múltipla de órgãos".
>
> No mesmo ano da morte, seu fechamento financeiro credita **+R$ 127.700**.

**Sistemas:** relacionamento, família, carreira, saúde, economia.
**Causas:** C-07, C-08, C-12, C-09.

---

### Vida 3 — O menor de idade que juntou R$ 276 mil
*(reprodução R5, determinística)*

> Aos 16 anos entra como Jovem Aprendiz, R$ 950/mês. O jogo credita **R$ 12.350 no ano e não cobra
> nada** — nem transporte, nem lanche, nem material, nem contribuição em casa.
> Aos 17: saldo R$ 25.700.
>
> Aos 18, é contratado como **Técnico Judiciário Concursado** (R$ 7.500/mês) — sem concurso, sem
> experiência, só com o ensino médio. No mesmo aniversário, o jogo passa a cobrar **R$ 14.000/ano**
> de custo de vida, como se ele tivesse se mudado sozinho.
>
> Saldo aos 19: R$ 192.700. Aos 20: **R$ 276.200.** Ele mora com os pais o tempo todo.

**Sistemas:** economia, carreira.
**Causas:** C-10 (A, B, C), C-01.
**Este é o "R$ 166.910 aos 20 anos" do playtest** — o máximo medido em vidas completas foi
R$ 182.048, e o cenário isolado chega a R$ 276.200.

---

### Vida 4 — O ano em que nada aconteceu, seis vezes
*(seed 721629, perfil aleatório)*

> A Linha da Vida deste personagem, nos primeiros 20 anos, mostra as idades:
>
> **1 → 3 → 4 → 6 → 8 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20**
>
> Entre os 8 e os 13 anos há **quatro anos consecutivos sem uma única linha**. Não houve escolha
> perdida nem oportunidade recusada: o `lifeRhythm` sorteou silêncio, e o silêncio não deixa marca.
>
> O jogador, olhando a própria biografia, vê a infância pular de 8 para 13 e conclui que o jogo
> travou.

**Sistemas:** pacing, Linha da Vida.
**Causas:** C-06, T-01.

---

### Vida 5 — O COO de 78 anos com 12 de saúde
*(seed 16838, perfil estudioso)*

> Aos 70 anos ele é **Diretor de Operações (C-Level)**, R$ 28.000/mês. Aos 71, idem. Aos 72, 73, 74,
> 75, 76, 77 — o log de violação registra oito anos seguidos de "ainda trabalhando, sem sistema de
> aposentadoria".
>
> Aos 78 tem **saúde 12** e continua no cargo.
> Aos 79, com **saúde 5**, escolhe a atividade **"Sair para um Barzinho / Balada com Amigos"**.
>
> No meio disso, aos 74, conclui um **Técnico em Desenvolvimento de Sistemas em um ano**.
> Aos 77 e aos 78 inicia dois namoros diferentes, cada um nascendo em relacionamento 85.

**Sistemas:** carreira, saúde, atividades, educação, relacionamento.
**Causas:** C-09, C-12, C-03, C-08.

---

### Vida 6 — A família de sete irmãos nascidos em sete anos
*(reprodução R6, determinística)*

> Forçando a chance de nascimento de irmão, a mãe do personagem dá à luz nos anos em que ele tem
> **1, 2, 3, 4, 5, 6 e 7 anos** — sete filhos em sete anos consecutivos.
>
> Nenhuma checagem de gestação, de intervalo entre partos, de idade da mãe, de existência do pai,
> ou de limite de filhos. E vários desses irmãos entram na lista da família chamados
> **"Novo Familiar"**.

**Sistemas:** família, eventos.
**Causas:** R-04, C-13.

---

### Vida 7 — Aprovado em Medicina na segunda tentativa do mesmo ano
*(19 vidas medidas; reprodução R9)*

> Aos 18 anos ele presta o vestibular para Medicina. A nota do ENEM sai abaixo do corte de 810.
> Ele clica de novo — no **mesmo ano de jogo**. Nova nota, sorteada do zero.
>
> Medido: 21 aprovações confirmadas **na tentativa 2 do mesmo ano** (Medicina, Direito, Psicologia,
> Engenharia de Software), com um agente que tenta no máximo duas vezes.
>
> Com inteligência 72 — abaixo do mínimo do curso — o cenário isolado permitiu **200 tentativas
> consecutivas no mesmo ano**, todas aceitas pelo sistema. Não passou por azar de faixa de nota,
> não por regra.

**Sistemas:** educação, disponibilidade.
**Causas:** C-04, X-10.

---

## 21. O que preservar

Esta seção existe para que a correção não destrua o que está certo.

### 21.1. Preservar sem tocar

| O quê | Por quê |
| --- | --- |
| **Arquitetura `systems/` pura, sem React** | É o que torna o jogo testável e simulável. Esta auditoria só foi possível por causa disso. |
| **`availabilitySystem` como política única** | A UI consulta e nunca inventa regra. É o lugar certo para as validações que faltam. |
| **`personalitySystem`** | Emergente, taxonomia enxuta, memória estruturada, nunca vaza para a timeline. O melhor sistema do jogo. |
| **`interactionCapabilitySystem`** | Bebê não conversa, pet não recebe presente. Regra única, revalidada pelo motor. Exemplar. |
| **`events/repetitionPolicy`** | Resolve repetição com política tipada e cooldown padrão. Sólido. |
| **`events/nature` + `tomDoDesfecho` + `categoriaDeLogDoEvento`** | A distinção acontecimento × decisão é a melhor ideia de design recente do projeto. |
| **`deathSystem` + `attributeSystem`** | Curva de longevidade validada empiricamente (mediana 71). Não mexer. |
| **`presentation/` separada do domínio** | Renderer de avatar e timeline puros e testáveis. |
| **Fonte de aleatoriedade injetável** | Sem isso não há simulação, não há auditoria, não há regressão de balanceamento. |
| **`migrarEstadoSalvo` defensivo** | Saves antigos carregam sem perder dado. Correto. |

### 21.2. Preservar o conteúdo

- **Todo o texto em pt-BR.** É a maior qualidade do projeto e não tem substituto barato.
  O vocabulário brasileiro (SUS, ENEM, Jovem Aprendiz, feira livre, macarronada de domingo, forró,
  xepa) é autêntico e específico.
- **Os 134 eventos.** Nenhum precisa ser descartado. 22 precisam de reescrita de voz (C-14), 43 de
  pesos (N-01) — mas o conteúdo está lá.
- **O catálogo de 36 profissões e 17 cursos.** Títulos verossímeis, salários defensáveis, cadeias
  de progressão bem pensadas. O que falta são as pontes entre eles, não os itens.
- **Os 91 municípios com `custoVidaRelativo`.** O dado está pronto e correto. Falta ligá-lo.
- **A geometria do Avatar 2.0.** Silhueta, orelha, olho, busto, implantação de cabelo, proporções
  interpoladas, marcas de idade. Base sólida; faltam gênero, traços por faixa e variação individual.

### 21.3. Preservar as decisões de design

- **"A vida acontece. Às vezes você decide."** — princípio correto. O problema é a calibração,
  não o princípio.
- **Decisão é minoria do conteúdo, em qualquer idade.** Correto. Manter.
- **Ano sem nada a relatar não abre modal.** Correto. O erro foi *também* não registrar nada.
- **Personalidade não vem de questionário.** Correto e raro.
- **Sem foto, sem IA, sem asset externo no avatar.** Decisão coerente e bem executada.

---

## 22. O que corrigir

Problemas com causa localizada e solução conhecida. Nenhum exige redesenho.

| ID | Correção | Onde | Gravidade |
| --- | --- | --- | --- |
| **F1** | Formatura: usar `semestreAtual` iniciando em 0, ou `> totalSemestres`; revisar cursos de duração ímpar | `educationSystem.ts:102-113`, `coursesData.ts` | CRÍTICO |
| **F2** | Registrar `ingressar_curso` e `candidatar_emprego` em `acoesRealizadasAno` | `useGame.ts`, `availabilitySystem.ts` | CRÍTICO |
| **F3** | Persistir a nota do ENEM do ano em `EducationState` (`ultimoEnem: { ano, nota }`) | `educationSystem.ts` | CRÍTICO |
| **F4** | Validar `experienciaNecessaria` em `candidatarEmprego` e em `listarVagasCompativeis` | `careerSystem.ts`, `availabilitySystem.ts` | CRÍTICO |
| **F5** | Validar escolaridade também na **promoção automática** | `careerSystem.ts:302` | ALTO |
| **F6** | Trocar o `OU` por `E` em `pedirAumento` e aplicar teto (ex.: 1,6× o salário-base do cargo) | `careerSystem.ts:173` | ALTO |
| **F7** | Nomear todo NPC criado por evento — `sortearNome` por gênero; remover o default `'Novo Familiar'`/`tipo: 'pet'` | `eventSystem.ts` + 7 arquivos de evento | ALTO |
| **F8** | 1 filho por ano por parceiro, no máximo | `relationshipSystem.terFilho` | CRÍTICO |
| **F9** | Intervalo mínimo entre nascimentos de irmãos e limite por família | `familySystem.ts` | ALTO |
| **F10** | Menor de idade: cobrar despesas proporcionais e creditar salário parcialmente | `economySystem.ts:69-72` | CRÍTICO |
| **F11** | Bloquear compra de luxo com `dividas` acima de um limiar | `availabilitySystem.ts` (`comprar_bem`) | MÉDIO |
| **F12** | Bloquear/penalizar atividade física intensa com saúde crítica | `availabilitySystem.ts` (`executar_atividade`) | MÉDIO |
| **F13** | Atribuir `fundamental_incompleto` / `medio_incompleto` / `superior_incompleto` durante o curso | `educationSystem.ts` | MÉDIO |
| **F14** | Aplicar `custoVidaRelativo` do município na despesa base | `economySystem.ts` | ALTO |
| **F15** | Usar `classeSocial` em `gerarFamiliaInicial` | `familySystem.ts` | MÉDIO |
| **F16** | Reescrever os 22 acontecimentos com texto de escolha para voz de mundo, no pretérito | `data/events/**` | ALTO |
| **F17** | Declarar pesos nos 43 acontecimentos com desfechos equiprováveis | `data/events/**` | ALTO |
| **F18** | Variantes textuais para o log de horas extras (padrão de `narrativeVariants`) | `careerSystem.ts` | MÉDIO |
| **F19** | Rotular acontecimentos na timeline como "Acontecimento", não "Escolha" | `timelinePresentation.ts` | MÉDIO |
| **F20** | Validação de plausibilidade na carga do save (clamps de domínio + coerência cruzada) | `saveSystem.ts` | ALTO |
| **F21** | Persistir a semente do ano no save (mata o save-scumming) | `saveSystem.ts`, `useGame.ts` | ALTO |
| **F22** | Corrigir `semestreAtual`/`totalSemestres` `undefined` na educação básica | `educationSystem.ts` | BAIXO |
| **F23** | Tornar `superior_incompleto` alcançável ⇒ liberar Estagiário e Dev Júnior | decorre de F13 | MÉDIO |

---

## 23. O que redesenhar

Problemas sem solução pontual: exigem uma peça nova ou uma inversão de responsabilidade.

### D-1 · Camada de plausibilidade (`plausibilitySystem`) — **CRÍTICO**

O buraco central. Hoje só existe `getActionAvailability` (posso clicar?). Falta
`avaliarPlausibilidade` (isto pode acontecer com **esta** pessoa, **agora**?).

Três eixos, que devem ser explícitos e distintos:

| Eixo | Pergunta | Exemplo |
| --- | --- | --- |
| **Possível** | É fisicamente/biologicamente possível? | Um homem não engravida; um bebê não dirige. |
| **Legal** | A lei brasileira permite? | Trabalhar aos 14 só como aprendiz; casar antes dos 16, nunca. |
| **Provável** | É plausível com esta trajetória? | Um mestre de obras de 18 anos: legal, possível, **improvável sem experiência**. |

Os dois primeiros são **bloqueios duros**. O terceiro é um **modificador de chance** — o improvável
deve continuar possível (é isso que gera histórias), mas raro e narrado como excepcional.

Isto resolve, de uma vez: C-01, C-02, C-11, K-03, K-08, e dá lugar para F4/F5.

### D-2 · Calendário de vida (`lifeCalendar`) — **CRÍTICO**

Inverter a ordem de decisão do ritmo:

```
hoje:   lifeRhythm decide o pulso → consulta o catálogo
        (decide no escuro; ano cheio vira ano mudo; marcos se perdem)

novo:   1. calendário: o que este ano OBRIGATORIAMENTE tem?
           (marcos de desenvolvimento, transições escolares, gestação em curso,
            aniversários de idade legal, consequências agendadas)
        2. catálogo: o que está elegível e é relevante para este estado?
        3. lifeRhythm: quanto disso vira tela, e em que forma?
```

Três conceitos novos, todos ausentes hoje:

- **Marco obrigatório**: acontece na janela, ponto. Se o ritmo diz silêncio, o marco entra mesmo
  assim (é *ele* que torna o ano não-silencioso). Resolve C-05.
- **Evento agendado**: um efeito marcado para um ano futuro. É o que permite gestação de nove meses,
  curso plurianual, dívida com vencimento, promessa a um familiar. Resolve N-08 e X-08.
- **Ano tranquilo registrado**: silêncio deixa de significar "sem entrada". Um ano sem nada notável
  produz **uma linha discreta** ("Um ano sem grandes mudanças. Você tinha 34 anos e a vida seguiu.")
  — sem modal, sem interrupção. Resolve T-01.

### D-3 · Livro-razão financeiro (`financialLedger`) — **ALTO**

`economia.dinheiro` deixa de ser um número solto e passa a ser a soma de lançamentos tipados:

```
{ idade, ano, categoria: 'salario'|'despesa'|'compra'|'venda'|'heranca'|'evento'|'rendimento'|'juros',
  descricao, valor, saldoDepois }
```

Isso entrega três coisas de uma vez: (a) **o jogador pode perguntar "de onde veio isso?"** e ter
resposta (F-02); (b) o balanceamento passa a ser auditável sem harness externo; (c) a tela de
finanças ganha extrato, que é a informação que ela deveria ter desde sempre.

### D-4 · Modelo de relacionamento por estágios — **CRÍTICO**

Substituir "parceiro instantâneo em 85" por progressão com tempo:

```
conhecido (0-30) → aproximação (30-55) → namoro (55-75) → sério (75-90) → casamento
```

Com: origem contextual do parceiro (colega de trabalho, de faculdade, do bairro, de um evento),
tempo mínimo por estágio, desgaste por ausência de investimento, término e reconciliação,
compatibilidade avaliada por traços de personalidade (fecha X-05), e **gestação como evento
agendado** (D-2) em vez de filho instantâneo. Resolve C-07, C-08, R-01, R-02, R-03, R-09.

### D-5 · Localização como sistema — **ALTO**

Arquitetura **por perfil, não por cadastro** — nunca cadastrar milhares de cidades manualmente:

```
Município = { nome, uf, regiao, populacao, perfil: PerfilDeCidade }

PerfilDeCidade (~8 arquétipos, não 5.570 cadastros):
  'metropole' | 'capital_regional' | 'cidade_media' | 'cidade_pequena'
  'interior_agricola' | 'interior_industrial' | 'litoral_turistico' | 'fronteira_amazonica'

Cada perfil DERIVA:
  custoDeVida · ofertaDeEnsinoSuperior (quais áreas, pública/privada)
  mercadoDeTrabalho (quais setores, teto salarial realista)
  acessoASaude · transporte · eventos regionais elegíveis
```

Assim, 5.570 municípios cabem num CSV de 4 colunas (nome, UF, população, perfil) — ou são
derivados de faixa populacional — **sem uma linha de regra por cidade**. As regras vivem nos
~8 perfis.

Acrescentar **mobilidade**: mudar de cidade como decisão real, com custo, motivo (faculdade,
emprego, relacionamento, cuidado de familiar) e consequência. Resolve X-03 e a falta medida de
0/105 mudanças.

### D-6 · Avatar: gênero, traços por faixa, variação individual — **ALTO**

Três acréscimos ao renderer existente (não substituição):

1. **`genero` como entrada do renderer.** Ajusta mandíbula, sobrancelha, lábio, pescoço, ombros.
   Filtra `ESTILOS_BARBA` no editor. Resolve A-01/A-02 — é literalmente uma prop que falta.
2. **Conjunto de traços por faixa, não só escala.** Bebê: sem ponte nasal definida, queixo mínimo,
   bochecha dominante, sobrancelha quase ausente, olho grande em relação à abertura palpebral.
   Resolve A-03.
3. **Semente de variação individual** derivada do id do personagem: assimetria sutil, largura de
   nariz, espaçamento dos olhos, altura de implantação. Resolve A-04 (rosto "artificial" é, quase
   sempre, rosto perfeitamente simétrico).

Opcional, de maior valor: **estado visível no retrato** (saúde, estresse, luto) — A-05.

### D-7 · Brasil como camada de regras — **ALTO**

Não é "mais conteúdo": é a identidade do produto. Priorizado por razão custo/impacto:

| Peça | Impacto | Custo |
| --- | --- | --- |
| INSS e aposentadoria funcionando (fecha C-09) | **Altíssimo** | Baixo — os campos já existem |
| Salário líquido (INSS + IRRF) e 13º explícito | Alto | Baixo |
| ENEM/SISU/ProUni/FIES/cotas como caminhos distintos | Alto | Médio |
| CLT × informal × MEI × servidor como vínculos | Alto | Médio |
| SUS × plano de saúde com diferença de acesso e desfecho | Alto | Médio |
| Salário mínimo como referência de escala | Médio | Baixo |
| Benefícios sociais (Bolsa Família, BPC) ligados a `classeSocial` | Médio | Médio |

### D-8 · Extrair a orquestração de `useGame.ts` — **ALTO**

980 linhas concentram toda a costura entre sistemas. É onde as validações deveriam estar e não
estão, e é o motivo pelo qual uma checagem nova precisa ser copiada em seis lugares.

Extrair para `systems/commands/` (`comandoCandidatarEmprego`, `comandoIngressarCurso`, …), cada um
com o mesmo contrato: **validar disponibilidade → validar plausibilidade → aplicar → registrar
ação anual → devolver logs**. `useGame` volta a ser o que deve ser: estado React e despacho.
Resolve N-06 e X-10 estruturalmente.

---

## 24. O que remover

Lista curta e deliberada. **Nada aqui é "remover um sistema"** — a instrução de não remover sistemas
para fazer testes passarem foi respeitada integralmente.

| O quê | Por quê | Gravidade |
| --- | --- | --- |
| Default `nome: 'Novo Familiar'` + `tipo: 'pet'` em `adicionarFamiliar` | Produz 2.281 pessoas sem nome e converte amigos em pets por omissão. Substituir por nome sorteado obrigatório. | ALTO |
| Flag `'aposentado_inss'` **como está** | Ninguém a lê. Ou liga-se a `CareerState.aposentado`, ou sai. Flag morta engana quem lê o código. | MÉDIO |
| Condição `OU` em `pedirAumento` | `desempenho >= 75` **ou** `anosNoCargo >= 2` torna o aumento praticamente automático. | ALTO |
| Tolerância `inteligenciaMinima <= inteligencia + 15` em `listarVagasCompativeis` | Anula silenciosamente um requisito declarado. Se a folga é intencional, deve ser explícita e narrada. | MÉDIO |
| `return` antecipado do menor de idade em `economySystem` | Concede 100% do salário e zero despesa. Substituir por modelo de dependente. | CRÍTICO |
| Cursos de 3 semestres **no modelo atual** de 2 semestres/ano | Ou o modelo passa a contar semestres de verdade, ou o catálogo usa durações pares. Hoje produzem formatura em 1 ano. | CRÍTICO |
| Rótulo `'evento' → "Escolha"` para acontecimentos na timeline | O jogador lê "Escolha" ao lado do que não escolheu. | MÉDIO |
| `scripts/audit/*` **ao fim do ciclo de correção** | Ferramenta de diagnóstico, não parte do jogo. Documentada em `scripts/audit/README.md`; manter enquanto houver correção a validar, remover depois. | — |

---

## 25. Arquitetura recomendada

### 25.1. Alvo

```
src/
├── types/
├── systems/
│   ├── core/
│   │   ├── availabilitySystem      [MANTER]  posso clicar?
│   │   ├── plausibilitySystem      [NOVO]    possível × legal × provável
│   │   ├── lifeCalendar            [NOVO]    marcos, agendados, ano tranquilo
│   │   └── pacing/lifeRhythm       [REFINAR] quanto disso vira tela
│   ├── commands/                   [NOVO]    orquestração extraída de useGame
│   │   └── comandoX: disponibilidade → plausibilidade → aplicar → registrar
│   ├── domain/
│   │   ├── educationSystem   [REFINAR]
│   │   ├── careerSystem      [REFAZER regras, MANTER catálogo]
│   │   ├── economySystem     [REFINAR] + financialLedger [NOVO]
│   │   ├── relationshipSystem[REFAZER modelo]
│   │   ├── familySystem      [REFINAR]
│   │   ├── healthSystem      [NOVO]    crônico, tratamento, incapacidade
│   │   ├── locationSystem    [NOVO]    perfis de cidade + mobilidade
│   │   ├── personalitySystem [MANTER]
│   │   ├── deathSystem       [MANTER]
│   │   ├── attributeSystem   [MANTER]
│   │   └── interactionCapabilitySystem [MANTER]
│   ├── events/               [MANTER, + contextWeighting por personalidade]
│   └── saveSystem            [REFINAR] + validação de plausibilidade na carga
├── data/
│   ├── events/               [MANTER conteúdo; REFINAR voz e pesos]
│   ├── careers/  + requisitos reais (curso, licença, experiência)
│   ├── courses/  + profissões habilitadas, oferta por perfil de cidade
│   ├── locations/ + PerfilDeCidade (~8 arquétipos)
│   └── brasil/   [NOVO] INSS, IRRF, salário mínimo, benefícios
├── presentation/             [MANTER] + gênero e estado no avatar
├── hooks/useGame.ts          [REDUZIR] estado React e despacho
└── components/
```

### 25.2. Os três invariantes que a arquitetura precisa garantir

1. **Nenhum estado muda sem passar por um comando**, e nenhum comando aplica sem passar por
   disponibilidade **e** plausibilidade. Hoje `useGame` aplica direto em vários pontos.
2. **Nenhum dado declarado num tipo fica sem consumidor.** A tabela do resumo executivo
   (7 campos mortos) é o custo de não ter essa regra. Um teste de arquitetura pode verificá-la.
3. **Todo ano vivido produz pelo menos uma linha na biografia.** Silêncio é um *tipo* de linha,
   não a ausência dela.

### 25.3. Escalabilidade sem cadastro manual

Restrição explícita do pedido: não cadastrar milhares de cidades ou cursos à mão.

**Cidades:** ~8 `PerfilDeCidade` carregam as regras; cada município é `(nome, uf, população)` e
recebe um perfil por faixa populacional + região. 5.570 municípios = um CSV, zero regras novas.

**Cursos e profissões:** relacionar por **área de formação** (`saude`, `direito`, `engenharia`,
`ti`, `educacao`, `gestao`, `artes`), não por par curso↔vaga. Um curso declara sua área e as
licenças que habilita; uma vaga declara a área exigida, a licença e a experiência. 17 cursos ×
36 profissões deixam de ser 612 pares e viram ~7 áreas.

**Eventos:** manter o modelo atual (elegibilidade + peso contextual + política de repetição). Ele
escala bem; o que falta é peso por personalidade e por perfil de cidade — dois campos, não uma
reescrita.

---

## 26. Ordem de correção

Critério: **primeiro o que um jogador percebe em 10 minutos de jogo, depois o que sustenta a
correção seguinte.** Cada fase é entregável e verificável de forma independente.

---

### Fase 0 — Instrumentação *(pré-requisito de tudo)*

1. Promover o harness de auditoria a **suíte de regressão de coerência** (não de aceite): as 14
   checagens viram um relatório executável a cada mudança de balanceamento.
2. Instalar o Playwright e rodar `scripts/playtest/auditoria.mjs` num ambiente com rede, para
   resolver a lacuna da seção 16.

*Sem isto, cada correção de balanceamento é feita no escuro.*

---

### Fase 1 — Coerência gritante *(o que quebra a suspensão de descrença de imediato)*

| # | Item | Refs |
| --- | --- | --- |
| 1 | Off-by-one da formatura + durações de curso | F1 |
| 2 | Validar experiência e formação na contratação **e na promoção** | F4, F5, C-01, C-02, C-11 |
| 3 | 1 vestibular por ano, com nota persistida | F2, F3 |
| 4 | 1 candidatura significativa por ano | F2 |
| 5 | 1 filho por ano; intervalo entre irmãos | F8, F9 |
| 6 | Nomear todos os NPCs | F7 |
| 7 | Economia do menor de idade | F10 |

**Resultado esperado:** `FORMACAO_RAPIDA_DEMAIS`, `SALARIO_ALTO_IDADE_BAIXA`,
`MULTIPLOS_FILHOS_MESMO_ANO`, `NPC_SEM_NOME`, `VESTIBULAR_*` e `CANDIDATURA_*` vão a zero.
São ~4.100 das ~4.700 violações medidas.

---

### Fase 2 — O jogo volta a acontecer *(pacing)*

| # | Item | Refs |
| --- | --- | --- |
| 8 | `lifeCalendar`: marcos obrigatórios | D-2, C-05 |
| 9 | Inverter a ordem: consultar conteúdo antes de decidir o pulso | D-2, C-06, X-07 |
| 10 | Ano tranquilo registrado com uma linha discreta | D-2, T-01 |
| 11 | Recalibrar densidade da vida adulta (alvo: ≤ 45% de anos silenciosos dos 20 aos 70) | C-06 |
| 12 | Reescrever a voz dos 22 acontecimentos + pesos nos 43 | F16, F17, C-14, N-01 |

**Resultado esperado:** marcos em ~100% das vidas; nenhum buraco > 1 ano na Linha da Vida;
agência dos 30 aos 59 subindo de 3,1 para ~10 decisões.

---

### Fase 3 — Plausibilidade como sistema

| # | Item | Refs |
| --- | --- | --- |
| 13 | `plausibilitySystem` (possível × legal × provável) | D-1 |
| 14 | Licenças profissionais (OAB, CRM, CREA, concurso) | K-03 |
| 15 | Extrair comandos de `useGame.ts` | D-8, N-06 |
| 16 | Aposentadoria funcionando (INSS) | C-09, F-… |
| 17 | Saúde limitando trabalho e atividade | F12, C-12 |

---

### Fase 4 — Economia que faz sentido

| # | Item | Refs |
| --- | --- | --- |
| 18 | `financialLedger` com origem de cada lançamento | D-3, F-02 |
| 19 | Salário líquido (INSS, IRRF, FGTS, 13º) | F-03 |
| 20 | Morar com os pais × sair de casa como transição real | F-04, F-05 |
| 21 | Teto de aumento; recalibrar a curva patrimonial | F6, F-06 |
| 22 | `custoVidaRelativo` aplicado; `classeSocial` com efeito real | F14, F15, X-04 |

**Resultado esperado:** saldo mediano aos 60 caindo de R$ 7,9 mi para uma faixa plausível
(ordem de R$ 200–600 mil para uma trajetória de classe média).

---

### Fase 5 — Relacionamentos com tempo

| # | Item | Refs |
| --- | --- | --- |
| 23 | Estágios de relacionamento com tempo mínimo | D-4 |
| 24 | Gestação como evento agendado | D-2, D-4 |
| 25 | Término, divórcio, desgaste por ausência | R-09 |
| 26 | Compatibilidade por personalidade | X-05, P-03 |
| 27 | Romance adolescente | R-08 |

---

### Fase 6 — Identidade: Brasil e lugar

| # | Item | Refs |
| --- | --- | --- |
| 28 | `PerfilDeCidade` (~8 arquétipos) | D-5 |
| 29 | Oferta de curso e mercado de trabalho por perfil de cidade | D-5, X-03 |
| 30 | Mobilidade: mudar de cidade como decisão | D-5 |
| 31 | ENEM/SISU/ProUni/FIES/cotas; CLT × informal × MEI × servidor; SUS × plano | D-7 |

---

### Fase 7 — Avatar e polimento

| # | Item | Refs |
| --- | --- | --- |
| 32 | `genero` no renderer; filtrar barba no editor | D-6, A-01, A-02 |
| 33 | Traços por faixa etária (bebê deixa de ser adulto reduzido) | D-6, A-03 |
| 34 | Semente de variação individual | D-6, A-04 |
| 35 | Validação de plausibilidade no save; semente do ano persistida | F20, F21 |
| 36 | Filtros e marcadores de fase na Linha da Vida | T-02, T-03 |

---

## 27. Matriz MANTER / REFINAR / REFAZER / REMOVER

Classificação por **fundação aproveitável**, não por quantidade de bugs — conforme a instrução
explícita de não classificar como REFAZER por causa de um bug isolado.

### Sistemas

| Sistema | Veredito | Justificativa |
| --- | --- | --- |
| `personalitySystem` | **MANTER** | Emergente, taxonomia enxuta, memória estruturada, sem vazamento para a timeline. Falta ser *consultado*, não ser corrigido. |
| `interactionCapabilitySystem` | **MANTER** | Regra única de capacidade por idade, revalidada pelo motor. Exemplar. |
| `deathSystem` | **MANTER** | Longevidade mediana 71 validada em 105 vidas. |
| `attributeSystem` | **MANTER** | `calcularResiliencia` (0,55–1,6) validada empiricamente. |
| `events/repetitionPolicy` | **MANTER** | Política tipada + cooldown padrão. Sólido. |
| `events/nature` · `happenings` · `narrativeVariants` | **MANTER** | A distinção acontecimento × decisão é a melhor ideia recente. A mecânica está certa; o *texto* é que precisa acompanhar. |
| `availabilitySystem` | **REFINAR** | Política única correta. Precisa cobrir 2 ações que faltam e delegar plausibilidade à camada nova. |
| `educationSystem` | **REFINAR** | Estrutura certa; off-by-one, vestibular infinito, zero evasão, níveis órfãos. |
| `economySystem` | **REFINAR** | Estabilizador de dívida é bom design. Falta ledger, tributo, dependência, custo de vida local. |
| `familySystem` | **REFINAR** | `FamilyMember` é modelo suficiente. Corrigir natalidade, nomes e uso de `classeSocial`. |
| `pacing/lifeRhythm` | **REFINAR** | Conceito correto, 4 forças certas. Inverter a ordem de decisão e recalibrar. Não jogar fora. |
| `saveSystem` | **REFINAR** | Migração defensiva é boa. Falta validação de plausibilidade e semente persistida. |
| `careerSystem` | **REFAZER as regras** | Catálogo e estrutura MANTIDOS. Contratação, promoção, aumento e aposentadoria refeitos. |
| `relationshipSystem` | **REFAZER o modelo** | Parceiro instantâneo em 85 e filho instantâneo não são calibráveis: o modelo não tem tempo. |
| Localização | **REFAZER como sistema** | Hoje não existe como sistema: é rótulo. Catálogo de 91 municípios PRESERVADO. |
| Brasil como regra | **REFAZER (criar)** | Existe como vocabulário, não como sistema. Vocabulário PRESERVADO integralmente. |
| `eventSystem` | **REFINAR** | Bom, exceto os defaults de `adicionarFamiliar`. |
| Avatar (`presentation/avatar`) | **REFINAR** | Geometria é base sólida. Faltam gênero, traços por faixa, variação individual. |
| Linha da Vida (`timelinePresentation`) | **REFINAR** | Bom modelo. Falta registrar ano tranquilo, filtros e rótulo correto. |
| Responsividade | **MANTER** | 716/716 verdes; a lacuna é de *método de teste*, não de layout comprovado. |
| `useGame.ts` | **REFAZER a orquestração** | 980 linhas concentram a costura. Extrair comandos; o conteúdo lógico é aproveitável. |

### Peças novas

| Peça | Status | Resolve |
| --- | --- | --- |
| `plausibilitySystem` | **CRIAR** | C-01, C-02, C-11, K-03, K-08 |
| `lifeCalendar` | **CRIAR** | C-05, C-06, T-01, X-07, N-08 |
| `financialLedger` | **CRIAR** | F-02, F-06, C-10 |
| `healthSystem` (crônico) | **CRIAR** | C-12, N-04 |
| `locationSystem` (perfis) | **CRIAR** | X-03, F-07, seção 13 |
| `systems/commands/` | **CRIAR** | N-06, X-10 |

### Remoções pontuais

| O quê | Motivo |
| --- | --- |
| Default `'Novo Familiar'` / `tipo: 'pet'` | 2.281 NPCs sem nome |
| Flag `'aposentado_inss'` como está | Ninguém lê |
| `OU` em `pedirAumento` | Aumento quase automático |
| Tolerância `+15` de inteligência | Anula requisito declarado |
| `return` antecipado do menor em `economySystem` | Zero despesa, 100% do salário |
| Cursos de 3 semestres no modelo atual | Formam em 1 ano |
| Rótulo "Escolha" para acontecimento | Contradiz o que o jogador fez |
| `scripts/audit/*` (ao fim do ciclo) | Ferramenta de diagnóstico |

---

## Encerramento

A auditoria está concluída. Nenhuma correção foi implementada, conforme a instrução.

**Entregues:**

- Este relatório — 27 seções, ~70 problemas classificados por gravidade e natureza.
- Métricas empíricas de 105 vidas completas simuladas pelo pipeline real.
- 10 reproduções mínimas determinísticas, cada uma isolando uma causa.
- Casos reproduzíveis por seed, com biografias completas em `/tmp/vida-auditoria/`.
- Harness de auditoria em `scripts/audit/` com `README.md`, reexecutável a qualquer momento.
- Ordem de correção em 8 fases, cada uma entregável e verificável.

**O achado que resume tudo:** o VIDA tem sistemas bem construídos que **não conversam entre si**, e
tem dados corretos que **ninguém lê**. A fundação é boa. O que falta são as três peças que nunca
foram construídas — **plausibilidade, calendário e razão** — e a disciplina de não deixar nenhum
campo de tipo sem consumidor.

O próximo passo é a decisão do responsável pelo produto sobre o escopo e a ordem das fases.
Nada além desta auditoria deve ser implementado sem essa aprovação.
