/**
 * VIDA 22 — A LOJA DA CASA POR AMBIENTE. A vitrine da loja de móveis e decoração passa a ser organizada pelo lugar da
 * casa onde a peça vai (como se anda numa loja de verdade): Sala de estar, Quarto, Cozinha e jantar, Banheiro,
 * Iluminação, Decoração, Closet e organização, Escritório, Área externa e jardim, Piscina e lazer, Lavanderia e serviço,
 * Garagem e oficina. Dentro de cada ambiente, o tipo de móvel (os sofás, as poltronas, as mesas — `TIPOS_DE_MOVEL`,
 * da VIDA 14) continua como segundo filtro.
 *
 * Um produto pode estar em mais de um ambiente quando faz sentido de verdade (o espelho de chão no quarto e no closet,
 * a mesa e as cadeiras externas no jardim e na piscina, a adega na cozinha e na sala): é a MESMA linha da loja — o
 * mesmo produto, a mesma compra, a mesma posse —, só aparece nos dois corredores. Nenhum ambiente fica vazio (o teste
 * confere com o catálogo real) e nenhum produto da casa fica sem ambiente.
 *
 * Catálogo puro (só dados), no pacote `dados22-moveis`.
 */

export const AMBIENTES22 = [
  { id: 'sala', nome: 'Sala de estar' },
  { id: 'quarto', nome: 'Quarto' },
  { id: 'cozinha', nome: 'Cozinha e jantar' },
  { id: 'banheiro', nome: 'Banheiro' },
  { id: 'iluminacao', nome: 'Iluminação' },
  { id: 'decoracao', nome: 'Decoração' },
  { id: 'closet', nome: 'Closet e organização' },
  { id: 'escritorio', nome: 'Escritório' },
  { id: 'externa', nome: 'Área externa e jardim' },
  { id: 'piscina', nome: 'Piscina e lazer' },
  { id: 'lavanderia', nome: 'Lavanderia e serviço' },
  { id: 'garagem', nome: 'Garagem e oficina' }
] as const;
export type Ambiente22 = (typeof AMBIENTES22)[number]['id'];

/** O(s) ambiente(s) de cada produto da casa (o primeiro é o principal: é o que aparece no cartão). */
const DO_PRODUTO: Record<string, Ambiente22[]> = {
  // Sala de estar
  sofa: ['sala'], sofa_retratil: ['sala'], sofa_couro: ['sala'], sofa_designer: ['sala'], sofa_cama: ['sala', 'quarto'],
  poltrona: ['sala'], poltrona_designer: ['sala'], poltronas_cinema: ['sala', 'piscina'],
  mesa_centro: ['sala'], mesa_centro_marmore: ['sala'], mesa_lateral: ['sala'], estante_sala: ['sala'], aparador: ['sala', 'decoracao'],
  lareira: ['sala', 'decoracao'], vitrine_colecao: ['sala', 'decoracao'], estante_trofeus: ['sala', 'escritorio'], mesa_jogos: ['sala', 'piscina'],
  // Quarto
  colchao: ['quarto'], cama_box: ['quarto'], cama_king: ['quarto'], colchao_hotel: ['quarto'], cama_solteiro: ['quarto'], beliche: ['quarto'],
  roupa_de_cama: ['quarto'], criado_mudo: ['quarto'], comoda: ['quarto', 'closet'], guarda_roupa: ['quarto', 'closet'], penteadeira: ['quarto', 'closet'],
  // Closet e organização
  closet: ['closet'], espelho_chao: ['closet', 'quarto'], expositor_relogios: ['closet'], organizadores: ['closet', 'garagem'],
  // Cozinha e jantar
  mesa_jantar: ['cozinha'], ilha_cozinha: ['cozinha'], armarios_planejados: ['cozinha'], louca_talheres: ['cozinha'], cozinha_equipada: ['cozinha'],
  geladeira: ['cozinha'], geladeira_inox: ['cozinha'], freezer: ['cozinha', 'lavanderia'], fogao: ['cozinha'], cooktop_forno: ['cozinha'], fogao_profissional: ['cozinha'],
  microondas: ['cozinha'], cafeteira: ['cozinha'], lava_loucas: ['cozinha'], adega: ['cozinha', 'sala'], adega_parede: ['cozinha', 'sala'],
  // Banheiro
  banheira: ['banheiro'], banheira_pedra: ['banheiro'], ducha: ['banheiro'], gabinete: ['banheiro'], bancada_marmore: ['banheiro'], espelho_led: ['banheiro', 'iluminacao'],
  toalhas: ['banheiro'], sauna: ['banheiro'], toalheiro: ['banheiro'],
  // Iluminação
  luz_jardim: ['iluminacao', 'externa'], luz_piscina: ['iluminacao', 'piscina'],
  // Decoração
  quadros: ['decoracao'], objetos_decor: ['decoracao'], tapete: ['decoracao', 'sala'], tapete_persa: ['decoracao', 'sala'], plantas: ['decoracao', 'externa'], vasos_grandes: ['decoracao', 'externa'],
  // Escritório
  escrivaninha: ['escritorio', 'quarto'], mesa_executiva: ['escritorio'], cadeira_ergonomica: ['escritorio'], estante_escritorio: ['escritorio'],
  // Área externa e jardim
  mesa_externa: ['externa', 'piscina'], sofa_externo: ['externa', 'piscina'], churrasqueira: ['externa'], espaco_gourmet: ['externa'], forno_pizza: ['externa'],
  pergolado: ['externa'], gazebo: ['externa'], fonte: ['externa', 'decoracao'], escultura_jardim: ['externa', 'decoracao'], ombrelone: ['externa', 'piscina'], guarda_sol: ['externa', 'piscina'],
  // Piscina e lazer
  espreguicadeira: ['piscina', 'externa'], espreguicadeira_teca: ['piscina', 'externa'], boias: ['piscina'], aquecedor_piscina: ['piscina'], capa_piscina: ['piscina'], cascata: ['piscina'],
  kit_piscina: ['piscina'], playground: ['piscina', 'externa'], cama_elastica: ['piscina', 'externa'],
  // Lavanderia e serviço
  maquina_lavar: ['lavanderia'], aspirador_robo: ['lavanderia'], ar_condicionado: ['lavanderia', 'quarto'],
  // Garagem e oficina
  ferramentas: ['garagem'], bancada_ferramentas: ['garagem'], armario_garagem: ['garagem'], carregador_ev: ['garagem'], lavadora_pressao: ['garagem', 'lavanderia']
};

/** Os ambientes de um produto da casa (vazio: não é da loja da casa). */
export const ambientesDoProduto = (coisaId: string): Ambiente22[] => DO_PRODUTO[coisaId] ?? [];
export const temAmbiente = (coisaId: string) => coisaId in DO_PRODUTO;
export const nomeDoAmbiente = (a: Ambiente22) => AMBIENTES22.find(x => x.id === a)!.nome;
