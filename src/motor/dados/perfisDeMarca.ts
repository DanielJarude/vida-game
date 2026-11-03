/**
 * VIDA 12.8 — O QUE CADA MARCA É. Antes, a marca mudava só o preço (a faixa: popular, média, premium, luxo). Agora cada
 * uma tem um POSICIONAMENTO (econômico, intermediário, premium, luxo, ultraluxo) e um PERFIL de oito notas (1 a 5):
 *
 *   material · acabamento · design · durabilidade · conforto · exclusividade · prestígio · revenda
 *
 * e aquilo pelo que é CONHECIDA (`fama`), numa frase. O perfil tem efeito no jogo onde faz sentido — e só ali:
 *   - a DURABILIDADE muda o desgaste por ano (`coisas.processarCoisas`): a máquina de lavar feita para vinte anos dura;
 *   - a REVENDA muda o que o usado vale (`coisas.valorDeRevenda`): o relógio de fila conserva o valor, o resto não;
 *   - o CONFORTO da cama e do sofá entra no conforto da casa (`lar.confortoDaCasa`);
 *   - o SEGMENTO soma ao nível da coisa (`lar.nivelDaCoisa`), que é a qualidade do cômodo (`casaViva`);
 *   - o ESTILO muda o desenho (`ui/ilustracao/estiloDeMarca`): o pé, o metal, o brilho, o arremate.
 * Nenhuma nota deixa a pessoa mais competente: um relógio caro não ensina ninguém a chegar na hora.
 *
 * As marcas reais têm o perfil do que são conhecidas por ser (a Miele pela durabilidade; a Rolex e a Steinway por
 * conservar o valor; a IKEA pelo design barato de montar; a Casio pela resistência do relógio digital) — o jeito de cada
 * uma, sem números inventados de produto. As fictícias preenchem os posicionamentos. Catálogo puro (só tipos).
 */

export type SegmentoDeMarca = 1 | 2 | 3 | 4 | 5;
export const NOME_SEGMENTO_DE_MARCA: Record<SegmentoDeMarca, string> = { 1: 'econômico', 2: 'intermediário', 3: 'premium', 4: 'luxo', 5: 'ultraluxo' };

export type QualidadeDeMarca = 'material' | 'acabamento' | 'design' | 'durabilidade' | 'conforto' | 'exclusividade' | 'prestigio' | 'revenda';
export const NOME_QUALIDADE: Record<QualidadeDeMarca, string> = { material: 'materiais', acabamento: 'acabamento', design: 'design', durabilidade: 'durabilidade', conforto: 'conforto', exclusividade: 'exclusividade', prestigio: 'prestígio', revenda: 'valor de revenda' };

/**
 * Como a marca aparece no desenho: `basico` (plástico, pé de bloco, sem brilho), `funcional` (o certo, sem enfeite),
 * `nordico` (madeira clara, pé palito), `contemporaneo` (metal preto fino), `classico` (madeira escura, pé torneado,
 * capitonê), `artesanal` (madeira maciça, a junta à vista), `tecnico` (inox, a peça profissional), `iconico` (latão, o
 * desenho que se reconhece de longe).
 */
export type EstiloDeMarca = 'basico' | 'funcional' | 'nordico' | 'contemporaneo' | 'classico' | 'artesanal' | 'tecnico' | 'iconico';

export interface PerfilDeMarca {
  /** O posicionamento (ausente: o da faixa — popular → econômico, média → intermediário, premium, luxo). */
  seg?: SegmentoDeMarca;
  notas?: Partial<Record<QualidadeDeMarca, number>>;
  fama?: QualidadeDeMarca;
  frase?: string;
  estilo?: EstiloDeMarca;
}

export const PERFIS_DE_MARCA: Record<string, PerfilDeMarca> = {
  // ------------------------------------------------------------ roupas e calçados
  hering: { notas: { durabilidade: 3 }, fama: 'durabilidade', frase: 'A malha básica que aguenta muita lavagem.', estilo: 'funcional' },
  hm: { notas: { design: 3, durabilidade: 2 }, fama: 'design', frase: 'A tendência da estação a preço baixo — feita para uma estação.', estilo: 'contemporaneo' },
  uniqlo: { notas: { material: 3, durabilidade: 3 }, fama: 'material', frase: 'Tecido técnico e corte simples, sem logotipo.', estilo: 'funcional' },
  zara: { notas: { design: 4, durabilidade: 2 }, fama: 'design', frase: 'A passarela de ontem na vitrine de hoje.', estilo: 'contemporaneo' },
  levis: { notas: { durabilidade: 4, prestigio: 3 }, fama: 'durabilidade', frase: 'O jeans de lona grossa que dura anos e amacia com o tempo.', estilo: 'classico' },
  osklen: { notas: { design: 4, material: 4 }, fama: 'design', frase: 'Linho, algodão orgânico e o desenho da praia carioca.', estilo: 'contemporaneo' },
  lacoste: { notas: { prestigio: 4, durabilidade: 4 }, fama: 'prestigio', frase: 'A camisa polo de piquê com o crocodilo no peito.', estilo: 'classico' },
  ralph: { notas: { prestigio: 4, acabamento: 4 }, fama: 'prestigio', frase: 'O clássico americano: oxford, tweed, o cavalinho bordado.', estilo: 'classico' },
  gucci: { notas: { design: 5, prestigio: 5, revenda: 3 }, fama: 'design', frase: 'O desenho que se reconhece de longe — e muda a cada coleção.', estilo: 'iconico' },
  prada: { notas: { design: 5, material: 5, prestigio: 5 }, fama: 'material', frase: 'O náilon que virou luxo e o corte seco de Milão.', estilo: 'contemporaneo' },
  hermes: { seg: 5, notas: { material: 5, acabamento: 5, exclusividade: 5, prestigio: 5, revenda: 5, durabilidade: 5 }, fama: 'revenda', frase: 'Couro costurado à mão, fila de espera e peças que valem mais usadas do que novas.', estilo: 'iconico' },
  havaianas: { notas: { durabilidade: 4 }, fama: 'durabilidade', frase: 'A borracha que não deforma nem solta as tiras.', estilo: 'basico' },
  drmartens: { notas: { durabilidade: 5, design: 4 }, fama: 'durabilidade', frase: 'Couro grosso e solado costurado: dura uma década.', estilo: 'classico' },
  louboutin: { notas: { design: 5, prestigio: 5, conforto: 2 }, fama: 'design', frase: 'A sola vermelha. Linda, e ninguém diz que é confortável.', estilo: 'iconico' },
  nike: { notas: { design: 4, conforto: 4 }, fama: 'design', frase: 'Amortecimento, tecnologia e o tênis de colecionador.', estilo: 'contemporaneo' },
  adidas: { notas: { conforto: 4, durabilidade: 3 }, fama: 'conforto', frase: 'As três listras: do treino à rua.', estilo: 'contemporaneo' },
  asics: { notas: { conforto: 5, durabilidade: 4 }, fama: 'conforto', frase: 'O tênis de corrida de quem corre de verdade.', estilo: 'tecnico' },
  clarks: { notas: { conforto: 4, durabilidade: 4 }, fama: 'conforto', frase: 'Sapato de couro que não machuca no primeiro dia.', estilo: 'classico' },
  geox: { notas: { conforto: 4 }, fama: 'conforto', frase: 'A sola que respira.', estilo: 'funcional' },
  // ------------------------------------------------------------ relógios e joias
  casio: { notas: { durabilidade: 5, revenda: 2 }, fama: 'durabilidade', frase: 'O digital que aguenta queda, água e anos de pulso.', estilo: 'funcional' },
  seiko: { notas: { durabilidade: 4, acabamento: 4 }, fama: 'acabamento', frase: 'Relojoaria japonesa: o automático bem acabado a preço justo.', estilo: 'classico' },
  tissot: { notas: { acabamento: 4, prestigio: 3 }, fama: 'acabamento', frase: 'A tradição suíça de entrada.', estilo: 'classico' },
  swatch: { notas: { design: 4, durabilidade: 2 }, fama: 'design', frase: 'O relógio de plástico colorido que virou moda.', estilo: 'contemporaneo' },
  garmin: { notas: { durabilidade: 4, material: 4 }, fama: 'durabilidade', frase: 'O relógio de treino: GPS, bateria de semanas.', estilo: 'tecnico' },
  apple: { notas: { design: 5, acabamento: 5, revenda: 4 }, fama: 'design', frase: 'Alumínio, vidro e o usado que ainda vende bem.', estilo: 'contemporaneo' },
  rolex: { notas: { material: 5, acabamento: 5, durabilidade: 5, prestigio: 5, revenda: 5, exclusividade: 4 }, fama: 'revenda', frase: 'Fila de espera na boutique e o usado que vale o que custou.', estilo: 'iconico' },
  omega: { notas: { acabamento: 5, prestigio: 5, revenda: 4 }, fama: 'prestigio', frase: 'O relógio que foi à Lua.', estilo: 'classico' },
  patek: { seg: 5, notas: { material: 5, acabamento: 5, durabilidade: 5, exclusividade: 5, prestigio: 5, revenda: 5 }, fama: 'exclusividade', frase: 'Feito à mão em Genebra, em séries pequenas: "você nunca é dono, só cuida dele para a próxima geração".', estilo: 'iconico' },
  pandora: { notas: { design: 4 }, fama: 'design', frase: 'A pulseira que cresce de berloque em berloque.', estilo: 'contemporaneo' },
  swarovski: { notas: { design: 4, acabamento: 4, revenda: 1 }, fama: 'acabamento', frase: 'Cristal lapidado: brilha como joia, revende como bijuteria.', estilo: 'contemporaneo' },
  vivara: { notas: { prestigio: 3, acabamento: 4 }, fama: 'acabamento', frase: 'A joalheria das datas importantes.', estilo: 'classico' },
  tiffany: { notas: { design: 5, prestigio: 5, revenda: 3 }, fama: 'prestigio', frase: 'A caixa azul.', estilo: 'iconico' },
  cartier: { notas: { design: 5, prestigio: 5, revenda: 4, exclusividade: 4 }, fama: 'design', frase: 'O joalheiro dos reis: a pantera, o parafuso, o relógio quadrado.', estilo: 'iconico' },
  // ------------------------------------------------------------ eletrônicos e eletrodomésticos
  positivo: { notas: { durabilidade: 2 }, frase: 'O computador do primeiro emprego.', estilo: 'basico' },
  xiaomi: { notas: { design: 3, acabamento: 3 }, fama: 'design', frase: 'Muita especificação por pouco dinheiro.', estilo: 'funcional' },
  motorola: { notas: { durabilidade: 3 }, frase: 'O celular sem frescura.', estilo: 'funcional' },
  samsung: { notas: { design: 4, acabamento: 4 }, fama: 'acabamento', frase: 'Tela boa e a casa inteira conversando com o celular.', estilo: 'contemporaneo' },
  lg: { notas: { acabamento: 3, durabilidade: 3 }, fama: 'acabamento', frase: 'A tela e a lavadora de toda casa.', estilo: 'funcional' },
  sony: { notas: { acabamento: 5, design: 4 }, fama: 'acabamento', frase: 'O som e a imagem de quem se importa com som e imagem.', estilo: 'tecnico' },
  nintendo: { notas: { design: 5, revenda: 4 }, fama: 'design', frase: 'Os jogos que não envelhecem.', estilo: 'contemporaneo' },
  canon: { notas: { durabilidade: 4, material: 4 }, fama: 'durabilidade', frase: 'O corpo de câmera que aguenta anos de reportagem.', estilo: 'tecnico' },
  lenovo: { notas: { durabilidade: 4 }, fama: 'durabilidade', frase: 'O teclado de escritório que não quebra.', estilo: 'funcional' },
  dell: { notas: { durabilidade: 3, acabamento: 3 }, frase: 'O computador da empresa.', estilo: 'funcional' },
  consul: { notas: { durabilidade: 3 }, fama: 'durabilidade', frase: 'O eletrodoméstico simples que funciona.', estilo: 'basico' },
  brastemp: { notas: { durabilidade: 4, prestigio: 3 }, fama: 'durabilidade', frase: '"Não é nenhuma Brastemp" virou ditado por um motivo.', estilo: 'funcional' },
  electrolux: { notas: { durabilidade: 3 }, frase: 'A linha branca de sempre.', estilo: 'funcional' },
  whirlpool: { notas: { durabilidade: 3 }, frase: 'A lavadora grande americana.', estilo: 'funcional' },
  bosch: { notas: { durabilidade: 4, material: 4 }, fama: 'durabilidade', frase: 'Engenharia alemã: silenciosa e feita para durar.', estilo: 'tecnico' },
  smeg: { notas: { design: 5, durabilidade: 3, prestigio: 4 }, fama: 'design', frase: 'A geladeira retrô colorida dos anos 1950, que vira o centro da cozinha.', estilo: 'iconico' },
  miele: { notas: { durabilidade: 5, material: 5, acabamento: 5, revenda: 4 }, fama: 'durabilidade', frase: 'Testada para vinte anos de uso: a última máquina de lavar que se compra.', estilo: 'tecnico' },
  gaggenau: { seg: 5, notas: { material: 5, acabamento: 5, durabilidade: 5, exclusividade: 5, prestigio: 5 }, fama: 'exclusividade', frase: 'A cozinha de chef em aço inox maciço, montada sob medida.', estilo: 'tecnico' },
  fornaro: { notas: { durabilidade: 5, material: 5 }, fama: 'durabilidade', frase: 'Equipamento de restaurante na cozinha de casa.', estilo: 'tecnico' },
  volt: { notas: { durabilidade: 2 }, frase: 'O mais barato da prateleira.', estilo: 'basico' },
  // ------------------------------------------------------------ móveis
  casa_pratica: { notas: { durabilidade: 2, conforto: 2 }, frase: 'O móvel de montar que resolve.', estilo: 'basico' },
  etna: { notas: { durabilidade: 2 }, frase: 'A casa montada sem gastar muito.', estilo: 'basico' },
  ikea: { notas: { design: 4, durabilidade: 2 }, fama: 'design', frase: 'Design escandinavo de montar: bonito, barato — e pede parafuso apertado.', estilo: 'nordico' },
  tokstok: { notas: { design: 4, durabilidade: 3 }, fama: 'design', frase: 'O design jovem da casa brasileira.', estilo: 'contemporaneo' },
  westwing: { notas: { design: 4, acabamento: 3 }, fama: 'design', frase: 'Curadoria de decoração: a peça da revista.', estilo: 'contemporaneo' },
  aurora: { notas: { material: 5, durabilidade: 5, acabamento: 4, revenda: 3 }, fama: 'durabilidade', frase: 'Madeira maciça e encaixe à mão: o móvel que passa para os filhos.', estilo: 'artesanal' },
  natuzzi: { notas: { conforto: 5, material: 5, acabamento: 4 }, fama: 'conforto', frase: 'O sofá de couro italiano em que se afunda.', estilo: 'classico' },
  minotti: { notas: { design: 5, conforto: 5, acabamento: 5, prestigio: 4 }, fama: 'design', frase: 'O sofá baixo e largo das casas de revista.', estilo: 'contemporaneo' },
  fendi_casa: { seg: 5, notas: { design: 5, material: 5, acabamento: 5, exclusividade: 5, prestigio: 5, conforto: 4 }, fama: 'exclusividade', frase: 'A casa de moda de Roma em móveis: couro, latão e mármore.', estilo: 'iconico' },
  atelier_ardent: { notas: { design: 5, exclusividade: 5, acabamento: 5 }, fama: 'exclusividade', frase: 'Peças de ateliê, poucas por ano, cada uma assinada.', estilo: 'iconico' },
  // ------------------------------------------------------------ instrumentos
  giannini: { notas: { durabilidade: 3 }, frase: 'O violão da primeira aula.', estilo: 'basico' },
  tagima: { notas: { durabilidade: 3 }, frase: 'A guitarra brasileira de entrada.', estilo: 'basico' },
  ressoar: { notas: { durabilidade: 2 }, frase: 'O instrumento para começar.', estilo: 'basico' },
  yamaha: { notas: { durabilidade: 5, acabamento: 4 }, fama: 'durabilidade', frase: 'Confiável: o piano da escola de música que aguenta cinquenta alunos.', estilo: 'funcional' },
  roland: { notas: { material: 4, durabilidade: 4 }, fama: 'material', frase: 'O som eletrônico dos estúdios.', estilo: 'tecnico' },
  fender: { notas: { design: 5, prestigio: 4, revenda: 4 }, fama: 'design', frase: 'O corpo e o timbre que fizeram o rock.', estilo: 'iconico' },
  gibson: { notas: { material: 5, prestigio: 5, revenda: 5 }, fama: 'revenda', frase: 'A guitarra que vale mais com os anos.', estilo: 'classico' },
  steinway: { notas: { material: 5, acabamento: 5, durabilidade: 5, prestigio: 5, revenda: 5 }, fama: 'revenda', frase: 'O piano das salas de concerto: um usado bem cuidado vale quase um novo.', estilo: 'classico' },
  fazioli: { seg: 5, notas: { material: 5, acabamento: 5, exclusividade: 5, prestigio: 5, revenda: 5 }, fama: 'exclusividade', frase: 'Poucos pianos por ano, feitos à mão na Itália, com madeira de abeto da floresta de Fiemme.', estilo: 'iconico' },
  // ------------------------------------------------------------ esporte
  decathlon: { notas: { durabilidade: 3 }, fama: 'durabilidade', frase: 'O equipamento de esporte que cabe no bolso.', estilo: 'funcional' },
  olympikus: { notas: { conforto: 3 }, frase: 'O tênis brasileiro de corrida.', estilo: 'funcional' },
  penalty: { notas: { durabilidade: 3 }, frase: 'A bola do campeonato de bairro.', estilo: 'funcional' },
  wilson: { notas: { material: 4, durabilidade: 4 }, fama: 'material', frase: 'A raquete e a bola das quadras profissionais.', estilo: 'tecnico' },
  impulso: { notas: { durabilidade: 3 }, frase: 'Aparelho de academia para a casa.', estilo: 'funcional' }
};

/** As notas de cada posicionamento (o que a marca é quando o perfil não diz nada). */
export const NOTAS_DO_SEGMENTO: Record<SegmentoDeMarca, Record<QualidadeDeMarca, number>> = {
  1: { material: 2, acabamento: 2, design: 2, durabilidade: 2, conforto: 2, exclusividade: 1, prestigio: 1, revenda: 1 },
  2: { material: 3, acabamento: 3, design: 3, durabilidade: 3, conforto: 3, exclusividade: 2, prestigio: 2, revenda: 2 },
  3: { material: 4, acabamento: 4, design: 4, durabilidade: 4, conforto: 4, exclusividade: 3, prestigio: 3, revenda: 3 },
  4: { material: 5, acabamento: 5, design: 4, durabilidade: 4, conforto: 4, exclusividade: 4, prestigio: 5, revenda: 3 },
  5: { material: 5, acabamento: 5, design: 5, durabilidade: 5, conforto: 4, exclusividade: 5, prestigio: 5, revenda: 4 }
};
