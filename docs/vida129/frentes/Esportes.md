# VIDA 12.9 · Frente Esportes — consistência dos resultados

## Bug real e causa raiz
Tênis por equipes: Portugal caiu na fase de grupos (`selecao.disputarTorneio` registrou certo), e meses depois o acontecimento
genérico `esp10_dor` (conteudo/acontecimentos10.ts) — "A dor antes da final" — sorteava `c.r.chance(0.45)` e, no resto,
escrevia "Jogou a final com dor e foi campeão." + `marcar(conquista, 'Campeão com o joelho doendo.')`. Ele não consultava
competição nenhuma; a marca ia para `fechamento.conquistasDoAno` (resumo do ano) e para a sala de troféus, sem título no palmarés.
Mesma família (auditados e corrigidos): `atl_final`/`atl125_largada` (final nacional sem classificação; "pódio" mantinha o
1º do sorteio do ano = título; "último lugar" não mudava nada), `bas_ultimo_ataque` ("cesta da vitória numa final" pela
colocação do ano ANTERIOR), `vol125_tiebreak` ("decisão do campeonato", "tie-break da final", "o título ficou do outro
lado"), `ten_tiebreak`/`ten_dor` (semifinal para quem nunca passou da 1ª rodada; nada entrava no ano; "nas semifinal"),
`ten126_viagem` ("Dois títulos pequenos", "Ganhou o nacional"), `ten125_wildcard`/`ten125_calendario` ("ganhou o torneio"),
`atl125_revezamento` ("convocado" sem convocação; "medalha", "recorde do país" sem registro), `fut_rebaixamento`
("o time escapou" antes da tabela decidir), futebol `contextoDeJogo` ("uma decisão" → "um jogo decisivo").

## O que mudou (arquivo: função)
- NOVO `src/motor/sistemas/esportes129.ts` (pacote motor-oficio, regra em vite.config.ts):
  `palavrasDoEsporte` (campo/tempo, quadra/set/quarto, piscina/pista/prova, tatame/round; equipe × individual);
  `classificadoParaFinalNacional` (estado simulado: a mesma conta da colocação do ano — ficar entre os 8 —, sorteio estável
  `rngDe(v.id,'final_nacional129',ano)`, só nível ≥ 2, uma final por temporada); `registrarFinalNacional(v, lugar)`;
  `faseTenisPlausivel` (no máx. 1 fase além do melhor do ano anterior) e `registrarFaseTenis`; `marcaDeTituloSemRegistro`
  e `contradicoesEsportivas` (varredura).
- `conteudo/acontecimentos10.ts` `esp10_dor`: genérico de verdade — "o jogo/competição mais importante do ano", palavras do
  esporte, sem final, sem título, sem marca de conquista; "poupar" não inventa derrota ("O time jogou sem você").
- `sistemas/esporte.ts` `aplicarLances`: o LUGAR da final nacional decide a colocação (1 = título; 2–3 pódio, nunca título;
  4+ nunca título); remove o forçamento antigo (`ouro`→1 / `podios`→min(col,3)); saves antigos com ouro/podios: ouro=1,
  pódio=2–3. `jogarCircuito`: a fase que o momento jogou entra no ano (final/semifinal reais, pontos, torneio marcante).
- `sistemas/situacoes.ts`: `atl_final` gated pela classificação, todos os desfechos com lugar (ouro/prata/bronze/fora);
  `finalNacional` removida; `ten_tiebreak`/`ten_dor` com fase plausível + `resolverSituacao` registra a fase (vencer leva à
  seguinte; abandonar não); `bas_ultimo_ataque` sem "final"; `fut_rebaixamento` sem "escapou"; "uma decisão"→"um jogo decisivo".
- `sistemas/situacoes125.ts`/`situacoes126.ts`: textos sem título inventado; `atl125_largada` gated + lugar; revezamento só
  com convocação real (`selecao.tUltima` ≤ 12 meses).
- `sistemas/coerencia.ts` `verificarCoerencia`: + `contradicoesEsportivas` (conquista/memória de título sem título no
  palmarés ±1 ano; ignora técnico/treinador, escola, amador, estatística "N títulos" e "Liga Ouro").
- `sistemas/fechamento.ts` `conquistasDoAno` e `ui/jogo/LinhaDaVida.tsx` `Conquistas`: escondem marca de título esportivo
  sem título no palmarés (saves antigos com "Campeão com o joelho doendo.").
- `tipos.ts` `CarreiraEsportiva.lances`: + `finalNacional?`, `faseTenis?` (opcionais, transitórios: limpos ao fechar a temporada).

## Save
v20 inalterado; só os dois campos opcionais acima (sem normalizador: ausentes = comportamento antigo). Histórico NÃO
reescrito: a memória antiga "Jogou a final com dor e foi campeão." continua na Linha da Vida; a MARCA falsa deixa de aparecer
no resumo do ano e na sala de troféus (detecção segura: título esportivo sem título no palmarés da modalidade ±1 ano).

## Testes (resultados reais)
- `src/motor/__tests__/vida129Esportes.test.ts`: 11/11 ✓ — tênis por equipes eliminado nos grupos (40 vidas: 0 "final",
  0 título, 0 conquista nova, resumo do ano limpo); palavras por esporte; save antigo detectado/escondido; seleções em 4
  modalidades (grupos, semifinal, final perdida, título: texto = palmarés = conquista); final nacional (classificação,
  ouro=título, prata/bronze sem título, fora do pódio nunca título) em atletismo/natação/luta; largada; tênis (fase
  plausível; semifinal vencida → final no ano; perdida → não); basquete/vôlei/revezamento sem final/título/medalha;
  regressão: 14 vidas × 10 temporadas em 7 modalidades, 0 contradições.
- Existentes: rework11Esportes (só "Sassuolo", já falhava na base), rework115Esportes (passa; falhou 1× por timeout de 20 s
  sob carga, passa sozinho), hotfix1151Futebol, tecnico, rework10 (EVT-02 inclui esp10_dor), rework105 motor, rework115Eventos,
  rework11Eventos, vida125, trajetorias: ✓. `profissao` "cortes" = timeout de 20 s (máquina carregada). `rework105`
  "reprovar conta" falha (expected 0 to be 11): área de Estudos (escola/histórico), não desta frente.
- tsc: sem erros nos meus arquivos (os 2 erros atuais são de outras frentes: empresas.ts, HistoricoAcademico.tsx).

## Simulação (scripts/sim/esportes129.ts, VIDAS=16, 54 s)
16 vidas do esportista (futebol, estratégia `esportista`, até os 40) + 32 profissionais (tênis, vôlei, basquete,
atletismo, natação, luta; 14 temporadas), momentos respondidos ao acaso: **0 contradições** palmarés × memórias/conquistas.
Títulos no palmarés: tênis 25, atletismo 12, natação 12, luta 11, basquete 5, vôlei 4, futebol 4; seleção campeã 2,
eliminada nos grupos 3; atl_final 14 e atl125_largada 4 jogadas (todas classificadas); 0 memórias "final com dor e foi campeão".

## Pacotes (build próprio em a129/dist-esportes, com as outras frentes juntas)
motor-oficio 88,57 → 91,56 kB (+3 kB, esta frente); motor 799,43 kB (base 796,49; as minhas edições em esporte.ts ≈ +0,5 kB);
motor-carreira 747,71 (base 746,69); motor-acontecimentos 235,83 (base 235,01). motor-dados 832 kB e os avisos "Circular
chunk" (motor-patrimonio/textos/vida) NÃO vêm desta frente (já apareciam antes da minha regra no vite.config).

## Limitações honestas
- Não há "decisão pendente" de atleta como `p.decisao` do técnico para copas/seleção: essas fases são simuladas no
  fechamento da temporada; por isso nenhuma cena fala de final de copa/seleção (as cenas genéricas viram "jogo grande").
- `ten125_equipe_nacional` (convocação para a disputa por países) segue sem gate na trajetória da seleção; não fala de fase
  nem título.
- `fut_rebaixamento` e `esp10_dor` não mudam a chance do resultado da temporada (só não prometem mais desfecho).
- A estatística "N títulos" da luta (torneios pequenos do ano) não vira entrada no palmarés (como no tênis); a varredura
  a trata como estatística.
- Memórias antigas na Linha da Vida não são apagadas (só a marca de conquista é escondida).
