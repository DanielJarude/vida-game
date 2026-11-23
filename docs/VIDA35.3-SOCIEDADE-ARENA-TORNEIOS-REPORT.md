# VIDA 35.3 — sociedade, arena, torneios e desenho de produtos

Pedido do dono: a organização de e-sports com receita grande ficava sem o que fazer; a divisão de lucros e vendas
estava bloqueada; faltavam torneios além dos principais; a personalização era só da camisa; e a tela de criação de
personagem tinha ficado de fora do rework visual/de navegação.

## O que mudou

- **Sociedade (dividir lucro e venda)** — `motor/v31/esports/org31.ts`, `ui/v35/org/Org35.tsx` (`Sociedade36`), aba
  Organização › Dinheiro. Um fundo entra com 20%, 35% ou 50% da organização: paga na entrada (80% da fatia do valor),
  leva a sua fatia do lucro de cada ano e da venda da organização. Recomprar a fatia custa 110% da fatia do valor.
  Campo novo `OrgEsports31.socio36`, normalizado no save.
  - Observação: não encontrei no código um controle de "dividir lucros ou vendas" já existente com trava. A "Loja"
    tem o canal "licenciamento no varejo (a rede fica com uma parte)", que não está bloqueado. Por isso a sociedade foi
    feita como opção nova.
  - A divisão aplica-se ao lucro líquido do ano (que inclui loja, patrocínio e conteúdo). Não há divisão separada
    da receita bruta de vendas da loja.
- **Arena própria** — `ARENA36` em `org35.ts`, op `arena`. Obra de 12 milhões × multiplicador da região, exige alguma
  line na segunda divisão ou acima, manutenção de 700 mil por ano, receita de ingresso e +6 de fãs por ano. É o
  sumidouro grande para quem já tem receita grande. Fica na aba Casa.
- **Torneios fora da liga** — `TORNEIOS35` passa de 2 para 7: Copa online semanal, Liga universitária, Copa aberta,
  Copa regional, Torneio de convidados, LAN de estádio e Major internacional. Cada line joga cada um uma vez por ano.
- **Desenho de cada produto** — `motor/v33/dono/loja33.ts` (`designs`, op `desenho`, `fatorDesenhos33`) e
  `ui/v33/dono/DesenhoProduto33.tsx`. Moletom, boné, cachecol, mousepad e edição especial ganham cores e estampa por
  temporada (custo de 6 mil ou 0,2% da receita base, uma vez por ano). Com todos os produtos desenhados, a loja vende
  até 20% a mais.
- **Criação de personagem** — `ui/visual31.css`, seção 10. As portas de época perderam a faixa vermelha, o retrato
  virou cartão, o cabeçalho e o botão "Nascer" seguem o rework.

## Testes
- `src/motor/__tests__/vida35_3Org.test.ts`: 13 testes (sociedade, arena, torneios, desenho de produtos e save).
- Testes de org, dono, esportes, criação (rework96, cabelos, barbas, fixPosPlaytestHumano) passam.
- `rework115Esportes` estourou 20 s sob carga; passa isolado com `--testTimeout=180000`.
- `tsc` limpo na cópia Linux. No `/mnt/c` o `tsc` acusa erros de caixa (`Novidades.tsx` × `novidades.ts`) que já
  existem na árvore; a verificação de build é feita na cópia Linux.
- Maior pacote: 796,96 kB (limite de 800 kB).

## Limites conhecidos
- Balanceamento dos torneios e da sociedade foi estimado, não simulado em massa (não rodei o `populacao` de sims).
- A prévia dos produtos sem vestuário (boné, cachecol, mousepad) é simples: forma e cor, sem a ilustração da camisa.
