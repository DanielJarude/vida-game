# PR B4 — Rework Visual, Identidade do VIDA e Arquitetura Modular de UI

**Branch:** `arena/01a0bcb3-vida-game`
**Baseline:** `1055e21`
**Data:** 19/09/2026

---

## 1. RESUMO DO QUE FOI FEITO

O B4 não adicionou gameplay. Ele trocou a **linguagem visual** do produto e
reorganizou a camada de interface.

O ponto de partida era uma interface que funcionava mas se comunicava como
um painel administrativo: praticamente todo conteúdo estava dentro de um
`.card` com borda, os atributos internos do personagem apareciam como
sete barras percentuais, um evento fechava sozinho e comunicava a
consequência por um toast de 4 segundos, e não existia nenhum momento em
que o jogo dissesse "foi isto que este ano fez com a sua vida".

O que mudou:

- **Sistema visual novo do zero**: 9 camadas CSS a partir de um arquivo de
  tokens, substituindo um `index.css` monolítico de ~850 linhas com valores
  mágicos espalhados.
- **A Linha da Vida virou o centro** da experiência: eixo vertical
  contínuo, entradas com idade/ano/tipo/título/resumo, diferenciação sutil
  por tipo, marcos com mais presença.
- **O evento virou uma cena**: situação → escolha → resultado → continuar,
  tudo em um único modal, com a escolha feita permanecendo visível ao lado
  do resultado.
- **Resultado com separação de camadas**: narrativa, efeito público e
  efeito interno passaram a ser coisas distintas — e o interno deixou de
  vazar.
- **Resumo anual** passou a existir (não existia).
- **Arquitetura**: nasceu a camada `src/presentation/`, os componentes
  foram reorganizados por responsabilidade, `App.tsx` virou composição pura
  e as regras de balanceamento de atividades saíram do hook para
  `systems/`.

Nenhuma regra de B1/B2/B3 foi alterada. Os 114 testes do baseline
continuam passando sem modificação.

---

## 2. BASELINE E AUDITORIA INICIAL

Registro completo em **`docs/B4-BASELINE.md`**.

| Medida | Baseline (`1055e21`) |
| --- | --- |
| Testes | 114 (7 arquivos), 100% passando |
| Build | OK — 1941 módulos |
| CSS | 11,85 kB (gzip 2,89 kB) |
| JS | 469,22 kB (gzip 136,15 kB) |
| LOC (src) | 13.807 |

### Discrepâncias encontradas

| # | Discrepância | Tratamento |
| --- | --- | --- |
| 1 | `docs/PR-B3-REPORT.md`, exigido pelo §0, **não existe** no checkout | Registrado. A auditoria foi feita direto no código. |
| 2 | O B3 reportou "31 testes"; o checkout tem **114**. 31 é exatamente o total de `availabilitySystem.test.ts` | O número do relatório era parcial. **Os 114 foram preservados integralmente.** |
| 3 | `ActionOutcome` / `OutcomePanel`, citados como existentes, **nunca existiram** no código | Construídos neste PR (`EventResult` + `descreverEfeitosPublicos`). |
| 4 | Resumo anual (§15) não existia em nenhuma forma | Construído neste PR (`construirResumoAnual` + `AnnualSummary`). |

### Auditoria visual: a contagem que confirmou o diagnóstico

Ocorrências de classe nas abas e modais **antes** do PR:

| Classe | Ocorrências |
| --- | --- |
| `option-btn` | 20 |
| `card` | 14 |
| `card-title` | 12 |
| `acao-contextual` | 6 |
| `acao-bloqueada-motivo` | 6 |
| `modal-title` / `modal-overlay` / `modal-card` | 5 cada |
| `btn-icon` | 4 |
| `btn-acao-primaria` | 4 |
| `stat-bar-track` / `stat-bar-fill` | 3 |

Quatorze cards e doze títulos de card em quatro abas: era literalmente
"tudo é card". Esse número é a evidência objetiva do §2.

### Problemas catalogados

1. Tudo dentro de caixa — hierarquia inexistente por excesso de bordas.
2. `StatsSidebar` exibia **7 atributos internos em percentual**, incluindo
   disciplina, empatia e reputação — violação direta de §5 e §9.
3. Relacionamento exibido como barra percentual.
4. Evento fechava sozinho; consequência comunicada por toast efêmero.
5. Nenhum resumo de ano.
6. Ausência de tokens: cores e espaçamentos repetidos como literais.
7. Emoji 🌱 como identidade visual (header e favicon).
8. `user-scalable=no` no viewport — bloqueio de zoom.
9. Motivo de bloqueio dependente de `title` (invisível no toque).
10. Estilos inline extensos nas telas de criação, morte e estatísticas.

---

## 3. DIREÇÃO VISUAL ADOTADA

Documento próprio: **`docs/B4-VISUAL-DIRECTION.md`**.

Resumo das decisões fixadas:

| Dimensão | Decisão |
| --- | --- |
| Base | Petróleo profundo `#070c0f` → `#0a1116`. Não é preto puro. |
| Acento | **Um só**, escasso: `#3ddc97`. Só CTA principal e "agora" da timeline. |
| Semânticos | `--danger #e4675c`, `--warning #d9a441` — significado, nunca decoração. |
| Profundidade | Iluminação (gradiente radial + vinheta), não borda de card. |
| Tipografia | 7 papéis nomeados; Outfit (display) + Plus Jakarta Sans (texto); pilha local completa como fallback. |
| Superfície | Reservada a unidades reais. Separação padrão = espaço + régua. |
| Retrato | Gradiente derivado do personagem + iniciais + textura CSS. Sem foto, sem IA, sem imagem por evento. |
| Movimento | Curto e discreto; `prefers-reduced-motion` respeitado sem perder informação. |

### Sobre a referência

`docs/references/b4-visual-reference.png` foi usada como **atmosfera**:
densidade, calma, sensação de biografia, peso da idade.

**Nada foi copiado dela.** Não entraram: o personagem (Danilo Nascimento),
a cidade (São Paulo/SP), a idade (18), o ano (2044), o saldo negativo
(−R$ 13.130), os percentuais (100% / 83%), os relacionamentos (Clara,
Fernando, Amigos), o evento "Gabarito da Prova", suas opções, a estrutura
exata das abas ou a contagem de colunas. Há testes automatizados que
falham se qualquer um desses valores aparecer na interface.

---

## 4. MUDANÇAS POR ÁREA

### 4.1 Linha da Vida (§3)

Eixo vertical contínuo com marcadores sobre a linha. Cada entrada traz
idade, ano, tipo e título; o resumo aparece quando o texto do motor é
longo o bastante para ser dividido — **sem inventar conteúdo**.

A diferenciação de tipo é tripla: ícone, marcador e peso tipográfico,
sempre acompanhados do **rótulo em texto**. Nunca só cor. Eventos comuns
são compactos; apenas `.timeline-entry--marco` recebe superfície própria.
Sem imagem por evento.

### 4.2 O evento (§4, §5)

Um único modal, um único fluxo:

```
SITUAÇÃO  →  ESCOLHA  →  RESULTADO  →  CONTINUAR
```

As escolhas são linhas interativas com os quatro estados exigidos
(hover, foco, selecionado, indisponível). Indisponível sempre mostra
**o motivo em texto**, dentro do próprio botão.

Depois da decisão, as opções não escolhidas desaparecem e a escolhida
permanece visível junto do resultado — a pessoa vê o que decidiu. O
resultado **não abre segundo modal** e **não repete a Linha da Vida**.

O resultado separa três coisas:

| Camada | Exemplo | Visível? |
| --- | --- | --- |
| Narrativa | "Vocês revisaram a matéria e você se sentiu mais seguro." | Sim |
| Efeito público | "Inteligência aumentou", "R$ 500", "Relação com a mãe melhorou" | Sim |
| Efeito interno | empatia +2, disciplina +1, reputação, estresse | **Nunca** |

`descreverEfeitosPublicos` é a fronteira: ela recebe as consequências
completas e devolve **apenas** dinheiro, atributos visíveis, saúde,
relação, emprego, doença/cura e novo familiar. `hiddenStats` e
`impactosComportamentais` retornam lista vazia, com teste dedicado.

### 4.3 Identidade (§6, §7)

Nome, idade, cidade e fase da vida. A **idade tem o maior peso
tipográfico da tela** — é o eixo do jogo.

O retrato é composto, não desenhado: gradiente derivado do próprio
personagem, iniciais em tipografia forte e textura sutil. Nenhum arquivo
de imagem, nenhuma geração externa.

### 4.4 Atributos e personalidade (§8, §9)

Os quatro atributos visíveis (Felicidade, Saúde, Inteligência, Aparência)
ficam compactos e secundários, com indicação redundante de direção — não
dependem de cor.

Traços percebidos seguem a filosofia do B2: qualitativos, sem número e
sem medidor. Sem evidência acumulada, o jogo diz **"Personalidade ainda em
formação"**. Um teste verifica que o bloco de traços não contém nenhum
dígito e nenhum `role="meter"`.

### 4.5 Relacionamentos (§10)

Pessoas com nome, parentesco e **proximidade qualitativa** — "muito
próxima", "próxima", "estável", "distante", "conflituosa". Zero
percentual, zero barra. `apresentarRelacionamento` respeita
`kind === 'oculto'`: vínculo que o jogo não expõe continua não exposto.

### 4.6 Finanças (§11)

Modelo do B3 intacto. Visão geral mínima: saldo, renda, patrimônio.
O saldo negativo do mockup não existe — os valores vêm de
`economySystem`. O bloco só aparece quando a fase justifica (15+, ou
antes disso se houver patrimônio real).

### 4.7 Navegação e fases (§12, §13)

As abas vêm **exclusivamente** de `getAbasDisponiveis`; as ações, de
`getActionAvailability`; os blocos laterais, de `obterPerfilDeFase`.
Não existe lista de idades na camada visual.

A UI amadurece em seis passos pequenos — o mesmo produto, não seis sites:

| Fase | Mudança |
| --- | --- |
| 0–2 | Timeline e família apenas |
| 3–5 | Atividades entram |
| 6–11 | Escola entra |
| 12–14 | Traços percebidos começam |
| 15–17 | Dinheiro passa a fazer sentido |
| 18+ | Vida adulta completa |

### 4.8 `+1 ANO` (§14)

Único elemento com preenchimento sólido de acento dentro do jogo.
Posição previsível; no mobile fica ancorado com
`env(safe-area-inset-bottom)`. Quando bloqueado, informa o motivo em
texto ("Responda ao acontecimento deste ano.").

### 4.9 Resumo anual (§15)

Novo. Ligado a `envelhecerAno`, abre apenas quando não há evento
pendente. Filtra ruído de cotidiano e preserva o texto original do motor
— não reescreve narrativa nem inventa drama. Ano sem nada relevante
recebe a resposta honesta: **"Um ano sem grandes acontecimentos."**

### 4.10 Telas fora do jogo

`HomeScreen` passou a abrir com a marca tipográfica **VIDA** e a linha
"Pequenas escolhas, grandes histórias" — emoji removido.
`CharacterCreationScreen`, `DeathScreen` e `StatsScreen` foram migradas de
estilo inline para `screens.css`. O obituário virou uma página editorial
de fecho de biografia.

---

## 5. AUDITORIA DE MODULARIDADE

Arquivos relevantes ao PR.

| Arquivo | Linhas | Responsabilidade | Situação |
| --- | --- | --- | --- |
| `src/App.tsx` | 164 | Composição de telas e overlays | REFATORADO NESTE PR |
| `src/hooks/useGame.ts` | 937 | Orquestração de estado e chamadas de sistema | REFATORADO NESTE PR / OBSERVAR |
| `src/main.tsx` | 10 | Entrypoint | OK |
| `src/styles/index.css` | 27 | Barrel de `@import` — sem regra própria | REFATORADO NESTE PR |
| `src/styles/tokens.css` | 133 | Fonte central de verdade visual | REFATORADO NESTE PR |
| `src/styles/base.css` | 183 | Reset, tipografia, foco, reduced-motion | REFATORADO NESTE PR |
| `src/styles/shell.css` | 281 | Atmosfera, cabeçalho, navegação, regiões | REFATORADO NESTE PR |
| `src/styles/timeline.css` | 243 | Linha da Vida | REFATORADO NESTE PR |
| `src/styles/events.css` | 237 | Evento, escolhas, resultado, modais | REFATORADO NESTE PR |
| `src/styles/character.css` | 485 | Identidade, atributos, traços, relações, finanças | REFATORADO NESTE PR / OBSERVAR |
| `src/styles/controls.css` | 285 | Seções, botões, listas de ação | REFATORADO NESTE PR |
| `src/styles/screens.css` | 245 | Telas fora do jogo ativo | REFATORADO NESTE PR |
| `src/styles/responsive.css` | 218 | Reorganização por breakpoint | REFATORADO NESTE PR |
| `src/presentation/lifeStagePresentation.ts` | 115 | Perfil de exibição por fase da vida | REFATORADO NESTE PR |
| `src/presentation/timelinePresentation.ts` | 121 | Agrupamento e ênfase da timeline | REFATORADO NESTE PR |
| `src/presentation/outcomePresentation.ts` | 181 | Efeitos públicos e resumo anual | REFATORADO NESTE PR |
| `src/presentation/relationshipPresentation.ts` | 87 | Proximidade qualitativa | REFATORADO NESTE PR |
| `src/systems/activitySystem.ts` | 149 | Balanceamento e narrativa de atividades | REFATORADO NESTE PR |
| `src/systems/availabilitySystem.ts` | 476 | Política central de disponibilidade | OK |
| `src/systems/careerSystem.ts` | 442 | Regras de carreira | OK |
| `src/systems/eventSystem.ts` | 413 | Regras de evento | OK |
| `src/systems/economySystem.ts` | 392 | Regras de economia | OK |
| `src/systems/personalitySystem.ts` | 358 | Personalidade e traços | OK |
| `src/systems/educationSystem.ts` | 339 | Regras de educação | OK |
| `src/systems/familySystem.ts` | 326 | Regras de família | OK |
| `src/systems/relationshipSystem.ts` | 292 | Relacionamentos românticos | OK |
| `src/systems/saveSystem.ts` | 277 | Persistência e migração | OK |
| `src/components/shell/GameShell.tsx` | 146 | Moldura do jogo | REFATORADO NESTE PR |
| `src/components/shell/SectionRouter.tsx` | 142 | Roteamento de seção | REFATORADO NESTE PR |
| `src/components/shell/ContextAside.tsx` | 109 | Blocos laterais por fase | REFATORADO NESTE PR |
| `src/components/shell/GameHeader.tsx` | 70 | Cabeçalho | REFATORADO NESTE PR |
| `src/components/shell/PrimaryNavigation.tsx` | 53 | Navegação por seção | REFATORADO NESTE PR |
| `src/components/shell/YearAdvance.tsx` | 51 | CTA `+1 ANO` | REFATORADO NESTE PR |
| `src/components/shell/CharacterRail.tsx` | 43 | Coluna de identidade | REFATORADO NESTE PR |
| `src/components/events/EventExperience.tsx` | 177 | Cena completa do evento | REFATORADO NESTE PR |
| `src/components/events/EventChoice.tsx` | 71 | Uma escolha | REFATORADO NESTE PR |
| `src/components/events/EventResult.tsx` | 61 | Resultado da escolha | REFATORADO NESTE PR |
| `src/components/timeline/LifeTimeline.tsx` | 68 | Eixo da timeline | REFATORADO NESTE PR |
| `src/components/timeline/TimelineEntry.tsx` | 66 | Uma entrada | REFATORADO NESTE PR |
| `src/components/timeline/TimelineSection.tsx` | 40 | Seção Linha da Vida | REFATORADO NESTE PR |
| `src/components/character/CharacterIdentity.tsx` | 132 | Identidade e retrato composto | REFATORADO NESTE PR |
| `src/components/stats/AttributeSummary.tsx` | 83 | Atributos visíveis | REFATORADO NESTE PR |
| `src/components/stats/PersonalitySummary.tsx` | 45 | Traços percebidos | REFATORADO NESTE PR |
| `src/components/relationships/RelationshipSummary.tsx` | 57 | Pessoas em destaque | REFATORADO NESTE PR |
| `src/components/finance/FinanceSummary.tsx` | 59 | Visão geral financeira | REFATORADO NESTE PR |
| `src/components/feedback/AnnualSummary.tsx` | 75 | Resumo do ano | REFATORADO NESTE PR |
| `src/components/career/CareerSection.tsx` | 218 | Vínculo, ações do ano, bicos | REFATORADO NESTE PR |
| `src/components/career/EducationSection.tsx` | 212 | Escola e curso superior | REFATORADO NESTE PR |
| `src/components/common/useModalBehavior.ts` | 84 | Foco, `Esc`, restauração | REFATORADO NESTE PR |
| `src/components/tabs/EconomyTab.tsx` | 303 | Seção de finanças | REFATORADO NESTE PR / OBSERVAR |
| `src/components/tabs/FamilyTab.tsx` | 223 | Seção de relacionamentos | REFATORADO NESTE PR |
| `src/components/tabs/ActivitiesTab.tsx` | 114 | Seção de atividades | REFATORADO NESTE PR |
| `src/components/tabs/CareerTab.tsx` | 66 | Composição de educação + carreira | REFATORADO NESTE PR |
| `src/components/modals/FamilyModal.tsx` | 246 | Interações com um familiar | REFATORADO NESTE PR |
| `src/components/modals/JobMarketModal.tsx` | 108 | Vagas compatíveis | REFATORADO NESTE PR |
| `src/components/modals/AssetShopModal.tsx` | 106 | Loja de bens | REFATORADO NESTE PR |
| `src/components/modals/DatingModal.tsx` | 101 | Candidatos a relacionamento | REFATORADO NESTE PR |
| `src/components/screens/CharacterCreationScreen.tsx` | 161 | Criação de personagem | REFATORADO NESTE PR |
| `src/components/screens/DeathScreen.tsx` | 103 | Obituário | REFATORADO NESTE PR |
| `src/components/screens/StatsScreen.tsx` | 95 | Vidas anteriores | REFATORADO NESTE PR |
| `src/components/screens/HomeScreen.tsx` | 55 | Tela inicial | REFATORADO NESTE PR |

### Notas da auditoria

**`useGame.ts` (937 linhas) — OBSERVAR.** Era o maior risco do PR.
Caiu de 1017 para 937 com a extração de `activitySystem`: ~200 linhas de
`switch` de balanceamento e uma tabela de narrativas que não deveriam
estar em um hook de React.

O que sobrou é majoritariamente **orquestração legítima**: cada callback
valida disponibilidade, chama o sistema correspondente e reconcilia o
estado. São ~25 callbacks curtos e homogêneos, todos delegando a
`systems/`. Fragmentá-los em vários hooks agora produziria arquivos que
só repassam setters — exatamente o extremo oposto advertido no §28.

**Recomendação para um PR futuro** (não feita aqui por estar fora do
escopo): agrupar por domínio em `useCareerActions`, `useEconomyActions`,
`useFamilyActions`, compartilhando um contexto de estado. É uma mudança
de arquitetura de estado, não de UI, e merece PR próprio.

**`character.css` (485) e `EconomyTab.tsx` (303) — OBSERVAR.** Coesos
hoje: `character.css` cobre um domínio visual único (a pessoa e seu
contexto) e `EconomyTab` é uma seção com quatro blocos distintos. Se
crescerem mais, `character.css` se divide em `identity/attributes/relations`
e `EconomyTab` extrai `finance/PropertyList` e `finance/InvestmentList`.

### Arquivos removidos

| Arquivo | Motivo |
| --- | --- |
| `components/layout/Header.tsx` | Substituído por `shell/GameHeader`. Continha o emoji 🌱. |
| `components/layout/StatsSidebar.tsx` | Expunha 7 atributos internos em percentual (§5, §9). Substituído por `CharacterRail` + `ContextAside`. |
| `components/tabs/TimelineTab.tsx` | Substituído por `timeline/TimelineSection`. |
| `components/modals/EventModal.tsx` | Substituído por `events/EventExperience`. |

---

## 6. TESTES

| | Baseline | Depois |
| --- | --- | --- |
| Arquivos | 7 | 10 |
| Testes | 114 | **262** |
| Resultado | 100% | **100%** |

**Os 114 testes do baseline foram preservados sem nenhuma modificação.**
Foram adicionados 148, distribuídos em três arquivos:

| Arquivo | Testes | Foco |
| --- | --- | --- |
| `src/components/__tests__/b4Interface.test.tsx` | 35 | Interface renderizada (jsdom + Testing Library) |
| `src/presentation/__tests__/apresentacaoB4.test.ts` | 28 | Camada de apresentação e save/reload |
| `src/__playtest__/playtestB4.test.tsx` | 85 | Playtest por idade (§35) |

### Cobertura dos 14 pontos do §34

| # | Ponto | Onde |
| --- | --- | --- |
| 1 | Navegação muda com a idade | `b4Interface` · navegação contextual (6 testes) |
| 2 | Bebê não vê sistemas adultos | `b4Interface` · "bebê (0 anos) não vê nenhum sistema adulto" |
| 3 | Painel financeiro não domina a infância | `b4Interface` + `apresentacaoB4` · `deveMostrarFinancasNaVisaoGeral` |
| 4 | `+1 ANO` funciona | `b4Interface` · `+1 ANO` (3 testes) |
| 5 | Fluxo completo do evento | `b4Interface` · situação→escolha→resultado (6 testes) |
| 6 | `ActionOutcome` exibe efeitos corretos | `b4Interface` · efeitos públicos; `apresentacaoB4` · 6 testes |
| 7 | Personalidade não numérica | `b4Interface` · 3 testes (inclui varredura por dígito) |
| 8 | Economia sem dados do mockup | `b4Interface` + `playtest` · ausência de "13.130" |
| 9 | Sem personagem hardcoded | `b4Interface` · ausência de "Danilo"/"Clara"/"Fernando" |
| 10 | Mobile preserva ações essenciais | `b4Interface` · 2 testes; `playtest` · sem largura fixa |
| 11 | Reduced motion preserva informação | `b4Interface` · resultado legível sem animação |
| 12 | Modal acessível | `b4Interface` · 4 testes (`aria-modal`, rótulo, foco, `Esc`) |
| 13 | Resultado não duplica timeline | `b4Interface` · "o resultado não duplica a Linha da Vida" |
| 14 | Save/reload não quebrou | `apresentacaoB4` · 2 testes com `localStorage` real |

### Nota sobre ferramenta

Playwright **não funciona neste sandbox**: o download do Chromium falha e
`--with-deps` não resolve (o mirror do apt está inacessível). A
verificação de interface foi feita com **jsdom + Testing Library**, que
cobre estrutura, acessibilidade, estado e conteúdo — mas **não** cobre
renderização de pixels. A avaliação de aparência foi feita na preview ao
vivo.

---

## 7. PLAYTEST (§35)

`src/__playtest__/playtestB4.test.tsx` renderiza a interface real nas
oito idades exigidas — **0, 5, 10, 15, 17, 18, 25 e 65** — e verifica dez
invariantes em cada uma (80 verificações), mais 5 checagens de seção.

| Verificação | Resultado |
| --- | --- |
| Nome e idade legíveis na primeira tela | 8/8 |
| Cidade e situação coerentes com a fase | 8/8 |
| Só abas autorizadas pela política central | 8/8 |
| Linha da Vida presente com biografia acumulada | 8/8 |
| `+1 ANO` presente e acionável | 8/8 |
| Nenhuma ação impossível para a fase | 8/8 |
| Dinheiro só quando a fase justifica | 8/8 |
| Traços sem números | 8/8 |
| Densidade: não vira mural de cards | 8/8 |
| Sem largura fixa em px (risco de overflow) | 8/8 |

Fluxos verificados: evento sem requisito, evento com requisito não
atendido (bloqueio + motivo), escolha, resultado, compra de bem, mercado
de trabalho, interação familiar, atividade, resumo anual, traços e
finanças.

### Achado corrigido durante o playtest

O teste inicial assumia que finanças só apareceriam a partir dos 16 anos.
A execução mostrou o bloco aos 15 — e o **código estava certo**: aos 15 o
jogador já pode fazer bicos, então dinheiro passa a ser informação útil, e
`obterPerfilDeFase` reflete isso. O teste foi corrigido para acompanhar a
regra real, não o contrário.

### Breakpoints

360, 390, 768, 1366 e 1920 tratados em `responsive.css` com reorganização
real de regiões (a lateral vira rodapé em ≤1180px; coluna única em ≤900px;
`+1 ANO` ancorado). Sem `transform: scale()`. Sem esconder essencial — o
único item ocultado no mobile é a nota poética decorativa
(`.identity__quote`).

---

## 8. ANTES × DEPOIS (§36)

| Aspecto | Antes | Depois |
| --- | --- | --- |
| Unidade visual dominante | Card com borda em quase tudo (14 `.card` + 12 `.card-title` em 4 abas) | Espaço e régua; superfície só em unidade real |
| Atributos internos | 7 barras percentuais visíveis (disciplina, empatia, reputação…) | Nenhum estado interno exposto |
| Personalidade | — | Qualitativa, sem número, "ainda em formação" |
| Relacionamento | Barra percentual | Proximidade em palavras |
| Evento | Fecha sozinho; consequência em toast de 4 s | Cena com resultado no mesmo contexto; escolha permanece visível |
| Resultado | Não havia camada de efeito público | Narrativa / público / interno separados |
| Fim de ano | Nada | Resumo anual, com silêncio honesto quando é o caso |
| Marca | Emoji 🌱 | Tipografia "VIDA" |
| Cor | Vários acentos concorrentes | Um acento escasso + semânticos |
| CSS | 1 arquivo, ~850 linhas, valores mágicos | 9 camadas a partir de tokens |
| Zoom | Bloqueado (`user-scalable=no`) | Liberado |
| Motivo de bloqueio | `title` (invisível no toque) | Texto junto ao controle |

**Ainda parece um dashboard?** Não. O eixo da tela virou uma linha do
tempo vertical com a biografia acumulada; a maior peça tipográfica é a
idade; o único elemento sólido de acento é a ação de avançar no tempo; e
não há grade de métricas competindo por atenção. O que restou de
"painel" — a visão geral financeira de um adulto — é informação que um
adulto de fato tem sobre a própria vida, e só aparece quando a fase
justifica.

---

## 9. BUILD E PERFORMANCE

| Medida | Baseline | Depois | Δ |
| --- | --- | --- | --- |
| Módulos | 1941 | 1963 | +22 |
| CSS | 11,85 kB (gzip 2,89) | 36,18 kB (gzip **6,55**) | +3,66 kB gzip |
| JS | 469,22 kB (gzip 136,15) | 463,66 kB (gzip **136,52**) | −5,56 kB bruto |
| Typecheck | limpo | limpo | — |

O CSS cresceu porque o sistema visual agora é explícito e documentado em
vez de espalhado em estilos inline — e parte disso saiu do JS, que
encolheu. +3,66 kB comprimidos é um custo baixo pela remoção dos estilos
inline e pela existência de tokens.

**Nenhuma biblioteca de UI foi adicionada.** Dependências de runtime
inalteradas (React + lucide-react). As adições foram apenas de
desenvolvimento: `jsdom` e `@testing-library/*`.

Performance: sem blur pesado (o único `backdrop-filter` está na barra
ancorada do mobile), sem animação contínua, sem partículas, sem
`will-change` espalhado.

---

## 10. GAMEPLAY PRESERVADO (§33)

Nenhuma regra de B1/B2/B3 foi alterada. Os contratos de
`availabilitySystem`, `eventSystem`, `careerSystem`, `economySystem`,
`educationSystem`, `familySystem`, `relationshipSystem`,
`personalitySystem`, `agingSystem`, `deathSystem` e `saveSystem`
permanecem intactos — comprovado pelos 114 testes de motor inalterados.

A única mudança que toca comportamento é a do **fluxo do evento**:
`responderEvento` passou a retornar `boolean` e o fechamento do modal
passou a ser explícito (`fecharEvento`), para que o resultado possa ser
lido antes do modal sumir. A avaliação de requisito e a aplicação de
consequências continuam inteiramente em `eventSystem`.

`activitySystem` foi extraído **sem alterar um único valor** de
balanceamento.

### Bugs revelados

Nenhum bug de gameplay foi revelado pelo rework. Os quatro achados foram
de **relatório e de interface**, listados na seção 2.

---

## 11. MICROCOPY (§19)

Corrigido apenas o que estava visualmente exposto e era técnico,
redundante ou placeholder:

| Antes | Depois | Motivo |
| --- | --- | --- |
| "Criar Personagem" | "Quem você vai ser" | Formulário administrativo → momento da vida |
| "Sortear Tudo" (só ícone) | Ação com `aria-label` "Sortear tudo" | Acessibilidade |
| "Primeiro Nome:" / "Gênero:" | "Nome" / "Gênero" | Dois-pontos redundantes em label |
| "Em Memória de" + 🕊️ | "Em memória de" | Emoji removido |
| Título do jogo com 🌱 | "VIDA" + "Pequenas escolhas, grandes histórias" | Identidade tipográfica |
| Botões de resultado sem rótulo | "Continuar" | Ação explícita |

**Nenhum texto narrativo do motor foi reescrito.** Os textos da Linha da
Vida, dos eventos e das consequências são exibidos exatamente como o motor
os produz — há teste verificando isso.

---

## 12. PENDÊNCIAS

| # | Item | Prioridade |
| --- | --- | --- |
| 1 | Agrupar `useGame.ts` (937) em hooks por domínio — mudança de arquitetura de estado, merece PR próprio | Média |
| 2 | Verificação visual automatizada (Playwright/screenshot) indisponível neste sandbox; regressão visual depende de inspeção manual | Média |
| 3 | `docs/PR-B3-REPORT.md` continua ausente | Baixa |
| 4 | `character.css` (485) e `EconomyTab.tsx` (303) em observação; pontos de divisão já definidos | Baixa |
| 5 | Revisão ampla de microcopy narrativo — fora do escopo do §19, que limitou a correção ao visualmente exposto | Baixa |
| 6 | A camada poética existe mas é usada em pouquíssimos lugares; vale avaliar com usuários se merece mais presença | Baixa |

---

## 13. O QUE NÃO FOI FEITO (§38)

Confirmado ausente deste PR: aposentadoria, sistema de moradia nova,
romance adolescente, crime, política, religião, filhos 2.0, dezenas de
eventos novos, carreira 2.0, economia 2.0, empréstimos, avatar por IA,
foto por evento e conquistas novas.

O B4 não adicionou gameplay. Adicionou linguagem visual, a camada de
apresentação e testes.

---

## 14. ARQUIVOS DE APOIO

| Documento | Conteúdo |
| --- | --- |
| `docs/B4-BASELINE.md` | Baseline, discrepâncias e catálogo de problemas visuais |
| `docs/B4-VISUAL-DIRECTION.md` | Direção visual operacional + checklist de aprovação |
| `.arena/skills/SKILL_ENGINEERING.md` | Nova seção "Modularidade: o arquivo que vira depósito" |
| `.arena/skills/SKILL_UX_UI.md` | Nova seção "Identidade: isto é uma vida, não um painel" |
