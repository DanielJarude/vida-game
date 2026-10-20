# REWORK 9.7 — AUDITORIA GERAL

Correções de bugs, balanceamento e polimento antes do REWORK 10.

> Não um jogo artificialmente equilibrado em que todos têm a mesma vida: regras consistentes, e vidas diferentes possíveis.

---

## 1. Estado inicial e commits

| | |
|---|---|
| Repositório · branch | `DanielJarude/vida-game` · `claude/fix-pos-rework3-playtest` |
| Commit-base | `435f284` — REWORK 9.6 · Fase E (presente e conferido; working tree só com `.claude/`) |
| Baseline | **1505/1506** testes em 12,5 min (a única falha, `fechamentoMundo` #4, é o limite fixo de 60 s sob carga, conhecida desde o 9.5); `tsc` limpo; maior bundle 774,1 kB |
| Save | **v20**, sem versão nova: os campos novos são opcionais (`EscolaBasica.notas`, `FotoDoAno.notas`, `PerfilEducacional.notas`); uma normalização nova no carregamento (`normalizarRework97`) |

| Commit | Fase |
|---|---|
| `0c3dae4` | A — notas na escala, Saúde 100, futebol adulto, liga e seguidores com causa; **P0 da agenda**; semana da criança |
| `12b8949` | B — atributos, escolhas, NPCs, economia e sorteios |
| (este) | C e D — fragilidade no zero de saúde, textos e boletim (polimento), simulações, auditoria visual, montagens `docs/rework97/`, este relatório |

Sem merge na `main`, sem force push, sem deploy manual, APK não regenerado, `.claude/` fora dos commits.

**Método.** Os problemas relatados foram tratados como hipóteses: cada um foi reproduzido por simulação antes de mexer
(a base num `git worktree` de `435f284`, os mesmos scripts nas duas versões). Depois dos cinco relatados, sete frentes de
auditoria (atributos, agenda e escolhas, NPCs, economia, motor anual e sorteios, interface) foram investigadas por
simulação — cada achado com arquivo, linha, fórmula e número.

## 2. Rastreabilidade

Legenda: **Corrigido** · **Já corrigido antes** (reproduzido na base antiga, não na atual) · **Recalibrado** ·
**Intencional** · **Pendente**.

| Problema | Reprodução | Causa real | Correção | Teste | Resultado |
|---|---|---|---|---|---|
| **P0 · o ano trava** (achado) | 540 vidas, 9 estratégias: **84 travamentos na base** (15,6%), "Maximum call stack size exceeded" aos 17–18 | `agenda.ts`: o turno do meio período procura um horário contra o curso (`turnoQueCabe` → `blocosFixos` → `blocosDeEstudo`), e o curso sem turno guardado procura o seu contra o trabalho (`turnoQueCabeContraTrabalho` → `blocosDoTrabalho`): volta sem fim (estágio/jovem aprendiz + curso técnico) | Trava de reentrada: na volta, o trabalho fica no turno padrão e o curso se encaixa em volta | `rework97` P0 (estágio + técnico: monta a semana, turnos diferentes, o ano passa) | **Corrigido** — 0 travamentos em 540 vidas |
| **EDU-04 · notas que crescem** | Simulação de 150 e de 1.000 alunos: o desempenho do ano sobe e cai (inclinação mediana +0,1 ponto/ano); o boletim mostrava 7 → 48 | Não era o motor: **não existia nota por matéria**. O boletim (REWORK 9.5/9.6) escrevia à mão, na coluna da nota, o **domínio** da matéria (0–100, o conhecimento, que cresce de ~3 aos 6 anos a ~50 aos 17) | `escola.notasDoAno`: a nota de cada matéria do ano (0–10), do desempenho do ano (que já compara o que se sabe com o que a série pede) deslocada pela matéria (±2), acaso derivado; escala do país (`PerfilEducacional.notas`: PT/FR 0–20, US/CA percentual; o resto 0–10); o boletim separa **Nota** (à mão) e **Conhecimento** (impresso, com o esperado na série); histórico com notas | `rework97` EDU-04 (6 vidas inteiras; escala; matéria forte × fraca; save antigo); `ui/rework97` (aos 16 a nota escrita ≤ 10 e o domínio > 10); `rework96` VIS-02 reescrito | **Corrigido** — 45.292 notas em 1.000 alunos, 0 fora da escala |
| **SAU-01 · Saúde nunca 100** | 5.000 nascimentos: máx. 99; vidas ao acaso 0–35: 0% chegam a 100; "ideais": 3% | `criacao.ts`: `Math.min(99, …)` no nascimento; `estado.fatoresSaude`: as referências 90 (<18) e 84 (18–34) com o melhor físico e a melhor constituição seguravam o equilíbrio em 96–99 | Nascimento até 100; referências 92/87; constituição ±8 | `rework97` SAU-01 (deriva perto de zero em 100 na juventude forte e ativa; nunca > 100 numa vida; condição pesa) | **Corrigido** — ao acaso 0–35: 5% chegam a 100, 43% a 95 (antes 0% e 18%); por estratégia até os 80: 5–20% (antes 0–6%) |
| **FUT-02 · futebol depois dos 20** | 30 vidas por cenário: começar aos 25 com técnica 80 → **0/30, nenhuma oferta** | `perseguir.janelaDaBase` [11,17] bloqueava todo pedido depois dos 17; a porta amadora (`esporte.ts`) só de 17 a 24 e nunca para quem já foi profissional; o adulto aprendia esporte a 60% aos 25 e 35% aos 30 | Depois da base, "pedir teste" é o **teste no time adulto de um clube pequeno** (até 30; pede técnica perto do estadual; ≤ 2 na vida e 5 somados aos da base; −0,05/ano de idade depois dos 21, até −0,22); a porta espontânea até 30 (inteira até 24, depois 60% → 10%, e pede técnica claramente acima do estadual), reabre para o ex-profissional; aprendizado adulto 72% aos 25, 55% aos 30; Caminhos mostra a porta | `rework97` FUT-02 (aos 22 e 27 pode pedir; técnica baixa barra pelo nível, não pela idade; depois dos 30, não; passar leva ao contrato; ex-profissional volta; profissional aos 19 joga até os 30) | **Corrigido** (tabela §4) |
| **FUT-01 · Série B duas vezes** | Base antiga (`bd77c3d^`): 25 de 68 pares de temporadas falharam (Remo 1º na B, ficou na B) | Corrigido no REWORK 9 (o teto pelo porte "tradicional = Série B" e a falta de tabela por clube) | Aqui: o nome da competição pelo país do clube; o campeão registrado quando a tabela do país já tinha sido jogada | `rework97` FUT-01 (3 vidas × 8 temporadas com save/load: divisão seguinte = anterior ±1 pelo acesso/queda; top 4 da B sobe) | **Já corrigido antes**; 2 detalhes corrigidos |
| **SOC-01 · 40 mil → 537 mil** | Craque/político com 0–2 posts: 21 anos com crescimento > 3× (até 6,1×) | `redes.exposicaoDoAno`: o impulso `subiu × 0,12` era absoluto (a curva do nome é quadrática: 64 → 83 valia ~250 mil), igual para conta de 40 mil e de 4 milhões, com ou sem post, e chegava um ano depois do motivo, rotulado só "notoriedade 64 → 83"; o balanço mostrava "os dois últimos marcos" de qualquer tema | Sem acontecimento público recente (marco/biografia de trabalho ou lazer nos últimos 2 anos), o impulso cabe na conta (≤ 30% parada, 80% publicando pouco, 150% publicando sempre); com ele, livre, e o motivo o nomeia; um salto (≥ 20 mil e ≥ dobrar) vira linha da vida com a causa; o balanço só mostra acontecimentos públicos | `rework97` SOC-01; `rework9` SOC-01 reescrito (o salto legítimo agora com o acontecimento) | **Corrigido** — o salto continua possível e passa a ter causa escrita |
| ROT-04 · a 4ª atividade da criança | 9 anos, futebol a sério + luta: **a 3ª (dança) já era recusada** (~6 h de esporte/semana, 55 h livres na agenda) | O teto da criança (base + 0,75) era exatamente o fim da faixa "cheia": a faixa "sobrecarregada" não existia para ela; a exigência ignorava a duração (agenda 90 min, aula real ~60) | Teto base + 1,25 (meio pedaço de "sobrecarregada", com o custo de sempre); aula de esporte da criança de 1 h, a mesma duração na agenda e na exigência | `rework97` ROT-04 (natação cabe com o preço dito; a quinta coisa, não) | **Recalibrado** |
| BAL-01 · escolhas dominantes | Pares de vidas iguais: dedicação × ritmo: nota 65 × 56, **estresse menor**; treino a sério da criança: técnica ×2, **0 lesões** | O tempo livre não valia nada (só o excesso da semana pesava); o esporte amador não machucava | Folga de verdade alivia (−3/−1); dedicação +3 de estresse, o mínimo −2; esporte amador machuca (~1–3%/ano por atividade, quase sempre leve) | `rework97` BAL-01 | **Recalibrado** — pós-fixado × reserva: **intencional** (§5) |
| ATR-02 · inteligência | 540 vidas: perfil "estudos" aos 30 mediana **83** (p90 93) | A faculdade somava +2/ano fixos por fora do teto, além do estímulo do ano | Sai o fixo (o estímulo já conta, com teto e retornos decrescentes) | `rework97` ATR-02 | **Corrigido** — mediana 69, p90 75 |
| ATR-02 · físico | Mesmo treino, físico escolhido 20 × 85: **36 pontos** de diferença (sem treino, 24); criança de 10 a 97 | Amplitude adulta da predisposição 12 e ±6 no treino; teto e resposta adulta na criança | Amplitude 7, ±4; teto 88 e treino 0,6 até os 14 | `rework97` ATR-02 (< 25 pontos) | **Recalibrado** |
| ATR-02 · felicidade | Vidas estáveis: 68 aos 35 → 43 aos 65 | Âncora fixa 60 da saúde no humor (todo idoso perde por envelhecer); o desgaste do casal −16 mesmo cuidado | Saúde comparada à da idade depois dos 60; casal que se cuida e sem tensão desgasta a metade | suíte | **Recalibrado** (a "felicidade baixa" do 9.6 era sobretudo a política "primeira opção", que nunca procura trabalho) |
| ATR-02 · beleza e estética | Iniciativa de interesse 4,5× entre aparência 85 e 25; procedimento sumia em ~4 anos; humor em dobro | `iniciativas.ts` sem o gosto de quem olha; a referência não subia; `estetica.ts` mudava o humor direto e pelo abalo | Peso pelo gosto, mínimo 0,05; o resultado sobe a referência; humor só pelo abalo; texto "o estilo" trocado pelos procedimentos (o que o motor faz) | suíte | **Corrigido** |
| NPC-02 · pessoas do mundo | 60 vidas, 7 países: tia de 88 pescando, avó de 84 bancária, irmão auditor fiscal sem faculdade, "dono de empresa" com cargo de manicure e renda 0, chefia com renda 0, 528 conhecidos com renda sem cargo | Avós com `continue` antes da aposentadoria; irmãos/tios/primos sem carreira depois dos 18; cargo da lista da classe sem escolaridade; negócio do amigo só como rótulo; conhecidos com renda de 1.500–8.000 em qualquer moeda | `filhos.empregarAdulto` (cargo + nome + renda pela escolaridade, no país); aposentadoria de avós e parentes; primo adulto trabalha; negócio do amigo vira `dono_comercio` com renda (só de quem trabalha); chefia com salário; formação para o adulto de partida com ofício de formação | `rework97` NPC-02 | **Corrigido** |
| NPC-02 · irmãos e herança | 52 irmãos de partida sem `genitores` | `criacao.ts` nunca preenchia; a herança real procura herdeiros por `genitores` | Preenche na criação; `normalizarRework97` no carregamento | `rework97` NPC-02 (nova vida e save antigo) | **Corrigido** |
| ECO-01 · aposentadoria | 40 anos a 3 mínimos: aposentadoria ÷ salário líquido = **1,78 na Alemanha**, 1,52 na França | A regra do INSS (+2%/ano além do mínimo) em todo país, com mínimos de 1–5 anos; benefício bruto ×13/12 em todo lugar | +2%/ano só no Brasil (0,5% fora); pago líquido do IR do país, com os meses do país | `rework97` ECO-01 (BR e DE) | **Corrigido** |
| ECO-01 · BPC | 1,08 milhão na conta e BPC | Sem teste de renda nem de patrimônio | Renda própria ≤ ½ mínimo e guardado ≤ 60 mínimos | suíte | **Corrigido** |
| ECO-01 · seguro-desemprego | 1 ano de emprego em Portugal: 50.793 de uma vez (11 meses), recontratada em seguida | Parcelas fixas do país + 1, piso de um mínimo inteiro | Parcelas pelo tempo de casa (1,5 por ano, até as do país), piso de 0,6 mínimo | suíte | **Corrigido** (pagamento ainda de uma vez — §9) |
| ECO-01 · salário do ano da demissão | Trace PT: nenhuma linha de salário no ano | A demissão fecha o trabalho antes das contas do ano | Os meses trabalhados (até 6) entram como "Salário até a demissão" | suíte | **Corrigido** |
| ECO-01 · herança e reserva | Reserva de 667 mil sumiu; 1,158 milhão de uma tabela apareceu | A herança vinha da tabela da classe e a reserva real era zerada | A reserva acompanhada é o que se herda | suíte | **Corrigido** |
| ECO-01 · aluguel no exterior | SP → EUA: rendimento 4,2% → 8,7% | `aluguelDe` nos preços do país do imóvel, sem a conversão que o valor recebe | Convertido como o valor | suíte | **Corrigido** |
| ECO-01 · dinheiro que não existe | 77 contas negativas no fim do ano em 40 vidas (assalto de −1.500 com conta zerada → "nome sujo" sem dívida) | `conteudo/efeitos.dinheiro` somava qualquer negativo | Um acontecimento tira no máximo o que há | `rework97` ECO-01 | **Corrigido** (a escala por moeda das quantias fixas: §9) |
| Sorteios (FNV sem mistura) | Edital aberto **10,9 anos seguidos** em média (ideal 1,4); estatura com desvio ×1,8 (20% dos homens ≥ 1,90 m); clube amador repetido 45%; Força quase fixa; cargo de egresso preso aos 3 primeiros | Chaves que mudam só no fim (o ano, "a/b/c") sem avalanche; o mesmo número para o teste e para o índice | `rng.misturar`/`hashMisturado` (o finalizador que `rural` usa desde o 7.5) nesses pontos; réguas de vôlei e basquete recalibradas **nos mesmos percentis** da população de antes; outro número para o cargo | `rework97` (estatura, edital) | **Corrigido** — os outros hashes testados (χ², correlação serial) estavam bons |
| Desempenho > 100 | Visto 102 | `+=`/`−=` sem limite em `escolhas.ts` e `infancia.ts` | Limitados a 5..100 | invariante na simulação | **Corrigido** |
| Saúde zero por anos | Mediana de saúde aos 70 = 0–2 nos perfis "social" e "arriscado", vivos | Aos 60 com saúde 0, risco ~11%/ano | Abaixo de 15, risco extra de até 22,5%/ano | `rework97` Motor | **Corrigido** |
| −0 no save | Ida e volta não idêntica (`aptidao: -0`) | O arredondamento de um negativo pequeno; o JSON grava 0 | `+ 0` na fonte | `save` (ida e volta) | **Corrigido** (o mesmo tipo do 9.6) |
| UX-12 · boletim | "14de 20"; "Faz das melhores redações da turma. Há 7 anos." | A nota girada encostava no texto; o tempo da frente sem dizer de quê | Margem; nas matérias o tempo não se diz; no resto, "Pratica há N anos" | auditoria visual | **Corrigido** |

## 3. As notas (EDU-04) em números

1.000 alunos, da creche ao fim do médio, três posturas (`scripts/sim/notas97.ts`, N=1000):

| idade | dedicada (p10 · média · p90) | no ritmo | empurrando | domínio médio (no ritmo) | esperado na série |
|---|---|---|---|---|---|
| 7 | 5,8 · 6,9 · 8,2 | 5,3 · 6,3 · 7,3 | 4,5 · 5,4 · 6,7 | 6,8 | 6,1 |
| 12 | 6,1 · 7,6 · 9,2 | 4,9 · 6,4 · 7,9 | 3,4 · 4,8 · 6,4 | 27,1 | 26,1 |
| 16 | 6,4 · 8,0 · 9,6 | 5,0 · 6,6 · 8,4 | 2,9 · 4,6 · 6,5 | 42,7 | 40,9 |
| 17 | 6,1 · 7,9 · 9,7 | 5,0 · 6,6 · 8,4 | 2,8 · 4,5 · 6,3 | 45,9 | 44,4 |

- 45.292 notas por matéria; **0 fora de 0..10**. O domínio vai de 7 a 46; a nota "no ritmo", de 6,3 a 6,6.
- Toda vida teve anos de queda (média 4,7) e de subida (4,3); nenhuma vida só subiu.
- A dedicação sobe a nota com o tempo (a vantagem se acumula, e a régua da série sobe junto: não é "crescimento por
  envelhecer"); empurrar faz cair. A inteligência pesa (`calcularDesempenho`, inalterado), sem garantir 10.
- Portugal e França dão de 0 a 20 (aprovação 10); EUA e Canadá, percentual; o resto, 0 a 10 com aprovação 5 (a
  reprovação do motor, desempenho < 38, cai perto de 4,8).

## 4. Futebol (FUT-02) em números

30 vidas por cenário, homem, futebol a sério, pede teste e treino de fundamentos todo ano, aceita toda oferta (o script
do agente de auditoria, na versão final):

| cenário | profissionais | idade de entrada | técnica mediana (20 · 26 · 30) |
|---|---|---|---|
| começa aos 8 | 13/30 (base: 10/30) | 19 | 76 · 79 · 79 |
| começa aos 15 | 0/30 | — | 51 · 63 · 66 |
| começa aos 20 | 0/30 | — | — · 33 · 43 |
| começa aos 25 | 0/30 | — | — · 8 · 24 |
| 21 anos, técnica 78 | 22/30 (base: 6/30) | 22 | 78 · 80 · 80 |
| 25 anos, técnica 80 | 3/30 (base: **0/30**) | 26 | 80 · 80 · 80 |
| 28 anos, técnica 78 | 3/30 (base: **0/30**) | 30 | — · — · 78 |
| 14, físico alto, técnica 60 | 12/30 | 21 | 73 · 77 · 77 |
| 14, físico baixo, técnica 70 | 15/30 | 21 | 75 · 78 · 79 |
| começa aos 8, lesão grave aos 23 | 13/30 | 19 | carreiras até 34–40 |

- O que impede quem começa tarde é a **técnica** (o adulto aprende mais devagar), não uma regra de idade; com técnica,
  dá — cada vez mais estreito. A carreira de quem é profissional segue até 33–40 ("sem contrato").
- O teste `caminhos` 9/10 ("virar profissional é raro") passou de "profissionais × 3 < quem tentou" para "≤ 40%" e
  ganhou uma afirmação: quem entra pela porta amadora depois dos 24 tem técnica ≥ 80. Justificativa: na amostra (40 vidas
  que treinam a sério desde os 6 e aceitam tudo), as duas vidas a mais têm técnica 83–84, **acima do titular da Série B**,
  e só ficavam de fora porque a porta fechava aos 24 — exatamente o bug. Na população geral (§6), 13% do perfil
  "esportes" vira profissional; os demais perfis, 0%.

## 5. Balanceamento: o que mudou, e o que é intencional

- **Saúde:** o melhor caso chega a 100 (raro); o comum fica 2–3 pontos acima de antes na juventude. O risco de morte
  com saúde muito baixa (< 15) passou a crescer por fora da idade.
- **Inteligência:** a escola e a faculdade exercitam com teto; diferenças individuais preservadas (p10–p90 aos 30 no
  perfil "estudos": 59–75; antes 74–93).
- **Físico:** o treino pesa mais que a predisposição; a criança não chega ao corpo do atleta adulto.
- **Felicidade:** a velhice não perde humor só pela saúde da idade; o casamento cuidado desgasta menos. A felicidade
  baixa do perfil "pouco ativo" (mediana 24–41) é coerente: sem trabalho, sem relações.
- **Tempo livre** passou a valer (−3 de estresse com folga de verdade); a dedicação aos estudos custa +3; estudar o
  mínimo alivia −2 e custa nota e matérias. **Treinar a sério** custa lesões (leves, raras).
- **Intencional:** a renda fixa pós-fixada rende mais que a conta remunerada com o mesmo risco — como no mundo real; o
  custo dela é o mínimo de aplicação e o resgate em um ou dois dias. Nenhuma ação de compra e venda gera lucro
  (imóvel −10% na volta; veículo 72–93%; coisas 50%).

## 6. Simulação populacional

`scripts/sim/populacao97.ts` (com as estratégias novas `esportista` e `aleatorio` em `scripts/sim/estrategias.ts`):
9 estratégias × 60 vidas até os 80, 7 países (BR ×3, PT, US, AR, JP, NG, DE), 5 classes, os dois gêneros — **540
vidas, 36.558 anos**. As mesmas vidas na base (`435f284`).

| | base 435f284 | depois |
|---|---|---|
| Travamentos | **84** (15,6% das vidas; P0 da agenda, aos 17–18) | **0** |
| Violações (atributo fora de 0..100, nota fora da escala, valor não finito, renda negativa) | 0 | 0 |
| Inteligência aos 30, perfil "estudos" (p10 · mediana · p90) | 74 · 83,4 · 93 | 59,2 · 68,6 · 75 |
| Inteligência aos 30, perfil "arriscado" | 44 · 57 · 73 | 49 · 57 · 74 |
| Chegou a Saúde 100 (por perfil) | 0–6% | 5–20% |
| Virou atleta profissional (perfil "esportes") | 8% | 13% |
| Anos com seguidores ×3 (conta ≥ 10 mil, sem perfil influencer) | 0 | 0 |

Por estratégia, depois (p10 · mediana · p90):

| medida | equilibrado | estudos | carreira | esportes | relações | dinheiro | pouco ativo | aleatório | arriscado |
|---|---|---|---|---|---|---|---|---|---|
| nota média na escola | 5,2 · 7 · 8,6 | 7,4 · 8,5 · 9,2 | 7,1 · 8 · 9,1 | 5,5 · 7 · 8,4 | 5,7 · 6,9 · 8,1 | 6,6 · 8,2 · 9,2 | 5,5 · 6,8 · 8,2 | 5,3 · 6,8 · 8 | 4,4 · 5,3 · 6,4 |
| físico aos 40 | 41 · 48 · 55 | 28 · 33 · 37 | 60 · 66 · 72 | 55 · 63 · 72 | 28 · 32 · 37 | 51 · 56 · 64 | 24 · 32 · 39 | 46 · 65 · 79 | 22 · 28 · 33 |
| saúde aos 50 | 16 · 34 · 57 | 53 · 71 · 80 | 60 · 75 · 86 | 48 · 74 · 88 | 58 · 73 · 79 | 55 · 76 · 84 | 45 · 63 · 76 | 36 · 55 · 79 | 19 · 37 · 53 |
| felicidade aos 50 | 35 · 65 · 81 | 40 · 58 · 70 | 36 · 51 · 62 | 45 · 61 · 78 | 39 · 67 · 81 | 16 · 43 · 64 | 8 · 30 · 48 | 37 · 60 · 78 | 24 · 57 · 77 |
| trabalhando aos 40 | 78% | 88% | 76% | 79% | 85% | 78% | 5% | 64% | 88% |
| com parceria aos 40 | 93% | 40% | 24% | 62% | 68% | 23% | 2% | 46% | 73% |
| idade ao morrer | 53 · 64 · 73 | 58 · 71 · 78 | 58 · 73 · 80 | 52 · 69 · 77 | 62 · 73 · 79 | 61 · 72 · 79 | 58 · 67 · 76 | 54 · 68 · 74 | 50 · 61 · 68 |

Não há convergência: cada estratégia dá vidas diferentes, com faixas largas; a dedicação aos estudos dá nota e
inteligência e custa físico e parceria; a carreira dá dinheiro e custa felicidade e parceria; a vida social dá parceria
e felicidade e custa saúde (a noite, a bebida). Por país, a felicidade aos 30 vai de 53 (NG) a 64 (JP), e o
patrimônio aos 40 acompanha a economia de cada um. A comparação com a base é de distribuição (as vidas divergem — e a
base perdeu 84 vidas no travamento).

Outras simulações: `notas97.ts` (§3), o futebol (§4), 200 contratações no primeiro ano (13 × 11 demissões: a mesma taxa
de antes — a falha de um teste antigo era a semente, não o motor).

## 7. Testes

- Novos: `src/motor/__tests__/rework97.test.ts` (32 testes: Fases A, B e C, cada bug com a sua reprodução) e
  `src/ui/__tests__/rework97.test.tsx` (o boletim aos 16 e o histórico).
- **Suíte final: 1540/1540** (§11).
- Testes antigos alterados, com a justificativa no próprio arquivo:

| Teste | Por quê |
|---|---|
| `rework96` VIS-02 (boletim) | Afirmava que o domínio é a letra à mão — a causa do EDU-04. Agora a nota é à mão (e ≤ 10) e o domínio não. |
| `rework.test` (janela da base) | Afirmava "aos 21, a janela fechou" — o FUT-02. Agora: aos 21 pode pedir o teste adulto; aos 31, não. |
| `rework9` SOC-01 (salto extraordinário) | Subia a notoriedade de 45 para 80 sem acontecimento nenhum — o bug. Agora o salto vem com a estreia registrada e o motivo a nomeia. |
| `caminhos` 9/10 | §4. |
| `fix4`, `mundo` 11/12, `transversal`, `rework75`, `rework95` cenário 9, `fixPosPlaytestHumano` E, `fixGeneralizacao` F | Dependiam da semente (a vida morar na mesma cidade 40 anos depois; o filho criado ser o único filho; a amiga não casar no período; a contratada não ser cortada no primeiro ano; a mesma amiga nas 24 tentativas; o hash enviesado sempre dar o Exército). A pré-condição passou a ser dita, sem afrouxar o que se afirma. |

## 8. Auditoria visual

`scripts/playtest/rework97.mjs` (as 23 cenas do 9.6 e 6 novas: o boletim aos 16, o de Portugal, a porta do futebol
adulto, a semana da criança com quatro atividades, a História e o celular do salto de seguidores), **4 paletas × 1440,
820, 390, 360 e 390×560 = 580 capturas**, com a geometria (texto sobre texto, rolagem horizontal, bordas, alvos de
toque) e o contraste no DOM: **0 problemas**. Inspeção das capturas e de elementos (`elementos97.mjs`): achados do
"14de 20" e do "Há 7 anos" (corrigidos e recapturados). Montagens em `docs/rework97/`:

| Arquivo | O quê |
|---|---|
| `01-boletim-antes-depois.jpg` | O boletim aos 16, o mesmo save: antes (o domínio à mão na coluna da nota) × depois |
| `02-boletim-celular.jpg` | No celular, antes × depois, e Portugal de 0 a 20 |
| `03-futebol-adulto.jpg` | Caminhos aos 23: antes ("a janela já passou") × depois (a porta do time adulto) |
| `04-semana-crianca.jpg` | A semana de 9 anos com quatro atividades, antes × depois (aulas de 1 h) |
| `05-seguidores.jpg` | O salto com causa na História e o celular |
| `06-paletas-boletim.jpg` | As quatro paletas |
| `07-tamanhos.jpg` | 820, 390×560 e 360 |

## 9. Pendências e riscos

- **Quantias fixas dos acontecimentos** (assalto −1.500, empréstimo 3.000…) estão na unidade do Brasil; o motor tem
  duas conversões (câmbio e nível de preços) e a escala delas por país pede uma revisão própria. Agora não tiram o que
  não existe.
- **Seguro-desemprego pago de uma vez** (com as parcelas pelo tempo de casa); pagar mês a mês e cortar na recontratação
  muda o extrato — fica para quando o extrato mensal existir.
- **NPCs sem vínculo com o jogador** (o cônjuge de um irmão) não morrem; nenhum passou dos 90 no horizonte simulado.
- **Cores de veículos** alternam paridade (`pertences.ts`, hash sem mistura): cosmético; trocar mudaria as cores de
  saves existentes.
- **Sementes deslocadas**: a saúde, a altura, as notas, a agenda e as pessoas do mundo mudam o caminho de vidas com a
  mesma semente. Saves existentes carregam iguais (o que se guarda não muda); o que é derivado sem estado (a estatura, o
  edital, a Força provável, o clube amador) muda uma vez — **a estatura de personagens existentes pode mudar ao abrir o
  save** (o espalhamento real é menor).
- A porta adulta aos 21–22 com técnica de Série C (78) é generosa (22/30 entre quem pede todo ano); é o jogador mais
  forte que a base deixou passar. Calibrável sem mexer em regra.
- `mundoVivo`: o rótulo do negócio do amigo ("dono de uma oficina") usa o cargo genérico `dono_comercio`.
- O bloco de trajeto curto da agenda (< 32 px), pendência desde o REWORK 9, segue.

## 10. Desempenho, bundle e compatibilidade

- **Tempo do ano** (`tamanho9.ts`, 20 vidas até os 75, máquina livre, em sequência): **5,6 ms/ano depois × 5,9 antes**;
  save médio 102,5 kB × 103,7 kB.
- **Bundle**: maior pacote `motor` **779,4 kB** (9.6: 774,1 kB; limite 800 kB, não alterado); nenhuma dependência nova.
- `build:itch` + `smoke:itch`: **21/21**; PWA offline: **36/36**; `tsc` limpo.
- Saves v20: os campos novos são opcionais; o boletim de um save antigo mostra "no fim do ano" até o próximo ano letivo;
  `normalizarRework97` completa os irmãos. Ida e volta idêntica (o teste de save, inclusive o −0).

## 11. Execução final

| | |
|---|---|
| Suíte completa (Node 22, cópia em disco Linux, `--maxWorkers=3`) | **1540/1540** em 6,2 min (baseline 1505/1506; +35 testes) |
| `tsc --noEmit` | limpo |
| `build` · maior pacote | ok · `motor` 779,5 kB |
| `build:itch` · `smoke:itch` | ok · 21/21 |
| PWA offline (`scripts/pwa/offline.mjs`) | 36/36 |
| Auditoria visual (`rework97.mjs`) | 580 capturas, 0 problemas de geometria e contraste; cenas do boletim recapturadas depois das correções finais, 0 |
| Simulações | `populacao97` (540 vidas, 0 travamentos, 0 violações), `notas97` (1.000 alunos), futebol (300 vidas), `tamanho9` (20 vidas) |
