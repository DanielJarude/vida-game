# REWORK 11 · Fase F — Eventos e memória

Base: `b885ccc` (Fase A + checkpoint da Fase G). Branch: `worktree-agent-aff93cfe0d3dacf01`. Save continua v20; só campos opcionais.
Sims recriadas (as de aud4 se perderam com o /tmp): `~/vida-trabalho/aud4/{momentosCarreira,infancia,sonho}.ts` (rodar copiando para `scripts/sim/` de uma cópia; resultados em `aud4/*-antes.txt` / `*-depois.txt`, "antes" = cópia limpa de `b885ccc`).

## 1. CAR-11.9 — Momentos da carreira

### O que mudou
- `sistemas/situacoes.ts`
  - `processarSituacoes`: o ano ocupado (renovação/proposta de atleta, proposta ao técnico) **sorteia a cena com `rngDe(v.id,'situacao_ocupada',v.t)` e a guarda com `_ocupado`**; `situacaoAberta` não a abre nesse ano; no ano seguinte ela volta como `_adiada` (pode esperar mais um ano ocupado, no máximo dois). Política (crise/eleição) segue como era.
  - `chanceDeMomento`: para trajetórias de atleta, o ano logo depois de um momento pesa 0,6 (era 0,35).
  - `DECISOES_DE_CONTRATO` + `registrarDecisaoDeCarreira`: renovar, aceitar proposta, doping, mercado, proposta de técnico entram nos momentos da carreira (chamado por `conteudo/motor.resolverDecisao`); não contam no silêncio nem na recarga das cenas.
  - `registrarMomento`: teto **por carreira** (40 por trajetória, 160 no todo; era 60 no todo — a carreira antiga sumia).
  - `momentosPorCarreira(v)`: grupos por trajetória (a atual primeiro), itens `tipo: 'decisao' | 'consequencia' | 'marco'`. Marcos automáticos lidos do estado: 1ª temporada, transferências, palmarés (títulos, acessos, quedas, prêmios, seleção, finais), passagens/títulos/acessos de técnico.
  - `ModeloSituacao.natureza?: 'consequencia'`.
- `sistemas/situacoesMemoria.ts` (novo, chunk `motor`): cenas que **reconhecem o passado com dados reais** — `fut11_ex_clube` (ex-clube na mesma divisão: temporadas, gols, se saiu vendido), `fut11_titulo` (título da temporada no palmarés), `fut11_atrito_volta` (atrito registrado — vestiário/imprensa/torcida/posição/capitania — no MESMO clube, 1–6 anos antes), `esp11_dispensado` (a dispensa da base superada), `esp11_homenagem` (≥ 6 temporadas no clube), `esp11_selecao_volta` (convocação recente), `tec11_casa_antiga` (técnico no clube onde jogou), `tec11_reencontro` (o clube que o demitiu); cópias para basquete/atleta onde cabe. Ajudantes recebidos por parâmetro (sem ciclo de inicialização).
- `ui/jogo/Trabalho.tsx` `MomentosDaCarreira`: por carreira, 12 por carreira + "Ver os N momentos", rótulo "marco ·" / "consequência ·".
- `sistemas/legado.ts` `blocoDeMomentos`: Caminhos mostra **todos os desfechos** (até 14, "marcou"/"custou caro", "E mais N de antes"); bloco novo em Atuação (`cena_*`) e em Música/Dança (`mus_*`/`dan_*`).

### Números (sim `momentosCarreira.ts`, 40 vidas, futebol profissional dos 18 por 22 anos)
| | antes | depois |
| --- | --- | --- |
| temporadas/vida (ruído entre amostras: ±1,5) | 11,85 | 11,05 |
| cenas de situação registradas | 3,50 (0,30/temporada) | 3,52 (0,32/temporada) |
| decisões de contrato registradas | 0 | 4,50 |
| visíveis na aba Trabalho (só do futebol) | 3,50 | **13,82** (1,25/temporada; marcos 5,80) |
| Caminhos "Momentos" | 1,27 | **7,97** |
| vidas com ≤ 2 momentos do futebol | 15/40 | 8/40 |
| cenas que lembram (fut11/esp11) por vida | 0 | 0,33 (+ homenagem 0,3) |

Achado honesto: **adiar não aumentou o número de cenas** (0,30 → 0,32/temporada). O teto real é UMA decisão por ano para a vida inteira (`faseDeConteudo`) e a cena adiada ocupa o ano seguinte. O que levou a carreira a ~1,25 acontecimento visível por temporada foi registrar as decisões de contrato e os marcos que o motor já simulava. Teste com 20 temporadas: ≥ 15 itens visíveis (passa).

## 2. EVT-11.1 — Variedade e memória entre vidas
- `ui/useVida.recomecar`: vida não morta com ≥ 3 anos → `registrarVidaRecomecada(vistosDaVida(vida))` (nova, `save.ts`; exportada pela fachada). Só memória: não conta vida jogada nem recordes.
- `save.ts`: `Estatisticas.recomecadas?` (até 2; a mais antiga sai quando uma vida termina); `memoriaDasUltimasVidas` = 2 recomeçadas + 2 últimas vidas (até 300); `vistosDaVida` põe a **infância (≤ 12 anos) primeiro e nunca a corta**, o resto do mais recente para trás, teto `LIMITE_VISTOS = 200` (leitura também 200; era `slice(-120)` que cortava a infância). `criacao`: `memoriaDeVidas` até 300.
- `conteudo/motor.peso`: o que as vidas anteriores viram pesa 0,3 na infância (0,45 no resto).
- `conteudo/acontecimentosinfancia.ts` (novo, chunk `motor-acontecimentos`): 10 cenas — avó/avô doente, a casa sem emprego, a escola da cidade nova, a tarde com a turma do irmão mais velho, o primeiro campeonato (do esporte que a criança pratica), o dente, a coleção, a redação lida em voz alta (só quem vai bem), a noite sem luz, o bicho doente. Papéis `fixo`, `quando` sem sorteio, variantes por `rngDe`; nada presume país. "A primeira palavra" e "O passarinho" continuam.

Números (sim `infancia.ts`, 50 vidas até 13; séries de 20 recomeços aos 8):
| | antes | depois |
| --- | --- | --- |
| ids distintos ≤ 12 anos | 61 | 69 |
| Jaccard entre vidas (sem garantidos) | 0,231 (0,128) | 0,221 (0,117) |
| infância da vida abandonada que reaparece após recomeçar | 21% (recomeço não gravava nada) | **12%** |
| "O passarinho" | 10/50 | 6/50 |

## 3. EVT-11.7 — Memória coerente (`sistemas/premissas.ts`, novo)
- `destinoDoSonho(v, d, t)` → `'abandonado'|'retomado'|'realizado'|'transformado'` lendo, depois de `t`: temporadas de todas as carreiras esportivas, palmarés, marcas (profissional/conquista/fim de carreira, retomada/ingresso), empregos do domínio (ensino/treino/técnico = transformado), carreira de técnico, obras, rotinas. `viradaDoSonho`, `passadoProfissional`, `premissaVale(v, {sonho|eco_recusou|eco_curso})`.
- `conteudo/biografia.ts`: `sonhoParaTras` traz o destino; título/texto/opções por variante ("O dia em que disseram que não" — "vieram 20 temporadas no profissional — disputou a Copa…"; "O sonho que mudou de forma"; "O sonho que voltou"); só o abandonado recebe "O sonho que ficou para trás"; "voltar a jogar" não diz "desistir do sonho" a quem venceu; "voltar" indisponível se a rotina já existe. `bio_retomar`: ex-profissional ouve "Você foi profissional: N temporadas — …" (não "era dos bons por aí").
- Ecos: `tipos.ts` eco ganha `empregador?`/`cursoId?` (opcionais); `acontecimentos10` grava o empregador nas 4 recusas e o curso largado; `eco10_recusou` só no mesmo empregador e sem promoção depois (ecos antigos sem empregador: só se o emprego atual já existia na recusa); `eco10_mudou_de_curso` só se há curso novo (em andamento ou concluído, diferente do largado) e nenhuma nova troca.
- Sim `sonho.ts` antes: dispensado aos 14 → 20 temporadas + Copa **abria "O sonho que ficou para trás… você ainda sabe como é jogar bola"**; eco com empregador trocado **abria**. Depois: variante "O dia em que disseram que não" com a virada; o só-dispensado mantém o texto antigo; eco trocado não abre.

## 4. NPC-11.1 / NPC-11.2
- `sistemas/social.ts`: `colegaDeEquipe(v, vin)` ('atual'|'ex'); `descricaoOrigem` → "no time"/"na equipe"/"no circuito" para companheiros de clube; rotina de esporte → "na base" (carreira em fase de base naquele instante), "na pelada, fora do clube" (já profissional), "no time do bairro" (rotina nível 1); amizade que nasce só da convivência ganha um costume concreto (`costumeDaAmizade`, `rngDe`).
- `ui/apresentar.rotuloDe`: "colega de equipe" / "ex-colega de equipe"; `ui/leitura.ondeEsta`: "Jogam no mesmo time." no lugar de "Trabalham juntos.".
- `sistemas/busca.ts`: o romance conhecido no trabalho/faculdade/escola grava o ambiente real (`ambientesAtuais`) e o convívio.
- Sim (vínculos de trabalho/futebol das 40 vidas): antes 198 "no trabalho" (companheiros incluídos); depois 67 "no time" + 128 "no trabalho" (empregos de depois da carreira).
- `sistemas/citacoes.ts` (novo): `pessoaCitavel`, `citadosEmRegistrosVivos` (contrato em proposta/produção, agente) — protegidos em `indiretos.processarDistantes`; `esquecerMorto` (chamado em `indiretos` e `luto.registrarMortes`) tira o `pessoaId` dos contratos em curso e encerra o agente com uma linha na biografia. `audiovisual` usa `pessoaCitavel`; Caminhos marca "— morreu em X" em "Gente que ficou desses trabalhos".

## Testes
- Novo `src/motor/__tests__/rework11Eventos.test.ts` — 15 testes, todos passam: futebol ~20 temporadas ≥ 15 visíveis e Caminhos com todos; ano da renovação adia e reabre; ex-clube com dados reais; ex-jogador técnico vê as duas carreiras inteiras; recomeçar registra vistos; vistosDaVida guarda a infância; infância nova com papéis fixos; sonho realizado não recebe o texto do abandonado (e o só-dispensado sim); propriedade (técnico → transformado, retomada → retomado); eco com empregador trocado/promovido não abre; eco do curso só com curso novo; colega de equipe / ex-colega; "na base"; morto deixa de ser citado e o citado em curso não morre "sem notícia".
- Relacionados rodados (situacoes/momentos2, biografia/meiaidade, rework10, rework105, rework106, social, save, fechamentoMundo, pacotePlaytest, tecnico, generalizacao, rework3/4/5, transversal…): verdes. Suíte completa na cópia Linux (uma rodada, antes dos ajustes de semente): 1728/1734; os 4 arquivos ajustados foram rodados de novo e passam; as falhas que sobram são pré-existentes na base (`rework11Rotina` "o gato de quem trabalha à noite", da Fase G) ou de tempo sob carga (`motor.test` "regra de agência" com 60 s fixos — passa com o tempo maior; `fechamentoMundo` #4 passa sozinho).
- Testes antigos ajustados (todos por caminho de semente: a infância nova muda a vida que as sementes produzem): `rework10` EVT-02 (a cena de 15 anos começa sem os `*10_` já vistos — a semente já tinha vivido o projeto da escola) e ECO-03 (semente 35→36: a 35 trocava de emprego um ano antes da demissão); `motor.test` família (55→56: a 55 morre num acidente antes dos 25); `rework97` FUT-02 (12→13: a 12 morre aos 21 num acidente); `ui/rework105` SAU-02 (o cenário "sem sinal nenhum" agora zera as condições: a semente 3 chegava aos 40 com um incômodo).

## Bundle (bytes; limite 800 kB intacto)
motor-textos 763 890 → 765 941 · motor 692 005 → 713 613 · motor-carreira 341 453 → 345 456 · motor-acontecimentos 97 840 → 107 606 · motor-dados 506 344 → 507 060.

## Pendente
- O ritmo de CENAS de decisão por temporada não subiu (uma decisão por ano na vida toda); subir exigiria mexer na fase de conteúdo (fora do escopo).
- Cenas de música/atuação novas: outro agente (só ganharam o bloco em Caminhos).
- A UI de "Momentos da carreira" não ganhou teste de interface (jsdom) próprio; coberta pelo motor (`momentosPorCarreira`).
- Amizades antigas sem história continuam como estão (o costume só nasce em amizades novas).
