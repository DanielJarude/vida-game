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
| Qualidade de texto, chefe como pessoa, calibração de saúde | feito | `7cb53ab`, `b871ec3` |
| Conteúdo de cônjuge/filhos/amigos, hábitos, maturidade | feito | `53589c7`, `01f1501` |
| Economia: despejo, nome sujo, caducar, quitar limpa o nome, efeito riqueza | feito | `c414a8b`, `f667f75`, `04b9a59` |
| Relações: envolvimento com reversão à média, crises, um relacionamento sério por vez | feito | `6dfcea9` |
| Mundo: recessões com consequência, conteúdo regional, testes de consequência | feito | `73be898` |
| Linha da Vida em capítulos; testes de interface determinísticos | feito | `8d68221`, `91b757f` |
| Negociação salarial como desafio; "Perto de você" no celular | feito | `338fa97` |
| Faculdade: aperto vira decisão, destrancar, cancelamento após 4 anos, condições de estudo em casa | feito | `094614f` |
| Variedade de texto (recessão pela situação de cada um etc.); obituário | feito | `c1b21e0`, `3933b39` |

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
| Repetição de texto por vida | alta, não medida | 9,2 por vida (a maioria rebaixada a cotidiano/técnico) |
| Longevidade (mediana) | 74 | 74 (p10 59, p90 85), variando com o jeito de viver: impulsivo 67, ambicioso 85 |
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

## 10. Simulação (estado atual)

`npx esbuild scripts/sim/simular.ts --bundle --platform=node --outfile=/tmp/sim.cjs && VIDAS=20 SAIDA=/tmp/sim node /tmp/sim.cjs`
— 200 vidas, 10 estratégias × 20 sementes. Última rodada:

| faixa | linhas/ano | marcos/ano | anos sem nada | anos com decisão |
| --- | --- | --- | --- | --- |
| 0–2 | 1,17 | 1,06 | 0% | 50% |
| 3–5 | 0,54 | 0,07 | 16% | 11% |
| 6–11 | 1,54 | 0,26 | 4% | 30% |
| 12–14 | 1,33 | 0,11 | 6% | 50% |
| 15–17 | 1,85 | 0,32 | 2% | 59% |
| 18–29 | 2,18 | 1,00 | 2% | 65% |
| 30–44 | 1,05 | 0,39 | 9% | 49% |
| 45–59 | 0,90 | 0,26 | 12% | 46% |
| 60+ | 1,27 | 0,44 | 9% | 39% |

- Violações de coerência (romance adulto-menor, emprego sem requisito, filho
  sem gestação, pessoa morta agindo, etc.): **nenhuma**.
- Separações: 14–16 de ~110 vidas que moraram junto (≈13%); divórcios 7–8.
- Patrimônio final mediano: passivo R$ 23 mil, gastador R$ 0, social R$ 425 mil,
  familiar R$ 1,7 mi, poupador que ascende R$ 12,9 mi.
- Classe de origem × formatura: quem vem de família vulnerável forma mais tarde
  e mais por cota/ProUni/EAD; família alta usa mais a pública presencial (a
  vantagem vem da escola particular: +6 de desempenho e +40 no ENEM) e das
  condições de estudo em casa (−7 a +5 de desempenho conforme renda per capita).
- Estratégias determinadas quase sempre concluem o curso: o sistema pressiona
  (decisão "O curso pesa" dispara ~30 vezes em 200 vidas), mas quem escolhe
  seguir é o jogador.

## 11. Bugs encontrados e corrigidos (seleção)

| Bug | Causa | Correção |
| --- | --- | --- |
| Espiral de morte por saúde / longevidade baixa | deriva e penalidades de condições altas demais | recalibração, Gompertz, riscos por hábito |
| Dívida de cartão explodindo para milhões | juros compostos sem fim | nome sujo após 1 ano sem pagamento, mora de 1%, caducar em 5 anos |
| Riqueza automática | renda sem gastos de domicílio | orçamento do domicílio, lifestyle creep, efeito riqueza |
| Bebê sem nome | conteúdo "uma vez na vida" | `repetir: 0` + prioridade 10 |
| Homônimos (duas "Marias" próximas) | sorteio sem checagem | nomes checados contra vínculos relevantes |
| Dois relacionamentos sérios ao mesmo tempo | pedido de namoro sem checar parceria | bloqueio com motivo |
| Curso trancado para sempre | não existia destrancar | ação `destrancar` + cancelamento após 4 anos |
| Nome do curso cru ("eng civil") | `conteudoCurso` usava o id | nome do catálogo |
| "Mora sozinha, numa república" | texto não distinguia república | frase própria |
| Obituário com "sua filha" e primos antes dos filhos | rótulo em 2ª pessoa, ordem por proximidade | rótulo neutro, família próxima primeiro |
| Concordância: "agarradoa", "em a escola", "por a escola" | concatenação de texto | `em()`, `flex()` |
| Import circular rotinas → conteúdo | personalidade dentro de conteúdo | `personalidade.ts` e `emRecessao` no núcleo |

## 12. Testes

39 testes (Vitest, Node 22): 22 de contrato do motor, 4 de consequência
econômica/mundo, 8 de save/migração, 5 de interface (jsdom, `Math.random`
fixado). Todos passam.

Falhas encontradas durante a sessão e como foram classificadas:

| Teste | Classificação | Ação |
| --- | --- | --- |
| ocupação de pais adolescentes | bug do teste (procurava ocupação por substring) | teste corrigido |
| linguagem de agência (timeout) | estatisticamente frágil/lento | menos vidas, 60 s |
| regex de gênero pegando outras pessoas | bug do teste | regex restrita a frases sem sujeito |
| riqueza automática com herança | contrato obsoleto | fixa classe vulnerável (sem herança) |
| interface com semente aleatória | frágil | `Math.random` com semente |
| ficha da mãe (após "Perto de você" no celular) | bug do teste (seletor ambíguo) | busca dentro de `main` |

Nenhum teste foi afrouxado para passar uma regressão real.

## 13. Saves

- `VIDA_GAME_SAVE_V1` agora guarda o formato v6 (validado campo a campo).
- Save inválido não trava: vai para backup e a tela inicial oferece nova vida.
- Migração v5 → v6 testada com dois saves reais gerados pelo motor antigo
  (criança e adulta): identidade, família, escola, emprego, dinheiro,
  personalidade e Linha da Vida preservados.
- Campos novos desta etapa (`tTrancou`, rota do curso concluído) são opcionais:
  saves v6 anteriores continuam válidos sem migração.

## 14. Mobile

- Playtest automatizado em 1440, 390 e 320 px (`scripts/playtest/jogar.mjs`):
  nenhum controle essencial fora da tela, nenhum dependente de hover, sem
  rolagem horizontal. "Perto de você" agora aparece no celular (grade que
  quebra linha, sem rolagem lateral).
- `viver.mjs` joga uma vida inteira a 390 px tomando decisões e tirando fotos
  (momentos, casa, curso, entrevista, obituário) — sem erros de console.

## 15. Limitações conhecidas

- **Separação/divórcio abaixo do real** (≈13% de quem morou junto, contra ~30–40%
  no Brasil ao longo da vida). O modelo existe; falta calibrar desgaste.
- **Poupadores extremos acumulam muito** (mediana R$ 10–13 mi): é consequência
  de poupar ~70% da renda por 40 anos com rendimento real de 3%; o estilo
  "apertado" talvez gaste pouco demais para uma família com filhos.
- **Faixa 3–5 anos** tem 16% de anos sem nenhuma linha (aceito: fase de pouca
  memória), mas poderia ter mais conteúdo cotidiano.
- **Filhos do jogador** têm escola e idade, mas não trajetória educacional e
  profissional própria tão rica quanto a do personagem.
- **Estratégias do simulador** são jogadores determinados; não medem a evasão
  "natural" de um jogador que responde ao acaso.
- **Sem inflação** (reais constantes, por decisão de design).

## 16. Dívida técnica

- `acoes.ts` concentra disponibilidade e execução de ~40 comandos num switch
  grande; dá para separar por domínio (pessoa, estudo, trabalho, casa).
- `vida.css` é um arquivo único grande; os tokens estão separados, mas os
  componentes não.
- O teste de linguagem de agência varre textos por regex; conteúdos com papéis
  só são cobertos pela simulação.
- `scripts/itch/smoke.mjs` usa esbuild ad hoc; poderia reutilizar o build do Vite.

## 17. Próximos passos executáveis

1. Calibrar desgaste do romance (`src/motor/sistemas/romance.ts`): meta de
   25–35% de separações entre quem morou junto; conferir com o simulador.
2. Estilo "apertado" com filhos: piso de despesa por dependente em
   `despesasMensais` (`src/motor/sistemas/dinheiro.ts`).
3. Trajetória dos filhos: ENEM/curso/emprego simplificados para `Pessoa`
   filho adulto, com eventos de formatura e primeiro emprego já existentes.
4. Conteúdo cotidiano para 3–5 anos (`src/motor/conteudo/primeiros.ts`).
5. Separar `acoes.ts` por domínio mantendo a mesma interface `executar`.
6. Teste de interface para a negociação e para destrancar curso.
