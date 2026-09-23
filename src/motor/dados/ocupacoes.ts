/**
 * Ocupações organizadas em TRILHAS com NÍVEIS.
 *
 *   0 aprendiz/estágio · 1 entrada · 2 intermediário · 3 profissional
 *   4 sênior · 5 liderança
 *
 * Experiência conta por trilha: dez anos de balcão não fazem ninguém
 * engenheiro, e diploma de Pedagogia não faz ninguém médico. Requisitos
 * legais (CRM, OAB, CREA, COREN, CRP) vêm da Fase 1 e têm fundamento na lei.
 *
 * Salários: bruto mensal de referência no Brasil; o município multiplica
 * (`economiaLocal(...).salario`).
 */

import type { Contrato, Escolaridade, NivelCurso } from '../tipos';
import type { AreaFormacao } from './cursos';

export interface Ocupacao {
  id: string;
  nome: [string, string];      // [masculino, feminino]
  trilha: string;
  nivel: 0 | 1 | 2 | 3 | 4 | 5;
  salario: number;
  contrato: Contrato;
  carga: 'integral' | 'parcial';
  idadeMin: number;
  idadeMax?: number;
  escolaridade?: Escolaridade;
  /** Formação exigida (qualquer uma das áreas) e nível mínimo dela. */
  area?: AreaFormacao[];
  nivelCurso?: NivelCurso;
  licenca?: 'crm' | 'oab' | 'crea' | 'coren' | 'crp' | 'cnh';
  /** Meses mínimos de experiência na mesma trilha. */
  experiencia?: number;
  /** Exige estar matriculado (estágio, aprendiz). */
  matriculado?: 'basica' | 'superior' | 'qualquer';
  /** Precisa de veículo próprio. */
  veiculo?: 'carro' | 'moto_ou_bike' | 'carro_ou_moto';
  /** Ingresso por concurso público. */
  concurso?: boolean;
  /** Oferta mínima do município (0 pequena .. 3 metrópole). */
  oferta: 0 | 1 | 2 | 3;
  estresse: 1 | 2 | 3 | 4 | 5;
  /** Fundamento legal do requisito, quando houver. */
  fundamento?: string;
}

type O = Ocupacao;
const o = (x: O) => x;

export const OCUPACOES: readonly Ocupacao[] = [
  // ---------------------------------------------------------- Informal
  o({ id: 'ambulante', nome: ['vendedor ambulante', 'vendedora ambulante'], trilha: 'informal', nivel: 1, salario: 1300, contrato: 'informal', carga: 'parcial', idadeMin: 16, oferta: 0, estresse: 3 }),
  o({ id: 'diarista', nome: ['diarista', 'diarista'], trilha: 'cuidado', nivel: 1, salario: 2000, contrato: 'autonomo', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3 }),
  o({ id: 'entregador_app', nome: ['entregador de aplicativo', 'entregadora de aplicativo'], trilha: 'transporte', nivel: 1, salario: 2100, contrato: 'autonomo', carga: 'integral', idadeMin: 18, veiculo: 'moto_ou_bike', oferta: 1, estresse: 3 }),
  o({ id: 'motorista_app', nome: ['motorista de aplicativo', 'motorista de aplicativo'], trilha: 'transporte', nivel: 1, salario: 3300, contrato: 'autonomo', carga: 'integral', idadeMin: 21, licenca: 'cnh', veiculo: 'carro', oferta: 1, estresse: 3 }),
  o({ id: 'manicure', nome: ['manicure', 'manicure'], trilha: 'beleza', nivel: 1, salario: 1800, contrato: 'autonomo', carga: 'integral', idadeMin: 16, oferta: 0, estresse: 2 }),
  o({ id: 'cabeleireiro', nome: ['cabeleireiro', 'cabeleireira'], trilha: 'beleza', nivel: 2, salario: 2900, contrato: 'autonomo', carga: 'integral', idadeMin: 18, experiencia: 12, oferta: 0, estresse: 2 }),
  o({ id: 'dono_salao', nome: ['dono de salão', 'dona de salão'], trilha: 'beleza', nivel: 4, salario: 5200, contrato: 'autonomo', carga: 'integral', idadeMin: 23, experiencia: 60, oferta: 0, estresse: 4 }),

  // ---------------------------------------------------------- Comércio
  o({ id: 'atendente', nome: ['atendente de loja', 'atendente de loja'], trilha: 'comercio', nivel: 1, salario: 1700, contrato: 'clt', carga: 'integral', idadeMin: 16, escolaridade: 'fundamental', oferta: 0, estresse: 2 }),
  o({ id: 'caixa', nome: ['operador de caixa', 'operadora de caixa'], trilha: 'comercio', nivel: 1, salario: 1650, contrato: 'clt', carga: 'integral', idadeMin: 16, escolaridade: 'fundamental', oferta: 0, estresse: 2 }),
  o({ id: 'vendedor', nome: ['vendedor', 'vendedora'], trilha: 'comercio', nivel: 2, salario: 2500, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', experiencia: 12, oferta: 0, estresse: 3 }),
  o({ id: 'supervisor_loja', nome: ['supervisor de loja', 'supervisora de loja'], trilha: 'comercio', nivel: 3, salario: 3500, contrato: 'clt', carga: 'integral', idadeMin: 21, escolaridade: 'medio', experiencia: 36, oferta: 0, estresse: 3 }),
  o({ id: 'gerente_loja', nome: ['gerente de loja', 'gerente de loja'], trilha: 'comercio', nivel: 4, salario: 5400, contrato: 'clt', carga: 'integral', idadeMin: 24, escolaridade: 'medio', experiencia: 72, oferta: 0, estresse: 4 }),

  // ------------------------------------------------------- Alimentação
  o({ id: 'aux_cozinha', nome: ['auxiliar de cozinha', 'auxiliar de cozinha'], trilha: 'alimentacao', nivel: 1, salario: 1700, contrato: 'clt', carga: 'integral', idadeMin: 16, oferta: 0, estresse: 3 }),
  o({ id: 'garcom', nome: ['garçom', 'garçonete'], trilha: 'alimentacao', nivel: 1, salario: 1900, contrato: 'clt', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3 }),
  o({ id: 'cozinheiro', nome: ['cozinheiro', 'cozinheira'], trilha: 'alimentacao', nivel: 2, salario: 2500, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 24, oferta: 0, estresse: 3 }),
  o({ id: 'chef', nome: ['chef de cozinha', 'chef de cozinha'], trilha: 'alimentacao', nivel: 4, salario: 5800, contrato: 'clt', carga: 'integral', idadeMin: 23, experiencia: 60, area: ['gastronomia'], nivelCurso: 'tecnico', oferta: 1, estresse: 4 }),

  // ---------------------------------------------------- Administrativo
  o({ id: 'jovem_aprendiz', nome: ['jovem aprendiz', 'jovem aprendiz'], trilha: 'administrativo', nivel: 0, salario: 950, contrato: 'aprendiz', carga: 'parcial', idadeMin: 14, idadeMax: 24, matriculado: 'basica', oferta: 0, estresse: 1, fundamento: 'Lei da Aprendizagem (10.097/2000): 14 a 24 anos, contrato de até 2 anos, com escola.' }),
  o({ id: 'recepcionista', nome: ['recepcionista', 'recepcionista'], trilha: 'administrativo', nivel: 1, salario: 1850, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', oferta: 0, estresse: 2 }),
  o({ id: 'aux_adm', nome: ['auxiliar administrativo', 'auxiliar administrativa'], trilha: 'administrativo', nivel: 1, salario: 2100, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', oferta: 0, estresse: 2 }),
  o({ id: 'assistente_adm', nome: ['assistente administrativo', 'assistente administrativa'], trilha: 'administrativo', nivel: 2, salario: 2900, contrato: 'clt', carga: 'integral', idadeMin: 19, escolaridade: 'medio', experiencia: 24, oferta: 0, estresse: 2 }),
  o({ id: 'analista_adm', nome: ['analista administrativo', 'analista administrativa'], trilha: 'administrativo', nivel: 3, salario: 4400, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['administracao', 'contabilidade', 'economia'], nivelCurso: 'superior', experiencia: 12, oferta: 1, estresse: 3 }),
  o({ id: 'coordenador_adm', nome: ['coordenador administrativo', 'coordenadora administrativa'], trilha: 'administrativo', nivel: 4, salario: 7200, contrato: 'clt', carga: 'integral', idadeMin: 26, escolaridade: 'superior', experiencia: 72, oferta: 1, estresse: 4 }),
  o({ id: 'gerente_adm', nome: ['gerente', 'gerente'], trilha: 'administrativo', nivel: 5, salario: 12500, contrato: 'clt', carga: 'integral', idadeMin: 30, escolaridade: 'superior', experiencia: 120, oferta: 2, estresse: 5 }),
  o({ id: 'contador', nome: ['contador', 'contadora'], trilha: 'administrativo', nivel: 3, salario: 5200, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['contabilidade'], nivelCurso: 'superior', oferta: 0, estresse: 3 }),
  o({ id: 'estagio_adm', nome: ['estagiário administrativo', 'estagiária administrativa'], trilha: 'administrativo', nivel: 0, salario: 1300, contrato: 'estagio', carga: 'parcial', idadeMin: 16, matriculado: 'qualquer', oferta: 1, estresse: 1, fundamento: 'Lei do Estágio (11.788/2008): exige matrícula e frequência escolar.' }),

  // ------------------------------------------------------ Tecnologia
  o({ id: 'suporte_ti', nome: ['técnico de suporte', 'técnica de suporte'], trilha: 'ti', nivel: 1, salario: 2400, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['computacao'], nivelCurso: 'tecnico', oferta: 1, estresse: 2 }),
  o({ id: 'estagio_ti', nome: ['estagiário de TI', 'estagiária de TI'], trilha: 'ti', nivel: 0, salario: 1700, contrato: 'estagio', carga: 'parcial', idadeMin: 16, matriculado: 'qualquer', area: ['computacao'], oferta: 1, estresse: 2 }),
  o({ id: 'dev_jr', nome: ['desenvolvedor júnior', 'desenvolvedora júnior'], trilha: 'ti', nivel: 2, salario: 4300, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['computacao'], nivelCurso: 'tecnico', experiencia: 6, oferta: 1, estresse: 3 }),
  o({ id: 'dev_pleno', nome: ['desenvolvedor pleno', 'desenvolvedora plena'], trilha: 'ti', nivel: 3, salario: 7800, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['computacao'], nivelCurso: 'tecnico', experiencia: 36, oferta: 1, estresse: 3 }),
  o({ id: 'dev_senior', nome: ['desenvolvedor sênior', 'desenvolvedora sênior'], trilha: 'ti', nivel: 4, salario: 12500, contrato: 'clt', carga: 'integral', idadeMin: 24, area: ['computacao'], nivelCurso: 'tecnico', experiencia: 72, oferta: 1, estresse: 4 }),
  o({ id: 'tech_lead', nome: ['líder técnico', 'líder técnica'], trilha: 'ti', nivel: 5, salario: 17500, contrato: 'clt', carga: 'integral', idadeMin: 27, area: ['computacao'], nivelCurso: 'tecnico', experiencia: 108, oferta: 2, estresse: 5 }),

  // ------------------------------------------------------------- Saúde
  o({ id: 'cuidador', nome: ['cuidador de idosos', 'cuidadora de idosos'], trilha: 'cuidado', nivel: 1, salario: 1950, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'fundamental', oferta: 0, estresse: 3 }),
  o({ id: 'tec_enfermagem', nome: ['técnico de enfermagem', 'técnica de enfermagem'], trilha: 'enfermagem', nivel: 2, salario: 2900, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['enfermagem'], nivelCurso: 'tecnico', oferta: 0, estresse: 4, fundamento: 'Lei 7.498/1986: técnico de enfermagem exige formação técnica específica.' }),
  o({ id: 'enfermeiro', nome: ['enfermeiro', 'enfermeira'], trilha: 'enfermagem', nivel: 3, salario: 5100, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['enfermagem'], nivelCurso: 'superior', licenca: 'coren', oferta: 0, estresse: 4, fundamento: 'Lei 7.498/1986: enfermeiro é privativo de bacharel com COREN.' }),
  o({ id: 'enfermeiro_chefe', nome: ['enfermeiro-chefe', 'enfermeira-chefe'], trilha: 'enfermagem', nivel: 4, salario: 7600, contrato: 'clt', carga: 'integral', idadeMin: 27, area: ['enfermagem'], nivelCurso: 'superior', licenca: 'coren', experiencia: 60, oferta: 1, estresse: 5 }),
  o({ id: 'medico', nome: ['médico', 'médica'], trilha: 'medicina', nivel: 3, salario: 14500, contrato: 'clt', carga: 'integral', idadeMin: 23, area: ['medicina'], nivelCurso: 'superior', licenca: 'crm', oferta: 0, estresse: 5, fundamento: 'Lei 12.842/2013: exige graduação em Medicina e registro no CRM.' }),
  o({ id: 'medico_especialista', nome: ['médico especialista', 'médica especialista'], trilha: 'medicina', nivel: 4, salario: 26000, contrato: 'autonomo', carga: 'integral', idadeMin: 26, area: ['medicina'], nivelCurso: 'residencia', licenca: 'crm', oferta: 1, estresse: 5, fundamento: 'Título de especialista exige residência médica.' }),
  o({ id: 'psicologo', nome: ['psicólogo', 'psicóloga'], trilha: 'psicologia', nivel: 3, salario: 4300, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['psicologia'], nivelCurso: 'superior', licenca: 'crp', oferta: 0, estresse: 3, fundamento: 'Lei 4.119/1962: exige graduação em Psicologia e CRP.' }),
  o({ id: 'psicologo_clinico', nome: ['psicólogo clínico', 'psicóloga clínica'], trilha: 'psicologia', nivel: 4, salario: 7200, contrato: 'autonomo', carga: 'integral', idadeMin: 26, area: ['psicologia'], nivelCurso: 'superior', licenca: 'crp', experiencia: 48, oferta: 1, estresse: 3 }),
  o({ id: 'nutricionista', nome: ['nutricionista', 'nutricionista'], trilha: 'nutricao', nivel: 3, salario: 4200, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['nutricao'], nivelCurso: 'superior', oferta: 1, estresse: 2 }),
  o({ id: 'personal', nome: ['personal trainer', 'personal trainer'], trilha: 'educacao_fisica', nivel: 3, salario: 3800, contrato: 'autonomo', carga: 'integral', idadeMin: 22, area: ['educacao_fisica'], nivelCurso: 'superior', oferta: 0, estresse: 2 }),

  // ------------------------------------------------------------ Direito
  o({ id: 'estagio_direito', nome: ['estagiário de direito', 'estagiária de direito'], trilha: 'direito', nivel: 0, salario: 1500, contrato: 'estagio', carga: 'parcial', idadeMin: 18, matriculado: 'superior', area: ['direito'], oferta: 1, estresse: 2 }),
  o({ id: 'advogado_jr', nome: ['advogado júnior', 'advogada júnior'], trilha: 'direito', nivel: 3, salario: 4700, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['direito'], nivelCurso: 'superior', licenca: 'oab', oferta: 0, estresse: 4, fundamento: 'Lei 8.906/1994: advocacia é privativa de inscrito na OAB.' }),
  o({ id: 'advogado', nome: ['advogado', 'advogada'], trilha: 'direito', nivel: 4, salario: 8800, contrato: 'autonomo', carga: 'integral', idadeMin: 25, area: ['direito'], nivelCurso: 'superior', licenca: 'oab', experiencia: 48, oferta: 0, estresse: 4 }),
  o({ id: 'socio_advocacia', nome: ['sócio de escritório', 'sócia de escritório'], trilha: 'direito', nivel: 5, salario: 19000, contrato: 'autonomo', carga: 'integral', idadeMin: 32, area: ['direito'], nivelCurso: 'superior', licenca: 'oab', experiencia: 120, oferta: 2, estresse: 5 }),

  // --------------------------------------------------------- Engenharia
  o({ id: 'estagio_eng', nome: ['estagiário de engenharia', 'estagiária de engenharia'], trilha: 'engenharia', nivel: 0, salario: 1800, contrato: 'estagio', carga: 'parcial', idadeMin: 18, matriculado: 'superior', area: ['engenharia_civil', 'arquitetura'], oferta: 1, estresse: 2 }),
  o({ id: 'eng_jr', nome: ['engenheiro júnior', 'engenheira júnior'], trilha: 'engenharia', nivel: 3, salario: 6800, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['engenharia_civil'], nivelCurso: 'superior', licenca: 'crea', oferta: 1, estresse: 4, fundamento: 'Lei 5.194/1966: engenharia exige graduação e CREA.' }),
  o({ id: 'eng_pleno', nome: ['engenheiro', 'engenheira'], trilha: 'engenharia', nivel: 4, salario: 10500, contrato: 'clt', carga: 'integral', idadeMin: 25, area: ['engenharia_civil'], nivelCurso: 'superior', licenca: 'crea', experiencia: 48, oferta: 1, estresse: 4 }),
  o({ id: 'gerente_obras', nome: ['gerente de obras', 'gerente de obras'], trilha: 'engenharia', nivel: 5, salario: 16500, contrato: 'clt', carga: 'integral', idadeMin: 30, area: ['engenharia_civil'], nivelCurso: 'superior', licenca: 'crea', experiencia: 108, oferta: 2, estresse: 5 }),
  o({ id: 'arquiteto', nome: ['arquiteto', 'arquiteta'], trilha: 'engenharia', nivel: 3, salario: 5600, contrato: 'autonomo', carga: 'integral', idadeMin: 22, area: ['arquitetura'], nivelCurso: 'superior', oferta: 1, estresse: 3 }),

  // ----------------------------------------------------------- Educação
  o({ id: 'aux_creche', nome: ['auxiliar de creche', 'auxiliar de creche'], trilha: 'educacao', nivel: 1, salario: 1800, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', oferta: 0, estresse: 3 }),
  o({ id: 'professor_fund', nome: ['professor do fundamental', 'professora do fundamental'], trilha: 'educacao', nivel: 3, salario: 3900, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['educacao'], nivelCurso: 'superior', oferta: 0, estresse: 4 }),
  o({ id: 'professor_concursado', nome: ['professor concursado', 'professora concursada'], trilha: 'educacao', nivel: 3, salario: 5100, contrato: 'servidor', carga: 'integral', idadeMin: 21, area: ['educacao', 'educacao_fisica'], nivelCurso: 'superior', concurso: true, oferta: 0, estresse: 4 }),
  o({ id: 'coordenador_ped', nome: ['coordenador pedagógico', 'coordenadora pedagógica'], trilha: 'educacao', nivel: 4, salario: 6000, contrato: 'clt', carga: 'integral', idadeMin: 27, area: ['educacao'], nivelCurso: 'superior', experiencia: 60, oferta: 0, estresse: 4 }),
  o({ id: 'professor_univ', nome: ['professor universitário', 'professora universitária'], trilha: 'educacao', nivel: 5, salario: 12000, contrato: 'servidor', carga: 'integral', idadeMin: 28, area: ['qualquer'], nivelCurso: 'doutorado', concurso: true, oferta: 1, estresse: 3 }),

  // --------------------------------------------- Construção e manutenção
  o({ id: 'ajudante_obras', nome: ['ajudante de obras', 'ajudante de obras'], trilha: 'construcao', nivel: 1, salario: 1800, contrato: 'informal', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3 }),
  o({ id: 'pedreiro', nome: ['pedreiro', 'pedreira'], trilha: 'construcao', nivel: 2, salario: 3000, contrato: 'autonomo', carga: 'integral', idadeMin: 20, experiencia: 24, oferta: 0, estresse: 3 }),
  o({ id: 'mestre_obras', nome: ['mestre de obras', 'mestra de obras'], trilha: 'construcao', nivel: 4, salario: 5300, contrato: 'clt', carga: 'integral', idadeMin: 30, experiencia: 96, oferta: 0, estresse: 4 }),
  o({ id: 'aux_manutencao', nome: ['auxiliar de manutenção', 'auxiliar de manutenção'], trilha: 'manutencao', nivel: 1, salario: 1900, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'fundamental', oferta: 0, estresse: 2 }),
  o({ id: 'eletricista', nome: ['eletricista', 'eletricista'], trilha: 'manutencao', nivel: 2, salario: 3300, contrato: 'autonomo', carga: 'integral', idadeMin: 18, area: ['eletrotecnica'], nivelCurso: 'tecnico', oferta: 0, estresse: 3, fundamento: 'NR-10: instalação elétrica exige qualificação comprovada.' }),
  o({ id: 'mecanico', nome: ['mecânico', 'mecânica'], trilha: 'manutencao', nivel: 2, salario: 3100, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 24, oferta: 0, estresse: 3 }),
  o({ id: 'tecnico_industrial', nome: ['técnico industrial', 'técnica industrial'], trilha: 'manutencao', nivel: 3, salario: 4500, contrato: 'clt', carga: 'integral', idadeMin: 19, area: ['eletrotecnica', 'mecanica'], nivelCurso: 'tecnico', oferta: 1, estresse: 3 }),
  o({ id: 'tec_seguranca', nome: ['técnico de segurança do trabalho', 'técnica de segurança do trabalho'], trilha: 'manutencao', nivel: 3, salario: 3900, contrato: 'clt', carga: 'integral', idadeMin: 19, area: ['seguranca_trabalho'], nivelCurso: 'tecnico', oferta: 1, estresse: 3 }),

  // ---------------------------------------------------------------- Agro
  o({ id: 'trabalhador_rural', nome: ['trabalhador rural', 'trabalhadora rural'], trilha: 'agro', nivel: 1, salario: 1700, contrato: 'informal', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3 }),
  o({ id: 'operador_maquinas', nome: ['operador de máquinas agrícolas', 'operadora de máquinas agrícolas'], trilha: 'agro', nivel: 2, salario: 3300, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 24, oferta: 0, estresse: 3 }),
  o({ id: 'tecnico_agricola', nome: ['técnico agrícola', 'técnica agrícola'], trilha: 'agro', nivel: 3, salario: 4000, contrato: 'clt', carga: 'integral', idadeMin: 19, area: ['agro'], nivelCurso: 'tecnico', oferta: 0, estresse: 2 }),
  o({ id: 'agronomo', nome: ['agrônomo', 'agrônoma'], trilha: 'agro', nivel: 4, salario: 8500, contrato: 'clt', carga: 'integral', idadeMin: 23, area: ['agro'], nivelCurso: 'superior', licenca: 'crea', oferta: 0, estresse: 3 }),

  // ------------------------------------------------------ Design e mídia
  o({ id: 'designer_jr', nome: ['designer júnior', 'designer júnior'], trilha: 'design', nivel: 3, salario: 3400, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['design'], nivelCurso: 'superior', oferta: 1, estresse: 3 }),
  o({ id: 'designer', nome: ['designer', 'designer'], trilha: 'design', nivel: 4, salario: 6200, contrato: 'clt', carga: 'integral', idadeMin: 24, area: ['design'], nivelCurso: 'superior', experiencia: 36, oferta: 2, estresse: 3 }),
  o({ id: 'diretor_arte', nome: ['diretor de arte', 'diretora de arte'], trilha: 'design', nivel: 5, salario: 11000, contrato: 'clt', carga: 'integral', idadeMin: 28, area: ['design'], nivelCurso: 'superior', experiencia: 96, oferta: 3, estresse: 4 }),

  // ------------------------------------------------ Finanças e economia
  o({ id: 'analista_financeiro', nome: ['analista financeiro', 'analista financeira'], trilha: 'financas', nivel: 3, salario: 5800, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['economia', 'administracao', 'contabilidade'], nivelCurso: 'superior', oferta: 2, estresse: 4 }),
  o({ id: 'gerente_banco', nome: ['gerente de banco', 'gerente de banco'], trilha: 'financas', nivel: 4, salario: 9500, contrato: 'clt', carga: 'integral', idadeMin: 26, escolaridade: 'superior', experiencia: 60, oferta: 0, estresse: 5 }),

  // ------------------------------------------------------ Serviço público
  o({ id: 'escriturario_banco', nome: ['escriturário de banco público', 'escriturária de banco público'], trilha: 'financas', nivel: 2, salario: 4500, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'medio', concurso: true, oferta: 0, estresse: 3 }),
  o({ id: 'tecnico_publico', nome: ['técnico administrativo concursado', 'técnica administrativa concursada'], trilha: 'publico', nivel: 3, salario: 5200, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'medio', concurso: true, oferta: 0, estresse: 2 }),
  o({ id: 'analista_judiciario', nome: ['analista judiciário', 'analista judiciária'], trilha: 'publico', nivel: 4, salario: 13000, contrato: 'servidor', carga: 'integral', idadeMin: 21, escolaridade: 'superior', concurso: true, oferta: 1, estresse: 3 }),
  o({ id: 'auditor_fiscal', nome: ['auditor fiscal', 'auditora fiscal'], trilha: 'publico', nivel: 5, salario: 22000, contrato: 'servidor', carga: 'integral', idadeMin: 21, escolaridade: 'superior', concurso: true, oferta: 2, estresse: 4 })
];

const POR_ID = new Map(OCUPACOES.map(x => [x.id, x]));
export function ocupacao(id: string): Ocupacao {
  const x = POR_ID.get(id);
  if (!x) throw new Error(`Ocupação desconhecida: ${id}`);
  return x;
}
export const ocupacaoOuNula = (id: string) => POR_ID.get(id);

export const ROTULO_NIVEL = ['aprendiz', 'entrada', 'intermediário', 'profissional', 'sênior', 'liderança'];

export const ROTULO_TRILHA: Record<string, string> = {
  informal: 'trabalho informal', cuidado: 'cuidado de pessoas', transporte: 'transporte', beleza: 'beleza', comercio: 'comércio',
  alimentacao: 'alimentação', administrativo: 'administração', ti: 'tecnologia', enfermagem: 'enfermagem', medicina: 'medicina',
  psicologia: 'psicologia', nutricao: 'nutrição', educacao_fisica: 'educação física', direito: 'direito', engenharia: 'engenharia',
  educacao: 'educação', construcao: 'construção', manutencao: 'manutenção', agro: 'agropecuária', design: 'design',
  financas: 'finanças', publico: 'serviço público'
};

/** Ocupações típicas dos pais por classe — para gerar a família de origem. */
export const OCUPACOES_POR_CLASSE: Record<string, string[]> = {
  vulneravel: ['ambulante', 'diarista', 'ajudante_obras', 'trabalhador_rural', 'manicure', 'aux_cozinha', 'entregador_app', 'cuidador'],
  trabalhadora: ['atendente', 'caixa', 'pedreiro', 'mecanico', 'aux_adm', 'garcom', 'cozinheiro', 'motorista_app', 'cabeleireiro', 'aux_manutencao', 'tec_enfermagem', 'operador_maquinas'],
  media_baixa: ['vendedor', 'assistente_adm', 'tec_enfermagem', 'eletricista', 'supervisor_loja', 'professor_fund', 'escriturario_banco', 'tecnico_industrial', 'tecnico_publico'],
  media: ['analista_adm', 'enfermeiro', 'contador', 'professor_concursado', 'gerente_loja', 'dev_pleno', 'eng_jr', 'psicologo', 'advogado_jr', 'gerente_banco'],
  alta: ['medico', 'advogado', 'eng_pleno', 'gerente_adm', 'dev_senior', 'analista_judiciario', 'socio_advocacia', 'medico_especialista', 'auditor_fiscal']
};
