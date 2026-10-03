/**
 * Especialidades médicas: a residência não é "mais três anos de Medicina",
 * é a escolha de que médico ser. Poucas, e de vidas realmente diferentes:
 *
 *   CLÍNICA MÉDICA — o hospital e o ambulatório, o adulto com muitas doenças.
 *   PEDIATRIA — a criança e a família junto; pronto-socorro infantil, consultório.
 *   CIRURGIA — o centro cirúrgico: a residência mais dura, a renda mais alta, o plantão que não acaba.
 *   PSIQUIATRIA — o consultório e o serviço público de saúde mental (no Brasil, o CAPS): agenda previsível, casos que pesam de outro jeito.
 *   MEDICINA DE FAMÍLIA — o posto de saúde (no Brasil, a UBS) e o território: horário regular, vaga em toda cidade, renda menor.
 *
 * A especialidade é da PESSOA (fica na residência concluída, em
 * `educacao.concluidos`), e vai com ela para qualquer emprego. Ela decide:
 * duração e concorrência da residência, as vagas que exigem o título
 * (`Ocupacao.especialidades`), a faixa de salário (`fatorRenda`), os
 * convites que chegam e os casos do dia a dia (`conteudo/oficios`).
 */

export type EspecialidadeMedica = 'clinica' | 'pediatria' | 'cirurgia' | 'psiquiatria' | 'familia';

export interface ModeloEspecialidade {
  id: EspecialidadeMedica;
  /** Como se diz a área ("pediatria"): vai para `Emprego.especialidade`. */
  area: string;
  /** Nome da residência ("Residência em Pediatria"). */
  residencia: string;
  /** Duração da residência (meses). */
  meses: number;
  /** Quanto a seleção é disputada (0..1): tira da chance de entrar. */
  concorrencia: number;
  /** Multiplica o salário de referência de toda vaga médica. */
  fatorRenda: number;
  /** Onde o dia acontece (texto das telas e dos convites). */
  ambiente: string;
  /** O convite que a especialidade atrai: a vaga e as palavras. */
  convite: { ocupacaoId: string; titulo: string; texto: string };
  /** O caso grande do dia a dia (o desafio do ofício, com a cara da área). */
  caso: string;
  descricao: string;
}

export const ESPECIALIDADES_MEDICAS: Record<EspecialidadeMedica, ModeloEspecialidade> = {
  clinica: {
    id: 'clinica', area: 'clínica médica', residencia: 'Residência em Clínica Médica', meses: 24, concorrencia: 0.05, fatorRenda: 1,
    ambiente: 'enfermaria e ambulatório',
    convite: { ocupacaoId: 'medico_hospital', titulo: 'A enfermaria de clínica médica', texto: 'Um hospital da cidade precisa de clínico para a enfermaria: pacientes com três, quatro doenças ao mesmo tempo.' },
    caso: 'Um paciente idoso com cinco remédios e três diagnósticos que não fecham chegou à enfermaria.',
    descricao: 'Dois anos. O adulto inteiro, com todas as doenças juntas; é a base de muitas outras áreas.'
  },
  pediatria: {
    id: 'pediatria', area: 'pediatria', residencia: 'Residência em Pediatria', meses: 36, concorrencia: 0.08, fatorRenda: 0.9,
    ambiente: 'pronto-socorro infantil e consultório',
    convite: { ocupacaoId: 'medico_hospital', titulo: 'O hospital infantil', texto: 'Um hospital infantil chamou para a equipe de pediatria: plantões no pronto-socorro e a enfermaria das crianças.' },
    caso: 'Uma criança chegou ao pronto-socorro infantil com febre alta e a mãe em pânico — e o quadro não é simples.',
    descricao: 'Três anos. A criança e a família junto; paga menos que outras áreas, e a agenda é cheia de urgências.'
  },
  cirurgia: {
    id: 'cirurgia', area: 'cirurgia geral', residencia: 'Residência em Cirurgia Geral', meses: 36, concorrencia: 0.15, fatorRenda: 1.35,
    ambiente: 'centro cirúrgico',
    convite: { ocupacaoId: 'cirurgiao', titulo: 'A equipe cirúrgica', texto: 'Um hospital privado ofereceu lugar na equipe cirúrgica: cirurgias eletivas de dia, sobreaviso de noite.' },
    caso: 'Uma cirurgia de emergência no meio da madrugada: o paciente é jovem, o caso é grave e o cirurgião de plantão é você.',
    descricao: 'Três anos da residência mais dura. A renda mais alta e o plantão que não acaba.'
  },
  psiquiatria: {
    id: 'psiquiatria', area: 'psiquiatria', residencia: 'Residência em Psiquiatria', meses: 36, concorrencia: 0.12, fatorRenda: 1.1,
    ambiente: 'consultório e serviço público de saúde mental',
    convite: { ocupacaoId: 'medico_especialista', titulo: 'Os pacientes que esperam', texto: 'Há fila de meses para psiquiatra na cidade: uma clínica ofereceu sala e agenda para você atender por conta.' },
    caso: 'Um paciente em crise grave chegou ao serviço de saúde mental acompanhado da família, que não sabe mais o que fazer.',
    descricao: 'Três anos. Agenda mais previsível, pouca cirurgia de madrugada — e casos que pesam de outro jeito.'
  },
  familia: {
    id: 'familia', area: 'medicina de família', residencia: 'Residência em Medicina de Família e Comunidade', meses: 24, concorrencia: 0, fatorRenda: 0.95,
    ambiente: 'posto de saúde e território',
    convite: { ocupacaoId: 'medico_familia', titulo: 'Uma equipe de saúde da família', texto: 'A prefeitura precisa de médico de família para uma equipe do posto de saúde: horário regular, visitas no bairro, as mesmas famílias por anos.' },
    caso: 'Uma família inteira da sua área de cobertura adoeceu junto — e o problema parece estar na casa, não nas pessoas.',
    descricao: 'Dois anos. O posto de saúde e as mesmas famílias por anos: horário regular, vaga em quase toda cidade, renda menor.'
  }
};

export const LISTA_ESPECIALIDADES = Object.values(ESPECIALIDADES_MEDICAS);
export const modeloEspecialidade = (id: EspecialidadeMedica) => ESPECIALIDADES_MEDICAS[id];
export const ehEspecialidadeMedica = (x: unknown): x is EspecialidadeMedica => typeof x === 'string' && x in ESPECIALIDADES_MEDICAS;
