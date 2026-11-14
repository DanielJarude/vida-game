# VIDA 20 — Cômodos, vícios aos 14, automobilismo (kart → F1), clubes à venda, joias de usar e apps sociais

Branch `claude/vida20` (base: `main` em `c630645`, sem commits posteriores à VIDA 19). Um agente só, sem subagentes.
Eras Históricas fora do escopo (nada alterado nelas). Versão registrada como **`20`** (`ui/novidades.ts`), seguindo a
sequência das notas (`'19'` era a última). Matriz de auditoria: `docs/vida20/AUDITORIA.md`. Capturas: `docs/vida20/fotos/`.

## 1. Escopo e interpretação
Prompt principal (§2–§11) + complemento "apps sociais". Interpretação: corrigir defeitos comprovados; reaproveitar os
sistemas existentes (dependências da VIDA 14, liga partida a partida da VIDA 19, itens de estilo/Figura/Retrato,
contas e ações de rede, feed da VIDA Conectada); criar só o que não existia (carreira de automobilismo, propriedade de
clube, catálogo de joias, apps por rede). Nada de sistema paralelo.

## 2–5. Auditoria (resumo — matriz completa em `docs/vida20/AUDITORIA.md`)
- **Preservado** (não reaberto): NPCs autônomos, VIDA Conectada, pendências da VIDA 18, as seis profissões da VIDA 19,
  infraestrutura de redes (contas, alcance, viral, monetização, moderação), sistema de dependências da VIDA 14.
- **Defeitos encontrados**: vaso sanitário com 36 cm de altura; mesas de cabeceira com ~17 cm (cada metade do par
  carregava o desenho inteiro); ~27 objetos desenhados com 41–75% da altura de catálogo; dependências processadas desde
  os 12 anos; **herdeiro (até criança) herdava as dependências e as apostas do falecido**; apps sociais em tela genérica
  com 4 níveis de navegação, publicação em 3 passos e rolagem horizontal dentro do aparelho.
- **Ausentes**: automobilismo; compra de clubes; joias além de ~18 peças (sem ouro branco/rosé, aço, platina, pedras de
  cor, aliança, tornozeleira).

## 6. O que foi feito

### Cômodos e objetos (`ui/ilustracao`)
- `medidas.ALTURA_NO_DESENHO` + `escalaVertical`: os objetos cujo desenho saiu mais largo que a peça real passam a ter a
  altura de catálogo (a largura continua a de catálogo; correção com teto de 0,8×–1,9× para não deformar). Usado pelos
  dois caminhos de desenho (volume 13 e desenho plano). Lista: geladeira, geladeira inox, guarda-roupa, estante de
  escritório, organizadores, fliperama, beliche, box, fogão e pia fixos, ducha, churrasqueira, forno de pizza, cooktop,
  penteadeira, lavadora, espelho de chão, luminária de pé, cavalete, saco de pancada, escultura, vasos grandes, plantas,
  prancha, cadeira ergonômica, vaso sanitário e mesa de cabeceira (pelo tampo).
- Vaso sanitário redesenhado nas medidas reais (caixa acoplada 42 cm, 78 cm do chão ao topo, assento a 42 cm, pé mais
  estreito), com blocos de volume próprios.
- Mesas de cabeceira: cada metade do par leva só as peças dela (e a medida passou a 52 × 42 × 60 cm, da altura do colchão).
- Galeria de auditoria de 48 cenas (todos os tipos de cômodo, pequenos e grandes): `scripts/playtest/galeria20Comodos.tsx`
  + `fotoCenas20.mjs`. Antes/depois em `docs/vida20/fotos/{banheiro,quarto,jogos}-{antes,depois}.png`.

### Vícios (`v14/crencas/dependencias14`, `sistemas/sucessao`, `save`)
- `IDADE_MINIMA_VICIO = 14`; abaixo disso o ano não processa e `semVicioNaInfancia` desfaz qualquer estado (save antigo,
  herança) — hábitos de cigarro/bebida, dependências, anos pesados de aposta. Também na carga do save.
- Sucessão: quem continua não herda `dependencias14` nem `apostas` de quem morreu.
- A partir dos 14: os gatilhos de sempre (contexto, estresse, luto, personalidade, convivência) — nada automático.
- Efeitos novos na dependência/grave: estudos (escola ou faculdade) e amizades (um amigo se afasta).
- NPCs: o cigarro do mundo continua só a partir dos 16 (verificado em teste).

### Automobilismo (`motor/v20/automobilismo`, `ui/v20/automobilismo`)
- Caminho: kart (7+) → monopostos de entrada (opcional) → F4 (15+) → Fórmula Regional (opcional) → F3 → F2 → F1 (18+).
- **Fatos (FIA)**: 18 anos para a F1; 40 pontos de Superlicença em três anos; tabelas F2 40-40-40-30-20-10-8-6-4-3,
  F3 30-25-20-15-12-9-7-5-3-2, Regional 25-20-…-1, F4 12-10-7-5-3-2-1; F4 só pontua com 15 anos; 22 carros na F1.
  **Abstrações**: equipes e pilotos adversários fictícios; número de corridas; pontuação 25-18-… em todas; custos de
  temporada (kart estadual ~R$ 45 mil, escolinha R$ 15 mil nos 2 primeiros anos; entrada ~R$ 380 mil; F4 ~R$ 1,6 mi;
  Regional ~R$ 3,2 mi; F3 ~R$ 6 mi; F2 ~R$ 13 mi); salário de F1 (estreante ~R$ 5–7 mi).
- Temporada corrida a corrida contra um grid inteiro: atributos (pilotagem, consistência, adaptação, físico,
  experiência, pressão — com teto no talento), carro (peso por categoria: pouco nas de chassi único, muito na F1),
  abandono, acidente (saúde, lesão, corridas perdidas), companheiro de equipe, rival, campeão.
- Dinheiro: família (pela classe de origem, até os 26), patrocínio (ação, pelos resultados e pelo nome), academia de
  pilotos de equipe de F1 (cobre 85%; entra quem se destaca, sai quem cai), bolso. Sem orçamento: volta a uma
  categoria mais barata; dois anos sem, fim da carreira.
- Propostas por resultado e idade; F1 exige Superlicença e vaga; contrato vira emprego (`piloto_corrida`, salário,
  renovação pelos resultados contra o carro e o companheiro; perde a vaga quem fica para trás).
- Integração: fama (`registrarMotivoDoNome`), dinheiro/extrato, saúde, parceria (temporada longe de casa), escola
  (calendário), estresse/felicidade, biografia, "Em alta" (vitória/título em F2/F1).
- Tela em Caminhos · Outros caminhos (convite do kart e a carreira) e em Trabalho (o piloto de F1).

### Clubes (`motor/v20/clubes`, `ui/v20/clubes`)
- **Todos os clubes em que se joga estão à venda**: 469 clubes de 28 países carregados (teste confere o Brasil 1:1 com o
  catálogo). Preço = valor (receita × 1,6) − dívidas (assumidas), à vista ou financiado (40% de entrada; o resto vira
  empréstimo no motor de dívidas de sempre). Liquidez ≠ patrimônio.
- **Uma simulação só**: o gancho `ligas.FORCA_DO_DONO` faz a força do clube comprado vir do ELENCO (por temporada,
  guardada no começo dela), na mesma liga, tabela, acesso e rebaixamento. Teste: o histórico do clube = a linha dele na
  tabela da liga.
- Elenco nominal (só no clube do jogador: ninguém em dois clubes), mercado do ano (jogadores de outros clubes do país,
  limitados pela divisão e pelo nome do clube), compra, venda, dispensa, renovação, base (juniores, investimento,
  promoção, revelações), estádio/CT/base (obras de 1–2 anos), objetivo da temporada, aporte, dividendos, venda do
  clube, assédio de ligas mais ricas, fair play financeiro (folha ≤ 70% da receita), diretoria que renova o essencial.
- Conflito de interesses: quem joga ou treina outro clube do mesmo país não compra; se acontecer depois, a federação
  exige a venda (só vender fica liberado).
- Integração: patrimônio (`balanco.empresas` inclui o clube), fama (fonte "negócio"), biografia, "Em alta".
- Tela em Vida · Patrimônio · Empresas.

### Joias (`motor/dados20/joias20`, `ui/avatar/joias20`)
- 94 peças = 32 modelos × metal (ouro amarelo, branco e rosé 18 k, prata 925, aço, platina, titânio, folheado) × pedra
  (diamante, rubi, esmeralda, safira, ametista, topázio, zircônia, ônix, pérola). Preços pelo grama do ouro 18 k em 2026
  (~R$ 500–550 spot; a vitrine cobra perto do dobro) + feitio + pedra.
- Lugares novos: **aliança** (anelar esquerdo, junto com um anel) e **tornozelo**; os de sempre: pescoço, orelhas,
  pulseira, anel. Um por lugar, pelo inventário de sempre (`usar_item`).
- Desenho: o colar do modelo comprado no retrato (veneziana, grumet, elos alongados, gargantilha, ponto de luz, medalha,
  coração, inicial, riviera, gota), os brincos por modelo/metal/pedra, e na figura o anel por forma, a aliança, a
  pulseira (elos, rígida, riviera, berloques) e a tornozeleira (só com a perna à mostra; a vitrine veste um short).
- `Visual.modeloJoia` (opcional, fora dos genes).

### Apps sociais (complemento) (`ui/v20/redes`, `v15/celular`, `jogo/Redes`, `v19/conectada/Feed19`)
- O app genérico "Rede" deu lugar a **um app por rede** na tela inicial do celular (Instagram, TikTok, YouTube, X,
  Facebook; Twitch e OnlyFans para quem tem conta), cada um com a cor, o cabeçalho e a barra de navegação da plataforma
  (Instagram: Início/Criar/Atividade/Perfil; TikTok: Para você/Postar/Caixa/Perfil, fundo escuro; YouTube: Início/
  Enviar/Avisos/Seu canal com o balanço de inscritos; X: Para você/Em alta/Notificações/Perfil; …).
- **Publicar**: abrir o app → "+" (sempre no alto) → tocar no conteúdo = publicado (a ação `rede · publicar` de sempre;
  impulsionar é um interruptor ao lado). Antes: Rede → Minhas contas → plataforma → Publicar → O quê → Como → Publicar.
- O feed de cada app é o da VIDA Conectada filtrado pela rede (`FeedDaPlataforma19`: mesmos cartões, curtir, comentar,
  compartilhar, mensagem, perfil). A gestão da conta (celebridade, provocar, campanha, selo, monetizar, comprar,
  apagar) é o mesmo painel da tela de Redes, extraído para `GestaoDaConta` (usado pelos dois lugares).
- O atalho antigo `appInicial: 'rede'` abre o app da rede em que a pessoa tem conta.

## 7. Integrações
Automobilismo ↔ fama, patrocínio, dinheiro, saúde, parceria, escola, emprego, biografia, Em alta. Clubes ↔ liga
(única), patrimônio, dívidas (financiamento), fama, carreira de atleta/técnico (conflito), Em alta. Vícios ↔ saúde,
trabalho, estudos, amizades, parceria, dinheiro, sucessão. Joias ↔ lojas (categoria "joias" das joalherias de sempre),
inventário, retrato, figura, provador, save. Apps ↔ contas/publicações/seguidores/alcance/viral/renda (motor de redes),
VIDA Conectada, Mensagens.

## 8–9. Testes e comparação com o baseline
- **Baseline** (`c630645`, árvore limpa em `a20/base`): 2788 aprovados, **3 falhas preexistentes** (fechamentoMundo #4,
  profissao "treinar dobrado", motor.test "regra de agência" — sensíveis a tempo/carga).
- **Primeira suíte completa** sobre a VIDA 20: 2813 aprovados, 3 falhas — duas do baseline e **uma nova minha**
  (`trajetorias`: a trilha nova `automobilismo` sem família de carreira) → corrigida (família "esporte").
- **Suíte completa na árvore final** (ver §16): resultado abaixo. Typecheck limpo; build ok; smoke 28/28.
Novos: `src/motor/__tests__/vida20.test.ts` (23) e `src/ui/__tests__/vida20Redes.test.tsx` (2). Ajustado:
`vida15Celular.test.tsx` (a lista de apps: "Rede" → Instagram/TikTok/YouTube/X/Facebook — mudança pedida pelo complemento).

## 10. Saves
Só campos opcionais novos (`Vida.automobilismo20`, `Vida.clube20`, `Visual.modeloJoia`, lugares novos de item);
normalizadores `normalizarVida20Auto`, `normalizarVida20Clube`, `semVicioNaInfancia` (idempotentes). Versão do save
inalterada. `scripts/sim/saves20.ts`: **70 saves antigos** (várias versões) + 6 novos — abrir, reabrir (idempotente),
avançar 3 anos, salvar, reabrir: **0 falhas, nada perdido**.

## 11. Desempenho e tamanho
- Automobilismo (`scripts/sim/automobilismo20.ts`, 120 carreiras): 7–13 ms/ano; de 40 crianças de classe alta, ~1–2
  chegam à F1; de média, nenhuma passou da F4; de trabalhadora, só kart (custos e academias decidem — possível, raro).
  Determinismo: mesma semente → mesmo JSON.
- Clubes (`scripts/sim/clubes20.ts`, 12 donos × 25 anos): pequeno com investimento sobe ao longo de 10–20 anos;
  passivo oscila; grande passivo pode cair; nenhum jogador duplicado; histórico = tabela; ~12 ms/ano; clube no save
  ~8–11 kB. Determinismo OK.
- Pacotes (limite 800 kB, não alterado): `motor-textos` 797,25 (igual), `motor-dados` 791,3 (+0,8), novos
  `motor20-automobilismo` 20,3, `motor20-clubes` 18,3, `dados20` 10,2, `AppSocial20` 20,1, `Celular` 53,5 (era 61,6).

## 12. Inspeção visual
Apps sociais: Instagram, TikTok, YouTube, X e Facebook × 1440/390/360 × claro/escuro (início, perfil, criar): sem erro de
console, sem rolagem lateral, nada vazando do aparelho (`a20/qa-apps.sh`).

Build de produção + Playwright (`scripts/playtest/qa20.mjs`, `celular19.mjs`): cômodos (48 cenas), kart (1440 claro),
F1 (390 escuro), clubes à venda (1440 claro), clube (1440 escuro, 390 claro: elenco, mercado, finanças), joias (360
escuro, galeria de 94 peças), apps (Instagram 390, criar 390, TikTok 360 e perfil, YouTube canal 390 escuro, X publicar
1440 escuro). Sem erro de console, sem rolagem lateral. Corrigido na inspeção: "na Kart" (concordância das categorias),
plurais, "força 75 (até 74)", contraste da grade do TikTok, ícones de X/Facebook diferentes dentro e fora do app,
botão de conteúdo arriscado com estilo de link.

## 13. Pendências e limitações reais
- Equipes e pilotos de automobilismo são fictícios; o calendário não marca cada GP na agenda semanal (o custo de tempo
  entra como estresse, escola e parceria).
- Os outros clubes da liga não têm elenco nominal (só força pelo porte, como antes); o mercado é gerado por ano.
- Um grande clube bem administrado acumula caixa (o dono decide distribuir dividendos ou reinvestir).
- A imagem anexada ao complemento não chegou à sessão; os problemas foram reproduzidos pelas capturas.
