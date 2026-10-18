# REWORK 9 — A VIDA ORGANIZADA

UX/UI integral, Caminhos, Agenda Semanal, Progressão Causal e Diversidade de Vidas.

> O mundo acontece. O jogador age dentro dele. Os dois produzem a biografia.
> Não basta implementar. Tem que conectar.

---

## 1. Estado inicial e commit-base

| | |
|---|---|
| Branch | `claude/fix-pos-rework3-playtest` (nenhuma outra tarefa Claude ativa nela; working tree limpo, só `.claude/` não rastreado; em dia com o remoto) |
| Commit-base | `3c2bf18` — REWORK 8 · Fase B (presente e conferido) |
| Save | v20 (sem versão nova: todos os campos do REWORK 9 são opcionais) |
| Baseline de testes | **80 arquivos, 1391 testes, todos passando** (366 s, Node 22, cópia em disco Linux, `--maxWorkers=3`) |
| Pacotes (base) | `motor` 764,7 kB · `motor-textos` 737,7 kB · `Jogo` 489 kB (limite 800 kB) |

Leitura dirigida (sem auditoria irrestrita, sem dezenas de subagentes): navegação (`ui/navegacao`, `telas/Jogo`),
formação e trabalho (`jogo/Estudos`, `jogo/Trabalho`, `sistemas/profissao`, `compromissos`), atividades e semana
(`sistemas/rotinas`, `semana`, `jogo/Agenda`, `jogo/Tempo`), NPCs (`pessoas`, `filhos`, `social`, `dados/ocupacoes`),
notas (`sistemas/escola`, `frentes`), redes (`redes`, `redesBase`, `jogo/Redes`), futebol (`esporte`, `palmares`,
`tecnico`, `dados/clubes`), progressão (`frentes.praticar`, `estado.registrarEstado`, `dinheiro.fotografar`) e save
(`save.ts`, a normalização única de leitura).

## 2. Problemas encontrados (com a causa no motor)

| Código | O que o playtest viu | A causa encontrada |
|---|---|---|
| FUT-01 | Campeão da Série B com o Remo, como titular, em 2048 **e** 2049 | `palmares.registrarTemporada` só dava acesso se `tetoDoClube(clube) > nível`; o Remo é "tradicional" (teto = Série B). E o clube **não tinha divisão própria**: a divisão morava só no contrato do atleta. O técnico tinha outra regra (`tetoDeAcesso`). |
| SOC-01 | 40 mil → 537 mil seguidores numa virada de ano, sem publicar | `processarRedes` somava `(fama−25)²·40` por ano, **sem limite e sem relação com o tamanho da conta** — com ou sem publicação, em cada uma das sete redes. Simulação: celebridade parada ganhava +75 mil/ano; o teto teórico era +315 mil por rede. Nenhuma causa ficava registrada. |
| EDU-01 | Notas parecidas, concentradas | O "esperado na série" crescia 5 pontos/ano (até 60), mais rápido que qualquer aluno: a nota **caía com a idade** (mediana 48 aos 10 → 43 aos 17; 58% "com dificuldade" aos 17, 0% excelentes) e a postura (±10 e ×1,3/×0,65) decidia quase tudo. ENEM esperado com desvio de só 46 pontos. |
| NPC-01 | Parceiros e amigos sempre babá, diarista, limpeza | (1) o cargo de quem tinha renda sem cargo era o da lista da classe com o **salário mais perto** da renda sorteada (uma conta determinística que cai sempre nos mesmos ofícios); (2) o adulto que entra na vida **nascia com "fundamental"** de escolaridade (o padrão de `garantirVida`) e a procura de emprego dele sorteava só na lista de menor salário. |
| UX-02 | Celular comprido, avanço por cima, avisos repetidos | O app era uma página só (perfil, publicar, feed, conta, tudo em sequência); o aviso "pode, mas custa" de cada publicação repetia o mesmo texto sob cada botão; o véu largo do avançar cobria a base do aparelho. |
| Navegação | Formação e Trabalho separados; "Tempo livre" misturando viagens | Sete áreas; a mesma trajetória partida em duas páginas. |
| Agenda | Frequência sem dia nem hora | O motor só tinha "pedaços" de semana (`semana`); não havia horário, turno, nem conflito concreto. |
| Progressão | Números sem causa | As frentes mudavam (`praticar`), mas ninguém registrava **quem** fez a frente andar; não havia fotografia anual das habilidades. |

## 3. Arquitetura adotada

- **Ligas do mundo** — `sistemas/ligas.ts` (+`Caminhos.ligas`): uma tabela por país, persistente, criada quando se
  precisa; todas as divisões jogam a temporada (posições únicas: um campeão por divisão; 20 vagas nas divisões 2–4;
  regionais sem limite); trocas pelas regras do país (`PerfilEsportivo.acesso`). O clube da vida joga a colocação que a
  temporada dele produziu; os outros sorteiam por `rngDe` (o gerador principal não é tocado).
- **Balanço do público** — `redesBase.mudarPublico` é a **única porta** por onde `seguidores` muda (com a causa);
  `ContaSocial.balanco`/`anos`; `redes.publicoDoNome` + `exposicaoDoAno` (convergência para o público possível).
- **Navegação** — `ui/navegacao.ts`: seis áreas; `Lugar.parte`/`foco`/`explorar`; destinos antigos aceitos.
- **Caminhos** — `jogo/CaminhosDaVida.tsx`: situação atual, quatro partes; `Estudos` e `Trabalho` ganharam `parte`
  (cada seção pertence a uma parte só). Os motores não foram fundidos.
- **Agenda** — `sistemas/agenda.ts` (pacote `motor-vida`): blocos **derivados do estado** a cada leitura; `v.agenda`
  guarda só escolhas (turnos e lugares). Presença → `processarRotinas`, `processarEscola`, `processarCurso`. Conflito
  de horário numa proposta → `compromissos` (um gancho que a agenda registra; sem ciclo entre pacotes).
- **Progressão** — `sistemas/progressao.ts` (camada de base): `praticandoPor(fonte)` marca quem pratica;
  `frentes.praticar` atribui a mudança; `v.evolucao` guarda oito anos (só o que mudou).
- **UI** — `ui/organizada.css` (classes novas, só tokens: as quatro paletas sem cor fixa); `jogo/Progresso.tsx`;
  `jogo/Agenda.tsx` (reescrito); `jogo/Redes.tsx` (telas do app + painel lateral).

## 4. Mudanças por fase

### Fase 0 — correções críticas (`bd77c3d`)
- **FUT-01**: ligas com acesso e rebaixamento para todos os clubes; sem teto nem piso pelo porte (o porte é a força do
  elenco); Brasil troca 4 por divisão; MLS, Liga MX (rebaixamento suspenso desde 2020), A-League (AU e NZ) e o Canadá
  são fechadas; o resto do mundo, 3. Proposta, transferência e volta de empréstimo leem a divisão de agora; save antigo
  cria a tabela concordando com o contrato e com o banco do técnico.
- **SOC-01**: balanço causal que fecha matematicamente (`inicio + orgânico + publicações + exposição + comprados −
  perdas = fim`); a fama deixou de somar um número fixo: define o público possível na rede, e a conta se aproxima dele
  (2%/ano do que falta parada; 6–12% publicando) com impulso proporcional ao quanto o nome **cresceu** no ano; o
  motivo é registrado ("o nome cresceu no ano (notoriedade 45 → 80, pela obra e pelos trabalhos)"); a tela do celular
  mostra "O público em <ano>".

### Fase A — estrutura (`ee7c0a6`)
- Seis áreas: **História · Você · Pessoas · Caminhos · Minha Semana · Vida** (desktop e barra do celular).
- Caminhos com a situação atual (tudo o que ocupa a vida ao mesmo tempo, dos dois lados) e Agora / Desenvolvimento /
  Oportunidades / Histórico; ordem dos lados pela fase da vida; estudar e trabalhar nunca se bloqueiam por isso.
- Viagens foram para Vida; a aba das redes chama-se Celular.

### Fase B — sistemas (`3bbd061`)
- **Agenda real**: blocos com id estável, origem, dias, início/fim, obrigatoriedade, remarcação, turnos; atividades
  encaixadas pela preferência (o esporte no fim da tarde, o grupo no sábado) e espalhadas pela semana; lugar escolhido
  pelo jogador (dias e hora, validados); conflitos (sobreposição ou falta de horário) com saídas **testadas antes** de
  oferecidas; nota na Linha da Vida uma vez por conflito; residência médica com prioridade sobre o plantão.
- **Proposta com conflito de horário**: o caso do playtest (futebol às 16h × trabalho 14h–18h) vira plano da decisão —
  trabalhar noutro turno, passar a escola para outro turno, remarcar ou largar a atividade, manter e perder as vezes,
  recusar.
- **PROG-01**, **EDU-01**, **NPC-01** (seções 6 e 8).

### Fase C — experiência (`d1990b6`)
- **Celular (UX-02)**: quatro telas no app (Perfil, Publicar, Feed, Conta), números ao lado (balanço, fim de cada ano,
  totais); aviso comum dito uma vez; no desktop, o avançar é uma pílula à direita sem o véu largo.
- **Pessoas**: Meu círculo · A vida deles · Nossa história (só registros reais; filtro por tipo de memória).
- **História**: ver por um fio (o tema do motor) e Conquistas (marcos e palmarés — a semente da sala de troféus).
- **Você**: índice do retrato (como está, corpo e aprendizado, o que sabe fazer, jeito, saúde, aparência, no mundo) e
  "O que você sabe fazer, ano a ano".
- **Caminhos · Oportunidades**: as portas do esporte e da arte (a peneira aparece aqui também).
- **REWORK 8**: objetos da vitrine na frente do vidro (não da porta), no máximo dois nas lojas de porta lateral;
  casas da imobiliária com 128–140 px; aviões do mesmo tipo com traços do modelo.

### Fase D — integração e validação
Seções 7, 9, 10 e 11.

## 5. Funcionalidades preservadas

- Toda ação das páginas antigas de Formação e Trabalho existe em Caminhos — **teste de regressão** que renderiza as
  páginas antigas (sem `parte`) e a nova e compara cada botão, em quatro perfis (criança de 9, adolescente de 16, adulta
  empregada que estuda, adulta sem trabalho). Os únicos textos que mudaram são destinos ("em Formação" → "em Caminhos").
- O mapa de intenções inteiro (48 intenções) segue verificado por cliques reais, agora apontando para a parte certa.
- Agenda: "Mais leve"/"Mais a sério", a ficha da prática, o estresse "pesa/ajuda", a lista da semana em texto.
- Celular: criar, publicar (com impulso), feed no formato de cada rede, celebridade, provocar, campanha, verificar,
  monetizar, comprar, apagar — os mesmos comandos, organizados em telas.
- Saves v20 e anteriores abrem (as migrações não mudaram; campos novos opcionais); PWA offline; quatro paletas e
  Automático; internacionalização (as ligas e os cargos respeitam o país); identidade das ilustrações do REWORK 8.

## 6. Novas mecânicas

| Mecânica | Onde | Efeito real (o que o motor usa) |
|---|---|---|
| Liga do país | `ligas` | divisão de cada clube; acesso/rebaixamento; propostas de clubes da divisão certa |
| Balanço do público | `redesBase`, `redes` | cada seguidor com causa; exposição limitada ao público possível |
| Agenda | `agenda` | presença: treino que não acontece não treina; aula atravessada vira falta (nota e aprendizado) |
| Turno escolhido | ação `agenda/turno` | muda os horários e libera (ou bloqueia, com o porquê) outros compromissos |
| Lugar da atividade | ação `agenda/mover`/`soltar` | dias e hora validados; conflito quando algo fixo chega depois |
| Plano de horário | `compromissos` + `agenda` | aceitar a proposta noutro turno, remarcar/largar a atividade, faltar, recusar |
| Fonte da prática | `progressao` | cada ganho ou perda de habilidade com quem o causou |
| Fotografia anual | `v.evolucao` | antes → agora, causas e trajetória nas telas |
| Esperado na série | `escola.esperadoNaSerie` | a nota compara com o aluno típico (curva medida) |
| Escolaridade do adulto | `filhos.garantirVidaEm` | cargo e procura de emprego do parceiro/amigo |

## 7. Integrações reais entre sistemas (provadas por teste)

`src/ui/__tests__/rework9Integracao.test.tsx` — cada cenário segue AÇÃO → ESTADO → AGENDA/ANO → CONSEQUÊNCIA → TELA → SAVE:

- **A — estudante e futebol**: escola + escolinha → a agenda reserva os horários (fora da aula) → a frente anda e a
  causa registrada é `rotina:futebol` → gente nova do ambiente da atividade → a peneira aparece em Caminhos ·
  Oportunidades → Você mostra a linha do futebol com a causa → a História registra → tudo igual depois de salvar e abrir.
- **B — trabalho e faculdade**: emprego integral + curso → o curso vai para a noite; a manhã é bloqueada **com o
  porquê**; com o conflito forçado, as aulas viram falta e a nota cai; Caminhos mostra os dois lados; o ano avança o curso.
- **C — relações e tempo**: amizade próxima sai do convívio → três anos depois, esfriou (sem zerar); o irmão continua
  irmão; retomar o contato aproxima; toda memória mostrada em Pessoas existe na relação (nada inventado).
- **D — redes e carreira**: um ano sem publicar e o nome subindo pelo trabalho → o balanço fecha, a exposição tem
  motivo, o celular mostra, salvar e abrir não reaplica (o ano seguinte é igual).
- **E — futebol e promoção**: campeão da Série B com o Paysandu → Série A na tabela, no contrato e na temporada
  seguinte; o save guarda.
- **Outros países**: Espanha troca 3 (o Brasil, 4); o cargo de quem entra na vida em Portugal existe em Portugal.

Mais: `rework9.test.ts` (28 testes de motor) e `rework9.test.tsx` (15 de interface) — o número mostrado é o do motor
(`data-agora` = campo do motor), as alternativas de um conflito resolvem de fato (cada uma é executada e o conflito
some), a tabela de portas confere com o desenho de cada loja.

## 8. Resultados das simulações — antes × depois

"Antes" = o build da base (`3c2bf18`), a mesma simulação, as mesmas sementes (as vidas divergem com as mudanças; a
comparação é de distribuição). Scripts em `scripts/sim/*9.ts`.

### FUT-01 — a liga em 50 temporadas (`ligas9.ts`)

| | Brasil (94 clubes no catálogo) | Espanha (16) |
|---|---|---|
| Campeões das divisões 2 e 3 que subiram | **100/100** | **11/11** |
| Clubes que pularam duas divisões num ano | 0 | 0 |
| Divisões com mais de 20 clubes do catálogo | 0 | 0 |
| Tradicionais que chegaram à elite em algum ano | 28 | 11 |
| Grandes que caíram em algum ano | 15 | 1 |
| Clubes do catálogo por divisão no fim (1/2/3/4) | 34 / 20 / 20 / 20 | 0 / 1 / 7 / 8 |

Antes, o tradicional campeão da Série B não subia nunca (teto) e os clubes do mundo não tinham divisão. Na primeira
versão da liga, a Espanha (catálogo pequeno) acumulava os clubes conhecidos na segunda divisão (os grandes ficavam anos
embaixo): a temporada do mundo passou a usar forças fracionárias e a elite do catálogo começa cheia.

### SOC-01 — o público em 50 anos (`seguidores9.ts`, 5 vidas por perfil, conta no Instagram)

| Perfil | Antes: 1 / 10 / 30 anos | Depois: 1 / 10 / 30 anos | Maior salto num ano **sem publicar** (antes → depois) |
|---|---|---|---|
| Pessoa comum (2 posts/ano) | 26 / 159 / 538 | 30 / 159 / 526 | 0 → 0 |
| Perfil inativo | 19 / 8 / 5 | 19 / 8 / 5 | 0 → 0 |
| Celebridade (nome 80, parada) | 157 494 / 207 557 / 28 913 | 116 683 / 88 530 / 10 751 | **109 841 → 35 160** |
| Atleta da elite (conta parada) | 43 249 / 18 860 / 2 293 | 37 711 / 14 858 / 1 805 | 4 462 → 0 |
| Influenciador (8 posts/ano) | 45 465 / 235 519 / 7,36 mi | 45 945 / 234 644 / 6,92 mi | 0 → 0 |

O crescimento extraordinário continua possível — com causa: no teste "o nome cresce de 45 para 80 num ano", a conta
parada ganha mais de 100 mil, e o balanço diz "o nome cresceu no ano (notoriedade 45 → 80, pela obra…)". Em toda
simulação e teste, o balanço fecha (`fimDoBalanco(b) === b.fim`).

### EDU-01 — a escola numa população (`escola9.ts`, 80 vidas)

| Aos 17, sem intervenção | Antes | Depois |
|---|---|---|
| Média · desvio | 43,3 · 11,1 | **55,6 · 13,5** |
| Mínimo · p10 · p50 · p90 · máximo | 17 · 29 · 44 · 57 · 69 | 31 · 40 · 53 · 75 · 92 |
| Com dificuldade (< 45) · mediano · bom · excelente (≥ 75) | 54% · 40% · 6% · **0%** | **19% · 48% · 21% · 12%** |
| A curva com a idade (média aos 10 → 14 → 17) | 48,0 → 44,3 → 43,3 (caía) | 52,4 → 54,3 → 55,6 |
| Quem mudou de faixa entre os 10 e os 17 | 49% | 60% |
| Distância entre a matéria mais forte e a mais fraca | 22,2 | 22,4 |
| ENEM esperado: média · desvio · máximo | 518 · 46,5 · 634 | 536 · **61,3** · 699 |
| Postura dedicada × relaxada (média aos 17) | 56,8 × 26,6 (destino) | 67,4 × 42,3 (pesa, não decide) |

Não se aumentou a nota de todos: o aluno típico fica no meio (a curva "esperada" é a mediana medida), há gente com
dificuldade e gente excelente, e a mobilidade aumentou (trajetórias de recuperação e de queda). O ingresso no ensino
superior manteve a escala antiga (o adulto que volta a estudar tem as matérias mais frias).

### NPC-01 — as profissões de quem está na vida (`ocupacoes9.ts`, 60 vidas até os 45)

| Grupo | Antes: pessoas · cargos diferentes · 5 mais comuns | Depois |
|---|---|---|
| Amigos próximos | 73 · 22 · **51%** (babá, diarista, líder de limpeza, cuidador…) | 66 · **32** · **39%** (gerente de loja, assistente adm., supervisor, vendedor, zelador…) |
| Parceiros | 9 · 6 · 89% | 10 · 8 · 70% |
| Pais | 19 · 18 · 32% | 24 · 23 · 25% |
| Irmãos | 63 · 47 · 24% | 62 · 44 · 23% |

Sem regra de gênero (o catálogo é o mesmo para todos; a simulação mostra a divisão por gênero das mais comuns, sem
forçar uniformidade). O adulto que entra na vida pela faculdade tem diploma com mais frequência (75%).

### Agenda — numa população (`agenda9.ts`, 30 vidas até os 45, decisões pela primeira opção)

- Encaixe automático: presença média das atividades **1,000** (56 atividade-anos) e da escola 0,996 — o motor não
  inventa conflito; 1 vida em 30 teve conflito (2 sobreposições, aos 18–29). Conflitos nascem de escolhas do jogador
  (um lugar marcado, um turno, uma proposta) — e, aí, cobram (testes de B e da agenda).
- O que fez as frentes andarem (soma de pontos de habilidade, 30 vidas): a escola +5448, as atividades +147, as ações
  do jogador +79, o trabalho +16; o tempo sem praticar −2668 (o esquecimento também é registrado).

## 9. Testes executados e resultados

| Verificação | Resultado |
|---|---|
| `vitest` (suíte inteira) | **1441/1441** em 83 arquivos (base: 1391/1391 em 80) — +50 no saldo, nenhum arquivo de teste removido |
| `tsc --noEmit` | sem erros |
| `npm run build` | ok; maior pacote `motor` 766,9 kB (limite 800 kB intocado) |
| `npm run build:itch` | ok (index.html na raiz do ZIP) |
| `npm run smoke:itch` | **21/21** |
| PWA offline (`scripts/pwa/offline.mjs`) | **36/36** (agora passa pela Minha Semana, pelo Celular e pelo Perfil) |
| Auditoria visual (`scripts/playtest/rework9.mjs`) | 41 cenas × 4 paletas × (1440, 820, 390, 360 e 390×560) = 820 telas — **0 problemas** de geometria (texto sobre texto, rolagem horizontal, borda estourada, botão de avançar coberto) |
| Cenários integrados A–E (`rework9Integracao.test.tsx`) | todos passam, inclusive em espanhol e português de Portugal |

Testes novos: `src/motor/__tests__/rework9.test.ts` (28: ligas, balanço do público, agenda, progressão, notas,
ocupações), `src/ui/__tests__/rework9.test.tsx` (15: navegação, Caminhos, agenda, celular, Pessoas, História),
`src/ui/__tests__/rework9Integracao.test.tsx` (cenários A–E). Testes antigos ajustados foram ajustados por causa (a
navegação nova, a agenda que substituiu a frequência) ou com a pré-condição explícita quando o sorteio mudou — nenhuma
asserção foi afrouxada para passar.

Notas da auditoria (não são problemas de geometria): os blocos de **trajeto** de 30 minutos têm 20 px de altura na
grade (a altura é proporcional ao tempo); tocá-los abre a ficha, mas o alvo é menor que 32 px. Durante a auditoria,
dois falsos positivos do próprio script foram corrigidos (a fachada da vitrine, recortada pelo cartão, contava como
"estourando"; no celular, o clique em "Pessoas" achava antes o filtro "Pessoas" da História). E uma correção real: no
celular a agenda abria numa segunda-feira vazia — agora abre no primeiro dia com conflito ou com compromisso.

## 10. Capturas (quatro paletas)

Montagens em `docs/rework9/` (capturas reais do jogo, build de produção; "antes" = `3c2bf18`):

| Arquivo | O que mostra |
|---|---|
| `01-navegacao.jpg` | antes (Trabalho) × depois (Caminhos), 1440 px |
| `02-caminhos-partes.jpg` | Desenvolvimento, Oportunidades, Histórico |
| `03-caminhos-fases.jpg` | Caminhos da criança, da adolescente, de quem trabalha e estuda, do atleta (390 px, quatro paletas) |
| `04-agenda.jpg` | a frequência sem dia nem hora × a agenda em horários |
| `05-agenda-conflito.jpg` | o conflito (futebol às 16h × meio período da tarde) com as saídas reais, e a ficha |
| `06-agenda-celular.jpg` | a agenda no celular, um dia de cada vez |
| `07-celular.jpg` | o celular antes (tira comprida) × depois (telas curtas, números ao lado) |
| `08-celular-balanco.jpg` | o balanço do público (SOC-01) e o celular a 390 px |
| `09-progressao.jpg` | PROG-01 em Caminhos · Desenvolvimento e em Você |
| `10-pessoas.jpg` | A vida deles · Nossa história |
| `11-historia.jpg` | História por fio: Conquistas (o acesso à Série A), Trabalho; o Histórico do atleta |
| `12-paletas.jpg` | a agenda nas quatro paletas (1440) |
| `13-paletas-caminhos.jpg` | Caminhos nas quatro paletas (390) |
| `14-tablet-baixo.jpg` | 820 px e 390×560 (o avançar nunca cobre o conteúdo) |
| `15-vida.jpg` | Viagens, a vitrine com o produto, a imobiliária com as casas pequenas |

## 11. Medidas de desempenho

Medido com `scripts/playtest/desempenho9.mjs` (Chromium, build de produção servido localmente; base = `3c2bf18`
construída numa worktree, depois = este pacote). Tempo do clique na aba até o quadro desenhado, mediana de 7 cliques,
em ms. "Caminhos" substitui Formação **e** Trabalho; "Minha Semana" substitui Tempo livre; "História" substitui
Linha da Vida.

| Vida | Largura | Formação / Trabalho → Caminhos | Tempo livre → Minha Semana | Linha da Vida → História | Você | Pessoas | Vida |
|---|---|---|---|---|---|---|---|
| empregado | 1440 | 15,8 / 8,2 → **31,9** | 12,2 → 14,9 | 17,2 → 21,6 | 15,7 → 21,6 | 10,6 → 11,7 | 7,7 → 9,1 |
| várias atividades | 1440 | 13,9 / 9,5 → 29,6 | 12,9 → 21,7 | 19,9 → 21,2 | 14,4 → 23,1 | 17,7 → 18,1 | 5,9 → 6,3 |
| família | 1440 | 20,2 / 12,0 → 23,0 | 10,5 → 12,4 | 26,4 → 17,4 | 22,1 → 15,8 | 23,2 → 18,4 | 12,4 → 10,8 |
| empregado | 390 | 18,7 / 9,5 → **43,6** | 13,6 → 19,0 | 19,5 → 33,2 | 14,8 → 18,4 | 10,3 → 18,0 | 7,2 → 10,6 |
| várias atividades | 390 | 31,0 / 8,9 → 21,6 | 13,0 → 11,1 | 24,4 → 19,3 | 15,8 → 15,5 | 18,9 → 15,8 | 6,5 → 5,6 |

- Todas as trocas de área ficam abaixo de 50 ms (abaixo de um quadro perceptível de espera em toque); Caminhos custa
  mais que cada aba antiga isolada porque desenha as quatro partes de uma vez (as escondidas por CSS), mas fica perto
  da soma das duas abas que substitui.
- Motor: `scripts/sim/tamanho9.ts`, 20 vidas de 0 a 60 anos — **7,8 → 9,0 ms por ano simulado** (+15%: a agenda, a
  fotografia da evolução, a liga do país e o balanço da rede).
- Save: tamanho médio de uma vida de 60 anos **110,3 kB (base) → 99,5 kB**; os campos novos somam ~0,8 kB (a
  fotografia de 8 anos, a agenda guardada, a tabela da liga). A diferença para baixo vem das vidas diferentes que as
  sementes geram depois das mudanças de motor, não de compressão.
- Pacotes (limite 800 kB, não alterado): `motor` 766,9 kB · `motor-textos` 737,7 kB · `Jogo` 510,1 kB ·
  `motor-vida` 141,5 kB. A agenda mora em `motor-vida` (registrada por gancho em `compromissos`) para o `motor` não
  passar do limite.

## 12. Compatibilidade de saves

- Versão continua **20**; nenhuma migração nova. Campos novos, todos opcionais: `Vida.agenda`, `Vida.evolucao`,
  `Caminhos.ligas`, `Caminhos.praticaDoPeriodo`, `ContaSocial.balanco`/`anos`, `PerfilEsportivo.acesso` (catálogo).
- Save antigo: a liga nasce concordando com o contrato do atleta e com o banco do técnico; a agenda é derivada do
  estado (nada inventado: só o que existe vira bloco — teste "um save sem agenda abre com a semana derivada do estado");
  a primeira conta de rede abre o balanço no primeiro movimento, com o número que já tinha; a fotografia começa no
  próximo ano.
- `limparAgenda` tira escolhas de coisas que acabaram (a atividade largada leva o lugar junto).

## 13. Pendências e limitações (honestas)

- **Custo de Caminhos.** As quatro partes são desenhadas juntas e escondidas por CSS (a troca é instantânea e o
  estado de cada parte sobrevive), o que custa +15–25 ms na abertura da área em telas de celular. Desenhar só a parte
  visível é a próxima otimização, se o custo crescer.
- **Motor +15% por ano.** Aceitável hoje (9 ms/ano), mas a agenda recalcula a semana a cada ano e a cada consulta da
  tela; um cache por `t` é possível.
- **Conflitos da agenda vêm quase só do jogador.** O encaixe automático acha horário para tudo o que a vida gera
  sozinha (1 vida em 30 teve conflito na simulação). É o comportamento pedido — o motor não inventa conflito —, mas o
  jogador que nunca marca horário verá poucos.
- **Vida (casa, compras, viagens, bens)** ganhou a seção Viagens e o polimento do REWORK 8 (produto na vitrine,
  casas pequenas na imobiliária, aviões e barcos por modelo), mas não foi redesenhada a fundo.
- **Conquistas na História** é um filtro dos marcos que o motor já registra (títulos, acessos, formaturas, recordes);
  não há uma "sala de troféus" própria.
- **Desigualdade de notas:** a dispersão subiu (dp 11,1 → 13,5 aos 17), mas a faixa "excelente" ainda depende muito
  de dedicação; a aluna relaxada cai para "dificuldade" em metade dos casos — intencional, mas vale acompanhar no
  playtest humano.
- **Ocupações dos parceiros** continuam concentradas (8 ocupações em 10 parceiros na amostra pequena): o parceiro
  nasce do círculo de trabalho do jogador, o que é coerente, mas repete o setor.
- **APK não regenerado** neste pacote (conforme pedido).

## 14. Commit final e branch

- Branch: `claude/fix-pos-rework3-playtest` (push somente nela; sem merge na `main`, sem force push, sem deploy).
- Commits do pacote: `bd77c3d` (Fase 0), `ee7c0a6` (Fase A), `3bbd061` (Fase B), `d1990b6` (Fase C) e o commit da
  Fase D (validação, relatório, capturas), o último da branch.
- `.claude/` fora do commit. APK não regenerado.
