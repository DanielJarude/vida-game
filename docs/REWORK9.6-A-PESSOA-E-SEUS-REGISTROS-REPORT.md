# REWORK 9.6 — A PESSOA E SEUS REGISTROS

Atributos fundamentais, nascimento, Caminhos, correções do playtest e materialidade visual.

> A vida acontece; às vezes você decide. Cada pessoa nasce diferente, desenvolve capacidades diferentes e deixa
> registros próprios da vida que viveu.

---

## 1. Commits

| Commit | Fase |
|---|---|
| `f94c75a` | A, B e C — Caminhos em divisões e a vaga legível; nascimento sorteado; cinco atributos no motor e em Você |
| `8e8e4ed` | D — materialidade: certificados, currículo, ficha do atleta, prontuário, diário, álbum, planner, extrato, anúncio de jornal |
| (este) | E — simulações, auditoria visual, desempenho, montagens `docs/rework96/` e este relatório |

| | |
|---|---|
| Branch | `claude/fix-pos-rework3-playtest` |
| Commit-base | `4fceb06` — REWORK 9.5 · Fase D (presente e conferido; working tree só com `.claude/`) |
| Baseline | 1474/1475 testes (a única falha, `fechamentoMundo` #4, é o limite fixo de 60 s sob carga — conhecido desde o REWORK 9.5); `tsc` limpo |
| Save | **v20**, sem versão nova: os campos novos são opcionais (`predisposicoes.saude`, `predisposicoes.animo`, `Lesao.origem: 'briga'`) |

Sem merge na `main`, sem force push, sem deploy manual, APK não regenerado, segredos intocados, `.claude/` fora dos commits.

## 2. Causas reais dos bugs

| Código | O que o playtest viu | A causa encontrada |
|---|---|---|
| **UX-08** | Ao abrir uma vaga, cargo, salário, formação, compatibilidade, conflitos, lugar e botão se sobrepõem | Uma regra antiga `.vaga-camada { display: grid; grid-template-columns: minmax(0, 1fr) auto }` em `caminhos.css` — de um desenho de vaga anterior ao REWORK 4 — continuava valendo para o cartão novo (`VagaNaCamada`: um botão-resumo + o detalhe). Como `caminhos.css` é carregado com Caminhos (depois de `vivida.css`), a regra vencia: aberta, a vaga punha o detalhe numa coluna `auto` ao lado do resumo; um aviso longo faz a coluna `auto` crescer até o conteúdo máximo e a coluna do resumo (com o salário em `nowrap`) ir a zero — tudo transbordando por cima. Reproduzido no build da base com um save real (cidade e organização longas) e um aviso de conflito (`docs/rework96/01`). As auditorias anteriores "passavam" porque **nenhuma cena abria uma vaga**. |
| **NASC-01** | Nova vida começa sempre em Mulher · Brasil · Bahia · Salvador | Não era o sorteio: o estado inicial da tela `Criacao` era fixo (`useState('feminino')`, `useState('salvador-ba')`, nome sorteado para o Brasil). O "Tudo ao acaso" já sorteava no mundo. |
| **NASC-02** | "Tudo ao acaso" parece gerar mulheres demais | Testado com 10.000 sorteios: **49,45% mulheres, 50,55% homens** (z = −1,10; compatível com a política 50/50). A impressão vinha do estado inicial fixo em "Mulher". |
| **NASC-03** | Campos ocultos com valor da vida anterior | O "Tudo ao acaso" não zerava o tratamento e o "pode gestar" (escondidos fora de "não binária"); agora zera tudo, inclusive os atributos escolhidos. |
| **UX-09/10** | Caminhos extenso, estudo, vagas, concursos, política e esporte misturados | `PaginaCaminhos` desenhava, em cada parte (Agora/Desenvolvimento/Oportunidades/Histórico), os dois lados (`Estudos` e `Trabalho`) — e o Trabalho trazia dentro a política, os concursos, a base, o grupo, a carreira esportiva e artística. |
| Bug latente | (achado pelos testes) | `sucessao.ts`: `estabilidade: -tp.impulsividade / 100` gera `−0` quando o traço é 0; o JSON grava `0` e o reload deixava de ser idêntico. Corrigido na fonte. |

## 3. Arquitetura dos atributos

O motor **já tinha** os cinco valores e as três camadas (`sistemas/pessoa.ts`, REWORK 2); não foi criado um sistema
paralelo. O que mudou: duas predisposições novas, o nome único dos cinco em todas as telas, a criação com atributos, e
a integração causal onde ela faltava.

| Atributo | Fonte de verdade (condição atual) | Predisposição (estável, da semente ou escolhida) | Desenvolvimento |
|---|---|---|---|
| **Saúde** | `corpo.saude` | **constituição** `predisposicoes.saude` (nova) | hábitos, movimento, condições e tratamento, lesões e o cuidado, cabeça no limite, idade (`estado.fatoresSaude`) |
| **Físico** | `corpo.forma` | `predisposicoes.fisica` | o treino da semana com retornos decrescentes, trabalho pesado, lesões, cigarro, idade (`pessoa.fatoresCondicionamento`) |
| **Felicidade** | `mente.felicidade` | **temperamento** `predisposicoes.animo` (nova) | relações, família, trabalho, luto, dinheiro, lazer, a cabeça (`estado.fatoresHumor`) |
| **Beleza** | `corpo.aparencia` | `corpo.aparenciaBase` (os traços de nascença) | forma, saúde, cansaço, cuidado e o dinheiro para ele, cirurgia, anos (`pessoa.fatoresAparencia`) |
| **Inteligência** | `mente.cognicao` | `predisposicoes.cognitiva` | ler, estudar, escola, faculdade, xadrez, programação — devagar, com teto (`pessoa.fatoresAprendizado`) |

- Habilidades específicas (futebol, matemática, violão…) continuam nas **frentes** (`sistemas/frentes`): só a prática
  específica as desenvolve. Lesão é **condição** (em `corpo.condicoes`), separada da saúde geral e da técnica.
- Estresse (a cabeça), estado emocional, condições de saúde, habilidades e competências **não** viraram atributos:
  continuam em seções próprias de Você (a cabeça logo abaixo da ficha; saúde no prontuário; habilidades nas fichas).
- `sistemas/predisposicao.ts` ganhou `ATRIBUTOS`, `valorDoAtributo` (a leitura única), `predisposicoesDosAtributos`
  (escolhidos → predisposição) e `pesoDaAparenciaPara` (o gosto de cada pessoa). Sem números redundantes: nenhuma
  cópia dos atributos é guardada.

## 4. Fórmulas e limites

| Onde | Regra (REWORK 9.6) |
|---|---|
| Nascimento ao acaso | Saúde `86 + 8·constituição + 4·N(0,1) − 4 (família pobre) − 26 (nascimento frágil, ~2%, da semente)`, limitada a 30..99 · Físico `50 + 30·física` · Felicidade `72 + 14·temperamento` · Beleza `55 + 12·N(0,1)` · Inteligência `55 + 10·cognitiva + 9·N(0,1)`, 15..95. Predisposições: soma de dois sorteios uniformes (triangular, −1..1). Os sorteios saem do gerador na **mesma ordem de antes** (o visual, a saúde, a aparência, a cabeça): escolher os atributos não muda a família sorteada. |
| Nascimento escolhido | O valor é gravado **exatamente**; a predisposição sai dele: constituição `(S−86)/10`, física `(F−50)/30`, temperamento `(H−72)/14`, cognitiva `(I−55)/25`, todas limitadas a −1..1; Beleza vira `aparenciaBase`. Sem orçamento de pontos. |
| Físico sem treino | `piso(idade) + física × amplitude(idade)`; amplitude 30 até os 10, caindo até 12 aos 15 (a criança forte e a franzina; no adulto, quem treina é que se destaca). O treino continua respondendo mais rápido no corpo predisposto (`× (1 + 0,2·física)`). |
| Constituição | Desloca a saúde de referência de cada idade em `±6` (fator próprio "uma constituição forte/frágil", com a taxa de recuperação da idade) e o risco anual das doenças do corpo em `±25%` (as da cabeça não). |
| Temperamento | Fator de humor `7 × temperamento` (a partir de |0,15|); as relações, o luto, o trabalho e o dinheiro continuam pesando mais. |
| Inteligência e escola | A escola básica exercita a inteligência: estímulo 0,25 (0,35 com dedicação, 0,15 empurrando), com o teto e os retornos decrescentes de sempre (≈ +0,3/ano longe do teto). A nota continua sendo do domínio das matérias, da frequência, da dedicação e da casa (`escola.calcularDesempenho`, inalterado). |
| Trabalho | Antes, inteligência e aparência pesavam em toda candidatura. Agora: inteligência `/300` nos setores de raciocínio (tecnologia, saúde, jurídico, engenharia, finanças, educação, administrativo, comunicação) e `/900` nos demais; aparência `/500` só em comércio, beleza, comunicação e criativo; físico `/500` em obra, campo, logística, segurança, esporte e manutenção. Requisitos (formação, registro, experiência, teste físico) continuam os da ocupação. |
| Relacionamentos | O peso da aparência na química e no primeiro interesse é multiplicado pelo **gosto de quem olha** (0,2..1,6, da semente da pessoa). No máximo, a beleza 95 contra 50 vale menos que a compatibilidade. |
| Brigas | `lesoes.machucarNaBriga(intensidade)`: chance de machucar `[18%, 45%, 80%] − 0,3 × (físico−50)/100`; gravidade sorteada (deslocada pela intensidade e pelo físico); saúde −2/−4/−8 na hora; a lesão (`origem: 'briga'`, partes próprias: supercílio, nariz, costela, maxilar…) abre a decisão de cuidado — "procurar atendimento", "ficar em casa", "operar" ou "não procurar ninguém" — com a recuperação, o risco de piorar e a sequela de antes. Ligada a: o empurrão na escola (`ado_rival` · revidar), a briga com o irmão a partir dos 10, as duas brigas da prisão. |
| Envelhecimento | Sem declínio uniforme: saúde pela idade e pela constituição; físico pelo piso da idade, o teto e o treino; inteligência só a partir dos 72, reduzida por quem lê/estuda; beleza pelos anos depois dos 45 (até −8) e pelo resto; felicidade sem declínio pela idade. |

## 5. Regras de nascimento

- A tela Nascer **abre sorteada** — o mesmo `sortearNascimento` do botão (país com peso `população^0,3`, cidade pelo
  porte, gênero meio a meio, sobrenome e nome do lugar e da família, aparência pelos pais). "Não binária" só por
  escolha (política existente, mantida). Se, ao abrir, os pacotes do mundo ainda não chegaram e o jogador não mexeu em
  nada, a tela sorteia de novo quando o mundo chega.
- **Atributos iniciais**: "Ao acaso" mostra os valores que esta vida terá (a prévia é o mesmo `criarVida`); "Escolher"
  libera os cinco controles (0..100, partindo dos valores sorteados). "Tudo ao acaso" volta tudo ao acaso — e a tela diz
  isso. Não há travas; o texto comunica que o sorteio muda tudo.
- Cada atributo traz o que é e o que significa **ao nascer** (ponto de partida e predisposição; um bebê não é um
  adulto em miniatura). Na ficha de Você, até os 6 anos, a nota repete isso.

## 6. Distribuições das simulações

### 6.1 10.000 nascimentos ao acaso (`scripts/sim/nascimentos96.ts`, 1,18 ms cada)

- Gênero: **4.945 mulheres (49,45%) · 5.055 homens (50,55%)** — z = −1,10.
- 28 países vivíveis, todos sorteados; observado × esperado pelo peso: Índia 889 × 871, China 838 × 863, EUA 559 × 563,
  Nigéria 502 × 503, Brasil 502 × 489 … Uruguai 147 × 141; **qui-quadrado 17,7 com 27 graus de liberdade**.
- Brasil 5,02%; Bahia 20 (0,2%); **Salvador 6 (0,06%)**. 487 cidades distintas; a mais sorteada, Shenzhen, 1,01%; a
  combinação gênero·cidade mais repetida, 0,61%.
- Classes: trabalhadora 29,3% · média baixa 22,5% · média 19,9% · pobre 19,7% · alta 8,5%. Arranjo: pais juntos 62,5%,
  mãe solo 29,5%, avós 4,6%, pai solo 3,4%.
- **0 problemas de consistência** (cidade do país, nacionalidade = país natal, mãe registrada, atributos em 0..100, e,
  nas 300 primeiras, a prévia da tela = a vida criada, rosto e atributos).

| atributo ao nascer | média | desvio | p1 | p10 | p50 | p90 | p99 | mín | máx |
|---|---|---|---|---|---|---|---|---|---|
| Saúde | 84,6 | 6,5 | 59 | 78 | 85 | 92 | 97 | 45 | 99 |
| Físico | 50,1 | 12,2 | 24 | 34 | 50 | 67 | 76 | 21 | 80 |
| Felicidade | 72,0 | 5,7 | 60 | 64 | 72 | 80 | 84 | 58 | 86 |
| Beleza | 55,0 | 12,0 | 27 | 39 | 55 | 70 | 83 | 16 | 93 |
| Inteligência | 54,8 | 9,9 | 32 | 42 | 55 | 68 | 78 | 20 | 91 |

Nascimentos frágeis (saúde < 65): 1,66%. Antes, todo bebê nascia com felicidade 75 e físico entre 44 e 56.

### 6.2 População e pares (`scripts/sim/atributos96.ts`, 30 vidas por grupo, decisões pela primeira opção livre)

| idade | n | saúde | físico | felicidade | beleza | inteligência |
|---|---|---|---|---|---|---|
| 0 | 30 | 86,8 ± 5,8 | 51,1 ± 11,5 | 72,0 ± 4,5 | 53,8 ± 13,6 | 55,9 ± 10,2 |
| 10 | 30 | 90,6 ± 3,4 | 48,5 ± 11,2 | 63,6 ± 4,5 | 53,8 ± 13,6 | 57,1 ± 9,9 |
| 18 | 30 | 88,4 ± 2,7 | 33,7 ± 5,2 | 63,3 ± 4,8 | 52,1 ± 13,8 | 60,1 ± 9,3 |
| 30 | 30 | 81,9 ± 4,5 | 31,3 ± 5,5 | 45,3 ± 9,6 | 51,2 ± 13,5 | 60,2 ± 9,3 |
| 50 | 29 | 61,1 ± 13,8 | 28,0 ± 6,3 | 33,7 ± 13,1 | 49,2 ± 13,9 | 60,3 ± 9,1 |
| 70 | 11 | 42,6 ± 17,8 | 17,9 ± 7,1 | 38,3 ± 17,1 | 39,9 ± 15,2 | 62,1 ± 7,6 |

O espalhamento cresce com a idade (a vida diferencia). A felicidade média adulta baixa e o físico baixo são da
**política de decisões da simulação** (primeira opção livre, sem treino escolhido) — vidas jogadas fazem escolhas;
ver §20.

## 7. Integração com educação

Pares de vidas iguais (mesma semente) que só diferem na inteligência ao nascer e na dedicação, vividas de verdade dos
8 aos 16 anos:

| inteligência ao nascer | dedicação | desempenho escolar médio (8–16) | desvio entre vidas |
|---|---|---|---|
| 30 | com dedicação | **53,5** | 7,9 |
| 30 | empurrando | 28,0 | 7,3 |
| 80 | com dedicação | 79,0 | 8,3 |
| 80 | empurrando | **52,7** | 8,2 |

A inteligência pesa (≈ 25 pontos entre 30 e 80) e a dedicação pesa o mesmo (≈ 25 pontos). **A aluna de inteligência 30
e dedicada supera a de inteligência 80 que empurra em 23 de 30 pares.** Nenhum teto rígido; a nota continua sendo do
domínio das matérias, da frequência e da casa. Teste: "inteligência ajuda a aprender, mas não substitui o estudo".

## 8. Integração com esportes

| físico ao nascer | futebol dos 6 aos 16 | físico aos 16 | técnica de futebol aos 16 |
|---|---|---|---|
| 20 | treina 2×/semana | 48,1 | **56,8** |
| 20 | não joga | 20,7 | 0,0 |
| 85 | treina 2×/semana | 88,0 | 72,2 |
| 85 | não joga | 50,7 | **0,0** |

Físico alto sem treino não ensina futebol (técnica 0); o franzino que treina joga (56,8). O físico amplia o que o treino
rende (72,2 contra 56,8, treinando igual) — influência, não substituição. Lesão tira dos treinos e pesa na saúde, sem
apagar a técnica (teste "a lesão não apaga a técnica").

## 9. Integração com saúde

- **Ciclo**: acontecimento (doença com sinais, lesão no esporte/trabalho, briga) → sintomas/condição (sinais sem nome,
  condição com nome, lesão com prazo) → decisão (ir ao médico; o cuidado da lesão: repousar, fisioterapia/atendimento,
  operar, seguir assim) → evolução (diagnóstico, tratamento pelo plano, rede pública ou bolso — `saude.redeDeSaude`,
  por país; prazos que dependem do cuidado) → consequência (peso na saúde, recaídas, sequela).
- Constituição, pares iguais com saúde ao nascer 62 × 98: **saúde aos 50: 56,5 × 68,3**; aos 65: 36,0 × 43,0; crônicas
  aos 65: 2,0 × 2,1; idade ao morrer: 67,3 × 68,3. A constituição muda o caminho; não decide a vida (§20).
- Testes: o saudável que adoece (a condição pesa; tratada, pesa menos); o lesionado que procura atendimento × que não
  procura (peso, prazo, recaídas em 40 anos simulados); o risco de hipertensão menor na constituição forte.
- **Brigas** (1.000 de cada intensidade, adulto de físico mediano):

| intensidade | machucou | leve | séria | grave | saúde perdida (média) |
|---|---|---|---|---|---|
| 1 · empurra-empurra | 17,9% | 160 | 19 | 0 | 0,4 |
| 2 · briga de verdade | 46,5% | 258 | 168 | 39 | 2,0 |
| 3 · violência séria | 79,7% | 215 | 265 | 317 | 4,2 |

## 10. Integração com profissões

Teste "o trabalho usa cada atributo onde ele é pedido": a mesma pessoa com inteligência 85 ganha mais chance no
auxiliar administrativo do que no ajudante de obras; com físico 85, o contrário. Nenhuma profissão ficou inacessível
por um atributo: os bloqueios continuam sendo os requisitos explícitos (formação, registro, experiência, o teste físico
e a inspeção de saúde das carreiras de farda, que já existiam). Militar, técnico, acadêmico, artístico e esportivo
continuam com requisitos próprios — nenhuma associação entre inteligência baixa e trabalho manual ou militar.

## 11. Integração com relacionamentos

O gosto de cada pessoa (`pesoDaAparenciaPara`) multiplica o peso da aparência na química do encontro e no primeiro
interesse: para uns quase nada (0,2), para outros um pouco mais (1,6). A compatibilidade, a personalidade, a história
compartilhada e as decisões dos NPCs continuam decidindo. A felicidade continua pesando no jeito com as pessoas e nas
brigas em casa (o que já existia), sem regra nova.

## 12. Migração de saves

- Save **v20**, sem versão nova. `predisposicoes.saude` e `predisposicoes.animo` são opcionais: num save anterior, a
  leitura (`predisposicao(v, 'saude' | 'animo')`) devolve **0 — neutra**, sempre a mesma, sem sorteio no carregamento e
  sem reescrever a história ("a vida que já existia não ganha, ao ser aberta, um traço que nunca teve"). Os cinco
  valores, a biografia e as condições não são tocados.
- `Lesao.origem` aceita `'briga'` (só aparece em lesões novas).
- Testes: um save sem os dois campos abre, mantém os valores e a biografia e é idêntico ao reabrir; a vida nascida com
  atributos escolhidos sai igual de salvar/abrir. A auditoria visual abre saves gerados pelos REWORKs 6, 7, 8, 9 e 9.5.

## 13. Correções de Caminhos

- **A vaga**: `VagaNaCamada` mostra o resumo e, aberto, o **anúncio** (`FichaDaVaga`), uma coluna só: tipo e setor,
  cargo, organização (quando o motor tem uma), lugar; remuneração, contrato e jornada; **requisitos um por linha** com
  ✓/✗ (`trabalho.requisitosDaVaga`, as mesmas contas da elegibilidade); você diante da vaga (o porquê e o currículo);
  conflitos; próximos passos; o **estado** — aberta · aberta com conflito · não atende · candidatura enviada · seleção
  em andamento · contratado · recusado (com o motivo da seleção) — e o botão. O catálogo completo ganhou os requisitos
  também. Nada inventado: sem horário nem empregador quando o motor não tem.
- **A página inicial** de Caminhos: a fase, o que ocupa a vida agora (cada coisa leva à sua divisão), a rotina, **o
  próximo passo** (a procura, a promoção, o boletim, o curso) e as **quatro entradas** com o estado de cada uma, na
  ordem da fase da vida (criança: Estudos primeiro; quem procura: Trabalho; político ou servidor: Vida pública; base,
  atleta ou artista: Outros caminhos). Nenhuma divisão some.
- **As divisões**: Estudos (Agora · Boletim · Cursos · Histórico) e Trabalho (Agora · Desempenho · Vagas · Currículo)
  com as partes de sempre, só do seu lado; **Vida pública** (o painel político, as ações políticas, os concursos e os
  editais, as carreiras públicas e de farda); **Outros caminhos** (as portas do esporte e da arte, a base, o grupo, o
  que está em construção, a carreira de atleta e de técnico, o currículo artístico). O Trabalho, na divisão, só aponta
  para lá ("Concursos e política ficam em Vida pública. Ir para Vida pública →").
- **Ligações** em vez de repetição: o técnico concluído aponta para as vagas; a vaga sem formação, para os cursos.
- Navegação: a divisão aberta e a parte aberta de cada divisão ficam guardadas; tocar em Caminhos dentro de Caminhos
  volta ao início. Os destinos antigos (`estudos`, `trabalho`, `cursos`, `vagas`, `negocio`, `concursos`) chegam ao lugar
  novo; três intenções novas no mapa (prestar concurso, carreira no esporte/arte, ver o boletim).

## 14. Exemplos dos novos documentos

| Área | Objeto | O que tem (só dados do motor) |
|---|---|---|
| Caminhos · Estudos | **Boletim** em papel | Brasão e timbre da escola (rede, ano), "Boletim escolar" em versalete, os campos do aluno sobre a linha pontilhada, a tabela impressa, os **domínios escritos à mão** (caneta azul; vermelha quando abaixo do esperado para a série), o desempenho do ano à mão, carimbo da secretaria com o ano e rubrica da coordenação (enfeites de papel, `aria-hidden`, sem dado inventado). Antes de 2000, papel amarelado. |
| Caminhos · Estudos | **Certificados** | Cada formação concluída: o tipo (certificado, diploma de técnico, diploma, pós), o curso, o nível e a instituição, o ano à mão, moldura dupla. |
| Caminhos · Trabalho | **Anúncio** de jornal e **currículo** | O classificado (papel de jornal, faixa dupla); o currículo com nome, idade, cidade e formação no alto e a experiência embaixo. |
| Outros caminhos | **Ficha do atleta** | O cabeçalho de ficha com o nome; títulos, finais, prêmios, a seleção, clube a clube (as competições são do REWORK 10). |
| Você | **Ficha de atributos** e **prontuário** | A folha de registro com os cinco valores à mão; a saúde como prontuário pautado (sinais e condições com nome). |
| História | **Diário** | A primeira página pautada com a margem vermelha; o ano de cada entrada escrito à mão; os rostos como fotos com borda. |
| Pessoas | **Álbum** | Fita adesiva em cada foto, cada uma num ângulo levemente diferente. |
| Minha Semana | **Planner** | A folha da semana; as notas da agenda no papel. |
| Vida | **Extrato** | Papel de bobina com a borda serrilhada. |
| Redes | Celular | Sem papel (continua app). |

O material é um **sistema** pequeno em `registros.css`: `.papel` (grão SVG de 1 kB, borda, canto dobrado),
`.papel--pautado/--antigo/--jornal`, `.manuscrito` (Caveat, OFL, servida pelo jogo), `.carimbo`, `.rubrica`,
`.campo-impresso` — com tokens `--mat-*` para a luz clara e a escura (no escuro, a folha é papel sob luz baixa e a caneta
clareia). Texto continua texto: selecionável, responsivo, atualizado pelo estado. Caligrafia só em valores curtos.

## 15. Capturas antes/depois

`docs/rework96/` — montagens das capturas **reais** do jogo, com os mesmos saves no build da base e no novo:

| Arquivo | O que mostra |
|---|---|
| `01-vaga-antes-depois.jpg` | A vaga aberta: antes com o conteúdo do save (a grade velha apertando o resumo) e com um aviso longo (a sobreposição do playtest) × o anúncio |
| `02-vaga-celular.jpg` | A vaga no celular; nome e cidade longos com quatro vagas abertas |
| `03-anuncio.jpg` | O anúncio inteiro, claro e escuro |
| `04-caminhos-inicio.jpg` | Caminhos antes × a página inicial (aos 17 e na infância) |
| `05-divisoes.jpg` | Estudos · Cursos, Trabalho · Agora, Vida pública, Outros caminhos |
| `06-nascer.jpg` | Nascer antes (Mulher · Salvador) × sorteado, com os atributos iniciais |
| `07-voce.jpg` | Você antes (Bem-estar, Cabeça, Saúde) × a ficha de atributos |
| `08-boletim.jpg` | O boletim antes × em papel (claro e escuro) |
| `09-documentos.jpg`, `10-areas.jpg` | Certificado, currículo, ficha do atleta, prontuário; diário, álbum, planner, extrato |
| `11-paletas-boletim.jpg`, `12-paletas-atributos.jpg` | As quatro paletas |
| `13-tamanhos.jpg` | 820 px, 360 px e 390 × 560 |

## 16. Resultados de testes

| | |
|---|---|
| Suíte completa final | **87 arquivos, 1506 testes, todos passando** (346 s; Node 22; cópia em disco Linux; `--maxWorkers=3`; nada mais rodando) — baseline era 1475 |
| `tsc --noEmit` | limpo |
| Testes novos | `src/motor/__tests__/rework96.test.ts` (16: atributos escolhidos gravados exatamente e família igual; leque ao acaso; sorteio 50/50 e Salvador raro; save/load; migração; inteligência × dedicação; escola e inteligência; físico × técnica; constituição; doença e tratamento; lesão com e sem atendimento; briga; felicidade × dinheiro; beleza × química; atributos por setor; envelhecimento) · `src/ui/__tests__/rework96.test.tsx` (15: a grade da vaga não volta; requisitos; anúncio; estados da candidatura; anúncio abaixo do resumo; página inicial; ordem das divisões; Estudos × Trabalho; Nascer sorteado; atributos escolhidos chegam a Nascer; "Tudo ao acaso" zera; ficha de atributos; boletim em papel; documentos; tokens do escuro e fonte local) |
| Testes reescritos | Onde afirmavam a estrutura anterior de Caminhos (`navegacao`, `rework9`, `rework95`, `rework9Integracao`, `interface`, `trajetorias`) ou a seção "Corpo e aprendizado"/"Bem-estar" (`rework2`, `rework6`, `rework7`, `riquezaCondicionamento`) — conferindo o mesmo, no lugar novo. Onde dependiam de uma semente deslocada pela integração (`fix4`, `rework2`, `rework2fecho`, `rework4`, `rework7`), a pré-condição passou a ser dita no teste; em `rework2fecho`, o limite "1,2× a primeira interação" (frágil a um sorteio baixo) virou o teste direto do fator decrescente. |

### 16.1 Execução final

| | |
|---|---|
| Suíte completa | 1506/1506 (antes do commit das Fases A–C: 1503/1503) |
| `tsc --noEmit` | limpo |
| `npm run build` | ok; maior pacote 774,08 kB (< 800) |
| `npm run build:itch` + `smoke:itch` | **21/21** |
| `scripts/pwa/offline.mjs` | **36/36** (instala, joga offline, recarrega, quatro paletas persistem, atualização de versão sem perder a vida — a fonte manuscrita entra no precache) |
| Auditoria visual (`rework96.mjs`) | **460 capturas** (23 cenas × 4 paletas × 1440, 820, 390, 360 e 390×560): **0 problemas** — sem texto sobre texto, sem rolagem horizontal, nada estourando a borda, o "Viver mais um ano" sempre visível e clicável, contraste ≥ 3:1 em 1440 e 390. Cenas novas abrem o que as anteriores não abriam: a vaga (uma e quatro, com nome, organização e cidade longos, conflito e requisitos múltiplos), os atributos abertos, o bebê com atributos extremos, o prontuário com quatro condições e uma lesão, a briga, o currículo longo, os certificados, a tela Nascer em "Escolher". Zoom de navegador: 1440 px a 200% equivale à janela de 720 px — coberta por 820 e 390. Teclado: as divisões, as partes e os atributos são botões, abas e `<details>` (testado em jsdom). |
| Simulações | `nascimentos96.ts` (§6.1), `atributos96.ts` (§6.2–9), `tamanho75.ts` (§17) |

A última rodada da suíte achou um problema real meu: as regras de material para o diário, o planner e as notas da
agenda redefiniam classes-raiz de `objetos.css` noutro arquivo (a auditoria de CSS do FIX pós-playtest humano proíbe);
passaram a refinar sob `main`, sem redefinir.

## 17. Performance

Clique → tela nova com o layout calculado (mediana de 5, ms, 1440 px, `desempenho96.mjs`, mesmos saves nos dois builds):

| Save | Caminhos (abrir) | a procura (Oportunidades → Trabalho · Vagas) | Você | Minha Semana | História |
|---|---|---|---|---|---|
| empregado | 10,2 → **7,0** | 14,5 → **6,4** | 20,7 → 18,0 | 11,4 → 10,1 | 20,3 → 17,3 |
| técnico, 17 | 9,1 → **5,5** | 12,4 → **5,7** | 17,2 → 16,1 | 7,1 → 6,9 | 16,8 → 21,5 |
| dedicada, 10 | 8,3 → **4,3** | 2,9 → 2,3 | 12,7 → 12,8 | 10,7 → 10,1 | 11,7 → 11,9 |

Trocar de divisão (depois): Estudos 4,5–8,6 · Trabalho 2,8–3,2 · Vida pública 1,7–5,1 · Outros caminhos 3,1–3,9 ·
Início 2,8–4,0. A página inicial é mais leve que a "Agora" de antes; a procura de trabalho ficou ~2× mais rápida (a
divisão não monta mais a política e as outras trajetórias junto com as vagas). Uma medida do meu script estava errada
na primeira rodada (a divisão lembrava a aba "Vagas" e o clique não mudava nada: 1,7 ms) — corrigida e medida de novo.

- Motor: **5,3 → 5,4 ms por ano** (20 vidas até os 75, `tamanho75.ts`); save médio 101,5 → 103,7 kB (vidas diferentes —
  195 entradas e 26 pessoas em média, contra 192 e 25 — mais os dois campos de predisposição).
- Memória (heap JS depois de visitar as seis áreas três vezes): 16,3 → 16,2 MB e 15,8 → 16,7 MB.
- Nenhuma dependência de código nova. A única dependência nova é a fonte `@fontsource-variable/caveat` (OFL), ~108 kB de
  woff2 no precache (latin + latin-ext), carregada só quando um documento a usa (`unicode-range`).

## 18. Bundle

| Pacote | Base (4fceb06) | Depois | |
|---|---|---|---|
| `motor` | 770,70 kB | **774,08 kB** | +3,4 kB (requisitos da vaga, briga, constituição, temperamento, piso físico, setores) |
| `motor-textos` | 737,66 kB | 738,00 kB | + |
| `motor-vida` | 149,63 kB | 149,58 kB | = |
| `Jogo` | 517,92 kB | 542,39 kB | +24,5 kB (página de Caminhos e divisões, anúncio, ficha de atributos, Nascer) |
| CSS | 217,65 kB | 243,25 kB | +25,6 kB (`registros.css`) |

Maior pacote: **774,08 kB** (limite de 800 kB intacto, não alterado). Folga do `motor`: ~26 kB.

## 19. Pendências

- **Brigas de adulto**: as brigas existentes (escola, irmão, prisão) machucam; não foi criado um acontecimento novo de
  briga adulta (mudaria a seleção de conteúdo de todas as vidas). Fica para quando houver uma cena com motivo real.
- **Concursos de inscrição**: o estado "enviada/em andamento/contratado/recusado" vale para as vagas de emprego e o
  trabalho por conta; o concurso tem o seu ("Inscrição feita · resultado no próximo ano"), em Vida pública.
- **Assinatura e carimbo** são os mesmos em todos os boletins (um traço original); variações por país e época ficaram
  no papel (amarelado antes de 2000) e no brasão (público × particular).
- **Teste em aparelho real e APK**: não feitos; o APK não foi regenerado (como pedido).
- O bloco de trajeto curto da agenda (< 32 px), pendência dos REWORKs 9 e 9.5, não foi atacado.

## 20. Riscos e limitações

- **Sementes deslocadas**: a integração muda o caminho de vidas com a mesma semente (o físico na infância, a escola
  na inteligência, a constituição, o temperamento, as brigas). Cinco testes antigos precisaram dizer a pré-condição;
  quem guarda sementes para reproduzir uma vida vê outra vida a partir deste pacote.
- **A felicidade média adulta da simulação é baixa** (45 aos 30, 34 aos 50) e a saúde aos 70 também (43): é a política
  da simulação (a primeira opção livre em toda decisão, ninguém escolhe treinar nem cuidar) somada ao motor de antes; o
  temperamento (±7) não é a causa. Vale uma calibração própria num pacote futuro, com vidas jogadas.
- **A constituição muda pouco a longevidade** (+1 ano na média entre os extremos): o risco de doença é ±25% e a idade
  continua dominando. É intencional (sem determinismo genético), mas pode parecer fraco a quem escolher "Saúde 100".
- **Físico escolhido alto num bebê** tende ao natural daquela predisposição (até ~80 na infância, ~44 no adulto sem
  treino): o número escolhido é o ponto de partida, e a tela diz isso.
- **Beleza** continua influindo um pouco no primeiro interesse e nas vagas de atendimento — moderado e dito na ficha
  ("não mede o valor de ninguém e não garante nada").
- A auditoria de contraste ignora gradientes e o grão do papel (mede a cor de fundo); os textos dos documentos usam
  tinta de impressão sobre papel com contraste alto nas quatro paletas.
