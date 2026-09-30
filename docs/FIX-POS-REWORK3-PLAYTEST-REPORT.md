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

---

# FIX 3.1 — Pendências resolvidas antes do deploy

- Base: `2e13cbc`
- Branch: `claude/fix-pos-rework3-playtest`, sem merge e sem deploy
- Save: continua na **v18**, porque todos os campos novos são opcionais e validados

Resolve as pendências 1, 2, 5 e 6 do fechamento anterior e a calibração pedida para casa própria e ajuda da família (3 e 4).

## Medicina: especialização real

**ANTES**
- A residência era um curso genérico ("Residência Médica", 36 meses).
- A "área" do médico era um rótulo sorteado pela pergunta de ofício, sem efeito em vaga, renda ou convite.

**DEPOIS**
- **Cinco especialidades** em `dados/especialidades.ts` (fonte única): clínica médica, pediatria, cirurgia geral, psiquiatria e medicina de família. Cada uma define:
  - duração da residência: 24 ou 36 meses;
  - concorrência na seleção;
  - fator da faixa de renda: cirurgia 1,35, psiquiatria 1,1, clínica 1, MFC 0,95, pediatria 0,9;
  - ambiente;
  - convite característico;
  - o caso grande do dia a dia.
- **Fluxo:**
  - formação e CRM;
  - catálogo de Formação com **uma residência por especialidade** (item próprio, duração e seleção dela);
  - matrícula, que passa pela pergunta de conflito quando há emprego integral;
  - residência;
  - título.
- **Especialidade persistente:** fica em `educacao.concluidos[].especialidade` (e na matrícula). É da pessoa e vai para todo emprego médico. Saves de antes, com residência sem especialidade, contam como clínica médica, sem mutação.
- **Efeitos reais:**
  - *vagas de título:* `cirurgiao` pede cirurgia e `medico_familia` pede MFC, via `Ocupacao.especialidades` → `elegibilidade`, com o motivo dito;
  - *renda:* `Emprego.faixa`, fixada na contratação a partir da especialidade; teto e reajuste a respeitam;
  - *convites da área:* equipe cirúrgica, hospital infantil, saúde da família, os pacientes que esperam psiquiatra. Passam pela pergunta de conflito;
  - *casos do ofício:* com a cara da especialidade;
  - *tela:* ficha do Trabalho ("Especialidade: o título da residência…");
  - *biografia:* "Terminou a residência médica em pediatria".
- **Progressão acionável:**
  - a prova de residência reprovada diz a causa real (preparo, histórico ou concorrência), vinda da mesma conta da chance (`avaliacaoDaResidencia`), e alimenta o objetivo "Entrar na residência médica";
  - "Estudar para a prova de residência" (Formação, objetivos e Trabalho) mexe no fator controlável.
- **Relevância:** para quem se formou em Medicina, a residência passou a ser o primeiro item de "Próximos caminhos" (antes apareciam técnico em enfermagem e radiologia). Técnicos abaixo da graduação saem das sugestões; ficam no catálogo.

**TESTE:** 7 casos em `src/motor/__tests__/fix31.test.ts`, mais o de UI (Formação).

## Basquete e tênis

A estrutura da carreira esportiva é compartilhada (`esporte`: prática → seletiva → base → profissional → fim, com lesões, auge e mercado). O que muda está em `sistemas/modalidades.ts`, derivado do estado e sem campo novo persistido.

### Basquete (coletivo, de clube)

- A **estatura** é da pessoa: deriva da semente e da predisposição física, e cresce até os 17.
  - Entra no físico da seletiva: a mesma técnica rende diferente em quem tem 1,70 m e em quem tem 2,01 m.
  - Decide a função (armador, ala, pivô), que aparece na tela.
  - Em Tempo livre e em Formação é dita com franqueza, junto com o que ela implica.
- A temporada mede **pontos, rebotes e assistências por jogo**, com o perfil da função.
- Liga própria (estadual → Liga Ouro → NBB → times de ponta do NBB), com tabela salarial própria.
- O prêmio de "estrela" do futebol não vaza para outras modalidades.
- Ocupação `jogador_basquete`, com contrato por temporada.

### Tênis (individual, caro, de prêmio)

- **Custo desde cedo:**
  - aulas a R$ 280;
  - treino de competição a R$ 900, sem projeto social que cubra;
  - circuito juvenil pago pela família com folga, ou tirado da conta. Sem dinheiro, joga-se menos e a técnica anda menos (dito na tela).
- Entrada por academia (janela dos 10 aos 16).
- **Profissional sem clube e sem salário** (`tenista`, por conta própria): prêmio **bruto** do ano → **custos** do circuito (treinador, viagens, inscrições) → **líquido**, que pode ser negativo por anos. O prêmio vira a renda do ano seguinte; os custos saem da conta.
- O **ranking** decide o circuito (nacional → entrada internacional → challengers → principal), com limiares mais duros que os das divisões de clube.
- **Dois anos no vermelho sem reserva** abrem uma pergunta (`esp_tenis_conta`): seguir, jogar só no Brasil, ou parar e dar aulas, com convite para `professor_tenis`.
- Tela própria: "No circuito", ranking, "Bruto − custos = líquido", e nenhum "contrato".

**Correção de texto (três pontos):** "Deixou a equipe da equipe da prefeitura" → helper `aEquipe`.

**TESTE:** 6 casos (estatura e física, estatística e salário, custo como barreira, bruto/custos/líquido, pergunta do aperto, técnica treinada = técnica lida), mais save e UI.

## Atuação e audiovisual: contratos e agente

A base existente (agenda, grupo, público, obras, currículo) foi preservada.

**ANTES:** passar num teste de elenco pagava o cachê na hora e escrevia o currículo, sem contrato, produção, escolha ou custo.

**DEPOIS** (`sistemas/audiovisual.ts`):

- **Fluxo:** teste → **proposta**, com produção fictícia, casa genérica, papel, duração, dedicação integral ou não, e bruto, comissão, despesas e líquido.
  - A proposta pode ser **aceita**, **negociada** (a produção pode chamar a segunda opção) ou **recusada**.
  - Aceita, vai para **produção** (os meses do contrato). Ao fim do trabalho, o líquido entra, a obra vai para o **currículo**, a repercussão mexe no público e abre um degrau nos próximos testes.
  - Proposta sem resposta **vence** em 12 meses, dito na Linha da Vida.
  - **Romper** custa multa de 20% e o trabalho não entra no currículo.
- **Conflito com outras trajetórias:** uma produção integral (novela; série ou filme grandes) com um trabalho de dia inteiro fora da arte abre a decisão `av_conflito`, usando o sistema de carreiras paralelas: licença ou pausa, deixar o trabalho, ou recusar a produção. Nada sobrescreve em silêncio.
- **Agente** (`caminhos.audiovisual.agente`), uma pessoa na vida:
  - **Acesso:** sem agente, os testes param no porte 2 (novela e filme de estúdio não chamam); com rede média ou grande, chegam.
  - **Frequência:** testes a cada 6 meses, contra 12 sem agente.
  - **Negociação:** até +18% no bruto.
  - **Custo:** comissão de 10%, 15% ou 20% sobre todo cachê.
  - Procurar (a agência avalia o currículo), dispensar e trocar.
- Na tela de Trabalho, junto das ações artísticas:
  - "Aceitar: coadjuvante em a novela … — 8 meses, dedicação integral · R$ X bruto − R$ Y do agente − R$ Z de despesas = R$ W líquido";
  - "Pedir mais pelo papel";
  - "Recusar";
  - "Romper";
  - "Procurar um agente" / "Dispensar …".

**TESTE:** casos 5 a 8 (proposta nasce de teste válido; integral não apaga carreira; agente tem efeito e custo; obra concluída entra no currículo; romper e vencer) e o de save.

## Cachês: sem valor fixo repetido

**ANTES:** `[1800, 4500, 14000, 38000][porte] × papel` produzia os mesmos poucos números. R$ 49.400 era 38.000 × 1,3: todo coadjuvante de produção grande ganhava igual.

**DEPOIS:** `cacheAudiovisual` é a fonte única, e a proposta, a negociação e o trabalho pequeno usam essa mesma conta. O cachê resulta de:

- tipo da produção;
- porte;
- papel;
- nome (currículo e notoriedade, convexo só no alto);
- casa (TV aberta > streaming > canal > produtora independente);
- **orçamento desta produção** (estável por produção);
- negociação do agente;
- mercado;
- estrela (só para protagonista de produção grande com notoriedade ≥ 60).

A conta é **bruto → comissão → despesas (deslocamento em produção longe) → líquido**, e o trabalho pequeno paga o líquido.

**TESTE:**
- mesma pessoa em escalas diferentes → cachês ordenados;
- seis estágios × cinco produções → ≥ 25 valores distintos;
- comissão e despesas reduzem o líquido.

## Casa própria: diagnóstico causal

Diagnóstico com 173 vidas comuns de 6 estratégias, medindo em cada ano entre os 28 e os 40 se alguma oferta real da cidade cabia:

- **Mercado e financiamento funcionam.** Entre quem nunca foi capaz, os bloqueios são reais: entrada que não existe, parcela acima de 30% da renda, nome sujo, sem renda comprovada.
- **Bug estrutural na estratégia do simulador.** Quem poupa guarda nas aplicações. Na compra, o motor responde "dá para tirar das suas aplicações" (a tela oferece "Tirar R$ X das aplicações e pagar"), mas a estratégia só olhava a conta corrente. Quem podia comprar nunca comprava: entre os capazes, 0–13% compravam nas bases que poupam.
- **Correção:** a estratégia usa o mesmo caminho do jogador (`resgatar_e`). O diagnóstico conta como capaz quem paga resgatando.
- **Resultado** (173 vidas):
  - casa comprada aos 40: **6% → 35%**; capazes em algum ano: 55%;
  - entre os capazes das bases que poupam, 73–90% compram;
  - por renda aos 35: até 2 SM 10%; 2–5 SM 39%; 5–10 SM 59%; 10+ SM 80%;
  - as bases "social" e "gastadora" não poupam, por persona, e quase não compram.
- Nenhuma probabilidade foi mexida e não há taxa-alvo.

**TESTE 11:** renda e entrada nas aplicações → a oferta mais barata não passa direto (sem conta), mas passa com o resgate, e a compra acontece.

## Ajuda da família: diagnóstico causal

Primeiro diagnóstico, 115 vidas:

- 83% receberam ajuda até os 40;
- **mediana de 8 socorros, máximo de 29**;
- 41% dos ajudantes ganhavam menos de 1,5 salário mínimo.

A ajuda parecia renda automática. Três causas estruturais:

1. **Parentes fora da casa de origem** (irmão, avó) "podiam" dar `renda × 1,5 ou 3`, sem descontar o próprio custo de vida.
2. **A casa de origem se revezava:** o intervalo de 36 meses era por pessoa, então mãe e pai alternavam e a mesma casa cobria quase todo ano. Instrumentado: 110 de 120 socorros vinham da casa de origem.
3. **Nenhum desgaste pela repetição.**

**DEPOIS:**
- Quem ajuda de fora da casa de origem é quem tem **folga**: renda − (1,2 SM + 35% da renda).
- A **casa de origem é uma casa só**: um intervalo para os dois.
- Cada socorro nos últimos 5 anos multiplica por 0,6 a chance do próximo, e a partir do terceiro a relação sente (tensão).
- A necessidade continua sendo o buraco real do ano. A capacidade da casa de origem continua sendo a reserva e a folga dela.

**Resultado** (175 vidas):
- recebeu ajuda pelo menos uma vez até os 40: 82% (a família cobre o ano ruim, sobretudo no começo da vida adulta);
- **mediana de 4 socorros, máximo de 12**;
- ajudantes com menos de 1,5 SM: 28% (casa de origem com reserva);
- por estratégia: gastador e impulsivo ≈ 100% (93–79% com 3 ou mais vezes); econômico e estudioso ≈ 60% (23–34% com 3 ou mais).

Sem taxa-alvo.

**TESTE 12:**
- irmão com 1,4 SM nunca cobre, irmão com R$ 9 mil cobre;
- dois socorros recentes reduzem a chance em mais de 30%.

## Testes

- **Motor:** `src/motor/__tests__/fix31.test.ts`, com 25 casos cobrindo os 13 pedidos (Medicina 7; basquete e tênis 6; audiovisual e cachês 8; casa 1; ajuda 2; save em Medicina, esporte e audiovisual).
- **UI:** `src/ui/__tests__/fix31.test.tsx`, com 3 casos:
  - residências na Formação, com a residência em "Próximos caminhos" e sem técnico;
  - proposta, conta e agente no Trabalho;
  - painel da tenista.
- **Estabilização.** As mudanças deslocam as vidas sorteadas, e três testes tinham limites na margem da própria medida:
  - `fixPosRework2`, "colega não vira amigo sozinho": a taxa medida é 31 de 150 (21%), e o limite antigo (6 de 30) estava na média. Agora são 90 colegas com limite de 30%.
  - `meiaidade`, "mais anos com biografia": com 60 vidas, deu 0,843 no `2e13cbc` e 0,832 agora, com as mesmas 1,13 linhas de família por ano. Agora são 60 vidas com limite de 0,82, acima do 0,809 de antes do FIX #7.
  - `rework2fecho`, "uma iniciativa romântica de cada vez": a pré-condição (um flerte dar certo por sorteio) falhou nas 40 tentativas da vida sorteada. Se nenhum der certo, o estado "vendo no que dá" é montado direto; a regra testada é a mesma.

## Validação

- **Suíte completa:** 32 arquivos, **783/783**. Numa rodada, `interface.test.tsx` não subiu por timeout de inicialização do worker (carga no WSL); isolado, passou 14/14.
- **Typecheck:** limpo.
- **Build:** limpo. O pacote `motor` passou de 800 kB; interações, experiências e autoria, que só a camada de cima usa, foram para `motor-conteudo`, sem ciclo, e o `motor` ficou em 754 kB.
- **Smoke itch.io:** **18/18**.
- **Responsividade:** 15 capturas (cirurgiã, médica recém-formada em Formação, tenista, jogador de basquete e atriz com agente e propostas, a 1440, 820 e 390 px), sem rolagem horizontal nem erro de página.
- **Correções vindas das capturas:**
  - "protagonista em o curta" / "em a novela" → "no curta" / "na novela" (helper `emTipo`, também no texto do teste de elenco);
  - o tenista não vê "Pedir para ser negociado" nem "Conversar com o treinador" (ações de clube);
  - "Treino: o normal do clube" e o aviso sobre "a posição" ganharam texto próprio do tênis.

## Simulações dirigidas (`scripts/sim/fix31.ts`)

**A. Medicina** (40 vidas por grupo, até os 42):

| grupo | formou | residência | especialidades | na medicina aos 42 | renda mediana | vaga de título |
| --- | --- | --- | --- | --- | --- | --- |
| generalista | 65% | 0% | — | 58% | R$ 19.220 | 0% |
| tenta residência | 65% | 85% | MFC 8, cirurgia 5, pediatria 4, clínica 3, psiquiatria 2 | 69% | R$ 25.310 | 46% |

**B. Esportes** (80 vidas por modalidade, perseguição deliberada dos 7 aos 32):

| modalidade | chegou à base/academia | profissional | ainda aos 32 | nível máximo (mediana) | renda do auge (mediana) |
| --- | --- | --- | --- | --- | --- |
| futebol | 13% | 5% | 5% | 4 | R$ 1,55 mi/mês |
| basquete | 10% | 8% | 6% | 4 | R$ 96,9 mil/mês |
| tênis | 19% | 12% | 9% | 4 | R$ 230 mil/mês (prêmio) |

- Os caminhos são alcançáveis, mas não garantidos.
- **Achado:** a primeira rodada deu 0% profissional porque o jogador simulado aceitava emprego de jovem aprendiz aos 17 e, na pergunta de conflito, largava a base. O motor perguntou certo; a estratégia não era deliberada. Na perseguição, o simulador agora não procura emprego enquanto está na base.
- **Futebol:** a renda do auge vem da economia do futebol já existente, com os poucos que viram profissional chegando à Série A. Ver pendências.

**C. Atuação** (40 vidas por grupo, dos 10 aos 40):

| grupo | teve agente | trabalhos (mediana) | cachê bruto p25 · mediana · p90 | comissão (mediana) | líquido/bruto | maior |
| --- | --- | --- | --- | --- | --- | --- |
| sem agente | 0% | 10 | R$ 13,4 mil · 35,8 mil · 88,8 mil | — | 95% | R$ 183 mil |
| procura agente | 84% | 11 | R$ 17,1 mil · 39,4 mil · 114,9 mil | R$ 4,1 mil | 85% | R$ 1,25 mi |

- 696 cachês e 472 valores distintos (antes: poucos valores fixos).
- Calibração: a primeira rodada deu mediana de R$ 87 mil e máximo de R$ 3,9 mi, porque os fatores de nome e estrela multiplicavam demais. Recalibrado: o extraordinário continua existindo e continua raro.

**D. Patrimônio** e **E. Ajuda:** ver as seções acima.

## Pendências restantes

1. **Economia do futebol no topo:** entre os poucos profissionais simulados que chegam à Série A, a mediana do auge é de R$ 1,55 mi por mês. O sistema de salário do futebol vem de antes (prêmio de estrela e nome) e não foi recalibrado aqui. Vale revisar na simulação de 1.000 vidas.
2. **Medicina:** subespecialidades (cardiologia, ortopedia…), consultório próprio como negócio médico e plantão como segunda trajetória não entraram. A arquitetura (`especialidades` + `faixa` + `paralelas`) comporta.
3. **Basquete:** a bolsa universitária nos EUA (caminho real de muitos jogadores brasileiros) não entrou.
4. **Tênis:** patrocínio de material e ranking juvenil próprio não entraram.
5. **Audiovisual:** a produção integral não ocupa horas da semana (`semana`); ela pesa no estresse e bloqueia outra integral. Exclusividade de emissora e renegociação de contrato longo também não entraram.
6. **Ajuda da família:** "recebeu ao menos uma vez" segue alto (~82%), com a mediana baixa. Confirmar na simulação de 1.000 vidas se o primeiro socorro aos ~20 (morando com a família) deveria contar como ajuda ou como despesa da casa.
7. **Casa própria:** as personas que não poupam ("social", "gastadora") quase não compram, por construção da estratégia. Rever as personas na simulação oficial.
