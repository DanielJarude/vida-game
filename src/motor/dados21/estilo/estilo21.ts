/**
 * VIDA 21 · O GUARDA-ROUPA QUE CRESCEU — peças novas de roupa e acessório, nas MESMAS categorias de sempre (a parte de
 * cima, a de baixo, a peça inteira, por cima, os pés, o pulso, o pescoço, a bolsa). Cada uma tem um desenho próprio
 * (`ui/avatar/pecas21`: silhueta, modelagem, cor e estampa — não é a mesma peça com outro nome), o material que se vê
 * de perto (lido do id), o segmento (1 básico … 6 exclusivo), o preço de referência e as ocasiões. As marcas vêm das
 * lojas (`perfisDeMarca`), como sempre. Entram no fim de `ITENS_ESTILO`.
 *
 * Preços: reais de 2026, referência de varejo brasileiro (a cidade ajusta); o luxo pelo preço de vitrine das maisons no
 * Brasil, arredondado — referências de mercado, não tabela oficial.
 */
import type { ItemEstilo } from '../../dados/estilo';

export const ITENS_ESTILO_21: readonly ItemEstilo[] = [
  // ---- A parte de cima
  { id: 'camiseta_basica_gola_v', nome: 'Camiseta gola V', categoria: 'roupa', lugar: 'tronco', preco: 59, nivel: 1, estilos: ['casual', 'minimalista'], ocasioes: ['dia', 'estudo'], descricao: 'Algodão leve, decote em V, a que vai com tudo.' },
  { id: 'camiseta_dry_fit', nome: 'Camiseta de treino (dry-fit)', categoria: 'roupa', lugar: 'tronco', preco: 89, nivel: 1, estilos: ['esportivo'], ocasioes: ['esporte', 'dia'], descricao: 'Poliéster que seca rápido, costura reta, sem etiqueta que coça.' },
  { id: 'regata_academia', nome: 'Regata cavada', categoria: 'roupa', lugar: 'tronco', preco: 69, nivel: 1, estilos: ['esportivo', 'streetwear'], ocasioes: ['esporte', 'dia'], descricao: 'Cava funda, para o treino e para o calor.' },
  { id: 'camisa_oxford', nome: 'Camisa oxford', categoria: 'roupa', lugar: 'tronco', preco: 220, nivel: 2, estilos: ['social', 'minimalista', 'tradicional'], ocasioes: ['trabalho', 'encontro'], descricao: 'Tecido de trama grossa, colarinho de botão: social sem ser engomada.' },
  { id: 'camisa_havaiana', nome: 'Camisa estampada de praia', categoria: 'roupa', lugar: 'tronco', preco: 160, nivel: 2, estilos: ['casual', 'vintage'], ocasioes: ['dia', 'festa'], descricao: 'Viscose solta, manga curta, estampa de folhagem.' },
  { id: 'blusa_ombro_a_ombro', nome: 'Blusa ombro a ombro', categoria: 'roupa', lugar: 'tronco', preco: 130, nivel: 2, estilos: ['casual', 'elegante'], ocasioes: ['dia', 'festa', 'encontro'], descricao: 'Decote canoa largo, manga bufante, elástico na barra.' },
  { id: 'body_canelado', nome: 'Body canelado', categoria: 'roupa', lugar: 'tronco', preco: 110, nivel: 2, estilos: ['minimalista', 'urbano'], ocasioes: ['dia', 'festa'], descricao: 'Malha canelada justa, gola alta, por dentro da calça.' },
  { id: 'polo_pique_premium', nome: 'Polo de piquet premium', categoria: 'roupa', lugar: 'tronco', preco: 590, nivel: 3, estilos: ['social', 'tradicional', 'esportivo'], ocasioes: ['dia', 'trabalho', 'encontro'], descricao: 'Algodão egípcio, punho canelado, bordado discreto no peito.' },
  // ---- A parte de baixo
  { id: 'calca_moletom', nome: 'Calça de moletom', categoria: 'roupa', lugar: 'pernas', preco: 120, nivel: 1, estilos: ['casual', 'esportivo', 'streetwear'], ocasioes: ['dia', 'esporte'], descricao: 'Punho na barra, cordão na cintura, o conforto de domingo.' },
  { id: 'calca_wide_leg', nome: 'Calça pantalona', categoria: 'roupa', lugar: 'pernas', preco: 210, nivel: 2, estilos: ['elegante', 'vintage', 'minimalista'], ocasioes: ['trabalho', 'encontro', 'evento'], descricao: 'Cintura alta, perna larga do quadril até o chão.' },
  { id: 'jeans_skinny', nome: 'Jeans skinny', categoria: 'roupa', lugar: 'pernas', preco: 180, nivel: 2, estilos: ['casual', 'rock'], ocasioes: ['dia', 'festa', 'encontro'], descricao: 'Justo do quadril ao tornozelo, com elastano.' },
  { id: 'jeans_reto_premium', nome: 'Jeans de denim japonês', categoria: 'roupa', lugar: 'pernas', preco: 1450, nivel: 3, estilos: ['casual', 'vintage', 'minimalista'], ocasioes: ['dia', 'trabalho', 'encontro'], descricao: 'Denim cru de tear estreito, ourela na barra: amacia com o uso.' },
  { id: 'short_alfaiataria', nome: 'Short de alfaiataria', categoria: 'roupa', lugar: 'pernas', preco: 190, nivel: 2, estilos: ['elegante', 'minimalista'], ocasioes: ['dia', 'encontro'], descricao: 'Pregas na frente, cintura alta, barra dobrada.' },
  { id: 'saia_plissada_longa', nome: 'Saia plissada longa', categoria: 'roupa', lugar: 'pernas', preco: 240, nivel: 2, estilos: ['elegante', 'vintage'], ocasioes: ['trabalho', 'evento', 'encontro'], descricao: 'Plissado fino que balança no andar, cintura de elástico.' },
  { id: 'minissaia_jeans', nome: 'Minissaia jeans', categoria: 'roupa', lugar: 'pernas', preco: 140, nivel: 1, estilos: ['casual', 'rock', 'streetwear'], ocasioes: ['dia', 'festa'], descricao: 'Jeans, barra desfiada, bolso de cinco pontas.' },
  // ---- A peça inteira
  { id: 'vestido_tubinho', nome: 'Vestido tubinho', categoria: 'roupa', lugar: 'corpo', preco: 260, nivel: 2, estilos: ['elegante', 'social', 'minimalista'], ocasioes: ['trabalho', 'evento', 'encontro'], descricao: 'Reto e justo, no joelho, sem manga: o pretinho básico.' },
  { id: 'vestido_midi_estampado', nome: 'Vestido midi estampado', categoria: 'roupa', lugar: 'corpo', preco: 320, nivel: 2, estilos: ['casual', 'vintage'], ocasioes: ['dia', 'encontro', 'festa'], descricao: 'Viscose, alcinha, saia rodada abaixo do joelho.' },
  { id: 'vestido_gala_grife', nome: 'Vestido de gala de alta-costura', categoria: 'roupa', lugar: 'corpo', preco: 85000, luxo: true, nivel: 6, edicao: 'sob medida', colecao: 'Alta-costura', estilos: ['luxuoso', 'elegante'], ocasioes: ['evento'], descricao: 'Feito sob medida no ateliê: bordado à mão, cauda, três provas.' },
  { id: 'smoking', nome: 'Smoking', categoria: 'roupa', lugar: 'corpo', preco: 3800, nivel: 4, estilos: ['social', 'elegante'], ocasioes: ['evento'], descricao: 'Lapela de cetim, faixa lateral na calça, gravata-borboleta.' },
  { id: 'macacao_jeans', nome: 'Jardineira jeans', categoria: 'roupa', lugar: 'corpo', preco: 230, nivel: 2, estilos: ['casual', 'vintage'], ocasioes: ['dia'], descricao: 'Peito com bolso, alças de fivela, perna reta.' },
  { id: 'macacao_piloto', nome: 'Macacão de piloto', categoria: 'roupa', lugar: 'corpo', preco: 9500, nivel: 4, estilos: ['esportivo'], ocasioes: ['esporte'], descricao: 'Tecido antichama homologado, costura dupla, punho e gola de malha: o de autódromo.' },
  { id: 'uniforme_hospitalar', nome: 'Pijama cirúrgico', categoria: 'roupa', lugar: 'corpo', preco: 180, nivel: 1, estilos: ['minimalista'], ocasioes: ['trabalho'], descricao: 'Blusa de gola V e calça de cordão, tecido que aguenta autoclave.' },
  { id: 'kimono_judo', nome: 'Quimono de judô', categoria: 'roupa', lugar: 'corpo', preco: 420, nivel: 2, estilos: ['esportivo', 'tradicional'], ocasioes: ['esporte'], descricao: 'Trama grossa de algodão, faixa na cintura.' },
  { id: 'agasalho_selecao', nome: 'Agasalho de time (edição limitada)', categoria: 'roupa', lugar: 'corpo', preco: 900, nivel: 3, edicao: 'edição comemorativa', estilos: ['esportivo', 'streetwear'], ocasioes: ['dia', 'esporte'], descricao: 'Jaqueta e calça de tactel com as listras laterais da edição comemorativa.' },
  // ---- Por cima
  { id: 'puffer', nome: 'Jaqueta puffer', categoria: 'roupa', lugar: 'casaco', preco: 480, nivel: 2, estilos: ['urbano', 'streetwear'], ocasioes: ['dia'], descricao: 'Gomos de enchimento, gola alta, para o frio de verdade.' },
  { id: 'trench_coat', nome: 'Trench coat', categoria: 'roupa', lugar: 'casaco', preco: 890, nivel: 3, estilos: ['elegante', 'vintage', 'social'], ocasioes: ['trabalho', 'dia', 'encontro'], descricao: 'Gabardine bege, trespassado, cinto e dragonas.' },
  { id: 'jaqueta_bomber', nome: 'Jaqueta bomber', categoria: 'roupa', lugar: 'casaco', preco: 290, nivel: 2, estilos: ['streetwear', 'urbano', 'casual'], ocasioes: ['dia', 'festa'], descricao: 'Náilon, punho e barra de ribana, zíper frontal.' },
  { id: 'cardigan', nome: 'Cardigã de tricô', categoria: 'roupa', lugar: 'casaco', preco: 210, nivel: 2, estilos: ['vintage', 'minimalista', 'casual'], ocasioes: ['dia', 'trabalho', 'estudo'], descricao: 'Tricô aberto na frente, botões, bolsos chapados.' },
  { id: 'jaqueta_corrida', nome: 'Jaqueta de pista', categoria: 'roupa', lugar: 'casaco', preco: 1200, nivel: 3, estilos: ['esportivo', 'streetwear'], ocasioes: ['dia', 'esporte'], descricao: 'Inspirada nas equipes de corrida: faixas no peito, gola alta, patches.' },
  { id: 'jaleco', nome: 'Jaleco', categoria: 'roupa', lugar: 'casaco', preco: 150, nivel: 1, estilos: ['minimalista'], ocasioes: ['trabalho'], descricao: 'Branco, manga longa, bolsos de caneta: o uniforme da saúde e do laboratório.' },
  { id: 'casaco_vison_sintetico', nome: 'Casaco de pele sintética de grife', categoria: 'roupa', lugar: 'casaco', preco: 21000, luxo: true, nivel: 5, estilos: ['luxuoso', 'elegante'], ocasioes: ['evento', 'festa'], descricao: 'Pelo sintético longo, forro de seda — sem pele animal.' },
  // ---- Nos pés
  { id: 'tenis_basquete', nome: 'Tênis de basquete', categoria: 'roupa', lugar: 'pes', preco: 900, nivel: 3, estilos: ['streetwear', 'esportivo', 'hiphop'], ocasioes: ['dia', 'esporte'], descricao: 'Cano alto acolchoado, solado largo, a silhueta das quadras.' },
  { id: 'chuteira', nome: 'Chuteira de campo', categoria: 'roupa', lugar: 'pes', preco: 650, nivel: 3, estilos: ['esportivo'], ocasioes: ['esporte'], descricao: 'Travas de borracha, cabedal fino, para o gramado.' },
  { id: 'bota_chelsea', nome: 'Bota chelsea', categoria: 'roupa', lugar: 'pes', preco: 520, nivel: 3, estilos: ['rock', 'elegante', 'minimalista'], ocasioes: ['dia', 'trabalho', 'encontro'], descricao: 'Couro, elástico lateral, sem cadarço.' },
  { id: 'tenis_grife', nome: 'Tênis de grife', categoria: 'roupa', lugar: 'pes', preco: 5600, luxo: true, nivel: 4, estilos: ['luxuoso', 'streetwear'], ocasioes: ['dia', 'festa'], descricao: 'Couro italiano, sola robusta, o logo na lingueta.' },
  // ---- Acessórios: relógios, pescoço, bolsas
  { id: 'relogio_esportivo_cronografo', nome: 'Relógio cronógrafo esportivo', categoria: 'acessorio', lugar: 'pulso', preco: 2900, nivel: 3, estilos: ['esportivo', 'casual'], ocasioes: ['dia', 'trabalho', 'esporte'], descricao: 'Aço, cronômetro, taquímetro na luneta.' },
  { id: 'relogio_titanio', nome: 'Relógio de titânio', categoria: 'acessorio', lugar: 'pulso', preco: 9800, nivel: 4, estilos: ['minimalista', 'esportivo'], ocasioes: ['dia', 'trabalho'], descricao: 'Leve, cinza fosco, vidro de safira.' },
  { id: 'relogio_ouro_rose', nome: 'Relógio de ouro rosé', categoria: 'acessorio', lugar: 'pulso', preco: 62000, luxo: true, nivel: 5, estilos: ['luxuoso', 'elegante'], ocasioes: ['evento', 'encontro', 'trabalho'], descricao: 'Caixa de ouro rosé 18k, pulseira de jacaré, mostrador guilhochado.' },
  { id: 'gargantilha_couro', nome: 'Colar de couro', categoria: 'acessorio', lugar: 'joia', preco: 60, nivel: 1, visual: { joia: 'corrente' }, estilos: ['rock', 'alternativo', 'casual'], ocasioes: ['dia', 'festa'], descricao: 'Tira de couro com fecho de metal.' },
  { id: 'bolsa_couro_media', nome: 'Bolsa de couro', categoria: 'acessorio', lugar: 'bolsa', preco: 690, nivel: 3, estilos: ['elegante', 'casual', 'minimalista'], ocasioes: ['trabalho', 'dia', 'encontro'], descricao: 'Couro legítimo, alça de ombro, fecho de ímã.' },
  { id: 'mochila_couro', nome: 'Mochila de couro', categoria: 'acessorio', lugar: 'bolsa', preco: 1100, nivel: 3, estilos: ['minimalista', 'urbano'], ocasioes: ['trabalho', 'estudo', 'dia'], descricao: 'Couro vegetal que escurece com o tempo, compartimento para o notebook.' },
  { id: 'mochila_esportiva', nome: 'Mochila de academia', categoria: 'acessorio', lugar: 'bolsa', preco: 180, nivel: 1, estilos: ['esportivo'], ocasioes: ['esporte', 'estudo'], descricao: 'Náilon, bolso para o tênis, porta-garrafa.' },
  { id: 'pochete_grife', nome: 'Pochete de grife', categoria: 'acessorio', lugar: 'bolsa', preco: 9800, luxo: true, nivel: 5, estilos: ['luxuoso', 'streetwear'], ocasioes: ['dia', 'festa'], descricao: 'Lona monogramada e couro, usada atravessada no peito.' },
  { id: 'clutch_pedraria', nome: 'Clutch de pedraria', categoria: 'acessorio', lugar: 'bolsa', preco: 14500, luxo: true, nivel: 5, estilos: ['luxuoso', 'elegante'], ocasioes: ['evento'], descricao: 'Bordada de cristais, corrente fina que some dentro.' },
  { id: 'bolsa_edicao_limitada', nome: 'Bolsa de edição limitada', categoria: 'acessorio', lugar: 'bolsa', preco: 120000, luxo: true, nivel: 6, edicao: 'série numerada', estilos: ['luxuoso'], ocasioes: ['evento', 'encontro'], descricao: 'Couro exótico de criação certificada, ferragens banhadas a ouro, numerada: a lista de espera é a porta.' }
];
