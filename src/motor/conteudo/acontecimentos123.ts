/**
 * REWORK 12.3 — os acontecimentos novos: o conflito no trabalho (com a equipe de verdade, E6) e a vida comum em oito áreas
 * (F4) — infância e adolescência, família e relações, escola e faculdade, trabalho, casa e comunidade, dinheiro, saúde e
 * hábitos, cidade e cultura. Regras da casa (as mesmas de sempre): papéis com pessoas reais, `quando` lido do estado (sem
 * sorteio), cada opção muda alguma coisa (a relação, o dinheiro, a saúde, a carreira), e o que é de uma vez só tem marco.
 * Os que lembram do passado (F5) leem o passado de verdade: a dívida antiga, o colega reencontrado, o professor de anos atrás.
 *
 * Os da vida comum são `manual` e têm sorteio próprio (`motor.vidaComumDoAno`, um gerador derivado): entram na vida sem
 * mudar a sequência do sorteio principal do ano (as vidas de antes continuam as mesmas até um deles acontecer).
 */
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import * as P from './papeis';
import { custa, dinheiro, estresse, feliz, forma, gp, local, prox, saude, tensao, cognicao } from './efeitos';
import { clamp } from '../rng';
import { idadePessoa, lembrarCom } from '../nucleo';
import { encerrarEmprego } from '../sistemas/trabalho';
import { anoDe } from '../tempo';

/* ================================================================ o conflito no trabalho (E6) */

const doConflito = Object.assign((v: Vida): Pessoa[] => {
  const id = v.trabalho.atual?.equipe?.conflito;
  return id && v.pessoas[id]?.vivo && v.vinculos[id] ? [v.pessoas[id]] : [];
}, { fixo: true });
const ehChefe = (c: Ctx) => c.v.trabalho.atual?.equipe?.chefeId === c.p.quem.id;
const emp = (c: Ctx) => c.v.trabalho.atual!;
const grande = (c: Ctx) => /^(uma|a) (empresa|rede|multinacional|prefeitura|secretaria)|banco|hospital|universidade|tribunal/i.test(emp(c).empregador) || ['publico', 'judiciario', 'saude_publica', 'financas'].includes(emp(c).ocupacaoId);

export const ACONTECIMENTOS_123: Conteudo[] = [
  {
    id: 'trab123_conflito', tipo: 'decisao', idade: [18, 75], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 2,
    papeis: { quem: doConflito },
    quando: c => c.v.fatos['trab123_conflito'] === c.v.t && !!c.v.trabalho.atual,
    titulo: c => (ehChefe(c) ? `A chefia: ${c.p.quem.nome}` : `${c.p.quem.nome}, do trabalho`),
    texto: c => ehChefe(c)
      ? `Com ${c.p.quem.nome}, nada mais anda: as cobranças vêm em público, os elogios nunca. ${emp(c).desempenho >= 60 ? 'O seu trabalho está bom — e isso não parece contar.' : 'O seu desempenho caiu, e a culpa nem sempre é sua.'}`
      : `${c.p.quem.nome} ${c.v.trabalho.atual?.equipe?.rivalId === c.p.quem.id ? 'disputa com você cada projeto e cada elogio' : 'virou um problema diário'}. A equipe já percebeu.`,
    opcoes: [
      { id: 'conversar', texto: 'Pedir uma conversa franca, a sós', comportamento: { empatia: 1, coragem: 1 },
        resolver: c => { const deu = c.p.quem.temperamento.afabilidade > -0.3 || c.r.chance(0.35); return { texto: deu ? `${c.p.quem.nome} ouviu mais do que você esperava. Não viraram amigos, mas o ar ficou respirável.` : `${c.p.quem.nome} ouviu, sorriu, e na segunda-feira estava tudo igual.`, memoria: null, efeito: () => { tensao(c, 'quem', deu ? -25 : 5); if (deu) emp(c).clima = clamp((emp(c).clima ?? 50) + 10); delete emp(c).equipe!.conflito; } }; } },
      { id: 'negociar', texto: ehChefeTxt('Negociar: metas claras por escrito', 'Propor dividir o trabalho de outro jeito'), comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Ficou combinado por escrito quem faz o quê. Menos espaço para mal-entendido — e para desculpa.', memoria: null, efeito: () => { tensao(c, 'quem', -12); emp(c).clima = clamp((emp(c).clima ?? 50) + 6); delete emp(c).equipe!.conflito; } }) },
      { id: 'rh', texto: 'Levar ao RH (ou à ouvidoria)', disponivel: c => (grande(c) ? true : 'Num lugar pequeno, não há a quem levar: o RH é o dono.'),
        consequencia: () => 'Fica registrado. Pode resolver — ou o clima piorar.',
        resolver: c => { const ouviu = c.r.chance(0.5); return { texto: ouviu ? `O RH ouviu as duas partes. ${c.p.quem.nome} recebeu uma orientação formal, e o tom mudou.` : `O RH anotou e prometeu acompanhar. ${c.p.quem.nome} soube quem reclamou.`, memoria: ouviu ? `Levou ao RH o conflito com ${c.p.quem.nome}.` : null, efeito: () => { tensao(c, 'quem', ouviu ? -15 : 20); emp(c).clima = clamp((emp(c).clima ?? 50) + (ouviu ? 5 : -12)); delete emp(c).equipe!.conflito; } }; } },
      { id: 'transferencia', texto: 'Pedir transferência de setor', disponivel: c => (grande(c) ? true : 'Não há outro setor para onde ir.'),
        resolver: c => ({ texto: 'A transferência saiu em dois meses. Outra mesa, outra chefia, a mesma empresa.', memoria: `Pediu transferência para longe de ${c.p.quem.nome}.`, efeito: () => { const eq = emp(c).equipe!; eq.colegas = eq.colegas.filter(x => x !== c.p.quem.id); if (eq.rivalId === c.p.quem.id) delete eq.rivalId; if (eq.chefeId === c.p.quem.id) delete eq.chefeId; c.v.vinculos[c.p.quem.id].convivio = c.v.vinculos[c.p.quem.id].convivio.filter(x => x !== 'trabalho'); delete eq.conflito; estresse(c, -4); } }) },
      { id: 'sindicato', texto: 'Procurar o sindicato ou um advogado trabalhista', consequencia: c => `Uma consulta: uns ${local(c, 600)}.`, disponivel: c => custa(c, local(c, 600)),
        resolver: c => ({ texto: 'Saiu de lá sabendo o que é direito seu e o que não é. A conversa seguinte foi de outro tamanho.', memoria: null, efeito: () => { dinheiro(c, -local(c, 600)); tensao(c, 'quem', -8); emp(c).clima = clamp((emp(c).clima ?? 50) + 4); delete emp(c).equipe!.conflito; } }) },
      { id: 'sair', texto: 'Pedir demissão', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `Você entregou a carta. ${c.p.quem.nome} disse que entendia. Ninguém acreditou.`, memoria: `Pediu demissão por causa do conflito com ${c.p.quem.nome}.`, relevancia: 'biografia', efeito: () => { encerrarEmprego(c.v, 'pedido de demissão'); estresse(c, -6); } }) },
      { id: 'aguentar', texto: 'Aguentar calado', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você engoliu mais um mês. E outro.', memoria: null, efeito: () => { estresse(c, 8); feliz(c, -3); delete emp(c).equipe!.conflito; } }) }
    ]
  },

  /* ================================================================ F4 · infância e adolescência */
  {
    id: 'inf123_amizade_rompida', manual: true, tipo: 'decisao', idade: [8, 14], tema: 'amizade', repetir: 4, peso: 2,
    papeis: { amigo: P.fixo(P.amigoProximo) },
    titulo: c => `${c.p.amigo.nome} contou um segredo seu`,
    texto: c => `Aquilo que você contou só para ${c.p.amigo.nome} apareceu na boca da turma inteira.`,
    opcoes: [
      { id: 'tirar_satisfacao', texto: 'Tirar satisfação na frente de todos', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'Virou briga no recreio. A turma escolheu lados.', memoria: null, efeito: () => { tensao(c, 'amigo', 30); prox(c, 'amigo', -20); } }) },
      { id: 'perguntar', texto: 'Perguntar a sós por quê', comportamento: { empatia: 1 }, resolver: c => ({ texto: `${c.p.amigo.nome} chorou: tinha contado sem pensar, para impressionar alguém. Pediu desculpas.`, memoria: null, lembrar: ['amigo', 'Contou um segredo seu e pediu desculpas.', 'conflito'], efeito: () => { tensao(c, 'amigo', 5); prox(c, 'amigo', -5); } }) },
      { id: 'afastar', texto: 'Se afastar em silêncio', comportamento: { independencia: 1 }, resolver: c => ({ texto: `Você parou de sentar perto de ${c.p.amigo.nome}. Ninguém perguntou por quê.`, memoria: null, efeito: () => { prox(c, 'amigo', -30); } }) }
    ]
  },
  {
    id: 'ado123_primeiro_trabalho', manual: true, tipo: 'decisao', idade: [15, 17], tema: 'trabalho', repetir: 0, peso: 2,
    quando: c => !c.v.trabalho.atual,
    marco: { chave: 'primeiro_dinheiro_proprio' },
    titulo: 'Um dinheiro só seu',
    texto: c => `${P.tioOuPrimo(c.v)[0]?.nome ?? 'Um vizinho'} precisa de ajuda nos fins de semana: uns ${local(c, 300)} por mês.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'O primeiro dinheiro que não veio de casa. Você contou três vezes — e a maior parte foi embora em lanche, cinema e um tênis.', memoria: 'Ganhou o primeiro dinheiro próprio, ajudando nos fins de semana.', relevancia: 'biografia', tom: 'bom', efeito: () => { dinheiro(c, local(c, 400)); feliz(c, 4); estresse(c, 3); } }) },
      { id: 'estudar', texto: 'Recusar: o fim de semana é do estudo', resolver: c => ({ texto: 'Você recusou. Os sábados ficaram com os livros.', memoria: null, efeito: () => { cognicao(c, 1); } }) },
      { id: 'brincar', texto: 'Recusar: ainda é cedo', resolver: () => ({ texto: 'Ainda dá tempo de ser só adolescente.', memoria: null }) }
    ]
  },

  /* ================================================================ F4 · família e relações (F5: o passado volta) */
  {
    id: 'fam123_divida_antiga', manual: true, tipo: 'decisao', idade: [25, 90], tema: 'familia', repetir: 6, peso: 2,
    papeis: { quem: P.fixo(P.qualquer(P.irmao, P.tioOuPrimo, P.amigo)) },
    quando: c => (c.v.vinculos[c.p.quem.id]?.historia ?? []).some(h => c.v.t - h.t >= 60 && /empresta|dinheiro|ajud/i.test(h.texto)),
    titulo: c => `${c.p.quem.nome} lembrou de uma coisa antiga`,
    texto: c => { const h = c.v.vinculos[c.p.quem.id].historia.find(x => c.v.t - x.t >= 60 && /empresta|dinheiro|ajud/i.test(x.texto))!; return `Num almoço, ${c.p.quem.nome} puxou o assunto de ${anoDe(h.t)}: "${h.texto.replace(/\.$/, '')}". Não foi cobrança — mas também não foi por acaso.`; },
    opcoes: [
      { id: 'acertar', texto: 'Acertar agora, com juros de carinho', disponivel: c => custa(c, local(c, 2000)), resolver: c => ({ texto: `${c.p.quem.nome} recusou o dinheiro duas vezes e aceitou na terceira. A conversa ficou leve.`, memoria: null, lembrar: ['quem', 'Acertaram uma conta antiga, anos depois.', 'reconciliacao'], efeito: () => { dinheiro(c, -local(c, 2000)); prox(c, 'quem', 10); tensao(c, 'quem', -15); } }) },
      { id: 'agradecer', texto: 'Agradecer de verdade pelo que foi', comportamento: { empatia: 1 }, resolver: c => ({ texto: 'Você disse o que nunca tinha dito. Ficaram em silêncio um tempo.', memoria: null, efeito: () => { prox(c, 'quem', 6); } }) },
      { id: 'desconversar', texto: 'Desconversar', resolver: c => ({ texto: 'O assunto morreu na sobremesa — mas não na cabeça de ninguém.', memoria: null, efeito: () => { tensao(c, 'quem', 10); } }) }
    ]
  },
  {
    id: 'fam123_cuidar_dos_pais', manual: true, tipo: 'decisao', idade: [35, 75], tema: 'familia', repetir: 5, peso: 3,
    papeis: { quem: P.fixo(P.comIdade(P.genitor, 72)) },
    quando: c => (c.p.quem.saude ?? 100) < 55 && !c.v.vinculos[c.p.quem.id].convivio.includes('casa'),
    titulo: c => `${c.p.quem.nome} já não dá conta sozinh${gp(c, 'quem', 'o', 'a')}`,
    texto: c => `Uma queda na cozinha, nada grave. Mas ${c.p.quem.nome}, com ${idadePessoa(c.v, c.p.quem)} anos, não deveria mais morar sozinh${gp(c, 'quem', 'o', 'a')}. ${P.irmao(c.v).length ? `${P.irmao(c.v)[0].nome} já disse que não pode.` : 'Não há irmãos para dividir.'}`,
    opcoes: [
      { id: 'trazer', texto: 'Trazer para morar com você', comportamento: { familia: 2 }, resolver: c => ({ texto: 'O quarto de hóspedes virou quarto de verdade. A rotina da casa mudou inteira.', memoria: `Levou ${c.p.quem.nome} para morar junto, na velhice.`, relevancia: 'biografia', efeito: () => { const vin = c.v.vinculos[c.p.quem.id]; if (!vin.convivio.includes('casa')) vin.convivio.push('casa'); prox(c, 'quem', 12); estresse(c, 8); const par = P.parceiro(c.v)[0]; if (par) tensao({ ...c, p: { ...c.p, par } }, 'par', 8); } }) },
      { id: 'cuidadora', texto: c => `Pagar uma cuidadora (uns ${local(c, 2200)} por mês)`, disponivel: c => custa(c, local(c, 2200 * 12)), resolver: c => ({ texto: 'Uma cuidadora de manhã e à tarde. Você liga todos os dias às oito.', memoria: null, efeito: () => { dinheiro(c, -local(c, 2200 * 12)); prox(c, 'quem', 5); c.p.quem.saude = clamp((c.p.quem.saude ?? 50) + 6); } }) },
      { id: 'visitar', texto: 'Visitar mais, e torcer', resolver: c => ({ texto: 'Três vezes por semana, depois do trabalho. É pouco, e você sabe.', memoria: null, efeito: () => { estresse(c, 5); prox(c, 'quem', 3); } }) }
    ]
  },

  /* ================================================================ F4 · escola e faculdade */
  {
    id: 'esc123_professor_marcou', manual: true, tipo: 'acontecimento', idade: [10, 22], tema: 'escola', repetir: 0, peso: 1,
    quando: c => !!c.v.educacao.basica || !!c.v.educacao.matricula,
    marco: { chave: 'professor_que_marcou' },
    narrar: c => ({ texto: c.r.pick(['Uma professora devolveu um trabalho seu com uma frase na margem: "você pensa por conta própria". Você guardou a folha por anos.', 'Um professor ficou depois da aula para explicar de novo, só para você. Foi a primeira vez que a matéria fez sentido.']), relevancia: 'biografia', tom: 'bom', efeito: () => { cognicao(c, 2); feliz(c, 3); c.v.fatos['professor_marcou'] = c.v.t; } })
  },
  {
    id: 'esc123_reencontro_professor', manual: true, tipo: 'acontecimento', idade: [30, 80], tema: 'escola', repetir: 0, peso: 1,
    quando: c => c.v.fatos['professor_marcou'] !== undefined && c.v.t - c.v.fatos['professor_marcou'] >= 180,
    narrar: c => ({ texto: `Numa fila de banco, alguém chamou o seu nome: era quem, em ${anoDe(c.v.fatos['professor_marcou'])}, tinha ficado depois da aula por você. Lembrava de tudo. Você também.`, relevancia: 'biografia', tom: 'bom', efeito: () => { feliz(c, 4); } })
  },
  {
    id: 'fac123_grupo_trabalho', manual: true, tipo: 'decisao', idade: [17, 30], tema: 'estudo', repetir: 3, peso: 2,
    quando: c => !!c.v.educacao.matricula && !c.v.educacao.matricula.trancado,
    papeis: { colega: P.fixo(P.qualquer(P.colegaDe('faculdade'), P.colegaDe('escola'))) },
    titulo: 'O trabalho em grupo',
    texto: c => `No trabalho em grupo, ${c.p.colega.nome} sumiu. Faltam dez dias e metade não existe.`,
    opcoes: [
      { id: 'fazer', texto: 'Fazer a parte dele e não dizer nada', comportamento: { generosidade: 1 }, resolver: c => ({ texto: 'Três noites curtas. A nota foi boa — a de todos.', memoria: null, efeito: () => { estresse(c, 6); tensao(c, 'colega', 10); } }) },
      { id: 'cobrar', texto: 'Cobrar direto', comportamento: { coragem: 1 }, resolver: c => ({ texto: `${c.p.colega.nome} apareceu com metade do que devia, e um pedido de desculpas.`, memoria: null, efeito: () => { tensao(c, 'colega', 5); } }) },
      { id: 'avisar', texto: 'Avisar o professor', resolver: c => ({ texto: `O professor redistribuiu a nota. ${c.p.colega.nome} não falou mais com você.`, memoria: null, efeito: () => { tensao(c, 'colega', 25); prox(c, 'colega', -15); } }) }
    ]
  },

  /* ================================================================ F4 · casa e comunidade */
  {
    id: 'casa123_vizinho_obra', manual: true, tipo: 'decisao', idade: [20, 90], tema: 'casa', repetir: 5, peso: 2,
    titulo: 'A obra do vizinho',
    texto: () => 'O vizinho começou uma obra que não acaba: furadeira às sete, entulho na calçada, uma rachadura nova na sua parede.',
    opcoes: [
      { id: 'conversar', texto: 'Bater na porta e conversar', comportamento: { empatia: 1 }, resolver: c => { const deu = c.r.chance(0.6); return { texto: deu ? 'Ele pediu desculpas, mudou o horário e mandou o pedreiro olhar a rachadura.' : 'Ele disse que a obra é dele e o horário também.', memoria: null, efeito: () => { estresse(c, deu ? -2 : 5); } }; } },
      { id: 'condominio', texto: 'Levar à associação de moradores (ou ao condomínio)', resolver: c => ({ texto: 'A reunião foi longa e cheia de gente que nunca aparecia. A obra passou a ter regra.', memoria: null, efeito: () => { estresse(c, -1); c.v.fatos['participa_comunidade'] = c.v.t; } }) },
      { id: 'reparo', texto: c => `Consertar a parede você mesmo (uns ${local(c, 900)})`, disponivel: c => custa(c, local(c, 900)), resolver: c => ({ texto: 'Parede consertada, nenhuma conversa. O barulho continuou.', memoria: null, efeito: () => { dinheiro(c, -local(c, 900)); } }) }
    ]
  },
  {
    id: 'casa123_mutirao', manual: true, tipo: 'acontecimento', idade: [16, 85], tema: 'lugar', repetir: 6, peso: 1,
    quando: c => c.v.fatos['participa_comunidade'] !== undefined,
    narrar: c => ({ texto: c.r.pick(['O mutirão da praça juntou trinta pessoas num sábado: bancos pintados, árvores novas, churrasco no fim.', 'A festa da rua, organizada pela associação, foi até tarde. Você conheceu metade dos vizinhos de verdade.']), relevancia: 'cotidiano', tom: 'bom', efeito: () => { feliz(c, 4); estresse(c, -3); } })
  },

  /* ================================================================ F4 · dinheiro e patrimônio */
  {
    id: 'din123_golpe_telefone', manual: true, tipo: 'decisao', idade: [18, 95], tema: 'dinheiro', repetir: 6, peso: 2,
    quando: c => c.v.financas.conta > local(c, 2000),
    titulo: 'A ligação do banco',
    texto: () => 'Uma voz educada, do "banco", diz que houve uma compra suspeita e pede para confirmar uns dados.',
    opcoes: [
      { id: 'desligar', texto: 'Desligar e ligar no número do cartão', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'O banco não sabia de ligação nenhuma. Era golpe.', memoria: null }) },
      { id: 'confirmar', texto: 'Confirmar os dados', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: `Duas horas depois, ${local(c, 1500)} tinham saído da conta. O banco devolveu metade, depois de um mês.`, memoria: 'Caiu num golpe por telefone.', tom: 'ruim', efeito: () => { dinheiro(c, -local(c, 750)); estresse(c, 8); } }) }
    ]
  },
  {
    id: 'din123_emprestimo_amigo', manual: true, tipo: 'decisao', idade: [20, 85], tema: 'dinheiro', repetir: 5, peso: 2,
    papeis: { amigo: P.fixo(P.amigoProximo) },
    titulo: c => `${c.p.amigo.nome} pediu dinheiro emprestado`,
    texto: c => `${c.p.amigo.nome} está apertad${gp(c, 'amigo', 'o', 'a')}: precisa de ${local(c, 3000)} até o fim do mês. Promete devolver em seis.`,
    opcoes: [
      { id: 'emprestar', texto: 'Emprestar', disponivel: c => custa(c, local(c, 3000)), comportamento: { generosidade: 1 }, resolver: c => ({ texto: `${c.p.amigo.nome} agradeceu com os olhos marejados.`, memoria: null, lembrar: ['amigo', `Você emprestou dinheiro num aperto (${anoDe(c.v.t)}).`, 'apoio'], efeito: () => { dinheiro(c, -local(c, 3000)); prox(c, 'amigo', 8); c.v.fatos[`emprestou_${c.p.amigo.id}`] = c.v.t; } }) },
      { id: 'parte', texto: 'Emprestar uma parte', disponivel: c => custa(c, local(c, 1000)), resolver: c => ({ texto: 'Não era o que precisava, mas ajudou.', memoria: null, lembrar: ['amigo', 'Você ajudou com uma parte do dinheiro, num aperto.', 'apoio'], efeito: () => { dinheiro(c, -local(c, 1000)); prox(c, 'amigo', 3); } }) },
      { id: 'nao', texto: 'Dizer que não dá', resolver: c => ({ texto: `${c.p.amigo.nome} disse que entendia.`, memoria: null, efeito: () => { prox(c, 'amigo', -6); } }) }
    ]
  },
  {
    id: 'din123_devolveu', manual: true, tipo: 'acontecimento', idade: [20, 95], tema: 'dinheiro', repetir: 0, peso: 4,
    papeis: { amigo: P.fixo(P.qualquer(P.amigo, P.amigoProximo)) },
    quando: c => { const t = c.v.fatos[`emprestou_${c.p.amigo.id}`]; return t !== undefined && c.v.t - t >= 6 && c.v.t - t <= 36; },
    narrar: c => { const paga = c.p.amigo.temperamento.responsabilidade > -0.2; return { texto: paga ? `${c.p.amigo.nome} devolveu o empréstimo de ${anoDe(c.v.fatos[`emprestou_${c.p.amigo.id}`])} — inteiro, com um bolo junto.` : `O empréstimo de ${anoDe(c.v.fatos[`emprestou_${c.p.amigo.id}`])} para ${c.p.amigo.nome} nunca voltou. Vocês nunca falaram disso.`, relevancia: 'cotidiano', tom: paga ? 'bom' : 'ruim', efeito: () => { delete c.v.fatos[`emprestou_${c.p.amigo.id}`]; if (paga) { dinheiro(c, local(c, 3000)); prox(c, 'amigo', 6); } else { tensao(c, 'amigo', 15); lembrarCom(c.v, c.p.amigo.id, 'Não devolveu o dinheiro emprestado.', 'conflito', 2); } } }; }
  },

  /* ================================================================ F4 · saúde e hábitos */
  {
    id: 'sau123_checkup', manual: true, tipo: 'decisao', idade: [35, 90], tema: 'saude', repetir: 5, peso: 2,
    titulo: 'O exame de rotina',
    texto: () => 'O médico pediu exames de rotina. Já faz um tempo que você adia.',
    opcoes: [
      { id: 'fazer', texto: 'Fazer todos', comportamento: { disciplina: 1 }, resolver: c => ({ texto: c.v.corpo.saude < 60 ? 'Os exames acharam uma coisa no começo — do tamanho que ainda se trata com remédio e caminhada.' : 'Tudo dentro do esperado. O médico pediu para voltar em dois anos.', memoria: null, efeito: () => { saude(c, 3); estresse(c, -2); } }) },
      { id: 'adiar', texto: 'Adiar mais um pouco', resolver: c => ({ texto: 'O pedido ficou na gaveta.', memoria: null, efeito: () => { if (c.v.corpo.saude < 55) saude(c, -2); } }) }
    ]
  },
  {
    id: 'sau123_parceiro_habito', manual: true, tipo: 'decisao', idade: [22, 85], tema: 'saude', repetir: 4, peso: 2,
    papeis: { par: P.fixo(P.parceiro) },
    quando: c => c.v.corpo.forma < 45 || !!c.v.corpo.habitos.fuma,
    titulo: c => `${c.p.par.nome} quer mudar de vida — com você`,
    texto: c => `${c.p.par.nome} comprou dois pares de tênis e propôs: caminhada todo dia, às seis, os dois${c.v.corpo.habitos.fuma ? ' — e o cigarro fora de casa' : ''}.`,
    opcoes: [
      { id: 'topar', texto: 'Topar', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'As primeiras semanas doeram. Depois, a caminhada virou a melhor conversa do dia.', memoria: null, efeito: () => { forma(c, 6); saude(c, 3); prox(c, 'par', 6); } }) },
      { id: 'recusar', texto: 'Dizer que não é a sua', resolver: c => ({ texto: `${c.p.par.nome} foi sozinh${gp(c, 'par', 'o', 'a')}. Todo dia.`, memoria: null, efeito: () => { tensao(c, 'par', 5); } }) }
    ]
  },

  /* ================================================================ F4 · cidade e cultura */
  {
    id: 'cid123_festival', manual: true, tipo: 'decisao', idade: [14, 85], tema: 'lugar', repetir: 4, peso: 2,
    titulo: 'O festival da cidade',
    texto: c => `Fim de semana de festival: música na praça, comida de rua, ${P.amigo(c.v).length ? `${P.amigo(c.v)[0].nome} chamando` : 'a cidade inteira na rua'}.`,
    opcoes: [
      { id: 'ir', texto: c => (P.amigo(c.v).length ? `Ir com ${P.amigo(c.v)[0].nome}` : 'Ir'), resolver: c => ({ texto: 'Voltou rouco, cansado e com uma música na cabeça por uma semana.', memoria: null, efeito: () => { feliz(c, 5); estresse(c, -4); dinheiro(c, -local(c, 120)); const a = P.amigo(c.v)[0]; if (a) { const vin = c.v.vinculos[a.id]; vin.proximidade = clamp(vin.proximidade + 4); } } }) },
      { id: 'voluntario', texto: 'Trabalhar como voluntário', comportamento: { generosidade: 1 }, resolver: c => ({ texto: 'Você passou o festival distribuindo água e conhecendo gente que faz a cidade andar.', memoria: null, efeito: () => { feliz(c, 3); c.v.fatos['participa_comunidade'] = c.v.t; } }) },
      { id: 'ficar', texto: 'Ficar em casa', resolver: () => ({ texto: 'Dava para ouvir o show da janela.', memoria: null }) }
    ]
  }
];

function ehChefeTxt(chefe: string, colega: string) {
  return (c: Ctx) => (ehChefe(c) ? chefe : colega);
}
