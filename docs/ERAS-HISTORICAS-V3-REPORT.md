# VIDA · ERAS HISTÓRICAS v3 — outros países e o século XX inteiro

Branch `claude/eras-v3-internacional`, a partir da `main` em `7e0d485` (VIDA 27). Documentos irmãos:
`docs/eras/AUDITORIA-E-PROPOSTA.md` (auditoria de retomada e arquitetura v3, no fim), `docs/eras/FONTES.md` (seções 15–20,
novas), `docs/ERAS-HISTORICAS-V1-REPORT.md` e `-V2-REPORT.md`.

Manual Mestre de Diretrizes lido integralmente antes de começar. Um único agente, trabalho sequencial, sem subagentes.

Legenda: **IV** implementado e validado · **IN** implementado, não validado · **P** parcial · **N** não implementado
(planejado) · **B** bloqueado.

## 1. Resumo da auditoria

- A v1/v2 e a auditoria das eras modernas estavam inteiras na produção (`7e0d485`): só o Brasil, de 1970 a 2025, com
  49/49 testes de eras passando.
- O motor já tinha 27 perfis de países vivíveis: a época de um país foi construída como uma camada sobre o perfil dele.
- Travas encontradas: `Vida.era.pais` fixo em `'BR'`; moeda, séries e "mês histórico" sem país; tecnologias só com a data
  brasileira; o mercado de carros da época mostrava os modelos brasileiros em qualquer país (vazamento, corrigido); nada
  antes de 1970 (sem série de preços, sem mil-réis, sem eletricidade/geladeira/TV como tecnologia, sem roupa e carro antigos,
  sem mortalidade da época, sem guerras, sem regras de direitos); os pacotes `motor-textos` e `motor-dados` sem espaço.

## 2. O que já existia e foi preservado

Todo o desenho da v1/v2 (unidade interna em reais de hoje, moeda só na apresentação, portões de uma linha, normalizadores
idempotentes) e todo o conteúdo brasileiro de 1970–2025 (séries, moedas, Plano Collor, partidos, eleições, leis, metrôs,
moda, veículos, tecnologias, lembranças). Nada foi movido nem reescrito: o Brasil segue pelo mesmo caminho do motor
(`eras/ano.processarEra`), que agora também chama as partes comuns da v3. A vida contemporânea não muda (todo fator 1,
toda regra vazia — testado).

## 3. Períodos e datas

| | Situação |
|---|---|
| Brasil de 1900 a 1969 | **IV** — séries, mil-réis, cruzeiro de 1942, cruzeiro novo, 36 acontecimentos, Copas/Jogos de 1920–1968, presidentes, 18 lembranças, 7 décadas na escolha, regras sociais (voto feminino, mulher casada, Estado Novo, governadores indiretos, AI-5, trabalho infantil), a FEB |
| EUA, Reino Unido, Japão, Alemanha de 1900 a 2025 | **IV** |
| Argentina de 1945 a 2025 | **IV** — começa em 1945 porque a série oficial de preços (INDEC) começa em 1943 |
| Datas de nascimento | **IV** — país, década, ano, mês e dia (mês "ao acaso" continua possível; dia validado, inclusive 29 de fevereiro) |
| Calendário | **IV** — gregoriano em todos (oficial em todos esses países desde antes de 1900); no Japão, o ano da era do imperador (Meiji, Taishō, Shōwa, Heisei, Reiwa) no nascimento, na escolha e no painel |
| Século XIX e antes | **N** — ver §15 |

## 4. Países implementados e profundidade

| País | Acontecimentos | Regras sociais | Guerras | Lembranças | Moedas | Tecnologias | Veículos da época | Décadas |
|---|---|---|---|---|---|---|---|---|
| Estados Unidos | 59 | 14 | 4 | 26 | dólar | 45 | 20 | 13 |
| Reino Unido | 52 | 16 | 2 | 22 | libra £sd → decimal (1971) | 45 | 17 | 13 |
| Japão | 46 | 12 | 2 | 22 | iene (+ eras imperiais) | 45 | 10 | 13 |
| Alemanha (com a RDA) | 51 | 17 | 2 | 24 | marco → Reichsmark → DM / marco do leste → DM → euro | 45 (+ datas do leste) | 15 (4 do leste) | 13 |
| Argentina | 32 | 11 | 1 | 20 | m$n → peso lei → peso argentino → austral → peso | 45 | 14 | 9 |
| Brasil 1900–1969 | 36 + 14 esportivos | 9 | 1 | 18 | mil-réis → cruzeiro → cruzeiro novo | +7 da casa | 5 próprios + 5 compartilhados | 7 |

Cada país tem: séries de preços, renda, PIB e desemprego; governantes; salário mínimo quando existia; profissões e cursos
na data do país; mortalidade; acesso à universidade; painel "A época" próprio. Na Alemanha de 1945–1990, quem mora no leste
(Leipzig, Dresden; Berlim pelo lado da família) vive a zona soviética/RDA: outra moeda, outros carros (Trabant, Wartburg,
Schwalbe), outras tecnologias (telefone em casa raro até 1990), outras regras (lista única, polícia política), outros
acontecimentos (17 de junho, Muro, a reforma monetária do leste, a união monetária de 1990, o fechamento das fábricas).

Planejados (**N**): França, Itália, Espanha, Portugal, China, Rússia/URSS, México, Chile, Uruguai, Canadá, Austrália,
Índia, África do Sul. A arquitetura recebe um país novo como um arquivo de dados (ver §10).

## 5. Questões sociais e culturais representadas

Pesam na vida (uma vez, na idade em que pesam, só a quem pesam), com fonte e sem estereótipo: o voto que a mulher ainda não
tinha (e a candidatura impedida), a mulher casada que precisava de licença ou era demitida ao casar, o divórcio por culpa ou
inexistente, a segregação legal no Sul dos EUA (para quem tinha ancestralidade africana de um quarto ou mais, no Texas,
Flórida, Geórgia, Kentucky e Washington), a discriminação na moradia (redlining), a "barreira de cor" britânica, a relação
entre pessoas do mesmo gênero criminalizada (com as datas de cada país e região), o casamento igualitário (no Japão, ainda
não), o serviço militar e a convocação, os anos sem eleições livres, a censura e a perseguição (Estado Novo, AI-5, macartismo,
Lei de Preservação da Paz, nazismo, Stasi, ditaduras argentinas), o trabalho infantil, a escola obrigatória, a aposentadoria
e a saúde pública que ainda não existiam, a universidade para poucos (taxa de matrícula por país e ano). O Holocausto, as
leis de Nuremberg, a internação dos nipo-americanos, os desaparecidos da Argentina aparecem como fatos documentados, sem
mecânica de jogo em cima deles. Cultura: 132 lembranças por país, região, cidade ou campo e lado do país dividido.

## 6. Economia e moedas

- A moeda do mês em cada país, com as escritas antigas (o réis "1:250$000"; a libra "£3 4s 6d"); as trocas de moeda contadas
  na Linha da Vida, sem criar nem destruir dinheiro (testado).
- Efeitos especiais no dinheiro: hiperinflação alemã de 1923 (mês a mês pela cotação do dólar), a reforma de 1948 (oeste e
  leste), a união monetária de 1990, o congelamento japonês de 1946, a hiperinflação argentina de 1989, o Plano Bonex (1990),
  o corralito (2001).
- Renda da época pelo PIB real por pessoa; desemprego da série pesando nas contratações; salário mínimo legal (EUA desde 1938,
  Reino Unido desde 1999, Alemanha desde 2015) ou o piso de fato.
- **Padrão de consumo da época** (achado na simulação, corrigido): a cesta básica e a moradia acompanham a renda da época
  (fator renda^0,85; no Brasil, só antes de 1970, contínuo). Antes da correção, as vidas de 1905–1930 fora do Brasil tinham
  sobra mediana negativa aos 30 anos e 10–14% dos anos com dívida atrasada; depois, 0–5%, como as modernas.

## 7. Tecnologias e costumes

45 tecnologias com chegada, popularização e massificação por país (e pelo leste alemão), 7 novas da casa (luz elétrica, água
encanada, fogão a gás, geladeira, televisão, máquina de lavar, avião). Antes do telefone em casa, a vida se comunica por
cartas (aparelho próprio na interface). A peneira de texto ganhou as trocas de antes de 1970 (TV → rádio → jornal; telefone
→ carta; shopping → centro; supermercado → armazém; cartão → fiado) e passou a respeitar o país; os textos da própria época
não passam por ela. Roupa de todo dia de 1900 a 1969 (vestido comprido, terno, saia e blusa; o jeans só nos anos 1960);
objetos da época na escolha (carta, gramofone, rádio de válvula); 58 veículos da época com desenho próprio.

## 8. Mortalidade e guerras

Expectativa de vida e mortalidade infantil reais por país e ano (OWID/HMD/ONU; Destatis antes de 1950): as pessoas da vida
recebem o risco inteiro (perder um irmão ou um filho pequeno era comum), o protagonista metade do excesso adulto e nenhum na
infância (regra de jogo declarada). Causas de morte de antes dos antibióticos. Guerras: convocação na proporção histórica dos
homens da idade, a "frente" em casa quando os bombardeios começaram, a volta; o risco para os homens da família; catástrofes
locais (Kantō, Tóquio 1945, Hiroshima, Okinawa, Hamburgo, Dresden, Kobe) com o risco histórico de quem estava na cidade.

## 9. Interface

Tela Nascer: "Quando e onde você nasce" — país, década, ano, mês, dia e a prévia (contexto, sociedade, tecnologia, cultura,
dinheiro, o que a infância atravessa). Cabeçalho com a moeda do mês e, na Alemanha dividida, "Alemanha Ocidental/Oriental".
Painel "A época" de cada país. Tons por década de 1900 a 1960. Notas da versão "Eras 3".

## 10. Arquitetura e dados

Um pacote de dados por país (`src/motor/eras/paises/<id>/{serie,pacote}.ts`, um arquivo de build cada, 40–51 kB),
registrado em `eras/base/pacote.ts` e carregado com o mundo (`eras/paises/carregar`). Módulos novos na base: `pacote`,
`sociedade`, `regrasBR`, `mortalidade(Series)`, `veiculosMundo`; o ano dos outros países em `eras/v3/anoPais.ts`. Nenhum
dado novo nos pacotes cheios: `motor-textos` 799.645 B (igual), `motor-dados` 799.272 B, `Jogo` 796.761 B (limite de
800 kB respeitado). Os avisos de "circular chunk" do build são os 9 que já existiam na base (conferido).

## 11. Fontes

`docs/eras/FONTES.md` §15–20: Macrohistory Database (JST), Banco Mundial, Maddison Project, INDEC, Ipeadata/IBGE/FGV,
Statistisches Reichsamt, Our World in Data (HMD, ONU), Destatis, Barro & Lee e UNESCO; leis e acontecimentos com a fonte de
cada um (arquivos nacionais, parlamentos, cortes supremas, bancos centrais, museus). Aproximações marcadas como tal.

## 12. Testes e resultados

- **Novos**: `src/motor/__tests__/erasV3.test.ts` — 31 testes (datas e calendários, moedas e escritas antigas, hiperinflação,
  economia e consumo, tecnologia por país e leste alemão, veículos por mercado e desenho, segregação, casamento, eleições,
  guerras, universidade, mortalidade, integridade dos pacotes, Brasil 1900–1969, profissões e cursos, peneira e detector,
  saves e vida contemporânea). Todos passam.
- **Ajustados à intenção** (com comentário no teste): 3 testes de eras que fixavam 1970 como primeiro ano; o de salto do
  mercado em 2026 (medido no catálogo de hoje); o de preços de veículos (o catálogo de hoje, sem as versões da época); um de
  marcos da infância (o ano vem pronto).
- **Defeitos reais pegos pelos testes e corrigidos**: curso de análise de sistemas sem data de início; veículos da época sem
  desenho próprio (o teste de catálogo exige um por modelo — o Manual também).
- **Suíte completa** (233 arquivos; `--maxWorkers=3`): 3.139 testes passaram, 12 falharam. Das 12: 6 eram dos veículos e dos
  preços (corrigidos e repassados isolados: 60/60 e 13/13); 6 por tempo esgotado — `att3` e `rework115Esportes` passam
  isolados; `profissao` "clima péssimo" e `fixPosPlaytestHumano` "o resultado não é garantido" falham também na base
  `7e0d485` com o mesmo tempo (pré-existentes desta máquina); `fechamentoMundo` #4 e `motor.test` "regra de agência" são os
  timeouts fixos já registrados nas versões anteriores. A suíte travou no encerramento (padrão conhecido) depois de todos os
  arquivos reportarem; foi encerrada à mão. **A suíte inteira não foi rodada de novo depois das últimas correções** (só os
  arquivos afetados: eras 92/92, veículos 60/60, notas e CSS 21/21).
- **Simulações** (`scripts/sim/erasV3.ts`, vidas jogadas pelas estratégias até 70–85 anos): 3 rodadas, 6 países, coortes de
  1902 a 1980 — 0 crashes, 0 extratos que não conciliam; detector de anacronismos de 78 → 11 → (corrigidos) ocorrências.
- **Interface** (`scripts/playtest/erasV3.mjs`, build de produção): escolha de país/data em 6 países × 1440/390 px × claro/
  escuro e 8 vidas de 6 países: sem erro de console, sem rolagem lateral, sem NaN; o aparelho de cartas corrigido no celular.
  Galeria dos veículos (`scripts/playtest/galeriaErasV3Veiculos.tsx`) conferida.
- **Build** sem erros; **smoke de produção** 35/35.
- **Playtest humano**: não feito.

## 13. Compatibilidade com saves

`Vida.era` continua opcional; os campos novos (`dia`, `partilha`, `guerras`, `congelado`, `morte`) são opcionais e
validados pelo normalizador (malformados somem). Saves antigos (Brasil 1970–2025 e contemporâneos) abrem iguais; o
intervalo aceito passou a 1900–2025 (Argentina 1945). Testado: vida da Alemanha Oriental salva e reabre igual; época com
país desconhecido é descartada.

## 14. Problemas encontrados (e corrigidos)

Vazamento dos carros brasileiros para outros países; a peneira reescrevendo os textos da própria época; a "frente" da guerra
aparecendo antes dos bombardeios; profissões do futuro e ProUni para NPCs antes de existirem; nomes de imigração recente em
famílias de 1880; o aperto financeiro anômalo antes de 1960 (§6); "Rentenmark" no lugar de Reichsmark; o painel brasileiro
antes de 1970 (geladeira à venda em 1928, fonte errada da renda, preços relativos de 1995).

## 15. Limitações e pendências

- **Século XIX e antes: não implementado.** Exigiria séries de preços brasileiras anteriores a 1900 (a do deflator começa em
  1900), a escravidão e o Império no Brasil tratados com o cuidado devido, e instituições do motor (escola, trabalho
  assalariado, previdência) remodeladas — não cabia com qualidade nesta entrega. A arquitetura aceita (a JST cobre 1870+ para
  os quatro países).
- Os outros 13 países da lista de prioridade (§4).
- Carreiras esportivas: a data do profissionalismo vale para a vaga de emprego (`ocupacoes`), mas a entrada pelo esporte
  (`caminhos`) ainda não consulta a época.
- Política fora do Brasil: partidos genéricos dos perfis; só os períodos sem eleição e o voto feminino são aplicados.
- Okinawa sob administração americana (1945–1972) aparece como acontecimento e lembrança, sem a moeda de lá.
- Preços relativos por produto fora do Brasil: os do jogo, levados à época só pela renda e pelo padrão de consumo.
- Veículos: preço da época aproximado; motos e carros de luxo de hoje seguem pelo ano de lançamento.
- Playtest humano recomendado (tom, quantidade de lembranças, dificuldade financeira percebida em 1900–1940).

## 16. Commits relevantes

`c88d9e9` fundação internacional · `15111fe` Brasil 1900–1969, escolha, painel, roupa e carros, universidade · `ad22204` QA
(peneira, frente da guerra, nomes, aparelho) · testes `erasV3` · veículos com desenho próprio · padrão de consumo da época ·
`b088172` capotas e galeria · relatório (este).

## 17. Publicação

Ver a seção final, preenchida só depois de conferida em produção.
