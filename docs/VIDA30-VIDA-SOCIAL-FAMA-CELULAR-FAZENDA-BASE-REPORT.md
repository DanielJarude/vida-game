# VIDA 30 — vida social, experiências de vida, fama em pessoa, celular, fazenda, base, propostas, pós-carreira e clube

Branch `claude/vida30-vida-social-fama-celular` (a partir de `b7f90fd`, a VIDA 29.2 publicada). Um agente só, trabalho
sequencial, sem subagentes. O "Manual Mestre de Diretrizes" não está no repositório nem foi anexado (como nas VIDA 21–29):
segui as regras do próprio prompt e as do projeto (memórias de ambiente, a regra do limite de 800 kB por pacote, a regra
de funções declaradas nos pacotes em ciclo). Dois pedidos chegaram durante o trabalho e entraram no escopo: **carreiras
pós-esporte mais profundas** e **a tela do dono de clube, que era quase só texto**.

## 1. Resumo

- **Propostas profissionais (§8)**: a proposta diz quem contrata (organização da cidade ou clube), o cargo e o salário;
  convite para entrevista ≠ proposta formal; o "Aceitar" não trava sem motivo; o vínculo nasce com quem propôs. Causa
  do caso relatado achada e corrigida (§6).
- **Base (§7)**: remuneração em partes (bolsa, ajuda de custo, benefícios, contrato de formação aos 16 — nunca salário) e
  mercado da base (convite ou avaliação de outro clube, registro transferido, histórico, antes dos 14 só na cidade).
- **Fazenda (§6)**: rebalanceamento medido em simulação (5 perfis × 3 gestões × 3 cenários × 8 sementes × 10 anos) e a
  Visão geral reorganizada em problemas com saídas, custo, consequência e urgência.
- **Celular (§2)**: memória do que já foi dito, trabalho e propostas no ambiente de cada profissão, situações novas com
  continuidade (o par preocupado, a família que comenta uma decisão, a turma de estudo), reencontros com contexto.
- **Fama (§3)**: o meio (figuras públicas com identidade, jeito, laços entre si e vida própria), o reconhecimento em pessoa
  proporcional ao nome, a proposta, o fotógrafo, o evento em que se conhece uma figura (que vira Pessoa da vida), o
  convite do celular que vira cena, a privacidade; painel "O meio" na Fama.
- **Experiências de vida e reações (§4–§5)**: 30 cenas novas da infância à velhice e das relações (conhecer a família do
  par, apresentar o par à sua família, conquista com parabéns e inveja, o amigo que percebe a mudança...).
- **Pós-carreira (pedido extra)**: cada porta da VIDA 26 virou um ofício com jogo próprio (mídia, formação, comissão,
  gestão), com cenas e painel.
- **Dono de clube (pedido extra)**: a tela virou painel visual.

(Ver os itens 2–15 abaixo.)

## 2. Auditoria dos sistemas existentes (antes de mexer)

| Frente | Classificação | Evidência |
|---|---|---|
| Propostas profissionais | **Defeituoso** | `oportunidades.ts` (proposta de concorrente sem contratante, texto do headhunter), `trabalho.elegibilidade` (lia a proposta como currículo), `mercados.mercadoDe` (técnico no mercado "emprego") |
| Base: bolsa | **Parcial** (VIDA 28) | `esporte.bolsaDaBase`: um valor só, sem ajuda de custo, benefícios nem vínculo |
| Base: transferências | **Ausente** | só existia dispensa → peneira noutro clube |
| Fazenda | **Implementado, punitivo** | sim `scripts/sim/fazenda30.ts` (tabela no item 10) |
| Fazenda: explicações | **Implementado, mal apresentado** | quatro parágrafos por indicador (VIDA 29) |
| Celular | **Implementado, repetitivo e incoerente** | sim `scripts/sim/celular30.ts`: 26,4% das mensagens repetiam um texto já recebido na mesma vida; 54 mensagens "de escritório" a quem não trabalha em escritório (soldado, pintor, manicure, personal) |
| Celular: aplicativos | **Implementado e funcional** | Mensagens, Namoro, Redes, Notícias, Agenda, Mapas, Banco, E-mail, Fama: cada um é porta para um sistema real; nenhum aplicativo novo foi criado (regra do prompt) |
| Fama: reconhecimento | **Parcial** | só o encontro da VIDA 27 (`enc27_fa`) e uma linha em "Na imprensa e nas ruas" (VIDA 22) |
| Fama: pessoas famosas | **Parcial** | "moldes" sorteados na hora (área aleatória, "adorei o seu trabalho"); vida própria só depois de conhecidos (VIDA 19); nenhuma rede entre elas |
| Experiências por fase | **Parcial** | `scripts/sim/catalogo30.ts`: 49 conteúdos até 5 anos, 83 até 11; a vida adulta e a velhice dominadas por trabalho/dinheiro (a velhice com 4 conteúdos próprios) |
| Família do par | **Ausente** | o parentesco `sogro` existia, mas nada o criava |
| Reações dos NPCs | **Parcial** | memória, iniciativas e dimensões (VIDA 28) existem; poucas cenas concretas de reação |
| Pós-carreira | **Implementado, raso** | VIDA 26: as portas viravam empregos comuns |
| Tela do dono de clube | **Implementada, só texto** | `Clube20.tsx` |

## 3. Funcionalidades preservadas

Tudo o que o prompt lista no §10 (VIDA 25/26/28/29, Eras v4) ficou como estava, com estas exceções **localizadas e
intencionais**: a bolsa da base continua com a mesma conta e ganhou partes ao lado; a simulação rural mantém o motor da
VIDA 18/19/29 com os ajustes do item 7; a Visão geral do campo mantém os quadros da VIDA 29 (a explicação longa foi para o
modo detalhado). O save continua na versão 20 (só campos opcionais).

## 4. Novas funcionalidades (cada uma com teste)

(Ver tabela de arquivos no item 9.)

## 5. Problemas encontrados · 6. Causas-raiz · 7. Correções

**O técnico com a proposta travada (o caso relatado).**
- *Causa 1*: `mercados.mercadoDe` classificava `tecnico_futebol` (contrato CLT, sem marca de mercado próprio) como
  "emprego" — e o gerador da "proposta de concorrente" (`oportunidades.processarOportunidades`) mandava a ele o recado
  genérico do headhunter, sem empregador.
- *Causa 2*: `trabalho.elegibilidade` bloqueava toda ocupação de entrada "por oportunidade" quando a via não era
  "oportunidade" — a proposta era lida como currículo, e o "Aceitar" ficava desabilitado com "Não se entra por currículo".
- *Causa 3*: a entrevista vinda de uma proposta para a mesma função falhava em "você já trabalha nisso".
- *Correção*: a proposta nasce com contratante (organização do mercado da cidade, que não é a sua; na comissão técnica,
  um clube com nome), cargo e salário; o headhunter traz **convite para entrevista**, as outras vozes **proposta formal**
  (aceitar é assinar); `elegibilidade` aceita a via "proposta"; a entrevista da proposta usa a via certa; o vínculo nasce
  com a organização/clube que propôs (`AjusteDeEmprego.orgId/clube`); o técnico principal não recebe o recado genérico
  (o mercado próprio dele, com clube, já existia na carreira de técnico) e o recado antigo de um save sai das portas.

**Celular**: repetição — cada situação sorteava de 1 a 4 frases sem memória; incoerência — um só ambiente de trabalho.
Correção: memória curta do que foi dito (`celular15.ditos30`, até 240 chaves), escolha da fala não dita (cai para outro
tom antes de repetir), catálogo de ambientes por profissão (`dados17/celular/ambientes30.ts`: 13 ambientes × 3 situações
+ propostas por ambiente), reencontros com o ofício, a cidade e os anos sem se ver.

**Fazenda**: o prejuízo do ano caía no cartão a 4,5% ao mês; a chácara pagava o caseiro inteiro (R$ 32 mil) e fechava no
vermelho sempre; o gerente saltava de R$ 78 mil para R$ 140 mil aos 301 ha; o solo cansado tirava 20% da produção; o ano
de clima ruim pagava o custo de uma safra cheia; a horta acumulava "monocultura"; "manter" segurava o gado em excesso e o
solo afundava em espiral (79 → 27 em dez anos); o ITR usava o valor de mercado inteiro. Correções no item 7 da tabela de
balanceamento.

## 8. Integrações

- Proposta → contratação → vínculo com a organização/clube; interino da comissão (pós-carreira) → proposta com o clube →
  carreira de técnico no mesmo clube.
- Base → ano de formação (o clube do ano é o do registro) → contrato profissional pelo clube novo; ficha da formação.
- Fama → celular (o convite de evento vira cena presencial; a pessoa famosa da mensagem é uma figura do meio) → vínculo
  e memória de sempre → iniciativas/mensagens dela depois; privacidade → estresse e o par que não escolheu a exposição;
  notícias do meio na Fama.
- Celular → família que comenta decisões lidas da biografia; o par preocupado lido do estresse/da saúde; fios de
  continuidade (mágoa, promessa) da VIDA 17.
- Cenas de vida → memórias com peso, personalidade pela escolha (`comportamento`), vínculos; o álbum lê a biografia da
  infância.
- Fazenda → crédito de custeio na conta de sempre; os problemas abrem as ações que já existiam.

## 9–10. Testes executados e resultados

(Preenchido no fechamento.)

## 11. Compatibilidade com saves antigos

Campos novos, todos opcionais: `Oportunidade.empregador/orgId/salario/formal`, `AjusteDeEmprego.orgId/clube/clubeCidade`,
`ProcessoSeletivo.ajuste`, `CarreiraEsportiva.base30`, `AnoDeFormacao.ajuda/vinculo`, `Celular15.ditos30`,
`Vida.fama30`, `Vida.oficio30`, `Pessoa.familia30`. Sem eles, o comportamento é o de antes (o meio nasce quando o nome
circula; o ofício, no primeiro ano do emprego; a memória do celular, vazia). Testado com fixtures antigos (v11, v12, v13)
e um save da VIDA 29 (rural), vividos três anos e salvos/reabertos.

## 12. Pendências reais

(Preenchido no fechamento.)

## 13–15. Commit final, deploy, URL

(Preenchido no fechamento.)
