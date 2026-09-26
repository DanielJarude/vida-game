# REWORK 1 — Caminhos, agência e UX

> "Eu quero tentar construir determinada vida. O jogo deve me permitir
> entender como perseguir isso, sem garantir que eu vá conseguir."

Este rework não deixou nada mais fácil de propósito. Ele fez os caminhos
**descobríveis, perseguíveis, compreensíveis, responsivos à biografia** e
com **fracasso explicável** — e mudou Trabalho e Estudos para que a tela
responda onde estou, o que dá para fazer, o que estou tentando, o que falta,
se estou melhorando e qual é o próximo passo.

## 1. Base exata e branch

| | |
| --- | --- |
| Base | `claude/fix-playtest-4` @ `955d5d4e148dec62d48e5e7b964826f92e7d9ea8` (confirmada, working tree limpa) |
| Branch | `claude/rework-caminhos-agencia-ux` (criada da base) |
| Baseline | typecheck limpo, build ok, **520/520** testes (18 arquivos) |
| Ao fim | typecheck limpo, build ok, **582/582 testes** (20 arquivos) |
| Node | 22 (`~/.nvm/versions/node/v22.23.2`) |
| Save | **v15** (migra v14; ver §11) |

Sem merge em `main`, sem force-push, sem histórico reescrito, sem segredos.
Lidos antes de mexer: README, FIX-PLAYTEST-4, FIX-PLAYTEST-3,
AUDITORIA-CAMINHOS-DE-VIDA, REWORK-VISUAL-TRABALHO.

## 2. Objetivo e método

Cada grande caminho foi auditado na cadeia
**intenção → descoberta → requisitos → preparação → tentativa → processo →
resultado → explicação → consequência → próximo passo**. Antes de
implementar, foi escrito um simulador de **intenções** (`scripts/sim/intencoes.ts`,
§8) e rodado na base — os números "antes" são dele, com o mesmo código.

## 3. Causas encontradas (não os sintomas)

| Sintoma do playtest | Causa na base | Onde |
| --- | --- | --- |
| Nutricionista com mestrado e doutorado só via diarista, doméstica, confeiteira | (a) mestrado e doutorado são cursos de área `qualquer` e eram gravados assim ("Doutorado", sem área): a vida acumulada **perdia a identidade**; (b) a trilha de Nutrição tinha **um único cargo** (nível 3), assim como Odontologia, Farmácia, Arquitetura e Educação Física; (c) não existia docência superior fora do concurso federal; (d) a ordenação das vagas somava a chance de contratação, e vagas de entrada têm a chance mais alta; (e) a bolsa de pós-doutorado só aparecia para quem estava **sem trabalho** | `dados/cursos`, `escola.concluirCurso`, `dados/ocupacoes`, `relevancia.vagasParaVoce`, `oportunidades` |
| "O próximo passo (sargento da PM) pede formação: 31 anos" | `horizonte` lia o texto do bloqueio por regex: qualquer "Exige …" virava "pede formação" — inclusive **"Exige 31 anos."** (idade mínima). Depois, "pede mais tempo de estrada" (13 anos de corporação), e só então a antiguidade | `trabalho.horizonte` |
| Concursos: "Preparo de quem vem estudando a sério. Ainda assim, há concorrência." em todo edital, anos seguidos | o preparo era **um número sem direção** (meses de estudo), a experiência na área **não contava**, e a leitura tinha 4 frases fixas; a devolutiva não lembrava a tentativa anterior | `concurso.preparoPara`, `leituraDoPreparo` |
| Cabo da PM tratada como "alguém que estudou" | idem: nenhuma ligação entre a estrada (farda, Direito, contas) e o edital | `concurso` |
| Peneira: "a técnica ainda não está no nível", de novo, sem saber se melhorou | a peneira **não guardava** em que ponto a técnica estava; a técnica nunca era dita em palavras; e o jogador **não podia pedir um teste** — a peneira só chegava sorteada (e só até os 17/18) | `peneira`, `esporte`, `oportunidades` |
| "Só consegui carreira especial na política" | a política tinha uma ação sempre visível ("Aproximar-se da vida política") e convites frequentes (a cada 6 anos, até 22%/ano; todo servidor ou militar com 10 anos tinha a porta); esporte, arte e pós-doutorado **não tinham nenhuma ação do jogador** | `politica.processarPolitica`, UI |
| "Sem partido, não há candidatura" e nenhuma opção de filiar-se | a personagem era **militar da ativa**: `filiar` é `ilegal` (CF, art. 142, §3º, V), a ação some da lista (filtrada por disponibilidade) — e o horizonte pedia filiação. Mas militar da ativa **é elegível sem filiação**, escolhido em convenção (TSE). O motor já tratava o afastamento/agregação no registro, e nunca chegava lá | `politica` |
| "Trabalho de confeitaria" que virou autônoma, freguesia, MEI | confeiteira (e cabeleireiro, manicure, eletricista, fotógrafo) **só existia por conta**; a indicação dizia "pode passar serviço" sem dizer o modelo; o botão era "Aceitar"; e a promoção podia trocar empregado por autônomo em silêncio | `dados/ocupacoes`, `oportunidades`, `trabalho.degrausAcima` |
| Diarista recebendo "erro caro para a empresa", "relatório com números trocados", "culpar colega" | o acontecimento pedia só `contrato !== 'informal'`; diarista é `autonomo`. O motor conhecia o **cargo**, não o **ambiente** (há chefia? colegas? uma organização? papel?) | `conteudo/escolhas`, `adulto`, `caminhos`, `profissao` |
| Emprego + reuniões políticas + doutorado integral | verificado: a matrícula já passa por `propor()` desde o FIX #4 (curso integral × trabalho integral pergunta antes). A vida política fora do mandato não é compromisso de agenda (é rotina/ação) — continua fora do escopo | `compromissos` |

## 4. Arquitetura: antes → depois

| | Antes | Depois |
| --- | --- | --- |
| Formação avançada | `Doutorado` (área `qualquer`) | `Doutorado em Nutrição`: a área herdada (`escola.areaDaPos`, `Matricula.area`), migrada nos saves |
| Formação × vaga | só "tem o diploma exigido" | a pós **na área** conta como estrada (`trabalho.titulacaoNaTrilha`: especialização 1 ano, mestrado 2, doutorado 3 — até o nível de especialista, não o de chefia) e isso é dito ("contando o doutorado em Nutrição como estrada") |
| Próximo passo | uma frase por regex | `trabalho.proximoPasso` → requisitos tipados (`idade`, `servico`, `posto`, `experiencia`, `formacao`, `registro`, `curso`, `fisico`, `desempenho`, `cidade`, `vaga`), cada um com o ano em que se cumpre; `militar.proximoPassoMilitar` para as Forças; `horizonte` resume a partir disso |
| Ambiente de trabalho | contrato | `sistemas/ambiente.ts`: `chefia`, `colegas`, `organizacao`, `escritorio`, `balcao`, `residencias`, `clientes`, `agenda`, `obra`, `fabrica`, `hospital`, `escola`, `farda`, `estrada`, `campo`, `palco`, `clube`, `gestao` — derivado de contrato, empregador, setor, trilha e negócio; `noTrabalho()` e `varianteDoLugar()` |
| Empregabilidade | só a chance | `sistemas/empregabilidade.ts`: perfil para a vaga (formação, estrada na área, estrada que se transfere, ofício, histórico, "currículo maior que a vaga", cidade) → palavra de compatibilidade, camada (trajetória / relacionada / outra), motivo da rejeição |
| Vagas | uma lista por pontos | `relevancia.vagasEmCamadas` (a trajetória vem primeiro; um passo atrás nunca é a primeira camada) |
| Modelo de trabalho | implícito | `trabalho.modeloDeTrabalho` (`emprego`, `por_conta`, `negocio`, `concurso`, `oportunidade`, `mandato`) + `ROTULO_MODELO`; `degrausAcima` não cruza modelos |
| Preparo para concurso | meses | meses **e** foco (`PreparoConcurso.foco`, `mesesFoco`), `trajetoriaParaConcurso`, `lerPreparo` (nível, o que pesa, desde a última tentativa) |
| Pedidos do jogador | — | `sistemas/perseguir.ts` (ação `perseguir`): `pedir_teste`, `montar_grupo`, `mostrar_trabalho`, `foco_concurso`, `bolsa_pesquisa` |
| Progresso | — | `Devolutiva.nivel` (a régua do próprio processo: preparo, técnica, currículo, público), usada para "desde a última vez…" |
| Caminhos | — | `sistemas/caminhosDeVida.ts`: `emConstrucao` (o que esta vida está construindo) e `caminhosPossiveis` (por onde começa cada vida, para esta vida) |

## 5. Mudanças por sistema

### Emprego e empregabilidade
- Perfil para cada vaga, em palavras: "A formação (Nutrição) é a que a vaga pede", "4 anos de estrada em escritório: sólida", "Experiência que se transfere: 2 anos em áreas vizinhas contam aqui pela metade", "Muitas passagens curtas nos últimos anos: quem contrata repara", "O currículo é maior que a vaga: há quem ache que você vai sair logo". Compatibilidade: **distante / possível / compatível / muito compatível** — nunca número.
- "Currículo maior que a vaga" é um fator **real** (−0,04 na chance para quem tem graduação ou mais numa vaga de nível ≤2 sem área) — a UI não diz o que não pesa.
- Rejeição explicada pelo que pesou: "seu currículo atende à formação, mas havia candidatos com mais experiência na área"; "você foi bem na entrevista, mas a sua experiência na área ainda é pequena para a vaga (pediam 4 anos; você tem 1 ano)"; "seu histórico combina bastante com a vaga; foi a disputa"; e, quando melhorou, "Desde a última candidatura na área (2041), o currículo ficou mais forte: de "possível" para "compatível"".

### Entrevistas e processos
A entrevista contextual do FIX #2 continua (perguntas por tipo de vaga). O que mudou foi o **fim** (a explicação). Os processos seguem diferentes: entrevista (vaga privada), prova + teste físico + reserva (concurso), antiguidade + curso + TAF + vaga (farda), peneira em duas etapas (esporte), edital com parecer (arte, pós-doutorado), freguesia sem entrevista (por conta), abertura em etapas (negócio). **Promoção passou a ser marco da vida** (antes, só do nível 4 para cima).

### Formação → profissão; pós-graduação com identidade
- Degraus novos: nutricionista especialista (4) e coordenador de nutrição (5); dentista especialista; farmacêutico de laboratório; arquiteto coordenador de projetos; coordenador técnico de academia; **professor de faculdade** (mestrado, por seleção — LDB, art. 66) e coordenador de curso.
- Nova pós: **Especialização** (lato sensu, na área da graduação). Mestrado e doutorado dizem o que abrem.
- A bolsa de pós-doutorado também chega a quem trabalha fora da pesquisa (menos vezes), e agora **dá para pedir** (`bolsa_pesquisa`: edital anual, pesa o doutorado recente, a pesquisa feita, a tentativa anterior; a devolutiva diz o que faltou).

### Preparação (concurso, vestibular)
- Estudo **dirigido**: carreiras policiais e militares, prefeitura e tribunais, fiscal, bancos públicos, magistério, saúde pública, universidade. Estudo dirigido rende mais (×1,15) no edital da área; o geral rende o de sempre (nenhum save perde preparo); o dirigido para outra área rende menos (×0,65).
- A estrada conta: anos de farda no edital de polícia (até 18 meses equivalentes), Direito no de tribunal/delegado, Contábeis/Economia no fiscal etc., mais uma pequena folga no teto de quem traz estrada (as etapas que não são prova). Tudo dito: "Seus 13 anos de farda, hoje como cabo da PM, contam: a rotina e a matéria da prova não são novidade."
- Leitura por edital: **sem preparo / começando / em construção / competitivo / muito competitivo**, o que pesa (foco, estrada, matéria mais fraca, teste físico), a disputa ("é um dos editais mais disputados"), e **"Desde a última tentativa (2044), o preparo subiu de "em construção" para "competitivo""**. Reprovar no TAF agora deixa devolutiva.
- Vestibular: em Estudos, a nota do ENEM diante dos cursos que fazem sentido — "a nota alcança o corte / perto do corte (lista de espera) / ainda longe do corte (corte ~650)" — e se a nota subiu.

### Concursos e carreira militar
- Próximo passo com o tipo certo: "Idade · Mínima de 31 anos: cumprida" · "Tempo de corporação · 13 anos de corporação: cumprido" · "Tempo no posto · 7 anos como cabo da PM — você tem 6; completa em 2061" · "Vaga · Cumprido o tempo, a promoção vem com a vaga do quadro" → "Pela antiguidade, a promoção a sargento da PM deve vir por volta de 2061." Forças Armadas: tempo no posto, curso de aperfeiçoamento/altos estudos, teste físico, conceito, vaga.

### Esporte
- **Pedir um teste** num clube (o da cidade ou um grande, que exige mais), para quem treina a sério, dentro da janela da base (futebol 11–17; outros 12–19), com um ano entre testes e até 4 na vida; a técnica "começando" não gasta tentativa (o motivo é dito).
- Técnica em palavras: **começando / de escolinha / ainda longe do nível de uma base / perto do nível de uma base / no nível de uma base / acima do que uma base pede**, com o que o treino fez no ano e se faz sentido tentar agora.
- A devolutiva guarda a técnica: "De novo, a técnica ainda não está no nível da equipe… A técnica está "perto do nível de uma base". Desde a última peneira (2039), a técnica evoluiu: de "de escolinha" para "perto do nível de uma base"."

### Arte e carreiras especiais
- **Montar uma banda / um grupo** (antes, só se um amigo chamasse, com sorteio de 22%/ano).
- **Mandar o trabalho a produtores e festivais / fazer uma audição** (a "peneira" da arte): pesa público e técnica; o parecer diz qual faltou ("o público de Varanda ainda é pequeno para uma agenda profissional ("já tem quem vá ver")") e se cresceu desde a última vez; o sucesso é um convite (que ainda é escolha).
- "Outros caminhos": como começa cada vida — esporte, arte, universidade e pesquisa, Forças Armadas, polícia e bombeiros, serviço público, negócio, por conta, vida política — com o estado para esta vida (já é a sua vida / dá para começar / há o que fazer antes / fora do alcance agora) e o primeiro passo. **Não é um menu de carreiras**: cada passo é uma ação que já existia ou um pedido real (treinar, estudar, pedir o teste, montar o grupo, pedir a bolsa).

### Política (só o necessário)
- **Militar da ativa**: não se filia, mas pode ser escolhido em convenção. Ação "Conversar com partidos sobre uma indicação" → decisão "A indicação" → `partido` sem filiação (`indicacaoMilitar`). Sem os seis meses de filiação; no registro, o que o motor já fazia (menos de 10 anos: deixa a ativa; mais: agregado; eleito: inatividade). Fora da ativa, a indicação não vale mais: é preciso filiar-se (dito, com a ação). Troca de partido bloqueada para quem tem indicação.
  Fontes: CF, art. 14, §3º, V e §8º; art. 142, §3º, V; TSE, Temas Selecionados — Filiação partidária / Militares ("A filiação partidária contida no art. 14, § 3º, V, Constituição Federal não é exigível ao militar da ativa que pretenda concorrer a cargo eletivo, bastando o pedido de registro de candidatura após prévia escolha em convenção partidária (Res.-TSE nº 21.608/2004, art. 14, § 1º)"; e: a filiação é exigível do militar da reserva). <https://temasselecionados.tse.jus.br/temas-selecionados/filiacao-partidaria/militares/generalidades>, <https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm>.
- Frequência: convite a cada **8 anos** (eram 6), até **12%/ano** (eram 22%). Nenhuma regra eleitoral, partido ou cargo foi alterado; neutralidade mantida.

### Autônomo e empreendedorismo
- Variantes **de carteira**: confeiteiro de padaria, cabeleireiro de salão, manicure de salão, eletricista de manutenção, fotógrafo de estúdio. O por conta continua (freguesia, preço, MEI), agora com empregador "por conta própria"/"por encomenda" (nunca "uma empresa de instalações").
- O modelo é dito **antes**: na vaga ("vaga de emprego" / "por conta própria"), no botão ("Candidatar-se" / "Começar por conta própria"), no catálogo (o que cada modelo significa), na indicação ("— por conta própria (clientes seus, preço seu, sem patrão nem salário fixo)"), na porta ("Ir à entrevista" / "Começar por conta própria"). Negócio próprio fica em "Negócio próprio".
- Promoção não troca o modelo (teste sobre todas as 229 ocupações).

### Ambiente e acontecimentos de trabalho
Gatilhos agora pedem capacidades: "O erro" (chefia + colegas + organização + um trabalho que deixa rastro: escritório, balcão, obra, fábrica, estrada — com texto do lugar: o relatório, o caixa que não fechou, a parede refeita, o lote estragado, a entrega errada); "Na reunião" e "A discussão" (chefia, colegas, organização); "Corte" (carteira + organização + colegas); chefe novo, confraternização (organização + colegas); reconhecimento (chefia + organização); novato (colegas); curso pago pela empresa (organização); responsabilidade a mais (chefia + colegas + organização). Trabalho doméstico de carteira passou a ter empregador "uma família"/"uma casa de família": há patroa, não "a empresa".

## 6. Mudanças de UX

**Trabalho**
1. *A sua situação agora* — igual (onde, no bolso, jornada, vínculo, como vai).
2. **Próximo passo** — no lugar da frase: destino, "por volta de 2061", o resumo e a lista de requisitos com glifo **e** texto (✓ cumprido · ◷ em 2061 · ○ falta · … depois), o estado também em texto para leitor de tela.
3. *O que dá para fazer agora* — igual (ações vivas).
4. **O que você está construindo** (novo) — para cada intenção em andamento (chegar a uma base, passar num concurso, viver de música, carreira acadêmica): onde está, o progresso com direção (↗ → ↘ e a frase), o que falta, e o **botão do passo** (pedir o teste, montar a banda, mandar o material, pedir a bolsa, escolher a área, ver os editais).
5. *Em paralelo* — igual, sem repetir o estudo para concurso.
6. **Procurar outro caminho** (era "Outras possibilidades"): *Vagas e trabalho* em camadas (**Combina com a sua trajetória**, **Também ao seu alcance**, **Outros caminhos**, e o catálogo inteiro recolhido em "Explorar todas as ocupações"), cada vaga com o modelo, o porquê, o currículo (+/−) e o conflito; *Concursos* com a área do estudo (botões) e o preparo por edital; *Negócio próprio*; **Outros caminhos**.
7. *O que ficou das últimas tentativas* — as devolutivas agora dizem o nível e o que mudou.

**Estudos**: *Sua formação* (credenciais, com a área de cada pós) · *Os estudos agora* · **Preparação** (ENEM diante dos cursos, cursinho, estudo para concurso) · **Próximos caminhos** (com motivo: "O caminho da universidade: um mestrado em Nutrição abre a docência em faculdade e o doutorado") · *Explorar formações* (catálogo recolhível quando há sugestões). O curso em andamento aparece com a área.

**Visual** (`src/ui/caminhos.css`, `src/ui/jogo/Caminhos.tsx`): editorial + interativo — estado em serifa sem moldura; requisito como linha com glifo e rótulo pequeno; progresso começando pela direção; ação como botão com o porquê embaixo; fios finos, sem cartões com sombra, sem pílulas decorativas, sem emoji. Pessoas, Casa, Cidade e Linha da Vida não foram tocadas.

## 7. Resultados visuais

`scripts/playtest/gerarRework2.ts` + `rework2.mjs`: 13 cenários (cabo da PM na política, doutora em Nutrição procurando, doutora trabalhando de diarista, adolescente do vôlei, a peneira pedida aberta, concurseira, músico, confeiteira, dona de lanchonete, vestibulanda, mestrando, a entrevista aberta, sargento do Exército), **todas as 8 áreas**, em **320, 390, 820 e 1440**, com as quatro abas da procura e o catálogo inteiro abertos: **685 telas medidas, 0 problemas estruturais** (rolagem horizontal, botão fora da tela, alvo < 40 px, botão sem nome, "Viver mais um ano" cobrindo conteúdo, texto cortado). A única ocorrência da primeira rodada (o link "Ver em Trabalho", 32 px) foi corrigida.
- **Teclado**: Tab percorre Trabalho (40 paradas por tela, em 390 e 1440): foco sempre com contorno visível e dentro da tela.
- **Arquitetura conferida na tela** (1440): todos os elementos esperados presentes em todos os cenários (próximo passo com requisitos, "O que você está construindo", camadas, "Outros caminhos", militar com a indicação, a doutora com "Doutorado em Nutrição").
- **Cor não é o único sinal**: cinza e três daltonismos (deuteranopia, protanopia, tritanopia) em Trabalho e Estudos (cabo, vôlei, doutora) — glifos e textos carregam o estado.
- **Contraste**: `contraste.mjs` — todos os pares ≥ 4,5:1; as cores dos glifos novos (sucesso 10,9:1, aviso 8,9:1, ipê 11,4:1, texto apagado 7,6:1 sobre o fundo).
- Screenshots lidos por mim: cabo 390 e 1440 (Trabalho), doutora 390 (procura). Achados corrigidos: bloco duplicado do concurso em "Em paralelo"; "Idade · Idade mínima…" repetido; "Sem experiência, as portas são poucas" para uma doutora (agora "Sem estrada ainda — mas com o doutorado em Nutrição: as vagas da sua área vêm primeiro."); "professora de faculdade" caía em "Outros caminhos" para quem tem doutorado (agora na trajetória).

## 8. Estratégias intencionais (o teste mais importante)

`scripts/sim/intencoes.ts`: nove jogadores que **querem** uma vida e só usam o que o jogador pode fazer (`disponibilidade` → `executar`); nenhuma função interna concede carreira. **40 vidas por intenção, até 58 anos, o mesmo simulador na base (worktree em 955d5d4) e na branch.** Na base, as ações novas simplesmente não existem (medido como "não havia como pedir"). O jogador esportivo segue a orientação da tela (pede o teste com a técnica perto, ou no fim da janela); quem não quer política recusa o convite (o convite é medido).

| Intenção | descobriu | 1ª tentativa (idade) | tentativas (med.) | devolutiva com próximo passo | **progresso dito** | meio do caminho | chegou | política (entrou) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| emprego privado | 100 → 100% | 19 → 19 | 8 → 8 | 100% | **0 → 16%** | 100% | 100 → 100% | 0 → 0% |
| carreira acadêmica | 98 → 98% | **41 → 32** | 8 → 5 | 100% | **0 → 49%** | 93 → 95% | **70 → 95%** | 0 → 0% |
| concurso | 100% | 20 → 20 | 11 → 7 | 100% | **0 → 66%** | 100% | 98 → 100% | 0 → 0% |
| carreira militar | 95% | 20 → 20 | 5 → 6 | 100% | **0 → 50%** | 57 → 55% | 53 → 50% | 0 → 0% |
| esporte | **80 → 90%** | 16 → 16 | 2 → 3 | 100% | **0 → 18%** | 23 → 25% | 10 → 8% | 0 → 0% |
| arte | 100% | **21 → 17** | 3 → 9 | 100% | **0 → 80%** | 100% | 13 → 8% | 0 → 0% |
| empreendedorismo | 98% | 24 → 24 | 1 | 100% | 0 → 15% | 98% | 98 → 98% | 0 → 0% |
| por conta própria | 98% | 18 → 18 | 1 | — | — | 98% | 98 → 98% | 0 → 0% |
| política (comparação) | 100% | 22 → 22 | 14 | — | — | 98% | 98 → 98% (eleito) | — |

"Chegou": emprego privado = cargo de nível 4+; acadêmico = passou pela universidade/pesquisa (inclui bolsa de pós-doc de 2 anos); concurso = aprovado num dos editais-alvo; militar = carreira de praça/oficial ou PM; esporte = contrato profissional; arte = viver da arte (músico profissional, de orquestra, produtor, ator, bailarino, escritor, criador de conteúdo); negócio = abriu; por conta = trabalhou por conta; política = eleito. "Meio do caminho": entrou na base; entrou num grupo; concluiu o mestrado; entrou na farda; fez a prova; cargo de nível 3+.

Leituras honestas:
- **Todos os caminhos são perseguíveis**: nenhum "bloqueio sem motivo" em 360 vidas; toda devolutiva de fracasso traz o que trabalhar; a proporção que diz se melhorou foi de 0% para 15–80%.
- **Carreira acadêmica** é a maior mudança: na universidade/pesquisa aos 35 — **2 → 8** de 40; aos 50 — **11 → 16** de 40. A primeira tentativa real veio nove anos antes. (O "95%" conta quem passou por lá, inclusive uma bolsa de dois anos.)
- **Esporte e arte continuam raros no topo** (8% — dentro do ruído de 40 vidas diante de 10–13% na base): o contrato profissional e o convite para viver de arte seguem difíceis, como devem. O que mudou é que dá para **pedir** (teste; banda; mostrar o trabalho), saber a distância e ver o progresso. Aos 40, 2 de 40 vivem da arte nas duas versões.
- **Nenhum caminho absurdamente dominante**; convergências entre intenções aos 40 ≤ 0,33 (militar × esporte: os que não chegam caem no comércio, que é o fallback da estratégia).
- **Política**: convite a quem não queria política **21% → 16%** das vidas; ainda chega a ~50% dos servidores de carreira (uma vez em 35 anos) — ver §15.

Arquivos: `intencoes.md`, `intencoes.json` e três biografias por intenção (`bio_*.txt`) gravados em `SAIDA`.

## 9. Outras simulações e regressões

- `scripts/sim/fix4.ts` (150 vidas, varredura de coerência a cada ano): **0 incoerências**; 170 perguntas de conflito, 83 resgates consentidos (as classes do FIX #4 seguem cobertas).
- Determinismo por semente: suíte existente + teste novo com as ações `perseguir`.

## 10. Testes

- `src/motor/__tests__/rework.test.ts` (novo, 55): identidade da pós e migração v14→v15 (idempotente); estrada pela titulação; camadas (a doutora não vê diarista na trajetória; vê nutricionista e professora de faculdade); docência por seleção; degraus novos; rejeição pelo currículo; próximo passo da PM (idade ≠ formação; previsão = maior prazo); mérito; promoção como marco; ambiente (diarista, doméstica, escritório, dono); foco e estrada no concurso; leitura com "desde"; pedir teste (requisito, janela, intervalo, "começando"), peneira pedida (etapas, nível na devolutiva), progresso entre peneiras; montar banda; mostrar trabalho; bolsa; caminhos possíveis; militar (indicação sem filiação, fora da ativa volta a filiação); modelos de trabalho; promoção nunca cruza modelo (229 ocupações); empregador de quem é por conta; determinismo; **saves v14 reais** (4 novos, gerados pelo motor da base: doutora em Nutrição com "Mestrado"/"Doutorado" sem área, cabo da PM na política, vôlei reprovada pela técnica, mestrando) e dois saves antigos (v13, v12): migram, validam, vivem 3 anos sem `undefined`/`NaN`, exportam e importam.
- `src/ui/__tests__/rework.test.tsx` (novo, 7): próximo passo da PM na tela; camadas e modelo; construindo (acadêmica, vôlei com o botão); "Outros caminhos"; militar com a ação; formação com área; ENEM com o corte.
- Testes antigos ajustados só onde a mudança era intencional: versão do save (14 → 15); botão "Aceitar" → "Ir à entrevista"; retrospectiva que dependia de a semente 19 não ter outros filhos (premissa explicitada).

Total ao fim: **582 testes em 20 arquivos**, todos passando (baseline 520). `rework.test.ts` terminou com 55 testes (46 + 9 regressões da auditoria, §16).

## 11. Save e migração

`VERSAO_SAVE = 15`. `migrarV14`: cada especialização/mestrado/doutorado genérico recebe a área da formação anterior, em ordem cronológica (doutorado ← mestrado ← graduação) e o nome com a área; o curso em andamento ganha `area`. Idempotente; nada é apagado; a Linha da Vida não muda. Campos novos opcionais (`foco`, `mesesFoco`, `Devolutiva.nivel`, `indicacaoMilitar`, `Matricula.area`, fatos `tec_*`). Cadeia inteira v5→…→v15 conferida (todos os saves reais do repositório, v5 a v14, passam pela suíte). Import/export testados.

## 12. Bugs encontrados e corrigidos (cada um com regressão)

1. Idade chamada de formação no próximo passo (regex) → requisitos tipados.
2. Pós-graduação sem área → herança + migração.
3. Bolsa de pós-doutorado só para desempregado → também para quem trabalha (menos).
4. Militar da ativa sem caminho para candidatura (dead end) → indicação em convenção.
5. Evento corporativo para quem trabalha em casa de cliente → ambiente.
6. Promoção que trocava empregado por autônomo em silêncio → `degrausAcima` preserva o modelo.
7. Autônomo com empregador "uma empresa de instalações" → empregador por modelo.
8. Trabalho doméstico de carteira com empregador "uma empresa" → "uma família".
9. Estudo geral a 90% (primeira versão do foco) enfraquecia saves → geral a 100%, dirigido com bônus (achado pelo teste 20 da suíte antiga).
10. Professor de faculdade no nível 4 sem estrada violava "diploma não cria senioridade" → nível 3, coordenação no 4 (achado pelo teste 15/17).
11. Pedido de teste com técnica "começando" gastava a tentativa → bloqueado com motivo (achado pela simulação).
12. Textos da tela (ver §7).
13. Achados da auditoria independente (9, todos corrigidos): §16.

## 13. Limitações

- A área da pós é herdada da formação anterior: não há escolha de outra área no mestrado.
- O foco de estudo é uma direção por vez; não há plano de estudo por matéria.
- A arte profissional continua dependendo de público grande; o parecer não distingue estilos.
- Clubes grandes x regionais no teste pedido: só a diferença da concorrência da cidade; divisões seguem como antes.
- O ambiente de trabalho é derivado (não há "empregador" com atributos próprios).
- Política fora do mandato não entra nos compromissos de agenda (reuniões políticas × doutorado integral seguem só na semana).
- Métricas de 40 vidas por intenção: diferenças abaixo de ~8 pontos são ruído.

## 14. Pendências encontradas fora do escopo (não implementadas)

- **Semana**: a vida política fora do mandato (reuniões, comunidade) não é compromisso — um doutorado integral + emprego + política cabe "no limite" sem pergunta (é carga, não conflito). Decidir se política entra em `compromissos`.
- **Retrospectiva**: um teste dependia de a semente sortear uma família sem outros filhos (premissa explicitada; sem mudança no código da retrospectiva).
- **Lojas/patrimônio, Pessoas, Casa, Cidade, Linha da Vida**: não auditados neste rework.
- `dist/` não é versionado; o aviso do Vite sobre o tamanho do bundle (> 800 kB) segue.

## 15. Pontos que exigem decisão humana

1. **Frequência do convite político** para servidores de carreira: hoje ~metade recebe um convite em ~35 anos. É plausível (servidor de décadas é chamado), mas ainda é o caminho especial que mais "encontra" o jogador.
2. **Topo do esporte e da arte**: 8–13% de quem persegue com dedicação chega ao contrato/convite; 2 de 40 vivem da arte aos 40. Se o playtest humano sentir que é raro demais, o ajuste está em `peneira.avaliarPeneira` (limiar) e em `perseguir.mostrarTrabalho`/`arte.anoDoProjeto` (chance do convite).
3. **"Currículo maior que a vaga"** (−0,04) é realista, mas penaliza quem, com formação, precisa de qualquer trabalho.
4. **Militar da ativa candidato**: implementado conforme o TSE; o afastamento/agregação é o que o motor já fazia (anterior a este rework).
5. **Limite de 4 testes por modalidade** na vida.

## 16. Auditoria independente e rodada final

Um agente separado, sem acesso ao raciocínio da implementação, auditou só o
`git diff 955d5d4..HEAD -- src` tentando quebrar cada área: testes
temporários (apagados depois), ~150 vidas até a morte com ações aleatórias —
inclusive todas as `perseguir`, com valores inválidos —, 60 vidas empurradas
para esporte, doutorado e PM + política, e 1.042 renderizações de Trabalho e
Estudos em jsdom (40 vidas × idades de 10 a 80, clicando as abas). Nenhuma
exceção, nenhum `NaN`/`undefined`, `verificarCoerencia` limpa. Veredito: não
pronto, com 2 achados altos, 4 médios e 8 baixos. Todos reproduzidos e corrigidos na
causa, com regressão (`rework.test.ts`, bloco "achados da auditoria"):

| # | Achado | Correção |
| --- | --- | --- |
| H1 | A regra "promoção não cruza o modelo" deixou **11 carreiras de carteira sem degrau** (advogado júnior, médico, psicólogo, fisioterapeuta, veterinário, contador, agrônomo, técnico agrícola, operador de drone, auxiliar de marcenaria, costureira de confecção) — antes elas "subiam" para o título autônomo mantendo a carteira | degraus **de carteira**: advogado pleno, médico especialista do hospital (residência), psicólogo hospitalar, fisioterapeuta especialista, veterinário responsável técnico, coordenador contábil, agrônomo coordenador de campo, marceneiro de moveleira, costureira piloto. O caminho por conta segue nas vagas, escolhido |
| H2 | O próximo passo mirava o primeiro degrau (a promoção, o primeiro elegível) e pedia formação a quem sobe pelo ofício (`ouFormacao`) | mesmo degrau que `promover`; o ofício vale no lugar do diploma |
| M1 | A entrevista não somava a pós à estrada: "pediam 4 anos; você tem 4 anos" | `ctxEntrevista` soma `titulacaoNaTrilha` (nível ≤ 4), como `elegibilidade` |
| M2 | Depois de um "quase", dava para pedir outro teste no mesmo mês | relógio próprio do pedido (`peneira_pedida_*`) |
| M3 | Servidor cujo degrau acima é de empresa (professor concursado) ficava sem horizonte | a frase da tabela vale quando não há degrau **de servidor** |
| M4 | Por conta que começa por convite (músico profissional) ganhava empregador "uma empresa" | modelo pelo contrato no sorteio do empregador |
| L1 | "casa de repouso" lida como casa de família | regex exata |
| L2 | "Dá para prestar aluno soldado" para mulher | `nomeOcupacao` |
| L3 | "Aprovado" sem concordância no marco da bolsa | `flex` |
| L4 | PM/bombeiro com menos de 10 anos não deixava a ativa no registro da candidatura (o texto prometia) | `registrarCandidatura` usa o tempo de farda de PM/bombeiro também; a ficha das Forças só para quem está nas Forças |
| L5 | "A formação em Especialização em…"; vigilância privada contada como "farda" | artigo pelo nível; "segurança privada" quando a estrada é de vigilância |
| L6 | "formado em na área" (inalcançável hoje) | texto de reserva |
| L7 | Público que caiu dito como "segue" | "caiu: era X, agora Y" |
| L8 | Esporte mostrado um ano além da janela | a janela exata |
| (fora do diff) | "o residência médica", "a mBA" na frase de quem procura o primeiro trabalho (edição em andamento) | artigos próprios |

O que a auditoria confirmou que se sustenta: a cadeia de saves v5→v15 (inclusive
os v14 reais), `migrarV14` idempotente, herança de área com duas graduações e
com mestrado de outra área; `mesesFoco ≤ meses`; toda ocupação tem pelo menos
dois acontecimentos de trabalho elegíveis; a indicação militar e a filiação
depois da ativa; a cadência menor do convite; os nomes novos no feminino; o
doutorado chegando a nutricionista especialista.

**Rodada final** (depois das correções): typecheck limpo; build ok; **582/582**
testes; playtest visual do rework **686 telas, 0 problemas estruturais**, todos
os elementos da arquitetura presentes; simulação de intenções refeita (§8 —
números da rodada final); `scripts/sim/fix4.ts` 150 vidas, 0 incoerências.
