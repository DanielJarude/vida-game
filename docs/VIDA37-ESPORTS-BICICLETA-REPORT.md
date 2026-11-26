# VIDA 37 · e-sports de verdade e a bicicleta uma vez só

Versão das notas: **37**. Branch `claude/vida37-esports-dono` (a partir de `origin/main` c11a5e9 = VIDA 36 publicada).

## Pedido do jogador (o que foi relatado)

1. Comprar a line de R6 da Liquid tornava o jogador dono do time real, que então se inscrevia no Major.
2. Inscrever-se no Major pagando não existe: o campeonato se alcança pela colocação.
3. Em e-sports só um campeonato realmente conta. Os troféus eram todos o mesmo desenho por jogo.
4. Está fácil ter um time superforte e ser sempre campeão.
5. A história da bicicleta (rodinhas) aconteceu duas vezes na infância.
6. "Faltam nomes reais de pessoas e empresas" — ver *Pendências*.

## O que mudou

### Organizações reais não se compram (`src/motor/v31/esports/org31.ts`, `orgsAVenda31`)
- O mercado de organizações à venda só lista as **fictícias**. As reais (Liquid, T1, FURIA...) continuam na liga como rivais e não podem mais virar a sua organização.
- O teste de venda passou a afirmar que nenhuma real aparece.

### Major não se compra; convite é de quem tem nome (`org35.ts`, `org31.ts`)
- `TORNEIOS35` perdeu o `major` (inscrição de 400 mil). Quem entra no Major é quem chega pela colocação na liga (vagas de `circuitos33`).
- `convite` (torneio de convidados) exige reputação ≥ 50 (`REPUTACAO_DO_CONVITE37`). A inscrição de 60 mil passa a ser só a viagem.

### Só o campeonato principal dá troféu (`org31.ts`, `Galeria.tsx`)
- `principalDoAno37(jogo, ano)`: o evento internacional de maior peso do ano (Six Invitational em 2019 no R6, Mundial do RLCS em 2024, Major no CS).
- Organização: troféu **só** para o título do principal. Título de liga e torneios de convidados/copas não geram mais troféu (ficam no histórico).
- E-sports do jogador (`esports25`): a galeria só mostra competições do tipo `mundial`.

### Cada título mundial tem a sua taça (`Galeria.tsx`)
- Valorant → `torre` (nova), Fortnite → `coroa` (nova), Rocket League → `taca_asas` (nova). LoL (`cristal`), CS (`escudo_tatico`) e R6 (`hexagono`) mantêm o desenho.
- Os desenhos antigos `agulha`, `caixa` e `carro`, que eram ícones e não taças, deixaram de ser usados para e-sports; seguem no código para outras telas.

### Teto na vantagem sobre o campo (`org31.ts`, `forcaDoTime31`)
- A força do time é `campo + vantagemContida37(bruta − campo)`: até 4 pontos acima do campo vale inteiro; acima disso, 25%.
- Motivo: a simulação (abaixo) mostrou que com investimento máximo o time vencia a liga em 96% das temporadas.

### A bicicleta sem rodinhas acontece uma vez (`conteudo/bicicleta37.ts`)
- Três acontecimentos contavam a mesma história: `inf_bicicleta` (6–10 anos), `inf15_bicicleta` (4–9, decisão "Sem rodinhas") e `inf30_bicicleta` (5–9, decisão com o adulto segurando o banco). Nenhum checava os outros.
- Agora os três conferem `jaAprendeuDeBicicleta37` e, ao resolver, gravam `fechaCapituloDaBicicleta37` (também marca `aprendeu_bicicleta`).
- O ensino pelo jogador (`juntos.ts`, ação "Ensinar… a andar de bicicleta") não mudou: é uma escolha do jogador, não um acontecimento.

## Simulação de equilíbrio

`scripts/sim/esports37.ts` — 12 vidas × 6 jogos × 10 anos, organização fundada com o investimento indicado (INVEST=0/1/2 → 200 mil / 2 milhões / 20 milhões).

| Investimento | Antes: título de liga | Antes: topo 3 | Depois: título de liga | Depois: topo 3 | Depois: título internacional |
|---|---|---|---|---|---|
| máximo (2e7) | 95,8% | 100% | 33,3% | 71,9% | 2,1% |
| médio (2e6) | 14,4% | 41,2% | 7,2% | 32,0% | 0,0% |

Amostra pequena (≈96 temporadas por rodada). Com o teto em 6 a liga chegava a 44,8% no máximo; por isso ficou em 4.

**Ponto para validar:** o título internacional caiu de 47% para 2% no investimento máximo. A causa é a mesma do teto (a força do time deixa de ficar tão acima do campo internacional). Se o mundial tiver de ser alcançável para a melhor organização, o ajuste é `TETO_DA_VANTAGEM37` ou o `FATOR_DA_SOBRA37` (org31.ts).

## Testes

- Novo: `src/motor/__tests__/vida37Esports.test.ts` (venda sem reais, teto, convite, troféu do principal, bicicleta).
- Ajustados às regras novas: `vida32Esports` (venda, compra de div. 3), `vida35Org` (força com teto; convite com reputação), `vida35_3Org` (sem `major`; `lan` no lugar), `vida36Trofeus` (liga sem troféu; uma marca só).
- `tsc --noEmit`: limpo.

## Pendências e decisões em aberto

- **Nomes reais de pessoas e empresas (pedido do jogador):** não consegui identificar, no código, quais nomes faltam. As bicicletas do catálogo já têm marcas reais (Caloi, Monark, Giant…). Falta a lista do que o jogador tem em mente.
- **Torneios pagos** `lan` (150 mil) e `aberto`/`regional` seguem com inscrição paga: o pedido só citou o Major e o convite.
- **Taças** das ligas e dos torneios de convidados: não há mais desenho para elas (não são mais troféus). Se quiser ver a liga na galeria, é uma mudança de regra, não de desenho.
- Os valores de equilíbrio foram medidos em 12 vidas; vale uma leitura com uma vida real jogada até o fim.

## Adendo: marcas reais nas lojas e validação final

- **Lojas** (`src/motor/dados/lojas.ts`): 16 nomes fictícios trocados por marcas reais (Forever 21, Mango, Sandro, Tiffany & Co., Skechers, Puma, New Era, LensCrafters, Casio, Pandora, Philips, IKEA, Natuzzi, Poltrona Frau, Bosch, Yamaha). Os `id`s são os mesmos, então saves continuam válidos.
- **Pessoas vivas** (jogadores e políticos) continuam fictícias. Não há nomes reais de pessoas vivas em carreiras simuladas.
- **Bug encontrado na validação:** a guarda da bicicleta, quando vinha como módulo compartilhado, criou um ciclo de chunks (`Cannot access 'xa' before initialization`), que o smoke de produção pegou e o vitest não. Corrigido com as funções inline em cada um dos três arquivos.
- **Deriva de vidas-fixture:** o novo sorteio da bicicleta mudou três vidas semeadas. Ajustes: semente da fixture de tênis (31→32, `fixGeneralizacao`), checagem do título do estadual aceitar "Campeonato X" (o mesmo critério da galeria, `tecnico`), e a checagem de chamados em `vida19` passou a comparar antes e depois da ação.
- **Smoke de produção:** 37/37 no build final. O `origin/main` também passa 37/37.
- **Suite:** lote de motor com 7 falhas. 3 já falham no `origin/main` (fechamentoMundo #4, agência do motor, treinar dobrado) e 4 eram da VIDA 37, todas corrigidas. Lote de UI relacionado (21 arquivos, 197 testes) passa. O suite completo não cabe no tempo de uma sessão neste ambiente.
