# REWORK 11 · Fases H (relacionamentos) e I (redes sociais)

Branch `rework11-fases-HI`, a partir de `b885ccc` (Fase A e checkpoint da Fase G). As pendências pequenas (a)–(e) da A6 ficaram de fora, como pedido.

## Sim antes/depois (`$SCRATCH/aud6/rel.ts`, recriada; `aud6/rodar.sh` roda nas duas árvores; saída em `aud6/saida.txt`)

| Medida | Antes (b885ccc) | Depois |
|---|---|---|
| A · `rom_casamento` com R$ 23 mi: texto do festão | "O casamento dos sonhos, nem que seja parcelado" | "O casamento dos sonhos: trezentos convidados" (e existe a opção `luxo`) |
| A · resultado / dívidas / fato `noivado_<id>` depois de casar | "…e um carnê de doze vezes" / 0 / **true** | "…fotos lindas." / 0 / **false** |
| B · conta 0, renda que cabe: texto / resultado / prazo da dívida | "nem que seja parcelado" / "carnê de doze vezes" / 24 | "parcelado em 24 vezes" / "24 parcelas para pagar" / 24 |
| C · busca no app, acordo aberto / exclusivo | incompativel / incompativel | permitido / **irregular** ("seria traição — e ela pode perceber") |
| D · 17 anos com namoro: `convidar` para colega de 17 | true | false |
| E · casais de duas mulheres "tentando", 200 × 5 anos | **199 gestações** | 0 |
| F · X tóxico, 40 vidas × 10 anos de opinião/política (toxicidade fixa em 60) | 0 advertências, 0 suspensões, 0 banimentos | 165 advertências por post, 64 suspensões, 3 banimentos |
| G · OnlyFans, 1.000 assinantes | 9.000/mês | 9.000/mês (inalterado) |

## O que mudou (arquivo: função)

### Fase H
- **REL-11.1**
  - `sistemas/busca.ts`: `disponibilidadeBusca`. Com parceria e acordo aberto/poliamor, a busca fica `permitido`. Com parceria exclusiva, fica `irregular` ("seria traição"), e menor de 18 com parceria continua bloqueado.
  - `buscarAlguem` + `notarBusca`: a parceria exclusiva pode perceber a busca. A chance é 22% no app, 18% numa noite fora e 10% nos outros contextos. Quando percebe, há tensão, a confiança cai e fica um conflito com o motivo.
  - Busca de amizade nova (`contextosDeAmizade`, `disponibilidadeAmizade`, `buscarAmizade`, ação `fazer_amizade`). Vale para qualquer estado civil a partir dos 10 anos, cada contexto uma vez por ano, com o mesmo limite de noites. Cria um vínculo `conhecido` sem romance.
  - UI `Pessoas.tsx`: `ConhecerAlguem` e `FazerAmizades`. Com parceria exclusiva, a seção vira "Procurar alguém por fora", recolhida e com o aviso.
- **Idade 18+**
  - `interacoes.ts` `convidar` com parceria: de 16+ para 18+.
  - `conteudo/sistemicos.ts` `rom_alguem_especial` → `trair`: exige 18+ dos dois.
- **REL-11.2**
  - Módulo novo `sistemas/afetosAdultos.ts` (pacote motor-vida). A interação `intimidade` passa a valer para parceria (namoro sem morar junto, morando junto, casamento) e para caso (paralelo ou escondido). Exige 18+ dos dois, ninguém adolescente, e os dois perto.
  - `consenteIntimidade`: a outra pessoa pode recusar ("hoje não"). Pesam o envolvimento, a tensão e um luto ou doença recentes.
  - A proteção é escolha quando o par pode conceber: `intimidade` é com preservativo e `intimidade_sem_protecao` é sem.
  - `familia.ts`:
    - `podemConceber`, `chanceDoEncontro` e `conceberPorEncontro`. A chance é de uma noite: ~5% sem proteção na idade mais fértil e ~0,4% com preservativo. As guardas são as mesmas da concepção do ano. Um caso escondido agora pode engravidar, e a gravidez tem 60% de chance de abrir a descoberta do caso.
    - **Bug corrigido** em `gestanteDoCasal`: duas pessoas que gestam (ou um NPC não binário) "concebiam" (199 de 200 na sim). Agora é preciso que uma gestante e uma não gestante.
  - O antigo `intimidade` (só morando junto) saiu de `interacoes.ts`.
- **REL-11.3**
  - `romance.ts` `terminar`: grava `Romance.porque = { quem, motivo? }`.
  - `afetosAdultos.ts`: interações novas `ex_mensagem`, `ex_elogiar`, `ex_reaproximar`, `ex_encontro_casual`, `ex_provocar` e `ex_insultar`.
    - `aberturaDoEx` lê como acabou: −8 se foi o ex quem terminou, −28 se ele saiu depois de descobrir uma traição, −18 se ele está com alguém, −10 se o fim foi há menos de 6 meses.
    - Depois de uma indireta ou de um insulto, o ex pode bloquear (`ex_bloqueou_<id>`, e as ações com ele somem).
    - Esperas: 24 meses depois de um não à reaproximação, 12 meses depois de um não ao encontro casual. Continua valendo a regra geral de uma vez por ano por pessoa.
  - `interacoes.ts` `interesseDoOutro`: o mesmo peso de como acabou vale para "Tentar de novo".
- **REL-11.4**
  - `tipos.ts`: `Romance.acordo` ganha `'poliamor'` e entra `Romance.paralelo`.
  - `nucleo.foraDaParceria` (secreto ou paralelo) substitui `!secreto` nos lugares que procuram a parceria principal: `parceiro`, `saindoCom`, `papeis`, `rede`, `retrospectiva`, `vinculos`, `iniciativas`, `social`, `luto`, `interacoes`, `busca`, `familia`, `romance` e `conteudo/social|rede`. A regra de UM parceiro (moradia, dinheiro, filhos) não muda.
  - `romance.iniciarCaso`: dentro de um acordo, o vínculo é gravado como `paralelo`, não como `secreto`. Não registra segredo nem a parceria fica com segredo.
  - `processarCaso`: encerra o paralelo se o acordo acabou. O texto do fim de um paralelo é próprio.
  - `afetos.ts`:
    - `propor_poliamor`: a chance é 0,7 da chance do acordo, +0,1 se já é aberto.
    - `voltar_exclusivo`: vale para os dois acordos e encerra os paralelos.
    - O NPC no poliamor "namora" alguém, como combinado.
  - `afetosAdultos.ts` `namorar_paralelo`: pede o acordo de poliamor E a parceria de acordo agora (`principalConsente`: tensão < 50 e envolvimento ≥ 40) E o sim da outra pessoa (`chanceParalelo`).
  - O papel do paralelo é `caso`, então não recebe morar junto, casar nem dividir finanças. Os textos de "caso" foram ajustados para o paralelo (`interacoes.ts` `sair_juntos`/`encerrar_caso`, `ui/apresentar.ts`).
- **REL-16**
  - Noivado como estado: `Romance.noivado = { t, plano? }`, com o fato `noivado_<id>` em sincronia. Ficam em `romance.ts`: `estaNoivo`, `ficarNoivos` e `desfazerNoivado`.
  - **Bug corrigido**: o fato não morria. Agora o noivado é apagado em `mudarEstagio(…, 'ex')` e em `casar`. Usam o estado `pedir_casamento`, `rom_pedido_casamento`, `rom_casamento` e `marcar_casamento`.
  - Interação nova `desfazer_noivado`.
  - Pedido do jogador: entre o sim e o não existe o "preciso pensar" (`pedido_adiado_<id>`, espera de 12 meses). Isso acontece numa faixa de +0,2 acima da chance, se a pessoa não é alguém que não quer casar, se o envolvimento ≥ 50 e a tensão < 40. O NPC ganha a opção "Pedir um tempo para pensar".
  - Módulo novo `sistemas/casamento.ts` (motor-vida):
    - O catálogo do planejamento: `LOCAIS`, `CERIMONIAS`, `ESTILOS` e `CONVIDADOS`. `custoDoCasamento` usa `economiaLocal`.
    - `preferenciaDoPar` e `discordaDoPlano`: a outra pessoa pode preferir outra coisa. Casa assim mesmo, com +10 de tensão e uma memória.
    - `pagamentoDoCasamento`: o parcelamento só aparece se faltar dinheiro e couber em 25% da renda do casal. O prazo é de 24 meses (`PRAZO_DA_FESTA`).
    - `casar` (movido de `sistemicos.ts`), `faltaDaFesta`, `cabeFesta` e `cabeLuxo`.
    - Ações `casamento` · `planejar` | `celebrar`.
  - **Bug corrigido** (`sistemicos.ts` `rom_casamento`):
    - O festão diz "parcelado em 24 vezes" só quando falta dinheiro, e o resultado diz "24 parcelas" só quando a dívida de 24 meses é criada. Antes dizia "carnê de doze vezes" mesmo sem dívida.
    - Opção nova `luxo` para quem tem três vezes a sua parte guardada, nunca parcelada.
    - Não dispara se há plano em curso.
  - UI `ui/jogo/Casamento.tsx` (`PlanejarCasamento`, na ficha de quem está noivo de você):
    - Escolhas: onde, cerimônia, convidados, estilo e lua de mel.
    - Mostra o orçamento (ao todo, a sua parte, o que tem, o que falta e as parcelas), a preferência da outra pessoa e o aviso de discordância.
    - Botões "Combinar este plano" e "Casar, como combinado".
  - Lua de mel: `casar` deixa o sinal `lua_de_mel_pendente_<id>` por 12 meses.
    - `experiencias.ts`: `disponibilidadeExperiencia(…, luaDeMel)` ignora o intervalo uma vez. `viverExperiencia(…, luaDeMel)` vai a dois (companhia `lua`), escreve "Lua de mel em X com Y" como marco e consome o sinal (`viverLuaDeMel`).
    - UI: `LuaDeMel` na ficha do cônjuge reutiliza `EscolherViagem` (prop `luaDeMel`). O catálogo de viagens é o mesmo, sem duplicar nada.
- Save:
  - `save.ts` `normalizarRework11Relacoes`, chamado em `interpretar`. O `secreto` dentro de um acordo vira `paralelo`. O fato `noivado_` vira `Romance.noivado` ou é apagado se a pessoa já casou ou terminou.
  - Campos novos, todos opcionais: `Romance.paralelo`, `porque`, `noivado` e `acordo: 'poliamor'`; `PlanoDeCasamento`.
  - O save continua v20.

### Fase I
- **SOC-11 moderação** (`sistemas/redes.ts`)
  - `advertir` é a única porta da punição. Cada advertência vem com o motivo dito (`motivoPunicao`). Três advertências suspendem por 12 meses (`suspensoes++`). A terceira suspensão bane: `banida` = `apagada`, então `rendaDaConta` zera sozinha. Recriar a conta só depois de `BANIMENTO_MESES = 60`.
  - Usam `advertir`: `trollar`, a compra de seguidores descoberta (antes somava advertências que nunca suspendiam) e a polêmica de um post. A polêmica tem chance de denúncia de 8%, ou 30% se a toxicidade ≥ 40, +12% num `rebater` e +5% num post de política. O sorteio é próprio (`rngDe 'moderacao'`). Post comum nunca é punido.
  - Op nova `recorrer`: uma vez por punição, do banimento só no primeiro ano. A chance é 35% para suspensão (10% se a conta é tóxica ou a punição foi por compra) e 15% para banimento (3% nos mesmos casos).
- **Repercussão** (`efeitosNaVida`, sorteio próprio `rngDe 'repercussao'`):
  - Conquista: o clima do trabalho sobe +2 (35%).
  - Vídeo do trabalho que viraliza (sem sigilo): a empresa reposta (+3) ou pede para tirar do ar (−3).
  - Polêmica de opinião ou política: um cliente reclama com a chefia (−3, 15%).
  - Família que viraliza com criança pequena: a parceria não gosta (+6 de tensão).
- **Fluxo de publicar** (`ui/jogo/Redes.tsx`):
  - `FluxoPublicar` tem três passos: o quê (`conteudosPossiveis`, os bloqueados mostram o motivo), como (impulsionar e o risco) e confirmar. Substitui a fileira de botões; a ação no fim é a mesma `rede·publicar`.
  - Na tela inicial, o botão "Publicar" pergunta "Publicar onde?" e abre o app escolhido. Dentro de um app, esse passo é pulado.
  - A UI mostra a conta banida com o motivo, quando dá para ter outra e o botão de recurso; a suspensão com o motivo, até quando e o recurso; o histórico de advertências e suspensões; e a notificação de banimento.
- **SOC-11.5**:
  - O histórico aparece com 1 ano ou mais e tem a legenda visível "No fim de cada ano — e o número de agora".
  - Último item "agora (ano) N".
  - O perfil mostra "N … hoje · +X desde o fim de AAAA" (`crescimentoNoAno`, lendo `leituraDoBalanco(…,'aberto')`).
  - O balanço diz "O público em AAAA (ano fechado)", e o resumo das contas mostra "hoje" e "em AAAA (ano fechado)".
- **SOC-11.6**: `rendaDaConta`, `porMil` e `dados/redes` não foram tocados. A sim e o teste confirmam 9.000/mês para 1.000 assinantes no OnlyFans.

## Testes novos (resultado real)
- `src/motor/__tests__/rework11Relacoes.test.ts`: **22/22**. Cobre:
  - amizade namorando, sem romance e sem traição;
  - a busca dita como traição; com acordo aberto ou poliamor, permitida; a parceria pode perceber;
  - menor de 18 sem intimidade, sem convite escondido e sem "arriscar algo"; concepção bloqueada abaixo dos 18;
  - a intimidade num namoro sem morar junto;
  - o preservativo reduz a chance (3.000 sorteios), nunca há gravidez automática, a outra pessoa pode recusar, o caso escondido pode engravidar;
  - o `porque` gravado e o ex traído ≥ 20 pontos menos aberto; o ex bloqueia e as ações somem; a espera depois do não;
  - o paralelo não é secreto; o segundo namoro exige o poliamor, o acordo agora e o sim; voltar a ser exclusivo encerra; a migração do save;
  - o noivado apagado ao terminar e ao casar (e a migração); o rico sem "parcelado" e com luxo; quem parcela tem 24 vezes e prazo 24;
  - o planejamento: custo, celebrar, a dívida dita, o local que não comporta;
  - a lua de mel pela viagem, que ignora o intervalo uma vez.
- `src/motor/__tests__/rework11Redes.test.ts`: **5/5**. Cobre:
  - a advertência leva à suspensão e ao banimento, que zera a renda e bloqueia recriar por 60 meses;
  - o recurso uma vez;
  - nenhuma punição em posts comuns; denúncias com motivo numa conta tóxica;
  - o balanço aberto; o OnlyFans com 9.000.
- `src/ui/__tests__/rework11RelacoesRedes.test.tsx`: **5/5**. Cobre:
  - publicar em passos (escolher o tipo não publica);
  - "Publicar" na tela inicial pergunta a plataforma;
  - o histórico mostra "No fim de cada ano", "agora", "669 mil", "hoje" e "+189 mil desde o fim de";
  - a conta banida com o motivo;
  - o planejamento do casamento na ficha: combinar, casar e a lua de mel aparecendo.

## Testes existentes rodados
- Motor, primeira rodada: `social`, `rework105`, `rework10`, `rework4`, `fixPosRework4` com **209/209**.
- Motor, segunda rodada: `rework75`, `rework97`, `rework106`, `rework9`, `rework5`, `fix4`, `fixPosRework3`, `correcaoPosFix`, `motor`, `meiaidade`, `pacotePlaytest`, `fixPosPlaytestHumano` com 341/342 antes do ajuste abaixo; `fixPosRework3` depois do ajuste, **23/23**.
- UI: `fixPosRework4`, `rework75`, `rework9`, `rework105`, `rework10`, `fixPosPlaytestHumano`, `rework9Integracao` com **83/83**, já com os ajustes abaixo.
- Rodada final (motor: rework11Relacoes, rework11Redes, rework10, social, rework105, rework4, fixPosRework4, rework3, rework2, att3, fix2, trajetorias, sucessao, rework11Rotina, caminhos, rework2fecho, fixPosRework2): **538/540**. As duas falhas:
  - `rework2` "não se procura estando num relacionamento": mudança pedida. Ajustado (ver abaixo); depois, rework2 + ui `interface` + ui `navegacao`: **57/57**.
  - `rework11Rotina` "o gato de quem trabalha à noite…": **já falha na base b885ccc** (checkpoint da Fase G; conferido rodando o mesmo arquivo na árvore da base). Não é desta fase e não foi mexido.
- `npx tsc --noEmit -p .`: limpo.

## Testes antigos ajustados (e por quê)
- `motor/__tests__/rework2.test.ts` (10. busca ativa): com namoro, a busca era `false` em `podeTentar`. Agora, pelo REL-11.1, é `irregular` com o motivo "seria traição". O teste confere isso.
- `ui/__tests__/fixPosRework4.test.tsx` e `ui/__tests__/rework75.test.tsx`: publicar agora é em passos (SOC-11, pedido). Depois de escolher o tipo, o teste clica "Continuar" e "Publicar". A ação e a verificação são as mesmas.
- `motor/__tests__/fixPosRework3.test.ts` (autoescola, semente 62):
  - A vida desta semente engravidava aos 18 num casal de duas mulheres, o bug de REL-11.2 que foi corrigido. Sem isso, o acaso dos anos seguintes muda.
  - A prova sorteia duas perguntas pela preparação (~66% cada com uma apostila). A afirmação "acertando as três nunca reprova" só valia pela sorte da semente: ~11% de reprovar.
  - O teste agora fixa o acaso da prova (`rng: 62`) e ignora uma decisão de outra coisa aberta no mesmo ano. A regra da autoescola não foi tocada.

## Bundle (`npm run build`, kB)
- motor-textos: 763,9 → 769,2 (+5,3; abaixo de 800).
- motor-vida: 224,8 → 246,4 (módulos novos `afetosAdultos` e `casamento`).
- motor-conteudo: 143,8 → 145,2.
- motor-carreira: 341,5 → 342,3.
- Jogo: 612,7 → 623,8.
- Nenhum aviso de ciclo, nenhum chunk acima de 800.

## Pendente
- Trisal com `parceiros()` no plural continua fora de escopo, como diz a A6. O poliamor tem um principal e paralelos.
- A gravidez de um caso escondido não muda quem a parceria principal acha que é o outro genitor. Só abre a descoberta, com 60% de chance.
- A busca de amizade não tem aplicativo.
- O "atalho de bloquear o contato na ficha do ex" (opcional na A6) não foi feito.
- A escolha de como pedir em casamento (o anel, a cena) não foi feita (opcional).
