# VIDA 30 — vida social, experiências de vida, fama em pessoa, celular, fazenda, base, propostas, pós-carreira e clube

Branch `claude/vida30-vida-social-fama-celular` (a partir de `b7f90fd`, a VIDA 29.2 publicada). Um agente só, trabalho
sequencial, sem subagentes. Pedidos que chegaram durante o trabalho e entraram no escopo: as carreiras pós-esporte, a tela
do dono de clube, as redes sociais (o que você publicou, o feed, a prévia de vídeo na Twitch), filtros no aplicativo de
namoro (com famosos), o casamento entre famosos como notícia e os escudos por clube. O "Manual Mestre de Diretrizes" não está no repositório nem foi anexado (como nas VIDA 21–29):
segui as regras do próprio prompt e as do projeto (memórias de ambiente, a regra do limite de 800 kB por pacote, a regra
de funções declaradas nos pacotes em ciclo). Dois pedidos chegaram durante o trabalho e entraram no escopo: **carreiras
pós-esporte mais profundas** e **a tela do dono de clube, que era quase só texto**.

## 1. Resumo

- **Propostas profissionais (§8)**: a proposta diz quem contrata (organização da cidade ou clube), o cargo e o salário;
  convite para entrevista ≠ proposta formal; o "Aceitar" não trava sem motivo; o vínculo nasce com quem propôs. Causa
  do caso relatado achada e corrigida (§6).
- **Base (§7)**: remuneração em partes (bolsa, ajuda de custo, benefícios, contrato de formação aos 16 — nunca salário) e
  mercado da base (convite ou avaliação de outro clube, registro transferido, histórico, antes dos 14 só na cidade).
- **Fazenda (§6)**: rebalanceamento medido em simulação (5 perfis × 3 gestões × 3 cenários × 8 sementes × 10 anos) e a
  Visão geral reorganizada em problemas com saídas, custo, consequência e urgência.
- **Celular (§2)**: memória do que já foi dito, trabalho e propostas no ambiente de cada profissão, situações novas com
  continuidade (o par preocupado, a família que comenta uma decisão, a turma de estudo), reencontros com contexto.
- **Fama (§3)**: o meio (figuras públicas com identidade, jeito, laços entre si e vida própria), o reconhecimento em pessoa
  proporcional ao nome, a proposta, o fotógrafo, o evento em que se conhece uma figura (que vira Pessoa da vida), o
  convite do celular que vira cena, a privacidade; painel "O meio" na Fama.
- **Experiências de vida e reações (§4–§5)**: 30 cenas novas da infância à velhice e das relações (conhecer a família do
  par, apresentar o par à sua família, conquista com parabéns e inveja, o amigo que percebe a mudança...).
- **Pós-carreira (pedido extra)**: cada porta da VIDA 26 virou um ofício com jogo próprio (mídia, formação, comissão,
  gestão), com cenas e painel.
- **Dono de clube (pedido extra)**: a tela virou painel visual, com escudo de cada clube (cores e traço do clube, nunca o
  escudo oficial).
- **Redes e namoro (pedido extra)**: o seu post como post (legenda, curtidas, comentários de quem reagiu, miniatura do
  vídeo/live com título, categoria, duração ou "ao vivo" e espectadores), o dia a dia das pessoas no feed, os filtros do
  aplicativo (idade, distância, busca, interesse, só famosos — perfis verificados do meio) e o casamento, o namoro e a
  separação de famosos no jornal e em alta.

(Ver os itens 2–15 abaixo.)

## 2. Auditoria dos sistemas existentes (antes de mexer)

| Frente | Classificação | Evidência |
|---|---|---|
| Propostas profissionais | **Defeituoso** | `oportunidades.ts` (proposta de concorrente sem contratante, texto do headhunter), `trabalho.elegibilidade` (lia a proposta como currículo), `mercados.mercadoDe` (técnico no mercado "emprego") |
| Base: bolsa | **Parcial** (VIDA 28) | `esporte.bolsaDaBase`: um valor só, sem ajuda de custo, benefícios nem vínculo |
| Base: transferências | **Ausente** | só existia dispensa → peneira noutro clube |
| Fazenda | **Implementado, punitivo** | sim `scripts/sim/fazenda30.ts` (tabela no item 10) |
| Fazenda: explicações | **Implementado, mal apresentado** | quatro parágrafos por indicador (VIDA 29) |
| Celular | **Implementado, repetitivo e incoerente** | sim `scripts/sim/celular30.ts`: 26,4% das mensagens repetiam um texto já recebido na mesma vida; 54 mensagens "de escritório" a quem não trabalha em escritório (soldado, pintor, manicure, personal) |
| Celular: aplicativos | **Implementado e funcional** | Mensagens, Namoro, Redes, Notícias, Agenda, Mapas, Banco, E-mail, Fama: cada um é porta para um sistema real; nenhum aplicativo novo foi criado (regra do prompt) |
| Fama: reconhecimento | **Parcial** | só o encontro da VIDA 27 (`enc27_fa`) e uma linha em "Na imprensa e nas ruas" (VIDA 22) |
| Fama: pessoas famosas | **Parcial** | "moldes" sorteados na hora (área aleatória, "adorei o seu trabalho"); vida própria só depois de conhecidos (VIDA 19); nenhuma rede entre elas |
| Experiências por fase | **Parcial** | `scripts/sim/catalogo30.ts`: 49 conteúdos até 5 anos, 83 até 11; a vida adulta e a velhice dominadas por trabalho/dinheiro (a velhice com 4 conteúdos próprios) |
| Família do par | **Ausente** | o parentesco `sogro` existia, mas nada o criava |
| Reações dos NPCs | **Parcial** | memória, iniciativas e dimensões (VIDA 28) existem; poucas cenas concretas de reação |
| Pós-carreira | **Implementado, raso** | VIDA 26: as portas viravam empregos comuns |
| Tela do dono de clube | **Implementada, só texto** | `Clube20.tsx` |

## 3. Funcionalidades preservadas

Tudo o que o prompt lista no §10 (VIDA 25/26/28/29, Eras v4) ficou como estava, com estas exceções **localizadas e
intencionais**: a bolsa da base continua com a mesma conta e ganhou partes ao lado; a simulação rural mantém o motor da
VIDA 18/19/29 com os ajustes do item 7; a Visão geral do campo mantém os quadros da VIDA 29 (a explicação longa foi para o
modo detalhado). O save continua na versão 20 (só campos opcionais).

## 4. Novas funcionalidades (cada uma com teste)

| Frente | Arquivos principais |
|---|---|
| Propostas | `sistemas/oportunidades.ts` (contratante, convite × formal, comissão com clube), `trabalho.elegibilidade`, `compromissos.aplicarAjuste`, `conteudo/desafios.ts`, `mercados.oportunidadeCoerente`, `ui/jogo/Alcance.tsx` |
| Base | `sistemas/base30.ts` (remuneração em partes, mercado, transferência, registro), `esporte.anoNaBase`, `ui/v25/formacao/Formacao25.tsx`, portas do esporte |
| Fazenda | `v18/rural/fazenda18.ts` (balanceamento, custeio), `v18/rural/problemas30.ts` (problemas e saídas), `ui/v18/campo/Campo18.tsx`; sims `scripts/sim/fazenda30*.ts` |
| Celular | `dados17/celular/ambientes30.ts`, `dados17/celular/catalogo17.ts` (situações novas), `v17/celular/mensagens17.ts`, `v15/celular/celular15.ts`; sim `scripts/sim/celular30.ts` |
| Fama | `v30/fama/rede30.ts` (o meio, cenas, privacidade), `conteudo/acontecimentos30Fama.ts`, `ui/v30/fama/Meio30.tsx` |
| Vida e reações | `conteudo/acontecimentos30Vida.ts` (30 cenas e o fluxo `vidaDe30DoAno`) |
| Pós-carreira | `v30/oficio/oficio30.ts`, `conteudo/acontecimentos30Pos.ts`, `ui/v30/oficio/Oficio30.tsx` |
| Clube | `ui/v20/clubes/Clube20.tsx` (painel), `ui/v30/escudos/Escudo30.tsx` (escudos por clube) |
| Redes e namoro | `v30/redes/redes30.ts`, `v19/conectada/feed19.ts` e `conectada19.ts`, `v15/celular/noticias15.ts`, `ui/v30/redes/MeusPosts30.tsx` e `FiltrosNamoro30.tsx`, `ui/v19/conectada/Feed19.tsx` |

## 5. Problemas encontrados · 6. Causas-raiz · 7. Correções

**O técnico com a proposta travada (o caso relatado).**
- *Causa 1*: `mercados.mercadoDe` classificava `tecnico_futebol` (contrato CLT, sem marca de mercado próprio) como
  "emprego" — e o gerador da "proposta de concorrente" (`oportunidades.processarOportunidades`) mandava a ele o recado
  genérico do headhunter, sem empregador.
- *Causa 2*: `trabalho.elegibilidade` bloqueava toda ocupação de entrada "por oportunidade" quando a via não era
  "oportunidade" — a proposta era lida como currículo, e o "Aceitar" ficava desabilitado com "Não se entra por currículo".
- *Causa 3*: a entrevista vinda de uma proposta para a mesma função falhava em "você já trabalha nisso".
- *Correção*: a proposta nasce com contratante (organização do mercado da cidade, que não é a sua; na comissão técnica,
  um clube com nome), cargo e salário; o headhunter traz **convite para entrevista**, as outras vozes **proposta formal**
  (aceitar é assinar); `elegibilidade` aceita a via "proposta"; a entrevista da proposta usa a via certa; o vínculo nasce
  com a organização/clube que propôs (`AjusteDeEmprego.orgId/clube`); o técnico principal não recebe o recado genérico
  (o mercado próprio dele, com clube, já existia na carreira de técnico) e o recado antigo de um save sai das portas.

**Celular**: repetição — cada situação sorteava de 1 a 4 frases sem memória; incoerência — um só ambiente de trabalho.
Correção: memória curta do que foi dito (`celular15.ditos30`, até 240 chaves), escolha da fala não dita (cai para outro
tom antes de repetir), catálogo de ambientes por profissão (`dados17/celular/ambientes30.ts`: 13 ambientes × 3 situações
+ propostas por ambiente), reencontros com o ofício, a cidade e os anos sem se ver.

**Fazenda**: o prejuízo do ano caía no cartão a 4,5% ao mês; a chácara pagava o caseiro inteiro (R$ 32 mil) e fechava no
vermelho sempre; o gerente saltava de R$ 78 mil para R$ 140 mil aos 301 ha; o solo cansado tirava 20% da produção; o ano
de clima ruim pagava o custo de uma safra cheia; a horta acumulava "monocultura"; "manter" segurava o gado em excesso e o
solo afundava em espiral (79 → 27 em dez anos); o ITR usava o valor de mercado inteiro. Correções no item 7 da tabela de
balanceamento.

## 8. Integrações

- Proposta → contratação → vínculo com a organização/clube; interino da comissão (pós-carreira) → proposta com o clube →
  carreira de técnico no mesmo clube.
- Base → ano de formação (o clube do ano é o do registro) → contrato profissional pelo clube novo; ficha da formação.
- Fama → celular (o convite de evento vira cena presencial; a pessoa famosa da mensagem é uma figura do meio) → vínculo
  e memória de sempre → iniciativas/mensagens dela depois; privacidade → estresse e o par que não escolheu a exposição;
  notícias do meio na Fama.
- Celular → família que comenta decisões lidas da biografia; o par preocupado lido do estresse/da saúde; fios de
  continuidade (mágoa, promessa) da VIDA 17.
- Cenas de vida → memórias com peso, personalidade pela escolha (`comportamento`), vínculos; o álbum lê a biografia da
  infância.
- Fazenda → crédito de custeio na conta de sempre; os problemas abrem as ações que já existiam.

## 9–10. Testes executados e resultados

**Testes novos (todos passando):** vida30Propostas (6), vida30Base (10), vida30Fazenda (8), vida30Celular (6), vida30Fama (6),
vida30Vida (5), vida30Oficio (3), vida30Redes (5), vida30Saves (4), vida30Clube (tela, 2), vida30Novidades (1).

**Suíte completa** (10 lotes, worktree fixo no commit `2301299`): **3.304 passaram, 15 falharam.**
- 5 estouros de tempo já conhecidos das versões anteriores (fechamentoMundo "a mesma discussão", fixPosPlaytestHumano C,
  motor "linguagem de escolha", profissao "clima péssimo", rework115Esportes "copas").
- 10 falhas de asserção: todas passavam na base; todas explicadas e corrigidas na causa, sem afrouxar a regra:
  - deriva das vidas de teste pelas cenas e situações novas do ano (rework2 academia — agora contra o alvo do dia a dia
    da própria vida; rework75 luto — o suporte é só o que o teste põe; rework9 e vida129Presidencia — amostras maiores, com
    o piso na mesma proporção; rework11Carreiras — a vida sorteada morria antes dos 25, agora usa a próxima semente;
    rework75 tela — a vida da semente 80 perdia alguém central e reavivava o luto, troca de semente; rework105 — o teto da
    exposição sobre o público real da conta);
  - o painel da Fama passou a vir sob demanda (pacotePlaytest e rework105 de tela esperam ele aparecer).
  Os 22 arquivos corrigidos e todos os da 30 passaram depois (273 testes), e os 30 arquivos ligados ao que mudou na revisão
  visual (313 testes).

**Simulações (antes → depois, mesmas sementes):**
- Celular (18 vidas × 75 anos): mensagens que repetem um texto já recebido na mesma vida 26,4% → **8,4%**; mensagens "de
  escritório" a quem não trabalha em escritório 54 → 4; textos distintos 475 → 586; cota anual respeitada (máx. 4).
- Fazenda (8 sementes × 10 anos; o produtor iniciante): chácara 4 ha −6,3 mil/ano (51% no vermelho) → +0,5 mil (30%); sítio
  familiar +8,4 mil (39%) → +25,3 mil (10%); agrícola 300 ha +177 mil (16%) → +227 mil (1%); agrícola com solo cansado −63 mil
  (70%) → +72 mil (15%); grande com gado em dobro: solo 79 → 27 em espiral (−50 mil/ano) → sem espiral (+1,1 mi/ano);
  pecuária 500 ha com gerente: 90% dos anos no vermelho → 65% (o meio de propriedade povoado a 60% continua apertado com
  gerente — ver pendências).
- Catálogo: 621 → 663 conteúdos (0–5 anos 49 → 52; 6–11 83 → 88; 12–17 194 → 210; 18–29 435 → 462; 30–59 486 → 518;
  60+ 458 → 487).

**Typecheck** `tsc --noEmit`: rc=0. **Build**: rc=0; maiores pacotes `motor-textos` 794 kB, `Jogo` 791 kB (o painel da Fama e
os filtros do namoro foram para pacotes sob demanda para caber), `motor` 788 kB — todos abaixo de 800 kB. **Fumaça de
distribuição**: 36/36.

**Revisão visual** (`scripts/playtest/vida30.mjs`, saves de `scripts/playtest/gerarVida30.ts`, 1440 e 390 px, no preview e
depois no site real): clube (escudo, 11 no campo, elenco e mercado), campo (pasto, produção, saúde dos animais, seguro),
Fama (o meio), Twitch (3 posts com prévia "ao vivo"), Instagram, namoro (filtros), base (a porta de outro clube e o
registro), ofício — sem erro de página e sem rolagem lateral. Corrigido pela revisão: a proposta da base não aparecia nas
portas do esporte (e cairia nas de estudo), a cidade do clube aparecia como identificador, duas lives com o mesmo título,
legenda genérica nas lives de conversa, a mesma frase em todo ano comum do ofício, "no Resenha do Domingo".

## 11. Compatibilidade com saves antigos

Campos novos, todos opcionais: `Oportunidade.empregador/orgId/salario/formal`, `AjusteDeEmprego.orgId/clube/clubeCidade`,
`ProcessoSeletivo.ajuste`, `CarreiraEsportiva.base30`, `AnoDeFormacao.ajuda/vinculo`, `Celular15.ditos30`,
`Vida.fama30`, `Vida.oficio30`, `Pessoa.familia30`. Sem eles, o comportamento é o de antes (o meio nasce quando o nome
circula; o ofício, no primeiro ano do emprego; a memória do celular, vazia). Testado com fixtures antigos (v11, v12, v13)
e um save da VIDA 29 (rural), vividos três anos e salvos/reabertos.

## 12. Pendências reais

- **Fama**: as figuras do meio vivem em resumo (um fato por ano, laços entre elas); quem você conhece vira Pessoa e entra na
  vida própria completa da VIDA 19. Um meio por país de nascimento (quem se muda continua com o meio de origem).
- **Celular**: a repetição caiu para 8,4%; o que resta vem de situações frequentes com poucas falas (o convite, a saudade).
  Nenhum aplicativo novo foi criado (o prompt pediu utilidade, não ícones): a utilidade nova está nas mensagens, no
  E-mail (propostas com contratante), nas redes e no namoro.
- **Família do par**: os familiares nascem quando o encontro acontece (mãe, às vezes pai e irmão); a família da parceria
  que já existia em saves antigos não é reconstruída.
- **Base**: transferências entre clubes com nome no futebol; nas outras modalidades, entre as equipes de base das cidades
  maiores. A compensação de formação entre clubes é dita, não calculada.
- **Fazenda**: a pecuária grande pouco povoada e tocada por gerente continua apertada (o gerente custa o tamanho da área,
  e a terra ociosa paga ITR mais alto); a tela mostra o problema do dinheiro com as saídas.
- **Pós-carreira**: os números do ofício mexem no desempenho, no dinheiro e no nome, mas a mídia não tem audiência por
  partida nem a comissão tem a tabela do clube (lê-se a temporada pelo número do ofício).
- **Escudos**: desenhados para os clubes do catálogo brasileiro e os grandes de fora; os outros recebem um escudo estável
  pelo nome.

## 13–15. Commit final, deploy, URL

- **Commit do código validado:** `5e3cf18` (branch `claude/vida30-vida-social-fama-celular`). `main` e
  `claude/fix-pos-rework3-playtest` (a branch de produção do Cloudflare Pages) foram avançados até ele por fast-forward, sem
  merge. Este relatório entra num commit só de documentação, em `main` e na branch da 30 (a de produção fica no código).
- **Deploy conferido:** https://vida-game.pages.dev/ serve `assets/index-upx25QHu.js`; "/" e os 198 arquivos JS/CSS com
  sha256 idêntico ao build local validado.
- **Fluxos no site real:** a revisão visual inteira em 1440 e duas vezes em 390 px, sem erro de página; um save antigo da
  VIDA 28 (1965) e um da VIDA 29 (rural) abriram e viraram o ano sem erro.
- **URL de produção:** https://vida-game.pages.dev/
