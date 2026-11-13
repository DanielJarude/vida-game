# VIDA 18 — Matriz de auditoria inicial (base 27ae132)

| Requisito | Estado | Onde / observação |
|---|---|---|
| Terra própria/arrendada/da família | parcial | `sistemas/rural.ts`: `VidaRural.terra` só muda o texto e o arrendamento; terra própria = Imóvel `sitio` genérico (sem área, solo, água) |
| Tipos de propriedade (8) | ausente | só o modelo de moradia `sitio` (`dados/bens.ts`) |
| Comprar/vender/arrendar propriedade | parcial | compra do sítio via decisão `rural_comprar` (`comprarSitio`, crédito rural 0,4% a.m.); venda = venda genérica de imóvel; arrendar a terceiros: ausente |
| Safra regional estável | implementado | `safraDaRegiao` (hash UF+ano) — reaproveitado como clima do ano |
| Culturas, calendário, solo, água, pragas, rotação, orgânico, tecnologia | ausente | `cultura` = lavoura/leite/horta/misto, só texto |
| Pecuária / animais de produção | ausente | `pets`/`exoticos` são animais de estimação |
| Infraestrutura e máquinas rurais | ausente | |
| Cooperativa / crédito rural | implementado (raso) | flag `cooperativa` amortece a safra; crédito só na compra |
| Pesca artesanal e seguro-defeso | implementado | `processarRural` (pescador) — mantido |
| Renda do produtor | implementado | salário por clientela (`trabalho.rendaDeClientela`), mexido pela safra |
| Vida no campo (festas, rodeios, feiras) | parcial | textos soltos (rodeio em acontecimentos10/1235, convívio) sem ligação com propriedade |
| Herança de bens | implementado | `familia.herancaReal` (posses → bens), `sucessao.partilhar`: um Bem viaja inteiro — base para herdar a fazenda |
| Família rural de origem | parcial | `save.ts` reconhece parentes `produtor_rural`; sem terra da família como bem |
| Clima/desastres regionais | implementado | `v14/mundo/mundo14` (seca/enchente na região, escopo `regiao`) |
| Cursos agronomia/veterinária/técnico agro | implementado | `dados/cursos`, `ensinoTecnico` — usados como bônus de manejo |
| Cassino (roleta, blackjack, caça-níquel) | implementado | `sistemas/apostas.ts`, RTP auditado em `rework10` |
| Legalidade do cassino | **bug** | só 13 países proibidos; no Brasil o cassino aparece como legal (LCP art. 50 o proíbe) |
| Bingo | ausente | |
| Loteria | parcial | "Seis de Quarenta" fictícia, prêmio fixo, sem concurso/acúmulo/bolão/histórico |
| Loterias brasileiras (6) | ausente | |
| Apostas esportivas | ausente | o futebol do mundo é simulado (`ligas.ts`: tabela, campeão, copa) — base para liquidar |
| Corridas de cavalos | ausente | |
| Limites, autoexclusão, anos pesados | implementado | `apostas.ts` + dependência `apostas` em `v14/crencas/dependencias14` (ajuda e recuperação) |
| Histórico de apostas | parcial | só as 10 últimas rodadas |
| Grande prêmio → vida | parcial | só a frase na biografia |
| Chapéus de costas / bolsas de costas | ausente/bug | pendência da VIDA 17 |
| Silhuetas por peça | parcial | pendência da VIDA 17 |
| Garagem/showroom | parcial (visual 16.1) | pendência da VIDA 17 |
