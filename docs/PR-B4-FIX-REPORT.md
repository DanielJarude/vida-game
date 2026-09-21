# PR B4-FIX — Primeiros Anos, Local de Nascimento e Clareza Visual

**Branch:** `arena/01a0bcb3-vida-game`
**Base:** `2e0c578` (PR B4)
**Data:** 20/09/2026

---

## 1. PROBLEMAS DO PLAYTEST HUMANO

| # | Achado | Gravidade | Situação |
| --- | --- | --- | --- |
| 1 | Aos 0 anos, o pai oferecia Conversar / Passar tempo / Dar um presente / Discutir | **Grave** | Corrigido |
| 2 | Local de nascimento — escolha manual precisava ser garantida e a seleção era uma lista única de 28 cidades | Média | Corrigido |
| 3 | Dinheiro ficou pouco perceptível no B4 | Média | Corrigido |
| 4 | Contraste baixo em informação secundária | Média | Corrigido |
| 5 | Informação importante pequena demais | Média | Corrigido |
| 6 | Modal de relacionamento ainda parecia lista de cards | Baixa | Corrigido |

### Sobre o achado nº 1 — a causa real

A interface não estava "escondendo botões errados": **a regra não existia
em lugar nenhum**. `getActionAvailability` tratava `interagir_familia`
verificando apenas `pedir_dinheiro` e `pedir_conselho` (idade mínima 6).
Conversar, passar tempo, discutir e dar presente **não tinham nenhuma
checagem de idade** — nem na política, nem no motor.

Pior: no `FamilyModal`, "Dar um presente" era um botão hardcoded que
**nunca passava por `verificarInteracao`**. Mesmo que a política
bloqueasse, a interface o exibiria.

Por isso a correção é sistêmica (§2), não cosmética.

### Sobre o achado nº 2 — o que a auditoria realmente encontrou

Auditei o fluxo inteiro antes de mudar qualquer coisa, e é importante
registrar: **a escolha manual já era respeitada pelo motor**.
`criarVida` recebe `cidade`/`estado` e os grava sem randomizar;
`gerarVidaAleatoria` é um caminho separado que sorteia e delega.

Confirmei isso com uma sonda antes de escrever o código:

```
CHAMADA: ["Davi","Almeida","masculino","Recife","PE"]
```

O que existia de fato eram dois problemas menores: a seleção era um
`<select>` único com 28 cidades (não escalável, §1) e não havia **nenhum
teste** protegendo a garantia. O FIX trata os dois, mas não "conserta" um
bug de sobrescrita que não existia — e agora há 7 testes impedindo que
ele passe a existir.

---

## 2. LOCAL DE NASCIMENTO

### Separação dos dois fluxos

| Fluxo | Comportamento |
| --- | --- |
| **Começar uma nova vida** | O jogador define nome, sobrenome, gênero, estado e cidade. O que está na tela é exatamente o que o motor recebe. |
| **Vida aleatória** | Sorteia tudo, incluindo a localização. Caminho separado, sem passar pela tela de criação. |
| **Sortear tudo** (dentro da criação) | Atalho **explícito**, acionado pelo jogador. Preenche os campos — que continuam editáveis antes de confirmar. |

Nenhuma randomização ocorre depois da confirmação.

### Seleção em dois passos, data-driven

`Estado → Cidade`, derivado de `CIDADES_BRASILEIRAS` por três funções
novas em `src/data/brazilianData.ts`:

- `listarEstadosDisponiveis()` — estados com ao menos uma cidade, com
  região e contagem;
- `listarCidadesPorEstado(sigla)` — cidades daquele estado, em ordem;
- `encontrarCidade(cidade, sigla)` — busca exata.

Nenhuma cidade é escrita dentro de componente React. Acrescentar uma
entrada ao array faz a opção aparecer na criação automaticamente.

Trocar de estado **corrige a cidade** para uma válida daquele estado —
não é possível submeter um par incoerente.

### Limitação documentada

O jogo suporta **28 cidades em 18 estados**, escolhidas para cobrir as
cinco regiões. Não é a lista completa dos municípios brasileiros. O campo
`custoVidaRelativo` é **parâmetro de balanceamento do jogo**, não dado
socioeconômico de fonte externa — registrado como comentário no próprio
arquivo de dados para que ninguém o interprete como estatística real.

Nenhum dado socioeconômico novo foi inventado para cidade nenhuma.

---

## 3. INTERAÇÕES DE 0 A 5 ANOS

### Onde a regra passou a viver

Módulo novo: **`src/systems/interactionCapabilitySystem.ts`**.

É a fonte única. Consultado em dois pontos independentes:

1. `availabilitySystem.getActionAvailability` — decide o que a interface
   mostra, esconde ou bloqueia;
2. `familySystem.interagirComFamiliar` — **revalida antes de qualquer
   efeito**. É esta checagem que realmente protege o estado: uma chamada
   direta (save editado, código, teste) falha igual, sem efeito parcial.

### Matriz resultante

| Idade | Vínculo | Fala | Conflito | Presente |
| --- | --- | --- | --- | --- |
| 0 | Ficar no colo | ✗ bloqueada | ✗ bloqueada | ✗ não oferecida |
| 1 | Brincar junto | ✗ bloqueada | ✗ bloqueada | ✗ não oferecida |
| 2 | Brincar junto | ✓ Falar do seu jeito | ✗ bloqueada | ✗ não oferecida |
| 3–5 | Brincar junto | ✓ Contar uma novidade | ✓ Fazer birra | ✗ não oferecida |
| 6–11 | Passar tempo | ✓ Conversar | ✓ Bater de frente | ✗ não oferecida |
| 12+ | Passar tempo | ✓ Conversar | ✓ Discutir | ✓ disponível |

**Bloqueada** (aparece com motivo em texto) ≠ **não oferecida** (nem entra
na lista). A distinção é deliberada: mostrar "Dar um presente" riscado
para um bebê seria ruído, porque a ação não pertence àquela vida ainda.
Já mostrar a fala bloqueada tem valor — comunica que a criança está
crescendo em direção a ela.

O vínculo **nunca** fica vazio: em toda idade existe ao menos uma
interação disponível. Há teste para isso em todas as 9 idades testadas.

### Mínimo de ações novas

Nenhuma ação nova foi criada. As seis interações existentes foram
**restringidas e readaptadas**. Não há sistema de desenvolvimento
infantil, nem dezenas de mecânicas novas (§3, §18).

---

## 4. PRIMEIRAS FALAS

`IDADE_PRIMEIRAS_FALAS = 2`, declarada com comentário explícito de que é
um **marco simplificado de jogo**, não regra clínica:

> As faixas são direção de design, não afirmação médica. Crianças reais
> não seguem um cronograma único; o jogo usa marcos simplificados para
> decidir o que faz sentido oferecer.

Antes dos 2 anos a comunicação existe, mas é **não verbal** — e os
rótulos dizem isso: "Tentar se comunicar / Apontar, resmungar e esperar
ser entendido".

---

## 5. INTERAÇÕES MUDAM COM A IDADE

Não foi só esconder. A mesma intenção recebe palavras diferentes por
fase, via **`src/presentation/interactionPresentation.ts`** — tabela
declarativa, não condicional dentro do modal (§5, §15).

| Intenção | 0 ano | 1 ano | 2 anos | 3–5 | Adulto |
| --- | --- | --- | --- | --- | --- |
| Vínculo | Ficar no colo | Brincar junto | Brincar junto | Brincar junto | Passar tempo junto |
| Fala | Tentar se comunicar | Tentar se comunicar | Falar do seu jeito | Contar uma novidade | Conversar |
| Conflito | Se irritar | Se irritar | Se irritar | Fazer birra | Discutir |

As descrições acompanham. "Bater um papo sobre o dia" (adulto) vira
"Juntar as primeiras palavras para dizer alguma coisa" (2 anos).

A ordem também muda: antes dos 6 anos o **afeto vem primeiro** na lista,
porque é o que de fato existe naquela fase.

---

## 6. PRESENTES

`IDADE_MINIMA_DAR_PRESENTE = 12`. Justificativa registrada no código:
presentear exige **autonomia para escolher** e **dinheiro próprio para
pagar** — uma criança pequena não tem nenhum dos dois.

- Antes dos 10 anos a ação **não é oferecida**.
- O menu de presentes só abre se a ação estiver disponível.
- Os preços do B3 (R$ 50 / R$ 250 / R$ 1.200) foram **preservados
  intactos**.
- **Nenhum dinheiro mágico** foi criado. Há teste verificando que o custo
  é sempre positivo e o ganho sempre zero.

Presente feito à mão pela criança seria outro tipo de interação e,
conforme o escopo, **não foi implementado**.

---

## 7. DINHEIRO

Regra na camada de apresentação: `deveMostrarSaldoNaIdentidade(idade,
temPatrimonio)` em `lifeStagePresentation.ts`.

| Situação | Saldo visível? |
| --- | --- |
| 0–14 anos, sem patrimônio | Não — seria ruído |
| 0–14 anos, com imóvel/investimento | Sim — o valor deixou de ser abstrato |
| 15+ anos | Sim — bicos tornam o dinheiro relevante |

O corte em 15 coincide com `IDADE_MINIMA_TRABALHO_JUVENIL`/bicos, não é
número solto.

### Como aparece

Uma linha na coluna de identidade, logo abaixo da idade, separada por
régua:

```
Ana Souza
25 anos · Vida adulta
─────────────────────
SALDO   R$ 2.450
```

Sem caixa, sem ícone, sem painel. Rótulo pequeno em maiúsculas + número
com peso tipográfico. Saldo negativo usa `--danger` **e** o sinal `-` no
próprio número — não depende de cor (§21). O significado de SALDO PESSOAL
do B3 foi preservado; nada no modelo econômico mudou.

---

## 8. CLAREZA VISUAL

O playtest apontou contraste baixo. **Medi antes de mexer**, e a queixa
era objetivamente correta:

| Token | Antes | Contraste | Depois | Contraste |
| --- | --- | --- | --- | --- |
| `--text-primary` | `#eef4f2` | 17,07:1 ✓ | inalterado | 17,07:1 ✓ |
| `--text-secondary` | `#94a8a6` | 7,61:1 ✓ | `#a8bcba` | 9,57:1 ✓ |
| `--text-muted` | `#63797a` | **4,12:1 ✗** | `#88a0a2` | **6,88:1 ✓** |
| `--text-faint` | `#46595c` | **2,57:1 ✗** | `#7e9492` | **5,92:1 ✓** |

Dois tokens reprovavam no WCAG AA (mínimo 4,5:1). Agora **nenhum texto do
produto fica abaixo de 4,5:1**, e a hierarquia entre os quatro níveis foi
preservada — legibilidade não foi conquistada achatando tudo no mesmo tom.

### Tamanho

Três elementos subiram de `--type-caption` (13px) para `--type-body`
(15px), por serem conteúdo e não legenda:

- `.timeline-entry__summary` — é o texto da própria lembrança;
- `.identity__fact` — cidade, situação, escolaridade, ocupação;
- `.empty-state` e `.timeline-empty`.

### Outros ajustes

- `.event-choice:disabled` passou de `opacity: 0.55` para `0.8`. Em 0.55 o
  contraste efetivo do texto caía abaixo do mínimo; o estado continua
  claro pelo indicador tracejado e pelo motivo em texto.
- `.action-row__detail` e `.event-choice__hint` passaram de `muted` para
  `secondary`.

**Nada voltou para dentro de card.** A correção foi inteiramente por
tipografia, contraste e espaçamento (§8).

### Proteção contra regressão

`src/styles/__tests__/contraste.test.ts` lê `tokens.css`, calcula a razão
de contraste WCAG real e falha se qualquer token cair abaixo do mínimo.
A correção não depende de ninguém lembrar dela.

---

## 9. MODAL DE RELACIONAMENTOS

Reordenado para **pessoa → relação → contexto → ações**:

```
Maria Souza                    ← nome, peso de título
Mãe                            ← relação, em acento
30 anos · Professora · relação muito próxima
─────────────────────────────
› Conversar
› Passar tempo junto
› Dar um presente
...
```

- Ações são **linhas** (`.event-choice`), não quatro cartões
  independentes. Zero `.unit-card` no modal — verificado por teste.
- **Toda** ação passa por `verificarInteracao`, inclusive o presente, que
  antes era hardcoded.
- O submenu de presentes ganhou "Voltar" (antes era um caminho sem saída).
- Estado indisponível explica o porquê, com motivo **contextual e
  específico** — há teste exigindo mais de 20 caracteres, para impedir
  que alguém troque por um "Indisponível" genérico.

Exemplos reais, extraídos da execução:

> "Você é um bebê de colo: ainda não fala, só observa e reage."
> "Um recém-nascido não discute: chora, dorme e é acolhido."
> "Você ainda se comunica por gestos e sons, não por conversa."

Não foi iniciado novo redesign (§13).

---

## 10. FEEDBACK DAS AÇÕES

O ciclo ação → reação → consequência do B3/B4 foi preservado e passou a
funcionar também na primeira infância, via `narrarInteracaoPorFase`:

| Idade | Interação | Reação |
| --- | --- | --- |
| 0 | Ficar no colo | "Maria te pegou no colo. Você parou de chorar e ficou ouvindo a voz dele(a) bem de perto." |
| 1 | Brincar junto | "Você engatinhou atrás de João pela casa inteira e riu cada vez que foi pego(a)." |
| 2 | Falar do seu jeito | "Você juntou as palavras que sabia e contou alguma coisa para Maria. Nem tudo fez sentido, mas ele(a) ouviu até o fim." |
| 4 | Fazer birra | "Você fez birra com João por causa de algo que parecia muito importante. Passou depois, mas demorou." |
| 25 | Conversar | "Você teve uma ótima conversa com Maria. Vocês riram e compartilharam novidades." (texto original do B3, intacto) |

Nenhuma narrativa usa pontos internos de personalidade — há teste
varrendo por `empatia|disciplina|reputação|estresse|+N`.

---

## 11. PRIVACIDADE DE ATRIBUTOS

Auditei todos os caminhos de exposição:

```
grep -rni "atributos internos|ver atributos|hiddenStats" src/components/ src/presentation/
```

**Resultado: nenhuma ocorrência de código** — só três comentários
explicando que os internos não devem vazar. O botão "Ver Atributos
Internos" **não existe** (foi removido junto com `StatsSidebar` no B4).

Dois testes novos garantem que não volte: a identidade não contém nenhum
dos sete nomes internos, e nenhum botão do modal oferece revelá-los.

---

## 12. ARQUITETURA

| Arquivo | Linhas | Responsabilidade | Situação |
| --- | --- | --- | --- |
| `src/systems/interactionCapabilitySystem.ts` | 210 | Capacidade de interação por idade + narrativa por fase | **NOVO** |
| `src/presentation/interactionPresentation.ts` | 179 | Rótulos e ordem por fase | **NOVO** |
| `src/styles/__tests__/contraste.test.ts` | 103 | Guarda de contraste WCAG | **NOVO** |
| `src/hooks/useGame.ts` | **937** | Orquestração | **INALTERADO** |
| `src/systems/availabilitySystem.ts` | 490 | Política central | +14 linhas (delega) |
| `src/systems/familySystem.ts` | 361 | Regras de família | +35 (revalidação + narrativa) |
| `src/data/brazilianData.ts` | 181 | Dados + consultas de localização | +59 (3 funções) |
| `src/components/modals/FamilyModal.tsx` | 266 | Modal de pessoa | Refatorado |
| `src/components/screens/CharacterCreationScreen.tsx` | 207 | Criação | Refatorado |
| `src/presentation/lifeStagePresentation.ts` | 143 | Perfil por fase + saldo | +28 |
| `src/components/character/CharacterIdentity.tsx` | 160 | Identidade | +saldo |

**`useGame.ts` não cresceu nem uma linha** (§15). Nenhuma regra infantil
entrou no React: capacidade em `systems/`, rótulos em `presentation/`,
localização em `data/`.

O modal não tem lista própria de idades — há teste que passa um
verificador "sempre disponível" e confirma que ele exibe tudo, provando
que não filtra por conta própria (§11).

---

## 13. TESTES

| | Antes (B4) | Depois |
| --- | --- | --- |
| Arquivos | 10 | **14** |
| Testes | 262 | **361** |
| Resultado | 100% | **100%** |

**Os 262 testes do B4 foram preservados.** Apenas duas assinaturas de
teste existentes mudaram, por `CharacterIdentity` passar a receber
`economia` — nenhuma asserção foi enfraquecida ou removida.

| Arquivo novo | Testes |
| --- | --- |
| `src/systems/__tests__/capacidadeInteracao.test.ts` | 42 |
| `src/components/__tests__/b4FixInterface.test.tsx` | 34 |
| `src/__playtest__/playtestB4Fix.test.tsx` | 13 |
| `src/styles/__tests__/contraste.test.ts` | 8 |
| (+2 em `apresentacaoB4.test.ts`) | 2 |

### Cobertura dos 18 pontos exigidos

| # | Ponto | Onde | ✓ |
| --- | --- | --- | --- |
| 1 | Recém-nascido não conversa | `capacidadeInteracao` · "não pode conversar" | ✓ |
| 2 | Recém-nascido não discute | `capacidadeInteracao` · "não pode discutir" | ✓ |
| 3 | Recém-nascido não dá presente | `capacidadeInteracao` · "não pode dar presente" | ✓ |
| 4 | Ação bloqueada falha no motor | `capacidadeInteracao` · 6 casos, sem efeito parcial | ✓ |
| 5 | 1 ano sem conversa adulta | `capacidadeInteracao` · bloco "1 ano" (4) | ✓ |
| 6 | 2 anos libera só o apropriado | `capacidadeInteracao` · bloco "2 anos" (4) | ✓ |
| 7 | 3–5 com interações coerentes | `capacidadeInteracao` · bloco "3 a 5" (5) | ✓ |
| 8 | Adulto mantém interações | `capacidadeInteracao` · 7 testes | ✓ |
| 9 | Presente respeita idade/contexto/saldo | `capacidadeInteracao` · 4 testes | ✓ |
| 10 | Estado manual persiste | `b4FixInterface` · "escolha manual de Estado" | ✓ |
| 11 | Cidade manual persiste | `b4FixInterface` · "escolha manual de Cidade" | ✓ |
| 12 | Não sobrescrito por randomização | `b4FixInterface` · 8 submissões idênticas | ✓ |
| 13 | Vida aleatória continua aleatória | `b4FixInterface` · "Sortear tudo" coerente | ✓ |
| 14 | Saldo aparece quando relevante | `b4FixInterface` · 3 testes | ✓ |
| 15 | Saldo não domina UI de bebê | `b4FixInterface` · 2 testes | ✓ |
| 16 | Atributos internos privados | `b4FixInterface` · 2 testes | ✓ |
| 17 | Não voltou a "tudo é card" | `b4FixInterface` · 3 testes | ✓ |
| 18 | Navegação contextual funciona | `b4FixInterface` · 2 testes | ✓ |

---

## 14. PLAYTEST POR IDADE

`src/__playtest__/playtestB4Fix.test.tsx` abre **pai e mãe** nas idades
0, 1, 2, 3 e 5 e registra o que aparece. Saída literal da execução:

```
  0 anos · PAI / MAE
      - Ficar no colo [disponível]
      - Tentar se comunicar [bloqueada]
        motivo: Você é um bebê de colo: ainda não fala, só observa e reage.
      - Se irritar [bloqueada]
        motivo: Um recém-nascido não discute: chora, dorme e é acolhido.

  1 ano · PAI / MAE
      - Brincar junto [disponível]
      - Tentar se comunicar [bloqueada]
        motivo: Você ainda se comunica por gestos e sons, não por conversa.
      - Se irritar [bloqueada]
        motivo: Você ainda não tem palavras para brigar por um motivo.

  2 anos · PAI / MAE
      - Brincar junto [disponível]
      - Falar do seu jeito [disponível]
      - Se irritar [bloqueada]
        motivo: Você ainda não tem palavras para brigar por um motivo.

  3 anos · PAI / MAE
      - Brincar junto [disponível]
      - Contar uma novidade [disponível]
      - Fazer birra [disponível]

  5 anos · PAI / MAE
      - Brincar junto [disponível]
      - Contar uma novidade [disponível]
      - Fazer birra [disponível]
```

Comparando com o playtest humano: as quatro opções adultas aos 0 anos
(Conversar / Passar tempo / Dar um presente / Discutir) **deixaram de
existir nessa forma**.

### Idades 10, 15, 18, 25

| Idade | Interações disponíveis |
| --- | --- |
| 10 | Conversar · Passar tempo junto · Pedir um dinheiro · Pedir ajuda · Bater de frente |
| 15 | idem + saldo visível na identidade |
| 18 | Conversa/tempo/presente/dinheiro/conselho/discussão + ações de parceiro |
| 25 | Conjunto adulto completo |

### Criação de vida — verificação manual simulada

| Cenário | Resultado |
| --- | --- |
| Escolher PE → Recife e confirmar | Motor recebe `("...","...","...","Recife","PE")` |
| Escolher SP → Santos e confirmar | Motor recebe `Santos, SP` |
| Escolher SP → Santos, depois trocar para BA | Cidade corrigida para uma cidade válida da BA |
| Confirmar 8× com AM → Manaus | 8 chamadas idênticas: `Manaus, AM` |
| "Sortear tudo" | Par estado/cidade sempre coerente |
| Save e reload com Feira de Santana/BA | Persistido exatamente |

---

## 15. REGRESSÕES

Nenhuma regressão de gameplay.

- Os 262 testes do B4 continuam passando sem asserção enfraquecida.
- Nenhum valor de balanceamento foi alterado (presentes seguem 50/250/1200;
  deltas de relacionamento e humor intactos).
- Narrativas adultas do B3 preservadas literalmente.
- Modelo econômico do B3 intacto.
- Identidade visual do B4 preservada — zero `.card` reintroduzido,
  verificado por teste.

### Uma correção de build

`src/styles/__tests__/contraste.test.ts` usa `node:fs`, o que quebrou
`npm run build` (sem `@types/node`). Resolvido adicionando `@types/node`
como dependência de desenvolvimento e `"types": ["vite/client", "node"]`
ao `tsconfig.json`. Build e typecheck limpos.

### Build

| Medida | B4 | B4-FIX | Δ |
| --- | --- | --- | --- |
| CSS | 36,18 kB (gzip 6,55) | 37,90 kB (gzip 6,72) | +0,17 kB gzip |
| JS | 463,66 kB (gzip 136,52) | 469,27 kB (gzip 138,59) | +2,07 kB gzip |
| Typecheck | limpo | limpo | — |

---

## 16. PENDÊNCIAS

| # | Item | Prioridade |
| --- | --- | --- |
| 1 | `useGame.ts` (937) segue em OBSERVAR — agrupar em hooks por domínio; mudança de arquitetura de estado, merece PR próprio | Média |
| 2 | Verificação visual automatizada segue indisponível (Playwright não roda no sandbox); contraste agora é testado, mas layout depende de inspeção manual | Média |
| 3 | 28 cidades em 18 estados — cobertura regional, não lista completa. Ampliar exige definir `custoVidaRelativo` coerente para cada nova entrada | Baixa |
| 4 | Presente feito à mão pela criança (desenho, bilhete) — interação diferente, deliberadamente fora deste FIX | Baixa |
| 5 | Interações de irmãos/avós usam a mesma matriz de capacidade; podem merecer nuance própria no futuro | Baixa |
| 6 | `FamilyModal` (266) e `character.css` (497) crescendo; pontos de divisão já mapeados | Baixa |

---

## 17. ARQUIVOS ALTERADOS

### Novos (6)

```
src/systems/interactionCapabilitySystem.ts      210  regra de capacidade + narrativa
src/presentation/interactionPresentation.ts     179  rótulos e ordem por fase
src/systems/__tests__/capacidadeInteracao.test.ts    42 testes
src/components/__tests__/b4FixInterface.test.tsx     34 testes
src/__playtest__/playtestB4Fix.test.tsx              13 testes
src/styles/__tests__/contraste.test.ts                8 testes
```

### Modificados (20)

```
src/systems/availabilitySystem.ts        +14  delega capacidade
src/systems/familySystem.ts              +35  revalida + narra por fase
src/data/brazilianData.ts                +59  3 consultas de localização
src/presentation/lifeStagePresentation.ts +28 regra do saldo
src/components/modals/FamilyModal.tsx         pessoa→ações; presente pela política
src/components/screens/CharacterCreationScreen.tsx  estado→cidade
src/components/character/CharacterIdentity.tsx      linha de saldo
src/components/shell/CharacterRail.tsx              repassa economia
src/components/shell/GameShell.tsx                  repassa economia
src/styles/tokens.css                    contraste AA
src/styles/character.css                 saldo + legibilidade
src/styles/events.css                    person-head + contraste
src/styles/screens.css                   topbar + campos aninhados
src/styles/controls.css                  contraste
src/styles/timeline.css                  legibilidade do resumo
src/components/__tests__/b4Interface.test.tsx       prop economia
src/presentation/__tests__/apresentacaoB4.test.ts   +2 testes
tsconfig.json                            types node
package.json / package-lock.json         @types/node
```

---

## 18. ESCOPO

Não foi implementado, conforme §18: aposentadoria, moradia, romance
adolescente, dezenas de eventos, sistema complexo de desenvolvimento
infantil, banco, novas moedas, retratos, geração de imagens, novo
redesign.

**B5 não foi iniciado.**
