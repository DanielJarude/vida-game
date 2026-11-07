# VIDA 12.9 — Atualização unificada: personalização, imersão, vida acadêmica, economia, empreendedorismo, política e coerência esportiva

## A. Identificação

- **Versão:** VIDA 12.9. Notas do jogo: versão `12.9`.
- **Numeração:** a sequência no repositório é 12.7 → 12.8 → 12.8.1 (hotfix sem notas). Não há roadmap no repositório com outra numeração (os relatórios da 12.7 e 12.8 registram o mesmo). Esta é a 12.9.
- **Base:** `origin/main` = `810bc06` (VIDA 12.8.1 publicada; produção também em `810bc06`). Nenhum commit posterior em nenhuma branch.
- **Branch:** `claude/vida12.9-atualizacao-unificada`.
- **Inclui o complemento "Gestão Ativa de Negócios"**, integrado ao rework econômico (mesmo sistema `financas.empresas`).
- **Fora do escopo (não feito, como pedido):** vida rural/fazenda, funcionários domésticos, administração de propriedades, manutenção recorrente de imóveis, segurança residencial, certificados/qualificações acadêmicas artificiais, expansão profunda de família (filhos, netos, envelhecimento, aposentadoria, tradições).

## B. Auditoria inicial (resumo; detalhe em `docs/vida129/AUDITORIA.md`)

| Área | O que havia | Situação |
|---|---|---|
| Composição dos cômodos | Tudo desenhado de frente; móveis de encostar (penteadeira, closet, armários planejados, vitrine) no primeiro plano; 11 objetos fora de cena em 20 cenas de teste | Implementado com problemas |
| Tatuagens | 88 desenhos (83 + 5 peças), 14 estilos | Parcial |
| Piercings | nenhum | Ausente |
| Provador × cartão | cor sorteada com sementes diferentes (`-vitrine` no cartão, `-provador` no provador, o id novo na compra) | **Bug confirmado** |
| Estudos | instituições genéricas ("a universidade federal em X"), ano a ano, sem recuperação, sem troca de curso; FIES escapava ao abandonar; `reprovacoes` nunca cancelava | Parcial + bugs |
| Looks | um look por ocasião (`EstiloPessoal.looks`), sem nome | Parcial |
| Hobbies | rotinas de música, desenho, foto, cozinha, jardinagem, pintura; um "música" só; sem marcos em foto/desenho/cozinha | Parcial |
| Veículos/coleção | 115 versões; raridade pela classe (ignorava `limitada`); nome do colecionável = nome da classe; garagem em tabela | Parcial + 2 bugs |
| Calendário | só a agenda da semana | Ausente |
| Álbum/linha do tempo | Retrospectiva com álbum dos marcantes; carro/casa com desenho genérico; chave `especiais` ≠ `momentos` | Parcial + bug |
| Presentes/vida social | presente sem ocasião; festas de cômodo só com os 5 mais próximos automáticos | Parcial |
| Economia | perdas de acontecimentos limitadas ao saldo da conta (exploit); 3 definições de liquidez; `cobrirRombo` nunca vendia bens; apostas de valor fixo; `hab_bets_fundo` com texto ≠ efeito | Implementado com problemas |
| Empresas | 8 tipos (restaurante… zoológico), teto ~R$ 40 mi, sem decisões estratégicas | Parcial |
| Política | sem Presidência (`CargoEletivo` a excluía); governador com crises de prefeito | Ausente / com problemas |
| Esportes | `esp10_dor` sorteava título (55%) sem olhar a competição — a causa do "jogou a final com dor e foi campeão" com a equipe eliminada; ~10 caminhos parecidos | **Bug confirmado** |

## C. O que foi implementado (por fase)

**F1 — Cômodos.** `ui/ilustracao/disposicao.ts`: móveis com frente de encostar (`Medida.gira`: caixa/frente) vão de lado numa parede lateral, com a frente para o meio do cômodo, desenhados no plano certo com a lateral e o tampo (`comodos.tsx: Girado`); podem seguir até a profundidade real do cômodo (cortados pela borda da cena); objetos de parede também na parede esquerda fora da janela; a TV sobe acima da cômoda (nunca acima da cabeceira); o que vai junto/diante de um móvel que não é âncora entra depois dele; último recurso: o encostado cobre em parte um móvel pequeno e baixo (nada some à toa). Nas 20 cenas de teste, os objetos fora de cena caíram de 11 para 3 (só cômodos realmente lotados). Dimensões de catálogo preservadas (teste). Saves reais (mansão, apartamento) conferidos visualmente.

**F2 — Tatuagens.** 168 desenhos novos (88 → 256), todos com arte SVG própria e distintos: 79 de cultura pop (inspirados em 33 obras — as 20 pedidas e outras), 36 bichos, 12 natureza, 41 autorais; 7 estilos novos (cultura pop, neotradicional, surrealista, conceitual, pontilhismo, sketch, aquarela); filtros de tema, obra e busca. Arte num pacote próprio sob demanda. Regiões, tamanhos, posição, rotação, escala, retoque, laser, cobertura, histórico e saves preservados. *Ponto de atenção humana:* objetos icônicos (esfera de captura, escudo com estrela, capacete escuro, droide) são reinterpretações simples, mas lembram muito a obra.

**F3 — Piercings.** 22 joias em 7 furos (nariz, septo, sobrancelha, lábio, helix, tragus, umbigo), aço/titânio/prata/ouro/ouro rosé/preto, com e sem pedra; como itens de estilo (um por furo; o lóbulo continua sendo o dos brincos — três furos na orelha); comprar, usar, trocar a joia, tirar; provador e miniatura com o piercing; desenho no retrato (todas as fases adultas, os três gêneros, com barba, óculos, cabelo comprido) e o umbigo na figura com o tronco à mostra; idade mínima 16.

**F4 — Provador.** Variante única (`ItemDeEstilo.variante`, `sementeDaPeca`): o cartão tem seletor de cor (nomes de cor distintos para leitor de tela), e a mesma variante vai ao provador, à compra, ao retrato e ao guarda-roupa. Saves antigos mantêm a cor (semente = id). Testes de regressão por categoria, cor e trocas sucessivas.

**F5 — Estudos.** 21 instituições reais e 62 campi (USP, Unicamp, Unesp, UFRJ, UFMG, UnB, UFRGS, UFSC, UFPR, UFPE, UFBA, UFC, PUC-SP, PUC-Rio, PUCRS, PUC Minas, PUCPR, FGV, Mackenzie, Insper, ESPM) — só dados verificados em fontes oficiais (`docs/vida129/UNIVERSIDADES-FONTES.md`): cursos por campus, formas de ingresso, 26 mensalidades verificadas (a da Insper marcada "a confirmar"; PUC-Rio cobra por crédito, sem valor), durações. Processos próprios com fases (Fuvest, Comvest, Vunesp, PAS/UnB, Provão Paulista, vestibular próprio, SISU, nota do ENEM, ProUni, FIES). Vida acadêmica: semestres na tela, exame final, dependência nas férias, cancelamento por reprovações (com aviso), trancamento com texto certo, troca de curso (interna ou novo processo), turno na agenda. Bugs: FIES vira dívida proporcional ao abandonar/cancelar. 15 técnicos e 3 qualificações novos ligados a vagas. Tela da faculdade e "Entrar na faculdade" refeitas no sistema visual. *Limitações:* a seletividade relativa é parâmetro de jogo (não nota de corte oficial); 21 campi ficam em cidades que o mapa do jogo não tem; fora do Brasil, as vias genéricas de antes.

**F6 — Looks.** Looks com nome (guardar o que se usa, vestir as mesmas peças — ids reais —, substituir, renomear, apagar; até 12; não precisa ter todas as partes), em Aparência.

**F7 — Hobbies.** Instrumento escolhido com progresso próprio (10 instrumentos; aula, ensaio e instrumento em casa aceleram; o difícil demora; trocar não apaga o aprendido; degraus de "primeiros acordes" a "virtuose"); marcos de foto, desenho, pintura, cozinha e plantas pela habilidade real, com consequências pequenas (a primeira venda de fotos, o almoço de domingo que aproxima a casa). Silencioso na biografia; nenhum cômodo exigido.

**F8 — Veículos.** 68 versões novas (115 → 183): motos, clássicos, esportivos, luxo, edições limitadas; raridade pelos dados (tiragem/produção), não pelo preço; nome do colecionável = marca/modelo/ano; pintura metálica/perolizada/acetinada/fosca, 7 rodas, teto, faixas e aerofólio — no desenho; garagem exposta com cartões (valor de hoje × de compra, estado, onde, raridade, história). *Limitações:* sem motos clássicas (não há classe); preços de referência.

**F9 — Imersão.** Calendário do ano (aniversários de quem importa com a idade, bodas, feriados do país — Carnaval pela Páscoa —, eleição, fim de curso/mandato, bebê, e o que já aconteceu), em Semana. Retrospectiva: a faixa da vida (memórias por idade e fase) e o álbum inteiro; a foto do primeiro carro/casa mostra o carro/casa de verdade. Presentes por ocasião (aniversário, Natal/fim de ano, bodas, Dia das Mães/Pais, Namorados). Interiores: a composição nova (F1) e a garagem (F8). Mobile: todas as telas novas auditadas a 390/360 px.

**F10 — Vida social.** Receber gente e sair junto: jantar, festa, churrasco, festa na piscina, cinema em casa, noite de jogos, bar/restaurante, cinema — convidados escolhidos, jeito (do dia a dia, caprichado, com buffet), custo pago, capacidade pela área da casa, o que a casa tem decide (sem churrasqueira não há churrasco), rachar a conta fora de casa; consequências: proximidade de cada um (menos com quem já veio muitas vezes), pazes ou clima com quem estava de mal, ciúme do par com o ex, multa do condomínio, cansaço de quem recebe, Linha da Vida. Divide a vez no ano com os usos de cômodo da 12.8 (sem atalho duplo).

**F11/F12 + complemento — Economia, empresas e gestão ativa** (detalhe em `docs/vida129/frentes/Economia.md`). Liquidez numa fonte só; indicadores completos (bruto, dívidas, líquido, renda recorrente, fluxo, exposição, "rico em bens e curto de caixa"); exploit corrigido (a perda sai da conta e das aplicações); perdas proporcionais e reais (venda de bens às pressas, dívida nova), insolvência e volta por cima; mesa alta nas apostas; 16 cenas por faixa (pobreza → bilionários). Empresas: 10 ramos novos (tecnologia, construtora, indústria, montadora, banco, aérea, aeroespacial, semicondutores, energia, infraestrutura) com capacidade, projetos de anos, riscos, dívida da empresa, recuperação judicial e falência; fundar ou adquirir (só aparece o que se pode bancar); gestão ativa para todas (alavancas persistentes por ramo, diretoria com perfis, delegação com competência e viés); painel por empresa com as causas do ano marcadas como **escolha** ou **acaso**. *Limitações:* o negócio do dia a dia (`caminhos.negocio`) não migrou para `financas.empresas`; sem IPO; concorrentes não são entidades.

**F13 — Presidência** (detalhe em `docs/vida129/frentes/Presidencia.md`). 12 países com eleição direta, cada um com suas regras (idade, nacionalidade nata, partido/independente, segundo turno, limite de mandatos); campanha com convenção/primárias, vice, propostas, estratégia, debate, reta final e pesquisa; urna com votos e incerteza; mandato com inflação, PIB, desemprego, base no Congresso, relações internacionais, tensão entre Poderes; ações próprias, reformas com quórum, 9 crises nacionais, escândalos, impeachment; legado. Governador com 6 crises estaduais próprias. Bugs: Senado dos EUA por classe de cadeira; DC sem Senado/governador. Na integração: a perspectiva eleitoral não oferece outro cargo no meio do mandato.

**F14 — Esportes** (detalhe em `docs/vida129/frentes/Esportes.md`). Nenhuma escolha concede título, final ou medalha que a simulação não deu: `esp10_dor` sem título; final nacional só para quem se classificou (e o resultado entra no palmarés); fase do tênis registrada; textos que prometiam desfecho corrigidos (basquete, vôlei, atletismo, tênis, futebol); regra de coerência palmarés × memórias; conquista falsa de saves antigos escondida (o histórico não foi reescrito).

## D. Correções feitas na integração

- **Ciclo entre pacotes** (motor-patrimonio → motor-textos) introduzido pelos looks: vestir look passou para a camada das ações.
- **Pacote `motor` a 799,7 kB:** os sistemas que nenhum módulo do pacote importa (tatuagens, perseguir, gestão, treinador de goleiros, premissas, silhueta) foram para o pacote novo `motor-folhas` (57,6 kB), medido no grafo do build (`scripts/playtest/analisarPacote.mjs`) → `motor` 724 kB.
- **Balanço econômico:** as cenas econômicas sem empresa saíam em 20% dos anos adultos e quase todas custavam → a mediana do patrimônio aos 66 caía pela metade. Agora ~1 a cada 10 anos e o bico (a oportunidade) com mais peso. Sim com escolhas ao acaso (`scripts/sim/dividas129.ts`, ~48 vidas até 66): negativados 13→15, patrimônio negativo 12→14, mediana R$ 79 mil → R$ 63 mil, p75 R$ 413 mil → R$ 293 mil (a queda do topo é a correção do exploit: as perdas de acontecimentos agora saem também das aplicações).
- **Conteúdo antigo que a correção do exploit expôs:** a terapia de casal exigia R$ 2.000 e cobrava R$ 2.400 (agora exige o que cobra).
- **Bug antigo do submundo:** quem voltava ao crime perdia a carreira criminal (patamar, marcos), as cenas vistas e a ficha do contato — e o carregamento recriava, deixando o save reaberto diferente do jogo. Corrigido em `ilicito.entrar`.
- **Alvo de toque** do seletor de cor: 22 → 32 px.
- **Testes antigos** que dependiam do caminho exato da vida sorteada (o clube, o id, o texto exato) ficaram robustos sem perder o que verificam (cada ajuste comentado no teste): último clube real (ESP-11.7), sinais sem o limite da tela, marca de cena sem as falas do jeito, marco real qualquer, fila de decisões num save v8, Frankie em Sydney, partilha sem dívidas, cenas do REWORK 10 já vistas, luto de quem continua vivo, temperamento isolado, dois filhos no transversal.

## E. Testes

- **Suíte completa** (Linux, `--maxWorkers=3`): **2454/2456** em 657 s. As 2 falhas são exatamente as que já falham na base `810bc06` (`rework122 · negócio por fora`, `rework11Esportes · Sassuolo`). Testes novos da 12.9: 18 arquivos `vida129*` (motor e interface).
- **Typecheck** (`tsc --noEmit`): limpo.
- **Smoke de distribuição** (`scripts/itch/smoke.mjs`, build final): 22/22. **PWA offline** (`scripts/pwa/offline.mjs`): 36/36.
- **Sims:** desempenho 9,2 → 10,2 ms/ano (`scripts/sim/tempo129.ts`); economia por faixa e 25 anos (indicadores consistentes, 0 ajustes de extrato); presidência N=400 (eleitos: 48% de trajetória forte, 3% média, 0% fraca); esportes 48 carreiras × 14 temporadas: 0 contradições; estudos 30 candidatos (Fuvest 0,02 × Mackenzie 0,96 sem cursinho).
- **Saves antigos:** save continua v20; só campos opcionais; normalizadores `normalizarVida129Economia` e `normalizarVida129Presidencia`; testes de cada frente abrem save sem os campos novos, avançam anos e reabrem (matrícula antiga, empresas antigas com o mesmo resultado, veículos, tatuagens, políticos, peças sem variante).

## F. Auditoria visual

`scripts/playtest/vida129.mjs` (saves em `scripts/playtest/gerar129.ts` e `gerarQA129.test.ts`): 17 cenas — cômodos (mansão e apartamento), aparência, looks, piercings, provador, encontros, calendário, estudos (vestibular e faculdade), empresa, presidência, garagem, tatuagens, novidades — nos temas **claro e escuro**, em **1440, 390, 360 e 390×560 px**: geometria (texto sobreposto), contraste, rolagem horizontal e alvos de toque → **0 problemas** (depois da correção do alvo de toque). Galerias olhadas: cômodos (20 cenas sintéticas + saves reais), piercings (6 rostos × 4 conjuntos + umbigo), tatuagens (todos os desenhos novos em 4 tamanhos, pele clara e escura), veículos (catálogo, peças, garagem a 1100 e 390 px).

## G. Pacotes (build final, limite 800 kB)

motor-dados 779,3 · motor-textos 775,6 · motor-carreira 730,2 · motor 724,1 · Jogo 604,2 · motor-acontecimentos 303,2 · motor-vida 278,5 · Compras 253,6 · motor-patrimonio 223,6 · react 218,0 · motor-casa 170,5 · tatuagens 162,4 · motor-folhas 57,6 · motor-presidencia 31 · motor-estudos 25 · Empresas129 18 · Faculdade129 19 kB. Nenhum acima do limite; nenhum ciclo entre pacotes.

## H. Pendências e limitações

- Tatuagens de cultura pop icônicas merecem um olhar humano (direito de marca), mesmo reinterpretadas.
- `caminhos.negocio` segue separado de `financas.empresas`; sem IPO; concorrentes não persistentes.
- Presidência: colégio eleitoral dos EUA reduzido a voto popular; Colômbia vota no mês geral do país; a economia do mandato não move a economia global do jogo.
- Estudos: 21 campi em cidades fora do mapa; PAS e Provão Paulista simplificados; o catálogo genérico "Explorar formações" ainda lista graduações sem instituição.
- Veículos: sem motos clássicas; a cena da casa ainda não mostra as peças do carro.
- Cômodos: em cômodos realmente lotados (sala de jogos de 16 m² com sinuca, pebolim, fliperama e mesa de jogos) algo ainda fica fora de cena — listado na tela.
- O teste "Sassuolo" e o "negócio por fora" continuam falhando como na base.

## I. Publicação

- **Commit publicado:** `6618f2a` (código idêntico ao de `564234b`; o último commit só acrescentou este relatório). `main`, `claude/fix-pos-rework3-playtest` (produção) e `claude/vida12.9-atualizacao-unificada` avançados por fast-forward de `810bc06` para `6618f2a`. Este registro da publicação é um commit de documentação posterior, só em `main` e na branch.
- **Deploy:** Cloudflare Pages, check-run `completed/success` no SHA `6618f2a` (pré-visualização `e443aa17.vida-game.pages.dev` com o mesmo `index-3UKip6aW.js`); o deploy de produção trocou o índice em seguida.
- **URL:** https://vida-game.pages.dev/ serve `index-3UKip6aW.js`; **60/60** arquivos (o índice pela raiz `/` e todos os JS e CSS) **SHA-256 idênticos** ao `dist/` testado (`compararProd129.sh`; dois arquivos diferiram na primeira leitura por propagação e bateram na seguinte).
- **Verificação em produção:** `URL=https://vida-game.pages.dev/ node scripts/playtest/vida129.mjs` (contextos novos; saves de QA só no navegador de teste) — 10 cenas (cômodos, aparência, loja, encontros, calendário, faculdade, empresa, presidência, tatuagens, novidades), tema claro, 4 larguras: **0 problemas**, 0 erros de console.
- **Rollback**, se preciso: `git push origin 810bc06:claude/fix-pos-rework3-playtest --force-with-lease` (e `main` para `810bc06`).
