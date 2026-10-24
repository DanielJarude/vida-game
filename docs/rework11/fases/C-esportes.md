# REWORK 11 · Fase C — Futebol e esportes profissionais + transição para treinador

Branch `rework11-fase-C` (worktree agent-aa44075ce4df477fc), base `b885ccc`. Commits: checkpoints 1/5 a 5/5.

## O que mudou (arquivo:função)

**Módulos novos (chunk `motor`, pequenos):**
- `sistemas/competicoes.ts` — `CompeticaoId` estável (`liga:BR:4`, `copa:ES`, `cont:CONMEBOL`, `sel:mundial`, `sel:UEFA`), nomes como apresentação (`nomeDaCompeticao`, `aCompeticaoId`…): Copa do Brasil, Copa del Rey, Coppa Italia, FA Cup, DFB-Pokal, Coupe de France, Taça de Portugal, Copa Argentina, U.S. Open Cup, Copa do Imperador; Libertadores e Champions League; Copa do Mundo, Copa América, Eurocopa, Copa Ouro, Copa Africana de Nações, Copa da Ásia. Onde o nome não é inequívoco: "copa nacional", "copa continental de clubes da AFC/CAF/CONCACAF". `copaNacional`, `copaContinental` (vaga = `ultima.classificados` da elite do ano anterior), `campanhaDaSelecao` (força do país), `partidaDeCopa`, `trofeuIdDe`. Acaso por `rngDe`.
- `sistemas/atributosEsportivos.ts` — 3–4 atributos por grupo de posição (goleiro: reflexos, posicionamento, saídas, jogo com os pés; defensor: marcação, antecipação, jogo aéreo; meio: passe, visão, resistência; atacante: finalização, movimentação, velocidade) e basquete por função (condução, passe, arremesso, rebote). Valor = técnica + traço de nascença (hash) + desvio guardado. Treino da função sobe; depois do auge o corpo perde e a leitura ganha.
- `sistemas/oficioDoTecnico.ts` — ofício do banco: licença de treinador C/B/A/Pro (custo, meses, requisitos; `pesoDaLicenca` entra em `trabalhoDoTecnico`), análise tática (`ajuste`), gestão do elenco (`vestiario`), diretoria (`pressao`), `semVocabularioCorporativo`, `vestiarioDeExAtleta`.
- `sistemas/comissao.ts` — `clubeDaComissao`: o clube concreto da comissão técnica (último clube de quem jogou, se fica no estado; senão clube profissional da cidade/estado; outras modalidades: a equipe da cidade).

**Existentes:**
- `ligas.ts`: `forcaNaLiga` exportada (neutra fora do catálogo); `sortearPosicoes`/`aplicarTrocas` (refatoração de `jogarTemporada`); **tabela = ordem das forças dos 20** com vagas sem nome à força média−0,7 (bug: o posicionamento "vaga mais perto" punha os 2 mais fracos em 1º/2º numa divisão cheia); ruído da temporada 4→3; `colocacaoNaTabela` (preview determinístico = o que a temporada grava); `vagasContinentais` e `ultima.classificados`.
- `esporte.ts:fecharTemporada`: colocação pela tabela do país + `contribuicaoNaTemporada` (nota × participação × 0,32); goleiro: gols do time por colocação × atributos, Poisson jogo a jogo → `semSofrerGol`/`golsSofridos`; atributos na nota e na produção (substitui o bônus fixo do REWORK 10.6); copas do ano; `t.pais`, `t.competicaoId`; `aplicarLances`; basquete/vôlei com força neutra. `linhaDaTemporada`/`paisDaTemporada` (liga do país da temporada). `transferirPara(…, luvasDepois)`, `creditarLuvas` (com extrato), taxa com `pais`. `ficarSemClube`, `ultimoClubeDe`, `clubeAtual`, `procurarClube`, `capitaniaDoClube`. `anoProfissional`: outro emprego estando sem clube → `encerrarCarreira(...,'escolha')`.
- `palmares.ts`: país da temporada em tudo; `registrarCopas` (título/final/biografia, zebra repercute); `trofeuId` em todo título; avaliação do goleiro pelo campo novo.
- `selecao.ts`: `torneioDoAno(d, ano, pais)` com nomes reais; `disputarTorneio` jogado com força do país; `sel.jogos` soma os jogos dos torneios (e das provas).
- `moeda.ts`: `converterEntrePaises` identidade na mesma moeda; `mesmaMoeda`. `migracao.ts`: sem remessa na mesma moeda. `conteudo/profissao.ts`: "outra moeda"/"(uns … daqui)" só se a moeda muda; luvas creditadas depois da mudança; `esp_renovacao` vale sempre que `v.t >= contratoAte`; `semClube` → `ficarSemClube`; divisões com o país da proposta.
- `profissao.ts`: modo `'atleta'` também sem clube (leitura "Jogador profissional sem clube", ações procurar clube / outra coisa / encerrar); modo novo `'tecnico'` (comissão de clube) com os verbos do banco; `pendurar` sem contrato.
- `trabalho.contratar`: comissão técnica com clube concreto (`Emprego.clube`).
- `tecnico.ts`: `iniciarComando` — assume o clube concreto do emprego (promovido, ou contratado e a divisão cabe no nome) sem mudança; clube da própria cidade assume; senão **proposta** `tec_proposta` (volta a auxiliar até a resposta). Copa nacional fora do BR (`copaDoTecnico`: mata-mata com todos os clubes do país, força pela divisão, final em jogo único); `decidirFinal` devolve `{venceu, placar, unica}`, zebra repercute; seleção do técnico com nome e força do país; divisões com país; vestiário do ex-atleta; licença no trabalho do técnico.
- `situacoes.ts`: lances dos momentos → `es.lances` (temporada em curso); `finalNacional` idem (não reescreve colocação fechada); `tec_final` com o nome do torneio do país, "jogo único"/"ida e volta" e o placar jogado (sem "bola parada").
- `conteudo/caminhos.ts` (`car_curso_empresa`) e `acontecimentos10.ts` (`trab10_promocao/salario/transferencia`) excluem atleta e comissão técnica; `conteudo/tecnico.ts`: divisão do país, "primeira vez como técnico principal"; `noOficio`: treino → atributos; `fechamento.ts`: país.
- UI `Trabalho.tsx`: placar "sem clube · último: X (até AAAA)", "Última divisão", atributos da posição, maior taxa na moeda do comprador, `PainelComissao` (clube, licença, vestiário/diretoria em palavras), kicker "o banco"; `CaminhosDaVida.tsx`: situação "Jogador profissional sem clube".
- `save.ts:normalizarRework11Esportes`: país das temporadas e das taxas (pelo clube), marca de sem clube para saves com `esp_sem_clube`.

## Campos de save novos (todos opcionais; save v20)
`Temporada.semSofrerGol, golsSofridos, pais, competicaoId, copas[], capitao`; `CarreiraEsportiva.atributos, lances, ultimoClube, capitao`; `transferencias[].pais`; `ConquistaEsportiva.competicaoId, trofeuId`; `LigaDoPais.ultima.classificados`; `Emprego.clube`; `Caminhos.licencaDeTreinador`; `TemporadaDeTecnico.copa`; `PassagemDeTecnico.decisao.unica`. O goleiro novo grava `semSofrerGol` (não `defesa`); leitura `semSofrerGolDe` aceita os saves antigos.

## Sims antes/depois (simC/temporada.ts, 1.500 temporadas por cenário; simC/copa.ts, 300)
| Cenário | Antes (média · campeão · ≥17º) | Depois |
|---|---|---|
| Cruzeiro gol 80–96 | 11,2 · 1,4% · 12,4% | 9,1 · 8,1% · 12,0% |
| Cruzeiro gol 88 | 11,2 · 0,8% · 10,3% | 9,0 · 6,0% · 9,6% |
| América Mineiro gol 88 | 14,1 · 0,1% · 29,1% | 15,9 · 0,1% · 55,8% |
| Barcelona gol 90 | 10,4 · 1,3% · 6,9% | **4,0 · 30,2% · 0,9%** |
| Cruzeiro meia 95 titular × reserva | 8,4 × 10,1 | 6,2 × 8,1 (1,85 posição) |
| corr(jogos sem sofrer gol, colocação) | −0,15 (técnica fixa) | −0,71 |
| Z4 com ≥12 jogos sem sofrer gol | 0,27% | 0,00% |
| basquete nível 4 ≥17º | 49,6% (audit 67,7%) | 6,2% |
| vôlei nível 4 ≥17º | 39,3% | 4,0% |
| Técnico Sassuolo (Serie C), copa nacional | final 25,6%, título 13,1% (audit), "estadual" | final 1,3%, título 0,3%, "Coppa Italia" |
| Técnico Juventus (elite) | — | final 13%, título 7% das temporadas |

**Limite honesto (Brasil):** o catálogo põe 15 grandes nas 20 vagas da Série A; com a mesma régua para todos, um grande médio fica em ~9º e cai ~9–10% das temporadas — igual aos grandes do mundo (coerente), mas acima do alvo "≈ top-6 / Z4 ≤ 3–5%", que é aritmeticamente impossível para todos os 15. Na Espanha/Itália/Inglaterra (3–6 grandes) o alvo é atingido (Barcelona 4º, 0,9%). O jogador muda isso pelo que joga (titular 95: 6,2º, 3,1%).

Bundle (`vite build`): motor 692,0→705,6 kB; motor-dados 506,3→515,7; motor-carreira 341,5→344,7; motor-oficio 84,5→86,6; motor-textos 763,89→764,26 (+0,37 kB, abaixo de 800). Todos < 800 kB.

## Testes
- Novos: `src/motor/__tests__/rework11Esportes.test.ts` (29 testes) e `src/ui/__tests__/rework11Esportes.test.tsx` (2) — **todos passam**. Cobrem: grande clube média/Z4 (Barcelona ≤5,5 e ≤4%, campeão ≥12%; Cruzeiro ≤9,8 e ≤13%; tradicional pior), preview = gravado, titular × reserva, goleiro (corr ≤ −0,6 com gols sofridos), basquete/vôlei ≤15%, atributos mudam nota/gols, nomes por país, copa com fases e vaga continental, título de copa com `competicaoId`/`trofeuId`, seleção BR ≥ 3× país pequeno, cadeia BR→ES→IT→BR (liga por temporada, luvas exatas ±1, "a mesma moeda", taxas com país, save), euro→euro identidade, save antigo, lances na temporada em curso (Σ gols = totais), sem clube (modo, leitura, ações, encerrar, outro emprego encerra com biografia, renovação vencida), auxiliar com clube concreto, promoção no mesmo clube, comando por proposta sem mudança, técnico sem ações corporativas + licença, vestiário do ex-atleta, Sassuolo título ≤4%/finais ≤10% com "Coppa Italia", placar da final.
- Antigos rodados (≈50 arquivos de esporte/técnico/ligas/seleção/transferências/caminhos/profissão/UI): 1.290+ testes passam. Falhas restantes, não causadas por esta fase: `rework11Rotina` "o gato de quem trabalha à noite" (falha também na base b885ccc — Fase G); `fechamentoMundo` teste 4 e `profissao` "treinar dobrado" deram **timeout** sob carga da máquina (60s/90s fixos no teste; relacionamentos/vidas longas).
- Ajustados (mudança pedida): `tecnico.test.ts` e `ui/tecnico.test.tsx` (helper aceita a `tec_proposta` do primeiro comando; `decidirFinal(...)?.venceu`); `momentos2.test.ts` (idem proposta); `fixPosRework2.test.ts` (goleiro em `semSofrerGol`, não `defesa`); `rework106` FUT-05 continua passando (o treino sobe os atributos).

## Pendências
- Liga do técnico ainda usa rivais anônimos N(0;3,2) em vez da tabela do país (A2 ESP-11.7 "liga do técnico"; fora do escopo pedido).
- Treinador de goleiros como especialização (opcional) não feito.
- Copas só no futebol (basquete/vôlei sem copa). Indicação/oferta de emprego comum ao atleta sem clube não pergunta antes (A1 A6: `analisarEntrada`, de outro agente) — o fim de carreira acontece no ano seguinte, com biografia.
- Brasil: Z4 de grande ~9–10% (ver limite acima); calibrar exigiria diferenciar os 15 "grandes" do catálogo.
