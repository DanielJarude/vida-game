# Auditoria pós-playtest humano — VIDA

Diagnóstico técnico dos nove achados do primeiro playtest humano após F3 + F3-FIX.

**Nenhuma correção foi implementada.** Nenhum arquivo de produção foi alterado. O que existe
de novo são nove scripts de auditoria em `scripts/audit/` e este documento.

---

## 1. Resumo executivo

Os nove achados **não são nove problemas**. São, em sua maioria, o mesmo problema visto de
ângulos diferentes: **o VIDA tem os dados, mas os sistemas não se perguntam sobre eles.**

Três medições sustentam essa leitura:

| medição | resultado |
|---|---|
| eventos cujo texto pressupõe um estado que o motor **não valida** | **32** de 59 pares detectados |
| predicados de elegibilidade existentes | 14 — **nenhum** cobre pet, carro, imóvel, irmão, amigo ou cidade |
| dados concretos com **zero** consumidores no motor | imóvel, amizade |

O caso do pet é o exemplo canônico e o mais barato de explicar: `FamilyMember` já tem o tipo
`'pet'`, o jogo já sabe criar um, a interface já o exibe — e **nenhum evento jamais pergunta se
ele existe**. O evento do veterinário não está "com bug"; ele está correto e o vocabulário que o
motor usa para filtrá-lo é que não tem a palavra "pet".

Dois achados fogem a esse padrão e são **defeitos de modelagem independentes**, ambos graves:

- **Economia (Achado 8).** A despesa é uma constante, não uma função da renda. Medido nos oito
  perfis controlados: a taxa de poupança vai de **53% a 87%** da renda. Um personagem no salário
  mínimo guarda R$ 126.000 em dez anos. Não é "ganhar dinheiro fácil demais": é que **quase nada
  é gasto**.
- **Filhos (Achado 7).** Não existe gestação em lugar nenhum do domínio. A única trava é "uma
  concepção por ano", o que em sessenta anos adultos produz uma **mediana de 23 filhos por vida**,
  máximo 45, com **32% dos nascimentos após os 55 anos** — houve primeiro filho aos 77.

Um achado é **mais simples do que parecia** e pode ser resolvido em horas: a Linha da Vida com
buracos (Achado 3) é causada por uma única condição — `idade >= 18` na última rede do catálogo de
pequenas memórias. Dos 1 aos 17 anos, `gerarPequenaMemoria()` **sempre** devolve `null`.

Um achado é **parcialmente falso** e precisa ser corrigido no entendimento antes de virar
trabalho: o avatar (Achado 1) **modela idade muito bem** (seis quadros-chave, 22 medidas,
interpolação ano a ano) e **não modela gênero de forma alguma** (zero ocorrências de `genero` em
todo o pipeline). Metade da queixa do playtest tem causa medida; a outra metade não.

A ordem recomendada de fases está na seção 28. Ela começa pelo que **destrava as outras**: o
contexto do mundo (elegibilidade) e a narrativa, que são pré-requisito para qualquer conteúdo
novo fazer sentido.

---

## 2. Metodologia

Quatro instrumentos, nesta ordem de confiança:

1. **Leitura do código.** Toda causa raiz afirmada aqui foi confirmada abrindo o arquivo. As
   varreduras textuais serviram para *encontrar onde olhar*, nunca para concluir.
2. **Simulação determinística**, 105 vidas (7 perfis × 15 sementes), com o mesmo harness das fases
   anteriores — comparabilidade com as métricas já publicadas.
3. **Cenários controlados**, para a economia: oito perfis (A–H) chamando o motor real
   `processarAnoEconomia()` por dez anos, sem eventos e sem sorte, para isolar o fluxo estrutural.
4. **Sondas dirigidas**, para perguntas fechadas ("esta função aceita gênero?", "esta idade gera
   memória?").

Onde a varredura textual e a leitura divergiram, a leitura venceu — e isso aconteceu: a primeira
varredura do Achado 2 encontrou *um* caso, porque procurava no campo errado. O texto que o jogador
lê não é `evento.descricao`; é `opcao.descricaoResultado`. Ver seção 14.

**Scripts produzidos** (todos em `scripts/audit/`, nenhum toca produção):

| script | responde |
|---|---|
| `pressupostos.ts` | Achados 2 e 4 — matriz texto pressupõe × motor valida |
| `narrativaSemContexto.ts` | Achado 2 — classificação A/B/C/D dos desfechos |
| `buracosBiograficos.ts` | Achado 3 — anos sem registro, por faixa e em sequência |
| `pequenaMemoriaCobertura.ts` | Achado 3 — causa raiz, idade a idade |
| `economiaControlada.ts` | Achado 8 — perfis A–H, dez anos |
| `avatarDiferencas.ts` | Achado 1 — distância entre fases e entre gêneros |
| `vidaSocial.ts` | Achado 6 — quem existe na vida no fim |
| `cronologiaFilhos.ts` | Achado 7 — quantos filhos, quando |
| `dadosNaoConsumidos.ts` | questão central — quem escreve, quem lê |

---

## 3. Estado do baseline

| | |
|---|---|
| branch | `arena/01a0c250-vida-game` |
| commit inicial | `6aa8148` |
| `npm test` | **874 testes, 53 arquivos, 100% verdes** |
| `npm run typecheck` | limpo |
| `npm run build` | ok, ~3,1 s |
| produção alterada nesta auditoria | **nenhum arquivo** |

Único arquivo versionado modificado fora de `docs/`: `scripts/audit/simulador.ts`, que passou a
expor `familiaFinal` no resultado — necessário para medir vida social. É harness de auditoria, não
produção.

---

## 4–8. Os nove achados: reprodução, causa raiz, arquivos, gravidade

### Achado 1 — Avatar

**Observado.** Trocar masculino ↔ feminino não muda o rosto. Bebê parece adulto pequeno.

**Reprodução.** `npx tsx scripts/audit/avatarDiferencas.ts`

**Causa raiz — duas, e só uma confere com a queixa:**

**(a) Gênero não existe no pipeline visual.** Confirmado por busca exaustiva: `grep -rn
"genero\|Gender"` em `src/presentation/avatar/`, `avatarRenderer.ts`, `AvatarFace.tsx` e
`src/data/avatar/` retorna **zero ocorrências**. A assinatura é
`construirEspecificacaoAvatar(idade, aparencia)` — o gênero **não é sequer passado**. Os 23 campos
da especificação do retrato não contêm nada derivado de gênero. A queixa está 100% correta e a
causa é definitiva.

**(b) Idade É modelada — a queixa aqui não se sustenta como descrita.** Existem seis quadros-chave
(0, 6, 14, 24, 48, 75) com 22 medidas cada, interpolados ano a ano. Distância medida entre fases:

| transição | diferença média das medidas |
|---|---|
| bebê → criança | **6,8%** |
| criança → adolescente | 4,7% |
| adolescente → adulto | 1,9% |
| adulto → meia-idade | 1,4% |
| meia-idade → idoso | 3,1% |

Entre bebê e adulto: queixo −43,6%, mandíbula −23,9%, altura do olho −22,0%, crânio −17,7%. Isso
não é um adulto reduzido.

**Hipótese para a percepção** (não verificada, exige olho humano): o bebê recebe **cabelo de
estilo adulto**, o enquadramento é sempre o mesmo busto sem referência de escala, e `barba` é campo
livre de aparência — não derivado de gênero nem de idade, então nada impede barba num rosto
feminino nem garante num masculino adulto.

**Arquivos.** `src/presentation/avatar/{faceProportions,facePaths,hairPaths}.ts`,
`src/presentation/avatarRenderer.ts`, `src/components/character/AvatarFace.tsx`,
`src/data/avatar/avatarData.ts`.

**Gravidade: MÉDIA.** Não afeta simulação; afeta identificação do jogador com o personagem.

---

### Achado 2 — Acontecimentos sem contexto

**Observado.** *"Você encarou o 'monstro' e descobriu que era só um casaco pendurado. Ficou
orgulhoso de si mesmo."* — o desfecho chega sem a situação.

**Reprodução.** `npx tsx scripts/audit/narrativaSemContexto.ts`

**Causa raiz — estrutural, não editorial.** Em `agingSystem.resolverAcontecimento` o motor sorteia
um desfecho e chama `aplicarConsequenciasEscolha`. O **único** log narrativo criado ali
(`eventSystem.ts:320`) usa `opcao.descricaoResultado`. O campo `evento.descricao` — que é a
situação — **nunca é escrito na Linha da Vida, para nenhum acontecimento automático**.

O texto citado é exatamente isto: a `descricao` do evento `prc_medo_escuro` diz que há um vulto no
armário; o jogador nunca a vê, e recebe só o desfecho.

Não é resíduo de conversão em alguns eventos. É como **todos os 72 acontecimentos automáticos**
funcionam. A hipótese do prompt ("a conversão preservou texto de resultado como narrativa
principal") está certa na consequência e incompleta na causa: não sobrou texto de decisão — falta
publicar a situação.

**Classificação dos 149 desfechos automáticos:**

| classe | o que é | n | % |
|---|---|---|---|
| **C** | atribui ação deliberada que o jogador não escolheu | **1** | 0,7% |
| **B** | depende da situação para fazer sentido | **23** | 15,4% |
| **D** | correto como acontecimento automático | 125 | 83,9% |

O único caso C é `prc_medo_escuro / opt_encarar_armario` — o próprio texto do playtest. Exemplos
de B, com a situação que o jogador não lê:

- `ext_amigo_secreto_firma`: situação *"você tirou o colega mais exigente no amigo secreto"* →
  jogador lê só *"Ele adorou o presente…"* — "ele" sem antecedente.

**Gravidade: ALTA.** É o que faz a Linha da Vida parecer incoerente, e atinge todo acontecimento.

---

### Achado 3 — Linha da Vida com buracos

**Observado.** Saltou de 7 anos para 10 anos.

**Reprodução.** `npx tsx scripts/audit/buracosBiograficos.ts` e `pequenaMemoriaCobertura.ts`

**Causa raiz — uma condição.** O catálogo de pequenas memórias tem dez candidatas. **Todas
descrevem vida adulta**: trabalho, curso superior, filhos, dívida, aposentadoria. A última rede,
`mem_cidade`, que deveria pegar qualquer caso restante, exige `idade >= 18`.

Resultado medido: **das idades 1 a 17, nenhuma gera memória.** `gerarPequenaMemoria()` devolve
`null` sempre. A partir dos 18, sempre gera.

| idade testada | memória gerada? |
|---|---|
| 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 17 | **NÃO** — nenhuma candidata é verdadeira |
| 18, 22, 30, 45, 60, 70, 80 | sim |

**Métricas (105 vidas, 7.800 anos):**

| faixa | anos | anos sem nenhuma linha | % |
|---|---|---|---|
| **1-5** | 525 | 195 | **37,1%** |
| **6-11** | 630 | 172 | **27,3%** |
| **12-17** | 630 | 94 | **14,9%** |
| 18-29 | 1.260 | 1 | 0,1% |
| 30-44 | 1.575 | 1 | 0,1% |
| 45-59 | 1.565 | 1 | 0,1% |
| 60+ | 1.615 | 5 | 0,3% |
| **total** | **7.800** | **469** | **6,0%** |

Lacunas: mediana 1 ano, **p90 = 3 anos**, máxima **6 anos**; 107 lacunas de 2+ anos, 42 de 3+.
Por vida: mediana 4 anos perdidos, p90 7, máximo 10. **Apenas 3 de 105 vidas** não têm nenhum ano
apagado.

A infância inteira é o buraco. O adulto já está resolvido — a F3 resolveu para quem ela
enxergava.

**Composição da Linha da Vida:** 52,4% das linhas são textura (finanças 20,3%, carreira 16,9%,
escola 11,5%, família 3,7%).

**Gravidade: ALTA.** É perda de biografia, e concentrada justamente na fase que a F3-FIX acabou
de povoar de conteúdo.

---

### Achado 4 — Evento de pet sem pet

**Observado.** Evento de levar o pet ao veterinário, sem pet.

**Reprodução.** `npx tsx scripts/audit/pressupostos.ts`

**Causa raiz.** `fam_pet_veterinario` (`moreEvents.ts:79`) **não declara bloco `condicoes`**. E
não poderia declarar: o vocabulário de elegibilidade tem 14 predicados e **nenhum se refere a
pet**. O estado existe (`FamilyMember.tipo === 'pet'`); os dois lugares do motor que citam `'pet'`
não são checagens de elegibilidade — um **cria** pet (`eventSystem.ts:256`), o outro filtra
interações (`availabilitySystem.ts:347`).

**Matriz (59 pares texto-pressupõe × motor-valida):**

| pressuposto | eventos | validam | **não validam** | predicado disponível |
|---|---|---|---|---|
| ESCOLA | 14 | 0 | **14** | `emEscola` existe, não é usado |
| EMPREGO | 11 | 11 | 0 | `empregado` ✓ |
| PAIS | 9 | 0 | 9 | — não existe — |
| AMIGO | 4 | 0 | **4** | — não existe — |
| CARRO | 4 | 1 | 3 | — não existe — |
| FACULDADE | 4 | 2 | 2 | `emFaculdade` |
| **PET** | **3** | **0** | **3** | **— não existe —** |
| PARCEIRO | 3 | 2 | 1 | `temParceiro` |
| CIDADE | 3 | 0 | 3 | — não existe — |
| IMÓVEL | 2 | 0 | 2 | — não existe — |

**32 pares de risco alto.** Note ESCOLA: o predicado `emEscola` **existe** e nenhum dos 14 eventos
o usa — aqui nem falta vocabulário, falta aplicá-lo.

Eventos de risco alto por pet: `bb_cachorro_familia`, `fam_pet_veterinario`, `inf_gatinho_rua`.

**Gravidade: ALTA.** Quebra a suspensão de descrença de forma imediata e visível.

---

### Achado 5 — Educação / Brasil

**Observado.** Concluiu o EM aos 17 e recebeu *"O vestibular e a faculdade abrem aos 18 anos."*
Cursos de Medicina a MBA ofertados igualmente em Rio Branco. Duração dos cursos correta.

**Causa raiz (a) — uma constante gateia oito etapas.** `IDADE_MINIMA_FACULDADE = 18`
(`availabilitySystem.ts:57`) é verificada em `educationSystem.ts:302` e `availabilitySystem.ts:273`
antes de **matrícula, vestibular e preparação indistintamente**. A mensagem une as duas coisas na
mesma frase: *"O vestibular **e** a faculdade abrem aos 18 anos"*. No Brasil real, quem termina o
EM aos 17 presta ENEM e vestibular aos 17; o gate de 18 vale (quando vale) para a matrícula.

Das oito etapas pedidas (preparação, ENEM, vestibular, candidatura, aprovação, matrícula,
frequência, conclusão), o código modela essencialmente **vestibular → matrícula → frequência →
conclusão**. Preparação, cursinho e ENEM como prova separada não existem como etapas.

**Causa raiz (b) — localidade não existe na educação.** `CourseOption` tem id, nome, tipo, área,
duração, nota de corte, mensalidade e inteligência mínima. **Não tem instituição, não tem cidade,
não tem modalidade (presencial/EAD).** `grep` por cidade/estado em `educationSystem.ts` e
`coursesData.ts`: nenhuma ocorrência. Todo curso é ofertado em todo lugar porque **lugar não é uma
dimensão do modelo**.

**O que JÁ está certo e não deve ser mexido:** a F1 resolveu pré-requisito de área —
`preRequisitoAreas` impede pedagoga em Residência Médica; MBA aceita qualquer graduação, como no
Brasil real. A F2 resolveu duração (medida: EM 3 anos, técnicos 1, superiores 3–4, sem variação
indevida).

**Gravidade: MÉDIA** para o gate dos 17 (irrita e é factualmente errado, mas não corrompe a
simulação); **MÉDIA-ALTA** para localidade, por ser pré-requisito de Brasil Vivo.

---

### Achado 6 — Vida social / amigos

**Observado.** Relações resumidas a vida a dois + família de origem; amigos ausentes; botão
"Conhecer novas pessoas" parece gerador artificial de NPC.

**Reprodução.** `npx tsx scripts/audit/vidaSocial.ts`

**Medido (105 vidas, estado final):**

| categoria | total | por vida |
|---|---|---|
| filhos | 2.219 | 21,1 |
| família de origem | 376 | 3,58 |
| parceiros | 208 | 1,98 |
| **amizades** (amigo/paixão/rival) | **47** | **0,45** |
| pets | 29 | 0,28 |

**63 de 105 vidas terminam sem nenhum amigo.** Mediana de amizades por vida: **0**.

**Causa raiz.** Só existem dois caminhos para uma pessoa não-familiar entrar na vida:

1. a ação voluntária "Conhecer novas pessoas", que chama **`gerarCandidatosNamoro()`** — o nome
   da função é o diagnóstico: o caminho social principal produz candidatos a namoro, não amigos;
2. consequência `adicionarFamiliar` de um evento — cujo tipo padrão, quando o evento não
   especifica, é **`'pet'`** (`eventSystem.ts:256`).

**Não existe** convivência que produza conhecido, progressão conhecido → amigo → amigo próximo,
afastamento por falta de convívio, nem amizade que vire romance. O campo `relacionamento` (0–100)
existe em cada pessoa e é lido por três sistemas, mas **nenhuma regra o faz subir por convivência**
— ele só muda por evento pontual.

**Gravidade: ALTA** para a proposta do produto (um simulador de vida sem vida social), **BAIXA**
como defeito técnico — nada está quebrado; o sistema não foi construído.

---

### Achado 7 — Filho surge automaticamente

**Observado.** Filho nasce sem cronologia humana.

**Reprodução.** `npx tsx scripts/audit/cronologiaFilhos.ts`

**Medido (105 vidas) — muito pior que o relatado:**

| | |
|---|---|
| filhos por vida | mediana **23** · média 21,1 · **máximo 45** |
| vidas com ao menos um filho | 101/105 |
| idade no primeiro filho | mín 19 · mediana 21 · **máx 77** |

| faixa etária | nascimentos | % |
|---|---|---|
| 18-24 | 220 | 9,9% |
| 25-34 | 447 | 20,1% |
| 35-44 | 429 | 19,3% |
| 45-54 | 413 | 18,6% |
| **55+** | **710** | **32,0%** |

Um terço dos filhos nasce depois dos 55 anos.

**Causa raiz.** `relationshipSystem.terFilho()` cria `FamilyMember{idade: 0}` **imediatamente**.
Verifica três coisas: idade ≥ 18, parceiro vivo, e concepção não usada neste ano. A trava da F2 é
`uma_vez_por_ano` — ela impede dois filhos no mesmo ano **e só**. Não há limite de idade máxima,
nem de total, nem fertilidade.

**Não existe no domínio:** gestação (zero ocorrências de `gravidez`/`gestacao` fora de um
comentário que diz justamente que não existe), concepção separada do nascimento, descoberta,
período gestacional, fertilidade por idade, gêmeos, ou qualquer relação entre tempo de
relacionamento e chegada do filho.

*Ressalva metodológica:* o número de 23 é amplificado pelo harness, cujos perfis escolhem "ter
filho" com probabilidade fixa todo ano. Um humano não clica 23 vezes. Mas as **travas ausentes são
reais**: nada no motor impede nenhum desses valores, e o playtest reportou o sintoma qualitativo.

**Gravidade: ALTA.**

---

### Achado 8 — Economia fácil / saldo explode

**Reprodução.** `npx tsx scripts/audit/economiaControlada.ts`

**Medido — dez anos, motor real, sem eventos nem sorte:**

| perfil | renda/ano | despesa/ano | saldo 10a | patrimônio 10a | **poupa** |
|---|---|---|---|---|---|
| A solteiro, baixa renda | 21.600 | 9.000 | 126.000 | 126.000 | **58,3%** |
| B solteiro, renda média | 60.000 | 14.000 | 460.000 | 460.000 | **76,7%** |
| C casado, 2 filhos, média | 60.000 | 28.000 | 320.000 | 320.000 | **53,3%** |
| D casado, 2 filhos, alta | 216.000 | 28.000 | 1.880.000 | 1.880.000 | **87,0%** |
| E imóvel + carro popular | 72.000 | 19.400 | 526.000 | 1.101.445 | **73,1%** |
| F imóvel caro + SUV | 300.000 | 77.000 | 2.230.000 | 4.812.277 | **74,3%** |
| G desempregado c/ família | 0 | 0 | 0 | −223.548 | — |
| H idoso | 30.000 | 10.400 | 196.000 | 631.215 | **65,3%** |

Referência: famílias brasileiras poupam tipicamente **5–15%** da renda.

**Causa raiz — a despesa é constante, a renda é variável.** `despesaBase` é 9.000 / 14.000 /
45.000 por ano conforme `padraoDeVida`. Não é função da renda. Quem ganha R$ 216.000 gasta os
mesmos R$ 28.000 de quem ganha R$ 60.000 — **toda renda adicional vira poupança**.

**Rubricas — o que o caixa realmente move:**

*Entradas:* salário ✓ · rendimento de investimento ✓ · loteria ✓ · venda de bem ✓ ·
**renda do parceiro ✗** · bico informal ✗ · aposentadoria pública ✗ · aluguel/herança/pensão ✗

*Saídas:* despesa base por padrão ✓ · filhos (7.000/ano fixo, < 18 anos) ✓ · manutenção de
propriedades ✓ · mensalidade ✓ · desconto de 40% com imóvel quitado ✓ ·
**custo do parceiro ✗** · aluguel explícito ✗ · IPVA/seguro/combustível separados ✗ ·
condomínio/IPTU ✗ · **imposto sobre salário ✗**

Um parceiro entra na vida **sem trazer renda nem custo**. Filhos custam valor fixo que não
acompanha padrão de vida nem idade. Não há imposto. Some-se a despesa constante e o resultado é o
perfil D acumulando R$ 1,88 milhão.

Agregar custo de vida numa rubrica é decisão de design **legítima** — evita virar planilha. O
defeito não é a agregação; é a **ausência de proporcionalidade**.

**Gravidade: ALTA.** Esvazia toda decisão econômica do jogo.

---

### Achado 9 — Patrimônio sem função

**Reprodução.** `npx tsx scripts/audit/dadosNaoConsumidos.ts`

**Medido — quem lê cada dado, fora de sua própria definição:**

| dado | consumidores no MOTOR |
|---|---|
| **imóvel** | **NENHUM** |
| **amizade** (`'amigo'`) | **NENHUM** |
| veículo | 2 — `availabilitySystem`, `careerSystem` (ambos: requisito de bico) |
| `custoAnualManutencao` | 1 — `economySystem` |
| cidade/estado | 3 — calendário, pequena memória, save (nenhum é regra de oferta) |
| `padraoDeVida` | 2 — economia, save |

**Imóveis.** `Property` tem tipo, nome, valor de compra, valor atual, manutenção, ano, quitado,
parcelas. **Não sabe:** quem mora nele, se é residência principal, se o parceiro mora junto, onde
fica, tamanho, padrão, condomínio, aluguel, conforto, segurança. O único efeito no jogo inteiro é
`despesaBase *= 0.6` quando há imóvel quitado, mais a manutenção cobrada. Um imóvel de
R$ 1.650.000 e um de R$ 200.000 produzem **o mesmo efeito na vida** (diferem só na manutenção
declarada).

**Veículos.** Afetam exatamente uma coisa: habilitar bicos que exigem veículo. Não afetam
deslocamento, emprego, estudo, lazer, viagem. Combustível, IPVA, seguro, multa e acidente **não
existem** como rubricas. Uma SUV de R$ 340.000 e um popular de R$ 60.000 diferem apenas no número
da manutenção.

**Gravidade: MÉDIA.** Não corrompe a simulação — empobrece a consequência de decisões caras.

---

## 9. Dados que existem e não são consumidos

| dado | existe | quem escreve | quem lê | deveria ler |
|---|---|---|---|---|
| `FamilyMember 'pet'` | sim | eventos, família | **ninguém, como condição** | elegibilidade de eventos |
| `'amigo'`/`'colega'` | sim | eventos, relationship | **nenhum sistema** | sistema social, eventos |
| imóvel | sim | economia | só economia | moradia, família, eventos |
| veículo | sim | economia | economia, bicos | deslocamento, oportunidades, eventos |
| `cidade`/`estado` | sim | criação | memória, calendário | **educação**, carreira, eventos |
| `relacionamento` 0-100 | sim | eventos | 3 sistemas | progressão social |
| parceiro | sim | relationship | 3 sistemas | **economia doméstica** |
| `emEscola` (predicado) | sim | educação | elegibilidade | **14 eventos escolares não usam** |
| gênero | sim | criação | 3 sistemas | **avatar (não recebe)** |

---

## 10. Sistemas desconectados — mapa de dependências

```
                        ESTADO DO MUNDO
          (pet, casa, carro, cidade, amigos, parceiro)
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
   ELEGIBILIDADE          ECONOMIA               EDUCAÇÃO
   DE EVENTOS             DOMÉSTICA              LOCAL
        |                     |                     |
   [14 predicados]       [ignora parceiro]     [ignora cidade]
   [não conhece          [despesa fixa]        [oferta global]
    pet/casa/carro/
    cidade/amigo]

   ---- linhas que NÃO existem hoje ----
   pet ............x.... eventos
   imóvel .........x.... moradia / família / eventos
   veículo ........x.... deslocamento / oportunidades
   cidade .........x.... oferta educacional
   parceiro .......x.... renda e despesa domésticas
   convivência ....x.... amizade
   relacionamento .x.... progressão social
   gênero .........x.... avatar
   gestação .......x.... (não existe)
   situação .......x.... Linha da Vida (só o desfecho é publicado)
```

---

## 11–13. Métricas consolidadas

**105 vidas** (7 perfis × 15 sementes), 7.800 anos.

| métrica | valor |
|---|---|
| anos sem nenhuma linha | 469 (6,0%) — **37,1% em 1-5** |
| maior lacuna | 6 anos consecutivos |
| vidas sem nenhum ano apagado | 3/105 |
| amizades por vida | mediana **0** · 63/105 sem nenhum amigo |
| filhos por vida | mediana **23** · máx 45 |
| nascimentos após 55 anos | 32,0% |
| taxa de poupança (perfis A–H) | **53%–87%** |
| eventos que pressupõem estado não validado | 32 pares |
| desfechos que dependem de contexto não publicado | 24 de 149 (16,1%) |

Cenários econômicos: seção do Achado 8.

---

## 14. Auditoria semântica dos eventos

Catálogo: **134 eventos**, dos quais **72 automáticos** com **149 desfechos**.

| classe | descrição | n | % |
|---|---|---|---|
| A/D | narrativa completa / correto como automático | 125 | 83,9% |
| B | parece desfecho sem contexto | 23 | 15,4% |
| C | atribui deliberação não escolhida | 1 | 0,7% |
| E | deveria voltar a ser decisão contextual | **0** | — |
| F | deveria ser reescrito como neutro | ⊂ B | — |

**Nenhum evento precisa voltar a ser decisão.** A classe B se resolve publicando a situação, não
reconvertendo o conteúdo — o que preservaria integralmente a conquista da F3 (a vida acontece; às
vezes você decide).

*Nota metodológica:* a classificação partiu de pistas textuais (anáfora sem antecedente, aspas de
ironia, verbo de resolução, conector de fecho) e **cada caso B e C foi lido**. A primeira versão do
script procurou no campo errado e achou 1 caso — registrado aqui porque é a diferença entre medir
o catálogo e medir o que o jogador lê.

---

## 15–19. Auditorias específicas

**15. Elegibilidade contextual.** Matriz completa no Achado 4. 32 pares de risco alto; 14
predicados existentes; 8 predicados ausentes que o catálogo já pressupõe em texto (`temPet`,
`temVeiculo`, `temImovel`, `temIrmaos`, `temAmigos`, `cidade/porte`, `temDivida`, `moraComPais`).

**16. Social.** Achado 6. Mediana 0 amigos; 60% das vidas sem nenhum; único caminho é
`gerarCandidatosNamoro()`.

**17. Cronologia relacionamento → filho.** Achado 7. Sem gestação; mediana 23 filhos; 32% após os
55.

**18. Educação/localidade.** Achado 5. Uma constante gateia três etapas distintas; `CourseOption`
não tem instituição, cidade nem modalidade.

**19. Patrimônio.** Achado 9. Imóvel: zero consumidores no motor. Veículo: um (bicos).

---

## 20. Save e migração

**Versão atual: 5.** `migrarEstadoSalvo` já é defensivo: campos desconhecidos são descartados,
ausentes recebem padrão, e um save ilegível retorna `null` **sem sobrescrever** o original. O
padrão estabelecido é **campo opcional novo** (`historicoOcorrenciasEventos?`, `registroTemporal?`,
`calendario?`), cada um com sua migração.

| mudança proposta | impacto | reconstruível? |
|---|---|---|
| predicados de elegibilidade (pet, carro…) | **nenhum** — leem estado que já existe | n/a |
| publicar situação do acontecimento | **nenhum** — só narrativa nova, dali para frente | timeline antiga fica como está |
| pequena memória na infância | **nenhum** | anos já vividos não retroagem |
| gênero no avatar | **nenhum** — `genero` já está em `Character` | sim, derivado |
| **gestação** | campo novo `gestacao?` em `GameState` ou `FamilyMember` | sim — ausência = "não grávida" |
| **economia proporcional** | nenhum campo novo se a fórmula mudar | sim |
| renda do parceiro | exige `ocupacao`/`renda` em `FamilyMember` | **parcialmente** — sortear a partir de classe social é plausível |
| sistema social (níveis de amizade) | campo novo em `FamilyMember` (ex.: `proximidade`) | sim — derivar de `relacionamento` que já existe |
| localidade educacional | `perfilCidade` derivado de cidade/UF já salvos | **sim, sem campo novo** |
| imóvel como moradia | campos novos em `Property` | parcialmente — "residência principal" = o único imóvel |

**Nada exige invalidar saves.** O item mais sensível é a renda do parceiro: parceiros salvos não
têm ocupação e ela teria de ser sorteada na migração — o que é aceitável, mas muda a economia de
uma partida em andamento. Recomenda-se aplicar só a parceiros novos ou sortear de forma
determinística a partir do id.

---

## 21–22. Clusters reais encontrados

Os clusters do prompt eram hipótese. A medição **confirma quatro e funde dois**:

### CLUSTER 1 — CONTEXTO DO MUNDO *(a causa raiz mais transversal)*
Pet, imóvel, veículo, cidade, irmãos, amigos, dívida, moradia → **elegibilidade**.
Achados **4** e parte do **5** e do **9**. É o cluster que o prompt chamou de A, e a medição o
confirmou como o de maior alcance: 32 pares de risco, 8 predicados ausentes, e é **pré-requisito
para que qualquer conteúdo novo não repita o bug do pet**.

### CLUSTER 2 — NARRATIVA E BIOGRAFIA
Situação não publicada (**Achado 2**) + anos sem registro (**Achado 3**). O prompt os separou; são
o mesmo cluster porque ambos respondem à pergunta *"o que chega à Linha da Vida?"*, ambos vivem
entre `agingSystem` e `presentation`, e ambos se resolvem sem tocar em regra de simulação. Custo
baixo, ganho imediato de percepção.

### CLUSTER 3 — ECONOMIA DOMÉSTICA E PATRIMÔNIO
**Achados 8 e 9**, inseparáveis: a casa e o carro são simultaneamente *onde o dinheiro deveria
sair* e *o patrimônio sem função*. Tratar um sem o outro reintroduz o problema — dar função ao
imóvel sem proporcionalidade só cria mais um número que não pesa.

### CLUSTER 4 — VIDA SOCIAL E FAMILIAR
**Achados 6 e 7**. Também inseparáveis: a gestação depende de um relacionamento que evolui, e a
evolução do relacionamento é o mesmo mecanismo da amizade (convivência → proximidade → mudança de
vínculo). Um único motor de relações serve aos dois.

### CLUSTER 5 — EDUCAÇÃO E LOCALIDADE
**Achado 5**. Depende do Cluster 1 (cidade como dimensão consultável).

### FORA DE CLUSTER — AVATAR
**Achado 1**. Puramente de apresentação, **zero acoplamento** com os demais. Pode ser feito a
qualquer momento, inclusive em paralelo, por não tocar em nenhum sistema.

---

## 23. O que MANTER

- **F1 inteira** — plausibilidade e elegibilidade profissional; `preRequisitoAreas` está correto.
- **F2 inteira** — tempo, semestres, duração de cursos (medido: EM 3 anos, técnicos 1, superiores
  3–4), `registroTemporal`.
- **F3 e F3-FIX** — ritmo, calendário, marcos, composição do ano, taxonomia, escolha biográfica.
  A separação acontecimento/decisão está certa e **nenhum evento precisa voltar a ser decisão**.
- **Pequena memória** como conceito e as três guardas — o defeito é a cobertura do catálogo.
- **Proporções faciais por idade** — seis quadros interpolados, bem construídos.
- **Agregação do custo de vida** numa rubrica — a alternativa é a planilha que o projeto recusa.
- **874 testes**, o harness de 105 vidas, `personalitySystem`, `lifeRhythm`.

## 24. O que REFINAR

- Vocabulário de elegibilidade: **adicionar predicados**, sem tocar na arquitetura.
- Catálogo de pequenas memórias: **acrescentar candidatas de infância** e revisar o `>= 18` da
  rede final.
- `descricaoResultado` dos 24 casos B/C — depois de publicar a situação, alguns se resolvem
  sozinhos.
- `IDADE_MINIMA_FACULDADE`: separar matrícula de prestar prova.
- `CourseOption`: acrescentar modalidade e vínculo com oferta local.
- Despesa: tornar função da renda, preservando a agregação.

## 25. O que REFAZER internamente

- **`terFilho()`** — hoje é "criar filho agora". Precisa virar concepção → gestação → nascimento.
  A função pública pode manter o nome; o fluxo interno muda por completo.
- **Caminho social** — `gerarCandidatosNamoro()` como única porta precisa dar lugar a um motor de
  relações por convivência. A função pode continuar existindo para a busca deliberada.
- **Pipeline do avatar** — `construirEspecificacaoAvatar` precisa receber gênero. É mudança de
  assinatura, propagada a proporções, cabelo e barba.

## 26. O que NÃO deve ser refeito

- A taxonomia de conteúdo (5 categorias) — está provada por 874 testes.
- O modelo de tempo em semestres da F2.
- O calendário de marcos e a composição do ano da F3-FIX.
- O sistema de personalidade.
- A estrutura de save — o padrão aditivo funciona; **não** criar v6 "de limpeza".
- A agregação de custo de vida — não transformar em planilha.
- As proporções faciais por idade — estender com gênero, não substituir.

---

## 27. Riscos

| risco | onde | mitigação |
|---|---|---|
| Adicionar predicado de elegibilidade **mata eventos** que hoje aparecem | Cluster 1 | Medir cobertura antes/depois; o evento de pet deve ficar raro, não morto — criar pet primeiro |
| Publicar a situação **dobra o volume** da Linha da Vida | Cluster 2 | Situação + desfecho numa **única entrada**, não duas linhas; medir linhas/ano |
| Pequena memória na infância vira **"um ano sem novidades" genérico** | Cluster 2 | Manter a regra: derivada do estado real; sem catálogo de frases soltas |
| Economia proporcional deixa o jogo **impossível** | Cluster 3 | Calibrar contra a taxa de poupança (5–15%), não contra "parecer difícil" |
| Gestação vira **microgerenciamento** | Cluster 4 | Nascimento é acontecimento automático quando a gestação existe |
| Sistema social vira **fila de NPCs** | Cluster 4 | Convivência gera proximidade em silêncio; só o marco vira linha |
| Localidade exige **cadastrar instituições** | Cluster 5 | Perfil de cidade por porte, derivado de cidade/UF já salvos |
| Regressão em F1/F2/F3 | todos | Rodar as guardas existentes a cada fase |

---

## 28. Roadmap proposto

Ordenado por **dependência**, não por atratividade. Os Clusters 1 e 2 vêm primeiro porque
destravam os demais: sem contexto consultável, todo conteúdo novo repete o bug do pet; sem
narrativa completa, toda vida nova continua ilegível.

---

### F4 — CONTEXTO DO MUNDO (elegibilidade consciente)

**Objetivo.** Nenhum evento pressupõe o que a vida não tem.
**Causa raiz.** Vocabulário de elegibilidade com 14 predicados que ignoram o estado concreto.
**Arquivos prováveis.** `src/types/index.ts` (bloco `condicoes`),
`src/systems/events/eligibility.ts`, catálogo em `src/data/events/`.
**Entra.** Predicados `temPet`, `temVeiculo`, `temImovel`, `temIrmaos`, `temAmigos`, `temDivida`,
`moraComPais`, `porteCidade`; aplicação aos 32 pares de risco; uso de `emEscola` nos 14 eventos
escolares; auditoria de cobertura antes/depois.
**Não entra.** Conteúdo novo. Sistema social. Economia. Avatar.
**Métricas.** Pares de risco alto: 32 → 0. Eventos estruturalmente inalcançáveis: manter
justificados. Cobertura não pode cair sem causa documentada.
**Playtest humano:** não obrigatório (verificável por harness).

---

### F5 — NARRATIVA COMPLETA E BIOGRAFIA SEM BURACOS

**Objetivo.** Todo acontecimento chega com contexto; nenhum ano some da vida.
**Causa raiz.** `evento.descricao` nunca publicada; catálogo de memórias só cobre adultos.
**Arquivos prováveis.** `src/systems/agingSystem.ts`, `src/systems/eventSystem.ts`,
`src/systems/memorias/pequenaMemoria.ts`, `src/presentation/outcomePresentation.ts`.
**Entra.** Publicar situação + desfecho como **uma** entrada; revisão dos 24 casos B/C; memórias de
infância; revisão do `>= 18` da rede final.
**Não entra.** Eventos novos. Reconversão de acontecimento em decisão. Mais popups.
**Métricas.** Anos sem linha: 6,0% → < 1%, e **1-5: 37,1% → < 2%**. Maior lacuna ≤ 1 ano. Linhas
por ano **não** pode dobrar. Modais por ano: inalterado.
**Playtest humano: SIM** — é percepção de leitura.

---

### F6 — ECONOMIA DOMÉSTICA E PATRIMÔNIO COM FUNÇÃO

**Objetivo.** Dinheiro que acaba; casa e carro que mudam a vida.
**Causa raiz.** Despesa constante; parceiro fora do caixa; patrimônio sem consumidores.
**Arquivos prováveis.** `src/systems/economySystem.ts`, `src/types/index.ts` (`Property`),
`src/systems/careerSystem.ts`, `src/data/assetsData.ts`.
**Entra.** Despesa proporcional à renda e ao padrão; parceiro com renda e custo; custo de filho por
idade; imóvel como moradia (quem mora, residência principal); veículo habilitando oportunidades;
custo recorrente por classe de bem.
**Não entra.** Pagar conta manualmente. Simular abastecimento. Imposto detalhado. Financiamento
completo.
**Métricas.** Taxa de poupança para a faixa **5–20%** nos perfis A–H. Perfil D **não** pode
acumular 7 dígitos em 10 anos sem decisão deliberada. Perfil G continua deteriorando. Patrimônio
com **≥ 3 consumidores** fora da economia.
**Playtest humano: SIM** — é percepção de dificuldade.

---

### F7 — VIDA SOCIAL E CRONOLOGIA FAMILIAR

**Objetivo.** Pessoas que entram pela convivência; filhos com cronologia humana.
**Causa raiz.** Único caminho social é `gerarCandidatosNamoro()`; `terFilho()` cria filho pronto.
**Arquivos prováveis.** `src/systems/relationshipSystem.ts`, `src/systems/familySystem.ts`,
`src/types/index.ts`, `src/systems/agingSystem.ts`.
**Entra.** Contexto → convivência → conhecido → amizade → amizade próxima (e → interesse
romântico); afastamento por falta de convívio; concepção → gestação → descoberta → nascimento;
fertilidade por idade; intervalo entre gestações; nascimento como acontecimento automático.
**Não entra.** Adoção. Gêmeos (avaliar depois). Árvore genealógica estendida. Chat com NPC.
**Métricas.** Vidas sem nenhum amigo: 60% → **< 20%**. Filhos por vida: mediana 23 → **1-3**.
Nascimentos após 55 anos: 32% → **~0%**. Idade no primeiro filho compatível com dados brasileiros.
Cliques em "conhecer pessoas" deixam de ser a fonte principal de relações.
**Playtest humano: SIM.**

---

### F8 — EDUCAÇÃO BRASILEIRA E LOCALIDADE

**Objetivo.** Etapas educacionais separadas; oferta que depende de onde se mora.
**Causa raiz.** `IDADE_MINIMA_FACULDADE` gateia três etapas; curso não conhece lugar.
**Arquivos prováveis.** `src/systems/educationSystem.ts`, `src/systems/availabilitySystem.ts`,
`src/data/coursesData.ts`, novo perfil de cidade.
**Entra.** Separar preparação/ENEM/vestibular/candidatura/matrícula; permitir prova aos 17; perfil
de cidade por porte; oferta local; EAD; mudança para estudar com custo.
**Não entra.** Brasil Vivo completo. Cadastro de instituições reais. Cursinho como sistema
próprio. Simulação de prova.
**Métricas.** Concluinte do EM aos 17 presta vestibular **no mesmo ano**. Cidade pequena oferta
menos presencialmente que capital. Duração de cursos **inalterada** (guarda F2).
**Playtest humano: SIM** — é percepção de brasilidade.

---

### F9 — AVATAR 2.x

**Objetivo.** Gênero perceptível; fases anatômicas legíveis.
**Causa raiz.** Gênero não existe no pipeline visual.
**Arquivos prováveis.** `src/presentation/avatar/*`, `src/presentation/avatarRenderer.ts`,
`src/components/character/AvatarFace.tsx`.
**Entra.** Gênero como parâmetro propagado às proporções; dimorfismo **sutil** (mandíbula,
sobrancelha, pescoço, lábio); barba derivada de gênero + idade, **nunca em feminino por padrão**;
cabelo apropriado à fase (bebê não usa corte adulto); verificação visual humana.
**Não entra.** Assets externos. Redesenho da identidade. Editor novo. 3D.
**Métricas.** Distância medida entre retratos masculino e feminino > 0 (hoje é zero). Barba: 0% em
feminino por padrão. Verificação humana das seis fases.
**Playtest humano: SIM** — é o único critério que vale aqui.

**Pode ser antecipada** a qualquer momento: zero acoplamento com os outros clusters.

---

**Pendências herdadas, ainda abertas:** `SEM_APOSENTADORIA` (0 dos 1.543 anos 60+ sem cargo — e é
por isso que `lat_tempo_que_sobra` é inalcançável), `TRABALHO_COM_SAUDE_CRITICA`,
`NAMORO_INSTANTANEO`, `NPC_SEM_NOME`, `SALARIO_ALTO_IDADE_BAIXA`, saída da casa dos pais 0/105,
apenas 2 atividades até os 11 anos, promoções não reavaliam experiência.

---

## Validação desta auditoria

```
npm test            53 arquivos · 874 testes · 100% verdes
npm run typecheck   limpo
npm run build       ok
produção alterada   NENHUM arquivo
```

Único arquivo versionado fora de `docs/` e `scripts/audit/`: nenhum.
`scripts/audit/simulador.ts` ganhou `familiaFinal` no resultado (harness de auditoria).

**Parando aqui, conforme instruído.** Nenhuma correção implementada, nenhuma fase iniciada.
Aguardando revisão para decidir qual fase executar.
