# Conteúdo por país

Auditoria do conteúdo (`src/motor/conteudo/*`) e dos sistemas de saúde, autoescola, concurso, militar, dinheiro e viagens: o que era do Brasil e aparecia para uma vida no Japão, na Alemanha ou nos Estados Unidos. Regra seguida: nada de `switch (país)`. A diferença vem do perfil do país (`mundo/paises/*.ts`) ou de uma lista escolhida à mão, guardada por país (`{ BR: [...] }`). Um país sem lista usa as próprias cidades ou uma forma genérica. No Brasil, os textos, o consumo de RNG e os resultados ficam como antes (ver "Mudanças no Brasil", no fim).

Auditoria: `scripts/sim` (em scratch), com 4 a 6 vidas por país em JP, DE, US, ES, GB, NG, KR, CO, FR, IN, PT, AR, MX e AU, respondendo com opções variadas. Teste: `src/motor/__tests__/mundoConteudo.test.ts`.

## Campos novos no perfil (`mundo/tipos.ts`, preenchidos só em `paises/br.ts`)

| Campo | Brasil | Sem o campo (genérico) |
|---|---|---|
| `cotidiano.transferencia` | "um Pix" | "uma transferência" |
| `cotidiano.transito` | "o Detran" | "a prova de direção" |
| `cotidiano.policiaFederal` | "a Polícia Federal" | "a polícia" |
| `cotidiano.festas` | junina, carnaval, reveillon | nenhuma (sem carnaval; festa junina vira "festa de fim de ano"; Ano-Novo sem "de branco na praia") |
| `cotidiano.tvDaNoite` | "novela" | "televisão" (e "café da manhã sem pressa") |
| `cotidiano.prontoAtendimento` | "a UPA" | "o pronto-socorro" |
| `cotidiano.saudeMentalJovem` | "UBS ou CAPSi" | (sem parênteses) |
| `cotidiano.aprendiz` | frase do jovem aprendiz com carteira assinada | "vagas de aprendiz: meio período, com contrato" |
| `cotidiano.impostoImovel` | "IPTU" | "Imposto do imóvel" |
| `cotidiano.registroCivil` | "o cartório" (+ churrasco) | "o registro civil" |
| `cotidiano.nomeSujo` | true | "cadastro de devedores", sem gíria |
| `cotidiano.timeAmador` | "time de várzea" | "time amador do bairro" |
| `trabalho.previdencia.artigo` | 'o' ("o INSS", "ao INSS") | "a previdência (nome)" |
| `militar.alistamento` | junta militar, alistamento feminino desde 2025, dispensa por excesso de contingente | texto genérico do serviço obrigatório ou seletivo |
| `Ocupacao.paises` (dados/ocupacoes) | `['BR']` em aluno/soldado/cabo/sargento/aluno-oficial/tenente/capitão da PM e no policial rodoviário federal | o cargo não existe |

## O que mudou

### Generalizado (funciona em todo país, com dado local)
- **Rede pública de saúde**: o helper `redeDeSaude(v)` (`sistemas/saude.ts`) lê `perfil.saude.redePublica` e devolve as formas "pelo/do/no" (por exemplo "pelo SUS", "pela ASSE", "pelo Medicaid"). Aparece em: adulto.ts (acidente de moto, ressonância), sistemicos.ts `sau_tratamento`, integracao.ts (lesões), cuidados.ts (encaminhamento para saúde mental, fila, sugestão de terapia), saude.ts (diagnóstico de criança).
- **Previdência**: `bio_aposentadoria_perto` (biografia.ts) e `trab_aposentar` (sistemicos.ts) usam `previdencia(v)`. Os anos mínimos de contribuição saem de `perfil.trabalho.previdencia.anos`.
- **Pix** (adulto.ts), **Polícia Federal** (escolhas.ts), **UPA** (infancia.ts), **novela** (primeiros.ts), **jovem aprendiz** (rework3.ts), **Detran** (sistemas/autoescola.ts), **IPTU e BPC** (rótulos de dinheiro.ts, com o BPC tirado de `trabalho.assistencia.curto`), **cartório** (sistemicos.ts), **várzea** (rework3.ts), **nome sujo** (dinheiro.ts, trajetorias.ts) e **"real"** como unidade ("cada real contado", "não cedeu um real": `unidadeDeConta`, "centavo" fora do BRL).
- **MEI** (trajetorias.ts `inf_mei` e `formalizar`): usa `trabalho.microempreendedor.nome`. Sem regime com nome, vira "Registrar-se como autônomo".
- **Copa** (adulto.ts `adu_copa`): só aparece onde `esporte.popularidade.futebol >= 1.2`, com a seleção do país onde a pessoa mora (`oPais` e `paraPais`).
- **Férias no Nordeste** (adulto.ts): sem região brasileira, vira "uma semana numa praia".
- **"Torneios do Brasil"** (caminhos.ts, tênis): vira `doPais` e `noPais`.
- **Clubes do estadual** (profissao.ts): o texto do Brasil continua; fora, "da divisão de baixo".
- **Listas de cidades brasileiras**. Para o Brasil ficaram listas escolhidas à mão (`{ BR: [...] }`); fora, as cidades do país onde a pessoa mora:
  - excursão de ônibus (escolhas.ts);
  - primeiro voo (mundo.ts `jov_aviao`);
  - mudança do amigo de infância (infancia.ts `inf_amigo_muda`);
  - proposta do cônjuge (vinculos.ts `destinoDoCasal`, que **causava exceção nos EUA**: mandava para São Paulo, e isso virava migração);
  - proposta de trabalho (adulto.ts `destinoDaProposta`);
  - transferência e remoção (profissao.ts `destinoDoAno` e remoção de servidor);
  - recomeçar longe (trajetorias.ts:101/147, com `cidadeLonge`).
- **Forças Armadas** (dados/forcas.ts):
  - `NOME_FORCA` e `SIGLA_DA` viraram getters que leem `perfil.militar.forcas` do país corrente. Por isso legado.ts e trabalho.ts também passaram a usar o nome do país, sem nenhuma edição neles.
  - Guarnições e escolas: o Brasil usa as listas de sempre. Os outros países usam a capital, as sedes e as metrópoles (Exército), o litoral (Marinha) e a capital com as metrópoles (Força Aérea), com nomes genéricos de escola ("academia militar", "escola naval").
  - `nomeDoPosto`: fora do Brasil, troca "da Aeronáutica" e "da Marinha" pelo nome da Força do país.
  - Índices de guarnição (militar.ts): o Brasil continua com a lista antiga (saves valem); fora, `codigoDoMunicipio`.
  - "(EsSA)" só aparece onde há escolas escolhidas à mão.
- **Nomes de bebê** (sistemicos.ts `nomesParaBebe`): usam o país e a divisão onde o bebê nasce, e o sobrenome. Antes saíam nomes brasileiros no Japão.
- **Viagens** (sistemas/experiencias.ts):
  - "Uma viagem pelo país" é pelo país onde a pessoa mora. No Brasil, DESTINOS_BR, idênticos. Fora, até 12 cidades turísticas do país, agrupadas por divisão, com preço pelo custo local.
  - "Para fora" é o mundo menos esse país: os 11 destinos de sempre, o Brasil (Rio, Salvador, Foz) para quem mora fora, e a capital e o maior centro de cada país com perfil.
  - A passagem é calculada por distância (sub-região, região, oceano) a partir do país de residência. Para quem mora no Brasil, os preços e ids de sempre.
  - Fora do Brasil, o preço passa pelo câmbio (`÷ precos` do país de residência).
  - `nomeDaExperiencia(id, país = paisCorrente())`.
  - O catálogo ganhou `perguntaGrupo`; Viagem.tsx teve uma linha alterada para usá-la.

### Restringido (só onde existe)
- **Alistamento** (caminhos.ts `mil_alistamento`): só onde `militar.servico !== 'voluntario'`. No serviço 'seletivo' é registro com convocação por sorteio (chance × 0,25). O texto vem de `militar.alistamento`, ou é genérico.
- **Carnaval** (mundo.ts): só onde `festas` inclui 'carnaval'. São João e seca continuam presos a `regiao === 'Nordeste'`, que só cidades brasileiras têm.
- **Concurso** (sistemas/concurso.ts `editalAberto`): sem edital onde `trabalho.concurso` é false. A chave do edital federal passou a ser o país (no Brasil continua 'BR'). Cargos com `paises` só abrem nesses países.
- **Cenas de escritório** (pedido do líder: o filtro é pelo setor da ocupação, não pelo país): `adu_chefe_novo`, `adu_festa_firma`, `trab_hora_extra` e `trab_assedio` exigem `deEscritorio(v)`, que exclui os setores esporte, seguranca, saude e criativo e as trilhas academia e docencia_superior.

### Saúde por sistema (TAREFA 2)
- Plano de saúde (dinheiro.ts, os três lançamentos): × `perfil.saude.custoPlano`.
- `'seguro'` (EUA):
  - tratamento particular × `custoPlano` (`fatorParticular`);
  - a cobertura pública só vale para quem não consegue pagar;
  - a ressonância sem plano é adiada pelo preço.
- `'universal'`: a fila do tratamento leva metade do tempo (`fatorEspera` 0,5) e o texto diz "algumas semanas"; a ressonância sai em dois meses.
- `'misto'` (Brasil): tudo como antes.
- **Não feito**: o custo das lesões (`sistemas/lesoes.ts custoDoCuidado`) não depende do sistema do país, porque o arquivo não é meu. No sistema 'seguro', "de graça pela rede pública" está otimista ali.

## Mudanças no Brasil
- O gate de escritório tira 4 cenas de brasileiros em esporte, segurança, saúde, criativo e universidade.
- `cidadeLonge` não manda mais quem mora em São Paulo "para São Paulo" (vai para Brasília).
- Viagem para fora: os países novos aparecem entre os de sempre, por continente.

Os testes alvo passam: motor, rework, rework2, rework3, fix2, fix3, fix4, att3, politica, profissao, trajetorias, pacotePlaytest, generalizacao, fixGeneralizacao, fixPosRework3, caminhos, save, momentos2 e social (651 testes).

## Fica brasileiro de propósito, ou é de outro dono
- `conteudo/politica.ts` (fora do escopo): "carro de som", "santinho".
- `sistemas/filhos.ts:566` (NPC "casou no cartório"), `filhos.ts:312` (vestibular da federal), `iniciativas.ts`/`interacoes.ts` ("café depois do expediente"), `formacao.ts` ("universidade federal"): do líder.
- **Ocupação de NPC** (familia.ts, origem, pessoas): pais em Portugal aparecem como "soldado da PM". Quem sorteia ocupação de NPC deveria respeitar `Ocupacao.paises`.
- **`sistemas/migracao.ts` `registrarMigrador`**: chama `avaliarMigracao(v, destinoId)` e depois `porta(v, destinoId, …)` com o **id da cidade**, quando deveria passar o país. Isso dá `perfilDoPais('sao-paulo-sp')`, que lança exceção. O caminho que disparava foi fechado em vinculos.ts, mas o bug continua lá (linha ~142: `porta(v, pais, motivo)`).
- `escola.ts capitalDoEstado`: fora do Brasil devolve a própria cidade, e as mudanças "para a capital do estado" viram no-op.
- **Copa**: "o Reino Unido" ganha a Copa (o perfil GB não separa Inglaterra e Escócia).
- **Regras militares brasileiras na carreira**: temporário até 8 anos, EsSA aos 24, 35 anos para a reserva. Valem como abstração em todo país.
- **Ações sem país**: a ação `mei` em acoes.ts e o rótulo "DAS do MEI" em carreira.ts não leem o perfil.
- **Concurso**: onde `trabalho.concurso` é false, as carreiras que só entram por concurso (polícia, professor concursado...) ficam fechadas. Falta um caminho por candidatura em trabalho.ts.
- "escola estadual" aparece em perfis estrangeiros (`educacao.etapas.publica.medio`, dado do líder).
