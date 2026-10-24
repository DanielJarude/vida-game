# REWORK 11 · Fase B — Estado profissional unificado e indicações

Base: `b885ccc` (Fase A + checkpoint G). O branch é `worktree-agent-a7e65f41e95616634` (os commits estão no fim deste arquivo).

## O que mudou (arquivo:função)

### CAR-11.1: leitura unificada
- **novo** `src/motor/sistemas/situacaoProfissional.ts`
  - `situacaoProfissional(v)` é pura. Devolve carreira (esporte/técnico/arte/política/militar/academia/negócio/crime/emprego), situação (ativo/sem_clube/sem_contrato/pausada/desempregado/aposentado/encerrada/preso/cuidando), rótulo, detalhe, ocupação, vínculo, onde, último onde, contrato (só quando existe), cargo, desde, `especial`, `semVinculo`, as atividades paralelas (paralela, negócio nas horas vagas, pausadas, política, arte, carreira parada, por fora) e a experiência.
  - Lê `trabalho.atual`, `caminhos.esporte`, `caminhos.tecnico`, `pausadas`, `negocio`, `politica`, `envolvimento` e `justica`. Não cria estado. Também aceita o campo `ultimoClube` que a Fase C pode acrescentar (string ou `{clube|nome}`) e o clube atual limpo (`clube: ''`).
  - Não importa `tecnico` nem `profissao` (pacotes de cima): a passagem aberta é relida localmente. Assim, `oportunidades` e `compromissos` podem usá-la sem ciclo.
  - `atletaSemClube`, `tecnicoSemClube` e `carreiraEspecialAtiva` são exportadas.
  - `temChefia(e)`, `temEmpresa(e)` e `temOrgao(e)`: o mecanismo genérico do vocabulário corporativo, exportado e documentado para as Fases C e D.
- UI
  - `CaminhosDaVida.tsx`:
    - `situacaoAtual`: a carreira sem contrato vira um item `trabalho` com o nome dela ("Jogador de futebol sem clube"), sem "Procurando trabalho".
    - `faseDosCaminhos`, `estadoDaDivisao` (Trabalho e Outros) e `proximoNosCaminhos` passaram a ler a mesma situação.
    - `ordemDasDivisoesBase`: atleta, artista e carreira sem vínculo põem **Trabalho primeiro**; a base continua em Outros.
  - `DivisoesCaminhos.tsx` `OutrosCaminhosDaVida`: "Em andamento" mostra a linha da situação e o botão "Ir para Trabalho", que agora leva a uma tela que mostra a carreira. Antes, o botão levava a "Meu trabalho = Sem trabalho". O `PainelAtleta` duplicado saiu desta tela.
  - `Trabalho.tsx`:
    - O título, o kicker, o emblema e o lede da carreira sem vínculo vêm de `fraseSemVinculo`.
    - `PainelAtleta` aparece também para o atleta sem clube. Sem contrato não há salário de contrato, e o placar mostra "último clube: X". Antes, o salário de outro emprego aparecia como "salário do contrato".
    - Em `AcoesPrincipaisDoTrabalho` o botão passa a ser "Ver outros trabalhos", com a nota de que a vida pergunta antes.
    - Também mudaram `ExperienciaNaCarreira` e a regra que mostra `CarreiraNoEsporte` no Histórico.
  - `apresentar.ts` `ocupacaoAtual` (a linha da ficha): "jogador de futebol sem clube" em vez de "sem trabalho".

### CAR-11.2: indicações
- **novo** `src/motor/sistemas/indicacoes.ts`:
  - `distanciaDaCarreira`: trilha, família, carreira especial × setor, queda de nível e de renda.
  - `pontuarIndicacao`: estrada, formação, interesse, renda e distância.
  - `naturezaDaOportunidade`: emprego, mudança de carreira, por conta, ocasional, própria. Usa o campo salvo; sem ele, deduz (saves antigos).
  - `leituraDaOportunidade`: entrevista sim/não, por conta, a via real e a frase de mudança.
  - Sociedade e investimento continuam como acontecimentos próprios (`din10_sociedade`, `neg_comprar_parte`). Ficaram só no tipo e nos rótulos, sem gerador novo.
- `oportunidades.ts`, gerador de indicação:
  - O conhecido continua sorteado pelo RNG principal, com a mesma sequência. A vaga é escolhida entre o que cada conhecido pode indicar (`entradaPelaPessoa`), pela nota de quem recebe, com ruído de `rngDe(v.id,'indicacao',t)`.
  - A frequência de antes foi mantida: só há indicação se o sorteado tem o que indicar.
  - Carreira especial viva (mesmo sem clube): chance ×0,3; só vagas da área. As de fora da área só passam em 35% das vezes e vêm ditas "Seria outra carreira…".
  - O texto por conta diz "sem entrevista".
  - A indicação da turma de formação ficou rara para quem tem carreira especial e também guarda a natureza.
  - `novaOportunidade` aceita `natureza`.
- `Alcance.tsx` `oQueMuda`:
  - Usa a natureza, o que corrige o "Aceitar leva à entrevista" que aparecia para autônomo. O texto agora é "Por conta própria: sem entrevista…".
  - A frase de mudança de carreira e as saídas da pergunta ("encerrar a carreira de jogador ou recusar") são ditas antes do sim.
  - A análise usa a via real (`indicacao`), não `'oportunidade'`.
  - O título da folha mostra a natureza.
- `Estudos.tsx` `PortasAbertas`: etiqueta da natureza (mudança de carreira, por conta, ocasional), com a classe `.porta__natureza` em `vida.css`.

### analisarEntrada e as transições (compromissos.ts)
- `conflitoComCarreiraEspecial` (novo tipo de conflito `'carreira'`):
  - Atleta sem clube que aceita emprego comum: a pergunta diz que a carreira acaba, e o plano faz `largar('carreira_esporte')` → `esporte.encerrarCarreira(v, es, 'escolha')` **na hora**, com marca e biografia, e apaga `esp_sem_clube`.
  - Técnico sem clube: um único plano, "seguir como técnico sem clube, em paralelo". É verdade no motor: `tecnico.semClube` segue gerando propostas, com −0,1, até quatro anos.
  - Carreira artística pausada: sem pergunta, porque nada se perde (a pausa fica).
- `conflitoComEmprego`, atleta COM clube: a alternativa diz "deixar o clube e encerrar a carreira de X", e `largar('emprego')` encerra a carreira com registro.
- `fimDaCarreiraDeAtletaPor`, em `aplicarNovo` e em `contratarComAnalise`: um trabalho principal que não é de atleta encerra a carreira na hora, com registro. Antes, `esporte.ts:1024` a encerrava na virada do ano sem nenhuma linha. `esporte.ts` não foi tocado: a Fase C pode trocar a linha 1024 por `encerrarCarreira`, e a carreira não fecha duas vezes, porque já estará encerrada.

### Pendência 10.6: contratações fora de `propor`
- **novo** `contratarComAnalise(v, r, oc, via, {texto, ajuste, substitui})`, com dois auxiliares: `conflitosDaContratacao` (pura) e `contratacaoDoEvento` (para os `resolver`).
  - Sem conflito grande: contrata, aplica o ajuste e reconcilia a agenda. O turno que bate muda e isso fica dito.
  - Com conflito grande (curso integral, base, carreira especial, escola sem turno): pendente, igual a uma vaga.
  - Com outra escolha em aberto: a oferta passa, e isso fica dito.
- `substitui` evita perguntar de novo pelo emprego que o acontecimento já decidiu trocar.
- Tipos novos (opcionais, o save continua v20):
  - `NovoCompromisso.emprego.{substitui?, ajuste?}`
  - `AjusteDeEmprego {posAposentadoria, especialidade, clientelaMais, salarioMinimo}`
  - `Oportunidade.natureza?`
  - `NaturezaDaOportunidade`
- Pontos convertidos:

  | Arquivo | Onde |
  |---|---|
  | `trabalho.ts` | efetivação do aprendiz e estágio→efetivo |
  | `conteudo/adulto.ts` | `mudarPorProposta` |
  | `conteudo/caminhos.ts` | pós-carreira: escolinha, comissão, preparo, lutas |
  | `conteudo/caminhos.ts` | `des_longo`: qualquer, por conta |
  | `conteudo/caminhos.ts` | `apo_segunda_feira`: por conta |
  | `conteudo/oficios.ts` | `ofi_conta_propria` |
  | `conteudo/trajetorias.ts` | `mil_reserva`: segunda carreira |
  | `conteudo/desafios.ts` | entrevista legada, agora via `propor` |

  Nos acontecimentos, o texto não diz "começou" quando a pergunta vem.
- Sem mudança:
  - `militar.incorporarAoServico`, `negocio.abrirNegocio` e `negocio.dedicarAoNegocio`: só são chamados por `aplicarNovo`, ou seja, já passaram pela análise. O fallback de `acoes.ts:933` é inalcançável na prática.
  - `esporte.ts` e `tecnico.ts`: são da Fase C.

### Vocabulário corporativo (C3/C4, mecanismo genérico)
- `noOficio.verbosDoOficio`: os verbos de chefia exigem `temChefia(e)`. Ficam sem eles autônomos, sócio de advocacia, escritor, árbitro, bolsista, professor particular e a casa de família.
- O rótulo do curso de capacitação depende do vínculo:

  | Vínculo | Rótulo |
  |---|---|
  | Empresa | "curso da empresa" |
  | Serviço público | "curso do órgão" |
  | Farda | "curso de capacitação da corporação" |
  | Sem empresa nem órgão (técnico, companhia) | "capacitação na área" |

- `conteudo/caminhos.ts` `car_curso_empresa`: a condição nova `temEmpresa || temOrgao` vem **depois** do sorteio, para não mudar o RNG de quem já recebia. O texto diz empresa, órgão ou corporação. Técnico, companhia e casa de família não recebem.

## Bugs corrigidos (com a causa)
1. **Atleta sem clube some da divisão Trabalho.** Causa: as telas só liam `trabalho.atual` e `modoDoTrabalho='procurando'`. Correção: a leitura única, e Trabalho mostra a carreira.
2. **"Em andamento" levava a um "Meu trabalho" vazio.** Causa: o link apontava para uma tela que só lia o emprego.
3. **Placar mostrava o clube antigo como atual, e o salário de outro emprego como "salário do contrato".**
4. **Indicação de manicure para futebolista consolidado.** Causa: a vaga vinha da trilha de quem indicava. Agora ela é pontuada para quem recebe, rara e da área, e a de fora vem rotulada.
5. **"Aceitar leva à entrevista" para autônomo.** Causa: `Alcance.tsx:42` ignorava `porContaPropria`.
6. **Aceitar a indicação encerrava a carreira de atleta em silêncio na virada do ano.** Causa: `analisarEntrada` não via carreira sem contrato, e `esporte.ts:1024` não deixava registro. Agora a vida pergunta antes, e o fim é registrado na hora.
7. **Efetivação do aprendiz e outros pontos contratavam sem olhar curso integral, base e agenda.**
8. **"Almoçar com a chefia" e "curso da empresa" para quem não tem chefia nem empresa.**

## Testes
- **novo** `src/motor/__tests__/rework11Carreiras.test.ts`: **23/23 passam**.
  - `situacaoProfissional` em 8 estados: empregado; atleta com clube; atleta sem clube; campo novo da Fase C + save/reload; técnico sem clube; técnico no comando; aposentado/autônomo/carreira parada ao lado de bico; negócio paralelo.
  - Indicações: atleta sem clube recebe menos de 35% do que recebe o comum, e todas como mudança de carreira. Com amigo da área, todas vêm do esporte. O cozinheiro ouve de cozinha (mais de 60%). Por conta sem entrevista, com o texto e o aceite certos. Natureza deduzida em save antigo.
  - Pergunta antes do sim: atleta sem clube tem pendente com "encerrar a carreira de jogador"; recusar mantém a carreira; aceitar encerra com "Pendurou as chuteiras" e sem o fato pendurado. Técnico tem a opção em paralelo e continua técnico. Atleta com clube tem o fim registrado.
  - Efetivação: com faculdade integral vira pendente (com trancar); sem conflito entra direto; o ajuste sobrevive a save/reload.
  - Vocabulário: chefia e empresa em todas as ocupações autônomas e informais; órgão, corporação, babá.
- **novo** `src/ui/__tests__/rework11Carreiras.test.tsx`: **5/5 passam**.
  - Situação, ordem e ficha do atleta sem clube.
  - A jornada Caminhos → Trabalho: título "sem clube", "último clube: Sport", sem "Salário do contrato".
  - Outros → Em andamento → "Ir para Trabalho" leva à carreira.
  - O convite por conta sem "Aceitar leva à entrevista"; a manicure para o atleta dita como mudança de carreira, com as saídas.
- Testes existentes que rodaram:
  - Motor: 20 arquivos, **659/660** no lote. A única falha foi um timeout de 90 s em `profissao.test.ts › treinar dobrado`, por carga: as sims rodavam ao mesmo tempo. Rodado isolado, passou.
  - Os 20 arquivos de motor: comissaoModalidade, consequencias, fix3, fix31, fix4, fixGeneralizacao, fixPosRework3, fixPosRework4, pacotePlaytest, rework, rework10, rework105, rework106, rework3, rework4, rework5, rework9, tecnico, profissao, caminhos.
  - UI: fixPosRework3, fixPosRework4, interface, rework105, rework106, rework11Carreiras, rework9, rework95, rework96, rework9Integracao, tecnico, pacotePlaytest, navegacao: **126/126**.
- `tsc --noEmit` limpo.

### Teste antigo ajustado
- `tecnico.test.ts` `emCrise`: agora limpa a proposta de mercado que já estivesse na mesa antes de gerar a crise.
  - Causa: a vida de 40 anos da semente mudou de trajetória com as indicações pontuadas e com o `car_curso_empresa`, que não sai mais para quem não tem empresa (um `r.pick` a menos). Com isso, sobrava uma proposta 'mercado', e o cenário de crise nunca era gerado.
  - O comportamento testado (a crise) não mudou. Na base os 3 testes passam; depois do ajuste passam também.

## Sims (antes = `b885ccc`, depois = este branch)
Os scripts estão em `/home/iego_ossi/vida-trabalho/simB/`.

**`carreiras11-*.ts`**: 300 tentativas com um futebolista da Série A sem clube e 4 amigas (2 manicures, atendente, caixa), comparado com a mesma vida sem a carreira.

| métrica | antes | depois |
|---|---|---|
| indicações ao atleta sem clube | 132 | **21** |
| indicações à vida comum (frequência) | 132 | 137 |
| indicações ditas "outra carreira" | 0 | 17 |
| aceitas → pergunta antes | 0/131 | 13/21 (as outras 8 vão para a entrevista, e a pergunta vem quando a vaga sai) |
| carreira encerrada no ano sem marca de fim | **47** | **0** |

**`coer11B-*.ts`**: 36 vidas, 6 perfis, até os 70 anos (cerca de 2.270 anos de vida).

| métrica | antes | depois |
|---|---|---|
| anos com "Almoçar com a chefia" sem vínculo de emprego | 25 | **0** |
| anos com "curso da empresa" sem empresa | 80 | **0** |
| encerramento de carreira de atleta silencioso | 1/1 | 0/1 |
| sobreposição trabalho × escola/curso | 0 | 0 |
| travou | 0 | 0 |

**Varredura** das 257 ocupações (`varredura.ts`):

| métrica | antes | depois |
|---|---|---|
| ocupações com "Almoçar com a chefia" | 189 | 179 |
| ocupações com o curso "da empresa" | 175 | 127 (as de órgão e corporação mudaram de rótulo) |

## Bundle
`npm run build`: nenhum chunk passou de 800 kB.

| chunk | tamanho |
|---|---|
| motor-textos | 764,19 kB (só ganhou poucos bytes) |
| motor | 706,90 kB (onde ficam os dois módulos novos) |
| Jogo | 615,58 kB |
| motor-oficio | 84,47 kB |

## Pendente e combinado com as outras fases
- **Fase C:**
  - O modo do atleta e do técnico sem clube em `modoDoTrabalho`. As ações do atleta sem clube (pendurar, procurar clube): hoje Trabalho mostra a carreira, mas as ações ainda são "ver vagas / concursos / bicos".
  - Limpar o clube ao fim do contrato. A leitura já aceita `ultimoClube`.
  - Trocar `esporte.ts:1024` por `encerrarCarreira`.
  - O vocabulário do técnico: pode usar `temChefia` / `temEmpresa` e um modo próprio.
- **Fase D:** os artistas com contrato CLT (bailarino) ainda recebem "Almoçar com a chefia" pelo modo `empregado`. `temEmpresa` já os exclui do curso da empresa.
- Uma oferta "em paralelo" para o atleta sem clube não foi oferecida. Seria mentira: o motor do esporte encerra a carreira de quem tem outro trabalho.
- Sociedade e investimento não viraram portas novas: já existem como acontecimentos.
