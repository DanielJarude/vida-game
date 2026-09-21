# Fase 2 — O ano como unidade de tempo

Relatório de implementação. Branch `arena/01a0c250-vida-game`.
Antecedentes: `docs/AUDITORIA-COERENCIA-HUMANA.md`, `docs/PR-COERENCIA-F1-REPORT.md`,
`docs/PROPOSTA-FASE-2.md`. Fase 1 (`5d6639b`) preservada integralmente.

---

## 1. O modelo temporal anterior

Não havia um. "Ano" era a consequência de um clique em **avançar**, e cada sistema
improvisava a própria aritmética:

```
educação   semestreAtual += 2        contador de posição
carreira   anoFim - anoInicio        subtração de calendário
harness    ano - anoIngresso         proxy externo
useGame    acoesRealizadasAno[]      lista que alguém zera
```

Quatro convenções, nenhuma conversando com as outras, nenhuma capaz de responder
"quanto tempo falta?" ou "isto já aconteceu neste período?".

## 2. Causa raiz

**O ano não existia como entidade**, e disso decorriam três incapacidades distintas
que a auditoria havia catalogado como bugs separados:

**(a) O ano não media tempo.**

```ts
semestreAtual = 1                          // na matrícula
semestreAtual += 2                         // a cada ano
if (semestreAtual >= totalSemestres) { formatura }
```

Três erros somados: o contador começava em 1 sem que nenhum semestre tivesse sido
cursado; `>=` comparava posição com duração; e somar 2 por ano **atravessa** o ponto
de conclusão de um curso ímpar sem pousar nele. Em durações pares os erros se
cancelavam — foi por isso que sobreviveu tanto tempo.

**(b) O ano não consumia nada.** O mecanismo existia (`acoesRealizadasAno`) mas
cobria 4 ações e — mais grave — **vivia em `useGame.ts`**. A regra era propriedade da
interface; chamar o motor em laço a ignorava.

**(c) O ano não registrava estado.** A nota do ENEM era sorteada a cada chamada e
descartada. Não existia "prestei a prova e tirei 640" — existia um botão de re-roll.

## 3. O modelo novo

```
systems/tempo/
  instante.ts           representação canônica; operações temporais centralizadas
  registroTemporal.ts   consumo carimbado no tempo + política declarativa
  matricula.ts          duração de curso como fato temporal
```

`instante.ts` não importa nenhum sistema do jogo — é base da pilha, como
`politicaTrabalho`. As perguntas que o item 2 do escopo exigia são agora **uma função
cada**, num lugar só:

| Pergunta | Função |
|---|---|
| em que ano da vida estamos? | `anoDoInstante` |
| quanto tempo passou desde X? | `semestresEntre` / `anosEntre` / `anosCompletosEntre` |
| esta ação já foi realizada neste período? | `avaliarDisponibilidadeTemporal` |
| quando esta formação começou? | `Matricula.inicio` |
| quanto tempo falta? | `semestresRestantes` |
| este marco já ocorreu? | `usosDe` / `ultimoUso` |
| este efeito está agendado para quando? | `instanteDeConclusao` |
| duas coisas no mesmo período? | `mesmoSemestre` / `mesmoAno` |

## 4. Unidade interna escolhida: o **semestre**

Escolhida por ser a **menor unidade que resolve todos os requisitos desta fase, e não
mais que isso**:

- cursos de duração ímpar (3 semestres) tornam-se representáveis sem arredondar;
- o catálogo **já** declarava duração em semestres — a unidade do domínio já era essa,
  faltava existir no motor;
- períodos de consumo anual são múltiplos exatos de semestre.

Um calendário mensal resolveria os mesmos casos com doze vezes mais estados, sem
nenhum requisito atual que o justifique. Gestação (nove meses) é o primeiro caso que
vai apertar a escolha, e está fora desta fase. Quando chegar, a mudança é trocar
`SEMESTRES_POR_ANO` — nenhuma operação assume "2" fora de `instante.ts`.

**Tempo interno ≠ tempo visual.** O motor entende semestres; o jogador continua
avançando de ano em ano, com **zero cliques a mais**. A passagem de ano avança dois
semestres de uma vez. A precisão existe para a interface poder dizer *"curso de 1 ano
e 6 meses"* — e é exatamente isso que ela passou a exibir.

## 5. Arquivos

**Novos**

| Arquivo | Papel |
|---|---|
| `src/systems/tempo/instante.ts` | Representação canônica; operações centralizadas |
| `src/systems/tempo/registroTemporal.ts` | Consumo carimbado; política declarativa |
| `src/systems/tempo/matricula.ts` | Início + duração + progresso + conclusão |
| `src/systems/__tests__/tempoDeVida.test.ts` | Casos A–J (37 testes) |

**Alterados**

| Arquivo | Mudança |
|---|---|
| `src/types/index.ts` | `matriculaInicio`, `vestibular`, `registroTemporal` (todos opcionais) |
| `src/systems/educationSystem.ts` | Conclusão por tempo cumprido; nota persistida; `superior_incompleto` |
| `src/systems/careerSystem.ts` | Um processo seletivo por vaga, por ano |
| `src/systems/relationshipSystem.ts` | Uma concepção por ano |
| `src/systems/saveSystem.ts` | Migração do registro temporal |
| `src/hooks/useGame.ts` | Deixa de ser dono da regra; guarda e repassa o registro |
| `src/components/career/EducationSection.tsx` | Exibe a duração em linguagem humana |
| `scripts/audit/{simulador,reproducoes,rodar}.ts` | Acompanha assinaturas; **2 métricas corrigidas** |

## 6. Migração de save

**Nenhum campo obrigatório foi adicionado. Nenhuma migração destrutiva.**

| Campo | Ausente num save antigo significa |
|---|---|
| `matriculaInicio` | Reconstruído retroagindo o progresso legado |
| `vestibular` | "Ainda não prestou" |
| `registroTemporal` | "Nada consumido" |

A reconstrução da matrícula é **deliberadamente conservadora**: usa `semestreAtual - 1`,
porque no modelo antigo o contador começava em 1 sem nenhum semestre cursado. Na pior
hipótese um aluno cursa meio ano a mais — preferível a receber um diploma que o novo
modelo considera não cumprido.

A direção do risco no registro temporal também é deliberada: tratar a ausência como
"tudo consumido" puniria retroativamente quem já jogava; tratá-la como "nada
consumido" concede um ano de tentativas uma única vez. Entre punir um save existente e
ser generoso uma vez, a escolha é clara.

## 7. Testes

**Antes:** 45 arquivos · 743 testes. **Depois:** 46 arquivos · **780 testes, verdes.**
Typecheck e build limpos. **Nenhum teste anterior alterado.**

| Caso | Cobertura |
|---|---|
| **A** | Curso não conclui antes da duração — nenhum instante anterior aprova |
| **B** | Os 17 cursos respeitam a duração declarada |
| **C** | 1,5 ano não vira 1 nem 2; nenhum curso de 3 semestres forma em 1 ano |
| **D** | **Matriculado ≠ formado** (6 cursos × 11 vagas reguladas) |
| **E** | Vestibular: 200 tentativas no mesmo ano não aprovam quem reprovou |
| **F** | Nota e registro sobrevivem ao save/reload |
| **G** | Novo ano libera nova tentativa |
| **H** | 50× na mesma vaga = 1 tentativa; **vagas distintas continuam livres** |
| **I** | 10 chamadas = 1 filho; ano seguinte libera; chave é `concepcao` |
| **J** | Métricas da Fase 1 intactas; inelegível não gasta tentativa |

**Varredura adversarial de repetição** — ~2.700 combinações (toda vaga × 3 idades ×
40 tentativas; todo curso × 40 tentativas; concepção × 3 idades; todo curso × 3 idades
de ingresso): **0 achados**.

## 8. Harness — antes e depois

105 vidas, mesmos seeds.

### Alvos

| Métrica | Antes (pós-F1) | Depois |
|---|---|---|
| `FORMACAO_RAPIDA_DEMAIS` | 186 / 82 vidas | **0** |
| `CANDIDATURA_ILIMITADA_MESMO_ANO` | 28 / 28 vidas | **0** |
| `VESTIBULAR_MULT_TENTATIVAS` | 23 / 21 vidas | **0** |
| `MULTIPLOS_FILHOS_MESMO_ANO` | 1.259 / 99 vidas | **0** |

### Guardas

| Métrica | Limite | Depois | |
|---|---|---|---|
| `EMPREGO_SEM_EXPERIENCIA_EXIGIDA` | 0 | **0** | ✅ |
| `CARGO_SEM_ESCOLARIDADE` | 0 | **0** | ✅ |
| Vidas sem nenhum emprego | 0 | **0/105** | ✅ |
| Idade do 1º emprego (mediana) | ≤ 19 | **18** | ✅ |
| Superior completo | ≥ 60 | **93** | ✅ |
| Pós-graduação | ≥ 8 | **8** | ✅ |

### Duas métricas corrigidas antes de medir

O escopo (item 15) pedia para não otimizar cegamente para zero. Duas métricas estavam
**semanticamente erradas** e foram corrigidas primeiro:

**`FORMACAO_RAPIDA_DEMAIS`** comparava contra a constante `<= 1 ano`. Isso é um proxy,
não a regra: com durações ímpares representáveis, um curso legítimo de 1,5 ano cairia
como violação. Passou a comparar contra a **duração declarada do curso**. Sem essa
correção, a Fase 2 produziria falsos positivos exatamente nos cursos que consertou.

**`VESTIBULAR_MULT`** acusava qualquer aprovação após a primeira tentativa. Mas *"não
passei na federal e me matriculei na particular"* usa a **mesma nota** e é o caminho
real de milhões de estudantes — nunca foi exploit. Passou a medir o que de fato é
exploit: **a nota mudar entre tentativas do mesmo ano**.

### Uma regressão aparente, investigada e reclassificada

`EMPREGO_SEM_EXPERIENCIA_EXIGIDA` subiu de 0 para **2** — violação de critério de
bloqueio. Investiguei antes de mexer em qualquer regra.

Os dois casos são *Analista da Receita Federal* (exige 1 ano) contratando alguém com 0.
Verificado diretamente no motor: veredito **`improvavel`**, modificador **0,75** — ou
seja, exatamente a faixa que a **Fase 1 aprovou e documentou** ("faltando ≤1 ano →
improvável, não bloqueia").

A métrica foi escrita **antes da Fase 1** e nunca soube dessa distinção. Na Fase 1 ela
marcou zero **por acaso**: nenhuma das 105 vidas caiu na faixa. Ao deslocar as
trajetórias no tempo, a Fase 2 fez a faixa aparecer.

Corrigi a **métrica**, não a regra: `EMPREGO_SEM_EXPERIENCIA_EXIGIDA` passa a contar
falta **> 1 ano** (grau `requisito`, que bloqueia), e a faixa improvável virou
`CONTRATACAO_IMPROVAVEL_POR_EXPERIENCIA`, contada à parte para não sumir da observação.
Alterar o motor aqui seria desfazer uma decisão aprovada para satisfazer um medidor
desatualizado.

### Correção na reprodução R1

A R1 montava o estado de matrícula **à mão**, sem `matriculaInicio` — caindo no caminho
de save legado e cobrando um ano extra em **todos** os 17 cursos. Não era o motor: era
a medição. Corrigida para matricular como o jogo matricula.

## 9. Duração dos 17 cursos validada

| Curso | Semestres | Esperado | Medido |
|---|---|---|---|
| Téc. Desenvolvimento de Sistemas | 3 | 1,5 | **2** ✓ |
| Téc. Eletrotécnica | 4 | 2,0 | **2** ✓ |
| Téc. Enfermagem | 4 | 2,0 | **2** ✓ |
| Téc. Administração | 3 | 1,5 | **2** ✓ |
| Medicina | 12 | 6,0 | **6** ✓ |
| Direito | 10 | 5,0 | **5** ✓ |
| Eng. de Software | 8 | 4,0 | **4** ✓ |
| Engenharia Civil | 10 | 5,0 | **5** ✓ |
| Administração | 8 | 4,0 | **4** ✓ |
| Enfermagem | 10 | 5,0 | **5** ✓ |
| Psicologia | 10 | 5,0 | **5** ✓ |
| Pedagogia | 8 | 4,0 | **4** ✓ |
| Design Digital | 8 | 4,0 | **4** ✓ |
| Educação Física | 8 | 4,0 | **4** ✓ |
| Ciências Econômicas | 8 | 4,0 | **4** ✓ |
| MBA Executivo | 3 | 1,5 | **2** ✓ |
| Residência Médica | 4 | 2,0 | **2** ✓ |

Cursos de duração par batem exatamente. Os de 1,5 ano concluem **durante** o 2º ano —
a conclusão cai no meio do ano e é observada na virada seguinte. Antes formavam em
**1 ano**; nenhum forma mais em menos que o declarado. **Sem exceção por nome de curso.**

## 10. Comportamento das tentativas

| Ação | Política | Chave |
|---|---|---|
| Vestibular | Nota do ano é fato; reusada em toda tentativa | `EducationState.vestibular` |
| Processo seletivo | 1× por **vaga**, por ano | `processo_seletivo:${jobId}` |
| Concepção | 1× por ano | `concepcao` |

No vestibular ataquei a **causa** (a nota ser re-sorteada), não o botão. Isso preserva
o caminho legítimo federal→particular com a mesma nota, que um bloqueio destruiria.

## 11. Impacto sobre carreira

O limite é **por oportunidade**, não global — conforme a revisão do escopo. Insistir
50× na mesma vaga gasta **uma** tentativa; candidatar-se a vagas diferentes no mesmo
ano continua livre. O mercado não ficou imóvel: 0 vidas sem emprego, mediana do
primeiro emprego em 18 anos.

A tentativa é consumida **antes** de saber o resultado — é o que torna a reprovação
custosa e o risco real. Quem é **inelegível não gasta tentativa**: os eixos são
independentes (teste J).

**Limitação:** `Job` é um cargo de catálogo, não uma vaga de uma empresa. "Repetir a
mesma oportunidade" é hoje "repetir o mesmo cargo" — a aproximação mais fiel que o
catálogo permite. Quando houver empregadores distintos, a chave passa a incluir o
empregador e nada mais muda.

## 12. Impacto sobre educação

Conclusão por tempo cumprido; `FORMACAO_RAPIDA_DEMAIS` zerado. Superior completo subiu
de 82 para 93 vidas (o vestibular deixou de queimar tentativas em re-rolls perdidos) e
pós caiu de 14 para 8 — efeito esperado do deslocamento temporal: a graduação termina
mais tarde e sobra menos vida para a pós.

**`superior_incompleto` passou a ser atribuído** (E-04), devolvendo ao jogo duas vagas
que eram inalcançáveis: *Estagiário Universitário* e *Desenvolvedor Júnior*.

### A proteção da Fase 1

Este era o ponto de maior risco. `superior_incompleto` vale **6** na hierarquia e
`medio_completo` vale **4** — matricular-se **eleva** a escolaridade.

O que garante que isso não destrava vaga alguma que exija formação concluída: a
elegibilidade profissional confere formação por `cursosConcluidos`, e **uma matrícula
em curso não entra nessa lista** — ela só é escrita na formatura. Um estudante de
Medicina sobe para `superior_incompleto` e continua sem CRM, sem área de formação em
medicina e sem o `superior_completo` que a vaga exige.

Coberto pelo teste D, que varre **6 cursos × 11 profissões regulamentadas**. Estudante
de Medicina não vira médico; de Direito não advoga; de Engenharia não assina obra.

## 13. Impacto sobre filhos

A proteção é **uma concepção por ano**, não "um nascimento por ano" — conforme a
revisão do escopo. A distinção não é semântica: gêmeos são **uma** concepção que produz
**dois** filhos, e continuarão cabendo nesta regra sem que ela mude. A chave se chama
`concepcao` justamente para nomear a decisão, não o desfecho.

Escrever "um ser humano só pode ter um filho por ano" seria uma regra ontológica falsa
e bloquearia a gestação múltipla legítima na fase de relacionamentos.

**Nada de gestação** foi implementado: sem nove meses, sem descoberta, sem risco, sem
nascimento agendado.

## 14. Regressões encontradas

| Encontrada | Natureza | Resolução |
|---|---|---|
| `EMPREGO_SEM_EXPERIENCIA` 0 → 2 | **Métrica desatualizada**, não regressão | Métrica corrigida; motor intacto |
| R1 cobrando +1 ano em todos os cursos | **Medição incorreta** | Reprodução corrigida |
| Pós-graduação 14 → 8 | **Efeito esperado** do deslocamento | Dentro do limite (≥8) |

Nenhuma regressão de produção. Os 743 testes da Fase 1 seguem verdes sem alteração.

## 15. Limitações

1. **Cursos de 1,5 ano concluem no 2º ano de jogo.** O motor sabe que a conclusão cai
   no meio do ano, mas a passagem de ano só é observada na virada. Corrigir exigiria
   resolver eventos no meio do ano — o que obrigaria o jogador a clicar duas vezes por
   ano, contra o item 1 do escopo.
2. **`Job` não distingue empregadores** (§11).
3. **`acoesRealizadasAno` continua existindo** ao lado do registro temporal. São coisas
   diferentes: um é conveniência de interface zerada na virada, o outro é consumo
   persistente. Unificá-los seria refatoração cosmética fora do escopo.
4. **Eventos agendados ainda não existem** — só a base para eles (§16).
5. **`medio_incompleto` e `fundamental_incompleto` continuam órfãos.** Só
   `superior_incompleto` tinha vagas dependendo dele; criar os outros dois sem
   consumidor seria inventar estado sem uso.

## 16. Preparação para o Calendário da Vida

O que esta fase deixa pronto, sem implementar:

**Instante como número ordenável.** `manha < tarde` já é comparação cronológica
correta. A Linha da Vida vai conseguir distinguir "aconteceu aos 18" de "aconteceu
antes/depois de outra coisa também aos 18" — coberto por teste.

**Agendamento expressável.** `instanteDeConclusao(matricula)` já responde *"matrícula →
formatura prevista para tal período"*. A mesma forma serve para "gravidez descoberta →
nascimento previsto" e "inscrição → prova em período posterior". Falta a **estrutura**
que guarda efeitos futuros e os dispara — outra fase.

**Cooldowns e janelas.** `usosDesde` já expressa "não mais que N nos últimos M
semestres", que é a forma de uma janela de desenvolvimento.

### Registro obrigatório: marcos ≠ eventos aleatórios

Conforme o item 11 do escopo, fica registrado para o futuro Calendário da Vida:

> `repeticao: 'marco'` controla **repetição**, não **ocorrência**.
> `repetitionPolicy.ts:79` trata `'marco'` exatamente como `'unica'`. O resultado
> medido: *A Primeira Palavra* aparece em **17%** das vidas e *Primeiros Passos* em
> **13%** — não porque o jogador escolheu outra coisa, mas porque o dado não caiu.
>
> O Calendário da Vida precisará distinguir **MARCO GARANTIDO / JANELA DE
> DESENVOLVIMENTO** de **EVENTO ALEATÓRIO**. Um marco acontece na janela, ponto — e é
> *ele* que torna o ano não-silencioso, em vez de competir por espaço com um
> acontecimento qualquer no mesmo RNG.

**Não corrigido nesta fase** — não havia dependência inevitável.

## 17. Recomendação para a Fase 3

**Calendário da Vida e pacing** (`D-2`, Fase 2 original da auditoria).

É o próximo item da pilha de dependências: agora existe a base temporal que faltava, e
é o problema de maior impacto percebido que resta. A vida adulta é **75% silêncio**, a
infância é a fase mais densa do jogo, e dos 30 aos 59 o jogador toma 3,1 decisões em
30 anos.

Três peças, na ordem:

1. **Inverter a ordem de decisão do ritmo** — consultar o conteúdo elegível antes de
   decidir o pulso, em vez de decidir no escuro.
2. **Marcos garantidos** — usando a distinção registrada em §16.
3. **Ano tranquilo com uma linha discreta** — resolve os 841 buracos da Linha da Vida
   sem interromper o jogador com um modal.

Alternativa mais barata, se a preferência for consolidar: **aposentadoria** (C-09), que
agora é implementável — é uma transição por idade e tempo de contribuição, e
`SEM_APOSENTADORIA` subiu para 643 ocorrências em 73 vidas justamente porque as pessoas
passaram a viver trajetórias mais longas.

---

## Pendência preservada (não tratada)

**Promoções não reavaliam experiência.** Registrada na proposta da Fase 2 e
**mantida sem alteração**, conforme instruído. Deve ser tratada na fase de
carreira/progressão profissional: simular cadeias completas de promoção, medir a idade
de chegada aos cargos sênior, comparar com o `experienciaNecessaria` declarado e
corrigir estruturalmente se houver absurdo.

Ponto de partida atualizado: **55 saltos salariais acima de 2× em um ano** (eram 66) e
`SALARIO_ALTO_IDADE_BAIXA` em **34 ocorrências / 21 vidas** (eram 23 / 14). O aumento
desta última merece atenção na fase apropriada: é consistente com trajetórias que agora
chegam ao mercado com formação completa mais tarde, mas não foi investigado a fundo
porque curva salarial está fora do escopo desta fase.
