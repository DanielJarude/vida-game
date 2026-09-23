/**
 * Cursos: duração real, onde existem e como se entra.
 *
 * OFERTA — `publica`/`privada` é o nível mínimo de oferta do município
 * (`nivelDeOferta`: 0 pequena, 1 cidade média, 2 capital, 3 metrópole) em
 * que o curso existe presencialmente. `null` = não existe nessa rede.
 * `ead` = pode ser feito a distância, de qualquer lugar.
 *
 * INGRESSO — rede pública via ENEM/SISU (nota de corte; cotas para quem veio
 * de escola pública e família de baixa renda). Rede privada por vestibular
 * próprio, com mensalidade, ProUni (bolsa) ou FIES (financiamento).
 */

import type { NivelCurso } from '../tipos';

export type AreaFormacao =
  | 'medicina' | 'enfermagem' | 'psicologia' | 'educacao_fisica' | 'nutricao'
  | 'direito' | 'engenharia_civil' | 'arquitetura' | 'eletrotecnica' | 'mecanica'
  | 'computacao' | 'educacao' | 'administracao' | 'contabilidade' | 'economia'
  | 'design' | 'agro' | 'gastronomia' | 'seguranca_trabalho' | 'qualquer';

export const ROTULO_AREA: Record<AreaFormacao, string> = {
  medicina: 'Medicina', enfermagem: 'Enfermagem', psicologia: 'Psicologia', educacao_fisica: 'Educação Física',
  nutricao: 'Nutrição', direito: 'Direito', engenharia_civil: 'Engenharia Civil', arquitetura: 'Arquitetura',
  eletrotecnica: 'Eletrotécnica', mecanica: 'Mecânica', computacao: 'Computação', educacao: 'Educação',
  administracao: 'Administração', contabilidade: 'Contabilidade', economia: 'Economia', design: 'Design',
  agro: 'Agropecuária', gastronomia: 'Gastronomia', seguranca_trabalho: 'Segurança do Trabalho', qualquer: 'qualquer área'
};

export interface Curso {
  id: string;
  nome: string;
  nivel: NivelCurso;
  area: AreaFormacao;
  meses: number;
  publica: 0 | 1 | 2 | 3 | null;
  privada: 0 | 1 | 2 | 3 | null;
  ead: boolean;
  /** Mensalidade de referência na rede privada presencial (EAD custa ~30%). */
  mensalidade: number;
  /** Nota de corte de referência no SISU (ampla concorrência). */
  corte: number;
  /** Exige formação anterior nesta área (pós/residência). */
  requerArea?: AreaFormacao;
  /** Bolsa mensal paga ao estudante (residência, mestrado, doutorado). */
  bolsa?: number;
  /** Carga do curso: integral ocupa o dia inteiro. */
  carga: 'integral' | 'parcial';
  descricao: string;
}

export const CURSOS: readonly Curso[] = [
  // ------------------------------------------------------------- Técnicos
  { id: 'tec_informatica', nome: 'Técnico em Informática', nivel: 'tecnico', area: 'computacao', meses: 18, publica: 0, privada: 1, ead: true, mensalidade: 420, corte: 0, carga: 'parcial', descricao: 'Programação básica, redes e manutenção.' },
  { id: 'tec_enfermagem', nome: 'Técnico em Enfermagem', nivel: 'tecnico', area: 'enfermagem', meses: 24, publica: 1, privada: 0, ead: false, mensalidade: 480, corte: 0, carga: 'parcial', descricao: 'Estágio em hospital incluso. Abre a porta da saúde.' },
  { id: 'tec_eletrotecnica', nome: 'Técnico em Eletrotécnica', nivel: 'tecnico', area: 'eletrotecnica', meses: 24, publica: 0, privada: 1, ead: false, mensalidade: 450, corte: 0, carga: 'parcial', descricao: 'Instalações elétricas, manutenção industrial.' },
  { id: 'tec_administracao', nome: 'Técnico em Administração', nivel: 'tecnico', area: 'administracao', meses: 18, publica: 0, privada: 0, ead: true, mensalidade: 320, corte: 0, carga: 'parcial', descricao: 'Rotinas de escritório, finanças e pessoal.' },
  { id: 'tec_mecanica', nome: 'Técnico em Mecânica', nivel: 'tecnico', area: 'mecanica', meses: 24, publica: 1, privada: 1, ead: false, mensalidade: 450, corte: 0, carga: 'parcial', descricao: 'Manutenção de máquinas e motores.' },
  { id: 'tec_agropecuaria', nome: 'Técnico em Agropecuária', nivel: 'tecnico', area: 'agro', meses: 24, publica: 0, privada: null, ead: false, mensalidade: 0, corte: 0, carga: 'parcial', descricao: 'Produção rural, manejo e máquinas.' },
  { id: 'tec_seguranca', nome: 'Técnico em Segurança do Trabalho', nivel: 'tecnico', area: 'seguranca_trabalho', meses: 18, publica: 1, privada: 0, ead: true, mensalidade: 380, corte: 0, carga: 'parcial', descricao: 'Prevenção de acidentes em obras e fábricas.' },
  { id: 'tecn_gastronomia', nome: 'Gastronomia (tecnólogo)', nivel: 'tecnico', area: 'gastronomia', meses: 24, publica: 2, privada: 1, ead: false, mensalidade: 900, corte: 600, carga: 'parcial', descricao: 'Cozinha profissional e gestão de restaurante.' },

  // ---------------------------------------------------------- Graduações
  { id: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', meses: 72, publica: 2, privada: 1, ead: false, mensalidade: 9500, corte: 790, carga: 'integral', descricao: 'Seis anos em tempo integral, internato no fim.' },
  { id: 'enfermagem', nome: 'Enfermagem', nivel: 'superior', area: 'enfermagem', meses: 60, publica: 1, privada: 0, ead: false, mensalidade: 1250, corte: 660, carga: 'integral', descricao: 'Bacharelado com estágio hospitalar.' },
  { id: 'psicologia', nome: 'Psicologia', nivel: 'superior', area: 'psicologia', meses: 60, publica: 2, privada: 1, ead: false, mensalidade: 1450, corte: 700, carga: 'parcial', descricao: 'Clínica, escola, organizações.' },
  { id: 'direito', nome: 'Direito', nivel: 'superior', area: 'direito', meses: 60, publica: 1, privada: 0, ead: false, mensalidade: 1150, corte: 700, carga: 'parcial', descricao: 'Cinco anos e o Exame da OAB no fim.' },
  { id: 'eng_civil', nome: 'Engenharia Civil', nivel: 'superior', area: 'engenharia_civil', meses: 60, publica: 1, privada: 1, ead: false, mensalidade: 1550, corte: 690, carga: 'integral', descricao: 'Cálculo, estruturas, obras.' },
  { id: 'arquitetura', nome: 'Arquitetura e Urbanismo', nivel: 'superior', area: 'arquitetura', meses: 60, publica: 2, privada: 1, ead: false, mensalidade: 1700, corte: 700, carga: 'integral', descricao: 'Projeto, desenho, cidade.' },
  { id: 'computacao', nome: 'Ciência da Computação', nivel: 'superior', area: 'computacao', meses: 48, publica: 1, privada: 1, ead: false, mensalidade: 1200, corte: 700, carga: 'integral', descricao: 'Algoritmos, sistemas, software.' },
  { id: 'ads', nome: 'Análise e Desenvolvimento de Sistemas', nivel: 'superior', area: 'computacao', meses: 30, publica: 1, privada: 0, ead: true, mensalidade: 650, corte: 610, carga: 'parcial', descricao: 'Tecnólogo curto e prático em desenvolvimento.' },
  { id: 'administracao', nome: 'Administração', nivel: 'superior', area: 'administracao', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 850, corte: 640, carga: 'parcial', descricao: 'Gestão, finanças, pessoas.' },
  { id: 'contabeis', nome: 'Ciências Contábeis', nivel: 'superior', area: 'contabilidade', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 800, corte: 620, carga: 'parcial', descricao: 'Contabilidade, tributos, auditoria.' },
  { id: 'economia', nome: 'Ciências Econômicas', nivel: 'superior', area: 'economia', meses: 48, publica: 2, privada: 2, ead: false, mensalidade: 1300, corte: 680, carga: 'parcial', descricao: 'Mercado, políticas públicas, finanças.' },
  { id: 'pedagogia', nome: 'Pedagogia', nivel: 'superior', area: 'educacao', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 650, corte: 590, carga: 'parcial', descricao: 'Educação infantil e anos iniciais.' },
  { id: 'licenciatura', nome: 'Licenciatura (Letras, Matemática, História...)', nivel: 'superior', area: 'educacao', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 600, corte: 580, carga: 'parcial', descricao: 'Formação de professores do fundamental II e médio.' },
  { id: 'ed_fisica', nome: 'Educação Física', nivel: 'superior', area: 'educacao_fisica', meses: 48, publica: 1, privada: 0, ead: false, mensalidade: 900, corte: 610, carga: 'parcial', descricao: 'Treino, escola, saúde.' },
  { id: 'nutricao', nome: 'Nutrição', nivel: 'superior', area: 'nutricao', meses: 48, publica: 2, privada: 1, ead: false, mensalidade: 1100, corte: 650, carga: 'parcial', descricao: 'Alimentação clínica e esportiva.' },
  { id: 'design', nome: 'Design', nivel: 'superior', area: 'design', meses: 48, publica: 2, privada: 1, ead: false, mensalidade: 1100, corte: 660, carga: 'parcial', descricao: 'Gráfico, produto, digital.' },
  { id: 'agronomia', nome: 'Agronomia', nivel: 'superior', area: 'agro', meses: 60, publica: 0, privada: 1, ead: false, mensalidade: 1400, corte: 650, carga: 'integral', descricao: 'Produção agrícola e tecnologia do campo.' },

  // ------------------------------------------------------ Pós-graduação
  { id: 'mba', nome: 'MBA em Gestão', nivel: 'pos', area: 'qualquer', meses: 18, publica: null, privada: 1, ead: true, mensalidade: 750, corte: 0, carga: 'parcial', descricao: 'Especialização de fim de semana para quem já trabalha.' },
  { id: 'esp_educacao', nome: 'Especialização em Educação', nivel: 'pos', area: 'educacao', meses: 18, publica: null, privada: 0, ead: true, mensalidade: 280, corte: 0, requerArea: 'educacao', carga: 'parcial', descricao: 'Soma pontos na carreira docente.' },
  { id: 'residencia', nome: 'Residência Médica', nivel: 'residencia', area: 'medicina', meses: 36, publica: 2, privada: null, ead: false, mensalidade: 0, corte: 0, requerArea: 'medicina', bolsa: 4100, carga: 'integral', descricao: 'Três anos de plantão e especialização, com bolsa.' },
  { id: 'mestrado', nome: 'Mestrado', nivel: 'mestrado', area: 'qualquer', meses: 24, publica: 1, privada: null, ead: false, mensalidade: 0, corte: 0, bolsa: 2100, carga: 'integral', descricao: 'Pesquisa, com bolsa quando há vaga.' },
  { id: 'doutorado', nome: 'Doutorado', nivel: 'doutorado', area: 'qualquer', meses: 48, publica: 2, privada: null, ead: false, mensalidade: 0, corte: 0, bolsa: 3100, carga: 'integral', descricao: 'Quatro anos de pesquisa. Porta da carreira acadêmica.' }
];

const POR_ID = new Map(CURSOS.map(c => [c.id, c]));
export function curso(id: string): Curso {
  const c = POR_ID.get(id);
  if (!c) throw new Error(`Curso desconhecido: ${id}`);
  return c;
}
export const cursoOuNulo = (id: string) => POR_ID.get(id);
