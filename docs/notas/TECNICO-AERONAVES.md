# Técnico (modalidade e meio de temporada) e aeronaves (bimotor e jato)

Base: `fa80d10`. A versão do save continua 19. Os campos novos são opcionais e são validados em `save.ts` (`validar`, no bloco `versao >= 19`).

## 1. Vazamento de modalidade: auxiliar de basquete/vôlei virando técnico de futebol (P0)

### Caminhos encontrados

As linhas são as de `fa80d10`.

| # | Onde | O que acontecia |
| --- | --- | --- |
| 1 | `dados/ocupacoes.ts:378` | `auxiliar_tecnico` não tinha esporte. Na trilha `treino`, o único nível 5 era `tecnico_futebol`. |
| 2 | `sistemas/esporte.ts:1104` | O convite do fim de carreira (`pos_treinador`) mandava todo esporte (menos tênis) para `auxiliar_tecnico`. Abaixo dos 28 anos, mandava para `treinador_escolinha`, que é de futebol. A modalidade ficava só em `Oportunidade.dominio`, e o `Emprego` a perdia. |
| 3 | `conteudo/caminhos.ts:211` | A decisão `esp_fim_carreira` → "comissão técnica" contratava `auxiliar_tecnico`, qualquer que fosse o esporte. |
| 4 | `sistemas/trabalho.ts:731` (`degrausAcima`) + `:764-771` (`promover`) | A escada genérica (mesma trilha, nível + 1) promovia `auxiliar_tecnico` → `tecnico_futebol`. **Esta é a raiz.** |
| 5 | `sistemas/tecnico.ts:169` | Qualquer `tecnico_futebol` sem passagem abria a carreira de clube de futebol (`iniciarComando`). O vazamento virava carreira inteira: clubes reais, legado "Técnico de futebol". |
| 6 | `sistemas/trabalho.ts:663-665` (`passoDeClientela`) | Usava a mesma escada: `treinador_escolinha` (futebol) → `instrutor_lutas`. Só a habilidade de lutas barrava. |
| 7 | `sistemas/oportunidades.ts:159` | A proposta de "concorrente" pegava o nível + 1 da mesma trilha, sem olhar o esporte. Esse caminho estava latente. |

### Causa

A modalidade não era informação estrutural da ocupação. A escada de promoção só olha trilha e nível, e a trilha `treino` mistura todos os esportes.

### Correção

- **`Ocupacao.modalidade`** (`dados/ocupacoes.ts`) passa a ser a modalidade estrutural do cargo. Foi aplicada a:
  - `jogador_futebol`, `jogador_basquete`, `tenista`;
  - `treinador_escolinha` e `auxiliar_tecnico` → `tecnico_futebol` (futebol);
  - `professor_tenis` (tênis) e `instrutor_lutas` (lutas).
- **Comissão de cada esporte.** Basquete, vôlei, natação, atletismo e lutas ganharam `auxiliar_tecnico_<m>` (nível 4, a partir dos 25 anos) e `tecnico_<m>` (nível 5, 36 meses de experiência).
  - São emprego de clube ou equipe, pela escada genérica, sem o sistema de clubes reais do futebol. O empregador é "um clube" ou "uma equipe profissional".
  - Salários de referência: basquete e vôlei, auxiliar R$ 5.500 e técnico R$ 12.000; natação e atletismo, R$ 4.200 e R$ 8.500; lutas, R$ 3.800 e R$ 7.500.
  - `comissaoDe(m)` devolve o par. Tênis não tem comissão.
- **A escada preserva a modalidade.** `degrausAcima` exige `x.modalidade === oc.modalidade`. Isso fecha os caminhos 4, 5 (indiretamente) e 6. Em `oportunidades.ts`, a proposta passou a filtrar pela mesma modalidade (caminho 7).
- **O convite e a decisão de fim de carreira usam a comissão do próprio esporte** (caminhos 2 e 3):
  - o futebol abaixo dos 28 anos continua indo para a escolinha;
  - lutas abaixo da idade do auxiliar vai para as turmas (`instrutor_lutas`);
  - os outros esportes abaixo da idade não recebem convite.
- **Saves antigos.** Um `auxiliar_tecnico` cuja única carreira esportiva encerrada é de outro esporte volta para a comissão desse esporte (`repararComissaoAntiga`, em `trabalho.ts`, na passada anual).
  - A única porta para esse cargo era o fim da carreira de atleta, e a modalidade vem dela.
  - Quem já tinha virado `tecnico_futebol` vindo de outro esporte fica como está: a história já aconteceu. Quando a versão subir, isso pode virar uma migração formal.
- **Invariante:** `saltosDeModalidade(v)` (`trabalho.ts`) lista as trocas de modalidade dentro de um mesmo vínculo (postos + cargo atual).

## 2. Contratação no meio da temporada

- **A crise sai da tabela.** `ligaAteACrise` joga a liga do clube *sem você*, de 25% a 70% das rodadas, com o técnico que não deu certo (elenco −1,5).
  - O clube só demite se ficar bem abaixo do que o elenco prometia (posição ≥ max(esperada + 5, 13)) ou se cair na zona de rebaixamento (≥ 17º).
  - Num clube da Série B, isso acontece em cerca de 1 de cada 10 a 30 sorteios.
- **Quem recebe a proposta.** Só o técnico sem clube, em `semClube`, quando não chegou proposta comum. A chance é clamp(0,3 + reputação/200 − anos×0,05, 0,1; 0,5).
  - `propostaDeCrise` cria a proposta UMA vez, com `origem: 'crise'` e `meioDeTemporada` (a `TabelaEmCurso`: rodada, rodadas, posição, esperada, os 20 pontos e as 20 forças).
  - Vale só no momento (`validaAte = t + 1`). O contrato é de 24 meses: o resto da temporada e a seguinte.
  - Só clubes da divisão de acesso para cima (nível ≥ 2).
- **A decisão mostra a tabela do dia.** `tec_proposta` ganha o título "Um clube em crise" e mostra clube, rodada, posição, pontos, rodadas restantes e salário. Aceitar executa ESTA proposta (`assumir`).
  - A passagem guarda `meioDeTemporada` (o histórico) e `retomada` (a tabela, usada só na primeira temporada).
  - A diretoria começa com pressão 25: a lua de mel de quem chega para apagar o incêndio.
- **Temporada parcial.** `jogarTemporada` → `jogarLiga(…, ret)`:
  - não há estadual (já passou);
  - a liga continua dos pontos e das forças do dia, a partir da rodada seguinte;
  - `t.desdeRodada = rodada`;
  - só contam os jogos dirigidos, e J = V + E + D;
  - um título só vem se o time terminar em 1º com você no banco;
  - a cobrança mira o meio do caminho entre o esperado e a posição na chegada;
  - a reputação mede a recuperação desde a chegada;
  - acesso e rebaixamento seguem as regras do clube;
  - a demissão também pode acontecer na parcial, nos pontos de checagem que ainda faltam.
- **Tela.** Na tabela por clube aparece "· assumiu na Nª rodada, em Pº". A biografia registra "No meio da temporada: assumiu … em Pº lugar, depois de N rodadas …".
- **Save.** `TabelaEmCurso` (20 pontos e 20 forças finitos, 0 ≤ rodada < rodadas), `PassagemDeTecnico.meioDeTemporada/retomada` e `TemporadaDeTecnico.desdeRodada` são validados no bloco v19.

## 3. Aeronaves: bimotor e jato à venda

| Classe | Versões (preço, R$ de 2026) | Manter por mês | Seguro/hangar/inspeção | Quem pilota | Compra |
| --- | --- | --- | --- | --- | --- |
| `bimotor` (avião bimotor, 6 lugares) | Piper Seneca V 7,2 mi · Beechcraft Baron G58 9,6 mi | 26 mil (Baron, 30 mil) | 3,5% a.a. do valor | licença de piloto **+ habilitação de multimotor** (senão, piloto contratado a cada voo) | dinheiro ou financiamento, como os outros |
| `jato` (jato executivo, 6 lugares) | Embraer Phenom 100EV 25 mi · Cessna Citation M2 Gen2 33 mi | 65 mil (M2, 72 mil) + **tripulação: 70 mil** (dois pilotos, enquanto não está parado) | 2,5% a.a. | tripulação própria (o dono não pilota) | exige **patrimônio ≥ R$ 40 mi** |

Os preços partem de um câmbio de ~5,5 e estão comentados em `dados/bens.ts`.

- **Habilitação `multimotor`** (`sistemas/habilitacoes.ts`): custa R$ 45 mil, leva 4 meses e exige a licença de piloto antes. A chance de aprovação é de 0,7; quem reprova tenta de novo em 6 meses e paga R$ 7 mil. Ela é oferecida no aeroclube a quem já tem licença de piloto. A habilitação de tipo de jato ficou fora de propósito: o jato voa com tripulação.
- **Custos** (`custosDeVeiculo`): uma linha "tripulação (dois pilotos)" para o jato. Com o jato parado, a tripulação é dispensada.
- **Uso** (`usos.ts`):
  - o voo do jato diz "com a tripulação" e não cobra piloto avulso;
  - a viagem de avião custa max(8 mil, 40% do custo mensal).
- **Elegibilidade** (`acoes.ts`, `comprar_veiculo`): bloqueio de requisito abaixo do `patrimonioMin`, com o motivo dito. A vitrine "para você" também rebaixa o jato para quem não tem esse patrimônio.
- **Patrimônio e venda:** a depreciação é a mesma dos veículos raros (`depreciacao`), o valor entra no balanço, e a venda passa por `vender_bem`, sem mudança. A herança e a sucessão tratam o avião como qualquer bem.
- **Desenho:**
  - cada versão usa a forma da sua família (`forma: 'bimotor' | 'jato'`);
  - `formaDaVersao(undefined, 'bimotor' | 'jato')` agora devolve a família da classe (antes, sem versão, caía em `monomotor`);
  - artigos e concordância: "o avião bimotor", "o jato executivo", "Comprou o primeiro jato executivo: um Embraer Phenom 100EV" (`acoes.ts`, `veiculos.ts`);
  - a entrada do aeroclube em VidaConcreta lista bimotor e jato.

## 4. Testes

- `src/motor/__tests__/comissaoModalidade.test.ts` (novo, 5 testes):
  - catálogo: todo degrau preserva a modalidade, e auxiliar → técnico é do mesmo esporte;
  - o convite do fim de carreira é do próprio esporte;
  - **causal rápido:** 30 auxiliares × 6 esportes × 25 anos de escada, sem salto de modalidade, e mais de 5 por esporte chegam a técnico do próprio esporte;
  - **causal pelo motor:** basquete, vôlei e natação, 2 vidas cada, 22 anos de `avancarAno`: nunca `tecnico_futebol` nem `caminhos.tecnico`;
  - save antigo reparado.
  - Sem o filtro de modalidade em `degrausAcima`, 3 dos 5 falham. Isso inclui o salto escolinha → lutas.
- `src/motor/__tests__/tecnico.test.ts`: mais 4 testes em "contratação no meio da temporada":
  - a tabela da crise (soma de pontos coerente, posição da tabela, critério de crise);
  - a proposta mostrada é a executada, a parcial conta só os jogos dirigidos, sem estadual nem título estadual, e o save/reload no meio dá exatamente a mesma temporada;
  - 16 crises: J = V + E + D, jogos ≤ rodadas restantes (iguais quando não houve demissão), o ano seguinte inteiro com estadual;
  - save inválido é recusado.
- `src/motor/__tests__/aeronaves.test.ts` (novo, 4 testes):
  - catálogo e escada de preços, e o interior sem aeroclube;
  - bimotor: compra, custos, multimotor exige a licença de piloto, e o piloto contratado sai depois da habilitação;
  - jato: bloqueio por patrimônio, compra, tripulação na conta e fora dela quando parado, "com a tripulação";
  - depreciação, patrimônio, save e venda.
- `src/ui/__tests__/tecnico.test.tsx`: a passagem do meio da temporada mostra "assumiu na Nª rodada, em Pº".
- `src/ui/__tests__/visuaisIcones.test.tsx`: Seneca e Baron desenham bimotor; Phenom e M2 desenham jato (o mesmo traço da família); toda classe de aeronave tem versão; todas as 5 famílias são usadas.

### Resultados

- **Motor inteiro** (`src/motor/__tests__`): 867 testes, 865 passaram e 2 estouraram o timeout com a máquina carregada (`fix31`, `fix4`). Rodados de novo com timeout maior: 96/96 passaram.
- **UI:** com `--pool=threads`, o worker não subia; com `--pool=vmThreads --maxWorkers=1`, passaram `tecnico`, `visuaisIcones`, `fixPosRework3`, `material`, `desenhos`, `trajetorias` e `generalizacao`. Com `vmThreads`, a suíte de UI inteira passou: 20 arquivos, 120/120 testes.
- **Typecheck:** `npx tsc --noEmit` limpo.
- **Build:** `npm run build` sem aviso de tamanho; `motor-conteudo` foi a 788,6 kB (era ~787; o limite é 800).

## 5. Simulação (`scripts/sim/tecnico.ts`, 40 vidas, comando aos 36, 25 anos)

O "antes" é o mesmo script rodado sobre o código de `fa80d10`.

| | antes | depois |
| --- | --- | --- |
| Temporadas com J ≠ V + E + D | 0 | 0 |
| Ex-jogador: anos no banco · clubes (mediana) · jogos (média) · aproveitamento | 20 · 4 · 797 · 53% | 21 · 4 · 811 · 56% |
| Ex-jogador: títulos (média) · demissões | 8,0 · 0,9 | 7,4 · 1,3 |
| Sem passado de jogador: anos no banco · clubes · jogos · aproveitamento | 11 · 2 · 367 · 45% | 21 · 4 · 509 · 50% |
| Sem passado de jogador: % com título | 50% | 72% |
| Contratações no meio da temporada | 0 (não existia) | 15 passagens de 167, em 13 de 37 carreiras |
| Parciais fora da conta | — | 0 |

**As contratações no meio da temporada:**

- assumiu na 17ª posição em média (p10 15º, p90 19º), na 10ª rodada em média;
- 10,9 jogos dirigidos em média na parcial;
- o time terminou em 13º em média;
- nenhum título na parcial, 2 rebaixados, 1 demitido na própria parcial.

O técnico sem passado de jogador fica mais tempo no banco porque o clube em crise é a porta de quem não tem nome.

**Comissão por modalidade** (6 ex-atletas por esporte, 22 anos pelo motor):

| esporte | antes: chegaram a técnico de futebol · carreira de clube de futebol | depois: técnico do próprio esporte · técnico de futebol |
| --- | --- | --- |
| basquete | 4 · 4 | 4 (`tecnico_basquete`) · 0 |
| vôlei | 5 · 5 | 5 (`tecnico_volei`) · 0 |
| natação | 3 · 3 | 3 (`tecnico_natacao`) · 0 |
| atletismo | 5 · 5 | 5 (`tecnico_atletismo`) · 0 |
| lutas | 5 · 5 | 5 (`tecnico_lutas`) · 0 |

## 6. Pendências

- O técnico de basquete, vôlei e dos outros esportes é emprego genérico: não tem clubes reais, temporada jogo a jogo nem legado próprio. Se a comissão desses esportes ganhar tela, o modelo é `sistemas/tecnico.ts` com o perfil da modalidade (`perfisEsportivos`).
- O reparo de save antigo é heurístico (pela última carreira esportiva encerrada) e não desfaz quem já virou `tecnico_futebol` vindo de outro esporte. Com a próxima versão do save, pode virar migração formal.
- A contratação no meio da temporada só existe para quem está sem clube e só na liga (nível ≥ 2). O técnico empregado não recebe proposta no meio do ano, e o estadual não tem troca de técnico.
- A seleção continua rara: 0 em 37 carreiras.
- Aeronaves:
  - não há habilitação de tipo para o jato (sempre com tripulação);
  - não há fretamento ou táxi aéreo como renda;
  - a depreciação é a genérica dos veículos (aviões costumam perder valor mais devagar);
  - a tripulação não entra na cidade de custo.
- `motor-conteudo` está a 788,6 kB do limite de 800. A divisão da camada de conteúdo continua pendente.
