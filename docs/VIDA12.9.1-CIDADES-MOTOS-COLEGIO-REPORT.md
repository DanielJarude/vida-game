# VIDA 12.9.1 — Colégio Eleitoral dos EUA, cidades dos campi no mapa, motos clássicas

## A. Identificação
- **Versão:** 12.9.1 (correções e expansões pós-12.9). Notas do jogo: `12.9.1`.
- **Base:** `origin/main` = `90dedd3` (12.9 publicada em `6618f2a`; nada depois).
- **Branch:** `claude/vida12.9.1-cidades-motos-eua`. Relatórios das frentes em `docs/vida1291/` (Cidades.md, Motos.md).

## B. As quatro decisões
1. **Tatuagens de cultura pop — mantidas como estão.** Nenhuma alteração (não houve problema técnico ou visual identificado para corrigir).
2. **Cidades dos campi** — feito (ver C2).
3. **Motos clássicas** — feito (ver C3).
4. **Eleição presidencial dos EUA** — corrigida, com prioridade (ver C1).

## C. O que mudou

### C1. Colégio Eleitoral (EUA)
- **Auditoria:** a 12.9 decidia a eleição americana por pluralidade do voto popular nacional (`presidencia129.apurar`, regra `US` sem segundo turno); não havia estados, delegados, Maine/Nebraska nem contingência; o painel dizia "Vence quem tiver mais votos".
- **Agora:** `dados/colegioEleitoral129.ts` (51 unidades com os delegados da distribuição do Censo de 2020 — 538, 270 para vencer; distritos de ME e NE; a inclinação de cada estado e distrito pela margem de 2024) e `sistemas/colegioEleitoral129.ts` (`contarDelegados`, `quemFezMaioria`, `eleicaoNaCamara`, `apurarColegio`). O voto popular da urna (o mesmo de antes) é puxado em cada estado pela inclinação do lugar conforme o lado do partido de cada candidato (espectro: esquerda +, direita −, centro 0), com incerteza própria; vencedor leva tudo; ME e NE: 2 pelo estado + 1 por distrito; sem maioria, a Câmara entre os três primeiros, uma delegação por estado (26 de 50; a delegação vota com o eleitorado do estado — aproximação; sem maioria, votações repetidas: fica quem tem mais delegações).
- **Disputa de dois grandes lados:** o adversário forte é do lado oposto ao do candidato; quem é de centro/independente enfrenta um grande de cada lado.
- **Narrativa e registro:** a apuração mostra o voto popular E o Colégio ("…Colégio Eleitoral: você 291 · X 247 (270 de 538 para vencer)"), diz quando o popular e o Colégio divergem e quando a Câmara decide; a candidatura guarda delegados, estados ganhos, voto popular, quem venceu e a votação da Câmara; o histórico político, a posse, a reeleição, a retrospectiva e as marcas seguem o resultado do Colégio; o painel explica a regra. A chance da campanha também é estimada pelo Colégio.
- **Outros países:** inalterados (teste).
- **Sim** (`scripts/sim/colegio1291.ts`, 4.000 eleições com margem nacional ~N(0, 4)): popular × Colégio divergem em 13,5% (a esquerda ganha no país e perde no Colégio em 9,7% — a geografia de 2024); vai à Câmara 0,33%.

### C2. Cidades dos campi
20 cidades ausentes adicionadas (`dados/municipios1291.ts`, no pacote `motor-casa`): São Carlos, Pirassununga, Lorena, Limeira, Botucatu, Araraquara, Franca, Barueri (SP); Macaé (RJ); Betim, Poços de Caldas (MG); Tramandaí (RS); Araranguá, Curitibanos (SC); Toledo, Palotina, Jandaia do Sul (PR); Vitória de Santo Antão (PE); Camaçari (BA); Russas (CE). Bauru, Piracicaba, Sorocaba, Londrina, Contagem, Montes Claros, Vitória da Conquista, Sobral e Quixadá já existiam; UnB Ceilândia aponta para Brasília (região administrativa do DF, não município). Integração pelo sistema geográfico existente (perfil, região, custo de vida, oferta de ensino, vagas, imóveis, escolas técnicas, mudança e nascimento escolhidos). Os 62 campi são oferecidos. **Decisão:** os sorteios do mundo (nascimento, parentes, clubes, turismo) continuam com as 117 cidades de sempre — nenhuma semente mudou; as novas são alcançadas por escolha (nascer, mudar, estudar). População do Censo 2022 anotada só para justificar o perfil (o motor não modela população), escrita de memória e conferida com o conhecimento do Censo, sem consulta online.

### C3. Motos clássicas
28 modelos reais na classe nova `moto_classica` (herda o tratamento do carro clássico: não deprecia pela idade, segue o índice de clássicos e o estado, vendida usada pelo colecionador, restauração, "um colecionador bate à porta"): Triumph Bonneville T120, BSA Gold Star, Norton Commando, Vincent Black Shadow, Brough Superior SS100, Ducati 750 SS e Scrambler 450, Moto Guzzi V7 Sport, BMW R 60/2 e R 90 S, Honda CB750/CB400F/CL350/RC30, Kawasaki Z1/H2, Suzuki GT750, Yamaha XS650/RD350, Honda CG 125 1976 e Yamaha RD 350 LC (Brasil), Harley-Davidson Knucklehead/Panhead/Super Glide/XR750/XR1000, Indian Chief e Scout 101. Raridade pela produção conhecida (750 SS 401 → muito rara; Vincent ~1.700; CB750 ~400 mil → incomum pelo marco histórico, nunca acima disso sem número); grupo "Motos de coleção"; filete no tanque, bancos de couro e rodas raiadas de aro dourado no desenho, montado por peças (motor, guidão, tanque, banco, escape, garfo, para-lamas, quadro rígido ou com amortecedores, cardã, carenagem). Correção: o milhar no fundamento da raridade ("10.594", não "10,594").

## D. Testes
- **Novos:** `vida1291Eleicao` (16: os 8 casos obrigatórios — A popular/B Colégio; A ambos; B popular e A 270×268; soma por estado; Maine e Nebraska; 270 de maioria; contingência na Câmara com 26 de 50 e votação repetida; o vencedor registrado = o do Colégio numa vida política inteira — mais dados oficiais, dois lados, leitura e outros países), `vida1291Cidades` (9), `vida1291Motos` (10).
- **Suíte completa:** 2484/2489 + 1 skipped. Falhas: `rework11Esportes · Sassuolo` e `rework122 · negócio por fora` (as mesmas da base), `motor.test · agência` (tempo: 64 s sob carga; sozinho passa) e `rework106 · K8` (as notas sem "Melhorias" — corrigido; o arquivo passa: 11/11).
- **Typecheck** limpo; **smoke** 22/22; **PWA offline** 36/36.
- **Auditoria visual** (`scripts/playtest/vida129.mjs`, 19 cenas incluindo a garagem e a coleção de motos clássicas, claro e escuro, 1440/390/360/390×560): 0 problemas.

## E. Pacotes
motor-dados 779,5 · motor-textos 775,6 · motor-carreira 730,2 · motor 724,1 kB (nenhum perto do limite de 800; sem ciclos). O desenho das motos clássicas fica no pacote de Compras (sob demanda).

## F. Limitações
- O Colégio usa a distribuição do Censo de 2020 também a partir de 2032 (a de 2030 não existe); a delegação na Câmara vota com o eleitorado do estado (as bancadas não são simuladas); os partidos dos EUA no jogo são genéricos por espectro.
- Cidades novas não entram nos sorteios (nascimento, parentes, clubes); nas listas, aparecem depois das antigas do mesmo estado.
- Motos: muitos modelos sem número de produção ficam "incomum"; clássica só no colecionador (cidades grandes); a XR750 (de pista) é usável como qualquer moto.

## G. Publicação
- **Commit publicado:** `10668b3`. `main`, `claude/fix-pos-rework3-playtest` (produção) e a branch avançados por fast-forward (`90dedd3`/`6618f2a` → `10668b3`). Este registro é um commit de documentação posterior, só em `main` e na branch.
- **URL:** https://vida-game.pages.dev/ serve `index-D_hTpSFy.js`; **60/60** arquivos (o índice pela raiz e todos os JS e CSS) **SHA-256 idênticos** ao `dist/` testado.
- **Verificação em produção:** `URL=https://vida-game.pages.dev/ node scripts/playtest/vida129.mjs` — garagem e coleção de motos, faculdade, presidência, novidades: 0 problemas, 0 erros de console.
- **Rollback:** `git push origin 6618f2a:claude/fix-pos-rework3-playtest --force-with-lease` (e `main` para `90dedd3`).
