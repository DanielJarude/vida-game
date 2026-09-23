# VIDA — Relatório da Reconstrução

Branch: `claude/vida-rebuild` (a partir de `arena/01a0c250-vida-game` @ `48d9d39`).
Documento vivo: atualizado durante a sessão.

---

## 1. Baseline (antes de qualquer alteração)

| Verificação | Resultado |
| --- | --- |
| Árvore | limpa, `48d9d39` |
| `npm test` (Node 22) | 61 arquivos, **1020 testes verdes** |
| `npm test` (Node 20) | 49 arquivos passam; **12 suítes com jsdom não iniciam** (`undici`/`jsdom` exigem Node ≥ 22) |
| `npm run typecheck` | verde |
| `npm run build` | verde (bundle JS 628 kB, aviso de chunk > 500 kB) |

→ Adicionado `.nvmrc` (22) e `engines` no `package.json`.

### Métricas do harness existente (105 vidas, 7 perfis, `scripts/audit/rodar.ts`)

| Métrica | Valor |
| --- | --- |
| Saldo mediano aos 60 anos | **R$ 7.969.951** (riqueza automática) |
| Vidas com superior completo | 97/105 (+7 pós) |
| Vidas que mudaram de cidade | **0/105** (não existe mudança) |
| Trabalhando depois dos 70 sem aposentadoria | 71/105 vidas |
| Namoro criado instantaneamente em "relacionamento 85" | 103/105 vidas |
| Técnico Judiciário R$ 7.500 aos 19-20 anos | 19/105 vidas |
| Anos silenciosos (sem nada na biografia) | ~60% dos anos adultos |
| Longevidade | mín 54 · mediana 74 · máx 100 |

## 2. Diagnóstico

Leitura de código (não dos relatórios antigos) + simulação + playtest visual.

### 2.1 O problema estrutural

VIDA hoje é **um sorteador de eventos com sistemas ao redor**, e não um
**modelo de vida do qual acontecimentos emergem**. A vida de uma pessoa é
determinada por onde ela mora, com quem ela convive, o que ela faz o dia todo,
quanto entra e sai de dinheiro e em que processos longos ela está metida
(curso, namoro, gestação, emprego). No VIDA atual:

- **Pessoas** são uma lista `familia: FamilyMember[]` com um número
  `relacionamento`. Parceiros vêm de uma "loja" de 3 candidatos gerados na hora;
  namoro nasce em 85, casamento é um clique acima de 65, filho é outro clique
  (nasce instantaneamente, sem gestação). Eventos quase nunca citam pessoas
  reais — falam de "uma criança", "seu amigo", "a vovó" que nunca existiram.
- **Lugar** é um rótulo. `custoVidaRelativo` existe no dado e não é consumido;
  ninguém muda de cidade; qualquer curso presencial existe em Rio Branco.
- **Dinheiro** não tem origem nem destino: despesa fixa de R$ 14 mil/ano para
  adultos (a mesma para solteiro na casa dos pais e para casal com dois filhos,
  casa e carro), salário bruto integral, criança com saldo próprio que não
  pertence a casa nenhuma. Resultado: mediana de R$ 8 milhões aos 60.
- **Tempo** é anual com remendos semestrais: curso tem duração, mas gestação,
  namoro, candidatura, mudança e tratamento não existem como processo.
- **Carreira**: plausibilidade profissional (F1) é boa, mas a progressão é
  `progressaoPara` linear e estranha (Jovem Aprendiz → Auxiliar Administrativo
  por 6 anos; Garçom → Gerente Comercial), sem aposentadoria.
- **Narrativa**: o texto é escrito no masculino fixo ("orgulhoso", "tranquilo")
  ou com "(a)" ("promovido(a)"), independente do gênero do personagem.

### 2.2 Agência implícita (problema do playtest)

O motor atual resolve "acontecimentos" sorteando entre `opcoes` — as mesmas
estruturas que antes eram botões de decisão. Por isso muitos desfechos
sorteados descrevem **como o personagem escolheu agir**: "Você encarou o
monstro", "nem olhou para trás e foi brincar", "a diplomacia venceu",
"você dançou a quadrilha com muita alegria". As pequenas memórias anuais
fazem o mesmo em forma de enchimento ("Um ano de conversa longa com os
amigos, do jeito certo"). Auditoria completa na seção 4.

### 2.3 Complexidade acidental

- `types/index.ts` tem ~920 linhas, metade delas comentários de arqueologia
  (B2, B4-FIX1..4, F1..F6) explicando por que um campo opcional existe.
- `executarPassagemDeAno` recebe 10 parâmetros posicionais, 6 deles opcionais
  "para não quebrar chamadas existentes".
- `useGame.ts` (1064 linhas) mantém 15 `useState` independentes e contém regra
  de jogo (efeito de atividade, troca de emprego, histórico).
- RNG global mutável (`definirFonteAleatoria`) e `generateId` com
  `Date.now()` + `Math.random()`: vidas não são reproduzíveis por semente.
- Quatro funções booleanas sobre taxonomia (`permiteEscolha`,
  `movePersonalidade`, `consomeCota`, `interrompe`, `permiteComposicao`) para
  compensar um modelo de conteúdo em que acontecimento e decisão têm a mesma
  forma.

## 3. Classificação dos sistemas

| Sistema | Veredito | Por quê |
| --- | --- | --- |
| Direção visual editorial (tokens, tipografia serif, âmbar, tinta quente) | **MANTER + REFINAR** | É a melhor parte da UI; problemas pontuais (nav cortada no mobile, cards demais). |
| Plausibilidade graduada (`Veredito`, graus) | **MANTER + REFINAR** | Conceito certo; ampliar graus (ilegal × irregular × improvável × raro). |
| Requisitos profissionais / áreas de formação (dados F1) | **MANTER** (portar) | Dado correto e com fundamento legal. |
| Municípios / estados (27 UFs) | **MANTER + REFINAR** | Acrescentar perfil urbano e oferta (universidade, mercado). |
| Nomes brasileiros | **MANTER** | |
| Personalidade emergente (traços assinados + evidências) | **MANTER + REFINAR** | Bom modelo; só decisões comportamentais movem traço (já era a regra). Precisa ter efeito no mundo (compatibilidade com pessoas). |
| Ritmo (silêncio × acontecimento × decisão, teto e fadiga) | **REFAZER INTERNAMENTE** | Ideia boa; mas o ano deve ser preenchido primeiro pela vida sistêmica (pessoas, processos), eventos são tempero. |
| Motor anual (`agingSystem`) | **SUBSTITUIR** | Pipeline novo sobre um estado único, RNG por semente, processos com duração. |
| Estado + hook (`types`, `useGame`) | **SUBSTITUIR** | Estado único `Vida`, comandos puros `(vida, acao) → vida`, hook fino. |
| Relações (`familySystem`, `relationshipSystem`, `redeSocial`) | **SUBSTITUIR** | Pessoas persistentes com vínculo, origem, convivência, compatibilidade, estágios de amizade e romance. |
| Gravidez / filhos | **SUBSTITUIR** | Hoje não existe gestação. Processo com concepção, descoberta, gestação, parto, adoção. |
| Educação | **REFAZER INTERNAMENTE** | Base existe; falta localidade, ENEM/SISU/ProUni/FIES, EAD, cursinho, escola pública/privada por classe, bloqueio de refazer curso. |
| Carreira | **REFAZER INTERNAMENTE** | Trilhas com níveis, processo seletivo, desemprego, informalidade, aposentadoria. |
| Economia / patrimônio | **SUBSTITUIR** | Orçamento do domicílio com renda líquida, custos por pessoa/casa/carro/cidade, dívidas com juros reais, financiamento. |
| Catálogo de eventos | **REFAZER** | Separar estruturalmente ACONTECIMENTO (mundo) de DECISÃO (jogador); eventos referenciam pessoas reais; reescrever os textos com agência implícita; concordância de gênero. |
| Pequenas memórias | **REMOVER** | Enchimento anual que inventa comportamento; substituído por acontecimentos com pessoas reais e pela "situação atual" visível na UI. |
| Calendário de marcos | **MANTER a ideia, REFAZER** | Marcos garantidos são certos; viram parte do pipeline de desenvolvimento. |
| Avatar SVG | **SUBSTITUIR** | Bebê parece adulto careca; proporções por idade inexistentes. |
| Save v5 | **SUBSTITUIR com migração** | v6 com migração de melhor esforço e validação. |
| Harness de auditoria | **REFAZER** | Novo simulador sobre o motor novo, com estratégias de jogador. |

## 4. Auditoria de agência implícita

Relatório completo, evento por evento: `docs/AUDITORIA-AGENCIA-IMPLICITA.md`.

Catálogo antigo: 134 eventos, 289 opções; 73 "acontecimentos" resolvidos pelo
dado com 149 desfechos possíveis.

| | |
| --- | --- |
| Desfechos sorteados que decidem como o personagem agiu | **97 / 149 (65%)** |
| Limítrofes | 27 |
| Corretos | 25 |

| Faixa | Violações |
| --- | --- |
| 0–2 | 1/16 (reações involuntárias de bebê são aceitáveis) |
| 3–5 | **12/12** |
| 6–11 | 16/18 |
| 12–17 | 17/22 |
| 18+ | 51/81 |

Categorias: comportamento decidido (77), preferência (21), emoção/reação (18),
valor (14), pessoa inventada (10 — "a vovó" num jogo sem avós), passado
inventado (10), concordância de gênero (21).

**Causa raiz: estrutura, não redação.** ~30 "acontecimentos" são decisões
antigas cujas opções nunca foram reescritas (`opt_encarar_armario`,
`opt_conversar_calmo`). O dado também aplica as consequências dessas escolhas
fantasmas: cobra R$ 350 do Carnaval, R$ 1.800 da excursão, tira 20 de relação
por "bateu boca", cria NPC de paixão sempre masculino (`genero` padrão
`'masculino'` em `eventSystem.ts:279`, decidindo orientação).

**Decisão:** o formato novo separa estruturalmente ACONTECIMENTO (função que
narra o mundo e só aplica efeitos do mundo) de DECISÃO (opções do jogador).
Um acontecimento não tem opções para sortear. O conteúdo é reescrito, não
migrado; o antigo serve de referência temática. Um teste de catálogo proíbe
padrões de agência em textos de acontecimento.

## 5. Plano de reconstrução

Ordem guiada por dependência:

1. **Fundação do motor** (`src/motor/`): RNG por semente persistido, tempo em
   meses absolutos, estado único `Vida`, texto com concordância de gênero.
2. **Mundo**: lugares com perfil urbano e oferta; família de origem coerente
   com classe; pessoas e vínculos.
3. **Pipeline do ano**: corpo/saúde, desenvolvimento, escola, trabalho,
   domicílio/finanças, pessoas, processos, acontecimentos, decisões, biografia.
4. **Relações**: convivência → conhecido → colega → amigo → amigo próximo;
   interesse → encontros → namoro → união; distância e conflito.
5. **Família**: gestação e adoção como processos; filhos como pessoas.
6. **Educação e lugar**: escola, ENEM, ingresso, cursos locais/EAD, mudança.
7. **Trabalho**: trilhas, níveis, seleção, desemprego, aposentadoria.
8. **Dinheiro e patrimônio**: orçamento, dívidas, carro, imóvel, financiamento.
9. **Conteúdo**: catálogo novo, auditado por agência.
10. **Comandos e disponibilidade** (graus de plausibilidade).
11. **Simulação com estratégias** e balanceamento.
12. **UI sobre o motor novo**, avatar novo, mobile.
13. **Save v6** + migração; remoção do código antigo.

## 6. Progresso

| Etapa | Estado | Commit |
| --- | --- | --- |
| Baseline, diagnóstico, auditoria de agência | feito | `docs: baseline...` |
| Motor novo (`src/motor`) + simulador por estratégia | feito | `e41d20d` |
| Testes de contrato do motor, recalibração saúde/economia | feito | — |
| Save v6 + migração v5 testada com saves reais | feito | — |
| Interface nova, retrato refeito, remoção do código antigo | feito | `5170588` |

## 7. Arquitetura depois

```
src/
  motor/                 regras puras, sem React
    tipos.ts             o modelo: uma Vida (JSON puro)
    rng.ts               gerador por semente, estado salvo na vida
    nucleo.ts            transação, consultas, escrita na biografia
    criacao.ts           nascer: família de origem coerente com classe e lugar
    ano.ts               um ano: sistemas → morte → conteúdo (marcos, estado, mundo)
    acoes.ts             comandos do jogador com disponibilidade graduada
    plausibilidade.ts    impossível / incompatível / ilegal / requisito / irregular / improvável / permitido
    pessoas.ts           pessoas, vínculos, visual herdado
    personalidade.ts     traços só por escolhas comportamentais e rotinas mantidas
    save.ts              v6, validação, backup, migração v5→v6, estatísticas
    dados/               lugares (perfil urbano × região), cursos, ocupações, bens, nomes por geração
    sistemas/            corpo, escola, trabalho, renda, dinheiro, domicílio, moradia,
                         social, romance, família (gestação), rotinas, processos
    conteudo/            base (acontecimento × decisão), papéis, catálogo por fase,
                         sistêmicos (disparados por estado), desafios (entrevista)
  ui/                    React fino sobre o motor
    useVida.ts           o único estado: a vida; toda mudança passa pelo motor
    telas/ jogo/ avatar/ comum.tsx apresentar.ts vida.css tokens.css
scripts/
  sim/                   simulador com 10 estratégias de jogador (métricas + biografias)
  playtest/              jogar.mjs (navegador, 3 larguras), retratos.tsx, foto.mjs
  itch/                  empacotamento e smoke do pacote
```

## 8. Métricas antes × depois

Motor antigo: `scripts/audit` (105 vidas, 7 perfis). Motor novo: `scripts/sim`
(150 vidas, 10 estratégias). Os instrumentos diferem; as grandezas são comparáveis.

| Métrica | Antes | Depois |
| --- | --- | --- |
| Patrimônio mediano aos 60 | R$ 7,97 mi (todas as vidas) | de R$ 1,6 mil (passivo) a R$ 12,4 mi (poupador que ascende) — depende do jeito de viver |
| Quem não trabalha acumula | sim (riqueza automática) | não: passivo termina com mediana de R$ 56 mil |
| Mudou de cidade | 0/105 | 0–75% conforme a estratégia (proposta de trabalho, estudo, cônjuge, escolha) |
| Namoro instantâneo em "85" | 103/105 | inexistente: interesse → saindo → namoro → morar junto → casamento, com recusa possível |
| Filho instantâneo | sim | gestação com concepção, descoberta, 9 meses, aborto espontâneo possível, nome escolhido |
| Aposentadoria | não existia | INSS por idade e contribuição, BPC para quem não contribuiu |
| Desfechos sorteados decidindo comportamento | 97/149 (65%) | 0 (estrutural: acontecimento não tem opções) + teste de linguagem |
| Texto no masculino fixo / "(a)" | 21 ocorrências | 0 (teste), com tratamento escolhido por pessoas não binárias |
| Repetição de texto por vida | alta, não medida | 9,4 por vida (a maioria rebaixada a cotidiano/técnico) |
| Longevidade (mediana) | 74 | 73, variando com o jeito de viver: impulsivo 64, poupador 87 |
| Vidas que chegam aos 18 sem decisão | 0% | 0% |
| Anos sem nenhuma linha (30–44) | ~61% | 10% |

## 9. Decisões de design

- **Acontecimento × decisão é estrutura, não rótulo.** Acontecimento é uma
  função que narra o mundo e aplica efeitos do mundo; decisão tem opções do
  jogador. Reação de criança ou adulto que importa vira decisão.
- **Personalidade só por escolha comportamental e rotina mantida por anos.**
  Escolha biográfica (primeira palavra, nome do filho, padrinho) não move nada.
  Personalidade tem efeito: compatibilidade com pessoas, chances em entrevista,
  romance, vício.
- **Pessoas antes de eventos.** O ano é preenchido primeiro por sistemas (escola,
  trabalho, casa, pessoas, processos); conteúdo usa papéis ligados a pessoas
  reais. Chefe novo, vizinho novo, companheiro de excursão viram pessoas.
- **Dinheiro é do domicílio.** O orçamento é derivado de quem mora junto, da
  casa, do carro, dos filhos, da cidade. Quem não tem, corta o supérfluo antes
  de se endividar; cartão sem pagamento suja o nome; dívida caduca em 5 anos;
  despejo existe.
- **Lugar por perfil urbano × região**, não por lista de cursos: Medicina
  presencial não existe em cidade pequena; EAD existe em qualquer lugar;
  região metropolitana acessa a oferta da metrópole.
- **Plausibilidade graduada**: impossível, incompatível, ilegal, requisito,
  irregular, improvável, permitido. Criança vendendo doce na rua é irregular
  e o Conselho Tutelar pode aparecer.
- **Reais constantes**: sem inflação no jogo; mobilidade vem de trajetória.
- **Silêncio permitido**, mas a repetição de algo comum é rebaixada a cotidiano.

Antes: 50.500 linhas, 15 `useState`, motor anual com 10 parâmetros posicionais,
RNG global, 134 eventos (65% dos desfechos sorteados decidindo comportamento).
Depois: estado único serializável, comandos puros, RNG por semente
(mesma semente + mesmos comandos = mesma vida, testado).
