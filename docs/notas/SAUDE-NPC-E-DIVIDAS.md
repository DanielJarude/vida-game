# Saúde de NPC na sucessão e auditoria das dívidas

Base: `fa80d10` (branch `claude/fix-pos-rework3-playtest`). Save continua **v19**: os campos novos são opcionais e validados no bloco `versao >= 19` de `save.ts`.

## 1. Saúde de quem não é o protagonista (pendência 2 do relatório pré-América do Sul)

**Problema.** Uma `Pessoa` só tinha `saude: number`. A filha que virava protagonista em `continuarComo` começava com `condicoes: []`, hábitos zerados e sem nenhum diagnóstico.

**Desenho.**

- `Pessoa.condicoes?: CondicaoNpc[]`, com `{ id, tInicio, gravidade, diagnosticada, tDiagnostico?, tarde?, tratando }`. Guarda **só o estado**. O nome, a perda de saúde e os textos vêm do **mesmo catálogo** do protagonista (`corpo.modeloCondicao`). Entram só as condições crônicas: nada de lesão nem de dengue.
- **Uma conta de risco só.** `ModeloCondicao.risco` agora recebe `FatoresDeRisco` (sedentarismo, cigarro, estresse, humor, trabalho pesado, município, histórico familiar). Os números do protagonista não mudaram:
  - `fatoresDoProtagonista(v)` lê o estado do protagonista;
  - `fatoresDaPessoa(v, p)` lê a ficha leve do NPC:
    - os hábitos saem da semente da pessoa (`habitosDaPessoa`: cerca de 12% fumam e 45% são sedentários), sem gastar o gerador;
    - um aperto recente (luto, separação, desemprego) conta como estresse;
    - o trabalho conta pelo `ocupacaoId`.
- **Histórico familiar (novo, nos dois sentidos).** Pai ou mãe com a condição diagnosticada multiplica o risco: pressão alta ×1,4, diabetes ×1,5, câncer ×1,3, depressão ×1,3. O filho do protagonista hipertenso tem mais risco, e o protagonista também, pelos pais NPC.
- **O ano de um NPC** (`anoDeSaudeDaPessoa`) segue as regras do protagonista numa versão leve:
  - surge no máximo uma condição por ano, pelo risco do catálogo, e sem nome;
  - o diagnóstico vem pelos adultos da casa, se for criança, ou pelo consultório, mais cedo para quem tem renda de plano;
  - há tratamento ou não, com remissão do câncer e da coluna e melhora da saúde mental;
  - a perda de saúde do ano é a mesma de `estado.fatoresSaude`: `perdaDaCondicao × 0,5` abaixo dos 45 anos;
  - roda num **gerador derivado** (`rngDe(v.id, 'saude', p.id, t)`), então a sequência do gerador da vida não muda.
- **Morte.** `riscoDeMorte` agora é uma função só, usada pelo protagonista e pelo NPC: multiplicadores de pressão alta e diabetes, mais o risco extra do câncer.
  - A deriva de idade do NPC acompanhado ficou menor, porque parte dela agora vem das condições, com nome.
  - Calibração: expectativa de vida de quem chega aos 20 anos foi de **77,6 → 77,5 anos** (1.500 NPCs).
  - Aos 60 anos, 76% têm alguma condição: hipertensão 60%, diabetes 29%, coluna 5%, câncer 3%, depressão 4%, ansiedade 3%.
- **Quem é acompanhado.** NPCs com parentesco ou romance (`processarMortes` → `processarCorpoDePessoa(..., acompanhar)`). Amigos e colegas continuam só com o número de saúde.
- **Saves antigos.** `condicoes` ausente quer dizer "ainda não acompanhada". Na primeira leitura, `garantirCondicoes` reconstrói os anos já vividos com o mesmo ano de saúde, sem efeitos. Nenhuma condição aparece antes da idade que o catálogo permite.
- **Na vida do jogador.**
  - O diagnóstico entra na trajetória do descendente ("A vida dela").
  - Diabetes ou câncer de alguém próximo vira linha na Linha da Vida.
  - O câncer abre `aperto: 'doenca'`, que já liga "estar junto", a internação e o rosto "doente".
- **Telas.**
  - A ficha em Pessoas mostra "Saúde: pressão alta (em tratamento)". Aparece só o que tem nome (`saudeConhecida`).
  - A escolha de sucessor no Legado mostra a mesma linha (`Sucessor.saude`).
- **Sucessão 1:1** (`continuarComo`):
  - `condicaoDaPessoa` converte cada condição, com nome, começo, diagnóstico conhecido ou não, tratamento e "tarde";
  - os hábitos vêm de `habitosDaPessoa`;
  - a saúde em número é a dela;
  - os fatos `diagnostico_*`, `teve_*` e `controle_*` são preenchidos, para o diagnóstico não ser anunciado de novo;
  - as consequências saem sozinhas do motor: "Remédios e consultas" no orçamento, o peso na saúde e no trabalho, os sinais do que ainda não tem nome na tela "Você";
  - quem morreu vira NPC com as condições crônicas dele, que viram o histórico familiar de quem continua.

**Correção colateral.** `situacoes.processarSituacoes` e `resolverSituacao` usavam `caminhos.situacao = undefined`. Agora usam `delete`. Com `= undefined`, a vida recarregada andava igual, mas o JSON saía com outra ordem de chaves (`rework3`: "salva e reabre igual; o ano seguinte é o mesmo").

## 2. Auditoria das dívidas (pendência 6)

**Método** (`scripts/sim/dividas.ts`, com os agentes em `scripts/sim/agentes.ts`):

- 250 vidas, do nascimento à morte (corte aos 95): 5 políticas × 5 classes × 10 sementes, com o mesmo andaime de família do `sucessao.ts`.
- Na morte, a medida é a mesma da pendência: `partilhar(...).naoCoberto > 0`.
- Ano a ano, o script registra:
  - a situação da pessoa: trabalhando, aposentada, sem renda, na casa da família, ou podendo se aposentar sem ter se aposentado;
  - renda e despesa;
  - a dívida cara, que exclui financiamentos;
  - pelas linhas do `financas.extrato`: o buraco do ano coberto no cartão, o atraso, as contas que viraram nome sujo, o resgate e a ajuda da família;
  - as dívidas novas que nasceram fora do fechamento (acordo de despejo, leilão, festa);
  - o juro do rotativo.
- Políticas:
  - `primeira`: o agente do `sucessao.ts`;
  - `primeira_trabalha`: o mesmo, mais procurar trabalho e aposentar quando pode;
  - `prudente`;
  - `economico` e `gastador`, as estratégias do simulador geral.

**Números** (insolventes na morte, 50 vidas por política; o ruído é de ±7 pontos):

| Política | Antes (HEAD) | Depois | Leitura |
| --- | --- | --- | --- |
| primeira | 34% | 42% | 75–79% dos anos adultos **sem renda nenhuma** |
| primeira_trabalha | 24% | 26% | Procura trabalho; o que sobra é aluguel caro na velhice |
| prudente | 10% | 6% | Trabalha, guarda, mata o cartão com o guardado |
| economico | 6% | 6% | |
| gastador | 22% | 22% | Padrão "folgado" com renda menor que a despesa (escolha) |
| **todas** | 19% | 20% | |

- Na sucessão (`sucessao.ts`, 24 famílias × 3 gerações):
  - com `primeira`, 18 de 60 mortes (30%), contra 42% no relatório anterior;
  - com `AGENTE=prudente`, 2 de 62 (3%);
  - 0 problemas, e as condições conferidas 1:1 em todas as sucessões.
- Por classe, depois: vulnerável 22%, trabalhadora 16%, média-baixa 16%, média 36%, alta 12%. A classe média pesa pelo gastador (5/10) e pelo `primeira` (8/10): o padrão de gasto é mais alto e a renda própria, nula.

**De onde vem a dívida** (agente `primeira`, depois):

- tipo da dívida na morte: cartão 73% (inclui empréstimos "em cobrança", que viram tipo cartão) e empréstimo 27%;
- o que gerou a dívida:
  - 74%: atraso de aluguel e de parcelas;
  - 15%: dívidas novas fora do fechamento, quase todas "Acordo do aluguel atrasado" (o despejo);
  - 10%: juros do rotativo;
  - 1%: o buraco do ano no cartão;
- situação nos anos que fecharam no vermelho: sem renda 45%, na casa da família sem renda 36%, aposentado (BPC) 16%, trabalhando 3%;
- aos 70 anos: renda mediana de R$ 1.755 (BPC), despesa de R$ 3.671.

**Diagnóstico.**

1. **Deficiência do agente (a maior parte dos 42%).** O "primeira opção" não age: nunca procura trabalho e vive dos pais. Quando os pais morrem, o motor o põe num aluguel (`obrigacoes.casaSemFamilia`) que ele não paga. Depois vêm o despejo, o favor de 3 anos, o aluguel de novo e o acordo do despejo que nunca é pago. Isso é comportamento emergente coerente para quem não tem renda, não um bug. Um agente que só procura trabalho já cai para 24–26%; um prudente, para 3–10%.
2. **Emergente plausível (o resto).** O aposentado de renda baixa que perde a casa da família e passa a pagar aluguel queima a reserva e cai no cartão e no atraso. É o caso de `primeira_trabalha`, que vive na casa dos pais até os 60. O gastador gasta mais do que ganha por escolha. Não há conta errada aqui.
3. **Distorção econômica confirmada: o rotativo sem teto.**
   - O cartão cobrava 4,5% ao mês sobre o saldo inteiro, para sempre (≈ +70% ao ano).
   - Quem pagava um pouco todo ano não ia para a cobrança, onde os juros caem para 1% ao mês, e via a dívida crescer sem limite.
   - Antes, no gastador, os juros do rotativo eram **95%** de toda a dívida gerada: uma vida com o cartão explodindo, na ordem de dezenas de milhões. Depois, são **14%**.
   - A Lei 14.690/2023 (art. 28) limita juros e encargos do rotativo a 100% do valor original.
   - **Correção** (`dinheiro.processarDinheiro`, `cobrirRombo`):
     - `Divida.principal`, opcional, guarda o que foi tomado;
     - o saldo para em 2× o principal;
     - o pagamento abate primeiro os encargos;
     - dívidas antigas, sem principal, contam o teto a partir do saldo atual.
   - **Efeito:** o tamanho da dívida cai (mediana não coberta do `primeira` foi de R$ 28 mil → R$ 25,5 mil, em 160 vidas com as mesmas sementes). A proporção de insolventes não muda: o teto não é causa dos 42%, e não foi calibrado para isso.
4. **Hipóteses descartadas.**
   - **Aposentadoria baixa demais em relação ao custo:** quem contribuiu (prudente, econômico) tem renda maior que a despesa aos 70.
   - **Bens que existem e não pagam a dívida:** os insolventes morrem com ativos ≈ 0, então não sobra bem para vender.
   - **Empréstimo automático nunca pago:** só o acordo do despejo, que vai para a cobrança e caduca em 5 anos, como desenhado.
   - **Erro de contabilidade:** `economia.ts` deu 0 diferenças e 0 linhas de ajuste nas três populações (2.578, 1.161 e 240 anos).

**Agente melhorado.**

- `scripts/sim/agentes.ts` traz `primeira_trabalha` e `prudente`. A vaga escolhida é a de maior chance × salário, não a dos sonhos.
- `sucessao.ts` aceita `AGENTE=` e confere a saúde 1:1 em cada sucessão.

## 3. Arquivos

- **Motor:**
  - `tipos.ts`: `CondicaoNpc`, `Pessoa.condicoes`, `Divida.principal`;
  - `sistemas/corpo.ts`: fatores de risco, saúde do NPC, `riscoDeMorte`, `saudeConhecida`;
  - `sistemas/sucessao.ts`;
  - `sistemas/familia.ts`;
  - `sistemas/cuidados.ts`: usa `riscoNoAno`;
  - `sistemas/dinheiro.ts`: o teto do rotativo;
  - `sistemas/situacoes.ts`;
  - `save.ts`: a validação.
- **Interface:** `ui/jogo/Pessoas.tsx`, `ui/telas/Legado.tsx`.
- **Simulações:** `scripts/sim/dividas.ts` (novo), `scripts/sim/agentes.ts` (novo), `scripts/sim/sucessao.ts`.
- **Testes novos:**
  - `motor/__tests__/saudeNpc.test.ts` (12): perda e morte por condição, histórico familiar, só o que tem nome, idade compatível na reconstrução e em 20 anos de vida, a filha de 37 com pressão alta que continua com ela e com as consequências, save e recarga, save antigo, sem condição continua sem nada, conversão campo a campo;
  - `motor/__tests__/dividas.test.ts` (6): o teto, ano após ano, a dívida antiga, o principal no crédito novo e no pagamento, o extrato sem ajuste, o save;
  - `ui/__tests__/sucessao.test.tsx` (+1).
- **Testes ajustados** (a semente do teste não valia, ou o rótulo estava desatualizado; nenhuma expectativa de comportamento afrouxada):
  - `momentos2`: a semente era regravada pela transação;
  - `generalizacao`: as 30 tentativas tinham o mesmo sorteio;
  - `profissao`: outro sorteio se a vida acaba antes dos 6 anos;
  - `fix4`: o regex não tinha "numa disputa aberta", rótulo atual de `palavraDaChance`.

## 4. Pendências

- **Aposentadoria de quem pode e está sem emprego.** A decisão `trab_aposentar` só abre para quem trabalha, e `aposentadoriaAutomatica` pula quem tem direito. Quem tem direito e está desempregado fica sem renda até agir. Apareceu em 7 de 50 vidas do `economico`, mas não em nenhum insolvente, então não foi mexido.
- **"Contas que ficaram sem pagar (viraram nome sujo)".** O buraco que não cabe no crédito nem no atraso é perdoado: vira linha `divida` no extrato, mas não vira dívida. É leniência, não causa de insolvência.
- **Remédios na casa da família.** "Remédios e consultas" (R$ 180 por condição tratada) é cobrado de adulto sem renda que mora com a família. Isso gera os cartões de R$ 500 do agente passivo, enquanto na vida real o SUS e a Farmácia Popular dão o remédio de hipertensão e diabetes. Vale calibrar à parte.
- **Despejo.** O atraso de aluguel pode chegar a 24 meses antes do despejo.
- **Saúde de amigos e colegas.** Não é acompanhada, de propósito.
