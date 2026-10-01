# Generalização de carreiras, realizações, histórico, momentos e legado

- Base: `a1e455b` (pacote pós-playtest), branch `claude/fix-pos-rework3-playtest`, sem merge em `main` e sem deploy.
- Save: continua na **v18**. Todos os campos novos são opcionais e validados.
- Fora do escopo, de propósito: América do Sul, ATT4, ATT5 e a simulação final de 1.000 vidas.

## 1. Resumo executivo

A pergunta do pacote era: "uma pessoa que dedicou 20 anos a algo tem uma história diferente de quem nunca fez aquilo?". Antes, a resposta era sim só para o futebol. Agora vale para toda trajetória relevante do VIDA, e a trajetória passada continua sendo da pessoa.

- **O futebol deixou de ser exceção de arquitetura.** Nasceu uma camada de carreira esportiva (`perfisEsportivos.ts`). Cada modalidade declara a sua estrutura (clube, circuito ou equipe com resultado individual), o que a temporada mede, os seus "fatos do placar", a tabela da carreira e o resumo.
  - Palmarés, prêmios, representação nacional, histórico e legado passaram a ser conceitos comuns.
  - A implementação concreta continua por modalidade.
- **Basquete:**
  - a função decide como a temporada é avaliada (o pivô pelo rebote, o armador pela assistência);
  - há cestinha e líderes estatísticos;
  - propostas vêm de outra equipe, de outra cidade, e a mudança acontece;
  - existe seleção.
- **Tênis:** o ano é jogado torneio a torneio, rodada a rodada. Daí saem vitórias, derrotas, finais, títulos com nome de torneio, melhor fase, marcos de ranking e a equipe do país (o critério é o ranking).
- **Representação nacional generalizada:** seleção (futebol, basquete, vôlei), equipe do país (tênis) e índice com campanha individual (natação, atletismo, luta). Em todas, a fama não entra na conta.
- **Empréstimo de verdade no futebol:** o clube detentor mantém o contrato, o atleta joga no outro clube e depois volta, ou recebe proposta para ficar.
- **Rota tardia emergente:** o campeonato amador (17–24) com teste no time de cima de um clube pequeno. Não há bônus por começar tarde.
- **Trajetórias da vida (`legado.ts`):** esporte (inclusive carreiras arquivadas), atuação, música, escrita, artes, academia, medicina, política, farda, campo, negócio, cada carreira comum e a faculdade.
  - Cada uma tem período, resumo, o que marcou, reconhecimento e o histórico detalhado.
  - A tela de Você ganhou "O que você construiu", com revelação progressiva. A retrospectiva do fim da vida usa o legado.
- **Histórico que antes não existia:**
  - os cargos dentro do mesmo emprego (a promoção apagava o anterior);
  - as guarnições;
  - as safras;
  - a obra acadêmica item a item;
  - o que aconteceu em cada mandato;
  - os anos de palco;
  - os prêmios e indicações (fictícios) de obras e produções;
  - o primeiro papel de protagonista como marco.
- **Career Moments:** 22 modelos novos (eram 24). Cobrem basquete, tênis, vôlei e as individuais, farda, mandato, campo, universidade e preceptoria médica. Nenhum é o mesmo popup com outro substantivo: cada um consulta a função, a estatura, o ranking, o conceito, o capital político, a safra ou o desempenho no curso.
- **Universidade vivida:** iniciação, atlética, centro acadêmico, extensão, empresa júnior e monitoria têm história interna e consequência depois.

**Validação** (detalhes na seção 13):

| Verificação | Resultado |
| --- | --- |
| Suíte completa (Node 22) | **848 testes em 39 arquivos, todos passando**. Na rodada completa, 38 arquivos (834 testes) passaram e o `interface.test.tsx` não subiu por timeout de worker do WSL. Rodado isolado: 14/14 |
| Typecheck | `tsc --noEmit` limpo |
| Build | `npm run build:itch` sem aviso de tamanho; o limite não foi aumentado |
| Smoke itch.io | 18/18 |
| Auditoria transversal | 7 modalidades × 20 carreiras, 19.265 textos: 1 defeito real (vocabulário de clube fora do clube), corrigido. Sobrou só falso positivo |
| Capturas | 12 em 1440/820/390 px, sem rolagem horizontal nem erro de página |

## 2. Arquitetura anterior

| Peça | Como era |
| --- | --- |
| `esporte.ts` | Uma carreira em `caminhos.esporte` (uma só por vez). O basquete e o tênis tinham estatísticas próprias na temporada, mas eram lidos como futebol. |
| `palmares.ts` | `avaliarTemporada` era posicional só no futebol. Fora dele valia a nota. Os prêmios eram genéricos e o artilheiro era só do futebol. |
| `selecao.ts` | Só futebol (`if (modalidade !== 'futebol') return`). |
| Tênis | Vitórias = jogos × aproveitamento e títulos por fórmula. Não havia finais, torneios nem histórico por ano. Os títulos entravam agregados ("2 torneios vencidos"). |
| Basquete | As propostas eram "a mesma equipe, num nível acima ou abaixo": nenhuma troca de equipe nem de cidade. |
| UI "A carreira no esporte" | Tabela por clube com colunas de futebol para todos (o tênis aparecia como "clube: academia de tênis"). |
| Situações | Trajetórias: futebol, medicina, academia, cena, negócio, autônomo e emprego. Militar, política, rural, outros esportes e universidade não tinham situações. |
| Trocar de carreira | Uma carreira esportiva nova sobrescrevia `caminhos.esporte` (o palmarés ficava, a tabela e a seleção sumiam). A promoção trocava `ocupacaoId` no lugar e o cargo anterior se perdia. |
| Legado | A retrospectiva tinha "N anos de trabalho como X", o negócio e os mandatos. Não havia leitura por trajetória. |

## 3. Arquitetura nova

```
perfisEsportivos.ts   PERFIS[modalidade] { estrutura, coletivo, unidade, disputas }
                      avaliarPelaModalidade · lideresDaTemporada · historicoDaCarreira · resumoDaCarreira
                      daCompeticao / aCompeticao (o artigo certo: "do NBB", "da Série A")
esporte.ts            jogarCircuito (tênis torneio a torneio) · emprestar / voltarDoEmprestimo
                      rota amadora (MODALIDADES_AMADORAS, entrarPeloAmador)
                      arquivarCarreiraEsportiva / carreirasEsportivas
palmares.ts           avaliarTemporada → perfil fora do futebol · títulos individuais · líderes
selecao.ts            representacaoDe(modalidade) · olharDaModalidade · torneioDoAno · disputarProva
situacoes.ts          + basquete, tenis, atleta, militar, politica, rural, universidade
legado.ts             trajetoriasDaVida(v) → TrajetoriaDaVida[] · legadoEmFrases(v)
ui/jogo/Trajetorias   "O que você construiu" (Você)
```

Princípios:

- **Não há objeto universal cheio de campos irrelevantes.** A `Temporada` guarda o que cada modalidade produz (os campos opcionais pertencem a quem os usa), e o perfil sabe lê-los.
- **Uma modalidade nova é um perfil novo, não outra carreira.** Vôlei com estatística, natação com tempos, automobilismo: cada um ganharia avaliação, líderes, tabela e resumo próprios.
- **Legado é leitura, não estado novo.** Tudo sai do que as carreiras já guardam. O estado novo é só o que não existia em lugar nenhum: postos, guarnições, safras, obra acadêmica, marcos do mandato, anos de palco, prêmios de obras, carreiras arquivadas e empréstimo.
- **Histórico ≠ biografia.**
  - O detalhe (todas as temporadas, todas as produções, todos os artigos) fica no histórico da trajetória.
  - A Linha da Vida recebe só os marcos.
  - O motor decide o que é memória pelo peso (`pesoDaConquista`, os pesos das realizações), não pela ordem.

## 4. O que foi generalizado

| Conceito | Antes | Agora |
| --- | --- | --- |
| Avaliação da temporada | posição (futebol) / nota | posição (futebol), função (basquete), aproveitamento, finais e títulos (tênis), pódios e colocação (individuais) |
| Prêmios | genéricos + artilharia | seleção do campeonato (com posição ou função), melhor jogador / atleta do ano, revelação, artilharia, cestinha e líderes em rebote e assistência, que disputam a liga inteira (nem todo ano é seu) |
| Título | do clube, com papel | do clube (coletivas); do atleta (individuais: "Campeã do circuito nacional de natação"); por torneio (tênis) |
| Final | — | `ConquistaEsportiva.tipo = 'final'` (tênis) |
| Acesso / rebaixamento | futebol e basquete | toda modalidade de clube (também o vôlei) |
| Representação nacional | futebol | todas, com critério próprio (seção 6) |
| Histórico | por clube, colunas de futebol | por clube ou por equipe (com as colunas da modalidade) ou ano a ano (tênis, individuais) |
| Resumo da carreira | — | "17 temporadas, 4 clubes, 512 jogos, 61 gols" · "16 anos de circuito, 344 vitórias e 259 derrotas, 7 títulos, 20 finais, melhor ranking 22º, R$ 7,4 mi em prêmios" |
| Momentos | futebol | toda modalidade |
| Propostas | clube real (futebol) | futebol: clube real · basquete e vôlei: equipe de outra cidade (nome descritivo, nunca marca) · empréstimo e compra |
| Carreira anterior | sobrescrita | arquivada (`caminhos.carreirasEsportivas`) e lida pela tela, pelo palmarés e pelo legado |

## 5. Esportes cobertos

| Modalidade | Estrutura | O que a temporada mede | Prêmios e líderes | Representação | Mercado | Momentos |
| --- | --- | --- | --- | --- | --- | --- |
| Futebol | clube | posição (já existia) | seleção do campeonato, melhor, revelação, artilharia | seleção | clube real, empréstimo, compra, liberação | 9 (já existiam) |
| Basquete | clube | função: armador, ala, pivô (estatura) | seleção do NBB "como pivô", melhor, revelação, cestinha, rebotes, assistências | seleção de basquete | equipe de outra cidade | último ataque (por função), poucos minutos, briga no vestiário |
| Tênis | circuito | chaves rodada a rodada: V–D, finais, títulos, melhor fase, ranking | marcos: primeiro título, estreia no circuito principal, top 100 e top 10 | equipe do país (ranking) | — (premiação) | tie-break, equipe técnica, dor no ombro |
| Vôlei | clube | nota e participação (sem estatística própria) | seleção, melhor, revelação | seleção de vôlei | equipe de outra cidade | o saque do tie-break |
| Natação, atletismo, luta | equipe (resultado individual) | pódios e colocação na prova que importa | atleta do ano, revelação | índice → mundial, jogos multiesportivos, continental: eliminatória → final → medalha | — | a final, o índice |

**O que falta, documentado:**

- o vôlei não tem estatística própria (ataques, bloqueios);
- as individuais não têm tempos e marcas;
- natação, atletismo e luta não têm propostas de equipe (seguem com a equipe da cidade);
- não há empréstimo fora do futebol.

A arquitetura comporta todos esses itens como dados do perfil.

## 6. Representação nacional

`processarSelecao` roda para toda modalidade (e, no tênis, depois do ano de circuito). O mérito decide. A fama não entra: o teste B compara a mesma vida com notoriedade 0 e 95, e o olhar é idêntico.

| Tipo | Critério | Limiares (radar · convocação · titular) | Torneios (no universo do jogo) | Campanha |
| --- | --- | --- | --- | --- |
| Futebol | o de antes | 66 · 76 · 84 | mundial, continental | da seleção (forte) |
| Basquete, vôlei | reputação + temporada avaliada + divisão + idade e lesão + prêmios − concorrência da função | 66 · 76 · 84 | mundial, multiesportivos, continental | basquete com força média; vôlei com a força do futebol |
| Tênis | ranking (escala logarítmica) + forma + idade | 60 · 67 · 76 | competição mundial por equipes (todo ano) | o país raramente vence (2%) |
| Individuais | temporada + reputação + nível + idade e lesão | 62 · 72 · 82 | mundial (anos ímpares), multiesportivos, continentais | individual: a margem acima do índice decide final ou medalha |

A força do país por modalidade corrige um defeito encontrado na simulação: com os pesos do futebol, o Brasil ganharia a competição de tênis por equipes a cada oito anos.

## 7. Carreiras cobertas (histórico e legado)

| Trajetória | Histórico detalhado | O que vira biografia |
| --- | --- | --- |
| Esporte (cada carreira) | tabela por clube ou equipe, ou ano a ano; títulos; finais; prêmios; pelo país; momentos | título da elite como protagonista, título pela seleção, medalha, braçadeira, primeira convocação, prêmios de peso, top 10 |
| Esporte de base (sem profissional) | — | "N anos na base do X; dispensado antes do profissional" (fracassar também é biografia) |
| Atuação | todos os trabalhos (título, tipo, papel, casa, repercussão, indicação); gente que ficou | primeiro protagonista, prêmio, indicação, produção que marcou |
| Música, escrita, dança, artes visuais | discos e livros, anos de palco, grupos | obra que marcou, prêmio, ano de turnê (40+ apresentações) |
| Academia | formação, posições, artigos (com revista e impacto), livros, orientações, congressos, projetos e financiamentos | doutorado, prêmio de pesquisa, artigo de referência, livro |
| Medicina | formação e residências, onde trabalhou, momentos | formatura, residência, chefia. **Sem número de pacientes nem "vidas salvas"** (teste F) |
| Política | eleições, cada mandato (como acabou, aprovação, marcos), partidos | mandatos, entregas que saíram do papel. O resumo diz por onde entrou ("com o nome conhecido do esporte") |
| Farda | postos, guarnições, momentos | promoções, cursos de carreira, elogios em boletim, reserva |
| Campo | safra a safra | compra da terra, cooperativa, a pior sequência de safras |
| Negócio | — | abertura e fechamento, momentos |
| Emprego comum (por trilha) | onde trabalhou, com os cargos de cada lugar ("assistente → analista → contadora, na Distribuidora Paulista") e o motivo de cada saída | promoções (dos próprios postos), liderança, demissões, aposentadoria |
| A faculdade | o que viveu além das aulas (etapa, papel, feito, último marco) | diploma, feitos das atividades |

## 8. Arte e audiovisual

- **Indicação e prêmio** (`indicacaoDoTrabalho`):
  - só para trabalho que repercutiu (repercussão ≥ 2);
  - a chance cresce com o papel (protagonista > coadjuvante > elenco) e o porte;
  - vencer depende da técnica e de a produção ter marcado;
  - os nomes são genéricos e fictícios ("o prêmio da crítica de televisão", "o prêmio de interpretação de um festival de cinema");
  - vencer dá um pouco de notoriedade.
- **Primeiro papel de protagonista:** marco único na Linha da Vida.
- **Obras próprias:** a obra que marca pode ser indicada a um prêmio (música independente, literário, teatro ou dança da cidade).
- **Palco:** `caminhos.palcos` guarda os anos de apresentação. Antes ficava só o último.
- **Currículo:** o limite subiu de 40 para 80 trabalhos (uma carreira de 40 anos cabe inteira).
- **Correções:**
  - comissão e despesas eram arredondadas a R$ 100; num trabalho pequeno, o agente não levava nada. Agora o arredondamento é a R$ 10;
  - `concluirProducao` não conclui duas vezes o mesmo contrato.

## 9. Career Moments: expansão

São 22 modelos novos, no mesmo motor (intenção → distribuição pelo estado → desfecho → efeito → memória). Os efeitos novos por trajetória são:

- **política:** o `nome` vira aprovação do mandato, e entram `apoio` e `desgaste`;
- **universidade:** o `nome` vira desempenho no curso;
- **campo:** o `nome` vira a renda da terra.

| Trajetória | Modelos | O que consultam |
| --- | --- | --- |
| Basquete | último ataque (as intenções mudam pela função: o pivô joga de costas ou briga pelo rebote; o armador infiltra ou acha o pivô; o ala arremessa de três), poucos minutos, briga no vestiário | técnica contra a divisão, estatura, fôlego, leitura, cabeça, liderança |
| Tênis | tie-break, equipe técnica (R$ 18 mil do bolso), dor no ombro (a lesão real pode vir) | técnica, fôlego, coragem, caixa, saúde |
| Vôlei e individuais | saque do tie-break; final nacional (por modalidade); índice (a lesão pode vir) | técnica, fôlego, leitura, saúde |
| Farda | operação de apoio (enchente, deslizamento, seca: elogio em boletim), soldado em crise familiar, curso longe de casa | conceito, disciplina, leitura, liderança, clima com o comando. **Nada de combate** (teste H) |
| Mandato | audiência pública, projeto travado (a entrega registrada no mandato), entrevista ao vivo | experiência política, capital político, base, desgaste |
| Campo | hora de vender (atravessador, esperar ou cooperativa), a máquina, estiagem (só depois do ano ruim) | anos de lida, caixa, safras, cooperativa |
| Universidade | trabalho em grupo, prova e processo de estágio na mesma semana (o ótimo **abre a vaga de estágio de verdade**), convite da professora (o ótimo **abre a iniciação científica**) | desempenho no curso, cabeça, disciplina, sociabilidade |
| Medicina | o residente (preceptoria) | competência, jeito com gente, clima |

**A fama amplia, não decide.** Na entrevista ao vivo, a notoriedade aumenta o risco: o espalhamento para ótimo e péssimo cresce. A chance de dar certo não muda. O teste G verifica o mesmo sucesso e mais extremos.

## 10. Universidade como experiência vivida

`arcos.ts` ganhou seis histórias. As consequências que já existiam foram preservadas pelo mesmo nome do feito.

| Atividade | Etapas | Consequência |
| --- | --- | --- |
| Iniciação científica | leitura → coleta → resultados (ou "o experimento não deu") → congresso → artigo | `pesoNaPesquisa` (mestrado e doutorado), vagas de pesquisa |
| Atlética | treinos → equipe → jogos universitários → título; diretoria | treina a modalidade e o corpo; liderança |
| Centro acadêmico | reuniões → chapa → eleição (ganha ou perde) → coordenação → mobilização (uma pauta concreta) | `gremio_eleito` → porta da política estudantil; liderança |
| Extensão | participante → frente → chegou à comunidade → coordenação | prática de comunidade; vagas na área |
| Empresa júnior | trainee → consultor → projeto com cliente → diretoria | currículo para administrativo, comércio e finanças; liderança |
| Monitoria | monitor → turmas → referência na disciplina | nota (já existia) e vagas de educação |

## 11. Simulação por idade de início (futebol)

`scripts/sim/generalizacao.ts` (`SO=I`, 150 vidas por grupo, até os 27). Os agentes são dois, sempre pelo que o jogador pode fazer:

- **dedicação alta:** futebol na semana em ritmo de treino, time da escola dos 9 aos 15, treino de fundamentos todo ano, pedir teste, aceitar peneiras e convites;
- **dedicação regular:** só o futebol na semana.

Antes da idade de início, futebol não entra na vida. O "antes" é o mesmo script no código anterior às mudanças deste pacote.

| início | dedicação | base (antes → depois) | profissional (antes → depois) | idade do 1º contrato | técnica aos 17 · 20 |
| --- | --- | --- | --- | --- | --- |
| 7 | alta | 73% → 73% | 53% → 62% | 18 → 19 | 83 · 85 |
| 7 | regular | 15% → 17% | 7% → 8% | 19 → 20 | 62 · 67 |
| 10 | alta | 68% → 68% | 41% → 46% | 18 → 19 | 78 · 83 |
| 10 | regular | 1% → 1% | 1% → 3% | 18 → 24 | 53 · 61 |
| 12 | alta | 41% → 42% | 25% → 32% | 19 → 19 | 69 · 77 |
| 14 | alta | 7% → 7% | 3% → 8% | 20 → 21 | 53 · 68 |
| 16 | alta | 0% → 1% | **0% → 1%** | — → 23 | 23 · 54 |
| 12, 14, 16 | regular | 0% | 0% | — | — |

Por facilidade de nascença (dedicação alta, depois):

| início | baixa | média | alta | excepcional |
| --- | --- | --- | --- | --- |
| 7 | 17% | 85% | 90% | 85% |
| 10 | 2% | 54% | 77% | 78% |
| 12 | 2% | 22% | 80% | 91% |
| 14 | 0% | 2% | 25% | 31% |
| 16 | 0% | 0% | 2% | 5% (1 de 20) |

Rota de quem se profissionalizou:

| início | pela base | pela rota amadora |
| --- | --- | --- |
| 7 | 94 | 11 |
| 10 | 65 | 9 |
| 12 | 42 | 6 |
| 14 | 7 | 5 |
| 16 | 0 | 1 |

Leitura (sem taxa "correta" definida antes):

- **Há gradiente de oportunidade.** Começar cedo dá mais tempo de técnica: aos 17, a mediana é 83 para quem começou aos 7 e 23 para quem começou aos 16. Isso vale mais vagas na base e contratos mais altos (68% começam na Série B ou acima, quando o início é aos 7).
- **Dedicação pesa tanto quanto a idade.** Com só o futebol da semana, mesmo quem começa aos 7 chega a 8%.
- **O sistema não exige começar aos 7.** Aos 12, a facilidade alta ainda dá 80%. Aos 14, a facilidade alta dá 25%.
- **Começar aos 16 deixou de ser matematicamente impossível.** Antes eram 0% (inclusive com facilidade excepcional, técnica 68 aos 20); agora é 1%. Os casos que existem são excepcionais: facilidade alta, contrato aos 23–24, estadual ou acesso.
- **A rota tardia emerge da técnica construída.** A régua é a técnica de titular do estadual (`barraDeTitular('futebol', 1)`), não a idade. A técnica não muda ao entrar pela rota (teste A).
- **Calibragem.** A primeira versão da rota amadora era larga demais (7 anos: 53% → 66%; e, num teste antigo, 5 profissionais pela rota amadora contra 7 pela base). Foi apertada duas vezes: régua de titular do estadual e chance anual até 25%. O teste de raridade agora exige que a rota amadora seja minoria.

## 12. Empréstimos (implementados)

- **Estado:** `CarreiraEsportiva.emprestimo { clube, municipioId, nivel, desde, ate }` (o clube detentor) e `Temporada.emprestado`.
- **Oferta:** jovem (≤ 23), reserva, com menos de 30% dos jogos como titular, divisão ≥ 2, com ao menos 12 meses de contrato. Um clube da divisão abaixo, de preferência no mesmo estado.
- **Decisão `esp_proposta` (origem `emprestimo`):**
  - mostra o clube, a cidade, a divisão, o prazo e o ano previsto da volta;
  - deixa explícito que o salário continua o do contrato e que quem recebe divide a conta;
  - opções: aceitar ou ficar e brigar pela vaga.
- **Aceitar:**
  - o prazo do contrato com o detentor não muda;
  - o empregador vira "o Náutico (emprestado pelo Sport)";
  - muda de cidade se preciso;
  - a temporada é do clube onde se joga.
- **Fim do prazo:**
  - **volta ao detentor**, com a cidade e a divisão do detentor. A vaga não é garantida (o espaço é recalculado pela técnica). A Linha da Vida registra "Voltou ao Sport depois do empréstimo ao Náutico: 34 jogos por lá.";
  - **ou proposta de compra** (origem `compra`, "Ficar de vez?"), se a temporada foi boa e o mercado comporta. Aceitar encerra o vínculo ("Ficou de vez no Náutico, que comprou o contrato do Sport"); recusar é a volta.
- **Histórico:** a tabela por clube mostra "Náutico (emprestado pelo Sport)" como passagem própria.
- **Diferente de:** transferência (outro contrato), dispensa (sem clube) e liberação (clube menor, contrato novo).
- **Limite:** só no futebol. O mercado de empréstimo das outras modalidades não foi modelado.

## 13. Testes

**Novos: `src/motor/__tests__/generalizacao.test.ts`, 20 casos causais.**

| | Atravessa |
| --- | --- |
| A futebol | empréstimo: proposta → decisão (título, clube) → reload → aceitar → detentor, prazo e salário iguais → temporada no clube do empréstimo → volta → cidade → tabela "emprestado pelo" → Linha da Vida → reload. Compra: aceitar encerra o vínculo. Rota amadora: técnica de estadual → o teste aparece → decisões → contrato → origem `amador`, nível 1, técnica igual → reload. Técnica de pelada → o teste não aparece |
| B basquete | pivô medido pelo rebote, armador pela assistência, a mesma linha de números vale diferente por função; proposta de outra equipe e cidade → mudança → biografia com o nome → tabela com rebotes; cestinha; seleção com e sem fama: o mesmo olhar |
| C tênis | doze anos de chaves: derrotas = torneios − títulos; títulos ≤ finais; melhor fase; tabela ano a ano sem coluna de clube; títulos e finais com nome; o ranking decide a equipe do país; reload |
| D atuação | 25 produções → um único marco de primeiro protagonista → prêmio aparece → reload → trajetória com 25 trabalhos e o marco |
| E academia | projeto → artigos (um item por publicação, com título) → reload → sair da universidade → trajetória encerrada com a obra inteira |
| F medicina | formação, residência e dois empregos → título "Medicina — …", "Onde trabalhou" com dois lugares, nenhum número de pacientes nem "vidas salvas" |
| G política | ex-atleta famoso → mandato → a fama amplia o risco sem mudar o sucesso → renúncia → reload → mandato com marcos e "renunciou" → as trajetórias esporte e política lado a lado; um momento ótimo de projeto vira entrega registrada |
| H militar | ingresso → guarnição → transferência → reload → duas guarnições; momentos sem vocabulário de combate; elogio em boletim |
| I emprego comum | promoção na empresa guarda o cargo de antes → demissão → novo emprego → reload → "de assistente a analista", "assistente → analista, a Construtora Litoral", "Saiu da Construtora Litoral: demissão…" |
| J trocar de carreira | futebol (título na Série A, seleção) → encerra → base de basquete → as duas carreiras existem → reload → futebol consultável com título e seleção → legado e retrospectiva contam |
| K save antigo | v18 salvo com `esp_proposta` aberta e sem proposta persistida: carrega, "aceitar" não transfere nem inventa clube, novas propostas funcionam |
| L universidade | iniciação passa por ≥ 3 etapas, com marcos; feito → peso na pesquisa; centro acadêmico → porta estudantil; reload |
| M campo | 8 safras registradas → reload → resumo "8 safras" → a estiagem só cabe depois do ano ruim |

**Interface: `src/ui/__tests__/generalizacao.test.tsx`, 3 casos.**

- Você · "O que você construiu": a ex-atleta contadora vê as duas trajetórias, e a tabela só aparece ao abrir o histórico.
- Trabalho · tênis: V–D e Ranking, sem coluna de clube.
- Trabalho · basquete: Rebotes/j e pontos por jogo.

**Testes existentes ajustados por mudança intencional:**

- `caminhos.test.ts` 8: "todo profissional passou pela base" virou "passou pela base **ou** pelo teste do time de cima". A rota amadora também é trajetória, nunca currículo. O teste e o contrato acontecem no mesmo momento (`≤`).
- `caminhos.test.ts` 9–10: a régua de raridade (≤ 25% de quem tentou) continua valendo para a base, e "tentar ≥ 3× conseguir" continua. Somou-se uma exigência: a rota amadora é minoria.
- `fix31.test.ts` 7: a comissão agora é arredondada a R$ 10 (correção acima).
- `pacotePlaytest.test.ts` I: o personagem, ao viver até os 23, pode já ter tido um momento na faculdade. O teste mede o acréscimo desta decisão e confere que o último registro é o do lance.

**Suíte completa (rodada final, Node 22.23.2, `npx vitest run`):**

| | Resultado |
| --- | --- |
| Arquivos de teste | 39 (25 de motor, 14 de interface) |
| Testes | **848, todos passando** |
| Rodada completa | 38 arquivos e 834 testes passaram em 439 s. Um erro de pool: `interface.test.tsx` não subiu (`[vitest-pool-runner]: Timeout waiting for worker to respond`) |
| `interface.test.tsx` isolado | 14/14 passaram (109 s; 52% só para montar o jsdom em `/mnt/c`) |
| Node 20 (padrão do ambiente) | 25 arquivos de motor, 757 testes passaram. Os 14 de interface não sobem (`webidl.util.markAsUncloneable is not a function`): o jsdom pede Node 22, como no pacote anterior |

O timeout é do worker do WSL, não de um teste: nenhuma asserção falhou em nenhuma rodada.

**Typecheck:** `tsc --noEmit` sem erro.

**Build:** `npm run build:itch` em 28 s, sem aviso de tamanho de pacote (tabela na seção 17). O `vida-itch.zip` sai com 14 arquivos (772,5 kB comprimido) e `index.html` na raiz.

**Smoke itch.io** (`npm run smoke:itch`, Chromium real, servido de subdiretório): **18/18**. Assets relativos, montagem do React, pacotes sob demanda vindos do subdiretório, nascer → viver mais um ano, save persistido e recarregado, nenhum erro de rede nem de console.

## 14. Simulações

`npx esbuild scripts/sim/generalizacao.ts --bundle --platform=node --outfile=/tmp/gen.cjs && VIDAS=150 SO=I node /tmp/gen.cjs` (`SO=M` modalidades, `SO=L` legado).

Rodada final, depois das correções da auditoria. As simulações são determinísticas (semente fixa) e reproduziram exatamente os números abaixo e os da seção 11:

| Simulação | Amostra | Tempo |
| --- | --- | --- |
| I · idade de início | 150 vidas × 5 idades × 2 dedicações = 1.500 vidas, até os 27 | 5 min 21 s |
| M · basquete e tênis | 120 carreiras por modalidade, 18 → 34 | 22 s |
| L · legado | 60 vidas até os 70 | 47 s |

Principais resultados por idade de início (dedicação alta; números completos na seção 11):

| início | profissional | 1º contrato (mediana) | técnica aos 17 · 20 | rota amadora (profissionais das duas dedicações) |
| --- | --- | --- | --- | --- |
| 7 | 62% (93/150) | 19 | 83 · 85 | 11 de 105 |
| 10 | 46% (69/150) | 19 | 78 · 83 | 9 de 74 |
| 12 | 32% (48/150) | 19 | 69 · 77 | 6 de 48 |
| 14 | 8% (12/150) | 21 | 53 · 68 | 5 de 12 |
| 16 | 1% (1/150) | 23 | 23 · 54 | 1 de 1 |

Com dedicação regular (só o futebol da semana): 8% aos 7, 3% aos 10 e 0% a partir dos 12. Pelo corpo, aos 14: 3% abaixo da média, 13% acima.

**M · basquete e tênis.** São 120 carreiras a partir do primeiro contrato (18 → 34), com técnica inicial 80+ (uma amostra de quem já é profissional).

| | basquete | tênis |
| --- | --- | --- |
| temporadas (mediana) | 16 | 16 |
| títulos (média · % com) | 0,33 · 30% | 7,7 · 100% |
| finais (média) | — | 11,3 |
| prêmios (média · % com) | 0,68 · 33% | — |
| representação nacional | 29% | 95% |
| equipes por carreira | 4,3 | — |
| melhor ranking (mediana) | — | 31º |
| momentos de carreira (média) | 2,2 | 3,4 |
| trajetória com realizações | 98% | 100% |

- **Achado durante a simulação:** com as chaves jogadas rodada a rodada, o tênis passou de ~1,5 para ~13 títulos por carreira. A rodada seguinte passou a pesar mais (cada adversário é melhor), e a média caiu para 7,7.
- **Ressalva sobre a amostra do tênis:** técnica 80+ e quase todos chegando ao circuito principal. Isso vem da calibragem do ranking que já existia (ver pendências), não deste pacote.
- **Exemplos reais da simulação:**
  - "Basquete profissional (desde 2044): 16 temporadas, 4 equipes, 414 jogos, 11,2 pontos por jogo. Seleção do NBB, como armador (2058)…";
  - "Tênis profissional: 16 anos de circuito, 344 vitórias e 259 derrotas, 7 títulos, 20 finais, melhor ranking 22º, R$ 7.441.600 em prêmios. Campeão de um dos quatro grandes torneios do ano (2056)…".

**L · legado (60 vidas até os 70, seis estratégias de jogador):**

- trajetórias por vida: 3 (mediana);
- acontecimentos na Linha da Vida: 232 (mediana);
- frases da retrospectiva: 4;
- 97% das vidas têm alguma trajetória encerrada ainda consultável.

Exemplo de uma vida (estudiosa, 68 anos, 217 acontecimentos), em cinco linhas:

- **Escritório** (2042–2044)
- **A faculdade** (2043–2047)
- **Educação** (2044–2052): "8 anos, numa creche; auxiliar de creche. Saiu de uma creche: demissão"
- **Dados** (2054–2062): "de analista de dados a cientista de dados. Passou a cientista de dados num banco (2058)"
- **Tecnologia** (2062–2092): "30 anos, 3 lugares (o mais longo: uma consultoria de tecnologia, 15 anos); de desenvolvedora plena a líder técnica"

As estratégias do simulador quase não produzem carreiras especiais (esporte, arte). Essas foram medidas nas simulações dirigidas e nos cenários visuais.

**Cenários visuais** (`scripts/playtest/gerarGeneralizacao.ts` + `generalizacao.mjs`):

- **a veterana de 62 anos:**
  - "Tênis profissional (2047–2057): 11 anos de circuito, 205 vitórias e 200 derrotas, 3 títulos, 13 finais, melhor ranking 203º, R$ 1,2 mi em prêmios";
  - "Contabilidade (2059–2081): 22 anos, na Distribuidora Paulista; de assistente administrativa a contadora";
  - "Vida pública (desde 2081): Entrou com o nome conhecido do esporte. 1 mandato (vereadora). Saiu do papel: as quadras de tênis públicas dos bairros";
- **a atriz:** "11 trabalhos — 4 na TV e no streaming, 4 no cinema… 4 como protagonista. Venceu o prêmio da crítica de televisão por 'A Cidade Acorda'";
- **o pesquisador:** "10 artigos, 5 projetos e 1 financiamento — em biologia";
- **o pivô.**

São 12 capturas a 1440, 820 e 390 px, sem rolagem horizontal (a tabela rola dentro do próprio bloco) e sem erro de página.

### Auditoria transversal (`scripts/sim/auditoriaGeneralizacao.ts`)

`npx esbuild scripts/sim/auditoriaGeneralizacao.ts --bundle --platform=node --outfile=/tmp/aud.cjs && SEMENTES=20 node /tmp/aud.cjs`

A pergunta é se alguma modalidade ainda fala a língua de outra. O script monta uma carreira profissional (18 → 34) em cada uma das 7 modalidades, com 20 sementes. Depois confere tudo o que ela escreve para o jogador: resumo, colunas e linhas do histórico, palmarés, momentos de carreira, legado (título, resumo, realizações, reconhecimento, detalhe), retrospectiva e a Linha da Vida do período da carreira.

Duas checagens:

- **texto quebrado** em qualquer lugar (`NaN`, `undefined`, `null`, `[object …]`, `{chave}` sem preencher);
- **vocabulário de outra modalidade:**
  - gol, artilharia e Série A–D fora do futebol;
  - cestinha, rebote, NBB, pivô e armador fora do basquete (rebote é permitido no futebol);
  - ranking, circuito principal e tie-break fora do tênis;
  - clube e "seleção do campeonato" onde não há clube;
  - "seleção" no tênis.

| modalidade | carreiras | temporadas | textos conferidos |
| --- | --- | --- | --- |
| futebol | 20 | 316 | 2.029 |
| basquete | 20 | 320 | 2.232 |
| vôlei | 20 | 310 | 2.312 |
| tênis | 20 | 320 | 4.069 |
| natação | 20 | 294 | 2.524 |
| atletismo | 20 | 320 | 2.927 |
| luta | 20 | 320 | 3.172 |

**O que a auditoria encontrou:**

- **Texto quebrado:** nenhum.
- **Defeito real: vocabulário de clube em modalidade sem clube.** Antes da correção, em 20 carreiras de natação, 16 terminavam no legado com "…; acabou sem clube". Na Linha da Vida de tênis, natação, atletismo e luta apareciam:
  - "No clube, o patrocínio master não renovou e a diretoria avisou…" (a recessão);
  - "um menino de camisa do clube pediu uma foto" (a fama);
  - "Ficou sem clube, esperando proposta." e "Sem clube, esperando proposta.";
  - "Aos N, nenhum clube renovou" (o fim da carreira).
- **Correção** (pela estrutura do perfil, não por modalidade solta):
  - `semVinculo(d)` em `perfisEsportivos.ts` dá "sem clube", "sem equipe" ou "sem quem banque o circuito";
  - o resumo do legado (`SEM_CONTRATO`): "acabou sem equipe" ou "acabou sem condições de seguir no circuito";
  - o fim de carreira em `esporte.ts`, as memórias de `profissao.ts` e o fechamento do ano usam `semVinculo`;
  - a recessão (`mundo.ts`) tem versão de equipe (ajuda de custo, viagem de competição) e de circuito (premiação dos torneios menores, custo de viagem);
  - a fama na rua (`fama.ts`): "um menino que tinha visto você competir" quando não há clube.
- **Depois da correção:** 2 ocorrências únicas, ambas falso positivo. São o emprego depois da carreira de natação ("Novo emprego: auxiliar técnica num clube."): o nadador que vira técnico trabalha num clube de verdade.
- **Já era genérico** (zero achados antes e depois): "gols" fora do futebol, cestinha e rebote fora do basquete, ranking fora do tênis, "seleção" no tênis.

O que a auditoria não cobre: os textos de decisão (o corpo do popup) das propostas de equipe de vôlei e basquete continuam dizendo "clube" em alguns lugares ("Nenhum clube ligou"). O vôlei e o basquete têm clube, então não é um erro de vocabulário, mas a frase é a mesma do futebol (pendência 11).

## 15. Compatibilidade v18

- **A versão não sobe.** Campos novos, todos opcionais e validados em `validar`:

  | Onde | Campos |
  | --- | --- |
  | `CarreiraEsportiva` | `emprestimo`, `origem` |
  | `PropostaDeClube.origem` | `emprestimo`, `compra` |
  | `Temporada` | `finais`, `melhorFase`, `torneios`, `emprestado`, `funcao` |
  | `ConquistaEsportiva.tipo` | `final` |
  | `TrajetoriaNaSelecao` | `medalhas` |
  | `Caminhos` | `carreirasEsportivas`, `palcos` |
  | `Emprego` | `postos` |
  | `CarreiraMilitar` | `guarnicoes` |
  | `VidaRural` | `safras` |
  | `VidaAcademica` | `producao` (`ItemAcademico`) |
  | Mandato e histórico político | `marcos`, `aprovacao`, `feitos`, `prioridade` |
  | `Obra` e `ItemCurriculo` | `premio` |

- **Saves antigos sem os campos:** o histórico novo começa daqui, sem inventar passado.
  - Os postos de antes de uma promoção antiga não existem: o legado mostra o cargo atual.
  - As safras e guarnições anteriores não foram registradas: o legado usa a guarnição atual quando não há lista.
- **Save antigo salvo no meio de uma proposta (pendência do pacote anterior):** considerada resolvida por compatibilidade segura (teste K).
  - Carrega sem erro.
  - A decisão antiga não executa transferência nem inventa clube.
  - O clube continua o mesmo, sem transferência fantasma na biografia.
  - Novas propostas usam o sistema correto.

## 16. Pendências reais

1. **Tênis:**
   - quem vira profissional com técnica 80+ chega quase sempre ao circuito principal, com ranking mediano 31º e 95% chamados para a equipe do país. A causa é a régua do ranking (`LIMIAR_TENIS`, `rankingTenis`, já existentes), que este pacote não recalibrou. Vale olhar na simulação de 1.000 vidas;
   - a premiação passa de R$ 10 mi em carreiras de topo.
2. **Rota amadora:**
   - existe para futebol, basquete e vôlei, não para as individuais;
   - quem foi dispensado da base também pode usá-la, e isso responde por 5–11% dos profissionais nas amostras de dedicação alta. É plausível (o clube pequeno do estado), mas merece olhar no playtest.
3. **Empréstimo** só no futebol.
4. **Vôlei** sem estatística própria. **Individuais** sem tempos e marcas e sem propostas de equipe.
5. **Música:** não há instrumento ou voz como dado da carreira (a habilidade é da linguagem), nem colaborações nomeadas. As turnês são inferidas do número de apresentações.
6. **Projetos artísticos anteriores:** `caminhos.arte` guarda um grupo por vez. Os grupos anteriores aparecem no legado pelas marcas (entrou e acabou), não como estado completo.
7. **Medicina:** não há escada de cargos própria (chefia de serviço vem de ocupação com nível ≥ 5, quando existe). O histórico é formação, onde trabalhou e momentos.
8. **Política:** a apuração não lê os marcos do mandato (a aprovação e o `feito` continuam sendo a conta). Os mandatos de saves antigos não têm marcos.
9. **Legado:** os títulos de trilha vêm de `ROTULO_TRILHA` ("Escritório", "Dados"). Uma vida com muitos empregos curtos tem várias trajetórias pequenas (o corte é de 2 anos por trilha).
10. **Simulação L:** as estratégias genéricas do simulador quase não perseguem carreiras especiais. A cobertura de esporte, arte e academia no legado foi medida nas simulações dirigidas e nos testes, não numa população natural. Fica para a simulação oficial. Na população natural, as 7 trajetórias políticas (todas ativas) e as 3 militares (encerradas) saem sem nenhuma realização: só o período e o resumo. Cabe olhar se uma candidatura sem mandato ou uma passagem curta pela farda deveriam registrar algo.
11. **Textos de decisão do mercado esportivo:** o corpo das decisões de renovação e proposta ("Nenhum clube ligou", "Só apareceu clube pequeno") é o mesmo para futebol, basquete e vôlei. A Linha da Vida já está correta por estrutura (auditoria). O popup ainda não tem frase própria de basquete e vôlei.
12. **Ambiente:** a suíte completa no WSL em `/mnt/c` pode perder um worker de interface por timeout (`Timeout waiting for worker to respond`). O arquivo passa isolado. Não é falha de teste, mas a rodada completa sai com código 1 nesse caso. A interface pede Node 22.

## 17. Arquivos

**Novos:**

- `src/motor/sistemas/perfisEsportivos.ts`
- `src/motor/sistemas/legado.ts`
- `src/ui/jogo/Trajetorias.tsx`
- `src/motor/__tests__/generalizacao.test.ts`
- `src/ui/__tests__/generalizacao.test.tsx`
- `scripts/sim/generalizacao.ts`
- `scripts/playtest/gerarGeneralizacao.ts`
- `scripts/playtest/generalizacao.mjs`
- `scripts/sim/auditoriaGeneralizacao.ts`

**Alterados (motor):**

- `tipos.ts`, `save.ts`
- sistemas: `esporte.ts`, `palmares.ts`, `selecao.ts`, `situacoes.ts`, `academia.ts`, `audiovisual.ts`, `arte.ts`, `cena.ts`, `palco.ts`, `politica.ts`, `militar.ts`, `rural.ts`, `trabalho.ts`, `arcos.ts`, `formacao.ts`, `peneira.ts`, `oportunidades.ts`, `retrospectiva.ts`
- sistemas, pela auditoria: `fechamento.ts`
- conteúdo: `caminhos.ts`, `profissao.ts`, `politica.ts`, `trajetorias.ts`; pela auditoria, `fama.ts` e `mundo.ts`

**Alterados (interface):** `Voce.tsx`, `Trabalho.tsx`, `vida.css`.

**Build:** `vite.config.ts`. O pacote `motor-carreira` passou a levar o legado, a retrospectiva, a família, as iniciativas, o ilícito e a pessoa. Só a camada de cima os importa, e eles não importam a camada de cima: não há ciclo.

| Pacote | Tamanho |
| --- | --- |
| `motor` | 775 kB |
| `motor-conteudo` | 772 kB |
| `motor-carreira` | 164 kB |

O limite de 800 kB não foi aumentado.
