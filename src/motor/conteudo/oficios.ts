/**
 * Ofícios vivos: a base comum das carreiras "normais".
 *
 * Conseguir a profissão não basta — é preciso vivê-la. Advogado, dentista,
 * professor, enfermeiro, engenheiro, contador, jornalista, médico,
 * psicólogo e programador compartilham a MESMA infraestrutura:
 *
 *   ÁREA — depois de uns anos, a pessoa escolhe onde vai se aprofundar
 *   (`Emprego.especialidade`, que vai junto para o próximo emprego);
 *   DESAFIO — o caso, a turma, a obra, a pauta que aparece: encarar pode dar
 *   certo (feitos, desempenho, clientela, promoção) ou não (cabeça, clima);
 *   CONTA PRÓPRIA — quem juntou estrada e nome pode sair para atender por
 *   conta (autônomo: a própria agenda, sem empresa);
 *   VIRAR DONO — o autônomo cheio de clientes pode montar a empresa
 *   (consultório, escritório, com equipe): outra trajetória, outro risco.
 *
 * Cada profissão só troca as PALAVRAS (`OFICIOS`); a mecânica é uma só.
 */

import type { Conteudo, Ctx, Opcao } from './base';
import { clamp } from '../rng';
import type { Emprego } from '../tipos';
import { escrever, idade, marcarFato } from '../nucleo';
import { estresse } from './efeitos';
import { ocupacao, ocupacaoOuNula } from '../dados/ocupacoes';
import { NEGOCIOS } from '../dados/negocios';
import { contratar, elegibilidade } from '../sistemas/trabalho';
import { podeTentar } from '../plausibilidade';
import { abalar } from '../sistemas/abalo';
import { marcar } from '../sistemas/marcas';
import { mexerNoClima, temChefia } from '../sistemas/profissao';
import { negocioAberto } from '../sistemas/negocio';

interface Oficio {
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

const oficioDe = (e?: Emprego) => (e ? OFICIOS[ocupacaoOuNula(e.ocupacaoId)?.trilha ?? ''] : undefined);
const emprego = (c: Ctx) => c.v.trabalho.atual!;
const anosNaTrilha = (c: Ctx) => (c.v.trabalho.experiencia[ocupacao(emprego(c).ocupacaoId).trilha] ?? 0) / 12;
const vivo = (c: Ctx) => { const e = c.v.trabalho.atual; return !!e && !e.formacaoAte && e.contrato !== 'estagio' && e.contrato !== 'aprendiz' && !!oficioDe(e); };

/** A chance de o desafio dar certo: estrada, como vem indo, a área, a cabeça. */
function chanceDoDesafio(c: Ctx): number {
  const e = emprego(c);
  return clamp(0.35 + Math.min(10, anosNaTrilha(c)) * 0.03 + (e.desempenho - 55) / 100 + (e.especialidade ? 0.1 : 0) + (c.v.mente.cognicao - 50) / 200 - Math.max(0, c.v.mente.estresse - 70) / 100, 0.12, 0.85);
}

/** O desafio da vez (estável entre abrir e resolver: sai do ano). */
const indiceDesafio = (c: Ctx) => { const o = oficioDe(emprego(c))!; return Math.floor(c.v.t / 12) % o.desafios.length; };

export const OFICIOS_CONTEUDO: Conteudo[] = [
  {
    id: 'ofi_area', tipo: 'decisao', idade: [23, 70], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 0,
    quando: c => vivo(c) && !emprego(c).especialidade && anosNaTrilha(c) >= 2 && (c.v.fatos['ofi_generalista'] === undefined || c.v.t - c.v.fatos['ofi_generalista'] >= 60) && c.r.chance(0.5),
    titulo: 'A área',
    texto: c => oficioDe(emprego(c))!.area,
    opcoes: [...[0, 1, 2, 3].map((k): Opcao => ({
      id: `a${k}`,
      texto: (c: Ctx) => { const a = oficioDe(emprego(c))!.areas[k]; return a.charAt(0).toUpperCase() + a.slice(1); },
      disponivel: (c: Ctx) => (oficioDe(emprego(c))!.areas[k] ? true : false),
      consequencia: () => 'Cursos, leitura, os casos certos: os desafios dessa área rendem mais — e ela vai junto para o próximo emprego.',
      resolver: (c: Ctx) => { const a = oficioDe(emprego(c))!.areas[k]; return { texto: `Você decidiu: ${a}. Os primeiros cursos vieram no mesmo ano.`, memoria: `Escolheu se aprofundar em ${a}.`, relevancia: 'cotidiano', efeito: () => { emprego(c).especialidade = a; emprego(c).desempenho = clamp(emprego(c).desempenho + 4); } }; }
    })), { id: 'geral', texto: () => 'Seguir generalista, por enquanto', disponivel: () => true, consequencia: () => 'Nada muda — e dá para escolher depois.', resolver: (c: Ctx) => ({ texto: 'Você preferiu não se prender a uma área só.', memoria: null, efeito: () => { c.v.fatos['ofi_generalista'] = c.v.t; } }) }]
  },
  {
    // O trabalho também acontece: de dois em dois anos, mais ou menos, aparece o caso, a turma, a obra, a pauta.
    id: 'ofi_desafio', tipo: 'decisao', idade: [22, 75], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 2,
    quando: c => vivo(c) && anosNaTrilha(c) >= 1 && c.r.chance(0.45),
    titulo: 'No trabalho',
    texto: c => { const o = oficioDe(emprego(c))!; return o.desafios[indiceDesafio(c)].texto(emprego(c).especialidade); },
    opcoes: [
      { id: 'encarar', texto: c => oficioDe(emprego(c))!.desafios[indiceDesafio(c)].encarar, comportamento: { coragem: 1 },
        consequencia: c => { const x = chanceDoDesafio(c); return `${x >= 0.6 ? 'Você tem estrada para isso' : x >= 0.4 ? 'Pode dar certo — ou não' : 'É arriscado para quem está onde você está'}. Mais trabalho no ano.`; },
        resolver: c => {
          const d = oficioDe(emprego(c))!.desafios[indiceDesafio(c)];
          const deu = c.r.chance(chanceDoDesafio(c));
          const g = (s: string) => s.replace('{o}', c.g('o', 'a', 'e'));
          return {
            texto: g(deu ? d.deu : d.naoDeu), memoria: deu && (emprego(c).feitos ?? 0) === 0 ? `O primeiro grande ${/caso|paciente/.test(d.texto()) ? 'caso' : 'trabalho'} de verdade como ${ocupacao(emprego(c).ocupacaoId).nome[0]}: deu certo.` : null, relevancia: deu ? 'biografia' : undefined, tom: deu ? 'bom' : 'ruim',
            efeito: () => {
              const e = emprego(c);
              estresse(c, 4);
              if (deu) {
                e.feitos = (e.feitos ?? 0) + 1;
                e.desempenho = clamp(e.desempenho + 10);
                if (e.clientela !== undefined) e.clientela = clamp(e.clientela + 10);
                if (temChefia(c.v)) mexerNoClima(c.v, 6);
                abalar(c.v, 'o trabalho que deu certo', 4, -2);
                if ((e.feitos ?? 0) === 3) marcar(c.v, 'conquista', `Virou referência como ${ocupacao(e.ocupacaoId).nome[0]}${e.especialidade ? ` (${e.especialidade})` : ''}.`, 2);
              } else {
                e.desempenho = clamp(e.desempenho - 6);
                if (e.clientela !== undefined) e.clientela = clamp(e.clientela - 5);
                abalar(c.v, 'o trabalho que não deu certo', -3, 5);
              }
            }
          };
        } },
      { id: 'passar', texto: c => oficioDe(emprego(c))!.desafios[indiceDesafio(c)].passar,
        consequencia: () => 'Nada arriscado — e nada construído.',
        resolver: c => ({ texto: 'Você deixou passar. A semana seguiu igual.', memoria: null, efeito: () => { if (temChefia(c.v)) mexerNoClima(c.v, -2); } }) }
    ]
  },
  {
    // Com estrada e nome, dá para sair e atender por conta: sem chefe, sem salário fixo — a agenda é sua.
    id: 'ofi_conta_propria', tipo: 'decisao', idade: [25, 65], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 6,
    quando: c => c.r.chance(0.25) && (() => { const e = c.v.trabalho.atual; const o = oficioDe(e); if (!e || !o?.contaPropria || e.contrato !== 'clt' || !vivo(c)) return false; const alvo = ocupacaoOuNula(o.contaPropria); return !!alvo && anosNaTrilha(c) >= 4 && ((e.feitos ?? 0) >= 1 || anosNaTrilha(c) >= 7) && podeTentar(elegibilidade(c.v, alvo)); })(),
    titulo: 'Por conta própria',
    texto: c => `Dois clientes antigos disseram que iriam com você se você atendesse por conta. ${(emprego(c).feitos ?? 0) >= 2 ? 'O seu nome já circula.' : ''} Sair é trocar o salário pela agenda: o que entra depende de quem vem.`,
    opcoes: [
      { id: 'sair', texto: 'Sair e atender por conta', comportamento: { coragem: 1, independencia: 1 },
        consequencia: () => 'Sem salário fixo, sem chefe, sem empresa: você é o seu trabalho. A freguesia começa pequena.',
        resolver: c => ({ texto: 'Você pediu as contas e mandou mensagem para os clientes antigos.', memoria: `Saiu do emprego para trabalhar por conta.`, relevancia: 'marco', efeito: () => { const o = oficioDe(emprego(c))!; const feitos = emprego(c).feitos ?? 0; const esp = emprego(c).especialidade; const novo = contratar(c.v, c.r, ocupacao(o.contaPropria!), 'conta_propria'); novo.especialidade = esp; if (novo.clientela !== undefined) novo.clientela = clamp(novo.clientela + feitos * 6 + 8); marcar(c.v, 'mudanca_carreira', 'Passou a trabalhar por conta.', 2); } }) },
      { id: 'ficar', texto: 'Ficar no emprego', resolver: () => ({ texto: 'Você agradeceu. O salário do mês que vem tem data.', memoria: null }) }
    ]
  },
  {
    // O autônomo cheio de clientes pode virar DONO: a empresa, a equipe, as contas — outra vida, não uma promoção.
    id: 'ofi_virar_dono', tipo: 'decisao', idade: [27, 68], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 5,
    quando: c => c.r.chance(0.3) && (() => { const e = c.v.trabalho.atual; const o = oficioDe(e); return !!e && !!o?.negocio && e.clientela !== undefined && e.clientela >= 62 && !negocioAberto(c.v) && idade(c.v) >= 27 && NEGOCIOS.some(n => n.id === o.negocio); })(),
    titulo: 'A agenda não cabe',
    texto: c => { const t = NEGOCIOS.find(n => n.id === oficioDe(emprego(c))!.negocio)!; return `A agenda lota três semanas adiante. Um colega sugere: por que não ${t.nome.replace(/^um /, 'montar um ').replace(/^uma /, 'montar uma ')}, com gente trabalhando junto? Hoje você atende por conta; lá, seria ${c.g('o dono', 'a dona', 'e done')} — com equipe, aluguel e folha.`; },
    opcoes: [
      { id: 'abrir', texto: 'Pensar seriamente em abrir', consequencia: () => 'Abre a conversa do negócio: quanto custa, de onde vem o dinheiro. Nada é assinado ainda.',
        resolver: c => { const t = oficioDe(emprego(c))!.negocio!; return { texto: 'Você sentou com uma planilha e um café.', memoria: null, abrir: { id: 'neg_abrir' }, efeito: () => { c.v.fatos['abrir_tipo'] = Math.max(0, NEGOCIOS.findIndex(n => n.id === t)); marcarFato(c.v, 'pensou_negocio_proprio'); } }; } },
      { id: 'nao', texto: 'Continuar atendendo por conta', resolver: () => ({ texto: 'Você preferiu a agenda cheia sem folha de pagamento.', memoria: null }) }
    ]
  }
];

void escrever;
