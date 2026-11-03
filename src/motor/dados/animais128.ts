/**
 * VIDA 12.8 — MAIS EXÓTICOS: a cacatua, o tucano, a jiboia, a raposa-do-deserto e os primatas (o macaco-prego e o sagui).
 *
 * Cada espécie com o seu jeito, a sua comida, o seu tempo de vida e o que pede de casa e de cuidado — e a LEI de cada
 * lugar (`sistemas/exoticos.EXOTICOS`): o que não se pode ter ali não aparece como produto, aparece dito, com o porquê.
 *
 *   PRIMATAS   no Brasil, nenhum criadouro comercial vende primata (o catálogo legal do FIX #3 já os deixava de fora): o
 *              macaco-prego e o sagui só existem aqui como OFERTA ILEGAL (com a consequência) e onde a lei permite com
 *              licença (alguns estados americanos, o Reino Unido com a licença de primatas). Vivem em grupo: sozinhos,
 *              adoecem de tristeza — e mordem.
 *   AVES       a cacatua é exótica (de criadouro registrado, com documento de cada ave); o tucano-toco é silvestre
 *              nativo do Brasil (criadouro comercial autorizado, nota fiscal e anilha).
 *   RÉPTEIS    a jiboia é nativa do Brasil (criadouro autorizado); fora daqui, o padrão do comércio de répteis.
 *   MAMÍFEROS  a raposa-do-deserto (fenec) é exótica: proibida no Brasil (importação de mamífero exótico), permitida com
 *              licença em boa parte do mundo.
 *
 * Os números são faixas típicas de cativeiro (veterinária de exóticos e zoológicos), não promessa: um bicho não morre
 * "de velhice" antes do tempo da espécie — morte cedo tem causa. Catálogo puro (só tipos).
 */
import type { Animal } from './animais';

const J = (m: string, f: string = m): [string, string] => [m, f];

export const ANIMAIS_128: Animal[] = [
  {
    id: 'cacatua', exotico: true, nome: ['cacatua', 'cacatua'], generoFixo: 'f', grupo: 'ave', vida: [40, 70], custo: 280, semana: 0.35, vinculo: 3.5, espaco: 'espaco', origens: ['criadouro'], preco: [25000, 55000], barulho: true,
    descricao: 'Branca, de crista amarela, de criadouro registrado e com documento: a ave que mais pede gente. Sozinha, grita e arranca as próprias penas. Vive mais que o dono — pede testamento.',
    jeitos: [J('levanta a crista quando alguém chega'), J('dança quando a música começa'), J('grita até você voltar para a sala')],
    nomes: [['Branquinho', 'Floco', 'Algodão', 'Tufo'], ['Neve', 'Nuvem', 'Pérola', 'Brisa']],
    interacao: { rotulo: 'Dar atenção a', textos: ['{nome} subiu no seu ombro e não desceu mais a tarde inteira.', '{nome} levantou a crista e dançou a música inteira.', '{nome} encostou a cabeça no seu rosto pedindo cafuné.'] },
    cotidiano: ['{nome} aprendeu a dizer "oi, gente" para cada pessoa que entra.', '{nome} desmontou o puxador da gaveta com o bico em uma tarde.', 'Uma semana de viagem e {nome} arrancou penas do peito. O veterinário pediu mais companhia.', 'O vizinho do prédio veio perguntar quem estava gritando às sete da manhã.'],
    morteCedo: ['uma doença do bico e das penas', 'uma infecção respiratória', 'uma intoxicação por metal mordido']
  },
  {
    id: 'tucano', exotico: true, nome: ['tucano-toco', 'tucano-toco'], generoFixo: 'm', grupo: 'ave', vida: [15, 20], custo: 230, semana: 0.25, vinculo: 2, espaco: 'quintal', origens: ['criadouro'], preco: [8000, 15000], silvestre: true,
    descricao: 'Silvestre nativo, de criadouro autorizado, com nota fiscal e anilha. O bico laranja enorme é leve; a comida é fruta fresca todo dia. Pede viveiro grande para voar entre os poleiros.',
    jeitos: [J('joga a fruta para cima e pega no ar'), J('curioso, bica tudo o que brilha', 'curiosa, bica tudo o que brilha'), J('dorme com o bico escondido nas costas')],
    nomes: [['Bico', 'Toco', 'Laranja', 'Caju'], ['Manga', 'Papaia', 'Tuca', 'Iara']],
    interacao: { rotulo: 'Dar frutas a', textos: ['{nome} pegou o mamão da sua mão com uma delicadeza que o bico não promete.', '{nome} jogou a uva para cima e pegou no ar, três vezes seguidas.'] },
    cotidiano: ['{nome} descobriu o pé de amora do vizinho por cima do viveiro.', 'A conta da feira subiu: {nome} come o peso dele em fruta.', 'No frio, {nome} dormiu encolhido com o bico escondido nas penas.'],
    morteCedo: ['excesso de ferro na dieta (uma doença do fígado comum em tucanos)', 'uma infecção']
  },
  {
    id: 'jiboia', exotico: true, nome: ['jiboia', 'jiboia'], generoFixo: 'f', grupo: 'reptil', vida: [20, 30], custo: 120, semana: 0.05, vinculo: 0.6, espaco: 'espaco', origens: ['criadouro'], preco: [2500, 6000], silvestre: true,
    descricao: 'Serpente nativa, não venenosa, de criadouro autorizado com microchip. Chega a dois metros: terrário grande e trancado, calor, um roedor a cada semana ou duas. Calma — e forte.',
    jeitos: [J('passa o dia enrolada no galho'), J('chia quando acorda de mau humor'), J('desliza devagar pelo braço, curiosa')],
    nomes: [['Kaa', 'Tupã', 'Nó', 'Jiboião'], ['Boa', 'Iara', 'Jurema', 'Serena']],
    interacao: { rotulo: 'Manusear', textos: ['{nome} deslizou devagar pelo seu braço e se enrolou no seu pulso, quente da lâmpada.', 'Terrário limpo, água trocada; {nome} voltou para o galho de sempre.'] },
    cotidiano: ['{nome} trocou de pele: um tubo inteiro, do focinho à cauda.', '{nome} passou um mês sem comer e o veterinário disse que é normal no inverno.', 'A visita só entrou na sala depois de confirmar que o terrário estava trancado.'],
    morteCedo: ['uma infecção respiratória', 'uma doença por umidade errada no terrário']
  },
  {
    id: 'raposa_do_deserto', exotico: true, nome: ['raposa-do-deserto', 'raposa-do-deserto'], generoFixo: 'f', grupo: 'mamifero', vida: [10, 14], custo: 260, semana: 0.3, vinculo: 2, espaco: 'espaco', origens: ['criadouro'], preco: [12000, 25000], calorFaz: false,
    descricao: 'O fenec: a menor raposa do mundo, de orelhas enormes, de criadouro com licença. Noturna, cava, foge por qualquer vão e não aprende a usar caixa de areia como um gato. Encanta e dá trabalho.',
    jeitos: [J('cava o sofá como se fosse areia'), J('corre pela casa de madrugada'), J('desconfiado de estranho', 'desconfiada de estranho')],
    nomes: [['Duna', 'Saara', 'Orelha', 'Faísca'], ['Areia', 'Mirra', 'Tâmara', 'Lua']],
    interacao: { rotulo: 'Brincar com', textos: ['{nome} correu atrás da bolinha às duas da manhã — e você foi junto.', '{nome} cavou um buraco no cobertor e dormiu dentro dele.'] },
    cotidiano: ['{nome} cavou a terra do vaso inteiro e espalhou pela sala.', 'Às três da manhã, {nome} decidiu que era hora de correr pela casa.', '{nome} fugiu por um vão da tela e foi achada no quintal do vizinho.'],
    morteCedo: ['uma doença do coração comum na espécie', 'uma obstrução por algo que engoliu']
  },
  {
    id: 'macaco_prego', exotico: true, nome: ['macaco-prego', 'macaca-prego'], grupo: 'primata', vida: [35, 45], custo: 520, semana: 0.6, vinculo: 3, espaco: 'quintal', origens: ['criadouro'], preco: [40000, 75000], silvestre: true,
    descricao: 'Inteligente, forte, vive em bando e por décadas. Pede recinto grande, companhia da espécie, dieta variada e veterinário de primatas. Adulto, morde — e não é bicho de colo.',
    jeitos: [J('quebra coquinho com uma pedra'), J('ciumento de quem chega perto de você', 'ciumenta de quem chega perto de você'), J('imita tudo o que você faz')],
    nomes: [['Chico', 'Tião', 'Prego', 'Zeca'], ['Chica', 'Pimenta', 'Jurema', 'Nina']],
    interacao: { rotulo: 'Passar um tempo com', textos: ['{nome} quebrou uma castanha com a pedra e ofereceu a metade para você.', '{nome} catou o seu cabelo, sério, como se fosse obrigação.'] },
    cotidiano: ['{nome} aprendeu a abrir o trinco do recinto observando você.', '{nome} mordeu a mão de uma visita que chegou perto demais.', 'Sem outro macaco por perto, {nome} passou dias quieto num canto. O veterinário falou em solidão.'],
    morteCedo: ['uma doença transmitida por gente (herpes)', 'uma infecção']
  },
  {
    id: 'sagui', exotico: true, nome: ['sagui', 'sagui'], generoFixo: 'm', grupo: 'primata', vida: [12, 16], custo: 380, semana: 0.5, vinculo: 2.5, espaco: 'espaco', origens: ['criadouro'], preco: [15000, 30000], silvestre: true, barulho: true,
    descricao: 'Pequeno, de tufos brancos nas orelhas, vive em família. Pede recinto aquecido com galhos, luz ultravioleta, goma de árvore e insetos na dieta — e outro sagui. Assobia o dia inteiro.',
    jeitos: [J('assobia quando a casa fica quieta'), J('pula do galho para o seu ombro'), J('arisco com estranho', 'arisca com estranho')],
    nomes: [['Tufo', 'Mico', 'Pitoco', 'Sagui'], ['Pipa', 'Jade', 'Mel', 'Cotinha']],
    interacao: { rotulo: 'Passar um tempo com', textos: ['{nome} desceu do galho, pegou a uva da sua mão e voltou correndo.', '{nome} assobiou de volta cada vez que você assobiou.'] },
    cotidiano: ['{nome} roubou um pedaço de fruta da mesa do café e subiu na cortina.', 'O frio de uma noite deixou {nome} doente: o recinto ganhou aquecedor.', '{nome} passou a assobiar quando ouve a sua chave na porta.'],
    morteCedo: ['uma doença óssea (faltou luz ultravioleta)', 'uma infecção intestinal']
  }
];
