# VIDA — Relatório da sessão autônoma

> Relatórios detalhados por etapa: `docs/PR-B4-FIX4-REPORT.md`.
> Auditoria inicial e matriz de reaproveitamento: `docs/AUDITORIA-SESSAO-AUTONOMA.md`.

## Baseline encontrado

Branch `main`, commit `4e52e55`, validado antes de qualquer alteração:

| | |
| --- | --- |
| `npm test` | 608 testes / 37 arquivos — todos verdes |
| `npm run typecheck` | sem erros |
| `npm run build` | sucesso |
| Catálogo | 99 eventos |

## Auditoria

O diagnóstico central: **o VIDA perguntava mais do que acontecia.**

1. **Todo evento era decisão.** `GameEvent` exige `opcoes`; o motor sempre
   abria modal. Um bebê de 1 ano "decidia" entre rir do próprio reflexo ou
   perder o interesse.
2. **O ritmo era uma porcentagem global.** `rollChance(75)` — um número só,
   igual aos 0 e aos 80 anos.
3. **Todo ano abria pelo menos um modal**, e num ano silencioso ele existia
   só para dizer "Um ano sem grandes acontecimentos".

Mais achados que a auditoria inicial registrou e as etapas confirmaram: o
cabelo cacheado do avatar era uma cadeia de seis arcos circulares; a
interface era um dashboard; a faixa 41-59 era rala.

## Matriz de reaproveitamento

| Sistema | Decisão | O que aconteceu |
| --- | --- | --- |
| `events/eligibility`, `repetitionPolicy`, `contextWeighting` | PRESERVAR | Intocados |
| `events/history` | REAPROVEITAR | Passou a registrar natureza |
| `events/selection.haEventoNesteAno` | SUBSTITUIR | Camada de pacing |
| `GameEvent` | EVOLUIR | Ganhou `natureza`; `opcoes` serve também como leque de desfechos |
| `agingSystem` | CORRIGIR | Consulta o ritmo; resolve acontecimentos |
| `AnnualSummary` | CORRIGIR | Só existe quando há o que dizer |
| `personalitySystem` | PRESERVAR | Conceito emergente mantido |
| `availabilitySystem` | PRESERVAR | Intocado |
| `saveSystem` | EVOLUIR | v4 com migração aditiva |
| `avatarData` (schema) | PRESERVAR | Schema e migração válidos; só ganhou campo opcional |
| `avatarRenderer` + `AvatarFace` | SUBSTITUIR | Geometria primitiva impedia a direção pedida |
| `tokens.css` | EVOLUIR | Base mantida, identidade trocada |
| `attributeSystem`, `economySystem` | CORRIGIR | Mecânicas ausentes implementadas |

## Roadmap decidido e executado

| Etapa | Escopo | Commit |
| --- | --- | --- |
| **A** | Fundação de ritmo | `7c5c126` |
| **B** | Avatar 2.0 | `0d729a6` |
| **C** | Rework visual | `7226a1e` |
| **D** | A vida adulta acontece (conteúdo + correção de ritmo) | `74d9fe6` |
| **E** | Saúde, envelhecimento e economia de vida longa | `426e62e` |

D e E não estavam na sequência sugerida. Ambas foram decididas por
**medição**: a etapa A entregou a camada de ritmo, e medir o resultado dela
revelou que a vida adulta ainda era um questionário (D) e que economia e
envelhecimento tinham mecânicas ausentes que tornavam vidas longas
impossíveis (E).

## Ritmo de vida

Camada nova em `systems/pacing/lifeRhythm.ts`. Decide, antes de qualquer
sorteio de conteúdo: silêncio, acontecimento ou decisão.

| Força | Efeito |
| --- | --- |
| Fatia de decisão por idade | 0 até 2 anos (estrutural); nunca passa de 0,5 em idade nenhuma |
| Densidade estrutural do ano | 2+ acontecimentos próprios → o ano se bastou |
| Fadiga | Fadiga de decisão contada à parte da de acontecimento |
| Secura | Silêncio longo demais volta a ser quebrado |
| Teto duro | Máximo de decisões por janela móvel, que nenhuma rolagem fura |

### Antes e depois, por década (40 vidas simuladas)

| Década | Decisões antes | Decisões depois | Acontec. antes | Acontec. depois |
| --- | --- | --- | --- | --- |
| 20-29 | 3,0 | 1,9 | 1,3 | 2,7 |
| 40-49 | 3,0 | 1,6 | 1,1 | 2,3 |
| 60-69 | 2,7 | 1,7 | 1,2 | 2,3 |

Em todas as décadas a vida agora acontece mais do que pergunta, com ~6 anos
silenciosos por década.

## Eventos

99 → **131 eventos**. Os 99 originais foram auditados um a um: **43 viraram
acontecimento**. Os 32 novos (predominantemente acontecimentos) cobrem a
vida adulta e tardia.

Variedade adulta medida (ids distintos por década, em 40 vidas): **21-24 →
33-41**, no mesmo patamar da infância.

## Personalidade

Preservada como emergente. Duas correções:

- **Um acontecimento nunca move a personalidade.** Quem não escolheu não é
  caracterizado. Garantido em runtime e por auditoria de catálogo.
- **33 das 56 decisões (59%) não declaravam impacto comportamental** —
  quase todas as adultas. Com o ritmo correto a personalidade deixaria de
  emergir por completo. Todas receberam impacto.

Resultado: 3 de 15 vidas têm traço percebido aos 18 (a personalidade não é
forçada cedo); 15 de 15 aos 40.

## Linha da Vida

- Ano silencioso não escreve nada — `gerarTextoAnoTranquilo` removida.
- `LifeLogEntry.relevancia` substitui a heurística de curadoria.
- Categorias `amizade` e `lazer` tiram hobby/esporte/comunidade do rótulo
  genérico "Escolha".
- Visualmente virou a página: idade como número de capítulo em serifa,
  entradas em corpo de leitura, medida de 62 caracteres, rótulo de
  categoria repetido fora da composição (mantido para leitor de tela).

## Avatar

Reconstruído em `presentation/avatar/`. Silhueta com mandíbula, orelha com
hélice, olho amendoado, nariz sugerido, boca com lábios, busto, marcas de
idade graduais, implantação de cabelo real, barba, e rostos de NPC
derivados do id (sem persistência nova). Cacheado virado massa contínua de
raio irregular com textura interna — teste permanente falha se um comando
de arco voltar.

Schema, persistência e opções preservados.

## Rework visual

Serifa editorial para toda a voz narrativa, sans só para mobília; acento do
verde-esmeralda para âmbar terroso; base de tinta quente. Atributos
deixaram de ser barras numeradas. 15 testes transformam as decisões de
identidade em regras.

## Educação / carreira / economia

A economia ganhou fundo: padrão de vida que cede, dívida com juros e teto
de crédito, privação sentida no corpo. `dividas` e `padraoDeVida` eram
campos com interface e sem mecânica — agora estão ligados.

Educação e carreira **não foram aprofundadas** nesta sessão.

## Saúde e envelhecimento

Envelhecer virou trajetória: `calcularResiliencia` modula o desgaste por
condicionamento, estresse e condições acumuladas. Estresse alivia
naturalmente. Curva de mortalidade tardia suavizada.

| Perfil | Morte mediana antes | depois |
| --- | --- | --- |
| Com emprego (típico) | ~80 | **81**, sem dívida |
| Cuidadoso | ~80 | **85**, 10/60 passam dos 90 |
| Passivo | ~80 | **76**, dívida no teto |

## Relações e NPCs

Avanço parcial: toda pessoa da vida ganhou **rosto próprio** derivado do id
estável. Isso muda de verdade a leitura da lista de relações. A
infraestrutura de NPC persistente do B4-FIX3 foi preservada e não foi
aprofundada.

## Atividades

**Não trabalhadas.** Continua a etapa mais óbvia em aberto.

## Bugs encontrados e corrigidos

| # | Bug | Como foi achado |
| --- | --- | --- |
| 1 | **As opções de evento mostravam o desfecho antes da escolha** — o jogador lia "O dono chorou de emoção e te agradeceu" antes de decidir se devolveria a carteira. Eliminava a decisão. | Playtest visual em navegador |
| 2 | 33 de 56 decisões sem impacto comportamental: a personalidade deixaria de emergir | Simulação |
| 3 | Todo resultado de evento entrava na Linha da Vida como `tipo: 'positivo'` fixo, inclusive desfechos negativos | Leitura de código |
| 4 | Todo resultado entrava como categoria genérica "Escolha" | Playtest visual |
| 5 | Saldo podia ficar negativo para sempre: 60/60 vidas em −R$ 848 mil aos 80 | Simulação |
| 6 | `dividas` exibido em duas telas e nunca escrito; `padraoDeVida` lido e nunca alterado | Auditoria de código |
| 7 | Estresse só subia — nada no motor o reduzia | Simulação |
| 8 | 4px de rolagem horizontal em 320px | Auditoria no navegador |
| 9 | Alvo de toque abaixo do mínimo na marca, em telas estreitas | Auditoria no navegador |
| 10 | Opções mortas por idade exibidas em cinza, ocupando o modal | Playtest visual |
| 11 | `diversidadeEntreVidas` contava só decisões, medindo fatia cada vez menor da vida | Suíte quebrando |
| 12 | 7 valores de cor cravados fora de `tokens.css` | Teste de identidade que escrevi |

Também corrigi **dois erros meus**, ambos achados por medição depois de
implementados: tratar "autonomia plena do adulto" como "pergunta quase
sempre" (etapa D) e fazer a dívida capitalizar sem teto, produzindo R$ 10
milhões aos 90 (etapa E).

## Arquitetura

Módulos novos, todos puros e testáveis isoladamente:

```
systems/pacing/lifeRhythm.ts          ritmo do ano
systems/events/happenings.ts          resolução de acontecimentos
systems/events/nature.ts              acontecimento x decisão
systems/events/optionRequirements.ts  extraído de eventSystem (evita ciclo)
presentation/avatar/faceProportions.ts
presentation/avatar/facePaths.ts
presentation/avatar/hairPaths.ts
```

`useGame.ts` continua com ~990 linhas. Não virou god file, mas está no
limite.

## Save e migrações

`VERSAO_SAVE` 3 → **4**. Migração aditiva: ocorrências antigas ganham
`natureza` e `categoria` consultando o catálogo atual, em vez de assumir
cegamente "decisão". `AparenciaAvatar.barba` é opcional e normaliza para
'nenhuma'. Nenhum save é descartado; nenhum campo é perdido.

## Testes

**608 → 716 testes** (37 → 44 arquivos). Arquivos novos:

| Arquivo | Protege |
| --- | --- |
| `systems/pacing/__tests__/lifeRhythm.test.ts` | Autonomia por idade, teto duro, fadiga, secura, saturação |
| `systems/events/__tests__/acontecimentos.test.ts` | Sorteio por peso, remoção da marca de escolha, vida só de acontecimentos não move traço |
| `systems/__tests__/anosTranquilos.test.ts` | Ausência de texto de preenchimento, proporção decisão/acontecimento ponta a ponta |
| `systems/__tests__/vidaLonga.test.ts` | Resiliência, continuidade da curva, teto de dívida, privação |
| `presentation/avatar/__tests__/retrato.test.ts` | Integridade geométrica, envelhecimento contínuo, cacheado sem arcos |
| `styles/__tests__/identidadeEditorial.test.ts` | Serifa no conteúdo, sans na mobília, acento escasso e quente |

Testes recalibrados, cada um com a justificativa registrada no próprio
arquivo: `cicloVida` (0→25 para 0→40), `personalidadeEntreVidas`
(distribuição aos 40 em vez de aos 18), `lifeRhythm` (a afirmação "adultos,
majoritariamente decisões" era a expectativa errada), `coerenciaCatalogo`
(regras por natureza).

## Simulações

Todas com o motor real (`executarPassagemDeAno` + `aplicarConsequenciasEscolha`):

- 15 vidas 0→18 e 0→60 — emergência de personalidade
- 40 vidas 0→80 — ritmo e variedade por década
- 60 vidas 0→105, em quatro perfis — longevidade e economia
- 60 vidas 0→17 — diversidade entre vidas
- 40 vidas × 4 estratégias 0→18 e 0→40 — distribuição de traços

## Verificação visual

**Real, em navegador (Chromium/Playwright).** Capturas de início, criação,
bebê, adolescente, adulto, Linha da Vida de 38 anos, celular; folha de
contato do avatar em todas as combinações; auditoria estrutural em sete
larguras de 320 a 1920.

Referências em `docs/references/`: `avatar-2.0.png`,
`rework-visual-adulto.png`, `rework-visual-mobile.png`.

Ferramentas versionadas em `scripts/playtest/`.

## Resultados finais

```
npm test        716 testes / 44 arquivos — todos verdes   (baseline: 608/37)
npm run typecheck   sem erros
npm run build       sucesso
```

## Branch

`claude/vida-roadmap`, 5 commits a partir de `4e52e55`.
**Nenhum merge na main. Nenhum push. Nenhum histórico reescrito.**

## O que ainda falta

1. **Atividades e agência** — a etapa mais óbvia em aberto. Atividades
   existem mas não conversam com os outros sistemas.
2. **Educação e carreira como trajetórias conectadas.**
3. **NPCs com profundidade** — hoje têm rosto e persistência, mas pouca
   vida própria.
4. **Personalidade influenciando oportunidades** — ela é lida por poucas
   condições de evento.
5. **Telas de morte e de estatísticas** não foram revisadas visualmente.
6. **Faixa 41-59** melhorou, mas segue mais rala que a infância.
7. **Dívida não bloqueia nada** além de aparecer como número e causar
   privação.

## Riscos restantes

| Risco | Observação |
| --- | --- |
| Conteúdo novo não lido em tela | Os 32 eventos foram validados por auditoria estrutural e simulação, não evento a evento numa tela |
| Chegar aos 90 é raro | 2/60 no perfil típico. O conteúdo escrito para 90+ é pouco visto |
| `useGame.ts` no limite | ~990 linhas; a próxima etapa que mexer em comandos deve dividi-lo |
| Bundle > 500 kB | Aviso do build desde antes da sessão; não tratado |
| Um commit com artefato de codificação | `74d9fe6` tem "eleg��veis" na mensagem. Não corrigido porque exigiria reescrever histórico, o que está vedado |

## Roteiro de playtest humano

### 1. Ritmo (o mais importante)
1. Crie uma vida e avance de 0 a 10 anos **sem parar**. A maioria dos anos
   deve passar sem modal nenhum, e **nada** deve ser perguntado ao bebê.
2. Avance até os 40. As decisões devem aparecer espaçadas; os anos entre
   elas não devem parecer vazios.
3. Confirme que um ano com formatura ou emprego novo **não** abre um evento
   sorteado por cima.

### 2. Decisão
4. Ao abrir uma decisão, confirme que **nenhuma opção revela o desfecho**
   antes de você escolher.
5. Confirme que não há opções cinzentas inúteis dizendo "não é mais
   compatível com sua idade".

### 3. Linha da Vida
6. Aos 40, leia a Linha da Vida de cima a baixo. Ela deve ler como uma
   biografia, não como um log. Procure: linhas repetidas, entradas sem
   sentido, ruído.

### 4. Avatar
7. Na criação, percorra os seis cabelos, cinco tons de pele e quatro
   opções de barba. Olhe o **cacheado** com atenção: ele não pode parecer
   bolinhas coladas.
8. Compare o retrato aos 5, 20, 50 e 80 anos. Deve parecer a mesma pessoa
   envelhecendo.

### 5. Identidade visual
9. A sensação deve ser "estou acompanhando a história de uma pessoa", não
   "estou administrando um painel". Se não for, o alvo não foi atingido.

### 6. Responsividade
10. Abra no celular. Confirme: sem rolagem lateral, `+1 ANO` sempre ao
    alcance, texto legível, modais utilizáveis.

### 7. Vida longa
11. Jogue uma vida **pegando um emprego** e outra **sem nunca trabalhar**.
    A segunda deve endividar-se, cair de padrão de vida e sentir o aperto.
12. Jogue uma vida **fazendo atividades físicas todo ano**. Ela deve viver
    perceptivelmente mais.

### 8. Save
13. Se tiver um save de antes desta sessão, carregue-o. Nada pode se perder.
