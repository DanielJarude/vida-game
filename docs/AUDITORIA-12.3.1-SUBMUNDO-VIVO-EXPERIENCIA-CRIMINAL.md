# AUDITORIA 12.3.1 — Submundo vivo e experiência criminal

Auditoria e diagnóstico, feita em 2026-10-30 sobre o REWORK 12.3 publicado. **Nenhuma funcionalidade do jogo foi alterada.**
Nada foi publicado, enviado (push), mesclado ou implantado; nenhum save real foi aberto. Os únicos arquivos novos são este
relatório e dois simuladores de auditoria, que só leem o motor (`scripts/sim/auditoria1231.ts`, `scripts/sim/narrativa1231.ts`).
Nenhum deles foi commitado.

---

## Resumo executivo

**O VIDA tem um gameplay criminal de verdade, mas de gestão: decisões com números, quase sem cena.** A espinha é sólida e
persistente: envolvimento, exposição, contatos com memória, encomendas, organizações vivas com hierarquia de 7 níveis,
sucessão, racha, relações entre organizações, Justiça por etapas, corrupção judicial, prisão, reabilitação e dinheiro
conciliado no extrato. Tudo isso altera o estado, sobrevive ao save (168/168 vidas simuladas fizeram a ida e volta do save
sem diferença) e tem testes (86 testes direcionados, todos aprovados).

O que falta é o **lado vivido** do crime. Os confrontos, as operações policiais, as traições internas e as perseguições
acontecem como **contas** (força −5, pressão +8, "fulano foi preso") e quase nunca chegam ao jogador como situação:

- **Guerra entre organizações**: em 17–19% dos anos de quem é de dentro, a organização está em conflito aberto com outra.
  O jogador recebe uma frase e +3 de exposição. Não há confronto, emboscada, ferido, morto nem retaliação. Escolher
  "evitar" ou "defender" não mudou nada mensurável (conflito 17% × 19% dos anos; prisões 7 × 6 em 24 vidas).
- **Operações policiais contra a organização**: 49 operações levaram alguém do quadro da organização do jogador em 24 vidas
  de integrante. **Só 3 viraram algum texto para o jogador.** Elas não chegam a ele, aos contatos dele nem aos bens dele.
- **Liderança sem risco de perder o comando**: quem chega ao topo não pode ser contestado (`faccoes.ts:394`). Só a prisão
  ou a própria lealdade abaixo de 12 tiram alguém de lá.
- **Consequências físicas e familiares rasas**: 0 mortes do jogador ligadas ao crime em 168 vidas de organização (20 anos
  cada); 0 casamentos desfeitos em 168, embora em 75–88% das vidas algum parente "não aceite" ou "peça para sair".
- **Perseguição e fuga**: não existem como situação. Existe a chance anual de "ser encontrado" de quem é procurado e a fuga
  abstrata da prisão.

**O contratante ocasional existe e é bem separado do integrante**: em 144 pedidos simulados, nenhum criou envolvimento ou
vínculo com organização, e as consequências (processo como mandante, demissão, cônjuge que descobre) são reais. Mas há
três problemas sérios:

1. O "intermediário" é quase sempre **um parente**: mãe, pai, avô, tio, irmão (96% das vidas comuns aos 25 anos).
2. Os serviços **contra alguém** praticamente não aparecem numa vida comum: ninguém atingiu tensão ≥ 45 em 72 amostras.
3. O preço nunca aparece antes de pedir.

**Balanceamento**: o crime organizado é uma máquina de riqueza. A mediana do integrante aos 30 anos de caminho é
**14,1 milhões** (a de quem nunca entrou é 162 mil). Até o p10 do integrante (1,4 mi) e o do líder (9,7 mi) superam a mediana
da vida legal. Ser preso (25%) não desfaz isso. A cautela não reduziu a prisão do líder (25% × 25%).

**Antes do REWORK 12.4**, recomendo um pacote curto de correções (Parte H, fase 0):

- o intermediário não pode ser parente;
- a inversão das provas (quem fez um pedido isolado começa com provas mais fortes, 45, que o integrante de 30 anos, 22–40);
- o gênero fixo nos textos dos contatos;
- os contatos e o "de sempre" que continuam rendendo depois de uma mudança de país;
- os dois "Pedir para subir" com requisitos diferentes;
- o preço oculto dos pedidos por fora;
- os botões de comando desabilitados em série.

Depois disso, o 12.4 deveria tratar o conflito, a operação policial e a disputa pelo comando como **situações** com escolha
e consequência, e não como contas.

---

## 1. Estado auditado

| Item | Verificado |
|---|---|
| Branch | `claude/rework12.3-carreiras-submundo-justica` |
| Commit | `e74a862` (= `origin/main`) |
| Produção | `origin/claude/fix-pos-rework3-playtest` em `3956207`. Entre `3956207` e `e74a862` só muda o relatório do 12.3 (`git diff --stat`: 1 arquivo em `docs/`) |
| Versão no ar | `https://vida-game.pages.dev` serve `assets/index-CQLeqKbc.js`, o mesmo nome do build do 12.3 registrado no relatório da publicação |
| Relatórios lidos | `docs/REWORK12.25-SUBMUNDO-VIVO-CARREIRA-CRIMINAL-JUSTICA-REPORT.md`, `docs/REWORK12.3-CARREIRAS-SUBMUNDO-JUSTICA-NARRATIVA-REPORT.md` |
| Árvore de trabalho | limpa antes da auditoria (só `.claude/` não rastreado) |

**Módulos do sistema criminal** (motor, `src/motor/`):

| Área | Arquivos |
|---|---|
| Envolvimento e exposição | `sistemas/ilicito.ts`, `margem.ts`, `porFora.ts`, `tempoDoCrime.ts` |
| Ramos (11.5) | `sistemas/submundo.ts`, `ramos.ts`, `clandestinos.ts`, `paralelos.ts` |
| Carreira criminal | `sistemas/carreiraCriminal.ts` |
| Encomendas e contatos | `sistemas/encomendas.ts`, `redeCriminal.ts`, `relatoDoCrime.ts` |
| Organizações | `sistemas/faccoes.ts` (1.029 linhas) |
| Contratante ocasional | `sistemas/servicosPorFora.ts` |
| Justiça | `sistemas/justica.ts`, `tribunal.ts`, `defesa.ts`, `corrupcaoJudicial.ts`, `atoresJudiciais.ts`, `prisao.ts` |
| Ações (porta única) | `sistemas/acoesDoCrime.ts` (ação `crime` de `acoes.ts`) |
| Cenas | `conteudo/acontecimentos125.ts`, `acontecimentos123.ts`, `submundo.ts`, `margem.ts`, `trajetorias.ts` |
| Tela | `ui/jogo/SubmundoVivo.tsx`, `Submundo.tsx`, `Margem.tsx`, `Trabalho.tsx` (prisão), `material/LugaresDoLuxo.tsx` (mercado paralelo) |

**Como foi auditado**: leitura do código (as evidências estão em `arquivo:linha`), testes direcionados e três simulações com
sementes fixas (Parte E). Nada do que se mede aqui foi forçado. Onde a mecânica não existe, ela não foi simulada como se
existisse: virou lacuna (Parte C).

---

## A. Funcionalidades existentes

O que funciona de ponta a ponta: altera o estado, tem consequência, persiste no save e tem teste.

| Recurso | Onde | Acesso | Efeito no estado | Save | Teste |
|---|---|---|---|---|---|
| Envolvimento, exposição que cresce e esfria, investigação com prazo | `ilicito.ts:243-340` | proposta, porta, "Procurar um contato" | `envolvimento.exposicao/investigado`; abre processo | sim | `rework125`, `rework115Submundo` |
| Patamares, prática, ocupação principal | `carreiraCriminal.ts` | automático | `carreira.patamar/xp/marcos`; escala o dinheiro de 1× a 20× | sim | `rework125:61` |
| Encomendas (aceitar, negociar uma vez, recusar, delegar) com chance e risco | `encomendas.ts` | Submundo · Atividades | dinheiro (`por_fora`), exposição, confiança, histórico do contato | sim | `rework125:321-380` |
| Contatos com papel, confiança, amizade, favores, dívida, traição, reconciliação | `redeCriminal.ts` | Submundo · Contatos | `fichas[id]`; vida própria: saem, são presos, falam, mudam de organização (`:374-420`) | sim | `rework125:172-243` |
| Organizações vivas por cidade (3–5), estilo pelo país e pelo ramo, quadro com nomes | `faccoes.ts:137-190` | Submundo · Organizações | `v.mundoCriminal.orgs` | sim | `rework125:244-320` |
| Hierarquia de 7 níveis; pedir para subir; ser chamado; rebaixamento; expulsão | `faccoes.ts:547-606, 814-819, 884-889` | Organizações | `rel.nivel`, `rel.lealdade` | sim | `rework125:255` |
| Sucessão com disputa (apoiar, disputar, ficar de fora), racha que funda rival | `faccoes.ts:453-535` | cena `sub125_disputa` e cartão da organização | `o.disputa`, nova `OrgViva` | sim | `rework125:281` (o racha não tem teste próprio) |
| Relações entre organizações (8 estados) que mudam sozinhas | `faccoes.ts:215-270` | lidas no cartão; trégua e negócio a partir do posto 5 | `o.relacoes` | sim | `rework123:329` |
| Dupla filiação e vínculo secreto com descoberta | `faccoes.ts:657-722` | "Entrar sem que as outras saibam"; cena `sub123_dupla` | `rel.secreto/suspeita`; expulsão | sim | `rework123:301-328` |
| Alcance e distância de uma organização ao mudar de cidade ou de país | `faccoes.ts:611-645` | automático | `rel.distancia`; fora do alcance o vínculo não rende e a lealdade cai 5 por ano | sim | `rework123:338` |
| Comando: prioridade, mediar, recolher, presença por região, aliança, ruptura | `faccoes.ts:911-977` | cartão (posto ≥ 4, ou ≥ 3 para parte) | força, coesão, pressão, influência, voz da comunidade | sim | `rework125:305` |
| Justiça por etapas: estratégia, audiência, mandado, procurado, abrigo, apresentar-se | `defesa.ts` | Submundo · Justiça | `justica.processo/foragido` | sim | `rework125:383-450` |
| Processo com juiz, promotor e defensor com nome; defesa particular, pública ou paga pela organização | `justica.ts:106-140`, `atoresJudiciais.ts` | cena `jus_defesa` | `processo.defesa/pagaPor` | sim | `rework123:116-194` |
| Corrupção judicial (canal, golpe, recusa, denúncia, aceite, descoberta anos depois) | `corrupcaoJudicial.ts` | bloco "Por fora dos autos" | `processo.influencia`; processo por corrupção | sim | `rework123:195-265` |
| Sentença: absolvição, multa, pena alternativa, prisão; confisco; bloqueio de valores | `tribunal.ts:143-260` | automático | extrato `perdas`, dívida de confisco, `antecedentes` | sim | `rework123:266`, `rework125:122` |
| Prisão: rotina, remição, cartas, saúde, organização no pavilhão, fuga abstrata | `prisao.ts`, cenas `pri_*` | Trabalho/Submundo · prisão | `justica.prisao` | sim | `rework125:473` |
| Reabilitação e antecedentes que fecham cargos de idoneidade, política e migração | `tribunal.ts:402-410`, `trabalho.ts:173` | Justiça | `antecedentes` | sim | testes antigos de Justiça |
| Família que desconfia, sabe e reage com cinco posturas | `carreiraCriminal.ts:234`, cena `sub125_familia` | automático | `envolvimento.familia` | sim | `rework125:512-539` |
| Sair aos poucos, largar, negociar a saída, pressão do grupo depois | `carreiraCriminal.ts`, `trajetorias.ts:132-135` | Visão geral · O rumo | `saindo/parou`, `fatos.pressao_grupo` | sim | `rework125:541` |
| Dinheiro por fora no extrato (fontes separadas, conciliado) | `porFora.ts` | Vida · Dinheiro | movimento `por_fora` | sim | `rework125:88-134` |
| Contratante ocasional (6 serviços, intermediário, golpe, falha, descoberta como mandante) | `servicosPorFora.ts` | Submundo · Pedidos por fora (≥ 18 anos) | `caminhos.contratante`; processo; demissão; cônjuge | sim | `rework123:358-404` (só intimidação e agressão) |
| Mercado paralelo no Submundo (para quem é do meio ou foi apresentado) | `paralelos.ts:74-75` | Submundo · Mercados paralelos | compra, apreensão da peça roubada | sim | `rework123:389` |
| Negócios clandestinos e organização própria | `clandestinos.ts` | Submundo · Negócios | receita, apreensão, desmantelamento na investigação (`:147`) | sim | `rework122` |
| Legado sem cargo para o herdeiro | `sucessao.ts`, cena `sub125_legado` | sucessão | `mundoCriminal.legado` | sim | `rework125:552` |

**Testes executados nesta auditoria** (Node 22, nesta máquina): `rework115Submundo`, `rework125` e `rework123` (motor):
**76/76**. `ui/rework125` e `ui/rework123`: **10/10**. A suíte completa não foi rodada: nada no motor mudou.

---

## B. Funcionalidades parcialmente implementadas

O que existe, mas raso, invisível ao jogador ou incoerente.

### B1. Contratante ocasional

- **Serviços**: informação, um favor que fura a fila, uma fraude pequena, intimidação, agressão, apresentação ao meio
  (`servicosPorFora.ts:31-38`).
- **O que funciona**: o intermediário, o pagamento (`pagarPorFora`), o golpe (12%), a falha (12% ou 20%), a descoberta com
  risco que cai 20% ao ano (`:140-159`), o processo como mandante, a demissão por justa causa em 40% das descobertas de
  fraude e agressão, e o cônjuge que descobre. Nunca cria envolvimento, carreira nem vínculo com organização (medido: 0 de
  144 pedidos).
- **O que é raso**:
  - **Não há negociação.** O preço é fixo (`:31-38`). O serviço também não pode ser recusado pelo intermediário, que nunca
    diz "isso eu não faço".
  - **"Um favor que fura a fila"** não se liga a nada que esteja de fato parado na vida (visto, alvará, fila do SUS, um
    processo): só reduz o estresse em 6 (`:105-107`).
  - **"Saber o que não devia"** devolve ocupação, renda e parceiro do alvo, que a tela de relações já mostra, e reduz a
    tensão em 5 (`:97-103`). O efeito mecânico é quase nulo.
  - **Golpe sem saída**: "você não tem a quem reclamar". Não há como cobrar, ameaçar, desistir ou procurar outra pessoa.
  - **A intimidação não tem resposta do alvo** (não denuncia, não revida, não procura ajuda) além do risco genérico.
  - **A agressão nunca é grave**: a saúde do alvo cai 30 pontos (`:124`), sem internação e sem possibilidade de morte. É
    coerente com a escolha de manter o tema abstrato, mas a consequência fica sempre a mesma.
- **Acesso** (ver bugs D1 e D2): o intermediário é quase sempre um parente, e os serviços contra alguém quase nunca aparecem.

### B2. Confrontos entre organizações

- **Existe**: o estado `conflito` entre duas organizações (`faccoes.ts:215-229`). Cada ano em conflito custa força −5,
  pressão +8 e coesão −2 aos dois lados (`:250-253`). A rivalidade no bairro onde o jogador mora vira a cena
  `sub125_rivalidade` (conversar, defender o espaço, recuar: `acontecimentos125.ts:160-174`). A trégua e o negócio entre
  organizações estão disponíveis a partir do posto 5.
- **Falta**:
  - Do lado do jogador, o conflito é **uma frase e +3 de exposição** no ano em que começa (`:263-266`). Não há cena nos
    anos seguintes.
  - Nada acontece ao quadro (ninguém é preso ou morto pela guerra), aos contatos ou à família.
  - A outra organização não retalia o jogador, e não há tentativa de enfraquecer o rival além de "presença" e "romper".
  - Quem está abaixo do posto 5 não tem como influenciar: não pode pedir trégua ao chefe, recusar ir para a linha de frente
    ou se esconder da guerra (a moita só tira a exposição).
- **Medido**: perfis "pacífico" (propõe trégua sempre que pode) e "firme" (defende o espaço): 17% × 19% dos anos de membro
  em conflito; prisões 7 × 6 em 24 vidas. A escolha não fez diferença mensurável.

### B3. Operações policiais

- **Existe**:
  - Contra a organização: com chance de `pressão/300` ao ano, uma operação leva alguém do quadro (`faccoes.ts:372-380`).
  - Contra o jogador: investigação, processo, bloqueio de valores com provas ≥ 30 (`tribunal.ts:178-189`), confisco de
    dinheiro (`:143-169`), apreensão do estoque (`submundo.ts:314-323`) e do negócio clandestino (`clandestinos.ts:147, 191`).
- **Falta**:
  - A operação contra a organização **não chega ao jogador**: 49 operações na organização dele em 24 vidas, 3 com algum
    texto no ano. Não aumenta a investigação dele, não leva um contato dele, não gera busca na casa dele.
  - O **confisco é só de dinheiro** (conta e, depois, dívida). Imóveis e veículos comprados com dinheiro do crime nunca
    são apreendidos.
  - Não existe "desmantelamento" por operação: a organização só acaba quando a força cai abaixo de 6 (`:411-414`).
  - A pressão sobre a organização chega ao jogador só como exposição (`+pressão/30` ao ano, `:579`).

### B4. Traições e política interna

- **Existe**: o contato que fala (preso, ou depois de um fim mal resolvido: `redeCriminal.ts:304-307, 395`), a dívida
  cobrada, a mudança de organização, a dupla filiação descoberta, a disputa pela sucessão, o racha, a expulsão por
  lealdade baixa ou traição, o rebaixamento, o novo comando que desvaloriza os acordos antigos.
- **Falta**:
  - Traição **de dentro da organização** (o colega que entrega, o subordinado que derruba) e o informante infiltrado.
  - Disputa pela liderança **enquanto o jogador manda**: não existe (`faccoes.ts:394`).
  - Quebra de acordo entre organizações com retaliação.
  - Expulsão de um subordinado pelo jogador.
  - Desconfiança como mecânica com cena: só existe na dupla filiação.

### B5. Liderança

- **Existe**: o painel de comando (prioridade, mediar, recolher, presença, trégua, negócio, aliança, ruptura); a parte do
  ano crescendo até ~90× a base; o "protegido" criado ao chegar ao posto 3 (`faccoes.ts:735-741`); a delegação (quem manda
  se expõe menos, `:576-579`).
- **Falta**:
  - Relação com subordinados: o quadro é uma lista de nomes, sem ação possível com eles.
  - A dificuldade de manter o comando: nenhuma contestação.
  - Responsabilidades que cobram: um subordinado preso que precisa de advogado, uma família que pede ajuda.
  - O líder preso perde o comando (`:549-555`); fora isso, o topo é estável.

### B6. Mudança de cidade e de país

- **Existe**: o alcance e a distância da organização (fora do alcance, a parte não rende; a lealdade cai 5 por ano) e o
  abrigo por região.
- **Incoerente** (ver D9): **os contatos e as encomendas deles não têm cidade**. Não há nenhuma referência a município em
  `encomendas.ts` nem em `redeCriminal.ts`, a não ser para preço. Medido: depois de mudar para Portugal, em 60 de 82
  anos-membro observados ainda entrou dinheiro do crime, embora o vínculo com a organização estivesse "fora do alcance" em
  78 deles.

### B7. Consequências físicas e familiares

- **Existe**:
  - A "confusão com gente do esquema" (saúde −7 ou −22, "pronto-socorro": `ilicito.ts:308-314`), as brigas das cenas
    antigas com `machucarNaBriga` (lesão com cuidado e sequela, `conteudo/margem.ts:50, 84`) e o pavilhão.
  - A família que sabe e reage; a tensão do cônjuge, que sobe 4 + 2 × nível por ano (`ilicito.ts:307`).
- **Falta**:
  - Morte do jogador ou de alguém próximo por causa do crime: 0 em 168 vidas × 20 anos.
  - Ameaça à família. Medo como estado com efeito (há só `abalar`).
  - **O cônjuge que vai embora**: 0 de 168 casamentos terminaram, mesmo com a família rejeitando em 75–88% das vidas. A
    ausência já estava listada no 12.25 (§13) e continua.

### B8. Narrativa de vida longa

- O 12.3 mediu 92% de textos distintos **nos resultados de ação**. Na biografia e no diário inteiros de uma vida longa de
  integrante, o retrato é outro: **589 textos em 8 vidas × 30 anos, 23% de moldes distintos**.
  - O resumo do ano ("Por fora, em X: o de sempre rendeu R$ Y") aparece todo ano: 87 vezes.
  - A organização oferece sempre os mesmos 3 trabalhos ("Tomar conta de um negócio do grupo por uns meses", 47 vezes;
    "Resolver uma pendência do grupo, sem barulho", 35). Há **3 tipos de encomenda por ramo** (`encomendas.ts:36-60`), 15
    no total.
- As diferenças por posição existem no relato ("você foi junto" × "mandou dois dos seus"), mas o **conteúdo** dos trabalhos
  não muda com o posto.

### B9. Duas promoções paralelas no crime organizado

O ramo "organizado" do 11.5 tem "Pedir para subir no grupo", "Cumprir uma tarefa do grupo" e "Pedir para sair do grupo"
(`submundo.ts:399-401, 449-452, 539-560`), com requisito de **experiência do ramo**. A organização do 12.25 tem "Pedir
para subir", "Pedir trabalho" e "Pedir para sair" (`faccoes.ts:814-820, 880-899`), com requisito de **lealdade e prática
geral**. O posto real é o maior dos dois (`faccoes.ts:306-312`). São dois botões na tela (Carreira e Organizações) para a
mesma coisa, com regras diferentes. Ver D6.

---

## C. Funcionalidades ausentes

Pedidas nesta auditoria e **sem implementação**. Nenhuma foi simulada como se existisse.

| Pedido | Situação |
|---|---|
| Confronto armado / troca de tiros (como evento abstrato) | ausente: o conflito é numérico (`faccoes.ts:250-253`) |
| Emboscada como evento narrativo | ausente |
| Retaliação de uma organização rival contra o jogador ou a família | ausente (a "pressão do grupo" é só de quem o jogador deixou, `trajetorias.ts:132-135`, e só mexe no humor) |
| Tentativa de eliminar ou enfraquecer uma rival por decisão do jogador | parcial: só presença por região e ruptura; nada dirigido à rival |
| Perseguição, com fugir, entregar-se ou enfrentar | ausente: só a chance anual do procurado (`defesa.ts`) e a fuga da prisão (`prisao.ts:298-312`) |
| Ser identificado e perder recursos numa fuga | ausente |
| Busca e apreensão na casa do jogador | ausente |
| Apreensão de bens (imóvel, veículo) | ausente: o confisco é só de dinheiro (`tribunal.ts:143-169`) |
| Prisão de lideranças pela polícia afetando os integrantes | parcial: a operação leva alguém do quadro, sem efeito no jogador |
| Desmantelamento de organização por operação | ausente (só a extinção por força baixa) |
| Disputa pelo comando enquanto o jogador lidera | ausente (`faccoes.ts:394`) |
| Traição interna (colega ou subordinado entrega o jogador) | ausente (só os contatos falam) |
| Informante infiltrado / vazamento de informação | ausente |
| Relação ativa com subordinados (promover, cobrar, expulsar, proteger) | ausente |
| Morte de NPCs por causa do crime (contatos, quadro, rivais) | ausente: o quadro morre só por idade (`faccoes.ts:385`), os contatos nunca |
| Morte do jogador por causa do crime | ausente: 0 em 168 vidas × 20 anos |
| Ameaça à família | ausente |
| Cônjuge que sai por causa do crime | ausente (já listado no 12.25 §13) |
| Hospitalização como estado (internação, dias fora) | parcial: só o texto "pronto-socorro" e a saúde −22 |
| Negociar com o intermediário (preço, prazo, desistir) | ausente |
| Encomendar serviço contra uma organização ou um negócio (não uma pessoa) | ausente |
| Delação premiada que derruba a organização e gera retaliação | parcial: "cooperar" reduz a pena (`tribunal.ts:332-350`) e marca `pressao_grupo`; a organização não sofre nada |

---

## D. Bugs encontrados

| # | Gravidade | Bug | Causa | Impacto | Evidência |
|---|---|---|---|---|---|
| D1 | alta | **O intermediário dos pedidos por fora é um parente** (mãe, pai, avô, tio, irmão, cônjuge). A tela diz "Quem conhece alguém: [nome da mãe]" | `intermediario()` aceita qualquer vínculo vivo com responsabilidade ≤ −0,35 e confiança ≥ 35, sem excluir o parentesco | incoerência narrativa forte, e o acesso fica quase universal: 96% das vidas aos 25 anos, 83% aos 45. Quem seria o intermediário, somando as idades: tio 16, irmão 14, pai 11, mãe 8, avô 5, afastado 5, cônjuge 3, amigo 3, primo 1 | `servicosPorFora.ts:49`; `SubmundoVivo.tsx:572`; simulação, parte 0 |
| D2 | média | **Os serviços contra alguém quase não aparecem numa vida comum** | `alvosPossiveis()` exige tensão ≥ 45 num vínculo, e nenhuma vida comum chegou a esse valor | intimidação, agressão e informação ficam praticamente inacessíveis fora de cenários montados | `servicosPorFora.ts:54`; simulação: 0 de 72 amostras (24 vidas × 25/35/45 anos) |
| D3 | alta | **As provas se invertem**: quem não é do meio começa o processo com provas 45; o integrante de 30 anos, com 22 a 29,5 (+10 no crime de grupo) | o caminho sem envolvimento usa a base antiga de 45; o com envolvimento usa 22 + 0,1 × (exposição − 25) | quem fez um pedido isolado é julgado com provas mais fortes que um líder. E, no caminho do crime, a exposição quase não pesa: 25 → 100 muda as provas em 7,5 pontos, menos que o ruído de ±10 | `tribunal.ts:74`; provas observadas no simulador do 12.25: integrantes e líderes 27–48, ramos 13–39 |
| D4 | baixa | **O texto promete um processo que não vem** ("Vem um processo.") quando já existe um processo aberto | o texto não lê a mesma condição que abre o processo | a descoberta se perde em silêncio e o texto mente | `servicosPorFora.ts:156` × `:158` |
| D5 | média | **Gênero fixo masculino nos textos dos contatos** | ~20 frases com "ele", "dele", "preso", "a ele", mas 38% dos contatos são mulheres (`submundo.ts:93`) | visto na simulação: "Lara foi preso. Ninguém sabe ainda o que ele vai dizer." | `redeCriminal.ts:83, 201, 238, 317, 394`; `encomendas.ts:210, 378`; `relatoDoCrime.ts:146`; `acontecimentos125.ts:88, 91, 93, 102, 106, 110, 125, 217, 218` |
| D6 | média | **Duas promoções para o mesmo posto**, com requisitos diferentes | o ramo organizado do 11.5 (`posto` 1–4, por experiência do ramo) e a organização do 12.25 (`nivel` 0–6, por lealdade e prática) coexistem; o posto real é o maior dos dois | dois botões "Pedir para subir" e dois "Pedir para sair" em partes diferentes da tela; dá para subir pelo caminho mais fácil; sistemas duplicados | `submundo.ts:449-452, 549-560`; `faccoes.ts:306-318, 814-819`; `Submundo.tsx:133` (frentes) × `SubmundoVivo.tsx:448-449` |
| D7 | baixa | código morto | `acessoAoMercadoPorFora` não é usado; `paralelos.ts:75` repete a regra | manutenção | `servicosPorFora.ts:164` |
| D8 | média | **Contatos e encomendas ignoram a distância** depois de uma mudança | a distância só existe para organizações; os contatos não têm cidade | quem se muda para outro país continua recebendo trabalhos dos contatos da cidade antiga; o "o de sempre" continua rendendo | `encomendas.ts`/`redeCriminal.ts` sem município; simulação `mudar_pais`: 60 de 82 anos com dinheiro do crime entrando, com a organização "fora do alcance" em 78 |
| D9 | média | **"Um favor que fura a fila" pode dar prisão** | o pedido vira processo de categoria `corrupcao`, de pena-base 4, a mesma da corrupção de agente público; com a severidade do país passa de 4 anos e sai da alternativa | desproporção: 2 prisões em 24 vidas por um papel que "andou mais depressa" | `servicosPorFora.ts:158`; `tribunal.ts:48, 56, 230`; simulação parte 1 |
| D10 | baixa | **O golpe ainda gera processo** como mandante (com 1/3 do risco) e, na fraude, até demissão | `reg.risco = s.risco / 3` mantém a descoberta para algo que não aconteceu | plausível juridicamente (tentativa), mas o texto não diz que foi tentativa | `servicosPorFora.ts:84-90, 156` |
| D11 | baixa | os custos dos favores aos contatos ficam ocultos | `semAviso` esconde o motivo com o preço ("Um favor desses custa uns R$ X") | o jogador paga sem ver o preço | `SubmundoVivo.tsx:382`; `redeCriminal.ts:131-132` |
| D12 | baixa | o preço dos pedidos por fora não aparece antes de pedir | a disponibilidade só devolve o preço quando falta dinheiro; o aviso de "irregular" não o inclui | decisão às cegas | `servicosPorFora.ts:64-67`; `SubmundoVivo.tsx:575-585` |

Não encontrei: dinheiro duplicado ou ajustes no extrato (0 nas 240 vidas × 30 anos do simulador do 12.25), NaN, falha de save
(168/168 em ida e volta, 144/144 dos pedidos por fora) nem erro de execução nas simulações.

---

## E. Problemas de balanceamento

### E1. Simulações executadas

| Simulação | Tamanho | O quê |
|---|---|---|
| `scripts/sim/submundo125.ts` (já existente) | 15 perfis × 16 vidas × 30 anos | patrimônio, prisão, progressão, repetição |
| `scripts/sim/auditoria1231.ts` (nova) | acesso: 24 vidas do nascimento aos 45 anos · contratante: 6 serviços × 24 vidas × 10 anos · organizações: 7 políticas × 24 vidas × 20 anos · recomeço: 24 vidas × 15 anos | os 14 cenários do pedido |
| `scripts/sim/narrativa1231.ts` (nova) | 8 integrantes × 30 anos | repetição na biografia e no diário |

As políticas das simulações são deliberadamente simples. A de "integrante" aceita todo trabalho e tenta entrar em toda
organização conhecida. Os números medem o que o motor faz com essa política, não o jogador médio.

### E2. Patrimônio (submundo125, mediana p50 e p10/p90 aos 30 anos de caminho)

| Perfil | p10 | p50 | p90 | Condenados à prisão |
|---|---|---|---|---|
| nunca entrou | −1k | **162k** | 2,2 mi | 0% |
| ocasional | −56k | 114k | 894k | 0% |
| furtos | 439k | 1,0 mi | 1,6 mi | 6% |
| digital | 17k | 1,3 mi | 2,9 mi | 25% |
| fraudes | 105k | 1,4 mi | 3,7 mi | 31% |
| contrabando | 64k | 1,9 mi | 3,3 mi | 31% |
| dono de negócio por fora | 973k | 2,9 mi | 3,6 mi | 31% |
| profissional | 1,2 mi | 3,4 mi | 8,8 mi | 13% |
| integrante | 1,4 mi | **14,1 mi** | 24,5 mi | 25% |
| líder cauteloso | 6,1 mi | 10,7 mi | 18,6 mi | **25%** |
| líder | 9,7 mi | **31,7 mi** | 53,1 mi | **25%** |
| foragido | 72k | 715k | 1,3 mi | 56% |
| preso (4 anos de pena) | 52k | 236k | 845k | 69% |

Leitura:

- **O crime organizado é a forma mais garantida de enriquecer do jogo.** A mediana do integrante é ~87× a da vida legal, e
  até os azarados (p10) passam de 1 milhão. A prisão (25%) não desfaz isso: o confisco cobre 35% a 95% do ganho conhecido
  pelas provas, e as provas costumam ser fracas (D3). O pedido ("não tornar o crime fonte de dinheiro e poder sem riscos")
  não é cumprido no topo.
- **A cautela não protege mais**: o líder agressivo e o cauteloso têm a mesma taxa de prisão (25%). O cauteloso só ganha
  menos. A pendência já registrada no 12.3 (§14) continua.
- **O ramo de furtos é seguro demais** (6% de prisão em 30 anos, com 1 milhão de mediana).
- **A punição não é inevitável**: sair limpo é comum (ocasional e "ex": 16/16 com saídas limpas), e o preso reconstrói
  (236k de mediana).

### E3. Os 14 cenários do pedido

| # | Cenário | Resultado (simulação ou código) |
|---|---|---|
| 1 | Vida legal que contrata um serviço | existe; números na tabela abaixo |
| 2 | Participa de uma organização | integrante: 24/24 entram (mediana de 2 anos) |
| 3 | Tenta subir na hierarquia | 23/24 chegam ao 5º nível em 20 anos (é rápido) |
| 4 | Assume a liderança | 6/24 (integrante) e 8/24 (líder) chegam ao comando em 20 anos, e **nenhum perde o comando por contestação** (não existe) |
| 5 | Envolvido em rivalidade | 17–19% dos anos de membro com a organização em conflito; a cena da rivalidade aparece 8–11 vezes em 24 vidas |
| 6 | Tenta evitar um confronto | política "pacífico" × "firme": **sem diferença mensurável** (B2) |
| 7 | Confronto armado fictício | **lacuna**: não existe |
| 8 | Perseguido ou investigado | investigação: 30 em 24 vidas de integrante, 12 processos, 6 absolvições. Perseguição: **lacuna** |
| 9 | Afetado por operação policial | 49 operações na organização do jogador, **3 com texto ao jogador**; nenhum efeito mecânico direto |
| 10 | Traído por um integrante | traição **de contato**: 19 contatos presos, 4 falaram (integrante); 38 e 10 (líder). Traição **de integrante**: **lacuna** |
| 11 | Abandona a organização | saída negociada 15, mal recebida 4 (em 24); 12 anos com pressão do grupo depois; **17 investigações novas depois de sair**: o passado volta como investigação, como previsto no 12.2 |
| 12 | Muda de cidade ou de país | a organização para (fora do alcance em 78 de 82 anos observados), mas o dinheiro do crime continua entrando em 60 deles (D8) |
| 13 | Consequências familiares | alguém da família sabe em 24/24; alguém rejeita ou pede para sair em 21/24 (integrante); **casamentos desfeitos: 0/24** em todos os perfis (0/168) |
| 14 | Reconstrói a vida depois de uma condenação | 24/24 empregados 5 anos depois de sair da prisão; reabilitação concedida em 24/24; salário p50 2.840 no fim. **Reconstruir é possível, talvez fácil demais** (um emprego de entrada sempre aparece) |

**Contratante ocasional** (24 vidas por serviço, 10 anos depois do pedido; o intermediário e o desafeto foram montados à mão
por causa de D1 e D2):

| Serviço | Feito / falhou / golpe | Veio à tona | Processo | Condenação (prisão) | No mesmo emprego após 10 anos |
|---|---|---|---|---|---|
| informação | 20 / 2 / 2 | 4 | 0 | 0 | 38% |
| favor (fila) | 21 / 2 / 1 | 7 | 7 | 4 (**2**) | 38% |
| fraude pequena | 16 / 2 / 6 | 7 | 7 | 4 (1) | 25% |
| intimidação | 18 / 5 / 1 | 11 | 11 | 6 (3) | 29% |
| agressão | 19 / 1 / 4 | 14 | 14 | 12 (3) | **8%** |
| apresentação | 17 / 3 / 4 | 1 | 0 | 0 | 33% |

A taxa de base de quem fica no mesmo emprego em 10 anos é ~33–38% (os serviços sem processo). A agressão derruba isso para
8%. As consequências são proporcionais, com uma exceção: o "favor" (D9). Nenhum pedido recrutou o personagem (envolvimento
0/144, organização 0/144).

### E4. Frequências de vida (organizações, 24 vidas × 20 anos)

| Política | Expulso | Prisão | Anos com ferimento do crime | Mortes do jogador | Contatos presos / que falaram |
|---|---|---|---|---|---|
| integrante | 15 | 6/24 | 15 | 0 | 19 / 4 |
| líder | 18 | 9/24 | 29 | 0 | 38 / 10 |
| pacífico | 15 | 7/24 | 13 | 0 | 19 / 4 |
| firme | 14 | 6/24 | 21 | 0 | 17 / 4 |
| sai no 6º ano | 6 | 3/24 | 11 | 0 | 10 / 2 |
| muda de país no 6º ano | 10 | 10/24 | 23 | 0 | 24 / 4 |
| muda de estado no 6º ano | 9 | 8/24 | 17 | 1 (infarto, não ligado ao crime) | 24 / 4 |

As expulsões altas são em boa parte efeito da política (entrar em toda organização que aceite leva à dupla filiação: a
cena `sub123_dupla` apareceu 17 a 28 vezes). Mesmo assim, mostram que a expulsão é um desfecho frequente e pouco
sinalizado. Não há "anos sem escolha" (mediana 0 em todos os perfis ativos, simulador do 12.25), e a maior sequência de
fracassos fica entre 1 e 3.

---

## F. Problemas de interface

| # | Tela | Problema | Evidência |
|---|---|---|---|
| F1 | Pedidos por fora | o preço não aparece antes de pedir (D12); a chance de dar errado e o risco de vir à tona também não | `SubmundoVivo.tsx:575-585` |
| F2 | Pedidos por fora | até 9 botões "Contra [nome]" (3 serviços contra alguém × até 3 alvos), cada um com o mesmo aviso longo repetido | `SubmundoVivo.tsx:582-583`; `comum.tsx:47` |
| F3 | Pedidos por fora | o intermediário exibido é um parente ("Quem conhece alguém: [mãe]") | D1 |
| F4 | Organizações · O comando | no posto 4 (índice 3) o painel abre com "Propor aliança a X" para cada organização da cidade, "Fazer-se presente" e as tréguas, **todos desabilitados** com o mesmo motivo ("Aliança é coisa de quem manda") | `SubmundoVivo.tsx:451-466` × `faccoes.ts:808, 834, 839` |
| F5 | Carreira × Organizações | dois "Pedir para subir" e dois "Pedir para sair" com regras diferentes (D6) | `Submundo.tsx:133`; `SubmundoVivo.tsx:448-449` |
| F6 | Organizações | as mensagens de bloqueio citam "posto 5" e "segundo nível", mas a tela mostra nomes ("liderança regional", "gente de dentro") | `faccoes.ts:804, 808` × `SubmundoVivo.tsx:472` |
| F7 | Organizações | o que aconteceu com a organização no ano (operação, conflito, morte no quadro) fica dentro de um `<details>` fechado ("A hierarquia, o território e a história"); o jogador não fica sabendo | `SubmundoVivo.tsx:470-481` |
| F8 | Contatos | os favores pagos não mostram o preço (`semAviso`) (D11) | `SubmundoVivo.tsx:382` |
| F9 | Organizações | a expulsão não tem aviso antes: a lealdade baixa aparece só como barra, sem dizer "abaixo de 12, você é posto para fora" | `faccoes.ts:584-595`; `SubmundoVivo.tsx:428` |
| F10 | Organizações | "Pressão da Justiça" é uma barra sem consequência dita (o que acontece quando sobe) | `SubmundoVivo.tsx:427` |
| F11 | Visão geral | o rumo tem até 8 botões juntos (moita, voltar, fundo, sair aos poucos, desistir, largar, ajuda, negociar), mesmo com os bloqueados ocultos | `SubmundoVivo.tsx:205-210` |

O que está bom: a tela única por estado (12.25), os medidores de progressão e risco lado a lado, "pede atenção" com link, o
bloco "Por fora dos autos" separado e marcado como ilegal, as etapas da Justiça, as consequências medidas depois de cada
ação (`executarCrime` → `consequencias`). A QA visual do 12.3 (204 capturas, 0 problemas de geometria e contraste) não foi
refeita: a interface não mudou.

---

## G. Recomendações

### G1. Correções necessárias (bugs)

1. **D1**: o intermediário deve vir de fora da família. Excluir quem tem `parentesco`, e o cônjuge.
   Preferir amigos, colegas, vizinhos e conhecidos. Pedir confiança e uma ligação real com o meio (um traço, uma
   ocupação, um passado registrado), não só a responsabilidade baixa.
2. **D3**: igualar a escala das provas. O caminho sem envolvimento precisa de base própria (um pedido isolado: 25–35), e
   a inclinação da exposição deve pesar de verdade, recalibrando a absolvição no simulador sem fixar uma taxa.
3. **D5**: flexionar pelo gênero do contato (o `flex`/`ge` já existe em `ilicito.ts:439`) em todos os textos listados.
4. **D8**: dar cidade aos contatos (o município da pessoa já existe). Longe, o contato só conversa ou faz uma proposta "à
   distância", mais rara. O "o de sempre" segue a regra de alcance.
5. **D6**: um posto só. O botão do ramo vira atalho para a ação da organização (ou some), e a experiência do ramo vira um
   dos requisitos da promoção.
6. **D4, D9, D10**: o texto da descoberta lê o mesmo estado que abre o processo. O "favor" vira uma categoria leve
   (corrupção menor, alternativa para primário). O golpe descoberto é narrado como tentativa.
7. **D11, D12**: mostrar o preço, a chance e o risco antes de pedir.

### G2. Melhorias de sistemas existentes

1. **O conflito entre organizações como situação**: em cada ano de conflito, uma cena para quem é de dentro, conforme o
   posto. O novato pode ir, se esconder ou pedir para ficar fora. O médio pode proteger um ponto, negociar com o outro lado
   ou avisar o chefe. Quem comanda decide a resposta. Consequências: ferimento (já existe `machucarNaBriga`), prisão de um
   contato, morte de alguém do quadro (com nome), +exposição, lealdade. Sempre abstrato, sem "como fazer".
2. **A operação policial que chega ao jogador**: quando a operação leva alguém do quadro, ela pode levar um contato do
   jogador, abrir ou acelerar a investigação dele (pela proximidade no quadro) e gerar uma busca (apreensão de dinheiro em
   casa, de um veículo). O aviso vem na hora, fora do `<details>`.
3. **O comando que se disputa**: com coesão baixa ou lealdade em queda, alguém do quadro contesta o líder jogador. A
   resposta é negociar, ceder uma parte, mediar ou enfrentar. Perder custa o posto, não a vida.
4. **A cautela que protege**: na moita, as operações chegam menos e o confisco encontra menos.
5. **O cônjuge que decide**: uma cena para o parceiro que rejeita (conversar, prometer, separar), com o término
   possível. Para a família, ameaça apenas narrada e indireta (o carro na esquina), nunca violência explícita.
6. **Contratante**: negociar o preço uma vez (aceita, contraproposta ou recusa, como já existe nas encomendas); o
   intermediário que recusa o que não faz; recuperar o golpe (cobrar e perder o contato, ou deixar quieto); a resposta do
   alvo (denúncia, afastamento, revide social). O "favor" ligado a algo realmente parado (visto, alvará, fila).
7. **Alvos acessíveis**: além da tensão ≥ 45, incluir o rival de trabalho (`equipe.ts`), o ex-sócio, o credor e quem
   prejudicou o jogador (memória `conflito`). Sem isso, metade do contratante é conteúdo morto.

### G3. Novas mecânicas

1. **Perseguição e fuga** (evento curto, abstrato): ao fim de um trabalho que deu errado ou numa operação, decidir entre
   fugir (chance, perda do que levava, ser identificado), entregar-se (pena menor, sai do caminho) ou enfrentar (pior para
   a Justiça, ferimento). O resultado mexe na investigação e na confiança da organização.
2. **Traição interna e informante**: um integrante do quadro com nome e lealdade própria, que pode entregar o jogador
   (provas +), ser descoberto, ou ser protegido pelo jogador.
3. **Subordinados**: a partir do posto 4, 2 ou 3 pessoas com nome que respondem ao jogador (promover, cobrar, proteger,
   afastar). Uma delas pode ser presa e pedir advogado; outra pode querer o lugar dele.
4. **Apreensão de bens**: na condenação com provas altas, imóvel ou veículo comprado depois do início do caminho pode ser
   perdido. Isso reequilibra o enriquecimento do topo sem aumentar a prisão.
5. **Desmantelamento**: uma operação grande (pressão muito alta e várias prisões no quadro) que extingue ou racha a
   organização, com efeito em todos os vínculos.
6. **Mortes no meio** (sempre narradas, sem detalhe): contatos e gente do quadro podem morrer por causa do crime (conflito,
   acerto), com luto e mudança de comportamento.

### G4. Melhorias narrativas

1. Mais tipos de trabalho por ramo e por posto (hoje são 3 por ramo; o diretor recebe "um recado da organização" como o
   novato).
2. Um resumo do ano por fora que mude de forma conforme o ano: quieto, de guerra, de operação, de crescimento. Hoje é a
   mesma frase todo ano (87 vezes em 8 vidas).
3. Texto para o que acontece com a organização (a operação, o morto, o preso, o racha), dito para quem é de dentro.
4. A expulsão anunciada antes (o recado, a cobrança).

### G5. Melhorias de interface

1. Pedidos por fora: um cartão por serviço com preço, chance e risco; escolher o alvo num seletor, não em N botões.
2. O comando: só os botões possíveis no posto; o resto numa linha "no próximo posto: alianças, trégua…".
3. "Este ano na sua organização": um bloco aberto com operação, conflito, quem entrou, quem caiu.
4. A lealdade com o limite de expulsão marcado na barra; a pressão com a consequência dita.
5. Nomes de posto nas mensagens de bloqueio.

---

## H. Roadmap sugerido

| Fase | O quê | Tipo | Depende de | Impacto | Tamanho |
|---|---|---|---|---|---|
| **0 — antes do 12.4** | D1 intermediário sem parentes | correção | — | alto (coerência) | pequeno |
| 0 | D3 escala das provas (com recalibração no simulador) | correção | — | alto (justiça e balanço) | médio |
| 0 | D5 gênero dos contatos | correção | — | médio | pequeno |
| 0 | D8 contatos com cidade | correção | — | médio | pequeno a médio |
| 0 | D6 um posto só | correção / sem duplicar sistema | — | médio | médio |
| 0 | D4, D9, D10, D11, D12; F1, F2, F4, F6 | correção e interface | — | médio | pequeno |
| **1 — o 12.4** | conflito entre organizações como situação (G2.1) | melhoria | fase 0 | **muito alto** | médio |
| 1 | operação policial que chega ao jogador (G2.2) + bloco "Este ano na sua organização" (G5.3) | melhoria e interface | fase 0 | **muito alto** | médio |
| 1 | o comando que se disputa (G2.3) | melhoria | — | alto | pequeno a médio |
| 1 | cautela que protege + apreensão de bens (G2.4, G3.4): o balanço do topo | balanço e mecânica | D3 | alto | médio |
| 2 | perseguição e fuga (G3.1) | nova mecânica | 1 (operação) | alto | médio |
| 2 | traição interna e subordinados (G3.2, G3.3) | nova mecânica | 1 (comando) | alto | grande |
| 2 | cônjuge e família (G2.5) | melhoria | — | médio | pequeno |
| 2 | contratante: negociação, golpe, alvos acessíveis (G2.6, G2.7) | melhoria | D1 | médio | médio |
| 3 | desmantelamento e mortes no meio (G3.5, G3.6) | nova mecânica | 1 e 2 | médio | médio |
| 3 | variedade dos trabalhos e do resumo do ano (G4) | narrativa | — | médio | médio, contínuo |

**Critérios para fechar o 12.4** (a medir com `scripts/sim/auditoria1231.ts` e `submundo125.ts`, sem fixar números de
antemão):

- a escolha "pacífico" × "firme" muda algo mensurável;
- as operações na organização chegam ao jogador com texto e efeito;
- o líder cauteloso é preso menos que o agressivo;
- a mediana do topo deixa de ser ~87× a da vida legal, sem a prisão virar destino;
- os textos de vida longa passam bem de 23% de moldes distintos;
- 0 parentes como intermediário e 0 erros de gênero.

---

## Reprodução

```bash
export PATH=$HOME/.nvm/versions/node/v22.23.2/bin:$PATH
npx esbuild scripts/sim/auditoria1231.ts --bundle --platform=node --format=esm --outfile=/tmp/a.mjs
N=24 ANOS=20 node /tmp/a.mjs          # tudo; SO=acesso,contratante,orgs,recomeco e POLS=... escolhem partes
npx esbuild scripts/sim/narrativa1231.ts --bundle --platform=node --format=esm --outfile=/tmp/n.mjs
N=8 ANOS=30 node /tmp/n.mjs
npx esbuild scripts/sim/submundo125.ts --bundle --platform=node --format=esm --outfile=/tmp/s.mjs
N=16 ANOS=30 node /tmp/s.mjs
npx vitest run src/motor/__tests__/rework115Submundo.test.ts src/motor/__tests__/rework125.test.ts src/motor/__tests__/rework123.test.ts
npx vitest run src/ui/__tests__/rework125.test.tsx src/ui/__tests__/rework123.test.tsx
```

Limitações desta auditoria:

- As políticas simuladas são simples (B/E1).
- A interface foi auditada pelo código e pelos testes, sem novas capturas.
- O save real de um jogador não estava disponível.
- O número de vidas (16 a 24 por perfil) dá ordens de grandeza, não percentuais finos. O 12.3, com 24 vidas por perfil,
  mediu prisão de integrante de 33%; aqui, com 16, deu 25%.
