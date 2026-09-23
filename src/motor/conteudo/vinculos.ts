/**
 * Conteúdo das relações que duram: cônjuge, filhos, amigos antigos.
 * Existe para que quem entrou na história continue nela.
 */

import type { Conteudo, Ctx } from './base';
import { mudarAgora } from '../sistemas/processos';
import { MUNICIPIOS, municipio } from '../dados/lugares';
import * as P from './papeis';
import { dinheiro, envolvimento, estresse, fato, feliz, gp, prox, saude, tensao } from './efeitos';
import { idadePessoa, temFato } from '../nucleo';
import { anoDe } from '../tempo';
import { criarPessoa, vincular } from '../pessoas';

export const VINCULOS: Conteudo[] = [
  /* ================================================================ CÔNJUGE */
  {
    id: 'par_emprego_perdido', tipo: 'acontecimento', idade: [20, 70], tema: 'amor', repetir: 8,
    papeis: { pessoa: P.conjuge },
    quando: c => c.p.pessoa.renda > 0 && idadePessoa(c.v, c.p.pessoa) < 64,
    narrar: c => ({
      texto: `${c.p.pessoa.nome} foi ${gp(c, 'pessoa', 'demitido', 'demitida', 'demitide')}. A casa passou a viver de um salário só por um tempo.`,
      tom: 'ruim',
      efeito: () => { const r = c.p.pessoa.renda; c.p.pessoa.renda = 0; c.v.fatos[`renda_antiga_${c.p.pessoa.id}`] = r; estresse(c, 8); }
    })
  },
  {
    id: 'par_emprego_novo', tipo: 'acontecimento', idade: [20, 70], tema: 'amor', repetir: 2, prioritario: true,
    papeis: { pessoa: P.conjuge },
    quando: c => c.p.pessoa.renda === 0 && c.v.fatos[`renda_antiga_${c.p.pessoa.id}`] !== undefined && c.r.chance(0.6),
    narrar: c => ({
      texto: `${c.p.pessoa.nome} arrumou trabalho de novo. A primeira coisa foi pagar as contas atrasadas.`,
      tom: 'bom',
      efeito: () => { c.p.pessoa.renda = Math.round((c.v.fatos[`renda_antiga_${c.p.pessoa.id}`] ?? 2500) * (0.85 + c.r.next() * 0.3)); delete c.v.fatos[`renda_antiga_${c.p.pessoa.id}`]; }
    })
  },
  {
    id: 'par_promocao', tipo: 'acontecimento', idade: [22, 64], tema: 'amor', repetir: 8,
    papeis: { pessoa: P.conjuge },
    quando: c => c.p.pessoa.renda > 0 && idadePessoa(c.v, c.p.pessoa) < 60,
    narrar: c => ({
      texto: `${c.p.pessoa.nome} foi ${gp(c, 'pessoa', 'promovido', 'promovida', 'promovide')}. Comemoraram com pizza e refrigerante no chão da sala.`,
      tom: 'bom', relevancia: 'cotidiano',
      efeito: () => { c.p.pessoa.renda = Math.round(c.p.pessoa.renda * 1.18); feliz(c, 3); }
    })
  },
  {
    id: 'par_tarefas', tipo: 'decisao', idade: [20, 80], tema: 'amor', repetir: 6,
    papeis: { pessoa: P.conjuge },
    titulo: 'A louça',
    texto: c => `${c.p.pessoa.nome} largou um pano de prato na mesa e disse, sem levantar a voz, que está cansad${gp(c, 'pessoa', 'o', 'a', 'e')} de fazer tudo sozinh${gp(c, 'pessoa', 'o', 'a', 'e')} em casa.`,
    opcoes: [
      { id: 'dividir', texto: 'Fazer uma divisão de tarefas e cumprir', comportamento: { empatia: 1, disciplina: 1 },
        resolver: c => ({ texto: 'Uma lista na geladeira. Nas primeiras semanas, cumprida à risca.', memoria: null, efeito: () => { envolvimento(c, 'pessoa', 10); tensao(c, 'pessoa', -15); } }) },
      { id: 'faxineira', texto: 'Propor pagar uma diarista', disponivel: c => (c.v.financas.conta > 3000 ? true : 'Não cabe no orçamento.'),
        resolver: c => ({ texto: 'A diarista passou a vir às sextas. A briga mudou de assunto.', memoria: null, efeito: () => { dinheiro(c, -2400); envolvimento(c, 'pessoa', 4); } }) },
      { id: 'discordar', texto: 'Dizer que não é bem assim', comportamento: { empatia: -1 },
        resolver: c => ({ texto: `${c.p.pessoa.nome} não respondeu. Lavou a louça batendo os pratos.`, memoria: null, efeito: () => { tensao(c, 'pessoa', 20); envolvimento(c, 'pessoa', -8); } }) }
    ]
  },
  {
    id: 'par_ciume', tipo: 'decisao', idade: [18, 70], tema: 'amor', repetir: 8,
    papeis: { pessoa: P.parceiro, outro: P.qualquer(P.genteDe('trabalho'), P.amigo) },
    quando: c => c.p.outro.genero !== c.v.eu.genero || c.v.eu.atracao === 'ambos',
    titulo: 'O celular',
    texto: c => `${c.p.pessoa.nome} viu uma mensagem de ${c.p.outro.nome} no seu celular às onze da noite — uma coisa de trabalho, uma piada — e passou o jantar calad${gp(c, 'pessoa', 'o', 'a', 'e')}.`,
    opcoes: [
      { id: 'mostrar', texto: 'Mostrar a conversa inteira', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `${c.p.pessoa.nome} leu, ficou sem graça e pediu desculpas.`, memoria: null, efeito: () => { tensao(c, 'pessoa', -10); } }) },
      { id: 'ofender', texto: 'Se ofender com a desconfiança', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'A noite terminou com cada um de um lado da cama.', memoria: null, efeito: () => { tensao(c, 'pessoa', 18); } }) },
      { id: 'afastar', texto: c => `Parar de responder ${c.p.outro.nome} fora do horário`, comportamento: { familia: 1 },
        resolver: c => ({ texto: `Você passou a responder ${c.p.outro.nome} só no dia seguinte.`, memoria: null, efeito: () => { tensao(c, 'pessoa', -8); prox(c, 'outro', -10); } }) }
    ]
  },
  {
    id: 'par_doenca', tipo: 'decisao', idade: [30, 95], tema: 'amor', repetir: 12,
    papeis: { pessoa: P.conjuge },
    quando: c => idadePessoa(c.v, c.p.pessoa) >= 45,
    titulo: c => `${c.p.pessoa.nome} no hospital`,
    texto: c => `${c.p.pessoa.nome} teve um problema no coração e vai ficar internad${gp(c, 'pessoa', 'o', 'a', 'e')} alguns dias. ${c.v.trabalho.atual ? 'O trabalho não para por isso.' : ''}`,
    opcoes: [
      { id: 'ficar', texto: 'Dormir no hospital todas as noites', comportamento: { familia: 2, empatia: 1 },
        resolver: c => ({ texto: 'Cadeira de acompanhante, café de máquina, a mão segurada até ela dormir.'.replace('ela', gp(c, 'pessoa', 'ele', 'ela', 'elu')), memoria: `Passou as noites no hospital com ${c.p.pessoa.nome}.`, efeito: () => { envolvimento(c, 'pessoa', 12); estresse(c, 10); if (c.v.trabalho.atual) c.v.trabalho.atual.desempenho -= 6; c.p.pessoa.saude = Math.max(20, c.p.pessoa.saude - 10); } }) },
      { id: 'revezar', texto: 'Revezar com a família', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Fizeram uma escala no grupo da família. Deu certo.', memoria: null, efeito: () => { envolvimento(c, 'pessoa', 5); c.p.pessoa.saude = Math.max(20, c.p.pessoa.saude - 10); } }) },
      { id: 'trabalho', texto: 'Visitar depois do trabalho', resolver: c => ({ texto: `Você ia no horário de visita. ${c.p.pessoa.nome} esperava na porta.`, memoria: null, efeito: () => { envolvimento(c, 'pessoa', -3); c.p.pessoa.saude = Math.max(20, c.p.pessoa.saude - 10); } }) }
    ]
  },
  {
    id: 'par_mudar_cidade', tipo: 'decisao', idade: [22, 60], tema: 'amor', repetir: 12,
    papeis: { pessoa: P.conjuge },
    quando: c => c.p.pessoa.renda > 0,
    titulo: c => `A proposta de ${c.p.pessoa.nome}`,
    texto: c => `${c.p.pessoa.nome} recebeu uma proposta de trabalho em outra cidade — melhor salário, chance de crescer. Mas seria recomeçar longe de tudo.`,
    opcoes: [
      { id: 'ir', texto: 'Topar ir junto', comportamento: { familia: 1, coragem: 1 },
        resolver: c => ({ texto: 'Vocês fizeram as malas.', memoria: null, efeito: () => { c.p.pessoa.renda = Math.round(c.p.pessoa.renda * 1.35); envolvimento(c, 'pessoa', 10); fato(c, 'seguiu_conjuge'); moverCasal(c); } }) },
      { id: 'longe', texto: 'Sugerir que vá e vocês fiquem à distância por um tempo', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${c.p.pessoa.nome} foi. Os fins de semana viraram rodoviária.`, memoria: `Passou a viver um relacionamento à distância com ${c.p.pessoa.nome}.`, efeito: () => { c.p.pessoa.municipioId = 'sao-paulo-sp'; const vin = c.v.vinculos[c.p.pessoa.id]; vin.convivio = vin.convivio.filter(x => x !== 'casa'); envolvimento(c, 'pessoa', -8); } }) },
      { id: 'ficar', texto: 'Pedir para recusar', comportamento: { familia: 1 },
        resolver: c => ({ texto: `${c.p.pessoa.nome} recusou. Nunca mais tocou no assunto.`, memoria: null, efeito: () => { envolvimento(c, 'pessoa', -10); tensao(c, 'pessoa', 15); } }) }
    ]
  },
  {
    id: 'par_aniversario', tipo: 'acontecimento', idade: [20, 95], tema: 'amor', repetir: 7,
    papeis: { pessoa: P.conjuge },
    quando: c => c.v.vinculos[c.p.pessoa.id].romance!.envolvimento >= 55,
    narrar: c => ({
      texto: c.r.pick([
        `${c.p.pessoa.nome} fez uma surpresa no seu aniversário: os amigos antigos, escondidos na sala, com bolo de padaria.`,
        `Num domingo qualquer, ${c.p.pessoa.nome} achou as fotos do começo de vocês e passou a tarde rindo delas.`,
        `${c.p.pessoa.nome} aprendeu a fazer aquela receita da sua infância e errou o sal. Você comeu tudo.`
      ]),
      relevancia: 'cotidiano', tom: 'bom', efeito: () => { envolvimento(c, 'pessoa', 5); feliz(c, 3); }
    })
  },
  {
    id: 'par_sogros', tipo: 'acontecimento', idade: [20, 70], tema: 'familia', repetir: 6,
    papeis: { pessoa: P.conjuge },
    narrar: c => ({
      texto: c.r.pick([
        `O almoço de domingo na casa dos pais de ${c.p.pessoa.nome} virou tradição: comida demais e a mesma piada do sogro toda semana.`,
        `A mãe de ${c.p.pessoa.nome} passou um mês na sua casa depois de uma cirurgia. Foi um mês longo.`,
        `O pai de ${c.p.pessoa.nome} ajudou a trocar a fiação da casa num fim de semana, sem cobrar nada.`
      ]),
      relevancia: 'cotidiano'
    })
  },

  /* ================================================================= FILHOS */
  {
    id: 'fil_palavra', tipo: 'acontecimento', idade: [16, 70], tema: 'filhos', repetir: 0,
    papeis: { filho: P.filhoEmCasa(1, 2) },
    quando: c => !temFato(c.v, `palavra_${c.p.filho.id}`),
    narrar: c => ({
      texto: `A primeira palavra de ${c.p.filho.nome} foi "${c.r.pick([c.v.eu.genero === 'feminino' ? 'mamã' : 'papá', 'água', 'não', 'au-au', 'dá'])}". Você repetiu a história para todo mundo.`,
      tom: 'bom', efeito: () => { fato(c, `palavra_${c.p.filho.id}`); prox(c, 'filho', 5); }
    })
  },
  {
    id: 'fil_aniversario', tipo: 'acontecimento', idade: [18, 80], tema: 'filhos', repetir: 3,
    papeis: { filho: P.filhoEmCasa(3, 11) },
    narrar: c => ({
      texto: c.v.financas.conta > 3000
        ? `Festa de ${idadePessoa(c.v, c.p.filho)} anos de ${c.p.filho.nome} num salão de festas, com pula-pula e docinho de brigadeiro.`
        : `O aniversário de ${idadePessoa(c.v, c.p.filho)} anos de ${c.p.filho.nome} foi no quintal, com bolo feito em casa e os primos.`,
      relevancia: 'cotidiano', tom: 'bom', efeito: () => { dinheiro(c, c.v.financas.conta > 3000 ? -1800 : -250); prox(c, 'filho', 4); }
    })
  },
  {
    id: 'fil_nota_baixa', tipo: 'decisao', idade: [24, 75], tema: 'filhos', repetir: 3,
    papeis: { filho: P.filhoEmCasa(8, 16) },
    titulo: 'O boletim',
    texto: c => `O boletim de ${c.p.filho.nome} veio com três notas vermelhas. A professora escreveu: "parece distraíd${gp(c, 'filho', 'o', 'a', 'e')}".`,
    opcoes: [
      { id: 'sentar', texto: 'Sentar para estudar junto todas as noites', comportamento: { familia: 1, disciplina: 1 },
        resolver: c => ({ texto: 'Um mês de tabuada e redação na mesa da cozinha. As notas subiram.', memoria: null, efeito: () => { prox(c, 'filho', 8); estresse(c, 4); } }) },
      { id: 'reforco', texto: 'Pagar aula de reforço', disponivel: c => (c.v.financas.conta > 1500 ? true : 'Não sobra dinheiro para isso.'),
        resolver: c => ({ texto: 'Duas vezes por semana, uma professora aposentada do bairro.', memoria: null, efeito: () => dinheiro(c, -1500) }) },
      { id: 'conversar', texto: 'Perguntar o que está acontecendo', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `${c.p.filho.nome} demorou, mas contou que não estava enxergando o quadro. Precisava de óculos.`, memoria: null, efeito: () => prox(c, 'filho', 6) }) },
      { id: 'castigo', texto: 'Castigo até melhorar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'As notas melhoraram um pouco. A conversa em casa, não.', memoria: null, efeito: () => tensao(c, 'filho', 12) }) }
    ]
  },
  {
    id: 'fil_faculdade', tipo: 'decisao', idade: [36, 80], tema: 'filhos', repetir: 0,
    papeis: { filho: P.filhoEmCasa(17, 20) },
    quando: c => !temFato(c.v, `faculdade_filho_${c.p.filho.id}`),
    titulo: c => `A faculdade de ${c.p.filho.nome}`,
    texto: c => `${c.p.filho.nome} não passou na federal, mas passou numa faculdade particular. A mensalidade é de R$ 1.300. ${gp(c, 'filho', 'Ele', 'Ela', 'Elu')} olha para você esperando uma resposta.`,
    opcoes: [
      { id: 'pagar', texto: 'Pagar, nem que aperte', comportamento: { familia: 2, generosidade: 1 },
        resolver: c => ({ texto: `Você assinou o contrato como fiador. ${c.p.filho.nome} te abraçou no estacionamento.`, memoria: `Pagou a faculdade de ${c.p.filho.nome}.`, efeito: () => { fato(c, `faculdade_filho_${c.p.filho.id}`); fato(c, `ajuda_mensal_${c.p.filho.id}`); prox(c, 'filho', 12); } }) },
      { id: 'fies', texto: 'Sugerir o FIES', resolver: c => ({ texto: `${c.p.filho.nome} fez o FIES. Vai começar a vida adulta devendo.`, memoria: null, efeito: () => fato(c, `faculdade_filho_${c.p.filho.id}`) }) },
      { id: 'tentar', texto: 'Pedir para tentar a federal de novo', resolver: c => ({ texto: `${c.p.filho.nome} topou mais um ano de cursinho, meio a contragosto.`, memoria: null, efeito: () => { fato(c, `faculdade_filho_${c.p.filho.id}`); tensao(c, 'filho', 8); } }) }
    ]
  },
  {
    id: 'fil_volta_casa', tipo: 'decisao', idade: [40, 85], tema: 'filhos', repetir: 10,
    papeis: { filho: P.filho(22, 45) },
    quando: c => !c.v.vinculos[c.p.filho.id].convivio.includes('casa') && c.v.moradia.tipo !== 'pais',
    titulo: c => `${c.p.filho.nome} quer voltar`,
    texto: c => `${c.p.filho.nome} perdeu o emprego e não está conseguindo pagar o aluguel. Pergunta, com vergonha, se pode voltar para casa por uns meses.`,
    opcoes: [
      { id: 'sim', texto: 'Abrir a porta', comportamento: { familia: 2 },
        resolver: c => ({ texto: 'O quarto antigo virou quarto de novo. Os meses viraram um ano e meio.', memoria: `${c.p.filho.nome} voltou a morar com você por um tempo.`, efeito: () => { const vin = c.v.vinculos[c.p.filho.id]; vin.convivio.push('casa'); c.p.filho.municipioId = c.v.moradia.municipioId; delete c.v.fatos[`saiu_de_casa_${c.p.filho.id}`]; prox(c, 'filho', 10); } }) },
      { id: 'dinheiro', texto: 'Ajudar com o aluguel por uns meses', disponivel: c => (c.v.financas.conta > 5000 ? true : 'Não há dinheiro para isso.'), comportamento: { generosidade: 1 },
        resolver: c => ({ texto: 'Três meses de aluguel pagos. Foi o tempo de arrumar outro emprego.', memoria: null, efeito: () => { dinheiro(c, -5000); prox(c, 'filho', 6); } }) },
      { id: 'nao', texto: 'Dizer que é hora de se virar', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${c.p.filho.nome} foi dividir apartamento com um amigo. Demorou a ligar de novo.`, memoria: null, efeito: () => { prox(c, 'filho', -12); tensao(c, 'filho', 15); } }) }
    ]
  },
  {
    id: 'fil_neto_cuidar', tipo: 'decisao', idade: [45, 85], tema: 'filhos', repetir: 10,
    papeis: { neto: v => Object.values(v.vinculos).filter(x => x.parentesco === 'neto' && v.pessoas[x.pessoaId]?.vivo && idadePessoa(v, v.pessoas[x.pessoaId]) <= 5).map(x => v.pessoas[x.pessoaId]) },
    titulo: c => `${c.p.neto.nome}`,
    texto: c => `A creche de ${c.p.neto.nome} fechou por falta de verba e os pais trabalham o dia inteiro. Perguntaram se você pode ficar com ${gp(c, 'neto', 'ele', 'ela', 'elu')} durante a semana.`,
    opcoes: [
      { id: 'sim', texto: 'Ficar', comportamento: { familia: 2 },
        resolver: c => ({ texto: 'As tardes passaram a ter desenho animado, sopa e sono no sofá.', memoria: `Passou a cuidar de ${c.p.neto.nome} durante a semana.`, efeito: () => { prox(c, 'neto', 20); estresse(c, 5); feliz(c, 4); } }) },
      { id: 'as_vezes', texto: 'Ficar dois dias por semana', resolver: c => ({ texto: 'Segundas e quartas eram suas.', memoria: null, efeito: () => prox(c, 'neto', 10) }) },
      { id: 'nao', texto: 'Explicar que não dá', comportamento: { independencia: 1 }, resolver: () => ({ texto: 'Os pais deram um jeito com uma vizinha.', memoria: null }) }
    ]
  },

  /* ================================================================= AMIGOS */
  {
    id: 'ami_hospital', tipo: 'decisao', idade: [18, 95], tema: 'amizade', repetir: 10,
    papeis: { amigo: P.amigo },
    titulo: c => `${c.p.amigo.nome}`,
    texto: c => `${c.p.amigo.nome} está internad${gp(c, 'amigo', 'o', 'a', 'e')} depois de um acidente. A família avisou no grupo; o hospital fica do outro lado da cidade.`,
    opcoes: [
      { id: 'visitar', texto: 'Ir visitar no mesmo dia', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `${c.p.amigo.nome} sorriu quando você entrou. Ficaram uma hora vendo televisão sem som.`, memoria: `Visitou ${c.p.amigo.nome} no hospital.`, efeito: () => prox(c, 'amigo', 12), lembrar: ['amigo', 'Você foi visitar no hospital.'] }) },
      { id: 'mensagem', texto: 'Mandar mensagem', resolver: c => ({ texto: `${c.p.amigo.nome} respondeu com um joinha.`, memoria: null, efeito: () => prox(c, 'amigo', 2) }) },
      { id: 'depois', texto: 'Deixar para quando sair do hospital', resolver: c => ({ texto: `Quando você foi, ${c.p.amigo.nome} já estava em casa.`, memoria: null, efeito: () => prox(c, 'amigo', -5) }) }
    ]
  },
  {
    id: 'ami_viagem', tipo: 'decisao', idade: [18, 70], tema: 'amizade', repetir: 5,
    papeis: { amigo: P.amigo },
    quando: c => c.v.financas.conta > 1500,
    titulo: 'A viagem da turma',
    texto: c => `${c.p.amigo.nome} está organizando uma viagem da turma antiga: feriado prolongado, casa alugada na praia, cada um paga uns R$ 900.`,
    opcoes: [
      { id: 'ir', texto: 'Ir', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Três dias de sol, violão e história antiga repetida até a exaustão.', memoria: `Viajou com a turma de ${c.p.amigo.nome} num feriado.`, efeito: () => { dinheiro(c, -900); prox(c, 'amigo', 10); feliz(c, 6); estresse(c, -8); for (const a of P.amigo(c.v).slice(0, 3)) { const vin = c.v.vinculos[a.id]; vin.proximidade = Math.min(100, vin.proximidade + 4); vin.tUltimoContato = c.v.t; } } }) },
      { id: 'nao', texto: 'Ficar desta vez', resolver: c => ({ texto: 'As fotos no grupo pareciam ótimas.', memoria: null, efeito: () => prox(c, 'amigo', -3) }) }
    ]
  },
  {
    id: 'ami_padrinho_filho', tipo: 'decisao', idade: [20, 60], tema: 'amizade', repetir: 0,
    papeis: { amigo: P.amigoProximo, bebe: P.filho(0, 1) },
    quando: c => !temFato(c.v, `padrinho_${c.p.bebe.id}`),
    titulo: 'Padrinhos',
    texto: c => `Chegou a hora de escolher padrinhos para ${c.p.bebe.nome}. ${c.p.amigo.nome} é a primeira pessoa que vem à cabeça.`,
    biografica: true,
    opcoes: [
      { id: 'amigo', texto: c => `Chamar ${c.p.amigo.nome}`, resolver: c => ({ texto: `${c.p.amigo.nome} chorou no telefone.`, memoria: `${c.p.amigo.nome} virou ${gp(c, 'amigo', 'padrinho', 'madrinha', 'padrinhe')} de ${c.p.bebe.nome}.`, efeito: () => { fato(c, `padrinho_${c.p.bebe.id}`); prox(c, 'amigo', 12); }, lembrar: ['amigo', `${gp(c, 'amigo', 'Padrinho', 'Madrinha', 'Padrinhe')} de ${c.p.bebe.nome}.`] }) },
      { id: 'familia', texto: 'Chamar alguém da família', resolver: c => ({ texto: 'A família aprovou a escolha.', memoria: null, efeito: () => fato(c, `padrinho_${c.p.bebe.id}`) }) }
    ]
  },
  {
    id: 'ami_novo_vizinho', tipo: 'acontecimento', idade: [22, 90], tema: 'amizade', repetir: 10,
    quando: c => c.v.moradia.tipo !== 'pais',
    narrar: c => {
      const idadeV = c.r.int(Math.max(20, c.idade - 12), c.idade + 12);
      const p = criarPessoa(c.v, c.r, { idade: idadeV, municipioId: c.v.moradia.municipioId });
      const vin = vincular(c.v, p, { origem: 'vizinhanca', proximidade: 22, convivio: ['vizinhanca'], estagio: 'conhecido' });
      vin.ambiente = `vizinhanca:${c.v.moradia.municipioId}:${c.v.moradia.tInicio}`;
      const fem = p.genero === 'feminino';
      const onde = c.r.pick(['para a casa ao lado', 'para o apartamento da frente', 'para a casa do fim da rua']);
      const jeito = c.r.pick(['cumprimenta todo mundo pelo nome', 'passa o dia cuidando de plantas', 'toca violão à noite', 'trabalha de madrugada']);
      return { texto: `${fem ? 'Uma vizinha nova' : 'Um vizinho novo'} se mudou ${onde}: ${p.nome}, uns ${idadeV} anos, que ${jeito}.`, relevancia: 'cotidiano' };
    }
  }
];

function moverCasal(c: Ctx): void {
  const aqui = municipio(c.v.moradia.municipioId);
  const destinos = MUNICIPIOS.filter(m => m.id !== aqui.id && m.regiao === aqui.regiao && (m.perfil === 'metropole' || m.perfil === 'capital'));
  const destino = destinos[(anoDe(c.v.t) + c.v.seq) % Math.max(1, destinos.length)] ?? MUNICIPIOS.find(m => m.id === 'sao-paulo-sp')!;
  mudarAgora(c.v, destino.id, `acompanhando ${c.p.pessoa.nome}`);
}

void saude;
