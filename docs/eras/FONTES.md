# ERAS HISTÓRICAS · Fontes e grau de certeza

Regra do projeto: nenhum dado é inventado. Cada dado do protótipo está numa destas três classes:

- **Série oficial** — número baixado da fonte primária e gravado sem edição.
- **Fato documentado** — data, nome, cargo, lei ou acontecimento com fonte citada no próprio dado (`fonte`).
- **Aproximação de jogo** — simplificação declarada como tal no código e aqui (não aparece ao jogador como fato).

## 1. Séries oficiais (`src/motor/eras/base/series.ts`, gerado)

| Série | Fonte | Uso |
|---|---|---|
| IPCA, número-índice mensal, dez/1979–dez/2025 | IBGE, SIDRA tabela 1737, variável 2266 (`apisidra.ibge.gov.br`), baixado em 13/11/2026 | nível de preços do mês → moeda da época; inflação do ano no motor |
| Salário mínimo vigente (nominal) | Ipeadata `MTE12_SALMIN12` (fonte primária: legislação federal/MTE) | painel "A época"; piso do salário no motor da vida histórica |
| PIB real, variação anual | Ipeadata `SCN10_PIBG10` (IBGE, Contas Nacionais); 2025 preliminar | fase da economia de cada ano (recessão, recuperação, expansão) |

Conferência: os acumulados anuais calculados da série batem com os oficiais do IBGE (1989: 1.972,91%; 1993: 2.477,15%; 1995: 22,41%; 2025: 4,26%) e o mínimo de maio de 1984 dá Cr$ 97.176. O teste `erasHistoricas.test.ts` confere esses valores.

## 2. Padrões monetários (`eras/base/moedas.ts`)

Banco Central do Brasil (quadro dos padrões monetários; Res. BACEN 1.689/1990); Decreto-Lei 2.283/1986 (cruzado); Lei 7.730/1989 (cruzado novo); Lei 8.024/1990 (cruzeiro); Lei 8.697/1993 (cruzeiro real); Lei 8.880/1994 e MP 542/1994 (URV e real, R$ 1 = CR$ 2.750).

## 3. Acontecimentos (`eras/dados/acontecimentosBR.ts`)

Cada um dos 53 acontecimentos (e as 8 Copas e 10 Olimpíadas) traz a fonte no campo `fonte`. Fontes usadas: Planalto (texto das leis e emendas: CF/1988, Leis 8.069/1990, 8.078/1990, 10.836/2004, 11.096/2005, 11.340/2006, 12.711/2012, 13.467/2017, 13.982/2020; ECs 16/1997, 103/2019, 132/2023), TSE (resultados das eleições de 1989 a 2022 e plebiscito de 1993), Câmara dos Deputados e Senado Federal (PEC 5/1983; impeachments de 1992 e 2016), Banco Central (planos econômicos, câmbio de 1999), CNEN (césio-137), Ministério da Saúde e Anvisa (covid-19), Anatel e BNDES (telefonia), governos estaduais e Defesa Civil (Mariana, Brumadinho, enchentes do RS), FIFA e COI (Copas e Jogos), Biblioteca Nacional (hemeroteca) e Arquivo Nacional.

Presidentes e datas de posse: Biblioteca da Presidência da República.

Plano Collor: MP 168/1990 → Lei 8.024/1990 (limite de NCz$ 50.000 por conta, retenção por 18 meses, devolução em 12 parcelas com correção e 6% a.a.).

Auxílio emergencial: Lei 13.982/2020 (R$ 600; R$ 1.200 para mães chefes de família) e MP 1.000/2020 (R$ 300 de setembro a dezembro).

## 4. Tecnologias (`eras/base/tecnologias.ts`)

Quatro datas por tecnologia: `lancada` (lançamento mundial), `brasil` (chegada ao Brasil), `popular` (classe média) e `massa` (maioria das casas). **Fatos documentados**: primeiro serviço celular no Rio de Janeiro em dezembro de 1990 (Telerj); internet comercial em 1995; privatização da Telebrás em 29/07/1998; TV digital em 02/12/2007; Pix em 16/11/2020 (BCB); orelhão a partir de 1972; primeira transmissão de rádio em 07/09/1922; TV em cores em 1972; encerramento da rede de comunidades (set/2014) e do mensageiro de computador (2013); primeiro streaming por assinatura em set/2011; reserva de mercado de informática (Lei 7.232/1984). **Aproximações declaradas**: os anos de `popular` e `massa`, lidos das tendências de IBGE/PNAD (bens duráveis), CGI.br/TIC Domicílios (computador, internet, celular desde 2005), Anatel (acessos) e Febraban (canais bancários). Cada vida desloca a adoção em até um ano (semente da vida), e a renda decide quem tem antes.

Plataformas das redes do jogo (`PLATAFORMAS_DESDE`): anos de uso no Brasil (aproximação quando a versão em português veio depois do lançamento).

## 5. Profissões, estudos, lojas, veículos

- Profissões (`eras/base/profissoes.ts`): transporte por aplicativo (maio/2014, Rio), ANEEL RN 482/2012, EC 104/2019 (polícias penais), PACS (1991), PSF (1994), Lei 10.097/2000; demais anos são aproximações declaradas.
- Estudos: ProUni (MP 213/2004 → Lei 11.096/2005), FIES (MP 1.827/1999 → Lei 10.260/2001), EAD (LDB art. 80; Decreto 2.494/1998), cotas federais (Lei 12.711/2012).
- Marcas e lojas (`MARCAS_DESDE`): históricos institucionais das empresas (chegada ao Brasil).
- Veículos (`eras/base/veiculos.ts`): anos de fabricação no Brasil pelos históricos das montadoras (Anfavea). Proibição de importar veículos novos até a abertura de 1990. **Preço: aproximação** pela faixa do modelo atual equivalente.

## 6. Cultura (`eras/dados/culturaBR.ts`)

Lembranças de gêneros, formatos, objetos e modas, sem obra, personagem ou marca protegida. Intervalos de anos: **aproximação** do auge no Brasil (hemeroteca da Biblioteca Nacional; MIS; IMS). Não são apresentadas como notícia nem têm efeito no motor.

## 7. Aproximações de simulação (declaradas no código)

1. **Unidade monetária**: o motor conta em reais de poder de compra de hoje; a moeda da época é só a apresentação (IPCA × cadeia oficial). Por isso nenhuma troca de moeda cria ou destrói dinheiro.
2. **Hiperinflação**: a perda do dinheiro parado é limitada a 25–40% ao ano (as famílias usavam poupança e overnight com correção monetária); o IPCA real aparece no painel.
3. **Plano Collor**: a devolução preserva o poder de compra (a correção oficial perdeu para a inflação; a perda real variou e não é simulada).
4. **Preço relativo da tecnologia**: 2,5× a referência enquanto é novidade de renda alta e 1,5× até virar coisa de todo mundo. É a curva de adoção, não uma tabela de preços.
5. **Renda real por época**: só o salário mínimo segue a série oficial; os demais salários continuam na escala de hoje (limitação desta versão).

---

# ERAS v2 (2026-11-15) · fontes novas

Classificação, como na v1: **[S]** série oficial · **[F]** fato documentado · **[A]** aproximação de jogo. Os dados brutos
baixados ficam fora do repositório (`~/vida-trabalho/eras2/fontes`); os scripts que geram os arquivos estão em
`scripts/eras2/` (cópia dos usados).

## 8. Economia histórica (`eras/base/economiaSeries.ts`, gerado; `eras/base/economia.ts`)

| Dado | Fonte | Período | Classe | Método / limitação |
|---|---|---|---|---|
| Rendimento médio real do trabalho | PNAD Contínua, Ipeadata `PNADC12_RRTH12` | 2012–2025 | S | média anual dos meses; 2025 = 1 |
| idem | PNAD (15+ com rendimento), SIDRA 5797 | 2004–2011 | S | emendada em 2012 (razão PNAD Contínua ÷ PNAD) |
| idem | PNAD (10+ com rendimento), SIDRA 1172 | 1992–2003 | S | emendada em 2004; 1994, 2000 e 2010 (sem PNAD): média geométrica dos vizinhos [A] |
| idem | PIB real (IBGE) ÷ população | 1970–1991 | A | população a 2,48% a.a. (1970–80) e 1,93% (1980–91), médias intercensitárias |
| Salário mínimo nominal | Ipeadata `MTE12_SALMIN12` (MTE/legislação) | 1969–2025 | S | já usado na v1 a partir de 1979; estendido |
| Prêmio de qualificação | literatura sobre a queda do diferencial de salário por escolaridade no Brasil (PNAD, meados 1990 → meados 2010) | — | A | 1,25 até 1995 → 1,0 em 2015, em linha reta |
| Distribuição dos salários por ocupação | composição dos três acima | — | A | interpolação log entre mínimo (≤ 1 SM de hoje), média (2,25 SM) e topo (≥ 10 SM) |
| Preços relativos por grupo/item | IPCA, SIDRA 1692, 58, 655, 2938, 1419 e 7060 (variação mensal por grupo e item) | jul/1989–dez/2025 | S | índice do grupo ÷ índice geral, média anual, dez/2025 = 1 |
| idem, antes de 1995 | — | 1970–1994 | A | o nível de 1995 (na hiperinflação a média anual de um índice relativo oscila com o calendário dos reajustes) |
| Itens tecnológicos (TV, celular, computador) | — | — | A | NÃO se usa o índice relativo do item (viés de qualidade constante e de encadeamento na hiperinflação: daria a TV de 1990 a 40× o preço de hoje); fica a curva de adoção da v1 com o piso do grupo "eletrodomésticos e equipamentos" |
| Automóvel | — | — | A | NÃO se usa o item "automóvel novo" (qualidade constante); os carros da época têm preço de catálogo em reais de hoje |
| Cesta básica de São Paulo | DIEESE, Ipeadata `DIEESE12_CBSP12` (nominal) | 1970–2025 | S | convertida pela cadeia oficial das moedas e pelo nível de preços do mês |
| Nível de preços antes do IPCA | IGP-DI (FGV), Ipeadata `IGP12_IGPDI12` | jan/1970–nov/1979 | A | encadeado no IPCA de dez/1979 (outro índice) |
| PIB 1970–1979 | IBGE (Contas Nacionais; Ipeadata) | 1970–1979 | S | taxa real anual |

Resultado (São Paulo, salário bruto em reais de hoje): caixa — 1990: 700; 1995: 830; 2010: 1.710; hoje: 2.140. Médico —
1985: 14.190; 1995: 18.860; 2004: 14.200; hoje: 18.790. A cesta básica custava 99% do mínimo em 1995 e 57% em 2025.

## 9. Partidos (`eras/base/partidos.ts`)

TSE (partidos registrados; históricos de fusões, incorporações e mudanças de nome), Lei 6.767/1979, EC 25/1985, CPDOC/FGV
(verbetes). 60 entradas de 1966 a 2025, com linhagem (`vira`). **[F]** para as datas marcadas `documentado`; **[A]** para as
marcadas `aproximado` (o ano é seguro; o mês, estimado). Lista não exaustiva: legendas de vida curta e sem representação
ficaram de fora. Conferência automática: em dez/2025 a lista histórica coincide com a de 2026 (`dados/partidos`).

## 10. Moda (`eras/base/moda.ts`, `ui/eras/pecasEras.ts`, `ui/eras/modaDaDecada.ts`)

Períodos de venda das peças **[A]**, lidos de acervos de moda (Museu da Moda/MIMo), revistas e catálogos de varejo da
Hemeroteca Digital da Biblioteca Nacional. Nenhuma marca real associada a peça. Cartelas de cor por década **[A]**.

## 11. Veículos (ERAS v2)

Medidas (comprimento, altura, entre-eixos) dos importados e grandes da época: fichas técnicas dos fabricantes **[F]**;
períodos de venda no Brasil **[A]** (abertura das importações em 1990 **[F]**). Ano da geração atual dos ~100 modelos de
hoje: lançamento da geração **[A]**. Preços em reais de hoje pela faixa equivalente **[A]**.

## 12. Leis, educação, cidades

- Casamento entre pessoas do mesmo gênero: STF, ADI 4277/ADPF 132 (05/05/2011); CNJ, Resolução 175 (14/05/2013) **[F]**.
- Divórcio: EC 9/1977 e Lei 6.515/1977; EC 66/2010 **[F]**.
- Crédito Educativo (CREDUC, 1976; Lei 8.436/1992) → FIES (MP 1.827/1999) **[F]**; no jogo, a mesma via com o nome da época.
- Metrô e trens urbanos: históricos institucionais das operadoras (Metrô-SP, MetrôRio, Trensurb, CBTU, Metrô-DF, CCR Metrô
  Bahia, Metrofor) **[F]**; meses marcados `aproximado` no código **[A]**.

## 13. Anos 1970

Acontecimentos com lei ou data oficial **[F]** (Lei 5.379/1967 e Mobral, transmissão em cores de 19/02/1972, Ponte
Rio–Niterói, metrô de SP, LC 20/1974, Decreto 76.593/1975, Lei 6.515/1977, Lei 6.683/1979, Lei 6.767/1979); Copas de 1970,
1974, 1978 e Jogos de 1972, 1976 e 1980 (FIFA, COI) **[F]**; lembranças culturais **[A]**. Moeda: cruzeiro novo
(13/02/1967) → cruzeiro (15/05/1970, Res. BACEN 144/1970, sem corte de zeros) **[F]**.

## 14. Rodada 2 (ERAS v2)

- Regras eleitorais: Emenda Constitucional 16/1997 (reeleição); eleição presidencial direta de 15/11/1989 **[F]**.
- Maioridade civil: Código Civil de 1916 (art. 9º) e Lei 10.406/2002, em vigor em 11/01/2003 **[F]**.
- Saúde: Lei 8.080/1990 (SUS), Lei 9.313/1996 (antirretrovirais), Lei 9.656/1998 (planos), Lei 9.787/1999 (genéricos),
  Portaria GM/MS 1.864/2003 (SAMU), Programa Nacional de Imunizações (Zé Gotinha, 1986) **[F]**.
- Orelhão: projeto de Chu Ming Silveira, instalado a partir de 1972 **[F]**; o recuo depois de 2010 **[A]** (Anatel registra
  a redução da planta de telefones públicos na década). Iluminação a vapor de sódio substituída por LED nas capitais ao longo
  dos anos 2010 **[A]**.
- Procura de emprego, cabelo da década, dinheiro do dia a dia (cheque, caixa 24 h, débito, banco pela internet, maquininha):
  períodos **[A]**, lidos das mesmas fontes de costumes (Hemeroteca Digital, acervos de moda; Febraban para meios de pagamento).

---

# ERAS v3 (2026-11-19) · fontes da expansão internacional e anterior a 1970

Classificação, como na v1/v2: **[S]** série oficial · **[F]** fato documentado · **[A]** aproximação de jogo. Os dados
brutos baixados ficam fora do repositório (`~/vida-trabalho/e3/fontes`, baixados em 18/11/2026); os scripts que geram os
arquivos estão em `scripts/eras3/` (`gerar_series.py`, `estender1900.py`, `mortalidade.py`).

## 15. Séries por país (`eras/paises/<id>/serie.ts`, geradas)

| Dado | Fonte | Países | Período | Classe | Método / limitação |
|---|---|---|---|---|---|
| Nível de preços ao consumidor (índice) | Jordà, Schularick & Taylor, *Macrohistory Database* R6 (macrohistory.net), variável `cpi` | EUA, Reino Unido, Japão, Alemanha | 1870–2020 | S | média anual ÷ média de 2025; na Alemanha, a JST encadeia o marco de papel no Rentenmark (÷10¹²) |
| idem | Banco Mundial, `FP.CPI.TOTL.ZG` (API, baixado em 18/11/2026) | idem | 2021–2025 | S | variação anual aplicada sobre o último valor da JST; EUA 2025 = 2,7% (estimativa [A]) |
| Hiperinflação alemã, mês a mês | Statistisches Reichsamt, *Zahlen zur Geldentwertung in Deutschland 1914 bis 1923* (1925): marcos por dólar, médias mensais | Alemanha | jan/1919–dez/1923 | A | o nível de preços do mês acompanha a cotação (âncora: o nível de 1913 da JST × cotação ÷ 4,2); dez/1923 ≈ nível de 1924 |
| PIB real por pessoa (índice) | JST, `rgdpbarro` (Barro & Ursúa) | EUA, Reino Unido, Japão, Alemanha | 1870–2020 | S | renda da época ÷ 2025 (APROXIMAÇÃO do rendimento do trabalho — o mesmo método do Brasil antes de 1992) |
| idem | Banco Mundial, `NY.GDP.PCAP.KD.ZG` | idem e Argentina | 2021–2025 | S | |
| Desemprego | JST, `unemp` | EUA, Reino Unido, Japão (lacunas), Alemanha | 1870–2020 | S | acima de 7%, o ano pesa nas contratações e demissões do mundo do jogo (efeito [A]) |
| Preços ao consumidor | INDEC, IPC (GBA) empalmado, mensal (datos.gob.ar, série 178) | Argentina | 1943–2008 | S | encadeado em pesos de hoje pelo próprio INDEC |
| idem | índices provinciais e privados da época | Argentina | 2008–2017 | A | o IPC oficial de 2007–2015 foi declarado sem confiabilidade (Decreto 55/2016, emergência estatística); inflação média: 2008 23%, 2009 15%, 2010 25%, 2011 23%, 2012 25%, 2013 26%, 2014 38%, 2015 27%, 2016 40%, 2017 25,7% |
| idem | Banco Mundial (INDEC) | Argentina | 2018–2024 | S | 2025: 41,3% (estimativa [A]) |
| PIB por pessoa | Maddison Project Database 2023 (`gdppc`) | Argentina | 1900–2022 | S | 2023–2025 pelo Banco Mundial |
| Renda do lado leste (RDA) | — | Alemanha | 1945–1990 | A | 55% da renda do oeste (ordem de grandeza da literatura sobre o PIB por pessoa da RDA); o nível de preços do leste = o do oeste (os preços oficiais eram fixos e subsidiados; a aproximação está na moeda, não nos preços) |

Conferência: a vida de 2025 em cada país mostra o fator de hoje (`fatorDoPais`) — teste `erasV3` "a Argentina troca de
moeda cinco vezes...".

## 16. Brasil de 1900 a 1969 (`eras/base/series.ts`, `economiaSeries.ts`, `dados/acontecimentosBR.ts` estendidos)

| Dado | Fonte | Período | Classe | Método |
|---|---|---|---|---|
| Nível de preços | IGP-DI (FGV), Ipeadata `IGP12_IGPDI12`, mensal | fev/1944–dez/1969 | A | encadeado no valor de jan/1970 (outro índice que o IPCA) |
| idem | Deflator implícito do PIB (IBGE, *Estatísticas do Século XX*), Ipeadata `SCN10_DIPIBG10`, anual | 1900–1943 | A | encadeado na média de 1944; meses por interpolação geométrica entre as médias |
| PIB real | Ipeadata `SCN10_PIBG10` (IBGE) | 1901–1969 | S | fase da economia de cada ano |
| Renda da época | Maddison Project Database 2023 (`gdppc` do Brasil) | 1900–1969 | A | encadeada no valor de 1970 da v2 |
| Salário mínimo | Ipeadata `MTE12_SALMIN12` (Decreto-Lei 2.162/1940 e seguintes) | jul/1940–1968 | S | antes de 1940 não havia mínimo: o piso acompanha a renda média |
| Moedas | Decreto-Lei 4.791/1942 (cruzeiro, em vigor em 1º/11/1942: Cr$ 1 = 1$000); Decreto-Lei 1/1965 (cruzeiro novo, 13/02/1967: NCr$ 1 = Cr$ 1.000) | 1900–1967 | F | o mil-réis é escrito com o cifrão no meio ("1:250$000") |
| Acontecimentos (36) e Copas/Jogos de 1920–1968 | fonte em cada item (`eras/dados/brasil1900.ts`): Planalto, Câmara, CPDOC/FGV, Arquivo Nacional, Fiocruz, Museu da Imigração, Comissão Nacional da Verdade, FIFA, COI | 1904–1968 | F | |
| Presidentes 1898–1969 | Biblioteca da Presidência da República | | F | |
| Lembranças (18) e décadas | Hemeroteca Digital da Biblioteca Nacional, MIS, IMS (gêneros, costumes, objetos) | | A | intervalos de auge |
| Tecnologias da casa (luz, água, gás, geladeira, TV, máquina de lavar, avião) | Censos Demográficos do IBGE (1960, 1970, 1980) para `popular`/`massa`; datas de chegada com fonte no item | | F/A | |

## 17. Mortalidade da época (`eras/base/mortalidadeSeries.ts`, gerada)

| Dado | Fonte | Classe | Método |
|---|---|---|---|
| Expectativa de vida ao nascer | Our World in Data (Riley 2005; Zijdeman et al./Clio Infra; Human Mortality Database; ONU WPP 2024), baixado em 18/11/2026 | S | anos de guerra excluídos (a guerra é o seu próprio risco) |
| Alemanha antes de 1950 | Statistisches Bundesamt, *Allgemeine Sterbetafeln* 1901/10, 1924/26, 1932/34, 1949/51 (médias homens/mulheres: 46,5; 57,4; 61,3; 66,5) | F | |
| EUA 1900 | NCHS (47,3 anos) | F | |
| Mortalidade até 5 anos | Our World in Data (Gapminder; ONU IGME) | S | sem dado: mediana mundial por faixa de expectativa de vida [A] |
| Multiplicador do risco adulto | calibração do motor | A | o multiplicador do termo de Gompertz que reproduz a expectativa de vida aos 5 anos do período, relativo a 2020; série monótona |
| Regras de jogo | — | A | o protagonista não recebe o risco extra da infância; no adulto, metade do excesso; as pessoas do mundo, inteiro |

## 18. Regras sociais, leis, guerras e acesso ao ensino

Cada regra (`PacoteDeEra.regras`, `eras/base/regrasBR.ts`) e cada guerra traz a fonte no próprio dado. Fontes principais:
- **EUA**: National Archives (19ª Emenda; Ordens Executivas 9066, 9981, 10450); Supreme Court (Plessy 1896, Brown 1954,
  Griswold 1965, Roe 1973, Lawrence 2003, Obergefell 2015, Dobbs 2022); Civil Rights Act 1964; Voting Rights Act 1965;
  Fair Housing Act 1968; Equal Credit Opportunity Act 1974; Social Security Act 1935; Fair Labor Standards Act 1938;
  Selective Service System; Department of Veterans Affairs (combatentes e mortos por guerra).
- **Reino Unido**: legislation.gov.uk e UK Parliament (Representation of the People Acts 1918 e 1928; Old Age Pensions Act
  1908; National Insurance Acts 1911 e 1946; Education Acts 1918 e 1944; National Service Act 1948; Sexual Offences Act
  1967; Divorce Reform Act 1969; Equal Pay Act 1970; Sex Discrimination Act 1975; Race Relations Acts 1965 e 1968;
  Marriage (Same Sex Couples) Act 2013; National Minimum Wage Act 1998); Imperial War Museums; CWGC.
- **Japão**: Biblioteca Nacional da Dieta; Código Civil de 1898 e reforma de 1947; Constituição de 1947; Lei de
  Preservação da Paz (1925–1945); Lei de Igualdade de Oportunidades no Emprego (1985); Ministério da Saúde, Trabalho e
  Bem-Estar (mortos de guerra; seguro universal de 1961); Cidade de Hiroshima; Prefeitura de Okinawa.
- **Alemanha**: BGB (1900) e Gleichberechtigungsgesetz (1957); reforma de 1977; StGB § 175 (1871/1935, reforma de 1969) e
  código penal da RDA (1968); Wehrpflichtgesetz (1956; RDA 1962); Bundesarchiv, Stasi-Unterlagen-Archiv, bpb, Gedenkstätte
  Berliner Mauer, Volksbund, Overmans (1999).
- **Argentina**: InfoLEG/Boletín Oficial (Leis 13.010/1947, 23.515/1987, 24.429/1994, 26.618/2010, 27.610/2020; Decreto-Lei
  4.161/1956); CONADEP (*Nunca Más*, 1984); Ministerio de Defensa (Malvinas).
- **Brasil**: Constituições de 1891, 1934 e 1937; Decreto 21.076/1932; Código Civil de 1916 e Lei 4.121/1962; Lei
  Saraiva (1881) e EC 25/1985; AI-3 e AI-5; Código de Menores (1927); CLT (1943); Ministério da Defesa (FEB).

**Alcance das guerras [A]**: a fração dos homens da idade que serviu, calculada de "quantos serviram" (fonte no item) ÷
uma estimativa da população masculina da faixa de idade; a letalidade é a histórica (mortos ÷ serviram). O protagonista
convocado recebe metade da letalidade (regra de jogo); as pessoas da família, a inteira.

**Acesso ao ensino superior [A]** (`eras/base/sociedade.taxaDoSuperior`): taxa bruta de matrícula no ensino superior, de 10
em 10 anos, por Barro & Lee (2013) e UNESCO UIS (desde 1970).

## 19. Tecnologias e cultura por país

`PacoteDeEra.tecnologias`: `chega` (fato, com fonte quando há registro) · `popular` e `massa` (aproximações lidas das séries
domiciliares: Census Bureau e CPS/Pew nos EUA; ONS/General Household Survey e licenças da BBC no Reino Unido; Gabinete do
Japão — Pesquisa de Tendências do Consumo; Destatis/EVS e *Statistisches Jahrbuch der DDR* na Alemanha; censos do INDEC na
Argentina). A Alemanha Oriental tem datas próprias (`leste`). Lembranças culturais: gêneros, costumes e objetos, sem obra,
personagem ou marca protegida (intervalos de auge [A]).

## 20. Veículos da época no mundo (`eras/base/veiculosMundo.ts`)

Anos de produção/venda por país (The Henry Ford; British Motor Museum; Mercedes-Benz Classic; August Horch Museum Zwickau;
Toyota Automobile Museum; Museo del Automóvil de Buenos Aires; Anfavea) **[F/A]**; medidas dos desenhos pelas fichas
técnicas **[F]**; preços em reais de hoje proporcionais ao esforço histórico **[A]** (não é a tabela de preços do ano).

## 21. ERAS v4 · barreiras, reformas, movimentos e partidos (`eras/base/sociedadeBR.ts`, `eras/paises/<id>/sociedade.ts`)

Cada barreira, reforma e movimento traz a fonte no próprio dado; aqui, as fontes por área e o que é aproximação.

**Classes.** [F] a lei, a decisão, a data, quem era atingido · [A] o TAMANHO do efeito na chance (de ser contratado, de
entrar na faculdade, de ser eleito), a força de uma oposição (`resistencia`) e o resíduo do costume depois que a lei cai
(`residuo`). O jogo não tem série histórica de "probabilidade de contratação" por grupo; os fatores são calibrados para
que a diferença seja perceptível sem fechar toda mobilidade (a mobilidade existia, mais difícil).

| Área | Fontes principais |
|---|---|
| Brasil — mulher casada | Código Civil de 1916 (Lei 3.071), arts. 6º, 242; Estatuto da Mulher Casada (Lei 4.121/1962); Romy Medeiros da Fonseca e o Conselho Nacional de Mulheres |
| Brasil — racismo no trabalho | Lei 1.390/1951 (Afonso Arinos); Lei 7.716/1989 (Caó); C. Hasenbalg (1979); Frente Negra Brasileira (1931), TEN (1944), MNU (1978) |
| Brasil — polícia política e serviço público | Comissão Nacional da Verdade, Relatório (2014), vol. I; Lei 6.683/1979 (Anistia); Movimento Feminino pela Anistia (1975), CBA (1978) |
| Brasil — tutela indígena | Código Civil de 1916, art. 6º, III; Lei 6.001/1973; Constituição de 1988, arts. 231–232 |
| Brasil — partidos de 1873 a 1965 | CPDOC/FGV (verbetes do PRP, PRM, PRR, PRC, PD, PL, PCB, PSD, UDN, PTB, PSP, PDC, PSB, PR, PTN); Decreto-Lei 37/1937; AI-2 (27/10/1965); TSE (cancelamento do registro do PCB, 1947) |
| EUA — segregação e direitos civis | leis estaduais "Jim Crow"; Sweatt v. Painter (1950); Brown v. Board of Education (1954); Civil Rights Act (1964); Voting Rights Act (1965); Fair Housing Act (1968); HOLC/FHA (1934–1940); EO 8802 (1941) |
| EUA — mulheres | 19ª Emenda (1920); C. Goldin, "Marriage Bars" (NBER, 1988); Equal Pay Act (1963); Title IX (1972); Equal Credit Opportunity Act (1974/1975); U.S. Census Bureau (razão de salários, 1963) |
| EUA — serviço federal | Executive Order 10450 (1953); Civil Service Commission (03/07/1975) |
| EUA — trabalho infantil, escola, saúde | Fair Labor Standards Act (1938); Hammer v. Dagenhart (1918); Goldin & Katz (high school movement); Cutler & Miller (2005, água tratada e mortalidade) |
| Reino Unido | Sex Disqualification (Removal) Act 1919; Bebb v. Law Society (1913); marriage bar do Home Civil Service (1946) e Education Act 1944, s. 24(3); Equal Pay Act 1970; Sex Discrimination Act 1975; Race Relations Acts 1965/1968; Bristol Bus Boycott (1963); Sexual Offences Act 1967; Criminal Justice (Scotland) Act 1980; Representation of the People Act 1918 e Equal Franchise Act 1928; Oxford (1920) e Cambridge (1948) |
| Japão | Código Civil Meiji (1898), art. 14, e a reforma de 1947; Lei dos Advogados (1893, reforma de 1933); Constituição de 1947, arts. 14 e 24; Lei Eleitoral Geral (1925); Lei de Igualdade de Oportunidades no Emprego (1985/1986); caso Sumitomo Cement (1966); Shin Fujin Kyōkai (1920) |
| Alemanha | BGB §§ 1356 e 1358 (1900); Gleichberechtigungsgesetz (1957/1958); Primeira Lei de Reforma do Casamento (1977); a matrícula de mulheres por estado (Baden 1900 – Prússia 1908); Lei das Servidoras de 30/06/1933; § 175 e a reforma de 1969; Bundesstiftung Aufarbeitung e BStU (RDA) |
| Argentina | Lei 13.010/1947; Lei 11.357/1926 e Lei 17.711/1968; Lei 21.274/1976 (prescindibilidade) e CONADEP; Lei 23.515/1987; Lei 26.618/2010; Decreto 4.161/1956 (proscrição do peronismo) |
| Partidos de outros países | registros parlamentares e eleitorais nacionais (Federal Election Commission e a história dos partidos dos EUA; Electoral Commission e House of Commons Library; Kokkai/Arquivos Nacionais do Japão; Bundeszentrale für politische Bildung; Cámara Nacional Electoral). A "linha" de cada partido é descrição factual curta da época, sem juízo e sem efeito no jogo |

**Decisões de desenho registradas.** (1) O jogo não oferece filiação a partidos nazistas, fascistas ou neonazistas: a
história deles aparece como fato documentado, não como carreira. (2) A perseguição aos judeus na Alemanha (1933–1945) não
foi modelada como barreira porque o jogo ainda dá às famílias da época a distribuição religiosa de hoje (sem judeus na
Alemanha de 1930): representar só pela metade seria apagar — fica pendente, junto com a discriminação contra burakumin e
coreanos no Japão. (3) Reformas "que a história não teve" (o fim da segregação por um estado do Sul antes das decisões
federais; a escola e a água por iniciativa de uma cidade) são marcadas como tal no dado e na tela.
