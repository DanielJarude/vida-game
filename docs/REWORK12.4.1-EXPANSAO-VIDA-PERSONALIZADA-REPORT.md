# VIDA — ATUALIZAÇÃO 12.4.1 · Expansão da vida personalizada

Branch `claude/rework12.4.1-expansao-vida-personalizada` (a partir de `bf82394`). Save continua v20 — só campos opcionais.
Nota de versão `12.4.1` em `src/ui/novidades.ts`.

## 1. Auditoria inicial (o que havia)

| Frente | Estado encontrado |
|---|---|
| Moradias | A 12.4 já tinha a casa por dentro (planta, cômodos, acabamentos, objetos por cômodo), mas **sem ilustração**: cômodos eram botões de texto. "Deixar a casa com a sua cara" era um botão genérico (+3 de humor) que duplicava a personalização sem mostrar nada. A reforma mexe em estado/valor/padrão — já tinha função própria. |
| Casamento | `LOCAIS.ar_livre.rotulo = 'Ao ar livre (um sítio, um jardim, a praia)'`, e esse rótulo era colado no resultado e na biografia: "Casaram-se ao ar livre (um sítio, um jardim, a praia)…". A cerimônia não entrava na frase. |
| Natação/futebol | Auditoria por simulação (5 defeitos confirmados, §3). |
| Lojas | Um balcão único "Ótica, roupas e acessórios" e cinco lojas de objetos sem marca; nenhuma regionalização. **Causa do salto da lista**: `Folha` tinha `aoFechar` nas dependências do efeito de foco; quem abre a loja passa uma função nova a cada render, então toda compra refazia o efeito e focava o primeiro botão da folha → a lista subia. |
| Aparência | Retrato só do busto; calça, saia, calçados, casacos, relógio, pulseira não apareciam. Cinco "jeitos de vestir" com a mesma silhueta (camiseta, camisa e moletom quase iguais). "Música e arte" dentro de Aparência. |
| Imóvel | **O motor desconta certo** (reprodução: €275 mil → €9,8 mil após casa de €255 mil). O "€275 mil" que continuava visível era o **Patrimônio** no bloco do dinheiro (o imóvel passa de saldo a patrimônio; o total quase não muda), sem nada dizendo o que dá para gastar. |
| Compras em geral | Auditoria por script: imóvel, veículo novo/usado, móveis, eletrodomésticos, instrumentos, roupas, coleção — todos descontam exatamente o preço e registram o bem uma vez; nenhum bem sem pagamento, nenhum pagamento sem bem. |

## 2. Implementado

### Moradias
- **Cena de cada cômodo** (`ui/ilustracao/comodos.tsx`): parede com a cor/tijolo/papel/boiserie escolhidos, piso (cerâmica, cimento, vinílico, porcelanato, taco, mármore), luz (lâmpada, quente, sanca com pendentes, automação), janela, o que todo cômodo tem (bancada da cozinha, banheiro, árvore do jardim, piscina, churrasqueira, portão) e **os objetos que estão de fato no cômodo**, em escala aproximada. Miniatura em cada botão de cômodo e cena grande no painel.
- "Deixar a casa com a sua cara" saiu de `USOS_CASA` (o tipo e o motor seguem aceitando ações antigas). A reforma ficou, com nota explicando a diferença (conserta e renova; acabamentos se escolhem cômodo a cômodo).

### Eventos
- `conteudo/acontecimentos1241.ts` + passe próprio `motor.vidaPorFasesDoAno` (gerador derivado, ≤1 por ano, decisão só em ano sem decisão).
- Infância: feira de ciências (8–11; com o adulto da casa, sozinho, ou o kit pago pela família conforme a classe/reserva).
- Adolescência: intercâmbio (paga a família ou bolsa por desempenho), banda de garagem (precisa de instrumento ou música), primeira viagem sem os adultos (depende da tensão com o responsável).
- Vida adulta: ninho vazio, dez anos de casados, filho adulto pede ajuda com a entrada (exige filho fora de casa e dinheiro), goteira na casa própria envelhecida, anos no mesmo emprego, a vizinhança nova (chegou há pouco e não conhece ninguém).
- Simulação (30 vidas até os 70): feira 13, ninho vazio 7, cidade nova 7, mesmo emprego 6, goteira 4, filho/entrada 3, intercâmbio 2, viagem 2.

### Casamento
- `PlanoDeCasamento.cenario?: 'sitio' | 'jardim' | 'praia'` (opcional). Ao ar livre exige escolher; o resumo, o resultado e a biografia dizem só o escolhido e a cerimônia: "Casaram-se ao ar livre, em um jardim, numa cerimônia simbólica, com celebrante, com 400 convidados." Plano antigo sem cenário: "ao ar livre". Trocar de local remove o cenário.

### Natação e futebol (auditoria por simulação)
1. A idade cobrava **a cada chamada de `praticar`** — adulto praticando natação ia de 8 a 0 em dez anos; prática extra tirava mais. Agora uma vez por ano (`Frente.tDeclinio`, opcional), e o amador adulto não perde mais do que 80% do que o ano deu (na base/profissional, a régua de antes).
2. O peso do treino ignorava o tempo (aula de natação de 1 h contava como pelada de 30 min): no esporte, o peso acompanha `tempo`, nunca abaixo da régua anterior.
3. A equipe de natação custava menos que a aula (120 × 150): agora 190.
4. Quem caía da equipe ia para a aula, mais cara e igualmente inacessível: se nem o primeiro degrau cabe, a atividade sai, com o porquê.
5. A janela de oferta de 3 anos quase nunca mudava (FNV sem mistura final: 4,8% de troca entre blocos): agora `rng.hashMisturado`.
6. A criança coberta pelo projeto social pagava o preço cheio na conta da casa: agora 0.

### Lojas
- `dados/lojas.ts`: 89 marcas (74 reais, 15 fictícias) com faixa (popular, média, premium, luxo), categorias, mercados e restrição de produto; 38 estabelecimentos — 13 especializadas, 20 grandes lojas/departamento por país (Renner, C&A, Magazine Luiza, Casas Bahia, Falabella, Liverpool, Macy's, Target, Best Buy, El Corte Inglés, Coin, Rinascente, Galeries Lafayette, MediaMarkt, Marks & Spencer, John Lewis, Isetan, Yodobashi, Myer, e uma fictícia para AFR/ASIA/LATAM) e 5 online (Amazon, Mercado Livre, Zalando, AliExpress, Farfetch).
- `sistemas/lojas.ts`: mercado pelo país (BR, LATAM, NA, EU, UK, ASIA, AFR, OCE), lojas pela cidade (tamanho), ofertas por marca, preço = referência × faixa × (online: frete e, se a marca não vende no país, importação). As compras de sempre (`comprar_item`, `comprar_coisa`) ganharam `marca`/`loja` opcionais, validados no motor; marca e loja ficam no objeto.
- Exemplo: Roma (EU) tem Coin, Rinascente, El Corte Inglés, Galeries Lafayette, MediaMarkt, Zalando — e não tem Hering; São Paulo tem Renner, C&A, Magazine Luiza, Casas Bahia, Mercado Livre; uma cidade pequena da Nigéria não tem Amazon.
- `ui/jogo/material/Lojas.tsx` (sob demanda): seção, faixa de preço, "Ver mais", marca escolhida na linha, a peça vestida em você. Compras agrupa em Lojas especializadas / Grandes lojas / Pela internet; Cidade lista as lojas físicas da cidade.
- **Rolagem**: `Folha` guarda o fechar numa ref (efeito só ao abrir/fechar), foco com `preventScroll`, trava do corpo por contagem (a folha de resultado por cima não destrava a página). As ofertas da loja são memorizadas por cidade e cada linha guarda a própria escolha (chave = produto) — comprar muda só aquela linha.

### Aparência e inventário
- `sistemas/silhueta.tipoDeCorpo` (sem atributo novo): forma, sedentarismo, bebida, academia/esporte, base/profissional, predisposição física e idade → magro, mediano, atlético, musculoso, acima do peso.
- `ui/avatar/Figura.tsx` (sob demanda, pré-carregada pelo App): a cabeça é o próprio `Retrato` (`soCabeca`); corpo com proporções da idade e do tipo; cada parte desenhada (gola, carcela, capuz, bolso canguru, listras, xadrez, escudo de time, vestidos, saias, short, legging, jaquetas, blazer, sobretudo, gravata do terno; tênis, corrida, cano alto, lona, sapato, coturno, botina, salto, sandália, chinelo, sapatilha, mocassim; relógio analógico/digital/smart, pulseira, anel, corrente, contas). Nível de detalhe por tamanho; sombra no chão.
- `ui/avatar/pecas.ts`: desenho de cada item (forma, cor, estampa, manga, comprimento, caimento). O busto (`Retrato`) passou a mostrar a peça de cima em uso (`Visual.superior`, opcional) com a gola e o detalhe dela.
- 18 itens novos (polo, listrada, tricô, seda, cropped, short, legging, saia lápis, vestido longo, sandália, sapatilha, mocassim, 4 pulseiras, 2 anéis). Brincos têm lugar próprio (orelha): corrente e brincos juntos (`Visual.brincos`, opcional; `estilo.sincronizarVisual`).
- Você · Aparência: figura de corpo inteiro + "O que você está usando", parte a parte (trocar/tirar; a peça que sai fica guardada).

### Aba Você
- Nova parte **Gostos e cultura** (a partir dos 8): "Gostos e preferências" (gêneros, linguagens, como o gosto mudou, playlist) e "Atividades artísticas e culturais" (sair para show/exposição, produzir obra; aponta para a prática e Caminhos para compor/shows como carreira). Aparência ficou só com o visual.

### Dinheiro
- Bloco do dinheiro: "Para gastar agora" (conta + aplicado) separado de "Patrimônio (com imóveis e bens, menos as dívidas)". Comprar imóvel diz quanto foi pago e quanto sobrou para gastar.

## 3. Arquivos
Novos: `motor/dados/lojas.ts`, `motor/sistemas/lojas.ts`, `motor/sistemas/silhueta.ts`, `motor/conteudo/acontecimentos1241.ts`, `ui/avatar/Figura.tsx`, `ui/avatar/pecas.ts`, `ui/avatar/figuraSobDemanda.ts`, `ui/ilustracao/comodos.tsx`, `ui/jogo/material/Lojas.tsx`, testes `motor/__tests__/rework1241.test.ts` e `ui/__tests__/rework1241.test.tsx`, ferramentas `scripts/playtest/galeria1241.tsx` e `scripts/playtest/rework1241.mjs`.
Alterados: `motor/acoes.ts`, `ano.ts`, `tipos.ts`, `conteudo/catalogo.ts`, `conteudo/motor.ts`, `dados/estilo.ts`, `sistemas/{casamento,coisas,estilo,frentes,rotinas,usos}.ts`; `ui/comum.tsx`, `App.tsx`, `novidades.ts`, `avatar/Retrato.tsx`, `jogo/{Aparencia,Casa,Casamento,Cidade,Compras,Dinheiro,Personalizar,Voce}.tsx`, `jogo/material/Lugares.tsx`, `personalizar.css`, `vida.css`; testes antigos adaptados (§4).

## 4. Testes
- Novos: 16 de motor (casa, casamento, natação/futebol, lojas, aparência, imóvel, eventos, saves) e 3 de tela (a loja não perde lugar, seção nem foco após comprar; figura + troca por parte; cenas dos cômodos).
- Adaptados por mudança intencional: `rework10` (seis partes em Você), `rework7` (grupos de Compras), `coisas` (Cidade abre `loja:eletronicos`), `rework124` (Gostos e cultura).
- Adaptados por deriva de vida sorteada (o passe de eventos por fase muda vidas de nascimento — com ele desligado, os 97 testes desses arquivos passavam): `rework105` (escolhe semente ainda matriculada), `rework115Eventos` (semente com decisões acima do teto), `rework106` (só o convite do teste aberto). `rework2` pegou um efeito real: os eventos davam +2/+3 de cognição num ano — removido na infância/adolescência, +1 no adulto.
- Suíte completa (Node 22, cópia Linux, `--maxWorkers=3`): **127 arquivos, 2164 testes, todos passando**. Na primeira rodada, 12 falharam: 4 por mudança intencional de tela, 3 por deriva de vida sorteada, 1 efeito real (cognição) — corrigidos acima — e 2 timeouts de 60 s de carga (passam isolados, como na base).
- `build:itch` + `smoke:itch`: 21/21. Auditoria visual `rework1241.mjs` (11 cenas × 4 paletas × 1440/390/360): 264 capturas, 0 problemas de geometria, contraste ou alvo de toque.
- Visual: galeria de figuras (5 corpos × 2 gêneros, 7 idades, 20 looks, miniaturas a 72 px, bustos) e de cômodos (13 cenas) — `scripts/playtest/galeria1241.tsx`; auditoria geométrica/contraste do jogo real com `scripts/playtest/rework1241.mjs`.
- Saves: save antigo carrega; marca, loja, cenário e visual novo persistem no JSON.
- Bundle: `Jogo` 788 kB (limite 800 kB intocado); Figura 25 kB e Lojas 5 kB em pacotes próprios.

## 5. Não resolvido / pendências
- Objetos de consumo (móveis, roupas, relógios de uso) não entram no patrimônio líquido (só imóveis, veículos, coleção, empresas e aplicações) — é a regra de antes; o relógio de luxo de coleção continua em Luxo e coleção.
- Uma peça por item do catálogo: ter o mesmo jeans de duas marcas não é possível (a loja mostra "É seu").
- Lojas físicas: o mercado é por região, não por país dentro da União Europeia (uma marca "EU" está em toda a Europa).
- A janela de oferta das atividades mudou de sorteio (agora muda de fato a cada 3 anos): vidas antigas podem ver a oferta da cidade mudar no próximo bloco.
- Dois testes com teto fixo de 60 s (`motor.test` agência, `fechamentoMundo` #4) às vezes estouram sob carga na suíte completa, como na base; isolados levam 45–50 s (base: 37–52 s).
- Sem teste em aparelho real.
