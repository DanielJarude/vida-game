# REWORK 10.6 — UMA VIDA AO SEU ALCANCE

**Branch:** `claude/fix-pos-rework3-playtest` (sem merge na `main`, sem force push, sem deploy manual, APK **não** regenerado)
**Base:** REWORK 10.5 (`cbb4373`)
**Save:** v20, só com campos opcionais novos
**Versão das notas de atualização:** `10.6`

---

## 1. Branch e commits

| commit | conteúdo |
|---|---|
| `e9d9681` | Fases A–I: estabilização, navegação de Caminhos, oportunidades acionáveis, pedidos da criança, agenda íntegra, eventos e treinos coerentes, notas de atualização, chunk `motor-oficio` |
| (seguinte) | Fase F completa (sem "curso integral + emprego integral", reconciliação na hora em que algo entra), simulação de coerência, auditoria visual, montagens e este relatório |

## 2. Linha de base (`cbb4373`, medida nesta sessão)

- `tsc` limpo. Suíte: **1679/1680**. A única falha foi `motor.test › regra de agência`, que estourou o timeout fixo de 60 s com a máquina carregada (problema conhecido de carga, não de lógica).
- Bundles: `motor` **794,22 kB** (5,8 kB de folga), `motor-textos` 738,4, `Jogo` 584,3, `motor-dados` 503,0, `motor-carreira` 341,3, `motor-vida` 215,2.
- Simulação de coerência (`scripts/sim/coerencia106.ts`, 8 perfis × 6 vidas até 80 anos, ≈3,1 mil anos), na base:
  - 8 anos com trabalho em cima da escola ou do curso;
  - 8 atletas profissionais ou pessoas empregadas recebendo o "E agora?" genérico;
  - 24,7 ms por ano.
- Nenhuma correção local pendente das sessões anteriores estava no repositório: o P1 e o P2 do 10.5 foram refeitos aqui.

## 3. Auditoria inicial

Três investigações só de leitura (carreira/esporte; agenda/infância/oportunidades; relações/saúde/NPCs) localizaram cada problema no código, com arquivo e linha. Antes de corrigir, cada um foi conferido no código. Os que dependem de estado também foram reproduzidos num teste que falhava na base ou na simulação.

## 4–5. Problemas reproduzidos e causas reais

| ID | Problema | Causa real (arquivo) |
|---|---|---|
| UX-23 | "Francisco chamou para um projeto" não levava ao convite | Em `telas/Jogo.tsx › Agora`, o toque chamava `irPara('oportunidades')` sem divisão. Isso caía em Trabalho, que filtra só as portas de trabalho, e o convite de estudo (`formacao.conviteDoProfessor`) nunca aparecia lá |
| AGE-01 | Escola 7h–12h e trabalho 8h–12h ao mesmo tempo | Quatro portas abertas: (1) `agenda.conflitoDeHorario` sempre oferecia "tentar dar conta dos dois", até ao aprendiz; (2) o turno do trabalho guardado ficava velho quando a escola mudava de turno (o médio é de manhã por padrão); (3) contratações diretas não passavam pela agenda; (4) o REWORK 4 deixava "curso integral + emprego" (8h–17h os dois). A agenda só registrava a falta |
| CAR-15 | "Ator" principal + "Ator conhecido" paralelo, duas rendas | Eram dois `Emprego` da mesma trilha (`cena`). `paralelas.podeConciliar` só barrava o mesmo id; o convite da arte (`arte.ts › jaVive`) e "mostrar o trabalho" (`perseguir.podeMostrar`) olhavam só o principal; e `dinheiro.entradasProprias` creditava as duas fichas. Mesmo buraco em música, imagem e ilustração |
| FUT-05 | Goleiro com "Treino extra: finalização" | `noOficio.verbosDoOficio` não olhava a posição. O treino mexia só na técnica geral, e o treino físico gravava um fato que ninguém lia (o "risco de lesão" prometido não existia). `situacoes.posDe` usava 'meia' como padrão e a temporada usava outro |
| EVT-09 | Atleta profissional recebe "vai procurar emprego?" ao concluir o médio | `sistemicos › esc_fim_do_medio` só checava `concluiu_medio`. Outros eventos presumiam fim de semana livre (o bico para quem treina na base) ou "dias de folga" (o atleta em temporada) |
| INF-01 | Criança de 10 anos pagando 240 pelos ingressos do estádio | `juntos.ts`: estádio e cinema cobravam os dois ingressos de quem convidava, sem distinguir idade nem pagador |
| INF-02 | Chuteira de 920 com 193 no cofrinho: botão apagado | `coisas.disponibilidadeComprarCoisa` dava "requisito". O pedido de dinheiro morava em Vida · Dinheiro, genérico e sem o produto |
| P1 (10.5) | "Confiança: abalada" para quem se acabou de conhecer | `Pessoas.tsx › lacoEmPalavras` usava só o número. Um conhecido novo nasce com confiança de uns 25–30 (`pessoas.vincular`) |
| P4 (10.5) | Abandono de tratamento sem consequência própria | Não havia ação de parar. Os tratamentos que deixavam de acontecer ficavam com `tratando` verdadeiro para sempre |
| P8 (10.5) | NPCs sem relação nunca morrem; valores em reais crus | `familia.processarMortes` percorre só os vínculos e `indiretos` só quem está ligado a eles. 32 valores de `situacoes.ts` entravam sem o custo de vida local (`v.financas.conta += ef.dinheiro`), assim como a herança por classe e o pecúlio |
| (achado) | A formação dos pais de partida gravada como id (`eng_civil`) | `criacao.ts` gravava `c.id`, e o tipo e todas as leituras usam o nome. Apareceu porque uma vida sorteada por semente mudou de caminho (`caminhos.test` nº 29) |
| P2 (10.5) | Scripts de captura | A aba "Saúde 1" não era achada pelo nome exato; o save "formado" nunca entrava na faculdade |

## 6. Alterações de navegação (Fases B, C, J)

- **As seis áreas ficaram.** O que mudou foi a organização dentro delas.
- **Caminhos → Estudos.** A primeira visualização (a parte agora chamada **"Minha formação"**) mostra:
  - a ficha: escolaridade, onde estuda, etapa ou curso, desempenho e próximo marco;
  - as **ações principais**: *Entrar na faculdade* (ou *Minha faculdade*, para quem já cursa), *Fazer cursos*, *Bolsas e auxílios* e *Histórico acadêmico*. Cada uma diz o que falta quando ainda não dá (B5).
  - As partes passaram a se chamar *Minha formação · Boletim · Cursos e faculdade · Histórico*.
- **Caminhos → Trabalho.** As partes agora são *Meu trabalho · Desempenho · Procurar trabalho · Minha carreira*.
  - No alto de Meu trabalho ficam as ações principais: procurar (ou **mudar de**) trabalho, candidaturas e entrevistas, minha carreira e outras possibilidades.
  - Quem nunca trabalhou lê "Procurar o primeiro trabalho"; quem tem carreira não lê.
  - Minha carreira ganhou "A experiência" (anos por área). Na divisão, passou a mostrar também o currículo artístico e a carreira de técnico, que antes ficavam de fora.
- **Outros caminhos.** A carreira já começada aparece em **"Em andamento"**, no alto: o painel do atleta, ou a carreira artística com o atalho para Meu trabalho.
- **Vida pública.** Com desgaste, aparece **"O desgaste: de onde vem e o que fazer"**, com as causas (`desgastePolitico.causasDoDesgaste`) e um atalho para as respostas.
- **Busca "Onde fica cada coisa".**
  - Intenções novas: *Entrar na faculdade*, *Fazer um curso técnico ou pós*, *Bolsa, crédito ou auxílio*, *Responder a um convite*, *Pedir aos responsáveis para comprar*, *Ver as minhas conquistas*.
  - *Procurar emprego* e *Acompanhar um tratamento* ganharam palavras-chave.
  - Destinos novos: `faculdade`, `bolsas`, `historico_academico`, `minha_carreira`, `conquistas`.
- **Painel "Agora".**
  - O convite abre o próprio convite.
  - A vaga aprovada aparece em "Portas abertas".
  - Um conflito de horário entre obrigações aparece como "A semana · Conflito de horário", levando à agenda.

## 7. Fluxos implementados

1. **Entrar na faculdade (C2):** *Caminhos → Estudos → Entrar na faculdade*.
   - O fluxo abre com os quatro passos, o requisito (o médio, com a etapa atual), a nota (com cota) e a lista inteira de graduações. As que ainda não estão ao alcance aparecem com o porquê.
   - Em cada via: a cidade, a mensalidade ou "paga depois", e o que muda na semana.
   - "Candidatar-se" só concorre (`{tipo:'matricular', etapa:'candidatar'}`). Aprovada, a **vaga fica reservada** por um ano (`Educacao.aprovacao`).
   - "Confirmar a matrícula" (`confirmar_matricula`) é um passo próprio: mostra duração, turno, custo e conflitos e passa pelo `propor` de sempre. "Abrir mão da vaga" também existe.
   - A vaga não confirmada passa e fica dito. A ação antiga sem `etapa` continua valendo, para saves, simulações e testes.
2. **Convite (D):** o toque abre `DetalheDaOportunidade`, uma folha por cima da página.
   - Mostra quem chamou (com o rosto e o atalho para a ficha), o texto, o prazo (mês e ano, quanto falta), o que pede (o veredito do motor) e o que muda (o trabalho e o salário, a entrevista, a atividade na agenda, os conflitos).
   - Respostas: *Aceitar*, *Deixar passar*, *Decidir depois*. Fechar devolve o jogador exatamente onde estava.
   - Convite vencido não se aceita, e a folha diz que fechou. Ao vencer, sai das portas abertas e o motor registra "O convite de X passou sem resposta"; recusar também fica registrado.
3. **Pedido da criança (E):** na loja, quem depende dos adultos e não alcança o preço vê preço, cofrinho e quanto falta.
   - Opções: *Pedir a {nome} para comprar*, *Pedir ajuda para completar* (quando há algo guardado) e o seletor de responsável (quando há mais de um). Guardar e voltar depois também é dito.
   - O pedido leva o produto. A resposta (`pedidosDaCrianca.respostaDoResponsavel`) depende da folga da casa, do tempo de quem trabalha (nos programas), da relação e do jeito da pessoa.
   - Recusar por dinheiro não mexe na relação. O dinheiro sai do guardado do adulto quando há um, e senão do orçamento da casa.
   - Abaixo de 10 anos, as compras da criança ganharam "Pedir aos adultos".
4. **Programas da criança (INF-01):** com um responsável, cinema e estádio viram "Pedir a {nome} para levar você…", e a criança não paga.
   - Sem adulto, o estádio só aparece a partir dos 14 anos e o cinema a partir dos 12.
5. **Origem do dinheiro (INF-03):** em Vida · Dinheiro, a criança vê de onde vem cada recurso e com que frequência:
   - a mesada, de quanto e todo mês;
   - o pedido, uma vez por ano;
   - as tarefas e os brigadeiros, uma vez por ano cada;
   - os presentes, no aniversário;
   - o dinheiro da casa, que é dos adultos.
6. **Tratamento (P4):** no prontuário, "Parar o tratamento…" abre o risco da condição antes, e é preciso confirmar.
   - Parado, aparece "Retomar o tratamento (procurar atendimento)".
   - A criança não decide: o tratamento dela é decisão dos responsáveis.
7. **Notas de atualização (I):**
   - Abrem uma vez por versão para quem já jogava, nunca por cima de uma decisão, de um resultado ou da criação.
   - O Menu tem "Novidades da atualização" com o histórico.
   - O processo de cadastro está em `docs/notas/NOVIDADES.md`.

## 8. Correções de lógica

- **AGE-01** (`agenda.ts`, `compromissos.ts`, `acoes.ts`):
  - "Tentar dar conta dos dois" contra a escola deixou de existir, e "largar a escola" não é saída para aprendiz ou estagiário.
  - Sem turno que resolva, o conflito **impede**, e a candidatura é bloqueada antes, com o porquê (`horarioQueImpede`).
  - O REWORK 4 permitia "curso integral + emprego integral" e "meio período + curso integral". Isso foi **removido**, porque a regra F1 o proíbe explicitamente.
  - `reconciliarObrigacoes` roda no ano (`processarAgenda`) **e logo depois de qualquer entrada** (`propor`, `resolverPendente`; o quartel aos 18 com o médio de manhã, por exemplo). Ela muda o turno do trabalho ou da escola/curso quando isso resolve e escreve na Linha da Vida; nenhum contrato se perde.
  - Sem saída automática, o conflito continua na agenda com as saídas, e a aula atravessada vira falta: não se ganha pelas duas coisas.
- **CAR-15** (`trabalho.unificarCarreiraArtistica`):
  - As duas fichas viram uma: fica o degrau mais alto, contando do início mais antigo, e a outra vai para o histórico ("a mesma carreira, unificada").
  - A unificação roda ao contratar, a cada ano (`processarParalelas`) e ao abrir o save (`normalizarRework106`).
  - `podeConciliar` barra a mesma trilha artística; o convite da arte e "mostrar o trabalho" passam a olhar também a paralela.
- **FUT-05** (`noOficio.treinoTecnico`):
  - O treino técnico extra segue a função: goleiro (reflexos, saídas, um contra um), defesa (marcação, jogo aéreo), meio (passe e visão de jogo), ataque (finalização).
  - O treino do ano aparece na temporada (`esporte.fecharTemporada`): +0,25 na nota (o tático, +0,15) e +10% no número da função (defesas, assistências ou gols).
  - O treino físico agora sobe de fato o risco de lesão do ano (×1,15).
  - As duas posições padrão foram alinhadas.
- **EVT-09**:
  - O evento novo `esc_fim_do_medio_carreira` (`carreiraNoFimDoMedio`) vale para atleta profissional, base ou emprego de verdade. Opções: priorizar a carreira; faculdade à noite ou a distância; formação da área; planejar o dinheiro; outro trabalho (a liberdade fica); decidir depois.
  - O evento genérico só vale para quem não tem carreira.
  - G3, eventos corrigidos:
    - `fil10_volta` deixou de dizer "perdeu o emprego" para quem nunca teve renda;
    - `ado10_bico`, `ado_primeiro_trabalho` e `adol_ajudar_contas` não vão mais para quem treina na base;
    - `adu_ferias` não vai mais para atleta em temporada nem para quem está num mandato;
    - `adu_negocio_proprio` não vai mais para atleta, mandato ou farda.
- **P4** (`saude.ts`):
  - O risco por condição é dito antes de parar.
  - A cobrança depende da condição, da gravidade, do tempo parado, da adesão anterior (anos tratando seguram um pouco) e da reincidência. Há no máximo uma cobrança a cada dois anos.
  - O câncer pode avançar de gravidade.
  - Retomar encerra a cobrança.
- **P8**:
  - `indiretos.processarDistantes`: quem não tem vínculo nem ligação com alguém da vida envelhece e morre por uma curva de idade, sem notícia e com sorteio derivado (o gerador da vida não muda).
  - Valores das situações, herança por classe e pecúlio passam a usar o custo de vida local.
- **A1** (`Pessoas.confiancaEmPalavras`), as palavras da confiança:
  - *ainda se formando*: laço novo;
  - *pouca*: laço antigo e raso;
  - *abalada*: briga, mágoa ou traição causadas por você;
  - *com motivo para desconfiar*: foi a pessoa quem quebrou;
  - *ressentida*;
  - *rompida*;
  - *esfriada pela distância*.
- **Formação dos pais de partida:** passa a ser gravada pelo nome do curso, e os saves são normalizados.

## 9. Testes adicionados e alterados

- **Novos:** `src/motor/__tests__/rework106.test.ts` (16) e `src/ui/__tests__/rework106.test.tsx` (11 jornadas). Total: **1680 → 1707**.
- **Alterados por mudança de regra pedida neste pacote** (nenhuma asserção enfraquecida sem motivo; cada uma diz a regra nova):
  - `rework9.test.ts`, `fix4.test.ts` (2) e `rework4.test.ts`: o plano "tentar dar conta dos dois" com escola ou curso integral deixou de existir (AGE-01 · F1). Agora se afirma que **não** existe.
  - `interface.test.tsx` (2): a aba "Vagas" passou a se chamar "Procurar trabalho" (C3).
  - `fixPosRework4.test.ts`: a pré-condição "primeiro ano no limite" passou a ser dita (a vida sorteada mudou de caminho).

## 10. Jornadas validadas (testes de interface, cliques de verdade)

| Jornada | O que o teste faz | Resultado |
|---|---|---|
| K1 faculdade | Caminhos → Estudos → *Entrar na faculdade* → passos → graduações → abrir uma → *Candidatar-se* → bolsas; e a vaga aprovada → *Confirmar a matrícula* | ✅ |
| K2 criança | A loja com a chuteira mais cara que o cofrinho: preço, cofrinho, falta → *Pedir a … para comprar* (o pedido fica registrado com o produto) | ✅ (motor: comprada pelo adulto, cofrinho intacto) |
| K3 convite | Toque no painel → folha com quem chamou, prazo, o que pede → *Deixar passar* → o painel não anuncia mais | ✅ |
| K4 saúde | Você → Saúde → *Parar o tratamento…* → o risco → *Parar mesmo assim* → "tratamento parado" e *Retomar* | ✅ |
| K5 emprego | "Procurar o primeiro trabalho" para quem nunca trabalhou; "Mudar de trabalho" para quem trabalha; *Minha carreira*. O conflito com a escola é impedido antes da confirmação (motor) | ✅ |
| K6 goleiro | Outros caminhos → "Em andamento"; Trabalho → "Treino extra de goleiro", sem "finalização" (e a temporada sente, no motor) | ✅ |
| K7 carreira | O atleta que conclui o médio recebe o evento de quem tem carreira, sem "Arrumar um emprego" (motor) | ✅ |
| K8 atualização | Notas uma vez → fechar → jogar → Menu → histórico | ✅ |
| K9 relação | Recém-conhecida: "ainda se formando"; briga, mágoa, ruptura: as palavras próprias. Os estados de mágoa do 10.5 continuam cobertos por `rework105` | ✅ |

## 11. Capturas e montagens

`scripts/playtest/rework106.mjs` (18 cenas × 4 paletas × 1440/820/390/360 + 390×560) e `gerarRework106.ts`. O "antes" foi capturado do build da base (`cbb4373`) com os mesmos saves. As montagens estão em `docs/rework106/` (`montagem106.mjs`): 01 Estudos antes × depois, 02 Entrar na faculdade e bolsas, 03 a vaga aprovada, 04 o convite antes × depois, 05 a criança na loja antes × depois e a origem do dinheiro, 06 Trabalho, 07 o goleiro, 08 a agenda em conflito, 09 o tratamento e o desgaste, 10 as novidades, 11 as quatro paletas, 12 os tamanhos.

### 11.1 Resultado da medição automática

- **360 capturas** (18 cenas × 4 paletas × 1440/820/390/360 + 390×560): **0 problemas** de texto sobre texto, corte na borda, rolagem horizontal, contraste < 3:1 (medido em 1440 e 390) ou botão "Viver mais um ano" coberto.
- Alvos < 32 px: só o bloco de trajeto da agenda (pendência herdada).
- Base (`cbb4373`, mesmos saves): 24 capturas para o "antes".
- Inspeção manual das capturas representativas encontrou dois problemas, ambos corrigidos antes da rodada final:
  - os quatro passos da faculdade ocupavam muito espaço vertical; viraram uma faixa numerada;
  - o bloco "Parar o tratamento" ficava espremido na terceira coluna do prontuário; passou para uma linha própria, com o nome da condição.
- Testado em navegador: Chromium (Playwright) com o build de produção, nas quatro paletas e cinco tamanhos. **Não** houve teste em dispositivo físico (§16.1).

## 12. Compatibilidade de saves

O save continua **v20**. Campos novos, todos opcionais:
- `Educacao.aprovacao`;
- `Condicao.abandono` e `Condicao.tTratamento`;
- fatos `oficio:tecnico` e `oficio:tatico`.

`normalizarRework106` cobre:
- a carreira artística duplicada (vira uma, e o currículo fica);
- a formação por id (vira nome).

A agenda conflitante de saves antigos se reconcilia no ano seguinte, ou na primeira entrada nova, sempre dita; até lá, a agenda e o painel mostram o conflito com as saídas. Testes de save: carreira duplicada, vaga aprovada (ida e volta), agenda conflitante, convite vencido, confiança inicial, tratamento parado e carreira esportiva.

## 13. Performance

| | base `cbb4373` | 10.6 |
|---|---|---|
| ms por ano (`coerencia106`, mesmas 48 vidas) | 24,7 | 21,6 |
| anos com trabalho sobre escola ou curso | 8 | **0** |
| carreira artística duplicada | 0 nesta amostra (o caso existe; reproduzido em teste) | 0 |
| goleiro com "finalização" | 0 nesta amostra (reproduzido em teste) | 0 |
| "E agora?" genérico para quem tem carreira | 8 | **0** (10 receberam o evento de carreira) |
| travamentos | 0 | 0 |

A suíte completa roda em cerca de 6,5 min nesta máquina (cópia em disco Linux, 3 workers).

## 14. Bundles (limite 800 kB, não alterado)

| pacote | base | 10.6 |
|---|---|---|
| `motor` | 794,2 | **691,1** |
| `motor-textos` | 738,4 | 763,7 |
| `Jogo` | 584,3 | 611,6 |
| `motor-dados` | 503,0 | 506,3 |
| `motor-carreira` | 341,3 | 341,5 |
| `motor-vida` | 215,2 | 222,5 |
| `motor-conteudo` | 138,3 | 140,7 |
| `motor-oficio` (novo) | — | 84,4 |

**M1 (modularização):**
- `profissao`, `caminhosDeVida`, `migracao`, `fechamento` e `habilitacoes` importam só os sistemas e a base, e nenhum módulo do `motor` os importa. Foram para `motor-oficio`, entre os sistemas e quem os chama.
- `conversas` e `conflitos`, que só os textos usam, foram para `motor-textos`.
- O grafo de importação entre os pacotes do build continua acíclico; foi conferido nos imports gerados.

## 15. Testes offline e itch.io

- `build:itch` OK; `smoke:itch` **21/21**.
- PWA offline (`scripts/pwa/offline.mjs`) **36/36**: precache completo, vida offline, mundo e redes sem rede, tema, versão nova sem recarregar sozinha, save idêntico depois da troca de service worker.
- As notas estão no pacote, então funcionam offline.

## 16. Pendências

| # | Pendência |
|---|---|
| 1 | **Nada foi testado em dispositivo físico.** O APK não foi regenerado, por regra do pacote. Checklist para o celular real no §16.1 |
| 2 | Contratações que não passam por `propor` (a efetivação do aprendiz aos 18, algumas situações de carreira) só são reconciliadas pela reconciliação, no mesmo ano ou no seguinte, sem pergunta prévia |
| 3 | O cachê das produções audiovisuais e o salário médio do ator continuam somando: o salário é o trabalho miúdo e o cachê, a produção. Não é a duplicação do CAR-15 (que era uma segunda ficha), mas merece revisão quando as carreiras forem aprofundadas (REWORK 11) |
| 4 | Os NPCs distantes morrem sem notícia, por desenho. Se um deles for referenciado por um sistema que não seja vínculo ou convite (um colega de produção antigo, por exemplo), o texto pode citá-lo depois de morto |
| 5 | A3 parcial: cancelar o plano de saúde ou largar a terapia ainda não marca o tratamento como parado. Só a ação nova "Parar o tratamento" marca |
| 6 | P3 do 10.5 (repetição de cenas entre vidas) não foi tratado aqui; está reservado à expansão de eventos do REWORK 11 |
| 7 | Bloco de trajeto < 32 px na agenda (herdado) |
| 8 | INF-04 parcial: a criança ainda não pede bicicleta pela loja de veículos (o pedido cobre as lojas de coisas e os programas). Transporte infantil fica para a próxima passada |
| 9 | O fim do médio de quem tem carreira oferece "formação da área" como intenção registrada (fato); a formação em si continua em Caminhos · Estudos |

### 16.1 Checklist para o teste em celular real

1. Abrir vida-game.pages.dev com uma vida já salva: as notas aparecem **uma vez**; fechar; recarregar e confirmar que não voltam; Menu → "Novidades da atualização".
2. Caminhos → Estudos: as quatro ações principais cabem na tela sem rolar de lado (360 px), e o toque abre a faculdade.
3. Abrir um curso, candidatar-se e confirmar a matrícula: a folha de resultado fecha e a vaga some.
4. No celular, o painel "Agora" fica no alto da História: tocar no convite abre a folha; *Decidir depois* volta para onde estava.
5. Criança na loja de esportes: o seletor de responsável é tocável (≥ 44 px) e o pedido mostra a resposta.
6. Você → Saúde → *Parar o tratamento…*: a confirmação não fica escondida pelo botão "Viver mais um ano".
7. Minha Semana com um conflito de save antigo: as saídas são tocáveis.
8. Modo avião depois de uma visita: as notas abrem e o jogo segue.
9. Paletas escuras: o contraste dos botões de ação principal.

## 17. Reservado ao REWORK 11

- **CAR-16 — atributos específicos das carreiras:** habilidades por carreira especial que evoluem e mudam resultados concretos. No futebol, os atributos por posição: reflexo, posicionamento, finalização, passe. Hoje existe uma técnica só por modalidade, mais o bônus do treino do ano na temporada.
- Expansão profunda das carreiras especiais, talentos e predisposições, futebol com progressão técnica por posição.
- Auditoria de promoção e dispensa na base (as dispensas aos 21).
- Eventos profissionais a cada 1–2 anos e mais variedade de acontecimentos entre vidas.
- Atuação, música e política profundas.
- Submundo com carreiras criminosas especializadas, mercado clandestino, inventário ilícito e progressão por contatos.

## 18. Rastreabilidade: ID → problema → causa → solução → teste → resultado

| ID | Problema | Causa | Solução | Teste | Resultado |
|---|---|---|---|---|---|
| A1/P1 | "Abalada" para conhecido novo | Rótulo só pelo número | `confiancaEmPalavras` com a história | UI K9 | ✅ |
| A2/P2 | Scripts de captura | Nome de aba exato; formado passivo | Regex com contador; formado matriculado, que falha se não concluir | Saves gerados (formado concluído) | ✅ |
| A3/P4 | Abandono sem consequência | Sem ação; `tratando` eterno | `parar_tratamento`, risco antes, cobrança contextual, retomar | motor P4 (2), UI K4 | ✅ (cancelar o plano ainda não marca: pendência 5) |
| A4/P8 | NPC distante imortal; reais crus | Mortalidade só de vínculos; `ef.dinheiro` cru | `processarDistantes`; custo local nas situações, herança e pecúlio | motor P8 | ✅ |
| A5/CAR-15 | Ator duplicado | Guardas só no principal; renda das duas fichas | Unificação (contratar, ano, save); guardas na paralela | motor CAR-15 (2) | ✅ |
| B/C | Ações difíceis de achar | Faculdade dentro de um catálogo na 3ª aba; "Vagas" sem verbo | Minha formação + ações principais; partes renomeadas; Em andamento; desgaste | UI K1, K5, K6 | ✅ |
| C2 | Inscrição = matrícula | Ação única | Candidatura → vaga reservada → confirmar | motor C2, UI K1 | ✅ |
| D/UX-23 | Convite sem destino | `irPara('oportunidades')` genérico | `DetalheDaOportunidade`; vencido some e fica registrado | UI K3, motor D3 | ✅ |
| E/INF-01 | Criança paga o estádio | Programa cobrado de quem convida | Pedido ao adulto, que paga se topar | motor INF-01 | ✅ |
| E/INF-02 | Loja sem caminho | Botão apagado, pedido genérico longe | `PedidoDeCompra` com o produto | motor INF-02, UI K2 | ✅ |
| E/INF-03 | Origem do dinheiro | — | "De onde vem o seu dinheiro" | (visual) | ✅ |
| F/AGE-01 | Escola e trabalho ao mesmo tempo | Conciliar, turno velho, contratações diretas, REWORK 4 | Impedir antes; sem conciliar; reconciliação no ano e na entrada | motor AGE-01 (3), sim (8 → 0) | ✅ (pendência 2) |
| G/EVT-09 | Evento genérico para atleta | `quando` sem carreira | Evento de carreira; G3 corrigidos | motor EVT-09 (2), sim (8 → 0) | ✅ |
| H/FUT-05 | Goleiro com finalização | Sem posição; efeito genérico | Treino por posição; efeito na temporada; risco do físico | motor FUT-05 (2), UI K6 | ✅ (CAR-16 → REWORK 11) |
| I/UX-24 | Sem notas de versão | — | Janela por versão, Menu, processo documentado | UI K8 (2), PWA 36/36 | ✅ |
| M1 | `motor` a 5,8 kB do limite | — | Chunk `motor-oficio` | build (691 kB) | ✅ |
| (achado) | Formação dos pais por id | `criacao` gravava `c.id` | Nome; normalização do save | `caminhos.test` nº 29 | ✅ |
