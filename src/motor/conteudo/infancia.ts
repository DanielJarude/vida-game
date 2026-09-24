/**
 * Infância (0–11).
 *
 * 0–2: ninguém decide nada, nem o bebê. O que se conta é o que os outros
 * viram — e é contado como eles contam ("sua mãe jura que...").
 * 3–11: o mundo acontece (irmão, escola, cidade); decisões pequenas e reais
 * aparecem quando a criança já age por conta própria.
 */

import type { Conteudo } from './base';
import * as P from './papeis';
import { art, dinheiro, estresse, fato, feliz, forma, gp, prox, saude, tensao } from './efeitos';
import { idadePessoa } from '../nucleo';
import { municipio } from '../dados/lugares';

export const INFANCIA: Conteudo[] = [
  /* ============================================================ MARCOS */
  {
    id: 'bb_primeiros_passos', tipo: 'acontecimento', idade: [1, 1], tema: 'infancia', garantido: true,
    papeis: { quem: P.genitorEmCasa },
    narrar: c => ({
      texto: c.r.pick([
        `Deu os primeiros passos na sala, em direção a ${c.p.quem.nome}. ${gp(c, 'quem', 'Ele', 'Ela')} conta essa história até hoje.`,
        `Os primeiros passos vieram tarde, depois de muito tempo engatinhando — e vieram de uma vez: atravessou a cozinha sem cair.`,
        `Aprendeu a andar ${c.g('agarrado', 'agarrada', 'agarrade')} nos móveis. ${c.p.quem.nome} filmou o primeiro passo sem apoio e mandou para a família inteira.`
      ]),
      relevancia: 'marco', tom: 'bom'
    })
  },
  {
    id: 'bb_primeira_palavra', tipo: 'decisao', idade: [2, 2], tema: 'infancia', garantido: true, biografica: true,
    papeis: { quem: P.genitorEmCasa },
    titulo: 'A primeira palavra',
    texto: c => `Faz semanas que ${c.p.quem.nome} repete palavras devagar, apontando para as coisas. Hoje saiu uma, clara. Qual foi?`,
    opcoes: [
      { id: 'nome', texto: c => `"${c.p.quem.genero === 'feminino' ? (c.v.vinculos[c.p.quem.id].parentesco === 'avo' ? 'Vó' : 'Mamãe') : (c.v.vinculos[c.p.quem.id].parentesco === 'avo' ? 'Vô' : 'Papai')}"`, resolver: c => ({ texto: `A primeira palavra foi para ${c.p.quem.nome}, que chorou na hora.`, memoria: `A primeira palavra foi "${c.p.quem.genero === 'feminino' ? 'mamãe' : 'papai'}". ${c.p.quem.nome} chorou.`, relevancia: 'marco', tom: 'bom', efeito: () => prox(c, 'quem', 5) }) },
      { id: 'agua', texto: '"Água"', resolver: () => ({ texto: 'Foi "água" — pedida com a mão estendida para o copo.', memoria: 'A primeira palavra foi "água", com a mão estendida para o copo.', relevancia: 'marco' }) },
      { id: 'nao', texto: '"Não"', resolver: () => ({ texto: 'Foi "não". A família riu e disse que era um sinal.', memoria: 'A primeira palavra foi "não". A família riu e disse que era um sinal.', relevancia: 'marco' }) },
      { id: 'pet', texto: c => `"${P.pet(c.v)[0]?.nome ?? 'Au-au'}"`, disponivel: c => P.pet(c.v).length > 0 || false, resolver: c => { const pet = P.pet(c.v)[0]; return { texto: `Foi "${pet?.nome ?? 'au-au'}", para o bicho de casa.`, memoria: `A primeira palavra foi o nome d${pet?.genero === 'feminino' ? 'a' : 'o'} ${pet?.nome ?? 'cachorro'}.`, relevancia: 'marco' }; } }
    ]
  },
  {
    id: 'inf_primeiro_dia_aula', tipo: 'acontecimento', idade: [6, 7], tema: 'escola', garantido: true,
    quando: c => !!c.v.educacao.basica && c.v.educacao.basica.etapa === 'fundamental1' && c.v.educacao.basica.serie === 1,
    papeis: { quem: P.genitorEmCasa },
    narrar: c => ({
      texto: c.v.educacao.basica!.rede === 'privada'
        ? `Primeiro dia no 1º ano, de uniforme novo e mochila maior que as costas. ${c.p.quem.nome} ficou no portão até a porta da sala fechar.`
        : `Primeiro dia no 1º ano da escola ${municipio(c.v.moradia.municipioId).perfil === 'pequena' ? 'da cidade' : 'do bairro'}. ${c.p.quem.nome} levou até o portão; a professora se chamava ${c.r.pick(['Dona Célia', 'Tia Rose', 'Professora Márcia', 'Tia Kátia', 'Professora Sônia'])}.`,
      relevancia: 'marco'
    })
  },
  {
    id: 'inf_alfabetizacao', tipo: 'acontecimento', idade: [7, 8], tema: 'escola', garantido: true,
    quando: c => !!c.v.educacao.basica,
    narrar: c => {
      const d = c.v.educacao.basica!.desempenho;
      return {
        texto: d >= 70 ? 'Aprendeu a ler antes da maior parte da turma e passou a ler placa de ônibus em voz alta.'
          : d >= 45 ? 'Aprendeu a ler no ritmo da turma, juntando sílaba por sílaba no caderno de caligrafia.'
            : 'A leitura demorou a engrenar. A professora mandou bilhete pedindo reforço em casa.',
        relevancia: 'biografia', tom: d < 45 ? 'ruim' : 'neutro'
      };
    }
  },

  /* ==================================================== BEBÊ (0–2), pelos outros */
  {
    id: 'bb_noites_sem_dormir', tipo: 'acontecimento', idade: [1, 1], tema: 'infancia', peso: 3,
    papeis: { quem: P.genitorEmCasa },
    narrar: c => ({ texto: `Foi um bebê de noites curtas. ${c.p.quem.nome} diz que passou um ano inteiro dormindo em prestações.`, relevancia: 'cotidiano' })
  },
  {
    id: 'bb_visita_avos', tipo: 'acontecimento', idade: [1, 2], tema: 'familia', peso: 3,
    papeis: { avo: P.avo },
    narrar: c => ({ texto: `${gp(c, 'avo', 'O avô', 'A avó')} ${c.p.avo.nome} passou a aparecer toda semana, sempre com alguma coisa no bolso para dar escondido.`, relevancia: 'cotidiano', efeito: () => prox(c, 'avo', 8), lembrar: ['avo', 'Aparecia toda semana quando você era bebê.'] })
  },
  {
    id: 'bb_febre', tipo: 'acontecimento', idade: [1, 2], tema: 'saude', peso: 2,
    papeis: { quem: P.genitorEmCasa },
    narrar: c => ({ texto: c.v.financas.planoDeSaude || ['media', 'alta'].includes(c.v.origem.classe)
      ? `Uma febre alta de madrugada levou a família ao pronto-socorro. Era virose; voltaram para casa ao amanhecer.`
      : `Uma febre alta de madrugada levou ${c.p.quem.nome} para a fila da UPA, com o bebê no colo. Era virose; foram atendidos às cinco da manhã.`,
      relevancia: 'cotidiano', efeito: () => saude(c, -2) })
  },
  {
    id: 'bb_irmao_ciumes', tipo: 'acontecimento', idade: [1, 2], tema: 'familia', peso: 2,
    papeis: { irmao: P.comIdade(P.irmaoEmCasa, 3, 10) },
    narrar: c => ({ texto: `${c.p.irmao.nome} passou meses pedindo para devolver o bebê à maternidade. Depois, virou ${gp(c, 'irmao', 'o', 'a')} maior defensor${gp(c, 'irmao', '', 'a')}.`, relevancia: 'cotidiano', efeito: () => prox(c, 'irmao', 6) })
  },
  {
    id: 'bb_pet_colado', tipo: 'acontecimento', idade: [1, 2], tema: 'familia', peso: 2,
    papeis: { pet: P.pet },
    narrar: c => ({ texto: `${c.p.pet.nome} elegeu o berço como posto de guarda e não saía de perto.`, relevancia: 'cotidiano', efeito: () => prox(c, 'pet', 10) })
  },

  /* ========================================================= 3–5 */
  {
    id: 'prc_irmao_nasceu_contexto', tipo: 'acontecimento', idade: [3, 5], tema: 'familia', peso: 2,
    papeis: { quem: P.genitorEmCasa },
    quando: c => P.irmaoEmCasa(c.v).some(i => idadePessoa(c.v, i) === 0),
    narrar: c => ({ texto: `A casa passou a girar em torno do bebê novo, e ${c.p.quem.nome} ficou mais cansad${gp(c, 'quem', 'o', 'a')} do que nunca.`, relevancia: 'cotidiano' })
  },
  {
    id: 'prc_mudanca_bairro', tipo: 'acontecimento', idade: [3, 11], tema: 'lugar', peso: 1,
    quando: c => c.v.moradia.tipo === 'pais' && ['vulneravel', 'trabalhadora'].includes(c.v.origem.classe),
    narrar: c => ({
      texto: 'O aluguel subiu e a família mudou de casa, para uma rua mais longe. Tudo coube numa kombi fretada.',
      relevancia: 'biografia',
      efeito: () => { c.v.moradia.tInicio = c.v.t; estresse(c, 4); }
    })
  },
  {
    id: 'prc_parquinho_briga', tipo: 'decisao', idade: [3, 6], tema: 'infancia', repetir: 3,
    papeis: { outra: P.qualquer(P.genteDe('escola'), P.genteDe('vizinhanca')) },
    titulo: 'O balanço',
    texto: c => `No parquinho só há um balanço livre. ${c.p.outra.nome} chega correndo junto com você e agarra a corrente do outro lado.`,
    opcoes: [
      { id: 'revezar', texto: 'Propor revezar: dez empurrões para cada um', comportamento: { generosidade: 1, sociabilidade: 1 },
        resolver: c => ({ texto: `Vocês revezaram a tarde inteira, contando alto. ${c.p.outra.nome} voltou no dia seguinte perguntando por você.`, memoria: `Dividiu o balanço com ${c.p.outra.nome} no parquinho, e isso virou amizade de pracinha.`, efeito: () => prox(c, 'outra', 12) }) },
      { id: 'puxar', texto: 'Puxar com força e subir primeiro', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: `Você subiu primeiro. ${c.p.outra.nome} foi chorar no colo de alguém, e um adulto veio conversar com você.`, memoria: `Brigou pelo balanço com ${c.p.outra.nome} e ganhou — com bronca de brinde.`, efeito: () => { prox(c, 'outra', -8); tensao(c, 'outra', 15); } }) },
      { id: 'soltar', texto: 'Soltar e ir para o escorregador', comportamento: { independencia: 1 },
        resolver: () => ({ texto: 'Você largou a corrente e foi brincar em outra coisa.', memoria: null }) }
    ]
  },
  {
    id: 'prc_crianca_sozinha', tipo: 'decisao', idade: [4, 8], tema: 'amizade',
    papeis: { nova: P.colegaDe('escola') },
    titulo: 'A criança nova',
    texto: c => `Chegou ${gp(c, 'nova', 'um menino novo', 'uma menina nova')} na turma, ${c.p.nova.nome}. No recreio, fica encostad${gp(c, 'nova', 'o', 'a')} na parede, sem ninguém por perto.`,
    opcoes: [
      { id: 'chamar', texto: c => `Chamar ${c.p.nova.nome} para brincar`, comportamento: { empatia: 2, sociabilidade: 1 },
        resolver: c => ({ texto: `${c.p.nova.nome} demorou a sorrir, mas brincou o recreio todo com você.`, memoria: `Chamou ${c.p.nova.nome}, que estava sozinh${gp(c, 'nova', 'o', 'a')} no primeiro dia, para brincar.`, efeito: () => prox(c, 'nova', 22), lembrar: ['nova', 'Você chamou para brincar no primeiro dia de escola.'] }) },
      { id: 'olhar', texto: 'Continuar com a sua turma', resolver: () => ({ texto: 'Você continuou na brincadeira de sempre.', memoria: null }) },
      { id: 'professora', texto: 'Avisar a professora', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `A professora puxou ${c.p.nova.nome} para a roda. No fim do dia, ${gp(c, 'nova', 'ele', 'ela')} acenou para você.`, memoria: null, efeito: () => prox(c, 'nova', 8) }) }
    ]
  },
  {
    id: 'prc_vaso_quebrado', tipo: 'decisao', idade: [4, 9], tema: 'familia', repetir: 5,
    papeis: { adulto: P.qualquer(P.genitorEmCasa, P.avoPerto) },
    titulo: 'O vaso',
    texto: c => `Jogando bola dentro de casa, você acerta o vaso de estimação de ${c.p.adulto.nome}. Está em cacos no chão, e ninguém viu.`,
    opcoes: [
      { id: 'contar', texto: 'Contar o que aconteceu', comportamento: { coragem: 1, empatia: 1 },
        resolver: c => ({ texto: `${c.p.adulto.nome} ficou brav${gp(c, 'adulto', 'o', 'a')}, mas no fim disse que preferia a verdade ao vaso.`, memoria: `Quebrou o vaso de ${c.p.adulto.nome} e contou na hora.`, efeito: () => prox(c, 'adulto', 4) }) },
      { id: 'esconder', texto: 'Juntar os cacos e esconder', comportamento: { impulsividade: 1 },
        resolver: c => c.r.chance(0.6)
          ? { texto: `Dois dias depois, ${c.p.adulto.nome} achou os cacos atrás do sofá. A bronca foi dobrada.`, memoria: `Escondeu os cacos do vaso de ${c.p.adulto.nome} e foi descobert${c.g('o', 'a', 'e')}.`, tom: 'ruim', efeito: () => { prox(c, 'adulto', -5); tensao(c, 'adulto', 20); } }
          : { texto: 'Ninguém nunca descobriu. O vaso virou um mistério da família.', memoria: null } },
      { id: 'culpar', texto: 'Dizer que foi o vento', disponivel: () => true, comportamento: { impulsividade: 1, empatia: -1 },
        resolver: c => ({ texto: 'Ninguém acreditou no vento.', memoria: `Culpou o vento pelo vaso quebrado. Ninguém acreditou.`, efeito: () => tensao(c, 'adulto', 12) }) }
    ]
  },
  {
    id: 'prc_medo_do_escuro', tipo: 'decisao', idade: [3, 6], tema: 'infancia',
    papeis: { quem: P.genitorEmCasa },
    titulo: 'O armário',
    texto: () => 'Na hora de dormir, a porta do armário fica entreaberta, e lá dentro o escuro parece se mexer.',
    opcoes: [
      { id: 'chamar', texto: c => `Chamar ${c.p.quem.nome}`, resolver: c => ({ texto: `${c.p.quem.nome} veio, acendeu a luz, mostrou que era só um casaco — e deixou o abajur ligado.`, memoria: `Teve medo do escuro, e ${c.p.quem.nome} passou a deixar um abajur ligado.`, relevancia: 'cotidiano', efeito: () => prox(c, 'quem', 4) }) },
      { id: 'olhar', texto: 'Levantar e olhar sozinho', comportamento: { coragem: 2 },
        resolver: c => ({ texto: 'Era um casaco pendurado. Você voltou para a cama e dormiu.', memoria: `Levantou sozinh${c.g('o', 'a', 'e')} para enfrentar o "monstro" do armário: era um casaco.`, relevancia: 'cotidiano' }) },
      { id: 'coberta', texto: 'Cobrir a cabeça e esperar o sono', resolver: () => ({ texto: 'O sono veio, debaixo da coberta.', memoria: null }) }
    ]
  },
  {
    id: 'prc_primo_visita', tipo: 'acontecimento', idade: [3, 11], tema: 'familia', repetir: 4,
    papeis: { primo: P.comIdade(P.tioOuPrimo, 2, 16) },
    quando: c => c.v.vinculos[c.p.primo.id]?.parentesco === 'primo',
    narrar: c => ({ texto: `As férias foram na casa de ${gp(c, 'primo', 'um primo', 'uma prima')}: ${c.p.primo.nome}, colchão no chão e televisão até tarde.`, relevancia: 'cotidiano', efeito: () => { prox(c, 'primo', 10); feliz(c, 3); } })
  },

  /* ========================================================= 6–11 */
  {
    id: 'inf_colar_prova', tipo: 'decisao', idade: [8, 14], tema: 'escola', repetir: 4,
    papeis: { colega: P.qualquer(P.amigo, P.genteDe('escola')) },
    quando: c => !!c.v.educacao.basica,
    titulo: 'A prova de matemática',
    texto: c => `Prova valendo nota. ${c.p.colega.nome}, na carteira ao lado, vira a folha de respostas para o seu lado sem a professora ver.`,
    opcoes: [
      { id: 'copiar', texto: 'Copiar as respostas', comportamento: { impulsividade: 1, disciplina: -1 },
        resolver: c => c.r.chance(0.3)
          ? { texto: 'A professora viu. Zero para os dois e bilhete para casa.', memoria: `Foi pego colando na prova com ${c.p.colega.nome}.`.replace('pego', c.g('pego', 'pega', 'pegue')), tom: 'ruim', efeito: () => { estresse(c, 6); prox(c, 'colega', 4); if (c.v.educacao.basica) c.v.educacao.basica.desempenho -= 5; } }
          : { texto: 'Ninguém percebeu. A nota veio boa.', memoria: null, efeito: () => prox(c, 'colega', 4) } },
      { id: 'recusar', texto: 'Olhar para a própria prova', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você fez a prova sozinh' + c.g('o', 'a', 'e') + '. A nota foi a sua nota.', memoria: null }) },
      { id: 'devolver', texto: c => `Sussurrar para ${c.p.colega.nome} esconder aquilo`, comportamento: { coragem: 1, empatia: 1 },
        resolver: c => ({ texto: `${c.p.colega.nome} escondeu a folha, meio sem graça.`, memoria: null, efeito: () => prox(c, 'colega', -2) }) }
    ]
  },
  {
    id: 'inf_bullying', tipo: 'decisao', idade: [8, 15], tema: 'escola',
    papeis: { alvo: P.genteDe('escola') },
    quando: c => !!c.v.educacao.basica,
    titulo: 'No corredor',
    texto: c => `Um grupo da sala ao lado cercou ${c.p.alvo.nome} no corredor e está rindo do tênis ${gp(c, 'alvo', 'dele', 'dela')}. Alguém filma com o celular.`,
    opcoes: [
      { id: 'defender', texto: 'Entrar no meio e mandar parar', comportamento: { coragem: 2, empatia: 1 },
        resolver: c => ({ texto: `O grupo se dispersou xingando. ${c.p.alvo.nome} não falou nada, mas no dia seguinte guardou lugar para você no lanche.`, memoria: `Defendeu ${c.p.alvo.nome} de um grupo no corredor da escola.`, efeito: () => { prox(c, 'alvo', 20); estresse(c, 4); }, lembrar: ['alvo', 'Você o defendeu no corredor da escola.'.replace('o defendeu', gp(c, 'alvo', 'o defendeu', 'a defendeu'))] }) },
      { id: 'coordenacao', texto: 'Chamar a coordenação', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'A coordenadora apareceu e levou todo mundo para a sala dela.', memoria: `Chamou a coordenação quando cercaram ${c.p.alvo.nome} no corredor.`, efeito: () => prox(c, 'alvo', 8) }) },
      { id: 'passar', texto: 'Seguir para a sala', resolver: () => ({ texto: 'Você seguiu. O vídeo circulou no grupo da escola à noite.', memoria: null }) },
      { id: 'rir', texto: 'Rir junto', comportamento: { empatia: -2, sociabilidade: 1 },
        resolver: c => ({ texto: `O grupo gostou. ${c.p.alvo.nome} olhou para você e foi embora.`, memoria: `Riu junto quando zoaram ${c.p.alvo.nome} no corredor.`, efeito: () => { prox(c, 'alvo', -20); tensao(c, 'alvo', 30); } }) }
    ]
  },
  {
    id: 'inf_dinheiro_achado', tipo: 'decisao', idade: [7, 13], tema: 'infancia',
    titulo: 'A nota no chão',
    texto: () => 'Voltando da escola, você acha uma nota de cinquenta reais dobrada na calçada, na frente de uma padaria.',
    opcoes: [
      { id: 'guardar', texto: 'Guardar no bolso', resolver: c => ({ texto: 'Cinquenta reais inteiros, só seus.', memoria: null, efeito: () => dinheiro(c, 50) }) },
      { id: 'padaria', texto: 'Perguntar na padaria se alguém perdeu', comportamento: { generosidade: 1, empatia: 1 },
        resolver: c => c.r.chance(0.5)
          ? { texto: 'Uma senhora na fila tinha acabado de perder o troco. Agradeceu com um sonho de padaria.', memoria: 'Devolveu cinquenta reais achados na calçada para a dona, uma senhora da fila da padaria.' }
          : { texto: 'Ninguém reclamou a nota. O padeiro disse para você ficar com ela.', memoria: null, efeito: () => dinheiro(c, 50) } },
      { id: 'casa', texto: 'Levar para casa e contar', resolver: c => ({ texto: 'Em casa, decidiram que era seu — mas metade ia para o cofrinho.', memoria: null, efeito: () => dinheiro(c, 25) }) }
    ]
  },
  {
    id: 'inf_bicicleta', tipo: 'acontecimento', idade: [6, 10], tema: 'infancia',
    papeis: { quem: P.qualquer(P.genitorEmCasa, P.avo) },
    quando: c => c.v.origem.classe !== 'vulneravel' || c.r.chance(0.4),
    narrar: c => ({
      texto: c.v.origem.classe === 'vulneravel' || c.v.origem.classe === 'trabalhadora'
        ? `${c.p.quem.nome} apareceu com uma bicicleta usada, reformada com peças de outra. Tirou as rodinhas na rua de casa numa tarde de domingo.`
        : `Ganhou bicicleta de aniversário de ${c.p.quem.nome}. As rodinhas saíram numa tarde de domingo, com ${c.p.quem.nome} correndo atrás segurando o banco.`,
      relevancia: 'biografia', tom: 'bom',
      efeito: () => { prox(c, 'quem', 6); forma(c, 3); fato(c, 'aprendeu_bicicleta'); }
    })
  },
  {
    id: 'inf_catapora', tipo: 'acontecimento', idade: [3, 10], tema: 'saude',
    narrar: c => ({ texto: `Pegou catapora da escola. Duas semanas em casa, ${c.g('coberto', 'coberta', 'coberte')} de pomada, ${c.g('proibido', 'proibida', 'proibide')} de coçar.`, relevancia: 'cotidiano', efeito: () => saude(c, -1) })
  },
  {
    id: 'inf_festa_junina', tipo: 'acontecimento', idade: [5, 11], tema: 'escola', repetir: 4,
    quando: c => !!c.v.educacao.basica,
    papeis: { par: P.genteDe('escola') },
    narrar: c => ({ texto: `Na festa junina da escola, a professora sorteou os pares da quadrilha: foi com ${c.p.par.nome}, os dois de roupa xadrez e chapéu de palha.`, relevancia: 'cotidiano', efeito: () => prox(c, 'par', 5) })
  },
  {
    id: 'inf_avo_ensina', tipo: 'acontecimento', idade: [5, 11], tema: 'familia',
    papeis: { avo: P.avoPerto },
    narrar: c => ({
      texto: c.r.pick([
        `${gp(c, 'avo', 'O avô', 'A avó')} ${c.p.avo.nome} passou uma tarde inteira ensinando a jogar dominó, sem deixar ganhar nenhuma vez.`,
        `${gp(c, 'avo', 'O avô', 'A avó')} ${c.p.avo.nome} contou histórias da cidade de antigamente, de quando ali ainda era mato.`,
        `${gp(c, 'avo', 'O avô', 'A avó')} ${c.p.avo.nome} ensinou uma receita de bolo que ninguém mais da família sabe fazer.`
      ]),
      relevancia: 'biografia', efeito: () => prox(c, 'avo', 10), lembrar: ['avo', 'Ensinou coisas que ficaram.']
    })
  },
  {
    id: 'inf_pet_novo', tipo: 'decisao', idade: [6, 12], tema: 'familia',
    papeis: { quem: P.genitorEmCasa },
    quando: c => P.pet(c.v).length === 0 && c.v.moradia.tipo === 'pais',
    titulo: 'O filhote na caixa',
    texto: c => `Um vizinho está dando os filhotes da cachorra dele. Há uma caixa de papelão cheia deles na calçada. ${c.p.quem.nome} diz que a decisão é sua — e a responsabilidade também.`,
    opcoes: [
      { id: 'levar', texto: 'Levar um para casa', comportamento: { empatia: 1 },
        resolver: c => ({
          texto: 'Você escolheu o mais quieto da caixa. Ele dormiu no seu pé a primeira noite inteira.',
          memoria: 'Levou para casa um filhote de uma caixa de papelão na calçada.',
          efeito: () => {
            const nome = c.r.pick(['Pipoca', 'Thor', 'Mel', 'Paçoca', 'Bidu', 'Nina']);
            fato(c, 'adotou_pet');
            criarPetInfancia(c, nome);
          }
        }) },
      { id: 'nao', texto: 'Deixar para outra família', resolver: () => ({ texto: 'Você ficou olhando a caixa esvaziar ao longo da tarde.', memoria: null }) }
    ]
  },
  {
    id: 'inf_amigo_muda', tipo: 'acontecimento', idade: [6, 17], tema: 'amizade',
    papeis: { amigo: P.amigo },
    quando: c => c.v.vinculos[c.p.amigo.id].convivio.length > 0 && idadePessoa(c.v, c.p.amigo) < 18,
    narrar: c => ({
      texto: `A família de ${c.p.amigo.nome} se mudou para outra cidade. A despedida foi no portão da escola.`,
      relevancia: 'biografia', tom: 'ruim',
      efeito: () => { c.p.amigo.municipioId = c.r.pick(['sao-paulo-sp', 'curitiba-pr', 'goiania-go', 'salvador-ba', 'manaus-am']); c.v.vinculos[c.p.amigo.id].ambiente = undefined; feliz(c, -5); },
      lembrar: ['amigo', 'Mudou de cidade quando vocês ainda eram crianças.']
    })
  },
  {
    id: 'inf_briga_irmao', tipo: 'decisao', idade: [6, 15], tema: 'familia', repetir: 4,
    papeis: { irmao: P.comIdade(P.irmaoEmCasa, 4, 20) },
    titulo: 'A briga',
    texto: c => `${c.p.irmao.nome} pegou suas coisas sem pedir de novo — e estragou uma delas.`,
    opcoes: [
      { id: 'brigar', texto: 'Partir para cima', comportamento: { impulsividade: 2 },
        resolver: c => ({ texto: 'Virou briga de verdade. Os dois ficaram de castigo.', memoria: `Saiu no tapa com ${c.p.irmao.nome} por causa de uma coisa estragada.`, efeito: () => { tensao(c, 'irmao', 25); prox(c, 'irmao', -4); } }) },
      { id: 'conversar', texto: 'Cobrar, mas sem briga', comportamento: { disciplina: 1, empatia: 1 },
        resolver: c => ({ texto: `${c.p.irmao.nome} bufou, mas prometeu pagar de volta. Não pagou.`, memoria: null, efeito: () => tensao(c, 'irmao', 5) }) },
      { id: 'reclamar', texto: 'Ir reclamar com os adultos', resolver: c => ({ texto: `${c.p.irmao.nome} levou bronca e passou uma semana sem falar com você.`, memoria: null, efeito: () => tensao(c, 'irmao', 10) }) }
    ]
  },
  {
    id: 'inf_boletim_ruim', tipo: 'acontecimento', idade: [7, 14], tema: 'escola', repetir: 3,
    papeis: { quem: P.genitorEmCasa },
    quando: c => (c.v.educacao.basica?.desempenho ?? 100) < 45,
    narrar: c => ({ texto: `O boletim veio com notas vermelhas. ${c.p.quem.nome} foi chamad${gp(c, 'quem', 'o', 'a')} na escola para uma conversa com a coordenação.`, relevancia: 'cotidiano', tom: 'ruim', efeito: () => estresse(c, 5) })
  },
  {
    id: 'inf_enchente', tipo: 'acontecimento', idade: [3, 70], tema: 'lugar',
    quando: c => ['vulneravel', 'trabalhadora'].includes(c.v.origem.classe) && c.v.moradia.padrao <= 2 && c.v.moradia.tipo !== 'propria',
    narrar: c => ({ texto: 'Uma chuva de verão alagou a rua e a água entrou em casa. O sofá e a geladeira foram para o lixo.', relevancia: 'biografia', tom: 'ruim', efeito: () => { estresse(c, 8); if (c.idade >= 18 && c.v.moradia.tipo !== 'pais') dinheiro(c, -2500); } })
  }
];

import { criarPessoa, vincular } from '../pessoas';
import type { Ctx } from './base';
function criarPetInfancia(c: Ctx, nome: string) {
  const pet = criarPessoa(c.v, c.r, { especie: 'cachorro', idade: 0, municipioId: c.v.moradia.municipioId, nome, sobrenome: '' });
  vincular(c.v, pet, { parentesco: 'pet', origem: 'familia', proximidade: 70, convivio: ['casa'] });
}
void art;
