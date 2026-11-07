/**
 * VIDA 13 — NOMES DE EMPRESAS, MARCAS E ORGANIZAÇÕES (catálogo puro: só tipos).
 *
 * Até a 12.9, cada ramo tinha cinco nomes fixos — e nada impedia "Fortaleza Industrial comprou a concorrente Fortaleza
 * Industrial". Aqui ficam as PEÇAS (raízes, sufixos e prefixos por ramo, padrões por porte, marcas de produto por tipo,
 * fundos, famílias); o gerador (`sistemas/empresas13.nomeDeEmpresa13`) combina as peças e recusa o que for igual, quase
 * igual ou confuso no mesmo contexto. Nomes de marcas e modelos reais ficam de fora (a casa é inventada).
 *
 * Só vale para o que nasce daqui em diante: o nome de quem já existe está gravado no save e não muda.
 */

import type { TipoEmpresa } from '../tipos';

/** Raízes de uso geral (lugares, natureza, virtudes, astros): combinam com qualquer ramo. */
export const RAIZES_13: string[] = [
  'Fortaleza', 'Vale Verde', 'Polo', 'Aurora', 'Serra Azul', 'Tropical', 'Planalto', 'Bandeirante', 'Atlântico', 'Cerrado', 'Ipê', 'Jequitibá',
  'Mantiqueira', 'Guanabara', 'Pioneira', 'Estrela', 'Ouro Branco', 'Vitória', 'Monte Claro', 'Paineira', 'Aroeira', 'Jatobá', 'Carnaúba', 'Buriti',
  'Guará', 'Sabiá', 'Bem-te-vi', 'Juriti', 'Araucária', 'Pau-Brasil', 'Itaúna', 'Itapoã', 'Ibirá', 'Tietê', 'Paranapanema', 'Araguaia', 'Tocantins',
  'São Francisco', 'Pantanal', 'Chapada', 'Borborema', 'Canastra', 'Caparaó', 'Ibiapaba', 'Meridiano', 'Austral', 'Boreal', 'Equador', 'Trópico',
  'Zênite', 'Horizonte', 'Alvorada', 'Aliança', 'Concórdia', 'Esperança', 'Firmeza', 'Lealdade', 'Progresso', 'Prumo', 'Alicerce', 'Pilar',
  'Âncora', 'Farol', 'Bússola', 'Rumo', 'Vértice', 'Ápice', 'Cume', 'Altiva', 'Nobre', 'Sólida', 'Integral', 'Primor', 'Cristal', 'Safira',
  'Turmalina', 'Ametista', 'Topázio', 'Granito', 'Basalto', 'Quartzo', 'Cobalto', 'Titânio', 'Ventura', 'Bonança', 'Primavera', 'Outono',
  'Lua Nova', 'Sol Nascente', 'Cruzeiro', 'Órion', 'Sirius', 'Vega', 'Antares', 'Rigel', 'Altair', 'Andrômeda', 'Pégaso', 'Fênix', 'Condor',
  'Gavião', 'Falcão', 'Harpia', 'Carcará', 'Onça', 'Jaguar', 'Lobo-Guará', 'Tamanduá', 'Capivara', 'Ariranha', 'Boto', 'Tucano', 'Arara',
  'Paraíso', 'Recanto', 'Mirante', 'Colina', 'Planície', 'Enseada', 'Restinga', 'Baía', 'Cabo Norte', 'Rio Claro', 'Lagoa Santa', 'Pedra Branca',
  'Campo Belo', 'Serra Alta', 'Vila Nova', 'Bela Vista', 'Novo Rumo', 'Terra Firme', 'Mar Aberto', 'Céu Azul', 'Vento Sul', 'Brisa'
];

/** Sobrenomes (as empresas de família, os vendedores, os fundadores). */
export const SOBRENOMES_13: string[] = [
  'Albuquerque', 'Ferraz', 'Monteiro', 'Duarte', 'Siqueira', 'Valadares', 'Brandão', 'Cavalcanti', 'Junqueira', 'Matarazzo', 'Bittencourt', 'Lacerda',
  'Prado', 'Queiroz', 'Rezende', 'Sampaio', 'Teixeira', 'Vasconcelos', 'Amaral', 'Barreto', 'Coimbra', 'Diniz', 'Esteves', 'Figueiredo', 'Gouveia',
  'Holanda', 'Leme', 'Macedo', 'Noronha', 'Pacheco', 'Quintela', 'Rangel', 'Tavares', 'Uchoa', 'Viana', 'Werneck', 'Xavier', 'Zanetti', 'Bertolini',
  'Kowalski', 'Nakamura', 'Haddad', 'Salomão', 'Oliveira Lima', 'Andrade', 'Batista', 'Câmara', 'Fontoura', 'Guedes', 'Lobato', 'Moraes', 'Paranhos'
];

/** Por ramo: os sufixos ("Alimentos", "Motores"), os prefixos ("Banco", "Construtora") e raízes próprias. */
export interface PecasDoRamo13 { sufixos: string[]; prefixos: string[]; raizes?: string[]; familia: string[] }
export const PECAS_13: Partial<Record<TipoEmpresa, PecasDoRamo13>> = {
  industria: {
    sufixos: ['Industrial', 'Indústrias', 'Alimentos', 'Manufatura', 'Química', 'Embalagens', 'Indústria e Comércio', 'Bens de Consumo', 'Agroindustrial', 'Laticínios', 'Biscoitos', 'Higiene'],
    prefixos: ['Indústrias', 'Companhia', 'Fábrica', 'Grupo'],
    raizes: ['Vale Verde', 'Campo Dourado', 'Sertaneja', 'Fazendinha', 'Santa Clara', 'Trigal', 'Milharal', 'Celeiro', 'Moinho Velho', 'Engenho Novo'],
    familia: ['Indústrias {sobrenome}', '{sobrenome} & Filhos', '{sobrenome} Alimentos', 'Irmãos {sobrenome}']
  },
  montadora: {
    sufixos: ['Motores', 'Automóveis', 'Motors', 'Veículos', 'Automotiva', 'Mobilidade', 'Motocicletas'],
    prefixos: ['Montadora', 'Companhia'],
    raizes: ['Veloz', 'Cruzeiro', 'Ventania', 'Alazão', 'Coxilha', 'Trovão', 'Faísca', 'Tração', 'Estradeira', 'Rodovia'],
    familia: ['{sobrenome} Motores', '{sobrenome} Veículos']
  },
  tecnologia: {
    sufixos: ['Tech', 'Labs', 'Digital', 'Sistemas', 'Software', 'Dados', 'Tecnologia', 'Inteligência', 'Cloud', 'Apps'],
    prefixos: ['Grupo', 'Estúdio'],
    raizes: ['Nuvem Clara', 'Lógica Viva', 'Ponto Zero', 'Órbita', 'Pixel', 'Algoritmo', 'Sinapse', 'Neurônio', 'Bit Livre', 'Código Aberto', 'Matriz', 'Vetor', 'Fractal', 'Quântica', 'Prisma'],
    familia: ['{sobrenome} Tech', '{sobrenome} Sistemas']
  },
  construtora: {
    sufixos: ['Engenharia', 'Construções', 'Empreendimentos', 'Incorporadora', 'Urbanismo', 'Edificações', 'Obras'],
    prefixos: ['Construtora', 'Incorporadora'],
    raizes: ['Alicerce', 'Prumo', 'Esquadro', 'Viga Mestra', 'Pedra Fundamental', 'Concreto', 'Tijolo', 'Fachada', 'Cumeeira', 'Andaime'],
    familia: ['Construtora {sobrenome}', '{sobrenome} Engenharia', '{sobrenome} Empreendimentos']
  },
  banco: {
    sufixos: ['Investimentos', 'Banco', 'Financeira', 'Crédito', 'Capital', 'Asset', 'Participações'],
    prefixos: ['Banco', 'Banco', 'Caixa', 'Cooperativa'],
    raizes: ['Meridiano', 'Austral', 'Confiança', 'Lastro', 'Cofre', 'Moeda Forte', 'Patrimônio', 'Reserva', 'Penhor', 'Garantia', 'Tesouro', 'Escudo'],
    familia: ['Banco {sobrenome}', '{sobrenome} Investimentos', '{sobrenome} & Associados']
  },
  aerea: {
    sufixos: ['Linhas Aéreas', 'Aviação', 'Airlines', 'Transportes Aéreos', 'Voos'],
    prefixos: ['Aerovias', 'Linhas Aéreas'],
    raizes: ['Azimute', 'Céu Aberto', 'Rota Sul', 'Alçar', 'Asa Branca', 'Andorinha', 'Gaivota', 'Albatroz', 'Jato', 'Altitude', 'Nimbo', 'Cúmulo'],
    familia: ['{sobrenome} Linhas Aéreas']
  },
  aeroespacial: {
    sufixos: ['Aeroespacial', 'Espacial', 'Space', 'Orbital', 'Lançadores', 'Astronáutica'],
    prefixos: ['Companhia', 'Grupo'],
    raizes: ['Órbita Austral', 'Cruzeiro do Sul', 'Vetor', 'Zênite', 'Apogeu', 'Perigeu', 'Gravidade', 'Cosmos', 'Galáxia', 'Nebulosa', 'Plêiades', 'Cometa', 'Eclíptica'],
    familia: ['{sobrenome} Aeroespacial']
  },
  semicondutores: {
    sufixos: ['Semicondutores', 'Chips', 'Microeletrônica', 'Silício', 'Circuitos'],
    prefixos: ['Fundição', 'Grupo'],
    raizes: ['Silício Austral', 'Núcleo', 'Litografia', 'Quartzo', 'Wafer', 'Transistor', 'Elétron', 'Fóton', 'Nanômetro', 'Germânio'],
    familia: ['{sobrenome} Semicondutores']
  },
  energia: {
    sufixos: ['Energia', 'Geração', 'Renováveis', 'Elétrica', 'Força e Luz', 'Transmissora'],
    prefixos: ['Companhia Energética', 'Usinas'],
    raizes: ['Ventania', 'Sol do Sertão', 'Correnteza', 'Matriz', 'Cachoeira', 'Corredeira', 'Vendaval', 'Sol a Pino', 'Maré Alta', 'Raio', 'Faísca', 'Turbina'],
    familia: ['{sobrenome} Energia']
  },
  infraestrutura: {
    sufixos: ['Infraestrutura', 'Concessões', 'Logística', 'Participações', 'Rodovias', 'Portos'],
    prefixos: ['Concessionária', 'Grupo'],
    raizes: ['Via Austral', 'Atlântico', 'Ponte Firme', 'Trilho Norte', 'Estrada Real', 'Caminho Novo', 'Travessia', 'Viaduto', 'Cais', 'Eclusa'],
    familia: ['{sobrenome} Infraestrutura', '{sobrenome} Concessões']
  },
  restaurante: {
    sufixos: ['Bistrô', 'Cozinha', 'Restaurante', 'Cantina', 'Grill', 'Empório'],
    prefixos: ['Casa', 'Cozinha', 'Bistrô', 'Cantina', 'Mesa'],
    raizes: ['da Esquina', 'do Largo', 'Posta', 'Brasa & Sal', 'Fogão a Lenha', 'Panela de Barro', 'Tempero', 'Alecrim', 'Manjericão', 'Louro', 'Pimenta Rosa', 'Sal Grosso'],
    familia: ['Casa {sobrenome}', 'Cantina {sobrenome}', 'Cozinha da Família {sobrenome}']
  },
  clinica: {
    sufixos: ['Saúde', 'Clínica', 'Centro Médico', 'Medicina'],
    prefixos: ['Clínica', 'Centro Médico', 'Instituto', 'Policlínica'],
    raizes: ['Vida Plena', 'Bem Cuidar', 'Saúde Integral', 'Cuidado', 'Equilíbrio', 'Renascer', 'São Lucas', 'Santa Luzia', 'Bem-Estar'],
    familia: ['Clínica {sobrenome}', 'Instituto {sobrenome}']
  },
  academia: {
    sufixos: ['Fitness', 'Academia', 'Treinamento', 'Esportes'],
    prefixos: ['Academia', 'Arena', 'Estúdio'],
    raizes: ['Corpo em Movimento', 'Força Total', 'Pulso', 'Fôlego', 'Impulso', 'Endurance', 'Ritmo', 'Atleta', 'Vigor'],
    familia: ['Academia {sobrenome}']
  },
  estudio: {
    sufixos: ['Estúdio', 'Áudio', 'Som', 'Gravações'],
    prefixos: ['Estúdio', 'Casa do Som'],
    raizes: ['Porão', 'Fita Crua', 'Vinil', 'Agulha', 'Decibel', 'Eco', 'Microfone', 'Grave e Agudo', 'Compasso'],
    familia: ['Estúdio {sobrenome}']
  },
  hotel: {
    sufixos: ['Hotel', 'Pousada', 'Palace', 'Resort'],
    prefixos: ['Hotel', 'Grande Hotel', 'Pousada', 'Hotel Fazenda'],
    raizes: ['Mirante', 'do Porto', 'do Centro', 'das Águas', 'Recanto', 'Belvedere', 'Solar', 'Varanda'],
    familia: ['Hotel {sobrenome}', 'Pousada {sobrenome}']
  },
  loja: {
    sufixos: ['Empório', 'Magazine', 'Comércio', 'Loja', 'Variedades'],
    prefixos: ['Loja', 'Empório', 'Casa', 'Magazine'],
    raizes: ['da Rua', 'Vitrine', 'Balcão', 'Prateleira', 'Sacola', 'Achado', 'Mercadinho'],
    familia: ['Loja {sobrenome}', 'Casa {sobrenome}', 'Magazine {sobrenome}']
  },
  museu: { sufixos: ['Museu', 'Instituto Cultural'], prefixos: ['Museu', 'Instituto', 'Casa da Memória'], raizes: ['da Cidade', 'do Patrimônio'], familia: ['Museu {sobrenome}', 'Instituto {sobrenome} de Arte'] },
  zoologico: { sufixos: ['Bioparque', 'Zoológico'], prefixos: ['Parque Zoológico', 'Bioparque', 'Zoológico'], raizes: ['da Serra', 'da Fauna', 'das Araras'], familia: ['Parque Zoológico {sobrenome}'] }
};

/** O que só o porte grande usa ("Grupo X", "X Holding") e o que só o pequeno usa ("X & Filhos"). */
export const PADROES_GRANDES_13 = ['Grupo {raiz}', '{raiz} Holding', 'Companhia {raiz}', '{raiz} S.A.', '{raiz} Participações'];
export const PADROES_PEQUENOS_13 = ['{raiz} & Filhos', 'Casa {raiz}', '{raiz} & Cia.'];

/** As marcas de produto e os nomes de modelo (inventados; nada de modelo real). */
export const MARCAS_13: Record<string, string[]> = {
  alimento: ['Crocante', 'Trigolino', 'Vitalé', 'Sol da Manhã', 'Doçura', 'Mimo', 'Fazendinha', 'Pé de Moleque', 'Bom Grão', 'Cascudo', 'Pipoca Feliz', 'Lanchinho', 'Tia Nena', 'Vovó Zuza', 'Campo Belo', 'Trigal', 'Delícia do Sul', 'Cacau Real', 'Lua de Mel', 'Brisa', 'Gostosura', 'Nutrir', 'Frutal', 'Pomar do Vale', 'Sabor de Casa', 'Pão de Ló', 'Quindim', 'Cuca', 'Mandacaru', 'Jabuti'],
  higiene: ['Puríssima', 'Brilho', 'Espuma', 'Lavanda', 'Aloé', 'Orvalho', 'Cetim', 'Frescor', 'Algodão', 'Camomila', 'Erva-Doce', 'Alvura', 'Neblina', 'Pétala', 'Maresia', 'Hortelã'],
  industrial: ['Forte', 'Durável', 'Selo Azul', 'Proteção', 'Linha Mestra', 'Bloco', 'Matriz', 'Resiste', 'Base Sólida', 'Liga'],
  veiculo: ['Jaguara', 'Tupã', 'Siriema', 'Carcará', 'Iguaçu', 'Aruanã', 'Tauá', 'Boreal', 'Cerrado', 'Ventania', 'Mantiqueira', 'Pororoca', 'Jacamim', 'Anhumas', 'Arpoador', 'Itacaré', 'Serra Negra', 'Tapajós', 'Xingu', 'Juruá', 'Ibitipoca', 'Guaíba', 'Caparaó', 'Trancoso', 'Abaeté', 'Jalapão', 'Tarumã', 'Jacarandá', 'Sucuri', 'Graúna'],
  moto: ['Faísca', 'Raio', 'Corisco', 'Trovão', 'Furacão', 'Mutuca', 'Marimbondo', 'Vespão', 'Lambari', 'Tico-Tico', 'Bacurau', 'Cachorra-Louca', 'Ventoinha', 'Pipa'],
  app: ['Zás', 'Pronto', 'Chama', 'Vai', 'Tá Feito', 'Pertinho', 'Rolê', 'Bora', 'Cadê', 'Pulo', 'Mão Leve', 'Pode Deixar', 'Combinado', 'Fica a Dica'],
  tech: ['Ápice', 'Nimbus', 'Lume', 'Vértice', 'Prisma', 'Nexo', 'Fóton', 'Quasar', 'Pulsar', 'Áurea', 'Cobalto', 'Íris', 'Hélio', 'Argônio', 'Mosaico', 'Origami', 'Carbono', 'Sílex'],
  espaco: ['Boitatá', 'Guará', 'Iara', 'Sentinela', 'Araponga', 'Cruzeiro', 'Jaci', 'Guaraci', 'Caipora', 'Saci', 'Curupira', 'Jandaia', 'Uirapuru', 'Tupi', 'Itaipava'],
  imovel: ['Jardim dos Ipês', 'Bosque das Paineiras', 'Vista do Lago', 'Parque das Águas', 'Recanto Verde', 'Alto da Serra', 'Mirante do Vale', 'Praça das Flores', 'Villa Toscana', 'Solar das Palmeiras', 'Quinta da Colina', 'Terraços do Rio', 'Morada do Sol', 'Jardim Botânico', 'Brisa do Mar', 'Portal da Mata'],
  banco: ['Fácil', 'Ouro', 'Prata', 'Mais', 'Agora', 'Tranquilo', 'Previdente', 'Semente', 'Colheita', 'Futuro', 'Raiz', 'Ponte', 'Caminho', 'Lar Seguro'],
  aerea: ['Norte–Sul', 'Litoral', 'Sertão', 'Capitais', 'Atlântico', 'Pantanal', 'Amazônia', 'Serra', 'Fronteira', 'Pampa', 'Caribe', 'Cone Sul'],
  chip: ['Ágata', 'Ônix', 'Jaspe', 'Rubi', 'Opala', 'Berilo', 'Granada', 'Cianita', 'Pirita', 'Galena', 'Mica', 'Feldspato'],
  energia: ['Ventos do Norte', 'Sol do Sertão', 'Águas Claras', 'Serra do Mar', 'Chapada', 'Caatinga', 'Litoral', 'Rio Grande', 'Planalto', 'Veredas', 'Lajedo', 'Campos Gerais'],
  infra: ['Litorânea', 'Centro-Oeste', 'dos Bandeirantes', 'do Café', 'do Ouro', 'Transamazônica do Sul', 'dos Imigrantes', 'do Sertão', 'das Gerais', 'do Atlântico', 'do Pampa', 'Integração']
};

/** Quem põe dinheiro (as rodadas, os sócios, os vendedores). */
export const FUNDOS_13: { raiz: string[]; sufixo: string[] } = {
  raiz: ['Atlântico', 'Pedra Branca', 'Horizonte', 'Meridiano', 'Jequitibá', 'Ventura', 'Âncora', 'Farol', 'Bússola', 'Cume', 'Alvorada', 'Baía', 'Planalto', 'Cobalto', 'Safira'],
  sufixo: ['Capital', 'Partners', 'Investimentos', 'Gestora', 'Participações', 'Ventures', 'Asset']
};
