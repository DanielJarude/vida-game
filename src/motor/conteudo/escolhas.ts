/**
 * Escolhas que viram hábito e caráter. Cada uma tem consequência que dura:
 * o cigarro experimentado aos 15 pode virar o maço de todo dia aos 40.
 */

import type { Conteudo } from './base';
import * as P from './papeis';
import { dinheiro, estresse, fato, feliz, gp, prox, saude, tensao } from './efeitos';
import { idadePessoa, temFato } from '../nucleo';
import { encerrarEmprego } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { criarPessoa, vincular } from '../pessoas';

export const ESCOLHAS: Conteudo[] = [
  /* ================================================================ HÁBITOS */
  {
    id: 'hab_cigarro', tipo: 'decisao', idade: [14, 22], tema: 'saude',
    papeis: { amigo: P.qualquer(P.amigo, P.genteDe('escola'), P.genteDe('rotina')) },
    quando: c => !c.v.corpo.habitos.fuma,
    titulo: 'Um trago',
    texto: c => `Atrás da quadra, ${c.p.amigo.nome} oferece ${c.r.chance(0.5) ? 'um cigarro' : 'o vape de sabor de menta'}. "Só um."`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { impulsividade: 1 },
        resolver: c => {
          const vicia = c.r.chance(0.35 + Math.max(0, c.v.personalidade.tracos.impulsividade) / 200);
          return { texto: vicia ? 'Um virou outro, e outro virou todo dia.' : 'Você tossiu, riu, e não quis mais.', memoria: vicia ? 'Começou a fumar na adolescência.' : null, tom: vicia ? 'ruim' : 'neutro', efeito: () => { if (vicia) c.v.corpo.habitos.fuma = true; prox(c, 'amigo', 3); } };
        } },
      { id: 'recusar', texto: 'Recusar', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Você disse que não. Ninguém insistiu.', memoria: null }) }
    ]
  },
  {
    id: 'hab_parar_fumar', tipo: 'decisao', idade: [20, 90], tema: 'saude', repetir: 5,
    quando: c => c.v.corpo.habitos.fuma,
    titulo: 'O último maço',
    texto: c => `${c.v.corpo.saude < 60 ? 'O fôlego não é mais o mesmo e a tosse de manhã não passa. ' : ''}O maço subiu de preço de novo, e alguém perto de você pediu para você parar.`,
    opcoes: [
      { id: 'parar', texto: 'Parar de vez', comportamento: { disciplina: 2 },
        resolver: c => {
          const conseguiu = c.r.chance(0.3 + Math.max(0, c.v.personalidade.tracos.disciplina) / 150);
          return { texto: conseguiu ? 'Os primeiros meses foram de chiclete e mau humor. Depois, passou.' : 'Durou três semanas. Numa sexta difícil, voltou.', memoria: conseguiu ? 'Parou de fumar.' : 'Tentou parar de fumar e não conseguiu.', tom: conseguiu ? 'bom' : 'ruim', relevancia: conseguiu ? 'marco' : 'cotidiano', efeito: () => { if (conseguiu) { c.v.corpo.habitos.fuma = false; saude(c, 3); } else estresse(c, 4); } };
        } },
      { id: 'reduzir', texto: 'Diminuir', resolver: () => ({ texto: 'Meio maço por dia, depois voltou ao de sempre.', memoria: null }) },
      { id: 'nao', texto: 'Seguir fumando', comportamento: { impulsividade: 1 }, resolver: () => ({ texto: 'Você acendeu mais um.', memoria: null }) }
    ]
  },
  {
    id: 'hab_bets', tipo: 'decisao', idade: [18, 65], tema: 'dinheiro',
    papeis: { quem: P.qualquer(P.amigo, P.genteDe('trabalho')) },
    quando: c => !temFato(c.v, 'aposta_online'),
    titulo: 'O aplicativo',
    texto: c => `${c.p.quem.nome} mostra no celular: apostou vinte reais num jogo de futebol e ganhou trezentos. "É só ter cabeça", diz, e manda um link com bônus de cadastro.`,
    opcoes: [
      { id: 'apostar', texto: 'Baixar e apostar um pouco', comportamento: { impulsividade: 2 },
        resolver: c => {
          const vicia = c.r.chance(0.3 + Math.max(0, c.v.personalidade.tracos.impulsividade) / 150);
          return { texto: vicia ? 'Ganhou nas primeiras. Depois, foi apostando para recuperar.' : 'Perdeu cinquenta reais em uma semana e desinstalou.', memoria: vicia ? 'Começou a apostar em bets pelo celular.' : null, tom: vicia ? 'ruim' : 'neutro', efeito: () => { if (vicia) fato(c, 'aposta_online'); else dinheiro(c, -50); } };
        } },
      { id: 'nao', texto: 'Recusar', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Você guardou o celular.', memoria: null }) }
    ]
  },
  {
    id: 'hab_bets_fundo', tipo: 'decisao', idade: [18, 80], tema: 'dinheiro', repetir: 3, prioritario: true,
    quando: c => temFato(c.v, 'aposta_online') && c.v.t - (c.v.fatos['aposta_online'] ?? c.v.t) >= 12,
    titulo: 'As apostas',
    texto: c => `As apostas já comeram ${c.r.int(8, 40)} mil reais. Você esconde o celular${P.parceiro(c.v)[0] ? ` de ${P.parceiro(c.v)[0].nome}` : ''} e acorda de madrugada para ver resultado de jogo que nem sabe onde é.`,
    opcoes: [
      { id: 'ajuda', texto: 'Procurar ajuda e bloquear os aplicativos', comportamento: { coragem: 1, disciplina: 1 },
        resolver: c => ({ texto: 'Um grupo de apoio às quintas, um amigo guardando o cartão. Um dia de cada vez.', memoria: 'Procurou ajuda para parar de apostar.', relevancia: 'marco', efeito: () => { delete c.v.fatos['aposta_online']; estresse(c, -6); } }) },
      { id: 'recuperar', texto: 'Apostar mais para recuperar', comportamento: { impulsividade: 2 },
        resolver: c => ({ texto: 'Não recuperou.', memoria: null, tom: 'ruim', efeito: () => { dinheiro(c, -Math.max(3000, Math.round(c.v.financas.conta * 0.5))); estresse(c, 12); c.v.fatos['aposta_online'] = c.v.t; } }) }
    ]
  },
  {
    id: 'hab_bebida', tipo: 'decisao', idade: [20, 85], tema: 'saude', repetir: 6,
    quando: c => c.v.corpo.habitos.bebe === 'muito',
    titulo: 'A garrafa',
    texto: c => `${P.parceiro(c.v)[0] ? `${P.parceiro(c.v)[0].nome} contou as garrafas no lixo e sentou para conversar` : 'Você acordou sem lembrar como chegou em casa, de novo'}. Faz tempo que não é só no fim de semana.`,
    opcoes: [
      { id: 'parar', texto: 'Parar de beber', comportamento: { disciplina: 2 },
        resolver: c => {
          const ok = c.r.chance(0.35 + Math.max(0, c.v.personalidade.tracos.disciplina) / 150);
          return { texto: ok ? 'Os primeiros meses foram difíceis. Depois, a cabeça clareou.' : 'Aguentou um mês. Voltou num aniversário.', memoria: ok ? 'Parou de beber.' : null, relevancia: ok ? 'marco' : 'cotidiano', tom: ok ? 'bom' : 'ruim', efeito: () => { if (ok) { c.v.corpo.habitos.bebe = 'nao'; saude(c, 4); } } };
        } },
      { id: 'reduzir', texto: 'Beber só socialmente', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Só em festa, você prometeu.', memoria: null, efeito: () => { if (c.r.chance(0.5)) c.v.corpo.habitos.bebe = 'social'; } }) },
      { id: 'negar', texto: 'Dizer que está tudo sob controle', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Não estava.', memoria: null, efeito: () => { saude(c, -3); for (const par of P.parceiro(c.v)) { const vin = c.v.vinculos[par.id]; vin.tensao = Math.min(100, vin.tensao + 20); } } }) }
    ]
  },

  /* =============================================================== TRABALHO */
  {
    id: 'trab_erro', tipo: 'decisao', idade: [18, 70], tema: 'trabalho', repetir: 8,
    papeis: { colega: P.genteDe('trabalho') },
    quando: c => !!c.v.trabalho.atual && c.v.trabalho.atual.contrato !== 'informal',
    titulo: 'O erro',
    texto: c => `Um erro seu custou caro para a empresa: um pedido errado, um relatório com números trocados. Ninguém sabe de onde veio — e o nome de ${c.p.colega.nome} aparece no mesmo documento.`,
    opcoes: [
      { id: 'assumir', texto: 'Assumir o erro para a chefia', comportamento: { coragem: 1, empatia: 1 },
        resolver: c => ({ texto: 'A chefia ficou brava e depois agradeceu a franqueza. O assunto morreu ali.', memoria: null, efeito: () => { if (c.v.trabalho.atual) c.v.trabalho.atual.desempenho -= 3; prox(c, 'colega', 5); } }) },
      { id: 'calar', texto: 'Ficar quieto e corrigir escondido', comportamento: { impulsividade: 1 },
        resolver: c => c.r.chance(0.3)
          ? { texto: 'Descobriram. Pior que o erro foi o silêncio.', memoria: 'Escondeu um erro no trabalho e foi descoberto.'.replace('descoberto', c.g('descoberto', 'descoberta', 'descoberte')), tom: 'ruim', efeito: () => { if (c.v.trabalho.atual) c.v.trabalho.atual.desempenho -= 15; } }
          : { texto: 'Você consertou antes que alguém notasse.', memoria: null } },
      { id: 'culpar', texto: c => `Deixar que pensem que foi ${c.p.colega.nome}`, comportamento: { empatia: -2, coragem: -1 },
        resolver: c => ({ texto: `${c.p.colega.nome} levou uma advertência. Nunca soube de onde veio.`, memoria: `Deixou ${c.p.colega.nome} levar a culpa por um erro seu.`, efeito: () => { prox(c, 'colega', -5); } }) }
    ]
  },
  {
    id: 'trab_propina', tipo: 'decisao', idade: [22, 70], tema: 'trabalho', repetir: 12,
    quando: c => !!c.v.trabalho.atual && ['publico', 'engenharia', 'financas'].includes(ocupacao(c.v.trabalho.atual.ocupacaoId).trilha) && ocupacao(c.v.trabalho.atual.ocupacaoId).nivel >= 3,
    titulo: 'O envelope',
    texto: () => 'Um empresário que depende de uma assinatura sua convida para um café e, na saída, deixa um envelope grosso em cima da mesa. "Para agilizar."',
    opcoes: [
      { id: 'recusar', texto: 'Devolver o envelope', comportamento: { coragem: 1 },
        resolver: () => ({ texto: 'Você empurrou o envelope de volta. Ele sorriu como quem já ouviu aquilo antes.', memoria: 'Recusou uma propina.' }) },
      { id: 'denunciar', texto: 'Recusar e denunciar à corregedoria', comportamento: { coragem: 2 },
        resolver: c => ({ texto: 'A denúncia virou processo. Você passou a ser olhado de lado por alguns colegas.'.replace('olhado', c.g('olhado', 'olhada', 'olhade')), memoria: 'Denunciou uma tentativa de suborno no trabalho.', relevancia: 'marco', efeito: () => estresse(c, 10) }) },
      { id: 'aceitar', texto: 'Aceitar', comportamento: { generosidade: -1, impulsividade: 1 },
        resolver: c => {
          const pego = c.r.chance(0.3);
          return {
            texto: pego ? 'Meses depois, a Polícia Federal bateu na porta às seis da manhã.' : 'Vinte mil reais em dinheiro vivo, guardados numa caixa de sapato.',
            memoria: pego ? 'Foi investigad' + c.g('o', 'a', 'e') + ' por corrupção e perdeu o cargo.' : null,
            relevancia: pego ? 'marco' : undefined, tom: pego ? 'ruim' : undefined,
            efeito: () => { if (pego) { encerrarEmprego(c.v, 'demitido por corrupção'); estresse(c, 25); fato(c, 'processado_corrupcao'); dinheiro(c, -15000); } else dinheiro(c, 20000); }
          };
        } }
    ]
  },
  {
    id: 'trab_assedio', tipo: 'decisao', idade: [18, 70], tema: 'trabalho', repetir: 8,
    papeis: { colega: P.genteDe('trabalho') },
    quando: c => !!c.v.trabalho.atual,
    titulo: 'Na reunião',
    texto: c => `Na reunião, a chefia humilhou ${c.p.colega.nome} na frente de todo mundo por um atraso de cinco minutos. ${gp(c, 'colega', 'Ele', 'Ela', 'Elu')} saiu da sala com os olhos vermelhos.`,
    opcoes: [
      { id: 'falar', texto: 'Dizer na hora que aquilo passou do ponto', comportamento: { coragem: 2, empatia: 1 },
        resolver: c => ({ texto: 'O silêncio na sala durou uma eternidade. A chefia mudou de assunto.', memoria: `Defendeu ${c.p.colega.nome} numa reunião.`, efeito: () => { prox(c, 'colega', 15); if (c.v.trabalho.atual) c.v.trabalho.atual.desempenho -= 5; }, lembrar: ['colega', 'Você falou por ele na reunião.'.replace('ele', gp(c, 'colega', 'ele', 'ela', 'elu'))] }) },
      { id: 'rh', texto: 'Ir ao RH depois, com discrição', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'O RH anotou tudo. Nada pareceu mudar, mas a chefia passou a medir as palavras.', memoria: null, efeito: () => prox(c, 'colega', 6) }) },
      { id: 'consolar', texto: c => `Procurar ${c.p.colega.nome} no café`, comportamento: { empatia: 1 },
        resolver: c => ({ texto: `${c.p.colega.nome} desabafou por meia hora. Agradeceu por alguém ter perguntado.`, memoria: null, efeito: () => prox(c, 'colega', 10) }) },
      { id: 'nada', texto: 'Olhar para a tela e seguir', resolver: () => ({ texto: 'A reunião seguiu.', memoria: null }) }
    ]
  },

  /* =============================================================== INFÂNCIA */
  {
    id: 'inf_dever_rua', tipo: 'decisao', idade: [7, 12], tema: 'escola', repetir: 3,
    papeis: { amigo: P.qualquer(P.amigo, P.genteDe('vizinhanca')) },
    quando: c => !!c.v.educacao.basica,
    titulo: 'Lá fora',
    texto: c => `${c.p.amigo.nome} está no portão chamando para jogar bola na rua. O dever de matemática está pela metade, e amanhã tem prova.`,
    opcoes: [
      { id: 'dever', texto: 'Terminar o dever primeiro', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `Quando você saiu, o jogo estava acabando. Deu tempo de uma partida.`, memoria: null, efeito: () => { if (c.v.educacao.basica) c.v.educacao.basica.desempenho += 4; } }) },
      { id: 'rua', texto: 'Ir para a rua', comportamento: { sociabilidade: 1, impulsividade: 1 },
        resolver: c => ({ texto: 'Voltou suad' + c.g('o', 'a', 'e') + ', com o joelho ralado e a prova do dia seguinte pela frente.', memoria: null, efeito: () => { prox(c, 'amigo', 6); if (c.v.educacao.basica) c.v.educacao.basica.desempenho -= 4; feliz(c, 3); } }) }
    ]
  },
  {
    id: 'inf_assinatura', tipo: 'decisao', idade: [9, 14], tema: 'escola',
    papeis: { adulto: P.genitorEmCasa },
    quando: c => (c.v.educacao.basica?.desempenho ?? 100) < 55,
    titulo: 'O bilhete',
    texto: c => `A professora mandou um bilhete sobre suas notas, que precisa voltar assinado por ${c.p.adulto.nome}. A assinatura ${gp(c, 'adulto', 'dele', 'dela', 'delu')} é fácil de imitar.`,
    opcoes: [
      { id: 'entregar', texto: c => `Entregar o bilhete para ${c.p.adulto.nome}`, comportamento: { coragem: 1 },
        resolver: c => ({ texto: `${c.p.adulto.nome} leu, suspirou e disse que ia olhar seu caderno todo dia. Olhou.`, memoria: null, efeito: () => { if (c.v.educacao.basica) c.v.educacao.basica.desempenho += 5; } }) },
      { id: 'falsificar', texto: 'Assinar você mesmo', comportamento: { impulsividade: 1, coragem: -1 },
        resolver: c => c.r.chance(0.5)
          ? { texto: `A professora ligou para casa. ${c.p.adulto.nome} descobriu tudo de uma vez.`, memoria: `Falsificou a assinatura de ${c.p.adulto.nome} num bilhete da escola e foi ${c.g('pego', 'pega', 'pegue')}.`, tom: 'ruim', efeito: () => { tensao(c, 'adulto', 30); prox(c, 'adulto', -6); } }
          : { texto: 'Passou. Por enquanto.', memoria: null } }
    ]
  },
  {
    id: 'inf_passarinho', tipo: 'decisao', idade: [5, 12], tema: 'infancia',
    titulo: 'O passarinho',
    texto: () => 'Um filhote de passarinho caiu do ninho no quintal e está piando no chão, com uma asa estranha.',
    opcoes: [
      { id: 'cuidar', texto: 'Levar para dentro e cuidar', comportamento: { empatia: 2 },
        resolver: c => c.r.chance(0.5)
          ? { texto: 'Uma semana de caixa de sapato e papinha no conta-gotas. Um dia, ele voou pela janela.', memoria: 'Cuidou de um filhote de passarinho até ele voar.' }
          : { texto: 'Você cuidou dele três dias. No quarto, ele não acordou.', memoria: 'Tentou salvar um filhote de passarinho, que não sobreviveu.', tom: 'ruim', efeito: () => feliz(c, -3) } },
      { id: 'chamar', texto: 'Chamar um adulto', resolver: () => ({ texto: 'Um adulto colocou o filhote de volta num galho alto.', memoria: null }) },
      { id: 'deixar', texto: 'Deixar onde está', resolver: () => ({ texto: 'No dia seguinte, ele não estava mais lá.', memoria: null }) }
    ]
  },
  {
    id: 'prc_lanche', tipo: 'decisao', idade: [4, 8], tema: 'escola',
    papeis: { colega: P.genteDe('escola') },
    titulo: 'O lanche',
    texto: c => `Na hora do lanche, ${c.p.colega.nome} está sem nada, olhando os outros comerem.`,
    opcoes: [
      { id: 'dividir', texto: 'Dividir o seu', comportamento: { generosidade: 2 },
        resolver: c => ({ texto: `Você deu metade do pão. ${c.p.colega.nome} sentou do seu lado a semana toda.`, memoria: null, efeito: () => prox(c, 'colega', 14) }) },
      { id: 'comer', texto: 'Comer o seu', resolver: () => ({ texto: 'Você comeu o lanche inteiro.', memoria: null }) },
      { id: 'tia', texto: 'Avisar a professora', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `A professora arrumou uma fruta da cozinha para ${c.p.colega.nome}.`, memoria: null, efeito: () => prox(c, 'colega', 5) }) }
    ]
  },

  /* ============================================================= MATURIDADE */
  {
    id: 'mat_novo_amor', tipo: 'decisao', idade: [58, 90], tema: 'amor', repetir: 8,
    quando: c => !P.parceiro(c.v).length && c.idade >= 58 && Object.values(c.v.vinculos).some(v => v.romance?.estagio === 'ex' && !c.v.pessoas[v.pessoaId]?.vivo) || (!P.parceiro(c.v).length && c.r.chance(0.3)),
    titulo: 'Um convite',
    texto: c => `No ${c.v.rotinas.some(r => r.id === 'igreja') ? 'grupo da igreja' : 'baile da terceira idade'}, alguém tem puxado conversa toda semana e hoje convidou você para tomar um café.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar o café', comportamento: { coragem: 1 },
        resolver: c => {
          const g = c.v.eu.atracao === 'mulheres' ? 'feminino' : c.v.eu.atracao === 'homens' ? 'masculino' : c.v.eu.genero === 'feminino' ? 'masculino' : 'feminino';
          const p = criarPessoa(c.v, c.r, { idade: c.r.int(Math.max(55, c.idade - 6), c.idade + 5), municipioId: c.v.moradia.municipioId, genero: g });
          const vin = vincular(c.v, p, { origem: 'rotina', proximidade: 45 });
          vin.romance = { estagio: 'saindo', tEstagio: c.v.t, envolvimento: 62 };
          p.atracao = c.v.eu.genero === 'feminino' ? 'mulheres' : 'homens';
          if (c.v.eu.genero === 'nao_binario') p.atracao = 'ambos';
          return { texto: `O café virou almoço. ${p.nome} ri das mesmas coisas que você.`, memoria: `Começou a sair com ${p.nome}, aos ${c.idade}.`, tom: 'bom', efeito: () => feliz(c, 8) };
        } },
      { id: 'recusar', texto: 'Recusar com gentileza', resolver: () => ({ texto: 'Você agradeceu. Continuaram se cumprimentando toda semana.', memoria: null }) }
    ]
  },
  {
    id: 'mat_bico_aposentado', tipo: 'decisao', idade: [62, 78], tema: 'trabalho', repetir: 10,
    quando: c => !!c.v.trabalho.aposentadoria && !c.v.trabalho.atual && c.v.trabalho.aposentadoria.beneficio < 3000,
    titulo: 'Um trabalho',
    texto: () => 'A aposentadoria não fecha o mês. Um conhecido tem uma banca na feira e precisa de alguém de confiança nas manhãs de sábado e domingo.',
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Os fins de semana voltaram a ter hora para acordar. E dinheiro no bolso.', memoria: 'Voltou a trabalhar na feira depois de aposentado.', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'bico')) c.v.rotinas.push({ id: 'bico', tInicio: c.v.t }); } }) },
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'Você preferiu apertar as contas a acordar cedo.', memoria: null }) }
    ]
  },
  {
    id: 'mat_excursao', tipo: 'decisao', idade: [60, 88], tema: 'lazer', repetir: 4,
    quando: c => c.v.financas.conta + c.v.financas.reserva > 2000,
    titulo: 'A excursão',
    texto: c => `O grupo do bairro está fechando uma excursão de ônibus para ${c.r.pick(['Aparecida', 'Gramado', 'Porto Seguro', 'Caldas Novas', 'Juazeiro do Norte'])}. Quatro dias, R$ 1.500.`,
    opcoes: [
      { id: 'ir', texto: 'Ir', resolver: c => {
        const p = criarPessoa(c.v, c.r, { idade: c.r.int(58, 80), municipioId: c.v.moradia.municipioId });
        const vin = vincular(c.v, p, { origem: 'rotina', proximidade: 38, estagio: 'colega' });
        vin.historia.push({ t: c.v.t, texto: 'Dividiram o banco do ônibus numa excursão.' });
        return { texto: `Quatro dias de ônibus, cantoria e foto em frente a tudo. Você dividiu o banco com ${p.nome}.`, memoria: `Foi numa excursão com o grupo do bairro e conheceu ${p.nome}.`, efeito: () => { dinheiro(c, -1500); feliz(c, 8); } };
      } },
      { id: 'nao', texto: 'Ficar', resolver: () => ({ texto: 'As fotos chegaram pelo grupo.', memoria: null }) }
    ]
  }
];

void idadePessoa;
