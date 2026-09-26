# FIX #3 — investigativo pós-playtest humano

> "Se alguma coisa entra na vida deste personagem, ela continua existindo,
> interagindo com o resto da vida e produzindo história — e o jogador entende
> o que aconteceu?"

## Branch, base, HEAD

| | |
| --- | --- |
| Branch | `claude/fix-playtest-3` (criada a partir da branch do Playtest #3; nada em `main`, sem merge, sem force-push) |
| Base | `9518411` — docs do rework visual e da vida profissional e política |
| HEAD | ver `git log -1` ao fim (commits `aed1a41`, `ea32c85`, `ca4c489`, `bab02e4`, `f2d850a` e o do relatório) |
| Node | 22 (`~/.nvm/versions/node/v22.23.2`) |

## Baseline

Na base (`9518411`): typecheck limpo, build ok, **339/339 testes**.
Ao fim: typecheck limpo, build ok, **393 testes** (54 novos em
`src/motor/__tests__/fix3.test.ts`), todos passando.

## Causas-raiz encontradas

Cada observação do playtest foi reproduzida antes de mexer. Quase nenhuma era
um defeito isolado; eram lugares onde **o motor escolhia em nome do jogador**
ou **o estado existia sem representação**.

| Observação do playtest | Causa-raiz | Correção (sistêmica) |
| --- | --- | --- |
| Passou na peneira e a faculdade sumiu | `entrarNaBase` e a contratação trocavam a vida sem perguntar; a mudança de cidade *cancelava* a matrícula | Novo sistema de **compromissos**: toda entrada nova passa por `propor` → conflito → pergunta com planos |
| Abrir empresa tirou o emprego | O negócio **era** o `trabalho.atual`; abrir contratava o dono por cima do emprego; negócio sem dono no emprego fechava sozinho no ano seguinte | Negócio com **dedicação** (`integral` / `paralela`); paralelo não mexe no emprego, não paga retirada fixa e não fecha sozinho |
| Loja on-line recebeu "O jeito de vender"/"vender pela internet também" | Um único catálogo de estratégias e textos, de loja física | **Presença** por tipo (rua, on-line, atendimento, obra): estratégias, tombos, textos e ações próprias |
| `undefined` na bandeira política | A ação "bandeira" executava sem valor | Bandeira é **decisão com valor** (`pol_bandeira`); leitura sem valor = "nenhuma, por enquanto"; migração limpa valor inválido |
| Gato de 4 anos morreu "de velhice" | Causa padrão de morte de pet = `'velhice'`, idade da espécie ignorada | Expectativa de vida por **espécie**; velhice só na idade de velhice; antes disso, causa |
| "Deixar a Força" no primeiro ano de quartel | Pedido de demissão genérico | Conscrito não sai (seria deserção); emprego civil **guardado** (Lei 4.375, art. 60) e perdido ao engajar |
| Sócio que não aparecia | Sócio era um id no negócio | Sócio com **parte**, ambiente de trabalho em Pessoas, conversa, divergência, compra da parte |
| Casa/carro sem uso | Bens eram patrimônio passivo | **Usos** do veículo e da casa, com custo e Linha da Vida |

## Arquitetura alterada

- `sistemas/compromissos.ts` (novo): `analisarEntrada` (o que conflita — tempo,
  lugar, regra), `planosDeConflito` (até três planos de aceitar + recusar),
  `propor` (`feito` / `pendente` / `perdido`), `resolverPendente`, `largar`
  (cada coisa largada vai para a Linha da Vida **com o motivo**).
  `conteudo/compromissos.ts`: a pergunta `comp_conflito`, opções com
  `consequencia` exibida **antes** da escolha. `CompromissoPendente.perguntado`
  evita tanto a pergunta perdida quanto o laço de pergunta.
- Motor de conteúdo: `Resultado.abrir` (uma decisão abre a seguinte),
  `Opcao.consequencia` → `Momento.opcoes[].detalhe`, `Retorno.mudancas` (o que
  mudou na vida durante um comando, mostrado no resultado).
- `dados/negocios.ts` + `sistemas/negocio.ts` (reescrito) + `sistemas/gestao.ts`
  (novo) + `conteudo/negocios.ts` (novo, ~25 acontecimentos/decisões por tipo).
- `dados/animais.ts` (14 espécies), `dados/partidos.ts` (30 partidos),
  `dados/clubes.ts` (clubes reais por cidade), `sistemas/usos.ts`,
  `conteudo/bens.ts`.
- `sistemas/coerencia.ts` (novo): varredura de estados impossíveis, usada nos
  testes e no simulador a cada ano.
- `save.ts`: v13, `migrarV12`, `exportarVida` / `importarVida`.

## Navegação antes/depois

| Antes | Depois |
| --- | --- |
| Vida · Você · Pessoas · Trabalho · **Rumo** · Casa · Tempo livre | Vida · Você · Pessoas · Trabalho · **Estudos** · Casa · Tempo livre · **Cidade** |
| "Rumo" misturava cursos, vagas e portas | **Estudos**: o que se estuda agora, portas que se abrem, catálogo de cursos por grande área |
| Trabalho: uma parede de ações | Trabalho em **camadas**: *A sua situação agora* → *Em paralelo* (negócio nas horas vagas, base, mandato) → *Outras possibilidades* (abas Vagas / Concursos / Negócio próprio / Outros caminhos) |
| "Pela cidade" dentro de Casa | **Cidade** (a partir dos 16): dados da cidade, imobiliária, concessionária, usados, motos, oficina, banco, abrigo, loja/criadouro de animais, autoescola, e *Mudar de cidade* com as consequências listadas antes |

Os catálogos grandes (200+ ocupações, dezenas de cursos) **não foram
reduzidos**: `ui/jogo/Catalogo.tsx` faz a descoberta — "Para você, agora" com o
motivo, busca, filtro "ao alcance", famílias recolhidas com contagem, o fora de
alcance mostrado quando se pede (com o motivo), detalhe no lugar.

## Conflitos de trajetória

Mecanismo único para base esportiva, contrato profissional, emprego (vaga,
concurso, convocação de cadastro reserva), abrir negócio, dedicar-se ao
negócio e serviço militar. Exemplos de planos:

- Faculdade × base: *Aceitar e trancar a faculdade de Direito* / *Aceitar e
  tentar dar conta dos dois* (se o curso não for integral nem em outra cidade)
  / *Recusar a base do Bahia*. Bio: "Trancou Direito para entrar na base do
  Bahia."
- Emprego × negócio: *manter o trabalho e tocar o negócio nas horas vagas* /
  *deixar o trabalho e se dedicar*.
- Concurso: *Tomar posse e deixar o trabalho de…* / *Não tomar posse*.
- Serviço militar: não há recusa (é obrigatório); estudante de medicina,
  farmácia, odontologia ou veterinária pode **pedir adiamento** (Lei 4.375,
  art. 29).
- Duas ofertas conflitantes no mesmo mês: a segunda passa, e fica dito por quê.
- Candidatar-se por conta própria não pergunta: quem se candidatou já escolheu
  trocar.

## Educação

Mudar de cidade **tranca** (não cancela) o curso presencial, com a vaga
guardada por até quatro anos, e isso é dito antes, na tela de mudança. EAD não
conflita. "Terminou o curso de qualificação: eletricista instalador (NR-10)"
(siglas preservadas); "Concluiu o mestrado" sem redundância.

## Trabalho

Três camadas, "Mais ações (N)" em vez da parede. Vínculo dito como é
("serviço militar inicial (obrigatório)", "praça de carreira", "carteira
assinada"). Esgotamento de quem é dono vira "Largar o dia a dia de…" (o negócio
segue nas horas vagas); de autônomo, "Parar de trabalhar por um tempo"; conscrito
não tem essa opção. Quem entra sem concurso não trabalha "na rede municipal".

## Esporte

Clubes **reais** da cidade ou da capital do estado (com artigo: "o Bahia",
"a Chapecoense"), porte do clube limitando o primeiro contrato, divisão
explicada com aviso de que é simplificação. A peneira nomeia o clube na Linha
da Vida. Atleta não é demitido em "corte de pessoal" (o contrato acaba na
renovação); negócio aberto por um atleta não substitui mais o contrato.

## Militar

Baseado na Lei 4.375/1964 (Serviço Militar), Lei 6.880/1980 (Estatuto dos
Militares), Lei 13.954/2019 e Decreto 12.154/2024 (serviço militar feminino
voluntário):

- 12 meses obrigatórios; conscrito não pode pedir para sair (deserção, CPM
  art. 187) — nem pela ação, nem pela decisão de esgotamento.
- Emprego civil guardado durante o serviço (art. 60); volta na baixa; engajar
  faz perder (a opção diz antes).
- Perspectivas visíveis: cumprir o serviço, engajar (temporário até oito
  anos), cabo, escola de sargentos (EsSA, 17–24 anos, ensino médio).
- Pai/mãe militar de carreira não "perde o emprego" (achado autônomo).

## Empresas

13 tipos, cada um com presença, estratégias próprias ("vende nas grandes
plataformas, com taxa alta e muito pedido" só existe para on-line), ações de
gestão próprias (lanchonete: aplicativos de entrega, cozinha nova, prato da
casa; oficina: elevador e scanner, injeção eletrônica; loja on-line:
logística, nicho; consultório: agenda on-line, parcerias com quem indica —
por ofício), tombos próprios (on-line não é assaltado no balcão; é golpe de
cartão clonado), acontecimentos próprios (algoritmo, viral, devoluções, Black
Friday; vizinho, aluguel, vigilância; fiado; frota; noiva; plantão; contrato;
chuva na obra; calote). Melhorias persistem e mudam o teto de movimento.

O prejuízo agora é explicado com honestidade: "não rendeu o que você tirou
para viver: R$ X dos R$ Y de retirada do ano voltaram para cobrir as contas" —
antes dizia "saíram do seu bolso" sem contar que a retirada já tinha saído do
caixa.

## Sócios

Parte do sócio (padrão 50%) divide o resultado e o valor; sócio convive no
ambiente do negócio (aparece em Pessoas como "sócio de…"); conversar, divergir,
sair, aporte; comprar a parte (preço pelo valor do negócio).

## Bens

Veículo: passear, pegar a estrada, corridas/entregas por aplicativo (vira
rotina com renda), personalizar, emprestar a quem pede. Casa: festa, receber
a família, decorar, reformar. Moto roubada com financiamento que continua
("(roubada)"). Moradia com identidade visual própria.

## Pets e exóticos

14 espécies com vida, custo, tempo de semana, espaço e origens legais.
Base legal pesquisada: Portaria IBAMA 93/1998 (anexo atualizado pela Portaria
2.489/2019) para domésticos; silvestres nativos só de criadouro autorizado,
com nota fiscal e marcação; Lei 9.605/1998, art. 29; Decreto 6.514/2008,
art. 24 (multa; entrega espontânea sem multa, §5º). Nenhum animal proibido
(primatas, serpentes, fauna ameaçada) está no catálogo legal. Oferta ilegal na
feira existe como escolha — com apreensão, multa e fim do vínculo; entregar por
conta própria é possível e sem multa. Restrições de moradia/clima (chinchila no
calor, papagaio em apartamento, cão grande em kitnet). O risco de morte é
relativo à expectativa da espécie e cresce a cada ano além dela.

## Política

30 partidos registrados no TSE (lista atual, com mudanças de 2025), texto
neutro com artigo certo ("filiou-se ao Mobiliza", "pela Rede"); saves antigos
com partido fictício continuam legíveis. Bandeira como decisão, troca custa
e fica registrada. Candidatura, apuração, derrota e mandato registrados sem
`undefined`.

## UI e contraste

Carta de decisão **escura** (tokens `--carta*`), consequência de cada opção
visível antes, resultado com "O que mudou na sua vida". Contraste auditado
(`scripts/playtest/contraste.mjs`, agora com a carta e o tom da Cidade): todos
os pares ≥ 4,5:1 (carta: 5,7–13,6:1). Escala de cinza e três daltonismos
simulados: sinais sempre com texto/forma além da cor. Teclado: foco preso na
carta (`aria-modal`), Tab entre opções, Enter escolhe, foco vai para o fechar.
Token `--papel-2` removido por engano e ainda usado foi restaurado (achado da
varredura de variáveis CSS indefinidas).

## Linha da Vida

Cada coisa largada tem motivo; recusas são registradas como escolha; o que
vem de fora (concurso, convocação) não é escrito como escolha. Achados na
leitura (corrigidos): laço anual "X saiu de casa / Sem os pais, foi morar com
X"; "aos 1 anos", "Foram 1 ano juntos"; "um hamster filhote, comprada";
"grávida de novo" quando o filho anterior era adotado; "Um escritório foi
vendida"; "sarau da escola" aos 22; "No quartel, começou a estudar" repetido;
"Deu baixa" depois de "voltou ao trabalho".

## Save e migração

`VERSAO_SAVE = 13`. `migrarV12`: dedicação do negócio inferida (dono no
emprego → integral; senão paralela — antes fecharia sozinho), melhorias,
estratégia válida para o tipo (a loja on-line com "online" vira "marca"),
parte do sócio 0,5, equipe/sócio no ambiente do negócio, bandeira inválida
removida, momento `neg_estrategia` obsoleto de loja on-line descartado.
A Linha da Vida não muda na migração. **Testado com saves v12 reais** gerados
pelo motor do Playtest #3 (`9518411`, via worktree):
`save-v12-loja-online.json`, `save-v12-politica.json`,
`save-v12-soldado.json` (gerador: `scripts/playtest/gerarSavesV12.ts`).

## Exportar e importar

Menu → Exportar vida (arquivo `.json` com envelope `{formato:'vida-save',
versao, exportadoEm, nome, vida}`) e Importar vida (início e menu), com
prévia (nome, idade, cidade) e confirmação antes de sobrescrever. Importação:
só `JSON.parse` e checagem de forma — nada é executado; limite de 12 MB;
recusa JSON inválido, lista, versão futura, vida terminada, falta do estado do
acaso; migra versões antigas. A semente e o estado do RNG vão junto: o futuro
de uma vida importada é o mesmo (testado).

## Testes

`fix3.test.ts` (54 testes), cobrindo os 30 pedidos e mais: faculdade × base
(pergunta, planos com consequência, trancar com motivo, recusa); trabalho ×
empresa (paralela/principal); trabalho × estudo (integral conflita, EAD não);
concurso com emprego; candidatura por conta própria; duas ofertas no mesmo
mês; pergunta pendente que não se perde nem prende; clube real; base visível;
conscrito não sai; emprego guardado; perspectivas militares; adiamento
MFDV; negócio paralelo sem retirada e sem fechamento; principal = emprego;
loja on-line sem texto físico; ações próprias de lanchonete e oficina; todo tipo
com presença e estratégias; sócio; prejuízo; esgotamento do dono; veículo;
casa; vida por espécie; gato de 4 anos; hamster velho; exótico legal;
restrição; entrega sem multa; bandeira nunca `undefined`; bandeira gravada;
partidos; candidatura e apuração; mudança avisa trancamento; exportar;
importar com futuro igual; importação recusa entradas ruins; migração de
saves v12 reais (três, com asserções por caso); vidas inteiras sem
`undefined`/`NaN` e sem pendência órfã; nada largado sem motivo; concordância
do bicho; laço do irmão; nenhuma repetição em sequência; e os sete testes dos
achados da auditoria independente (A1–A10, abaixo).

## Simulações

`scripts/sim/fix3.ts`: oito trajetórias × perfis de jogador (12 perfis de
`estrategias.ts`), até 85 anos, `verificarCoerencia` a cada ano.

- 48 vidas (primeira rodada): 0 incoerências; 52 perguntas de conflito.
- **200 vidas**: 223 perguntas de conflito (158 aberturas de negócio, 19
  posses, 9 aceites, 35 recusas…), 18 trancamentos com motivo, 74 recusas
  registradas, 0 pets mortos "de velhice" antes da idade, 18 vidas militares,
  10 mandatos. **1 incoerência**: um cachorro de 20 anos (risco fixo de 60% ao
  ano além da expectativa) → risco crescente a cada ano além dela.
- Ao longo: a varredura achou **negócio "integral" sem o dono trabalhando nele**
  (esgotamento do dono chamava "pedir demissão" do próprio negócio) →
  `encerrarEmprego` passa o negócio para as horas vagas, com registro, e a
  decisão de esgotamento ganhou texto de dono.
- Depois das correções da auditoria independente: **200 vidas, 0 incoerências,
  226 perguntas de conflito**.

## Biografias lidas

24 biografias completas (três por trajetória: paralelo, dono, atleta que
estuda, militar, bichos, política, bens, livre), comparando estado objetivo e o
que o jogador entenderia. Achados que viraram correção estão em *Linha da
Vida*, *Militar* e *Empresas*. O que se confirmou: trajetórias
compreensíveis, mudanças importantes comunicadas, o conflito pergunta, negócio
paralelo segue ao lado do emprego (inclusive depois de demissão), a política
conta derrotas e mandatos, bichos vivem o tempo da espécie, pessoas
continuam existindo.

## Playtest visual

`scripts/playtest/rework.mjs` atualizado para as abas novas e 20 cenários
(15 anteriores + pergunta de conflito aberta, negócio paralelo com sócia,
soldado, bichos, loja on-line), em **320, 390, 820 e 1440**: **654 telas, 0
problemas estruturais** (rolagem horizontal, botão fora da tela, CTA cobrindo
conteúdo, botão sem nome, alvo < 40 px, texto cortado). A carta de decisão é
medida e fotografada aberta. Cinza e daltonismo em negócio, loja on-line e
bichos. Inspeção das capturas achou e corrigiu: vínculo "carreira militar"
duplicado/contraditório no conscrito, "(você tem 0)", "Estar no balcão todo
dia" na loja on-line, manchete "A saúde vem cobrando: os anos, que começam a
cobrar" com saúde ótima.

## Problemas descobertos autonomamente

Além dos acima: atleta demitido em "corte de pessoal" na recessão; negócio
aberto por atleta substituía o contrato; mudança de cidade cancelava matrícula;
município inexistente de apreensão de silvestre quebraria `municipio()`
(trocado por saída do vínculo); rede pública para contratação sem concurso;
parente militar recontratado "como capitão"; referência de parcerias com "pet
shops" numa consultoria de TI; token CSS indefinido.

## Segunda auditoria independente

Feita por um agente separado, lendo o diff como quem não implementou, com a
missão de rejeitar o trabalho. Resultado e o que foi corrigido: ver a seção
*Auditoria independente — resultado* abaixo.

## Limitações restantes

- Divisões esportivas são simplificação (nível 1–4), dito na tela.
- Emprego guardado vale também para estágio (a lei fala de emprego; mantido
  por simplicidade).
- O prejuízo do negócio com retirada continua sendo modelado como devolução ao
  caixa; não há "reduzir a retirada" antecipado como ação.
- A estratégia de jogador do simulador repete ações (troca de bandeira todo
  ano, currículos iguais); a Linha da Vida registra — é escolha, mas pesa.
- Criação e Linha da Vida longa foram cobertas pelos roteiros anteriores
  (`capturas.mjs`), não rodados de novo nesta branch.

## Decisões de design tomadas

- Conflito **pergunta sempre** que algo já existente seria largado; nunca há
  mais de três planos de aceitar (legibilidade), e a recusa sempre existe
  quando a lei permite.
- Candidatura espontânea não pergunta (a escolha já foi feita).
- Negócio é **paralelo** por padrão quando nasce ao lado de um emprego; virar
  principal é decisão (e pergunta pelo emprego).
- Catálogos grandes ficam grandes; o trabalho foi de descoberta, não de corte.
- Partidos reais apresentados de forma neutra, sem posição ideológica
  atribuída; bandeira é do personagem, não do partido.
- Pets silvestres só como a lei permite; o ilegal existe como escolha
  com consequência, nunca como opção neutra de loja.

## Arquivos principais alterados

Motor: `sistemas/compromissos.ts`*, `conteudo/compromissos.ts`*,
`sistemas/negocio.ts`, `sistemas/gestao.ts`*, `dados/negocios.ts`*,
`conteudo/negocios.ts`*, `conteudo/profissao.ts`, `sistemas/profissao.ts`,
`sistemas/militar.ts`, `conteudo/caminhos.ts`, `sistemas/esporte.ts`,
`dados/clubes.ts`*, `sistemas/politica.ts`, `conteudo/politica.ts`,
`dados/partidos.ts`*, `sistemas/pets.ts`, `dados/animais.ts`*,
`sistemas/usos.ts`*, `conteudo/bens.ts`*, `sistemas/processos.ts`,
`sistemas/coerencia.ts`*, `sistemas/trabalho.ts`, `sistemas/familia.ts`,
`sistemas/luto.ts`, `conteudo/adulto.ts`, `acoes.ts`, `ano.ts`, `tipos.ts`,
`save.ts`. UI: `telas/Jogo.tsx`, `jogo/Trabalho.tsx`, `jogo/Estudos.tsx`
(ex-`Rumo.tsx`), `jogo/Cidade.tsx`*, `jogo/Catalogo.tsx`*, `jogo/Casa.tsx`,
`jogo/Momento.tsx`, `jogo/Tempo.tsx`, `jogo/material/Lugares.tsx`,
`avatar/Retrato.tsx`, `useVida.ts`, `tokens.css`, `vida.css`. Testes:
`__tests__/fix3.test.ts`*, fixtures v12*. Scripts: `sim/fix3.ts`*,
`playtest/gerarSavesV12.ts`*, `playtest/gerarRework.ts`,
`playtest/rework.mjs`, `playtest/contraste.mjs`. (\* = novo)

## Auditoria independente — resultado

Um agente separado leu o diff contra `9518411` sem ter implementado nada, com a
missão de rejeitar o trabalho, e reproduziu cada achado com um teste
temporário (já apagado). Achou **dez** problemas; todos foram corrigidos e
ganharam teste de regressão:

| # | Achado | Correção |
| --- | --- | --- |
| A1 | Conscrito saía do quartel **mudando de cidade** (ou se matriculando em outra cidade); o emprego guardado ficava órfão; militar de carreira e mandato também acabavam na mudança | `presoALugar`: mudança e matrícula fora da cidade bloqueadas para o serviço inicial (seria deserção), para a farda de carreira (muda-se por transferência) e para o mandato (renúncia antes); farda que acaba fora da baixa libera o emprego guardado, com registro |
| A2 | Conscrito largava o quartel por "Dedicar-se só ao negócio" (o caso montava o próprio conflito e pulava o bloqueio) | `analisarEntrada` impede **qualquer** trajetória nova durante o serviço inicial |
| A3 | Efetivação do temporário chamava `contratar` direto: trocava o emprego (até o de dono) em silêncio e escrevia como escolha | Efetivação passa por `propor`; aceitar temporário com trabalho é bloqueado |
| A4 | Matrícula em outra cidade não dizia o que ficava para trás | A via do curso lista `consequenciasDaMudanca` antes de "Tentar" |
| A5 | Save importado com escolha pendente malformada derrubava o jogo | `pendenteValido`: tipo na lista, ids que existem, planos com consequências; senão, a importação é recusada com motivo |
| A6 | Sócio morto continuava "tocando" o negócio (horas vagas, textos, painel) | `socioVivo`; a parte segue com a família, e o painel diz isso |
| A7 | "Fecha as portas" e "anos de portas abertas" na loja on-line | `fechaAs`: "sai do ar"; "anos no ar" |
| A8 | Concordância ("Lanchonete… seguiu aberto", "tocado", "vendido"), crase ("Dedicar-se de vez a Loja"), "Recusar Loja X", "A e B e C e outros", "A base" para equipe de vôlei, "nas mãos da equipe" sem equipe | `negocioFeminino`/`fem`, "à/ao", "Seguir como está", lista corrigida, rótulos por modalidade e por quem toca |
| A9 | "Parar (ou reduzir)" cuidar dos pais encerrava farda ou mandato com texto de "trabalho menor" | Opção diz reduzir *ou* parar conforme o caso, mostra a consequência e não existe para farda e mandato |
| A10 | A convocação militar podia virar "o prazo passou" diante de outra escolha em aberto no mesmo mês — e, no teste, a posse pendente sobrevivia para depois trocar a farda pelo cargo | A convocação tem precedência (a outra oferta passa, dito na Linha da Vida); `resolverPendente` reanalisa na hora e não larga nada se algo agora impede |

A auditoria não encontrou decisão de conflito com todas as opções bloqueadas
(toda oferta irrecusável tem ao menos um plano) nem `undefined` na bandeira.
Depois das correções: 393 testes, 200 vidas simuladas sem incoerência, 654
telas no playtest visual sem problema estrutural.

Limitação que fica, dita: matrícula em curso **integral na mesma cidade** ao
lado de um trabalho integral ainda não pergunta (a semana acusa o excesso, mas
não há plano de conflito); a próxima etapa natural é fazer a matrícula entrar
por `propor`.
