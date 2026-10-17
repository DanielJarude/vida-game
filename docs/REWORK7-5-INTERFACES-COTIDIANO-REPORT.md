# REWORK 7.5 — INTERFACES DO COTIDIANO, MEMÓRIA SOCIAL E IDENTIDADE VISUAL

Branch `claude/fix-pos-rework3-playtest`, sobre `0497af3` (REWORK 7, com os hotfixes de cabelos e barbas). HEAD
conferido antes de começar: `0497af3`, sem alterações posteriores.
Save continua **v20** (só campos opcionais, nenhuma migração de versão). Bundles abaixo de 800 kB (limite intocado).

> "O mundo é simulado. A interface deve permitir que o jogador viva dentro dele." — e nada aqui inventa estado: a
> agenda é a `semana` do motor, o celular é a conta do motor, a homenagem é um gesto do motor, a conversa lê a
> história da relação.

---

## 1. Diagnóstico das cinco frentes (e as causas reais)

| Frente | O que o playtest viu | Causa encontrada no código |
|---|---|---|
| Linha da Vida | a amizade do futebol "colada" ao vaso quebrado | `anosDaBiografia` ordenava marcos primeiro e o resto pela hora; cada ano era uma lista plana (`gap` de 12 px) sem distinção entre histórias independentes; a consequência de uma escolha não tinha ligação nenhuma com a escolha |
| Paletas | só claro/escuro | `ui/tema.ts` com dois temas; `tokens.css` já em três camadas (o que tornou quatro paletas baratas) |
| Interações | respostas repetidas; agradecer por algo que nunca aconteceu | `variar(n, frases)` = rodízio pela contagem de vezes, a mesma lista para todo mundo daquele papel; `conversar` com um `if/else` fixo (a mesma frase em **465 de 468** conversas seguidas com a mesma pessoa, ver §10); `elogiar` para pai/avô com o rótulo "Agradecer a X por algo que nunca agradeceu" (sem consultar nada) e gravando um marco `apoio` sem dizer quem ajudou quem |
| Morte e luto | 75 × 76 anos; "está aposentado"; "não tem filhos" de um avô; a morte e a repetência pesando no ano seguinte | (a) `p.tMorte = v.t − 0..11 meses`, mas `idadePessoa` e dois textos (`luto.ts`) contavam até `v.t`; (b) `fraseDoSaber` no presente, sem olhar `vivo`; (c) **os pais do jogador nasciam sem `genitores`**: a árvore não sabia que a mãe é filha da avó (nem a própria mãe "tinha" o jogador e os irmãos como filhos); (d) o luto decaía a 0,72/ano para qualquer perda; a leitura citava um abalo comum por até 36 meses |
| Interfaces | listas e cartões | Tempo livre: estresse + práticas + uma faixa recolhida; redes: sete botões + painel; a morte: uma ficha sem nenhuma ação |

## 2. ETAPA 1 — Linha da Vida: hierarquia e respiração narrativa

**`apresentar.fiosDoAno`** — um ano se lê em FIOS. Duas entradas são da mesma história quando o motor as liga:
falam das mesmas pessoas, ou uma é consequência da outra (`Entrada.segue`, novo). O resto é independente. O cotidiano
solto vira um fio só de miudezas, no fim ("E também, naquele ano"). Ordem: o fio mais pesado abre o ano; dentro do fio,
a ordem em que aconteceu (a origem antes da consequência).

**`apresentar.naturezaDe`** — a natureza de cada acontecimento, sempre do motor (nunca do texto):
`escolha` (✎ sua escolha) · `consequencia` (↳ consequência / "por causa de: “…” (aos 7)" quando a origem é de outro
ano) · `virada` (↗ mudança de rumo: marco de trabalho, estudo, escola, casa, lugar; casamento, união, divórcio, viuvez,
nascimento de filho) · `marco` · `gente` (o rosto) · `acontecimento` (sem rótulo: a vida acontecendo) · `cotidiano`.

**Visual** (`ui/cotidiano.css`): entre fios independentes, 20 px de ar e um traço curto; o fio de um marco respira
mais; o que é do mesmo fio fica a 8 px, com um fio fino na margem (o marco dentro de um fio perde a segunda barra). Nada
de cartões: continua uma página. O retrato e o toque para a ficha continuam (REWORK 7).

**`Entrada.segue`** — só é escrito quando o motor SABE a origem:
- a decisão de despedida e todo conteúdo com papel `falecido` → a entrada da morte (`nucleo.entradaDaMorte`);
- a etapa seguinte de um processo de decisão (`reabrir`/`abrir`) → a escolha anterior (`Momento.segue`);
- a crise que chega em casa (`mun_recessao`) e a recuperação → a notícia da cidade do mesmo ano (a notícia ganhou
  `fato.dados.economia`; o conteúdo declara `origem: c => …` — novo campo opcional de `Base`);
- os gestos de memória → a morte.

## 3. ETAPA 2 — Quatro paletas

| Paleta | Luz | Página | Moldura | Agir | Ideia |
|---|---|---|---|---|---|
| **Memória Clara** (`claro`) | clara | marfim `#f2eee5` | grafite `#22262c` | coral `#bf4f35` | a de sempre |
| **Horizonte Claro** (`horizonte`) | clara | pedra mineral `#eaeeeb` | verde profundo `#163430` | azul-petróleo `#1b5e72` | nova |
| **Memória Escura** (`escuro`) | escura | grafite `#1a1d21` | `#131518` | coral aceso `#e0765a` | a de sempre |
| **Atlântico Noturno** (`atlantico`) | escura | azul da noite `#101923` | `#0a1118` | azul dessaturado `#8bafd6` | nova |
| **Automático** (`auto`) | segue o aparelho | — | — | — | Memória clara ou escura |

- **Arquitetura**: `data-tema` diz a LUZ (claro|escuro: `color-scheme` e o que já existia), `data-paleta` diz qual
  paleta; cada paleta é UM bloco em `tokens.css` que redefine só `--p-*` (e todas elas). Os ids antigos valem (quem
  escolheu "Escuro" no REWORK 6.5 abre na Memória Escura). Nenhum componente pergunta pelo tema (testado).
- **Prévias**: cada opção do seletor mostra a miniatura da página que a paleta dá (moldura, papel, tinta, o botão de
  agir, três tons de área). Não são cores escritas à mão: o elemento leva `data-amostra="<paleta>"`, e `tokens.css`
  aplica a ele a paleta inteira — mudar um valor da paleta muda a prévia junto.
- **Sem flash, offline, PWA, APK**: o script em linha de `index.html` resolve as cinco opções antes do CSS (mesmo
  algoritmo de `tema.resolverPaleta`, testado em todas as combinações); a escolha mora no `localStorage`
  (`VIDA_APARENCIA`), fora do save; troca na hora, sem recarregar. `offline.mjs` confere Atlântico e Horizonte
  recarregando sem rede.
- **Contraste e distinção** (`scripts/playtest/contraste.mjs`, na suíte): os mesmos pares nas QUATRO paletas (tinta ≥
  7:1; texto ≥ 4,5:1; tons de área como texto; texto sobre tom preenchido; moldura; clima difícil) **e**, novo, a
  distância em oklab entre os estados do mundo (bom ≠ ruim ≠ atenção ≠ agir ≠ informar, ΔE ≥ 0,06) e entre os tons das
  áreas (ΔE ≥ 0,035). O teste pegou um erro real na primeira versão: no Horizonte e no Atlântico, "informar" era azul
  como "agir" (ΔE 0,03); virou cinza mineral.
- A cor do MUNDO não muda com a paleta (a do carro, a de cada rede social no celular).

## 4. ETAPA 3 — Interações com contexto, memória e variedade

**Regra fundamental — agradecer só pelo que aconteceu** (`sistemas/conversas.ajudasRecebidas`):
- `Marco.de` (novo, opcional): num marco de apoio, quem ajudou quem — `'ela'` (a pessoa ajudou o jogador), `'eu'`,
  `'juntos'`. Gravado onde a ajuda acontece: o conselho pedido, "esteve do seu lado quando a vida pesou", o fim de
  semana com as crianças (agora registrado), o conselho sobre o futuro, o aperto de dinheiro do casal, e o conselho que
  a pessoa dá numa conversa (situação nova). Saves de antes: as duas frases que sempre foram dela são reconhecidas.
- Também conta: o dinheiro que a pessoa guardou para você (`origem.reservaDe`) e ter criado você (quem a origem diz).
- **`agradecer`** (interação nova): "Agradecer a Marta pelo conselho sobre a faculdade" — o assunto de verdade; uma
  vez por ajuda (`fatos['agradeceu:<pessoa>:<ajuda>']`). Sem ajuda registrada, só "pela companhia de todos esses anos" —
  e só se a relação sustenta (próximos, 3+ anos, sem atrito; de 5 em 5 anos). Uma ajuda recente ainda não agradecida
  entra em "O que faz sentido agora".
- `elogiar` deixou de afirmar ajuda: para pai/avô, "Dizer a X o quanto ele importa para você".

**Famílias de situações** (`sistemas/conversas`), cada situação com a sua condição explícita e a sua fonte:

| Ação | Situações (quando) |
|---|---|
| conversar | acertar as coisas (atrito ≥ 40) · ela conta o que anda pesando (o aperto REAL dela, confiança ≥ 30 — e isso abre o "Cuidar e ajudar") · as novidades dela (a trajetória dela, 18 meses) · a sua novidade (o seu marco do ano, pelo tema; a reação é do temperamento dela) · uma lembrança de vocês (um marco real, peso ≥ 2, de 2+ anos) · o conselho (ela 12+ anos mais velha, você com a cabeça cheia — vira uma ajuda registrada) · uma revelação (o que ainda não se sabe dela) · o desencontro (pouca afinidade) · o comum (falar de nada; criança tem o seu) |
| passar um tempo | o comum de cada papel (as frases de antes) · o silêncio confortável (muito próximos) · uma lembrança real · a farpa (atrito 18–40) · o encontro no caminho (um amigo seu da cidade — que também ganha) · as novidades dela |
| carinho | o de quem está bem · lembrar uma coisa do casal (marco real) · a semana puxada (presença) · **o morno** (relação fria: chega pela metade) · o retribuído (envolvimento alto) |
| elogiar | estranho (no meio do atrito) · de novo (a quarta vez: a pessoa nota) · o que lembra um marco real · criança · os mais velhos · o comum |
| agradecer | pela ajuda (nomeada) · pela companhia · a ajuda antiga ("Você ainda lembra disso?") · ter criado você · quem é fechado |

**Repetição**: a última situação com a pessoa não se repete (peso 0), as recentes pesam um terço, e a variante de uma
situação também não repete a última. Memória compacta: `Vinculo.cenas` guarda 4 marcas das microcenas + 4 das
situações de conversa (`nucleo.marcarCena` — uma não apaga a outra; o validador aceita até 8). O sorteio é derivado
(`rngDe`): nenhuma frase consome o sorteio principal. **Nada vira marco à toa**: só o conselho recebido, a
preocupação confiada, a revelação — passar a tarde não entra na história.

## 5. ETAPA 4 — Morte, homenagens, luto e recuperação

**Coerência (a origem dos dados, não só as frases)**
- `nucleo.idadePessoa` passa a contar até `tMorte` para quem morreu (uma porta só); `idadeAoMorrer`; a ficha, a
  história de vocês e a biografia dizem a mesma idade (testado com o mês do aniversário variando).
- `fraseDoSaber` no passado para quem morreu: "Estava aposentado quando morreu", "Trabalhava como…", "Teve três
  filhos", "Era de pouca gente…". A ficha não traz de volta descobertas antigas escritas no presente.
- **A árvore**: `criacao` liga a mãe e o pai aos avós (`genitores`), os avós do mesmo lado viram casal (`parceiroId`)
  e os tios ficam filhos dos mesmos avós. `conhecimento.filhosDe` conta pela árvore E pelo parentesco (o filho da mãe é
  o jogador; os irmãos; o avô de um save antigo tem pelo menos o filho do lado dele). Consequências coerentes que
  apareceram sozinhas: a morte do avô agora deixa a MÃE de luto ("está de luto pelo pai, Robson") e a avó viúva.
- Saves antigos: ao abrir, `normalizarRework75` corrige só o número da idade quando ele é exatamente o do erro (um a
  mais), na história e na linha da morte; nada mais é reescrito. Num fixture real v16 isso corrigiu "a cachorra
  Estrela morreu aos 15" → "aos 14".

**Luto e recuperação** (`sistemas/luto`)
- `Luto.inicial` (o tamanho da perda, que não muda) e `Luto.reativado`; o `peso` é o impacto de AGORA.
- O ritmo é proporcional ao tamanho da perda: central (≥ 62: cônjuge, filho, quem criou) 0,74/ano; importante (38–62:
  o avô, um amigo) 0,60; menor 0,46. Ajudam: a rede de apoio (até −0,18), a despedida vivida (−0,05), as homenagens do
  ano (−0,03 cada, até −0,06), procurar gente para falar (sociabilidade ±0,03); pesa enfrentar sozinho. **Não há prazo
  único**: o avô se acalma em 3–5 anos; o cônjuge leva mais de 7; com gente por perto, menos (testado).
- Fases: **ativo** (impacto ≥ 55% do inicial) e **se recuperando**. O estresse (cabeça) só sente o luto ativo; no
  humor, a frase diz em que ponto está: "a falta de X" → "a saudade de X, que vai se acalmando". Abaixo de 6 o luto sai
  — a perda fica na Linha da Vida e na ficha ("A perda ficou na memória — já não pesa como pesou").
- **Reativação**: outra perda grande reaviva o luto que ainda dói (um pouco, nunca acima do que já foi).
- **Repetência e abalos comuns**: um abalo de menos de 8 é citado só no ano em que acontece; um grande, até o ano
  seguinte. A conta do humor não muda (o empurrão já foi dado); só a leitura deixa de culpar o que passou.

**Homenagens** (`sistemas/memoria`, ação `memoria`) — na ficha de quem morreu, "Lembrar de X":

| Gesto | Quando dá |
|---|---|
| Ir ao velório / funeral | só no ano da morte; o nome do rito é do país (velório na lusofonia, na América hispânica, Itália e Espanha; funeral nos outros); criança vai só se é da família; de outro país, só adulto; não aparece se a despedida já foi vivida na decisão |
| Prestar uma homenagem | 10+; uma vez por ano |
| Conversar com [quem também perdeu] | alguém real, vivo, que perdeu essa pessoa (`rede.quemPerde`); nos 6 primeiros anos; aproxima os dois |
| Recordar um momento | só se há um marco real de vocês (gira entre eles) |
| Visitar o lugar onde descansa | o texto não presume túmulo nem religião (o motor não sabe o rito da família); longe só para adulto do mesmo país |
| Guardar uma lembrança | uma vez; quem conviveu, família ou bicho |

Os gestos entram na história com a pessoa e, quando importam, na Linha da Vida ligados à morte (`segue`). Aproximam
quem perdeu junto. **Não dão felicidade** (testado: o humor não muda); o que fazem pelo luto vem com o tempo. A página
de Pessoas mostra **"Em memória"** (quem morreu há pouco ou ainda é luto) antes da família; "Quem se foi" continua
recolhido para o resto.

## 6. ETAPA 5 — Interfaces do cotidiano

### 5.1 A agenda da semana (`jogo/Agenda.tsx`)
O motor **não simula dias nem horas** — simula a frequência ("pedaço": meio pedaço = uma vez por semana) e o tamanho
da semana. A agenda é honesta com isso: uma página de caderno, uma linha por compromisso, **um quadrinho por vez na
semana**, e uma fileira da semana inteira no alto. Diz, com todas as letras: "O jogo conta quantas vezes, não em que dia
nem a que horas." Os quadrinhos enchem a semana na ordem (o que já vem ocupado, o que você escolheu) e, quando passam
do tamanho dela, mudam de textura com as **mesmas faixas de `encaixe`** (tirado do descanso · além do que cabe · além do
possível); o arredondamento nunca contradiz o motor (a zona de um quadrinho não passa da faixa que `encaixe` deu).
- Um toque numa prática abre a FICHA da prática (a mesma do REWORK 7); "Mais leve" / "Mais a sério" mudam a dedicação
  pelo comando de sempre (`rotina` com outro nível) — o motor diz se cabe, e o aviso do botão explica o aperto.
- O conflito de tempo vem com o porquê do motor; "Pesa / Ajuda" resume o estresse e leva ao detalhe.
- A escola aparece como linha de contexto (já descontada do tamanho da semana, como no motor).
- A lista de antes (a faixa e "Para onde vai o seu tempo") continua logo abaixo, como alternativa de leitura.
- Sem energia, sem pontos de ação; o excesso continua possível e cobrado como antes.

### 5.2 O celular (`jogo/Redes.tsx`)
Um aparelho do jogo, sem marca: barra de status (o ano, quantas contas), "‹ Início", e a fileira de apps embaixo (um
`tablist` de verdade, setas no teclado). Cada app é a conta naquela rede, no formato dela (a grade, os vídeos em pé, a
fila de vídeos do canal, as lives, a linha do tempo, o mural, o conteúdo trancado), com o perfil que cada rede conta
("7 vídeos no canal · o mais visto: 1,2 mil visualizações"; "12 posts · 2 polêmicas"; "conteúdos exclusivos ·
assinatura ativa"). A **tela inicial** traz as notificações — só o que o motor registrou: o alcance da última
publicação de cada conta (com quem reagiu, os novos seguidores), a renda, a verificação em análise, a suspensão; nela,
os apps vêm primeiro. O celular abre no app mais usado (sem conta, no Instagram, para criar). Glifos genéricos (nada de
logotipo); a cor de cada app é a do mundo. Nada de internet. OnlyFans continua só para adultos.

### 5.3 Compras
As vitrines do REWORK 7 ficam (o que está à venda deste ano e desta cidade, o mínimo, o que é seu dali, o que rende numa
prática sua). Novo: nas lojas de objetos, **o que rende no que você pratica vem primeiro** ("Para o que você pratica:
tocar um instrumento rende +25%") e **"Comparar as opções"**: uma tabela com o preço daqui, quanto dura, onde rende (a
sua prática em destaque), se tira peso da semana, se é descanso, o que já é seu. A identidade visual de cada
estabelecimento (fachadas, ilustrações) é o assunto do REWORK 8, já pedido — não foi antecipada.

### 5.4 Outras áreas (auditoria e propostas; nada reconstruído sem benefício claro)

| Área | O que já funciona como "objeto" | Proposta (próximos pacotes) |
|---|---|---|
| Formação | o caminho passado → agora → portas; cada matéria com os degraus (REWORK 7) | um **boletim** de verdade (as matérias do país, o ano letivo, a média) — o motor já tem `MATERIAS` e o desempenho |
| Trabalho | o emblema e o tom da família de carreira; os painéis próprios (atleta, negócio, farda, pena) | um "**crachá**" do ofício (cargo, desde quando, clima, ritmo) e a mesa do dia a dia; os painéis densos (atleta, freguesia) em fichas |
| Casa | quem mora (rostos), o que há em casa | a **planta da casa** (cômodos pelo modelo da moradia, os objetos em cada um) |
| Cidade | os seus lugares, o que a cidade viveu | um **mapa esquemático** (os lugares desta vida, sem geografia falsa) |
| Dinheiro | o mês (entra, sai, sobra), patrimônio | um **extrato** (o motor já tem `linhaDoExtrato`) e o carnê das obrigações |
| Pessoas | a ficha como retrato da relação; "Em memória" (novo) | a **árvore da família** (agora a árvore liga os avós de verdade) |
| Você | os três estados, degraus das habilidades, a aparência | a **carteira de identidade** + o "prontuário" (saúde, sinais) |

### 5.5 Navegação e acessibilidade
Tudo por toque e teclado (nenhum arrasto, nenhum hover essencial); rótulos acessíveis (a agenda é uma `region`, cada
fileira de quadrinhos tem a frase da frequência; o celular é uma `region` com `tablist`; "Lembrar de X" é uma
`region`); alvos ≥ 32 px (auditados). Oito intenções novas no mapa "Onde fica cada coisa" (consultar a semana, mudar a
dedicação, abrir o celular, homenagear, agradecer, por que ainda estou triste, mudar a aparência, as informações
profissionais) — conferidas por clique em `navegacao.test.tsx`.

## 7. Integração entre as etapas (testada até salvar e reabrir — `rework75.test.tsx`)

- **A** caminhar e conversar com uma amiga: as cenas ficam marcadas, a relação muda, a ida e volta do save preserva o
  vínculo inteiro, e a vida continua.
- **B** o avô morre: a ficha oferece a despedida; ela entra na Linha da Vida ligada à morte; o luto (com `inicial`) se
  acalma em menos de seis anos; a memória fica.
- **C** violão: a agenda mostra "Tocar um instrumento"; um toque abre a ficha, que mostra o violão comprado.
- **D** publicar um vídeo no TikTok: o motor calcula o alcance; a tela inicial do celular mostra; o save guarda.

## 8. Decisões arquiteturais
1. **Consequência só com origem conhecida** (`segue`), nunca por semelhança de texto ou de tema.
2. **Paleta ≠ luz** (`data-paleta` × `data-tema`): o que já perguntava pela luz continua; as paletas são blocos
   `--p-*`. Prévia por `data-amostra` (a paleta de verdade, não uma figura).
3. **Situações com elegibilidade** em vez de listas de frases; a memória de cena compacta e separada por tipo.
4. **Quem ajudou quem** é dado (`Marco.de`), não inferido.
5. **A idade de quem morreu** tem uma porta só (`idadePessoa`); a normalização de saves antigos tem uma porta só
   (`interpretar` → `normalizarRework75`, em toda leitura bem-sucedida, de qualquer versão).
6. **Agenda honesta**: frequência, não horário; o limite documentado no próprio componente e na tela.
7. **Nada de estado novo para as telas**: a agenda, o celular e "Em memória" são leituras do motor.

## 9. Testes adicionados
- `src/motor/__tests__/rework75.test.ts` — 24 testes: agradecer (sem ajuda não aparece; o conselho vira o
  agradecimento com o assunto real; uma vez por ajuda; o elogio não inventa); oito anos de conversa sem cena seguida
  repetida e ≥ 4 estruturas; a lembrança é um marco real; o conselho recebido vira ajuda; passar o tempo não vira marco;
  o carinho numa relação fria; coerência em 9/16/45/72 anos no Brasil, Japão e Portugal (sem `undefined`, `${`,
  `NaN`); a idade de quem morreu igual em toda parte e parada no tempo; o passado na ficha; a árvore dos avós; a
  normalização de saves; o luto proporcional, mais curto com apoio, só o ativo no estresse, a saudade dita; a repetência
  só no ano; a reativação; os gestos (tempo, idade, distância, marco real, `segue`, sem felicidade); a despedida e a
  crise em casa com `segue`; ida e volta dos campos novos e recusa de valor estranho; a safra da região (ver §12).
- `src/ui/__tests__/rework75.test.tsx` — 19 testes: as quatro paletas (troca, barra, fora do save, blocos só `--p-*` e
  completos, o script de `index.html` em todas as combinações, as prévias, as folhas novas sem tema e sem hex); os fios
  (vaso × futebol separados, a mesma pessoa e a consequência juntas, a ordem, as miudezas, as naturezas, "por causa
  de"); a agenda (quadrinhos = `semana`, sem dia nem hora, a lista alternativa, "Mais a sério" pelo motor, a ficha
  abre, o conflito); o celular (sete apps, criar e publicar de dentro, a tela inicial com o que o motor registrou, o
  formato de cada rede); "Em memória" (a ficha no passado, os gestos, a despedida no fio da morte); os fluxos A–D.
- `navegacao.test.tsx`: + 8 intenções.
- `scripts/playtest/contraste.mjs`: quatro paletas + distância entre estados e entre áreas.
- `scripts/pwa/offline.mjs`: + Atlântico e Horizonte sem rede.

## 10. Auditoria de repetição narrativa (`scripts/sim/repeticao75.ts`)
16 vidas (Brasil, Japão, Portugal, EUA; começando aos 10, 17, 30 e 55), dez anos, as quatro pessoas mais próximas,
cada ação a cada ano; a frase com o nome tirado (a mesma frase com outro nome conta como a mesma).

| Ação | Base: distintos / total | Base: iguais em seguida | Novo: distintos / total | Novo: iguais em seguida |
|---|---|---|---|---|
| conversar | 4 / 531 | **465 / 468** | 150 / 531 | **0 / 468** |
| passar um tempo | 14 / 525 | 0 / 462 | 119 / 525 | 0 / 462 |
| carinho | 1 / 1 | — | 6 / 6 | 0 / 5 |
| agradecer | (não existia) | — | 10 / 136 | 0 / 71 |
| elogiar | 4 / 533 | **412 / 468** | 72 / 537 | **0 / 472** |
| **agradecimentos sem ajuda registrada** | **288** | | **0** | |

## 11. Testes antigos alterados (e por quê)

Nenhum teste foi afrouxado para passar. Dois grupos:

**(a) Renomeação das opções de aparência** (o pedido exige os nomes novos)
| Teste | Mudança | Justificativa |
|---|---|---|
| `rework65.test.tsx` (3 lugares) | `/Escuro/` → `/Memória Escura/`; `/Claro/` → `/Memória Clara/`; a ordem do grupo de rádio com 5 opções | os rótulos são as paletas pedidas; o comportamento cobrado é o mesmo (escolher, persistir, reabrir, setas com foco) |
| `scripts/pwa/offline.mjs` | idem, + duas verificações novas | aperto |

**(b) Pré-condições de cenário que dependiam da semente** — a árvore nova (os pais ligados aos avós) muda o curso
das vidas sorteadas: a saúde da família agora conta os avós, a morte do avô chega aos pais, etc. Os testes abaixo
supunham algo que a vida sorteada daquela semente não garante mais; cada um passou a montar explicitamente o que
supunha, sem mudar a exigência:
| Teste | O que a vida sorteada passou a ter | O ajuste |
|---|---|---|
| `fixPosPlaytestHumano.test.tsx` · cinema com o amigo | outra amiga próxima, que mora em Teresina (o cinema não faz sentido com ela — o motor está certo) | escolhe o amigo do cenário (o da mesma cidade) |
| `pacotePlaytest.test.ts` · luxo não cria fama | aos 35, um começo na política comunitária (que dá nome de verdade) | o "anônimo" fica sem mandato, palco e carreira de atleta antes da compra |
| `saudeNpc.test.ts` · histórico familiar ×1,4 | o próprio jogador já tinha pressão alta (o "antes" já contava a família) | tira a pressão alta do jogador antes de medir o "antes" |
| `saudeNpc.test.ts` · nada antes da idade | uma criança de 2 anos reconstruída com câncer | o catálogo permite o câncer em qualquer idade, com a incidência real infantil (0,015%/ano); a exigência continua para todas as condições de adulto e o risco > 0 continua conferido para cada condição. A versão anterior só passava porque aquela semente não sorteava esse caso |
| `sucessao.test.ts` · a filha pode receber a casa | dois filhos sorteados antes dos que o cenário cria (a parte de cada um encolheu) | o cenário apaga a descendência sorteada antes de montar a família |
| `sucessao.test.tsx` · a saúde da herdeira | uma pessoa da família com o mesmo nome da filha | procura a filha (`genitores` inclui o jogador), e o cenário apaga a descendência sorteada |
| `fixPosRework2.test.ts` · v16 idempotente | — (falhou por outra razão: a normalização da idade só rodava em um caminho de migração) | **o código** foi corrigido (`interpretar` normaliza em toda saída); o teste não mudou |
| `trajetorias.test.ts` · dois anos ruins de safra | 40 anos sem safra ruim em Mato Grosso | **o código** foi corrigido (§12); o teste não mudou |

## 12. Problemas encontrados e corrigidos (além das cinco frentes)
1. **A safra da região era quase constante de um ano para o outro** (`rural.ts`): o hash FNV-1a sem mistura final fazia
   anos seguidos ("…:2057", "…:2058") mexerem só nos bits baixos — o Paraná passava **100 anos sem safra ruim** (60 anos
   iguais seguidos), Mato Grosso tinha **10 ruins seguidas**. Com a mistura (avalanche), a proporção fica perto dos 22%
   e a maior sequência igual em 100 anos é 4–6. Teste novo. **Pendência**: o mesmo padrão (FNV sem mistura) existe em
   ~10 outros módulos (`arte`, `esporte`, `frentes`, `formacao`…); onde a chave termina num ano, pode haver o mesmo
   efeito — merece uma auditoria própria (não mexido aqui para não mudar o curso de vidas sem necessidade).
2. A idade de quem morreu nos saves antigos (§5).
3. "+1 inscritos" (concordância no celular).
4. O carinho "de quem está bem" sorteado numa relação fria.

## 13. Desempenho, saves e bundles

### Motor e saves
Vinte vidas inteiras (sementes 4001–4020, até os 75 anos, `scripts/sim/tamanho75.ts`), base × novo, duas rodadas
(idênticas):

| | Base `0497af3` | REWORK 7.5 |
|---|---:|---:|
| save médio (JSON) | 106,7 kB | 104,9 kB |
| entradas da biografia (média) | 204 | 198 |
| pessoas no save (média) | 28 | 26 |
| motor, ms por ano vivido | 5,7–5,8 | 5,7 |
| bytes dos campos novos por vida (média) | — | 288 (0,27%) |

As vidas divergem (a árvore dos avós muda o curso), então a comparação é de distribuição. O que os campos NOVOS ocupam
é medido à parte: ≤ 0,2% em cada um dos onze saves das jornadas do REWORK 7 (`segue`, `de`, `inicial`, os fatos de
homenagem e agradecimento). `Vinculo.cenas` pode guardar até 8 marcas curtas (era 4). Nenhum histórico infinito: as
marcas de cena são 4 + 4 por relação; os gestos guardam só o último de cada um por pessoa.

### Telas (clique → tela pronta, Chromium headless, mediana)
Mesmo save nos dois builds (`desempenho7.mjs`, mediana de 5, 1440 px), milissegundos do clique até a tela nova pintada:

| Área | empregado | rica | idosa | várias atividades | influencer |
|---|---|---|---|---|---|
| Você | 13,9 → 15,1 | 17,5 → 19,7 | 12,3 → 14,2 | 14,9 → 14,6 | 14,8 → 14,7 |
| Pessoas | 9,8 → 11,1 | 9,4 → 10,6 | 6,5 → 8,6 | 15,7 → 14,6 | 10,3 → 10,4 |
| Formação | 18,4 → 17,4 | 12,6 → 13,5 | 13,0 → 13,7 | 14,6 → 14,1 | 19,4 → 15,2 |
| Trabalho | 8,3 → 8,3 | 5,0 → 4,8 | 3,4 → 3,2 | 8,9 → 8,1 | 6,4 → 7,1 |
| Tempo livre | 8,3 → 12,1 | 4,7 → 5,3 | 4,3 → 5,5 | 11,9 → 13,4 | 5,6 → 7,1 |
| Vida | 5,6 → 6,0 | 3,8 → 4,3 | 3,8 → 3,8 | 5,3 → 7,7 | 3,9 → 3,8 |
| Linha da Vida | 14,6 → 19,3 | 13,6 → 16,4 | 14,7 → 16,2 | 16,0 → 19,0 | 14,8 → 15,5 |
| ficha de pessoa | 6,8 → 9,0 | 9,2 → 7,8 | 5,9 → 6,1 | 9,4 → 10,0 | 11,3 → 10,2 |

O que custou: a Linha da Vida (+1 a +5 ms: os fios de cada ano), Tempo livre (+1 a +4 ms: a agenda lê a prática de cada
atividade) e "Em memória" em Pessoas (+1 a +2 ms). Tudo abaixo de 20 ms; o resto está no ruído (± 2 ms).

### Bundles (limite 800 kB, intocado)
| Pacote | Base (kB) | REWORK 7.5 (kB) | Diferença |
|---|---:|---:|---:|
| motor.js | 748,02 | 764,59 | +16,57 |
| motor-textos.js | 733,68 | 734,25 | +0,57 |
| motor-dados.js | 457,10 | 466,38 | +9,28 |
| Jogo.js | 425,43 | 441,24 | +15,81 |
| motor-carreira.js | 303,08 | 303,08 | 0 |
| react.js | 223,22 | 223,22 | 0 |
| index.css | 168,57 | 181,79 | +13,22 |
| motor-conteudo.js | 132,49 | 134,22 | +1,73 |
| motor-vida.js | 112,45 | 112,57 | +0,12 |
| Retrato.js | 99,87 | 101,20 | +1,33 |

`dist/` inteira: 10,26 MB → 10,32 MB. **Atenção**: `motor.js` está a ~35 kB do limite; o próximo pacote que crescer o
motor deve dividir um pedaço (os sistemas novos `conversas`/`memoria` são candidatos naturais a um pacote próprio).

## 14. Capturas (docs/rework75/)
Montagens das capturas REAIS do jogo (`rework75.mjs` → `montagem75.mjs`; "antes" é o build da base `0497af3` com os
mesmos saves e as mesmas cenas):

| Arquivo | O quê |
|---|---|
| `01-linha-fios.jpg` | Linha da Vida de uma infância ("mostrar tudo"), antes × depois — os fios, as miudezas, a mudança de rumo |
| `02-linha-celular.jpg` | a Linha da Vida em 390/360 px, em três paletas |
| `03-paletas.jpg` | a mesma tela nas quatro paletas |
| `04-paletas-menu.jpg` | o seletor com as prévias (Menu e tela de nascer) |
| `05-agenda.jpg` | Tempo livre, antes × depois — a agenda da semana |
| `06-agenda-celular.jpg` | a agenda no celular (jovem, criança) e a ficha aberta dela |
| `07-celular.jpg` | redes sociais, antes × depois — o celular |
| `08-celular-apps.jpg` | a tela inicial, o YouTube, uma conta de 16 anos |
| `09-em-memoria.jpg` | Pessoas no ano em que o avô morreu, antes × depois ("Em memória"; a mãe de luto pelo pai) |
| `10-ficha-avo.jpg` | a ficha do avô, antes × depois (a idade única, o passado, os gestos) |
| `11-luto-anos.jpg` | três anos depois (a memória fica); Você no ano da perda |
| `12-ficha-amiga.jpg` | a ficha de uma relação de anos |
| `13-compras.jpg` | a loja de instrumentos: comparar, o que rende no que você pratica |
| `14-tablet.jpg` | 820 px |

Nota: o "antes" usa os MESMOS saves (gerados pelo motor novo) no build da base, para comparar a tela com os mesmos
dados — por isso a ficha do avô de antes já mostra "três filhos" (o elo da árvore está no save); o que ela não tinha
era o passado ("Trabalha como…") e os gestos.

**Auditoria de geometria** (`rework75.mjs`): 38 cenas × 4 paletas × 1440/820/390/360 + 390×560 = **760 capturas, 0
problemas** (nenhum texto sobre texto, nenhuma rolagem horizontal, nenhum elemento estourando a borda, o avançar sempre
visível e não coberto, nenhum erro de console, nenhum alvo de toque < 32 px). As 760 capturas ficam fora do repositório
(tamanho); regenerar: `gerarRework6.ts` + `gerarRework7.ts` + `gerarRework75.ts` → `rework75.mjs` → `montagem75.mjs`.

## 15. Compatibilidade de saves
- **v20 preservada**; campos novos, todos opcionais e validados (`validarRework75`): `Entrada.segue`,
  `Momento.segue`, `Luto.inicial`, `Luto.reativado`, `Marco.de` (valor estranho é recusado — testado).
- Fatos novos (números, no `fatos` de sempre): `hom:<gesto>:<pessoa>` (+ `#n`, as vezes), `agradeceu:<pessoa>:<ajuda>`,
  `agr:<pessoa>:<família>`.
- Saves antigos: abrem como antes; a idade de quem morreu é corrigida nos textos quando é exatamente o erro conhecido;
  avôs sem o elo da árvore têm pelo menos um filho (o do lado deles). A árvore dos avós **não** é reconstruída em saves
  antigos (não há como saber, com certeza, de que lado cada avô é — o sobrenome é só uma pista; preferi não inventar).
- A suíte de saves antigos (v9…v19 e fixtures) passa inteira.

## 16. Limitações
- A agenda não tem dias nem horários porque o motor não os simula (documentado na tela); uma agenda por dias exigiria
  um modelo de semana novo no motor.
- O celular é uma moldura sobre as mesmas sete contas; não há mensagens diretas nem feed dos outros (o motor não
  simula o conteúdo de terceiros).
- As homenagens não custam viagem (ir a um velório em outra cidade é gratuito no motor).
- `quemPerde` só conhece quem tem vínculo com o jogador: a viúva de um avô de quem o jogador nunca foi próximo pode
  não aparecer como "quem também perdeu".
- A consequência (`segue`) cobre a morte, os processos de decisão e a economia; outras consequências de escolhas
  antigas que o conteúdo narra como acontecimento novo continuam sem o elo (o conteúdo teria de declarar `origem`).
- Repetência: só a LEITURA deixou de citar; o humor do ano seguinte ainda carrega o resto natural do equilíbrio
  (0,65 do ano anterior), como qualquer abalo.

## 17. Pendências
- **APK Android não regenerado** neste pacote (como pedido): `public/android/vida.apk` continua o do HOTFIX barbas.
  Nenhum teste em aparelho real.
- Auditoria dos hashes sem mistura (§12).
- O resto da §5.4 (boletim, crachá, planta, extrato, árvore, identidade).
- Dividir o pacote `motor` antes do próximo crescimento.

## 18. Riscos de regressão
- A árvore dos avós muda o curso das vidas novas (saúde da família, lutos dos pais, heranças entre tios): mais
  coerente, mas toda semente nova dá outra vida — testes que dependem de "o que a semente X sorteia" podem precisar
  de pré-condições explícitas (os oito acima já foram).
- `idadePessoa` parada em `tMorte`: qualquer código que usasse a idade de um morto "como se estivesse vivo" (nenhum
  encontrado) passaria a ler a idade da morte.
- O luto mais curto para perdas menores muda o humor médio das vidas (menos tempo triste depois de perder um avô).
- `Vinculo.cenas` agora pode ter até 8 marcas (era 4); o validador sempre aceitou 8.

## 19. O que observar no próximo playtest humano
1. Ler um ano cheio da infância na Linha da Vida: as histórias independentes respiram? Os fios ajudam ou fragmentam?
2. Trocar de paleta no Menu: as prévias bastam para escolher? Horizonte e Atlântico agradam?
3. Agradecer a alguém: o botão aparece só quando faz sentido? O motivo nomeado convence?
4. Caminhar/conversar com a mesma amiga por vários anos: parece aquela relação?
5. Perder um avô: "Em memória", a despedida, a família — e, três anos depois, a tristeza foi passando?
6. A agenda: dá para entender a semana de relance? "Uma vez por semana, sem dia" incomoda?
7. O celular: abrir o Instagram, voltar à tela inicial, ir para o YouTube — natural no celular de 360 px?
8. Comprar um instrumento: a comparação ajuda a escolher?

## 20. Validação final (Node 22)
| Verificação | Resultado |
|---|---|
| Suíte completa (`vitest run`, Node 22) | **1371/1371** (base: 1328; +43 nos dois arquivos novos), 78 arquivos |
| Typecheck (`tsc --noEmit`) | ok |
| Build (`npm run build`) | ok, todos os pacotes < 800 kB (§13) |
| Build itch.io (`build:itch`) | ok, `index.html` na raiz do ZIP |
| Smoke itch.io (`smoke:itch`) | **21/21** |
| PWA / offline (`scripts/pwa/offline.mjs`) | **36/36** (34 de antes + Atlântico e Horizonte sem rede) |
| Testes causais das cinco etapas | 24 (motor) + 19 (tela), §9 |
| Auditoria de repetição narrativa | §10 — 0 repetições seguidas; 0 agradecimentos sem ajuda (base: 288) |
| Coerência entre telas | a idade de quem morreu (ficha × história × biografia), a semana (agenda × lista × motor), o celular (tela inicial × conta × save) — testadas |
| Capturas 1440/820/390/360 nas quatro paletas | 760, 0 problemas (§14) |
| Contraste e distinção nas quatro paletas (`contraste.mjs`, na suíte) | ok |
| Mundo e localização (`scripts/sim/vazamentos.ts`, 10 países × 3 vidas) | **0 vazamentos** Brasil → mundo |
| Saves antigos | migrações e fixtures v9→v20: ok; v20 sem migração de versão |
| Desempenho e tamanho | §13 |

Commit único, enviado para `origin/claude/fix-pos-rework3-playtest` (sem merge na `main`, sem force-push, sem
`.claude/`). Cloudflare Pages publica sozinho. **APK não regenerado** (§17).
