# REWORK 12.2 — Negócios vivos, luxo e mercados paralelos · relatório final

## 1. Resumo executivo

O REWORK 12.2 aprofunda o que o REWORK 12 abriu: cada uma das oito empresas passou a ter um **ramo** próprio — estado,
decisões e indicadores que entram nas contas —, o luxo ganhou as faixas que faltavam (até peças históricas únicas de
centenas de milhões), a aba **Patrimônio · Objetos** deixou de ficar vazia depois de uma compra (PAT-12.2-01), os
animais exóticos chegaram numa loja especializada que respeita a lei de cada país, e o Submundo ganhou mercados de
procedência duvidosa, negócios por fora próprios, empresa de fachada e organização própria — com consequências que
persistem.

Em uma linha cada:

- **Empresas vivas** (`sistemas/setores.ts`, `dados/setores.ts`): restaurante (conceito, cozinha, insumo, fornecedor, chef,
  pratos da casa, salão, atendimento, nota do público e prestígio), hotel (estrelas, público, serviços, atendimento,
  temporada, quartos e ocupação), clínica (especialidades, convênio × particular, equipamento, conformidade sanitária e
  inspeção), academia (modalidades, equipamentos, instrutores, programas de retenção), estúdio (serviços, equipamento,
  técnico de som, propostas e créditos), loja (segmento, estoque e encalhe, fornecedor, variedade, venda online,
  liquidação), museu (obras com nome, laudo e conservação, exposições temáticas, curador, segurança, patrocínio,
  empréstimos, linha cultural × comercial) e zoológico (cada animal com nome, idade, saúde e recinto; recintos por habitat
  com vagas; alimentação, veterinários, programa educativo; nascimentos, mortes, acidentes, lotação).
- **Gestão**: própria (teto de competência menor no negócio complexo e para quem toca várias), contratada e **delegada**
  (o gestor decide o dia a dia com o caixa da empresa); visão geral para quem tem várias empresas; o limite subiu de 4
  para 8 empresas em que a pessoa manda.
- **Lojas e fachadas**: relojoaria, joalheria, galeria, antiquário, memorabilia e casa de leilões com fachadas próprias
  (+ exóticos e os quatro mercados paralelos: 28 fachadas, todas diferentes); o balcão de acessórios da ótica deixou de
  se chamar "Relojoaria e joalheria".
- **Luxo**: 22 peças novas, seis faixas (premium acessível → histórica e única), atributos verificáveis em todas, venda
  privada sob consulta e leilão especial pelo patrimônio, registro de peças únicas na continuidade, serviços (avaliar,
  autenticar, restaurar, emprestar a museu) e propostas de colecionadores.
- **Inventário**: Objetos mostra o que se usa (roupas, óculos, relógios, joias), com usar e guardar; estado vazio que
  explica onde mora cada tipo de bem; "Ver no patrimônio" depois da compra.
- **Exóticos** (`sistemas/exoticos.ts`): 8 espécies, lei por país e estado, instalação obrigatória, custo mensal,
  veterinário de exóticos, cuidador pago, riscos (doença, fuga, acidente), mudança que não some com o bicho, entrega ao
  próprio zoológico.
- **Submundo** (`sistemas/clandestinos.ts`, `sistemas/paralelos.ts`): estágios, mercados paralelos com verdade escondida,
  seis tipos de negócio por fora, fachada, organização própria, memória que não esquece o grave.
- **Acontecimentos** (`conteudo/acontecimentos122.ts`): cinco novos, no catálogo do motor.

## 2. Auditoria inicial

Estado confirmado antes de começar: `main`, `origin/main` e `origin/claude/fix-pos-rework3-playtest` (produção) em
`4625dbc` (REWORK 12.05). Branch de trabalho criada a partir dele: `claude/rework12.2-negocios-luxo-mercados`.

Os oito tipos reais (`dados/empresas.ts`): restaurante, clínica, academia, estúdio, hotel, loja, museu, zoológico.

**O que já funcionava e foi preservado**: caixa separado da pessoa, distribuição só do lucro, crise/aval/falência,
avaliação, papéis (dono, sócio, investidor), gestão própria × contratada, museu com acervo e peças cedidas, zoológico
com fiscalização e conservação, coleção com raridade/procedência/leilão, seguro da coleção, as cinco especializações do
Submundo (REWORK 11.5) com contatos, fichas, organizações e memória, os pets como pessoas (não bens), os silvestres de
criadouro e a oferta ilegal na feira, a sucessão de menores (12.05).

**O que existia mas era superficial**: as empresas diferiam só em números (o "ramo" era um parâmetro); o museu era um
valor agregado de acervo, o zoológico um número de recintos e espécies; a relojoaria terminava em ~€ 148 mil; as lojas
de luxo usavam fachadas de outros lugares; a organização lembrava só os últimos 20 fatos (uma traição podia sair da lista).

**O que faltava ou estava errado**: PAT-12.2-01 (ver §6); nenhum exótico; nenhum mercado paralelo; nenhum negócio por
fora próprio; nenhuma fachada; restaurante de gestão própria rendendo quase garantido (o achado do REWORK 12).

## 3. Empresas e mecânicas implementadas

Cada decisão muda um estado que entra numa conta em `efeitosDoSetor` (procura, tíquete, custo variável, capacidade,
apoio, custos fixos próprios, alvo e teto da reputação, evasão) ou no ano do ramo (`anoDoSetor`). O padrão de cada ramo
é neutro em relação ao REWORK 12 (a empresa que ninguém mexe rende o que rendia); as decisões deslocam o resultado.

| Ramo | Recurso próprio | Decisões (exemplos) | Indicadores | Riscos próprios |
|---|---|---|---|---|
| Restaurante | nota do público (o que se entrega × o que se promete), prestígio lento | conceito (5), cozinha (10), insumo, fornecedor, chef, prato da casa, salão, atendimento, divulgação, faixa de preço | nota, prestígio, cozinha, chef, salão/atendimento, pratos | falta de insumo, crítica que viraliza, chef cobiçado, prestígio que cai rápido |
| Hotel | ocupação (preço × estrelas × o que se entrega × estação) | estrelas, público (5), 8 serviços, atendimento, estratégia de temporada, reforma dos quartos | ocupação, diária, quartos, serviços | luxo caro não lota; baixa temporada; quartos que envelhecem |
| Clínica | especialidades com equipamento e profissional | 7 especialidades, convênios × misto × particular, equipamento, conformidade | especialidades, equipamento, conformidade | inspeção: multa ou interdição |
| Academia | carteira e evasão | 7 modalidades (natação pede piscina), 3 programas de retenção, equipamentos, instrutores | alunos, evasão, equipamentos | evasão alta |
| Estúdio | créditos (quem gravou ali) | serviços (masterização e trilhas só com técnico de nível), equipamento, técnico, aceitar/recusar proposta com desconto | serviços, técnico, créditos | equipamento envelhece |
| Loja | encalhe | segmento (7, com margem própria), estoque, fornecedor, variedade, venda online, liquidação | segmento, estoque/encalhe | câmbio do importador, estoque parado |
| Museu | obras individuais com laudo | linha, exposição temática, comprar obra, laudo, restaurar, emprestar, receber empréstimo, curador, segurança, patrocínio, gala | obras, exposição, curador, segurança, patrocínio | falsificação exposta (escândalo), dano/furto com segurança baixa |
| Zoológico | animais individuais por recinto | construir/ampliar recintos (7 habitats), receber espécies (26), alimentação, veterinários, programa educativo, reformar recintos | animais/espécies, bem-estar, recintos lotados, cuidado | lotação, fiscalização, acidente com espécies perigosas, morte |

Regras de integridade animal: não há decisão de vender animal; a espécie só chega por transferência entre instituições,
programa de conservação (as ameaçadas) ou resgate, e só com recinto do habitat, vaga, licença, veterinários e bem-estar
mínimo. Lotar o recinto não traz público e derruba o bem-estar de cada animal (que vira saúde, morte, fiscalização e
reputação).

**Gestão própria × contratada × delegada.** Própria: sem salário de gestor, pede a semana, competência que cresce com os
anos até um teto — mais baixo no hotel (−12), zoológico (−14), clínica (−10), museu (−8), restaurante (−4) e −6 por
empresa a mais tocada pela pessoa. Contratada: salário, competência sorteada que só se revela com o tempo. Delegada (o
padrão da contratada): o gestor decide o dia a dia do ramo com o caixa da empresa (o bom renova o equipamento, regulariza
a clínica, sobe o insumo quando a nota cai; o fraco corta insumo, aceita animal sem lugar). A visão geral mostra todas as
empresas numa tabela com o que pede atenção.

## 4. Lojas e identidade visual

Fachadas novas em `ui/ilustracao/lugares.ts` (mesma linguagem vetorial): relojoaria (pedra escura, placa dourada, relógio
de rua, relógios em almofadas), joalheria (mármore, busto com colar, expositor de anéis), galeria (caixa branca, quadros
iluminados, escultura no pedestal), antiquário (madeira, relógio de pé, poltrona, gramofone, lustre), memorabilia (camisa
emoldurada, taça, bola, flâmula), casa de leilões (casarão de pedra, estandartes, tribuna e martelo), exóticos (terrário,
arara, aquário marinho), feira (barracas de lona), antiquário dos papéis vagos (vitrine empoeirada), negociação privada
(portaria de prédio, interfone), mercado por fora (galpão nos fundos, porta meio aberta). `Compras` deixou de emprestar
fachadas. A loja de peças tem filtros de preço, categoria e raridade.

## 5. Luxo e colecionismo

- Faixas (`PecaDeColecao.faixa`): 1 premium acessível (Tissot R$ 3,2 mil) · 2 luxo · 3 alto luxo (Lange, Royal Oak) · 4
  raras (Patek perpétuo R$ 3,4 mi, colar de alta joalheria, mestre modernista, manuscrito iluminado) · 5 excepcionais
  (Richard Mille de edição limitada, diamante rosa de 5 ct R$ 28 mi, mestre do pós-guerra R$ 32 mi, diário de
  expedição, taça de 1934) · 6 históricas e únicas (relógio de bolso de 1925 R$ 95 mi, tiara real R$ 110 mi, retrato
  florentino R$ 180 mi, paisagem impressionista R$ 420 mi ≈ € 70 mi). Os preços nas faixas altas se justificam por
  atributos que a tela mostra: fabricante/artista, período, material, estado, autenticidade, procedência, raridade,
  liquidez, valor estimado, preço pedido e histórico de donos.
- Canais: vitrine (a rara aparece em ~55% dos anos); **venda privada** sob consulta para quem tem o patrimônio que a casa
  pede; **leilão especial** com as únicas (uma ou duas por ano).
- Únicas: `Vida.pecasUnicas` (na raiz: atravessa a sucessão) — comprada, some; vendida, só volta depois de 8 anos e com o
  nome do dono anterior; a que sai por inventário ou apreensão volta ao mercado pelo registro.
- Serviços: avaliar (laudo por 3 anos, o perito às vezes desconfia), autenticar (a falsa vira cópia, a roubada é
  apreendida, a boa ganha certificado e valor), restaurar (o exagero tira o original em relógio e antiguidade), emprestar
  a um museu de fora. Propostas de colecionadores giram em torno do valor (às vezes abaixo).
- Valor na venda: o estado pesa, a liquidez decide o desconto de quem tem pressa, a peça sem papel vale como incógnita, o
  leilão não aceita peça duvidosa. Nenhum ciclo de comprar e revender na hora dá lucro (teste).

## 6. Correção do inventário (PAT-12.2-01)

**Causa (verificada no código)**: o que se compra em *Vida · Compras · Ótica, roupas e acessórios* (inclusive o balcão
então chamado "Relojoaria e joalheria": relógio, relógio de luxo, joias, óculos, roupas) é gravado em
`eu.estilo.itens` (`sistemas/estilo.comprarItem`), e a aba *Patrimônio · Objetos* só lia `financas.coisas`. A compra
era entregue e persistia — só não aparecia. O dinheiro nunca saiu sem o bem (teste: a diferença da conta é exatamente o
preço do item).

**Correção**: Objetos mostra o que se usa (com usar/guardar) antes das coisas da vida; o contador da aba soma os dois; a
tela vazia explica onde mora cada tipo (Objetos, Coleção, Garagem, Imóveis, Empresas) e aponta a Coleção quando há
peças; o balcão foi renomeado para "Relógios e joias de usar"; depois de comprar na ótica, numa loja de peças ou num
mercado paralelo, "Ver no patrimônio" leva à parte certa (`Lugar.verNoPatrimonio`, `Patrimonio.parte` controlável).

**Saves antigos**: os itens comprados antes já estavam no save, então aparecem sozinhos, sem migração, sem inventar
nada e sem cobrar de novo. As peças de coleção já apareciam em Coleção.

## 7. Animais exóticos

Arara-canindé, furão, ouriço-pigmeu, lagartixa-leopardo, dragão-barbudo, píton-real, acará-disco e peixe-palhaço (com
desenho próprio no retrato). A lei (simulada) por divisão → país → padrão: no Brasil, ouriço, répteis exóticos e píton
proibidos e furão e arara com licença; nos EUA, a Califórnia proíbe furão e ouriço; na Austrália, quase tudo proibido.
O proibido não vira produto: a loja diz o quê e por quê. Cada espécie pede uma instalação (terrário, terrário trancado,
gaiola ampla, viveiro só em casa, aquário plantado, aquário marinho) com custo mensal; a licença é paga e vira
documento. No ano: doença (mais sem veterinário de exóticos, sem instalação, sozinho numa viagem), fuga (o bicho fica na
história, sai da casa), acidente com visita. O cuidador pago tira o bicho da semana e cobre viagens. Na mudança, o bicho
vai com a instalação; se a lei do destino proíbe, fica com um criadouro autorizado — dito na biografia. Quem tem
zoológico pode entregar o animal (o mesmo nome, a mesma data de nascimento, a mesma história). O bicho que fugiu ou foi
para uma instituição não pode ser "trazido de volta".

## 8. Submundo e negócios clandestinos

- **Estágios** (`estagioDoSubmundo`): fora disso, primeiro contato, de vez em quando, gente do ramo, dono de negócio,
  dentro de uma organização, tentando sair — no topo do dossiê. Quem nunca entrou continua vendo só a entrada contextual.
- **Mercados paralelos**: a feira (para todos), o antiquário dos papéis vagos, a negociação privada (patrimônio ≥ R$ 2
  mi) e o mercado por fora (só com gente no caminho). Cada oferta tem verdade escondida e sinais (às vezes enganosos);
  investigar acerta ~82%; comprar o roubado sabendo é receptação; a peça roubada é procurada (apreensão sem reembolso; quem
  sabia pode responder a processo). Em média, comprar tudo e revender perde (teste com 12 vidas).
- **Negócios por fora**: comércio clandestino de mercadorias, rede de contrabando, intermediação de bens de procedência
  duvidosa, mercado clandestino de colecionáveis, operação de fraudes, organização criminosa — com capital, caixa,
  sócios (contatos com ficha), reputação, exposição (que soma à da pessoa e alimenta a investigação já existente), rival,
  ritmo, apreensão, sócio que trai, rival que cobra. O processo desmantela; quem sai do caminho perde o negócio para o
  sócio ou o rival; a história fica.
- **Fachada**: desconfiança que cresce, funcionário que sai, sócio que pede as contas, investigação que chega à empresa
  (multa, interdição ou perda), tensão com o cônjuge, abalo. Desligar esfria com os anos.
- **Organização própria**: nasce de um negócio forte e de duas pessoas de confiança; tenentes, coesão, disputa interna,
  traição, alianças e rompimentos; dissolver passa o comando adiante.
- **Memória**: `lembrarOrg` não descarta traição, promessa quebrada, conflito ou saída para abrir espaço ao miúdo; o
  dossiê mostra sempre o que é grave.
- **Animais por fora**: aparecem como situação, nunca como catálogo: recusar, denunciar e, para quem tem zoológico com
  recinto, acolher o resgatado (origem "resgate").

Nada descreve como se faz: gente, dinheiro, risco e consequência.

## 9. Compatibilidade de saves

Versão do save continua **20**; só campos opcionais (`Empresa.setor`, `Empresa.fachada`, `Financas.instalacoes`,
`Colecionavel.autenticidade/falsa/roubada/avaliada/emprestadaFora/unica`, `Vida.pecasUnicas`,
`Envolvimento.negocios/receptacao`, `RelacaoComOrganizacao.propria`, `InfoPet.cuidador/instalacao/fugiu/instituicao`).
`normalizarRework122` cria o ramo das empresas que já existiam (o zoológico começa com os recintos no estado que o
bem-estar antigo dizia; as obras herdam a conservação do acervo) — determinístico e idempotente (teste: carregar duas
vezes dá o mesmo JSON; nenhum animal com id repetido). Nenhum campo antigo é apagado; os números antigos do zoológico
passam a ser lidos do acervo. A sucessão de menores do 12.05 segue verde (`rework1205.test.ts`).

## 10. Resultados de testes

Ordem executada (sequencial, na cópia Linux `~/vida-copia`, Node 22):

1. **Testes direcionados** durante o trabalho (REWORK 12, 12.05, contabilidade, telas de patrimônio, Submundo, fachadas).
2. **Typecheck** (`tsc --noEmit`): limpo.
3. **Suíte completa** (`vitest run --maxWorkers=3`) no código final: **117 arquivos, 1.992 testes, todos verdes**.
   Numa rodada anterior (com uma simulação e o QA disputando a máquina) três testes de `fix31` e `fixPosPlaytestHumano`
   estouraram o limite de 20 s e um de `rework7` esperava a lista antiga de grupos de Compras; os três primeiros passam
   sozinhos (carga, já conhecida), o quarto foi atualizado (o grupo novo "Segunda mão, procedência incerta").
4. **Build** (`npm run build`): sem erro; todos os pacotes abaixo de 800 kB (motor-textos 782,8 kB · motor 750,4 ·
   Jogo 730,9 · motor-dados 597,4 · motor-carreira 446,4 · motor-patrimonio 111,5). O limite não foi aumentado.
5. **Smoke itch.io** (`build:itch` + `smoke:itch`): **21/21**.
6. **PWA offline** (`scripts/pwa/offline.mjs`): **36/36**.
7. **QA visual** (`scripts/playtest/rework122.mjs`, 13 cenas × 4 paletas × 1440/390/360/390×560): 4 achados, corrigidos e
   reverificados — o "." sobre o preço na feira (as ações passaram a uma linha própria), o preço que vazava do cartão a
   390 px (a grade de `.oferta` vencia a de `.oferta--estilo`), o texto da feira que comparava com o valor de revenda e
   parecia caro (agora mostra o preço de loja e o de revenda) e o save do Submundo cujo personagem largava o caminho no
   gerador (o mercado por fora sumia, corretamente). Rodada final das cenas afetadas: **0 problemas**.
8. **Simulações** (§11).

Testes novos: `src/motor/__tests__/rework122.test.ts` (35: os oito ramos, decisões com efeito, restaurante, hotel, museu,
zoológico, clínica, academia, estúdio, loja, gestão própria × delegada, não-garantia do restaurante, faixas de luxo,
venda privada, peça única sem duplicação, raridade na vitrine, serviços, propostas, nenhum ciclo de lucro, PAT-12.2-01 com
save e anos, lei dos exóticos, instalação/custo/cuidador, mudança para onde é proibido, pet para o zoológico, estágios,
negócio por fora com exposição e desmantelamento, fachada investigada, memória que não esquece traição, saída do
caminho, mercados visíveis, feira sem lucro em média, animal por fora sem compra, saves antigos idempotentes, contas sem
NaN) e `src/ui/__tests__/rework122.test.tsx` (9: Objetos, estado vazio, "Ver no patrimônio", painel do ramo e visão
geral, fachadas próprias e filtros, venda privada, exóticos proibidos, feira, dossiê). Ajustados: `rework8b` (28
fachadas, todas diferentes), `rework7` (o grupo novo em Compras), `navegacao` (o balcão renomeado).

## 11. Resultados de simulações

### 11.1 Empresas por tipo e estilo de gestão (`scripts/sim/negocios122.ts`, 24 vidas, 12 anos, São Paulo)

Múltiplo = (recebido + valor da parte no fim) ÷ investido. passivo = gestor delegado, dono ausente; cuida = delegado +
aporte na crise + reforma a cada 5 anos; próprio = gestão própria com decisões sensatas do ramo; descuida = gestão
própria sem decidir nada.

| Tipo | passivo: faliu / p50 | cuida: faliu / p10 · p50 · p90 | próprio: faliu / p10 · p50 · p90 | descuida: faliu / p50 |
|---|---|---|---|---|
| Restaurante | 25% / 0,13 | 13% / 0,00 · 1,24 · 4,74 | 13% / 0,00 · 0,92 · 7,35 | 4% / 0,93 |
| Clínica | 13% / 0,21 | 4% / 0,08 · 0,86 · 3,26 | 4% / 0,40 · 2,09 · 3,72 | 8% / 0,66 |
| Academia | 4% / 0,63 | 0% / 0,08 · 0,95 · 3,41 | 8% / 0,31 · 1,44 · 3,97 | 8% / 0,43 |
| Estúdio | 29% / 0,14 | 4% / 0,09 · 0,31 · 1,91 | 4% / 0,62 · 2,00 · 3,74 | 4% / 1,22 |
| Hotel | 4% / 0,15 | 8% / 0,16 · 0,38 · 1,86 | 8% / 0,56 · 1,35 · 2,26 | 0% / 0,32 |
| Loja | 0% / 0,15 | 0% / 0,04 · 1,37 · 5,13 | 0% / 0,03 · 3,45 · 5,00 | 4% / 2,59 |
| Museu | 46% / 0,16 | 0% / 0,21 · 0,35 · 1,25 | 8% / 0,20 · 0,61 · 1,29 | 17% / 0,25 |
| Zoológico | 17% / 0,45 | 13% / 0,14 · 0,83 · 2,53 | 8% / 0,22 · 1,11 · 1,80 | 17% / 0,51 |

Leitura: nenhum tipo tem lucro garantido (todo p10 do "próprio" fica abaixo de 1, exceto onde o capital é pequeno e o
dono-operador economiza o gestor); quem cuida ganha mais que quem larga; o restaurante tem cauda longa (p90 de 7×) e
p50 perto de 1 — **a gestão própria do restaurante deixou de ser estratégia garantida** (no REWORK 12, 900 mil viravam
4,3–7,8 milhões em 25 anos sem falências; agora a mediana do bom dono é ~0,9× em 12 anos, com 13% de falências e quem
acerte dez vezes). Museu e zoológico continuam negócios de mecenas. A delegação não é inútil: com o dono por perto, ela
fica na faixa de 0,3–1,4× de mediana. Duas versões foram descartadas na calibração (uma em que academia e estúdio davam
10–16× por um tíquete contado em dobro; outra em que o padrão de cada ramo já nascia no prejuízo).

### 11.2 Vidas longas por perfil (`scripts/sim/vidas122.ts`, 12–16 vidas, 30 anos)

| Perfil | Líquido 10 anos p10 · p50 · p90 | 20 anos p50 | 30 anos p10 · p50 · p90 | Observações |
|---|---|---|---|---|
| Baixa renda (Recife) | −10k · 14k · 29k | 72k | 55k · 109k · 2,2 mi | 0 anomalias |
| Classe média (financia a casa) | −34k · 22k · 69k | 63k | −32k · 133k · 2,7 mi | |
| Empresário iniciante (restaurante próprio, 900 mil) | −804k · 2,9 mi · 4,2 mi | 3,1 mi | 410k · 3,6 mi · 12,9 mi | 7 falências em 12 vidas |
| Empresário experiente (academia + loja, 2,5 mi) | 863k · 1,6 mi · 2,3 mi | 1,8 mi | 1,2 mi · 2,2 mi · 4,7 mi | 12 falências (várias empresas por vida) |
| Milionário (coleção + aplicações, 10 mi) | 13,1 · 13,6 · 14,0 mi | 19,4 mi | 25,2 · 26,1 · 27,6 mi | |
| Bilionário (únicas, venda privada, museu, 2 bi) | 2,61 · 2,68 · 2,74 bi | 3,72 bi | 5,02 · 5,29 · 5,44 bi | 0 únicas em dobro |
| Colecionador (30 mi) | 39,6 · 40,8 · 43,1 mi | 57,3 mi | 75,1 · 80,6 · 84,8 mi | autentica, restaura, aceita propostas |
| Dono de zoológico (60 mi) | 44,2 · 70,9 · 117,6 mi | 69,8 mi | 67,3 · 92,6 · 203,8 mi | 8 falências |
| Dono de museu (30 mi) | 26,7 · 30,4 · 35,3 mi | 38,8 mi | 51,7 · 54,4 · 59,7 mi | 11 falências |
| No Submundo (negócio por fora, 300 mil) | −118k · 72k · 251k | 83k | 13k · 282k · 3,0 mi | 15/16 com processo, 6 presos, 15 negócios desmantelados |
| Abandona no 5º ano | −75k · 30k · 307k | 21k | 1k · 305k · 3,6 mi | 8 processos, 3 presos |
| Honesto, mesmo capital | 0 · 183k · 450k | 379k | −2k · 381k · 4,0 mi | 0 processos |

Invariantes em todas as vidas: nenhum NaN, nenhum patrimônio absurdo, nenhuma despesa positiva no razão, nenhuma peça
única em dobro. **O crime não é matematicamente superior**: a mediana em 30 anos de quem fica no Submundo (282k) é menor
que a do honesto com o mesmo capital (381k), com processo em quase todas as vidas; abandonar cedo corta processos e
prisões pela metade. (Observação de método: na primeira rodada o simulador respondia às perguntas do ano com "recusar"
e o personagem largava o caminho em dois anos; a rodada válida faz o personagem do Submundo seguir nele.)

## 12. Pendências reais

- **Gestão própria de negócio de capital pequeno (loja, estúdio) rende bem para o dono-operador** (múltiplos de 2–3,5× em
  12 anos): o dono economiza o salário do gestor e paga com a própria semana. É plausível, mas a semana não tem preço em
  dinheiro no simulador; vale observar em playtest.
- **Hotel de gestão própria**: p10 0,56 — menos risco que os outros ramos para quem acerta temporada e serviços.
- **"Finalidade da aquisição" dos exóticos**: a loja particular vende só para companhia; criação e exposição ficam com o
  zoológico (instituição). Não há uma escolha explícita de finalidade na tela.
- **Viagem e exóticos**: o risco usa as viagens já registradas (`exp_viagem_*`); viagens de trabalho e temporadas longas
  fora de casa não entram.
- **Animais do zoológico de saves antigos**: ganham o acervo-padrão (14 espécies, ~37 animais), não um acervo derivado
  do antigo número "40 espécies"; o bem-estar e a conservação, sim, são preservados.
- **APK** não regenerado (como nos pacotes anteriores).
- O REWORK 12.1 e o sistema de contas **não** foram tocados (fora do escopo, como pedido).

## 13. Arquivos e commits principais

Novos: `src/motor/dados/setores.ts`, `src/motor/sistemas/setores.ts`, `src/motor/sistemas/exoticos.ts`,
`src/motor/sistemas/paralelos.ts`, `src/motor/sistemas/clandestinos.ts`, `src/motor/conteudo/acontecimentos122.ts`,
`src/ui/jogo/NegocioDoRamo.tsx`, `src/ui/jogo/material/LugaresDoLuxo.tsx`, testes `rework122.test.ts(x)`, simulações
`scripts/sim/negocios122.ts`, `scripts/sim/vidas122.ts`, QA `scripts/playtest/gerarRework122.ts`, `rework122.mjs`.
Alterados (principais): `tipos.ts`, `acoes.ts`, `ano.ts`, `save.ts`, `sistemas/empresas.ts`, `colecao.ts`, `submundo.ts`,
`processos.ts`, `pets.ts`, `dados/colecionaveis.ts`, `dados/animais.ts`, `dados/estilo.ts`, `ui/jogo/Patrimonio.tsx`,
`Compras.tsx`, `Submundo.tsx`, `Pessoas.tsx`, `material/Lugares.tsx`, `VidaConcreta.tsx`, `ilustracao/lugares.ts`,
`avatar/Retrato.tsx`, `patrimonio.css`, `movimento.css`, `novidades.ts`, `vite.config.ts` (os módulos novos nos pacotes
certos, sem aumentar o limite).

Commits na branch `claude/rework12.2-negocios-luxo-mercados` (a partir de `4625dbc`):
- `49230eb` — motor e telas (checkpoint)
- `eb0c9f3` — acontecimentos, ajustes de QA, simulações, relatório (este)

## 14. Estado de publicação

**Nada foi publicado.** Sem push, sem merge, sem deploy; `main` e `claude/fix-pos-rework3-playtest` continuam em `4625dbc`.
O pacote está inteiro, commitado só na branch local de desenvolvimento, aguardando autorização expressa.

## 15. Ajuste final do Submundo (rebalanceamento antes da publicação)

### 15.1 Causa do excesso de punições (auditoria)

As simulações de §11.2 mostravam quase todo envolvido processado. Com um simulador próprio de 15 perfis e as mesmas
sementes (`scripts/sim/submundo122.ts`), a linha de base confirmou que era **sistêmico, não da amostra**: **24 de 24 vidas
processadas em todos os perfis criminosos — inclusive o ocasional**, que faz um serviço pequeno a cada três anos, na moita
(31 investigações, só 7 arquivadas). As causas, no código:

1. **A exposição era uma catraca** (`ilicito.anoEnvolvido`): enquanto ativo, só subia — pelo menos 3 pontos por ano, de 14 a
   24 conforme a categoria, e cada operação somava de novo. Sem esfriar, toda carreira recorrente encostava em 100 e a
   descoberta virava certeza.
2. **Investigação ≈ processo** (`andamentoDaInvestigacao`): a chance de virar processo era ~85% da exposição **por ano**
   (até 80%), sorteada de novo todo ano sem prazo; arquivar pedia dois anos e exposição baixa.
3. **Depois de parar, o passado abria processo direto** ("uma investigação antiga chegou até você" chamava `abrirProcesso`),
   pulando a investigação.
4. **Contagem dupla do negócio por fora (REWORK 12.2)**: a exposição do negócio subia sem teto e somava, todo ano, à da
   pessoa, por cima do crescimento anual da categoria, que já representa aquela atividade.
5. **Sem meio-termo na sentença** (`tribunal.sentenciar`): contrabando, fraude e corrupção nunca eram "leves" — toda
   condenação era prisão, mesmo para primário sem violência; a pena-base do contrabando (5) passava do limite das penas
   alternativas, e a abertura do processo de contrabando já trazia 35% de prisão preventiva.

Não havia condenação automática anual por ter um negócio por fora (verificado), e os antecedentes já persistiam.

### 15.2 Alterações (pequenas, por mecanismo — nenhum multiplicador global)

- **Exposição com memória que esfria**: a cada ano, o rastro antigo sobra numa fração (`RASTRO.fica`) e o que se fez soma;
  o nível passa a ser proporcional à atividade (o ocasional se estabiliza baixo; o organizado fundo, alto). A descoberta
  só conta o que passa de um ruído de fundo (exposição − 15).
- **Rastro por especialização** (`RASTRO` em `ilicito.ts`): a rua esquece depressa (furtos 0,72), o contrabando médio
  (0,8), o organizado devagar (0,85), o digital e a fraude quase nada (0,9 e 0,92 — registro e papel); o **peso da prova**
  numa investigação vai de 0,85 (furto) a 1,3 (fraude); e "a prática ensina a não aparecer" vale inteira na rua e só 30%
  no digital e na fraude (o papel se acumula). Sem isso, o crime discreto virava o caminho seguro — a primeira rodada do
  ajuste mostrou a fraude dominando o honesto do mesmo salário em todos os percentis; corrigido.
- **Investigação pesa a prova e tem prazo**: vira processo com chance de exposição × 0,55 (0,3 se a pessoa esfriou) ×
  peso da prova + escala + reincidência, no máximo 60% ao ano; pode ser arquivada a partir do primeiro ano; com três anos
  sem o bastante, arquiva (a exposição cai pela metade).
- **Depois de parar**: o passado ainda pode chegar, como **investigação** (que pode ser arquivada), só enquanto a
  exposição não esfriou (> 20); os antecedentes ficam; nenhum risco novo nasce de atividade que não aconteceu.
- **Pena proporcional**: crime sem violência (fraude, contrabando, corrupção) de primário com pena até quatro anos →
  pena alternativa (serviço, multa) e a perda do que entrou; pena-base do contrabando 5 → 3; prisão preventiva no
  contrabando 35% → 10% (30% para reincidente) e no grupo 55% → 35% (55% para reincidente). O crime organizado e a
  reincidência continuam com prisão como regra.
- **Negócio por fora sem contagem dupla**: a exposição do negócio se estabiliza (o rastro esfria, o ritmo e a escala do ano
  somam) e só a parte acima de 20 soma à da pessoa; retirar dinheiro chama atenção na proporção do valor, até 10 pontos.

Arquivos: `sistemas/ilicito.ts`, `justica.ts`, `tribunal.ts`, `clandestinos.ts` (motor); nenhuma tela mudou.

### 15.3 Antes × depois (24 vidas por perfil, 30 anos, mesmas sementes, São Paulo)

Patrimônio líquido aos 30 anos (p10 / p50 / p90) e o que aconteceu na vida inteira (processos = julgados ou pendentes;
"presos" conta prisões por condenação).

| Perfil | Antes: 30a p50 | Antes: proc / presos | Depois: 30a p10 / p50 / p90 | Depois: invest. / arquiv. / proc. / absolv. / cond. sem prisão / presos | Depois: desfechos |
|---|---|---|---|---|---|
| Honesto (assistente) | 294k | 0 / 0 | 14k / 294k / 1,5 mi | 0 | todos nunca investigados |
| Honesto (analista, mesmo salário da fraude) | — | — | −6k / 93k / 876k | 0 | — |
| Honesto (R$ 1 mi aplicado) | — | — | 723k / 1,5 mi / 2,5 mi | 0 | — |
| Ocasional | 205k | 24 / 3 | −30k / 115k / 1,0 mi | 17 / 15 / 2 / 0 / 0 / 2 | 10 nunca investigados, 12 investigados sem processo |
| Recorrente (furtos) | 96k | 24 / 10 | 3k / 244k / 1,1 mi | 33 / 28 / 4 / 2 / 0 / 1 | 16 investigados sem processo |
| Especialista em furtos | 222k | 24 / 8 | 38k / 341k / 733k | 33 / 19 / 12 / 5 / 2 / 4 | os cinco desfechos aparecem |
| Contrabando | 141k | 24 / 11 | 26k / 321k / 1,5 mi | 31 / 17 / 11 / 5 / 5 / 1 | os cinco desfechos aparecem |
| Crime organizado | 176k | 24 / 15 | −24k / 129k / 828k | 40 / 16 / 23 / 7 / 0 / 16 | quase todos processados (escala e violência) |
| Digital | 257k | 24 / 10 | 10k / 121k / 1,5 mi | 41 / 18 / 23 / 10 / 6 / 5 | o rastro digital fica |
| Fraudes (com cargo) | 264k | 23 / 8 | −14k / 362k / 1,0 mi | 34 / 12 / 22 / 10 / 6 / 5 | bom nos primeiros anos, o papel cobra depois |
| Dono de negócio por fora (R$ 1 mi) | 1,9 mi* | 24 / 14 | 722k / 1,8 mi / 2,7 mi | 38 / 25 / 11 / 1 / 8 / 2 | 11 de 24 negócios fracassaram (antes: 24) |
| Integrante de organização | 99k | 24 / 13 | −37k / 157k / 1,3 mi | 50 / 29 / 20 / 8 / 0 / 12 | |
| Líder de organização (R$ 1 mi) | 731k* | 24 / 11 | 195k / 732k / 2,2 mi | 35 / 12 / 23 / 13 / 0 / 9 | 23 de 24 organizações desmanteladas |
| Abandona no 5º ano | 251k | 11 / 2 | 0 / 178k / 1,5 mi | 4 / 3 / 1 / 0 / 0 / 1 | 23 de 24 saídas limpas (sem processo novo) |
| Reincidente | 285k | 24 / 18 | 3k / 244k / 675k | 39 / 25 / 12 / 2 / 0 / 9 | prisão continua sendo a regra quando processado |

\* "antes" do dono e do líder vem de uma rodada com o mesmo capital de R$ 1 mi.

Leitura:
- O ocasional e o recorrente deixaram de ser processados quase sempre (de 24/24 para 2/24 e 4/24): são investigados, e a
  maioria das investigações é arquivada. O crime organizado, o integrante e o reincidente continuam com processo e prisão
  frequentes — a intensidade e a escala importam.
- Os desfechos se espalharam: nos perfis do meio (furtos, contrabando) aparecem os cinco (nunca investigado, investigado
  sem processo, absolvido, condenado sem prisão, preso).
- **O crime não é o melhor caminho garantido, e não há teto invisível**: na mediana, furtos e contrabando ficam um pouco
  acima do honesto assistente (341k e 321k contra 294k), com p10 parecido e o risco de prisão; digital, organizado,
  integrante e ocasional ficam abaixo; a fraude rende mais que o honesto com o mesmo salário na mediana (362k contra 93k
  — essa linha de base do analista saiu baixa nesta amostra e é ruidosa), mas tem o pior p10 e 22 de 24 processados; o
  dono do negócio por fora e o líder ficam abaixo de quem aplicou o mesmo R$ 1 mi (1,8 mi e 732k contra 1,5 mi na
  mediana; o dono tem cauda maior, o líder perde quase sempre a organização). Quem abandona cedo sai limpo em 23 de 24.
- Nenhuma anomalia (NaN, dinheiro duplicado, patrimônio absurdo) em 360 vidas.

### 15.4 Testes do ajuste

Novos em `rework122.test.ts` ("ajuste do Submundo"): exposição sem catraca (estabiliza no ocasional, alta no organizado);
investigação sem processo automático (parte vira processo, parte arquiva, nenhuma passa de três anos); processo sem
condenação automática e pena proporcional (contrabando primário: absolvição e alternativa > prisão; organizado e
reincidente: mais prisão); negócio por fora sem condenação anual e sem soma infinita (acelerar chama mais que a cautela);
saída do crime (a exposição esfria, o passado chega como investigação, os antecedentes ficam). Mantidos: memória que não
esquece traição, saves antigos idempotentes, contas sem NaN, nenhum ciclo de lucro. Ajustados por mudança intencional de
regra: `trajetorias.test.ts` (o contrabando frequente agora é investigado na maioria das vidas e processado em parte, não
"processado na maioria em oito anos") e um teste do negócio por fora em `rework122` (a exposição vem do ritmo, não da
existência).

Verificações finais (sequenciais, cópia Linux, Node 22): typecheck limpo; **suíte completa 117 arquivos, 1.997 testes, todos
verdes numa única execução**; build sem erro (todos os pacotes abaixo de 800 kB; maior: motor-textos 782,8 kB); smoke itch.io
21/21; PWA offline 36/36. Saves: só regra mudou — nenhum campo novo, nenhuma migração; os testes de save antigo do 12.2 e o
12.05 passam.
