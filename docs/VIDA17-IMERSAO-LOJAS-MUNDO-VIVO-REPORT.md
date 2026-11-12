# VIDA 17 — Imersão, personalização, lojas e mundo vivo (relatório)

Branch `claude/vida17-imersao-lojas` (base: VIDA 16.1 publicada, `911205e`). Um agente só, sem subagentes. Notas de versão: `'17'`.

## O que foi feito, por frente

| Frente | Já existia | O que mudou |
|---|---|---|
| §2 Móveis | Espaço por m², depósito, troca de peça do depósito | **Função de cada móvel** (`v14/moveis/funcoes17`): vagas por cômodo (cama, guarda-roupa e penteadeira por quarto; sofá e mesa de centro por sala; banheira por banheiro; mesa de trabalho) ou por casa (mesa de jantar, geladeira, fogão, lavadora, closet, lareira, churrasqueira…). Sem vaga, a loja mostra o que já é seu e oferece **trocar** (a antiga vai ao depósito; a do proprietário, ele guarda) com o motivo dito. A 2ª cama vai ao 2º quarto, a 3ª ao 3º; sem quarto livre, "todos os N quartos já têm cama". Conjuntos trocam a peça da vaga. Saves com repetidos: a normalização redistribui e guarda o excesso (nada some). Poltrona, estante, planta etc. seguem só a regra do espaço. |
| §3 Celular no celular | O app Rede abria `RedesSociais` com moldura, câmera e barra de status | Sem segundo aparelho: as plataformas viram abas em cima e o conteúdo usa a largura toda (também em Tempo → Redes). Funções iguais. |
| §4 Mapa | Desenho genérico (rio e três ruas) | **Mapa ilustrado da cidade** (`ui/v17/mapa`): porte (metrópole, capital, polo, metropolitana, pequena), mar só onde é fato (capitais costeiras, dados da cidade), rio sem nome, vocações reais do catálogo da VIDA 14 (porto, centro histórico, distrito industrial, campus, campos…), os bairros = tipos de endereço que o jogo usa, você no do seu endereço, trabalho/estudo/comércio do estado real, a metrópole vizinha. Aviso de que o traçado é ilustração. |
| §5 Mensagens | ~12 tipos com 2–4 frases cada; 2–3 respostas | **11 situações novas / 40 falas-base em 4 vozes** (`dados17/celular`): desabafo (do aperto real), brincadeira (com lembrança real do vínculo), paquera, favor, cobrança, mágoa (motivo do vínculo), ciúme, reconexão, comemoração (feito real da biografia), aniversário, fama vista pelos amigos, trabalho, família, filho adulto. O temperamento decide a voz. 3–5 respostas por mensagem (apoio, conselho, evasiva, brincadeira, carinho, firmeza, desculpas, agradecimento, recusa, interesse, desinteresse) com efeitos distintos. **Fios de continuidade**: "outro dia" vira cobrança; apoio vira agradecimento; favor vira retribuição; resposta seca vira mágoa; paquera aceita vira convite para o encontro; desabafo ignorado vira cobrança de resposta. Respostas extras nas mensagens antigas. |
| §6 Limite | Até ~3 na virada + ondas + acasos + chamados (sem teto global) | **Cota central** (`sistemas/cotaDeMensagens`): ≤ 4 recebidas por ano, todas as fontes (virada, ondas, encontro por acaso, continuação de conversa escrita, imprensa do namoro, chamados de iniciativas/convívio/namoro). Prioridade alta/normal/baixa; meses espalhados. Escrever não conta. |
| §7 Rework visual | 16.1 só mexeu na navegação dessas áreas | Guarda-roupa em **grade de peças** (miniatura, estilos em fichas, em uso, usar/guardar, look por ocasião em cartões); Pessoas com a **constelação** do círculo (anéis por proximidade, cor do laço, toque abre a pessoa); Minha Semana com a **semana em tiras** (e a grade vazia recolhida); História com a **fita da vida** (fases e marcos reais). |
| §8 Lojas e roupas | Catálogo por loja, provador, variantes de cor | Linguagem comum: estado (é seu / em uso) no mesmo canto, cor de cada loja na vitrine, preço e nome em destaque (catálogo e listas de ofertas). Tecidos com **material** (sarja do jeans, tricô, linho, brilho do couro e da seda, felpa). **26 acessórios novos** com desenho próprio: 10 bonés/chapéus (trucker, dad hat, grife, viseira, bucket, fedora, boina, gorro com pompom, touca de cetim, aba larga), 4 óculos, 3 relógios, 3 joias, 6 bolsas (categoria nova na figura). Coque e moicano não atravessam mais o chapéu. Fluxo vitrine → compra → guarda-roupa → corpo auditado (mesma variante; teste). |
| §9 Corpo | 6 procedimentos de rosto; tatuagem sem rosto | **7 regiões no rosto** (testa, têmpora, canto da sobrancelha, canto do olho, bochecha, nariz, queixo) desenhadas no retrato (e na cabeça da figura), recortadas pela pele, com tamanho/posição/rotação/cor do estúdio. **11 procedimentos** no mesmo catálogo da clínica: bariátrica (corpo muda após 6 meses, forma sobe por 2 anos, suplementos anuais, pele em excesso, reganho), lipo, abdominoplastia, mamoplastia redutora, prótese (troca recomendada), bichectomia, mentoplastia, harmonização (passa), botox (1 ano), septoplastia, refrativa. Repouso bloqueia academia/esporte/viagem. Clínica por área, prévia de corpo inteiro, aviso de que não é orientação médica. |
| §10 Tatuagens | 511 desenhos | **+38 desenhos originais** (rua e periferia, tradição de cadeia, peças do rosto) e **4 conjuntos**; estilos "Rua e periferia" e "Tradição de cadeia"; texto "número". Os significados de cadeia dizem a origem e que o sentido varia; nenhum desenho é tratado como prova de crime. |
| §11 Prisão | Rede bloqueada só no fechado; celular livre | Todas as operações do celular recusadas no motor; Rede bloqueada também no semiaberto; mensagens não chegam; o aparelho mostra "celular retido" e o **telefone da unidade** (família próxima e parceria; 4 ou 6 ligações/ano). Solto, volta. |
| §12 Família | Mundo vivo dava namoro a genitor sem parceiro registrado | **Regra central** `livreParaRomance` (pais criados juntos e vivos sem separação registrada continuam casal; separação < 12 meses e viuvez < 24 meses esperam) aplicada ao mundo vivo, amigos, ex; a notícia/post de "namorando" só de quem ainda está no romance, e a separação deixa de virar "Tô namorando!". |

## Testes
- Novo `vida17.test.ts` (21): cota (ano, fontes, prioridade, vida inteira), situações e consequências, fios, prisão, estado conjugal, móveis (sofá, camas por quarto, save com repetidos), rosto, catálogo, cirurgias, vitrine → corpo.
- **Suíte completa**: 2686 aprovados; as falhas novas (11, de testes presos ao comportamento antigo: contagem do catálogo, rótulo "Seu celular", guarda-roupa recolhido, duplicação de texto) foram corrigidas e passam. **Preexistente**: `motor.test` "regra de agência" (tempo fixo de 60 s no teste; já na 16.1). `rework115Esportes` e `fechamentoMundo #4` falham só sob carga e passam sozinhos.
- Simulações: mensagens (12 vidas × 70 anos): máx. **4/ano**, 0 anos acima, 360 textos distintos, 100 respostas distintas usadas; família (60 vidas): **0 contradições** (antes: 2 em 80).
- Typecheck limpo; build; smoke 26/26.

## Pacotes
Todos abaixo de 800 kB. `motor-dados` passou a 802,5 kB no meio do trabalho; o catálogo de tatuagens (puro) e os dois módulos-folha novos foram para `motor-casa` → **781,7 kB**. `motor-textos` 797,1; novos `motor17-*` e `dados17-*` (≤ 29 kB).

## Visual (jogo real, build de produção)
1440, 390 e 360 px, claro e escuro: Pessoas, Minha Semana, História, Aparência, celular (início, Mapas em 6 cidades, Mensagens, Rede), Compras, celular preso. Sem rolagem lateral nem erro de console. Galeria de chapéus em 6 cabelos/idades, óculos, bolsas, tecidos e tatuagens do rosto. Saves antigos (11.5.1, 12.8, 12.9, 15) abriram sem erro.

## Saves
Campos novos opcionais: `Msg15.sit17/mes17/resposta.fala`, `Celular15.fios17`, `eu.restricao17/cirurgia17`, `visual.contorno17/abdomen17/busto17/bochecha17/botox17`; contagem da cota em `fatos`. Nada obrigatório.

## Pendências reais
- De costas, os chapéus novos usam a silhueta genérica do tipo e a bolsa não aparece.
- Roupas: materiais e acabamento melhoraram em todas as peças; silhuetas novas por peça não foram redesenhadas uma a uma.
- A garagem/showroom de veículos manteve o desenho da 16.1 (as listas de ofertas ganharam a linguagem comum).
- O teste "regra de agência" continua com o tempo fixo de 60 s.
