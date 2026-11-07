# Frente "Motos clássicas" — VIDA 12.9.1

## O que faltava (auditoria)
A 12.9 registrou: "sem motos clássicas, falta uma classe de moto clássica". O carro clássico (`segmento: 'classico'`) já tinha
tudo: só usado, garagem de colecionador, `depreciacao`=1, `valorDeClassico` (índice de clássicos × estado × país), restauração,
evento "Um colecionador bate à porta", grau por `grauDoVeiculo`. Nada disso era duplicado: a moto clássica é uma CLASSE nova
com o mesmo segmento, e herda todos esses sistemas.

## Bug corrigido (causa raiz)
- `dados/veiculos129.ts: fundamentoDaRaridade` — o `.replace('.', ',')` (feito para "3,3 milhões") trocava também o ponto do
  milhar: "cerca de 10,594 fabricados" (lê-se dez vírgula…). Agora só o número de milhões é formatado em pt-BR ("10.594").

## O que mudou (arquivo: função)
- **NOVO `src/motor/dados/motosClassicas1291.ts`** (puro, só tipos; chunk `motor-casa`): `CLASSE_MOTO_CLASSICA` (`moto_classica`,
  categoria moto, segmento classico, usoMensal 320, taxa 2%, fragilidade 1,45, conserto 1,8), `VERSOES_MOTOS_CLASSICAS` (28),
  `ehMotoClassica1291`, `HISTORICOS_MOTO_CLASSICA` (histórias de anúncio próprias: "original, motor e quadro com os números de
  fábrica", "de clube de motos antigas, com documentação", "veio desmontada, em caixas"…), `FILETE_1291`, `BANCOS_1291`, `RODAS_MOTO_1291`.
- `dados/bens.ts`: import; `CLASSE_MOTO_CLASSICA` no fim de `VEICULOS`; versões no fim de `VERSOES_VEICULO`; campo opcional de
  tipo `historica?` em `VersaoVeiculo`.
- `dados/veiculos129.ts`: `grauDoVeiculo` — `historica` sobe UM grau, só com produção conhecida, teto muito rara;
  `fundamentoDaRaridade` ("marco da história; …" + bug acima); `VisualVeiculo.filete/banco`; `visualDasMods` (moto lê filete e
  banco); `chaveDoVisual`; `RODAS_MOTO_129` ganha "raiadas, aro dourado".
- `dados/personalizacaoVeiculo.ts`: moto ganha a peça "Filete no tanque" (só forma `cruiser` = clássica, via `formas`/`opcaoServe`)
  e dois bancos de couro (caramelo, marrom) — servem em qualquer moto.
- `sistemas/mercado.ts`: `CATEGORIAS_DA_LOJA.colecionador` = carro + moto; colecionador anuncia 3 motos clássicas usadas
  DEPOIS dos carros (os anúncios de antes não mudam de posição nem de sorteio); a loja de motos não vende moto de segmento
  (`&& !m.segmento`); histórico do anúncio da moto vem de `HISTORICOS_MOTO_CLASSICA`.
- `sistemas/colecao.ts: colecoesDaVida` — grupo "Motos de coleção" (antes uma moto marcada de coleção caía em "Carros de coleção").
- `conteudo/acontecimentos12.ts` (pat12 colecionador): "encontro de motos antigas… é a sua moto" quando é moto clássica.
- `ui/jogo/Patrimonio.tsx` (detalhe do grau também no grupo motos), `ui/jogo/Garagem129.tsx` ("na coleção de motos").
- **NOVO `src/ui/ilustracao/motosClassicas1291.ts`**: `MOTOS_CLASSICAS_1291` (perfil por modelo) e `motoClassica()` — a moto
  montada por peças: motor (paralelo, mono, quatro em linha, V2 com cabeçote "nó dos dedos"/"panela", L da Ducati, boxer com o
  cilindro de lado, V transversal da Guzzi, dois tempos com radiador, V4 carenado), guidão (clip-on, reto, alto com travessa,
  puxado, largo), tanque (gota, longo, de sela, pequeno, Harley com painel), banco (duplo, café com corcova, selim de molas, rabo
  de pato, fastback, boattail), escape (dois, quatro empilhados, quatro-em-um, alto com protetor, dois altos da XR, panela de
  expansão, rabo de peixe, megafone, boxer), para-lamas (curto cromado, fundo, de saia com a cabeça de índio, nenhum na pista),
  garfo (telescópico, paralelogramo, molas, Earles, feixe), quadro rígido × amortecedores com mola, cardã × corrente,
  meia carenagem / de guidão / inteira, placa de número. Rodas raiadas (liga só onde o modelo tinha).
- `ui/ilustracao/duasRodas.ts: moto` usa o perfil clássico quando a versão é uma clássica; `ui/ilustracao/veiculos129.ts:
  visualNaMoto` aplica banco de couro (peças `banco|selim|garupa`) e o filete (na posição do tanque da forma) a QUALQUER moto.
- `vite.config.ts`: `motosClassicas1291` na regex do `motor-casa`.

## Catálogo (28; preço = referência R$ 2026 de exemplar em bom estado, não cotação)
Inglesas: Triumph Bonneville T120 1969 (130 mil), BSA Gold Star DBD34 Clubman 1960 (280 mil), Norton Commando 750 Fastback 1970
(140 mil), Vincent Black Shadow Série C 1950 (1,1 mi; ~1.700; marco), Brough Superior SS100 1930 (4,2 mi; 383; marco).
Italianas/alemãs: Ducati 750 SS 1974 (1,8 mi; 401), Moto Guzzi V7 Sport 1972, Ducati Scrambler 450 1971, BMW R 60/2 1965
(17.306), BMW R 90 S 1974 (17.465). Japonesas: Honda CB750 Four 1970 (~400.000; marco), Kawasaki Z1 900 1973, Kawasaki H2 750
1972, Suzuki GT750 1974, Yamaha XS650 1972, Yamaha RD350 1974, Honda CB400 Four 1975, Honda CL350 1970, Honda VFR750R RC30 1988.
Brasileiras (só BR): Honda CG 125 1976, Yamaha RD 350 LC 1990. Americanas: Harley EL Knucklehead 1937, FL Panhead 1955,
FX Super Glide 1971, XR750 1972, XR1000 1983 (1.777), Indian Chief 1947, Indian Scout 101 1929.
Produção só onde o número é de conhecimento geral; as outras ficam sem número (a classe decide: incomum).

## Raridade (sim `a129/x-motos/sim.ts`)
incomum 24 · rara 1 (XR1000) · muito rara 3 (Vincent, Brough, 750 SS). CB750: comum pela produção → incomum só por ser marco.
Knucklehead (R$ 750 mil) sem número = incomum: o preço não decide.

## Mercado/valor (sim)
São Paulo, 30 anos: 90 anúncios de moto clássica, 17 modelos; preço min/mediana/máx R$ 22 mil / 100 mil / 486 mil (as raras
aparecem pouco: `pesoUsado` baixo). Campinas: 90, 21 modelos, máx R$ 649 mil. Z1 em estado 85, 30 anos: 349 → 307 → 488 → 446
mil (sobe e desce com o índice de clássicos; não deprecia pela idade).

## Saves
Nenhum campo de save novo; nada de normalizador. `mods` continua `Record<string,string>` (ids novos `filete`, `banco:couro_*`,
`rodas:raiadas_douradas` só quando a pessoa faz). A migração de saves sem versão não sorteia clássica (classe nova).

## Testes (reais)
- NOVO `src/motor/__tests__/vida1291Motos.test.ts`: 10/10 (catálogo íntegro e ids únicos; raridade por dados e fundamento;
  valorização = valorDeClassico a cada ano, estado pesa; só usada, só no colecionador, anúncios depois dos carros, compra com
  histórico, restaurar, vender; grupo "Motos de coleção"; filete/banco/rodas/acabamento persistem no save e aparecem no
  desenho; filete recusado na Z900; desenho único por modelo com as peças que o definem; save antigo com moto igual).
- `veiculos4.test.ts` ajustado (mudança pedida): a loja de motos vende zero todas as motos do país MENOS as de segmento.
- Rodados e passando: vida129Veiculos, rework12 (motor), veiculos4, rework124, vida128, aeronaves, fixPosRework4, att3, fix4,
  fixPosPlaytestHumano, fixPosRework3 (motor) + UI desenhos, fixPosRework3, rework8b, rework12, rework124, visuaisIcones,
  rework7, material — 0 falhas (139 + 85 + 211 testes nos três lotes). `tsc --noEmit` limpo.

## Visual (Playwright, imagens olhadas) — `a129/x-motos/`
`grade.png` (200 px), `g1..g7.png` (420 px), `mini.png` (72 px, a vitrine), `escuro.png`, `mods.png` (acabamento, rodas,
filete, banco), `garagem-1100.png`/`garagem-390.png`. Corrigido depois de olhar: carenagem inteira da RC30 (era um bolo),
meia carenagem da 750 SS (grande demais), corcova do café (parecia um segundo tanque), placa da XR750, escapamentos altos da
XR1000 (passavam por cima do banco), selim de molas em cima do tanque, tubo do quadro sobrando atrás nas de quadro rígido,
aro preto raiado (o renderizador pinta o miolo: virava disco preto → trocado por aro dourado).

## Pacotes (build `dist-motos`)
motor-casa 187,7 kB (catálogo aqui); desenho no chunk Compras 278,4 (lazy); Jogo 618,7; motor 741,5; motor-patrimonio 229,0;
motor-dados 798,2 kB (ATENÇÃO integrador: rente ao limite; minha parte lá é só import + 2 espalhamentos em bens.ts e 2 em
personalizacaoVeiculo.ts, ~0,2 kB); motor-textos 794,2.

## Limitações honestas
- Preços e produção: referência plausível, não cotação; muitos modelos sem número de produção (ficam "incomum").
- A XR750 é moto de pista, mas o jogo deixa usá-la como qualquer moto (não há regra de placa de coleção).
- A loja de motos não anuncia clássica; só a garagem de colecionador (cidades grandes), como os carros clássicos.
- O "Catálogo completo" da loja de motos passa a listar também as clássicas do colecionador (assim como o da concessionária
  já lista os exóticos).
- O filete aparece na posição do tanque da forma "clássica" (nas customs de hoje fica aproximado); "rabo de pato" etc. não
  são peças personalizáveis. Não verifiquei no app de produção (smoke do itch é do integrador).
