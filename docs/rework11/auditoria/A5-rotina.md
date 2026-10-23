# A5 · Agenda, horas de trabalho, conflitos, estresse e felicidade (REWORK 11 · ROT-11.1–11.3)

Auditoria somente leitura em `/mnt/c/Daniel/vida-game` (branch `claude/fix-pos-rework3-playtest`, HEAD 2523d86).
Simulações em `/tmp/claude-1000/-mnt-c-Daniel-vida-game/9c4bf282-49c3-474b-9605-9c7c6a47a56d/scratchpad/aud5/`:
`horas11.ts` (horas por ocupação, pet), `feliz11.ts` (16 jogadores profissionais × 14 anos), `migr11.ts` (mudanças seguidas de país).

## Resumo das causas

| Sintoma | Camada culpada | Onde |
|---|---|---|
| Auxiliar técnico com Seg–Sex 6h–22h (80 h) | **Geração da agenda** (regra fixa por `jornada: 'fora'`). As horas não são salvas, a renderização mostra fielmente o que recebe, e a ocupação está correta | `src/motor/sistemas/agenda.ts:167`; dados em `src/motor/dados/ocupacoes.ts:96,409-416` |
| "Cuidar de Sunny" às 21h em cima do trabalho até 22h | **Bloco fixo de horário fixo** (21h–21h30, todo dia, obrigatório, não móvel), que não procura horário nem deixa outra pessoa cuidar | `src/motor/sistemas/agenda.ts:280-282` |
| Mudanças antigas de país "somando" | Abalo de +10/+18 aplicado direto em `mente.estresse`. O equilíbrio retém 70% ao ano, então mudanças seguidas se empilham, e o resíduo some da leitura depois de 24 meses (o número fica alto sem causa nomeada). A adaptação tira felicidade sem aparecer como fator | `migracao.ts:273,307,405`; `estado.ts:75-91`; `ano.ts:274-280` |
| "quase nada da semana sobra para você" com o emprego dos sonhos | `semana_apertada` vem só da soma de **pesos** (`semana.ts`), sem olhar as horas reais da agenda nem o sentido do trabalho | `estado.ts:198,332`; `semana.ts:128-133` |
| Campeão nacional e capitão com felicidade baixa | **Não existe fator de conquista** em `fatoresHumor` nem abalo positivo de título. Só há abalos negativos (rebaixamento, perder posição, demissão), e a fama só pesa na cabeça (`exposicao`) | `estado.ts:218-279`; `palmares.ts:169`; `esporte.ts:1086`; `tecnico.ts:426,467` |

---

## ROT-11.1: horas de trabalho por profissão

### Como as horas são definidas
- Não existe um campo de horas. `Ocupacao.jornada?: 'longa' | 'fora' | 'plantao'` (`ocupacoes.ts:96`) é o único dado. `blocosDoTrabalho` (`agenda.ts:144-185`) transforma isso em blocos, nesta ordem de regras:
  1. curso de formação: Seg–Sex 7–18 (`:153`)
  2. eletivo: Seg–Qui 9–19 (`:154`)
  3. `trilha === 'atleta'`: treino 2 períodos + jogo no domingo (`:155-159`)
  4. `plantao`: Seg/Qua/Sex 7–19 + domingo alternado (`:166`)
  5. **`fora`: Seg–Sex 6h–22h, "dias fora de casa" (`:167`)** ← o bug
  6. `longa`: Seg–Sex 7–19 + sábado 7–12 (`:168`)
  7. parcial: um turno de 4 h (`:169-180`)
  8. padrão: Seg–Sex 8–17 (+2 h de horas extras) (`:181-184`)
- `jornada: 'fora'` foi escrita para dizer "viaja, passa dias longe de casa" (texto em `profissao.ts:405`, `Trabalho.tsx:973`), mas a agenda a lê como "trabalha 16 h por dia".
- `v.agenda` guarda só `turnos`, `lugares` e `avisados` (`agenda.ts:15-19`). As horas não são persistidas, então a correção **não precisa de migração de save**.
- A UI (`ui/jogo/Agenda.tsx:58,133-142`) desenha `agendaDaSemana(vida).blocos` como recebe: a renderização está correta.
- A ocupação (`avaliacaoDaRotina.folgaNosHorarios`, `avaliacaoDaRotina.ts:64-80`) está correta sobre blocos errados.
- A conversão compromisso→bloco também está correta. O erro está na tabela de horas.

### Horas medidas (sim `horas11.ts`, adulto de 30 anos, Recife)
| Ocupação | jornada | Blocos gerados | h/sem | peso em `semana` | `semana_apertada` |
|---|---|---|---|---|---|
| assistente/analista adm (escritório) | – | Seg–Sex 8–17 | 45 | 1,5 | não |
| jogador de futebol | fora (mas `atleta` vem antes) | Seg–Sáb 9–12 + Seg/Ter/Qui/Sex 15–17 + Dom 16–18h30 | **28,5** | **2,25** | **sim (+6)** |
| auxiliar técnico | fora | Seg–Sex **6–22** | **80** | 2,25 | sim (+6) |
| técnico de futebol | fora | Seg–Sex 6–22 | 80 | 2,25 | sim (+6) |
| ator | – | Seg–Sex 8–17 (sem ensaio nem espetáculo à noite) | 45 | 1,5 | não |
| músico profissional | fora | Seg–Sex 6–22 (sem show no fim de semana) | 80 | 2,25 | sim |
| enfermeiro / vigilante (plantão) | plantao | Seg/Qua/Sex 7–19 + Dom alternado (o "noturno" não aparece) | 42 | 1,75 | não |
| diarista / motorista app (autônomo) | – | Seg–Sex 8–17 | 45 | 1,5 | não |
| dono de comércio | longa | Seg–Sex 7–19 + Sáb 7–12 | 65 | 2,0 | não |
| caminhoneiro, representante, preparador físico | fora | Seg–Sex 6–22 | 80 | 2,25 | sim |

**18 ocupações** caem na regra `fora` → 80 h: motorista_caminhao, preparador_fisico, representante, caminhoneiro, agronomo_consultor, musico_profissional, auxiliar_tecnico, tecnico_futebol e auxiliar/técnico de basquete, vôlei, natação, atletismo e lutas. As demais: 184 padrão, 19 parciais, 16 longas, 11 plantão, 6 eletivas, 4 atletas.

Consequências reais das 80 h:
- Nenhuma atividade cabe de segunda a sexta. O que pede 3 ou mais vezes vira conflito `sem_horario`, e a presença cai (`agenda.ts:470-476` → `processarRotinas`, `ano.ts:179`).
- Filhos pequenos (18h30–21) e "cuidar" de idoso (20–21) entram em conflito com o trabalho. A prioridade do trabalho e dos filhos é a mesma (1), então quem perde depende da ordem dos blocos (`agenda.ts:405-408`).

O peso de `semana.ts` também é incoerente com as horas: o jogador tem 28,5 h e peso 2,25; o escritório tem 45 h e peso 1,5 (`semana.ts:128-133`).

---

## ROT-11.2: o cuidado com o pet e os tipos de atividade
- O bloco do pet (`agenda.ts:280-282`): cachorro tem **6h30–7h todo dia**; qualquer outro bicho com `semana > 0` (calopsita, papagaio, periquito, hamster…) tem **21h–21h30 todo dia**. Os dois são `obrigatorio: true, movel: false`, com horário fixo e sem procurar horário livre. Gato tem `semana: 0` (`animais.ts:83`) e não gera bloco.
- A sim com a calopsita "Sunny" deu o conflito *"Cuidar de Sunny e trabalho (auxiliar técnico) no mesmo horário (de segunda a sexta, 21h–21h30)"* com perda 0,71 em **todas as 6 ocupações `fora`** testadas, e nenhum conflito nas outras.
- O conflito entre dois blocos fixos (`agenda.ts:406-415`):
  - o pet tem prioridade 3 e perde;
  - `alternativasDoConflito` não oferece nada (o bloco não é móvel nem tem turno: `agenda.ts:517-538`);
  - `processarAgenda` escreve o conflito na Linha da Vida (perda ≥ 0,2: `agenda.ts:602-606`);
  - `presenca['pets']` não é lida por ninguém, então é um conflito sem saída e sem consequência.
- **Os tipos de atividade não existem.** O `Bloco` só tem `obrigatorio`, `movel` e `alternado` (`agenda.ts:64-80`). Não há rígido / flexível / delegável / recorrente / opcional. As atividades de `v.rotinas` são as únicas móveis.
- **Quem mora junto não pode cuidar na agenda.** Em `semana.ts:179` o peso do pet cai pela metade quando há alguém de 12 anos ou mais na casa ("quem cuida é a casa inteira"). Em `agenda.ts:280` o bloco é sempre seu. Os bichos com `tutor: 'familia'` ficam fora dos dois (`semana.ts:178`, `agenda.ts:280`): a "família" cuida, mas nada diz quem.
- O mesmo padrão rígido aparece em `filhos_pequenos` (18h30–21 + 6h30–7h30 todo dia, `agenda.ts:272-275`) e em `cuidar` (20–21 todo dia, `:278-279`). Parceria ou outros moradores nunca dividem.

---

## ROT-11.3

### (a) Mudanças de país
- `migrar` faz `abalar(v, 'a mudança para <país>', 0, fala ? 10 : 18)` (`migracao.ts:273`); `migrarComAFamilia` usa 10/16 (`:307`). Mudança de cidade é +8 (`processos.ts:156`), e jogador transferido muda de cidade com frequência.
- `abalar` soma direto em `mente.estresse` (`abalo.ts:24-26`). `equilibrarMente` retém 70% por ano (`ano.ts:279`).
- `abalosAtivos` só cita um abalo de 8 ou mais enquanto `v.t - a.t < 24` (`estado.ts:86-91`, decaimento `0.7^anos` em `:75-78`). Depois disso **o resíduo continua no número, mas sem nome**.
- `leituraDoEstado` junta abalos de mesmo texto (`estado.ts:456`): duas mudanças para o mesmo país aparecem como uma só, com o peso somado.
- A adaptação recomeça a cada mudança (15 sem a língua, 45 com ela, 70 se volta; `migracao.ts:266,300`). Por ano, `felicidade -= (40 - adaptação) / 10` direto (`:405`), **fora de `fatoresHumor`**: a pessoa fica mais triste sem causa na tela.

Sim `migr11.ts` (mesma vida, alvo de cabeça de cerca de 15–19):
| Cenário | Estresse no fim dos anos 0…3 |
|---|---|
| 1 mudança (ano 0) | 35 → 37 → 31 → 26 |
| 3 mudanças seguidas (anos 0, 1, 2) | 35 → 50 → **53 (pico de 68 logo após o 3º abalo)** → 42 |
| 3 mudanças (anos 0, 2, 4) | 35 → 37 → 44 → 35 → (ano 4) 59 |

No ano 3, depois de 3 mudanças seguidas, o estresse fica **+16 acima** do cenário de 1 mudança, e a leitura já não cita nenhuma mudança.

Na carreira real (sim `feliz11.ts`, vida 2), ida para a França: adaptação 15/23/31/39, o que dá cerca de **−5,2 de felicidade invisível** em 4 anos, mais `solidao −6` todo ano lá.

### (b) "quase nada da semana sobra para você"
- O texto está em `estado.ts:332`. A condição está em `estado.ts:198`: `apertada = fixos ≤ 0,01 && base − somaFixos ≤ 0,75 && somaFixos ≥ 2,5`, com base 3,5 para adultos.
- Para emprego `fora` a soma é 1,5 + 0,75 = 2,25, mais trajeto ≥ 0,25, o que já chega a 2,5 → +6 na cabeça. Também soma 0,7 em `sobrecarga` (`sobrecarga.ts:50`).
- **Nada olha** o sentido do trabalho (`carreira.ts:69-81`), o interesse, nem as horas livres da agenda.
- Jogador: **95 de 121 anos** (78%) com `semana_apertada +6`, com 70–74 h livres na agenda e 28,5 h de treino. O mesmo jogador tem `sentido +5` (humor) em 115 de 121 anos: o jogo diz ao mesmo tempo "faz o que gosta" e "não sobra nada para você".

### (c) Felicidade de quem é campeão
- `alvoHumor = 52 + Σ fatoresHumor` (`estado.ts:218-283`). `felicidade = 0,65·atual + 0,35·alvo` (`ano.ts:278`).
- Os fatores são: rede, infância, saúde, parceria, dívidas/aperto/folga, casa pequena, pet, sem trabalho/sem projeto, **sentido (+5 / +3 / −3, binário)**, ritmo, política, clima, presença (pausa), prisão, solidão, luto, atrito, cabeça cheia, temperamento e atividades.
- **Não há conquista, título, seleção, capitania, promoção, fama ou "realização" separada de estresse.** Não existe `satisfacao` ou `realizacao` no motor (grep em `tipos.ts`, `carreira.ts`, `estado.ts`).
- Os abalos de esporte são todos negativos: rebaixamento −5 (`palmares.ts:169`, `tecnico.ts:426`), perder a posição −4 (`esporte.ts:1086`), doping −14 (`:1199`), fim da carreira −8/−10 (`:1228`), demissão do comando −6 (`tecnico.ts:467`). Título nenhum dá abalo positivo. A notoriedade só pesa: `exposicao` aparece na cabeça em 48 de 121 anos, média +4,4.

Sim `feliz11.ts` (16 vidas, 121 anos de jogador profissional), presença dos fatores de humor:
| fator | anos | média |
|---|---|---|
| saude | 121 | +5,4 |
| sentido | 115 | +5,0 |
| temperamento | 87 | −2,3 |
| rede | 86 | +6,7 |
| solidao | 50 | −6,0 |
| cabeca (estresse > 50) | 46 | −3,1 |
| luto | 33 | −5,4 |
| parceria | 28 | +2,0 |
| **conquista / título** | **0** | — |

Fatores de cabeça: trabalho em 121 anos (+6,9), semana_apertada em 95 (+6,0), exposicao em 48 (+4,4), reserva em 45 (−3,0), descanso em 26 (−1,0), luto em 12 (+3,3).

Felicidade média em ano com título: 53,0 (n = 2); sem título: 60,1 (n = 119). Nos 2 anos com título, "o que ajuda" não citou a conquista nenhuma vez. A amostra com título é pequena (o `passivo` raramente ganha), mas o fator é estruturalmente zero.

---

## Matriz

| Funcionalidade | Onde | Estado | Problema | Causa | Dependências | Risco | Ação | Teste de aceitação |
|---|---|---|---|---|---|---|---|---|
| Horas do trabalho `jornada: 'fora'` | `agenda.ts:167`; `ocupacoes.ts:96` | **Quebrado** | 18 ocupações com 80 h/semana (técnico, auxiliar, preparador, músico, caminhoneiro, representante…) | Um bloco único Seg–Sex 6–22 para "dias fora de casa" | `semana.ts:131`, `compromissos.ts:359`, `paralelas.ts:63`, `politica.ts:1047` (só leem `jornada`, sem horas) | Médio: muda conflitos e presença das atividades de quem está nessas ocupações; sem migração (horas não são salvas) | Criar `HORARIO_DE` por trilha ou id em `agenda.ts`: **treino** (comissões) Seg–Sex 8–12 e 14–17 + jogo no sáb ou dom 15–19 (cerca de 44 h); **musica** Ter/Qui 14–18 + Sex/Sáb 20–24 (cerca de 16–24 h); **estrada** Seg–Qui 6–20 (bloco "na estrada", cerca de 56 h); **vendas/agro** Seg–Sex 8–18. `fora` passa a ser só um rótulo de viagem | Para toda `o` de `OCUPACOES` sem formação/eletivo: `Σ horas(blocosDoTrabalho) ≤ 60` e `≥ 15`. Auxiliar técnico: nenhum bloco termina depois das 19h de segunda a sexta (exceto o dia de jogo) |
| Horas do ator e do plantão | `agenda.ts:166,181` | Simplificado | Ator no 8–17 de escritório; plantão só diurno, sem noites | Sem perfil próprio | Igual ao anterior | Baixo | Ator: ensaio Seg–Sex 14–18 + espetáculo Qui–Dom 20–23 (`trilha 'cena'`). Plantão: alternar 7–19 e 19–7 (bloco 19–24 na grade) | O ator tem pelo menos um bloco depois das 19h; o plantão tem pelo menos uma noite |
| Peso da semana × horas | `semana.ts:128-133` | Incoerente | Atleta: peso 2,25 com 28,5 h; escritório: 1,5 com 45 h | O peso vem de `jornada`, não das horas | `sobrecargaDaSemana`, `encaixe`, `faixaDaSemana` | Médio: muda o estresse de fundo | Derivar o peso de `horasDoTrabalho(v)`: `1,5 · h/45` (limitado a 0,75–2,5); `fora` só +0,25 de viagem (exceto atleta) | Jogador: `semana_apertada` ausente com 28,5 h; técnico com cerca de 44 h: peso de 1,5 a 1,75 |
| Bloco do pet | `agenda.ts:280-282` | **Quebrado** | 21h–21h30 fixo bate com o trabalho até 22h; o conflito não tem saída nem efeito | Bloco fixo e obrigatório, sem encaixe | `semana.ts:175-182`; `presenca` não lida | Baixo | Tirar o pet de `blocosFixos` e passar pela lista de atividades com `encaixar(cat 'cuidado', vezes 7, dur 30, horas [6h30, 7h, 20h, 21h, 22h, 22h30])`. Se ficar sem horário, não gera conflito: vira detalhe "nesses dias, quem cuida é {morador}" | Auxiliar técnico + calopsita: `conflitos.length === 0`, bloco do pet às 22h ou 22h30. Escritório + cachorro: passeio às 6h30 |
| Tipos de atividade (rígido, flexível, delegável) | `agenda.ts:64-80` | Ausente | Tudo que não é rotina é rígido; não existe "delegável" nem "opcional" | Modelo binário `obrigatorio`/`movel` | Conflito e prioridade (`:405`), alternativas (`:510-540`), UI `Agenda.tsx` | Médio (contrato de `Bloco`) | Adicionar `natureza?: 'rigido' \| 'flexivel' \| 'delegavel'`. Pet, filhos e cuidar viram `delegavel` quando `moraCom` tem adulto ou parceiro; um delegável que perde horas **não** gera `Conflito` e leva `detalhe: 'com {nome}'` | Com parceiro em casa, filhos pequenos + auxiliar técnico não geram conflito, e o bloco diz "com {parceiro}" nos dias úteis |
| Co-residentes cuidam | `semana.ts:179` × `agenda.ts:280` | Incoerente | A semana divide o tempo do pet; a agenda não | Duas fontes | — | Baixo | Usar o mesmo predicado `quemDivide(v)` nos dois arquivos | `semana.pets.peso` e o número de dias do bloco variam juntos |
| Abalo da mudança de país | `migracao.ts:273,307`; `processos.ts:156` | Empilha | 3 mudanças seguidas: +16 de estresse 3 anos depois, sem nome | +10/18 direto, retenção de 0,7/ano, leitura só por 24 meses | `abalo.ts`, `estado.ts:75-91` | Baixo | (1) Se houver outra "a mudança" nos últimos 24 meses, aplicar metade (a pessoa já está "em mudança"). (2) Transferência de clube (`motivo 'esporte'`) ou de empresa: 6/10 em vez de 10/18 (há suporte do clube). (3) Em `abalosAtivos`, juntar o resíduo das mudanças em "anos de mudanças seguidas" enquanto Σ ≥ 2,5 | `migr11`, cenário 0,1,2: estresse no ano 3 ≤ cenário de 1 mudança + 6; a leitura nomeia o resíduo enquanto ele for ≥ 2,5 |
| Adaptação invisível | `migracao.ts:405` | Invisível | Felicidade cai sem fator | Subtração direta fora de `fatoresHumor` | `estado.ts:218` | Baixo | Remover a subtração e adicionar `{ id: 'adaptacao', texto: 'a vida nova em {país}, ainda sem a língua' / 'ainda se adaptando', efeito: −(40 − adapt)/4 }` em `fatoresHumor`, na mesma escala do equilíbrio | Vida recém-mudada: `fatoresHumor` contém `adaptacao`; a soma bate com `alvoHumor` |
| "quase nada sobra" | `estado.ts:198,332` | Enganoso | Aparece em 78% dos anos do jogador e com o emprego dos sonhos | Condição só por pesos; ignora horas e sentido | `sobrecarga.ts:50` | Baixo | `apertada` também exige `folgaNosHorarios(v).livres < 25`. Com `sentidoDoTrabalho(v)?.efeito > 0`: efeito 3 e texto "a semana é quase toda do trabalho — o que você escolheu" | Jogador: `semana_apertada` em ≤ 20% dos anos (`feliz11`); quando aparece com sentido, efeito ≤ 3 |
| Conquistas na felicidade | `estado.ts:218-279`; `palmares.ts:43-51` | Ausente | Título, seleção e capitania não mexem no humor; o rebaixamento mexe | Não há fator nem abalo positivo | `palmares`, `tecnico`, `selecao`, `arcos` | Baixo/médio (calibração) | (1) Em `registrarConquista` de `tipo 'titulo'`: `abalar(v, 'o título de {competição}', +6 nacional / +4 estadual, −2)`; seleção: +5; capitão: +3. (2) Fator `realizacao` em `fatoresHumor`: conquistas dos últimos 24 meses (+3 a +6, com teto) e "o reconhecimento" quando a notoriedade é alta e positiva (+2) | `feliz11`: felicidade média em ano com título ≥ sem título + 3; `leituraDoEstado('humor').ajudando` cita a conquista no ano do título |
| Satisfação profissional | `carreira.ts:69-81` | Raso | `sentido` binário (+5); nenhum gradiente de carreira (nível, desempenho) | — | — | Baixo | Graduar: +5 base, +2 com `desempenho ≥ 78` ou nível ≥ 4 na trilha, +1 por conquista recente (teto de +8). Manter separado da cabeça | Titular campeão: `sentido + realizacao ≥ 8` |

---

## Mudanças mínimas propostas (código)

1. **`agenda.ts:167`**: trocar a linha `fora` por perfis:
   ```ts
   if (oc?.jornada === 'fora') {
     if (oc.trilha === 'treino') return [
       { ...base, id: 'trabalho', rotulo: rot, detalhe: 'treinos e preparação', dias: UTEIS, inicio: h(8), fim: h(12) },
       { ...base, id: 'trabalho_tarde', rotulo: `${rot} (tarde)`, dias: [0, 1, 3, 4], inicio: h(14), fim: h(17) },
       { ...base, id: 'trabalho_jogo', rotulo: 'Jogo (com a viagem)', dias: [6], inicio: h(13), fim: h(20) }];
     if (oc.trilha === 'musica') return [
       { ...base, id: 'trabalho', rotulo: rot, detalhe: 'ensaios', dias: [1, 3], inicio: h(14), fim: h(18) },
       { ...base, id: 'trabalho_show', rotulo: 'Shows', detalhe: 'dias fora de casa', dias: [4, 5], inicio: h(20), fim: FECHA }];
     if (oc.trilha === 'estrada') return [{ ...base, id: 'trabalho', rotulo: rot, detalhe: 'na estrada (dias fora de casa)', dias: [0, 1, 2, 3], inicio: h(6), fim: h(20) }];
     return [{ ...base, id: 'trabalho', rotulo: rot, detalhe: 'com viagens', dias: UTEIS, inicio: h(8), fim: h(18) }];
   }
   ```
   Mais um teste de invariante sobre todas as `OCUPACOES` (15 ≤ h ≤ 60).
2. **`semana.ts:128-133`**: peso do trabalho derivado das horas de `blocosDoTrabalho` (`clamp(1.5 * horas / 45, 0.75, 2.5)`), mantendo `pesoDoRitmoNaSemana`. Assim a semana e a agenda passam a ser uma fonte só.
3. **`agenda.ts:280-282`**: o pet sai de `blocosFixos` e entra em `atividades` (`agendaDaSemana`, perto de `:430`) como `origem 'pets'`, móvel, com horários `[h(6,30), h(7), h(20), h(21), h(22), h(22,30)]`. O `sem_horario` do pet não vira conflito quando `moraCom(v).some(p => idade ≥ 12)`: vira só detalhe ("nesses dias, {nome} cuida").
4. **`estado.ts:198/332`**: `apertada` também exige `folgaNosHorarios(v).livres < 25` (importar de `avaliacaoDaRotina` gera ciclo, então mover `folgaNosHorarios` para `agenda.ts`). Quando há sentido: efeito 3 e o texto alternativo.
5. **`migracao.ts:273,307` + `processos.ts:156`**: um helper `abalarMudanca(v, texto, cabeca)` que divide por 2 se houver outro abalo `/^a mudança/` com `v.t - t < 24`, e usa 0,6× para `motivo 'esporte' | 'trabalho'` com contrato assinado.
6. **`migracao.ts:405` → `estado.ts` (`fatoresHumor`)**: fator `adaptacao` nomeado, com a mesma magnitude no equilíbrio: `−(40 − a)/4` ≈ efeito equivalente a `−(40 − a)/10` por ano direto, dado o 0,35 de mistura.
7. **`palmares.ts:43` (`registrarConquista`)**: abalo positivo por tipo, mais o fator `realizacao` em `fatoresHumor` (conquistas com `v.t - x.t < 24`, teto de +6). Simétrico ao rebaixamento (−5).

## Testes de aceitação (sims a rodar de novo)
- `horas11.ts`: nenhuma ocupação acima de 60 h; auxiliar ou técnico entre 40 e 50 h; com a calopsita, 0 conflitos nas 15 ocupações.
- `feliz11.ts`: `semana_apertada` ≤ 20% dos anos de jogador; felicidade em ano com título ≥ sem título + 3; conquista citada em "ajudando".
- `migr11.ts`: 3 mudanças seguidas → estresse no ano 3 ≤ 1 mudança + 6, e o resíduo nomeado enquanto for ≥ 2,5.
- Testes de agora a manter: `fix2.test.ts:339,483` (aceitam `semana_fixa`, `semana_apertada`, `trabalho` ou `bebe`; continuam passando se o técnico tiver `trabalho`), `comissaoModalidade.test.ts`.
