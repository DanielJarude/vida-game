# REWORK 12.25 — Submundo vivo, carreira criminal e Justiça · relatório final

## 1. Auditoria inicial

Estado confirmado antes de começar: `main` em `9b3db08` (relatório do 12.2) e produção (`claude/fix-pos-rework3-playtest`)
em `7d2588b`; save v20. Branch de trabalho criada a partir de `main`: `claude/rework12.25-submundo-vivo`. Nada do REWORK
12.1 nem do sistema de contas foi tocado.

| Sistema | O que já existia | O que precisava integrar | O que precisava criar |
|---|---|---|---|
| Submundo e especializações | `ilicito` (envolvimento, exposição, investigação), `margem` (reputação, trabalhos maiores), `submundo` + `ramos` (5 ramos com prática, nome, ações e cenas) | a progressão dos ramos com uma carreira geral | patamares, marcos, ocupação principal, estados unificados |
| Exposição | cresce com o que se faz, esfria (rastro por ramo, 12.2) | — | — |
| Investigação/processo/condenação | `ilicito` → `justica` → `tribunal` (provas, defesa, acordo, fiança, assumir, cooperar, recurso só da prisão, reabilitação) | o advogado da investigação (`advogado_preventivo` era marcado e nunca lido) | etapas legíveis, estratégia, audiência, mandado, recurso de qualquer condenação |
| Penas alternativas e prisão | `justica` (alternativa em liberdade, ocupando o sábado na agenda), `prisao` (rotina, situações do pavilhão, fuga, foragido) | — (preservado) | cartas, saúde, a organização lá dentro |
| Contatos | fichas (papel, confiança, promessas, traição) | — | ações por papel, favores/dívidas, amizade, interesse, história |
| Organizações | relação com nome, lealdade, memória (só existia na relação) | a relação passa a ter uma organização viva atrás (mesmo id) | mundo autônomo, hierarquia de 7 níveis, sucessão, território, comando |
| Negócios clandestinos | `clandestinos` (12.2) | contas no extrato | — |
| Mercados paralelos | `paralelos` (12.2) | — | — |
| Profissões/carreiras | `situacaoProfissional`, `trabalho` | o crime como ocupação (sem virar "emprego") | `crimeEhPrincipal` |
| Agenda semanal | `agenda` (blocos fixos), `semana` (peso); a pena alternativa já ocupava o sábado | o caminho como bloco | `tempoDoCaminho`, capacidade de trabalhos no ano |
| Finanças | `extrato` (contábil, conciliado), `dinheiro` | o dinheiro do crime entrava sem linha (ia para "Acontecimentos do ano" ou "Compras") | tipo `por_fora` com sete fontes |
| NPCs | `pessoas`, `vinculos`, `lembrarCom` | contatos com memória própria | — |
| Família e sucessão | `familia`, `sucessao` (12.05 preservado) | o legado sem cargo | reações da família, convite ao herdeiro |
| Moradia/cidades/países | `moradia`, `migracao`, `lugares` (bairros só em texto) | regiões textuais da cidade | `faccoes.regioesDe` |
| Eventos | `conteudo/motor` (fila do ano, uma decisão por família de id) | — | 13 acontecimentos novos |
| Saves | v20, normalizações idempotentes por rework | `normalizarRework125` | — |

## 2. Problemas encontrados no playtest (causa investigada)

| Código | O que o jogador viu | A causa real |
|---|---|---|
| UI-12.25-01 | "À margem e a Justiça" e "A porta" (a introdução de iniciante) ao mesmo tempo, com anos de histórico | `justica.abrirProcesso` encerrava o envolvimento (`parou`); a divisão mostrava "A porta" para quem não estivesse "dentro" — ou seja, para todo processado, ex ou preso. E o carimbo do dossiê dizia "arquivado" para qualquer um fora de atividade, inclusive o preso. |
| FIN-12.25-01 | ganhos do Submundo que não apareciam no painel financeiro | **Contábil e de apresentação ao mesmo tempo**, sem dinheiro duplicado: o dinheiro entrava na conta sem linha própria. O do ano caía em "Acontecimentos do ano: heranças, rescisões, prêmios…"; o das ações da tela caía em **"Compras, viagens e outras escolhas"** (`linhaDoExtrato` não tinha o caso `submundo`). E a seta do patrimônio comparava duas fotografias antigas entre si, podendo contradizer o valor ao lado. |
| NAR-12.25-01 | "O que está virando isso" todo ano | `ilicito.anoEnvolvido` pedia o rumo a cada dois anos por regra fixa, mais em toda investigação — e a resposta não ficava registrada (nada impedia a mesma pergunta no ano seguinte). |
| NPC-12.25-01 | Enzo, Antônio, Davi com confiança e histórico, sem ações | as fichas só tinham "cumprir o combinado" quando havia promessa quebrada. |
| ORG-12.25-01 | "O pessoal dos Soares" aliada, com memória, sem interação | a organização existia só como relação (nome, lealdade, memória); não havia o que fazer com ela além de romper/propor aliança na organização própria. |

## 3. Correções realizadas

- **UI-12.25-01** — uma tela só (`ui/jogo/SubmundoVivo.tsx`) que lê um estado só (`carreiraCriminal.estadoNoSubmundo`): estado
  principal (nunca, primeiro contato, ocasional, profissional, de dentro, liderança, saindo, ex) **mais** as condições que se
  somam (investigação, processo, procurado, foragido, preso, pena alternativa, antecedentes). A porta aparece só para quem
  nunca entrou. O carimbo diz o estado de verdade (`em atividade`, `na moita`, `saindo`, `largado`, `procurado`, `pena em
  curso`). A normalização fecha a contradição "largou o caminho, mas a frente seguia ativa" e "parou, mas saindo". E o
  processo **não encerra mais** o caminho sozinho: quem responde fica na moita e decide (a prisão da pena, essa sim, encerra).
- **FIN-12.25-01** — tipo de movimento novo `por_fora` no extrato e sete fontes (`sistemas/porFora.ts`): o que o caminho
  rendeu no ano (recorrente), operações e serviços pontuais, negócios clandestinos (retiradas e vendas), encomendas, a parte
  da organização, o dinheiro posto nos negócios, os custos do caminho e as apreensões/confiscos/multas. Todo crédito e débito
  do Submundo passa por `movimentoPorFora`/`pagarPorFora` (que mexem na conta **e** lançam a linha na mesma chamada — nada
  entra duas vezes; o fechamento continua conciliando a zero). O advogado, a fiança e as custas viraram "Justiça: advogados,
  fianças e custas" (despesa). O painel financeiro mostra "Por fora, no último ano" (dizendo que não é renda do mês) e o
  extrato tem o grupo "Por fora (o Submundo)". A seta do patrimônio compara o valor de agora com o de dois anos atrás e diz o
  período ("cresceu em dois anos").
- **NAR-12.25-01** — `porFora.pedirRumo(v, motivo)`: a pergunta só vem com motivo (o primeiro ano, a investigação, a
  promoção, a perda grande, a família, o meio oferecendo mais, a volta) e com intervalo (três anos; dois na investigação)
  desde a última escolha — inclusive a feita na tela. A escolha fica em `env.rumo` (com o motivo) e o rumo também se escolhe
  na Visão geral, a qualquer hora (na moita, voltar ao ritmo, ir mais fundo, sair aos poucos, desistir de sair, largar).
  As cenas antigas dos ramos que repetiam quase todo ano ganharam intervalo (a disputa interna do grupo só vem quando a
  organização está rachada de verdade).
- **NPC-12.25-01** e **ORG-12.25-01** — ver §5 e §6.
- Encontrados durante o trabalho: o "advogado antes de tudo" do cerco (`ilic_cerco`) marcava um fato que nada lia (a promessa
  "a defesa já está pronta" não era cumprida) — agora é lido: a investigação arquiva mais e o processo começa com a defesa
  particular paga; o simulador do 12.2 olhava `momento.id` (o id da instância) em vez de `situacaoId`, e por isso nunca
  respondia às perguntas do caminho como pretendia (corrigido no simulador novo); viagem ao exterior não era bloqueada para
  quem é procurado.

## 4. Sistemas novos

| Sistema | Onde | O que faz |
|---|---|---|
| Carreira criminal | `sistemas/carreiraCriminal.ts`, `porFora.ts`, `tempoDoCrime.ts` | patamares (começo, experiente, influente, liderança, grande escala) com escala econômica 1×–20×; prática geral; marcos; o crime como ocupação principal (reconhecido, não declarado); sair aos poucos; o tempo do ano |
| Encomendas | `sistemas/encomendas.ts` | recebidas (dos contatos, da organização, do meio), com pagamento, chance, risco e prazo; aceitar, negociar (uma vez: aceita, contraproposta ou recusa), recusar; delegadas (adiantamento, um ano, resultado ou traição); fracassos com contexto |
| Contatos interativos | `sistemas/redeCriminal.ts` | ações por papel; favores e dívidas; amizade; interesse; história; teto de confiança por conversa; a vida dos contatos (envelhecem, saem, são presos, mudam de organização, reaparecem, cobram) |
| Organizações vivas | `sistemas/faccoes.ts` | o mundo do crime da cidade (3 a 5 organizações fictícias, com estilo pelo país e pelo ramo), hierarquia de 7 níveis com nomes próprios, força/coesão/pressão, quadro com nome, liderança e sucessão, alianças e rivalidades, território por região e a voz da comunidade, administração para quem comanda |
| Justiça interativa | `sistemas/defesa.ts` | etapas, advogado desde a investigação, estratégia, audiência, mandado, recurso de qualquer condenação, a vida de procurado (mudança de endereço, abrigo, apresentar-se), a captura com mandado |
| Ações | `sistemas/acoesDoCrime.ts` (ação `crime`) | as encomendas, os contatos, as organizações, a Justiça e o rumo, com disponibilidade (risco e preço ditos antes) |
| Acontecimentos | `conteudo/acontecimentos125.ts` | 13 cenas nascidas do histórico (família, pedido, cobrança, mudança de lado, disputa, novo comando, rivalidade, aliança oferecida, parceiro que reaparece, a volta oferecida, legado, abrigo, a organização no pavilhão) |
| Tela | `ui/jogo/SubmundoVivo.tsx`, `ui/submundo.css` | o Submundo numa tela só, em partes |

## 5. Integração com NPCs (contatos, favores, família)

**Ações por papel** (cada uma, uma vez por ano com a mesma pessoa; o risco e o preço ditos antes):

| Papel | Ações |
|---|---|
| parceiro / protegido | conversar, propor um trabalho juntos, pedir um favor, fazer um favor, chamar para a sua organização, encerrar a parceria |
| técnico | conversar, propor um trabalho, pedir/fazer favor, encerrar |
| fornecedor | conversar, negociar o preço do próximo lote, perguntar se há trabalho, pedir um lote fiado, fazer favor, encerrar |
| comprador | conversar, oferecer mercadoria (compra o lote guardado ou faz uma encomenda), pedir que apresente alguém, pedir/fazer favor, encerrar |
| quem manda (chefe) | conversar, conversar sobre o grupo, pedir proteção, fazer favor |
| intermediário | conversar, propor trabalho, apresentar alguém, pedir/fazer favor, encerrar |
| informante | conversar, perguntar o que se comenta (avisa da investigação; baixa a exposição a cada dois anos), pedir que fique de olho, fazer favor, encerrar |
| todos | cobrar o favor que ele deve (quando deve), acertar o que você deve (quando deve), procurar de novo (reconciliar, quando se afastou) |

**As respostas**: aceitar, recusar, **contraproposta** (o favor sai, mas cobrado; o trabalho sai, mas com a parte dele
maior; a proposta negociada volta com mais dinheiro e mais risco), pedir algo em troca (a cena `sub125_pedido`), cobrar
(`sub125_cobra`, quando a dívida passa de dois favores), mudar de organização (`sub125_mudou_org`), sair do meio (quem
envelhece e quer sair, sai sem briga), ser preso (e talvez falar), trair (quem encerra mal, quem cobra e é negado, quem
some com a encomenda), reconciliar-se (depois de anos, com amizade — e quem traiu há menos de cinco anos, não).

**Contra a máquina de confiança infinita**: a confiança que vem de conversa e gentileza tem teto de 10 pontos por ano por
pessoa (`mudarConfianca(..., social)`); a que vem de cumprir (o trabalho que deu certo, a dívida paga) não tem. Um contato
antigo e leal oferece mais trabalho, aceita mais, trai menos, perdoa mais (a `disposicao` soma confiança, amizade, favores
e o que ficou quebrado).

**Família** (`carreiraCriminal.anoDaFamilia`): pais, irmãos, parceiro e filhos a partir dos 12 anos podem desconfiar e
depois saber (mais quem mora junto, mais com exposição e processo). A postura sai da personalidade (o quanto acolhe, o
quanto preza as regras), da relação (proximidade, confiança, tensão) e da gravidade: apoia, se preocupa, pede para sair,
rejeita — e, depois que a pessoa sai, quem rejeitou pode voltar (`reconciliada`). As consequências são por postura (quem
rejeita afasta; quem apoia confia mais), não uma punição única. A cena (`sub125_familia`): contar a verdade, negar (quem já
sabe perde a confiança), prometer sair (começa a saída aos poucos) ou pedir que tente entender.

## 6. Organizações e hierarquias

- **O mundo do crime da cidade** (`faccoes.garantirCidade`): de 3 a 5 organizações fictícias por cidade (pelo porte), com
  estilo pelo país e pelo ramo — no Brasil, o crime organizado pode ser facção, família ou rede (nem todas iguais); na
  Itália, família ou rede; nos EUA/Canadá/Reino Unido/Austrália/Irlanda/Japão/Coreia, sindicato, família ou turma; o
  contrabando é rede, as fraudes são círculos, o digital é coletivo, os furtos são turmas. Nomes inventados
  ("a Irmandade do Cais", "o círculo de Andrade", "o coletivo Coruja"); nenhuma organização real usada como modelo.
- **A relação do jogador** continua em `RelacaoComOrganizacao`, com o **mesmo id** da organização viva — o save do 12.2 abre
  com "o pessoal dos Soares" no lugar dele, com a memória (`promessa cumprida`) e agora com força, quadro e território.
  Vínculo: conhecido, contato comercial, aliado (não é de dentro), integrante, liderança, ex-integrante, rival.
- **Hierarquia de 7 níveis**, com os nomes de cada estilo (ex.: facção — colaboração de fora, gente de dentro, gente antiga
  da casa, responsável por uma área, liderança regional, alta liderança, quem manda; família — gente de fora da família,
  gente da família, de confiança da família, à frente de uma equipe, conselho, braço direito, quem chefia).
  Sobe-se pedindo (lealdade, prática, tempo — uma vez por ano) ou sendo chamado (quem é leal e presente); cai-se com a
  lealdade abaixo de 25 (rebaixamento); sai-se expulso com a lealdade abaixo de 12 ou a traição recente. O posto do ramo
  organizado (11.5) é lido junto (nunca fica atrás).
- **A parte de quem é de dentro**: por ano, pelo posto, a força, a influência e a prioridade da organização (anos secos
  existem, mais quando ela está rachada) — do "um bico para a rede" (uns poucos mil) a quem manda (perto de um milhão por
  ano numa organização forte de cidade grande). Ser de dentro também expõe (cresce com o posto e com a pressão sobre ela).
- **Administração** (posto ≥ 3 ou organização própria): a prioridade do ano (crescer, arrumar a casa, fazer dinheiro, sumir
  do radar), resolver a briga interna (mediar), mandar recolher quando a pressão está alta, fazer-se presente numa região,
  propor e romper alianças — uma escolha por ano, sem microgerenciamento.
- **Disputas e sucessão** (`sub125_disputa`): a liderança vaga (morte, prisão, saída, perda de apoio — e a prisão do
  próprio jogador, se ele mandava) abre uma disputa com dois nomes do quadro (e o jogador, se tem posto ≥ 4). Apoiar alguém,
  ficar de fora, disputar ou sair. No ano seguinte, alguém assume — numa conversa, num acordo, num conselho, num racha
  (que custa força) — e a organização continua. Quem apoiou o vencedor sobe; quem apoiou o perdedor pode cair.
- **Mundo autônomo**: força com volta ao tamanho de costume, pressão que cresce com a força e esfria, operações da Justiça
  que levam alguém do quadro, gente que envelhece, morre, sai e é promovida, gente nova entrando, alianças e rivalidades que
  se fazem e desfazem, organizações que enfraquecem e acabam — e outra que nasce no espaço vazio. Só existem as
  organizações das cidades por onde o caminho passou; o ano de cada uma é uma conta curta (sem simular milhares de NPCs).
- **Território** (§10 do pedido): a presença de cada organização em cada região da cidade (regiões textuais: o centro e as
  zonas na metrópole; centro, bairros e zona rural na cidade pequena) e a **voz de quem mora lá** (moradores e comércio):
  sobe quando alguém quer mandar demais e, alta, pressiona e tira espaço de quem quer mandar. A região onde a pessoa mora
  pesa no abrigo de quem é procurado e na rivalidade (`sub125_rivalidade`: conversar com o outro lado, defender o espaço ou
  recuar). Nenhuma região é "do crime" por ser pobre: a influência nasce da presença, das alianças e do que acontece.

## 7. Justiça e prisão

- **Etapas** (`defesa.etapaAtual`, `linhaDaJustica`): suspeita → investigação → processo → julgamento → sentença →
  (recurso) → cumprimento — a tela mostra a linha, com a etapa de agora.
- **Na investigação**: pôr um advogado para acompanhar desde já (a investigação vira processo menos vezes; se virar, a
  defesa já está paga). A investigação continua sem condenação automática (arquiva em até três anos sem o bastante).
- **No processo**: a ficha de sempre (provas, defesa, acordo, fiança, assumir, cooperar) e agora a **estratégia** (uma por
  processo: contestar as provas — funciona mais com advogado particular —, mostrar o que atenua, ou deixar com o advogado)
  e a **audiência** no ano do julgamento (preparar-se com a defesa, comparecer, ou não ir — o que abre um mandado).
- **Recurso** de qualquer condenação do ano (a pena alternativa e a multa também).
- **O processo não encerra mais a carreira** (antes, `abrirProcesso` fazia `parou`): quem responde fica na moita; a
  prisão da pena é que encerra o caminho. Dinheiro paga advogado, não compra absolvição (a chance continua com teto).
- **Procurado** (o mandado da audiência a que faltou, a pena alternativa abandonada) e **foragido** (a fuga de antes): o
  processo para, a fronteira fecha (mudar de país e viajar ao exterior), o emprego com carteira acaba (os documentos), a
  família sente; dá para mudar de endereço (menos chance de ser encontrado por um ano), aceitar o abrigo de uma organização
  aliada com presença na sua região (menos chance por dois anos, e uma dívida com ela) ou apresentar-se (com advogado, a
  espera costuma ser em liberdade). A chance de ser encontrado é dita na tela (6% a 60%). Ser encontrado com mandado leva à
  espera presa do julgamento (não a uma pena inventada); a pena alternativa abandonada vira prisão.
- **Prisão**: a rotina de antes (estudar, trabalhar, visitas, conviver, defensoria, preparar a saída, as situações do
  pavilhão, fugir) ganhou **escrever para a família** e **cuidar da saúde**; quem é de dentro de uma organização encontra
  a gente dela no pavilhão (`sub125_pavilhao`: ficar com eles, manter distância, ou avisar que, ao sair, está fora).
- **Pena alternativa preservada**: continua ocupando a manhã de sábado na agenda e o peso da semana (testes de regressão em
  `rework125.test.ts`), e terminar de cumpri-la é como era.

## 8. Economia criminal

- **Escalas** (`carreiraCriminal.patamarAtual`): começo (1×), experiente (2,2×), influente (4,5×), liderança (9×), grande
  escala (20×) — o valor de uma encomenda, de uma parte de organização e de um negócio crescem com o patamar; para quem já
  tem muito, o trabalho grande também escala com o patrimônio (0,2% a 1,5%). Sem teto artificial; sem enriquecimento
  garantido (cada trabalho tem chance, risco e anos secos; o confisco na condenação continua).
- **Encomendas** pagam 2,5, 6 ou 14 meses da renda de referência do envolvimento (pela gravidade), vezes o patamar.
- **Tempo**: de 1 a 5 trabalhos aceitos por ano, pela semana (emprego integral, estudo, posto de comando).
- **Fracassos interessantes**: aprender (a prática sobe), um contato novo, uma dívida, um conflito, uma oportunidade menor e
  mais segura, uma perda parcial — e, às vezes, a exposição. Depois de dois erros seguidos, o meio oferece o que cabe (a
  chance sobe 12 pontos).

## 9. Balanceamento — diversão antes do punitivismo

O que mudou, e por quê (medido no simulador, §10):

- **Oportunidade constante**: além dos contatos de confiança e da organização, o próprio meio procura quem tem nome ou
  prática (um intermediário novo chega com uma proposta). Nos perfis ativos, a mediana de **anos sem nenhuma escolha
  interessante é 0**.
- **Recompensas que valem o risco**: a encomenda paga 2,5/6/14 meses da renda de referência (antes, as operações da tela
  pagavam 0,5–5 meses, sem patamar), vezes o patamar.
- **Sem sequência infinita de fracassos**: a chance base de um trabalho pequeno é 84%; depois de dois erros seguidos, +12
  pontos. No simulador, a maior sequência de fracassos (p90) foi de 1 a 3.
- **Fracassos que contam história** (seis desfechos, só um deles é "a exposição sobe").
- **Justiça proporcional preservada** (o reequilíbrio do 12.2 ficou intacto: rastro por ramo, investigação com prazo, pena
  alternativa para o primário sem violência). O que mudou foi o processo deixar de encerrar a carreira, e o advogado da
  investigação passar a valer. O crime organizado intenso e a reincidência continuam perigosos (líderes e integrantes
  terminam presos em boa parte das vidas — ver §10).
- **Repetição**: a pergunta do rumo caiu de "a cada dois anos por regra" para ~0,2 por ano ativo (uma a cada cinco anos,
  sempre com motivo); as cenas antigas dos ramos ganharam intervalo de 2–3 anos; a disputa interna só vem com a
  organização rachada.
- **Sem teto artificial e sem igualar carreiras**: a liderança enriquece muito mais que o furto; o contrabando e a fraude
  ficam no meio; tudo com anos secos, confisco na condenação e prisão possível.

## 10. Resultados das simulações

`scripts/sim/submundo125.ts` — 14 perfis × 12 vidas × 30 anos (São Paulo e Rio), cada perfil jogando com as ações da tela
e respondendo às perguntas do caminho de forma coerente. Patrimônio líquido p10/p50/p90 aos 10, 20 e 30 anos:

| Perfil | 10 anos | 20 anos | 30 anos | 1ª progressão (mediana) | Liderança | Desfechos na Justiça (12 vidas) | Saídas |
|---|---|---|---|---|---|---|---|
| nunca entrou | −41k / 2k / 110k | −32k / 94k / 749k | −85k / 231k / 2,5mi | — | — | nenhum | — |
| ocasional | −21k / 1k / 13k | −59k / 3k / 273k | −24k / 135k / 2,4mi | 5 anos (10/12) | — | 1 investigação, 0 processos | 12 (todas limpas: prometeu à família) |
| profissional | −16k / 103k / 337k | 258k / 1,2mi / 3,0mi | 1,4mi / 4,0mi / 10,3mi | 3 anos (12/12) | 10/12, mediana 16 anos | 11 processos: 9 absolvições, 1 sem prisão, 1 prisão | 2 |
| integrante | 371k / 864k / 2,1mi | −572k / 1,6mi / 10,4mi | 1k / 405k / 25,5mi | 2 anos | 11/12, mediana 9 anos | 17 processos: 8 absolvições, 9 prisões | 8 |
| líder | 539k / 3,8mi / 5,4mi | 247k / 14,5mi / 19,9mi | 43k / 3,4mi / 34,3mi | 1 ano | 12/12 | 18 processos: 8 absolvições, 10 prisões | 9 |
| dono de negócio por fora | 662k / 859k / 1,4mi | 824k / 1,6mi / 2,4mi | 599k / 1,7mi / 2,5mi | 3 anos | — | 24: 16 absolvições, 4 sem prisão, 4 prisões | 5 |
| milionário (20 mi) | 25,0 / 25,9 / 26,7mi | 29,7 / 32,4 / 35,4mi | 38,1 / 42,1 / 46,9mi | 3 anos | — | 21: 8 absolvições, 6 sem prisão, 7 prisões | 7 |
| foragido (falta à audiência) | −64k / 18k / 120k | −13k / 99k / 426k | 58k / 340k / 1,0mi | 6 anos | — | 20: 10 absolvições, 9 prisões; 9 com mandado | 7 |
| preso (4 anos) | −1k / 40k / 57k | 18k / 116k / 1,3mi | 153k / 717k / 3,4mi | — | — | a pena de partida | — |
| ex (sai aos poucos no 4º ano) | −18k / 4k / 184k | −63k / 6k / 720k | −23k / 496k / 1,5mi | 3 anos | — | 0 processos | 12 (limpas) |
| furtos | −16k / 103k / 278k | 127k / 581k / 957k | −33k / 1,0mi / 1,7mi | 3 anos | — | 11: 8 absolvições, 1 sem prisão, 2 prisões | 3 |
| contrabando | 49k / 173k / 634k | 28k / 678k / 1,3mi | 2k / 1,3mi / 1,7mi | 3 anos | — | 22: 17 absolvições, 1 sem prisão, 4 prisões | 4 |
| digital | −99k / 86k / 254k | 0k / 282k / 1,0mi | 5k / 537k / 1,4mi | 3 anos | — | 24: 8 absolvições, 9 sem prisão, 7 prisões | 8 |
| fraudes | 20k / 326k / 584k | 1k / 927k / 1,6mi | 0k / 814k / 2,2mi | 3 anos | — | 26: 20 absolvições, 1 sem prisão, 5 prisões | 5 |

Diversão medida (mesma rodada):

- **Oportunidades diferentes por vida** (tipos de encomenda + cenas do caminho, mediana): 13 a 16 nos perfis ativos (7 no
  ocasional, que recusa quase tudo).
- **Pergunta do rumo por ano ativo**: 0,16 a 0,33 (era ~0,5 por regra fixa, mais as investigações).
- **Cenas repetidas em menos de 3 anos**: concentradas em `subc_mercado` e `subx_denuncia` (cenas do 11.5) e no pedido de
  contato — os três ganharam intervalo de 3 anos depois desta rodada.
- **Anos sem escolha interessante** (mediana): 0 em todos os perfis ativos.
- **Maior sequência de fracassos** (p90): 1 a 3.
- **Tempo até a liderança**: 9 anos (mediana) para quem começa aliado de uma organização; 16 anos para quem começa no
  furto e chega lá pelas propostas e pela filiação.
- **Abandonar é possível**: todas as saídas do "ex" e do "ocasional" ficaram limpas (sem processo depois); nos perfis
  intensos, ~90% das saídas ficaram limpas.
- **Diversidade de desfechos**: há vidas que enriquecem muito, vidas que perdem tudo na prisão (o p10 do líder aos 30 anos é
  43 mil), vidas presas que reconstroem (o preso chega a 717 mil de mediana aos 30) e vidas que saem limpas.
- **Viabilidade das especializações**: as cinco chegam a centenas de milhares/um milhão de mediana em 20–30 anos, com
  perfis de risco diferentes (o digital e a fraude condenam mais sem prisão; o contrabando absolve mais; o organizado
  prende mais).
- **Contas**: zero linhas de ajuste no extrato em 5.040 anos simulados; zero anomalias (NaN/infinito).
- **Mundo**: as organizações trocam de comando (sucessões ao longo de 30 anos), nenhuma cidade fica vazia (a que acaba é
  substituída), nenhuma org extinta em cascata.

Observação honesta: o p10 negativo de vários perfis aos 10 anos é o mesmo do perfil que nunca entrou (o cenário começa com
emprego de assistente administrativo e pouco dinheiro); não é efeito do crime.

## 11. Compatibilidade de saves

- **Versão do save continua 20**; tudo novo é opcional (`Envolvimento.carreira/encomendas/rumo/saindo/familia/cenas125`,
  campos novos da ficha e da relação com organização, `Justica.defesa`, `foragido.motivo/abrigo/mudouEndereco`,
  `Vida.mundoCriminal`, o tipo de movimento `por_fora`).
- `normalizarRework125` (idempotente): cria a carreira a partir da prática dos ramos, torna coerente quem "largou" com
  frentes ainda ativas, e dá às organizações da relação uma organização viva com **o mesmo id e o mesmo nome**.
- Quem nunca entrou não ganha nada novo no save.
- Testado: um save no formato do 12.2 com "o pessoal dos Soares" (memória de promessa cumprida) abre com a organização
  intacta; abrir duas vezes dá o mesmo JSON; os **23 saves de QA do 11, 11.5 e 12.2** (`scripts/sim/saves125.ts`) abrem,
  são idempotentes, vivem três anos e conciliam o extrato; a suíte do 12.05 (sucessão de menores) passou inteira.
- A sucessão leva o mundo do crime para a próxima geração (as organizações continuam) e o **legado sem cargo**
  (`mundoCriminal.legado`); a regra de sucessão e herança do 12.05 não mudou.

## 12. Testes executados

Na ordem pedida (§26), sequencialmente, nada pesado em paralelo:

| Verificação | Resultado |
|---|---|
| Testes direcionados (`motor/__tests__/rework125.test.ts`, 36 testes; `ui/__tests__/rework125.test.tsx`, 7 testes; mais os de Submundo/Justiça/prisão/UI antigos) | todos aprovados |
| Typecheck (`tsc --noEmit`, na cópia Linux) | limpo |
| Suíte completa (`vitest run`) | **2.040 / 2.040**, 119 arquivos (antes: 1.997) |
| Build (`npm run build`) | sem avisos; nenhum pacote acima de 800 kB (o limite não foi mudado). Maiores: `motor-textos` 783,6 kB (era 782,8), `Jogo` 758,8 kB, `motor` 751,0 kB, `motor-carreira` 534,9 kB (onde mora o Submundo novo) |
| Smoke itch.io (`scripts/itch/smoke.mjs`) | 21/21 |
| PWA offline (`scripts/pwa/offline.mjs`) | 36/36 |
| QA visual (`scripts/playtest/rework125.mjs`, saves de `gerarRework125.ts`) | 15 cenas × 4 paletas × 1440/390 (+360 e 390×560 em 9 cenas) = 348 capturas: **0 problemas** de sobreposição, contraste < 3:1, rolagem horizontal, borda estourada ou erro de console; nenhum alvo < 44 px nos componentes novos (os 8 apontados são do Dinheiro e da agenda, anteriores) |
| Simulações (`scripts/sim/submundo125.ts`) | 14 perfis × 12 vidas × 30 anos, medidas aos 10/20/30 (§10): 0 ajustes no extrato, 0 anomalias |
| Saves antigos (`scripts/sim/saves125.ts` + testes) | 23/23 saves de QA do 11/11.5/12.2; formato 12.2 com organização e memória; idempotência |
| Revisão do que mudou fora do escopo | abaixo |

**O que mudou fora do Submundo, e por quê**: `agenda.ts`/`semana.ts`/`Agenda.tsx` (o caminho como bloco da semana, pedido
no §20); `Dinheiro.tsx`/`leituraMaterial.ts` (FIN-12.25-01: a linha "por fora", o grupo no extrato, a seta do patrimônio);
`sucessao.ts` (o mundo do crime e o legado sem cargo passam ao herdeiro — duas linhas, sem tocar na regra do 12.05);
`acoes.ts` (a ação `crime`, a linha do extrato das ações do Submundo, a viagem ao exterior bloqueada para quem é procurado);
`texto.ts`/`conteudo/base.ts` (a contração "de a → da", aplicada só aos textos do Submundo); `Trabalho.tsx` (dois botões
novos na prisão); `justica.ts` (o processo não encerra mais a carreira; a prisão da pena encerra; o gancho do procurado;
o advogado de antes); `trajetorias.ts` (a pergunta do rumo); `rework10.test.ts` (o estado montado à mão passa pela
normalização nova, como o próprio teste já fazia com a do 11.5); `novidades.ts` (a nota da versão 12.25, como toda entrega);
`vite.config.ts` (os módulos novos no pacote `motor-carreira`).

## 13. Pendências reais

- **Não testado num aparelho de verdade** (só Playwright em 360/390/1440).
- **O save real do jogador do playtest não estava disponível**: o UI-12.25-01 foi reproduzido pela causa (processo que
  encerrava o envolvimento), não pelo arquivo dele.
- **A pergunta do rumo ainda pode aparecer duas vezes em três anos** quando os motivos se encadeiam (o primeiro ano e, dois
  anos depois, uma investigação) — é intencional (motivos diferentes), mas pode parecer repetição.
- **As cenas antigas do 11.5** (`subc_mercado`, `subx_denuncia`) e o pedido de contato ganharam intervalo de 3 anos depois
  da rodada longa do simulador; a rodada não foi refeita com esse ajuste (a suíte completa foi).
- **Crime organizado continua o mais perigoso**: no simulador, líderes e integrantes terminam presos em ~75% das vidas em
  30 anos (o p50 do líder cai de 14,5 mi aos 20 para 3,4 mi aos 30, pelo confisco). É coerente com o pedido ("crime
  organizado intenso pode continuar perigoso"), mas vale olhar no playtest se a curva está boa.
- **Território é textual** (regiões por nome, presença e voz da comunidade em barras); não há mapa — como permitido no §10.
- **Mercados paralelos** continuam no Patrimônio/Compras (12.2); a parte "Negócios" do Submundo mostra só os negócios por fora.
- **A família reage em 5 posturas**; não há cena própria para o cônjuge que decide ir embora por causa do crime (a tensão
  existe e o término pelas regras antigas continua possível).
- APK Android **não** foi regenerado.

## 14. Commits

Branch `claude/rework12.25-submundo-vivo`, a partir de `9b3db08`:

| Commit | O quê |
|---|---|
| `3ffe2af` | motor (checkpoint 1): carreira, contas por fora, rumo com motivo, encomendas, contatos, organizações vivas, Justiça por etapas e mandado |
| `356a17a` | motor (checkpoint 2): acontecimentos, agenda do caminho, legado, normalização, processo sem fim automático, simulador |
| `c197444` | interface: o Submundo numa tela só; dinheiro por fora no painel; prisão com cartas e saúde |
| `cfb9a59` | testes do 12.25 (motor e telas) |
| `53c33f6` | notas da versão, ajustes, QA visual, rascunho do relatório |
| `d1eeda6` | contrações nos textos do Submundo; gerador de saves do QA |
| `949728b` | procurado/foragido flexionados pelo gênero |
| `697cf9d` | intervalos das cenas que ainda repetiam; verificação de saves antigos |
| `81da248` | relatório final (primeira entrega) |
| `46b65c3` | risco proporcional de quem é de dentro (o bug do risco das encomendas, quem comanda delega, a organização protege e banca a defesa, prova fraca, preventiva), intervalos das cenas antigas, simulador com custódia e o líder cauteloso |
| (seguinte) | relatório: validação e publicação |

## 15. Validação antes da publicação (pedido de 2026-10-26)

**1. Simulações longas depois dos ajustes de frequência** — refeitas com 15 perfis × 24 vidas × 30 anos (`sim125c`). As
cenas antigas que repetiam (`subc_mercado`, `subx_denuncia`, e também `subf_escala`, `subd_encomenda`, `subd_exposto`,
`subx_conflito`) ganharam intervalo de 3 anos e **deixaram de aparecer** entre as repetições em menos de 3 anos; o que
sobra é a pergunta do rumo motivada por investigação (intervalo de 2 anos, intencional) e o "trabalho maior" do 11.5
(~0,5 por vida). Anos sem escolha interessante: 0 (mediana) em todos os perfis ativos. Nenhuma regressão de patrimônio:
as cinco especializações ficam entre ~0,5 e ~1,7 mi de mediana em 20–30 anos.

**2. A taxa de prisão de integrantes e líderes (e o pedido de 30–40%)** — investigada pela causa, não por um número:

- **Bug real**: o risco de uma encomenda usava a exposição *anual* do ramo (9–20 pontos) como fator — uma encomenda grande
  "arriscava" ~190 pontos e uma só levava a exposição ao teto. Corrigido (risco relativo aos furtos: 6/10/16 pontos ×
  0,6–1,4 pelo ramo). Isso afetava todo perfil que aceita trabalho.
- **Incoerência**: quanto mais alto o posto, mais exposição pessoal — o oposto de "quem comanda delega". Agora a exposição
  pessoal cresce até o posto de responsável por uma área e diminui acima; a exposição anual "de rua" de quem comanda pesa
  metade, e a investigação chega menos até ele (camadas entre a pessoa e os fatos).
- **A lealdade tem retorno**: a organização protege quem é de dentro e leal (lealdade ≥ 50: investigação 30% menos
  provável) e banca a defesa dele (advogado particular sem custo). Quem é infiel ou expulso não tem isso.
- **Prova fraca pesa a favor**: com provas abaixo de 40, a absolvição sobe (antes, com provas "fracas", a condenação ainda
  passava da metade). Continua com teto de 70%: dinheiro não compra absolvição.
- **Preventiva** do grupo: primário 35% → 12%, reincidente 55% → 30% (a regra é responder em liberdade).

Resultado (24 vidas por perfil, 30 anos; "condenado à prisão" = sentença de prisão que ficou depois do recurso;
"custódia" inclui a preventiva):

| Perfil | Condenados à prisão (antes → depois) | Passaram por custódia | Patrimônio p50 aos 30 anos |
|---|---|---|---|
| integrante de organização | 75% → **25%** | 42% | 16,7 mi |
| líder (faz pessoalmente ~3 trabalhos graves por ano, 30 anos) | 83% → **46%** | 67% | 3,1 mi (p90 51 mi) |
| líder cauteloso (delega o grande, recolhe sob pressão) — perfil novo | — → **13%** | 38% | 8,6 mi |
| profissional | **25%** | 29% | 4,4 mi |
| contrabando / digital / fraudes / furtos | 33% / 17% / 21% / 17% | 33% / 25% / 21% / 25% | 1,3 / 1,7 / 0,8 / 0,9 mi |
| dono de negócio por fora / milionário | 13% / 8% | 17% / 13% | 2,8 / 44 mi |
| foragido (falta à audiência de propósito) | 58% | 83% | 0,7 mi |

O líder que joga no limite por 30 anos fica em 46% (um pouco acima da faixa pedida) e o cauteloso em 13%: preferi manter
essa diferença — é uma escolha do jogador, e o pedido era não reduzir números arbitrariamente. Entre os perfis de
organização, a média fica em ~28%.

**3. Os cinco problemas do playtest** continuam corrigidos e testados (`motor/__tests__/rework125.test.ts` e
`ui/__tests__/rework125.test.tsx`: tela única sem a introdução para quem tem histórico, carimbo correto, linha "por fora" no
extrato, rumo com motivo e intervalo, ações por papel, organização com relação, hierarquia e disputa). A pena alternativa
continua ocupando o sábado na agenda (teste de regressão) e a sucessão de menores (`rework1205.test.ts`) passou na suíte.

**4. Testes depois das alterações**: typecheck limpo; suíte completa **2.042 / 2.042** (dois testes novos para o risco das
encomendas e a proteção da organização); build sem avisos (maior pacote 783,6 kB); smoke itch.io 21/21; PWA offline 36/36;
**30/30 saves** (os de QA do 11, 11.5, 12.2 e 12.25) abrem, são idempotentes, vivem três anos e conciliam o extrato. A
interface não mudou desde a auditoria visual (348 capturas, 0 problemas).

**5. Branch de produção**: `origin/claude/fix-pos-rework3-playtest` continuava em `7d2588b` e `origin/main` em `9b3db08`,
os mesmos da auditoria inicial.

Commit desta rodada: `46b65c3` (ver §14).

## 15. Estado de publicação

**Nada foi publicado.** Nenhum push, merge ou deploy; a branch de produção (`claude/fix-pos-rework3-playtest`, em
`7d2588b`) e a `main` (`9b3db08`) não foram tocadas. A versão das notas cadastrada é **12.25**. Aguardando autorização
expressa para push, merge e publicação.
