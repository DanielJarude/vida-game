# Correção pós-FIX — pendências + economia do futebol e das artes

Base: `claude/fix-pos-rework2-integracao-carreiras` @ `34ab571` (mesma branch). Save **v17, sem mudança de versão** (o único campo novo, `caminhos.palco`, é opcional: saves v17 sem ele carregam e o ganham no primeiro ano). Sem merge em `main`, sem deploy, sem REWORK 3.

## Arquivos / sistemas alterados

- `sistemas/dinheiro.ts` — `seguranca` (leitura financeira); linha "Shows e apresentações"; `vereditoDePagar` marca falta de dinheiro.
- `plausibilidade.ts` — `Veredito.dinheiro`.
- `sistemas/profissao.ts`, `sistemas/gestao.ts`, `ui/comum.tsx` (`AcoesVivas`), `ui/vida.css` — ação conhecida sem dinheiro visível e bloqueada.
- `sistemas/negocio.ts` — "Você ainda não tem capital para isso" marcado como falta de dinheiro.
- `sistemas/esporte.ts` — `salarioDoContrato` (distribuição), `prazoDeContrato`, `salarioDaRenovacao`, `assinarContrato`.
- `conteudo/profissao.ts` — renovação mostra o mesmo número que aplica; turnê pela conta do palco; proposta com prioridade acima da renovação.
- `sistemas/palco.ts` (novo) — economia de palco; `sistemas/arte.ts`, `sistemas/trabalho.ts` (trabalho de palco não usa a tabela de freguesia), `sistemas/fechamento.ts`, `ui/jogo/Trabalho.tsx` (`PalcoDoAno`), `tipos.ts` (`Palco`).
- `sistemas/notoriedade.ts` — imagem do esporte com peso próprio.
- Testes: `__tests__/correcaoPosFix.test.ts` (18), `ui/__tests__/fixPosRework2.test.tsx` (+2), `__tests__/profissao.test.ts` (1 expectativa). Simulador: `scripts/sim/fixPosRework2.ts` (parte `economia`, política com disputas).

## Bloco 1 — Pendências

**A) Segurança financeira.** *Causa:* `seguranca` decidia só pelos meses de reserva; a margem do mês não entrava. Quem sobrava um terço da renda com pouco guardado aparecia "no limite". *Correção (na fonte única que a tela lê):* a leitura combina margem do mês (`sobra/renda`), reserva e peso das parcelas: déficit sem reserva → apertado; déficit com reserva → no limite, dizendo que o guardado cobre; parcelas ≥ 45% da renda → no limite; margem ≥ 15% → equilibrado ("sobra X% da renda; a reserva ainda é pequena, mas cresce"); pouca margem e pouca reserva → no limite. No vermelho, seguro e folgado seguem como antes.

**B) Ações sem dinheiro.** *Causa:* `acoesDoTrabalho`/`acoesDoNegocio` descartavam toda ação não tentável. *Correção:* o veredito agora diz quando o que falta é **dinheiro** (`Veredito.dinheiro`, marcado em `vereditoDePagar` e no capital do negócio). Ação conhecida sem dinheiro aparece desabilitada, com o motivo curto no lugar do "porquê"; qualquer outro impedimento (sem registro no conselho, não se aplica) continua escondendo — nada é revelado antes da hora. Sem regra financeira na UI.

**C) Testes frágeis por semente.** Nesta rodada nenhum teste antigo quebrou por sequência do gerador (a mudança da economia não adiciona sorteio ao ano comum). Os novos testes usam estado controlado e invariantes/faixas. Dívida registrada abaixo.

**D) Política — calibração.** Simulação (40 vidas por grupo, até 60 anos):

| grupo | recebeu convite | entrou | candidatou | elegeu ao menos 1× | disputas/vida | vitória por disputa |
| --- | --- | --- | --- | --- | --- | --- |
| sem intenção nem contexto | 8% | 0% | 0% | 0% | 0 | — |
| voluntariado, recusa convites | 95% | 0% | 0% | 0% | 0 | — |
| voluntariado, aceita convite, sem campanha | 95% | 95% | 0% | 0% | 0 | — |
| perseguindo desde os 20 | — | 100% | 100% | 100% | 15,9 | **36%** |

Primeira disputa de quem persegue: **0/40** eleitos. Política não é funil universal; persegui-la torna o caminho encontrável; candidatura não é eleição (64% das disputas se perdem); a vitória vem da base construída ao longo dos anos. O "100% eleito ao menos uma vez" é efeito de ~16 tentativas em 40 anos, não de eleição fácil. **Sem ajuste** (não há evidência de taxa extrema).

## Bloco 2 — Modelo econômico final do futebol

`salarioDoContrato` (bruto mensal, fonte única; reais de hoje, SM de `sistemas/renda`):

```
base da divisão (2 mil · 6,5 mil · 22 mil · 70 mil)
× tamanho do clube (grande 1,5 · tradicional 1 · regional 0,7)
× espaço (titular 1 · reserva 0,55)
× nome no mercado: 0,45 + (reputação/100)² × 2,2   (convexo)
× última temporada (±20% pela nota)
× fase (menos de 20: 0,55 · menos de 23: 0,8 · 3+ anos depois do auge: 0,85)
× estrela — só na elite, reputação ≥ 78 e notoriedade ≥ 60, com força plena só em clube grande
+ fora da elite, o valor de um nome conhecido (notoriedade ≥ 45)
piso: salário mínimo
```

Contratos fora da elite duram no máximo um ano (instabilidade: renovação anual, períodos sem clube, queda de divisão); na elite, 2–3 anos. A renovação usa o contrato anterior como âncora só para quem ainda rende (nota ≥ 6,5), e a decisão mostra exatamente o número que aplica. Patrocínio/imagem é outra renda (`rendaDeImagem`, linha "Patrocínio e publicidade"; no esporte com peso próprio). Um contrato longo assinado no auge é pago até vencer (é o que foi assinado).

**Simulação** (80 carreiras forçadas com técnica 72–90, jogador que quer seguir jogando; cada ano contratado é uma observação):

| categoria | mediana | p10 | p90 | máx |
| --- | --- | --- | --- | --- |
| divisão baixa · reserva | R$ 2.520 | 1.600 | 4.880 | 44.870 |
| divisão baixa · titular | R$ 3.100 | 1.600 | 9.800 | 60.400 |
| elite · reserva | R$ 82.900 | 56.100 | 230.630 | 568.340 |
| elite · titular | R$ 110.940 | 58.610 | 271.860 | 1.526.870 |
| elite · estrela (rep ≥ 78, fama ≥ 60) | R$ 343.670 | 133.950 | 1.041.270 | 1.550.000 |

Patrocínio à parte: mediana R$ 17,9 mil/mês (p90 43,6 mil). Todas as 80 carreiras passam por algum período sem clube (média 1,15 ano). Extremos: os casos acima de R$ 400 mil são jogadores de 29–34 anos com reputação 80–98 e fama 70+ em clube grande (Grêmio, Santos no universo do jogo), depois de temporadas de nota 8–9,6; o máximo de R$ 1,5 mi vem de reputação ~98 + fama alta + clube grande. Os valores altos fora dessas condições são contratos longos assinados no auge e ainda vigentes. Carreira: 14,2 anos, fim aos 34 (23–40); 24 de 40 acabam por falta de mercado.

## Bloco 3 — Modelo econômico final das artes

`sistemas/palco.ts` (música, teatro, dança):

```
alcance = maior entre: público do projeto, freguesia do trabalho artístico × 0,6, notoriedade vinda da arte  (+ um pouco de habilidade)
valor contratado de uma apresentação = 1.500 × e^(alcance/15,6) × escala da linguagem (música 1 · teatro 0,3 · dança 0,22)
custos = 30% (pequeno) a 65% (turnê grande) do contratado — equipe, produção, transporte, agência, impostos
datas no ano = (alcance/10)^1,45 × o ano (18% magro, 15% bom) × ensaio × quem vive disso
cachê do artista = contratado − custos
```

Quem vive do palco (músico, ator): a renda do trabalho É o cachê do artista do ano ÷ 12 (variável, "conforme os trabalhos"; líquido após imposto pela mesma `remuneracaoDe`). Quem toca por fora: linha própria "Shows e apresentações (média do último ano)". Publicidade/patrocínio: linha separada. A turnê (`arte_estrada`) usa a mesma conta. Trabalho mostra "O palco em ANO": N shows, cachê médio (valor contratado), contratado no ano, custos e o que ficou. Escrita, desenho e fotografia continuam na economia da obra (sem cachê de cantor).

**Simulação** (40 vidas por perfil, 6 anos cada):

| perfil | cachê contratado/show (mediana; p90) | shows/ano (p10–p90) | custos/ano (mediana) | cachê do artista/ano (mediana; p10–p90) | anos sem show | patrocínio/mês |
| --- | --- | --- | --- | --- | --- | --- |
| iniciante | R$ 3,3 mil; 5,8 mil | 2 (1–4) | R$ 2,2 mil | R$ 4,1 mil (1,4–12,1 mil) | 65% | — |
| regional/em ascensão | R$ 13,1 mil; 31,4 mil | 7 (2–14) | R$ 36 mil | R$ 51 mil (14–204 mil) | 0% | — |
| reconhecido | R$ 53 mil; 128 mil | 15 (4–27) | R$ 374 mil | R$ 380 mil (102 mil–1,26 mi) | 0% | R$ 300 |
| famoso | R$ 209 mil; 502 mil | 25 (7–43) | R$ 2,9 mi | R$ 2,3 mi (0,66–6,2 mi) | 0% | R$ 17,6 mil |
| excepcional | R$ 912 mil | 36 (11–61) | R$ 21,3 mi | R$ 11,5 mi (3,5–19,5 mi) | 0% | R$ 47,9 mil |

A carreira é irregular (o mesmo artista varia de 3 a 10 vezes entre anos); o iniciante não vive de arte; o topo raro chega perto de R$ 1 milhão **contratado** por show, com a maior parte indo para custos.

## Bloco 4/5 — Fonte única de renda e tempo

Quanto ganha: (1) salário/renda principal — `Emprego.salario` via `remuneracaoDe` (bruto, líquido, média com 13º); para atleta, sai de `salarioDoContrato`; para quem vive do palco, de `temporadaDePalco`; (2) variável profissional — o palco (no salário de quem vive disso, ou linha própria de quem toca por fora); (3) notoriedade — `rendaDeImagem`, linha própria; (4) negócio — retirada/caixa, como antes; (5) casa — `orcamento`. Trabalho, Dinheiro, Você e o fechamento leem essas mesmas funções. O jogo trabalha em **reais de hoje** (sem inflação na tela, `tipos.Economia`); a calibração usa esse referencial e o salário mínimo central (`SALARIO_MINIMO`); nenhum número nominal novo foi espalhado fora dos dois modelos.

## Testes

Novos (`correcaoPosFix.test.ts`, 18): segurança com sobra (equilibrado), equilíbrio apertado (no limite), déficit (apertado / reserva cobre), dívida relevante, invariante em 12 vidas; ação sem dinheiro visível e bloqueada, não elegível escondida; dois titulares da mesma divisão diferentes; reputação/temporada → mercado e contrato; estrela ≫ titular comum e depende de fama e clube grande; divisão baixa com renda baixa e contrato ≤ 12 meses; patrocínio separado e as telas na mesma fonte; temporada → contrato; palco (contratado ≠ artista, renda do trabalho = o que ficou), iniciante × topo, irregularidade, publicidade e shows paralelos separados, determinismo. UI (+2): ação bloqueada desabilitada com motivo; palco com os rótulos e "No bolso" = o que ficou. Alterado: 1 expectativa (contrato de 12 meses fora da elite).

## Validação

- Suíte: **684/684** (26 arquivos) — antes 664.
- TypeScript: limpo.
- Build: ok, sem avisos, sem ciclo. `build:itch` ok; smoke **18/18**.

## Auditoria adversarial curta

| procurado | resultado |
| --- | --- |
| salário diferente entre telas | não: Trabalho/Dinheiro/painel/renovação leem `remuneracaoDe`/`salarioDoContrato`/`salarioDaRenovacao` (a renovação mostrava um número e aplicava outro — corrigido) |
| cachê confundido com renda | não: "valor contratado", "custos", "ficou para você" separados |
| publicidade contada duas vezes | não: só `rendaDeImagem`, fora do palco e do salário |
| atleta estrela sem trajetória | não, salvo contrato longo assinado no auge ainda vigente (intencional) |
| iniciante com cachê nacional | não (mediana R$ 3,3 mil) |
| famoso com salário fixo artificial | não: o salário de quem vive do palco muda com o ano |
| ação bloqueada sumindo | corrigido em Trabalho e Negócio (falta de dinheiro) |
| segurança contraditória | corrigido na fonte |
| política dominando vidas comuns | não (8% recebem convite sem contexto; ninguém entra sem escolher) |
| efeito colateral | contratos anuais fora da elite faziam a renovação ocupar o ano da proposta de clube maior → proposta ganhou prioridade (propostas voltaram de 10 para 65 na simulação) |

## Dívida técnica restante

- Vários testes antigos ainda dependem de semente específica (os corrigidos na rodada anterior estão comentados); vale migrá-los para cenários montados (`cenarios.ts`).
- Checagens de dinheiro que não passam por `vereditoDePagar` (caixa do negócio em algumas ações de gestão) ainda escondem a ação.
- O palco cobre música, teatro e dança; ator de TV/novela, escritor, artista visual e dançarino de companhia (CLT) não têm economia própria de mercado — a obra e o salário existentes seguem valendo. Royalties não foram modelados.
- A amostra de estrelas do futebol vem de carreiras forçadas com técnica alta; a frequência real de estrelato deve ser medida na simulação em massa.
- Uma decisão prioritária por ano continua sendo a regra; a renovação usa a caducidade como proteção.
