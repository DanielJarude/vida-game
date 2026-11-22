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

## VIDA 35.1 · gaming house em cômodos e o dia a dia (2026-11-22)
- Pedido: a gaming house estava ruim (cômodos sobrepostos, decoração sem sentido, fora do estilo do jogo) e havia poucas ações.
- `ui/v35/casa/CasaDaOrg35.tsx`: a casa mostrada com a mesma cena 2.5D dos cômodos da casa (`CenaDoComodo`): miniaturas e um cômodo por vez — treino por line (computador e cadeira por titular), estúdio, análise, academia, fisio, psicólogo, cozinha, quartos, lounge, piscina no casarão. Acabamentos da reforma da casa (parede, inclusive nas cores da org; piso; luz) e decoração do catálogo por cômodo (`Instalacoes34.salas35`). O desenho SVG antigo saiu.
- Ações novas (org31 + org35): foco do treino, scrims, comissão técnica, retiro, corte de salários, torneios (Copa aberta/Torneio de convidados, resultado na hora), peneira aberta, criadores de conteúdo, bônus por título, collab com a desenvolvedora.
- Navegação: abas da line em grupos (Jogadores · Preparação · Competição · Gestão); Organização em três seções; Equipamento em três passos com resumo e compra no topo; opção em vigor como selo.
- Suíte: 3385 passando; estouros de tempo por carga (os conhecidos + pacotePlaytest, profissao loja, rework122, rework1235, que passam sozinhos ou com tempo maior).
