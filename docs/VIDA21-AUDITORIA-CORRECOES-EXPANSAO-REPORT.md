# VIDA 21 — Auditoria, correções e expansão · relatório

Branch `claude/vida21` (a partir de `6423a98` = `origin/main`, VIDA 20 publicada). Data: 2026-11-14.
**Publicado** em 2026-11-14 (commit `9571459`): ver §15.

Legenda de estado: **[T]** implementado e testado · **[V]** implementado, validação parcial · **[P]** parcial · **[N]** não implementado · **[B]** bloqueado.

## 1. Estado inicial encontrado
- Checkout de trabalho `~/vida-trabalho/r129` em `6423a98` (= `origin/main`; código da VIDA 20 em `d33c449`). O clone `/mnt/c/Daniel/vida-game` estava num branch antigo (não usado).
- O "Manual Mestre de Diretrizes" citado no adendo **não está no repositório nem foi anexado**: segui as dez regras transcritas no adendo.
- Auditoria por simulação (10 vidas × 65 anos, mensagens respondidas ao acaso; `~/vida-trabalho/a21/sim/conversas21.ts`) e por renderização (galerias de fachadas, roupas, veículos).

## 2. Preservado (auditado, não reaberto)
Tatuagens (região, tamanho, posição, escala, rotação, espelho, cor, intensidade, letreiro, significado, retoques, laser, cobertura, lupa), piercings (hélix, trágus, nariz, septo, sobrancelha, lábio, umbigo), NPCs autônomos (VIDA 19), vida social e programas (convites, festa em casa, almoço de família, presentes), Justiça (descoberta → processo → sentença → regime → saída), Submundo (ramos, encomendas, organizações, contatos, mercado), núcleo da fama (VIDA 13), ofícios da VIDA 16, catálogo de veículos (211 versões), joias da VIDA 20.

## 3–5. Bugs identificados, causas e correções
| # | Problema | Causa | Correção | Estado |
|---|---|---|---|---|
| 1 | Bolsas/mochilas compradas sumiam da Aparência | `PARTES` (Aparencia.tsx) sem a parte `bolsa`; dos 319 itens, só os 6 de `lugar:'bolsa'` não tinham parte | Parte "Bolsa ou mochila" (Levar/Guardar/Trocar) | [T] |
| 2 | Palmeira "nascendo" no muro; balizadores e arbustos pintados sobre muro/portão | O muro ficava em `frente` **antes** do jardim e das luzes (tudo atrás dele) | Camada `muro` própria, desenhada por último (kit compartilhado) | [T] |
| 3 | Mansão tropical com 3 palmeiras (2 no mesmo x, 1 na piscina); sítio com palmeira atravessando a torre da caixa-d'água | Palmeira própria da mansão somada à do paisagismo; faixa livre não descontava piscina/torre | `palmeiraNoLote(..., ocupado)`; mansão só planta a dela sem paisagismo tropical; árvores do fundo do sítio desenhadas antes | [T] |
| 4 | Fala romântica ("gosto de você como amiga") em convite de irmão/amigo (20 casos/10 vidas); "Isso foi um ataque pessoal" ao almoço da mãe; botão "Só se tiver pudim" com outra frase | `suaFala` sorteava pelo **tom** da resposta, sem situação nem relação | `RESPOSTAS21` por situação+opção, com relação (mãe/pai, avós com "a senhora", irmãos, filhos, par, amigos, colegas) e criança; "deixar no visto" sem fala | [T] |
| 5 | "Casa nova!" para quem cortou gastos (11 casos); "Nasceu!" para gravidez; "Nada de pânico" para depressão; parabéns por trabalhar fins de semana "para fechar as contas" | Uma fala por tipo de trajetória | `noticia21` lê o texto; aperto pede apoio; feito de aperto não é comemorado | [T] |
| 6 | Desempregado desabafando sobre "o chefe"; aposentada de 86 anos idem; "Terminei" de quem está no relacionamento; feito privado comentado por quem não podia saber; aniversário de criança com fala de mãe | Mapeamento `desemprego → desabafo_trabalho`; `p.ocupacao` como prova de emprego; catálogo misturado; nenhum critério de conhecimento | `desabafo_desemprego`; `trabalhaHoje`; catálogo corrigido; `sabeDoFeito`; `ANIVERSARIO21` por relação/idade | [T] |
| 7 | Pede atenção como 2ª caixa de mensagens (81 "chamou você para sair"); "sente a sua falta" com contato no mês; "reparou que você não anda bem" estando feliz; "perdeu o emprego" repetido no ano seguinte | Sinais de mensagens comuns; queixa não se resolvia com contato; apoio sem motivo; janela `<= 12` | Só situações; queixa some com contato posterior; apoio com motivo; aperto antigo → "continua sem emprego" | [T] |
| 8 | Lembrança colada como rótulo ("Lembrei hoje: Ligou para comemorar…") | Marco do vínculo usado como frase | `lembrancaNatural` (voz de quem manda) | [T] |
| 9 | Crime rendia só número | Operações de furtos pagavam `movimentoPorFora` direto | Bens concretos (§6) | [T] |

Auditoria do Pede atenção depois: **0** avisos sem fundamento nas mesmas 10 vidas (antes, 14).

## 6. Novas funcionalidades
- **Bens do crime** (`motor/v21/crime/espolio21`, `dados21/crime`, `ui/v21/crime`) [T]: a parte de um serviço de furtos (e das encomendas do ramo) vira dinheiro em espécie + bens (celular, notebook, eletrônico, joias e relógios do guarda-roupa, bolsas, roupas de grife, arte, colecionáveis, mercadoria, veículos), com enganos e serviços só em dinheiro; **o valor que o mercado paralelo paga soma o que antes vinha em dinheiro** (economia calibrada, teste ≤35% de desvio). Saídas por natureza: guardar, usar/vestir (vai à Aparência pelo guarda-roupa de sempre), vender, se livrar; mercadoria não se usa. Mercado paralelo: 5 compradores com categorias, preço, risco e reputação exigida; procura por categoria/ano; bem quente/rastreável vale menos. Consequências: venda que dá errado (apreensão, exposição, investigação), bem rastreável em uso achado, blitz do carro sem documento, busca no processo (uma por processo); investigação segue o pipeline existente (`ilicito`/`justica`). Herdeiro não herda; save normaliza. Painel "O que veio dos serviços" na Visão geral do Submundo.
- **Garagem** (`dados/veiculos21`) [T]: utilitários/vans, jipes/off-road, picapes grandes e esportivas (concessionária); hipercarros (colecionador, patrimônio mínimo R$ 60 mi); carros de competição (rali, Stock Car, Porsche 911 GT3 R, monoposto de F1) que **não vão para a rua** (não levam ninguém, não viram o do dia a dia, sem passeio) e se usam no **dia de pista** (`usos.ts`: custo de equipe/autódromo, 3 por ano, risco de rodada e conserto). Superesportivo e hipercarro também fazem track day. Medidas reais nos desenhos.
- **Guarda-roupa** [T]: 52 peças com desenho próprio (silhueta antes da cor), do básico ao sob medida, incluindo uniformes (pijama cirúrgico, jaleco, quimono) e competição (macacão de piloto).
- **Números de cada ofício** (`v21/carreiras/oficio21`) [T]: ~70 trilhas com indicadores próprios calculados do trabalho real; "Os números do seu ofício" em Minha carreira; marcos redondos viram lembrança (save antigo registra em silêncio).
- **Reconhecimento que não é fama** (`v21/fama/fama21`) [T]: reconhecimento local (rua → bairro → comunidade → cidade) para ofícios de contato com o público; formas de reconhecimento lado a lado (fama, prestígio, local, influência, imagem); reações espontâneas (rádio comunitária, escola, moção de aplauso, jornal da cidade no marco do ofício, freguesia do autônomo); apaga em dez anos fora do ofício.

## 7–8. Sistemas aprimorados e integrações
Crime ↔ inventário ↔ Aparência ↔ economia/extrato ↔ Justiça; catálogo ↔ propriedade ↔ garagem ↔ usos; carreira ↔ biografia ↔ reconhecimento ↔ notícia local; mensagens ↔ estado real (emprego, gravidez, saúde, conhecimento). Celular ↔ fama já existia (fãs, imprensa, eventos) e foi preservado.

## 9. Testes
Novos: `vida21Celular` (12, inclui 3 vidas × 50 anos com invariantes), `vida21Crime` (9), `vida21Crime.tsx` (2), `vida21Catalogo` (5), `vida21Carreiras` (4), `vida21Fama` (4), `vida21Aparencia.tsx` (4; falham os 3 originais com o código anterior), `vida21Fachadas` (3).
Ajustados (com motivo no código): `vida16Namoro` (cenário com a pré-condição real da queixa: 2+ anos sem contato), `material.test` (há duas Hilux; confere a versão da oferta clicada).
Regressões direcionadas: celular/mensagens 537/539, Submundo 794/795, veículos/garagem 1435/1439 antes dos ajustes.
**Suíte completa na árvore exata do commit publicado (`git archive 9571459`): 2.856 aprovados, 3 falhas, 1 ignorado** — as três por tempo-limite (60–90 s) e da lista de instáveis da linha de base (`fechamentoMundo #4`, `motor.test agência`, `profissao treinar dobrado`). Uma rodada anterior acusou 6 falhas novas, todas corrigidas antes da publicação: 5 peças de roupa duplicavam produtos existentes (removidas), modelagem ausente em 4 peças, e 3 testes sensíveis à deriva das vidas-cenário (técnico, MEI) tornados robustos à intenção.
Saves antigos: 18 saves (VIDA 18, 19, 20) abrem, avançam 3 anos, salvam e reabrem — **0 falhas**.
Build: `tsc` limpo; `vite build` ok; maior pacote `motor-textos` 799.568 B (VIDA 20: 797.250 B) — **dentro do limite de 800 kB, sem folga**. Smoke de distribuição: **29/29**.

## 10. Auditoria visual
Fachadas (17 formas + combinações de lado de fora), roupas novas em 4 corpos, veículos novos ampliados, e telas no build de produção a 1440 e 390 px (claro e escuro no Submundo): sem erro de console, sem rolagem lateral, nada fora da seção. Capturas em `~/vida-trabalho/a21/qa/`.

## 11. Pendências e limitações (honestas)
- **[P] Desenho do monoposto de F1**: usa a silhueta de carro baixo com asa (sem roda descoberta/bico); o carro e as regras funcionam; desenho próprio pendente. O kart foi retirado da compra (o desenho saía com traços soltos); segue como carreira da VIDA 20.
- **[P] Malas**: não entraram (não são vestíveis no desenho atual).
- Corrigido antes de publicar: 6 peças duplicavam produtos que já existiam (short de corrida, camisa/moletom/calça/salto de grife, terno sob medida) e sobrescreviam o desenho original — removidas (45 peças novas no total).
- **[P] Classes novas de veículos só como zero-quilômetro** (não entram no sorteio de usados, para não mudar o acaso de saves existentes).
- **[P] Falas e eventos próprios por carreira**: os números são por trilha (~70); falas/cenas próprias seguem as da VIDA 12.5/16/16.1 — não ampliadas nesta versão.
- **[P] Fama**: as "oportunidades" grandes (TV, campanhas, patrocínios, premiações) seguem as do núcleo VIDA 13; esta versão acrescentou o reconhecimento local e as formas lado a lado.
- **[N] Etapa 7** além de auditoria (vida social, NPCs, tatuagens, piercings, idade): já entregues em versões anteriores; nada novo.
- Pacote `motor-textos` sem folga: o próximo conteúdo de texto precisa ir para módulos de pacote próprio.
- Miniatura da bolsa na Aparência mostra o tronco (a clutch fica pequena na mão).

## 12. Arquivos e áreas
Motor: `v21/{celular,crime,carreiras,fama}`, `dados21/{celular,crime,estilo,carreiras}`, `dados/veiculos21.ts`, `v15/celular/celular15.ts`, `v17/celular/mensagens17.ts`, `dados17/celular/catalogo17.ts`, `sistemas/{iniciativas,submundo,encomendas,usos,transporte,veiculos,mercado,sucessao}.ts`, `dados/{bens,estilo,veiculos129}.ts`, `acoes.ts`, `ano.ts`, `save.ts`, `tipos.ts`. UI: `jogo/{Aparencia,SubmundoVivo,Trabalho,Voce}.tsx`, `leitura.ts`, `v14/fachadas/{kit,casas14}.ts`, `ilustracao/carros13.ts`, `avatar/{pecas,pecas21}.ts`, `v21/{crime,carreiras}`, `novidades.ts`. `vite.config.ts` (pacotes `motor21-*`, `dados21-*`). Scripts: `playtest/{gerar21,qa21,galeria21Roupas}`.

## 13. Commits
`83e2c94` bolsas + fachadas · `15b17ea` mensagens + Pede atenção · `b51cafc` crime + garagem · `ff424b1` guarda-roupa · `4dea98b` números do ofício + medidas · `5b1f042` reconhecimento · `79f7ff1` notas + QA · **`9571459`** sem duplicatas, testes robustos, relatório (commit publicado) · commit seguinte: esta seção (só documentação).

## 14. Branch
`claude/vida21` enviada ao GitHub. `main` e a branch de produção `claude/fix-pos-rework3-playtest` avançadas por **fast-forward** (de `6423a98` e `d33c449`) até `9571459`.

## 15. Publicação — confirmada
- Push às 22:15:45 UTC; o Cloudflare Pages (https://vida-game.pages.dev/) passou a servir o novo build às 22:18:53 UTC (`index-BwgQJgvv.js`).
- Conferência byte a byte com o build local do mesmo commit (`npm run build` na árvore de `git archive 9571459`): **`/` + 146 JS/CSS = 147 arquivos idênticos (SHA-256)**. (`/index.html` responde 308 para `/` — por isso a comparação é feita em `/`.)
- Smoke de distribuição no build publicado: 29/29.
- Validação funcional no site oficial (Playwright): bens do Submundo com ofertas (1440, escuro), números do ofício (390), bolsa na Aparência (390), formas de reconhecimento (1440), jogo novo — sem erro de console, sem rolagem lateral.
- Sem acesso ao painel do Cloudflare nesta máquina (nenhuma credencial/wrangler): o "deploy concluído" é confirmado pelo conteúdo servido em produção, não pelo painel.
