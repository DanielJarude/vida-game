# A2 — Auditoria: simulação esportiva profissional (REWORK 11)

Escopo: futebol (jogador e técnico), basquete/vôlei/tênis/individuais, ligas, palmarés, seleção, transferências e moeda.
Leitura apenas (nenhum arquivo do repo foi editado). Sims em `scratchpad/aud2/` (`temporada.ts`, `transf.ts`, `copa.ts`, `quadra.ts`); saídas em `aud2/*.out` e abaixo.

---

## 0. Números medidos (sims)

### 0.1 Temporada do jogador (`fecharTemporada`, 3.000 temporadas por cenário, Série A, titular)

| Cenário | Colocação média | Campeão | Top‑4 | Z4 (17–20º) | corr(clean sheets, colocação) | corr(nota, colocação) |
|---|---|---|---|---|---|---|
| Cruzeiro (grande) · goleiro, técnica 80–96 | **11,1** | **2,1%** | 7,8% | **13,0%** | −0,47 | −0,53 |
| — técnica 80 | 14,1 | | | 29,5% | | |
| — técnica 88 (≈ barra da elite 89) | 10,9 | | | 9,2% | | |
| — técnica 96 | 8,0 | | | 1,8% | | |
| América‑MG (tradicional) · goleiro | 13,9 | 0,2% | 2,1% | 30,5% | −0,47 | −0,52 |
| Cruzeiro · atacante técnica 90 | — | | | 5,9% | corr(gols, colocação) = −0,13 | |
| Cruzeiro · meia 88 titular × reserva | 10,98 × 10,97 | | | | | |

- Clean sheets do goleiro: média 8,7 (máx 16) por temporada; **independentes do time** dado a nota (a correlação −0,47 vem só da causa comum `nota`). Z4 com ≥12 jogos sem sofrer gol: 0,1% (grande) / 1,3% (tradicional) — o caso relatado é possível e não há trava.
- O **mesmo grande sem o jogador** (tabela do mundo, `ligas.jogarTemporada`, 100 temporadas): ES/IT/GB campeão da elite é grande em **100%** das temporadas; queda de grande 1,1–2,7%/temporada. BR: campeão grande 37%, queda 15,4% (12 grandes para 20 vagas). **O clube da vida é muito mais fraco que o mesmo clube no mundo** (média 11º × domínio total).

### 0.2 Basquete e vôlei (clube da vida, técnica = barra + 4, titular, 1.500 temporadas)

| | Colocação média | ≥17º (= rebaixamento) | Campeão |
|---|---|---|---|
| basquete nível 2 / 3 / 4 | 12,4 / 15,1 / **17,5** | 15,8% / 40,0% / **67,7%** | 0,1% / 0% / **0%** |
| vôlei nível 2 / 3 / 4 | 12,2 / 15,0 / **17,4** | 15,1% / 38,7% / **65,7%** | 0,2% / 0% / **0%** |

Causa: `forcaDoClube("equipe de basquete de São Paulo")` = 2 (fora do catálogo) e `forcaClube = (2 − nivel)·3` = −6 na elite (`esporte.ts:579`); a queda nas modalidades de quadra é `colocacao >= 17` (`palmares.ts:156`).

### 0.3 Transferência Cruzeiro → Barcelona → Juventus → Cruzeiro (decisão real `esp_proposta`, `transf.ts`)

| Passo | O que se vê | Bug |
|---|---|---|
| Após ir ao Barcelona | Temporadas 2051/2052 **"Cruzeiro: Primera División"** | Liga de temporada antiga lida no país corrente |
| Após ir à Juventus | "2051 Cruzeiro: Serie A · 2053 Barcelona: Serie A" | idem |
| Após voltar ao Cruzeiro | "2053 Barcelona: Série A · 2054 Juventus: Série A" | idem |
| Luvas BR→ES | 743.300 un. creditadas **antes** do câmbio; k=0,7576 → **perde 180.194 un. (−24%)** | ordem credita/redenomina |
| Luvas ES→IT | k=0,9375 → perde 54.200 un. (−6%) | idem |
| Luvas IT→BR | k=1,408 → **ganha 112.526 un. (+41%)** | idem |
| Taxas na ficha | Proposta dizia "€ 2.803.631 (uns R$ 16.353.480)"; a ficha mostra "Cruzeiro→Barcelona **R$ 12.389.000**" | taxa sem moeda/país, exibida no país de hoje |
| Texto ES→IT | "Salário de € 106.795 (uns € 106.789 daqui) … **outra moeda**" | dois países do euro tratados como moedas diferentes |
| Cruzeiro, goleiro técnica 92 | **Rebaixado em 2052** como titular | 0.1 |

Conversão euro→euro: `converterEntrePaises(1000,'ES','IT')` = 937,5 un., que exibidas na Itália dão **€ 226 = € 226** (ES→DE, PT→IE idem). A conversão já é identidade em euros (fator/preços ≈ 0,1714 constante) — só sobra um resíduo de arredondamento (−0,006%) e a remessa de 1,5% (`migracao.ts:235`) cobrada entre países do euro.

### 0.4 Técnico: "copa nacional" do Sassuolo (Serie C, regional) — `copa.ts`, 2.000 temporadas

- Os participantes são os clubes do catálogo **da mesma região** (uf 45 = Emília‑Romanha: só Bologna e Sassuolo) + 10 times anônimos de força −1,5 (`tecnico.ts:333–336`).
- Sassuolo chega à final em **25,6%** dos anos, é campeão em **13,1%** (sorteio neutro); finais contra o Bologna: 240, vencidas 89 (**37%**). Força média na final −0,12 (≈ iguais), porque `valorNoEstado` só olha o porte (Bologna tradicional 3, Sassuolo regional 0) e **ignora a divisão**.
- Com a cena `tec_final`, o resultado é o desfecho escolhido (`otimo|bom` = campeão, `tecnico.ts:615`), e o título da cena diz **"Final do estadual"** também na Itália (`situacoes.ts:1339`).

---

## 1. Matriz

| # | Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação (mínima) | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|---|
| ESP‑11.1a | Colocação do clube do jogador | `esporte.ts:578–584` | Parcial | Grande na elite termina em média 11º, 13% Z4, 2% campeão; no mundo o mesmo grande vence 100% (ES/IT/GB) | `forcaClube = (forcaDoClube − nivel)·3` = 0 para grande na elite; ruído σ=4; o mundo usa `forcaNaLiga` fracionária (`ligas.ts:48`) e só os rivais do catálogo | `ligas.fecharTemporadaDaLiga`, palmarés, seleção | Alto (imersão, rebaixamento de grandes com o jogador) | Extrair `forcaNaLiga` exportada e usar em `fecharTemporada`: `colocacao = colocacaoDoClube(v, e, nota)` que sorteia **a mesma tabela** de `ligas.jogarTemporada` com o clube da vida com força `forcaNaLiga + contribuição(nota, titular, minutos)`; sem ruído normal independente | Cruzeiro grande, técnica 88, 3.000 temporadas: colocação média ≤ 6, Z4 ≤ 3%, campeão ≥ 15%; tradicional pior que grande |
| ESP‑11.1b | Clean sheets / desarmes / gols × resultado | `esporte.ts:574–577`, `tipos.ts:1783` | Decorativo | Clean sheets independentes de quantos gols o time sofre; `defesa` significa "jogos sem sofrer gol" no goleiro e "desarmes" nos outros | Fórmula por jogo × nota, sem placar de time | palmarés (`avaliarTemporada`), UI | Médio | `fecharTemporada` gera primeiro o desempenho do time (pontos/gols pró/contra da tabela) e deriva clean sheets do goleiro como `Binomial(jogos_titular, p(sem gol|gols contra do time))`; separar campos `jogosSemSofrerGol` e `desarmes` | Z4 com ≥12 clean sheets < 0,5%; corr(clean sheets, colocação) ≤ −0,7 |
| ESP‑11.1c | Peso de titular/minutos/lesão na colocação | `esporte.ts:584` | Fraco | Titular × reserva: 10,98 × 10,97; meses fora só cortam partidas | Coeficiente 1,6 vs 0,6 sobre `(nota−6)` com nota≈6 | 11.1a | Baixo | Contribuição do jogador = `(nota−6)·minutos/minutosMax·k` | Titular técnica 95 melhora colocação média ≥1,5 posição vs reserva |
| ESP‑11.1d | Basquete/vôlei: colocação e rebaixamento | `esporte.ts:579`, `palmares.ts:156` | **Quebrado** | Elite: média 17,5º, rebaixa 66–68% das temporadas, nunca campeão | `forcaDoClube` de equipe fora do catálogo = 2 | palmarés, reputação | Alto | `forcaDaEquipe(d, nivel)` = nivel (neutro) para modalidades sem catálogo, ou `forcaClube = 0` quando `!clubePorNome` | Basquete/vôlei nível 4 com técnica = barra: colocação média 9–12, rebaixa ≤ 15% |
| ESP‑11.2 | Atributos por posição/modalidade | `frentes.habilidade` (1 escalar), `esporte.ts:540–542` (GOL/ASSIST/DEFESA), `modalidades.ts:81–94` (função/estatura basquete), vôlei/provas/luta | Parcial | Uma só técnica por modalidade; posição muda taxas, auge e risco de lesão (`esporte.ts:191–192`); não há atributos (reflexo, finalização, passe). No basquete, estatura entra na nota (`esporte.ts:562`); função muda só o perfil estatístico | Design de 1 escalar | treino, seleção, mercado | Médio | Manter o escalar e adicionar `ênfase` por posição (0..1) alimentada pelo treino de função; usar só em produção, não em nota | Treino de goleiro aumenta clean sheets ≥ +8% mantendo nota |
| ESP‑11.2b | Treinos do ofício | `noOficio.ts:97–105,174–181`; `esporte.ts:564–566,574–577,1040` | Funciona (fraco) | Técnico: +0,25 nota e ×1,1 na produção da posição; tático: +0,15 nota, +1 reputação; físico: forma +4 (≈+0,18 nota) e lesão ×1,15 | Efeito somado à nota; colocação só via `(nota−6)·1,6` (≈+0,4 posição) | 11.1a | Baixo | Após 11.1a, o efeito passa a pesar na força do time via contribuição | Medir Δcolocação com/sem treino (esperado 0,5–1 posição) |
| ESP‑11.3a | Competições do jogador | `palmares.ts:104–198`; `selecao.ts:235–239` | Lacuna | Jogador só disputa **a liga**; não existe copa nacional, copa continental de clubes, fases | Não implementado | palmarés, legado, notoriedade | Médio | Novo `competicoes.ts`: `copaNacional(v, pais, ano)` e `continentalDeClubes(v, ano)` jogadas rodada a rodada (mata‑mata) com as forças de 11.1a; vaga continental = top‑N da liga do ano anterior | Clube campeão da liga disputa a continental no ano seguinte em 100% dos casos; fases gravadas |
| ESP‑11.3b | Nomes de competições | `dados/clubes.ts:170–176` (divisões do perfil: "Série A", "Premier League", "Serie A"); `tecnico.ts:69–73` ("campeonato estadual"/"copa nacional"); `selecao.ts:236–238` ("o torneio mundial de seleções", "o torneio continental de seleções") | Parcial | Ligas usam nomes reais do perfil; copas e torneios são genéricos; sem ids estáveis (`ConquistaEsportiva.competicao` é string, `Temporada` não guarda país) | Nome é derivado em tempo de leitura | 11.5, 11.6 | Médio | Introduzir `CompeticaoId` estável (`liga:BR:4`, `copa:BR`, `cont:CONMEBOL:clubes`, `sel:mundial`) e uma tabela de nomes por perfil de país (`perfil.esporte.copas`), mantendo genérico onde não houver dado | Toda conquista e temporada têm `competicaoId`; renomear um perfil não altera ids |
| ESP‑11.3c | Fases (semifinal etc.) | tênis `esporte.ts:621–672`; técnico estadual `tecnico.ts:340–356`; seleção `tecnico.ts:655–667`, `selecao.ts:262–276` | Parcial | Fases existem no tênis, estadual do técnico e seleção; o torneio de seleção do JOGADOR é um **sorteio de fase com pesos fixos** — Brasil e San Marino têm a mesma chance (12–20% de título) | `pesos` constantes (`selecao.ts:267–270`) | seleção, palmarés | Médio | `disputarTorneio` com força do país (`concorrenciaNoPais`) e mata‑mata jogado como no técnico | Título mundial: país forte ≥ 3× país fraco |
| ESP‑11.4 | Copa do técnico fora do Brasil | `tecnico.ts:69–73,331–356,608–633` | **Errado** | "copa nacional" = round‑robin dos clubes da **mesma região** + 10 anônimos; divisão ignorada; Sassuolo (Série C) campeão 13,1%, vence o Bologna 37% das finais | `rivais` filtrados por uf; `valorNoEstado` só pelo porte | `situacoes.tec_final` | Alto (narrativa absurda) | Fora do BR: `copaNacional` com todos os clubes do país, mata‑mata, força = `forcaNaLiga` − penalidade por divisão (ex. −2 por degrau); manter estadual só no BR | Clube da Série C campeão da copa ≤ 2%; vence clube da elite em final ≤ 25% |
| ESP‑11.8 | Texto da final do técnico | `situacoes.ts:1336–1347` | **Errado** | "Final do estadual" e "Ganhou o estadual" também na Itália; desfechos afirmam detalhes não gerados ("Um gol de bola parada decidiu", "Duas vitórias, a taça erguida no seu estádio") e `decidirFinal` sorteia ['v','e'] ou ['e','v'] independente do texto "Vitória na ida, empate na volta" | Textos fixos; `decidirFinal` (`tecnico.ts:617`) não recebe o placar do texto | Momentos da carreira | Médio | Título/textos via `torneioCurto(p.municipioId).nome`; `decidirFinal` devolve `{ida, volta, placar}` e o texto é montado a partir disso (sem "bola parada" se não há lance gerado) | Na Itália, nenhuma ocorrência de "estadual"; texto do desfecho bate com `t.v/t.e/t.d` somados |
| ESP‑11.5a | Fonte de verdade do clube atual | `CarreiraEsportiva.clube/municipioId/nivel/emprestimo` (`tipos.ts:1513–1563`), `transferirPara` (`esporte.ts:398–419`) | OK | Clube, cidade, divisão e emprego são atualizados juntos; a residência migra (via esporte garantida, `migracao.ts:106`) | — | — | — | — | Sim (sim confirmou clube/cidade/emprego/residência coerentes) |
| ESP‑11.5b | Liga das temporadas passadas | `esporte.ts:691` (`divisaoDoNivel(t.nivel)` sem país), UI `Trabalho.tsx:586`; `palmares.ts:107,122` | **Bug reproduzido** | "2051 Cruzeiro: Primera División", "2053 Barcelona: Série A" | `Temporada` não guarda país/competição; leitura usa `paisCorrente()` | UI, biografia, fechamento (`fechamento.ts:30`) | Alto | Gravar `t.pais = paisDaCidade(e.municipioId)` e `t.competicaoId` em `fecharTemporada`; `linhaDaTemporada` usa `divisaoDoNivel(t.nivel, t.pais ?? …)`; migração de save: inferir país pelo `clubePorNome(t.clube)` | Depois de 3 transferências entre países, cada temporada mostra a liga do país do clube |
| ESP‑11.5c | Divisão no texto "Estreia na elite" e `situacoes` | `palmares.ts:122`, `situacoes.ts:1044`, `tecnico.ts:74` | Bug latente | `divisaoDoNivel(4)`/`competicaoDe(..)` sem país | idem | — | Médio | Passar `paisDaCidade(e.municipioId)`/`p.municipioId` | Grep: nenhuma chamada de `divisaoDoNivel`/`competicaoDe` sem país no motor |
| ESP‑11.5d | Luvas | `esporte.ts:372–375,410`; `migracao.ts:234` | **Bug reproduzido** | Luvas em unidades do país do clube creditadas **antes** de `redenominar` → −24% BR→ES, −6% ES→IT, +41% IT→BR | Ordem: `transferirPara` credita, depois `mudarComOTrabalho` → `migrar` converte a conta inteira | dinheiro, extrato | Alto (dinheiro errado) | Em `transferirPara`, não creditar; devolver `luvas` e creditar depois da mudança (`aceitarProposta` após `mudarComOTrabalho`), com `lancar(v, 'Luvas da transferência', …)`; ou creditar `converterEntrePaises(luvas, paisDoClube, paisDaVida(v))` | Conta após aceitar = (conta − custo)·k·0,985 + luvas (± 1 un.) para BR→ES, ES→IT, IT→BR |
| ESP‑11.5e | Taxa de transferência | `esporte.ts:385–391,409`; UI `Trabalho.tsx:592` | Parcial | Nunca vai para o atleta ✔. Mas é guardada sem moeda/país e exibida no país de hoje: "R$ 12.389.000" vs "€ 2.803.631 (uns R$ 16.353.480)" | `transferencias[]` = `{t,de,para,taxa}` só | UI, legado | Médio | Gravar `{pais, moeda, taxaLocal}` (valor já em moeda local do comprador) e exibir com `formatarDinheiro(taxa, pais)` | A ficha mostra a taxa na moeda em que foi paga |
| ESP‑11.5f | Moeda euro↔euro | `moeda.ts:46–49`, `catalogo.ts` (fator/precos); `profissao.ts:651,665` | Quase OK | Conversão já preserva o valor em euros (€ 226 → € 226), mas o texto diz "outra moeda" e "(uns € 106.789 daqui)"; remessa 1,5% cobrada entre países do euro | Texto não compara `moedaDoPais`; `converterEntrePaises` não curto‑circuita mesma moeda | migração | Baixo | Em `converterEntrePaises`, se `moedaDoPais(de) === moedaDoPais(para)` devolver `valor·fatorDe/fatorPara` exato; em `consequenciaDaProposta`, "a mesma moeda" e sem "(uns … daqui)"; remessa 0 na mesma moeda | ES→IT: valor exibido idêntico ao centavo; texto sem "outra moeda" |
| ESP‑11.5g | Salário e contrato | `salarioDoContrato` (`esporte.ts:234–262`), `MERCADOS` (`esporte.ts:308–312`) | OK | Salário em unidades do país do clube (poder de compra), não reconvertido na migração (`redenominar` não toca `trabalho.atual`) ✔ | — | — | — | — | — |
| ESP‑11.6a | Onde mora a memória | Temporadas `e.temporadas` (cap 30, `esporte.ts:609`), totais `e.totais`, palmarés `v.caminhos.palmares` (cap 120, `palmares.ts:49`), seleção `e.selecao`, momentos `v.caminhos.situacoes` (cap 60; UI mostra 8, `situacoes.ts:1741`), biografia `escrever` | Fragmentado | Fontes diferentes, sem id comum; capitania só da seleção (sem capitão de clube) | — | UI, biografia, legado | Médio | Ligar cada registro à temporada por `{carreiraId, ano, competicaoId}` | Ficha, palmarés e biografia derivam do mesmo registro |
| ESP‑11.6b | Momentos alteram temporada fechada | `situacoes.ts:389` (gols/assist/defesa), `situacoes.ts:1034–1048` (`finalNacional`) | **Inconsistente** | Somam gols/clean sheets à temporada **depois** de palmarés, prêmios e biografia já escritos; não atualizam `e.totais`; `finalNacional` muda `colocacao` para 1 depois do acesso/rebaixamento já decidido | Efeito aplicado no registro, não num "jogo" da temporada | palmarés, artilharia | Médio | Aplicar o efeito numa temporada **em curso** (abrir `temporadaAtual` antes das cenas) ou também em `e.totais` e reavaliar prêmios; nunca mudar `colocacao` depois de `fecharTemporadaDaLiga` | Soma de gols das temporadas == `totais.gols`; nenhum título sem colocação 1 na tabela |
| ESP‑11.6c | Seleção: jogos do torneio | `selecao.ts:200,276` | Inconsistente | `sel.jogos` não soma os jogos do torneio (ficam em `torneios[].jogos`) → "N jogos pela seleção" menor que o vivido | — | leitura (`palmares.ts:229–236`) | Baixo | `sel.jogos += jogou` em `disputarTorneio`/`disputarProva` | `sel.jogos == janelas + Σ torneios.jogos` |
| ESP‑11.7 | Liga do técnico | `tecnico.ts:140,360–425` | Parcial | Rivais anônimos `N(0,3.2)`, não os clubes da divisão; grande na elite = força 1 (≈8º esperado) | Mesmo problema de 11.1a | `ligas` | Médio | Usar a mesma `forcaNaLiga` e os nomes de `clubesNaDivisao` | Grande na elite com técnico neutro: média ≤ 5º |

---

## 2. Respostas às perguntas

### ESP‑11.1 — Como sai o resultado da temporada
- Nota: `6 + (técnica − barra)/4 + (forma−70)/22 + estatura − idade + treino + N(0,0,6)` (`esporte.ts:562–567`); barras `BARRA_FUTEBOL=[0,73,77,82,89]` (`esporte.ts:525`).
- Jogos/minutos: `jogosDaTemporada × (12−mesesFora)/12 × (0,92 titular | 0,45 reserva)` (`esporte.ts:570–572,598`).
- Gols/assistências/defesa: taxas por posição × "jogos equivalentes" × nota/6,5 (`esporte.ts:573–577`). **Não dependem do time.**
- Colocação: `11 − (forçaPorte − nível)·3 − (nota−6)·(1,6|0,6) + N(0,4)` (`esporte.ts:579–584`) — força do clube entra só como porte inteiro; o elenco e os adversários reais não entram.
- A tabela do país (`ligas.ts:173–227`) recebe essa colocação como fixa e sorteia os outros com `forcaNaLiga` — dois modelos diferentes para o mesmo clube.
- Lesão: só reduz jogos (e −0,9 na nota se joga no sacrifício); posição só via auge/risco.
- Copas: inexistentes para o jogador.

### ESP‑11.2 — Atributos
Um único `habilidade(v, modalidade)` (frentes). Futebol: `posicao` muda taxas GOL/ASSIST/DEFESA (`esporte.ts:540–542`), auge (`:191`), risco (`:192`) e o critério de prêmio (`palmares.ts:69–78`). Basquete: função (armador/ala/pivô) e estatura (`modalidades.ts:81–100`; nota `esporte.ts:561`; estatísticas `:587–596`). Vôlei: função (`provas.ts`). Natação/atletismo: prova e marca. Luta: categoria e cartel. Tênis: chaves rodada a rodada (`esporte.ts:646–672`). Treinos: ver matriz 11.2b.

### ESP‑11.3/11.4 — Competições
Jogador: liga (nome real do perfil do país: "Série A", "Primera División", "Serie A", "Premier League"), seleção ("o torneio mundial/continental de seleções"). Técnico: estadual (BR) ou "copa nacional" (fora), liga, seleção. Nenhuma "Libertadores/Champions/Copa do Brasil" (grep vazio). Não há ids estáveis.

### ESP‑11.5 — Transferências (ver 0.3)
Fonte de verdade: `CarreiraEsportiva` + `trabalho.atual`. O clube anterior só existe em `transferencias[].de` e no `emprestimo`. Bugs reproduzidos: liga de temporada antiga no país corrente; luvas convertidas indevidamente; taxa sem moeda; texto "outra moeda" no euro. Taxa nunca creditada ao atleta: confirmado (`esporte.ts:408–410`).

### ESP‑11.6 — Memória
Ver matriz 11.6a–c. O palmarés é a melhor fonte (registros com `ano/competicao/clube/papel`), mas as cenas mexem na temporada depois do registro, e a UI mostra temporada com a liga errada.

### ESP‑11.8 — Copa do técnico
Fase de grupos (12 times da mesma região), semifinal ida e volta, final como cena (`tecnico.ts:337–356`). O adversário da final tem força real (`d.forca`), mas a divisão não pesa. O texto inventa detalhe ("gol de bola parada") e chama tudo de "estadual".

---

## 3. Mudanças propostas (ordem sugerida)

1. **`ligas.ts`**: exportar `forcaNaLiga`; nova `forcaDoClubeNaTemporada(v, clube, pais, contribuicao)`.
2. **`esporte.fecharTemporada`**: (a) `colocacao` via tabela única (`ligas.jogarTemporada` com o clube da vida como participante, não fixo); (b) gols pró/contra do time → clean sheets derivados; (c) `t.pais`, `t.competicaoId`; (d) modalidades fora do catálogo com força neutra.
3. **`esporte.linhaDaTemporada` / `palmares.registrarTemporada:122` / `situacoes.ts:1044` / `tecnico.ts:74`**: sempre com país do clube.
4. **`esporte.transferirPara` + `profissao.aceitarProposta`**: luvas creditadas depois da migração, com `lancar`; `transferencias[]` com `pais`.
5. **`moeda.converterEntrePaises`**: curto‑circuito para a mesma moeda; `profissao.consequenciaDaProposta:651,665`: "a mesma moeda"; `migracao.migrar:235`: remessa 0 na mesma moeda.
6. **`tecnico.jogarTemporada`**: fora do BR, copa nacional com todos os clubes do país, força por divisão; `situacoes.ts:1336–1347`: nome do torneio por `torneioCurto`, textos sem detalhe inventado; `decidirFinal` devolve placar coerente com o texto.
7. **`selecao.disputarTorneio`**: força do país; `sel.jogos` soma torneio.
8. **`situacoes.aplicar:389` e `finalNacional`**: atualizar `totais` e não mudar colocação depois da liga fechada.
9. **Novo `competicoes.ts`** (copa nacional + continental de clubes para o jogador) com `CompeticaoId` estável.

## 4. Testes de aceitação (resumo)
- Sim 3.000 temporadas: grande na elite com técnica = barra → colocação média ≤ 6, Z4 ≤ 3%; clean sheets corr ≤ −0,7 com gols contra.
- Basquete/vôlei nível 4 → rebaixamento ≤ 15%.
- Cadeia BR→ES→IT→BR: cada temporada com a liga do país do clube; conta = esperado ±1; taxa exibida na moeda de origem; ES→IT sem "outra moeda".
- Técnico Série C na Itália: título da copa ≤ 2%; nenhuma string "estadual" fora do BR.
- Invariantes: `Σ temporadas.gols == totais.gols`; `sel.jogos == janelas + Σ torneios.jogos`; todo `titulo` de liga tem `colocacao == 1` registrada em `liga.ultima.campeoes`.
