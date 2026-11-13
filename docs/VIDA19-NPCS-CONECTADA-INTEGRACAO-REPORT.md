# VIDA 19 — NPCs profundamente autônomos + VIDA Conectada + integração e pendências da VIDA 18

Branch `claude/vida19-npcs-conectada` (base: `main` em `e719fbd`). Um agente só, sem subagentes. Eras Históricas fora do escopo (nada alterado nelas).
Matriz de auditoria inicial: `docs/vida19/AUDITORIA.md`.

## A. Auditoria (resumo — matriz completa em `docs/vida19/AUDITORIA.md`)

Consultado: relatórios VIDA 15, 16, 16.1, 17, 18 (`VIDA18-…`, `vida18/AUDITORIA.md`), `rework11/auditoria/A6`, `rework11/fases/H-I`, e o código atual.

| Frente | Estado inicial | O que justificou trabalho |
|---|---|---|
| Trajetória de filhos/netos, parceria, pais, irmãos, morte/luto, mensagens com motivo, cota 4/ano, "Pede atenção" | Implementado | nada reaberto (reaproveitado) |
| Amigos/ex/pai viúvo "casam" | Parcial | parceria era `parceiroId: 'fora'` (sem pessoa) |
| Filhos de amigos | Parcial | só um contador `nFilhos` |
| Economia de NPC | Parcial | só descendentes guardavam; ninguém gastava nem se endividava |
| Metas/personalidade nas decisões de NPC | Ausente | sorteios fixos |
| Relações entre NPCs | Ausente | só parentesco/conjugalidade |
| Feed | Parcial | trajetória virava cartão; só "curtir" |
| Comentários, perfis, DM a partir de post | Ausente / Parcial | — |
| 5 pendências da VIDA 18 | Ausentes (4) e Bug (rodada × tabela) | nenhuma corrigida depois da VIDA 18 |
| Profissões | 18 carreiras com sistema próprio; 6 grupos de ofícios comuns sem mecânica própria | beleza, alimentação/confeitaria, construção/hidráulica, elétrica, estrada/transporte, comércio/vendas |

Descartado por já existir: mensagens/histórico/cota, `Pede atenção`, app de namoro, fama/convites, redes do jogador (contas, publicação, alcance, viral, monetização), carreiras da 16/16.1, herança, mapa, prisão (telefone), saúde de NPC (condições).

## B. Implementação

### NPCs profundamente autônomos — `motor/v19/npcs/vidas19.ts` (chamado pelo ano depois do `mundoVivo`)
Reaproveita (não substitui): trajetória de descendentes (`filhos`), família de origem (`familia`), carreira de parceria e amigos próximos (`social` → `carreiraDeAdulto`), saúde de NPC (`corpo`), morte/viuvez (`indiretos`, `rede`, `luto`), mensagens com motivo (`v15`/`v17`), cota de 4/ano.
- **Quem entra**: adultos fora da casa, que não são pais, avós, descendentes nem romance ativo; `central` (próximos ≥ 60, irmãos, famosos conhecidos, ex que ainda pesa) e `relevante` (até 30, por proximidade). O resto segue a evolução simples de antes.
- **Bolso** (`Pessoa.npc19`): renda − padrão de vida → reserva ou dívida (juros 18% a.a.); o padrão anda atrás da renda e dos filhos, nunca acima da renda de quem ganha pouco; desempregado vive com o mínimo. Dívida > 4 meses: `Pessoa.aperto = 'dinheiro'` (o mesmo que abre "estar junto"/ajuda/mensagens) e uma decisão pelo temperamento: cortar, vender o carro, pegar bico, voltar para perto dos pais, mudar para cidade mais barata. Quem guarda compra moto/carro (à vista ou financiado) e casa/apartamento financiado; quitar é notícia.
- **Meta** (carreira, estabilidade, família, mudar, negócio, recomeçar, estudar, aposentar): do temperamento, idade e do que aconteceu (separação, luto, dívida pedem recomeço); revista a cada 3 anos ou após um golpe. Pesa em promoção (degrau de cima da mesma trilha), troca de emprego, abrir negócio (com as economias; o negócio tem ano bom e ruim, cresce ou fecha com dívida), namorar/casar/ter filhos, mudar de cidade (carreira, vontade, perto dos pais).
- **União com pessoas de verdade**: namoro → morar junto/casar → filhos (gestação própria `npc19.gestacao`, parto, bebê com pai e mãe e traços herdados) → separação (pressão de dívida/luto/afastamento × compatibilidade) → reconciliação. A parceria `'fora'` dos amigos ganha nome quando a pessoa passa a ser acompanhada. Irmãos continuam com `familia.vidaDoIrmao` (sem duplicar).
- **Saúde no trabalho**: condição diagnosticada grave sem tratamento (ou saúde < 30) afasta: a renda cai a 70%; volta quando melhora. Tratamento custa no bolso.
- **Laços entre NPCs** (`npc19.lacos`, até 8): quem é do mesmo grupo de vocês (escola/faculdade/trabalho do mesmo ano) e mora na mesma cidade se conhece; família e amigos próximos se conhecem "numa festa sua"; a força anda com convivência e compatibilidade; briga vira rivalidade, pazes voltam; ficar com o ex de alguém do grupo esfria a amizade.
- **Famosos conhecidos**: um projeto por ano pela área (disco, novela, filme, temporada, campanha…), às vezes polêmica (o nome cai), às vezes o ano da virada (o nome sobe).
- **Linha da Vida**: só o que é biografia de alguém próximo (máx. 3 por ano, `fato.tipo = 'mundo'` → aparece no "Enquanto isso"); o resto fica na trajetória da pessoa (ficha e rede).
- **Determinismo**: tudo por `rngDe`; pessoas criadas com ids `q19…` (contador próprio) e linhas da biografia com ids `e19…` — `Vida.seq` não anda. Limpeza: quem o mundo criou sai quando ninguém da sua vida (nem filho, nem parceria) aponta para ele.

### VIDA Conectada — `motor/v19/conectada/{feed19,conectada19}.ts`, `ui/v19/conectada/Feed19.tsx`
- **Feed**: cada publicação é um acontecimento da trajetória de alguém (nada guardado; lido de novo, sempre igual). Rede (Instagram, TikTok, Facebook, X) pela idade e pelo tipo; formato (texto, foto, álbum, vídeo curto, story); legenda no jeito da pessoa; a origem (o fato) mostrada; curtidas/comentários/compartilhamentos pelos seguidores (fama: 60 mil a 7 mi) e pelo tipo.
- **Privacidade**: exposição 0–3 pelo temperamento; doença/desemprego/separação só para quem expõe; dívida, mudança por aperto, estagnação e reprovação nunca; caso escondido nunca; "só para amigos" some para quem não é próximo; perfil mostra parceria/filhos/amigos em comum e só mostra rival/ex de quem conta tudo.
- **Comentários de NPCs**: parceria, família, amigos em comum, rival (ironia), ex (ciúme) — e o mesmo cálculo mexe nos laços entre eles no ano (`processarConectada19`).
- **Você**: curtir (aproxima; a parceria pode ter ciúme da curtida no ex, uma vez por ano), comentar no tom (apoio, parabéns, brincadeira, discordar, provocar — efeitos na relação, na história, na reputação de quem tem nome; famoso às vezes responde), compartilhar, **mensagem a partir do post** (entra no histórico de Mensagens da pessoa, não consome a cota de recebidas), seguir de perto, abrir o **perfil** (marcos públicos, conexões navegáveis, publicações) e a ficha completa. Aba **Em alta** com origem (famosos que você conhece, sua publicação viral, o campeão). Na prisão, sem rede. Interagir no feed não "move o ano" (não dispara a onda de mensagens).

### Integração e profissões
- Carreira/economia/saúde/família/mudança de NPCs agora causais (seção acima). Prisão: rede bloqueada; a vida dos outros segue.
- **Profissões**: tabela dos ofícios vivos (`sistemas/oficios`) ganhou beleza, alimentação+confeitaria, construção+hidráulica, elétrica, estrada+transporte, comércio+vendas — área de especialidade persistente, desafios com consequência e a saída para conta própria/negócio pelo conteúdo de sempre. Nenhuma carreira da 16/16.1 refeita.

### Notas de versão
`ui/novidades.ts`: versão `'19'`.

## C. Pendências VIDA 18

| Pendência | Situação inicial | Já corrigida? | O que foi feito | Testes |
|---|---|---|---|---|
| Empresas agrícolas | ausente | não | `agroindustria` e `laticinio` no catálogo de empresas (mesmo motor), com setor próprio (`setores.campo`): produto, inspeção SIM/SIE/SIF, canal (feira/varejo/rede), selo artesanal (Selo Arte), perdas, boas práticas, fiscalização. A matéria-prima da sua terra (leite/lavoura) é comprada pelo preço de mercado: a fazenda conta a venda uma vez, a empresa conta a compra uma vez; o ganho é o frete curto (−12% no variável da parte coberta) e o selo de origem (+5% procura) — gancho `GANCHOS_EMPRESA.insumo`. | `vida19` (insumo, sem dupla contagem), `rework122` (estado, indicadores e ≥3 decisões próprias) |
| Justiça/ambiente/política rural | ausente | não | `v19/agro`: CAR (exigido para crédito, Lei 12.651 art. 78-A; dá a subvenção do seguro, PSR), georreferenciamento (Lei 10.267), outorga de água (Lei 9.433). Irrigar sem outorga → fiscalização → multa como causa na Justiça de sempre (`justica14`, defesa ou pagamento). Divisa sem certificação → **ação de divisa** (novo tipo em `justica14`). Plano Safra: custeio Pronaf/Pronamp/demais pela renda bruta (taxas 2025/26), desconto do CAR validado e do orgânico, vencimento no ano seguinte, prorrogação por quebra de safra, desvio de finalidade cobrado com multa. | `vida19` (crédito, desvio, multa/divisa) |
| Cavalos: reprodução e genética | ausente | não | `v19/haras`: cobrir égua (3–16 anos) com garanhão da casa ou de fora (monta paga), prenhez por idade, 11 meses, potro com linhagem (pai/mãe), herdabilidade parcial + acaso, potro não corre até 2 anos, égua prenhe e reprodutor não correm, vender por valor de pista/linhagem; o potro entra no rebanho agregado (custos sem duplicar). | `vida19` (média maior com garanhão de ponta, dispersão, custo, prenhe bloqueia) |
| Mega da Virada | ausente | não | último concurso da Mega do ano; reserva de 10% do prêmio dos concursos regulares (tirada da parte que já não ia para as faixas: regulares inalterados); 90/5/5; não acumula (desce para quina e quadra); arrecadação especial; apostar/bolão a qualquer momento do ano; conferida na virada. Regras em `dados18/apostas/loterias18` (`VIRADA18`, com as fontes). | `vida19` (concurso, reserva, rateio em cascata, só Mega) |
| Rodada × tabela do futebol | **bug** | não | `sistemas/jogosDaLiga`: cada divisão (2–4) joga turno e returno de verdade (38 rodadas); cada partida tem um placar só (força do elenco + forma + momento do ano + sorteio da partida). A tabela, o campeão, acesso e queda são a soma das partidas; a rodada das apostas e a Loteca são rodadas reais (elite + 2ª divisão; semanas 39–52: 3ª + 2ª); o começo de cada temporada fica guardado (`LigaDoPais.inicio19`), então o placar é o mesmo antes e depois de a temporada fechar. O clube da vida (atleta/técnico) entra com a força da carreira (ou a que o leva à colocação já sabida). Calibrado: campeões distintos por década 7,0 (igual à base). | `vida19` (placar estável, tabela = soma das 38 rodadas), `rework11Esportes`, `hotfix1151Futebol`, `vida18Apostas` |

## D. Testes

- **Baseline** (`e719fbd`, worktree limpo): 2761 aprovados, **5 falhas preexistentes** (fechamentoMundo #4, fixPosPlaytestHumano C, motor.test "regra de agência", profissao "clima péssimo", rework115Esportes copas de quadra).
- **Final** (árvore publicada): **2788 aprovados, 4 falhas — todas do conjunto preexistente da base** (fechamentoMundo #4, fixPosPlaytestHumano C, motor.test agência, profissao clima; são sensíveis a tempo/carga: qual das cinco falha varia por rodada — rework115Esportes passou nesta). **0 regressões novas.** Typecheck limpo.
- **Novos**: `vida19.test.ts` (25): seleção por relevância; bolso (reserva, dívida, aperto, teto do padrão); vidas longas sem ação (uniões, separações, mudanças, filhos-pessoa, parceria aponta de volta, bolso válido, determinismo por JSON); `Vida.seq` intocado; feed com origem/rede/alcance estável; privacidade (dívida, doença de reservado, só-amigos); perfil com conexões e sem caso escondido; curtir/comentar/apoio/provocar; DM no histórico sem consumir a cota; curtidas não viram mensagem nem chamado; fama × alcance; prisão; futebol (placar estável, tabela = soma); Mega da Virada (3); haras (2); campo (4); profissões.
- **Ajustados por deriva da vida de teste** (comentário "VIDA 19", intenção preservada): `vida18Rural` (vida de teste chegava com nome sujo), `pacotePlaytest` I (mantém o emprego comum), `rework105` (semente que não tranca o curso), `rework122` (lista de ramos; média de 4 sementes no negócio por fora). Corrigido no auditor `esportes129`: memória de aniversário de título não é título do ano.
- **Simulações** (`scripts/sim/vidas19.ts`, 8 vidas × 70 anos sem ação): 117 acompanhados; 93 namoros, 58 uniões, 56 separações, 5 reconciliações, 30 gestações → 21 nascimentos, 43 mudanças, 24 promoções, 50 desempregos/51 recolocações, 47 compras, 120 decisões de aperto, 132 laços (18 rivalidades); **0 contradições**; mesma semente → JSON idêntico. Economia do jogador: nome sujo aos 38 em 6–7 de 24 vidas, igual à base.
- **Saves** (`scripts/sim/saves19.ts`): **48 saves** (REWORK 12 → VIDA 18 e Eras): abrir, reabrir idempotente, avançar 3 anos, salvar, reabrir — **0 falhas**, nada perdido.
- **Typecheck** limpo; **build** ok; **smoke de distribuição 27/27**.
- **Visual** (build de produção, Playwright): Rede (feed, tons de comentário, perfil, curtir → mensagem → Mensagens) em 1440 claro, 390 escuro, 360 claro e escuro; Campo (haras, documentos e crédito) 1440 claro e 390 escuro; Apostas (Mega da Virada) 390 escuro. Sem erro de console, sem rolagem lateral, nada vazando do aparelho. Corrigido na inspeção: botão de cobertura aparecia (desabilitado) para potranca; "1 anos".

## E. Desempenho e compatibilidade
- Custo do ano (8 vidas × 70 anos): 8,2 ms/ano (base 7,5): +9%.
- Save ao fim de 70 anos: +14,5% no total (maior: 197 kB × 182 kB na base). Limites: trajetória 24, laços 8, marcas 12, reações 240, mensagens do arquivo 400; pessoas criadas pelo mundo saem quando nada as liga.
- Pacotes (limite 800 kB, não alterado): `motor-textos` 797,2 (era 797,15), `motor-dados` 790,5, `motor-carreira` 749,1, `motor` 745,6. Novos: `motor19-npcs` 27,8, `motor19-conectada` 20,6, `motor19-agro` 7,3, `motor19-haras` 5,0; `Celular` 61,6. Aviso de ciclo `motor14-conquistas ↔ motor-textos` é preexistente.
- Saves: só campos opcionais novos (`Pessoa.npc19`, `Vida.conectada19`, `LigaDoPais.inicio19`, campos rurais e de cavalo); nenhum dado retroativo inventado (a reserva inicial é a mesma estimativa de `economiasNpc`; a parceria `'fora'` ganha nome só quando a pessoa passa a ser acompanhada). Versão do save inalterada.

## F. Situação final

| Item | Situação |
|---|---|
| NPCs com vida própria (bolso, meta, união, filhos, saúde no trabalho, mudança, laços entre eles, famosos) | Concluído e comprovado (testes + simulações) |
| Iniciativas de NPC | Reaproveitado: o aperto/separação/luto novos alimentam os sistemas de mensagens e "Pede atenção" existentes; nenhum gerador novo de mensagens |
| Feed, formatos, alcance, comentários, privacidade, perfil, DM, seguir, Em alta | Concluído e comprovado |
| Consequências sociais (ciúme, conflito público, apoio na história, famoso que responde, laços entre NPCs) | Concluído e comprovado |
| Patrocínio/oportunidade nascendo do feed dos outros | **Parcial**: fama e reputação mudam (e já abrem oportunidades pelos sistemas de sempre); não há uma oportunidade criada diretamente por comentar |
| Rede de terceiros visível | Concluído (perfil: parceria, filhos, amizades em comum, colegas; rival/ex só de quem expõe tudo) |
| Empresas do campo | Concluído e comprovado |
| Justiça/ambiente/Plano Safra | Concluído e comprovado (multa ambiental só por irrigação sem outorga; não há desmatamento como ação do jogador) |
| Reprodução de cavalos | Concluído e comprovado (só cavalos de corrida individuais; rebanho continua agregado, como pedido) |
| Mega da Virada | Concluído e comprovado |
| Placar único rodada/Loteca/tabela | Concluído e comprovado. Limite: na temporada em que a vida é atleta/técnico de um clube, as partidas DESSE clube seguem a força da carreira (conhecida só no fim do ano) — a vida está impedida de apostar em futebol nesse período; os jogos dos outros clubes não mudam |
| Profissões | Auditadas; 6 grupos de ofícios aprofundados pela tabela existente; nenhuma carreira refeita |
| Visual | Inspecionado (desktop/celular, claro/escuro); sem regressão encontrada |
| Bugs conhecidos | nenhum novo; as 5 falhas da suíte são preexistentes |

**Publicação**: autorizada pelo usuário condicionada aos critérios acima (suíte sem falha nova, typecheck, build, saves, inspeção visual) — todos atendidos. Resultado da publicação e conferência de hashes: seção G.

## G. Publicação
- Commit publicado: **`fd5884d`** — `main` e a branch de produção `claude/fix-pos-rework3-playtest` avançadas por fast-forward a partir de `e719fbd`; branch de trabalho `claude/vida19-npcs-conectada`.
- Cloudflare Pages (vida-game.pages.dev) passou a servir `index-DCXyC3rr.js` cerca de 2 minutos depois do push.
- Integridade: **`/` e os 129 arquivos JS/CSS do build sha256-idênticos** ao build validado localmente (`/index.html` responde 308 para `/`).
- Conferido em produção: smoke de distribuição 27/27; celular → Rede (feed) e perfil em 1440 e 390 (tema escuro), sem erro de console, sem rolagem lateral.
- Este registro (seção G) é um commit só de documentação.
