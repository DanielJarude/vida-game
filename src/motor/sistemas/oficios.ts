/**
 * A tabela dos ofícios vivos (as palavras de cada profissão sobre a mesma
 * mecânica): áreas, desafios, para onde vai quem sai por conta, o negócio que
 * o autônomo pode montar. Mora em `sistemas` porque a tela de Trabalho
 * (`sistemas/profissao`) também lê; o conteúdo que a usa está em `conteudo/oficios`.
 */

export interface Oficio {
  /** As áreas possíveis (a primeira palavra é a que aparece no texto). */
  areas: string[];
  /** A pergunta da área. */
  area: string;
  /** Desafios: o que aparece, e como se chama encarar/passar. */
  desafios: { texto: (area?: string) => string; encarar: string; passar: string; deu: string; naoDeu: string }[];
  /** Para onde sai quem vai trabalhar por conta (ocupação autônoma da trilha). */
  contaPropria?: string;
  /** O negócio que o autônomo pode montar. */
  negocio?: string;
}

export const OFICIOS: Record<string, Oficio> = {};
const O = (trilhas: string[], o: Oficio) => { for (const t of trilhas) OFICIOS[t] = o; };

O(['direito'], {
  area: 'Depois de uns anos de fórum, dá para escolher onde se aprofundar.',
  areas: ['direito de família', 'direito trabalhista', 'direito criminal', 'direito empresarial'],
  desafios: [
    { texto: a => `Chegou um caso grande${a ? ` de ${a}` : ''}: cliente difícil, prazo curto, a outra parte com um escritório conhecido.`, encarar: 'Pegar o caso', passar: 'Passar para um colega', deu: 'A sentença saiu a favor. O cliente mandou outros três.', naoDeu: 'Perdeu em primeira instância. O cliente não voltou a ligar.' },
    { texto: () => 'Um cliente quer que você "ajeite" um documento. Diz que ninguém vai perceber.', encarar: 'Recusar e explicar por quê', passar: 'Deixar o cliente ir embora sem conversa', deu: 'O cliente ficou — e passou a confiar mais.', naoDeu: 'O cliente foi procurar outro advogado.' }
  ],
  contaPropria: 'advogado', negocio: 'escritorio_advocacia'
});
O(['odontologia'], {
  area: 'A cadeira de clínica geral já é conhecida. Dá para se aprofundar numa área.',
  areas: ['ortodontia', 'implantes', 'endodontia', 'odontopediatria'],
  desafios: [
    { texto: a => `Um paciente com um caso complicado${a ? ` de ${a}` : ''} pediu para ser atendido por você.`, encarar: 'Assumir o tratamento', passar: 'Encaminhar para um especialista', deu: 'Deu certo. O paciente indicou a família inteira.', naoDeu: 'O tratamento complicou; o paciente ficou insatisfeito.' },
    { texto: () => 'Um plano odontológico ofereceu credenciamento: muito paciente, pouco por consulta.', encarar: 'Credenciar', passar: 'Ficar só no particular', deu: 'A agenda encheu — e o dia ficou mais longo.', naoDeu: 'Encheu a agenda e esvaziou o lucro.' }
  ],
  negocio: 'consultorio_odonto'
});
O(['educacao', 'docencia_superior'], {
  area: 'Depois de uns anos de sala, dá para escolher onde se aprofundar.',
  areas: ['alfabetização', 'matemática', 'educação inclusiva', 'coordenação pedagógica'],
  desafios: [
    { texto: () => 'A direção ofereceu a turma que ninguém quer: atrasada, barulhenta, desacreditada.', encarar: 'Aceitar a turma', passar: 'Recusar com jeito', deu: 'No fim do ano, a turma leu em voz alta na festa da escola. A direção notou.', naoDeu: 'O ano foi uma guerra. Você terminou exaust{o}.' },
    { texto: a => `Chamaram você para coordenar um projeto da escola${a ? ` (${a})` : ''}.`, encarar: 'Topar coordenar', passar: 'Ficar só nas aulas', deu: 'O projeto virou referência na rede.', naoDeu: 'Faltou verba, faltou gente. O projeto murchou.' }
  ]
});
O(['enfermagem', 'medicina'], {
  area: 'Os anos de plantão mostraram onde você se sente em casa.',
  areas: ['terapia intensiva', 'emergência', 'saúde da família', 'pediatria'],
  desafios: [
    { texto: a => `Faltou gente ${a === 'terapia intensiva' ? 'na UTI' : 'no plantão'}: pediram para você segurar a escala de um mês difícil.`, encarar: 'Segurar a escala', passar: 'Dizer que não aguenta mais', deu: 'O mês passou, os pacientes também — bem. A chefia não esqueceu.', naoDeu: 'Um erro de cansaço, sem gravidade, mas ficou no prontuário e na cabeça.' },
    { texto: () => 'Um caso raro chegou ao hospital, e a equipe quer que você acompanhe.', encarar: 'Acompanhar o caso', passar: 'Deixar com quem já estava', deu: 'O caso virou apresentação num congresso, com seu nome junto.', naoDeu: 'O paciente não resistiu. Nada que alguém pudesse ter feito — mas pesou.' }
  ]
});
O(['engenharia', 'eng_industrial'], {
  area: 'Os anos de obra e projeto mostraram o que você faz melhor.',
  areas: ['estruturas', 'gestão de obras', 'projetos', 'manutenção industrial'],
  desafios: [
    { texto: () => 'Uma obra atrasada precisa de alguém à frente. Quem assumir leva a culpa ou o crédito.', encarar: 'Assumir a obra', passar: 'Continuar no que faz', deu: 'Entregou no prazo. O seu nome começou a aparecer nas reuniões.', naoDeu: 'O atraso continuou — agora com o seu nome.' }
  ]
});
O(['contabil'], {
  area: 'Depois de anos de balanço, dá para se aprofundar.',
  areas: ['área fiscal', 'departamento pessoal', 'auditoria', 'contabilidade rural'],
  desafios: [
    { texto: () => 'Um cliente grande quer um balanço "mais bonito" do que os números.', encarar: 'Recusar e mostrar os números como são', passar: 'Deixar para lá e perder o cliente', deu: 'O cliente ficou, mesmo contrariado — e outros souberam da sua fama de correto.', naoDeu: 'O cliente foi embora, levando outros dois.' }
  ],
  contaPropria: 'contador_socio', negocio: 'escritorio_contabil'
});
O(['comunicacao'], {
  area: 'Depois de anos de redação, dá para escolher uma editoria.',
  areas: ['política', 'economia', 'cultura', 'esporte'],
  desafios: [
    { texto: a => `Uma pauta${a ? ` de ${a}` : ''} que incomoda gente poderosa caiu na sua mão.`, encarar: 'Apurar e publicar', passar: 'Deixar a pauta passar', deu: 'A reportagem repercutiu. Veio ameaça — e veio prêmio.', naoDeu: 'A matéria caiu na revisão. O editor pediu para você "esfriar".' }
  ]
});
O(['psicologia'], {
  area: 'A clínica mostrou com quem você trabalha melhor.',
  areas: ['crianças e adolescentes', 'casais e famílias', 'trabalho e carreira', 'luto'],
  desafios: [
    { texto: () => 'Um paciente em crise pediu atendimento fora do horário.', encarar: 'Atender', passar: 'Encaminhar ao plantão', deu: 'Ele atravessou a semana. E voltou.', naoDeu: 'Você atendeu, mas saiu da sessão carregando o peso.' }
  ],
  contaPropria: 'psicologo_clinico', negocio: 'consultorio_psicologia'
});
O(['ti', 'dados'], {
  area: 'Depois de anos de código, dá para escolher onde se aprofundar.',
  areas: ['segurança', 'dados', 'infraestrutura', 'produto'],
  desafios: [
    { texto: () => 'O sistema caiu numa sexta à noite e ninguém sabe por quê.', encarar: 'Virar a noite e resolver', passar: 'Esperar a segunda', deu: 'Às quatro da manhã, voltou. Na segunda, o diretor sabia o seu nome.', naoDeu: 'Não achou a causa. Voltou sozinho, sem explicação — e a cobrança ficou.' }
  ]
});

