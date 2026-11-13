# VIDA 19 — Matriz de auditoria inicial (base `e719fbd`, main)

Leitura feita antes de qualquer alteração: relatórios VIDA 15, 16, 16.1, 17, 18 (`docs/VIDA18-…`, `docs/vida18/AUDITORIA.md`),
`docs/rework11/auditoria/A6-relacoes-redes.md`, `docs/rework11/fases/H-I-relacoes-redes.md` e o código atual da `main`.
Eras Históricas: fora do escopo (nada lido para alterar).

Classificação: **Implementado** · **Parcial** · **Ausente** · **Bug**.

## 1. NPCs autônomos

| Sistema / comportamento | Onde (código) | Evidência | Versão | Estado | Lacuna concreta |
|---|---|---|---|---|---|
| Trajetória própria de filhos/netos (escola, trabalho, amor, filhos, mudança, poupança) | `sistemas/filhos.ts` `processarDescendentes`, `trajetoria`, `amor`, `guardar` | parceria real (`criarPessoa`), gestação com parto, separação, `posses.dinheiro += renda×taxa` | REWORK 5–12.05 | Implementado | — |
| Carreira de parceria e amigos próximos | `social.envelhecerConhecidos` → `filhos.carreiraDeAdulto` | cargo + renda + texto mudam juntos | REWORK 9 | Implementado | — |
| Pais, avós, irmãos, tios, primos: aposentadoria, desemprego, recolocação, separação dos pais, irmão casa/separa | `familia.processarFamiliaDeOrigem`, `vidaDoIrmao` | parceria do irmão é Pessoa real | REWORK 3–9.7 | Implementado | — |
| Amigo casa / ex segue a vida / pai viúvo refaz a vida | `social.ts:404`, `mundoVivo.acontecerCom` | `p.parceiroId = 'fora'` — **parceria fictícia**, nunca termina, não tem nome, não morre, não aparece na rede | REWORK 5 | **Parcial** | parceria sem pessoa; sem separação, viuvez, reconciliação |
| Filhos de amigos | `mundoVivo.ts:190` | só contador `nFilhos` + linha na trajetória | REWORK 5 | **Parcial** | filho sem pessoa; pais não mudam rotina/gastos |
| Economia de NPC (renda, gasto, poupança, dívida, padrão de vida) | `sistemas/economiasNpc.ts` (26 linhas), `filhos.guardar` | só descendentes guardam; ninguém gasta, ninguém se endivida; amigo desempregado não perde nada | REWORK 12.05 | **Parcial** | sem despesas, dívida, aperto financeiro com estado, compra/venda de bens, efeito do desemprego e da doença no bolso |
| Objetivos e personalidade nas decisões de NPC | `Pessoa.temperamento` | usado em conversas e compatibilidade; decisões do NPC (abrir negócio, mudar, casar) são sorteios fixos (`r.chance(0.025)`) | — | **Ausente** | nenhuma meta; temperamento não pesa nas escolhas da própria vida |
| Mudança de cidade de NPC | `social.ts:410` (amigo 2%/ano), `mundoVivo` (parente 2%) | sempre para metrópole/capital, sem motivo | REWORK 5 | **Parcial** | sem motivo (emprego, família, custo), nunca volta |
| Saúde de NPC | `corpo.processarCorpoDePessoa` (condições para família e romance), `indiretos` | doença/diagnóstico persistentes | REWORK 9.6 | Implementado | amigos sem condições; doença não mexe em trabalho/renda de ninguém |
| Morte e luto em quem fica | `rede.repercutirMorte`, `luto.ts`, `indiretos` | luto na pessoa (`aperto: luto`), história lembra | REWORK 10 | Implementado | — |
| Relações entre NPCs (amizade, rivalidade, conflito, reconciliação) | `rede.lacoCom` (só parentesco/conjugalidade) | não existe laço social entre dois NPCs | — | **Ausente** | rede de terceiros |
| Níveis de relevância | `mundoVivo` (proximidade ≥ 30), `indiretos`, `processarDistantes` | três camadas existem implicitamente | REWORK 10.6 | Implementado | usar as mesmas camadas |
| Iniciativas de NPC (convidar, cobrar, pedir desculpa, reaparecer) | `v15/celular`, `v17/celular/mensagens17`, `iniciativas`, `sinaisSociais` | situações com motivo real; cota de 4/ano | VIDA 15–17 | Implementado | ler os acontecimentos novos (dívida, separação, cidade nova) como motivo |

## 2. VIDA Conectada (redes)

| Sistema / comportamento | Onde | Evidência | Versão | Estado | Lacuna |
|---|---|---|---|---|---|
| Contas, publicações do jogador, seguidores, alcance, viral, monetização, moderação | `sistemas/redes.ts`, `redesBase.ts`, `dados/redes.ts` | 7 plataformas | FIX pós-R4, R11 | Implementado | — (não recriar) |
| Feed de pessoas conhecidas | `v15/celular/celular15.feed15` + `Celular.tsx` aba Rede·Amigos | a trajetória dos últimos 24 meses vira cartão; só "curtir"/"abraço" | VIDA 15/17 | **Parcial** | sem formato (foto/vídeo/story), sem plataforma, sem alcance, sem comentários de outras pessoas, sem famosos, sem privacidade, sem consequência além do registro da curtida |
| Comentários / reações de NPCs | — | — | — | **Ausente** | |
| Perfil social navegável de NPC | `Pessoas.tsx` (ficha completa da relação) | a ficha existe; não há perfil "público" com publicações e conexões | — | **Parcial** | perfil com o que é público, conexões visíveis |
| DMs a partir de post | `v16/celular/mensagens16` (`escrever16`, intenções) | escrever só a partir do contato | VIDA 16 | **Parcial** | iniciar conversa a partir do post, com o assunto do post |
| Cota de 4 mensagens recebidas/ano | `sistemas/cotaDeMensagens.receber17` | todas as fontes passam | VIDA 17 | Implementado | preservar: curtidas/comentários NÃO entram |
| Consequências sociais (ciúme, conflito, reaproximação) | `redes.ecoDoPost`/`polemica` (posts do jogador) | só no post do jogador | FIX pós-R4 | **Parcial** | reagir ao post dos outros (ex, rival, parceria) |

## 3. Pendências VIDA 18

| Pendência | Onde | Evidência | Estado |
|---|---|---|---|
| Empresas agrícolas / agroindústria / laticínio | `dados/empresas.ts` (8 ramos pequenos + 10 grandes), `v18/rural` | nenhum ramo agro; a fazenda não fala com empresa | **Ausente** |
| Justiça/ambiente/política rural (divisa, multa ambiental, Plano Safra, subsídio) | `v18/rural`, `v14/justica`, `politica` | só crédito rural na compra e ITR | **Ausente** |
| Reprodução e genética de cavalos | `v18/rural/fazenda18` `CavaloDeCorrida18`, `acoes18.adicionarCavalosDeCorrida` | cavalos só entram por compra de lote | **Ausente** |
| Mega da Virada | `dados18/apostas/loterias18`, `v18/apostas/loterias18` | nenhuma ocorrência de "virada" | **Ausente** |
| Placar da rodada × tabela da liga | `v18/apostas/esportivas18.rodada` (14 clubes do catálogo sorteados, de qualquer divisão) × `ligas.tabelasDaTemporada` (`jogarTabela` gera linhas anônimas e põe os nomes pela ordem de chegada) | o mesmo confronto não existe na tabela; a rodada mistura divisões | **Bug** |

Nenhuma das cinco foi corrigida depois da VIDA 18 (a única entrega posterior foi Eras Históricas).

## 4. Profissões (auditoria)

Com pasta/sistema próprio (não reabrir): esporte, técnico, política, empresas, medicina, arte/música/palco/audiovisual,
militar, segurança/polícia, academia/pesquisa, direito, docência, tecnologia, engenharia, enfermagem, contabilidade,
jornalismo, psicologia, religião, produtor rural/pesca (VIDA 18). Tabela `sistemas/oficios.OFICIOS` cobre 10 trilhas.

Sem nenhuma mecânica própria além da progressão genérica (cargo, salário, clima, chefia, `noOficio` comum):
beleza (6 ocupações), alimentação/confeitaria (8), construção/elétrica/hidráulica/marcenaria (16), estrada/transporte/logística (10),
comércio/vendas (9), administrativo (9). Ver relatório final para a decisão.

## 5. Economia, interface e qualidade

| Item | Estado | Observação |
|---|---|---|
| Patrimônio ≠ dinheiro nas compras | Implementado | `dinheiro.vereditoDePagar` lê conta e crédito; prêmio grande entra uma vez (`apostas.registrar`) |
| Famosos/patrocínio respeitam liquidez | Implementado | `redes` cobra promover/comprar pela conta |
| Posição de rolagem e navegação | Implementado (VIDA 16.1/17) | conferir só as telas novas |
