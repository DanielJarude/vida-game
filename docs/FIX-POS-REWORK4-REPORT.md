# FIX pós-REWORK 4 — "eu consigo agir dentro da minha vida"

- **Base:** `b7985ba` (REWORK 4 — VIDA VIVIDA), branch `claude/fix-pos-rework3-playtest`. Sem merge em `main`, sem
  force-push, sem deploy manual, sem mudança de secrets, sem `.claude/` no commit. Não é o ATT4.
- **Regra do pacote:** ESTADO → VERBOS CONTEXTUAIS → AÇÃO → REAÇÃO DO MUNDO → CONSEQUÊNCIA → HISTÓRIA. "Não basta
  implementar: tem que conectar." Cada sistema novo diz de onde lê e para onde escreve.
- **Save:** continua **v20**. Tudo o que é novo é opcional e validado (`save.validar`); a conta do "Mural" do REWORK 4
  abre como Instagram (`redesBase.normalizarRedes`, na leitura — idempotente, sem perda).

## 1. Problemas encontrados (playtest humano + o nosso)

| # | Problema | Onde estava |
| --- | --- | --- |
| 1 | Carros, motos e bicicletas sem cor própria na loja (a cor só nascia na compra; na vitrine, tudo no tom da área) | `mercado.OfertaVeiculo`, `Lugares.CartaoVeiculo` |
| 2 | Casas sem identidade (ícone genérico na imobiliária e entre os bens; paredes cinza na cena) | `IconeMoradia`, `CenaDaCasa` |
| 3 | Instrumentos minúsculos; violão e violino com o MESMO desenho; TV = computador; objeto escuro sumindo no fundo escuro | `Objetos.tsx` |
| 4 | Veículo não estava em Pertences ("quero usar meu carro" não tinha lugar); TV e caixa de som sem uso | `Pertences.tsx`, `dados/pertences` |
| 5 | Duas barras ("Carga" e "Estresse") que o jogador não distinguia; pequenas, cinza, sem o porquê | `Tempo.CargaEEstresse` |
| 6 | Tempo livre: tudo numa página só | `Tempo.tsx` |
| 7 | Rede social única e abstrata ("Mural") | `redes.ts`, `Rede.tsx` |
| 8 | Ficha da pessoa: lista plana de ações, quase tudo FALA | `Pessoas.FichaPessoa`, `interacoes` |
| 9 | Trabalho e formação sem verbos "de dentro" (o miúdo do dia a dia) | — |
| 10 | Viagem sem escolha de companhia; muito texto por cartão | `experiencias`, `Viagem.tsx` |
| 11 | Repetição: recuperação econômica, prova teórica, conclusões de curso | `conteudo/mundo`, `autoescola`, `escola` |
| 12 | **Bug de sucessão (achado nosso):** quem continuava a história herdava as contas de rede de quem morreu, e os objetos (o violão, a câmera) simplesmente sumiam | `sucessao.continuarComo` |
| 13 | **Achado do playtest adversarial:** com a semana no teto, "Começar terapia" ficava BLOQUEADO — e, quando liberado, a hora da terapia pesava como compromisso e o estresse SUBIA | `rotinas.podeComecarRotina`, `estado.sobrecargaDaSemana` |
| 14 | **Achado das capturas:** uma classe CSS nova (`.conteudo`) colidiu com o `<main class="conteudo">` e espremeu todas as páginas numa coluna de 260 px | `agir.css` (corrigido antes de qualquer commit) |
| 15 | Título de Tempo livre dizia "passou do que cabe" enquanto o painel dizia "ainda cabe" (duas fontes) | `Tempo.resumoDaSemana` |

## 2. Causas-raiz

- **Materialidade (1–3):** a cor era do bem *depois* da compra, e o desenho da vitrine não recebia cor nenhuma; o traço
  usava `currentColor` (o tom da área), que dominava a lataria. Casas: só existia o ícone de linha. Objetos: um
  dicionário de formas pequeno (vários ids na mesma forma) e contorno sempre "mais escuro que o objeto".
- **Agência (4, 8–10):** os sistemas tinham estado rico e poucos verbos; os verbos que existiam estavam dispersos (o
  carro em Dinheiro, os usos do violão só em Pertences, os programas com pessoas misturados às conversas).
- **Estresse (5, 13, 15):** a tela lia duas fontes (sobrecarga e cabeça) como duas métricas; o teto humano da semana
  valia para tudo, inclusive o que alivia; a terapia entrava na soma de "atividades acima do que cabe".
- **Sucessão (12):** `continuarComo` reconstrói a vida a partir da herdeira campo a campo — `redes` não era zerado e
  `financas.coisas` não era reconstruído.
- **Repetição (11):** frases fixas de evento de país (a mesma para todas as vidas do país) e núcleos sem contexto.

## 3. Arquitetura adotada

| Tema | Fonte (motor) | Tela |
| --- | --- | --- |
| Redes sociais 2.0 | `dados/redes.ts` (7 plataformas), `sistemas/redesBase.ts` (base: contas, renda, nome), `sistemas/redes.ts` (ações, ano, leitura) | `Tempo → Redes sociais` (`Redes.tsx`) |
| Estresse lido | `sistemas/leituraDoEstresse.ts` (valor, nível, tendência, pesa/ajuda, fôlego, riscos) | `Tempo → A semana` |
| Fazer junto | `sistemas/juntos.ts` (11 programas + o grupo de cada interação) | Ficha da pessoa, por grupo |
| Dia a dia do trabalho | `sistemas/noOficio.ts` (`{ tipo: 'oficio' }`) | `Trabalho → No dia a dia` |
| Ano letivo | `sistemas/naFormacao.ts` (`{ tipo: 'formacao' }`) | `Formação → Neste ano letivo` |
| Composição de frases | `sistemas/composicao.ts` (conclusão, teórica), `conteudo/mundo.textoDeRecuperacao` | Linha da Vida |
| Materialidade | `dados/pertences` (`corDaOferta`, `corDoVeiculo`, `corConcordada`, `fachadaDe`, `chaveDaFachada`), `veiculos.nomeComCor` | Lojas, Pertences, Casa, Dinheiro |

**Pacotes:** os módulos novos de verbos vão num pacote próprio, `motor-vida`, ENTRE os sistemas e os textos (importam
só sistemas e base; textos, ações, ano e telas os importam): sem ciclo, e nenhum dos pacotes grandes cresceu.

**Navegação:** `navegacao.SecaoTempo` (6 abas de Tempo livre, com destino direto: `irPara('redes')`) e o mapa de
intenções ganhou "algo físico", "um hobby", "sair, ver gente", "entender o estresse", "viajar", "postar no Instagram",
"usar o carro", "fazer algo com quem eu amo", "agir no trabalho" — o mesmo mapa do menu "Onde fica cada coisa", testado
com cliques de verdade (`navegacao.test.tsx`).

## 4. Mudanças por sistema

### 5. Redes sociais

Sete plataformas, cada uma com parâmetros próprios (`dados/redes.ts`): alcance, piso de alcance de quem é pequeno,
conversão, chance e tamanho do viral, esquecimento (com e sem publicar), faixa de idade do público, o quanto opinião
vira briga, produção (o vídeo e a live cansam), o que cabe nela (e quanto rende ali), como monetiza (mínimo e renda por
mil), como verifica (notoriedade / selo pago / documento), quem da vida costuma estar lá, a chance de detectar comprado.

| | Funciona como |
| --- | --- |
| Instagram | imagem pública; viagem, pet, estilo rendem; marcas pagam por público real |
| YouTube | vídeo que dá trabalho; cresce devagar; o **catálogo** continua trazendo inscritos e renda sem vídeo novo |
| TikTok | piso de alcance alto, viral 3× mais provável e 2,5× maior — e esquece 12% por ano mesmo publicando |
| Twitch | live; público pequeno, conversão alta; afiliado com 500 e 6 lives; renda por assinatura/doação |
| X | opinião, política e "rebater" são a cara da rede; a briga é 3× mais provável; selo é **pago** (verifica a conta, não a pessoa) |
| Facebook | público 30+; família e comunidade rendem; jovem alcança menos |
| OnlyFans | 18+ (documento antes de monetizar); paga por assinante; sem vitrine (assinante vem do nome e da divulgação nas outras redes, que deixa a conta à vista); **quem você conhece pode descobrir** — parceria, família, trabalho (mais pesado em carreiras de imagem pública). Nenhum conteúdo é descrito. |

**Ações** (`OpRede`): criar · publicar (com impulsionar) · marcar celebridade · provocar/trollar (estranho, celebridade,
alguém da sua vida) · campanha paga · verificar · monetizar · comprar público · apagar publicação · apagar conta
(com confirmação na tela) · seguir/deixar/bloquear/desbloquear (na ficha da pessoa).

**O que se publica sai da vida** (`conteudosPossiveis`): a viagem recente, o trabalho (o bastidor de quem tem sigilo —
saúde, farda — dá advertência), o treino de atleta, **desculpas ou rebater a torcida depois de uma temporada ruim**, a
bandeira do político, divulgar a obra/o negócio, a música, ensinar o que se sabe (≥ 45), a receita, o bicho, a família,
os estudos, a notícia do bairro. Pessoa comum não recebe opção de celebridade.

**Celebridades** fictícias **do país onde se mora** (`celebridadesDoPais`, estáveis por país). Marcar uma: o normal,
para quem é ninguém, é **não acontecer nada** (teste: ≥ 75% de "nada" em 60 vidas); às vezes curte, responde,
compartilha (público novo); raríssimo: a conversa continua e a pessoa entra em Pessoas.

**Conectado à vida:** quem da vida está naquela rede (estável por pessoa e idade) reage; quem está longe comenta e a
conversa recomeça; a briga cria tensão/conflito com quem discorda; provocar alguém vira conflito e, se é do trabalho, o
clima sente; famoso: estreia com público, alcança muito mais, ganha público sozinho, e a polêmica vira **imagem
pública** (`vis_polemica`); político: a base aplaude, o desgaste sobe; atleta que rebate: a reputação cai, quem pede
desculpas costuma ser perdoado; músico que divulga: o público do grupo cresce; quem viraliza sendo ninguém pode receber
o convite de **viver de conteúdo** (`novaOportunidade` → `criador_conteudo`, em Trabalho) ou a TV local; monetizada: a
renda entra no **orçamento** ("Publicidade e parcerias na rede"); público real grande dá **nome** (`notoriedade`).

**Linha da Vida:** só o que é biografia — a primeira conta, viralizar, os patamares (10 mil cotidiano, 100 mil
biografia), a verificação, a suspensão, a compra descoberta, a conta grande apagada, a celebridade que compartilhou, o
OnlyFans descoberto. Cada post, não.

**Save:** cada conta guarda as **últimas 8 publicações**; o resto vira número (`totais`). Medido: 10 anos publicando em
duas plataformas = **3,4 kB** de redes no save.

### 6. Agência — auditoria "estado sem verbo"

| Estado | Antes | Agora (o verbo e onde) |
| --- | --- | --- |
| Parceria | conversar, sair, carinho | **Fazer juntos**: jantar com reserva, show, cozinhar, caminhar, um fim de semana fora, viajar junto; tocar/jogar/ver filme com os pertences |
| Filho | brincar, ler | parque, **ensinar** (bicicleta, nadar, bola, cozinhar, tocar, xadrez, programar, dirigir — pelo que você sabe e tem), festa de aniversário, cinema, estádio |
| Pais/avós | visitar, ligar | jantar fora por sua conta, juntar a família no aniversário (80+: biografia), fim de semana fora |
| Amigos | tempo, conversar | cinema, show, estádio, caminhar, fim de semana fora, viajar junto |
| Emprego | promoção, aumento, ritmo | projeto difícil, almoçar com a chefia, ajudar um colega, capacitação |
| Por conta própria | preço, estrutura | divulgar (com Instagram rende mais), caprichar no cliente exigente |
| Atleta | foco, treinador, mercado | treino extra (finalização/físico/tático), vídeo dos adversários, fisioterapia extra, a torcida; posts de fase ruim |
| Escola | atividades, postura | estudar para as provas, pedir ajuda ao professor da matéria fraca, festa da turma, puxar o trabalho em grupo, matar aula, colar |
| Faculdade | atividades | estudar, festa, **procurar um professor para um projeto** (pesquisa), congresso da área, colar |
| Veículo | (em Dinheiro) | **em Pertences**: passear, pegar a estrada, aplicativo, personalizar, emprestar, consertar, revisão |
| Pertences | tocar, jogar... | + TV (maratonar, filme com quem mora junto), caixa de som; os usos com uma pessoa aparecem **na ficha dela** |
| Redes | Mural | 7 plataformas, acima |

Tudo com "uma vez por ano" (o ano do jogo é longo: é a fase, não o clique) e o anti-farm de sempre (`interacoes`).

### 7. Materialidade visual

- **Veículos:** a cor é do **anúncio** (`corDaOferta`: estável, sem sorteio — voltar à loja não repinta) e é ela que vai
  para a garagem; o nome diz a cor concordando ("Fiat Argo vermelho", "Honda Biz preta"); a lataria é pintada (0,94), o
  traço passa a ser neutro claro (antes o tom da área dominava), a bicicleta tem o **quadro** na cor dela; o estado
  aparece no desenho (zero: brilho; usado: riscos; cansado: pintura gasta e ferrugem). Vitrine com o carro a 72 px, o
  detalhe a 200 px, Pertences a 96 px. O carro na porta de casa tem a cor do seu carro.
- **Casas:** fachada com cor do mundo (`fachadaDe`: casas em cores de rua — ocre, verde-água, goiaba, azul-claro,
  terracota, branco-gelo, lilás, limão; prédios em concreto, tijolo aparente, bege, azul-acinzentado, salmão; alto
  padrão em vidro, branco, grafite, areia), estável da vitrine à casa onde se mora (`chaveDaFachada`). A imobiliária e a
  lista de bens mostram a **miniatura com a silhueta do modelo** (a mesma da cena), na cor dela; a descrição diz a cor.
- **Objetos:** violino com efes, voluta e **o arco**; violão maior (boca, trastes, tarraxas); bateria com bumbo de
  frente, tons e pratos dourados; piano de cauda com teclas; TV larga num pé; computador com teclado e gabinete; tablet
  próprio. 64 px na loja, 76 px em Pertences. **Contraste:** objeto escuro ganha contorno claro (luminância < 0,08),
  objeto claro ganha contorno escuro de verdade — o problema do "gato branco no fundo branco", ao contrário.
- **Cor do mundo, não da interface:** a cor de cada plataforma é a que o mundo associa a ela (sem logotipo — glifos
  genéricos); o estresse tem semântica (folha → ipê → laranja → vermelho); nenhuma categoria ganhou cor por enfeite.

### 8. Rotina, carga e estresse

A tela lê **uma** coisa: **Estresse** — número grande, palavra (baixo · moderado · alto · no limite), tendência
(subindo/baixando: o alvo do ano), barra de 14 px com as faixas, e uma frase. Depois: **o que está pesando** (as causas
do motor, com o tamanho — leve/moderado/forte — e "ver →" para onde mora a causa), **o que está ajudando**, **dá para
assumir mais?** (o teto humano da semana, em palavras, com a palavra da sobrecarga — sem segunda barra), **se continuar
assim** (as consequências reais) e **para aliviar** (descanso, terapia, uma atividade que alivia, ritmo leve no
trabalho, uma viagem). Cada atividade diz se alivia ou pesa no estresse. A "carga" segue no motor.

**Consequências reais** (além das que já existiam — saúde > 75, ansiedade/depressão, burnout, sobrecarga de anos, a
bebida, a pressão): agora, no próprio ano em que a cabeça está no limite (≥ 70), o **desempenho** no trabalho e no
estudo cai e **quem mora junto** sente (tensão, com chance). Sorteio derivado (não mexe no acaso do resto).

**Achados corrigidos:** a terapia passa do teto da semana ("uma hora por semana — e é para isso"), e a hora dela não
conta como "atividade acima do que cabe" (antes, começar terapia sobrecarregado **subia** o estresse).

### 9. Formação

`naFormacao`: 8 verbos (escola/faculdade), uma vez por ano letivo, alimentando notas, matérias (`frentes`), colegas e
professores de verdade (vínculos da instituição), estresse, família (colar ou matar aula podem chegar em casa), a
história da formação (`registrarNaFormacao`, que passou a morar em `formacao` — fonte única) e a biografia (o projeto
de pesquisa, ser pego colando). A instituição é sempre a de onde se mora (`formacao.instituicaoAtual`); nada de ENEM/SAT
aqui. Teste: Brasil → EUA, a faculdade de lá tem os verbos.

### 10. Relações

`juntos`: 11 programas concretos com custo local, condições (vínculo, idade dos dois, distância, estado da relação) e
reação **não determinística** (afinidade, jeito da pessoa, tensão, sorte → ótimo/bom/morno/ruim, cada um com o seu
texto e o seu efeito). Ensinar o filho a andar de bicicleta/nadar/dirigir é marco (história dos dois e Linha da Vida).
A ficha agrupa: **Como reagir** (o chamado) · **Fazer juntos** (com os pertences que dá para usar com aquela pessoa) ·
**Conversar** · **Cuidar e ajudar** · **A relação**. O bebê continua só com cuidar e brincar.

### 11. Carreiras

`noOficio` é a arquitetura reutilizável: CARREIRA → `verbosDoOficio(v)` (pelo modo do trabalho) → executar (sorte e
mérito) → HISTÓRICO (marca da trajetória; biografia quando é biografia) → CONSEQUÊNCIA (desempenho — que pesa na
promoção e na demissão —, clima, freguesia, prática, corpo, reputação esportiva, estresse). As decisões grandes
continuam em `profissao.acoesDoTrabalho`. Teste de regressão da especialização ("A área" não reaparece) passa.

### 12. Viagens

Passo novo **"Com quem?"**: sozinho(a), com quem mora junto, só com a parceria, com um amigo/a mãe/o irmão (até 4,
próximos e sem tensão). O preço muda com a gente que vai; quem vai entra na história; a escolha é o id de sempre com a
companhia no fim (`destino:duração:quem`). Acontecimentos: conhecer alguém (sozinho ou com um amigo), **a primeira
viagem de um filho** (biografia), o momento a dois (ou a briga, se a relação está tensa), o estrangeiro que se vira
(fora), o imprevisto — e a quietude continua permitida. O cartão da experiência perdeu um parágrafo: nome, preço como
etiqueta, uma linha do que muda.

### 13. Repetição (24 vidas × 30 anos, 6 países, 9 estratégias — o mesmo instrumento do REWORK 4)

| Medida | REWORK 4 | FIX |
| --- | --- | --- |
| Frases idênticas em outra vida | 28,3% | **22,2%** |
| Moldes em ≥ metade das vidas | 10 | **8** |
| Acontecimentos em ≥ 80% das vidas | 5 | 5 |
| Semelhança média entre vidas | 7,8% | **6,6%** |
| Semelhança máxima entre duas vidas | 16,8% | **14,5%** |
| Pares muito parecidos (≥ 50%) | 0 | 0 |

Os três grupos apontados saíram da lista das mais repetidas (antes: "A economia voltou a respirar…" ×15, "A crise foi
passando…" ×14, "Concluiu o ensino médio." ×11, "Concluiu o Técnico em Informática." ×10, "Reprovou na prova teórica…"
×9 e ×7). Composição, não sinônimo: a recuperação = o sinal na cidade de quem vive + o que mudou NA vida (o trabalho, o
negócio, a procura, a casa da infância) + às vezes quem estava junto; a formatura = o núcleo + a escola/universidade +
como terminou + quem estava (ou o que vem depois); a teórica = quão perto + a tentativa + o nervoso/o preparo + quem
esperava; desistir da carteira também. O sorteio de sempre continua sendo consumido (o resto da vida não muda).

### 14. Desempenho (24 vidas até 50 anos, `scripts/sim/desempenho.ts`, Node 22)

| | REWORK 4 (`b7985ba`) | FIX |
| --- | --- | --- |
| Tempo por ano simulado | 10,05 ms | 10,30 ms (+2,5%) |
| Save no fim (média / máximo) | 102,8 / 135,6 kB | 103,2 / 136,1 kB |

**Perfil (`node --cpu-prof`):** 44% do tempo é o `structuredClone` da transação (`nucleo.transacao` clona a vida
inteira a cada ação e a cada ano — o custo cresce com o save, por isso o REWORK 4 ficou ~20% mais lento quando o estado
cresceu ~21%); depois, `vinculosVivos` (7,6%, chamado muitas vezes por ano) e o orçamento. Partes do save: pessoas
28 kB, biografia 27 kB, vínculos 17 kB. Este FIX não persistiu nada derivável (a cor da oferta, a fachada, o grupo da
interação e as celebridades são derivados), limitou as redes (8 publicações por conta) e não aumentou o custo por ano
de forma relevante. **Recomendação** (não feita aqui, para não mexer na atomicidade das ações sem um pacote próprio):
memoizar `vinculosVivos` por transação e trocar o clone integral por cópia-na-escrita das partes grandes.

### 15. Bundle (limite de 800 kB mantido, não aumentado)

| Pacote | REWORK 4 | FIX |
| --- | --- | --- |
| motor | 742,71 | 743,82 |
| motor-textos | 727,51 | 720,33 |
| motor-dados | 431,09 | 442,04 |
| Jogo | 338,01 | 365,86 |
| motor-carreira | 276,63 | 277,51 |
| react | 223,22 | 223,22 |
| motor-conteudo | 128,81 | 129,56 |
| **motor-vida** (novo) | — | 67,21 |

## 16. Testes

- **Suíte completa (Node 22.23.2, cópia no disco Linux): 1.176 testes em 68 arquivos, todos passando** (base `b7985ba`: 1.134 em 66). Typecheck limpo. `build:itch` + `smoke:itch` **21/21**.
- `src/motor/__tests__/fixPosRework4.test.ts` — **33 testes causais**: redes (criar → postar → público reage → reabrir;
  TikTok × Facebook com a mesma pessoa; plataformas diferentes em verbo, monetização e verificação; comprar → número
  sobe, engajamento e credibilidade caem, não monetiza, a rede descobre; promover → dinheiro sai, público real sobe;
  trollar → conflito real, advertências → suspensão; apagar → não opera, renda some, história fica; monetizar → o
  orçamento; famoso × anônimo, e a polêmica do famoso vira imagem; celebridade: o normal é nada; atleta numa fase ruim;
  OnlyFans 18+, documento, descoberta; o save não cresce; Mural → Instagram), materialidade (cor da vitrine → garagem →
  reabrir → vender; concordância), pertences (violão: comprar → tocar → efeito → tocar para alguém → reabrir com a mesma
  cor; TV com quem mora junto), estresse (trabalho + faculdade + filho; terapia; no limite cobra; terapia no teto),
  relações (programas, custo, reação variável, história, reabrir; ensinar a bicicleta; o que não faz sentido não
  aparece), carreira (projeto sobe ou desce, uma vez por ano; atleta), formação (estudar, colar e ser pego; o projeto
  de pesquisa), viagem (com quem: preço, história), repetição (formatura e teórica variam) e **o mundo inteiro**
  (Brasil → EUA → SAT, celebridades de lá, rede funcionando, faculdade e trabalho de lá, filho, morte, sucessão: o filho
  fica com o violão e não herda a conta; reabrir).
- `src/ui/__tests__/fixPosRework4.test.tsx` — 9 testes de tela ligados ao motor de verdade (o clique executa a ação e a
  tela renderiza a vida nova): o estresse sem "Carga"; as abas; criar → postar → apagar com confirmação; OnlyFans 18+;
  a ficha com "Fazer juntos"; carros coloridos na loja → comprar → veículo em Pertences com verbos; violão ≠ violino e o
  contraste; "No dia a dia do trabalho" (o clique some o verbo do ano); "Neste ano letivo".
- **Playtest adversarial (`scripts/sim/agir.ts`): 14/14** perguntas respondidas com lugar (o mapa de intenções), verbo
  (o que a tela mostra) e consequência (o estado mudou). As respostas estão logo abaixo.
- Typecheck limpo.


### Playtest adversarial — as respostas (`scripts/sim/agir.ts`, 14/14)

| Pergunta | Onde (mapa de intenções) | O que fez → o que aconteceu |
| --- | --- | --- |
| Quero usar meu violão. Onde clico? | Vida · Pertences → cada coisa sua, com o que dá para fazer com ela | Tocar → música 0.0 → 5.6. "Uma hora com o violão (preto fosco) no colo. Os dedos lembraram de coisas que a cabeça tinha esquecido." |
| Quero fazer algo com quem sou casada (o marido, a esposa). | Pessoas → o rosto da pessoa: "Fazer juntos" (cinema, jantar, parque, ensinar, viajar) | Um jantar com reserva, só vocês (João Miguel) → proximidade 80 → 84. "Um jantar bonito. Voltaram de mãos dadas." |
| Quero passar tempo com meu filho. | Pessoas → o rosto da pessoa: "Fazer juntos" (cinema, jantar, parque, ensinar, viajar) | Ensinar Benício a andar de bicicleta → presença 30 → 40. "Você soltou o banco sem avisar. Benício só percebeu dez metros depois — e não caiu." |
| Quero postar no Instagram. | Tempo livre · Redes sociais → cada plataforma: postar, crescer, monetizar, apagar a conta | Uma foto do dia → 38 seguidores. "153 pessoas viram; 8 seguidores novos. Reagiram: Murilo, Aurora, Rebeca e mais 3." |
| Quero tentar crescer no YouTube. | Tempo livre · Redes sociais → cada plataforma: postar, crescer, monetizar, apagar a conta | 3 vídeos e uma campanha → 32 → 173 inscritos (engajamento morno). "A campanha rodou: 136 inscritos novos, de verdade." |
| Quero ser tóxico no Twitter/X. | Tempo livre · Redes sociais → cada plataforma: postar, crescer, monetizar, apagar a conta | Provocar estranhos, três vezes → toxicidade 30, credibilidade 51, advertências 1. "Você provocou um estranho nos comentários." |
| Quero apagar minha conta. | Tempo livre · Redes sociais → cada plataforma: postar, crescer, monetizar, apagar a conta | Apagar a conta no X → conta ativa: não; a biografia guarda: sim (cotidiano). "A conta foi apagada. O silêncio é estranho nos primeiros dias." |
| Quero usar meu carro. | Vida · Pertences → o veículo, com o que dá para fazer com ele | Um domingo de passeio com a família (Renault Kwid prata) → "Um domingo inteiro fora, com João Miguel e Benício. Ninguém pegou no celular." |
| Quero entender por que estou estressado. | Tempo livre · A semana → "Estresse": o que pesa, o que ajuda, o que dá para fazer | Ler "A semana" → 72% alto, baixando. Ajuda: Frequentar a igreja, Tempo com a família. Se continuar: em casa, a paciência fica curta: as brigas aumentam; o desempenho no trabalho cai; anos assim abrem a porta para ansiedade, depressão e pressão … |
| Quero diminuir meu estresse. | Tempo livre · A semana → "Estresse": o que pesa, o que ajuda, o que dá para fazer | Começar terapia → para onde o estresse vai: 60 → 50. "Terapia entrou na sua semana (uma sessão por semana)." |
| Quero viajar com minha família. | Tempo livre · Viagens → o destino, quanto tempo, com quem | A Chapada Diamantina — fim de semana prolongado, Com João Miguel e Benício → "R$ 5.100 entre passagem, hospedagem e o resto. Voltaram com fotos demais e uma história que vão repetir por anos." Biografia: Viajou para a Chapada Diamantina (fim de semana prolongado), com João Miguel e Benício. |
| Quero fazer alguma coisa na faculdade. | Formação → "O que dá para fazer aqui" | Procurar um professor para um projeto → "O professor ouviu, elogiou a vontade e disse que não tinha vaga no grupo este ano. Vale tentar de novo." (história da formação: 8 momentos) |
| Quero treinar como atleta. | Trabalho → "No dia a dia do trabalho" | Treino extra: finalização → futebol 0.0 → 6.9. "Duzentos chutes depois que todo mundo foi embora. Os últimos entraram todos." |
| Sou atleta numa fase ruim: o que posto? | Tempo livre · Redes sociais → cada plataforma: postar, crescer, monetizar, apagar a conta | Pedir desculpas à torcida pela fase → "372 pessoas viram; 20 seguidores novos. Reagiram: Roberta, Laura, Júlia e mais 3. A torcida aceitou: o próximo jogo foi de apoio." |

### 21. Testes que precisaram ser alterados (e por quê)

Nenhum teste foi afrouxado para passar. Todos os ajustes são de **lugar** (a coisa mudou de tela) ou de **design pedido**:

| Teste | O que mudou | Por quê |
| --- | --- | --- |
| `ui/interface` "a semana diz o que a ocupa" | não procura mais "Carga"; procura o medidor de Estresse e "O que está pesando"; a mensagem da semana cheia é procurada na aba "Hobbies" | o pedido: estresse como leitura única, sem duas barras; o catálogo mora nas abas |
| `ui/interface` "poucas sugestões… explorar" | clica a aba "Hobbies" antes de contar | idem (as mesmas asserções, na aba) |
| `ui/viagens` (4) e `ui/pacotePlaytest` (1) | renderizam `Tempo` na aba "Viagens"; o roteiro passa por "Com quem?" e o id da escolha leva a companhia no fim (`lisboa:semana:so`); o preço continua sendo o do motor | as viagens têm aba própria e o passo novo de companhia |
| `ui/navegacao` | o ajudante `ir()` clica também a aba de Tempo livre; as intenções novas (e duas que não tinham o que conferir — `pertences`, `rede`) ganharam o texto esperado | mais estrito: antes, `rede` e `pertences` passavam sem conferir nada |
| `motor/social` "bebê não recebe ações de adulto" | **não mudou**: a regra mudou (a festa de aniversário é a partir dos 3) | o teste estava certo |

**Testes afrouxados no REWORK 4 (auditoria pedida):** além do `caminhos` "9 e 10" (`<` → `≤`), há mais três ajustes
daquele pacote que relaxam uma asserção — todos ainda lá, documentados:
1. `caminhos` "tempo livre": a academia por cima da semana cheia passou a aceitar `'permitido'` (com o preço no
   motivo) além de `'incompativel'` — mudança de design (estresse no lugar do muro), não falha escondida.
2. `fechamentoMundo` "4." (240 vidas de 30 anos): teto de tempo de 20 s → 60 s, pela lentidão do motor (seção 14).
3. `rework3` (independência aos 18): passou a aceitar a fase `'voltou'` (a vida sorteada já tinha saído e voltado).

**Futebol (a pendência do "9 e 10"), medido de novo com o mesmo roteiro do teste (`scripts/sim/futebolPortas.ts`):
120 vidas → 109 tentaram, 34 profissionais: 13 pela base × 21 pela porta amadora** — idêntico ao REWORK 4. Este FIX não
mexeu nisso; a calibragem continua com a simulação de 1.000 vidas.

## 17. PWA / offline

`scripts/pwa/offline.mjs` (build de produção num Chromium de verdade): **27/27** (antes 23). Passo novo **3c — as redes
sociais sem rede**: offline, a vida chega aos 13, abre Tempo livre → Redes sociais, cria a conta no Instagram e
publica; o save no IndexedDB tem a conta; recarregar offline devolve o save idêntico e a tela mostra a mesma @arroba. O
pacote novo (`motor-vida`) e o `motor-textos` entraram na lista conferida do precache (36/36 entradas). As redes são
simulação local: nada depende de internet. Os 7 pacotes do mundo seguem no precache (a vida no Japão nasce offline).

## 18. Mundo / geografia

- `scripts/sim/vazamentos.ts`: **0 achados** (10 países × 3 vidas inteiras, idade final média 67).
- O que é novo e poderia presumir o Brasil foi escrito sem presumir: as celebridades são do país onde se mora (inclusive
  "político", não "senador"); a recuperação econômica fala da cidade de quem vive; a formatura usa o nome da instituição
  da vida; os verbos da formação valem em qualquer sistema escolar (teste Brasil → EUA); o selo, a idade do OnlyFans e
  as regras das plataformas são universais; o estádio, a padaria e o congresso também.
- Teste de fronteira completo (seção 16).

## 19. Capturas

`scripts/playtest/agir.mjs` — 15 cenas × 1440/820/390 (45 imagens, a partir dos saves do playtest adversarial): Tempo
livre (a semana com o estresse, corpo e mente, sair e ver gente, redes — Instagram e YouTube —, viagens no passo de
companhia), Pertences (o carro e o violão), a concessionária (catálogo completo), a loja de instrumentos, a imobiliária,
a casa, a ficha da parceria, Formação (estudante), Trabalho (atleta e empregada). **Sem rolagem horizontal, sem erro de
página/console, nenhum botão com menos de 32 px no celular.** Ajustes feitos por causa das capturas: a colisão de CSS
(coluna de 260 px), o traço do veículo colorido (o tom da área dominava a lataria), a vitrine de objetos maior, o título
coerente com o painel, os botões da ficha em linha, a miniatura das casas recortada.

## 20. Regressões encontradas e corrigidas

- **Herança das redes** e **objetos perdidos** na sucessão (anterior a este pacote; agora: redes zeradas e laços digitais
  limpos para quem continua; quem fica na mesma casa fica com as coisas da casa; quem mora em outra leva o que é pessoal
  e tem uso — e a biografia diz "Ficou com o violão de …").
- **Terapia bloqueada / piorando o estresse** no teto da semana.
- **Colisão de CSS** `.conteudo` (antes do commit).
- **Título × painel** de Tempo livre dizendo coisas diferentes.

## 22. Pendências reais (não declarar pronto o que não está)

- **APK Android:** **não foi regenerado.** O ambiente desta sessão não tem o JDK 17 nem o Android SDK (o pacote anterior
  os usou de fora do repositório e eles não existem mais aqui), e o pedido era não transformar isso em pipeline. O
  botão continua funcionando e baixa o APK do REWORK 4 (`b7985ba`): **o app Android está uma versão atrás do site**
  (sem as redes 2.0, sem as abas de Tempo livre etc.) até alguém rodar `scripts/android/gerar-apk.mjs` (instruções em
  `docs/notas/ANDROID-APK.md`). Continua **sem teste em aparelho real**; continua com chave de depuração. O PWA segue
  sendo o caminho offline validado.
- **Desempenho:** o custo do clone por transação (44% do tempo) é o próximo gargalo; recomendação na seção 14.
- **Futebol base × amador** (13 × 21): fica para a simulação de 1.000 vidas.
- **Redes:** sem mensagens diretas com conteúdo, sem "rede de terceiros" (os perfis dos outros), sem tendências por
  tema/época; o X não distingue "seguidores pagantes"; a TV local depois do viral é só um aviso (não vira oportunidade
  própria). A verificação por notoriedade usa limiares fixos por plataforma.
- **Carreiras:** a arquitetura `noOficio` cobre empregado com chefia, por conta própria e atleta; docência, saúde e
  farda recebem os verbos genéricos do empregado (não verbos próprios, como "pegar o plantão do colega" ou "a operação"),
  e as carreiras de arte, academia e política continuam com as ações que já tinham.
- **Objetos:** sofá, colchão, eletrodomésticos e celulares continuam passivos (não há o que "fazer" com eles além do
  efeito do ano); escrivaninha e tablet sem uso novo.
- **Casas:** a fachada não muda com reforma ("deixar com a sua cara" não repinta); o material é cor, não textura.
- **Repetição:** "Uma chuva de verão alagou a rua…" (×10) e a escola particular (×9) são os próximos.
- Pendências conhecidas do ATT Mundo seguem como estavam.
