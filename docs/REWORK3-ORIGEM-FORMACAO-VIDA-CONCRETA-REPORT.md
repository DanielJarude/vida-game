# REWORK 3 — Origem, formação e vida concreta

> "De onde eu vim, em que ambientes fui formado e que vida concreta consigo construir?"
> "Você não escolhe tudo que acontece na sua vida. Escolhe o que fazer com a vida que aconteceu com você."

## 1. Estado inicial e final

| | |
| --- | --- |
| Branch de partida | `claude/fix-pos-rework2-integracao-carreiras` |
| HEAD inicial | `fd93ed6` (working tree limpa) |
| Baseline conferida | **684/684** testes (26 arquivos), typecheck limpo, build limpo, smoke itch.io 18/18 |
| Save inicial | v17 |
| Branch deste trabalho | `claude/rework3-origem-formacao-vida-concreta` |
| HEAD final | ver o commit desta branch (`git log -1`) |
| Save final | **v18** |
| Node | 22 (`~/.nvm/versions/node/v22.23.2`) |

Sem merge em `main`, sem deploy, sem force-push, sem segredos.

## 2. Arquitetura encontrada (o que já existia e foi reaproveitado)

A base já tinha: origem (`classe`, `arranjo`), renda real e mutável dos pais, moradia (aluguel, república, casa dos pais, própria), imobiliária, concessionária/usados/motos com versões reais, oficina, banco, deslocamento, rotinas (a semana como fonte única), frentes (habilidade × interesse × prática), colega ≠ amigo por gesto, caminho ilícito abstrato com justiça e prisão, notoriedade, conteúdo em decisões × acontecimentos. O REWORK 3 **ligou** isso e acrescentou o que faltava, sem sistemas paralelos.

Problemas estruturais encontrados:

- **Origem como carimbo**: mesada, contribuição em casa, "pais pagam a faculdade", cursinho pago e até a ajuda automática da família vinham de tabelas por **classe de nascimento** (`MESADA[classe]`, `PAIS_PAGAM_ESTUDO[classe]`, `ajudaDaFamilia` com multiplicador de classe).
- **Escola como estado**: série, nota, rede — sem instituição, sem professores, sem atividades próprias; o time, o grêmio, o clube de ciências eram lazer genérico.
- **Lojas quebradas**: a concessionária abria com "Para você, agora" vazio mesmo com CNH e dinheiro (carro zero nunca alcançava a pontuação mínima); imobiliária e vitrines escondiam o resto atrás de um botão; a mensagem "nada cabe" só falava de financiamento.
- **Gestão**: ações do negócio que dependiam do caixa sumiam quando faltava dinheiro (pendência 2 da base).
- **Navegação**: oito abas no topo (Vida, Você, Pessoas, Trabalho, Estudos, Casa, Tempo, Cidade), duas delas aparecendo com a idade; o dinheiro em Você; as lojas em Cidade.

## 3. Arquitetura criada

Módulos novos (motor):

| Módulo | Fonte única de | Consumidores |
| --- | --- | --- |
| `sistemas/autonomia.ts` | o que a IDADE permite decidir (aparência, barba, atividade escolar, representação, pedir ajuda, contribuir, compra pessoal, gastos da casa, moradia) | estilo, origem, ações, telas (Aparência, Compras, Independência) |
| `sistemas/origem.ts` | recursos reais da casa de origem (renda de quem a sustenta hoje ÷ quem vive dela, folga 0–4, **reserva** finita), apoio possível (recurso × relação × necessidade × histórico), pedir ajuda, ajuda dada | mesada, contribuição em casa, mensalidade paga pela família, ajuda a quem estuda fora, cursinho, ajuda automática em emergência, pedido da família (`p.aperto`), Independência, Pessoas, Vida · Dinheiro, Trabalho (criança) |
| `sistemas/formacao.ts` | a **instituição** (nome, tipo, perfil de ofertas estável por semente), atividades de formação, vivências, professor/orientador, convite, colegas depois da formação, peso das vivências | rotinas, escola (nota, conclusão, mestrado), prova do IF, oportunidades (estágio, aprendiz, convite, indicação da turma), trabalho (chance), empregabilidade (texto), política (grêmio/CA/extensão), esporte (time → peneira), Formação |
| `sistemas/independencia.ts` | a fase de independência (derivada) e a biografia da primeira independência | Vida · Casa, testes, simulação |
| `sistemas/estilo.ts` + `dados/estilo.ts` | aparência escolhida (corte, cor, barba, bigode, óculos, chapéu, roupa), itens comprados, sinal do estilo | ações, retrato, Você, Ótica, imagem pública |
| `conteudo/rework3.ts` | perguntas nascidas do estado: excursão, casa que precisa de mãos, ajuda nas contas (adolescente), a conversa das contas de casa (adulto), depois do IF, curso que não anda, o professor que volta, o time da várzea | — |
| `rng.rngDe` | geradores derivados | todos os sorteios novos (não empurram as vidas antigas para outro rumo) |

UI nova: `ui/navegacao.ts` (áreas, seções, **mapa de intenções**), `jogo/VidaConcreta.tsx`, `jogo/Aparencia.tsx`; Formação (`Estudos.tsx`) ganhou "O lugar" e "O que ficou".

## 4. Origem

- `Origem` ganhou `reserva`, `apoios`, `contribuicao` e `bairro`. A classe de nascimento só define o **ponto de partida** da reserva (com variação pela semente) e o texto do bairro.
- **Folga** vem da renda REAL de quem sustenta a casa de origem (pais que perdem e arrumam emprego, se aposentam, se separam) por pessoa, ajustada pelo custo da cidade.
- A reserva cresce nos anos folgados, encolhe nos apertados e no desemprego de quem sustenta, e **cada ajuda sai dela**.
- A mesma semente em casas diferentes: mesmas predisposições (a origem não escreve a cabeça), folga/reserva/escola/mesada diferentes (testado).
- Mesada, contribuição de adulto em casa, parte da mensalidade paga pela família, cursinho pago, ajuda a quem estuda fora: todos por folga + relação, não por classe.

## 5. Infância

A infância ganhou vida própria ligada aos sistemas: escola com nome e atividades a partir dos 7 (time, reforço, projeto, fanfarra, olimpíada), professor que repara (a partir dos 9), óculos de grau quando a vista pede (a família compra, sai da reserva dela), a excursão que numa casa apertada vira pergunta (pedir, rifa, não ir), a casa no limite que pede mãos (ajudar depois da aula, só no fim de semana, explicar que precisa estudar). Autonomia por idade centralizada em `autonomia.ts`: criança pequena não decide visual nem compras; criança maior pede; adolescente ganha voz.

## 6. Formação (escola, IF, universidade, depois)

**Instituição como ambiente.** `instituicaoAtual(v)` devolve nome ("Escola Estadual Castro Alves", "Instituto Federal, campus Recife", a universidade da matrícula), tipo, descrição e **ofertas** estáveis por semente e cidade. Escola A ≠ escola B; toda escola tem pelo menos três coisas (reforço, projeto, quadra) — nenhuma é "onde nada acontece".

**Atividades** (rotinas, mesma semana e custo): time da escola, olimpíadas, reforço, projeto da escola, fanfarra, grêmio e clube de ciências (agora da escola), projeto técnico (IF/técnico), iniciação científica (com bolsa), monitoria, extensão, centro acadêmico, atlética, grupo de estudos, empresa júnior. Moram em Formação; aparecem na semana em Tempo livre com "ver em Formação"; somem quando a instituição acaba — e a **vivência fica**.

**Vivências** (`educacao.vivencias`) com anos, área e feito (medalha, projeto premiado, artigo, coordenação do CA). Consumidores: nota (reforço, grupo de estudos, monitoria), prova do IF (medalha, incentivo do professor), mestrado/doutorado (iniciação + orientação), chance em vagas da área (projeto técnico, empresa júnior, iniciação, monitoria, extensão — até +0,1, com a frase no perfil da vaga), chamadas de estágio (mais frequentes, às vezes pela mão da orientadora), política (grêmio/CA até 30 anos; extensão conta como trabalho comunitário), peneira (o time da escola é futebol de competição; quem indica é o professor de educação física).

**IF / técnico.** Cursos do campus pela cidade e prova pelo desempenho (preservados). Agora com identidade: laboratório/projeto técnico, professor, JIFs, estágio pela vivência, e ao concluir o integrado a pergunta **"E o técnico, agora?"** (vaga da área, faculdade que continua a área como objetivo do ENEM, outro caminho).

**Universidade.** Iniciação com orientador (NPC persistente), monitoria, extensão, CA, atlética, grupo de estudos, empresa júnior; curso que não anda vira pergunta (grupo de estudos, trancar, largar e repensar, insistir). Medicina/cursos integrais continuam pesando pela semana e pela sobrecarga (REWORK 2).

**Depois.** O catálogo existente (pós, mestrado, doutorado, técnico, qualificação, volta aos estudos) foi reaproveitado; o que mudou é que a formação vivida pesa ali.

## 7. Pessoas na formação

- **Colega ≠ amigo** continua (a amizade pede gesto: `social`). A tela diz isso ("conviver não é ser amigo").
- **Professor**: um por instituição, só quando há motivo (atividade com anos ou resultado, nota muito alta, reforço). Vira NPC com papel (`Vinculo.formacao`), não amigo; faz **um** convite (a prova do IF, a olimpíada, o projeto, o laboratório, a iniciação, a monitoria). Professores e orientadores enquanto a formação dura não são alvo de flerte nem de "chamados de aproximação".
- **Depois da formação**: a turma sai com a formação para o trabalho (colegas ganham ocupação da área); anos depois, sem trabalho ou num trabalho aquém, uma ex-colega pode **indicar** ("estudou com você — faz 6 anos que não se viam"). O professor pode voltar uma vez, anos depois, numa mensagem.

## 8. Cidade

Reaproveitada: custo, salários, aluguel, transporte, oferta de cursos e vagas por porte, mudança com consequências ditas antes (emprego local acaba, faculdade presencial, parceria à distância — o sistema de distância do REWORK 2 continua). Nova: a cidade entra no perfil da instituição (mais laboratório/teatro/xadrez/fanfarra em cidade maior; parceria com empresas rara em cidade pequena) e no custo da origem.

## 9. Moradia e independência

- A saída de casa continua sendo escolha (imobiliária) e a mudança de cidade continua material.
- **Quem paga a casa** (Vida · Casa): sustentado, parcial, contribui, com ajuda da família, independente, dividindo a vida, ajuda a família, voltou. Derivado do estado; **não muda aos 18** (testado).
- Adulto que trabalha e mora com a família escolhe quanto põe em casa (combinado pela necessidade real da casa, mais, nada — "nada" pesa na relação), também pela conversa "As contas de casa".
- A primeira vez que as contas foram todas da pessoa entra na Linha da Vida (uma vez).

## 10. Imóveis e transporte

- Imobiliária: o resto das ofertas aparece logo abaixo (da mais barata à mais cara) em vez de escondido; "nada cabe" diz as duas formas de pagar e o motivo real (renda, idade, nome sujo). Compra à vista e financiada conferidas (três perfis de renda compram).
- Concessionária/usados/motos: carro que cabe no bolso de quem tem carteira aparece "para você" (antes nunca); sem carteira, a loja diz por quê e onde está a autoescola; o resto aparece listado.
- Veículo continua com efeito real (trajeto, custo mensal, oficina, elegibilidade de ofícios).

## 11. Apoio familiar

`apoioPossivel(v, motivo)`: até quanto a família consegue (reserva + margem do mês, mediada pela relação) e a chance de dizer sim (relação × necessidade − pedidos recentes). Não existe "pobre nunca ajuda" nem "rico paga tudo" (testado: a casa pobre ainda tem chance numa emergência; a rica e brigada ajuda menos). **Pedir** (a partir dos 16, uma vez por ano, só com necessidade concreta: emergência, estudo, mudança, dívida, recomeço) pode dar tudo, parte ou nada; o que sai, sai da reserva; um "não" pesa. A ajuda automática quando as contas estouram passou a usar a mesma conta (antes, multiplicador de classe). A família também **precisa**: casa de lá no limite pede ajuda a quem já saiu e tem renda; responder que sim volta para a reserva dela.

## 12. Lojas

Vida · Compras organiza lojas úteis por finalidade: Moradia (imobiliária), Transporte (concessionária, usados, motos e bicicletas, oficina, autoescola), Você (**ótica, roupas e acessórios** — nova), Dinheiro (banco), Animais (abrigo, loja). O que ainda não é para a idade aparece **bloqueado com o motivo**. Pendência 2 da base resolvida: ações de gestão do negócio (divulgar, estrutura, especializar, ampliar, abrir unidade…) sem caixa nem bolso aparecem bloqueadas com o motivo, em vez de sumir.

## 13. Personalização

`Visual` ganhou `bigode`, `oculos` (grau, redonda, sol), `chapeu` (boné, chapéu, gorro, lenço), `roupa` (básica, esportiva, social, alternativa, elegante); cores de tinta (platinado, vermelho, azul, rosa) e barba por fazer. O retrato desenha tudo (tinta não embranquece com a idade). **Você · Aparência e estilo**: prévia do rosto, corte, cor, barba, bigode, itens próprios (usar/guardar). Básico é de graça; itens são comprados e persistem (`eu.estilo`). Autonomia: antes dos 7, a família decide; até 12, sem raspar/pintar; barba a partir dos 16. Nenhuma moral. Cortar o cabelo não entra na Linha da Vida.

## 14. Aparência ≠ estilo ≠ notoriedade ≠ imagem pública

- Aparência: atributo (`corpo.aparencia`), intocado.
- Estilo: escolha (acima).
- Notoriedade: a do FIX, **reutilizada**, nenhuma variável nova de fama. Comprar relógio de luxo e guarda-roupa de grife não mexe nela (testado).
- **Imagem pública** (`notoriedade.imagemPublica`): só existe com notoriedade ≥ 20; discreta, querida (boa fase), marcante (visual marcante), desgastada (política), polêmica (escândalo público). Consumidor: patrocínio (×0,7 a ×1,2 — moderado) e a frase em Você. A mudança de visual de quem é conhecido pode virar assunto; de anônimo, não.

## 15. Caminho criminal

Sem profissão e sem botão universal. Novo: o jogo às vezes deixa você **perceber** (contexto: bairro, cidade grande, ter saído da prisão; gerador derivado, raro) que alguém da sua vida anda nisso; só com essa pessoa aparece a conversa "Perguntar a X sobre o dinheiro que ele faz por fora", que abre a proposta existente (`ilic_proposta`) — recusar, afastar-se ou aceitar. Daí seguem o que já existia: aprofundar ou parar (`ilic_rumo`), exposição, processo, prisão, pressão do grupo, recomeço (agora com o motivo "recomeço" para pedir ajuda à família). Nada operacional.

## 16. Nova navegação

Seis áreas **estáveis** (as mesmas aos 5, 15 e 32 anos; testado): **Linha da Vida · Você · Pessoas · Formação · Trabalho · Vida**. Dentro de Vida, seções internas: **Casa · Dinheiro · Compras · Tempo livre · Cidade** (duas linhas no celular, nenhuma escondida). Trabalho existe na infância e explica (quem sustenta a casa; aos 14, aprendiz). Formação muda o rótulo pelo contexto (Escola, Instituto Federal, Universidade, Especialização, "caminhos possíveis") sem mudar de lugar. O menu tem **"Onde fica cada coisa"**: o mapa de intenções (`MAPA_DE_INTENCOES`), que leva direto ao lugar — e é o mesmo mapa que os testes percorrem. Destinos antigos (`estudos`, `casa`, `tempo`, `cidade`) continuam aceitos pelos componentes. Ações seguem o padrão existente (botões com motivo quando bloqueados); nenhuma aba nova no topo.

Teste mental (cada um é um clique de área + seção): estudar/escola/faculdade → Formação; atividade escolar → Formação ("O que dá para fazer aqui"); falar com a mãe, namorar → Pessoas; emprego, profissão, negócio → Trabalho; futebol, treinar → Vida · Tempo livre (o time da escola, em Formação); carro/moto/bicicleta → Vida · Compras; procurar casa, sair de casa, onde moro → Vida · Casa; mudar de cidade → Vida · Cidade; dinheiro, ajuda da família → Vida · Dinheiro; cabelo, óculos → Você; história → Linha da Vida.

## 17. Migração (v17 → v18)

`migrarV17` (determinística, idempotente): reserva e bairro da origem pela semente e classe; contribuição = combinado (ausente); vivências só do que os fatos já diziam (medalha da olimpíada, grêmio em curso ou presidência, clube de ciências); estilo vazio; visual intacto. A cadeia antiga vai até a v16, passa pela v17 e chega à v18. Validação v18 dos campos novos. Saves v16 reais (fixtures) migram e seguem vivendo.

## 18. Testes

**726/726** (28 arquivos; baseline 684).

- `src/motor/__tests__/rework3.test.ts` (29): A origem → contexto (mesma cabeça, casas diferentes), escola A ≠ B, olimpíada → vivência → professor → convite → prova do IF (chance maior, sem garantia); B time da escola → futebol → peneira pelo professor de educação física, atividade some e vivência fica; C faculdade sem gesto não faz amigo próximo, o gesto existe; D professora → iniciação → orientação → vivência → mestrado; E projeto do IF → vivência da área → vaga técnica, "e o técnico, agora?"; F turma → ocupação da área → indicação anos depois (colega continua colega); G renda → contribuição → sair de casa → despesas → independência (biografia uma vez); independência não é automática aos 18; H mudança → emprego local acaba → parceria à distância; I bicicleta → conta → trajeto/custo; concessionária mostra o que cabe; J apoio: recursos + relação + necessidade + história, reserva que acaba, família que pede, criança não pede; K visual persiste no save, autonomia por idade; L luxo não dá fama; M imagem pública só com notoriedade, marcante mexe pouco no patrocínio, escândalo pesa mais; N crime perseguível só com contexto, recusar possível, não é profissão, perceber é raro; O save/reload igual e ano seguinte igual, v17 → v18 idempotente, saves v16 reais, determinismo; gestão sem dinheiro bloqueada com motivo.
- `src/ui/__tests__/navegacao.test.tsx` (13): seis áreas em três idades (topo e barra do celular, `barra--6`), Trabalho na infância, **todas as intenções do mapa** com cliques reais, menu "Onde fica cada coisa", atalho de dinheiro, Formação (instituição, atividades, "Entrar" dispara a rotina), Compras bloqueadas para criança com motivo, ótica sem promessa de fama, família em Dinheiro, Aparência (prévia + ação), retrato desenha o estilo.
- Testes antigos ajustados **só na premissa**, com comentário: versão 17 → 18; idempotência passando pela v18; navegação (Casa/Dinheiro/Tempo livre são seções de Vida; Estudos → Formação; a imobiliária mostra o resto sem botão); sementes cuja vida mudou (a vida de teste morreu antes da idade → semente seguinte; herdeiro nomeado pela decisão; vida "sem nome público" garantida no cenário; nota escolar fixada para comparar o cursinho; convite político medido em 24 vidas em vez de 12).

## 19. TypeScript, build, smoke

`tsc --noEmit` limpo. `npm run build` sem aviso de tamanho: o pacote dos sistemas passou de 800 kB com o REWORK; o que só a camada de cima usa (salvar, nascer, cuidados, usos, busca, estilo, independência, pausa, ambiente, empregabilidade, entrevista) foi para o pacote do conteúdo — sem ciclo entre pacotes (motor 721 kB, conteúdo 662 kB). Componentes cíclicos entre módulos do motor: os mesmos 5 da base. `build:itch` ok; **smoke itch.io 18/18**. Checagem visual (Playwright, 1440/820/390; criança, universitário, adulta; nove telas cada): sem rolagem horizontal, sem erro de página ou console.

## 20. Simulações (`scripts/sim/rework3.ts`, 40 vidas por grupo)

### A. Origem (a mesma semente em casas diferentes; estratégia "familiar")

| origem | idade | escolaridade (0–10) | renda própria mediana | fora de casa | patrimônio líq. mediano | humor | superior (cursando ou feito) | estudou em particular | folga da casa de origem |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| vulneravel | 15 | 2.2 | 0 | 0% | 36 | 72.18 | 0% | 0% | 0.45 |
| vulneravel | 25 | 7 | 2882 | 95% | 23900 | 74.63 | 100% | 0% | 1.6 |
| vulneravel | 40 | 7 | 4693 | 97% | 181178 | 69.05 | 100% | 0% | 1.77 |
| vulneravel | 60 | 7 | 8235 | 97% | 604186 | 71.29 | 100% | 0% | 0.74 |
| trabalhadora | 15 | 2.3 | 0 | 0% | 167 | 71.35 | 0% | 0% | 1 |
| trabalhadora | 25 | 7 | 2593 | 93% | 28017 | 75.43 | 100% | 5% | 2.05 |
| trabalhadora | 40 | 7 | 6910 | 95% | 294663 | 70.7 | 100% | 5% | 2.03 |
| trabalhadora | 60 | 7 | 7653 | 97% | 1327505 | 72.33 | 100% | 6% | 0.33 |
| media | 15 | 2.7 | 0 | 0% | 881 | 71.18 | 0% | 0% | 2.38 |
| media | 25 | 6.95 | 2763 | 90% | 33459 | 74.05 | 100% | 50% | 3 |
| media | 40 | 7 | 5314 | 97% | 242421 | 69.51 | 100% | 49% | 2.74 |
| media | 60 | 7 | 9105 | 100% | 1880724 | 71.17 | 100% | 50% | 0.31 |
| alta | 15 | 2.9 | 0 | 0% | 1867 | 72.68 | 0% | 0% | 3.48 |
| alta | 25 | 6.95 | 2533 | 92% | 29197 | 72.15 | 97% | 87% | 3.82 |
| alta | 40 | 7 | 6565 | 97% | 159358 | 70.69 | 100% | 87% | 3.46 |
| alta | 60 | 7 | 7074 | 100% | 2992004 | 75.47 | 100% | 88% | 0.38 |

### B. Formação (mesmas sementes; o que muda é o que a pessoa persegue)

| trajetória | IF (integrado) | técnico concluído | superior aos 25 | superior aos 40 | vivências/vida | com feito | professor na vida | iniciação científica | estágio/indicação pela formação | renda mediana aos 40 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| passiva | 0% | 0% | 0% | 0% | 0 | 0% | 0% | 0% | 0% | 0 |
| persegue estudo | 50% | 50% | 80% | 100% | 6.85 | 83% | 93% | 25% | 33% | 4898 |
| técnico (IF) | 8% | 95% | 100% | 100% | 0.13 | 3% | 3% | 0% | 21% | 5592 |
| trabalho + estudo | 0% | 0% | 100% | 100% | 0.64 | 0% | 23% | 0% | 28% | 10708 |
| volta aos 30 | 0% | 0% | 0% | 18% | 0 | 0% | 0% | 0% | 0% | 2723 |

### C. Vida material (estratégias típicas misturadas)

- Idade em que saiu de casa: mediana 23, de 19 a 37; nunca saiu até os 40: 13%; voltou para a família alguma vez: 26%.
- Aos 40: de aluguel 79%, com imóvel 5%, com veículo 49%; mudou de cidade alguma vez 18%.
- Família: recebeu ajuda 72%; ouviu um não 0%; ajudou a casa de origem 0%; a casa de origem pediu ajuda 8%.
- Independência aos 18: sustentado 23, contribui 15, parcial 2.
- Independência aos 25: independente 14, com_parceria 8, contribui 7, sustentado 7, voltou 2, ajudado 2.
- Independência aos 40: independente 20, com_parceria 11, sustentado 5, voltou 2, ajudado 1.

### E. Caminho criminal (mesmas sementes)

| grupo | teve proposta | entrou | processo | prisão | ganhos medianos (quem entrou) | ainda dentro aos 45 | imagem pública sem motivo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| vida comum (típica, nunca persegue) | 15% | 0% | 0% | 0% | 0 | 0% | 0% |
| exposta (jeito impulsivo), recusa quando aparece | 30% | 0% | 0% | 0% | 0 | 0% | 0% |
| aprofunda de propósito | 100% | 100% | 100% | 90% | 217700 | 30% | 0% |

**Leitura.**

- *Origem*: a mesma semente em casas diferentes chega a lugares parecidos em escolaridade e renda (com a mesma estratégia), mas por **contextos** diferentes: escola particular 0% × 87%, folga da casa de origem 0,5 × 3,5 na adolescência, patrimônio aos 60 de 0,6 mi a 3 mi. A origem muda o caminho e o patrimônio; não escreve a escolaridade nem a renda (medianas aos 40 entre R$ 4,7 mil e R$ 6,9 mil em todas as origens, sem ordem de classe).
- *Formação*: perseguir estudo produz vivências (6,9 por vida), resultados (83%), um professor na vida (93%), iniciação científica (25%), portas de estágio/indicação pela formação (33%) e IF (50%). O passivo não ganha nada disso — sem vivência nem porta "caída do céu". Quem trabalha e estuda chega ao superior e ganha mais aos 40; quem volta aos 30 conclui menos (18%).
- *Vida material*: ninguém sai de casa aos 18 por regra (mediana 23, de 19 a 37; 13% ainda com a família aos 40); 26% voltam em algum momento; aos 18, a maioria está sustentada ou contribuindo, não "independente".
- *Crime*: vidas comuns nunca entraram; a proposta chega a 15% (30% com o jeito impulsivo) e é recusada; quem aprofunda de propósito entra, é processado (100%) e preso (90%) — o crime não domina vidas normais e nunca é a estratégia melhor.
- *Ajuda*: "ajudou a casa de origem 0%" com "pediu 8%": as estratégias do simulador não respondem chamados (o caminho existe e é testado em `rework3.test.ts`, J).

## 21. Auditoria adversarial curta

| Procurado | Encontrado / corrigido |
| --- | --- |
| tela A diz X, tela B diz Y | o dinheiro de Você é atalho com a MESMA leitura de Vida · Dinheiro; o perfil da vaga mostra a mesma conta de vivência que a seleção usa |
| escola mostra oportunidade inexistente | "O que dá para fazer aqui" lista só rotinas do perfil; o que a idade/semana não permite aparece bloqueado com motivo |
| origem sem consequência | mesada, contribuição, mensalidade, cursinho, ajuda automática, pedido, escola e texto do bairro leem a origem real |
| dinheiro não afeta compra / morar sozinho sem custo / veículo sem efeito | conferidos (G, I) |
| faculdade desconectada do trabalho | vivências na chance e no texto da vaga; estágio pela orientadora; indicação da turma |
| colega virando amigo | formatura não muda estágio; professores fora de flerte e de "aproximação" |
| professor eterno | um por instituição, um convite; depois, só memória (e no máximo uma mensagem anos depois) |
| personalização perdida / item dando fama / anônimo com imagem pública | testados (K, L, M) |
| criança decidindo como adulto | autonomia central; compras, pedir ajuda, visual, moradia bloqueados por idade com o motivo |
| independência automática aos 18 / apoio infinito | testados (G, J); a ajuda automática de classe foi trocada pela reserva real |
| crime como profissão / menu universal | não existe ocupação nem botão; só a conversa com quem você percebeu |
| navegação por adivinhação | seis áreas fixas; mapa de intenções no menu e nos testes |
| **achado extra**: fato `gremio_eleito` era lido pela política e nunca escrito | a eleição do grêmio agora marca o fato |
| **achado extra**: a concessionária abria vazia para quem podia comprar | corrigido na relevância |

## 22. Pendências encontradas

- **Casa própria nas simulações** é rara aos 40: as estratégias do simulador tentam imóveis por tipo (`apto_2q`), que não cabem na renda típica; a compra por oferta funciona (conferida em três rendas). Calibrar acesso à casa própria (programa habitacional, herança) é trabalho de economia, não de navegação.
- **Ajuda automática da família** quando as contas estouram é frequente (a maioria das vidas típicas recebe alguma até os 40). Agora gasta a reserva real; a frequência merece a simulação grande.
- **Propostas ilícitas** chegam a uma parte das vidas típicas até os 45 (sistema anterior, inalterado); nenhuma vida comum entrou. Revisar na simulação de mil vidas.
- Um professor por instituição (por escolha de escopo); o retrato desenha chapéus de forma simples.
- Pendências da base não tocadas: (1) testes frágeis por semente (os que quebraram foram ajustados na premissa, os demais continuam), (3) economia de mercado de ator de TV, escritor, artista visual e dançarino de companhia, (4) frequência de estrelas do futebol.

## 23. Deliberadamente adiado

Rede social (seguidores, postagem, monetização, verificação), centenas de roupas, editor complexo, cirurgia estética, simulador bancário, mercado imobiliário especulativo, dezenas de veículos por categoria, módulo exclusivo para todas as profissões, ATT4, ATT5 (polimento visual, microanimações, acessibilidade final), reescrita da Linha da Vida, conteúdo operacional de crime, multiplayer, monetização.
