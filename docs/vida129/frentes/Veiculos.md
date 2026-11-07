# Frente "Veículos e garagem" — VIDA 12.9

## Auditoria (antes)
- `dados/bens.ts`: 22 classes, 115 versões (clássico 8, superesportivo 5, hiperluxo 4, 1 limitada — McLaren 765LT).
- `sistemas/colecao.ts:553` (`colecoesDaVida`): grau dos carros de coleção = `rara` se segmento clássico/exótico, senão `comum`
  (ignorava `limitada`; um Rolls de série = Fusca clássico = "rara"); nome do item = nome da CLASSE ("carro clássico").
- `dados/personalizacaoVeiculo.ts`: 6 cores + envelopamento, um acabamento (preto fosco), 2 rodas; nada disso aparecia no desenho
  (`ui/ilustracao/carros.ts`/`duasRodas.ts` só recebiam a cor).
- Garagem = tabela sem desenho (`ui/jogo/Patrimonio.tsx:217`, rolagem horizontal no celular); história só no painel Personalizar.

## Bugs corrigidos (causa raiz)
1. **Raridade pela classe** — `colecoesDaVida` decidia o grau só por `m.segmento`. Agora `grauDoVeiculo(versão, segmento)`
   (`dados/veiculos129.ts`): `limitada` → "Edição limitada" (1 unidade → "Peça única"); `producao` conhecida → ≤1.000 muito rara,
   ≤15.000 rara, ≤100.000 incomum, acima comum; sem número: clássico/exótico de série → incomum; resto comum. O preço não entra.
   Ex.: 765LT agora "Edição limitada" (antes "Rara"); Rolls-Royce Phantom R$ 12 mi → "Incomum"; Willys Interlagos R$ 400 mil (822 feitos)
   → "Muito rara"; Fusca 1972 → "Comum".
2. **Nome do colecionável** — usava `modeloVeiculo(...).nome`. Agora `nomeDoVeiculoDeColecao`: "Marca Modelo, ano" ("Jaguar E-Type Série 1, 1963");
   save sem versão cai no `b.nome` salvo. O item ganhou `marca` e `detalhe` (o fundamento: "edição limitada de 799 unidades",
   "cerca de 10.594 fabricados"), mostrado na lista de coleções (Patrimônio).

## O que mudou (arquivo: função)
- **NOVO `src/motor/dados/veiculos129.ts`** (puro, só tipos; chunk `motor-casa`): `VERSOES_VEICULO_129` (68 versões),
  `PRODUCAO_DE_ANTES`, `ehVersao129`, `grauDoVeiculo`, `fundamentoDaRaridade`, `nomeDoVeiculoDeColecao`; peças novas
  (`PINTURAS_129`, `ACABAMENTO_129`, `RODAS_CARRO_129`, `RODAS_MOTO_129`, `DETALHES_CARRO_129`), compatibilidade
  (`opcaoServe`, `pecaServe`), `visualDasMods` (mods → o que o desenho mostra), `chaveDoVisual`.
- `dados/bens.ts`: campo opcional `producao?` em `VersaoVeiculo`; a lista antiga virou `VERSOES_DE_ANTES` e
  `VERSOES_VEICULO = [...VERSOES_DE_ANTES, ...VERSOES_VEICULO_129]` (um import + uma linha).
- `dados/personalizacaoVeiculo.ts`: espalha as cores novas na Pintura; carro ganha Acabamento, rodas novas, Teto, Faixas, Aerofólio;
  moto ganha Acabamento e Rodas. Ids antigos intactos.
- `sistemas/versoesVeiculo.ts: versaoParaVeiculoAntigo` sorteia só entre as versões de antes (save v≤13 sem versão não muda de modelo).
- `sistemas/colecao.ts: colecoesDaVida` (bugs acima).
- `sistemas/personalizacao.ts` (veiculo_peca): recusa opção que não serve na forma ("Não serve neste veículo." — roda off-road só em
  SUV/picape; aerofólio só em compacto/hatch/sedã/esportivo).
- `vite.config.ts`: `veiculos129` na regex do `motor-casa` (Edit pontual).
- UI desenho: `ui/ilustracao/nucleo.tsx` (pneu: `corAro`, `aroMaior`; sem eles, idêntico a antes); `carros.ts` (`PerfilCarro.extras`,
  `rodas:'raios'`, `carro(p, cor, estado, visual?)`, lookup em `MODELOS_CARRO_129`); `duasRodas.ts` (perfis novos: maxi, vespa,
  robusta, farol duplo, escape duplo, custom, baixa, asas; trail com aro/farol/bagageiro/carenagem; `moto(..., visual?)`);
  **NOVO `ui/ilustracao/veiculos129.ts`** (perfis dos 52 carros e 16 motos novos; acabamento, extras de modelo — aletas, asa,
  cromados, tomadas, estepe, faixas —, película); `veiculos.tsx` (`visualDoVeiculo`, prop `mods`, chave de cache).
- `ui/jogo/material/Desenhos.tsx: DesenhoVeiculo` prop `mods`; passado em Pertences, Oficina (Lugares), vitrine da Oficina (Compras).
- **NOVO `ui/jogo/Garagem129.tsx` (lazy, 6,4 kB) + `ui/garagem129.css`**: a garagem à vista — resumo (valor, custo/mês, nº de coleção),
  cena com os veículos lado a lado (os de coleção com brilho), filtros (Todos/Em uso/De coleção/Guardados longe/Parados — só os que
  existem), ordem (valor/ano/raridade/nome), cartões com desenho (cor, rodas, acabamento), vale hoje, custou (±%), por mês, estado,
  onde, desde, selos (principal/coleção/clássico/grau), fundamento da raridade, peças feitas, história recolhível, "Personalizar"
  (abre o painel já no veículo). `Patrimonio.tsx`: a tabela foi substituída por `GaragemVisual` (sem rolagem horizontal).
- `ui/jogo/Personalizar.tsx: PersonalizarVeiculos` (props `inicial`, `aoFechar`), `PainelDoVeiculo` (desenho do estado atual; só peças
  que servem na forma), `PecaDoVeiculo` (opções compatíveis; prévia desenhada "como ficaria").

## Catálogo novo (68; total 183)
Motos (16): NMax 160, Vespa Primavera 150, XRE 190, XTZ 250 Lander, Interceptor 650, Himalayan 450, Z900, MT-09, Street Triple 765 RS,
Africa Twin, Multistrada V4 S, Fat Boy 114, Indian Scout, S 1000 RR, Fireblade SP, Panigale V4 Superleggera (limitada 500).
Esportivos/luxo (15): MX-5, GR86, Golf GTI, Civic Type R, GR Supra, Corvette Stingray (só Am. do Norte), 718 Cayman, M4, Taycan,
Cayenne, X5, S 500, Range Rover, G 63, Escalade. Superesportivos/hiperluxo (14): 296 GTB, Purosangue, Urus SE, Revuelto, DB12,
AMG GT 63, Bentayga, Spectre, Phantom; limitadas: 911 Dakar (2.500), 911 S/T (1.963), Huracán Sterrato (1.499), SF90 XX Stradale (799),
Bentley Mulliner Bacalar (12). Clássicos (23): SP2, Interlagos, Puma GTE, Maverick GT, Charger R/T, Brasília, Landau, Bandeirante,
Mini Cooper S, Fiat 500 L, 2CV, Bel Air, Eldorado Biarritz, 240Z, M3 E30, Delta Integrale, Corvette '63 Split-Window, Shelby GT500,
Testarossa, 911 Carrera RS 2.7, Countach LP5000 QV, 2000GT, 300 SL Asa de Gaivota. `producao` só onde o número é de conhecimento geral
(ex.: 2000GT 351, 300 SL 1.400, Countach QV 610, Interlagos 822, RS 2.7 1.580, GT500 '67 2.048); os demais ficam sem número (classe decide).
Preços: referência em R$ de 2026 (catálogo no Brasil com importação; clássico = exemplar em bom estado) — plausíveis, não cotação.

Distribuição de graus no catálogo inteiro (sim `x-veiculos/sim.ts`): comum 130, incomum 36, rara 7, muito rara 3, limitada 7.
Dos 19 itens ≥ R$ 5 mi, só 4 são limitada/rara/muito rara — os demais (Rolls, Maybach, jatos, iates) ficam comum/incomum.

## Saves
Nenhum campo novo obrigatório; nada de normalizador. `mods` continua `Record<string,string>` (ids novos só quando a pessoa faz a peça).
Veículo antigo: carrega idêntico (teste) e desenha idêntico (sem visual quando não há peça estética nova). Migração v13 estável (teste).

## Testes (reais)
- NOVO `src/motor/__tests__/vida129Veiculos.test.ts`: 10/10 passando (catálogo íntegro; lojas; migração estável; raridade por dados;
  nome/grau/fundamento na coleção; peças persistem no save e aparecem no desenho; cada acabamento/roda dá desenho distinto em carro e
  moto; incompatíveis recusadas; save antigo igual).
- `src/ui/__tests__/rework12.test.tsx`: ajustado (a mudança pedida): a "tabela lado a lado" virou a região "Seus veículos, expostos"
  (espera o carregamento sob demanda com `findByRole`).
- Relacionados (motor): rework124, rework12, vida128, veiculos4, aeronaves, fixPosRework4 passaram (7 arquivos); att3, fix4,
  fixPosPlaytestHumano tiveram 5 timeouts de 20 s com a máquina cheia e passaram ao rodar de novo sozinhos (159/159, testTimeout 120 s).
  UI: rework12, rework8b (todo carro com desenho único; motos únicas por forma), desenhos, visuaisIcones, fixPosRework3, rework124,
  rework7 — 72/72.
- Typecheck: limpo nos meus arquivos (erros só em `ui/avatar/tatuagens129.tsx`, de outra frente, no momento).

## Visual (Playwright, imagens olhadas)
`/home/iego_ossi/vida-trabalho/a129/x-veiculos/`: `carros1.png` (todos os carros novos 150 px), `carros2.png` (300 px), `outros.png`
(SUVs e motos), `mods.png`/`mods3.png` (cada peça em hatch, picape, esportivo e moto), `garagem-1100.png` e `garagem-390.png`
(garagem + painel; 390 px sem rolagem horizontal). Ajuste feito após olhar: narizes em cunha (capô > 100) faziam o farol escapar da
lataria; faixas e véus do acabamento cruzavam a caixa de roda — agora recortados pela lataria e interrompidos no arco.

## Pacotes (build próprio `dist-veiculos`)
motor-casa 126,1 kB (catálogo novo aqui); Garagem129 6,4 kB (lazy); Personalizar 83,4 kB; Jogo 614,6 kB; motor-patrimonio 170,4.
**ATENÇÃO integrador:** no build com o diretório compartilhado, motor-dados saiu 832,4 kB e motor 799,4 kB — acima/rente ao limite.
A minha parte em motor-dados é mínima (import + 1 linha em `bens.ts`, 5 espalhamentos em `personalizacaoVeiculo.ts`, ~0,3 kB); o
catálogo inteiro (68 versões + peças) está em motor-casa (conferido: "Mulliner Bacalar" só no motor-casa). O excesso vem de outras
frentes. Também há avisos "Circular chunk" (acontecimentos/carreira/patrimonio/textos/vida) que não envolvem módulos meus
(colecao/personalizacao já estavam em motor-patrimonio).

## Limitações honestas
- Sem motos clássicas: não há classe de moto com segmento clássico (criar classe mexe em motor-dados e no mercado). 
- As edições limitadas novas aparecem como "zero" na garagem de colecionador (como o 765LT já aparecia), mesmo que na vida real
  estejam esgotadas; o preço é referência, não cotação.
- Motos grandes usadas continuam sem anúncio de usado (regra antiga do mercado, não mexida).
- A cena da casa (carro na porta) ainda desenha sem as peças (só garagem, pertences, oficina e painel mostram).
- Rebaixar suspensão/remap não mudam o desenho (funcionais). Película reaproveita a opção existente "película e engate".
- Não verifiquei no app real em produção (smoke do itch é do integrador); a garagem foi renderizada estaticamente com o CSS do jogo
  (sem `patrimonio.css` na captura, por isso os selos aparecem sem pílula ali).
