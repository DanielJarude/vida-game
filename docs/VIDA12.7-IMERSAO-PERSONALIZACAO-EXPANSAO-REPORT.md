# VIDA 12.7 — Imersão, personalização e expansão dos sistemas

## A. Identificação

- **Atualização:** VIDA 12.7 — "Imersão e personalização: a roupa escolhida é a vestida, a casa com prévia e catálogo inteiro, moda de luxo de verdade". Notas do jogo: versão `12.7`.
- **Numeração:** a sequência do projeto é 12.4 → 12.4.1 → 12.4.2 (HOTFIX 11.5.1) → 12.5 → 12.6. Nenhum roadmap lista uma "13" com este escopo. Esta é a 12.7.
- **Branch:** `claude/vida12.7-imersao-personalizacao`, criada a partir de `origin/main` = `1d30b41` (VIDA 12.6, que já estava publicada).
- **Commits** (de 55743b2 a b02d22a): equipamento → Agora e economia → casa → roupas → tatuagens → falas → desenhos da casa → miniaturas → ajustes de teste → notas e auditoria → simulação. São 57 arquivos, +4162/−222 linhas.
- **Publicação:** veja a seção F.

## B. Auditoria inicial

A auditoria leu o código atual, as notas da 12.6 e os relatórios anteriores. Três leituras foram delegadas a agentes, com resultado em arquivo:linha. As notas estão em `~/vida-trabalho/a127/auditoria-*.md`.

| Item pedido | Situação encontrada |
|---|---|
| Selecionar uma peça e vestir outra (§2) | **Bug confirmado.** `mudarAparencia` (estilo.ts) marcava "em uso" **todas** as peças com o mesmo desenho do retrato: 4 óculos escuros, 7 roupas "básicas", 3 chapéus de aba e outras. Isso acontecia ao pôr ou tirar qualquer peça e até ao cortar o cabelo. O retrato mostrava a primeira peça do inventário e a figura de corpo inteiro mostrava a última. A ação `usar_item` também procurava a peça pelo produto, não pelo id. |
| Paredes, pisos e luz (§3.1) | **Parcial.** Havia 6 pisos, 12 paredes e 4 luzes. Não havia rodapé, cortina, temperatura nem intensidade. |
| Prévia da reforma (§3.2) | **Ausente.** Escolher uma opção num `<select>` e clicar em "Fazer" cobrava na hora. A cena não mudava antes. |
| Catálogo doméstico (§3.3) | **Parcial.** Havia 51 coisas e nenhuma para banheiro, piscina, jardim, lazer ou garagem. Não havia geladeira, fogão nem cama: eram desenhos fixos do cômodo. |
| Segmentos de luxo (§3.4) | **Parcial.** Só existiam as faixas das marcas (popular, médio, premium, luxo). O produto não tinha segmento. |
| Distribuição automática (§3.5, §13) | **Comportamento esperado.** Preservada sem mudança. |
| Categorias da loja de roupas (§4.1) | **Parcial.** As seções eram vestuário, calçados, acessórios… sem tipo de peça. |
| Apresentação visual da loja (§4.2) | **Parcial.** Uma linha de texto por produto. A figura de 56 px não aparecia para óculos e chapéus, e na busca só havia uma letra. |
| Moda de luxo (§4.3) | **Parcial.** O teto era de cerca de R$ 35 mil (relógio). A roupa mais cara era um sobretudo de R$ 13,8 mil. |
| "O que você está usando" (§4.4) | **Parcial.** Era uma lista de textos com botões de texto. |
| Tatuagens: os 9 requisitos (§5) | **A 12.6 implementou 7 dos 9.** Ajustes (§5.4) estava **parcial**: não havia botão de restaurar, e a escala e a rotação nunca voltavam ao padrão. Histórico (§5.9) estava **parcial**: os retoques apareciam só como contagem, e não havia registro de alterações. |
| Aba "Agora" (§6) | **Bug confirmado.** Os cartões "o que marcou o ano" comparavam `m.t >= desde`, mas `desde` é uma posição na biografia e não um mês. O filtro deixava passar a vida inteira, então os três últimos marcos de qualquer época apareciam ali (os títulos de futebol ficavam por anos). Além disso, a linha compacta mostrava as 3 últimas idades *com* entradas, e não anos de calendário. |
| "O curso pesa" para milionário (§7) | **Bug confirmado.** `motivoDeAperto` lia só o fluxo do mês (`saldoMensal`) e ignorava conta, aplicações e patrimônio. Outros gatilhos usavam `conta < 0` sem olhar as aplicações (romance, relevância, interações, acontecimentos 12.6) ou só a conta corrente (viagens 12.6). "A aposentadoria não fecha o mês" e "Em casa falta dinheiro" não olhavam o dinheiro real. |
| Textos de emprego (§8.1) | **Parcial.** A 12.6 deu cenas a 14 profissões. Mas a conversa do aumento ("sala fechada, café frio") e a leitura do ano tinham texto único para todas. |
| Ações com amante (§8.2) | **Parcial.** A 12.6 trouxe encontro, presente, viagem, futuro e tempo. "Terminar o caso" tinha **texto único**, e o "futuro" tinha 2 textos fixos. |
| "Conhecer a família" (§8.3) | **Já implementado na 12.6**, com variação real: lê os pais vivos ou não, o jeito deles, a distância e o tempo de namoro. Não foi refeito. |
| Carros de luxo e animais exóticos por cidade (§13) | **Comportamento esperado.** Não foi mexido. |

## C. Implementação

### Equipamento (§2) — `sistemas/estilo.ts`, `acoes.ts`, telas
- `mudarAparencia(v, m, alvo?)` agora só mexe no campo alterado (óculos ou chapéu), e só para escolher **uma** peça: a escolhida, ou a que já estava em uso com aquele desenho. Cortar o cabelo não mexe mais em roupa (`alinharItens`).
- `usarItem(v, itemId, usar, id?)` age sobre a peça pelo id do inventário (`instanciaDoItem`) e tira o que ocupa o mesmo lugar do corpo. A roupa do retrato passa a ser a peça de cima que ficou (`roupaQueFica`).
- `umPorLugar` garante uma peça por lugar e roda dentro de `sincronizarVisual`. Os modelos de óculos e chapéu seguem o desenho em uso. Foi criado o campo `Visual.modeloBrincos`.
- A ação `usar_item` ganhou o campo opcional `id`. Todas as telas passam o id da linha mostrada: guarda-roupa, loja, Patrimônio e balcão antigo.
- **Migração:** a normalização existente (`normalizarHotfix1151` → `sincronizarVisual`) agora corrige os saves com várias peças "em uso". Fica a que o retrato mostrava, senão a mais recente. É idempotente.

### Casa (§3) — `dados/lar.ts`, `sistemas/lar.ts`, `sistemas/personalizacao.ts`, `ui/ilustracao/comodos.tsx`, `ui/jogo/Personalizar.tsx`
- **Acabamentos:**
  - 20 pisos e 35 paredes.
  - 14 luzes: 12 delas aceitam regular a temperatura (quente, neutra ou fria) e a intensidade (40–100%).
  - Novos aspectos: **rodapé e moldura** (5) e **cortina e persiana** (8).
  - Cada opção tem nível de 1 a 6 (básico → exclusivo, `SEGMENTOS_DE_LUXO`) e um `desenho` usado pela cena.
- **Regras:**
  - Áreas externas: só luz.
  - Banheiro e cinema: sem cortina.
  - Casa alugada: não troca o piso.
  - O conforto só considera rodapé e cortina quando o jogador os escolheu, sem deriva nas vidas existentes.
- **Reforma com prévia:**
  - Nova operação `personalizar.op = 'reforma'`. Vários aspectos de uma vez e uma conta só. `reformaDoComodo` é a mesma conta que a tela mostra.
  - Na tela: escolhas agrupadas por segmento, cena atualizada na hora, "Comparar com como está", "Voltar ao que está", "Acabamento original do imóvel", "Cancelar", custo por item e total, e "Confirmar e pagar".
  - Nada é cobrado antes de confirmar.
  - A cena grande, a miniatura e a prévia usam o mesmo componente com os mesmos dados.
  - O tamanho da cena só muda o detalhe, nunca o material.
- **Cena:** tem padrões para todas as paredes (tijolo, papéis, azulejo, lambri, ripado, pedra, cimento, tecido, mármore, boiserie com friso dourado) e todos os pisos (tábua, tábua larga, espinha de peixe, Versailles, rejunte, grande formato, ladrilho, mármore, granito, carpete). Também desenha luminárias por tipo, cortinas e persianas, e rodapés e molduras.
- **Catálogo doméstico:** 93 coisas novas, cada uma com segmento, cômodo de destino (`COMODO_DA_COISA`), desenho próprio (`ui/ilustracao/objetosDaCasa.ts`) e variantes de material.

  | Cômodo | Coisas novas |
  |---|---|
  | Sala | 16 |
  | Cozinha | 12 |
  | Quarto | 9 |
  | Hóspedes | 4 |
  | Banheiro | 9 |
  | Piscina | 12 |
  | Jardim e lazer | 12 |
  | Jogos, cinema e academia | 9 |
  | Garagem | 6 |
  | Escritório | 5 |

  - Os cômodos de lazer passaram a aceitar os itens novos.
  - Móvel e eletrodoméstico de segmento 4 ou mais só saem de marcas premium ou de luxo, com o fator de luxo.
  - Duas marcas fictícias novas: Atelier Ardent (móveis) e Fornaro (cozinha profissional). A Natuzzi também faz os sofás de couro e de designer.
- **Pendências (não feitas):** portas, janelas, divisórias e revestimentos especiais.

### Roupas (§4) — `dados/estilo.ts`, `ui/avatar/MiniaturaDaPeca.tsx`, `ui/avatar/Figura.tsx`, `ui/jogo/material/Lojas.tsx`, `ui/jogo/Aparencia.tsx`
- **Tipos de peça principais** (`TIPOS_DE_PECA`, `tipoDePeca`): casacos, blusas, vestidos, calças, saias, shorts, sociais, esportivas, calçados e acessórios. É um filtro só, sem subcategoria. Marca, faixa, preço, ordem e busca foram mantidos. A "Seção" passou a valer só para o que não é roupa.
- **Catálogo visual:** cada cartão traz:
  - A miniatura da peça de verdade (`MiniaturaDaPeca`), com recorte no lugar do corpo (`focoDaPeca`): óculos, chapéu e brincos no rosto; colar no busto; relógio, pulseira e anel no pulso certo; calçado de perto.
  - Segmento, coleção e edição ("Exclusivo"/"Edição especial"), nome, tipo, marca, descrição, preço, **Experimentar** (o provador mostra você com o que já usa, trocando só aquele lugar) e Comprar.
- **Luxo:** 21 peças novas, com preço de referência entre R$ 4,2 mil e R$ 480 mil. A grife multiplica de 0,8 a 1,45 sobre esse valor. Incluem:
  - alta-costura, vestido de passarela, terno de vicunha;
  - blazer, jaqueta e casaco de grife;
  - sapato bespoke, salto de grife, tênis de série numerada;
  - óculos de titânio e ouro, Panamá superfino;
  - relógio de ouro e de alta relojoaria;
  - colar, brincos e anel de diamante;
  - top e short de corrida.

  O retrato desenha os óculos de ouro e o Panamá. Os brincos agora aparecem no lóbulo, com forma por modelo: argola, ouro ou diamante. O básico continua barato: a camiseta lisa sai abaixo de R$ 300.
- **Guarda-roupa:** um cartão por parte do corpo, com a miniatura da peça, o nome, a marca, "Trocar por" e "Vestir" (pelo id) e "Tirar".

### Tatuagens (§5) — `sistemas/tatuagens.ts`, `ui/jogo/Tatuagens.tsx`
- Botão "Restaurar posição, tamanho e rotação" no estúdio.
- "História desta tatuagem": quando foi feita (e com que idade), o significado, **cada retoque com a data**, as alterações, o laser e a cobertura.
- Nova ação `ressignificar_tatuagem`: o significado muda, o desenho, o lugar e o tamanho ficam. Para mudar o desenho, só cobrindo. Fica registrado em `Tatuagem.alteracoes` (campo opcional). Os outros requisitos já vinham da 12.6.

### Agora (§6) — `ui/telas/Jogo.tsx`, `ui/jogo/LinhaDaVida.tsx`
- O destaque do ano mostra só o que aconteceu nos últimos 12 meses, sem títulos repetidos. O primeiro cartão é "O destaque do ano" e só aparece quando há mais de um. Se não há nada relevante, não aparece nada.
- O que já está num cartão não se repete em "As conquistas do ano".
- A linha compacta mostra os últimos **anos de calendário**. Um ano tranquilo mostra "Anos tranquilos: nada que tenha marcado desde X".
- Biografia e Retrospectiva continuam com tudo.

### Economia dos acontecimentos (§7) — `sistemas/dinheiro.ts`
- `condicaoEconomica(v)` devolve:
  - a faixa: sem dinheiro, apertada, média, confortável, rica, milionária ou bilionária, pelo patrimônio e pela liquidez, ajustada ao custo da cidade;
  - `iliquida`: patrimônio a partir de 1 mi com pouca liquidez;
  - a liquidez: conta + aplicações + caixa do negócio.
- `apertoDeVerdade(v, custoMensal)`: quem é rico com dinheiro à mão, ou tem guardado para um ano do custo, não aperta. Fora isso, vale a segurança do mês e da reserva.
- `semCaixa(v)`: conta negativa que as aplicações cobrem não conta como falta de dinheiro.
- Aplicado em:
  - "O curso pesa": tem uma variante para patrimônio preso em bens.
  - "A aposentadoria não fecha o mês".
  - "Em casa falta dinheiro": passa a ler a folga real da família.
  - O peso do dinheiro na relação (romance), na relevância, nas interações e nos acontecimentos da 12.6.
  - O tom das viagens: usa a liquidez, não só a conta corrente.
- A economia não sumiu: quem é pobre continua tendo esses eventos (simulação abaixo).

### Falas (§8) — `dados/falasDoTrabalho.ts`, `conteudo/desafios.ts`, `sistemas/profissao.ts`, `sistemas/convivio126.ts`, `sistemas/interacoes.ts`
- **Ambientes de trabalho:** balcão, saúde, educação, escritório, operação (fábrica, obra, campo, logística), transporte e segurança. Cada um tem o seu cenário da conversa do aumento, os seus "sim" e "não" e a sua leitura do ano em 4 níveis, com 2 variantes cada. A escolha é estável no ano e no lugar.
- **Terminar o caso:** a frase depende do que o caso foi: combinado, ciumento ou temperamental, menos de 6 meses, mais de 2 anos, carinhoso ou paciente. São cerca de 15 frases.
- **A conversa sobre o futuro:** 4 + 3 frases que não se repetem em sequência (`semRepetir`).
- Nova ação **"Mandar um carinho"** (`caso_carinho`): é de graça, pode deixar rastro e tem intervalo mínimo.

## D. Testes

- **Suíte completa:**
  - Antes das correções: 2273 testes, 12 falharam.
  - Depois: os 5 testes antigos que esperavam a interface antiga foram ajustados; veja abaixo. Os dois testes novos de equipamento foram corrigidos (a lista fixa de casacos passou a ser genérica).
  - Rodada final: veja a nota no fim desta seção.
  - Não são desta atualização:
    - `rework122` "negócio por fora…" e `rework11Esportes` "Sassuolo na Serie C" **falham também no commit base 1d30b41**.
    - `fix31` (2), `motor.test` "linguagem de escolha" e `fechamentoMundo` "a mesma discussão" **só estouram o timeout** fixo de 20–60 s com carga. `motor.test` passa sozinho com o tempo aumentado, então o conteúdo está correto.
- **Testes novos:** 38 no total.
  - `vida127Equipamento` (9): **cada um dos 88+ produtos** é escolhido depois de comprar todos, na ordem do catálogo e na inversa, nos dois gêneros. Cobre os parecidos (grife/aviador/Juliet/comum e os chapéus), vestido + blusa + saia + casaco, tirar não veste outra, o corte de cabelo, a compra na loja, duas peças do mesmo produto (pelo id), salvar e carregar, save antigo com o defeito e a ação antiga sem id. **Os 9 falham no código antigo.**
  - `vida127Economia` (4).
  - `vida127Vida` (15): acabamentos, prévia = cobrança, regras, falta de dinheiro, catálogo por cômodo, distribuição, luxo de móveis, tipos de peça, faixas de preço, ressignificar, falas do trabalho, fim do caso, futuro sem repetição, carinho.
  - `ui/vida127` (6): guarda-roupa veste a grife; na loja, filtrar, ordenar, comprar o 2.º e reabrir; cartão com miniatura e provador; Agora sem o título antigo; Agora em anos de calendário; reforma com prévia, comparar, confirmar e cancelar.
- **Testes antigos ajustados**, todos pela mudança pedida:
  - `rework1241` (2): "Calçados" agora é o tipo de peça; trocar é "Vestir calça jeans".
  - `hotfix1151` (1): seletor do nome no cartão.
  - `interface` (1): o "sim" e o "não" do aumento por ambiente.
- **Saves antigos:** `scripts/sim/saves127.ts` sobre 59 saves de 8 pastas de QA, de vários releases. Os 59 abrem, normalizam de forma idempotente, mantêm peças, tatuagens e coisas, ficam com uma peça por lugar e vivem mais 3 anos com o extrato conciliado.
- **Gameplay:** `scripts/sim/vida127.ts` rodou 150 vidas (pobre, média, rica, milionária e bilionária × 5 estratégias × 6; BR, PT, US, AR, DE) até os 75 anos, num total de 10 087 anos.
  - **0 travamentos.**
  - **0 anos com duas peças no mesmo lugar.**
  - Cenas de falta de dinheiro só nas faixas sem dinheiro (22) e apertada (2). Houve 1 "Em casa falta dinheiro" de uma criança de família média.
  - **Zero** para rica, milionária e bilionária.
  - Restaram 15 entradas repetidas em sequência na biografia em 10 mil anos (textos de sistemas antigos; pendência).
- **Visual:**
  - Galerias: `scripts/playtest/galeria127.tsx` (acabamentos em 132 e 320 px; todas as peças em miniatura, nos dois gêneros) e `galeria127Casa.tsx` (os 93 objetos em 48 e 160 px, 16 cenas). Todas foram revisadas.
  - Auditoria na aplicação: `scripts/playtest/rework127.mjs`, 11 cenas × claro/escuro × 1440/390/360, com 136 capturas. Mede sobreposição, contraste, rolagem horizontal e alvos de toque. **0 problemas.**
  - Ajustes feitos pela revisão: recorte de relógio, pulseira, anel, colar, calçado e conjunto; brincos visíveis; cimento queimado mais sutil; texto da marca no cartão; prévia junto às escolhas.
- **Build e pacotes:**
  - Todos abaixo de 800 kB: motor 796,0, motor-textos 791,8, motor-dados 791,7, motor-carreira 746,7, Jogo 657,2.
  - **Folga mínima:** a próxima atualização precisa pôr conteúdo novo em pacotes novos.
- **Smoke** do build de produção: 21/21.

## E. Pendências

- Portas, janelas, divisórias e revestimentos especiais escolhíveis (§3.1, "investigar"). A cena tem uma janela fixa por cômodo.
- Objetos de parede (quadros, espelho, toalheiro, monitores) ficam no chão encostados na parede do fundo. Tapetes ficam na fileira da frente, não sob os móveis. É o layout da cena, que não foi mudado.
- Não há botão para "mover" um objeto dentro do cômodo. O "Levar para outro cômodo" já existia.
- A tatuagem feita não muda de posição ou tamanho, o que é coerente com a pele. Para mudar, só cobrindo. O que muda é o significado.
- Um produto por id de catálogo, qualquer que seja a marca (limitação herdada da 12.4.1).
- Os pacotes motor, motor-textos e motor-dados estão a 4–8 kB do limite.
- 2 testes antigos falham também no commit base (rework122 e rework11Esportes). 4 estouram timeout só com carga.
- 15 repetições de texto em sequência na biografia em 10 mil anos simulados.
- A VIDA 12.6 foi publicada sem relatório próprio em `docs/`.

## F. Publicação

Preenchida depois do deploy, no commit de documentação.
