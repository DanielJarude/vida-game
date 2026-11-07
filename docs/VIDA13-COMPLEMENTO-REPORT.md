# VIDA 13 — Complemento: fama, empresas, decisões, aparência, casa e veículos

## A. Identificação e estado
- **Base:** `origin/main` = `2d02659` (12.9.1 publicada em `10668b3`). **Branch:** `claude/vida13-complemento`. Notas do jogo: `13`.
- **NÃO PUBLICADO**, por instrução do usuário ("não publicar este complemento isoladamente"). Nada foi enviado a `main` nem a `claude/fix-pos-rework3-playtest` (produção).
- **"Planejamento principal":** o único prompt principal encontrado é o da 12.9 (atualização unificada), já publicada. Este complemento foi tratado como o escopo da próxima versão, com as exclusões da 12.9 mantidas (Vida Rural/Fazenda, funcionários domésticos, administração/manutenção de imóveis, segurança residencial, certificados artificiais, expansão familiar profunda). Se houver outro plano principal, ele entra nesta branch antes da publicação.
- Pedido do usuário: `docs/vida13/PEDIDO.md`. Relatório detalhado de cada frente (arquivo:função, causa raiz, sims, limitações): `docs/vida13/frentes/*.md`.
- Feito em 7 frentes paralelas (Aparência, Tatuagens, Móveis, Veículos, Empresas, Ações, Fama), integradas e verificadas juntas.

## B. Situação por seção do pedido
| § | Tema | Situação |
|---|---|---|
| 1 | Piercings | **Feito.** Seção em Você → Aparência; zoom por zona; 8 furos e 47 joias novas; vários furos por região |
| 2 | Móveis com volume | **Feito, parcial nos estofados.** Volume em 40 móveis + bloco genérico; camas, sofás, poltronas, banheira seguem desenho único |
| 3 | Veículos | **Feito.** 121 carros por medidas reais (16 carrocerias), 32 motos montadas por peças, garagem com escala e "De perto" |
| 4 | Fama | **Feito.** Parte própria em Você (só para quem tem nome), origens, imagem, ganhos e custos |
| 5 | Interatividade nas empresas | **Feito.** Abas de decisão, estados, motivo do indisponível, registro do que foi decidido |
| 6 | Produtos e linhas | **Feito.** 129 produtos nos 10 ramos grandes + 32 nos pequenos; qualidade/posicionamento/preço só nas grandes |
| 7 | Nomes | **Feito.** Gerador com unicidade por contexto; nomes salvos preservados |
| 8 | Fluxo anual | **Feito.** Uma decisão por vez com resultado imediato; "deixar o resto para depois"; sem execução dupla ao recarregar |
| 9 | Ações em Caminhos | **Feito para as listas de ações** (política, trabalho); Concursos e Plenário só com os estados globais |
| 10 | Tatuagens | **Feito com desvio — decisão do usuário pendente** (ver F) |
| 11 | Mundo reage | **Feito.** Núcleo único de reconhecimento; reações proporcionais |
| 12 | Eventos pelo histórico | **Feito.** 8 lembranças que só existem com registro real |
| 13 | Identidade visual | **Parcial.** Cabelos, barbas, mechas, maquiagem e prévia feitos; sem vista de perfil/¾ (o modelo é 2D de frente); acessórios novos só brincos |

## C. O que foi feito (resumo; detalhes nas frentes)
- **Aparência** (`dados/piercings13`, `dados/aparencia13`, `sistemas/aparencia13`, `ui/jogo/Piercings13`, `ui/avatar/identidade13`): piercings de perto (orelha detalhada própria, porque a do retrato tem 5×8 unidades), experimentar só na prévia, usar/trocar/tirar pelo `usar_item` existente; 11 cortes × 5 texturas, 8 barbas (também nos NPCs, gerador próprio), 5 tintas, mechas, 3 delineados, 8 sombras, 8 batons, 3 blushes; prévia rosto + corpo, antes/depois, frente/costas. Bug: diamante em ouro branco desenhado em ouro amarelo.
- **Tatuagens** (`dados/tatuagens13`, `ui/avatar/tatuagens13*.tsx`): 256 → 430 no catálogo (+174 desenhos), cultura pop 79 → 167 (33 → 71 obras), dois temas novos, busca por várias palavras, filtro de obra por tipo, contagem por região.
- **Móveis** (`ui/ilustracao/volumes13.ts`, `comodos.tsx`, `disposicao.ts`): móveis como blocos em metros projetados na perspectiva do cômodo (faces laterais, tampo, frente no plano real), sem 3D de verdade (decisão: WebGL custaria centenas de kB e mudaria a arte). Bugs: móvel girado espelhado; bancada da cozinha estreita a 0,56 m (micro-ondas flutuando); duas cadeiras na escrivaninha; banheira cobrindo a privada no banheiro de 10 m²; pés desenhados duplicando as pernas de volume.
- **Veículos** (`ui/ilustracao/carros13.ts`, `motos13.ts`, `carros.ts`, `Garagem129.tsx`): desenho paramétrico por ficha técnica; suspensão, preparação, escape, baú/alforjes no desenho; garagem em escala com "De perto" e filtro. Bug: 32 modelos com desenho diferente na loja e na garagem; o presente pedido pela criança chegava sem modelo.
- **Empresas** (`dados/produtos13`, `dados/nomes13`, `sistemas/empresas13`, `empresas129`, `Empresas129.tsx`): "Estratégia de X" (um `<summary>` com cara de título) virou o painel "Decisões de X" com abas; produtos com os 12 atributos pedidos e ações `linha`, `melhorar`, `qualidade`, `reposicionar`, `preco`; registro `decisoes13`. Causa raiz do "Fortaleza Industrial comprou a concorrente Fortaleza Industrial": o concorrente saía da mesma lista de 5 nomes que deu nome à empresa. Eventos econômicos agora nomeiam a concorrente quando ela existe.
- **Ações** (`sistemas/desfecho13`, `sistemas/anotar13`, `ui/gruposDeAcoes13`, `Momento.tsx`, `Jogo.tsx`, `comum.tsx`): causa raiz do §8 — `resolverDecisao` abria a próxima decisão na hora, a tela só mostrava resultado sem decisão aberta e `useVida` substituía o resultado anterior: o jogador decidia às cegas. Agora resultado imediato (conta e dívidas antes/depois, caixa da empresa, o que mudou, o que esperar), próxima só depois, `momentoId` contra toque duplo, `avancarAno` não passa por cima de resultado ou decisão pendente. `BotaoAcao` com foco, pressionado, motivo com cadeado, "✓ Feito". Bug: ações `pres_*` em Trabalho.
- **Fama** (`sistemas/reconhecimento13`, `conteudo/acontecimentos13Fama`, `ui/jogo/Fama13`): um núcleo sobre o que já existia (notoriedade, ficha da fama, visibilidade, redes); origens com o registro que as prova; admiração/rejeição que se apagam; campanhas pagas pelo nome, alcance, imagem e renda do país; empresas grandes passam a dar nome; 13 reações e 8 lembranças, no máximo 1 por ano, sorteio derivado (`rngDe`). O topo de Você e a parte Fama leem a mesma imagem pública.

## D. Reaproveitado (não duplicado)
`usar_item`/instâncias do estilo; `Figura` com `foco` (mesma mecânica do zoom das tatuagens); o modelo de projetos da 12.9 (estendido, não paralelo); `decidirEmpresa129`; a fila de decisões e `abrirProximaDaFila`; `BotaoAcao`; notoriedade/fama/visibilidade/redes; `criarPessoa` para quem quer conhecer o personagem; montador das motos clássicas da 12.9.1; `disposicao.ts` (`Medida.gira`).

## E. Saves
Save continua **v20**. Campos novos, todos opcionais, com normalizador em `save.interpretar`:
`Visual.mechas/mechasEstilo/delineado/sombraOlhos/batom/blush` (`normalizarVida13Aparencia`; fora da herança — `geneticaDe` remove), `ProjetoDaEmpresa.produto/linha`, `CorporacaoDaEmpresa.rivais`, `Empresa.decisoes13` (`normalizarVida13Empresas`, não toca em nenhum nome), `Vida.desfecho13` (`normalizarVida13Acoes`), `Vida.fama13` (`normalizarVida13Fama`; marcos de saves antigos entram com a data original). Nenhuma entidade antiga renomeada; nenhum resultado histórico alterado; o primeiro produto de cada item é neutro (projetos da 12.9 seguem iguais).

## F. Decisão pendente do usuário — tatuagens de cultura pop (§10.2)
O pedido aceita reproduzir obras originais de forma reconhecível. A frente seguiu a linha da 12.9 (que o usuário manteve na 12.9.1): objetos, armas, criaturas, cenários, símbolos redesenhados e palavras curtas que remetem à obra, **sem rostos de personagens, logotipos ou arte oficial**; trocou 4 peças que viravam cópia de design oficial e retirou Hollow Knight (única peça era o rosto do personagem). Se o usuário quiser personagens desenhados (rostos, mascotes), é uma rodada própria — com o risco de direitos autorais de um jogo público na web.

## G. Testes
- **Suíte completa** (2592 testes): 2586 passaram + 1 skipped na rodada final; as 5 falhas: `rework11Esportes · Sassuolo` e `rework122 · negócio por fora` (as mesmas da base 12.9.1), `motor.test · agência` (estouro de 60 s sob carga; sozinho passa), `fix31 · ajuda da família` ×2 (já levavam 19,8 s na base contra limite de 20 s; ganharam `timeout: 60000` com comentário e passam 25/25).
- **Integração:** `trajetorias · serviço público` quebrou porque o teste zera `momento` e deixa a fila — agora o ano não passa por cima de decisão pendente (comportamento pedido no §8); o teste passou a zerar também a fila (comentado).
- **Novos:** vida13Aparencia (11 + 8 UI), vida13Tatuagens (7), vida13Moveis (9+), vida13Veiculos (12), vida13Empresas (17 + 2 UI), vida13Acoes (10 + 6 UI, inclusive recarregar no meio sem executar duas vezes, com o App de verdade), vida13Fama (21).
- **Ajustados (documentados):** vida129Economia (aba antes das alavancas), vida129Veiculos e vida1291Motos (preparação/escape agora aparecem no desenho), vida129Tatuagens (contagens), barbas (timeout do teste cartesiano), pacotePlaytest UI (título "O que fazer com o nome").
- **Typecheck** limpo. **Smoke** 22/22. **PWA offline** 36/36.
- Ruído conhecido: sob carga, `fixPosRework2` registra "Cannot load tatuagens129 after teardown" (import sob demanda terminando depois do teste); sozinho, não ocorre, e não falha teste.

## H. Simulações
- **Ações:** 8 saves × 139 anos, 147 decisões, 24 recargas no meio do ano: biografia e conta idênticas ao fluxo antigo com as mesmas escolhas.
- **Empresas** (10 ramos × 2 sementes × 15 anos, gestão delegada, contra a 12.9.1): faturamento −6,5%, lucro −10%, valor −6% (envelhecimento de produto, mecânica nova), falências iguais. Escolhas diferem de verdade (ex.: montadora sem decisão −1,3/+0,65 bi em 8 anos; + SUV compacto +1,55/+4,1 bi; biscoito −10% no preço dá prejuízo).
- **Fama:** 48 vidas inteiras: 44 anônimas com 0 reações e 0,14 lembrança por vida; muito famosos ~0,35 evento novo por ano, máximo 2 num ano; ~R$ 340 mil por vida em campanhas e convites aceitos. Custo do pass ~1% do ano numa vida famosa. 6 eventos nunca saíram na sim (só cobertos por teste).

## I. Auditoria visual
- `scripts/playtest/vida129.mjs` (agora marca as notas `13` como vistas): 242 capturas, claro/escuro, 1440/390/360/390×560 — **0 problemas**.
- Cada frente capturou e olhou as próprias telas (claro/escuro, 1440/390): sem rolagem horizontal nem erros de página. Penteadeira girada revista pelo integrador após a correção das pernas.

## J. Desempenho e pacotes (KiB, build final)
motor-dados 780,2 (base 779,5) · motor-textos 775,7 (775,6) · motor-carreira 730,2 · motor 724,4 (724,1) · Jogo 614,9 · motor-casa 275,2 (era ~183) · tatuagens 268,1 (era ~158, sob demanda) · Compras 315,0 (sob demanda) · motor-patrimonio 249,2. Pacotes novos: motor-fama, motor-aparencia; Piercings13 sob demanda. Limite de 800 intacto, sem ciclos (smoke). Pintura de cômodo mais cara (galeria de 29 cenas: ~4–6 s → ~7–11 s em máquina compartilhada); pass da fama ~1% do ano.

## K. Limitações
- Sem vista de perfil/¾ do personagem; de costas é silhueta (sem rosto e piercings); chapéu de costas genérico; acessórios novos só brincos; tirar piercing guarda a joia (o furo não fecha).
- Estofados, camas, banheira, mesas de jogo e academia sem volume; laterais em cor lisa; listras finas e serrilhado leve nas frentes giradas em zoom alto.
- Veículos sempre de lado; scooters, bicicletas, barcos e aviões sem mudança; peças feitas não aparecem na cena da casa; Cullinan, Urus e 280 SL aproximados.
- Empresas: qualidade/posicionamento/preço só nas grandes; marca de produto pode soar estranha ("Salgadinho Cacau Real").
- Ações: a decisão já aberta não pode ser pulada; o resultado mostra dinheiro, não humor/reputação; Concursos e Plenário sem agrupamento.
- Fama: fora do mapa de intenções do Menu; sem proposta de compra de participação; arrecadação para causas não persiste como sistema.
- Tatuagens: sem composições novas (manga, costas) com os desenhos da 13; decisão de §10.2 pendente.

## J. Correção final das tatuagens — personagens desenhados (2026-11-07)
- **O que mudou:** 81 tatuagens novas que desenham o **personagem em si** (rosto, corpo, roupa, atributos), não um objeto que lembra a obra. Catálogo 430 → **511**; cultura pop 167 → **248**; obras 71 → **106** (+35). Tipos de obra novos no seletor: **Quadrinhos** e **Mitos, lendas e contos**.
- **Obras (todas em domínio público no Brasil e nos EUA, desenhadas pelo texto e pelas ilustrações originais, nunca pelo visual de adaptações protegidas — Disney, Universal, MGM, TV Globo):**
  - Terror/aventura (lote A, 22): Sherlock Holmes (Holmes de perfil; Holmes e Watson), Drácula (o conde do livro; na muralha), Nosferatu (Orlok; a sombra na escada), Frankenstein (a criatura do livro), Jekyll e Hyde, O Homem Invisível, A Guerra dos Mundos (trípode; marciano), Vinte Mil Léguas (Nemo; Nautilus e a lula), Long John Silver, O Corvo, Cthulhu, O Fantasma da Ópera, Quasímodo, Capitão Ahab, Viagem à Lua (Méliès), Tarzan, Robin Hood.
  - Infantis (lote B, 20): Alice (Alice de Tenniel, Chapeleiro, Coelho, Gato de Cheshire, Rainha de Copas, Lagarta), Oz (Dorothy e Totó com sapatos de prata, Espantalho, Homem de Lata, Leão Covarde), Peter Pan (Peter, Gancho, crocodilo, Sininho), Pinóquio de Mazzanti, Gepeto, O Livro da Selva (Mowgli e Baloo, Bagheera, Kaa, Shere Khan).
  - Brasil (lote C, 20): Sítio do Picapau Amarelo pelos livros (Emília, Visconde, Narizinho, Pedrinho, Rabicó, Quindim, Cuca, Saci), Folclore (Curupira, Iara, Boitatá, Mula sem cabeça, Boto, Lobisomem, Caipora, Mapinguari), Macunaíma, Brás Cubas, Capitu, Iracema.
  - Quadrinhos, mitos e contos (lote D, 19): Little Nemo, Krazy Kat e Ignatz, Popeye de 1929 (sem espinafre), O Menino Amarelo, Gertie, Dom Quixote e Sancho, Gulliver, Ulisses e as sereias, Polifemo, Medusa, Hércules e a Hidra, Hamlet e Yorick, Arthur e a Dama do Lago, Merlin, Dante, Chapeuzinho e o Lobo, Gato de Botas, A Pequena Sereia de Andersen, João e Maria.
- **Limite mantido:** personagens de obras ainda protegidas (Pokémon, Mario, Star Wars, Marvel, anime etc.) continuam como objetos/emblemas redesenhados — o jogo é público na web e reproduzir esses personagens seria cópia de arte protegida.
- **Arquivos:** `motor/dados/tatuagens13c{A,B,C,D}.ts` + `tatuagens13cTipos.ts` (pacote motor-casa, regex no vite.config), `ui/avatar/tatuagens13c{A,B,C,D}.tsx` (despachados por `desenho13`); `MidiaDaObra` + `quadrinhos`, `lendas`; notas '13' atualizadas.
- **Validação direcionada:** tsc limpo; testes de tatuagem (vida13Tatuagens 9/9 com 2 testes novos — catálogo/filtro/busca dos personagens; aplicar, ajustar posição/escala/rotação, cobrir, laser, histórico e reler o save —, vida129/vida126Tatuagens, vida126/127Vida, hotfix1151Vida e as UIs hotfix1151/vida125/vida126) passam; arte distinta em cor e em preto para o catálogo inteiro; build: motor-dados inalterado (798,96 kB), tatuagens 274 → 446 kB; smoke 22/22; PWA offline 36/36. Galerias olhadas em 150/72/44/24 px (`docs/vida13/personagens/lote*.png`) e na pele, de frente, de costas e na lupa (`na-pele.png`).
- **A "sexta falha" da seção G:** não houve sexta falha. 2592 = 2586 aprovados + **5 falhas** + **1 skipped**. O skipped é `scripts/playtest/gerarQA129.test.ts` (`it.skipIf(!QA129)`: o gerador de saves de QA, que só roda com a variável `QA129`). Conferido no log da rodada final (`Tests 5 failed | 2586 passed | 1 skipped (2592)`). Na primeira rodada, a quinta falha era `trajetorias · serviço público`, corrigida na integração.
- **Mais fracos (aceitos):** Gulliver e Caipora em 44 px; texto "tique-taque"/"Ai, que preguiça!" vira textura em miniatura; Boitatá e Capitu com pouco contraste só em preto.
