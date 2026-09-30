# FIX pós-REWORK 3 — playtest: agência, integridade de estado e progressão acionável

## Resumo executivo

O playtest do REWORK 3 encontrou um problema que atravessava o jogo inteiro: o motor sabia algo, mas o jogador não conseguia agir sobre isso. Ou a tela dizia uma coisa e o cálculo fazia outra. Ou uma escolha relevante terminava em "Nada aconteceu". Este FIX fecha essas cadeias com uma regra fixa:

> O jogo pode decidir o que acontece com você. Ele não pode decidir, sem avisar, como você escolheu reagir.

Principais entregas:

- **P0, agência e integridade.** Oportunidades não mudam mais de cidade, emprego ou carreira sem uma pergunta explícita.
  - A vida profissional passa a ter trajetória **principal, paralela, pausada e encerrada**.
  - A notoriedade pertence à pessoa.
  - Aceitar um convite sempre produz um resultado.
  - O emprego de NPC tem uma fonte de verdade única.
  - Trocar de escola encerra na hora as atividades da instituição antiga.
- **P1, progressão acionável.** Quando a tela aponta uma deficiência controlável, existe uma ação que mexe na **mesma variável** consultada pela avaliação:
  - peneira → treino de fundamentos;
  - vestibular → estudo dirigido por matéria;
  - pós → preparar o projeto;
  - teatro → apresentar-se, testes de elenco, trabalhos pequenos, edital, festival.
- **Objetivos:** a memória de intenção nasce sozinha das tentativas, sem quest log.
- **Carreiras especiais:** academia (projetos, orientação, produção) e cena (currículo persistente com obras fictícias).
- **Crime:** a descoberta abre primeiro uma investigação, que pode virar processo ou ser arquivada. Ficar na moita é uma escolha.
- **Dinheiro e bens:** experiências compráveis, embarcações e aeronaves com habilitação própria, **autoescola com prova interativa**, veículos com desenho por forma, lojas de estilo organizadas e relógio/joia usáveis.
- **Autoria:** o jogador nomeia o que criou.
- **Navegação:** Tempo livre virou área própria.
- **Eventos:** menos repetição na infância.

Validação: suíte completa **755/755** (30 arquivos), typecheck limpo, build limpo, smoke itch.io **18/18**, capturas em 1440/820/390 px sem rolagem horizontal nem erro de página, e simulações dirigidas antes/depois. O save continua na **v18**: todos os campos novos são opcionais e validados.

## Base, branch e commit

- Base: `e29fc85` (REWORK 3: origem, formação e vida concreta)
- Branch: `claude/fix-pos-rework3-playtest`, sem merge em `main` e sem deploy
- Commit: o commit deste relatório, na mesma branch

## O que já existia antes da retomada

A execução foi interrompida duas vezes (um crash e um desligamento manual). O working tree foi preservado nas duas vezes e nada foi refeito do zero. Antes da última retomada já existiam:

- os módulos `paralelas`, `academia`, `cena`, `conteudo/carreiras`, `objetivos`, `autoescola`, `habilitacoes`, `experiencias` e `autoria`;
- a integração deles em motor e UI;
- os testes causais (`fixPosRework3.test.ts`/`.tsx`);
- o simulador dirigido (`scripts/sim/fixPosRework3.ts`);
- o gerador de cenários visuais (`scripts/playtest/*FixPosRework3*`).

Nesta retomada:

- fechei a depuração das simulações de arte e esporte;
- estabilizei três testes estatísticos ou lentos;
- tratei `.arena/skills` e `tsbuildinfo`;
- rodei de novo toda a validação (o `/tmp` com os resultados anteriores se perdeu no desligamento);
- escrevi este relatório.

Ruído de line endings: 293 arquivos tinham só CRLF de diferença. Voltaram para LF, e o novo `.gitattributes` (`* text=auto eol=lf`) evita que o problema volte.

## P0 corrigidos

### 1. Grandes decisões não são automáticas

**ANTES:**
- O doutorado em São Paulo mudava a cidade.
- O convite para atuar substituía a carreira de professor.
- A bolsa de pesquisa apagava a carreira de ator.

**DEPOIS:**
- Toda porta que não seja uma troca já escolhida passa pela pergunta de conflito (`compromissos`). São portas de convite, bolsa, indicação, concurso ou retorno.
- A troca já escolhida é a candidatura pela tela de vagas, que avisa antes o que se perde, ou começar por conta própria.
- A pergunta lista as alternativas **com a consequência de cada uma**:
  - deixar o trabalho;
  - pôr a carreira em pausa (licença sem salário, no caso de servidor);
  - manter em paralelo, quando conciliar é plausível;
  - seguir no principal e fazer o novo em paralelo.
- Curso presencial em outra cidade vira conflito `cidade`: só "se mudar" muda de cidade.
- As outras mudanças de cidade que sobraram são opções explícitas de decisão, obrigação militar ou cargo eleito.

**FONTE DE VERDADE:** `conflitoComEmprego`/`conflitoComCidade` → plano escolhido → `aplicarNovo`. A mutação só acontece depois da escolha.

**TESTE:** casos 1, 2, 3 e 19 em `src/motor/__tests__/fixPosRework3.test.ts`.

### 2. Trajetórias profissionais não são um slot

**DEPOIS:** a vida profissional tem estados distintos.

| Estado | Onde fica | Como funciona |
| --- | --- | --- |
| Principal | `trabalho.atual` | O trabalho de todo dia |
| Paralela | `trabalho.paralela` | Rende uma fração (`FATOR_PARALELA` 0,45), ocupa parte da semana e tem ações próprias |
| Pausada | `trabalho.pausadas` | O currículo, a freguesia e o nome ficam guardados. Voltar é **retorno**: a freguesia volta menor, mas não do zero. A licença de servidor espera 36 meses e o jogo pergunta antes de ela acabar (`conteudo/carreiras`) |
| Encerrada | `trabalho.historico` | Continua como biografia |

A UI de Trabalho mostra "A sua trajetória profissional", um bloco próprio para a paralela e as pausadas com "retomar".

**TESTE:** casos 1, 2 e 12, mais o teste de save.

### 3. A notoriedade pertence à pessoa

**DEPOIS:**
- O nome vem do trabalho artístico (principal ou paralelo) e do currículo recente, não só do grupo.
- Ele sobe depressa e cai devagar, ainda mais devagar quando veio do palco ou do campo.
- Trocar de trabalho não zera a notoriedade: quem foi conhecido continua sendo alguém "de quem já se ouviu falar" (`notoriedade.ts`).

### 4. Escolha explícita sempre resolve

**ANTES:** aceitar o convite do festival depois de "A Casa Vazia" terminava em "Nada aconteceu."

**DEPOIS:** `apresentarNoFestival` sempre gera um resultado: cachê, público, item no currículo, Linha da Vida e, às vezes, um convite. Mesmo o fracasso é narrado ("para pouca gente… o cachê e a experiência ficaram").

**TESTE:**
- caso 4;
- a simulação A conta as linhas "Nada aconteceu": **0 em 200 vidas**.

### 5. NPC não fica empregado e desempregado ao mesmo tempo

**DEPOIS:** a parceria e os amigos próximos usam a **mesma** simulação de carreira dos filhos adultos: entrada → experiência → promoção ou estagnação com motivo → demissão → recolocação.

- `ocupacaoId`, `ocupacao` e `renda` mudam juntos.
- Quem tinha renda sem cargo definido ganha um cargo compatível.
- A promoção não vem pela idade.

**TESTE:**
- casos 5 e 18;
- simulação B: **0 incoerências** (antes, 5).
- Cargos diferentes por parceria: mediana 4 (antes, 1).

### 6. Troca de instituição tem efeito imediato

**DEPOIS:** na escola nova, o que era institucional da antiga (o time, o grêmio) acaba na hora, mesmo que a escola nova tenha uma atividade igual. O que é independente continua, e o histórico fica.

**TESTE:** caso 10.

## Progressão acionável

| Onde | A tela aponta | A ação que mexe na mesma variável | Teste |
| --- | --- | --- | --- |
| Futebol | técnica "de escolinha" | **treino de fundamentos** (escolinha paga pela família ou projeto social de graça, se menor de idade), melhora a `habilidade` que a peneira consulta | 6 |
| Vestibular | "mais português" | **estudo dirigido por matéria**, a mesma conta da prova | 7 |
| Mestrado/doutorado | rejeição | avaliação com fatores separados: histórico, pesquisa, projeto, tentativas. A rejeição diz o fator real; **preparar o projeto** mexe no fator controlável | 8, 20 |
| Teatro | "falta público" | apresentar-se, teste de elenco, trabalho pequeno, edital, festival, cada um com resultado e item no currículo | 4 |
| Concurso de professor universitário | "muito difícil" com mestrado e doutorado | a UI deriva da mesma avaliação do concurso (formação, produção, preparo, concorrência) | 11 |

- **Causas reais:** devolutivas de peneira, pós, edital e teste de elenco dizem o fator que pesou na conta.
- **Objetivos (`objetivos.ts`):** cada devolutiva alimenta o seu objetivo, com tentativas, último resultado, obstáculo e caminho. Não é quest log e nada inventa motivo depois. Na simulação A, 81% a 100% das vidas de cada grupo têm um objetivo com 2 ou mais tentativas.
- **Titulação concluída** nunca volta como próximo passo (caso 11).

## Formação e trabalho

- **"Para você agora":** o ranking de vagas pesa formação superior, elegibilidade e trajetória recente. A estrada antiga de outra área pesa menos. Estágio que exige matrícula fica inelegível depois da graduação (caso 9).
- **Formação:** o catálogo mostra hierarquia (para você agora, depois as categorias) em vez de "Ao alcance (49)". Mudar de área continua possível.

## Pessoas e NPCs

- **Ações contextuais (`interacoes.ts`)** vêm de onde a relação nasceu:
  - professor ou orientador: relação de ensino, com conselho que diz o que a conta do motor diz;
  - ex-professor: voltar a procurar, agradecer;
  - quem veio do esporte: a modalidade praticada junto.
  - O menu genérico é o fallback (caso 17).
- **Romance adolescente:** existe o gesto de demonstrar interesse por alguém da mesma idade. A reciprocidade não é garantida, e a segurança se mantém: não há gravidez em namoro adolescente (caso 16).
- **Pet:** toda chamada de `<Retrato>` para uma pessoa do jogo passa a espécie. O teste audita o código (caso 13, UI).

## Carreiras especiais

- **Academia (`academia.ts`):**
  - ações de projeto de pesquisa, orientação, colaboração e financiamento;
  - a produção pesa na bolsa de pós-doc, no concurso e no desempenho;
  - a leitura mostra linha de pesquisa, produção e orientações.
- **Sem vazamento entre carreiras:** professor e ator aparecem em blocos separados, e a turnê não fica entre as ações da universidade (caso 12, motor e UI).
- **Cena (`cena.ts`):**
  - prática → apresentações → testes e trabalhos pequenos → edital → currículo → convites maiores;
  - o porte da produção que chama para o teste acompanha o currículo e o nome;
  - o contato da produção fica na vida do personagem.
  - O **currículo** (`caminhos.curriculo`, até 40 itens) guarda tipo, título, papel, onde, repercussão, cachê e contato. Ele continua depois da pausa.
  - Produções e títulos são **fictícios**, e as casas são genéricas ("uma emissora de TV aberta").
- **"Guardar tempo para a própria obra":** a descrição vem do efeito real no motor. A renda cai uns 18%, a freguesia cresce mais devagar, a prática rende mais e a próxima obra sai mais cuidada.
- **Especialização:** a do Direito já existia e afeta desafios e desempenho. Agora ela aparece na ficha do trabalho.

## Crime

**ANTES:** a descoberta abria processo direto. Nas mesmas sementes, 100% dos que aprofundaram foram processados e 86% a 92% foram presos.

**DEPOIS:** a trajetória segue entrada → ganhos/exposição → **investigação**, que vira processo ou é **arquivada** → processo → prisão, continuidade ou saída.

- A experiência no caminho reduz o crescimento da exposição.
- **Ficar na moita** (escolha na pergunta do rumo) reduz a exposição e o ganho pela metade.
- Parar esfria a investigação.
- Nenhuma instrução real de crime é dada.

Simulação C, até os 45 anos, com **120 vidas por grupo**, mesmas sementes antes e depois:

| grupo | proposta (antes → depois) | investigado | arquivada | processo (antes → depois) | prisão (antes → depois) | ainda dentro aos 45 (antes → depois) |
| --- | --- | --- | --- | --- | --- | --- |
| não persegue (vida comum) | 15% → 19% | — | — | — | — | — |
| recebe e recusa | 21% → 22% | — | — | — | — | — |
| aprofunda | 100% → 99% | 100% | 0% | 100% → 100% | 89% → 83% | 21% → 35% |
| aprofunda, mas na moita | 100% → 99% | 97% | 41% | 97% → 83% | 83% → 50% | 37% → 55% |

- Quem aprofunda sem cautela continua sendo alcançado. É consequência da exposição, não prisão programada.
- A cautela muda o desfecho: 41% das investigações são arquivadas e metade não é presa.
- Proposta ilícita em vidas comuns: o gerador de propostas não foi alterado. Com 40 vidas a seção C mostrava 11% → 26%. Com 120 vidas, 15% → 19%, dentro do ruído (erro-padrão de ~3,5 p.p.). Na calibração G (80 vidas comuns) foi 16% → 12%. O crime não domina as vidas comuns.

## Patrimônio

As **experiências** (`experiencias.ts`) compram possibilidades de vida, não objetos: viagem pelo Brasil e ao exterior, curso de um gosto antigo, ano sabático curto, bancar o projeto de alguém, doação.

- Cada uma custa, deixa memória (Linha da Vida e com quem foi junto) e tem efeito real: descanso, vínculo, prática, causa.
- **Luxo não dá fama.**

Simulação E (dos 30 aos 42):

| faixa | experiências vividas (mediana) | 2+ imóveis | barco ou avião |
| --- | --- | --- | --- |
| baixa renda | 3 | 0% | 0% |
| média | 4 | 0% | 0% |
| alta | 6 | 10% | 38% |
| milionária | 6 | 63% | 60% |

## Veículos e habilitações

- **Categorias e forma (`dados/bens.ts`):**
  - carros: hatch, sedã, SUV, picape, esportivo;
  - motos: scooter, rua, esportiva, clássica, trilha;
  - bicicletas: urbana, estrada, MTB;
  - **embarcações** e **aeronaves**, raras e caras.
- Cada forma tem um desenho próprio (`Desenhos.tsx`). A picape aparece como picape na frente da casa (casos 18, motor e UI).
- **Possuir não é habilitação (`habilitacoes.ts`):** o curso náutico e a formação de piloto são longos, caros e têm resultado.
- **Autoescola (`autoescola.ts`):** matrícula → preparação → prova teórica **interativa** → prova prática → carteira ou reprovação com o porquê.
  - Na prova teórica, o jogador responde 3 perguntas originais de direção segura, sem artigo de lei. As outras ficam com a preparação do personagem.
  - A antiga CNH de um clique foi removida.
- **"Seus veículos"** (Casa) mostra desenho, modelo, ano, condição, valor e as ações.

## Compras e estilo

- **Bug da loja:** a categoria agora tem fonte única no catálogo da loja. "Motos e bicicletas" não mostra carro nem o filtro "Carros" (caso 14, motor e UI, e a captura em 390 px confirma).
- **Organização:** as lojas de estilo são separadas (ótica, roupas, acessórios/joalheria) e há variedade moderada.
- **Posse usável:** relógio e joia seguem comprar → usar → guardar → persistir no save. O retrato mostra corrente e brincos (caso 15).
- **Aparência ≠ estilo ≠ notoriedade:** a leitura "No que você é bom" (`estadoPessoal.ts`) deriva das fontes que já existiam (frentes, cognição, corpo), sem criar fonte nova.

## Autoria

`autoria.ts`: o jogo sugere o nome de grupo, negócio ou obra, e o jogador mantém ou renomeia (2 a 40 caracteres, validado).

- O nome novo vale em tudo o que vem depois, e a troca fica na Linha da Vida.
- Instituições alheias não se renomeiam.

## Eventos

Em "primeiros" e "infância", os eventos que antes eram garantidos em toda vida viraram variantes, com seleção contextual. A primeira amizade começa num ponto diferente da lista a cada vida.

Simulação F (30 infâncias, até os 12 anos):

| medida | antes | depois |
| --- | --- | --- |
| linhas iguais entre duas vidas quaisquer | 30% | 21% |
| "A primeira palavra" | 100% das vidas | 30% das vidas |
| "primeiros passos" | 100% das vidas | 70% das vidas |

## Navegação

**Tempo livre** virou a sétima área estável: História, Você, Pessoas, Formação, Trabalho, Tempo, Vida.

- Não voltou a barra infinita.
- O destino `'tempo'` continua aceito.
- A barra do celular com 7 áreas cabe em 390 px (teste de UI 38 e capturas).

## Autônomo ≠ dono de negócio

O rótulo "Retirada do negócio" agora verifica se o negócio é mesmo o trabalho de todo dia. Por conta própria (clientes, renda variável) e negócio (caixa, estrutura) continuam distintos.

## Save e migração

- **Continua na v18.** Não houve subida de versão, porque todos os campos novos são **opcionais**:
  - `trabalho.paralela`/`pausadas`;
  - `caminhos.objetivos`/`curriculo`/`academia`;
  - processo da autoescola;
  - itens em uso;
  - habilitações raras.
- Saves v18 antigos não têm esses campos e continuam válidos.
- O `validar` checa a forma dos campos quando eles existem.
- **Teste:** save → reload devolve iguais a paralela, a pausada, os objetivos, o currículo, a vida acadêmica e o processo da autoescola.

## Testes

- **Testes causais novos:**
  - motor: 23 em `src/motor/__tests__/fixPosRework3.test.ts`, cobrindo os 20 obrigatórios mais autoescola, crime e save;
  - UI: 6 em `src/ui/__tests__/fixPosRework3.test.tsx`.
- **Testes existentes ajustados por mudança intencional:** navegação (Tempo livre é área própria), veículos (forma por categoria), CNH interativa.
- **Estabilização estatística**, sem afrouxar a propriedade testada:
  - `politica`, porta comunitária: a taxa real medida é 83 de 192 vidas (43%), e lotes de 48 sementes oscilam de 16 a 23. O teste passou a usar 96 vidas com limiar de 1/3, e o comentário registra a medição.
  - `profissao`, "treinar dobrado machuca mais": com 24 vidas a diferença ficava dentro do ruído. Com 60 vidas ela aparece, e o teste ganhou timeout próprio de 90 s.
  - `vite.config.ts` recebeu `hookTimeout: 60000`: o `precarregar()` dos testes de interface importa todas as telas e passa de 10 s em disco lento (WSL em /mnt/c).
- **Suíte completa: 30 arquivos, 755/755.**

## Typecheck, build e smoke

- `tsc --noEmit`: limpo.
- `npm run build:itch`: limpo, sem aviso de tamanho, com `index.html` na raiz do ZIP.
- `npm run smoke:itch`: **18/18**.

## Simulações

O script é `scripts/sim/fixPosRework3.ts`, com 40 vidas por grupo. O "antes" roda o mesmo script no commit-base, com as seções que já existiam ali.

**A. Profissões** (até os 40, 40 vidas por grupo; "Nada aconteceu" = 0 em todos):

| grupo | no caminho | paralela | notoriedade ≥ 10 |
| --- | --- | --- | --- |
| comum | 78% | 0% | 0% |
| arte (vive ou viveu de arte) | 83% | 75% | 83% |
| academia | 43% | 5% | 0% |
| esporte (chegou a uma base) | 45% | 0% | 32% |
| negócio | 74% | 3% | 0% |

Ainda na seção A, dois problemas apareceram e foram corrigidos na retomada:

- **Arte e esporte davam 0%.**
  - **Esporte:** o treino de fundamentos pedia que o próprio menor de idade pagasse. Agora a família paga a escolinha quando pode e, quando não pode, há o projeto social do bairro.
  - **Arte:** o convite "viver de atuar" nasce durante a ação do ano, com validade de 12 meses, e expirava na virada do ano. O jogador o via no mesmo ano, mas o agente simulado não.
- **Correções da arte:**
  - no motor, os convites gerados por ação (teste de elenco, festival) passam a valer até o ano seguinte (24 meses);
  - no simulador, as oportunidades abertas pelas ações do ano são reavaliadas antes de virar o ano.

**B. NPCs:** 0 incoerências (antes, 5). Cargos por parceria: mediana 4 (antes, 1). Demissões 23 e recolocações 22.

**C. Crime:** ver a seção Crime.

**D. Formação** (aos 35):

| grupo | na área da formação | pós/mestrado |
| --- | --- | --- |
| segue a área | 41% | 15% |
| muda de área | 48% | 3% |
| pós | 10% | 100% |

**E. Patrimônio:** ver a seção Patrimônio.

**F. Eventos:** ver a seção Eventos.

**G. Calibrações** (80 vidas comuns):

| medida | antes | depois |
| --- | --- | --- |
| casa própria aos 40 | 8% | 6% |
| ajuda da família até os 40 | 75% | 72% |
| proposta ilícita até os 45 | 16% | 12% |

- **Casa própria:** o simulador agora escolhe entre as ofertas reais da cidade a que cabe no financiamento. Antes tentava sempre o mesmo modelo. A taxa continua baixa sem ter sido facilitada artificialmente (ver pendências).
- **Ajuda da família:** mantida de propósito. A diferença está dentro da amostra.

## Responsividade

Três cenários gerados (`scripts/playtest/gerarFixPosRework3.ts`):

- professora universitária que atua em paralelo;
- milionária com barco e relógio;
- adolescente tentando a peneira.

Capturas em Trabalho, Você, Tempo livre, Vida/Casa e loja de motos, a **1440, 820 e 390 px** (21 capturas): **nenhuma rolagem horizontal e nenhum erro de página**.

Conferência visual:
- blocos separados de trajetória (principal e "Atriz — em paralelo" com ações próprias) em 390 px;
- loja de motos e bicicletas só com motos e bicicletas;
- picape desenhada como picape;
- barra de 7 áreas legível no celular.

## PENDÊNCIAS ENCONTRADAS

1. **Outros esportes:** vôlei, natação, atletismo e lutas já existiam na base, com auge por modalidade. A diferenciação mais funda por modalidade (entrada, remuneração, competição individual × equipe) não foi expandida. Basquete e tênis não existem.
2. **Especialização em Medicina** (formação ampla → residência/especialidade → oportunidades diferenciadas): não implementada. Só o Direito tem especialização com efeito.
3. **Casa própria aos 40 (6%):** a estratégia de escolha foi corrigida, e a taxa baixa agora parece vir de renda e financiamento de verdade. Vale uma calibração com amostra grande (a futura simulação de 1.000 vidas).
4. **Ajuda familiar (~72%):** reavaliar na simulação de 1.000 vidas antes de calibrar.
5. **Cachê de teste de elenco:** o valor é fixo por porte e papel (por exemplo, R$ 49.400 repetido). Falta variação, negociação e agente/agência como entidade própria.
6. **Audiovisual e publicidade** como trilhas contratuais (contrato de novela, exclusividade, conflito de agenda com o principal): existe só o item de currículo e o convite. Contratos e conflitos de agenda ficaram de fora.
7. **Repetição de infância (21%):** as linhas mais repetidas agora são de amizade na igreja e da recessão do país. É preciso mais variantes nesses dois grupos.
8. **Cena "milionária" gerada para as capturas:** o cenário sintético mora com os pais e aparece como "sustentado pela família" apesar da conta alta. É um artefato do gerador, não do jogo, mas vale revisar o texto de "Quem paga a casa" quando há reserva grande e nenhuma renda.
9. **`.claude/skills`:** cópia idêntica, só com CRLF, de `.arena/skills`, criada por ferramenta antes do FIX (27/09). Não é parte do FIX: `.arena/skills` foi restaurado e `.claude/` ficou fora do commit. Se a migração para skills do Claude Code for desejada, é preciso uma mudança própria, e o formato é outro (`<nome>/SKILL.md`).

## Riscos conhecidos

- **Testes estatísticos por semente:** qualquer mudança do motor desloca as vidas sorteadas. Os três testes sensíveis agora têm amostra dimensionada pela variância medida, mas continuam dependentes de amostragem.
- **Convites com validade de 24 meses:** um convite gerado por ação fica visível no ano seguinte. Isso é intencional, mas pode acumular portas em vidas muito ativas. O limite `LIMITE_OPORTUNIDADES` continua valendo.
- **Trajetória paralela:** rende 45% do trabalho. Em combinações raras (duas carreiras por projeto), a semana pode ficar mais cheia do que a leitura sugere.
- **Crime:** "aprofunda sem cautela" ainda termina preso em ~79% das vidas até os 45. Isso é consequência da exposição acumulada e foi mantido de propósito, mas deve ser olhado na simulação de 1.000 vidas.
- **`tsconfig.tsbuildinfo`:** é artefato gerado. Agora está no `.gitignore` e não é versionado.
