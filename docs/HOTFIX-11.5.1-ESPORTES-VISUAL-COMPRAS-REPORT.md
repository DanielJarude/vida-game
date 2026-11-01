# VIDA — HOTFIX 11.5.1 · Esportes, personalização visual e Compras

Branch `claude/hotfix11.5.1-esportes-visual-compras` (a partir de `3a26954`, 12.4.1 publicado). No jogo, as notas de atualização usam a versão **12.4.2**: a 12.4.1 já foi publicada, e as notas precisam de uma versão nova. Nada foi enviado ao remoto nem publicado.

## 1. Diagnóstico inicial (auditoria)

| Frente | Implementado e funcionando | Precisava de correção | Parcial | Ausente |
|---|---|---|---|---|
| Ligas e clubes | divisões persistentes, acesso e rebaixamento pelas regras do país, força por porte + forma, colocação na mesma tabela do mundo | — | a temporada guardava só a **ordem** de chegada | tabela com pontos/V/E/D/gols/saldo; critérios de desempate; histórico de campeões |
| Partidas e calendário | liga, copa nacional e continental jogadas fase a fase; vaga continental pela colocação do ano anterior; seleções em anos alternados | — | — | — |
| Continentais | Libertadores e Champions; grupos + mata-mata; classificação | o campeão do ano não ficava registrado quando o clube da vida não ganhava | — | histórico de campeões |
| Troféus | galeria com forma por competição, persistente no save | **títulos pela seleção (Copa do Mundo etc.) não apareciam na galeria** (o filtro ignorava `tipo: 'selecao'`) | — | troféus dos prêmios individuais |
| Prêmios individuais | seleção do campeonato, melhor jogador, artilharia, revelação (por liga) | — | — | Bola de Ouro, The Best, Chuteira de Ouro, Golden Boy |
| Corpo inteiro | proporções, tipo de corpo, peças | pele e membros sem contorno: a pele clara sumia no fundo claro e o braço se fundia ao tronco | — | — |
| Roupas e acessórios | silhueta por forma de peça | os quatro óculos escuros (Juliet, aviador, grife, comum) tinham o mesmo desenho; os chapéus também; a camisa de time era uma camiseta com uma faixa | — | — |
| Tatuagens | — | — | — | não existiam |
| Cômodos | cena com parede, piso, luz e objetos | — | apresentação frontal e chapada | profundidade |
| Compras | 139 produtos, 89 marcas e 38 estabelecimentos, sem loja vazia e sem produto sem loja em 11 países (`scripts/sim/lojas1151.ts`) | duas "Relojoaria" e duas "Joalheria" (do dia a dia e de coleção) | — | busca, filtro por marca e por faixa de preço, ordenação, hierarquia por segmento; cerca de 25 vitrines numa lista só (21 lojas numa capital; a Amazon com 921 ofertas) |

## 2–4. O que mudou

**Futebol**
- `sistemas/tabelaDaLiga.ts` (novo): a tabela de cada divisão é jogada em turno e returno de 20 clubes (380 jogos, gols por Poisson, mando de campo). As linhas são entregues na ordem de chegada que o motor já usava, então acesso, queda e vagas não mudam. Desempate: pontos, vitórias, saldo, gols marcados. A linha do clube da vida respeita os gols do atleta e os sofridos pelo goleiro. As vagas fora do catálogo recebem um nome gerado (marcado com †), que não usa a cidade de um clube real.
- `ligas.ts` guarda as tabelas da última temporada e o histórico de campeões (até 30 temporadas). `competicoes.ts` anota os campeões da copa e da continental: o clube da vida, o adversário da final perdida ou, se o clube caiu antes, um campeão sorteado que nunca é ele. `Temporada.campanha` guarda a linha do clube.
- `sistemas/premiosDoFutebol.ts` (novo): um elenco de 40 estrelas fictícias que envelhecem (pico entre 25 e 30 anos), trocam de clube e se aposentam (substituídas por revelações). Os critérios são públicos (`pontuacao`):
  - Bola de Ouro e The Best: só a primeira divisão; contam nota, produção pela posição, títulos, peso da liga e titularidade, e o The Best pesa mais o individual.
  - Chuteira de Ouro: gols na liga × 2 nas cinco grandes da Europa ou × 1,5 nas outras ligas europeias.
  - Golden Boy (Golden Girl no feminino): até 20 anos, numa primeira divisão europeia.
  - Os títulos vêm do mesmo mundo da vida: a liga da tabela, a final que a vida jogou, a Copa do Mundo da seleção dela.
  - Vitória da vida: conquista no palmarés, troféu próprio na galeria, biografia, reputação. Pódio e top 10 também vão para a biografia.
- Galeria: troféus próprios para a bola dourada, a chuteira, o The Best e o Golden Boy; os títulos pela seleção agora aparecem (correção).
- Interface (`Campeonato.tsx`, carregada sob demanda): na ficha do atleta e na carreira de técnico, a tabela (P, J, V, E, D, GP, GC, SG, zonas de vaga e de queda, legenda dos critérios), os campeões por ano e os prêmios do mundo com a colocação da vida. O painel da temporada mostra a linha do clube.

**Personagem**
- `Figura.tsx`: contorno em cada parte de pele e sombra na axila. O fundo pesa a pele (contraste mínimo de 1,9 com ela), e a figura sem fundo ganha um halo. O teste da galeria pegou um travamento: com `semCima`, a figura tentava desenhar a parte de cima que tinha sido removida; corrigido.
- Óculos por modelo (`Visual.modeloOculos`): Juliet (lente iridescente que abraça o rosto, armação em X), aviador, grife, escuro clássico, grau metal, grau acetato, redondo.
- Chapéus por modelo (`Visual.modeloChapeu`): boné de aba reta, palha, couro de vaqueiro, turbante.
- Camisa de time: gola V com friso, listras verticais ou mangas raglan de contraste, punhos, escudo, patrocínio e marca do fabricante.

**Tatuagens**
- `dados/tatuagens.ts`: 29 desenhos em 8 estilos e 10 partes do corpo, cada parte com uma capacidade. Isso dá várias pequenas no antebraço, uma grande nas costas, e o fechamento ocupa braço e antebraço.
- `sistemas/tatuagens.ts`: ações `tatuar` e `remover_tatuagem`, a partir dos 18 anos, com preço pela cidade. O laser custa 1,6× o preço da tatuagem e a tinta clareia ao longo de 12 meses.
- Na figura, cada desenho é recortado pela própria parte do corpo (nunca flutua), fica sob a roupa e desbota e espalha com os anos.
- Estúdio em Você · Aparência (carregado sob demanda): prévia de frente e de costas, lista das tatuagens e remoção.

**Cômodos**: `comodos.tsx` com perspectiva de um ponto, calculada a partir do ponto de fuga: teto, paredes laterais sombreadas, janela lateral com rastro de luz, piso em trapézio com tábuas e rejuntes convergentes, rodapé, oclusão nos cantos, vinheta, cone da lâmpada e dos pendentes. Os móveis grandes ficam encostados na parede do fundo (escala 0,58) e os outros mais à frente, cada um com sombra de contato.

**Compras**
- Segmentos (Moda e acessórios, Tecnologia, Casa, Cultura/esporte/lazer, Veículos, Luxo e coleção, Onde morar, Serviços e bichos), com uma página inicial de cartões.
- Dentro do segmento, as lojas vêm por tipo (especializadas, grandes lojas, internet). A loja de departamento aparece em cada segmento que atende, e na moda há filtro por categoria.
- Busca por produto, marca ou loja em todas as lojas de uma vez (`lojas.indiceDeCompras` / `buscarNasLojas`), sem distinguir acento: filtros de categoria, marca e faixa de preço; ordem por relevância, menor ou maior preço; comparação das ofertas (loja × marca × preço) e compra direto do resultado.
- Dentro de cada loja: busca, marca, faixa de preço e ordem.
- Segmento, busca, filtros e rolagem ficam numa memória da sessão (`memoriaDeCompras.ts`). Comprar, abrir uma loja ou sair e voltar não perde nada; uma vida nova começa do começo.
- O mapa "Comprar carro" abre em Veículos e "Cirurgia plástica", em Serviços.
- Desambiguação: "Relojoaria de coleção" e "Alta joalheria".
- Nenhuma loja, produto ou marca foi removido.

## 5. Arquivos
Motor: `tabelaDaLiga.ts`, `premiosDoFutebol.ts`, `tatuagens.ts` (novos), `dados/tatuagens.ts` (novo), `ligas.ts`, `competicoes.ts`, `palmares.ts`, `esporte.ts`, `tecnico.ts`, `lojas.ts`, `estilo.ts`, `acoes.ts`, `save.ts`, `tipos.ts`, `dados/colecionaveis.ts`.
Interface: `avatar/Figura.tsx`, `avatar/Retrato.tsx`, `avatar/pecas.ts`, `avatar/tatuagens.tsx` (novo), `ilustracao/comodos.tsx`, `jogo/Compras.tsx`, `jogo/material/{BuscaDeCompras,SegmentosDeCompras}.tsx` (novos), `jogo/material/Lojas.tsx`, `jogo/memoriaDeCompras.ts` (novo), `jogo/{Campeonato,Tatuagens}.tsx` (novos), `jogo/{Galeria,Trabalho,Aparencia}.tsx`, `navegacao.ts`, `telas/Jogo.tsx`, `App.tsx`, `novidades.ts`, CSS.
Ferramentas: `scripts/sim/futebol1151.ts`, `scripts/sim/lojas1151.ts`, `scripts/playtest/{galeria1151.tsx,gerarRework1151.ts,rework1151.mjs}`.

## 6. Testes e resultados
- **Suíte completa** (cópia em disco Linux, `--maxWorkers=3`): 2187 de 2188 passam. A falha foi o timeout de 20 s do `fix31` ("o irmão que ganha um salário mínimo…") sob carga, conhecido neste ambiente. Rodado isolado, passa.
- **Testes novos** (24): `motor/__tests__/hotfix1151Futebol.test.ts` (9), `hotfix1151Vida.test.ts` (7) e `ui/__tests__/hotfix1151.test.tsx` (8). Todos passam.
- **Testes de layout antigos atualizados** (rework7, rework8b, rework122, navegacao): mantêm as mesmas verificações, agora entrando no segmento antes. Nenhuma verificação foi removida.
- **Simulação de futebol** (`futebol1151.ts`):
  - mundo (BR, ES, GB, IT, 6 vidas × 25 temporadas): 0 violações de invariantes; campeão = 1º da tabela em 150/150 temporadas por país; rebaixados nas últimas posições em 100%; ~2,77 gols por jogo; campeão ~88 pts, lanterna ~20; grandes em 3º–8º e tradicionais em 11º–16º em média;
  - carreiras (16 atletas × 18 anos): linha da tabela = colocação em 271/271 temporadas; gols do atleta dentro dos gols do clube em 271/271; campeões de copa coerentes;
  - prêmios: 848 entregues, no máximo 3 Bolas de Ouro seguidas para o mesmo jogador, e a vida só ganha com nota média ~8,9. A primeira calibragem dava 11 Bolas a uma estrela; o pico foi limitado e o declínio, antecipado.
- **Build de produção**: nenhum pacote acima de 800 kB, sem aumentar o limite. O `Jogo` ficou em 650 kB, com Compras separada em pacote próprio e campeonato, busca e segmentos sob demanda. Maiores pacotes: motor-textos 788 kB, motor 774 kB, motor-dados 693 kB.
- **Smoke de produção** (`scripts/itch/smoke.mjs`): 21/21.
- **Auditoria visual no app real** (`rework1151.mjs`; 13 cenas × claro/escuro × 1440/390/360 e 390×560; 154 capturas em `~/vida-trabalho/qa1151/depois`): 0 problemas — sem rolagem horizontal, sem elemento estourando, sem texto sobreposto, sem contraste < 3:1 e sem erro de console. Nota restante: o atalho de loja na busca (`.busca-compras__loja`) tem menos de 32 px de altura.
- **Galeria visual** (`galeria1151.tsx`): seis tons de pele sobre fundo claro, tatuagens de frente e de costas, envelhecidas e no laser, óculos e chapéus por modelo, camisas de time, cômodos.

## 7. Problemas encontrados e resolvidos
- Títulos de seleção fora da galeria.
- Figura com `semCima` travava.
- Domínio excessivo da Bola de Ouro na primeira calibragem.
- Nomes de estrelas repetidos (agora únicos por vida).
- `Jogo` em 801,8 kB (resolvido com carregamento sob demanda).
- Clube gerado com nome parecido com um clube real.
- Exteriores com chão marrom.

## 8. Limitações que permaneceram
- A tabela é gerada depois, a partir da ordem de chegada. Não há lista jogo a jogo da liga para o atleta (o técnico continua com a dele) nem atualização rodada a rodada.
- Clubes fora do catálogo têm nome gerado por temporada (não são entidades persistentes) e vêm marcados com †.
- Os campeões dos anos em que a vida não estava num país são sorteados quando lidos; a lista de clubes continentais depende dos pacotes de região carregados. Nos anos vividos, o campeão fica gravado.
- A Chuteira de Ouro segue a regra real (só ligas europeias): quem joga no Brasil não concorre.
- O técnico não concorre aos prêmios de jogador.
- A vista de costas usa uma cabeça simplificada (nuca e cabelo); o retrato de busto não mostra tatuagens do pescoço.
- As peças de roupa seguem com uma forma por item. Marcas não mudam o desenho, salvo a camisa de time e os óculos e chapéus por modelo.
- A carga de um save antigo relê o visual em uso (`normalizarHotfix1151`). Sem item em uso, nada muda.

## 9. Compatibilidade com saves antigos
- O save continua na versão 20. Todos os campos novos são opcionais: `LigaDoPais.tabelas` e `historico`, `Caminhos.futebolMundo`, `Temporada.campanha`, `copas[].campeao`, `Personagem.tatuagens`, `Visual.modeloOculos` e `modeloChapeu`.
- `normalizarHotfix1151` preenche o modelo de óculos e chapéu de quem já usava a peça.
- Testado: um save sem esses campos carrega; o round-trip do save preserva palmarés, mundo do futebol e tatuagens.

## 10. Situação de cada item
| Item | Situação |
|---|---|
| 2.1 Status de jogadores e clubes | auditado; coerente (simulação); estrelas do mundo com atributos e curva de idade |
| 2.2 Tabelas | implementado e testado |
| 2.3 Partidas e calendário | auditado sem defeitos; integrado à tabela e ao histórico |
| 2.4 Continentais | auditadas; campeões registrados |
| 2.5 Troféus | integração corrigida (seleção) e testada |
| 3 Premiações individuais | implementado, simulado, testado, persistente |
| 4.1 Contraste | corrigido (auditoria de contraste: 0 casos) |
| 4.2 Fidelidade de roupas e acessórios | óculos, chapéus e camisa de time; demais peças sem mudança |
| 5 Tatuagens | implementado (escolha, local, lado, várias, remoção, envelhecimento, save) |
| 6 Cômodos 2.5D | implementado; conferido em capturas |
| 7 Compras | reorganizada, busca e filtros funcionais, catálogo preservado, desktop e celular auditados |
| 8.5 Regressão | 2187/2188; a única falha é o timeout conhecido, que passa isolado |

## 11. Integração e publicação (versão 12.4.2 · 2026-11-01)
- **Integração:** `main` (3a26954) avançada por *fast-forward* até dc94272 — os quatro commits 1f4d8b6, 7f970f9, 09958c8, dc94272 entram intactos, sem merge commit e sem squash. Antes: `origin/main` = base do HOTFIX, sem commits novos; nenhuma alteração local pendente (só `.claude/`, fora do repositório). Diff 3a26954..dc94272: 50 arquivos, +3485/−191.
- **Validação na árvore integrada** (`git archive dc94272`, cópia em disco Linux): `tsc && vite build` ok, maior pacote `motor-textos` 788,5 kB, Jogo 649,8 kB (limite 800 kB); smoke de produção 21/21; suíte 2187/2188 (a única falha é o timeout de 20 s do `fix31` sob carga; isolado 25/25); testes novos 24/24; saves das 12.4 e 11.5.1 interpretados (`normalizarHotfix1151`) e avançados três anos sem erro (7/7).
- **Push:** `claude/hotfix11.5.1-esportes-visual-compras` (nova, preview), `main` 3a26954→dc94272, `claude/fix-pos-rework3-playtest` (branch de produção do Cloudflare Pages) 8eb249d→dc94272. Nada de force-push.
- **Deploy:** check-run Cloudflare Pages de dc94272 `success`. https://vida-game.pages.dev/ serve `index-CjHtbeS4.js`; a raiz, os 37 JS, os CSS, `sw.js` e o manifesto são sha256-idênticos ao build local de dc94272.
- **Verificação em produção** (Playwright, contextos novos e isolados — nenhum save real tocado): notas abrem sozinhas para quem jogava a 12.4.1 e mostram a 12.4.2; fechar grava 12.4.2 como vista; save gerado na 12.4 continua e avança; vida nova nasce e avança 6 anos; 0 erros de página/console. A auditoria `rework1151.mjs` com `URL=` de produção: 13 cenas, claro/escuro, 1440/390/360/390×560, 152 capturas — 0 problemas; a mesma nota já conhecida (`.busca-compras__loja` < 32 px).
