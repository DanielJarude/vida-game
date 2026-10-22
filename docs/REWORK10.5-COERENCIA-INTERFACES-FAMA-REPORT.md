# REWORK 10.5 — COERÊNCIA, INTERFACES, FAMA E CONSEQUÊNCIAS

**Branch:** `claude/fix-pos-rework3-playtest` (sem merge na `main`, sem force push, sem deploy manual, APK **não** regenerado)
**Base:** REWORK 10 concluído (`f2d4d5e`)
**Save:** v20 — só campos opcionais novos

---

## 1. Branch e commits

| commit | conteúdo |
|---|---|
| `f28ed33` | Fases A–F — histórico acadêmico, atendimento médico, ficha honesta, Submundo, mágoas, fama com causa, produções com identidade, desgaste político |
| `c79490d` | Fase G — dinheiro da criança, começo da vida, textos (preposições), militar, testes antigos com pré-condição dita, simulações e cenas de captura |
| (este) | Fase I — relatório final |

## 2. Linha de base

- Suíte na base (`f2d4d5e`): **1617/1617** (91 arquivos), `tsc` limpo.
- `motor` 784,2 kB (limite 800 kB).
- População REWORK 10 (10 perfis × 6 vidas até 85): 0 travamentos, 0 violações, **31,8 ms/ano**.

## 3–5. Rastreabilidade: problema → reprodução → causa → correção → teste → resultado

Legenda do resultado: ✅ corrigido e validado · 🟡 parcial · ⏳ pendente. Tudo o que é interface está **implementado, mas não validado em dispositivo real** (ver §14).

| ID | Problema | Reprodução | Causa raiz | Correção | Teste | Resultado |
|---|---|---|---|---|---|---|
| EDU-05 | Boletim deixava de funcionar na faculdade | Matricular em Direito aos 18 e avançar anos | A faculdade reaproveitava o boletim escolar; o último ano do médio não era registrado | `sistemas/historicoAcademico.ts`: escola ano a ano (incl. o último do médio) e faculdade com disciplinas da área, notas na escala do país, créditos (4/disciplina), reprovações, trancamento, abandono e cancelamento; tela `HistoricoAcademico.tsx` (Progresso e Estudos · Histórico) | `rework105.test.ts` + `rework105.test.tsx` (EDU-05) | ✅ |
| SAU-02 | Sintoma persistente sem caminho para o médico; câncer tardio | Criança de 8 anos com sinal não diagnosticado | Atendimento só aparecia em certos estados; menor não podia pedir; busca "saúde" ia para atributos | `AtendimentoMedico` sempre visível no prontuário (Você); criança pede aos responsáveis (`quemLeva`); menor diagnosticado passa a ser tratado; demora conta até a primeira procura (`Condicao.procurou`); alertas levam ao destino `prontuario` | rework105 (SAU-02, motor e UI) | ✅ |
| UX-14 | Romance mostrava "1" e abria vazio | Ficha de pessoa com flerte impossível | Contador contava itens não elegíveis | Contador = ações possíveis; impossível não entra; categoria vazia explica o motivo | rework105.test.tsx (UX-14) | ✅ |
| UX-15 | "O que faz sentido agora" crescia a cada interação | Interagir várias vezes na mesma ficha | Os já feitos saíam da lista e outros entravam no lugar | Feito no ano vira linha "Já neste ano"; o "agora" fica estável | rework105.test.tsx (UX-15) | ✅ |
| CAR-12 | Ator conhecido: "novo trabalho conflita com sua carreira de ator" | Ator com carreira recebe papel | A carreira artística era tratada como emprego concorrente | `compromissos.mesmaCarreiraArtistica`; sem convite de entrada para quem já vive disso | rework105 (CAR-12) | ✅ |
| CAR-13 | Teatro com texto de música ("toca com outras pessoas") | Trajetória teatral | Vocabulário compartilhado entre artes | `estagioDaFrente` por arte; cenas do set só para quem atua; teste detecta texto de uma profissão em outra | rework105 (CAR-13) + sim `textos105` (0 achados) | ✅ |
| UX-16 / CRI-02 | Caminhos confuso; crime sem porta | — | Crime escondido em "Outros caminhos" | Divisão **Submundo** (situação, "procurar um contato", processo, ficha, pena/foragido); ordem das divisões com urgente primeiro | rework96/rework105 UI | ✅ |
| UX-17 | Estudos/Trabalho pouco claros | — | — | Candidaturas em andamento; Histórico e certificados em Estudos; `PainelCena` | rework105 UI | 🟡 (reorganização incremental, não redesenho completo) |
| UX-18 | Ficha de Pessoas longa | — | — | Estados contextuais (chips), mágoa em frase, dimensões do laço, categorias sem fantasmas | rework105 UI | 🟡 (ver pendência P1) |
| UX-19 | Interface de atuação "virava outro sistema" | Ator avançado | Painéis diferentes por estágio | `PainelCena`: A carreira / Em produção / Propostas / O dinheiro | rework105 UI | ✅ |
| UX-20 | Busca "saúde"/"cuidar" só abria atributos | Buscar "saúde" | Correspondência só por lugar | `buscarIntencoes` com ranking e tipo (fazer/ver/acompanhar); intenções tratamento, cuidar_de_alguem, submundo | rework105 UI (UX-20) | ✅ |
| REL-07 | Brigados mandavam mensagem genérica | Brigar feio e avançar o ano | Sem estado persistente do conflito | `sistemas/magoas.ts`: motivo, gravidade, quem começou, tempo, tentativas; estados brigados/magoada/deve_desculpas/confiança abalada/medo/afastados/rompidos/bloqueado/reconciliando; NPC magoado não age como se nada fosse | rework105 (REL-07) | ✅ |
| REL-06 | Sem infidelidade / acordos | — | — | `sistemas/afetos.ts`: flerte comprometido, acordo aberto, voltar à exclusividade, infidelidade do NPC, descoberta e `rom105_infiel` com 4 respostas | rework105 (REL-06) | ✅ |
| REL-08 | Conhecer gente 1×/ano | — | Limite fixo anual | `busca.buscasPossiveisNoAno` (1–4 conforme vida social e agenda), por lugar e pela rotina, retorno decrescente | rework105 (REL-08) | ✅ |
| REL-09 | Ações afetivas mexiam na mesma barra | — | — | Intimidade e compromisso; namoro/casamento firmam compromisso sem confiança máxima; teto de confiança após traição | rework105 (REL-09) | ✅ |
| REL-10 | Agressão do NPC sem efeito real | — | Escalada não aplicava a briga | Agressão acontece de fato (`brigaFisica`), estrago acompanha a gravidade, medo registrado | rework105 + rework10 | ✅ |
| FAM-01 | Fama genérica | — | Um número só | `sistemas/fama.ts`: prestígio profissional × reconhecimento × alcance × redes, leitura na ficha | rework105 | ✅ |
| FAM-02 | 1,4 mi → 2,1 mi sem postar | Celebridade inativa 10 anos | Notoriedade alta virava +465 mil/ano automático; balanço no ano errado | Teto passivo; impulso só quando a fama sobe por um fato; balanço no ano certo, com causas e nº de publicações | rework105 + sim `fama105` | ✅ |
| FAM-03 | Saltos iguais para fatos diferentes | — | — | `somarAoNome` pesado pelo alcance/porte; prêmios e obras pesam pelo alcance | rework105 | ✅ |
| FAM-04 / CAR-14 | Premiado só recebe propostas de iniciante | Ator com 30 anos de carreira | Propostas ignoravam prestígio | `papelPelaTrajetoria`, `conviteDireto` pelo prestígio | rework105 | ✅ |
| EVT-05 | Repetição ("Conflito no set" 3×) | 20 séries × 3 vidas de ator | Sem memória por carreira/entre vidas | Penalidade de repetição, memória entre vidas (3 últimas, ×0,45), continuação contextual ("De novo, como em …") | sim `repeticao105` | 🟡 (ver P3) |
| EVT-07 | Eventos sem identidade | — | — | Cenas de arte com colega, produção e motivo; 14 modelos novos de arte | rework105 | ✅ |
| EVT-06 | Conquista só no histórico | Concurso literário | Fato não era destacado | `conquistasDoAno` primeiro no "Ano que passou" | rework105 | ✅ |
| EVT-08 | Escrita em 2068 e prêmio em 2067 | — | Legado usava a data errada | Cronologia da escrita corrigida em `legado.ts` | rework105 | ✅ |
| CAR-11 | Títulos repetidos como inéditos | — | Título sorteado sem identidade | `producoes.tituloNovo` + `producaoId`, continuações (temporada/sequência/remontagem) | rework105 + `repeticao105` (~800 → 3–6) | ✅ |
| CAR-06 | Proposta só com título/pagamento | — | — | Ficha do papel: tipo, gênero, sinopse, personagem, importância, canal, dedicação, impacto | rework105 | ✅ |
| CAR-09 | Prêmio genérico | — | — | Nome, categoria compatível, edição, obra (`premioDoTrabalho`, `categoriaDoPremio`) | rework105 | ✅ |
| POL-04 | "Desgaste: bastante" sem saída | Militante de base | Desgaste somado sem causa, inclusive para quem não governa | `sistemas/desgastePolitico.ts` com causas, esfriamento por causa; 6 respostas (bases, recolher, propostas, paz no partido, afastar, responder) | rework105 + politica.test | ✅ |
| ECO-04 | Criança sem como comprar | — | — | `sistemas/dinheiroDaCrianca.ts`: pedir, tarefas pagas, brigadeiro com adulto, presente de aniversário; mesada pelo custo local; 8–11 compra o que é da idade | rework105 + coisas.test | ✅ |
| BAL-03 | Atributos iniciais baixos | 150 bebês | Humor do bebê caía no 1º ano | Equilíbrio do humor do bebê bem cuidado (<4 anos); média da idade marcada na ficha | sim `atributos105` (quedas >4: 50 → 14 de 150) | ✅ |
| UX-21 | Textos com "de o", "em a"; microcena repetida | sim `textos105` | Concatenação sem contração | `texto.comPreposicao`; rotação das microcenas; reajuste negado com efeito próprio | `textos105` (0 achados) | ✅ |
| (extra) | Transferência militar pedida se perdia em ano ocupado | — | Pedido consumido sem efeito | Pedido volta a valer | teste novo | ✅ |

## 6. Novos sistemas

`historicoAcademico`, `magoas`, `afetos`, `fama`, `producoes`, `desgastePolitico`, `dinheiroDaCrianca`, `conteudo/acontecimentos105`; UI `HistoricoAcademico.tsx`, `coerencia.css`, Submundo em `DivisoesCaminhos.tsx`, `PainelCena`/`CandidaturasEmAndamento` em `Trabalho.tsx`.

## 7. Compatibilidade de saves

Save continua **v20**. Campos novos todos opcionais (`Educacao.historicoAcademico`, `Matricula.reprovacoes`, `Condicao.procurou`, `Vinculo.magoa/intimidade/compromisso`, `Romance.acordo/infiel`, `VidaPolitica.causasDesgaste`, `Vida.memoriaDeVidas`, `VidaPassada.vistos` — só as 3 últimas vidas guardadas). Saves antigos abrem; PWA confirma save idêntico após atualização.

## 8. Testes adicionados

- `src/motor/__tests__/rework105.test.ts` e `src/ui/__tests__/rework105.test.tsx` (63 novos no total: 1617 → **1680**).

## 9. Testes antigos alterados (nenhuma asserção enfraquecida)

- `rework96.test.tsx`: Caminhos ganhou a divisão Submundo.
- `coisas.test.ts`: premissa ECO-04 (criança agora pode ter dinheiro próprio).
- `rework10.test.ts`, `fix2.test.ts`, `fixPosPlaytestHumano.test.ts`, `politica.test.ts`, `profissao.test.ts`, `rework97.test.ts`: pré-condições ditas explicitamente onde a vida sorteada pela semente mudou de caminho.
- ATR-02 (`rework97`): mediana de cinco sementes contra o mesmo limite.

## 10. Simulações

| simulação | resultado |
|---|---|
| `fama105` (1,4 mi seguidores, fama 90, 10 anos) | ativa +207–291 mil/ano (quase tudo de publicações) vs base +224–425 mil; inativa perde; exposta cresce só no ano do fato |
| `repeticao105` (20 séries × 3 vidas de ator) | cenas repetidas/vida 11 → 3; mesma cena máx. 4× → 2×; títulos repetidos ~800 → 3–6 |
| `saude105` (120 crianças) | procura tardia 22% → 0%; mortes antes dos 18: 13% → 1% (quando procura) |
| `atributos105` (150 bebês) | quedas >4 no 1º ano: 50 → 14 |
| `textos105` (60 vidas) | 0 achados de preposição/repetição |
| `populacao10` (10 perfis × 6 vidas até 85) | 0 travamentos, 0 violações; 31,2 ms/ano (base 31,8) |

## 11. Auditoria visual

`scripts/playtest/rework105.mjs`: 18 cenas × 4 paletas × 1440/820/390/360 + 390×560 → **434 capturas, 0 problemas automáticos** (sobreposição de texto, corte, alvo de toque). Inspeção manual das capturas representativas encontrou um problema de texto na ficha de Pessoas (pendência P1). Montagens em `docs/rework105/` **não** foram geradas.

## 12. Performance

31,2 ms/ano (base 31,8 ms/ano) — sem regressão. Suíte ~412 s.

## 13. Bundles

`motor` **794,2 kB** (limite 800 kB, folga 5,8 kB) · `motor-textos` 738,4 · `Jogo` 584,3 · `motor-dados` 503,0 · `motor-carreira` 341,3 · `motor-vida` 215,2 kB. `build:itch` OK, `smoke:itch` 21/21, PWA offline 36/36.

## 14. Pendências (não resolvidas)

| # | Pendência | Situação |
|---|---|---|
| P1 | **Ficha de Pessoas: "Confiança: abalada" para quem se acabou de conhecer.** A confiança baixa de um conhecido novo aparece como "abalada", como se algo a tivesse quebrado. Deveria ser "ainda pouca" e só virar "abalada" com briga, mágoa ou traição no histórico. Encontrado na inspeção manual; correção **não aplicada** neste pacote. | ⏳ pendente |
| P2 | Scripts de captura: a aba com contador ("Saúde 1") não era encontrada pelo nome exato, e a cena "formado" não chegava a fazer faculdade (vida passiva). Ajustes feitos só na cópia de trabalho, **não commitados**. | ⏳ pendente |
| P3 | Repetição **entre vidas**: dentro da vida caiu muito, mas a sobreposição de cenas principais entre três vidas consecutivas de ator continua ~100% — o catálogo (16 cenas/vida) é pequeno para a regra. Precisa de mais cenas por carreira. | 🟡 parcial |
| P4 | Abandono de tratamento médico não tem consequência própria (só a demora até a procura). | ⏳ pendente |
| P5 | UX-17/UX-18: reorganização incremental de Estudos, Trabalho e da ficha de Pessoas; não houve redesenho completo. | 🟡 parcial |
| P6 | Montagens de capturas em `docs/rework105/` não geradas. | ⏳ pendente |
| P7 | Nada foi testado em dispositivo real; APK não regenerado (por regra do pacote). | ⏳ pendente |
| P8 | Herdadas: valores do conteúdo em unidades BR, NPCs sem relação nunca morrem, paridade de cor do carro, bloco de trajeto <32 px. | ⏳ pendente |

## 15. Riscos conhecidos

- **Bundle `motor` com 5,8 kB de folga**: o próximo sistema grande precisa nascer em chunk próprio.
- Mudanças no começo da vida (humor do bebê, presente de aniversário) deslocam vidas sorteadas por semente: testes novos que dependem de semente devem dizer a pré-condição.
- Memória entre vidas fica no localStorage junto das vidas passadas (limitada às 3 últimas).

## 16. Reservado para o REWORK 11

Especializações das carreiras especiais (protagonismos, agentes, estúdios, contratos, mercados); cerimônias, indicações e troféus; especializações do crime (ladrão, assaltante, traficante, golpista, assassino de aluguel, crime organizado, progressão de influência); sistema de talentos específicos (esporte, arte, política, crime, escrita) — sem determinar destino.
