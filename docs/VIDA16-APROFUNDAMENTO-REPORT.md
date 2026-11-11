# VIDA 16 — Aprofundamento, imersão e interfaces (relatório)

Branch `claude/vida16-aprofundamento` (base: VIDA 15 publicada, `4c32f20`). Um agente só, sem subagentes. Notas de versão: `'16'`.

## Auditoria inicial (classificação)
| Frente | Antes | Agora |
|---|---|---|
| Namoro comprometido | **Com defeito**: conversar e marcar encontro exigiam estar solteiro; "saindo com alguém" bloqueava o app; a descoberta era um sorteio fixo de 22% | Implementado |
| Mensagens (celular) | **Parcial**: só as mensagens do ano; sem histórico, sem hora, sem escrever | Implementado |
| Pede atenção (Pessoas) | **Com defeito**: copiava o texto do chamado, que também estava em Mensagens | Implementado |
| Profissões | Profundas: esporte, política, empresas, medicina, arte (palco, música, audiovisual), militar, segurança, academia. **Superficiais**: direito, docência e tecnologia (o "desafio" genérico de `conteudo/oficios`, com as palavras trocadas) | Direito, docência e tecnologia aprofundadas |
| Carreiras religiosas | **Ausente** (a crença existia: `v14/crencas`) | Implementado |
| Fachadas | **Com defeito** no kit compartilhado (`ui/v14/fachadas`): palmeira em x fixo e luz externa como polígono chapado | Corrigido na origem |
| Móveis | **Parcial**: 71 de 106 móveis de chão sem volume | 22 dos mais visíveis tratados |
| Veículos | Rodas e faróis feitos na VIDA 15; carroceria paramétrica real desde a VIDA 13 | Detalhes da carroceria |
| Economia | **Implementada**: patrimônio, liquidez, renda, dívida, nome sujo, insolvência e riscos de empresas (`dinheiro.balanco`, `condicaoEconomica`, `fortuna129`, `empresas129`) | Sem lacuna real; nada mudado |
| Eventos e narrativa | Implementados na VIDA 15 (fases e história) | Acrescentados personagens que voltam (o ex-aluno) e os casos que viram trajetória |
| Interfaces (§7) | Avaliadas na VIDA 15 | Parcial (ver "Pendências") |


## Implementado
1. **Namoro com alguém em casa** (`motor/v16/romance/namoro16.ts`).
   - Ver perfis, curtir, dar match, conversar e marcar encontro funcionam em qualquer estado civil. Com parceria exclusiva, aparece um aviso, mas nada é bloqueado.
   - Cada coisa feita deixa um **rastro** (o app instalado, o match, as mensagens, o encontro). A chance de a parceria achar depende do que foi feito, do jeito dela (ciúme), da confiança, de morarem juntos, de descuido, de descobertas anteriores e da fama.
   - A reação é **graduada** pela gravidade do que foi achado e pela força da relação: ciúme, discussão (com o pedido "precisamos conversar"), crise, afastamento ou término. Um app instalado, sozinho e pela primeira vez, não termina uma relação. Com fama, pode virar nota na imprensa.
   - O encontro que dá certo vira **caso escondido** (o sistema de casos que já existia). Num acordo aberto, não fica rastro.
2. **Mensagens** (`motor/v16/celular/mensagens16.ts`).
   - Histórico completo: o que sai do ano vai para o arquivo (até 400 mensagens); chamados respondidos ou esquecidos ficam guardados com o desfecho.
   - Cada mensagem tem dia e hora; a tela tem filtros "Não lidas" e "Esperando você".
   - **Escrever** para qualquer contato: perguntar como está, dizer que sente falta, chamar para um café, pedir desculpas, oferecer apoio, contar uma novidade. Vale uma vez por pessoa por ano, e a resposta depende da relação. O "bora!" do café vira um convite com dia, que você confirma.
3. **Pede atenção** (`ui/leitura.sinaisSociais`, Pessoas).
   - Mostra a **situação** da relação e o porquê: a amizade esfriando, a confiança abalada, alguém que sente falta, o convite sem resposta, a reaproximação possível.
   - Indica "há uma mensagem no celular" sem repetir o texto. Em Pessoas cabem até 6 sinais.
4. **Ofícios por dentro** (`motor/v16/oficios`, painel em Caminhos · Trabalho · Agora). Cada ofício tem uma pasta do ano, gerada com sorteio derivado; quem não abre a pasta não tem a vida mexida.
   - **Direito**: três processos por ano, com área, força das provas, valor e adversário. Você pega até dois, escolhe entre acordo imediato e julgamento (que se decide na virada do ano), prepara a fundo e recorre da derrota. Quem advoga por conta recebe honorários. Há dilemas éticos (a testemunha ensaiada, o documento que "some", o conflito de interesses, o atendimento pro bono), e a OAB pode abrir processo disciplinar.
   - **Docência**: duas ou três turmas com perfil (interessada, agitada, com defasagem, heterogênea, desanimada). A abordagem do ano rende mais ou menos conforme a turma. Há o aluno em dificuldade, que pode **reaparecer anos depois** agradecendo, o projeto da escola (feira, olimpíada, peça, jornal, horta) e a pressão para mudar uma nota.
   - **Tecnologia**: o projeto do ano, com complexidade, e o ritmo escolhido (prazo, equilíbrio ou qualidade). A **dívida técnica** atravessa os anos e torna os incidentes em produção mais prováveis. Há também a falha de segurança antes do lançamento e a liderança técnica.
   - O que fica: reputação, placar (causas, turmas, entregas) e feitos na trajetória.
5. **Carreiras religiosas** (`dados16/religiao/tradicoes16.ts`, `motor/v16/religiao`, em Caminhos · Outros). São 13 caminhos, cada um com etapas, elegibilidade e forma de chegar próprias:
   - Católica: sacerdócio (seminário → diácono → padre → bispo, arcebispo e cardeal por nomeação → papa por conclave, só aqui), diaconato permanente para homens casados e vida consagrada feminina.
   - Cristãs: ministério evangélico e ministério protestante histórico.
   - Matriz africana: candomblé (obrigações com custo e tempo; liderança abrindo a casa ou na sucessão), ogã e equede, e umbanda.
   - Outras: trabalho espírita (voluntário, sem pagamento), rabinato, imã, ensino islâmico (aberto a mulheres) e vida monástica budista.
   - Mecânicas: formação, reconhecimento, comunidade, união, influência e caixa da comunidade; três gestos por ano nas palavras de cada tradição; projetos comunitários.
   - Questões do ano: pedido político, doação suspeita, disputa de liderança, denúncia (levar às autoridades ou abafar), intolerância contra o terreiro, dúvida de vocação, celibato posto à prova, sucessão da casa.
   - Sustento só onde a tradição paga. O topo de cada caminho é raro.
6. **Fachadas**: a causa estava no kit compartilhado (`ui/v14/fachadas/kit.ts` e `casas14.ts`).
   - A palmeira foi redesenhada (estipe curvo com anéis, copa proporcional à altura, folhas com folíolos, cocos) e agora fica nas **faixas livres do lote** (`palmeiraNoLote`); sem espaço, vai para o fundo ou não aparece. Antes, com x fixo, atravessava telhado e parede.
   - A luz externa virou **halo** (peça nova `halo` no núcleo das ilustrações, com degradê radial), no lugar dos trapézios chapados. As arandelas ficam simétricas pela largura real da porta (na mansão, a porta dupla deixava uma delas no meio da porta); balizadores e espetos acendem no chão e no jardim, não na parede.
7. **Móveis**: 22 dos 71 móveis de chão sem volume ganharam blocos, com tampo à vista, encosto recuado no plano certo e postes. São eles: camas (box, king, solteiro, beliche, colchão, sofá-cama), sofás (comum, retrátil, couro, designer, externo), poltrona, poltronas de cinema, criado-mudo, bilhar, cadeira ergonômica, churrasqueira, espaço gourmet e forno de pizza. Conferidos em galeria (`scripts/playtest/galeria16Moveis.tsx`).
8. **Veículos**: em todo o catálogo, soleira um tom abaixo, lábio de luz nos para-lamas, borracha da linha de cintura e tampa do combustível.
9. **Notas de versão** `'16'`.

## Preservado (sem mudança)
- Celular, fama, encontros, perfil, crachá, Submundo, aborto e eventos por fase (VIDA 15).
- Os sistemas profissionais profundos: esporte, política, empresas, medicina, arte, militar, segurança, academia.
- A economia (auditada; nenhuma lacuna real) e as tatuagens.

## Testes
- Novos: `vida16Namoro` (10), `vida16Carreiras` (8), `vida16Telas` (3, jsdom).
- **Suíte completa**: 2667 aprovados, 3 falhas, 1 pulado.
  - Preexistentes, por tempo: `fechamentoMundo` #4 e `motor.test` "regra de agência", já listadas na VIDA 15.
  - `rework2` (Pede atenção) falhou pela mudança intencional: o sinal agora diz a situação. O teste foi ajustado com o comentário "VIDA 16" e passa.
  - O `EnvironmentTeardownError` das tatuagens no jsdom é ruído preexistente e não derruba testes.
- Simulação `scripts/sim/religiao16.ts`: 36 vidas religiosas e 36 profissionais em 40 e 6 anos, com escolhas aleatórias, sem erro nem invariante violada. Ela levou a calibrar a escassez dos cargos do topo e a frequência da dúvida de vocação.
- **Build**: todos os pacotes abaixo de 800 kB; o maior é `motor-dados`, com 799,76. Pacotes novos: motor16-oficios 18,6; motor16-religiao 17,1; dados16-religiao 20,6; motor16-celular 6,3; motor16-romance 5,8. O aviso de chunk circular `motor14-conquistas ↔ motor-textos` vem da VIDA 14.
- **Smoke de produção**: 25/25.
- **Visual**:
  - Galerias de fachadas (antes e depois), de móveis e do catálogo de carros.
  - Celular "Nova mensagem" no jogo real, em claro/escuro e 1440/390 px, sem rolagem lateral, sem vazamento e sem erros de console.

## Saves
- O save continua v20, com campos opcionais: `Vida.oficio16`, `Vida.religiao16`, `Celular15.rastro16`, `Celular15.arquivo16` e `Msg15.tipo` `escrita`/`chamado`.
- A normalização é idempotente (`normalizarOficio16`, `normalizarReligiao16`), e saves antigos abrem sem migração.

## Pendências (honestas)
- **§7, rework visual completo**: navegação, Você, Fama e notícias, lojas, guarda-roupa, garagem, casa, viagens, estudos e esportes não foram refeitos. Nesta versão, só as telas novas e as tocadas (Mensagens, Pede atenção, pasta do ofício, vida religiosa) receberam trabalho de interface.
- **Móveis**: 49 objetos de chão continuam com o desenho de antes. Muitos já têm tampo em perspectiva no próprio desenho (mesas de centro e lateral, mesa externa, pingue-pongue, pebolim, banheiras); o resto são equipamentos e objetos pequenos.
- **Capturas no jogo real** da pasta do ofício e da vida religiosa: validadas em jsdom e nas galerias, sem save dedicado.
- **Aprofundar outras profissões rasas** (engenharia, enfermagem, contabilidade, jornalismo, psicologia): ficam no desafio genérico de antes.
