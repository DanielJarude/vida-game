# PROPOSTA — FASE 3: Calendário da Vida e Pacing

> **Documento de projeto. Nenhuma linha de produção foi alterada.**
> Base: commit `edf95d5` (Fase 2). Fases 1 e 2 são fundação e serão consumidas, não reinventadas.
> Todos os números deste documento foram **medidos agora**, no código real, com as mesmas 105 vidas
> do harness das Fases 1 e 2 (`scripts/audit/pacing.ts`, `scripts/audit/catalogo.ts`).

---

## 1. Diagnóstico estrutural

### 1.1 A frase do playtest, traduzida em mecânica

> "Antes tudo era escolha. Agora quase nada é escolha."

As duas metades dessa frase têm causas **diferentes**, e é por isso que mexer na porcentagem de eventos
não resolveria nenhuma das duas.

A primeira metade (`tudo era escolha`) já foi atacada no B4-FIX4: a camada de ritmo
(`systems/pacing/lifeRhythm`) passou a decidir *o que o ano merece* antes de sortear conteúdo, e o
catálogo ganhou `natureza: 'acontecimento' | 'decisao'`. Isso funcionou. Hoje a razão medida é
**1,63 acontecimento para cada 1 decisão**, e nenhuma faixa etária passa de 18,7% de anos com decisão.
O jogo parou de ser um questionário.

A segunda metade (`quase nada é escolha`) **não foi causada pelo ritmo**. Foi causada por um efeito
colateral que ninguém projetou, e que a medição de hoje isolou com precisão.

### 1.2 A causa raiz: a folha de pagamento silencia a vida adulta

`agingSystem.ts:218` calcula a densidade estrutural do ano assim:

```ts
const densidadeEstrutural = novosLogs.filter(
  log => !CATEGORIAS_NAO_ESTRUTURAIS.has(log.categoria)   // exclui só 'geral' e 'cotidiano'
).length;
```

E `lifeRhythm.ts` aplica uma **regra dura, não probabilística**:

```ts
if (ctx.densidadeEstrutural >= SATURACAO_ESTRUTURAL /* 2 */) {
  return { pulso: 'silencio', motivo: 'ano saturado' };   // nada é sorteado. Nada.
}
```

A intenção era boa e continua certa: um ano que já entregou *"você se formou"* e *"você foi
contratado"* não precisa de um modal em cima. O problema é **o que conta como acontecimento
estrutural**.

Medição (105 vidas, 5.900 anos adultos):

| | |
|---|---|
| anos de silêncio no total | 5.363 |
| **dos quais por saturação estrutural** | **2.380 (44,4%)** |
| **dos quais a saturação vem SÓ de `financas` + `carreira`** | **2.123 (89,2%)** |

E quais são os dois textos mais frequentes do jogo inteiro?

```
2384× "O ano dedicado ao bico 'Fazer Entregas de Moto/Bicicleta nos Fins de Semana'..."
1975× "As horas extras deste ano renderam reconhecimento: seu desempenho no t..."
```

Juntos, **4.359 registros** — mais do que todo o resto da Linha da Vida adulta somado. Ambos entram
como categoria `carreira` ou `financas`, ambos contam como densidade estrutural, e **dois deles já
saturam o ano**.

O resultado é uma inversão perfeita de causa e efeito:

> Quanto mais o personagem trabalha, menos vida ele tem.
> Um adulto empregado que faz hora extra e um bico gera 2 logs de rotina por ano,
> atinge a saturação **todo ano**, e o motor nunca mais sorteia nada para ele —
> nem acontecimento, nem decisão — pelo resto da vida.

Isso não é falta de conteúdo adulto: o catálogo tem **55 a 65 eventos elegíveis** em cada faixa
adulta, e só 2 dos 134 eventos nunca aparecem. É um **portão fechado antes do sorteio**. O jogo
adulto não está vazio; está **silenciado pela própria contabilidade**.

Isto responde diretamente ao item 12 do seu pedido ("verificar por que os sistemas existentes não
estão produzindo vida suficiente") com uma resposta que não é "faltam eventos": os sistemas existentes
estão produzindo *demais* — só que produzindo **ruído contábil que o motor lê como biografia**.

### 1.3 A segunda causa: `relevancia` existe e ninguém produz

O tipo `RelevanciaLog = 'marco' | 'normal' | 'textura'` foi criado no B4-FIX4 exatamente para separar
biografia de rotina. Medição de quem realmente o preenche:

| faixa | total de logs | `marco` | `textura` | sem rótulo |
|---|---|---|---|---|
| 0-2 | 170 | 0 | **0** | 170 |
| 6-11 | 638 | 0 | **0** | 638 |
| 18-29 | 2.011 | 158 | **0** | 1.853 |
| 30-44 | 2.434 | 29 | **0** | 2.405 |
| 60+ | 2.258 | 3 | **0** | 2.255 |

**`'textura'` nunca é emitido por ninguém, em nenhuma faixa, em 105 vidas.** Os únicos produtores de
`relevancia` são `agingSystem` (acontecimentos → `'normal'`) e `economySystem` (4 pontos). Educação,
carreira, família e relacionamento — os maiores produtores de log do jogo — **não classificam nada**.

É o mesmo padrão diagnosticado na auditoria original e nas Fases 1 e 2: **um campo declarado no tipo,
lido pelo consumidor, e nunca preenchido pelo produtor**. Enquanto o bico de entregas não se declarar
`textura`, ele continuará contando como marco de vida para todos os efeitos do motor.

### 1.4 A terceira causa: marco é sorteio

`repeticao: 'marco'` é consultado em exatamente um lugar (`repetitionPolicy.ts:79`):

```ts
if (politica.tipo === 'unica' || politica.tipo === 'marco') {
  return !historicoDisparados.includes(evento.id);   // controla REPETIÇÃO
}
```

Controla se pode **repetir**. Não tem absolutamente nenhuma influência sobre se vai **ocorrer**.
Depois disso, *A Primeira Palavra* entra no mesmo saco ponderado que *Música Alta na Cozinha*.

Para ocorrer, ela precisa que **tudo** isto aconteça dentro de uma janela de 2 anos (1-2):

1. o ano não ser silêncio (35,7% dos anos de 0-2 são);
2. o pulso ser `acontecimento` (é 100% nessa faixa, ok);
3. ela ganhar o sorteio ponderado contra os outros 8 eventos elegíveis da faixa;
4. e o desfecho sorteado ser viável.

Resultado medido: **A Primeira Palavra ocorre em 18/105 vidas (17%). Primeiros Passos, em 14/105 (13%)**.

> **83% dos jogadores nunca verão o próprio filho falar pela primeira vez.**
> Não porque o jogo decidiu que naquela vida não houve — mas porque o dado caiu em *Música Alta na Cozinha*.

Isso é conceitualmente errado, e é o caso-canário do item 3.

### 1.5 A quarta causa: autonomia na infância é um deserto de atividades

O item 13 pede que o jogador tenha agência por **atividade** mesmo em ano sem evento. Medição de
`ATIVIDADES_DISPONIVEIS` por idade:

| idade | 1 | 4 | 8 | 13 | 16 | 20+ |
|---|---|---|---|---|---|---|
| atividades disponíveis | 2/12 | 2/12 | **2/12** | 6/12 | 10/12 | 12/12 |

Dos 0 aos 11 anos — 12 anos de vida, 840 anos-jogador na amostra — existem **2 atividades**. A criança
não tem evento garantido, não tem decisão (fatia 0-30%) e não tem atividade. O item 7 ("chegar aos 18
com zero decisões reconhecíveis deve ser raro") mede hoje: **4/105 vidas chegam aos 18 com zero
decisões, e 66/105 com duas ou menos**. Mediana de decisões até os 18: **2**.

---

## 2. Métricas atuais por faixa etária

Medido em `scripts/audit/pacing.ts`, 105 vidas, mesmos seeds das Fases 1 e 2.

| faixa | anos | % ano c/ decisão | % ano c/ acontecimento | % pulso silêncio | **% ano sem NENHUMA linha** | logs/ano | % ano c/ ação voluntária |
|---|---|---|---|---|---|---|---|
| 0-2   | 210 | 0,0% | **64,3%** | 35,7% | 26,7% | 0,81 | 40,5% |
| 3-5   | 315 | 6,7% | 38,1% | 55,2% | **41,6%** | 0,64 | 36,5% |
| 6-11  | 630 | 12,2% | 26,7% | 61,1% | 22,5% | 1,01 | 66,3% |
| 12-14 | 315 | 18,7% | 22,9% | 58,4% | 13,3% | 1,23 | 67,6% |
| 15-17 | 315 | 17,1% | 24,8% | 58,1% | 17,1% | 1,08 | 68,9% |
| 18-29 | 1.260 | 12,9% | 15,5% | 71,7% | 10,1% | 1,60 | 86,7% |
| 30-44 | 1.575 | 10,8% | **13,1%** | **76,1%** | 14,9% | 1,55 | 88,3% |
| 45-59 | 1.550 | 12,3% | 14,5% | 73,3% | 12,7% | 1,54 | 88,1% |
| 60+   | 1.515 | 10,0% | 15,8% | 74,2% | 13,9% | 1,49 | 87,8% |

**Saturação por faixa** (a métrica que explica a coluna "silêncio"):

| faixa | 0-2 | 3-5 | 6-11 | 12-14 | 15-17 | 18-29 | 30-44 | 45-59 | 60+ |
|---|---|---|---|---|---|---|---|---|---|
| % dos anos mortos por saturação | 0,0% | 0,0% | 4,3% | 17,8% | 4,8% | **40,8%** | **41,3%** | **40,2%** | 32,6% |

A saturação salta de ~5% para ~41% exatamente aos 18 anos — quando o personagem começa a trabalhar.

**Composição da Linha da Vida** (top categorias por faixa):

| faixa | composição |
|---|---|
| 0-2 | geral 102 · familia 41 · amizade 17 |
| 6-11 | **escola 379** · familia 95 · evento 75 |
| 18-29 | **financas 703 · carreira 595** · escola 403 · evento 155 |
| 30-44 | **carreira 755 · financas 713** · escola 547 · evento 162 · familia 130 |
| 60+ | **financas 585** · escola 529 · carreira 425 · familia 300 |

**28,0% dos anos adultos** (1.652 de 5.900) têm uma Linha da Vida composta **exclusivamente** por
finanças e carreira rotineiras.

**Decisões por vida**

| | mín | mediana | média | p90 | máx |
|---|---|---|---|---|---|
| até os 18 | 0 | **2** | 2,2 | 3 | 4 |
| depois dos 18 | 0 | 6 | 6,2 | 10 | 13 |
| vida toda | 2 | 8 | 8,4 | 13 | 15 |
| acontecimentos (vida toda) | 5 | 13 | 13,7 | 20 | 25 |

- vidas que chegam aos 18 com **zero** decisões: **4/105**
- vidas com ≤ 2 decisões até os 18: **66/105**
- razão acontecimento:decisão: **1,63 : 1**

**Silêncio na Linha da Vida** (anos consecutivos sem nenhuma entrada)

| | |
|---|---|
| sequências observadas | 888 · mediana 1 · p90 2 · máx 5 |
| maior sequência por vida | mediana 2 · p90 4 · máx **5** |
| maior sequência por vida, só 18+ | mediana 1 · p90 3 · máx 5 |
| vidas com ≥5 anos mudos seguidos | 3/105 |
| vidas com ≥8 anos mudos seguidos | **0/105** |
| anos adultos completamente vazios | **12,9%** |

> **Correção honesta de uma premissa do briefing.** O playtest relatou a sequência `1 → 3 → 6`, e o
> item 10 pede que buracos enormes acabem. Hoje, **medido**, o buraco máximo em 105 vidas é de **5 anos**
> e nenhuma vida tem 8+. O relato do playtest é anterior ao B4-FIX4 ou vem de uma vida atípica.
> O problema real da Linha da Vida **não é o buraco** — é o **recheio**: 28% dos anos adultos são
> só contracheque. Não vou propor meta para um problema que a medição não confirma.

**Catálogo**: 134 eventos · 73 acontecimentos / 61 decisões · **132 vistos, 2 nunca vistos**
(`hob_banda_garagem`, que exige a flag `sabe_tocar_violao`, e `lat_tempo_que_sobra`, que exige
`empregado: false` aos 60+ — nenhum dos dois é bug de sorteio, são condições que raramente se formam).
Não há problema de cobertura de catálogo.

---

## 3. A inversão de agência, explicada

A auditoria original registrou: infância 39,8% dos anos com acontecimento; 40-49 com 76,7% silenciosos.
A medição de hoje confirma o formato e melhora um pouco os números: **0-2 com 64,3% de acontecimento
contra 30-44 com 13,1%**.

A explicação completa tem três camadas empilhadas, e só a terceira é a decisiva:

1. **Por desenho** (`PERFIS` em `lifeRhythm.ts`): `bebe` tem densidade base 0,50 e `adulto` 0,45. Uma
   diferença pequena e deliberada — a rotina de um adulto de 45 anos empregado é, honestamente,
   rotina. Isso está **certo** e não pretendo mexer.
2. **Por fadiga e teto**: corretos, e também não pretendo mexer.
3. **Por saturação** (a decisiva): 0% dos anos de 0-5 morrem por saturação; **41% dos anos adultos
   morrem**. O bebê não tem emprego, não tem bico, não tem hora extra e não paga conta — então nada
   nunca satura o ano dele, e o motor sempre tem espaço para dar vida a ele. O adulto tem tudo isso,
   e por isso o motor nunca tem espaço.

A inversão da agência **não foi projetada**. Ela é o subproduto de tratar "o salário caiu" como
acontecimento de vida. O item 6 pede que a vida adulta ganhe complexidade sistêmica, não mais popups —
e a medição mostra que ela já **tem** a complexidade sistêmica; o que ela não tem é o direito de
respirar entre um contracheque e outro.

---

## 4. Taxonomia definitiva

Sete conceitos. Hoje o jogo tem **dois** (`NaturezaEvento = 'decisao' | 'acontecimento'`) e mistura
os outros cinco dentro deles.

| conceito | definição operacional | o jogador... | mexe personalidade? | abre modal? | entra na Linha da Vida? |
|---|---|---|---|---|---|
| **ACONTECIMENTO** | a vida acontece com a pessoa; o motor resolve e narra | lê | **nunca** | não | sim, `normal` |
| **DECISÃO CONTEXTUAL** | aconteceu algo e há posicionamento genuíno a tomar | escolhe | sim | sim | sim, `normal` |
| **ESCOLHA-CHAVE / MARCO** | momento de identidade ou trajetória | escolhe (ou só testemunha) | sim, se escolheu | sim, se houver escolha | sim, **`marco`** |
| **ATIVIDADE** | o jogador decide voluntariamente fazer algo | inicia | sim (é escolha) | não (é aba) | sim, `normal`/`textura` |
| **DESAFIO DE VIDA** | já decidiu tentar; precisa passar por um processo | tenta | sim | *(fase futura)* | sim, `marco` no resultado |
| **PEQUENA MEMÓRIA** | contexto cotidiano real do estado da pessoa | lê, se quiser | **nunca** | **nunca** | sim, **`textura`** |
| **EVENTO AGENDADO** | consequência anterior marcou algo para um instante futuro | — (mecanismo) | — | conforme o que dispara | conforme o que dispara |

Duas distinções que o briefing pede explicitamente e que o modelo precisa sustentar:

- **MARCO ≠ EVENTO ALEATÓRIO.** Um marco é escolhido pelo *calendário* (por janela e condição); um
  evento aleatório é escolhido pelo *dado*. São caminhos de código diferentes, não um flag no mesmo
  caminho. É por isso que `repeticao: 'marco'` falhou: ele é um flag no caminho do dado.
- **ELEGIBILIDADE ≠ SUCESSO** (herdado e preservado da Fase 1). O calendário responde "isto vai
  acontecer / pode ser tentado". Nunca "deu certo".

### 4.1 Cinco modos de ocorrência

O item 2 pede que nem todo marco seja obrigatório. Traduzo isso em cinco modos declarativos:

| modo | semântica | pode não ocorrer? |
|---|---|---|
| `garantido` | ocorre se as condições básicas existirem | não, salvo condição ausente |
| `provavel_em_janela` | ocorre dentro da janela salvo exceção coerente (ex.: morte, doença incapacitante) | raramente, e com motivo |
| `condicional` | só existe se a trajetória criou a condição | sim, por ausência da condição |
| `agendado` | consequência anterior marcou-o para um instante futuro | não, salvo cancelamento explícito |
| `aleatorio` | o comportamento atual — pode simplesmente nunca ocorrer | sim, livremente |

Todo o catálogo de hoje é `aleatorio`. **Nenhum evento muda de modo sem classificação explícita**
(§13) — ausência continua significando `aleatorio`, que é o comportamento atual.

---

## 5. Modelo do Calendário da Vida

### 5.1 O que ele é — e o que ele explicitamente não é

O risco que o item 4 nomeia ("God System") é real e é a razão de este ser o desenho mais conservador
que resolve o problema. O Calendário **não executa nada**. Ele não conhece educação, carreira,
família ou economia. Ele não aplica consequência, não escreve log, não decide desfecho.

> O Calendário é um **índice temporal de compromissos**: dado um instante, ele responde *o que está
> vencido, o que entrou em janela e o que está agendado*. Quem resolve cada item é o sistema dono dele.

Três funções puras, uma estrutura de dados persistida, zero orquestração.

### 5.2 Camadas

```
       systems/tempo/*              (FASE 2 — intocada)
       instante · registroTemporal · matricula
                    ↑
       systems/calendario/          (NOVO — puro, sem imports de systems/*)
       tipos.ts      compromisso agendado, janela, modo de ocorrência
       calendario.ts agendar / consultar / marcar cumprido / expirar
       janelas.ts    janela entrou? venceu? quanto resta?
                    ↑
       data/calendario/marcosDeVida.ts   (NOVO — declarativo)
       quais marcos existem, janela, modo, condição, id do conteúdo
                    ↑
       systems/pacing/lifeRhythm.ts (MODIFICADO — passa a distinguir densidade
                                     BIOGRÁFICA de densidade de ROTINA)
       systems/agingSystem.ts       (MODIFICADO — consulta o calendário ANTES
                                     do ritmo; marco vencido não é sorteado)
```

Direção de dependência única, mesma disciplina das Fases 1 e 2: `calendario/` **não importa nada de
`systems/`** exceto `systems/tempo/`. Se um dia importar, o ciclo voltou. (Essa regra foi o que
quebrou o ciclo `availabilitySystem ↔ elegibilidadeProfissional` na Fase 1 — vale um teste de
arquitetura, como lá.)

### 5.3 A ordem nova da passagem de ano

```
1-7.  (inalterado: idade, atributos, educação, carreira, família, economia, mortalidade)
8.    CALENDÁRIO: há compromisso agendado vencendo neste instante?     ← NOVO
        sim → o sistema dono resolve. Não passa pelo dado. Não passa pelo ritmo.
9.    CALENDÁRIO: há marco garantido/provável cuja janela está aberta
      e cuja condição está satisfeita?                                 ← NOVO
        sim → ocorre. Se tiver escolha-chave, sobe para a interface.
10.   RITMO: o que sobrou do ano merece silêncio, acontecimento ou decisão?
        (inalterado, exceto pela correção da densidade — §6 abaixo)
11.   PEQUENA MEMÓRIA: se o ano ficou sem nenhuma linha, o estado atual
      da pessoa rende uma observação verdadeira?                       ← NOVO
```

O ponto crítico: **os passos 8 e 9 vêm ANTES do passo 10 e não consultam aleatoriedade.** É o que
responde ao item 4 ("quais acontecimentos NÃO podem ser descartados por RNG") de forma estrutural, e
não por peso alto no sorteio. A Fase 2 fez o mesmo movimento com o vestibular: em vez de dificultar o
re-roll, tirou-o do caminho do dado.

### 5.4 Por que não é um God System

- não decide **nada** sobre conteúdo — devolve ids e deixa o dono resolver;
- não tem estado próprio além da lista persistida de compromissos;
- é consultado, nunca consulta;
- os dados vivem em `data/calendario/`, declarativos, não em código;
- cabe em ~150 linhas de função pura + uma tabela de dados.

---

## 6. Representação de eventos agendados

Uma estrutura genérica, deliberadamente burra, capaz de sustentar as cadeias do item 5 sem que
nenhuma delas seja implementada agora:

```ts
export interface CompromissoAgendado {
  readonly id: string;                 // id único desta instância agendada
  readonly tipo: string;               // 'nascimento' | 'prova' | 'retorno_medico' | ...
  readonly alvoId?: string;            // a que se refere (cursoId, jobId, npcId...)
  readonly agendadoEm: InstanteDaVida; // quando foi criado  (Fase 2)
  readonly venceEm: InstanteDaVida;    // quando deve ser resolvido (Fase 2)
  readonly expiraEm?: InstanteDaVida;  // até quando ainda vale, se perdido
  readonly dados?: Readonly<Record<string, string | number | boolean>>;
  readonly cumpridoEm?: InstanteDaVida;
}
```

O `tipo` é uma string livre **de propósito**: o calendário não precisa conhecer a semântica de
`'nascimento'`. Ele devolve os compromissos vencidos; quem sabe o que fazer com um nascimento é o
`familySystem`. É o mesmo padrão de `chaveProcessoSeletivo(jobId)` da Fase 2, que funcionou.

Cadeias do item 5 que isto sustenta **sem nenhuma linha extra de calendário**:

| cadeia | quem agenda | tipo | vence em |
|---|---|---|---|
| gravidez → nascimento | `familySystem` (fase futura) | `nascimento` | +2 semestres |
| inscrição → prova | `career/processoSeletivo` (fase futura) | `prova` | +1 semestre |
| curso → conclusão | **já resolvido pela Fase 2** (`Matricula`) | — | — |
| mudança planejada → efetivada | fase de localização | `mudanca` | variável |
| tratamento → retorno | fase de saúde | `retorno_medico` | +1..2 sem. |
| parcelamento → pagamentos | fase de economia | `parcela` | recorrente |

Note que **curso → conclusão já está feito** e não deve ser migrado para cá: `Matricula` é uma
representação melhor (início + duração + progresso) do que um compromisso pontual. O calendário
resolve o que a `Matricula` não resolve: eventos **pontuais** futuros.

---

## 7. Representação de janelas

```ts
export type ModoDeOcorrencia =
  | 'garantido' | 'provavel_em_janela' | 'condicional' | 'agendado' | 'aleatorio';

export interface JanelaDeVida {
  readonly idadeMinima: number;
  readonly idadeMaxima: number;
  /** Idade típica, usada para distribuir marcos e não amontoá-los no 1º ano da janela. */
  readonly idadeTipica?: number;
}

export interface MarcoDeVida {
  readonly id: string;
  readonly conteudoId: string;      // id do GameEvent que dá voz ao marco
  readonly janela: JanelaDeVida;
  readonly modo: ModoDeOcorrencia;
  /** Condição estrutural, declarativa. Reusa `GameEvent['condicoes']`. */
  readonly condicao?: GameEvent['condicoes'];
  /** Marco pode ter escolha-chave (jogador participa) ou ser só testemunhado. */
  readonly temEscolhaChave: boolean;
}
```

Estados de uma janela, como funções puras sobre `InstanteDaVida`:

| estado | significado |
|---|---|
| `futura` | ainda não entrou |
| `aberta` | dentro da janela, ainda não ocorreu |
| `vencendo` | último ano da janela — um marco `garantido` **precisa** ocorrer agora |
| `cumprida` | ocorreu |
| `perdida` | janela fechou sem ocorrer (permitido para `provavel_em_janela`, **nunca** para `garantido`) |

`idadeTipica` existe para responder ao item 14 (densidade sem popup): sem ela, todo marco `garantido`
dispararia no primeiro ano da janela e a infância viraria uma parede de marcos aos 1, 6 e 12 anos.

---

## 8. Relação com o tempo da Fase 2

**Consome, não reinventa.** Concretamente:

- `venceEm`, `agendadoEm`, `cumpridoEm` são `InstanteDaVida` — o inteiro de semestres ancorado na
  idade criado na Fase 2. Sem novo tipo de tempo.
- "a janela já passou?" é `antesDe()`; "quanto falta?" é `semestresEntre()`. Sem nova aritmética.
- O item 12 do briefing anterior (Linha da Vida ordenando dois acontecimentos do mesmo ano)
  **já está resolvido**: o instante tem resolução de semestre, então um marco do 1º semestre ordena
  antes de um do 2º.
- **O semestre continua sendo precisão interna, nunca cadência de clique.** Um marco pode vencer no
  2º semestre; o jogador percebe isso como "aconteceu naquele ano", exatamente como a conclusão dos
  cursos de 1,5 ano da Fase 2. A decisão nº 1 da Fase 2 ("tempo interno ≠ tempo visual") continua
  valendo sem exceção.
- `registroTemporal` (consumo carimbado) e `CompromissoAgendado` são **coisas diferentes e não se
  fundem**: o primeiro responde *"já fiz isso neste período?"* (passado), o segundo *"o que me espera?"*
  (futuro). Fundi-los seria o começo do God System.

---

## 9. Relação com `personalitySystem`

**O sistema está estruturalmente saudável e não será tocado.** Verifiquei o que o item 9 teme:

```
acontecimentos com impactosComportamentais: []   ← zero, em 73 acontecimentos
```

A regra dura do B4-FIX4 (`desfechoSemMarcaDeEscolha`, `happenings.ts`) funciona: nenhum acontecimento
atribui traço. O motor **não** decidiu que a criança foi corajosa e cobrou isso do jogador.

O problema real está nos **produtores**, exatamente como você previu — mas é de **redação**, não de
mecânica. 27 dos 73 acontecimentos têm opções redigidas como deliberação do jogador:

```
inf_primeiros_passos   · "Preferir continuar engatinhando no seu ritmo"
bb_estranhamento_visita · "Chorar e virar o rosto procurando o colo conhecido"
fam_visita_avo         · "Ficar no celular enquanto eles conversam"
```

Mecanicamente, isso é inofensivo hoje — o desfecho é sorteado por peso e a marca de escolha é
removida. Narrativamente, é **exatamente o defeito do item 8**: o jogo diz ao jogador que ele
*preferiu* algo que ele não escolheu. Um acontecimento genuíno se descreve pelo que **houve**
("O espelho não te prendeu por muito tempo"), não pelo que se *preferiu*.

Três consequências para o desenho:

1. Acontecimentos continuam **proibidos** de mover personalidade. Nada muda aí.
2. Marcos **com** escolha-chave movem personalidade — o jogador escolheu de fato.
3. **Pequenas memórias nunca movem personalidade**, nem stats, nem nada. São descrição pura. É a
   única forma de adicionar densidade sem inflacionar o personagem.

---

## 10. Relação com a Linha da Vida

Sem rework de componente. A hierarquia de registros que o item 10 pede **já existe no tipo** e só
precisa ser **preenchida pelos produtores** e respeitada por um consumidor:

| relevância | quem emite | aparece na Linha | entra no resumo do ano | abre modal |
|---|---|---|---|---|
| `marco` | calendário, formatura, morte, nascimento, casamento | sim, com ênfase | sim | às vezes |
| `normal` | acontecimentos, decisões, mudanças estruturais reais | sim | sim | conforme natureza |
| **`textura`** | rotina de trabalho, bico, hora extra, postura escolar, **pequenas memórias** | sim, discreta | **não** | **nunca** |

`construirResumoAnual` (`outcomePresentation.ts:164`) **já** filtra `'textura'` corretamente e cai na
heurística antiga quando o campo falta. Ou seja: o consumidor está pronto há uma fase inteira. Basta
os produtores classificarem.

Isso resolve dois problemas de uma vez e sem tocar em React:

- O bico de entregas some do resumo anual (deixa de ser "notícia") mas **permanece na Linha da Vida**
  (a pessoa de fato passou o ano fazendo entregas — apagar seria mentir).
- O ano deixa de ser saturado por ele (§11), e volta a caber vida dentro dele.

---

## 11. Estratégia para a vida adulta

Quatro movimentos, em ordem de impacto medido. **Nenhum deles adiciona evento novo.**

### 11.1 Densidade biográfica ≠ densidade de rotina (o movimento decisivo)

`agingSystem` conta densidade por categoria. Passa a contar por **relevância**:

```ts
// hoje: qualquer log que não seja 'geral'/'cotidiano' satura o ano
const densidadeEstrutural = novosLogs.filter(l => !NAO_ESTRUTURAIS.has(l.categoria)).length;

// proposto: só o que é biografia ocupa o ano
const densidadeEstrutural = novosLogs.filter(l => ehBiografico(l)).length;
// ehBiografico: relevancia === 'marco' | 'normal'; 'textura' nunca ocupa o ano.
// Sem relevancia declarada → mantém a heurística atual (compatibilidade de save).
```

Combinado com a classificação de `trabalharMais`, `escolherBico` e `definirPosturaEscolar` como
`textura`, isto ataca **89,2% de toda a saturação medida** — 2.123 dos 2.380 anos mortos. Um único
ponto, uma regra declarativa, nenhum `if` por profissão.

**O que a rotina perde:** nada. Ela continua acontecendo, continua pagando, continua na Linha da Vida.
Ela só para de ser confundida com biografia.

### 11.2 Marco de vida adulta vindo dos sistemas existentes

O item 12 pede vida adulta a partir do que já existe. Os sistemas já produzem os fatos — o que falta
é que os fatos **certos** se declarem `marco` em vez de se perderem entre 1.500 linhas de contracheque.
Candidatos que **já são emitidos hoje** e só precisam de rótulo:

primeiro emprego · promoção · demissão · formatura (já é) · quitação de dívida (já é `marco`) ·
compra do primeiro imóvel (já é) · casamento · nascimento de filho · morte de familiar ·
aposentadoria *(não existe — fica para a fase de carreira, ver §21)*.

### 11.3 Pequenas memórias com contexto real (item 11)

Uma camada que produz **no máximo uma** entrada `textura` por ano, **apenas em anos que ficariam sem
nenhuma linha**, e **somente a partir do estado real da pessoa**. Nunca "mais um ano passou
normalmente" — essa frase é exatamente o que o B4-FIX4 removeu e não vai voltar.

A entrada é derivada, não sorteada de uma lista de frases: cidade, emprego, filhos, relacionamento,
saúde, escolaridade, dívida, idade dos pais, hobby ativo. Uma função pura de estado → frase, com
guarda dura: **se o estado não rende nada verdadeiro, não emite nada.** O ano realmente silencioso
continua permitido (item 10).

### 11.4 O que NÃO farei

- não vou subir `densidadeBase` de `adulto` (0,45). O número está certo; o portão é que estava fechado.
- não vou adicionar 100 eventos adultos genéricos (item 17 proíbe, e a medição mostra que o catálogo
  adulto não é o gargalo: 63 eventos elegíveis em 30-44, 132/134 do catálogo já aparecem).
- não vou forçar decisão anual (item 7 proíbe explicitamente).

---

## 12. Estratégia para anos silenciosos

Preservar o silêncio como recurso legítimo e atacar só o vazio **sem contexto**:

1. **ano silencioso** (nenhum modal, nenhuma interrupção) — continua e continuará comum;
2. **ano sem nenhuma linha** — permitido, mas deixa de ser a regra: a pequena memória cobre os casos
   em que o estado da pessoa rende algo verdadeiro;
3. **sequência longa de anos mudos** — hoje o máximo medido é 5 anos e só em 3/105 vidas. Vou **medir**
   antes e depois, mas **não estabelecer meta** para um problema que a medição não confirma (item 16).

Regra de projeto: a pequena memória **nunca** abre modal, **nunca** entra no resumo anual, **nunca**
move atributo. Ela é leitura opcional. É assim que a densidade sobe sem que os cliques subam (item 14).

---

## 13. Plano de auditoria semântica do catálogo

134 eventos, um a um, classificados em um **dado declarativo** — nunca em código, nunca por regex
sobre o título. Saída: `docs/AUDITORIA-CATALOGO-F3.md` + o campo de classificação no próprio catálogo.

Critérios objetivos (nesta ordem; o primeiro que casar decide):

| pergunta | se sim → |
|---|---|
| a janela inteira cai em idade sem autonomia (≤2)? | ACONTECIMENTO (já é regra dura em `nature.ts`) |
| as opções representam **valores, personalidade ou intenção** do jogador? | DECISÃO — **nunca** executar automaticamente |
| o conteúdo define identidade ou trajetória? | MARCO / ESCOLHA-CHAVE |
| as opções são **reações** a algo que já aconteceu? | ACONTECIMENTO |
| o texto do desfecho diz que o jogador *preferiu / decidiu / escolheu* algo que ele não escolheu? | **REESCREVER** |
| é rotina de fundo sem consequência estrutural? | PEQUENA MEMÓRIA (`textura`) |

E a regra que o item 8 exige, dita sem rodeio:

> **Escolher automaticamente uma opção antiga não transforma uma decisão em acontecimento.**
> Se o conteúdo expressa valor ou intenção, ou ele volta a ser decisão, ou o texto é reescrito
> como reação. Não existe terceira saída.

### 13.1 Exemplos reais do catálogo atual

Conteúdo real, verificado no código. Nada inventado.

**Três que devem ser ACONTECIMENTOS** (e já são — a classificação os confirma, que é o resultado
esperado para a maior parte do catálogo):

| id | título | por quê |
|---|---|---|
| `bb_febre_noite` | Febre no Meio da Noite | um bebê de 0-2 não delibera sobre a própria febre; as opções são reações fisiológicas |
| `adm_colega_demitido` | Uma Cadeira Vazia na Segunda-feira | acontece no ambiente, não com o jogador; ele testemunha |
| `lat_perda_da_geracao` | Alguém da Sua Geração Partiu | perda não se escolhe |

**Três que devem ser DECISÕES** (e já são — confirmadas; todas movem personalidade, todas expressam valor):

| id | título | por quê |
|---|---|---|
| `ado_cola_prova` | Gabarito da Prova de Matemática | honestidade sob pressão — 5 opções, valor puro. Jamais pode ser autoexecutada |
| `jov_amigo_emprestimo` | O Amigo que Pede Dinheiro Emprestado | lealdade × autopreservação; condicionado a `dinheiroMinimo: 800` |
| `rnd_carteira_perdida` | Carteira Achada na Rua | produz a flag `pessoa_honesta`, consultada por conteúdo posterior |

**Três que devem ser MARCOS / ESCOLHAS-CHAVE** (hoje são sorteio aleatório — esta é a mudança real):

| id | título | hoje | proposto |
|---|---|---|---|
| `bb_primeira_palavra` | A Primeira Palavra | `acontecimento` + `repeticao: 'marco'`, **ocorre em 17% das vidas** | marco `garantido`, janela 1-2, **com escolha-chave** (§14) |
| `inf_primeiros_passos` | Primeiros Passos | idem, **13%** | marco `garantido`, janela 1-2, com escolha-chave |
| `inf_primeiro_dia_escola` | Primeiro Dia no Ensino Fundamental | `acontecimento` aleatório 6-7 | marco `garantido` — o `educationSystem` **já** matricula todo mundo no Fundamental (105/105 vidas têm o log "ingressou no 1º ano"); o evento que dá voz a esse fato é que depende de sorte |

O terceiro caso é revelador: o **fato** é garantido (100% das vidas), mas a **narrativa** do fato é
aleatória. O calendário fecha exatamente essa lacuna.

**Três semanticamente errados — REESCREVER ou RECLASSIFICAR:**

| id | trecho real | problema | tratamento |
|---|---|---|---|
| `bb_estranhamento_visita` | opção `"Sorrir e esticar os braços de volta"` → *"Você foi no colo sem estranhar nem um pouco"* | o texto da **opção** é uma deliberação de um bebê de 0-1 ano; foi escrito como botão e virou acontecimento sem reescrita | **REESCREVER** os textos de opção como desfechos observados, não como intenções. Mecânica inalterada |
| `crc_primeiro_dia_creche` | opção `"Chorar agarrado até a professora se aproximar com carinho"` → *"Você levou um tempo para se soltar..."* | mesmo defeito, e é o exemplo literal que você citou do playtest | **REESCREVER** como reação. É também candidato a MARCO (`provavel_em_janela`, 3-4) |
| `fam_visita_avo` | opção `"Ficar no celular enquanto eles conversam"` — **62 ocorrências**, o 2º evento mais frequente do jogo | expressa **atitude e valor** (desinteresse pela família) e é escolhida **pelo motor**, sem o jogador. É o caso exato do item 9: o motor decide que a pessoa é distante e isso vira a biografia dela | **RECLASSIFICAR como DECISÃO** — ou, se mantido acontecimento, remover a opção de valor e deixar só desfechos neutros. **Não** pode continuar como está |

O terceiro é o mais grave dos três e o melhor argumento para a auditoria semântica completa: é um
evento de alta frequência em que o motor atribui **desinteresse familiar** a um jogador que nunca
escolheu isso.

---

## 14. "Primeiras palavras" no modelo novo — caso-canário

**Hoje**

```
ano 1 →  ritmo sorteia: 35,7% silêncio  →  fim (nada)
      →  pulso 'acontecimento'
         →  sorteio ponderado entre ~9 eventos elegíveis de 0-2
            →  bb_primeira_palavra (peso 85) concorre com bb_musica_dança (peso ~60)
               →  ganha?  →  desfecho sorteado por peso  →  narra
ano 2 →  mesma coisa, se não ocorreu
RESULTADO MEDIDO: 18/105 vidas (17%).
```

**Proposto**

```
DESENVOLVIMENTO   o calendário observa: janela [1,2] aberta, modo 'garantido',
                  condição básica satisfeita (a criança está viva e sem
                  condição que impeça a fala)
       ↓          → passo 9 da passagem de ano, ANTES do ritmo, SEM dado
MARCO             as primeiras palavras VÃO acontecer. Não é sorteio.
       ↓
ESCOLHA-CHAVE     "qual foi a primeira palavra?" sobe para a interface.
                  Duas opções que JÁ EXISTEM no catálogo:
                    · o nome de quem cuida de você todos os dias
                    · o nome da coisa que você mais queria
       ↓          O jogador participa. É pequeno, é identidade, é memorável.
CONSEQUÊNCIA      entra na Linha da Vida com relevancia: 'marco'.
                  Move personalidade — porque desta vez o jogador escolheu.
                  Fica disponível para conteúdo futuro consultar por id
                  (o mecanismo `escolheuAnteriormente` JÁ EXISTE e já é usado
                  por `inf_bullying_defesa`).
RESULTADO ALVO: ~100% das vidas em que a criança chega viva aos 2 anos.
```

Três coisas que este caso prova sobre a arquitetura, e é por isso que ele é o canário:

1. **Ocorrência e repetição são perguntas diferentes.** `repeticao: 'marco'` responde a segunda e o
   jogo tratava como se respondesse a primeira. O calendário responde a primeira.
2. **Marco e escolha-chave se compõem sem se confundir.** *Que* aconteça é do calendário
   (não-negociável); *qual foi* é do jogador (escolha real, com efeito real).
3. **Nada de conteúdo novo é necessário.** As duas opções já estão escritas em
   `babyEvents.ts:226-243`. O que muda é **quem decide que elas aparecem** — o calendário, não o dado.

E uma contenção, porque marco garantido é poderoso e perigoso: `inf_primeiros_passos` e
`bb_primeira_palavra` compartilham a janela [1,2]. Com ambos garantidos e sem `idadeTipica`, os dois
disparariam no ano 1 e a infância abriria com dois modais seguidos. `idadeTipica` distribui: passos
tipicamente em 1, palavra tipicamente em 2. É um dado, não um `if`.

---

## 15. Alterações de arquitetura previstas

**Novos** (todos puros, todos testáveis isoladamente):

| arquivo | conteúdo | ~linhas |
|---|---|---|
| `src/systems/calendario/tipos.ts` | `CompromissoAgendado`, `JanelaDeVida`, `MarcoDeVida`, `ModoDeOcorrencia`, `EstadoDeJanela` | 120 |
| `src/systems/calendario/janelas.ts` | estado de janela, `entrouNaJanela`, `janelaVencendo`, distribuição por `idadeTipica` | 90 |
| `src/systems/calendario/calendario.ts` | `agendar`, `compromissosVencidos`, `marcarCumprido`, `expirar`, `marcosPendentes` | 160 |
| `src/systems/memorias/pequenaMemoria.ts` | estado → memória de textura; pura; guarda "sem contexto, sem frase" | 140 |
| `src/data/calendario/marcosDeVida.ts` | catálogo declarativo de marcos (janela, modo, condição, `conteudoId`) | 120 |
| `src/data/events/classificacao.ts` | saída da auditoria semântica: id → taxonomia | 150 |

**Modificados** (cirurgicamente):

| arquivo | mudança | risco |
|---|---|---|
| `src/systems/agingSystem.ts` | passos 8, 9 e 11; densidade por relevância | **alto** — é o coração; cercar de teste |
| `src/systems/pacing/lifeRhythm.ts` | `densidadeEstrutural` passa a contar só biografia | médio |
| `src/systems/careerSystem.ts` | logs de bico/hora extra → `relevancia: 'textura'`; primeiro emprego/promoção → `'marco'` | baixo |
| `src/systems/educationSystem.ts` | postura escolar → `'textura'`; formatura → `'marco'` | baixo |
| `src/systems/economySystem.ts` | rotina → `'textura'`; já tem 4 pontos corretos | baixo |
| `src/systems/familySystem.ts` / `relationshipSystem.ts` | nascimento/casamento/morte → `'marco'` | baixo |
| `src/systems/saveSystem.ts` | persistir calendário; versão 5; migração | médio |
| `src/types/index.ts` | `GameState.calendario?`, `TaxonomiaConteudo` | baixo |
| `src/data/events/**` | reescrita semântica dos casos do §13 | baixo (texto) |
| `scripts/audit/*` | métricas novas no harness | nenhum (fora de produção) |

**Não serão tocados:** `personalitySystem` (saudável, §9) · `systems/tempo/*` (Fase 2) ·
`systems/plausibility/*` e `politicaTrabalho` (Fase 1) · `availabilitySystem` ·
`repetitionPolicy` (continua governando repetição; marco garantido não passa por ele) ·
`LifeTimeline`/`TimelineEntry`/`AnnualSummary` (o consumidor de `relevancia` já está pronto).

---

## 16. Testes necessários

Nenhum dos 780 testes atuais pode mudar de expectativa. Se algum quebrar, é regressão — não teste
desatualizado. (Contratos a preservar: `motorGuards.test.ts` L151-161 e
`processarAnoEducacao(educacao, personagem, anoAtual)`.)

**Novos, agrupados por invariante:**

*Calendário*
- A1 marco `garantido` com condição satisfeita ocorre dentro da janela em **100%** das execuções, com
  qualquer semente
- A2 marco `garantido` **nunca** ocorre fora da janela
- A3 marco `condicional` sem a condição **nunca** ocorre
- A4 marco `aleatorio` continua se comportando exatamente como hoje (não-regressão do catálogo)
- A5 dois marcos garantidos na mesma janela **não** disparam no mesmo ano (`idadeTipica`)
- A6 compromisso agendado vence no instante correto, inclusive com meio-ano (reusa Fase 2)
- A7 compromisso vencido é resolvido **antes** do ritmo e **não** consome o sorteio do ano

*Primeiras palavras (canário)*
- B1 ocorre em 100% das vidas que chegam vivas aos 2 anos
- B2 a escolha do jogador é registrada e consultável por `escolheuAnteriormente`
- B3 entra na Linha da Vida com `relevancia: 'marco'`
- B4 não ocorre duas vezes, inclusive após reload

*Densidade e ritmo*
- C1 log `textura` **nunca** satura o ano
- C2 um adulto com bico + hora extra + conta de luz **continua** recebendo acontecimentos
  (é o teste que prova §11.1; falharia hoje)
- C3 dois marcos reais no mesmo ano **continuam** saturando (a regra boa preservada)
- C4 nenhuma faixa passa de `FATIA_MAXIMA_DE_DECISAO` (preservado do B4-FIX4)

*Semântica*
- D1 nenhum acontecimento tem `impactosComportamentais` (hoje passa; vira permanente)
- D2 nenhum acontecimento tem opção classificada como "expressa valor/intenção"
- D3 todo evento do catálogo tem classificação taxonômica explícita
- D4 pequena memória **nunca** produz `impactosComportamentais`, stats ou flags

*Linha da Vida*
- E1 todo produtor de log declara `relevancia` (teste de cobertura por produtor)
- E2 log `textura` não entra no resumo anual mas entra na Linha da Vida
- E3 ano sem nenhuma linha **continua possível** (o silêncio não foi abolido)
- E4 pequena memória só é emitida quando o ano ficaria sem nenhuma linha

*Save*
- F1 save da Fase 2 (versão 4) carrega sem perder nada
- F2 marco cumprido **não** reocorre após reload
- F3 compromisso agendado sobrevive ao reload com o mesmo `venceEm`
- F4 janela **não** reseta no reload
- F5 save legado sem calendário: marcos já vividos **não** disparam retroativamente (§19)

---

## 17. Métricas antes/depois propostas

Mesmas 105 vidas, mesmos seeds. O harness `scripts/audit/pacing.ts` já está escrito e rodando — os
"antes" abaixo são reais, não estimados.

**Alvos com meta** (têm defeito estrutural demonstrado):

| métrica | antes (medido) | alvo | por quê |
|---|---|---|---|
| `bb_primeira_palavra` ocorre | **17%** | **~100%** | marco garantido |
| `inf_primeiros_passos` ocorre | **13%** | **~100%** | marco garantido |
| `inf_primeiro_dia_escola` ocorre | *a medir* | ~100% | fato já é universal |
| anos mortos por saturação (18+) | **~41%** | **< 15%** | rotina deixa de saturar |
| saturação vinda só de finanças/carreira | **89,2%** | **~0%** | é o bug |
| % ano c/ acontecimento, 30-44 | **13,1%** | 25-35% | efeito do desbloqueio |
| anos adultos só com rotina financeira | **28,0%** | **< 10%** | reclassificação |
| logs com `relevancia` declarada | **~2%** | **> 95%** | produtores classificam |
| logs `textura` emitidos | **0** | > 0 em toda faixa | a camada passa a existir |
| vidas que chegam aos 18 com 0 decisões | **4/105** | **0/105** | item 7 |
| vidas com ≤2 decisões até os 18 | **66/105** | < 25/105 | item 7 |

**Observadas sem meta** (item 16 — servem para detectar vazio, excesso e inversão; não para subir número):

| métrica | antes |
|---|---|
| razão acontecimento : decisão | 1,63 : 1 — **deve permanecer > 1,2 e < 3** |
| % ano c/ decisão, por faixa | 0,0 / 6,7 / 12,2 / 18,7 / 17,1 / 12,9 / 10,8 / 12,3 / 10,0 — **nenhuma pode passar de ~25%** |
| decisões na vida toda (mediana) | 8 — **não é para subir muito**; o objetivo é distribuição, não volume |
| maior sequência muda por vida | mediana 2 · máx 5 |
| anos adultos completamente vazios | 12,9% |
| eventos nunca vistos | 2/134 |
| repetição do conteúdo mais frequente | 73× (`ext_macarronada_domingo`) |
| atividades disponíveis por idade | 2/12 até os 8 — **diagnóstico registrado, correção é conteúdo (§21)** |

**Guardas de não-regressão (Fases 1 e 2 — precisam continuar em zero):**
`FORMACAO_RAPIDA_DEMAIS` 0 · `CANDIDATURA_ILIMITADA` 0 · `VESTIBULAR_MULT` 0 · `MULTIPLOS_FILHOS` 0 ·
`EMPREGO_SEM_EXPERIENCIA` 0 · `CARGO_SEM_ESCOLARIDADE` 0 · vidas sem emprego 0/105 ·
mediana do 1º emprego 18 · superior completo 93.

**Coorte adicional de pacing** (item 15): 20 vidas com `idadeMaxima = 25`, para medir a infância e a
adolescência com resolução maior sem esperar 100 anos por vida.

---

## 18. Riscos

| # | risco | probabilidade | impacto | mitigação |
|---|---|---|---|---|
| R1 | **Desbloquear a saturação inunda a vida adulta de eventos.** 2.123 anos silenciosos voltam ao sorteio de uma vez | **alta** | alto | é por isso que o teto de decisões e a fadiga do `lifeRhythm` **não serão tocados**: eles continuam limitando modais. O que volta é majoritariamente `acontecimento`, que não interrompe. Medir a razão acontecimento:decisão antes/depois; se decisão passar de 25% em qualquer faixa, é regressão |
| R2 | Marco garantido vira parede de modais na infância | média | alto | `idadeTipica` + teste A5 + só marcos de fato estruturais entram como `garantido` |
| R3 | Pequena memória vira "mais um ano passou normalmente" | média | alto | guarda dura: sem contexto verdadeiro no estado, **não emite**. Teste D4/E4. Derivada de estado, nunca de lista de frases |
| R4 | `agingSystem` vira o God System pela porta dos fundos | média | alto | o calendário devolve ids; quem resolve é o dono. Teste de arquitetura: `calendario/` não importa `systems/*` exceto `tempo/` |
| R5 | Reclassificar `fam_visita_avo` como decisão sobe a contagem de decisões (é o 2º evento mais frequente, 62×) | **alta** | médio | medir. Se subir demais, a saída é remover a opção de valor e manter acontecimento — não é remover o evento |
| R6 | Reescrita semântica muda o sentido de conteúdo que o jogador já viu em saves | baixa | baixo | só textos de opção/desfecho; ids, pesos e consequências intactos. Logs já gravados na Linha da Vida não são reescritos retroativamente |
| R7 | Save legado dispara marcos retroativamente (um personagem de 40 anos "dá os primeiros passos") | média | **crítico** | §19: migração marca como cumprido todo marco cuja janela já passou. Teste F5 |
| R8 | 780 testes quebram por mudança de densidade | média | médio | rodar a suíte a cada passo; teste que quebrar é investigado como regressão, nunca "atualizado" |
| R9 | Otimizar cegamente para as metas do §17 | média | alto | as metas com número são só as que têm defeito estrutural provado. As demais são observadas. Item 16 |

---

## 19. Compatibilidade de save

Versão 4 → **5**. Todos os campos novos opcionais, defaults conservadores, mesma disciplina das
Fases 1 e 2.

```ts
// GameState
calendario?: {
  compromissos: CompromissoAgendado[];
  marcosCumpridos: Record<string, InstanteDaVida>;  // marcoId → quando
};
```

Regras de migração, cada uma respondendo a um item do §20 do briefing:

| situação | tratamento |
|---|---|
| save sem `calendario` | cria vazio. Nenhum compromisso pendente (nada foi agendado antes desta fase — é verdade, não conveniência) |
| **marco cujo a janela já passou** | **marcado como cumprido na migração.** Um personagem de 40 anos **não** vai dar os primeiros passos. Se ele nunca viu o marco, é uma vida que já foi vivida sem ele — reescrever o passado seria pior |
| marco cuja janela está **aberta agora** | fica pendente e pode ocorrer normalmente |
| marco já disparado (está em `historicoEventosDisparados`) | marcado como cumprido, pelo id do conteúdo |
| logs antigos sem `relevancia` | continuam caindo na heurística por categoria/tipo (já implementada em `outcomePresentation.ts:164`). **Nenhuma linha antiga muda de sentido** |
| evento reclassificado (ex.: acontecimento → decisão) | afeta só ocorrências **futuras**. O histórico registra o que de fato aconteceu |

Invariantes exigidos pelo item 20, cada um com teste (F1-F5):
evento agendado não desaparece no reload · marco realizado não reocorre · janela não reseta ·
escolha-chave pendente tem comportamento definido (**sobrevive ao reload como pendente**, mesmo
padrão de `eventoAtivo`, que já é persistido hoje).

---

## 20. Escopo exato de implementação

Em ordem de execução. Cada passo termina com `npm test` + typecheck + build verdes.

| # | passo | entrega |
|---|---|---|
| 1 | **Auditoria semântica do catálogo** (134 eventos) | `docs/AUDITORIA-CATALOGO-F3.md` + `data/events/classificacao.ts`. Diagnóstico antes de qualquer correção — item 17 |
| 2 | **Relevância nos produtores** | todo emissor de log declara `relevancia`. Rotina → `textura` |
| 3 | **Densidade biográfica** | `agingSystem` + `lifeRhythm` param de deixar contracheque saturar o ano. **Medir isolado** — é o movimento de maior impacto |
| 4 | **Calendário** | `calendario/{tipos,janelas,calendario}.ts` + `data/calendario/marcosDeVida.ts` |
| 5 | **Marcos no motor** | passos 8-9 da passagem de ano. Canário: primeiras palavras, primeiros passos, primeiro dia de escola |
| 6 | **Compromissos agendados** | estrutura genérica + persistência. **Nenhuma cadeia implementada** — só o trilho |
| 7 | **Pequenas memórias** | `memorias/pequenaMemoria.ts`, derivada de estado, só em ano que ficaria vazio |
| 8 | **Reescrita semântica** | os casos do §13 e os 27 acontecimentos com opções redigidas como deliberação |
| 9 | **Save v5** | migração + testes F1-F5 |
| 10 | **Harness + relatório** | antes/depois, `docs/PR-COERENCIA-F3-REPORT.md` |

Os passos 1-3 já produzem a maior parte do ganho medido e são reversíveis isoladamente. Se algo der
errado, o passo 3 é o ponto natural de parada com valor entregue.

---

## 21. Itens explicitamente adiados

**Fora por decisão sua (item 19):** Desafios de Vida jogáveis · entrevistas · CNH · concurso · OAB ·
ENEM jogável · cursinho · gestação completa · Brasil Vivo completo · economia completa · curva
salarial · localização educacional · Avatar · responsividade · grande expansão narrativa.

**Fora por diagnóstico desta fase** (encontrados agora; registrados para não se perderem):

| achado | medição | para qual fase |
|---|---|---|
| `SALARIO_ALTO_IDADE_BAIXA` | 34 ocorrências / 21 vidas | carreira/economia (já registrado na F2) |
| promoções não reavaliam experiência | — | progressão profissional (já registrado na F1) |
| **aposentadoria não existe** | `SEM_APOSENTADORIA` 643 ocorrências / 73 vidas | carreira. **O calendário desta fase é exatamente o trilho que ela vai usar** (marco `garantido` por janela etária) |
| **2 atividades disponíveis dos 0 aos 11 anos** | 2/12 até os 8 | conteúdo/atividades. É conteúdo, não arquitetura — e o item 17 proíbe expandir conteúdo antes de diagnosticar |
| `NPC_SEM_NOME` | 2.311 / 33 vidas | relacionamento |
| `NAMORO_INSTANTANEO` | 242 / 103 vidas | relacionamento |
| `TRABALHO_COM_SAUDE_CRITICA` | 302 / 83 vidas | saúde |
| `hob_banda_garagem` nunca ocorre | 0/105 | depende de `sabe_tocar_violao`, produzida por `inf_aula_musica` (decisão rara na infância). Efeito colateral da escassez de decisões infantis; deve melhorar sozinho com o §11 — **medir, não corrigir à mão** |

**Preparado, não implementado** (o trilho existe, o trem não):
gestação → nascimento · inscrição → prova · tratamento → retorno · parcelamento → parcelas ·
mudança planejada → efetivada · acontecimentos condicionados por cidade/UF/renda/escola
(item 18: as condições entram como `MarcoDeVida.condicao`, que reusa `GameEvent['condicoes']` — nada
hardcoded agora).

---

## 22. Critérios objetivos de conclusão

A Fase 3 está pronta quando **todos** forem verdadeiros:

1. `npm test` verde, com os **780 testes atuais intactos** e nenhum deles com expectativa alterada
2. `npm run typecheck` e `npm run build` limpos
3. Harness reexecutado nas mesmas 105 vidas, com todas as guardas das Fases 1 e 2 **em zero**
4. `bb_primeira_palavra` e `inf_primeiros_passos` ocorrem em **~100%** das vidas em que a criança
   chega viva ao fim da janela
5. Saturação de anos adultos **abaixo de 15%** e saturação por rotina financeira **em ~0%**
6. **Zero** vidas chegando aos 18 com zero decisões
7. Mais de **95%** dos logs com `relevancia` declarada pelo produtor; `textura` emitida em todas as faixas
8. Razão acontecimento:decisão **entre 1,2 e 3** e nenhuma faixa acima de ~25% de anos com decisão
   (o jogo não voltou a ser questionário)
9. Anos silenciosos **continuam existindo** — o silêncio não foi abolido para inflar métrica
10. Todos os 134 eventos com classificação taxonômica explícita e auditada
11. Nenhum acontecimento move personalidade; nenhuma pequena memória move nada
12. Save da Fase 2 carrega sem perda; nenhum marco dispara retroativamente
13. `calendario/` não importa nada de `systems/` além de `systems/tempo/` (teste de arquitetura)
14. `docs/PR-COERENCIA-F3-REPORT.md` entregue, com antes/depois honesto — inclusive das métricas
    que **não** melhoraram

---

## Resumo em uma página

**O que está errado:** a vida adulta não está vazia por falta de conteúdo — está **silenciada pela
própria folha de pagamento**. Dois logs de rotina ("o ano dedicado ao bico", "as horas extras deste
ano") são os textos mais frequentes do jogo, com 4.359 ocorrências, e contam como acontecimento
estrutural. Dois deles saturam o ano e desligam o sorteio inteiro. **41% dos anos adultos morrem
assim, e 89,2% dessas mortes vêm só de finanças e carreira.** Em paralelo, marco é um flag no caminho
do dado, e por isso 83% dos jogadores nunca ouvem a primeira palavra.

**O que proponho:** três conceitos novos e nenhum sistema-deus.
(1) **Densidade biográfica ≠ rotina** — `textura` deixa de ocupar o ano; ataca 89,2% da saturação num
ponto só. (2) **Calendário da Vida** — um índice temporal pequeno, consultado antes do ritmo, que faz
marcos ocorrerem **por janela e condição, nunca por sorteio**. (3) **Pequenas memórias** — densidade
sem popup, derivada do estado real, só em anos que ficariam vazios.

**O que não proponho:** nenhum evento novo (o catálogo já entrega 132 dos 134), nenhum ajuste de
`densidadeBase`, nenhuma decisão forçada por ano, nenhum toque em `personalitySystem` (que está
saudável — zero acontecimentos movem traço hoje).

**Onde discordei do briefing:** os "buracos enormes" da Linha da Vida não se confirmam na medição
(máximo de 5 anos, 0/105 vidas com 8+). O problema é o **recheio**, não o buraco: 28% dos anos adultos
são exclusivamente contracheque. Não vou propor meta para um problema que a medição não confirma.
