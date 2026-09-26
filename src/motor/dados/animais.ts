/**
 * Os animais que podem morar com alguém — e o que faz cada um ser diferente.
 *
 * LEGALIDADE (fontes no relatório do FIX #3):
 *   - Domésticos para fins de controle (Portaria IBAMA 93/1998, anexo
 *     atualizado pela Portaria 2.489/2019): cão, gato, coelho, porquinho-da-
 *     índia, hamster, chinchila (de cativeiro), calopsita, periquito-
 *     australiano, canário-belga. Compra e adoção comuns.
 *   - Peixes ornamentais fora da CITES: fora do controle da Portaria 93.
 *   - Silvestres NATIVOS (papagaio-verdadeiro, jabuti, iguana): só de
 *     criadouro comercial autorizado, com nota fiscal e marcação (anilha ou
 *     microchip). Tirar da natureza, comprar sem origem ou manter sem
 *     documento é crime (Lei 9.605/1998, art. 29) e infração com multa por
 *     animal (Decreto 6.514/2008, art. 24: R$ 500; R$ 5.000 se ameaçado ou na
 *     CITES). Entregar espontaneamente afasta a multa (art. 24, §5º).
 *   - Fora do jogo como compra: primatas (o último criadouro autorizado de
 *     macaco-prego foi fechado pelo IBAMA em abril de 2026), serpentes e
 *     répteis exóticos (importação proibida; oferta interna incerta), o
 *     tigre-d'água-americano (espécie exótica invasora). Eles só aparecem
 *     como OFERTA ILEGAL — que o jogo mostra com a consequência.
 *
 * VIDA: faixas típicas (veterinárias e zoológicos; ver relatório). Um bicho
 * não morre "de velhice" antes do tempo da espécie: morte cedo tem causa.
 */

import type { Especie } from '../tipos';

export type GrupoAnimal = 'cao' | 'gato' | 'ave' | 'roedor' | 'coelho' | 'peixe' | 'reptil';
export type OrigemCompra = 'abrigo' | 'loja' | 'criadouro';

export interface Animal {
  id: Especie;
  /** [masculino, feminino]; espécies em que não se costuma distinguir repetem a palavra. */
  nome: [string, string];
  /** O artigo da palavra quando não se distingue o sexo ("a calopsita", "o jabuti"). */
  generoFixo?: 'm' | 'f';
  grupo: GrupoAnimal;
  /** Vida típica, em anos [mínimo, máximo]. */
  vida: [number, number];
  /** Custo mensal (ração, areia, cuidados) numa cidade de custo 1. */
  custo: number;
  /** Quanto pede da semana (0,25 = um passeio por dia de cachorro). */
  semana: number;
  /** Quanto o vínculo cresce por ano morando junto. */
  vinculo: number;
  /** Onde vive bem. */
  espaco: 'qualquer' | 'espaco' | 'quintal';
  /** Como se consegue legalmente. */
  origens: OrigemCompra[];
  /** Preço de compra (loja ou criadouro autorizado), na cidade de custo 1. */
  preco: [number, number];
  /** Silvestre nativo: só de criadouro autorizado, com nota e marcação. */
  silvestre?: boolean;
  /** Barulhento (condomínio reclama). */
  barulho?: boolean;
  /** Sofre com calor forte. */
  calorFaz?: boolean;
  descricao: string;
  /** Como é conviver, em poucas palavras. */
  jeitos: [string, string][];
  nomes: [string[], string[]];
  /** A ação de convivência (Pessoas). */
  interacao: { rotulo: string; textos: string[] };
  /** Pequenos acontecimentos da espécie (o cotidiano de ter esse bicho). */
  cotidiano: string[];
  /** Causas plausíveis de morte antes da velhice. */
  morteCedo: string[];
}

const J = (m: string, f: string = m): [string, string] => [m, f];

export const ANIMAIS: readonly Animal[] = [
  {
    id: 'cachorro', nome: ['cachorro', 'cachorra'], grupo: 'cao', vida: [10, 15], custo: 190, semana: 0.25, vinculo: 3, espaco: 'qualquer', origens: ['abrigo'], preco: [0, 0],
    descricao: 'Pede passeio todo dia, companhia e espaço; devolve lealdade.',
    jeitos: [J('agitado, quer brincar o tempo todo', 'agitada, quer brincar o tempo todo'), J('calmo, deita no pé de quem estiver perto', 'calma, deita no pé de quem estiver perto'), J('late para tudo que passa')],
    nomes: [['Thor', 'Bidu', 'Bob', 'Scooby', 'Fred', 'Tobias', 'Faísca', 'Pingo'], ['Mel', 'Luna', 'Pretinha', 'Nina', 'Belinha', 'Paçoca', 'Pipoca', 'Estrela']],
    interacao: { rotulo: 'Passear com', textos: ['Longo passeio na praça, cheirando cada poste.', 'Uma volta no quarteirão que virou uma hora.'] },
    cotidiano: ['{nome} roeu o pé da mesa inteiro enquanto a casa estava vazia.', '{nome} aprendeu a abrir o portão com o focinho.', 'No temporal, {nome} passou a noite embaixo da sua cama.'],
    morteCedo: ['um atropelamento', 'uma doença que apareceu de repente', 'uma intoxicação']
  },
  {
    id: 'gato', nome: ['gato', 'gata'], grupo: 'gato', vida: [12, 18], custo: 120, semana: 0, vinculo: 3, espaco: 'qualquer', origens: ['abrigo'], preco: [0, 0],
    descricao: 'Independente, pede pouco tempo; a janela precisa de tela.',
    jeitos: [J('tímido, gosta de colo quando ninguém está olhando', 'tímida, gosta de colo quando ninguém está olhando'), J('curioso, entra em toda caixa', 'curiosa, entra em toda caixa'), J('dorme no sol da janela')],
    nomes: [['Frajola', 'Mingau', 'Salem', 'Tom', 'Chico', 'Garfield', 'Café'], ['Mia', 'Nala', 'Amora', 'Jade', 'Mimi', 'Lua', 'Canela']],
    interacao: { rotulo: 'Brincar com', textos: ['{nome} caçou o barbante por meia hora e dormiu no seu colo.', '{nome} fingiu desinteresse e depois não saiu do seu lado.'] },
    cotidiano: ['{nome} trouxe uma lagartixa de presente e deixou no tapete.', '{nome} derrubou o copo da mesa olhando nos seus olhos.', '{nome} descobriu o alto do armário e passou a morar lá.'],
    morteCedo: ['uma doença renal que apareceu cedo', 'um acidente', 'uma infecção que não respondeu ao tratamento']
  },
  {
    id: 'calopsita', nome: ['calopsita', 'calopsita'], generoFixo: 'f', grupo: 'ave', vida: [15, 20], custo: 60, semana: 0.1, vinculo: 2.5, espaco: 'qualquer', origens: ['loja', 'criadouro'], preco: [250, 450], barulho: true,
    descricao: 'Ave doméstica (Portaria IBAMA 93/1998): assobia, pede companhia e voo dentro de casa. Vive quase vinte anos.',
    jeitos: [J('assobia quando alguém chega'), J('gosta de ficar no ombro'), J('arrepia a crista quando se assusta')],
    nomes: [['Kiko', 'Pipo', 'Chico', 'Loro'], ['Pérola', 'Kika', 'Mel', 'Sol']],
    interacao: { rotulo: 'Soltar na sala', textos: ['{nome} voou duas voltas pela sala e pousou no seu ombro.', '{nome} assobiou a música da novela inteira.'] },
    cotidiano: ['{nome} aprendeu a assobiar o toque do seu celular.', '{nome} assobia toda vez que a porta abre.', '{nome} trocou as penas e passou uma semana emburrada.'],
    morteCedo: ['uma infecção respiratória', 'um susto — o coração não aguentou']
  },
  {
    id: 'periquito', nome: ['periquito', 'periquito'], generoFixo: 'm', grupo: 'ave', vida: [7, 12], custo: 40, semana: 0.05, vinculo: 1.5, espaco: 'qualquer', origens: ['loja', 'criadouro'], preco: [60, 150], barulho: true,
    descricao: 'Periquito-australiano, ave doméstica: pequeno, falante entre os seus, melhor em dupla.',
    jeitos: [J('conversa o dia inteiro na gaiola'), J('desconfiado de mão', 'desconfiada de mão')],
    nomes: [['Piu', 'Azul', 'Kiwi', 'Blue'], ['Pipoca', 'Lima', 'Mel', 'Nuvem']],
    interacao: { rotulo: 'Cuidar de', textos: ['Gaiola limpa, alpiste novo, conversa na janela.'] },
    cotidiano: ['{nome} começou a imitar o barulho da chaleira.', '{nome} descobriu o próprio reflexo no espelhinho da gaiola.'],
    morteCedo: ['uma infecção', 'uma corrente de ar frio numa noite de inverno']
  },
  {
    id: 'canario', nome: ['canário', 'canário'], generoFixo: 'm', grupo: 'ave', vida: [8, 12], custo: 40, semana: 0.05, vinculo: 1.5, espaco: 'qualquer', origens: ['loja', 'criadouro'], preco: [80, 250], barulho: true,
    descricao: 'Canário-belga, ave doméstica: canta de manhã, pede gaiola limpa e sol na medida.',
    jeitos: [J('canta ao nascer do sol'), J('só canta quando ninguém olha')],
    nomes: [['Amarelinho', 'Piu', 'Sol', 'Caruso'], ['Gema', 'Flor', 'Luz', 'Melodia']],
    interacao: { rotulo: 'Cuidar de', textos: ['Gaiola no sol da manhã; {nome} cantou até o café esfriar.'] },
    cotidiano: ['{nome} cantou a manhã inteira no primeiro dia de sol depois da chuva.'],
    morteCedo: ['uma infecção', 'o calor forte de um verão']
  },
  {
    id: 'papagaio', nome: ['papagaio', 'papagaio'], generoFixo: 'm', grupo: 'ave', vida: [40, 60], custo: 130, semana: 0.2, vinculo: 3, espaco: 'espaco', origens: ['criadouro'], preco: [3500, 6500], silvestre: true, barulho: true,
    descricao: 'Papagaio-verdadeiro, silvestre nativo: só de criadouro autorizado pelo IBAMA, com nota fiscal e anilha. Fala, grita, pede atenção todo dia — e pode viver mais do que o dono.',
    jeitos: [J('fala o nome de todo mundo da casa'), J('ciumento de quem chega', 'ciumenta de quem chega'), J('grita às seis da manhã')],
    nomes: [['Louro', 'Juca', 'Zeca', 'Chico'], ['Lora', 'Dita', 'Cida', 'Bela']],
    interacao: { rotulo: 'Conversar com', textos: ['{nome} repetiu, com a sua voz, uma frase que você nem lembrava de ter dito.', '{nome} dançou no poleiro com o rádio ligado.'] },
    cotidiano: ['{nome} aprendeu a chamar todo mundo da casa pelo nome.', '{nome} imita o toque do telefone tão bem que ninguém atende mais.', 'O vizinho reclamou dos gritos de {nome} às seis da manhã.'],
    morteCedo: ['uma infecção respiratória', 'uma doença do fígado']
  },
  {
    id: 'hamster', nome: ['hamster', 'hamster'], generoFixo: 'm', grupo: 'roedor', vida: [2, 3], custo: 40, semana: 0.05, vinculo: 1.5, espaco: 'qualquer', origens: ['loja'], preco: [40, 90],
    descricao: 'Pequeno, noturno, vive dois ou três anos: o primeiro bicho de muita criança.',
    jeitos: [J('corre na rodinha a noite toda'), J('guarda comida nas bochechas')],
    nomes: [['Bolinha', 'Pipoca', 'Nescau', 'Tico'], ['Pitoca', 'Bolota', 'Paçoca', 'Mel']],
    interacao: { rotulo: 'Brincar com', textos: ['{nome} correu dentro da bola pela casa inteira.'] },
    cotidiano: ['{nome} fugiu da gaiola e morou uma semana atrás da geladeira.', '{nome} escondeu metade da ração debaixo da serragem.'],
    morteCedo: ['uma infecção', 'uma queda']
  },
  {
    id: 'porquinho', nome: ['porquinho-da-índia', 'porquinha-da-índia'], grupo: 'roedor', vida: [5, 8], custo: 70, semana: 0.1, vinculo: 2, espaco: 'qualquer', origens: ['loja', 'abrigo'], preco: [60, 150],
    descricao: 'Manso, conversador, gosta de companhia e de feno fresco.',
    jeitos: [J('assobia quando ouve a geladeira abrir'), J('tímido, se esconde na casinha', 'tímida, se esconde na casinha')],
    nomes: [['Bacon', 'Tico', 'Pudim', 'Feijão'], ['Pipoca', 'Cocada', 'Jujuba', 'Pitanga']],
    interacao: { rotulo: 'Brincar com', textos: ['{nome} assobiou de alegria com o pedaço de cenoura.'] },
    cotidiano: ['{nome} aprendeu a assobiar toda vez que a geladeira abre.'],
    morteCedo: ['uma infecção respiratória', 'um problema nos dentes que não deu para resolver']
  },
  {
    id: 'coelho', nome: ['coelho', 'coelha'], grupo: 'coelho', vida: [8, 12], custo: 110, semana: 0.15, vinculo: 2.5, espaco: 'espaco', origens: ['loja', 'abrigo'], preco: [80, 200],
    descricao: 'Pede espaço para correr, feno o dia todo e fio escondido: rói tudo.',
    jeitos: [J('dá pulinhos quando está feliz'), J('desconfiado, só vem quando quer', 'desconfiada, só vem quando quer')],
    nomes: [['Pernalonga', 'Tambor', 'Floco', 'Algodão'], ['Neve', 'Pipoca', 'Mel', 'Lili']],
    interacao: { rotulo: 'Soltar para correr', textos: ['{nome} deu três piruetas no ar e se esparramou no chão.'] },
    cotidiano: ['{nome} roeu o fio da televisão.', '{nome} descobriu o sofá e passou a dormir nele.'],
    morteCedo: ['um problema intestinal', 'uma infecção']
  },
  {
    id: 'chinchila', nome: ['chinchila', 'chinchila'], generoFixo: 'f', grupo: 'roedor', vida: [10, 15], custo: 90, semana: 0.1, vinculo: 2, espaco: 'qualquer', origens: ['loja', 'criadouro'], preco: [400, 900], calorFaz: true,
    descricao: 'De cativeiro (Portaria IBAMA 93/1998): noturna, toma banho de pó — e sofre com calor forte.',
    jeitos: [J('pula pela gaiola à noite'), J('rola no pó de banho com gosto')],
    nomes: [['Fumaça', 'Cinza', 'Pompom', 'Tuti'], ['Nuvem', 'Pluma', 'Lua', 'Neblina']],
    interacao: { rotulo: 'Cuidar de', textos: ['Banho de pó; {nome} rolou até ficar branca.'] },
    cotidiano: ['{nome} passou a noite pulando de prateleira em prateleira da gaiola.'],
    morteCedo: ['o calor forte de um verão', 'um problema nos dentes']
  },
  {
    id: 'peixe', nome: ['peixinho-dourado', 'peixinho-dourado'], generoFixo: 'm', grupo: 'peixe', vida: [6, 12], custo: 35, semana: 0.05, vinculo: 0.8, espaco: 'qualquer', origens: ['loja'], preco: [30, 80],
    descricao: 'Pede aquário de verdade, filtro e água trocada — num aquário ruim, dura pouco.',
    jeitos: [J('vem para o vidro quando alguém chega'), J('passa o dia explorando as pedras')],
    nomes: [['Nemo', 'Dourado', 'Bolha', 'Tico'], ['Bolha', 'Dori', 'Pérola', 'Sereia']],
    interacao: { rotulo: 'Cuidar do aquário de', textos: ['Água trocada, filtro limpo; {nome} voltou a nadar rente ao vidro.'] },
    cotidiano: ['{nome} aprendeu a vir para a frente do vidro na hora da comida.'],
    morteCedo: ['um problema na água do aquário', 'uma doença de pele']
  },
  {
    id: 'betta', nome: ['betta', 'betta'], generoFixo: 'm', grupo: 'peixe', vida: [3, 5], custo: 20, semana: 0.03, vinculo: 0.8, espaco: 'qualquer', origens: ['loja'], preco: [20, 60],
    descricao: 'Peixe de uma cor só, que vive sozinho: pouca coisa, pouco tempo.',
    jeitos: [J('abre as nadadeiras quando se vê no vidro'), J('faz ninho de bolhas na superfície')],
    nomes: [['Rubi', 'Azul', 'Fogo', 'Netuno'], ['Ametista', 'Rubi', 'Coral', 'Onda']],
    interacao: { rotulo: 'Cuidar do aquário de', textos: ['Água trocada; {nome} abriu as nadadeiras como leque.'] },
    cotidiano: ['{nome} fez um ninho de bolhas na superfície.'],
    morteCedo: ['um problema na água', 'uma infecção nas nadadeiras']
  },
  {
    id: 'jabuti', nome: ['jabuti', 'jabuti'], generoFixo: 'm', grupo: 'reptil', vida: [40, 80], custo: 60, semana: 0.05, vinculo: 1, espaco: 'quintal', origens: ['criadouro'], preco: [900, 1800], silvestre: true,
    descricao: 'Silvestre nativo: só de criadouro autorizado, com nota e microchip. Vive décadas, gosta de quintal e de sol — e costuma ficar para a próxima geração.',
    jeitos: [J('come mamão sem pressa nenhuma'), J('some no quintal e aparece dias depois')],
    nomes: [['Tonico', 'Tartaruga', 'Seu Lento', 'Jorge'], ['Dona Lenta', 'Tartaruguinha', 'Dita', 'Rosa']],
    interacao: { rotulo: 'Dar banho de sol em', textos: ['{nome} tomou sol no quintal e comeu meio mamão.'] },
    cotidiano: ['{nome} sumiu no quintal por três dias e reapareceu embaixo do tanque.', 'No frio, {nome} quase não saiu da toca.'],
    morteCedo: ['uma infecção respiratória', 'uma doença do casco']
  },
  {
    id: 'iguana', nome: ['iguana', 'iguana'], generoFixo: 'f', grupo: 'reptil', vida: [12, 20], custo: 90, semana: 0.1, vinculo: 1, espaco: 'espaco', origens: ['criadouro'], preco: [700, 1500], silvestre: true,
    descricao: 'Silvestre nativa: só de criadouro autorizado, com nota e microchip. Precisa de terrário grande, calor e luz especial.',
    jeitos: [J('toma sol parada horas a fio'), J('desconfiada de mão')],
    nomes: [['Rex', 'Dino', 'Godofredo', 'Iggy'], ['Jade', 'Esmeralda', 'Dina', 'Pistache']],
    interacao: { rotulo: 'Cuidar de', textos: ['Luz trocada, folhas frescas; {nome} ficou horas no ponto quente do terrário.'] },
    cotidiano: ['{nome} escapou do terrário e foi achada tomando sol na janela.'],
    morteCedo: ['uma doença dos ossos (faltou luz certa)', 'uma infecção']
  }
];

export const animal = (id: Especie | undefined): Animal => ANIMAIS.find(a => a.id === id) ?? ANIMAIS[0];

/** A palavra do bicho, concordada ("a calopsita", "o cachorro", "a gata"). */
export function palavraDoBicho(esp: Especie | undefined, genero: string, artigo = true): string {
  const a = animal(esp);
  const fem = a.generoFixo ? a.generoFixo === 'f' : genero === 'feminino';
  const nome = fem ? a.nome[1] : a.nome[0];
  return artigo ? `${fem ? 'a' : 'o'} ${nome}` : nome;
}

/** Artigo indefinido ("uma calopsita", "um jabuti"). */
export function umBicho(esp: Especie | undefined, genero: string): string {
  const a = animal(esp);
  const fem = a.generoFixo ? a.generoFixo === 'f' : genero === 'feminino';
  return `${fem ? 'uma' : 'um'} ${fem ? a.nome[1] : a.nome[0]}`;
}

/** Ofertas que a vida pode apresentar FORA da lei (tráfico de animais silvestres). */
export const OFERTAS_ILEGAIS: { bicho: string; especie: Especie; cites: boolean; texto: string }[] = [
  { bicho: 'um filhote de papagaio', especie: 'papagaio', cites: true, texto: 'tirado do ninho, sem anilha, sem nota' },
  { bicho: 'um filhote de macaco-prego', especie: 'papagaio', cites: true, texto: 'que "já vem mansinho" — nenhum criadouro no país vende macaco legalmente' },
  { bicho: 'um filhote de jabuti', especie: 'jabuti', cites: true, texto: 'pego no mato, "mais barato que em loja"' },
  { bicho: 'um sagui', especie: 'papagaio', cites: true, texto: 'dentro de uma caixa de sapato' }
];
