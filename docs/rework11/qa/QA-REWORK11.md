# QA visual e de usabilidade — REWORK 11

Build: f6a873a + nota da versão 11 (`src/ui/novidades.ts`), reconstruído em `~/vida-copia` (`npm run build`, `vite preview` na porta 4173). Preset `VIDA_NOVIDADES_VISTAS='11'` em todas as cenas (a janela de novidades não abriu em nenhuma captura). Nenhum código do jogo foi alterado.

## Ferramentas e onde estão

- `scripts/playtest/gerarRework11.ts`: os saves `vida-r11-*.json`, montados como nos testes de cenário do motor (`OUT=<pasta>/saves`).
- `scripts/playtest/rework11.mjs`: 31 cenas, 4 paletas, 1440 e 390 px. As cenas marcadas com * no pedido também saem em 360 e 390×560. A geometria e o contraste vêm do rework106.mjs. Este script acrescenta: o passo `ver:<css>`, os alvos de toque < 44 px a 390/360 e o arquivo `medidas-<tema>.jsonl`, gravado a cada captura. Cada captura sai também em página inteira (`-inteira.png`).
- `scripts/playtest/montagem11.mjs`: as montagens em JPEG. `EXTRA=<json>` acrescenta montagens (as de defeitos estão em `scripts/extra-montagem11.json`).
- `scripts/playtest/elementos11.mjs`, `recorte11.mjs` e `sonda11.mjs`: captura de um elemento, recorte sem PIL, e a sonda que achou os seletores.
- Cópias de tudo em `~/vida-trabalho/qa11/scripts/`. As capturas (648 PNG, 352 rodadas) estão em `~/vida-trabalho/qa11/depois/` e as medidas em `depois/medidas.jsonl`. Montagens: `~/vida-trabalho/qa11/montagens/` e `docs/rework11/qa/*.jpg`, sem commit.

## Saves

| Save | O que é |
|---|---|
| sem-clube | 27 anos, goleiro do Cruzeiro sem clube (`ficarSemClube`), com duas portas: indicação de Adele para manicure (`natureza: mudanca_carreira`) e de Tito para treinador de escolinha (`por_conta`) |
| paises | Cruzeiro → Barcelona → Juventus, 2 temporadas em cada (com `fecharTemporada`, `registrarTemporada` e `esp_proposta` aceita). Na Juventus, salário de € 3,6 mi/mês e conta de € 12 mi |
| momentos | A carreira de futebol do teste CAR-11.9 (semente 31): 14 anos vividos pelo motor, Sport → Santos → Vasco → Sevilla → Manchester City → Borussia Dortmund, 40 momentos |
| tecnico / auxiliar | Ex-jogador do Cruzeiro como técnico principal (`processarTecnico`) e como auxiliar técnico |
| ator / musico-pet / politico | Atriz profissional, músico profissional com a calopsita Sunny e prefeita em mandato (ano 1 de 4) |
| noiva / ex | Noivado com Otávio há 8 meses; namoro com Iasmin terminado há 2 anos |
| redes / redes-suspensa | Instagram com 3 anos fechados e 669 mil "agora", mais uma conta no X, com 1 advertência; a versão suspensa tem 3 advertências |
| crianca10 | 10 anos, R$ 193 no cofrinho, com responsável (Silvana). As lojas de objetos abrem aos 10 (`idadeMin: 10` em Compras.tsx:93) |

## Números por cena (todas as paletas)

Medidas de cada captura:
- **Sobrep.**: linhas de texto visíveis que se cruzam.
- **Rolagem X**: a página rola na horizontal.
- **Estouram**: elementos que passam da borda direita.
- **Contraste < 3**: medido a 1440 e 390.
- **Alvos < 44**: botões, links, abas, radios, inputs, selects e summaries visíveis com altura ou largura < 44 px em toda a página a 390×800. É o mesmo número nas 4 paletas.

| Cena | Capturas | Larguras | Sobrep. | Rolagem X | Estouram | Contraste<3 | Alvos<44 a 390 (min–max) | Erros/passos faltando |
|---|---|---|---|---|---|---|---|---|
| trabalho-sem-clube | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| caminhos-sem-clube | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 2–2 | 0 |
| carreira-momentos | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| comissao-tecnico | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| comissao-auxiliar | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| porta-mudanca | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| porta-por-conta | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| trabalho-ator | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| trabalho-politico | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 7–7 | 0 |
| publica-politico | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 4–4 | 0 |
| noivado | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 27–27 | 0 |
| ex | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 7–7 | 0 |
| ex-acoes | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 7–7 | 0 |
| redes-oque | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 10–10 | 0 |
| redes-como | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 12–12 | 0 |
| redes-confirmar | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 11–11 | 0 |
| redes-historico | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 10–10 | 0 |
| redes-suspensa | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 10–10 | 0 |
| agenda-musico | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 9–9 | 0 |
| agenda-auxiliar | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 10–10 | 0 |
| loja-instrumentos | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 8–8 | 0 |
| loja-bicicletas | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 9–9 | 0 |
| loja-esportes | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 8–8 | 0 |
| carreira-paises | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| euros-placar | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| euros-dinheiro | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 13–13 | 0 |
| carreira-desempenho | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 5–5 | 0 |
| loja-bicicleta-pedido | 16 | 1440, 390, 360, 390×560 | 0 | 0 | 0 | 0 | 7–7 | 0 |
| voce-trajetoria-paises | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 6–6 | 0 |
| voce-trajetoria-momentos | 8 | 1440, 390 | 0 | 0 | 0 | 0 | 6–6 | 0 |
total 352

Total: **352 rodadas**, com **0 sobreposições de texto, 0 rolagens horizontais, 0 elementos estourando a borda, 0 textos com contraste < 3:1**, 0 erros de página ou console e nenhum passo de navegação faltando (na rodada final).

Alvos < 44 px a 390, por tipo. São padrões do sistema todo; nenhum fica abaixo de 32 px, exceto os indicados:
- `.subnav__item` e `.chip` com 40 px de altura (todas as cenas); `.escolha__item` com 40 px (noivado: os chips "10/30/60…" têm 37–48 × 40); `.app-abas__item` do celular com 36 px; `.celular__voltar` com 40 px; `.agenda-semana__dia-botao` com 40 × 44.
- `button.link` com 32–35 px ("Mais ações", "← Escolher outro", "Ver em Trabalho →"); `.entrada__rosto` ("ver a ficha" do convite) com 32 px; `a.nota-agenda__ir` com 32 px.
- **< 32 px**: o bloco curto da agenda, `button.bloco-agenda--casa.bloco-agenda--curto` ("Cuidar de Sunny"), tem **17 px** de altura a 390. O `::before` de organizada.css:92 aumenta a área de toque em 10 px para cima e para baixo, o que dá ~37 px efetivos, ainda < 44. O `bloco-agenda--trajeto--curto` do auxiliar tem 31 px. Os checkboxes de "Lua de mel" e "Impulsionar" medem 13–15 × 20, mas ficam dentro do label.

## O que vi inspecionando (Read nas capturas)

1. **Atleta sem clube**: título "Jogador de futebol sem clube". O placar diz "SEM CLUBE · sem clube · último: Cruzeiro (até 2053) · goleiro", seguido dos atributos da posição (reflexos, posicionamento, saídas do gol, jogo com os pés). As ações são de atleta ("Pedir ao empresário para procurar um clube", "Trabalhar com outra coisa — encerra a carreira"), sem bicos nem concursos. A página inicial de Caminhos mostra "A vida de atleta, sem clube agora" e manda para Trabalho. Há muita repetição de "sem clube" (subtítulo, folio, placar e Contrato dizem a mesma coisa quatro vezes), mas nada quebra.
2. **Carreira em países diferentes**: a Ficha do atleta tem títulos com o nome certo por país (Copa do Brasil, Primera División, Copa del Rey, Coppa Italia), a final da Champions e a tabela "Por clube". A temporada da Juventus diz "Serie A · 2º lugar · … · Coppa Italia: quartas · Champions League: vice". Na carreira vivida pelo motor: Bundesliga, Premier League, FA Cup e "Melhor jogadora da Premier League". **Mas a liga de cada temporada só aparece no cartão da última temporada**: a Ficha agrupa por clube, sem coluna de liga (Trabalho.tsx:1349–1360, `historicoDaCarreira` → `agrupado: 'clube'`), e a aba Desempenho só mostra "Joga como poucos". Os "Momentos da carreira" vêm numa lista cronológica, cada item com o rótulo "marco ·" ou a decisão em itálico, e "Ver os 40 momentos". Não há agrupamento visual por tipo além desse rótulo.
3. **Comissão técnica**: técnico com CLUBE "Cruzeiro · Série A", LICENÇA "nenhuma ainda", VESTIÁRIO "sem queixas", DIRETORIA "tranquila", e as ações do banco (licença C, análise tática, cuidar do elenco). O auxiliar tem "Preparar a análise dos adversários", a licença bloqueada com o motivo ("na conta há R$ 0") e "Fazer a ponte entre a comissão e os jogadores". Nenhum verbo de empresa.
4. **Portas**: "Mudança de carreira · Indicação de Adele" diz "É outra carreira… continua sua mesmo sem clube" e "ao aceitar, a vida pergunta — encerrar a carreira de jogador, ou recusar". "Atividade por conta própria · Indicação de Tito" diz "Por conta própria: sem entrevista — clientes seus…". Aceitar, Deixar passar e Decidir depois cabem em 360. Em 390×560 o botão Aceitar fica abaixo da dobra, mas a folha rola.
5. **Atriz**: as ações são de artista (preparador, teste de elenco, temporada curta, edital, "Estrear um trabalho novo"). **Prefeita**: Vida pública mostra aprovação, partido, prioridade e as ações do cargo (secretariado técnico × aliados, sancionar/vetar, orçamento, obra grande), sem "pedir aumento". Ver os defeitos D1 e D6.
6. **Noivado**: a seção "O CASAMENTO" tem a preferência ("Otávio sonha com uma festa grande"), Onde (6 opções), A cerimônia, Convidados (10–400), O estilo, a Lua de mel, Ao todo / A sua parte / O que você tem (R$ 24 mil / 19 mil / 200 mil), quem paga o resto e "Combinar este plano". Os chips quebram bem em 360 e em 390×560. **Ex**: Iasmin aparece em "Afastados" ("sua ex · esfriando"). A ficha traz "Tentar de novo", "Conversar sobre o que ficou entre vocês" e as categorias Conversar, Romance, Resolver conflitos e Confrontar, com mensagem, elogio, reaproximar, encontro casual, provocar e xingar. Ver D4.
7. **Redes**: o passo a passo "1. O quê 2. Como 3. Publicar" funciona. Uma opção vira "Uma foto do dia" + Impulsionar (R$ 330) + Continuar / ← Escolher outro, que vira "No Instagram: Uma foto do dia" + Publicar / ← Voltar. O histórico diz "No fim de cada ano — e o número de agora: 2049 100 mil · 2050 300 mil · 2051 480 mil · agora (2052) 669 mil", e cabe em 360. A conta suspensa: ver D2. Observação: a 390, o conteúdo do app fica ACIMA da fileira de plataformas. Nas capturas, a linha "1. O quê…" sai meio coberta pelo cabeçalho porque o Playwright rola até a aba antes de tocar; o app não rola sozinho (sem `scrollIntoView` em Redes.tsx). Isso é artefato do roteiro, não defeito.
8. **Agenda**:
   - Músico: trabalho ter–qui das 14h às 19h, shows sex–sáb das 19h às 24h, a calopsita às 7h todos os dias, "Tocar um instrumento" ter/qui das 19h às 20h, sem conflito ("84 h livres"). Ver D3.
   - Auxiliar: seg–sex das 8h às 12h30, seg/ter/qui das 14h às 17h, o jogo no domingo das 15h às 19h, sem conflito. Plausível, mas o trajeto aparece só na ida de manhã e no meio do dia (12h30–13h30); não há trajeto antes das 14h nem depois das 17h nem no domingo. É um detalhe de coerência do motor (`blocosDoTrabalho`/trajeto, em `motor/sistemas/agenda.ts`), não de layout.
9. **Lojas da criança**:
   - Instrumentos: a regressão está **corrigida**. Em 360 e em 390×560 o cartão empilha (objeto + texto, e o pedido em linha inteira). Preço / No cofrinho / Falta, o "Pedir a [Silvana]", "Pedir a Silvana para comprar" e "Pedir ajuda para completar R$ 797" ficam legíveis, sem aperto. Ver D5.
   - Bicicletas: a lista mostra só preço e descrição. O pedido aparece no detalhe do anúncio: Preço R$ 1.000, "Pedir a [Silvana]", "Pedir a Silvana" (cena loja-bicicleta-pedido), e cabe em 360.
   - Artigos esportivos (outro `.oferta--objeto`): o kit de academia de R$ 2.750 tem pedido + completar R$ 2.557 em 360, sem aperto.
10. **Milhões em euro**: o placar diz "NO BOLSO € 2.715.163/mês (bruto € 3.621.000)" e quebra em duas linhas sem estourar, a 1440 e a 390. "SALÁRIO DO CONTRATO € 3,6 mi/mês, bruto"; Vida → Dinheiro "O que é seu € 12 mi"; "Entra € 3,0 mi, sai € 1,7 mi". O mesmo valor aparece em dois formatos (cheio × curto), mas é legível.

As paletas: as 4 renderizam sem perda de legibilidade nas cenas vistas (11-paletas.jpg, e escuro/atlantico nas outras montagens).

## Defeitos encontrados (não corrigidos)

- **D1 · prefeita "Sem trabalho agora"**. Em Caminhos → Trabalho, o subtítulo da divisão diz "Sem trabalho agora — vagas, por conta, negócio", logo acima de "Prefeita · Ano 1 de 4 do mandato". Causa provável: `src/ui/jogo/CaminhosDaVida.tsx:155`, `if (e && modo !== 'politica') …`, que faz o modo política cair no `return` da linha 161. Evidência: `depois/trabalho-politico-*-1440.png`, montagem 12-defeitos (a).
- **D2 · conta suspensa**. Na aba Publicar, cada uma das 4 opções desabilitadas repete o motivo inteiro ("A conta está suspensa até 2053: a Instagram puniu as denúncias (provocação nos comentários)"): quatro vezes o mesmo texto e nenhuma ação. Bastaria um aviso só. E "**a** Instagram" é concordância errada (o Instagram, o X, o TikTok, o YouTube). A frase vem de `src/motor/sistemas/redes.ts:270` (`a ${pl.nome}`) e de `src/ui/jogo/Redes.tsx:425`. Evidência: `depois/redes-suspensa-claro-1440.png` e `-escuro-390b.png`, montagem 12 (b).
- **D3 · agenda: o bloco de 1 h corta o horário**. "Tocar um instrumento" (19h–20h) ocupa duas linhas e o "19h–20h" sai cortado ao meio, porque o bloco tem `overflow: hidden` (`src/ui/organizada.css:81`). Só blocos de **menos** de 60 min ganham o layout de uma linha (`const curto = b.fim - b.inicio < 60`, `src/ui/jogo/Agenda.tsx:133`). O detector de sobreposição não pega texto recortado. Evidência: `depois/agenda-musico-claro-1440-inteira.png`, montagem 12 (c).
- **D4 · botões de duas linhas sem respiro**. `.botao` tem `padding: 0 var(--space-4)` e `min-height: 44px` (`src/ui/vida.css:74`). Quando o rótulo quebra em duas linhas (23,25 px cada), o botão mede 47 px e o texto encosta na borda. Exemplos medidos a 390: "Dizer a Iasmin o que anda incomodando", "Conversar com Iasmin sobre o que ficou entre vocês", "Pedir a Iasmin para tentarem de novo" e "Propor a Iasmin um encontro…", todos com 47 px e padding 0/0. É do sistema todo, mas os rótulos longos do REWORK 11 (ações com o ex) expõem o problema. Evidência: `depois/ex-acoes-escuro-390.png`, `ex-claro-390.png`, montagem 12 (d).
- **D5 · loja da criança: informação dobrada**. No violão (falta dinheiro, grau bloqueado), o cartão mostra o "Comprar" desabilitado, depois "Custa R$ 990; na conta há R$ 193." e, logo abaixo, o bloco do pedido com "No cofrinho R$ 193". São dois blocos para o mesmo dado, e "conta" contradiz "cofrinho". No kit de academia, o "Comprar" some (`ocultarImpossivel`), ou seja, cada item se comporta de um jeito. Local: `src/ui/jogo/material/Lugares.tsx:174–176` (esconder o Comprar quando o `PedidoDeCompra` aparece). Na loja de bicicletas, o topo diz "Nada cabe agora. O mais barato (R$ 600): Custa R$ 600; na conta há R$ 193." para quem não compra com o próprio dinheiro. Evidência: `loja-instrumentos-claro-360.png`, `loja-bicicletas-atlantico-360.png`, montagem 12 (f).
- **D6 · verbos de emprego para quem não tem emprego comum**. Os quatro cartões do alto de Caminhos → Trabalho, "Mudar de trabalho: ver vagas" e "Candidaturas e entrevistas" (`src/ui/jogo/Trabalho.tsx:294–298`), aparecem iguais para a atriz, o jogador da Juventus, o técnico e a prefeita. Para a prefeita, "Mudar de trabalho: ver vagas" não tem nota nenhuma. O nudge "Faltou formação para uma vaga? Os cursos estão em Estudos" também aparece para todos. É de usabilidade, não de layout; as ações do ofício abaixo estão certas.
- **D7 · ano do mesmo título difere entre telas** (suspeita, com saves montados). A Ficha do atleta diz "2055 · Campeão da Primera División com o Barcelona"; "Por onde você passou" (a biografia) diz "2056 · Campeão da Primera División com o Barcelona: 32 jogos…". A Ficha usa o ano da temporada e a biografia usa o mês em que a temporada foi registrada (o fechamento cai no ano seguinte). Na mesma seção, as transferências saem 2055/2057, enquanto a tabela "Por clube" diz Barcelona 2054–2055 e Juventus 2056–2057. No save `paises`, o `x.t += 12` do roteiro de teste pode amplificar isso; confirmar numa vida jogada. Evidência: `carreira-paises-claro-1440-inteira.png`, montagem 12 (e).

Menores (texto e conteúdo): "INPS: 0 anos de contribuição" para quem tem 2 temporadas de carteira na Juventus. "Mais do que marcou" na trajetória (Você → No mundo) repete os títulos que já estão em "Títulos", e as 3 realizações do topo não estão em ordem (2055, 2054, 2056).

## O que não deu para cobrir

- Não houve cena "antes × depois" contra uma base anterior ao REWORK 11; a regressão da loja de instrumentos foi conferida só no estado atual.
- O contraste não foi medido em 360 nem em 390×560 (igual ao rework106).
- O detector de sobreposição ignora texto recortado por `overflow` (por isso D3 só apareceu na inspeção).
- O conteúdo dentro das folhas (modais) não entra na captura de página inteira. Os trechos longos das fichas (noivado, ex) foram vistos com `ver:` e nos recortes, não por inteiro em todas as paletas.
- O passo "Combinar este plano → Casar → A lua de mel" e a conta **banida** (9 advertências) não foram capturados; ficaram só "planejar" e "suspensa".
- Os saves são montados à mão (como nos testes). As datas e números do save `paises` (D7) e "Publicações 0 / Virais 0" com 669 mil seguidores refletem a montagem, não uma vida jogada.
- O técnico tem R$ 250 mil na conta, mas o painel diz "O dinheiro: No vermelho". Não investiguei se vem do save (possível dívida do ex-jogador) ou de um erro de leitura.
- A suíte de testes não foi rodada, como pedido.
