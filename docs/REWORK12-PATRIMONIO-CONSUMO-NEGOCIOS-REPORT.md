# REWORK 12 — Patrimônio, consumo e negócios · relatório final

## 1. Resumo executivo

O REWORK 12 aprofunda imóveis, veículos, consumo, coleção e negócios, e dá ao jogador um painel patrimonial que separa o
que ele **tem** do que ele **pode pagar agora**. A regra-mãe foi a da filosofia pedida: enriquecer custa decisões,
nada rende sem custo, nenhum ciclo de compra e revenda cria dinheiro, e perder dinheiro abre caminhos (renegociar,
vender, cortar, fechar) em vez de encerrar a vida.

O que mudou, em uma linha cada:

- **Imóveis**: o preço sai do aluguel da cidade pelo rendimento do mercado (região, porte, país, tipo, bairro); cobertura
  e mansão; imóvel vazio paga imposto e condomínio; aluguel recebido paga imposto; imobiliária ou administração própria;
  calote vira decisão; o banco conta 70% do aluguel e não financia mais de dois imóveis ao mesmo tempo.
- **Veículos**: catálogo por mercado (o Mobi no Brasil, a F-150 nos EUA, o Sandero na Europa), preço local de bem
  importável (um Corolla custa ~US$ 25 mil nos EUA, não US$ 72 mil), superesportivos, altíssimo luxo, clássicos e edição
  limitada; **mudar de país não vende mais o veículo** — ele fica guardado, com a história, e dá para trazê-lo (frete e
  nacionalização, quando o país deixa) ou vendê-lo de longe; veículo principal; restauração de clássico.
- **Coleção**: relógios, joias, arte, antiguidades e memorabilia esportiva (clubes do país; a camisa do próprio título),
  com raridade, procedência, certificado, mercado por categoria e venda rápida ou em leilão.
- **Empresas paralelas**: oito tipos com modelos próprios (restaurante, clínica, academia, estúdio, hotel, loja, museu,
  zoológico); dono, sócio ou investidor; gestão própria (pede a semana) ou contratada; caixa separado da pessoa;
  distribuição só do lucro; crise, aval e falência só depois de anos no vermelho; museu com acervo e patrocínio,
  zoológico com bem-estar animal, fiscalização e programa de conservação.
- **Painel patrimonial**: Vida · Patrimônio em seis partes (Resumo, Imóveis, Garagem, Coleção, Empresas, Objetos).
- **Acontecimentos**: oito novos, dentro do motor de acontecimentos existente.

## 2. Branch e commits

Branch `claude/rework12-patrimonio-consumo-negocios`, criada de `main` = `ac0726b` (a mesma de `origin/main`). Nada foi
enviado ao remoto.

| Commit | Conteúdo |
|---|---|
| `e2cc6fe` | Fases B–F (motor): preços de imóveis, catálogo regional de veículos, exóticos e clássicos, veículos guardados na mudança, coleção, empresas, balanço |
| `b30fca0` | Fase I (motor): acontecimentos, herança, normalizador, calibração, rendimento regional, testes antigos ajustados |
| `56d202f` | Fase H: telas (Patrimônio em partes, lojas de peças, garagem de colecionador, antes de decidir), notas 12, testes |
| `a031d79` | Fase J: desenhos de cobertura e mansão, motos/bicicletas novas, coleção e empresas na mudança de país, vender um quarto, roteiro de QA, simulações |
| `d5107c3` | Fase J: correções do QA visual, calibração final das empresas |
| (este) | relatório final |


## 3. Auditoria inicial (Fase A) e sistemas reaproveitados

| Sistema | O que havia | Situação | O que o REWORK 12 fez |
|---|---|---|---|
| Imóveis (`sistemas/imoveis`, `mercado`) | compra, aluguel para terceiros, reparos espaçados, venda | funcionava | **corrigido** o preço (base independente do aluguel → rendimentos de 3% a 15% sem razão); custos de imóvel vazio; administração; calote; valor puxado para o de mercado |
| Financiamento (`acoes.condicoesImovel`, `obrigacoes`) | Price, entrada mínima, 30%/45% da renda, amortização, renegociação, retomada | funcionava | limite de 2 financiamentos de imóvel; aluguel a 70% na renda de crédito |
| Veículos (`dados/bens`, `veiculos`) | classes + versões reais, depreciação, problemas, oficina | funcionava | mercado por país, preço local de importável, exóticos/clássicos, principal, trazer, restaurar |
| Migração (`migracao`) | **vendia os veículos à força** | bug | veículos ficam guardados; coleção e empresas re-expressas no câmbio |
| Negócio próprio (`negocio`, `gestao`) | dono-operador com equipe, estratégia, modo paralelo | funcionava | mantido; as empresas novas são um sistema à parte (participação, gestão contratada) |
| Balanço (`dinheiro.balanco`) | ativos − obrigações, sem dupla contagem do financiamento | funcionava | + coleção, + participações (avaliação × parte, caixa já dentro) |
| Coisas e estilo (`coisas`, `estilo`) | bens de uso e acessórios | funcionava | não mexido (a coleção é outra coisa: valor de mercado, não uso) |
| Herança (`sucessao`) | inventário de conta, aplicações, bens, negócio | funcionava | + coleção e participações (vendidas no inventário) |
| Partilha (`partilha`) | metade do construído junto, pelo balanço | funcionava | passa a incluir coleção e empresas (via balanço), sem transferir objetos automaticamente |
| Acontecimentos (`conteudo/*`, fila do 11.5) | motor com prioridade, fila e teto | funcionava | 8 conteúdos novos em `conteudo/acontecimentos12.ts`, no `CATALOGO` |

## 4. Funcionalidades implementadas

### 4.1 Imóveis (`sistemas/precos.ts`, `mercado.ts`, `imoveis.ts`)
- `rendimentoDoMercado`: rendimento bruto de referência por porte (metrópole 4,5% … cidade média 4,8%), região no
  Brasil (Nordeste +0,9 p.p., Norte +0,7, Sul −0,3) e país (moradia cara comprime; campo opcional `rendimentoAluguel`).
- Preço = aluguel de referência × 12 ÷ rendimento × (preço do tipo ÷ dois quartos) × índice imobiliário.
- Bairro com índice (nobre 1,5 … fora da mancha urbana 0,62) e **sensibilidade por tipo** (alto padrão 1,3, cobertura
  1,35, mansão 1,5); cada tipo aparece só nos bairros que fazem sentido. A mansão afastada vale menos que o alto padrão
  no bairro nobre (teste).
- Cobertura e mansão novas (com desenho próprio na cena e na miniatura).
- Valor anual: o mercado e o acaso, puxado 12%/ano para o valor justo (tipo, cidade, bairro, estado).
- Imobiliária (10%, vacância 10%, calote raro) × administração própria (sem taxa, vacância 16% e mais longa, calote 7%).
- Custos de investimento (`PATRIMONIO_NO_MES`): imposto e manutenção; condomínio quando vazio; imposto sobre o aluguel.

### 4.2 Veículos
- `versoesNoPais` (cada versão declara `mercados`; classe sem versão local herda todas), `precoNovoNoPais` com
  `fatorDeImportado` (imposto do país ÷ imposto do Brasil ÷ nível de preços).
- 41 versões novas: bicicletas e motos de outros mercados, motos grandes, compactos/sedãs/SUVs/picapes estrangeiros,
  5 superesportivos (1 edição limitada), 4 de altíssimo luxo, 8 clássicos.
- Garagem de colecionador (metrópoles e capitais); a concessionária não vende exótico nem clássico.
- Clássico: valor = exemplar × mercado de clássicos (índice mundial determinístico, ~1% ao ano, ±7%) × estado;
  exótico: depreciação forte no começo, piso alto; edição limitada: piso e mercado de colecionador. Nada garantido.
- Mudança de país: veículo `local` = cidade de antes, parado, com linha na história; `trazer` (frete + nacionalização;
  o Brasil só aceita usado de coleção, 30+ anos); venda de longe com desconto; `principal`; `restaurar`.

### 4.3 Coleção (`dados/colecionaveis.ts`, `sistemas/colecao.ts`)
- 29 peças, 6 lojas (relojoaria, joalheria, galeria, antiquário, memorabilia, casa de leilões); lista de espera por
  patrimônio (Daytona, Nautilus).
- Retenção de valor por peça (a loja fica com a margem), tendência e oscilação por peça, choque anual por categoria.
- Venda rápida (70%) ou leilão (85% × acaso); peça sem certificado vale menos; a tela do artista novo pode acontecer
  (6%) ou sumir (14%) uma vez.
- Memorabilia com clubes e anos do país; a camisa do título de quem foi protagonista entra com procedência própria.
- Seguro e guarda acima de R$ 80 mil (0,4% ao ano); gosto da compra decrescente por peça igual; identidade de
  colecionador a partir de 5 peças. Nenhum atributo melhora por comprar.

### 4.4 Empresas (`dados/empresas.ts`, `sistemas/empresas.ts`)
- Modelos diferentes por tipo: restaurante (margem fina, concorrência), clínica (responsável técnico; o médico dono
  economiza o salário), academia (carteira com evasão), estúdio (o nome do músico atrai), hotel (turismo, ciclo forte,
  obra de um ano), loja (mercadoria leva 2/3), museu (acervo, conservação, exposição, patrocínio, peças cedidas da
  coleção), zoológico (bem-estar, equipe, fiscalização, interdição, conservação, transferência dos animais ao fechar).
- Papéis: dono, sócio (meio a meio), investidor (participações à venda, sem decisão).
- Gestão própria (blocos na agenda e peso na semana; competência cresce com os anos até um teto) ou contratada
  (competência sorteada, salário pelo porte, só se revela com o tempo; o gestor fraco pode desviar).
- Decisões: assumir/contratar gestor, reformar, contratar, cortar, expandir, preço, distribuir/reinvestir, aportar,
  vender um quarto, vender tudo, fechar, exposição, recintos, conservação.
- Distribuição só do lucro acumulado acima de dois meses de custo; caixa negativo paga juros; crise após um ano no
  vermelho; falência só com 3+ anos e caixa < −50% do custo anual; aval parcial vira acordo parcelado em 48 meses.
- Avaliação = maior entre liquidação e 4,5× o lucro médio recente (+ caixa), nunca negativa.

### 4.5 Painel patrimonial e telas (`ui/jogo/Patrimonio.tsx`, `ui/leituraPatrimonio.ts`, `ui/patrimonio.css`)
- Resumo: disponível, investido, imóveis, veículos, coleção, empresas, caixa do negócio, dívidas, líquido; "Ter não é
  poder pagar agora" (liquidez em meses e a frase "rico em patrimônio, curto de caixa"); o que o patrimônio põe na
  conta e o que custa por mês; evolução ano a ano só dos anos fotografados (nada inventado); balanço em barras.
- Imóveis (rendimento, administração), Garagem (tabela comparativa, guardados, lojas), Coleção (peças, venda com
  confirmação, ceder ao museu, lojas), Empresas (números do último ano, decisões, saída com confirmação, abrir, comprar
  participação), Objetos.
- Compras: grupo "Luxo e coleção" e a garagem de colecionador, com fachadas existentes; "Antes de decidir" no imóvel e
  no veículo (custo por mês, preço por m², rendimento bruto e líquido estimado, valor em 3 anos, riscos, sem promessa).
- Abas com `role=tablist` e setas do teclado; sem animações novas (movimento reduzido intacto).

### 4.6 Integração
- **Família**: partilha na separação pelo balanço (inclui coleção e empresas); nenhum bem muda de dono sozinho.
- **Carreira**: empresa não tira o emprego; a gestão própria entra na semana e na agenda; o médico, o músico e quem é do
  ramo administram melhor (clínica, estúdio).
- **Mudança de país**: veículos guardados; imóveis ficam; empresas ficam (gestão passa a contratada); coleção e empresas
  re-expressas no câmbio (`redenominar`).
- **Acontecimentos** (`conteudo/acontecimentos12.ts`): calote, empresa no vermelho, gestor que não presta conta,
  proposta de compra, veículo guardado longe, colecionador pelo clássico, doação ao museu, filhote do programa de
  conservação. `quando` sem sorteio; prioridade e intervalo controlam a frequência; a fila do 11.5 decide a vez.
- **Herança**: coleção e participações entram no inventário (vendidas pelo espólio).
- **Notas da versão** `12` em `ui/novidades.ts`.

## 5. Mudanças no balanceamento econômico

| Item | Antes | Depois |
|---|---|---|
| Apto 2q São Paulo (bairro comum) | ~R$ 511 mil | ~R$ 640 mil (rend. 4,4%) |
| Apto 2q Recife | ~R$ 375 mil | ~R$ 428 mil (rend. 5,3%) |
| Apto 2q cidade pequena do Nordeste | ~R$ 183 mil | ~R$ 140–185 mil |
| Corolla em Nova York | ~US$ 72 mil | ~US$ 25 mil |
| Corolla em Berlim | ~€ 51 mil | ~€ 28 mil |
| Imóvel vazio | sem custo | imposto + manutenção + condomínio |
| Aluguel recebido | integral, sem imposto | − imobiliária (opcional) − 12% de imposto |
| Crédito com aluguel recebido | 100% conta como renda | 70%; no máximo 2 financiamentos de imóvel |
| Coleção valiosa | — | seguro e guarda de 0,4% ao ano |

Rendimento bruto do dois quartos medido em 26 cidades de 13 países: 3,6% (Londres, Sydney) a 5,1% (Soweto,
Avellaneda); alto padrão ~2,4–3,4%; mansão ~2%. (`scripts/sim/precos12.ts`)

## 6. Resultados das simulações

### 6.1 Empresas, 20 vidas por tipo, 12 anos, São Paulo (`scripts/sim/empresas12.ts`)
Múltiplo = (recebido + valor da parte no fim) ÷ investido.

| Tipo | Passivo: faliu | Passivo: múltiplo p10/p50/p90 | Dono que cuida*: faliu | Cuida: p10/p50/p90 |
|---|---|---|---|---|
| Restaurante | 5% | 0,00 / 0,03 / 2,05 | 0% | 0,26 / 1,08 / 5,20 |
| Clínica | 10% | 0,14 / 0,79 / 2,20 | 25% | 0,07 / 1,37 / 3,46 |
| Academia | 15% | 0,08 / 0,98 / 2,84 | 10% | 0,49 / 1,34 / 3,09 |
| Estúdio | 10% | 0,25 / 0,96 / 2,01 | 15% | 0,45 / 1,37 / 3,12 |
| Hotel | 5% | 0,42 / 1,05 / 1,49 | 5% | 0,78 / 1,48 / 1,92 |
| Loja | 5% | 0,00 / 0,27 / 1,52 | 5% | 0,12 / 1,55 / 3,73 |
| Museu | 35% | 0,00 / 0,11 / 0,48 | 0% | 0,23 / 0,29 / 0,85 |
| Zoológico | 20% | 0,00 / 0,21 / 0,96 | 20% | 0,00 / 0,46 / 1,56 |

\* aporta quando a empresa entra em crise e reforma a cada cinco anos.
Leitura: nenhum tipo tem lucro garantido; quem cuida ganha mais na mediana e perde menos no p10; museu e zoológico são
negócios de prestígio que pedem mecenas. Na calibração, duas versões foram descartadas: uma em que tudo dava 3–14× o
capital e outra em que academia, museu e zoológico quebravam 100%.

### 6.2 Trajetórias de 25 anos (30→55), 12 vidas por perfil (`scripts/sim/trajetorias12.ts`)

| Perfil | Líquido p10 / p50 / p90 | Liquidez p50 | Cresc. real/ano p50 | Anos "no vermelho" p50 (p90) | Empresas / faliram | Anomalias |
|---|---|---|---|---|---|---|
| Baixa renda (Recife, R$ 3 mil) | 21k / 81k / 291k | 58k | 14,1% (base pequena) | 6 (6) | — | 0 |
| Renda média (financia a casa) | 33k / 121k / 352k | 37k | 5,7% | 6 (10) | — | 0 |
| Alta renda | 11k / 767k / 2,5 mi | 767k | 6,7% | 0 (6) | — | 0 |
| Investidor imobiliário | 349k / 1,9 mi / 3,0 mi | 202k | 6,4% | 3 (6) | — | 0 |
| Empreendedor (toca ele mesmo um restaurante) | 4,3 mi / 6,7 mi / 7,8 mi | 4,0 mi | 8,4% | 0 (1) | 12 / 0 | 0 |
| Médico com clínica (sócio, gestor contratado) | −477k / 243k / 3,8 mi | 158k | −3,1% | 0 (6) | 11 / 5 | 0 |
| Endividado | −10k / 39k / 386k | 14k | 4,2% | 7 (12) | — | 0 |
| Muito rico (exóticos, coleção, museu) | 73 mi / 88 mi / 109 mi | 72 mi | 1,6% | 0 (0) | 10 / 5 | 0 |

Rodada final (`N=12`, com a calibração final das empresas), repetida depois da suíte: resultados idênticos.

Invariantes verificados em todas as vidas: nenhum NaN, nenhum patrimônio > 10¹², nenhuma despesa positiva no razão.
Trajetórias distintas e plausíveis; ninguém termina igual. O endividado fica 7 anos "no vermelho" na mediana mas não é
eliminado; o muito rico cresce pouco (consumo e museu caros).

### 6.3 Recuperação (alta renda, choque no ano 3, 10 anos depois; "voltou" = líquido ≥ 80% do de antes)

| Choque | Voltou | Logo depois do choque (p50) |
|---|---|---|
| Perda de emprego (recontratado como assistente) | 4/12 | 100% |
| Empresa no vermelho (−R$ 400 mil; fechada no ano seguinte) | 11/12 | 100% |
| Financiamento pesado (o imóvel mais caro que o banco aceita) | 11/12 | 95% |
| Venda na baixa (peça comprada e vendida na hora) | 11/12 | 99% |
| Despesa familiar inesperada (−R$ 120 mil) | 11/12 | 58% |

A recuperação é possível e não é garantida (o desemprego com recolocação pior é o que mais custa).

## 7. Testes

- `src/motor/__tests__/rework12.test.ts` — 28 testes cobrindo os 18 itens obrigatórios: compra e venda de imóveis;
  aluguel e vacância (e calote fora da renda); financiamento e limite de 2; vários imóveis no balanço; compra e venda de
  veículos; mudança de país mantendo o veículo (com regra de importação do Brasil); depreciação e índice de clássicos
  não monótono; coleção (margem, réplica, leilão, valor sem explosão em 30 anos, seguro); empresa ao lado da carreira
  (emprego mantido, semana); distribuição só do lucro; tipos com modelos distintos; falência só com anos no vermelho e
  aval parcelado; venda e encerramento (zoológico transfere animais); participação (investidor não decide; comprar e
  vender perde); liquidez × patrimônio; acontecimentos no `CATALOGO`; save antigo, normalizador idempotente e versão 20;
  herança; exploits (nenhum ciclo cria dinheiro; nenhuma saída positiva); coleção e empresa no câmbio; vender um quarto.
- `src/ui/__tests__/rework12.test.tsx` — 4 testes de tela: as seis partes como abas (teclado), resumo com liquidez,
  garagem em tabela, venda confirmada da peça, decisões e saída da empresa, loja de peças, garagem de colecionador,
  "Antes de decidir" do imóvel.
- Testes antigos ajustados (regra nova ou semente deslocada pelos preços novos — sempre com comentário no teste):
  `att3` (oferta financiável; teto do conserto pelo preço local), `veiculos4` (catálogo por país e colecionador),
  `fix4` (a cena da metrópole fixa a cidade), `fix2` (luto medido na média de 3 vidas, não em 1 semente), `rework10`
  (a cena da velhice começa sem os acontecimentos já vistos), `rework7` (grupo "Luxo e coleção"), `casas` e
  `rework8b` (desenhos novos).
- Suíte completa (Linux, `--maxWorkers=3 --testTimeout=400000`): **ver §7.1**.
- Typecheck (`tsc --noEmit`): limpo.

### 7.1 Suíte completa final
**114 arquivos, 1934 testes, todos passando** (458 s). Inclui os 32 testes novos do REWORK 12. Typecheck limpo.

## 8. Compatibilidade de saves
Save continua **v20**. Só campos opcionais: `Financas.colecao/empresas/veiculoPrincipal`, `Veiculo.local`,
`Imovel.administracao/calote/indiceBairro`. `normalizarRework12` (idempotente) preenche o índice do bairro pelo texto
da oferta, devolve à pessoa o veículo "guardado" na cidade onde ela já mora, esquece o principal que não existe. Nada é
apagado nem reavaliado no carregamento. Testado: save sem os campos carrega; ida e volta preserva coleção e empresas;
normalizar duas vezes = uma.

## 9. QA visual e mobile
Roteiro `scripts/playtest/rework12.mjs` (geometria, contraste < 3:1, rolagem horizontal, alvos < 44 px a 390) com saves
de `scripts/playtest/gerarRework12.ts` (rica: cobertura, alugados, superesportivo, clássico, coleção, restaurante,
museu com peça cedida, participação de hotel; média: tudo financiado, pouca reserva; guardado: carro em São Paulo,
pessoa em Lisboa). 10 cenas × 4 paletas × (1440, 390, 360, 390×560).

- 1ª rodada: 0 sobreposição de texto, 0 rolagem horizontal, 0 estouro de borda; 7 achados de contraste (o bloco
  "Empresas" do balanço nos temas escuro e atlântico, 2,82–2,90; o motivo da oferta na garagem de colecionador no claro a
  390, 2,80); a cena "antes de decidir" não abriu (passo do roteiro errado); 220 alvos < 44 px (seletores das lojas e o
  "Vender…"). Na captura apareceu também a frase errada na garagem de colecionador (a da loja de motos).
- Corrigido e refeito só o que estava pendente (3 cenas × 4 paletas; e coleção/empresas/antes de decidir no claro para
  os alvos): **0 problemas, 0 alvos < 44 px**.
- Observação de processo: a primeira espera pelos relatórios travou por erro meu (a condição também exigia um marcador
  `FIM` que a segunda rodada das trajetórias não gravava); os relatórios já existiam e foram reaproveitados.

## 10. Build, itch.io e PWA
- `npm run build`: ok. Pacotes (limite 800 kB, não alterado): motor 732,5 kB; **motor-textos 764,4 kB (não cresceu)**;
  motor-dados 550,2 kB; Jogo 674,8 kB; motor-patrimonio (novo) 27,9 kB; motor-acontecimentos 142,3 kB.
- `npm run build:itch` + `smoke:itch`: **21/21**.
- PWA offline (`scripts/pwa/offline.mjs`): **36/36**.

## 11. Problemas corrigidos
1. Aluguel e preço de imóvel desproporcionais (bases independentes).
2. Veículos vendidos à força na mudança de país.
3. Carros com preço de paridade no exterior (~3× o real nos EUA).
4. Imóvel vazio sem custo (guardar riqueza de graça) e aluguel recebido sem imposto.
5. Crédito: cada imóvel alugado financiava o próximo sem limite.
6. Mansão afastada mais cara que o luxo bem localizado (não havia mansão; a regra de bairro agora pesa por tipo).
7. Coleção e empresas não atravessavam a fronteira no câmbio (achado na revisão; corrigido e testado).
8. Garagem de colecionador com a frase da loja de motos (achado no QA).

## 12. Pendências e riscos
- **Gestão própria rende muito e com pouca dispersão**: o empreendedor que toca o próprio restaurante (e aporta nas
  crises, reforma a cada 5 anos) chegou a R$ 4,3–7,8 mi em 25 anos partindo de R$ 900 mil, 12/12 sem falência — em
  parte é a renda do trabalho do dono (noites e sábados, sem salário de gestor), mas a dispersão baixa pede uma
  calibração fina (mais concorrência ou teto de público menor para quem toca). Com gestor contratado, a mesma empresa
  fica em ~1,1× em 12 anos (§6.1).
- O médico sócio de clínica com gestor contratado perde na mediana (5 de 11 clínicas faliram em 25 anos): coerente com
  a régua (passivo raramente lucra), mas vale um playtest humano.
- Pessoa em baixa renda e de renda média: 6 anos "no vermelho" na mediana em 25 — herdado da economia anterior; não
  recalibrado aqui.
- Preços de imóveis em cidades estrangeiras herdam o aluguel de referência do perfil do país (Berlim e Nova York com
  aluguéis baixos para a realidade); o rendimento agora é coerente, o nível absoluto não foi recalibrado.
- O veículo numa mudança DENTRO do país continua indo junto, sem custo (barco e avião inclusive).
- A herança converte coleção e empresas em dinheiro (o herdeiro não recebe as peças nem a empresa).
- Empresas não têm funcionários-pessoa (equipe é um número); o negócio do dono-operador antigo continua separado.
- Pendências herdadas do REWORK 11.5, preservadas: bloco curto de trajeto com alvo de toque pequeno; balanceamento
  excepcional de atores; frequência de músicos milionários; teste em celular real; APK não regenerado; playtest humano
  de múltiplos acontecimentos; margem do `motor-textos` (agora 764 kB, 36 kB de folga — este pacote não cresceu).
- `motor.test` (regra de agência) tem timeout fixo de 60 s e estoura só sob carga da suíte paralela; passa isolado.

## 13. Preparação para o REWORK 12.2 (hobbies → profissões)
- A coleção já tem identidade de colecionador (`colecionador_<categoria>`) e lojas por especialidade: um hobby de
  colecionar pode virar ofício (avaliador, leiloeiro, galerista) lendo `financas.colecao` e as procedências.
- O estúdio já usa o nome do músico; o museu, peças da coleção: o 12.2 pode ligar prática → empresa sem sistema novo.
- `doRamo` (empresas) é o ponto para "quem praticou por anos administra melhor".

## 14. Execução com agente único
Todo o trabalho foi feito pelo agente principal, sequencialmente, nesta branch. **Nenhum subagente, nenhum Agent Team,
nenhuma worktree paralela** (as cópias em `~/vida-copia` e `~/vida-trabalho` são só cópias de teste em disco Linux).

## 15. Merge e deploy
**Nenhum push, merge ou deploy.** A `main` local e remota continuam em `ac0726b`. APK não gerado. Aguardando
autorização explícita para publicar.
