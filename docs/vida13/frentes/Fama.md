# Frente 7 — Fama, o mundo reage à trajetória, eventos pelo histórico (VIDA 13, seções 4, 11, 12)

Estado: **feito, com limitações listadas no fim**. Nada commitado (o integrador commita).

## Auditoria (o que já existia e foi reaproveitado)
- `notoriedade.ts`: valor/pico/origens, faixas (anônimo → muito famoso), `rendaDeImagem` (patrocínio mensal esporte/arte), `imagemPublica`, `pesoDaExposicao`, `somarAoNome`. **Mantido**; um gancho só.
- `fama.ts` (`leituraDaFama`: reconhecimento, prestígio, alcance, digital, imagem) — lido pelo núcleo novo.
- `visibilidade.ts` (USOS: entrevista, causa, evento, publicidade, privacidade, projeto, política) — reaproveitado na tela nova.
- `exposicao.ts` (segredos → notícia), `conteudo/fama.ts` (fama_rua/encontro/cobrança/pedido/boato, no sorteio principal) e `noto_convite` — seguem como estão.
- `ecos.ts`/`acontecimentos10` (recusas, favores), `acontecimentos126` (reencontro genérico, favor devolvido), `situacoesMemoria` (cenas esportivas) — **não duplicados**: os eventos novos cobrem o que faltava (títulos de anos redondos, controvérsia que volta, negócio fechado, emprego deixado, rival/amigo de antes que reagem à fama, obra redescoberta, mandato lembrado).
- Lacuna encontrada: empresas grandes (12.9) **não davam nome nenhum** (o save `vida-r129-empresaria`, dona de montadora de R$ 2 bi, era anônima). Corrigido por gancho.
- Lacuna: a fama vivia em "Você · No mundo" (bloco "O seu nome"), sem consequências visíveis nem histórico.

## O que mudou (arquivo:função)
- **NOVO `src/motor/sistemas/reconhecimento13.ts`** (núcleo único; pacote próprio `motor-fama`, 17 kB):
  - `nomeDasEmpresas13` — motivo extra do nome pelo valor/reputação das empresas (R$100 mi≈30, R$1 bi≈50, R$10 bi≈75; investidor não; "abrindo" metade), registrado via `registrarMotivoDoNome`.
  - `marcosDoEstado13` / `registrarMarcos13` — marcos lidos SÓ de registros (palmarés, obras, currículo premiado, histórico político, escândalo, segredos públicos, `vis_polemica`/`vis_boa`, negócio/empresa fechados, mudanças de faixa). Guardados com a data do registro (saves antigos: backfill com a data real; nunca inventado). Também a série anual da notoriedade.
  - `imagemDaFama13` — admiração × rejeição (0–100) com decaimento (meia-vida 6 anos; ruim 8); controvérsia "superada" pesa 40%.
  - `origensDaFama13` — esportiva, artística, musical, empresarial, política, digital, feito (seleção campeã, prêmio internacional) e controvérsia (só quando a rejeição domina), cada uma com o registro que a prova.
  - `leituraDaFama13` — relevância, nível, alcance (também "fora do país" para feito/presidência/empresa ≥R$5 bi), tendência, privacidade, benefícios e custos proporcionais, receitas.
  - `valorDaCampanha13` (nome², alcance, imagem, `nivelSalarial` do país) e `receberDaFama13` (conta + `extrato.lancar` + lista de receitas).
  - `mundoReage13` — pass anual: grava marcos (silencioso) e, com `rngDe(v.id,'mundo_reage_13',t)` (nunca o RNG principal), sorteia no máximo UM `f13_*` (chance por faixa 0/10/20/28/36%) ou UM `h13_*` (12%, só se houver registro). Decisão que não cabe vai para a fila.
  - `normalizarVida13Fama`.
- **NOVO `src/motor/conteudo/acontecimentos13Fama.ts`** (21 conteúdos `manual`, fora do sorteio principal):
  - Reações: `f13_local` (rádio/jornal da cidade, nome 10–34), `f13_patrocinio` (aceitar/pedir mais/recusar; valor real), `f13_participacao` (novela/estádio, cachê), `f13_internacional`, `f13_mercado` (parceria com a empresa real: reputação/caixa ou atrito), `f13_palestra` (piso local), `f13_pressao` (política: apoio/desgaste), `f13_quer_conhecer` (cria pessoa nova pelo `apresentarAlguem`, rng derivado), `f13_paparazzi`/`_par` (tensão com a parceria), `f13_boato` (com amigo/colega REAL), `f13_vaia` (rejeição ≥40, cita a controvérsia registrada), `f13_homenagem` (admiração ≥55), `f13_mobilizar` (arrecadação para causa; risco de "autopromoção").
  - Histórico: `h13_titulo` (10/15/20/25/30/40 anos do título, competição/clube reais), `h13_controversia` (≥5 anos; falar abertamente pode "superar"), `h13_fracasso` (negócio fechado + deu certo depois), `h13_emprego` (empregador e ano reais; colega real do período quando existe), `h13_rival` (rival/ex-amigo existente reage a marco bom recente), `h13_amigo_antigo` (amigo de antes da fama), `h13_obra` (obra de 12+ anos redescoberta), `h13_mandato`.
- Ganchos em compartilhados (Edit, pequenos): `notoriedade.ts` (MOTIVOS_EXTRAS + `registrarMotivoDoNome`, ~0,3 kB), `tipos.ts` (`Vida.fama13?`), `ano.ts` (import + 1 chamada no fim do ano), `save.ts` (normalizador), `conteudo/catalogo.ts` (spread), `vite.config.ts` (regra `motor-fama`).
- **UI**: NOVO `src/ui/jogo/Fama13.tsx` + `fama13.css`; `Voce.tsx`: parte **"Fama"** no subnav só quando relevante (nome ≥10, ≥10 mil seguidores reais ou prestígio ≥75 — anônimo não vê), atalho no alto de Você e em No mundo; bloco antigo `OSeuNome` removido (migrou para Fama). `navegacao.ts`: `voce: 'fama'`. Tela: capa (palavra, escada de 5 degraus, reconhecimento/alcance/privacidade/prestígio/redes, traço da notoriedade no tempo), "Por que conhecem você", "Imagem pública" (barras), "O que a fama traz" (patrocínio/mês, campanhas 12 meses, total da vida) × "O que a fama cobra", "O que fazer com o nome" (só usos que cabem ao tamanho do nome), "A fama no tempo" (marcos).
- Bug corrigido de passagem: "o nome chega a a cidade" (agora "à cidade/à região/ao país todo").

## Campos de save
- `Vida.fama13?: { desde?, marcos?[≤60], serie?[≤40], receitas?[≤40, antigas somadas], reacoes? }` — opcional; `normalizarVida13Fama` remove o torto. Save v20 mantido.

## Testes (reais)
- `src/motor/__tests__/vida13Fama.test.ts`: **21/21** (origens ×5, proporcionalidade ×5, anônimo ×3 — inclusive 30 anos de `avancarAno` sem f13 e o pass não tocando `v.rng`/`v.seq` —, histórico ×7, saves ×2).
- `ui/__tests__/pacotePlaytest.test.tsx` + `rework105.test.tsx` + vida13Fama: **40/40**. (pacotePlaytest UI: 1 linha ajustada — o heading "O seu nome" virou "O que fazer com o nome", mudança pedida.)
- Motor relacionados (pacotePlaytest, rework105, rework11Artes, rework5, vida126Vida, sucessao, rework10): 225/229; as 3 falhas de outros arquivos são **timeouts de 20 s** com a máquina em load ~15 (reexecutadas isoladas: timeout de novo). Medi o custo do pass: 1,4 ms/ano no jogador muito famoso vs 134 ms do `avancarAno` (≈1%); 0,01 ms numa vida anônima. Não atribuo às minhas mudanças, mas o integrador deve rodá-las com a máquina livre.
- `navegacao.test.tsx`: 1 falha em "Aparência · Como ficaria" (área de outra frente).
- `tsc`: sem erros nos meus arquivos.

## Sims (`scripts/sim/fama13.ts`)
- 48 vidas inteiras até 80 (12 estratégias, BR/US/PT/JP/NG): 44 anônimas (0 reações f13; 0,14 lembrança h13/vida, quase todas `h13_emprego`), 4 locais (0,75 f13/vida, `f13_local`), 0 famosas (as estratégias não produzem fama). Máx. 1 evento novo/ano.
- Saves de QA, 6 réplicas × 25 anos (decisões aleatórias): jogador muito famoso 7 f13 + 1,8 h13 por vida (~0,35/ano); presidente ~3,2 f13/vida; empresária (nome 25 pelo gancho novo) 0,5 f13 + 0,17 h13. Máx. 2 eventos novos num ano (decisão adiada + do ano).
- Dinheiro (muito famosos): campanhas/participações/palestras aceitas ≈ R$ 340 mil/vida em 25 anos, além do patrocínio mensal já existente (≈ R$ 12,1 mi acumulado). Valores escalam com o país (EUA > BR, testado).
- Distribuição: quer_conhecer 11, mobilizar 11, patrocínio 9, boato 8, paparazzi 8, título 6, local 5, palestra 5, pressão 4, amigo antigo 3, controvérsia 2, fracasso/internacional/homenagem/paparazzi_par 1. Nunca vistos na sim: `f13_mercado`, `f13_participacao`, `f13_vaia`, `h13_rival`, `h13_obra`, `h13_mandato`, `h13_emprego` em famosos (cobertos por testes unitários de elegibilidade).

## Pacotes (build próprio `a13/dist-fama`, todas as frentes juntas no momento)
motor-dados 798,9 · motor-textos 794,3 · motor-carreira 747,8 · motor 741,7 · Jogo 629,7 · motor-acontecimentos 339,0 · motor-vida 285,2 · motor-casa 281,8 · motor-patrimonio 255,1 · motor-conteudo 165,0 · **motor-fama 17,0 (novo)**. Minha parte em motor-dados ≈0,3 kB (gancho), em motor-textos 2 linhas; acontecimentos +~25 kB; Jogo +~8 kB. Atenção: motor-dados e motor-textos estão a ~1–6 kB do limite somando todas as frentes.

## Auditoria visual
Capturas em `a13/fotos/fama/` (jogador muito famoso e cantora local; claro/escuro; 1440/390; Você no topo com atalho; capa no celular). Olhadas: sem rolagem horizontal (scrollWidth = viewport), sem erros de página; tema escuro legível. Corrigi após olhar: clube repetido nos marcos ("com o Olympique Lyonnais com Olympique Lyonnais"), parede de "Fazer" bloqueados para nome pequeno, "chega a a cidade".

## Limitações honestas (não feito / parcial)
- Sem entrada no mapa de intenções do Menu (o teste de navegação exige que toda intenção funcione para uma adulta anônima; a parte Fama não existe para ela). O acesso é a aba "Fama" em Você + atalhos.
- Carreira: não mexi em salários/transferências/cachês (já leem a notoriedade); a consequência de carreira nova é via convites, palestras, parceria e pressão política.
- `f13_mercado` só para empresa operando/em crise; não houve ocorrência na sim. Proposta de COMPRA de participação não foi feita (evitei mexer em `parte` sem o fluxo de venda das empresas).
- Influência/causas: a arrecadação vai para a causa (não há sistema de causas persistente); efeito em apoio político e imagem.
- Os eventos f13 em quem já é famoso somam-se aos antigos `fama_*` do sorteio principal (não alterados); frequência combinada não medida em separado.
- Polêmicas de `vis_polemica` só guardam a última data (o fato é sobrescrito); o marco é capturado no ano em que acontece a partir de agora.

## Arquivos tocados
Novos: `src/motor/sistemas/reconhecimento13.ts`, `src/motor/conteudo/acontecimentos13Fama.ts`, `src/motor/__tests__/vida13Fama.test.ts`, `src/ui/jogo/Fama13.tsx`, `src/ui/jogo/fama13.css`, `scripts/sim/fama13.ts`, `scripts/playtest/gerar13Fama.ts`, `scripts/playtest/fotos13Fama.mjs`.
Editados: `src/motor/sistemas/notoriedade.ts`, `src/motor/tipos.ts`, `src/motor/ano.ts`, `src/motor/save.ts`, `src/motor/conteudo/catalogo.ts`, `vite.config.ts`, `src/ui/jogo/Voce.tsx`, `src/ui/navegacao.ts`, `src/ui/__tests__/pacotePlaytest.test.tsx`.
Saves de QA: `~/vida-trabalho/a13/qafama/saves/vida-13-{jogador,cantora}.json`.
