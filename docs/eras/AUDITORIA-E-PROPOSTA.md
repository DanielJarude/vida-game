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
