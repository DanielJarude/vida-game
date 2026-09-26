# FIX #4 — auditoria investigativa de coerência, meia-idade e profundidade sistêmica

> "O VIDA já tem muitos sistemas. O problema agora é que eles ainda não se
> reconhecem." Este FIX não acrescentou largura: fez o que já existe na vida
> continuar existindo para as outras pessoas e para os outros sistemas.

## 1. Base exata

| | |
| --- | --- |
| Branch | `claude/fix-playtest-4`, criada a partir de `claude/fix-playtest-3` |
| Base | `619ed5f9f2ea25a4a07b0a21023868b9b167371d` (working tree limpa, confirmado antes de qualquer mudança) |
| Baseline | typecheck limpo, build ok, **393/393** testes |
| Ao fim | typecheck limpo, build ok, **520/520** testes (18 arquivos) |
| Node | 22 (`~/.nvm/versions/node/v22.23.2`) |

Nada em `main`, sem merge, sem force-push, sem mexer em segredos. O
relatório do FIX #3 foi lido antes; cada área foi auditada (seis auditorias
de leitura em paralelo, depois implementação) antes de mudar código.

## 2–3. Diagnóstico de cada achado e causas encontradas

| Achado do Playtest #4 | Causa encontrada (não o sintoma) | Onde a causa estava |
| --- | --- | --- |
| A filha morreu de AVC e a mãe "não soube" | O luto só existia do ponto de vista do **jogador**: `registrarMortes` marcava `aperto` em alguns casos especiais (viúvo, netos do falecido) e nada derivava *o que o morto era para cada outra pessoa*. A mãe da filha (a parceria) não tinha luto, a despedida não a oferecia como "quem sofre mais", a ficha dizia "Estão bem: ainda riem das mesmas coisas" | arquitetura (faltava a rede) + UI (texto genérico) |
| Negócio que ia bem sem renda pessoal; "procurar emprego" como desempregado | (a) a retirada do dono era a renda de um **autônomo** (tabela de clientela), sem relação com o que o negócio rendia; o prejuízo voltava da conta **sem aparecer** na conta do ano (e o aviso só saía a cada 3 anos); (b) vários caminhos tiravam o emprego de dono mantendo o negócio aberto e **marcavam `desempregadoDesde`** — a tela, o humor e o conteúdo passavam a tratar a pessoa como quem procura trabalho; (c) nenhuma tela mostrava faturamento, custos, lucro, retirada e caixa | motor (conta) + estado (desempregado) + UI |
| Com carro, o Tempo livre mostrava tempo de ônibus | Duas regras soltas e contraditórias (semana e orçamento); o carro era um "ganho" que encolhia o trabalho com rótulo "menos tempo no ônibus"; CNH ignorada; bicicleta nunca contava; nenhum pedaço da semana representava o trajeto do que se possui | arquitetura (faltava uma camada) |
| Base grande e derrotas sem explicação; sem troca de partido | (a) fatores escondidos (desgaste, diretório local, "sorte" do partido de ±6, tamanho da cidade) e escala logística muito íngreme; o apoio despencava no mandato rumo a 0,85×aprovação; (b) o texto do resultado não nomeava nenhum fator; (c) filiação era permanente: `filiar` bloqueava quem já tinha partido | motor + UI |
| Traição durante mandato sem consequência pública possível | Não existia "quem sabe": o caso só tinha o segredo da parceria; nada ligava vida privada, conhecimento e vida pública. Além disso, **um preso seguia com o mandato "vivo"** | arquitetura |
| R$ 1 milhão aplicado e "você não tem dinheiro" | Três medidas de dinheiro diferentes: a tela mostrava conta + aplicações ("À mão"), ~25 verificações olhavam só a conta ("Não há dinheiro"), outras contavam tudo e **vendiam aplicação em silêncio** (`pagar`). Nenhum lugar oferecia "tirar das aplicações e pagar". O rendimento do ano não aparecia em tela nenhuma | arquitetura + comunicação |
| Meia-idade monótona | O conjunto elegível aos 40–69 não era pequeno, era **genérico** (os mesmos itens dos 20 anos); os sistemas com estado para histórias (casamento dos filhos, netos, pais envelhecendo, irmãos, amizades de décadas, planos abandonados, carreira de 25 anos, negócio maduro, a casa da família) só geravam linhas passivas; faixas de idade cortavam conteúdo sem motivo | conteúdo + sistemas sem saída narrativa |
| Casas visualmente indistinguíveis | 11 modelos desenhados como 7 formas: 4 apartamentos iguais, 4 casas iguais, a casa dos pais igual à própria; condição, reforma e problema nunca desenhados; o cartão do imóvel próprio reduzia tudo a 3 ícones | UI |
| Nomes genéricos de veículos; ordem arbitrária | Catálogo de 9 classes sem marca; "ver os outros" em ordem de relevância; não havia catálogo completo | dados + UI |
| Curso integral × trabalho integral só "acusado" na semana | A matrícula criava a `Matricula` direto (`tentarIngresso`), sem `propor()`; destrancar também | arquitetura (limitação dita no FIX #3) |

Causas **gerais** encontradas ao procurar a mesma classe em outros lugares
(detalhadas nas seções abaixo): a fase de conteúdo abria a decisão do ano
**antes** de aplicar os acontecimentos do mesmo ano (um acontecimento podia
desfazer a premissa da decisão já aberta — a simulação derrubou o jogo com
isso); adulto que repetia o 4º ano "com colegas cada vez mais novos" até os 41
(não havia EJA); morar com o irmão depois dos pais **se repetia todo ano**
(o convívio recalculado tirava a "casa" de quem já tinha saído de casa, mesmo
sendo o dono da casa); a retrospectiva media romances pelo início do vínculo
("43 anos com" alguém que foi só uma saída); o ex-marido virava "amizade de
décadas"; "o conhecido Laura".

## 4. Mudanças arquiteturais

- **`sistemas/rede.ts`** (novo): o que uma pessoa é para OUTRA pessoa
  (`paisDe`, `conjugeDe`, `lacoCom` → filho, genitor, cônjuge, irmão, neto,
  avô, genro, sogro), derivado de `genitores`, `parceiroId` e dos parentescos
  do jogador. `quemPerde` (peso da perda por laço: filho 92, cônjuge 84,
  genitor 66 — criança que perde pai/mãe 86 —, irmão 54, neto 46, avô 44,
  genro 30, sogro 26), `repercutirMorte`, `quemFicouTexto`, `lutoDe`,
  `quemApareceu`/`registrarQuemApareceu` (prisão, doença grave, posse).
- **`sistemas/transporte.ts`** (novo): fonte única do deslocamento (a pé,
  bicicleta, transporte público, moto, carro) para semana, orçamento e telas.
- **`sistemas/exposicao.ts`** (novo): segredos com quem sabe; vazamento pela
  vontade de falar de quem sabe e pela vida pública da pessoa; repercussão.
- **`sistemas/retrospectiva.ts`** (novo): o que marcou a vida.
- **Liquidez central** em `sistemas/dinheiro.ts`: `capacidade` (`tem` /
  `resgatando` / `sem_patrimonio`), `planoDeResgate`, `vereditoDePagar`,
  `okDePagar`, `tirarDasAplicacoes`; `Veredito.resgate`; ação
  `resgatar_e`; opção de decisão com `resgate` (`custa()` no conteúdo) e
  `decidir` com `resgatar`.
- **Compromissos**: `NovoCompromisso` `curso` (matrícula e destrancar) em
  `analisarEntrada` / `planosDeConflito` / `aplicarNovo`; `efetivarMatricula`
  separado da aprovação.
- **Eleição**: `fatoresDaEleicao` (a mesma lista na conta, na apuração, na
  explicação e na perspectiva), `explicarEleicao`, `perspectiva`,
  `regraDaTroca`, `trocarDePartido`, `perderMandatoPorPrisao`.
- **Negócio**: `contaDoAno` devolve faturamento, insumos, fixo (desgaste do
  investido + ponto), folha, lucro, parte do sócio, sua parte, retirada e o
  que ficou no caixa; `retiradaMensal`; `semOcupacao`/`temNegocioAberto`.
- **`ano.ts`**: o mundo age antes de a vida perguntar (acontecimentos
  garantidos, disparados e sorteados; depois as decisões, preparadas com o
  estado já mudado).
- **Escola**: EJA para quem passou da idade da série (15+ no fundamental,
  18+ no médio), com etapas que juntam séries.

## 5. Mudanças de UX

- **Pessoas**: "está de luto por Maitê, a filha de vocês", "de luto pela
  irmã, Maitê", "pela esposa", "pela mãe"; a parceria enlutada não "ri das
  mesmas coisas" ("Têm atravessado a perda juntos"); "Estar com X no luto por
  Y" / "Atravessar com X o luto por Y".
- **Trabalho**: painel "A conta do último ano" (faturamento, custos, lucro,
  parte do sócio, sua retirada — por mês —, o que ficou no caixa ou faltou);
  dono sem outro trabalho aparece como dono ("Sem outro trabalho: Loja… é o
  que você faz hoje…", "Dedicar-se de vez" em destaque, "Ver outras
  oportunidades de trabalho" secundária). Política: "O partido aqui",
  "Desgaste", **Se fosse hoje** (perspectiva), **A última eleição** (a
  explicação), escândalo, partidos por onde passou, "Trocar de partido".
- **Você › dinheiro**: "Na conta" e "Aplicado (dá para tirar)" em vez de "À
  mão"; o que as aplicações renderam no ano (e o que foi tirado delas para
  cobrir o ano); o caixa do negócio ("vira seu quando você tira").
- **Qualquer botão que esbarra só na conta**: "Tirar R$ X das aplicações e
  pagar"; numa decisão, "Tirar R$ X das aplicações e escolher isto". A frase
  do bloqueio diz a situação: "Custa R$ X; na conta há R$ Y. Faltam R$ Z — dá
  para tirar das suas aplicações (ações abaixo do que você pôs: vender agora
  realiza a perda)" ou "…somando conta e aplicações, você tem R$ W".
- **Tempo livre**: "O trajeto de todo dia" — como vai, quanto tempo, quanto
  custa, por quê ("Você tem veículo, mas não tem carteira"), e os outros jeitos
  com a diferença em minutos e passagem; a faixa da semana tem o pedaço
  "Trajeto de carro (Chevrolet Onix)".
- **Cidade**: "Transporte público" (da cidade) e "O seu trajeto".
- **Estudos**: cada via de curso avisa, antes de tentar, o que conflitaria.
- **Casa**: 15 desenhos (ver §12); cartão do imóvel com o ícone do modelo.
- **Lojas**: "Catálogo completo" do mais barato ao mais caro, filtros.
- **Fim**: "O que marcou esta vida" antes de "Em números".

## 6. Relações: a rede de consequências

Uma morte agora chega a cada pessoa ligada a quem morreu, pelo laço real:

1. **luto de quem ficou** (`aperto` com o peso do laço: um luto mais leve não
   apaga um mais pesado — a neta que perdeu a mãe e depois a avó segue de luto
   pela mãe);
2. **vida própria** de quem tem uma (a neta guarda "Perdeu a mãe, Maitê.");
3. **corpo** de quem é velho e perde filho ou parceria;
4. **o marco que o jogador passa a dividir** com cada um ("Perderam Maitê, a
   filha de vocês", "Perderam a mãe juntos", "Ficou viúva de…");
5. **a linha da morte diz quem mais perdeu**: "Sua filha Maitê morreu em
   outubro, aos 30 anos (AVC)… Você e Ana Clara perderam a filha. Deixou
   Benjamin, o marido, e uma filha, Júlia.";
6. **a despedida** lembra a mãe ("Ana Clara está ao seu lado; ela perdeu a
   filha também") e oferece "Cuidar de Ana Clara, que sofre mais";
7. **situações que nascem depois** (`conteudo/rede.ts`): *Um ano sem Maitê*
   (o luto do casal: falar de verdade, grupo de apoio, cada um no seu tempo,
   mergulhar no trabalho — cada uma com a consequência dita e o efeito
   dependente do clima do casal); *Júlia* (a neta que ficou sem mãe: trazer
   para casa, ajudar a criar, deixar com o pai); *o pai ou a mãe viúvo que
   ficou só* (chamar para morar, visitar, deixar como está — e a resposta é
   dele).

Acontecimentos do **próprio jogador** também passam pela rede: na prisão,
"Nas visitas de domingo, vinham Ricardo, Yasmin e Michele"; na doença grave,
"No tratamento, Monique, Leonardo e Marina se revezaram ao seu lado"; na
posse, "Na posse, na primeira fila: …". Quem vem sai do vínculo (afeto,
confiança, atrito, distância), e quem some fica marcado ("Não apareceu nas
visitas"). A traição descoberta chega aos filhos adultos pela parceria
("Júlia ficou sabendo do caso — por Luan. Com você, a conversa ficou curta").

Textos relacionais genéricos auditados: o luto na ficha, nos sinais e no
"estar junto"; o casal enlutado; "o conhecido Laura" → "a conhecida Laura".

## 7. Negócios e renda do proprietário

A conta, por tipo (reais de hoje), agora é a que o dono entende. Exemplo,
salão em Salvador, dono dedicado, sem equipe:

| Movimento | Faturamento/ano | Lucro/ano | Retirada/mês (líquida) | Antes |
| --- | --- | --- | --- | --- |
| 5 | 20 mil | −6 mil | 0 (prejuízo) | 2.204 |
| 40 | 123 mil | 45 mil | 2.790 | 3.999 |
| 60 | 181 mil | 74 mil | 4.611 | 5.022 |
| 72 (cheio) | 217 mil | 92 mil | 5.704 | 5.636 |

- A retirada é 80% do que é seu no lucro; os 20% ficam no caixa (reserva e
  reinvestimento, com "Tirar do caixa"). O sócio fica com a parte dele do
  lucro (antes pagava metade da retirada do dono). Negócio vazio não paga o
  ponto; todos os 13 tipos testados (vai bem → paga o dono; vazio → prejuízo).
- O prejuízo coberto pela conta aparece **todo ano** na Linha da Vida e na
  conta do ano ("Prejuízo de X coberto do seu bolso").
- Negócio não fecha "por dívida" com patrimônio aplicado (a conta + aplicações
  entra na regra).
- Dono de jornada reduzida (cuidando de alguém) perde movimento e retirada, e
  o texto diz isso (antes dizia "o salário encolheu").
- Dono não é desempregado: `encerrarEmprego` não marca desemprego com negócio
  aberto; `modoDoTrabalho` devolve `negocio` também sem emprego; humor
  ("estar sem trabalho"), portas de desempregado e conteúdo usam
  `semOcupacao`.
- Paralelo: sem retirada fixa (a distinção do FIX #3 mantida), caixa visível.
- A economia não ficou mais dura: no simulador do FIX #3 (mesmas sementes),
  negócios integrais fechados ao fim da vida 15 → 13, firmes 1 → 4.

## 8. Transporte

`deslocamento(v)`: há trajeto com trabalho ou estudo presencial (quem
trabalha em casa ou vende pela internet não tem); carro e moto só com CNH;
veículo parado ou quebrado não leva ninguém (e a tela diz por quê);
bicicleta não faz trajeto de metrópole; sem escolha, o mais rápido que se
tem; o jogador pode preferir outro (`v.deslocamento`), e a troca diz a
diferença ("15 minutos a mais que antes, mais R$ 230 de passagem por mês").
O veículo do trajeto roda todo dia; o outro (ou o de quem não tem trajeto)
gasta menos combustível. Minutos por dia útil por porte de cidade
(abstração de gameplay, ordem de grandeza brasileira): transporte público
110 (metrópole) → 45 (cidade pequena); carro 85 → 14; moto 55 → 10;
bicicleta até 80; a pé onde a cidade cabe a pé. Textos que presumiam ônibus
("Você dorme no ônibus", "assalto dentro do ônibus") passaram a olhar o
jeito como a pessoa vai.

## 9. Política

**Regras reais consultadas (fontes oficiais):** a janela partidária (Lei
9.096/95, art. 22-A; em 2026, de 5/3 a 3/4, só para quem está no fim do
mandato proporcional — [TSE](https://www.tse.jus.br/comunicacao/noticias/2026/Marco/eleicoes-2026-janela-partidaria-comeca-nesta-quinta-feira-5));
a perda do mandato por infidelidade não se aplica aos cargos majoritários
([STF, ADI 5.081](https://noticias.stf.jus.br/postsnoticias/perda-do-mandato-por-troca-de-partido-nao-se-aplica-a-eleicoes-majoritarias/);
[Súmula TSE 67](https://www.tse.jus.br/legislacao/codigo-eleitoral/sumulas/sumulas-do-tse/sumula-tse-no-67));
filiação e domicílio de seis meses (Lei 9.504/97, art. 9º). No jogo:

- **Troca de partido** (`Trocar de partido` em Trabalho): sem mandato, livre;
  prefeito/governador/senador ficam com o mandato; vereador e deputados só
  com segurança na janela (último ano antes da eleição que encerra o mandato)
  — fora dela, o partido pede a cadeira (60% de chance de levar), e isso é
  dito antes. Consequências: base que votava na legenda fica para trás,
  desgaste, a filiação nova conta do zero para os seis meses, o aliado do
  partido antigo se afasta, histórico de partidos, Linha da Vida.
- **Eleição explicável**: `fatoresDaEleicao` (base, nome, campanha, desgaste,
  mandato, segundo mandato, experiência, diretório local, crise, escândalo,
  troca recente, maré do partido, tamanho da disputa) — a soma é a chance
  (teste prova a identidade); os fatores e a chance ficam guardados na
  apuração; a Linha da Vida e o painel dizem os que mais pesaram a favor e
  contra, e se foi esperado ou surpresa ("Chegou como azarão — e virou na
  apuração"; "…a apuração não confirmou: eleição tem incerteza"). Base e nome
  que somam pouco diante do tamanho da disputa aparecem como razão contra
  ("uma base pequena para disputar deputada federal no estado"). Antes de
  registrar, cada cargo diz como estaria hoje.
- **Calibragem**: escala da incerteza 5 → 7; maré ±6 → ±4; dificuldade de
  vereador e prefeito menos dependente do porte; a base no mandato acompanha
  a aprovação sem se perder inteira; entregar algo desgasta menos. Faixa
  típica (base 75, nome 50, campanha média): vereador ~50% na metrópole, ~86%
  em cidade média; prefeito continua muito mais difícil.
- **Vida privada × pública** (`exposicao.ts`): um caso escondido é segredo
  de dois; a parceria que descobre passa a saber (assunto da casa); a chance
  de vazar depende de quem sabe (um ex magoado fala mais) e de quanto a vida
  é pública. Só **público** vira fator: desgaste, base e aprovação caem, e a
  pergunta *Virou notícia* abre (pedir desculpas pesa menos na eleição que
  negar; renunciar). Processo e prisão são registro público: para quem tem
  nome, viram notícia. **Preso perde o mandato** (antes seguia "vivo").
- Neutralidade mantida: partido real só pelo nome; nenhum bônus por partido.

## 10. Investimentos e liquidez

Ver §4–5. Nenhuma decisão do jogador vende aplicação sem o clique de
consentimento (todas as verificações de pagamento de ações, sistemas e
opções de decisão passam por `vereditoDePagar`/`custa`); a sobra de fim de
ano que a conta não cobre continua sendo coberta pelas aplicações (é o mês,
não uma decisão), mas fica escrita e na conta do ano. O "efeito riqueza" não
força mais venda. `quando` que escondiam conteúdo de quem tem patrimônio
aplicado passaram a olhar o patrimônio.

## 11. Meia-idade

`conteudo/biografia.ts` (novo, ~20 situações nascidas do estado acumulado):
casamento e separação dos filhos, ninho vazio (viagem, projeto comum,
terapia, trocar a casa grande), o filho adulto que olha para trás (gratidão
ou mágoa a partir da presença, das brigas da adolescência, do apoio
registrado), primeiro neto e neto adolescente, bodas de prata/ouro pelo
tempo real, pais envelhecendo (consultas, cuidadora, trazer para casa,
dividir com os irmãos — nomeados), irmãos depois dos pais, amizade de
décadas, o amigo que foi embora, o plano que ficou no papel, o sonho que
ficou para trás, marcos de carreira (20/25/30 anos), a aposentadoria
chegando (com a simulação do INSS), sucessão do negócio, retomar uma
atividade, a casa da família; e três acontecimentos que contam a vida dos
outros (o filho aos quarenta, o neto aos dezoito, vinte anos na mesma casa).
Faixas sem motivo abertas (TCC, greve federal, aperto na faculdade, projeto
artístico, convite de grupo, mudança e novos parceiros dos filhos,
aposentadoria dos pais narrada em qualquer idade). Casamentos, netos e
separações dos filhos próximos viram biografia fora da cota anual.

## 12. Casas

15 formas, cada uma com desenho próprio (SVG de traço, `currentColor`, tema
claro e escuro): república (sobrado com campainhas e varal), kitnet (bloco
de unidades iguais, só a sua acesa), apartamento de 1, 2 e 3 quartos (prédios
de alturas e fachadas diferentes, varandas), alto padrão (torre de vidro,
guarita, piscina), casa simples (laje, ferro exposto, caixa d'água), casa de
2 e 3 quartos (muro e portão; garagem), casa grande (sobrado, churrasqueira,
garagem dupla), sítio (cerca, plantação, caixa d'água na torre), casa dos
pais (varanda, antena, vasos), casa de parente (puxadinho), de favor e
funcional. Condição desenhada: reparo pendente (andaime e rachadura),
estado ruim (rachaduras) ou gasto (mancha), reforma recente (lata de tinta),
padrão baixo (tijolo à vista) — sempre também no nome acessível, nunca só
cor. O cartão do imóvel próprio usa o ícone de cada modelo.

## 13. Veículos reais

`VERSOES_VEICULO`: 44 versões em 9 classes (as ids das classes ficaram, por
compatibilidade): bicicletas Caloi, Oggi, Sense, Vela; motos Honda (Pop 110i,
Biz, CG 160, Bros, CB 300F, Sahara), Yamaha (Factor, Fazer, MT-03), Haojue,
Royal Enfield; carros Renault Kwid, Fiat Mobi e Argo, Citroën C3, VW Polo,
Virtus e Nivus, Hyundai HB20 e Creta, Chevrolet Onix, Onix Plus, Tracker e
S10, Honda City e Civic, Toyota Corolla, Corolla Cross, Hilux e SW4, Jeep
Renegade, Compass e Commander, BMW 320i, Mercedes-Benz C 300, Volvo XC60,
Porsche Macan — de R$ 950 a R$ 629.900, calibrados na economia do jogo (não
são preços reais em tempo real). Marca e modelo só como texto factual, sem
logo nem sugestão de patrocínio. Loja: "Catálogo completo" do mais barato ao
mais caro por padrão, busca, Carros/Motos/Bicicletas, Novos/Usados, ordem
inversa; "ver os outros" também por preço. Categoria por campo, não mais pelo
prefixo da id; ajustes por id viraram campos da classe.

## 14. Faculdade integral e compromissos

Aprovado num curso, a matrícula entra por `propor()`. Integral presencial
com trabalho de dia inteiro: pergunta antes ("Matricular-se e deixar o
trabalho de vendedor" / "Não fazer a matrícula", cada um com a
consequência); com meio período, há o plano de tentar os dois; curso noturno
e EAD não conflitam; em outra cidade, o trabalho de lugar fixo entra no
conflito; durante o serviço militar, só curso noturno na cidade do quartel.
Destrancar também pergunta. Dono de negócio integral ganha os planos de
dono (horas vagas / vender). Nada foi feito como exceção de um curso.

## 15. Narrativa contextual

Regra aplicada: o jogo diz o que aconteceu e o que os outros fizeram (a
partir do estado), nunca como o jogador reagiu. Correções: luto contextual
por laço; casal enlutado; festa de aniversário do filho pelo padrão de vida
escolhido (antes, pelo saldo do dia); "A família juntou dinheiro para um
advogado" quando quem pagou foi o próprio jogador; "A mudança foi triste e
aliviada"; textos que presumiam ônibus; "o salário encolheu" para dono;
"Chegou como quase sem chance"; "Passou por 1 partidos"; "o conhecido
Laura". Varredura por afirmações de emoção do jogador não achou outras.

## 16. Morte e retrospectiva

"O que marcou esta vida", até seis frases escolhidas pelo peso do que só
aquela vida teve, e uma de fechamento — por exemplo: "42 anos com Luan,
casada — juntos até o fim." / "Enterrou um filho, Pedro, em 2072." /
"Eleito 5 vezes (vereador e deputado estadual, a primeira em 2056); perdeu
11 eleições; um mandato terminou antes da hora." / "Teve Loja Sim (on-line)
por 34 anos." / "Cumpriu 4 anos de prisão." / "Criou um neto em casa, depois
de uma perda." / "No fim, em casa: Luan." A ficha em números continua
abaixo.

## 17. Testes

- `fix4.test.ts` (novo): rede (laços, intensidade por laço, perceptível na
  linha da morte, na ficha, nos sinais, no "estar junto", na despedida; luto
  do casal e netos órfãos; primo distante não mobiliza a casa; luto pesado não
  é apagado por um leve; nenhum luto órfão numa vida inteira); negócio (a
  conta fecha em todos os tipos; bem → paga o dono, vazio → prejuízo;
  retirada vira renda pessoal; prejuízo aparece todo ano; dono não é
  desempregado, nem sem outro trabalho; paralelo sem retirada); deslocamento
  (sem veículo → ônibus com passagem e semana; carro+CNH → menos tempo, sem
  passagem; sem CNH/parado → ônibus com o porquê; bicicleta e moto; metrópole;
  preferência; em casa sem trajeto); liquidez (patrimônio ≠ sem dinheiro;
  frase de sem patrimônio; nada vendido sem consentimento; resgate em
  decisão; rendimento na conta do ano; resgate de fim de ano escrito; negócio
  não fecha com patrimônio aplicado); política (chance = soma dos fatores;
  explicação cita o maior peso real; perspectiva; troca sem mandato,
  majoritário, proporcional fora e dentro da janela; traição secreta não pesa,
  descoberta pela parceria não pesa, pública pesa; desculpas < negar; vida sem
  nome não vira notícia; preso perde o mandato); curso integral (pergunta
  antes, planos e consequências, aceitar e recusar, noturno/EAD/meio período,
  pela ação de matrícula, destrancar); save v14 com seis saves reais (três v13
  gerados pelo motor da base do Playtest #4 — salão com carro, política,
  investidor — e três v12 do FIX #3), vivendo, exportando e importando; EJA;
  retrospectiva; ex-cônjuge fora das cenas de amizade; concordância; morar
  com o irmão uma vez só.
- `meiaidade.test.ts` (novo, 37): cada situação abre quando o estado sustenta
  e não abre quando não; todas as opções com consequência; nomes e história
  reais; efeitos; teste estatístico.
- `veiculos4.test.ts` (novo, 13) e `ui/__tests__/casas.test.tsx` (novo, 5).
- Testes antigos ajustados só onde o cenário dependia de sorte ou de um
  rótulo que mudou (versão do save 13 → 14; "Ônibus" → "Passagem de ônibus";
  CNH para o carro do teste de orçamento; vidas que terminam cedo não contam).

Total ao fim: **520 testes em 18 arquivos**, todos passando (baseline 393).

## 18. Simulações

- `scripts/sim/fix4.ts`: dez trajetórias (as oito do FIX #3 + família e
  investidor) × perfis de jogador, até 85 anos, `verificarCoerencia` a cada
  ano, e a busca das classes do Playtest #4 (dono sem renda com lucro, eleição
  sem explicação, texto quebrado, carro sem trajeto, outro genitor sem luto).
  **250 vidas: 0 incoerências, 0 ocorrências** dessas classes; 262 perguntas
  de conflito (16 de matrícula, 17 de destrancar), 130 resgates consentidos.
- Durante o FIX a simulação encontrou: o crash de decisão com premissa
  desfeita (→ reordenação da fase de conteúdo), o laço de moradia com o irmão,
  a repetência sem fim (→ EJA).

## 19. Métricas por idade

Mesmo código (`scripts/sim/metricasIdade.ts`), 120 vidas, perfis de jogador,
metade com família montada aos 27 — **base `619ed5f` → FIX #4**, por ano de
vida:

| Faixa | linhas biográficas | decisões | família | anos sem biografia |
| --- | --- | --- | --- | --- |
| 0–17 | 1,51 → 1,52 | 0,30 → 0,30 | 0,22 → 0,22 | 17% → 17% |
| 18–29 | 2,46 → 2,42 | 1,23 → 1,24 | 0,17 → 0,17 | 11% → 11% |
| 30–39 | 1,75 → 1,93 | 0,75 → 0,75 | 0,13 → 0,25 | 19% → 17% |
| **40–49** | **1,75 → 1,83** | **0,62 → 0,69** | **0,39 → 0,53** | **19% → 17%** |
| **50–59** | **1,61 → 1,86** | **0,55 → 0,70** | **0,48 → 0,68** | **24% → 17%** |
| **60–69** | **1,47 → 1,78** | **0,52 → 0,60** | **0,38 → 0,71** | **25% → 19%** |
| 70+ | 1,22 → 1,80 | 0,23 → 0,34 | 0,21 → 0,55 | 31% → 16% |

O vale que existia entre 40 e 70 (a biografia caía ano a ano a partir dos
30, e metade da queda era família) virou um platô: a vida fica tão
biográfica aos 55 quanto aos 35, e a família — filhos adultos, netos, pais —
passa a ser a maior fonte. Anos silenciosos continuam existindo (17–19%).
No simulador do FIX #4 (250 vidas, trajetórias mais ativas), 40–49/50–59/
60–69: 1,93/1,96/1,82 linhas biográficas por ano; 1,37/1,30/1,10 decisões;
relações ativas 18/17/16; luto 0,13/0,19/0,20; política 0,12/0,10/0,09.

## 20. Biografias lidas

20 biografias completas lidas, com atenção aos 40–70 (família, dono,
política ×2, família com divórcio, investidor ×2, bens ×2, livre ×2,
paralelo ×2, militar ×2, bichos ×2, atleta que estuda, dono preso, família
com cuidado dos pais), e uma varredura automática de repetições nas 30
gravadas. Achados que viraram correção (com regressão): repetência sem fim de
adulto (EJA); "Sem os pais, foi morar com Melissa" dezesseis vezes; "Passou
por 1 partidos"; "43 anos com Gabriel" (uma saída de dois anos, décadas
depois de se conhecerem); "Antes ou depois, outra história longa: Pedro" (um
caso escondido); "Viajou com Theo para festejar 41 anos de amizade" (o
ex-marido); "o conhecido Laura"; "o desgaste" citado como razão de derrota
com peso de 2 pontos; "o salário encolheu" para dono. Confirmado: mortes
repercutem ("Você e Luan perderam o filho"), prisão tem visitas, doença grave
tem quem acompanha, eleição se explica, dono vive da retirada, carro e moto
aparecem no trajeto, a meia-idade tem pais envelhecendo, casamentos e netos,
bodas, amizades de décadas, marcos de carreira, sucessão do negócio.

## 21. Playtest visual

`scripts/playtest/fix4.mjs` + `gerarFix4.ts`: 18 cenários (luto na família,
o luto do casal com a carta aberta, salão com carro, dono sem outro
trabalho, investidor com um milhão aplicado, derrota explicada, troca de
partido com a carta aberta, curso integral com a pergunta aberta, moto,
bicicleta, seis moradias, meia-idade, a morte), todas as abas, em **320,
390, 820 e 1440**, mais lojas (concessionária, usados, motos), catálogo
completo (ordem de preço conferida), filtros Motos/Bicicletas, oferta aberta
e a tela de morte: **617 telas**. E o playtest do rework (20 cenários
anteriores): **654 telas**. Total **1.271 telas, 0 problemas estruturais**
(rolagem horizontal, botão fora da tela, CTA cobrindo conteúdo, botão sem
nome, alvo < 40 px, texto cortado). O único achado ("ver as lojas na Cidade"
com 32 px) foi corrigido. Refeito depois das correções da auditoria (617 telas, 0 problemas). Conferido à parte: o botão "Tirar R$ 26.200 das
aplicações e pagar" na compra de um carro, em 320 e 1440. Contraste: todos
os pares acima de 4,5:1. Cinza e três daltonismos em Trabalho, Tempo,
Pessoas e Casa (salão, derrota, luto).

## 22. Auditoria independente / segunda passagem

Um agente separado, sem acesso ao raciocínio da implementação, auditou o
`git diff 619ed5f..HEAD` tentando quebrar cada área com testes temporários
(depois apagados) e 260 vidas aleatórias até a morte (ações e decisões ao
acaso, incluindo os resgates). Veredito: **rejeitado**, com 3 achados altos,
7 médios e 7 baixos, todos reproduzidos. Todos foram corrigidos na causa, com
regressão em `fix4.test.ts` (bloco "achados da auditoria independente"):

| # | Achado | Causa | Correção |
| --- | --- | --- | --- |
| A1 | As situações novas da meia-idade vendiam aplicações sem pedir (cuidadora, festa, viagem, terapia…) | os gates usavam `disponivel` (conta + aplicações) e o efeito `pagar()` caía em `cobrirComAplicacoes` — a mesma classe corrigida no resto do conteúdo, reintroduzida no arquivo novo | os 11 gates passam por `custa()`: bloqueio com resgate consentido |
| A2 | Negócio deixado em outra cidade podia virar "integral" de longe e seguir `passivo`: caixa e salário contados duas vezes | `dedicarAoNegocio` não limpava `passivo`; nada guardava onde o negócio ficou | `Negocio.ficouEm`; de longe, "integral" é bloqueado com o motivo; voltar para a cidade permite retomar; nova mudança não "leva" o negócio junto (achado ao escrever a regressão) |
| A3 | Depois da prisão que encerra o mandato (ou da renúncia do escândalo), o negócio ficava passivo para sempre e o dono sem saída | `perderMandatoPorPrisao` e a renúncia do escândalo não devolviam o trabalho de antes; a gestão recusava "integral" e "horas vagas" | ao sair da prisão (e na renúncia), `voltarAoTrabalho`; gestão oferece "Voltar a tocar X todo dia" a quem está passivo sem mandato |
| M1 | Filho adotado sem `genitores`: a rede não o via (sem luto da parceria) | `concluirAdocao` não registrava os pais | pais = jogador + parceria do processo; migração pelos fatos `adotado_*` |
| M2 | Conta no negativo: o resgate da decisão vendia, não liberava, e vendia de novo | `capacidade` usava `max(0, conta)`; `decidir` não simulava antes | falta calculada da conta real; `decidir` com resgate simula e recusa sem vender |
| M3 | Voltar à política apagava partidos, escândalo e inelegibilidade | `entrarNaPolitica` copiava só alguns campos | copia o registro |
| M4 | Eleito sem posse: troca "livre"; e perder a cadeira mantinha a posse | `regraDaTroca` olhava só `mandato` | a posse proporcional conta como mandato do partido; a cassação limpa a posse |
| M5 | "Faltou X (saiu do seu bolso)" mesmo quando o caixa cobriu | a UI não olhava `devolvidoAno` | diz quanto saiu do bolso e quanto do caixa |
| M6 | "Deixou 0 filhos e 2 netos"; "Deixou um filho" para uma filha | contagem e concordância | "Não deixou filhos vivos; deixou 2 netos"; "uma filha", "netas" |
| M7 | Dono tratado como desempregado depois da prisão | `soltar` marcava desemprego sempre; `des_longo` e a crise do casal olhavam só o emprego | `semOcupacao` nos dois; `soltar` não marca com negócio aberto |
| L1 | Viúvo casado de novo: a rede escolhia a parceria morta | `conjugeDe` aceitava a morta primeiro | prefere a viva |
| L2 | "Chegou como favorito"/"pouco conhecido" para candidata | texto fixo | concordância pelo gênero |
| L3 | "A Honda Biz ficou parado", "emprestado", "quebrado", "ele valia" | adjetivos fixos no masculino | `gv()` pelo artigo da versão |
| L4 | "Negar tudo" sobre uma prisão | opção sem condição | não aparece quando o escândalo é a prisão |
| L5 | "Ao lado dos estudos" para quem não estuda | texto fixo | depende da matrícula |
| L6 | Divórcio não chegava aos pais e irmãos | `terminar` só tocava os filhos | família próxima fica por perto, lembra, e a linha diz quem |
| L7 | "de luto pelo filhe" (neutro) | artigo | "pele" |

O que a auditoria confirmou que se sustenta: nenhuma exceção nem
`undefined`/`NaN` em 260 vidas; `lacoCom` sem falso parentesco; regra da
troca correta durante o mandato; escândalo só por `tornarPublico`; prisão
encerra o mandato uma vez só; a conta do negócio fecha com a renda paga;
trajeto (passagem só no transporte público, CNH, veículo parado); ações de
compra com resgate simulado antes de vender; migração v13→v14; ordem do ano.

Depois das correções: suíte inteira (520), typecheck, build, simulação de
250 vidas (0 incoerências, 0 ocorrências das classes, 137 resgates
consentidos) e o playtest visual do FIX #4 (617 telas, 0 problemas) de novo.

## 23. Save e migração

`VERSAO_SAVE = 14`. `migrarV13`: cada veículo ganha versão real do catálogo
(determinística pela id do veículo, idempotente; valor, estado e história
intocados; o texto do financiamento acompanha); quem é filiado ganha o
histórico de partidos; quem mora de favor com um irmão ganha o anfitrião; filho adotado ganha os pais registrados (jogador e a parceria da época).
O resto do FIX é derivado ou opcional (retirada, deslocamento, fatores da
eleição, segredos, EJA). Testado com saves reais v13 (motor da base do
Playtest #4, `scripts/playtest/gerarSavesV13.ts`) e v12 (FIX #3): migram,
validam, vivem três anos sem `undefined`/`NaN`, exportam e importam.

## 24. Limitações conhecidas

- A família da parceria (sogros) não é modelada: a rede não pode dizer que a
  esposa perdeu a mãe dela.
- Amizades entre NPCs não existem: a morte de um amigo seu só repercute na
  família dele que o jogo conhece.
- Janela partidária na granularidade anual do jogo (o último ano antes da
  eleição que encerra o mandato), não os 30 dias exatos; justa causa e
  anuência do partido não são modeladas.
- Tempos de deslocamento por porte de cidade, não por bairro; não há
  trânsito variável nem custo de estacionamento.
- A retirada é 80% da sua parte do lucro, sem escolha de pró-labore pelo
  jogador.
- A sobra negativa de fim de ano continua sendo coberta pelas aplicações
  sem pergunta (escrita e na conta do ano).
- Divórcio chega à família próxima do jogador como lembrança e presença,
  não como opinião sobre o ex (não há vínculo entre a família e o ex).
- O catálogo completo junta as três lojas; preços calibrados para o jogo.
- As estratégias do simulador repetem ações (ENEM todo ano, candidatura em
  toda eleição, sair de casa sem renda); as biografias registram — é
  escolha, mas pesa na leitura.
