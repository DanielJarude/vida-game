# VIDA 33 — dono de verdade: identidade, investimento, patrocínios, camisa e loja, circuitos reais de e-sports

## O que o jogador pediu
- Personalizar mais o time na criação (futebol, quadra e e-sports): escudo, cores e o resto.
- Como dono, ter as responsabilidades de verdade, como buscar patrocínios.
- Poder fundar com o mínimo ou injetar muito dinheiro para o time já nascer forte.
- E-sports sem "Brasil / Internacional": ligas regionais reais que classificam para os internacionais, cada jogo com os seus campeonatos.
- Uma organização pode estar em vários jogos.
- As lines tinham mais de 5 jogadores. O real é 5 jogadores, um coach e às vezes 1 reserva.
- Pedido feito durante o trabalho: vender produtos (camisas, jerseys) e desenhar a camisa de cada clube ou org.

## O que mudou

### Identidade (`motor/v33/dono/identidade33`, `ui/v33/dono/EditorIdentidade33`, `ui/v30/escudos/Escudo30`)
- **Escudo:**
  - 6 formas (clássico, redondo, pontudo, reto, hexágono, losango) e 8 padrões.
  - 3 cores: principal, secundária e a dos detalhes. Há uma paleta e um seletor livre.
  - No centro vai a sigla (até 4 letras) ou um de 9 símbolos. Opcionalmente, uma estrela.
- **Outros campos:** o apelido da torcida e o nome da casa (estádio, ginásio ou gaming house).
- **Onde se edita:** na fundação (futebol, quadra, e-sports) e depois, no painel do dono.
  - No primeiro ano a edição é livre.
  - Depois disso é um *rebranding*: custa e faz perder 3 de torcida.
- **Onde o escudo aparece:** em todo lugar que desenha o time (tabela, vitrine, cartões). As telas registram a identidade da vida (`registrarIdentidades33`).

### Investimento inicial
- **Futebol** (`previaDaFundacao33`):
  - O clube continua nascendo no estadual, porque dinheiro não pula divisão.
  - O investimento vai para elenco, estrutura ou os dois. No elenco, a média sobe 6 pontos cada vez que o valor dobra, até +24 (elenco de Série A). Na estrutura, compra base, CT e estádio pelo preço das obras.
  - Um quinto do investimento fica no caixa.
  - A prévia mostra o nível do elenco e a folha estimada.
- **Quadra** (`previaDaEquipe33`): elenco até 85, ginásio e caixa.
- **E-sports** (`previaDaEntrada33`): três maneiras de entrar num jogo.
  - Montar do zero, no cenário aberto.
  - Comprar a vaga de uma equipe na segunda divisão.
  - Comprar a vaga na liga principal. Nas ligas fechadas, é a franquia de uma organização que saiu.
  - O investimento vai 3/4 para elenco e comissão, 1/4 para o caixa. Ele decide a força inicial, se há técnico e se há reserva.

### Patrocínios por cota (`motor/v33/dono/patrocinio33`)
- **Cotas por modalidade:**
  - Futebol e quadra: master, cotas da camisa, material esportivo e naming rights. O naming rights exige casa nível 3.
  - E-sports: master, periféricos, bebida e plataforma.
- **Como se fecha um contrato:**
  - O dono busca patrocinadores. A busca custa e há um limite por ano: 2, mais 1 por nível do departamento.
  - As propostas valem até o fim do ano.
  - Dá para negociar (+15%; a marca pode desistir), assinar, recusar ou romper (multa de metade do que falta pagar).
- **Metas:** cumprida, a meta paga bônus. As metas "de cláusula" encerram o contrato se falharem.
- **Departamento comercial** (0 a 3, custo anual):
  - Propostas até 21% maiores e mais buscas.
  - Renovação oferecida por quem gostou da parceria.
  - Uma proposta espontânea por ano.
- **Marcas:** todas fictícias. Os setores respeitam a época (apostas a partir de 2018, cripto de 2018 a 2022, banco digital e delivery a partir de 2015).
- **Saves antigos:** o patrocínio master único das versões anteriores (`patrocinio31`, `Equipe32.patrocinio`, `OrgEsports31.patrocinio`) vira a cota master no carregamento.

### Camisa e loja (`motor/v33/dono/loja33`, `ui/v33/dono/Camisa33`)
- **A camisa:**
  - Desenho: 5 modelos (gola redonda, V, polo, raglan, jersey de e-sports), 8 padrões, 3 cores e a cor das mangas.
  - O escudo vai no peito e o master aparece quando há.
  - A camisa do ano vende 25% a mais. Sem camisa desenhada, a loja vende um modelo genérico (20% a menos).
- **A loja:**
  - Linhas de produto: camisa, edição especial, agasalho/moletom, boné, cachecol (só futebol) e mousepad (só e-sports).
  - Preço: popular, normal ou premium.
  - Onde vender: só online, loja na casa ou licenciamento no varejo.
- **As vendas** andam com a torcida e o resultado do ano.
- **Fabricação:**
  - Com fornecedor de material contratado, ele fabrica e paga royalties: margem menor e nenhum encalhe.
  - Sem fornecedor, o time fabrica: margem maior, e um ano ruim deixa encalhe.

### E-sports com circuitos reais (`motor/v31/esports/circuitos33`)
Cada jogo tem as suas regiões, com as ligas de cada degrau no nome da época:
- **League of Legends:**
  - Brasil: CBLOL, LTA Sul em 2025 e de volta a CBLOL em 2026.
  - América do Norte: NA LCS → LCS → LTA Norte (2025) → LCS.
  - Europa: EU LCS → LEC.
  - Coreia: OGN Champions → LCK. China: LPL.
  - América Latina: LLA (2019–2024).
  - Ásia-Pacífico: LMS → PCS → LCP.
  - Segundas divisões: Circuito Desafiante, NACL, LCK CL, LDL, EMEA Masters.
- **VALORANT:**
  - Até 2022: os Challengers por região.
  - De 2023 em diante: VCT Americas (a mesma liga para Brasil, América do Norte e América Latina), EMEA, Pacific e China (2024). Por baixo, os Challengers (Brazil, NA, LATAM...).
- **Counter-Strike:** a elite é internacional (ESL Pro League). Por baixo, a segunda divisão de cada região (CCT a partir de 2023).
- **Rainbow Six:**
  - Pro League por região até 2020.
  - Depois: Brasileirão (2021–2023) e South America League (2024 em diante), além de NAL, Europe League / Europe MENA League, APAC e China League (2026).
- **Fortnite:** FNCS por região (7 regiões), com divisões a partir de 2023.
- **Rocket League:** RLCS por região (7 regiões, nos anos em que existem).

Regras das ligas:
- **Ligas fechadas** (sem queda e sem acesso direto):
  - LPL desde 2017, LCS desde 2018, LEC desde 2019, CBLOL e LCK desde 2021.
  - VCT desde 2023 (China desde 2024).
  - A Ascension do VALORANT promove o campeão do Challengers de 2023 a 2025. Em 2026 ela acabou: o campeão do Challengers disputa a vaga no Champions.
- **Internacionais:** quem termina nas vagas da liga principal da região vai.
  - Vagas por região, aproximadas das edições recentes.
  - Os eventos: Mundial, MSI e First Stand (LoL); Masters ×2 e Champions (VALORANT); Majors e IEM (CS); Majors, Esports World Cup e Six Invitational (R6); Copa do Mundo de 2019, Invitational de 2022 e Global Championship (Fortnite); Majors e Mundial (RLCS).
- **Orgs reais do catálogo:** cada uma aparece na região em que joga (T1 na Coreia, Sentinels na América do Norte, FaZe no R6 brasileiro...).

### Uma organização, vários jogos (`OrgEsports31.linhas`)
- A organização guarda a marca, a identidade, o caixa, os fãs, o nome, os patrocínios, a loja, o conteúdo e a mesa.
- Cada **line** é um jogo, com a sua região, liga, elenco, técnico, IGL, academia, bootcamp, histórico e troféus.
- **Ações novas:**
  - `entrar`: line num jogo novo.
  - `sair`: vende a line para o caixa. A última line não sai; vende-se a organização.
  - `dono`: identidade, patrocínios e loja.
  - As ações da line recebem `jogo`.
- **A line:** os titulares do jogo e **no máximo 1 reserva** (5+1 no tático e no LoL, 3+1 no Rocket). O técnico fica fora da line.
  - A fundação do zero começa só com os titulares.
  - O pedido de reforço do técnico, com a line cheia, tira o mais fraco.
- **A mesa do dono** traz a line no assunto e um assunto novo do comercial: "a camisa está sem patrocinador".
- **Saves da VIDA 32:** a org de um jogo vira uma line com região real (BR → br/sa; INT → a região conhecida da org). O patrocínio antigo vira a cota master.

### Telas
- **Fundar um time:** identidade (painel recolhível), investimento com foco e prévia (escudo e camisa).
- **Clube de futebol:** aba nova "Patrocínios, camisa e loja". O antigo "Comando e negócios" virou "Comando".
- **Time de quadra:** aba "Patrocínios, camisa e loja" no cartão.
- **Org de e-sports:**
  - Fundar: identidade, jogo, região do circuito, os três modos de entrada com preço e liga, investimento, as regras da liga e as vagas internacionais.
  - Como dono: Painel (mesa e um resumo por line), uma aba por line (o time e o circuito, elenco, mercado, comando, temporadas), Patrocínios/camisa/loja e Organização (entrar noutro jogo, conteúdo, aporte, venda).
- **Notas da versão:** '33'.

## Testes
- **Novos:**
  - `src/motor/__tests__/vida33Dono.test.ts`: circuitos e nomes por época, ligas fechadas, Ascension, vagas; várias lines; investimento; internacionais; patrocínios, loja e identidade; quadra; save antigo.
  - `src/ui/__tests__/vida33Dono.test.tsx`: fundar com sigla e investimento; org com duas lines; buscar e assinar patrocínio.
- **Ajustados à mudança pedida:**
  - `vida32Esports`: lê a line, usa as regiões reais e confere o limite de 5+1.
  - `vida31Clube`: o patrocínio passa pelo departamento comercial.
- **Build:** todos os chunks ≤ 800 kB. O maior é `motor`, com 797,0 kB. Os novos: `motor33-dono` (18,7 kB) e `motor31-esports` (56 kB).
- **Smoke de produção:** 37/37.

## Fontes consultadas (nov/2026)
- LoL 2026: LCS e CBLOL voltam como ligas separadas; CBLOL com 2 vagas no Mundial de 2026 (lolesports.com, "LCS and CBLOL return"; esports.gg).
- R6 2026: SAL, NAL, EML, APL e CNL; Majors em maio e novembro; EWC; Six Invitational 2027 (ubisoft.com, "Welcome to the BLAST R6 Season 2026").
- VALORANT 2026: o fim da Ascension; o campeão do Challengers disputa o Stage 2 e a vaga no Champions (valorantesports.com; dotesports).
- RLCS 2026: a América do Sul com 2 vagas por Major; Mundial de 20 equipes (rocketleague.com; dignitas.gg).
