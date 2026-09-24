# Auditoria e expansão dos Caminhos de Vida

Etapa entre a ATT 3 (Vida Material) e o PLAYTEST #3.
Branch `claude/caminhos-de-vida-expansao`, a partir de `b0dc7a9` (ATT 3, save v10). Save agora **v11**.

A pergunta era: *o VIDA permite muitas formas de viver, ou só tem muitos nomes de profissão?*
A resposta da auditoria foi: **as duas coisas**. Havia caminhos profundos (esporte, ofício por freguesia,
concurso como processo), mas havia famílias inteiras que eram só nomes (a PM e os oficiais das Forças
nunca apareciam em 180 vidas), caminhos inteiros ausentes (crime e justiça, cuidado não remunerado) e
um mercado de trabalho congelado em 2026 (três ocupações com época, em vidas que chegam a 2120).

---

## 1. Linha de base (antes)

Simulador da ATT 2 (`scripts/sim/caminhos.ts`, 180 vidas, 12 estratégias), no HEAD da ATT 3:

- 163 ocupações; **46 nunca apareceram**, entre elas **a carreira inteira da PM**, bombeiros, oficiais
  do Exército (tenente, capitão, major), delegado, analista judiciário, produtor rural, criador de
  conteúdo, músico profissional, psicólogo, médico especialista.
- Aos 35: gerente de loja 7%, 5 ocupações somavam 29%; a estratégia "empreendedor" abria **salão** em 9 de 15 vidas.
- Alistamento militar **só para homens** (bloqueio por gênero, contra a regra do projeto).
- Nenhum sistema de ilegalidade, justiça ou prisão. Nenhuma pausa de carreira para cuidar de alguém.
- Promoção de professor concursado levava a coordenador **CLT** (servidor virava empregado de empresa).
- Bombeiro não tinha degrau acima (a escada pulava um nível): trinta anos sem promoção.
- O peso do trabalho na cabeça era uma tabela fixa por ocupação (`(estresse − 2) × 4`).

Os saves v10 reais foram gerados com o motor da ATT 3 (worktree em `b0dc7a9`): em 500 vidas por alvo,
**nenhuma** chegou a carreira militar de praça/oficial ou a produtor rural — o que confirma a auditoria.

---

## 2. Catálogo e classificação interna

210 ocupações (163 → 210) em **23 famílias de carreira** (`src/motor/dados/carreiras.ts`). A família é
o que dá identidade além do nome e do salário: como se entra, como se cresce (modelo de progressão),
como a renda se comporta, o que desgasta, o que dá sentido, o custo de trabalhar, exposição à automação
e à expansão, e as saídas naturais (segunda carreira). A classificação é ferramenta de desenvolvimento;
o jogador nunca a vê.

A profundo · B funcional, pede aprofundamento · C reskin · D quase ausente · E ausente e importante

| Família | Antes | Depois | O que mudou |
|---|---|---|---|
| Comércio e vendas | B | B | comissão (renda variável para quem vende); automação do varejo |
| Escritório e finanças | C | C+ | compartilhamento consciente da família; CRC para contador; ondas e automação 2032–2065 |
| Transporte e logística (plataforma) | C | B− | custo do veículo de trabalho; motofretista, motorista de caminhão; direção automatizada gradual 2058+ |
| Cozinha | B | B | padeiro; o próprio negócio |
| Beleza | B | B | custo de material/cadeira |
| Ofícios de obra e conserto | B | A− | encanador, marceneiro, pintor, refrigeração, celular, costura; ferramenta; MEI; empreiteira, marcenaria; ondas |
| Indústria | C | B− | automação 2030–2065; "técnico de sistemas automatizados" surge em 2034 |
| Tecnologia | C | B− | ondas a cada ~7 anos; consultoria própria; portfólio > diploma |
| Saúde | C | B | plantão (jornada própria), anuidade, consultório/clínica como negócio, sentido de cuidar |
| Cuidado e trabalho doméstico (pago) | C | B | trabalhador(a) doméstico(a) (LC 150/2015), babá, limpeza; expansão com o envelhecimento |
| Portaria, zeladoria, vigilância | D | B− | porteiro (plantão, encolhe com a automação), zelador, supervisor de segurança |
| Ensino | C | B | progressão por titulação e tempo (não "gerente"); direção por eleição/função; substituto com prazo; educação infantil |
| Ciência e universidade | D | B− | pós-doutorado com prazo (instabilidade), instituto público por concurso |
| Direito | B− | B− | anuidade, escritório (custos) |
| Engenharia e arquitetura | C | C+ | anuidade e custos de quem trabalha por conta |
| Serviço público | C | B | estágio probatório, progressão trienal, adicional de titulação, função de chefia, remoção implícita por concurso |
| Segurança pública | D | B | PM alcançável (CNH até a formatura), polícia penal, perícia, PRF, oficialato da PM, plantão, ficha limpa, escada do bombeiro |
| **Forças Armadas** | C | **A−** | ver §3 |
| Campo e água | D | B | terra (família, arrendada, própria), safra regional, cooperativa, crédito rural, pesca com defeso, drones agrícolas |
| Imagem, texto e internet | C | C+ | editais; estúdio; custo de equipamento |
| Música, cena e dança | B− | B | editais de cultura, trabalho paralelo, reconhecimento gradual |
| Esporte | B | B | preparador físico, professor de artes marciais como saídas |
| Rua, feira e bicos (informal) | C | B | feirante (pede estrada), catador → cooperativa, MEI, renda que oscila |
| **Envolvimento ilegal e justiça** | E | B | ver §4 |
| **Cuidado não remunerado** | E | B | ver §5 |
| Desemprego e subemprego | B− | B− | pausa ≠ desemprego; bicos; ficha de egresso |
| Mudança de carreira / segunda carreira | B− | B | decisão de segunda carreira (40–58), ondas, saídas por família |
| Carreiras futuras | D | B− | ondas de transformação por família; automação e expansão por época; ocupações que surgem |

**Diversidade funcional** (`scripts/sim/diversidade.ts` — "tirando nome e salário, ainda parecem diferentes?"):
165 assinaturas distintas para 210 ocupações (79%). Dos 32 grupos com a mesma assinatura, 28 são degraus
da mesma família (esperado). Os que atravessavam famílias foram tratados: contador ganhou registro próprio
(CRC) e vendedor ganhou comissão. Restam, conscientemente: estágio de escritório × estágio de TI (é a mesma
fase da vida) e produtor audiovisual × produtor musical (mesma vida de freelancer criativo).

---

## 3. Carreira militar (antes → depois)

**Antes**: só Exército; alistamento só masculino; temporário até 26 anos; sargento e cadete por concurso;
promoção pela escada genérica; reserva = aposentadoria com outro nome. Oficiais nunca apareciam.

**Depois** (`sistemas/militar.ts`, `dados/forcas.ts`) — fontes: Lei 4.375/1964, Decreto 12.154/2024
(serviço militar inicial feminino voluntário, alistamento desde 2025), Lei 13.954/2019 (temporário até
8 anos; reserva a pedido com 35 anos de serviço):

- **Três Forças, uma arquitetura**: Exército, Marinha, Aeronáutica, com nomes de posto próprios
  (sargento da Marinha, suboficial, capitão-tenente, capitão de corveta…), escolas (escola de sargentos,
  escola de especialistas em São José dos Campos, Escola Naval, AFA) e guarnições próprias. A Força do
  serviço inicial vem do lugar; a de carreira, do edital prestado.
- **Serviço inicial**: obrigatório para homens, voluntário para mulheres (seleção concorrida); 12 meses,
  engajamento ano a ano, **baixa obrigatória aos 8 anos** sem estabilidade; curso de cabos.
- **Carreira**: concurso → **formação longe de casa, em internato** (a mudança acontece) → **especialidade
  escolhida** (combatente, manutenção, comunicações, saúde, administração, música — que conta pela metade
  como experiência civil) → primeira guarnição (às vezes vila militar).
- **Progressão por antiguidade, conceito e cursos**: graus de sargento pelo tempo; subtenente e major
  pedem **curso de aperfeiçoamento**, postos altos pedem **altos estudos** e são **disputados**
  (preterição existe); **teste físico anual** — quem não passa, espera.
- **Oficial**: academia (idade-limite) ou **quadros técnico e de saúde** para graduados (até ~36 anos).
- **Transferências**: a movimentação chega a cada ~3 anos; a família decide — ir todos (a parceria perde
  metade da renda e recomeça; filhos trocam de escola; às vezes imóvel funcional), ir sozinho (a relação
  vira distância), pedir adiamento (uma vez por guarnição), sair.
- **Reserva**: a pedido com 35 anos, ou compulsória pela idade do posto; remuneração do posto; o imóvel
  funcional é devolvido; decisão de **segunda carreira** (vigilância, logística, administração, ensino
  técnico, a trilha da especialidade) ou estudo/concurso civil.
- **Sair antes**: temporário dá baixa; de carreira pede demissão — oficial formado há pouco **indeniza** a formação.

Simulação (perfil militar, 20 vidas): 75% entraram na carreira de praça; mediana de **6 transferências**
na carreira; postos finais majoritariamente subtenente/suboficial; reserva e segunda carreira aparecem.
Biografia lida: EEAR em São José dos Campos → sargento da Aeronáutica → transferida para Curitiba →
graus pela antiguidade → suboficial aos 36 → reserva compulsória aos 56 → segunda carreira administrativa.

---

## 4. Envolvimento ilegal, justiça e prisão

Não há profissão "criminoso" nem tutorial: o jogo nunca descreve como se faz, se esconde, se vende ou se
engana. Fala em "um esquema", "dinheiro por fora", "gente que você preferia não conhecer".
(`sistemas/ilicito.ts`, `sistemas/justica.ts`, decisões em `conteudo/trajetorias.ts`.)

- **Entrada**: chance anual pequena (teto 5%), feita de contexto — quem está por perto (um conhecido de
  pouca responsabilidade, um contato antigo), necessidade (desemprego longo, contas atrasadas), impulso
  (traço construído pelas escolhas), bairro e cidade, passado. **Pesam contra**: trabalho formal, rede de
  apoio, escola indo bem, disciplina, empatia. A porta vira uma **decisão com recusa** (e "recusar e se
  afastar"). Criança nunca; adolescente, só "coisas erradas com a turma".
- **Categorias abstratas**: pequenos delitos, receptação, fraude (**só para quem tem acesso** — finanças,
  escritório, serviço público, o próprio negócio: gente de classe média também erra), comércio ilegal,
  grupo criminoso.
- **Escalada**: a cada dois anos, seguir, ir mais fundo, parar — ou parar e mudar de cidade (corta os
  contatos). No grupo, sair custa pressão (acontecimentos, cabeça).
- **Risco**: exposição cresce ano a ano; descoberta abre processo; confusões e sustos (saúde); tensão
  com a parceria; a cabeça pesa. Mesmo depois de parar, **uma investigação antiga pode chegar**.
- **Justiça**: defesa pública ou particular (paga com o que se tem); espera presa nos casos graves;
  sentença: absolvição, **pena alternativa** (primário, sem gravidade — Código Penal, art. 44) ou prisão
  (anos por categoria, reincidência pesa); regime fecha e abre (semiaberto); **remição** por estudo e
  trabalho (LEP, art. 126); adolescente: **medida socioeducativa, sem ficha de adulto** (ECA).
- **Prisão muda a vida**: emprego acaba; semana é a da unidade; atividades possíveis são ler, escrever,
  desenhar, xadrez, o culto; convívio some (visitas não são convívio); parceria pode ir embora; saúde e
  forma caem; o orçamento cobra só as dívidas e o que a família leva nas visitas; o aluguel de quem
  morava só se encerra.
- **Saída**: decisão do "lado de fora" — programa de apoio a egressos (porta com vaga de carteira),
  estudar, recomeçar em outra cidade, ou **procurar os contatos de antes (reincidir)**. A ficha
  **fecha para sempre** a segurança pública e as Forças (idoneidade) e **pesa na contratação com
  carteira** (menos com o tempo e com estudo/trabalho depois); não fecha trabalhar por conta.
- **Nunca estratégia dominante**: renda com teto; patrimônio aos 50 anos das estratégias que aceitam
  propostas não supera o da vida convencional de forma consistente; prisão média de 5,7 anos entre quem foi preso.

Métricas (400 vidas): 26% receberam alguma proposta ao longo da vida (baixa renda 36%, média/alta 18%
fora dos perfis de crime — contexto, não destino); 20% recusaram alguma; 6% entraram; 2% presos; 3%
pena alternativa; 2% reincidiram; fraude 1%.

---

## 5. Cuidado não remunerado

`sistemas/pausa.ts`. Não é profissão: é trajetória.

- Decisões: **depois da licença** (voltar com creche/família, reduzir a jornada, parar enquanto é
  pequeno, ou **a parceria reduz**), **um familiar precisa de alguém** (reduzir, parar, cuidadora, dar
  conta dos dois), os pais idosos ganharam a opção de cuidar de perto; e o ritmo voluntário ("Mudar o
  ritmo do trabalho", recolhido).
- **Parcial**: salário ×0,6, semana com mais folga. **Total**: o trabalho pago acaba, o INSS para — a não
  ser que se pague como **facultativo** (11% do mínimo, entra no orçamento).
- Cabeça (o cuidado de todo dia) **e** humor (estar perto quando importa); proximidade com quem é
  cuidado; "cuidou até o fim"; quem tinha uma carreira de 10+ anos sente falta com o tempo.
- **Voltar**: quando a necessidade muda, a vida pergunta; o primeiro emprego encerra a pausa; uma
  ex-colega às vezes indica na antiga área; o tempo parado pesa na entrevista.

Métricas: 20% das vidas pausaram ou reduziram; 15% voltaram; em 5% foi a parceria quem reduziu.

---

## 6. Informal, ofícios, campo

- **Informal**: feirante (pede estrada), catador → cooperado de reciclagem, ambulante; renda que oscila;
  **MEI** (decisão depois de 2 anos e botão): passa a contribuir, guia no orçamento, alguns clientes a
  mais. 31% das vidas formalizaram em algum momento.
- **Ofícios**: aprendiz → profissional → mão de confiança → por conta, com equipe (empreiteira,
  marcenaria); custo de ferramenta; ondas de atualização (elétricos, instalações).
- **Campo** (`sistemas/rural.ts`): terra da família, arrendada (custo) ou própria (sítio, à vista ou
  com crédito rural a juro menor); **safra da região e do ano** (a mesma para todos no estado);
  cooperativa suaviza extremos; dois anos ruins pedem decisão (diversificar, cooperativa, largar,
  aguentar); pesca artesanal só onde há água, com **seguro-defeso**. Perfil rural: 90% no campo aos 50.

## 7. Arte e esporte

- **Editais de cultura** para quem pratica e tem obra: inscrição com chance pela habilidade e pelo
  público do projeto; aprovação dá dinheiro e público; reprovação dá devolutiva. Trabalho paralelo +
  reconhecimento gradual aparece em 27 vidas.
- Esporte: a peneira e a base continuam raras (profissional em 2 de 400); **saídas** novas —
  preparador físico (com Educação Física), professor de artes marciais.

## 8. Setor público e segurança

- Servidor: estágio probatório, progressão a cada 3 anos, **adicional de titulação** (pós, mestrado,
  doutorado), **função de chefia/direção** (eleita na escola), outro concurso; servidor não "vira" CLT.
- Segurança: PM alcançável; bombeiro com escada; polícia penal, perícia, PRF, oficialato da PM;
  plantão; ficha limpa; perfil segurança: 55% entraram (PM 7, penal 4, guarda 2 em 20 vidas).

## 9. Empreendedorismo e profissões liberais

13 tipos de negócio (eram 4): além de salão, oficina, lanchonete e comércio — loja on-line, empreiteira,
marcenaria, estúdio, consultoria de tecnologia, escritório de contabilidade (CRC), consultório de
psicologia (CRP), clínica de fisioterapia (CREFITO), clínica veterinária (CRMV). Sociedade com amigo só em
ramo livre. Negócio aberto em 29% das vidas; 81 vidas com "pequeno negócio → crescimento", 18 com "negócio
→ fracasso → emprego".

## 10. Segunda carreira e reinvenção

Decisão "a mesma estrada" (38–58 anos, depois de 12+ anos na área e com a cabeça/humor sentindo):
área vizinha (as saídas da família), voltar a estudar, concurso, ficar. Ondas de transformação também
abrem "aproveitar para mudar". Mudança de área depois dos 40: 45% das vidas; estudar depois dos 30: 8%.

## 11. Integrações

- **ATT 1 (pessoas)**: transferência leva ou separa a família; prisão afasta, parceria pode terminar;
  a parceria pode ser quem reduz para cuidar; desemprego longo pesa na relação; o "por fora" também.
- **ATT 2 (caminhos)**: concursos e processos reaproveitados (perfis novos, formação com mudança);
  oportunidades novas (egressos, retorno, segunda carreira); devolutivas (editais).
- **FIX pós-playtest 2 (estado pessoal)**: o trabalho na cabeça é **contextual** (os anos acostumam;
  trabalho indo mal, plantão, freguesia magra, jornada reduzida mudam o peso); **sentido** no humor
  (fazer o que gosta; cuidar de gente); prisão, processo, ficha, pressão, cuidado — tudo com nome.
- **ATT 3 (vida material)**: custo de trabalhar por conta, anuidades, DAS do MEI, INSS facultativo,
  arrendamento, crédito rural, sítio como bem, vila militar como moradia cedida, orçamento da prisão.

## 12. Testes

259 testes (218 → 259): 38 de motor em `__tests__/trajetorias.test.ts` (Forças Armadas — alistamento
por gênero, temporário 8 anos, formação e especialidade, antiguidade/curso/TAF, transferência com e sem
família, reserva e indenização; segurança; ilegalidade — contexto e teto, pobreza não garante, fraude só
com acesso, dinheiro e exposição, processo, antecedentes e idoneidade, prisão, remição, ECA, saída e
reincidência, teto do ganho; cuidado — parcial, total, facultativo, retorno; MEI; campo e pesca; serviço
público; ondas e peso contextual; famílias; gênero; cidade; save v11 e determinismo) e 3 de interface
(`ui/__tests__/trajetorias.test.tsx`). Testes antigos que dependiam, por acaso, da vida sorteada de uma
semente (morar sozinha aos 24; o amigo mais próximo; a química entre duas pessoas diferentes) foram
tornados explícitos, sem mudar o que verificam.

## 13. Simulações

`scripts/sim/trajetorias.ts` — 20 estratégias (acadêmico, técnico, ofício, informal, servidor, militar,
segurança, artista, atleta, empreendedor, autônomo, rural, cuidador, crime, crime com saída, convencional,
mudança tardia, volta aos estudos, "tentado" (escritório sob pressão), pouco engajado) × 20 vidas = 400.
Toda ação passa por `disponibilidade`; nada é forçado.

- **Concentração**: aos 50, 22 das 23 famílias com gente trabalhando; maior fatia 16%; HHI 0,091
  (antes: 5 ocupações somavam 29% aos 35).
- **Estratégias produzem vidas diferentes**: aos 50, quem escolheu o ofício está no ofício (17/20), o
  militar na farda (13/20), o rural no campo (18/20), o servidor entre saúde e serviço público, o artista
  entre palco e sala de aula, o atleta majoritariamente fora do esporte — como na vida.
- Ocupações alcançadas por alguém: 127 de 210. As que não aparecem são, na maioria, topos disputados
  (médico especialista, delegado, auditor fiscal, coronel), oficialato (nenhuma estratégia de oficial) e
  apps (exigem veículo que nenhuma estratégia compra). Ver limitações.
- **As vinte histórias pedidas foram encontradas** (quantas vidas): universidade → profissão 15;
  técnico → ofício → autonomia 66; trabalha cedo → estuda aos 30+ 11; serviço militar → carreira →
  reserva → segunda carreira 9; tenta carreira militar e não entra 6; esporte → profissional 2; esporte →
  fracasso → outra carreira 17; arte + trabalho paralelo 27; concurso depois de várias tentativas 23;
  negócio → crescimento 81; negócio → fracasso → emprego 18; informal → formalização 125; carreira rural
  29; cuidado → retorno 60; crime → consequência → saída 1; crime → reincidência 9; convencional →
  fraude → consequência 1; mudança aos 40+ 178; aposentado trabalhando 152; vida sem prestígio, coerente 250.
- **Coerência**: nenhuma violação nas 400 vidas (ficha limpa, regime fechado sem emprego, registro
  profissional, pausa × emprego).

## 14. Biografias lidas e problemas encontrados

Lidas por inteiro: militar da Aeronáutica; crime persistente (reincidência com penas crescentes);
crime com saída (declínio no comércio → esquema aos 42 → sai → investigação antiga → prisão com estudo →
obra, campo, cooperativa, aposentadoria); fraude tardia (contador → fraude → justa causa → pena
alternativa → volta à contabilidade); cuidado (parar para cuidar da mãe → retorno); rural (técnico
agrícola → loja on-line → agronomia aos 51); comércio próprio com esquema e pena alternativa.

Corrigido a partir delas: pausa que sobrevivia ao emprego; duas pausas no mesmo ano com textos
contraditórios; transferências que só aconteciam uma vez (fato nunca limpo); "em Aeronáutica", "em a rede
municipal", "Em o Corpo de Bombeiros", "processo por o comércio"; "12 anos como gerente" (contava desde
o primeiro dia na empresa); empresa que "fechou por e-mail" sendo fazenda; propostas ilícitas frequentes
demais (44% → 26%); feirante como atalho universal; pesca sem exigência; recusar a banda por preferência
genérica; sociedade com amigo abrindo consultório sem registro; ciclo de importação frágil entre
dinheiro e trabalho (constante do INSS facultativo movida para `renda.ts`).

## 15. Playtest visual

`scripts/playtest/gerarTrajetorias.ts` + `trajetorias.mjs` — Chromium real, **320 / 390 / 820 / 1440**,
14 cenários: técnico, militar, artista, atleta, servidor, autônomo, informal, empreendedor, rural,
cuidadora, envolvido, preso, egresso, mudança aos 40+. Telas: Estudo e trabalho (lado Trabalho),
"Mudar o ritmo" aberto, Tempo livre, Você, Linha da Vida.

Verificação automática: **nenhuma** rolagem horizontal, botão fora da tela, CTA cobrindo conteúdo,
botão sem nome ou alvo de toque < 32 px. Inspeção das capturas → corrigido: "Procurar trabalho" em regime
fechado (escondido); texto da pena duplicado; MEI aparecendo desabilitado para militar/produtor
(agora some); "Onde: a própria terra" em terra arrendada; "varia com a freguesia" para quem vive da safra;
"clientela fiel" para produtor; pausa sem pessoa dizendo "dos filhos".

Poluição: as ações novas entram **só quando se aplicam** (Situação: pena, pausa, campo, "por fora");
reduzir/parar fica recolhido em "Mudar o ritmo"; MEI só para quem trabalha por conta.

## 16. Save e migração

**v11**. `migrarV10`: quem está nas Forças ganha a carreira militar (Exército, quadro pelo posto, ingresso
pelo primeiro posto militar, guarnição onde mora, majores com aperfeiçoamento); quem produz no campo ganha
a vida rural (terra da família se algum parente vive disso); formados em Contábeis ganham o CRC; justiça,
envolvimento, pausa, MEI começam vazios. Cadeia completa v5 → … → v11 preservada. Testado com **saves v10
reais** gerados pelo motor da ATT 3 (soldado, família com filhos, aposentada) e com estados derivados
deles (sargento, produtor rural). Save inválido continua indo para backup.

## 17. Limitações restantes

- Nenhuma estratégia do simulador persegue o **oficialato** (os testes cobrem academia, quadro técnico,
  promoções e reserva de oficial); topos disputados (médico especialista, delegado, auditor) seguem raros.
- **Apps de entrega/transporte** exigem veículo; as estratégias não compram veículo, então não aparecem na
  simulação (no jogo, estão lá).
- Egressos raramente voltam à **carteira assinada** na simulação (0 de 7 com carteira, 1 por conta):
  coerente com o peso da ficha, mas pode estar duro demais — observar no playtest.
- A Marinha usa a mesma escada de praça das outras Forças (a entrada real por aprendiz-marinheiro foi
  abstraída). Idades-limite e interstícios são plausíveis, não oficiais.
- Crescimento de negócio (contratar gente, segunda unidade) continua fora — o negócio firma ou aperta.
- O relatório da ATT 3 citado no README (`ATT3-VIDA-MATERIAL-REPORT.md`) nunca foi escrito naquela etapa.
- Repetências escolares extremas (9 no médio) aparecem em perfis "relaxados": sistema anterior, fora do escopo.

## 18. Critério final

- *Muitas maneiras realmente diferentes de construir uma vida?* Sim: 23 famílias com modelos de
  progressão distintos; nenhuma passa de 16% aos 50; as estratégias levam a vidas diferentes.
- *Carreiras com identidade além de nome e salário?* Na maioria: 79% das ocupações com assinatura própria;
  as coincidências restantes são degraus ou compartilhamento consciente.
- *Faculdade é só uma das rotas?* Sim (superior em 19% das vidas; técnico, ofício, concurso, farda, campo,
  negócio, arte e informalidade levam a vidas completas).
- *Fracassar e mudar de direção; reinventar-se aos 30, 40, 50?* Sim (segunda carreira, ondas, retorno
  depois de cuidar, estudo tardio, reserva → segunda carreira).
- *Crime como risco e consequência, sem tutorial nem estratégia dominante?* Sim.
- *A carreira militar parece militar?* Sim: formação em internato, especialidade, antiguidade e cursos,
  teste físico, transferências que mexem com a família, vila militar, reserva e segunda carreira.
- *Uma vida modesta ainda parece completa?* Sim — é a história mais comum (250 de 400).

Considero os Caminhos de Vida suficientemente diversos e profundos para o PLAYTEST #3, com as observações
das limitações (egressos, oficialato e apps merecem atenção do playtest humano).

### Como rodar

```bash
npx esbuild scripts/sim/trajetorias.ts --bundle --platform=node --outfile=/tmp/traj.cjs
VIDAS=20 SAIDA=/tmp/traj node /tmp/traj.cjs          # SEMENTE=9919 PERFIL=crime_saida para uma vida
npx esbuild scripts/sim/diversidade.ts --bundle --platform=node --outfile=/tmp/div.cjs && node /tmp/div.cjs
npx esbuild scripts/playtest/gerarTrajetorias.ts --bundle --platform=node --outfile=/tmp/gt.cjs && SP=/tmp/vida-traj node /tmp/gt.cjs
npm run build && npx vite preview --port 4173 &
SP=/tmp/vida-traj node scripts/playtest/trajetorias.mjs
```
