# REWORK 11 — CARREIRAS VIVAS, ESPORTES, RELAÇÕES E COERÊNCIA NARRATIVA

Branch `claude/fix-pos-rework3-playtest`. Base do pacote: `fb29ce3` (auditoria). Versão das notas de atualização: **11**
("Carreiras vivas"). Save continua **v20** (só campos opcionais). APK **não** regenerado.

Os relatórios de cada fase, com arquivo:função, números e ajustes de teste, estão em `docs/rework11/fases/`; a auditoria
inicial em `docs/rework11/auditoria/A1–A6`; o QA visual em `docs/rework11/qa/`. Este documento resume e traz o que só a
integração mediu.

## 1. Resumo executivo

O problema central era o que o pedido descreveu: sistemas que não conversavam. As causas estruturais encontradas e
tratadas:

- **Não havia uma leitura única do estado profissional.** Cada tela perguntava "tem `trabalho.atual`?", e o atleta sem
  clube virava "Procurando trabalho". Agora `situacaoProfissional(v)` separa carreira, situação, vínculo, onde, contrato,
  paralelas e experiência, e as telas leem dela.
- **A colocação do clube da vida não saía da tabela do campeonato**, e o goleiro tinha "jogos sem sofrer gol" que não
  dependiam dos gols do time. Agora é a mesma régua do mundo mais a contribuição de quem joga. Corrigido também um bug da
  tabela: numa divisão cheia, os dois clubes mais fracos ficavam em 1º e 2º.
- **Ator e músico enriqueciam por contagem dupla ou tripla** (salário de palco + cachê + bilheteria + patrocínio sem
  teto). A mediana do ator ativo no ano 10 caiu de R$ 2,26 mi para R$ 91 mil; o grande sucesso ficou raro, mas possível.
- **Memórias antigas não eram checadas contra o que veio depois** ("o sonho acabou com a dispensa" para o campeão do
  mundo). Agora `premissas.destinoDoSonho` lê a trajetória inteira, e os textos têm variantes.
- **Momentos da carreira não eram registrados**: decisões de contrato e marcos ficavam fora da lista. Uma carreira de
  futebol foi de 3,5 para 13,8 itens visíveis.
- **A agenda transformava `jornada: 'fora'` em segunda a sexta, das 6h às 22h (80 h)** para 18 ocupações, e o cuidado
  com bichos tinha hora fixa. Agora cada ofício tem a sua semana, e os cuidados procuram um horário livre ou são divididos.
- **Relações e redes:** noivado como estado, planejamento de casamento, poliamor e relação aberta consentidos,
  intimidade adulta com proteção, contato com ex, e moderação sempre com motivo.

| Critério de aceitação (seção 17) | Situação |
|---|---|
| 1. Carreira especial não some nem muda de categoria por contrato | atendido (Fase B + C; testes `rework11Carreiras`, `rework11Esportes`) |
| 2. Clube, divisão, país, salário e situação coerentes | atendido; ver o limite do Brasil em §13 |
| 3. Transferências e moedas | atendido (BR→ES→IT→BR; euro→euro exato; luvas depois da conversão) |
| 4. Desempenho individual influencia o resultado | atendido (titular × reserva: 1,85 posição; goleiro corr −0,71) |
| 5. Ligas e copas com campanhas rastreáveis | atendido no futebol; copas só no futebol (§13) |
| 6. Conquistas com nomes e registros adequados | atendido (`competicaoId`, `trofeuId`) |
| 7. Treinador aproveita a base e ganha profundidade | atendido; a liga do técnico ainda usa rivais anônimos (§13) |
| 8. Ações de desenvolvimento apropriadas à carreira | atendido (licenças de treinador, modo artista, mandato) |
| 9. Ator e músico com progressão plausível | atendido, com calibragem pendente (§13) |
| 10. Eventos profissionais com frequência e variedade | **parcial**: os itens visíveis subiram para 1,25/temporada; as cenas de decisão continuam em 0,32 (§13) |
| 11. Acontecimentos antigos não contradizem conquistas | atendido para sonho, ecos, retomar e vínculos (sim: 1 → 0) |
| 12. Agenda sem jornadas absurdas nem conflitos inexplicados | atendido (teste em todas as ocupações; conflitos da casa na sim 113 → 0) |
| 13. Estresse, fadiga, felicidade e realização com causa | atendido (realização e adaptação viraram fatores nomeados) |
| 14. Indicações respeitam contexto e agência | atendido (132 → 21 ao futebolista sem clube; vida comum inalterada) |
| 15. Relacionamentos e casamento com escolhas e consequências | atendido |
| 16. Redes mais ricas sem quebrar a monetização | atendido (assinatura: 9.000/mês antes e depois) |
| 17. Nada depende só de texto decorativo | atendido nos itens implementados; cada mecânica tem teste no estado |
| 18. Testes existentes passam; novos cobrem as mudanças | **1858/1858** na suíte final (§9) |
| 19. Builds funcionam | `npm run build` sem erro nem aviso de ciclo; itch.io 21/21; PWA offline 36/36 (§12) |
| 20. Relatório com entregue e pendente | este documento |

## 2. Estado anterior e problemas reproduzidos

Linha de base `fb29ce3`: 1707 testes; 5 falhavam por **tempo** nesta máquina (tetos fixos de 60–90 s: `motor` "regra de
agência", `profissao`, `caminhos` #8, `politica`, `fechamentoMundo` #4). Os casos do playtest foram reproduzidos nas
sims da auditoria antes de qualquer mudança. Alguns exemplos (detalhe em `docs/rework11/auditoria/`):

- Barcelona na elite: colocação média 10,4º, campeão em 1,3% das temporadas.
- Sassuolo na Serie C ganhava a copa do técnico em 13,1% das temporadas, chamada de "estadual".
- Basquete e vôlei: rebaixamento de 50–67% na elite.
- Ator ativo acima de R$ 1 mi/ano em 30 de 30 vidas.
- 132 indicações de outras áreas ao futebolista sem clube; 47 carreiras de atleta encerradas sem registro.
- 18 ocupações com 80 h na agenda.
- 0,26 momento registrado por temporada de futebol.
- 199 de 200 casais de duas mulheres engravidavam.
- Noivado que sobrevivia ao casamento.

## 3. Matriz de auditoria

A matriz exigida (funcionalidade, onde está, estado, problema, causa, dependências, risco, ação, teste de aceitação)
está, por área, em `docs/rework11/auditoria/`:

- A1 carreiras
- A2 esportes
- A3 arte, política e crime
- A4 eventos
- A5 rotina
- A6 relações e redes

Ela foi commitada antes da implementação (`fb29ce3`).

## 4. Implementações por fase

A ordem do pedido foi mantida, com uma mudança justificada: a **Fase G (rotina)** foi feita primeiro, pelo integrador,
porque a agenda é lida por quase todas as outras (contratações, técnico, artistas). As fases B, C, D/E, F e H/I rodaram
em paralelo, cada uma num worktree que partia de `b885ccc` (G), e foram integradas uma a uma.

| Fase | O que entrou (resumo; detalhe no relatório da fase) |
|---|---|
| **G** Rotina (`b885ccc`, `964d105`) | `agenda.blocosDoTrabalho`: técnico e auxiliar com treino, análise e jogo (~40 h); músico com ensaio e shows à noite e no fim de semana; ator com ensaios e gravações; estrada; `fora` deixou de ser 6h–22h. Cuidados da casa delegáveis a outro adulto, dito no bloco ("nos outros dias, X cobre"). O bicho procura janela livre ou divide com quem mora junto. `estado`: `realizacaoRecente` (títulos, convocação e prêmios dos últimos 24 meses, peso decrescente); "quase nada sobra" só com menos de 25 h livres reais, e "semana cheia, mas do que escolheu" quando o trabalho tem sentido; adaptação ao país como fator nomeado. `migracao.fatorDaMudanca`: mudanças em sequência e transferências pesam menos. Pendências do 10.6 (§11). |
| **B** Estado profissional e indicações | `situacaoProfissional.ts` (leitura pura); telas Caminhos, Trabalho, Alcance e Estudos leem dela; `indicacoes.ts` (vaga pela carreira de quem recebe; natureza: emprego, mudança de carreira, por conta, ocasional); `analisarEntrada` pergunta antes de encerrar uma carreira especial; `contratarComAnalise` nas contratações fora de `propor`; `temChefia`, `temEmpresa` e `temOrgao`. |
| **C** Esportes e treinador | `competicoes.ts` (ids estáveis e nomes por país), `atributosEsportivos.ts` (3–4 por posição e funções do basquete, na nota e na produção), `oficioDoTecnico.ts` (licenças C a Pro, análise, elenco, diretoria), `comissao.ts` (clube concreto); tabela única em `ligas`; goleiro pelos gols do time; copas nacionais e continentais por fases; seleção com a força do país; luvas depois da migração, mesma moeda exata; sem clube explícito; comando por proposta; copa do técnico fora do Brasil com placar real. |
| **D** Atuação e música | Palco sem o ator; curva e teto do cachê por linguagem; turnê dentro das datas do ano; freguesia com teto; direitos recorrentes de obras (`musica.ts`); papel na música (solo, banda, contratado, compositor); crítica × público separados (`audiovisual`, `arte`); aprovação em testes 73% → 52%; portas de "viver disso" pela trilha e pelo degrau; modo artista para bailarina, orquestra e escritor; 7 cenas novas (`situacoesArte.ts`). |
| **E** Política e Submundo | Pedir aumento bloqueado no mandato; `mandato.ts` com ações por cargo (legislativo: projeto, fiscalização, emenda, votação, sabatina; executivo: secretariado, orçamento, veto ou sanção, obra), no máximo duas por ano; eleições altas mais difíceis; porta da corrupção para quem tem mandato. Submundo: anos sem ganho e com perda; contatos dão acesso, proteção e podem trair. |
| **F** Eventos e memória | Ano ocupado adia a cena; decisões de contrato e marcos entram nos momentos (`momentosPorCarreira`, teto por carreira); `situacoesMemoria.ts` (ex-clube, título, atrito, dispensa superada, homenagem, seleção, casa antiga do técnico); `recomecar` registra o que se viu; `vistosDaVida` guarda a infância; 10 cenas novas de infância; `premissas.ts`; ecos checam empregador e curso; `social`: colega de equipe, base, pelada; `citacoes.pessoaCitavel`. |
| **H** Relacionamentos | `fazer_amizade` em qualquer estado civil; busca romântica com parceria só em acordo aberto ou poliamor (senão é dita infidelidade); caso e convite com parceria só com 18+; intimidade com parceria, cônjuge ou caso, consentida e com escolha de preservativo; gravidez só quando biologicamente possível (casais de duas mulheres: 199/200 → 0); `terminar` grava quem terminou e se houve traição; 6 ações com ex (recusa, ignora, bloqueia); vínculo `paralelo` e acordo `poliamor` consentidos por todos; noivado como estado, "preciso pensar", desfazer; planejamento do casamento (`casamento.ts`) com preço local e opinião do parceiro; sem "parcelado" para quem tem dinheiro (parcelado = dívida de 24 meses, igual ao texto); lua de mel pela viagem existente. |
| **I** Redes sociais | Publicar em passos (o quê → como → confirmar); advertência sempre com motivo; 3 advertências suspendem; a terceira suspensão bane (renda 0, recriar só depois de 60 meses); recurso uma vez por punição; post comum nunca é punido; seguidores "hoje", "no fim de cada ano" e "+X desde o fim de AAAA". |
| **J** Integração | 5 merges com conflitos resolvidos juntando os dois lados (detalhe nos commits `e92483d`, `aa0d630`, `366f379`); pacotes sem ciclo (§12); notas da versão 11; amostra do teste de raridade do futebol (§9); sim `coerencia11` (§10); QA visual (§11). |

## 5. Sistemas reutilizados (sem paralelos novos)

- Luvas e taxa de transferência (`esporte.transferirPara`): ganharam ordem (depois da conversão) e moeda; o sistema não
  foi recriado.
- Carreira de técnico (`tecnico.ts`): a progressão jogador → auxiliar → técnico foi mantida, sem reconstruir; ganhou clube
  concreto, proposta e ofício.
- Agenda e compromissos (`analisarEntrada`, `reconciliarObrigacoes`).
- Pedidos da criança (`pedidosDaCrianca`) para a bicicleta.
- Viagens (`EscolherViagem`) para a lua de mel.
- Relação aberta (`acordo`) e o modelo de fertilidade de `familia`.
- Moderação existente das redes (as 3 advertências = suspensão).
- Monetização de assinaturas: intocada.
- `situacoes` (cenas de carreira): as cenas novas são modelos a mais, não um sistema novo.

## 6. Correções de bugs (com causa)

Lista completa nos relatórios das fases. As de maior efeito:

| Bug | Causa | Fase |
|---|---|---|
| Atleta sem clube sumia de Trabalho / "Em andamento" levava a tela vazia | telas liam só `trabalho.atual` | B |
| Placar com o clube antigo como atual e o salário de outro emprego como "do contrato" | não havia "sem clube" explícito | B+C |
| Indicação de manicure ao futebolista consolidado; "Aceitar leva à entrevista" para autônomo | a vaga vinha da trilha de quem indicava; `Alcance` ignorava `porContaPropria` | B |
| Carreira de atleta encerrada em silêncio | `esporte.ts` encerrava na virada do ano, sem registro | B+C |
| Tabela com os mais fracos em 1º e 2º | posicionamento por "vaga mais perto" numa divisão cheia | C |
| Goleiro com muitos jogos sem sofrer gol num time rebaixado | campo derivado da técnica, não dos gols sofridos | C |
| Temporada "Cruzeiro: Primera División" | a temporada não guardava o país | C |
| Euro→euro com perda; luvas ganhando ou perdendo 24–41% | conversão e remessa entre países da mesma moeda; luvas creditadas antes da conversão | C |
| Copa do técnico com zebra frequente e chamada de "estadual" fora do Brasil; texto da final com detalhe inventado | copa sem os clubes do país; `decidirFinal` devolvia booleano | C |
| Ator e músico milionários em todas as vidas | salário de palco + cachê + bilheteria + patrocínio sem teto; cachê exponencial | D |
| "Começaram a pedir"/"virar músico" para quem já é músico | portas olhavam só a técnica | D |
| Pedir aumento no mandato | ação genérica de emprego | E |
| Crime como renda garantida | todo ano ativo rendia 0,6–1,4× | E |
| "O sonho que ficou para trás" para o campeão do mundo | a premissa não lia o depois | F |
| Recomeçar não registrava o que se viu; a infância era cortada primeiro | `vistosDaVida` com `slice(-120)` | F |
| 80 h de trabalho para 18 ocupações; "Cuidar de Sunny" às 21h em cima do show | regra `fora` e bloco de horário fixo | G |
| Estresse de mudanças antigas empilhado; adaptação sem nome; campeão infeliz sem causa | abalo integral a cada mudança; subtração direta; nenhum fator de conquista | G |
| Casais de duas mulheres engravidavam | guarda biológica ausente | H |
| Noivado pendurado depois do casamento; "parcelado" para quem tem € 23 mi | o fato nunca era apagado; opções não olhavam o patrimônio | H |
| Ciclo entre pacotes no build | `situacoesMemoria` lia o técnico de dentro do pacote `motor` | J |

## 7. Mecânicas novas

Todas têm efeito no estado e teste:

- Atributos por posição.
- Copas e competições por fases, com campanha da seleção.
- Licença de treinador.
- Comando por proposta.
- Natureza da oportunidade, com pergunta antes de encerrar uma carreira.
- Direitos de obras.
- Crítica × público.
- Papel na música.
- Ações por cargo no mandato.
- Contatos do Submundo que traem.
- Momentos por carreira e cenas que lembram.
- Premissas narrativas.
- Memória entre vidas ao recomeçar.
- Amizade em qualquer estado civil.
- Intimidade com proteção.
- Contato com ex.
- Poliamor e relação aberta consentidos.
- Noivado e planejamento do casamento.
- Moderação com banimento e recurso.
- Jornada por ofício.
- Janelas de cuidado.
- Fatores nomeados de realização e adaptação.
- Pedido de bicicleta.

## 8. Alterações de save e migrações

O save continua **v20**. Só há campos opcionais, com default seguro (lista completa nos relatórios das fases). Exemplos:

- `Temporada.pais/competicaoId/semSofrerGol/copas/capitao`
- `CarreiraEsportiva.atributos/ultimoClube/capitao`
- `ConquistaEsportiva.trofeuId`
- `Oportunidade.natureza`
- `Romance.paralelo/porque/noivado`, acordo `poliamor`, `PlanoDeCasamento`
- contas de rede: `suspensoes/motivoPunicao/banida/recurso`
- ecos: `empregador/cursoId`
- `Estatisticas.recomecadas`
- `Caminhos.licencaDeTreinador`

Normalizadores chamados em `save.interpretar`, todos idempotentes, com testes de save → reload nas fases:

| Normalizador | O que faz |
|---|---|
| `normalizarRework11Relacoes` | vínculo de fora dentro do acordo vira `paralelo`; noivado pendurado é apagado |
| `normalizarRework11Esportes` | país das temporadas e das taxas; marca de sem clube |
| `normalizarRework11Artes` | salário de palco inflado do ator vira trabalhos miúdos |

## 9. Testes executados e resultados reais

- **Suíte final** na cópia Linux, sobre tudo (inclusive as correções da agenda e do QA): **1858 de 1858 em 106
  arquivos, 6,7 min**, com `tsc --noEmit` limpo.
- **Primeira suíte da integração** (`366f379` + o pacote sem ciclo): **1855 de 1856 em 106 arquivos, 6,8 min**.
  - A falha era `caminhos` "virar profissional é raro". A proporção amadora na amostra de 40 vidas deu 10 para um teto de
    8,5.
  - Medido por fase, nenhuma ultrapassa sozinha (base 6, C 6, B 6, D 6, H/I 6, F 8; F muda as vidas pela infância nova).
  - Em 120 vidas: base 20/111 (18%), integração 25/109 (23%), teto 25%.
  - O teste passou a usar 120 vidas com os **mesmos limites**. Agora passa, em ≈ 50 s.
  - Um deslocamento de +5 pontos para a rota amadora fica registrado.
- **Novos:** 11 arquivos (`rework11{Artes,Carreiras,Esportes,Eventos,Politica,Redes,Relacoes,Rotina}.test.ts` e
  `ui/rework11{Carreiras,Esportes,RelacoesRedes}.test.tsx`). Todos passam na integração.
- **Testes antigos ajustados**, cada um explicado no relatório da fase e comentado no teste:
  - Por mudança de comportamento pedida:
    - `tecnico` e `ui/tecnico`: primeiro comando por proposta; `decidirFinal` com placar.
    - `momentos2`: proposta.
    - `fixPosRework2`: goleiro em `semSofrerGol`.
    - `correcaoPosFix`: cachê de famoso passou de 100 mil para 50 mil.
    - `rework2`: a busca com parceria passou a ser "irregular".
    - `ui/fixPosRework4` e `rework75`: publicar em passos.
  - Por semente, porque a vida da semente mudou com a infância nova ou com as indicações:
    - `rework10` EVT-02 e ECO-03.
    - `motor` família.
    - `rework97` FUT-02.
    - `ui/rework105` SAU-02.
    - `fixPosRework3` autoescola: fixado o acaso da prova, que passava por sorte.
    - `tecnico` `emCrise`.
  - Na integração:
    - `rework11Carreiras`: formato real de `ultimoClube`.
    - `ui/rework11Esportes`: aceita o rótulo unificado "Jogador de futebol sem clube".
    - `caminhos` #9–10: amostra de 120 vidas.
- **Timeouts:** os de teto fixo (60–90 s) que já falhavam na base continuam aparecendo de vez em quando, sob carga.
  Nesta rodada da suíte completa, nenhum estourou.

## 10. Simulações de carreiras longas

Cada fase mediu a sua área, antes (`b885ccc`) e depois; as tabelas completas estão nos relatórios. Destaques:

| Medida | Antes | Depois |
|---|---|---|
| Barcelona na elite: colocação média · campeão · Z4 | 10,4 · 1,3% · 6,9% | 4,0 · 30,2% · 0,9% |
| Cruzeiro, meia 95 titular × reserva | 8,4 × 10,1 | 6,2 × 8,1 |
| corr(jogos sem sofrer gol, colocação) | −0,15 | −0,71 |
| Basquete / vôlei nível 4 na Z4 | 49,6% / 39,3% | 6,2% / 4,0% |
| Técnico Sassuolo (Serie C): título da copa | 13,1% ("estadual") | 0,3% ("Coppa Italia") |
| Ator ativo ano 10 (mediana · p90) | 2,26 mi | 91 mil · 314 mil |
| Ator parado ano 20 (mediana) | 227 mil | 29 mil |
| Músico ativo ano 10 (mediana); vidas ≥ 1 mi no ano 10 | 9,5 mi; 30/30 | 225 mil; 1/30 |
| Eleição para governador e senador (mediana de chance) | — | 39% / 40% |
| Anos de crime ativo sem ganho | 0% | 17% |
| Futebol 22 anos: momentos visíveis na aba / em Caminhos | 3,5 / 1,27 | 13,8 / 7,97 |
| Infância da vida abandonada que reaparece ao recomeçar | 21% | 12% |
| Indicações ao futebolista sem clube / à vida comum | 132 / 132 | 21 / 137 |

A jornada pedida na seção 14 foi coberta em partes, por testes com o estado montado:

- `rework11Eventos`: dispensado aos 14, depois profissional e campeão, recebe a variante certa do sonho; carreira de
  ~20 temporadas com ≥ 15 momentos visíveis; o ex-jogador técnico vê as duas carreiras.
- `rework11Esportes`: cadeia BR→ES→IT→BR com a liga certa por temporada, luvas exatas e taxas com país; sem clube;
  auxiliar com clube concreto; promoção a técnico; comando por proposta; copa e final.
- `rework11Rotina`: agenda do técnico e do músico.

Não há **uma única** simulação que passe pelas 15 etapas na mesma vida (dispensa → Copa do Mundo → técnico); fica como
pendência (§13).

**Sim de coerência da integração** (`scripts/sim/coerencia11.ts`; 64 vidas, 8 perfis, até os 75; antes = `fb29ce3`,
mesmas sementes):

| Medida | Antes | Depois |
|---|---|---|
| Anos com o cuidado do bicho ou dos filhos perdendo para o trabalho | 113 | 18 → **0** (ver abaixo) |
| "O sonho que ficou para trás" para quem jogou como profissional | 1 de 8 | 0 de 8 |
| Anos com o fato de noivado de quem já casou ou terminou | 1000 | 0 |
| Anos com o trabalho acima de 66 h | 0 (maior: 65) | 0 (maior: 65) |
| Travamentos | 0 | 0 |
| ms por ano simulado | 31,0 | 30,3 (31,6 na 2ª rodada, com o QA visual rodando junto) |

- **Jornada:** nenhum perfil caiu nas 18 ocupações de 80 h, então a sim não mostra a correção. Quem mostra é o teste que
  varre todas as ocupações integrais (nenhuma fora de 15–66 h).
- **Conflitos restantes:** a primeira rodada deixou 18 anos-vida de conflito. Inspecionados um a um, eram 3 mães/pais
  sozinhos com filhos pequenos e jornada longa (gerente, 7h–19h), contra os blocos fixos dos filhos às 6h30 e às 18h30:
  meia hora inventada pelo motor. Corrigido em `706bce4`: sem outro adulto em casa, a noite começa quando o trabalho e a
  volta acabam (até 20h30); a manhã acaba quando é hora de sair, dia a dia, e onde não sobra meia hora antes a criança
  vai junto no caminho (dito no bloco). O show que entra pela noite continua sendo choque. Segunda rodada: **0**.
  Testes novos em `rework11Rotina`.
- **Felicidade:** atletas profissionais com título nos últimos 24 meses tiveram 68,9 depois (57,0 antes), mas são 8 e 2
  anos-vida. A amostra é pequena demais para concluir; o efeito está provado no teste de `realizacaoRecente`.

## 11. QA visual e responsivo

Relatório completo, números por cena e o que não deu para cobrir: `docs/rework11/qa/QA-REWORK11.md`. Há 15 montagens
em `docs/rework11/qa/*.jpg`; a `12-defeitos.jpg` reúne a evidência dos defeitos. Os scripts estão em
`scripts/playtest/{gerarRework11.ts,rework11.mjs,montagem11.mjs,elementos11.mjs,recorte11.mjs,sonda11.mjs}`.

- **Cobertura:** 31 cenas com saves montados como nos testes, nas 4 paletas, em 1440 e 390 px. As cenas críticas
  também foram capturadas em 360 e em 390×560. No total, 352 rodadas e 648 capturas, com a medição de geometria e de
  contraste do 10.6.
- **Medição automática:** 0 texto sobreposto, 0 rolagem horizontal, 0 elemento estourando a borda, 0 contraste abaixo
  de 3:1 (medido em 1440 e 390), 0 erro de página.
- **Alvos de toque a 390 px:** de 2 a 27 alvos abaixo de 44 px por cena, quase todos padrões do sistema com 32–40 px
  (abas, chips). O bloco curto da agenda tem 17 px de caixa; a área de toque dele cresce pelo `::before` (pendência 10.6).

A inspeção olho a olho das capturas achou **7 defeitos** que a medição não pega. Seis foram corrigidos nesta entrega:

| # | Defeito | Correção |
|---|---|---|
| D1 | Prefeita em mandato aparecia como "Sem trabalho agora" em Caminhos | `CaminhosDaVida.tsx`: o modo política diz o cargo e "mandato desde" |
| D2 | Conta suspensa: cada opção de Publicar repetia o mesmo motivo longo; "a Instagram" | o motivo comum é dito uma vez (`FluxoPublicar.motivoComum`); plataformas no masculino ("o Instagram") em `redes.ts` e `Redes.tsx`, como no resto do jogo |
| D3 | Agenda: o horário cortado ao meio no bloco de 1 h | `Agenda.tsx`: blocos de até 60 min usam o layout de uma linha |
| D4 | Botões de duas linhas com o texto encostado na borda | `.botao` ganha `padding-block: 4px`; o de uma linha fica na altura mínima, sem mudança |
| D5 | Loja da criança: o "Comprar" apagado com a conta ao lado do pedido, que já diz o preço e o cofrinho; itens se comportando diferente | `Lugares.tsx`: sem alcance, sai só o pedido |
| D6 | "Mudar de trabalho: ver vagas" e "Candidaturas" como ações principais de atriz, jogador, técnico e prefeita | `Trabalho.tsx`: na carreira especial, "Ver outros trabalhos" com a nota de que a carreira continua; candidaturas só se houver alguma |
| D7 | O mesmo título com anos diferentes na Ficha (ano da temporada) e na biografia (mês em que a temporada fechou, no ano seguinte) | **não corrigido**: o comportamento é anterior ao REWORK 11 e o save montado (`t += 12`) amplifica o efeito; confirmar numa vida jogada |

A regressão da loja de instrumentos em tela pequena está **corrigida** (cena `crianca-instrumentos` em 360, 390 e
390×560), e as lojas de bicicletas e de esportes também foram conferidas.

**Observações do QA que não foram investigadas:**
- Faltava uma coluna de liga por temporada na Ficha, que agrupa por clube. Hoje a liga certa aparece no cartão da
  temporada e nos momentos.
- "INPS: 0 anos de contribuição" para quem teve carteira na Juventus.
- Técnico com R$ 250 mil e o painel dizendo "No vermelho".
- Os dois primeiros podem vir dos saves montados à mão.

**Não coberto:**
- Comparação visual antes × depois.
- Contraste em 360 e 390×560.
- Os passos "Casar → lua de mel" e a conta banida.
- Teste em celular real.

Os defeitos D1–D6 foram conferidos só por typecheck e pela suíte; as capturas **não** foram refeitas depois das
correções.

Pendências pequenas do 10.6 absorvidas (seção 11 do pedido):

| Pendência | Situação |
|---|---|
| Contratações que reconciliavam o horário só depois | **corrigida** (`contratarComAnalise`, Fase B) |
| Salário de ator × cachê audiovisual | **corrigida** (Fase D: o ator saiu do salário de palco) |
| NPCs distantes citados depois de mortos | **corrigida** nos registros em curso (contrato e agente: `citacoes`, Fase F); amizades antigas sem história ficam como estão |
| Cancelar plano ou terapia × interromper tratamento | **corrigida**: onde só há seguro, o tratamento para (registrado); onde há rede pública, segue por ela, e isso é dito; largar a terapia sem plano para o tratamento mental |
| Repetição de eventos entre vidas | **parcialmente corrigida** (recomeçar registra; infância 21% → 12%; sobreposição 0,231 → 0,221) |
| Área de toque pequena do trajeto na agenda | **corrigida** (CSS: a área de toque do bloco curto cresce para os lados vazios) |
| Bicicleta da criança pelos responsáveis | **corrigida** (`pedir_veiculo` na loja, a partir dos 8 anos, uma vez por ano) |
| Formatura que registra intenção × matrícula em Estudos | **corrigida** (o texto diz onde matricular; o plano é cobrado como os outros planos) |
| Loja de instrumentos espremida em tela pequena | **corrigida** no CSS (o pedido ocupa a largura do cartão); conferida no QA visual em 360, 390 e 390×560 |

## 12. Performance e tamanho dos bundles

- **Ano simulado:** 31,0 → 30,3 ms (sim de coerência, ~4.000 anos cada); 31,6 ms numa segunda rodada com outra carga na máquina. Sem regressão mensurável.
- **Bundle** (`npm run build`, kB; limite 800, não alterado). Antes = `b885ccc`; depois = a integração com a correção
  de ciclo:

| Pacote | Antes | Depois |
|---|---|---|
| motor-textos | 763,89 | 772,14 |
| motor | 692,01 | 739,62 |
| Jogo | — | 629,14 |
| motor-dados | 506,34 | 519,07 |
| motor-carreira | 341,45 | 383,81 |
| motor-vida | 224,83 | 249,36 |
| motor-conteudo | 143,84 | 147,49 |
| motor-acontecimentos | 97,84 | 107,65 |
| motor-oficio | 84,47 | 88,03 |

- **Ciclos:** a integração trouxe 3 avisos de ciclo ("motor ↔ motor-vida/carreira/oficio"). A causa era
  `situacoesMemoria.ts` (Fase F): ela importa `tecnico` (motor-carreira) e ficava no pacote `motor`. Ela e
  `situacoesArte.ts` só são chamadas por `situacoes`, e agora vão com ela (`vite.config.ts`). Resultado: nenhum aviso
  de ciclo, e o motor caiu de 787,7 para 739,6 kB.
- **motor-textos:** é o pacote mais perto do limite (28 kB de folga). Conteúdo novo grande deve ir para módulos próprios.

### 12.1 Builds suportados

- `npm run build:itch`: o `vida-itch.zip` foi gerado com o `index.html` na raiz.
- `npm run smoke:itch`: **21/21**.
- `scripts/pwa/offline.mjs` (service worker, precache, save no IndexedDB, redes, mundo e tema sem rede, versão nova):
  **36/36**. Na primeira rodada deu 35/36: o roteiro publicava com o botão antigo, de um clique; a publicação em passos
  é da Fase I. O roteiro foi atualizado para tipo → Continuar → Publicar.

## 13. Pendências e limitações

- **Cenas de decisão na carreira.** Continuam em 0,32 por temporada. O teto é uma decisão por ano na vida inteira
  (`faseDeConteudo`). O que subiu foram os registros (contratos e marcos). Subir as cenas exige rever essa regra.
- **Brasil, Série A.** O catálogo tem 15 grandes para 20 vagas. Com a mesma régua, um grande médio fica em ~9º e cai em
  9–10% das temporadas. É coerente com o mundo, mas fica acima do alvo "top-6 / Z4 ≤ 3–5%", que é impossível para os 15
  ao mesmo tempo. Resolver pede diferenciar os grandes do catálogo. Espanha, Itália e Inglaterra atingem o alvo.
- **Esportes:**
  - Copas só no futebol.
  - Liga do técnico com rivais anônimos.
  - Treinador de goleiros (opcional) não feito.
- **Artes:**
  - Nenhum ator ativo chegou a R$ 1 mi/ano na amostra (máximo ~640 mil).
  - O músico parado ganha ~R$ 6 mil/ano (sem piso de aulas ou estúdio).
  - O músico ativo teve algum ano ≥ R$ 1 mi em 5 de 30 vidas (17%; a meta era ~10%).
  - A promoção a "ator conhecido" ainda é frequente (25 de 30 até o ano 20).
- **Política e Submundo:** especialização no Submundo e lista de alianças com cobrança de promessa (POL-05) não feitas.
- **Relações:**
  - Trisal com dois parceiros principais (moradia, dinheiro e filhos) continua fora.
  - A gravidez de um caso abre a descoberta, mas não muda quem a parceria acha que é o outro genitor.
  - Não feitos: atalho de bloquear na ficha do ex, e cena do pedido (anel).
- **Jornada única de carreira longa:** não há uma simulação com as 15 etapas da seção 14 na mesma vida; as etapas estão
  cobertas por testes separados (§10).
- **Interface:** a lista agrupada de "Momentos da carreira" não tem teste de interface próprio (a lógica tem, no motor).
- **Testes com teto fixo:** os de 60–90 s continuam sensíveis a carga (pré-existente).
- **Datas e telas:** o mesmo título aparece com o ano da temporada numa tela e com o ano seguinte na outra (D7, §11).
  Também ficaram sem investigar a "contribuição 0" e o "No vermelho" com dinheiro na conta (§11).
- **Celular real e APK:** não testados em aparelho real. O APK não foi regenerado.

## 14. Preparação para o REWORK 11.5

Dados prontos para as interfaces próprias de cada carreira:

- **Troféus:** `ConquistaEsportiva.trofeuId` e `competicaoId` estáveis, com nome como apresentação
  (`competicoes.nomeDaCompeticao`). É a base da galeria de miniaturas.
- **Temporadas:** guardam país, liga, copas, capitania e jogos sem sofrer gol.
- **Treinador:** `PainelComissao` e o ofício do técnico (licença, vestiário, diretoria) já têm estado próprio.
- **Artistas:** modo próprio, com papel na música e o histórico de crítica × público.
- **Política:** as ações do mandato por cargo.

Nenhuma ação corporativa ficou para trás à espera da interface: atleta, comissão técnica, artista e político já não
recebem "almoçar com a chefia" nem "curso da empresa".

## 15. Riscos remanescentes

- **Calibragem:** muitas curvas mudaram ao mesmo tempo (tabela do mundo, ruído 4 → 3, cachês, eleições, crime, indicações).
  As sims por área estão dentro dos alvos, mas a interação entre elas só foi medida pela suíte e pela `coerencia11`. Um
  playtest humano longo é o próximo passo.
- **Sementes:** a infância nova e as indicações mudam a vida que cada semente produz. Testes de proporção com amostra
  pequena podem oscilar, como o `caminhos` #9–10.
- **motor-textos:** 772 kB, perto do limite.
- **Saves antigos:** os normalizadores são idempotentes e testados, mas saves reais de jogadores não foram usados.

## 16. Arquivos e commits relevantes

- **Commits:** `fb29ce3` (A, auditoria) · `b885ccc`, `964d105` (G) · merges `d2114ea` (B), `cbb7c81` (H/I), `e92483d`
  (C), `aa0d630` (D/E), `366f379` (F) · `7e1f151`, `f6a873a`, `706bce4` e o commit das correções do QA e deste relatório (J). Os commits de cada fase
  estão nos branches `worktree-agent-*` e `rework11-fase-C`/`rework11-fases-HI`, integrados com `--no-ff`.
- **Módulos novos:**
  - `motor/sistemas/`: `situacaoProfissional`, `indicacoes`, `competicoes`, `atributosEsportivos`, `oficioDoTecnico`,
    `comissao`, `mandato`, `musica`, `situacoesArte`, `situacoesMemoria`, `premissas`, `citacoes`, `afetosAdultos`,
    `casamento`.
  - `motor/conteudo/`: `acontecimentosinfancia`.
- **Sims:** `scripts/sim/coerencia11.ts`. As sims de cada fase estão em `~/vida-trabalho/` (fora do repo); os resultados
  estão nos relatórios das fases.
- **Docs:** `docs/rework11/{auditoria,fases,qa}/`, `src/ui/novidades.ts` (versão 11).
