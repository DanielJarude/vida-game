# A3 — Atuação, música, política e Submundo (auditoria para o REWORK 11)

Base: `claude/fix-pos-rework3-playtest` @ 2523d86. Somente leitura. Linhas citadas são do estado atual.
Simulações (scripts em `scratchpad/aud3/`): `arte20.ts` (ator e músico, 30 sementes × 20 anos, 22→42),
`pol.ts` (político de carreira, 20 vidas, 25→70), `modos.ts` (painel/verbos por ocupação),
e o existente `scripts/sim/crime10.ts` (N=20).

---

## 0. Resumo executivo

1. **Renda artística em fuga (P0).** A renda do ator e do músico não tem teto prático e cresce **sozinha**.
   - Ator **que não faz nada** (só tem o emprego `ator`, salário de tabela R$ 2.600/mês): mediana **R$ 227 mil/ano aos 42**. 28 de 30 passam de R$ 100 mil/ano (no 8º ano, na mediana).
   - Ator ativo (testes, temporadas, aceita toda proposta): mediana **R$ 1,0 mi no 6º ano** e **R$ 2,3 mi no 20º ano** (p90 R$ 3,8 mi). **30 de 30** passam de R$ 1 mi/ano; ≥ R$ 500 mil já no 5º ano (mediana).
   - Músico **que não faz nada** (sem banda): mediana **R$ 500 mil no 10º ano** e **R$ 711 mil no 20º ano**; 26 de 30 passam de R$ 1 mi em algum ano.
   - Músico ativo, com banda: mediana **R$ 1,9 mi já no 1º ano** e R$ 8–17 mi/ano depois; a turnê sozinha deposita **~R$ 4,8 mi** a cada dois anos.
2. **Contagem dupla (tripla) do ator confirmada.** O “salário” do ator **é** a temporada de palco (`palco.ts:34,95`), calculada pelo alcance, que é o máximo entre público, freguesia e notoriedade. Por cima dela entram:
   - o cachê líquido de cada produção, inclusive as **peças** (`audiovisual.ts:228`);
   - a bilheteria de “apresentar” (`cena.ts:195-198`);
   - o patrocínio (`notoriedade.ts:223-235`).

   O mesmo ofício é pago três ou quatro vezes. A causa da fuga é o laço freguesia → notoriedade → alcance → cachê exponencial.
3. **Convites para “viver de música/atuação” a quem já vive disso.** Há quatro portas que não olham o emprego atual:
   - “Começaram a pedir · O dono de um bar ouviu você tocar…” para músico profissional (`oportunidades.ts:132-146`): **107 vezes em 600 anos-músico**;
   - o botão “Tentar viver disso (banda, grupo, editais)” (`Pratica.tsx:96,202`);
   - “mostrar o trabalho” com checagem por id exato (`perseguir.ts:203`): o ator conhecido recebe o convite de `ator`, que é rebaixamento;
   - o convite de `arte.ts:151`, que compara a trilha: o músico de orquestra recebe “Um convite para viver de música”.
4. **Política:**
   - **Ponto forte:** progressão, regras, campanhas, alianças e escândalos existem.
   - **O cargo não determina as ações.** O conjunto é idêntico para vereador, prefeito, deputado, senador e governador.
   - **“Pedir aumento” liberado no mandato.** O motor libera `pedir_aumento` a quem tem mandato (433 de 623 anos de mandato); a conversa é com “a chefia”.
   - **Quase tudo se vence.** O político de carreira chega a senador ou governador em metade das vidas, com 95% de vitória como deputado federal.
5. **Submundo:**
   - **O que existe:** 6 categorias × 3 níveis, confiança do meio, trabalhos maiores, atrito, cerco, saída e Justiça.
   - **A renda anual de quem está ativo é garantida:** nunca há ano sem ganho (`ilicito.ts:220-224`). Só o “trabalho maior” pode falhar.
   - **O que é decorativo:** os contatos são só um contador (`margem.ts:44,129`).
   - **O que não existe:** especialização, mercado, inventário e território.
   - **Balanço da vida inteira:** na vida inteira o crime perde. A estratégia “carreira” tem 75% presos, mediana de 6 anos de pena e patrimônio aos 45 de R$ 101 mil, contra R$ 155 mil da vida honesta.
6. **Ações de empresa em quem não tem empresa:**
   - bailarino (CLT, trilha `danca`): “Pedir aumento”, horas extras, “curso da empresa”, e nenhuma audição no painel;
   - músico de orquestra: “curso da empresa”, almoço com a chefia;
   - escritor: “Procurar outra vaga”, chefia, “curso da empresa”;
   - músicos, de toda espécie: “Divulgar no bairro”, “o cliente exigente”, “Formalizar como MEI”, “Baixar o preço”, “Equipamento próprio”;
   - ator e músico: o acontecimento “Um cliente grande fechou com você”, que paga 1,5 salário (19 vezes em 30 vidas de ator).

---

## 1. Números das simulações

### 1.1 Ator — renda anual (R$; mediana · p90). 30 vidas, técnica de teatro 66 aos 22, emprego `ator`

**Ativo** (agente, 2 testes por ano, temporada, edital, trabalho pequeno, lança obra; aceita toda proposta):

| ano | salário (= palco) | cachês AV | ações | imagem | TOTAL med · p90 | notoriedade med |
|---|---|---|---|---|---|---|
| 1 | 2.796 · 10.272 | 0 · 1.900 | 300 · 6.840 | 0 · 0 | **6.180 · 29.494** | 10 |
| 3 | 43.632 · 143.628 | 19.970 · 101.100 | 5.790 · 30.970 | 7.200 · 130.800 | **105.270 · 326.958** | 37 |
| 5 | 237.816 · 633.996 | 49.650 · 330.070 | 27.800 · 68.770 | 253.200 · 410.400 | **548.586 · 1.315.280** | 72 |
| 6 | 390.828 · 1.306.284 | 67.830 · 469.570 | 33.630 · 70.330 | 362.400 · 451.200 | **1.004.412 · 1.715.850** | 80 |
| 10 | 1.696.884 · 2.942.004 | 57.520 · 742.200 | 66.720 · 73.020 | 488.400 · 531.600 | **2.264.694 · 3.960.324** | 87 |
| 20 | 1.687.500 · 2.891.328 | 101.190 · 320.250 | 39.980 · 73.610 | 517.200 · 598.800 | **2.318.754 · 3.820.846** | 88 |

- **Marcos de renda:** ≥ R$ 100 mil/ano em 30 de 30 (ano mediano 4); ≥ R$ 500 mil em 30 de 30 (ano 5); ≥ R$ 1 mi em 30 de 30.
- **Testes e contratos:**
  - 324 testes aprovados e 119 reprovados: **73% de aprovação**;
  - 534 contratos aceitos, dos quais 303 por convite direto (sem teste).
- **Carreira:** `ator_reconhecido` foi alcançado em 0 de 30 vidas. O degrau não importa; a renda vem do palco.
- O mesmo ator com técnica 60 dá praticamente o mesmo resultado: mediana de R$ 2,2 mi no 10º ano.

**Passivo** (só o emprego; nenhuma ação):

| ano | 1 | 5 | 8 | 10 | 13 | 20 |
|---|---|---|---|---|---|---|
| total med · p90 | 1.452 · 4.692 | 20.316 · 73.992 | 85.764 · 223.428 | 167.688 · 309.636 | 233.076 · 338.268 | **226.800 · 334.224** |
| notoriedade med | 6 | 23 | 36 | 43 | 45 | 45 |

**28 de 30 passam de R$ 100 mil/ano sem fazer nada.** A notoriedade vem da “freguesia” e chega a 45 por si.

### 1.2 Músico — renda anual (R$; mediana · p90). Emprego `musico_profissional`, técnica 66

| cenário | ano 1 | ano 5 | ano 10 | ano 20 | ≥ 1 mi/ano |
|---|---|---|---|---|---|
| Ativo, com banda (público 45): shows, edital, festas, lança, turnê | **1.939.234 · 4.382.090** | 14.548.958 · 22.716.094 | 9.765.528 · 17.679.638 | 8.215.788 · 16.800.998 | 30 de 30 (ano 1) |
| Passivo, sem banda | 4.356 · 11.160 | 50.448 · 318.948 | 500.364 · 968.100 | **710.820 · 1.135.236** | 26 de 30 |

- No ativo, a coluna “ações” alterna ~R$ 4,8 mi e ~R$ 40 mil: é a **turnê** (`conteudo/profissao.ts:702-710`), 20 datas × cachê exponencial, somada à agenda anual.
- Imagem: R$ 744 mil/ano no teto (notoriedade 100).
- Portas vistas pelo músico profissional (600 anos):
  - “Começaram a pedir” (`tocar_na_noite`): **107**;
  - “Uma banda” e “Uma banda procura alguém”: 85 + 82, inclusive para quem tem notoriedade 100.

### 1.3 Política — político de carreira (25→70, 20 vidas; disputa o cargo de cima quando a aprovação é ≥ 55)

- **Mandatos:** 20 de 20 se elegem; o primeiro mandato vem com 31 anos (mediana). São 9 vitórias por vida (mediana), 11 no p90.
- **Vitórias por cargo** [ganhou, perdeu]:

  | vereador | dep. estadual | dep. federal | senador | governador |
  |---|---|---|---|---|
  | 57/23 | 54/17 | **42/5** | 11/15 | **14/3** |

- **Crises e escândalos:** 116 crises; 0 cassações e 0 escândalos com a estratégia de “doações pequenas”.
- **Ações:** o mesmo conjunto em todos os cargos: `pol_candidatura, pol_comunidade, pol_negociar, pol_prioridade, pol_trocar_bandeira, pol_trocar_partido (+pol_crise)`.
- **`pedir_aumento` = permitido no motor em 433 de 623 anos de mandato.** A UI não mostra o botão, mas `disponibilidade` libera e `executar` abre “A conversa do aumento” com “a chefia” (`conteudo/desafios.ts:197-206`).

### 1.4 Submundo — `crime10` (N=20; 18→60)

| estratégia | presas | anos presos (med · p90) | ganhos por fora (med) | patrimônio aos 45 (p10 · med · p90) | renda aos 40 |
|---|---|---|---|---|---|
| honesta | 0% | 0 · 0 | 0 | 97.178 · 154.505 · 635.162 | 2.930 |
| carreira | 75% | 6 · 12 | 205.200 | −11.751 · 101.377 · 763.133 | 2.420 |
| fraude (aos 30) | 60% | 1 · 2 | 129.000 | −13.129 · 141.861 · 646.687 | 2.350 |
| arrependida | 0% | 0 · 0 | 13.700 | 93.674 · 173.081 · 230.488 | 2.780 |

Na vida inteira, o crime não compensa. **No ano ativo**, porém, ele é um salário certo, sem ano zerado.

### 1.5 Painel e verbos por ocupação (`modos.ts`, adulto de 30, técnica 85)

| ocupação | modo | o que aparece de impróprio |
|---|---|---|
| ator / ator conhecido | artista | (limpo; CAR-13 resolveu) |
| músico da noite / profissional / produtor musical | artista | “Baixar o preço”, “Formalizar como MEI”; verbos “Divulgar o trabalho no bairro”, “Caprichar… (o cliente exigente)” |
| músico de orquestra | servidor | “Fazer uma pós: adicional de titulação”, “Prestar outro concurso”; verbos “Almoçar com a chefia”, “**Fazer uma capacitação (curso da empresa)**”, “Assumir um projeto difícil” |
| bailarino | **empregado** | “**Pedir aumento**”, “Fazer horas extras”, “Procurar outra vaga”, verbos de chefia e “curso da empresa”; **nenhuma ação artística** (audição, edital, estreia) |
| escritor | **empregado** | “Procurar outra vaga”, verbos de chefia e “curso da empresa” (autônomo, sem freguesia: cai no `empregado`) |

---

## 2. Matriz

Legenda de Estado: ✅ existe e funciona · ⚠️ existe com defeito · ❌ não existe.

### 2.1 Atuação

| Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|
| ATR-01 Renda do ator: salário + cachê + bilheteria + imagem | `palco.ts:34,84-95`; `audiovisual.ts:228`; `cena.ts:189-198 (apresentar), 224-226 (edital), 279-286 (trabalho pequeno)`; `notoriedade.ts:223-235`; `dinheiro.ts:115-140` | ⚠️ P0 | Contagem tripla: a “temporada de palco” do ator vira salário; as peças contratadas (`teatro` em `BASE_TIPO`, `audiovisual.ts:55`) pagam cachê **e** contam na agenda; “apresentar” paga a bilheteria à parte. Ativo: R$ 1 mi no 6º ano; passivo: R$ 227 mil | `TRILHAS_DE_PALCO` inclui `cena` (`palco.ts:34`); `temporadaDePalco` sobrescreve `e.salario` (`palco.ts:95`) | dinheiro.razão, tela Trabalho (salário), notoriedade, CAR-15 | Alto: a economia inteira do jogo perde sentido para quem atua | **Tirar `cena` de `TRILHAS_DE_PALCO`.** O salário do ator vira “trabalhos miúdos” (aula, dublagem, leitura): `rendaDeClientela` com teto em `salarioLocal(oc)` (R$ 2.600; ator conhecido ≤ R$ 6.000). A renda de verdade é o **cachê** (já é a fonte única: `audiovisual.ts:75-98`) | `arte20` MODO=ator ACOES=0: mediana ≤ R$ 40 mil/ano no ano 20. Ativo: mediana do ano 10 entre R$ 60 mil e R$ 300 mil; ≥ R$ 1 mi/ano em ≤ 10% das vidas e nunca antes do ano 8 |
| ATR-02 Laço freguesia → notoriedade → alcance | `notoriedade.ts:78-82` (freguesia = clientela×0,45; nível ≥ 5 sem clientela = 70×0,45); `trabalho.ts:757-767` (a clientela sobe sozinha); `palco.ts:54-60` | ⚠️ P0 | O nome nasce de ter emprego: o ator parado chega a notoriedade 45; o ator conhecido nasce com 31,5. O nome alimenta o cachê exponencial e o patrocínio | A freguesia conta como nome; `alcanceNoPalco` usa `max(publico, freguesia, noto)` | Esporte (não muda), política (nome público na eleição) | Médio | Freguesia como nome: fator 0,2 e teto 15 (`Math.min(15, base*0,2)`). Ator conhecido: base 40, não 70. O nome deve vir de obra ou currículo que repercutiu | Ator passivo: notoriedade ≤ 20 no ano 20; ativo sem nenhuma repercussão ≥ 2: notoriedade ≤ 25 |
| ATR-03 Curva do cachê por apresentação | `palco.ts:63-66` (`1500·e^{x/15,6}·escala`), `palco.ts:84` (agenda ∝ (x/10)^1,45 ×1,4) | ⚠️ P1 | Teatro com alcance 70: R$ 40 mil por sessão × 24 sessões; alcance 100: R$ 274 mil por sessão | Exponencial sem teto por linguagem; ×1,4 para quem “vive do palco” | ATR-01 | Médio | Teto por linguagem: teatro ≤ R$ 25 mil por sessão, dança ≤ R$ 15 mil; música mantém o topo raro. Agenda com teto de 120 datas por ano | Teste de unidade: `cacheDeApresentacao(teatro, alcance 100) ≤ 25.000` |
| ATR-04 Testes, reprovação, devolutiva | `cena.ts:149-156,240-277`; `devolutivas` | ✅/⚠️ | Existem teste, motivo e parecer. Aprovação de **73%** no ativo: fácil demais | `chance = 0,3 + (h−exige)/70 + cv·0,15` (`cena.ts:250`), com folga de técnica | — | Baixo | Somar concorrência por porte (−0,05 × porte) e teto em 0,55 | `arte20` ativo: aprovação entre 35% e 55% |
| ATR-05 Histórico de projetos | `cena.ts:66-73` (currículo, 80); `audiovisual.ts:110-113` (30 contratos); `producoes.ts` (ficha, continuação, prêmio) | ✅ | — | — | — | — | Manter | — |
| ATR-06 Crítica × sucesso comercial | `audiovisual.ts:229-232` (`repercussao` única); `arte.ts:210-211` (`recepcao` única) | ❌ | Uma só nota (0..3) faz as vezes de crítica, público e prêmio | Modelo de uma dimensão | Prêmios (`producoes.premioDoTrabalho`), notoriedade | Baixo (design) | `repercussao` → `{critica, publico}`. O prêmio lê a crítica; o nome e o próximo cachê leem o público. Bilheteria fraca com crítica boa = “cult” | Em 200 conclusões, ≥ 10% com crítica ≥ 2 e público ≤ 1, e vice-versa |
| ATR-07 Progressão ator → ator conhecido | `trabalho.ts:797-813` (passo de clientela); `arte.ts:146`; `cena.ts:268-270` | ⚠️ | No ativo, 0 de 30 chegam a `ator_reconhecido`, porque os convites só vão para quem não vive disso. O degrau é decorativo: a renda já explodiu | O passo pede clientela ≥ 75 por 5 anos e 20% de chance | ATR-01 | Baixo | Promover por prestígio (`cena.prestigioArtistico ≥ 0,55`) no ano. O degrau muda o porte máximo dos testes e o convite direto, não o salário | Ativo: 30–60% chegam a ator conhecido até o ano 15 |
| ATR-08 “Cliente grande” para ator e músico | `conteudo/caminhos.ts:439-441` (+`aut_mes_fraco` 444-446) | ⚠️ | “Um cliente grande fechou com você e indicou outros três”, mais 1,5 salário (já inflado): 19 em 30 vidas de ator, 20 em 30 de músico | `quando` olha só `clientela ≥ 45` | ATR-01 | Médio (renda) | `&& !TRILHAS_ARTISTICAS.has(ocupacao(e.ocupacaoId).trilha)` | `arte20`: 0 ocorrências |

### 2.2 Música

| Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|
| MUS-01 Renda do músico (palco + turnê + show + festas + imagem) | `palco.ts:76-96`; `conteudo/profissao.ts:702-710`; `cena.ts:198,286`; `notoriedade.ts:223` | ⚠️ P0 | R$ 1,9 mi de mediana no 1º ano (com banda); R$ 711 mil por ano sem fazer nada | A turnê soma 20 datas **à parte** da agenda do ano; a curva exponencial; ATR-02 | ATR-02/03 | Alto | (a) A turnê ocupa datas da temporada: `estrada` grava `v.fatos['estrada_datas']`, e `temporadaDePalco` desconta essas datas e o cachê já pago. (b) Agenda com teto; ×1,4 → ×1,15. (c) Freguesia com teto no alcance | Passivo sem banda: mediana do ano 20 ≤ R$ 60 mil. Ativo: mediana do ano 1 ≤ R$ 60 mil; ≥ R$ 1 mi/ano em ≤ 10% das vidas |
| MUS-02 Solo × banda × instrumentista × compositor | `ocupacoes.ts:392-396` (`musico_noite`, `professor_musica`, `musico_profissional`, `musico_orquestra`, `produtor_musical`) | ❌ | Sem papel na música: carreira solo, integrante de banda, instrumentista contratado (sideman) e compositor são o mesmo emprego | Não modelado | Projeto (`arte.ts:111`, banda única), palco | — | `ProjetoArtistico.papel: 'solo' / 'banda' / 'contratado'` e `Emprego.funcao` na música. O compositor ganha **direitos** (MUS-03); o contratado ganha cachê fixo por data, sem público próprio | Uma vida com papel `contratado` tem renda estável e notoriedade ≤ 15 |
| MUS-03 Royalties / direitos autorais | `arte.ts:214-221` (renda da obra só no lançamento) | ❌ | A obra paga uma vez; o catálogo não rende | Não modelado | `v.caminhos.obras` | — | No ano: `Σ obras (recepção ≥ 1, ≤ 15 anos) renda×0,08×decaimento` como linha “Direitos de execução” em `entradasProprias` | Obra recepção 3 continua a render 5–10% por ano por 10 anos |
| MUS-04 Lançamentos, shows, turnês | `profissao.ts:886-895,987-994`; `palco.ts`; `cena.ts:189-234` | ✅/⚠️ | Existem; o número de datas e a turnê não se conversam (MUS-01). `palcos[]` guarda o histórico (`palco.ts:92`) | — | MUS-01 | — | Ver MUS-01 | — |
| MUS-05 Convite “Começaram a pedir · tocar na noite” ao músico | `oportunidades.ts:132-146` (lista em 138) | ⚠️ P1 | **O convite de “virar músico” para quem é músico** (107 vezes em 600 anos) | O gerador olha só a técnica (≥ 52) e a falta da rotina, nunca o emprego | `rotinas.tocar_na_noite` (`rotinas.ts:593`) | Médio (UX, renda extra) | Filtrar `possiveis` por `!trabalhaComArte(v, d) && ocupacaoOuNula(v.trabalho.atual?.ocupacaoId)?.habilidade?.dominio !== d` (vale para `freelas` de quem já é designer, programador etc.) | `arte20` músico: 0 portas “Começaram a pedir” com `musica` |
| MUS-06 “Tentar viver disso (banda, grupo, editais)” em Prática | `ui/jogo/Pratica.tsx:96,202` | ⚠️ P1 | Botão de “viver disso” para o ator e o músico profissionais (a condição não olha o trabalho) | `carreira = categoria arte && estágio ≥ 3 && !arte.ativo` | — | UX | `&& !trabalhaComArte(vida, p.d)` (de `sistemas/cena`) | Teste de UI: músico profissional abre Prática · música e não vê o botão |
| MUS-07 Convite de entrada da banda a quem já é do ramo | `arte.ts:146-158` (`jaVive` em 151) | ⚠️ | O músico de orquestra (trilha `orquestra`) recebe “Um convite para viver de música… dá para largar o resto”. O músico da noite (nível 2) recebe o mesmo texto de entrada | `jaVive` compara `trilha` exata; o texto não distingue promoção de entrada | `cena.TRILHA_DA` (`cena.ts:39`) | Baixo | `jaVive` = `trabalhaComArte(v, p.linguagem) && nível ≥ oc.nível`. Texto de **promoção** quando `trabalhaComArte` (“um produtor quer levar a banda para palcos maiores”) | Teste: músico de orquestra com banda pública 80 não recebe o convite em 50 anos |
| MUS-08 “Mostrar o trabalho” devolve o convite de entrada | `perseguir.ts:194,203,222-229` | ⚠️ | O ator conhecido com grupo pode “mostrar” e recebe o convite de `ator`; aceitar troca o emprego (rebaixa). O mesmo vale para o produtor musical e o músico da noite | `podeMostrar` compara `ocupacaoId === oc` | `oportunidades.aceitar` → `propor` | Médio | `if (trabalhaComArte(v, p.linguagem)) return bloqueio('impossivel', 'Você já vive disso.')`; a promoção fica no ATR-07 | Teste: `ator_reconhecido` + grupo ativo ⇒ `mostrar_trabalho` impossível |
| MUS-09 Convite obsoleto não sai das portas | `oportunidades.ts:73`; `mercados.ts:69-75` | ⚠️ | Um `convite` para a mesma trilha e nível ≤ ao atual, gerado antes da contratação, fica até 24 meses | `oportunidadeCoerente` devolve `true` para todo `convite` | — | Baixo | No filtro anual: tirar `convite` cuja ocupação tem trilha igual à do trabalho (ou da paralela) e nível ≤ | Teste: convite `ator` + contratar `ator_reconhecido` ⇒ some na virada |
| MUS-10 Verbos de freguesia para músico | `noOficio.ts:42,75-78`; `profissao.ts:591-597` | ⚠️ | “Divulgar no bairro”, “o cliente exigente”, “Baixar o preço”, “Formalizar como MEI”, “Equipamento próprio” | CAR-13 tirou só a trilha `cena` | MUS-02 | UX | Música: trocar por “Divulgar o show nas redes”, “Ensaiar o repertório novo”, “Cachê mais alto/baixo” (o preço vira cachê da data em `palco`) e tirar o MEI do topo | `modos.ts`: músico sem “bairro”, “cliente exigente” ou “freguesia” |

### 2.3 Política

| Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|
| POL-01 Portas, filiação, campanha, eleição, posse, fim | `politica.ts:434-488,599-700,762-880,989-1070`; `conteudo/politica.ts` | ✅ | Ciclo completo com regras (idade, domicílio, Ficha Limpa, reeleição, janela) | — | — | — | Manter | — |
| POL-02 Cargo determina as ações | `politica.ts:1362-1402` (`acoesPoliticas`) | ❌ P1 | O mesmo menu para vereador, prefeito, deputado, senador e governador. A diferença está só na chance de entregar (`:1254`), nos tipos de crise (`:1045`) e no subsídio (`:811-819`) | Não há verbos por casa (legislativo × executivo) | Conteúdo de crise (`conteudo/politica.ts:360`) | Médio (profundidade) | Verbos por cargo. **Legislativo:** “apresentar projeto de lei” (aprovação por base e aliança); “relatar”/“votar com ou contra o governo” (afeta partido e aliança); “fiscalizar” (CPI, que gera nome e risco). **Executivo:** “montar o secretariado” (aliados); “orçamento: priorizar X” (reparte o `feito`); “vetar”; “obra grande” (custa e pode virar escândalo). Senador e deputado federal: emendas para a base | `pol.ts`: conjuntos de ids distintos entre vereador e prefeito, e entre deputado e governador |
| POL-03 `pedir_aumento` no mandato | `acoes.ts:398-403` | ⚠️ P1 | O motor libera (433 de 623 anos de mandato) e abre “A conversa do aumento… com a chefia” (`desafios.ts:197-206`); o subsídio é fixado em lei | A lista de bloqueio não inclui `eletivo` | `prisao.ts:47` (semiaberto pode pedir aumento) | Médio (exploit, incoerência) | Bloquear `eletivo` com o motivo “O subsídio é fixado em lei pela casa, não se negocia.” Rever também `SEMIABERTO_PODE` | `pol.ts`: 0 anos de mandato com `pedir_aumento` permitido |
| POL-04 Dificuldade das eleições | `politica.ts:630-697` | ⚠️ | 95% de vitória para deputado federal e 82% para governador no político de carreira | `nome` usa a reputação, que cresce no mandato (+1,5 por ano no estadual); a disputa é constante | — | Baixo | A dificuldade cresce com o cargo de origem (quem sobe enfrenta incumbentes) e a reputação satura por escopo; alvo de 50–65% para deputado federal e 35–50% para governador, para quem tem mandato | `pol.ts`: taxas dentro da faixa |
| POL-05 Alianças | `conteudo/politica.ts:341-350` (`pol_negociar`); `politica.ts:1347-1360` (`aliado`) | ⚠️ | Uma decisão por ano e um único “aliado”. Não há rede, coligação ou cobrança de promessa feita | Modelo raso | POL-02 | Baixo | Aliados como lista, com dívida (promessa → cobrança na crise “aliado”) | Promessa de espaço não cumprida gera crise “aliado” em ≤ 2 anos |
| POL-06 Escândalos e corrupção | `politica.ts:1087-1115`; `conteudo/politica.ts:221-247,411,423`; `ilicito.ts:58-66,109-112` | ⚠️ | A corrupção do político só nasce do financiamento ou do favor (`pol_risco`). `ilicito.temAcesso` não inclui a trilha `politica`, então o mandatário não recebe a porta `corrupcao` | A trilha `politica` falta em `temAcesso` | Submundo | Baixo | Incluir `oc.trilha === 'politica'` em `temAcesso` e em `categoriaPara` → `corrupcao` | Vereador corrupto: a porta `corrupcao` aparece |
| POL-07 Ações corporativas no político | `profissao.ts:91,558-570`; `noOficio.ts:41`; `conteudo/caminhos.ts:409,422,432` | ✅ | O painel não mostra aumento, chefia ou curso (modo `politica`); os acontecimentos de chefia excluem `eletivo` | — | POL-03 (o motor ainda libera) | — | — | `pol.ts`: verbos do ofício em mandato = [] (ok) |

### 2.4 Submundo

| Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|
| SUB-01 Categorias e níveis | `ilicito.ts:45-52,104-117,304-310` | ✅/⚠️ | Seis categorias (pequenos, patrimonial, fraude, mercado, grupo, corrupção) × 3 níveis. Não há **especialização** nem escolha de rumo dentro da categoria | Escalar é uma rampa só (`escalar`) | — | — | Especializações por categoria, com atributo próprio (técnica de evitar exposição, rede de receptação), sem descrever método | Duas vidas na mesma categoria com especializações diferentes têm exposição e renda diferentes |
| SUB-02 Renda garantida | `ilicito.ts:220-224` | ⚠️ P1 | Ativo = salário certo: 0,6–1,4 × tabela, 65% creditado, **todo ano**; não há ano zerado nem perda | Sorteio sem falha | `margem` | Médio | Ano com 15–25% de chance de “não render” (+ dívida com o grupo no nível ≥ 2); o ganho depende de `reputacao` e da conjuntura (`economia.fase`) | Em 100 anos ativos, ≥ 15 anos com ganho 0 |
| SUB-03 Contatos | `margem.ts:43-44,129` | ⚠️ | A lista de contatos só aparece no texto (“N pessoas do caminho sabem o seu nome”) | Não consumida | — | Baixo | O contato traz o trabalho maior (`ilic_trabalho`) e pode delatar (o cerco). Perder o contato (morte, prisão) reduz a renda | O trabalho maior pede ≥ 1 contato vivo |
| SUB-04 Reputação no meio, trabalhos maiores, atritos, cerco | `margem.ts:36-53`; `conteudo/margem.ts:28-110` | ✅ | O trabalho maior falha em 12–24% (`conteudo/margem.ts:38`) | — | — | — | Manter | — |
| SUB-05 Consequências legais | `justica.ts`, `tribunal.ts`, `prisao.ts` | ✅ | `crime10`: 75% presos na estratégia carreira; 13 de 15 voltam ao trabalho; reabilitação existe | — | — | — | Manter | `crime10` sem regressão |
| SUB-06 Saída | `ilicito.ts:312-321`; `margem.ts:56-...` (procurar ajuda, negociar saída, `precoDaSaida`) | ✅ | — | — | — | — | Manter | — |
| SUB-07 Mercado clandestino, inventário, território | — | ❌ | Reservado ao REWORK 11 (`docs/REWORK10.6…:265`) | — | SUB-01..03 | — | Mercado abstrato (oferta e demanda local por categoria, rival que cresce, território = município), inventário abstrato (“mercadoria parada” como risco de exposição), nunca método | Testes de abstração: nenhum texto descreve como fazer |

### 2.5 Ações corporativas em carreiras impróprias (Q5)

| Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|
| COR-01 Bailarino = empregado | `profissao.ts:117` (artista exige clientela ou trilha `cena`) → cai em `empregado` (`:558-570`) | ⚠️ P1 | “Pedir aumento”, horas extras, “Procurar outra vaga”, verbos de chefia e “curso da empresa”; sem audição, edital ou estreia | O critério de `artista` é clientela ou `cena` | `noOficio` (COM_CHEFIA) | UX | `f.progressao === 'arte' → 'artista'` para trilhas de palco (`danca`) independentemente da clientela; em `acoesArtisticas`, `teatro` já cobre a dança | `modos.ts`: bailarino em modo `artista`, com audição e sem aumento |
| COR-02 Escritor = empregado | idem (`literatura`, autônomo sem clientela) | ⚠️ | “Procurar outra vaga”, chefia, “curso da empresa” | idem | — | UX | Idem (`criacao`, progressão `arte`) → `artista` com “lançar” (livro) e edital | `modos.ts`: escritor sem chefia |
| COR-03 Músico de orquestra = servidor | `profissao.ts:118` | ⚠️ | “Curso da empresa”, almoço com a chefia, “Prestar outro concurso”; sem obra nem palco | A trilha `orquestra` é tratada como serviço público genérico | `car_curso_empresa` (`caminhos.ts:431-436`, contrato `servidor`) | Baixo | Modo `artista` com “temporada da orquestra”, “solista convidado” e “concurso de outra orquestra”; excluir `orquestra` de `car_curso_empresa` | `modos.ts`: sem “curso da empresa” |
| COR-04 Freguesia nos músicos | `noOficio.ts:42,75-78`; `profissao.ts:591-597` | ⚠️ | Ver MUS-10 | — | — | — | — | — |
| COR-05 Acontecimentos de autônomo nos artistas | `conteudo/caminhos.ts:439-446` | ⚠️ | Ver ATR-08 | — | — | — | — | — |
| COR-06 Político | `acoes.ts:398-403` | ⚠️ | Ver POL-03 (só no motor) | — | — | — | — | — |

---

## 3. Mudanças mínimas propostas (ordem sugerida)

1. **Economia artística (ATR-01/02/03, MUS-01, ATR-08):**
   - `palco.ts:34`: `const TRILHAS_DE_PALCO = { musica: 'musica' }`. O ator sai da agenda de palco; a temporada continua valendo para a banda do ator via projeto.
   - `trabalho.ts:767`: para a trilha `cena`, `e.salario = Math.min(rendaDeClientela(...), salarioLocal(oc, e.municipioId))`. Para o ator conhecido sem clientela, salário de tabela R$ 15.000 → R$ 5.000 (`ocupacoes.ts:398`), descrito como “trabalhos miúdos”; o cachê é a renda real.
   - `notoriedade.ts:80`: `base = x.clientela ?? (oc.nivel >= 5 ? 40 : 25)` e `Math.min(15, base * (paralela ? 0.15 : 0.2))`.
   - `palco.ts:59`: `Math.max(publico, Math.min(freguesia, 30), noto)`. Em `palco.ts:65`, teto por linguagem: `Math.min(TETO[d], …)` com `TETO = { musica: 900_000, teatro: 25_000, danca: 15_000 }`.
   - `palco.ts:84`: `×1,4 → ×1,15`, e `apresentacoes = Math.min(120, …) − (v.fatos['estrada_datas_ano'] === anoDe(v.t) ? datasDaTurne : 0)`.
   - `conteudo/profissao.ts:707`: gravar as datas da turnê para o desconto.
   - `conteudo/caminhos.ts:440,445`: excluir `TRILHAS_ARTISTICAS`.
   - **Teste de aceitação:** `arte20` com as metas da matriz, mais um teste de unidade “o ator não recebe palco como salário” (`trabalhoDePalco` falso para `ator`).
2. **Convites coerentes (MUS-05..09):**
   - `oportunidades.ts:143`: filtrar o ofício do próprio trabalho;
   - `Pratica.tsx:96`: `!trabalhaComArte(vida, p.d)`;
   - `perseguir.ts:203`: `trabalhaComArte`;
   - `arte.ts:151`: `trabalhaComArte(v, p.linguagem)` com comparação de nível, e texto de promoção;
   - `oportunidades.ts:73`: tirar o convite rebaixado ou repetido.
   - **Teste de aceitação:** `arte20` (portas vistas) com zero “Começaram a pedir” ou “viver de” para quem já vive disso.
3. **Modo de trabalho artístico (COR-01..03, MUS-10):**
   - `profissao.ts:117`: `if (f.progressao === 'arte') return 'artista'`, para todas as trilhas da família `palco` e `criacao` que não são CLT de agência (rever `design`, `comunicacao`);
   - `noOficio.ts:75`: vocabulário próprio para a música;
   - `caminhos.ts:432`: excluir a trilha `orquestra`.
4. **Política (POL-03, POL-06 já; POL-02 e POL-04 no REWORK 11):**
   - `acoes.ts:399`: incluir `'eletivo'`;
   - `ilicito.ts:65`: incluir `'politica'` em `temAcesso` e `categoriaPara`.
   - POL-02: tabela `VERBOS_DO_CARGO: Record<CargoEletivo, OquePolitica[]>` consumida por `acoesPoliticas`.
5. **Submundo (SUB-02/03):**
   - `ilicito.ts:221`: `const rende = !r.chance(0.18 - (env.reputacao ?? 0) / 500)`; sem render, ganho 0 e, no nível ≥ 2, `env.atritos++`.
   - Contatos: exigir um contato vivo para `ilic_trabalho` (`margem.ts:51`).

## 4. Riscos de regressão

- **Testes que fixam a renda do ator/palco:** procurar `temporadaDePalco` e `trabalhoDePalco` nos testes (`__tests__/fixPosRework3.test.ts:68-91`, `rework106.test.ts`). Também `fama105` e `seguidores9`, porque notoriedade 90 é fixada à mão.
- **CAR-15** (`trabalho.ts:482-500`): ao tirar o palco do ator, a unificação divide o salário pelo `FATOR_PARALELA`. Revisar o teto.
- **Saves:** quem já é ator com salário alto (palco) precisa de recálculo na carga (`save.ts:1587`, junto da unificação).
