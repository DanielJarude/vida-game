# REWORK 12.3 — Carreiras vivas, Submundo profundo, corrupção, Justiça e narrativa dinâmica · relatório

__ESTADO_PUBLICACAO__

## 1. Branch e commits

Branch `claude/rework12.3-carreiras-submundo-justica`, criada a partir de `main` em `3a768d3` (o 12.25 publicado).

__COMMITS__

## 2. Estado encontrado do 12.25

- **Publicado**: `main` e a produção (`claude/fix-pos-rework3-playtest`) em `db05778`; o relatório do 12.25 em `3a768d3`
  (só na `main`). Nada do 12.25 estava pendente numa branch.
- Save v20 (opcionais); `normalizarRework125` idempotente. Suíte do 12.25: 2.042 testes.
- Auditoria por requisito (o que este pacote encontrou):

| Requisito | Situação encontrada | O que foi feito |
|---|---|---|
| Várias facções (A1) | existente com bug de regra: bloqueava duas do mesmo ramo; nenhuma consequência entre rivais; nada secreto | consequências, vínculo secreto, cobrança das duas |
| Relações entre facções (A2) | incompleto: só aliada/rival/nada, 7% de troca aleatória | 8 estados com evolução por estado, força e território |
| Hierarquia (A3) | existente e funcional (7 níveis, ações por posto) | o que cada posto permite dito; reunião, trégua, cooperação |
| Disputas (A4) | existente (disputa e sucessão); o "racha" só tirava força | racha que funda organização rival |
| Mudança de país (A6) | não implementado (vínculo seguia igual em qualquer lugar) | alcance e distância |
| Contratante ocasional (B2) | não implementado | pedidos por fora, sem carreira |
| Lojas clandestinas (B4) | mercado por fora em Vida → Compras | movido para o Submundo |
| Suborno de juiz (C1/C2) | não implementado | implementado |
| NPCs judiciais (C3) | não implementado (juiz = número) | juiz, promotor, advogado, defensor com nome e história |
| Advogado indisponível (C5) | **bug** | corrigido (§5) |
| Defensoria narrada (C6) | **bug** | corrigido (§5) |
| Dinheiro ilícito (C8) | incompleto: a Justiça conhecia todo o ganho | conhecimento pelas provas, bloqueio, "pôr em ordem" |
| Mensagens do crime (D) | **genéricas** ("Deu certo. X rendeu Y…"; "X falou de dinheiro… A conversa aproximou vocês") | narrativa do estado (§6) |
| Equipe no trabalho (E1) | incompleto: a chefia era um nome novo a cada cena | equipe persistente |
| Militar (E3) | existente e funcional (praça × oficial, idade e escolaridade por cargo) | — (auditado) |
| Concursos (E10) | existente (edital, preparo, teto, reserva, devolutiva) sem vagas/inscritos/classificação | edital com vagas, concorrência do ano, classificação, fila da reserva, requisitos à vista |
| "Primeira palavra" (F1) | **bug** | corrigido (§5) |
| Casamento forçado (G1) | **bug** | corrigido (§5) |

## 3. Funcionalidades reaproveitadas

Tudo do 12.25 continua em uso, sem sistema paralelo: `ilicito`/`margem`/`submundo`/`ramos` (o envolvimento),
`carreiraCriminal` (patamares), `encomendas`, `redeCriminal` (fichas dos contatos), `faccoes` (OrgViva — os estados entre
organizações moram nela; as listas `aliadas`/`rivais` continuam, derivadas), `defesa`/`tribunal`/`justica` (o processo),
`porFora` (o extrato), `paralelos` (as ofertas), `concurso` (o processo do concurso), `trabalho`/`situacaoProfissional`,
`conteudo/motor` (a fila do ano, o teto de decisões).

## 4. Funcionalidades novas

| Módulo | O quê |
|---|---|
| `sistemas/relatoDoCrime.ts` | o relato: contexto (quem propôs, o que há entre vocês, quem passou o pedido), o seu lugar pelo patamar, reações pelo temperamento e pela confiança, reação da organização pelo estilo, consequências medidas antes/depois, variantes sem repetição (memória de 3 anos), o resumo do ano por fora, a investigação com causa, as conversas tiradas do estado |
| `sistemas/atoresJudiciais.ts` | juízes, promotores, advogados, defensores por comarca, com integridade, rigor e história; reencontro |
| `sistemas/corrupcaoJudicial.ts` | a tentativa de corromper o processo; a descoberta anos depois; o dinheiro "posto em ordem" |
| `sistemas/servicosPorFora.ts` | o contratante ocasional |
| `sistemas/equipe.ts` | a equipe do emprego, o conflito, as sanções administrativas |
| `conteudo/acontecimentos123.ts` | o conflito no trabalho e 15 acontecimentos da vida comum |
| em `faccoes.ts` | estados entre organizações, dupla lealdade, alcance/distância, racha, reunião, trégua, cooperação, poderes do posto |
| em `concurso.ts` | o edital (vagas, inscritos, concorrência do ano, modalidade), classificação, fila da reserva |

## 5. Bugs corrigidos e causa encontrada

| Bug | Causa real | Correção |
|---|---|---|
| **F1** "A primeira palavra" repetindo para a mesma criança | o marco do filho morava nos fatos de quem joga (`palavra_<id>`), que a sucessão zera; e o da própria pessoa era só "uma vez por vida". A criança pequena que passava a ser jogada (o 12.05 permite) vivia de novo o marco que a vida anterior já tinha narrado | marcos de uma vez só **por pessoa** (`Pessoa.marcos`/`Personagem.marcos`, campo `marco` no conteúdo), que passam junto na sucessão; normalização de saves antigos (fatos dos filhos, infância de quem joga, e quem continuou a história já dentro da janela) |
| **G1** casamento forçado | um ano depois do "sim", `rom_casamento` abria com todas as opções casando | "adiar" (a pergunta só volta depois de 12 meses; adiar de novo pesa) e "desfazer o noivado" (o namoro continua) |
| **C5** advogado particular indisponível com dinheiro | `abrirProcesso` contratava e pagava um advogado sozinho para quem tinha ≥ 18 mil; a opção "contratar" ficava **escondida** (`disponivel: false`) na pergunta da defesa | o jogo não contrata nada sozinho; contratar aparece sempre para quem tem a defesa pública — bloqueado com preço e o que se tem quando falta |
| **C6** defensoria narrada indevidamente | com o advogado já pago, a única escolha que sobrava era "Ficar com a Defensoria", cujo texto narrava uma defensora enquanto o estado continuava "particular"; e o texto da abertura dizia "Defensoria Pública" em qualquer país | escolher a pública muda a defesa de verdade; "manter" para quem já tem advogado (da organização ou de antes); `pagaPor` registra quem paga; a ficha diz quem defende, quem paga e quem julga |
| Encontrado: provas sempre fracas | `abrirProcesso` zerava a exposição **antes** de o tribunal medir as provas | a exposição de antes é guardada e pesa nas provas — recalibrado no simulador (§12) |
| Encontrado: aplicação em branco no pacote de produção | o módulo novo dos juízes caía num pacote acima do da Justiça: ciclo entre pacotes, `PATRIMONIO_NO_MES` lido antes de existir | o módulo vai para o mesmo pacote da Justiça; o smoke de produção pegou (os testes de unidade não pegam isso) |
| Encontrado: conteúdo pressupondo português | "redação" num acontecimento novo, numa vida no Japão | texto neutro |

## 6. Narrativa criminal

- **Contexto → resultado → reação → consequências**: o texto de cada trabalho diz quem propôs (com o histórico: "Felipe, que
  já tinha trabalhado com você", "Noah, que falou o seu nome em 2056", "a quem você ainda deve um favor"), quem passou o
  pedido da organização (um nome do quadro acima de você), o seu lugar (novato vai junto; experiente já conhece; influente
  coordena; liderança manda os seus), o desfecho (inteiro, **pela metade**, **melhor que o combinado**, ou um de sete
  fracassos com causa), a reação de quem estava junto (leal, desconfiado, pragmático, esquentado, caloroso — do
  temperamento e da confiança reais) ou da organização (pelo estilo: família, facção, rede, círculo, coletivo, turma,
  sindicato). Embaixo, as consequências **medidas** (dinheiro, confiança de cada um, lealdade, posto, exposição, dívida).
- **O ano por fora** numa linha: o que o de sempre rendeu, quantos trabalhos, quantos deram certo, com quem.
- **A investigação com causa** (a traição recente de um contato, o trabalho que deixou rastro, o ramo) — e dizendo que
  investigação não é processo.
- **As conversas** com os contatos tiradas do estado: o trabalho que fizeram juntos, a notícia da organização dele, a sua
  investigação, a dívida, a briga entre organizações; o "do que ele quer da vida" só na falta disso, na voz dele.
- **Sem repetição**: variantes com memória de 36 meses por chave; o assunto da conversa não repete o da última.
- **Coerência** (D9): texto e números saem do mesmo estado; o simulador confere sucesso sem dinheiro e fracasso com frase de
  sucesso.

**Exemplos reais** (do simulador `scripts/sim/narrativa123.ts`, vidas longas; texto · consequências medidas):

- "Felipe chamou você para um serviço pequeno para um conhecido. Você foi junto, como o mais novo. Ninguém viu, ninguém
  perguntou: R$ 1.000 no seu bolso. Felipe estava eufórico. Você teve de lembrar que ninguém precisava saber. Foi a primeira
  encomenda cumprida: o seu nome passou a circular." ⟶ *Entrou R$ 1.000 por fora. · Confiança de Felipe em você: 37 → 41. ·
  Mais gente sabe do que você faz (exposição 26 → 28).*
- "Felipe, que já tinha trabalhado com você, chamou você para guardar e passar adiante uma mercadoria de origem ruim. Você
  foi com a calma de quem já fez isso antes. Deu errado. Nada entrou, e ainda foi preciso cobrir R$ 2.400 do que se perdeu.
  Felipe bateu a porta do carro e sumiu por uma semana." ⟶ *Saiu R$ 2.400.*
- "Noah, que falou o seu nome em 2056, trouxe a proposta: uma assinatura onde não devia. Você foi com a calma de quem já fez
  isso antes. Deu errado — mas Gael, que estava por perto, gostou de como você segurou a situação. Um contato novo. Noah
  assumiu a parte dele no erro. \"Acontece.\""
- "O sindicato Lima tinha um pedido — um recado da organização —, e Jefferson Marques (chefia de equipe) o passou a você.
  Você foi com a calma de quem já fez isso antes. Foi limpo. A sua parte: R$ 9.000. O sindicato lembra de quem entrega." ⟶
  *Entrou R$ 9.000 por fora. · O quanto o sindicato Lima confia em você: 65 → 70.*
- (liderança) "O sindicato Lima tinha um pedido — um recado da organização —, e Diego Machado (diretoria) o passou a você.
  Você não foi: mandou dois dos seus e acompanhou de longe. Foi limpo. A sua parte: R$ 32 mil. Thiago Rocha, que manda ali,
  anotou o seu nome. Ali, isso vale mais que dinheiro."
- (conversa) "Emerson perguntou da investigação, baixinho, e disse para você não mudar de rotina agora. Antes de ir embora,
  Emerson pediu uma coisa a você."
- (conversa) "Levi disse que, quando você precisar, é só chamar: a dívida é dele. No fim, Levi trouxe um trabalho: um
  serviço grande, com gente de fora (está em Encomendas)."
- (o ano) "Por fora, em 2064: o de sempre rendeu R$ 17 mil."

**Medido** (5 perfis × 6 vidas × 20 anos): **1.180 textos de ação, 92% distintos** (no 12.25, a mesma medição dava 27%:
"X falou de dinheiro… A conversa aproximou vocês" repetia por pessoa); a mesma frase exata na mesma vida em menos de 3
anos: 52 (de 1.180); **0** sucessos sem dinheiro; **0** fracassos com frase de sucesso; 404 trabalhos (337 deram certo).

## 7. Corrupção judicial (C1–C4, C8)

- Só existe com um **caminho até quem julga**: um contato do meio de confiança (intermediário, informante, quem manda, com
  confiança ≥ 45), uma organização de que se é de dentro (posto ≥ 2) com força, ou o próprio peso (nome público, mandato,
  fortuna). Sem caminho, a tela diz o que falta. Uma tentativa por processo; precisa de dinheiro (pelo lugar, pela
  gravidade e pelo que se tem).
- Desfechos: o golpe do intermediário; a recusa (o dinheiro volta em parte); a recusa com **denúncia** (provas +15 e um
  processo por corrupção quando o atual terminar); o aceite **parcial** (+8 pontos de chance) ou **total** (+15 a +30) —
  nunca acima de 85% (as provas e o teto continuam).
- O aceito fica como **risco que cai com os anos** (10–15% ao ano, × 0,82): vindo à tona, o juiz é afastado, a absolvição
  comprada é **anulada** (o processo volta), o emprego pode ir junto, e abre o processo por corrupção.
- Juízes são pessoas: a maioria íntegra (70–98), uma minoria vulnerável (sem ranking de países: a variação é por comarca e
  pessoa). Quem já denunciou você não aceita nada; quem já aceitou fica mais vulnerável.
- Na tela, "Por fora dos autos" é um bloco separado da defesa, com o selo **ilegal** e a frase "Contratar advogado é outra
  coisa, e é legal".
- **C8**: a Justiça conhece o que as provas mostram (35% a 95% do ganho); o bloqueio de valores no começo de processo grave
  (volta na absolvição, paga o confisco na condenação, com linha no extrato); "pôr o dinheiro em ordem" (ilegal, abstrato,
  custa 20%, deixa rastro de papel) faz a parte posta em ordem aparecer menos — não some.

## 8. Facções e hierarquias

- **Várias afiliações** (A1): sem a proibição do mesmo ramo; entre aliadas, ser de duas é ponte (+lealdade); entre rivais,
  aberto, cada ano custa lealdade e a cena `sub123_dupla` cobra lado (ficar com uma — a outra lembra como traição —,
  negar, ou propor ser a ponte, que pode virar cooperação); o **vínculo secreto** acumula desconfiança e um dia vem à tona.
- **Relações que andam sozinhas** (A2): aliança, cooperação, neutralidade, concorrência, rivalidade, trégua, conflito,
  ruptura — com probabilidades pelo estado, pela força e pela disputa do mesmo território; o conflito custa força e traz
  pressão; quem é de dentro de um lado fica sabendo (e, se não está na moita, mais exposto).
- **O posto permite** (A3): a ficha lista o que cada nível libera; reuniões (nível 2+), trégua e negócio com outras
  organizações (nível 5+), além do comando que já existia.
- **Racha** (A4): quem perde a disputa num racha sai com gente e funda uma organização rival; quem o apoiou vira aliado dela.
- **Distância** (A6): alcance pela força e pelo estilo (só a cidade, a região, o país, fora do país); de longe, o vínculo
  continua com metade da parte; fora do alcance, fica parado (não rende, a lealdade esfria) — **nunca é apagado**.

## 9. Carreiras

- **Equipe** (E1): chefia, colegas, quem responde a você (nível 3+), às vezes mentor (o desempenho sobe) e rival (o clima
  pesa); a chefia muda sem promoção automática; colegas saem e viram ex-colegas; o reencontro com alguém da escola, da
  faculdade ou de outro emprego (F5). A cena antiga da chefia nova passou a trocar a chefia **da equipe**.
- **Conflito** (E6): a tensão alta abre `trab123_conflito` — conversar, negociar, RH/ouvidoria, transferência, sindicato ou
  advogado trabalhista, pedir demissão, aguentar. Nenhuma saída por fora.
- **Sanções administrativas** (E8): advertência e suspensão, registradas no emprego e ditas como não-judiciais.
- **Concursos** (E10): edital com vagas e inscritos (municipal, estadual, federal; processo seletivo para os temporários),
  concorrência que muda de um ano para outro e mexe na chance (0,72× a 1,35×, teto 60%), classificação (dentro das vagas,
  reserva, fora), aprovação que diz "falta a convocação e a posse", chamada da reserva pela posição, editais fora do perfil
  listados com o requisito que falta. A remuneração dos cargos públicos não foi alterada (auditoria em §16).

## 10. Memória narrativa e vida comum

- Marcos de uma vez só por pessoa (F1/F2).
- 15 acontecimentos novos nas oito áreas (amizade rompida, primeiro dinheiro próprio, a dívida antiga lembrada anos depois,
  os pais que não dão mais conta, o professor que marcou — e o reencontro com ele décadas depois —, o trabalho em grupo, a
  obra do vizinho, o mutirão para quem participa da comunidade, o golpe do telefone, o empréstimo ao amigo — e se ele
  devolveu —, o exame de rotina, o parceiro que quer mudar de hábitos, o festival). Sorteio próprio (um gerador derivado):
  as vidas de antes não mudam de sequência até um deles acontecer; **decisão nova só num ano que ainda não teve nenhuma**
  (F6: a vida comum não enche o ano).

## 11. Saves

- Versão continua **20**; tudo novo é opcional. `normalizarRework123` (idempotente) cria os marcos a partir dos fatos e da
  infância registrada. Testado: idempotência, ida e volta pelo save das tentativas de corrupção, saves com sucessão.
- **46 saves de QA** do 11, 11.5, 12, 12.2 e 12.25 (`scripts/sim/saves125.ts`): todos abrem, salvar de novo dá o mesmo JSON,
  vivem três anos e conciliam o extrato (**46/46, 0 falhas**). A auditoria visual também abriu os saves do 12.25.

## 12. Testes e simulações

| Verificação | Resultado |
|---|---|
| Testes novos (`motor/__tests__/rework123.test.ts`, 28; `ui/__tests__/rework123.test.tsx`, 3) | todos aprovados |
| Typecheck (`tsc --noEmit`) | limpo |
| Suíte completa (3 rodadas; a última depois de todas as mudanças de motor) | **2.070 / 2.073** aprovados; os 3 que falharam: dois *timeouts* que também estouram no commit de base nesta máquina (`motor` "linguagem de escolha", 71 s no base e no 12.3, limite fixo de 60 s; `fix31` ajuda da família) — ambos passam com mais tempo —, e o teste do bloqueio (C8), corrigido e reaprovado depois (o bloqueio foi posto na escala nova das provas) |
| Comparação com o commit de base (`3a768d3`, suíte completa na mesma máquina) | base: 9 falhas (7 *timeouts* + 2 de ambiente da cópia) — os *timeouts* são da máquina, não do código |
| Testes antigos ajustados (pré-condição dita, sem afrouxar régua) | `rework12` (a pessoa rica tem emprego e não está negativada), `rework122` (há trabalho para o visto), `att3` (a mesada na média de 4 vidas, 35%), `rework97` (mediana de 12 sementes, < 25), `fixPosRework3` (a prova da autoescola medida em 10 provas, ≥ 7 aprovações), `rework7`/`rework125` (rótulos novos da tela), `ui/rework122` (o nome do animal aparece em mais de um lugar) — cada um com o motivo escrito no teste |
| Build de produção | sem avisos; **nenhum pacote acima de 800 kB** (limite intocado): `motor-textos` 786,4 kB (era 783,6), `Jogo` 767,3, `motor` 753,2, `motor-carreira` 587,6 |
| Smoke de produção (itch.io, `scripts/itch/smoke.mjs`) | **21/21** — e foi ele que pegou a aplicação em branco (ciclo entre pacotes), corrigida |
| PWA offline (`scripts/pwa/offline.mjs`) | **36/36** |
| Desempenho | 26 ms/ano contra 24–25 no base (12 vidas até os 60): +5–8% |

**Simulações** (sem forçar percentuais):

- `scripts/sim/marcos123.ts` — 16 vidas, 2 gerações, 12 sucessões: **0** marcos repetidos por pessoa.
- `scripts/sim/narrativa123.ts` — §6.
- `scripts/sim/submundo125.ts` (15 perfis × 24 vidas × 30 anos, depois da recalibração): condenados à prisão — integrante
  33%, líder 29%, líder cauteloso 33%, profissional 8%, furtos 13%, contrabando 25%, digital 4%, fraudes 29%, dono de
  negócio 29%, milionário 13%, foragido 54%; ocasional e "ex" 0%. Patrimônio p50 aos 30 anos: integrante 10,0 mi, líder
  27,6 mi, cauteloso 10,6 mi, profissional 4,5 mi, contrabando 1,8 mi, fraudes 1,8 mi, furtos 1,0 mi. **0 ajustes no
  extrato, 0 anomalias.** Média dos perfis de organização ≈ 32% (o pedido do 12.25 era 30–40%).
- **A recalibração**, medida em 64 vidas por variante (integrante): base 34%; provas como no 12.25 (sempre fracas) 38%;
  provas pela exposição com inclinação 0,12: 45%; **a escolhida (22 + 0,1 × exposição acima de 25): 41%**, depois 33% na
  rodada final de 24 vidas. A correção das provas foi mantida (a exposição pesa), com inclinação suave.

## 13. QA visual

`scripts/playtest/rework123.mjs` (a régua do 12.25: sobreposição de texto, contraste < 3:1, rolagem horizontal, borda
estourada, erro de console), com duas cenas novas (os pedidos por fora; a Justiça com o bloco "por fora dos autos"), temas
claro e escuro, 1440/390 (+360 e 390×560 nas marcadas): **204 capturas, 0 problemas**. As 4 notas são o bloco curto da
agenda (alvo < 32 px), anterior ao 12.3 e já listado no 12.25. Revisão a olho das telas novas: o bloco ilegal separado da
defesa, com selo; os pedidos com a saída legal; as relações entre organizações. Ajuste feito depois da revisão: o comando
da organização listava "propor negócio" e "propor aliança" para as mesmas organizações (excesso de botões) — o negócio
pontual ficou só para concorrentes e organizações em trégua. **Não testado num aparelho de verdade** (só Playwright).

## 14. Limitações e pendências

- **A cautela pesa menos que no 12.25**: o líder cauteloso ficou perto do integrante (33% × 33%; no 12.25, 13% × 25%). A
  causa principal é a correção das provas (a exposição passou a pesar); a guerra entre organizações já não expõe quem
  está na moita. Vale olhar no playtest.
- **Os testes de 60 s** (`motor` "linguagem de escolha", `fechamentoMundo` 4, `fix31`) estouram o tempo nesta máquina,
  também no commit de base; passam com mais tempo.
- **Conflito no trabalho** abre só com tensão alta (≥ 55) e no máximo a cada dois anos; outros conflitos menores continuam
  pelas cenas antigas.
- **Cargos públicos**: a remuneração não foi mexida. Auditada: a entrada pública fica um pouco acima da privada equivalente
  (técnico público 5,2 mil × analista 4,4 mil); os saltos grandes estão nos cargos mais difíceis (auditor 22 mil, teto de
  aprovação 6% e 48 meses de preparo; analista judiciário 13 mil × advogado 8,8 mil de entrada). Não vira automaticamente
  a melhor escolha: a aprovação é rara e demora.
- **Território** continua textual; a guerra entre organizações é abstrata (força, pressão, exposição), sem cena própria a
  cada ano.
- **Agenda profissional (E7)**: os compromissos da equipe não viraram blocos novos da semana (evitado o excesso de
  microtarefas); o conflito e as sanções aparecem como cena e na ficha do emprego.
- O APK Android não foi regenerado.

## 15. Publicação

__PUBLICACAO__
