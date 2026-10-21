# REWORK 10 — UMA VIDA DE POSSIBILIDADES

Liberdade de rotina, interfaces reorganizadas em todas as áreas, relações profundas, o crime como trajetória, jogos
interativos com dinheiro do jogo, muito mais vida acontecendo — e as pendências dos reworks anteriores.

> Cada requisito segue a trilha **Requisito → Implementação → Teste → Evidência → Estado final**. Estados: **Concluído**,
> **Parcial** (o que falta está dito) e **Pendente** (com a razão).

---

## 1. Estado inicial

| | |
|---|---|
| Repositório · branch | `DanielJarude/vida-game` · `claude/fix-pos-rework3-playtest` |
| Commit-base | `674188d` — REWORK 9.7 · Fases C e D (working tree só com `.claude/`) |
| Baseline | **1540/1540** testes em 8,5 min; `tsc` limpo; maior pacote 779,5 kB (limite 800 kB) |
| Catálogo | 104 acontecimentos · 240 decisões · 785 respostas |
| Save | **v20**. O REWORK 10 não muda a versão: todo campo novo é opcional (§26) |

Achados da leitura inicial (cada um virou requisito): a base de futebol era ocupação exclusiva — `compromissos.conflitoComBase`
recusava qualquer curso presencial ou emprego, mesmo de noite (e a mensagem falava de "integral/outra cidade" quando o
motivo era outro); não existia bolsa de atleta; Pessoas era uma lista longa com ações em abas genéricas; namoro e
casamento não mexiam na proximidade; brigar não tinha consequência legal; o crime tinha cinco categorias e nenhuma
escolha dentro do processo (sem fiança, acordo, defesa, recurso, reabilitação) e um bug de remição na saída; não havia
nenhum jogo; as consequências de longo prazo eram `fatos` soltos, sem fila; 37 `dinheiro(c, N)` e 19 `custa(c, N)` com
reais fixos em qualquer país; o seguro-desemprego vinha inteiro; NPCs indiretos nunca morriam.

## 2. Commits

| Commit | Fase | Suíte |
|---|---|---|
| `df352e1` | A — base, faculdade e trabalho pela conta real da agenda; bolsa de atleta | 1554/1554 |
| `99473ab` | B — as seis áreas reorganizadas e a nova aba Pessoas | 1554/1554 |
| `9cfc632` | C — relações profundas: marcos afetivos, conflitos, agressão, autonomia | 1588/1588 (com D) |
| `ac2bc5d` | D — o crime como trajetória e o processo como caminho | 1588/1588 |
| `bbd2169` | E — jogos de azar com dinheiro do jogo: loteria, blackjack, roleta e A Raposa | 1599/1599 |
| `84ae0df` | F — 62 situações novas, respostas que mudam coisas diferentes e ecos | 1607/1607 |
| (este) | G — pendências (SAVE-01, ECO-02, ECO-03, NPC-03, BAL-02, FUT-03), simulações, auditoria visual, montagens, relatório | 1617/1617 |

Cada fase foi validada (suíte inteira + `tsc`) antes da seguinte; os commits foram montados a partir da cópia validada
(o que já era da fase seguinte ficou fora). Sem merge na `main`, sem force push, sem deploy manual, APK não regenerado,
`.claude/` fora dos commits.

## 3. Arquitetura alterada

**Módulos novos do motor** (e o pacote de cada um — nenhum ciclo entre pacotes, nenhum limite aumentado):

| Módulo | O que faz | Pacote |
|---|---|---|
| `sistemas/convivio.ts` | o tempo do ano com as pessoas, o perfil de cada programa, marcos afetivos, a recusa com motivo, a escada do conflito, a briga física, a autonomia dos NPCs | motor-vida |
| `sistemas/tribunal.ts` | o processo como ficha: provas, defesa, acordo, fiança, assumir, cooperar, sentença, multa, confisco, recurso, reabilitação | motor |
| `mundo/justicaPorPais.ts` | o perfil penal de cada país (família jurídica, acordo, colaboração, fiança, severidade, multa, reabilitação, defensoria) | motor |
| `sistemas/margem.ts` + `conteudo/margem.ts` | a vida à margem como carreira: reputação, contatos, trabalhos, atritos, cerco, saídas | motor / motor-acontecimentos |
| `sistemas/apostas.ts` | loteria, blackjack, roleta, A Raposa; limites, autoexclusão, extrato | motor-vida |
| `conteudo/acontecimentos10.ts` | as 62 situações novas | motor-acontecimentos |
| `sistemas/ecos.ts` | as consequências que voltam (fila com janela) | motor-vida |
| `sistemas/seguroDesemprego.ts` | as parcelas mensais | motor-vida |
| `sistemas/indiretos.ts` | a vida e a morte de quem está na vida de quem você conhece | motor-vida |

**Pacote novo** `motor-acontecimentos` (vite `manualChunks`): os conteúdos novos e as peças que todo conteúdo usa
(`base`, `efeitos`, `papeis`, `local`) ficaram ABAIXO do pacote dos textos (que estava a ~50 kB do limite). Eles só
importam sistemas e dados; os textos os importam.

**Interface:** `comum.Subnav`, `comum.CabecaDaArea`, `comum.useEstreito`; `ui/area.ts`; `jogo/Historia.tsx`;
`jogo/Margem.tsx`; `jogo/Apostas.tsx` (sob demanda, pacote próprio de 16 kB); `possibilidades.css`.

**Motor de conteúdo:** papéis `fixo` (`papeis.fixo`): um papel determinístico (ordenado por hash da pessoa e do ano) — o
conteúdo novo não gasta o gerador do ano para escolher quem participa. Os `quando` novos não sorteiam. Isso limita a
perturbação das vidas com semente (§21).

## 4. Correções de agenda (ROT-05)

| Requisito | Implementação | Teste | Evidência | Estado |
|---|---|---|---|---|
| Base + faculdade quando a agenda permite | `compromissos.conflitoComBase` pergunta à agenda (`agenda.baseComONovo`): os horários do clube (`HORARIOS_DA_BASE` de dia, no contraturno; o time amador à noite), o lugar (alojamento em outra cidade), o turno do curso e o descanso. Cabe → entra sem pergunta e guarda o turno; cabe apertado → plano de conciliar com o preço dito; não cabe → o motivo real | `rework10` ROT-05 (direito noturno × base de dia: cabe; medicina integral: horário incompatível; base em outra cidade: lugar; base + curso + trabalho: descanso) | `scripts/sim/agenda10.ts`: combinações de 15–25 anos com save/load; 0 sobreposição de blocos fixos, 0 travamento | **Concluído** |
| Base + trabalho | o mesmo caminho para emprego (meio período, aprendiz, estágio, integral) | `rework10` ROT-05 | idem | **Concluído** |
| Bolsa esportiva | `Matricula.bolsaAtleta` (fração da mensalidade, pedida na faculdade particular por quem treina a sério); `custoDoEstudo` aplica; manutenção: treinar e não ir mal — aviso, depois perda (`processarBolsaDeAtleta`) | `rework10` bolsa (pede, desconto real, aviso, perda) | — | **Concluído** |
| Treino perdido pesa | `esporte.anoNaBase` recebe a presença da agenda: faltas escritas na Linha da Vida e +0,35×faltas no risco de dispensa | `rework10` (aos 15, base + escola + curso com faltas) | — | **Concluído** |
| A mensagem certa | `acoes.matricular` diz o motivo real do conflito | `fix3` 1/1b/3e/A5 reescritos (afirmavam o bug) | — | **Concluído** |
| Sem regressão do travamento estágio + curso (9.7) | — | `rework97` P0 continua passando | populacao10: 0 travamentos (§22) | **Concluído** |

## 5. Nova organização das interfaces (UX-13 / UX-14)

Cada área recebeu avaliação própria (medida em telas de rolagem a 390 px, antes × depois, os mesmos saves) e mudanças de
organização, hierarquia e usabilidade — não só Pessoas. Toda área responde no alto às mesmas perguntas
(`CabecaDaArea`: onde estou · a situação em fatos · o que aconteceu há pouco · o próximo passo), e as páginas longas
viraram partes (`Subnav`, a parte escolhida guardada no `Jogo`).

| Área | Avaliação (antes) | Mudança | Telas a 390 px | Estado |
|---|---|---|---|---|
| **História** | retrato + ano + Linha da Vida inteira numa página; no celular o painel "Agora" nem aparecia | **Agora** (o ano que passou, o que pede você, os últimos anos) \| **Biografia** (a Linha da Vida com os fios); no celular o painel Agora entra na página | 9,5 → **3,1** | **Concluído** |
| **Você** | cinco blocos longos em sequência, índice de âncoras | **Resumo · Saúde · Habilidades · Aparência · No mundo** (todas na página para leitores de tela e testes; uma à vista) | 5,4 → **3,5** | **Concluído** |
| **Pessoas** | listas por grupo; a ficha com as ações em abas genéricas | **álbum** de figurinhas com filtros (Todos/Família/Amor/Amigos/Em conflito/Afastados, cada pessoa uma vez); a cabeça diz quem está em conflito e o **tempo para as pessoas**; a **ficha em três partes** (Agora · Vocês dois · Quem é), as ações nas situações da relação (Conversar, Conviver, Demonstrar afeto, Família e cuidado, Construir planos, Romance, Resolver conflitos, Confrontar, Decisões importantes), o **conflito pendente** e os momentos importantes | 2,6–3,4 → 2,7–3,9 (**um pouco mais longa**: a cabeça e os filtros ocupam o alto; em troca, a ficha mostra as ações por situação em vez de esconder em abas) | **Concluído** |
| **Caminhos** | Início sem "há pouco"; Estudos com o aviso da semana repetido | cabeça; Estudos com o curso e a dedicação primeiro e o aviso dito uma vez; À margem e a Justiça em Outros caminhos | Estudos 4,6 → **3,5** | **Concluído** |
| **Minha Semana** | sem cabeça | cabeça da área (a rotina, o que pesa, o próximo passo) | 3,7 → 3,8 (a cabeça acrescenta; a agenda é a mesma) | **Concluído** |
| **Vida** | Patrimônio com veículos repetidos e todas as ações abertas; Compras em uma coluna no celular | Patrimônio sem veículos repetidos, ações de cada bem a um toque (`objeto__fazer`), "Para usar" até 4; Compras em duas colunas; Apostas como seção | Patrimônio 8,8 → **5,6**; Compras 6,5 → **5,0**; Casa/Cidade/Dinheiro +0,3 a +0,6 (a cabeça da área) | **Concluído** |
| A decisão aberta | a página inteira atrás da decisão | a decisão por cima do essencial | 10,2 → **2,5** | **Concluído** |

Evidência: capturas antes × depois de cada área em `docs/rework10/01…09` (§23). Testes: `ui/rework10` (UX-13: as partes
da História e de Você; UX-14: o filtro "Em conflito", a ficha em três partes, o conflito pendente, as ações negativas em
"Confrontar"); `navegacao`, `fixPosPlaytestHumano`, `fixPosRework4` reescritos com a razão no arquivo.

## 6. Sistema de relacionamentos (REL-01)

| Requisito | Implementação | Teste | Estado |
|---|---|---|---|
| Ações genuinamente diferentes | 26 interações novas (`convivio.INTERACOES_DE_CONVIVIO`): contar a novidade, um segredo, falar do futuro, mudar de cidade, reconhecer o erro, reconstruir a confiança, viajar, acompanhar a consulta, o feriado, juntar a turma, conhecer a família, assumir o namoro, juntar as finanças, marcar o casamento, e as negativas (§8) | `rework10` REL-01 | **Concluído** |
| Custos coerentes (BAL-03) | o **tempo do ano** com as pessoas (`tardesDoAno` pela semana real; `vereditoDeTempo`): uma conversa sempre cabe, uma viagem nem sempre; dinheiro só no que custa (viajar sim, conversar não) | `rework10` (viagem recusada por falta de tempo, conversa não) | **Concluído** |
| Cada programa com perfil | `PERFIS` (risco, para quem é, o que favorece: o cinema acalma, o show é aposta, o jantar é confiança, a viagem é a lembrança) e o gosto da pessoa (`gostosDe`) | `rework10` | **Concluído** |

## 7. Marcos afetivos (REL-02)

| Requisito | Implementação | Teste | Estado |
|---|---|---|---|
| Namoro/morar/noivado/casamento mudam de verdade | `convivio.marcoAfetivo`: proximidade, confiança e envolvimento sobem na medida da relação — **sem apagar** traição e brigas (o que estava ruim continua contando) | `rework10` REL-02 (aceito; relação forte com conflitos antigos) | **Concluído** |
| O não com motivo | `recusaAfetiva`/`vereditoDoPedido`/`naoQuerCasar`: cedo demais, não sente o mesmo, momento ruim, não quer casar — cada um com consequência própria, guardado | `rework10` (namoro recusado, casamento recusado; o motivo persiste) | **Concluído** |

## 8. Ações negativas (REL-03)

Criticar, ofender, acusar, exigir explicações, mentir, espalhar boato, desmarcar, cortar relações, ameaçar, intimidar,
partir para a briga — na categoria **Confrontar** da ficha. Não são decorativas: cada uma mexe em tensão, confiança e
proximidade pelo jeito dos dois (temperamento) e pode subir a **escada** do conflito (§9). Teste: `ui/rework10` (as
ações em Confrontar), `rework10` REL-03. **Concluído.**

## 9. Consequências de conflitos

| Requisito | Implementação | Teste | Estado |
|---|---|---|---|
| Escalar, diminuir, terminar | `convivio.escalar`: desentendimento → discussão → conflito sério → ruptura/agressão, pelo jeito dos dois e pelo peso do assunto; reconciliar, pedir desculpas (sem garantia de perdão), deixar esfriar | `rework10` (discussão leve, conflito grave, reconciliação, retomada de contato) | **Concluído** |
| Agressão com e sem lesão | `convivio.brigaFisica`: lesão pelas regras de `lesoes` (atendimento médico decidido pelo jogador), consequências na escola/trabalho, reputação, medida protetiva, término; a denúncia abre processo (`justica`, categoria `violencia`) | `rework10` (sem lesão, com lesão, atendimento, processo) | **Concluído** |
| Persistência | o conflito pendente fica no vínculo (`vin.conflito`), na ficha e na memória; save/load | `rework10` (memórias após save/load) | **Concluído** |

## 10. Carreira criminosa (CRI-01)

O abstrato foi mantido: nenhuma instrução operacional real — as cenas falam de confiança, risco, dinheiro e gente, nunca
de como fazer.

| Requisito | Implementação | Teste | Estado |
|---|---|---|---|
| Trajetória e progressão | `margem.ts`: reputação no meio, contatos, trabalhos maiores (`ilic_trabalho`: participar, negociar a parte, recusar, sair), atritos (`ilic_atrito`), o cerco (`ilic_cerco`: sumir, advogado, assumir, cooperar) | `rework10` CRI-01 | **Concluído** |
| Corrupção como categoria | a propina aceita (`trab_propina`) entra no caminho; descoberta, processo | `rework10` | **Concluído** |
| Abandonar a trajetória | pedir ajuda, negociar a saída (o preço depende do que se ganhou), parar; a pressão do grupo depois | `rework10`; `crime10` (arrependida) | **Concluído** |
| Não compensar | renda por fora −20%, 65% do ganho chega à conta, confisco/reparação na condenação | `crime10`: patrimônio aos 45 (mediana) honesta 169.712 × carreira 157.649 (p10 −31.180) × fraude 120.081 | **Concluído** |

## 11. Justiça e prisão

| Requisito | Implementação | Teste | Estado |
|---|---|---|---|
| O processo como caminho | `tribunal.ts`: provas, defesa (`jus_defesa`: defensoria × particular com honorários), acordo onde a lei do país tem (`jus_acordo`; o limitado não vira condenação), fiança (`jus_fianca`), assumir, cooperar, sentença pela severidade do país, multa penal, confisco, recurso (`jus_recurso`), reabilitação (`pedirReabilitacao`) | `rework10` CRI-01 (investigada, absolvida, condenada, presa, de volta à vida civil) | **Concluído** |
| O país importa | `justicaPorPais.perfilPenal`: EUA severidade 1,4; nórdicos 0,55; Europa ocidental 0,75; acordo amplo/limitado/não; fiança; reabilitação em anos — **generalização declarada** (§27) | `rework10` | **Concluído** |
| Bug de remição | `soltar` limpa `remicao_*` em toda saída (antes, só a saída "programa") | `rework10` | **Corrigido** |
| Nem inevitável nem impossível | — | `crime10`: carreira 63% presas, fraude 53%, isolada 3%; todas as que saíram voltaram a trabalhar | **Concluído** |
| A tela | `jogo/Margem.tsx` (À margem e a Justiça, em Caminhos · Outros caminhos; ligação a partir de Trabalho) | `ui/rework10` CRI-01 | **Concluído** |

## 12. Regras da loteria

**Seis de Quarenta** (`apostas.ts`): escolhe-se 6 de 40 (ou ao acaso); sorteio de 6 sem reposição, com o gerador do
ano. Prêmios por acertos (3, 4, 5, 6) sobre o bilhete; **RTP 41,3%** (o valor real de uma loteria estatal, dito na
tela: "devolve 41,3% do que se aposta"). Probabilidades exatas: 3 acertos 3,12%; 6 acertos 1 em 3.838.380.
Simulação (`jogos10`): 300 mil bilhetes, 3 acertos em 3,11%; o saldo confere. **Concluído.**

## 13. Regras do blackjack

Seis baralhos embaralhados por mão, a banca para em 17 (S17), blackjack paga 3:2, dobrar com duas cartas, **sem divisão
e sem seguro** (e sem botão para eles — nenhum botão inoperante). A segunda carta da banca fica virada até o fim. Ás vale
1 ou 11. A mão deixada na mesa no fim do ano é perdida (sem exploit de recarregar). Simulação: 200 mil mãos com a
estratégia básica, retorno **99,00%** (vantagem da casa 1,00%); estouro, empate, blackjack e pagamento conferidos em
`rework10` JOG-01. **Concluído.**

## 14. Regras da roleta

Roleta **europeia** (37 casas, um zero). Apostas: vermelho/preto, par/ímpar, baixo/alto (2×), dúzias (3×), número (36×).
A roda gira até o número sorteado (SVG). Simulação: 370 mil giros, retorno 97,61% (teórico 97,30%). **Concluído.**

## 15. Regras do caça-níquel (A Raposa)

Original (não imita marca nenhuma): três rolos de 32 posições — folha 10, sino 10, estrela 5, moeda 4, raposa 3. Paga
três iguais (folha 5×, sino 10×, estrela 20×, moeda 50×, raposa 150×), duas raposas 10× e raposa na primeira posição 1×.
**RTP exato 30144/32768 = 91,99%**, calculado pela tabela e conferido em 1 milhão de giros (91,70%; paga em 16,0% dos
giros, teórico 16,1%). **Sem quase-acerto falso** (os rolos mostram o que saiu), **sem ajuste por saldo**, sem bônus
que prenda. **Concluído.**

**Proteções comuns (JOG-01):** só maiores de 18, só onde o jogo é permitido (`PROIBIDO` por país), nunca preso, só com o
saldo da conta (sem crédito, sem aplicações), **dinheiro do jogo exclusivamente** (nenhum depósito, saque, cripto, prêmio
externo, link ou integração com casas de aposta), limite de perda anual e **autoexclusão** de um ano; dois anos de perdas
pesadas abrem `apo_conversa` (autoexclusão, limite, ajuda, continuar); cada rodada vai ao extrato, mexe no humor e entra
na biografia quando é grande. Teste: `ui/rework10` (menor de idade não vê mesa nenhuma; botões só das regras).

## 16. Expansão de eventos (EVT-01)

`conteudo/acontecimentos10.ts`: **62 entradas** — 54 decisões e 8 acontecimentos que respondem a ecos — cobrindo infância
(o lanche, a olimpíada, o vaso), escola (implicância, o professor que oferece ajuda, a matéria que não entra, o projeto,
a competição), adolescência (a festa proibida, o bico, o amigo em apuros), faculdade (estágio, pesquisa, bolsa de mérito,
o semestre que não fecha, mudar de curso), trabalho (promoção, colega difícil, salário, transferência, o erro, o desvio
que você viu), desemprego (requalificação, aplicativo), amizade (o empréstimo, o reencontro, o segredo), namoro (planos
diferentes, ciúme), casamento (a rotina, o dinheiro da casa), família (pedido de ajuda, dinheiro, a ligação de quem
rompeu, o diagnóstico, morar perto), filhos (a escola chamou, quero largar, a volta para casa), saúde (o sintoma, o
check-up, o médico foi direto), esporte (a prova e o jogo, o técnico novo, a dor antes da final), dinheiro (sociedade,
golpe, fiador), casa (vizinho, reajuste), viagem, vida pública (o jornalista) e velhice (o tempo, os netos, morar
sozinho). Crime e Justiça vieram na Fase D (§10–11).

Regras: só aparece quando a vida está no lugar (a criança não vê evento de trabalho; promoção só com emprego e nunca
depois da aposentadoria; romance só com parceria compatível); papéis `fixo`; `quando` sem sorteio; peso maior para as
situações contextuais (2) do que para as genéricas (1). Teste: `rework10` EVT-01 (ids únicos, papéis fixos, ≥ 2 respostas;
criança × adulto). Evidência: `scripts/sim/acontecimentos10.ts` (200 vidas, 0 erros, §22). **Concluído.**

## 17. Quantidade de eventos e respostas antes/depois

| | Base `674188d` | Fim da Fase E | Fim da Fase F |
|---|---|---|---|
| Acontecimentos | 104 | 104 | **110** |
| Decisões | 240 | 248 | **304** |
| Respostas | 785 | 809 | **971** (+186, +24%) |
| Interações com pessoas | — | +26 (Fase C) | +26 |

## 18. Consequências persistentes (EVT-02 / EVT-03)

Não são flags soltas: `sistemas/ecos.ts` é uma fila com **tipo, pessoa, valor, janela** (`volta`..`ate`) e um "voltou"
(volta uma vez; passada a janela, some sem barulho). Os acontecimentos que respondem só aparecem quando a janela está
aberta **e** a vida está na situação em que o eco faz sentido:

| Eco | Nasce de | Volta como |
|---|---|---|
| favor | emprestar dinheiro, cobrir o amigo | na sua crise (desemprego, aperto): a indicação para uma vaga ou o dinheiro de volta |
| mentor | aceitar a ajuda do professor, a pesquisa | quando você procura trabalho: a carta de recomendação (uma vaga com bônus) |
| recusou | recusar a promoção ou a transferência | o caminho que não foi (o colega que virou chefia; a unidade que cresceu) |
| fiador | assinar por um parente irresponsável | a conta da imobiliária: pagar, parcelar ou exigir (com risco de processo) |
| investiu | entrar na sociedade do amigo | o retorno (1,8×) ou a perda, pelo jeito do amigo; a amizade sente |
| denunciou | levar o desvio ao canal de denúncias | o reconhecimento (aumento) ou o troco (o cargo no corte) |
| mudou_de_curso | largar o curso | a reflexão anos depois |
| cuidou | cuidar de quem adoeceu, ajudar a família | quando é você quem precisa |

Além dos ecos, as respostas têm efeitos distintos e imediatos (dinheiro, tempo, pessoas, saúde, formação, trabalho,
cidade, oportunidades, processo, memórias). **Teste-chave:** `rework10` EVT-02 — em seis cenas (criança, adolescente,
adulto com família e emprego, universitário com nota alta, universitário no aperto, idoso), toda decisão nova que a cena
abre é respondida de todos os jeitos possíveis e **cada resposta deixa uma pegada diferente na vida** (dinheiro, mente,
corpo, vínculos, ecos, formação, trabalho, cidade, fatos, rotinas, oportunidades, frentes; a biografia não conta) — 37+
decisões testadas. O teste achou dois defeitos reais (a transferência encerrava o próprio emprego; "ligar para o banco"
não mudava nada) e um terceiro apareceu na suíte (a promoção oferecida a aposentados) — os três corrigidos.

**Variedade (EVT-03):** os acontecimentos consideram país (preços locais, §20), idade, momento de vida, relações e
atividades; nenhum texto afirma mudança que o motor não faz (a "procura de casa" do reajuste só registra a intenção e
aponta para a imobiliária). **Concluído.**

## 19. Autonomia dos NPCs (NPC-04)

| Requisito | Implementação | Teste | Estado |
|---|---|---|---|
| Recusar por motivos reais | `convivio.recusaDoConvite` (agenda dela, gosto, a relação, o dinheiro), `recusaAfetiva`, `naoQuerCasar` — pela personalidade, confiança, compromissos e história | `rework10` NPC-04 (convite recusado com motivo; parceria que não quer casar) | **Concluído** |
| Tomar iniciativa | `processarConvivio`: a mentira é descoberta, o segredo vaza, o boato chega, a briga esfria, a pessoa se afasta ou **procura as pazes por conta própria** (um chamado); a parceria reage à mudança de cidade (`reacaoDaParceriaAMudanca`) | `rework10` (NPC tomando iniciativa) | **Concluído** |
| Persistir no NPC | recusas, conflitos e decisões ficam no vínculo (`historia`, `conflito`, `fatos`) e sobrevivem ao save | `rework10` (memórias após save/load) | **Concluído** |

## 20. Pendências anteriores corrigidas

| Pendência | Reprodução / causa | Correção | Teste | Evidência | Estado |
|---|---|---|---|---|---|
| **SAVE-01** · a altura de quem já existe | Desde o 9.7 a estatura era derivada sem estado (`modalidades.estaturaAdulta`, da semente): mudar a fórmula mudou a altura de personagens existentes ao abrir o save | `Corpo.estaturaAdulta` (opcional) guardada quando fica estabelecida: ao abrir o save e a cada ano (`fixarEstatura`), vale a altura que a Linha da Vida **já disse** ("Medem a altura na entrada (1,71 m, a sua)", de qualquer versão, convertida para a adulta pela idade); sem nada escrito, a da fórmula a partir dos 17. Depois disso, nenhuma fórmula a muda | `rework10` SAVE-01 (a dita na seletiva fica; o adulto guarda a de agora e mudar a predisposição não mexe; a criança não fica presa e fixa aos 17) | — | **Concluído** para o que estava escrito; **limite**: um save anterior ao 9.7 cuja altura nunca foi escrita fica com a do 9.7 (é a que o jogador já via desde então; não há marca de versão para recuperar a anterior) |
| **ECO-02** · reais fixos em qualquer país | 37 `dinheiro(c, N)`, 19 `custa(c, N)` e textos com `fmt(N)` em valores de uma cidade brasileira média | `efeitos.local(c, x)`: o valor no **custo de vida** de onde se mora (`economiaLocal(...).custo`), não câmbio; aplicado a 100 pontos em 17 arquivos de conteúdo (cobrar, pagar, o preço dito no texto e na consequência, o limiar do saldo); o conteúdo novo (Fase F) nasceu assim. Ficaram de fora os valores já locais (festa e casamento por `cabeFesta`, saúde por `redeDeSaude`, mensalidades por `economiaLocal`) | `rework10` ECO-02 (Recife, São Paulo, EUA e Nigéria: quatro valores diferentes; o Recife perto do escrito); `rework10` EVT-02 (o mesmo pedido em Recife × São Paulo) | — | **Concluído** |
| **ECO-03** · seguro-desemprego inteiro | A demissão pagava todas as parcelas de uma vez (`trabalho.demissao`) | A rescisão (FGTS/indenização) continua de uma vez; o seguro vira `Trabalho.seguroDesemprego` (parcela, restantes, próxima): `sistemas/seguroDesemprego` paga a cada ano as parcelas cujos meses passaram (a primeira no mês seguinte à demissão — no meio do ano, como o salário até a demissão), cada lote no extrato; um **emprego formal novo encerra** as que faltam (e a Linha da Vida diz quantas vieram); bico e trabalho por conta não encerram. A tela de Trabalho mostra quantas faltam | `rework10` ECO-03 (lotes e extrato; o emprego formal encerra, o bico não; a demissão real na França, 18 meses: 6 no ano, o resto no seguinte) | captura `13-seguro` | **Concluído** (o pagamento continua anual no motor, em lotes mensais contados; um extrato mês a mês não existe) |
| **NPC-03** · quem não tem vínculo não morre | `processarMortes` percorre só os vínculos: o cônjuge de um irmão, a namorada de um filho, os pais da parceria ficavam vivos para sempre | `sistemas/indiretos`: a cada ano, só quem está **ligado** a alguém vivo da sua vida (parceria ou filiação de um vínculo) passa pelo mesmo corpo de NPC; morrendo, a parceria acaba, quem ficou entra em luto (o "estar junto" abre), a história de vocês lembra, e a Linha da Vida conta (biografia se a pessoa é próxima). Sorteio derivado: o gerador da vida não anda; ninguém fora dessa rede é processado | `rework10` NPC-03 (a cunhada entra, o desconhecido não; morre de velhice e a perda chega ao irmão; o gerador não anda) | populacao10: invariante "NPC vivo com mais de 115 anos" (§22) | **Concluído** |
| **BAL-02** · estudo dedicado + treino intenso | Medido antes de mexer (`scripts/sim/rotina10.ts`, 100 adolescentes por linha, 13 → 17) | Nenhuma mudança necessária: rotinas equilibradas não adoecem | — | estresse médio 21–24 em todas as rotinas (só estudo, estudo dedicado, + esporte regular, + esporte a sério, base + estudo dedicado); **0%** dos anos com estresse ≥ 70; lesões 0,01–0,13 por pessoa em 4 anos | **Verificado** (sem excesso) |
| **FUT-03** · o futebol profissional adulto | Medido: entrar na base aos 14 com técnica 55/65/75 → 9/11/17% profissionais até os 22; pelo amador aos 17, 60/75 → 1/10%. O bom jogador saía um ano em cada três (dispensa 0,4 − (h−72)/40) e, abaixo de 79, não havia contrato nenhum | Dispensa mais pelo nível (0,38 − (h−72)/28: o fraco sai antes, o bom fica mais) e, no futebol, um **contrato tardio** para quem chega ao fim da base até 5 pontos abaixo da régua (chance 3–20%, divisão de baixo, o clube do tamanho do jogo dele) | suíte (os testes de base e contrato continuam passando) | depois: 10/14/19% (base) e 2/20% (amador) — a porta melhorou para quem é bom e continua estreita | **Concluído** (calibração) |

## 21. Testes

| | |
|---|---|
| Suíte completa (Node 22, cópia em disco Linux, `--maxWorkers=3`) | **1617/1617** em 6,0 min (baseline 1540/1540; +77 testes) |
| `tsc --noEmit` | limpo |
| Testes novos | `motor/__tests__/rework10.test.ts` (68: agenda e bolsa, marcos afetivos, conflitos e agressão, autonomia, trajetória e processo, as quatro mesas, acontecimentos e ecos, SAVE-01, ECO-02, ECO-03, NPC-03) · `ui/__tests__/rework10.test.tsx` (9: História e Você em partes, o álbum e a ficha, a tela da margem, as mesas) |
| Testes antigos reescritos (com a razão no arquivo) | `fix3` 1/1b/3e/A5 (afirmavam o bug da base exclusiva); `navegacao`, `fixPosPlaytestHumano`, `fixPosRework4` (a navegação nova); pré-condições ditas em `meiaidade`, `att3`, `fixPosPlaytestHumano` D (o catálogo maior muda o sorteio das vidas com semente; o convite pode ser recusado). Nenhum teste foi enfraquecido para passar: onde a premissa mudou, a premissa foi dita |

Cobertura pedida (§16–19 do pedido): namoro aceito/recusado, casamento aceito/recusado, relação forte com conflitos
antigos, reconciliação, mentira descoberta, discussão leve, conflito grave, agressão sem e com lesão, atendimento,
separação, retomada, NPC recusando e tomando iniciativa, memórias após save/load; crime: nunca, isolado, reincidente,
abandono, investigada, absolvida, condenada, presa, de volta à vida civil (com save/load); jogos: milhares de mãos,
frequências da roleta, chances da loteria, distribuição e RTP do caça-níquel, saldo insuficiente, menor de idade, mão
deixada na mesa e save/load; agenda: base + faculdade, + bolsa, + trabalho, + faculdade + trabalho, profissional +
faculdade, trabalho + curso, estágio + curso (`rework97` P0), treino + lesão (`fixPosRework2`, `riquezaCondicionamento`),
horários conflitantes e compatíveis, deslocamento (alojamento em outra cidade).

## 22. Simulações

| Simulação | Amostra | Resultado |
|---|---|---|
| `populacao10.ts` — os 10 perfis (§20 do pedido) | **2.000 vidas** até 85 (200 por perfil), BR/PT/US/AR/JP/NG/DE/FR, 5 classes, 2 gêneros — 132 mil anos vividos | **0 travamentos, 0 violações de invariante** (atributo fora de 0..100, conta não finita, NPC vivo com mais de 115 anos) |
| `acontecimentos10.ts` | 200 vidas até 80, 9 estratégias | 0 erros; 115,6 acontecimentos e 45,8 distintos por vida; o mais repetido numa vida é `cnh_prova` (a estratégia tenta a CNH todo ano — artefato do agente) |
| `crime10.ts` | 150 vidas, 5 trajetórias | §10–11 |
| `jogos10.ts` | 200 mil mãos, 370 mil giros, 1 milhão de giros, 300 mil bilhetes | §12–15; saldos conferem |
| `rotina10.ts` | 100 vidas por linha, antes × depois | §20 (BAL-02, FUT-03) |
| `agenda10.ts` | combinações de 15–25 anos com save/load | §4 |

**Os dez perfis** (mediana; p10 · mediana · p90 nos arquivos da simulação):

| | acadêmico | trabalhador | atleta | familiar | social | criminoso | financeiro | equilibrado | arriscado | aleatório |
|---|---|---|---|---|---|---|---|---|---|---|
| salário aos 40 | 7.410 | 3.480 | 8.320 | 8.590 | 7.800 | 3.050 | 3.280 | 8.450 | 6.690 | 7.000 |
| patrimônio aos 65 | 2,14 mi | 2,08 mi | 1,53 mi | 2,04 mi | 1,03 mi | 1,65 mi | 1,31 mi | 2,40 mi | 0,43 mi | 0,85 mi |
| saúde aos 50 | 70 | 68 | 73 | 72 | 42 | 68 | 69 | 47 | 39 | 54 |
| felicidade aos 50 | 58 | 47 | 61 | 73 | 62 | 47 | 47 | 67 | 66 | 64 |
| pessoas próximas aos 50 | 4 | 3 | 5 | 7 | 9 | 3 | 3 | 9 | 7 | 7 |
| memórias com pessoas aos 50 | 76 | 64 | 102 | 106 | 122 | 67 | 64 | 112 | 104 | 102 |
| superior aos 30 | 100% | 0% | 92% | 98% | 92% | 0% | 0% | 93% | 0% | 96% |
| maior nível de carreira | 3 | 2 | 4 | 5 | 4 | 1 | 1 | 5 | 4 | 3 |
| com parceria aos 40 | 29% | 10% | 58% | 73% | 76% | 25% | 11% | 65% | 65% | 72% |
| com antecedentes | 0% | 15% | 16% | 3% | 8% | **27%** | 0% | 2% | 3% | 1% |
| passou pela prisão | 0% | 8% | 8% | 2% | 4% | **18%** | 0% | 1% | 1% | 1% |
| atleta profissional | 0% | 0% | **16%** | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| idade ao morrer | 71 | 70 | 73 | 74 | 62 | 68 | 71 | 63 | 61 | 66 |
| situações do REWORK 10 | 2 | 5 | 2 | 3 | 2 | 4 | 5 | 2 | 2 | 2 |
| saldo das apostas | — | — | — | — | — | — | — | — | **−9.050** (p10 −47.000, p90 +35.500; apostado 142.500) | — |

Leitura: os perfis **não** terminam iguais — estudo e carreira pesam no salário; relações no círculo e nas memórias;
o crime em ficha e prisão (nem inevitável, nem impossível: 18%); quem joga perde na mediana o que a casa cobra (~8% do
apostado), e uma minoria ganha (variância real, sem ajuste); a noite e o cassino custam saúde e anos. **Diversidade de
respostas:** em todos os perfis, das situações vistas 4+ vezes, 63–99% tiveram 2+ respostas diferentes; nenhuma resposta
passa de 13,3% das decisões de um perfil. **Ecos** voltam pouco (p90 0–1 por vida): são raros por desenho (nascem de
escolhas específicas e só voltam na situação certa).

## 23. Capturas

Auditoria visual (`scripts/playtest/rework10.mjs`, build de produção): **38 cenas** — as seis áreas e suas seções,
fichas de Pessoas (com conflito), a decisão aberta e uma situação nova de quatro respostas, À margem e a Justiça, as
quatro mesas (com uma rodada jogada) e o balanço de quem aposta, Estudos, Outros caminhos (futebol), a agenda, a criação,
o seguro em parcelas — nas **quatro paletas** × **1440, 820, 390, 360 e 390×560**: **912 capturas**. Medição automática
(texto sobre texto, rolagem horizontal, bordas estouradas, contraste < 3:1, o "avançar" à mão, alvos de toque): **10
achados, todos o mesmo** — as bolas sorteadas da loteria nas paletas escuras tinham só gradiente de fundo; corrigido com a
cor sólida por baixo e recapturado: **0**. Além da medição, as capturas foram olhadas uma a uma nas cenas novas
(legibilidade, hierarquia, organização).

Montagens em `docs/rework10/`:
`01-historia` · `02-voce` · `03-pessoas` · `04-pessoas-ficha` · `05-caminhos` · `06-semana` · `07-vida` · `08-vida-compras`
(cada área antes × depois, 1440 e celular, mesmos saves) · `09-momento` · `10-margem` · `11-mesas` · `12-mesas-celular` ·
`13-seguro` · `14-paletas` · `15-paletas-mesas` · `16-tamanhos`.

## 24. Performance

- **Tempo do ano** (`tamanho9.ts`, 20 vidas até os 75, máquina livre, em sequência): **5,7 ms/ano depois × 5,4 antes**
  (+0,3 ms: convívio, apostas, ecos, indiretos, seguro e 62 situações a mais no catálogo); save médio 100,3 kB × 102,5 kB.
- Com agentes que agem todo ano (populacao10, 4 processos em paralelo): 21–38 ms/ano por processo.
- NPCs indiretos: só os ligados a alguém da vida entram no ano (sem crescimento com o mundo).

## 25. Bundle

| Pacote | Antes (`674188d`) | Depois |
|---|---|---|
| motor | 779,5 kB | **784,2 kB** (maior pacote; limite 800 kB **não alterado**) |
| motor-textos | 738,2 | 735,5 |
| Jogo (interface) | 543,2 | 560,3 |
| motor-dados | 475,8 | 477,9 |
| motor-carreira | 303,5 | 319,9 |
| motor-vida | 150,7 | 204,6 |
| motor-conteudo | 136,4 | 137,4 |
| motor-acontecimentos (novo) | — | 93,9 |
| Apostas (sob demanda, novo) | — | ~16 |

Nenhuma dependência nova. `build:itch` + `smoke:itch`: **21/21**. PWA offline (`scripts/pwa/offline.mjs`): **36/36**.
As quatro paletas e a integração itch.io preservadas.

## 26. Compatibilidade de saves

Save continua **v20**; todo campo novo é opcional: `Vida.ecos`, `Vida.apostas`, `Matricula.bolsaAtleta`,
`Corpo.estaturaAdulta`, `Trabalho.seguroDesemprego`, os campos de `Envolvimento` e de `Justica` (provas, defesa, acordo,
fiança, recurso, multa, reabilitação), `Vinculo.conflito`. Abrir e salvar sem jogar devolve o mesmo save (os testes de
ida e volta da suíte); a estatura escrita na Linha da Vida é a única coisa gravada ao abrir. Saves antigos jogam igual:
sem ecos, sem apostas, sem seguro pendente (quem foi demitido antes recebeu tudo de uma vez, como era).

## 27. Riscos e limitações

- **Sementes deslocadas:** o catálogo maior e as regras novas mudam o caminho de vidas com a mesma semente. Saves
  existentes carregam iguais; três testes antigos tiveram a pré-condição dita.
- **Perfil penal por país** é generalização (família jurídica, severidade, acordo, fiança): não é consultoria jurídica.
- **Seguro-desemprego:** pago em lotes mensais contados no fechamento do ano (o motor é anual); não há extrato mês a mês.
  A suspensão por aposentadoria não foi modelada.
- **SAVE-01:** um save anterior ao 9.7 cuja altura nunca foi escrita fica com a do 9.7 (sem marca de versão para saber a
  anterior).
- **Ecos** são raros nas simulações (p90 0–1 por vida); as situações novas aparecem 2–5 vezes por vida — são contextuais
  (faculdade, base, desemprego) e os agentes nem sempre chegam a esses lugares.
- **Pessoas, Minha Semana e parte de Vida** ficaram um pouco mais longas no celular (+0,1 a +0,6 tela) pela cabeça da
  área — escolha consciente: o alto da página passou a dizer a situação.
- O maior pacote (`motor`, 784,2 kB) tem 15,8 kB de folga: o próximo sistema grande deve ir para um pacote próprio.
- Artefato de simulação: os agentes tentam a CNH todo ano (`cnh_prova` é a resposta mais frequente em vários perfis).
