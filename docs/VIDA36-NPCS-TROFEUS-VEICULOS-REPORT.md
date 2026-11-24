# VIDA 36 · Relatório da atualização

Branch: `claude/vida36-npcs-tatuagens-veiculos-trofeus` (a partir de `origin/main` d6067e8, VIDA 35.3).
Versão no jogo: **36** (`src/ui/novidades.ts` → `NOTAS`; `src/ui/novidadesVersao.ts` → `VERSAO_ATUAL`).

## 1. Resumo

Foram entregues: a Frente 1 (interações com NPCs) nas ações que a auditoria mediu; os bugs 5.1 a 5.4 (com correção de
causa-raiz em 5.1, 5.3 e 5.4, e correção parcial em 5.2); a identidade e a navegação dos troféus; a visualização
"Ver no corpo" das tatuagens; a navegação da vitrine de carros e motos (filtro, ordenação, comparação); e 18 modelos
reais novos de carros e motos, com desenho próprio.

Não concluído integralmente: ver a seção 8 (pendências declaradas).

## 2. Auditoria (o que existia, o que faltava)

- **Repetição das respostas sociais:** a medição (`scripts/sim/repeticao75.ts`) mostrou variedade baixa em elogiar (0,20),
  conversar (0,55), passar um tempo (0,41) e agradecer (0,39). A causa é o tamanho das listas de frases: cada situação
  tinha 2 a 3 falas, e só o eixo `extroversao` mudava a fala. Além disso, `variar` em `interacoes.ts` escolhia a frase só
  pela contagem de vezes, então toda pessoa recebia a mesma sequência.
- **Família:** `conhecerAFamilia` tinha ramos por temperamento, mas cada ramo tinha 2 a 3 frases fixas.
- **Troféus:** títulos de e-sports não entravam no palmarés (ficavam em `esports25.temporadas`), e a galeria só tinha
  17 formas, nenhuma para e-sports, modalidades tradicionais ou carreiras não esportivas.
- **Veículos:** a vitrine de carros e motos não tinha filtro por marca, ordenação nem comparação. O catálogo tinha ~150
  versões, mas várias ainda eram modelos repetidos em outros catálogos.
- **Tatuagens:** o estúdio já tinha mapa do corpo, lupa e lista "As suas", mas a lista não levava à região da tatuagem.

## 3. Interações com NPCs (Frente 1)

**Causa-raiz e correção.** Cada situação social passou a montar a fala a partir de três pedaços (abertura, corpo e
fecho), escolhidos pelo **tom da pessoa**, derivado do temperamento real (`tomDaPessoa`, em `src/motor/dados/tons36.ts`):
tímido, desconfiado, afetuoso, expansivo, brincalhão, sério ou neutro. O mesmo tom gera muitas combinações, e a escolha
não depende só da contagem de vezes.

Aplicado em: conversar, passar um tempo, elogiar (`conversas.ts`); agradecer (companhia e ajuda, com a evidência
continuando a decidir o ramo); conhecer a família (cada familiar reage pelo seu papel e temperamento, `convivio126.ts`);
discordar, cobrar, fazer as pazes, pedir desculpas, provocar e encerrar amizade (`conflitos.ts`); e a variação por
pessoa em `interacoes.ts`.

**Medição** (`repeticao75.ts`, mesma semente, antes → depois):

| ação | variedade antes | variedade depois | repetição seguida |
|---|---|---|---|
| conversar | 0,55 | 0,67 | 0 |
| passar um tempo | 0,41 | 0,51 | 0 |
| elogiar | 0,20 | 0,33 | 0 |
| agradecer | 0,39 | 0,57 | 0 |
| carinho | — | — | amostra de 7 falas (variedade 1,0; amostra pequena) |

Agradecimentos sem evidência: 0 (antes e depois).

**Limites declarados:** carinho não recebeu composição própria; a família não foi medida com `repeticao75` (o script
não cobre o almoço); e a variedade continua limitada pelo número de tons e de pedaços por tom.

## 4. Bugs (Frente 5)

- **5.1 — base após abandonar o esporte (corrigido).** Causa: parar a rotina de uma modalidade removia a rotina, mas não
  encerrava a carreira esportiva (base ou profissional). Correção em `acoes.ts`: a parada chama `encerrarCarreira`, que
  arquiva o histórico. Teste em `vida36.test.ts`.
- **5.2 — móvel some na mudança (parcial).** Causa: a nota "não cabe à vista" só aparecia a partir de 300 px, então, em
  tela estreita, o móvel que não cabia na casa nova sumia sem explicação. Correção em `Personalizar.tsx`: a nota aparece
  em qualquer largura. **Não feito:** realocação automática do móvel que não cabe; ele continua contado no cômodo e fora
  da cena.
- **5.3 — e-sports demitido sem motivo (corrigido no texto e no histórico).** Causa: a não renovação tinha causa (o
  desempenho abaixo do elenco, `zMet`), mas o texto dizia só "o contrato acabou". Correção em `esports25.ts`: a mensagem e a
  passagem registram o motivo. **Não feito:** rever a regra de renovação em si (ela continua a mesma).
- **5.4 — "tio foi demitido" (corrigido).** Causa: quando um NPC fecha o próprio negócio, o motor gravava o mesmo aperto
  de "desemprego" usado para demissão. Correção: o aperto tem `motivo: 'negocio'` (`tipos.ts`, `vidas19.ts`) e o celular
  usa um desabafo próprio (`mensagens17.ts`, `catalogo17.ts`).

## 5. Troféus

- **E-sports:** cada título de temporada (`esports25`) entra na galeria, com a forma do jogo: cristal (LoL), escudo com
  mira (CS), agulha (Valorant), caixa (Fortnite), hexágono (R6), carro (Rocket League), controle (demais). Hierarquia:
  torneio comum, liga especial, mundial histórico.
- **Modalidades tradicionais:** cesta (basquete), rede (vôlei), raquete (tênis), tocha (atletismo), onda (natação) e
  cinturão (lutas). O futebol segue com liga, copa e estaduais.
- **Obras:** rolo (cinema), televisão (série e novela), máscaras (teatro), claquete (curta); disco para música.
- **Honras de outras carreiras:** a área do prêmio é gravada (`conquistas14`, campo `area`); cada área tem a sua forma
  (cruz, livro, átomo, obelisco, balança, seta, pena, paleta); prêmios de pesquisa aparecem como laurel.
- **Identidade por competição:** cada troféu tem uma faixa com a cor e a sigla da competição (`siglaDe`: "Mundial de LoL"
  → "ML"). A cor vem do jogo, da modalidade, da obra ou da área.

**Não feito:** troféus da organização de e-sports (`org31.trofeus`) continuam fora da galeria; não há vitrine individual
por troféu; inscrições próprias por campeonato além da sigla; prêmios científicos, acadêmicos (além do de pesquisa) e
empresariais não têm dados no motor e não foram criados.

## 6. Tatuagens e veículos

- **Tatuagens:** em "As suas", cada tatuagem tem "Ver no corpo". A lupa abre na região dela, com a lista das outras
  tatuagens daquela região, numeradas, com nome, tamanho e ano (`Tatuagens.tsx`). **Não feito:** destaque visual da
  tatuagem na pele (halo) e catálogo novo de desenhos.
- **Vitrine de carros e motos:** filtro por marca e faixa de preço; ordenação por preço, ano mais novo, conforto ou nome;
  comparação de até três modelos lado a lado (tabela com preço, ano, classe, lugares, conforto, habilitação, idade
  mínima, custo mensal e IPVA). Filtros e comparação ficam guardados por loja: ao abrir um veículo e voltar, nada se perde
  (não sobrevivem a recarregar a página). Módulo puro: `src/motor/sistemas/vitrineDeVeiculos36.ts`.
- **Catálogo:** 18 modelos reais novos (`src/motor/dados/veiculos36.ts`), cada um com desenho próprio em `carros13.ts`
  (oito carros) e `duasRodas.ts` (dez motos). Foram removidos 13 modelos que já existiam em outros catálogos e um scooter
  que ficaria com o mesmo desenho de outro. **Não feito:** a expansão "significativa" pedida (centenas de modelos); o
  catálogo novo é um passo, não o total.

## 7. Validação

- Testes novos: `vida36.test.ts`, `vida36Veiculos.test.ts` (motor e tela), `vida36Veiculos.test.tsx`,
  `vida36Tatuagens.test.tsx`, `vida36Trofeus.test.tsx`. Todos passam.
- Testes das áreas tocadas (conversas, conflitos, família, galeria, lojas, veículos, tatuagens, notas): passam; os erros de
  desmontagem do ambiente (`EnvironmentTeardownError`) aparecem nas rodadas, mas nenhum teste falha por asserção neles.
- **Suíte completa:** ver seção 9.
- `npm run build`: passa; o maior pacote fica em 796,96 kB (abaixo do limite de 800 kB, sem aviso).
- Ciclo de pacotes: o mesmo da `origin/main` (um ciclo de 12 pacotes, já existente). Um ciclo maior (17) apareceu durante o
  trabalho e foi removido movendo o tom da pessoa para `tons36.ts` (dados puros).
- `scripts/itch/smoke.mjs`: 37/37.
- `scripts/pwa/offline.mjs`: 13/14. A falha é de um roteiro antigo: procura a aba "Celular" dentro de "Semana", que não
  existe nem na `origin/main`. Não é regressão desta versão, mas o roteiro precisa ser atualizado.
- **Não feito:** inspeção visual em desktop e mobile dos troféus, da vitrine de veículos e da lupa das tatuagens; teste
  em aparelho real.

## 8. Pendências declaradas

1. Frente 1: carinho sem composição; família não medida com `repeticao75`; conflitos não medidos com a simulação.
2. 5.2: móvel que não cabe na casa nova não é realocado.
3. 5.3: a regra de renovação de e-sports não foi revista.
4. Tatuagens: sem destaque visual na pele; sem catálogo novo.
5. Troféus: organização de e-sports, vitrine individual e prêmios de outras carreiras sem dados.
6. Veículos: catálogo novo é um passo, não a expansão completa; sem inspeção visual.
7. Roteiro offline (`offline.mjs`) desatualizado (aba "Celular").

## 9. Suíte completa

Ver a linha de resultado no fim deste arquivo, preenchida após a última rodada.

Testes já sabidos como lentos ou sensíveis à carga (não causados por esta versão): `fechamentoMundo` #4 (timeout de 60 s
sob carga) e `motor.test` "regra de agência" (timeout fixo de 60 s no código; o teste de palavras passa quando roda).

**Resultado da última rodada completa (suíte inteira, 284 arquivos):** 3420 testes aprovados, 1 pulado, 2 falhas — ambas
timeouts de 60 s conhecidos (`fechamentoMundo` #4 e `motor.test` "regra de agência"). Nenhuma falha de asserção. Os erros
`EnvironmentTeardownError` aparecem ao fim da rodada e não são de teste.
