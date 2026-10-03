# Coisas da vida: bens materiais e as lojas da cidade

- **Base:** `0014bdb` (fechamento do ATT Mundo), na branch `claude/fix-pos-rework3-playtest`. Sem merge em `main`, sem force-push, sem deploy manual.
- **Pedido:** "um sistema de bens materiais, comprar itens de vários tipos, e na parte da cidade as lojas correspondentes".
- **Save:** continua **v20** (o campo novo, `financas.coisas`, é opcional e validado).

## O que já existia e o que faltava

O jogo já vendia imóveis, veículos (de bicicleta a jato), roupas e acessórios (estilo), animais e produtos do banco. Faltavam os **bens duráveis do dia a dia**: o celular, o notebook, a máquina de lavar, o violão, a esteira, os livros.

## O sistema

- **Catálogo** (`motor/dados/coisas.ts`): 35 coisas em 5 lojas.

| Loja | Coisas |
| --- | --- |
| Eletrônicos | celular (simples, intermediário, topo), notebook, computador potente, tablet com caneta, videogame, TV, câmera, caixa de som e fone |
| Móveis e eletrodomésticos | máquina de lavar, lava-louças, aspirador robô, ar-condicionado, colchão, sofá, escrivaninha, cozinha equipada |
| Instrumentos musicais | violão, teclado, guitarra, bateria, violino, piano |
| Artigos esportivos | kit de academia, esteira, chuteira e bola, raquete, prancha, camping, xadrez |
| Livraria e papelaria | estante de livros, livros de estudo, material de arte, jogos de tabuleiro |

- **Cada coisa muda algo** (sem efeito, não entra no catálogo):
  - **ajuda:** a prática de uma atividade rende mais. O violão dá +25% na música, o notebook +25% em programação, a câmera +35% em fotografia, os livros de estudo +12% no cursinho. O teto é +50% por atividade, e o efeito está ligado em `rotinas.processarRotinas`.
  - **alívio:** tira estresse por ano (máquina de lavar, lava-louças, colchão). Vale só para quem cuida da própria casa. O ar-condicionado só alivia onde faz calor: no Brasil, fora do Sul; no mundo, os países e estados quentes.
  - **lazer:** dá felicidade por ano (TV, videogame, sofá, jogos), com teto.
- **Preço:** a referência pelo custo de vida da cidade, na moeda do país. A loja de instrumentos e a livraria só existem em cidades com comércio para isso; nas outras, a compra é pela internet, com 10% de frete.
- **Quem compra:**
  - antes dos 10–12 anos, os adultos da casa;
  - depois, com o próprio dinheiro (a mesma regra de autonomia das roupas);
  - móveis e eletrodomésticos não, para quem mora com a família de origem (são da casa);
  - a prancha só perto do mar;
  - uma de cada coisa.
- **Desgaste:** cada coisa tem vida útil e perde estado todo ano. O sorteio é derivado da vida e do ano, sem mexer no acaso do resto. Quando chega ao fim, a Linha da Vida registra: "O celular simples chegou ao fim, depois de 3 anos de uso".
- **Venda:** o valor de usado depende do que resta da vida útil, do estado e da metade que o mercado paga. Compra e venda entram no extrato do ano numa linha própria.
- **Mudança de país:** o que é da casa (móveis, eletrodomésticos, o piano) fica e é vendido usado; o resto vai na mala. A tela da mudança avisa antes.
- **Patrimônio:** as coisas não entram no patrimônio líquido, porque bem de consumo perde valor. A tela mostra o valor de revenda de cada uma.
- **Biografia:** só o que marca entra na Linha da Vida: o primeiro instrumento, o computador, o piano, compras grandes.

## A interface

- **Vida → Compras:** um grupo novo, "Coisas da casa e da vida", com as 5 lojas. Cada loja diz o que vende, ou "pela internet" quando não há loja na cidade.
- **Vida → Cidade:** uma seção nova, "Lojas da cidade", com as mesmas lojas. Cada uma diz se existe ali ("Aqui em Chicago") ou não ("Não há em …: pela internet, com frete") e abre ao clicar.
- **Uma loja:** cada coisa mostra nome e preço, descrição, o que rende mais ("Rende mais: tocar um instrumento, tocar em bares e festas."), o que muda ("tira um peso da semana", "é descanso", "aqui quase não faz calor: vai ficar desligado") e quanto dura. Quando não dá para comprar, o motivo aparece.
- **Vida → Casa:** a seção "Suas coisas" mostra, para cada coisa, desde quando é sua, o estado (nova, boa, gasta, no fim), quanto vale usada e um botão para vender.
- **Ícones novos:** eletrônicos, eletrodomésticos, instrumentos, esportes e livraria.

## Validação

| Verificação | Resultado |
| --- | --- |
| Typecheck | Limpo |
| Suíte completa (Node 22.23.2) | **1.102 testes em 65 arquivos, todos passando** |
| Testes novos | `coisas.test.ts` (9) e `ui/__tests__/coisas.test.tsx` (3) |
| `build:itch` + smoke | Smoke 21/21 |
| PWA offline | 23/23 |
| Capturas (`scripts/playtest/fechamento.mjs`, cenas `compras`, `loja-instrumentos`, `cidade-lojas`, `casa-coisas`) | 1440, 820 e 390 px: sem rolagem horizontal, erro de página ou botão fora da tela |

Os testes novos cobrem:
- preço local, compra, extrato e duplicata;
- idade e casa;
- frete sem loja na cidade e a prancha longe do mar;
- o violão fazendo a mesma prática render mais;
- a máquina de lavar e o ar-condicionado (com e sem calor);
- desgaste e fim;
- venda usada;
- mudança de país;
- salvar e reabrir, e um save malformado sendo recusado.

Um achado nas capturas, corrigido: a 390 px o preço ficava cortado na borda direita da loja. Agora ele vai junto do nome.

## Bundle

| Pacote | Antes | Depois |
| --- | --- | --- |
| `motor` | 733 kB | 737 kB |
| `motor-dados` | 359 kB | 367 kB (o catálogo) |
| `Jogo` (telas) | 308 kB | 311 kB |

O limite de 800 kB não foi aumentado.

## Pendências

1. Não há presentes (dar uma coisa a alguém) nem coisas herdadas: a herança continua com conta, aplicações, imóveis e veículos.
2. Não há conserto (só desgaste, fim e venda).
3. As coisas dos NPCs não são modeladas.
4. Os preços de referência são aproximações do varejo brasileiro de 2026, convertidas pelo custo de vida; não há tabela por país.
