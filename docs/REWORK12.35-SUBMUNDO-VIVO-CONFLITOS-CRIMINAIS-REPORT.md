# REWORK 12.35 — Submundo vivo e conflitos criminais

Branch `claude/rework12.35-submundo-conflitos` (a partir de `e74a862`, com a auditoria 12.3.1 commitada em `81048eb`).
Feito em 2026-10-30/31 por um agente só, sem subagentes nem worktrees. **Nada foi enviado (push), mesclado ou publicado.**

---

## Resumo

O Submundo deixou de ser só gestão com números. O que o mundo do crime faz agora chega ao jogador como **situação, com
escolha e consequência medida no estado**:

- a **guerra** entre organizações abre um caso por ano (o pedaço, a retaliação, a emboscada, o recado, o negócio, o aliado
  que pede ajuda), com escolhas que dependem do posto; o resultado mexe em território, força, gente do quadro com nome
  (presa ou morta), lealdade, exposição, corpo e família;
- a **operação policial** contra a sua organização chega a você pela proximidade: o contato seu que é levado (e pode
  falar), a investigação que abre ou ganha peso, a **busca na sua casa** (dinheiro levado, veículos bloqueados) e a decisão;
- **perseguições** depois de um trabalho que deu errado (fugir, pedir ajuda, entregar-se, enfrentar);
- **ferimentos** pelo sistema de lesões que já existia, **internação** pela rede de saúde do país e uma **morte** rara e real;
- **comando contestável** (o apoio é medido; com pouco apoio, alguém ambicioso contesta; sem apoio nenhum, o comando cai),
  **subordinados** com lealdade, ambição e memória, **traições com motivo** (o preso que delata; quem vai para a rival) e
  **boatos** que podem ser falsos;
- **perfis de organização** que mudam a conta (territorial, de negócios, agressiva, discreta, hierárquica, fragmentada);
- **mercado por cidade** que reage ao mundo, **oportunidades** temporárias com preço antes, **reputação por lugar**;
- **bens bloqueados e confiscados** separando pessoal, do casal, herdado, moradia e financiado;
- **vida dupla** (o par que decide e pode ir embora, a promessa cobrada, os filhos que lembram) e **recomeço** em passos;
- o **mundo continua sem o jogador** e a **sucessão** passa contatos, nunca o cargo.

Todas as correções da auditoria 12.3.1 (D1–D12, F1/F2/F4/F6/F8/F9/F10) foram feitas.

Validação: **2.113 testes** (36 novos de motor e 4 de tela) — todos passam (4 estouraram o tempo só sob carga e passam
sozinhos); build completo (`tsc` + `vite build`) com todos os pacotes abaixo de 800 kB; teste de fumaça do pacote **21/21**;
auditoria visual **0 problemas** em 114 capturas; saves **100%** íntegros na ida e volta em todos os perfis simulados.

---

## 1. Arquitetura encontrada e fontes de verdade

| Sistema | Fonte de verdade | Módulo |
|---|---|---|
| Estado no Submundo, exposição, investigação | `Envolvimento` | `ilicito.ts`, `carreiraCriminal.ts` |
| Organizações, relações entre elas, quadro, território | `MundoCriminal.orgs` (`OrgViva`) | `faccoes.ts` |
| Relação do jogador com cada organização, **posto** | `RelacaoComOrganizacao.nivel` (**única**, ver D6) | `faccoes.ts` |
| Contatos | `Envolvimento.fichas` + `Pessoa` (com cidade) | `submundo.ts`, `redeCriminal.ts` |
| Trabalhos | `Envolvimento.encomendas` | `encomendas.ts` |
| Contratante ocasional | `caminhos.contratante` | `servicosPorFora.ts` |
| Justiça, provas, sentença, confisco | `Justica` | `justica.ts`, `tribunal.ts`, `defesa.ts` |
| Corpo (ferimento, cuidado, sequela) | `corpo.condicoes` (lesão) | `lesoes.ts` (reaproveitado) |
| Morte e luto | `morreEsteAno`, `registrarMortes` | `corpo.ts`, `luto.ts` (reaproveitados) |
| Romance e separação | `vin.romance`, `terminar` | `romance.ts` (reaproveitado) |
| Dinheiro | conta + extrato (`por_fora`, `despesa`) | `porFora.ts`, `extrato.ts` |
| **Novo:** casos vividos (memória) | `Envolvimento.casos` | `conflitosCriminais.ts` |
| **Novo:** perfil da organização, lealdade/ambição do quadro | `OrgViva.perfil`, `MembroDaOrg.lealdade/ambicao/comVoce/informante` | `faccoes.ts` |
| **Novo:** procura por cidade, oportunidades, raros | `MundoCriminal.mercados/oportunidades/raros` | `mercadoCriminal.ts`, `poderInterno.ts` |
| **Novo:** reputação por cidade, recomeço | `Envolvimento.reputacaoLocal/recomeco` | `mercadoCriminal.ts`, `vidaDupla.ts` |
| **Novo:** bem bloqueado | `Veiculo.bloqueio`, `Imovel.bloqueio` | `bensDoCrime.ts` |

**Camadas sem ciclo.** O lado "mundo" (perfil, guerra, operação, lealdade do quadro) ficou em `faccoes.ts`. O lado vivido
pelo jogador está em módulos novos que **leem** o que o mundo fez no ano (`o.operacao.t === v.t`, o estado `conflito`, o
quadro) e rodam logo depois, em `ano.ts`: `processarConflitosCriminais` → `processarPoderInterno` → `processarMercadoCriminal`
→ (encomendas, carreira) → `processarVidaDupla`. Todos foram para o pacote `motor-carreira`; as cenas, para
`motor-acontecimentos` (o `motor-textos`, o mais apertado, não cresceu: 786,4 kB).

## 2. Sistemas reaproveitados

Lesões e decisão de cuidado (`lesionar`), rede de saúde por país (`redeDeSaude`), luto (`registrarMortes`), término de
romance (`terminar`), abertura de processo e prisão (`abrirProcesso`, `prender`), confisco (`confiscar`), extrato, relações
entre organizações (`definirEstado`), disputa e racha (`abrirDisputa`, `rachar`), promoção (`definirNivel`), comparação de
variantes de texto (`variante`), saída aos poucos (`comecarASair`), família (`ReacaoDaFamilia`), legado.

## 3. Sistemas novos

| Arquivo | O quê |
|---|---|
| `sistemas/conflitosCriminais.ts` | casos (memória), confronto, operação que chega, busca, perseguição, ferimento/internação, ameaça à família, morte |
| `sistemas/poderInterno.ts` | apoio ao comando, contestação, deposição, traições (delação, mudança de lado), boatos, subordinados, raros |
| `sistemas/mercadoCriminal.ts` | procura por cidade e ramo, reputação por cidade, oportunidades |
| `sistemas/vidaDupla.ts` | o par que decide e vai embora, promessa cobrada, mentira descoberta, filhos, recomeço, contatos do legado |
| `sistemas/bensDoCrime.ts` | bloqueio, confisco e devolução de bens |
| `conteudo/acontecimentos1235.ts` | 9 cenas: confronto, operação, perseguição, contestação, traição, suspeita, raro, cônjuge, recomeço |

## 4. Correções da auditoria 12.3.1

| # | Correção |
|---|---|
| D1 | O intermediário nunca é parente nem o par: um contato do caminho (ao alcance) ou alguém de fora da família que vive na beira; a tela diz quem é e por que conhece ("uma conhecida do trabalho: vive na beira e conhece quem faz…") |
| D2 | Alvos alcançáveis: tensão ≥ 45, **ou** tensão ≥ 20 com ruptura, rival declarado, conflito aberto ou o rival do trabalho |
| D3 | Escala única de provas (`provasDoCaminho`): ato isolado 28; carreira 16 + 0,2 × (exposição − 20) + grupo 4 + testemunhas (contatos que falaram, +4 cada, até 10) + delação de dentro (+12) − cautela (5). O tempo de atividade entra só pela exposição. Calibrado no simulador |
| D4 | O texto da descoberta lê a mesma condição que abre o processo |
| D5 | Gênero dos contatos em todos os textos listados (`redeCriminal`, `encomendas`, `relatoDoCrime`, `acontecimentos125`, `conteudo/submundo`) |
| D6 | **Um posto só**: `rel.nivel`. "Pedir para subir/sair do grupo" do ramo antigo saiu (subir e sair é na organização); o chamado para subir vem da organização; `posto` virou espelho. Migração `normalizarRework1235` (uma vez, só quando muda algo) |
| D7 | Código morto removido (o acesso ao mercado continua em `paralelos.ts`) |
| D8 | Alcance dos contatos (`alcanceDoContato`): mesma cidade, mesmo país (à distância, 40% das propostas) ou fora (só conversa; digital e fornecedor/comprador de muita confiança alcançam). O "de sempre" segue o alcance (`fatorDoLugar`, piso de 25%); a organização fora do alcance não manda trabalho |
| D9 | "Um favor que fura a fila" virou processo leve (`pequenos`, alternativa para primário) |
| D10 | O golpe descoberto é narrado como tentativa; dá para cobrar quem sumiu com o dinheiro ou deixar quieto |
| D11/D12 | Preço do favor a contatos no botão; nos pedidos por fora, preço, chance de o dinheiro sumir, chance de não dar certo, risco de vir à tona e o que pesa — antes de pedir |
| F2 | Um seletor de alvo, não N botões "Contra fulano" |
| F4 | Painel de comando só com o que o posto permite agora, e uma linha "no próximo posto: …" |
| F6 | Mensagens de bloqueio com os nomes dos postos daquela organização |
| F7 | "Este ano em [organização]" aberto, fora do `<details>` |
| F9/F10 | A lealdade com os limites ditos (25: rebaixamento; 12: expulsão); a pressão com a consequência dita |

## 5. Mecânicas implementadas (por fase do pedido)

**Fase 2 — conflitos.** Cada ano de guerra da sua organização (com chance de 75%, intervalo ≥ 10 meses) abre um caso. A
situação sai do contexto: retaliação se você levou a melhor há pouco; emboscada se o outro lado é agressivo; território se
os dois disputam o seu bairro; negócio se o outro lado é de negócios; recado se é mais forte; aliado se a sua tem aliadas.
Escolhas por posto (posto 0–2: ir, questionar, ficar de fora, proteger os seus; 3–5: + negociar; comando: retaliar,
intimidar, negociar, recuar, proteger). Cada uma tem o peso dito antes (com a chance calculada) e resolve no motor
(`resolverConfronto`). A guerra também anda sozinha (`guerraDoAno`): território passa de uma para outra e gente do quadro é
presa ou morre, com nome.

**Operações.** Cinco tipos (integrantes, comando, busca num território, patrimônio, desmantelamento), escolhidos pela pressão e
pelo perfil; informante no quadro aumenta a chance. Para o jogador: sempre um texto quando é de dentro; contato de lá pode ser
levado e falar; pela proximidade (posto, exposição, cautela, distância), investigação nova ou mais peso, e às vezes busca na
casa → caso com advogado, parar tudo, colaborar (onde a lei do país permite: a organização expulsa e pode ameaçar a família)
ou seguir.

**Perseguição.** Depois de um trabalho grave que dá errado. Fugir (chance pelo físico e idade; pode ser alcançado e solto,
ou virar processo), pedir ajuda (contato de confiança na cidade ou organização com presença; fica devendo), entregar-se
(processo com confissão), enfrentar (ferimento quase certo, processo de violência, morte rara).

**Fase 3 — poder.** `apoioAoComando` = união, lealdade do quadro, resultados do ano, pressão, desgaste após seis anos, recuo
na guerra. Abaixo de 48 com um ambicioso no quadro: contestação (negociar, dividir — a parte cai 25% por três anos —,
conselho dos antigos, afastar — pode rachar —, ceder com honra). Abaixo de 22: o comando cai sozinho (no próprio grupo, ele
racha). Subordinados: promover, cobrar, pagar a defesa de quem está preso, afastar (uma ação por pessoa por ano). Delação:
quem foi preso com lealdade baixa pode falar — vira prova (+12) e talvez investigação. Mudança de lado: lealdade < 25 e
ambição ≥ 0,5, com rival. Boatos: a fonte tem credibilidade (contato informante de confiança ou boato de corredor);
apurar, confrontar, levar ao comando ou ignorar — agir sobre boato falso custa (inocente afastado, inimigo feito, casa
rachada).

**Identidade.** Seis perfis com efeito em escala da rivalidade, disposição a negociar, quanto paga, quanto atrai a polícia,
recrutamento, contestação do comando e resposta à traição (expulsa, cobra, esquece). Estável por id nos saves antigos.

**Fase 4 — economia.** Procura por cidade e ramo (−2..2) que cai com busca/desmantelamento, sobe com o vazio de uma
organização extinta e com a crise econômica, esfria com a comunidade organizada. Os trabalhos pagam e expõem conforme ela.
Oportunidades (rival fraca, procura em alta, parceria, espaço vazio, cliente fixo para quem é independente) com preço, chance
e risco antes, valendo um ano. Reputação por cidade: numa cidade nova do mesmo país, 45% do nome; noutro país, 15%; constrói
de novo.

**Trabalhos.** De 3 para 6–8 tipos por ramo (32 no total), diferentes no valor, na chance e no rastro; os de posto
(coordenar uma equipe, fechar um acerto com outra organização) só chegam a quem tem o posto.

**Patrimônio.** Ver §4 do pedido e a tabela na §1: bloqueio com provas ≥ 45 ou na busca; confisco na condenação contando no
total (o confisco em dinheiro cobra só o resto, sem dupla cobrança); o do casal, o herdado, o de antes do caminho, a moradia e
o financiado não são tomados; absolvição devolve; bem bloqueado não se vende.

**Fase 5 — vida dupla.** Conversa com o par quando ele sabe e rejeita, ou depois da ameaça, do hospital ou da busca:
prometer sair (se em 18 meses continua, perde), contar e pedir tempo, mentir (se vier à tona, quase sempre é o fim), aceitar
que acabou. O par que rejeita, com a tensão no limite, pode ir embora sem conversa. Filhos lembram de quem não estava
(prisão, hospital, noites fora). A família não esquece sozinha: reconciliar depois de ameaça, prisão ou busca leva mais.
Recomeço: marcos (primeiro emprego, estudo, família de volta, cinco anos limpos — a reputação no meio cai 40% e a exposição
pela metade) e uma conversa (procurar a família, cortar os contatos, ajudar quem está entrando).

**Fase 6 — mundo e legado.** `processarFaccoes` roda sem envolvimento quando há mundo conhecido (quem saiu, quem herdou).
Raros com condição e intervalo (um a cada três anos no máximo; cada tipo, dez anos): o aliado que paga a defesa, o chefe que
some, a rival que pede socorro, a aliança inesperada, o comando oferecido, a paz por mediação. Legado: até quatro contatos de
confiança da família entram como contatos de partida (confiança 30, sem organização) se o herdeiro aceitar o convite.

**Fase 7 — narrativa e tela.** Resumo anual que começa pelo que marcou o ano (guerra, busca, perseguição, contestação,
traição, ano quieto) e varia de forma. "O que você viveu" no histórico. Tela: "O momento, aqui" (procura, nome na cidade,
oportunidades), contatos com cidade e alcance, organização com jeito, ano, apoio ao comando, "Quem responde a você", pedidos
por fora em cartões com as condições.

**Balanceamento (Fase 8).** O termo que fazia o valor dos trabalhos do topo crescer com o patrimônio caiu (de 0,2/0,6/1,5% para
0,05/0,15/0,4%, com teto de 2× a base). Quem tem posto ≥ 4 paga para manter a casa (30%, ou 40% no comando, da parte do ano,
mais o custo da guerra e da defesa de quem caiu). O chamado para subir pede a prática do posto e vem mais devagar.

## 6. Testes e simulações

**Testes.** `src/motor/__tests__/rework1235.test.ts` (36) cobre: D1, D2, D3, D5, D6 (com migração idempotente), D8, D11/D12;
confronto por posto; ir × ficar de fora (ferimentos, exposição, lealdade, em 24 sementes); negociar → trégua; ferimento pela
lesão e internação; morte lida pelo ano; busca (dinheiro, bloqueio, venda impedida, advogado); operação que leva o contato;
bens (pessoal × casal × anterior; absolvição devolve); perseguição → confissão; comando que cai sem apoio; contestação e
ceder; delação → prova; boato falso → inimigo e casa rachada; mudança para a rival; subordinado promovido (uma vez por ano);
perfil que muda a parte; busca derruba a procura; oportunidades com preço e expiração; reputação noutro país; mundo sem o
jogador; par que vai embora; separar; promessa cobrada; recomeço; legado sem cargo; cenas no catálogo; ida e volta do save;
save antigo. `src/ui/__tests__/rework1235.test.tsx` (4): pedidos por fora, oportunidades, organizações sem botão bloqueado em
série, histórico. Dois testes antigos mudaram por decisão do pedido (o "sair do grupo" do ramo antigo virou a saída da
organização; a reconciliação de quem rejeitou ficou mais lenta).

**Suíte inteira:** 123 arquivos, 2.113 testes. Na carga da máquina, 4 testes antigos (fix31 ×2, fixPosPlaytestHumano, motor
"regra de agência") estouraram o tempo — sem falha de asserção; rodados sozinhos passam (77/77). É o mesmo comportamento já
registrado na base.

**Simulações** (Node 22, sementes fixas):

- `scripts/sim/submundo125.ts` (os 15 perfis do 12.25) — antes (16 vidas) e depois (24 vidas), 30 anos;
- `scripts/sim/submundo1235.ts` (**novo**, os 15 perfis do §21) — 16 vidas × 30 anos cada, 240 vidas;
- `scripts/sim/narrativa1231.ts` — 8 integrantes × 30 anos;
- uma sonda de 300 emboscadas perdidas (a cadeia ferimento → morte).

### 6.1 Resultados econômicos e de criminalidade (submundo125, mediana de patrimônio aos 30 anos e % condenado à prisão)

| Perfil | Antes p50 | Depois p50 | Antes prisão | Depois prisão |
|---|---|---|---|---|
| nunca entrou | 162 mil | 162 mil | 0% | 0% |
| ocasional | 114 mil | 242 mil | 0% | 0% |
| profissional | 3,4 mi | 3,5 mi | 13% | 8% |
| integrante | **14,1 mi** | **10,4 mi** | 25% | 46% |
| líder | **31,7 mi** | **23,8 mi** | 25% | 38% |
| líder cauteloso | 10,7 mi | 8,8 mi | **25%** | **29%** |
| dono de negócio por fora | 2,9 mi | 2,4 mi | 31% | 29% |
| furtos | 1,0 mi | 675 mil | 6% | 21% |
| contrabando | 1,9 mi | 990 mil | 31% | 29% |
| digital | 1,3 mi | 730 mil | 25% | 38% |
| fraudes | 1,4 mi | 1,6 mi | 31% | 25% |

Leitura: o topo enriquece menos (o integrante −26%, o líder −25%) e com mais risco, e **o cauteloso agora é preso menos que o
agressivo** (29% × 38%; antes 25% × 25%) — critério da auditoria cumprido. A prisão do integrante subiu (46%): ele vai a toda
guerra e aceita todo trabalho (política do simulador); quem negocia, protege os seus ou fica na moita é preso menos (ver 6.2).
A prisão ainda **não é destino**: mais da metade de cada perfil termina livre. **Limitação:** 16–24 vidas dão ordem de grandeza
(±10 pontos); o integrante continua ~60× a mediana legal — o enriquecimento criminal existe, agora com custo, risco e perda.

### 6.2 O simulador dos 15 perfis (submundo1235; 16 vidas × 30 anos)

| Perfil | p50 30a | Prisão | Casos (principais) | Destaques |
|---|---|---|---|---|
| 1 nunca entrou | 237 mil | 0% | — | o mundo do crime não o alcança |
| 2 contratante | 156 mil | 0% | — | sem envolvimento, sem organização |
| 3 integrante | 2,5 mi | 50% | confronto 26, perseguição 10, operação 8, cônjuge 10 | 10 ferimentos, 2 internações |
| 4 independente | 1,1 mi | 31% | perseguição 8 | sem organização: só oportunidades e contatos |
| 5 busca promoção | 11,8 mi | 38% | confronto 32, raro 9 | 43 anos no comando somados |
| 6 líder | 17,1 mi | 25% | confronto 31 (negociar 19), contestação 4 | delega: só 2 ferimentos |
| 7 líder contestado | 25,5 mi | 25% | **contestação 19**, traição 2 | **2 comandos perdidos** |
| 8 guerra | 7,2 mi | 44% | confronto 28 (ir 23) | 13 ferimentos, 5 internações |
| 9 operação | 11,3 mi | 50% | operação 10, **boatos 6** | 16 operações chegaram a ele |
| 10 traído | 4,1 mi | 63% | **traição 16** | 6 delações, 10 mudaram de lado |
| 11 muda de cidade | 1,8 mi | 56% | cônjuge 15 | o mundo novo: 37 organizações surgidas |
| 12 muda de país | 2,3 mi | 44% | — | o vínculo para; a reputação recomeça |
| 13 abandona | 249 mil | 31% | recomeço 12 | 16/16 com 1º emprego, 15/16 com 5 anos limpos |
| 14 condenado | 291 mil | 88%* | recomeço | 16/16 empregados depois |
| 15 morre e deixa herdeiros | — | — | — | **herdeiro sem cargo 16/16 · organização do pai continua 16/16 · contatos no legado 15/16** |

\* o perfil começa preso (pena de 4 anos).

Sobre a participação: em todos os perfis de dentro, os casos foram decididos pelo jogador (escolhas registradas), e as
escolhas diferentes deram resultados diferentes — o líder que negocia (19 de 31) teve 2 ferimentos; o integrante que vai (22
de 26) teve 10. As trocas de comando nas organizações (100–190 por perfil, em todas as organizações conhecidas) e as
organizações extintas e surgidas mostram o mundo andando.

**Mortalidade.** 0 mortes no crime nas 224 vidas não forçadas. A sonda mostra que a cadeia funciona: em 300 emboscadas
perdidas por uma organização fraca, 55 ferimentos graves e 16 mortes (5%). Nas vidas simuladas, situações assim são raras —
é o equilíbrio pedido (risco real, não frequente). **Durante a simulação, um bug foi encontrado e corrigido**: a morte
decidida numa cena só era lida no mesmo mês, e a cena é respondida depois que o ano vira.

**Limitações das medidas.** (1) O casamento do cenário de teste (`comParceiro`) termina sozinho em ~7 de 8 vidas até para quem
nunca entrou no crime: a taxa de separação **pelo crime** nas simulações (0) não é confiável; a mecânica está coberta por
três testes dedicados (o par no limite vai embora; separar; promessa cobrada). (2) Nenhuma vida simulada teve bens
confiscados (a política do simulador quase nunca compra carro); a mecânica está coberta pelos testes de bens e de busca.
(3) Casos do recomeço às vezes não viram cena porque outra decisão do ano ocupou a fila (ficam no histórico sem escolha).

### 6.3 Narrativa

| Medida | Auditoria 12.3.1 | 12.35 |
|---|---|---|
| Moldes distintos nos textos do crime (8 vidas × 30 anos) | 23% | **36%** |
| O resumo anual mais repetido | 87 vezes (uma frase) | 9 vezes (uma das variantes) |
| Anos com algum acontecimento do crime na biografia | — | 148/240 |

## 7. Autonomia das organizações

O mundo roda para quem nunca entrou só se já existe mundo conhecido (não cria organizações para quem nunca passou por elas).
Para quem saiu e para o herdeiro, as organizações seguem: força, coesão, pressão, operações, guerras com baixas, sucessões,
rachas, renovação, comunidade. Teste dedicado: dez anos sem envolvimento mudam o estado e a história das organizações.

## 8. Persistência

Save continua na versão 20; todos os campos novos são opcionais. A única migração é a do posto (D6), que só roda quando o
posto do ramo é maior que o nível e marca `postoUnificado`. O perfil e a lealdade do quadro de saves antigos são derivados de
forma estável (pelo id) quando lidos. Ida e volta: **100%** em todos os perfis do simulador novo (casos, perfil, quadro, mercado,
oportunidades); testes do save antigo e da ida e volta passam. A sucessão continua levando o mundo; o legado ganhou `contatos`.

## 9. Desempenho

| Medida | Antes | Depois |
|---|---|---|
| submundo125, tempo por ano de vida (com as políticas) | 33 ms | 28 ms |
| submundo1235, por ano de vida | — | 10–11 ms (legal) · 22–25 ms (de dentro) · 34–37 ms (comando) |

O mundo é processado por ano, com 3 a 5 organizações por cidade conhecida e quadros de até 12 nomes; nada é simulado por
NPC fora disso.

## 10. QA visual

Build de produção servido localmente (`index-CKaSvTw9.js`), auditoria `scripts/playtest/rework123.mjs` com saves gerados pelo
código novo: Submundo (visão geral, atividades, contatos, histórico, líder, organizações, pedidos por fora, Justiça) e
novidades, nas paletas clara e escura, em 1440, 390 e 360 px — **114 capturas, 0 problemas** (sobreposição, contraste,
rolagem horizontal, alvos de toque). Conferência a olho das telas novas (pedidos por fora em 1440; organizações do líder em
390). O teste de fumaça do pacote passa 21/21. Observação de processo: a primeira rodada mediu, por engano, outro servidor
que ocupava a porta 4173; foi refeita contra o build novo.

## 11. Limitações conhecidas

- O integrante muito ativo ainda enriquece bastante (p50 ~10 mi aos 30 anos no simulador do 12.25) e é preso em ~46%: as
  duas pontas dependem muito da política (ir a toda guerra, aceitar todo trabalho).
- Boatos ainda são pouco frequentes fora de organizações sob muita pressão (6 em 16 vidas no perfil "operação").
- Separações causadas pelo crime não foram medidas de forma confiável no simulador (ver 6.2).
- A empresa legítima não é tocada por investigações (só bens pessoais); não há "empresa investigada".
- A ameaça à família é sempre narrada e indireta; não há violência explícita contra familiares (escolha de abstração).
- Contatos mudam de cidade só pela mudança do jogador (o contato não se muda sozinho).
- O save real de um jogador não estava disponível.

## 12. Arquivos alterados

Novos: `src/motor/sistemas/{conflitosCriminais,poderInterno,mercadoCriminal,vidaDupla,bensDoCrime}.ts`,
`src/motor/conteudo/acontecimentos1235.ts`, `src/motor/__tests__/rework1235.test.ts`, `src/ui/__tests__/rework1235.test.tsx`,
`scripts/sim/submundo1235.ts`, este relatório.
Alterados: `tipos.ts`, `ano.ts`, `acoes.ts` (bem bloqueado não se vende), `save.ts` (migração), `corpo.ts` (morte do crime),
`conteudo/{catalogo,acontecimentos125,submundo}.ts`, `sistemas/{faccoes,encomendas,ilicito,redeCriminal,relatoDoCrime,servicosPorFora,submundo,tempoDoCrime,tribunal,carreiraCriminal,acoesDoCrime}.ts`,
`ui/jogo/SubmundoVivo.tsx`, `ui/novidades.ts` (notas da versão 12.35), `vite.config.ts` (os módulos novos no pacote
`motor-carreira`), `scripts/playtest/rework123.mjs` (as novidades vistas), dois testes antigos.

## 13. Compatibilidade de saves

Saves de antes abrem e jogam (teste dedicado). Nada é removido do save. O ramo antigo "organizado" continua existindo (as
ações de tarefa ficam); só "pedir para subir" e "pedir para sair" do ramo ficaram indisponíveis (ocultos na tela), com a
explicação de que é com a organização.

## Reprodução

```bash
export PATH=$HOME/.nvm/versions/node/v22.23.2/bin:$PATH
npx vitest run src/motor/__tests__/rework1235.test.ts src/ui/__tests__/rework1235.test.tsx
npx esbuild scripts/sim/submundo1235.ts --bundle --platform=node --format=esm --outfile=/tmp/s.mjs && N=16 ANOS=30 node /tmp/s.mjs
npx esbuild scripts/sim/submundo125.ts --bundle --platform=node --format=esm --outfile=/tmp/t.mjs && N=24 ANOS=30 node /tmp/t.mjs
npx esbuild scripts/sim/narrativa1231.ts --bundle --platform=node --format=esm --outfile=/tmp/n.mjs && N=8 ANOS=30 node /tmp/n.mjs
```

**Pronto para revisão. Aguardando autorização para publicar.**
