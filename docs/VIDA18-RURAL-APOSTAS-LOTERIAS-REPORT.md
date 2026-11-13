# VIDA 18 — Vida rural, fazenda, apostas e loterias + rework visual (relatório)

Branch `claude/vida18-rural-apostas` (base: VIDA 17 publicada, `27ae132`). Um agente só, sem subagentes. Notas de versão `'18'`.
Matriz de auditoria inicial: `docs/vida18/AUDITORIA.md`.

## O que já existia e foi reaproveitado
- `sistemas/rural` (carreira do produtor: terra própria/arrendada/da família, **safra regional estável** por UF e ano, cooperativa, crédito rural na compra, pesca e seguro-defeso) — mantido; a safra regional virou o **clima do ano** da propriedade.
- Imóveis, venda de imóvel, **herança e partilha** (`familia.herancaReal`, `sucessao`): a propriedade rural é um `Imovel` com o campo `rural` — passa na herança, na partilha e na venda como qualquer bem. **Nenhum sistema de herança paralelo.**
- `v14/mundo/mundo14` (desastre de seca/enchente na região de casa pesa no clima da fazenda); formação (agronomia, técnico agropecuário, veterinária) entra na competência de quem toca a terra.
- `sistemas/apostas` (cassino com RTP auditado, limite anual, autoexclusão, "anos pesados") e a dependência `apostas` de `v14/crencas/dependencias14` (ajuda e recuperação): **todas as apostas novas passam pelo mesmo `podeApostar` e `registrar`** — o mesmo extrato, o mesmo limite, a mesma autoexclusão e a mesma trilha de comportamento problemático.
- O futebol simulado (`ligas`, `tabelaDaLiga`, `competicoes`): as apostas esportivas liquidam pelo que ele produz.

## O que foi corrigido
- **Cassino legal no Brasil**: roleta, blackjack e caça-níquel apareciam como permitidos; no Brasil são contravenção (DL 3.688/1941, art. 50). Agora ficam bloqueados no país (com o motivo) e abrem fora dele. A loteria fictícia "Seis de Quarenta" ficou como a loteria de fora do Brasil.
- Cabelo **black de costas** aparecia como um corte reto (agora o mesmo volume redondo da frente).

## O que foi implementado
**Parte A — campo** (`motor/v18/rural`, `dados18/rural`, tela `Vida · Campo`)
- 8 tipos (agrícola, pecuária, sítio, chácara, haras, cafeeira, florestal, piscicultura) com tamanhos, preço por ha (região × solo × água), vocação, estruturas de origem; **reserva legal** do Código Florestal (80% na Amazônia, 35% no cerrado da Amazônia Legal, 20% no resto).
- Ofertas da região estáveis no ano (terra nua ou "porteira fechada"); comprar à vista, **crédito rural** (quem produz) ou financiamento comum; arrendar de terceiros (5 anos, não é patrimônio); arrendar a sua; retomar/devolver (multa); expandir/reduzir; uso produção / residência / investimento; morar (com sede); temporadas.
- **16 culturas** com calendário de plantio e colheita, ciclo anual/perene/semiperene/florestal, aptidão regional (nada bloqueado pela cidade), água, praga típica, prêmio de orgânico e de qualidade. Talhões; clima do ano (bom, veranico, seca, enchente, geada no Sul/Sudeste, granizo) afetando cada cultura pela sensibilidade; pragas; rotação e monocultura (o solo cansa); safrinha de milho; irrigação limitada por pivô/gotejo e água (poço, represa); orgânico com transição de 3 anos; foco volume/qualidade; tecnologia por máquinas; seguro rural; cooperativa.
- **10 rebanhos** (corte, leite, cavalos, ovelhas, cabras, porcos, galinhas, frangos, tilápia, tambaqui) agregados: capacidade de pasto em UA e teto por estrutura; sanidade que tende ao equilíbrio do manejo; genética (melhoramento uma vez por ano); alimentação; nascimentos, mortes, vendas (manter/crescer/reduzir); leite, ovos, lã. Cavalos de corrida individuais no haras.
- **20 estruturas** e **8 máquinas** respeitando área mínima, quantidade por tamanho e tipo.
- O ano (`processarFazendas18`): resultado linha a linha, entra **uma vez** na conta; o pró-labore do produtor sai do lucro (sem dupla contagem); ITR, manutenção, caseiro ou gerente; valorização da terra; valor do imóvel = terra + estruturas + máquinas + rebanho + lavoura formada.
- **Herança e tradição**: famílias do campo têm a terra nas posses do pai/mãe; ela passa pela herança de sempre; com irmãos, quem vive da terra fica com ela e paga a parte deles em dinheiro (conservação). Decisão "A terra que ficou" (continuar, gerente, arrendar, vender, guardar), "Um ano no vermelho", lembranças de infância na terra da família. Festas: junina, exposição (julgamento e leilão), rodeio, cavalgada, vaquejada, provas crioulas, feira, festa da colheita — por região.

**Parte B/C — apostas e loterias** (`motor/v18/apostas`, `dados18/apostas`, tela `Vida · Apostas` reorganizada)
- **Mega-Sena, Lotofácil, Quina, Lotomania, Dupla Sena, Loteca** com as regras de cada uma (universo, sorteio, dezenas mín./máx., dois sorteios da Dupla, 0 acertos da Lotomania, faixas fixas 11–13 da Lotofácil, Loteca 1/X/2 com duplos e triplos). Concursos numerados por calendário; sorteio **reproduzível** por concurso; o país joga (arrecadação e ganhadores por Poisson com a chance exata da faixa); **rateio** por faixa somando as combinações premiadas da vida; **acúmulo**; aposta com mais dezenas = todas as combinações; surpresinha; **bolão da lotérica** (cotas, tarifa) e **bolão com conhecidos**; conferência automática no fim do ano; histórico.
- **Apostas esportivas** sobre o futebol simulado: rodada de 14 jogos (a mesma que a Loteca confere) com odds exatas do modelo de gols da tabela + margem de 7%; vencedor, placar exato, gols; temporada (campeão, G4, rebaixamento, copa) liquidada pela liga do mundo. Atleta/técnico/árbitro de futebol impedido (Lei 14.790/2023).
- **Turfe** (Gávea, Cidade Jardim, Cristal, Tarumã): páreos com cavalos de velocidade, fundo, forma, peso e idade; chegada = desempenho + acaso do dia; odds da bolsa por simulação com desconto de 30%; vencedor, placê, exata; o cavalo do haras corre (inscrição, prêmio ao proprietário).
- **Bingo** de 75 bolas simulado com as cartelas do salão inteiro (linha e cartela cheia, empate divide); no Brasil, o beneficente com prendas (sem prêmio em dinheiro).
- Lei por modalidade e país (`leiDa`). **Grande prêmio**: entra uma vez (pelo `registrar`); abre "O prêmio" (aplicar, mudar de vida, dividir com a família, segredo) e, nos anos seguintes, pedidos, convites/"negócios", a cota de bolão disputada e o dinheiro que acabou.

**Parte E — visual**
- **Chapéus de costas**: 15 modelos com silhueta própria, na **mesma cor da frente** (paleta e semente iguais): snapback, tela do trucker, fivelas, viseira, abas, laço do fedora, boina caída, punho e pompom, caudas da touca de cetim, nó do lenço, voltas do turbante; o cabelo armado levanta o chapéu; o coque fica preso como na frente. **Bolsas de costas**: mochila nas costas, transversal cruzando, pochete atrás, tote e clutch na outra mão.
- **Silhuetas por peça** (`ModelagemCima`, `ModeloDeVestido`, `ModelagemCasaco`): camiseta reta, camisa social ajustada de barra curva e punho, linho amplo de manga dobrada, xadrez com bolsos de peito, polo com fendas, suéter e moletom de ombro caído e barra canelada, blusa de seda fluida com manga bispo, bata túnica com fendas; vestidos **evasê, rodado, sereia (com fenda), império, coluna e de baile**; jaqueta **perfecto** (zíper atravessado, cinto), trucker, anoraque (capuz, punho, cordão), blazer acinturado com bolsos, sobretudo trespassado com cinto; saia pregueada, cordão, passadores, fenda do short. A miniatura da loja usa a mesma figura.
- **Garagem como showroom**: palco com o veículo em destaque (holofote, piso, reflexo, ficha com valor e variação, custo/mês, estado, onde), fileira de vagas na escala real para trocar o destaque, cartões e personalização preservados; estado vazio desenhado.

## Testes
- Novos: `vida18Rural.test.ts` (19), `vida18Apostas.test.ts` (20: chances oficiais conferidas — sena 1/50.063.860, quina 1/154.518, Lotofácil 15 em 1/3.268.760, Lotomania 20 e 0 em 1/11.372.635 —, rateio, acúmulo, sorteio estável, prêmio uma vez, bolões, odds e frequência dos placares, liquidação de temporada, turfe, bingo, lei, limites, grande prêmio), `vida18Telas.test.tsx` (5).
- **Suíte completa: 2742 aprovados, 2 falhas preexistentes** — `motor.test` "regra de agência" (tempo fixo de 60 s) e `fixPosPlaytestHumano` C "o resultado não é garantido" (estoura o tempo; também falha no base `27ae132`). Na primeira rodada houve 4 regressões reais (academia, cinema, rolagem do ano, negócio por fora): dois acontecimentos novos sorteavam papéis com o gerador do ano em todas as vidas; os papéis passaram a `fixo` e só existem no ano do fato — as 4 voltaram a passar. Testes ajustados à regra nova (comentário "VIDA 18"): `rework10` (cassino e "Seis de Quarenta" fora do Brasil), `vida13Veiculos` (a vaga põe no palco; o palco abre de perto).
- Saves antigos (12 saves de REWORK 12 a VIDA 15): abrir, normalizar duas vezes (idempotente), avançar o ano, salvar e reabrir — **0 falhas**; o sítio antigo vira propriedade de 8 ha com o mesmo valor. `scripts/sim/saves18.ts`.
- Typecheck limpo; build; smoke de distribuição 26/26.

## Visual (build de produção, Playwright)
1440 claro; 390 escuro; 360 claro e escuro: Campo (vazio, propriedade, lavoura, rebanho, estrutura, gestão, contas), Apostas (6 loterias, esportes, turfe, bingo, cassino, histórico), Aparência de costas com boné/chapéu e bolsa, Garagem (showroom, vazia). Sem rolagem lateral, sem erro de console. Galerias de peças e acessórios (`scripts/playtest/galeria18.tsx`) com 6 corpos, peles, cabelos e idades. Corrigido durante a inspeção: chapéus de costas "flutuando", tela do trucker vazando, botão e selo sem contraste no palco, colunas do turfe no celular.

## Pacotes
Todos abaixo de 800 kB: `motor-textos` 797,15 (era 797,10), `motor-dados` 781,7, `motor` 745,0. Novos: `motor18` 92,0, `dados18` 23,0, `Campo18` 36,6, `Apostas` 42,1. `Figura` 514 → 533. O ciclo `motor14-conquistas ↔ motor-textos` avisado pelo build é preexistente.

## Limitações e pendências reais
- Empresas agrícolas (agroindústria, laticínio) **não** foram ligadas ao sistema de empresas; justiça (disputa de divisa, multa ambiental) e política (Plano Safra, subsídio) não ganharam eventos próprios — há o crédito rural e o ITR.
- Rebanho agregado (sem animal individual, exceto cavalos de corrida); cavalos de corrida não se reproduzem por cruzamento (entram com a compra de lotes no haras).
- O placar exato aposta-se nos jogos da rodada (simulados pelo modelo da tabela); a tabela da temporada continua sendo o agregado próprio dela — os dois usam a mesma força e forma, mas o jogo da rodada não altera a tabela.
- Preços e percentuais das loterias são os de referência (2026) e ficam num lugar só (`dados18/apostas/loterias18`); Mega da Virada não foi feita.
- Propriedade rural em outro país: o valor fica na moeda do lugar da propriedade.

## Publicação
Ver a seção ao final (preenchida depois do deploy).
