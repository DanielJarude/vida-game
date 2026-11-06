/**
 * VIDA 12.9 · Estudos — a formação técnica e profissionalizante, ampliada.
 *
 * Cada curso daqui leva a uma ÁREA que já tem trabalho de verdade no jogo (`dados/ocupacoes`, pelo campo `area`): o
 * técnico em refrigeração abre a vaga de técnico de refrigeração e a de eletricista; o técnico em cozinha, a de cozinheiro
 * e a de chef; o de agronegócio, a de técnico agrícola. Nenhum curso existe "por existir": não há certificado avulso nem
 * qualificação acadêmica sem porta (a ideia foi rejeitada) — o curso é formação, com a escolaridade e a área de sempre.
 *
 * Catálogo puro (só tipos): entra em `CURSOS` pelo fim da lista (os índices das opções de antes não mudam) e nas escolas
 * técnicas pelo recorte próprio de cada perfil (`EXTRAS_TECNICOS_129`, sorteado à parte: o catálogo que cada escola já
 * tinha continua o mesmo).
 */
import type { Curso } from './cursos';

export const CURSOS_129: readonly Curso[] = [
  // ---------------------------------------------------------------- Técnicos novos (CNCT, eixos com vaga no jogo)
  { id: 'tec_refrigeracao', nome: 'Técnico em Refrigeração e Climatização', nivel: 'tecnico', area: 'eletrotecnica', meses: 18, publica: 1, privada: 1, ead: false, mensalidade: 430, corte: 0, carga: 'parcial', descricao: 'Ar-condicionado, câmaras frias, refrigeração comercial: instalação e manutenção.', pratica: { manual: 1, exatas: 0.3 } },
  { id: 'tec_energia_renovavel', nome: 'Técnico em Sistemas de Energia Renovável', nivel: 'tecnico', area: 'eletrotecnica', meses: 18, publica: 1, privada: 1, ead: false, mensalidade: 480, corte: 0, carga: 'parcial', descricao: 'Painéis solares, inversores, a rede elétrica que recebe a energia.', pratica: { manual: 0.8, exatas: 0.5 } },
  { id: 'tec_telecomunicacoes', nome: 'Técnico em Telecomunicações', nivel: 'tecnico', area: 'eletrotecnica', meses: 18, publica: 1, privada: 1, ead: false, mensalidade: 450, corte: 0, carga: 'parcial', descricao: 'Fibra óptica, antenas, centrais: a rede que liga a cidade.', pratica: { manual: 0.7, exatas: 0.5, programacao: 0.2 } },
  { id: 'tec_eletromecanica', nome: 'Técnico em Eletromecânica', nivel: 'tecnico', area: 'mecanica', meses: 24, publica: 1, privada: 1, ead: false, mensalidade: 480, corte: 0, carga: 'parcial', descricao: 'Motores, comandos elétricos, manutenção de máquinas na fábrica.', pratica: { manual: 1, exatas: 0.5 } },
  { id: 'tec_manutencao_automotiva', nome: 'Técnico em Manutenção Automotiva', nivel: 'tecnico', area: 'mecanica', meses: 18, publica: 1, privada: 1, ead: false, mensalidade: 450, corte: 0, carga: 'parcial', descricao: 'Injeção eletrônica, diagnóstico, a oficina com scanner.', pratica: { manual: 1.2 } },
  { id: 'tec_soldagem', nome: 'Técnico em Soldagem', nivel: 'tecnico', area: 'soldagem', meses: 18, publica: 1, privada: 1, ead: false, mensalidade: 470, corte: 0, carga: 'parcial', descricao: 'Processos de solda, inspeção, leitura de projeto: o soldador que coordena.', pratica: { manual: 1.3 } },
  { id: 'tec_agronegocio', nome: 'Técnico em Agronegócio', nivel: 'tecnico', area: 'agro', meses: 18, publica: 0, privada: 1, ead: true, mensalidade: 360, corte: 0, carga: 'parcial', descricao: 'Gestão da propriedade rural, custos, comercialização da safra.', pratica: { campo: 0.8, exatas: 0.3 } },
  { id: 'tec_zootecnia', nome: 'Técnico em Zootecnia', nivel: 'tecnico', area: 'agro', meses: 24, publica: 0, privada: null, ead: false, mensalidade: 0, corte: 0, carga: 'parcial', descricao: 'Criação de gado, aves e peixes: manejo, nutrição, sanidade.', pratica: { campo: 1.1, ciencias: 0.4 } },
  { id: 'tec_cozinha', nome: 'Técnico em Cozinha', nivel: 'tecnico', area: 'gastronomia', meses: 12, publica: 1, privada: 1, ead: false, mensalidade: 520, corte: 0, carga: 'parcial', descricao: 'A cozinha profissional por inteiro: técnicas, cardápio, brigada.', pratica: { cozinha: 1.4 } },
  { id: 'tec_informatica_internet', nome: 'Técnico em Informática para Internet', nivel: 'tecnico', area: 'computacao', meses: 18, publica: 1, privada: 1, ead: true, mensalidade: 420, corte: 0, carga: 'parcial', descricao: 'Sites e sistemas web: HTML, banco de dados, programação para a rede.', pratica: { programacao: 1.3, desenho: 0.2 } },
  { id: 'tec_jogos_digitais', nome: 'Técnico em Programação de Jogos Digitais', nivel: 'tecnico', area: 'computacao', meses: 18, publica: 1, privada: 1, ead: false, mensalidade: 480, corte: 0, carga: 'parcial', descricao: 'Lógica, motores de jogo, arte e som: o jogo do protótipo à loja.', pratica: { programacao: 1.2, desenho: 0.4 } },
  { id: 'tec_recursos_humanos', nome: 'Técnico em Recursos Humanos', nivel: 'tecnico', area: 'administracao', meses: 12, publica: 1, privada: 0, ead: true, mensalidade: 300, corte: 0, carga: 'parcial', descricao: 'Recrutamento, folha, departamento pessoal.', pratica: { lideranca: 0.3 } },
  { id: 'tec_comercio', nome: 'Técnico em Comércio', nivel: 'tecnico', area: 'administracao', meses: 12, publica: 1, privada: 0, ead: true, mensalidade: 290, corte: 0, carga: 'parcial', descricao: 'Vendas, estoque, atendimento: a loja do balcão à gerência.', pratica: { vendas: 0.8 } },
  { id: 'tec_marketing', nome: 'Técnico em Marketing', nivel: 'tecnico', area: 'comunicacao', meses: 12, publica: 1, privada: 0, ead: true, mensalidade: 320, corte: 0, carga: 'parcial', descricao: 'Pesquisa de mercado, redes sociais, campanha de loja.', pratica: { vendas: 0.5, escrita: 0.4 } },
  { id: 'tec_agrimensura', nome: 'Técnico em Agrimensura', nivel: 'tecnico', area: 'edificacoes', meses: 18, publica: 1, privada: 1, ead: false, mensalidade: 440, corte: 0, carga: 'parcial', descricao: 'Topografia, GPS, a medição do terreno antes da obra.', pratica: { exatas: 0.6, campo: 0.3 } },

  // ---------------------------------------------------------- Qualificação (ofício) ligada a vaga do jogo
  { id: 'q_refrigeracao', nome: 'Instalador de ar-condicionado', nivel: 'livre', area: 'eletrica', meses: 4, publica: 1, privada: 0, ead: false, mensalidade: 390, corte: 0, carga: 'parcial', descricao: 'Instalação de split, carga de gás, a primeira manutenção.', pratica: { manual: 1.2 } },
  { id: 'q_solar', nome: 'Instalador de energia solar', nivel: 'livre', area: 'eletrica', meses: 3, publica: 1, privada: 0, ead: false, mensalidade: 420, corte: 0, carga: 'parcial', descricao: 'Montagem de painéis em telhado, ligação do inversor, segurança na altura.', pratica: { manual: 1.2 } },
  { id: 'q_padaria', nome: 'Panificação', nivel: 'livre', area: 'gastronomia', meses: 4, publica: 1, privada: 0, ead: false, mensalidade: 360, corte: 0, carga: 'parcial', descricao: 'Massa, fermentação, forno: o pão de todo dia e o de encomenda.', pratica: { cozinha: 1.3 } }
];

/**
 * O que cada perfil de escola técnica pode oferecer A MAIS (VIDA 12.9): um recorte de 1 ou 2 destes, sorteado à parte do
 * catálogo que a escola já tinha (`ensinoTecnico.instituicoesTecnicas`).
 */
export const EXTRAS_TECNICOS_129: Record<string, string[]> = {
  industrial: ['tec_eletromecanica', 'tec_refrigeracao', 'tec_soldagem', 'tec_manutencao_automotiva'],
  tecnologia: ['tec_informatica_internet', 'tec_jogos_digitais', 'tec_telecomunicacoes'],
  gestao: ['tec_recursos_humanos', 'tec_comercio', 'tec_marketing'],
  saude: [],
  agro: ['tec_agronegocio', 'tec_zootecnia'],
  hotelaria: ['tec_cozinha'],
  criativa: ['tec_jogos_digitais', 'tec_marketing'],
  construcao: ['tec_agrimensura', 'tec_refrigeracao'],
  politecnica: ['tec_energia_renovavel', 'tec_informatica_internet', 'tec_agronegocio', 'tec_eletromecanica']
};
