# Frente Presidência — VIDA 12.9

## O que mudou
**Novo**
- `src/motor/dados/presidencia129.ts` (motor-casa, puro): `REGRAS_PRESIDENCIAIS` para 12 países com eleição direta que cai nas gerais do jogo (BR, US, MX, AR, CL, UY, CO, PE, NG, KE, CR, DO): título, mandato, idade, ciclo, nato, candidatura independente, segundo turno e limiar (AR 45/40+10; CR e NG 40), limite de mandatos (`seguidos`/`total`/`intervalo`), palácio, Congresso e casas, rito do impeachment (quórum de acusação/condenação, inabilitação BR 8 anos), quóruns (emenda/lei; EUA lei 60 = filibuster), desemprego-base. `SEM_PRESIDENCIA` (textos dos que não têm). `ciclosDoCargo129`/`caiNoCiclo` (calendário por cargo), `CRISES_GOVERNADOR`, `CRISES_PRESIDENTE`, eixos, reformas, políticas econômicas, perfis de adversário, tipos do estado salvo.
- `src/motor/sistemas/presidencia129.ts` (chunk novo **motor-presidencia**, regra própria em vite.config): registra ganchos em `politica.PRESIDENCIA` ao carregar. Elegibilidade (`elegivel`, `forca`, `natoDoPais`), corrida (`registrar`, `gerarAdversarios`, `pesquisa`, `forcaPresidencial`, `chancePresidencial` Monte Carlo derivado, `apurar` com 1º/2º turno), posse (`posse`: governo com inflação/PIB/desemprego/base/mundo/conflito), ano (`anoDoGoverno`: economia, aprovação pela economia, base, tramitação de reforma casa a casa com quórum, impeachment, acontecimentos históricos), `julgarImpeachment`, `afastarDoCargo`, fim/legado (`arquivar`, `fim`), ações do presidente e do governador (`acoes`/`disp`/`exec`), `leituraPresidencial`, `normalizarVida129Presidencia`.
- `src/motor/conteudo/acontecimentos129Presidencia.ts` (motor-acontecimentos): `presc_campanha` (indicação por convenção/primárias com rival nomeado → chapa com vice nomeado → eixo → estratégia → debate com 4 escolhas e consequência → reta final com 5 acontecimentos e 2–3 respostas cada → fim), `prest_segundo_turno` (urgente; 4 estratégias; resolve a apuração), `presg_eixos/reforma/base/economia/mundo`, `presg_crise` (9 crises nacionais × 3 respostas), `govg_crise` (6 crises estaduais × 3), `presi_impeachment` (casa a casa, negociar/rua/tribunal/renunciar), `presd_depois` (partido/memórias/fundação/encerrar), `presx_independente` (assinaturas).
- UI: `src/ui/jogo/Presidencia129.tsx` (lazy, `sobDemanda`) + `src/ui/presidencia129.css` (só tokens, raiz `.pres129`, 390 px): regras do país e checklist do que falta; corrida (etapas, pesquisa com cada adversário/partido/perfil, chance em palavras); governo (indicadores com variação desde a posse, barras de base/mundo/tensão, eixos, política do ano, reforma, aprovação ano a ano, conquistas, impeachment); história (legado e candidaturas). Montado no `PainelPolitico` (Trabalho.tsx).

**Ganchos pequenos em arquivos existentes**
- `tipos.ts`: `CargoEletivo` + `'presidente'`; `VidaPolitica.presidencia?` (opcional). `mundo/tipos.ts`: `NivelPolitico` + `'presidente'`.
- `politica.ts`: interface/objeto `PRESIDENCIA`; `CARGOS`/`ORDEM_CARGOS` com presidente (escopo `'pais'`); `politicaDo` mescla o cargo presidencial (WeakMap); `cargoNoCiclo`; `podeConcorrer` (ciclo do cargo, gancho de elegibilidade, domicílio nacional, força); `cargosDaEleicao` filtra pelo ciclo; custo/dificuldade do cargo; `registrarCandidatura`/`apurar` (exportada)/`tomarPosse` (mudança para a capital do país)/`concluirMandato`/`renunciar`/fim de `processarPolitica`/`horizonteDoMandato` chamam os ganchos; pool de crises por cargo; ações `governo129`; `crise` abre a cena certa; presidente sem `pol_prioridade`/`pol_comunidade`/bandeira municipal.
- `mandato.ts` (`presidente: []`), `notoriedade.ts` (escopo 1), `ocupacoes.ts` (ocupação presidente), `conteudo/politica.ts` (pol_crise ignora crises gov_/pres_; opção presidente some fora do ciclo e abre `presc_campanha`), `catalogo.ts`, `save.ts` (normalizador), `vite.config.ts` (regex `acontecimentos[a-zA-Z0-9]*` — antes o nome com maiúscula caía em motor-textos; chunk motor-presidencia; presidencia129 em motor-casa), `Trabalho.tsx`.

## Bugs (causa raiz)
- **Senado dos EUA** (bug latente): o Senado era disputável em toda eleição geral (anos pares) porque o cargo só seguia o ciclo do país. Corrigido pelo mesmo mecanismo da Presidência (`ciclosDoCargo129`): cada estado do jogo vota só nas classes das suas cadeiras (NY 1+3, TX 1+2, ...; 2 de cada 3 gerais). Também: **DC** tinha Senado e governador eleitos — agora não.
- **Governador com crises de prefeito**: o sorteio usava o mesmo pool do executivo municipal ("gente dormindo na escola"). Agora `CRISES_GOVERNADOR` (segurança, rodovia, hospital regional, repasse, chuva no interior, presídio + greve/aliado genéricos) com cena própria `govg_crise`; prefeito inalterado. + 3 ações estaduais (plano de segurança, interior: rodovias e hospitais, repasses federais).
- Regex do chunk motor-acontecimentos não aceitava maiúscula no nome do arquivo.

## Mecânicas
Presidente ≠ "prefeito com outro texto": verbos próprios (≤3/ano), economia nacional como estado (fase do mundo + reformas + política do ano + relações), aprovação puxada pela economia, base no Congresso, tramitação com quórum (BR PEC 60%), impeachment por quórum do país, eventos históricos sem escolha, legado comparando entrada/saída. Reeleição: BR 1 seguida (2ª ok, 3ª ilegal), EUA 2 na vida, MX/CO 1, CL/UY/PE sem imediata, CR 8 anos, DO 2. Posse muda para a capital do país.

## Campos de save
`VidaPolitica.presidencia?` (campanha, candidaturas, governo, mandatos). Save segue v20. `normalizarVida129Presidencia` descarta estado quebrado sem tocar no mandato. Testado: save antigo sem o campo carrega; roundtrip mantém o governo.

## Testes (resultados reais)
- `src/motor/__tests__/vida129Presidencia.test.ts`: **29/29** (elegibilidade BR/US/naturalizado/sem partido/sem nome; ciclos BR/US/Senado por classe/DC; parlamentaristas; candidatura com adversários; campanha completa; debate; convenção perdida; vitória/derrota/2º turno BR, sem 2º turno US; posse/capital/governo; ações; política econômica e reforma aprovada/derrotada; aprovação×economia; crises exclusivas pres/gov/prefeito; impeachment; fim e legado; reeleição BR/US/MX/CL; histórico; saves; força/chance).
- `src/ui/__tests__/vida129Presidencia.test.tsx`: **3/3**.
- `calendarioPolitico`, `rework11Politica`: passam. Lote político amplo (12 arquivos): 294/302; as 8 falhas são de outras frentes/áreas (fix4 resgate de dinheiro, rework105 EDU/briga, pacotePlaytest esportes/romance, motor.test com texto "Helena soube da sua fase…" de outra frente; o teste de porta da política passou ao rodar isolado). tsc: erros só em testes de outras frentes (Economia, Estudos).

## Sim (`a129/sim-presidencia.ts`, N=400 vidas, fluxo real com escolhas ao acaso)
- Trajetória forte (ex-governador/senador, nome 78–98): **48%** eleitos (37 foram ao 2º turno); média (dep. federal/prefeito/senador): **3%**; fraca: **0%**. Total 17%. Por país: BR 14%, US 22%, AR 16%, MX 26%, CL 16%, CO 16%. 1º turno médio do forte: 38,8%.
- 69 mandatos: aprovação no fim média 41,6% (20–63), reformas 13 aprovadas / 36 derrotadas (sem articular a base), 63 crises, 1 processo de afastamento, 0 afastados.

## Pacotes (build próprio dist-presidencia, com as outras frentes em andamento)
motor 799,73 kB (!) · motor-dados 797,98 · motor-textos 794,14 · motor-carreira 747,71 · Jogo 618,56 · motor-acontecimentos 310,39 · motor-casa 174,56 · **motor-presidencia 30,96 (novo)** · Presidencia129 (UI) 6,28 + 4,42 css. Minha parte no motor: ~+4,5 kB de fonte em politica.ts (com comentários; ~2–3 kB minificado). O motor está a 0,27 kB do limite somando todas as frentes — o integrador deve conferir.

## Limitações honestas
- Portugal, França e Coreia do Sul elegem presidente, mas em ano fora das gerais do jogo: não oferecido (documentado em `SEM_PRESIDENCIA`). Parlamentaristas/monarquias, Angola e África do Sul: sem Presidência.
- EUA: colégio eleitoral simplificado para voto popular por pluralidade; primárias numa decisão. NG/KE: regra de distribuição territorial reduzida ao limiar. Mês da eleição = o mês geral do país (Colômbia vota em maio na vida real).
- A economia do mandato é estado do governo; não altera a `Economia` global do jogo (investimentos seguem a semente do mundo).
- Governadores dos EUA seguem o ciclo geral (KY/NJ em anos ímpares não modelados); só DC foi bloqueado.
- Candidatura independente só por ação própria (presx_independente); `pol_eleicao` continua exigindo partido.
- Natural x naturalizado: heurística (país natal ou 1ª nacionalidade sem marca "Naturalizou-se").
- Prefeito: inalterado (pool municipal), como pedido.
