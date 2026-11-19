# VIDA · ERAS HISTÓRICAS v4 — a sociedade que pesa e o mundo que muda

Branch `claude/eras-v4-sociedade`, a partir da `main` em `e5fe53d` (a v3 publicada). Documentos irmãos:
`docs/eras/FONTES.md` (§21, nova), `docs/eras/AUDITORIA-E-PROPOSTA.md`, `docs/ERAS-HISTORICAS-V3-REPORT.md`.

Manual Mestre de Diretrizes lido integralmente antes de começar. Um único agente, trabalho sequencial, sem subagentes.

Legenda: **IV** implementado e validado · **IN** implementado, não validado · **P** parcial · **N** não implementado
(planejado) · **B** bloqueado.

## 1. Escopo adotado

O pedido tem seis fases. Seguindo a regra dele ("não sacrifique profundidade para cumprir todas as fases"), esta entrega
fecha uma etapa coerente:

| Fase | Situação |
|---|---|
| 1. Auditoria e consolidação da v3 (suíte, regressões, limite de 800 kB) | **IV** — §3 e §11 |
| 2. Profundidade social (origem, classe, privilégios, desigualdade, direitos, consequências) | **IV** no trabalho, salário, faculdade, crédito e política; **P** na moradia (só o crédito do redlining), nos lugares públicos e no cotidiano |
| 3. Política e transformação do mundo (partidos, participação, reformas, movimentos, oposição, história alternativa) | **IV** |
| 4. Cotidiano e economia | **P** — só o esporte amador antes do profissionalismo (pendência da v3) e os efeitos das reformas de escola e saúde |
| 5. Século XIX brasileiro | **N** — §13 |
| 6. Novos países | **N** — §13 |

## 2. Auditoria (o estado real encontrado)

- Produção e `main` em `e5fe53d`; o código confere com o relatório da v3 (seis países, Brasil desde 1900, Argentina desde 1945).
- **As regras sociais da v3 eram quase só texto.** `regrasDoAno` escrevia a frase uma vez; só três lugares do motor
  consultavam a época: a eleição (voto feminino, anos sem eleição), a universidade dos filhos (`fatorDoSuperior`) e a
  guerra. A mulher casada, a segregação, a discriminação no emprego não mudavam nenhuma chance.
- **Partidos fora do Brasil eram genéricos** ("partido de centro-esquerda") também nas vidas históricas; no Brasil, nada
  antes de 1966 (a lista vazia de 1900 a 1965).
- **Esporte:** a data do profissionalismo valia para a vaga de emprego, mas o contrato que vem da base do clube não a
  consultava (o futebol "profissional" no Brasil de 1925).
- **Pacotes:** `motor-dados` 799.272 B, `motor-textos` 799.645 B, `Jogo` 796.761 B (limite 800 kB).
- **Suíte:** a da v3 não tinha sido rodada inteira depois das últimas correções (rodada agora: §11).
- **Teste humano:** não houve na v3; nesta também não (§12).

## 3. O que foi preservado

Todo o desenho e o conteúdo das v1–v3: unidade interna em reais de hoje, moedas e escritas antigas, séries, guerras,
mortalidade, tecnologias, veículos, as regras da v3 (que continuam escrevendo a frase delas) e o caminho do ano histórico
(`eras/ano` → `eras/v3/anoPais`). A v4 entra como uma camada a mais: o ano social (`eras/v4/sociedadeAno`) roda logo depois
das regras da v3, nos dois caminhos (Brasil e outros países).

**A vida contemporânea não muda** (conferido byte a byte: §11).

## 4. A sociedade que pesa (Fase 2)

### 4.1 O modelo

Cada **barreira** (`eras/base/sociedade4.ts`) tem: país, período `[de, ate)` (o `ate` é a data real em que caiu), divisões
(estados), lado do país dividido, **a quem pesa** (mulher, mulher casada, negro, indígena, pobre, mesmo gênero, religioso
praticante, fichado pela polícia política), **natureza** (lei · prática das instituições · costume), **domínio** (trabalho,
salário, estudo, crédito, política), alvo (setores, trilhas, ocupações, concurso, nível), efeito (fecha a porta ou multiplica
a chance), **resíduo** (depois que a lei cai, o costume volta a 1 aos poucos), a saída que existia na época, a reforma que a
derruba e a fonte. São 42 barreiras, 52 reformas, 25 movimentos e 81 partidos nos seis países.

| | Barreiras | Reformas | Movimentos | Partidos |
|---|---|---|---|---|
| Brasil | 5 | 8 | 6 | 15 (1873–1965; mais os 49 de 1966–2025 da v2) |
| EUA | 10 | 13 | 6 | 7 |
| Reino Unido | 9 | 10 | 4 | 15 |
| Japão | 6 | 8 | 3 | 13 |
| Alemanha (com a RDA) | 9 | 7 | 3 | 22 |
| Argentina | 3 | 6 | 3 | 9 |

### 4.2 Onde pesa (sistemas concretos, não modificador de atributo)

- **Trabalho** (`sistemas/trabalho`): a barreira de lei/instituição **fecha a vaga** com o motivo e a saída da época (a
  advocacia na Inglaterra antes de 1919; o serviço público para a mulher casada britânica até 1946; o concurso para quem
  está fichado no Brasil de 1964–1979); o costume **diminui a chance** de ser chamado (a "boa aparência" no Brasil até a Lei
  Caó; a discriminação legal nos EUA até 1965; a carreira das mulheres no Japão até 1986).
- **Salário de entrada** (`contratar`): a diferença que a lei permitia antes das leis de salário igual (EUA 1963, Reino
  Unido 1975, Japão 1986).
- **Faculdade** (`escola.opcoesDeCurso`): a porta (a universidade alemã antes de 1900–1909) e a chance (as universidades
  imperiais japonesas, as do Sul segregado, os limites às mulheres nos EUA até o Title IX, a RDA para quem ia à igreja).
- **Crédito** (`acoes.condicoes*`): empréstimo e financiamento negados sem a assinatura do marido (Brasil até 1962, Japão
  até 1948, Alemanha Ocidental até 1962, Argentina até 1968), sem um homem como fiador (EUA até 1975, Reino Unido até 1976),
  no bairro marcado em vermelho (EUA, 1934–1968), sob a tutela indígena (Brasil até 1988).
- **Política** (`politica.podeConcorrer` e `fatoresDaEleicao`): o eleitorado negro que não podia votar no Sul dos EUA
  pesa como fator "época" na eleição (explicado depois da apuração).
- **A barreira do casamento:** a mulher que se casa e trabalha onde a regra mandava sair perde o posto (aconteceu nas
  simulações: Reino Unido, 1945).

### 4.3 Privilégio de origem

`redeDeOrigem` e `classeNaFaculdade`: numa sociedade em que poucos estudavam (a taxa de matrícula no superior do país e
do ano), o sobrenome e os contatos abriam os postos altos (+35% na chance dos postos de nível 3+ para a família rica, quando
1% estudava; −25% para a pobre) e a faculdade (até −65% para quem vinha de casa pobre). O efeito some conforme a
universidade se abre (2010: quase nada). Nunca garante nem impede: é chance. [A]

### 4.4 Como aparece na vida

- **O encontro** (uma vez por barreira, quando ela pesa de verdade: o emprego que se tem, a idade da faculdade, a política,
  o salário do primeiro emprego), com a natureza dita ("Era a lei." / "Não era lei: era a regra da instituição." / "Não era
  proibido: era o costume") e a saída da época. Depois que a lei caiu: "Até 1946, …. A regra caiu; o costume, ainda não".
- **O motivo na vaga e no banco**, na hora em que a pessoa tenta.
- **O painel "A sociedade em <ano>"** (Você → No mundo): a posição de origem e o que ela pesa na época; o que pesa agora,
  com etiquetas (domínio, natureza, "porta fechada"), a saída e a fonte; os movimentos; os partidos do mês; o mundo que a
  família mudou.

## 5. A política e o mundo que muda (Fase 3)

### 5.1 Partidos reais por país e período

Os partidos de cada país com a data de fundação, as mudanças de nome, as fusões, os períodos de **proscrição** (o PCB de
1947 a 1985, o peronismo de 1955 a 1972, todos os partidos nas ditaduras argentinas, o KPD de 1956, o Partido Comunista
japonês antes de 1945) e as **listas únicas** (a Frente Nacional da RDA), com a linha histórica de cada um em uma frase,
sem juízo e sem efeito no jogo. Nenhum nome atual antes de existir (o PLD só em 1955; os Verdes alemães em 1980). Quem
estava filiado a um partido posto na ilegalidade perde a filiação (e a vida conta). Decisão registrada: **nenhum partido
nazista, fascista ou neonazista é oferecido para filiação** (teste); a Alemanha de julho de 1933 a 1945 não tem partido em
que se filiar.

### 5.2 Reformas pelo cargo

No mandato, a lista "Mudar a lei da época" traz as reformas pendentes **da competência do cargo**: vereador e prefeito, as
da cidade (escola, água e posto de saúde); deputado estadual e governador, as do estado (a matrícula de mulheres nas
universidades do Império alemão; o fim da segregação num estado do Sul — uma reforma que a história não teve, marcada
como tal); deputado federal, senador e presidente, as do país. A chance vem da aprovação, da base, da liderança, do
desgaste, da força do cargo, da **oposição da época** (`resistencia`, com quem se opunha, nomeado), da **pressão dos
movimentos** e da **maturidade** (propor o Estatuto da Mulher Casada em 1950 dá 6%; em 1961, mais). Sob regime fechado
(Estado Novo, AI-5, sem eleições livres, perseguição), a casa vota o que o regime manda: a chance cai a 15%. Uma reforma
por ano.

O que passa: entra na história desta continuidade (`v.era.historia.alteracoes`, com o alcance: o país, o estado, a cidade),
vira marco na vida e na carreira, conta como entrega do mandato, aparece na linha do tempo do mundo como **história
alternativa** (`real: false`) e, quando a notícia real chega (a 19ª Emenda, a Lei dos Direitos Civis, o voto feminino de
1932), a vida diz "No seu estado, isso já valia desde 1957 — pela sua mão". O custo: a aprovação cai entre os que eram
contra e o desgaste sobe, tanto mais quanto maior a antecipação.

### 5.3 Oposição e consequências no tempo

- **Contestação:** a reforma aprovada cinco anos ou mais antes da data real pode ser derrubada nos seis anos seguintes
  (a Corte Suprema e a maioria seguinte; a legislatura seguinte) — chance proporcional à oposição e à antecipação. Derrubada,
  a barreira volta até a data real, e a vida conta.
- **O costume não some com a lei:** o resíduo de cada barreira.
- **Proporcionalidade:** uma reforma municipal só vale na cidade; a estadual, no estado (testado: a dessegregação da
  Geórgia não vale no Texas). Um movimento comum só antecipa reforma nacional que já estava a 1–3 anos da data real.

### 5.4 Movimentos

25 movimentos documentados, no lugar e no tempo (o sufragista, os direitos civis no Sul e no Norte, o operário, o das
mulheres, o movimento negro, a anistia, o indígena, a campanha da escola pública, o homossexual, o antirracista britânico).
Ações: participar, organizar (depois de participar; mais pressão, mais exposição), dar dinheiro, afastar-se. O risco é o da
época, por período: 0 nenhum; 1 hostilidade (o patrão que demite); 2 detenção (quase sempre dias, às vezes meses) e ficha
na polícia (no Brasil, na Argentina, na RDA, que fecha o concurso enquanto o regime durar); 3 um regime que prende e mata
(a Argentina de 1976–1983): prisão longa, sem transformar a violência em mecânica de pontos. A pressão esfria sem ação.

### 5.5 Gerações

A história alterada mora em `v.era`, que passa ao herdeiro na sucessão: o filho que continua a vida vive com a reforma (sem
a barreira), aos 16 anos ouve na escola a história da reforma e o nome de quem a fez, e as reformas de escola e saúde mudam a
geração seguinte (a faculdade como se fosse dez anos depois; a mortalidade infantil da época 60% menor na cidade com água e
posto de saúde — aproximação a partir de Cutler & Miller, 2005).

## 6. Esporte (Fase 4, parcial)

Antes do profissionalismo no país (o futebol: Brasil 1933, Argentina 1931, Alemanha 1963, EUA 1968, Japão 1993; o tênis
1968; o atletismo 1982), a base não oferece contrato: a vida diz que o esporte era amador e que se vivia de outro trabalho.

## 7. Arquitetura e desempenho

- **O limite de 800 kB, resolvido de forma estrutural:** `vite.config.ts` ganhou a regra das **folhas puras** — um
  catálogo do motor que não importa nada em tempo de execução vai para o pacote `motor-catalogos`. Um pacote só de folhas
  não importa nenhum outro: não pode entrar em ciclo. Sem lista de nomes para manter: cada catálogo puro novo cai lá sozinho.
  `motor-dados` caiu de 799,3 kB para 641,8 kB; `motor-catalogos` tem 157,8 kB. Os 9 avisos de "circular chunk" são os mesmos
  da base (comparados).
- **Dados por país e domínio:** cada país tem `eras/paises/<id>/sociedade.ts`, no pacote do país (carregado sob demanda); o
  Brasil, `eras/base/sociedadeBR.ts`. O motor da v4 (`eras/v4/`) vai no pacote `motor-eras` (107,6 kB). A interface nova
  (`ui/eras/Sociedade4`) vai no pacote sob demanda de "No mundo" (22,2 kB): `Jogo` ficou em 797,0 kB.
- **Ganchos sem ciclo:** as reformas registram-se na política (`REFORMAS_DA_EPOCA`), como a presidência; os sistemas de
  baixo leem a base histórica pura (`sociedade4`), que não importa nada de cima.
- **Ainda apertados (não pioraram):** `motor-textos` 799,7 kB e `Jogo` 797,0 kB. Nenhum conteúdo novo entrou neles; a
  próxima versão que precisar crescer ali deve aplicar a mesma ideia (mover os módulos que só a camada de cima importa).

## 8. Compatibilidade com saves

`EraDaVida.historia` é opcional e normalizada (`normalizarHistoria`: alterações malformadas somem, pressão não numérica some,
movimentos e encontros inválidos são limpos). Saves antigos não ganham nada (testado); a história sobrevive ao save
(testado).

## 9. Fontes

`docs/eras/FONTES.md` §21: legislação, decisões judiciais, arquivos e pesquisas por país e área; o que é [F] e o que é [A];
as decisões de desenho (partidos nazistas, a perseguição aos judeus, reformas que a história não teve).

## 10. Exemplos do que o jogador consegue mudar

- Governador da Geórgia em 1950: aprova o fim da segregação no estado (chance ~12%, com custo de aprovação) — a barreira cai
  só na Geórgia; a lei federal de 1964 chega dizendo que lá já valia; a reforma pode ser derrubada nos anos seguintes.
- Prefeito de uma cidade mineira em 1915: escola primária para todas as crianças e água tratada — a criança da cidade deixa
  de trabalhar (a regra do trabalho infantil cai lá), a faculdade fica mais perto para a geração seguinte, a mortalidade
  infantil cai.
- Deputada no Japão de 1940 (sob a Lei de Preservação da Paz): o voto das mulheres com 8% de chance — a casa vota o que o
  regime manda.
- Militante do movimento sufragista britânico em 1910: a pressão soma; perto de 1918, pode antecipar a reforma; o risco era
  a prisão.

## 11. Testes

(preenchido com os números reais — ver abaixo)

## 12. Limitações conhecidas

(preenchido abaixo)

## 13. Próxima etapa

(preenchido abaixo)

## 14. Commits e publicação

(preenchido abaixo)
