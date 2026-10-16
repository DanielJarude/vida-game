# REWORK 6 — Identidade visual, retratos e experiência de jogo

Base: REWORK 5 (`1fe05e5`). Branch: `claude/fix-pos-rework3-playtest`. Save: **v20 (sem mudança de versão)**.

O pacote é de experiência, não de funcionalidades: nenhuma mecânica nova, nenhum número decorativo, nenhuma regra do
motor alterada para justificar uma aparência. A única mudança no motor é de organização (as faixas das dimensões
pessoais viraram uma tabela só, para a palavra e o medidor saírem da mesma fonte — §7).

Imagens: `docs/rework6/` (JPEG, 2,5 MB). Saves e scripts de captura: `scripts/playtest/gerarRework6.ts`,
`rework6.mjs`, `direcoes.mjs`, `galeriaRetratos.tsx`, `zoomRetratos.tsx`, `fotografarHtml.mjs`.

---

## 1. Diagnóstico visual anterior (auditoria do REWORK 5)

Capturas reais do build de `1fe05e5` (`docs/rework6/antes-depois-*.jpg`, coluna da esquerda), com 10 saves gerados
pelo motor (bebê, criança de 9, jovem de 20, adulta de 38, idosa de 80 anos de biografia, decisão aberta, atleta,
presa, rica com redes, vida encerrada).

| Item auditado | O que havia |
|---|---|
| Tokens de cor | `tokens.css` com ~60 variáveis, mas **cores fixas espalhadas** nas folhas de área (hex e `rgba` em `vida.css`, `vivida.css`, `agir.css`, `material.css`) — duas fontes de verdade na prática. |
| Paleta | Fundo quase preto-marrom, superfícies marrom, âmbar/dourado para ação **e** para destaque **e** para tom de área. Fundo e superfície mal se distinguiam; o âmbar não dizia mais "aja aqui". |
| Tipografia | Newsreader + Inter (boa base), mas títulos, rótulos e corpo muito próximos em peso e tamanho: hierarquia fraca. |
| Botões e controles | Botões, links e filtros com o mesmo peso visual; filtros da Linha da Vida eram links sublinhados. |
| Navegação | Abas no topo (desktop) e barra inferior (celular) corretas; a aba ativa era só um sublinhado fino. |
| "Viver mais um ano" | No **fim da biografia**: com a vida crescendo, o botão saía da tela. **Fora da janela em 19 das 20 cenas** auditadas (relatório `antes/relatorio.json`). Ao avançar, a página voltava ao topo (`scrollTo(0)`), e o jogador relia a biografia para achar o ano novo. |
| Modais | "Carta" escura com borda âmbar; no celular, folha de baixo sem respeitar a área segura no fim. |
| Atributos | Em Você: três blocos longos de texto; as dimensões pessoais (corpo, aprendizado, aparência) com outra gramática. Na Linha da Vida, nenhum sinal do estado. |
| Telas densas | Você (todos os blocos abertos), Trabalho (texto corrido com os dados), Pessoas (lista sem cartões; barra de proximidade solta). |
| Rolagem | Sem janela de anos: 80 anos de biografia renderizados de uma vez. |
| Retratos | Cabelos curtos com **pontas serrilhadas**, topete como um "coque", tranças/locs como **duas tiras rígidas**, franjas recortadas, rabo de cavalo como chifre, a textura herdada ignorada no desenho (o liso e o cacheado do mesmo corte eram iguais), calvície como uma peça pintada por cima. |
| Repetição genérica | Tudo era o mesmo bloco de texto com borda: carreira esportiva, loja e ficha de pessoa pareciam a mesma tela. |
| CSS duplicado | Regras de raiz repetidas entre folhas e sobrescritas em seções "FIX #n" no fim de `vida.css`. |

## 2. As três direções de arte — comparação nas telas reais

As direções diferem só na camada de paleta (`--p-*`); `scripts/playtest/direcoes.mjs` injeta cada uma sobre o build
e fotografa **Linha da Vida, Pessoas e Trabalho (atleta)** em 1440 e 390 px, medindo o contraste de 18 pares.

![Linha da Vida nas três direções](rework6/direcoes-linha-390.jpg)
![Trabalho nas três direções](rework6/direcoes-trabalho-390.jpg)
![Pessoas nas três direções](rework6/direcoes-pessoas-390.jpg)

| | A — Atlas | **B — Memória** | C — Horizonte |
|---|---|---|---|
| Menor contraste de texto (18 pares) | 4,56:1 | **4,79:1** | 6,21:1 |
| Legibilidade da biografia longa | boa (papel claro) | **boa (marfim, tinta grafite)** | cansativa: texto claro sobre petróleo em 80 anos de leitura |
| Ação primária | cobre — **próximo demais do marrom antigo** | **coral envelhecido, inconfundível** | dourado — volta à paleta que o pedido manda abandonar |
| Moldura × página | petróleo × papel (bom) | **grafite × marfim (máximo de separação sem competir com os tons de área)** | tudo escuro: moldura e página se fundem |
| Tons de área | cobre e mostarda brigam com a ação | **nove tons na mesma luminosidade, todos ≥ 4,5:1 como texto** | tons claros sobre escuro, menos distintos entre si |
| Personalidade | "atlas/mapa", um pouco institucional | **caderno de memórias — editorial, combina com a biografia** | elegante, mas noturno |

**Escolha: B — Memória.** Não por ser a preferência inicial, mas porque foi a única das três em que (1) a ação
primária é reconhecível na hora e diferente de todo o resto, (2) a página de leitura (papel) e a moldura de operar o
jogo (grafite) são superfícies claramente diferentes, e (3) a leitura longa continua confortável. Horizonte tem o
maior contraste numérico, mas falha nos critérios de personalidade e de abandonar o dourado; Atlas falha na ação.

## 3. Paleta e tokens — fonte única

`src/ui/tokens.css` agora tem **três camadas**, e só a primeira tem cor escrita à mão:

1. **Paleta** (`--p-*`): papel `#f2eee5`, papel alto `#fbf9f4`, topo `#fffdf9`, tinta grafite `#1d2126` (+ 2 níveis),
   moldura `#22262c`, coral de ação `#bf4f35` (texto `#a8432c`), oliva (bom) `#56662a`, vinho (ruim) `#a12f3c` — mais
   escuro e frio que o coral, para "ruim" nunca parecer "aja" —, ocre (alerta), cinza-azulado (informação) e os nove
   tons de área (Linha coral, Você ameixa, Pessoas rosa antigo, Formação azul de caderno, Trabalho mostarda, Tempo
   verde-mar, Vida oliva, Cidade cinza-azulado, Saúde folha).
2. **Semântica**: fundo, superfície, tinta 1–3, véus e fios (a própria tinta em transparência, via `color-mix`), ação,
   bom/ruim/alerta/info, moldura — tudo derivado da paleta.
3. **Compatibilidade**: os nomes antigos (`--bg-app`, `--text-primary`, `--carta`, `--accent`…) continuam valendo,
   apontando para a semântica. **Não há um segundo sistema**: é o mesmo, com os nomes de antes.

As cores fixas das folhas de área foram trocadas por tokens (teste: "as cores fixas moram na paleta de tokens.css").
Contraste verificado por `scripts/playtest/contraste.mjs` (atualizado para a nova paleta): **todos os pares acima do
mínimo** — texto ≥ 4,5:1, tinta ≥ 7:1 (13,98:1), moldura, branco sobre cada tom de área, clima difícil.

Nada depende só de cor: medidores têm a palavra ao lado; tendências têm seta e texto para leitor de tela; estados
positivos/negativos têm palavra; filtros ativos têm "✓" e `aria-pressed`.

## 4. Componentes modificados

| Componente | Mudança |
|---|---|
| Moldura (`.cabecalho`, `.aba`, `.barra`) | Grafite; a aba ativa é uma **pílula de papel** (a aba "abre" para a página) com o ícone no tom da área; a marca VIDA ganhou o ponto coral. Foco claro sobre a moldura escura. |
| `.avancar` | Ver §5. |
| `Sinais` (novo, `src/ui/jogo/Sinais.tsx`) | Painel compacto: nome, **medidor de 5 marcas**, palavra, seta da tendência. Usado no alto da Linha da Vida e nos cartões de Você. |
| `.chip` | Controles de leitura (Ler do começo / Só o que marcou) viraram chips com estado (`aria-pressed`). |
| `.subnav` | Seções de Vida e abas de Tempo livre: **seletor em pílulas** (a ativa preenchida em tinta), rolagem lateral sem quebrar. |
| `.opcao` (decisões) | Cartão tocável com seta à direita e sombra curta — parece clicável antes do toque. A opção impossível aparece riscada, com o motivo. |
| Carta/modal (`.folha`, `.momento`) | Papel mais alto do jogo com a faixa coral no alto; no celular, folha que sobe de baixo, rola por dentro, respeita a área segura. |
| `.dados` / `.dado` | Fichas pequenas (rótulo em versalete em cima, o valor embaixo) — servem a Trabalho, Prisão, carreiras. |
| `.temporada` | Fechamento de ano de carreira como placar (papel alto, números alinhados). |
| `.cartao-pessoa`, `.atencao` | Pessoas: cartões reais com a barra de proximidade junto do nome; "Pedem atenção" como bloco com o tom de Pessoas. |
| `.lugares` (lojas) | Cartões com ícone e o que se faz lá. |
| `.link`, checkbox | Área de toque de 32 px por dentro do padding (sem mudar a linha); caixa de marcar de 20 px no coral. |

## 5. "Viver mais um ano" — correção estrutural

- O botão continua sendo **o último elemento da página** (nada passa por baixo dele no fim), mas agora é
  **`position: sticky; bottom`**: fica sempre na mesma posição ao rolar, sem ser `fixed` por cima do conteúdo (o
  `fixed` era o que cobria a trilha de Formação no FIX pós-playtest humano).
- **Celular**: fica acima da barra de áreas **e** da área segura (`bottom: calc(var(--barra-altura) +
  env(safe-area-inset-bottom) + …)`); a página reserva a altura da barra. **Desktop**: largura da coluna de leitura,
  sem invadir a lateral.
- A idade vai numa pastilha dentro do botão ("37 → 38"). **Um só botão de avançar** em qualquer tela.
- **Depois de viver o ano**: a tela vai para a Linha da Vida e **rola até o ano que passou** (`#ano-que-passou` — o
  fechamento das carreiras e o "Enquanto isso" — ou o ano novo da biografia, marcado "este ano"). Se o ano já cabe na
  janela com o alto da página, fica no alto. A rolagem **espera a decisão e o resultado fecharem** (havia um bug: com
  o resultado abrindo logo depois da decisão, a rolagem era cancelada e marcada como feita — corrigido para marcar só
  quando a rolagem acontece). Respeita `prefers-reduced-motion`.
- **Biografia longa**: a Linha da Vida abre os **últimos 20 anos** e oferece "Ver anos anteriores (N anos com
  história)" até a biografia inteira — nenhum ano se perde, e o ciclo de avançar não renderiza 80 anos a cada vez.
- Resultado medido (`rework6.mjs`, que testa se o botão está **na janela sem rolar e não coberto** por nada):
  **antes, fora da janela em 19 de 20 cenas; depois, visível e livre em 20 de 20, nas 4 larguras (80 de 80)**.
  Viver um ano + responder as decisões: ~600 ms no build de produção.

## 6. Retratos e cabelos

`src/ui/avatar/cabelos.tsx` foi reescrito em torno de **uma função** (`desenharCabelo`) que devolve o que vai atrás
e o que vai na frente da cabeça **a partir da mesma forma** — não duas peças desenhadas separadamente, que era o que
fazia o cabelo parecer encaixado.

- **Peças compartilhadas**: linha da testa (`testa`), calota, perfil de volume, contorno com textura (`contorno`, que
  ondula/encrespa a borda conforme a textura), mechas laterais, cordões (`Cordao`), cachinhos, fios de brilho.
- **Textura herdada no desenho**: `v.textura` (liso, ondulado, cacheado, crespo) muda a borda do mesmo corte — o rabo
  cacheado não é o rabo liso (teste).
- **Silhuetas**: curtos sem serrilhado; topete como volume para cima e para trás; black redondo com borda crespa
  miúda; cacheado com volume e cachos abertos (não rabiscos); longos como **uma peça** (alto, testa, mechas ao lado do
  rosto caindo na frente dos ombros); chanel, pixie, rabo (agora cai atrás da cabeça, não é um chifre), coque.
- **Tranças e locs**: muitos cordões com caimento natural, comprimentos diferentes, atrás e na frente dos ombros —
  não duas tiras rígidas. Locs grossos com anéis; tranças finas com **gomos trançados que pegam luz** (realce claro
  adicionado nesta sessão, porque no cabelo escuro a trama sumia).
- **Calvície integrada à linha da testa**: entradas e coroa recuam a própria forma do cabelo (estágio da calvície),
  em vez de uma mancha pintada por cima.
- **Envelhecimento**: além do grisalho, a densidade cai e o volume baixa com a idade (`dens`), e o comprimento se
  ajusta (`idoso`). Infância com versões menores do mesmo corte — o bebê, aos 9, aos 30 e aos 75 é a mesma pessoa.
- **Ordem das camadas**: cabelo de trás → corpo → orelhas → rosto → óculos → cabelo da frente → chapéu.
- **Genética preservada**: o retrato lê `visual`; a herança continua lendo `geneticaDe` (tinta, transplante e lifting do
  pai não passam ao filho — teste). Nenhuma característica física decorre de nacionalidade: a galeria sorteia
  ancestralidades pelo próprio motor (`visualDaAncestralidade`). Catálogo de cortes **inalterado** (20): o pedido era
  qualidade, não quantidade.

### Galeria de auditoria

`scripts/playtest/galeriaRetratos.tsx` gera três folhas: **20 cortes × 7 idades × 2 cores** (280 retratos), **132
pessoas sorteadas pelo motor** (idades, rostos, olhos, sobrancelhas, orelhas, pele, calvície, óculos, barba, tinta,
cirurgia) e **casos extremos** (calvície cedo aos 30/45/70, transplante, lifting, orelhas de abano + chapéu, tinta,
black com óculos, sardas, todos os rostos). Inspecionadas visualmente antes e depois; os defeitos encontrados (cachos
como rabiscos, rabo como chifre, cortina rígida de locs, divisões virando franja, trama invisível no cabelo escuro)
foram corrigidos.

![Cortes × idades, antes e depois](rework6/retratos-cortes-1.jpg)
![Longos, tranças e locs, antes e depois](rework6/retratos-cortes-3.jpg)
![Cacheados, chanel, pixie, rabo, coque](rework6/retratos-cortes-4.jpg)
![132 sorteados pelo motor](rework6/retratos-sorteio.jpg)
![Extremos](rework6/retratos-extremos.jpg)

## 7. Atributos

- **Uma fonte** para palavra e nível: `pessoa.ts` agora tem `FAIXAS_PESSOAIS` (limites e palavras de condicionamento,
  aparência e aprendizado); `palavraX` e o novo `nivelPessoal` leem a mesma tabela. **Os limites e as palavras são
  exatamente os de antes** — só deixaram de estar escritos duas vezes. Para bem-estar, cabeça e saúde, `nivel`,
  `palavra` e `tendencia` já existiam em `estadoPessoal`/`estado`.
- `sinaisDaVida(v)` reúne essas leituras (nada recalculado) e respeita as idades em que cada dimensão aparece em Você.
- **Linha da Vida**: os sinais num relance logo abaixo do nome, com "Por quê, e o que fazer →" para Você.
- **Você**: cada dimensão é um cartão que **abre** (`<details>`/`summary`, acessível por teclado): fechado, mostra nome,
  medidor, palavra e tendência; aberto, as causas, o que pesa e o que ajuda (as mesmas listas do REWORK 5). Abrem por
  padrão só os que pedem atenção (nível 1–2, piorando, ou com cuidado sugerido pelo motor).
- Teste: em toda a escala, o medidor e a palavra **nunca discordam** (mesma faixa).

## 8. Melhorias por tela

| Tela | Antes | Depois |
|---|---|---|
| Linha da Vida | biografia inteira, sem estado, avançar perdido no fim | sinais no alto, o ano que passou em destaque, anos com a idade grande na margem, marcos com o tema em versalete, janela de 20 anos, avançar sempre à mão |
| Você | blocos de texto abertos | retrato grande, frase do momento, cartões de dimensão que abrem, medidores |
| Pessoas | lista; barra de proximidade solta | "Pedem atenção" em bloco; "Com você" em cartões com a barra junto do nome |
| Ficha de pessoa | — | sem mudança estrutural (herda tipografia e tokens) |
| Formação | texto corrido | herda as fichas de dados e a hierarquia de títulos; história da formação com anos alinhados |
| Trabalho | parágrafos com os números dentro | "A sua situação agora" em fichas (onde, no bolso, jornada, vínculo); barra de clientela |
| Carreira especial (futebol) | igual a qualquer trabalho | selo de posição (TITULAR), placar da temporada |
| Tempo livre / Redes | abas em linha de texto | seletor em pílulas; estresse com barra e palavra; redes em cartões por plataforma |
| Vida / Compras | lista de lojas em texto | seletor em pílulas; lugares como cartões com ícone |
| Prisão | texto | regime, desde, pena, saída prevista e comportamento em fichas; barra do tempo cumprido |
| Decisão (modal) | carta escura | carta de papel com faixa coral; opções como cartões com seta; a impossível riscada com o motivo |
| Nascimento | — | o retrato aos 0/9/30/75 e "de quem vêm os traços" com o novo desenho |

Antes e depois (390 px):

![Linha da Vida longa](rework6/antes-depois-linha-longa-390.jpg)
![Linha da Vida curta](rework6/antes-depois-linha-curta-390.jpg)
![Você](rework6/antes-depois-voce-390.jpg)
![Pessoas](rework6/antes-depois-pessoas-390.jpg)
![Ficha](rework6/antes-depois-ficha-390.jpg)
![Formação](rework6/antes-depois-formacao-390.jpg)
![Trabalho](rework6/antes-depois-trabalho-390.jpg)
![Carreira especial](rework6/antes-depois-atleta-390.jpg)
![Tempo livre](rework6/antes-depois-tempo-390.jpg)
![Redes sociais](rework6/antes-depois-redes-390.jpg)
![Vida / Compras](rework6/antes-depois-compras-390.jpg)
![Prisão](rework6/antes-depois-prisao-390.jpg)
![Decisão](rework6/antes-depois-modal-390.jpg)
![Nascimento](rework6/antes-depois-nascimento-390.jpg)

Desktop (1440 px): `antes-depois-{linha-longa,voce,pessoas,trabalho}-1440.jpg`. 360 e 820 px: `depois-360-820.jpg`.

## 9. Mobile

`rework6.mjs` percorre **22 cenas × 4 larguras (1440, 820, 390, 360)** e confere rolagem horizontal, elementos
estourando a borda, erros de console, o botão de avançar na janela e não coberto, e alvos de toque < 32 px.

- **Problemas: 0** (sem rolagem horizontal, nada estourando, sem erro de console) em todas as 88 combinações.
- **Avançar**: visível e livre em todas.
- **Alvos pequenos**: os links de texto (`.link`, 20 px) foram ampliados; restam 3 elementos < 32 px, todos
  **dentro de um rótulo maior** que é o alvo real (as caixas de marcar de Redes e do Nascer; o campo de arquivo
  oculto, `sr-only`, de "Carregar vida", cujo rótulo é o botão).
- Modais: folha de baixo, `max-height: 92dvh`, rola por dentro, acima da barra (`z-overlay > z-sticky`), fim na área
  segura. Valores monetários: `Valor` (REWORK 5) abrevia o que não cabe, com o inteiro no toque e no rótulo acessível.

## 10. Testes

- Suíte completa, Node 22: ****1257 testes, 72 arquivos, todos passando** (REWORK 5: 1235; +22 deste pacote), 295 s numa cópia no disco Linux**.
- Novos (`src/ui/__tests__/rework6.test.tsx`, 22 testes), cobrindo os 14 itens obrigatórios:
  1. avançar último na página, `sticky`, não `fixed`; 3. no celular acima da barra e da área segura; um só botão;
  2. rolagem até o ano que passou (e não com a folha aberta); o ano novo marcado "este ano";
  biografia longa em partes sem perder ano;
  4. modal no celular (folha, rolagem, área segura, z-index) e a decisão aberta com todas as escolhas;
  5. dinheiro grande (`dinheiroCurto` ≤ 14 caracteres; `Valor` abrevia e mostra o inteiro no toque; CSS sem quebra);
  6. sinais = funções do motor; medidor e palavra nunca discordam; a Linha da Vida leva a Você;
  7. todo corte × fase × textura × calvície desenha caminho válido (sem NaN); a textura muda o desenho; o mesmo
  personagem atravessa as idades; 8. salvar e carregar não muda o rosto; 9. herança lê a genética (tinta,
  transplante, lifting do pai não passam);
  10. nenhuma área nem seção sumiu (as 7 áreas, as 5 seções de Vida e as 6 abas de Tempo livre abrem);
  11. teclado: `aria-current` nas áreas, detalhes de Você em `summary`; 12. tokens numa fonte só, contraste, foco
  visível também na moldura escura.
  13. offline: `scripts/pwa/offline.mjs` — **31/31**; 14. os testes do REWORK 5 continuam passando sem mudança.
- **Um teste existente mudou** (`fixPosPlaytestHumano.test.tsx`): só o título do `describe` ("nunca por cima" →
  "nunca fixo por cima") e um comentário apontando para `rework6.test.tsx`. As asserções (o botão é o último elemento
  e não é `fixed`) continuam as mesmas — nada afrouxado.
- Typecheck: ok. Build: ok. `build:itch`: ok. `smoke:itch`: **21/21**.

## 11. Desempenho e bundles

Nenhuma dependência nova (sem biblioteca de ícones, animação ou UI). Limite de 800 kB intacto; divisão de bundles
preservada.

| Bundle | Antes | Depois |
|---|---|---|
| `motor` | 730,1 kB | 730,1 kB |
| `motor-textos` | 716,1 kB | 716,1 kB |
| `motor-dados` | 445,8 kB | 445,8 kB |
| `Jogo` | 369,1 kB | 372,0 kB |
| `motor-carreira` | 295,7 kB | 296,0 kB |
| `Retrato` | 86,3 kB | 89,8 kB |
| CSS principal | 126,7 kB | 134,5 kB |

Viver um ano + responder: ~600 ms (build de produção, Chromium, 390 px). A janela de 20 anos evita renderizar a
biografia inteira a cada ano.

## 12. Persistência e sistemas protegidos

- Save **v20**, sem campo novo e sem migração. Nenhum tipo do motor mudou.
- Todos os testes de motor e de UI dos pacotes anteriores (mundo, migração, nacionalidade, genética, sucessão,
  herança, carreiras, economia, relações, prisão, futebol, redes, situações profissionais, tendências) passam sem
  alteração. Teste de save/load do retrato e de herança genética acrescentados.

## 13. APK

Regenerado a partir **do build final deste pacote** (o mesmo `dist/` que passou no smoke e no teste offline), com
`scripts/android/gerar-apk.mjs` (Capacitor 6, `gradlew assembleDebug`), JDK 17.0.20.1 (Temurin) e Android SDK
(platforms;android-34, build-tools;34.0.0) baixados para fora do repositório. Nenhuma infraestrutura Android nova.

- Identificador: **`br.vida.jogo`** (inalterado). Assinatura de depuração (como antes).
- `public/android/vida.apk` — 5,6 MB — SHA-256 **`b26ea1f7a6060d1473c07fdf6828cd2c6f473b03bf4bf47c41f98034da5da9cd`**
  (o anterior, do FIX pós-playtest humano: `6f44318d…75ab94`).
- Conferência: os 38 arquivos de `assets/public` do APK foram comparados byte a byte com o `dist/`: **idênticos**;
  as únicas diferenças são as esperadas (o APK não leva `sw.js`/workbox nem o próprio APK; o Capacitor acrescenta
  `cordova.js` e `cordova_plugins.js`). Referências do build: `index.html` `658526…328425`, `motor-y_M5vQIR.js`
  `7bdbe8…f80afe`.
- **Não foi instalado nem testado em aparelho real.**

## 14. Pendências honestas

- **Ficha de pessoa, Formação e Cidade** receberam a nova linguagem (tokens, tipografia, fichas, pílulas), mas não um
  redesenho próprio; a ficha ainda é uma lista de seções numa folha.
- **Teclado virtual** e safe areas foram verificados por CSS e por captura em Chromium; **não houve teste em aparelho
  real** (nem iOS nem Android).
- Tranças e locs se distinguem bem a partir de ~100 px; nos retratos pequenos (40–56 px das listas) ficam parecidos.
- O catálogo de cortes não cresceu (20); alguns pares (curto/curto_lado em cabelo claro) continuam próximos.
- Não há tema escuro: a direção escolhida é clara; a moldura é escura.
- No desktop, o "Viver mais um ano" flutua sobre a coluna de leitura ao rolar (sticky); não cobre conteúdo no fim,
  mas cobre a linha que está passando por baixo enquanto se rola.

## 15. Capturas

Todas em `docs/rework6/`. Antes = build de `1fe05e5`; depois = build final deste pacote; mesmos saves, mesmas cenas.
