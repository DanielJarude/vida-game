# VIDA 35 · A organização de e-sports que o dono monta

Data: 2026-11-22 · branch `claude/vida34-navegacao-esporte` · notas '35'. Feito sem multiagentes (pedido do usuário).

## Pedido
Mais personalização da gaming house; montar os PCs dos jogadores (tipos diferentes); mais o que fazer — comprar outra
line para jogar por você, reformular a line, line academy e outras coisas.

## Motor
- `motor/v31/esports/org35.ts` (folha, chunk motor31-esports): catálogo do equipamento (4 peças × 4 degraus, nomes da
  época — monitor CRT antes de 2008 até 540 Hz depois de 2023; pacotes Básico/Competitivo/Padrão de LAN/Topo; gabinete
  e RGB), `bonusDoSetup35` (até +1,8; metade com 3 anos, nada com 5), `climaDoSetup35`; cômodos `COMODOS35` (análise,
  academia, chef, psicólogo, fisio, quartos, estúdio; obra + manutenção; força até +1,2); `EVENTOS35`; `REFORMULACAO35`.
- `org31.ts`: `LinhaOrg33.setup35/academy35/emprestados35`, `OrgEsports31.casa35/eventos35/absorvidas35` (opcionais).
  Ops novas: `setup`, `comodo`, `evento`, `comprar_linha` (num jogo novo vira line; no mesmo jogo substitui a sua,
  abatendo o valor dela; metade das dívidas vem junto; a org some da vitrine), `reformular` (`planoDaReformulacao35`,
  determinístico: a prévia é o que acontece), `academy` (ativar/fechar; só com a principal na 2ª divisão ou acima),
  `subir`, `descer`, `promover {academy}`, `emprestar` (volta na virada, evolui mais), `vender_jogador`.
- Temporada: `temporadaDaAcademy35` (divisão abaixo da principal, sobe/cai, repõe jovens), evolução extra para academy e
  emprestados, fisio freia o declínio, clima do setup/academia/quartos, psicólogo segura clima ruim; manutenção da casa e
  receita do estúdio no fechamento da organização. `forcaDoTime31` soma setup e casa.

## Telas
- `ui/v35/org/Org35.tsx`: Equipamento35 (desenho da estação que muda com as peças), Academy35, Reformular35,
  ComprarLinha35, Eventos35, Comodos35. Abas novas na line: Equipamento e Academy. Elenco: vender, emprestar, descer à
  academy. Comando: reformular. Organização: comprar line e eventos. Gaming house: cômodos + layout das mesas
  (fileiras/ilhas/arena), paredes, piso, neon, plantas, lounge; o desenho mostra os cômodos e o equipamento.
- A antiga "Academia" virou "Peneira de talentos".

## QA
- Suíte completa: 3387 passando; 7 estouros de tempo por carga (os 5 conhecidos + profissao "treinar dobrado" e rework11Relacoes "preservativo", que passam sozinhos).
- `src/motor/__tests__/vida35Org.test.ts` (7) e `src/ui/__tests__/vida35Org.test.tsx`; screenshots `~/vida-trabalho/v34/org35.mjs`.
