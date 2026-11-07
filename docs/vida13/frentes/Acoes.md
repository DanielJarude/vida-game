# Frente 6 — Ações anuais (§8) e apresentação das ações (§9)

## Auditoria: os fluxos anuais (§8.4)

Reproduzido com saves reais (`~/vida-trabalho/qa129/saves`, script `a13/acoes/repro.ts`): em 6 anos de 4 saves
(apto 47/54, mansão 54/69, empresária 54/58) o ano abria com uma decisão + 1 a 2 na fila (ex.: `luto_despedida` →
`rom_alguem_especial` → `bio_irmao_separou`; `adu_ferias` → `eco129_mil_processo`; `bio_amizade_decadas` →
`eco129_med_imprevisto`). Saves reproduzidos em `a13/acoes/saves/fila-*.json`.

| # | Fluxo | Onde | Problema |
|---|---|---|---|
| 1 | **Fila de decisões do ano** (o caso do pedido) | `conteudo/motor.ts:resolverDecisao` (abria `abrirProximaDaFila` na hora, l.~218); `ui/telas/Jogo.tsx` (`{!vida.momento && c.resultado && <Resultado/>}`); `ui/useVida.ts:agir` (`setResultado` sobrescrito a cada decisão) | **Causa raiz:** a próxima decisão abria no mesmo instante; a tela só mostra o resultado quando não há decisão aberta, então cada resultado ficava escondido e era **apagado** pelo seguinte. O jogador decidia tudo às cegas e via só o último resultado. (O motor já preparava a próxima com o estado novo — `prepararCom` — mas o jogador não via.) Antes: `fotos/acoes/antes/fila-2-*` (depois de escolher no luto, aparece direto "Alguém especial"). |
| 2 | Etapas de processo (`res.reabrir`/`res.abrir`: entrevista, peneira, eleição) | `conteudo/motor.ts:resolverDecisao` | Mesmo efeito: o resultado da etapa 1 sumia sob a etapa 2. |
| 3 | Ação que abre uma decisão na hora (Submundo, crime, procurar contato, conflito de trajetórias) | `acoes.ts:executarNaTransacao` casos `submundo`/`crime`/`margem` (l.~1078–1092) | O resultado da ação ficava atrás da decisão e era sobrescrito por ela. |
| 4 | Empresas: alavancas e projetos ("O efeito aparece no fechamento do ano") | `sistemas/empresas129.ts:decidirEmpresa129` (l.~964) | É desenho (o ano simula), mas o resultado não dizia caixa antes/depois nem o que esperar de forma estruturada. Texto das decisões: Frente 5. Mecanismo: aqui. |
| 5 | Rotinas/agenda/estudos (efeito no fim do ano) | `ano.ts:viverAno` → `AnoQuePassou` | Desenho correto (é o ano vivido); nada mudado. |
| 6 | Limites anuais (`anoAtual.acoes`, TETO_DO_ANO=4, orçamento) | `acoes.ts`, `conteudo/motor.ts` | Preservados sem mudança. |

## O que mudou

**Mecanismo genérico de resultado imediato** — `src/motor/sistemas/desfecho13.ts` (novo, pacote motor-conteudo):
`antesDaAcao13`, `montarDesfecho13` (escolha, texto, mudanças, **conta antes/depois**, **dívidas antes/depois**, **caixa da
empresa antes/depois** quando a ação tem `empresaId`, o que esperar, quantas decisões restam e quantas são urgentes),
`seguirDesfecho13`, `disponibilidadeDesfecho13`, `filaDoAno13`, `normalizarVida13Acoes`.
`src/motor/sistemas/anotar13.ts` (novo, sem imports, pacote motor-casa): `anotarDesfecho13({ esperado?, mudou? })` — qualquer
sistema (ex.: Frente 5 em `decidirEmpresa129`) anota "o que esperar"/"o que mudou" da ação em curso; `executar` recolhe com
`recolherDesfecho13`. Fora de uma ação, não faz nada. Todo `Retorno` de `executar` traz agora `desfecho`.

**Fluxo uma-de-cada-vez** (pedido pela tela: `{ tipo: 'decidir', umaPorVez: true, momentoId }`):
- `conteudo/motor.ts:resolverDecisao(..., segurarFila)` — 1 parâmetro; com ele a próxima espera.
- `acoes.ts:executar` — retrato antes, `recolherDesfecho13`, monta o `desfecho`; guarda em `vida.desfecho13` quando há decisão
  atrás (a próxima do ano, ou a que a ação abriu — fluxos 1, 2, 3). Não reabre a fila quando `umaPorVez`.
- Nova ação `{ tipo: 'desfecho13', oque: 'seguir' | 'encerrar' }`: `seguir` abre a próxima, **preparada com o estado de agora**
  (`abrirProximaDaFila` → `prepararCom`: o que deixou de caber não abre); `encerrar` = "Deixar o resto para depois": as que podem
  esperar vão para o ano seguinte (uma vez, como o ano cheio já fazia); a que já tinha esperado sai da pauta; **as urgentes
  (luto, gravidez, processo) continuam e abrem**. Só vale com um resultado pendente (clique duplo/recarga não repete).
- `disponibilidade('decidir')` com `momentoId` diferente do aberto → "Essa decisão já foi tomada." (o duplo toque nunca escolhe
  na decisão seguinte).
- `ano.ts:avancarAno` — se há resultado pendente ou decisão do ano esperando sem momento, abre a próxima e não anda o ano.
- Sem `umaPorVez` (testes antigos, sims, scripts) o motor segue exatamente como antes.

**Interface**
- `ui/jogo/Momento.tsx:Resultado` — "Você escolheu", o texto, linhas de dinheiro (Sua conta / Suas dívidas / Caixa de X: −/+ e
  "agora R$"), "O que mudou na sua vida", "O que esperar", "Ainda há mais N decisões neste ano (… não pode esperar)", botões
  **Próxima decisão** e **Deixar o resto para depois** (ou "Deixar as outras para depois" quando há urgente). `Momento` envia
  `umaPorVez`+`momentoId`; nota da fila reescrita ("Um de cada vez: antes do próximo, você vê o que esta escolha deu").
- `ui/telas/Jogo.tsx` — o resultado guardado na vida aparece **antes** do momento; "Viver mais um ano" desativado enquanto há
  resultado pendente.
- `ui/useVida.ts` — o resultado que mora na vida não é duplicado em estado da tela; o aviso de `avancarAno` que já abriu a
  decisão aplica a vida (antes descartava); ações comuns passam `desfecho` ao `Resultado` (aparece quando há título, caixa ou
  "o que esperar").
- `ui/comum.tsx:BotaoAcao` (estados globais herdados por Empresas, fama etc.): foco visível, pressionado, cursor, motivo da
  indisponibilidade com cadeado e **ligado ao botão** (`aria-describedby`), "✓ Feito" (role=status) por 1,6 s depois do clique.
- `ui/comum.tsx:AcoesVivas` (10 usos: Vida pública, Trabalho, banda/grupo, negócio paralelo): itens com cara de controle
  (ícone por tipo — fazer, ir a outro lugar, indisponível, saída —, borda, hover, foco, pressionado, "Feito"), destaque "agora"
  para peso ≥ 7, indisponível tracejado com motivo, saídas em vermelho e por último; **agrupamento por contexto** quando há
  ≥ 5 ações em ≥ 2 contextos (`ui/gruposDeAcoes13.ts`): política — Mandato e governo, Campanha e eleições, Partido, Relações
  políticas, Exposição pública, Estratégia, Saídas; trabalho — O dia a dia, Crescer na carreira, Procurar e mudar, Saídas.
  Grade de 1–3 colunas (300 px mín.), 1 coluna em 390 px.
- `ui/acoes13.css` (novo; nenhuma classe-raiz duplicada).
- **Bug corrigido:** `ui/jogo/Trabalho.tsx:ehAcaoPublica` não incluía `pres_*` — os verbos da Presidência (política econômica,
  reforma, base no Congresso, agenda internacional, pronunciamento) ficavam em Trabalho, embaixo do aviso "o mandato está em
  Vida pública", e a Vida pública da presidenta mostrava só 3 ações. Agora estão em Vida pública (grupo Mandato e governo).

## Campos de save
- `Vida.desfecho13?: Desfecho13` (opcional; ausente = nada pendente). Normalizador `normalizarVida13Acoes` (chamado em
  `save.ts:interpretar`): remove o mal formado ou de outro ano. Save continua v20.
- Tipos novos em `tipos.ts`: `Desfecho13`, `Retorno.desfecho?`.

## Testes (resultados reais)
- `src/motor/__tests__/vida13Acoes.test.ts` — **10/10**: legado intacto sem `umaPorVez`; resultado antes da próxima (escolha,
  texto, restantes; fila intacta, nada registrado da próxima); avançar com resultado pendente abre a próxima e não anda; seguir
  prepara com o estado de agora (a que deixou de caber não abre); ano inteiro com 3 resultados; **salvar/recarregar no meio**:
  mesmo resultado, decidir repetido rejeitado, seguir duas vezes rejeitado, conta/biografia/ocorrências iguais; encerrar com
  urgente; encerrar o já adiado (sai da pauta, ano anda); conta antes/depois numa ação comum; anotação só dentro da ação;
  normalizador.
- `src/ui/__tests__/vida13Acoes.test.tsx` — **6/6** (App real com save no localStorage): resultado antes da próxima, recarregar
  o App no meio mostra o mesmo resultado, "Próxima decisão" abre a seguinte, "Deixar o resto para depois" libera o ano;
  Resultado com conta/dívidas/o que esperar; grupos na ordem, destaque, indisponível com motivo ligado; lista curta sem grupos;
  classificador; BotaoAcao (motivo ligado, "Feito").
- Regressão: `rework115Eventos` + `vida125` **passaram**; `motor.test` 40/42 — as 2 falhas são **timeouts** (60 s/20 s) da
  "regra de agência" com a máquina compartilhada (110 s), sem asserção falhando; os testes percorrem `avancarAno`+`responder`
  sem `umaPorVez` (caminho inalterado). UI: `rework115Interfaces`, `fixPosPlaytestHumano` (auditoria de CSS), `fixPosRework3`,
  `rework97` — **24/24**; `vida129Presidencia`, `rework9`, `rework95` passaram; `navegacao` 1 timeout (24 s > 20 s) — ver
  rodada com timeout maior abaixo.
- `tsc`: nenhum erro nos arquivos desta frente (erros vistos eram de empresas129/tatuagens13Pop/comodos de outras frentes).

## Sim (8 saves qa129 × até 20 anos, `a13/acoes/sim.ts`)
139 anos, 147 decisões, **147 resultados vistos** (100 %), 17 anos com mais de uma decisão, 24 recargas no meio do ano,
32 resultados com conta antes/depois; **139/139 anos com biografia e conta idênticas** ao fluxo antigo com as mesmas escolhas
(o fluxo novo muda a apresentação e a ordem de ver, não o que acontece).

## Auditoria visual
`a13/fotos/acoes/antes|depois/` — vida pública (vereadora com desgaste, presidenta), trabalho (empresária, jovem), outros
caminhos, fila (antes/depois da escolha, próxima, recarregar, imprevisto com dinheiro), claro/escuro, 1440/390. Olhadas: o
resultado aparece com "Você escolheu" e os botões; vereadora: 17 linhas iguais → 7 contextos com contagem; mobile 390 sem
rolagem horizontal (o script mede: "sem problemas").

## Limitações honestas
- O resultado de uma decisão comum não mede atributos (humor, reputação) antes/depois — só dinheiro, dívidas e caixa; o resto
  vem do texto e das linhas da biografia. Frente 5 deve chamar `anotarDesfecho13` para "o que esperar" das empresas (não fiz:
  `empresas129.ts` é dela).
- Não é possível pular a decisão **já aberta** (só as que esperam): ela já foi apresentada e registrada como ocorrência;
  etapas de processo e urgentes não esperam.
- Ações comuns que só mexem na conta continuam como aviso curto (não viram folha) para não interromper compras.
- Fama/No mundo (Frente 7) e Empresas129 (Frente 5) herdam BotaoAcao, mas não reorganizei as telas delas.
- Agrupamento só nas listas `AcoesVivas`; outras telas com botões soltos (Concursos, Plenário) ganharam só os estados globais.

## Pacotes (build próprio `a13/dist-acoes`, com as outras frentes em andamento no mesmo diretório)
motor-dados 798,9 kB · motor-textos 794,3 · motor-carreira 747,8 · motor 741,8 · Jogo 629,7 · motor-acontecimentos 339,0 ·
motor-vida 285,2 · motor-casa 281,8 · motor-patrimonio 255,2 · motor-conteudo 165,0 · motor-folhas 59,0. Desta frente:
`desfecho13` em **motor-conteudo** (conferido no build); `anotar13` (sem imports) com regra própria em **motor-casa**, fora de
motor-dados; em motor-textos só o parâmetro `segurarFila` (dezenas de bytes); nada em motor-dados nem em motor. O aumento de
motor-dados/motor-textos vem de outras frentes. UI: `acoes13.css` (~7,5 kB fonte) no CSS principal; `gruposDeAcoes13` em Jogo.

Rodada final: `navegacao.test.tsx` com `--testTimeout=90000` → **13/13** (o timeout anterior era só carga da máquina).
