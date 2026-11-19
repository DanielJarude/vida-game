# ERAS HISTÓRICAS · Auditoria breve e proposta técnica (v1, protótipo)

Base: VIDA 18 publicado (`9fa7d7e`, docs `48f8eaf`). Branch do protótipo: `claude/vida-eras-historicas`.

## 1. O que já existe e será aproveitado

| Sistema | Onde | Situação para as eras |
|---|---|---|
| Calendário | `motor/tempo.ts` (`t = ano*12+mês`), `criacao.ts` (`OpcoesCriacao.ano`, padrão 2026) | O motor já nasce em qualquer ano. Sonda: uma vida de 1984 vive 45 anos sem erro (`scripts/sim/eras0.ts`). |
| Unidade monetária | `sistemas/economia.ts` + `mundo/moeda.ts` | O motor conta em **reais de poder de compra de 2026**; a moeda só aparece na formatação (`formatarDinheiro`, `emMoedaLocal`, `daMoedaLocal`), com o país corrente definido em **um ponto** (`entrarNaVida`). Isso permite mostrar a moeda da época sem tocar em nenhum saldo. |
| Economia anual | `avancarEconomia` (fases, inflação, juro, bolsa, imóveis, semente própria) | Inflação e fases são sorteadas; o dinheiro parado perde a inflação do ano (`dinheiro.ts`). |
| Eventos mundiais | `v14/mundo/mundo14.ts` + `dados14/mundo/catalogo.ts` (`HISTORIA_REAL` 2001–2023, Copa/Olimpíada, marcos de profissões) | Já escreve no "Enquanto isso" e na Linha da Vida. Os fatos brasileiros entram ao lado, sem duplicar. |
| Celular | `v15/celular/celular15.ts` (`temCelular15`: único portão), `ui/v15/celular/Celular.tsx` (apps) | Mensagens, namoro, rede, notícias, agenda, mapas, banco, e-mail — o motor de mensagens serve a qualquer meio. |
| Redes sociais | `dados/redes.ts` (Instagram, YouTube, TikTok, Twitch, X, Facebook, OnlyFans), `sistemas/redes.ts` (vereditos) | Sem data de lançamento: hoje existiriam em 1984. |
| Profissões | `dados/ocupacoes.ts` (`surge`, `declinio`), `trabalho.elegibilidade` | `surge` só olha para o futuro; serve também para o passado. |
| Bens | `dados/coisas.ts` + `sistemas/coisas.ts` (`disponibilidadeComprarCoisa`) | Catálogo contemporâneo (celular, notebook, tablet, TV OLED...). |
| Veículos | `sistemas/mercado.ofertasDeVeiculos` (zero-km = versões atuais) | Zero-km de 2026 em 1984. |
| Linha da Vida | `ui/jogo/LinhaDaVida.tsx` (ano, idade, capítulos por fase, fios) | Recebe a marca da época e um fio "O país". |
| Saves | `save.ts` (v20, normalizadores idempotentes `normalizarXxx`) | Campo opcional novo; sem migração. |
| Pacotes | `vite.config.ts` (`motor-textos` 797 kB, `motor-dados` 782 kB, limite 800 kB) | Nada novo entra nesses pacotes. |

## 2. Lacunas encontradas (sonda de 1984 no motor atual)

- Valores em R$ em 1988; crises sorteadas em anos sem recessão (1996) e nenhuma em 1990.
- Smartphone, Pix, aplicativo de namoro, redes atuais e e-mail disponíveis desde a infância de quem nasceu em 1984.
- Zero-km, celulares e eletrônicos de 2026 nas lojas dos anos 1980.
- Nenhum acontecimento brasileiro real (só os mundiais de 2001 em diante).

## 3. Proposta técnica

**Um campo opcional no save**: `Vida.era = { pais: 'BR', ano, decada }`. Ausente = vida contemporânea (todos os portões novos devolvem o comportamento atual). Saves antigos não ganham época.

**Uma camada histórica central** (`src/motor/eras/`), orientada por dados:
- `eras/dados/br/*` — dados datados e com fonte: IPCA mensal (SIDRA 1737), PIB anual (Ipeadata/IBGE), salário mínimo vigente (Ipeadata), padrões monetários (BCB), acontecimentos, tecnologias (lançamento · chegada ao Brasil · popularização · massa), cultura por período, profissões e veículos da época.
- `eras/contexto.ts` — a pergunta única que os sistemas fazem: `contextoDoAno(v)` e `tecnologia(v, id)` → `indisponivel | rara | comum` (pela data, classe e cidade).
- `eras/ano.ts` — o ano histórico: a economia segue a série real (inflação e fase pelo PIB), as trocas de moeda, o Plano Collor, os acontecimentos com condições (idade, cidade, renda, trabalho), as chegadas de tecnologia em casa e as lembranças culturais.

**Moeda e poder de compra** — a unidade interna continua a mesma (real de 2026). Na tela e no texto, um valor vira moeda da época por dois fatores *exatos*: o número‑índice do IPCA (nível de preços daquele mês contra dez/2025) e a cadeia oficial de conversões (Cr$→Cz$ ÷1000 em 28/02/1986; →NCz$ ÷1000 em 16/01/1989; →Cr$ 1:1 em 16/03/1990; →CR$ ÷1000 em 01/08/1993; →R$ ÷2750 em 01/07/1994). Como os saldos internos não mudam, **nenhuma troca de moeda cria ou destrói dinheiro**; o texto da biografia guarda o valor nominal da época. A inflação real alimenta o motor (com uma aproximação documentada para a hiperinflação: a perda do dinheiro parado é limitada, porque as famílias usavam poupança/overnight com correção monetária).

**Portões nos sistemas existentes** (uma linha cada, lendo o contexto): `temCelular15`/apps do Celular, vereditos das redes, aplicativo de namoro, compra de coisas, ofertas de veículos, elegibilidade de profissões, salário mínimo.

**Interface**: seção "Quando você nasce" na tela Nascer (décadas, anos, prévia); aparelho de comunicação conforme a época (telefone fixo e cartas → celular de teclas e computador → smartphone) reaproveitando o motor de mensagens; selo da época e moeda no cabeçalho; painel "A época"; marca de década e fio "O país" na Linha da Vida.

**Pacotes**: `eras/dados/**` → `eras-dados`; `eras/**` → `motor-eras`; o módulo de moeda (dados mensais pequenos) fica na base porque `formatarDinheiro` está na base.

**Fora da v1** (documentado): outros países, antes de 1980, política simulada do jogador com partidos de época, remodelagem visual das cidades, renda real por época além do salário mínimo.

---

# v2 · Auditoria de retomada (2026-11-15) e arquitetura

## Estado encontrado

- GitHub: `main` em `89f707e` (docs da VIDA 22); produção (`claude/fix-pos-rework3-playtest`) em `aa985fd` (VIDA 22).
- A branch `claude/vida-eras-historicas` (`e719fbd`) é **ancestral** da `main` (29 commits atrás, nada exclusivo): a v1 foi
  publicada em 13/11/2026 e está inteira na VIDA 22. A v2 parte da `main` (branch `claude/eras-v2`); nada antigo foi
  reaplicado por cima.
- Código v1 presente e funcionando: `src/motor/eras/` (base: séries, moedas, tecnologias, contexto, peneira, coisas,
  veículos, profissões; `ano.ts`; dados: acontecimentos e cultura) e `src/ui/eras/`. Testes `erasHistoricas.test.ts`: 22/22.

## Lista curta (antes da v2)

| Situação | Itens |
|---|---|
| Concluído (v1) | moeda e cadeia oficial; IPCA/PIB reais até 2025; Plano Collor; 53 acontecimentos + Copas/Olimpíadas; 39 tecnologias com 4 datas; aparelho por época; portões de redes, namoro, lojas, coisas, 42 veículos de 5 classes, 14 profissões, ProUni/FIES/EAD/cotas; peneira na Linha da Vida e no celular; painel "A época"; save opcional |
| Parcial | peneira só na Linha da Vida e nas mensagens (não nas cenas de decisão); veículos só em 5 classes; marcas: 19 |
| Ausente | salários e preços da época (só o mínimo); política/partidos da época; moda; cidades; leis; anos 1970; outros países |
| Com defeito | pais e pessoas do mundo podiam ter profissão inexistente no ano ("dona de loja on-line" em 1989); UPA antes de 2008; a cena do "print no grupo da turma" em 1992 (achados pela auditoria textual da v2) |
| Sistemas posteriores à v1 (VIDA 19–22) sem portão | roupas e provador (VIDA 21–22), móveis da casa (12.8/22), classes de veículos da VIDA 21, fama/agenda (22), clubes/automobilismo (20), NPCs autônomos (19) |

## Arquitetura v2 — a mesma pergunta central, mais módulos

Tudo continua em `src/motor/eras/base` (pacote `eras-base`, sem importar nada de cima) e responde pela **vida em
processamento** (`mesHistoricoCorrente`, definido ao entrar na vida): ausência de época = 1/igual/permitido.

| Pergunta | Módulo | Ganchos (um ponto cada) |
|---|---|---|
| Quanto se ganha e quanto custa? | `economia.ts` + `economiaSeries.ts` (gerado) | `lugares.economiaLocal` (renda, aluguel), `renda.salarioLocal` (distribuição), `dinheiro.orcamento` (mercado, plano, escola), `lojas.precoNaLoja` e `coisas.precoDaCoisa` (categoria) |
| Este partido existe? | `partidos.ts` | `politica.partidosDoPais`, `partidos.partidoDe`, `eras/ano.partidoMuda` |
| Esta peça se vende? | `moda.ts` | `estilo.disponibilidadeComprarItem`, `lojas.ofertasDaLoja`, `Lugares.tsx`; desenho `ui/eras/pecasEras` e `modaDaDecada` → `Figura` |
| Este veículo existe? | `veiculos.ts` (ampliado) | `mercado` (já existia) |
| A lei permite? | `leis.ts` | `interacoes` (pedir casamento, terminar) |
| A cidade tem metrô? | `cidades.ts` | `economiaLocal.transporte`, `Cidade.tsx` |
| Esta frase faz sentido no ano? | `anacronismos.ts` (+ detector `TERMOS_DATADOS`) | `nucleo.escrever`, `celular15`, `conteudo/motor` (cenas), `escola` |
| Esta profissão existe? | `profissoes.ts` (+ `ocupacaoExisteAgora`) | `ocupacoesDaClasse`, `familia` (pais e irmãos) |

**Outros países**: os dados históricos ficam por país (`pais: 'BR'` na época; séries e listas nomeadas `_BR`); os portões
só valem no Brasil (`salarioLocal` e `economiaLocal` conferem o país do município). Nenhum dado brasileiro é aplicado fora.
Um país novo exige as suas séries, moedas, partidos, acontecimentos e tecnologias — não foi feito nesta versão.

---

# v3 · Auditoria de retomada (2026-11-18) e arquitetura internacional

## Estado encontrado

- Produção e `main` em `7e0d485` (VIDA 27). As eras v1/v2 e a auditoria das eras modernas estão inteiras no código:
  `src/motor/eras/{base,dados,ano.ts}` e `src/ui/eras/`. Testes de eras: 49/49 antes de qualquer mudança.
- Cobertura: só o Brasil, de 1970 a 2025. O motor já tinha 27 perfis de países vivíveis (cidades, nomes, escola, trabalho,
  política) — a base certa para a v3: a época de um país é uma camada sobre o perfil dele, não um país novo.
- O que travava a expansão: (1) `Vida.era.pais` era o literal `'BR'`; (2) a moeda histórica, a economia e as séries eram
  brasileiras e o "mês histórico" era global, sem país; (3) as tecnologias tinham só a data de chegada ao Brasil; (4) o
  mercado de veículos da época juntava as versões brasileiras em qualquer país (um vazamento); (5) nada antes de 1970: sem
  série de preços, sem moeda (mil-réis), sem eletricidade/água/geladeira/TV como tecnologia, sem roupa nem carro antigos,
  sem mortalidade da época, sem guerra, sem regras de direitos; (6) `motor-textos` a 155 bytes do limite de 800 kB e
  `motor-dados` a 2,7 kB — nada novo podia entrar neles.

## Arquitetura v3 — um pacote por país, a mesma pergunta central

| Pergunta | Onde | Como |
|---|---|---|
| Qual é o país da época? | `eras/base/moedas` (`definirMesHistorico(t, pais, lado)`), `eras/base/contexto.paisDaEpoca` | o da moradia quando ele tem pacote; senão, o da escolha. O lado do país dividido (`mundo/vida.ladoDaVida`) |
| Quais dados? | `eras/base/pacote.ts` (`PacoteDeEra`, registro) + `eras/paises/<id>/{serie,pacote}.ts` | um arquivo de dados por país, carregado sob demanda (`eras/paises/carregar`, chamado por `mundo/carregar`), um pacote de build por país (`eras-us`, `eras-gb`...: 40–51 kB) |
| Quanto vale o dinheiro? | `mundo/moeda.fatorNominalNoPais` | fator de hoje × nível de preços do mês ÷ 2025 × unidades da moeda da época; escritas antigas (réis, £sd) |
| Quanto se ganha? | `eras/base/economia.rendaDaEpocaNoPais`, `mundo/economia.salarioMinimoDoPais` | PIB por pessoa do ano ÷ 2025; o mínimo legal da época, ou o piso de fato |
| Esta tecnologia chegou? | `eras/base/contexto.datasNoPais` | datas do pacote do país (e as do leste alemão) |
| O que a lei e a sociedade impunham? | `eras/base/sociedade` (+ `regrasBR`) | regras com período, lugar, lado e a quem pesam; guerras com alcance e letalidade |
| Quanto se vivia? | `eras/base/mortalidade` | multiplicadores por país e ano no `sistemas/corpo` |
| O ano histórico | `eras/ano.processarEra` → `eras/v3/anoPais.processarEraNoPais` | o Brasil pelo caminho da v1/v2; os outros pelo pacote; regras, guerras e estudo para todos |

Nenhum dado novo entrou em `motor-textos` nem em `motor-dados`: os pacotes dos países ficam fora, e o motor da época
(`motor-eras`, 87 kB) e a base (`eras-base`, 123 kB) têm folga. Vida contemporânea: todo fator é 1, toda regra é vazia.

# v4 · Auditoria de retomada (2026-11-19) e a camada social

## Estado encontrado

- Produção e `main` em `e5fe53d` (v3). Código conferido contra o relatório: seis países, Brasil desde 1900, Argentina desde
  1945, pacotes por país (`eras/paises/<id>`).
- As regras sociais da v3 (`RegraSocial`) eram texto escrito uma vez; só a eleição, a universidade dos filhos e a guerra as
  consultavam. Partidos fora do Brasil: genéricos também nas vidas históricas; Brasil antes de 1966: nenhum. O contrato
  esportivo vindo da base ignorava a data do profissionalismo. `motor-dados` a 0,7 kB do limite.

## Arquitetura v4 — a mesma pergunta central, agora com consequência

| Pergunta | Onde | Como |
|---|---|---|
| O que fecha a porta, o que diminui a chance? | `eras/base/sociedade4` (`epocaNaVaga`, `epocaNoSalario`, `epocaNaFaculdade`, `epocaNoCredito`, `epocaNaPolitica`) | barreiras por país, período, lugar, lado, a quem pesam, natureza, domínio, alvo, efeito e resíduo; lidas pelos sistemas (trabalho, escola, ações de crédito, política) |
| O que o mundo desta vida já mudou? | `v.era.historia` + `sociedade4.alteracaoQueVale` / `regraDerrubadaAntes` / `instituidoAqui` | alterações com mês, alcance (país, estado, cidade), autor e revogação; o lugar da vida em processamento vem de `mundo/vida.entrarNaVida` |
| Quem pode mudar o quê? | `eras/v4/politica4` (ganchos `REFORMAS_DA_EPOCA` em `sistemas/politica`) | a competência do cargo, a chance (apoio, oposição, maturidade, pressão, regime), o custo, a linha do tempo alternativa |
| A ação coletiva | `eras/v4/movimentos4` (Acao `eras4`) | participar, organizar, financiar, sair; risco por período; pressão |
| O ano social | `eras/v4/sociedadeAno` (chamado depois das regras da v3, nos dois caminhos do ano histórico) | encontros, barreira do casamento, partido proibido, pressão, contestação, herança |
| Os dados | `eras/base/sociedadeBR.ts`; `eras/paises/<id>/sociedade.ts` (no pacote do país) | um arquivo por país; nenhum dado novo em `motor-dados` nem em `motor-textos` |
| O limite de 800 kB | `vite.config.ts` (`ehFolhaPura` → `motor-catalogos`) | os catálogos sem import em tempo de execução saem do pacote dos catálogos sozinhos |
