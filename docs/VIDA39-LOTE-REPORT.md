# VIDA 39 · relatório do lote (versão 39)

Notas: `src/ui/novidades.ts` (versão 39). Versão de referência: `src/ui/novidadesVersao.ts`.
Base: `origin/main` em f832b5f (VIDA 38).

## O que entrou

### 1. Preconceito do dia a dia, por país
Sistema novo: `src/motor/sistemas/preconceito39.ts` (lógica), `src/motor/dados39/preconceito.ts` (episódios).

- **Por país:** cada episódio vale só no país onde a vida acontece (`moradia.municipioId` → `municipio.pais`). Países com episódios: Brasil, Itália, França, Estados Unidos, Alemanha e Reino Unido.
- **Marcadores** (lidos do que o jogo já sabe de quem vive a vida):
  - `nordestino`: cidade natal no Nordeste do Brasil (`municipio.regiao`);
  - `sulista`: cidade natal no Mezzogiorno italiano (códigos Istat 65, 67, 72, 75, 77, 78, 82, 88);
  - `negro`: ascendência africana predominante (`identidade.ancestralidadeDe`, parcela `af` ≥ 0,4). **Simplificação:** é a leitura de ascendência do próprio jogo, não uma categoria de raça/cor autodeclarada.
  - `mulher`: gênero feminino;
  - `classe_baixa`: classe de origem `vulneravel` ou `trabalhadora`;
  - `estrangeiro`: primeira nacionalidade diferente do país onde vive.
- **Sorteio:** no máximo um episódio por ano. Chance de 20% com um marcador, sobe 5 pontos por marcador extra (teto de 45%). Semente própria por vida e ano (`rngDe(id, 'preconceito39', t)`): não consome o acaso principal.
- **Efeito:** estresse sobe `2 + 2×intensidade`; felicidade cai `2×intensidade` (intensidades 1 a 3).
- **Apoio:** quando o episódio tem frase de apoio e há alguém próximo (proximidade ≥ 50), 50% de chance de a pessoa ouvir e apoiar: confiança +2 e uma lembrança no vínculo.
- **Memória:** o primeiro episódio de cada marcador vai para a biografia; os seguintes, para o cotidiano. Contagem por marcador em `v.fatos['preconceito39_<marcador>']`.
- **Idade:** só a partir de 12 anos.
- **Ligação:** o motor chama `rodarGanchosDoAno39` depois de `processarOportunidades` (`ano.ts`). O sistema se registra por `ganchosDoAno39.ts` e é carregado pela interface junto com `extrasCarregar38` (`src/ui/motor.ts`, `src/motor/sistemas/extrasCarregar39.ts`). Sem o pacote carregado, o sistema não roda.
- **Pacote:** a regra de chunk do Vite manda `preconceito39` e `dados39/preconceito` para `motor-extras`, mas o build colocou o código no chunk `motor-dados` (ver Engenharia).

### 2. Respostas que mostram o que foi dito e o efeito
- **Falas e tons** (`src/ui/v15/celular/falasDaResposta39.ts`): cada código de resposta tem fala em primeira pessoa e um tom (Carinho, Com humor, Com firmeza, Com cautela, Aberto). Antes, respostas v17 sem tradução apareciam como "Respondido.".
- **Ordem de precedência na fala:** falas antigas (`opcaoRotulo`), depois a fala do motor (`resposta.fala`), depois as falas novas, e por último "Respondi do meu jeito.".
- **Caixa de entrada:** mostra "Você: <o que foi respondido>" em vez de "respondido".
- **Efeito na relação:** `responderMsg15` (agora um envelope em volta de `responderMsg15Base`) guarda em `resposta.efeito` o quanto a proximidade, a tensão e a confiança mudaram. A tela mostra etiquetas: "Mais perto", "Mais distante", "Mais confiança", "Menos confiança", "Tensão subiu", "Tensão diminuiu" — só quando a mudança passa de um limiar.

## Engenharia
- Motor: `ganchosDoAno39.ts` (registro), `ano.ts` (uma chamada). Mudança mínima no motor base.
- `resposta.efeito` é campo opcional: saves antigos continuam válidos (save continua v20; sem normalizador novo).
- Chunks do build (`npm run build`): `motor` 797.835 bytes (limite 800 kB, sem alteração de tamanho em relação à VIDA 38); `motor-dados` 694 kB; `motor-textos` 795 kB (já era o caso).
- O código do preconceito foi para `motor-dados`, não para `motor-extras` (6 kB). A regra do Vite funciona por ordem; o registro e o carregamento pela interface funcionam do mesmo jeito. Ficou para a próxima att ajustar a regra se o chunk crescer.
- Os 9 avisos de "Circular chunk" já existiam antes desta versão (VIDA 38 os registra).

## Testes
- Novos: `src/motor/__tests__/vida39Preconceito.test.ts` (8 testes: episódios válidos e cobrindo os países, marcadores, um episódio por ano, efeito de estresse e felicidade, menores de 12 anos, determinismo sem consumir o acaso principal, gancho do ano).
- Novos: `src/ui/__tests__/vida39Respostas.test.ts` (falas e tons para todos os códigos; etiquetas de efeito).
- Afetados e passando: `vida15Celular`, `vida16Telas`, `vida30Novidades` (versão 39), e os demais testes do celular listados em conversa.
- Typecheck (`tsc --noEmit`): limpo.
- **Suíte completa:** 13 lotes, todos executados.
  - Lotes com todos os testes passando: 02 a 06, 10 a 12.
  - Lotes 07, 08 e 09: todos os testes passaram; o processo saiu com código 1 por `EnvironmentTeardownError` (imports preguiçosos de CSS e componentes que o jsdom tenta carregar depois que o teste termina). Erro de ambiente, não de teste.
  - Lotes 00 e 01: 3 testes falharam. Os três também falham em `origin/main` sem esta mudança (rodados isolados na mesma máquina): "com clima péssimo, cortes acontecem mais", "nenhum acontecimento usa linguagem de escolha do personagem", "a mesma discussão, pessoas diferentes" (`fechamentoMundo`) e "treinar dobrado machuca mais" (`profissao`). Causa observada: tempo de execução acima do limite do próprio teste, sob carga. **Não são regressões desta versão**, mas ficam como pendência de teste nesta máquina.

## Build e publicação
- `npm run build:itch` ok (index.html na raiz do ZIP).
- `npm run smoke:itch`: 37 de 37 verificações passaram.

## O que não foi feito (backlog da próxima att)
Ver `docs/BACKLOG-PROXIMA-ATT.md`, seção "Status verificado". Em resumo:
- **Consequências visíveis antes de decidir** fora do celular (pendência da VIDA 38). Cada decisão tem o seu resolvedor com efeitos próprios, sem um lugar único para mostrar a prévia.
- **Vida 33+:** a maior parte já existe (VIDA 26 e 30). Não foi estendida nesta versão.
- **Saúde mental:** terapia e desgaste existem (VIDA 38); um eixo próprio de transtornos não foi criado.
- **Saúde reprodutiva:** o aborto legal por país existe (VIDA 15); não foi aprofundado.
- **Eventos externos de grande escala:** pandemia e enchente já aparecem no jogo; não foi criado um novo sistema.
- **Dimensão racial:** foi incluída só como leitura de ascendência (`negro`), sem categoria autodeclarada. Qualquer mudança nesse marcador precisa de revisão de conteúdo.
