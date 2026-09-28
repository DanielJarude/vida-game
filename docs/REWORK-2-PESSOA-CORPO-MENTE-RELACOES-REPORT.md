# REWORK 2 — Pessoa, corpo, mente e relações

> "O jogo pode decidir o que acontece com você; não deve decidir
> silenciosamente como você escolheu reagir a isso."

## 1. Base e branch

| | |
| --- | --- |
| Base | `claude/rework-caminhos-agencia-ux` @ `f7b84a9` (working tree limpa, confirmada) |
| Branch | `claude/rework-2-pessoa-corpo-mente-relacoes` |
| Baseline | typecheck limpo, build ok, **582/582** testes (20 arquivos) |
| Ao fim | typecheck limpo, build ok, **617/617** testes (22 arquivos) |
| Save | **v16** (migra v15; ver §6) |
| Node | 22 (`~/.nvm/versions/node/v22.23.2`) |

Sem merge em `main`, sem force-push, sem histórico reescrito, sem segredos, sem deploy.

## 2. O que já existia (e foi reutilizado)

Confirmado no código antes de mexer — nada disso foi duplicado:

- `corpo.saude`, `corpo.forma` (condicionamento), `corpo.aparencia`, `corpo.condicoes`; `mente.felicidade` (o "Humor"), `mente.estresse` (a "Cabeça"), `mente.cognicao`.
- `sistemas/estado.ts`: fatores com nome para humor, cabeça e saúde — a mesma soma que o equilíbrio anual usa e que a tela Você lê.
- **Frentes** (`caminhos.frentes[dominio]`): habilidade específica persistente por modalidade/arte/matéria, com aptidão por frente derivada da semente, interesse, meses de prática, esquecimento e auge. **É a técnica esportiva e a habilidade musical** — não foi criado outro sistema.
- Interações contextuais por papel/fase (`sistemas/interacoes.ts`), `Pessoa.aperto`, luto, rede de apoio, romance com autonomia da outra pessoa (`processarRomance`, `terminar`), `sau_tratamento`, `cuidados.ts`.

Decisão de mapeamento das cinco dimensões (fonte única de cada uma):

| Dimensão | Fonte | Observação |
| --- | --- | --- |
| Saúde | `corpo.saude` | deriva anual em `estado.fatoresSaude` |
| Bem-estar | `mente.felicidade` | é o antigo "Humor" (a tela passou a chamar de Bem-estar); a "Cabeça" (`mente.estresse`) continua como causa |
| Aprendizado | `mente.cognicao` | o prompt sugeria "cabeça", mas no código `cabeca` é **estresse**; o campo de aprender é `cognicao` |
| Aparência | `corpo.aparencia` | + `corpo.aparenciaBase` (nascença) |
| Condicionamento | `corpo.forma` | |

## 3. O que foi implementado

### Parte A — pessoa, corpo, mente

**Predisposições** (`sistemas/predisposicao.ts`, `v.predisposicoes`): cognitiva, física, artística, −1..1, derivadas do id da vida por hash (sem gastar o gerador: a vida criada é a mesma de antes), guardadas no save. Influência, não destino:
- física → velocidade do condicionamento e da técnica esportiva (±12%), teto da técnica (+4) e um modificador no físico da peneira;
- artística → velocidade/teto nas frentes de arte;
- cognitiva → teto e velocidade do aprendizado, e das matérias; a cognição inicial nasce perto dela (a mesma chamada ao gerador, só a média muda).
- Separação predisposição ≠ atributo ≠ habilidade é explícita no código e testada.

**Desenvolvimento anual** (`sistemas/pessoa.ts`, `desenvolverPessoa`), com causas com nome (`fatores*`) e consumidores reais (`CONSUMIDORES`):
- *Condicionamento*: carga física da semana (academia, corrida, esportes por intensidade, farda, trabalho pesado, bico) → alvo com retornos decrescentes, piso do dia a dia por idade, teto por idade, predisposição, cigarro, bebida, saúde fraca, condições. Anda em direção ao alvo (sobe rápido no começo, cai quando para). Academia sozinha: ~70; sedentário: ~32; escolinha: ~66; base + academia: ~88. Os `efeito` de rotina que somavam forma sem limite (futebol +11/ano, academia +11) foram removidos.
- *Aprendizado*: leitura (principal), xadrez, clube de ciências, programar, escrever, cursinho, faculdade → ganho ~1/ano com teto plausível (70 ± 14 pela predisposição), declínio lento depois dos 72 (menor para quem lê). Modifica **só** frentes de estudo (`frentes.praticar`, fator `aprende`) — nunca esporte ou arte (testado).
- *Aparência*: base de nascença + forma, saúde, cigarro, bebida, cansaço, cuidado que o estilo de vida permite, idade. Simples, sem sistema de beleza.
- Marco único na Linha da Vida quando um adulto sai do sedentarismo e entra em forma.

**Ordem anual (confirmado e corrigido)**: `processarCorpo` rodava antes de `processarRotinas`, então a saúde do ano lia a forma e o sedentarismo **do ano anterior** (a academia só chegava à saúde um ano depois). Correção mínima: `desenvolverPessoa` roda no início do ano, antes do corpo e da escola; o decaimento de forma saiu de `corpo.ts`, o sedentarismo saiu de `rotinas.ts`. Coberto por teste.

**Saúde jogável** (`sistemas/saude.ts`): condição crônica nasce **sem nome** (`diagnosticada: false`) — já age no corpo, mas a pessoa vê só os **sinais**. Fluxo: sinal → percepção (Você: "O corpo tem dado sinais", painel "Agora") → ir ao médico ou não → diagnóstico (consulta; check-up do plano; criança/adolescente: a família leva) → decisão de tratamento (SUS/particular/depois; `sau_tratamento` só abre para o que tem nome) → evolução: câncer em remissão, coluna resolvida, pressão/diabetes "controladas" (marco uma vez) — ou, ignorando, **o susto** (pronto-socorro, −8 de saúde, "descoberto tarde": tratamento rende menos, risco de morte maior). Terapia dá nome e trata depressão/ansiedade. Consumidores: saúde, condicionamento, **desempenho no trabalho** (`pesoDaSaudeNoTrabalho`), escola (saúde < 55), treino e peneira, risco de morte, bem-estar, Linha da Vida.

**Bem-estar**: as causas já existiam (rede, parceria, saúde, dinheiro, trabalho, luto, solidão, atividades…). Consumidores moderados novos: motivação na prática (`vontade` ±0,1; interesse esfria em fase muito baixa), socialização (±2 na aproximação anual), desempenho no trabalho (−3…+2), escola (já lia), recuperação de transtornos (tratado 0,3/ano, sem tratamento 0,12).

**Esporte**: a peneira pesa técnica (0,5) > físico (0,14) > leitura de jogo (0,14) > nervos; agora com predisposição física e saúde no físico, idade de início e regularidade (retomadas) na leitura, e peneiras anteriores nos nervos. Academia não pratica frente nenhuma. Recalibração necessária (ver §7).

**Estudos / vestibular** (`sistemas/vestibular.ts`):
- **Objetivo** (`educacao.objetivo`, ação `objetivo_estudo`): "Mirar em Medicina" em Estudos.
- **Situação** pela MESMA conta da prova: `escola.notaEsperadaArea` é a nota sem o acaso; `notasEnem` = esperada + o dia. Estudos e Trabalho ("O que você está construindo") mostram a mesma `estimativaParaCurso`: faixa, "longe / em construção / perto / no corte", o que mais pesa, próximo passo, e se subiu desde o último ENEM. Teste: a média de 300 provas é a estimativa (±8).
- **Cursinho em Estudos, fonte única**: a rotina é a verdade (ocupa a semana; começa e para em Estudos; some das sugestões de Tempo livre). O flag `educacao.cursinho` virou obsoleto (lido só na migração). A preparação acumula (`educacao.preparo.meses`) e esfria sem cursinho; com objetivo, pratica mais as matérias que o curso pesa. Antes, a tela dizia "você faz cursinho" enquanto a prova do mesmo ano não contava (o flag só ligava no processamento).
- **Devolutiva do ENEM** com objetivo (tipo `vestibular`): corte, nota ponderada, o que pesou, "desde o ENEM de…". Aprovação no curso-objetivo vira marco "era o curso que queria — depois de N ENEMs".

### Parte B — pessoas e agência social

**NPCs agem** (`sistemas/iniciativas.ts`, `Vinculo.chamado`): no máximo uma iniciativa por ano, vinda do contexto:
- **pedido de ajuda** (amigo/família num aperto recente; pai/mãe idosos pedindo companhia nas consultas);
- **convite** (amigo por perto);
- **reclamação** da distância (anos sem contato);
- **conversa do casal** (parceria insatisfeita pede para conversar antes de desistir);
- **interesse romântico** tomado pela outra pessoa;
- **apoio espontâneo**: quando você atravessa luto, diagnóstico sério, desemprego longo ou fase muito baixa, alguém próximo aparece **sem ser chamado** (abalo +3/−4, marco "Apareceu quando você precisava", Linha da Vida). Amortece, não apaga.

O chamado aparece em Pessoas → "Pedem atenção" e na ficha ("Como reagir", com as duas reações que fazem sentido para ele). Reagir **não gasta** o tempo do ano com as pessoas. **Não reagir também responde**: no ano seguinte o chamado expira com consequência (pedido ignorado: −8 afeto/−8 confiança e marco "a resposta não veio"; conversa do casal: −10 de envolvimento).

**Apertos lembrados** (`lembrarApertos`): um ano depois do aperto de alguém próximo, a relação lembra — apoiou (+confiança), estava por perto e calou (−3), sumiu (−7 afeto/−8 confiança, marco "você não apareceu"; amizade funda que esfria entra na Linha da Vida).

**Busca ativa** (`sistemas/busca.ts`, ação `conhecer_alguem`, seção "Conhecer alguém" em Pessoas): uma vez por ano, pelos contextos que existem nesta vida (amigos apresentam, a atividade, trabalho/faculdade/escola, sair à noite, aplicativo). Pode não aparecer ninguém; pode aparecer sem interesse (rejeição); com interesse, a pessoa fica "no ar" e **chamar para sair** (a interação existente, com a chance dela) é o próximo passo. Aparência, sociabilidade e bem-estar pesam um pouco.

**Relação sem manutenção obrigatória**: morar junto passou a contar como convivência (−4 em vez de −8 no alvo do casal quando não há gesto no ano); a conversa do casal é o aviso antes do fim.

### UI

- **Você**: Bem-estar / Cabeça / Saúde; nova seção **Corpo e aprendizado** (Condicionamento, Aprendizado, Aparência: palavra, tendência, o que ajuda e pesa — as causas do motor —, para que serve, e o caminho para mexer); **O corpo tem dado sinais** (com "Ir ao médico ver o que é"); condições só com nome ("descoberto tarde" quando aplicável).
- **Tempo livre**: a academia diz "Condicionamento: … Treina o corpo — não ensina um esporte."; a leitura diz o aprendizado; o cursinho aparece na semana com "ver em Estudos →".
- **Estudos**: objetivo, situação, desde, próximo passo, cursinho, devolutiva do ENEM.
- **Trabalho**: "O que você está construindo" ganhou "Entrar em Medicina".
- **Pessoas**: chamados em "Pedem atenção" (sem repetir o aperto da mesma pessoa), "Como reagir" na ficha, "Conhecer alguém".
- Linguagem editorial mantida: fios, serifa, sem cartões, sem emoji.

### Linha da Vida

Entra: prática que virou parte da vida (3 anos, uma vez por frente), entrar em forma (uma vez), início de algo sério (sinal grave), diagnóstico, susto, remissão/controle, apoio recebido, pedido de família, conversa do casal, amizade que esfriou por ausência, aprovação no curso-objetivo. Não entra: cada ida à academia, cada leitura, cada conversa.

## 4. Arquivos

Novos: `sistemas/pessoa.ts`, `predisposicao.ts`, `saude.ts`, `vestibular.ts`, `iniciativas.ts`, `busca.ts`; testes `__tests__/rework2.test.ts`, `ui/__tests__/rework2.test.tsx`; fixtures `save-v15-*.json` (3); scripts `sim/rework2.ts`, `playtest/gerarSavesV15.ts`, `playtest/gerarRework2Pessoa.ts`.
Alterados: `tipos`, `save`, `criacao`, `ano`, `acoes`, `sistemas/{corpo,estado,rotinas,frentes,peneira,escola,cuidados,interacoes,social,romance,trabalho,dinheiro,relevancia,caminhosDeVida}`, `conteudo/sistemicos`, UI `Voce, Tempo, Estudos, Pessoas, estadoPessoal, leitura`, CSS.

## 5. Testes

- `rework2.test.ts` (30): os 14 causais obrigatórios, comparando vidas gêmeas — 1 academia→condicionamento→(saúde, teste físico do concurso, peneira)→persistência, com o efeito no mesmo ano; parar volta ao piso · 2 dez anos de academia: técnica de futebol < 10, nenhum clube testa · 3 técnica alta + físico mediano supera técnica baixa + físico alto (60 dias de peneira); treino deliberado → técnica → pedir teste → peneira em etapas → devolutiva com nível → base ou marca de fracasso; predisposição muda o físico, não a técnica · 4 sinal ignorado: pesa no corpo e no trabalho, sem decisão, até o susto "descoberto tarde" · 5 consultar e tratar: em 6 vidas, mais saúde e menos sustos · 6 leitura: sobe devagar (<1,6/ano), com teto, e a nota esperada do ENEM sobe; o aprendizado não muda o treino de futebol · 7 Medicina: estimativa = Trabalho; cursinho sobe; média de 300 provas = estimativa; devolutiva com corte e "desde" · 8 pedido de ajuda → ajudar → confiança, marco, save · 9 o mesmo aperto sem reação produz a memória "não apareceu" e menos confiança; pedido ignorado expira · 10 busca ativa: acha/não acha/sem faísca; convite possível; save · 11 conversa do casal; apoio espontâneo no luto (+≤4) · 12 rede vs isolamento: diferença moderada (8–25) · 13 save/reload dos novos estados; migração v15→v16 determinística e idempotente; mesma semente + mesmas ações = mesma vida · saves v15 **reais** (motor da base) · unidades.
- `ui/rework2.test.tsx` (5): Você ↔ Tempo livre (mesma palavra do condicionamento); sinais no Você e no painel; Estudos ↔ Trabalho (mesma frase) e cursinho fora de Tempo livre; Pessoas: chamado em "Pedem atenção", reações na ficha, reagir não gasta tempo; "Conhecer alguém".
- Testes antigos ajustados **só na premissa** (sementes cuja vida mudou com a nova sequência do gerador: morreu bebê, já tinha parceria, não morava com os pais) e na versão do save (15 → 16); `fix2` (catálogo de atividades) passou a excluir o cursinho, que mora em Estudos.

## 6. Save / determinismo

`VERSAO_SAVE = 16`. `migrarV15`: predisposições = `derivarPredisposicoes(id)` (hash, sem acaso), `aparenciaBase` = aparência atual, quem estava no cursinho ganha 12 meses de preparação (o que o cursinho do ano já valia na prova). Condições antigas continuam diagnosticadas (campo ausente = diagnosticada). Idempotente; Linha da Vida intacta; cadeia v5→…→v16 passa pela suíte (todos os fixtures). Validação v16: predisposições, aparência base, preparo, objetivo, chamados. Três saves v15 reais gerados na worktree de `f7b84a9` migram, validam, vivem 3 anos, salvam e reabrem. Nada novo usa `Math.random`; `−0` normalizado (o JSON gravava `0`).

## 7. Simulações

`scripts/sim/rework2.ts` — 18 estratégias, 40 vidas cada, até 60 anos, só ações do jogador (`disponibilidade` → `executar`). Médias (forma/cog/aparência/saúde/bem-estar 0–100; técnica = habilidade na frente):

| estratégia | morreu | forma 18 | forma 45 | cog 18 | cog 45 | apar 30 | saúde 45 | bem-estar 45 | futebol 18 | música 30 | peneiras | base | melhor ENEM | Medicina | sustos | amigos próx. 45 | chamados sim/não/ignorados | apoio recebido | "não apareceu" | buscas | namoros | maior relação (anos) | marcos | biografia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aleatória | 0,1 | 38 | 56 | 57 | 63 | 57 | 76 | 60 | 1 | 7 | 0 | 0 | 536 | 0 | 0,4 | 2,7 | 11/12/0 | 4,6 | 0,4 | 0 | 1,5 | 10,5 | 16 | 71 |
| atleta cedo | 0,1 | 66 | 62 | 56 | 56 | 59 | 77 | 55 | **61** | 0 | 1,1 | 0,1 | 538 | 0 | 0,4 | 2,9 | 0/0/23 | 4,6 | 2,7 | 0 | 1,0 | 10,7 | 16 | 80 |
| atleta tardio | 0,2 | 63 | 62 | 56 | 57 | 59 | 77 | 55 | 34 | 0 | 0 | 0 | 546 | 0 | 0,5 | 2,9 | 0/0/22 | 4,8 | 2,4 | 0 | 1,7 | 13,4 | 18 | 78 |
| físico alto sem prática | 0,1 | 68 | 69 | 56 | 56 | 57 | 78 | 51 | **0** | 0 | 0 | 0 | 535 | 0 | 0,4 | 2,7 | 0/0/22 | 4,9 | 2,2 | 0 | 1,9 | 14,9 | 19 | 83 |
| mediano + prática longa | 0,1 | 66 | 62 | 54 | 54 | 56 | 76 | 57 | **61** | 0 | 1,1 | 0,1 | 541 | 0 | 0,6 | 2,9 | 0/0/24 | 4,3 | 2,6 | 0 | 1,2 | 11,3 | 17 | 80 |
| estudante | 0 | 33 | 31 | 65 | **73** | 54 | 69 | 49 | 0 | 0 | 0 | 0 | **709** | **0,3** | 0,7 | 1,0 | 0/0/21 | 7,1 | 1,9 | 0 | 2,2 | 20,8 | 21 | 81 |
| leitor | 0,1 | 33 | 31 | 64 | **71** | 54 | 71 | 44¹ | 0 | 0 | 0 | 0 | 565 | 0 | 0,6 | 0,2 | 0/0/14 | 5,9 | 0,8 | 0 | 1,0 | 12,7 | 17 | 65 |
| ativo | 0,2 | 72 | **75** | 56 | 57 | **61** | **78** | 50¹ | 0 | 0 | 0 | 0 | 550 | 0 | 0,5 | 2,8 | 0/0/22 | 5,5 | 1,8 | 0 | 1,8 | 12,3 | 18 | 79 |
| sedentário | 0,3 | 33 | 31 | 56 | 56 | 54 | 71 | 51 | 0 | 0 | 0 | 0 | 536 | 0 | 0,7 | 0,4 | 0/0/14 | 4,7 | 1,3 | 0 | 0,8 | 17,7 | 18 | 66 |
| procura cuidado | **0,1** | 33 | 31 | 56 | 56 | 54 | **73** | 48 | 0 | 0 | 0 | 0 | 536 | 0 | **0** | 0,4 | 0/0/14 | 5,3 | 0,9 | 0 | 1,1 | 13,1 | 18 | 70 |
| ignora saúde | **0,3** | 33 | 31 | 56 | 56 | 54 | 71 | 52 | 0 | 0 | 0 | 0 | 536 | 0 | **0,6** | 0,4 | 0/0/13 | 4,5 | 1,2 | 0 | 0,8 | 17,6 | 18 | 65 |
| artista | 0,2 | 33 | 32 | 56 | 56 | 54 | 72 | 57 | 0 | **55** | 0 | 0 | 540 | 0 | 0,4 | 2,7 | 0/0/23 | 4,7 | 2,4 | 0 | 1,4 | 14,3 | 23 | 87 |
| conectado | 0,2 | 33 | 31 | 56 | 56 | 55 | 72 | **72** | 0 | 0 | 0 | 0 | 540 | 0 | 0,7 | **3,0** | 23/0/0 | 3,8 | 0,2 | 0 | 2,4 | 21,1 | 22 | 74 |
| isolado | 0,2 | 33 | 32 | 56 | 57 | 54 | 71 | **47** | 0 | 0 | 0 | 0 | 537 | 0 | 0,6 | 0,5 | 0/15/0 | 5,5 | 0,3 | 0 | 1,0 | 17,9 | 19 | 67 |
| busca relacionamento | 0,1 | 33 | 30 | 56 | 57 | 54 | 70 | 52 | 0 | 0 | 0 | 0 | 534 | 0 | 0,8 | 0,7 | 17/0/0 | 5,2 | 0,6 | **3,8** | **2,1** | **30,6** | 22 | 72 |
| não busca | 0,3 | 33 | 31 | 56 | 56 | 54 | 71 | 51 | 0 | 0 | 0 | 0 | 536 | 0 | 0,7 | 0,4 | 0/0/14 | 4,7 | 1,3 | 0 | 0,8 | 17,7 | 18 | 66 |
| apoia | 0,2 | 33 | 31 | 56 | 57 | 54 | 73 | 54 | 0 | 0 | 0 | 0 | 541 | 0 | 0,7 | 0,8 | 17/0/0 | 4,8 | **0** | 0 | 0,8 | **24,5** | 20 | 66 |
| não reage | 0,3 | 33 | 31 | 56 | 56 | 54 | 71 | 51 | 0 | 0 | 0 | 0 | 536 | 0 | 0,7 | 0,4 | 0/0/14 | 4,7 | **1,3** | 0 | 0,8 | 17,7 | 18 | 66 |

¹ Com 40 vidas, o bem-estar de leitor/ativo ficou abaixo do sedentário; com **120 vidas** (mesmo código) inverte: bem-estar aos 45 — sedentário 43,6, leitor 52,4, ativo 48,3. Era ruído. "Sedentário", "não busca" e "não reage" são a mesma política-base (nenhuma ação) — servem de controle.

Leituras:
- **Trajetórias materialmente diferentes**: técnica de futebol 61 (treino desde cedo) vs 34 (tardio) vs **0** (físico alto só com academia, apesar de forma 68–69); aprendizado 71–73 (leitor/estudante) vs 56; ENEM 709 e 30% em Medicina (estudante) vs 536/0%; condicionamento 75 (ativo) vs 31, com saúde 78 vs 71 e aparência 61 vs 54; música 55 (artista) vs 0; bem-estar 72 (conectado) vs 47 (isolado), com 3 amigos próximos vs 0,5; relação mais longa 30,6 anos (quem procura) vs 17,7; quem apoia nunca ouve "você não apareceu" (0 vs 1,3) e mantém relações mais longas (24,5 anos).
- **Saúde**: quem procura cuidado não tem sustos (0 vs 0,6–0,7), nenhum sinal aberto, mais saúde aos 45 e morre menos até 60 (10% vs 30%).
- **Esporte segue raro no topo** (10% chegam a uma base, nenhum contrato em 40 vidas), como deve.

Comparação base × branch (simulador de intenções do REWORK 1, `scripts/sim/intencoes.ts`, 40 vidas, mesmo código nas duas árvores):

| intenção | meio do caminho base → branch | chegou base → branch |
| --- | --- | --- |
| esporte | 25% → 25% | 8% → 5% |
| concurso | 100% → 98% | 100% → 85% |
| militar | 55% → 73% | 50% → 70% |
| arte | 100% → 100% | 8% → 15% |
| acadêmico | 95% → 100% | 95% → 100% |

A queda de concurso foi investigada: o preparo para o edital é **idêntico** (chance 0,120 e preparo 149 nas duas árvores, 60 vidas estudando 10 anos). A diferença vem de caminhos de vida (quem nunca vai ao médico adoece e morre mais: piloto automático até 60 — 9% → 14% de mortes; ver limitações).

## 8. Regressões e achados corrigidos

1. **Atraso causal da ordem anual** (a academia chegava à saúde um ano depois) → `desenvolverPessoa` antes do corpo.
2. **Condicionamento inflado**: quem jogava bola chegava a forma **100** aos 16 (futebol somava +11/ano sem teto) e adultos levavam 20 anos para "desinflar". Substituído por alvo com retornos decrescentes.
3. Consequência de (2): a peneira estava calibrada para o físico inflado — com a forma realista, só 10% dos atletas deliberados chegavam a uma base (base: 25%). Recalibrados o modificador de corpo no treino (0,85 + forma/200) e o limiar da peneira (0,28 → 0,21), mantendo a promessa da tela ("no nível de uma base" costuma ser chamado) e técnica > físico. A técnica aos 16, com a mesma política, é igual ou maior (56,1 vs 54,5).
4. **Cursinho em dois lugares com duas verdades** (Tempo livre + flag de Estudos; a tela dizia "você faz cursinho" e a prova do ano não contava) → rotina como fonte única, em Estudos.
5. **Cursinho eterno** (achado nos saves v15 reais): a rotina nunca terminava — um adulto de 48 "fazia cursinho" havia 15 anos, pagando. Agora termina depois de dois anos sem ENEM.
6. **Câncer infantil sem tratamento** (menor de 18 não podia decidir e ninguém decidia por ele) → a família leva ao médico e trata.
7. `−0` nas predisposições quebrava a igualdade de save/reload.
8. "Pede atenção" repetia a mesma pessoa (chamado + aperto; conversa do casal + "anda distante") → deduplicado.
9. Link "ver em Estudos" com alvo < 40 px (auditoria visual) → corrigido.

## 9. Auditoria visual e de consistência

`gerarRework2Pessoa.ts` + `rework2.mjs` (as verificações do rework anterior): 4 cenários (vestibulanda com Medicina, sinais + pedido de ajuda, solteira com interesse e convite, casal com conversa pendente) × 320/390/1440 × todas as áreas: **161 telas medidas; 1 problema** (o alvo pequeno, corrigido). Capturas lidas: Você 1440 (sinais), Pessoas 390 (casal), Estudos 1440 (vestibulanda). Consistência entre telas coberta por `ui/rework2.test.tsx` (§5).

## 10. Limitações

- Sem nova oferta de atividades: teatro e artes marciais já existiam como frentes e foram só integrados (predisposição artística/física), sem conteúdo novo.
- O "o que mais pesa" do vestibular vem da estimativa; a devolutiva da prova vem das notas reais (com o dia) — podem apontar matérias diferentes no mesmo ano.
- Condições silenciosas + um piloto automático que nunca vai ao médico aumentam a mortalidade até 60 (9% → 14% no piloto automático). É a consequência pretendida de ignorar a saúde, mas quem joga sem olhar Você sente mais.
- A aparência de saves antigos usa a aparência de hoje como base (não há como separar a de nascença).
- A busca ativa exige dizer por quem se interessa (o seletor aparece ali mesmo).
- Iniciativas dos NPCs: uma por ano, tipos fixos; o NPC não tem objetivos de longo prazo próprios além do que o romance e a `VidaNpc` já tinham.

## 11. PENDÊNCIAS ENCONTRADAS (fora do escopo, não implementadas)

1. Estudar para concurso continua em Tempo livre (a mesma duplicação semântica que o cursinho tinha); o preparo já é dito em Trabalho → Concursos.
2. `LIMITE_INTERACOES = 5` por ano é, na prática, uma moeda de ação social antiga; foi preservada (reagir a chamados não gasta), mas merece revisão no rework de relações.
3. "Rafael — 17 anos sem se falarem" aparece em "Pede atenção" para parentes distantes com quem nunca houve contato real (o critério de importância olha o papel, não a história).
4. Muitas vidas simuladas acabam em `gerente_loja` aos 40 (fallback das estratégias de intenção) — convergência de carreira já apontada no REWORK 1.
5. A escola não oferece caminho de saúde mental para adolescentes (terapia a partir de 12 depende de dinheiro em casa).
6. Chunk único do build > 800 kB (aviso do Vite, antigo).
