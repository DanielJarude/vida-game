/**
 * ERAS HISTÓRICAS · CULTURA, COSTUMES E AS DÉCADAS (dados puros).
 *
 * As lembranças culturais descrevem gêneros, formatos, objetos e modas — sem copiar obras, personagens ou marcas.
 * Os intervalos de anos são APROXIMAÇÕES de quando aquilo esteve no auge no Brasil (fontes gerais: hemeroteca da
 * Biblioteca Nacional; Museu da Imagem e do Som; Instituto Moreira Salles; IBGE para hábitos domiciliares). São
 * lembranças do dia a dia, não "fatos históricos" — por isso nunca entram como notícia nem têm efeito no motor.
 */

export type TipoCultural = 'musica' | 'tv' | 'brincadeira' | 'moda' | 'costume' | 'jogo' | 'cinema';

export interface LembrancaCultural {
  id: string;
  tipo: TipoCultural;
  de: number;
  ate: number;
  /** Faixa de idade de quem guarda essa lembrança. */
  idade: [number, number];
  texto: string;
  /** Tecnologia que precisa estar na vida da pessoa (ver `eras/base/tecnologias`). */
  exige?: string;
}

export const LEMBRANCAS_CULTURAIS: readonly LembrancaCultural[] = [
  // ------------------------------------------------------------------ anos 1980
  { id: 'rock_nacional', tipo: 'musica', de: 1982, ate: 1990, idade: [12, 35], texto: 'O rock nacional tomou as rádios FM: bandas de garagem de Brasília, do Rio e de São Paulo viraram trilha das festas.', exige: 'radio' },
  { id: 'programa_infantil', tipo: 'tv', de: 1983, ate: 1993, idade: [3, 11], texto: 'As manhãs eram dos programas infantis de auditório na TV, com desenho, música e a plateia de crianças gritando.' },
  { id: 'novela_das_oito', tipo: 'tv', de: 1980, ate: 2005, idade: [10, 90], texto: 'Às oito e pouco da noite, a casa parava para a novela — e o capítulo era assunto no dia seguinte.' },
  { id: 'fita_gravada', tipo: 'musica', de: 1980, ate: 1998, idade: [10, 30], texto: 'Gravar música do rádio na fita cassete, com o dedo pronto no botão, para não pegar a voz do locutor.', exige: 'toca_fitas' },
  { id: 'locadora', tipo: 'cinema', de: 1986, ate: 2008, idade: [8, 50], texto: 'Sexta-feira era dia de ir à locadora escolher a fita — e de rebobinar antes de devolver.', exige: 'videocassete' },
  { id: 'ombreiras', tipo: 'moda', de: 1983, ate: 1991, idade: [14, 50], texto: 'Ombreira em tudo, cores fortes, cabelo armado com laquê: a moda era volume.' },
  { id: 'bolinha_de_gude', tipo: 'brincadeira', de: 1980, ate: 1998, idade: [5, 12], texto: 'Bolinha de gude, pião, taco na rua: a brincadeira acontecia na calçada até a mãe chamar.' },
  { id: 'fliperama', tipo: 'jogo', de: 1983, ate: 1999, idade: [9, 20], texto: 'O fliperama da esquina: uma ficha, uma partida e uma roda de gente olhando por cima do ombro.' },
  { id: 'lambada', tipo: 'musica', de: 1988, ate: 1990, idade: [12, 40], texto: 'O verão foi da lambada: saia rodada, casal colado e a música tocando em todo lugar.', exige: 'radio' },
  { id: 'cartas', tipo: 'costume', de: 1980, ate: 2000, idade: [10, 90], texto: 'Uma carta de longe levava dias para chegar, e a resposta, outros tantos. Guardava-se tudo numa caixa de sapatos.' },
  { id: 'interurbano', tipo: 'costume', de: 1980, ate: 2000, idade: [10, 90], texto: 'Interurbano era coisa séria: se ligava depois da meia-noite ou no domingo, quando a tarifa caía, e falando rápido.', exige: 'telefone_fixo' },
  // ------------------------------------------------------------------ anos 1990
  { id: 'axe_pagode', tipo: 'musica', de: 1992, ate: 2000, idade: [10, 40], texto: 'Axé e pagode dominaram as rádios e os programas de domingo; as coreografias se aprendiam na frente da TV.' },
  { id: 'sertanejo_90', tipo: 'musica', de: 1990, ate: 1999, idade: [12, 70], texto: 'As duplas sertanejas tomaram as rádios e as festas do interior chegaram às capitais.' },
  { id: 'album_copa', tipo: 'brincadeira', de: 1982, ate: 2025, idade: [7, 16], texto: 'O álbum de figurinhas da Copa: troca no recreio, a figurinha repetida no bolso e aquela que nunca saía.' },
  { id: 'bichinho_virtual', tipo: 'brincadeira', de: 1997, ate: 1999, idade: [7, 14], texto: 'O bichinho virtual de chaveiro: alimentar, limpar, pôr para dormir — e a escola proibindo.' },
  { id: 'videogame_cartucho', tipo: 'jogo', de: 1989, ate: 1997, idade: [7, 18], texto: 'Assoprar o cartucho antes de encaixar e revezar o controle com quem estivesse na sala.', exige: 'videogame_cartucho' },
  { id: 'calca_baggy', tipo: 'moda', de: 1992, ate: 2000, idade: [12, 30], texto: 'Calça larga, camisa de flanela amarrada na cintura, tênis grande: o uniforme de quem tinha quinze anos.' },
  { id: 'cd_player', tipo: 'musica', de: 1994, ate: 2004, idade: [12, 45], texto: 'O primeiro CD comprado, ouvido inteiro, com o encarte aberto para acompanhar as letras.', exige: 'cd' },
  { id: 'internet_discada', tipo: 'costume', de: 1997, ate: 2005, idade: [11, 60], texto: 'A internet discada: o chiado da conexão, a página carregando aos pedaços e alguém gritando que precisava do telefone.', exige: 'internet' },
  { id: 'orelhao_ficha', tipo: 'costume', de: 1980, ate: 1997, idade: [10, 60], texto: 'Ligar do orelhão com ficha — depois com cartão — e a fila de gente esperando a vez.', exige: 'orelhao' },
  // ------------------------------------------------------------------ anos 2000
  { id: 'funk_2000', tipo: 'musica', de: 2000, ate: 2010, idade: [12, 30], texto: 'O funk carioca saiu dos bailes de comunidade e chegou às festas de todo o país.' },
  { id: 'mensageiro', tipo: 'costume', de: 2002, ate: 2011, idade: [11, 40], texto: 'Voltar da escola e entrar no mensageiro do computador: o status com uma frase de efeito, a conversa até tarde.', exige: 'mensageiro_pc' },
  { id: 'lan_house', tipo: 'jogo', de: 2003, ate: 2010, idade: [10, 22], texto: 'A lan house do bairro: uma hora de computador, o jogo em rede e o trabalho da escola impresso no fim.', exige: 'lan_house' },
  { id: 'comunidades', tipo: 'costume', de: 2005, ate: 2011, idade: [12, 45], texto: 'O perfil na rede de comunidades: os depoimentos dos amigos, as comunidades engraçadas, quem visitou a sua página.', exige: 'rede_comunidades' },
  { id: 'cintura_baixa', tipo: 'moda', de: 2001, ate: 2007, idade: [13, 30], texto: 'Calça de cintura baixa, franja de lado, munhequeira: a moda dos anos 2000 hoje rende foto constrangedora.' },
  { id: 'sms_torpedo', tipo: 'costume', de: 2002, ate: 2010, idade: [12, 50], texto: 'Torpedo pelo celular, contando os caracteres para caber numa mensagem só e não pagar duas.', exige: 'sms' },
  { id: 'dvd_pirata', tipo: 'cinema', de: 2002, ate: 2010, idade: [12, 60], texto: 'Sessão de DVD em casa no fim de semana, com pipoca de panela e a família no sofá.', exige: 'dvd' },
  { id: 'emo', tipo: 'moda', de: 2005, ate: 2009, idade: [13, 22], texto: 'Franja no olho, tênis xadrez e camisa de banda: a fase emo passou pela escola inteira.' },
  { id: 'sertanejo_universitario', tipo: 'musica', de: 2008, ate: 2016, idade: [15, 40], texto: 'O sertanejo universitário encheu os rodeios, as festas de faculdade e as caixas de som dos carros.' },
  // ------------------------------------------------------------------ anos 2010 e 2020
  { id: 'grupo_familia', tipo: 'costume', de: 2014, ate: 2025, idade: [12, 90], texto: 'O grupo da família no celular: bom-dia com flor, corrente, foto do almoço de domingo — e uma discussão por semana.', exige: 'mensageiro_app' },
  { id: 'selfie', tipo: 'costume', de: 2013, ate: 2025, idade: [12, 60], texto: 'A foto com o celular virado para si mesmo virou hábito em todo encontro.', exige: 'smartphone' },
  { id: 'serie_maratona', tipo: 'tv', de: 2015, ate: 2025, idade: [12, 70], texto: 'Maratonar uma série inteira no fim de semana, um episódio puxando o outro.', exige: 'streaming' },
  { id: 'video_curto', tipo: 'costume', de: 2019, ate: 2025, idade: [10, 50], texto: 'Os vídeos curtos de dança e humor tomaram o tempo livre — e as músicas de sucesso passaram a nascer ali.', exige: 'smartphone' },
  { id: 'live_pandemia', tipo: 'musica', de: 2020, ate: 2020, idade: [10, 80], texto: 'Na quarentena, os shows viraram transmissões ao vivo de casa, assistidas na sala com a família.', exige: 'internet' },
  { id: 'pagode_volta', tipo: 'musica', de: 2016, ate: 2025, idade: [16, 50], texto: 'O funk, o sertanejo e o piseiro dividiram as listas das músicas mais tocadas, cada um no seu canto do país.' }
];

/** O que a pessoa viveu ao ganhar uma tecnologia (uma vez por vida). Texto factual sobre o objeto, sem marca. */
export const CHEGADAS: readonly { tec: string; idade: number; texto: string; tema: 'casa' | 'lazer' | 'amizade' | 'dinheiro' }[] = [
  { tec: 'telefone_fixo', idade: 4, tema: 'casa', texto: 'Instalaram a linha de telefone em casa. O aparelho ficou num lugar de honra, e a conta passou a ser conferida no fim do mês.' },
  { tec: 'videocassete', idade: 4, tema: 'lazer', texto: 'Chegou o videocassete. Filme de locadora no fim de semana e programa gravado da TV, se ninguém esquecesse de programar.' },
  { tec: 'computador', idade: 6, tema: 'casa', texto: 'Chegou o primeiro computador em casa, com monitor de tubo e uma capa de plástico para o pó. Todo mundo queria a vez.' },
  { tec: 'internet', idade: 8, tema: 'casa', texto: 'A internet chegou em casa, discada: só depois da meia-noite saía mais barato, e enquanto alguém navegava, o telefone ficava ocupado.' },
  { tec: 'celular', idade: 12, tema: 'amizade', texto: 'O primeiro celular: tela pequena, antena, bateria que durava dias. Ligar era caro, então se mandava recado curto.' },
  { tec: 'banda_larga', idade: 10, tema: 'casa', texto: 'A internet passou a ficar ligada o tempo todo, sem ocupar o telefone. O computador da sala virou disputa.' },
  { tec: 'smartphone', idade: 11, tema: 'amizade', texto: 'O primeiro smartphone: a internet, a câmera e os amigos no mesmo aparelho, no bolso.' },
  { tec: 'mensageiro_app', idade: 11, tema: 'amizade', texto: 'As conversas foram para o aplicativo de mensagens: o recado virou áudio, e a família ganhou um grupo.' },
  { tec: 'streaming', idade: 8, tema: 'lazer', texto: 'Filmes e séries passaram a chegar pela internet, na hora que se quisesse. A locadora fechou as portas.' },
  { tec: 'pix', idade: 14, tema: 'dinheiro', texto: 'O Pix chegou: o dinheiro passou a ir de uma conta para outra na hora, até para pagar o pastel da feira.' }
];

/** A tela de escolha: o resumo de cada período (curto, para a decisão; os detalhes vêm durante a vida). */
export interface DecadaHistorica {
  decada: number;
  rotulo: string;
  anos: [number, number];
  /** Uma frase de contexto. */
  contexto: string;
  tecnologia: string;
  cultura: string;
  /** Acontecimentos (ids de `ACONTECIMENTOS_BR`) que a infância desta década atravessa. */
  marcos: string[];
  /** As moedas que a pessoa vai usar nos primeiros quinze anos. */
  moedas: string;
}

export const DECADAS: readonly DecadaHistorica[] = [
  { decada: 1980, rotulo: 'Anos 1980', anos: [1980, 1989], contexto: 'O fim do regime militar, a volta das eleições diretas e uma inflação que mudava os preços toda semana.', tecnologia: 'Telefone fixo para poucos, orelhão, rádio, TV, toca-fitas, videocassete chegando.', cultura: 'Rock nacional, programas infantis, novela das oito, bolinha de gude na rua.', marcos: ['diretas_ja', 'plano_cruzado', 'constituicao_1988', 'eleicao_1989'], moedas: 'Cruzeiro, cruzado, cruzado novo, cruzeiro, cruzeiro real e real.' },
  { decada: 1990, rotulo: 'Anos 1990', anos: [1990, 1999], contexto: 'Plano Collor, impeachment, a chegada do real e o fim da hiperinflação.', tecnologia: 'Bipe, primeiros celulares, CD, videogame de cartucho, internet discada no fim da década.', cultura: 'Axé, pagode, sertanejo, calça larga, o tetra.', marcos: ['plano_collor', 'impeachment_collor', 'tetra', 'telebras'], moedas: 'Cruzeiro, cruzeiro real e real.' },
  { decada: 2000, rotulo: 'Anos 2000', anos: [2000, 2009], contexto: 'Racionamento de energia, o penta, a moeda estável e o crédito chegando a mais gente.', tecnologia: 'Celular de teclas e torpedo, lan house, mensageiro no computador, rede de comunidades, DVD.', cultura: 'Funk, emo, sertanejo universitário, cintura baixa.', marcos: ['apagao', 'penta', 'bolsa_familia', 'tv_digital'], moedas: 'Real.' },
  { decada: 2010, rotulo: 'Anos 2010', anos: [2010, 2019], contexto: 'Copa e Olimpíada em casa, protestos de 2013, a recessão de 2015–2016 e um impeachment.', tecnologia: 'Smartphone, aplicativos de mensagem, redes sociais, streaming.', cultura: 'Grupo da família, selfies, séries, sertanejo e funk nas paradas.', marcos: ['junho_2013', 'copa_2014', 'impeachment_dilma', 'brumadinho'], moedas: 'Real.' },
  { decada: 2020, rotulo: 'Anos 2020', anos: [2020, 2025], contexto: 'A pandemia, o auxílio emergencial, a vacina e a volta à rua.', tecnologia: 'Pix, aulas e trabalho pela tela, vídeos curtos, assistentes de inteligência artificial.', cultura: 'Lives, vídeos curtos, piseiro e funk.', marcos: ['covid_br', 'auxilio_emergencial', 'vacina_br', 'enchentes_rs'], moedas: 'Real.' }
];
