/**
 * O mundo, que acontece sem pedir licença: a economia do país, a cidade,
 * o calendário. E mais cenas de adolescência e juventude.
 */

import type { Conteudo, Ctx } from './base';
import * as P from './papeis';
import { dinheiro, estresse, fato, feliz, gp, prox, tensao } from './efeitos';
import { emRecessao, idadePessoa, temFato } from '../nucleo';
import { municipio } from '../dados/lugares';
import { criarPessoa, vincular } from '../pessoas';
import { anoDe } from '../tempo';
import { curso } from '../dados/cursos';


/** A recessão contada a partir de onde a pessoa está: empregada, estudando, aposentada. */
function textoDeRecessao(c: Ctx): string {
  const v = c.v;
  const e = v.trabalho.atual;
  const abertura = c.vezes === 0 ? 'O país entrou em recessão' : c.r.pick(['Mais uma crise econômica', 'O país voltou a entrar em recessão', 'Veio outra recessão']);
  if (v.trabalho.aposentadoria) return `${abertura}. A aposentadoria não mudou, mas o supermercado sim: a lista do mês encolheu.`;
  if (e && e.contrato === 'servidor') return `${abertura}. No serviço público o emprego ficou, mas o reajuste foi congelado e os colegas de fora começaram a ser demitidos.`;
  if (e && (e.contrato === 'autonomo' || e.contrato === 'informal')) return `${abertura}. Os clientes sumiram primeiro: quem pagava à vista passou a pedir fiado.`;
  if (e) return `${abertura}. Em ${e.empregador}, a palavra "corte" começou a aparecer nas reuniões.`;
  if (v.educacao.matricula) return `${abertura}. Os estágios minguaram, e os veteranos formados voltaram para a casa dos pais.`;
  return `${abertura}: fábricas demitindo, lojas fechando, e as vagas que sobraram pedindo experiência.`;
}

export const MUNDO: Conteudo[] = [
  /* ============================================================== ECONOMIA */
  {
    id: 'mun_recessao', tipo: 'acontecimento', idade: [6, 110], tema: 'dinheiro', repetir: 7, peso: 0.6,
    quando: c => !emRecessao(c.v),
    narrar: c => ({
      texto: c.idade < 16
        ? 'O país entrou em recessão. Em casa, a palavra apareceu no jornal da noite e depois na conta do mercado.'
        : textoDeRecessao(c),
      relevancia: 'biografia', tom: 'ruim',
      efeito: () => { c.v.fatos['recessao_ate'] = c.v.t + 24; estresse(c, 5); }
    })
  },
  {
    id: 'mun_recuperacao', tipo: 'acontecimento', idade: [6, 110], tema: 'dinheiro', repetir: 7, prioritario: true,
    quando: c => c.v.fatos['recessao_ate'] !== undefined && !emRecessao(c.v) && c.v.t - (c.v.fatos['recessao_ate'] ?? 0) < 12,
    narrar: c => ({ texto: [
      'A economia voltou a respirar. Os anúncios de vaga reapareceram nos postes.',
      'A crise foi passando sem aviso: o shopping encheu de novo, as obras paradas voltaram a ter barulho.',
      'O jornal anunciou o fim da recessão. Na rua, a notícia chegou em forma de "contrata-se" na vitrine.',
      'Depois de dois anos de aperto, o comércio voltou a contratar e o preço do dólar parou de ser assunto no almoço.'
    ][(c.vezes + c.r.int(0, 1)) % 4], relevancia: 'cotidiano', efeito: () => { delete c.v.fatos['recessao_ate']; } })
  },
  {
    id: 'mun_chuva_cidade', tipo: 'acontecimento', idade: [5, 110], tema: 'lugar', repetir: 10,
    quando: c => ['metropole', 'metropolitana', 'capital'].includes(municipio(c.v.moradia.municipioId).perfil),
    narrar: c => ({ texto: `Uma tempestade parou ${municipio(c.v.moradia.municipioId).nome}: avenidas alagadas, ônibus parados, gente dormindo no trabalho.`, relevancia: 'cotidiano' })
  },
  {
    id: 'mun_seca', tipo: 'acontecimento', idade: [5, 110], tema: 'lugar', repetir: 10,
    quando: c => municipio(c.v.moradia.municipioId).regiao === 'Nordeste' && municipio(c.v.moradia.municipioId).perfil !== 'metropole',
    narrar: c => ({ texto: [
      'Um ano de seca: caminhão-pipa na rua, torneira seca dia sim, dia não, e o preço do feijão lá em cima.',
      'A chuva não veio de novo. O açude baixou até aparecer a torre da igreja velha, e a água passou a ser racionada.',
      'Seca outra vez. Quem tinha cisterna dividia com o vizinho; quem não tinha esperava o carro-pipa da prefeitura.',
      'O sertão ficou cinza. Na feira, o preço do milho e da farinha dobrou em poucos meses.'
    ][(c.vezes + c.r.int(0, 1)) % 4], relevancia: 'cotidiano', efeito: () => estresse(c, 3) })
  },
  {
    id: 'mun_sao_joao', tipo: 'acontecimento', idade: [5, 90], tema: 'lazer', repetir: 6,
    quando: c => municipio(c.v.moradia.municipioId).regiao === 'Nordeste',
    narrar: c => ({ texto: `O São João de ${municipio(c.v.moradia.municipioId).nome} tomou a cidade por duas semanas: forró até de manhã, milho assado e quadrilha na praça.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => feliz(c, 3) })
  },
  {
    id: 'mun_carnaval', tipo: 'decisao', idade: [16, 60], tema: 'lazer', repetir: 3,
    papeis: { amigo: P.amigo },
    quando: c => ['metropole', 'capital', 'metropolitana'].includes(municipio(c.v.moradia.municipioId).perfil),
    titulo: 'Carnaval',
    texto: c => `${c.p.amigo.nome} chama para os quatro dias de bloco. Você também tem a opção de viajar para o interior e descansar.`,
    opcoes: [
      { id: 'bloco', texto: 'Cair no bloco', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Quatro dias de fantasia improvisada, marchinha e pé inchado.', memoria: null, efeito: () => { prox(c, 'amigo', 8); feliz(c, 5); dinheiro(c, -300); } }) },
      { id: 'descanso', texto: 'Descansar longe da folia', resolver: c => ({ texto: 'Rede, silêncio e cidade vazia.', memoria: null, efeito: () => estresse(c, -6) }) }
    ]
  },

  /* =========================================================== ADOLESCÊNCIA */
  {
    id: 'ado_professor', tipo: 'acontecimento', idade: [12, 17], tema: 'escola',
    quando: c => !!c.v.educacao.basica,
    narrar: c => {
      const materia = c.r.pick(['História', 'Matemática', 'Português', 'Biologia', 'Química', 'Artes']);
      // Um professor marcante acende o gosto pela matéria dele.
      const frente = ({ História: 'humanas', Matemática: 'exatas', Português: 'linguagens', Biologia: 'ciencias', Química: 'ciencias', Artes: 'desenho' } as const)[materia as 'História'];
      const fr = c.v.caminhos.frentes[frente];
      if (fr) fr.interesse = Math.min(100, fr.interesse + 15);
      const p = criarPessoa(c.v, c.r, { idade: c.r.int(28, 58), municipioId: c.v.moradia.municipioId });
      p.ocupacao = p.genero === 'feminino' ? `professora de ${materia}` : `professor de ${materia}`;
      const vin = vincular(c.v, p, { origem: 'escola', proximidade: 35, convivio: ['escola'], estagio: 'colega' });
      vin.ambiente = `escola:${c.v.moradia.municipioId}:${c.v.educacao.basica!.rede}:${c.v.educacao.basica!.etapa === 'medio' ? 'medio' : 'fund2'}`;
      vin.historia.push({ t: c.v.t, texto: `${p.genero === 'feminino' ? 'A professora' : 'O professor'} que marcou a escola.` });
      return { texto: `${p.nome}, ${p.genero === 'feminino' ? 'a professora' : 'o professor'} de ${materia}, devolveu uma prova sua com um bilhete: "você tem jeito para isso". Ninguém tinha dito aquilo antes.`, relevancia: 'biografia', tom: 'bom', efeito: () => { c.v.mente.cognicao = Math.min(100, c.v.mente.cognicao + 2); } };
    }
  },
  {
    id: 'ado_excursao', tipo: 'acontecimento', idade: [11, 17], tema: 'escola',
    papeis: { colega: P.genteDe('escola') },
    quando: c => !!c.v.educacao.basica,
    narrar: c => ({
      texto: `A excursão da escola foi ${c.r.pick(['a um museu na capital', 'a um parque aquático', 'a uma usina hidrelétrica', 'a um sítio arqueológico', 'a uma fazenda'])}. Na volta, você sentou do lado de ${c.p.colega.nome} no ônibus e conversaram a viagem inteira.`,
      relevancia: 'cotidiano', efeito: () => prox(c, 'colega', 10)
    })
  },
  {
    id: 'ado_quinze', tipo: 'decisao', idade: [14, 15], tema: 'familia', biografica: true,
    papeis: { adulto: P.genitorEmCasa },
    quando: c => c.v.eu.genero === 'feminino' || c.v.eu.tratamento === 'feminino',
    titulo: 'Quinze anos',
    texto: c => `${c.p.adulto.nome} anda fazendo contas: quer saber o que você prefere para os quinze anos.`,
    opcoes: [
      { id: 'festa', texto: 'Uma festa, com valsa e tudo', disponivel: c => (['vulneravel'].includes(c.v.origem.classe) ? 'Não cabe no orçamento da casa.' : true),
        resolver: c => ({ texto: 'Teve vestido, valsa com o pai e o salão de festas do bairro lotado.', memoria: 'Teve festa de quinze anos, com valsa.', relevancia: 'biografia', efeito: () => { prox(c, 'adulto', 6); feliz(c, 6); } }) },
      { id: 'viagem', texto: 'Uma viagem', disponivel: c => (['vulneravel', 'trabalhadora'].includes(c.v.origem.classe) ? 'Não cabe no orçamento da casa.' : true),
        resolver: () => ({ texto: 'Em vez de festa, uma viagem de uma semana com a família.', memoria: 'Nos quinze anos, preferiu uma viagem a uma festa.', relevancia: 'biografia' }) },
      { id: 'simples', texto: 'Um bolo em casa com as amigas', resolver: c => ({ texto: 'Bolo, refrigerante e as amigas até tarde.', memoria: 'Comemorou os quinze anos em casa, com as amigas.', efeito: () => feliz(c, 3) }) }
    ]
  },
  {
    id: 'ado_mudar_escola', tipo: 'acontecimento', idade: [11, 16], tema: 'escola',
    papeis: { amigo: P.amigo },
    quando: c => !!c.v.educacao.basica && c.v.vinculos[c.p.amigo.id].convivio.includes('escola'),
    narrar: c => ({
      texto: `${c.p.amigo.nome} mudou de turno na escola. Vocês passaram a se ver só nos fins de semana.`,
      relevancia: 'cotidiano', efeito: () => { c.v.vinculos[c.p.amigo.id].ambiente = undefined; }
    })
  },
  {
    id: 'ado_show', tipo: 'decisao', idade: [14, 19], tema: 'lazer', repetir: 3,
    papeis: { amigo: P.amigo, adulto: P.genitorEmCasa },
    titulo: 'O show',
    texto: c => `A banda preferida de ${c.p.amigo.nome} vai tocar na cidade. O ingresso custa R$ 180 e você tem R$ ${Math.max(0, Math.round(c.v.financas.conta))}.`,
    opcoes: [
      { id: 'juntar', texto: 'Juntar o dinheiro e ir', disponivel: c => (c.v.financas.conta >= 180 ? true : 'Você não tem esse dinheiro.'),
        resolver: c => ({ texto: 'Grade da frente, garganta rouca, celular sem bateria.', memoria: `Foi ao show com ${c.p.amigo.nome}.`, efeito: () => { dinheiro(c, -180); prox(c, 'amigo', 8); feliz(c, 6); } }) },
      { id: 'pedir', texto: c => `Pedir o dinheiro para ${c.p.adulto.nome}`, resolver: c => c.v.origem.classe === 'vulneravel' || c.r.chance(0.4)
        ? { texto: `${c.p.adulto.nome} disse que não dava. Você viu o show pelos stories.`, memoria: null }
        : { texto: `${c.p.adulto.nome} deu o dinheiro, com a condição de você arrumar o quarto por um mês.`, memoria: null, efeito: () => { prox(c, 'amigo', 8); feliz(c, 5); } } },
      { id: 'nao', texto: 'Deixar para lá', resolver: () => ({ texto: 'Você ficou em casa.', memoria: null }) }
    ]
  },

  /* =============================================================== JUVENTUDE */
  {
    id: 'jov_primeira_noite', tipo: 'acontecimento', idade: [17, 35], tema: 'casa', repetir: 0, prioritario: true,
    quando: c => c.v.moradia.tipo !== 'pais' && c.v.moradia.tipo !== 'parente' && c.v.t - c.v.moradia.tInicio === 0 && !temFato(c.v, 'primeira_noite_fora'),
    narrar: c => ({
      texto: c.r.pick(['A primeira noite na casa nova foi num colchão no chão, comendo miojo na panela, com um silêncio estranho.', 'Na primeira noite fora de casa, a geladeira tinha só água e um pote de margarina. Ainda assim, era sua.']),
      relevancia: 'biografia', efeito: () => fato(c, 'primeira_noite_fora')
    })
  },
  {
    id: 'jov_greve_federal', tipo: 'acontecimento', idade: [17, 40], tema: 'estudo', repetir: 4,
    quando: c => !!c.v.educacao.matricula && c.v.educacao.matricula.rede === 'publica' && c.v.educacao.matricula.modalidade === 'presencial',
    narrar: c => ({
      texto: 'Os professores da universidade entraram em greve por quatro meses. O semestre se arrastou até o ano seguinte.',
      relevancia: 'cotidiano', tom: 'ruim', efeito: () => { if (c.v.educacao.matricula) c.v.educacao.matricula.mesesRestantes += 4; }
    })
  },
  {
    id: 'jov_tcc', tipo: 'decisao', idade: [20, 40], tema: 'estudo',
    quando: c => !!c.v.educacao.matricula && c.v.educacao.matricula.mesesRestantes <= 12 && curso(c.v.educacao.matricula.cursoId).nivel === 'superior',
    titulo: 'O TCC',
    texto: () => 'Faltam dois meses para entregar o TCC e você escreveu três páginas. Um conhecido diz que "resolve" o trabalho inteiro por R$ 1.500.',
    opcoes: [
      { id: 'escrever', texto: 'Virar as noites e escrever', comportamento: { disciplina: 2 },
        resolver: c => ({ texto: 'Dois meses de café e madrugada. A banca aprovou com elogios a um capítulo.', memoria: null, efeito: () => estresse(c, 8) }) },
      { id: 'comprar', texto: 'Pagar para fazerem', comportamento: { impulsividade: 1, disciplina: -1 },
        resolver: c => c.r.chance(0.25)
          ? { texto: 'O programa antiplágio da faculdade pegou. Reprovação no TCC e um semestre a mais.', memoria: 'Comprou um TCC pronto e foi pego pelo antiplágio.'.replace('pego', c.g('pego', 'pega', 'pegue')), tom: 'ruim', efeito: () => { dinheiro(c, -1500); if (c.v.educacao.matricula) c.v.educacao.matricula.mesesRestantes += 6; } }
          : { texto: 'Você decorou o trabalho para a apresentação. Passou.', memoria: null, efeito: () => dinheiro(c, -1500) } },
      { id: 'adiar', texto: 'Pedir para adiar a entrega', resolver: c => ({ texto: 'O orientador concedeu mais um semestre.', memoria: null, efeito: () => { if (c.v.educacao.matricula) c.v.educacao.matricula.mesesRestantes += 6; } }) }
    ]
  },
  {
    id: 'jov_aviao', tipo: 'acontecimento', idade: [16, 90], tema: 'lazer',
    quando: c => c.v.financas.conta > 3000 || ['media', 'alta'].includes(c.v.origem.classe),
    narrar: c => ({ texto: `A primeira viagem de avião foi para ${c.r.pick(['visitar um parente em São Paulo', 'um casamento em Recife', 'uma entrevista de emprego em Brasília', 'as férias em Salvador', 'um congresso em Porto Alegre'])}. Você não tirou o rosto da janela.`, relevancia: 'biografia', tom: 'bom' })
  },
  {
    id: 'jov_formatura_amigo', tipo: 'acontecimento', idade: [20, 32], tema: 'amizade',
    papeis: { amigo: P.comIdade(P.amigo, 20, 35) },
    narrar: c => ({ texto: `${c.p.amigo.nome} se formou${c.r.chance(0.5) ? ' — primeir' + gp(c, 'amigo', 'o', 'a', 'e') + ' da família' : ''}. Você gritou o nome ${gp(c, 'amigo', 'dele', 'dela', 'delu')} da plateia.`, relevancia: 'cotidiano', efeito: () => prox(c, 'amigo', 5) })
  },

  /* ================================================================= ADULTO */
  {
    id: 'adu_reuniao_turma', tipo: 'acontecimento', idade: [35, 70], tema: 'amizade', repetir: 10,
    papeis: { antigo: v => Object.values(v.vinculos).filter(x => !x.parentesco && (x.ambiente ?? '').startsWith('escola:') && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]) },
    narrar: c => ({
      texto: `Teve reunião da turma da escola, ${c.idade - 17} anos depois. ${c.p.antigo.nome} ${c.r.pick(['estava igualzinh' + gp(c, 'antigo', 'o', 'a', 'e'), 'mostrou fotos dos filhos para todo mundo', 'chorou no discurso', 'chegou por último, como sempre'])}.`,
      relevancia: 'cotidiano', efeito: () => { const vin = c.v.vinculos[c.p.antigo.id]; vin.proximidade = Math.min(100, vin.proximidade + 10); vin.tUltimoContato = c.v.t; }
    })
  },
  {
    id: 'adu_carro_roubado', tipo: 'acontecimento', idade: [18, 90], tema: 'lugar', repetir: 15,
    quando: c => c.v.financas.bens.some(b => b.tipo === 'veiculo' && !b.modeloId.startsWith('bike')) && ['metropole', 'metropolitana'].includes(municipio(c.v.moradia.municipioId).perfil),
    peso: 0.5,
    narrar: c => {
      const vei = c.v.financas.bens.find(b => b.tipo === 'veiculo' && !b.modeloId.startsWith('bike'))!;
      const seguro = vei.modeloId.startsWith('carro');
      return {
        texto: seguro ? `Roubaram o ${vei.nome} na porta de casa, de madrugada. O seguro pagou, depois de três meses de papelada.` : `Levaram a ${vei.nome} estacionada na rua. Moto sem seguro: prejuízo inteiro.`,
        relevancia: 'biografia', tom: 'ruim',
        efeito: () => { c.v.financas.bens = c.v.financas.bens.filter(b => b.id !== vei.id); if (seguro) dinheiro(c, Math.round(vei.valor * 0.9)); estresse(c, 8); c.v.financas.dividas = c.v.financas.dividas.filter(d => d.bemId !== vei.id || !seguro); }
      };
    }
  },
  {
    id: 'adu_reforma', tipo: 'decisao', idade: [28, 80], tema: 'casa', repetir: 12,
    quando: c => c.v.moradia.tipo === 'propria' && c.v.financas.conta + c.v.financas.reserva > 15000,
    titulo: 'A reforma',
    texto: () => 'A casa está pedindo reforma: banheiro velho, pintura descascando, a cozinha que nunca foi como você queria.',
    opcoes: [
      { id: 'grande', texto: 'Reforma completa', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Quatro meses de poeira, pedreiro que sumiu na metade e uma casa que parece outra.', memoria: 'Reformou a casa inteira.', efeito: () => { dinheiro(c, -35000); const im = c.v.financas.bens.find(b => b.id === c.v.moradia.imovelId); if (im) { im.valor = Math.round(im.valor * 1.08); im.estado = 100; } feliz(c, 5); } }) },
      { id: 'pequena', texto: 'Só o necessário', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Banheiro novo e pintura. O resto fica para depois.', memoria: null, efeito: () => { dinheiro(c, -9000); const im = c.v.financas.bens.find(b => b.id === c.v.moradia.imovelId); if (im) im.estado = Math.min(100, im.estado + 30); } }) },
      { id: 'nada', texto: 'Deixar como está', resolver: () => ({ texto: 'A casa continuou do jeito que estava.', memoria: null }) }
    ]
  },
  {
    id: 'adu_check_up', tipo: 'decisao', idade: [40, 90], tema: 'saude', repetir: 5,
    quando: c => c.v.corpo.condicoes.length === 0,
    titulo: 'O check-up',
    texto: c => `${P.parceiro(c.v)[0] ? `${P.parceiro(c.v)[0].nome} insiste` : 'O posto de saúde mandou uma carta insistindo'}: faz anos que você não faz exame nenhum.`,
    opcoes: [
      { id: 'fazer', texto: 'Marcar os exames', comportamento: { disciplina: 1 },
        resolver: c => {
          const achou = c.r.chance(0.25);
          return { texto: achou ? 'Os exames acharam uma pressão alta no começo. Remédio barato, dieta, caminhada.' : 'Tudo em ordem, disse o médico — por enquanto.', memoria: achou ? 'Descobriu pressão alta num check-up, a tempo de tratar.' : null, efeito: () => { if (achou) c.v.corpo.condicoes.push({ id: 'hipertensao', nome: 'pressão alta', tInicio: c.v.t, cronica: true, gravidade: 1, tratando: true }); } };
        } },
      { id: 'adiar', texto: 'Deixar para depois', resolver: () => ({ texto: 'A carta foi para a gaveta.', memoria: null }) }
    ]
  },
  {
    id: 'adu_amigo_divorcio', tipo: 'decisao', idade: [30, 70], tema: 'amizade', repetir: 10,
    papeis: { amigo: P.comIdade(P.amigo, 28, 75) },
    quando: c => !!c.p.amigo.parceiroId,
    titulo: c => `${c.p.amigo.nome}`,
    texto: c => `${c.p.amigo.nome} está se separando e aparece na sua porta às onze da noite com uma mochila, perguntando se pode dormir no seu sofá "só hoje".`,
    opcoes: [
      { id: 'sim', texto: 'Arrumar o sofá e ouvir', comportamento: { empatia: 1, generosidade: 1 },
        resolver: c => ({ texto: `"Só hoje" virou três semanas. ${c.p.amigo.nome} nunca esqueceu.`, memoria: `Abrigou ${c.p.amigo.nome} no sofá durante a separação.`, efeito: () => { prox(c, 'amigo', 15); c.p.amigo.parceiroId = undefined; for (const par of P.conjuge(c.v)) { const vin = c.v.vinculos[par.id]; vin.tensao = Math.min(100, vin.tensao + 8); } }, lembrar: ['amigo', 'Você abriu a porta quando precisou.'] }) },
      { id: 'hotel', texto: 'Ajudar a pagar uma pousada', disponivel: c => (c.v.financas.conta > 800 ? true : 'Não sobra dinheiro.'),
        resolver: c => ({ texto: 'Você pagou três diárias numa pousada perto.', memoria: null, efeito: () => { dinheiro(c, -600); prox(c, 'amigo', 6); c.p.amigo.parceiroId = undefined; } }) },
      { id: 'nao', texto: 'Dizer que hoje não dá', resolver: c => ({ texto: `${c.p.amigo.nome} disse que entendia e foi para a casa de um primo.`, memoria: null, efeito: () => { prox(c, 'amigo', -8); c.p.amigo.parceiroId = undefined; } }) }
    ]
  }
];

void tensao; void idadePessoa; void anoDe;
