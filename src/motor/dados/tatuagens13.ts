/**
 * VIDA 13 — O CATÁLOGO DO ESTÚDIO CRESCE DE NOVO. Desenhos novos, cada um com arte própria (`ui/avatar/tatuagens13`
 * e `ui/avatar/tatuagens13Pop`):
 *
 * - CULTURA POP: as obras que faltavam (videogames, livros, séries, filmes, animações) e mais peças das que já havia.
 *   Como na 12.9, a arte é um desenho ORIGINAL do estúdio que lembra a obra — o objeto, a arma, a criatura, o cenário,
 *   o emblema reinterpretado, uma palavra curta —, nunca a arte oficial, o logotipo ou o rosto de um personagem
 *   copiado. O campo `referencia` diz a obra; `MIDIA_DA_OBRA` agrupa as obras (o estúdio filtra por elas).
 * - Os estilos independentes ganham peças: geométricas, abstratas, minimalistas, ornamentais, surrealistas,
 *   conceituais, blackwork, old school, oriental, fine line, tribal, realistas; e os temas bichos (com a fauna
 *   brasileira), natureza, criaturas e mitos, céu e espaço.
 *
 * Puro (só tipos e dados): fica no pacote `motor-casa`, como a 12.9. O save guarda só o id: nada muda para quem já tem.
 */
import type { DesenhoDeTatuagem, TamanhoDeTatuagem } from './tatuagens';

const T = (...xs: TamanhoDeTatuagem[]) => xs;
type D = Omit<DesenhoDeTatuagem, 'tamanho' | 'tamanhos'> & { tamanhos: TamanhoDeTatuagem[] };
const pop = (referencia: string, xs: Omit<D, 'estilo' | 'referencia'>[]): D[] => xs.map(x => ({ ...x, estilo: 'cultura_pop', referencia }));
const tema = (t: NonNullable<D['tema']>, xs: D[]): D[] => xs.map(x => ({ ...x, tema: t }));

/** De que tipo de obra é cada referência (o seletor de obra do estúdio agrupa por aqui). */
export type MidiaDaObra = 'games' | 'livros' | 'series' | 'filmes' | 'animacoes';
export const NOME_MIDIA: Record<MidiaDaObra, string> = { games: 'Videogames', livros: 'Livros', series: 'Séries', filmes: 'Filmes', animacoes: 'Animações e anime' };
export const MIDIA_DA_OBRA: Record<string, MidiaDaObra> = {
  // de antes (12.9)
  'Pokémon': 'games', 'The Legend of Zelda': 'games', 'Super Mario': 'games',
  'Harry Potter': 'livros', 'O Senhor dos Anéis': 'livros', 'Jogos Vorazes': 'livros', 'O Guia do Mochileiro das Galáxias': 'livros', 'O Mágico de Oz': 'livros',
  'Breaking Bad': 'series', 'Game of Thrones': 'series', 'Stranger Things': 'series', 'The Walking Dead': 'series', 'Peaky Blinders': 'series', 'The Office': 'series', 'Doctor Who': 'series',
  'Star Wars': 'filmes', 'Matrix': 'filmes', 'Jurassic Park': 'filmes', 'Marvel': 'filmes', 'DC': 'filmes', 'Piratas do Caribe': 'filmes', 'De Volta para o Futuro': 'filmes', 'Tubarão': 'filmes',
  'Naruto': 'animacoes', 'Dragon Ball': 'animacoes', 'One Piece': 'animacoes', 'Studio Ghibli': 'animacoes', 'Sailor Moon': 'animacoes', 'Attack on Titan': 'animacoes', 'Os Simpsons': 'animacoes',
  'Avatar: A Lenda de Aang': 'animacoes', 'A Bela e a Fera': 'animacoes', 'O Rei Leão': 'animacoes',
  // novas (13)
  'GTA': 'games', 'The Last of Us': 'games', 'God of War': 'games', 'Red Dead Redemption': 'games', 'Dark Souls': 'games', 'Elden Ring': 'games', 'Bloodborne': 'games',
  'Minecraft': 'games', 'Resident Evil': 'games', "Assassin's Creed": 'games', 'The Witcher': 'games', 'Cyberpunk 2077': 'games', 'Sonic': 'games', 'Tetris': 'games',
  'Percy Jackson': 'livros', 'Duna': 'livros', 'Sherlock Holmes': 'livros', 'O Pequeno Príncipe': 'livros', 'Dom Quixote': 'livros', 'Moby Dick': 'livros', 'Alice no País das Maravilhas': 'livros', 'Drácula': 'livros',
  'Vikings': 'series', 'Friends': 'series', 'Dark': 'series', 'Round 6': 'series', 'Lost': 'series', 'La Casa de Papel': 'series',
  'Indiana Jones': 'filmes', 'O Iluminado': 'filmes', 'Interestelar': 'filmes', 'Kill Bill': 'filmes', 'O Poderoso Chefão': 'filmes',
  'Death Note': 'animacoes', 'Rick and Morty': 'animacoes', 'Demon Slayer': 'animacoes', 'Evangelion': 'animacoes', 'Cavaleiros do Zodíaco': 'animacoes'
};

const LISTA: D[] = [
  /* ================================================================ CULTURA POP · videogames */
  ...pop('GTA', [
    { id: 'estrelas_de_procurado', nome: 'Estrelas de procurado', tamanhos: T(1, 2), colorida: true, proporcao: 3.2, descricao: 'Cinco estrelas em fila, três acesas: a polícia já está atrás.' },
    { id: 'palmeiras_ao_por_do_sol', nome: 'Palmeiras ao pôr do sol', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.2, descricao: 'Duas palmeiras contra o sol listrado de rosa e laranja da cidade da costa.' },
    { id: 'missao_cumprida', nome: 'Missão cumprida', tamanhos: T(1, 2), colorida: true, proporcao: 2.8, descricao: 'As duas palavras em letra amarela grossa, com sombra preta, como no fim da missão.' }
  ]),
  ...pop('The Last of Us', [
    { id: 'vaga_lume', nome: 'Vaga-lume aceso', tamanhos: T(1, 2), colorida: true, descricao: 'O vaga-lume de asas abertas e o brilho amarelo em volta: procure a luz.' },
    { id: 'mascara_com_fungo', nome: 'Máscara de gás com fungo', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'A máscara de gás rachada, cogumelos brotando do filtro.' }
  ]),
  ...pop('God of War', [
    { id: 'machado_runico', nome: 'Machado de runas', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.7, descricao: 'O machado de lâmina larga com runas azuis de gelo e o cabo enfaixado.' },
    { id: 'laminas_acorrentadas', nome: 'Lâminas acorrentadas', tamanhos: T(2, 3), colorida: true, descricao: 'Duas lâminas curvas em brasa presas por correntes que se cruzam.' }
  ]),
  ...pop('Red Dead Redemption', [
    { id: 'revolver_e_chapeu', nome: 'Revólver e chapéu', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.3, descricao: 'O chapéu de vaqueiro gasto e o revólver de cano longo atravessado embaixo.' },
    { id: 'cranio_de_boi', nome: 'Crânio de boi no deserto', tamanhos: T(1, 2, 3), proporcao: 1.2, descricao: 'O crânio de chifres longos, uma rachadura e o sol baixo atrás.' }
  ]),
  ...pop('Dark Souls', [
    { id: 'fogueira_com_espada', nome: 'Fogueira com espada', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.75, descricao: 'A espada torta cravada no monte de cinzas, as chamas subindo em volta.' },
    { id: 'elmo_de_cavaleiro', nome: 'Elmo de cavaleiro caído', tamanhos: T(1, 2), proporcao: 0.85, descricao: 'O elmo fechado de fenda estreita, amassado, uma pena quebrada no topo.' }
  ]),
  ...pop('Elden Ring', [
    { id: 'arvore_dourada', nome: 'Árvore dourada', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'A árvore gigante de galhos de ouro, a luz caindo sobre o castelo pequeno embaixo.' },
    { id: 'anel_de_runas', nome: 'Anel de runas', tamanhos: T(1, 2, 3), colorida: true, descricao: 'Um anel de ouro grosso, rachado, com runas gravadas em volta e a luz escapando pela fresta.' }
  ]),
  ...pop('Bloodborne', [
    { id: 'lua_de_sangue_gotica', nome: 'Lua de sangue gótica', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'A lua enorme e avermelhada atrás das torres pontudas da cidade.' },
    { id: 'cutelo_serrilhado', nome: 'Cutelo serrilhado', tamanhos: T(1, 2), proporcao: 0.45, descricao: 'A lâmina de serra dobrável, os dentes de um lado, o cabo de couro.' }
  ]),
  ...pop('Minecraft', [
    { id: 'bloco_de_grama', nome: 'Bloco de grama', tamanhos: T(1, 2), colorida: true, descricao: 'O cubo de terra com a grama por cima, em pixels, visto de quina.' },
    { id: 'picareta_de_pixels', nome: 'Picareta de pixels', tamanhos: T(1, 2), colorida: true, descricao: 'A picareta de diamante feita de quadradinhos, na diagonal.' }
  ]),
  ...pop('Resident Evil', [
    { id: 'erva_no_vaso', nome: 'Erva no vaso', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'A plantinha verde de folhas pontudas no vaso de barro: cura tudo.' },
    { id: 'maquina_de_escrever', nome: 'Máquina de escrever', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'A máquina antiga com uma folha em branco e uma fita de tinta ao lado.' }
  ]),
  ...pop("Assassin's Creed", [
    { id: 'lamina_oculta', nome: 'Lâmina oculta', tamanhos: T(1, 2), colorida: true, proporcao: 2.4, descricao: 'O punho fechado, a braçadeira de couro e a lâmina fina saindo por baixo do pulso.' },
    { id: 'aguia_em_mergulho', nome: 'Águia em mergulho', tamanhos: T(1, 2, 3), proporcao: 0.75, descricao: 'A águia de asas fechadas descendo de cabeça, o salto de cima da torre.' }
  ]),
  ...pop('The Witcher', [
    { id: 'medalhao_de_lobo', nome: 'Medalhão de lobo', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'O medalhão de prata com a cabeça de lobo de boca aberta pendurado na corrente.' },
    { id: 'duas_espadas', nome: 'Aço e prata', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'Duas espadas cruzadas: uma de aço para gente, outra de prata para monstros.' }
  ]),
  ...pop('Cyberpunk 2077', [
    { id: 'braco_cibernetico', nome: 'Braço cibernético', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.55, descricao: 'O antebraço de placas de metal com cabos aparentes e luz neon nas juntas.' },
    { id: 'chip_neon', nome: 'Chip neon', tamanhos: T(1, 2), colorida: true, descricao: 'O chip com trilhas de circuito acesas em rosa e azul, como letreiro de rua.' }
  ]),
  ...pop('Sonic', [
    { id: 'aneis_dourados', nome: 'Anéis dourados', tamanhos: T(1, 2), colorida: true, proporcao: 2.4, descricao: 'Três anéis de ouro girando, um de lado, com brilho.' },
    { id: 'tenis_veloz', nome: 'Tênis veloz', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'O tênis vermelho de faixa branca e fivela, com as linhas de velocidade atrás.' }
  ]),
  ...pop('Tetris', [
    { id: 'pecas_caindo', nome: 'Peças caindo', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.7, descricao: 'As peças de quatro quadrados se encaixando, uma ainda descendo.' }
  ]),
  ...pop('The Legend of Zelda', [
    { id: 'espada_no_pedestal', nome: 'Espada no pedestal', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.55, descricao: 'A espada de guarda azul em asas cravada na pedra, à espera do herói.' }
  ]),
  ...pop('Super Mario', [
    { id: 'flor_de_fogo', nome: 'Flor de fogo', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'Uma flor de pétalas em labareda, vermelhas e laranja, com duas folhas no caule.' },
    { id: 'bloco_e_moeda', nome: 'Bloco e moeda', tamanhos: T(1, 2), colorida: true, descricao: 'O bloco de tijolo e a moeda de ouro pulando de cima dele.' }
  ]),
  ...pop('Pokémon', [
    { id: 'insignias_de_ginasio', nome: 'Insígnias de ginásio', tamanhos: T(1, 2), colorida: true, proporcao: 2.6, descricao: 'Quatro insígnias de metal colorido em fila: pedra, gota, raio e folha.' }
  ]),

  /* ================================================================ CULTURA POP · livros */
  ...pop('Percy Jackson', [
    { id: 'caneta_espada', nome: 'Caneta que vira espada', tamanhos: T(1, 2), colorida: true, proporcao: 0.5, descricao: 'A caneta esferográfica abrindo em lâmina de bronze, o brilho no meio.' },
    { id: 'tridente_nas_ondas', nome: 'Tridente nas ondas', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.6, descricao: 'O tridente de pé saindo das ondas verdes do mar.' }
  ]),
  ...pop('Duna', [
    { id: 'verme_da_areia', nome: 'Verme da areia', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'A boca redonda de dentes em anel rompendo a duna, a areia escorrendo.' },
    { id: 'duas_luas_no_deserto', nome: 'Duas luas no deserto', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.5, descricao: 'As dunas em camadas e duas luas no céu, uma grande e uma pequena.' }
  ]),
  ...pop('Sherlock Holmes', [
    { id: 'cachimbo_e_lupa', nome: 'Cachimbo e lupa', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'O cachimbo curvo soltando fumaça e a lupa de cabo de madeira cruzada.' },
    { id: 'chapeu_de_detetive', nome: 'Chapéu de detetive', tamanhos: T(1, 2), colorida: true, proporcao: 1.5, descricao: 'O chapéu xadrez de duas abas, as orelheiras amarradas em cima.' },
    { id: 'elementar', nome: 'Elementar', tamanhos: T(1, 2), proporcao: 3, descricao: 'A palavra em letra de máquina antiga, com uma lupa no lugar do ponto.' }
  ]),
  ...pop('O Pequeno Príncipe', [
    { id: 'planeta_com_rosa', nome: 'Planeta com rosa', tamanhos: T(1, 2, 3), colorida: true, descricao: 'O planeta pequeno com dois vulcões, uma rosa na redoma de vidro e as estrelas.' },
    { id: 'chapeu_ou_jiboia', nome: 'Chapéu ou jiboia', tamanhos: T(1, 2), proporcao: 2.2, descricao: 'O desenho que parece um chapéu e é uma cobra que engoliu um elefante.' }
  ]),
  ...pop('Dom Quixote', [
    { id: 'moinho_e_lanca', nome: 'Moinho e lança', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'O moinho de vento de pás em X e a lança apontada contra ele.' }
  ]),
  ...pop('Moby Dick', [
    { id: 'baleia_branca_e_arpao', nome: 'Baleia branca e arpão', tamanhos: T(2, 3), colorida: true, proporcao: 1.6, descricao: 'A cachalote branca saltando, cicatrizes no lombo, o arpão com corda ao lado.' }
  ]),
  ...pop('Alice no País das Maravilhas', [
    { id: 'relogio_do_coelho', nome: 'Relógio do coelho', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'O relógio de bolso dourado com orelhas de coelho na argola: é tarde, é tarde.' },
    { id: 'xicara_e_cartas', nome: 'Chá e cartas', tamanhos: T(1, 2, 3), colorida: true, descricao: 'A xícara de chá rachada com cartas de baralho voando para fora.' }
  ]),
  ...pop('Drácula', [
    { id: 'castelo_e_morcegos', nome: 'Castelo e morcegos', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'O castelo no alto da montanha, uma janela acesa e os morcegos na lua.' }
  ]),
  ...pop('Harry Potter', [
    { id: 'plataforma_secreta', nome: 'Plataforma nove e três quartos', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'A placa de estação na parede de tijolos, o número com a fração, e um carrinho de malas.' }
  ]),
  ...pop('O Senhor dos Anéis', [
    { id: 'espada_partida', nome: 'Espada partida', tamanhos: T(1, 2, 3), proporcao: 0.5, descricao: 'A espada quebrada em três pedaços, a guarda ainda inteira.' }
  ]),

  /* ================================================================ CULTURA POP · séries */
  ...pop('Vikings', [
    { id: 'drakkar', nome: 'Drakkar', tamanhos: T(2, 3), colorida: true, proporcao: 1.5, descricao: 'O barco de proa em cabeça de dragão, a vela listrada e os escudos na borda.' },
    { id: 'vegvisir', nome: 'Bússola nórdica', tamanhos: T(1, 2, 3), descricao: 'Oito braços de runa saindo do centro, cada um com a sua ponta.' },
    { id: 'machado_barbudo', nome: 'Machado barbudo', tamanhos: T(1, 2), proporcao: 0.6, descricao: 'O machado de lâmina comprida para baixo, o cabo com nós entalhados.' }
  ]),
  ...pop('Friends', [
    { id: 'moldura_do_olho_magico', nome: 'Moldura amarela', tamanhos: T(1, 2), colorida: true, proporcao: 0.85, descricao: 'A moldura dourada oval em volta do olho mágico da porta roxa.' },
    { id: 'sofa_e_guarda_chuvas', nome: 'Sofá e guarda-chuvas', tamanhos: T(2, 3), colorida: true, proporcao: 1.4, descricao: 'O sofá laranja e seis guarda-chuvas abertos, o chafariz atrás.' }
  ]),
  ...pop('Dark', [
    { id: 'triquetra_na_caverna', nome: 'Triquetra', tamanhos: T(1, 2, 3), descricao: 'Os três arcos entrelaçados num círculo, o símbolo do tempo que dá voltas.' }
  ]),
  ...pop('Round 6', [
    { id: 'circulo_triangulo_quadrado', nome: 'Círculo, triângulo e quadrado', tamanhos: T(1, 2), colorida: true, proporcao: 2.8, descricao: 'As três formas em rosa vivo, lado a lado, como no cartão do convite.' },
    { id: 'biscoito_de_favo', nome: 'Biscoito de favo', tamanhos: T(1, 2), colorida: true, descricao: 'O biscoito redondo de açúcar com um guarda-chuva estampado para recortar sem quebrar.' }
  ]),
  ...pop('Lost', [
    { id: 'numeros_da_ilha', nome: 'Os números', tamanhos: T(1, 2), proporcao: 3.4, descricao: 'Seis números em fila, em letra de painel: 4 8 15 16 23 42.' },
    { id: 'aviao_partido', nome: 'Avião partido na praia', tamanhos: T(2, 3), colorida: true, proporcao: 1.6, descricao: 'A asa de avião na areia, a palmeira e o mar.' }
  ]),
  ...pop('La Casa de Papel', [
    { id: 'macacao_e_notas', nome: 'Macacão vermelho', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'O macacão vermelho pendurado e as notas de dinheiro voando em volta.' }
  ]),
  ...pop('Game of Thrones', [
    { id: 'coroa_de_gelo', nome: 'Coroa de gelo', tamanhos: T(1, 2), colorida: true, proporcao: 1.4, descricao: 'Uma coroa de pontas de gelo azul, o frio que vem do norte.' }
  ]),
  ...pop('Stranger Things', [
    { id: 'walkie_talkie_e_bicicleta', nome: 'Bicicleta e rádio', tamanhos: T(2, 3), colorida: true, proporcao: 1.5, descricao: 'A bicicleta de guidão alto com um rádio de antena preso no cesto.' }
  ]),
  ...pop('Peaky Blinders', [
    { id: 'relogio_de_corrente', nome: 'Relógio de corrente', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'O relógio de bolso de colete preso na corrente, a tampa aberta.' }
  ]),

  /* ================================================================ CULTURA POP · filmes */
  ...pop('Star Wars', [
    { id: 'dois_sois', nome: 'Dois sóis', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.4, descricao: 'Dois sóis se pondo sobre o deserto, a casa de cúpula baixa embaixo.' }
  ]),
  ...pop('Matrix', [
    { id: 'colher_torta', nome: 'Colher torta', tamanhos: T(1, 2), proporcao: 0.45, descricao: 'A colher dobrada ao meio: não existe colher.' }
  ]),
  ...pop('Jurassic Park', [
    { id: 'copo_tremendo', nome: 'Copo tremendo', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'O copo d’água no painel do carro com os círculos tremendo na superfície.' }
  ]),
  ...pop('Marvel', [
    { id: 'reator_no_peito', nome: 'Reator no peito', tamanhos: T(1, 2), colorida: true, descricao: 'Um anel de metal com bobinas em volta e a luz azul acesa no centro, no lugar do coração.' }
  ]),
  ...pop('DC', [
    { id: 'cristal_verde', nome: 'Cristal verde', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'O cristal verde brilhante de pontas, a única fraqueza do herói.' }
  ]),
  ...pop('De Volta para o Futuro', [
    { id: 'relogio_da_torre', nome: 'Relógio da torre', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.75, descricao: 'O relógio da prefeitura parado às 10h04 e o raio caindo no para-raios.' }
  ]),
  ...pop('Indiana Jones', [
    { id: 'chicote_e_chapeu', nome: 'Chicote e chapéu', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.3, descricao: 'O chapéu de feltro de aba larga e o chicote enrolado embaixo.' },
    { id: 'idolo_dourado', nome: 'Ídolo dourado', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'A estatueta de ouro sentada sobre o pedestal de pedra, prestes a ser trocada.' }
  ]),
  ...pop('O Iluminado', [
    { id: 'tapete_do_hotel', nome: 'Tapete do hotel', tamanhos: T(1, 2, 3), colorida: true, descricao: 'Um tapete de hexágonos encaixados em laranja e marrom e a placa de porta com o número 237.' }
  ]),
  ...pop('Interestelar', [
    { id: 'buraco_negro', nome: 'Buraco negro', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.4, descricao: 'O disco de luz dobrado por cima e por baixo do círculo preto.' }
  ]),
  ...pop('Kill Bill', [
    { id: 'katana_e_sangue', nome: 'Katana e respingos', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.45, descricao: 'A espada japonesa de bainha preta, a faixa amarela e respingos vermelhos.' }
  ]),
  ...pop('O Poderoso Chefão', [
    { id: 'maos_de_marionete', nome: 'Mão de marionete', tamanhos: T(1, 2, 3), proporcao: 0.8, descricao: 'A mão segurando a cruz de madeira, os fios caindo para baixo, e uma rosa na lapela.' }
  ]),

  /* ================================================================ CULTURA POP · animações */
  ...pop('Death Note', [
    { id: 'caderno_preto', nome: 'Caderno preto', tamanhos: T(1, 2), colorida: true, proporcao: 0.75, descricao: 'O caderno de capa preta, sem nome, cantos gastos e uma caneta-tinteiro em cima.' },
    { id: 'maca_vermelha', nome: 'Maçã vermelha', tamanhos: T(1, 2), colorida: true, proporcao: 0.85, descricao: 'A maçã brilhante de folha só, segura por dedos compridos com garras.' }
  ]),
  ...pop('Rick and Morty', [
    { id: 'portal_verde', nome: 'Portal verde', tamanhos: T(1, 2, 3), colorida: true, descricao: 'O redemoinho verde-limão de bordas pingando, aberto no meio do nada.' },
    { id: 'disco_de_garagem', nome: 'Nave de garagem', tamanhos: T(1, 2), colorida: true, proporcao: 1.8, descricao: 'O disco voador feito de sucata, com antenas e uma luz quebrada.' }
  ]),
  ...pop('Demon Slayer', [
    { id: 'padrao_xadrez_e_espada', nome: 'Espada no xadrez', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.7, descricao: 'A espada de lâmina preta sobre o padrão de quadrados verde e preto.' },
    { id: 'brinco_de_sol', nome: 'Brincos de sol', tamanhos: T(1), colorida: true, proporcao: 1.4, descricao: 'Os brincos de placa pendurados, com o sol nascente pintado.' }
  ]),
  ...pop('Evangelion', [
    { id: 'cruz_de_luz', nome: 'Cruz de luz', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.7, descricao: 'A explosão em forma de cruz alta e o brilho laranja no horizonte.' }
  ]),
  ...pop('Cavaleiros do Zodíaco', [
    { id: 'armadura_em_caixa', nome: 'Urna da armadura', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'A caixa de bronze com a constelação gravada na tampa e as alças de corrente.' }
  ]),
  ...pop('Naruto', [
    { id: 'pergaminho_selado', nome: 'Pergaminho selado', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'O pergaminho enrolado com o lacre de papel e a corda vermelha.' }
  ]),
  ...pop('Dragon Ball', [
    { id: 'capsula', nome: 'Cápsula', tamanhos: T(1), colorida: true, proporcao: 0.5, descricao: 'A cápsula de apertar o botão e jogar: dentro cabe uma casa.' }
  ]),
  ...pop('One Piece', [
    { id: 'mapa_do_tesouro', nome: 'Mapa do tesouro', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.3, descricao: 'O mapa de papel velho com a ilha, o caminho tracejado e o X vermelho.' }
  ]),
  ...pop('Attack on Titan', [
    { id: 'chave_no_cordao', nome: 'Chave no cordão', tamanhos: T(1, 2), proporcao: 0.5, descricao: 'A chave antiga pendurada no cordão: o porão guarda a verdade.' }
  ]),
  ...pop('Os Simpsons', [
    { id: 'barra_radioativa', nome: 'Barra radioativa', tamanhos: T(1, 2), colorida: true, proporcao: 0.45, descricao: 'A barra verde brilhando, pega na pinça da usina.' }
  ]),
  ...pop('Studio Ghibli', [
    { id: 'castelo_ambulante', nome: 'Castelo que anda', tamanhos: T(2, 3), colorida: true, descricao: 'O castelo de sucata e chaminés sobre pernas de galinha, soltando fumaça.' }
  ]),

  /* ================================================================ GEOMÉTRICAS */
  { id: 'espiral_aurea', nome: 'Espiral áurea', estilo: 'geometrica', tamanhos: T(1, 2, 3), proporcao: 1.6, descricao: 'Os quadrados da proporção áurea e a espiral que passa por eles.' },
  { id: 'triangulo_impossivel', nome: 'Triângulo de três barras', estilo: 'geometrica', tamanhos: T(1, 2), descricao: 'Três barras em três tons de cinza encaixadas em triângulo, com o vão no meio.' },
  { id: 'dodecaedro', nome: 'Dodecaedro', estilo: 'geometrica', tamanhos: T(1, 2, 3), descricao: 'O sólido de doze faces em arame, as arestas de trás pontilhadas.' },
  { id: 'circulos_concentricos', nome: 'Círculos concêntricos', estilo: 'geometrica', tamanhos: T(1, 2), descricao: 'Anéis de dentro para fora, cortados por uma reta, metade cheia.' },
  { id: 'ondas_op_art', nome: 'Ilusão de ondas', estilo: 'geometrica', tamanhos: T(1, 2, 3), proporcao: 0.8, descricao: 'Linhas paralelas que incham no meio e parecem saltar da pele.' },
  { id: 'losango_pontilhado', nome: 'Losango pontilhado', estilo: 'geometrica', tamanhos: T(1, 2), proporcao: 0.7, descricao: 'Um losango dentro do outro, o de dentro pontilhado e o miolo cheio.' },
  /* ================================================================ ABSTRATAS */
  { id: 'curvas_de_nivel', nome: 'Curvas de nível', estilo: 'abstrata', tamanhos: T(1, 2, 3), descricao: 'As linhas do mapa topográfico apertando em volta de um pico.' },
  { id: 'mancha_de_rorschach', nome: 'Mancha de Rorschach', estilo: 'abstrata', tamanhos: T(1, 2, 3), proporcao: 1.3, descricao: 'A mancha de tinta dobrada no meio: cada um vê uma coisa.' },
  { id: 'cacos_coloridos', nome: 'Cacos coloridos', estilo: 'abstrata', tamanhos: T(1, 2), colorida: true, descricao: 'Pedaços de vidro de cor separados por linhas pretas, como vitral quebrado.' },
  { id: 'linha_que_vira_onda', nome: 'Linha que vira onda', estilo: 'abstrata', tamanhos: T(1, 2), proporcao: 2.8, descricao: 'Uma reta calma que começa a ondular até virar rabisco.' },
  /* ================================================================ MINIMALISTAS */
  { id: 'seta_simples', nome: 'Flecha', estilo: 'minimalista', tamanhos: T(1), proporcao: 3, descricao: 'Uma flecha com penas: para frente.' },
  { id: 'passaros_em_bando', nome: 'Pássaros em bando', estilo: 'minimalista', tamanhos: T(1, 2), proporcao: 1.6, descricao: 'Cinco tracinhos de asa em V, diminuindo para longe.' },
  { id: 'sol_nascendo', nome: 'Sol nascendo', estilo: 'minimalista', tamanhos: T(1), proporcao: 1.8, descricao: 'Meio círculo na linha do horizonte e cinco raios.' },
  { id: 'casinha_de_linha', nome: 'Casinha', estilo: 'minimalista', tamanhos: T(1), descricao: 'O telhado, a porta e a chaminé em quatro traços: o lugar de volta.' },
  { id: 'folha_unica', nome: 'Folha só', estilo: 'minimalista', tamanhos: T(1), proporcao: 0.6, descricao: 'Uma folha com a nervura no meio.' },
  /* ================================================================ ORNAMENTAIS */
  { id: 'rosacea', nome: 'Rosácea', estilo: 'ornamental', tamanhos: T(2, 3), colorida: true, descricao: 'A janela redonda de catedral, pétalas de vitral em volta do centro.' },
  { id: 'cruz_ornamental', nome: 'Cruz ornamental', estilo: 'ornamental', tamanhos: T(1, 2), proporcao: 0.75, descricao: 'A cruz de pontas em flor de lis, contas no centro.' },
  { id: 'arabesco_espelhado', nome: 'Arabesco espelhado', estilo: 'ornamental', tamanhos: T(1, 2, 3), proporcao: 1.8, descricao: 'Volutas que saem do centro e se repetem iguais dos dois lados.' },
  { id: 'pingente_de_lua', nome: 'Pingente de lua', estilo: 'ornamental', tamanhos: T(1, 2), proporcao: 0.6, descricao: 'A lua crescente pendurada em contas, com três gotas embaixo.' },
  /* ================================================================ SURREALISTAS */
  { id: 'escada_para_a_lua', nome: 'Escada para a lua', estilo: 'surrealista', tamanhos: T(1, 2, 3), proporcao: 0.6, descricao: 'Uma escada de madeira subindo até a lua, que pende como lâmpada.' },
  { id: 'casa_no_balao', nome: 'Casa no balão', estilo: 'surrealista', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.75, descricao: 'Uma casinha presa a um balão só, subindo acima das nuvens.' },
  { id: 'lampada_com_oceano', nome: 'Oceano na lâmpada', estilo: 'surrealista', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'Dentro da lâmpada, o mar com uma onda e um barquinho.' },
  { id: 'olho_galaxia', nome: 'Olho de galáxia', estilo: 'surrealista', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'Um olho cuja íris é uma galáxia em espiral, e a lágrima é uma estrela.' },
  { id: 'peixe_no_ceu', nome: 'Peixe entre nuvens', estilo: 'surrealista', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.4, descricao: 'Um peixe nadando entre nuvens, as nuvens com ondas por baixo.' },
  { id: 'rosto_de_janela', nome: 'Rosto com janela', estilo: 'surrealista', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'O perfil de uma cabeça com uma janela aberta, e o céu lá dentro.' },
  /* ================================================================ CONCEITUAIS */
  { id: 'barra_carregando', nome: 'Carregando', estilo: 'conceitual', tamanhos: T(1, 2), proporcao: 3, descricao: 'A barra de carregamento quase cheia: ainda em construção.' },
  { id: 'pegada_raiz', nome: 'Pegada com raízes', estilo: 'conceitual', tamanhos: T(1, 2), proporcao: 0.6, descricao: 'Uma pegada cujos dedos viram raízes que entram na terra.' },
  { id: 'coracao_em_fio', nome: 'Coração de um fio só', estilo: 'conceitual', tamanhos: T(1, 2), proporcao: 1.6, descricao: 'Um novelo que se desfaz e o fio vira um coração.' },
  { id: 'balanca_mente_coracao', nome: 'Mente e coração', estilo: 'conceitual', tamanhos: T(1, 2, 3), proporcao: 1.2, descricao: 'A balança com um cérebro num prato e um coração no outro, em equilíbrio.' },
  { id: 'metade_rosto_caveira', nome: 'Meio rosto, meia caveira', estilo: 'conceitual', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'Um rosto partido ao meio: de um lado a pele, do outro o osso.' },
  /* ================================================================ BLACKWORK */
  { id: 'cervo_caveira', nome: 'Crânio de cervo', estilo: 'blackwork', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'O crânio de cervo de galhada aberta, em preto chapado e osso em negativo.' },
  { id: 'sol_negro', nome: 'Sol negro', estilo: 'blackwork', tamanhos: T(1, 2, 3), descricao: 'Um disco preto cheio, os raios em negativo cortando por dentro.' },
  { id: 'adaga_e_rosa_negra', nome: 'Adaga e rosa negra', estilo: 'blackwork', tamanhos: T(2, 3), proporcao: 0.5, descricao: 'A adaga atravessando a rosa, tudo em preto, as pétalas em espaço negativo.' },
  { id: 'faixa_de_triangulos', nome: 'Faixa de dentes', estilo: 'blackwork', tamanhos: T(1, 2), proporcao: 3, faixa: true, regioes: ['biceps', 'antebraco', 'coxa', 'panturrilha', 'canela', 'pulso', 'tornozelo'], descricao: 'Uma faixa de triângulos pretos que dá a volta no membro.' },
  { id: 'olho_na_lua', nome: 'Olho na lua', estilo: 'blackwork', tamanhos: T(1, 2), descricao: 'A lua cheia preta com um olho aberto em negativo no meio.' },
  /* ================================================================ OLD SCHOOL */
  { id: 'navio_na_garrafa', nome: 'Navio na garrafa', estilo: 'tradicional', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.6, descricao: 'A garrafa deitada com o veleiro dentro e a rolha.' },
  { id: 'chave_e_cadeado', nome: 'Chave e cadeado', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, descricao: 'O cadeado em coração e a chave ao lado: um não abre sem o outro.' },
  { id: 'lobo_tradicional', nome: 'Lobo old school', estilo: 'tradicional', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'A cabeça do lobo rosnando de frente, contorno grosso, a lua amarela atrás.' },
  { id: 'caveira_de_cartola', nome: 'Caveira de cartola', estilo: 'tradicional', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'A caveira com cartola preta e uma rosa vermelha na fita.' },
  { id: 'garrafa_de_veneno', nome: 'Frasco de veneno', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, proporcao: 0.65, descricao: 'O frasco verde de rolha com a caveira no rótulo.' },
  /* ================================================================ ORIENTAL */
  { id: 'portal_torii', nome: 'Portal torii', estilo: 'oriental', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.2, descricao: 'O portal vermelho de duas vigas, o sol atrás e a água embaixo.' },
  { id: 'leque', nome: 'Leque', estilo: 'oriental', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'O leque aberto com um galho de flor pintado e a borla pendurada.' },
  { id: 'mascara_kitsune', nome: 'Máscara de raposa', estilo: 'oriental', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'A máscara branca de raposa do festival, com riscos vermelhos.' },
  { id: 'bambu', nome: 'Bambu', estilo: 'oriental', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.5, descricao: 'Dois caules de bambu com nós e folhas finas, em pincelada.' },
  /* ================================================================ FINE LINE */
  { id: 'fio_do_destino', nome: 'Fio vermelho', estilo: 'fine_line', tamanhos: T(1, 2), colorida: true, proporcao: 2.4, descricao: 'Duas alianças ligadas por um fio vermelho que faz um coração no meio.' },
  { id: 'maos_se_tocando', nome: 'Mãos que quase se tocam', estilo: 'fine_line', tamanhos: T(1, 2), proporcao: 2.6, descricao: 'Dois indicadores que quase se encostam.' },
  { id: 'golfinho_fino', nome: 'Golfinho', estilo: 'fine_line', tamanhos: T(1, 2), proporcao: 1.4, descricao: 'O golfinho saltando em arco sobre uma onda de um traço.' },
  { id: 'orbita_fina', nome: 'Órbita', estilo: 'fine_line', tamanhos: T(1, 2), descricao: 'Um ponto, duas elipses e duas luas pequenas: tudo gira em volta de alguém.' },
  /* ================================================================ TRIBAL */
  { id: 'cruz_marquesa', nome: 'Cruz marquesa', estilo: 'tribal', tamanhos: T(1, 2), descricao: 'A cruz das ilhas Marquesas: quatro braços em degrau em volta de um centro vazado.' },
  { id: 'lagarto_tribal', nome: 'Lagarto tribal', estilo: 'tribal', tamanhos: T(1, 2, 3), proporcao: 0.6, descricao: 'O lagarto de cima, corpo e patas em blocos pretos curvos.' },
  { id: 'chamas_tribais', nome: 'Chamas tribais', estilo: 'tribal', tamanhos: T(1, 2, 3), proporcao: 0.8, descricao: 'Línguas de fogo em preto, pontudas, subindo e se curvando.' },
  { id: 'arraia_tribal', nome: 'Arraia tribal', estilo: 'tribal', tamanhos: T(2, 3), proporcao: 1.2, descricao: 'A arraia vista de cima, as asas cheias de dentes e ondas polinésias.' },
  /* ================================================================ REALISTAS */
  { id: 'estatua_grega', nome: 'Estátua grega', estilo: 'realista', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'O rosto de mármore de perfil, os cachos e uma rachadura na face.' },
  { id: 'coruja_realista', nome: 'Coruja realista', estilo: 'realista', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A coruja de frente, os olhos grandes e as penas em cinza.' },
  { id: 'rei_de_xadrez', nome: 'Rei de xadrez', estilo: 'realista', tamanhos: T(1, 2, 3), proporcao: 0.6, descricao: 'A peça do rei, de pé, a luz batendo de um lado e a sombra do outro.' },
  { id: 'lamparina', nome: 'Lamparina', estilo: 'realista', tamanhos: T(1, 2), proporcao: 0.7, descricao: 'A lamparina de vidro e metal com a chama acesa dentro.' },

  /* ================================================================ BICHOS (fauna brasileira e mais) */
  ...tema('animais', [
    { id: 'capivara', nome: 'Capivara', estilo: 'neotradicional', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.4, descricao: 'A capivara sentada, tranquila, com um passarinho nas costas.' },
    { id: 'lobo_guara', nome: 'Lobo-guará', estilo: 'neotradicional', tamanhos: T(2, 3), colorida: true, descricao: 'O lobo-guará de pernas compridas e orelhas grandes, a crina preta.' },
    { id: 'tatu_bola', nome: 'Tatu-bola', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'O tatu com a carapaça de faixas, meio enrolado.' },
    { id: 'mico_leao', nome: 'Mico-leão-dourado', estilo: 'aquarela', tamanhos: T(1, 2), colorida: true, proporcao: 0.85, descricao: 'O macaquinho de juba laranja agarrado a um galho, a cauda comprida.' },
    { id: 'morcego', nome: 'Morcego', estilo: 'blackwork', tamanhos: T(1, 2), proporcao: 2, descricao: 'As asas abertas de dedos longos, preto chapado.' },
    { id: 'pinguim', nome: 'Pinguim', estilo: 'minimalista', tamanhos: T(1), proporcao: 0.7, descricao: 'O pinguim de pé, a barriga branca e o bico laranja.' },
    { id: 'peixe_betta', nome: 'Peixe betta', estilo: 'aquarela', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.3, descricao: 'O peixe de nadadeiras em véu, azul e vermelho, flutuando.' },
    { id: 'tartaruga_marinha', nome: 'Tartaruga-marinha', estilo: 'pontilhismo', tamanhos: T(1, 2, 3), proporcao: 0.9, descricao: 'A tartaruga nadando, o casco em placas pontilhadas.' },
    { id: 'gato_arrepiado', nome: 'Gato arrepiado', estilo: 'tradicional', tamanhos: T(1, 2), proporcao: 1.3, descricao: 'O gato preto de costas arqueadas e o rabo em pé.' },
    { id: 'ourico', nome: 'Ouriço', estilo: 'fine_line', tamanhos: T(1), proporcao: 1.3, descricao: 'Um ouriço pequeno de espinhos em traço fino, o focinho pontudo.' }
  ]),
  /* ================================================================ NATUREZA */
  ...tema('natureza', [
    { id: 'ipe_amarelo', nome: 'Ipê-amarelo', estilo: 'aquarela', tamanhos: T(1, 2, 3), colorida: true, descricao: 'A árvore de galhos tortos coberta de flor amarela, sem uma folha.' },
    { id: 'aurora_boreal', nome: 'Aurora boreal', estilo: 'aquarela', tamanhos: T(2, 3), colorida: true, proporcao: 1.5, descricao: 'As cortinas de luz verde e roxa sobre os pinheiros escuros.' },
    { id: 'floco_de_neve', nome: 'Floco de neve', estilo: 'fine_line', tamanhos: T(1, 2), descricao: 'Seis braços iguais com ramos, cada um diferente do floco vizinho.' },
    { id: 'raio_na_nuvem', nome: 'Raio', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'A nuvem cinza e o raio amarelo descendo em ziguezague.' },
    { id: 'pinha', nome: 'Pinha', estilo: 'sketch', tamanhos: T(1, 2), proporcao: 0.7, descricao: 'A pinha de escamas em espiral, com um raminho.' },
    { id: 'vitoria_regia', nome: 'Vitória-régia', estilo: 'neotradicional', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.4, descricao: 'A folha redonda de borda virada na água e a flor branca e rosa.' },
    { id: 'lago_espelhado', nome: 'Lago espelhado', estilo: 'blackwork', tamanhos: T(1, 2, 3), proporcao: 0.8, descricao: 'A montanha e o seu reflexo no lago, o de baixo em linhas.' },
    { id: 'folha_de_bananeira', nome: 'Folha de bananeira', estilo: 'floral', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.5, descricao: 'A folha comprida rasgada pelo vento, a nervura grossa no meio.' }
  ]),
  /* ================================================================ CRIATURAS E MITOS */
  ...tema('criaturas', [
    { id: 'unicornio', nome: 'Unicórnio', estilo: 'neotradicional', tamanhos: T(2, 3), colorida: true, proporcao: 0.85, descricao: 'A cabeça do cavalo branco de crina ao vento e o chifre em espiral.' },
    { id: 'cauda_de_sereia', nome: 'Cauda de sereia', estilo: 'fine_line', tamanhos: T(1, 2), colorida: true, proporcao: 0.6, descricao: 'A cauda de escamas saindo da água, a barbatana aberta.' },
    { id: 'minotauro', nome: 'Minotauro', estilo: 'blackwork', tamanhos: T(2, 3), proporcao: 0.9, descricao: 'A cabeça de touro de chifres grandes e argola no nariz, dentro do labirinto.' },
    { id: 'serpente_marinha', nome: 'Serpente marinha', estilo: 'tradicional', tamanhos: T(2, 3), colorida: true, proporcao: 1.6, descricao: 'O monstro do mar em três voltas saindo das ondas.' },
    { id: 'fenix_pequena', nome: 'Fênix em chamas', estilo: 'neotradicional', tamanhos: T(1, 2, 3), colorida: true, descricao: 'A ave de fogo de asas abertas, a cauda em labaredas.' },
    { id: 'kraken', nome: 'Kraken e navio', estilo: 'sketch', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'Os tentáculos enormes saindo do mar e enrolando um veleiro.' },
    { id: 'olho_de_dragao', nome: 'Olho de dragão', estilo: 'realista', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'O olho de pupila em fenda cercado de escamas.' }
  ]),
  /* ================================================================ CÉU E ESPAÇO */
  ...tema('cosmos', [
    { id: 'astronauta_flutuando', nome: 'Astronauta flutuando', estilo: 'fine_line', tamanhos: T(1, 2, 3), proporcao: 0.85, descricao: 'O astronauta solto no espaço, o cabo de segurança em espiral.' },
    { id: 'foguete', nome: 'Foguete', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, proporcao: 0.6, descricao: 'O foguete de janela redonda e aletas, o fogo saindo embaixo.' },
    { id: 'sistema_solar', nome: 'Sistema solar', estilo: 'minimalista', tamanhos: T(1, 2), proporcao: 3, descricao: 'O sol e os planetas em fila, cada um do seu tamanho.' },
    { id: 'galaxia_espiral', nome: 'Galáxia', estilo: 'pontilhismo', tamanhos: T(1, 2, 3), proporcao: 1.3, descricao: 'Os braços da galáxia em pontos, o centro denso e claro.' },
    { id: 'eclipse', nome: 'Eclipse', estilo: 'blackwork', tamanhos: T(1, 2), descricao: 'O disco preto da lua cobrindo o sol, a coroa de raios em volta.' }
  ])
];

export const DESENHOS_13: DesenhoDeTatuagem[] = LISTA.map(x => ({ ...x, tamanho: x.tamanhos.length === 3 ? x.tamanhos[1] : x.tamanhos[x.tamanhos.length - 1] }));
