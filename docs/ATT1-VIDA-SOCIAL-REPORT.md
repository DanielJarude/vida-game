# ATT 1 — Vida Social · Relatório

Branch: `claude/att1-vida-social` (a partir de `claude/vida-rebuild` @ `918ddf4`).
Não mergeada na `main`. Sem force-push.

---

## 1. Estado inicial

| Verificação | Resultado |
| --- | --- |
| Repositório | `DanielJarude/vida-game`, branch `claude/vida-rebuild`, HEAD `918ddf4`, árvore limpa |
| `npm ci` / `npm test` (Node 22) | verde — 4 arquivos, **41 testes** |
| `npm run typecheck` / `npm run build` | verdes (bundle 628 kB) |

Observação: com Node 20 as suítes de interface (jsdom/undici) não iniciam — é o
mesmo requisito já documentado (`.nvmrc` = 22). Todos os números abaixo são com Node 22.

## 2. Diagnóstico (a causa, não os sintomas do playtest)

Leitura do código + uma simulação de 100 vidas no motor anterior (`scripts/sim/simular.ts`).

| Sintoma no playtest de Samuel | Causa arquitetural |
| --- | --- |
| Relações "distante / próxima / muito próxima" e nada mais | O vínculo era **um número** (`proximidade`) + `tensao`; a UI traduzia faixas em 3 palavras. Não havia papel social derivado, confiança, presença ou história estruturada (12 strings). |
| "Perto de você" duplicava a tela Pessoas | O painel listava as 6 pessoas de maior proximidade — as mesmas da lista. |
| Pai, bebê, esposa e colega com as mesmas ações | `INTERACOES` era uma lista fixa de 9 ações filtrada por 3 condições (`especie`, `idade >= 14`, `romance`). A ação não sabia **quem** a pessoa era. |
| Arthur, 30 anos: "2053 — Nasceu." | Só o nascimento chamava `lembrarCom`. Nenhum sistema registrava marcos da relação. |
| Filho de 30 anos "desenvolvedor júnior" | `trajetoriaDoFilho` só existia até o primeiro emprego; depois o filho congelava. |
| Um filho seguiu a vida sem o jogador saber | Vestibular/faculdade só rodavam se o filho morasse com o jogador; o resto não produzia texto. |
| Netos soltos na árvore | `adu_neto` era um acontecimento sorteado que criava um neto sem pai nem mãe (nenhum campo de genitores existia); filhos não tinham parceiros. |
| "Nicole morreu (AVC). Viúvo aos 62." e a vida seguiu | `processarMortes` escrevia uma linha e descontava felicidade uma vez. A esposa morta virava `romance.estagio = 'ex'` — **"sua ex"** na tela. Nenhuma despedida, nenhum luto persistente, nenhum peso por vínculo. |
| Mortes em série aos 62–64 | Toda morte "importante" era `marco`; nenhuma hierarquia, nenhum agrupamento. |
| "Adulto e menor de idade: não." para 17/18 | `podeTerRomance`: `if (i >= 18 !== ip >= 18) return false` — binário. |
| Planejamento de filhos em "Você" | A ação `{ tipo: 'filhos' }` era global, apesar de o plano já morar em `vinculo.romance.planoFilhos`. |
| Crises românticas sem motivo | `processarRomance` sorteava 11% de "crise externa" (+25–45 de atrito) sem narrar nada. |
| Amiga "de todo dia" de uma criança de 5 anos, com 30 anos | A rotina "igreja" tinha amplitude etária ±25 também para crianças. |

## 3. Classificação dos componentes

| Componente | Veredito | O que foi feito |
| --- | --- | --- |
| Modelo `Pessoa` | MANTER + REFINAR | + `genitores` (árvore), `aperto` (momento difícil), `vida` (trajetória própria), `gestacao` (NPC) |
| `Vinculo` | REFAZER INTERNAMENTE | + `confianca`, `presenca`, `habitos`; `historia` vira `Marco {t, texto, tipo, peso}` (até 30, sai o de menor peso); `romance` ganha `tInicio`, `fim` (termino/divorcio/**morte**), `secreto`, `segredo` |
| Papéis familiares | MANTER + REFINAR | + `genro` (genro/nora), `bisneto`; **papel social derivado** (`sistemas/vinculos.ts`) |
| Romance (estágios) | MANTER + REFINAR | Regra de idade gradual; crises com causa; términos estruturados; casos escondidos |
| Gestação do jogador | MANTER + REFINAR | Continua cronológica; liga-se ao casal (história, genitores, preparo); sem gravidez entre adolescente e adulto |
| Filhos | SUBSTITUIR | `sistemas/filhos.ts`: presença, adolescência, trajetória simplificada, autonomia, comunicação, parcerias, netos e bisnetos |
| Evolução de NPCs | REFAZER INTERNAMENTE | Irmãos, pais, avós, amigos ganham apertos, parcerias, separações, mudanças de cidade |
| Ações sociais | SUBSTITUIR | `sistemas/interacoes.ts`: catálogo com `quando` por papel/fase/contexto |
| Morte | SUBSTITUIR | `sistemas/luto.ts`: peso por importância, hierarquia, despedida, luto que decai com a rede |
| Conteúdo social | MANTER + REFINAR + NOVO | `conteudo/social.ts` novo; `adu_neto` e `mat_amigo_morre` (matava pessoas por conteúdo) **removidos**; `fil_volta_casa` corrigido |
| Linha da Vida | MANTER + REFINAR | `Entrada.evento` estruturado (`TipoEvento` + pessoa + peso) |
| UI Pessoas | SUBSTITUIR | Círculos, cartões do núcleo, ficha nova |
| "Perto de você" | SUBSTITUIR | "Em casa" + "Pede atenção" |
| Save | NOVA VERSÃO | v7, migração v6→v7, validação de relações |
| Testes | EXPANDIR | +28 testes (27 motor, 1 interface), 2 saves reais do motor anterior |

## 4. O novo modelo social

**Estado interno (nunca mostrado como número)** por vínculo: afeto (`proximidade`),
confiança, atrito (`tensao`), presença (tempo dedicado, ano a ano), convivência
(recalculada: casa, escola, trabalho, rotina, vizinhança — sempre exigindo a
mesma cidade), último contato, hábitos (quantas vezes cada interação foi feita)
e história (marcos com tipo e peso).

**Derivados** (`sistemas/vinculos.ts`): `papelDe` (parceiro, saindo, caso, ex,
filho, neto, bisneto, genro, genitor, irmão, avô, parente, sogro, amigo
próximo, amigo, colega, conhecido, afastado, pet), `faseDeIdade` (bebê,
criança, pré, adolescente, jovem, adulto, idoso), `circuloDe` (núcleo,
família, amigos, contexto, passado), `importancia` (0–100: papel × afeto +
casa + anos + história), `estadoCivil`, `filhosEmComum`.

**Apresentação** (`ui/leitura.ts`): frases, não barras. "Juntos há 27 anos,
casados há 22. Mora com você." / "Estão bem: ainda riem das mesmas coisas.
Têm 4 filhos juntos." / "Vocês têm se afastado desde que ele foi para longe."
/ "Mesmo adolescente, ela ainda conta as coisas para você."

## 5. Regras de relacionamento

### Idade (`regraDeIdade`, testável e graduada)

| Situação | Resultado |
| --- | --- |
| alguém com menos de 14 | ilegal |
| dois adolescentes | até 3 anos de diferença |
| 16–17 com jovem adulto de até 20, diferença ≤ 3 (ex.: 17 e 18) | **permitido** como namoro adolescente |
| qualquer outro menor com adulto (15/18, 16/21, 17/22, 16/25…) | não existe no jogo (botão nem aparece) |
| dois adultos | permitido; diferença grande reduz o interesse (mais forte entre jovens) |

Namoro adolescente: sem morar junto, casar, "noite só de vocês" ou planejar
filho antes dos 18; **nenhuma gravidez entre adolescente e adulto, nem antes
dos 16**. Nada sexualiza menores (as ações de casal adolescente são cinema e
mensagem).

### Progressão e vida a dois

Base preservada (interesse → saindo → namoro → morando junto → casamento).
Entre os marcos há o que fazer, conforme o momento: sair só os dois, demonstrar
carinho, uma noite só de vocês (adultos), conversar sobre a relação (quando há
atrito ou distância), estar junto num aperto, planejar ou adiar filhos,
propor morar junto, pedir em casamento, terminar/separar/divórcio. A ficha
mostra até 5 ações (as principais primeiro) e o resto em "Mais".

Crises têm causa (trabalho dele/dela, cansaço das crianças pequenas,
dinheiro, fase difícil, família dele/dela) — narrada e guardada na história.
Uma "fase difícil" abre "Estar perto de X nessa fase" como ação.

A outra pessoa tem vontade: pode querer filho (`soc_quer_filho`: começar a
tentar / pedir tempo / "não quero ter filhos", que pesa depois), reclamar da
distância (`soc_parceiro_distante`), terminar.

### Infidelidade e escolhas negativas

- Chamar alguém para sair estando com outra pessoa ("…escondido", aviso
  "seria traição") ou "arriscar algo" em `rom_alguem_especial` **inicia um caso
  escondido** (`romance.secreto` no caso; `romance.segredo` na parceria).
- O caso vive: a outra pessoa se envolve ou cansa (e termina), ou dá ultimato
  depois de dois anos (`rom_caso_ultimato`: assumir / terminar o caso / pedir tempo).
- Descoberta: risco anual cresce com o tempo, o mesmo trabalho, a impulsividade.
  `rom_descoberta`: admitir e pedir perdão / negar / assumir e ficar com o caso.
- A reação da parceria é dela: fica ou vai embora conforme envolvimento,
  temperamento, confissão e filhos pequenos; a confiança cai e demora a voltar.
- Contar a verdade por conta própria é uma ação na ficha da parceria.
- Consequências: separação com motivo, filhos ≥ 10 anos com atrito e menos
  confiança, estresse de quem guarda segredo, Linha da Vida com `traicao` /
  `traicao_descoberta` / `ruptura`. Sem moralismo: o texto descreve o que aconteceu.
- Personalidade só se move pelas escolhas (caso: impulsividade+, empatia−;
  negar: empatia−; encerrar o caso: família+; confessar: coragem+).

## 6. Parentalidade

Ações por fase do filho (e do neto):

| Fase | Ações |
| --- | --- |
| bebê | cuidar (madrugadas, banho, colo), brincar no chão |
| criança | brincar, ler antes de dormir, dever de casa, reunião da escola, incentivar um interesse |
| pré/adolescente | conversar (sem sermão), estudos, incentivar, impor limite (só com atrito ou problema recente), conversar sobre o futuro |
| adulto | passar um tempo / almoçar, visitar ou ligar (se longe), estar junto num aperto, aconselhar, ajudar com dinheiro (só se precisa) |

**Presença** acumula ano a ano (ações dedicadas, morar junto, rotina "tempo em
família"); o afeto e a confiança de um filho tendem ao que a presença
construiu. A adolescência gera atrito mais provável quando falta presença; aos
18 ela entra na história como foi ("teve porta batida… e passou" / "sem grandes
brigas"). Costumes viram marcos ("Ler antes de dormir virou coisa de vocês").
Nada disso é um medidor: a ficha diz "Você está presente no dia a dia" ou
"A vida dele anda passando sem você perto".

## 7. Filhos adultos, autonomia e gerações

Trajetória simplificada (`sistemas/filhos.ts`), sem rodar o motor do jogador:
aptidão estável (sorte + estudo em casa), escola (pode largar — se mora com o
jogador, vira decisão `fil_largar_escola`), depois do médio o caminho é deles
(quer ou não faculdade — influenciado por conversar sobre o futuro e presença —,
pública, ProUni, técnico, trabalhar; particular vira decisão do jogador só se
moram perto; longe, o filho resolve: FIES, estudar à noite, desistir), evasão
possível, formatura, primeiro emprego conforme formação, **progressão por
tempo no cargo + experiência + aptidão − recessão** (nunca só idade), demissão
e recolocação, estagnação **explicada uma vez por cargo** ("sem diploma, o
próximo degrau não abre" / "já chegou onde a carreira costuma chegar") ou volta
a estudar, aposentadoria, namoro/união/separação, mudança de cidade, saída e
volta de casa.

**Autonomia não é opacidade**: cada passo vira linha na Linha da Vida
(biografia para o importante, cotidiano para o resto, no máximo 3 notícias
biográficas por ano) e na "A vida dele/dela" da ficha.

**Gerações**: gestação de filha/nora com anúncio ("o bebê deve nascer em
fevereiro de 2093") e parto meses depois (nunca instantâneo), aborto
espontâneo possível. O neto nasce com `genitores` = [filho, parceiro], vínculo
`neto`, marco "Avô/Avó pela primeira vez, aos 61" (`virou_avo`); o mesmo para
bisnetos (`virou_bisavo`). Genro/nora entra na família ao se unir e vira
"ex-nora" na separação.

## 8. Luto

Peso da perda = `importancia` (papel, afeto, casa, anos, história). Medianas
em 240 vidas: parceria 100, filho 100, pai/mãe 92, amigo próximo 80, irmão 64,
avô/avó 47, amigo 39, primo/tio 22, colega 11.

| Nível | Peso | Tratamento |
| --- | --- | --- |
| interrompe | ≥ 62 | marco com o que a pessoa foi ("Foram 31 anos juntos, 28 de casamento, 2 filhos. A casa ficou com um lugar vazio na mesa. Viúva aos 52.") **e a despedida** |
| destaque | 38–61 | marco |
| discreto | 16–37 | uma linha (cotidiano se < 28); várias no ano viram **uma só** ("Se foram, naquele ano: seu tio Cleber e sua prima Adriana.") |
| registro | < 16 | fora da biografia; fica em "Quem se foi" |

**Despedida** (`luto_despedida`, decisão prioritária, 12+ anos): prestar
homenagem / reunir a família / guardar uma lembrança / cuidar de quem sofre
mais / voltar logo para a rotina / precisar de um tempo sozinho. O jogo não
decide a reação; a escolha muda o ritmo do luto e as relações (quem foi
cuidado fica mais perto).

**Consequências sistêmicas**: estado civil vira viuvez (a pessoa continua
"sua esposa" em "Quem se foi", nunca "ex"), a casa perde um morador (a
identidade passa a dizer "mora sozinho" se for o caso), filhos em comum e o
genitor viúvo ficam "de luto" (e "estar junto" aparece para eles), irmãos
guardam "perderam a mãe juntos". O **luto persiste** (`vida.luto`) e decai
mais depressa com rede de apoio presente; pesa no humor e no estresse de forma
moderada. **Solidão** pesa só quando não há ninguém em casa **e** ninguém
presente — morar sozinho com amigos e filhos por perto não penaliza. Atrito
com quem mora junto também pesa todo dia.

## 9. Interface

- **Pessoas**: "Com você" (ou "Em casa" / "Seus filhos" / "Os seus", conforme a
  verdade) com cartões para parceria e filhos — nome, papel, idade e uma frase
  sobre a relação; depois **Família** (pais, irmãos, netos, avós, genro;
  primos/tios pouco próximos dobrados em "Outros parentes (N)"), **Amigos**, "Do
  dia a dia"/"Da escola e do bairro", "Gente que passou", "Quem se foi",
  "Você" (só orientação e adoção sem parceria).
- **Ficha**: quem é e desde quando, onde mora e há quanto não se falam, como
  está (com causa), gestação quando há, jeito, ações contextuais, "A vida
  dele/dela" (descendentes) e "O que viveram juntos" (marcos de peso 3 em
  destaque, "Toda a história (N)").
- **Painel lateral**: "Em casa" (quem mora com você, ou "Você mora sozinho")
  e **"Pede atenção"** (bebê a caminho, luto, apertos, brigas, parceria
  distante, anos sem se falar) — clicar abre a ficha. Não repete a lista.
- **Identidade**: estado civil ("casada com Kauã há 22 anos", "viúvo de Maria
  Alice, desde 2085") e luto visível ("· de luto por Maria Alice").
- **Obituário**: "Quem ficou" por importância; netos e bisnetos; estado civil ao fim.
- Correção: as abas do cabeçalho não tinham nome acessível em 761–1180 px (só ícone).

## 10. Save

- **v7** (`VERSAO_SAVE = 7`). Estrutura nova: `luto`, `confianca` obrigatória,
  marcos tipados, árvore.
- **Migração v6 → v7** (`migrarV6`, melhor esforço, sem inventar história):
  confiança derivada de afeto e atrito; tipo/peso dos marcos pelo texto;
  **parceria morta que o motor antigo marcava como `ex` vira viuvez** (pela
  linha "Viúvo/a" da biografia); filhos ganham genitores (o jogador + a
  parceria da época do nascimento); netos ganham o filho de quem são filhos
  (sobrenome/cidade/idade); presença inicial pelo afeto; referências soltas
  removidas. v5 passa por v5→v6→v7.
- **Validação**: vínculos com números finitos, história e convivência em
  lista, relacionamento válido, genitores que existem. Save inválido vai para
  backup e não trava (comportamento anterior preservado).
- Testada com **dois saves reais gerados pelo motor anterior** (commit
  `918ddf4`): uma família com neto e uma viuvez — ambos migram, validam, e
  continuam sendo vividos.

## 11. Testes

69 testes (antes: 41). Novos em `src/motor/__tests__/social.test.ts` e um de interface:

| # pedido | Teste |
| --- | --- |
| 1 | 17/18, 16/19, 15/17 permitidos; convite disponível para 17 com 18 |
| 2 | 13/14, 15/18, 16/21, 17/22, 16/25, 17/40, 14/18 bloqueados; adulto de 27 não aparece para 16 |
| — | namoro 17/18 não mora junto, não planeja filho, não engravida (30 tentativas) |
| 3 | bebê só recebe cuidar/brincar |
| 4 | filho de 4 anos: brincar e ler; nada de dinheiro ou limite |
| 15 | escolar × adolescente × adulto em aperto têm conjuntos diferentes; parceria × colega × criança com a mãe |
| 9 | planejar filhos existe na parceria e não no amigo; executar muda o plano do casal |
| 18 | morto não recebe ações (lista vazia, impossível, execução não altera a vida) |
| 19 | amigo que mudou de cidade perde a convivência e ganha visitar/ligar; cônjuge em outra cidade não "mora junto" |
| 5, 7 | filho adulto evolui (trajetória, ocupação) e é comunicado, em 8 sementes |
| 6 | desenvolvedor júnior: em 9 anos muda de cargo ou há explicação (≥ 6 casos observados) |
| 8, 10 | gravidez de filha: nada antes do parto; neto nasce no mês previsto, com a filha como genitora; "virou avó" é marco e entra na história com a filha |
| 16 | filho criado com presença: ≥ 6 marcos de ≥ 3 tipos em 30 anos |
| 11 | cônjuge de 34 anos pesa > primo + 30; interrompe × discreto/registro |
| 12 | viuvez: estado civil, `fim = morte`, não é "ex", sai da casa, marco com anos juntos, despedida abre, filhos de luto com "estar junto" |
| 13 | perda reduz humor; o luto diminui em 4 anos |
| 22 | três parentes distantes no mesmo ano → no máximo uma linha |
| 14 | amigo e mãe na mesma cidade não oscilam além de 15/10 num ano sem nada; toda alta de atrito ≥ 15 na parceria tem causa narrada |
| 17 | 40 anos de processamento automático (mortes, nascimentos, filhos, crises) não criam nenhuma evidência de personalidade |
| — | caso escondido: parceria oficial igual, segredo registrado, ações de confessar/encerrar; descoberta com 3 reações; "assumir" troca a parceria |
| 20 | ida e volta v7 idêntica; v6 real migra sem relação corrompida e segue; árvore quebrada / confiança inválida rejeitadas |
| — | netos sempre têm genitor filho do jogador e 16+ anos de diferença (25 anos de vida) |
| UI | parceria no topo com "seu marido", ficha com "casados há 3 anos" e "O que viveram juntos"; bebê sem ação de conversa/dinheiro |

Testes alterados (contrato mudou de propósito, não afrouxados):
`personalidade só é movida por decisões comportamentais e rotinas` aceita
também `acao:*` (ações do próprio jogador, como apoiar ou ter um caso);
`ler() grava o save migrado` espera versão 7; o teste de interface da ficha da
mãe procura o rótulo contextual ("Passar a tarde com…") em vez do genérico.

## 12. Simulação

`scripts/sim/social.ts` (novo) — 240 vidas, 12 estratégias × 20 (inclui
**infiel** e **desatento**, novas):

```
npx esbuild scripts/sim/social.ts --bundle --platform=node --outfile=/tmp/social.cjs
VIDAS=20 SAIDA=/tmp/social node /tmp/social.cjs
```

| Métrica | Resultado |
| --- | --- |
| Alertas de coerência (parcerias simultâneas, regra de idade, menor com adulto, diferença absurda, morar junto em outra cidade, neto sem genitor ou de pai com < 15 anos, ação com morto) | **nenhum** |
| Relações que importam por idade (mediana) | 7 aos 5 · 11 aos 15 · 12 aos 40 · 11 aos 60 · 5 aos 80; "ninguém próximo": 2 vidas aos 80 |
| Casamento / divórcio / viuvez / novo amor depois | 126 / 49 / 40 / 52 vidas |
| Casos / descobertos | 54 vidas (20 da estratégia infiel) / 36 |
| Viuvez com despedida aberta | 40/40 |
| Filhos que chegaram aos 25 sem trajetória / com só "nasceu" | 0 / 0 (mediana de 12 marcos na história pai/mãe–filho adulto) |
| Carreiras congeladas sem explicação | 0 |
| Vidas com neto / idade ao virar avô (mediana) | 47 / 61 |
| Afeto mediano de filho adulto: familiar × desatento | **95 × 40** (emerge da presença, não de medidor) |
| Perdas visíveis depois dos 60 (mediana / p90) | 2 / 8 por vida; pior janela de 3 anos: mediana 2, máx 7 |
| Linhas sociais visíveis por ano | média 0,8 · p90 2 |
| Mesma frase social 3+ vezes na vida | 5,3 por vida (era 14,4 no começo da ATT) |
| Relações de 20+ anos que importam com ≤ 2 marcos | 165/867 (19%; era 51% na primeira rodada), quase todas de jogadores passivos |

`scripts/sim/simular.ts` (o simulador geral) continua rodando; estratégias
atualizadas para as ações contextuais.

## 13. Playtest visual

`scripts/playtest/gerarSociais.ts` gera saves de quatro momentos reais
(criança de 7 com família grande; adulto de 43 com parceria e quatro filhos;
a despedida aberta de uma viuvez; avô de 67 com netos) e
`scripts/playtest/social.mjs` os abre num Chromium real em **320, 390, 820 e
1440 px**, fotografando Pessoas, fichas, despedida, resultado, Linha da Vida
e painel, e checando rolagem horizontal, botões fora da tela, CTA cobrindo o
fim do conteúdo e folhas maiores que a tela.

Resultado final: **nenhum problema estrutural**. Encontrados e corrigidos no
caminho: abas sem nome acessível em 820 px; "Filha seu e de Júlia"; "A vida
dela" cortando o sujeito ("— e Bernardo foram morar juntos"); ação principal
depois da secundária; título "Com você" para quem mora sozinho; primos e tios
da mesma cidade enchendo a Família.

## 14. Bugs encontrados durante o desenvolvimento

| Bug | Causa | Correção |
| --- | --- | --- |
| Parceria "morando junto" em outra cidade (8 casos) | `moraJunto` ignorava a cidade | casal em cidades diferentes não mora junto |
| Colega de trabalho que se mudou continuava "no dia a dia" | convivência por ambiente sem cidade | exige mesma cidade (salvo online) |
| "Você esteve perto numa fase difícil" 6× no mesmo casal | marco a cada apoio | um marco por aperto |
| Estagnação de carreira repetida a cada 5 anos | sem memória | uma vez por cargo; espera conta na próxima chance |
| Reencontro em laço com a mesma pessoa | afastado→reencontro→afastado | intervalo de 15 anos por pessoa |
| Humor despencando na viuvez | hit imediato + equilíbrio somados | calibrado (−0,15×peso imediato; teto −20 no equilíbrio) |
| Colegas com afeto 100 | sem teto por estágio | colega/conhecido ≤ 58 |
| "Guardou o chapéu dela de Paula" | possessivo duplicado | objeto sem possessivo |
| "Arrumou o primeiro emprego" para quem já trabalhava | olhava só a trajetória | considera o cargo anterior |
| `mat_amigo_morre` matava pessoas pelo conteúdo | acontecimento alterava `vivo` | removido; mortes só pelo corpo, narradas pelo luto |
| `par_mudar_cidade` mandava sempre para São Paulo | destino fixo | destino da região |
| `fil_volta_casa` sem checar desemprego (pendência do relatório anterior) | premissa não verificada | exige filho desempregado de fato, sem parceria |
| Amiga de 30 anos "de todo dia" de uma criança de 5 | amplitude da rotina | ±2 anos até 13, ±4 até 17 |

## 15. Limitações conhecidas

- **Humor depois da viuvez**: cinco anos depois, a média é ~41 (antes ~60). É a
  soma do luto já pequeno com a perda da parceria, da rede e com saúde/idade
  (60–80). Plausível, mas é o ponto a calibrar no playtest humano.
- **Filhos por vida**: mediana 0 nas estratégias do simulador porque várias
  não buscam filhos; não é uma medida da população.
- **Bisnetos** quase não aparecem (as vidas terminam antes); o sistema existe e é testado estruturalmente.
- **Irmãos** têm parcerias e separações, mas a parceria deles não vira vínculo
  e **não há sobrinhos**. Amigos casam "fora da tela".
- **Casos não geram gravidez**; **reputação** (família e amigos em comum
  sabendo) não é modelada.
- Morte de avô/avó com vínculo médio sai como marco (peso ~47) — correto para
  a maioria, talvez demais para quem mal conhecia os avós.
- Netos têm a mesma trajetória dos filhos, comunicada como cotidiano.
- `vida.fatos` também guarda contadores de variação de frase (`frase_*`).
- Personalidade: rotinas continuam dominando as evidências (herdado).

## 16. Dependências deixadas para as próximas atualizações

- **ATT 2** (caminhos): filhos só seguem 8 cursos superiores e 3 técnicos e as
  trilhas do catálogo; concursos, carreiras artísticas/esportivas e militares
  dos descendentes dependem da expansão de carreiras.
- **ATT 3** (economia): pensão por morte do cônjuge; finanças compartilhadas do
  casal (hoje a renda da parceria entra no domicílio, sem decisão sobre ela);
  custo real de netos cuidados pelo jogador; casa maior quando o bebê chega (hoje
  só narrado: "a casa ficou pequena de repente"); herança para filhos.
- **ATT 4** (narrativa): `Entrada.evento` (tipo + pessoa + peso) e
  `Vinculo.historia` tipada já estruturam amizade, namoro, término,
  reconciliação, união, casamento, divórcio, traição, gravidez, nascimento,
  filho saiu/voltou, neto, virou avô/bisavô, morte, viuvez, despedida e
  ruptura — prontos para capítulos por pessoa.

## 17. Playtest humano — o que fazer

```
git fetch && git checkout claude/att1-vida-social
nvm use 22 && npm ci && npm test && npm run dev
```

1. **Adolescência**: aos 16–17, se aparecer interesse por alguém de 18, chame
   para sair — deve funcionar. Veja que morar junto aparece bloqueado.
2. **Tela Pessoas** em qualquer idade: o topo deve dizer quem divide a vida
   com você; primos distantes dobrados; o painel lateral (ou o topo, no
   celular) mostra "Em casa" e "Pede atenção", não a mesma lista.
3. **Namoro → casamento**: abra a ficha da parceria. Há sair, carinho,
   conversar sobre a relação (quando há atrito), planejar filho (aqui, não em
   "Você"). Deixe um ano sem cuidar e veja se ela reclama.
4. **Filhos**: com um bebê, a ficha só oferece cuidar e brincar; aos 4, ler;
   aos 9, dever de casa; aos 15, conversar e (se brigarem) limite. Aos 30,
   abra "O que viveram juntos" e "A vida dele".
5. **Autonomia**: não faça nada pelos filhos adultos por alguns anos — a Linha
   da Vida deve contar vestibular, formatura, empregos, casamento, gravidez.
6. **Avô/avó**: o nascimento do primeiro neto deve ser um marco com seu nome e idade.
7. **Traição** (opcional): estando casado, chame alguém para sair "escondido".
   Continue a vida e veja se é descoberto; escolha como reagir.
8. **Luto**: se a parceria morrer, deve abrir "A despedida" com seis
   caminhos; a identidade passa a dizer "viúvo/a de…" e "de luto por…"; a
   casa muda; nos anos seguintes o humor sente e vai se recuperando.
9. **Velhice**: veja se as mortes de parentes distantes ficam discretas e
   agrupadas; se novas relações aos 60+ ainda aparecem.
10. **Save**: feche a aba no meio da vida e continue. Um save de antes desta
    atualização deve abrir com aviso de conversão.

Perguntas para anotar: alguma reação foi decidida por você sem pedir? Alguma
relação mudou sem motivo? Algum texto repetiu cedo demais? Algum filho pareceu
congelado? A morte de alguém central pesou o suficiente — ou demais?
