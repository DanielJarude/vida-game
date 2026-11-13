/**
 * A tabela dos ofícios vivos (as palavras de cada profissão sobre a mesma
 * mecânica): áreas, desafios, para onde vai quem sai por conta, o negócio que
 * o autônomo pode montar. Mora em `sistemas` porque a tela de Trabalho
 * (`sistemas/profissao`) também lê; o conteúdo que a usa está em `conteudo/oficios`.
 */

import { LISTA_ESPECIALIDADES } from '../dados/especialidades';

export interface Oficio {
  /** A chave do ofício (a primeira trilha da tabela): ti e dados são o MESMO ofício, a área escolhida vale nos dois. */
  chave?: string;
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
const O = (trilhas: string[], o: Oficio) => { o.chave = trilhas[0]; for (const t of trilhas) OFICIOS[t] = o; };

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
O(['enfermagem'], {
  area: 'Os anos de plantão mostraram onde você se sente em casa.',
  areas: ['terapia intensiva', 'emergência', 'saúde da família', 'pediatria'],
  desafios: [
    { texto: a => `Faltou gente ${a === 'terapia intensiva' ? 'na UTI' : 'no plantão'}: pediram para você segurar a escala de um mês difícil.`, encarar: 'Segurar a escala', passar: 'Dizer que não aguenta mais', deu: 'O mês passou, os pacientes também — bem. A chefia não esqueceu.', naoDeu: 'Um erro de cansaço, sem gravidade, mas ficou no prontuário e na cabeça.' },
    { texto: () => 'Um caso raro chegou ao hospital, e a equipe quer que você acompanhe.', encarar: 'Acompanhar o caso', passar: 'Deixar com quem já estava', deu: 'O caso virou apresentação num congresso, com seu nome junto.', naoDeu: 'O paciente não resistiu. Nada que alguém pudesse ter feito — mas pesou.' }
  ]
});
// Medicina: a área é a do título (a residência, `dados/especialidades`), não uma pergunta do emprego — e o caso grande tem a cara dela.
const casoMedico = (a?: string) => LISTA_ESPECIALIDADES.find(x => x.area === a)?.caso ?? 'Um caso raro chegou ao plantão, e a equipe quer que você acompanhe.';
O(['medicina'], {
  area: '',
  areas: [],
  desafios: [
    { texto: a => casoMedico(a), encarar: 'Assumir o caso', passar: 'Chamar alguém mais experiente', deu: 'O paciente saiu bem. A equipe passou a chamar você para os casos difíceis.', naoDeu: 'Você fez o que podia; o caso não terminou bem. Não foi erro — mas pesou por semanas.' },
    { texto: a => (a === 'medicina de família' ? 'O posto de saúde do bairro vizinho está sem médico: pediram para você cobrir a área vizinha por um mês.' : a === 'psiquiatria' ? 'Um colega pediu que você assumisse os pacientes dele durante uma licença.' : `Faltou gente no plantão${a ? ` de ${a}` : ''}: pediram para você segurar a escala de um mês difícil.`), encarar: 'Topar', passar: 'Dizer que não aguenta mais', deu: 'O mês passou, os pacientes também — bem. A chefia não esqueceu.', naoDeu: 'Um erro de cansaço, sem gravidade, mas ficou no prontuário e na cabeça.' }
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


/*
 * VIDA 19 — a auditoria das profissões achou ofícios comuns sem nenhuma mecânica própria além da progressão genérica
 * (cargo, salário, clima): o salão, a cozinha, a obra, a elétrica, a estrada, o balcão. Eles entram na mesma tabela dos
 * ofícios vivos — a área escolhida fica no emprego (e na vida: `areasDoOficio`), treina o que a área pede, e os desafios
 * têm saída e consequência pelo mesmo conteúdo (`conteudo/oficios`). Nenhum sistema novo; nenhuma carreira refeita.
 */
O(['beleza'], {
  area: 'Os anos de cadeira mostraram o que a sua mão faz melhor.',
  areas: ['coloração', 'cortes masculinos e barba', 'unhas e nail art', 'penteados de festa'],
  desafios: [
    { texto: a => `Uma noiva quer você${a === 'penteados de festa' ? ' para o penteado' : ''} no dia do casamento — às seis da manhã, num sábado, com a madrinha, a mãe e duas primas.`, encarar: 'Topar o pacote da noiva', passar: 'Indicar uma colega', deu: 'As fotos rodaram nos grupos do bairro: a agenda de casamentos do ano encheu.', naoDeu: 'O atraso da manhã virou correria e a madrinha reclamou na rede.' },
    { texto: () => 'Uma cliente chegou com o cabelo estragado por uma química de outro lugar e quer conserto para hoje.', encarar: 'Assumir o conserto', passar: 'Explicar que precisa de tratamento antes', deu: 'Deu trabalho, mas ela saiu chorando de alegria — e virou cliente fixa.', naoDeu: 'O fio não aguentou mais química. Ela saiu com o cabelo curto e sem dizer obrigado.' }
  ],
  contaPropria: 'cabeleireiro', negocio: 'salao'
});
O(['alimentacao', 'confeitaria'], {
  area: 'Depois de anos de fogão, dá para escolher a praça.',
  areas: ['cozinha brasileira', 'confeitaria', 'cozinha de eventos', 'panificação'],
  desafios: [
    { texto: () => 'A vigilância sanitária apareceu sem avisar, no meio do almoço.', encarar: 'Acompanhar a inspeção e mostrar tudo', passar: 'Deixar com o gerente', deu: 'Nota alta: a casa pendurou o selo na porta e o movimento subiu.', naoDeu: 'Uma câmara fria fora da temperatura: advertência e uma semana de correria.' },
    { texto: a => `Um bufê pediu um evento de 300 pessoas${a === 'confeitaria' ? ' — com o bolo de cinco andares' : ''} para daqui a dez dias.`, encarar: 'Aceitar o evento', passar: 'Recusar: a equipe não dá conta', deu: 'Saiu tudo na hora: o bufê fechou mais quatro eventos com você.', naoDeu: 'Faltou mão: a comida atrasou e o bufê não chamou mais.' }
  ],
  contaPropria: 'confeiteiro', negocio: 'lanchonete'
});
O(['construcao', 'hidraulica'], {
  area: 'Os anos de obra mostraram em que etapa você é bom.',
  areas: ['alvenaria e estrutura', 'acabamento', 'reformas', 'instalações hidráulicas'],
  desafios: [
    { texto: () => 'O cliente quer a reforma pronta antes do Natal, e a obra está três semanas atrasada.', encarar: 'Fazer hora extra com a equipe', passar: 'Renegociar o prazo', deu: 'Entregou no dia 23. O cliente indicou dois vizinhos.', naoDeu: 'Na correria, um rejunte malfeito: voltou para refazer de graça.' },
    { texto: () => 'O engenheiro mandou concretar com chuva para não atrasar o cronograma.', encarar: 'Bater o pé e esperar a chuva passar', passar: 'Concretar como mandaram', deu: 'Dois dias de atraso e uma laje sem fissura. O mestre de obras passou a ouvir você.', naoDeu: 'A laje trincou meses depois — e a culpa sobrou para a equipe.' }
  ],
  contaPropria: 'pedreiro', negocio: 'empreiteira'
});
O(['eletrica'], {
  area: 'Os anos de painel e fiação mostraram a sua especialidade.',
  areas: ['instalações residenciais', 'manutenção industrial', 'energia solar', 'refrigeração'],
  desafios: [
    { texto: () => 'Um cliente quer a ligação nova "por fora", sem o padrão da concessionária, para economizar.', encarar: 'Recusar e fazer o padrão certo', passar: 'Deixar o cliente procurar outro', deu: 'O cliente reclamou do preço — e voltou meses depois para o resto da casa.', naoDeu: 'Perdeu o serviço para quem fez o gato.' },
    { texto: a => `Uma empresa ofereceu um contrato de manutenção${a === 'energia solar' ? ' de usinas solares' : ''} com plantão de fim de semana.`, encarar: 'Pegar o contrato', passar: 'Ficar nos serviços avulsos', deu: 'Renda certa todo mês, e a empresa renovou.', naoDeu: 'Os plantões comeram os sábados, e o contrato pagava pouco pelo que pedia.' }
  ],
  contaPropria: 'eletricista'
});
O(['estrada', 'transporte'], {
  area: 'Os anos de volante mostraram a sua rota.',
  areas: ['cargas de longa distância', 'transporte de passageiros', 'entregas urbanas', 'cargas perigosas'],
  desafios: [
    { texto: () => 'A transportadora quer a carga do outro lado do país em menos tempo do que a lei do descanso permite.', encarar: 'Cumprir o descanso e avisar do atraso', passar: 'Rodar a noite inteira', deu: 'Chegou um dia depois, inteiro. O cliente esperou — e a empresa passou a respeitar a sua escala.', naoDeu: 'A empresa colocou outro motorista nas viagens melhores.' },
    { texto: () => 'A estrada interditada por um acidente: o desvio é por terra, com o caminhão carregado.', encarar: 'Encarar o desvio', passar: 'Esperar a liberação', deu: 'Passou, chegou, e o frete rendeu um bônus.', naoDeu: 'Atolou: guincho, frete atrasado e uma multa contratual.' }
  ],
  contaPropria: 'caminhoneiro'
});
O(['comercio', 'vendas'], {
  area: 'Os anos de balcão mostraram onde você vende melhor.',
  areas: ['vendas consultivas', 'gestão de loja', 'vendas on-line', 'representação comercial'],
  desafios: [
    { texto: () => 'A meta do mês dobrou por causa da Black Friday, e a equipe está desfalcada.', encarar: 'Assumir a meta da equipe', passar: 'Cumprir só a sua parte', deu: 'Bateu a meta da loja inteira: o gerente regional veio conhecer você.', naoDeu: 'Ficou a 80% da meta, exaust{o}, e a comissão não veio.' },
    { texto: () => 'Um cliente grande quer um desconto que estoura a sua comissão — ou vai para o concorrente.', encarar: 'Negociar valor, não preço', passar: 'Dar o desconto e fechar', deu: 'Fechou sem baixar tanto: o cliente gostou do atendimento e voltou.', naoDeu: 'O cliente foi para o concorrente.' }
  ],
  contaPropria: 'representante', negocio: 'comercio'
});
