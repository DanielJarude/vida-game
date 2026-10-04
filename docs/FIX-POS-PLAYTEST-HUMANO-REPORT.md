# FIX pós-playtest humano — VIDA VIVIDA / MUNDO / ROTINA / PESSOAS / APARÊNCIA / MATERIALIDADE

## 1. Resumo

O playtest humano depois do FIX pós-REWORK 4 encontrou um jogo em que vários sistemas ainda paravam em ESTADO → BOTÃO.
Este FIX levou-os a ESTADO → VERBO CONTEXTUAL → AÇÃO → CENA → CONSEQUÊNCIA → MEMÓRIA → NOVAS POSSIBILIDADES, corrigindo
cada problema **na fonte de verdade** e auditando os consumidores:

| Antes | Depois |
| --- | --- |
| "Tudo ao acaso" = Brasil | sorteia país → cidade → sobrenome → nome no mundo vivível (17 países em 30 sorteios; offline também) |
| rosto genérico | 9 traços novos herdáveis e visíveis; parentes se parecem mais que estranhos, por gerações |
| cirurgia = pontos | a clínica muda o retrato; a genética (`genes`) não muda — o filho herda o nariz de nascença |
| cinema = barra que sobe | microcena contextual (13 tipos de acontecimento), sem repetir o tipo com a mesma pessoa |
| amiga de anos sem caminho romântico | "Demonstrar interesse": a resposta é da outra pessoa (recíproco, surpresa/tempo, só amizade, outra pessoa…) |
| ficha = painel de 10–20 botões | "O que faz sentido agora" (≤ 3, pelo contexto) + grupos recolhidos (nada some) |
| "Cabe" × "caberia com mais tempo" na mesma tela | uma conta só (`semana.encaixe`): folgada · ocupada · cheia · sobrecarregada · além |
| "professora de português" no Japão | matérias da língua de onde se estuda (fonte única `mundo/materias`) |
| técnico = Mecânica/Eletrotécnica/Administração | instituições com identidade, rota por país, catálogo próprio (181 catálogos em 190 escolas) |
| "Viver mais um ano" cobrindo a Formação | no fim da página, no fluxo |
| carro com "LED" verde | a lataria É da cor; 8 silhuetas de carro (compacto ≠ hatch ≠ SUV…) |
| "x" e "o" soltos na ótica | colisão de classe CSS corrigida na origem + auditoria de CSS |

**Save:** continua v20. Tudo o que é novo é opcional e validado (`save.validarPlaytestHumano`).

## 2. Commit base

`50aa532` (APK do FIX pós-REWORK 4), branch `claude/fix-pos-rework3-playtest`. Sem merge em `main`, sem force-push,
sem deploy manual, sem segredos, `.claude/` fora do commit. Não é o ATT4.

## 3. Arquivos e sistemas principais

| Tema | Fonte (motor) | Tela |
| --- | --- | --- |
| Nascimento ao acaso | `criacao.sortearNascimento`, `previaDoNascimento`, `corteCoerente` | `telas/Criacao.tsx` |
| Aparência 2.0 / genética | `sistemas/identidade` (`UNIVERSAIS`, `geneticaDe`, `guardarGenes`, `genesDe`, `tracoUniversal`, `estagioDaCalvicie`), `tipos.Genes` | `avatar/Retrato.tsx`, `avatar/cabelos.tsx` (novo), `avatar/cores.ts` |
| Cirurgia | `sistemas/estetica` (novo), ação `{ tipo: 'estetica' }` | `Lugares.ClinicaEstetica`, Vida · Compras |
| Microcenas | `sistemas/microcenas` (novo, pacote `motor-vida`), `juntos` | o popup de resultado |
| Romance | `interacoes.demonstrar_interesse`, `prioridadesDaFicha` | `Pessoas.FichaPessoa` |
| Rotina | `sistemas/semana` (`encaixe`, `folegoDaSemana`, `FaixaDaSemana`) → `rotinas`, `sobrecarga`, `leituraDoEstresse` | `Tempo.tsx` |
| Matérias | `mundo/materias` (novo) → `escola`, `formacao`, `naFormacao`, `vidaEstudantil`, `conteudo/vivida`, `conteudo/mundo`, `dados/frentes`, `concurso` | Formação, Linha da Vida |
| Formação técnica | `sistemas/ensinoTecnico` (novo), 9 cursos novos em `dados/cursos` | Formação |
| Redes | `redes.ecoDoPost` | Tempo livre · Redes sociais |
| Veículos | `dados/bens` (forma `compacto`), `Desenhos.estiloDaLataria` | lojas, Pertences, Casa |
| Navegação | `navegacao.MAPA_DE_INTENCOES` (+ romance, + cirurgia) | menu "Onde fica cada coisa" |

## 4. "Tudo ao acaso"

**Causa:** `tudoAleatorio` sorteava a cidade *dentro do país atual* (comentário: "o país é uma escolha grande demais para
o dado"), e a tela começava em Salvador. O nome e o sobrenome padrão eram brasileiros.

**Agora** (`criacao.sortearNascimento`): país entre os vivíveis (peso `população^0,3` — a Índia aparece mais que a Nova
Zelândia, mas a Nova Zelândia aparece) → cidade pelo tamanho (`sortearMunicipio`) → sobrenome pelos grupos de nomes do
lugar (que incluem famílias de outras origens que vivem lá) → nome pela tradição do sobrenome. Origem e aparência **não**
saem daqui: saem dos pais (`familiaInicial` lê a tradição do sobrenome; o bebê herda). Antes de sortear, a tela espera
os pacotes do mundo (`carregarMundo`, do cache offline). O corte sorteado combina com a textura que veio dos pais.

O outro "ao acaso" da tela (classe social) já usava a distribuição do país. Teste: 120 sementes → ≥ 15 países, ≥ 5
regiões, Brasil < 20%; cidade existe, é do país e o país é vivível; reabrir preserva (estatístico **com sementes fixas**,
não frágil). Na tela, 12 cliques com `Math.random` semeado → ≥ 4 países. Offline real: França, Coreia do Sul, Quênia,
EUA, Brasil, Angola, Japão, Costa Rica em 8 cliques.

**Retratos do Nascer (item 21):** "Você" (bebê, aos 9, aos 30, aos 75) e, com "Puxar os traços dos pais", "De quem vêm
os traços": a mãe e o pai. A prévia é o **mesmo nascimento** que "Nascer" cria (a semente passou a ser da tela;
`previaDoNascimento` — antes, o bebê que nascia não era o da prévia).

## 5. Aparência 2.0 — genética e identidade familiar

Nove traços novos, todos **visíveis** no retrato: tamanho e distância dos olhos, forma da sobrancelha (reta, arqueada,
angulosa), largura da boca, queixo (marcado desenha a sombra), orelhas (de abano saem e inclinam), linha do cabelo (reta,
em bico, alta — muda a testa de todos os cortes), sardas e **calvície herdada** (antes era um sorteio do retrato; agora
passa de pai para filho e desenha entradas e depois a coroa). O nariz ganhou "curvo" e "pequeno".

**Sem estereótipo:** os traços novos são `UNIVERSAIS` — o mesmo peso em toda origem (nacionalidade, país e "raça" não
decidem orelha, olho ou queixo). Única exceção física: a sarda depende da pele clara. Os novos valores do nariz têm o
mesmo peso em todas as origens. Os traços de antes continuam pela ancestralidade/origem familiar.

**Herança:** cada traço vem de um dos pais (às vezes de mais longe); migrar não muda nada; adotado não herda. Medido
(`scripts/sim/identidade.ts`, 40 famílias, 16 traços):

| Par | Traços em comum |
| --- | --- |
| pai/mãe → filho | 64,9% |
| irmãos | 63,9% |
| avô/avó → neto | 50,1% |
| pais adotivos → adotado | 43,9% |
| desconhecidos do mesmo lugar | 43,2% |

Com o instrumento do REWORK 4 (só os 9 traços de antes): filho 64,0% (base 65,5%), irmãos 60,9% (62,9%), neto 47,9%
(50,4%), estranhos 39,8% (40,7%). A leve queda vem do nariz com 6 valores (menos coincidência ao acaso); a distância entre
parente e estranho se manteve.

## 6. Cabelos

Redesenho completo em `avatar/cabelos.tsx`, princípio "reconhecível antes de ler o nome": raspado (rente, pele
aparecendo), curto (topo texturizado e costeleta), curto de lado (risca e franja varrida), **topete** (novo: volume alto),
ondulado (até a orelha, ondas), crespo curto (alto e redondo, laterais rentes), cacheado (cachos em volta), black (coroa
grande), **dreads/locs** (novo: cordões até o ombro), tranças (duas tranças em gomos, com elástico), longo liso (risca no
meio, painéis retos), longo ondulado (risca de lado, ondas), cacheado longo (cachos emoldurando), chanel (franja reta,
corte reto no queixo), **pixie** (novo: curtinho, franja longa de lado), rabo (aparece atrás, com elástico), coque (alto).
Criança usa a versão curta dos longos; a linha do cabelo herdada muda a testa; calvície herdada desenha entradas e coroa.
Conferido numa galeria (`scripts/playtest/galeria.tsx`: cortes × idades, traços um a um, famílias) — dois defeitos
achados e corrigidos (o traço do raspado parecia uma faixa; os cachinhos do crespo curto flutuavam).

## 7. Genética original × aparência atual × adquirido

`Visual` é o que se vê **agora**; `genes` (Pessoa e Personagem, opcional) guarda o de nascença quando o corpo mudou.
`geneticaDe(p)` é a fonte única da herança (genes, ou o visual com a cor natural do cabelo — a tinta nunca passa) e todos
os pontos de nascimento foram trocados para lê-la (criação: irmãos, avós, tios, primos; `familia`: irmão mais novo e o
bebê do jogador; `filhos`: netos e bisnetos). A sucessão leva os genes (quem morreu vira pessoa da família com os genes;
quem continua leva os seus). Preparado para tatuagem, cicatriz, barba, tinta: tudo o que for "adquirido" mexe no visual e
nunca nos genes.

## 8. Cirurgias (Vida · Compras → "Você" → Clínica de cirurgia plástica)

Rinoplastia (afinar / diminuir / corrigir o dorso), otoplastia (só se as orelhas são de abano), blefaroplastia (pálpebra
caída, ou ≥ 45), lifting (≥ 45: as rugas somem por ~10 anos e voltam), transplante capilar (só quando a calvície já
aparece — a mesma conta do retrato) e preenchimento labial (passa: em 18 meses a boca volta à da genética,
`processarEstetica`). Lipoaspiração ficou de fora: o retrato não desenha o corpo.

Fluxo: clínica (popular, boa, renomada: preço × mão × risco) → a **prévia** (como está → como deve ficar) → decisão →
resultado: **satisfatório, neutro, abaixo do esperado ou complicação** (risco cresce com idade ≥ 60, saúde < 65, fumo;
preço alto melhora as chances, não garante; o popular costuma dar certo) → recuperação (bloqueia novo procedimento) →
autoimagem, cabeça e saúde → a parceria repara (ou cuida, na complicação) → Linha da Vida → revisão pela metade do preço
quando o resultado foi ruim (até 5 anos). Idade mínima 16/18/25/30/40, saúde ≥ 45.

## 9. Microcenas

`sistemas/microcenas.viverCena`: AÇÃO → CONTEXTO → TIPO → REAÇÃO → CONSEQUÊNCIA → TEXTO → MEMÓRIA. Cada programa
(`juntos`: cinema, jantar, show, estádio, parque, cozinhar, caminhar, fim de semana, jantar a dois) descreve o LUGAR (o que
se vê, do que se discorda, os micos dali, o ponto alto, o ruim); o acontecimento é escolhido pelo contexto: como foi
(afinidade, jeito, tensão, sorte), idade (criança tem repertório próprio — birra, a pergunta impossível), relação, o que
você **sabe** e o que falta saber, o dinheiro, quem mais mora na cidade, o histórico de vocês naquele programa.

13 tipos: noite comum, adorou, discordaram (do filme, do jogo, da banda), conversa séria (do que a vida da pessoa tem
agora — o luto, o emprego, a escola), **revelação** (o fato entra no que você sabe — `conhecimento.revelar`),
**lembrança** (a cidade natal que você já sabia volta à conversa: "Yua era de Hiroshima" vira história), encontro com um
conhecido (que também se aproxima), mico (do lugar: o garçom é do restaurante, não do cinema), dinheiro curto, pessoa
distante, piada interna (vira "coisa de vocês"), briga, a noite em que a amizade subiu de nível, a **faísca** (sinal
verdadeiro de interesse — só acontece se a outra pessoa realmente tem interesse). Toda cena abre o popup com título
("Cinema com Yua").

## 10. Antirrepetição

`Vinculo.cenas`: as marcas das **últimas 4** cenas (ids curtos — "comum.2" —, nunca texto). O tipo da última não volta;
os das quatro últimas pesam 0,3; a noite comum não repete a variação recente. Sorteio derivado (`rngDe`): não mexe no
acaso do resto da vida. Linha da Vida só recebe biografia (a amizade que começou de verdade, a briga que marcou); a noite
comum não vira registro (teste). Medido (`scripts/sim/repeticaoCenas.ts`, 30 amizades × 8 anos): **0** repetições do mesmo
tipo em sequência com a mesma pessoa; 13 tipos; 112 moldes em 240 cenas; o molde mais frequente em 3,3%.

## 11. Romance a partir da amizade

**Causa:** o flerte é para quem mal se conhece (proximidade < 35), o "dizer o que sente" exige amigo ≥ 55 — e ambos se
escondiam quando a outra pessoa "não se interessaria" (orientação, compromisso). O jogador nem conseguia tentar.

**Agora:** `demonstrar_interesse` (grupo "Algo mais" da ficha) para amigo, amigo próximo ou colega (≥ 30), com as regras
de sempre (idade, família não, você sem parceria, uma história de cada vez, não logo depois de um não) — mas **sem
esconder** pela orientação ou compromisso da outra pessoa: a resposta diz. Resultado por `interesseDoOutro` (proximidade,
confiança, história, tensão, o momento dela, a faísca de uma noite junto): recíproco → romance "interesse" e o próximo
passo aparece como prioridade ("Chamar para sair" → saindo → namoro); surpresa → pede tempo (resolvido depois); "gosta de
você, mas não desse jeito"; está com outra pessoa; não é o momento; prefere a amizade (dias esquisitos, a amizade fica).
Teste: em 24 tentativas, nem 0 nem 24 retribuídas; com orientação incompatível, nunca vira romance e a amizade fica.

## 12. UX de Pessoas

`interacoes.prioridadesDaFicha`: a mesma lista de sempre lida pelo contexto → até 3 ações e o porquê ("Vocês estão
estremecidos.", "Tem alguma coisa entre vocês.", "Criança quer tempo junto, não conversa.", "mora longe"). A ficha: quem é
(retrato, relação, contexto) → **O que faz sentido agora** → "Fazer juntos · Conversar · Cuidar e ajudar · Algo mais · A
relação", recolhidos com a contagem (`<details>`, acessível) → o que você sabe, coisas de vocês, o que viveram juntos.
Nenhuma ação foi removida.

## 13. Rotina: capacidade, sobrecarga e estresse

**Causa da contradição:** três contas diferentes na mesma tela — a palavra "Cabe" vinha dos *pontos* de sobrecarga; o
"Dá para assumir mais?" testava sempre meio pedaço contra o teto humano; a lista proibia o "tentar mesmo assim" para
menores de 16 e para níveis 2–3. Caso real do playtest (15 anos, técnico integral + bola "a sério"): painel "Cabe. Dá para
assumir mais" e **todas** as atividades em "caberia com mais tempo".

**Agora:** `semana.encaixe(v, extra)` é a fonte única — da lista (`podeComecarRotina`), do painel (`folegoDaSemana`), da
palavra (`leituraDaSobrecarga.palavra`), do título, da faixa desenhada, do cansaço do ano (`processarRotinas`) e de
`cargaHumana`. TEMPO ≠ SOBRECARGA ≠ ESTRESSE:

- **folgada** (≥ 1 pedaço livre) e **ocupada**: entra normalmente;
- **cheia** (até ¾ de pedaço além do confortável): entra, saindo do descanso e do lazer;
- **sobrecarregada** (até o teto humano): entra com o custo dito (estresse, sono, notas, trabalho) — o mundo cobra depois;
- **além**: só aqui bloqueia, com o porquê concreto (o que ocupa os dias e o que largar). Criança (< 12) não "estoura" por
  escolha: a semana dela enche, não passa — e o motivo diz a idade, não um número.

A terapia continua cabendo no teto (e o painel diz isso). Nada de energia/pontos de ação.

## 14. Calibração automatizada (`scripts/sim/rotinaCalibracao.ts`, 6 vidas por perfil, 4 anos)

| Perfil | Faixa | Leve ainda entra? | Estresse (início → 4 anos) | Desempenho (início → 2 anos) | Saúde | Largadas | Casa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| escola apenas (13) | folgada | 100% | 25 → 27 | 50 → 49 | 89 | 0.0 | 75 → 75 |
| escola + hobby (13) | folgada | 100% | 25 → 27 | 50 → 50 | 90 | 0.0 | 75 → 76 |
| escola + esporte + hobby (14) | folgada | 100% | 26 → 18 | 49 → 48 | 88 | 0.0 | 76 → 76 |
| técnico integral + esporte (15) | ocupada | 100% | 28 → 26 | 49 → 46 | 90 | 0.0 | 75 → 75 |
| técnico + esporte + hobby (15) | ocupada | 100% | 28 → 25 | 49 → 46 | 89 | 0.0 | 75 → 70 |
| faculdade + estágio (20) | folgada | 100% | 27 → 54 | 60 → 51 | 83 | 0.0 | 0 → 60 |
| trabalho + faculdade (24) | ocupada | 100% | 28 → 60 | 60 → 64 | 84 | 0.0 | 0 → 73 |
| trabalho + filhos (32) | ocupada | 100% | 41 → 56 | 60 → 48 | 78 | 0.0 | 70 → 69 |
| trabalho + filhos + hobby (32) | cheia | 100% | 41 → 59 | 60 → 65 | 78 | 0.5 | 70 → 69 |
| rotina pesada + corrida (28) | ocupada | 100% | 38 → 58 | 60 → 55 | 81 | 1.0 | 0 → 74 |
| várias atividades leves (16) | ocupada | 100% | 26 → 33 | 51 → 13 | 87 | 0.0 | 74 → 73 |
| muitos compromissos pesados (27) | alem | 0% | 38 → 72 | 60 → 48 | 80 | 1.0 | 70 → 70 |

("várias atividades leves (16)": o desempenho do 2º ano já é o da etapa seguinte à escola — artefato da medida, não da rotina.)

Leitura: a escola sozinha é folgada; esporte "a sério" e técnico integral enchem a semana, mas o esporte **alivia** (o
estresse cai); trabalho + faculdade e trabalho + filhos sobem o estresse ao longo dos anos (plausível, sem bloquear);
o perfil artificial de compromissos impossíveis (trabalho + faculdade integral + bebê + dois hobbies a sério) é o único
"além" — e é o único em que nada leve entra.

## 15. Resíduos Mundo

**"A professora de português, Asuka":** não era uma frase, eram **seis tabelas de matérias** com "português" fixo (o
professor que repara — `formacao.MATERIA_PROF` —, os verbos do ano letivo, os momentos da escola, o professor marcante de
`conteudo/mundo`, a frente "português e redação" com "se vira em português", a prova do concurso). Fonte única
`mundo/materias`: a língua da escola é a do país onde se **estuda** (a residência); português só onde é a língua da escola
(Portugal, Angola, Moçambique…); a língua estrangeira não é "inglês" onde o inglês já é a língua da escola. Teste H: três
vidas no Japão até os 19 → nenhum "português"/"redação" na biografia, nas histórias e nas profissões das pessoas.

**Brasileirismos invisíveis** (auditoria ampliada — `vazamentos.ts` agora procura matéria em português fora de país
lusófono, merenda/pelada/churrasco, o trio técnico e normas "NR-"): "Pelada no campinho" (a descrição de Jogar bola) e
"Pelada, por diversão" → no resto do mundo, a bola na rua; "a horta que abastece a merenda" → o refeitório; "Eletricista
instalador (NR-10)", "capacitação exigida pela NR-11" e os fundamentos NR-10/NR-11 das profissões → só no Brasil (a busca
de curso pelo nome ignora o parêntese, para não quebrar a família). Achado pelas capturas, não pela auditoria: a NR-10
aparecendo na Formação do Japão.

## 16. Formação técnica

`sistemas/ensinoTecnico`: país → **rota** (o médio integrado e o instituto federal no Brasil; o kōsen e o senmon gakkō no
Japão; a formação dual na Alemanha/Áustria/Suíça; o lycée professionnel; o istituto tecnico; a FP espanhola; o college
britânico; o CTE/community college nos EUA; TAFE; CONALEP/CETIS; escuela técnica; liceo técnico-profesional; ITI;
politécnicos; TVET; genérica nos demais) → cidade (quantas escolas: metrópole 4 … pequena 1) → **instituição** com perfil
(indústria, tecnologia, gestão, saúde, agro, hotelaria, criativa, construção, politécnica — a cidade pequena puxa o agro,
o litoral a hotelaria, o polo a indústria) e **catálogo próprio** derivado da cidade e do índice (`rngDe`): a mesma escola
mostra sempre o mesmo catálogo; duas escolas da mesma cidade, catálogos diferentes. A escolha guarda a escola
(`EscolaBasica.integradoInst`); saves antigos continuam ligados à escola de antes.

Cursos novos (todos com área que abre trabalho real em `ocupacoes`): Desenvolvimento de Sistemas, Redes, Eletrônica,
Mecatrônica, Contabilidade, Design Gráfico, Produção Audiovisual, Alimentos, Hospedagem. O pós-médio também vem das
escolas da cidade (ou da capital; nenhuma das duas → não há porta presencial) e a matrícula leva o nome da escola. A
seleção do integrado só aparece onde há escola pública que junta o médio.

Medido (6 países × 10 cidades, 190 escolas): **181 catálogos diferentes**; o trio inteiro em 5 escolas (2,6%);
informática/desenvolvimento em 102. Teste I detecta se o trio voltar a dominar (≥ 15%) ou se a variedade cair.

## 17. "Viver mais um ano"

Estava `position: fixed` por cima de todas as páginas (a Formação, a mais longa, era a pior). Agora é o **último elemento
do `<main>`**, no fluxo, separado por um fio — "terminei o que queria fazer neste ano". No celular, o fim da página reserva
a altura da barra de áreas e a área segura. Conferido nas capturas: em todas as páginas, a 1440/820/390, o botão no fim
não cruza nenhum controle visível nem é coberto pela barra. Teste de tela: o botão é o último filho do `<main>` e o CSS
não o fixa.

## 18. Redes sociais

Preservado tudo o que o playtest aprovou (as 7 plataformas, seguidores, engajamento, credibilidade, monetização,
impulsionar, histórico de 8, quem reagiu). **Repetição:** o post comum de quem é desconhecido devolvia sempre o mesmo
acontecimento ("N viram; X novos; reagiram: …"). Agora tem **eco** (`redes.ecoDoPost`, metade das vezes — post comum é
comum): a mãe comentando em público, o colega que puxa o assunto no café (e se aproxima), o estranho gentil, o comentário
maldoso, as perguntas da receita/da viagem, e **degraus de crescimento**: a permuta da loja pequena (≥ 1,5 mil), a
colaboração com uma conta maior (≥ 8 mil: seguidores reais), o repost sem crédito. O eco não repete o anterior da mesma
conta (`ContaSocial.ecos`, 3 ids). Os demais caminhos de evolução (viral, monetização, verificação, carreira de criador,
fama, polêmica, política) seguem.

## 19. Materialidade dos veículos

**Causa do "LED":** a lataria só ganhava cor por um seletor CSS de atributo (`[fill-opacity="0.14"]`), o contorno e o
vidro eram creme e ocupavam boa parte do desenho; na moto, só o tanque era "lataria". **Agora** a cor pertence ao desenho:
`estiloDaLataria(cor)` põe `--lataria` (opaca), vidro escuro, pneu escuro com cubo metálico e contorno escuro **da própria
cor** (claro só para o quase-preto). Motos ganharam carenagem/rabeta/para-lamas na cor; a bicicleta pinta o quadro.
Silhuetas: **compacto** (novo: Kwid, Mobi, C3 — curto, alto, roda pequena), hatch, sedã, SUV, SUV médio, SUV de sete
lugares, picape, esportivo. A semente da proporção passou a ser a **versão** (antes, a classe: todos os compactos iguais).
O pontinho e o nome da cor ficam como redundância. Preservado: desgaste no desenho, cor persistente após a compra, usos em
Pertences, migração, venda.

## 20. O "x" e o "o" na ótica

**Causa:** a classe `.selo` existia em três folhas de estilo; a do selo de verificação das redes (`agir.css`) fixava
18×18 px e venceu: o "luxo" do item ficou espremido num círculo de 18 px e quebrou letra a letra — "l", "u" sobre o título;
"x", "o" entre a descrição e o botão. O mesmo vazamento atingia os selos da Casa. **Correção:** o selo das redes virou
`.selo-verificado`; o "luxo" virou `.etiqueta-luxo`. **Regressão:** teste de tela (a etiqueta é um elemento inteiro; nenhum
texto de um caractere solto nas ofertas) e **auditoria de CSS** (nenhuma classe-raiz nova definida em dois arquivos — as 6
redefinições conhecidas ficam listadas). As capturas conferem caracteres soltos em todas as lojas.

## 21. Testes causais (`src/motor/__tests__/fixPosPlaytestHumano.test.ts`, 30; `src/ui/__tests__/fixPosPlaytestHumano.test.tsx`, 10)

- **A** Tudo ao acaso: 120 sementes → países, regiões, cidades válidas; a prévia é o mesmo nascimento.
- **B** Genética: traços dos pais, irmãos não clones, parentes > estranhos, netos; nascer → reabrir; migrar não muda.
- **C** Cirurgia: nariz curvo → fino no retrato, genes curvo; **o bebê de quem operou é idêntico (mesma semente) ao de quem
  não operou**; resultados variados (satisfatório, neutro, abaixo, complicação); orelha que não é de abano e menor de idade
  não operam.
- **D** Microcena: cinema por 6 anos → título, texto concreto, a relação muda, o tipo não se repete em seguida, textos
  diferentes, reabrir guarda as marcas; revelação entra no que se sabe; a cidade natal volta (lembrança); a noite comum
  não vira Linha da Vida.
- **E** Romance: o verbo aparece no lugar certo; resultado não garantido; orientação incompatível nunca vira romance;
  retribuiu → "chamar para sair" é a prioridade; reabrir.
- **F** Rotina cheia: dá para assumir com custo → entra → o alvo do estresse sobe → reabrir. **Transversal:** em dezenas
  de semanas (idades 9–34, 0–7 atividades), o painel diz "teto" ⇔ nenhuma atividade leve é selecionável por tempo.
- **G** Impossível de verdade: bloqueia com o que ocupa os dias e o que largar; a terapia continua possível; criança: o
  motivo é a idade.
- **H** Japão: nenhuma matéria em português; a fonte única por país.
- **I** Técnico: variedade, catálogo estável por escola, rota do país no nome; seleção no Japão → escola com nome → reabrir.
- **J** Veículo: compra um compacto colorido → a cor fica → usar não repinta → reabrir.
- **K** Sucessão: a mãe operou; o filho continua com o rosto dele; quem morreu vira pessoa da família com os genes de
  nascença; redes não herdadas; reabrir.
- **L** Offline: passo 3d do `scripts/pwa/offline.mjs` (seção 28).
- Telas: Tudo ao acaso (vários países), os rótulos dos retratos, a ficha (prioridades, grupos recolhidos, "Algo mais"), a
  cena do cinema, a semana coerente, a clínica (antes→depois, risco, a genética fica), a lataria colorida, a ótica sem
  caracteres soltos, a auditoria de CSS, o avançar no fim do `<main>`.

## 22. Playtest adversarial de intenção (`scripts/sim/agirHumano.ts`: 17/17 sem falha)

| Pergunta | Onde | Ação | Consequência | Falha |
| --- | --- | --- | --- | --- |
| Quero nascer fora do Brasil aleatoriamente. Consigo? | Nascer → "Tudo ao acaso" | 30 cliques (sementes) | 17 países: ZA, CO, US, AR, CA, DE, PE, JP… | — |
| Quero criar alguém com traços familiares distintos. Consigo? | Nascer → "Puxar os traços dos pais" (a mãe e o pai aparecem) | nascer com pais de origens diferentes | cada filho combina os dois: largo/redondo/redondo · largo/puxado/oval · medio/puxado/redondo | — |
| Consigo perceber que dois irmãos são parentes? | Pessoas → o retrato | comparar irmãos e um estranho do mesmo lugar | irmãos dividem 4/8 traços do rosto; um estranho, 3/8 | — |
| Quero fazer uma rinoplastia. Onde começo? | Vida · Compras → "Você": a clínica de cirurgia plástica | Rinoplastia → Afinar (clínica renomada) | neutro: "Ficou bem feito — e mais discreto do que você imaginava. Quem não sabia não reparou. Você …" | — |
| A cirurgia mudou meu rosto? | Você / o retrato | olhar o retrato depois | nariz: curvo → fino (genes: curvo) | — |
| Meu filho herdou minha genética ou minha cirurgia? | Pessoas → o filho | ter um filho depois da rinoplastia | a herança leu os genes (curvo); o bebê nasceu com nariz fino | — |
| Quero ir ao cinema com minha amiga. Acontece alguma coisa além de +vínculo? | Pessoas → o rosto da pessoa: "Fazer juntos" (cinema, jantar, parque, ensinar, viajar) | "Cinema com Júlia" | cena "revelacao": "Na saída do cinema, entre uma coisa e outra, Júlia contou de si o que você não sabia. Júlia nasceu e…" (proximidade 62 → 68, confiança 70 → 73) | — |
| Quero tentar transformar amizade em romance. Onde faço isso? | Pessoas → o rosto da pessoa: "Algo mais" (demonstrar interesse — a resposta é dela) | "Demonstrar interesse em Ayla" | interesse (recíproco): "Ayla entendeu antes de você terminar a frase — e não fugiu do assunto. Depois de 10 anos d…" | — |
| Estou com a semana cheia, mas quero insistir em teatro. Posso? | Tempo livre · Hobbies | Começar teatro | permitido: "Sua semana já está cheia: médio integrado ao técnico, jogar bola e tocar um instrumento. Dá para assumir — mas passa do que cabe: o descanso some e a cabeça cobra (estresse, sono, notas, trabalho)." — painel: "cheia. Dá para assumir mais, mas a semana já passa do que cabe: cada coisa nova cobra estresse, sono e desempenho." | — |
| Por que minha semana está cheia? | Tempo livre · A semana → "Como a semana se divide" | abrir a faixa da semana | faixa cheia: Médio integrado ao técnico (dia inteiro) (0.75), Jogar bola — treino de base, todo dia (2), Tocar um instrumento — aulas de instrumento (1) | — |
| Estou no Japão. Minha escola parece japonesa/contextual ou brasileira traduzida? | Formação → a instituição, as atividades de lá, os cursos possíveis | viver até os 16 em Saitama | escola: Escola Secundária nº 35; "português" na história: não | — |
| Quero fazer curso técnico de informática. Essa possibilidade pode existir? | Formação → a preparação e os cursos | 190 escolas técnicas em 6 países | 102 oferecem informática/desenvolvimento (ex.: Kōsen de Tóquio (colégio técnico nacional): 4 cursos) | — |
| A escola técnica sempre oferece os mesmos três cursos? | Formação → a preparação e os cursos | comparar catálogos | 181 catálogos diferentes em 190 escolas; o trio inteiro em 5 | — |
| Meu carro verde parece realmente verde? | Vida · Compras → concessionária, usados, motos e bicicletas | olhar a vitrine | a lataria do desenho recebe a cor do anúncio por estilo próprio (--lataria, opaca); contorno escuro da própria cor; vidro escuro. Cores na vitrine: azul, verde-escuro, amarelo, vinho, bege, prata | — |
| Consigo distinguir um hatch de um SUV? | Vida · Compras → concessionária, usados, motos e bicicletas | comparar as silhuetas da vitrine | formas na vitrine: compacto, hatch, seda, suv, suv_medio, suv_grande, picape, esportivo (cada uma com a sua silhueta — teste de desenho) | — |
| Algum botão cobre conteúdo? | todas as áreas | "Viver mais um ano" e as capturas 1440/820/390 | o botão mora no fim do <main>, no fluxo (sem position: fixed); conferido nas capturas (sobreposição com outros controles: 0) | — |
| Alguma loja mostra caracteres estranhos? | Vida · Compras → lojas | abrir a ótica (o item de luxo) e as outras lojas | "luxo" é uma etiqueta própria (a classe .selo das redes deixou de vazar); itens de luxo: 5; teste de tela confere que nenhum texto de 1 caractere solto aparece | — |

Observações honestas: na resposta do filho da rinoplastia, o bebê sorteado nasceu com nariz "fino" — não da cirurgia
(a herança leu "curvo" dos dois pais), mas dos 12% de traço "de mais longe" (a ancestralidade). O teste C prova a causa
sem sorteio: o bebê de quem operou é idêntico ao de quem não operou. A diferença entre irmãos e estranhos no rosto é
real, mas modesta (4/8 × 3/8 nessa amostra; 63,9% × 43,2% na métrica de 40 famílias).

## 23. Repetição antes/depois (`scripts/sim/repeticao.ts`, 24 vidas × 30 anos, 6 países — a base rodada de novo na mesma máquina)

| Medida | Base `50aa532` | FIX |
| --- | --- | --- |
| Frases idênticas em outra vida | 22,2% | **21,7%** |
| Moldes em ≥ metade das vidas | 8 | 8 |
| Acontecimentos em ≥ 80% das vidas | 5 | 5 |
| Semelhança média entre vidas | 6,6% | 6,6% |
| Semelhança máxima entre duas vidas | 14,5% | 14,5% |
| Pares muito parecidos (≥ 50%) | 0 | 0 |

Sem regressão. As microcenas e a escola técnica não aparecem nas vidas dos sims (as estratégias não vão ao cinema) — por
isso a medida própria das microcenas (seção 10) e a da variedade técnica (seção 16). As frases mais repetidas seguem as
mesmas do relatório anterior (a chuva de verão ×10, a escola particular ×9): pendência conhecida.

## 24. Mundo

`scripts/sim/vazamentos.ts` com os termos novos: **0 achados** em 16 países (BR, JP, US, GB, NG, DE, FR, AR, MX, IN, KR,
AU, NZ, ZA, PT, CO) × 2 vidas inteiras (idade final média 65). A primeira rodada achou 1 (a "pelada" no Japão) —
corrigido. A captura da Formação no Japão achou a NR-10 — corrigido e incluído na auditoria. Separação: país de
nascimento ≠ nacionalidade ≠ residência ≠ ancestralidade (testes B, H, K e o de `rework4`): escola segue a residência,
nomes seguem a origem familiar, a genética não muda com a migração.

## 25. Desempenho (`scripts/sim/desempenho.ts`, 24 vidas até 50 anos, base rodada de novo na mesma máquina)

| | Base `50aa532` | FIX |
| --- | --- | --- |
| Tempo por ano simulado | 11,07 ms | **10,92 ms** (10,78 ms na rodada final) |

O relatório anterior media 10,30 ms em outra condição de máquina; comparado na mesma, não houve regressão. O
`structuredClone` por transação continua sendo o gargalo conhecido (não mexido).

## 26. Save

| | Base | FIX (antes da compactação) | FIX |
| --- | --- | --- | --- |
| Save no fim (média / máximo) | 103,2 / 136,1 kB | 110,6 / 145,6 kB | **107,6 / 141,5 kB** (+4,3% sobre a base) |

Os traços novos custavam ~7 kB por vida (todos em `pessoas`). Compactação na origem: traço universal no valor padrão não
é gravado (`tracoUniversal` lê o padrão; a `calvicie`, sempre gravada, marca quem tem a Aparência 2.0). Nada infinito:
cenas = 4 ids por vínculo; ecos = 3 por conta; procedimentos = 12; genes só existem depois de uma cirurgia; catálogos
técnicos são derivados (não vão ao save).

## 27. Bundle (limite 800 kB mantido, não aumentado)

| Pacote | Base | FIX |
| --- | --- | --- |
| motor | 743,82 | 745,58 |
| motor-textos | 720,33 | 732,89 |
| motor-dados | 442,04 | 455,50 |
| Jogo | 365,86 | 371,77 |
| motor-carreira | 277,51 | 277,56 |
| react | 223,22 | 223,22 |
| motor-conteudo | 129,56 | 130,95 |
| Retrato (compartilhado Nascer/Jogo) | — | 88,12 |
| motor-vida | 67,21 | 83,84 |
| Criacao | — | 8,54 |
| mundo-* (7 regiões) | — | 15,6 a 72,3 |

`microcenas` foi para `motor-vida`; `estetica` para `motor-textos`; `ensinoTecnico` e `mundo/materias` caem na camada de
base pelo grafo real. Nenhum pacote passou de 760 kB.

## 28. PWA / offline (`scripts/pwa/offline.mjs`, Chromium real, build de produção): **31/31**

Passo novo **3d**, sem rede: "Tudo ao acaso" sorteia países diferentes (os pacotes vêm do cache), a tela mostra de quem
vêm os traços, a vida nasce com a Aparência 2.0 no save e volta idêntica depois de recarregar. Precache 36/36, os 7
pacotes do mundo, redes offline, vida no Japão offline, aviso de versão nova — tudo como antes. `build:itch` +
`smoke:itch`: **21/21**.

## 29. APK

**Regenerado a partir do build final deste FIX** (pedido também durante a sessão): `public/android/vida.apk` (5,5 MB,
`br.vida.jogo`, versão 1.0, minSdk 22, alvo SDK 34, chave de depuração), com `scripts/android/gerar-apk.mjs`. JDK 17
(Temurin) e Android SDK 34 baixados para o diretório de trabalho da sessão, **fora do repositório** e sem mudar a máquina.
Conferido: os 21 pacotes JS do APK são exatamente os do `dist` final (inclui `motor-vida`, o `index` e o `Retrato` novos);
o service worker não vai no APK. O `www` do APK, servido localmente num Chromium a 390 px, abre, sorteia "Tudo ao acaso"
(Angola), nasce e vive três anos; o único erro é o 404 do service worker, esperado fora do app (dentro do Capacitor ele
não é registrado). **Sem teste em aparelho real nem emulador** (não há neste ambiente).

## 30. Capturas (`scripts/playtest/humano.mjs` + `gerarHumano.ts`): 13 cenas × 1440/820/390 = 39

Nascer (ao acaso, com mãe e pai), a ficha (prioridades) e a ficha com um grupo aberto, Formação (o kōsen; a faculdade),
A semana, Hobbies, Redes sociais, a clínica, a concessionária, a ótica, Pertences, Linha da Vida. **Sem rolagem
horizontal, sem erro de página/console, sem caracteres soltos, nenhum botão < 32 px no celular, e "Viver mais um ano" no
fim de todas as páginas sem cruzar nada.** O roteiro teve um falso positivo (elementos dentro de `<details>` fechado têm
caixa no Chromium) — corrigido com `checkVisibility`. Achados pelas capturas e corrigidos: a NR-10 no Japão; o
transplante capilar oferecido a quem não tinha entradas (agora a clínica usa a mesma conta da calvície que o retrato).
Galerias de apoio: `scripts/playtest/galeria.tsx` (rostos e cabelos) e `galeriaVeiculos.tsx` (veículos em 7 cores).

## 31. Testes alterados e por quê

Nenhum teste foi afrouxado.

| Teste | Mudança | Por quê |
| --- | --- | --- |
| `motor/fixPosRework3` "18. veículos de categorias distintas" | o Fiat Mobi agora é `compacto` (antes `hatch`); **acrescentado** que o Polo continua `hatch` | design pedido: compacto com silhueta própria; ficou mais estrito |
| `ui/navegacao` (mapa de intenções) | duas entradas novas no mapa esperado (romance, cirurgia) | as intenções novas são conferidas com cliques, como as outras |

Os demais testes do arquivo novo nasceram estritos; o texto de um teste do D que falhou (um texto repetido em 6 anos)
levou a mudar o **motor** (variações do ponto alto e da noite comum), não o teste. As mudanças de origem foram feitas para
que testes antigos continuassem valendo sem mudança: a palavra do painel continua começando pela palavra da semana; o
motivo de "semana cheia" continua dizendo o que ocupa (trabalho, faculdade); os desenhos mantêm os atributos que os testes
leem (o estilo da cor prevalece por cima); "Antes de qualquer escolha, a semana já tem…" foi mantido.

**Os quatro relaxamentos do REWORK 4 (revisados):** (1) `caminhos` "9 e 10" (`<` → `≤`): medido de novo com o mesmo roteiro (120 vidas): 34 profissionais, **13 pela base × 21 pela porta amadora — idêntico à base** — continua
justificável enquanto a calibração não for feita na simulação grande; (2) `caminhos` "tempo livre" aceitar `permitido`:
continua correto e agora é o comportamento central (seção 13); (3) `fechamentoMundo` teto de 60 s: o desempenho não mudou
(seção 25), continua; (4) `rework3` aceitar a fase `voltou`: continua (vida real que saiu e voltou).

## 32. Pendências reais

- **Futebol base × amador:** 13 × 21 em 120 vidas, idêntico à base (este FIX não mexeu nisso, e não se ajustou probabilidade). A calibração definitiva continua para a simulação de ~1.000 vidas.
- **Microcenas:** cobrem os programas de `juntos`; os usos de pertences com uma pessoa (tocar para alguém, jogar junto)
  ainda têm o texto próprio deles, sem o catálogo de cenas. Entre pessoas diferentes, os mesmos moldes se repetem (é um
  repertório escrito); com a mesma pessoa, não em sequência.
- **Aparência:** o corpo (peso, altura) não é desenhado — por isso não há lipoaspiração; tatuagem e cicatriz ficaram
  preparadas (adquirido ≠ genes), não implementadas. A diferença facial entre irmãos é real, porém moderada.
- **Formação técnica:** as rotas por país são abstração (o kōsen como "médio integrado", a formação dual sem a empresa
  como lugar); 24 países com rota própria, os demais com a genérica.
- **Rotina:** a faixa da semana é proporção, não agenda hora a hora (dito na tela).
- **Repetição:** "a chuva de verão" (×10) e a escola particular (×9) seguem as mais repetidas.
- **APK:** sem teste em aparelho real nem emulador (não há neste ambiente); o PWA continua sendo o caminho offline validado.
