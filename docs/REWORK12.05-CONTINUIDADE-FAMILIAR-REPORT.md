# REWORK 12.05 — Continuidade familiar e recuperação de saves

Hotfix sobre o REWORK 12 (`cd460a7`, produção em 2026-10-24). Branch `claude/rework12.05-sucessao-menores`. Save continua v20.

## 1. Causa raiz

`sucessores()` (`src/motor/sistemas/sucessao.ts`) marcava `pode: false` para todo filho menor sem um adulto da família que
pudesse assumir a guarda (`guardiao()` sem resultado), com o motivo *"Não há um adulto da família que possa assumir a
guarda — quem decidiria seria a Justiça."*. A tela do legado desabilitava o botão e `continuarComo()` recusava pela mesma
flag. A guarda (quem cuida) e a continuidade (quem o jogador controla) estavam amarradas numa condição só.

Segundo achado: `continuarComo()` adiantava o relógio até o próximo aniversário do herdeiro (`novoT`), então quem tinha
15 na morte voltava com 16.

## 2. Arquivos alterados

- `src/motor/sistemas/sucessao.ts` — menor sempre escolhível; `Sucessor.acolhimento` (texto da tela); ramo do acolhimento em
  `continuarComo`; a vida continua na idade que o herdeiro tem (`novoT = tMorte`); linha na biografia.
- `src/motor/tipos.ts` — `Moradia.acolhimento?: true` (opcional).
- `src/motor/sistemas/obrigacoes.ts` — o acolhimento termina aos 18 (`casaSemFamilia`, com uma linha na biografia).
- `src/ui/telas/Legado.tsx`, `src/ui/vida.css` — a explicação no cartão do sucessor.
- Testes: `src/motor/__tests__/rework1205.test.ts` (novo), `cenarios.ts` (fixture `reneEFrankie`, `sozinho`),
  `src/ui/__tests__/sucessao.test.tsx` (+1).

## 3. Solução

- Filhos vivos (biológicos ou adotivos, `parentesco === 'filho'`) sempre podem continuar. Enteado sem adoção continua fora
  (regra existente, não alterada).
- A guarda segue a ordem que já existia (`guardiao`): o outro genitor vivo, a parceria que morava junto, irmão ≥ 21,
  avô/avó < 85, tio/tia. Nenhum parente é inventado; mortos e inelegíveis não recebem a guarda.
- Sem ninguém: `moradia = { tipo: 'parente', acolhimento: true }` na cidade onde a criança já morava, sem anfitrião e sem
  `responsavelId`. Biografia: *"o caso foi para a Vara da Infância e da Juventude"* (Brasil) / *"a Justiça da infância"*
  (outros países). A herança em dinheiro fica tutelada até os 18 (mecanismo existente); as restrições de idade continuam
  valendo.
- Na maioridade, o caminho existente `casaSemFamilia` resolve a moradia: o imóvel herdado na mesma cidade, um irmão com
  renda ou um aluguel simples.
- Tela: *"Ela ainda é menor de idade. Como não há um adulto da família que possa assumir a guarda, ela será decidida pela
  Justiça. Você continua acompanhando a vida dela."* + **Continuar como Frankie**. "Encerrar esta história" continua lá.

## 4. Saves antigos

O save **não** guarda a inelegibilidade: a lista de sucessores é recalculada toda vez que a tela abre. Um save parado na
tela de sucessão (`morte` sem `encerrada`) já abre com o sucessor habilitado. Não há migração nem normalizador, nada é
apagado. A troca de protagonista continua uma função pura sobre a vida morta (a vida resultante não tem `morte`), então
recarregar não transfere de novo.

## 5. Teste de Frankie (fixture fiel, **não** o save real)

René, 52, morre em Sydney. Frankie, 15, filha adotiva (`adotado_<id>`), mora com ele; não há pais, irmãos, parceria nem
outros filhos vivos. O save é serializado e lido de novo, como se estivesse parado na tela. Resultados:

- aparece como "filha adotiva", `pode: true`, sem motivo de bloqueio, com o texto do acolhimento;
- continua com 15 anos, em `au:sydney`, em acolhimento; René fica como pai falecido, na linhagem e no luto;
- o apartamento e o dinheiro (tutelado até os 18) chegam a ela, sem nada dobrar: o patrimônio do mundo depois da troca é o
  de antes menos os custos da transmissão;
- salvar e reabrir dá o mesmo estado, e continuar de novo dá erro;
- avança 4 anos: aos 18 o acolhimento termina e ela passa a morar no apartamento herdado; não sobra referência para pessoa
  inexistente.

## 6. Testes executados

- `rework1205.test.ts`: 13 casos (Frankie, filho biológico de 15, adotivo de 15, criança de 8 com avó, avó de 90
  inelegível, dois responsáveis, genitor falecido, 17 → maioridade, adulto de 20, menor + irmã adulta, enteado, save sem a
  partilha iniciada, carregamento repetido, ausência de duplicação, referências).
- Tela (jsdom): Frankie habilitada, o texto antigo some, "Continuar como Frankie" grava a vida dela com 15.
- Suíte completa: 1947/1948 na rodada inteira. O que faltou foi `motor.test.ts › regra de agência`, que estourou o limite
  fixo de 60 s com a máquina carregada (build e Playwright rodando junto); sozinho, passa (60/60 nos quatro arquivos de
  sucessão e motor).
- `tsc --noEmit` limpo. `npm run build` ok (maior chunk: motor-textos 782.8 kB, abaixo de 800).
- Visual (Playwright no build de produção, 390×844 claro, 360×640 escuro, 1440): botão habilitado, explicação legível,
  "Continuar" com 44 px de altura, sem rolagem horizontal; depois do clique o jogo abre em "Frankie, 15 anos · Sydney,
  Austrália".

## 7. Limitações

- **O save real do jogador não estava neste ambiente.** O caso foi validado com uma fixture fiel, não com a partida dele.
  Se o vínculo de Frankie estiver registrado como filha (`parentesco: 'filho'`), a recuperação é automática ao abrir.
- O acolhimento é a menor representação possível: uma moradia sem anfitrião. Ainda não há família acolhedora como
  pessoa, visitas do conselho tutelar nem adoção posterior.
- Por padrão a partilha vende o imóvel no inventário quando não há cônjuge (regra existente); para que o herdeiro fique
  com ele, é preciso atribuí-lo na tela do legado.
- A mudança de `novoT` vale para toda sucessão: o ano do novo protagonista passa a começar na data da morte, não no
  aniversário dele.
- Nenhuma nota de novidades foi adicionada (hotfix).

## 8. Commit final

`8b3204b` — REWORK 12.05 · continuidade familiar de menores (código + testes + este relatório). Este preenchimento das
seções 8–9 é um commit só de documentação, por cima dele.

## 9. Publicação

- `main` e `claude/fix-pos-rework3-playtest` eram `cd460a7` (= produção) e foram avançadas em fast-forward para
  `8b3204b`, sem force push.
- O push da branch de desenvolvimento gerou só preview (`claude-rework12-05-sucessao.vida-game.pages.dev`); o smoke test
  passou ali antes da promoção.
- Cloudflare Pages: check "Deploy successful" em `8b3204b`. vida-game.pages.dev serve `index-B-gj3KK-.js` e
  `motor-textos-Dnx7daHR.js`, byte-idênticos ao build local de `8b3204b`.
- Smoke test em produção (Playwright, 390 claro, 360 escuro, 1440): com a fixture de René e Frankie, o cartão de Frankie
  vem habilitado e "Continuar como Frankie" abre o jogo em "Frankie, 15 anos · Sydney, Austrália".
