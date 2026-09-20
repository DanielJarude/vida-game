# PR B4-FIX.1 — Localização, avatar, clareza, pets e variedade de eventos

Correções derivadas do playtest humano feito após o B4-FIX. Base: commit
`7873306`. Identidade visual do B4 preservada; nenhuma volta à interface
antiga baseada em cards.

**Resultado em números:** 509 testes passando (361 preservados + 148 novos),
`tsc` limpo, build OK. Pool de eventos aos 3 anos passou de **0 para 9**.
Repetição máxima do mesmo evento numa vida caiu de **3 para 1**.

---

## 1. Problemas do playtest

| # | Relato | Confirmado? | Causa real |
|---|---|---|---|
| 1 | Faltam estados na criação | Sim | Só existiam **19 UFs**. Faltavam AC, AP, MA, PI, RO, RR, SE, TO |
| 2 | Mesmo evento se repetindo | Sim | Pool infantil minúsculo + ausência total de cooldown |
| 3 | Criança de 3 anos no celular | Parcial | O evento existe e a opção é inadequada, mas só a partir dos 5 anos |
| 4 | Pet recebe interações humanas | Sim | `pet` era só um valor de `RelationType`, sem fronteira de entidade |
| 5 | Texto cortado | Sim | `ellipsis + nowrap` em campos essenciais |
| 6 | "AC"/"GG" como retrato | Sim | Identidade usava iniciais, sem avatar |
| 7 | +1 ANO some na timeline longa | Sim | CTA renderizado **depois** de toda a biografia |

### Divergência registrada

O relato dizia "Tarde na Casa dos Avós **aos 3 anos**". O evento
(`fam_visita_avo`) tinha `idadeMinima: 5` — aos 3 anos o pool elegível era
**zero**, então nenhum evento podia acontecer. A inadequação da opção é
real e foi corrigida; a idade citada não confere. A repetição também é
real: aos 5 anos o evento tinha **25,8% de chance por ano**.

---

## 2. Localização — causa

`listarEstadosDisponiveis` derivava a lista de estados de
`CIDADES_BRASILEIRAS`. Uma UF sem cidade cadastrada simplesmente não
existia para o jogador. É o erro de fundo: **derivar uma lista canônica de
dados incidentais**.

A correção inverte a dependência. A UF é entidade própria; as cidades se
penduram nela.

## 3. As 27 UFs

`src/data/locations/states.ts` declara as 27 unidades federativas com
sigla, nome por extenso e região. A região fica nos dados mas **não
aparece** na opção — o seletor mostra `São Paulo (SP)`, `Acre (AC)`.

Teste garante: 27 exatas, siglas corretas, sem duplicatas, nomes por
extenso, ordenação por nome, e presença específica das 8 que faltavam.

## 4. Cidades

`src/data/locations/cities.ts` — 67 cidades, **todas as 27 UFs com pelo
menos uma**. Há teste verificando essa invariante para cada UF.

Limitação documentada no próprio arquivo: o jogo trabalha com uma seleção
de cidades, não com os 5.570 municípios. `custoVidaRelativo` é parâmetro de
balanceamento (0,8–1,4), **não** estatística socioeconômica de fonte
externa — nada foi inventado como se fosse dado real.

Acrescentar uma cidade é uma linha de dados: a interface a exibe sem que
nenhum componente React seja tocado. Não existe `if estado === "XX"` em
lugar nenhum.

## 5. Avatar

Substituiu as iniciais. Desenhado em **SVG inline** a partir de quatro
campos: `{tomDePele, estiloCabelo, corCabelo, corOlhos}`.

- 6 tons de pele · 8 estilos de cabelo · 7 cores de cabelo · 6 cores de olhos
- Sem IA, sem foto, sem API externa, sem editor complexo
- Os estilos são silhuetas bem distintas (raspado, cacheado, crespo,
  tranças, preso…), não 50 variações quase iguais

**Aparência não afeta gameplay.** Há teste verificando que as opções não
carregam nenhum campo além de `id`/`nome`/`cor`, e que dois personagens
idênticos com avatares opostos têm estado de jogo igual campo a campo.

Preparado para fase de vida: `obterFaseAvatar` devolve `bebe`/`crianca`/
`adulto` e a tabela `PROPORCOES` muda a silhueta (bebê tem cabeça maior,
olhos mais baixos). Três estágios apenas — nenhum sprite novo foi criado.

## 6. Persistência do avatar

`normalizarAvatar` valida **campo a campo**: um save com cabelo inválido e
pele válida preserva a pele. Save sem avatar recebe um padrão válido, nunca
`undefined`, então nenhum componente precisa tratar ausência.

Aplicado em `saveSystem` na migração. Testes cobrem: ausente, `null`,
string, objeto vazio, campo desconhecido, e ciclo completo de
serialização.

## 7. Clipping e responsividade

| Seletor | Antes | Depois |
|---|---|---|
| `.identity__fact-value` | `ellipsis` + `nowrap` | `overflow-wrap: anywhere`, quebra em linha |
| `.relationship__name` | `ellipsis` + `nowrap` | quebra em linha |
| `.btn` | `nowrap` | `white-space: normal` |
| `.relationship__closeness` | `nowrap` | mantido + `flex-shrink: 0` |

Resolvido por **layout**, não por fonte menor. Sobraram 4 `nowrap` no
projeto, todos justificáveis: utilitário de leitor de tela, nav rolável e
rótulos curtos e fixos. Um teste lê o CSS real e falha se o corte voltar.

## 8. +1 ANO

Era renderizado **depois** de `<LifeTimeline>`; com 25 anos de registros o
jogador rolava a vida inteira para avançar o ano.

Agora abre a seção e usa `position: sticky` sob o cabeçalho. `sticky`
mantém o elemento **em fluxo**: ele reserva o próprio espaço e nunca cobre
um registro — ao contrário de um botão flutuante. No celular o dock fixo no
rodapé foi mantido, e `.shell-main` já reserva padding equivalente.

Cobertos: foco visível, `disabled` real, motivo do bloqueio em texto com
`role="status"`, e `prefers-reduced-motion`. Nenhum atalho global de
teclado foi criado.

## 9. Pets

`pet` deixou de ser "mais um tipo de relação". A espécie é decidida em
**um único lugar** (`relationEntitySystem`), que todo o resto consulta — é
o que evita `if (tipo === 'pet')` espalhado.

O tipo `PetInteractionType` é **separado** de `FamilyInteractionType`, então
o próprio compilador impede oferecer "pedir conselho" a um cachorro.

## 10. Capacidades humano × pet

| Ação | Humano | Pet |
|---|---|---|
| conversar / discutir / conselho / dinheiro / presente | sim | **nunca** |
| carinho | — | desde 0 |
| brincar | — | 2+ |
| dar comida | — | 4+ |
| ensinar truque | — | 6+ |
| passear | — | 8+ |
| cuidar | — | 10+ |

Três camadas, na ordem certa: a apresentação **consulta**
(`getActionAvailability`), o motor **revalida** (`petSystem`,
`familySystem`), e cada fluxo recusa a espécie errada sem aplicar efeito
parcial. Testes exercitam o bypass: chamar o motor direto com a
combinação errada é recusado.

A idade de quem age também muda o **texto**: aos 0 anos é "Encostar —
esticar a mão e descobrir que ele(a) é quente e se mexe"; aos 30 é "Fazer
carinho — ficar um tempo ali, sem pressa".

## 11. Auditoria do pool de eventos

Medida com os dados reais, antes de mudar qualquer coisa:

| Idade | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 |
|---|---|---|---|---|---|---|---|---|---|
| **Antes** | 0 | 1 | 1 | 0 | 2 | 4 | 5 | 9 | 14 |
| **Depois** | 4 | 7 | 7 | 9 | 9 | 11 | 12 | 20 | 22 |

Aos 5 anos o pool inteiro era: O Brinquedo na Loja · Gatinho na Calçada ·
Tarde na Casa dos Avós · Macarronada de Domingo. Aos 1–2 anos existia
**um** evento possível.

## 12. Causa da repetição

Três fatores somados, nenhum deles "azar":

1. **Pool minúsculo ou vazio** na infância.
2. **Nenhum cooldown.** `sortearEventoDoAno` só conhecia `unico`
   (14 de 66 eventos). Todo o resto podia voltar no ano seguinte.
3. **Faixas larguíssimas com peso alto.** `fam_visita_avo` ia de 5 a 45
   anos com peso 80, dominando qualquer pool pequeno.

Probabilidade anual medida de "Tarde na Casa dos Avós": **25,8% aos 5
anos**, 19,5% aos 6, 11,9% aos 8. Três ocorrências em poucos anos era o
comportamento esperado do sistema.

## 13. Sistema anti-repetição

Três classes: **UNICO** (uma vez na vida), **COOLDOWN** (volta após N anos),
**RECORRENTE** (livre).

A mudança decisiva é o **padrão**: um evento que não declara nada agora é
COOLDOWN de 6 anos, e não mais "pode todo ano". Os 66 eventos existentes
ficaram corretos sem edição.

Além do cooldown, o **peso efetivo** decai a cada ocorrência (fator 0,45,
com piso de 10%): mesmo liberado, um evento já visto concorre com desvantagem
contra um inédito. É isso que faz duas vidas não se parecerem.

**Histórico por IDs estáveis**, nunca texto. Guarda ocorrências, primeira e
última idade, e o ano. Há teste garantindo que nenhum título vaza para o
histórico.

## 14. Compatibilidade de saves

Saves antigos guardavam só uma lista de IDs — sabiam *se*, não *quando*.
A migração os converte com `ultimaIdade: -1`, e a elegibilidade trata essa
marca como **cooldown já vencido**: uma partida em andamento nunca perde
acesso a conteúdo por ter sido salva numa versão anterior. O bloqueio de
eventos únicos continua valendo.

## 15. Novos eventos

**22 eventos novos**, priorizando as faixas vazias:

- `earlyChildhoodEvents.ts` (0–5): 12 eventos
- `middleChildhoodEvents.ts` (6–11): 8 eventos
- `fam_visita_avo_infancia`: versão infantil dos avós
- 2 eventos existentes com opção única ganharam alternativas reais

Total do catálogo: 66 → **88**.

## 16. Função narrativa

Nada de "Você foi ao parque. Foi legal." Cada opção revela comportamento e
tem consequência. Exemplos:

- **A Coisa Que Quebrou** (3–8): contar antes de perguntarem / esconder os
  pedaços / culpar outro. A segunda opção custa estresse por dias.
- **A Nota no Chão do Pátio** (7–13): primeira decisão sobre dinheiro que
  não é seu.
- **O Último Pedaço** (3–9): partir no meio, comer tudo, ou dar inteiro.
- **A Prova Que Você Não Estudou** (7–14): colar, entregar em branco, ou
  procurar o professor depois.

Testes garantem: todo resultado tem mais de 40 caracteres de narração, toda
opção produz consequência, e nenhum impacto comportamental passa de 2 —
**uma escolha não cria um traço**.

## 17. Auditoria 0–5

Testes automatizados varrem **todos** os eventos elegíveis até os 5 anos e
falham se aparecer:

- tecnologia de adulto (celular, internet, rede social, notebook)
- dinheiro próprio ou trabalho (salário, cartão, boleto)
- autonomia adulta (dirigir, faculdade, aluguel, balada)
- requisito de dinheiro mínimo numa opção

`fam_visita_avo` foi cortado em 12 anos e teve o peso reduzido de 80 para
50. A versão infantil oferece: pedir a mesma história de sempre · sumir
para o quintal · ajudar a mexer a massa · anunciar tédio pela sala.

## 18. Personalidade

Os novos eventos alimentam o B2 sem mudar nada dele: impactos de 1–2, IDs
estáveis, memória estruturada, nenhuma pontuação visível. Os impactos se
distribuem por **todos os 8 eixos** — há teste contra concentração num só.

### Achado: a variedade mudou o comportamento da personalidade

Um teste do B4 falhou ao ampliar o pool infantil. Ele exigia que uma
semente específica consolidasse um traço até os 15 anos. Com mais eventos,
as escolhas de uma vida se distribuem por mais eixos e existem sementes
legítimas em que nenhum eixo isolado atinge o limiar.

Isso é o sistema funcionando: **antes, a repetição do mesmo evento inflava
artificialmente o mesmo traço**. A asserção foi reescrita como propriedade
estatística sobre 40 sementes (>70% das vidas consolidam algum traço), que
é mais forte do que depender de uma semente sortuda. O formato do rótulo
— nunca exibir número — continua verificado de forma absoluta, agora sobre
todas as sementes.

## 19. Playtest determinístico

10 vidas, sementes fixas, medição real (não estipulada):

| Métrica | Valor |
|---|---|
| Eventos disparados (10 vidas, 0–25) | 190 |
| Eventos por vida | 19,0 |
| Eventos **distintos** por vida | 19,0 |
| **Taxa de originalidade** | **100%** |
| Maior repetição numa vida | **1** (era 3) |
| Eventos distintos no conjunto | 57 |
| Infância (0–11): eventos por vida | 8,3 |
| Infância: distintos no conjunto | 31 |
| Sobreposição entre duas vidas até 18 | **12%** |

Verificado também: mesma semente reproduz a mesma vida; nenhum evento volta
no ano seguinte em nenhuma das 10 vidas até os 40 anos; pool pequeno não
trava nem lança exceção até os 60.

## 20. Arquitetura

Nenhum arquivo concentrador foi criado. Cada domínio tem dono:

```
src/data/locations/     states · cities · index (consultas)
src/data/avatar/        avatarOptions
src/data/events/        earlyChildhood · middleChildhood · ... (13 arquivos)
src/systems/events/     eventRepetition · eventHistory · eventEligibility · eventSelection
src/systems/            avatarSystem · relationEntitySystem · petInteractionSystem · petSystem
src/presentation/       petPresentation
src/components/avatar/  AvatarPortrait · AvatarPicker
src/components/modals/  PetModal
src/styles/avatar.css
```

Separação de eventos em quatro responsabilidades distintas: **dados** ×
**classificação de repetição** × **elegibilidade** × **sorteio** ×
**histórico**.

`brazilianData.ts` virou reexport da nova estrutura, para não quebrar
importações existentes.

## 21. Auditoria de modularidade

| Domínio | Arquivo(s) | Responsabilidade | Linhas | Situação |
|---|---|---|---|---|
| Localização — dados | `data/locations/states.ts` | 27 UFs | 55 | OK |
| Localização — dados | `data/locations/cities.ts` | 67 cidades | 98 | OK |
| Localização — consulta | `data/locations/index.ts` | busca e sorteio | 64 | OK |
| Avatar — dados | `data/avatar/avatarOptions.ts` | opções de aparência | 96 | OK |
| Avatar — sistema | `systems/avatarSystem.ts` | padrão, sorteio, migração, fase | 96 | OK |
| Avatar — UI | `components/avatar/AvatarPortrait.tsx` | desenho SVG | 222 | OK |
| Avatar — UI | `components/avatar/AvatarPicker.tsx` | seleção | 137 | OK |
| Capacidade por idade | `systems/interactionCapabilitySystem.ts` | regra humana | 210 | OK |
| Pets — fronteira | `systems/relationEntitySystem.ts` | espécie da relação | 37 | OK |
| Pets — capacidade | `systems/petInteractionSystem.ts` | regra por idade | 130 | OK |
| Pets — motor | `systems/petSystem.ts` | efeitos e narração | 197 | OK |
| Pets — apresentação | `presentation/petPresentation.ts` | rótulos por fase | 129 | OK |
| Eventos — dados | `data/events/*.ts` | 88 eventos, 13 arquivos | 620 (maior) | OK |
| Eventos — repetição | `systems/events/eventRepetition.ts` | classificação | 44 | OK |
| Eventos — histórico | `systems/events/eventHistory.ts` | IDs, migração | 153 | OK |
| Eventos — elegibilidade | `systems/events/eventEligibility.ts` | cooldown, peso | 69 | OK |
| Eventos — seleção | `systems/events/eventSelection.ts` | sorteio ponderado | 40 | OK |
| Eventos — consequência | `systems/eventSystem.ts` | condições e aplicação | 438 | OBSERVAR |
| Apresentação | `presentation/*.ts` | textos derivados | 179 (maior) | OK |
| Economia | `systems/economySystem.ts` | intocado neste PR | — | OK |
| Orquestração | `hooks/useGame.ts` | conecta motor e estado | **1015** | OBSERVAR |

**Reinformando os tamanhos pedidos:**

| Arquivo | B4-FIX | Agora | Δ |
|---|---|---|---|
| `App.tsx` | 164 | 165 | +1 |
| `useGame.ts` | 937 | 1015 | **+78** |
| Maior arquivo de eventos | 371 | 620 | +249 (arquivo novo) |
| Maior CSS (`character.css`) | 497 | 548 | +51 |
| Maior componente React | 266 | 303 | — (`EconomyTab`, intocado) |

**Sobre o crescimento de `useGame.ts`:** as +78 linhas são o comando
`acaoPet`, que segue exatamente a forma do `acaoFamilia` vizinho —
valida, chama o motor, escreve estado, registra log. **Nenhuma regra de
domínio** foi parar ali: validação está em `petInteractionSystem`, efeitos
em `petSystem`, textos em `petPresentation`. Extrair só esse comando
criaria assimetria com os outros dez comandos do hook. Fica em OBSERVAR,
como já estava.

`character.css` cresceu 51 linhas (CTA sticky + comentários das correções
de clipping); o avatar ganhou **módulo próprio** em vez de engordá-lo.

## 22. Testes

**509 no total** — 361 preservados, 148 novos.

| Arquivo | Testes | Cobre |
|---|---|---|
| `localizacaoB4Fix1.test.ts` | 19 | 27 UFs, integridade UF→cidade |
| `avatarB4Fix1.test.ts` | 16 | criação, persistência, migração, gameplay intacto |
| `petsB4Fix1.test.ts` | 20 | fronteira de entidade, capacidade, bypass |
| `repeticaoEventosB4Fix1.test.ts` | 28 | histórico, cooldown, peso, saves |
| `eventosInfantisB4Fix1.test.ts` | 16 | cobertura e adequação 0–5 |
| `b4Fix1Interface.test.tsx` | 24 | avatar, criação, pets, +1 ANO |
| `clippingB4Fix1.test.ts` | 19 | ellipsis, sticky, layout do avatar |
| `playtestB4Fix1.test.ts` | 6 | variedade determinística |

## 23. Playtest humano

Verificado no preview: criação com as três seções; avatar alterando ao
clicar nas amostras; Acre, São Paulo e Distrito Federal selecionáveis com
cidades próprias; retrato aparecendo na identidade em vez de iniciais.

**Coberto por teste automatizado em vez de olho:** todas as 27 UFs
selecionáveis produzindo cidade válida, timeline de 60 anos mantendo o
botão acessível, nome longo sem truncar, pet sem ações humanas.

## 24. Regressões encontradas

1. **Teste do B4 codificava o próprio bug.** `b4FixInterface.test.tsx`
   comparava a lista de estados com as siglas presentes em
   `CIDADES_BRASILEIRAS` — ou seja, certificava que a UF era derivada das
   cidades. Reescrito para a invariante correta (toda cidade pertence a uma
   UF do catálogo).
2. **Cooldown esvaziava anos na infância.** Ao bloquear repetições sem
   antes ampliar o pool, anos inteiros ficavam sem evento. Resolvido com os
   22 eventos novos, não relaxando o cooldown.
3. **Migração de save bloqueava conteúdo.** `ultimaIdade: -1` era subtraído
   da idade atual, produzindo cooldown "vencido" por acidente em idades
   altas mas ativo em idades baixas. Passou a ser tratado explicitamente.
4. **Cinco eventos com opção única** — avisos, não decisões. Dois estavam
   em faixa infantil/juvenil e foram corrigidos.
5. **Teste de personalidade dependia de uma semente.** Ver seção 18.

## 25. Regressões corrigidas

Todas as cinco acima. Os 361 testes do B4/B4-FIX continuam passando; as
duas asserções alteradas (`cicloVida`, `b4FixInterface`) estão documentadas
no código com o motivo.

## 26. Pendências

1. `useGame.ts` em 1015 linhas — OBSERVAR (justificado na seção 21).
2. Verificação visual automatizada segue indisponível: Playwright não roda
   no sandbox. Clipping e contraste têm teste sobre o CSS; a conferência
   nos breakpoints 360/390/768/1366/1920 continua manual.
3. Três eventos adultos com opção única
   (`rnd_sorteio_shopping`, `car_exame_ordem_conselho`, `ext_banca_tcc`) —
   fora do escopo deste PR, não refatorados só por métrica.
4. 67 cidades para 27 UFs: cobertura deliberadamente parcial e documentada.
5. Avatar por fase de vida existe na estrutura (3 estágios de proporção),
   mas não há arte distinta por fase além disso.
6. Presente feito à mão pela criança segue fora de escopo.

## 27. Arquivos alterados

**Novos (20):**
`data/locations/{states,cities,index}.ts` ·
`data/avatar/avatarOptions.ts` ·
`data/events/{earlyChildhood,middleChildhood}Events.ts` ·
`systems/{avatarSystem,relationEntitySystem,petInteractionSystem,petSystem}.ts` ·
`systems/events/{eventRepetition,eventHistory,eventEligibility,eventSelection}.ts` ·
`presentation/petPresentation.ts` ·
`components/avatar/{AvatarPortrait,AvatarPicker}.tsx` ·
`components/modals/PetModal.tsx` · `styles/avatar.css` ·
5 arquivos de teste

**Modificados (26):** `types/index.ts` · `hooks/useGame.ts` · `App.tsx` ·
`systems/{availabilitySystem,eventSystem,agingSystem,familySystem,saveSystem,interactionCapabilitySystem}.ts` ·
`data/brazilianData.ts` · `data/events/{allEvents,moreEvents,extraEvents}.ts` ·
`components/{screens/CharacterCreationScreen,character/CharacterIdentity,tabs/FamilyTab,shell/SectionRouter,timeline/TimelineSection}.tsx` ·
`styles/{character,controls,index,responsive}.css` · 4 arquivos de teste

---

## Critério final

| Critério | Estado |
|---|---|
| 27 UFs existem | ✅ |
| Nascimento manual funciona | ✅ |
| Identidade visual personalizável | ✅ avatar SVG, 4 eixos |
| Nada cortado | ✅ ellipsis removido dos campos essenciais |
| +1 ANO sempre fácil de achar | ✅ sticky, antes da timeline |
| Pet se comporta como pet | ✅ fronteira de entidade + 6 ações próprias |
| Criança se comporta como criança | ✅ auditoria automatizada 0–5 |
| Eventos repetem muito menos | ✅ repetição máxima 3 → 1 |
| Linha da Vida mais variada | ✅ 100% de originalidade, 12% de sobreposição |
| Nada virou monólito | ✅ 20 arquivos novos, maior sistema novo tem 197 linhas |
