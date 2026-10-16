# REWORK 5 — MUNDO VIVO, PROFUNDIDADE SISTÊMICA E EXPERIÊNCIA JOGÁVEL

Base: `c578c86` (FIX pós-playtest humano), branch `claude/fix-pos-rework3-playtest`. Sem merge em `main`, sem force-push,
sem deploy manual (o Cloudflare Pages publica sozinho no push), sem segredos, `.claude/` fora do commit. **Save continua
v20**: tudo o que é novo é opcional e validado (`save.validarRework5`); saves antigos abrem sem migração.

> **Leitura honesta do escopo.** O pedido cobre o jogo inteiro. Este pacote ataca a raiz dos problemas do playtest
> (os quatro bugs, o mundo parado, a prisão "de mentira", o expediente igual para toda profissão, atributos sem
> trajetória) e audita o resto. Cada seção abaixo diz se a coisa está **implementada e validada**, **parcial**,
> **auditada mas ainda rasa** ou **não implementada**. Nenhuma carreira é declarada profunda sem ser.

---

## 1. Arquitetura alterada

| Peça | Onde | O que é |
| --- | --- | --- |
| Mundo vivo | `sistemas/mundoVivo.ts` (novo, pacote `motor-vida`) | o pulso anual autônomo (pessoas, trabalho, cidade, portas do talento) + `noticiasDoAno` (o "Enquanto isso", lido da Linha da Vida — fonte única) |
| Prisão jogável | `sistemas/prisao.ts` (novo, `motor-vida`) | `bloqueioDaLiberdade` (porta central consultada por `acoes.disponibilidade` antes de qualquer regra), `interacaoNaPrisao`, `leituraDaPena`, ações `{ tipo: 'prisao' }`, `processarPrisao`, foragido |
| Experiência por calendário | `nucleo.somarExperiencia` | a ÚNICA porta para somar experiência numa trilha: no máximo 12 meses por ano de calendário (`Trabalho.expAno`) |
| Anos de prática | `frentes.anosDePratica` | anos ditos = calendário desde o início, nunca mais que a intensidade justifica |
| Conta da publicação | `redes.contaDoPost` (pura) + `saturacaoDoPublico` + `ALCANCE_MAXIMO` | a matemática das redes numa função testável |
| Invariantes de tempo | `coerencia.coerenciaTemporal` (dentro de `verificarCoerencia`, que testes e sims rodam a cada ano) | prática ≤ idade, experiência ≤ vida ativa, temporadas sem repetição, pena coerente, preso sem carteira, rede ≤ 1 bi |
| Ofício por profissão | `situacoes.MODELOS_OFICIO` (+ `_AUTONOMO`) | 16 cenas próprias de 8 famílias de profissão, na arquitetura existente de situações |
| Transferência | `esporte.taxaDeTransferencia`, `PropostaDeClube.taxa/luvas`, `CarreiraEsportiva.totais/transferencias`, `Temporada.minutos` | o dinheiro entre clubes separado do dinheiro do atleta; totais da carreira que não se perdem |
| Programa de fundamentos | `perseguir.processarFundamentos` (chamado por `viverAno`) | a inscrição é agora; o treino acontece quando o ano passa |
| Interface | `telas/Jogo.EnquantoIsso`, `jogo/Trabalho.PainelDaPena/PainelForagido`, `jogo/Voce.Trajetoria`, `comum.Valor`, `ui/mundo-vivo.css` | o que o mundo fez, a pena, a linha dos estados, o valor que cabe |

Ordem do ano (`viverAno`): … `processarJustica` → **`processarPrisao`** … `treinoProfissional` → **`processarFundamentos`**
→ `processarRotinas` … `processarOportunidades` → **`processarMundoVivo`** → `processarIlicito` … Os sorteios novos são
derivados (`rngDe`): nenhum consome o acaso principal.

Bundle (limite 800 kB **não** foi aumentado): `motor` 745,6 → **747,6 kB**; `motor-vida` 83,8 → 112,3 kB;
`motor-carreira` 277,6 → 302,8 kB; `motor-textos` 732,9 → 733,3 kB; `Jogo` 371,8 → 378,0 kB; CSS 125,0 → 129,7 kB.

## 2. Bugs corrigidos (Etapa 1) — implementado e validado

### 2.1 "Um ano de fundamentos" envelhecia o personagem
**Causa real:** a idade nunca mudava (`v.t` só anda em `viverAno`). O clique aplicava *na hora* um ano inteiro de
prática (`praticar` +13 meses, mais +6) e a técnica de um ano — e a linha "Há N anos" ao lado do botão pulava de 9 para
10/11. Lido junto com o rótulo "Um ano de…", parecia envelhecer.
**Correção:** a ação é a **inscrição num programa que dura o próximo ano** (rótulo: "Programa de fundamentos, com
treinador (dura o próximo ano)"). Paga-se agora; o treino acontece em `processarFundamentos`, pelo mecanismo central,
antes das rotinas (para a frente contar como praticada no ano). Não se compram dois anos num clique. Teste:
`rework5 › 1.1`. Os dois testes antigos que exigiam efeito instantâneo (`fix31 › 4`, `fixPosRework3 › P1.6`) agora
passam o ano antes de medir — a cadeia causal testada é a mesma.

### 2.2 17 anos, "25 anos" de futebol
**Causa:** `Frente.meses` é prática **ponderada pela intensidade** (pelada + time da escola + escolinha somam no mesmo
ano: 40+ "meses" por ano); a tela dividia por 12. O mesmo padrão existia em `trabalho.experiencia`: emprego (+12),
bico (+6), ofício da família (+3/+6), oportunidade (+3), caserna (+5), conteúdo (+6) somavam na mesma trilha.
**Correção na fonte:** `anosDePratica` (calendário, limitado pela intensidade) para tudo o que se DIZ; `meses` segue
servindo ao aprendizado. `somarExperiencia` é a única porta da experiência, com teto de 12 meses/ano por trilha; os 7
pontos de escrita passaram por ela. Invariantes em `coerenciaTemporal`, rodadas a cada ano em testes e sims.
Medido (`scripts/sim/mundoVivo.ts`, 24 vidas × 60 anos, 1.377 anos): **0** violações.
*Não alterado:* a "leitura de jogo" da peneira (`peneira.aspectos`) ainda lê `meses/12` como intensidade, com teto de 6
anos — é calibração, não texto.

### 2.3 Redes: 3.736 milhões de visualizações, 127 milhões de seguidores num post
**Causa:** `alcance` (descrito como fração do público) era multiplicado por **3**; a qualidade não tinha teto (até 3,9×);
fama (até 5×), criador, sorte, impulso (3×) e viral (até 35×) multiplicavam sem teto — ~7.200× o público num post, e os
seguidores novos eram uma fração fixa disso (o TikTok dobrava a conta a cada post sem nem viralizar). E
`seguidoresEmPalavras` não tinha "bilhão" (3,7 bi saía "3736 milhões") e escrevia "1000 mil".
**Correção na matemática** (`contaDoPost`): alcance = fração real; qualidade ≤ 2×; fama ≤ 2,2×; impulso 2×; post comum ≤
`piso×6 + 2,5×público`; viral = público NOVO proporcional à conta e ao algoritmo da plataforma (o TikTok empurra mais),
com teto absoluto de 250 milhões; ganho ≤ 4% do público (comum) ou 50% (viral) e `saturacaoDoPublico` (metade aos 5 mi,
1/9 aos 20 mi) também nos ganhos anuais proporcionais. A polêmica soma 80% de alcance (não dobra) e quase nada de
público; a manchete agora mostra o mesmo número que a lista. Compra: um pacote por ano e por conta; descoberta remove
tudo o que foi comprado (antes 10% virava "real" em silêncio). Palavras: "bilhão/bilhões", "1 milhão" no lugar de "1000 mil".

Medido (`scripts/sim/redesEscala.ts`, 12 vidas por plataforma, 30 anos):

| | público final (mediana) | maior post | maior ganho num post |
| --- | --- | --- | --- |
| criador agressivo, fama 60, impulsiona tudo, 8/ano — antes | 69 mi – 386 mi | 450 mi | 22 mi |
| criador agressivo — **depois** | Instagram 18 mi · TikTok 7,5 mi · YouTube 18 mi · X 7,9 mi · Facebook 13 mi · Twitch 1,2 mi | 250 mi (um viral do TikTok de conta grande) | 1,7 mi |
| pessoa comum, 3 posts/ano — depois | ~1 mil (YouTube 35 mil, pelo catálogo) | 61 mil | 1,5 mil |

As plataformas continuam diferentes (teste: o mesmo post de humor alcança mais no TikTok que no Facebook).

### 2.4 Valores passando da tela
`Valor` (novo, `ui/comum`): até 13 caracteres, o valor inteiro; acima, a forma curta (`R$ 3,1 bi`) — e um toque mostra o
completo (consultável). `formatarDinheiroCurto` ganhou "tri" (sem "1.000,0 bi"). Em ≤ 420 px, os valores "que não se
partem" passam a quebrar como unidade; `.conteudo` corta overflow lateral; botões, modais e avisos quebram palavra longa.
Capturas (§9): **0** rolagens horizontais e **0** elementos estourando a borda em 1440/820/390/360 nas telas novas.

### 2.5 Outras inconsistências encontradas e corrigidas na origem
- **Preso vivendo normalmente** (achado da auditoria): comprar carro/imóvel, mudar de cidade, alugar, matricular, ENEM,
  CNH, adotar, pet, empréstimo, plano de saúde, experiências, compras, presentes, redes, cinema/jantar/namoro com
  qualquer pessoa — tudo seguia disponível. Agora a porta central `bloqueioDaLiberdade` decide (o semiaberto devolve o
  trabalho de dia, não a vida da rua); a ficha de Pessoas só mostra o que cabe numa visita; regime fechado não concebe;
  ninguém "conhece alguém" no bar de dentro da cela.
- **"A pena começa fechada"** quando o regime sorteado era o semiaberto: o texto agora segue o regime.
- **Notícias que voltavam:** a limpeza anual do mundo vivo apagava a marca do "já contado" (crise, casamento do amigo) —
  achado na sim e corrigido antes do commit.
- **Notícia muda:** o amigo próximo "casava" trocando um campo, sem ninguém saber; agora vira notícia (uma vez).

## 3. Sistemas autônomos (Etapa 2) — implementado e validado (com limites)

Já existia muita vida de NPC (auditada): amigos mudam de cidade (`social`), irmãos namoram e casam (`familia`), filhos
estudam, trabalham, casam, mudam, emigram (`filhos`), pais adoecem e se separam, o NPC termina o romance (`romance`),
iniciativas (`iniciativas`: convite, pedido de ajuda, desculpas, reaparecer — a reconciliação já existia), diagnósticos
(`corpo`), mortes e luto. O que **faltava** e entrou (`mundoVivo`, ≤ 1 acontecimento por pessoa/ano, ≤ 3 por ano):

| Acontecimento | Estado que muda (persiste) |
| --- | --- |
| a chefia é trocada | sai o gestor (outra empresa), entra uma pessoa nova com ambiente do emprego; `Emprego.clima` recomeça (o clima decide promoção e demissão) |
| reorganização da empresa | clima −10, estresse +4 |
| colega promovido / sai para outra empresa | renda e trajetória do colega; convívio de trabalho acaba; régua do jogador (estresse) ou comemoração (proximidade) |
| amigo tem filho (às vezes chama para apadrinhar) | `Pessoa.nFilhos`, trajetória, memória, proximidade |
| amigo abre negócio | ocupação, trajetória, a inauguração na história de vocês |
| amigo se casa (antes mudo) | notícia única |
| parente adulto muda de cidade | `municipioId` (as opções presenciais mudam), trajetória |
| pai/mãe só refaz a vida | `parceiroId`, trajetória |
| filho/neto descobre um interesse | trajetória da criança |
| o ex segue a vida | `parceiroId`, humor |
| amigo distante dá notícia sozinho | contato e proximidade |
| a cidade entra e sai da crise | notícia (a economia já existia; agora se vê) |
| o professor nota o talento | interesse na frente (para quem ainda hesita) |
| o talento amador é chamado | cachê local (casamento, festa, fachada) ou **oportunidade** de banda/grupo (o fluxo `arte_projeto` existente); o campeonato do bairro (forma, interesse, um parceiro de jogo novo) |

**Iniciativa dos outros:** reaproveitada (não duplicada) — `iniciativas` continua sendo a fonte dos chamados.
**Frequência medida** (`scripts/sim/mundoVivo.ts`, 24 vidas, 6 países, 1.377 anos): **1,72** notícias do mundo por ano,
**23%** dos anos sem nenhuma; 1,2/ano na infância, ~2/ano dos 30 aos 49. Teste: nunca mais de 3 por ano; anos
tranquilos existem. Nada disso abre modal: aparece em **"Enquanto isso"**, logo depois do fechamento do ano, com o tipo
(Pessoas, Família, Trabalho, A cidade, Uma porta) e "Ver fulano".
**Proporcional:** só vínculos que importam (proximidade ≥ 30, família, ex) são lidos; o resto segue a evolução simplificada.
**Limites:** os NPCs autônomos não ganham carreira detalhada nova (os próximos já tinham `carreiraDeAdulto`); oportunidades
espontâneas novas são poucas (banda/grupo); propostas de emprego e de clube continuam vindo dos sistemas que já as geravam.

## 4. Catálogo real de carreiras auditadas (Etapa 3)

248 ocupações em ~85 trilhas (`dados/ocupacoes`), agrupadas em famílias (`dados/carreiras`). Estado **depois** deste pacote:

| Família | Entrada | Ofício próprio | Progressão / histórico | Situação |
| --- | --- | --- | --- | --- |
| Futebol | peneira → base → contrato; rota amadora | 12+ cenas, temporada jogo a jogo, lesões, seleção, empréstimo, renovação | temporadas (agora com **minutos**), **totais da carreira**, **transferências com taxa** (entre clubes) ≠ **luvas** (do atleta), liga e papel esperado na proposta | profundo — implementado e validado |
| Técnico de futebol | ex-jogador, convite | 9 cenas, liga, pressão, demissão | passagens V/E/D | profundo (já era) |
| Basquete, tênis | seletiva/circuito | cenas próprias, ranking, prêmios | temporadas próprias | profundo (já era) |
| Vôlei, natação, atletismo | equipe | estatística própria; cenas genéricas de "atleta" | temporadas | médio |
| Lutas | equipe | cartel; cenas genéricas | temporadas | **auditado, ainda raso** |
| Medicina | curso + registro → residência | 4 cenas + especialidade, faixa salarial | especialidade | médio (sem casos persistentes) |
| **Direito** | curso + ordem | **novo:** a audiência (acordo × sustentar × adiar, causa pela área), o cliente que mentiu (ética) | `feitos`, memória do momento | **parcial** (era raso: só área) — sem lista de casos/clientes persistente |
| **Docência** (educação, superior, técnico, idiomas, música, dança) | vaga/concurso | **novo:** a turma difícil, o aluno que sumiu, o convite para coordenar (salário +10–12%) | `feitos`, coordenação | **parcial** |
| **Tecnologia/engenharia/arquitetura/design** | vaga, habilidade | **novo:** o prazo impossível, a falha (em produção/na vistoria), a ferramenta nova (sobe a frente de programação) | `feitos` | **parcial** |
| **Saúde não médica** (enfermagem, fisio, odonto, psico, nutrição, farmácia, radiologia, saúde pública, cuidado) | registro | **novo:** o turno que não acaba, quem não volta | `feitos` | **parcial** |
| **Segurança pública** (PM, civil, bombeiro, guarda, penal, federal, perícia, vigilância) | concurso + curso | **novo:** a ocorrência (mediação × protocolo × apoio — abstrata), o colega que passou do limite | `feitos` | **parcial** (era raso: só antiguidade) |
| **Balcão/escritório** (comércio, atendimento, administrativo, logística, vendas, finanças, contábil, alimentação, beleza) | vaga | **novo:** o cliente furioso, o processo errado de sempre | `feitos` | **parcial** |
| **Obra e ofício** (construção, elétrica, hidráulica, mecânica, marcenaria, manutenção, predial, reparos, indústria) | vaga | **novo:** o atalho na obra (com acidente possível: saúde e forma) | `feitos` | **parcial** |
| **Escrita** (literatura, comunicação, conteúdo) | obra/vaga | **novo:** o texto que querem mudar | `feitos`, obras | **parcial** (sem editora/vendas) |
| Música, teatro, dança | prática → grupo → convite | apresentar, edital, audição, turnê | obras (≤ 20), currículo, palcos | médio-profundo (sem discografia separada) |
| Atuação/audiovisual | audição | contratos, agente | currículo (filmografia) | profundo (já era) |
| Desenho, fotografia, ilustração | clientes | lançar obra | obras | **auditado, ainda raso** |
| Negócios (15 tipos) | abrir | 13 ações de gestão, 25 eventos | caixa, equipe, histórico | profundo (já era) |
| Política | várias portas | 11 ações, 13 eventos, calendário eleitoral | mandatos | profundo (já era) |
| Academia/pesquisa | mestrado/doutorado | projetos, orientandos, publicações | produção | médio-profundo (já era) |
| Forças Armadas | alistamento/concurso | movimentação, TAF | guarnições, cursos | profundo (já era) |
| Rural/pesca | terra | safra, cooperativa | safras | médio |
| Aplicativos, informal, doméstico | por conta | preço, MEI, divulgar | clientela | **auditado, ainda raso** |
| Crime | proposta contextual | rumo, pressão, "dar um tempo", parar | ganhos, exposição → processo | médio (abstrato por desenho) |
| **Prisão** | condenação | **nova camada** (§5) | pena com forma | **implementado e validado** |

O expediente de quem tem ofício próprio produz cena um pouco mais (×1,45 na chance anual, ainda "cadência mansa") e as
cenas próprias pesam 1,8× sobre as quatro genéricas — que continuam lá. Quem exerce **por conta** (a advogada do próprio
escritório, o eletricista) vive as mesmas cenas (`_conta`), exceto as que pedem vínculo (corregedoria, coordenação).
Casos e clientes são fictícios; as cenas de segurança e de obra não ensinam procedimento real.

## 5. A prisão como camada jogável — implementado e validado

- **A pena com forma** (`leituraDaPena`, painel "A pena" em Trabalho): regime (cor própria), desde, pena da sentença,
  saída prevista, comportamento (boa/regular/ruim), barra do tempo cumprido, meses remidos, benefícios (progressão com
  data, trabalho externo, saída preparada), a facção quando aceita.
- **A rotina de dentro** (ações `prisao`): estudar e trabalhar na unidade (remição — as mesmas marcas que `justica` já
  lia; agora `remidos` acumula e aparece), pôr a família na lista de visitas (quem vem depende da proximidade; quem vem
  fica na história), aproximar-se de alguém do pavilhão (uma pessoa nova, com origem na prisão), pedir a defensoria
  (progressão antecipada com comportamento, ou revisão do cálculo), preparar a saída (no último ano e meio: o programa de
  egressos passa a ser certo e com mais peso), tentar fugir.
- **O pavilhão pressiona** (`processarPrisao`): o convite da facção, a provocação, o motim — uma situação de cada vez,
  com respostas (recusar/aceitar; evitar/enfrentar/pedir outra ala; ficar na cela/ir junto) que mexem na disciplina, na
  saúde, na pena e no regime. Sem resposta em um ano, o pavilhão decide. A facção aceita cobra favores.
- **A disciplina importa:** a progressão do regime agora exige comportamento (≥ 40) além do tempo.
- **A fuga** é escolha abstrata (sem "como"): 6% no fechado, 25% no semiaberto (não voltar da saída). Falhar: falta grave,
  regime fechado, +8–18 meses, remição perdida. Conseguir: **foragido** — sem carteira, sem concurso, sem fronteira, sem
  cartório (porta central), estresse anual, 30%/ano de recaptura (+12 meses, fechado); **entregar-se** encurta a conta.
- Teste causal: condenação → restrição → rotina → tempo → mudança de situação → (fuga/recaptura) → save/reload.
- **Limites:** a legislação é a abstração do Brasil já existente (`justica`), sem regra por país; não há saída temporária
  nem visita íntima modeladas; detentos conhecidos não voltam como contato do crime depois da saída.

## 6. Vida fora das carreiras (Etapa 4)

| Tema | Situação |
| --- | --- |
| Família | **parcial**: a família já vivia sozinha (filhos, netos, irmãos, pais); entrou o pai/mãe que refaz a vida, o parente que muda, o filho que descobre um interesse — e tudo isso agora se vê no "Enquanto isso" |
| Relacionamentos | **parcial**: amigos com filhos, casamento, negócio, mensagem de longe; as microcenas e a antirrepetição do FIX anterior seguem (não mexidas) |
| Educação | **auditado**: sem mudança além do professor que nota o talento |
| Hobbies | **parcial**: o talento amador é chamado (cachê, banda/grupo, campeonato) |
| Patrimônio, saúde, viagens | **auditado, não alterado** neste pacote (as interações com bens, a clínica e as viagens dos pacotes anteriores seguem) |
| Redes | **implementado**: a matemática (§2.3) |

## 7. Interface e atributos (Etapa 5)

Atributos reais do motor: `corpo.saude`, `corpo.forma` (condicionamento), `corpo.aparencia`, `mente.felicidade`
(bem-estar), `mente.estresse` (cabeça), `mente.cognicao` (aprendizado). Todos já tinham palavra, escala de 5 marcas,
tendência e causas ("tem pesado / tem ajudado"). Entrou:
- **a trajetória**: uma linha dos últimos anos (o registro anual que o motor já guardava, `mente.historico`, + agora),
  sem número, "subir é melhorar" em todas (a cabeça invertida), vermelha quando cai — nos três estados e em
  condicionamento, aprendizado e aparência;
- **o que cada estado muda** ("Pesa na vontade de praticar e estudar…"), fiel ao que o motor lê;
- telas específicas: **a pena** (§5), o **atleta** com minutos e totais da carreira, a **proposta** com liga, papel,
  taxa (entre clubes) e luvas (suas), o **"Enquanto isso"** com cor por categoria (tons das áreas, sem cores novas).
- Estética: os tokens existentes; nada de emoji, gradiente ou card novo. A auditoria de CSS pegou uma colisão de classe
  minha (`.trajetoria` já existia) antes do commit — virou `.linha-estado`.

## 8. Narrativa (Etapa 6)

**Parcial.** O mundo vivo escreve na Linha da Vida como `cotidiano` (atrás de "Mostrar tudo") o que é notícia, e como
`biografia` o que marca (a chefia nova, o apadrinhamento, o pai que namora de novo, o convite com cachê). As cenas de
ofício guardam memória na carreira (`caminhos.situacoes`) e só o que marca vira biografia. Sem novas centenas de frases
soltas. Não foi feito: variação contextual nova para "caminhar" (as microcenas do FIX anterior seguem como estavam).

## 9. Resultados de testes e validação

| Verificação | Resultado |
| --- | --- |
| Suíte completa, Node 22 | **1.235 passaram** (71 arquivos; base 1.216 + 19 novos em `rework5.test.ts`) |
| `npm run typecheck` | limpo |
| `npm run build` | limpo; nenhum pacote passa de 800 kB |
| `build:itch` + `smoke:itch` | 21/21 |
| PWA offline (`scripts/pwa/offline.mjs`) | 31/31 |
| Vazamentos geográficos (`scripts/sim/vazamentos.ts`) | 0 achados |
| Invariantes de tempo, 1.377 anos simulados | 0 violações |
| Capturas (`scripts/playtest/rework5.mjs`, 7 cenas × 1440/820/390/360) | 0 rolagem horizontal, 0 estouro de borda, 0 erro de console |

**Testes alterados (com justificativa):**
- `fix31 › 4` e `fixPosRework3 › P1.6`: o treino de fundamentos agora acontece quando o ano passa — o teste passa o ano
  antes de medir (mesma cadeia causal).
- `sucessao › H3–H6`: o fixture monta o patrimônio à mão; zerou também `herdado_total` (no caminho de vida novo da
  semente, a mãe morre antes e a herança recebida reduzia a meação — o teste mede o dono único, não isso).
- `rework3 › E` e `fixPosPlaytestHumano › F/G`: os fixtures passaram a montar as condições que o teste pressupõe (a boa
  aluna pelas matérias; o estresse baixo do caso do playtest) em vez de depender do caminho sorteado até a idade.
- `rework2 › 3`: a "porta aberta" depois da peneira aceita o convite **ou** a base já assumida no mesmo laço de decisões.
- `caminhos › 9 e 10` (**afrouxado, com justificativa**): "amadores ≤ base" valia só por sorte nesta amostra de 40 — o
  próprio teste registrava 120 vidas da base anterior com 13 pela base × 21 amadores. Medido: 4 × 4 sem o mundo vivo,
  4 × 6 com ele (o mundo reembaralha as vidas). O teste afirma agora o que o desenho diz: a porta amadora é exceção entre
  quem tenta (≤ 25%), como a base. As outras quatro asserções do teste seguem iguais.

## 10. Métricas antes/depois (mesma máquina, mesmo script)

| | Base `c578c86` | REWORK 5 |
| --- | --- | --- |
| Testes | 1.216 | 1.235 |
| Motor (`motor`) | 745,6 kB | 747,6 kB |
| Tempo por ano simulado (`desempenho.ts`, 24 vidas × 50) | 12,4–12,9 ms | 12,8 ms |
| Save médio no fim (máximo) | 107,6 kB (141,5) | 121,5 kB (160,5) |
| Notícias do mundo por ano | — | 1,72 (23% dos anos sem nenhuma) |
| Maior post (criador agressivo, 30 anos) | 450 mi | 250 mi (teto) |

O save cresceu **13%**: pessoas novas que o mundo traz (a chefia nova, o colega de campeonato, quem divide o pavilhão;
+3,5 kB) e as linhas de notícia na Linha da Vida (+7 kB). Cresce linear com os anos, como o resto — mas é o maior custo
deste pacote (ver §13).

## 11. Testes de causalidade (em `rework5.test.ts`)

- **Esporte:** inscrição no programa → nada muda no clique → o ano passa → técnica sobe; proposta com contrato → taxa >
  luvas → assinar credita só as luvas → transferência na história → save/reload.
- **Relações/mundo:** amigo próximo → o ano passa → filho ou negócio (estado) → notícia do ano → save/reload preserva.
- **Trabalho:** emprego com chefia → o ano passa → chefia nova (pessoa com ambiente) → clima recomeça → notícia.
- **Prisão:** condenação → a porta central bloqueia a rua e o cinema (e deixa a visita) → estudar e trabalhar → o ano →
  remição na leitura e na saída prevista → save/reload; o pavilhão → resposta → disciplina; fuga → (falha: pena maior,
  fechado) ou (foragido: sem carteira/fronteira → save → entregar-se → fechado).
- **Redes:** a conta pura nos extremos; plataformas diferentes; palavras dos números; um pacote comprado por ano.
- **Tempo:** prática e experiência com teto de calendário; duas vidas inteiras sem violar invariante nenhuma.
- **Ofício:** advogada → audiência; professor → turma; enfermeira → turno; o genérico continua.

## 12. Problemas ainda existentes

- Direito, docência, tecnologia, saúde, segurança, balcão, obra e escrita ganharam **situações**, não **sistemas**: não há
  lista persistente de casos, turmas, projetos ou pacientes; a progressão continua a do emprego (mérito/antiguidade).
- Lutas, artes visuais, aplicativos/informal e o pós-concurso continuam rasos.
- Médicos ainda sem casos persistentes; música sem discografia separada (a obra é a unidade).
- O mundo vivo não gera propostas de emprego nem de clube novas (vêm dos sistemas de sempre); a "universidade que
  oferece oportunidade" é a de `oportunidades` (bolsa, iniciação), sem novidade aqui.
- A prisão não tem legislação por país; detentos conhecidos não reaparecem depois.
- Atributos: a trajetória mostra até 8 anos (o limite do registro).
- Família, educação, patrimônio, saúde e viagens: auditados, sem mudança de profundidade neste pacote.

## 13. Limitações técnicas

- Save +13% (§10). Uma compactação de notícias antigas foi tentada e **descartada**: apagar entradas da Linha da Vida no
  meio do ano desloca os índices que a tela usa para destacar o ano novo. O caminho certo é compactar na abertura do
  save (fora do ano) — fica para o próximo pacote.
- `motor` a 52 kB do limite; `motor-vida` absorveu o que é novo (112 kB) para não pressionar os pacotes grandes.
- O APK Android **não** foi regenerado neste pacote (o JDK/SDK não ficam entre sessões); continua experimental até teste
  em aparelho real. O PWA/offline foi validado.

## 14. Recomendações para o próximo playtest humano

1. Futebol: clicar "Programa de fundamentos" e confirmar que nada envelhece; ver a proposta com taxa e luvas; conferir
   "Na carreira: … minutos".
2. Criar uma conta e postar muito por anos: os números devem parecer de gente (mil, dezenas de mil; milhões só com fama).
3. Viver 10 anos de vida comum e ler o "Enquanto isso" a cada ano: o mundo parece mexer? Repete? Incomoda?
4. Ser preso (o caminho do crime) e jogar a pena: a rotina, o pavilhão, a defensoria, a fuga; tentar comprar um carro.
5. Ser advogada, professor, enfermeira, PM, vendedor, eletricista: as cenas do ofício aparecem e parecem daquela profissão?
6. No celular (≤ 390 px): a tela de Dinheiro com muito dinheiro (tocar no valor), a pena, o Você com as linhas.
7. Dizer quais carreiras ainda parecem "salário e promoção" — a próxima rodada deve transformar as situações de ofício em
   sistemas (casos, turmas, projetos persistentes) começando pelas mais jogadas.
