# VIDA — Auditoria da sessão autônoma

Baseline validado antes de qualquer alteração (branch `main`, commit `4e52e55`):

| Verificação | Resultado |
| --- | --- |
| `npm test` | 608 testes / 37 arquivos — todos verdes |
| `npm run typecheck` | sem erros |
| `npm run build` | sucesso (529 kB JS / 39 kB CSS) |

Catálogo real de eventos: **99 eventos** em `MASTER_EVENTS_LIST`.

---

## 1. Diagnóstico do ritmo (problema central)

O VIDA hoje **pergunta demais e acontece de menos**. Três causas independentes se somam:

### 1.1 Todo evento é uma decisão

`GameEvent` exige `opcoes: EventOption[]`; o motor sempre abre um modal
perguntando "o que você faz?". Não existe, no modelo de dados, o conceito de
**acontecimento** — algo que acontece com a pessoa e apenas é narrado.

Consequência direta: eventos como *O Bebê no Espelho* (0-2 anos) viram
perguntas com botões, e um bebê de 1 ano "decide" entre rir do reflexo ou
perder o interesse. Isso contraria a própria regra de autonomia por idade.

### 1.2 O ritmo é uma porcentagem global

`events/selection.ts` → `CHANCE_EVENTO_NO_ANO = 75` e `haEventoNesteAno()`
é literalmente `rollChance(75)`. Um único número, igual aos 0 e aos 80 anos,
sem leitura de fase, contexto, densidade do ano ou fadiga de decisão.

### 1.3 Todo ano abre pelo menos um modal

Em `useGame.envelhecerAno`, `setResumoAnual(...)` é chamado **incondicional­mente**.
Quando o ano foi silencioso, `AnnualSummary` renderiza o texto:

> "Um ano sem grandes acontecimentos. A vida seguiu seu curso."

E `agingSystem` ainda empurra `gerarTextoAnoTranquilo()` como entrada de
`categoria: 'cotidiano'` na Linha da Vida.

**Resultado somado:** 100% dos anos interrompem com um modal; ~75% deles
interrompem com um segundo modal exigindo decisão; e os anos "tranquilos"
poluem a Linha da Vida com texto de preenchimento. Exatamente os três
antipadrões que o VIDA precisa eliminar.

---

## 2. Outros achados

| # | Achado | Gravidade |
| --- | --- | --- |
| 1 | `cacheado` no `avatarRenderer` é uma cadeia de 6 arcos circulares (`a6 6 0 1 1`) — o cabelo cacheado é literalmente bolinhas coladas | alta (Avatar 2.0) |
| 2 | `AvatarFace` tem orelhas como `<circle>`, rosto como `<ellipse>` única, sem mandíbula, sem pescoço, sem implantação de cabelo | alta (Avatar 2.0) |
| 3 | Faixa 41-59 anos tem cobertura muito rala — quase só eventos de janela larga | média (conteúdo) |
| 4 | `useGame.ts` com 977 linhas começa a concentrar comandos demais | média (arquitetura) |
| 5 | Personalidade só é movida por `impactosComportamentais` de escolhas (correto), mas ainda não influencia elegibilidade em escala relevante | média (Etapa F) |
| 6 | `construirResumoAnual` já filtra `cotidiano` — a infraestrutura de curadoria existe e só não é usada para suprimir o modal | baixa (reaproveitar) |

---

## 3. Matriz de reaproveitamento

| Sistema | Decisão | Justificativa |
| --- | --- | --- |
| `events/eligibility` | **PRESERVAR** | Correto, coeso, testado |
| `events/repetitionPolicy` | **PRESERVAR** | Resolve cooldown/marco de verdade |
| `events/contextWeighting` | **PRESERVAR** | Anti-dominação funciona e é ortogonal ao ritmo |
| `events/history` | **REAPROVEITAR E EVOLUIR** | Passa a registrar também a natureza da ocorrência |
| `events/selection.haEventoNesteAno` | **SUBSTITUIR** | Porcentagem global — trocada pela camada de pacing |
| `GameEvent` (tipo) | **REAPROVEITAR E EVOLUIR** | Ganha `natureza`; `opcoes` passa a servir também como leque de desfechos |
| `agingSystem` | **CORRIGIR** | Remove log de ano tranquilo; consulta o pacing |
| `AnnualSummary` | **CORRIGIR** | Só existe quando há o que dizer |
| `outcomePresentation` | **PRESERVAR** | A curadoria já está certa |
| `saveSystem` | **REAPROVEITAR E EVOLUIR** | v4 com migração aditiva |
| `personalitySystem` | **PRESERVAR** | Conceito emergente correto |
| `availabilitySystem` | **PRESERVAR** | Política central por idade funciona |
| `tokens.css` | **REAPROVEITAR E EVOLUIR** | Base sólida; falta identidade editorial |
| `avatarRenderer` + `AvatarFace` | **SUBSTITUIR** | Geometria primitiva impede a direção pedida |
| `avatarData` (schema/persistência) | **PRESERVAR** | Schema e migração continuam válidos |

---

## 4. Roadmap decidido

| Etapa | Escopo |
| --- | --- |
| **A** | Fundação de ritmo: acontecimento × decisão, camada de pacing, anos tranquilos de verdade, curadoria da Linha da Vida, classificação do catálogo, save v4 |
| **B** | Avatar 2.0 — retrato vetorial editorial |
| **C** | Rework visual — identidade editorial do VIDA |
| **D** | Atividades e agência voluntária |

A ordem A → B → C segue a orientação recebida; A vem primeiro porque o
rework visual precisa saber **o que** vai apresentar (quantos modais, que
densidade de Linha da Vida) antes de decidir **como** apresentar.
