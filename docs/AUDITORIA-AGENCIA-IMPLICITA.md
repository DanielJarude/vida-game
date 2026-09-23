# Auditoria de agência — narrativa auto-gerada do VIDA

Branch `claude/vida-rebuild` @ 48d9d39. Somente leitura; nenhum arquivo do repo foi alterado.

**Regra auditada:** o jogo pode decidir O QUE ACONTECE COM o personagem; não pode decidir em silêncio COMO O PERSONAGEM ESCOLHEU AGIR quando isso é agência, valor, preferência, comportamento ou identidade.

**Método.** O catálogo inteiro (`MASTER_EVENTS_LIST`, 17 arquivos) foi carregado via esbuild e despejado em JSON, então todo evento e todo desfecho entrou na contagem, sem amostragem. Caminho do texto para a biografia: `eventSystem.ts:384` → `memoriaDoDesfecho()` (`systems/narrativa/memoriaDoEvento.ts`) grava `descricaoMemoria` se existir, senão `descricaoResultado`. Acontecimentos são sorteados por `peso` em `events/happenings.ts:sortearDesfecho`; `desfechoSemMarcaDeEscolha` só remove `impactosComportamentais`. **O texto, o dinheiro, a flag e o NPC criados continuam valendo.** Cada um dos 149 textos auto-resolvidos foi lido e classificado à mão.

---

## Resumo executivo

- **149** textos de desfecho auto-resolvidos em **72** eventos. **97 (65%) violam a regra claramente**, 27 são limítrofes e 25 estão OK. 53 dos 72 eventos auto-resolvidos têm pelo menos um desfecho que viola.
- **A faixa 0-2 está essencialmente correta** (reações involuntárias de bebê). **A partir dos 3 anos o padrão desmorona:** 3-5 tem 100% de violação, 6-11 tem 89%, 12-17 tem 77% e 18+ tem 63%.
- **A causa raiz é estrutural, não de redação.** Cerca de 30 eventos marcados `acontecimento` são, na forma, decisões com opções (os ids denunciam: `opt_encarar_armario`, `opt_mudar_assunto`, `opt_conversar_calmo`, `opt_gastar_vale_logo`, `opt_seguir_regras_tempo_tela`...). Esses eventos foram convertidos de decisão para acontecimento sem reescrever as opções. O dado escolhe entre comportamentos.
- **Consequências mecânicas de escolhas não feitas:** o dado cobra dinheiro (Carnaval -350, Réveillon -600, serra -1.400, excursão -1.800, casamento -400, óculos -380, casa -600), paga dinheiro (formatura "economizou" +800, "guardou" o salário +400), move relacionamento (-8 "entrou no debate", -20 "bateu boca") e cria flags e NPCs persistentes (`tem_paixao_secreta` + NPC `paixao`, `jogou_futebol_infancia`, amigos).
- **Identidade decidida pelo dado:**
  - `ado_paixao_secreta` decide que o adolescente tem uma paixão e é tímido, e cria o NPC. Como `eventSystem.ts:279` usa `genero: 'masculino'` por padrão, **toda paixão gerada é um menino**, o que decide orientação.
  - Ao mesmo tempo, `ado_primeiro_beijo` (`adolescenceEvents.ts:103`) diz "Foi **ela** mesma".
  - `ext_festa_surpresa` afirma "Você não é fã de ser o centro das atenções".
  - `sau_corrida_parque` e `lat_caminhada_da_manha` inventam hábitos permanentes.
- **Pessoas inventadas:**
  - O modelo não tem avós (`RelationType`), mas `fam_visita_avo` (5-45 anos) e `ext_macarronada_domingo` (5-95 anos, com "vovó") narram avós.
  - `fam_briga_controle_tv` diz "seu irmão" sem `temIrmaos`.
  - Outros sem condição: `adm_pais_precisando` (irmãos e pais vivos), `lat_crianca_na_casa` (neto), `sen_neto_vestibular` (neto), `jov_amigo_emprestimo` ("grande amigo de infância"), `adm_amigo_de_infancia_reaparece`, `lat_perda_da_geracao`.
- **Concordância de gênero:** 21 desfechos auto-resolvidos usam adjetivo masculino fixo (orgulhoso, tranquilo, exausto, emocionado, renovado, encharcado, eleito, desajeitado, quieto, tratado, mimado...). Mais cerca de 15 em decisões e descrições, e todos os `(a)` dos sistemas (promovido(a), demitido(a), aprovado(a), seu(sua) filho/filha — mesmo quando o gênero é conhecido).

### Os 12 piores (para a reescrita começar por eles)

| # | Evento / arquivo:linha | Texto | Por quê |
|---|---|---|---|
| 1 | `ado_paixao_secreta` socialWorldEvents.ts:19 (descricao), :31, :49-50 | "Tem uma pessoa da sua turma que você não consegue tirar da cabeça, mas nunca teve coragem..." / "Você guardou esse sentimento só para você" | Decide atração romântica e timidez; cria o NPC `paixao`, sempre masculino (eventSystem.ts:279), e a flag que destrava `opt_beijar_paixao_real` ("Foi ela mesma"). |
| 2 | `bb_parquinho_bebes` babyEvents.ts:187 | "Teve choro e disputa pelo brinquedo, mas também muita risada — sua primeira lembrança de 'outras crianças'." | Exemplo do enunciado: decide comportamento e qual é a primeira memória. |
| 3 | `prc_medo_escuro` toddlerWorldEvents.ts:114-115 | "Você encarou o 'monstro'... Ficou orgulhoso de si mesmo." / MEM "Enfrentou sozinho um medo do escuro" | Exemplo do enunciado: decide coragem; masculino fixo. |
| 4 | `ext_festa_surpresa` extraEvents.ts:427 | "Você não é fã de ser o centro das atenções, mas ficou visivelmente emocionado..." | Afirma um traço de personalidade; masculino fixo. |
| 5 | `inf_primeiro_dia_escola` childhoodEvents.ts:138 (descricao), 150/159/168 | "Você conversou com todo mundo, dividiu o lanche... virou a criança mais popular" / "Você chorou de saudade de casa" | A própria descricao pergunta "Como você se comporta na sala?", e o dado responde. |
| 6 | `jov_carnaval_rua` youngAdultEvents.ts:54 | "Você cantou marchinhas até perder a voz, beijou na boca..." | Decide conduta afetiva/sexual; cobra R$350. |
| 7 | `adm_pais_precisando` adultWorldEvents.ts:560/571 | "Você foi assumindo as coisas aos poucos" / "Vocês combinaram um revezamento na família" | Decide o papel de cuidador (valor); inventa irmãos; sem condição de pais vivos. |
| 8 | `adm_colega_demitido` adultWorldEvents.ts:220 | "Você indicou seu colega para uma vaga que conhecia." | Decide um ato altruísta. |
| 9 | `car_fofoca_copa` careerEvents.ts:103 | "Você demonstrou maturidade corporativa e não se queimou com ninguém." | Dilema moral clássico resolvido pelo dado, com julgamento de valor. |
| 10 | `rom_discussao_toalha` romanceEvents.ts:60/70 | "Vocês se entenderam, riram..." / "Ficaram sem se falar o fim de semana inteiro" | Decide como o personagem conduz o conflito do casal; relacionamento -20. |
| 11 | `fam_visita_avo` / `ext_macarronada_domingo` moreEvents.ts:401/412, extraEvents.ts:316 | "Passou a tarde na casa dos avós..." / "ouviu um 'sempre com pressa' da vovó" | Avós não existem no modelo; janelas vão até 45 e 95 anos. |
| 12 | `tec_primeiro_jogo_tablet` schoolWorldEvents.ts:126/136 | "devolveu na hora combinada" / "Pediu mais tempo no tablet" | Obediência x transgressão: decisão comportamental de manual resolvida pelo dado. |

---
## A. Inventário do catálogo

Total de eventos em MASTER_EVENTS_LIST: **134** (289 opções).

| Arquivo | Total | decisao | acontecimento | (taxonomia) acontecimento_puro | marco_testemunhado | escolha_biografica | decisao_comportamental | desfechos auto-resolvidos |
|---|---|---|---|---|---|---|---|---|
| src/data/events/childhoodEvents.ts | 8 | 5 | 3 | 1 | 2 | 0 | 5 | 8 |
| src/data/events/adolescenceEvents.ts | 6 | 4 | 2 | 2 | 0 | 0 | 4 | 5 |
| src/data/events/youngAdultEvents.ts | 5 | 3 | 2 | 2 | 0 | 0 | 3 | 4 |
| src/data/events/adultEvents.ts | 4 | 3 | 1 | 1 | 0 | 0 | 3 | 2 |
| src/data/events/seniorEvents.ts | 4 | 2 | 2 | 2 | 0 | 0 | 2 | 4 |
| src/data/events/careerEvents.ts | 4 | 3 | 1 | 1 | 0 | 0 | 3 | 2 |
| src/data/events/healthEvents.ts | 3 | 2 | 1 | 1 | 0 | 0 | 2 | 2 |
| src/data/events/romanceEvents.ts | 3 | 1 | 2 | 2 | 0 | 0 | 1 | 4 |
| src/data/events/randomEvents.ts | 5 | 3 | 2 | 2 | 0 | 0 | 3 | 4 |
| src/data/events/moreEvents.ts | 12 | 10 | 2 | 2 | 0 | 0 | 10 | 4 |
| src/data/events/extraEvents.ts | 12 | 4 | 8 | 8 | 0 | 0 | 4 | 16 |
| src/data/events/earlyChildhood/babyEvents.ts | 8 | 0 | 8 | 7 | 0 | 1 | 0 | 14 |
| src/data/events/earlyChildhood/toddlerWorldEvents.ts | 7 | 3 | 4 | 3 | 1 | 0 | 3 | 8 |
| src/data/events/childhood/schoolWorldEvents.ts | 9 | 6 | 3 | 3 | 0 | 0 | 6 | 6 |
| src/data/events/adolescence/socialWorldEvents.ts | 9 | 7 | 2 | 2 | 0 | 0 | 7 | 5 |
| src/data/events/adult/adultWorldEvents.ts | 25 | 4 | 21 | 21 | 0 | 0 | 4 | 43 |
| src/data/events/senior/laterLifeEvents.ts | 10 | 1 | 9 | 9 | 0 | 0 | 1 | 18 |
| **TOTAL** | 134 | 61 | 73 | 69 | 3 | 1 | 61 | 149 |

Observação: `natureza` ausente = decisão (61 eventos não declaram `natureza`; todos declaram `taxonomia`). `bb_primeira_palavra` tem natureza acontecimento mas taxonomia escolha_biografica — o jogador escolhe, por isso NÃO está contado como auto-resolvido. Auto-resolvidos = 72 eventos (69 acontecimento_puro + 3 marco_testemunhado) / 149 textos de desfecho.

## B. Números agregados (desfechos auto-resolvidos)

- Textos de desfecho auto-resolvidos: **149** (72 eventos: 69 acontecimento_puro + 3 marco_testemunhado)
- **Violação clara (V): 97 (65%)**  |  Limítrofe/leve (L): 27  |  OK (O): 25
- Eventos auto-resolvidos com ao menos 1 desfecho violador: **53 de 72**
- Critério: V = o texto afirma como o personagem (3+ anos) agiu, sentiu, preferiu ou valorizou algo que seria escolha dele, ou afirma pessoa/passado inexistente no estado. L = ação trivial/plausível de baixo valor, sentimento involuntário, ou problema só de contexto. O = mundo/outros agindo, fisiologia de bebê, fato.

### Por categoria (um desfecho pode ter várias)

| Categoria | em desfechos V | em desfechos L/O | total |
|---|---|---|---|
| DECIDED_BEHAVIOR | 77 | 11 | 88 |
| DECIDED_PREFERENCE | 21 | 0 | 21 |
| DECIDED_EMOTION | 18 | 6 | 24 |
| DECIDED_VALUE | 14 | 0 | 14 |
| INVENTED_PERSON | 10 | 4 | 14 |
| INVENTED_PAST | 10 | 5 | 15 |
| GENDER_AGREEMENT | 16 | 5 | 21 |

### Por faixa etária (faixa da idadeMinima do evento)

| Faixa | desfechos | V | L | O | % V |
|---|---|---|---|---|---|
| 0-2 | 16 | 1 | 4 | 11 | 6% |
| 3-5 | 12 | 12 | 0 | 0 | 100% |
| 6-11 | 18 | 16 | 1 | 1 | 89% |
| 12-17 | 22 | 17 | 1 | 4 | 77% |
| 18+ | 81 | 51 | 21 | 9 | 63% |

Nota: `fam_visita_avo` (5-45) e `ext_macarronada_domingo` (5-95) estão na faixa 3-5 pela idade mínima, mas atravessam todas as faixas até a velhice; os 4 desfechos deles são violações por pessoa inventada (avós). Sem eles, 3-5 tem 8/8 violações (100%). A faixa 0-2 está essencialmente correta (reações involuntárias), com a exceção do exemplo citado (`bb_parquinho_bebes`).

## C. Desfechos auto-resolvidos — lista completa

Linha = linha do texto que vai para a Linha da Vida (`descricaoMemoria` se existir, senão `descricaoResultado`). Quando há MEM, o RES (mostrado ao vivo) também é citado.


### `inf_primeiros_passos` — Primeiros Passos (1-2, marco_testemunhado) — src/data/events/childhoodEvents.ts

Situação: "Você está no tapete da sala e seus pais incentivam você a se levantar e andar em direção a eles."  
**Direção de correção:** OK. Fisiologia/marco de bebê narrado como acontecimento; aceitável.

- O `opt_correr` — src/data/events/childhoodEvents.ts:22 — [—]  
  "Você correu tropeçando para os braços dos seus pais e a sala inteira comemorou seus primeiros passos com lágrimas de alegria."
- O `opt_engatinhar` — src/data/events/childhoodEvents.ts:38 — [—]  
  "Os primeiros passos vieram no seu tempo: mais engatinhada, algumas quedas, e só depois a sala inteira viu você atravessar o cômodo de pé."

### `inf_primeiro_dia_escola` — Primeiro Dia no Ensino Fundamental (6-7, marco_testemunhado) — src/data/events/childhoodEvents.ts

Situação: "É o seu primeiro dia de aula oficial com mochila nova e caderno de desenho. Como você se comporta na sala?"  
**Direção de correção:** CONVERTER em decisão/escolha_biografica. A própria descricao pergunta "Como você se comporta na sala?" mas o marco é testemunhado e sorteia a resposta. Alternativa: manter o marco e reescrever os 3 desfechos como fatos do mundo ("A professora nova se apresentou; a turma tinha 28 crianças").

- **V** `opt_fazer_amigos` — src/data/events/childhoodEvents.ts:150 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você conversou com todo mundo, dividiu o lanche no recreio e virou a criança mais popular da turma."
- **V** `opt_estudar_atento` — src/data/events/childhoodEvents.ts:159 — [DECIDED_BEHAVIOR]  
  "A professora elogiou sua atenção e você aprendeu a ler suas primeiras frases com perfeição."
- **V** `opt_chorar` — src/data/events/childhoodEvents.ts:168 — [DECIDED_EMOTION]  
  "Você chorou de saudade de casa, mas o abraço caloroso da tia da escola ajudou você a se acostumar."

### `inf_futebol_rua` — Futebol no Meio da Rua (7-11, acontecimento_puro) — src/data/events/childhoodEvents.ts

Situação: "As crianças da vizinhança montaram dois chinelos como trave no asfalto e te chamaram para jogar bola."  
**Direção de correção:** CONVERTER em decisão (o convite é literalmente uma escolha: jogar, ficar no gol ou ficar no videogame). Remover adicionarFlag jogou_futebol_infancia do sorteio (identidade persistente decidida pelo dado).

- **V** `opt_jogar_raca` — src/data/events/childhoodEvents.ts:190 — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  "Você jogou descalço com garra, deu caneta no zagueiro e marcou um golaço antológico ovacionado pelo quarteirão!"
- **V** `opt_goleiro` — src/data/events/childhoodEvents.ts:200 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você ficou no gol para ajudar o time e fez defesas milagrosas, embora tenha ralado o joelho no chão."
- **V** `opt_ficar_videogame` — src/data/events/childhoodEvents.ts:209 — [DECIDED_PREFERENCE]  
  "Você zerou uma fase super difícil no jogo, mas perdeu a diversão com a galera lá fora."

### `ado_smartphone` — O Primeiro Celular Próprio (12-15, acontecimento_puro) — src/data/events/adolescenceEvents.ts

Situação: "Seus pais disseram que se você mantiver as notas altas e ajudar nas tarefas de casa, vão te dar seu primeiro smartphone."  
**Direção de correção:** REESCREVER: o que o jogo pode decidir é se os pais cumpriram/adiaram. Tirar "Você agora passa horas nas redes sociais" (hábito) e "acharam você mimado" (comportamento + masculino fixo). Ou converter: a condição dos pais vira decisão.

- **V** `opt_esforco_total` — src/data/events/adolescenceEvents.ts:156 — [DECIDED_BEHAVIOR]  
  "Seus pais cumpriram a promessa e compraram o celular! Você agora passa horas nas redes sociais."
- **V** `opt_pedir_insistente` — src/data/events/adolescenceEvents.ts:167 — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  "Seus pais acharam você mimado e adiaram o presente."

### `ado_trote_festa` — A Grande Festa de Formatura do Colégio (17-17, acontecimento_puro) — src/data/events/adolescenceEvents.ts

Situação: "Chegou o baile de formatura do Ensino Médio com smoking, vestidos de gala e a presença de todos os formandos."  
**Direção de correção:** CONVERTER em decisão (ir e dançar / tocar violão / faltar para economizar). opt_economizar_festa inclusive dá +R$800 por uma escolha que o jogador não fez.

- L `opt_dancar_noite_toda` — src/data/events/adolescenceEvents.ts:286 — [DECIDED_EMOTION]  
  "Foi uma noite mágica que encerrou com chave de ouro a sua jornada na escola!"
- **V** `opt_tocar_violao_festa` — src/data/events/adolescenceEvents.ts:299 — [DECIDED_BEHAVIOR]  
  "Você pegou o violão que praticamente ninguém sabia que sabia tocar e puxou um coro com a turma inteira. Virou a lembrança mais contada da formatura."
- **V** `opt_economizar_festa` — src/data/events/adolescenceEvents.ts:311 — [DECIDED_PREFERENCE, DECIDED_VALUE]  
  "Você poupou uma grana boa, mas ficou vendo os stories dos colegas no dia seguinte."

### `jov_carnaval_rua` — Carnaval de Rua e Bloquinho (18-30, acontecimento_puro) — src/data/events/youngAdultEvents.ts

Situação: "Chegou o Carnaval brasileiro! Seus amigos compraram fantasias e te convidaram para passar quatro dias atrás dos trios e bloquinhos."  
**Direção de correção:** CONVERTER em decisão. opt_folia_total decide até que o personagem "beijou na boca" (comportamento afetivo/sexual) e cobra -R$350.

- **V** `opt_folia_total` — src/data/events/youngAdultEvents.ts:54 — [DECIDED_BEHAVIOR]  
  "Você cantou marchinhas até perder a voz, beijou na boca e viveu a alma da cultura brasileira!"
- **V** `opt_feriado_descanso` — src/data/events/youngAdultEvents.ts:64 — [DECIDED_PREFERENCE]  
  "Você descansou plenamente, zerou suas séries favoritas e renovou as energias."

### `jov_reveillon_praia` — Réveillon no Litoral com Amigos (19-29, acontecimento_puro) — src/data/events/youngAdultEvents.ts

Situação: "A virada do ano chegou e o grupo de amigos alugou uma casa na praia para passar o Réveillon de roupa branca e pular as sete ondas."  
**Direção de correção:** CONVERTER em decisão (praia com amigos x família). Hoje o dado escolhe e cobra -R$600.

- **V** `opt_pular_ondas` — src/data/events/youngAdultEvents.ts:161 — [DECIDED_BEHAVIOR]  
  "Os fogos de artifício no mar foram deslumbrantes! Você fez seus desejos para o novo ano com muita energia positiva."
- **V** `opt_passar_em_familia` — src/data/events/youngAdultEvents.ts:172 (MEM) — [DECIDED_PREFERENCE]  
  MEM: "Passou o Réveillon em casa, com a família, numa ceia tranquila."  
  RES (L171): "Foi uma ceia acolhedora, com abraços apertados e muito afeto."

### `adu_churrasco_natal` — O Tradicional Natal em Família (30-65, acontecimento_puro) — src/data/events/adultEvents.ts

Situação: "A família inteira se reuniu na sua casa para o Natal. Tem tio do pavê, crianças correndo e a famosa discussão política na hora da sobremesa."  
**Direção de correção:** OK no texto (mundo/família agindo). Observação: ids e relacionamentoDelta (-8 em entrar_no_debate) atribuem ao jogador uma postura que o texto não afirma; descricao decide que a festa é "na sua casa".

- O `opt_apaziguar_festa` — src/data/events/adultEvents.ts:133 — [—]  
  "Todo mundo caiu na gargalhada e a festa terminou com um abraço coletivo emocionado!"
- O `opt_entrar_no_debate` — src/data/events/adultEvents.ts:143 — [—]  
  "A discussão rendeu até a madrugada e um tio saiu emburrado antes do amigo secreto."

### `sen_baile_terceira_idade` — Baile dos Anos Dourados (60-88, acontecimento_puro) — src/data/events/seniorEvents.ts

Situação: "O centro comunitário da cidade está promovendo um baile de forró e seresta para a terceira idade."  
**Direção de correção:** CONVERTER em decisão (ir dançar / jogar dominó / não ir) ou reescrever como fato ("O centro comunitário lotou; a seresta foi até tarde").

- **V** `opt_dancar_forro` — src/data/events/seniorEvents.ts:53 — [DECIDED_BEHAVIOR]  
  "Você foi a sensação da pista! Seus passos de dança arrancaram aplausos de todos os presentes."
- **V** `opt_jogar_dominio` — src/data/events/seniorEvents.ts:62 — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  "Você deu muitas risadas relembrando causos da juventude."

### `sen_viagem_excursao` — Excursão para Águas Termais (62-85, acontecimento_puro) — src/data/events/seniorEvents.ts

Situação: "Seus amigos te convidam para uma viagem de ônibus de uma semana para relaxar nas piscinas de águas quentes em Caldas Novas ou Serra Gaúcha."  
**Direção de correção:** CONVERTER em decisão (convite de amigos = escolha). Bug adicional: opt_ficar_plantinhas (o id sugere "ficar") tem MEM "Viajou de excursão ... voltou renovado" — os dois desfechos dizem que foi. "renovado" masculino fixo. Viajar cobra -R$1.800 sem consentimento.

- **V** `opt_viajar_excursao` — src/data/events/seniorEvents.ts:84 — [DECIDED_BEHAVIOR]  
  "As águas minerais fizeram maravilhas para suas articulações e sua alma voltou renovada!"
- **V** `opt_ficar_plantinhas` — src/data/events/seniorEvents.ts:98 (MEM) — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  MEM: "Viajou de excursão com o grupo para umas águas termais e voltou renovado."  
  RES (L97): "A viagem foi tranquila: muita conversa no ônibus, água quente e cochilo à tarde."

### `car_fofoca_copa` — Fofoca na Copa do Escritório (18-65, acontecimento_puro) — src/data/events/careerEvents.ts

Situação: "Enquanto você pegava um cafézinho, colegas de equipe começaram a falar mal do diretor do departamento."  
Condições: `{"empregado": true}`  
**Direção de correção:** CONVERTER em decisão (clássico dilema comportamental). "Você demonstrou maturidade corporativa" é julgamento de valor atribuído sem escolha.

- **V** `opt_mudar_assunto` — src/data/events/careerEvents.ts:103 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você demonstrou maturidade corporativa e não se queimou com ninguém."
- L `opt_participar_fofoca` — src/data/events/careerEvents.ts:112 — [DECIDED_BEHAVIOR]  
  "A fofoca vazou e criou um climão desconfortável na reunião de equipe!"

### `sau_corrida_parque` — Domingo no Parque da Cidade (14-85, acontecimento_puro) — src/data/events/healthEvents.ts

Situação: "Uma manhã ensolarada e fresca convida para uma caminhada ou corrida ao ar livre no parque."  
**Direção de correção:** CONVERTER em decisão ou APAGAR. MEM "Pegou o hábito de caminhar no parque nas manhãs de domingo" inventa um hábito permanente.

- **V** `opt_correr_5k` — src/data/events/healthEvents.ts:118 — [DECIDED_BEHAVIOR]  
  "A endorfina tomou conta do seu corpo e você se sentiu com disposição infinita!"
- **V** `opt_pastel_feira` — src/data/events/healthEvents.ts:133 (MEM) — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  MEM: "Pegou o hábito de caminhar no parque nas manhãs de domingo, sem pressa nenhuma."  
  RES (L132): "Você foi devagar, sem pressa de bater recorde, e voltou do parque leve."

### `rom_surpresa_jantar` — Jantar Romântico à Luz de Velas (18-80, acontecimento_puro) — src/data/events/romanceEvents.ts

Situação: "Seu(Sua) parceiro(a) faz aniversário e você planeja uma surpresa especial para celebrar o amor de vocês."  
Condições: `{"temParceiro": true}`  
**Direção de correção:** CONVERTER em decisão. A descricao já decide que "você planeja uma surpresa"; o desfecho decide o estilo (restaurante x cozinhar) e o gasto.

- **V** `opt_restaurante_especial` — src/data/events/romanceEvents.ts:22 (MEM) — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  MEM: "Teve uma noite de jantar à luz de velas que aproximou vocês dois."  
  RES (L21): "A noite foi mágica e apaixonada! A cumplicidade entre vocês se fortaleceu ainda mais."
- **V** `opt_cozinhar_em_casa` — src/data/events/romanceEvents.ts:33 — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  "O jantar caseiro foi íntimo, delicioso e cheio de risadas carinhosas."

### `rom_discussao_toalha` — Pequenos Atritos da Convivência (20-80, acontecimento_puro) — src/data/events/romanceEvents.ts

Situação: "Uma toalha molhada em cima da cama desencadeia uma discussão sobre a divisão das tarefas da casa."  
Condições: `{"temParceiro": true}`  
**Direção de correção:** CONVERTER em decisão (como reagir a um conflito do casal é a definição de agência comportamental).

- **V** `opt_conversar_calmo` — src/data/events/romanceEvents.ts:60 — [DECIDED_BEHAVIOR]  
  "Vocês se entenderam, riram da situação e criaram uma rotina justa para os dois."
- **V** `opt_bater_boca` — src/data/events/romanceEvents.ts:70 — [DECIDED_BEHAVIOR]  
  "Ficaram sem se falar o fim de semana inteiro em um silêncio pesado."

### `rnd_panela_pressao` — O Feijão na Panela de Pressão (16-90, acontecimento_puro) — src/data/events/randomEvents.ts

Situação: "Você colocou o feijão de molho para cozinhar na panela de pressão com alho, louro e bacon."  
**Direção de correção:** OK (resultado da panela). Descricao decide que o personagem cozinha feijão com bacon (preferência leve).

- O `opt_feijao_perfeito` — src/data/events/randomEvents.ts:94 — [—]  
  "O feijão ficou grosso, perfumado e maravilhoso! O melhor prato do dia!"
- O `opt_levantar_valvula` — src/data/events/randomEvents.ts:103 — [—]  
  "Deu certo sem explodir o teto da cozinha, mas o susto com o chiado foi grande!"

### `rnd_sorteio_shopping` — Cupom de Sorteio do Shopping (18-90, acontecimento_puro) — src/data/events/randomEvents.ts

Situação: "Após fazer compras de fim de ano, você deposita seus cupons na urna do shopping da cidade e, para sua surpresa, seu nome é sorteado para um vale-compras de R$ 3.000!"  
**Direção de correção:** Manter o prêmio como acontecimento; CONVERTER o uso (gastar x guardar) em decisão, ou narrar só o prêmio. Incoerência: gastar_vale_logo credita +R$3.000 igual a guardar.

- **V** `opt_gastar_vale_logo` — src/data/events/randomEvents.ts:127 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você aproveitou tudo de uma vez e voltou para casa com sacolas novas e um sorriso enorme."
- **V** `opt_guardar_vale` — src/data/events/randomEvents.ts:137 — [DECIDED_VALUE]  
  "O vale acabou trocado por dinheiro e o valor entrou direto na reserva."

### `fam_briga_controle_tv` — Guerra pelo Controle da TV (6-14, acontecimento_puro) — src/data/events/moreEvents.ts

Situação: "Você e seu irmão estão disputando quem vai assistir à televisão na sala no sábado à tarde."  
**Direção de correção:** Exigir condicoes.temIrmaos e usar o gênero do irmão real (hoje "seu irmão" fixo, sem irmão no estado); CONVERTER em decisão (ceder x chamar a mãe).

- **V** `opt_ceder_revezar` — src/data/events/moreEvents.ts:61 — [DECIDED_BEHAVIOR, INVENTED_PERSON]  
  "A diplomacia venceu! Vocês dois assistiram e acabaram comendo pipoca juntos."
- **V** `opt_gritar_mae` — src/data/events/moreEvents.ts:71 — [INVENTED_PERSON]  
  "Sua mãe desligou a TV e mandou os dois limparem o quarto."

### `fam_visita_avo` — Tarde na Casa dos Avós (5-45, acontecimento_puro) — src/data/events/moreEvents.ts

Situação: "Um cheiro gostoso de bolo de cenoura com cobertura de chocolate e café passado na hora te recebe na porta da casa dos avós."  
**Direção de correção:** O modelo NÃO tem avós (RelationType não inclui avô/avó). Janela 5-45 com cooldown 4. APAGAR ou criar avós no estado + condição; reescrever como fato ("Seus pais levaram você à casa dos avós").

- **V** `opt_ouvir_historias` — src/data/events/moreEvents.ts:401 (MEM) — [INVENTED_PERSON]  
  MEM: "Passou a tarde na casa dos avós ouvindo as histórias de antigamente."  
  RES (L400): "A tarde rendeu dois pedaços de bolo e as histórias de antigamente de sempre — aquelas que ficam."
- **V** `opt_tarde_corrida` — src/data/events/moreEvents.ts:412 (MEM) — [INVENTED_PERSON]  
  MEM: "Passou uma tarde curta na casa dos avós — mal deu tempo de tomar o café."  
  RES (L411): "Foi uma visita curta: o café mal esfriou e já era hora de ir embora."

### `ext_gincana_escolar` — Gincana Cultural e Esportiva da Escola (11-16, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "Sua turma foi dividida em equipes para disputar a tradicional gincana anual com provas esportivas e arrecadação de agasalhos."  
**Direção de correção:** OK/limítrofe: resultados de equipe são fatos. provas_conhecimento decide papel escolhido.

- O `opt_liderar_gincana` — src/data/events/extraEvents.ts:52 — [—]  
  "Sua equipe venceu o troféu da gincana e a turma comemorou cantando no pátio!"
- L `opt_provas_conhecimento` — src/data/events/extraEvents.ts:61 — [DECIDED_BEHAVIOR]  
  "Você acertou todas as perguntas e garantiu pontos preciosos para sua equipe."

### `ext_festa_junina` — Festa Junina do Colégio (8-17, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "Bandeirinhas coloridas, fogueira, milho cozido, quentão e correio elegante no ar."  
Condições: `{"emEscola": true}`  
**Direção de correção:** Reescrever como fato (bilhetinho no correio elegante é mundo agindo) ou converter em decisão (quadrilha x barracas).

- **V** `opt_dancar_quadrilha` — src/data/events/extraEvents.ts:85 — [DECIDED_BEHAVIOR, DECIDED_EMOTION]  
  "Você dançou a quadrilha com muita alegria e recebeu um bilhetinho carinhoso no correio elegante!"
- **V** `opt_pescaria_comidas` — src/data/events/extraEvents.ts:94 — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  "Você ganhou um brinde na pescaria e se empanturrou de comidas típicas deliciosas."

### `ext_amigo_secreto_firma` — Amigo Secreto da Empresa (18-65, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "Na festa de fim de ano da firma, você tirou o colega mais exigente da equipe no sorteio do amigo secreto."  
Condições: `{"empregado": true}`  
**Direção de correção:** CONVERTER em decisão (o tipo de presente é escolha). Bug: MEM de par_de_meias diz "Tirou um par de meias como presente" (inverte quem deu/recebeu).

- **V** `opt_presente_criativo` — src/data/events/extraEvents.ts:160 (MEM) — [DECIDED_BEHAVIOR]  
  MEM: "Acertou em cheio no presente do amigo secreto da empresa."  
  RES (L159): "Ele adorou o presente e a convivência diária na equipe melhorou 100%!"
- **V** `opt_par_de_meias` — src/data/events/extraEvents.ts:171 (MEM) — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  MEM: "Tirou um par de meias como presente no amigo secreto da empresa e a sala inteira riu."  
  RES (L170): "Ele abriu o pacote com uma risada amarela e todos riram da situação."

### `ext_chuva_verao_alagamento` — Temporal de Verão na Cidade (16-85, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "Um temporal torrencial cai no final da tarde, alagando avenidas principais e parando o trânsito."  
**Direção de correção:** CONVERTER em decisão (esperar x enfrentar) ou reescrever só o mundo ("A cidade parou por três horas"). "tranquilo"/"encharcado" fixos no masculino.

- **V** `opt_esperar_chuva_passar` — src/data/events/extraEvents.ts:234 — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  "Você evitou engarrafamento, comeu bem e voltou tranquilo para casa."
- **V** `opt_enfrentar_agua` — src/data/events/extraEvents.ts:244 — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  "Você chegou encharcado até os ossos e pegou um resfriado forte."

### `ext_feira_livre_sabado` — Feira Livre de Sábado (12-90, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "Gritos dos feirantes: "Olha a banana ouro, freguesa! É três por dez!", barracas cheias de frutas frescas, verduras e aquele pastel crocante com caldo de cana."  
**Direção de correção:** Reescrever como fato ou APAGAR; pechinchar é comportamento.

- **V** `opt_fazer_feira_completa` — src/data/events/extraEvents.ts:266 — [DECIDED_BEHAVIOR]  
  "Sua despensa ficou cheia de alimentos saudáveis e o passeio foi uma delícia cultural!"
- **V** `opt_pedir_desconto_xepa` — src/data/events/extraEvents.ts:276 — [DECIDED_BEHAVIOR]  
  "Você conseguiu caixas inteiras de frutas por uma pechincha inacreditável!"

### `ext_macarronada_domingo` — A Tradicional Macarronada de Domingo (5-95, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "A casa está cheia de tios, primos e avós para o almoço dominical com macarronada caseira ao molho de tomate rústico."  
**Direção de correção:** Avós/"vovó" não existem no estado; janela até 95 anos (avós de um idoso de 90). Reescrever sem pessoas inventadas; "comeu correndo ... tarde livre com a turma" decide comportamento e inventa turma.

- **V** `opt_ajudar_cozinha_comer` — src/data/events/extraEvents.ts:306 — [INVENTED_PERSON]  
  "O sabor estava divino e os laços afetivos com a família ficaram mais fortes do que nunca!"
- **V** `opt_comer_rapido_sair` — src/data/events/extraEvents.ts:316 — [DECIDED_BEHAVIOR, INVENTED_PERSON]  
  "Você comeu correndo, ouviu um "sempre com pressa" da vovó, mas ainda deu tempo de aproveitar a tarde livre com a turma."

### `ext_viagem_serra` — Fim de Semana na Serra (20-85, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "O inverno chegou e você viaja para as montanhas (Campos do Jordão, Gramado ou Petrópolis) para curtir o clima frio, fondue e lareira."  
**Direção de correção:** CONVERTER em decisão. A descricao afirma que "você viaja para as montanhas" e o desfecho ficar_em_casa contradiz; curtir_serra cobra -R$1.400.

- **V** `opt_curtir_serra` — src/data/events/extraEvents.ts:381 — [DECIDED_BEHAVIOR]  
  "Passeio espetacular! As fotos ficaram lindas e você relaxou profundamente."
- **V** `opt_ficar_em_casa_coberta` — src/data/events/extraEvents.ts:391 — [DECIDED_PREFERENCE]  
  "Um fim de semana super aconchegante sem gastar quase nada."

### `ext_festa_surpresa` — Festa Surpresa de Aniversário (15-90, acontecimento_puro) — src/data/events/extraEvents.ts

Situação: "Ao abrir a porta de casa no dia do seu aniversário, as luzes se acendem e todos gritam: "SURPRESA!""  
**Direção de correção:** Premissa OK (os outros agem). Reescrever desfechos pelo lado dos outros ("Apareceram colegas da escola e dois vizinhos"). constrangido_festa afirma traço de identidade ("Você não é fã de ser o centro das atenções") e usa "emocionado" fixo.

- **V** `opt_emocionar_festa` — src/data/events/extraEvents.ts:417 (MEM) — [DECIDED_EMOTION]  
  MEM: "Ganhou uma festa surpresa de aniversário e se emocionou com quem apareceu."  
  RES (L416): "Foi uma celebração inesquecível de amor, amizade e gratidão pela sua vida!"
- **V** `opt_constrangido_festa` — src/data/events/extraEvents.ts:427 — [DECIDED_PREFERENCE, DECIDED_EMOTION, GENDER_AGREEMENT]  
  "Você não é fã de ser o centro das atenções, mas ficou visivelmente emocionado ao ver quem se lembrou de você."

### `bb_estranhamento_visita` — Visita de Parente Desconhecido (0-1, acontecimento_puro) — src/data/events/earlyChildhood/babyEvents.ts

Situação: "Uma tia que você nunca viu de perto se aproxima sorrindo e estica os braços para te pegar no colo."  
**Direção de correção:** OK (reação involuntária de bebê). Trocar "curioso" por forma neutra/flexionada.

- O `opt_chorar_estranho` — src/data/events/earlyChildhood/babyEvents.ts:40 (MEM) — [GENDER_AGREEMENT]  
  MEM: "Estranhou um parente que não conhecia e só foi se soltando aos poucos."  
  RES (L39): "Você chorou e se agarrou em quem já conhecia. Depois de um tempo, curioso, voltou a olhar para a visita de longe."
- O `opt_sorrir_visita` — src/data/events/earlyChildhood/babyEvents.ts:49 — [—]  
  "Você foi no colo sem estranhar nem um pouco, para a alegria de toda a família reunida."

### `bb_descoberta_espelho` — O Bebê no Espelho (0-2, acontecimento_puro) — src/data/events/earlyChildhood/babyEvents.ts

Situação: "Sentado no chão da sala, você encontra seu próprio reflexo no espelho grande do corredor."  
**Direção de correção:** OK.

- O `opt_rir_espelho` — src/data/events/earlyChildhood/babyEvents.ts:73 — [—]  
  "Você riu tanto do "outro bebê" que toda a casa veio ver a cena."
- O `opt_ignorar_espelho` — src/data/events/earlyChildhood/babyEvents.ts:82 — [—]  
  "O espelho não te prendeu por muito tempo: um brinquedo no chão chamou mais sua atenção."

### `bb_febre_noite` — Febre no Meio da Noite (0-2, acontecimento_puro) — src/data/events/earlyChildhood/babyEvents.ts

Situação: "Você acorda chorando de madrugada, quente e incomodado, e seus pais correm para o seu quarto."  
**Direção de correção:** OK. Descricao usa "incomodado" fixo.

- O `opt_colo_acalma` — src/data/events/earlyChildhood/babyEvents.ts:104 — [—]  
  "No colo, entre cochilos, você foi se acalmando até a febre ceder já de manhã."
- O `opt_chorar_muito` — src/data/events/earlyChildhood/babyEvents.ts:114 — [—]  
  "Foi uma noite difícil para todo mundo, mas pela manhã a febre já tinha passado."

### `bb_cachorro_familia` — O Cachorro da Família se Aproxima (0-2, acontecimento_puro) — src/data/events/earlyChildhood/babyEvents.ts

Situação: "O cachorro da casa se aproxima devagar, farejando curioso o bebê sentado no tapete."  
**Direção de correção:** Reação de bebê OK, mas "o cachorro da casa" não existe no estado (dispensado no teste de contexto) e nunca reaparece. Considerar criar o pet ou condicionar.

- L `opt_estender_mao_cachorro` — src/data/events/earlyChildhood/babyEvents.ts:155 — [INVENTED_PERSON]  
  "Vocês dois se entenderam bem: o cachorro deitou do seu lado, protetor."
- L `opt_assustar_cachorro` — src/data/events/earlyChildhood/babyEvents.ts:164 — [INVENTED_PERSON]  
  "Você chorou, o cachorro recuou na hora, e seus pais vieram acalmar os dois."

### `bb_parquinho_bebes` — Tarde no Parquinho para Bebês (1-2, acontecimento_puro) — src/data/events/earlyChildhood/babyEvents.ts

Situação: "No gramado do parque, um grupo de bebês da mesma idade está sentado em um cercadinho de brinquedos macios."  
**Direção de correção:** REESCREVER: "sua primeira lembrança de outras crianças" decide a memória do personagem (e crianças de 1-2 anos não formam memória duradoura); "disputa pelo brinquedo" decide comportamento. Enquadrar pelos pais ("Seus pais contam que...").

- **V** `opt_brincar_outros_bebes` — src/data/events/earlyChildhood/babyEvents.ts:187 — [DECIDED_BEHAVIOR, INVENTED_PAST]  
  "Teve choro e disputa pelo brinquedo, mas também muita risada — sua primeira lembrança de "outras crianças"."
- L `opt_observar_de_longe` — src/data/events/earlyChildhood/babyEvents.ts:196 — [GENDER_AGREEMENT]  
  "Você passou a tarde agarrado à perna de quem cuida de você, observando os outros bebês de longe antes de se aproximar."

### `bb_musica_dança` — Música Alta na Cozinha (1-2, acontecimento_puro) — src/data/events/earlyChildhood/babyEvents.ts

Situação: "Alguém liga o rádio na cozinha e uma música animada toca enquanto prepara o almoço."  
**Direção de correção:** OK; "satisfeito" fixo e rótulo de temperamento ("do jeito seguro").

- O `opt_dancar_musica` — src/data/events/earlyChildhood/babyEvents.ts:219 — [—]  
  "Sua dancinha desengonçada arrancou risada de todo mundo em casa."
- L `opt_bater_palma_musica` — src/data/events/earlyChildhood/babyEvents.ts:228 — [GENDER_AGREEMENT]  
  "Você marcou o ritmo com as mãozinhas, satisfeito só de participar do jeito seguro."

### `bb_queda_leve` — Tombo Aprendendo a Andar (1-2, acontecimento_puro) — src/data/events/earlyChildhood/babyEvents.ts

Situação: "Tentando dar mais um passo sozinho, você perde o equilíbrio e cai sentado no tapete."  
**Direção de correção:** OK.

- O `opt_levantar_tentar_de_novo` — src/data/events/earlyChildhood/babyEvents.ts:283 — [—]  
  "Você se levantou na mesma hora e tentou outra vez, para o orgulho de quem estava assistindo."
- O `opt_chorar_colo_tombo` — src/data/events/earlyChildhood/babyEvents.ts:292 — [—]  
  "Você chorou um pouco, recebeu um colo de conforto, e só depois voltou a tentar andar."

### `crc_primeiro_dia_creche` — Primeiro Dia na Creche (3-4, marco_testemunhado) — src/data/events/earlyChildhood/toddlerWorldEvents.ts

Situação: "Você chega pela primeira vez à creche, com uma sala cheia de crianças desconhecidas e brinquedos coloridos."  
**Direção de correção:** Marco pode ficar, mas a reação (ir brincar sem olhar x chorar) é de criança de 3-4: CONVERTER em escolha_biografica ou reescrever pelos adultos ("A professora mandou um bilhete contando como foi o primeiro dia"). "animado" fixo.

- **V** `opt_explorar_creche` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:29 — [DECIDED_BEHAVIOR, DECIDED_EMOTION, GENDER_AGREEMENT]  
  "Você nem olhou para trás — foi direto brincar e voltou para casa contando tudo animado."
- **V** `opt_chorar_creche` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:38 — [DECIDED_EMOTION]  
  "Você chorou bastante na despedida, mas a professora conseguiu te acalmar com uma brincadeira."

### `prc_medo_escuro` — Medo do Escuro (3-5, acontecimento_puro) — src/data/events/earlyChildhood/toddlerWorldEvents.ts

Situação: "Na hora de dormir, o quarto fica escuro demais e você tem certeza de que tem algo se mexendo no armário."  
**Direção de correção:** Exemplo citado pelo usuário. CONVERTER em decisão (pedir a luz x encarar o armário). "tranquilo"/"orgulhoso" fixos.

- **V** `opt_pedir_luz_acesa` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:105 (MEM) — [DECIDED_EMOTION, DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  MEM: "Teve uma fase de medo do escuro, resolvida por uma luzinha de plantão que ficava acesa a noite toda."  
  RES (L104): "Com a luzinha de plantão, você dormiu tranquilo a noite inteira."
- **V** `opt_encarar_armario` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:115 (MEM) — [DECIDED_BEHAVIOR, DECIDED_EMOTION, GENDER_AGREEMENT]  
  MEM: "Enfrentou sozinho um medo do escuro ao descobrir que o vulto no armário do quarto era só um casaco pendurado."  
  RES (L114): "Você encarou o "monstro" e descobriu que era só um casaco pendurado. Ficou orgulhoso de si mesmo."

### `prc_aniversario_amiguinho` — Festa de Aniversário de um Coleguinha (3-5, acontecimento_puro) — src/data/events/earlyChildhood/toddlerWorldEvents.ts

Situação: "Você foi convidado para o aniversário de um coleguinha da creche, com pula-pula e bolo de chocolate."  
**Direção de correção:** CONVERTER em decisão ou reescrever pelo mundo (festa, bolo). "exausto e feliz", "tranquilo" e "convidado" (descricao) fixos.

- **V** `opt_brincar_pulapula` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:171 — [DECIDED_BEHAVIOR, DECIDED_EMOTION, GENDER_AGREEMENT]  
  "Você voltou para casa exausto e feliz, cheirando a bolo de chocolate."
- **V** `opt_ficar_perto_pais` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:180 — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  "Você levou um tempo para se soltar, mas no fim comeu um pedaço de bolo bem tranquilo."

### `prc_curiosidade_bicho` — Um Inseto Estranho no Quintal (3-6, acontecimento_puro) — src/data/events/earlyChildhood/toddlerWorldEvents.ts

Situação: "Explorando o quintal, você encontra um inseto grande e diferente andando devagar na terra."  
**Direção de correção:** CONVERTER em decisão (observar x fugir) — curiosidade x medo é exatamente traço.

- **V** `opt_observar_inseto` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:204 (MEM) — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  MEM: "Passou uma tarde agachado no quintal observando um inseto, cheio de perguntas sobre o bicho."  
  RES (L203): "Você ficou minutos observando o inseto andar, fazendo perguntas sobre ele para quem estava por perto."
- **V** `opt_fugir_inseto` — src/data/events/earlyChildhood/toddlerWorldEvents.ts:214 (MEM) — [DECIDED_EMOTION, DECIDED_BEHAVIOR]  
  MEM: "Levou um susto com um inseto grande no quintal e só voltou a brincar lá depois que garantiram que ele tinha ido embora."  
  RES (L213): "Você saiu correndo e só voltou ao quintal depois que alguém prometeu que o inseto tinha ido embora."

### `tec_primeiro_jogo_tablet` — Jogo Novo no Tablet da Família (6-10, acontecimento_puro) — src/data/events/childhood/schoolWorldEvents.ts

Situação: "Seus pais baixaram um joguinho educativo no tablet da casa e deixaram você experimentar sozinho pela primeira vez."  
**Direção de correção:** CONVERTER em decisão (obedecer ao tempo combinado x pedir mais) — é decisão comportamental de manual.

- **V** `opt_seguir_regras_tempo_tela` — src/data/events/childhood/schoolWorldEvents.ts:126 (MEM) — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  MEM: "Ganhou os primeiros minutos sozinho no tablet da casa e devolveu na hora combinada."  
  RES (L125): "Você jogou uma fase animada e devolveu o tablet na hora combinada, ganhando confiança para usar de novo."
- **V** `opt_pedir_mais_tempo_tela` — src/data/events/childhood/schoolWorldEvents.ts:136 (MEM) — [DECIDED_BEHAVIOR]  
  MEM: "Pediu mais tempo no tablet da casa e acabou com a hora de tela encurtada depois."  
  RES (L135): "Você conseguiu alguns minutos extras, mas na próxima vez o tempo de tela ficou mais curto."

### `esp_torneio_bairro_futebol` — Torneio de Futebol entre Ruas (8-13, acontecimento_puro) — src/data/events/childhood/schoolWorldEvents.ts

Situação: "A associação de moradores organizou um torneio de futebol entre as ruas do bairro, com times de crianças."  
**Direção de correção:** CONVERTER em decisão (capitão x qualquer posição) ou narrar só o torneio. "eleito"/"tranquilo" fixos.

- **V** `opt_capitao_time_rua` — src/data/events/childhood/schoolWorldEvents.ts:241 (MEM) — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  MEM: "Perdeu a final do torneio de futebol do bairro, mas saiu de lá eleito o capitão mais dedicado pelos adversários."  
  RES (L240): "Seu time perdeu na final, mas você foi eleito o capitão mais dedicado do torneio pelos próprios adversários."
- **V** `opt_jogar_qualquer_posicao` — src/data/events/childhood/schoolWorldEvents.ts:251 (MEM) — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  MEM: "Jogou um torneio de futebol entre as ruas do bairro, em qualquer posição que precisassem."  
  RES (L250): "Você jogou tranquilo em qualquer posição que precisassem, e o time se divertiu do início ao fim."

### `hob_colecao_figurinhas` — Álbum de Figurinhas da Copa (7-12, acontecimento_puro) — src/data/events/childhood/schoolWorldEvents.ts

Situação: "Todo mundo na escola está trocando figurinhas para completar o álbum da Copa do Mundo."  
**Direção de correção:** CONVERTER em escolha_biografica (colecionar ou não é gosto).

- **V** `opt_trocar_figurinhas_justo` — src/data/events/childhood/schoolWorldEvents.ts:275 (MEM) — [DECIDED_PREFERENCE, DECIDED_BEHAVIOR]  
  MEM: "Completou o álbum de figurinhas da Copa inteiro, trocando repetidas no pátio da escola."  
  RES (L274): "Você completou o álbum inteiro fazendo amizades novas em cada troca."
- **V** `opt_nao_colecionar_figurinhas` — src/data/events/childhood/schoolWorldEvents.ts:286 (MEM) — [DECIDED_PREFERENCE]  
  MEM: "Passou ao largo da febre de figurinhas que tomou conta da escola naquele ano."  
  RES (L285): "Você não ligou muito para a febre das figurinhas e usou o tempo com outras coisas."

### `ado_paixao_secreta` — Aquela Pessoa da Sala ao Lado (12-15, acontecimento_puro) — src/data/events/adolescence/socialWorldEvents.ts

Situação: "Tem uma pessoa da sua turma que você não consegue tirar da cabeça, mas nunca teve coragem de puxar assunto."  
**Direção de correção:** GRAVE. A descricao decide que o personagem tem uma paixão ("não consegue tirar da cabeça") e é tímido ("nunca teve coragem"); o desfecho cria NPC tipo "paixao" + flag tem_paixao_secreta. eventSystem.ts:279 usa genero default "masculino" → toda paixão é um menino, decidindo orientação. CONVERTER em decisão/escolha biográfica, com gênero escolhido ou inferido, ou APAGAR. MEM de puxar_assunto diz "pessoa da sala ao lado" (descricao: "da sua turma") e "desajeitado" fixo.

- **V** `opt_admirar_de_longe` — src/data/events/adolescence/socialWorldEvents.ts:31 — [DECIDED_PREFERENCE, DECIDED_BEHAVIOR]  
  "Você guardou esse sentimento só para você — por enquanto. Talvez o momento certo apareça."
- **V** `opt_puxar_assunto_paixao` — src/data/events/adolescence/socialWorldEvents.ts:50 (MEM) — [DECIDED_PREFERENCE, DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  MEM: "Puxou conversa com a pessoa da sala ao lado e, de tão desajeitado, os dois acabaram rindo."  
  RES (L49): "A conversa saiu mais desajeitada do que você planejou, mas vocês dois riram bastante e ficou tudo bem mais leve."

### `ado_grupo_amigos_turma` — A Turma da Escola se Forma (12-14, acontecimento_puro) — src/data/events/adolescence/socialWorldEvents.ts

Situação: "No segundo semestre, um grupo de colegas passa a te chamar sempre para sentar junto no intervalo."  
**Direção de correção:** entrar_grupo_confianca é BOM exemplo (mundo reage a escolha passada real). entrar_grupo_turma/manter_distancia decidem a postura social; CONVERTER em decisão. "os poucos amigos de sempre" pode não existir no estado.

- O `opt_entrar_grupo_confianca` — src/data/events/adolescence/socialWorldEvents.ts:86 — [—]  
  "Ninguém nem discutiu quem ficaria com o dinheiro da vaquinha — todo mundo lembrava de você como "aquele que devolveu o dinheiro achado" anos atrás."
- **V** `opt_entrar_grupo_turma` — src/data/events/adolescence/socialWorldEvents.ts:105 — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  "Vocês viraram um grupo fechado, com piadas internas e planos para o fim de semana."
- **V** `opt_manter_distancia_grupo` — src/data/events/adolescence/socialWorldEvents.ts:123 — [DECIDED_PREFERENCE, INVENTED_PERSON]  
  "A turma se formou sem você por perto: sobraram os poucos amigos de sempre, e estava bom assim."

### `adm_primeiro_salario_cai` — O Primeiro Salário Cai na Conta (18-27, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "O aplicativo do banco avisa: caiu. É o primeiro dinheiro que é inteiramente seu, e ele já vem com uma lista de destinos."  
Condições: `{"empregado": true}`  
**Direção de correção:** salario_guardou decide o valor poupança (e dá +R$400); CONVERTER em decisão ou reescrever como fato puro ("O salário caiu e as contas levaram quase tudo").

- L `opt_salario_sumiu` — src/data/events/adult/adultWorldEvents.ts:58 (MEM) — [DECIDED_BEHAVIOR]  
  MEM: "Recebeu o primeiro salário da vida e viu o dinheiro acabar em contas antes do fim do mês."  
  RES (L57): "O dinheiro durou menos do que você imaginava: conta, transporte, um agrado para casa e acabou. Mesmo assim, olhar o extrato e ver que veio do seu trabalho foi diferente de tudo."
- **V** `opt_salario_guardou` — src/data/events/adult/adultWorldEvents.ts:66 (MEM) — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  MEM: "Recebeu o primeiro salário da vida e conseguiu guardar uma parte antes de gastar o resto."  
  RES (L65): "Você separou uma parte antes de gastar qualquer coisa. Não foi muito, mas foi a primeira vez que sobrou dinheiro seu no fim do mês."

### `adm_republica_conta_dividida` — A Conta Dividida da Casa (19-30, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Morar com outras pessoas tem seu preço: alguém sempre esquece de passar a parte dele, e o boleto não espera."  
**Direção de correção:** Sem condição: presume que o personagem mora em república (INVENTED_PAST). pagou_sozinho decide postura de evitar conflito (-R$320). Condicionar e converter.

- L `opt_republica_acertou` — src/data/events/adult/adultWorldEvents.ts:87 — [INVENTED_PAST]  
  "Depois de duas conversas meio secas na cozinha, vocês criaram uma planilha e o assunto morreu. A casa ficou mais leve."
- **V** `opt_republica_pagou_sozinho` — src/data/events/adult/adultWorldEvents.ts:94 — [DECIDED_BEHAVIOR, DECIDED_VALUE, INVENTED_PAST]  
  "Você acabou cobrindo a diferença para não criar caso. Ninguém agradeceu, e você passou o mês fazendo as contas de cabeça."

### `adm_amigos_se_espalham` — A Turma se Espalha pelo Mapa (23-36, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Um foi para outro estado atrás de emprego, outra casou e mudou de bairro, um terceiro simplesmente parou de responder. O grupo que se via toda semana virou um grupo de mensagens."  
**Direção de correção:** Presume um grupo de amigos semanal sem temAmigos. espalha_mantem decide que o personagem se esforçou em manter.

- **V** `opt_espalha_mantem` — src/data/events/adult/adultWorldEvents.ts:115 — [DECIDED_BEHAVIOR, INVENTED_PAST]  
  "Vocês combinaram uma chamada por mês e, contra todas as probabilidades, cumpriram. A distância virou rotina em vez de fim."
- L `opt_espalha_esvazia` — src/data/events/adult/adultWorldEvents.ts:122 — [INVENTED_PAST]  
  "As mensagens foram rareando até virarem parabéns de aniversário. Não houve briga nenhuma — só a vida de cada um puxando para um lado."

### `adm_mudanca_caminhao_emprestado` — Mudança de Casa num Sábado (20-60, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Caixas de papelão do mercado, um caminhão alugado por meio período e a ajuda de quem apareceu. A casa nova ainda cheira a tinta."  
**Direção de correção:** Premissa decide que o personagem mudou de casa (decisão biográfica grande) sem alterar estado de moradia. Texto dos desfechos é mundo. "exausto" fixo.

- L `opt_mudanca_tranquila` — src/data/events/adult/adultWorldEvents.ts:143 — [DECIDED_BEHAVIOR]  
  "Deu tudo certo, terminou antes do escurecer e o jantar foi pizza no chão da sala vazia. Um dos melhores jantares em muito tempo."
- L `opt_mudanca_estragou` — src/data/events/adult/adultWorldEvents.ts:151 (MEM) — [DECIDED_BEHAVIOR, GENDER_AGREEMENT]  
  MEM: "Mudou de casa num sábado de chuva: o caminhão atrasou, uma caixa de louça se perdeu e a primeira noite foi entre caixas."  
  RES (L150): "Choveu no meio da tarde, uma caixa de louça não sobreviveu e o caminhão atrasou duas horas. Você dormiu entre caixas, exausto."

### `adm_chefia_nova` — Chefia Nova na Área (22-64, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Anunciaram a mudança numa reunião de quinze minutos. Ninguém sabe direito o que vai mudar, e todo mundo tem uma teoria."  
Condições: `{"empregado": true}`  
**Direção de correção:** OK — modelo a seguir (o mundo age, o jogador não é descrito agindo).

- O `opt_chefia_melhor` — src/data/events/adult/adultWorldEvents.ts:177 — [—]  
  "A pessoa nova ouviu antes de mexer em qualquer coisa. Em poucos meses o clima da equipe melhorou de um jeito que ninguém esperava."
- O `opt_chefia_pior` — src/data/events/adult/adultWorldEvents.ts:184 — [—]  
  "Veio com metas novas, reuniões novas e pouca paciência. O trabalho continuou o mesmo; o desgaste, não."
- O `opt_chefia_indiferente` — src/data/events/adult/adultWorldEvents.ts:191 — [—]  
  "Mudou o nome na porta da sala e quase nada mais. A rotina seguiu igual, o que, pensando bem, já era alguma coisa."

### `adm_colega_demitido` — Uma Cadeira Vazia na Segunda-feira (22-64, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Você chega e a mesa ao lado está limpa. O aviso interno usa a palavra "reestruturação" e ninguém comenta em voz alta."  
Condições: `{"empregado": true}`  
**Direção de correção:** demitido_ajudou decide altruísmo ("Você indicou seu colega") → CONVERTER em decisão. demitido_medo decide ansiedade.

- **V** `opt_demitido_medo` — src/data/events/adult/adultWorldEvents.ts:213 — [DECIDED_EMOTION, DECIDED_BEHAVIOR]  
  "Você passou semanas lendo entrelinhas em todo e-mail que chegava. O trabalho rendeu menos e o sono também."
- **V** `opt_demitido_ajudou` — src/data/events/adult/adultWorldEvents.ts:220 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você indicou seu colega para uma vaga que conhecia. Deu certo, e vocês continuaram se falando muito depois disso."

### `adm_rotina_remota` — A Rotina Mudou de Endereço (24-62, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Parte da semana passou a ser de casa. Some o trânsito, some também a conversa de corredor — e a mesa da cozinha vira escritório."  
Condições: `{"empregado": true}`  
**Direção de correção:** Aceitável; ganhou decide leve rotina.

- L `opt_remoto_ganhou` — src/data/events/adult/adultWorldEvents.ts:242 — [DECIDED_BEHAVIOR]  
  "As duas horas que você perdia no deslocamento viraram sono, almoço em casa e uma caminhada no fim da tarde. Foi um ano melhor do que os anteriores."
- O `opt_remoto_perdeu` — src/data/events/adult/adultWorldEvents.ts:252 — [—]  
  "Sem a separação entre casa e trabalho, o expediente foi se esticando. Você percebeu que fazia meses que não conversava com ninguém sobre nada que não fosse prazo."

### `adm_reconhecimento_reuniao` — Seu Nome Citado na Reunião (24-64, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "No meio de uma apresentação qualquer, alguém cita um trabalho seu como exemplo. A sala inteira olha."  
Condições: `{"empregado": true}`  
**Direção de correção:** OK; so_elogio atribui reação ("andando um pouco mais reto") — leve.

- O `opt_reconhecimento_abriu_porta` — src/data/events/adult/adultWorldEvents.ts:277 — [—]  
  "Duas semanas depois te chamaram para um projeto maior. Não veio aumento junto, mas veio espaço — e espaço às vezes vale mais."
- L `opt_reconhecimento_so_elogio` — src/data/events/adult/adultWorldEvents.ts:284 — [DECIDED_EMOTION]  
  "O elogio foi sincero e ficou nisso. Ainda assim, você saiu da sala andando um pouco mais reto."

### `adm_conta_de_luz_alta` — A Conta de Luz Veio Assustadora (22-85, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Você olha o valor duas vezes, depois procura o mês anterior para comparar. Não é impressão: dobrou."  
**Direção de correção:** Leve: "Contestou", "apagou algumas luzes por hábito novo" — ações plausíveis e de baixo valor; pode ficar ou neutralizar.

- L `opt_luz_erro` — src/data/events/adult/adultWorldEvents.ts:343 (MEM) — [DECIDED_BEHAVIOR]  
  MEM: "Contestou uma conta de luz que veio dobrada, e depois de duas ligações conseguiu a correção."  
  RES (L342): "Era erro de leitura. Depois de duas ligações e um protocolo anotado num papel, o valor foi corrigido na fatura seguinte."
- L `opt_luz_real` — src/data/events/adult/adultWorldEvents.ts:350 — [DECIDED_BEHAVIOR]  
  "Era bandeira tarifária mesmo. Você pagou, apagou algumas luzes por hábito novo e seguiu a vida."

### `adm_obra_do_vizinho` — A Obra do Vizinho (22-88, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Começou numa terça, às sete da manhã. Disseram que seriam duas semanas."  
**Direção de correção:** rendeu_amizade decide que o personagem reclamou e fez amizade (cria NPC amigo). Neutralizar ("O vizinho veio pedir desculpas pelo barulho e a conversa rendeu").

- L `opt_obra_longa` — src/data/events/adult/adultWorldEvents.ts:371 — [DECIDED_BEHAVIOR]  
  "Foram cinco meses de furadeira. Você aprendeu a reconhecer o barulho de cada ferramenta e passou a sair de casa mais cedo."
- **V** `opt_obra_rendeu_amizade` — src/data/events/adult/adultWorldEvents.ts:378 — [DECIDED_BEHAVIOR]  
  "Numa das reclamações vocês acabaram conversando de verdade pela primeira vez em anos. A obra terminou e a conversa continuou."

### `adm_apagao_no_bairro` — Apagão no Bairro (16-92, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "A energia cai no começo da noite e o bairro inteiro vai junto. Pelas janelas abertas dá para ouvir as pessoas conversando de sacada em sacada."  
**Direção de correção:** apagao_rua decide que o personagem desceu e conversou três horas; reescrever como fato do bairro.

- **V** `opt_apagao_rua` — src/data/events/adult/adultWorldEvents.ts:409 — [DECIDED_BEHAVIOR]  
  "Com todo mundo sem nada para fazer, a calçada encheu. Foram três horas de conversa com gente que você via todo dia e nunca tinha ouvido falar."
- O `opt_apagao_geladeira` — src/data/events/adult/adultWorldEvents.ts:416 — [—]  
  "Voltou só de madrugada. Boa parte do que estava na geladeira teve que ir fora, e o susto do prejuízo demorou a passar."

### `adm_reencontro_na_feira` — Um Rosto Conhecido na Feira (25-88, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Entre a banca de tomate e a de peixe, alguém te chama pelo nome. Leva uns segundos para a ficha cair."  
**Direção de correção:** Decide o quanto o personagem se engajou; reescrever pelo lado do outro ou converter.

- **V** `opt_feira_conversa_boa` — src/data/events/adult/adultWorldEvents.ts:472 — [DECIDED_BEHAVIOR, DECIDED_EMOTION]  
  "Vocês conversaram encostados na banca até a feira começar a desmontar. Saiu dali com o número atualizado e uma vontade real de reencontrar."
- **V** `opt_feira_conversa_morna` — src/data/events/adult/adultWorldEvents.ts:479 — [DECIDED_BEHAVIOR]  
  "Trocaram duas frases de gentileza e cada um seguiu com sua sacola. Você passou o resto da manhã tentando lembrar de onde conhecia aquela pessoa."

### `adm_bairro_mudou` — O Bairro Mudou de Cara (30-88, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "A padaria de sempre virou uma loja de celular. O terreno baldio onde você jogava bola agora tem prédio."  
**Direção de correção:** Descricao inventa passado ("O terreno baldio onde você jogava bola"). Desfechos decidem comportamento/sentimento. Reescrever como fato do bairro.

- **V** `opt_bairro_saudade` — src/data/events/adult/adultWorldEvents.ts:500 — [DECIDED_BEHAVIOR, DECIDED_EMOTION, INVENTED_PAST]  
  "Você passou a fazer caminhos mais longos só para evitar as esquinas que não reconhecia mais. O bairro ficou melhor para quem chegou e mais estranho para quem ficou."
- **V** `opt_bairro_gostou` — src/data/events/adult/adultWorldEvents.ts:507 — [DECIDED_BEHAVIOR, INVENTED_PAST]  
  "Abriu uma praça onde não tinha nada e a rua ganhou vida à noite. Você passou a sair de casa mais vezes do que nos dez anos anteriores."

### `adm_grupo_da_familia` — O Grupo da Família no Celular (25-88, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Duzentas mensagens não lidas, sendo cento e oitenta bom-dia. E, no meio delas, uma notícia de verdade que quase passou batido."  
**Direção de correção:** viu_a_tempo decide "Ligou no mesmo dia" (leve); perdeu é mundo.

- **V** `opt_grupo_viu_a_tempo` — src/data/events/adult/adultWorldEvents.ts:532 — [DECIDED_BEHAVIOR]  
  "Você rolou a conversa inteira e achou o recado importante. Ligou no mesmo dia, e a ligação valeu mais do que qualquer mensagem valeria."
- O `opt_grupo_perdeu` — src/data/events/adult/adultWorldEvents.ts:539 — [—]  
  "Você só soube dias depois, por outra pessoa. Ninguém cobrou nada, o que de certa forma foi pior."

### `adm_pais_precisando` — Seus Pais Começam a Precisar de Você (33-66, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Antes era você quem ligava pedindo ajuda. Agora as ligações vêm no outro sentido: uma consulta para marcar, um aplicativo que não abre, uma dúvida sobre um documento."  
**Direção de correção:** Sem condição de pais vivos. assumiu decide papel de cuidador (valor); dividiu inventa irmãos ("revezamento na família"). CONVERTER em decisão + condicionar.

- **V** `opt_pais_assumiu` — src/data/events/adult/adultWorldEvents.ts:560 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você foi assumindo as coisas aos poucos, quase sem perceber. Cansa, e ao mesmo tempo vocês nunca conversaram tanto quanto neste ano."
- **V** `opt_pais_dividiu` — src/data/events/adult/adultWorldEvents.ts:571 — [DECIDED_BEHAVIOR, INVENTED_PERSON]  
  "Vocês combinaram um revezamento na família e cada um ficou com uma parte. Funcionou melhor do que qualquer um esperava."

### `adm_amigo_de_infancia_reaparece` — Alguém da Infância Reaparece (30-75, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Uma mensagem de um número desconhecido, com uma foto antiga anexada e a pergunta: "lembra disso?"."  
**Direção de correção:** Inventa amigo de infância inexistente no estado; virou_amizade decide aceitação e cria NPC. Condicionar a um ex-amigo real (inativo) e converter a resposta.

- **V** `opt_reaparece_virou_amizade` — src/data/events/adult/adultWorldEvents.ts:596 — [DECIDED_BEHAVIOR, INVENTED_PAST]  
  "Vocês marcaram um café que durou quatro horas. Vinte anos depois, era como se nenhum deles tivesse passado."
- L `opt_reaparece_ficou_no_passado` — src/data/events/adult/adultWorldEvents.ts:611 (MEM) — [INVENTED_PAST]  
  MEM: "Reencontrou alguém da infância e descobriu que só restavam as lembranças em comum."  
  RES (L610): "A conversa foi boa enquanto durou, mas fora as lembranças vocês não tinham mais muito em comum. Ficou o carinho pelo que foi."

### `adm_casamento_de_amigo` — Casamento de Alguém Próximo (23-58, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Convite em mãos, data marcada, e a certeza de que vai encontrar meio mundo que você não vê há anos."  
**Direção de correção:** Decide que foi, dançou/ficou deslocado, e cobra -R$400 nos dois. CONVERTER em decisão (ir, como ir).

- **V** `opt_casamento_noite_boa` — src/data/events/adult/adultWorldEvents.ts:632 — [DECIDED_BEHAVIOR]  
  "A festa varou. Você dançou mais do que dança em cinco anos e voltou para casa com os pés doendo e o rosto cansado de rir."
- **V** `opt_casamento_deslocado` — src/data/events/adult/adultWorldEvents.ts:639 — [DECIDED_BEHAVIOR, DECIDED_EMOTION]  
  "Você passou boa parte da noite na mesa, olhando um grupo de gente que tinha seguido junto enquanto você seguia para outro lado. Saiu cedo."

### `adm_sono_mudou` — O Sono Não é Mais o Mesmo (32-85, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Você acorda às quatro da manhã sem motivo nenhum e fica olhando o teto até o despertador tocar. Não é todo dia, mas virou frequente."  
**Direção de correção:** sono_ajustou decide autocuidado; neutralizar ("Depois de alguns meses o sono voltou") ou converter.

- **V** `opt_sono_ajustou` — src/data/events/adult/adultWorldEvents.ts:664 — [DECIDED_BEHAVIOR]  
  "Você mudou o horário do café, tirou a tela da cabeceira e voltou a dormir a noite inteira depois de alguns meses."
- O `opt_sono_arrastou` — src/data/events/adult/adultWorldEvents.ts:671 — [—]  
  "O cansaço virou pano de fundo do ano. Você foi funcionando, mas as tardes ficaram longas de um jeito que antes não eram."

### `adm_letra_pequena` — A Letra Miúda Ficou Difícil (40-72, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Você afasta o rótulo do braço para conseguir ler o prazo de validade, e percebe que faz um tempo que vem fazendo isso."  
**Direção de correção:** CONVERTER em decisão (ótica x adiar) — o fato (vista cansada) é mundo, a resposta é agência.

- **V** `opt_letra_oculos` — src/data/events/adult/adultWorldEvents.ts:692 — [DECIDED_BEHAVIOR]  
  "Você foi à ótica, saiu com um óculos de leitura e leu a bula inteira no caminho de volta, só porque dava. Bobagem, mas foi bom."
- **V** `opt_letra_empurrou` — src/data/events/adult/adultWorldEvents.ts:700 (MEM) — [DECIDED_BEHAVIOR]  
  MEM: "Começou a ler tudo de braço esticado, adiando os óculos de leitura por mais um ano."  
  RES (L699): "Você foi empurrando com o braço esticado e a lanterna do celular. Deu para levar, com uma dor de cabeça a mais no fim do dia."

### `adm_reencontro_de_turma` — Reencontro de Turma (36-62, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "Vinte anos depois, o grupo do colégio marcou um jantar. Metade confirmou, um terço vai aparecer."  
**Direção de correção:** Leve: decide presença (-R$180). Converter a ida ou narrar o convite.

- L `opt_turma_leve` — src/data/events/adult/adultWorldEvents.ts:754 — [DECIDED_BEHAVIOR]  
  "Ninguém estava medindo ninguém. Foram três horas de histórias antigas e uma conversa honesta sobre como todo mundo achava que já teria tudo resolvido a essa altura."
- L `opt_turma_comparacao` — src/data/events/adult/adultWorldEvents.ts:761 — [DECIDED_EMOTION]  
  "Deu para sentir a conta sendo feita em silêncio: quem casou, quem ganhou quanto, quem sumiu. Você voltou para casa pensando demais."

### `adm_rotina_de_anos_acaba` — Uma Rotina de Anos Termina (38-78, acontecimento_puro) — src/data/events/adult/adultWorldEvents.ts

Situação: "O bar fechou, o time acabou, o grupo parou de se reunir — não importa qual: uma coisa que você fazia toda semana há anos simplesmente deixou de existir."  
**Direção de correção:** Descricao inventa rotina semanal de anos que o estado não tem.

- L `opt_rotina_vazio` — src/data/events/adult/adultWorldEvents.ts:782 — [DECIDED_EMOTION, INVENTED_PAST]  
  "Nas primeiras semanas você continuou reservando aquele horário sem ter o que fazer nele. Demorou para o corpo entender que tinha acabado."
- L `opt_rotina_abriu_espaco` — src/data/events/adult/adultWorldEvents.ts:789 — [INVENTED_PAST]  
  "O buraco na agenda acabou virando outra coisa. Levou uns meses, mas você encontrou o que fazer com aquele tempo."

### `lat_caminhada_da_manha` — A Caminhada das Sete (57-92, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "Sempre no mesmo horário, sempre o mesmo trajeto, quase sempre as mesmas pessoas. Ninguém combinou nada; foi acontecendo."  
**Direção de correção:** Premissa decide um hábito diário ("sempre no mesmo horário") — identidade. APAGAR ou exigir histórico (atividade praticada).

- **V** `opt_caminhada_virou_turma` — src/data/events/senior/laterLifeEvents.ts:43 — [DECIDED_BEHAVIOR, INVENTED_PAST]  
  "O que era exercício virou encontro. Agora a caminhada termina num café que às vezes dura mais que a caminhada."
- **V** `opt_caminhada_sozinho` — src/data/events/senior/laterLifeEvents.ts:53 — [DECIDED_PREFERENCE, INVENTED_PAST]  
  "A caminhada seguiu solitária, com o rádio no ouvido. Uma hora por dia em que ninguém precisa de nada de você."

### `lat_crianca_na_casa` — Criança na Casa de Novo (58-92, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "Depois de anos de silêncio, a casa passou a receber uma criança nos fins de semana. Brinquedo no chão, barulho na cozinha, horário virado."  
**Direção de correção:** Sem condição temFilhos/netos: criança inventada. Desfechos decidem sentimentos íntimos ("vergonha de gostar"). "exausto" fixo.

- **V** `opt_crianca_renovou` — src/data/events/senior/laterLifeEvents.ts:77 — [DECIDED_EMOTION, INVENTED_PERSON]  
  "Você redescobriu paciência que nem sabia que ainda tinha. As segundas-feiras ficaram mais vazias, mas os domingos valiam por elas."
- **V** `opt_crianca_cansou` — src/data/events/senior/laterLifeEvents.ts:88 — [DECIDED_EMOTION, INVENTED_PERSON, GENDER_AGREEMENT]  
  "Você amou cada minuto e ficou exausto em todos eles. No domingo à noite, a casa em silêncio era um alívio de que você tinha vergonha de gostar."

### `lat_perda_da_geracao` — Alguém da Sua Geração Partiu (60-98, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "A notícia chega por telefone, no meio da tarde. Não era da família, era de antes dela: alguém que atravessou a vida inteira junto com você."  
**Direção de correção:** Inventa "alguém que atravessou a vida inteira junto com você". Usar um vínculo social real (amigo antigo) — a F6 já tem.

- L `opt_perda_reuniu` — src/data/events/senior/laterLifeEvents.ts:113 — [INVENTED_PERSON]  
  "O velório reuniu gente que não se via há décadas. Foi triste e foi bom, e as duas coisas couberam no mesmo dia sem se atrapalharem."
- L `opt_perda_calou` — src/data/events/senior/laterLifeEvents.ts:123 — [DECIDED_EMOTION, INVENTED_PERSON]  
  "Você ficou dias sem conseguir explicar direito o que sentia. Não era só a pessoa: era mais um pedaço do mundo que só existia na memória de vocês dois."

### `lat_joelho_na_escada` — A Escada Ficou Mais Comprida (58-95, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "Não dói, exatamente. Só que agora você conta os degraus, e antes não contava."  
**Direção de correção:** O fato (joelho) é mundo; a resposta (corrimão x desistir) é agência. O próprio texto admite: "sem nunca decidir isso em voz alta". CONVERTER.

- **V** `opt_escada_adaptou` — src/data/events/senior/laterLifeEvents.ts:147 — [DECIDED_BEHAVIOR]  
  "Você instalou um corrimão, passou a subir devagar e parou de brigar com o próprio ritmo. A escada voltou a ser só uma escada."
- **V** `opt_escada_evitou` — src/data/events/senior/laterLifeEvents.ts:158 — [DECIDED_BEHAVIOR]  
  "Você foi desistindo de subir. Primeiro o segundo andar, depois a laje, depois a casa dos outros — sem nunca decidir isso em voz alta."

### `lat_tecnologia_nova` — Mudaram o Aplicativo de Novo (58-95, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "O banco atualizou o aplicativo e trocou tudo de lugar. O que você fazia em dois toques agora tem menu novo, nome novo e um botão escondido."  
**Direção de correção:** CONVERTER (aprender sozinho e ensinar x pedir ajuda).

- **V** `opt_tecnologia_dominou` — src/data/events/senior/laterLifeEvents.ts:182 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você sentou com calma, anotou o passo a passo num papel e aprendeu. Depois ensinou duas pessoas do prédio que estavam no mesmo aperto."
- **V** `opt_tecnologia_pediu_ajuda` — src/data/events/senior/laterLifeEvents.ts:192 — [DECIDED_BEHAVIOR, DECIDED_EMOTION]  
  "Você acabou ligando para alguém mais novo da família. Resolveu em cinco minutos, mas ficou com a sensação incômoda de estar ficando para trás."

### `lat_casa_grande_demais` — A Casa Ficou Grande Demais (60-92, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "Tem quarto que você não entra há meses. A conta de água é a mesma de quando eram quatro pessoas."  
**Direção de correção:** Inventa passado ("quando eram quatro pessoas"); reaproveitou decide gosto ("ateliê, oficina, biblioteca") e gasta -R$600. CONVERTER/condicionar.

- **V** `opt_casa_reaproveitou` — src/data/events/senior/laterLifeEvents.ts:218 (MEM) — [DECIDED_PREFERENCE, DECIDED_BEHAVIOR, INVENTED_PAST]  
  MEM: "Transformou um quarto que estava vazio havia meses no cômodo que sempre quis ter."  
  RES (L217): "Você transformou o quarto vazio no que sempre quis ter e nunca teve espaço: ateliê, oficina, biblioteca. A casa voltou a ser do tamanho certo."
- **V** `opt_casa_fechou_portas` — src/data/events/senior/laterLifeEvents.ts:229 — [DECIDED_BEHAVIOR, INVENTED_PAST]  
  "Você foi fechando as portas dos cômodos que não usava. A casa encolheu por dentro sem mudar por fora."

### `lat_tempo_que_sobra` — A Semana Ficou Sem Formato (60-90, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "Sem horário para acordar, sem dia que precise ser diferente do outro. A terça é igual ao sábado, e isso é mais estranho do que parecia que seria."  
Condições: `{"empregado": false}`  
**Direção de correção:** deu_forma decide rotina e gosto (leitura). Reescrever como fato ou converter.

- **V** `opt_tempo_deu_forma` — src/data/events/senior/laterLifeEvents.ts:254 — [DECIDED_BEHAVIOR, DECIDED_PREFERENCE]  
  "Você foi criando marcos próprios: a feira na quarta, a ligação de domingo, a manhã de leitura. A semana voltou a ter desenho, e dessa vez foi você quem desenhou."
- L `opt_tempo_dissolveu` — src/data/events/senior/laterLifeEvents.ts:264 — [DECIDED_EMOTION]  
  "Os dias foram se dissolvendo uns nos outros. Você percebeu num fim de tarde que não sabia dizer o que tinha feito na semana inteira."

### `lat_arrumar_as_fotos` — A Caixa de Fotos (62-95, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "Fotos soltas, algumas sem data, várias com gente que você levaria um tempo para nomear. Estão numa caixa de sapato há décadas."  
**Direção de correção:** Decide que o personagem organizou (valor: "forma de cuidado") ou chorou. CONVERTER. "quieto" fixo.

- **V** `opt_fotos_organizou` — src/data/events/senior/laterLifeEvents.ts:321 — [DECIDED_BEHAVIOR, DECIDED_VALUE]  
  "Você passou semanas escrevendo nomes e anos atrás de cada foto. Quem vier depois vai saber quem era cada um — o que, você percebeu, é uma forma de cuidado."
- **V** `opt_fotos_emocionou` — src/data/events/senior/laterLifeEvents.ts:333 (MEM) — [DECIDED_EMOTION, GENDER_AGREEMENT]  
  MEM: "Tentou organizar uma caixa de fotos antigas, não passou da terceira e guardou tudo de volta."  
  RES (L332): "Você não conseguiu passar da terceira foto. Guardou a caixa de volta e ficou o resto do dia quieto, num lugar que não era bem tristeza."

### `lat_fila_do_banco` — Manhã Inteira Resolvendo uma Coisa Só (60-95, acontecimento_puro) — src/data/events/senior/laterLifeEvents.ts

Situação: "Um documento, uma assinatura, um carimbo. Entre a fila, a senha e o "o senhor precisa voltar amanhã", foi-se a manhã."  
**Direção de correção:** Leve; "tratado" fixo.

- L `opt_fila_conversa` — src/data/events/senior/laterLifeEvents.ts:358 (MEM) — [DECIDED_BEHAVIOR]  
  MEM: "Perdeu uma manhã inteira numa fila de banco e saiu de lá sem resolver nada, mas rindo com a pessoa da frente."  
  RES (L357): "A fila não andava, mas a conversa com a pessoa da frente andou muito. Vocês saíram de lá rindo de uma burocracia que continuava sem resolver."
- L `opt_fila_desgastou` — src/data/events/senior/laterLifeEvents.ts:368 — [GENDER_AGREEMENT]  
  "Você voltou para casa sem ter resolvido e com a sensação de ter sido tratado como um número. Levou dois dias para criar ânimo de tentar de novo."
---

## D. Eventos de DECISÃO — desfechos que acrescentam escolhas não feitas, e premissas que decidem

O jogador escolhe a opção, então afirmar o comportamento escolhido é legítimo. Os casos abaixo são aqueles em que o texto vai além da opção, ou em que a situação decide antes de perguntar.

| arquivo:linha | Evento / opção | Texto | Categoria | Direção |
|---|---|---|---|---|
| adolescence/socialWorldEvents.ts:205 | `tec_rede_social_primeira` / opt_esperar_rede_social | "Você não teve pressa. **Quando decidiu entrar**, já sabia bem quais cuidados tomar." | ADDED_CHOICE: o jogador escolheu esperar e o texto decide que ele entrou depois | Cortar a segunda frase. |
| adolescence/socialWorldEvents.ts:183 | `tec_rede_social_primeira` (descricao) | "Com o celular novo, chegou a hora..." | INVENTED_PAST (sem condição `tem_smartphone`) | Condicionar à flag. |
| adolescenceEvents.ts:92 | `ado_primeiro_beijo` (descricao) | "a pessoa por quem você tem uma paixão secreta se aproxima" | DECIDED_PREFERENCE para todos, mesmo sem a flag `tem_paixao_secreta` | Neutralizar ("alguém da turma se aproxima"). |
| adolescenceEvents.ts:103 | `ado_primeiro_beijo` / opt_beijar_paixao_real | "Foi **ela** mesma..." | GENDER / orientação (e contradiz o NPC masculino criado por default) | Usar o gênero real do NPC. |
| adolescenceEvents.ts:126-127 | `ado_primeiro_beijo` / opt_timidez | texto "Ficar muito envergonhado"; RES "vocês continuaram grandes amigos" | GENDER; INVENTED_PERSON (amizade não existente) | Flexionar; não afirmar amizade. |
| adolescenceEvents.ts:28 | `ado_cola_prova` / opt_recusar_estudar | "sentiu orgulho de si mesmo" | GENDER | Flexionar. |
| childhoodEvents.ts:284 | `inf_bullying_defesa` / opt_defender | "o colega virou seu amigo leal para a vida toda!" | ADDED (vínculo vitalício não criado no estado) | Criar vínculo real ou suavizar. |
| childhoodEvents.ts:305 / randomEvents.ts:28 | `inf_bullying_defesa`/opt_ignorar, `rnd_carteira_perdida`/opt_ficar_dinheiro | "ficou com uma pontada de culpa" / "a sua consciência pesou" | ADDED_EMOTION (culpa moralizante imposta à escolha) | Aceitável, mas é sermão; considerar consequência de mundo em vez de sentimento. |
| youngAdultEvents.ts:7 | `jov_morar_sozinho` (descricao) | "**Você decide** que é hora de ter seu próprio espaço e aluga sua primeira kitnet" — e a opção 2 é "Continuar morando com os pais" | Premissa decide a escolha que depois é perguntada | Reescrever a situação como oportunidade. |
| seniorEvents.ts:109 | `sen_testamento_sabedoria` (descricao) | "**Você decide** sentar para organizar seu álbum... e redigir uma carta" — opção 2: "Focar apenas em viver o presente" | Idem | Idem. |
| extraEvents.ts:8 | `ext_vender_brigadeiro` (descricao) | "Você e **um amigo decidem** enrolar brigadeiros" | Premissa decide; INVENTED_PERSON (sem `temAmigos`) | Reescrever como convite; condicionar. |
| youngAdultEvents.ts:75 | `jov_amigo_emprestimo` (descricao) | "Um grande amigo seu de infância liga aflito" | INVENTED_PERSON (só `dinheiroMinimo`) | `temAmigos` + usar NPC real. |
| moreEvents.ts:423 / :445 | `sen_neto_vestibular` | "Seu neto(a) adolescente..." / MEM "ao neto ... ele saiu chateado" | INVENTED_PERSON (sem `temFilhos`/netos); GENDER (MEM masculino fixo) | Condicionar; flexionar. |
| moreEvents.ts:284 | `fam_padrinho_casamento` / opt_aceitar_honrado | MEM "Foi **padrinho** num casamento" | GENDER (a situação já diz padrinho/madrinha) | Flexionar. |
| moreEvents.ts:134 | `fac_trote_solidario` / opt_participar | "fez amizades que durarão por toda a graduação!" | ADDED/INVENTED_PERSON (nenhum NPC criado) | Criar vínculo ou suavizar. |
| seniorEvents.ts:18 | `sen_aposentadoria_inss` / opt_comemorar | "Você reuniu a família para um almoço comemorativo" | ADDED_BEHAVIOR (leve) | Aceitável/neutralizar. |
| adolescence/socialWorldEvents.ts:346-347 | `ado_escolha_futuro_profissional` / opt_confirmar | texto "da área que você **já tinha decidido** seguir"; "motivado" | INVENTED_PAST (o jogo nunca perguntou a área); GENDER | Registrar a área em escolha anterior ou remover. |
| adult/adultWorldEvents.ts:797 | `adm_voltar_a_um_hobby` (descricao) | "aquilo que você largou há vinte anos: o instrumento, as tintas, as ferramentas" | INVENTED_PAST | Condicionar a atividade/flag passada. |
| adultEvents.ts (adu_reforma_casa) | descricao | reforma da própria casa sem `temImovel` | INVENTED_PAST | Condicionar. |
| randomEvents.ts:168 | `rnd_assalto_relampago` | opção "entregar o celular **do** ladrão" | bug de texto ("ao ladrão") | Corrigir. |
| Gênero em decisões | schoolWorldEvents.ts:38 "torcedor mais animado"; :61 "orgulhoso"; :103 "brincar sozinho"; toddlerWorldEvents.ts:236 "tão organizado"; moreEvents.ts:106-107 "preocupado"; adultWorldEvents.ts:314 "foi honesto"; socialWorldEvents.ts:347 "motivado" | | GENDER_AGREEMENT | Flexionar pelo gênero do personagem. |

Decisões auditadas: 61 eventos / 138 opções. Nenhum desfecho de decisão foi classificado como violação grave de agência. Os problemas são premissas que decidem (3), escolhas extras acrescentadas (1 clara: `tec_rede_social_primeira`), pessoas e passados inventados (cerca de 7) e gênero (cerca de 10).

---

## E. Sistemas (texto gerado por código)

### E1. `src/systems/memorias/pequenaMemoria.ts` — pequenas memórias
Bem protegidas por contexto (irmão, pet, escola, amigo, filhos). Nenhuma inventa pessoa. Algumas decidem comportamento de forma leve (L):
- :214 "Um ano de brincadeira **e briga** com os irmãos" — decide briga (L, DECIDED_BEHAVIOR).
- :255 "aula de manhã, tarefa à tarde, **rua no fim do dia**" — decide que a criança brinca na rua (L).
- :280 "pergunta atrás de pergunta em casa" — decide curiosidade (L).
- :302 "tempo perdido com os amigos, **do jeito certo**" — julgamento de valor (L, DECIDED_VALUE); :304 "planos com os amigos combinados na esquina" (L).
- :228 "o animal de estimação grudado em você" — é o pet agindo, OK.
- Demais (bebê, filhos, dívida, estudo, trabalho, aposentado, cidade): OK.

### E2. `src/systems/social/redeSocial.ts` / `contextoSocial.ts`
- :225-243 `fraseDeAmizade`: registra amizade nascida por convívio passivo. As frases descrevem o vínculo, não um gesto do personagem, e flexionam gênero do NPC (F6-FIX). **OK.** Nota de design: a própria amizade (colega → amigo) é decidida sem ação do jogador, mas o código já limita isso com `TETO_CONVIVIO_PASSIVO`. Aceitável como "o que acontece".
- :421 "Você e X foram deixando de se falar, sem briga nenhuma." — deriva mútua, OK.

### E3. `src/systems/interactionCapabilitySystem.ts` (usado por familySystem → timeline via `useGame.ts:599-607`)
São ações iniciadas pelo jogador, e os textos correspondem aos rótulos do menu (`presentation/interactionPresentation.ts`: "Inventar uma história e arrastar alguém para dentro dela", "Reclamar de uma regra que você acha injusta"). Agência OK. Problemas de gênero: :312 "dele(a)", :314 "pego(a)", :327/:372/:400/:403/:406 "ele(a)", "tranquilo(a)", :409 "cheio(a)". O gênero do personagem e do NPC está disponível.
- `familySystem.ts:354` "Você se sentiu inspirado(a)!" — DECIDED_EMOTION + GENDER (L).
- `familySystem.ts:314/324` "Os olhos dele(a) brilharam", "Ele(a) adorou" — reação do outro OK; GENDER.

### E4. Outros sistemas (timeline)
| arquivo:linha | Texto | Achado |
|---|---|---|
| careerSystem.ts:423 | "Você foi promovido(a) a ..." | GENDER (gênero conhecido) |
| careerSystem.ts:456, eventSystem.ts:360 | "Você foi demitido(a) ..." | GENDER |
| careerSystem.ts:323 | "Você pediu demissão ... **para buscar novos rumos na vida**" | ADDED motive (L): o jogador pediu demissão, o motivo é inventado |
| educationSystem.ts:419 | "Você foi aprovado(a) no vestibular" | GENDER |
| relationshipSystem.ts:381 | "Nasceu seu(sua) ${novoFilho.tipo}... **O amor da sua vida** em forma de bebê!" | GENDER (tipo já é filho/filha); DECIDED_EMOTION (L) |
| relationshipSystem.ts:243 | "CASAMENTO! ... linda cerimônia com a bênção dos amigos e da família!" | INVENTED (amigos/família podem não existir), L |
| economySystem.ts:353 / :395 | "um(a) ${item.nome}" / "seu(sua) ${prop.nome}" | GENDER (do item) |
| economySystem.ts:164/188/231/255, 111, 520 | contas, dívidas, rendimento, loteria | OK (mundo/fato) |
| familySystem.ts:132 | "Seu querido pet ... Sua companhia deixará saudades eternas." | L: decide o afeto |
| familySystem.ts:197 | "Nasceu ... A casa está em festa" | OK |
| activitySystem.ts:127-148 | narrativas de atividades escolhidas pelo jogador | OK; :142 "relaxando" L |
| events/narrativeVariants.ts:25-36 | postura escolar escolhida pelo jogador ("Foi divertido") | OK/L |
| agingSystem.ts:298/748, deathSystem.ts | causa da morte | OK |
| utils/narrativeGenerator.ts:68 | "Viveu sua jornada **com honestidade e simplicidade**" (fallback quando não há conquistas) | **DECIDED_VALUE**: afirma honestidade sem base (o jogador pode ter colado, ficado com a carteira...). Trocar por texto neutro ou derivar de `escolheuAnteriormente`. |
| utils/narrativeGenerator.ts:96 | "Foi um pilar para sua família" (só por ter filhos) | DECIDED_VALUE (L) |
| utils/narrativeGenerator.ts:57/64/82/87/103 | milionário(a), Premiado(a), Lembrado(a), Nascido(a), o(a) | GENDER |
| utils/narrativeGenerator.ts:74-82 | epitáfios por felicidade/patrimônio/empatia | OK (derivados de stats acumulados pelas escolhas) |
| presentation/outcomePresentation.ts:119 | "${nome} agora faz parte da sua vida" | Exibido também para NPCs criados por acontecimento (paixão, amigo do grupo) — amplifica a violação do evento de origem |

---

## F. Achados sistêmicos (para além do texto)

1. **Acontecimentos que são decisões disfarçadas.** Pelo menos 30 dos 72 eventos auto-resolvidos têm opções que são posturas do personagem. É a origem de quase todas as 77 ocorrências de DECIDED_BEHAVIOR. Correção preferencial: voltar a `decisao_comportamental`, ou `escolha_biografica` para gostos (figurinhas, festa junina), ou reescrever as opções como variações do MUNDO (modelo correto no próprio repo: `adm_chefia_nova`, `adm_rotina_remota/perdeu`, `adm_apagao_no_bairro/geladeira`, `adm_grupo_da_familia/perdeu`).
2. **Consequências de escolha aplicadas sem escolha.** Retirar `impactosComportamentais` (happenings.ts) não basta. O dado aplica dinheiro, `relacionamentoDelta`, `adicionarFlag` e `adicionarFamiliar` de ações que o jogador não tomou. Sugestão para o auditor permanente (`coerenciaCatalogo.test.ts`): proibir `dinheiro` negativo, `adicionarFlag` e `relacionamentoDelta` negativo em acontecimentos cujo texto começa com "Você" + verbo de ação, ou exigir justificativa na lista de dispensa.
3. **`adicionarFamiliar.genero` default = 'masculino'** (eventSystem.ts:279). Todo NPC sem gênero declarado vira homem: paixão, amigos de grupo, vizinho, amigo de infância. Para `paixao` isso decide orientação. Sortear o gênero ou derivá-lo de uma escolha.
4. **Premissas que decidem.** A `descricao` também é narrativa exibida. Em acontecimentos: "você planeja uma surpresa" (rom_surpresa_jantar), "você viaja para as montanhas" (ext_viagem_serra, cujo desfecho 2 contradiz), "Sempre no mesmo horário, sempre o mesmo trajeto" (lat_caminhada_da_manha), "o terreno baldio onde você jogava bola" (adm_bairro_mudou), "quando eram quatro pessoas" (lat_casa_grande_demais), "uma coisa que você fazia toda semana há anos" (adm_rotina_de_anos_acaba), "Morar com outras pessoas..." (adm_republica_conta_dividida), "A família inteira se reuniu na sua casa" (adu_churrasco_natal).
5. **MEM divergente do RES / bugs de coerência:**
   - `sen_viagem_excursao/opt_ficar_plantinhas` (o id diz ficar; a MEM diz que viajou).
   - `ext_amigo_secreto_firma/opt_par_de_meias` (MEM "Tirou um par de meias como presente": inverte quem deu).
   - `ado_paixao_secreta/opt_puxar_assunto` (MEM "sala ao lado" x descricao "sua turma").
   - `rnd_sorteio_shopping/opt_gastar_vale_logo` (gastou tudo mas recebe +R$3.000).
6. **Gênero.** Não existe utilitário de flexão aplicado ao catálogo. Sugestão: tokens (`{o}`, `{orgulhoso}`) resolvidos pelo gênero do personagem na hora de gravar o log. Os 21 casos em auto-resolvidos e cerca de 10 em decisões estão marcados acima; descrições com o mesmo problema: babyEvents.ts:61 "Sentado", :92 "incomodado", toddlerWorldEvents.ts:159 "convidado".

## G. Plano de reescrita sugerido (por prioridade)

1. **Converter em decisão** (a opção é postura): inf_primeiro_dia_escola (ou escolha_biografica), inf_futebol_rua, ado_trote_festa, jov_carnaval_rua, jov_reveillon_praia, sen_baile_terceira_idade, sen_viagem_excursao, car_fofoca_copa, rom_surpresa_jantar, rom_discussao_toalha, rnd_sorteio_shopping (uso do prêmio), fam_briga_controle_tv, ext_amigo_secreto_firma, ext_chuva_verao_alagamento, ext_viagem_serra, crc_primeiro_dia_creche, prc_medo_escuro, prc_aniversario_amiguinho, prc_curiosidade_bicho, tec_primeiro_jogo_tablet, esp_torneio_bairro_futebol, hob_colecao_figurinhas (biográfica), ado_grupo_amigos_turma, adm_colega_demitido, adm_pais_precisando, adm_casamento_de_amigo, adm_letra_pequena, lat_joelho_na_escada, lat_tecnologia_nova, lat_arrumar_as_fotos, lat_casa_grande_demais.
2. **Reescrever como fato do mundo / pelos outros** (o evento é bom, o texto é que invade): bb_parquinho_bebes, ado_smartphone, ext_festa_surpresa, ext_festa_junina, ext_feira_livre_sabado, adm_obra_do_vizinho, adm_apagao_no_bairro, adm_reencontro_na_feira, adm_bairro_mudou, adm_sono_mudou, adm_primeiro_salario_cai, lat_tempo_que_sobra, lat_crianca_na_casa.
3. **Apagar ou condicionar a estado real:** fam_visita_avo e ext_macarronada_domingo (avós inexistentes), ado_paixao_secreta (refazer como escolha, com gênero), sau_corrida_parque, lat_caminhada_da_manha, adm_republica_conta_dividida, adm_amigos_se_espalham, adm_amigo_de_infancia_reaparece, lat_perda_da_geracao, adm_rotina_de_anos_acaba.
4. **Gênero:** utilitário de flexão + varredura de todos os adjetivos listados e dos `(a)` dos sistemas.
