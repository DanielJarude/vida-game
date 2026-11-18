# VIDA 26 — Corpo e capacidades, atributos esportivos, formação de atletas, caminhos profissionais, pós-carreira e hobbies

Data: 2026-11-17/18 · branch `claude/vida26-corpo-atributos-caminhos` (base `a3b8f2f`, VIDA 25) · um único agente, sem subagentes.
Manual Mestre de Diretrizes lido integralmente antes de começar; relatório da VIDA 25 consultado.

## 1. Escopo e interpretação

Oito frentes, integradas: corpo → capacidades → atributos; criação de personagem; atributos esportivos por modalidade/posição;
progressão de jovens (capacidade × potencial × prontidão, etapas, contrato); menu de caminhos profissionais; pós-carreira
para todas as modalidades e jogos; Hobby × Outros caminhos × Profissão; integração e publicação.
Interpretação: ampliar os sistemas existentes (corpo da VIDA 23/24, `atributosEsportivos`, `esporte.anoNaBase`, ocupações e
escadas de promoção, e-sports da VIDA 25, `Caminhos`) — nenhum sistema paralelo. Tudo novo é derivado (nada de estado
redundante): capacidades, leitura do jovem e portas do pós-carreira são calculadas do estado salvo.

## 2. Situação inicial (auditoria)

| Item | Estado encontrado |
|---|---|
| Corpo (constituição VIDA 23, composição VIDA 24) | implementado; **só o basquete** lia o corpo (estatura); nenhuma "capacidade" |
| Criação: corpo de nascença | implementado; sliders mudos, sem dizer o que é herdado, o que muda e o que cada eixo faz |
| Atributos esportivos | **3–4 por posição/função** (goleiro: reflexos, posicionamento, saídas, pés); nenhum físico real (era técnica ± traço), nenhum mental |
| Formação | registrada ano a ano (VIDA 25); **com defeito**: a avaliação dizia "já tem o nível que o contrato profissional pede" só por técnica ≥ 79 — em 41 de 54 anos de base simulados, 2 deles com menos de 16 anos; o painel "O que você está construindo" repetia ("no nível de um contrato profissional") |
| Etapas da base | só categoria por idade → contrato; sem promoção antecipada nem integração ao profissional |
| Pós-carreira | parcial: futebol (escolinha, comissão → técnico), comissão de basquete/vôlei/natação/atletismo/lutas, professor de tênis, instrutor de lutas; **ausente** para futsal, e-sports e automobilismo; sem mídia, análise ou gestão |
| Menu de caminhos profissionais | ausente |
| Hobby × Outros caminhos | hobbies sem ligação explícita aos caminhos; "dinheiro por fora" misturado aos hobbies; o treino de e-sports listado como lazer |

## 3. Problemas encontrados (gravidade)

1. **Alta** — promessa de contrato profissional a jovens só pela técnica (avaliação da comissão e "O que você está construindo").
2. **Média** — atributos insuficientes e sem relação com o corpo e a pessoa (o mesmo número para tudo).
3. **Média** — sem pós-carreira em futsal, e-sports e automobilismo; poucas portas nas outras modalidades.
4. **Baixa** — classificação das atividades (renda e treino de caminho como hobby); hobbies sem porta para o caminho.
5. **Técnico (encontrado e corrigido durante a obra)** — ciclo entre pacotes (`motor → motor-folhas → motor`, tela branca no
   build) quando as capacidades liam `silhueta`; resolvido lendo a composição pela folha da VIDA 24.

## 4. Relações implementadas entre corpo e atributos

`motor/v26/corpo/capacidades26.ts` (folha) + `sistemas/capacidadesFisicas.ts`. Três camadas: **constituição herdada**
(eixos da VIDA 23) → **condição** (gordura, músculo, condicionamento, saúde — VIDA 24) → **capacidades** (força, potência,
velocidade, aceleração, resistência, agilidade, impulsão, equilíbrio, alcance, recuperação), com **maturação** (força e
fôlego adultos por volta dos 18; agilidade antes) e **envelhecimento** (explosão depois dos 30, força depois dos 35).
Relações (todas pequenas, com razão física, explicadas em `RELACOES26`/`EIXO_NAS_CAPACIDADES26`): pernas longas → passada
(velocidade, impulsão, alcance); músculo → força/potência; gordura acima da média → velocidade, aceleração, impulsão;
condicionamento → resistência/recuperação; estatura → alcance (+), agilidade e arrancada (−); estrutura/ombros → força;
quadril → equilíbrio; os eixos de distribuição só dizem onde a gordura vai. Nenhuma capacidade chega a 0 ou bloqueia algo.
A régua (`REFERENCIA26`) é o profissional médio, calibrada por simulação para que o efeito médio na nota fique ~0.
E-sports: o corpo não dá vantagem no jogo (não entra nos atributos dos jogos).

## 5. Criação de personagem

`ui/telas/CorpoDeNascenca.tsx`: legenda **Herdado / Muda com a vida / Capacidade**; grupos com selo da natureza
(Estrutura — herdado; Onde o corpo acumula — tendência; Músculo — facilidade; Composição e condição física — não se
escolhe, explicado); cada eixo vira **cinco degraus com nome** (rádios acessíveis, tamanho crescente) com o efeito nas
capacidades ao lado; painel **"O que este corpo favorece"** (aos 25, sem treino → treinando, a mesma conta do motor) sob a
prévia das idades (6, 16, 30 sem treino, 30 treinando). Atributos gerais (saúde, físico, felicidade, beleza, inteligência)
continuam no bloco próprio. Em Você · Aparência · Corpo · Condição atual: as capacidades de hoje, com o que pesa em cada uma.

## 6. Atributos esportivos

Catálogo em `motor/v26/esporte/atributos26.ts` (folha), conta em `sistemas/atributosEsportivos.ts` (mesma API).
Quatro naturezas com fontes reais: **técnicos** (técnica + traço + desvio guardado), **táticos** (idem − a leitura que o muito
novo ainda não tem), **físicos** (idem + capacidades do corpo), **mentais** (idem + traços de personalidade — disciplina,
coragem, impulsividade, empatia, sociabilidade — + estresse do momento + maturidade).
- Futebol, por posição (10–13 cada): ex. goleiro — reflexos, posicionamento, saída do gol e 1×1, pés/reposição, jogo aéreo,
  decisão, concentração, agilidade, controle emocional, impulsão, liderança; zagueiro — marcação, antecipação/interceptação,
  desarme, jogo aéreo, posicionamento, força, passe (saída), concentração, velocidade, decisão...; lateral, volante, meia,
  ponta, atacante com conjuntos próprios (passe curto/longo, cruzamento, drible, domínio e primeiro toque, movimentação,
  disciplina tática, determinação...).
- Basquete por função (armador/ala/pivô, com alcance e rebote), vôlei por função (levantador, ponteiro, oposto, central,
  líbero — levantamento, recepção, bloqueio, alcance...), futsal por função (goleiro, fixo, alas, pivô), atletismo por grupo
  de prova (velocidade, fundo, saltos, arremessos), tênis (saque, forehand, backhand, devolução, rede...), natação (técnica de
  nado, saída do bloco, viradas, alcance...), lutas (golpes, chão, defesa, controle de distância...).
- E-sports por jogo: CS ganhou controle de spray, movimentação, mapas, leitura do adversário; R6 mapas, decisão, leitura;
  Fortnite construção e edição, movimentação, leitura; VALORANT spray e movimentação; LoL repertório de campeões, trabalho em
  equipe, leitura; Rocket controle aéreo, trabalho em equipe; funções pesam os novos.
Efeito real: tudo entra na nota (`efeitoNaNota`) e na produção; **deficiência grave** (atributo com peso ≥ 10% e 8+ abaixo do
nível na posição) cobra a mais na nota; o treino extra sobe os três atributos que mais pesam no grupo treinado; o tempo tira
do corpo e dá à leitura. Ficha: nível na posição explicado, grupos (técnicos, táticos, físicos, mentais), peso, fonte de cada
valor, limitação séria marcada, fortes/limitações relativos ao nível da posição, comparação com o ano anterior.

## 7–9. Formação, progressão e contratos

`sistemas/jovemAtleta.ts`: **capacidade atual** (nível na posição com o corpo e a cabeça de hoje), **potencial** (estimativa
do teto do mesmo modelo do treino, em faixa que estreita com a idade — nunca abaixo da técnica de hoje) e **prontidão**
(técnica vs. régua 45%, físico 25%, experiência de jogos 15%, maturidade 15%).
- Contrato: Lei 14.597/2023 (Lei Geral do Esporte), art. 99 — primeiro contrato especial de trabalho esportivo a partir dos
  16 anos, pela entidade formadora (fonte consultada; texto oficial não aberto na íntegra). No jogo: **nunca antes dos 16**;
  aos 16 só o excepcional (técnica ≥ régua + 4 e prontidão ≥ 78); de 17 em diante, régua + prontidão ≥ 55; a chance cresce
  com a prontidão e com a integração ao profissional.
- Etapas separadas: destaque na categoria; **subir de categoria antes da idade** (raro: nota ≥ 7,8, técnica da categoria de
  cima, físico mínimo; passa a ser medido contra a categoria em que joga); **treinar com o elenco profissional** (16+,
  prontidão ≥ 62); primeiro contrato; estreia.
- Avaliação da comissão por frases tiradas dos números (destaque, evolução técnica acima da média, físico a desenvolver,
  potencial sem o nível ainda, técnica acima da idade mas falta X, perto da régua, condições de contrato) — sem contradição.
- Tela: cartões Capacidade atual / Potencial (estimativa) / Prontidão; a coluna da categoria marca "subiu ao sub-17" e
  "treinou com o profissional"; "O que você está construindo" não diz mais "no nível de um contrato" a quem não tem idade ou
  prontidão.

## 10. Caminhos profissionais (menu)

Nova divisão **Caminhos · Guia de carreiras** (`ui/v26/guia/Guia26.tsx`, dados em `motor/v26/carreira/trajetorias26.ts`):
as 8 modalidades, os 6 jogos de e-sports e o automobilismo; para cada um: como começa, etapas (com idades reais do jogo e a
etapa desta vida marcada), o que faz evoluir (atributos que mais pesam, o corpo, a cabeça), onde se compete (divisões,
degraus, categorias com nomes reais), depois de competir e outras portas (amador tardio, ficar no hobby, trocar de esporte).

## 11. Pós-carreira, modalidade por modalidade

`motor/v26/carreira/posCarreira26.ts` + 16 ocupações novas (`motor/v26/dados/ocupacoes26.ts`) e a comissão do futsal:
- Futebol: treinador de escolinha, auxiliar técnico (→ técnico), treinador de goleiros (ex-goleiro), analista de desempenho
  (→ coordenador), comentarista (→ comentarista de TV), gerente esportivo (→ diretor esportivo), preparador físico.
- Futsal: escolinha, auxiliar técnico de futsal (→ técnico de futsal, novo), analista, comentarista, gerente, preparador.
- Basquete e vôlei: auxiliar técnico da modalidade (→ técnico), analista, comentarista, gerente, preparador.
- Tênis: professor de tênis (→ treinador de tenistas, novo), comentarista, preparador.
- Natação: professor de natação (novo), auxiliar técnico (→ técnico), comentarista, preparador, coordenador de academia.
- Atletismo: professor de iniciação (novo), auxiliar técnico (→ técnico), comentarista, preparador.
- Lutas: instrutor, auxiliar técnico (→ técnico), comentarista, preparador, coordenador de academia.
- E-sports: analista (→ técnico → gestor de equipe), narrador/comentarista (→ caster principal), criador de conteúdo.
- Automobilismo: instrutor de pilotagem (→ treinador de pilotos), comentarista.
Chance pela trajetória (anos, nível máximo, títulos, reputação, capitania, posição, faculdade); porta fechada diz o motivo;
sem títulos não é sem portas (escolinha/aula/análise). Duas entradas: convites no ano seguinte ao fim (até 2, sorteio
derivado) e a ação **Procurar** (uma tentativa por porta por ano), em Outros caminhos, Trabalho · Procurar trabalho e no
Guia. São empregos comuns: salário, rotina, escada de promoção da trilha (e da modalidade), estresse, histórico; as funções
de mídia e gestão mantêm o nome (fama). A carreira encerrada não é tocada.

## 12. Hobby, Outros caminhos e Profissão

Auditoria: Minha Semana · Hobbies (arte, estudo, ofício, lazer, renda), Corpo e mente (esportes, academia, corrida, lutas) e
Caminhos · Outros caminhos (automobilismo, e-sports, base, arte, universidade, vida religiosa). Classificação
(`motor/v26/hobby/hobbyCaminho26.ts`): hobby; parte de um caminho (o treino de e-sports); atividade de estudo (grêmio,
monitoria, cursinho...); dinheiro por fora (bicos, freelas, entregas — "trabalho por conta, não hobby", agora por último na
exploração); cuidado; convívio. Nenhuma atividade removida ou renomeada; ids e saves intactos.
Portas: cada hobby que abre caminho mostra no cartão "Pode levar a: A → B → C → D", o próximo passo real da idade e o que
pesa (esportes: janela da peneira, amador tardio, ou "segue como hobby"; videogame → e-sports; música/dança/teatro → banda
ou grupo; ofícios → as vagas que pedem aquela técnica). Outros caminhos ganhou "Dos seus hobbies". Ponte real nova: quem joga
videogame há anos (12–24) pode ser chamado por um time amador e começa nos e-sports pelo competitivo amador; os anos de jogo
passaram a pesar na mão inicial (antes, só "joga ou não").

## 13–14. Integrações e preservação

Corpo ↔ atributos físicos ↔ nota/produção; personalidade/estresse ↔ mentais; formação ↔ contrato ↔ biografia; pós-carreira ↔
trabalho (salário, promoção, histórico, oportunidades) ↔ fama; hobby ↔ caminhos ↔ e-sports. Preservado: carreiras,
temporadas, palmarés, formação da VIDA 25, e-sports, automobilismo, técnico de futebol, decisão de fim de carreira existente.

## 15. Saves

Save continua v20; campos novos opcionais (`adiantado26`, `integracao26`, `AnoDeFormacao.{acima, capacidade, prontidao,
potencial}`). Normalização: o "jogo de fundo" do tênis passa ao forehand e ao backhand; carreiras de e-sports antigas recebem
os atributos novos na média dos que já tinham (nível de jogo preservado). Saves sem `composicao24` usam a âncora pela forma
para as capacidades. Testado (salvar → reabrir) e nos saves de QA da VIDA 25.

## 16. Testes

- Novos: `motor/__tests__/vida26.test.ts` (22) e `ui/__tests__/vida26.test.tsx` (7). Ajustados, com a intenção mantida e
  comentados: `rework11Esportes` (conjuntos por posição; fixture com o corpo do profissional médio; amostra do Barcelona de
  220 → 800 temporadas: o critério ≤ 4% ficou igual — medido 3,9% agora e 3,5% antes; com 220, 9 vs 8 rebaixamentos cruzava
  a linha por ruído), `vida25Esportes`, `ui/vida25`, `ui/vida24` (eixos viraram rádios).
- Suíte completa (`npx vitest run --maxWorkers=3`): **3014 passaram, 5 falharam, 1 pulado (3020)**. As 5 são timeouts, sem
  asserção falhando: `fechamentoMundo #4` e `motor regra de agência` (timeout fixo de 60 s, pré-existentes), e
  `fixPosPlaytestHumano`, `profissao clima`, `rework115Esportes basquete e vôlei` — rodados sozinhos falham também na base
  `a3b8f2f` nesta máquina (mesmo resultado nos dois).
- `tsc --noEmit` limpo; build ok (maior pacote: motor-textos 799.958 B < 800 kB, inalterado; código novo em pacotes
  `motor26-*`); smoke `scripts/itch/smoke.mjs` 35/35; ciclos de pacotes iguais aos da versão anterior.
- Simulações (`~/vida-trabalho/v26/sim`): futebol (60 vidas): 0 crash, 0 contrato antes dos 16, 0 promessa de contrato a
  menor de 16 (base: 41 de 54 avaliações com "já tem o nível"), 2 promoções antecipadas, 9 integrações ao profissional,
  efeito médio dos atributos na nota +0,11; outras modalidades (70 vidas): 0 crash, efeito −0,03; e-sports (simulação da
  VIDA 25, 6 jogos): 0 crash, distribuições como antes; pós-carreira: aposentados que procuraram acharam trabalho (escolinha,
  comissão, mídia, análise).

## 10/QA visual

`scripts/playtest/gerarVida26.ts` (aposentada do vôlei, jovem gamer e jogador, menino de 13 na base) + `fotos26.mjs`
(cenas, larguras, temas; mede rolagem lateral, texto quebrado, erros) + `elemento26.mjs`. Local: 9 cenas × 1440/390 ×
claro/escuro = 36 capturas sem problemas. Ajustes feitos na QA: grade da ficha, quebra de nomes, prévia da criação em uma
coluna, "Música" com acento, frase sem "e … e".

## 17. Limitações e pendências

- O efeito do corpo é limitado a −12 por atributo: corpos muito abaixo da régua se diferenciam menos entre si.
- O potencial é estimativa do modelo de treino; não há olheiros com opiniões divergentes.
- Pós-carreira de comentarista/gestão é emprego com nome genérico de empregador ("uma rádio e um canal esportivo"); não há
  emissoras nem clubes nomeados para essas funções.
- A promoção antecipada e a integração ao profissional existem para modalidades de clube (futebol, futsal, basquete, vôlei);
  nas individuais, a formação segue por equipe de base/circuito juvenil.
- Lembrete da VIDA 25 continua: elite doméstica alta para o atleta totalmente dedicado da simulação.

## 18–20. Publicação

Commits de código `8a6dc77`, `1d5f929`, `3dd5327` em `origin/claude/vida26-corpo-atributos-caminhos`, `origin/main` e
`origin/claude/fix-pos-rework3-playtest` (produção do Cloudflare Pages), por avanço direto (sem force push). Verificado em
2026-11-18: https://vida-game.pages.dev/ serve `index-Dr2AqqFz.js`; `/` e os 173 arquivos JS/CSS são sha256-idênticos ao
build local (174/174). QA funcional na produção: 9 cenas × 1440/390 (tema escuro), 18 capturas, sem rolagem lateral, sem
texto quebrado, sem erro de console; abertura do app sem erro de página. Este relatório é um commit de documentação
posterior, só em main e na branch da versão.

Fontes: Lei 14.597/2023, art. 99 (consulta em legjur.com e admdireito.com.br, nov/2026).
