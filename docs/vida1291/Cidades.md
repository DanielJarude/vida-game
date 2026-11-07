# VIDA 12.9.1 · Frente "Cidades dos campi"

## Auditoria
- Sistema geográfico do jogo: `src/motor/dados/lugares.ts` (`LINHAS` → `MUNICIPIOS`, 117 cidades BR; id `slug(nome)-uf`).
  Cada cidade só tem nome, UF, região, **perfil** (metropole/metropolitana/capital/polo/pequena), capital?, metrópole?.
  Não há população, coordenadas nem distâncias: custo de vida, salário, aluguel, transporte (`economiaLocal`) e oferta de
  ensino (`nivelDeOferta`) saem do perfil × região. Os outros países vêm de `mundo/paises/*` (não mexi).
- 21 instituições, **62 campi**. Antes: 42 campi em cidades do mapa, **21 campi em 20 cidades fora do mapa**
  (`estudos129.campiNoJogo129` filtra por `existeMunicipio`, e `ondeHa129`/`opcoes129` só ofereciam esses):
  USP São Carlos, Pirassununga, Lorena · Unicamp Limeira · Unesp Botucatu, Araraquara, Franca · UFRJ Macaé ·
  UFRGS Litoral Norte (Tramandaí) · UFSC Araranguá, Curitibanos · UFPR Toledo, Palotina, Jandaia do Sul · PUCPR Toledo ·
  UFPE Vitória de Santo Antão · UFBA Camaçari · UFC Russas · PUC Minas Betim, Poços de Caldas · Mackenzie Alphaville (Barueri).
- Já no mapa (a lista do pedido estava parcialmente errada): Bauru, Piracicaba, Sorocaba, Londrina, Contagem, Montes Claros,
  Vitória da Conquista, Sobral, Quixadá, Caruaru, Blumenau, Campinas, Ribeirão Preto.
- DF: UnB Ceilândia já apontava para `brasilia-df` (o jogo trata o DF inteiro como Brasília). Gama: o campus não está no
  catálogo (sem curso verificado, decisão da 12.9). Nenhum município inventado.

## O que mudou
- `src/motor/dados/municipios1291.ts` (NOVO, catálogo puro, chunk `motor-casa`): as 20 cidades
  `[nome oficial, UF, perfil, metrópole, população Censo 2022 em mil]`. Perfil pelo critério da lista de sempre:
  colada numa metrópole → metropolitana (Barueri→SP, Betim→BH, Camaçari→Salvador); polo regional ≥ ~130 mil → polo
  (São Carlos 255, Limeira 292, Botucatu 145, Araraquara 242, Franca 353, Macaé 246, Poços de Caldas 164, Toledo 150,
  Vitória de Santo Antão 134); o resto → pequena (Pirassununga 74, Lorena 85, Tramandaí 54, Araranguá 72, Curitibanos 40,
  Palotina 34, Jandaia do Sul 21, Russas 80). População: IBGE Censo 2022, arredondada ao milhar, **de memória (sem consulta
  online nesta sessão)** — só documenta e justifica o perfil; o motor não a lê.
- `src/motor/dados/lugares.ts`: `doBrasil` (a função de linha, fatorada); `BR_NO_MAPA = [...MUNICIPIOS, ...novas]` alimenta
  `POR_ID` (logo `existeMunicipio`, `municipio`, `nomeLugar`, `economiaLocal`, `nivelDeOferta`, `pertoDaAgua`...),
  `municipioPorNome`, `codigoDoMunicipio`/`municipioDoCodigo` (novas recebem 117..136; as antigas mantêm o código).
  Nova `cidadesNoMapa(pais)` = BR_NO_MAPA no Brasil, `cidadesDoPais` fora. `MUNICIPIOS` e `cidadesDoPais('BR')` continuam
  as 117 de sempre.
- `src/ui/jogo/Cidade.tsx` (Mudar de cidade) e `src/ui/jogo/Mundo.tsx` (nascer escolhendo a cidade; "Qual cidade?" da
  mudança de país) listam `cidadesNoMapa`.
- `vite.config.ts`: `municipios1291` na regex do `motor-casa` (Edit pontual).
- Os campi passam a ser oferecidos sem tocar em `estudos129` (o filtro `existeMunicipio` agora aceita as cidades).

## Decisão sobre sorteios / RNG
Todos os sorteios do mundo usam `cidadesDoPais` (nascimento `sortearMunicipio` com peso por perfil, naturalidade de NPCs em
`conhecimento`, destinos de parentes em `filhos/social/mundoVivo`, clubes/ligas em `esporte/ligas/competicoes`, turismo em
`experiencias`, estrada em `usos`, guarnições em `forcas`). Como `cidadesDoPais('BR')` não mudou, **nenhum sorteio muda**:
mesmas sementes → mesmas vidas (verificado: testes de mundo/motor/estudos sem drift). Consequência: ninguém NASCE nem é
sorteado para as cidades novas; elas existem para quem escolhe (nascer escolhendo, mudar, campus). Documentado no catálogo.

## Efeitos verificados em outros sistemas
- Mudar de cidade (`mudar_cidade`, custo `custoDeMudanca`) → ok; vagas (`vagasDisponiveis`) e imóveis (`ofertasDeImoveis`)
  existem; escolas técnicas (`ensinoTecnico.instituicoesTecnicas`, por perfil: polo 2, pequena 1, metropolitana 3) em todas as 20.
- Nome da instituição: universidades que antes tinham 1 campus no mapa (UFRJ, UFRGS, UFPR) agora têm >1 e o nome gerado
  ganha ", campus X" (`nomeDaInstituicao129`). Só afeta matrículas novas; a matrícula guarda o nome dela.
- Saves: nenhum campo novo, nenhum normalizador. Saves antigos não têm as cidades novas; todas as fixtures abrem.
- Legado (import v1 por nome): `municipioPorNome('São Carlos','SP')` agora acha a cidade real em vez de cair na capital.

## Testes (resultados reais)
- `src/motor/__tests__/vida1291Cidades.test.ts`: 9/9 — todo campus no mapa (62/62); 20 novas sem duplicata (nome+UF e id),
  economia/oferta coerentes, código estável; Toledo (UFPR+PUCPR) → mesma localidade; Ceilândia → brasilia-df; sortear
  nascimento (300 sementes) nunca dá cidade nova e `cidadesDoPais('BR')` = lista de sempre; USP São Carlos (Fuvest,
  Computação) oferecida com aviso de mudança e candidatura feita; Unicamp Limeira, UFRJ Macaé, UFPR Toledo, Mackenzie
  Alphaville oferecidos; mudar para São Carlos + 3 anos + reabrir save; nascer em Russas + 3 anos; todas as fixtures abrem.
- Existentes: mundo, vida129Estudos, tecnico, motor, save, fechamentoMundo, mundoConteudo → 112/112; att3, fix3, rework3,
  fixPosPlaytestHumano → 171/171; UI fechamentoMundo, vida129Estudos, navegacao → 19/19. `tsc --noEmit` limpo.

## Pacotes (build em a129/dist-cidades, com o trabalho das outras frentes junto)
motor-dados 798.2 kB, motor-textos 794.2, motor-carreira 747.8, motor 741.5, Jogo 618.7, motor-casa 187.7 — todos < 800.
Minha parte em motor-dados é ~0,3 kB (as linhas das cidades ficaram no motor-casa). motor-dados está a 1,8 kB do limite
por causa do conjunto das frentes: atenção do integrador.

## Limitações
- População de memória (Censo 2022 arredondado), não conferida online.
- As cidades novas não entram em nenhum sorteio (nascer, NPCs, clubes, destinos): escolha deliberada para não mudar sementes.
- Ordem nas listas da UI: as novas aparecem depois das cidades de sempre da mesma UF (não alfabética).
- `docs/vida129/frentes/Estudos.md` ainda descreve a exclusão da 12.9 (documento histórico; não editei).
