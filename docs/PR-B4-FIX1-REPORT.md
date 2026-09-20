# PR B4-FIX1 — relatório

## 0. Contexto

Depois de um erro de interface ("Something went wrong") na sessão anterior,
esta sessão começou com uma auditoria completa da branch `arena/01a0bd23-vida-game`
para confirmar o que estava realmente presente antes de tocar em qualquer
código. A auditoria (`git status`, `git diff`, leitura de `App.tsx`/`useGame.ts`,
suíte de testes, `typecheck`, `build`) confirmou que **nada foi perdido por
causa do erro de interface**: o commit base `7873306` já continha o trabalho
descrito em `docs/PR-B4-FIX-REPORT.md` (localização de nascimento, clipping,
+1 ANO acessível, eventos 0–5, anti-repetição), com 365 testes passando,
`typecheck` limpo e `build` limpo.

A auditoria também constatou que três itens do checklist de inspeção visual
**nunca existiram em nenhum commit recuperável**:

1. Lista completa de 27 UFs (faltavam 8, incluindo o Acre) — só 19 UFs tinham
   cidade cadastrada.
2. Identidade do personagem usando avatar em vez de iniciais de texto.
3. Pet com interações próprias (o pet herdava a mesma matriz de interação de
   um humano: conversar, discutir, presente comprado, pedir dinheiro/conselho).

Diante disso, e com confirmação explícita do responsável, esses três itens
foram implementados nesta sessão como **complemento real ao B4-FIX** — não
como recuperação de trabalho perdido, e não como início do próximo pacote
(B5, que **não foi iniciado**).

## 1. O que foi feito

### 1.1 As 27 UFs, incluindo o Acre

- `src/data/brazilianData.ts`: `CIDADES_BRASILEIRAS` passou a ter uma cidade
  (normalmente a capital) para cada uma das 27 unidades federativas —
  26 estados + Distrito Federal. 36 cidades ao todo (comentário do arquivo
  corrigido para refletir esse número exato).
- Nenhuma duplicação em componente: a tela de criação de personagem já lia
  a lista de forma data-driven (Estado → Cidade), então adicionar as UFs
  faltantes bastou para que aparecessem na interface, sem tocar em JSX.
- `src/data/__tests__/cobertura27UFs.test.ts` (pré-existente desta sessão,
  reconfirmado): 4 testes garantindo que as 27 UFs estão cobertas, sem
  duplicata de sigla e com o Acre presente nominalmente.

### 1.2 Avatar em vez de iniciais

Tensão resolvida: as skills do projeto (`SKILL_UX_UI.md`) proíbem retrato
fotográfico ou imagem dedicada — a presença visual deveria vir de
composição/tipografia/cor. A solução adotada respeita essa regra ao pé da
letra: **nenhuma foto, nenhum retrato gerado, nenhuma imagem externa**. O
"avatar" é um símbolo tipográfico/vetorial (ícone) escolhido por categoria de
vida (bebê, criança, adolescente, adulto, idoso, pet), na mesma paleta
discreta que as iniciais usavam antes — mantendo composição e cor como a
única fonte de identidade visual, apenas trocando "duas letras" por um
símbolo mais legível e mais rápido de reconhecer.

- `src/presentation/avatarPresentation.ts` (novo): módulo puro,
  `obterCategoriaAvatarPessoa(idade)`, `obterCategoriaAvatar(idade, tipo?)`
  (pet sempre cai em `'pet'`, independente da idade), `obterRotuloAvatar`.
- `src/components/character/PersonAvatar.tsx` (novo): componente que
  consome a apresentação e mapeia categoria → ícone (lucide-react),
  `role="img"` + `aria-label` com o nome da pessoa (acessibilidade).
- `src/components/character/CharacterIdentity.tsx` e
  `src/components/relationships/RelationshipSummary.tsx`: passaram a
  renderizar `<PersonAvatar>` em vez do bloco de iniciais.
- `src/styles/character.css`: `.person-avatar`/`.relationship__avatar`
  ajustados para preencher o retrato existente (mesmo tamanho e posição de
  antes — só o conteúdo interno mudou).
- Efeito colateral de limpeza: `extrairIniciais`/campo `iniciais` em
  `src/presentation/relationshipPresentation.ts` ficaram órfãos (nenhum
  consumidor depois da troca) e foram removidos.

### 1.3 Pet com interações próprias

Antes, um pet oferecia exatamente as mesmas 6 interações de um humano
(conversar, passar tempo, dar presente, discutir, pedir dinheiro, pedir
conselho) — inclusive "pedir conselho a um cachorro". Agora o pet tem sua
própria trilha de interação, mutuamente exclusiva da trilha humana:

- `src/types/index.ts`: `FamilyInteractionType` ganhou três valores
  exclusivos de pet — `'fazer_carinho' | 'alimentar' | 'passear'` — mantendo
  os 6 tipos humanos existentes intactos.
- `src/systems/interactionCapabilitySystem.ts`: todas as funções relevantes
  (`avaliarCapacidadeInteracao`, `deveOferecerInteracao`,
  `narrarInteracaoPorFase`) ganharam um parâmetro `ehPet: boolean = false`
  (o default preserva 100% do comportamento anterior para humanos — nenhum
  teste humano precisou mudar). Quando `ehPet` é verdadeiro:
  - `passar_tempo` é sempre permitido, desde o primeiro ano de vida do
    jogador;
  - `fazer_carinho`, `alimentar` e `passear` têm idade mínima própria
    (1, 3 e 6 anos, respectivamente — a lógica de "o jogador precisa ter
    idade/força suficiente para cuidar do animal");
  - qualquer interação humana (conversar, discutir, presente, pedir
    dinheiro/conselho) é recusada com um motivo textual explícito ("Um pet
    não participa desse tipo de interação."), nunca escondida sem
    explicação.
- `src/systems/availabilitySystem.ts` (case `'interagir_familia'`) e
  `src/systems/familySystem.ts` (`interagirComFamiliar`): calculam
  `ehPet = membro.tipo === 'pet'` e propagam para as checagens de
  capacidade/disponibilidade; o motor de interação ganhou 3 novos `case`
  (`fazer_carinho`, `alimentar`, `passear`) com efeitos coerentes
  (relacionamento e felicidade sobem, estresse cai — sem inventar stats
  novos).
- `src/presentation/interactionPresentation.ts`: rótulos próprios
  ("Fazer carinho", "Alimentar", "Passear") e uma nova
  `rotularInteracaoPet()` — diferente da versão humana, o rótulo de uma
  interação com pet **não varia pela fase de vida do jogador** (não faz
  sentido herdar "Ficar no colo", pensado para um bebê humano, ao interagir
  com o animal). `ordenarInteracoesComPet()` fixa a ordem de exibição.
- `src/components/modals/FamilyModal.tsx`: escolhe a ordem e o rótulo certos
  conforme `membro.tipo === 'pet'`.
- `src/hooks/useGame.ts`: a assinatura de `acaoFamilia` usava uma união de
  string literal manual (sem os 3 novos valores); foi trocada para importar
  `FamilyInteractionType` de `../types`, então os novos tipos passam a
  compilar sem duplicar a lista em mais um lugar.

## 2. Modularidade

Nenhuma lógica nova foi concentrada em arquivo monolítico. Toda a mudança de
pet vive nos módulos de sistema/apresentação que já existiam para as
interações humanas:

| Arquivo | Linhas após a mudança |
|---|---|
| `src/App.tsx` | 164 (inalterado nesta sessão) |
| `src/hooks/useGame.ts` | 938 (só o tipo de um parâmetro mudou) |
| `src/types/index.ts` | 399 |
| `src/systems/interactionCapabilitySystem.ts` | 349 |
| `src/systems/familySystem.ts` | 381 |
| `src/systems/availabilitySystem.ts` | 493 |
| `src/presentation/interactionPresentation.ts` | 234 |
| `src/presentation/avatarPresentation.ts` | 71 (novo, dedicado) |
| `src/components/character/PersonAvatar.tsx` | 60 (novo, dedicado) |
| `src/components/modals/FamilyModal.tsx` | 273 |

## 3. Testes novos

- `src/systems/__tests__/interacoesPet.test.ts` (15 testes): capacidade por
  idade das 4 interações de pet, recusa das 5 interações humanas em
  qualquer idade, narrativa nunca vazia, ausência de vazamento de termos
  internos (empatia/disciplina/estresse/números de delta) na narrativa,
  integração via `getActionAvailability` e via `interagirComFamiliar`
  (efeito real e ausência de efeito parcial quando recusado).
- `src/components/__tests__/petInterface.test.tsx` (5 testes): o modal
  aberto sobre um pet nunca mostra Conversar/Discutir/Presente/Pedir
  dinheiro/Pedir conselho, mostra as 3 ações próprias, `passar_tempo`
  disponível mesmo com jogador de 0 ano, clique dispara a ação certa, e o
  rótulo de relação mostrado é "Pet".
- `src/components/__tests__/avatarInterface.test.tsx` (8 testes): a
  identidade não usa mais `.identity__initials`, o avatar tem
  `role="img"` + `aria-label` com o nome, as 5 categorias humanas por idade
  e a categoria fixa `'pet'`, avatar presente na lista de relacionamentos
  (incluindo um pet nela) e ausência de exceções ao renderizar em todas as
  idades.
- `src/data/__tests__/cobertura27UFs.test.ts` (4 testes, já existente):
  cobertura das 27 UFs sem duplicata e com o Acre presente.

## 4. Resultado da suíte completa

```
Test Files  18 passed (18)
     Tests  393 passed (393)
```

(365 testes pré-existentes + 28 novos desta sessão: 15 de pet + 8 de avatar
+ 4 de UF já contabilizados na base pré-existente + 1 arquivo de UI de pet.
Nenhum teste pré-existente foi alterado ou removido — só a remoção do campo
órfão `iniciais`, que não tinha teste próprio nem consumidor.)

- `npm run typecheck` → limpo, 0 erros.
- `npm run build` → limpo (`tsc && vite build`), bundle gerado normalmente
  (`dist/assets/index-*.js` ~474 kB, ~140 kB gzip).

## 5. Inspeção visual final

**Limitação confirmada e não contornável nesta sessão**: não há navegador
(Chromium/Firefox) instalado ou instalável neste sandbox. `npx playwright
install chromium` falha de forma consistente com `ECONNRESET`/
`SSL_ERROR_SYSCALL` ao tentar baixar de `cdn.playwright.dev` e do mirror
`playwright.azureedge.net` — testado 3+ vezes. `curl` a hosts externos
(`storage.googleapis.com`, `objects.githubusercontent.com`, `unpkg.com`,
`cdnjs.cloudflare.com`, `jsdelivr.net`) confirma bloqueio de rede geral;
apenas `github.com` e `registry.npmjs.org` respondem. `apt-get install
chromium` falha por falta de acesso a repositórios apt. Esta é a mesma
limitação já registrada em `docs/PR-B4-FIX-REPORT.md` (item 16.2) e
`docs/PR-B4-REPORT.md` (item 12.2).

Diante disso, a inspeção foi feita por leitura de código/CSS e pelo dev
server (`npm run dev`, respondendo em `http://localhost:5173` e
`:5174` durante a sessão), item a item do checklist pedido:

| Item do checklist | Verificação | Resultado |
|---|---|---|
| Criação de personagem com avatar | `PersonAvatar` renderizado em `CharacterIdentity`; testes automatizados confirmam `role="img"` + `aria-label` | OK |
| Lista completa das 27 UFs incluindo Acre | `CIDADES_BRASILEIRAS` tem 1 cidade por UF, Acre = "Rio Branco"; 4 testes de cobertura passando | OK |
| Estado → Cidade | Fluxo já existente (B4-FIX), inalterado; cidades novas aparecem automaticamente por ser data-driven | OK |
| Identidade usando avatar em vez de iniciais | `.identity__initials` removido do DOM; `.person-avatar` no lugar; `iniciais` removido do código-fonte | OK |
| Textos essenciais sem clipping | CSS já usa `text-overflow: ellipsis`/`white-space: nowrap` de forma intencional em pontos específicos (nome truncado com reticências, não cortado abruptamente); nada de novo introduzido que quebre isso | OK (herdado do B4-FIX, não regressado) |
| +1 ANO acessível mesmo com timeline longa | `YearAdvance` com `docked` ancora o botão no rodapé em telas estreitas (`year-advance--docked`, `position: fixed`, `bottom: 0`); lógica inalterada nesta sessão | OK (herdado do B4-FIX, não regressado) |
| Pet com interações próprias | Implementado nesta sessão — ver seção 1.3; 20 testes automatizados (15 de sistema + 5 de UI) | OK — **novo nesta sessão** |
| Eventos 0–5 apropriados à idade | `childhoodEvents.ts` já usa `idadeMinima`/`idadeMaxima` por evento (herdado do B4-FIX); nenhuma mudança nesta sessão | OK (herdado, não regressado) |
| Ausência de repetição excessiva | `repeticaoEAno.test.ts` (13 testes, pré-existente) continua passando sem alteração | OK (herdado, não regressado) |
| Desktop | Breakpoints documentados em `responsive.css` (360/390/768/1366/1920); nenhuma regra de desktop tocada nesta sessão além do avatar (que preenche o retrato existente, mesmo tamanho) | OK |
| ~360px | Regra explícita `<= 380px` em `responsive.css` com comentário "o limite de 360px real"; avatar usa `width: 100%; height: 100%` do contêiner já responsivo, não introduz overflow novo | OK |

Não foi possível capturar uma screenshot real para confirmar pixel a pixel;
a verificação acima é por leitura de código/CSS/testes automatizados, com a
mesma limitação de ambiente já registrada nos relatórios anteriores do
projeto.

## 6. Itens corrigidos durante esta sessão

- Contagem de cidades no comentário de `brazilianData.ts`: "37 cidades" →
  "36 cidades" (número real, conferido por contagem programática).
- Campo `iniciais`/função `extrairIniciais` em `relationshipPresentation.ts`:
  removidos por estarem órfãos depois da troca para avatar.
- `useGame.ts`: união de string literal manual de `tipoAcao` trocada pelo
  tipo importado `FamilyInteractionType`, eliminando uma segunda fonte de
  verdade que já estava desatualizada antes desta sessão (não incluía nem os
  6 tipos originais de forma centralizada).

## 7. Arquivos principais desta sessão

Novos:
- `src/presentation/avatarPresentation.ts`
- `src/components/character/PersonAvatar.tsx`
- `src/data/__tests__/cobertura27UFs.test.ts`
- `src/systems/__tests__/interacoesPet.test.ts`
- `src/components/__tests__/petInterface.test.tsx`
- `src/components/__tests__/avatarInterface.test.tsx`
- `docs/PR-B4-FIX1-REPORT.md` (este arquivo)

Editados:
- `src/data/brazilianData.ts`
- `src/types/index.ts`
- `src/systems/interactionCapabilitySystem.ts`
- `src/systems/availabilitySystem.ts`
- `src/systems/familySystem.ts`
- `src/presentation/interactionPresentation.ts`
- `src/presentation/relationshipPresentation.ts`
- `src/components/modals/FamilyModal.tsx`
- `src/components/character/CharacterIdentity.tsx`
- `src/components/relationships/RelationshipSummary.tsx`
- `src/hooks/useGame.ts`
- `src/styles/character.css`

## 8. Estado final

- Testes: **393 passando / 393** (`npm run test`).
- Typecheck: limpo (`npm run typecheck`).
- Build: limpo (`npm run build`).
- Modularidade: preservada — nenhuma lógica nova concentrada em
  `App.tsx`, `useGame.ts` ou `index.ts`.
- B5: **não iniciado**, por instrução explícita.
