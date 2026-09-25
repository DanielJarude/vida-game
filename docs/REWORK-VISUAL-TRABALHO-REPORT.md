# Rework de experiência e vida profissional — relatório

Branch: `claude/rework-visual-trabalho` · base: `claude/caminhos-de-vida-expansao` @ `5148b4c` (save v11).
Não foi feito merge em `main`, não houve force push, a branch do playtest #3 não foi tocada e nada foi
publicado no Netlify. Save: **v12**, com migração explícita de v11 (e de toda a cadeia v5→v11).

---

## 1. Auditoria (fase 0) — o que havia

Medido em 5148b4c, com capturas de 14 cenários em 390/1440 px (`scratchpad/antes`, não versionado) e leitura do código.

**Visual**
- Quase monocromia: fundo marrom-escuro, texto creme, um único acento âmbar. Nada distinguia uma área da outra.
- Informação só por cor: a barra da semana usava só matiz para distinguir trabalho, estudo, casa e atividade; em
  escala de cinza viravam blocos iguais. "Livre" era um bloco escuro, quase invisível.
- Retrato: o fundo era derivado só da pele; cabelo preto sobre fundo escuro sumia na criação de personagem.
- Botões desabilitados em série no Trabalho ("Fazer horas extras — só para quem tem emprego formal", "Pedir
  aumento — não há a quem pedir", "Aposentar — é aos 62") para uma dona de lanchonete: um catálogo, não uma vida.
- Contradições de leitura: "Já tem clientela fiel." ao lado de "Lanchonete da Helena: ainda começando."
- No celular, a coluna lateral (retrato, estado, o mês) empurrava a Linha da Vida para baixo da dobra.

**Sistema**
- Emprego: um salário, um desempenho, uma chance anual de promoção e de demissão. Nenhuma noção de ritmo (o
  preço de trabalhar demais), de clima com a chefia, de estrutura ou de preço.
- Negócio: um número de clientela que virava renda. Sem caixa, sem equipe, sem porte, sem estratégia, sem
  retirada; abrir exigia só dinheiro; fechar não deixava nada. Na prática, renda passiva.
- Atleta: recebia os mesmos acontecimentos de escritório (curso da empresa, reconhecimento da chefia, "novato").
  Sem contrato, sem espaço no time, sem escolha de foco.
- Rumo: uma lista de vagas e cursos, sem relação com o que a biografia estava abrindo.
- Dinheiro: espalhado entre Casa ("O mês") e a lateral.
- Política: inexistente.

## 2. Decisões de design

1. **O Trabalho é "a minha vida profissional agora", não um catálogo.** Cada caminho tem um modo
   (`modoDoTrabalho`: emprego, servidor, militar, professor, autônomo, informal, dono, rural, artista, atleta,
   política, e os estados sem trabalho: criança, estudante, procurando, pausa, aposentado, preso). O painel,
   os dados e as ações mudam com o modo.
2. **Poucas ações, e sempre possíveis.** `acoesDoTrabalho` devolve `{agora, mais, saidas}`: 2–3 ações fortes em
   destaque (pesadas pelo contexto: contas no vermelho puxam horas extras; cabeça cheia puxa aliviar), o resto
   atrás de "Mais", e as saídas (demitir-se, fechar, renunciar) sempre separadas e nunca em destaque. Ação
   impossível não aparece; ação improvável aparece com o porquê.
3. **Processo em vez de clique.** Abrir negócio, mudar de ritmo com consequência, candidatura em quatro etapas,
   renovação de contrato, remoção de servidor, sucessão rural: decisões com pessoas e custos, não botões de efeito
   imediato.
4. **Nunca inventar agência.** Acontecimentos narram o mundo; decisões esperam o jogador. Personalidade só muda por
   escolha (`comportamento` das opções e `aplicarPersonalidade` em ações escolhidas).
5. **Nada de SaaS.** Sem gradiente decorativo, sem vidro, sem neon, sem cartão flutuante. Papel e tinta: tipografia
   serifada para a vida, sem-serifa para dados, fios em vez de caixas.

## 3. Arquitetura — antes e depois

| | antes (5148b4c) | depois |
|---|---|---|
| Navegação | 6 áreas: Linha da Vida, Você, Pessoas, Estudo e trabalho, Casa e dinheiro, Tempo livre + trilho lateral | 7 áreas: Linha da Vida, Você, Pessoas, **Trabalho** (a partir dos 14 ou com história), **Rumo**, Casa, Tempo livre; sem trilho lateral (o "Agora" vai para a coluna direita no desktop) |
| Trabalho | aba dentro de "Estudo e trabalho" | `src/ui/jogo/Trabalho.tsx`: painel por modo, ações vivas, Explorar (vagas, concursos, negócios), Devolutivas, Por onde você passou |
| Rumo | lista de vagas/cursos | `Rumo.tsx`: estudo + "O que está se abrindo" (`PortasAbertas`) + a porta da política quando a vida a abre |
| Dinheiro | "O mês" em Casa + lateral | `Dinheiro.tsx` (`ODinheiro`) dentro de Você: entra, sai, sobra, dívidas, reserva, o que é do negócio |
| Motor do trabalho | `trabalho.ts` | + `ritmo.ts` (puro), `profissao.ts` (modos, ritmo, clima, estrutura, leitura, ações), `negocio.ts` reescrito, `politica.ts` novo, conteúdo `conteudo/profissao.ts` e `conteudo/politica.ts` |
| Save | v11 | v12 (`migrarV11`) |

## 4. Sistema visual

`src/ui/tokens.css` e `src/ui/vida.css` foram reescritos.

- **Tinta e papel.** Fundo `--tinta` (marrom-carvão quente), texto creme; decisões e resultados abrem numa folha
  `--papel` clara (`Folha papel`), como uma carta na mesa: a decisão se destaca sem modal escuro sobre escuro.
- **Pigmentos por área** (`--pig-*` → `--tom-*`): Linha da Vida âmbar, Você cobre, Pessoas terracota, Trabalho
  ocre, Rumo azul-ardósia, Casa verde-oliva, Tempo lilás. Cada página ganha `--tom` e um fólio
  ("TRABALHO · o próprio negócio · desde 2062") no topo. Os tons são saturação média, misturados com `color-mix`
  em oklab — sem neon.
- **Clima.** `data-clima` no app ("dificil"/"bom") esfria ou aquece levemente o fundo quando a cabeça pesa ou
  a vida vai bem. Sutil, e nunca a única pista (o texto diz).
- **Nunca só cor.** A barra da semana tem cor **e** padrão (liso, listrado diagonal, pontilhado, listras verticais)
  **e** rótulo; "Livre" é papel claro com tracejado e o nome em itálico; o trecho que passa da semana é hachurado,
  com linha tracejada e o aviso "passa da semana" por escrito. Medidores (`Medidor`) têm segmentos e uma palavra
  ("bom", "dividido"). Seleções têm ✓, não só borda.
- **Retrato.** `fundoDoRetrato` escolhe o fundo pelo contraste com o cabelo **e** a pele; cabelo preto em pele
  escura fica legível (captura em `criacao-preto-*.png`). As amostras de pele, cabelo e olhos da criação ganharam
  rótulo visível.
- **Contraste.** `scripts/playtest/contraste.mjs` confere todos os pares de token (texto primário, secundário,
  mudo, tons por área sobre tinta, tinta sobre papel): **todos acima de 4.5:1**.
- **Daltonismo e cinza.** `scripts/playtest/rework.mjs` grava capturas com acromatopsia, deuteranopia,
  protanopia e tritanopia simuladas (CDP) para Trabalho, Você e Tempo livre; inspecionadas à mão.
- **Responsivo.** Quebras em 1180/760/380 px; barra inferior com 6 ou 7 ícones + rótulo; alvos de toque ≥ 40 px.

## 5. A aba Trabalho, por família

Cada modo tem um painel (`Trabalho.tsx`) com os dados que importam naquele caminho, em palavras (nunca "nível 3"):

| modo | o que o painel mostra | ações típicas em destaque |
|---|---|---|
| Emprego (CLT) | onde, no bolso, jornada, vínculo; escada de cargos; clima com a chefia | horas extras, pedir aumento, conversar sobre promoção, pedir jornada reduzida |
| Servidor | cargo, órgão, estabilidade, progressão por tempo | pedir remoção (processo com destino real), função, capacitação |
| Professor | escola, turmas, ritmo (mais ou menos turmas) | mudar de ritmo, especialização, concurso |
| Militar | força, posto, guarnição, tempo de serviço | pedir movimentação (com destino), curso, reserva quando cabe |
| Autônomo / informal | clientela (medidor), preço, estrutura | investir no trabalho, subir preço, MEI, puxar ou aliviar a agenda |
| Dono de negócio | movimento, último ano, caixa (do negócio, não seu), nome, tamanho, jeito de vender, equipe | ampliar, estar no balcão, mudar estratégia, contratar/demitir, sócio, vender; "Fechar" nas saídas |
| Rural | terra, safra, sucessão | investir, diversificar, conversar sobre sucessão |
| Artista | trabalho paralelo, reconhecimento | edital, estrada (turnê), gravar |
| Atleta | clube, contrato até, espaço no time, foco, lesões | treinar dobrado ou preservar o corpo, renovar, mercado; doping como decisão abstrata |
| Política | cargo, ano do mandato, aprovação, partido, base, nome, prioridade, crise | prioridade do mandato, responder à crise, conversar com a comunidade, negociar apoio; "Renunciar ou encerrar" nas saídas |
| Sem trabalho | a leitura muda: criança, estudante, procurando, pausa, aposentado, preso | procurar, estudar, voltar |

"Explorar" (vagas, concursos, o próprio negócio) fica recolhido abaixo das ações.

## 6. Mecânicas novas do trabalho

- **Ritmo** (`ritmo.ts`, `profissao.ts`): `leve` / normal / `puxado`, com rótulos por família ("mais turmas",
  "aceitar todo serviço", "estar no balcão todo dia"). Puxado: salário ×1.25 ou clientela ×1.15 na hora, a semana
  mais cheia, a cabeça sente, e `anosPuxado` acumula; anos puxados com a cabeça cheia abrem "O corpo deu sinal".
  Leve: ×0.8, mais folga.
- **Clima com a chefia**: sobe e desce com escolhas (blefe de proposta, recusa de hora extra, conflitos), pesa na
  cabeça, multiplica a chance de promoção e de corte. Só existe onde há chefia (`comChefia`).
- **Negócio como gestão** (`negocio.ts`): caixa, porte (1–3), unidades, equipe de pessoas reais (cada funcionário é
  uma `Pessoa` com vínculo de trabalho), reputação, estratégia (bairro/qualidade/preço/on-line), retirada mensal,
  conta do ano (margem − fixo − folha − retirada), crises, tombos (desvio, concorrente, roubo, obra — com texto
  próprio para loja on-line, consultoria e empreiteira), venda, fechamento que deixa aprendizado, sócio com tensão.
  Abrir: com dinheiro guardado, pequeno (em casa, sem estrada) ou com empréstimo; sem conhecer o ramo é possível,
  mas "improvável", com o motivo; registro profissional continua obrigatório. Prejuízo que o bolso não cobre mais
  fecha o negócio. Dono de negócio não vira MEI (a empresa já tem CNPJ).
- **Atleta**: contrato com data, espaço no time, foco (forçar ajuda antes dos 29, cobra depois; preservar alonga),
  suspensão, renovação como decisão, fim de carreira com porta para comissão técnica/escolinha. Fora dos
  acontecimentos de escritório.
- **Farda, serviço público, campo, arte**: pedido de movimentação que o sorteio respeita, remoção com destino real,
  sucessão rural, estrada do artista.

## 7. Vida política

Uma trajetória, não um emprego de catálogo. Tudo é fictício e neutro: partidos com nomes de árvores (Partido Ipê,
Frente Jequitibá, União Carnaúba…), nenhuma ideologia, nenhuma pessoa, campanha, slogan ou partido real.
Prioridades de mandato são temas de gestão (saúde, educação, mobilidade, emprego, segurança, ambiente, contas,
cultura), com entregas concretas ("remédio de volta na farmácia do posto").

**Portas** (`portasDaPolitica`, emergentes da biografia): comunidade (voluntariado, associação), estudante,
sindicato, causa, notoriedade, empresário, carreira pública, família/social, convite, e a decisão deliberada
("quero disputar").

**Fases** (`VidaPolitica.fase`): envolvido → filiado → candidato → eleito → mandato → entre mandatos → encerrada.
Derrota não é fim de jogo: a profissão continua, a derrota deixa nome (`reputacao`) e uma marca na Linha da Vida.

**Campanha** (`pol_eleicao`, 4 etapas): cargo → financiamento (do bolso, do partido, doações) → rua (quanto tempo
e com quem) → tom. Cada etapa custa dinheiro, tempo e relações; a força da candidatura combina apoio, reputação
(com teto no municipal), nota da campanha, desgaste, aprovação de quem tenta reeleição, fadiga de mandatos
seguidos e o tamanho do partido, contra a dificuldade do cargo e do lugar. Resultado com sorte (logística).

**Mandato**: prazo, subsídio, aprovação que volta à média, desgaste, crises (chuva, greve, verba, obra, aliado,
votação, pedido) que pedem resposta, chefe de gabinete (uma pessoa), prioridade, conflito de interesses (abstrato)
para dono de negócio, custo anual do mandato (contribuição partidária, base, viagens), Brasília pesando na casa.
Governador muda para a capital. Voltar à profissão depois: servidor tem o cargo garantido; negócio reassume;
autônomo e informal voltam com parte da freguesia perdida; CLT volta só às vezes.

**Regras institucionais** (implementadas em `podeConcorrer`, com o fundamento em comentário e na ocupação):

| regra | fonte |
|---|---|
| Idade mínima: vereador 18 (no registro); prefeito, vice e deputados 21, governador 30, senador 35 (na posse) | CF art. 14 §3º VI; Lei 15.230/2025 (data de aferição) |
| Filiação partidária e domicílio eleitoral 6 meses antes | Lei 9.504/1997 art. 9º |
| Executivo: uma reeleição consecutiva | CF art. 14 §5º |
| Executivo que disputa outro cargo renuncia 6 meses antes | CF art. 14 §6º |
| Conscrito é inelegível | CF art. 14 §2º |
| Militar: menos de 10 anos deixa a ativa; mais, fica agregado e passa à inatividade se eleito; militar da ativa não se filia | CF art. 14 §8º; art. 142 §3º V |
| Servidor: desincompatibilização (3 meses, no modelo geral) | LC 64/1990 |
| Condenação / cassação: inelegível por 8 anos | LC 64/1990 com LC 135/2010 (Ficha Limpa) |
| Chefe de gabinete não é parente (nepotismo) | STF, Súmula Vinculante 13 |
| Calendário: municipais em 2028, 2032…; gerais em 2030, 2034…; eleição em outubro, posse em janeiro | CF arts. 28, 29, 77, 82 |

Fontes oficiais consultadas:
- Constituição Federal (compilada, TSE): https://www.tse.jus.br/legislacao/compilada/constituicao-federal/1988/constituicao-federal-de-1988?texto=compilado
- Lei das Eleições (9.504/1997): https://www.tse.jus.br/legislacao/codigo-eleitoral/lei-das-eleicoes/lei-das-eleicoes-lei-nb0-9.504-de-30-de-setembro-de-1997
- Lei de Inelegibilidade (LC 64/1990): https://www.tse.jus.br/legislacao/codigo-eleitoral/lei-de-inelegibilidade/lei-de-inelegibilidade-lei-complementar-nb0-64-de-18-de-maio-de-1990
- Idade mínima (TSE): https://www.tse.jus.br/comunicacao/noticias/2024/Maio/se-liga-qual-a-idade-minima-para-concorrer-a-prefeito-e-a-vereador
- Lei 15.230/2025, aferição da idade (Câmara): https://www.camara.leg.br/noticias/1207500-sancionada-lei-que-muda-regras-sobre-idade-minima-dos-candidatos-a-cargos-eletivos/
- Filiação (TSE): https://www.tse.jus.br/comunicacao/noticias/2023/Novembro/conheca-as-regras-de-filiacao-e-desfiliacao-para-ser-candidato-nas-eleicoes-2024
- Desincompatibilização (TSE): https://www.tse.jus.br/servicos-eleitorais/desincompatibilizacao
- Militares candidatos (TSE): https://www.tse.jus.br/comunicacao/noticias/2024/Janeiro/eleicoes-2024-regras-para-candidaturas-de-militares-cota-de-genero-e-nome-social
- Ficha Limpa (TSE): https://www.tse.jus.br/comunicacao/noticias/2025/Junho/lei-da-ficha-limpa-completa-15-anos

Simplificações assumidas: a desincompatibilização usa um prazo único por família; não há vice, suplência, coligação,
quociente eleitoral nem segundo turno; o financiamento é abstrato.

## 8. Integrações trabalho ↔ vida

- Cabeça e humor: ritmo, clima, negócio apertado, mandato e campanha entram como causas nomeadas em
  `fatoresCabeca` ("o ritmo puxado do trabalho", "anos de trabalho sem trégua", "a relação difícil com a
  chefia", "Lanchonete da Helena no vermelho", "a campanha", "o peso do cargo"); e também do lado bom ("um
  trabalho que cabe na vida", "gente boa no trabalho", "um mandato que a rua aprova").
- Semana (Tempo livre): o ritmo e a política ocupam a semana; o que passa do que cabe aparece hachurado.
- Pessoas: funcionários, sócio, chefe de gabinete, aliados, treinador são pessoas com vínculo; demitir alguém
  mexe na relação; o parceiro sente o prejuízo tirado do bolso e a semana em Brasília.
- Dinheiro (Você): retirada, caixa do negócio (separado do bolso), custo do mandato, empréstimo do negócio.
- Linha da Vida: marcas novas (política, candidatura, eleição, derrota, fim da vida política); fechamento do
  negócio e fim de carreira de atleta como capítulos.
- Moradia: transferência, remoção, movimentação militar e governo na capital mudam a cidade de verdade.
- Aposentadoria: mandato não aposenta; atleta encerra cedo e segue outra vida.

## 9. Save v12 e migração

- `VERSAO_SAVE = 12`. `interpretar` migra v11 → v12 com `migrarV11`, e todas as cadeias antigas terminam nela.
- v11 → v12: negócio ganha `caixa 0`, `porte 1`, `unidades`, `equipe []`, `reputacao` a partir da clientela;
  atleta profissional ganha `espaco` (pela habilidade) e `contratoAte` (próximo biênio); campos de emprego novos são
  opcionais (ausência = normal). Nada é descartado; a validação v12 confere pessoas da equipe e campos da política.
- Testado com **saves v11 reais** gerados na base 5148b4c (`fixtures/save-v11-negocio.json`,
  `save-v11-atleta.json`, `save-v11-professora.json`) além dos fixtures v6–v10 existentes: carregam, avançam anos
  e salvam como v12.

## 10. Testes

- Suíte: **339 testes, 13 arquivos, todos passando** (base: 259 em 11 arquivos).
- `profissao.test.ts` (novo): modos, ações contextuais (nada absurdo por caminho, saídas nunca em destaque, o
  porquê acompanha o contexto), ritmo com custo, clima, negócio (abrir como processo, registro, empréstimo,
  caixa, equipe, crescimento com custo, venda, fechamento, fracasso por dívida, textos por tipo, MEI bloqueado),
  atleta (contrato, banco, foco, doping abstrato, carreira finita), farda, serviço público, campo, arte,
  personalidade só por escolha, saves v11 reais.
- `politica.test.ts` (novo, os 12 pedidos): entrada pela comunidade; candidatura e derrota; vitória; mandato (e o
  custo dele; nenhum "chefe novo" para quem tem mandato); reeleição e o limite do executivo; outro cargo com
  renúncia; saída voluntária; volta à profissão; família e estado pessoal; carreira tardia; impossibilidades
  institucionais (idade, filiação, conscrito, militar, Ficha Limpa, terceiro mandato); save/migração e determinismo.
- Testes de interface atualizados para a navegação nova.

## 11. Simulações

`scripts/sim/profissao.ts` (novo): 11 estratégias × 30 vidas, até 70 anos (330 vidas).

| estratégia | patrimônio aos 60 (p10 · mediana · p90) | saúde aos 60 | sem trabalho aos 35 · 50 |
|---|---|---|---|
| convencional | 0k · 67k · 203k | 62 | 0/30 · 2/30 |
| puxado | 12k · 114k · 558k | **37** | 5/30 · 3/30 |
| preserva | −9k · 56k · 837k | **66** | 5/30 · 1/30 |
| negociador | 3k · 89k · 654k | 63 | 2/30 · 1/30 |
| empreendedor | −25k · 15k · 415k | 55 | 4/30 · 7/30 |
| empreendedor cedo | −12k · 23k · 481k | 55 | 4/30 · 3/30 |
| autônomo | −14k · 73k · 600k | 66 | 2/30 · 0/30 |
| atleta (força) | 0k · 117k · 842k | 79 | 1/30 · 2/30 |
| atleta (preserva) | 5k · 161k · 527k | 82 | 3/30 · 2/30 |
| político de carreira | 0k · 294k · 520k | 49 | 0/30 · 1/30 |
| político tardio | 16k · 86k · 647k | 60 | 3/30 · 4/30 |

- **Sem estratégia dominante**: nenhuma lidera mediana e p90 ao mesmo tempo; a de maior mediana (política de
  carreira) tem p90 menor que várias e saúde 49.
- **Trabalho excessivo custa**: puxado termina com saúde 37 contra 66 de quem preserva; 12 de 30 vidas puxadas
  receberam "O corpo deu sinal".
- **Negócio pode falhar**: 18 de 24 negócios do empreendedor fecharam em até 5 anos; quase todos tentaram de novo.
- **Atleta é finito e raro**: base em 5/30, profissional em 1/30, fim de carreira aos 33.
- **Desemprego existe** em todas as estratégias.
- **Riqueza não explode**: patrimônio aos 60 — p50 92k, p90 527k, p99 2,0 mi, máximo 2,9 mi.
- **Política**: ~40% das candidaturas perdem; 29 de 30 políticos de carreira perderam depois de ter ganho;
  cassações existem (2/27 no tardio).

Regressão contra a base (mesmas sementes e contagens): `simular.ts` sem violações de coerência, repetição 14,5
por vida (base 14,7); `trajetorias.ts` sem violações, as 20 histórias aparecem; `material.ts` com a mesma forma
da base (mobilidade por classe e extremos equivalentes).

Leitura de biografias (empreendedor, político, atleta, autônomo, puxado) encontrou e corrigiu: "ponto ao lado" e
"obra na rua" numa loja on-line; "rede a duas quadras" de uma empreiteira; desvio "num dos pontos" com uma
unidade; chefe novo e confraternização para vereadora, cabeleireira autônoma e dono de negócio; MEI para dona de
lanchonete; "Um ano inteiro de reunião por a fila…"; parênteses aninhados no texto do ritmo; "O mandato acaba"
quando o mandato seguia.

## 12. Playtest visual

`scripts/playtest/gerarRework.ts` gera 15 cenários (empregada, professora, dona de negócio, autônomo, informal,
rural, atleta, militar, candidata, vereadora, procurando, criança, adolescente, presa, aposentada);
`scripts/playtest/rework.mjs` abre cada área em 320/390/820/1440 px: **427 telas, nenhum problema estrutural**
(sem rolagem horizontal, botão fora da tela, botão sem nome, alvo < 40 px, nem "Viver mais um ano" cobrindo o fim
do conteúdo). Capturas em cinza e com daltonismo simulado para Trabalho, Você e Tempo livre. Problemas achados e
corrigidos na inspeção à mão: título duplicado "Cumprindo pena"; ações de peso zero ocupando o destaque; "vai bem"
contradizendo o horizonte; emojis sem glifo (⏳/⚡); a porta da política aparecendo para militar da ativa; "Onde"
repetido no painel militar; nomes em minúscula nos textos da semana; links de 32 px; rótulo sobre o trecho que
passa da semana ilegível; amostras de cor sem rótulo na criação.

## 13. Autoauditoria — o que ainda está fraco

- **Político de carreira ainda acumula mais que a média** (mediana 294k aos 60 contra ~90k). É plausível — o
  subsídio de deputado é alto — e é pago com saúde, cabeça e derrotas, mas a política como carreira longa é
  mais estável do que deveria. O custo do mandato ajudou (mediana caiu de 918k para 294k).
- **Atleta profissional é raro** (1 em 30 na estratégia dedicada). Intencional, mas pouca gente vai ver o painel
  de contrato jogando normalmente.
- A leitura "A eleição está perto" em "Negociar apoio" usa a próxima eleição de qualquer tipo, não a do cargo.
- Explorar mostra "vagas, concursos, o próprio negócio" também para quem tem mandato (acúmulo é permitido em casos
  restritos; o texto é genérico).
- Não há vice, suplência, segundo turno nem coligação; a desincompatibilização é simplificada.
- Oficialato militar e magistério superior continuam sem a mesma profundidade dos outros caminhos.
- "O mês" saiu de Casa e foi para Você, sem aviso na Casa. Quem jogou a versão anterior pode procurar ali; vale
  observar no playtest.
- As capturas "inteiro" (página toda) mostram a barra inferior no meio da imagem: artefato da captura, não da tela.

## 14. Como reproduzir

```bash
export PATH=$HOME/.nvm/versions/node/v22.23.2/bin:$PATH   # Node 22 (jsdom)
npx vitest run && npx tsc --noEmit -p . && npm run build

# vida profissional e política (330 vidas)
npx esbuild scripts/sim/profissao.ts --bundle --platform=node --outfile=/tmp/prof.cjs
VIDAS=30 SAIDA=/tmp/prof node /tmp/prof.cjs

# playtest visual
npx esbuild scripts/playtest/gerarRework.ts --bundle --platform=node --outfile=/tmp/gr.cjs && SP=/tmp/vida-rework node /tmp/gr.cjs
npx vite preview --port 4173 &
SP=/tmp/vida-rework node scripts/playtest/rework.mjs
node scripts/playtest/contraste.mjs
```
