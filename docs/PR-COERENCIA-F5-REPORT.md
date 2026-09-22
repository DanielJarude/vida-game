# PR COERÊNCIA — FASE 5

## Narrativa Contextual e Linha da Vida

**Branch:** `arena/01a0c250-vida-game`
**Baseline da fase:** `48a812a` (F4 aprovada)
**Escopo:** fazer a Linha da Vida contar uma história compreensível e contínua
sem transformar cada ano em evento, popup ou relatório.

**Princípio:** a Linha da Vida é a BIOGRAFIA do personagem — não um log
técnico, não um histórico de resultados, não uma lista obrigatória de todos os
anos.

---

## 1. CAUSA RAIZ

Duas causas independentes, ambas confirmadas na medição antes de qualquer
alteração de código.

### (A) A situação era descartada

Um acontecimento automático tem dois textos: `evento.descricao` (a situação) e
`opcao.descricaoResultado` (o desfecho). A Linha da Vida registrava **apenas o
segundo**. O primeiro era exibido na hora e jogado fora.

Para quem está jogando, o desfecho isolado funciona: a situação estava na tela
logo acima. Para quem lê a biografia depois, ele começa no meio. O caso do
playtest:

> "Você encarou o 'monstro' e descobriu que era só um casaco pendurado.
> Ficou orgulhoso de si mesmo."

Que monstro? A informação existia e era descartada. Não é um evento mal
escrito — é um problema de arquitetura: **o motor não tinha como saber que o
texto de exibição e o texto de biografia são coisas diferentes.**

### (B) A pequena memória era adulta

O catálogo tinha dez candidatas, e todas descreviam uma vida adulta: trabalho,
curso superior, filhos, dívida, aposentadoria. A última rede — `mem_cidade`,
que deveria pegar qualquer caso restante — trazia `idade >= 18` na condição.

Consequência aritmética: para uma criança sem emprego e sem filhos,
`gerarPequenaMemoria()` devolvia `null` **em toda idade de 1 a 17**. Medido:
**11 de 18 idades da infância sem nenhuma memória possível**, e **37,1% dos
anos 1-5 sem nenhuma linha**. É o salto "7 anos → 10 anos" que o playtest viu.

---

## 2. ARQUITETURA NARRATIVA

### A correção recusada

O escopo pediu explicitamente que não se fizesse `descricao + ' ' +
descricaoResultado` nos 72 acontecimentos. Depois de ler os 72, confirmo que a
recusa estava certa, por três razões concretas:

1. **Tempo verbal.** As situações são escritas no PRESENTE, porque são exibidas
   enquanto acontecem ("o quarto fica escuro demais"). Os resultados são
   PASSADO ("você encarou"). Colar produz: *"o quarto fica escuro demais e você
   tem certeza de que tem algo se mexendo no armário. Você encarou o monstro"*
   — remendo visível.

2. **Tamanho.** Várias situações têm duas ou três frases. A Linha da Vida é uma
   lista que se escaneia; parágrafos de quatro linhas por ano a transformam
   exatamente no relatório que o projeto recusa.

3. **Redundância.** Em boa parte dos casos o resultado já reafirma a situação
   ("um temporal cai alagando avenidas" + "você chegou encharcado").

### O que foi feito

Três textos, três funções distintas — a separação conceitual que a seção 3 do
escopo pediu:

| Campo | Papel | Onde aparece |
|---|---|---|
| `descricao` | **SITUAÇÃO** — o que aconteceu | ao vivo |
| `descricaoResultado` | **RESULTADO** — como terminou | ao vivo |
| `descricaoMemoria` | **MEMÓRIA** — como fica na biografia | Linha da Vida |

`descricaoMemoria` é **opcional** e foi preenchido só onde necessário. A
memória é **autorada, não derivada**: "o que dessa experiência merece
sobreviver" é decisão de escrita, e só quem escreveu a cena sabe responder.

**A fonte única:** `src/systems/narrativa/memoriaDoEvento.ts`.

```
memoriaDoDesfecho(opcao):
  descricaoMemoria  (se declarada)  →  usa
  senão                             →  usa descricaoResultado
  senão                             →  null  (silêncio legítimo)
```

O módulo **não tem nenhuma regra de string** — nenhum `replace`, nenhuma
capitalização, nenhuma junção. Ele escolhe entre textos que já existem. É por
isso que existe como módulo em vez de um `??` dentro do `eventSystem`: a
decisão "qual texto vira biografia" passa a ter UM lugar, testável isolado, em
vez de virar lógica textual espalhada pelo `agingSystem` — o que a seção 4
pediu para evitar.

`eventSystem.aplicarConsequenciasEscolha` passou a chamar essa função. Uma
linha mudou no ponto de escrita do log; nenhum outro sistema foi tocado.

---

## 3. AUDITORIA DOS 72 ACONTECIMENTOS

Os 72 foram despejados com situação e resultado lado a lado
(`scripts/audit/narrativa72.ts`) e **lidos**. A classificação é humana; o
script não classifica nada.

### Placar

| Classe | Qtd | Significado |
|---|---|---|
| **A** situação + resultado combinam bem | 14 | ganharam `descricaoMemoria` |
| **B** resultado já tem contexto suficiente | 54 | **não mudaram** |
| **C** combinação geraria repetição | — | absorvida em B |
| **D** resultado pressupõe ação não mostrada | **2** | **reescritos** |
| **E** texto precisava de reescrita | 2 | os mesmos da classe D |
| **F** memória deve diferir do texto exibido | 14 | os mesmos da classe A |

**58 dos 72 não precisaram de mudança nenhuma.** É o resultado importante da
auditoria: a suspeita inicial era de um problema em 72 eventos, e o problema
real estava em 14. Aplicar concatenação nos 72 teria degradado 58 textos que
funcionavam.

### Classe A/F — os 14 que ganharam memória dedicada

O critério é **opacidade referencial**: o resultado usa artigo definido para
algo que só a situação apresentou. Lido isolado na Linha da Vida, o leitor não
sabe do que se trata.

| id | Resultado (opaco isolado) | Memória (compreensível isolada) |
|---|---|---|
| `prc_medo_escuro` | "encarou o 'monstro'… era só um casaco" | "Enfrentou sozinho um medo do escuro ao descobrir que o vulto no armário do quarto era só um casaco pendurado." |
| `prc_curiosidade_bicho` | "voltou ao quintal depois que o inseto foi embora" | nomeia o susto com o inseto no quintal |
| `tec_primeiro_jogo_tablet` | "devolveu **o tablet** na hora combinada" | nomeia os primeiros minutos sozinho no tablet |
| `hob_colecao_figurinhas` (×2) | "completou **o álbum** inteiro" | nomeia o álbum da Copa e a escola |
| `esp_torneio_bairro_futebol` (×2) | "**o time** se divertiu" | nomeia o torneio entre ruas do bairro |
| `adm_primeiro_salario_cai` (×2) | "**o dinheiro** durou menos" | nomeia o primeiro salário da vida |
| `adm_mudanca_caminhao_emprestado` | "**o caminhão** atrasou duas horas" | nomeia a mudança de casa |
| `adm_conta_de_luz_alta` | "**o valor** foi corrigido" | nomeia a conta de luz dobrada |
| `adm_letra_pequena` | "foi empurrando com **o braço** esticado" | nomeia o adiamento dos óculos |
| `lat_casa_grande_demais` | "transformou **o quarto** vazio" | nomeia o quarto sem uso havia meses |
| `lat_arrumar_as_fotos` | "guardou **a caixa** de volta" | nomeia a caixa de fotos antigas |
| `lat_fila_do_banco` | "**a fila** não andava" | nomeia a manhã perdida no banco |

19 desfechos em 14 eventos.

### Classe D/E — deliberação indevida e caminho não seguido: 2 casos

A auditoria anterior encontrara **1** caso de deliberação indevida. Lendo os 72
com atenção encontrei **2 casos piores**, de espécie diferente: o desfecho
narra **o caminho que a pessoa NÃO seguiu**, resíduo de quando esses eventos
eram decisões.

| id | Situação | Resultado defeituoso | Correção |
|---|---|---|---|
| `sau_corrida_parque` | corrida no parque | "Uma verdadeira iguaria da cultura brasileira!" (**pastel de feira**) | desfecho da própria caminhada |
| `sen_viagem_excursao` | excursão a águas termais | "Suas **orquídeas** floresceram no jardim" (ficou em casa) | desfecho da própria viagem |

Nos dois, o motor sorteia o desfecho e a pessoa não escolheu trocar corrida por
pastel nem viagem por jardinagem. Como acontecimento automático, o texto
afirmava uma decisão inexistente — violação direta da guarda da F3. Ambos
reescritos.

O caso antigo (`ext_chuva_verao_alagamento`) foi reexaminado: a marca textual
era "no final da tarde", parte da situação, não deliberação. Falso positivo da
varredura.

### Classe B — os 54 que não mudaram

Resultados que já se sustentam sozinhos: *"Foi uma noite difícil para todo
mundo, mas pela manhã a febre já tinha passado"*, *"Sua dancinha desengonçada
arrancou risada de todo mundo em casa"*. Acrescentar situação a estes só
produziria repetição. **Não foram tocados.**

---

## 4. PEQUENAS MEMÓRIAS — INFÂNCIA E ADOLESCÊNCIA

Seis candidatas novas, todas derivadas do estado real, todas passando pelos
selectors da F4:

| id | Faixa | Exige (via F4) | Cadência |
|---|---|---|---|
| `mem_bebe_crescendo` | 0-2 | — | anual |
| `mem_infancia_irmaos` | ≤11 | `temIrmao` | alternada |
| `mem_infancia_pet` | ≤14 | `temPet` | alternada |
| `mem_infancia_escola` | 6-14 | `estaEstudando` | alternada |
| `mem_adolescencia_amigo` | 12-17 | `temAmigo` | alternada |
| `mem_adolescencia_escola` | 15-17 | `estaEstudando` | alternada |

As dez adultas da F3 ficaram **inalteradas**.

Nenhuma abre modal, pede escolha, move atributo, cria NPC, dinheiro ou estado.
Todas são `relevancia: 'textura'`, e todas continuam sujeitas à guarda
original: **só aparecem em ano que ficaria sem nenhuma linha**.

### As duas coisas que a medição me obrigou a desfazer

**(1) A rede final incondicional.** Minha primeira versão tinha
`mem_infancia_cidade` — "Um ano de infância em Marília, sem grandes
acontecimentos" — sem nenhuma condição além da idade. Resultado: anos 1-5 sem
linha caíram de 37,1% para **0,0%**.

Zero é a resposta errada. Aquela frase é praticamente o texto de preenchimento
que o B4-FIX4 removeu: uma linha que interrompe o jogador para dizer que nada
merecia interrompê-lo. **Removida**, com o motivo registrado no código para
que ninguém a reintroduza.

**(2) A ausência de cadência.** Mesmo sem a rede final, as memórias de época
("um ano comum de escola") são verdadeiras TODO ano, e por isso preenchiam
toda a idade escolar: anos 6-11 sem linha caíram de 27,1% para **0,3%**.

Uma memória de época marca a ÉPOCA, não cada ano dela. Daí o campo declarativo
`cadencia: 'alternada'`, que limita essas memórias a anos alternados. A
alternância é pela paridade da idade, **não por sorteio**, para o módulo
continuar sendo função pura do estado — duas vidas no mesmo estado produzem o
mesmo texto.

---

## 5. ANTES E DEPOIS (105 vidas)

`scripts/audit/continuidade.ts`, mesmas 105 vidas, mesmas sementes.

### Por faixa — % de anos sem nenhuma linha

| Faixa | Antes | Depois |
|---|---|---|
| 0-2 | 0,0% | 0,0% |
| **3-5** | **61,9%** | **46,7%** |
| **6-11** | **27,1%** | **15,4%** |
| **12-14** | **16,2%** | **11,1%** |
| **15-17** | **16,2%** | **6,0%** |
| 18-29 | 0,2% | 0,2% |
| 30-44 | 0,3% | 0,3% |
| 45-59 | 0,1% | 0,1% |
| 60+ | 0,3% | 0,3% |

**Faixa 1-5 (a métrica pedida): 37,1% → 28,0%.** Redução material, **sem
chegar a zero** — que era a instrução explícita da seção 9.

### Lacunas — o caso "7 anos → 10 anos"

| Métrica | Antes | Depois |
|---|---|---|
| Maior gap por vida (mediana) | 2 | **1** |
| Maior gap por vida (p90) | 3 | **2** |
| Maior gap por vida (máx) | **6** | **3** |
| Maior gap até os 17 (máx) | **6** | **3** |
| Vidas com gap ≥ 3 anos na infância | **32/105 (30,5%)** | **9/105 (8,6%)** |
| Vidas com gap ≥ 5 anos na infância | 2/105 | **0/105** |

O salto do playtest era um gap de 2 anos. Hoje a mediana é 1 e o **máximo em
105 vidas é 3** — buracos de 5 e 6 anos deixaram de existir. O silêncio
continua: 276 lacunas em 7.794 anos.

### Densidade — a timeline não virou parede de texto

| Métrica | Antes | Depois |
|---|---|---|
| Linhas por ano (média) | 1,652 | **1,673** |
| Anos com 2+ linhas | 3790 (48,6%) | **3790 (48,6%)** |
| Anos com 3+ linhas | 1434 | **1434** |
| Anos com 4+ linhas | 311 | **311** |
| Anos sem linha (geral) | 482 (6,2%) | 312 (4,0%) |

**A densidade praticamente não mudou** (+0,021 linha/ano) e a distribuição de
2+/3+/4+ ficou **idêntica**. É a consequência direta da guarda preservada: a
memória só entra em ano que ficaria vazio, então ela nunca soma a um ano que já
tinha conteúdo.

---

## 6. EXEMPLOS QUALITATIVOS

Métrica não detecta tom de relatório, repetição nem frase sem contexto. Cinco
Linhas da Vida foram geradas e **lidas** (`scripts/audit/linhaDaVidaExemplos.ts`).

### O caso do playtest, em contexto

```
  1 ★ Os primeiros passos vieram no seu tempo: mais engatinhada, algumas
      quedas, e só depois a sala inteira viu você atravessar o cômodo de pé.
    – Você chorou e se agarrou em quem já conhecia. Depois de um tempo,
      curioso, voltou a olhar para a visita de longe.
  2 – Você marcou o ritmo com as mãozinhas, satisfeito só de participar.
    – Sua primeira palavra foi bem prática: o nome exato da coisa que você
      queria naquele momento.
  3 – Enfrentou sozinho um medo do escuro ao descobrir que o vulto no armário
      do quarto era só um casaco pendurado.
  4 ·  (silêncio)
  5 ·  (silêncio)
```

A linha dos 3 anos agora se explica sozinha, e os anos 4 e 5 seguem em
silêncio — a correção não encheu a infância.

### Infância com irmãos (a lacuna fechada sem saturar)

```
  6 ★ Você ingressou no 1º ano do Ensino Fundamental.
    ★ Nasceu seu irmão, Lorenzo! A casa está em festa com a chegada do bebê.
    ★ Você chorou de saudade de casa, mas o abraço caloroso da tia da escola
      ajudou você a se acostumar.
  7 · Este ano você levou os estudos a sério — as notas melhoraram.
  8 · Um ano em que a casa cheia de irmãos não deixou o tédio entrar.
  9 ·  (silêncio)
 10 – Ganhou os primeiros minutos sozinho no tablet da casa e devolveu na
      hora combinada.
```

Antes, os anos 8, 9 e 10 eram três linhas em branco seguidas.

### O defeito que só a leitura pegou

A primeira versão produzia isto:

```
  8 · Um ano de brincadeira e briga com os irmãos dentro de casa.
  9 · Um ano de brincadeira e briga com os irmãos dentro de casa.
```

Texto idêntico, palavra por palavra, em anos consecutivos. **Nenhuma métrica
acusava** — a contagem de linhas estava correta, a densidade estava correta, o
contexto estava correto. Só a leitura pega. Corrigido com redações alternativas
escolhidas pela idade (`variar()`), e coberto por teste permanente.

---

## 7. HIERARQUIA DA LINHA DA VIDA

Preservada sem redesign. Os quatro níveis continuam distintos: **MARCO** (★),
**ACONTECIMENTO/DECISÃO** (–), **PEQUENA MEMÓRIA / TEXTURA** (·).

Toda memória nova entra como `textura` — o nível mais baixo. Nenhuma foi
promovida a marco, e nenhum marco foi rebaixado. A distinção "isso definiu
minha vida" versus "isso foi parte daquela época" fica visível nos exemplos
acima: o ingresso no fundamental é ★, o ano de brincar com os irmãos é ·.

`bb_primeira_palavra` (marco + escolha biográfica) e `inf_primeiros_passos`
(marco sem escolha contextual) permanecem **integralmente intocados**. Nenhuma
janela ou ocorrência foi alterada para preencher timeline.

---

## 8. IMPACTO NA PERSONALIDADE

**Nenhum.** `personalitySystem` não foi tocado nesta fase.

Pequena memória é `textura` e não passa por `registrarEscolha`. A memória de
evento é apenas o TEXTO do log — a decisão sobre personalidade acontece em
outro ramo do `aplicarConsequenciasEscolha`, através de
`contextoPersonalidade`, que não foi alterado. Acontecimento automático
continua chegando via `desfechoSemMarcaDeEscolha`, portanto continua sem mover
traço nenhum.

Métricas de agência, medidas depois: **(A) 1180 · (B) 105 · (C) 105 · (D)
17258 · (G) conversão 100,0%, 0 falhas** — idênticas à F4.

---

## 9. IMPACTO NO SAVE

**Nenhum. `VERSAO_SAVE` permanece em 5. Nenhuma migração.**

`descricaoMemoria` é campo de **catálogo** (conteúdo estático compilado no
bundle), não de estado salvo. A `LifeLogEntry` gravada no save continua com
exatamente os mesmos campos — muda só qual string foi escolhida para o campo
`texto`, no momento em que a linha é criada.

Saves legados: intactos. Uma vida antiga carrega com as linhas que já tinha; as
linhas novas valem dali para frente.

---

## 10. CONTEXTO F4 — NENHUMA MEMÓRIA INVENTA FATO

Exigência da seção 14: nenhuma memória pode pressupor pet, amigo, parceiro,
filho, irmão, emprego, estudo, carro ou imóvel sem o estado correspondente.

As memórias novas **consomem os selectors da F4** (`temIrmao`, `temAmigo`,
`temPet`, `estaEstudando`) em vez de reimplementar as perguntas. Isso não é
zelo redundante: a F4 estabeleceu que "tem irmão?" tem UMA interpretação
canônica, e uma memória com a sua própria versão seria exatamente a divergência
que aquela fase eliminou.

Testes negativos permanentes cobrem cada caso: sem irmão → não fala de irmãos;
sem pet → não fala de bicho; sem amigo → não fala de amigos; sem matrícula →
não afirma escola; e nenhuma memória de criança menciona emprego, cônjuge,
filhos ou aposentadoria (varrido idade a idade, de 1 a 17).

**Verificado por mutação:** removi a exigência `temAmigo` da memória de
adolescência e a suíte falhou apontando exatamente o texto indevido. Guarda
restaurada.

**Violações de contexto da F4 nas 105 vidas: 0/174 (0,0%)** — preservado.

---

## 11. TESTES

**933 testes em 56 arquivos, todos passando** (F4: 900 em 55).

`src/systems/narrativa/__tests__/linhaDaVida.test.ts` — 33 testes, cobrindo os
12 contratos pedidos na seção 19:

| # | Contrato | Como é testado |
|---|---|---|
| 1 | memória compreensível isolada | o caso monstro/casaco contém "medo do escuro" e "casaco" |
| 2 | situação não se perde | memória dedicada prevalece sobre o resultado |
| 3 | não atribui decisão inexistente | varre os 72 por verbos de deliberação |
| 4 | memória não altera estado | compara snapshots JSON antes/depois |
| 5 | não altera personalidade | o retorno só tem os 7 campos de `LifeLogEntry` |
| 6 | não cria NPC | família sai do mesmo tamanho |
| 7 | respeita contexto F4 | negativo + positivo + transição por categoria |
| 8 | memória de amigo exige amigo | negativo e positivo |
| 9 | memória de pet exige pet | negativo e positivo |
| 10 | memória de escola exige escola | negativo e positivo |
| 11 | não aparece com densidade suficiente | ano com log prévio devolve `null` |
| 12 | silêncio ainda é possível | 3-5 anos sem contexto devolve `null` |

Mais duas guardas de catálogo permanentes: nenhuma `descricaoMemoria` pode ser
idêntica ao seu resultado, e toda memória precisa ser frase completa (>20
caracteres, pontuação final).

**Sobre fragilidade:** os testes verificam PROPRIEDADES semânticas ("contém
'medo do escuro'"), não igualdade de texto. Um autor pode reescrever qualquer
memória sem quebrar a suíte; o que ele não pode é fazê-la sumir, mentir sobre
o estado ou atribuir decisão inexistente.

---

## 12. GUARDAS F1/F2/F3/F4

| Guarda | Estado |
|---|---|
| **F1** elegibilidade profissional | ✓ intocada |
| **F2** semestres, matrícula, duração de cursos | ✓ intocada |
| **F3** rotina nunca satura o ano | ✓ **0 anos com 2+ interrupções obrigatórias** |
| **F3** acontecimento não move personalidade | ✓ intocado |
| **F3** pequena memória não move stats/flags/personalidade | ✓ testado |
| **F3** marco garantido não depende de RNG | ✓ 105/105 |
| **F3** silêncio permitido | ✓ 4,0% dos anos, 276 lacunas |
| **F3** nenhum evento novo | ✓ **134 → 134** |
| **F4** violações de contexto | ✓ **0/174** |
| Cobertura do catálogo | ✓ **131/134** (inalterada) |

### O teste que falhou, e por que não o alterei

`anosTranquilos.test.ts` — *"um ano silencioso produz resumo anual vazio"* —
falhou na versão sem cadência. A regra da casa é classificar antes de mexer:
contrato obsoleto, fragilidade estatística ou **regressão real**?

Era **regressão real**. O teste exige que exista ao menos um ano
verdadeiramente vazio em 60 anos de vida, e minhas memórias haviam derrubado o
silêncio geral para 1,1%. O teste estava certo e a implementação errada.

**Não toquei no teste.** Corrigi a causa (cadência alternada + remoção da rede
incondicional) e ele voltou a passar sozinho — `git diff` do arquivo está
vazio. Ele é hoje a melhor defesa do projeto contra preenchimento de timeline.

Alterei, sim, **expectativas dos meus próprios testes novos**: eles usavam
idades ímpares e a cadência os tornou inválidos por construção. Documentado no
próprio arquivo — testar o caso positivo num ano ímpar mediria a cadência, não
o contexto.

---

## 13. PROBLEMAS ENCONTRADOS

**1. Métrica não vê repetição literal.** Duas linhas idênticas em anos
consecutivos passaram por todas as métricas e só a leitura pegou. O teste
qualitativo não é enfeite do relatório: foi o que encontrou o defeito.

**2. Zerar uma métrica de lacuna é trivial e errado.** Duas versões minhas
levaram o silêncio da infância a ~0%, e ambas foram desfeitas. A instrução
"NÃO META ZERO" evitou o retorno do texto de preenchimento.

**3. Dois eventos narravam o caminho não seguido.** `sau_corrida_parque`
(pastel em vez de corrida) e `sen_viagem_excursao` (orquídeas em vez da
viagem). São resíduos de conversão de decisão em acontecimento — vale procurar
o mesmo padrão em futuras conversões.

**4. A varredura léxica de "deliberação indevida" tem falsos positivos.**
Marcas como "preferiu" e "poupou" aparecem em desfechos legítimos de
não-participação ("você descansou no carnaval"). Não é decisão inventada: é um
desfecho possível que o motor sorteou.

**5. Repetição pré-existente em logs de ATIVIDADE (não corrigida).** A leitura
qualitativa mostrou adultos com "As horas extras deste ano renderam
reconhecimento" repetido por 8 anos seguidos. **Não é pequena memória** — é o
log de atividade voluntária, sistema anterior à F5, fora do escopo desta fase.
Registrado abaixo como pendência.

---

## 14. LIMITAÇÕES

- **A infância continua pobre em contexto social**, e isso está documentado em
  vez de disfarçado. 63 de 105 vidas não têm nenhum amigo, então
  `mem_adolescencia_amigo` quase nunca dispara. Não inventei amigos para
  preencher timeline (seção 16 do escopo). Depende da F6.
- **A faixa 3-5 ainda tem 46,7% de anos sem linha.** É a faixa mais pobre em
  contexto: a criança não estuda, raramente tem pet, e só irmão a socorre.
  Reduzir mais exigiria ou conteúdo novo (fora de escopo) ou frase genérica
  (proibido).
- **9 vidas ainda têm gap de 3 anos na infância.** Máximo de 3, contra 6 antes.
  Considero aceitável: são vidas sem irmão, sem pet e com pouca sorte de
  evento.

---

## 15. ADIADO

**F6 — social e gestação**
- Amizade como sistema: 63/105 vidas sem nenhum amigo é o teto real da memória
  de adolescência.
- Frequência de pets: 29/105 vidas.

**F7 — economia e patrimônio**
- **Repetição dos logs de atividade** (problema 5): "As horas extras deste ano
  renderam reconhecimento" 8 anos seguidos. Precisa da mesma variação por
  cadência que as memórias receberam, mas o sistema é outro.

**F8 — educação e localidade**
- Predicado de **nível de escolaridade** (herdado da F4): desbloqueia
  `ado_trote_festa` e `ado_preparacao_enem`.

**F9 — avatar.** Intocado.

---

## VALIDAÇÃO

```
npm test       →  56 arquivos · 933 testes · 100% passando
npm run typecheck  →  tsc --noEmit · limpo
npm run build      →  ✓ built in 3.22s
```

Mais: 105 vidas reexecutadas, auditoria dos 72, continuidade por faixa,
densidade, F4 context guards, guardas F1/F2/F3, cobertura e agência.

### Placar final

| Item | Resultado |
|---|---|
| Anos 1-5 sem linha | **37,1% → 28,0%** (sem zerar) |
| Maior lacuna na infância | **6 → 3 anos** |
| Vidas com gap ≥3 na infância | **30,5% → 8,6%** |
| Vidas com gap ≥5 na infância | **1,9% → 0%** |
| Densidade (linhas/ano) | 1,652 → **1,673** |
| Anos com 2+/3+/4+ linhas | **idênticos** |
| Acontecimentos alterados | **16 de 72** (14 memória + 2 reescrita) |
| Eventos novos | **0** (134 → 134) |
| Versão do save | **5 → 5** |
| Violações de contexto F4 | **0/174** |
| Anos com 2+ interrupções | **0** |
| Testes | 900 → **933** |
| Testes existentes alterados | **0** |

---

**FIM DA FASE 5.** Aguardando revisão. F6, F7, F8 e F9 não foram iniciadas.
