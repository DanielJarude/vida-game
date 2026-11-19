# VIDA 28 — carreiras esportivas, mercado de atletas, relações e coerência do mundo

Manual Mestre de Diretrizes lido integralmente antes de começar. Um único agente, trabalho sequencial, sem subagentes.
Branch `claude/vida28-carreiras-mercado-relacoes` (a partir de `main` 6bdfa05). Pedido extra no meio do trabalho: mais
projetos de tatuagem combinando estilos com os desenhos existentes (atendido; ver §11).

## 1. Auditoria inicial — a situação de cada frente antes de mexer

| Frente | Situação encontrada | Evidência |
|---|---|---|
| 2 · História | **Com defeito.** Reproduzido em sim (60 vidas de atleta em Marília): 22 dispensas, 21 seguidas de vínculo/promoção sem explicação, 10 "formaturas duplas". | `scripts` de sim `v28/sim/hist.ts` |
| 3 · Atributos por posição | **Parcial e funcional** (VIDA 25/26): futebol por posição, basquete, vôlei, futsal por função, tênis, natação, atletismo, lutas por estilo; e-sports e automobilismo com conjuntos próprios. Faltavam pênaltis, bola parada, criação, um contra um, três pontos, cobertura, consistência; no automobilismo, classificação, ultrapassagem, pneus, combustível, leitura. | `v26/esporte/atributos26.ts`, `automobilismo20.ts` |
| 4 · Arquétipos | **Ausente.** | — |
| 5 · Mercado | **Parcial**: o mercado do PERSONAGEM existia e é sólido (proposta fixada, taxa, luvas, empréstimo e volta, renovação, liberação, exterior, salário por divisão/porte/papel/reputação/país); as estrelas do mundo trocavam de clube (`premiosDoFutebol`). **Ausente**: elenco com nome, mercado autônomo do clube, bônus por conquista, bolsa da base. | `sistemas/esporte.ts` |
| 6 · E-sports | **Com defeito.** (a) o foco de treino era ignorado para quem faz aniversário no 2º semestre (gravado com o ano civil da ação, lido com `anoDe(t−6)` depois da virada); (b) o ganho do foco era quase invisível (+0,9 de nível aos 18 contra quem não escolhia foco); (c) a ocupação `jogador_esports` tem contrato `autonomo` e caía no mercado "autônomo": cenas de cliente, orçamento e ferramenta. | sim `v28/sim/esports.ts`; `mercados.mercadoDe` |
| 7 · Interface por modalidade | **Com defeito.** O crachá (Caminhos → Trabalho) mostrava "jogos · gols · assist." em toda modalidade; o painel "Em campo" do vôlei mostrava gols e assistências; a tabela da formação mostrava "G · A" no vôlei de base. | `Cracha15.tsx`, `CarreirasEspeciais.tsx`, `Formacao25.tsx` |
| 8 · Identidade do clube | **Com defeito (causa raiz achada).** A peneira guardava o clube do teste (`processo.lugar`), mas o convite recalculava o clube da cidade por hash (`nomeDeClube(cidade, id:convite)`): em cidade com vários clubes, o convite saía de outro clube. O título "Testes na academia…" escapava da leitura do nome. | `conteudo/caminhos.ts`, `oportunidades.ts` |
| 9 · Relações | **Profundo, mas sem as dimensões pedidas.** Existiam afeto, confiança, atrito, intimidade, compromisso, mágoa, história com peso e limite (o trivial sai primeiro), iniciativas, conversas que lembram marcos reais, rede familiar, vidas próprias e laços entre NPCs (v19). Faltavam respeito/admiração/lealdade/rivalidade/dependência, o esporte na memória de quem é próximo e a fama chegando antes. | `iniciativas.ts`, `conversas.ts`, `v19/npcs` |
| 10 · Épocas | **Parcial.** Objetos por década (ERAS v2: a TV de tubo, o telefone de disco), texto sem anacronismo, rua dos anos 1970+ (orelhão, sódio). A casa, a rua e os vizinhos antes de 1970 eram os de hoje; **defeito**: o orelhão (1972) aparecia em qualquer década antes de 2010. | `casas14.ts`, `entorno22.ts`, `vizinhanca27.ts` |
| Escola (achado) | **Defeito**: com menos de 12 meses restantes, a reprovação ("o curso ficou mais comprido") e a conclusão saíam no mesmo ano. | `escola.processarCurso` |

## 2. Causas dos defeitos da História (o caso do relatório)

1. **Promoção e dispensa decididas no mesmo ano, sem se consultarem.** `registrarAnoDeFormacao` escrevia "subiu para o sub-20 / treinou com o profissional" e, depois, `anoNaBase` sorteava a dispensa só pela técnica — o titular de nota 8 recém-promovido saía no mesmo ano.
2. **A História ordenava o ano por relevância** (o marco primeiro): a dispensa (marco) aparecia antes da promoção (biografia) que veio antes dela.
3. **A dispensa decidia pela pessoa**: o texto dizia "o sonho ficou para trás" antes da decisão "Depois da dispensa" (tentar outro clube / por gosto / largar).
4. **"Tentar outro clube" levava ao mesmo clube**: a próxima peneira era sorteada na mesma cidade (Marília só tem o Marília), e a base dispensada não era arquivada (`esporte = undefined`): a volta saía como "Entrou para a base do Marília".
5. **Médio integrado = duas entradas** ("terminou o médio integrado: diploma de técnico" e "concluiu o ensino médio entre os melhores").

## 3. O que foi feito (por arquivo)

**História**
- `nucleo.escrever` + `Entrada.fio` (o fio da trajetória) e `Entrada.chave` (a identidade do fato: a segunda narração do mesmo fato não é gravada).
- `ui/apresentar.fiosDoAno`: entradas do mesmo fio formam um fio só, lido na ordem de escrita (id sequencial) — a promoção antes da dispensa, mesmo sendo a dispensa o marco.
- `esporte.ts`: tudo o que a carreira escreve é do fio `esporte`; `riscoDeDispensa` (a comissão pesa nota, titularidade e potencial; promovido no ano não sai no ano); as etapas do ano só são contadas se o ano não terminar em dispensa; `AnoDeFormacao.desfecho='dispensa'`; a dispensa não diz mais "o sonho ficou para trás".
- `conteudo/caminhos.ts` (`esp_dispensa`): "tentar" arquiva a base; "por gosto" e "largar" escrevem o abandono (largar tira a rotina — nenhuma peneira chega sem ela).
- `clubesQueDispensaram`, `clubeDaPeneira`, `portaDaPeneira` (outro clube; se a cidade só tem aquele, a capital; nenhuma peneira no mesmo clube em menos de 2 anos); `entrarNaBase` conta "Voltou para…, que tinha dispensado você aos N" ou "Depois da dispensa do X, uma nova chance"; `clubeAmador` evita o clube que dispensou.
- `escola.ts`: o médio integrado é uma formatura só ("Concluiu o ensino médio integrado ao técnico em X, com os dois diplomas"), com chave do fato; a conta dos meses do curso (`mesesRestantes − min(12, restantes) + atraso`).

**Identidade do clube**: `Oportunidade.clube` gravado ao nascer a porta (esporte, perseguir); `aceitarOportunidade` usa ele; `Caminhos.conviteBase` guardado na aprovação; `conviteDaBase` lê dele (saves antigos: o convite de antes).

**Atributos (§3)**: `atributos26.ts` — `penaltis`, `bola_parada`, `um_contra_um`, `tres_pontos`, `criacao`, `cobertura`, `consistencia`, `duelos` (nome, explicação, natureza, corpo/mente); pesos por posição e função refeitos (todos somam 1); a temporada lê `bola_parada`, `criacao`, `duelos`, `tres_pontos` na produção. Automobilismo: `classificacao`, `ultrapassagem`, `pneus`, `combustivel`, `leitura` (derivados nos saves antigos); a CLASSIFICAÇÃO define a largada (a pole é dela), largar atrás custa conforme a ultrapassagem, o ritmo de corrida lê pneus/combustível (mais nas corridas longas) e leitura; o treino "simulador" sobe a classificação, "circuitos" a gestão e a leitura; a corrida ensina leitura e gestão.

**Arquétipos (§4)**: `sistemas/arquetipos.ts` (folha) — 33 arquétipos (futebol, basquete, vôlei, tênis, os da pessoa para todos — Capitão, Marrento, Talento precoce, Decisivo —, e-sports, automobilismo), cada um uma conta sobre os desvios dos atributos, os traços de personalidade, a idade, os anos no clube, a braçadeira, a produção e os títulos; principal + até 2 secundários acima do limiar; relidos no fim de cada temporada (a troca entra na História). Efeitos: variância da nota, régua do treinador, reputação (imprensa/torcida), vestiário (as pessoas do elenco), produção (gols/assistências/defesa), jogos grandes (copas; o mundial do e-sports). `CarreiraEsportiva.perfil28`, `Esports25.perfil28`, `Auto20.perfil28`; ficha: `ui/v28/Perfil28.tsx`.

**Mercado (§5)**: `sistemas/elenco28.ts` — elenco com nome (o concorrente direto e o veterano são Pessoas com vínculo); `janelaDoElenco` no fim de cada temporada: envelhece/evolui, aposenta, VENDE quem se valorizou (taxa, clube maior ou do exterior), RENOVA quem serve, LIBERA no fim do contrato, EMPRESTA o jovem que não joga (só futebol), CONTRATA para a vaga aberta (de outro clube, com ou sem taxa) ou SOBE da base; regras por modalidade (`REGRAS_DO_MERCADO`: basquete e vôlei por temporada, sem taxa). O concorrente pesa na régua do treinador (`concorrenciaNaPosicao`). O elenco nasce no primeiro contrato e na chegada a um clube novo. `bonusDaTemporada` (título da liga 1×, copa 1×, continental 2× o salário, pela participação; extrato e conta); `bolsaDaBase` (a partir dos 14; fração do mínimo pelo porte; nada antes do profissionalismo do país — Lei 9.615/98 art. 29 §4º, valor abstraído). Tela: `ui/v28/Elenco28.tsx` (a disputa pela vaga, o elenco, a janela, o último bônus).

**E-sports (§6)**: foco gravado para a temporada certa; foco com ganho real (+0,14 do caminho até o teto e +1,5 fixo dentro do teto nos atributos do foco); a frase do fim do ano diz quanto cada atributo subiu; "descanso" alivia o estresse; `mercados.TRILHAS_DE_COMPETIDOR` (atleta, esports, automobilismo → mercado 'esporte'; `adulto.porConta/empregado`, cenas corporativas, `equipe.temEquipe`, `mundoVivo`); trajetória de situação `esports` com 5 momentos próprios (`sistemas/situacoesEsports28.ts`: a final, o companheiro, a transmissão, as sete derrotas, a organização rival), efeitos na reputação, nos atributos, no salário e na titularidade.

**Interface por modalidade (§7)**: `perfisEsportivos.numerosDaTemporada` (fonte única), usada no crachá e no "Em campo"; resumo da carreira pelo `resumoDaCarreira` da modalidade; posição só no futebol; "Equipes" fora do futebol; coluna de produção da formação só onde existe.

**Relações (§9)**: `Vinculo.respeito/admiracao/lealdade/rivalidade/dependencia`; `sistemas/relacoes28.ts` — dinâmica anual (a rivalidade sem convívio esfria e vira respeito; admiração se apaga; lealdade acompanha confiança e tempo; dependência esquecida vira atrito), `ecoNasRelacoes` (título, primeiro contrato, transferência, dispensa, aposentadoria na história de cada pessoa próxima; admiração conforme a afabilidade; quem é afável aparece na dispensa; o rival reconhece o título), `primeiraImpressao` (a notoriedade dá admiração a quem acaba de conhecer você; a polêmica recente, pé atrás), `iniciativaDasDimensoes` (quem admira de longe procura; o rival orgulhoso fecha a cara; quem dependia cobra). A rivalidade com o concorrente sobe a cada troca de titularidade. Ficha da pessoa: as dimensões em palavras.

**Épocas (§10)**: rua de terra (<1920), paralelepípedo (1920–59), asfalto com faixa (1960+); lampião antes de 1930 e nenhum poste na periferia/cidade pequena; luz incandescente antes de 1970; o orelhão só de 1970 a 2009; centro com prédios baixos antes de 1950; parede caiada e sem bloco à mostra antes de 1950 (sem cor escolhida); antena de TV (1950–2009) e parabólica (1990–2009) no telhado das casas; vizinhos só dos tipos que existiam na década (`Modelo27.desde`: a laje com caixa-d'água é dos 1970). APROXIMAÇÃO DOCUMENTADA: a década é a régua de jogo, não a data de cada rua.

**Brincos (pedido no meio do trabalho)**: auditado o caminho inteiro — comprar → usar → `sincronizarVisual` (`modeloBrincos`) → `Retrato` → `Figura`: os 85 brincos do catálogo têm 85 desenhos distintos, e trocar de brinco troca o modelo e o desenho (verificado por renderização). A causa do "ficam com a mesma forma quando coloca": o `Retrato` desenhava o cabelo da frente DEPOIS dos brincos — com cabelo que cobre a orelha (liso longo, cacheado longo, ondulado...), o cabelo escondia o brinco e todos pareciam iguais; a vitrine mostrava a forma porque prende o cabelo. Agora, com cabelo que cobre a orelha, o brinco é desenhado por cima do cabelo (`Retrato.tsx`, `brincoPorCima`). Teste `ui/__tests__/vida28Brincos.test.tsx`; antes × depois em `v28/qa/antes-longo_liso.png` × `depois-longo_liso.png`. O alargador (preto) ganhou um aro de metal claro: sobre cabelo escuro, não some.

## 4. Integrações (o que conversa com o quê)
Desempenho → perfil → nota/reputação → propostas e salário; título → bônus no extrato → memória e admiração de quem é próximo; janela do clube → concorrente → titularidade → rivalidade com uma Pessoa → respeito quando a disputa acaba; transferência → elenco novo + memória; dispensa → decisão → arquivo da base → peneira em outro clube → História contada; e-sports → trajetória de competidor (nunca "cliente"); época → rua, casa e vizinhos.

## 5. Testes e resultados
(ver §8 — números reais preenchidos no fim)

## 6. Sims (antes × depois, mesmas sementes)
- História (60 vidas de atleta, Marília): dispensas 22 → 15; dispensa seguida de vínculo sem explicação: base mostrava "Entrou para a base do Marília" logo após a dispensa; depois, toda volta é "Depois da dispensa do Marília, … uma nova chance: entrou para a base do Palmeiras, em São Paulo" ou "Voltou para…"; "formaturas duplas" 10 → 3 (as 3 são diplomas distintos: médio + técnico concomitante).
- Carreiras (40 vidas, 6 cidades, até 32): 0 crash; 0 dispensa e promoção no mesmo ano; 0 convite → outro clube; 0 volta sem explicação; 0 formatura duplicada; janelas: 17 vendas, 9 empréstimos, 6 voltas, 49 saídas livres, 29 renovações, 45 contratações, 21 subidas da base, 4 aposentadorias.
- E-sports (40 vidas, CS, desde os 14, treino normal): nível aos 18 — base: com foco 51,5 / sem 50,6 (+0,9); novo: com foco 55,0 / sem 50,6 (+4,4); profissionais aos 21 — 23 (foco) × 15 (sem). Treino intenso: base +0,8, novo com a correção do ano +1,5 antes do reforço. Cenas de cliente/orçamento: o caminho de código foi fechado (teste `trajetoriaDeSituacao = 'esports'`).

## 7. Pendências reais
- Tênis por superfície (saibro/grama/dura): não implementado — o circuito não tem superfície por torneio; ficaria decorativo.
- Mercado autônomo nos e-sports e no automobilismo (os NPCs das organizações/equipes): o personagem tem propostas e trocas; os companheiros com nome são só do esporte de clube.
- Interiores da época (iluminação, cozinha) além dos aparelhos já por década (ERAS v2); arquitetura por país além do Brasil e da América Latina (os vizinhos por região já existiam).
- Rumores entre NPCs: a fama chega antes (primeira impressão) e os laços entre NPCs existiam (v19); a fofoca circulando entre eles não foi implementada.
- Um "Cannot access 'ke' before initialization" apareceu UMA vez numa captura (e-sports, 390 px, máquina saturada); não se repetiu em 3 tentativas no mesmo build nem no build não minificado. A estrutura de ciclos entre chunks é idêntica à de produção. Ver §8.

## 8. Validação, saves e publicação
(preenchido ao final)
