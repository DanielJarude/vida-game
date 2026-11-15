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
