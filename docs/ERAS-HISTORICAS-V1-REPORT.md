# VIDA · ERAS HISTÓRICAS — primeira versão jogável (protótipo)

Branch `claude/vida-eras-historicas` (a partir do VIDA 18 publicado, `48f8eaf`). **Não integrado à `main` nem à produção**, aguardando avaliação. Auditoria e proposta: `docs/eras/AUDITORIA-E-PROPOSTA.md`. Fontes: `docs/eras/FONTES.md`.

## 1. O que já existia e foi aproveitado

| Sistema existente | Como foi aproveitado |
|---|---|
| Calendário (`tempo.ts`) e `criarVida({ ano })` | A vida nasce no ano escolhido e o calendário anda normalmente. Não houve um motor por década. |
| Unidade monetária única (reais de poder de compra de hoje) e `formatarDinheiro`/`entrarNaVida` | A moeda da época é só apresentação, calculada no único ponto de formatação. Nenhum saldo foi reescrito. |
| Economia anual (`avancarEconomia`) | Até 2025, a vida histórica segue a série real: inflação pelo IPCA e fase da economia pelo PIB. Depois, a simulação de sempre. |
| Mundo vivo (`v14/mundo`: linha do tempo, efeitos no trabalho e nas vendas, "Enquanto isso") | Os acontecimentos brasileiros entram nessa mesma linha do tempo, e os efeitos usam os mesmos `mods`. |
| Celular (`v15`/`v16`/`v17`: mensagens, cota, respostas) | O mesmo motor de mensagens aparece como telefone de casa, celular de teclas ou smartphone. |
| Redes, namoro, lojas/marcas, catálogo de coisas, veículos, profissões, cursos | Ganharam portões de uma linha que consultam o contexto histórico. Não há catálogo nem sistema paralelo. |
| Linha da Vida | Ganhou a marca da década, a moeda do ano e o fio "A época". Não foi criada uma segunda retrospectiva. |
| Normalizadores de save | `normalizarEra`, idempotente. O save continua na v20. |

## 2. O que foi implementado

- **Camada histórica** `src/motor/eras/`:
  - `base/` (pacote `eras-base`, 38 kB): séries oficiais, moedas, tecnologias, o contexto do ano (`tecnologia`, `meioDeComunicacao`, `nivelEconomico`), a peneira de texto, as coisas e os veículos da época, profissões e estudos no tempo.
  - `dados/` + `ano.ts` (pacote `motor-eras`, 39 kB): acontecimentos, cultura e o ano histórico.
- **Interface**, em `src/ui/eras/`: a escolha da época, os aparelhos desenhados, o painel "A época", o selo da moeda e o estilo das décadas.

## 3. A escolha da época

Primeira seção da tela Nascer: **"Quando você nasce"**. Há seis portas: **Hoje (2026, o mundo todo)** e as décadas **1980, 1990, 2000, 2010 e 2020** (até 2025). Escolhida a década, aparecem os anos e uma prévia curta, no estilo de jornal: contexto, tecnologia, cultura, moedas, os desenhos dos objetos da época e os marcos que a infância vai atravessar. Com uma década escolhida, o lugar de nascimento fica restrito ao Brasil, o nome sugerido é o da moda naquele ano e o "Tudo ao acaso" sorteia dentro do Brasil. O resto da criação não mudou. A época fica gravada em `Vida.era = { pais: 'BR', ano, decada }`.

## 4. A cronologia histórica

O ano histórico (`eras/ano.processarEra`) roda uma vez por ano de vida, antes do mundo. Tudo o que tem data cai na janela (aniversário anterior, aniversário atual] e é escrito no mês em que aconteceu:

1. A economia segue a série real até dez/2025.
2. As trocas de moeda.
3. O Plano Collor (retenção e devolução).
4. Os acontecimentos, com condições de idade, estado de residência e situação econômica e de trabalho.
5. As chegadas de tecnologia em casa.
6. As ferramentas do ofício.
7. Uma lembrança cultural do ano, sorteada com gerador próprio (não gasta o sorteio da vida).

Nada se repete (`era.vistos`), e depois de 2025 a vida segue no mundo simulado.

## 5. Acontecimentos incluídos

Ao todo, 53 acontecimentos brasileiros, de 1984 a 2025, mais 8 Copas e 10 Olimpíadas. Todos têm data, fonte, abrangência e idade mínima. A lista completa e as fontes estão no próprio dado e em `docs/eras/FONTES.md`.

- **Política:** Diretas Já e a votação de 25/04/1984; Colégio Eleitoral (15/01/1985); morte de Tancredo; Constituição de 1988; eleições presidenciais de 1989 a 2022; impeachment de Collor (1992); plebiscito de 1993; emenda da reeleição; Lava Jato; impeachment de 2016; 8 de janeiro.
- **Economia:** Plano Cruzado; moratória; Plano Bresser; Plano Collor; URV; real; Mercosul; privatização da Telebrás; câmbio flutuante (1999); racionamento de energia (2001–2002); reformas trabalhista, da Previdência e tributária; auxílio emergencial.
- **Direitos e sociedade:** ECA; Código de Defesa do Consumidor; Bolsa Família; ProUni; Lei Maria da Penha; Lei de Cotas; junho de 2013; Rio-92; COP30.
- **Desastres regionais**, só para quem mora no estado: césio-137 (GO), Mariana (MG/ES), Brumadinho (MG), enchentes de 2024 (RS) e racionamento de 2001 (estados atingidos).
- **Esporte:** Senna; tetra; penta; 7 a 1; Jogos do Rio.
- **Saúde:** covid-19 e a primeira vacina.

**Consequências que o motor aplica de verdade:**
- O Plano Collor retém o dinheiro acima de NCz$ 50 mil e o devolve em 12 parcelas a partir de set/1991.
- O auxílio emergencial é pago a adultos de baixa renda sem carteira (5× R$ 600 + 4× R$ 300).
- Efeitos no emprego e nas vendas pelos `mods` do mundo: Collor, Cruzado, câmbio, racionamento, Copas e enchentes do RS.
- As recessões reais (1981, 1983, 1988, 1990, 1992, 2009, 2015–2016, 2020) viram fase de crise.

As notícias políticas são factuais e neutras: o jogo não atribui resultados econômicos a governantes.

## 6. Moedas e conversões

O motor continua contando em reais de poder de compra de hoje. Na tela e no texto de uma vida histórica, cada valor é mostrado assim:

> valor × **IPCA do mês** (número-índice do IBGE, dez/2025 = 1) × **cadeia oficial**

A cadeia oficial é: Cr$ → Cz$ ÷1000 (28/02/1986) → NCz$ ÷1000 (16/01/1989) → Cr$ 1:1 (16/03/1990) → CR$ ÷1000 (01/08/1993) → R$ ÷2750 (01/07/1994).

- **Sem criar nem destruir dinheiro:** o saldo interno não muda numa troca de moeda. Isso é testado: no mês da troca, o mesmo saldo vale exatamente 1/1000, ou 1/2750 no real. Patrimônio e dívidas são preservados pelo mesmo motivo.
- **Biografia:** guarda o valor nominal da época, como na vida real ("o avô deu Cz$ 693 num envelope"). Na troca, conta quanto o saldo virou ("Cr$ X viraram Cz$ Y — o mesmo dinheiro, com outros zeros").
- **Poder de compra:** a inflação real do ano corrói o dinheiro parado. Na hiperinflação a perda é limitada (aproximação declarada).
- **Salário mínimo:** o piso de salário do motor passa a ser o mínimo vigente no mês, pela série oficial em poder de compra de hoje. O painel mostra o valor nominal (Cr$ 97.176 em maio de 1984; R$ 100 em maio de 1995).
- **Entrada de valores:** os campos onde o jogador digita valores usam a mesma conversão nos dois sentidos.

## 7. Tecnologia e comunicação

São 38 tecnologias, cada uma com quatro datas distintas: lançamento mundial, chegada ao Brasil, popularização na classe média e massificação. A renda da pessoa decide quem tem antes: novidade só para a renda alta; depois, a partir da classe média baixa. Cada vida desloca a adoção em até um ano.

Há dependências entre tecnologias:
- O torpedo exige o celular.
- O aplicativo de mensagens, o de namoro e o banco no celular exigem o smartphone.
- Rede social e e-mail exigem internet; o streaming exige banda larga.

**Consequências reais:**
- O aparelho é da pessoa: telefone de casa até ganhar o próprio celular (~12 anos) ou smartphone (~11; 10 quando já é de todo mundo).
- Sem smartphone, não há aplicativo de namoro (bloqueio com motivo e ano de chegada).
- Cada rede só existe a partir do ano em que chegou ao Brasil e exige internet; ninguém na vida usa a rede antes disso.
- E-mail, mapas, banco e fama no aparelho só aparecem quando existem.
- O texto troca o que ainda não existe: celular → telefone, Pix → depósito, Enem → vestibular (antes de 2009), aplicativo de mensagens, streaming, emoji.
- Chegadas marcantes viram lembrança: a linha de telefone, o videocassete, o computador, a internet (discada ou já banda larga), o primeiro celular (com antena ou pré-pago), o smartphone, o aplicativo de mensagens, o streaming e o Pix.

## 8. Interfaces que mudam com a época

- **Tela Nascer:** a escolha da época.
- **Cabeçalho:** o ícone do aparelho (telefone de casa, celular de teclas ou smartphone), o selo da moeda do mês ao lado do ano e o filete na cor da década.
- **Aparelho de comunicação** (o Celular reaproveitado):
  - Telefone de casa: moldura bege, "Telefone de casa · ano", Recados/Cartas, Jornal, Caderneta, e "Pôr o fone no gancho".
  - Celular de teclas: tela de cristal líquido, Torpedos/Ligações, Jornal.
  - Smartphone: o de sempre.
  - Em todos, só os "aplicativos" que existem no ano, com a explicação do meio.
- **Você → No mundo → "A época":**
  - Mês e ano.
  - Presidência, moeda vigente e a data da troca.
  - Salário mínimo nominal.
  - Inflação e PIB do ano anterior.
  - "Poder de compra": quanto da moeda da época compra o que R$ 1 compra hoje.
  - Como a pessoa se comunica.
  - As tecnologias da vida (comum, novidade ou fora do alcance) e o que ainda não existe no Brasil.
- **Linha da Vida:**
  - Divisória "Anos 1980" / "Anos 1990"...
  - A moeda de cada ano ao lado do ano.
  - As lembranças da época em tipografia de jornal, com fio lateral na cor da década.
  - O fio **"A época"**, que filtra só o país, a moeda, a tecnologia e a cultura.

A direção ilustrada do VIDA foi mantida: os objetos são desenhos SVG no mesmo traço, e as cores são tokens com variante clara e escura.

## 9. Profissões, estudos, produtos e cultura contextualizados

- **Profissões:**
  - 14 profissões só existem a partir do ano em que surgiram: motorista e entregador de aplicativo, cientista e analista de dados, criador de conteúdo, instalador solar, policial penal, agente comunitário de saúde, médico de família, jovem aprendiz e outras.
  - Lembranças das ferramentas do ofício por fase: jornalismo, contabilidade, TI, engenharia/arquitetura, direito, escritório e banco.
- **Estudos:**
  - ProUni só a partir de 2005, FIES de 1999 e EAD de 2000; cota federal só a partir de 2013.
  - Cursos de nome recente: "Tecnologia em Processamento de Dados" antes de ADS; o técnico em desenvolvimento só a partir de 2008.
- **Coisas:**
  - O mesmo catálogo, com nome e descrição da época: videogame de cartucho, videogame de CD, TV de tubo, câmera de filme, som com toca-fitas ou CD, microcomputador.
  - Nada se vende antes de existir.
  - Tecnologia nova custa 2,5× ou 1,5× enquanto não é de todo mundo.
  - 19 marcas e lojas só existem a partir da chegada ao Brasil; as lojas on-line exigem internet.
- **Veículos:**
  - 42 versões da época, com anos reais de fabricação no Brasil: Fusca, 147, Chevette, Gol, Uno e Mille, Escort, Corsa, Palio, Ka, Celta, Fox, Onix, HB20, Opala, Passat, Del Rey, Monza, Santana, Tempra, Vectra, Siena, Civic, Corolla, Bandeirante, Saveiro, F-1000, S10, EcoSport, Duster, Renegade, CG 125, YBR, CG 150, CB 400/450, Sahara, Falcon, Twister e CB 300R.
  - Importados de luxo só depois da abertura de 1990.
  - Clássicos só com 20 anos ou mais.
- **Cultura:** 35 lembranças, como rock nacional, programas infantis, novela, locadora, fliperama, lambada, axé, pagode, sertanejo, álbum da Copa, bichinho virtual, internet discada, lan house, mensageiro, rede de comunidades, torpedo, emo, grupo da família, selfie, séries e vídeos curtos. Cada uma tem faixa de idade e tecnologia exigida.

## 10. O que ainda não está adaptado (limitações honestas)

- **Política do jogador:** a carreira política usa os partidos de 2026 em qualquer ano. Os acontecimentos políticos reais são só contexto.
- **Renda real por época:** só o salário mínimo segue a série. Os demais salários e preços estão na escala de hoje, e não há tabela de preços datada por produto.
- **Moda e aparência** do personagem e das roupas à venda: não foram contextualizadas (nenhuma peça nova foi desenhada).
- **Classes de veículos de lazer** (barcos, aviões, bicicletas comuns) seguem o catálogo atual. A moto média não tem modelo em 2000 (há Sahara até 1999 e Falcon a partir de 2000).
- **Textos do jogo:** a peneira troca expressões conhecidas, não reescreve frases. Algumas cenas escritas para 2026 ainda podem soar modernas.
- **Cidades:** sem camada urbana por década (transporte público, arquitetura).
- **Outros países e antes de 1980:** fora desta versão.
- **Crédito Educativo** anterior ao FIES: não simulado.

## 11. Resultado dos testes

(preenchido abaixo, na seção 17)

## 12. Compatibilidade dos saves

- O campo `era` é opcional e nunca é inventado.
- Saves antigos e vidas contemporâneas não têm o campo, e todos os portões devolvem o comportamento de antes.
- `normalizarEra` só confere a forma: descarta época malformada (a vida volta a ser contemporânea) e é idempotente (testado).
- Os cenários A–D salvaram e reabriram a cada ano (JSON → `interpretar`) sem diferença na época.
- A sucessão (continuar como filho) mantém a época.

## 13. Tamanho dos pacotes

(preenchido na seção 17)

## 14–16. Branch, commit, preview, limitações e próximos passos

(preenchido na seção 17)
