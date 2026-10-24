# REWORK 11.5 — CARREIRAS, SUBMUNDO E VIDA EM MOVIMENTO

Branch `claude/rework11.5-carreiras-submundo`, criada a partir de `6c4c285` (fim do REWORK 11, igual ao remoto
`claude/fix-pos-rework3-playtest`). Commits locais, **sem push, sem merge, sem deploy**. Save continua **v20** (só campos
opcionais). Notas da versão: **11.5**. APK não regenerado.

## 1. Resumo executivo

- **O ano deixou de ter uma decisão só.** Uma fila do ano (`conteudo/motor.montarFila` / `abrirProximaDaFila`) mostra as
  outras decisões uma depois da outra, cada uma conferida de novo antes de abrir. A frequência vem do que a vida tem.
  - Antes: no máximo 1 decisão por ano (média 0,86).
  - Depois: 0 · 1 · 2 · 3 · 4+ = 13% · 64% · 20% · 3% · 0,4% (média 1,14).
  - A vida "trabalhador" continua mansa: 76% dos anos com uma decisão, 3% com duas.
  - Decisões profissionais do atleta: 0,35 → 0,75 por temporada.
- **O Submundo tem frentes de verdade.** São cinco ramos: furtos e roubos, contrabando, crime organizado, crimes digitais,
  fraudes e corrupção. Cada um tem prática, nome no meio, ações próprias, risco dito antes e cenas próprias. Os
  contatos têm ficha (papel, confiança, promessas). As organizações lembram do que aconteceu. Há ganho, perda,
  apreensão, investigação e saída. O dossiê é a tela própria.
- **As carreiras especiais abrem com o seu lugar:**
  - o campo (ou a quadra) do atleta;
  - a prancheta do técnico, em que a estratégia muda os jogos no motor;
  - o set do ator;
  - o palco do músico;
  - o plenário do político, com alianças e promessas;
  - o dossiê do Submundo.
- **Galeria de conquistas** com a forma de troféu de cada competição.
- **Esportes:**
  - os clubes têm forma;
  - basquete e vôlei têm copas;
  - os rivais do técnico são clubes reais;
  - existe o treinador de goleiros.
- **Artes e política:**
  - o degrau de ator conhecido ficou mais raro;
  - o músico ganha com freelas;
  - alianças e promessas pesam na eleição.
- **Relações:**
  - pedido de casamento em cena, e o convite do casamento;
  - parentalidade reconhecida × biológica;
  - trio;
  - bloquear o ex.

## 2. Branch e commits

| Commit | Fase |
|---|---|
| `d5f3759` | B — a fila do ano |
| `ed8688e` | C — Submundo com especializações |
| `afff67b` | D — forma dos clubes, copas de quadra, rivais do técnico, treinador de goleiros |
| `769f835`, `14eba10` | E/F — alianças e promessas, artes, pedido em cena, parentalidade, trio, ex |
| `3ea1dac` | G/H/I — interfaces especiais, estratégia, galeria, convite, datas, indicador financeiro, toque, notas 11.5 |
| `c4ca7b2`, `9fb58b4` | J — cenários longitudinais, QA visual e correções |

**Fase A (verificação):** o estado foi lido nos relatórios do REWORK 11, sem refazer a auditoria. O que faltava era a §13
daquele relatório. A ordem das fases do pedido foi mantida.

## 3. Funcionalidades implementadas

### 3.1 Motor de acontecimentos (B)

- **Onde:** `conteudo/motor.ts` (`montarFila`, `abrirProximaDaFila`, `prepararCom`, `orcamentoDeDecisoes`, `familiaDe`,
  `TETO_DO_ANO`); `Vida.fila` (opcional); `ano.faseDeConteudo` passo 5; `acoes.executar`; `Momento.tsx`.
- **Urgente passa sempre:** a decisão garantida, ou a de prioridade ≥ 4 (o luto, o processo, a gravidez).
- **As outras disputam o orçamento do ano:** de 1 a 3, conforme a vida tem carreira especial, parceria, filhos, crime,
  atividades, estudo ou mandato.
- **O que não cabe espera o ano seguinte:** uma vez só, e é conferido de novo.
- **Uma decisão por família por ano:** a proposta e a renovação do mesmo contrato não se empilham.
- **Teto:** quatro decisões no ano.
- **Conferida de novo antes de abrir:** com as mesmas pessoas. A premissa desfeita não abre (a pessoa que morreu, a
  relação que acabou).
- **Encadeamento:** a decisão que segue outra do mesmo assunto recebe o elo `segue`.
- **Sorteios derivados:** a sequência principal do ano não muda.
- **Tela:** "Este ano ainda tem outro assunto esperando por você, depois deste."
- **Atleta e técnico:** o ano da renovação já não adia a cena da carreira (antes, uma ou outra).

### 3.2 Submundo (C)

- **Onde:** `sistemas/ramos.ts` (dados e contas puras), `sistemas/submundo.ts`, `conteudo/submundo.ts` (13 decisões),
  `ui/jogo/Submundo.tsx`. Ficam integrados a `ilicito`, `margem`, `justica` e `tribunal`, sem paralelos.
- **Ramos:**
  - a prática vale em parte nos vizinhos (`VIZINHANCA`), nunca equivalente;
  - uma especialização pode ser largada e retomada (a prática fica);
  - até três ao mesmo tempo, com mais exposição e combinados que ficam para trás;
  - a categoria que a Justiça lê acompanha o ramo principal (o crime digital é lido como fraude).
- **Ações por ramo, cada uma com a sua conta:**
  - furtos: serviço pequeno e serviço grande (pede prática e parceiro);
  - contrabando: lote adiantado (que pode ser apreendido), venda, comprador novo (a rival repara);
  - organizado: tarefa do grupo, pedir para subir (posto 1–4), tentar sair (risco conforme o posto e a lealdade);
  - digital: encomenda (a exposição vem de uma vez), aprender com quem entende, sumir;
  - fraudes: acerto de influência (precisa de acesso; o mandato perde apoio se vazar), recusar, denunciar;
  - comuns: cumprir o combinado, acertar a dívida.
- **Contatos com ficha:**
  - papel, confiança, o que esperam, promessas cumpridas e quebradas, organização;
  - afastam-se abaixo de 15 de confiança;
  - a traição pesa por desconfiança e por promessas quebradas, não por sorteio cego;
  - a palavra dada de novo e o prazo pedido vencem em um ano.
- **Organizações:**
  - nomes fictícios do lugar (sobrenome do país);
  - relação: membro, aliada, rival ou neutra;
  - lealdade;
  - memória de promessa, aliança, conflito, traição, saída, favor e reconciliação.
- **Cenas por ramo e encadeadas:** o parceiro pego, o serviço grande, o mercado e a rival, a conta da apreensão, a disputa
  interna, a subida no grupo, a encomenda grande, o apelido exposto, o pedido de cargo, a ameaça de denúncia, a promessa
  cobrada, a reconciliação, a dívida depois de sair.
- **Nada descreve método.**

### 3.3 Esportes (D)

- **Forma dos clubes:** `ligas.atualizarForma`, `LigaDoPais.forma`. Nasce da colocação, vale entre −0,8 e 0,8, cai 35%
  ao ano e recomeça perto de 0 ao mudar de divisão. Nunca vem do nome.
- **Copas de quadra:** `competicoes.copasDeQuadra`.
  - a nacional é dos oito da elite no ano anterior (quartas → final);
  - a continental é dos dois primeiros no basquete e do campeão no vôlei;
  - nomes só onde são inequívocos (Copa Super 8, Copa Brasil de Vôlei);
  - o título entra no palmarés com `competicaoId` e `trofeuId`.
- **Técnico:**
  - os rivais da liga são os clubes do catálogo na divisão, com porte e forma (`TemporadaDeTecnico.rivais`);
  - o campeão vem da mesma tabela do país;
  - a estratégia (4-3-3, 4-4-2, 5-3-2) é a ação `tatica`: muda o `estilo` lido em cada jogo; trocar no meio da temporada
    custa vestiário.
- **Treinador de goleiros:** `sistemas/treinadorDeGoleiros.ts`.
  - a porta abre no fim da carreira de quem foi goleiro;
  - degraus: base → profissional → seleção;
  - o nome vem da tabela;
  - goleiros revelados;
  - o técnico muda, e o novo pode trazer o dele.

### 3.4 Artes e política (E)

- **Ator** (`audiovisual.degrauPorPrestigio`): o degrau "conhecido" pede destaque ≥ 4, prestígio ≥ 0,70 e tem chance
  anual de até 10%. O cachê de estrela começa em notoriedade 48.
- **Músico** (`palco.temporadaDePalco`):
  - os freelas (aulas, gravações, estúdio) contam pela técnica, no custo do lugar, e caem quando a agenda de shows cresce;
  - a cauda do show grande começa em alcance 75.
- **Política** (`sistemas/aliancas.ts`, `conteudo/aliancas.ts`):
  - alianças com uma pessoa de um grupo, confiança e favores;
  - promessas a aliados (prazo de 24 meses) e ao eleitor (cobrada no fim do mandato pelas entregas);
  - romper custa base;
  - o aliado que perde a confiança rompe; o aliado de confiança pede (a decisão `polal_pedido`);
  - a apuração lê os fatores `aliancas`, `promessas` e `rompimento`, com a explicação de sempre;
  - "o aliado" dos mandatos ignora a aliança rompida.

### 3.5 Relações (F)

- **Pedido em cena** (`conteudo/relacoes115.rel115_pedido`):
  - em casa, num jantar ou em público, conforme o jeito de quem recebe;
  - depois o anel (simples, clássico, caro ou nenhum), com preço local;
  - a resposta continua sendo a mesma conta (`interacoes.responderAoPedido`);
  - o noivado guarda o anel e o lugar.
- **Gravidez de um caso** (REL-21):
  - a parceria reconhece a criança sem saber (`Pessoa.reconhecidoPor`);
  - a verdade fica em `genitores`; quem sabe, em `origemSabida`;
  - a dúvida é rara sem causa (2% ao ano) e frequente com o caso descoberto (45%);
  - a decisão `rel115_paternidade` oferece contar, propor exame ou negar.
- **Trio** (`afetosAdultos`, `Vida.trisal`):
  - só com o consentimento dos dois e a afinidade entre eles;
  - harmonia e ciúmes;
  - morar os três, juntar as contas;
  - crise (`rel115_trio_crise`);
  - a terceira pessoa também cria o filho;
  - parte da família não entende.
- **Bloquear o ex:** e desbloquear, na ficha.

### 3.6 Interfaces, troféus e casamento (G, H)

- **Onde:** `ui/jogo/CarreirasEspeciais.tsx`, `Galeria.tsx`, `Submundo.tsx`; o convite em `Casamento.tsx`; estilos em
  `ui/movimento.css`, só com tokens das paletas e sem classe-raiz repetida.
- **Escudos:** genéricos (iniciais, cor tirada do nome).
- **Campo:** os números mudam com a posição (o goleiro conta jogos sem sofrer gol e gols sofridos; o defensor, desarmes;
  o basquete, pontos e rebotes). A tela diz o que se disputa na temporada.
- **Galeria:** 12 formas de troféu. Separa títulos, prêmios individuais, o banco e a arte. Os prêmios de arte vêm só do
  que foi registrado.

### 3.7 Coerência e celular (I)

- **Datas:** a convenção é que tudo da temporada fica datado no fim dela, dentro do ano do rótulo
  (`palmares.tDaTemporada`). Vale para a biografia, o palmarés e as marcas. Os saves antigos não foram reescritos.
- **"No vermelho":** quem tem dinheiro para acertar a pendência e viver três meses vê "no limite", com a frase da
  pendência (`dinheiro.seguranca`).
- **Previdência:** foi verificada. O contador é universal (`trabalho.contribuicao` soma 12 por ano de contrato que
  contribui, em qualquer país). O "0 anos" do QA do REWORK 11 vinha de um save montado à mão. Não era bug.
- **Celular:** até 720 px, abas, chips, links "ir para", o voltar do celular e os dias da agenda têm 44 px de área de toque.

## 4. Pendências do REWORK 11 resolvidas

- Cenas de decisão presas em uma por ano (`faseDeConteudo`).
- Especialização no Submundo.
- Alianças e promessas (POL-05).
- Copas só no futebol.
- Rivais anônimos do técnico.
- Treinador de goleiros.
- D7: o mesmo título com dois anos.
- "No vermelho" com dinheiro na conta.
- Contribuição 0 (verificada; não era bug).
- Trio.
- Gravidez de caso × crença da parceria.
- Bloquear o ex.
- Cena do pedido com anel.
- Músico parado sem renda: de R$ 6,6 mil para ~26 mil por ano.
- Degrau de ator conhecido frequente demais: de 15/20 para 8/20.
- Alvos de toque < 44 px.

## 5. Pendências que continuaram abertas

- **Estrela da atuação:** nenhum ator ativo chegou a R$ 1 mi/ano em 20 vidas (máximo ~372 mil; o REWORK 11 tinha ~640 mil
  em 30). O caminho existe (o cachê de estrela começa em notoriedade 48), mas é raríssimo na estratégia simulada.
- **Músico com R$ 1 mi:** 3 de 20 (15%), contra 2 de 20 antes. Com 20 vidas, isso fica dentro do ruído do alvo de ~10%.
- **Brasil, Série A:** o grande rebaixado caiu de 6,5% para 5,3% das temporadas. Os 15 grandes para 20 vagas continuam
  (diferenciá-los pelo nome seria favorecer clubes).
- **Bloco de trajeto da agenda:** continua < 32 px (pendência 10.6); a área de toque cresce por `::before`.
- **Memória entre vidas na infância (11.5):** não mexida além do REWORK 11.
- **Celular real e APK:** não testados; o APK não foi regenerado.

## 6. Principais módulos

- **Novos:**
  - `sistemas/ramos.ts`, `sistemas/submundo.ts`, `sistemas/aliancas.ts`, `sistemas/treinadorDeGoleiros.ts`;
  - `conteudo/submundo.ts`, `conteudo/aliancas.ts`, `conteudo/relacoes115.ts`;
  - `ui/jogo/CarreirasEspeciais.tsx`, `Galeria.tsx`, `Submundo.tsx`; `ui/movimento.css`.
- **Alterados:** `conteudo/motor.ts`, `ano.ts`, `acoes.ts`, `ilicito.ts`, `margem.ts`, `ligas.ts`, `competicoes.ts`,
  `esporte.ts`, `tecnico.ts`, `palmares.ts`, `marcas.ts`, `politica.ts`, `audiovisual.ts`, `palco.ts`, `familia.ts`,
  `afetosAdultos.ts`, `interacoes.ts`, `dinheiro.ts`, `save.ts`, `tipos.ts`, `vite.config.ts`, `Trabalho.tsx`,
  `Margem.tsx`, `Casamento.tsx`, `Momento.tsx`, `novidades.ts`.

## 7. Testes

- **Suíte final:** **1902 de 1902 em 112 arquivos** (467 s, Linux, `--maxWorkers=3`), com `tsc --noEmit` limpo.
  Antes eram 1858.
- **Novos:**
  - `rework115Eventos` (7);
  - `rework115Submundo` (10);
  - `rework115Esportes` (6);
  - `rework115Vida` (12: política, artes, relações, coerência);
  - `rework115Longitudinal` (3);
  - `ui/rework115Interfaces` (6).
- **Testes antigos ajustados por mudança pedida:**
  - `rework11Eventos`: a renovação agora não adia a cena.
  - `rework10`: o pedido em cena no auxiliar `ate`; o noivado lembra o anel; a ida e volta do save com a normalização
    nova.
  - `correcaoPosFix`: o salário do músico com os freelas.
- **Testes antigos ajustados por semente** (as decisões extras mudam a vida da semente):
  - `fix2`: luto anterior fora da pré-condição;
  - `rework10`: morte por acaso antes dos 22;
  - `rework11Esportes`: a volta ao Cruzeiro pode ser na Série B.
- **Correção no motor:** `microcenas`. O mico não repete o mesmo texto (o teste de cinema pegou o bug).

## 8. Simulações

Os scripts estão em `scripts/sim/`.

**`acontecimentos115`:** 48 vidas, até os 70 anos. Os números estão em §1. Nenhum travamento, e nenhuma família repetida
no ano (teste).

**`crime10`:** 20 vidas por estratégia, dos 18 aos 60 anos.

| Estratégia carreira | Antes | Depois |
|---|---|---|
| Ganhos por fora (mediana) | 133 mil | 178 mil |
| Patrimônio aos 45 (mediana) | 86 mil (honesta: 142 mil) | 118 mil (honesta: 186 mil) |
| Presas | 65% | 60% |

- A carreira no crime segue abaixo da vida honesta.

**`ligas115`:** 8 vidas × 60 temporadas.

| Brasil | Antes | Depois |
|---|---|---|
| Grande rebaixado | 6,5% | 5,3% |
| Campeões distintos por década | 7,6 | 6,8 |
| Fatia máxima de títulos de um clube | 9% | 8% |

- A Espanha ficou mais concentrada nos três grandes (93%).

**`arte115`:** 20 vidas, 20 anos.

| Medida | Antes | Depois |
|---|---|---|
| Ator conhecido | 15/20 | 8/20 |
| Ator com ≥ 500 mil/ano | 5 | 1 |
| Músico parado | 5–7 mil/ano | 21–26 mil/ano |
| Músico ativo com ≥ 1 mi em algum ano | 2/20 | 3/20 |

**`coerencia11`:** 32 vidas, antes × depois.

- Conflitos de agenda, sonho errado, noivado pendurado e travamentos: 0 e 0.
- ms/ano: 51,6 → 53,8, medido com o QA visual rodando junto.

## 9. Saves

- **Versão:** continua v20. Os campos novos são opcionais:
  - `Vida.fila`, `Vida.trisal`;
  - `Envolvimento.especializacoes/fichas/organizacoes/diario/divida/cenas`;
  - `VidaPolitica.aliancas/promessas/pedido`;
  - `LigaDoPais.forma`;
  - `TemporadaDeTecnico.rivais/campeao`;
  - `Caminhos.treinadorDeGoleiros`;
  - `Palco.freelas`;
  - `noivado.anel/lugar`;
  - `Pessoa.reconhecidoPor/origemSabida`;
  - gestação `reconhecidoId`.
- **`normalizarRework115`:** é idempotente e testado.
  - Dá ao envolvimento antigo o ramo da sua categoria, com a prática dos anos que já tinha, e as fichas dos contatos.
  - Tira da fila o que não existe no catálogo.
- **Saves antigos testados:**
  - os 37 fixtures (v5–v16) abrem, jogam três anos com decisões e reabrem iguais;
  - 5 saves do QA do REWORK 11 foram abertos pelo jogo novo e jogados.

## 10. Builds

- **`npm run build`:** sem erro nem aviso de ciclo. Os pacotes estão abaixo do limite de 800 kB:

| Pacote | REWORK 11 | Agora |
|---|---|---|
| motor-textos (o mais justo) | 772,1 kB | 782,8 kB |
| motor | 739,6 kB | 744,5 kB |
| Jogo | 629 kB | 660 kB |

- **`smoke:itch`:** 21/21.
- **PWA offline:** 36/36.

## 11. QA visual e celular

- **Roteiro:** `scripts/playtest/gerarRework115.ts` e `rework115.mjs`, o roteiro do REWORK 11 com cenas novas.
- **Cobertura:** 12 cenas, 4 paletas, 1440 e 390 px, e 360 e 390×560 nas cenas críticas. São 176 rodadas, mais 32 do
  dossiê e 28 de reconferência.
- **Medição:**
  - 0 texto sobreposto;
  - 0 rolagem horizontal;
  - 0 estouro;
  - 0 contraste abaixo de 3:1;
  - 0 erro de página.
- **Alvos de toque < 44 px:** só o bloco curto de trajeto da agenda. No REWORK 11 eram de 2 a 27 por cena.
- **Defeitos achados olho a olho, todos corrigidos e recapturados:**
  - o motivo repetido nos botões da estratégia virou um seletor com uma nota só;
  - "pauta de o movimento" agora sai com a contração certa;
  - a claquete repetia os dados do painel;
  - o palco mostrava "—" sem ano de shows;
  - as frentes do dossiê diziam "nada ainda" mesmo com renda (a renda anual agora é creditada por ramo);
  - as marcas de conquista saíam datadas no ano seguinte.
- **Capturas:** ficaram em `~/vida-trabalho/qa115/{depois,dossie,final}` (fora do repo; sem montagens em `docs/`).

## 12. Riscos remanescentes

- **Decisões extras mudam a semente:** mais decisões por ano mudam a vida que cada semente produz. Testes de proporção com
  amostra pequena podem oscilar.
- **Economia do crime:** subiu (+34% nos ganhos da carreira criminosa), ainda abaixo da vida honesta.
- **Mais modais por ano:** as vidas cheias têm mais decisões por ano. O teto de quatro está testado; falta um playtest
  humano.
- **motor-textos:** está a 17 kB do limite.

## 13. Preparação para o REWORK 12

- A fila do ano aceita conteúdo novo sem regra extra: basta a família de id.
- O Submundo tem dados prontos para mercados por cidade (`organizacoes`).
- A galeria lê `palmares`, o currículo e as obras.
- O conteúdo novo grande deve ir para módulos fora de motor-textos.

## 14. Agentes

Nenhum subagente, equipe de agentes, Task ou worktree de execução paralela foi usado. Todo o trabalho foi sequencial, numa
branch. O único worktree criado (`~/vida-trabalho/base115`, em `6c4c285`) serviu só para rodar as simulações "antes".

## 15. Merge e deploy

Não houve merge na `main`, push nem deploy (Cloudflare Pages). A branch está só no repositório local, à espera de
autorização.
