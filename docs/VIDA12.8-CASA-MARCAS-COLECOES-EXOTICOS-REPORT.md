# VIDA 12.8 — Casas de verdade: cômodos montados, banheiros, o lado de fora, marcas, coleções e exóticos

## A. Identificação

- **Atualização:** VIDA 12.8. Notas do jogo: versão `12.8`.
- **Numeração:** a sequência do projeto é 12.4 → 12.4.1 → 12.4.2 (HOTFIX 11.5.1) → 12.5 → 12.6 → 12.7. Nenhum roadmap no repositório lista outra numeração para este escopo (o relatório da 12.7 registra o mesmo). Esta é a 12.8.
- **Base:** `origin/main` = `ce8735c` (VIDA 12.7 publicada, `2e2707d` em produção). Não havia commits posteriores à 12.7 em nenhuma branch do GitHub.
- **Branch:** `claude/vida12.8-casa-marcas-colecoes-exoticos`.
- **Fora do escopo (não feito, como pedido):** funcionários domésticos, administração de propriedades, manutenção recorrente de imóveis (além da que já existia), segurança residencial, expansão de acontecimentos familiares, Vida Rural/Fazenda.

## B. Auditoria inicial

| Pedido | O que havia | Situação |
|---|---|---|
| §1 Composição dos cômodos | `ui/ilustracao/comodos.tsx`: duas fileiras (grandes no fundo, resto na frente), escala por um quadro fixo de 320 unidades ≈ 5,8 m, larguras por objeto que mediam o **quadro do desenho** (120×120), não o objeto | **Problema confirmado.** Ar-condicionado, quadros e espelho no chão; tapete na fileira da frente; barraca (46) e chuteira (24) quase do mesmo tamanho; piscina com tudo enfileirado. |
| §2 Banheiros | `sistemas/lar.comodosDe`: **um banheiro** em qualquer planta (mansão de seis "suítes" inclusive) | **Problema confirmado.** |
| §3 Lado de fora | Só a cor da fachada (sorteada) e a obra de cômodos externos | **Ausente** (fachada, paisagismo, caminho, luz e portão escolhíveis). |
| §4 Funções dos cômodos | `lar.bonusDosComodos` (bônus de prática se equipado), `lazer` no conforto, usos por **objeto** (`pertences.USOS`), a casa no dia a dia (`casaNoDia`, 12.6: faxina, plantas, visita, série) | **Parcial.** Nenhum uso por cômodo; a academia de casa não tirava mensalidade nem deslocamento. |
| §5 Coleções | `sistemas/colecao` (REWORK 12/12.2): catálogo, procedência, autenticidade, leilão, propostas, exposição (`expor`), carros de coleção (`veiculo_colecao`), galeria de troféus | **Parcial.** Raridade em 4 graus; sem visão organizada por coleção; sem vinho; sem móvel de expor; peça exposta não aparecia na cena. |
| §6 Marcas | `dados/lojas`: a marca mudava **só o preço** (4 faixas) | **Problema confirmado.** |
| §7 Exóticos | `sistemas/exoticos` (12.2): 8 espécies, lei por país/estado, instalação, cuidador | **Parcial.** Sem cacatua, tucano, jiboia, fenec, primatas. |
| §7 Bug macaco-prego | `dados/animais.OFERTAS_ILEGAIS`: "um filhote de macaco-prego" e "um sagui" com `especie: 'papagaio'` (não existia espécie de primata) | **Bug confirmado — causa raiz:** o texto da decisão usa a frase da oferta; `adotarPet` registra a espécie da oferta (papagaio), e o resumo, o inventário e o retrato leem a espécie. |
| §8 Lojas | A loja de móveis já usava os cartões da 12.7 (`catalogo-loja`) | **Parcial:** sem filtro adequado (a única seção era "Móveis e casa"). |

## C. Implementação

### §1 Cômodos montados
- `ui/ilustracao/medidas.ts`: largura × profundidade × altura reais de cada objeto (todas as coisas da casa) e a montagem (chão com zonas, parede com altura, tampo, tapete, água), âncoras e relações (`junto`, `diante`, par).
- `ui/ilustracao/caixa.ts`: a caixa real de cada desenho (lê os caminhos SVG e as transformações) — o objeto entra na cena pelo tamanho dele, não pelo do quadro.
- `ui/ilustracao/disposicao.ts`: a geometria pela **área do cômodo** (largura, profundidade visível, ponto de fuga, parede de 2,70 m) e a disposição: âncoras primeiro, depois o que vai junto (cabeceiras dos dois lados da cama, mesa de centro na frente do sofá, cadeira encaixada na mesa), depois o resto pelas zonas; parede do fundo ou lateral direita (a TV de frente para o sofá, em perspectiva); o pequeno num tampo (sem tampo, numa prateleira de parede); tapete sob o grupo; piscina com deck (espreguiçadeiras no deck do fundo, ombrelone junto, mesa e sofá no deck lateral, cascata na borda, boias na água, aquecimento solar na parede). Nada sobrepõe no chão; o que não cabe fica fora da cena (`data-fora`), não espremido. Tenta a âncora no meio, à direita e à esquerda e fica com a que deixa menos de fora.
- Barraca: armada lá fora (2,1 m), guardada dentro de casa (desenho próprio).
- `ui/ilustracao/fixosDaCena.ts`: bancada, fogão simples, box, pia, vaso, árvore, churrasqueira, prateleira; e as peças de coleção expostas (tela, camisa emoldurada, peça na redoma, vaso antigo).
- `comodos.tsx` reescrito sobre essa geometria (janela, cortina, piso, luz e rodapé seguem a perspectiva de cada tamanho); cenas novas: lavabo, adega, quadra, varanda.

### §2 Banheiros
- `dados/lar.PLANTAS[].banheiros`: suítes, sociais, lavabo por tipo (kitnet/apto 1q/casa simples 1; apto 2q, apto 3q, casa 3q e sítio: suíte + social; casa grande: 2 suítes + social + lavabo; alto padrão 3 suítes; cobertura 4; mansão 6 suítes + social + lavabo).
- `sistemas/lar.comodosDe`: cada suíte logo após o seu quarto (`suiteDe`); o banheiro social mantém o id `banheiro` (acabamentos e objetos de saves antigos continuam lá); `comodoDaCoisa` prefere o cômodo de id igual ao tipo. Construir banheiro a mais (casa própria; até quartos + 2).

### §3 O lado de fora
- `dados/casa128.OPCOES_EXTERNAS`: fachada (13), paisagismo (8, com terreno mínimo), caminho (7), luz externa (5), portão (5), cada uma com segmento, preço (por m² ou fixo) e manutenção.
- `sistemas/casaViva`: só casa própria; prévia = conta (`reformaExterna`); op `reforma_externa`; valoriza o imóvel pela metade; manutenção mensal (`PATRIMONIO_NO_MES`); conforto "o lado de fora bem cuidado" (até +4).
- Desenho: `ilustracao/casas.ladoDeFora` (material da fachada, grama, canteiros, palmeiras, pomar, seixos, árvores, estufa, caminho, arandelas, balizadores, fachos, banho de luz, portão); a tela Casa mostra o lado de fora escolhido; o painel "O lado de fora" na casa por dentro mostra a prévia no desenho antes de pagar.

### §4 Funções dos cômodos
- `dados/casa128.USOS_DOS_COMODOS` + `sistemas/casaViva.usarComodo` (op `usar_comodo`): cinema (sessão; com alguém; para a família e amigos), academia (treino; com alguém), piscina (nadar → natação; tarde; convidar; festa), biblioteca (ler, estudar, escrever), jogos (noite; receber; noite com amigos), escritório (trabalhar de casa — só para setores de trabalho de escritório ou autônomos; estudar), estúdio (praticar, gravar, ensaiar), ateliê, adega (abrir uma garrafa com alguém; organizar), lazer (churrasco), quadra (jogar com alguém; treinar), varanda (conversar).
- Tudo vai para sistemas existentes (frentes, corpo, humor, estudo, desempenho, proximidade); uma vez por ano cada; cômodo vazio não serve; qualidade (segmento das coisas e da marca) de 0,9× a 1,25×. Usos que duplicariam a `casaNoDia` (plantas, café com visita) ficaram de fora.
- Academia de casa equipada: a atividade "academia" fica sem mensalidade, sem a logística de ida e volta e sem o círculo social da academia (`rotinas.custoDaRotina`, `semana.cargaDaAtividade`, `social`).

### §5 Coleções
- Raridade em seis graus (`dados/colecao128.grauDaPeca`), dos dados da peça: única (catálogo), edição limitada (tiragem declarada no nome), muito rara (rara das faixas 5–6 ou venda privada), rara, incomum, comum. Preço não é raridade (o Cartier Tank de série é comum).
- Vinhos (6 classes, importadora de vinhos e leilão): sem adega (de bancada, de parede ou o cômodo), perdem estado e valor todo ano.
- Móveis de expor: vitrine iluminada, expositor de relógios, estante de troféus, adega de parede. Peça exposta no cômodo com o expositor certo gasta metade.
- `colecao.colecoesDaVida`: relógios, arte, joias, antiguidades, vinhos, memorabilia, carros de coleção, peças numeradas da casa e do guarda-roupa, discos e troféus — quantidade, valor estimado, à vista, onde, graus e expositor. Painel "Suas coleções" no Patrimônio.
- A peça exposta aparece na cena do cômodo (tela na parede, camisa no quadro, peça na redoma, vaso).

### §6 Marcas
- `dados/perfisDeMarca` + `sistemas/perfilDaMarca`: posicionamento (econômico, intermediário, premium, luxo, ultraluxo), oito notas e a fama, com perfis das marcas reais pelo que são conhecidas. Novas marcas reais de ultraluxo/luxo: Hermès, Patek Philippe, Minotti, Fendi Casa, Gaggenau, Fazioli.
- Efeitos: desgaste (durabilidade) e revenda (`coisas`), conforto da cama e do sofá (`lar.confortoDaCasa`), nível da coisa (qualidade do cômodo). Sem marca (saves antigos, presentes): nada muda.
- Preço: ultraluxo 7,5× (produto comum) e 2,4× (produto de luxo) sobre a referência.
- Visual: `ilustracao/estiloDeMarca` muda o metal, o volume e o filete do desenho (na loja e na cena).

### §7 Exóticos
- Espécies novas (`dados/animais128`): cacatua, tucano-toco, jiboia, raposa-do-deserto, macaco-prego, sagui — vida, custo, semana, vínculo, sexo quando se distingue, jeitos, nomes, interação, cotidiano e causas de morte cedo; regras (lei por lugar, instalação, especialista, riscos, alimentação, convívio); instalações novas (gaiola grande de aço, recinto de primatas); doenças de primata; retratos próprios.
- Lei: primatas proibidos no Brasil (só como oferta ilegal) e com licença na Flórida, em Nevada e no Reino Unido; tucano e jiboia com licença no Brasil (criadouro autorizado); fenec proibido no Brasil, Califórnia, Nova York, Havaí, Austrália e Nova Zelândia.
- **Correção:** as ofertas ilegais têm a espécie que o texto nomeia; teste de ponta a ponta compra o "filhote de macaco-prego" e confere texto, biografia, espécie registrada.

### §8 Lojas
- Loja da casa: filtro **Cômodo** (só os que têm produto), **Segmento da marca** (5), desenho com o estilo da marca, linha do perfil da marca e o que ela muda de fato.

## D. Testes e validação

(preenchido na seção E)

## E. Resultados

(ver abaixo)

## F. Pendências e limitações

- A disposição desenha os objetos de frente (2.5D), inclusive os encostados nas paredes laterais; só objetos de parede vão para o plano da parede direita.
- Sem botão para mover um objeto dentro do cômodo (a disposição é automática; "levar para outro cômodo" continua).
- Não há variação de planta entre imóveis do mesmo tipo (o número de suítes é o do tipo).
- A importadora de vinhos usa a fachada do antiquário.
- Um produto por id de catálogo, qualquer que seja a marca (herdado da 12.4.1).
- Os pacotes `motor-dados` (797 kB) e `motor` (796,5 kB) seguem perto do limite; o conteúdo novo foi para `motor-casa` (35 kB) e `motor-patrimonio`.
