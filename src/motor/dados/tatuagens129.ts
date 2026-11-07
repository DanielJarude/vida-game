/**
 * VIDA 12.9 — O CATÁLOGO DO ESTÚDIO CRESCE. Desenhos novos, cada um com arte própria (`ui/avatar/tatuagens129`):
 *
 * - CULTURA POP: desenhos ORIGINAIS que lembram uma obra de ficção sem copiar a arte oficial nem o logotipo — o objeto,
 *   o bicho, o emblema reinterpretado, a frase curta. O campo `referencia` diz a obra (o estúdio mostra e filtra por ela).
 * - Os estilos novos de estúdio: neotradicional, surrealista, conceitual, pontilhismo, sketch e aquarela.
 * - Os BICHOS e a NATUREZA com variedade de verdade (domésticos e selvagens, aves, répteis, mar, insetos, paisagens),
 *   marcados pelo `tema` (os desenhos antigos ganham o tema por `TEMA_DOS_ANTIGOS`, sem mexer no catálogo de sempre).
 *
 * Puro (só tipos): fica no pacote `motor-casa`, embaixo do catálogo de sempre, que o espalha em `DESENHOS`.
 * O save guarda só o id: nada muda para quem já tem tatuagem.
 */
import type { DesenhoDeTatuagem, TamanhoDeTatuagem } from './tatuagens';

export type EstiloDeTatuagem129 = 'cultura_pop' | 'neotradicional' | 'surrealista' | 'conceitual' | 'pontilhismo' | 'sketch' | 'aquarela';
export const NOME_ESTILO_129: Record<EstiloDeTatuagem129, string> = {
  cultura_pop: 'Cultura pop', neotradicional: 'Neotradicional', surrealista: 'Surrealista', conceitual: 'Conceitual',
  pontilhismo: 'Pontilhismo', sketch: 'Sketch', aquarela: 'Aquarela'
};

/** VIDA 13: criaturas e mitos, céu e espaço. */
export type TemaDeTatuagem = 'animais' | 'natureza' | 'criaturas' | 'cosmos';
export const NOME_TEMA: Record<TemaDeTatuagem, string> = { animais: 'Bichos', natureza: 'Natureza e paisagens', criaturas: 'Criaturas e mitos', cosmos: 'Céu e espaço' };

/** Os desenhos de antes que são bichos ou natureza (o filtro de tema os encontra também). */
export const TEMA_DOS_ANTIGOS: Record<string, TemaDeTatuagem> = {
  leao_realista: 'animais', lobo_realista: 'animais', andorinha: 'animais', pantera: 'animais', cobra_tradicional: 'animais', aguia_tradicional: 'animais',
  serpente_negra: 'animais', corvo: 'animais', lobo_geometrico: 'animais', carpa: 'animais', tigre: 'animais', gato_linha: 'animais', borboleta: 'animais',
  beija_flor: 'animais', aguia_peito: 'animais', floresta: 'natureza', montanha: 'natureza', onda: 'natureza', cerejeira: 'natureza', nuvens: 'natureza',
  onda_mini: 'natureza', montanha_mini: 'natureza', ramo_fino: 'natureza', lua_estrelas: 'natureza', ramos: 'natureza', arvore_da_vida: 'natureza',
  // VIDA 13: os temas novos
  dragao_oriental: 'criaturas', dragao_tres_cabecas: 'criaturas', espirito_da_floresta: 'criaturas', saturno: 'cosmos', cometa: 'cosmos', constelacao: 'cosmos'
};
export const temaDoDesenho = (d: Pick<DesenhoDeTatuagem, 'id' | 'tema'>): TemaDeTatuagem | undefined => d.tema ?? TEMA_DOS_ANTIGOS[d.id];

const T = (...xs: TamanhoDeTatuagem[]) => xs;
type D = Omit<DesenhoDeTatuagem, 'tamanho' | 'tamanhos'> & { tamanhos: TamanhoDeTatuagem[] };
/** Cultura pop: o estilo e a obra. */
const pop = (referencia: string, xs: Omit<D, 'estilo' | 'referencia'>[]): D[] => xs.map(x => ({ ...x, estilo: 'cultura_pop', referencia }));
const bicho = (xs: D[]): D[] => xs.map(x => ({ ...x, tema: 'animais' }));
const natureza = (xs: D[]): D[] => xs.map(x => ({ ...x, tema: 'natureza' }));

const LISTA: D[] = [
  /* ------------------------------------------------------------ cultura pop */
  ...pop('Pokémon', [
    { id: 'esfera_de_captura', nome: 'Esfera de captura', tamanhos: T(1, 2), colorida: true, descricao: 'Metade vermelha, metade branca, o botão no meio e um risco de quem já jogou muito.' },
    { id: 'tres_parceiros', nome: 'Os três parceiros', tamanhos: T(1, 2), colorida: true, proporcao: 2.6, descricao: 'Folha, chama e gota em três círculos: a primeira escolha da jornada.' }
  ]),
  ...pop('Naruto', [
    { id: 'kunai', nome: 'Kunai com fita', tamanhos: T(1, 2), proporcao: 0.45, descricao: 'A faca de arremesso de argola no cabo, a fita solta.' },
    { id: 'olho_tres_virgulas', nome: 'Olho de três vírgulas', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'A íris vermelha com três vírgulas pretas girando em volta da pupila.' },
    { id: 'folha_espiral', nome: 'Folha em espiral', tamanhos: T(1, 2), descricao: 'Uma folha com a espiral no meio, a aldeia lembrada em traço.' }
  ]),
  ...pop('Dragon Ball', [
    { id: 'esfera_quatro_estrelas', nome: 'Esfera de quatro estrelas', tamanhos: T(1, 2), colorida: true, descricao: 'A esfera laranja com quatro estrelas vermelhas e o brilho de vidro.' },
    { id: 'nuvem_voadora', nome: 'Nuvem voadora', tamanhos: T(1, 2), colorida: true, proporcao: 1.8, descricao: 'A nuvem amarela que só carrega quem tem o coração puro.' }
  ]),
  ...pop('One Piece', [
    { id: 'chapeu_de_palha', nome: 'Chapéu de palha', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.5, descricao: 'A palha trançada e a fita vermelha: a promessa de voltar para buscar.' },
    { id: 'fruta_espiral', nome: 'Fruta de espirais', tamanhos: T(1, 2), colorida: true, proporcao: 0.85, descricao: 'A fruta roxa coberta de espirais, o cabinho enrolado. Quem come não nada mais.' },
    { id: 'cartaz_procurado', nome: 'Cartaz de procurado', tamanhos: T(2, 3), colorida: true, proporcao: 0.75, descricao: 'O papel velho, a palavra PROCURADO e um chapéu de palha no lugar do rosto.' }
  ]),
  ...pop('Studio Ghibli', [
    { id: 'espirito_da_floresta', nome: 'Espírito da floresta', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'O bicho cinzento e redondo, uma folha na cabeça, parado na chuva.' },
    { id: 'espirito_sem_rosto', nome: 'Espírito mascarado', tamanhos: T(1, 2), proporcao: 0.6, descricao: 'O vulto preto de máscara branca oferecendo uma pepita de ouro.' },
    { id: 'fuligens', nome: 'Fuligens com estrelinhas', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'Três bolinhas de fuligem de olho arregalado carregando confeitos coloridos.' },
    { id: 'vassoura_gato', nome: 'Vassoura e gato preto', tamanhos: T(1, 2), colorida: true, proporcao: 1.8, descricao: 'A vassoura de entrega com um laço vermelho e o gato preto na garupa.' }
  ]),
  ...pop('Breaking Bad', [
    { id: 'chapeu_e_oculos', nome: 'Chapéu e óculos', tamanhos: T(1, 2), proporcao: 1.3, descricao: 'O chapéu de aba curta e os óculos retangulares, sem rosto embaixo.' },
    { id: 'cristais_azuis', nome: 'Cristais azuis', tamanhos: T(1, 2), colorida: true, descricao: 'Um punhado de cristais azul-celeste, facetados.' },
    { id: 'trailer_deserto', nome: 'Trailer no deserto', tamanhos: T(2, 3), colorida: true, proporcao: 1.6, descricao: 'O trailer velho, dois cactos e o sol do deserto.' }
  ]),
  ...pop('Game of Thrones', [
    { id: 'brasao_lobo', nome: 'Brasão do lobo gigante', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A cabeça do lobo uivando dentro de um escudo: o inverno está chegando.' },
    { id: 'dragao_tres_cabecas', nome: 'Dragão de três cabeças', tamanhos: T(2, 3), colorida: true, descricao: 'Um corpo, três pescoços, as asas vermelhas sobre o preto.' },
    { id: 'trono_de_espadas', nome: 'Trono de espadas', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'A cadeira de lâminas fundidas, desconfortável de propósito.' }
  ]),
  ...pop('Stranger Things', [
    { id: 'luzes_do_alfabeto', nome: 'Luzes do alfabeto', tamanhos: T(1, 2), colorida: true, proporcao: 2.6, descricao: 'O fio de lampadinhas coloridas sobre letras pintadas na parede.' },
    { id: 'criatura_de_petalas', nome: 'Criatura de pétalas', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'A cabeça que se abre como uma flor de dentes.' },
    { id: 'casa_invertida', nome: 'Mundo invertido', tamanhos: T(1, 2, 3), proporcao: 0.75, descricao: 'A casa e o seu reflexo de cabeça para baixo, os esporos subindo.' }
  ]),
  ...pop('The Walking Dead', [
    { id: 'taco_com_arame', nome: 'Taco com arame', tamanhos: T(1, 2), proporcao: 0.35, descricao: 'O taco de beisebol enrolado em arame farpado.' },
    { id: 'chapeu_de_xerife', nome: 'Chapéu de xerife', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'O chapéu de abas largas com a estrela de xerife na frente.' },
    { id: 'mao_da_terra', nome: 'Mão saindo da terra', tamanhos: T(1, 2, 3), proporcao: 0.8, descricao: 'Uma mão magra rompendo o chão do cemitério.' }
  ]),
  ...pop('Peaky Blinders', [
    { id: 'boina_navalhas', nome: 'Boina com navalhas', tamanhos: T(1, 2), proporcao: 1.6, descricao: 'A boina de aba curta com as lâminas costuradas na borda.' },
    { id: 'navalha_aberta', nome: 'Navalha aberta', tamanhos: T(1, 2), proporcao: 2.2, descricao: 'A navalha de barbeiro aberta, o cabo de osso e um fio de fumaça.' }
  ]),
  ...pop('Star Wars', [
    { id: 'espada_de_luz', nome: 'Espada de luz', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.25, descricao: 'O cabo de metal e a lâmina de luz azul.' },
    { id: 'capacete_sombrio', nome: 'Capacete sombrio', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'O elmo preto da respiração pesada, brilho na testa.' },
    { id: 'caca_em_x', nome: 'Caça de asas em X', tamanhos: T(2, 3), colorida: true, proporcao: 1.2, descricao: 'A nave de frente, as quatro asas abertas e os motores acesos.' },
    { id: 'droide_cupula', nome: 'Droide de cúpula', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'O pequeno droide azul e branco de cabeça redonda.' }
  ]),
  ...pop('Harry Potter', [
    { id: 'raio_e_oculos', nome: 'Raio e óculos redondos', tamanhos: T(1, 2), proporcao: 1.6, descricao: 'A cicatriz em raio sobre os óculos redondos, a armação remendada.' },
    { id: 'tres_reliquias', nome: 'As três relíquias', tamanhos: T(1, 2), descricao: 'Triângulo, círculo e traço: a capa, a pedra e a varinha.' },
    { id: 'pomo_alado', nome: 'Pomo alado', tamanhos: T(1, 2), colorida: true, proporcao: 1.8, descricao: 'A bolinha dourada com as asas finas abertas.' },
    { id: 'coruja_com_carta', nome: 'Coruja com carta', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A coruja branca em voo trazendo a carta lacrada.' },
    { id: 'malfeito_feito', nome: 'Malfeito feito', tamanhos: T(1, 2), proporcao: 2.8, descricao: 'A frase do mapa, numa faixa de pergaminho, com duas pegadas.' }
  ]),
  ...pop('O Senhor dos Anéis', [
    { id: 'anel_com_inscricao', nome: 'Anel com inscrição', tamanhos: T(1, 2), colorida: true, proporcao: 1.2, descricao: 'O anel de ouro, a escrita em fogo correndo pela volta.' },
    { id: 'olho_em_chamas', nome: 'Olho em chamas', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'O olho sem pálpebra no alto da torre, cercado de fogo.' },
    { id: 'arvore_branca', nome: 'Árvore branca', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A árvore branca e seca sob sete estrelas.' },
    { id: 'broche_folha', nome: 'Broche de folha', tamanhos: T(1, 2), colorida: true, proporcao: 0.6, descricao: 'A folha verde com a haste de prata, o presente da floresta.' }
  ]),
  ...pop('Matrix', [
    { id: 'chuva_de_codigo', nome: 'Chuva de código', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.6, descricao: 'Colunas de símbolos verdes caindo, a primeira letra mais clara.' },
    { id: 'duas_pilulas', nome: 'As duas pílulas', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'A vermelha e a azul, uma de cada lado: escolha.' },
    { id: 'coelho_branco', nome: 'Siga o coelho branco', tamanhos: T(1, 2), proporcao: 1.2, descricao: 'O coelho correndo, o relógio de bolso pendurado.' }
  ]),
  ...pop('Jurassic Park', [
    { id: 'cranio_de_rex', nome: 'Crânio de tiranossauro', tamanhos: T(2, 3), proporcao: 1.4, descricao: 'O crânio do rex de perfil, os dentes à mostra.' },
    { id: 'mosquito_no_ambar', nome: 'Mosquito no âmbar', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'A gota de resina dourada com o mosquito preso dentro.' }
  ]),
  ...pop('Marvel', [
    { id: 'escudo_de_estrela', nome: 'Escudo com estrela', tamanhos: T(1, 2), colorida: true, descricao: 'O escudo redondo em anéis, a estrela no centro, um risco de batalha.' },
    { id: 'martelo_do_trovao', nome: 'Martelo do trovão', tamanhos: T(1, 2, 3), proporcao: 0.7, descricao: 'O martelo de cabo curto, raios saindo da cabeça.' },
    { id: 'manopla_de_joias', nome: 'Manopla das joias', tamanhos: T(2, 3), colorida: true, proporcao: 0.75, descricao: 'A luva dourada com as seis pedras, o punho fechado.' },
    { id: 'aranha_no_fio', nome: 'Aranha no fio', tamanhos: T(1, 2), proporcao: 0.7, descricao: 'A aranha descendo pelo fio, a teia de canto atrás.' }
  ]),
  ...pop('DC', [
    { id: 'morcego_na_lua', nome: 'Morcego diante da lua', tamanhos: T(1, 2, 3), colorida: true, proporcao: 1.2, descricao: 'A silhueta de asas abertas recortada na lua cheia, os prédios embaixo.' },
    { id: 'laco_dourado', nome: 'Laço dourado', tamanhos: T(1, 2), colorida: true, descricao: 'A corda dourada enrolada, brilhando: quem é laçado diz a verdade.' },
    { id: 'carta_do_coringa', nome: 'Carta do coringa', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'A carta com o sorriso torto e o HA HA escrito de lado.' }
  ]),
  ...pop('Jogos Vorazes', [
    { id: 'tordo_e_flecha', nome: 'Tordo e flecha', tamanhos: T(1, 2), descricao: 'O pássaro em voo segurando a flecha, dentro de um anel.' },
    { id: 'arco_e_aljava', nome: 'Arco e aljava', tamanhos: T(1, 2), proporcao: 0.7, descricao: 'O arco de caça e a aljava com três flechas.' }
  ]),
  ...pop('Piratas do Caribe', [
    { id: 'pardal_no_sol', nome: 'Pardal sobre o mar', tamanhos: T(1, 2), colorida: true, proporcao: 1.4, descricao: 'O pássaro voando contra o sol que se põe no mar.' },
    { id: 'moeda_asteca', nome: 'Moeda amaldiçoada', tamanhos: T(1, 2), colorida: true, descricao: 'A moeda de ouro com a caveira gravada e a borda gasta.' },
    { id: 'bau_do_coracao', nome: 'Baú do coração', tamanhos: T(1, 2), colorida: true, proporcao: 1.2, descricao: 'O baú de ferro com um coração batendo dentro.' }
  ]),
  ...pop('The Office', [
    { id: 'caneca_de_chefe', nome: 'Caneca de melhor chefe', tamanhos: T(1, 2), colorida: true, descricao: 'A caneca branca com a frase que ele comprou para si mesmo.' },
    { id: 'grampeador_gelatina', nome: 'Grampeador na gelatina', tamanhos: T(1, 2), colorida: true, descricao: 'O grampeador preso num bloco de gelatina amarela.' },
    { id: 'beterrabas', nome: 'Beterrabas da fazenda', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'Duas beterrabas amarradas pelas folhas.' }
  ]),
  ...pop('The Legend of Zelda', [
    { id: 'escudo_do_heroi', nome: 'Espada e escudo do herói', tamanhos: T(2, 3), colorida: true, proporcao: 0.75, descricao: 'O escudo azul com a ave vermelha e a espada atrás.' },
    { id: 'triangulos_dourados', nome: 'Três triângulos e asas', tamanhos: T(1, 2), colorida: true, proporcao: 1.6, descricao: 'Os triângulos de ouro empilhados entre duas asas.' }
  ]),
  ...pop('Super Mario', [
    { id: 'cogumelo_de_pintas', nome: 'Cogumelo de pintas', tamanhos: T(1, 2), colorida: true, descricao: 'O cogumelo vermelho de bolinhas brancas e olhinhos.' },
    { id: 'estrela_de_olhos', nome: 'Estrela de olhinhos', tamanhos: T(1), colorida: true, descricao: 'A estrela amarela que pisca, com dois olhos.' },
    { id: 'cano_verde', nome: 'Cano verde', tamanhos: T(1, 2), colorida: true, proporcao: 0.75, descricao: 'O cano saindo do chão e a planta carnívora espiando.' }
  ]),
  ...pop('Sailor Moon', [
    { id: 'broche_da_lua', nome: 'Broche da lua', tamanhos: T(1, 2), colorida: true, descricao: 'O broche dourado com a lua crescente e quatro pedrinhas.' },
    { id: 'gata_da_lua', nome: 'Gata da lua crescente', tamanhos: T(1, 2), proporcao: 0.75, descricao: 'A gata preta sentada com a lua na testa.' }
  ]),
  ...pop('Attack on Titan', [
    { id: 'asas_cruzadas', nome: 'Asas cruzadas', tamanhos: T(1, 2), colorida: true, proporcao: 0.85, descricao: 'Uma asa branca e uma azul, sobrepostas num escudo.' },
    { id: 'gigante_no_muro', nome: 'Gigante no muro', tamanhos: T(2, 3), proporcao: 1.3, descricao: 'O rosto sem pele espiando por cima da muralha.' }
  ]),
  ...pop('Os Simpsons', [{ id: 'rosquinha_rosa', nome: 'Rosquinha rosa', tamanhos: T(1, 2), colorida: true, descricao: 'Cobertura rosa e confeitos de todas as cores.' }]),
  ...pop('Doctor Who', [{ id: 'cabine_azul', nome: 'Cabine azul', tamanhos: T(1, 2), colorida: true, proporcao: 0.55, descricao: 'A cabine de polícia azul, maior por dentro.' }]),
  ...pop('De Volta para o Futuro', [{ id: 'rastro_de_fogo', nome: 'Rastro de fogo', tamanhos: T(1, 2), colorida: true, proporcao: 2, descricao: 'Duas trilhas de fogo no asfalto e o número 88.' }]),
  ...pop('Avatar: A Lenda de Aang', [{ id: 'quatro_elementos', nome: 'Os quatro elementos', tamanhos: T(1, 2), descricao: 'Água, terra, fogo e ar em quatro sinais num círculo.' }]),
  ...pop('A Bela e a Fera', [{ id: 'rosa_na_redoma', nome: 'Rosa na redoma', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.7, descricao: 'A rosa sob o vidro, uma pétala já caída.' }]),
  ...pop('O Mágico de Oz', [{ id: 'sapatinhos_vermelhos', nome: 'Sapatinhos vermelhos', tamanhos: T(1, 2), colorida: true, proporcao: 1.4, descricao: 'O par de sapatos brilhando: não há lugar como o nosso lar.' }]),
  ...pop('O Rei Leão', [{ id: 'leao_na_pedra', nome: 'Leão na pedra', tamanhos: T(2, 3), colorida: true, descricao: 'A pedra em ponta contra o sol enorme, um leão pequeno no alto.' }]),
  ...pop('Tubarão', [{ id: 'barbatana', nome: 'Barbatana', tamanhos: T(1, 2), proporcao: 1.6, descricao: 'A barbatana cortando a água, duas notas no ar.' }]),
  ...pop('O Guia do Mochileiro das Galáxias', [{ id: 'toalha_42', nome: 'Toalha e 42', tamanhos: T(1, 2), colorida: true, proporcao: 1.2, descricao: 'A toalha dobrada e o número da resposta. Não entre em pânico.' }]),

  /* ------------------------------------------------------------ bichos */
  ...bicho([
    { id: 'cachorro_fine', nome: 'Cachorro de orelha caída', estilo: 'fine_line', tamanhos: T(1, 2), descricao: 'O focinho do cão em traço único, a orelha caindo.' },
    { id: 'gato_dormindo', nome: 'Gato dormindo', estilo: 'minimalista', tamanhos: T(1), proporcao: 1.4, descricao: 'Enrolado, o rabo cobrindo o focinho.' },
    { id: 'cavalo_galope', nome: 'Cavalo a galope', estilo: 'blackwork', tamanhos: T(2, 3), proporcao: 1.3, descricao: 'A silhueta preta do cavalo no ar, a crina solta.' },
    { id: 'coelho_sketch', nome: 'Coelho', estilo: 'sketch', tamanhos: T(1, 2), proporcao: 0.8, descricao: 'Sentado, as orelhas em pé, traço de rascunho por cima.' },
    { id: 'urso_geometrico', nome: 'Urso geométrico', estilo: 'geometrica', tamanhos: T(2, 3), descricao: 'A cabeça do urso em facetas, uma metade cheia.' },
    { id: 'elefante_ornamental', nome: 'Elefante ornamental', estilo: 'ornamental', tamanhos: T(2, 3), proporcao: 1.1, descricao: 'O elefante de perfil com a manta de renda e as contas.' },
    { id: 'cervo_galhada', nome: 'Cervo', estilo: 'sketch', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'A cabeça do cervo de frente, a galhada aberta em rascunho.' },
    { id: 'onca_pintada', nome: 'Onça-pintada', estilo: 'tradicional', tamanhos: T(2, 3), colorida: true, descricao: 'A cabeça da onça rugindo, as rosetas no amarelo.' },
    { id: 'bicho_preguica', nome: 'Bicho-preguiça', estilo: 'neotradicional', tamanhos: T(1, 2), colorida: true, proporcao: 0.85, descricao: 'Pendurado no galho, sem pressa nenhuma.' },
    { id: 'girafa', nome: 'Girafa', estilo: 'minimalista', tamanhos: T(1, 2), proporcao: 0.55, descricao: 'O pescoção e as manchas, em poucas linhas.' },
    { id: 'raposa_geometrica', nome: 'Raposa geométrica', estilo: 'geometrica', tamanhos: T(2, 3), colorida: true, proporcao: 0.9, descricao: 'A cara da raposa em triângulos laranja e brancos.' },
    { id: 'raposa_enrolada', nome: 'Raposa enrolada', estilo: 'aquarela', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'Dormindo dentro do próprio rabo, a tinta escorrendo.' },
    { id: 'lobo_uivando', nome: 'Lobo uivando para a lua', estilo: 'blackwork', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'O lobo na pedra, recortado contra a lua cheia.' },
    { id: 'coruja_neo', nome: 'Coruja', estilo: 'neotradicional', tamanhos: T(2, 3), colorida: true, proporcao: 0.8, descricao: 'Os olhos enormes, as penas em camadas, uma lua atrás.' },
    { id: 'tucano', nome: 'Tucano', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, descricao: 'O bico laranja enorme no galho.' },
    { id: 'arara', nome: 'Arara', estilo: 'aquarela', tamanhos: T(2, 3), colorida: true, proporcao: 0.6, descricao: 'Vermelha, azul e amarela, a cauda comprida escorrendo.' },
    { id: 'flamingo', nome: 'Flamingo', estilo: 'fine_line', tamanhos: T(1, 2), colorida: true, proporcao: 0.6, descricao: 'Numa perna só, o pescoço em S.' },
    { id: 'garca_em_voo', nome: 'Garça em voo', estilo: 'oriental', tamanhos: T(2, 3), colorida: true, proporcao: 1.3, descricao: 'A garça japonesa de coroa vermelha, as asas abertas sobre o sol.' },
    { id: 'pena_de_pavao', nome: 'Pena de pavão', estilo: 'realista', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.4, descricao: 'A pena longa com o olho azul e verde na ponta.' },
    { id: 'camaleao', nome: 'Camaleão no galho', estilo: 'neotradicional', tamanhos: T(2, 3), colorida: true, proporcao: 1.4, descricao: 'O rabo enrolado, o olho girando, as cores mudando.' },
    { id: 'tartaruga_tribal', nome: 'Tartaruga marinha', estilo: 'tribal', tamanhos: T(1, 2, 3), descricao: 'A tartaruga de cima, o casco em blocos polinésios.' },
    { id: 'lagartixa', nome: 'Lagartixa', estilo: 'minimalista', tamanhos: T(1), proporcao: 0.7, descricao: 'Subindo a parede, quatro patinhas abertas.' },
    { id: 'polvo', nome: 'Polvo', estilo: 'neotradicional', tamanhos: T(2, 3), colorida: true, descricao: 'A cabeça redonda e os oito braços enrolando.' },
    { id: 'baleia_fine', nome: 'Baleia', estilo: 'fine_line', tamanhos: T(1, 2), proporcao: 2, descricao: 'A baleia nadando, um jato de água, a linha do mar.' },
    { id: 'tubarao', nome: 'Tubarão', estilo: 'tradicional', tamanhos: T(2, 3), colorida: true, proporcao: 1.6, descricao: 'De boca aberta, contorno grosso, a barriga clara.' },
    { id: 'agua_viva', nome: 'Água-viva', estilo: 'aquarela', tamanhos: T(1, 2), colorida: true, proporcao: 0.6, descricao: 'O chapéu transparente e os fios descendo.' },
    { id: 'cavalo_marinho', nome: 'Cavalo-marinho', estilo: 'pontilhismo', tamanhos: T(1, 2), proporcao: 0.55, descricao: 'Em pontos, o rabo enrolado.' },
    { id: 'arraia', nome: 'Arraia-jamanta', estilo: 'blackwork', tamanhos: T(2, 3), proporcao: 1.4, descricao: 'As asas largas, o rabo fino, a barriga em espaço negativo.' },
    { id: 'abelha', nome: 'Abelha', estilo: 'fine_line', tamanhos: T(1), colorida: true, descricao: 'Pequena, as asas em traço e as listras.' },
    { id: 'mariposa_caveira', nome: 'Mariposa da caveira', estilo: 'blackwork', tamanhos: T(1, 2, 3), proporcao: 1.4, descricao: 'A mariposa de asas abertas com uma caveira no dorso.' },
    { id: 'escorpiao', nome: 'Escorpião', estilo: 'tradicional', tamanhos: T(1, 2), proporcao: 0.8, descricao: 'O ferrão erguido, as pinças abertas.' },
    { id: 'escaravelho', nome: 'Escaravelho', estilo: 'ornamental', tamanhos: T(1, 2), colorida: true, proporcao: 1.2, descricao: 'O besouro sagrado empurrando o sol, as asas abertas.' },
    { id: 'libelula', nome: 'Libélula', estilo: 'fine_line', tamanhos: T(1, 2), descricao: 'Quatro asas finas e o corpo comprido.' },
    { id: 'joaninha', nome: 'Joaninha', estilo: 'minimalista', tamanhos: T(1), colorida: true, descricao: 'Vermelha de pintas pretas, numa folha.' },
    { id: 'louva_a_deus', nome: 'Louva-a-deus', estilo: 'sketch', tamanhos: T(1, 2), proporcao: 0.7, descricao: 'As patas da frente dobradas como em reza.' },
    { id: 'baleia_nas_nuvens', nome: 'Baleia nas nuvens', estilo: 'surrealista', tamanhos: T(2, 3), colorida: true, proporcao: 1.4, descricao: 'A baleia nadando no céu entre as nuvens, um barquinho de papel embaixo.' }
  ]),
  /* ------------------------------------------------------------ natureza */
  ...natureza([
    { id: 'cogumelos', nome: 'Cogumelos do bosque', estilo: 'aquarela', tamanhos: T(1, 2), colorida: true, descricao: 'Três cogumelos de tamanhos diferentes e o musgo.' },
    { id: 'paisagem_no_circulo', nome: 'Paisagem num círculo', estilo: 'fine_line', tamanhos: T(1, 2), descricao: 'O lago, os pinheiros e a montanha dentro de um anel.' },
    { id: 'cacto', nome: 'Cacto no deserto', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'O cacto de braços, uma flor rosa e o sol.' },
    { id: 'ilha', nome: 'Ilha', estilo: 'minimalista', tamanhos: T(1, 2), colorida: true, proporcao: 1.4, descricao: 'Um coqueiro, um monte de areia e o mar.' },
    { id: 'costela_de_adao', nome: 'Costela-de-adão', estilo: 'floral', tamanhos: T(1, 2, 3), colorida: true, descricao: 'A folha grande recortada, as nervuras.' },
    { id: 'samambaia', nome: 'Samambaia', estilo: 'fine_line', tamanhos: T(1, 2), proporcao: 0.5, descricao: 'A folha que se desenrola na ponta.' },
    { id: 'terrario', nome: 'Terrário', estilo: 'geometrica', tamanhos: T(1, 2), colorida: true, proporcao: 0.85, descricao: 'O vidro facetado com uma suculenta e pedrinhas.' },
    { id: 'lua_sobre_o_mar', nome: 'Lua sobre o mar', estilo: 'pontilhismo', tamanhos: T(1, 2), descricao: 'A lua cheia em pontos e o reflexo nas ondas.' },
    { id: 'cachoeira', nome: 'Cachoeira', estilo: 'sketch', tamanhos: T(2, 3), proporcao: 0.75, descricao: 'A queda entre as pedras, a névoa embaixo.' },
    { id: 'ginkgo', nome: 'Folhas de ginkgo', estilo: 'fine_line', tamanhos: T(1), descricao: 'Duas folhas em leque.' },
    { id: 'pinheiros_aquarela', nome: 'Pinheiros na névoa', estilo: 'aquarela', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'Três pinheiros e a mancha azul do céu atrás.' },
    { id: 'vulcao', nome: 'Vulcão', estilo: 'neotradicional', tamanhos: T(1, 2), colorida: true, descricao: 'O cone escuro, a lava escorrendo, a fumaça subindo.' }
  ]),

  /* ------------------------------------------------------------ autorais */
  // Geométrica
  { id: 'cubos_isometricos', nome: 'Cubos em perspectiva', estilo: 'geometrica', tamanhos: T(1, 2), descricao: 'Três cubos empilhados em isometria: uma face cheia, uma em linhas, uma vazia.' },
  { id: 'esfera_aramada', nome: 'Esfera de arame', estilo: 'geometrica', tamanhos: T(1, 2), descricao: 'Meridianos e paralelos: o globo só em linhas.' },
  { id: 'sol_e_lua', nome: 'Sol e lua', estilo: 'geometrica', tamanhos: T(1, 2, 3), descricao: 'Metade sol de raios retos, metade lua cheia de pontos.' },
  { id: 'cubo_de_metatron', nome: 'Cubo de Metatron', estilo: 'geometrica', tamanhos: T(1, 2, 3), descricao: 'Treze círculos ligados por todas as linhas possíveis.' },
  // Abstrata
  { id: 'respingos', nome: 'Respingos de tinta', estilo: 'abstrata', tamanhos: T(1, 2), colorida: true, proporcao: 1.4, descricao: 'Gotas e respingos de três cores, como se a tinta caísse.' },
  { id: 'enso', nome: 'Círculo de pincel', estilo: 'abstrata', tamanhos: T(1, 2, 3), descricao: 'O círculo de uma pincelada só, aberto no fim.' },
  // Minimalista
  { id: 'xicara_de_cafe', nome: 'Xícara de café', estilo: 'minimalista', tamanhos: T(1), descricao: 'A xícara e três fios de vapor.' },
  { id: 'clave_de_sol', nome: 'Clave de sol', estilo: 'minimalista', tamanhos: T(1, 2), proporcao: 0.5, descricao: 'A clave num traço só.' },
  { id: 'bicicleta', nome: 'Bicicleta', estilo: 'minimalista', tamanhos: T(1), proporcao: 1.6, descricao: 'Duas rodas e o quadro, nada mais.' },
  { id: 'saturno', nome: 'Saturno', estilo: 'minimalista', tamanhos: T(1), proporcao: 1.5, descricao: 'O planeta e o anel inclinado.' },
  // Ornamental
  { id: 'chave_antiga', nome: 'Chave antiga', estilo: 'ornamental', tamanhos: T(1, 2), proporcao: 0.4, descricao: 'A chave de cabo trabalhado em volutas.' },
  { id: 'moldura_barroca', nome: 'Moldura barroca', estilo: 'ornamental', tamanhos: T(2, 3), proporcao: 0.8, descricao: 'O espelho oval de volutas, vazio no meio.' },
  // Surrealista
  { id: 'relogio_derretendo', nome: 'Relógio derretendo', estilo: 'surrealista', tamanhos: T(1, 2), proporcao: 1.2, descricao: 'O relógio escorrendo por cima de um galho.' },
  { id: 'mao_com_olho', nome: 'Mão com olho', estilo: 'surrealista', tamanhos: T(1, 2), proporcao: 0.8, descricao: 'A palma aberta com um olho no meio.' },
  { id: 'cabeca_de_passaros', nome: 'Cabeça de pássaros', estilo: 'surrealista', tamanhos: T(2, 3), proporcao: 0.85, descricao: 'O perfil se abre no alto e os pássaros saem voando.' },
  { id: 'ampulheta_do_mar', nome: 'Ampulheta com mar', estilo: 'surrealista', tamanhos: T(1, 2), colorida: true, proporcao: 0.6, descricao: 'Em cima, o céu; embaixo, o mar com um barco.' },
  // Conceitual
  { id: 'lampada_planta', nome: 'Ideia que brota', estilo: 'conceitual', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'A lâmpada com uma muda crescendo dentro.' },
  { id: 'quebra_cabeca', nome: 'A peça que falta', estilo: 'conceitual', tamanhos: T(1, 2), descricao: 'Um quebra-cabeça com o buraco e a peça solta ao lado.' },
  { id: 'gaiola_aberta', nome: 'Gaiola aberta', estilo: 'conceitual', tamanhos: T(1, 2), proporcao: 0.8, descricao: 'A portinha aberta e o pássaro já do lado de fora.' },
  { id: 'codigo_passaros', nome: 'Código que vira pássaro', estilo: 'conceitual', tamanhos: T(1, 2), proporcao: 1.8, descricao: 'As barras de um código que se soltam e saem voando.' },
  // Blackwork
  { id: 'mao_de_esqueleto', nome: 'Mão de esqueleto', estilo: 'blackwork', tamanhos: T(1, 2, 3), proporcao: 0.7, descricao: 'Os ossos da mão em branco sobre o preto.' },
  { id: 'olho_na_piramide', nome: 'Olho na pirâmide', estilo: 'blackwork', tamanhos: T(1, 2), descricao: 'O olho dentro do triângulo, raios em volta.' },
  // Old school
  { id: 'dados', nome: 'Dados', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, proporcao: 1.2, descricao: 'Dois dados rolando, o seis e o um.' },
  { id: 'ferradura', nome: 'Ferradura da sorte', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, descricao: 'A ferradura com um trevo de quatro folhas.' },
  { id: 'coracao_sagrado', nome: 'Coração em chamas', estilo: 'tradicional', tamanhos: T(1, 2, 3), colorida: true, proporcao: 0.8, descricao: 'O coração coroado de fogo, a cruz no alto.' },
  { id: 'as_de_espadas', nome: 'Ás de espadas', estilo: 'tradicional', tamanhos: T(1, 2), colorida: true, proporcao: 0.7, descricao: 'A carta da sorte e do azar.' },
  { id: 'farol', nome: 'Farol', estilo: 'tradicional', tamanhos: T(2, 3), colorida: true, proporcao: 0.7, descricao: 'Listrado de vermelho, a luz cortando a noite.' },
  // Oriental
  { id: 'daruma', nome: 'Daruma', estilo: 'oriental', tamanhos: T(1, 2), colorida: true, descricao: 'O boneco vermelho de um olho só pintado: a meta pela metade.' },
  { id: 'lanterna_japonesa', nome: 'Lanterna de papel', estilo: 'oriental', tamanhos: T(1, 2), colorida: true, proporcao: 0.6, descricao: 'A lanterna vermelha com as faixas pretas.' },
  { id: 'crisantemo', nome: 'Crisântemo', estilo: 'oriental', tamanhos: T(2, 3), colorida: true, descricao: 'A flor de mil pétalas finas em volta.' },
  { id: 'gato_da_sorte', nome: 'Gato da sorte', estilo: 'oriental', tamanhos: T(1, 2), colorida: true, proporcao: 0.8, descricao: 'O gatinho de pata levantada chamando a fortuna.' },
  // Fine line
  { id: 'pena_fina', nome: 'Pena', estilo: 'fine_line', tamanhos: T(1, 2), proporcao: 0.4, descricao: 'Uma pena só, a haste e os fios soltos.' },
  { id: 'cometa', nome: 'Cometa', estilo: 'fine_line', tamanhos: T(1, 2), proporcao: 1.8, descricao: 'A estrela riscando o céu, a cauda em linhas.' },
  // Tribal
  { id: 'mascara_tiki', nome: 'Máscara tiki', estilo: 'tribal', tamanhos: T(1, 2), proporcao: 0.75, descricao: 'O rosto entalhado de olhos grandes e boca aberta.' },
  { id: 'lua_tribal', nome: 'Lua tribal', estilo: 'tribal', tamanhos: T(1, 2), descricao: 'O crescente em pontas curvas.' },
  // Realista
  { id: 'vela_acesa', nome: 'Vela acesa', estilo: 'realista', tamanhos: T(1, 2), proporcao: 0.5, descricao: 'A chama, a cera escorrendo, a luz em volta.' },
  { id: 'ampulheta', nome: 'Ampulheta', estilo: 'realista', tamanhos: T(1, 2, 3), proporcao: 0.65, descricao: 'A areia caindo entre as colunas de madeira.' },
  // Neotradicional
  { id: 'lua_com_rosto', nome: 'Lua de rosto', estilo: 'neotradicional', tamanhos: T(1, 2), colorida: true, descricao: 'A lua crescente de olhos fechados, flores no queixo.' },
  // Pontilhismo
  { id: 'sol_pontilhado', nome: 'Sol pontilhado', estilo: 'pontilhismo', tamanhos: T(1, 2, 3), descricao: 'O sol em pontos que escurecem para o centro.' },
  // Sketch
  { id: 'lapis_desenhando', nome: 'Lápis que desenha', estilo: 'sketch', tamanhos: T(1, 2), colorida: true, proporcao: 1.3, descricao: 'O lápis riscando, e o risco virando um passarinho.' },
  // Aquarela
  { id: 'coracao_aquarela', nome: 'Coração de aquarela', estilo: 'aquarela', tamanhos: T(1, 2), colorida: true, descricao: 'O contorno fino do coração e a tinta escapando dele.' }
];

/** O estúdio desenha no meio dos tamanhos (o grande quando só há grande). */
export const DESENHOS_129: DesenhoDeTatuagem[] = LISTA.map(x => ({ ...x, tamanho: x.tamanhos.length === 3 ? x.tamanhos[1] : x.tamanhos[x.tamanhos.length - 1] }));
/** As obras de cultura pop, na ordem do catálogo (o filtro do estúdio). */
export const REFERENCIAS_129: string[] = [...new Set(DESENHOS_129.map(d => d.referencia).filter((r): r is string => !!r))];
