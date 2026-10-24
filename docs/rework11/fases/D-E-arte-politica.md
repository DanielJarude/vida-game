# REWORK 11 · Fases D (atuação e música) e E (política e Submundo)

Branch `worktree-agent-af46e01cbf42c29c4`, base `b885ccc` (Fase A + checkpoint da G). Sims em
`/home/iego_ossi/vida-trabalho/sims-DE/` (`arte20.ts` com `ACOES=0` para o passivo, `pol.ts` com a chance por cargo,
`modos.ts` recriado, `crime11.ts`/`crime11-base.ts` = `scripts/sim/crime10.ts` + "anos ativos sem ganho").
Saídas "antes" = base `b885ccc`; "depois" = este branch.

## 1. O que mudou (arquivo:função)

### Fase D — economia artística (ART-11.3 / ATR-01..03, MUS-01, MUS-03, ATR-08)
- `sistemas/palco.ts`: `TRILHAS_DE_PALCO` sem `cena` (o ator não recebe a temporada como salário); `alcanceNoPalco`
  com freguesia ≤ 30, nome × 0,85, bônus de técnica limitado a +3 e papel `contratado` (alcance 30–45);
  `cacheDeApresentacao` = 330·e^(x/16)·e^((x−72)/15 acima de 72) com teto por linguagem (música 1,2 mi, teatro 25 mil,
  dança 15 mil); `parteDosCustos` até 70%; `temporadaDePalco` com agenda (x/10)^1,3, ×1,15 (antes ×1,4) para quem vive
  do palco, teto de 120 datas, desconto das datas da turnê do ano e fator de papel (compositor ×0,45, contratado ×1,25);
  novos `subirPublico` (o público grande cresce devagar) e `datasEsperadas`.
- `sistemas/trabalho.ts:processarClientela` + `tetoDosTrabalhosMiudos`: salário do ator = trabalhos miúdos, teto na
  tabela local. `dados/ocupacoes.ts`: `ator_reconhecido` 15.000 → 5.000 (trabalhos miúdos de quem tem nome).
- `sistemas/notoriedade.ts`: freguesia como nome com teto 15 (×0,2; paralela ×0,15; base 25/40); "marcou" ≤ 16 e
  "trabalhos" ≤ 12 (antes 24/18); o nome lê a recepção do PÚBLICO; `rendaDeImagem` da arte ×6 (antes ×11; esporte igual).
- `conteudo/profissao.ts:estrada`: a turnê usa ~1,15× as datas esperadas do ano (≤ 20), paga 0,65 do cachê, grava
  `fatos.estrada_t/estrada_datas` (a temporada desconta) e soma público com folga decrescente.
- `sistemas/arte.ts:anoDoProjeto`: técnica no público com teto (+2,5), esquecimento ÷9 (antes ÷14), cena ×4.
- `conteudo/caminhos.ts`: `aut_cliente_grande`, `aut_mes_fraco` e `car_curso_empresa` excluem `TRILHAS_ARTISTICAS`.
- Novo `sistemas/musica.ts`: `papelNaMusica` (solo/banda/contratado/compositor, deduzido ou escolhido),
  `disponibilidadePapelMusica`/`mudarPapelMusica` (ação `profissao · papel_musica`), `rendaDeDireitos` (8% do que a
  obra rendeu ao ano, decaindo até 15 anos; só obra com público ≥ 1; compositor ×2,5) — linha "Direitos de obras
  lançadas" em `dinheiro.entradasProprias`. Monetização de redes e patrocínio de esporte intactos.

### Fase D — crítica × público (ATR-06)
- `audiovisual.ts:concluirProducao`: `repercussao` = crítica (prêmio e prestígio leem); novo `publico` (=
  `recepcaoDoPublico`, sorteio próprio `rngDe`) move público, nome e o degrau dos testes; `textoDaRecepcao` diz as duas
  (cult / sucesso popular / ambos / nenhum); `fatos.av_cult`.
- `arte.ts:lancarObra`: `Obra.comercial` separado da `recepcao` (crítica); renda, público e clientela pelo comercial;
  texto com as duas. `profissao.executarProfissao('lancar')` idem.

### Fase D — progressão (ART-11.1/11.2)
- `cena.ts` teste de elenco: chance = 0,12 + (h−exige)/80 + currículo·0,1 + prestígio·0,12 − porte·0,06, teto 55%.
- `audiovisual.ts:degrauPorPrestigio` (no `processarAudiovisual`): ator → ator conhecido por prestígio ≥ 0,66, trabalho
  de destaque (prêmio ou recepção 3), nome ≥ 30, técnica ≥ 74, chance anual pequena (sorteio próprio).

### Fase D — convites coerentes (MUS-05..09)
- `cena.ts`: `viveDoOficio`, `degrauNaArte`. `oportunidades.ts`: o gerador "Começaram a pedir" pula ofício que já é o
  trabalho; `conviteObsoleto` (arte, mesma trilha, nível ≤ atual) sai das portas na virada. `perseguir.ts:podeMostrar`
  pela trilha (`trabalhaComArte`). `arte.ts`: `jaVive` pela arte (orquestra conta como música) e texto de PROMOÇÃO
  quando a pessoa já vive dela num degrau abaixo. `ui/jogo/Pratica.tsx`: sem "Tentar viver disso" para quem já vive.

### Fase D — modo artístico (COR-01..04, MUS-10)
- `profissao.ts:modoDoTrabalho` (só o ramo de ARTE): `ARTE_DE_OFICIO` (cena, dança, música, orquestra, literatura) é
  `artista` qualquer que seja o contrato; `temRitmo` falso para artista sem freguesia e não autônomo (bailarina CLT,
  orquestra); bloco de freguesia (preço/estrutura) não vale para `ARTE_DE_OFICIO`; MEI com peso 1 (fora do ator);
  `acoesArtisticas`: "Publicar um livro novo", papéis na música, "Fazer a audição de outra orquestra".
- `noOficio.ts`: verbo `ensaio` por arte (repertório, parte da temporada, preparador, coreografia, dias de escrita) com
  efeito (prática + freguesia/público se rendeu); "Divulgar o próximo show" no lugar de "no bairro"; sem "cliente
  exigente" nem capacitação/chefia para artistas.

### Fase D — cenas (A4)
- Novo `sistemas/situacoesArte.ts` (fora do motor-textos), registrado em `situacoes.MODELOS`: `mus_integrante_sai`,
  `mus_conflito_criativo` (a banda perde gente ou acaba; tensão/conflito com o integrante), `mus_fase_fria` (agenda
  ≤ 4 datas ou 3 anos sem obra), `mus_musica_pegou` (obra com público ≥ 2 há ≤ 24 meses), `cena_naos` (≥ 2 testes
  reprovados em 24 meses), `cena_cult` (`av_cult`), `cena_sucesso_popular` (`av_repercutiu`). Efeitos persistentes:
  público/clientela, dinheiro, nome, papel na música, membros da banda, fim da banda, agente, prática.

### Fase E — política (POL-02/03/04/06)
- `acoes.ts`: `pedir_aumento` impossível com contrato `eletivo` ("subsídio fixado em lei").
- Novo `sistemas/mandato.ts` (ação `politica · cargo` com o id no `valor`; ligado em `politica.disponibilidadePolitica`,
  `executarPolitica`, `acoesPoliticas`): legislativo = projeto de lei, fiscalizar (comissão de investigação), emenda,
  votar com/contra o Executivo (+ sabatina no senado); executivo = secretariado técnico/de aliados, orçamento,
  sancionar/vetar, obra grande. Duas por ano; efeitos em aprovação, `feito`, base, nome, desgaste com causa, aliado,
  crise do mandato e (secretariado de aliados, 12%) o risco `pol_risco` já existente.
- `politica.ts:dificuldade`: deputado estadual 50→53, federal 58→70, senador 74→77, governador 72→76.
- `ilicito.ts:temAcesso`/`categoriaPara`: trilha `politica` → corrupção.

### Fase E — Submundo (SUB-02/03)
- `ilicito.ts:anoEnvolvido`: ano seco com `chanceDeAnoSeco` (14–26%: confiança do meio, contatos, crise, moita; sorteio
  próprio) — ganho 0, e nível ≥ 2 perde 8–18% da renda anual (+ atrito em mercado/grupo); contatos vivos +5%/contato
  (≤ 20%) no ganho e −1/contato (≤ 3) na exposição; mandatário corrupto +5 de exposição. `contatosVivos` exportado.
- `margem.ts:processarMargem`: novo contato com confiança ≥ 30 (18%/ano, ≤ 6), traição (2%/contato + atritos; +15 de
  exposição, o contato sai), trabalho maior só com ≥ 1 contato vivo; `conteudo/margem.ts`: o trabalho maior bem-sucedido
  traz um contato; `leituraDaMargem` diz contatos vivos, traições e anos secos. Nada descreve método.

## 2. Bugs corrigidos (causa)
1. Ator pago 3–4× (palco como salário + cachê de peça + bilheteria + patrocínio) → palco fora da trilha `cena`.
2. Renda que cresce sozinha (freguesia → nome → alcance → cachê exponencial) → tetos de freguesia no nome e no alcance.
3. Turnê fora da agenda (20 datas extras) → datas do ano, descontadas da temporada.
4. "Cliente grande" e "mês fraco" de autônomo para artista; "curso da empresa" para bailarina/orquestra → exclusão.
5. Convites de "viver disso" para quem vive disso (4 portas) + convite obsoleto que rebaixava → `viveDoOficio`,
   `trabalhaComArte`, `degrauNaArte`, `conviteObsoleto`.
6. Bailarina/orquestra/escritor em modo empregado/servidor → `ARTE_DE_OFICIO`.
7. `pedir_aumento` liberado no motor em 49% dos anos de mandato → bloqueado.
8. Mandatário nunca recebia a porta da corrupção → `politica` em `temAcesso`.
9. Ano ativo no crime sempre rendia → ano seco.

## 3. Campos de save novos (todos opcionais; save segue v20)
`Obra.comercial`, `ItemCurriculo.publico`, `caminhos.papelMusica`, `Envolvimento.anosSecos`, `Envolvimento.traicoes`;
fatos `estrada_t`, `estrada_datas`, `av_cult`, `pol_secretariado(_t)`, `pol_obra_t`. Normalizador
`save.ts:normalizarRework11Artes` (chamado em `interpretar`): salário do ator/ator conhecido acima do teto dos trabalhos
miúdos cai para o teto; o último palco de teatro do ator sem grupo ativo é removido (não vira "shows" por fora).

## 4. Simulações antes → depois (R$/ano; mediana · p90; 30 vidas; 22→42)
| cenário | antes | depois |
|---|---|---|
| ator parado, ano 20 | 226.800 · 334.224 | **29.244 · 29.244** (máx 29.244) |
| ator ativo, ano 10 | 2.264.694 · 3.960.324 | **90.654 · 314.364** (máx 561.524) |
| ator ativo, ano 20 | 2.313.794 · 3.820.846 | 167.874 · 560.274 |
| ator ativo, vidas com algum ano ≥ 1 mi | 30/30 | **0/30** |
| músico parado (sem banda), ano 10 / 20 | 498.108 / 669.444 | **6.468 / 5.472** (p90 ≤ 12 mil) |
| músico ativo com banda, ano 1 | 1.940.242 · 4.398.278 | **64.278 · 96.870** |
| músico ativo, ano 5 / 10 / 20 (med) | 16,0 mi / 9,5 mi / 8,2 mi | **178.466 / 224.734 / 68.978** |
| músico ativo, ≥ 1 mi no ano 10 | 30/30 | **1/30**; algum ano ≥ 1 mi: 5/30 (17%, sucesso raro e tardio) |
| testes de elenco aprovados | 73% (323/442) | **52% (165/315)** |
| ator → ator conhecido | 0/30 | 25/30 até o ano 20 (ano mediano 13) |
| "cliente grande" a artista | 19 (ator) / 25 (músico) | 0 / 0 |
| "Começaram a pedir" ao músico profissional | 87–108 | **0** |

As carreiras não são lineares: o músico ativo cai de 224 mil (ano 10) para 69 mil (ano 20) quando a banda acaba ou a
fase esfria; anos magros (18%) e bons (15%) seguem no palco.

`modos.ts` (adulto 30, técnica 85): ator, ator conhecido, músico da noite/profissional/orquestra, produtor musical,
bailarino e escritor em modo `artista`, **0 rótulos impróprios** (antes: bailarino "Pedir aumento", horas extras,
"Procurar outra vaga", chefia; orquestra "curso da empresa"; músicos "bairro", "cliente exigente", "Baixar o preço").
(Obs.: o contador "verbos de chefia/freguesia" do `arte20` conta pelo id `divulgar`, que agora é "Divulgar o próximo
show"; não é verbo de freguesia.)

**Política** (`pol.ts`, 40 vidas, 25→70): `pedir_aumento` permitido em mandato 321/643 → **0/1256**; ações por cargo
distintas (vereador/deputado: projeto de lei, fiscalizar, emenda, votar; prefeito: secretariado, orçamento,
sancionar/vetar, obra). Antes (base, mesma sim, chance sem contar a campanha): deputado federal 68%, governador 29%, senador 27%; resultados
reais na base: deputado federal 16 vitórias/2 derrotas (a auditoria: 42/5 e governador 14/3). Depois, chance com
campanha média para quem tem mandato (méd · p90): deputado federal **58% · 77%**, governador **39% · 58%**, senador
**40% · 56%**; resultados reais: deputado federal 10/7. Teste: a trajetória no teto
(base 95, nome 95, partido grande) fica entre 20% e 65% para governador/senador; a média (45/40), < 10%.

**Submundo** (`crime11`, N=20): anos ativos sem ganho **0/479 → 88/506 (17%)**: carreira 0% → 19%, fraude 0% → 12%,
isolada 30%, arrependida 23%. Carreira: presas 75% → 75%; ganhos por fora (med) 205.200 → 186.900; patrimônio aos 45
(med) 101.377 → 96.842. Honesta idêntica.

## 5. Testes
- Novos: `src/motor/__tests__/rework11Artes.test.ts` (21) e `rework11Politica.test.ts` (13): **34/34 passam**.
- Rodados (cópia Linux, 2 workers): correcaoPosFix, fixPosRework3, rework106, rework105, fix31, profissao, politica,
  calendarioPolitico, rework10, rework4, fixPosRework4, save, momentos2, fix3, fixPosRework2, trajetorias, caminhos →
  **533/533**; att3, fechamentoMundo, fix2, fix4, fixGeneralizacao, fixPosPlaytestHumano, meiaidade, motor, rework2,
  rework2fecho, rework3, rework75, social, rework5, rework9, rework95, rework96, rework97, pacotePlaytest,
  generalizacao + UI fixPosRework2/fixPosRework4/rework10/rework105/rework106/pacotePlaytest → **665/666**. A falha é
  `motor.test.ts › regra de agência` por **timeout de 60 s** (70–75 s sob carga); falha igual no commit base `b885ccc`
  rodado na mesma máquina — não é regressão.
- Ajustados: `correcaoPosFix.test.ts` "famoso > R$ 100 mil por show" → "> R$ 50 mil" (a curva do cachê no meio era uma
  das causas pedidas; público 75 dá ~R$ 65 mil contratados). `rework105` (o ator não vê "Formalizar como MEI") passou a
  valer com o MEI fora do ator — sem ajuste no teste.
- `tsc --noEmit` limpo. Build: motor-textos 763.890 → 764.122 B (+232), motor 692.005 → 720.294 B (módulos novos),
  motor-carreira 341.453 → 344.048 B; todos < 800 kB.

## 6. Pendências / limites
- Ator ativo nunca passa de R$ 1 mi/ano nas 30 vidas (máx ~R$ 640 mil); o extraordinário continua possível pelo fator
  "estrela" do cachê (protagonista de produção grande com nome ≥ 60), mas não apareceu na amostra.
- Músico parado ganha pouco (~R$ 6 mil/ano): sem piso de "aulas/estúdio" (decisão: o palco é a renda dele).
- A promoção a ator conhecido segue alta para o ator que faz tudo todo ano (25/30 até o ano 20, mediana ano 13).
- Bailarina CLT ainda pode `pedir_aumento` no motor (não aparece no painel; contrato de companhia é emprego real).
- Especialização por categoria no Submundo e mercado/território: não feitos.
- Alianças como lista com cobrança de promessa (POL-05): não feito; o aliado único é usado pelas ações de cargo.
- O `pol.ts` raramente leva a carreira a governador (a estratégia fica em vereador/deputado estadual); as taxas de
  governador/senador vêm da chance medida nas eleições de quem tem mandato.
