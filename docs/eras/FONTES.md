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
