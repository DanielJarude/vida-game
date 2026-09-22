# F6-FIX — Rede social jogável, continuidade narrativa e pré-requisitos justos

Correção dirigida a partir do playtest humano da F6 (Thaís Santos, Juazeiro-BA).
Cinco achados, todos reproduzidos antes de qualquer alteração de produção.

**Base:** F6 `d561e75` · branch `arena/01a0c250-vida-game` · save continua **v5**.

---

## 1. Reprodução dos cinco achados

| # | Achado do playtest | Reproduzido? | Como |
|---|---|---|---|
| A | Frases sem contexto biográfico | **Sim** | Auditoria de âncora: 19 desfechos com referência pendente, incluindo os dois citados |
| B | Rede social existe mas não é jogável | **Sim** | `FamilyTab` filtrava por lista literal **sem `'colega'`** |
| C | Proximidade evolui sem participação | **Sim** | Convivência passiva chegava a **100** sem nenhuma ação |
| D | Filler biográfico voltou | **Sim** | 3ª variante de `mem_infancia_escola` |
| E | Opção travada por passado inacessível | **Sim** | **39 opções bloqueadas, 39 por RNG, 0 por trajetória** |

---

## 2. Causa raiz de cada achado

### A — a memória autorada existia, mas não foi aplicada

A F5 acertou o mecanismo: `descricaoMemoria` é um texto **autorado** para a
Linha da Vida, e `memoriaDoEvento.ts` escolhe entre ela e
`descricaoResultado`. O que faltou foi **cobertura** — só 19 dos 289
desfechos declaravam memória própria.

O defeito não é "falta substantivo concreto": *"marcou um golaço ovacionado
pelo quarteirão"* é perfeitamente legível dez anos depois. O defeito é a
frase **anafórica**, que abre apontando para algo que só existia no
enunciado do evento — e o enunciado a Linha da Vida não guarda:

> "**Foi uma visita curta**: o café mal esfriou…" → visita a quem?
> "**Você conseguiu alguns minutos extras**…" → extras de quê?

### B — a taxonomia do vínculo social estava duplicada em três lugares

A lista de "quem é vínculo social" existia **três vezes**, e as três
discordavam:

| Lugar | Continha `'colega'`? |
|---|---|
| `FamilyTab` (aba Relacionamentos) | **não** |
| `contextoSocial` | sim |
| `relationshipSystem` | sim (mas sem `rival`/`mentor`) |

A F6 introduziu `'colega'` e ele foi lembrado em dois dos três. Luiz existia
no estado, entrava no painel Pessoas (que usa outra projeção) e sumia da aba.
**Não era uma string esquecida — era a ausência de fonte única.**

### C — a inércia não tinha teto

O ano social somava proximidade sem limite superior. Conviver bastava para
chegar a 100: "Distante → Melhor amigo" sem uma única decisão.

### D — filler puro

> "Um ano escolar sem nada de extraordinário, do jeito que a maioria é."

As outras duas variantes descrevem a **forma** do dia (aula de manhã, tarefa
à tarde / caderno, recreio, caminho de volta). Esta só afirmava que nada
aconteceu — o que o silêncio já diz, de graça e melhor.

### E — o jogo punia o jogador por sorteios que ele nunca viu

Este foi o mais grave. Medido nas 105 vidas:

| Opção travada | Chegaram ao evento | Viram o antecedente | Locks de trajetória | Locks de RNG |
|---|---|---|---|---|
| `opt_colega_retribui` | 13 | **0** | 0 | **13** |
| `opt_beijar_paixao_real` | 12 | **0** | 0 | **12** |
| `opt_entrar_grupo_confianca` | 11 | **0** | 0 | **11** |
| `opt_tocar_violao_festa` | 3 | **0** | 0 | **3** |
| **TOTAL** | 39 | **0** | **0** | **39** |

Causa estrutural: cada antecedente é **fonte única** numa janela de 3-5 anos,
competindo com ~20 candidatos por ano. Dois deles (`inf_aula_musica`,
`esc_achado_perdido_dinheiro`) **nunca dispararam em 105 vidas**.

E o lock de disciplina tinha causa própria, pior: **a postura escolar movia
`hiddenStats.disciplina`, mas o requisito lê o TRAÇO de personalidade.**
Estudar todos os anos — a escolha mais disciplinada do jogo — não contava
nada. 76/105 vidas chegavam aos 12 anos sem nenhuma fonte do traço.

---

## 3. Arquitetura corrigida

### Pessoas vs Relacionamentos (§7)

Fonte única em `contexto/contextoDaVida`, que já era a casa da taxonomia:

```ts
TIPOS_VINCULO_SOCIAL = ['amigo','amiga','colega','rival','mentor','paixao']
ehVinculoSocial(tipo)
vinculosSociaisVisiveis(familia)   // vivos + relação em andamento
```

`contextoSocial` **reexporta** em vez de redefinir. `FamilyTab` não mantém
mais taxonomia própria: pergunta ao domínio. A seção virou **"Amigos e
colegas"**, ordenada por proximidade, e cada linha mostra a história da
relação — `12 anos · escola · desde os seus 7`.

`TIPOS_AMIZADE` continua sendo coisa **diferente e mais estrita**: colega não
é amigo, e nenhuma memória ou evento de amizade passou a valer por causa
disto (§21 da F6 e o cooldown da F5-FIX intactos).

### Agência social (§9) — reuso, não sistema novo

O sistema de interação já era genérico e já tinha anti-farm por ano
(`jaRealizada`) e capacidade por idade. Faltava **um repertório próprio**:

```ts
SOCIAL_INTERACOES = ['passar_tempo', 'conversar', 'dar_presente']
```

Pedir dinheiro e pedir conselho pressupõem quem cria você; "discutir" na
infância é narrado como *birra*. Nada disso cabe num colega de sala. A
narração ganhou trilha própria (`narrarInteracaoSocial`) que nunca invoca
papel de família — "Você passou o recreio inteiro brincando com Rafael".

**Defesa em profundidade:** a regra é checada em `availabilitySystem`
(a ação não fica disponível), em `familySystem` (o comando recusa) e na UI
(o botão não é oferecido).

### Anti-farm (§10)

Nenhuma infraestrutura nova: `acoesRealizadasAno` já impedia repetir
`familia:<id>:<tipo>` no mesmo ano. Vale para colegas pelo mesmo caminho.
**Nenhum Energy foi criado.**

### Convivência passiva com teto (§11)

```ts
TETO_CONVIVIO_PASSIVO = 70   // LIMIAR_AMIZADE = 55
```

O teto fica **acima** do limiar de propósito: a amizade continua podendo
nascer só de viver junto — que é o melhor da F6. O que exige agência é a
**proximidade profunda**. Verificado isolando o ano social: a máxima
alcançável sem nenhum evento nem interação é exatamente **70**.

Eventos e interações continuam podendo passar disso (46% dos vínculos
passam) — é a agência superando a inércia, exatamente como pedido.

### Locks de trajetória vs locks de RNG (§5, §12)

`ResultadoRequisito` ganhou `origemDoBloqueio`, **derivado** do catálogo e do
`historicoEventosDisparados` que já existe no save:

| Situação | Classificação | O que o jogador vê |
|---|---|---|
| Viu o antecedente, escolheu outro caminho | `'trajetoria'` | "Sua história seguiu por outro caminho." |
| Nunca recebeu a oportunidade | `'nunca_oferecido'` | **a opção não é exibida** |
| Dinheiro/idade/atributo | `'estado'` | motivo concreto de sempre |

O índice flag → eventos é **derivado do catálogo**, não escrito à mão: uma
lista paralela se desatualizaria no primeiro evento novo e o defeito
voltaria em silêncio. **Nenhum `if (eventId === ...)`.**

### Disciplina (§6)

A postura escolar agora produz `impactoComportamental`, que atravessa
`AgingResult` e alimenta o traço na camada de comandos — o mesmo caminho dos
impactos de evento.

Isto **não inventa disciplina**: é a mesma escolha que o jogador já fazia,
finalmente chegando ao sistema que depois a cobra. Quem mata aula recebe o
delta negativo pelo mesmo caminho.

| | antes | depois |
|---|---|---|
| Vidas com caminho real para o traço antes dos 12 | 29/105 | **83/105** |
| Vidas que atingiriam o mínimo exigido (5) só pela postura | — | 12/105 |

Continua sendo um lock **legítimo**: exige estudar de forma sustentada.

---

## 4. Auditoria narrativa (§16)

| | |
|---|---|
| Eventos lidos | **134** |
| Desfechos lidos | **289** |
| Aprovados sem mudança | **270** |
| Reescritos (ganharam `descricaoMemoria` autorada) | **17** |
| Falsos positivos, mantidos após leitura | **2** |
| Com memória dedicada (antes → depois) | 19 → **36** |
| Filler removido | **1** |
| Opções com lock de RNG | **39 → 0 exibidas** |

Os 17 receberam texto **autorado**, curto, no passado, nomeando a cena:

> "Foi uma visita curta: o café mal esfriou…"
> → *"Passou uma tarde curta na casa dos avós — mal deu tempo de tomar o café."*

> "Você conseguiu alguns minutos extras…"
> → *"Pediu mais tempo no tablet da casa e acabou com a hora de tela encurtada depois."*

**Nenhuma concatenação `descricao + descricaoResultado`** — recusada na F5 por
quebrar tempo verbal, tamanho e gerar redundância, e recusada de novo aqui.

Os 2 falsos positivos (`rnd_panela_pressao`, `bb_febre_noite`) citam cozinha e
febre no próprio texto: são autossuficientes. **Não foram mexidos.**

---

## 5. Leitura manual (§24)

20 timelines 0→18 e 10 de 18→30. As biografias lêem como vidas, não como log.
Dois achados novos, ambos corrigidos:

1. **"Giovanna acabou virando amigo seu"** — concordância de gênero. O gênero
   está no estado; não usá-lo é deixar o texto denunciar que é template.
   Agora: *"Apresentada por gente em comum, Giovanna acabou virando amiga sua
   também."*
2. **Proximidade 99-100 apesar do teto** — investigado e **correto**: vem de
   eventos com `relacionamentoDelta`, ou seja, agência. O teto vale para a
   inércia, e isolando o ano social o máximo é exatamente 70.

Verificado como **não-defeito**: "Vocês nunca chegaram a se conhecer direito"
repetindo aos 8 e aos 11 é desfecho de uma escolha com cooldown de 2 anos —
duas pessoas diferentes, comportamento correto.

---

## 6. Métricas F6 → F6-FIX (105 vidas)

| Métrica | F6 | F6-FIX |
|---|---|---|
| Sem amigo aos 10 | 80/105 | 80/105 |
| Sem amigo aos 18 | 6/105 | 6/105 |
| Sem amigo aos 30 | 1/105 | 1/105 |
| Idade do 1º amigo | mediana 12 · p90 15 | mediana 12 · p90 15 |
| Amigos **ativos** ao fim (mediana / máx) | 2 / 5 | **2 / 5** |
| Vidas com 0 amigos ativos | 25 | **28** |
| Vidas com 5+ ativos | 16 | **10** |
| NPCs sem nome | 0 | 0 |
| NPCs sem origem | 0 | 0 |
| **NPCs visíveis em Pessoas e ausentes de Relacionamentos** | **todos os colegas** | **0** |
| **NPCs sociais sem ação possível** | **todos os colegas** | **0** |
| **Locks de RNG exibidos como culpa do jogador** | **39** | **0** |
| Locks de trajetória (legítimos) | 0 | 0 |
| Memórias com âncora biográfica | 270/289 | **287/289** |

A variedade §23 melhorou: mais vidas de poucos vínculos, menos vidas de rede
grande. Continua havendo vida isolada como resultado legítimo.

---

## 7. Regressões (§29) — todas preservadas

| Guard | Resultado |
|---|---|
| F4 · violações de pressuposto | **0/186 (0,0%)** |
| F4 · cobertura do catálogo | 131/134 (os 3 de sempre) |
| F3 · conversão do scheduler | **100,0%**, 0 falhas |
| F3 · anos com 2+ interrupções obrigatórias | **0** |
| F5-FIX · gaps ≥3 na infância | **0/105**, maior gap 2 |
| F5-FIX · repetição temática 1/2/3 anos | **0 / 0 / 0** |
| Densidade | 1,831 → 1,812 linhas/ano |
| Silêncio | preservado (3-5 continua 67,6% sem conteúdo) |

Nenhum NPC pet acidental, nenhuma amizade garantida artificialmente, nenhum
evento novo adicionado.

---

## 8. Save (§28)

**`VERSAO_SAVE` continua 5. Nenhuma migração.**

Nada foi persistido a mais. A distinção trajetória/RNG é **derivada** de
`historicoEventosDisparados`, que existe no save desde sempre; o impacto
comportamental do ano é transitório, aplicado no traço que já era salvo. O
teto de convivência é constante de código.

---

## 9. Testes (§30)

**1020 passando** (1000 antes, **+20**), typecheck e build limpos.

Os canários vivem em `src/systems/social/__tests__/canariosF6Fix.test.ts` e
protegem **semântica, não ids** — nenhum conhece "Luiz" ou `ado_cola_prova`;
o §19 procura no catálogo qualquer opção travada por flag.

### Verificação por mutação

| Mutação | Resultado |
|---|---|
| Remover `'colega'` da fonte única | **3 falham** ✔ |
| `TETO_CONVIVIO_PASSIVO` 70 → 100 | **1 falha** ✔ |
| Postura escolar deixa de gerar impacto | **1 falha** ✔ |
| Devolver a frase de filler | **1 falha** ✔ |
| `'nunca_oferecido'` vira `'trajetoria'` | **1 falha** ✔ |

Nenhum teste existente foi alterado — os 1000 anteriores continuam válidos
sem edição, o que é o sinal de que nada virou contrato obsoleto.

---

## 10. Limitações

- **Os 39 locks de RNG continuam existindo no dado.** A correção impede que
  sejam apresentados como culpa do jogador, mas a opção some em vez de ser
  alcançável. Tornar os antecedentes garantíveis exige conteúdo/calendário —
  §27 manda documentar, não expandir.
- **`inf_aula_musica` e `esc_achado_perdido_dinheiro` nunca disparam** em 105
  vidas. É escassez estrutural (~20 candidatos por ano competindo).
- **Locks de trajetória continuam em 0** pela mesma razão: nenhum jogador
  chegou a ver um antecedente. O mecanismo está pronto e testado; falta o
  conteúdo aparecer.
- **O teto passivo é global**, não varia por ambiente.
- **Conflito e reconciliação continuam não implementados** (`rival` existe no
  catálogo, mas nada o cria nem resolve).
- A faixa **3-5 segue sem vida social**, por desenho.

---

## 11. Adiado, com destino

| Item | Fase |
|---|---|
| **Gravidez, gestação, concepção, parto, fertilidade** — e "namoro → filho imediato" | **F6.5** |
| Garantir antecedentes de flag (janela/calendário) ou aceitar evidências equivalentes | **F6.5** |
| Conflito, rivalidade ativa, reconciliação | F6.5 |
| Amigos com trajetória própria (mudar de cidade/emprego) | F6.5 |
| Choque financeiro aos 18 (F7-P1) · padrão `luxuoso` inalcançável (F7-P2) | **F7** |
| `narrativeVariants` repetindo texto por até 8 anos | F7 |
| Predicado de escolaridade (`ado_trote_festa`, `ado_preparacao_enem`) | **F8** |
| Gênero ausente do pipeline visual | **F9** |

Economia, Avatar, educação regional, custo de filhos, aposentadoria e
patrimônio **não foram tocados**.
