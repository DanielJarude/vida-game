# Proposta — Fase 2

**Status: aguardando aprovação. Nenhum código de produção alterado.**
Base: `5d6639b` (Fase 1 aprovada). Antecedentes: `docs/AUDITORIA-COERENCIA-HUMANA.md`,
`docs/PR-COERENCIA-F1-REPORT.md`.

---

## Nome da fase

**O ano como unidade de tempo** — consumo de tempo, ação anual e progressão temporal.

---

## 1. Reavaliação da ordem original

A ordem da auditoria (§26) foi escrita **antes** de a Fase 1 existir, e a Fase 1 não seguiu
aquela ordem: ela **antecipou a Fase 3 original** (`D-1`, camada de plausibilidade) porque a
plausibilidade era pré-requisito da correção de carreira, não consequência dela.

Estado real das fases originais hoje:

| Fase original | Itens | Situação |
|---|---|---|
| **Fase 1 — Coerência gritante** | 7 itens | **Item 2 concluído** (carreira/promoção). **5 pendentes.** |
| **Fase 2 — Pacing** | 5 itens | Intacta |
| **Fase 3 — Plausibilidade** | item 13 (`D-1`) | **Concluído na Fase 1** |
| | itens 14 (licenças), 15, 16, 17 | 14 parcialmente concluído; resto intacto |
| Fases 4–7 | — | Intactas |

O que sobrou da Fase 1 original:

| # | Item | Causa estrutural |
|---|---|---|
| 1 | Off-by-one da formatura + durações de curso | **o ano não mede tempo** |
| 3 | 1 vestibular por ano, com nota persistida | **o ano não consome nada** |
| 4 | 1 candidatura significativa por ano | **o ano não consome nada** |
| 5 | 1 filho por ano; intervalo entre irmãos | **o ano não consome nada** |
| 6 | Nomear todos os NPCs | causa diferente (dados de evento) |
| 7 | Economia do menor de idade | causa diferente (economia) |

**Quatro dos cinco pendentes têm a mesma causa estrutural.** A auditoria os listou como bugs
separados porque se manifestam em sistemas diferentes — educação, carreira, família. Eles não
são quatro problemas: são **quatro sintomas de o ano de jogo não ser uma unidade de tempo com
identidade e capacidade finita**.

Os dois restantes (NPCs, economia do menor) têm causas próprias e pertencem a outras fases.

---

## 2. Problema estrutural que a Fase 2 resolve

> **O ano de jogo não existe como entidade. Ele é apenas o intervalo entre dois cliques em
> "avançar".**

Três consequências que hoje se comportam como bugs distintos:

**(a) O ano não consome nada.** O jogador pode se candidatar ao mesmo emprego, prestar o mesmo
vestibular e ter filhos quantas vezes quiser dentro do mesmo ano. Existe um mecanismo de ação
anual — `acoesRealizadasAno` — mas ele está ligado em apenas **4 ações** (loteria, aumento,
atividade, interação familiar) e, mais grave, **a regra vive em `useGame.ts`**, não no domínio:

```
useGame.ts:172   registrarAcaoAnual()   ← quem decide o que consome o ano
availabilitySystem.ts:126  jaRealizada() ← só sabe o que a UI contou
```

Isso **viola diretamente o princípio que a Fase 1 estabeleceu**: a regra está na camada de
orquestração da interface. Chamar `candidatarEmprego` em laço ignora o limite por completo.

**(b) O ano não mede tempo.** `semestreAtual` começa em 1, soma 2 por ano, e a formatura testa
`>= totalSemestres`. Cursos de 3 semestres formam em **1 ano**. Em durações pares o erro se
cancela — foi por isso que passou despercebido. O catálogo tem **3 cursos de duração ímpar**, e
o modelo "2 semestres por ano" não sabe representar meio ano.

**(c) O ano não registra estado.** A nota do ENEM é recalculada a cada chamada e descartada.
Não existe "eu prestei o ENEM este ano e tirei 640" — existe apenas um sorteio repetível.

### Por que isto agora ameaça a Fase 1

A Fase 1 garantiu que **cada tentativa** é avaliada corretamente. Ela não garantiu nada sobre o
**número de tentativas**. Uma regra de elegibilidade correta, aplicada a tentativas infinitas,
é contornável por força bruta: basta insistir até a rolagem cair.

O harness já mostra isso:

| | Antes da Fase 1 | Depois da Fase 1 |
|---|---|---|
| `CANDIDATURA_ILIMITADA_MESMO_ANO` | 9 ocorrências / 9 vidas | **28 / 28 vidas** |

O número subiu porque a Fase 1 passou a recusar candidaturas — e o agente, podendo tentar de
novo no mesmo ano, tenta de novo. **A Fase 1 tornou a repetição mais visível e mais valiosa.**
Fechar essa porta é a continuação direta do trabalho aprovado, não um tema novo.

---

## 3. Por que esta fase deve vir agora (dependências)

O critério pedido é ordem de dependência, não visibilidade. Tempo é a dependência de baixo:

| Fase futura | O que ela precisa de tempo |
|---|---|
| **Pacing / calendário** (Fase 2 original, `D-2`) | "Evento agendado" é, por definição, *um efeito marcado para um ano futuro*. Sem ano com identidade, não há onde agendar. |
| **Relacionamentos** (`D-4`) | Gestação de nove meses e tempo mínimo por estágio são durações. |
| **Economia** (`D-3`) | Salário é `mensal × 13`; aposentadoria é uma transição temporal; sair de casa é uma transição. |
| **Aposentadoria** (C-09) | É literalmente uma mudança de fase por idade e tempo de contribuição. |
| **Evasão e repetência** (E-03) | Repetir um ano só faz sentido se o ano for uma unidade. |

**Nenhuma dessas fases pode ser feita corretamente antes.** Se fizermos pacing primeiro,
construiremos o calendário sobre um ano que não mede tempo — e o `lifeCalendar` terá que ser
reescrito quando o off-by-one for corrigido.

O inverso não vale: a Fase 2 proposta **não depende de nenhuma delas**. É a próxima camada da
pilha, exatamente como a plausibilidade era na Fase 1.

Um argumento adicional de custo: corrigir a duração dos cursos **muda a trajetória de todas as
vidas** (formatura mais tarde → emprego mais tarde → dinheiro mais tarde). Toda métrica de
balanceamento econômico medida antes dessa correção precisará ser remedida depois. Fazer
economia antes de tempo é medir duas vezes.

---

## 4. Sistemas afetados

| Sistema | Natureza da mudança |
|---|---|
| `systems/tempo/` **(novo)** | Registro do ano como entidade de domínio |
| `systems/educationSystem.ts` | Progressão de semestres; estado do vestibular; níveis intermediários |
| `systems/availabilitySystem.ts` | Passa a consultar o registro do ano para candidatura e vestibular |
| `systems/careerSystem.ts` | Candidatura consome o ano |
| `systems/relationshipSystem.ts` | Nascimento consome o ano (apenas o limite; **não** o modelo de gestação) |
| `systems/agingSystem.ts` | Devolve o registro zerado na virada |
| `hooks/useGame.ts` | **Deixa de ser dono da regra**; passa a repassar o registro |
| `systems/saveSystem.ts` | Migração dos campos novos com default seguro |
| `data/coursesData.ts` | Possível ajuste de durações ímpares (decisão documentada) |
| `scripts/audit/` | Harness acompanha as assinaturas; métricas comparáveis |

---

## 5. Problemas concretos da auditoria atacados

| ID | Problema | Medição atual |
|---|---|---|
| **C-03 / E-01 / F1** | Off-by-one da formatura; cursos de 3 semestres em 1 ano | `FORMACAO_RAPIDA_DEMAIS` **186 ocorrências / 82 vidas** |
| **C-04 / E-02** | Vestibular ilimitado, nota não persistida | `VESTIBULAR_MULT` **23 / 21 vidas** |
| **C-04 (2ª metade) / K-04** | Candidatura ilimitada no mesmo ano | `CANDIDATURA_ILIMITADA` **28 / 28 vidas** |
| **C-07 (parte)** | Múltiplos filhos no mesmo ano | `MULTIPLOS_FILHOS_MESMO_ANO` **1.259 / 99 vidas** |
| **E-04 / R10** | Níveis `superior_incompleto` e `medio_incompleto` nunca atribuídos | 2 vagas órfãs: Estagiário, Dev Júnior |
| **D-8 (parcial)** | Regra de ação anual vive em `useGame.ts` | 4 ações registradas, todas pela UI |

Sobre **E-04**: entra porque a Fase 1 o tornou consequente. Um universitário no 6º semestre tem
`nivelAtual: 'medio_completo'`, e o estágio — a porta de entrada real do universitário
brasileiro — exige `superior_incompleto`, nível que **nada no motor jamais escreve**. É um
problema de *progressão temporal da educação*, o mesmo assunto do off-by-one, e resolvê-lo
devolve duas vagas ao jogo em vez de tirar.

Sobre **C-07**: a Fase 2 ataca **apenas o limite de um nascimento por ano**. O modelo de
gestação, estágios de relacionamento e intervalo entre irmãos fica para a fase de
relacionamentos — mas o *teto anual* é a mesma regra de consumo de tempo das outras três e
custa quase nada quando a infraestrutura existe. Deixá-lo de fora significaria construir a
mesma coisa duas vezes.

---

## 6. Explicitamente fora do escopo

**Não serão implementados nesta fase:**

- Modelo de gestação, estágios de relacionamento, término, compatibilidade (`D-4`) — fase própria
- Calendário de vida, marcos obrigatórios, inversão do `lifeRhythm`, ano tranquilo na Linha da
  Vida (`D-2`) — **depende** desta fase, vem depois
- Livro-razão financeiro, salário líquido, INSS/IRRF, economia do menor (`D-3`) — fase própria
- Aposentadoria (C-09) — depende desta fase
- Evasão, repetência, trancamento (E-03) — depende desta fase
- Nomeação de NPCs (C-13) — causa independente
- Voz dos acontecimentos (C-14), Linha da Vida (T-01…T-06)
- Reescrita de `useGame` em `systems/commands/` (`D-8` completo) — apenas o **necessário** para
  tirar a regra de ação anual da UI; sem refatoração cosmética
- Saúde limitando trabalho (C-12), desemprego como estado (K-09), teto de aumento (K-06)
- ProUni, FIES, SISU, cotas, EAD, técnico integrado (E-05, E-07)
- **Desafios de Vida** — continuam previstos arquiteturalmente, nada implementado
- Validação de plausibilidade no save, seed persistida (C-15) — fase própria

---

## 7. Arquitetura pretendida

### 7.1. O ano como entidade de domínio

```
systems/tempo/
  registroDoAno.ts     RegistroDoAno: o que este ano já consumiu
  acaoAnual.ts         catálogo declarativo: qual ação consome o quê
```

A regra sai de `useGame` e vira dado:

```ts
// declarativo, não espalhado em ifs
type ConsumoAnual =
  | { tipo: 'unico_no_ano' }            // vestibular: uma prova por ano
  | { tipo: 'unico_por_alvo' }          // interação com um familiar
  | { tipo: 'limitado', maximo: number } // candidaturas: N por ano
  | { tipo: 'livre' };
```

`useGame` deixa de **decidir** e passa a **repassar** o registro. O motor valida e devolve o
registro atualizado — mesma inversão que a Fase 1 fez com a elegibilidade.

**Defesa em profundidade:** `candidatarEmprego` chamado 50 vezes em laço, sem UI nenhuma,
precisa recusar da segunda em diante. Será um teste, como foi na Fase 1.

### 7.2. Separação preservada

O limite anual é **consumo de tempo**, não elegibilidade nem sucesso:

```
ELEGIBILIDADE      "pode tentar?"        ← Fase 1
CONSUMO DE TEMPO   "ainda cabe no ano?"  ← Fase 2   (novo eixo, ortogonal)
PROCESSO SELETIVO  "como se saiu?"       ← contrato pronto, vazio
```

Ficar sem tentativas no ano **não é** um veredito de plausibilidade — a pessoa continua
elegível. Por isso não vira um grau novo em `GrauDePlausibilidade`: seria misturar dois eixos.
Será um resultado próprio, e a distinção de vocabulário da Fase 1 (possível / irregular /
improvável / bloqueado) fica intacta.

### 7.3. Progressão de curso

A causa é dupla e ambas precisam de decisão explícita:

1. **O `>=` com início em 1.** Correção aritmética, sem ambiguidade.
2. **Durações ímpares** (3 cursos). Duas saídas honestas: representar o progresso em **meio-ano**
   (o modelo passa a suportar 1,5 ano) ou ajustar o catálogo para durações pares. **Recomendo a
   primeira** — mexer no catálogo para acomodar limitação do motor é resolver o sintoma. A
   decisão será documentada.

### 7.4. Níveis intermediários e estado do vestibular

Ambos são **campos novos com default seguro**, na mesma linha da Fase 1: nenhum save é
invalidado, nenhum personagem é alterado retroativamente.

- `nivelAtual` passa a receber `medio_incompleto` / `superior_incompleto` durante os cursos.
  **Risco vigiado** (§10): isso *eleva* a escolaridade de quem está cursando, e a Fase 1 lê esse
  campo.
- `EducationState` ganha o resultado do ENEM do ano corrente. Save antigo sem o campo = nenhuma
  tentativa feita.

---

## 8. Testes necessários

**Consumo de tempo (defesa em profundidade)**
1. Candidatura além do limite é recusada **por chamada direta ao motor**, em laço, sem UI.
2. Vestibular: segunda tentativa no mesmo ano recusada; a nota da primeira é reusada, não
   re-sorteada.
3. Segundo filho no mesmo ano recusado.
4. A virada de ano libera de novo — o limite é *por ano*, não permanente.
5. O limite **não** é um veredito de plausibilidade: quem esgotou o ano continua elegível.

**Progressão temporal**
6. Todos os 17 cursos formam na duração correta (tabela R1 da auditoria como oráculo).
7. Cursos de 3 semestres: 1,5 ano — nem 1, nem 2.
8. Nenhum curso forma mais cedo que o real; nenhum forma mais tarde.

**Níveis intermediários**
9. Universitário no 3º semestre tem `superior_incompleto`.
10. Estagiário e Dev Júnior tornam-se alcançáveis por via natural.
11. **Não-regressão da Fase 1**: o nível intermediário não destrava vaga que exija formação
    concluída (um universitário de Medicina não vira médico).

**Compatibilidade de saves**
12. Save sem os campos novos carrega e é tratado como "nada consumido neste ano".
13. Save no meio de um curso não regride nem pula semestre com a nova aritmética.
14. Ninguém perde escolaridade já conquistada.

**Regressão geral**
15. Os 743 testes atuais continuam verdes, sem alteração.

---

## 9. Métricas do harness (antes / depois)

Mesmos 105 seeds, harness comparável entre fases. **Linha de base = pós-Fase 1** (medida hoje):

### Alvos — devem cair

| Métrica | Base (pós-F1) | Alvo |
|---|---|---|
| `FORMACAO_RAPIDA_DEMAIS` | 186 / 82 vidas | **0** |
| `CANDIDATURA_ILIMITADA_MESMO_ANO` | 28 / 28 vidas | **0** |
| `VESTIBULAR_MULT_TENTATIVAS` | 23 / 21 vidas | **0** |
| `MULTIPLOS_FILHOS_MESMO_ANO` | 1.259 / 99 vidas | **0** |

### Guarda — não podem degradar

| Métrica | Base (pós-F1) | Limite aceitável |
|---|---|---|
| Idade do 1º emprego (mediana) | 17 | ≤ 19 |
| Vidas sem nenhum emprego | 0 | **0** |
| Superior completo ao fim da vida | 82 / 105 | ≥ 60 (queda esperada, não colapso) |
| Pós-graduação | 14 | ≥ 8 |
| `EMPREGO_SEM_EXPERIENCIA_EXIGIDA` | 0 | **0** (regressão da F1) |
| `CARGO_SEM_ESCOLARIDADE` | 0 | **0** (regressão da F1) |
| Vagas alcançáveis por perfil qualificado | 36/36 | 36/36 |

### Observadas — mudança esperada, sem alvo

Idade de formatura (deve **subir** — é o efeito correto do off-by-one); saldo aos 20/30/60 (deve
cair por deslocamento temporal — **não** será corrigido nesta fase, é da fase econômica).

---

## 10. Riscos de regressão

| Risco | Por que é real | Vigilância |
|---|---|---|
| **Desemprego artificial** | Limitar candidaturas + Fase 1 recusando vagas pode deixar o personagem sem entrar no mercado | "Vidas sem emprego = 0" é critério de bloqueio. Se ocorrer, o limite é frouxo demais ou precisa de mais tentativas/ano |
| **Colapso do ensino superior** | 1 vestibular/ano + nota persistida pode derrubar a taxa de superior de 82 para perto de zero | Piso de 60/105. Se furar, a nota precisa de progressão entre anos, não de tentativas infinitas |
| **Níveis intermediários destravando vagas** | `superior_incompleto` (6) > `medio_completo` (4): quem está cursando **sobe** de escolaridade. Pode abrir vaga que hoje não abre | Teste 11 é explícito. É o risco mais sutil desta fase |
| **Cascata temporal** | Formatura mais tarde → emprego mais tarde → dinheiro mais tarde. Muda **todas** as métricas econômicas | Tratado como mudança **esperada**, não regressão. Documentado, não corrigido aqui |
| **Quebra de saves no meio de um curso** | A aritmética de semestres muda sob um save existente | Testes 12–13; nenhum save pode regredir ou pular |
| **Regressão silenciosa da Fase 1** | Mexer em `availabilitySystem` e `careerSystem` toca código recém-validado | Os 743 testes atuais rodam sem alteração; duas métricas da F1 viram critério de bloqueio |

---

## 11. Critérios objetivos de conclusão

1. `npm test` verde, **incluindo os 743 testes atuais sem nenhuma alteração**.
2. `npm run typecheck` e `npm run build` limpos.
3. As 4 métricas-alvo do §9 em **zero**.
4. Todas as métricas-guarda do §9 dentro do limite.
5. Os 17 cursos formam na duração correta, conferidos contra a tabela R1.
6. Chamada direta ao motor em laço não fura nenhum limite anual (sem passar por UI).
7. Estagiário e Dev Júnior alcançáveis por via natural.
8. Saves antigos carregam, inclusive no meio de um curso, sem perda de progresso.
9. Varredura adversarial de repetição: **0 achados sem explicação**.
10. Relatório `docs/PR-COERENCIA-F2-REPORT.md` com a mesma estrutura de 12 itens.
11. Nenhuma expansão de escopo além do §5; nenhum item do §6 implementado.

---

## Pendência registrada (não tratada nesta fase)

**Promoções não reavaliam experiência.**

Decisão da Fase 1: `podeSerPromovidoPara` confere escolaridade, formação e licença, mas **não**
experiência — o argumento foi que experiência é justamente o que se adquire no cargo, e exigir o
tempo do cargo de destino tornaria toda promoção impossível.

Isso continua **não verificado** quanto a progressões temporalmente absurdas: nada hoje impede
que uma cadeia de promoções leve a um cargo sênior rápido demais, já que cada degrau exige apenas
`desempenho ≥ 80` e `anosNoCargo ≥ 2`.

**Não será alterado agora, nem automaticamente.** Fica registrado para a **fase de
carreira/progressão profissional**, onde deverá ser:

1. simulado — medir a idade em que cada cargo sênior é alcançado, ao longo de cadeias completas;
2. comparado com o tempo de carreira que o próprio catálogo declara (`experienciaNecessaria` do
   cargo de destino);
3. corrigido **estruturalmente** se houver absurdo — por regra reutilizável sobre tempo de
   carreira, nunca por exceção por profissão.

Métrica já disponível como ponto de partida: **66 saltos salariais acima de 2× em um único ano**
(pós-Fase 1), e `SALARIO_ALTO_IDADE_BAIXA` em 23 ocorrências / 14 vidas.
