# A4 — Eventos, variedade, Momentos da carreira, memória narrativa e NPCs (REWORK 11, auditoria somente leitura)

Base: branch `claude/fix-pos-rework3-playtest` @ 2523d86. Nenhum arquivo do repositório foi alterado.
Sims em `scratchpad/aud4/` (rodar com `npx esbuild <script> --bundle --platform=node --outfile=<scratch>/x.cjs && node <scratch>/x.cjs`):

| script | o que mede |
| --- | --- |
| `aud4/momentosCarreira.ts` | CAR-11.9: sorteados, abertos, registrados, mostrados (UI e legado), palmarés/biografia — futebol, ator, músico |
| `aud4/mcDiag.ts` | o mesmo + por que cada ano ativo NÃO teve momento (bloqueio/sem candidato/chance) |
| `aud4/infancia.ts` | EVT-11.1: frequência por evento ≤12 anos em 50 vidas, Jaccard entre vidas, séries com memória entre vidas |
| `aud4/sonho.ts` | EVT-11.7: reprodução determinística (dispensa aos 14 → profissional 20 temporadas → Copa → evento abre) |
| `aud4/npc.ts` | NPC-11.1/11.2: origem das amizades, amizades só com história automática, citações a mortos distantes |

---

## 1. CAR-11.9 — "Momentos da carreira" com 2 entradas em 20 temporadas

### Onde
- UI: `src/ui/jogo/Trabalho.tsx:263` (`{em('historico') && <MomentosDaCarreira …/>}`), componente `Trabalho.tsx:1367-1376` → `momentosDaCarreira(vida, 8)`.
- Fonte: `src/motor/sistemas/situacoes.ts:1741-1743` — `caminhos.situacoes.slice(-8).reverse()`, **todas as trajetórias misturadas**, só as 8 últimas.
- Registro: `situacoes.ts:346-349` `registrarMomento` (teto 60) ← `resolverSituacao` (só quando o jogador responde à decisão `car_situacao`, `conteudo/situacoes.ts:12-31`).
- Geração: `situacoes.ts:325-339` `processarSituacoes`; chance `chanceDeMomento` `:276-288` (futebol RITMO 0,62 `:243`); **bloqueio `anoJaTemCena` `:294-298`**.
- Segunda vitrine (Caminhos/legado): `src/motor/sistemas/legado.ts:125` — "Momentos" do atleta só com desfecho `otimo|pessimo`, últimos 6.

### Números (20 vidas × 22 anos, `mcDiag.ts`; futebol entra profissional aos 18 como `scripts/sim/momentos.ts`)

| | futebol | ator | músico |
| --- | --- | --- | --- |
| anos ativos/vida | 11,3 (temporadas 11,3) | 20,7 | 18,9 |
| (a) sorteados/vida | **4,2** | 8,6 | 7,1 |
| (a') abertos ao jogador | 3,6 | 8,1 | 6,5 |
| (b) registrados (desta trajetória) | **2,9** (0,26/temporada) | 8,1 | 6,5 |
| vidas com ≤ 2 momentos desta trajetória | **9/20** | 1/20 | 2/20 |
| (c) UI "Momentos da carreira" (8 últimos) | 3,6 (2,9 desta trajetória) | 7,5 | 6,5 |
| (c') legado "Momentos" (ótimo/péssimo, ≤6) | **1,2** | 0,1 (atuação não tem bloco) | 0,1 (arte não tem bloco) |
| (d) palmarés/vida | 8,2 (só no legado) | 0 | 0 |
| (d) entradas de biografia relevância "biografia" | 40,5 (tema trabalho 23,6) | 34,3 | 29,4 |

Diagnóstico por ano ativo de futebol (221 anos): **bloqueado pela renovação 81 (37 %)**, **bloqueado por proposta 52 (24 %)**, sorteado 65 (29 %), chance falhou 23 (10 %). Chance média pós-ano 0,69 — o ritmo não é o problema; o bloqueio é.
Músico: 120/379 anos (32 %) **sem candidato** (só 3 modelos `mus_*`, `situacoes.ts:1703-1722`, recarga 5 e novidade 0,12).
Momentos tomados por outra decisão no ano em que sortearam: 0,6/vida (sau_lesao, fam_nome_bebe…), quase todos recuperados pelo "adiado" (perdidos 0,1/vida).

### Onde os momentos somem (em ordem de peso)
1. **Geração** — `anoJaTemCena` (`situacoes.ts:294-298`) devolve `true` sempre que `fatos.esp_renovacao === v.t` ou `esp_proposta_hoje === v.t`. `esp_renovacao` é marcado em todo ano em que `v.t >= contratoAte` (`sistemas/esporte.ts:1108-1110`), e os contratos têm 1–3 anos (`conteudo/profissao.ts:366-381`, `esporte.ts:1098`); propostas (`esporte.ts:1061-1080`) ocupam outro quarto dos anos. Resultado: 61 % dos anos de carreira nunca sorteiam momento — e, ao contrário do "adiado" de `processarSituacoes:330-331`, o bloqueado não volta.
2. **Exibição na aba Trabalho** — `momentosDaCarreira` corta em 8 **sem filtrar por trajetória**: depois da aposentadoria, os momentos de técnico/emprego/universidade empurram os do futebol para fora; para um ex-jogador-técnico a lista do futebol tende a 0.
3. **Exibição no legado** — `legado.ts:125` mostra só ótimo/péssimo (≈ 40 % dos registros: 1,2 de 2,9).
4. **Teto** — `registrarMomento` guarda 60 (`situacoes.ts:348`): não pesa hoje (≤ 10 por vida), mas corta a carreira mais antiga numa vida com muitas trajetórias.
5. Palmarés (títulos, finais, prêmios, seleção) só aparecem em Caminhos/legado (`legado.ts:113-124`); a aba Trabalho não tem nenhum vínculo com eles.

### Correção mínima proposta
```ts
// situacoes.ts — anoJaTemCena: quando a renovação/proposta ocupa o ano, a cena é sorteada e ADIADA (volta no ano seguinte)
// em vez de não existir. Em processarSituacoes:
if (!tr || idade(v) < 17 || v.justica?.prisao) return;
const ocupado = anoJaTemCena(v, tr);
… (sorteio igual) …
v.caminhos.situacao = { id: m.id, t: v.t, dados: ocupado ? { ...dados, _ocupado: 1 } : dados };
// situacaoAberta: s.t === v.t && !s.dados._ocupado; e o bloco "anterior" (linha 330) aceita _ocupado como _adiada.
```
Alternativa mais simples (sem mudar o formato): `anoJaTemCena` só bloqueia se a decisão concorrente REALMENTE abriu — mas ela abre depois (fase de conteúdo), então a versão "adiar" é a correta. Atenção: o sorteio usa o `r` do ano; para não deslocar sementes de testes, o sorteio do ano bloqueado deve usar `rngDe(v.id, 'situacao_ocupada', v.t)`.
- UI: `momentosDaCarreira(v, n, trajetorias?)` com agrupamento por trajetória (seção por carreira, ou filtro pela trajetória atual + "carreiras anteriores"), `n` ≥ 12; `legado.ts:125` passar a mostrar todos os desfechos (marcando ótimo/péssimo) e criar o bloco "Momentos" em `trajetoriaDeAtuacao` (`legado.ts:140`) e `trajetoriaArtistica` (`:170`).
- Músico: 3–5 modelos `mus_*` novos (estúdio, turnê, cachê, plágio, a música que pegou).

---

## 2. EVT-11.1 — seleção de eventos e repetição

### Onde
- Ano: `src/motor/ano.ts:294-339` (`faseDeConteudo`): 1) garantidos-acontecimento; 2) prioritários-acontecimento (≤ 2/ano); 3) um acontecimento sorteado com chance 0,45/0,6/0,35/0,12 (`:317`); 4) decisão garantida → prioritária (maior `prioridade`) → sorteada com `FAIXA_DECISAO` (`:284-287`) × 0,55 se decidiu no ano anterior (`:289-291`).
- Elegibilidade: `conteudo/motor.ts:28-54` `preparar` — faixa de idade, escopo, **`repetir` ausente = uma vez na vida** (`base.ts:29`), papéis (pessoas reais), `quando`. Peso: `motor.ts:56-60` (`peso` do conteúdo × 0,45 se visto nas 2 vidas anteriores).
- Memória entre vidas: `save.ts:1405-1413` (`vistosDaVida` = ids únicos, `slice(-120)`; `memoriaDasUltimasVidas` = 2 últimas vidas), lida em `ui/useVida.ts:142-150`, gravada **só na morte** `useVida.ts:122-133`.
- "A primeira palavra": `conteudo/infancia.ts:48-66` (garantida, 50 % das vidas por `rngDe(v.id,'marco','palavra')`, e 50 % disso se as 2 vidas anteriores tiveram: `motor.ts:52`). "O passarinho": `conteudo/escolhas.ts:206-215` (decisão comum, 5–12 anos, peso 1, uma vez).

### Números (`infancia.ts`, 50 vidas até 13 anos, decisões ao acaso)
- 11,4 ocorrências até 12 anos por vida; 60 ids distintos no total.
- `bb_primeira_palavra` 25/50 (50 %), `inf_passarinho` 5/50 (10 %); garantidos `inf_primeiro_dia_aula`/`inf_alfabetizacao` 100 %; `bb_primeiros_passos` 46 %; `inf_excursao` 42 %; `pri_hospital_braco` 36 %.
- Sobreposição entre pares de vidas (Jaccard dos ids ≤ 12 anos): **0,23** média (p90 0,33); sem os garantidos **0,12** (p90 0,25).
- Séries (8): infância da vida 1 que reaparece na vida 2 — **33 % com memória × 49 % sem memória**. Vida até 70 anos: 47 ids distintos (abaixo do teto 120) → nenhum id de infância perdido pelo `slice(-120)` nestas vidas.

### Problemas
1. **Vida abandonada não entra na memória**: `recomecar` (`useVida.ts:278-284`) apaga o save sem `registrarVidaPassada`; quem recomeça depois da infância (o jeito comum de testar) volta a ver "A primeira palavra"/"O passarinho" com a mesma chance de quem nunca jogou. É a causa mais provável da repetição sentida no playtest.
2. A memória cobre só 2 vidas (`save.ts:1412`) e pesa 0,45 (`motor.ts:59`): na 4ª vida o evento volta a peso cheio.
3. `vistosDaVida` usa `slice(-120)` sobre um `Set` em ordem de 1ª ocorrência (`save.ts:1407`): numa vida rica (> 120 ids) os **primeiros** (a infância) é que saem. Hoje não acontece nas sims (47 ids), mas é o lado errado do corte.
4. Os marcos garantidos de 100 % (primeiro dia de aula, alfabetização) têm texto pouco variado — fora do escopo de medição aqui; candidatos a variantes por `rngDe`.

### Correção mínima
- `useVida.recomecar`: se `vida && !vida.morte && idade(vida) >= 3`, `registrarVidaPassada({...,'causa':'(recomeçada)', vistos: vistosDaVida(vida)})` numa lista separada ou com marca `abandonada: true` (não conta nas estatísticas de vida, só na memória).
- `vistosDaVida`: priorizar infância e decisões — `[...ids da infância(≤12), ...resto].slice(0,120)` ou subir o teto para 200 (o `lerEstatisticas` já corta em 120: `save.ts:1434`, ajustar junto).
- `memoriaDasUltimasVidas`: 3 vidas, com peso decrescente (0,35 / 0,5 / 0,7) — ainda via `rngDe`/peso, sem consumir o gerador do ano (regra: nada novo de acaso em `quando`; use `rngDe`).

---

## 3. EVT-11.7 — "O sonho que ficou para trás" contradiz a carreira

### Onde
- Conteúdo: `src/motor/conteudo/biografia.ts:1081-1121` (`bio_sonho_para_tras`, 45–55 anos, prioritário, `quando` = `sonhoParaTras(v)` e ≥ 10 anos desde o fato).
- Premissa: `biografia.ts:286-294` `sonhoParaTras`: (1) `caminhos.esporte` encerrado por `dispensa`, ou (2) a **última marca `abandono|fracasso` com domínio de sonho** — sem olhar o que veio depois.
- Origem da marca: `sistemas/esporte.ts:1203-1220` `encerrarCarreira` → dispensa da base grava `marcar(v,'fracasso','Dispensado da base…, aos 14. O sonho de viver do futebol ficou para trás.',3,{dominio})` (`:1217`). O fim da carreira profissional grava `fim_carreira` (não entra no filtro). E `arquivarCarreiraEsportiva` (`esporte.ts:856-861`) **descarta a base sem temporadas**, então a carreira profissional posterior substitui a base em `caminhos.esporte` e só a marca sobra.

### Reprodução (`aud4/sonho.ts`)
Dispensa aos 14 + porta amadora + 20 temporadas + Copa do Mundo + `fim_carreira` aos 40 → aos 48: **abre**. Texto: "Dispensado da base do Sport, aos 14. O sonho de viver do futebol ficou para trás — foi em 2040, aos 14. 34 anos depois, você ainda sabe como é jogar bola." Opções: "Voltar a jogar bola, por prazer" (memória: "…anos depois de desistir do sonho").

### Outros conteúdos de "memória" com premissa que o futuro pode desmentir
| conteúdo | onde | premissa | contradição possível |
| --- | --- | --- | --- |
| `bio_sonho_para_tras` | biografia.ts:1081 / 286 | marca abandono/fracasso | profissional depois; voltou à rotina e ganhou prêmio; peneira reprovada aos 12 e aprovada aos 13 (`caminhos.ts:542`, `esporte.ts:847` também gravam `fracasso` com domínio) |
| `bio_retomar` | biografia.ts:1295 / 297 | frente parada ≥ 8 anos | ex-profissional/técnico: "Houve um tempo em que você era dos bons por aí" para campeão do mundo (subestima); técnico de futebol não pratica a frente |
| `eco10_recusou` | acontecimentos10.ts:863-866 (eco em :274, :317) | recusou promoção/transferência | "o colega … hoje é a sua chefia" / "a unidade nova … maior da empresa" com outro empregador (o eco não guarda empregador) ou já promovido depois |
| `eco10_mudou_de_curso` | acontecimentos10.ts:900-903 (eco em :254) | trocou de curso | "a decisão … hoje parece a mais lúcida" mesmo se largou também o curso novo ou voltou ao antigo |
| `bio_plano_no_papel` | biografia.ts:1023 / 256-270 | plano não cumprido | **já valida** (`estudouDepois`, concurso, mudança de área) — é o modelo a generalizar |
| `cui_voltar` | trajetorias.ts:195-205 | pessoa da pausa | já trata morto ("Depois de X, a casa ficou grande") |

### Mecanismo geral proposto — `trajetoriaDoSonho`
Novo `src/motor/sistemas/premissas.ts`:
```ts
export type DestinoDoSonho = 'abandonado' | 'retomado' | 'realizado' | 'transformado';
/** O que aconteceu com um domínio DEPOIS de t: realizado (virou profissão/carreira/título), transformado (virou ensino,
 *  técnico, comissão, ofício vizinho), retomado (voltou como rotina/marca 'retomada'), ou segue abandonado. */
export function destinoDoSonho(v: Vida, d: Dominio, t: number): DestinoDoSonho {
  const depois = v.caminhos.marcas.filter(m => m.t > t && m.dominio === d);
  const pro = carreirasEsportivas(v).some(c => c.modalidade === d && (c.temporadas?.length ?? 0) > 0 && c.tInicio > t)
    || (v.caminhos.palmares ?? []).some(c => c.modalidade === d)
    || depois.some(m => ['profissional', 'conquista', 'fim_carreira', 'estreia'].includes(m.tipo))
    || [v.trabalho.atual, ...v.trabalho.historico].some(e => e && e.tInicio > t && dominioDaOcupacao(e.ocupacaoId) === d);
  if (pro) return 'realizado';
  if (v.caminhos.tecnico || depois.some(m => m.tipo === 'ensino')) return 'transformado';
  if (depois.some(m => m.tipo === 'retomada') || v.rotinas.some(r => r.id === d)) return 'retomado';
  return 'abandonado';
}
/** A premissa ainda vale? (para `quando` de conteúdos de memória). */
export const premissaVale = (v: Vida, p: { tipo: 'sonho'; d: Dominio; t: number } | { tipo: 'eco'; eco: Eco; empregador?: string }) => …;
```
- `sonhoParaTras`: iterar marcas do fim para o começo e devolver a primeira com `destinoDoSonho(...) === 'abandonado'` (o realizado vira outro evento — "O menino dispensado aos 14" como lembrança de vitória, opcional).
- `registrarEco('recusou', { …, texto, empregador: e.empregador })` e `eco10_recusou.quando` exigir `emprego(c)?.empregador === eco.empregador` e nenhuma `promocao` posterior; `eco10_mudou_de_curso.quando` exigir matrícula/conclusão no curso novo sem novo abandono.
- Teste de propriedade (vitest): para cada conteúdo com `tema` de memória, construir a vida com o "fato-premissa" e um "fato-contrário" posterior → `preparar(...)` deve ser `null`.

---

## 4. NPC-11.1 — "amiga no futebol" / NPC-11.2 — mortos distantes

### Onde
- Origem em palavras: `src/motor/sistemas/social.ts:404-424` `descricaoOrigem` (de `vin.ambiente`: `rotina:<id>:<cidade>` → `ROTINAS_SOCIAIS[id].onde`, futebol = "no futebol", `sistemas/rotinas.ts:162`).
- Criação dos colegas por ambiente: `social.ts:160-178` `conhecerGente` (todo ambiente atual: escola, faculdade, trabalho, rotina, vizinhança `:60-80`).
- Passagem a amigo: `social.ts:288-310` (criança < 12 basta conviver; 12–17 40 %; adulto com gesto ou afinidade>0,45 após 3 anos 20 %); texto `textoNovaAmizade` `:429-450` ("…virou amiga…" + onde) e `lembrarCom("Viraram amigos no futebol.")`.
- Ficha: `ui/leitura.ts:108-156` `quemE` ("Vocês se conheceram no futebol, em 20XX"), `:158-172` `ondeEsta`; `ui/jogo/Pessoas.tsx:459-460,643`.
- Busca de romance: `sistemas/busca.ts:142-146` — com contexto `atividade` grava `rotina:`; em contexto trabalho/faculdade/escola grava só `origem` sem `ambiente`/`convivio`.
- Mortos distantes: `sistemas/indiretos.ts:56-79` `processarDistantes` (sem notícia; protege só vínculos, indiretos e `oportunidades.pessoaId`).

### Números (`npc.ts`, 30 vidas × 55 anos: estratégias social/esportista/passivo)
- 79 amizades vivas ao fim: origem "no futebol" 34 (43 %), "no trabalho" 16, "no voluntariado" 15, "na noite" 7, "na rua de casa" 6, "na escola" 1.
- **0** amizades "no futebol" cuja rotina não tenha sido praticada (a origem é verdadeira); **9/79 (11 %)** só com história automática ("Viraram amigos…"/início/aniversário) — amizade sem nada vivido junto; 1 de origem "trabalho" sem ambiente (busca de romance).
- NPC-11.2: só 2 mortos distantes em 30×55 anos (o grosso é gente jovem); 0 entradas da Linha da Vida citando-os depois da morte. Não reproduzido em escala; o risco segue nos campos com `pessoaId` sem vínculo: `ContratoAV.pessoaId` (`tipos.ts:1893`, criado em `cena.ts:263`), `ItemCurriculo.pessoaId` (`tipos.ts:1918`), `AgenteArtistico.pessoaId` (`tipos.ts:1868`), `Segredo`/`Retorno` (`tipos.ts:2761,2806`). `audiovisual.ts:253` já checa `vivo`; os demais leitores não foram auditados um a um.

### Problemas
- "Amiga no futebol" é verdadeira quanto ao lugar, mas 11 % das amizades não têm um único fato compartilhado além da convivência — a ficha "O que viveram juntos" fica vazia de verdade e a frase "virou amiga de verdade" soa inventada.
- Para atleta profissional, os companheiros de clube têm `ambiente = trabalho:<clube>` → "Vocês se conheceram no trabalho" (deveria ser "no clube/no time"; a fixture `__tests__/fixtures/save-v11-atleta.json` tem `p3n` assim). Já a rotina futebol de um profissional ("rotina:futebol") gera "no futebol" para gente que não é do time.
- A busca de romance em contexto trabalho/faculdade (`busca.ts:142-146`) cria alguém "do trabalho" que não está no ambiente do trabalho (`convivio` vazio) — "Vocês se conheceram no trabalho", mas não trabalham juntos.

### Correção mínima
- `descricaoOrigem`: `trabalho:` cujo empregador é clube/equipe de atleta → "no time"/"no clube"; `rotina:futebol` de quem é profissional → "na pelada" (ou desligar `conhecerGente` da rotina da mesma modalidade quando `esporte.fase === 'profissional'`).
- `busca.ts`: em contexto trabalho/faculdade/escola, gravar o `ambiente` correspondente (`trabalho:${e.empregador}:${e.tInicio}` etc.) e `convivio`.
- Amizade adulta sem gesto: exigir ≥ 1 marco de história não automático (ou gerar um, com `rngDe`, ao virar amigo: "a carona depois do treino") — evita amizade sem nada vivido.
- NPC-11.2: helper único `pessoaCitavel(v, id)` (vivo, ou morto com `tMorte` e texto no passado) usado por todos os leitores de `pessoaId`; e `processarDistantes` acrescentar ao conjunto protegido os ids de `audiovisual.contratos`, `curriculo`, `agente` (ou, ao morrer, limpar `pessoaId` desses registros). Teste: matar um NPC distante citado em `ContratoAV` e verificar que nenhum texto posterior o trata como vivo.

---

## Matriz

| Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação | Teste de aceitação |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Geração de momentos de atleta | situacoes.ts:294-298, 325-339; esporte.ts:1108-1110 | **Quebrado** | 2,9 momentos em 11,3 temporadas; 9/20 carreiras ≤ 2 | `anoJaTemCena` bloqueia 61 % dos anos (renovação 37 %, proposta 24 %) sem adiar | `car_situacao` prioridade 2 < `esp_renovacao` 4 | Médio (sementes: usar `rngDe` no ano bloqueado) | Sortear e adiar em vez de bloquear | Futebol 20 temporadas: ≥ 0,45 momento/temporada, nenhuma carreira de ≥ 10 temporadas com ≤ 3 |
| Lista "Momentos da carreira" | Trabalho.tsx:1367-1376; situacoes.ts:1741-1743 | Parcial | 8 últimos de todas as trajetórias; carreira anterior some | sem agrupamento por trajetória | `RegistroDeSituacao.trajetoria` já existe | Baixo | Agrupar por trajetória, n ≥ 12, "carreiras anteriores" recolhido | Ex-jogador técnico com 6 momentos de futebol e 8 de técnico vê os 14 |
| "Momentos" do legado | legado.ts:125 (e falta em :140, :170) | Parcial | só ótimo/péssimo (1,2 de 2,9); atuação/arte sem bloco | filtro de desfecho | — | Baixo | Todos os desfechos; criar bloco em atuação/arte | Legado mostra = registrados (≤ 6) |
| Momentos de músico | situacoes.ts:1703-1722 | Fraco | 32 % dos anos sem candidato | 3 modelos | — | Baixo | +3–5 modelos `mus_*` | `sem_candidato` < 10 % (mcDiag) |
| Memória entre vidas — recomeço | useVida.ts:278-284; save.ts:1405-1413 | **Quebrado** p/ quem recomeça | vida abandonada não vira memória → mesma infância | `recomecar` não registra `vistos` | `registrarVidaPassada` | Baixo | Registrar vistos ao recomeçar (≥ 3 anos) | Recomeçar aos 8 e nascer de novo: peso 0,45 nos ids vistos |
| Memória — corte 120 | save.ts:1407, 1434 | Latente | corta a infância primeiro | `Set` em ordem + `slice(-120)` | lerEstatisticas | Baixo | Priorizar infância/decisões ou teto 200 | Vida com 150 ids guarda `bb_primeira_palavra` |
| Variedade de infância | ano.ts:294-339; motor.ts:28-60 | OK (medido) | Jaccard 0,23 (0,12 sem garantidos); palavra 50 %, passarinho 10 % | — | memória de 2 vidas | — | Memória de 3 vidas com peso decrescente | Série de 4 vidas: retorno da infância da 1ª na 4ª < 35 % |
| "O sonho que ficou para trás" | biografia.ts:286-294, 1081-1121; esporte.ts:856-861, 1217 | **Quebrado** | abre para campeão do mundo/técnico (reproduzido) | premissa não olha o depois; base sem temporadas não é arquivada | marcas, palmarés, carreirasEsportivas | Baixo | `destinoDoSonho` + escolher só marca "abandonado" | `sonho.ts`: `preparar` = null; sem a carreira pro: abre |
| Ecos "recusou"/"mudou de curso" | acontecimentos10.ts:863-866, 900-903 (ecos :254, :274, :317) | Frágil | "colega hoje é sua chefia" noutro emprego; "decisão lúcida" após largar o curso novo | eco sem empregador/curso | ecos.ts:24 | Baixo | Guardar empregador/curso no eco; validar em `quando` | Trocar de empregador → `eco10_recusou` não abre |
| "Retomar" para ex-profissional | biografia.ts:297-306, 1295-1301 | Menor | "era dos bons por aí" para campeão | texto ignora carreira pro | palmarés | Baixo | Variante para quem foi profissional | Ex-pro recebe texto que cita a carreira |
| Origem de amizade | social.ts:404-424, 160-178, 288-310; leitura.ts:108-156 | OK, com bordas | 11 % amizades só com história automática; time do atleta = "no trabalho"; busca cria "do trabalho" sem convívio | ambiente genérico; busca.ts:142-146 sem ambiente | ROTINAS_SOCIAIS | Baixo | "no time/clube"; ambiente na busca; 1 marco real ao virar amigo | Nenhum amigo adulto sem fato não automático; companheiro de clube "no time" |
| Mortos distantes citados | indiretos.ts:56-79; tipos.ts:1868,1893,1918 | Não reproduzido (2 mortes/30 vidas) | `pessoaId` fora de vínculo/oportunidade pode citar morto | proteção só de vínculos/indiretos/oportunidades | audiovisual, currículo, agente | Baixo | `pessoaCitavel` + proteger ids desses registros | NPC de `ContratoAV` morto não aparece como vivo em texto posterior |
