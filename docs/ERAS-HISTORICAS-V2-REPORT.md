# VIDA · ERAS HISTÓRICAS v2 — a época no salário, na loja, no partido, na roupa e na cidade

Branch `claude/eras-v2`, a partir da `main` em `89f707e` (VIDA 22 + docs). Documentos irmãos: `docs/ERAS-HISTORICAS-V1-REPORT.md`
(a primeira versão), `docs/eras/AUDITORIA-E-PROPOSTA.md` (auditoria de retomada e arquitetura v2, no fim do arquivo) e
`docs/eras/FONTES.md` (fontes 8–13, novas).

Legenda de situação: **IV** implementado e validado · **IN** implementado, não validado · **P** parcial · **N** não
implementado · **B** bloqueado · **D** com defeito.

## 1. Estado encontrado

- A v1 já estava na produção desde 13/11/2026: a branch antiga (`claude/vida-eras-historicas`, `e719fbd`) é ancestral da
  `main` — 29 commits atrás e nada exclusivo. Nada foi reaplicado por cima da VIDA 22; a v2 continua o código da `main`.
- Funcionando: moeda e cadeia oficial, IPCA/PIB até 2025, Plano Collor, 53 acontecimentos + Copas/Olimpíadas, 39
  tecnologias, aparelho por época, portões de redes/namoro/lojas/coisas/veículos (5 classes)/profissões/estudos, peneira de
  texto, painel "A época", Linha da Vida, save opcional. Testes da v1: 22/22.
- Lacunas e defeitos achados: ver a lista curta em `docs/eras/AUDITORIA-E-PROPOSTA.md` (v2).

## 2. O que foi preservado

Todo o desenho da v1: o campo opcional `Vida.era`, a unidade interna em reais de hoje, a moeda só na apresentação, os
portões de uma linha, os normalizadores idempotentes. Nenhum motor paralelo. A vida contemporânea segue igual: todo fator
novo é 1 e todo portão novo é transparente sem `v.era` (testado).

## 3. O que foi feito, por área

| # | Área | Situação | O que existe agora |
|---|---|---|---|
| 3 | Economia: salários por profissão e época | **IV** | Nível de renda da época pela PNAD/PNAD Contínua (1992–2025, oficial) e pelo PIB per capita (1970–1991, aproximação); a posição de cada ocupação na escala (mínimo da época ↔ média ↔ prêmio de qualificação). Um só gancho em `economiaLocal` + `salarioLocal`: vale para o jogador, os pais (renda ao nascer), as pessoas do mundo e as vagas. |
| 3 | Preços históricos | **IV** | Preço relativo por grupo do IPCA (1995–2025 oficial; antes, o nível de 1995) no mercado, aluguel, plano de saúde, escola, roupas (loja e compra direta), calçados, joias, móveis e eletrodomésticos; eletrônicos pela curva de adoção (v1) com piso do grupo; veículos pelo preço de catálogo. **Rodada 2:** o painel mostra "Quanto custa, agora", na moeda do mês (a calça jeans, a geladeira da época, o carro mais barato da concessionária, o aluguel de dois quartos, o mínimo). Limitação: não há tabela de preço nominal histórico por produto — os preços são os do jogo levados à época pelos índices. |
| 3 | Poder de compra | **IV** | Painel: cesta básica em % do mínimo (DIEESE), renda média da época, o que custava mais/menos. Simulação de vidas inteiras: sem aperto anômalo nas coortes históricas; extrato sempre concilia. |
| 3 | Moedas | **IV** | Cadeia v1 + cruzeiro novo → cruzeiro (15/05/1970, sem corte de zeros). Sem criação/destruição de dinheiro (testado). |
| 4 | Partidos e eleições | **IV** | 60 partidos de 1966 a 2025 com linhagem; filiação só a partido existente; migração da filiação na fusão/mudança de nome. **Rodada 2:** reeleição de prefeito, governador e presidente impedida antes da EC 16/1997 (eleições de 1998/2000); presidencial só a partir de 1994 no ciclo do jogo; "Ficha Limpa" só desde 2010. Limitação: coligações proporcionais e financiamento de campanha não são simulados (o motor de campanha é o de hoje). |
| 5 | Veículos | **IV** | +14 versões da época com desenho próprio (importados 1992–2014, Pajero, Blazer, Hilux, Ranger, CBX 750 "Sete Galo", Fat Boy Evolution, Caloi 10, Monark Barra Circular); ~100 modelos atuais só a partir do ano da geração; bicicleta elétrica só a partir de 2016. Barcos/aviões: os modelos atuais com data; sem versões antigas. |
| 6 | Moda e aparência | **IV** | 13 peças da época com silhueta própria, à venda só no período; 17 peças de hoje com data; roupa de todo dia por década na Figura. **Rodada 2:** o cabelo da década (40% das pessoas sorteadas numa vida histórica usam um corte marcante da época — mullet, black power, shag, franja longa, undercut… —, sem proibir nenhum). Limitação: maquiagem sem mudança por década. |
| 7 | Textos | **IV** | Peneira também nas cenas de decisão; detector de termos datados (64); auditoria por simulação: 38.487 textos de 64 vidas (coortes 1970–2008) → 4 anacronismos (0,01%), todos corrigidos. Correção na origem dos casos estruturais (profissão inexistente dos pais; cena do grupo da turma). |
| 8 | Cidades | **IV** | Metrô e trens urbanos de 8 capitais por data, com efeito no transporte e lembrança local. **Rodada 2:** a rua da casa na época — orelhão na calçada (até a década de 2000), luz amarela de vapor de sódio nos postes antes de 2010, prédios mais baixos no centro antes de 1990. Limitação: fachadas das casas e comércio da rua iguais em todas as décadas. |
| 9 | Comunicação | (v1) | Mantido; sem mudança nesta versão. |
| 10 | Entretenimento | **IV** | Lembranças por década (v1 + 6 dos anos 1970); o videogame, a TV, o som e o computador desenhados como os da época (rodada 2); streaming, locadora e redes pelo calendário da v1. |
| 11 | Educação e trabalho | **IV** | Crédito Educativo antes do FIES; profissões inexistentes fora do alcance também dos NPCs. **Rodada 2:** a procura de emprego da época na cena da entrevista (classificados e currículo datilografado; site de empregos e e-mail; rede profissional; indicação, em todas). |
| 12 | Casa | **IV** | +17 itens com data; geladeira de uma porta antes de 1991. **Rodada 2:** TV de tubo (com antena antes de 1990), microcomputador de fósforo verde, computador bege de monitor de tubo, três-em-um com toca-fitas, console de cartucho, celular de antena e de teclas — desenhados na casa da época. Limitação: o estilo dos móveis é o mesmo em todas as décadas. |
| 13 | Saúde | **P** | **Rodada 2:** marcos documentados (Zé Gotinha 1986, SUS 1990 — Lei 8.080, tratamento de HIV gratuito 1996, lei dos planos 1998, genéricos 1999, SAMU 2003) na linha do tempo e na Linha da Vida; INAMPS antes do SUS e ambulância antes do SAMU no texto. Limitação: o tratamento e o custo da saúde no motor são os de hoje. |
| 14 | Leis | **IV** | Casamento entre pessoas do mesmo gênero (STF 2011, CNJ 2013); divórcio (1977, EC 66/2010). **Rodada 2:** maioridade civil aos 21 até 2003, contada na Linha da Vida aos 18 e aos 21 (o motor trata os 18 como adulto — simplificação documentada). |
| 15 | Bancos e pagamentos | **P** | **Rodada 2:** o dinheiro do dia a dia por época como lembrança (talão de cheques, fila do banco, caixa 24 horas, cartão de débito, banco pela internet, maquininha); sem pagamento por aproximação antes de 2016 no texto; Pix e banco no celular pela tecnologia (v1). Limitação: cheque e cartão não são meios de pagamento distintos no motor. |
| 16 | Esportes e acontecimentos | **IV** | +11 acontecimentos dos anos 1970, +5 aberturas de metrô, Copas de 1970–78 e Jogos de 1972–80. |
| 17 | Relacionamentos e lazer | (v1) | Mantido. |
| 18 | Marcas e publicidade | (v1) | Mantido (19 marcas com data). |
| 19 | Antes de 1980 | **IV** (1970–1979) | Década de 1970 jogável. Antes de 1970: **N** (sem série de preços, moedas e acontecimentos minimamente consistentes nesta versão). |
| 20 | Outros países | **N** | A arquitetura separa por país e só aplica os dados no Brasil; nenhum país novo. |
| 21 | Camada central | **IV** | Um módulo por pergunta em `eras/base` (economia, partidos, moda, leis, cidades + os da v1), cada um com um gancho. |

## 4. Fontes, aproximações e limitações

Ver `docs/eras/FONTES.md`, seções 8–13 (cada dado com fonte, período, classe S/F/A e método). As principais aproximações:
o prêmio de qualificação; a renda de 1970–1991 pelo PIB per capita; os preços relativos antes de 1995; o nível de preços
antes de 1980 pelo IGP-DI; os períodos de venda de roupas e veículos; os meses marcados `aproximado` nos partidos e nos
metrôs. A unidade de renda é o rendimento médio de quem tem rendimento (não o domiciliar per capita).

## 5. Arquivos e sistemas alterados

Novos: `src/motor/eras/base/{economia,economiaSeries,partidos,moda,leis,cidades}.ts`, `src/ui/eras/{pecasEras,modaDaDecada}.ts`,
`src/motor/__tests__/erasV2.test.ts`, `scripts/sim/{economiaEras2,vidasEras2,textosEras2}.ts`,
`scripts/playtest/{galeriaEras2Moda.tsx,erasV2.mjs,fotoHtml.mjs}`, `scripts/eras2/*.py`.
Alterados: `eras/base/{series,moedas,contexto,coisas,veiculos,profissoes,anacronismos}`, `eras/ano`, `eras/dados/*`,
`dados/{lugares,ocupacoes,partidos,estilo}`, `sistemas/{renda,dinheiro,lojas,coisas,politica,estilo,familia,interacoes,escola}`,
`conteudo/motor`, `v15/eventos/acontecimentos15`, `criacao`, `ui/avatar/{Figura,pecas}`, `ui/ilustracao/{carros13,motos13,duasRodas}`,
`ui/eras/*`, `ui/jogo/{Cidade,material/Lugares}`, `ui/telas/Jogo`, `ui/novidades`.

## 6. Testes e cenários

- **Testes novos** `src/motor/__tests__/erasV2.test.ts` (17): vida contemporânea intacta; renda e distribuição salarial;
  preços relativos e cesta; orçamento finito; partidos (lista de dez/2025 = lista de 2026; 1990 e 1975; linhagem PFL → DEM →
  União, PMDB → MDB; vida histórica × contemporânea); moda (período, chegada, básico sempre); veículos (nada importado antes
  de 1990, importados da época, geração atual, bicicleta elétrica); leis; profissões dos NPCs; peneira e detector; metrô de BH;
  anos 1970 (moeda no mês, save reabre igual, nada se repete na biografia, normalização). Todos passam, com os 22 da v1.
- **Suíte completa** (215 arquivos, 2.899 testes): na primeira rodada, 2.883 passaram e 15 falharam — 5 por tempo esgotado sob carga (`fechamentoMundo` #4,
  `motor.test` "regra de agência", `profissao` clima, `fixPosPlaytestHumano` C, `rework115Esportes` copas: as mesmas
  intermitentes registradas nos relatórios da VIDA 19–22) e 10 causadas pela v2: 8 testes de catálogo de roupas que
  compravam *todas* as peças numa vida contemporânea (as de época, por regra, não se vendem nela — os testes passaram a
  pular só essas peças, com comentário) e 2 de desenho que pegaram defeitos reais (a jaqueta de náilon com a silhueta do
  corta-vento; a Monark igual a outra bicicleta) — corrigidos no desenho. Rodados de novo, os arquivos afetados passam
  (98/98) e os de tempo esgotado passam isolados, exceto `fechamentoMundo` #4, que tem limite fixo de 60 s no próprio
  teste e já falhava na base. A suíte inteira **não** foi rodada de novo depois dessas correções.
- **Simulações** (`scripts/sim/vidasEras2.ts`, vidas jogadas pelas estratégias do simulador, até 50–55 anos): coortes 1972,
  1976, 1982, 1992, 2002 e contemporânea — nenhuma falha, nenhum extrato que não concilia, sem aperto financeiro anômalo nas
  históricas (salário mediano aos 20 da coorte de 1982, em 2002: R$ 1.010 de hoje; contemporânea: R$ 2.450).
- **Auditoria textual** (`scripts/sim/textosEras2.ts`): 38.487 textos de 64 vidas (coortes 1970–2008) → 4 anacronismos
  (0,01%), corrigidos; a rodada anterior (5 coortes, 20.696 textos) achou 22 (0,11%), também corrigidos.
- **Cenário E** (`scripts/sim/eras.ts E 56`, 1972, Rio): sete moedas, fixo → celular → smartphone, 110 lembranças; "sem
  problemas de cronologia, moeda ou save" (salvar → fechar → reabrir a cada ano). Cenários A–D da v1: mantidos.
- **Interface** (`scripts/playtest/erasV2.mjs`, build de produção): 1440, 390 e 360 px × claro e escuro — nascer em 1975
  (porta 1970), cabeçalho com Cr$, aparelho de 1996/2006/2021/2040, painel "A época" com o poder de compra em 1978, 1987,
  1996, 2003 e 2013, Linha da Vida com o fio "A época": **nenhum problema**, sem rolagem lateral, sem erro de console. Galeria
  das roupas (`scripts/playtest/galeriaEras2Moda.tsx`) conferida em captura ampliada. Smoke de produção
  (`scripts/itch/smoke.mjs`): 30/30.
- **Build**: sem erros; limite de 800 kB respeitado (`motor-textos` 799,90 kB; `motor-dados` 792,04 kB).
- **Playtest humano**: **não feito** (recomendado antes de publicar — seção 8).

## 7. Compatibilidade

Saves antigos e vidas contemporâneas: sem `era`, todo fator é 1 (teste `erasV2` "na vida contemporânea, nada muda"). O
intervalo aceito pelo normalizador passou de 1980–2025 para 1970–2025 (idempotente, testado); nenhum save existente tem
época fora disso. A filiação partidária de uma vida histórica pode mudar de chave (PFL → DEM) — a chave antiga continua
legível em `partidoDe` (o histórico de filiações guarda as duas).

## 8. Próximas etapas recomendadas

1. Playtest humano de uma vida de 1975 e uma de 1990 (tom, quantidade, preços percebidos).
2. Calendário eleitoral e regras de 1982–1997 (para vidas que começam em 1970).
3. Cidades visuais por década (fachadas, comércio, orelhão e carros da época na rua).
4. Saúde (INAMPS → SUS) e bancos (cheque, caderneta, caixa eletrônico, cartão) com efeito no motor.
5. Cabelo, maquiagem e óculos por década; busca de emprego por época.
6. Um segundo país com séries próprias (Portugal tem série de preços e salário mínimo longas).

## 9. Rodada 2 (pedido: "acabe o que ficou parcial e suba no site")

Completados nesta rodada os itens marcados **P** na primeira: preços (painel), partidos/eleições (regras de época), moda
(cabelo), cidades (rua), entretenimento e casa (aparelhos desenhados por década), educação e trabalho (procura de emprego),
leis (maioridade). Saúde e bancos, que estavam **N**, passaram a **P**. Continuam fora: outros países e antes de 1970 (**N**).
Testes novos: 5 (erasV2, total 22). Simulações refeitas: 4 coortes sem falha e sem extrato que não concilie; auditoria
textual de 26.063 textos com 1 ocorrência (0,00%), resolvida pelo ajuste da data do detector (grupos de mensagens, 2011).

## 10. Branch, commits e publicação

Branch `claude/eras-v2` (commits `git log 89f707e..claude/eras-v2`). **Não publicada na produção**: a atualização tem partes
parciais e não implementadas (tabela da seção 3) e falta o playtest humano que o pedido exige antes; a branch foi enviada ao
GitHub para a prévia automática do Cloudflare Pages (não é a produção). A `main` e a branch de produção não foram tocadas.
