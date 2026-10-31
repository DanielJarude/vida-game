# REWORK 12.4 — VIDA PERSONALIZADA: MORADIAS, VEÍCULOS E OBJETOS

> A casa reflete o que se escolheu e se pôs dentro dela; os veículos, o que se fez neles; a roupa, o estilo; a música e
> a arte, a pessoa. Os objetos guardam memória e atravessam gerações. Mais profundidade **sem** mais informação
> simultânea na tela: ver primeiro, mexer só quando se pede.

---

## 1. Auditoria inicial

### 1.1 Estado do repositório
| | |
|---|---|
| Branch de partida | `claude/rework12.35-submundo-conflitos`, HEAD `c7990f3` (REWORK 12.35) |
| Branch deste pacote | `claude/rework12.4-vida-personalizada` (criada de `c7990f3`) |
| Remotos no início | `origin/main` e `origin/claude/fix-pos-rework3-playtest` (produção) já em `c7990f3` — o 12.35 já estava publicado |
| Save | v20 (`VERSAO_SAVE = 20`) — mantido |
| Pacotes na base | `motor-textos` 786,4 kB · `Jogo` 774,8 kB · `motor` 753,3 kB · `motor-carreira` 665,3 kB · `motor-dados` 606,7 kB · `motor-patrimonio` 111,6 kB (limite 800 kB, nunca elevado) |

Relatórios consultados: REWORK 9.5 (a vida em objetos), REWORK 12 (patrimônio, consumo e negócios), 12.05
(sucessão de menores), 12.2 (luxo e coleção), 12.3, AUDITORIA 12.3.1 e 12.35.

### 1.2 O que já existia (e foi estendido, não duplicado)
| Sistema | Onde | O que havia | Limitação encontrada |
|---|---|---|---|
| Tipos de moradia | `dados/bens.MORADIAS` | república, kitnet, apto 1q/2q/3q, alto padrão, cobertura, casa simples/2q/3q, casa grande, mansão, sítio — com padrão, quartos, área | a moradia era um número (`padrao`); nada por dentro; "decorar" e "reformar" eram botões únicos |
| Coisas da vida | `dados/coisas`, `sistemas/coisas`, `pertences` | bens duráveis com uso, variante (cor), desgaste, venda | sem lugar (tudo "com você"), sem história, sem valor afetivo; quebrou = sumiu |
| Coleção | `sistemas/colecao` | peças com procedência, certificado, história (`EpisodioBem`), afeto em palavras | na herança, **vendida no inventário** (pendência do REWORK 12) |
| Veículos | `sistemas/veiculos`, `usos` | classes + versões, depreciação, problemas, revisão, guardado em outra cidade | "personalizar" era um botão (−3% do valor); sem peças; sem iate nem helicóptero; revisão não ia para o histórico |
| Estilo | `dados/estilo`, `sistemas/estilo` | 26 itens (óculos, chapéus, 5 "roupas" conjunto, relógios, joias), usar/guardar, retrato | 5 roupas inteiras; sem estilos culturais; sem ocasião |
| Música e arte | `musica` (papel profissional), `arte` (projetos, obras de carreira), frentes `musica`/`desenho`/`fotografia`/`escrita` | prática e carreira | sem gosto pessoal; sem programa cultural; sem obra amadora como objeto |
| Herança | `sistemas/sucessao` | inventário, partilha, bens em espécie (imóvel, veículo, negócio), coisas da mesma casa | coleção vira dinheiro; relógios e joias somem; objetos sem memória de quem eram |
| Custos do mês | `dinheiro.PATRIMONIO_NO_MES` | registro por módulo (imóveis, coleção, exóticos) | — (reaproveitado) |

### 1.3 Decisões de arquitetura
- **Nenhum sistema paralelo**: a casa é `Imovel`/`Moradia` + um campo opcional `lar`; os objetos são as mesmas
  `CoisaTida`, `Colecionavel` e `ItemDeEstilo` com campos opcionais (`local`, `comodo`, `memoria`, `historia`…); os
  veículos ganham `mods`; a roupa é o mesmo catálogo de estilo com peças por parte do corpo.
- **Uma ação nova** no motor (`{ tipo: 'personalizar', op }`), roteada para `sistemas/personalizacao` — `acoes.ts`
  mudou 8 linhas.
- **Um lugar por objeto**: o campo `local` é único (ausente = na casa onde se mora); mover troca o valor, nunca copia.
  `normalizarLocais` roda depois de toda ação, todo ano e na carga do save.
- **Pacotes**: o núcleo de leitura (`lar`, `memoriaDosObjetos`) é "de base" (só tipos e catálogos) para que `dinheiro`
  e `coisas` o leiam sem ciclo; as ações (`personalizacao`, `gostos`) foram para `motor-patrimonio`; a interface nova é
  um pacote próprio carregado sob demanda (`Personalizar`, 29 kB).

---

## 2. Funcionalidades implementadas

### 2.1 Pilar 1 — Moradias e ambientes (`dados/lar.ts`, `sistemas/lar.ts`)
- **Planta por tipo** (`PLANTAS`): a kitnet e a república são um cômodo só (sala, cozinha e quarto juntos); os
  apartamentos não têm terreno (obra, nunca); a cobertura tem piscina e terraço (e o prédio só deixa jardim, academia,
  jogos e cinema no terraço); a casa grande vem com garagem, jardim e área de lazer; a mansão com piscina, jardim,
  lazer, garagem, escritório e cinco quartos extras; o sítio com 3.000 m² de terreno. Vagas de garagem por tipo.
- **16 tipos de cômodo**: sala, cozinha, quarto, quartos adicionais, banheiro, escritório, sala de jogos, academia,
  garagem, jardim, piscina, área de lazer, estúdio musical, ateliê (espaço artístico), biblioteca, sala de cinema.
- **Mudar o uso de um quarto que sobra** (custo próprio de cada conversão: estúdio com tratamento acústico R$ 18 mil,
  academia R$ 4 mil…) — bloqueado quando o quarto é de alguém (os moradores ocupam um quarto a cada dois; o par divide
  o seu). **Construir no terreno** (piscina R$ 80 mil, edícula de estúdio R$ 120 mil, sala de cinema R$ 150 mil…), só
  em casa própria, só com terreno livre; a obra entra no valor do imóvel **pela metade** do que custou.
- **Acabamentos por cômodo**: piso (cerâmica → mármore, por m²), parede (12 cores/revestimentos, por m² de parede),
  iluminação (lâmpada → automação). Quem mora de aluguel mexe na superfície (pintura, luz, uso do quarto); piso e obra
  só na casa própria. O que se faz numa casa alugada fica na casa ao sair.
- **Os cômodos mostram o que de fato tem dentro**: cada coisa entra no cômodo onde costuma ficar (`COMODO_DA_COISA`) e
  a pessoa pode levá-la a outro. O cômodo que "pede" equipamento (estúdio → instrumento; academia → aparelho;
  biblioteca → livros; ateliê → material) só ajuda a prática quando está equipado (`bonusDosComodos`, somado ao teto
  já existente de `coisas.bonusDaAtividade`).
- **Conforto (0–100) com o porquê** (`confortoDaCasa`): o padrão do imóvel (com os móveis de sempre, implícitos), os
  acabamentos escolhidos, a conservação (`Imovel.estado`, o mesmo de sempre), o que se pôs dentro (cama boa, sofá,
  mesa…), os cômodos de lazer em uso, a arte à vista e o aperto (gente demais para os quartos). **Nunca o saldo**: ficar
  rico não mobilia a casa (há teste).
- **Efeito no ano** (`efeitoDoAnoEmCasa`), com faixa neutra calibrada no simulador: a casa comum (30–64) não mexe no
  humor; a muito boa (≥ 65) descansa até +2 de felicidade e −1,5 de estresse; a difícil (< 30) cansa no mesmo tanto.
- **Manutenção**: o que se constrói tem custo de mês (piscineiro, jardineiro), o mármore e a automação também; reparos
  e reformas continuam os de antes (`usar_casa: reformar`, reparo do imóvel) — sem sistema novo de conservação.
- Propriedades rurais: o sítio tem planta e terreno próprios; a integração produtiva fica para o REWORK 12.45.

### 2.2 Pilar 2 — Veículos e bens (`dados/personalizacaoVeiculo.ts`)
- **Peças por categoria**, cada uma estética **ou** funcional:
  carro (pintura/envelopamento, rodas, interior/estofamento, acessórios | pneus, freios, suspensão, motor),
  moto (pintura, banco, baú/alforjes | pneus, escapamento, motor), bicicleta (pintura, selim | transmissão),
  embarcação (estofados e capota, faixa e nome no casco | casco antiincrustante, eletrônica de bordo, motor),
  aeronave (esquema de pintura, interior executivo | aviônica).
- **Consequências**: `efeitoDasMods` multiplica a chance de problema (`fragilidade`), o custo de rodar (`uso`) e o
  valor de mercado (`valor`). A preparação de motor anda mais, quebra mais (×1,18) e vale menos (×0,94); o pneu bom
  cuida (×0,93); gosto de dono (pintura chamativa, som) perde valor na revenda. Preço = fração do preço de um igual zero
  (com piso em reais): a mesma pintura custa mais num carro de luxo.
- **Nome próprio**, **papel de coleção** (parado na garagem, gasta devagar), **garagem em outra propriedade**; a pintura
  guarda a cor de fábrica para voltar a ela; **toda revisão entra no histórico de manutenção**.
- **Iate** (tripulação própria, patrimônio mínimo para manter) e **helicóptero** (licença de piloto, hora de voo cara)
  como classes novas, com duas versões cada e desenho próprio.
- **Móveis e equipamentos** individualizados: cada coisa tem cor/acabamento, nome, cômodo, história; **repaginar**
  (estofar o sofá, pintar a mesa) troca a variante com custo. 16 objetos novos com função real: jogo de cama, mesa de
  jantar, poltrona de leitura, projetor, mesa de sinuca, estação de musculação, toca-discos e som, discos de vinil
  (comprados de lote em lote), home studio, controladora de DJ, cavaquinho, pandeiro, sanfona, saxofone, cavalete e
  tintas, torno de cerâmica — cada um com desenho próprio e usos (tocar, mixar, ouvir com alguém, sinuca com amigos…).
- **Colecionáveis**: a coleção existente ganhou lugar (casa, cofre, outra propriedade), **exposição** num cômodo,
  marca **"de família"** e memória.

### 2.3 Pilar 3 — Localização, posse e organização
- `local` em coisas, peças e itens de estilo: em casa (padrão), `im:<imóvel>` (outra propriedade sua, não alugada),
  `dep:<cidade>` (depósito alugado: R$ 180/mês + R$ 45 por coisa grande), `cofre:<cidade>` (só o que é pequeno:
  relógio, joia, peça pequena de coleção; R$ 900/ano). Frete: coisa grande R$ 350 na cidade, R$ 1.800 para longe;
  arte com seguro (0,5% do valor).
- **Ações**: guardar, levar, retirar, emprestar (segue sua; volta se a pessoa morre), pedir de volta, doar (sai da sua
  vida, entra na lembrança e nos presentes da pessoa), expor, vender (o de sempre).
- **O que está fora não age**: o violão no depósito não ajuda a prática; a máquina de lavar emprestada não tira peso da
  semana; guardado, quase não se gasta.
- **Garagem**: carros e motos além das vagas da casa pagam vaga alugada; um veículo pode ficar na garagem de outra
  propriedade (até as vagas dela); barco e avião continuam na marina e no hangar (já pagos).
- **Integridade**: imóvel vendido devolve o que estava nele para casa (com a linha na história); mudar para a
  propriedade onde o objeto estava o põe "em casa"; ids repetidos ficam uma vez só; looks só guardam peças que existem.

### 2.4 Pilar 4 — História e memória (`sistemas/memoriaDosObjetos.ts`)
- `MemoriaDoObjeto` (origem: compra, presente, herança, feito, conquista; de quem; por quê) + `historia` (as últimas 30
  linhas: compra, reparos, repaginação, mudança de lugar, empréstimo, obra, herança).
- **Valor afetivo separado do de mercado** (`afetoDe`): a origem (presente 25, feito 30, conquista 40, herança 45), os
  anos juntos (até +20) e o uso com gente (`vinculo.habitos`, até +20). Nunca vira dinheiro. Pesa: vender o que tem
  história vai para a Linha da Vida; **o que tem história e quebra vira lembrança** (guardado, não vai para o lixo);
  doar o que tem história aproxima mais; na mudança de país, o móvel de família vai de navio (com frete).
- O primeiro instrumento nasce marcado; o que o adulto da família compra para a criança nasce como presente.

### 2.5 Herança e sucessão (`sistemas/sucessao.ts`)
- **Peça de família** (`deFamilia`): entra no inventário inteira (tipo `peca`), atribuível no testamento; sem
  escolha, fica com os filhos (do mais velho ao mais novo, enquanto a parte de cada um couber), senão com o cônjuge;
  sem dono possível, vai a leilão (como antes). As outras peças continuam vendidas no inventário.
- **Quem continua** recebe a peça com a história e a memória "herdada de…"; os **acessórios** (relógios, joias) e os
  **objetos com história** (valor afetivo ≥ 45) vão junto mesmo morando em outra casa; o que já era da herdeira
  (posses de uma herança anterior) continua dela.
- **Outros herdeiros** guardam as peças nas posses (`Posses.colecao/objetos/estilo`): se um dia continuarem a
  história, as peças estão lá.
- Distinção mantida: bens vendidos antes da morte (somem da vida, ficam na história do objeto), bens transferidos
  (doados em vida), bens herdados (inventário), presentes (memória), objetos pessoais (fora do inventário), coleções de
  família (em espécie).

### 2.6 Pilar 5 — Roupa e identidade (`dados/estilo.ts`)
- **Peças por parte do corpo** (`LugarDoCorpo`): em cima, embaixo, inteira (vestido, conjunto, macacão), por cima
  (jaqueta, blazer, casaco), nos pés; uma peça por parte (o vestido tira a calça e a camiseta; a jaqueta vai por cima).
  As 5 roupas antigas continuam como conjuntos (corpo inteiro). O retrato mostra a parte de cima (sem desenho novo).
- **44 peças novas** (camisetas, camisas, calças, bermudas, saias, vestidos, jaquetas, casacos, tênis, sapatos, botina,
  chinelo, chapéu de couro, turbante, óculos espelhado, correntes, guias) em **18 estilos**: casual, esportivo, social,
  elegante, alternativo, urbano, streetwear, hip-hop, baile (funk), rock, punk, skate, vintage, minimalista, luxuoso,
  tradicional, regional, afro-brasileiro.
- **Sem estereótipo**: nenhum estilo lê bairro, cidade, classe ou renda; todo estilo (menos o "luxuoso") tem peça
  barata (teste); as descrições falam da cultura (o baile, a roda, o sertão, o pampa, o axé), nunca de quem "deveria"
  usar.
- **Ocasião** (`looks`): separar a roupa do trabalho, da escola, da festa, do evento, do esporte, do encontro — só se
  quiser (ausente, a de todo dia vai para tudo). `adequacaoDaRoupa` diz "cai bem", "nada demais" ou "destoa".
  **Integração**: na entrevista de setores formais (jurídico, finanças, público, administrativo) a roupa adequada soma
  +3 pontos de chance e a que destoa tira 4; quem nunca comprou roupa não perde nada.
- **Fases do estilo**: quando o estilo dominante muda (o skate dos 16, o social dos 30), a fase fica registrada e a
  mudança vai para a Linha da Vida. A loja de roupas filtra por estilo.

### 2.7 Pilar 6 — Música, arte e expressão (`dados/gostos.ts`, `sistemas/gostos.ts`)
- **21 gêneros** (funk, rap, hip-hop, trap, samba, pagode, sertanejo, forró, piseiro, axé, MPB, bossa nova, rock, metal,
  punk, pop, eletrônica, reggae, jazz, clássica, gospel) e **8 linguagens** (pintura, desenho, fotografia, grafite,
  escultura, artesanato, escrita, design).
- **O gosto nasce da casa** (o preferido de quem cuidava — também sorteado sem ler classe), e **muda com a vida**: o par
  e quem mora junto puxam a música deles, a adolescência descobre, o instrumento praticado puxa o seu gênero, o que
  não se alimenta esfria devagar, a arte praticada vira gosto. As descobertas ficam registradas ("o forró, com Ana").
- **Atividades reais**: montar a playlist do ano (grátis; com toca-discos rende mais), ir a um programa cultural — show
  (de qualquer gênero), roda de samba, baile funk, forró pé de serra, batalha de rima, festival, concerto, sarau,
  exposição — sozinho ou com alguém (custa por pessoa; quem gosta do mesmo aproxima mais; o gosto do outro pode virar
  seu); produzir uma obra (pede o material/equipamento em casa, gasta material, pratica a frente, uma por linguagem por
  ano) que vira **peça sua** (coleção, procedência própria, memória "feita por você"), para expor em casa ou dar.
- **Coleções e espaços**: discos de vinil (lote a lote), biblioteca (cômodo + livros + poltrona), ateliê, estúdio,
  galeria pessoal (obras e peças expostas pelos cômodos).
- **Hobby → profissão** (6.5): a tela aponta o ofício já existente quando o hobby amadureceu (habilidade ≥ 40 e duas
  obras): ilustrador, fotógrafo, artesão, escritor, designer, músico da noite. Nenhuma carreira nova foi criada.

### 2.8 Pilar 7 — Interface (`ui/jogo/Personalizar.tsx`, `ui/personalizar.css`)
- **Vida · Casa → "A casa por dentro"**: uma linha (conforto, cômodos, vagas, terreno); "De onde vem esse conforto"
  recolhido; os cômodos como uma fileira de nomes com a contagem; **um cômodo aberto por vez** (o que tem dentro);
  "Personalizar" num segundo passo (piso, parede com amostra de cor, luz, mudar o uso); "Levar coisas para outro
  cômodo" como modo (sem um botão por objeto); "Ampliar a casa" recolhido.
- **Patrimônio · Objetos → Usar | Organizar**: dois modos, nunca as duas listas juntas. Organizar = busca, filtro por
  tipo e por lugar, ordem (recentes, nome, valor de mercado, valor afetivo), **páginas de 12**; um objeto por vez abre
  a ficha (desde quando, de onde veio, valor de mercado × para você, a história recolhida) e as ações, cada uma
  revelada só ao ser pedida.
- **Patrimônio · Garagem**: "Personalizar" lista os veículos; um painel por vez com **Aparência | Mecânica | Nome,
  garagem e história**; o preço e o efeito aparecem só ao escolher uma opção diferente.
- **Você · Aparência**: guarda-roupa recolhido (estilo dominante, fases, filtro por estilo, roupa de cada ocasião);
  **Música e arte** compacto (os três preferidos, a playlist; "Sair" e "Produzir uma obra" recolhidos).
- Só tokens (as quatro paletas), prefixo `pz-` exclusivo (a auditoria de CSS impede classe raiz repetida), alvos de
  toque de 44 px, sem animação nova além da seta (respeita movimento reduzido), uma coluna no celular.

### 2.9 Notas da versão
`ui/novidades.ts` · versão **12.4** (Novidades, Melhorias, Correções), só com o que está no jogo.

---

## 3. Funcionalidades adiadas e justificativas
| Item | Por quê |
|---|---|
| Cena ilustrada de cada cômodo (o piso e a cor desenhados) | o pacote `Jogo` está em 784,7 kB (limite 800); a cor aparece como amostra e o cômodo como lista de objetos com desenho. Fica para quando a ilustração da casa for para um pacote próprio. |
| Roupa desenhada da cintura para baixo e peças novas no retrato | o retrato é de busto e conhece 5 roupas; as peças novas usam o desenho da roupa mais próxima. |
| Carreiras novas a partir de hobbies | o pedido permitia preparar; a ponte aponta os ofícios que já existem. |
| Integração produtiva do sítio | reservada ao REWORK 12.45 (a planta e o terreno já existem). |
| Mais efeitos da roupa (encontros, festas, notoriedade) | só a entrevista formal foi ligada (efeito pequeno, com justificativa); os outros pedem playtest para não virar obrigação de trocar de roupa. |
| Bens de empresas como objetos | as empresas não têm objetos individuais (equipe e estoque são números); o inventário separa por construção o pessoal (Objetos) do empresarial (Empresas). |
| Reação de visitantes ao conforto em festas | `usos.ts` mora no pacote `motor-textos` (786,8 kB); o conforto e a arte à vista já pesam no conforto lido pela casa. |

---

## 4. Arquivos

**Novos**
- `src/motor/dados/lar.ts` — cômodos, plantas, acabamentos, onde cada coisa fica, depósito/cofre/vaga.
- `src/motor/dados/personalizacaoVeiculo.ts` — peças por categoria e o efeito somado.
- `src/motor/dados/gostos.ts` — gêneros, linguagens, programas culturais.
- `src/motor/sistemas/lar.ts` — planta, cômodos, objetos por cômodo, bônus, conforto, efeito do ano, custos (base).
- `src/motor/sistemas/memoriaDosObjetos.ts` — valor afetivo, história, origem em palavras (base).
- `src/motor/sistemas/personalizacao.ts` — a ação `personalizar`, lugares, frete, custos do mês, normalização, o ano.
- `src/motor/sistemas/gostos.ts` — gostos, atividades culturais, obras, hobby → ofício.
- `src/ui/jogo/Personalizar.tsx`, `src/ui/personalizar.css` — as telas (pacote sob demanda).
- Testes: `src/motor/__tests__/rework124.test.ts` (26), `src/ui/__tests__/rework124.test.tsx` (6).
- Ferramentas: `scripts/sim/personalizacao124.ts`, `scripts/playtest/gerarRework124.ts`, `scripts/playtest/rework124.mjs`.

**Alterados**
- `src/motor/tipos.ts` (campos opcionais), `acoes.ts` (a ação; normalizar lugares após cada ação), `ano.ts` (o ano),
  `save.ts` (`normalizarRework124`), `dados/bens.ts` (iate, helicóptero, versões, formas), `dados/coisas.ts` (16 coisas),
  `dados/pertences.ts` (variantes e usos), `dados/estilo.ts` (peças, estilos, ocasião), `sistemas/coisas.ts` (lugar,
  cômodo, lembrança, discos, frete de família), `sistemas/estilo.ts` (uma peça por parte do corpo),
  `sistemas/entrevista.ts` (roupa na entrevista formal), `sistemas/veiculos.ts` (efeito das peças, revisão no
  histórico), `sistemas/sucessao.ts` (peças de família, objetos com memória).
- UI: `Patrimonio.tsx` (modos, garagem), `VidaConcreta.tsx` (casa por dentro), `Aparencia.tsx`, `Voce.tsx`,
  `material/Lugares.tsx` (filtro por estilo), `ilustracao/objetos.ts` (16 desenhos), `ilustracao/aguaEAr.ts` e
  `veiculos.tsx` (iate, helicóptero), `novidades.ts`.
- `vite.config.ts`: `personalizacao` e `gostos` no pacote `motor-patrimonio` (o limite de 800 kB não foi tocado).

---

## 5. Integrações realizadas
| Sistema | Como conversa |
|---|---|
| Patrimônio | obra valoriza o imóvel pela metade do custo; peças mudam o valor do veículo; custos do mês em `PATRIMONIO_NO_MES` |
| Consumo/economia | todo gasto passa pelo extrato com linha própria ("A casa e os objetos…", "Música, arte…") |
| Inventário | `normalizarLocais` após toda ação, todo ano e na carga |
| Moradias | planta por tipo; aluguel × casa própria; casa da família não se personaliza |
| Veículos | fragilidade, custo de uso e valor; garagem e vaga; revisão no histórico |
| Negócios | separados: objetos pessoais em Objetos, empresas em Empresas |
| Família e filhos | quartos ocupados pelos moradores; aperto no conforto; presentes; empréstimos |
| Relacionamentos | programa cultural com alguém (lembrança, proximidade); gosto do par puxa o seu; doação com história |
| Herança/sucessão | peças de família em espécie; objetos e acessórios com memória para quem continua; posses dos outros herdeiros |
| Eventos/Linha da Vida | obra, construção, conversão, venda e doação do que tem história, fases do estilo, descobertas por escolha |
| Personalidade | programa cultural (sociabilidade), obra (disciplina) |
| Saúde e bem-estar | efeito do conforto (faixa neutra); lazer dos cômodos equipados |
| Hobbies | cômodos e objetos novos ajudam as práticas existentes (`bonusDaAtividade`, mesmo teto de 0,5) |
| Carreiras | entrevista formal; ponte hobby → ofício existente |

---

## 6. Testes executados e resultados

| Conjunto | Resultado |
|---|---|
| `rework124.test.ts` (motor, 26 testes) | 26/26 |
| `rework124.test.tsx` (telas, 6 testes) | 6/6 |
| `rework8b.test.tsx` (todo objeto com desenho único) | verde com os 16 objetos novos |
| Suíte completa (Linux, Node 22, `--maxWorkers=3`) | **2141/2145** — as 4 falhas são `Test timed out` (tempo fixo de 20 s e 60 s sob carga) |
| `tsc --noEmit` | limpo |
| Smoke da build de produção (`scripts/itch/smoke.mjs`) | 21/21 (sem ciclo de pacotes; jogo abre, salva e recarrega) |

Regressão encontrada e corrigida durante a validação: a primeira suíte teve 4 falhas reais em testes de vidas vividas
desde o nascimento (fila de acontecimentos, técnico promovido, negócio por fora). Causa: as descobertas de gosto do
correr do ano iam para a Linha da Vida de **toda** vida, consumindo ids sequenciais e deslocando o acaso derivado.
Correção: só as descobertas vindas de uma escolha do jogador vão para a biografia; as do correr do ano ficam nos gostos
(a tela as mostra). Confirmado: os três arquivos passam na base e no novo.

Os testes com tempo fixo (`motor.test` "regra de agência", 60 s; `fix31` "ajuda da família", 20 s) estouram só sob a
carga da suíte paralela nesta máquina — passaram isolados (47/47) numa rodada; noutra, com três arquivos em paralelo, dois
ainda estouraram por pouco (21,7 s / 20 s e 61 s / 60 s). A comparação de duração desses testes com a base **não foi
concluída** (a publicação foi autorizada antes); o simulador de desempenho não mostra diferença de tempo por ano
(§9), mas fica registrado como pendência verificar se o 12.4 deixou esses dois testes mais lentos.

---

## 7. Simulações (`scripts/sim/personalizacao124.ts`)

12 vidas por perfil, 25 anos (dos 28 aos 53), com as ações da tela; + 3000 nascimentos para gosto × classe.

| Perfil | Conforto p10/p50/p90 | Gasto em personalização p50 | Líquido p50 | Objetos p50 | Obras p50 | Save p50 | ms/ano | Violações | Crashes |
|---|---|---|---|---|---|---|---|---|---|
| nada (controle) | 38/38/38 | 0 | 509k | 0 | 0 | 104 kB | 9,6 | 0 | 0 |
| baixa renda (kitnet alugada) | 30/30/35 | 1k | 34k | 1 | 0 | 103 kB | 8,8 | 0 | 0 |
| classe média (casa 2q) | 38/40/50 | 4k | 466k | 1 | 0 | 106 kB | 9,0 | 0 | 0 |
| rico (mansão) | 77/77/86 | 316k | 6,3 mi | 8 | 0 | 105 kB | 9,3 | 0 | 0 |
| colecionador | 48/48/55 | 75k | 1,6 mi | 5 | 0 | 107 kB | 8,8 | 0 | 0 |
| músico | 42/45/47 | 25k | 809k | 8 | 3 | 110 kB | 8,8 | 0 | 0 |
| artista | 42/42/45 | 5k | 439k | 4 | 4 | 107 kB | 8,4 | 0 | 0 |

- **Invariantes**: 0 objetos em dobro, 0 lugares inválidos, 0 empréstimos a quem morreu; ida e volta do save idêntica.
- **Gosto × classe** (3000 nascimentos): o gênero preferido fica entre 3% e 8% em todas as classes (uniforme ≈ 4,8%) —
  sem dependência da origem. (Uma rodada de 600 mostrou 16% de clássica na classe alta com n = 43: ruído de amostra.)
- **Exploits**: personalizar tudo no carro e vender → −146 mil; construir piscina e cinema → patrimônio líquido −94 mil.
- **Herança**: peça de família e objeto com história passam a quem continua (1 e 1), sem violações.
- **Calibração feita pelo simulador**: na primeira versão o conforto ficava em 9–17 nas vidas comuns (os móveis de
  sempre não eram contados) e punia quase todo mundo todo ano; a base passou a ser "razoável" para o padrão médio, a
  conservação e o aperto pesam menos, e o efeito tem faixa neutra (30–64).

---

## 8. Verificação de saves antigos
- Save continua **v20**; todos os campos novos são opcionais. Um save sem nada disto carrega igual (teste) e
  `normalizarRework124` só confere lugares e ids repetidos.
- Ida e volta em JSON preserva casa (`lar`), apelidos, gostos, memórias, lugares (teste e simulador: 0 diferenças).
- Nada se perde nem se duplica: lugar inválido vira "em casa" com a linha na história; id repetido fica uma vez.

## 9. Desempenho
| Medida | Base `c7990f3` | 12.4 |
|---|---|---|
| ms por ano de vida (`tamanho75`, 16 vidas até 75) | 7,9 e 8,9 (duas rodadas) | 8,6 e 8,3 (antes e depois da otimização) — dentro do ruído |
| Save médio aos 75 | 116,4 kB | 116,9 kB (+0,4%) |
| Pacotes (kB) | `motor-textos` 786,4 · `Jogo` 774,8 · `motor` 753,3 · `motor-dados` 606,7 · `motor-patrimonio` 111,6 | 786,8 · 784,7 · 755,0 · 652,7 · 142,0 · **`Personalizar` 29,0 (sob demanda)** |

Nada é gerado de antemão: os cômodos saem da planta + diferença guardada; as combinações visuais são compostas na hora
(a cor do objeto, a amostra da parede); o inventário pagina de 12 em 12; `bonusDosComodos` sai cedo quando a casa não
tem cômodo para a atividade; `afetoDe` é derivado (não guardado).

## 10. QA visual (`scripts/playtest/rework124.mjs`)
12 cenas (casa da mansão, painel do cômodo, edição, kitnet, estúdio, inventário, ficha, garagem, gostos, guarda-roupa,
loja de roupas, novidades) × 4 paletas × 1440/390/360 px (+390×560 nas marcadas) = **300 capturas, 0 problemas**
(rolagem horizontal, elemento estourando a borda, contraste < 3:1, texto sobre texto, botão de avançar coberto) e 0
passos faltando. Depois de ver as capturas, dois ajustes de hierarquia: o painel do cômodo deixou de ter um botão por
objeto (virou o modo "Levar coisas para outro cômodo") e os blocos recolhidos ganharam a seta de abrir.

## 11. Limitações conhecidas
- O pacote `Jogo` tem 15 kB de folga até o limite; o próximo pacote visual precisa levar ilustrações para fora dele.
- A conservação da casa própria cai com os anos sem reforma (regra antiga); com filhos e sem reforma, a casa chega a
  "apertada" — coerente, mas vale playtest humano.
- O efeito da roupa existe só na entrevista formal; a "reação contextual" em encontros e festas fica para depois.
- Os gostos de quem não é o protagonista são derivados (três preferidos estáveis), não evoluem.
- O conforto não lê o clima nem o barulho do bairro.
- Pendências herdadas (12.35 e anteriores) seguem as mesmas.

## 12. Estado da branch, commits e publicação
ESTADO_FINAL

## 13. Execução com agente único
Todo o trabalho foi feito pelo agente principal, sequencialmente, nesta branch. **Nenhum subagente, nenhum Agent
Team, nenhuma worktree paralela** (as cópias em `~/vida-copia` e `~/vida-trabalho` são só cópias de teste em disco
Linux).
