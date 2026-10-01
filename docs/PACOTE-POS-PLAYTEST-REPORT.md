# Pacote consolidado pós-playtest — integridade, carreiras vivas, relações, fama e memória

- Base: `0b5612e` (REWORK 3 + FIX pós-REWORK 3 + FIX 3.1 + hotfix da base)
- Branch: `claude/fix-pos-rework3-playtest`, sem merge em `main` e sem deploy
- Save: continua na **v18** (todos os campos novos são opcionais e validados)

## 1. Resumo executivo

O playtest real achou dois bugs de integridade (P0) e uma família de problemas de profundidade: o jogo **sabia** que alguém joga futebol, namora, estuda, é famoso, foi campeão — mas isso quase não **produzia vida**. Este pacote corrige os P0 na fonte e transforma sistemas que eram números em trajetórias com memória.

**P0, corrigidos na origem:**
- **A proposta aceita é a proposta executada.** O clube exibido e o clube executado vinham de dois sorteios diferentes. Agora a proposta é criada uma vez, persistida com clube, cidade, divisão, prazo e salário, exibida e executada exatamente (`esporte.criarProposta` → `transferirPara`). Vale para todas as mudanças de clube (mercado, empresário, renovação, liberação, volta de quem estava sem clube).
- **Carreira especial não recebe porta de emprego comum.** Nova fonte única, `mercados.ts`: cada trajetória pertence a um mercado (emprego, serviço público, esporte, arte, academia, negócio, autônomo, militar, política). O gerador consulta antes de criar, a virada do ano tira as portas que deixaram de caber (inclusive as de saves antigos) e a ação de aceitar recusa com o motivo.

**Profundidade nova (P1):**
- **Situações de carreira:** motor reutilizável (intenção → distribuição de desfechos pelo estado real → consequência → memória), com 24 modelos para futebol, medicina, academia, atuação, negócio/autônomo e emprego comum. Escolha não é resultado.
- **Palmarés do futebol:** títulos (protagonista × elenco), acessos, rebaixamentos, prêmios pela **posição**, marcos e histórico por clube, permanentes, na tela de carreira e na Linha da Vida.
- **Seleção nacional:** radar → convocação → estreia → titularidade → torneios → corte → capitania. O mérito esportivo decide; a fama não entra na conta.
- **Economia do futebol:** a causa da inflação era a nota medida contra uma barra fixa. Com a barra da concorrência real de cada divisão, a mediana da Série A cai de R$ 121 mil para R$ 86 mil, o p90 de R$ 450 mil para R$ 268 mil, e o extraordinário continua existindo (máximo R$ 1,87 mi).
- **Fama 2.0:** a notoriedade pública guarda a **origem** e sobrevive à troca de carreira. A política mostra o nome público e a presença política separados. A fama tem acontecimentos próprios e ações com resultado incerto. Luxo não cria fama, e o texto respeita quem já é famoso.
- **Relações 2.0:** a origem da relação vira contexto (o app abre a porta, o trabalho fecha um pouco, a infância traz história), o app tem fluxo próprio (match → conversa → encontro → química) e as fases da relação viram trajetória visível. A recusa diz o motivo quando ele é conhecível.
- **Atividades com história interna:** time da escola, olimpíada, projeto, ciências/robótica, reforço e xadrez têm etapas, papel e marcos, e alimentam a peneira, a bolsa e o instituto federal, as vagas de engenharia/TI e a liderança.
- **Ações genéricas são portas:** viagem (destino e duração, com preço pela origem), curso (domínio e instrumento), bancar projeto (gente e lugares desta vida) e presente (pessoa e presente).
- **Desenhos:** famílias visuais originais de veículos (7 carrocerias, 6 motos, 4 bicicletas) e de animais (sem rosto humano).

Validação: suíte completa com **37 arquivos e 825/825** (na rodada final, `interface.test.tsx` não subiu por timeout de inicialização do worker no WSL — o problema conhecido do ambiente; isolado, passou 14/14), typecheck limpo, build sem aviso de tamanho, smoke itch.io **18/18**, 18 capturas a 1440/820/390 px sem rolagem horizontal nem erro de página.

## 2. Causas-raiz encontradas

| Sintoma do playtest | Causa-raiz | Correção (fonte) |
| --- | --- | --- |
| "Proposta do Remo" → "Transferiu-se para o CRB" | A decisão mostrava `clubeProposto` (hash do ano + tamanho do id) e o "sim" executava `mudarDeClube` (outro hash). A proposta nunca existia como estado. | `CarreiraEsportiva.proposta` (persistida); toda troca de clube passa por `transferirPara(p)`. `mudarDeClube` removido. |
| Mesma classe de bug em outros caminhos | "Descer de divisão", "testar o mercado", "esperar clube maior", "ir para um menor", empréstimo e volta sem clube também sorteavam o clube na hora do sim. A volta sem clube assinava com o clube **da base** e escrevia "o primeiro contrato". | Todos criam a proposta concreta antes. A volta usa o clube da proposta, muda de cidade se preciso e escreve "Voltou a jogar". |
| Salário "se ganhar a posição" não cumprido | O texto prometia o salário de titular, mas nada atualizava o salário ao ganhar a vaga. | `clausulaTitular` no contrato; cumprida no ano em que a posição vem. |
| "Um concorrente quer você para a mesma função" no futebol profissional | O gerador de propostas de emprego só olhava `contrato === 'clt'`, e o jogador de futebol é CLT. | `mercados.mercadoDe`/`oportunidadeCoerente` em `novaOportunidade` (o ponto único de criação), na virada do ano e no aceitar. |
| "Você já trabalha nisso" numa proposta de mesma função (emprego comum) | A elegibilidade tratava a proposta de um concorrente como candidatura ao próprio cargo. | Via de entrada `proposta`; o novo empregador é sempre outro (`outroLugar`). |
| Série A: R$ 1,5 mi/mês "típico" | A nota da temporada media a técnica contra `70 + nível×3`, mas quem chega à Série A já tem técnica ~89. Quase todo jogador de Série A fechava "temporada de destaque" (nota mediana 7,8, 84% titulares), daí a reputação, a notoriedade (fama mediana 59) e o prêmio de estrela. | `barraDaDivisao` e `barraDeTitular` (fonte única) medem contra a concorrência de cada divisão; o nível do primeiro contrato e os limiares do mercado foram recalibrados juntos. |
| "Famoso" em Você, "pouco conhecido" na Política | A política tinha uma "reputação" própria que duplicava a notoriedade. Além disso, a fonte do nome era sobrescrita quando a carreira mudava (o ex-jogador virava "conhecido pela vida pública", com outra velocidade de esquecimento). | `Notoriedade.origens` (o pico por motivo) + `origemDoNome`; a política mostra o nome público (`leituraDoNome`, a mesma leitura de Você) e a presença política (`p.reputacao`) separados; a base partidária ganhou leitura e consequência. |
| "Relógio… Ninguém na rua sabe quem você é" para um famoso | Texto fixo. | `efeitoDoLuxo` pela notoriedade que existe. |
| App de namoro sem contexto | A busca pelo app criava alguém com interesse inicial **menor** que o de amigos. Não havia match, conversa nem encontro. A recusa era genérica. | `ContextoDaRelacao` (abertura por origem) entra no interesse da outra pessoa; fluxo próprio do app; motivos humanos (amizade, química, o que procura). |
| (descoberto na simulação) Conversa do app se dissolvia | O "interesse no ar" se dissolve em 24 meses sem atitude, e a conversa não renovava o prazo. Quem dava um passo por ano perdia a pessoa antes do encontro. | Cada passo do app renova o interesse; durante uma conversa, a busca nova espera (uma iniciativa de cada vez). |
| Atividades = "ocupar semana, ganhar atributo" | `anoDaAtividade` tinha um único "feito" sorteado por atividade. | `arcos.ts`: etapas, papel, marcos e consequências posteriores. |
| "Viagens e experiências" repetitivas | Seis botões que sorteavam o destino, o curso e o projeto. | Portas: a escolha concreta vem depois da categoria (`escolhasDaExperiencia`). |
| Grande clube "nas divisões de acesso" | O primeiro contrato era sempre com o clube da base, mesmo abaixo do porte dele. | `pisoDoClube`: quem não tem nível para o time de cima começa num clube do tamanho do próprio jogo (e a biografia diz isso). O rebaixamento respeita o piso. |
| (auditoria) Nome do palco/campo sumia ao trocar de trabalho | Cachê, salário de atleta, convites e renda de imagem liam `notoriedade.fonte` (o que alimenta agora). | `nomePor(v, fonte)` e `origemDoNome` nesses consumidores. |

## 3. Arquivos e sistemas

**Novos (motor):**
- `sistemas/mercados.ts`: a que mercado pertence uma trajetória, e quais portas cabem.
- `sistemas/palmares.ts`: palmarés, avaliação posicional, prêmios, acesso/rebaixamento, histórico por clube.
- `sistemas/selecao.ts`: a seleção nacional (`nacionalidadeEsportiva` é a costura para outros países).
- `sistemas/situacoes.ts`: o motor e os modelos de situações de carreira.
- `sistemas/visibilidade.ts`: usar o próprio nome (entrevista, causa, evento, publicidade, privacidade, projeto, política).
- `sistemas/relacoes.ts`: contexto de origem, fases, fluxo do app.
- `sistemas/arcos.ts`: histórias internas das atividades.
- `conteudo/situacoes.ts`: a decisão `car_situacao`.
- `conteudo/fama.ts`: acontecimentos da fama e a decisão de qual causa apoiar.

**Alterados (motor):** `tipos.ts`, `esporte.ts`, `conteudo/profissao.ts`, `oportunidades.ts`, `acoes.ts`, `trabalho.ts`, `notoriedade.ts`, `politica.ts`, `estilo.ts`, `experiencias.ts`, `interacoes.ts`, `busca.ts`, `romance.ts`, `social.ts`, `formacao.ts`, `rotinas.ts`, `audiovisual.ts`, `cena.ts`, `palco.ts`, `fechamento.ts`, `conteudo/integracao.ts`, `conteudo/catalogo.ts`, `ano.ts`, `save.ts`, `dados/clubes.ts`, `dados/lugares.ts`, `dados/bens.ts`.

**Interface:** `Trabalho.tsx` (A carreira no esporte, Momentos da carreira, painel político), `Voce.tsx` (O seu nome), `Tempo.tsx` (portas das experiências, estado da atividade), `Estudos.tsx` (história da atividade, portas coerentes), `Pessoas.tsx` (trajetória da relação), `Jogo.tsx`, `Casa.tsx`, `Lugares.tsx`, `Desenhos.tsx`, `Retrato.tsx`, `vida.css`.

**Build:** `vite.config.ts` ganhou o pacote `motor-carreira` (situações e visibilidade), sem ciclo. Todos os pacotes ficam abaixo de 800 kB.

## 4. Mudanças por bloco

### 4.1 P0 · Propostas de futebol

- `PropostaDeClube { id, clube, municipioId, nivel, meses, salario, salarioTitular, espaco, t, validaAte, origem }` em `caminhos.esporte.proposta`.
- `criarProposta` não sobrescreve uma proposta que ainda espera resposta: **B nunca altera A**.
- `esp_proposta` (decisão única para mercado, maior, menor, liberação):
  - mostra o clube, a cidade, a divisão, o prazo e a mudança;
  - a consequência mostra os números **da proposta**;
  - "aceitar" chama `aceitarProposta` → `transferirPara` → mudança para `p.municipioId`.
- Recusar quando o contrato já venceu não é "ficar": o clube decide se renova (por menos) ou a pessoa fica sem clube.
- Testes: A1 (gerar → salvar → recarregar → aceitar → clube, divisão, contrato, salário, empregador, cidade, Linha da Vida, nenhum outro clube na biografia → recarregar de novo), A2 (B não sobrescreve A; aceitar A; B surge depois e A continua vigente; recusar B não mexe em A), A3 (fluxo natural: a temporada gera a proposta e o clube aceito é o exibido) e A4 (volta de quem estava sem clube).

### 4.2 P0 · Mercados profissionais

- `mercadoDe(oc)` → `emprego | servico_publico | esporte | arte | academia | negocio | autonomo | militar | politica | rural`.
- `oportunidadeCoerente`:
  - as portas do emprego comum (proposta de concorrente, indicação, vaga, aprendiz, estágio, temporário, reinserção) não cabem em carreira de mercado próprio;
  - a proposta de concorrente só cabe no emprego comum.
- `oportunidadesAbertas` é a mesma lista para a tela e para o motor.
- Testes B1–B4: o jogador profissional nunca recebe porta comum em 40 anos de geração; a porta incoerente de um save antigo não aparece, não é aceita (com o motivo) e some na virada do ano; o emprego comum continua recebendo, e a mesma função deixa de esbarrar em "você já trabalha nisso"; atriz, pesquisadora e professora universitária também ficam fora.

### 4.3 Relações 2.0

- `Vinculo.contexto` (`via`, `abertura`, `busca`, `etapa`, `quimica`) e `Vinculo.fases`.
- Saves antigos derivam o contexto da `origem` que já existia. Nada é inventado.
- `pesoDoContexto` entra em `interesseDoOutro`, no mesmo ponto em que proximidade, confiança e história somam: app +8,4, trabalho −4. É contexto, não destino.
- **App:**
  - a busca produz um **match** (os dois deram like), com o que o perfil diz procurar;
  - `app_conversar`: segue ou some;
  - `app_encontro`: a química é oculta e nasce da afinidade, da apresentação, da sociabilidade, da cabeça e do dia. Daí sai saída, "talvez" (só um) com segundo encontro, amizade ou fim;
  - o convite genérico não atravessa o caminho do app;
  - durante uma conversa, a busca nova espera;
  - na exclusividade, quem queria algo casual pode gostar de você e dizer não.
- **Motivos ditos quando conhecíveis:**
  - "gosta muito de você — como amigo" (entre amigos de verdade);
  - "não houve química" (depois do encontro);
  - "não está procurando um relacionamento agora" (o perfil e a busca);
  - os que já existiam (compromisso, orientação, momento).
- **Trajetória:** as fases são registradas no romance, nas mudanças de amizade (inclusive reconciliação) e nas interações. A ficha da pessoa mostra "Conheceram-se pelo aplicativo (2041) → match → conversas → primeiro encontro → saindo juntos → namoro".
- Não é um roteiro: a outra pessoa continua com autonomia (interesse, química, momento, o que procura, orientação, compromisso).

### 4.4 Atividades com história interna

- `Vivencia.etapa`, `.papel`, `.marcos`. O motor `arcos.ts` tem um `ModeloDeArco` por atividade:
  - **time:** treinos → reserva/titular → destaque → capitão, e os jogos escolares (grupos, semifinal, vice, campeão);
  - **olimpíada:** preparação → escolar → regional → estadual → nacional (menção, bronze, prata, ouro, raros);
  - **projeto:** participante → responsável → desenvolvimento → apresentação → reconhecido;
  - **ciências/robótica:** membro → projeto → feira → competição → premiado;
  - **reforço:** dificuldade → acompanhamento → melhora ou estagnação → recuperação ou domínio;
  - **xadrez na escola:** treino → equipe → torneio → colocação.
- **Consequências posteriores reais:**
  - o destaque ou capitão do time aumenta a chance da peneira (×1,4);
  - a medalha marca `medalha_obmep` (bolsa, instituto federal) e `medalha_nacional` (seleção acadêmica);
  - a robótica premiada e a medalha contam em `vivenciaQuePesa` para engenharia, TI, dados, finanças e academia;
  - capitão e responsável exercitam a liderança.
- A arquitetura é genérica, pronta para universidade, clubes, hobbies, grupos artísticos, voluntariado e esporte amador.
- **Tela:** "Agora: titular · título nos jogos escolares" e o último marco na Formação e no Tempo livre; "O que ficou da formação" mostra o papel.

### 4.5 Ações genéricas são portas

- `Acao.experiencia` ganhou `escolha`. `escolhasDaExperiencia` monta as escolhas de cada porta:
  - **Viagem pelo Brasil:** 12 destinos × 3 durações; o preço vem da região de origem e de destino, da cidade pequena (trecho extra), da diária do destino, dos dias e da companhia;
  - **Viagem para fora:** 11 destinos por distância;
  - **Curso:** 10 domínios, com instrumento na música (violão, piano, bateria, canto);
  - **Bancar projeto:** o amigo próximo, o parente com o pequeno negócio, a escola onde estudou (na cidade natal), o cursinho popular, o grupo de cultura (se há arte) e a pesquisa (se há trajetória acadêmica). Bancar muda a vida da pessoa (renda, aperto resolvido) e o vínculo;
  - **Presente:** pessoa × presente (a reforma para os pais, a viagem, o carro, quitar a dívida de quem está apertado, a entrada do imóvel, os estudos de quem é jovem).
- **A viagem pode render:** alguém que fica na vida, com o contexto `viagem` (quem viaja sozinho conhece mais gente), ou um imprevisto contado depois.
- **Tela:** a categoria continua limpa; "Ver destinos" abre os grupos com o preço de cada escolha.

### 4.6 Situações de carreira

- **Motor:** `s = logística(Σ fatores)`; ótimo = s·risco, bom = s·(1−risco), ruim = (1−s)·(1−risco), péssimo = (1−s)·risco.
  - Os fatores vêm do estado real: técnica contra a divisão, leitura, fôlego (o minuto), cabeça, coragem, jeito com gente, disciplina, liderança, competência (desempenho e anos), clima com a chefia, produção acadêmica.
  - O risco da intenção espalha os desfechos para os extremos.
- **Contexto guardado:** `caminhos.situacao` guarda o minuto, o placar e o jogo; o texto não muda no reload.
- **Frequência por trajetória:** futebol 45%/ano, medicina 32%, cena 32%, academia 30%, negócio 30%, autônomo 25%, emprego 22%. Um mesmo modelo não volta em 3 anos, e há anos silenciosos.
- **Efeitos** (primitivas por trajetória):
  - nome na área: reputação no futebol, desempenho no emprego, freguesia/público na cena, reputação no negócio;
  - clima, cabeça, humor, notoriedade, imagem, confiança do treinador;
  - a estatística da temporada (a assistência entra na temporada);
  - dinheiro (caixa ou conta);
  - extras: a posição nova, a braçadeira no palmarés, a publicação, o financiamento.
- **Modelos:**
  - **futebol (9):** lance de construção, de ataque e de goleiro; outra posição; a pergunta difícil; a torcida; o garoto na sua vaga; a braçadeira; a reta final contra o rebaixamento;
  - **medicina (3):** o caso difícil, a família do paciente, o plantão que não acaba. Decisões dentro da competência; nenhuma conduta clínica é ensinada;
  - **academia (3):** os revisores, o orientando em crise, o edital;
  - **atuação (2):** a cena difícil, o conflito no set;
  - **negócio (2) e autônomo (1):** o cliente grande, o fornecedor que falhou, o cliente difícil;
  - **emprego comum (4):** o problema urgente, o crédito roubado, o erro seu, o projeto novo.
- **Memória:** os desfechos marcantes vão para a Linha da Vida; todos ficam em `caminhos.situacoes`, mostrados em Trabalho → "Momentos da carreira".

### 4.7 Futebol · palmarés, prêmios e legado

- `caminhos.palmares: ConquistaEsportiva[]` (fica depois da carreira) e `temporadas` até 30 (a carreira inteira).
- **Título:** protagonista (≥ 50% de titularidade) ou elenco.
  - Protagonista: Linha da Vida "Campeão da Série A com o São Paulo: 32 jogos, 28 como titular, 2 gols, 3 assistências, 68 desarmes." (marco na Série A/B).
  - Elenco: "como parte do elenco".
- **Acesso e rebaixamento:** o clube sobe ou cai, e o atleta junto, respeitando o teto e o piso do porte do clube. Entram no palmarés e na Linha da Vida.
- **Avaliação posicional** (`avaliarTemporada`): produção contra o que a posição produz por jogo.
  - volante: 0,7 desarme + 0,2 assistência + 0,1 gol;
  - zagueiro: desarme;
  - goleiro: jogos sem sofrer gol;
  - lateral: desarme e assistência;
  - meia: assistência e gol;
  - atacante: gol.
  - A participação e a colocação do time entram também.
- **Prêmios** (só a partir das divisões nacionais e só quando conquistados): seleção do campeonato (pela posição), melhor jogador (raríssimo), artilharia (um fato do placar) e revelação. Estar entre os elegíveis não é ganhar: as vagas são poucas (concorrência pela liga inteira).
- **Consequências:** reputação (com moderação: os bônus são pequenos para não inflar o mercado), notoriedade (seleção e conquistas recentes), seleção, mercado e contrato.
- **Marcos:** primeiro contrato, primeira temporada, primeira temporada como titular, estreia na elite, braçadeira.
- **Tela:** Trabalho → "A carreira no esporte", com resumo, títulos e acessos com o papel, prêmios, seleção, marcos e uma tabela por clube com a coluna da posição (desarmes, jogos sem sofrer gol). A seção continua lá depois que a carreira acaba.

### 4.8 Seleção nacional

- `olharDaSelecao` (0..100) usa a reputação, a avaliação da temporada, a divisão (a Série A pesa), a idade, a lesão, os prêmios recentes e a concorrência da posição. A **notoriedade não entra**.
- **Limiares:** radar 66, convocação 76, titular 84, com ruído de 3; perto da linha de corte, a convocação é disputa (chance que cresce com a margem).
- **Trajetória:**
  - convocações por ano e jogos (o titular joga; o reserva espera);
  - estreia, corte;
  - torneio mundial e torneio continental, nomes genéricos do universo do jogo;
  - campanha simulada (a da seleção, com pouco peso individual);
  - capitania.
- **Marcos** na Linha da Vida: primeira convocação, estreia, torneio, título, braçadeira. Todos entram no palmarés.
- **Costura América do Sul:** `nacionalidadeEsportiva(v)` é o único ponto que diz por qual seleção a pessoa joga.

### 4.9 Fama 2.0

| Dimensão | Fonte | Onde aparece |
| --- | --- | --- |
| Notoriedade pública | `notoriedade.valor` | Você, Política ("Para o público"), Trabalho |
| Origem do nome | `notoriedade.origens` → `origemDoNome` | "famoso pelo futebol", velocidade de esquecimento, renda de imagem, convites |
| Reputação profissional | `esporte.reputacao`, desempenho, freguesia, reputação do negócio | Trabalho |
| Imagem pública | `imagemPublica` (escândalo, fala que pegou mal, causa/entrevista boa, fase, estilo) | Você |
| Status material | `estilo` (luxo) | Você, imagem de quem já é conhecido |
| Capital político | `politica.reputacao` ("Como político") | Política |
| Base de apoio / base partidária | `politica.apoio` / `basePartidaria` (filiação, campanhas, mandatos, trocas) | Política; a cabeça de chapa precisa de lugar no partido |

- **Legado:** a carreira que acabou deixa um piso de nome proporcional ao que ficou registrado (jogos de seleção, braçadeira, títulos de seleção, títulos da elite como protagonista, prêmios; obras que marcaram). O campeão do mundo não volta a ser anônimo.
- **Eleição:**
  - o fator "nome" usa `max(presença política, notoriedade × 0,5)`: o eleitor reconhece o ex-jogador;
  - a base continua sendo outra conta;
  - o candidato que entra pela porta da notoriedade começa com presença 14 (antes, 38, que fingia ser reconhecimento);
  - a explicação da apuração diz "o nome que o público já conhece pelo futebol".
- **Fama vivida:** `fama_rua` (a foto na fila, conforme a origem), `fama_encontro` (o jantar interrompido), `fama_cobranca` (fase ruim), `fama_pedido` (pagar o tratamento, visitar, recusar) e `fama_boato` (desmentir, ignorar, processar, com resultado incerto).
- **Usar o nome** (`visibilidade`, em Você → "O seu nome"): entrevista, causa (porta: qual causa), evento, publicidade, privacidade, promover o projeto, levar o nome para a política.
  - Cada uso tem resultado incerto, depende da notoriedade, da origem, da imagem, da compatibilidade e do histórico, e pode dar errado.
  - Exemplos: "Jogador querendo ser político" (desgaste); oportunismo numa causa que não conversa com quem você é.
- **Luxo:** `efeitoDoLuxo` diz o que o luxo faz para quem já é famoso ("vira parte de como o público vê você, não do quanto ele conhece você") e mantém, para o anônimo, "Ninguém na rua passa a saber quem você é por causa disso". A notoriedade não muda.

### 4.10 Economia do futebol

Simulação F: 300 carreiras a partir do primeiro contrato, dos 17 aos 36. O "antes" é o mesmo script no commit-base, com 200 carreiras (`git worktree` temporário, removido no fim).

| métrica | antes | depois |
| --- | --- | --- |
| Série A: mediana do salário | R$ 121 mil | R$ 86 mil |
| Série A: p75 · p90 · p99 | R$ 199 mil · R$ 450 mil · R$ 1,52 mi | R$ 139 mil · R$ 268 mil · R$ 1,26 mi |
| Série A: máximo | R$ 1,59 mi | R$ 1,87 mi |
| Série A, titular de clube grande (mediana · p90) | R$ 177 mil · R$ 1,26 mi | R$ 165 mil · R$ 1,04 mi |
| Série A, reserva de clube tradicional (mediana) | R$ 58 mil | R$ 52 mil |
| Série B: mediana · p90 | R$ 20 mil · R$ 46 mil | R$ 23 mil · R$ 82 mil |
| Série A: nota da temporada (p25/med/p75) | 7,1 / 7,8 / 8,6 | 6,0 / 7,0 / 7,8 |
| Série A: titulares | 84% | 42% |
| Série A: anos com reputação ≥ 78 | 33% | 12% |
| Pico de salário de quem chegou à Série A (mediana · p90) | R$ 145 mil · R$ 517 mil | R$ 105 mil · R$ 297 mil |
| Notoriedade máxima ≥ 55 (famoso) | 55% | 18% |
| Anos como profissional (mediana) | 17 | 16 |
| Títulos (média, % com algum) | — | 0,66 (46%) |
| Prêmios (média, % com algum) | — | 0,74 (35%) |
| Convocados para a seleção | — | 8% |

- Distribuição por reputação, depois: Série A com nome 50–64 tem mediana de R$ 76 mil; com nome 78+, mediana de R$ 482 mil e p90 de R$ 1,24 mi. O salário de estrela continua existindo e passa a ser de poucos.
- **Não há teto arbitrário.** A correção é a barra da divisão: a nota de quem chega à Série A passa a ser medida contra quem joga na Série A. O nível do primeiro contrato e os limiares do mercado foram recalibrados junto, para o jogador médio de cada divisão ficar nela.
- **Achado intermediário:** a primeira versão da barra derrubou a mediana de anos de carreira para 1. Havia três causas misturadas:
  - o agente do simulador não aceitava a volta nem preferia "descer";
  - o nível do primeiro contrato ainda era da escala antiga;
  - os limiares de mercado ainda eram da escala antiga.
  Os três foram corrigidos e a carreira voltou a 16 anos de mediana.

## 5. Testes adicionados

- `src/motor/__tests__/pacotePlaytest.test.ts`: 22 casos. Cobre os testes causais A–J pedidos, mais as portas das experiências e o save antigo sem os campos novos.
- `src/ui/__tests__/pacotePlaytest.test.tsx`: 5 casos:
  - Trabalho com palmarés, histórico por clube e nenhuma porta de concorrente;
  - a decisão mostra o clube que será executado;
  - Você × Política com o mesmo nome público, a presença à parte e o uso da visibilidade;
  - Tempo livre com a viagem como porta;
  - Pessoas com o match levando a "conversar" e a trajetória visível.
- `src/ui/__tests__/desenhos.test.tsx`: famílias de veículos e animais distinguíveis.
- **Teste existente ajustado por mudança intencional:** `rework2.test.ts` (busca ativa). Depois do match, o próximo passo é `app_conversar`, não o `convidar` genérico. A regra testada (procurar é escolha; o interesse é da outra pessoa; quem aparece fica e persiste no save) continua a mesma.

## 6. Testes causais

| Teste | O que atravessa |
| --- | --- |
| A · transferência | proposta → persistência → decisão → save/reload → aceitar → clube, cidade, divisão, prazo, salário, empregador, Linha da Vida → reload; B não altera A; fluxo natural; volta sem clube |
| B · carreira especial | geração de 40 anos sem porta comum; save antigo com porta incoerente: invisível, recusada com motivo e removida; emprego comum preservado; arte e academia |
| C · atividade | time: entrar → permanecer → etapas → marcos → peneira mais provável (estatístico, 120 sementes) → reload; olimpíada: fases, medalha não garantida, peso no instituto federal; robótica até a competição → peso em engenharia |
| D · romance | app: match → conversa → encontro (química guardada) → evolui ou acaba (as duas coisas acontecem em 60 sementes), sem convite genérico no caminho, persistência; a origem muda a abertura (app > trabalho) |
| E · título | protagonista → palmarés → leitura de carreira → Linha da Vida → reload; reserva campeão = elenco, sem prêmio |
| F · posição | volante desarmador > volante artilheiro com a mesma nota; atacante sem gol < volante desarmador |
| G · fama | famoso → aposenta → decai devagar → origem "esporte" persiste → política: "famoso pelo futebol", "estreante na política", apoio e base partidária próprios, fator nome pela notoriedade → reload |
| H · luxo | famoso compra relógio → notoriedade igual, texto sem "ninguém sabe quem você é"; anônimo continua anônimo |
| I · situação | o estado muda a distribuição; arriscar espalha mais que jogar simples; a mesma intenção dá desfechos diferentes; decisão completa com reload no meio; registro persiste; emprego comum tem situações, e não todo ano |
| J · save/load | proposta, seleção, palmarés, situação aberta, momentos, origens do nome, contexto e fases da relação, história da atividade: tudo volta igual; save v18 sem os campos novos continua válido |

## 7. Simulações (`scripts/sim/pacotePlaytest.ts`)

`npx esbuild scripts/sim/pacotePlaytest.ts --bundle --platform=node --outfile=/tmp/pp.cjs && VIDAS=120 SO=F,P,R,A,N,C node /tmp/pp.cjs`

**F · Economia e palmarés do futebol:** ver a seção 4.10.

**P · Progressão natural (perseguição deliberada desde os 7, 120 vidas, até os 34):**

| métrica | antes (mesmo agente, commit-base) | depois |
| --- | --- | --- |
| chegou a uma base | 82% | 81% |
| profissional | 56% | 59% |
| pico de salário (mediana, pros) | R$ 468 mil | R$ 199 mil |
| notoriedade pico ≥ 55 | 81% | 56% |
| títulos / prêmios por carreira | — | 0,87 / 2,38 (antes da concorrência pelas vagas de prêmio: 1,03 / 6,28) |
| convocados | — | 49% |
| momentos de carreira (média) | — | 1,6 |

A taxa alta de profissionalização já existia com este agente: ele aceita toda peneira, todo convite e todo contrato, e treina fundamentos todo ano. A diferença para o FIX 3.1 (13% base, 5% pro) vem do agente: o de lá não tinha a preferência "ir" na decisão do convite da base. Ver pendências.

**R · Relações (120 vidas adultas, 18 → 45):**

| métrica | antes | depois |
| --- | --- | --- |
| app: matches → conversas → encontros → saindo | não existia (8 relações vindas do app começaram a sair, 4 chegaram a namoro) | 39 → 23 (59%) → 20 → 14 (70% dos encontros); 6 sem química depois do encontro; 13 sumiram antes do encontro |
| app: começaram a sair → namoro | 8 → 4 | 14 → 12 |
| namoros por vida (mediana) | 1 | 1 |
| separações por vida (média) | 0,94 | 0,90 |
| amigos aos 45 (mediana) | 3 | 4 |
| vidas com reconciliação registrada | 0% | 0% (as fases só existem daqui para frente; a reconciliação de amizade é rara nas vidas simuladas) |

**A · Atividades (150 vidas, 9 → 18; uma atividade por vida):**

| atividade | vidas | onde a história parou (a etapa final) | com um "feito" |
| --- | --- | --- | --- |
| time_escola | 24 | reserva 18 · titular 4 · destaque 2 | 11 |
| olimpiada | 25 | escolar 7 · regional 7 · preparacao 6 · estadual 5 | 12 |
| clube_ciencias | 25 | projeto 11 · membro 7 · feira 5 · competicao 2 | 0 |
| projeto_escola | 24 | apresentacao 13 · desenvolvimento 4 · responsavel 3 · participante 3 · reconhecido 1 | 14 |
| reforco | 24 | melhora 8 · acompanhamento 7 · estagnacao 5 · dificuldade 3 · recuperacao 1 | 11 |
| xadrez | 25 | torneio 11 · treino 8 · equipe 6 | 4 |

Com pelo menos um marco na história: 62% das que entraram.

- **Time da escola:** quem não treina futebol fica, quase sempre, na reserva. Por isso a maioria para em "reserva".
- **Olimpíada:** a fase nacional é rara e a medalha é para poucos.
- **Robótica:** a competição é alcançável; o prêmio é raro.

**N · Fama através das fases (45 atletas de nome, aposentando aos 34, até os 46):**
- **Decaimento da notoriedade (mediana):** 80 ao parar, 67 dois anos depois, 51 depois de cinco e 35 depois de dez.
- **Na política, depois da porta da notoriedade e sem fazer política:** apoio mediano 0.
- **Leitura típica:** "Para o público: famoso pelo futebol | Como político: estreante na política".

**C · Situações de carreira (120 vidas adultas, 25 → 45):**

| trajetória | anos | momentos | por década | ótimo/bom/ruim/péssimo |
| --- | --- | --- | --- | --- |
| emprego | 1169 | 150 | 1,3 | 27/48/46/29 |
| medicina | 397 | 74 | 1,9 | 15/30/18/11 |
| academia | 400 | 91 | 2,3 | 26/30/18/17 |
| cena | 380 | 84 | 2,2 | 21/21/22/20 |

No futebol (simulação P), a média é de 1,6 momentos por carreira profissional. Em todas as trajetórias há anos silenciosos, e os desfechos se distribuem dos dois lados.

## 8. Métricas antes/depois

Estão nas seções 4.10 e 7. Notas de método:
- os "antes" usam o mesmo script e o mesmo agente no commit-base;
- o simulador de relações ganhou o fluxo do app, que não existia antes, por isso a linha do app no "antes" é "não existia".

## 9. Compatibilidade com o save v18

- **A versão não sobe.** Todos os campos novos são opcionais:
  - `esporte.proposta`, `esporte.clausulaTitular`, `esporte.selecao`;
  - `caminhos.palmares`, `caminhos.situacao`, `caminhos.situacoes`;
  - `notoriedade.origens`;
  - `vinculo.contexto`, `vinculo.fases`;
  - `vivencia.etapa`, `vivencia.papel`, `vivencia.marcos`.
- `validar` checa a forma de cada campo quando ele existe. Os saves antigos não têm os campos e continuam válidos (teste J2).
- **Derivados, sem inventar passado:**
  - contexto da relação: a partir da `origem`;
  - origem do nome: a partir de `fonte` e `pico`;
  - porta incoerente de um save antigo: some na virada do ano e já não é exibida nem aceita;
  - decisão `esp_proposta` aberta num save antigo, sem `proposta` persistida: a decisão deixa de ser exibida (o `quando` exige a proposta) e o fato do ano expira.
- `TipoVivencia` ganhou `'xadrez'` (aditivo).
- `FormaVeiculo` ganhou `suv_medio`, `suv_grande` e `cub` (a forma é derivada do catálogo e nunca é salva).

## 10. Decisões arquiteturais

1. **Proposta como estado, não como texto.** Nada que o jogador aceita é recalculado depois do "sim".
2. **Mercado como fonte única de portas.** O filtro mora em `novaOportunidade` (o ponto de criação), não na tela. A tela só lê `oportunidadesAbertas`.
3. **Barra relativa da divisão** em vez de teto de salário: a inflação era de avaliação, não de pagamento.
4. **Situações de carreira como modelos com dados** (contexto sorteado e guardado, intenções com risco e fatores, desfechos com primitivas de efeito). Um motor só serve todas as trajetórias, e a profundidade varia por carreira.
5. **Notoriedade com origem** (`origens`) em vez de uma fama por carreira. A presença política é outra dimensão, e o nome público entra na eleição só como reconhecimento.
6. **Contexto de relação derivável.** Saves antigos não precisam de migração.
7. **Arcos de atividade no mesmo registro de vivência:** o que a formação deixava continua sendo o lugar das consequências.
8. **Portas com escolhas montadas pela vida** (`escolhasDaExperiencia`), não um catálogo fixo.
9. **Pacote `motor-carreira`** para manter todos os pacotes abaixo de 800 kB sem ciclo.
10. **Nada de hardcode novo do Brasil onde havia como evitar:**
    - a seleção tem a costura `nacionalidadeEsportiva`;
    - os torneios de seleções têm nomes genéricos;
    - os mercados não citam leis;
    - o que ficou brasileiro (destinos de viagem, clubes, "Série A") está listado no mapa abaixo.

## 11. PENDÊNCIAS ENCONTRADAS

1. **Progressão base → profissional sob perseguição deliberada:** 82% chegam à base e 56–59% viram profissionais. Já era assim no commit-base com o mesmo agente. O treino de fundamentos anual, somado à aceitação automática, satura a técnica (95+ aos 20). Vale calibrar o crescimento da técnica de quem treina tudo na simulação oficial de 1.000 vidas. Os prêmios e a seleção nessa população também ficam altos (0,87 / 2,38 · 49%), pela técnica saturada, não pelo critério de prêmio.
2. **Empréstimo de verdade** (com volta ao clube de origem) não foi modelado. O que existe é a **liberação** (a proposta de um clube menor, que o jogador aceita ou não).
3. **Renda de imagem depois da aposentadoria:** agora segue a origem do nome (o ex-jogador ainda faz publicidade enquanto é conhecido). Vale olhar o valor na simulação de 1.000 vidas.
4. **Reconciliação de amizade:** a fase é registrada, mas é rara nas vidas simuladas. Pode faltar um gesto de reaproximação mais acessível para quem se afastou.
5. **Situações de carreira:** os modelos de militar, política (mandato), rural e esporte não futebol (vôlei, basquete, tênis) não foram escritos. A arquitetura comporta.
6. **Arcos de atividade:** universidade (atlética, centro acadêmico, extensão), voluntariado, grupos artísticos e esporte amador ainda usam o "feito" antigo. A arquitetura comporta.
7. **Seleção** só no futebol. Basquete e vôlei podem usar o mesmo `olharDaSelecao`, com outra concorrência.
8. **Viagens:** o destino é escolha; a cidade de destino não vira residência (emigração) e não há viagem para visitar alguém da vida. A lista de destinos é brasileira (ver mapa).
9. **A decisão `esp_proposta` de um save salvo exatamente no meio dela** (antes do pacote) deixa de ser exibida. O jogador perde aquela proposta específica (a do texto antigo, que de qualquer jeito não era a que seria executada). Preferi não executar um clube inventado.
10. **Seções novas da tela:** cobertas por testes de interface. As capturas responsivas estão na seção de validação; o desenho fino (espaçamento da tabela por clube no celular) pode pedir um ajuste visual depois do playtest.

## 12. O que NÃO foi implementado (de propósito)

- A expansão para a América do Sul (só a auditoria, abaixo).
- A simulação oficial de 1.000 vidas (só as dirigidas).
- Transferência para o exterior e mercado internacional de jogadores.
- Novas carreiras: os modelos de situação cobrem as trajetórias existentes; nenhuma profissão nova.
- Score técnico de química ou de interesse na tela (continua oculto, como pedido).
- Botão "tentar a seleção" ou "usar fama → ganhar apoio" (não existem por desenho).

## 13. Validação

- **Suíte completa:** 37 arquivos, **825/825**. Na rodada final, `interface.test.tsx` não subiu por timeout de inicialização do worker (o problema conhecido de WSL em /mnt/c); os outros 36 arquivos passaram (811/811), e ele, isolado, passou 14/14. Rodada anterior, com os 37 arquivos juntos: 825/825.
- **Node:** os testes de interface pedem Node 22 (`~/.nvm/versions/node/v22.23.2`); o Node 20 padrão do ambiente não sobe o jsdom.
- **Typecheck:** `tsc --noEmit` limpo.
- **Build:** `npm run build:itch` limpo, sem aviso de tamanho (`motor` 788 kB, `motor-conteudo` 766 kB, `motor-carreira` 49 kB).
- **Smoke itch.io:** 18/18.
- **Capturas** (`scripts/playtest/gerarPacotePlaytest.ts` + `pacotePlaytest.mjs`): volante campeão (Trabalho), ex-jogador na política (Você e Trabalho), viajante (Tempo livre com a porta aberta), estudante (Formação) e o match do app (Pessoas), a 1440, 820 e 390 px. São 18 capturas, sem rolagem horizontal e sem erro de página.
- **Conferência visual:** "famoso pelo futebol" igual em Você e na Política, com "estreante na política" ao lado; tabela por clube legível em 390 px; a porta da viagem aberta é longa no celular, mas fica dentro da própria seção.

---

## AMÉRICA DO SUL — MAPA DE ACOPLAMENTOS AO BRASIL


Auditoria somente leitura de `/mnt/c/Daniel/vida-game` (branch `claude/fix-pos-rework3-playtest`, HEAD `0b5612e`).
Objetivo: mapear onde o código presume Brasil, para que "nascer em outro país gere outra vida, não a mesma vida brasileira com outro endereço".

**Classificação:** **A** já parametrizado (dado por lugar, fácil de estender) · **B** parcialmente parametrizado · **C** Brasil-hardcoded · **D** exige pesquisa factual por país antes de implementar (pode somar-se a B/C).

## 0. Diagnóstico em uma página

- **Não existe a entidade País.** `Vida` tem `municipioNatal` (`tipos.ts:1759`) e uma única `economia: Economia` (`tipos.ts:1812`). Não há `pais`, `nacionalidade`, `moeda` nem `idioma` em nenhum tipo. O "país" está implícito em constantes de módulo.
- **O eixo geográfico é `Municipio { uf, regiao, perfil }`** (`dados/lugares.ts:22`). Há 118 municípios, todos brasileiros. `Regiao` é uma união literal das 5 macrorregiões do IBGE (`tipos.ts:16`). A boa notícia: o **perfil urbano** (`metropole/metropolitana/capital/polo/pequena`) é um conceito universal e já é o que mais pesa em custo, salário, oferta de ensino, mercado e transporte. É a melhor costura que já existe.
- **O dinheiro é "reais de 2026"**, uma unidade de poder de compra (`sistemas/economia.ts:4-17`, `renda.ts:4`). Todos os preços do catálogo (imóveis, veículos, cursos, cachês, multas) são números absolutos nessa unidade. A formatação `R$` está espalhada: são 4 formatadores centrais e mais de 40 interpolações inline.
- **As regras institucionais são constantes brasileiras.** CLT/INSS/IR/FGTS/MEI/BPC (`renda.ts`, `trabalho.ts`), ENEM/SISU/ProUni/FIES/cotas/IF (`escola.ts`), TSE/cargos/calendário eleitoral (`politica.ts`), três Forças com leis citadas (`forcas.ts`), CRM/OAB/CREA (`ocupacoes.ts`, com 58 `fundamento:` e 33 citações de lei), ECA (`justica.ts`), SUS (`integracao.ts`), Detran/CNH (`autoescola.ts`).
- **O conteúdo narrativo** tem 330 eventos em `src/motor/conteudo`. A maioria é universal (família, amizade, trabalho). Uma parcela visível é brasileira: Copa "o Brasil ganhou", São João, Carnaval, Aparecida, Pix, SUS, UPA, festa junina, "faculdade federal".
- **Testes:** 30 arquivos de teste (motor + UI) referenciam ids como `sao-paulo-sp`. Há também ~19 `toLocaleString('pt-BR')` diretos. Uma refatoração precisa manter o Brasil como país padrão byte-a-byte, porque o determinismo dos saves e dos testes depende disso.

## 1. Pessoa / nascimento

| Onde | Acoplamento | Class. |
|---|---|---|
| `criacao.ts:28` `OpcoesCriacao` | Recebe só `municipioId`. Não há país, idioma nem nacionalidade. | C |
| `criacao.ts:53-58` `sortearClasse` | Os pesos de classe usam `regiao === 'Nordeste' \|\| 'Norte'` e o perfil. A distribuição de pobreza é a brasileira. | B (o perfil é universal; a região é BR) |
| `criacao.ts:39` `ROTULO_CLASSE` | As 5 classes são genéricas. | A |
| `criacao.ts:64-76` | Arranjo familiar e idade materna por classe, calibrados para o Brasil. | B/D |
| `criacao.ts:204` | O pai ausente vai para `'sao-paulo-sp'` (destino migratório hardcoded). | C |
| `criacao.ts:120` `ano ?? 2026` / `versao: 18` | O ano-base é comum a todos. Ok. | A |
| `tipos.ts:49` `Pessoa.municipioId` | Os NPCs já têm lugar. Falta nacionalidade (um parceiro estrangeiro, um avô imigrante). | B |
| `sistemas/origem.ts:118-128` `bairroDeOrigem` | "comunidade no morro", "conjunto habitacional da periferia" são imagens urbanas brasileiras. Equivalentes: villa miseria, cantegril, barrio de invasión, pueblo joven, ranchos. | C + D |
| `sistemas/pessoa.ts`, `personalidade.ts` | Predisposições e personalidade. | A |

## 2. Localização (municípios, UF, regiões, capitais)

| Onde | Acoplamento | Class. |
|---|---|---|
| `dados/lugares.ts:22` `Municipio.uf: string` | O campo se chama `uf` e é sempre a sigla BR. A UI mostra `${nome}, ${uf}`. | B (o formato serve para provincia/departamento/región) |
| `dados/lugares.ts:33-46` `REGIAO_UF`, `NOMES_UF` | Tabelas fixas das 27 UFs. | C |
| `tipos.ts:16` `type Regiao = 'Norte' \| … \| 'Sul'` | É uma união literal, então o compilador recusa regiões de outros países. | C |
| `dados/lugares.ts:52-87` `LINHAS` | 118 cidades BR, no formato `[nome, uf, perfil, capital?, metrópole?]`. O formato é ótimo e o conteúdo é todo BR. | A (formato) / D (dados por país) |
| `dados/lugares.ts:120-149` `PERFIL`, `REGIAO`, `economiaLocal` | Custo/salário/aluguel por perfil × região. Tem um caso especial `brasilia-df ×1.12`. O aluguel base (2100…650) está em reais. | B |
| `dados/lugares.ts:104` `municipio(id)` | Lookup global, sem país. Os ids `slug-uf` podem colidir entre países (ex.: `santa-cruz-…`, `san-jose-…`). | B |
| `dados/lugares.ts:169` `sortearMunicipio` | Sorteia entre todos os municípios. Precisa ser feito dentro do país. | B |
| `dados/lugares.ts:182-188` `LITORAL`, `pertoDaAgua` | Lista de UFs litorâneas e exceções por id. | C |
| `conteudo/primeiros.ts:12` | Outra lista de UFs litorâneas, duplicada. | C |
| `sistemas/escola.ts:496-507` `capitalDoEstado` / `CAPITAIS` | Tabela UF→capital, que duplica `Municipio.capital`. | C (redundante) |
| `save.ts:1000-1001` | Migração de save com fallback `'sao-paulo-sp'`. | C (é aceitável se o Brasil for o padrão) |
| `conteudo/vinculos.ts:254-255`, `adulto.ts:468`, `profissao.ts:57,596-604`, `trajetorias.ts:240`, `usos.ts:50`, `processos.ts:194` | Destinos de mudança e transferência pela mesma região/UF, com bônus para `sao-paulo-sp`. A mudança "outro estado" custa 6500. | B |
| `conteudo/infancia.ts:309` | Amigo que se muda para uma lista fixa de capitais BR. | C |
| `dados/mercado.ts:21-50` `forcaDoSetor` | Agro/indústria por `regiao` BR. Tem caso `manaus-am` (Zona Franca). Tecnologia, criativo e público usam só o perfil. | B |
| `sistemas/rural.ts:37,41` | Safra por UF; cultura por região BR (lavoura/leite/misto). | B + D |
| `sistemas/corpo.ts:68-71` | Dengue por região BR. | B + D |
| `sistemas/pets.ts:76` | `regiaoDe` para pets. | B |
| `ui/telas/Criacao.tsx:36-54,115-126`, `ui/jogo/Cidade.tsx:49-61` | Seletor "Estado" → "Cidade" usando `NOMES_UF`. O texto diz "no {regiao}". | C (UI) |

## 3. Economia / moeda

| Onde | Acoplamento | Class. |
|---|---|---|
| `sistemas/economia.ts:33-60` `ANO_BASE`, `FASE`, `economiaInicial` | Fases com inflação de 4–7,5% e juro real de 1–9%: o perfil brasileiro. A semente é por vida, não por país. A Argentina e a Venezuela (inflação crônica/hiper), o Equador (dolarizado, sem política monetária) e o Panamá (fora do escopo) pedem outros regimes. | B + D |
| `tipos.ts:818-830`, `economia.ts:4-17` | A unidade é "reais de hoje". O conceito "poder de compra constante" é exportável se a unidade virar "moeda local de 2026" ou uma unidade interna com câmbio por país. | B |
| `sistemas/renda.ts:13-15` `SALARIO_MINIMO=1620`, `TETO_INSS`, `CUSTO_FACULTATIVO` | São constantes de módulo, importadas por carreira, dinheiro, escola, esporte, negocio, pausa, rural, trabalho, acoes, biografia e sistemicos (~30 usos). | C + D |
| `renda.ts:18-38` `inss`, `irpf`, `liquido` | INSS progressivo e IR com isenção até R$ 5.000 (regra 2026). O MEI desconta 7%. | C + D |
| `renda.ts:41,52` `contribui`, `mesesPagos` | Os 13,33 salários (13º + 1/3 de férias) são do Brasil. Há aguinaldo em vários países, com outras regras. | C + D |
| `renda.ts:44-50` `salarioLocal` | Piso = salário mínimo para CLT integral. A mecânica é boa. | B |
| `dados/ocupacoes.ts` (245 ocupações) | `salario` em reais de 2026 × `economiaLocal`. A escala relativa entre ocupações difere por país (ex.: o médico no Brasil vs. na Venezuela). | B + D |
| `dados/bens.ts:73-87,128-200,253-262` | Preços de veículos (marcas/modelos vendidos no Brasil: Fiat Mobi, HB20, Onix, Caloi), imóveis, condomínio e `taxaAnual` (IPVA + seguro). | C + D |
| `dados/investimentos.ts` | Sete produtos genéricos, sem marcas (poupança, pós-fixado, título de inflação, FII). | A/B (FII e Tesouro IPCA têm sabor BR; o conceito é genérico) |
| `acoes.ts:417` | Limite do MEI "R$ 81 mil por ano" (`e.salario > 6750`). | C |
| `acoes.ts:406,562,581`, `sistemas/imoveis.ts`, `dinheiro.ts` | Financiamento imobiliário/veicular com juros fixos. A existência e o acesso a crédito hipotecário variam muito por país. | B + D |
| `tipos.ts:660` `TipoDivida` inclui `'fies'` | Dívida estudantil brasileira tipada. | C |
| `sistemas/dinheiro.ts:117` | BPC como fonte de renda. | C |
| `conteudo/adulto.ts:171,355`, `independencia.ts:41` | Pix (golpe, "Pix para a mãe"). | C (texto) |

## 4. Educação

| Onde | Acoplamento | Class. |
|---|---|---|
| `sistemas/escola.ts:1-11, 42-69` | Etapas creche/pré/fundamental I-II/médio, rótulos "1ª série do ensino médio", EJA/supletivo (`:179-258`). Argentina (primaria/secundaria por província), Chile (básica 8 + media 4), Colômbia (primaria 5 + secundaria 4 + media 2), Peru etc. têm outras durações. | C + D |
| `escola.ts:261-332` `AREAS_ENEM`, `notasEnem`, `fazerEnem`, `podeFazerEnem` | Prova nacional única de 4 áreas, nota ~0-1000. Equivalentes que existem ou não: Saber 11 (CO), PAES (CL), ingreso irrestricto/CBC (AR, sem prova nacional), exames por universidade (PE, BO), CXC/CSEC (GY). | C + D |
| `escola.ts:364,404-429` `temCota`, corte −45 | Cotas da Lei 12.711 (escola pública e renda). | C + D |
| `escola.ts:463-473,562-566,740-744` | ProUni (≤1,5 SM per capita), FIES (≤3 SM), vias `sisu/prouni/fies` e textos "universidade federal", "instituto federal", "Sistema S", "hospital universitário". | C + D |
| `dados/cursos.ts:1-20` | Níveis `livre/tecnico/superior/pos/residencia`. O texto cita SENAI/SENAC/IF. A oferta pública/privada por `nivelDeOferta` (perfil) é universal. Durações reais BR (Direito 60 meses e "Exame da OAB"). | B (estrutura) / D (durações e gratuidade por país) |
| `tipos.ts:447,1525` `financiamento?: 'fies'\|'prouni'`, `via` | A união de vias está tipada para o Brasil. | C |
| `sistemas/vestibular.ts` | Cursinho e preparo. O conceito é universal (preuniversitario, pre-U, academia); a prova chamada é `fazerEnem`. | B |
| `dados/especialidades.ts`, `sistemas/medicina.ts` | Residência por prova, UBS/CAPS no texto. Mecânica boa; os nomes são do SUS. Residência existe em toda a região com outros acessos (ex.: SERUMS obrigatório no Peru, "rural" no Chile e na Colômbia). | B + D |
| `escola.ts:749-759` | Exame da OAB anual. Na maioria dos vizinhos não há exame de ordem equivalente (a matrícula costuma ser automática ou via colegio); é preciso verificar. | C + D |
| `oportunidades.ts:165-169` | "Seleção do instituto federal" (médio integrado). | C |
| `ui/jogo/Estudos.tsx:44-45,266,334-556` | Rótulos "SISU — universidade pública", "ProUni", "FIES", "Fazer o ENEM deste ano". | C (UI) |

## 5. Trabalho

| Onde | Acoplamento | Class. |
|---|---|---|
| `tipos.ts:530` `Contrato = 'aprendiz'\|'estagio'\|'clt'\|…` | O id `clt` nomeia o regime pela lei brasileira. Semântica universal ("emprego formal"), nome não. | B (renomear para `formal` com rótulo por país) |
| `sistemas/profissao.ts:331` `VINCULO.clt = 'carteira assinada'`; 126 ocupações com `contrato: 'clt'` | Rótulo e dados. | C (rótulo) / A (dado) |
| `sistemas/trabalho.ts:682` | Rescisão = FGTS + multa de 40% + seguro-desemprego. | C + D |
| `trabalho.ts:944-1017` | Aposentadoria: 62/65 anos, 15/20 anos de contribuição ao INSS, 35 anos ou 62; BPC aos 65. Chile (AFP), Colômbia (Colpensiones/AFP), Peru (ONP/AFP), Argentina (ANSES, 30 anos) etc. | C + D |
| `ui/jogo/Trabalho.tsx:256,851` | "MEI: nota fiscal e INSS", "INSS: N anos de contribuição", "sem CNPJ". | C (UI) |
| `sistemas/concurso.ts:45-60,90` | Concurso público com esfera municipal/estadual/federal (`'BR'`). Cargos: PM, bombeiro, escriturário de banco, Receita, PRF. Concurso público como via de massa é muito brasileiro; nos vizinhos o ingresso costuma ser por "concurso de méritos" ou por nomeação, com outra frequência. | C + D |
| `dados/ocupacoes.ts:26-31` + 58 `fundamento:` / 33 citações de lei | Lei 12.842 (médico), 8.906 (OAB), 5.194 (CREA), LC 150 (doméstica) etc. | C + D |
| `dados/ocupacoes.ts:43` `Licenca` | `crm/oab/crea/coren/crp/cnh/cro/crefito/crf/crmv/creci/crc`: siglas de conselho. O conceito "licença profissional" é universal. | B (ids semânticos + rótulo por país) |
| `dados/carreiras.ts:115-142` | Textos de entrada ("Exame da OAB", "CREA, CAU", "alistamento aos 18"). | C |
| `dados/mercado.ts` | Época e declínio de funções. | A |

## 6. Esporte

| Onde | Acoplamento | Class. |
|---|---|---|
| `dados/clubes.ts:24-77` `CLUBES` | ~80 clubes reais BR presos a ids de município BR, com `porte` grande/tradicional/regional. O formato é excelente para outros países (River/Boca, Peñarol/Nacional, Colo-Colo, Olimpia, Alianza…). | A (formato) / D (dados) |
| `clubes.ts:121` `DIVISAO_DO_NIVEL` | "campeonato estadual / divisões de acesso / Série B / Série A". Estaduais não existem fora do Brasil. As ligas nacionais se chamam Liga Profesional, Primera División, Liga BetPlay… | C + D |
| `clubes.ts:114` `clubeDoNivel` | Sorteia em `CLUBES` global, sem filtro de país. | B |
| `clubes.ts:88-111` `POLIESPORTIVOS`, `equipeDaCidade` | "Equipe da prefeitura" é o caminho brasileiro. | C + D |
| `sistemas/modalidades.ts:79`, `esporte.ts:221` | Basquete: estadual → Liga Ouro → NBB. | C + D |
| `conteudo/caminhos.ts:172-174` | "Jogar só os torneios do Brasil". | C |
| `conteudo/adulto.ts:407` | "o Brasil ganhou a Copa". | C |
| `esporte.ts:16` | "Futebol é o caminho mais fundo (contexto brasileiro)". A premissa vale para quase toda a região, menos Guiana e Suriname (críquete, outra cultura esportiva). | B + D |
| — | Não há transferência para o exterior. Para a América do Sul, a venda para a Europa e para o Brasil é um eixo central da vida de jogador. | ausente |

## 7. Política

| Onde | Acoplamento | Class. |
|---|---|---|
| `dados/partidos.ts:22-55` `PARTIDOS_REAIS` | 30 partidos registrados no TSE (2026), com artigo (o/a). A estrutura `{sigla,nome,chamado,artigo}` serve para qualquer país. | A (formato) / D (lista por país; volatilidade alta) |
| `sistemas/politica.ts:108-113` modelos de cargo | vereador/prefeito/deputado estadual/federal/senador/governador, com idades da CF art. 14. Não há presidente. Estados unitários (Chile, Peru, Colômbia, Uruguai…) não têm deputado estadual/governador no mesmo formato; Guiana e Suriname são parlamentaristas mistos. | C + D |
| `tipos.ts:1621` `CargoEletivo` | União literal BR. | C |
| `politica.ts:122` | Calendário: municipais 2028+4k, gerais 2030+4k. Cada país tem o seu (mandatos de 4, 5 ou 6 anos; voto obrigatório ou não). | C + D |
| `politica.ts:25-41` (cabeçalho) | Ficha Limpa, filiação de 6 meses, desincompatibilização, regra militar art. 14 §8º. | C + D |
| `politica.ts:665-700` | "Assembleia Legislativa (UF)", "Governo do Estado", mudança para a capital da UF. | C |
| `conteudo/politica.ts:51` | Neutralidade: o diretório é local e sorteado. É um princípio exportável. | A |

## 8. Documentos e registros

| Item | Onde | Class. |
|---|---|---|
| CPF / RG / título de eleitor | **Não aparecem** no código (0 ocorrências de `CPF`). Não há documento de identidade modelado. Bom: nada a desfazer. | A (ausente) |
| CNH / Detran | `sistemas/autoescola.ts:91-125`, `acoes.ts:501-504`, `Licenca 'cnh'`, `bens.ts cnh: boolean`. Prova teórica + prática, 18 anos. Os textos falam de "Detran". Idade e processo variam por país (licencia de conducir, brevete no Peru). | B (mecânica) / C (texto) / D |
| CRM, OAB, CREA, CRC… | `ocupacoes.ts:43,229-338`, `save.ts:686`. | B + D |
| Reservista | `militar.ts` ("certificado de reservista"). | C |

## 9. Militar, justiça, saúde

| Onde | Acoplamento | Class. |
|---|---|---|
| `dados/forcas.ts:1-76` | Três Forças, Lei 4.375/1964, Decreto 12.154/2024 (feminino voluntário), Lei 13.954/2019, EsSA/EEAR/AMAN/Escola Naval/AFA, nomes de postos da Marinha e da FAB, `GUARNICOES` com ids BR. | C + D |
| `sistemas/militar.ts:1-40,148,340` | Serviço inicial obrigatório para homens aos 18. Hoje (a confirmar) o serviço é obrigatório na Bolívia, Colômbia, Venezuela e Paraguai e voluntário na Argentina (desde 1994), no Peru, Uruguai, Equador, Chile (misto), Guiana e Suriname. Bolívia e Paraguai têm Armada fluvial; Guiana e Suriname têm forças pequenas e unificadas. | C + D |
| `sistemas/justica.ts:1-20` | ECA (Lei 8.069), regimes fechado/semiaberto, remição. Os conceitos se aproximam nos vizinhos, mas a maioridade penal e os regimes variam. | B + D |
| `conteudo/integracao.ts:45-63`, `adulto.ts:220,412`, `infancia.ts:109`, `especialidades.ts` | SUS gratuito e lento × pago e rápido; UPA, UBS, CAPS. O modelo "público lento / privado caro" é bom e regionalmente plausível. Os sistemas reais diferem: FONASA/ISAPRE (CL), EPS (CO), obras sociales (AR), SIS/EsSalud (PE), ASSE/mutualistas (UY). | B (mecânica) / C (nomes) / D |
| `conteudo/bens.ts:48`, `dados/animais.ts:14`, `tipos.ts:77` | Lei 9.605/1998 e Decreto 6.514/2008 (fauna silvestre, multas em R$). | C + D |

## 10. Moradia, veículos, lojas, viagens, transporte

| Onde | Acoplamento | Class. |
|---|---|---|
| `dados/bens.ts:253-262` modelos de moradia | república, kitnet, casa simples, apto 1-3q, sítio, com preço e condomínio em reais. A tipologia é quase universal (pensión, monoambiente, departamento, chacra), mas os nomes e preços não. | B + D |
| `dados/bens.ts:128-200` `VERSOES_VEICULO` | Marcas e modelos do mercado BR (Fiat Mobi, Kwid, HB20, Onix, Caloi, Honda Biz, Fibrafort, Inpaer). Vários existem nos vizinhos com outros nomes e preços; Caloi, Inpaer e Fibrafort são marcas brasileiras. | C + D |
| `dados/bens.ts:46` `taxaAnual` (IPVA + seguro) | Imposto veicular BR. | B |
| Lojas | Não há marcas de varejo (estilo e mercado são genéricos). | A |
| `sistemas/experiencias.ts:38-39` | "Uma viagem pelo Brasil" (Chapada, Lençóis) e "fora do país". Para um paraguaio, "fora do país" frequentemente **é** o Brasil ou a Argentina. Não existe viagem para um país específico nem emigração. | C |
| `conteudo/escolhas.ts:251` | Excursão para Aparecida, Gramado, Porto Seguro, Caldas Novas, Juazeiro. | C |
| `conteudo/adulto.ts:399` | Férias "no Nordeste". | C |
| `sistemas/transporte.ts:18-25` | Tempos por perfil urbano, "ordem de grandeza brasileira". O perfil é universal; a calibração é razoável para metrópoles sul-americanas. | A/B |

## 11. Nomes

| Onde | Acoplamento | Class. |
|---|---|---|
| `dados/nomes.ts:9-57` `MASC/FEM/NEUTROS` por geração (antiga <1972, meio <2004, nova) | Só nomes brasileiros (Raimundo, Wellington, Kauã, Maria Clara). O padrão "por geração" é excelente e exportável. Faltam acentuação e grafia espanholas (José/Josefina, Valentina…), nomes indígenas (quéchua, aimará, guarani), nomes ingleses e indo-guianenses (Guiana) e neerlandeses, javaneses e hindustânis (Suriname). | A (formato) / D (dados) |
| `nomes.ts:33-39,58` `SOBRENOMES`, `sortearSobrenome` | Sobrenome único, do pai. Nos países hispânicos o padrão é **dois sobrenomes** (paterno + materno), e isso muda `criacao.ts` (herança) e a exibição. | C + D |
| `nomes.ts` `NOMES_PET_*` | Pipoca, Paçoca, Bidu. | C (leve) |

## 12. Eventos / conteúdo

| Onde | Acoplamento | Class. |
|---|---|---|
| `conteudo/mundo.ts:20-60` `textoDeRecessao` | "O país entrou em recessão". O texto é neutro; a causa vem de `economia`. Exportável se a economia for por país. | A/B |
| `conteudo/mundo.ts:74,84-85` | Seca (açude, Nordeste) e São João, condicionados a `regiao === 'Nordeste'`. É um padrão bom de evento condicionado a lugar, mas a condição é por região BR. | B |
| `conteudo/mundo.ts:88-97` | Carnaval por perfil urbano (vale para qualquer metrópole do país). Na Bolívia (Oruro) e no Uruguai (Carnaval longo) existe; em outros lugares, pouco. | C |
| `conteudo/infancia.ts:268`, `rotinas.ts:350` | Festa junina da escola. | C |
| `conteudo/primeiros.ts:107`, `rotinas.ts:466` | Natal e igreja (católica/evangélica). A religiosidade é regionalmente plausível; Suriname e Guiana têm hinduísmo e islã relevantes. | B + D |
| `conteudo/sistemicos.ts:252,295` | Escola particular "perto de R$ 1300" × `economiaLocal`; "evasão do ensino superior brasileiro". | B / C |
| `conteudo/vinculos.ts:157` | "não passou na federal". | C |
| Valores fixos nos textos | `adulto.ts:168,181`, `mundo.ts:154,186`, `vinculos.ts:217`, `rework3.ts:56`, `integracao.ts:122`, `trajetorias.ts:283`, `escolhas.ts:251`: valores em R$ literais dentro da string (R$ 2.890, R$ 3.000, R$ 180, R$ 1.500, R$ 900, R$ 120). São números mágicos que não passam por nenhuma escala de país. | C |

## 13. UI e formatação

| Onde | Acoplamento | Class. |
|---|---|---|
| `motor/texto.ts:69-71` `dinheiro()` | `'R$ ' + toLocaleString('pt-BR')`, importado em ~51 arquivos. É a **costura certa**: um único ponto. | B |
| `conteudo/biografia.ts:51` `fmt` | Formatador duplicado. | C |
| `ui/apresentar.ts:159-165` `dinheiroCurto`; `ui/leituraMaterial.ts:20-28` `dinheiroCheio`/`dinheiroCurto` | Três formatadores de UI com `R$`, "mil", "mi" (com duplicação entre os dois arquivos). | C |
| ~40 interpolações `R$ ${x.toLocaleString('pt-BR')}` inline (acoes, adulto, desafios, interacoes, trabalho, sistemicos, vinculos, adolescencia) + 50 ocorrências de "reais" e "mil reais" em texto | Contornam o formatador. | C |
| `motor/tempo.ts:3` `MESES` em português | Datas só por mês e ano, sem `toLocaleDateString`. | A (o idioma da interface é decisão de produto) |
| `ui/telas/Inicio.tsx:21` | "Um simulador de vida brasileiro." | C |
| Idioma | Todo o texto está em pt-BR. Fica a decidir se a vida argentina é narrada em português (provável: o idioma do jogo) e se o mundo do personagem fala espanhol (ex.: "outra língua na rua", em `experiencias.ts:39`, inverte para um brasileiro na Argentina). | decisão de produto |

## 14. Costuras estruturais prioritárias (próxima etapa)

1. **`Pais` como registro de dados + `v.pais` na Vida** (novo `dados/paises.ts`; `Vida.pais: PaisId` com padrão `'BR'` na migração de save v18→v19).
   Campos mínimos: `id`, `nome`, `gentilico`, `moeda {codigo, simbolo, locale, porUnidade}`, `idiomaRua`, `divisao {rotulo:'estado'|'provincia'|'departamento'|'region', unidades: Record<sigla,nome>}`, `regioes` (macrorregiões próprias + fatores de custo/salário), `salarioMinimo`, `regimeTrabalho`, `previdencia`, `sistemaEducacional`, `ligas`, `sistemaPolitico`, `servicoMilitar`, `nomes`, `sobrenomeDuplo`.
   *Risco:* **médio**. É simples de criar, mas toda leitura de constante (`SALARIO_MINIMO` etc.) precisa virar `paisDe(v).x`. Se o Brasil não reproduzir exatamente os valores atuais, os testes e os saves (determinismo do RNG) quebram. Mitigação: o objeto `BR` com os mesmos números e um teste de equivalência.

2. **`Municipio` ciente do país**: adicionar `pais: PaisId`, trocar `uf` por `divisao` (manter `uf` como alias), tornar `Regiao` uma string definida pelo país e fazer o `id` incluir o país (`br:sao-paulo-sp`, ou manter os ids BR intactos e prefixar só os novos). `municipio(id)` continua global; criar `municipiosDo(pais)`, `capitalDe(pais, divisao)` (substitui `CAPITAIS` em `escola.ts:502`) e `sortearMunicipio(rnd, pais)`. `economiaLocal` multiplica `PERFIL × regiaoDoPais × fatorPais`. Mover `LITORAL` para um campo `litoral` no dado.
   *Risco:* **alto** pela superfície (~36 usos de `.uf`/`.regiao` em 20+ arquivos, 30 arquivos de teste com ids BR, saves). É a costura de maior alavancagem: destrava clubes, guarnições, mercado, rural, política e mudança.

3. **Moeda e formatação únicas**: um `formatarDinheiro(v, valor, estilo)` em `texto.ts` que lê `paisDe(v).moeda`. Ele substitui `texto.dinheiro`, `biografia.fmt`, `apresentar.dinheiroCurto` e `leituraMaterial.dinheiro*`, e elimina os ~40 `R$` inline. Decidir a unidade interna: (a) cada país com a sua moeda constante de 2026 (os preços do catálogo precisam de uma tabela por país), ou (b) uma unidade interna de poder de compra × `porUnidade` só na exibição. A opção (b) é mais barata e preserva o balanceamento, mas esconde diferenças reais de preço relativo (o carro importado caro na Argentina, a gasolina barata na Venezuela).
   *Risco:* **baixo** na técnica e **médio** no texto, porque os valores fixos nas frases ("R$ 3.000") exigem varredura manual. Dolarização (Equador, de fato na Venezuela) e hiperinflação pedem cuidado na narrativa.

4. **Regras trabalhistas e previdenciárias como estratégia por país**: `renda.ts` (`liquido`, `inss`, `irpf`, `mesesPagos`, `contribui`) e `trabalho.ts` (aposentadoria, rescisão, BPC) passam a delegar para `paisDe(v).regimeTrabalho/previdencia`. Renomear `Contrato 'clt'` → `'formal'` com rótulo por país ("carteira assinada", "en blanco", "con contrato"). A informalidade (alta em BO, PE, PY) vira parâmetro de oferta.
   *Risco:* **médio**, mais **D forte**: AFP × repartição, idades e aguinaldo exigem pesquisa por país.

5. **Sistema educacional plugável**: extrair de `escola.ts` uma interface `SistemaEducacional { etapas, rotuloSerie, provaDeAcesso?, vias[], cotas?, bolsas[] }`. O ENEM/SISU/ProUni/FIES vira a implementação BR, e o tipo `via`/`financiamento` deixa de ser união fixa. O núcleo (matérias, preparo, `nivelDeOferta`) se mantém.
   *Risco:* **alto**. `escola.ts` (761 linhas) e `Estudos.tsx` estão profundamente acoplados ao ENEM; a pesquisa factual é extensa (11 sistemas).

6. **Dados esportivos por país**: `Clube.cidade` já é o id do município, então basta acrescentar clubes. Trocar `DIVISAO_DO_NIVEL` e `DIVISAO_BASQUETE` por `paisDe(v).ligas` e filtrar `clubeDoNivel` por país. Acrescentar a "venda ao exterior" (Brasil/Europa) como evento de carreira.
   *Risco:* **baixo-médio** (código simples); a pesquisa é fácil para o futebol e difícil para as outras modalidades.

7. **Sistema político por país**: tornar `CargoEletivo` e os modelos (`politica.ts:108`) dados do país (níveis municipal, intermediário e nacional; mandato; idade; reeleição; calendário). Os partidos ficam por país.
   *Risco:* **alto** na pesquisa e na sensibilidade (neutralidade em 11 países, listas partidárias voláteis); técnico **médio**.

8. **Nomes por país e geração** (+ sobrenome duplo): `sortearNome(r, genero, ano, pais)`; `sortearSobrenome` passa a herdar dois sobrenomes em países hispânicos.
   *Risco:* **baixo** técnico; **D médio** (nomes por geração; diversidade étnica em GY/SR/BO/PE).

9. **Militar, saúde, justiça, documentos e catálogos** (Forças, serviço obrigatório, SUS → "sistema público", CNH/Detran, veículos, moradia, conselhos profissionais, leis citadas em `fundamento`): tratar como dados por país em uma segunda onda, com rótulos genéricos como padrão.
   *Risco:* **médio**. Muito texto citando leis brasileiras precisa de reescrita ou de um `fundamento` por país.

10. **Conteúdo condicionado a país**: acrescentar `paises?: PaisId[]` (ou uma condição `quando` com `paisDe(c.v)`) aos eventos que hoje são brasileiros (Copa, São João, Carnaval, festa junina, Pix, Aparecida, SUS, "federal"), e criar os equivalentes locais. Primeiro marcar, depois escrever.
   *Risco:* **baixo** técnico; é o **maior volume de escrita**. Sem isso, o efeito "vida brasileira com outro endereço" persiste mesmo com todas as costuras acima.

**Ordem sugerida:** 1 → 2 → 3 (fundação, sem mudar o comportamento do BR) → 4 e 8 (diferença sentida desde o nascimento) → 5 e 6 → 7, 9 e 10. Fazer pesquisa factual (D) para um país-piloto (a Argentina ou o Uruguai pela distância cultural moderada, ou a Colômbia pelo contraste) antes de generalizar.


## 15. Adendo: o que este pacote acrescentou

- **Costuras novas (A):** `selecao.nacionalidadeEsportiva` (por qual seleção se joga); `mercados.mercadoDe` (sem citar leis); torneios de seleções com nomes genéricos; `palmares.competicaoDe` lê `DIVISAO_DO_NIVEL` (troca junto com as ligas por país).
- **Brasil-hardcoded novo (C), para a próxima etapa:**
  - `experiencias.DESTINOS_BR` ("Uma viagem pelo Brasil", custo por região BR via `regiaoDaUf`);
  - `projetosPossiveis` cita "o cursinho popular" e o ENEM;
  - as barras e limiares do futebol (`BARRA_FUTEBOL`, `LIMIAR_NIVEL`) estão calibrados para a pirâmide brasileira (estadual, acesso, B, A);
  - `pisoDoClube` usa o porte dos clubes BR.
- **Mudança de linha:** as referências a `experiencias.ts:38-39` acima são de antes deste pacote; as viagens agora são portas com destino, mas a lista de destinos continua brasileira.
