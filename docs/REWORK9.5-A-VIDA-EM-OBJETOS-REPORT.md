# REWORK 9.5 — A VIDA EM OBJETOS

Consolidação do playtest, rotina coerente, escolhas com consequências e identidade visual.

> Menos dashboards genéricos. Mais objetos, registros, documentos e experiências reconhecíveis da vida real.
> Toda informação apresentada corresponde ao estado real do motor. Toda consequência prometida existe no motor.

---

## 1. Commit-base e branch

| | |
|---|---|
| Branch | `claude/fix-pos-rework3-playtest` |
| Commit-base | `07e53dc` — REWORK 9 · Fase D (presente e conferido) |
| Save | v20, sem versão nova (o único campo novo, `FotoDoAno.rotina`, é opcional) |
| Baseline | 1441/1441 testes, `tsc` limpo (cópia em disco Linux, Node 22) |
| Pacotes (base) | `motor` 766,9 kB · `motor-textos` 737,7 kB · `Jogo` 510,2 kB · `motor-vida` 141,5 kB (limite 800 kB) |

Commits deste pacote: `d586f89` (Fases A e B), `4bd4dc3` (Fase C), e o da Fase D (este relatório).

## 2. Achados reproduzidos e causas reais

| Código | O que o playtest viu | A causa encontrada no motor |
|---|---|---|
| ROT-01 (bloqueio) | Criança com escola, futebol 2×, leitura e xadrez: "não cabe mais nada", com a agenda cheia de horas livres | `semana.encaixe` somava **frequências** ("pedaços"), não exigência: futebol 1 + xadrez 1 + leitura 0,5 = 2,5; criança tem base 2 e teto 2,75 → a quarta atividade (0,5) já passava do teto. A agenda em horários **nunca era consultada** para decidir se cabia. |
| ROT-01 (contradição) | Estresse 11%, "a cabeça está tranquila, sobra espaço para descansar", "semana cheia", "mais atividades do que cabem", "sobrecarga forte" — na mesma tela | Três contas falando da mesma coisa: `estado.fatoresCabeca` (excesso de atividades × 23 → "forte" com 0,5 de excesso), `leituraDoEstresse.frase` (falava de *tempo* para descansar) e `folegoDaSemana` ("chegou no teto"). |
| ROT-03 | "Com dedicação" dava vantagem sem custo, todo ano | A postura dedicada era só +7 na nota e ×1,2 no aprendizado — **sem tempo** na semana nem na agenda: estratégia dominante. |
| EDU-02 | Português de 3,2 para 8,6, e a frase continuava "tropeça na redação" | A frase vinha de `estagioDe(h)`, uma régua **absoluta** (abaixo de 15 = "tropeça") — a de um adulto. Aos 8 anos, 8,6 é perto do esperado na série (~10). Não era cache nem estado antigo: era régua errada para a idade. |
| UX-03/04 | Progressão técnica (barras, chips, valores espalhados); matérias repetidas em "As matérias" e "Como você está se saindo" | Duas listas das mesmas matérias na mesma parte de Caminhos; em Você, as mesmas frentes em "No que você é bom" e no "ano a ano". |
| UX-06 | Quatro cartões iguais no alto da História | `Hoje` mostrava `Sinais` (os medidores), a mesma leitura detalhada em Você. |
| UX-07 | Caminhos "Agora" com vagas, partido e bandeira política no mesmo peso; lista longa de "Outros caminhos" | As ações políticas (`pol_*`) entram em `acoesDoTrabalho` para todos ≥16 e disputavam o mesmo topo; "Outros caminhos" listava nove vidas com tudo aberto. Caminhos desenhava as quatro partes (CSS escondia três). |
| Vida | Área não redesenhada no REWORK 9 | O inventário estava partido entre Dinheiro (balanço, bens, aplicações) e Pertences (objetos). |

## 3. Correções de motor

- **`sistemas/avaliacaoDaRotina.ts`** (pacote `motor-vida`) — a rotina em três leituras, cada uma com a sua conta:
  **horários** (a agenda: horas livres na janela da idade, dias com uma hora seguida livre, conflitos),
  **exigência** (`semana.encaixe`) e **cabeça** (o estresse e o que o move). A frase de cima junta as três sem repetir.
  Fonte de Minha Semana, Caminhos (Agora), Você e do fechamento do ano (`fechamento.rotinaDoAno`).
- **`semana.cargaDaAtividade`** — o peso de uma atividade é a **exigência**: frequência × intensidade da categoria
  (esporte 0,95; leitura 0,45; xadrez 0,6…) × 1,1 no nível sério, + 0,1 por vez de **logística** quando é fora de casa.
  Cada compromisso tem também a parte **mental** (o treino cansa o corpo; a apostila, a cabeça).
- **Estresse** (`estado.sobrecargaDaSemana`/`fatoresCabeca`) — só a parte mental do excesso pesa na cabeça; uma atividade
  de que se gosta (interesse ≥ 60) pesa 40% menos; a criança sente metade (sente no cansaço). O excesso inteiro continua
  indo para a sobrecarga (o corpo, a saúde em anos seguidos).
- **Horário** (`agenda.horarioDaAtividade`, registrado em `rotinas` por gancho) — antes de pesar a exigência, a agenda
  encaixa a atividade nova junto com o que existe: sem nenhuma vez livre, o "não" é **"Horário incompatível"**, com o que
  ocupa os dias; vezes parciais ou que tiram o horário de outra atividade são permitidas com o aviso dito.
- **O "não" de exigência** agora é **"Descanso insuficiente"**, com o que ocupa e o que largar ou diminuir (nunca "não
  cabe mais nada"). `folegoDaSemana` mede a atividade leve **mais leve que existe para a pessoa** (antes, meio pedaço fixo).
- **Bug real encontrado**: `agenda.padraoDeDias` não tinha padrão para **4 vezes por semana** — caía no de 1 vez, e só um
  dia achava lugar. E o encaixe dia a dia contava grupos, não dias.
- **ROT-03 · dedicação** — "com dedicação" cria o compromisso **estudo em casa** (4×/semana; 1 h até 11 anos, 1h30 depois)
  na semana e na agenda; rende **na proporção das vezes que acharam horário** (`presencaNoEstudo` → `processarEscola`/
  `processarCurso`). "Empurrando" devolve fôlego (0,25 de capacidade). Semana sobrecarregada/além cobra −3/−5 no
  desempenho (`semana.cansacoNosEstudos`, passado pelo ano — sem ciclo de import). Sem estresse automático por estudar.
  `agenda.previsaoDaPostura` diz antes; `FotoDoAno.rotina` registra o que de fato foi; o fim do ano conta quando importa.
- **EDU-02** — `dados/frentes.reguaDaFrente` + `frentes.estagioDaFrente`: uma matéria, enquanto se está na escola, é
  dita diante do **esperado para a série** (`esperadoNaSerie`, a curva do REWORK 9, movida para `dados/frentes`);
  quem domina como adulto é dito assim em qualquer idade; fora da escola, a régua absoluta. Uma régua só para todas as
  telas (Você, Caminhos, boletim, ficha da prática, progressão). Domínio ≠ nota: o boletim mostra os dois, separados.

## 4. Regras de balanceamento (resultado)

- A criança do playtest (futebol 2×, leitura, xadrez): exigência 1,98 de 2 → **"movimentada, lidando bem"**; desenho e
  música entram; uma natação 2×/semana (quarta atividade intensa) ouve "Descanso insuficiente… diminuir o xadrez".
- Criança não se sobrecarrega por escolha (teto = base + 0,75, regra anterior mantida); adolescente e adulto podem
  passar do confortável com o preço dito, até o teto humano (base × 1,55).
- A sobrecarga persistente cobra aos poucos (nível → anos → saúde a partir do 2º ano), como antes — agora a partir do
  excesso de exigência real.

Simulações: ver seção 10.

## 5. Mudanças visuais (VIS-01) e de navegação

Todas as classes novas em `src/ui/objetos.css`, só com tokens (as quatro paletas sem cor fixa):

| Área | Objeto | O que mudou |
|---|---|---|
| Minha Semana | Agenda pessoal | Três **notas da agenda** (Horários · Exigência · Cabeça) com a frase de cima; a "semana em lista" (faixa + "Para onde vai") saiu — repetia a agenda; cabeçalhos de dia como de planner. |
| Caminhos · escola | **Boletim escolar** | Aluno, série, ano letivo, rede; cada matéria com domínio (+ esperado na série), evolução com causa e lugar diante da série; rodapé com desempenho, frequência real (a agenda), dedicação e o que dela aconteceu, situação; observações; histórico ano a ano. Nenhuma nota por matéria inventada. No celular, cada matéria vira ficha. |
| Caminhos | **Pasta de trajetórias** | Só a parte aberta é desenhada; abas de pasta; vida pública agrupada em "Agora" quando não é a situação; Oportunidades em pastas (Profissões · Vida pública · Negócio próprio · Outras trajetórias) com **fichas curtas** (nome, tipo, onde você está, próximo passo; "como começa" ao pedir). |
| Caminhos/Estudos | Prioridades | A **dedicação** em três cartões (horas por semana, efeito provável, custo — ou o porquê do bloqueio). |
| Você | **Ficha pessoal** | O retrato numa ficha; cada habilidade uma **ficha de desenvolvimento** (nível, frase, o que mudou e de onde veio, histórico) — uma vez só; a leitura da rotina. |
| História | **Diário** | **Retrato contextual** no lugar dos quatro medidores (onde, agora, no coração, o que mudou de situação no último ano, quem mais importa, alertas críticos); margem de caderno na Linha da Vida. |
| Pessoas | **Álbum** | Rostos como fotos reveladas (moldura de papel, legenda). Ações e acontecimentos dos NPCs intactos. |
| Vida | **Papéis da casa** | Pertences → **Patrimônio** (o inventário: balanço, imóveis, veículos, aplicações, objetos); Dinheiro como **extrato** (borda serrilhada, livro-caixa); selos do imóvel como carimbos de registro. Viagens já eram cartões-postais (REWORK 8/9). |
| Redes | Celular | Sem mudança (continua app). |

Comparação antes/depois e capturas: seções 7 e 8.

## 6. Testes

- `src/motor/__tests__/rework95.test.ts` — 24 testes: os 10 cenários de rotina do pedido (criança do playtest, adolescente,
  adulto que trabalha e estuda, conflito real, cheia e saudável, vazia e estressada, prazer × esforço, sobrecarga
  gradual, mudança de vida, save/load), a dedicação (horas na agenda, rende o que acha de horário, sem penalidade
  obrigatória, nenhuma opção ganha sempre, persistência) e EDU-02 (3,2 → 8,6; régua absoluta para adulto; save/load).
- `src/ui/__tests__/rework95.test.tsx` — 10 testes de tela: as notas da rotina sem contradição (e o mesmo número de horas livres na agenda), a dedicação com a previsão
  do motor, o boletim com os números do motor e a frequência real, Português 8,6 no boletim, fichas sem duplicata;
  Cenário 6 (Caminhos aos 17 com técnico; aos 20, as ações políticas agrupadas em "Vida pública"), Cenário 8 (Vida conectada), Cenário 9 (Você + História).
- Testes antigos reescritos onde afirmavam a regra ou a tela anteriores (sem apagar o que verificavam): `caminhos` #25,
  `fix2` (peso devolvido), `fixPosPlaytestHumano` (motivos de descanso/horário), `fixPosRework2`, `interface`, `rework6`,
  `rework7`, `rework75`, `rework`, `rework9`, `navegacao`, `material`.

Resultado final da suíte: seção 9.

## 7. Comparação antes/depois

| Tela | Antes (07e53dc) | Depois |
|---|---|---|
| Minha Semana, criança do playtest (mesmo save nos dois builds) | "A semana está cheia: o que entra agora sai do descanso. Isso tem pesado na cabeça." — com "CHEIA" e **82 h livres** na mesma agenda; abaixo, a faixa e "Para onde vai" repetindo a agenda | "Uma semana movimentada, bem levada." + três notas: **51 h livres** · **movimentada** (o que mais exige: jogar bola e xadrez; dá para assumir mais tirando do descanso) · **18% baixo, a cabeça está tranquila** |
| Atividade nova sem horário | "Não há horas na semana" (era exigência disfarçada de horário) | "Horário incompatível: … e não há horário livre até as 19h30: … ocupam os dias." |
| Dedicação | Três botões iguais | Três cartões com horas por semana, efeito e custo (ou o porquê do bloqueio); a nota do ano seguinte diz quanto do estudo aconteceu |
| Português 8,6 aos 8 anos | "tropeça na redação" | "se vira em português · perto do esperado para a série" (esperado ~10,3) |
| Caminhos · Desenvolvimento (escola) | "Como você está se saindo" + "As matérias" (as mesmas quatro matérias duas vezes) | Um **boletim** |
| História | Rosto, nome e quatro medidores | Retrato contextual (onde, agora, no coração, mudou no ano, quem importa, alertas) |
| Caminhos aos 17, procurando emprego | Vagas, partido e bandeira no mesmo peso; nove caminhos com tudo aberto | Vagas primeiro; vida pública agrupada; pastas com fichas curtas |
| Vida | Balanço e bens em Dinheiro, objetos em Pertences | **Patrimônio** (o inventário inteiro); Dinheiro = o extrato do mês |

## 8. Capturas

`docs/rework95/` — montagens das capturas **reais** do jogo (`scripts/playtest/rework95.mjs`, saves de
`gerarRework95.ts` + REWORK 6/7/7.5/8/9), antes (build da base, os mesmos saves) × depois, e as quatro paletas:

| Arquivo | O que mostra |
|---|---|
| `01-semana-playtest.jpg` | A criança do playtest: antes ("A semana está cheia… Isso tem pesado na cabeça", com 82 h livres) × depois (390 e 1440) |
| `02-dedicacao.jpg` | Um ano estudando com dedicação: o estudo em casa na agenda |
| `03-boletim.jpg` | Antes (duas listas das matérias) × o boletim (1440 e 390) |
| `04-historia.jpg` | Antes (os quatro medidores) × o retrato contextual |
| `05-voce.jpg` | Você: fichas de desenvolvimento, uma por habilidade |
| `06-caminhos-17.jpg` | Caminhos aos 17 com técnico, procurando emprego: antes × depois (Agora e Oportunidades) |
| `07-caminhos-pastas.jpg` | Pastas de Oportunidades: Vida pública, Outras trajetórias |
| `08-vida.jpg` | Pertences (antes) × Patrimônio; Dinheiro como extrato |
| `09-pessoas.jpg` | Pessoas como álbum |
| `10-paletas-semana.jpg`, `11-paletas-boletim.jpg` | As quatro paletas |
| `12-tablet-baixo.jpg` | 820 px e 390 × 560 |

**Auditoria visual final** (`rework95.mjs`, TAG=final): 23 cenas × 4 paletas × (1440, 820, 390, 360, 390×560) =
**460 capturas, 0 problemas** — sem texto sobre texto, sem rolagem horizontal, nada estourando a borda, o "Viver mais um
ano" sempre visível e clicável; e (novo neste pacote) **contraste ≥ 3:1** de todo texto visível contra o fundo efetivo
em 1440 e 390. Única nota: o bloco de trajeto curto da agenda (< 32 px), pendência já registrada no REWORK 9.

A checagem de contraste nova encontrou três defeitos reais, corrigidos: (1) a aba ativa de Caminhos ilegível (o fundo
novo da aba de pasta sem trocar a cor do texto — introduzido aqui); (2) `.escolha__item:hover` vencendo a cor da opção
**ativa** (texto claro sobre o tom nas paletas escuras; no celular o hover fica preso depois do toque — antigo);
(3) o contador e os rótulos na cor da marca do X sobre o fundo escuro do celular (antigo). Os demais apontamentos da
primeira rodada eram falsos positivos (fundos em `oklab()`), e o verificador passou a convertê-los.

## 9. Testes executados

| | |
|---|---|
| Suíte completa final | **85 arquivos, 1475 testes, todos passando** (388 s; Node 22; cópia em disco Linux; `--maxWorkers=3`; nada mais rodando) — baseline era 1441 |
| `tsc --noEmit` | limpo |
| `npm run build` | ok; maior pacote 770,70 kB (< 800) |
| `scripts/pwa/offline.mjs` | **36/36** (instala, joga offline, recarrega, quatro paletas persistem, atualização de versão sem perder a vida) |
| `npm run build:itch` + `smoke:itch` | **21/21** |
| Auditoria visual + contraste | 460 capturas, 0 problemas (seção 8) |
| Simulações | `scripts/sim/rotina95.ts` (seção 10), `scripts/sim/tamanho75.ts` (seção 11) |

Durante o trabalho, rodadas da suíte feitas **com a auditoria visual ou um build em paralelo** tiveram até cinco testes
estourando limites de tempo fixos no próprio teste (60–90 s); os mesmos estouravam no commit-base sob carga, passaram
isolados com limite elevado e passaram todos na rodada final sem concorrência.

## 10. Simulações e resultados

`scripts/sim/rotina95.ts`, 30 vidas até os 45 anos (decisões pela primeira opção livre), 1152 anos de vida observados;
em cada ano, as atividades leves (uma vez por semana) do catálogo são tentadas uma a uma até o primeiro "não":

| Idade | Anos | Atividades a mais que cabem (média) | De onde veio o "não" | Rotina vira "exigente" / "pesada" com (mediana de atividades) |
|---|---|---|---|---|
| 6–11 | 180 | 5,5 | descanso 86% · horário 0% · nunca 14% | 5 / — (criança não se sobrecarrega por escolha) |
| 12–17 | 179 | 9,2 | descanso 61% · nunca 39% | 7 / 8 |
| 18–29 | 345 | 9,6 | descanso 100% | 8 / 9 |
| 30–45 | 448 | 9,3 | descanso 100% | 8 / 9 |

- **Atividade leve bloqueada com a rotina leve ou movimentada e horário sobrando: 0** (nenhum bloqueio de rotina plausível).
- **Contradição cabeça tranquila × "sobrecarga forte" sem rotina pesada: 0.**
- O motor não aceita tudo: toda vida adulta chega ao "não" (por descanso, com o que largar) antes de 12 atividades novas.
- Posturas, três irmãos de semente por 3 anos (a partir dos 10, 30 vidas): **dedicada** nota 66 · matérias +15,3 · 51 h
  livres/semana · estudo em casa aconteceu 100%; **no ritmo** 57 · +13,0 · 55 h; **empurrando** 45 · +9,8 · 55 h. O
  estresse não muda com a postura (17–18): sem punição automática por estudar. Dos 15 anos, só 4 vidas da amostra
  ainda estavam na escola básica (amostra pequena; mesma direção: 54 / 40 / 32).
- "Empurrando" devolve **fôlego** (capacidade de descanso: cabe mais), não horas no calendário — o dever de casa
  "normal" nunca foi um bloco da agenda; dito assim na tela ("devolve tempo à semana — para descansar ou para outra coisa").

## 11. Performance

Clique → tela nova com o layout calculado (mediana de 5, ms, 1440 px, `desempenho95.mjs`, mesmos saves nos dois builds):

| Save | Caminhos (abrir) | Caminhos · trocar de parte (Desenv. / Oport. / Hist. / Agora) | Você | Minha Semana | História |
|---|---|---|---|---|---|
| empregado | 24,8 → **11,2** | 10,1/11,2/9,9/10,1 → 2,8/15,9/3,0/6,4 | 17,6 → 23,0 | 10,8 → 13,6 | 17,6 → 19,9 |
| técnico, 17 | 20,2 → **8,6** | 8,2/9,6/8,2/8,7 → 1,9/14,0/3,3/4,4 | 15,6 → 18,0 | 7,6 → 7,6 | 12,6 → 14,5 |
| dedicada, 10 | 8,1 → 9,0 | 5,0/3,1/3,4/4,5 → 5,9/2,4/2,7/7,3 | 13,2 → 12,6 | 11,6 → 13,7 | 11,4 → 12,0 |

- Caminhos deixou de desenhar as quatro partes: abrir ficou 2,2–2,3× mais rápido para quem trabalha ou procura; o
  custo de Oportunidades (a procura, as vagas) passou para quando ela é aberta (14–16 ms).
- Você ficou 3–5 ms mais lenta (a leitura da rotina monta a agenda; as fichas com histórico). Minha Semana +0–3 ms.
- Motor: **5,9 ms por ano** nos dois (12 vidas até os 75, `scripts/sim/tamanho75.ts`); save médio 102,4 → 102,9 kB.

## 12. Bundle

| Pacote | Base (07e53dc) | Depois | |
|---|---|---|---|
| `motor` | 766,92 kB | 770,70 kB | +3,8 kB (semana, agenda, frentes, escola) |
| `motor-textos` | 737,66 kB | 737,66 kB | = |
| `motor-vida` | 141,51 kB | 149,63 kB | +8,1 kB (avaliacaoDaRotina, horário, postura) |
| `Jogo` | 510,23 kB | 517,92 kB | +7,7 kB (boletim, fichas, retrato, pastas) |
| CSS | 201,72 kB | 217,65 kB | +15,9 kB (objetos.css) |

Maior pacote: **770,70 kB** (limite de 800 kB intacto, não alterado).

## 13. Compatibilidade de saves

Save continua **v20**. Campos novos: só `FotoDoAno.rotina` (opcional; saves antigos não o têm e tudo o lê com `?.`).
`v.agenda.lugares` aceita a chave `estudo_casa` (limpa por `limparAgenda` quando a dedicação muda). Testado: salvar e
abrir durante rotinas, dedicação, compromissos marcados e progressões (`rework95.test.ts`, "salvar e abrir não duplica
nem perde compromissos", "o ano registra o que de fato foi", EDU-02 "salvar/abrir não muda a frase"); a auditoria visual
abre saves gerados pelos REWORKs 6, 7, 7.5, 8 e 9 no build novo **e** os saves novos no build da base.

## 14. Pendências e limitações

- **Testes longos sob carga**: cinco testes têm limite de tempo fixo (60–90 s) e estouram nesta máquina quando há outra
  coisa rodando (também no commit-base). Passaram na rodada final; os limites não foram alterados.
- **"Empurrando" devolve fôlego, não horas no calendário**: o dever de casa comum nunca foi bloco da agenda; criar um
  para todos mudaria todas as agendas e testes do REWORK 9. Dito assim na tela.
- **Bloco de trajeto curto da agenda < 32 px** (pendência do REWORK 9, não atacada).
- **A aba Vida foi reorganizada (Patrimônio, extrato, carimbos), não reescrita**: Casa, Compras, Cidade e Viagens
  mantêm os componentes dos REWORKs 3/7/8/9 com a nova pele; não há ficha nova de imóvel (os dados já estão em `Lar`).
- **Esportes**: sem ficha de atleta nova (o sistema de competições é do REWORK 10, como pedido).
- **Teste em aparelho real e APK**: não feitos; o APK não foi regenerado (como pedido).
- A natação da criança do playtest (quarta atividade intensa, 2×/semana) é recusada por descanso — é a regra
  (criança não se sobrecarrega por escolha), mas é o ponto mais provável de discordância num próximo playtest.

## 15. Commits finais

| Commit | Fase |
|---|---|
| `d586f89` | A e B — rotina coerente, dedicação com contrapartida, régua da série, boletim e fichas |
| `4bd4dc3` | C — objetos da vida, História como retrato, Caminhos em pasta, Vida com Patrimônio |
| (este) | D — contraste e consistência (a aba ativa, o hover da opção ativa, a cor da marca no celular, um número só de horas livres), testes de integração, auditoria visual, desempenho, relatório e `docs/rework95/` |

Sem merge na `main`, sem force push, sem deploy manual, APK não regenerado, `.claude/` fora dos commits.
