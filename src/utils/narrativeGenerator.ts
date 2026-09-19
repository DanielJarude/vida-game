import { Character, FamilyMember, PostMortemSummary, VisibleStats } from '../types';
import { getSocialClassLabel } from './formatters';

export function gerarHistoriaNascimento(
  personagem: Character,
  pai?: FamilyMember,
  mae?: FamilyMember
): string[] {
  const logs: string[] = [];

  logs.push(`Você nasceu em ${personagem.cidade}, ${personagem.estado}.`);
  logs.push(`Seu nome completo é ${personagem.nome} ${personagem.sobrenome}.`);

  if (pai) {
    logs.push(`Seu pai, ${pai.nome} ${pai.sobrenome}, tem ${pai.idade} anos e trabalha como ${pai.profissao || 'trabalhador'}.`);
  }

  if (mae) {
    logs.push(`Sua mãe, ${mae.nome} ${mae.sobrenome}, tem ${mae.idade} anos e trabalha como ${mae.profissao || 'trabalhadora'}.`);
  }

  const classeDesc = getSocialClassLabel(personagem.classeSocial);
  logs.push(`Você nasceu em uma família de ${classeDesc.toLowerCase()}.`);

  return logs;
}

export function gerarResumoMorte(
  personagem: Character,
  familia: FamilyMember[],
  statsFinais: VisibleStats,
  patrimonioFinal: number,
  profissaoFinal: string,
  nivelEducacao: string,
  causaMorte: string
): PostMortemSummary {
  const filhos = familia.filter(f => f.tipo === 'filho' || f.tipo === 'filha');
  const parceiros = familia.filter(f => ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(f.tipo));

  const conquistas: string[] = [];

  if (personagem.idade >= 80) conquistas.push('Alcançou longevidade impressionante de mais de 80 anos');
  else if (personagem.idade >= 70) conquistas.push('Viveu uma vida longa e madura');

  if (patrimonioFinal >= 1000000) conquistas.push('Tornou-se milionário(a) e acumulou grande patrimônio');
  else if (patrimonioFinal >= 200000) conquistas.push('Construiu sólida estabilidade financeira');

  if (filhos.length > 0) conquistas.push(`Deixou ${filhos.length} ${filhos.length === 1 ? 'filho(a)' : 'filhos(as)'} como legado familiar`);
  if (personagem.flags['casado_oficialmente']) conquistas.push('Viveu a experiência de um matrimônio oficial');
  if (personagem.flags['tcc_nota_dez']) conquistas.push('Recebeu nota máxima com louvor na faculdade');
  if (personagem.flags['registro_profissional_aprovado']) conquistas.push('Conquistou registro oficial no conselho de classe');
  if (personagem.flags['medalha_ciencias'] || personagem.flags['medalha_obmep']) conquistas.push('Premiado(a) academicamente na juventude');
  if (personagem.flags['socio_empresario']) conquistas.push('Empreendeu com sucesso como sócio proprietário');

  if (conquistas.length === 0) {
    conquistas.push('Viveu sua jornada com honestidade e simplicidade');
  }

  // Epitáfio
  let epitafio = '';
  if (statsFinais.felicidade >= 70) {
    epitafio = '"Viveu com o coração leve e espalhou sorrisos por onde passou."';
  } else if (patrimonioFinal >= 500000) {
    epitafio = '"Um exemplo de perseverança, trabalho árduo e conquistas sólidas."';
  } else if (personagem.hiddenStats.empatia >= 70) {
    epitafio = '"Uma alma generosa cuja bondade tocou profundamente a todos ao redor."';
  } else if (personagem.idade >= 80) {
    epitafio = '"Descansou em paz após uma longa e inspiradora travessia de vida."';
  } else {
    epitafio = '"Lembrado(a) com saudade e carinho por todos que compartilharam sua história."';
  }

  // Biografia Resumo
  let biografia = `${personagem.nome} ${personagem.sobrenome} partiu aos ${personagem.idade} anos em decorrência de ${causaMorte.toLowerCase()}. `;
  biografia += `Nascido(a) em ${personagem.cidade} (${personagem.estado}), `;

  if (profissaoFinal && profissaoFinal !== 'Desempregado(a)') {
    biografia += `dedicou parte de sua trajetória profissional à função de ${profissaoFinal}. `;
  } else {
    biografia += `trilhou caminhos diversos ao longo de seus anos de vida. `;
  }

  if (filhos.length > 0) {
    biografia += `Foi um pilar para sua família, deixando ${filhos.length} ${filhos.length === 1 ? 'filho(a)' : 'filhos'} e inúmeras memórias. `;
  }

  if (patrimonioFinal > 100000) {
    biografia += `Encerrou seus dias com um patrimônio consolidado. `;
  }

  biografia += `Sua história permanece viva na memória daqueles que o(a) amaram.`;

  const pontuacao = Math.round(
    personagem.idade * 40 +
    statsFinais.felicidade * 20 +
    statsFinais.saude * 10 +
    statsFinais.inteligencia * 10 +
    Math.min(patrimonioFinal / 1000, 3000) +
    conquistas.length * 200
  );

  return {
    nomeCompleto: `${personagem.nome} ${personagem.sobrenome}`,
    idadeMorte: personagem.idade,
    anoNascimento: personagem.anoNascimento,
    anoMorte: personagem.anoAtual,
    cidade: personagem.cidade,
    estado: personagem.estado,
    causaMorte,
    patrimonioFinal,
    dinheiroTotalAcumulado: patrimonioFinal,
    profissaoFinal: profissaoFinal || 'Desempregado(a)',
    nivelEducacao,
    quantidadeFilhos: filhos.length,
    quantidadeParceiros: parceiros.length,
    principaisConquistas: conquistas,
    epitafio,
    biografiaResumo: biografia,
    statsFinais,
    pontuacaoVida: pontuacao
  };
}

export function gerarTextoAnoTranquilo(idade: number): string {
  const tranquilidadesInfancia = [
    'Você passou o ano brincando, assistindo desenhos animados e crescendo com saúde.',
    'Foi um ano calmo e seguro ao lado de sua família.',
    'Você aprendeu novas brincadeiras e fez pequenas descobertas pelo bairro.'
  ];

  const tranquilidadesAdolescencia = [
    'Você seguiu sua rotina escolar entre aulas, conversas no recreio e tarefas de casa.',
    'O ano passou com tranquilidade, ouvindo suas músicas favoritas e convivendo com amigos.',
    'Você aproveitou os fins de semana para descansar e recarregar as energias.'
  ];

  const tranquilidadesAdulta = [
    'Você manteve sua rotina diária equilibrada, cuidando das responsabilidades com serenidade.',
    'Foi um ano sem grandes sobressaltos, com foco no trabalho e momentos de descanso.',
    'Você desfrutou da tranquilidade do seu lar e manteve suas contas em ordem.'
  ];

  const tranquilidadesSenior = [
    'Você aproveitou a calma da vida madura, tomando um cafezinho da tarde e curtindo o sossego.',
    'Foi um ano sereno, com caminhadas leves e conversas agradáveis.',
    'Você desfrutou da paz de ver o tempo passar sem pressa.'
  ];

  if (idade <= 11) return tranquilidadesInfancia[Math.floor(Math.random() * tranquilidadesInfancia.length)];
  if (idade <= 17) return tranquilidadesAdolescencia[Math.floor(Math.random() * tranquilidadesAdolescencia.length)];
  if (idade <= 59) return tranquilidadesAdulta[Math.floor(Math.random() * tranquilidadesAdulta.length)];
  return tranquilidadesSenior[Math.floor(Math.random() * tranquilidadesSenior.length)];
}
