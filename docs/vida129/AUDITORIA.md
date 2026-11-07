# Auditoria 12.9 (resumo dos agentes)
## Política
- tipos.ts:3376 CargoEletivo sem presidente ("presidência fica fora do jogo"). CARGOS politica.ts:117; ORDEM_CARGOS; cargoNoPais :140; PerfilPolitico mundo/tipos.ts:213 (cargos, eleicoes local/geral [base,intervalo], mes); BR br.ts:64.
- podeConcorrer :388-421 (reeleição: 3º consecutivo executivo bloqueado :412); pol_eleicao conteudo/politica.ts:272 (passos dinheiro/rua/tom, debate só texto, sem adversários); fatoresDaEleicao :632 logística /7; apurar :775; tomarPosse :834; processarPolitica :1002 (aprovação, custo 18–28% do salário, crises lista fixa); pol_crise; mandato.ts:32 ACOES_DO_CARGO (EXECUTIVO/LEGISLATIVO), máx 2/ano; concluirMandato :882; VidaPolitica tipos.ts:3388; save valida sem allow-list; acao {tipo:'politica', oque, valor}; UI PainelPolitico Trabalho.tsx:841.
- Chunks: politica.ts/mandato.ts motor; conteudo/politica motor-textos; aliancas motor-acontecimentos; partidos motor-dados.
- custoDeCampanha não convertido p/ outros países (possível bug).
## Esportes
- esp10_dor acontecimentos10.ts:779-790: sem gate, chance(0.45) piora senão "campeão", marcar conquista. Causa do bug.
- selecao.ts:241 tênis competição por equipes anual; disputarTorneio :268 campanhaDaSelecao competicoes.ts:273; roda em fecharTemporada (esporte.ts:1180). Sem estado de fase durante a temporada.
- Padrão correto: técnico p.decisao tecnico.ts:398/512, tec_final situacoes.ts:1397, decidirFinal tecnico.ts:698.
- Outros: atl_final situacoes.ts:1019 (finalNacional → lances.ouro → aplicarLances esporte.ts:720 força colocacao=1); vol125_tiebreak situacoes125.ts:96; atl125_largada :126; atl125_revezamento :140 (sem selecao); bas_ultimo_ataque situacoes.ts:925; ten_dor/ten_tiebreak situacoes.ts:981-1015; ten126_viagem situacoes126.ts:220; fut_rebaixamento situacoes.ts:719; esc10_competicao acontecimentos10.ts:155. fechamento.ts:68 conquistasDoAno mistura; coerencia.ts sem regra.
## Aparência
- Provador×cartão: cor por hash da semente; cartão `${itemId}-vitrine` (Lojas.tsx:173→MiniaturaDaPeca:43), provador `${itemId}-provador` (Lojas.tsx:137), compra = id da instância novoId (estilo.ts:217), guarda-roupa/Retrato = instância. pecas.ts:148 corDe, :161 semente+parte; Figura.tsx:254 listrada = cor par. camisa_time pecas.ts:41. Vale p/ toda peça com lista de cores. Fix: ItemDeEstilo.variante (tipos.ts:348) + comprar_item leva variante; pecasDoItem usa variante ?? id.
- Tatuagens: 98 desenhos, 14 estilos dados/tatuagens.ts:143-246 (motor-dados!), arte switch ui/avatar/tatuagens.tsx desenho() caixa nativa 20u; save guarda id; normalizarTatuagens tolera ids desconhecidos. Novos: dados/tatuagens129.ts → chunk motor-casa; arte ui/avatar/tatuagens129.tsx fallback.
- Piercing: nada. Visual tipos.ts:236 (modeloBrincos etc). dados/estilo.ts ItemEstilo.lugar 'orelha' :83, lugaresDoItem :109; Retrato.tsx brincos :253, nariz ~:330, fases :76. sincronizarVisual estilo.ts:276. MiniaturaDaPeca visualComPecaDoRosto :16.
- Looks: EstiloPessoal.looks por Ocasiao (tipos.ts:321) ação 'look' personalizacao.ts:563; roupaPara dados/estilo.ts:317; UI LookDaOcasiao Personalizar.tsx:626. Falta: looks nomeados livres + vestir look.
- Save v20, normalizarXxx em interpretar (save.ts:118), normalizarVida126 :1788.
## Estudos
- Instituição = string INSTITUICOES[via] escola.ts:734; formacao.ts:143 instituicaoAtual (perfil hash). Vias escola.ts:494 sisu/privada/prouni/fies/ead/selecao_publica; opcoesDeCurso escola.ts:552; matricular etapa candidatar → educacao.aprovacao (12m) → confirmar_matricula acoes.ts:1158. fazerEnem escola.ts:473. processarCurso escola.ts:831 anual; reprovação <35 → 60% 1–2 matérias +6 meses; historicoAcademico GRADE :37. Trancar acoes.ts:1184 (texto sempre "faculdade"); cancelado após 48m. Sem troca de curso, sem semestres, sem recuperação, sem campus/instituição nomeada. Bugs: FIES só vira dívida na formatura (escola.ts:933) → abandono escapa; reprovacoes nunca cancela (tipos.ts:784).
- Estudos.tsx:101 partes agora/oportunidades/desenvolvimento/historico; usa Secao/Folio/Linha tokens.
- ensinoTecnico: escolas geradas por cidade, perfis POOL :24, ROTAS :53; quemOferece :162.
## Hobbies
- Rotinas ModeloRotina rotinas.ts:63 (Rotina id,tInicio,nivel 1–3) → frentes[Dominio]. musica (3 níveis), desenho, fotografia (13+), cozinhar (1 nível); hobbies126: jardinagem, pintura (marcos, venda), artesanato, coleção, clube do livro. Itens ajudam (dados/coisas.ts:78-112). Falta: instrumento específico (fato instrumento:X em experiencias.ts:478 nunca lido), marcos p/ fotografia/desenho/cozinha. rotinas.ts importa ROTINAS_126 estático.
- Chunks: cursos/hobbies126/ensinoTecnico/historicoAcademico motor-dados; experiencias/vidaEstudantil motor-textos; escola/formacao/rotinas motor. Novos dados puros → motor-casa; lógica de camada superior → motor-patrimonio.
## Cotidiano
- Calendário: AUSENTE (agenda.ts = semana típica; tempo anual v.t+=12). Datas: bodas (biografia.ts:735), eleições (politica.ts:157), aniversario ação juntos.ts:299, feriado_juntos convivio.ts:544.
- Álbum: albumDaVida.ts derivado (9 categorias), FotoDaMemoria.tsx; veículo/imóvel usam desenho genérico (FotoDaMemoria:30); CENARIO 'especiais' ≠ id 'momentos'.
- Presentes presentes.ts: item ≤9000, 1/pessoa/ano, sem ocasião. convivio organizar_encontro :557. Usos de cômodo receber/festa/churrasco casa128.ts:36-85 casaViva (grupo = 5 mais próximos automático :30) — só dentro de Personalizar.tsx:107.
- Veículos: dados/bens.ts 22 classes, 115 versões (classico 8, superesportivo 5, hiperluxo 4, limitada 1); colecao.ts:553 grau por classe ignora limitada; nome = classe (bug). personalizacaoVeiculo: 6 cores+envelopamento, 1 acabamento fosco, rodas 2. Garagem Patrimonio.tsx:217 tabela sem desenho; historia só em Personalizar:545.
- Mobile: barra ≤760 fonte 0.6rem; tabela garagem scroll horizontal.
- Chunks: motor-vida (agenda, convivio, juntos, casaNoDia); motor-textos (interacoes, gestos, presentes); motor-patrimonio (colecao, personalizacao, casaViva); motor-casa (dados puros). Tamanhos 12.8: motor-dados 797.0, motor 796.5, motor-textos 791.8, motor-carreira 746.7, Jogo 658.8.
## Economia
- Financas tipos.ts:1328 (conta, investimentos, dividas, bens, colecao, empresas, negativado). balanco() dinheiro.ts:421 (líquido; negócio pequeno só caixa; coisas/pets fora; dívida do crime fora). 3 liquidez: investimentos.ts:28, condicaoEconomica dinheiro.ts:523 (faixas, iliquida), disponivel :1019. cobrirRombo :787 nunca vende bens. limiteDeCredito 2.5×renda.
- Apostas fichas fixas [10..500]×custo apostas.ts:59; hab_bets_fundo escolhas.ts:89 tira 50% da conta sem teto (texto diz 8–40 mil).
- EXPLOIT: efeitos.ts:22 dinheiro(c,n) = max(n, -max(0,conta)) → perdas de eventos limitadas ao saldo em conta (54 usos).
- ~44 `financas.conta -=` diretos. Sem imposto sobre ganhos.
- Negócios: A) caminhos.negocio (negocio.ts, ~20 tipos, capital 9–60k, responsabilidade ilimitada :433); B) financas.empresas empresas.ts (8 tipos: restaurante 450k… zoológico 22M), lucro :138, distribuição 80% :194, avaliação :260, máx 4 unidades, 8 empresas, 1 abertura/ano, venda 0.85, vender_parte 25%, falência 3 anos → acordo 50%×parte :275, participações ofertas :181. Teto ~R$40M. Sem aquisição, IPO, crédito. Comprar participação perde 20–25% na reavaliação (novaEmpresa :93).
- Chunks: empresas/setores/colecao motor-patrimonio (~142kB); dinheiro/negocio motor; hook PATRIMONIO_NO_MES dinheiro.ts:390 → criar ATIVOS_EXTRA.
