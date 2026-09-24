# FIX pós-playtest 2 · Relatório

Branch: `claude/fix-playtest-2` (a partir de `claude/att2-caminhos-de-vida` @ `5a6c404`).
Não mergeada na `main`. Sem force-push. Save **v9**.

> O motor do VIDA ficou mais sofisticado do que a experiência de jogar consegue
> transmitir. Este FIX não adiciona conteúdo: transforma sistemas que já existiam
> em coisas que o jogador percebe, entende e influencia.

---

## 1. Estado inicial

| Verificação | Resultado |
| --- | --- |
| Branch / HEAD | `claude/att2-caminhos-de-vida` @ `5a6c404`, com trabalho da ATT 2 fora do histórico (Tempo livre recolhendo o que não cabe, dois testes de interface, scripts de playtest). Commitado como primeiro passo da branch nova (`9f2ec2d`). |
| `docs/ATT2-CAMINHOS-DE-VIDA-REPORT.md` | não existe (a ATT 2 não deixou relatório) |
| `npm test` (Node 22) | verde — 6 arquivos, **107 testes** (com Node 20 as suítes de interface não iniciam; requisito já documentado) |
| `typecheck` / `build` | verdes |
| Saves reais | antes de qualquer mudança, gerei **três saves v8 reais** com o motor da ATT 2 (`efa4366`) para testar a migração |

## 2. Diagnóstico (medido antes de mudar)

Uma sonda de 60 vidas no motor da ATT 2 e a leitura do código:

| Sintoma do playtest | Causa encontrada |
| --- | --- |
| "Não tinha opção natural de namorar alguém próximo" | O único caminho era `convidar` ("Chamar para sair"), variante secundária: em **12 de 57** anos em que havia alguém próximo e elegível, o botão ficava escondido atrás de "Mais" (a ficha mostrava as 5 primeiras, ordenadas só por variante). A resposta era um sorteio sobre `envolvimento`, sem graus (sim ou "prefere deixar como está"). |
| Interações que parecem variações de texto | O resultado de uma interação virava um **aviso de 4 segundos**. Nada do que se descobria sobre a pessoa ficava. Casal tinha 6 ações fixas. |
| "Você" abstrato; Cabeça quase não muda | Humor e cabeça eram um equilíbrio com meia dúzia de termos + ~40 empurrões espalhados em sistemas e conteúdo, sem nome. **Cabeça "sob pressão" em 1,5% dos anos adultos.** Não havia "Você" como área; o estado era 3 palavras no trilho. |
| Saúde como indicador | A deriva anual (`processarCorpo`) somava idade, forma, hábitos e condições — mas nada disso chegava à tela. |
| Excesso de opções | Mediana de **29 atividades** e **16 vagas** possíveis expostas de uma vez; cursos agrupados, mas todos. |
| Entrevista repetitiva | Sempre as mesmas 3 opções (`preparo`, `confianca`, `sinceridade`) — 556 entrevistas em 120 vidas simuladas. |
| Peneira incompreensível | Um clique → `chance = (h−58)/27` → "Chamaram outros nomes". Nenhum motivo, nenhuma prática ganha. |
| Telas iguais | Todas eram `Secao` + `Linha` + listas de botões. |

## 3. Arquitetura das mudanças

### 3.1 Estado pessoal: causas como fonte única (`sistemas/estado.ts`)

- `fatoresHumor`, `fatoresCabeca`, `fatoresSaude` devolvem **fatores com nome** (`{ id, texto, efeito, pessoaId? }`).
  `equilibrarMente` passou a ser `alvo = base + Σ fatores` (humor e cabeça) e `processarCorpo` usa `derivaDaSaude = Σ fatores`.
  **A mesma conta** alimenta "Tem ajudado / Tem pesado" na tela.
- O que antes eram empurrões anônimos por ano virou fator: estresse do trabalho, horas extras, **semana que não cabe** (os compromissos fixos que passam da semana, antes invisíveis porque a capacidade tinha piso de 0,5), noites curtas com criança pequena, cuidar de alguém doente, dívidas, procurar trabalho há muito tempo, guardar um segredo, luto, atrito em casa, e o bem-estar de cada atividade (tabela `BEM_ESTAR`, com teto: três atividades relaxantes não apagam uma semana impossível).
- Acontecimentos pontuais viraram **abalos** (`sistemas/abalo.ts`): demissão, promoção, término, nascimento, perda, repetência, despejo, dispensa da base, mudança… — aplicam o empurrão e guardam um nome curto ("a demissão"), que aparece como "este ano" e vai sumindo conforme o equilíbrio absorve.
- `mente.historico` guarda o estado a cada aniversário → **tendência** ("vem melhorando", "vem piorando").

### 3.2 Cuidar de si (`sistemas/cuidados.ts`)

Ações novas: **descansar** (uma vez por ano; −10 na cabeça, e o texto diz que a causa continua), **ir ao médico** (abre o tratamento se há condição sem tratar; um check-up pode pegar cedo pressão alta/diabetes; senão diz o que o corpo está cobrando), **tentar parar de fumar**, **tentar beber menos** (podem falhar; tentar de novo ajuda), **desistir das horas extras**. `sugestoes(v, dimensão)` escolhe o cuidado **pela causa**: sobrecarga → aliviar a semana / desistir das horas extras; luto → estar com quem também sente a falta; solidão → um lugar com gente; corpo parado → começar a correr; cabeça cheia prolongada → terapia. Nunca vazio: há sempre um último recurso ("procurar alguém para conversar").

### 3.3 Relações

- **Iniciativa romântica, uma por vez**, escolhida pela proximidade: mal se conhecem → *demonstrar interesse*; conhecidos → *chamar para sair*; amizade próxima → *dizer o que sente* (por telefone se estão longe). Idade graduada da ATT 1 preservada; quem tem parceria só vê o caminho escondido de antes.
- **A resposta é da outra pessoa** e nasce da relação (`interesseDoOutro`): afinidade e aparência, proximidade, confiança, história compartilhada, atrito, o momento dela (luto, separação), orientação e compromisso — com acaso pequeno por cima. Respostas graduadas: *sim*, *pede um tempo* (responde no ano seguinte, pesando o que aconteceu entre vocês), *prefere a amizade* (a amizade fica se havia confiança), *não*, e *se afasta* (colega de trabalho desconfortável). Depois de um não, 3 anos sem nova iniciativa com a mesma pessoa. Com quem é próximo, você **sabe** se a pessoa namora ou por quem se interessa: a iniciativa nem aparece.
- **Experiências de casal**: primeiro encontro (lugar, fica na história), conhecer melhor (descobertas que ficam — "O que você sabe dela"), conversar sobre o futuro (revela o que o outro quer: filhos, casar), falar de dinheiro quando aperta, pedir desculpas, comemorar aniversários redondos e conquistas do ano, viajar para ver / ligar quando longe, manter os costumes do casal ("Manter as saídas só de vocês").
- **Receber apoio**: *desabafar* existe quando a vida pesa, com quem escuta (parceria, amigo próximo, pais, irmãos/filhos adultos próximos); ajuda a cabeça, aproxima e vira marco.
- A ficha ordena as ações por **relevância agora** (`prioridade`), mostra 4 e recolhe o resto; resultados importantes abrem **uma folha com o rosto** de quem respondeu, não um aviso.

### 3.4 Processos em etapas

- **Entrevista** (`sistemas/entrevista.ts`): 24 perguntas em 17 famílias, escolhidas pela vaga (setor, senioridade), pela estrada da pessoa (primeiro emprego, mudança de área) e sem repetir as 16 recentes. 2 perguntas em vaga de entrada, 3 no resto. Cada resposta é uma **abordagem** cujo peso depende do contexto (avisar o supervisor antes de mexer é ótimo num hospital e fraco para quem vai liderar; contar a experiência vale para quem tem). A chance final = perfil de `elegibilidade` (formação, estrada, mercado) + porta + entrevista (±0,2) + prática (até +0,05). Devolutiva com motivo; às vezes a empresa chama de novo.
- **Peneira** (`sistemas/peneira.ts`): dois momentos (o começo, o fim do dia), com abordagens que pesam conforme quem joga; técnica, físico, leitura de jogo, nervos, idade na janela, concorrência e o dia. A fala do treinador diz o que pesou ("gostou da sua leitura de jogo, mas você perdeu intensidade no fim"), muda quando o mesmo problema se repete, e quem ficou perto pode voltar no ano seguinte. Um dia de teste também é treino.
- **Concurso**: a reprovação traz a matéria mais fraca e se faltou preparo ou foi concorrência.
- **Devolutivas** (`caminhos.devolutivas`) aparecem em Trabalho ("O que ficou das últimas tentativas") com o que dá para fazer.
- Personalidade: responder de um jeito numa entrevista não move traços.

### 3.5 Divulgação progressiva (`sistemas/relevancia.ts`)

`atividadesParaVoce`, `vagasParaVoce`, `cursosParaVoce`: só entra como primária o que tem **motivo** (hobby antigo, gosto, a cabeça ou o corpo pedindo, o próximo degrau da estrada, a sua área, o próximo nível da formação), até 4/5/4, no máximo duas pelo mesmo motivo. O resto fica em "Explorar outras…", agrupado por tipo/setor/nível — o catálogo inteiro continua acessível.

## 4. Decisões de UX e diferenciação visual

| Área | Composição |
| --- | --- |
| **Você** (nova) | Rosto grande com **expressão do estado real** (bem, neutro, cansado, abatido, tenso, doente — boca, sobrancelha, pálpebra, palidez), fase, uma frase sobre o momento *com a causa* ("A cabeça vem enchendo: compromissos que não cabem na semana…"). Três leituras em colunas: palavra, escala de 5 marcas (não depende de cor), tendência com seta, tem pesado / tem ajudado, cuidados. |
| **Pessoas** | "Pedem atenção" no topo (sem repetir no painel lateral), núcleo com rostos grandes, amigos em grade de rostos. Ficha: como estão, como se conheceram, o último acontecimento, "O que fazer junto", "O que você sabe dele/dela", "Coisas de vocês", "O que viveram juntos". NPC de luto/doente aparece com o rosto do momento. |
| **Estudo** | Trajetória horizontal (vertical no celular): passado → **agora** → portas, com motivo. Depois os controles, "Próximos passos" e "Explorar outros cursos". |
| **Trabalho** | **Escada** da estrada atual (já foi / você está aqui / o próximo passo / mais adiante) com o horizonte em palavras; trabalho atual; devolutivas; "Outros caminhos" com motivo; o resto por setor. |
| **Tempo livre** | A **semana desenhada**: faixa com trabalho, estudo, casa/filhos, atividades e o que sobra; o que passa da semana fica depois de uma linha tracejada, hachurado e escrito ("passa da semana"). Legenda com as doses em palavras. Sugestões com motivo; explorar por categoria. |

O teste de diferenciação (as cinco áreas lado a lado, sem título, `lado-a-lado.png`) distingue as telas de relance: rosto e três colunas; rostos; linha com pontos; bloco de escada; faixa colorida. Nada de cards novos por toda parte: rótulos pequenos em caixa alta, serifa para o que é vida, cor só com significado (e sempre acompanhada de texto ou forma).

Aba nova no celular (6 itens). No desktop, na aba Você o trilho não repete a identidade.

## 5. Testes

**152 testes** (antes 107): +41 em `src/motor/__tests__/fix2.test.ts`, +4 de interface.

| Pedido | Teste |
| --- | --- |
| 39 relações | iniciativa elegível visível no topo; uma por vez por proximidade; inelegível (menor, família, com parceria) não recebe; idade 17/18 sim, 16/25 não; rejeição possível e **não arbitrária** (vínculo forte aceita > vínculo fraco + 20 p.p.; sem atração, nunca); interesse cresce com proximidade/confiança/história; "pediu tempo" sempre se resolve; depois do não, pausa e amizade preservada; sim entra na biografia, primeiro encontro vira marco; parceria varia (aniversário redondo, dinheiro, distância); conhecer melhor acaba e fica na história; amigo longe sem ação presencial; desabafar só quando pesa e sem cura instantânea |
| 40 estado | alvo = soma dos fatores (humor, cabeça, saúde); sobrecarga piora aos poucos e alívio melhora devagar; descansar uma vez por ano e sem mexer na causa; luto com rede de apoio passa mais rápido; corrida muda o fator de forma; médico abre tratamento e tratar reduz a perda; parar de fumar falha e dá certo; **nenhum estado ruim sem cuidado possível**; determinismo de abalos, histórico e tendência |
| 41 semana | cabe ⇔ ocupação + pedido ≤ capacidade; tirar uma atividade devolve exatamente o tempo; filhos, trabalho e faculdade como fixos, pesando na cabeça pelo mesmo cálculo; UI: a semana tem imagem com descrição acessível |
| 42 processos | perguntas variam e não repetem logo; contextuais (liderança, segurança, primeiro emprego); **sem resposta universal** (< 50% das perguntas com um melhor único entre 7 contextos); experiência pesa, entrevista ótima não transforma; determinístico por semente, 2–3 etapas, devolutiva coerente; peneira considera preparo (≥ 50% vs < 10%, meio-termo nem garantido nem impossível); abordagem pesa conforme quem joga; falha gera devolutiva, prática e marca; entrevista antiga aberta num save v8 continua resolvível |
| 43 poluição | primárias ≤ teto, com motivo, e primárias + resto = tudo que é possível; cabeça cheia e hobby antigo sobem; o próximo degrau vem antes; cursos agrupados; UI: Tempo mostra ≤ 4 "Começar" e "Explorar" abre o resto |
| 51 save | v8 reais migram, preservam estado, continuam 5 anos e voltam a ler; v7/v6/v5 até v9; abalo corrompido recusado |

Testes alterados: `35. uma vida sem faculdade…` passou de 6 para **12 vidas com o mesmo patamar (≥ 83%)** — com 6, o resultado dependia de uma semente só, e a entrevista em etapas mudou a sequência de sorteios.

## 6. Simulações

`scripts/sim/fix2.ts` — **240 vidas** (12 estratégias × 20), com iniciativa, cuidado (metade das vidas) e peneiras (um terço). Mais os três simuladores anteriores (120 + 120 + 180 vidas).

| Métrica | Antes | Depois |
| --- | --- | --- |
| Cabeça "sob pressão" (anos adultos) | 1,5% (sonda passiva) | 6% no geral; ~40% no perfil sobrecarregado; 1% nos passivos |
| Anos ruins sem nenhum cuidado possível | — | **0** de 1.752 |
| O que mais pesa na cabeça | — | trabalho 24% · semana 17% · estudo para concurso 12% · luto 12% · dívidas 10% |
| O que mais pesa no humor | — | luto 37% · acontecimento do ano 17% · dívidas 12% · sem trabalho 7% |
| Iniciativas | escondidas em 21% dos anos elegíveis | declarar 46% sim / 19% pede tempo / 35% não; aceitação por vínculo: <40 7% · 40–59 11% · 60–79 44% · 80+ 70% |
| "Pediu tempo" → sim | — | 76/104 |
| Namoros nascidos de iniciativa | — | 46 |
| Entrevistas: perguntas distintas | 1 (sempre as mesmas 3 opções) | 24 |
| Pergunta repetida entre as 6 anteriores da vida | — | 73 em 982 entrevistas (era 169 em 288 na 1ª rodada, antes de ampliar o banco) |
| Aprovação por preparo | — | baixo 27% · médio 52% · alto 76% |
| Abordagem dominante (Δ nota > 0,5) | — | 0 de 23 perguntas |
| Peneira por habilidade | h 60 ≈ 7% | <55 0% · 55–64 13% · 65–74 60%; 41 tentaram de novo, 7 passaram depois de falhar |
| Atividades expostas | mediana 29 | primárias 3 (máx 4) + explorar |
| Vagas expostas | mediana 16 | primárias 2 (máx 5) + explorar |
| Violações de coerência (simular/social/caminhos) | nenhuma | nenhuma |
| Repetição de texto por vida | 9,6 | 9,8 |

### Biografias lidas (e o que elas revelaram)

- **Peneira**: "Não passou na peneira do clube. O treinador gostou do seu fôlego, mas a técnica ainda não está no nível da base." — repetido igual no ano seguinte. Corrigido: a segunda vez diz "De novo, …"; quando passa depois de falhar, "o que pesou da outra vez já não apareceu".
- **Entrevistas** enchiam a Linha da Vida ("Fez entrevista para atendente e não passou…" várias vezes). Corrigido: só a primeira reprovação vira biografia; as outras ficam nas devolutivas.
- **Dois romances no mesmo ano** ("Miguel procurou você… Da amizade de 13 anos com Augusto nasceu outra coisa"). Corrigido: saindo com alguém (ou esperando uma resposta), não se começa outra história; quem respondia sim depois de pensar, se o jogador já está saindo com outra pessoa, prefere a amizade.
- Histórias pedidas encontradas: amizade longa → dizer o que sente → "eu achava que era só eu" → namoro; amizade longa → prefere a amizade → a amizade fica; adulto sobrecarregado → cabeça vem enchendo → desiste das horas extras → melhora devagar; check-up que pega pressão alta cedo; peneira que falha por técnica, treino e nova tentativa.

## 7. Playtest visual

`scripts/playtest/gerarFix2.ts` gera 13 cenários (criança, adolescente, peneira aberta, jovem, entrevista aberta, romance possível, família com filho, sobrecarregado há seis anos, desempregada, saúde cobrando, bom momento, luto, idosa); `scripts/playtest/fix2.mjs` abre cada um num Chromium real a **320, 390, 820 e 1440 px**, fotografa Você, Pessoas, ficha, Estudo, Trabalho, Tempo livre, as etapas da entrevista e da peneira, e monta a folha lado a lado.

Resultado final: **nenhum problema estrutural** (rolagem horizontal, botões fora da tela, CTA cobrindo o fim, botões sem nome, alvos < 32 px).

Encontrados e corrigidos inspecionando as capturas: painel "Agora" duplicado nos dois lados da tela Você; frase do momento com concordância errada ("…Lara tem segurado"); luto listado duas vezes (o luto e o abalo da morte); links de fatores com alvo de toque baixo; a faixa da semana não mostrava que os compromissos fixos passavam da semana; o botão bloqueado "Mais a sério" ocupando meia linha; o horizonte da carreira repetido na escada e no trabalho; "(trancado)" duplicado na trajetória e na seção; "a vaga é sua. analista…" sem maiúscula; o mesmo motivo em três sugestões; "descansar" sugerido duas vezes (humor e cabeça); "O que você faz?" numa entrevista (agora "O que você responde?" / "Como você joga?").

## 8. Save e migração

- **v9**: `mente.abalos`, `mente.historico`, `caminhos.entrevistas`, `caminhos.devolutivas`, `caminhos.processo?` (processo em andamento), `Romance.pediuTempo?`, marco `descoberta`.
- `migrarV8`: listas vazias, histórico começa com o estado de hoje (a tendência aparece depois do primeiro ano), nada inventado. v5→v6→v7→v8→v9 encadeados.
- **Entrevista e peneira antigas abertas** no momento do save (formato de um clique) continuam resolvíveis: as opções antigas ficam no conteúdo, invisíveis para momentos novos.
- Um processo sem etapa aberta é descartado ao avançar o ano (não trava).
- Testado com **3 saves v8 reais** (ATT 2), 3 v7, 2 v6 e 2 v5.

## 9. Limitações conhecidas

- Os pesos dos fatores foram calibrados por simulação; o ponto a observar no playtest humano é a Cabeça de quem trabalha, estuda e tem filho pequeno (a simulação diz ~40% de anos sob pressão nesse perfil).
- "Acontecimento do ano" só tem nome para os abalos dos sistemas; empurrões de conteúdo (eventos sorteados) ainda são anônimos e entram só no equilíbrio.
- O avatar muda expressão, não postura; a cena de fundo não muda.
- NPCs não tomam iniciativa romântica (além de responder depois de pedir tempo e do "alguém especial" da ATT 1).
- Ciúme e decisões compartilhadas (mudar de cidade juntos) não ganharam experiência própria.
- Audição artística não virou processo em etapas (a banda e o grupo continuam como convite).
- A ATT 2 não tinha relatório; este documento descreve o que encontrei dela quando relevante.

## 10. Dependências

- **ATT 3 (vida material)**: descansar/viajar sem custo de viagem real; "falar de dinheiro" do casal sem finanças compartilhadas de verdade; plano de saúde e consulta particular com custo simplificado; animais de estimação ainda sem cuidado próprio.
- **ATT 4 (a vida como história)**: `mente.abalos` e `caminhos.devolutivas` estruturam "o ano em que a cabeça pesou" e "as tentativas" para capítulos; marcos `descoberta`/`ritual` servem para capítulos por pessoa; a Linha da Vida ainda não mostra tendências de estado.

## 11. Playtest humano — roteiro curto

```
git fetch && git checkout claude/fix-playtest-2
nvm use 22 && npm ci && npm test && npm run dev
```

1. **Você**: abra a aba. O rosto combina com o que está escrito? Você entende por que está assim?
2. Faça horas extras, entre numa faculdade e mantenha o trabalho por alguns anos. A Cabeça deve ir enchendo, com a causa escrita; desista das horas extras e veja melhorar devagar.
3. **Romance**: com um amigo ou amiga próxima e solteira, abra a ficha — deve aparecer "Dizer a X o que sente". Tente. A resposta faz sentido para o que vocês têm?
4. Numa parceria longa, procure "Comemorar os N anos", "Conversar sobre o futuro", "Coisas de vocês".
5. **Entrevista**: candidate-se a duas ou três vagas diferentes. As perguntas mudam? O retorno explica?
6. **Peneira**: jogue bola a sério desde criança; quando a peneira abrir, vá. Entendeu por que passou ou não? Deu vontade de treinar e tentar de novo?
7. **Tempo livre**: a faixa da semana mostra de relance o que ocupa e o que sobra? As sugestões têm a ver com você?
8. **Estudo e Trabalho**: dá para ver onde você está e o próximo passo sem abrir listas?
9. Uma perda grande: o humor sente, as pessoas próximas aparecem como ajuda, e melhora com o tempo?
10. Saves antigos: abra um save de antes; deve converter e continuar.

Pergunta para anotar: *agora eu sinto que estou vivendo uma pessoa, ou ainda administrando listas?*
