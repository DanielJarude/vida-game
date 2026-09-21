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
