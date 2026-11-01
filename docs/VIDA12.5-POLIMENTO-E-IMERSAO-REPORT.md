# VIDA 12.5 — Polimento e Imersão

Branch `claude/rework12.5-polimento-imersao` (a partir de `feb58c5`, 12.4.2 publicada). Notas do jogo: versão **12.5**.
Nada foi publicado nem enviado ao repositório remoto.

Auditorias completas (com números, sementes e exemplos) em `~/vida-trabalho/a125/`: `car118.md` (indicações),
`car119.md` (acontecimentos das carreiras), `sistemas.md` (bugs transversais), `memorias.md` (fontes da retrospectiva).

## 1. Diagnóstico inicial

| Frente | Situação encontrada | Classe |
|---|---|---|
| Estúdio de tatuagem | Prévia de 118 px, corpo inteiro: impossível avaliar desenho e tamanho | 2 |
| Roupas e acessórios | Peças sentam bem em 5 corpos × idades; óculos e chapéus vêm do visual (`estilo.ts:231`); não há bolsa vestível no catálogo | 1 |
| Aparência dos NPCs | Variedade boa de pele, cabelo, idade; envelhecimento coerente (grisalho, óculos, calvície) | 1 |
| Fachadas | Moda, sapataria, ótica, acessórios e **todas** as lojas de departamento usavam a mesma vitrine; móveis usava a de eletrodomésticos; as lojas pela internet mostravam "ÓTICA & MODA" | 5 |
| Imóveis | Diferenciação clara do econômico ao alto padrão; a mansão parecia menos que a casa grande | 2 |
| Interface | Medição automática em 19 telas × claro/escuro × 1440/390/360: 0 rolagem horizontal, 0 estouro, 0 texto sobre texto, contraste ok | 1 |
| Animações | Quase nenhuma (apostas e um "surgir" genérico); os grandes momentos passavam sem destaque | 4 |
| Bugs transversais | 6 confirmados (B1–B6) + 2 melhorias (M1, M2) em 36 vidas / 2.486 anos; 0 crashes, 0 NaN | 5 |
| CAR-11.8 | **Persistia**: 96% das indicações fora da área do recebedor; 61% rebaixando 2+ níveis; colegas nunca indicavam; aposentados "indicando onde trabalham" | 5 |
| CAR-11.9 | Futebol melhorou só pelos contratos: a cena do atleta perdia o espaço do ano para a renovação (bug); tênis com 3 cenas; medicina 4; negócio 2; carreiras comuns com 50–70% de anos vazios | 5 |
| Retrospectiva | Não existia (só as frases do fim da vida, `retrospectiva.ts`) | 4 |

## 2. O que mudou

### 2.1 Personagem
- **Lupa do estúdio** (`ui/jogo/Tatuagens.tsx`, `avatar/Figura.focoDaParte`): abre na região escolhida (peito com ombros, braço do ombro ao pulso, costas, coxa, pescoço…), níveis Corpo inteiro / Região / Perto / Bem perto, botões aproximar/afastar, "Corpo inteiro", frente/costas por figuras de referência (com o retângulo de onde a lupa olha). A anatomia e as outras tatuagens ficam no lugar.

### 2.2 Lojas
- **26 fachadas novas** (`ui/ilustracao/fachadasDeLoja.ts`): 6 por segmento (moda com manequins e arara; sapataria com escada de sapatos; ótica com parede de armações; acessórios; móveis com a sala montada; a rua das grifes); 5 prédios próprios (C&A, El Corte Inglés, Coin, Rinascente, Galeries Lafayette com a cúpula); 15 grandes lojas por um modelo com material, andares, placa, marquise e vitrine de cada uma (Renner, Magalu, Casas Bahia, Falabella, Liverpool, Macy's, Target, Best Buy, MediaMarkt, Marks & Spencer, John Lewis, Isetan, Yodobashi, Myer, Grandes Armazéns).
- **Lojas pela internet** (Amazon, Mercado Livre, Zalando, AliExpress, Farfetch): centro de distribuição com portas de carga, doca com caixas, esteira e van, na cor de cada marca.
- Placas que encolhem para caber; letra serifada ou não por marca. Conferidas em miniatura e ampliadas.

### 2.3 Imóveis
- A mansão ganhou ala lateral, sacada, águas-furtadas, postes de luz, caminho de pedra, piscina com deck e palmeira (`ui/ilustracao/casas.ts`). Os cômodos em 2.5D (12.4.2) foram conferidos e mantidos.

### 2.4 Feedback
- **Celebração do ano**: o momento marcante do ano (casamento, filho, título, prêmio, casa própria, formatura, eleição, mudança de país) abre "o ano que passou", num cartão com o ícone da categoria e uma entrada de 0,45 s (sem animação para quem pede menos movimento).

### 2.5 Retrospectiva da Vida (nova)
Ver §4.

### 2.6 Bugs corrigidos (auditoria transversal)
- **B1** avós com 12–14 anos no nascimento do tio (6,5% das vidas): idade do tio limitada pelos avós; e o irmão mais velho pela idade do pai (`criacao.ts`).
- **B2/B3** vender ou dar a alguém o que está emprestado a outra pessoa (`coisas.ts`, `personalizacao.ts`).
- **B4** veículo principal apontando para carro que saiu dos bens em 8 caminhos: `nucleo.tirarBem` em todos; a venda "como está" não deixa a conta negativa (o que sobra do financiamento continua como dívida).
- **B5** emprego guardado no serviço militar ficava 12 meses sobreposto; **B6** a convocação não entrava na Linha da Vida (`militar.ts`).
- **M1** festa de 15 anos (0 em 27 vidas de meninas) agora prioritária; solidão na velhice com peso; dois conteúdos mortos marcados `manual`.
- **M2** CNH: um ano de espera depois de desistir; reprovações em série saem da biografia principal.
- **Fila do ano**: a decisão de contrato aberta (prioridade ≥ 4) não gasta mais o espaço de decisão do ano.
- Textos: "O ano no torneios nacionais" → "nos"; "A mesa dele" para colega mulher; diarista sem cenas de plantão de hospital; "o primeiro grande trabalho" não aparece mais para veterano; convites expirados de gente distante saem da biografia principal; discos do mesmo ano com o mesmo título (a contagem parava em 20); a contagem de cidades no fim da vida ignorava as mudanças para o exterior.
- `mundoVivo`: sem "reorganização com demissões em outros andares" para quem trabalha por conta, no clube, no palco ou no negócio próprio; no esporte o colega é "negociado com outro clube", na banda "deixou o grupo".

## 3. CAR-11.8 e CAR-11.9

### CAR-11.8 — indicações (o problema persistia; corrigido)
`sistemas/indicacoes.ts` e `sistemas/oportunidades.ts`:
- `ocupacaoDeReferencia`: o último emprego (até 5 anos) conta como a carreira de quem está desempregado.
- `indicacaoPlausivel`: piso — não desce mais de um degrau nem paga menos da metade; quem tem diploma superior sem carreira só recebe o que conversa com a formação, a estrada ou nível ≥ 3. Sem nada plausível, só 1 em 10 vezes a de fora vem (como "mudança de carreira").
- Aposentados não indicam (o `ocupacaoId` é limpo ao aposentar e filtrado em saves antigos); colegas de trabalho têm a ocupação e entram na rede (proximidade ≥ 25).
- Quem está empregado pode ser lembrado para a vaga um degrau acima, ou receber **proposta de sociedade** de alguém da área (natureza `sociedade`, ocupação por conta própria da trilha).
- Memória: quem indicou não repete por 3 anos; frases por laço (pai/mãe, colega, amigo, por conta); proposta de concorrente com 5 textos.

Medição (`scripts/sim/auditoria125Indicacoes.ts`, 48 vidas, 25 anos), natural:

| | Antes | Depois |
|---|---|---|
| Rebaixa ≥ 2 níveis | 61% | 4,8% |
| Renda < 50% da referência | 75% | 9,5% |
| Textos distintos | 86% | 95% |
| "que trabalha como aposentado" | 14+ | 0 |
| Indicações vindas de colegas de trabalho | 0 | 8 de 21 |

A fatia "mesma trilha" subiu menos (0% → 24%): a rede da maioria das vidas ainda é a família de origem; agora, quando não há nada plausível, a indicação simplesmente não vem.

### CAR-11.9 — acontecimentos das carreiras
- Fila do ano (acima) e **49 cenas novas** (`sistemas/situacoes125.ts`): tênis 6, vôlei 4, atletismo 4, basquete 4, medicina 6, academia 5, música 6, negócio 6, polícia 4, escritório 4, obra/elétrica 4 (+4 variantes por conta própria).
- Cadência: o ofício com 10+ anos de casa não fica metade dos anos em silêncio (`chanceDeMomento`).

Medição (`scripts/sim/auditoria125Carreiras.ts`, 6 vidas × 25 anos; cenas por ano nos anos 0–5 / 10–20 e cenas distintas):

| Carreira | Antes | Depois |
|---|---|---|
| Futebol | 0,15 / 0,30 · 11 | 0,53 / 0,38 · 16 |
| Basquete | 0,15 / 0,23 · 7 | 0,60 / 0,43 · 12 |
| Vôlei | 0,15 / 0,18 · 6 | 0,50 / 0,45 · 9 |
| Atletismo | 0,23 / 0,23 · 6 | 0,57 / 0,31 · 10 |
| Tênis | 0,30 / 0,22 · 3 | 0,23 / 0,31 · 9 |
| Medicina | 0,43 / 0,35 · 4 | 0,42 / 0,30 · 10 |
| Academia | 0,38 / 0,38 · 5 | 0,47 / 0,38 · 8 |
| Música | 0,30 / 0,38 · 7 | 0,33 / 0,40 · 13 |
| Polícia | 0,28 / 0,28 · 6 | 0,29 / 0,42 · 10 |
| Analista adm. | 0,29 / 0,15 · 6 | 0,30 / 0,23 · 10 |

(A medição "depois" foi feita antes do ajuste de cadência do ofício veterano.)

## 4. Retrospectiva da Vida

- **Motor** `sistemas/albumDaVida.ts` (`memoriasDaVida`): lida a cada vez, nada novo é guardado — funciona após salvar/carregar e em saves antigos. Fontes: estruturas (nascimento, `educacao.concluidos`, `trabalho.historico`, aposentadoria, filhos e netos por `tNasc`, mortes dos pais, `palmares`, `politica.historico`, `mundo.migracoes`, `justica.antecedentes`) e a biografia (nunca podada) pelo `fato`, pelo `evento` ou, em saves antigos, pelo começo da frase e pelo tema. A estrutura e a frase sobre a mesma coisa viram uma memória só (com a frase da biografia). Frases repetidas 3+ vezes, o noticiário do mundo e as linhas técnicas ficam fora. Nunca se inventa: sem registro, a categoria fica vazia.
- **Registros novos**: só o campo `fato` (já existente e validado no save) nas entradas que só tinham texto — viagem, compra de veículo e de imóvel, mudança de cidade e de país, promoção, aposentadoria, fama, prêmio artístico, tatuagem, bicho. Nenhum campo novo no save, nenhum sorteio alterado.
- **Categorias**: Família, Relacionamentos, Educação, Carreira, Esportes, Patrimônio, Viagens, Conquistas, Momentos especiais. **Marcantes** (destaque 2): nascimento, casamento, filhos, títulos e prêmios, formatura superior, primeira casa, eleição, mudança de país, viuvez.
- **Tela** `ui/jogo/Retrospectiva.tsx` (sob demanda): História · Retrospectiva e no fim da vida ("Abrir o álbum da vida"). Momentos marcantes como fotos de álbum numa faixa que rola de lado; filtros por categoria com contagem (as vazias desligadas) e "Só os marcantes"; linha do tempo por fase (Infância → Maturidade) com atalhos; cada memória com idade e ano, categoria, título e frase; botão para abrir a pessoa.
- Testada em 14 vidas longas (46–78 anos: familiar, esportista, carreira comum, poucas conquistas, artista, política, crime) — `scripts/sim/retrospectiva125.ts`: 0 erros de ordem, de fonte (toda memória da biografia aponta para a entrada com o mesmo texto) ou de repetição; 1,4–5,4 ms por vida.

## 5. Arquivos

Novos: `motor/sistemas/albumDaVida.ts`, `motor/sistemas/situacoes125.ts`, `ui/jogo/Retrospectiva.tsx`, `ui/jogo/IconeDaMemoria.tsx`, `ui/retrospectiva.css`, `ui/ilustracao/fachadasDeLoja.ts`, testes `motor/__tests__/vida125.test.ts` e `ui/__tests__/vida125.test.tsx`, ferramentas `scripts/playtest/rework125.mjs`, `galeria125*.tsx`, `scripts/sim/auditoria125*.ts`, `retrospectiva125.ts`.

Alterados (principais): `criacao.ts`, `nucleo.ts`, `acoes.ts`, `conteudo/{motor,material,bens,mundo,acontecimentos12,adulto,maturidade,oficios}.ts`, `sistemas/{indicacoes,oportunidades,equipe,familia,filhos,mundoVivo,situacoes,militar,autoescola,coisas,personalizacao,obrigacoes,experiencias,processos,migracao,trabalho,notoriedade,arte,audiovisual,tatuagens,pets,esporte,retrospectiva}.ts`, `ui/{avatar/Figura,jogo/Tatuagens,jogo/Compras,jogo/Historia,telas/Jogo,telas/Fim,ilustracao/{lugares,nucleo,casas},novidades}`, `movimento.css`, `personalizar.css`, `vite.config.ts`.

## 6. Testes e resultados

- **Suíte completa** (`npx vitest run`, 132 arquivos, 2.206 testes): 2.196 passaram na rodada completa; das 10 falhas, 4 eram tempo esgotado sob carga (fix31 ×2, motor.test, fixPosPlaytestHumano, a copa de quadra em rework115Esportes) e passam rodando o arquivo sozinho; 6 eram reais e foram corrigidas (2 de fachada — a tabela de portas e a vitrine "moda"; 4 de deriva das vidas de teste — ver abaixo). Depois das correções: os 6 arquivos passam (147/147), os 4 de tempo passam sozinhos, e toda a interface passa de novo (55 arquivos, 455 testes).
- **Novos**: `motor/__tests__/vida125.test.ts` (fila do ano, B1, B2, B4, B6, M2, retrospectiva — ordem, fonte, filho sem duplicar, exportar/importar, save antigo sem `fato`/`evento`, noticiário fora —, integridade das 49 cenas) e `ui/__tests__/vida125.test.tsx` (lupa: níveis, corpo inteiro, frente/costas; foco de cada parte; retrospectiva: marcantes, filtros, categorias vazias desligadas, "só os marcantes", parte da História sob demanda).
- **Deriva das vidas de teste** (a festa de 15 anos prioritária e a criação mudam a sequência das vidas-base): `rework2fecho` (semente 322), `rework7` (primeira semente com a mãe viva), `rework97` (mediana de 12 sementes voltou a 25, como na 12.25: régua "até 25"), `fix2` (responde todas as decisões do ano), `rework1235` (40 sementes em vez de 20), `trajetorias` (vida sem acesso declarada).
- **Auditoria visual** (`scripts/playtest/rework125.mjs`, build de produção): 19 cenas × claro/escuro × 1440/390 (+360 e 390×560 nas marcadas) = 112 medições: 0 rolagem horizontal, 0 elemento estourando a borda, 0 texto sobre texto, 0 contraste baixo, 0 erro de console; botão de avançar sempre visível. Galerias: fachadas (59, grandes e miniatura), casas por padrão, NPCs (6 famílias, ao nascer e 40 anos depois), roupas (8 looks × 5 corpos/idades), lupa do estúdio.
- **Produção**: `scripts/itch/smoke.mjs` 21/21; `scripts/pwa/offline.mjs` 36/36. Pacotes: motor-textos 788,7 kB, motor 779,1 kB, Jogo 652,4 kB (limite 800 kB); a Retrospectiva num pacote próprio.
- **Simulações**: indicações (48 vidas × 25 anos), carreiras (12 × 6 vidas × 25 anos), retrospectiva (14 vidas longas, 0 erros, ≤ 5,6 ms por vida), negócio (20 vidas, versão original × atual).

## 7. Limitações restantes

- A rede de quem indica ainda é, na maioria das vidas, a família de origem: as indicações na mesma trilha passaram de 0% para 24%, não para os 60% do alvo da auditoria.
- Tênis: as cenas variam (3 → 9), mas a frequência continua baixa (~0,3 por ano) — o tênis não tem contrato nem patrocínio anual como "acontecimento" (proposta C4 em `car119.md`).
- Propostas da auditoria não feitas: contrato do atleta com duração por fase (C2), resumo anual só no ano notável (C3), acontecimentos de fase de carreira para qualquer trilha (C12).
- No celular, o cabeçalho das áreas (situação + "há pouco" + abas em 3 colunas) ocupa ~600 px antes do conteúdo; mexer exigiria mudar a navegação comum a todas as áreas.
- O catálogo não tem bolsa vestível; a marca não muda o desenho das peças (fora de escopo pelo pedido).
- Na sucessão, a biografia do antecessor fica em `linhagem` sem estrutura: a retrospectiva mostra só a vida atual.
- Memórias de saúde (diagnósticos) não entram: a biografia raramente nomeia a doença.
- **Negócio próprio (anterior à 12.5)**: na simulação, 13 de 20 lanchonetes fecham em 2 anos por falta de clientela (na versão original, 12 de 20). Com 20 vidas, os negócios longevos foram 5 (original) e 3 (atual), em vidas diferentes — deriva das vidas de teste, dentro do ruído; os custos das cenas novas de negócio foram reduzidos por precaução. A viabilidade do pequeno negócio merece o pacote de economia.

## 8. Compatibilidade com saves antigos

Save continua na versão 20; nenhum campo novo obrigatório. O `fato` das entradas novas é opcional e já validado. A retrospectiva lê qualquer save desde a v6 (biografia) e, nos anteriores, mostra o que houver. Aposentados de saves antigos que ainda têm `ocupacaoId` são filtrados na hora de indicar. Teste de exportar/importar em `vida125.test.ts`.

## 9. Vida Rural

Não foi iniciada nem modificada: nenhum sistema de agricultura, plantio, pecuária, administração ou economia rural foi tocado. (A trajetória `rural` já existente não recebeu cenas novas.)

## 10. Integração e publicação (2026-11-01)

- **Integração**: `claude/rework12.5-polimento-imersao` → `main` por avanço direto (fast-forward) `feb58c5..f1e29b2`, os 4 commits preservados (`c970ca9`, `2db4631`, `77a31d9`, `f1e29b2`); a `main` não tinha nada posterior à base. Enviadas ao GitHub: `main`, a branch da atualização e a de produção (`claude/fix-pos-rework3-playtest`, `dc94272..f1e29b2`), todas em `f1e29b2` no remoto.
- **Testes antes de publicar** (em `f1e29b2`): tipagem limpa; suíte completa **132 arquivos, 2.206/2.206** (nenhuma falha, nem os tempos esgotados conhecidos); build de produção (maior pacote 788,7 kB); smoke do pacote 21/21; PWA offline 36/36; auditoria visual 112 medições, 0 problemas; retrospectiva em 14 vidas longas, 0 erros.
- **Deploy**: Cloudflare Pages concluído com sucesso (`e1d12278-ca7f-47a7-9841-fd651bececd3`). https://vida-game.pages.dev/ responde 200 e serve `index-hSglLNjT.js`; o `index.html` e os 43 arquivos JS/CSS são idênticos (sha256) ao build local de `f1e29b2`.
- **Em produção**: auditoria visual contra a URL pública (112 medições, 0 problemas; numa delas a captura pegou o "Carregando…" da Retrospectiva sob demanda) e `scripts/playtest/producao125.mjs` **24/24**: notas da 12.5 para quem vinha da 12.4.2; três saves antigos (12.4.x) abrem; a Retrospectiva lista 61, 14 e 9 memórias em ordem, sem repetição, e filtra; a lupa do estúdio aproxima e volta ao corpo inteiro (390 px, sem rolagem lateral); Compras mostra as fachadas por segmento, as grandes lojas e os galpões das lojas pela internet; nenhum erro de console.
