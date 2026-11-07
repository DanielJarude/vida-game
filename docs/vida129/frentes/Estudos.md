# VIDA 12.9 · Frente Estudos — relatório

## O que mudou (arquivo:função)

### Motor
- **`src/motor/dados/instituicoes129.ts`** (novo, motor-casa): tipos (`Instituicao129`, `Campus129`, `Mensalidade129`, `Processo129`, `MatriculaInstituicao129`, `ProcessoFeito129`) e `INSTITUICOES_129` — **21 instituições, 62 campi**, gerado de `a129/universidades.json` por script (regras abaixo). Arquitetura por país (`pais: 'BR'`); fora do Brasil o motor cai nas vias genéricas.
- **`src/motor/dados/cursos129.ts`** (novo, motor-casa): 15 técnicos + 3 qualificações ligados a áreas com vaga real em `dados/ocupacoes` (refrigeração, energia renovável, telecom, eletromecânica, manutenção automotiva, soldagem, agronegócio, zootecnia, cozinha, informática para internet, jogos digitais, RH, comércio, marketing, agrimensura; instalador de ar-condicionado, de energia solar, panificação). `EXTRAS_TECNICOS_129` por perfil de escola. Nada de certificado avulso.
- **`src/motor/sistemas/estudos129.ts`** (novo, chunk próprio `motor-estudos`): `opcoes129` (curso → instituição → campus → processo, + ProUni/FIES nas particulares, + vias genéricas/EAD), `aplicarProva` (Fuvest 1ª fase /90 + 2ª fase /100; Comvest /72 + /100; Vunesp; PAS/UnB; Provão Paulista; vestibular próprio de pública e de particular: prova + redação; SISU/ENEM e seleção própria pela nota do ENEM: a nota contra o corte), `candidatar129`, `semestres129`, `recuperacao` (exame final), `dependencia129`, `depoisDoCurso129` (jubilamento + aviso), `aoSair`/`dividaProporcional129` (FIES proporcional), `textoDeTrancar129`, `trocasInternas129`/`trocarInterna129`/`encerrarParaTroca129`, `encerrarMatricula129`, ação `estudos129` (`candidatar` | `trocar_interna` | `dependencia`).
- Ganchos pequenos:
  - `sistemas/escola.ts`: `export requisitoDoCurso`; `ganchos129` (registrados por `estudos129`); exame final em `processarCurso` (1 linha); `efetivarMatricula` copia `inst129`, a duração da instituição e o turno; FIES da formatura soma `fiesAnterior129`; `fecharNoHistorico` chama `aoSair` em abandono/cancelamento e aceita `'transferido'`; `em()` reconhece nome próprio ("na Universidade…", "no Instituto…").
  - `acoes.ts`: tipo/rota `estudos129`; texto de trancar por nível; `confirmar_matricula` aceita vaga de troca (`troca129`) e fecha o curso antigo antes.
  - `ano.ts`: `depoisDoCurso129(v)` logo depois de `processarCurso`.
  - `agenda.ts`: instituição só de período integral (`inst129.turno === 'integral'`) vira bloco integral.
  - `ensinoTecnico.ts`: cada escola ganha 1–2 cursos de `EXTRAS_TECNICOS_129`, sorteados com `rngDe` próprio — o catálogo antigo de cada escola não muda.
  - `dados/cursos.ts`: `...CURSOS_129` no FIM de `CURSOS` (índices de `opcoesDeCurso` preservados).
  - `conteudo/rework3.ts`, `conteudo/sistemicos.ts`, `conteudo/acontecimentos10.ts`: os três acontecimentos que largavam o curso com `matricula = undefined` agora usam `encerrarMatricula129` (histórico + FIES).
  - `tipos.ts`: campos opcionais (abaixo). `vite.config.ts`: regra `motor-estudos` e `instituicoes129|cursos129` no motor-casa.

### Interface
- **`src/ui/jogo/Faculdade129.tsx`** (novo, sob demanda) + **`src/ui/estudos129.css`** (novo, só tokens, claro/escuro, 390 px):
  - `MinhaFaculdade129`: cartão do curso — selo com a sigla, nível · tipo · modalidade, nome do curso, instituição/campus/cidade; trilho de semestres (feitos / este ano / faltam / atraso tracejado), "3º e 4º semestres de 10 · formatura prevista em…"; fichas Turno / Custo / Desempenho / Reprovações (x de y toleradas, alerta perto do limite); troca de turno (pílulas → ação de agenda existente); leitura do ano (trabalho, dedicação); os dois últimos semestres com notas (exame final/reprovada marcados); ações: dependência nas férias (custo e chance ditos), Trocar de curso (painel), Trancar / Voltar, Abandonar (com o valor do FIES que vira dívida). Estados vazios (primeiro ano sem notas, trancado com prazo).
  - `TrocaDeCurso129`: transferência interna (aproveitamento, custo, chance) + "Prestar um processo seletivo para outro curso" (o fluxo de ingresso em modo troca).
  - `Ingresso129`: 1 · curso (busca, objetivo e mais procurados primeiro, nº de instituições), 2 · onde (filtro Todas/Públicas/Particulares, turno pretendido), cartões de instituição por campus ordenados por proximidade (na sua cidade / no seu estado / outro estado · mudança, com "o que muda ao se mudar"), seletividade em palavras, turnos da instituição, duração verificada, custo (verificado com ano, "a confirmar" se fonte fraca; ou "estimativa do jogo para o curso"), processos com descrição, "Hoje ~X · corte ~Y" e Candidatar-se com chance; "Outras vias" (EAD/genéricas). Resultado do último processo com fases, nota, corte e barra.
- `ui/jogo/Estudos.tsx`: cartão do curso no Agora (os dados e botões do curso saíram de "Os estudos agora"); "Entrar na faculdade" reestilizado (`.entrar129`: 4 passos numerados, situação com onde mora) usando `Ingresso129`; `precarregarEstudos129`.
- `ui/jogo/HistoricoAcademico.tsx`: coluna "Período" (1º sem. · ano / 2º sem.), "aprovada no exame final", andamento em semestres, situação `transferido` ("trocou de curso").
- `ui/App.tsx`: precarrega o pacote novo.

## Regras da conversão do JSON (nada além do verificado)
- Ingresso: Fuvest→`fuvest`, Comvest→`comvest`, Vunesp→`vunesp`, SISU/ENEM→`sisu`, PAS UnB→`pas_unb`, Provão Paulista→`provao_paulista`, "ENEM (nota)" em pública→`enem_publica` (ENEM-USP, ENEM-Unicamp, Acesso Enem), em particular→`enem_privada`; Vestibular próprio→`vestibular`/`vestibular_unb`/`vestibular_privada`. **Fora**: entradas com `nao_verificado` (ENEM em PUC-SP, FGV, Mackenzie, Insper), Vagas Olímpicas, Vestibular Indígena, exames internacionais, "processo próprio com prova" da UFMG (forma não verificada) e da UFBA (seleção interna).
- Campus sem curso verificado: fora (UnB Gama). Campus em cidade fora do mapa do jogo fica no catálogo mas o motor não o oferece (não há como morar lá): USP São Carlos/Pirassununga/Lorena, Unicamp Limeira, Unesp Botucatu/Araraquara/Franca, UFRJ Macaé, UFRGS Tramandaí, UFSC Araranguá/Curitibanos, UFPR Toledo/Palotina/Jandaia do Sul, UFPE Vitória de Santo Antão, UFBA Camaçari, UFC Russas, PUC Minas Betim/Poços de Caldas, PUCPR Toledo, Mackenzie Alphaville.
- Mensalidade: por CAMPUS, só quando a fonte diz o campus ou só um campus oferece o curso (26 valores: PUC-SP, PUCRS, PUCPR, FGV SP/Rio, Insper, ESPM). ESPM Publicidade e Jornalismo ficaram fora (o valor de SP não tinha campus atribuível sem interpretar). Sem valor: a opção mostra "~R$ X/mês (estimativa do jogo para o curso)" e não atribui o valor à instituição. **Insper** (snippet de buscador) marcado `fraca` → tela diz "a confirmar". PUC-Rio sem mensalidade (cobra por créditos). Mackenzie/PUC Minas sem valor.
- Turnos: lista da INSTITUIÇÃO (a fonte não dá o turno de cada curso); sem lista, manhã/tarde/noite à escolha; FGV só integral → integral.
- Duração: só valor único ("10 semestres", "5 anos"); "8 a 10", "8 (integral) / 10 (noturno)" ignorados.
- Seletividade relativa (USP +45, Unicamp +40… federais +10 padrão) é **parâmetro de jogo** em `estudos129.ts`, não nota de corte oficial; somada ao corte de referência do curso já existente.

## Bugs com causa raiz
- **FIES escapava no abandono**: a dívida só nascia em `concluirCurso`. Agora `fecharNoHistorico` (abandono, cancelamento por trancamento longo, jubilamento, acontecimentos que largam o curso) chama `aoSair`: dívida = mensalidade × meses cursados × 0,85 (+ crédito de curso anterior), parcelas em 120.
- **`reprovacoes` nunca cancelava**: só crescia. `depoisDoCurso129`: limite = 2 × anos do curso (mín. 6) na graduação, 4 no técnico/pós, 3 na qualificação; aviso da coordenação a 2 do limite; no limite, matrícula cancelada (histórico `cancelado`).
- **Trancar dizia "faculdade" para técnico/pós**: `textoDeTrancar129` por nível.
- **Três acontecimentos largavam o curso sem histórico** (`matricula = undefined` direto): agora `encerrarMatricula129`.

## Mecânicas novas
Instituição/campus/processo reais; provas por fases com notas e corte; aprovação → vaga reservada 12 meses → matrícula (mudança de cidade pelo caminho de sempre); turno escolhido vai para a agenda; semestres exibidos (2 por ano letivo); exame final automático para reprovada com nota ≥ 3 (chance pelo desempenho e dedicação; passando todas, o ano não atrasa); dependência nas férias (ação, 1/ano, custo na particular, devolve 6 meses); jubilamento; FIES proporcional; troca de curso (transferência interna com aproveitamento: 6 meses/ano na mesma área, 3 noutra; ou processo seletivo em modo troca); técnicos novos nas escolas técnicas.

## Campos de save novos (todos opcionais; save continua v20; normalizador não foi necessário)
`Matricula.inst129?` (`{id, campus, processo?, turno?, meses?}`), `Matricula.fiesAnterior129?`, `Matricula.dependencia129?`, `Educacao.processos129?` (até 12), `Educacao.aprovacao.troca129?`, `NovoCompromisso(curso).inst129?`, `RegistroAcademico.disciplinas[].rec?`, `RegistroAcademico.situacao` + `'transferido'`. Matrícula antiga sem `inst129` funciona igual (instituição genérica) — testado.

## Testes (resultados reais)
- `src/motor/__tests__/vida129Estudos.test.ts`: 16 testes, todos passando (catálogo verificado; opções por instituição/campus; Fuvest × SISU × particular com fases diferentes; aprovação/reprovação pelo preparo e bloqueio de repetir no ano; confirmação com instituição real e recarga; duração da PUCPR; fora do Brasil genérico; semestres e atraso; exame final; jubilamento; dependência; trancar técnico; abandono com FIES; transferência interna; troca por processo seletivo; técnicos nas escolas; save antigo com matrícula em andamento avançando o ano).
- `src/ui/__tests__/vida129Estudos.test.tsx`: 2 testes passando (cartão do curso; fluxo curso → instituição → candidatar).
- Ajustados (mudança pedida): `ui/__tests__/rework106.test.tsx` (o fluxo usa `[data-curso129]` em vez de `.cat-item`); `motor/__tests__/rework105.test.ts` "reprovar conta" (com 11 reprovações a matrícula agora é cancelada → verifica o `cancelado` no histórico).
- Rodada relacionada (15 arquivos: vida129Estudos motor+ui, rework105, rework3, tecnico, rework2fecho, ui interface, fix31, rework2, navegacao, fechamentoMundo, rework95, fixPosRework4, rework105, rework106): **204/205 passando**; a falha é "um pai que nunca esteve presente não pede atenção" (relações, não toca estudos).
- Outras falhas vistas na árvore compartilhada, de outras frentes: `fix4` "conta no negativo… 4140 vs 3700" (mudança em `sistemas/dinheiro.ts`); `fix31` motor "ajuda da família" (2) e `motor.test` "linguagem de escolha" (93 s, máquina carregada) — nenhuma em código de estudos. Rodadas intermediárias quebraram por edições em andamento de outras frentes em `ano.ts` (`vidaEconomicaDoAno129`, `processarHobbies129`, `mandato`).

## Sim (30 vidas, São Paulo, 18 anos, sem cursinho)
Nota esperada (Direito, escala ENEM): p10 501 · p50 546 · p90 597. Chance média: Fuvest Medicina 0,02; Fuvest Direito 0,02; Comvest Computação 0,02; vestibular PUC-SP Direito 0,79 (25/30 ≥ 50%); Mackenzie Administração 0,96 (30/30). A estadual paulista exige preparo (cursinho, estudo dirigido); a particular é a porta comum — coerente com a diferença de seletividade e processo.

## Pacotes (build em `a129/dist-estudos`, árvore com as outras frentes)
motor 799,7 kB · motor-dados 798,0 · motor-textos 794,1 · motor-carreira 747,7 · Jogo 614,9 (Estudos saiu para um pacote próprio de 54,6 kB pela importação dinâmica do precarregamento) · motor-casa 170,9 · **motor-estudos 25,2 (novo)** · **Faculdade129 18,7 (novo)** · Estudos.css 12,2. Sem aviso de 800 kB, mas motor/motor-dados estão a < 2,5 kB do limite com TODAS as frentes juntas — minha parte neles são só ganchos (escola/agenda/ensinoTecnico/cursos, ~1,5 kB).

## Limitações honestas
- O motor continua anual: os semestres são a exibição de cada ano em duas metades; a dependência devolve 6 meses.
- Não houve verificação visual em navegador (sem screenshot a 390 px); o CSS foi escrito para grid de 1 coluna no estreito e testado só em jsdom.
- O "Explorar formações" genérico ainda lista graduações com as vias genéricas (sem instituição); a entrada por instituição está em "Entrar na faculdade".
- Seletividade e as escalas de fase (pontos de 1ª fase etc.) são do jogo, derivadas da mesma preparação do ENEM; não são cortes oficiais. Provão Paulista/PAS usam condição simplificada (médio concluído há ≤ 1 ano na UF, rede pública no caso do Provão).
- Turno por curso não verificado (usa a lista da instituição). Bolsas da própria instituição não modeladas (só ProUni/FIES).
- Troca externa encerra o FIES antigo como dívida proporcional imediata (no real, o FIES pode ser transferido); a troca interna carrega o crédito para a formatura.
- `uerj` existe como processo no motor, mas nenhuma instituição do catálogo o usa (a UERJ não estava no JSON).
