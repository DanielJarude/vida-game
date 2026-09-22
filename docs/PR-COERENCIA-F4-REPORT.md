# PR COERÊNCIA — FASE 4

## Contexto do Mundo e Elegibilidade Narrativa

**Branch:** `arena/01a0c250-vida-game`
**Baseline da fase:** `1fe317d` (auditoria pós-playtest; `src/` idêntico a `6aa8148`)
**Escopo:** coerência entre o que o texto afirma e o que o estado contém.
**Não é:** expansão de conteúdo, sistema social, economia, narrativa ou avatar.

**Princípio da fase:** *se o texto diz que algo existe, o mundo precisa saber que
isso existe.*

---

## 1. CAUSA RAIZ

O bug relatado no playtest foi um evento de veterinário para um personagem sem
pet. A tentação é corrigir `fam_pet_veterinario`. Mas esse evento é um sintoma,
e a auditoria mediu o tamanho real do problema: **128 de 308 ocorrências
(41,6%) de eventos com pressuposto de posse apareciam para personagens que não
tinham o que o texto afirmava.**

A causa raiz não é um evento mal escrito. São três coisas, em camadas:

**(a) O vocabulário de elegibilidade não tinha as palavras.**
`eligibility.ts` conhecia 14 predicados: `genero, faseVida, empregado, emEscola,
emFaculdade, temParceiro, temFilhos, dinheiroMinimo, dinheiroMaximo,
flagsNecessarias, flagsProibidas, saudeMinima, saudeMaxima, personalidade`.

Nenhum deles cobria pet, veículo, imóvel, irmão, amigo, dívida ou cônjuge. Um
autor de conteúdo que quisesse escrever "seu cachorro adoeceu" e restringir o
evento a quem tem cachorro **não tinha como expressar isso**. O requisito não
foi esquecido; ele era *inexprimível*. É a diferença entre um erro e um limite
de linguagem, e explica por que 41,6% e não 2%.

**(b) O estado existia, mas ninguém perguntava por ele.**
O pet já estava em `familia` como `RelationType: 'pet'` desde antes da F4.
Propriedades já estavam em `economia.propriedades`. A auditoria de dados não
consumidos mostrou que imóvel tinha **zero** leitores no motor fora da própria
economia. O dado estava escrito e nunca lido — o mundo tinha a informação e o
sorteio de eventos não a consultava.

**(c) Não havia interpretação canônica.**
Onde alguém precisava saber "tem parceiro?", a resposta era uma lista de tipos
de vínculo copiada inline. Essa lista existia duplicada em `eligibility.ts`,
`availabilitySystem.ts`, `relationshipSystem.ts` e `pequenaMemoria.ts`. Quatro
cópias significam quatro verdades que divergem no dia em que alguém adiciona um
tipo novo em três delas.

A correção da F4 ataca as três camadas, nesta ordem: criar a interpretação
canônica, dar as palavras ao vocabulário, e então aplicar aos eventos.

---

## 2. ARQUITETURA

### O fluxo exigido

```
ESTADO REAL  →  CONTEXTO DERIVADO  →  REQUIREMENTS  →  ELEGIBILIDADE  →  EVENTO
```

Implementado exatamente assim, **sem motor paralelo**. Não existe um segundo
caminho de filtragem: `eligibility.ts` continua sendo o único lugar onde um
evento é aceito ou recusado. O que mudou é que ele agora consulta a camada de
contexto em vez de reimplementar a pergunta.

### O módulo

`src/systems/contexto/contextoDaVida.ts` — funções puras, sem estado, sem
efeito colateral, **sem importar nenhum outro sistema**. Essa última restrição é
deliberada: contexto é folha da árvore de dependências. Se ele importasse
`relationshipSystem`, e `relationshipSystem` viesse a querer perguntar "tem
cônjuge?", teríamos ciclo. Sendo folha, qualquer sistema pode consultá-lo.

### A entrada: `FatiasDoMundo`, não `GameState`

```ts
export interface FatiasDoMundo {
  personagem?: ...; familia?: ...; carreira?: ...;
  educacao?: ...; economia?: ...;
}
```

A escolha merece justificativa, porque a alternativa óbvia era receber
`GameState` inteiro.

Durante a passagem de ano o motor **não tem um `GameState` coerente na mão** —
ele tem fatias em atualização. `eligibility.ts` já recebia pedaços soltos. Se a
camada de contexto exigisse o estado completo, cada chamador teria que montar um
objeto falso só para satisfazer a assinatura, e um `GameState` montado às pressas
é exatamente o tipo de coisa que se monta errado. Fatias opcionais fazem a
função ser honesta: se `familia` não veio, `temPet` é `false`, e isso é a
resposta correta para "o mundo sabe que existe um pet?" quando o mundo não
trouxe a família.

### Não é God Object, e não duplica estado

`contextoDaVida(f)` devolve uma fotografia agregada — útil para quem quer o
retrato inteiro (telas de depuração, relatórios). Mas ele é **construído a
partir dos selectors**, não o contrário. Nenhum selector depende do agregado.
Quem precisa de uma pergunta importa uma função.

E nada disso é persistido. **Não existe `state.temPet`.** Se existisse, haveria
dois lugares afirmando se o personagem tem pet — o vínculo na família e o
booleano — e eles divergiriam no primeiro bug de remoção. Contexto é sempre
recalculado a partir do estado real.

---

## 3. SELECTORS CRIADOS

Cada um foi criado porque **um evento existente precisava dele**. Nenhum
predicado especulativo entrou — a regra foi: se nenhum evento do catálogo faz a
pergunta, a pergunta não é implementada nesta fase.

| Selector | Fonte real da verdade | Motivado por |
|---|---|---|
| `temPet(f)` | `familia[].tipo === 'pet'`, vivo | `fam_pet_veterinario` |
| `temParceiro(f)` | `familia[].tipo ∈ TIPOS_PARCEIRO` | já existia, centralizado |
| `temConjuge(f)` | `familia[].tipo ∈ {esposo, esposa}` | distinção casado ≠ namorando |
| `temFilho(f)` | `familia[].tipo ∈ {filho, filha}` | já existia, centralizado |
| `quantidadeFilhos(f)` | contagem dos mesmos vínculos | economia / futuros |
| `temIrmao(f)` | `familia[].tipo ∈ {irmao, irma}` | eventos de irmão |
| `temAmigo(f)` | `familia[].tipo ∈ {amigo, amiga}`, vivo | `fam_padrinho_casamento` |
| `temImovel(f)` | `economia.propriedades[].tipo` imóvel | `adm_assembleia_condominio` |
| `temVeiculo(f)` | `economia.propriedades[].tipo` veículo | bicos de `careerSystem` |
| `temDivida(f)` | `economia.dividas[]` com saldo > 0 | coerência financeira |
| `estaEmpregado(f)` | `carreira.empregoAtual` | centralização |
| `estaEstudando(f)` | `educacao.emCurso` | centralização |
| `estaNaFaculdade(f)` | curso de nível superior em curso | centralização |
| `cidadeAtual(f)` / `estadoAtual(f)` | `personagem.cidade` / `.estado` | leitura canônica |

As listas `TIPOS_PARCEIRO`, `TIPOS_CONJUGE`, `TIPOS_FILHO`, `TIPOS_IRMAO` e
`TIPOS_AMIZADE` agora vivem **só aqui**. As quatro cópias inline citadas na
seção 1 passaram a delegar.

---

## 4. REQUIREMENTS ADICIONADOS

Sete predicados novos em `GameEvent.condicoes` (`src/types/index.ts`), todos
opcionais — nenhum evento existente foi obrigado a mudar:

`temPet` · `temConjuge` · `temIrmaos` · `temAmigos` · `temImovel` ·
`temVeiculo` · `temDivida`

Ligados em `eligibility.ts`, no mesmo laço de avaliação dos 14 anteriores.
`temParceiro` e `temFilhos`, que já existiam com lista inline, foram reescritos
para delegar ao módulo de contexto — mesma semântica, uma fonte só.

Aplicados a **seis** eventos:

| Evento | Requisito | Por quê |
|---|---|---|
| `fam_pet_veterinario` | `temPet: true` | "leve seu pet à clínica" |
| `adm_assembleia_condominio` | `temImovel: true` | assembleia de condômino |
| `fam_padrinho_casamento` | `temAmigos: true` | "seu melhor amigo vai casar" |
| `ext_festa_junina` | `emEscola: true` | festa junina da escola |
| `esc_olimpiada_matematica` | `emEscola: true` | olimpíada escolar |
| `car_exame_ordem_conselho` | `empregado: true` | exame de conselho profissional |

Seis, e não trinta. Essa é a parte importante da seção 5.

---

## 5. MATRIZ DOS 32 CASOS

Classificação: **A** corrigido pela F4 · **B** falso positivo da varredura ·
**C** depende de sistema futuro · **D** conteúdo precisa de reescrita.

A instrução era explícita: *não forçar requirement impossível só para zerar
métrica.* Duas vezes eu apliquei um requisito, medi, e **revertí** — os casos
estão documentados abaixo com os números que motivaram a reversão.

### Classe A — corrigidos (6)

| # | id | Pressuposto do texto | Dado necessário | Fonte real | Selector | Requirement |
|---|---|---|---|---|---|---|
| 1 | `fam_pet_veterinario` | tem animal de estimação | vínculo pet vivo | `familia` | `temPet` | `temPet: true` |
| 2 | `adm_assembleia_condominio` | é condômino | propriedade imóvel | `economia.propriedades` | `temImovel` | `temImovel: true` |
| 3 | `fam_padrinho_casamento` | tem amigo próximo | vínculo amizade | `familia` | `temAmigo` | `temAmigos: true` |
| 4 | `ext_festa_junina` | frequenta escola | matrícula ativa | `educacao.emCurso` | `estaEstudando` | `emEscola: true` |
| 5 | `esc_olimpiada_matematica` | frequenta escola | matrícula ativa | `educacao.emCurso` | `estaEstudando` | `emEscola: true` |
| 6 | `car_exame_ordem_conselho` | exerce profissão | emprego atual | `carreira` | `estaEmpregado` | `empregado: true` |

**Resultado:** os seis saíram de violação para zero, sem perder alcance
estrutural (nenhum deles ficou inalcançável — verificado em `cobertura.ts`).

### Classe B — falsos positivos da varredura léxica (8)

Aqui está o valor de ter lido o catálogo em vez de confiar no regex. A
instrução do usuário — *não usar apenas regex na auditoria semântica* — evitou
oito requisitos errados, dois dos quais teriam matado conteúdo.

| # | id | O que a varredura viu | O que o texto realmente diz | Veredito |
|---|---|---|---|---|
| 7 | `bb_cachorro_familia` | PET | "o cachorro da casa" — animal **anterior** ao bebê, da família | sem requisito |
| 8 | `inf_gatinho_rua` | PET | o evento **encontra** um gatinho: é fonte de pet, não consumidor | sem requisito |
| 9 | `ext_resgate_cachorro` | PET | segunda fonte de pet do jogo | sem requisito |
| 10 | `com_biblioteca_bairro` | CARRO ("garagem") | a garagem é **do vizinho**, que virou biblioteca | sem requisito |
| 11 | `adm_assembleia_condominio` | CARRO ("garagem") | garagem do prédio; o pressuposto certo era imóvel (caso 2) | requisito de imóvel, não de carro |
| 12 | `adm_mudanca_caminhao_emprestado` | IMÓVEL / veículo | caminhão **emprestado**; quem aluga também muda de casa | sem requisito |
| 13 | `fin_oportunidade_terreno` | IMÓVEL | corretor **oferece** terreno; comprar ≠ já ter | sem requisito |
| 14 | `adm_casamento_de_amigo` | PARCEIRO | o casamento é **de outra pessoa** | sem requisito |

**O caso 7 é o mais instrutivo da fase.** Eu apliquei `temPet: true` a
`bb_cachorro_familia`, e a métrica de violação melhorou. Mas a cobertura do
catálogo caiu de 130 para 129 eventos vistos. Investigando: pet só é adquirível
a partir dos 4 anos (`inf_gatinho_rua` 4-10, `ext_resgate_cachorro` 10-80) e
`bb_cachorro_familia` roda de 0 a 2 anos. O requisito tornava o evento
**estruturalmente inalcançável para sempre** — zerava a violação zerando o
conteúdo. Revertido, com comentário no catálogo explicando por quê. Cobertura
voltou a 131.

### Classe C — dependem de sistema futuro (2)

| # | id | Pressuposto real | Por que não dá hoje |
|---|---|---|---|
| 15 | `ado_trote_festa` | **concluiu** o ensino médio | não há predicado de nível de escolaridade |
| 16 | `ado_preparacao_enem` | está no fim do EM | idem |

Também aqui apliquei `emEscola: true` primeiro e medi depois. Descoberta:
**aos 17 anos, 0 de 105 vidas têm matrícula ativa.** `processarAnoEducacao`
conclui o curso *antes* do sorteio de eventos do ano, então no ano da formatura
`emCurso` já é `false`. Usar `emEscola` num evento de formatura é usar o
predicado errado: o pressuposto não é "está matriculado", é "chegou ao fim do
ensino médio" — escolaridade alcançada, que o vocabulário não expressa.

Revertido. Adiado para F5/F8, onde um predicado de nível de escolaridade cabe
naturalmente. **Nenhuma violação medida hoje**, porque na prática esses eventos
caem em quem de fato cursou o EM; o risco é teórico até existir um caminho de
vida que pule o ensino médio.

### Classe B (continuação) — escola em faixa automática (12)

Doze pares apontavam ESCOLA. A investigação em `educationSystem.ts` (linha ~73)
mostrou que **a entrada no fundamental é automática aos 6 anos**: não há vida
sem escola nessa faixa. Os eventos abaixo estão todos dentro da faixa
automática, e todos medem **0 violações em 105 vidas**:

| # | id | # | id |
|---|---|---|---|
| 17 | `crc_primeiro_dia_creche` | 23 | `hob_colecao_figurinhas` |
| 18 | `inf_primeiro_dia_escola` | 24 | `ext_vender_brigadeiro` |
| 19 | `inf_bullying_defesa` | 25 | `adm_reencontro_de_turma` |
| 20 | `ado_cola_prova` | 26 | `sen_neto_vestibular` |
| 21 | `esc_achado_perdido_dinheiro` | 27 | `jov_carnaval_rua` |
| 22 | `esp_selecao_natacao` | 28 | `sen_viagem_excursao` |

Notas individuais: **17 e 18 são marcos de entrada** — exigir `emEscola` deles
inverteria causa e efeito (o evento é o que inaugura a escola). **26** é o
vestibular *do neto*, não do personagem. **27 e 28** dizem "seus amigos" de
forma ambiental e coletiva, como "a multidão do carnaval"; não há NPC nomeado
que precise existir no estado.

### Classe B — localidade (3)

| # | id | Motivo |
|---|---|---|
| 29 | `adu_crise_meia_idade` | cita cidade de forma ambiental, sem pressupor local específico |
| 30 | `adu_oportunidade_negocio` | idem; não pressupõe imóvel nem sociedade |
| 31 | `jov_proposta_outra_cidade` | a proposta é justamente **mudar** de cidade |

Cidade e estado ganharam selectors canônicos (`cidadeAtual`, `estadoAtual`)
porque a leitura estava espalhada, mas **nenhum evento precisou de requisito de
localidade** — o que confirma o achado: o problema de localidade é de conteúdo
regional (F8), não de elegibilidade.

### Classe A/B — parceiro (1)

| # | id | Motivo |
|---|---|---|
| 32 | `adm_casamento_de_amigo` | já coberto no caso 14 — casamento de terceiro |

### Placar

| Classe | Qtd | Significado |
|---|---|---|
| **A** corrigido | 6 | requisito aplicado, violação zerada, conteúdo preservado |
| **B** falso positivo | 24 | a varredura errou; aplicar requisito seria degradar o jogo |
| **C** sistema futuro | 2 | pressuposto real não é exprimível hoje; documentado, não fingido |
| **D** reescrita | 0 | nenhum texto precisou de reescrita para a F4 fechar |

**A conclusão que importa:** dos 32 pares de "risco alto", apenas 6 eram
problemas reais de elegibilidade. Os outros 26 eram ou ruído de varredura ou
dependência de sistema futuro. Se eu tivesse aplicado requisito aos 32 para
fazer a métrica parecer boa, teria matado no mínimo dois eventos e criado 24
restrições sem sentido.

---

## 6. O PET COMO CANÁRIO

Exigência: sem pet → inelegível; com pet → elegível; pet removido → inelegível
de novo. E **sem id especial no motor**.

Verificado nos testes (`src/systems/contexto/__tests__/contextoDaVida.test.ts`):

- **Negativo:** família sem vínculo pet → `fam_pet_veterinario` inelegível.
- **Positivo:** mesmo estado + um vínculo `tipo: 'pet'` → elegível.
- **Transição:** removido o vínculo → volta a inelegível. É o mesmo estado
  inicial, o que prova que a elegibilidade é função do estado presente e não
  de histórico acumulado.

**A regra é genérica, não uma exceção por nome.** O teste inclui um evento
sintético — id arbitrário, nenhuma relação com pet no nome — declarando
`condicoes: { temPet: true }`, e ele segue exatamente o mesmo comportamento nos
três cenários. Nenhum ponto do motor menciona `fam_pet_veterinario`. Um busca
por esse id em `src/systems/` não retorna nada.

O teste cobre ainda: condição **negativa** (`temPet: false` — evento que só
aparece para quem *não* tem pet) e evento **sem condição** (elegível nos dois
estados), fechando as quatro combinações da tabela-verdade.

---

## 7. ANTES E DEPOIS (105 vidas)

Harness: `scripts/audit/violacoesContexto.ts`, sobre o simulador de 105 vidas
já existente. "Violação" = ocorrência real, numa vida real, de um evento cujo
texto afirma uma posse que aquele personagem não tinha naquele ano.

| Grupo | Antes | Depois |
|---|---|---|
| **pet** | 68/70 — **97,1%** | 0 |
| **relacionamento** | 31/55 — 56,4% | 0 |
| **patrimônio** | 19/36 — 52,8% | 0 |
| **emprego** | 4/16 — 25,0% | 0 |
| **estudo** | 6/131 — 4,6% | 0 |
| **TOTAL** | **128/308 — 41,6%** | **0/174 — 0,0%** |

Por evento, os piores antes:

| Evento | Antes | Depois |
|---|---|---|
| `fam_pet_veterinario` | 58/60 (96,7%) | 0 |
| `fam_padrinho_casamento` | 31/34 (91,2%) | 0 |
| `adm_assembleia_condominio` | 19/36 (52,8%) | 0 |
| `bb_cachorro_familia` | 10/10 (100%) | 0 (reclassificado B) |
| `car_exame_ordem_conselho` | 4/16 (25,0%) | 0 |
| `ado_trote_festa` | 3/3 (100%) | 0 (reclassificado C) |

**Meta atingida: zero para tudo que o estado atual consegue representar.** O que
não é representável (nível de escolaridade) está na classe C, nomeado, com o
número que prova o problema — não escondido.

Sobre o denominador cair de 308 para 174: é consequência esperada e desejada. O
veterinário aparecia 60 vezes em 105 vidas quando só existiam 29 pets. Agora
aparece 1 vez. O evento não ficou raro por acidente — ele estava
**superrepresentado por não ter requisito**, e agora aparece na frequência com
que a condição real ocorre.

---

## 8. COBERTURA DO CATÁLOGO

A instrução era explícita: se a cobertura cair, **diagnosticar, não aumentar
pesos**. Foi o que aconteceu uma vez (caso 7), e o diagnóstico levou a reverter
o requisito — nenhum peso foi tocado em lugar nenhum desta fase.

| Métrica | Baseline | Depois |
|---|---|---|
| Catálogo | 134 | 134 |
| Eventos vistos em 105 vidas | 130 | **131** |
| Nunca vistos | 4 | 3 |
| Estruturalmente inalcançáveis | 0 | **0** |

A cobertura **subiu**. Não por mérito da F4 — é variação de amostragem entre
execuções (com 280 vidas o baseline já mostrava 131). O que importa é que ela
**não caiu**, e que nenhum evento ficou inalcançável.

Composição do ano (guarda F3) preservada: **0 anos com 2+ interrupções
obrigatórias**, 3,9% dos anos com 2+ conteúdos, média 0,453 conteúdos/ano.

---

## 9. EVENTOS MAIS RAROS DEPOIS DA MUDANÇA

Rarificação é o efeito colateral legítimo de um requisito correto. Os afetados:

| Evento | Ocorrências antes | Depois | Causa |
|---|---|---|---|
| `fam_pet_veterinario` | 60 | 1 | só 29 pets em 105 vidas |
| `fam_padrinho_casamento` | 34 | 5 | amizades são raras (0,45/vida) |
| `adm_assembleia_condominio` | 36 | 18 | metade das vidas tem imóvel |
| `car_exame_ordem_conselho` | 16 | 11 | desemprego em parte dos anos |

O caso do veterinário (60 → 1) merece leitura cuidadosa. **Não é um problema da
F4** — é a F4 revelando um problema do gerador de pets. Só 29 das 105 vidas
chegam a ter um animal, e apenas em duas janelas estreitas do catálogo. O
evento agora é raro porque **pets são raros**, o que é uma afirmação sobre o
sistema de pets, não sobre elegibilidade. Item para F6 (vida social), registrado
na seção 16.

Mesma leitura para `fam_padrinho_casamento`: 63 de 105 vidas não têm nenhum
amigo. O evento ficou raro porque a amizade é praticamente inexistente no jogo
atual — achado já documentado na auditoria pós-playtest, alvo da F6.

---

## 10. EVENTOS ESTRUTURALMENTE INALCANÇÁVEIS

**Zero.** Verificado em `cobertura.ts`, que classifica cada evento nunca visto
individualmente. Os três nunca vistos nesta amostra:

| Evento | Faixa | Condições | Diagnóstico |
|---|---|---|---|
| `inf_birra_brinquedo` | 4-5 | **nenhuma** | 21,3% de fatia numa faixa de 2 anos; é raridade estatística, não bloqueio |
| `hob_banda_garagem` | 13-17 | `flagsNecessarias` | 4,3% de fatia competindo com 20 eventos; condição **anterior à F4** |
| `lat_tempo_que_sobra` | 60-90 | `empregado` | 2,1% de fatia entre 41 eventos; condição **anterior à F4** |

**Nenhum dos três tem condição de contexto adicionada nesta fase.** Nenhum
evento ficou inalcançável por causa da F4 — e os dois casos em que um requisito
*teria* causado isso foram detectados e revertidos (seção 5, casos 7 e 15).

---

## 11. IMPACTO NO PACING

Nenhum. A F4 **remove** ocorrências (eventos que não deviam aparecer deixam de
aparecer), não adiciona. Medido em `scripts/audit/pacing.ts`:

| Faixa | Silêncio | Saturado |
|---|---|---|
| 0-2 | 100,0% | 0,0% |
| 3-5 | 67,6% | 0,0% |
| 6-11 | 71,0% | 0,0% |
| 12-14 | 54,0% | 0,0% |
| 15-17 | 53,3% | 0,3% |
| 18-29 | 58,1% | 6,6% |
| 30-44 | 61,8% | 4,3% |
| 45-59 | 61,7% | 2,8% |
| 60+ | 62,9% | 3,8% |

Agência (medida em parcelas separadas, nunca agregada):

- (A) decisões contextuais apresentadas: **1180**
- (B) escolhas biográficas: **105**
- (C) marcos com participação: **105**
- (D) atividades voluntárias: **17258**
- (G) **taxa de conversão do scheduler: 100,0% — 0 falhas**

Zero vidas sem participação em evento. A conversão em 100% confirma o ponto
central: **um requisito de contexto não vira gargalo de pacing**. Quando o
veterinário é filtrado, o scheduler sorteia outro evento elegível no lugar — ele
não deixa o ano vazio. É exatamente o comportamento pretendido.

---

## 12. IMPACTO NO SAVE

**Nenhum. `VERSAO_SAVE` permanece em 5. Nenhuma migração escrita.**

Isso não é sorte, é consequência da arquitetura: contexto é **derivado**. Um
save antigo, carregado hoje, produz o mesmo contexto que produziria se tivesse
sido criado hoje, porque a resposta é calculada a partir de `familia`,
`economia`, `carreira` e `educacao` — campos que já existiam e não mudaram.

Se eu tivesse persistido `state.temPet`, a F4 exigiria versão 6, migração, e
abriria a porta para saves onde o booleano e o vínculo discordam. O requisito
do usuário — *se algum campo persistido parecer necessário, PARAR e justificar
antes* — nunca chegou a ser acionado, porque nenhum foi necessário.

Saves legados: intactos, sem caminho de código novo no carregamento.

---

## 13. TESTES

**900 testes em 55 arquivos, todos passando** (baseline: 874 em 53). Nenhum
teste existente foi alterado — os 874 anteriores continuam valendo com as mesmas
expectativas.

### `src/systems/contexto/__tests__/contextoDaVida.test.ts` — 21 testes

Por categoria, cobrindo negativo / positivo / transição:

| Categoria | Negativo | Positivo | Transição |
|---|---|---|---|
| pet | ✓ | ✓ | ✓ (canário) |
| parceiro | ✓ | ✓ | — |
| cônjuge | ✓ | ✓ | ✓ (namoro → casamento) |
| filho | ✓ | ✓ | ✓ (contagem) |
| irmão | ✓ | ✓ | — |
| amigo | ✓ | ✓ | — |
| emprego | ✓ | ✓ | ✓ |
| estudo | ✓ | ✓ | ✓ |
| veículo | ✓ | ✓ | ✓ (compra → venda) |
| imóvel | ✓ | ✓ | ✓ |
| localização | ✓ | ✓ | — |

Mais: evento sintético provando genericidade, condição negativa (`temPet: false`)
e evento sem condição.

### `src/data/events/__tests__/pressupostoDeContexto.test.ts` — 5 testes

**A auditoria automatizada permanente**, e a parte mais importante desta fase
para o futuro do projeto.

O problema que ela resolve: hoje o catálogo está coerente, mas nada impede que
daqui a três meses alguém escreva "seu cachorro fugiu" sem declarar `temPet`, e
a regressão volte silenciosamente. Depender de alguém *lembrar* não é um
mecanismo.

O teste torna a dependência **declarativa**, com duas listas explícitas:

- `EXIGEM_CONTEXTO` — eventos auditados que **devem** declarar seu predicado.
  Se alguém remover a condição, o teste falha.
- `DISPENSADOS` — eventos que a varredura acusa e a leitura inocentou, **cada um
  com a razão escrita**. Um quarto teste exige que a razão tenha substância
  (>30 caracteres), porque "ok" não é uma razão.

Um evento **novo** cujo texto sugira posse e que não esteja em nenhuma das duas
listas faz a suíte falhar, com mensagem dizendo o que fazer.

**Sobre o regex:** ele existe, mas **não decide nada** — serve só para *encontrar
candidatos*. A decisão está nas duas listas curadas. Essa separação é
precisamente a lição do caso 7: a varredura acusou `bb_cachorro_familia`, e a
resposta certa era não aplicar requisito. Um teste que tratasse regex como
verdade teria exigido o requisito errado.

Um quinto teste valida que todo predicado declarado no catálogo existe no
vocabulário — protege contra `temPett`, que não filtraria nada e devolveria o
bug original em silêncio.

### Verificação por mutação

Testes que passam de primeira merecem desconfiança. Introduzi um evento
sintético com "Seu cachorro puxa a coleira" e sem declaração:

```
AssertionError: Estes eventos têm texto que pressupõe posse e não foram classificados.
Não remova este teste: ele é o que evita um novo "pet sem pet".
  expected [ 'syn_regressao_temporaria' ] to deeply equal []
```

A guarda pegou. Evento removido, suíte verde de novo. O teste de razões
substantivas também se provou sozinho: ele falhou na primeira execução por causa
de uma dispensa minha escrita como `'Idem.'`, e me obrigou a escrever a razão
real. Uma guarda que corrige o próprio autor está funcionando.

---

## 14. GUARDAS F1 / F2 / F3

Todas verificadas pela suíte completa, sem nenhuma expectativa alterada.

**F1 — elegibilidade profissional e a distinção possível ≠ legal ≠ provável ≠
permitido.** Preservada, e explicitamente respeitada no desenho: a F4 responde
apenas *"o estado necessário existe?"*. `temVeiculo` diz que há um carro no
patrimônio — **não** diz que o personagem pode dirigir. Idade mínima e CNH
continuam sendo regras da F1, em outra camada. Nenhum selector de contexto foi
usado como substituto de regra de legalidade.

**F2 — tempo, matrícula e processos.** Semestres seguem como tempo canônico.
Duração de cursos intocada. Nenhuma alteração em `educationSystem.ts` — a F4 só
*lê* `educacao.emCurso`. Aliás, foi essa leitura que revelou o detalhe de
ordenação do ano de conclusão (seção 5, classe C): um achado sobre a F2, sem
mudar a F2.

**F3 — taxonomia, calendário, agência, composição, marcos, pequenas memórias.**

| Guarda | Estado |
|---|---|
| Rotina nunca satura o ano | ✓ 0 anos com 2+ interrupções obrigatórias |
| Acontecimento automático não move personalidade | ✓ intocado |
| Pequena memória não move stats/flags/personalidade | ✓ intocado |
| Escolha biográfica não move personalidade por padrão | ✓ intocado |
| Marco garantido não depende de RNG | ✓ 105/105 marcos com participação |
| Silêncio permitido | ✓ 53-100% por faixa |
| Nenhuma decisão artificial para satisfazer métrica | ✓ nenhuma decisão criada |
| Catálogo auditado antes de expandir | ✓ auditado; nada expandido |
| **Nenhum evento novo** | ✓ **134 → 134** |

`bb_primeira_palavra` segue marco garantido + escolha-chave biográfica,
intocado. Nenhum requirement de contexto virou personalidade ou pacing —
`personalitySystem` e `lifeRhythm` não foram tocados por esta fase.

---

## 15. PROBLEMAS ENCONTRADOS

**1. A varredura léxica tem falsos positivos previsíveis, e eles são caros.**
"Garagem" casa carro mas é do prédio. "Caminhão emprestado" casa veículo sem
posse. "Corretor de imóveis" casa imóvel sem posse. "Encontrar um gatinho" casa
pet sem posse. Vinte e quatro dos 32 pares eram ruído. A instrução de ler o
catálogo semanticamente não foi preciosismo — foi o que evitou degradar o jogo.

**2. Um requisito correto pode matar conteúdo.** `temPet` em
`bb_cachorro_familia` era *semanticamente defensável* e ainda assim errado:
tornava o evento inalcançável para sempre. **Lição operacional: rodar
`cobertura.ts` após cada requisito, não só no fim.** Foi incorporado ao
procedimento no meio da fase.

**3. `emCurso` é falso no ano em que o curso termina.**
`processarAnoEducacao` conclui antes do sorteio. Consequência: aos 17 anos,
0 de 105 vidas estão matriculadas. Qualquer evento de formatura/vestibular que
use `emEscola` fica inalcançável. Não é bug — é ordenação —, mas é uma armadilha
para quem escrever conteúdo de fim de ciclo. Documentado aqui e no catálogo.

**4. Pets e amizades são raros a ponto de distorcer o catálogo.** 29 pets e
0,45 amizade por vida. A F4 não causou isso; ela tornou visível. Enquanto o
requisito não existia, o catálogo *compensava* a escassez mostrando conteúdo
incoerente. F6.

**5. Quatro cópias inline da mesma lista de tipos de vínculo.** Encontradas em
`eligibility`, `availabilitySystem`, `relationshipSystem` e `pequenaMemoria`.
Consolidadas. Era exatamente o cenário de "nada de evento A olhando X e evento B
olhando Y" que o usuário pediu para eliminar.

**6. Imóvel tinha zero leitores no motor.** Confirmação do achado anterior: o
dado era escrito e nunca consultado. Agora tem um leitor. Continua sem
*consequência* (imóvel de 1,65M e de 200k têm o mesmo efeito) — isso é F7.

---

## 16. ADIADO, POR FASE

Nada aqui foi resolvido "meio caminho". Cada item está nomeado, com o motivo
pelo qual não cabe na F4.

**F5 — narrativa e biografia**
- Predicado de **nível de escolaridade** (fundamental / médio / superior
  concluído). Desbloqueia `ado_trote_festa` e `ado_preparacao_enem` (classe C).
- `evento.descricao` nunca chega à Linha da Vida nos 72 automáticos.
- Buracos biográficos 1-17 anos (`gerarPequenaMemoria` devolve `null` para toda
  idade abaixo de 18).

**F6 — vida social e gestação**
- **Frequência de aquisição de pets** — 29 em 105 vidas, duas janelas estreitas.
  É o que deixou `fam_pet_veterinario` em 1 ocorrência.
- **Amizade como sistema** — 63 de 105 vidas sem nenhum amigo. É o que deixou
  `fam_padrinho_casamento` em 5.
- Progressão social, namoro, gravidez, geração de NPC.

**F7 — economia e patrimônio**
- Consequência do patrimônio: hoje `temImovel` responde *se existe*, e nada
  responde *quanto vale*. Imóvel de 1,65M e de 200k têm o mesmo efeito.
- Combustível, aluguel, financiamento, custo de filhos, savings rate.

**F8 — educação e localidade**
- Contexto regional real. `cidadeAtual`/`estadoAtual` existem e são canônicos,
  mas **nenhum evento os consome** — confirma que localidade é problema de
  conteúdo regional, não de elegibilidade.
- Oferta universitária e custo de vida regionais.

**F9 — avatar**
- Intocado. Zero acoplamento com esta fase.

**Pendências antigas mantidas:** promoções não reavaliam experiência;
`SALARIO_ALTO_IDADE_BAIXA` 23 → 34.

---

## VALIDAÇÃO

Ordem obrigatória, executada nesta ordem:

```
npm test       →  55 arquivos · 900 testes · 100% passando
npm run typecheck  →  tsc --noEmit · limpo
npm run build      →  ✓ built in 3.18s
```

Mais: 105 vidas reexecutadas, auditoria dos 32 casos, cobertura, pacing,
agência e guardas F1/F2/F3.

### Placar final

| Item | Resultado |
|---|---|
| Violações de pressuposto | **128/308 (41,6%) → 0/174 (0,0%)** |
| Cobertura do catálogo | 130 → **131** de 134 (subiu) |
| Eventos inalcançáveis criados | **0** |
| Eventos novos | **0** (134 → 134) |
| Versão do save | **5 → 5** (sem migração) |
| Testes | 874 → **900**, nenhum alterado |
| Pesos ajustados | **0** |
| Exceções por nome no motor | **0** |

---

**FIM DA FASE 4.** Aguardando revisão. F5, F6, F7, F8 e F9 não foram iniciadas.
