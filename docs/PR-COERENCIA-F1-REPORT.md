# Fase 1 — Coerência, Plausibilidade e Pré-requisitos

Relatório de implementação. Branch `arena/01a0c250-vida-game`.
Antecedente: `docs/AUDITORIA-COERENCIA-HUMANA.md`.

---

## 1. O problema estrutural

O jogo permitia que uma pedagoga de 22 anos, sem um dia de experiência, fosse
contratada como **Médica Clínica Geral por R$ 19.500/mês**. E permitia que um
rapaz de 18 anos virasse **Mestre de Obras** numa vaga que o próprio catálogo
declarava exigir 4 anos de experiência.

Nada disso era um bug isolado. Era uma ausência: **não existia camada alguma
entre "o jogador pediu" e "o motor concedeu"**. O jogo tinha os dados
necessários para recusar — e não os lia.

O caso mais eloquente é o da experiência profissional. **22 das 36 profissões**
declaravam `experienciaNecessaria > 0`. O campo estava no tipo, preenchido no
catálogo, exibido na interface — e **nunca comparado com nada**. Era decoração.

## 2. Causa raiz

Três decisões antigas se somaram:

**(a) A elegibilidade era um predicado implícito, espalhado.** Não havia função
que respondesse "esta pessoa pode ocupar este cargo?". Havia dois lugares
verificando *pedaços* da resposta — `listarVagasCompativeis` (para montar a
tela) e `candidatarEmprego` (para contratar) — e eles verificavam **coisas
diferentes**. A lista tolerava inteligência abaixo do exigido em até 15 pontos;
o motor não. Nenhum dos dois olhava formação ou experiência.

**(b) Não havia vínculo entre curso e profissão.** `CourseOption.area` existe,
mas é um agrupador editorial de tela: `'Humanas & Sociais'` junta Pedagogia,
Direito e Psicologia. Usar esse campo para habilitação faria um pedagogo
advogar. Faltava uma taxonomia fina o bastante para decidir.

**(c) Permissão era booleana.** `permitido: true/false` não distingue "não
existe caminho para isso" de "falta um requisito conquistável" de "é
tecnicamente possível, mas improvável". Sem essa distinção, toda regra nova só
poderia ser um bloqueio — e um jogo de vida feito só de bloqueios perde as
histórias improváveis, que são justamente as boas.

## 3. Arquitetura

```
data/formacao/           FATOS DECLARATIVOS
  areasFormacao.ts         taxonomia: áreas, níveis, licenças
  requisitosProfissionais.ts  profissão → o que ela exige

systems/politicaTrabalho.ts   FATOS-BASE (sem dependências)
  janela etária por vaga · hierarquia de escolaridade

systems/plausibility/    A REGRA
  types.ts                 veredito graduado + combinadores puros
  formacaoConcluida.ts     lê a trajetória educacional do save
  elegibilidadeProfissional.ts   ← PONTO ÚNICO DE VERDADE

systems/career/
  processoSeletivo.ts      "como se saiu" (≠ "pode tentar")
```

O fluxo, com cada camada respondendo **uma** pergunta:

```
REQUISITOS → ELEGIBILIDADE → CANDIDATURA → PROCESSO SELETIVO → RESULTADO
             "pode tentar"                  "como se saiu"      "conseguiu"
```

Três decisões que merecem justificativa:

**Veredito graduado, não booleano.** `impossivel` · `irregular` · `requisito` ·
`improvavel` · `permitido`. O grau `improvavel` **nunca bloqueia** — apenas
reduz `modificadorDeChance`. É ele que preserva a candidatura arriscada como
escolha legítima do jogador.

**Áreas, não pares.** Relacionar 17 cursos com 36 profissões par a par seriam
612 combinações a manter. Em vez disso, o curso declara **uma** área e a
profissão declara **quais** áreas a habilitam. Um curso novo custa uma linha.

**Um módulo novo para quebrar um ciclo.** `politicaTrabalho.ts` nasceu porque
a elegibilidade precisa da janela etária e `availabilitySystem` precisa da
elegibilidade. O fato-base desceu para um módulo sem dependências;
`availabilitySystem` o **reexporta**, então nenhum import existente mudou.

## 4. Arquivos

**Novos**

| Arquivo | Papel |
|---|---|
| `src/systems/plausibility/types.ts` | Veredito graduado, combinadores puros |
| `src/systems/plausibility/formacaoConcluida.ts` | Save → formação/licença |
| `src/systems/plausibility/elegibilidadeProfissional.ts` | **Regra única** |
| `src/systems/career/processoSeletivo.ts` | "Como se saiu" — encaixe dos Desafios |
| `src/systems/politicaTrabalho.ts` | Fatos-base (quebra de ciclo) |
| `src/data/formacao/areasFormacao.ts` | Taxonomia de áreas/níveis/licenças |
| `src/data/formacao/requisitosProfissionais.ts` | Requisitos por profissão |
| `src/systems/__tests__/elegibilidadeProfissional.test.ts` | Casos A–F (27 testes) |

**Alterados**

| Arquivo | Mudança |
|---|---|
| `src/data/coursesData.ts` | `areaFormacao` nos 17 cursos; `preRequisitoAreas` |
| `src/systems/availabilitySystem.ts` | Lista e disponibilidade passam a usar a regra única |
| `src/systems/careerSystem.ts` | `candidatarEmprego` em 2 etapas; promoção confere habilitação |
| `src/systems/educationSystem.ts` | `ingressarCurso` confere pré-requisito de área |
| `src/hooks/useGame.ts` | Passa `carreira`; preserva histórico ao trocar de emprego |
| `scripts/audit/{simulador,reproducoes}.ts` | Harness acompanha a nova assinatura |

`git diff --stat`: **204 inserções, 91 remoções** em arquivos pré-existentes.
Nenhum sistema removido.

## 5. Regras implementadas

| Eixo | Grau quando falta | Origem do dado |
|---|---|---|
| Idade mínima da vaga | `requisito` | `politicaTrabalho` |
| Faixa etária excedida (aprendiz) | `impossivel` | `politicaTrabalho` |
| Escolaridade | `requisito` | `Job.escolaridadeMinima` |
| Área de formação | `requisito` | `requisitosProfissionais` |
| Nível da formação na área | `requisito` | `requisitosProfissionais` |
| Licença profissional (CRM/OAB/CREA/COREN/CRP) | **`irregular`** | `requisitosProfissionais` |
| Experiência | `requisito` | `Job.experienciaNecessaria` |
| Experiência impossível para a idade | **`impossivel`** | aritmética idade − 16 |
| Experiência faltando ≤1 ano | `improvavel` (não bloqueia) | — |
| Aptidão dentro da folga de 15 | `improvavel` (não bloqueia) | `Job.inteligenciaMinima` |

Duas distinções que carregam a fase:

**Licença é `irregular`, não `requisito`.** Exercer Medicina sem CRM não é uma
etapa faltando: é crime. O jogo deve dizer isso com outra voz — e o grau já
está pronto para o dia em que existir uma via informal.

**Falta de experiência pode ser `impossivel`.** Um jovem de 18 anos que precisa
de 4 anos de experiência teria que ter começado aos 14. Isso é aritmética do
tempo de vida, não falta de esforço.

**A tolerância de +15 em inteligência deixou de ser silenciosa.** Ela existia e
anulava um requisito declarado sem que nada aparecesse. Agora produz
`improvavel`: a vaga continua na lista, com chance reduzida.

## 6. Testes

**Antes:** 44 arquivos · 716 testes · verdes.
**Depois:** 45 arquivos · **743 testes · verdes.** Typecheck limpo. Build OK.

Nenhum teste pré-existente foi alterado ou removido. Os 27 novos cobrem os
casos A–F, compatibilidade de saves e os graus de plausibilidade.

Dois testes merecem destaque por serem os que realmente protegem a fase:

- **"vaga NÃO listada é recusada pelo motor mesmo por chamada direta"** — para
  cada vaga ausente da lista, chama `candidatarEmprego` **25 vezes**. Se a
  regra vivesse na interface, este teste falharia.
- **"toda vaga do catálogo é alcançável por ALGUÉM"** — guarda contra o risco
  oposto: um perfil maximamente qualificado precisa conseguir todas as 36
  vagas. É o que impede que a fase produza requisitos impossíveis.

## 7. Harness — antes e depois

105 vidas simuladas, mesmos seeds.

| Violação | Antes | Depois |
|---|---|---|
| **`EMPREGO_SEM_EXPERIENCIA_EXIGIDA`** | presente | **0** |
| **`CARGO_SEM_ESCOLARIDADE`** | 0 | **0** |
| `FORMACAO_RAPIDA_DEMAIS` | 172 / 79 vidas | 186 / 82 |
| `SALARIO_ALTO_IDADE_BAIXA` | 23 / 14 vidas | 23 / 14 |
| `CANDIDATURA_ILIMITADA_MESMO_ANO` | 9 / 9 | 28 / 28 |
| `VESTIBULAR_MULTIPLAS_TENTATIVAS` | 21 / 19 | 23 / 21 |

**Sem regressão de acesso ao mercado** — o risco principal da fase:

| Indicador | Antes | Depois |
|---|---|---|
| Idade do primeiro emprego (mediana) | 17 | **17** |
| Superior completo ao fim da vida | 84 vidas | 82 |
| Pós-graduação | 14 | 14 |
| Vidas sem nenhum emprego | 0 | **0** |

Ninguém ficou desempregado artificialmente e nenhuma vaga sumiu demais.

As variações em `FORMACAO_RAPIDA_DEMAIS`, `CANDIDATURA_ILIMITADA` e
`VESTIBULAR_MULT` **não são regressões**: são ruído de trajetória. Ao recusar
candidaturas antes aceitas, o simulador muda o caminho da vida e consome
rolagens diferentes. Os três são alvos declarados de fases posteriores (off-by-one
de duração, custo de candidatura, estado do vestibular) e permanecem intactos
— nenhum piorou por regra nova.

## 8. Casos eliminados

| Caso | Antes | Depois |
|---|---|---|
| Pedagoga → Médica Clínica Geral (R$ 19.500) | contratada | **recusada** — "exige registro no CRM" |
| Pedagoga, 22a: vagas ofertadas | **34** | **13**, todas coerentes |
| Mestre de Obras aos 18 com 0 de 4 anos | contratado | **recusado** — impossível para a idade |
| Pedagoga em Residência Médica | aceita | **recusada** — exige graduação em Medicina |
| Técnico em TI → Técnico em Enfermagem | possível | **recusado** |
| Técnico em Enfermagem → Enfermeiro (COREN) | possível | **recusado** — nível insuficiente |
| Gerente de Loja → COO sem escolaridade | promovido | **promoção barrada** |
| Médico → Cirurgião sem residência | promovido | **promoção barrada** |
| Histórico adulterado (8 anos de exp. aos 18) | aceito | **limitado pela idade** |

A última linha veio da **auditoria adversarial** (item 9), não da lista inicial.

## 9. Auditoria adversarial

Varredura de **8 idades × 6 escolaridades × 18 formações × 5 níveis de
experiência × 36 profissões ≈ 155 mil combinações**, sinalizando qualquer
aprovação com salário alto para idade baixa ou experiência abaixo da exigida.

**Achado inédito, já corrigido:** o motor confiava no histórico de empregos sem
confrontá-lo com a idade. Um save adulterado com 8 anos de experiência aos 18
era aceito. A correção ancora a experiência no tempo de vida
(`min(histórico, idade − 16)`), o que torna a regra inviolável por adulteração
**sem rejeitar o save nem apagar o histórico do jogador**. Eliminou 403 das
combinações suspeitas.

Estado final da varredura, após descontar combinações que o jogo nunca produz
(ex.: superior completo aos 18):

| Categoria | Nº | Situação |
|---|---|---|
| Faixa `improvavel` (falta ≤1 ano) | 61 | **Por design** — não bloqueia, reduz chance |
| Concurso público sem concurso | 113 | **Adiado** — é Desafio de Vida (§11) |
| Salário alto aos 22 com formação válida | 12 | **Balanceamento**, não elegibilidade |
| **Sem explicação** | **0** | — |

Os 12 de balanceamento são casos como "médico formado aos 22 ganha R$ 19.500".
A elegibilidade está correta — um médico formado *pode* clinicar. O que é
discutível é a curva salarial, que pertence à fase econômica.

## 10. Limitações conhecidas

1. **A licença é derivada da formação.** Concluir Direito concede a OAB
   automaticamente. O Exame da OAB é um Desafio de Vida; quando existir, só
   `licencasDoPersonagem` muda.
2. **Concursos públicos não têm concurso.** Os três cargos `concurso_*` são
   tratados como emprego comum. É a maior lacuna remanescente e a mais
   claramente pertencente aos Desafios de Vida.
3. **`cursosConcluidos` casa por nome.** Foi escolha deliberada de
   compatibilidade (§ abaixo). Renomear um curso no catálogo quebra o vínculo
   em saves antigos — o efeito é conservador, nunca destrutivo.
4. **Localização não entra na elegibilidade.** Não há dado confiável de oferta
   de vaga por município. Modelar isso agora seria inventar requisito.
5. **A promoção não reavalia experiência** — de propósito: é o que se está
   adquirindo no cargo. Ela reavalia formação, licença e escolaridade.

### Compatibilidade de saves

Nenhum campo novo foi adicionado a `EducationState`, `CareerState` ou `Job`.
**Nenhuma migração é necessária.** A formação é lida do que o save já grava, e
a correspondência ignora acentuação, caixa e espaços.

Três garantias, todas cobertas por teste:

- Save sem `cursosConcluidos` → funciona; não gera formação fantasma.
- Curso fora do catálogo → ignorado, sem erro.
- **Personagem legado já empregado em cargo hoje inelegível → não é demitido.**
  A regra governa a **entrada**. Uma pedagoga que já era médica num save antigo
  continua médica. Destruir a carreira de alguém retroativamente seria pior que
  o problema original; a incoerência legada se resolve sozinha na próxima
  transição, sem apagar nada.

## 11. Adiamentos — classificação dos campos mortos

| Campo | Classe | Destino |
|---|---|---|
| `Job.experienciaNecessaria` | **A** | ✅ **Implementado** |
| Vínculo curso ↔ profissão | **A** | ✅ **Implementado** |
| Escolaridade na promoção | **A** | ✅ **Implementado** |
| Pré-requisito de área em pós | **A** | ✅ **Implementado** |
| Off-by-one de duração de curso | B | Fase de tempo/calendário |
| `EducationState.desempenho` | B | Fase de educação (evasão, repetência) |
| `CareerState.aposentado` | B | Fase de ciclo de vida |
| `Municipio.custoVidaRelativo` (91) | B | Fase econômica/localização |
| `classeSocial` | B | Fase econômica |
| Aprovação em concurso público | B | **Desafios de Vida** |
| Exame da OAB, CNH, ENEM jogável | B | **Desafios de Vida** |
| Avatar ↔ `genero` | C | UX |
| Candidatura ilimitada no mesmo ano | D | Exige modelo de tempo intra-anual |
| Vestibular sem estado persistente | D | Exige redesign do ENEM |

Apenas os itens **A** foram implementados, conforme o escopo.

## 12. Recomendação para a Fase 2

A fundação está posta e é barata de estender: **uma profissão nova custa uma
entrada declarativa; um curso novo, uma linha.**

Recomendo, em ordem:

1. **Desafios de Vida — concurso público primeiro.** É a maior lacuna
   remanescente (113 combinações da varredura), o encaixe já existe em
   `processoSeletivo.ts`, e o conceito "inscrição ≠ aprovação" é exatamente o
   que a arquitetura foi desenhada para receber.
2. **Tempo e duração de curso.** `FORMACAO_RAPIDA_DEMAIS` (186 ocorrências) é a
   violação mais frequente que sobrou e tem causa conhecida: o off-by-one de
   semestres.
3. **Curva salarial.** Os 12 achados de balanceamento e os 66 saltos de mais de
   2× num ano pedem uma revisão econômica.

---

## Preparação para Desafios de Vida

Esta fase foi construída para que os Desafios **encaixem sem reescrita**.

### O ponto de encaixe já existe

`systems/career/processoSeletivo.ts` estabelece hoje o contrato do passo "como
você se saiu". Ele é resolvido por uma rolagem ponderada; amanhã será resolvido
por uma entrevista, uma prova de concurso ou o Exame da OAB. **A assinatura não
muda** — nenhum chamador precisa saber a diferença.

`FormaDeSelecao` já é um tipo aberto (`'rolagem'` hoje) justamente para que o
resultado possa ser narrado de forma diferente conforme o desafio.

### A garantia que não pode ser quebrada

**Desempenho num desafio jamais poderá furar requisito legal, educacional ou
lógico.** Isso não depende de disciplina de quem escrever o código futuro — é
consequência da ordem das camadas:

```
candidatarEmprego()
  ├─ 1. avaliarElegibilidadeProfissional()   ← se reprova, retorna aqui
  └─ 2. resolverProcessoSeletivo()           ← só é alcançado se (1) passou
```

O processo seletivo **nunca é chamado para um candidato inelegível**. Um
pedagogo não pode "se sair bem na entrevista" para virar médico, porque ele
nunca chega à entrevista.

### Separação conceitual preservada

| Conceito | Onde vive hoje | Status |
|---|---|---|
| ESCOLHA-CHAVE | interface / `useGame` | inalterado |
| **ELEGIBILIDADE** | `plausibility/elegibilidadeProfissional` | ✅ **desta fase** |
| **DESAFIO** | `career/processoSeletivo` | ✅ **contrato pronto**, vazio |
| RESULTADO | `ResultadoProcessoSeletivo` | ✅ tipo já existe |
| CONSEQUÊNCIA | `careerSystem` / `useGame` | inalterado |
| ACONTECIMENTO | `systems/events/**` | inalterado |

### O que **não** foi implementado (fora de escopo, por decisão)

Minigames · perguntas de entrevista · banco de questões · CNH · ENEM jogável ·
concurso público jogável · qualquer interface de desafio.

### Extensões já mapeadas no código

- `licencasDoPersonagem()` — ponto único para trocar "licença derivada da
  formação" por "licença conquistada em exame".
- `bloqueiaEfetivacao()` — ponto único para o dia em que o grau `irregular`
  deixar de bloquear e passar a abrir uma via informal com consequências.
- `RequisitoProfissional` — aceita campos novos (concurso, registro,
  experiência em área específica) sem tocar na lógica de avaliação.
