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

[[CONTINUA3]]
