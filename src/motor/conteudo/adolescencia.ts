/** Adolescência (12–17). */

import type { Conteudo } from './base';
import * as P from './papeis';
import { dinheiro, estresse, fato, feliz, gp, prox, saude, tensao } from './efeitos';
import { idadePessoa, temFato } from '../nucleo';
import { deslocamento } from '../sistemas/transporte';
import { municipio } from '../dados/lugares';

export const ADOLESCENCIA: Conteudo[] = [
  {
    id: 'ado_celular', tipo: 'acontecimento', idade: [10, 14], tema: 'infancia',
    papeis: { quem: P.qualquer(P.genitorEmCasa, P.avo) },
    narrar: c => ({
      texto: ['vulneravel', 'trabalhadora'].includes(c.v.origem.classe)
        ? `Ganhou o primeiro celular: um usado, de tela trincada, que foi de ${c.p.quem.nome}.`
        : `Ganhou o primeiro celular de ${c.p.quem.nome}, com uma lista de regras que durou uma semana.`,
      relevancia: 'cotidiano'
    })
  },
  {
    id: 'ado_festa', tipo: 'decisao', idade: [14, 17], tema: 'amizade', repetir: 2,
    papeis: { amigo: P.qualquer(P.amigo, P.genteDe('escola')), adulto: P.genitorEmCasa },
    titulo: 'A festa',
    texto: c => `${c.p.amigo.nome} vai numa festa na casa de alguém do terceiro ano, sem adulto nenhum. ${c.p.adulto.nome} já disse que você não vai.`,
    opcoes: [
      { id: 'escondido', texto: 'Dizer que vai dormir na casa de um amigo e ir', comportamento: { impulsividade: 2, coragem: 1 },
        resolver: c => c.r.chance(0.35)
          ? { texto: `${c.p.adulto.nome} ligou para a casa do "amigo". A volta para casa foi longa.`, memoria: `Foi descobert${c.g('o', 'a', 'e')} mentindo para ir a uma festa.`, tom: 'ruim', efeito: () => { tensao(c, 'adulto', 30); prox(c, 'adulto', -6); prox(c, 'amigo', 6); } }
          : { texto: `A festa foi até as quatro. Ninguém em casa ficou sabendo.`, memoria: `Foi escondid${c.g('o', 'a', 'e')} a uma festa com ${c.p.amigo.nome}.`, efeito: () => { feliz(c, 5); prox(c, 'amigo', 10); } } },
      { id: 'negociar', texto: c => `Negociar com ${c.p.adulto.nome}: ir e voltar num horário combinado`, comportamento: { disciplina: 1 },
        resolver: c => c.r.chance(0.5)
          ? { texto: `${c.p.adulto.nome} aceitou, com a condição de buscar você à meia-noite em ponto.`, memoria: null, efeito: () => { prox(c, 'adulto', 3); prox(c, 'amigo', 5); } }
          : { texto: `${c.p.adulto.nome} não cedeu. Você ficou em casa vendo os stories da festa.`, memoria: null, efeito: () => feliz(c, -2) } },
      { id: 'ficar', texto: 'Ficar em casa', resolver: () => ({ texto: 'Você ficou. Na segunda, só se falava dessa festa.', memoria: null }) }
    ]
  },
  {
    id: 'ado_bebida', tipo: 'decisao', idade: [14, 17], tema: 'amizade', repetir: 3,
    papeis: { amigo: P.amigo },
    titulo: 'O copo',
    texto: c => `Numa pracinha, sexta à noite, ${c.p.amigo.nome} estende um copo de plástico com vodca e refrigerante. Todo mundo está bebendo.`,
    opcoes: [
      { id: 'beber', texto: 'Beber', comportamento: { impulsividade: 1, sociabilidade: 1 },
        resolver: c => c.r.chance(0.25)
          ? { texto: 'Foi o primeiro e o último copo da noite: você passou mal atrás de uma árvore e alguém teve de levar você para casa.', memoria: 'A primeira bebedeira terminou com alguém levando você para casa.', tom: 'ruim', efeito: () => { saude(c, -2); fato(c, 'bebeu_adolescente'); } }
          : { texto: 'A noite ficou mais barulhenta e mais engraçada.', memoria: null, efeito: () => { prox(c, 'amigo', 5); fato(c, 'bebeu_adolescente'); if (c.v.corpo.habitos.bebe === 'nao') c.v.corpo.habitos.bebe = 'social'; } } },
      { id: 'recusar', texto: 'Recusar e ficar no refrigerante', comportamento: { disciplina: 1, independencia: 1 },
        resolver: c => ({ texto: `${c.p.amigo.nome} deu de ombros. Ninguém insistiu tanto quanto você imaginava.`, memoria: null }) },
      { id: 'embora', texto: 'Inventar uma desculpa e ir embora', resolver: () => ({ texto: 'Você foi para casa cedo.', memoria: null }) }
    ]
  },
  {
    id: 'ado_amigo_problema', tipo: 'decisao', idade: [12, 17], tema: 'amizade',
    papeis: { amigo: P.amigo },
    titulo: c => `${c.p.amigo.nome}`,
    texto: c => `${c.p.amigo.nome} anda estranh${gp(c, 'amigo', 'o', 'a')}: parou de comer no recreio e tem marcas no braço que esconde com a manga. Hoje pediu segredo sobre isso.`,
    opcoes: [
      { id: 'adulto', texto: 'Contar para um adulto de confiança', comportamento: { coragem: 1, empatia: 2 },
        resolver: c => ({ texto: `${c.p.amigo.nome} ficou meses sem falar com você. Depois, começou a fazer acompanhamento, e um dia agradeceu.`, memoria: `Quebrou um segredo de ${c.p.amigo.nome} para pedir ajuda a um adulto.`, efeito: () => { prox(c, 'amigo', -10); c.v.vinculos[c.p.amigo.id].historia.push({ t: c.v.t, texto: 'Você pediu ajuda por ele quando ele precisava.'.replace(/ele/g, gp(c, 'amigo', 'ele', 'ela')) }); } }) },
      { id: 'segredo', texto: 'Guardar o segredo e ficar por perto', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `Você passou a esperar ${c.p.amigo.nome} na saída todo dia. Não sabe se foi o suficiente.`, memoria: null, efeito: () => prox(c, 'amigo', 10) }) },
      { id: 'afastar', texto: 'Se afastar, sem saber o que fazer', resolver: c => ({ texto: `Aos poucos, vocês pararam de se falar.`, memoria: null, efeito: () => prox(c, 'amigo', -20) }) }
    ]
  },
  {
    id: 'ado_briga_pais', tipo: 'decisao', idade: [13, 17], tema: 'familia', repetir: 3,
    papeis: { adulto: P.genitorEmCasa },
    titulo: 'Porta fechada',
    texto: c => `${c.p.adulto.nome} entrou no seu quarto sem bater, reclamando das notas, da bagunça e do celular — tudo de uma vez.`,
    opcoes: [
      { id: 'gritar', texto: 'Gritar de volta', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'A discussão foi ouvida pelo prédio inteiro. Jantaram em silêncio.', memoria: null, efeito: () => { tensao(c, 'adulto', 20); prox(c, 'adulto', -4); } }) },
      { id: 'ouvir', texto: 'Ouvir e responder depois, com calma', comportamento: { disciplina: 1, empatia: 1 }, resolver: c => ({ texto: `Mais tarde, ${c.p.adulto.nome} bateu na porta para pedir desculpas pelo tom.`, memoria: null, efeito: () => { tensao(c, 'adulto', -10); prox(c, 'adulto', 4); } }) },
      { id: 'fones', texto: 'Colocar os fones e ignorar', comportamento: { independencia: 1 }, resolver: c => ({ texto: `${c.p.adulto.nome} saiu batendo a porta.`, memoria: null, efeito: () => tensao(c, 'adulto', 12) }) }
    ]
  },
  {
    id: 'ado_primeiro_trabalho', tipo: 'decisao', idade: [14, 17], tema: 'trabalho',
    papeis: { conhecido: P.qualquer(P.tioOuPrimo, P.genitor, P.amigo) },
    quando: c => !c.v.trabalho.atual && ['vulneravel', 'trabalhadora', 'media_baixa'].includes(c.v.origem.classe),
    titulo: 'Um trocado',
    texto: c => `${c.p.conhecido.nome} arrumou um bico para você nos fins de semana: ajudar numa ${c.r.pick(['barraca de feira', 'lanchonete', 'loja de conserto de celular', 'festa infantil'])}. Paga pouco, em dinheiro vivo.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { independencia: 1, disciplina: 1 },
        resolver: c => ({ texto: 'Os sábados passaram a ser de trabalho. O primeiro dinheiro foi quase todo numa roupa.', memoria: 'O primeiro dinheiro veio de um bico nos fins de semana.', efeito: () => { dinheiro(c, 1800); fato(c, 'bico_adolescente'); estresse(c, 3); } }) },
      { id: 'recusar', texto: 'Recusar e manter os fins de semana', resolver: () => ({ texto: 'Os sábados continuaram seus.', memoria: null }) }
    ]
  },
  {
    id: 'ado_assalto', tipo: 'acontecimento', idade: [12, 70], tema: 'lugar', repetir: 10,
    quando: c => ['metropole', 'metropolitana', 'capital'].includes(municipio(c.v.moradia.municipioId).perfil),
    narrar: c => ({
      texto: c.vezes > 0
        ? c.r.pick(['Mais um celular levado na rua. Você passou a andar com um aparelho velho só para isso.', deslocamento(c.v)?.modo === 'carro' ? 'Outro assalto, dessa vez no sinal fechado, com o vidro aberto.' : deslocamento(c.v)?.modo === 'moto' ? 'Outro assalto, dessa vez parado no sinal, em cima da moto.' : 'Outro assalto, dessa vez dentro do ônibus.', 'Levaram sua carteira num arrastão perto do terminal.'])
        : c.idade < 18 ? 'Foi assaltad' + c.g('o', 'a', 'e') + ' no ponto de ônibus voltando da escola. Levaram o celular.' : 'Levaram seu celular num assalto rápido, à luz do dia, numa esquina movimentada.',
      relevancia: 'biografia', tom: 'ruim',
      efeito: () => { estresse(c, 8); if (c.idade >= 18) dinheiro(c, -1500); }
    })
  },
  {
    id: 'ado_vestibular_pressao', tipo: 'acontecimento', idade: [16, 17], tema: 'estudo',
    papeis: { quem: P.genitorEmCasa },
    quando: c => c.v.educacao.basica?.etapa === 'medio' && ['media', 'alta'].includes(c.v.origem.classe),
    narrar: c => ({ texto: `${c.p.quem.nome} colou na geladeira uma lista de universidades e notas de corte.`, relevancia: 'cotidiano', efeito: () => estresse(c, 5) })
  },
  {
    id: 'ado_rival', tipo: 'decisao', idade: [11, 17], tema: 'escola', repetir: 3,
    papeis: { rival: P.genteDe('escola') },
    quando: c => !!c.v.educacao.basica,
    titulo: 'O empurrão',
    texto: c => `Na saída, ${c.p.rival.nome} esbarra em você de propósito e derruba seu material na poça. Tem gente olhando.`,
    opcoes: [
      { id: 'revidar', texto: 'Empurrar de volta', comportamento: { impulsividade: 1, coragem: 1 },
        resolver: c => ({ texto: `Virou briga de rolar no chão. Os dois foram suspensos por dois dias.`, memoria: `Brigou com ${c.p.rival.nome} na saída da escola e foi suspens${c.g('o', 'a', 'e')}.`, efeito: () => { tensao(c, 'rival', 40); prox(c, 'rival', -15); } }) },
      { id: 'ignorar', texto: 'Juntar as coisas e ir embora', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você juntou o caderno molhado e foi embora sem olhar para trás.', memoria: null, efeito: () => { tensao(c, 'rival', 10); estresse(c, 3); } }) },
      { id: 'enfrentar', texto: 'Encarar e perguntar qual é o problema', comportamento: { coragem: 1 },
        resolver: c => ({ texto: `${c.p.rival.nome} não esperava a pergunta. Resmungou alguma coisa e foi embora.`, memoria: null }) }
    ]
  },
  {
    id: 'ado_vaquinha', tipo: 'decisao', idade: [12, 17], tema: 'amizade',
    papeis: { amigo: P.amigo },
    titulo: 'A vaquinha',
    texto: c => `A mãe de ${c.p.amigo.nome} ficou doente e a turma está fazendo uma vaquinha. Você tem R$ ${Math.max(20, Math.round(c.v.financas.conta))} guardados.`,
    quando: c => c.v.financas.conta >= 20,
    opcoes: [
      { id: 'tudo', texto: 'Dar quase tudo', comportamento: { generosidade: 2 }, resolver: c => ({ texto: `${c.p.amigo.nome} não soube o que dizer.`, memoria: `Deu quase todo o dinheiro guardado para a vaquinha da mãe de ${c.p.amigo.nome}.`, efeito: () => { dinheiro(c, -Math.round(c.v.financas.conta * 0.8)); prox(c, 'amigo', 12); } }) },
      { id: 'pouco', texto: 'Dar um pouco', comportamento: { generosidade: 1 }, resolver: c => ({ texto: 'Você colocou uma parte. Toda ajuda somou.', memoria: null, efeito: () => { dinheiro(c, -Math.round(c.v.financas.conta * 0.2)); prox(c, 'amigo', 4); } }) },
      { id: 'nada', texto: 'Não dar nada', comportamento: { generosidade: -1 }, resolver: () => ({ texto: 'Você guardou o dinheiro.', memoria: null }) }
    ]
  },
  {
    id: 'ado_irmao_mais_velho_sai', tipo: 'acontecimento', idade: [10, 17], tema: 'familia',
    papeis: { irmao: P.comIdade(P.irmao, 18, 40) },
    quando: c => temFato(c.v, `saiu_de_casa_${c.p.irmao.id}`) && c.v.t - (c.v.fatos[`saiu_de_casa_${c.p.irmao.id}`] ?? 0) <= 12,
    narrar: c => ({ texto: `Com ${c.p.irmao.nome} fora de casa, o quarto ${gp(c, 'irmao', 'dele', 'dela')} virou seu.`, relevancia: 'cotidiano' })
  },
  {
    id: 'ado_gravidez_colega', tipo: 'acontecimento', idade: [14, 17], tema: 'escola',
    papeis: { colega: P.genteDe('escola') },
    quando: c => c.p.colega.genero === 'feminino',
    narrar: c => ({ texto: `${c.p.colega.nome}, da sua turma, engravidou aos ${idadePessoa(c.v, c.p.colega)} e parou de ir à escola no segundo semestre.`, relevancia: 'cotidiano', efeito: () => { c.v.vinculos[c.p.colega.id].ambiente = undefined; } })
  }
];
