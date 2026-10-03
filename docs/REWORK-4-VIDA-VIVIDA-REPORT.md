# REWORK 4 — VIDA VIVIDA: agência, profundidade e materialidade

- **Base:** `1b87a03` (Coisas da vida), referência `0014bdb` (fechamento do ATT Mundo), branch `claude/fix-pos-rework3-playtest`.
  Sem merge em `main`, sem force-push, sem deploy manual, sem mudança de secrets, sem `.claude/` no commit.
- **Regra do pacote:** "não basta implementar — tem que conectar". Cada sistema novo abaixo diz **de onde lê** e **para onde
  escreve**; o que ficou parcial está marcado como parcial (seção *Limitações*).
- **Save:** continua **v20**. Todos os campos novos são opcionais e validados (`save.validarVidaVivida`); saves antigos abrem
  e recebem os dados novos de forma derivada e estável (ex.: a cor de um violão comprado antes vem do id do objeto).

## Arquitetura (o que entrou e onde)

| Tema | Fonte (motor) | Tela |
| --- | --- | --- |
| Identidade 2.0 | `dados/populacoes.ts`, `sistemas/identidade.ts`, `pessoas.visualHerdado/aplicarIdentidade`, `criacao`, `familia`, `filhos`, `sucessao` | `Retrato.tsx` (traços modulares) |
| Custo do estudo | `sistemas/custoDoEstudo.ts` (regime da matrícula) | Estudos: linha "Custo" |
| Formação 2.0 | `dados/vidaEstudantil.ts`, `sistemas/vidaEstudantil.ts`, `conteudo/vivida.ts` | Estudos: história da formação; Legado |
| Carga e estresse | `semana.cargaHumana/TETO_HUMANO`, `rotinas`, `compromissos` (conciliar), `sistemas/estresseProlongado.ts`, `corpo.fatorDoEstresseProlongado` | Tempo: medidores de carga e estresse |
| Economia aos 18 | `origem.apoioEmCasa`, `dinheiro.orcamento` | Dinheiro: "A família ajuda com os seus gastos" |
| Relações | `sistemas/desgaste.ts`, `lacos.forcaDaRelacao`, `sistemas/gestos.ts` (novos gestos), `interacoes` | Pessoas: síntese, barra, menu por tipo |
| Conhecimento de NPC | `sistemas/conhecimento.ts` (fatos persistidos) | Ficha: "Eleanor nasceu em Adelaide." |
| Rede social | `sistemas/redesBase.ts`, `sistemas/redes.ts` (+ notoriedade, dinheiro, integração) | Pessoas → "Na rede"; ficha da pessoa |
| Pedem atenção | `ui/leitura.sinaisSociais` (tipos, limite 3, um por pessoa) | Pessoas |
| Trabalho | `dados/areasProfissionais.ts`, `sistemas/areasDoOficio.ts`, `empregabilidade`, `relevancia.vagasAcima`, `dados/organizacoes.ts`, `sistemas/organizacoes.ts` | Trabalho: vaga escaneável, área, "Acima do seu nível" |
| Pertences 2.0 | `dados/pertences.ts`, `sistemas/pertences.ts`, `sistemas/presentes.ts` | Vida → **Pertences** (aba nova), `Objetos.tsx` |
| Viagens/experiências | `experiencias.previsaoDaViagem` + consequência da duração | Tempo: gramáticas visuais por experiência; viagem com cartão-postal |
| Linha da Vida | `conteudo/narracao.ts` (fato → narração), textos contextuais | — |
| Repetição | `scripts/sim/repeticao.ts` + `repeticao/analise.ts` | — |
| APK | `scripts/android/gerar-apk.mjs`, `public/android/vida.apk` | `BaixarApp.tsx` (Início e Menu) |

## Bugs do playtest e correções na fonte

1. **Faculdade pública gratuita cobrando mensalidade.** A causa não era o texto: o evento lia `mensalidade > 0` sem saber
   o regime. Agora há uma fonte única — `custoDoEstudo` (gratuita / paga / crédito / bolsa integral) — usada pelo extrato,
   pela independência, pelo motivo do aperto e pela tela. A pública de países com contribuição diferida (Austrália, Nova
   Zelândia, Reino Unido) vira **crédito** (`PerfilEducacional.publicaDiferida`), não mensalidade.
2. **"A área" reaparecendo depois da especialização (adendo).** A elegibilidade do evento agora consulta a **área
   persistida** (`v.trabalho.areas`, fases com início e fim), não o emprego atual. A área sobrevive a salvar/reabrir, troca
   de emprego, promoção, demissão, desemprego, troca de empresa, mudança de país e sucessão. A transição legítima é **outra
   decisão** (`ofi_area_troca`, depois de ≥5 anos na área): fecha a fase anterior e abre a nova, preservando o histórico.
   A mesma auditoria cobriu a classe de decisões únicas (generalista volta a ser perguntado só depois de 5 anos; marcos
   resolvidos não voltam).
3. **Operador de drone "na área" de quem fez Computação.** `empregabilidade` distingue formação **direta** de
   **relacionada** ("A sua formação (X) é aceita aqui — mas a vaga é de Y.").
4. **Toast de NPC antigo depois de avançar o ano.** O aviso carrega `pessoaId` e é limpo ao avançar (`useVida`).
5. **"Descobriu de onde X veio" sem dizer de onde.** O conhecimento virou fato persistido (cidade real); saves antigos
   convertem a frase antiga em fato.
6. **Vazamento "recuperação em português" fora do Brasil.** A matéria de linguagens usa a língua do país.
7. **Professor criado por momento escolar mudava ids.** Momentos só usam professores que já existem.
8. **Achado no playtest automatizado (C):** mudar de cidade não deixava marca nas relações próximas que ficaram. Agora
   `processos.concluirMudanca` registra na história de cada uma (até 6, das mais próximas): "Você se mudou para Curitiba;
   Melissa ficou em Belo Horizonte." — e o desgaste passa a conhecer a amizade de perto.

## Decisões

- **Identidade:** a ancestralidade vem do **contexto populacional só na 1ª geração**; daí em diante, dos **pais** (média), e
  os traços visuais são herdados por módulo (pele, cabelo, olhos, rosto, nariz, boca, sobrancelha) com sorteio derivado.
  Migração não muda genética; adoção não herda genética (herda família, nome e tradição). Nomes: a tradição da família pesa
  na sugestão do nome e no sobrenome (luso "mãe pai" com 60%), sem gerar homônimos na família.
- **Carga:** faculdade + trabalho é **permitido com preço** (cansaço, estresse, desempenho), com teto humano (1,55× da
  semana). O bloqueio só existe acima do teto. Estresse alto por anos vira biografia e só pesa na morte com corpo
  vulnerável (fator ≤1,6) — causal, não automático.
- **Aos 18:** maioridade ≠ sair de casa ≠ independência. Em casa, a família segue cobrindo parte do essencial, na medida da
  folga dela e da relação, mais enquanto se estuda e menos com renda própria.
- **Sorteios novos** usam `rngDe(...)` (derivado) e não consomem o RNG principal em `quando`/`papeis`.

## Relações, conhecimento e atenção

- A explicação "Muito ligados" saiu: a ficha e a lista mostram **tipo + síntese + história**; a barra visual lê força e
  tensão de relance.
- O desgaste é contextual (contato real, mensagem, distância, história, confiança, personalidade) e o texto do esfriar
  muda com o contexto.
- Gestos novos por tipo de relação (perguntar da vida, elogiar, pedir conselho, pedir ajuda com as crianças), além de
  presentear e usar objetos com a pessoa. Anti-farm: o mesmo gesto rende menos com a mesma pessoa e há limite anual.
- "Pedem atenção": no máximo **3**, uma por pessoa, com tipo (urgente / importante / notícia / oportunidade) e "abrir →".

## Rede social 1.0

Plataforma única ("Mural"). Conta, publicar (temas; promover pago), seguir/deixar/bloquear/desbloquear, apagar publicação
ou conta, monetizar (exige seguidores reais), comprar seguidores (derruba a credibilidade). Simulada a cada ano offline
(`processarRedes`). Conecta-se a: relações (quem segue, bloqueio esconde a pessoa do menu de sempre, mensagem segura a
distância), notoriedade (fonte `rede`), dinheiro (linha "Publicidade e parcerias na rede") e Linha da Vida.

## Trabalho

- Vagas escaneáveis (cargo, empresa, setor/local, salário, compatibilidade) com detalhe ao abrir; bloco "Acima do seu
  nível" com o que falta.
- Organizações persistentes com nome; voltar à mesma empresa anos depois vira história.
- Mercado independe do jogador (disponibilidade anual por cidade e ocupação, sorteio derivado).
- Cada área (segurança, dados, infraestrutura, produto…) tem descrição, prática, salário, vagas e desafio próprios; a vaga
  da área reconhece quem a viveu.

## Pertences, presentes e materialidade

- **Vida → Pertences** (Casa voltou a ser onde e com quem se mora). Comprar → ter (com cor/acabamento) → **usar** → gastar
  ou vender. O uso vai para sistemas existentes: prática (música, fotografia, programação), corpo, cabeça, estudo e a
  relação com quem estava junto — uma vez por ano por uso.
- Presentes usam o catálogo das lojas e ficam com a pessoa.
- Cores do mundo com interface contida: variantes persistentes para objetos e veículos; desenhos coloridos nas lojas.
- Pets: fundo escolhido por contraste e contorno — o gato branco não some mais.

## Linha da Vida e repetição

Auditoria automática (`scripts/sim/repeticao.ts`, 24 vidas × 30 anos, 6 países, 9 estratégias), antes e depois das
correções:

| Medida | Antes | Depois |
| --- | --- | --- |
| Frases idênticas em outra vida | 31,0% | **28,3%** |
| Moldes em ≥ metade das vidas | 14 | **10** |
| Acontecimentos em ≥ 80% das vidas | 6 | **5** |
| Roteiro da infância em comum | 13,6% | **12,7%** |
| Semelhança média entre vidas | 8,9% | **7,8%** |
| Semelhança máxima entre duas vidas | 21,1% | **16,8%** |
| Pares muito parecidos (≥ 50%) | 0 | 0 |

Ainda repetem: a recuperação econômica (o mesmo evento de país, para todas as vidas do país), a prova teórica de direção
e conclusões de curso ("Concluiu o ensino médio."). O instrumento está pronto para a simulação de 1.000 vidas (`VIDAS=1000`).

## Identidade familiar (5 gerações, 20 linhagens — `scripts/sim/identidade.ts`)

| Par | Traços em comum |
| --- | --- |
| pai/mãe → filho | 65,1% |
| irmãos | 62,8% |
| avô/avó → neto | 49,0% |
| pais adotivos → adotado | 36,9% |
| desconhecidos do mesmo lugar | 41,8% |

A família se parece mais entre si do que com estranhos, e a adoção fica no nível de estranhos (sem herança genética).

## Playtest automatizado (Parte 59 — `scripts/sim/vivida.ts`)

Seis vidas pelo motor, com as estratégias dos sims decidindo e o roteiro só acrescentando o gesto da cadeia. Todas as
perguntas de coerência passaram:

- **A** (Recife): licenciatura pública → regime gratuito, nada de mensalidade; 7 momentos de formação; 4 anos com a semana
  acima da capacidade estudando e trabalhando (permitido, com preço); aos 18–20 a família ajudou com até R$ 180/mês.
- **B** (Tanaka em São Paulo): tradição JP; casou; os 2 filhos herdaram a ancestralidade dos pais.
- **C** (BH → Curitiba): amiga próxima seguida na rede (18 seguidores); a mudança entrou na história da amizade (bug 8).
- **D** (São Paulo): computação → TI → escolheu **segurança** aos 23; seis empresas depois, a pergunta não voltou; a vaga
  de segurança aparece na trajetória, não em "outros caminhos".
- **E** (Porto Alegre): violão com acabamento próprio; tocar subiu a música (12,9 → 22,9); tocar para 3 pessoas ficou na
  história de cada uma.
- **F** (Salvador): viagem com destino e duração (Lençóis, uma semana) na Linha da Vida e na memória de quem foi junto.

## Testes

- **Suíte completa (Node 22.23.2, cópia no disco Linux): 1.134 testes em 66 arquivos, todos passando** (base: 1.102 em 65).
- `rework4.test.ts`: 32 testes causais novos (regime do estudo; área persistente com o roteiro obrigatório do adendo —
  Segurança → anos → troca de emprego → salvar → reabrir → promoção → nova empresa — e a transição; compatibilidade; carga;
  estresse prolongado; 18 anos; relações; conhecimento; rede; atenção; pertences; presentes; viagem; identidade; formação;
  narração; auditoria de repetição; organizações; save).
- **Testes antigos ajustados** (todos por efeito borboleta da semente — o conteúdo novo desloca `v.seq`/sorteios — com o
  motivo anotado no próprio teste): `sucessao`, `rework2`, `rework3`, `fix2`, `fix4`, `fixPosRework2`, `contabilidade`,
  `fechamentoMundo`, `caminhos` e, na UI, `coisas`, `interface`, `fixPosRework3`. Dois merecem destaque:
  - `caminhos` "9 e 10": a asserção estatística passou de `<` para `≤`. Com 120 vidas, a base dava 18 profissionais pela
    base × 17 pela porta amadora; o pacote dá 13 × 21. A causa exata não foi isolada; a calibragem fica para a simulação de
    1.000 vidas (registrado em *Pendências*).
  - `fechamentoMundo` "4." (240 vidas de 30 anos) ganhou teto de 60 s: o motor ficou ~20% mais lento por ano simulado,
    proporcional ao estado ~21% maior (mais fatos, traços, histórias). O passe de conhecimento foi otimizado (sorteio antes
    da lista).
- Typecheck limpo. Capturas: `scripts/playtest/vivida.mjs`, 9 cenas × 1440/820/390 (27 imagens), sem rolagem horizontal e
  sem erro de página/console.

## Bundle (limite de 800 kB mantido)

| Pacote | kB |
| --- | --- |
| motor | 742,71 |
| motor-textos | 727,51 |
| motor-dados | 431,09 |
| Jogo | 338,01 |
| motor-carreira | 276,63 |
| react | 223,22 |
| motor-conteudo | 128,81 |

## Save, offline e distribuição

- Save v20; fixtures de migração (v5…v16) passam na suíte.
- `build:itch` + smoke **21/21**; PWA offline **23/23** (o APK não entra no precache nem no ZIP do itch).
- **APK Android** (pedido no meio do pacote): `public/android/vida.apk` (5,7 MB, `br.vida.jogo`, alvo SDK 34), gerado do
  build final; botão "Baixar o app para Android" na tela inicial e no menu, escondido dentro do app e no iframe do itch.
  Detalhes em `docs/notas/ANDROID-APK.md`.

## Limitações (não declarar como pronto o que é parcial)

- **Rede social:** uma plataforma só; sem DMs com conteúdo, sem viralização por tema, sem rede de terceiros.
- **APK:** assinado com chave de depuração e **não testado em aparelho real**; não se atualiza sozinho (gerar de novo a
  cada versão). É um binário versionado (5,7 MB no histórico).
- **Repetição:** melhorou, mas eventos de país e de rotina (recuperação, prova de direção, conclusões) ainda repetem.
- **Irmãos** recebem a mesma proporção média de ancestralidade (os traços visuais variam); recombinação por filho não foi
  modelada.
- **Organizações** existem para empregos formais de empresa; domésticos, cuidado, concurso, forças, esporte e entrada
  ficam sem empresa nomeada, por decisão.
- **Desempenho:** ~20% mais lento por ano simulado.
- **Caminhos esportivos:** deslocamento entre a porta da base e a amadora (acima), sem causa isolada.

## Pendências (fora deste pacote)

- Calibragem estatística final e a simulação de 1.000 vidas (incluindo a proporção base/amador do futebol).
- Assinatura de release / AAB se o app for para loja; teste em aparelho.
- Pendências conhecidas do ATT Mundo (revalidação internacional de habilitação, abstração militar, frequências) seguem
  como estavam.
