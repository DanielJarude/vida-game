/**
 * Cursos: duração real, onde existem e como se entra.
 *
 * NÍVEIS — `livre` é a qualificação curta (SENAI, SENAC, cursos de ofício:
 * barbeiro, eletricista, solda), que não muda a escolaridade mas abre
 * ofícios; `tecnico` é o técnico de nível médio (junto com o médio, no
 * instituto federal, ou depois dele); `superior` é a graduação; depois vêm
 * pós, residência, mestrado e doutorado.
 *
 * OFERTA — `publica`/`privada` é o nível mínimo de oferta do município
 * (`nivelDeOferta`: 0 pequena, 1 cidade média, 2 capital, 3 metrópole) em
 * que o curso existe presencialmente. `null` = não existe nessa rede.
 * `ead` = pode ser feito a distância, de qualquer lugar.
 *
 * INGRESSO — rede pública via ENEM/SISU (nota de corte ponderada pelas
 * matérias que o curso pesa; cotas para quem veio de escola pública e família
 * de baixa renda). Rede privada por vestibular próprio, com mensalidade,
 * ProUni (bolsa) ou FIES (financiamento). Técnico e qualificação públicos
 * têm seleção própria. Música e Artes Cênicas têm prova de habilidade.
 */

import type { Dominio, NivelCurso } from '../tipos';

export type AreaFormacao =
  | 'medicina' | 'enfermagem' | 'psicologia' | 'educacao_fisica' | 'nutricao' | 'fisioterapia' | 'odontologia' | 'farmacia' | 'veterinaria' | 'radiologia'
  | 'direito' | 'engenharia_civil' | 'engenharia' | 'arquitetura' | 'eletrotecnica' | 'eletrica' | 'mecanica' | 'automacao' | 'edificacoes' | 'soldagem'
  | 'computacao' | 'exatas' | 'educacao' | 'letras' | 'administracao' | 'contabilidade' | 'economia' | 'logistica' | 'imoveis'
  | 'design' | 'comunicacao' | 'musica_formacao' | 'artes_cenicas' | 'agro' | 'gastronomia' | 'beleza' | 'seguranca_trabalho'
  | 'vigilancia' | 'arbitragem' | 'qualquer';

export const ROTULO_AREA: Record<AreaFormacao, string> = {
  medicina: 'Medicina', enfermagem: 'Enfermagem', psicologia: 'Psicologia', educacao_fisica: 'Educação Física', nutricao: 'Nutrição',
  fisioterapia: 'Fisioterapia', odontologia: 'Odontologia', farmacia: 'Farmácia', veterinaria: 'Medicina Veterinária', radiologia: 'Radiologia',
  direito: 'Direito', engenharia_civil: 'Engenharia Civil', engenharia: 'Engenharia', arquitetura: 'Arquitetura', eletrotecnica: 'Eletrotécnica',
  eletrica: 'instalações elétricas', mecanica: 'Mecânica', automacao: 'Automação', edificacoes: 'Edificações', soldagem: 'Soldagem',
  computacao: 'Computação', exatas: 'Matemática ou Estatística', educacao: 'Educação', letras: 'Letras', administracao: 'Administração',
  contabilidade: 'Contabilidade', economia: 'Economia', logistica: 'Logística', imoveis: 'Transações Imobiliárias', design: 'Design',
  comunicacao: 'Comunicação', musica_formacao: 'Música', artes_cenicas: 'Artes Cênicas', agro: 'Agropecuária', gastronomia: 'Gastronomia',
  beleza: 'beleza', seguranca_trabalho: 'Segurança do Trabalho', vigilancia: 'formação de vigilante', arbitragem: 'arbitragem', qualquer: 'qualquer área'
};

export type Materia = 'exatas' | 'linguagens' | 'ciencias' | 'humanas';

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
  /** Matérias que o curso pesa na nota (SISU ponderado) — e em que o curso exercita. */
  pesos?: Partial<Record<Materia, number>>;
  /** Frentes que o curso exercita enquanto dura (quem faz Design desenha). */
  pratica?: Partial<Record<Dominio, number>>;
  /** Prova de habilidade específica. */
  teste?: { dominio: Dominio; minimo: number };
  /** Existe como médio integrado (instituto federal, escola técnica estadual). */
  integravel?: boolean;
  idadeMin?: number;
}

export const CURSOS: readonly Curso[] = [
  // ------------------------------------------------------ Qualificação (ofício)
  { id: 'q_barbeiro', nome: 'Curso de barbeiro', nivel: 'livre', area: 'beleza', meses: 4, publica: 1, privada: 0, ead: false, mensalidade: 380, corte: 0, carga: 'parcial', descricao: 'Corte, barba, atendimento. Sai com tesoura na mão.', pratica: { beleza: 1.4 } },
  { id: 'q_cabeleireiro', nome: 'Curso de cabeleireiro', nivel: 'livre', area: 'beleza', meses: 6, publica: 1, privada: 0, ead: false, mensalidade: 420, corte: 0, carga: 'parcial', descricao: 'Corte, química e escova. Abre a porta dos salões.', pratica: { beleza: 1.4 } },
  { id: 'q_eletricista', nome: 'Eletricista instalador (NR-10)', nivel: 'livre', area: 'eletrica', meses: 6, publica: 0, privada: 0, ead: false, mensalidade: 360, corte: 0, carga: 'parcial', descricao: 'Instalação residencial e predial com a norma de segurança.', pratica: { manual: 1.3 } },
  { id: 'q_solda', nome: 'Soldagem', nivel: 'livre', area: 'soldagem', meses: 5, publica: 1, privada: 1, ead: false, mensalidade: 450, corte: 0, carga: 'parcial', descricao: 'Solda elétrica e MIG. Muita vaga na indústria e na construção.', pratica: { manual: 1.3 } },
  { id: 'q_mecanica', nome: 'Mecânica de automóveis', nivel: 'livre', area: 'mecanica', meses: 8, publica: 1, privada: 0, ead: false, mensalidade: 400, corte: 0, carga: 'parcial', descricao: 'Motor, suspensão, freio. Oficina de verdade no curso.', pratica: { manual: 1.4 } },
  { id: 'q_cozinha', nome: 'Cozinha profissional', nivel: 'livre', area: 'gastronomia', meses: 6, publica: 1, privada: 0, ead: false, mensalidade: 420, corte: 0, carga: 'parcial', descricao: 'Técnicas de cozinha, higiene, ritmo de restaurante.', pratica: { cozinha: 1.4 } },
  { id: 'q_confeitaria', nome: 'Confeitaria', nivel: 'livre', area: 'gastronomia', meses: 4, publica: 1, privada: 0, ead: false, mensalidade: 380, corte: 0, carga: 'parcial', descricao: 'Bolos, doces, encomendas. Muita gente começa em casa.', pratica: { cozinha: 1.3 } },
  { id: 'q_empilhadeira', nome: 'Operador de empilhadeira', nivel: 'livre', area: 'logistica', meses: 3, publica: 1, privada: 0, ead: false, mensalidade: 350, corte: 0, carga: 'parcial', descricao: 'Capacitação exigida pela NR-11.' },
  { id: 'q_vigilante', nome: 'Formação de vigilante', nivel: 'livre', area: 'vigilancia', meses: 3, publica: null, privada: 0, ead: false, mensalidade: 550, corte: 0, carga: 'parcial', descricao: 'Curso obrigatório por lei para trabalhar em segurança privada.', idadeMin: 21 },
  { id: 'q_arbitragem', nome: 'Curso de arbitragem', nivel: 'livre', area: 'arbitragem', meses: 8, publica: null, privada: 1, ead: false, mensalidade: 250, corte: 0, carga: 'parcial', descricao: 'Regras, preparo físico e os primeiros jogos amadores.' },

  // ------------------------------------------------------------- Técnicos
  { id: 'tec_informatica', nome: 'Técnico em Informática', nivel: 'tecnico', area: 'computacao', meses: 18, publica: 0, privada: 1, ead: true, mensalidade: 420, corte: 0, carga: 'parcial', descricao: 'Programação básica, redes e manutenção.', pratica: { programacao: 1.2, exatas: 0.4 }, integravel: true },
  { id: 'tec_enfermagem', nome: 'Técnico em Enfermagem', nivel: 'tecnico', area: 'enfermagem', meses: 24, publica: 1, privada: 0, ead: false, mensalidade: 480, corte: 0, carga: 'parcial', descricao: 'Estágio em hospital incluso. Abre a porta da saúde.', pratica: { ciencias: 0.6 } },
  { id: 'tec_eletrotecnica', nome: 'Técnico em Eletrotécnica', nivel: 'tecnico', area: 'eletrotecnica', meses: 24, publica: 0, privada: 1, ead: false, mensalidade: 450, corte: 0, carga: 'parcial', descricao: 'Instalações elétricas, manutenção industrial.', pratica: { manual: 1, exatas: 0.5 }, integravel: true },
  { id: 'tec_administracao', nome: 'Técnico em Administração', nivel: 'tecnico', area: 'administracao', meses: 18, publica: 0, privada: 0, ead: true, mensalidade: 320, corte: 0, carga: 'parcial', descricao: 'Rotinas de escritório, finanças e pessoal.', integravel: true },
  { id: 'tec_mecanica', nome: 'Técnico em Mecânica', nivel: 'tecnico', area: 'mecanica', meses: 24, publica: 1, privada: 1, ead: false, mensalidade: 450, corte: 0, carga: 'parcial', descricao: 'Manutenção de máquinas e motores.', pratica: { manual: 1, exatas: 0.4 }, integravel: true },
  { id: 'tec_agropecuaria', nome: 'Técnico em Agropecuária', nivel: 'tecnico', area: 'agro', meses: 24, publica: 0, privada: null, ead: false, mensalidade: 0, corte: 0, carga: 'parcial', descricao: 'Produção rural, manejo e máquinas.', pratica: { campo: 1.2, ciencias: 0.4 }, integravel: true },
  { id: 'tec_seguranca', nome: 'Técnico em Segurança do Trabalho', nivel: 'tecnico', area: 'seguranca_trabalho', meses: 18, publica: 1, privada: 0, ead: true, mensalidade: 380, corte: 0, carga: 'parcial', descricao: 'Prevenção de acidentes em obras e fábricas.' },
  { id: 'tec_logistica', nome: 'Técnico em Logística', nivel: 'tecnico', area: 'logistica', meses: 18, publica: 1, privada: 0, ead: true, mensalidade: 340, corte: 0, carga: 'parcial', descricao: 'Estoque, transporte, distribuição. O comércio online vive disso.' },
  { id: 'tec_edificacoes', nome: 'Técnico em Edificações', nivel: 'tecnico', area: 'edificacoes', meses: 24, publica: 1, privada: 1, ead: false, mensalidade: 430, corte: 0, carga: 'parcial', descricao: 'Desenho de obra, orçamento, canteiro.', pratica: { exatas: 0.5, desenho: 0.4 }, integravel: true },
  { id: 'tec_automacao', nome: 'Técnico em Automação Industrial', nivel: 'tecnico', area: 'automacao', meses: 24, publica: 1, privada: 1, ead: false, mensalidade: 520, corte: 0, carga: 'parcial', descricao: 'Robôs, sensores, linhas de produção.', pratica: { manual: 0.8, exatas: 0.6, programacao: 0.4 } },
  { id: 'tec_radiologia', nome: 'Técnico em Radiologia', nivel: 'tecnico', area: 'radiologia', meses: 24, publica: 2, privada: 1, ead: false, mensalidade: 560, corte: 0, carga: 'parcial', descricao: 'Raio-X, tomografia. Jornada reduzida por lei.', pratica: { ciencias: 0.5 } },
  { id: 'tec_imoveis', nome: 'Técnico em Transações Imobiliárias', nivel: 'tecnico', area: 'imoveis', meses: 12, publica: null, privada: 0, ead: true, mensalidade: 290, corte: 0, carga: 'parcial', descricao: 'O curso que dá direito ao CRECI.', pratica: { vendas: 0.6 } },
  { id: 'tecn_gastronomia', nome: 'Gastronomia (tecnólogo)', nivel: 'tecnico', area: 'gastronomia', meses: 24, publica: 2, privada: 1, ead: false, mensalidade: 900, corte: 600, carga: 'parcial', descricao: 'Cozinha profissional e gestão de restaurante.', pratica: { cozinha: 1.3 } },

  // ---------------------------------------------------------- Graduações
  { id: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', meses: 72, publica: 2, privada: 1, ead: false, mensalidade: 9500, corte: 790, carga: 'integral', descricao: 'Seis anos em tempo integral, internato no fim.', pesos: { ciencias: 2, linguagens: 1 }, pratica: { ciencias: 1 } },
  { id: 'enfermagem', nome: 'Enfermagem', nivel: 'superior', area: 'enfermagem', meses: 60, publica: 1, privada: 0, ead: false, mensalidade: 1250, corte: 660, carga: 'integral', descricao: 'Bacharelado com estágio hospitalar.', pesos: { ciencias: 2 }, pratica: { ciencias: 0.7 } },
  { id: 'fisioterapia', nome: 'Fisioterapia', nivel: 'superior', area: 'fisioterapia', meses: 60, publica: 1, privada: 0, ead: false, mensalidade: 1350, corte: 670, carga: 'integral', descricao: 'Reabilitação, clínica, esporte.', pesos: { ciencias: 2 }, pratica: { ciencias: 0.7 } },
  { id: 'odontologia', nome: 'Odontologia', nivel: 'superior', area: 'odontologia', meses: 60, publica: 2, privada: 1, ead: false, mensalidade: 2600, corte: 730, carga: 'integral', descricao: 'Clínica desde cedo; material caro.', pesos: { ciencias: 2 }, pratica: { ciencias: 0.7, manual: 0.4 } },
  { id: 'farmacia', nome: 'Farmácia', nivel: 'superior', area: 'farmacia', meses: 60, publica: 1, privada: 0, ead: false, mensalidade: 1200, corte: 650, carga: 'integral', descricao: 'Medicamentos, análises clínicas, indústria.', pesos: { ciencias: 2, exatas: 1 }, pratica: { ciencias: 0.8 } },
  { id: 'veterinaria', nome: 'Medicina Veterinária', nivel: 'superior', area: 'veterinaria', meses: 60, publica: 1, privada: 1, ead: false, mensalidade: 1900, corte: 710, carga: 'integral', descricao: 'Bicho grande e bicho pequeno, clínica e campo.', pesos: { ciencias: 2 }, pratica: { ciencias: 0.8, campo: 0.4 } },
  { id: 'psicologia', nome: 'Psicologia', nivel: 'superior', area: 'psicologia', meses: 60, publica: 2, privada: 1, ead: false, mensalidade: 1450, corte: 700, carga: 'parcial', descricao: 'Clínica, escola, organizações.', pesos: { humanas: 1.5, linguagens: 1 }, pratica: { humanas: 0.6 } },
  { id: 'direito', nome: 'Direito', nivel: 'superior', area: 'direito', meses: 60, publica: 1, privada: 0, ead: false, mensalidade: 1150, corte: 700, carga: 'parcial', descricao: 'Cinco anos e o Exame da OAB no fim.', pesos: { linguagens: 2, humanas: 1.5 }, pratica: { linguagens: 0.8, humanas: 0.6 } },
  { id: 'eng_civil', nome: 'Engenharia Civil', nivel: 'superior', area: 'engenharia_civil', meses: 60, publica: 1, privada: 1, ead: false, mensalidade: 1550, corte: 690, carga: 'integral', descricao: 'Cálculo, estruturas, obras.', pesos: { exatas: 2.5 }, pratica: { exatas: 1 } },
  { id: 'eng_producao', nome: 'Engenharia de Produção', nivel: 'superior', area: 'engenharia', meses: 60, publica: 1, privada: 1, ead: false, mensalidade: 1450, corte: 680, carga: 'integral', descricao: 'Fábrica, processos, custos.', pesos: { exatas: 2.5 }, pratica: { exatas: 1 } },
  { id: 'eng_mecanica', nome: 'Engenharia Mecânica', nivel: 'superior', area: 'engenharia', meses: 60, publica: 1, privada: 2, ead: false, mensalidade: 1600, corte: 700, carga: 'integral', descricao: 'Máquinas, energia, projeto.', pesos: { exatas: 2.5 }, pratica: { exatas: 1, manual: 0.3 } },
  { id: 'arquitetura', nome: 'Arquitetura e Urbanismo', nivel: 'superior', area: 'arquitetura', meses: 60, publica: 2, privada: 1, ead: false, mensalidade: 1700, corte: 700, carga: 'integral', descricao: 'Projeto, desenho, cidade.', pesos: { exatas: 1.5, humanas: 1 }, pratica: { desenho: 0.9, exatas: 0.5 } },
  { id: 'computacao', nome: 'Ciência da Computação', nivel: 'superior', area: 'computacao', meses: 48, publica: 1, privada: 1, ead: false, mensalidade: 1200, corte: 700, carga: 'integral', descricao: 'Algoritmos, sistemas, software.', pesos: { exatas: 2.5 }, pratica: { programacao: 1.3, exatas: 0.8 } },
  { id: 'ads', nome: 'Análise e Desenvolvimento de Sistemas', nivel: 'superior', area: 'computacao', meses: 30, publica: 1, privada: 0, ead: true, mensalidade: 650, corte: 610, carga: 'parcial', descricao: 'Tecnólogo curto e prático em desenvolvimento.', pesos: { exatas: 1.5 }, pratica: { programacao: 1.1 } },
  { id: 'estatistica', nome: 'Matemática ou Estatística (bacharelado)', nivel: 'superior', area: 'exatas', meses: 48, publica: 1, privada: null, ead: false, mensalidade: 0, corte: 640, carga: 'integral', descricao: 'Pouca gente, muito cálculo, porta para dados e pesquisa.', pesos: { exatas: 3 }, pratica: { exatas: 1.3, programacao: 0.4 } },
  { id: 'administracao', nome: 'Administração', nivel: 'superior', area: 'administracao', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 850, corte: 640, carga: 'parcial', descricao: 'Gestão, finanças, pessoas.', pesos: { linguagens: 1, exatas: 1, humanas: 1 }, pratica: { lideranca: 0.4 } },
  { id: 'contabeis', nome: 'Ciências Contábeis', nivel: 'superior', area: 'contabilidade', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 800, corte: 620, carga: 'parcial', descricao: 'Contabilidade, tributos, auditoria.', pesos: { exatas: 1.5 }, pratica: { exatas: 0.6 } },
  { id: 'economia', nome: 'Ciências Econômicas', nivel: 'superior', area: 'economia', meses: 48, publica: 2, privada: 2, ead: false, mensalidade: 1300, corte: 680, carga: 'parcial', descricao: 'Mercado, políticas públicas, finanças.', pesos: { exatas: 2, humanas: 1 }, pratica: { exatas: 0.8, humanas: 0.4 } },
  { id: 'pedagogia', nome: 'Pedagogia', nivel: 'superior', area: 'educacao', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 650, corte: 590, carga: 'parcial', descricao: 'Educação infantil e anos iniciais.', pesos: { linguagens: 1.5, humanas: 1 } },
  { id: 'licenciatura', nome: 'Licenciatura (Letras, Matemática, História...)', nivel: 'superior', area: 'educacao', meses: 48, publica: 1, privada: 0, ead: true, mensalidade: 600, corte: 580, carga: 'parcial', descricao: 'Formação de professores do fundamental II e médio.', pesos: { linguagens: 1, humanas: 1 }, pratica: { linguagens: 0.4, humanas: 0.4 } },
  { id: 'letras', nome: 'Letras (bacharelado)', nivel: 'superior', area: 'letras', meses: 48, publica: 1, privada: 1, ead: false, mensalidade: 700, corte: 600, carga: 'parcial', descricao: 'Língua, literatura, tradução, revisão.', pesos: { linguagens: 2.5 }, pratica: { escrita: 1, linguagens: 0.8, idiomas: 0.5 } },
  { id: 'jornalismo', nome: 'Jornalismo', nivel: 'superior', area: 'comunicacao', meses: 48, publica: 1, privada: 1, ead: false, mensalidade: 1150, corte: 650, carga: 'parcial', descricao: 'Apuração, texto, redação, vídeo.', pesos: { linguagens: 2, humanas: 1.5 }, pratica: { escrita: 1, fotografia: 0.3 } },
  { id: 'publicidade', nome: 'Publicidade e Propaganda', nivel: 'superior', area: 'comunicacao', meses: 48, publica: 2, privada: 1, ead: false, mensalidade: 1250, corte: 640, carga: 'parcial', descricao: 'Criação, redação publicitária, marcas.', pesos: { linguagens: 2 }, pratica: { escrita: 0.7, desenho: 0.5, fotografia: 0.4 } },
  { id: 'design', nome: 'Design', nivel: 'superior', area: 'design', meses: 48, publica: 2, privada: 1, ead: false, mensalidade: 1100, corte: 660, carga: 'parcial', descricao: 'Gráfico, produto, digital.', pesos: { linguagens: 1, humanas: 1 }, pratica: { desenho: 1.2 } },
  { id: 'musica_grad', nome: 'Música (bacharelado)', nivel: 'superior', area: 'musica_formacao', meses: 48, publica: 2, privada: 2, ead: false, mensalidade: 1100, corte: 560, carga: 'parcial', descricao: 'Instrumento, teoria, prática de conjunto. Tem prova de habilidade.', pesos: { linguagens: 1 }, pratica: { musica: 1.5 }, teste: { dominio: 'musica', minimo: 52 } },
  { id: 'artes_cenicas', nome: 'Artes Cênicas', nivel: 'superior', area: 'artes_cenicas', meses: 48, publica: 2, privada: 3, ead: false, mensalidade: 1200, corte: 580, carga: 'parcial', descricao: 'Interpretação, corpo, voz. Tem prova de habilidade.', pesos: { linguagens: 1.5 }, pratica: { teatro: 1.5 }, teste: { dominio: 'teatro', minimo: 45 } },
  { id: 'ed_fisica', nome: 'Educação Física', nivel: 'superior', area: 'educacao_fisica', meses: 48, publica: 1, privada: 0, ead: false, mensalidade: 900, corte: 610, carga: 'parcial', descricao: 'Treino, escola, saúde.', pesos: { ciencias: 1 } },
  { id: 'nutricao', nome: 'Nutrição', nivel: 'superior', area: 'nutricao', meses: 48, publica: 2, privada: 1, ead: false, mensalidade: 1100, corte: 650, carga: 'parcial', descricao: 'Alimentação clínica e esportiva.', pesos: { ciencias: 2 }, pratica: { ciencias: 0.6, cozinha: 0.3 } },
  { id: 'agronomia', nome: 'Agronomia', nivel: 'superior', area: 'agro', meses: 60, publica: 0, privada: 1, ead: false, mensalidade: 1400, corte: 650, carga: 'integral', descricao: 'Produção agrícola e tecnologia do campo.', pesos: { ciencias: 2, exatas: 1 }, pratica: { campo: 0.8, ciencias: 0.7 } },

  // ------------------------------------------------------ Pós-graduação
  { id: 'mba', nome: 'MBA em Gestão', nivel: 'pos', area: 'qualquer', meses: 18, publica: null, privada: 1, ead: true, mensalidade: 750, corte: 0, carga: 'parcial', descricao: 'Especialização de fim de semana para quem já trabalha.', pratica: { lideranca: 0.5 } },
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
const POR_NOME = new Map(CURSOS.map(c => [c.nome, c]));
/** Curso pelo nome (as pessoas da família guardam o nome do curso que fizeram). */
export const cursoPorNome = (nome?: string) => (nome ? POR_NOME.get(nome) : undefined);

/** Ordem dos níveis de formação (qualificação < técnico < graduação < pós...). */
export const ORDEM_NIVEL: Record<NivelCurso, number> = { livre: 0.5, tecnico: 1, superior: 2, pos: 3, residencia: 3, mestrado: 4, doutorado: 5 };
