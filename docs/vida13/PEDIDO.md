# VIDA — PROMPT COMPLEMENTAR DA PRÓXIMA ATUALIZAÇÃO (texto do usuário, 2026-11-07)
## Novas melhorias, reworks visuais, imersão e aprofundamento dos sistemas existentes

IMPORTANTE: não publique nem integre estas mudanças na versão em produção (12.9.1). Fazem parte da próxima atualização.
Antes de implementar: audite o código e os sistemas existentes; consulte roadmap e relatórios anteriores (docs/); identifique
o que já está implementado, parcial ou ausente; não duplique; reutilize; preserve saves antigos.

# 1. REWORK DO SISTEMA DE PIERCINGS
Hoje os piercings estão na loja, mas visualização e experimentação são limitadas. Integrar à aparência, como as tatuagens.
1.1 Localização: seção de piercings junto às tatuagens em Você → Aparência. A loja continua responsável pela compra. A seção
de aparência permite visualizar, experimentar, equipar, trocar e remover piercings já adquiridos.
1.2 Visualização ampliada (como o zoom das tatuagens): orelhas, nariz, sobrancelhas, lábios, septo, umbigo, outras regiões
compatíveis com o modelo visual.
1.3 Variedade: argolas, pontos de luz, barras, joias discretas, modelos alternativos, luxuosos; ouro, prata, aço, titânio e
acabamentos. Múltiplos piercings na mesma região quando anatomicamente possível.
1.4 Integração: acessórios, cabelos, roupas, ângulos, aparências e gêneros, fases da vida, saves. Não criar sistema paralelo.

# 2. REWORK VISUAL E ESPACIAL DOS MÓVEIS
Móveis às vezes parecem folhas de papel posicionadas lateralmente, sem volume.
2.1 Profundidade real: avaliar modelos 3D ou representação com volume convincente. A penteadeira precisa de tampo, gavetas,
laterais, espelho, estrutura, profundidade, volume — não um desenho fino visto de lado. Mesmo cuidado nos outros móveis.
2.2 Orientação: melhorar rotação; representar laterais; evitar recortes 2D; composição com móveis encostados às paredes;
escala e perspectiva; evitar oclusões desnecessárias.
2.3 Auditoria: quartos, salas, cozinhas, escritórios, banheiros, ambientes pequenos e grandes. Melhorar o SISTEMA geral de
representação espacial. Preservar a direção artística (não fotorrealista).

# 3. REWORK VISUAL DOS VEÍCULOS
3.1 Carros: silhuetas, proporções, carroceria, rodas e pneus, faróis, lanternas, vidros, para-choques, detalhes
característicos, diferenciação entre modelos (Porsche 911 ≠ Huracán ≠ sedã comum).
3.2 Motos: tanque, banco, motor, escape, guidão, rodas, suspensão, faróis, silhueta; atenção às clássicas.
3.3 Personalização: pinturas alteram o desenho; rodas visualmente diferentes; acabamentos reconhecíveis; modificações na
garagem; o veículo comprado corresponde ao visual apresentado.
3.4 Garagem: exposição, organização, proporções, visualização ampliada. Referências reais de proporção reinterpretadas no
estilo ilustrado; nada de fotos.

# 4. REWORK COMPLETO DO SISTEMA DE FAMA
Hoje a fama fica escondida em Você → No mundo.
4.1 Acesso: auditar navegação; avaliar seção própria sem poluir a navegação principal. Melhorar o sistema inteiro.
4.2 Consequências reais: Oportunidades (entrevistas, eventos exclusivos, convites, propostas, participações especiais);
Dinheiro (publicidade, patrocínios, contratos, campanhas, parcerias); Carreira (reconhecimento, oportunidades, influência no
setor, convites internacionais); Vida social (pessoas querendo conhecer, convites, novas relações, atenção pública);
Privacidade (paparazzi, exposição, rumores, dificuldade de anonimato, invasão); Imagem pública (admiração, rejeição,
controvérsias, polêmicas, reputação); Influência (mobilização, causas, influência social, reconhecimento internacional).
4.3 Origens: esportiva, artística, musical, empresarial, política, conquistas extraordinárias, controvérsias — cada uma com
oportunidades e consequências próprias.
4.4 Evolução dinâmica conforme acontecimentos reais. Não uma barra sem efeitos.

# 5. INTERATIVIDADE DAS AÇÕES EMPRESARIAIS
Ex.: "Estratégia de Fortaleza Industrial" aparece como título informativo, mas é uma ação importante.
5.1 Hierarquia: títulos, descrições, informações, decisões, botões, ações indisponíveis.
5.2 Interatividade: ações selecionáveis com cara de controle (hover, foco, pressionado, selecionado, feedback). Indisponíveis
explicam o motivo. Não transformar textos informativos em controles falsos.
5.3 Feedback: o que foi escolhido, quanto custou, o que mudou, consequências esperadas, efeitos já ocorridos.

# 6. PRODUTOS E LINHAS DE PRODUÇÃO
O jogador amplia capacidade mas não controla o que a empresa produz.
6.1 Ao selecionar "Mais uma linha de produção", apresentar opções específicas do setor (alimentícia: salgadinhos, cereais,
biscoitos, bolachas, bebidas, massas, chocolates...). Cada escolha com características próprias.
6.2 Montadoras (SUVs, sedãs, esportivos, elétricos, utilitários, motos); Tecnologia (smartphones, computadores, SO, software,
serviços digitais, hardware especializado); Aeroespacial (foguetes, satélites, lançamento, exploração, contratos);
Restaurantes (pratos, cardápios, serviços, unidades, posicionamento); demais ramos com opções coerentes.
6.3 Cada produto/linha: investimento inicial, prazo, capacidade, custos, demanda, concorrência, preço, margem, público,
posicionamento, riscos, potencial de crescimento.
6.4 Lançar, expandir, melhorar, reposicionar, alterar preços, investir em qualidade, descontinuar.
6.5 Afetam faturamento, despesas, lucro, reputação, produtividade, participação de mercado, valor da empresa. Nada de catálogo
superficial.

# 7. NOMES GERADOS PROCEDURALMENTE
Bug: "Fortaleza Industrial comprou a concorrente Fortaleza Industrial".
7.1 Expandir nomes de empresas (pequenas, médias, grandes, indústria, tecnologia, montadoras, bancos, aeroespacial,
alimentícias, outros), refletindo setor e posicionamento.
7.2 Marcas, subsidiárias, produtos, modelos de veículos, projetos, concorrentes, organizações, outras entidades.
7.3 Unicidade: evitar idênticos, quase idênticos, confusos no mesmo contexto.
7.4 Mensagens de aquisições, fusões, parcerias, concorrência, compra/venda, lançamentos: sempre claro quem fez e quem sofreu.
7.5 Não renomear entidades existentes nos saves; regras valem para entidades futuras.

# 8. FLUXO DE AÇÕES ANUAIS
Hoje diversas ações aparecem no início do ano e o jogador precisa concluir todas antes de descobrir os resultados; uma
consequência não pode influenciar a próxima decisão.
8.1 Novo fluxo: apresenta uma ação → jogador escolhe → executa → resultado imediato → próxima ação, considerando o estado
atualizado. 8.2 Ex.: investir na empresa mostra valor investido, saldo atualizado, mudanças na empresa, consequências,
retorno esperado; só então a próxima. 8.3 Permitir encerrar/pular as restantes; não obrigar a fazer todas.
8.4 Auditar os diferentes fluxos anuais (não só empresas). 8.5 Limites anuais, elegibilidade, custos, ordem, persistência,
saves; salvar e recarregar não pode executar uma ação duas vezes.

# 9. APRESENTAÇÃO DAS AÇÕES EM CAMINHOS E OUTRAS TELAS
Caminhos: muitas ações como linhas de texto com setas.
9.1 Agrupar por contexto/categoria (política: partido, campanha, eleições, mandato, relações políticas, exposição pública,
estratégia; outras áreas com categorias coerentes). 9.2 Hierarquia: principais, secundárias, informações, descrições,
requisitos, indisponíveis. 9.3 Área clicável adequada, aparência interativa, hover/foco, feedback, explicação de
indisponibilidade. 9.4 Ícones, agrupamentos, destaques, descrições curtas, indicadores de estado — sem cartões enormes nem
listas pesadas. 9.5 Auditar também gestão empresarial, fama, carreira, vida social, política e outras telas com muitas ações.
Preservar identidade visual; melhorar mobile.

# 10. EXPANSÃO DO CATÁLOGO DE TATUAGENS
10.1 Cultura pop — Videogames: GTA, The Last of Us, God of War, Red Dead Redemption, Dark Souls, Elden Ring, Bloodborne,
Minecraft, Pokémon, Resident Evil, Assassin's Creed, The Witcher, Cyberpunk 2077, Super Mario, Zelda, Sonic, outros.
Livros: Harry Potter, Percy Jackson, Duna, O Senhor dos Anéis, Jogos Vorazes, Sherlock Holmes, outros. Séries: Breaking Bad,
Game of Thrones, The Walking Dead, Stranger Things, Peaky Blinders, The Office, Vikings, Friends, outras. Filmes: Star Wars,
Matrix, Jurassic Park, Piratas do Caribe, Marvel, DC, De Volta para o Futuro, outros. Animações: Naruto, Dragon Ball, One
Piece, Pokémon, Attack on Titan, Death Note, Studio Ghibli, Simpsons, Rick and Morty, Avatar: A Lenda de Aang, outros.
(Exemplos, não lista fechada.)
10.2 Personagens, símbolos, criaturas, armas, objetos, emblemas, frases curtas, composições temáticas, cenas. O usuário
considera aceitável reproduzir obras originais de cultura pop; não restringir a desenhos genéricos "inspirados".
10.3 Independentes: geométricas, abstratas, minimalistas, ornamentais, surrealistas, conceituais, blackwork, old school,
oriental, fine line, tribal, realistas, animais, natureza.
10.4 Quantidade real, sem duplicatas disfarçadas, legível no corpo, testar regiões e tamanhos, preservar zoom/posicionamento,
filtros por tema e obra, melhorar busca e organização.

# 11. O MUNDO REAGE À TRAJETÓRIA
11.1 Atleta famoso: reconhecimento nas ruas, convites, oportunidades. Empresário de sucesso: propostas, atenção do mercado,
interesse de outras empresas. Artista: convites, atenção. Político: pressões, expectativas. Controvérsias: rejeição/exposição.
11.2 Considerar fama, reputação, carreira, patrimônio, conquistas, fracassos, controvérsias, posição política, influência,
relações pessoais, histórico de decisões. 11.3 Conectar fama, carreira, esportes, negócios, política, vida social,
relacionamentos, eventos — sem sistemas isolados de reconhecimento por área. 11.4 Coerência; intensidade proporcional à
relevância/alcance; não transformar qualquer um em celebridade; fama com benefícios e inconvenientes.

# 12. EVENTOS PERSONALIZADOS PELO HISTÓRICO
12.1 Usar escolhas anteriores, carreira, estudos, hobbies, conquistas, fracassos, relacionamentos, negócios, esportes,
política, fama, patrimônio, acontecimentos importantes. 12.2 Acontecimentos antigos voltam anos depois (decisão profissional,
conquista esportiva, fracasso empresarial, controvérsia, amizade/rivalidade antiga). 12.3 Reutilizar personagens existentes,
reencontros, rivalidades, continuidade — sem recorrentes artificiais. 12.4 Baseados em acontecimentos efetivamente
registrados; não inventar passado; não reescrever história; aproveitar retrospectiva e históricos existentes sem duplicar.

# 13. PERSONALIZAÇÃO DA IDENTIDADE VISUAL
13.1 Cabelos: penteados, cortes masc./fem., comprimentos, texturas, volumes, modernos, clássicos, alternativos, cores e
combinações. 13.2 Barbas: cheia, curta, desenhada, cavanhaque, bigode, costeletas, comprimentos; combinações coerentes.
13.3 Maquiagem: delineados, sombras, batons, detalhes estéticos compatíveis com a arte. 13.4 Acessórios e combinações, sem
conflitos visuais com roupas, piercings, acessórios. 13.5 Visualização em diferentes ângulos; avaliar antes de confirmar.
13.6 Reutilizar o sistema de aparência; preservar corpo inteiro, roupas, tatuagens, piercings, acessórios, fases da vida,
saves; não criar atributos redundantes.

# 14. ESCOPO
Auditar antes; não duplicar; não alterar a 12.9.1 publicada; NÃO iniciar Vida Rural/Fazenda; não introduzir funcionalidades
rejeitadas (da 12.9: funcionários domésticos, contratação/gestão de funcionários domésticos, administração/manutenção de
imóveis, segurança residencial, certificados artificiais, expansão profunda de família); não criar sistemas artificiais
para encher menus; não sacrificar desempenho; não renomear entidades antigas; não modificar resultados históricos; não
marcar parcial como concluído.

# 15. TESTES
Aparência (piercings por região, zoom, combinações, cabelos, barbas, maquiagem, tatuagens, roupas/acessórios); Móveis
(profundidade, rotação, oclusão, escala, cômodos, tamanhos de imóvel); Veículos (carros, motos, clássicos, personalização,
garagem, comprado = exibido); Empresas (ações interativas, projetos por setor, lançamento, expansão, descontinuação,
resultados, nomes únicos, aquisições, saves antigos); Ações anuais (resultado imediato, estado atualizado, próxima
contextualizada, encerrar restantes, persistência, sem execução duplicada); Fama e mundo (origens, níveis, consequências +/−,
proporcionalidade, oportunidades coerentes); Eventos (histórico real, continuidade, longo prazo, recorrentes, nada
inventado); Interface (desktop, mobile, claro, escuro, hierarquia, estados interativos, acessibilidade).

# 16. RELATÓRIO
Implementado; reaproveitado; corrigido; parcial; não implementado; testes; saves; auditoria visual; performance; limitações.
Não declarar concluído sem evidência. Não publicar isoladamente.
