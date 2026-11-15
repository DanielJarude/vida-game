# VIDA 23 — Sistema corporal, diversidade física, marcas naturais, joias e piercings

Data: 15/11/2026 · Branch `claude/vida23-corpo-diversidade-joias` (de `e815edb` = ERAS v2 + docs, em produção como `c336cd0`).
Notas da versão: `'23'`. Save continua v20 (só campos opcionais).

O "Manual Mestre de Diretrizes" não está no repositório nem foi anexado a esta conversa (como nas VIDA 21, 22 e ERAS v2):
seguidas as diretrizes do próprio pedido e as regras do projeto (`REGRAS-COMUNS`, limite de 800 kB por pacote, nada
de RNG principal novo, saves antigos intactos, conteúdo só do que o motor faz). As capturas de tela anexadas ao pedido
também não chegaram; o defeito foi reproduzido em produção (seção 1).

Legenda: **[OK]** implementado e validado · **[NV]** implementado, não validado · **[PARCIAL]** · **[PENDENTE]** · **[BLOQUEADO]**

## 1. Diagnóstico dos problemas originais

Reproduzido em https://vida-game.pages.dev/ (`index-Db5YcOjK.js`) com um save adulto, a 1440 px (`docs/vida23/01-antes-provador-roupa.png`, `03-antes-provador-joia.png`):

| Tela | Largura da figura (medida no DOM) |
|---|---|
| Provador · "Com a peça" | 150 px |
| Provador · "Como você está" | **96 px** (e com opacidade 0,85) |
| Provador · alternativas | 130 px |
| Aparência · corpo inteiro | 112 px |

- O corpo só variava por 5 condições de vida (`silhueta.tipoDeCorpo`: magro, mediano, atlético, musculoso, acima do peso),
  todas aplicadas sobre o mesmo esqueleto fixo: mesma altura, mesmo comprimento de pernas, mesmas proporções.
  O motor já tinha a altura de verdade do jogador (`modalidades.estaturaAdulta`, usada nos esportes), e a figura a ignorava.
- Marcas da pele: só as sardas herdadas do rosto (`sardas` nao/poucas/muitas, um padrão fixo) e a "pinta" da maquiagem (VIDA 14).
- Brincos: no catálogo de vitrine o brinco aparecia no retrato inteiro a ~84 px — a joia ocupava 1 a 3 px e virava o mesmo ponto
  para todos os modelos. O metal mudava só a cor (aço, titânio, prata e ouro branco quase o mesmo cinza).
- No provador de brinco, a figura inteira trocava o cabelo comprido por curto (artifício da vitrine para mostrar a orelha) —
  a pessoa deixava de parecer ela mesma (achado durante o QA desta entrega).

## 2. Causas identificadas

1. **Escala** (a causa do provador): cada tela escolhia a própria largura em px (`Lojas.Provador`: 150/96/130; `Aparencia`: 112).
   Como a figura tem largura fixa em unidades (120) e altura da idade, larguras diferentes = escalas diferentes; abaixo de 110 px a
   figura ainda troca o nível de detalhe (`detalhe = largura >= 110`), então "como você está" era também desenhada de outro jeito.
   O CSS (`max-width: 160px`, `opacity: .85`) acentuava. Não era a roupa que mudava o corpo: a geometria do corpo não lê as peças.
2. **Pouca diversidade**: a geometria (`Figura.geometria`) tinha um só esqueleto por gênero; a "variedade" eram 5 deltas de largura.
3. **Joias iguais**: desenho do lóbulo pequeno demais no tamanho de uso da vitrine e um único traço de metal (uma cor, um brilho).

## 3. Correções na representação corporal — [OK]

- `ui/avatar/referencia.ts` · `LARGURA_DE_REFERENCIA = 132`: provador (todas as figuras, inclusive alternativas e o "como você
  está"), Aparência e o painel novo usam a mesma largura → mesma escala e mesmo nível de detalhe. CSS do provador: cada figura com
  largura fixa (nenhuma encolhe sozinha), sem a transparência. Medido no app: 132 × 132 px e o mesmo viewBox nas 6 combinações (seção 9).
- O provador de joia do rosto agora mostra **com a peça · como você está · de perto** (a lupa da orelha/nariz/boca), e a figura
  inteira mantém o cabelo da pessoa (só a lupa prende o cabelo atrás da orelha).
- Geometria única para tudo (`Figura.montar`): a figura, as lupas das tatuagens e dos piercings, as miniaturas da vitrine e o provador
  montam o mesmo corpo (condição + constituição + estatura + idade). Os pontos de ancoragem (roupas, joias, tatuagens, marcas) já liam
  a geometria (`g.*`), então acompanham qualquer corpo; os limites finais impedem deformação (cintura ≤ maior de peito/quadril + 9,
  ombros ≥ peito, braço ≤ 38% do ombro, coxa ≤ 78% do quadril, mínimos de largura).
- Estatura: escala do corpo abaixo do pescoço (a cabeça não escala: a pessoa alta tem a cabeça menor para o corpo), ~4,2% por desvio.
  Para o jogador, é a **altura de verdade** do motor (cm → desvios da média do gênero); para quem aparece no mundo, o eixo da constituição.

## 4. Tipos físicos — [OK]

Constituição em **12 eixos** (`motor/v23/corpo/corpo23.ts`, −2 a +2): estatura, estrutura óssea, comprimento das pernas, músculo,
ombros, peito, braços, cintura, barriga, quadril, coxas, panturrilhas. Combina com as 5 condições (que a vida continua mudando).
**13 formas de partida** (base, longilíneo, compacto, ombros largos, ampulheta, quadril largo, reto, arredondado, robusto, esguio,
pernas fortes, tronco longo, definido) — atalhos que mexem em vários eixos, sem ligação com gênero; depois, ajuste eixo a eixo.
Desenho novo: definição muscular (deltoide, bíceps, peitoral e abdômen na pele à mostra) e volume do peito por cima da roupa.
Sorteio (NPCs e nascimentos): 3.000 sorteios → 2.900+ combinações distintas, cada eixo usa as cinco leituras, < 2% na base; filhos
puxam a média dos pais (correlação positiva em todos os eixos, quase nunca cópia). Evidência: `docs/vida23/10`, `11`, `12`, `13b`.

## 5. Características naturais — [OK]

8 tipos (`MARCAS23`): pinta (plana/relevo), pintas espalhadas, sardas, marca de nascença (café com leite, vinho, rosada, azulada),
mancha de pigmento (mais clara/mais escura), cicatriz (reta, curva, de cirurgia com os pontos, de queimadura, de acne), estrias
(claras, rosadas, escuras) e covinhas (bochecha, um lado ou os dois; queixo). Controle: tipo, região (as 30 regiões anatômicas das
tatuagens, de frente e de costas, incluindo o rosto), lado, tamanho, posição (lado a lado e altura), ângulo, intensidade, quantidade
(pintas e sardas) e "outro desenho" (o padrão sai da semente da marca). Até 14 marcas. Idade de aparecimento (`d`): a estria da
adolescência, a cicatriz de um tombo — antes disso não se vê. Pelos do corpo (`pelos23`, 1–3) nos antebraços, pernas e peito à mostra.
Cores calculadas a partir da pele (na pele escura a cicatriz escurece, em vez de clarear) — conferido em p1–p6 (`14`, `15`).
NPCs: ~45% sem marca alguma; tipos e lugares variados; sardas acompanham a pele clara; nada depende de personalidade, renda ou origem.

## 6. Brincos, piercings e joias — [OK]

- **+89 joias** (25 formas novas × metais): 52 brincos (14 formas: argola grande fina, argola grossa, argolinha cravejada, geométrico,
  corrente passante, pendente longo com 3 pedras em escada, candelabro, bolinha de pressão, flor, argola com pérola, par assimétrico,
  barra, meia-lua, ear climber), 17 colares (cubana, pérolas, camadas, longo com barra, cordão de couro), 10 pulseiras (bracelete
  largo, pérolas, corrente dupla) e 10 anéis (bandão, duplo, pérola). Preços pela mesma fórmula do catálogo (grama × metal + feitio
  + pedras): R$ 70 a R$ 29.500. Entram sozinhas nas lojas que vendem joias (nenhum preço antigo mudou).
- **Acabamento por metal** (`ui/avatar/joias23.tsx`): borda, corpo e brilho próprios — ouro polido, folheado acetinado, ouro branco /
  platina / prata espelhados, aço escovado (brilho em risquinhos), titânio fosco, PVD preto acetinado. Aplicado aos brincos novos e
  antigos do catálogo VIDA 20, aos colares e aos piercings (ponto e argola). Teste: a mesma argola em ouro/aço/prata dá polido/escovado/espelhado.
- **Piercings**: +5 peças nas regiões com pouca variedade (sobrancelha: barra de ouro rosé com pedra, argola de titânio azul;
  medusa: espeto de titânio, diamante; lábio: argola cravejada), cada uma no desenho do seu furo (o espeto da medusa é próprio).
- **Catálogo = corpo**: a vitrine mostra brincos e piercings do rosto de perto (`focoDaJoiaNoRosto`), com a mesma geometria do retrato
  que desenha a peça usada. Combinação de vários furos (lóbulo, 2º furo, helix, tragus...) já existia e continua (galeria `19`).

## 7. Interface — [OK]

Você · Aparência · **Corpo e pele** (pacote sob demanda `CorpoEPele`): prévia "como está" × "como ficaria" na mesma escala, de frente
ou de costas, com a roupa ou "só a pele" (top e short para quem não é homem), lupa da região da marca escolhida; três partes
(Proporções · Marcas da pele · Pelos); confirmar / deixar como está. A família decide antes dos 13. A altura do jogador aparece em
metros (não se escolhe: é a do motor); quem nunca definiu o corpo vê o aviso de que, ao confirmar, a figura passa a usar essa altura.

## 8. Arquivos e componentes

Motor: `v23/corpo/corpo23.ts` (folha, pacote `motor23-corpo`), `v23/acao/acao23.ts` (ação `corpo23`, pacote `motor23-acao`),
`tipos.ts` (Visual.corpo23/marcas23/pelos23), `sistemas/identidade.ts` (sorteio e herança), `sistemas/silhueta.ts` (`corpoDaFigura`),
`save.ts` (`normalizarVida23`), `acoes.ts`, `dados20/joias20.ts`, `dados/piercings129.ts`, `dados/piercings13.ts`.
Tela: `avatar/Figura.tsx` (geometria, estatura, camadas novas, memo por valor), `avatar/corpo23.tsx`, `avatar/marcas23.tsx`,
`avatar/joias23.tsx`, `avatar/joias20.tsx`, `avatar/piercings.tsx`, `avatar/Retrato.tsx` (marcas do rosto; busto com ombros da
constituição), `avatar/referencia.ts`, `avatar/MiniaturaDaPeca.tsx`, `avatar/identidade13.tsx`, `jogo/material/Lojas.tsx` (provador),
`jogo/Aparencia.tsx`, `v23/CorpoEPele.tsx` + `corpo23.css`, `catalogo.css`, chamadores da figura (Tatuagens, Piercings13,
PainelDePiercings, RostoDetalhes, Lugares), `novidades.ts`, `vite.config.ts` (regra `motor/v23/<frente>`).
Ferramentas: `scripts/playtest/galeria23.tsx`, `foto23.mjs`, `vida23.mjs`.

## 9. Compatibilidade — [OK]

- Sem `corpo23`: a geometria é idêntica à de antes, sem desenho novo (teste: markup igual nas 5 condições; galeria `13`), altura média
  como antes. Sem `marcas23`/`pelos23`: nada aparece. Nenhum campo é escrito em quem já existe ao abrir o save; `normalizarVida23` só
  apaga valor estragado. Pessoas já criadas no mundo não mudam; só as novas (nascimentos, NPCs gerados daqui em diante) ganham corpo próprio.
- O sorteio novo usa um gerador próprio com chave nos traços: o acaso do jogo é o mesmo (teste: o próximo número do gerador
  principal é igual). Marcas não passam a filhos (`geneticaDe` remove).
- Roupas, itens, equipados, looks, lojas e preços existentes: inalterados.

## 10. Testes e resultados reais

- Novos: `motor/__tests__/vida23Corpo.test.ts` (12) e `ui/__tests__/vida23.test.tsx` (8) — 20/20.
- Suíte completa (Node 22, 3 workers): **2.897 passaram, 6 falharam, 1 pulado** (2.904). Das 6: 3 eram desta entrega (id de piercing
  repetido `pc_sobrancelha_azul` → renomeado; peça redundante removida) e passam agora (5 arquivos afetados: 43/43); 3 por tempo
  esgotado sob carga com limite fixo no próprio teste — `profissao` "treinar dobrado" passa sozinho; `fechamentoMundo #4` (60 s) e
  `motor` "regra de agência" já falhavam na base (registrado no relatório ERAS v2).
- `tsc --noEmit` limpo. Build sem avisos: `motor-textos` 799.917 B (< 800 kB), novos pacotes `motor23-corpo`, `motor23-acao`, `CorpoEPele`.
- `smoke:itch` 31/31. PWA offline 13/14 — a falha (aba "Celular" na Semana) é idêntica no build da base `e815edb` (pré-existente).
- QA no app (build local, `scripts/playtest/vida23.mjs`) em 1440, 820, 390 e 360 px, claro e escuro: provador de roupa e de brinco
  com todas as figuras a 132 px e o mesmo viewBox; sem rolagem lateral; Aparência a 132 px; painel com antes/depois iguais; confirmar
  → recarregar a página → a constituição continua (lida do IndexedDB); 0 erros de console. Um defeito achado e corrigido no QA: a
  820 px o controle deslizante ficava com largura 0 (coluna da prévia sem limite) → grid corrigido.

## 11. Evidências visuais

`docs/vida23/`: 01–04 antes/depois do provador (roupa, joia; 390 escuro), 05–06 o painel, 10–13b formas, condição × estatura,
compatibilidade e pessoas sorteadas, 14–15 marcas (corpo e rosto, peles p1–p6), 16–19 brincos, metais, colares/pulseiras/anéis, piercings.

## 12. Commit e branch de produção — [OK]

Código publicado: `30f9cf1` (`git log e815edb..30f9cf1`, branch `claude/vida23-corpo-diversidade-joias`). `main` e a branch de
produção do Cloudflare Pages (`claude/fix-pos-rework3-playtest`) avançadas por fast-forward (`e815edb`/`c336cd0` → `30f9cf1`),
sem force-push. Este relatório final vai num commit de documentação só em `main` e na branch (a produção fica em `30f9cf1`).

## 13. Deploy e versão servida — [OK]

- 15/11/2026: https://vida-game.pages.dev/ passou a servir `assets/index-doCQhtul.js` ~5,5 min após o push. O `index.html` ("/") e os
  **156 arquivos JS/CSS** são idênticos (sha256) ao build local de `30f9cf1` (0 diferentes).
- Teste no site real (`URL=https://vida-game.pages.dev/ scripts/playtest/vida23.mjs`), 1440 px claro e 390 px escuro: provador de
  roupa (132 × 132 px, mesmo viewBox), provador de brinco (com a peça · como você está · de perto, 132 px cada), Aparência 132 px,
  painel Corpo e pele (antes/depois iguais), confirmar → recarregar → a constituição continua; sem rolagem lateral; 0 erros de
  console. Capturas: `docs/vida23/20-producao-provador-brinco-1440.png`, `21-producao-provador-roupa-390-escuro.png`.

## 14. Pendências e limitações reais

Pendências reais: playtest humano não feito; marcas e constituição não entram no rosto lateral (não existe perfil) nem em
animais; a estatura do jogador não é editável (é a do motor, de propósito); NPCs antigos continuam sem constituição.
