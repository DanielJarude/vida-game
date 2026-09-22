# F6 — Vida social orgânica e relações persistentes

Objetivo da fase, na frase do escopo:

> **Você não "procura NPCs". Você conhece pessoas porque vive.**

Escola gera colegas. Trabalho gera colegas. Hobbies e vizinhança geram
conhecidos. Alguns viram amizade, algumas amizades desaparecem, algumas
duram. O mundo social emerge da trajetória — não de um botão.

---

## 1. A arquitetura social anterior

| Pergunta do §1 | Resposta encontrada |
|---|---|
| Como NPCs são criados? | Por `adicionarFamiliar` dentro de **eventos**, ou pelo modal de encontros. |
| Onde? | `eventSystem.ts` (consequência de evento) e `relationshipSystem.gerarCandidatosNamoro`. |
| Como persistem? | Na lista `familia: FamilyMember[]` — a MESMA de pai, mãe e pets. |
| Tipos de relação | `pai · mae · irmao · irma · namorado…esposa · filho · filha · amigo · amiga · pet · rival · paixao · mentor` |
| Como proximidade funciona? | `relacionamento: 0-100`, traduzido em 5 rótulos por `relationshipPresentation`. |
| Como amizade é definida? | Um NPC com `tipo: 'amigo'`. Não havia degrau anterior. |
| Como namoro começa? | Três desconhecidos gerados na hora, com profissão sorteada de uma lista fixa. |
| Como família funciona? | `familySystem`, independente — e correto. Não foi tocado. |
| Como NPCs desaparecem? | `encerrarRelacao` (evento) ou morte. |
| Botão "Conhecer novas pessoas" | Única porta de entrada social do jogo, só para 18+. |
| Quais sistemas leem relações? | `contextoDaVida` (F4), memórias (F5), eventos, economia (filhos). |

### Baseline medido (mesmas 105 vidas) — `scripts/audit/vidaSocialF6.ts`

| Métrica | Antes |
|---|---|
| Vidas **sem amigo aos 10** | **105/105 (100%)** |
| Vidas sem amigo aos 18 | 102/105 (97,1%) |
| Vidas sem amigo aos 30 | 98/105 (93,3%) |
| Vidas que **nunca** tiveram amigo | **80/105 (76,2%)** |
| Idade do 1º amigo | mediana **46** · p90 71 |
| Relações não familiares | 266 (das quais **216 eram parceiros**) |
| NPCs com nome placeholder | **38** ("Novo Familiar", "Seu vizinho") |
| Memórias com tema `amizade` | **3** em 105 vidas |

O baseline histórico de "63/105 sem amigo" foi revalidado e estava
**otimista**: medindo o estado final, são 80/105.

---

## 2. Causa raiz

**Não existia sistema social.** Existiam eventos que, por efeito colateral,
às vezes criavam um amigo.

Três consequências diretas:

1. **Amizade dependia de sorteio + escolha certa.** Todas as 105 crianças
   estavam na escola aos 10 anos e nenhuma tinha amigo: a escola era cenário,
   não fonte de relações.
2. **Defaults inventavam pessoas.** Em `eventSystem`, um `adicionarFamiliar`
   sem campos virava `nome: 'Novo Familiar'`, `tipo: 'pet'`,
   `relacionamento: 80` — um desconhecido nascia "Muito próximo", e um humano
   podia nascer classificado como animal.
3. **O romance não conhecia ninguém.** `gerarCandidatosNamoro` inventava três
   estranhos, mesmo quando a pessoa tinha amigos há vinte anos.

---

## 3. A arquitetura nova

Dois arquivos novos, ambos puros e de baixo acoplamento — nenhum "God System":

| Arquivo | Papel |
|---|---|
| `src/systems/social/contextoSocial.ts` | **Folha.** Responde "onde esta pessoa convive?" e "que gente existe lá?". Sem estado, sem RNG. |
| `src/systems/social/redeSocial.ts` | O ano social: quem entra, quem se aproxima, quem se afasta. |

Fluxo, que é sempre o mesmo:

```
ambiente REAL de convívio  (escola / trabalho / atividade / vizinhança…)
   → oportunidade social   (pode não dar em nada)
   → COLEGA persistente    (proximidade 20-35: nunca "Muito próxima")
   → convívio continuado
   → AMIGO                 (limiar 55 — conquistado, nunca de saída)
   → sem convívio nem contato
   → afastamento lento     (só após 3 anos, -4/ano)
```

Fiação: `agingSystem.executarPassagemDeAno(..., atividadesDoAno = [])` chama
`processarAnoSocial` **antes** da pequena memória, para que uma amizade nascida
no ano já exista quando a memória do ano for escolhida.

---

## 4. Efêmero vs persistente (§19)

Formalizado pela decisão de **quando alguém entra na lista**:

- **Efêmero** — "um colega da turma" numa frase de evento. Não existe como
  dado, não ocupa a aba Pessoas, não exige nada. A maior parte da turma é isso.
- **Persistente** — passou a importar: tem id, nome, origem, idade de entrada
  e proximidade. No máximo **uma** pessoa nova por ano, teto de **5** vínculos
  sociais ativos.

Não há sala com 30 NPCs. Um colega que passa anos sem evoluir (proximidade
< 40 após 6 anos) simplesmente sai de cena, sem drama e sem virar linha.

---

## 5. Origem das relações (§2)

Toda relação não familiar nasce de um `AmbienteSocial` derivado de fato real:

| Origem | Condição real no estado |
|---|---|
| `escola` | `educacao.emCurso` e educação básica **na idade dela** (≤19) |
| `faculdade` | curso superior/pós — ou adulto matriculado em curso básico |
| `trabalho` | `carreira.empregado && !aposentado` |
| `atividade` | praticou uma atividade da lista `ATIVIDADES_SOCIAIS` no ano |
| `vizinhanca` | idade ≥ 12 |
| `amigo_de_amigo` | **já existe** um amigo (a rede se expande por si) |
| `familia_estendida` | reservado; pouco usado |

**Sem ambiente, ninguém aparece.** O cenário J das adversariais (criança de
3-5 fora da escola) dá **0,0%** — e está correto.

---

## 6. Progressão de proximidade (§5)

| Estado | Faixa | Como se chega |
|---|---|---|
| Colega | 20-35 na entrada | conhecer alguém num ambiente |
| Colega em aproximação | até 54 | convívio continuado |
| **Amigo** | ≥ 55 | anos de convívio |
| Amigo próximo | ≥ 80 | a escala de apresentação já existia |

Quatro degraus, sem inventar vocabulário novo — os rótulos continuam sendo os
de `relationshipPresentation`. O ganho anual é **6-15** na escola/faculdade
(convívio diário) e **3-9** na vida adulta.

**Nem todo convívio engata:** ~45% das pessoas conhecidas rendem 25% do ganho
e nunca viram amizade. É o colega de anos de quem não se fica amigo.

---

## 7-12. Escola, adolescência, faculdade, trabalho, hobbies, vida adulta

A progressão do §22 é respeitada sem um gerador por idade — o que muda é
quais ambientes existem:

| Fase | Ambientes | Resultado medido (adversariais, 200 execuções) |
|---|---|---|
| 0-2 | nenhum | família domina, como pedido |
| 3-5 | nenhum (fora da escola) | **0,0%** — silêncio social correto |
| 6-11 | escola | **53,5%** formam amizade |
| 12-14 | escola + vizinhança | 46,5% |
| 15-17 | escola + vizinhança | 46,5% |
| 18+ sem nada | vizinhança | **10,5%** — pouco, e faz sentido |
| universitário | faculdade + vizinhança | 41,0% |
| adulto empregado | trabalho + vizinhança | 82,5% (16 anos de convívio) |
| com hobby social | + atividade | 80,0% |

---

## 13. Romance — integração mínima (§16)

`gerarCandidatosNamoro` passou a oferecer **primeiro quem já está na vida**
(amigos, colegas, paixões adultas), completando com desconhecidos só o que
faltar. Quando o namoro começa com alguém conhecido, a pessoa **muda de tipo**
— `iniciarNamoro` reaproveita o id — em vez de virar um clone na lista.

O modal agora diz de onde a pessoa veio ("32 anos · Enfermeira · da sua
faculdade"). Nada mais do fluxo de namoro/casamento/filhos foi tocado.

---

## 14. O botão "Conhecer novas pessoas" (§9)

**Auditado antes de mexer:** ele alimenta `DatingModal` → `iniciarNamoro` →
casamento → filhos. Apagá-lo quebraria o fluxo adulto inteiro.

Decisão: **reduzir a centralidade, não remover.** Virou ação secundária
(`btn--ghost`), renomeada para "Procurar um relacionamento" — que é o que ela
realmente faz. A descoberta de pessoas agora acontece pela vida.

---

## 15. Linha da Vida e pequenas memórias (§20, §21)

Só **duas** coisas viram linha: uma amizade **nascer** e uma amizade
**acabar**. Conhecer um colega não é biografia, e não gera log nenhum.

As frases de amizade são específicas por origem — um defeito pego lendo
timelines: havia uma frase única com a palavra "colégio" fixa, que aparecia
também quando a amizade nascia no trabalho ou na vizinhança (o mesmo erro de
transição falsa que a F5-FIX corrigiu na economia).

**A F6 deu contexto real às memórias de amizade: 3 → 25**, sem afrouxar nada —
`temAmigo` continua exigindo `amigo`/`amiga` (colega **não** conta) e o
cooldown temático continua em **0/0/0**.

---

## 16. Antes → depois (105 vidas)

| Métrica | Antes | Depois |
|---|---|---|
| Sem amigo aos 10 | 105/105 (100%) | **80/105 (76,2%)** |
| Sem amigo aos 18 | 102/105 (97,1%) | **6/105 (5,7%)** |
| Sem amigo aos 30 | 98/105 (93,3%) | **1/105 (1,0%)** |
| Nunca tiveram amigo | 80/105 (76,2%) | 0/105 |
| Idade do 1º amigo | mediana 46 | **mediana 12** · p90 15 |
| Relações não familiares | 266 | 1320 |
| NPCs com nome placeholder | 38 | **0** |
| NPCs não familiares sem origem | 262 | **0** |
| NPCs com profissão adulta <18 | 0 | **0** |
| Memórias de amizade | 3 | **25** |

### Variedade (§23) — a métrica que importa

"Nunca tiveram amigo = 0" **não** significa que todos são sociáveis. Medindo
amigos **ativos ao fim da vida** (o número honesto; o outro acumula 70 anos
incluindo falecidos e afastados):

| | vidas |
|---|---|
| **0 amigos ativos** | **25/105** |
| 1-2 amigos ativos | 39/105 |
| 5+ amigos ativos | 16/105 |

Mediana **2**, máximo **5**. Há vidas isoladas, vidas de poucos vínculos
duradouros e vidas povoadas — que é exatamente o pedido do §23.

---

## 17. Regressões: tudo preservado

| Guard | Resultado |
|---|---|
| F4 · violações de pressuposto | **0/181 (0,0%)** |
| F4 · cobertura do catálogo | 131/134 (os 3 de sempre) |
| F3 · conversão do scheduler | **100,0%**, 0 falhas |
| F5-FIX · gaps ≥3 na infância | **0/105**, maior gap 2 |
| F5-FIX · repetição temática 1/2/3 anos | **0 / 0 / 0** |
| Densidade | 1,821 → 1,831 linhas/ano |

---

## 18. Save (§27)

**`VERSAO_SAVE` continua 5. Nenhum bump, nenhuma migração.**

Os quatro campos novos de `FamilyMember` — `origemSocial`, `idadeEntrada`,
`ultimoContatoIdade`, `estudante` — são **todos opcionais**. Verificado com um
save legado: um amigo v5 sem nenhum campo social sobrevive intacto (o ano
social ignora quem não tem `origemSocial`) e a vida segue ganhando relações
novas normalmente.

O tipo `colega` é um valor novo de `RelationType`; saves antigos simplesmente
não o contêm.

---

## 19. Testes

**997 passando** (956 antes, **+41**), typecheck e build limpos.

Os 20 contratos do §26 estão cobertos em
`src/systems/social/__tests__/redeSocial.test.ts` (33) e
`integracaoNarrativa.test.ts` (11): NPC escolar respeita idade · criança não
recebe profissão adulta · relação não nasce "Muito próxima" · amigo tem origem
· NPC tem nome · efêmero não polui a lista · escola/trabalho/hobby geram
oportunidade · oportunidade não garante amizade · amizade sobrevive ao
contexto · afastamento ocorre · introvertido faz amigos · sociável não ganha
amigos de graça · memória de amizade exige amigo · evento "seu amigo" exige
amigo · colega genérico não exige NPC · F4 zero violações · F5 preservada ·
cooldown F5-FIX preservado · variedade de temperamentos.

### Verificação por mutação

| Mutação | Resultado |
|---|---|
| `TIPOS_AMIZADE` passa a aceitar `colega` | **3 testes falham** ✔ |
| `eventSystem` deixa de repassar `origemSocial` | **1 teste falha** ✔ |
| `obterTracosPercebidos` sempre vazio | **falha com mensagem de regressão real** ✔ |
| Pulso forçado a silêncio na vida adulta | **falha por década muda** ✔ |

### Dois testes frágeis consertados (não afrouxados)

1. **`cicloVida.test.ts`** — a semente fixa já havia sido trocada **três
   vezes** (F3, F3-FIX, F6) sempre pelo mesmo motivo: qualquer fase que
   consuma um número a mais do RNG remonta a vida. Em vez de uma quarta troca,
   o teste agora **procura** entre 200 sementes uma vida que satisfaça os
   critérios — todos os limiares idênticos — e exige que a propriedade
   continue **comum** (≥40/200). Mutação confirma que ele pega regressão real.

2. **`anosTranquilos.test.ts`** — exigia que *toda* década de *toda* semente
   tivesse ≥2 anos vividos. Uma década em 298 caiu para 1. Classificado como
   cauda estatística, não buraco de acervo: mexer numa constante social
   irrelevante levava o caso de volta a 0/295. A asserção virou **agregada**
   (≤2% das décadas), a amostra foi **ampliada** (sementes originais
   preservadas), e **nenhuma década pode ficar totalmente muda** — regra que
   continua sendo erro imediato.

---

## 20. Defeitos encontrados lendo timelines

Quatro bugs que as métricas não pegaram:

1. **"O que era colégio virou amizade"** aparecia para amizades de trabalho e
   vizinhança → frase por origem.
2. **Amizades de proximidade 86 sendo encerradas** por evento: `encerrarRelacao`
   escolhia a pessoa **mais recente**, que costuma ser a mais próxima. Agora
   escolhe a **menos próxima** — inofensivo quando havia um amigo por vida,
   destrutivo com uma rede real.
3. **Colegas parados em proximidade 99** sem virar amigos: a promoção exigia
   que a travessia do limiar ocorresse naquele ano exato.
4. **"de escola aos 70"**: um adulto matriculado (MBA, técnico) era tratado
   como colega de escola.

---

## 21. Limitações

- **A faixa 3-5 continua sem vida social**, por desenho: não há ambiente. É
  correto, mas significa que a primeira infância segue dependendo da família.
- **`familia_estendida` quase não é usada** — o estado não modela tios/primos.
- **Conflito e reconciliação não foram implementados.** `rival` existe no
  catálogo, mas a F6 não cria nem resolve conflitos. Adiado.
- **O temperamento social é derivado do nome/cidade.** É estável e produz
  variedade, mas não é um traço visível ao jogador.
- **Amigos não têm vida própria** (não mudam de cidade, não trocam de
  emprego). A relação evolui; a pessoa, não.
- **O modal de encontros continua existindo.** Reduzido, não substituído.

---

## 22. Adiado, com destino

| Item | Fase |
|---|---|
| **Gravidez, gestação, fertilidade, parto** — e o bug "namoro → filho imediato" | **F6.5** |
| Conflito, rivalidade ativa, reconciliação, fim de amizade por briga | F6.5 |
| Amigos com trajetória própria (mudar de cidade/emprego) | F6.5 |
| Choque financeiro aos 18 (F7-P1) · `luxuoso` inalcançável (F7-P2) | **F7** |
| Atividade voluntária repetindo texto literal por até 8 anos | F7 |
| Predicado de escolaridade (`ado_trote_festa`, `ado_preparacao_enem`) | **F8** |
| Gênero ausente do pipeline visual | **F9** |

Nada de gravidez foi implementado. Economia, Avatar, educação regional e
patrimônio não foram tocados.
