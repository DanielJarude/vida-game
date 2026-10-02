# Pacote pré-América do Sul: correções do playtest e sucessão

- **Base:** `7cdeace`, na branch `claude/fix-pos-rework3-playtest`. Não houve merge em `main` nem deploy manual.
- **Save:** **v19**, com migração v18 → v19 (seção 14).
- **Fora do escopo, de propósito:** América do Sul, ATT4, ATT5 e a simulação final de 1.000 vidas.

> "A morte encerra uma vida, mas não precisa encerrar a família." E, em todo o pacote: não basta implementar, tem que conectar.

## Resumo

| Frente | Antes | Agora |
| --- | --- | --- |
| A1 · dinheiro | A tela mostrava ~R$ 14 mil de sobra por mês e "Na conta" ficava em R$ 0 | Cada ano tem um **extrato** que fecha real por real: em ~4.000 anos simulados, 0 diferenças |
| A2 · riqueza e trabalho | R$ 89 mi e "procurar trabalho há tanto tempo" pesando na cabeça | Ocupação, situação econômica e **intenção profissional** são coisas separadas, com fonte única |
| A3 · condicionamento | O texto mostrava "+ o futebol;" e a tendência não dizia a causa | A frase é montada na fonte; a tendência é a mudança medida, e as causas listadas vão no mesmo sentido |
| A4 · política | "Entra no último ano" fora do último ano | O calendário do mandato é uma função só, lida pelo motor, pelos textos e pela tela |
| B · Career Moments | Futebol: 0,17 momento por ano, até 19 anos de silêncio. Política: primeiro momento no ano 19 | Futebol 0,28/ano e silêncio máximo de 8 anos. Política 0,24/ano, primeiro momento no ano 2. Com consequências reais |
| C · técnico | Um emprego com outro nome | Uma carreira com passagens, temporadas jogo a jogo, V/E/D, títulos, acessos, demissões, propostas, momentos próprios e seleção |
| D · viagens | Uma lista com todas as combinações de destino × duração | Fluxo em etapas (país → cidade → duração → resumo → confirmar); o bloqueio aparece uma vez |
| E · visuais | Aviões pareciam variações de linhas; cão e gato eram o mesmo molde | Cinco famílias de avião, jet ski próprio, cães e gatos com morfologia própria |
| F · iconografia | Só texto | 13 glifos vetoriais originais, com registro por família de carreira |
| G · sucessão | A morte encerrava o jogo | Encerrar a história **ou** continuar com um filho ou filha que **já existia**, com partilha pela regra do país |

### Validação

| Verificação | Resultado |
| --- | --- |
| Suíte completa, Node 22.23.2 | **972 testes em 52 arquivos, todos passando**. Na rodada completa final, 51 arquivos (958 testes) passaram, e o worker do `interface.test.tsx` não subiu (o timeout conhecido do WSL). Rodado isolado: 14/14 |
| Typecheck (`tsc --noEmit`) | Limpo |
| Build (`npm run build:itch`) | Sem aviso de tamanho. O limite de 800 kB **não** foi aumentado |
| Smoke itch.io | **18/18** |
| Capturas | 24, em 1440, 820 e 390 px. Nenhuma rolagem horizontal, nenhum erro de página |

## 1. Bugs encontrados e causas

| Bug | Causa | Onde |
| --- | --- | --- |
| Conta em R$ 0 com sobra positiva | O custo anual do circuito de tênis (treinador, viagens, hotel, inscrições: R$ 260–480 mil) saía da conta no passo do esporte. Ficava fora do orçamento e fora do registro do ano. O fechamento ia ao vermelho e `cobrirRombo` cobria com as aplicações sem dizer nada | `esporte.ts` (`anoDeCircuito`) |
| A sobra inteira desaparecia | O "efeito riqueza" (viagens e reformas que o patrimônio permite) era gasto no fechamento, fora do orçamento, com teto "conta + sobra do ano". Zerava a conta todo ano | `dinheiro.ts` (`processarDinheiro`) |
| Dinheiro criado do nada | `cobrirRombo` zerava o saldo negativo e ainda somava a ajuda da família: o mesmo buraco era coberto duas vezes | `dinheiro.ts` |
| Saldo negativo aparecia como R$ 0 | `Math.max(0, conta)` na tela | `Dinheiro.tsx` |
| Rico penalizado por "procurar trabalho" | O fator da cabeça disparava para qualquer adulto com `desempregadoDesde` há 12 meses ou mais, sem perguntar se a pessoa queria trabalhar | `estado.ts`; também `trabalho.ts`, `iniciativas.ts`, `ilicito.ts`, `romance.ts` e o evento `des_longo` |
| Fragmento "+ o futebol;" | A frase era montada na interface com sinais e `join('; ')` | `Voce.tsx` |
| "Vem piorando" na base | O piso de forma caía de 48 para 32 num degrau aos 12 anos. O corte do treino por lesão só valia para profissionais. A lesão já curada sumia dos fatores enquanto a queda ainda estava na janela | `pessoa.ts`, `lesoes.ts` |
| "Último ano" fora do último ano | `pol_eleicao` imprimia a frase sempre que havia mandato. O motor abre a pergunta também em eleição no meio do mandato e quando o aniversário cai antes do último ano | `conteudo/politica.ts` |
| Quase nenhum Career Moment | Só cabe uma decisão por ano: renovação e lesão tomavam o lugar de ~25% dos momentos sorteados. A política só tinha momentos durante o mandato | `situacoes.ts` |
| Garoto de 13 anos com "os anos, que começam a cobrar" | Abaixo dos 35, a saúde acima do nível natural tende a voltar a ele (efeito negativo), mas o texto escolhido era o do envelhecimento. Achado na captura de tela | `estado.ts` (`fatoresSaude`) |
| Adulta de 26 anos na casa dos pais, com R$ 418, "vivendo do que juntou" | Para quem mora com a família, a despesa própria quase não existe (piso de R$ 1), e `seguranca` dava "folgado" ("Dinheiro deixou de ser a preocupação") com trocados. A nova intenção profissional lê essa régua. Achado pela suíte final (`interface.test.tsx`) | `dinheiro.ts` (`seguranca`): a régua de "o guardado paga a vida" passa a ser, no mínimo, o custo de viver por conta própria na cidade. Teste de regressão |
| Bicho do abrigo mudava de cara ao ser adotado | A adoção cria um id novo, e o desenho saía do id | `pets.ts`; agora `InfoPet.semente` guarda o id do abrigo |
| Save de vida morta ofertado como "Continuar a vida de Bento, 78 anos" | O início não sabia que a vida tinha terminado | `useVida.ts`, `Inicio.tsx`: agora diz "Voltar ao legado de Bento" |

## 2. Economia

**O extrato** (`sistemas/extrato.ts`, novo) é a regra contábil: `saldo inicial + linhas = saldo final`, na conta **e** nas aplicações.

- Um aporte lança −conta e +aplicado; uma valorização lança só +aplicado.
- Quem move dinheiro lança a linha (`lancar`).
- O que se moveu sem linha vira linha com rótulo de quem conferiu (`conferir`). Nunca há diferença silenciosa.
- O fechamento confere o próprio trabalho. Uma sobra viraria linha de "ajuste", e os testes proíbem que ela exista.

O que entra no extrato:

- `processarDinheiro` lança cada linha do orçamento ×12, os rendimentos, a inflação (o dinheiro parado perde ~4,5% ao ano, em reais de hoje), os atrasos, o cartão, o empréstimo e cada cobertura de falta.
- `executar` (as ações) confere antes e depois de cada ação.
- A rescisão (FGTS, multa, seguro-desemprego) tem linha.
- A herança tem linha, tanto a de pais NPC quanto a da sucessão.

Outras mudanças:

- O efeito riqueza virou a linha do orçamento mensal "Viagens, reformas e presentes que o patrimônio permite" (`gastoDoPatrimonio`), e nunca leva mais que metade da sobra.
- O circuito do tenista virou a linha mensal "Circuito: treinador, viagens, hotel e inscrições".

**Hipóteses descartadas:**

- Aplicação automática da sobra: não existe. Só a ação `investir` aplica, e a tela agora diz isso.
- Renda do parceiro, da família, pensões e negócio: entram certas.
- Dividendos: contados uma vez.
- Impostos: saem dentro de `remuneracaoDe`.

**Definições de renda.**

- "Seu, por mês" é `rendaPropriaMensal`.
- "Entra" é `orcamento.renda`: inclui a parceria, a família e a pensão.
- As duas saem de `dinheiro.ts`.
- O prêmio do tenista aparece bruto em Trabalho e líquido em Dinheiro: é coerente, mas os rótulos são diferentes (pendência 3).

**Tela.**

- "Na conta" mostra o negativo, "(no vermelho)".
- Um bloco recolhível, "A conta de {ano}: começou com X, terminou com Y", agrupa as linhas por tipo.
- O texto das aplicações foi corrigido: numa compra, o jogo pergunta antes de usar as aplicações; num ano que fecha no vermelho, usa sozinho.

## 3. Trabalho e riqueza

`sistemas/intencao.ts` (novo) separa **ocupação ≠ situação econômica ≠ intenção profissional**.

- `patrimonioPagaAVida(v)` usa o mesmo teste da tela de patrimônio (`seguranca(v).nivel === 'folgado'`): as duas telas não podem discordar.
- `querTrabalhar(v)`:
  - a intenção declarada vale, mas uma declaração anterior ao último emprego não conta;
  - sem declaração, a resposta é "não" se o patrimônio paga a vida e "sim" se não paga. Quem é pobre continua sob pressão.
- `intencaoProfissional(v)` devolve `procurando`, `sem_procurar` ou `nao_se_aplica`.
- **Riqueza não apaga frustração.** Um rico que declarou querer trabalhar (ou mandou currículo) e segue 12 meses sem conseguir sente "querer voltar a trabalhar e não conseguir".
- Quem não procura e passa 24 meses ou mais sem estudo nem atividade com sentido sente, levemente, "os dias sem um projeto".
- **Ação nova:** "Parar de procurar: viver do que juntou" e "Voltar a procurar trabalho". Parar exige reserva `folgado` ou `seguro`. Mandar currículo conta como declarar intenção.
- Trabalho, Dinheiro e Cabeça leem a mesma fonte. Exemplo: Trabalho diz "Vivendo do que juntou · por escolha" para o personagem de R$ 89 mi, e a Cabeça não o penaliza.

Estado novo: `trabalho.intencao?: { quer, t }`, opcional e validado.

## 4. Condicionamento

- A frase é montada **na fonte** (`causasDoCondicionamento` e `lerPessoal`). A tela só exibe, e os sinais "+" e "−" saíram.
  - Exemplo: "O que pesa: uma lesão no ombro. O que segura: o treino de base de futebol (reduzido pela lesão) e um corpo que responde rápido ao treino."
- A tendência é a variação medida (`variacaoPessoal`), e as causas listadas vão sempre no sentido da tendência:
  - uma queda lista pelo menos uma causa do lado que pesa: a lesão ativa; a lesão curada que tirou N meses de treino; o fim da base; menos brincadeira solta na adolescência; um treino que já não sustenta a forma;
  - uma melhora lista pelo menos uma causa do lado que ajuda.
- O piso de forma desce em rampa dos 10 aos 15 anos, e a resposta ao treino sobe em rampa dos 10 aos 14. Nenhum degrau passa de 3 pontos, e um teste confere isso.
- O corte por lesão vale para toda atividade física (antes, só para profissionais). O time da escola e a atlética contam como treino.
- **Não foi hardcoded "na base = melhorando".** Na simulação, a criança da base melhora dos 11 aos 13 anos. A base com lesão pode cair, e a frase diz por quê.
- Foram auditados basquete, vôlei, tênis, natação, atletismo, luta, treino voluntário, sedentarismo, doença e recuperação: 12 atividades × 5 cuidados de lesão × 3 tendências, sem nenhum fragmento.

## 5. Política

`politica.calendarioDoMandato(v)` dá:

- cargo, início, fim e duração;
- o ano do mandato, contado pelo ano civil, não pela idade;
- o ano da posse e o ano final;
- `ultimoAno`, os meses restantes e a eleição que encerra o mandato;
- `naJanela`, com a marca `encerra`.

Quem usa: a janela de `processarPolitica`, a reeleição em `podeConcorrer`, a janela de troca de partido, o texto da derrota, `leituraPolitica` e o horizonte do mandato.

A tela agora diz "Ano 2 de 4 do mandato · 2029–2032" ou "Último ano do mandato (4 de 4)".

`textoDoMandatoNaEleicao` tem três textos:

- o último ano de verdade;
- a eleição de encerramento vista do ano anterior ("Em janeiro começa o último ano…");
- a eleição no meio do mandato ("vai até 2032 — este é o ano 2 de 4"), com a regra: o executivo renuncia 6 meses antes; o legislador mantém o cargo.

Transições conferidas ano a ano:

- renúncia para concorrer;
- posse em outro cargo, que fecha o anterior;
- conclusão;
- reload.

Nenhum mandato sobreposto.

## 6. Career Moments 2.0

**Chance por ano** = ritmo da trajetória × curva do silêncio × intensidade do ano. Não há cronômetro.

- **Curva do silêncio:** ×0,35 com 1 ano desde o último momento vivido, ×1 com 2 anos, ×1,6 com 3 e ×2,4 com 4 ou mais. Os empregos comuns usam uma curva mais suave.
- **Intensidade:** sobe na briga por título ou contra o rebaixamento, no técnico sob pressão ou com final pendente, e no último ano do mandato.
- **Sem cena dupla:** a crise política, a janela eleitoral, a proposta de clube e a renovação já são a cena do ano.
- **Adiamento:** um momento que outra decisão empurrou volta no ano seguinte, uma vez.
- **Recarga:** 5 anos por modelo (3 nos lances de jogo) e 2 anos entre modelos do mesmo tema. Um modelo nunca vivido pesa ×1,5.
- **Memória:** quando um tema volta, o contexto traz `_antes`. A cena cita o desfecho anterior ("De novo. Em 2051, você…"), e um fator "da outra vez" mexe nas chances.
- **15 modelos novos:**
  - futebol: pênalti, sacrifício, vestiário;
  - política fora do mandato: bairro, partido, sucessor;
  - técnico: 9 (seção 7);
  - autônomo: 2;
  - academia: 1 (a banca);
  - atuação: 1 (o teste).

**B1 · Consequências reais.** "A greve" (`pol_crise`): o sucesso depende do estado da pessoa (liderança, coragem, base, desgaste, cognição, anos de cargo). Cada resposta mexe em coisas diferentes:

| Resposta | Aprovação | Base | Desgaste | Outros efeitos |
| --- | --- | --- | --- | --- |
| Assumir a frente | +6 / +1 | +4 / −1 | +2 / +6 | reputação; uma entrega, quando dá certo |
| Equipe técnica | +3 / −1 | −2 | −3 / +1 | uma entrega, quando dá certo |
| Culpar a gestão anterior | +2 / −5 | +1 / −3 | +4 / +5 | imagem de "polêmica", quando falha |

Os números de cada célula são para quando a resposta dá certo e quando não dá. O marco do mandato guarda a resposta.

**Auditoria de texto × motor:**

- **Efeitos que passaram a existir:**
  - `banco` de verdade nos desfechos que diziam "foi para o banco";
  - `feito` que alimenta desempenho e promoção;
  - título no palmarés no ouro de `atl_final`;
  - clima, relação, saúde, base e desgaste onde o texto prometia.
- **Textos que mudaram (o motor não fazia aquilo):**
  - `emp_credito` não diz mais que houve promoção;
  - `ten_dor` não cita queda no ranking;
  - `atl_indice` não diz que o nome entrou na lista;
  - `mil_curso` não fala em promoção perdida.
- **Fora das situações:** o evento "a empresa fechou" podia fechar um clube real; agora exclui o setor esporte.

## 7. Carreira de técnico

`sistemas/tecnico.ts` (novo), com o estado em `caminhos.tecnico`. É uma carreira com passagens, temporadas, propostas, momentos e legado próprios, não um emprego com nome diferente.

- **Clube real:** assumir o comando (promoção de auxiliar, ou contratação) escolhe um clube real de `dados/clubes.ts`. O salário depende da divisão.
- **Temporada jogo a jogo:**
  - estadual com 12 times, depois semifinal e final;
  - liga nacional com 20 times, turno e returno;
  - força do time = tamanho do clube + trabalho do técnico (cognição, liderança, anos de banco, conhecimento) + vestiário + ajuste (reforços, titulares poupados) + forma.
- **Nem reputação nem fama entram no resultado:** só nas propostas e no salário.
- **Estilo:** o ofensivo tem menos empates e mais variância; o defensivo, mais empates.
- **Pressão da diretoria:** medida contra a posição esperada, depois do estadual e a 1/3 e 2/3 da liga. A demissão no meio da temporada deixa números parciais. Acessos e rebaixamentos seguem o teto e o piso do clube.
- **Propostas:** a proposta é criada uma vez, e a mostrada é a executada, mudança de cidade inclusive. Quem demitiu não chama de volta. Quatro anos sem clube encerram a carreira.
- **9 momentos próprios:** diretoria, crise de resultados, estrela insatisfeita, poupar titulares, mudança tática, vestiário dividido, renovação, cargo em risco, final do estadual. Os efeitos são reais (pressão, vestiário, ajuste, estilo, salário, demissão), e a final decide o título.
- **C1 · jogador e técnico separados:** a carreira de jogador fica intacta em `esporte` e `carreirasEsportivas`.
  - O legado tem duas trajetórias: o esporte profissional e "Técnico de futebol".
  - Em Trabalho, "A carreira no esporte" e "Carreira como técnico" ficam lado a lado.
  - A carreira de técnico mostra: a linha, o clube, o contrato, a diretoria e o vestiário em palavras, o estilo, os títulos, e a tabela por clube (Clube · Período · J · V · E · D · Aprov. · Títulos · Saída).
- **C3 · seleção, implementada:** o convite vem a partir dos 40 anos, com reputação 80+ e pelo menos um título da Série A. A passagem tem ~10 amistosos por ano mais o torneio do calendário (grupos e mata-mata, com pênaltis). Sair cedo num torneio grande costuma custar o cargo. É rara: 0 em 120 carreiras simuladas. Um teste cobre.

## 8. Viagens

O componente novo `ui/jogo/Viagem.tsx` (`EscolherViagem`) mostra **uma etapa de cada vez**:

- **Exterior:** "Para qual país?" (o continente aparece uma vez, como pequeno título) → cidade → "Por quanto tempo?" → resumo (destino, dias, quem vai, o que o preço cobre, total) → "Confirmar a viagem".
- **Brasil:** região → destino → duração → resumo → confirmar.

Como funciona por dentro:

- Há "← Voltar" e uma trilha mostrando o caminho. O foco vai para o título de cada etapa.
- O bloqueio da porta inteira (como "Foi há pouco…") aparece **uma vez**, na linha da porta, e a porta não abre.
- O motor ganhou `PAISES_FORA` (país → cidades, com continente) e `catalogoDeViagem`, derivado de `escolhasDaExperiencia`. Os ids de ação, os preços e a execução são os mesmos de antes: saves e testes seguem valendo.
- **Nenhum país novo foi adicionado.** Uma cidade nova entra em `DESTINOS_FORA`, e um país novo é uma linha em `PAISES_FORA`.

## 9. Visuais

- **Aviões (5 famílias em silhueta cheia de perfil):**
  - **ultraleve:** com bequilha, asa alta em V e hélice grande;
  - **monomotor de asa alta:** asa sobre a cabine, montante;
  - **asa baixa:** cabine baixa, trem saindo da asa;
  - **bimotor:** nacele com hélice própria;
  - **jato:** janelas redondas, cauda em T, motores na traseira, asa enflechada.
  - O catálogo mapeia a forma (`formaDaVersao`). Ainda não há bimotor nem jato à venda: os desenhos estão prontos.
- **Jet ski:** casco em cunha, sela longa, coluna com guidão, jato d'água na popa.
- **Cães e gatos** (`ui/avatar/caesEGatos.tsx`): o animal inteiro, de perfil, com morfologia própria.
  - **Cão:** porte, corpo, pernas, focinho, orelhas, cauda e pelagem.
  - **Gato:** constituição, cabeça, orelhas, cauda, pose e pelagem.
  - Cada traço é uma escolha estável a partir do id. O porte inclina as chances.
  - Sem raça, o animal é SRD; uma raça pode fixar traços no futuro.
  - Cor e mancha variam **dentro** da morfologia.
  - O teste do "sem nome, sem raça, sem cor": ≥ 20 combinações distintas em 24 cães e ≥ 15 em gatos, e todo desenho difere com a cor fixa.
  - O bicho adotado é o mesmo que se viu no abrigo (`InfoPet.semente`).

## 10. Iconografia

`ui/iconesConquista.tsx`: 13 glifos 16×16, só em `currentColor`, sem emoji e sem cor fixa:

- taça, prêmio (louro), medalha, pódio, recorde (cronômetro);
- bandeira, braçadeira, acesso, queda;
- final (chave com taça vazada), marco, ranking, cinturão.

O registro `iconeDaConquista(c, familia)` é chaveado por família de carreira. Hoje só `esporte` tem regras; arte, academia e política entram como regras novas, sem mexer na tela.

| Conquista | Glifo |
| --- | --- |
| Título | cinturão na luta; pódio na natação e no atletismo; taça no resto |
| Final | chave com taça vazada |
| Acesso / rebaixamento | setas para cima / para baixo |
| Prêmio | louro |
| Pelo país | medalha, taça, braçadeira ou bandeira, conforme o texto |
| Marco | braçadeira, ranking (tênis), recorde ou marco |

Onde aparece: "A carreira no esporte" (Trabalho) e as trajetórias esportivas de "O que você construiu" (Você). Os glifos ficam discretos, do tamanho da fonte e `aria-hidden`.

## 11. Sucessão

Na morte, a **tela do legado** (`Fim.tsx` + `Legado.tsx`) mostra, nesta ordem:

1. **SUA VIDA:** nome, datas, a causa, o que marcou.
2. **O que ficou:** família, patrimônio e as trajetórias.
3. **A partilha:** a conta inteira e quem recebe o quê, editável.
4. **E agora:** "Continuar a família", com cada filho ou filha mostrando idade, laço, onde mora, ocupação e formação, família própria, dinheiro, traço e, se for menor, quem ficaria com a guarda. Ou "Encerrar esta história".

- **Ninguém é pré-selecionado.** O jogador escolhe, vê o resumo ("A história segue com Daniela, aos 44 — com a vida que ela já tem. Pela partilha, ela recebe R$ X.") e confirma.
- **A vida morta fica salva** até a decisão. Recarregar volta ao legado, com as decisões da partilha guardadas em `morte.decisoes`.

**G1 · A pessoa já existia** (`sucessao.continuarComo`). A filha NPC vira o `eu`, e nada é sorteado de novo. Ela preserva:

- nome, sobrenome, sexo, data de nascimento e aparência;
- o temperamento (vira a personalidade, com evidência "o jeito de antes");
- a saúde e a aptidão (vira a cognição);
- a formação (concluída e em curso), o trabalho (ocupação, salário bruto reconstruído do líquido, experiência, aposentadoria, desemprego);
- a parceria (namoro, união ou casamento, com a data), os filhos e netos dela, a cidade;
- o dinheiro dela: a partir de agora, os descendentes **guardam** um pouco por ano, nas posses deles, pela faixa de renda. Saves antigos têm uma estimativa determinística pela trajetória;
- os bens dela, se tinha;
- a gestação em curso (vira processo).

Sobre a idade, o tempo e a Linha da Vida:

- A idade não muda. O tempo avança até o aniversário dela (até 11 meses), para o ano seguir de aniversário em aniversário.
- **A Linha da Vida dela** começa no nascimento dela ("Nasceu em março de 2060, em Recife, filha de Bento e Ana Clara") e segue com a trajetória que a ficha registrava, na voz dela.
- Depois vêm a morte do pai e o inventário ("coube a você…").

**G8 · Relações da perspectiva dela** (`reconciliarParentescos`):

- quem morreu vira o pai ou a mãe dela (falecido), com a história que tinham juntos;
- a mãe sobrevivente é mãe (ou madrasta e padrasto, se não for genitora);
- os outros filhos viram irmãos ou meios-irmãos, conforme os genitores;
- os pais de quem morreu viram avós; os irmãos de quem morreu, tios;
- os netos de quem morreu viram filhos dela ou sobrinhos; os genros e noras, parceria dela ou cunhados;
- a parceria dela vira romance (casamento, união ou namoro);
- amigos e colegas de quem morreu não são a rede dela;
- o bicho da casa fica com quem continua morando nela;
- `Parentesco` ganhou `sobrinho` e `cunhado`;
- `genitores` são remapeados: o `'eu'` antigo vira o id da pessoa falecida, e o id da herdeira vira `'eu'`. A herdeira **sai** de `pessoas`, para não existir duas vezes.

**G7 · Filho menor:**

- continua na idade dele, na série escolar da idade e com as regras de autonomia de sempre;
- a guarda segue esta ordem: o outro genitor vivo; o cônjuge que morava junto; um irmão com 21 anos ou mais; um avô; um tio;
- sem nenhum, a continuação é bloqueada com o motivo ("quem decidiria seria a Justiça");
- guardião que não é pai nem mãe: moradia `parente` e `origem.responsavelId`, que `origem.responsaveis` passa a ler;
- a herança fica aplicada em nome dele (`Aplicacao.tutelaAte`, a maioridade). Ninguém a move antes disso, nem o resgate automático.

**G9 / G10 · Memória.** `vida.linhagem.geracoes[]` guarda cada vida jogada:

- quem foi: a pessoa no mundo, nome, gênero, aparência, datas, cidades, causa;
- o que marcou e as trajetórias;
- a Linha da Vida dela (só marcos e biografia);
- a partilha;
- quem continuou;
- a notoriedade.

"Você" ganhou **"Quem veio antes"**: cada geração, com a Linha da Vida consultável. O que fica separado:

- a biografia de quem morreu (na linhagem);
- a memória familiar (a linhagem);
- a Linha da Vida de quem continua.

**G11 · O mérito não se herda.**

- `caminhos` começa vazio: sem palmarés, carreira, base política, reputação ou habilidade.
- A notoriedade vem só por associação: no máximo 18% do pico, sem fonte própria, e decai sozinha.
- A frase é "por ser filha de Bento Silva".
- O patrimônio passa pela partilha.

**G12 · Negócio da família.** Deixado para quem continua, é o **mesmo** negócio, com história, caixa e equipe, nas mãos da equipe (`passivo`). Deixado para um NPC, fica nas posses dele. Vendido, entra na partilha pelo caixa mais o valor de venda.

**G13 · Sem filhos.** Não se inventa sucessor. Encerrar faz a partilha (ascendentes, cônjuge, irmãos ou, sem ninguém, o município) e a registra.

## 12. Herança

`dados/sucessao.ts` traz as **regras por país** (só a entrada `BR` hoje). A partilha só lê a tabela: um país novo é uma entrada nova, não um `if`.

Princípios do Brasil (Código Civil), cada um citado no arquivo:

- herdeiros necessários: art. 1.845;
- legítima de metade: arts. 1.789 e 1.846;
- ordem de vocação: art. 1.829;
- cônjuge com ascendentes, 1/3 ou 1/2: art. 1.837;
- representação: art. 1.851;
- ninguém herda dívida além das forças da herança: art. 1.792;
- vacância para o município: art. 1.844;
- comunhão parcial: art. 1.640.

Simplificações declaradas:

- o cônjuge concorre por cabeça, sem separar bens comuns e particulares;
- não há a quota mínima de 1/4;
- o ITCMD e as custas são uma taxa média de 4% (o teto do ITCMD é 8%, pela Resolução 9/1992 do Senado);
- o direito real de habitação vira o padrão de deixar a casa com o cônjuge, quando cabe na parte dele.

**A partilha** (`partilhar`, função pura) segue estes passos:

1. inventário (conta, aplicações, imóveis, veículos, negócio);
2. dívidas pagas: a parte não coberta se extingue;
3. meação;
4. custos;
5. herança, dividida em legítima e disponível.

O jogador decide, dentro da regra:

- frações da **parte disponível** para cada herdeiro ou para o cônjuge;
- uma **doação**, com destino (causas, nunca instituição real);
- **quem fica com cada bem**. O bem entra no quinhão da pessoa, e o que ninguém recebe é vendido no inventário.

A tela mostra o motivo quando a escolha não cabe ("a casa vale mais do que a parte de Levi"), e nada é transferido até a partilha fechar.

**Escolher quem continua não mexe na partilha.** A partilha mostrada é exatamente a que é feita, porque as duas saem da mesma função.

**G5 · Invariantes:**

- `bruto = dívidas pagas + meação + quinhões + doação + custos + vacante`;
- cada quinhão = dinheiro + bens;
- cada bem tem um dono;
- a dívida tem destino definido (paga ou extinta);
- a herança vira linha do extrato.

**Patrimônio de quem não é protagonista:** `Pessoa.posses` (dinheiro, bens, negócio, história).

- A herança dos NPCs vai para lá.
- Quando a mãe sobrevivente (que ficou com a meação e a casa) morre, a herança dela sai **dessas posses** e da reserva da casa de origem (`origem.reservaDe`), não do sorteio por classe que existia antes.
- Um NPC com posses que morre deixa tudo para os herdeiros dele.

## 13. Gerações

O modelo é recursivo:

- `continuarComo` funciona sobre qualquer vida morta;
- a linhagem acumula;
- as posses viajam;
- a mesma reconciliação de parentescos vale em toda geração.

A simulação (seção 16) chegou a **5 gerações** sem problema.

## 14. Save e migração

**v18 → v19, migração real** (`migrarV18`).

A versão subiu porque a semântica mudou:

- a vida passou a poder ser de uma geração seguinte (linhagem, `'eu'` remapeado);
- há parentescos novos (`sobrinho`, `cunhado`), que um jogo v18 não sabe ler;
- há herança tutelada.

Um cliente v18 não pode abrir um save v19 como se fosse dele.

A migração em si não converte nada, porque tudo o que é novo é opcional. Uma vida v18 já morta abre na tela do legado e pode continuar.

Validação nova (no bloco `versao >= 19`):

- linhagem;
- posses;
- `reservaDe` e `responsavelId` apontando para quem existe;
- `tutelaAte`;
- decisões de herança;
- todo parentesco contra a lista válida;
- a carreira de técnico.

Campos opcionais também acrescentados neste pacote: `financas.extrato`, `financas.extratoAberto`, `trabalho.intencao`, `caminhos.tecnico`, `InfoPet.semente` e `Pessoa.municipioNatal`.

Os saves reais do playtest (v12 a v17, em `fixtures`) continuam migrando até a v19 e vivendo. A cadeia de idempotência foi estendida até `migrarV18` nos testes de migração.

## 15. Testes

| Arquivo novo | Testes | O que cobre |
| --- | --- | --- |
| `motor/__tests__/sucessao.test.ts` | 19 | Os 12 casos da Parte H, a contabilidade depois da sucessão e o negócio da família |
| `ui/__tests__/sucessao.test.tsx` | 4 | O legado sem pré-escolha, a decisão que persiste, continuar como a filha (e "Quem veio antes"), encerrar |
| `motor/__tests__/contabilidade.test.ts` | 8 | Conciliação, fluxo positivo de 6 anos, o cenário do playtest, ano no vermelho, tênis, 3 vidas × 20 anos |
| `motor/__tests__/riquezaCondicionamento.test.ts` | 16 | Ver seções 3 e 4, mais a regressão de quem mora com a família |
| `ui/__tests__/riquezaCondicionamento.test.tsx` | 2 | As três telas do personagem de R$ 89 mi; o atleta de base lesionado |
| `motor/__tests__/calendarioPolitico.test.ts` | 16 | Todos os cargos, meses de aniversário de 1 a 12, o caso do playtest, transições, reload |
| `motor/__tests__/momentos2.test.ts` | 10 | Elegibilidade, recarga, silêncio, memória, consequências por opção |
| `motor/__tests__/tecnico.test.ts` | 8 | J = V+E+D, títulos da tabela, demissão, nova passagem, proposta executada, save, legado, seleção |
| `ui/__tests__/tecnico.test.tsx` | 1 | A seção "Carreira como técnico" |
| `ui/__tests__/viagens.test.tsx` | 4 | Uma etapa por vez, bloqueio uma vez, a mesma ação e o mesmo preço do motor |
| `ui/__tests__/visuaisIcones.test.tsx` | 12 | Famílias de avião, jet ski, morfologia de cães e gatos, glifos sem emoji |

Os 12 casos da Parte H:

1. A herdeira vira protagonista, e o irmão continua NPC.
2. Ela preserva carreira, parceria e filho.
3. Escolher ≠ herdar 100%.
4. A partilha reconcilia.
5. Nenhum bem fica duplicado.
6. A dívida é paga ou extinta.
7. O menor continua menor (com o caso do órfão).
8. Save antes, durante e depois da sucessão, e save v18.
9. A linhagem existe.
10. A Linha da Vida não mistura vidas.
11. Pai → filha → neto.
12. Sem filhos, não se inventa ninguém.

**Testes existentes ajustados por mudança intencional:**

- `VERSAO_SAVE`/`versao` de 18 para 19, e a cadeia de idempotência estendida até `migrarV18`: att3, fix2, fix4, fixPosRework2, pacotePlaytest, profissao, rework2, rework3, trajetorias;
- `fix31` (o circuito do tenista virou linha do orçamento);
- `pacotePlaytest.test.tsx` (as viagens, agora em etapas).

**Rodada final da suíte completa** (Node 22.23.2, `npx vitest run`, 552 s): 51 arquivos e 958 testes passaram; o `interface.test.tsx` perdeu o worker por timeout do WSL e, rodado isolado, passou 14/14. **Total: 972 testes em 52 arquivos.**

Rodadas anteriores encontraram e corrigiram:

- 3 asserções de idempotência de migração;
- o falso "vivendo do patrimônio" (seção 1).

## 16. Simulações

| Simulação | Script | Resultado |
| --- | --- | --- |
| **Economia** (A1) | `scripts/sim/economia.ts` | 40 vidas naturais (nascimento → 70 anos, 9 estratégias): 2.581 anos fechados, 0 sem conciliação, 0 linhas de ajuste. 40 bem pagas (R$ 25–60 mil, até R$ 12 mi aplicados): 1.154 anos, 0 / 0. 20 tenistas: 240 anos, 0 / 0. A sobra que a tela prometia aos tenistas (R$ 30,5 mi) virou crescimento real de R$ 29,5 mi; a diferença é inflação, rendimento e acontecimentos, todos com linha |
| **Career Moments** (B2) | `scripts/sim/momentos.ts` | Tabela abaixo |
| **Técnico** (C) | `scripts/sim/tecnico.ts` | 120 vidas, assumindo aos 36, por 24 anos. Tabela abaixo |
| **Sucessão** (L4) | `scripts/sim/sucessao.ts` | 24 famílias × até 4 sucessões: **52 sucessões, até 5 gerações, 0 problemas** (detalhe abaixo) |

**Career Moments, janela de 20 anos (40 vidas por carreira).** Quando há duas colunas, o valor da esquerda é antes e o da direita, depois. O "antes" é o mesmo script rodado sobre o código anterior.

| Carreira | Momentos/ano | Silêncio máximo | Modelos distintos | 1º momento (mediana) |
| --- | --- | --- | --- | --- |
| Futebol | 0,17 → **0,28** | 19 → **8** | 2,3 → 3,3 | ano 6 → **3** |
| Técnico | 0,21 (como emprego) → **0,36** | 19 → **8** | 2,3 → 3,9 | ano **2** |
| Medicina | 0,29 → 0,37 | 12 → 5 | 2,8 | ano 2 |
| Academia | 0,24 → 0,36 | 14 → 4 | 3,0 | ano 2 |
| Atuação | 0,26 → 0,40 | 14 → 6 | 3,0 | ano 2 |
| Política | 0,05 → **0,24** | 20 → 12 | 0,8 → **4,0** | ano 19 → **2** |
| Negócio | 0,27 → 0,32 | 4 | 1,9 | ano 2 |
| Autônomo | 0,16 → 0,20 | — | — | — |
| Emprego comum | 0,22 → 0,20 | — | — | — |

- O intervalo mediano entre momentos é de 2 a 4 anos, e os anos silenciosos continuam existindo.
- Repetição do mesmo modelo em até 4 anos: 0%, exceto no técnico (15%, a final do estadual e a renovação, que são anuais por natureza).
- Momento sorteado e não vivido no futebol: 25% → 4%.
- O emprego comum ficou, de propósito, perto do ritmo antigo. Um ritmo maior derrubava a métrica de biografia da meia-idade (`meiaidade.test.ts`), e isso foi confirmado desligando os momentos.

**Técnico, carreira longa:**

| | Ex-jogador | Sem passado de jogador |
| --- | --- | --- |
| Clubes (mediana) | 4 | 3 |
| Jogos (mediana) | 796 | 262 |
| V·E·D (média) | 360·175·204 | 148·82·113 |
| Aproveitamento | 55% | 47% |
| Títulos (média; % com algum) | 6,8 (84%) | 2,5 (49%) |
| Acessos · rebaixamentos · demissões · renovações | 2,2 · 0,5 · 1,2 · 6,8 | 1,5 · 0,3 · 1,0 · 4,8 |
| Chegou à Série A | 63% | 18% |

- Temporadas com J ≠ V+E+D: **0**.
- Exemplo: "Amazonas 2078–2083 — 152 jogos · 76 V · 27 E · 49 D · 56% · Campeão estadual (2080)".
- O ex-jogador vai melhor sem que a fama entre na conta: o que pesa são o conhecimento de futebol, a liderança e os anos de banco que a carreira de jogador construiu.

**Sucessão (detalhe).**

- **Andaime:** o agente "primeira opção" quase nunca forma família, então o script dá uma parceria e dois filhos a quem chega aos 30 sem filhos. Está documentado no script e não é regra do jogo.
- **O que foi exercitado:**
  - 52 sucessões, sendo 2 de menores; as idades de quem continuou foram de 10 a 56 anos (mediana 40);
  - 17 com doação;
  - 20 histórias encerradas sem filho elegível;
  - 22 mortes com dívida maior que o patrimônio. O diagnóstico mostrou vidas do agente que chegam ao fim sem nada e com dívida de cartão ou empréstimo: comportamento do agente, e a regra de extinção funcionou.
- **O que foi conferido em cada sucessão:**
  - a partilha fecha;
  - **a conservação vale:** patrimônio de depois = o das pessoas do mundo + espólio líquido − custos − doação − vacância + as economias que só passaram a ser contadas;
  - nenhum bem tem dois donos;
  - a herdeira não fica em `pessoas`;
  - nenhum vínculo aponta para quem não existe;
  - nenhuma pessoa é inventada;
  - ninguém é filho e irmão ao mesmo tempo;
  - a biografia de quem morreu não está na Linha da Vida nova;
  - a linhagem cresce uma geração;
  - o save reabre idêntico;
  - o primeiro ano da vida nova anda.

## 17. Bundle

O pacote `motor` estava em **799 kB**, com limite de 800. A causa: todos os sistemas num pacote só. **O limite não foi aumentado.**

A correção, no `vite.config.ts`, é a **camada de base**: os sistemas-folha que só importam os catálogos e uns aos outros vão para o pacote de baixo, junto com os catálogos. São eles: núcleo, texto, tempo, rng, mercado, origem, rede, notoriedade, economia, investimentos, renda e outros.

- A regra é medida no **grafo real** de imports que o Rollup vê (`getModuleInfo`), não numa lista fixa.
  - Um módulo-folha novo cai lá sozinho.
  - Um módulo que passe a importar um sistema de cima sai de lá sozinho.
- Nenhum ciclo entre pacotes.
- O smoke confirma que tudo carrega em tempo de execução (18/18).
- `sucessao` e `tecnico` foram para `motor-carreira`, que só a camada de cima importa.

| Pacote | Antes do pacote | Depois |
| --- | --- | --- |
| `motor` | 790 kB (chegou a 799 com o pacote) | **684 kB** |
| `motor-conteudo` | 774 kB | 787 kB |
| `motor-carreira` | 169 kB | 263 kB |
| `motor-dados` (catálogos + camada de base) | 190 kB | 307 kB |
| `vida-itch.zip` | 780 kB | 835 kB comprimido, 14 arquivos |

## 18. Auditoria adversarial

| Contradição procurada | Resultado |
| --- | --- |
| Patrimônio diz "independente", Cabeça diz "procurando há anos" | Corrigida na origem: há uma fonte de intenção, e as três telas concordam. Teste |
| Trabalho diz uma carreira, Linha da Vida registra outra | Técnico: o emprego vira o clube, e a Linha da Vida registra as passagens. Sucessão: o trabalho e a Linha da Vida da herdeira saem da mesma ficha |
| A herança mostra um valor e o patrimônio transfere outro | Impossível por construção: a tela e a transferência chamam o mesmo `partilhar`. Teste de conservação |
| O filho vira protagonista e Pessoas o trata como filho | Os vínculos são refeitos da perspectiva dela; a herdeira sai de `pessoas`. Verificado na captura: marido, filha, mãe, irmãos |
| Atleta treina e o condicionamento ignora | Toda modalidade e atividade alimenta a forma e é nomeada; a lesão reduz o treino e diz isso |
| "Último ano" fora do último ano | Corrigida na origem (calendário único). Teste para os 12 meses de aniversário |
| Saldo positivo e dinheiro sumindo | Corrigida na origem. O extrato fecha e os testes proíbem ajuste |
| Career Moment com consequência só no texto | Auditadas todas: o efeito foi implementado ou o texto corrigido (seção 6) |
| **Achada nas capturas:** criança de 13 anos com "os anos, que começam a cobrar" | Corrigida na origem (`fatoresSaude`) |
| **Achada nas capturas:** save de vida morta com "Continuar a vida de…" | Corrigida: "Voltar ao legado de…" |
| **Achada na suíte final:** quem mora com a família, sem nada guardado, aparecia como "vivendo do patrimônio" (e a tela de Dinheiro dizia "deixou de ser a preocupação") | Corrigida na origem (`seguranca`). Teste |
| **Achada na revisão:** bicho do abrigo diferente depois de adotado | Corrigida (`InfoPet.semente`) |
| **Achada nos testes:** a herdeira ficava duas vezes no mundo | Corrigida antes de integrar: ela sai de `pessoas` e `vinculos` |

## 19. Pendências encontradas

1. **`motor-conteudo` está a 787 kB do limite de 800.** O próximo conteúdo grande pede dividir a camada de conteúdo, por exemplo os catálogos de eventos por fase da vida, que hoje se importam pela base comum de conteúdo.
2. **Condições de saúde de um NPC não existem:** um NPC não guarda diagnósticos, então o protagonista novo começa sem diagnóstico (a saúde, em número, é a dela). Também não há carreira especial de NPC (esporte, arte): a ficha de um NPC não tem essas trilhas.
3. **Rótulo do prêmio do tenista:** aparece bruto em Trabalho e líquido em Dinheiro. Está coerente, mas os rótulos não dizem isso.
4. **Técnico:**
   - auxiliares de basquete e vôlei ainda podem virar `tecnico_futebol` pelo caminho genérico, que já existia;
   - não há contratação no meio da temporada;
   - os adversários do estadual fora do catálogo são genéricos;
   - a seleção é rara (0 em 120 carreiras).
5. **Futebol a 0,28 momento por ano:** se o próximo playtest pedir mais, o ajuste é `RITMO.futebol`, hoje 0,62.
6. **Morte com dívida no agente "primeira opção":** 42% das mortes simuladas deixam mais dívida que patrimônio. Não é defeito da sucessão; é um dado a olhar na simulação de 1.000 vidas (o endividamento crônico no fim da vida).
7. **Ilícito:** a renda de atividade ilícita entra no extrato pela linha genérica "Acontecimentos do ano", sem linha própria.
8. **Aviões:** ainda não há bimotor nem jato à venda. Os desenhos estão prontos.
9. **Ambiente:** a suíte no WSL pode perder o worker do jsdom por timeout quando a máquina está carregada. `--pool=threads` resolve; o código não muda.

## 20. O que ficou de fora, de propósito

- América do Sul (nenhum país novo), ATT4, ATT5, a simulação final de 1.000 vidas.
- Inventário jurídico completo:
  - regimes de bens além da comunhão parcial;
  - a quota mínima de 1/4;
  - ITCMD por estado;
  - testamento além da parte disponível.
- Regras sucessórias de outros países. A tabela está pronta para recebê-las.
- Árvore genealógica visual: a linhagem guarda o necessário, e a tela "Quem veio antes" é a lista mínima.
- Negócio de família como subsistema próprio (com governança, conselho e sucessão de sócios). O negócio passa inteiro, como está.
- Continuar com enteado não adotado. Pela lei, o enteado não é herdeiro, e o jogo segue a mesma regra.

## Arquivos

**Novos:**

- **Motor:**
  - `sistemas/sucessao.ts`, `sistemas/economiasNpc.ts`, `dados/sucessao.ts`
  - `sistemas/extrato.ts`, `sistemas/intencao.ts`
  - `sistemas/tecnico.ts`, `conteudo/tecnico.ts`
- **Interface:**
  - `telas/Legado.tsx`, `jogo/Linhagem.tsx`, `jogo/Viagem.tsx`
  - `avatar/caesEGatos.tsx`, `iconesConquista.tsx`
- **Scripts:**
  - `sim/sucessao.ts`, `sim/economia.ts`, `sim/momentos.ts`, `sim/tecnico.ts`
  - `playtest/gerarPreAmerica.ts`, `playtest/preAmerica.mjs`
- **Testes:** os 11 arquivos da seção 15.

**Alterados:**

- **Núcleo:**
  - `tipos.ts`, `save.ts`, `fachada.ts`, `criacao.ts`, `acoes.ts`, `ano.ts`
- **Sistemas:**
  - `dinheiro`, `investimentos`, `carreira`, `esporte`, `trabalho`
  - `estado`, `pessoa`, `lesoes`, `profissao`
  - `politica`, `situacoes`, `legado`
  - `familia`, `filhos`, `origem`, `notoriedade`, `pets`, `experiencias`
  - `iniciativas`, `ilicito`, `romance`
- **Conteúdo:**
  - `politica`, `situacoes`, `caminhos`, `adulto`, `catalogo`
- **Dados:**
  - `bens`
- **Interface:**
  - `useVida`, `Fim`, `Inicio`, `Jogo`
  - `Voce`, `Pessoas`, `Momento`, `Trabalho`, `Trajetorias`, `Tempo`, `Dinheiro`, `Desenhos`, `Lugares`
  - `Retrato`, `estadoPessoal`, `leituraMaterial`, `vida.css`
- **Configuração:**
  - `vite.config.ts`
