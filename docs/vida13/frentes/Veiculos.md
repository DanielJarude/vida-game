# VIDA 13 · Frente 4: veículos (rework visual e garagem)

Status: **feito** no escopo da seção 3. Os limites estão no fim.

## O que mudou
- **Carros pelas medidas reais.** Arquivo novo `src/ui/ilustracao/carros13.ts` (só dados, chunk Compras). Cada um dos 121 carros do catálogo tem a sua ficha técnica em mm: comprimento, altura, entre-eixos, diâmetro da roda e balanço dianteiro (vão livre quando difere). Cada um tem também um **arquétipo**, que define a construção da carroceria. São 16: compacto, hatch, sedã, fastback, luxo, SUV, SUV-cupê, jipe, picape, GT, muscle, motor traseiro (911), motor central, besouro, clássico americano e roadster. Os ajustes por modelo cobrem farol, lanterna, para-choque, moldura, retrovisor, rodas, perfil baixo, faixa branca, grade, guelra, entrada lateral, saia, ponteiras, antena, anca, bojo do capô, costas abauladas, para-lamas soltos, sem teto, capota e os extras da 12.9.
- **Gerador reescrito** em `carros.ts` (`montarPerfil`, `perfilDoModelo`, `perfilDoCarro`, `carro`):
  - Escala de 25,5 mm por unidade no comprimento e 23,5 mm na altura.
  - O arco do para-lama fica centrado no eixo da roda, com folga (o rebaixado quase encosta no pneu).
  - Estufa com moldura preta ou cromada e colunas: a de trás é larga na base, como a do 911.
  - Corte das portas (2 ou 4), maçanetas e retrovisor.
  - Para-choque na cor da carroceria, de plástico preto ou cromado. Entrada de ar e difusor.
  - Sete tipos de farol (fino, redondo, alto, no para-lama, escamoteável, gota, quadrado) e seis de lanterna.
  - Vinco lateral e reflexo do ombro, presos à carroceria (não passam do bico baixo).
  - Linha superior em curva única nos antigos arredondados.
  - Teto de outra cor pinta também as colunas. Os para-lamas soltos e o estribo do Fusca e do 2CV.
- `veiculos129.ts`: removi `MODELOS_CARRO_129`, agora coberto por `carros13`. `extrasDoCarro` recebe o arco real da roda. A asa alta ficou limitada à altura do teto. Na moto, o visual ganhou baú, alforjes e escape preparado (o silenciador fica cor de titânio e aparece a ponteira).
- **Motos.** Arquivo novo `motos13.ts`:
  - `motoModerna`, para 22 nakeds, esportivas, trails e big trails. Desenha:
    - Quadro de treliça, viga de alumínio ou tubular. Motor mono, bi, três, quatro, V2, V4 ou boxer, com radiador.
    - Balança, monochoque com mola colorida, discos e pinças. Garfo invertido dourado ou convencional.
    - Tanque com abas, banco e rabeta conforme o tipo. Escape sob o motor, curto, lateral ou alto.
    - Farol redondo, anguloso, duplo ou em rasgo. Carenagem com bolha e asas, bico, para-brisa, protetor e malas.
  - `motoRetro`, para 10 motos atuais de linha clássica (CG, Factor, DK, CB125F, Hunter, Bonneville, Interceptor, Street Glide, Fat Boy, Scout). Usa o montador das clássicas da 12.9.1 e acrescenta roda de liga, roda fechada, carenagem asa de morcego e alforjes rígidos.
  - A ligação foi feita em `duasRodas.moto`.
- **Garagem** (`Garagem129.tsx` e `garagem129.css`):
  - A cena mostra até 8 veículos **na escala de verdade**: moto ×0,52 e bicicleta ×0,44 ao lado dos carros.
  - Cada vaga e cada desenho de cartão virou botão e abre **"De perto"**: uma Folha larga, com o desenho em até 720 px e a legenda (forma, ano, estado e peças feitas).
  - Filtro novo por **Tipo** (carros, motos, etc.), que aparece quando há mais de um tipo na garagem.
- **Personalização visível** (`motor/dados/veiculos129.ts`, chunk motor-casa). `VisualVeiculo` ganhou três campos: `suspensao`, `escape` e `bagageiro`. Agora aparecem no desenho:
  - suspensão rebaixada (a carroceria desce) e reforçada (sobe);
  - preparação do motor (ponteira esportiva);
  - escape esportivo e baú ou alforjes na moto.
  - `chaveDoVisual` inclui os três campos.

## Bugs, com a causa raiz (comprado = exibido)
1. **A forma variava conforme a tela.** Modelos sem perfil próprio (Huracán, Fusca, 911 Turbo, F-150, Camry e outros 27) recebiam uma variação calculada pela *semente*. A loja passa `o.id` como semente, o anúncio passa `o.versaoId` e a garagem passa `b.id`, então o mesmo carro saía com forma diferente na loja e na garagem. Correção: todo o catálogo tem perfil, e o desenho depende só de `versaoId`. A semente só vale para um veículo sem versão, e aí é a mesma (`b.id`) em todas as telas.
2. **O presente pedido pela criança** (`pedir_veiculo`, em `acoes.ts`) chegava sem `versaoId`, e a garagem desenhava outro modelo. Agora a versão do anúncio vai junto (edição de uma linha). Os saves antigos não foram renomeados: um veículo sem versão continua desenhado de forma consistente.

## Saves
Não há campo novo no save e não há normalizador: os três campos novos são derivados de `mods`, que já existe. O save continua na v20.

## Testes (resultados reais)
- `src/ui/__tests__/vida13Veiculos.test.tsx`: **12 de 12 passam**. Cobrem: todo carro e toda moto desenha com perfil e com as partes certas; lataria e motos distintas entre si; 911, Huracán e sedã com arquétipos e proporções diferentes; medidas; pintura, acabamento, rodas, suspensão, escape e baú mudando o desenho; loja = garagem em 16 ofertas de 4 lojas; saves sem versão ou com versão desconhecida; cena em escala; de perto; filtro por tipo.
  - O teste do presente é tolerante: se nenhum adulto disser sim nas sementes testadas, ele não verifica a regra.
- Testes antigos: rework8b, desenhos, fixPosRework3, visuaisIcones, vida129Veiculos e vida1291Motos dão **64 de 64** depois de um ajuste documentado. Em vida129Veiculos e vida1291Motos, a asserção "remap e escape esportivo não mudam o desenho" passou a ser `{ escape: true }`, porque agora essas peças aparecem (mudança pedida). Pneus e freios continuam sem efeito visual.
- `tsc`: nenhum erro nos meus arquivos. Os erros restantes são de outras frentes (empresas129, tatuagens13Pop).

## Auditoria visual
Em `/home/iego_ossi/vida-trabalho/a13/fotos/veiculos/`:
- `antes/`: galeria do catálogo inteiro antes da mudança;
- `depois/`: o mesmo catálogo depois;
- `zoom/`: modelos ampliados (911, Huracán, Fusca, Model 3, Bel Air, Eldorado, Countach, Range Rover, motos modernas);
- `pers/`: personalização e miniaturas de 72 px;
- `app/`: a garagem no app em claro e escuro, 1440 e 390 px, com cartões e "De perto".

O script de captura não encontrou rolagem horizontal nem erro de página, e o Esc fecha o "De perto". Scripts: `scripts/playtest/galeria13Veiculos.tsx` e `scripts/playtest/fotos13Veiculos.mjs`, este com a porta 4184.

## Pacotes
Build próprio em `a13/dist-veiculos`:
- Compras: 322,5 kB (eram 254; a minha parte é de cerca de +44 kB: carros13 26, motos13 16, gerador 14);
- Garagem129: 8,5 kB; Jogo: 629,7 kB;
- motor-casa: 281,7 kB; motor: 741,7 kB;
- **motor-dados: 799,0 kB.** Não coloquei nada lá: conferi que nenhum código meu está nesse pacote. A alta vem de outras frentes.

## Limitações
- A vista é sempre lateral (não há rotação nem 3/4). Scooters, motonetas, bicicletas, barcos e aviões não mudaram.
- A cena da casa (o veículo diante da fachada) não recebe `mods` e não mostra as peças. A garagem, os pertences, a oficina e a foto da memória mostram.
- Alguns modelos ficaram só aproximados: o Cullinan e o Urus estão pouco característicos, e o 280 SL tem a capota simplificada.
- O que pode passar por personagem — "um Huracán", "um 911" — vem da silhueta e das proporções. Não há logotipos.
- A faixa lateral do GTI vem dos dados da 12.9 e não foi revista.
