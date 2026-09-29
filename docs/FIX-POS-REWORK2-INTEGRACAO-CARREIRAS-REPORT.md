# FIX pós-REWORK 2 — Integração sistêmica, relações, carreiras vivas e agência

> "Não basta implementar. Tem que conectar."
> "O jogo pode decidir o que acontece com a pessoa. Não deve decidir silenciosamente como ela escolheu reagir."

## 1. Estado inicial

| | |
| --- | --- |
| Branch de partida | `claude/rework-2-pessoa-corpo-mente-relacoes` |
| HEAD inicial | `e01ac33` (working tree limpa) |
| Baseline | **631/631** testes (23 arquivos), typecheck limpo, build ok |
| Save | v16 |
| Node | 22 (`~/.nvm/versions/node/v22.23.2`) |

## 2. Branch

`claude/fix-pos-rework2-integracao-carreiras` (criada a partir de `e01ac33`). Sem merge em `main`, sem force-push, sem histórico reescrito, sem segredos, sem deploy.

## 3. Arquitetura encontrada (o que já existia e foi reutilizado)

Nada foi duplicado. A base já tinha: corpo/mente com fatores nomeados (`sistemas/estado`), frentes (técnica por modalidade), a semana como fonte única do tempo (`sistemas/semana`), iniciativas de NPCs (`Vinculo.chamado`), romance com autonomia da outra pessoa, carreira esportiva (base → contrato → clubes), política em fases com crises de mandato, negócio com caixa/estratégia/equipe, vida profissional por modo (ritmo, clima, por conta), conteúdo em decisões × acontecimentos. O FIX **ligou** esses sistemas; os módulos novos são pequenos e cada um tem consumidores.

## 4. Alterações realizadas

Módulos novos (motor): `sistemas/lesoes.ts`, `sistemas/sobrecarga.ts`, `sistemas/notoriedade.ts`, `sistemas/fechamento.ts`, `sistemas/oficios.ts`; conteúdo novo: `conteudo/integracao.ts` (decisões que ligam sistemas), `conteudo/oficios.ts` (carreiras comuns vivas).
Alterados: `tipos`, `save`, `ano`, `acoes`, `criacao`, `sistemas/{esporte, pessoa, estado, frentes, social, iniciativas, interacoes, romance, politica, profissao, trabalho, dinheiro, renda, arte, familia, filhos, exposicao, rotinas, oportunidades, vinculos}`, `conteudo/{profissao, politica, mundo, caminhos, catalogo}`, `dados/{ocupacoes, negocios}`; UI `Trabalho, Tempo, Voce, Jogo, leitura, apresentar, estadoPessoal, vida.css`.
Testes: `__tests__/fixPosRework2.test.ts` (28), `ui/__tests__/fixPosRework2.test.tsx` (5); fixtures v16 reais (3). Scripts: `sim/fixPosRework2.ts`, `playtest/gerarSavesV16.ts`, `playtest/gerarFixPosRework2.ts`, `playtest/fixPosRework2.mjs`.

## 5. Novas fontes únicas de verdade

| Conceito | Fonte | Consumidores |
| --- | --- | --- |
| Lesão | `corpo.condicoes[].lesao` (`sistemas/lesoes`) | saúde, condicionamento, treino técnico, temporada (meses fora), risco de nova lesão, humor, custo, Você, Trabalho, Linha da Vida |
| Sobrecarga | `leituraDaSobrecarga` + `mente.sobrecarga.anos` | saúde (se persiste), desempenho no trabalho, risco físico, piora de lesão, interesse nas atividades, parceria, amigos, decisão `sob_semana`, "Sua semana" |
| Salário/renda | `renda.remuneracaoDe` (bruto · líquido · média com 13º) | Trabalho ("No bolso", com bruto), Dinheiro ("Salário líquido — média do mês, com 13º e férias"), painel do atleta ("Salário do contrato, bruto") |
| Salário de atleta | `esporte.salarioDoContrato` / `assinarContrato` | primeiro contrato, renovação, transferência, empréstimo, proposta (as duas tabelas duplicadas saíram) |
| Fases da vida | `vinculos.FASES_DA_VIDA` (`faseDeIdade`, `capituloDaVida`) | interações, Você, Linha da Vida, cabeçalho (aos 28 não há mais "Juventude") |
| Notoriedade | `v.notoriedade` (`sistemas/notoriedade`) | patrocínio/publicidade na conta, `noto_convite`, porta política "notoriedade", pressão na cabeça, exposição do que é privado, Você, painel do atleta, Linha da Vida ao mudar de patamar |
| Vínculo de trabalho | `profissao.vinculoDe` | "por conta própria (sem empresa)" ≠ "dono do próprio negócio" |
| Amizade | `Vinculo.aproximacao` (gesto correspondido) + `Vinculo.distancia` | passagem colega→amigo e amigo→próximo, iniciativas, "Pede atenção" |
| Leitura técnica esportiva | `frentes.leituraDaFrente` + `peneira.nivelTecnico` | Tempo livre diz as duas réguas (destaque entre amadores × nível de base) |

## 6. Saúde / Corpo / Mente

Lesão é problema vivido: acontece (base, prática, profissional) → Linha da Vida + humor → **decisão `sau_lesao`** (repouso, fisioterapia, cirurgia quando é séria, seguir no sacrifício, e — lesão grave em fim de carreira — encerrar). O cuidado muda o prazo de volta (SUS mais lento e de graça, bolso, plano, clube paga o atleta), o peso na saúde e no condicionamento, e quanto dá para treinar; jogar no sacrifício rende menos, pesa mais e pode piorar (a piora reabre a decisão). A recuperação remove a condição e entra na biografia quando foi séria. Nenhum conselho médico: são escolhas abstratas.

## 7. Sobrecarga

Não há moeda de energia. A sobrecarga lê a semana concreta (fixos que passam do que cabe, atividades além da capacidade, semana apertada), a cabeça no limite, lesão/doença séria, dinheiro no vermelho e ritmo puxado. Anos seguidos contam (`mente.sobrecarga.anos`); descanso reduz. Consumidores graduais: saúde só a partir de 2 anos (−0,35/ano até −1,4), desempenho (−1,5 a −4), risco de lesão (+12% por ano, até 4), piora de lesão no sacrifício, interesse nas atividades, atrito em casa, amigos distantes. De três em três anos, a vida pergunta (`sob_semana`: largar a atividade mais pesada, aliviar o ritmo, férias, seguir assim). "Sua semana" mostra a mesma palavra e frase.

Achado durante o trabalho: as **horas extras eram zeradas dentro do ano de trabalho**, antes do equilíbrio da cabeça — a semana mostrava um peso que o motor nunca contava. Agora valem no ano inteiro e são zeradas no fim (`ano.viverAno`).

## 8. Relações

- **Conhecer ≠ ser amigo**: na infância, conviver basta; na adolescência, às vezes; depois dos 18, colega vira amigo quando há **gesto correspondido** nos últimos dois anos (sua `aproximar`, o chamado `aproximacao` de um colega aceito, responder sim a quem procurou) — ou, raro, anos lado a lado com afinidade muito alta. Sem gesto, a convivência vira familiaridade (afeto cresce devagar). Amigo próximo pede gesto + história que não é só convivência (apoio, confidência, costume).
- **Ações contextuais novas**: aproximar-se (a pessoa corresponde, fica morna ou recusa), contar algo que importa (aprofundar), tomar distância / pôr limites (o mundo respeita: sem chamados, sem "pede atenção", reversível), e as do ex.
- **Papéis importam**: ex não recebe "passar a tarde", "viajar para ver", "mandar mensagem", "conversar", "desabafar"; recebe conversar sobre o que ficou, combinar as coisas dos filhos (co-parentalidade), propor ficarem amigos (a outra pessoa pode recusar), cortar contato. Ao terminar, o vínculo vira "afastado" (o que eram antes não volta sozinho).
- **Distância**: parceria em outra cidade tem "Conversar sobre a distância" e o chamado `distancia_casal` → decisão `rom_distancia` (mudar para lá, chamar a pessoa — ela decide —, seguir à distância, terminar). "Propor morar junto" à distância explica por que não dá antes de decidir onde.
- **Aperto resolvido não é esquecido**: quando o amigo desempregado arrumava trabalho dentro do ano, a relação "esquecia" que você não apareceu. Agora o aperto fica marcado como resolvido até ser lembrado.

**Pede atenção**: cada sinal tem escopo. Global (em todas as áreas, no máximo dois): gravidez conhecida, perda do último ano, pedido de ajuda, conversa do casal, distância do casal, aperto de quem é núcleo, briga em casa. O resto mora em Pessoas. Luto de mais de três anos sai; "sem se falarem" só para relações que foram próximas (o pai que nunca esteve por perto não é tratado como amigo esquecido) e nunca para quem você afastou.

**Gravidez**: a concepção caía em qualquer mês do ano; em ~⅓ dos casos a gravidez era descoberta e o bebê nascia no mesmo passo — o bebê "surgia do nada". Agora a concepção cai 2–5 meses antes do aniversário: a gravidez existe no mundo (Linha da Vida, "Pede atenção" global) por um ano e o bebê nasce no seguinte, com genitores e vínculo.

## 9. Política (frequência e contexto)

A porta "associação de moradores" chegava a ~30% das vidas (qualquer igreja contava como vida comunitária). Agora: comunidade pede voluntariado há ≥2 anos, habilidade comunitária real ou liderança; sindicato e servidor pedem liderança/sociabilidade; notoriedade usa a notoriedade do motor; o intervalo mínimo entre convites passou de 8 para 10 anos, a chance máxima de 12% para 8%, e **quem recusa duas vezes não é mais procurado**. Sem contexto, ainda existe um convite inesperado raro (0,15%/ano). O caminho deliberado (`pol_aproximar` → filiação → candidatura) não mudou. Partidos reais preservados; nenhuma mecânica favorece lado.

## 10–11. Base profissional e carreiras comuns

Infraestrutura única (`sistemas/oficios` + `conteudo/oficios`) para direito, odontologia, educação, enfermagem/medicina, engenharia, contabilidade, jornalismo, psicologia e TI: **área** (`Emprego.especialidade`, vai junto para o próximo emprego), **desafio** contextual de dois em dois anos (encarar pode dar certo — feitos, desempenho, clientela, clima — ou não — cabeça, desempenho), **conta própria** (CLT com estrada → autônomo com clientela inicial pelos feitos), **virar dono** (autônomo lotado → abrir consultório/escritório). Feitos e área entram no desempenho (→ promoção). Novos negócios: consultório odontológico e escritório de advocacia; nova ocupação "dentista com consultório próprio".

## 12. Esporte

- **Posição** (goleiro, lateral, zagueiro, volante, meia, ponta, atacante): escolhida na base (`esp_posicao`, com a sugestão de quem viu jogar e o que cada uma pede), persistida, decide as métricas, o auge físico e o risco de lesão.
- **Técnica ≠ condicionamento**: academia não ensina futebol (testado); o treino do clube conta **uma vez** no condicionamento (proporcional à lesão e ao foco) e na técnica.
- **Futebol deixa de ser lazer**: ao profissionalizar, a rotina "treino de base" sai do tempo livre (não conta duas vezes na semana nem no corpo) e não pode voltar como atividade da mesma modalidade.
- **Temporada** anual com poucos números: divisão, colocação, jogos, titularidades, gols, assistências, desarmes / jogos sem sofrer gol, meses fora, nota. Outros esportes: competições e pódios.
- **Consumidores**: nota → reputação (nome no mercado) → titularidade → interesse de clubes (proposta, empréstimo) → salário → notoriedade → biografia (primeira temporada, destaque, título).
- **Salário** por fonte única: divisão × titular/reserva × reputação × fase (titular da elite ≈ R$ 107 mil; reserva da divisão de acesso ≈ R$ 4,5 mil nas simulações).
- **Sem aposentadoria por idade fixa**: o fim por idade (33/31) foi removido. O corpo declina depois do auge da posição (preservar dá anos; forçar tira), a temporada mostra, o mercado lê. Renovação: renovar, aceitar divisão menor, testar o mercado, encerrar; sem proposta, fica **sem clube** esperando — e a carreira pode acabar porque ninguém chama.
- **Pós-carreira**: técnico de futebol (nível 5, acima do auxiliar), auxiliar técnico também para quem teve nome (sem curso, mais raro).
- A recessão fala do clube (patrocínio, janela, salários atrasados), não de "reuniões de corte".

Achado da simulação: com uma lesão nova todo ano (decisão de prioridade maior), a **renovação de contrato nunca abria** e o contrato vencido valia para sempre (jogadores de 48 anos com nota mínima empregados). Agora, vencido há um ano sem conversa, o clube decide: prorroga por um ano se ainda quer; senão, a pessoa fica sem clube.

## 13. Artes

"Lançar um trabalho" cria uma **obra** (`caminhos.obras`) com recepção (passou em branco, achou público, repercutiu, marcou) que nasce da habilidade, do público, pouco da predisposição e do acaso; consumidores: renda, público do projeto, clientela, notoriedade, convite de festival, Linha da Vida quando marca.

## 14. Política como carreira

A base já tinha mandato com prioridade, comunidade, crises (chuva, greve, verba, obra, aliado, votação, pedido), cobrança de campanha, conflito com negócio. Mudança: crises de mandato legislativo 14% → 20%/ano, e o fechamento do ano do mandato.

## 15. Negócio

Autônomo ≠ dono: o vínculo diz "por conta própria (sem empresa)" ou "dono do próprio negócio"; a ação do autônomo lotado diz o negócio da profissão ("Montar um consultório odontológico, com equipe (virar dona)") e abre o fluxo de abertura existente (investimento, caixa, faturamento, retirada, estratégia, equipe, crise, fechamento).

## 16. Notoriedade

anônimo → conhecido localmente → reconhecido → famoso → muito famoso, derivada de esporte (reputação × divisão × titularidade), arte (público + obras que repercutiram), política (reputação × escopo do cargo), negócio (reputação × porte × unidades). Sobe depressa, cai devagar; Linha da Vida quando muda de patamar e quando o nome esfria.

## 17. Financeiro

Um número por conceito, com nome: Trabalho "No bolso: R$ X/mês (bruto R$ Y)"; Dinheiro "Salário líquido (média do mês, com 13º e férias)"; atleta "Salário do contrato: R$ Y/mês, bruto" (o painel mostrava o bruto como "No bolso", ao lado do líquido com o mesmo rótulo). Patrocínio e publicidade entram como linha própria.

## 18. Migração / save

`VERSAO_SAVE` **16 → 17**. `migrarV16` (determinística, idempotente): atleta profissional perde a rotina de base duplicada, ganha posição (a mesma que o jogo sugeriria, da semente) e reputação derivada do que já se sabe; o salário do contrato assinado é mantido; notoriedade derivada do estado; sobrecarga, gestos, distância, temporadas e obras começam vazios (nenhum passado inventado). A cadeia antiga passou a ir até a v16 e daí para a v17 (`interpretarAte16`). Validação v17 dos campos novos. Três saves v16 **reais** (gerados na worktree de `e01ac33`; o do jogador reproduz o bug `futebol:3` no tempo livre) migram, vivem 3 anos, salvam e reabrem iguais.

## 19. Testes adicionados/alterados

- `fixPosRework2.test.ts` (28): lesão → saúde/condicionamento/treino/temporada/humor/decisão/save; tratar × sacrifício em 16 vidas; sobrecarga (leitura, anos, saúde, desempenho, pergunta, alívio, sem "energia"); horas extras no ano certo; colega não vira amigo sozinho; gesto correspondido e recusa; chamado de aproximação; ex (ações, filhos, amizade aceita/recusada); distância (decisão, a outra pessoa decide, mudar mantém o namoro); amizade enfraquece e distância é respeitada; "Pede atenção" (luto antigo, pai ausente, escopos); política sem contexto × com contexto, convite raro, recusas; mandato com ações e fechamento; futebol (técnica ≠ condicionamento, rotina de base, posição e métricas, reputação e mercado, salário de fonte única, declínio, sem idade fixa, fim por falta de clube, contrato que caduca, recessão, leitura técnica); arte (recepção, notoriedade, patrocínio, fechamento); negócio (autônomo ≠ dono, abrir, faturar, fechar); profissão comum (área, desafio, feitos, conta própria); gravidez persiste até o nascimento; fases; migração com saves v16 reais; determinismo.
- `ui/fixPosRework2.test.tsx` (5): salário/temporada/posição do atleta em Trabalho, sem "treino de base" em Tempo livre; lesão em Trabalho e Você; fechamento do ano; semana sobrecarregada (tela = motor); ficha do ex.
- Testes antigos ajustados **só na premissa**, com comentário (versão 16→17; sementes cuja vida mudou com a nova sequência do gerador — decisão no meio do ano, tratamento já na fila, parceria preexistente, morte na adolescência, margens estatísticas; o teste de intervalo político passou a checar os novos limites; o susto do diabetes passou a ser medido em cinco vidas em vez de uma).

## 20. Resultado dos testes

**664/664** (25 arquivos). Baseline: 631/631.

## 21. TypeScript

`tsc --noEmit`: limpo.

## 22. Build

`npm run build`: ok, sem aviso de tamanho e **sem ciclo entre pacotes** (um ciclo motor ↔ conteúdo introduzido no meio do trabalho foi corrigido movendo a tabela de ofícios para `sistemas/`). `build:itch` ok; smoke do itch.io **18/18**. Checagem visual (Playwright, 390 e 1440): atleta em Trabalho e Você, semana carregada em Tempo livre — sem rolagem horizontal nem erro de página.

## 23. Simulações (`scripts/sim/fixPosRework2.ts`, 40 vidas por grupo, só ações do jogador)

**Política (até 60)**

| grupo | recebeu convite | entrou | candidatou | elegeu |
| --- | --- | --- | --- | --- |
| A sem intenção nem contexto | 8% (0,08/vida) | 0% | 0% | 0% |
| A2 sem intenção, voluntária desde os 18 | 95% (1,38/vida; recusou) | 0% | 0% | 0% |
| B perseguindo política desde os 20 | — | 100% | 100% | 100% |

Antes (sonda na base, jogador aleatório): 30% das vidas recebiam o convite do bairro, 22 convites em 40 vidas.

**Amizades** (conhecido · colega · amigo · próximo, sem família):

| jogador | 25 | 35 | 45 | 60 |
| --- | --- | --- | --- | --- |
| passivo (nunca reage) | 4,2 · 6,2 · 0,8 · 1,3 | 4,8 · 10,1 · 1,6 · 0,4 | 5,4 · 12,9 · 1,8 · 0,3 | 5,6 · 12,3 · 2,0 · 0,3 |
| típico | 6,3 · 5,5 · 1,2 · 1,4 | 7,3 · 9,6 · 2,2 · 1,4 | 7,6 · 11,2 · 2,5 · 1,4 | 7,2 · 13,1 · 2,0 · 2,0 |
| sociável | 6,8 · 4,9 · 3,1 · 1,9 | 6,1 · 4,9 · 2,1 · 2,5 | 6,1 · 4,6 · 1,8 · 2,6 | 5,9 · 3,9 · 1,6 · 2,6 |

Convivência produz conhecidos e colegas; só parte vira amizade; a rede muda ao longo da vida (afastados crescem). Antes, o jogador aleatório chegava aos 45 com 4,5 amigos, quase todos "da atividade", sem ter feito nada por eles.

**Esporte**: treino deliberado × diversão — técnica aos 16: 54,5 × 30,8; peneiras 1,08 × 0; base 10% × 0%; nenhum contrato em 40 vidas (continua raro). Carreira profissional (40 vidas, contrato aos 20): 14,4 anos; fim aos 34,4 em média (22–42); 75% jogam depois dos 32; 30 passam por "sem clube"; fim por falta de mercado 18, por escolha 21; 1,5 lesão por carreira; 13 temporadas registradas; maior divisão 3,5; titular da elite ≈ R$ 107 mil × reserva do acesso ≈ R$ 4,5 mil; 20/40 (a amostra é de jogadores fortes, quase todos na elite) chegam a "famoso".

**Sobrecarga (20–40)**: leve × carregada (trabalho + horas extras + faculdade integral) × carregada que alivia quando a vida pergunta — anos sobrecarregada 0,3 × 7,2 × 5,8; saúde aos 40 76,5 × 73,4 × 74,1; bem-estar 56 × 52 × 55; cabeça 30 × 47 × 43; desempenho 62 × 79 × 77 (horas extras rendem). O sistema percebe a diferença sem destruir a vida carregada.

**Carreiras (10 anos a partir dos 24)**: decisões de carreira/ano e ações à mão — advogada 0,38 / 5,2; dentista 0,38 / 4,2; arte 0,55 / 5,6 (4–5 obras); esporte 0,48 / 4,7 (10 temporadas com estado próprio); política 3,2 / 8,5; negócio 0,12 decisões mas 8,5 ações de gestão. A profissão comum deixou de ser só salário (área, feitos, saída para a conta própria); as especiais têm mais estado e mais decisões.

## 24. Contradições encontradas e corrigidas (auditoria curta "janela 1 × janela 2")

| Janela 1 | Janela 2 | Fonte divergente | Correção |
| --- | --- | --- | --- |
| Painel do atleta: "No bolso" = bruto | Topo de Trabalho: "No bolso" = líquido | dois cálculos, um rótulo | `remuneracaoDe`; painel mostra "Salário do contrato, bruto" |
| Trabalho: líquido do mês | Dinheiro: "Salário" = média com 13º | mesmo rótulo, conceitos diferentes | rótulos explícitos |
| Contrato/renovação/transferência | salário | duas tabelas copiadas | `salarioDoContrato` |
| Tempo livre: "treino de base, todo dia" | Trabalho: jogador profissional | rotina de base sobrevivia à profissionalização (e a semana contava duas vezes) | treino é do clube; migração v17 |
| Cabeçalho: "Juventude" aos 28 | motor: adulto | dois limites de fase | tabela única |
| "Se destaca nos campeonatos" | peneira: "abaixo do nível de base" | duas réguas sem dizer qual | a leitura diz as duas |
| Vínculo: "por conta própria" | tela do negócio (dono) | vínculo lia só o tipo de contrato | "dono do próprio negócio" |
| Tempo livre: "Sobra espaço para uma coisa leve" | a faixa: "passa da semana" | título lia a folga mínima garantida | título lê o excesso fixo |
| Semana mostra horas extras | cabeça/sobrecarga não contam | zeradas antes do equilíbrio | zeradas no fim do ano |
| Recessão: "corte nas reuniões" | jogador titular | texto de escritório para todo emprego | texto por tipo de trabalho |
| Você: condicionamento → "Tempo livre" | atleta treina no clube | link fixo | aponta para Trabalho |
| Contrato vencido havia anos | seguia empregado (e titular no painel) | a renovação nunca abria (outra decisão ocupava o ano) | caducidade decidida pelo clube |

## 25. Pendências legítimas (limitações)

- Uma decisão prioritária por ano continua sendo a regra do motor: decisões concorrem (a lesão tem precedência). A caducidade do contrato resolve o caso do esporte; outros processos com prazo podem merecer a mesma proteção.
- Negócio aparece com poucas *decisões* por ano porque sua profundidade está nas ações de gestão; não foi criado conteúdo novo de negócio.
- A notoriedade esportiva é alta para quem é titular da elite por anos (realista), o que torna "famoso" comum entre os poucos que chegam lá.
- Posição de saves antigos é derivada da semente (a que o jogo sugeriria), não escolhida.

## PENDÊNCIAS ENCONTRADAS

Fora do escopo, não implementadas:

1. **Estilo de vida × "No limite"**: na captura do atleta, a segurança do dinheiro mostra "No limite" com sobra mensal de R$ 2.282 e R$ 5.300 na conta (o critério da segurança parece ler reserva em meses de despesa, não o fluxo). Merece revisão com o dinheiro (REWORK 3 — vida concreta).
2. **Ações invisíveis por falta de dinheiro**: `acoesDoTrabalho` esconde ações impossíveis (ex.: "Montar um consultório" sem capital). A decisão `ofi_virar_dono` explica, mas a tela não diz "por que não pode" — convém uma camada de "possível depois" no Trabalho.
3. **Fragilidade dos testes antigos à sequência do gerador**: vários testes dependem de uma semente específica; qualquer novo sorteio no ano desloca as vidas de teste. Vale migrá-los para premissas montadas (como os de `cenarios.ts`).
4. **Taxa de eleição do perseguidor político** (100% se elege ao menos uma vez em 40 anos tentando) — plausível para quem tenta todas as eleições por décadas, mas merece calibração com a simulação em massa.

## 26. Deixado explicitamente para o REWORK 3

Lojas (concessionária, motos, bicicletas, imóveis, filtros de orçamento, moradia, consumo); origem, infância, escola, condição socioeconômica, contexto regional, formação e oportunidades educacionais (no Instituto Federal só foi feita a correção pequena: cursos do campus da cidade e chance ligada ao desempenho escolar); caminho criminal completo; redes sociais; conteúdo massivo.
