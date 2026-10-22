/**
 * REWORK 10 · EVT-01/02/03 — MAIS VIDA ACONTECENDO, E RESPOSTAS QUE MUDAM COISAS DIFERENTES.
 *
 * Situações de cada fase (a infância, a escola, a adolescência, a faculdade, o trabalho, o desemprego, os amigos, o
 * namoro, o casamento, a família, os filhos, a saúde, o esporte, o dinheiro, a casa, as viagens, a vida pública, a
 * velhice), cada uma só quando a vida está naquele lugar (ninguém recebe evento de faculdade aos nove anos, nem
 * promoção sem emprego). As respostas não são cosméticas: cada uma mexe em coisas que as outras não mexem — dinheiro,
 * tempo, uma pessoa, a saúde, a formação, o trabalho, a reputação — e algumas deixam um ECO (`sistemas/ecos`) que volta
 * anos depois, no último bloco deste arquivo, quando a vida está na situação em que ele faz sentido.
 *
 * Regras da casa: os papéis são `fixo` (não gastam o gerador do ano); os `quando` não sorteiam; os valores são do
 * custo de vida de onde se mora (`economiaLocal`), nunca reais fixos; a opção que fala de mudança muda de fato.
 */

import { procuraComoSeNada } from '../sistemas/magoas';
import type { Conteudo, Ctx } from './base';
import * as P from './papeis';
import { fixo } from './papeis';
import { cognicao, custa, estresse, feliz, forma, prox, saude, tensao } from './efeitos';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, vinculosVivos } from '../nucleo';
import { criarProfessor, instituicaoAtual, professorDe } from '../sistemas/formacao';
import { clamp } from '../rng';
import { economiaLocal } from '../dados/lugares';
import { pagar, disponivel } from '../sistemas/dinheiro';
import { praticar, materiasExtremas, habilidade } from '../sistemas/frentes';
import { marcar } from '../sistemas/marcas';
import { abalar } from '../sistemas/abalo';
import { novaOportunidade } from '../sistemas/oportunidades';
import { mudarAgora } from '../sistemas/processos';
import { proximoDegrau, subirDeCargo, nomeOcupacao } from '../sistemas/trabalho';
import { ocupacao, ocupacaoOuNula } from '../dados/ocupacoes';
import { curso } from '../dados/cursos';
import { cidadeLonge } from './local';
import { reconciliar } from '../sistemas/lacos';
import { diagnosticar, registrarDiagnostico } from '../sistemas/saude';
import { registrarEco, ecoAberto, ecoVoltou, pessoaDoEco } from '../sistemas/ecos';
import { reacaoDaParceriaAMudanca } from '../sistemas/convivio';
import { lesionar, machucarNaBriga } from '../sistemas/lesoes';
import { dinheiro as fmt } from '../texto';
import { seguranca } from '../sistemas/dinheiro';

/** O preço de uma coisa no custo de vida de onde se mora (ECO-02: nunca reais fixos). */
const preco = (c: Ctx, x: number) => Math.max(10, Math.round(x * economiaLocal(c.v.moradia.municipioId).custo / 10) * 10);
const emprego = (c: Ctx) => c.v.trabalho.atual;
const naEscola = (c: Ctx) => !!c.v.educacao.basica && !c.v.educacao.evadiu;
const naFaculdade = (c: Ctx) => { const m = c.v.educacao.matricula; return !!m && !m.trancado && curso(m.cursoId).nivel === 'superior'; };
const desempregado = (c: Ctx) => !c.v.trabalho.atual && c.v.trabalho.desempregadoDesde !== undefined && c.v.t - c.v.trabalho.desempregadoDesde >= 6;
const aperto = (c: Ctx) => { const n = seguranca(c.v).nivel; return n === 'no_vermelho' || n === 'apertado'; };
const livre = (c: Ctx) => !c.v.justica?.prisao;
const subirNota = (c: Ctx, n: number) => {
  const m = c.v.educacao.matricula;
  if (m && !m.trancado) m.desempenho = clamp(m.desempenho + n);
  else if (c.v.educacao.basica) c.v.educacao.basica.desempenho = clamp(c.v.educacao.basica.desempenho + n);
};
const nota = (c: Ctx) => c.v.educacao.matricula && !c.v.educacao.matricula.trancado ? c.v.educacao.matricula.desempenho : c.v.educacao.basica?.desempenho ?? 50;
/** Quem dá aula ali: o professor que você já conhece, ou um novo (criado na hora da resposta, não na pergunta). */
const professor = (c: Ctx) => { const inst = instituicaoAtual(c.v); return inst ? professorDe(c.v, inst) ?? criarProfessor(c.v, inst, 'professor') : undefined; };
const quemEnsina = (c: Ctx, onde: 'escola' | 'faculdade') => { const inst = instituicaoAtual(c.v); const p = inst && professorDe(c.v, inst); return p ? p.nome : onde === 'escola' ? 'Um professor' : 'Uma professora do curso'; };
const v_ativa = (c: Ctx, tFim: number) => tFim > c.v.t;
const aproximar = (c: Ctx, id: string, n: number) => { const vin = c.v.vinculos[id]; if (vin) vin.proximidade = clamp(vin.proximidade + n); };
const nome = (c: Ctx, papel: string) => c.p[papel]?.nome ?? '';

export const ACONTECIMENTOS_10: Conteudo[] = [
  /* =================================================================== INFÂNCIA */
  {
    id: 'inf10_lanche', tipo: 'decisao', peso: 1.5, idade: [6, 10], tema: 'escola', repetir: undefined,
    papeis: { colega: fixo(P.colegaDe('escola')) }, quando: c => naEscola(c),
    titulo: 'O lanche',
    texto: c => `${nome(c, 'colega')} pegou o seu lanche no recreio de novo. Hoje você viu.`,
    opcoes: [
      { id: 'professora', texto: 'Contar para a professora', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'A professora conversou com os dois. O lanche parou de sumir — e o colega passou a evitar você.', memoria: null, efeito: () => { tensao(c, 'colega', 10); prox(c, 'colega', -6); } }) },
      { id: 'dividir', texto: 'Oferecer metade, se ele pedir antes', comportamento: { empatia: 1, generosidade: 1 },
        resolver: c => ({ texto: `${nome(c, 'colega')} ficou sem graça, depois aceitou. Descobriram que torcem pelo mesmo time.`, memoria: `Dividiu o lanche com ${nome(c, 'colega')}.`, lembrar: ['colega', 'Dividiram o lanche no recreio.', 'amizade'], efeito: () => { prox(c, 'colega', 12); tensao(c, 'colega', -10); } }) },
      { id: 'revidar', texto: 'Pegar o dele também', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Virou briga no pátio. Os dois foram para a coordenação — e a família foi chamada.', memoria: 'Brigou no recreio por causa do lanche.', tom: 'ruim', efeito: () => { tensao(c, 'colega', 18); subirNota(c, -2); for (const g of P.genitor(c.v)) { const vin = c.v.vinculos[g.id]; if (vin) vin.tensao = clamp(vin.tensao + 5); } } }) },
      { id: 'deixar', texto: 'Deixar para lá', resolver: c => ({ texto: 'Você ficou com fome e quieto. O lanche continuou sumindo por um tempo.', memoria: null, efeito: () => estresse(c, 4) }) }
    ]
  },
  {
    id: 'inf10_olimpiada', tipo: 'decisao', peso: 1.5, idade: [8, 11], tema: 'escola', repetir: undefined,
    papeis: { genitor: fixo(P.genitorEmCasa) }, quando: c => naEscola(c),
    titulo: 'A olimpíada da escola',
    texto: () => 'A escola abriu inscrições para uma olimpíada de matemática. Precisa estudar umas semanas antes.',
    opcoes: [
      { id: 'com_familia', texto: c => `Estudar à noite com ${nome(c, 'genitor')}`, comportamento: { disciplina: 1 },
        resolver: c => { const medalha = c.r.chance(clamp(0.15 + (c.v.mente.cognicao - 50) / 120, 0.05, 0.6)); return { texto: medalha ? 'Veio uma medalha de bronze — e a foto na geladeira.' : 'Não veio medalha. Ficaram as noites de exercício na mesa da cozinha.', memoria: medalha ? 'Ganhou medalha na olimpíada de matemática.' : null, lembrar: ['genitor', 'As noites estudando para a olimpíada.', 'ritual'], efeito: () => { praticar(c.v, c.r, 'exatas', 0.4, 1.2); prox(c, 'genitor', 6); if (medalha) marcar(c.v, 'conquista', 'Medalha na olimpíada de matemática.', 2); } }; } },
      { id: 'sozinho', texto: 'Estudar sozinho', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você estudou do seu jeito. Na prova, metade das questões pareceu conhecida.', memoria: null, efeito: () => praticar(c.v, c.r, 'exatas', 0.3, 1.1) }) },
      { id: 'nao', texto: 'Não participar', resolver: c => ({ texto: 'O sábado da prova foi de desenho animado.', memoria: null, efeito: () => feliz(c, 1) }) }
    ]
  },

  /* =================================================================== ESCOLA */
  {
    id: 'esc10_implicancia', tipo: 'decisao', peso: 2, idade: [11, 16], tema: 'escola', repetir: 3,
    papeis: { colega: fixo(P.colegaDe('escola')) }, quando: c => naEscola(c),
    titulo: 'Implicância',
    texto: c => `${nome(c, 'colega')} começou a implicar com você na frente da turma — um apelido, risada no fundo da sala.`,
    opcoes: [
      { id: 'conversar', texto: 'Chamar para conversar a sós', comportamento: { coragem: 1, empatia: 1 },
        resolver: c => { const ok = c.r.chance(0.5 + (c.p.colega.temperamento.afabilidade) * 0.3); return { texto: ok ? 'A sós, era outra pessoa. Disse que era brincadeira; depois, que não ia mais.' : 'Ele riu da conversa e contou para os outros. Ficou pior por uma semana.', memoria: null, efeito: () => { if (ok) { tensao(c, 'colega', -15); prox(c, 'colega', 4); } else { estresse(c, 6); tensao(c, 'colega', 8); } } }; } },
      { id: 'coordenacao', texto: 'Levar à coordenação', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'A coordenação chamou os dois e as famílias. A implicância parou; a turma achou que você "dedurou".', memoria: null, efeito: () => { tensao(c, 'colega', 6); estresse(c, -3); for (const x of vinculosVivos(c.v).filter(y => y.vin.convivio.includes('escola') && !y.vin.parentesco).slice(0, 3)) x.vin.proximidade = clamp(x.vin.proximidade - 2); } }) },
      { id: 'enfrentar', texto: 'Enfrentar na hora, na frente de todo mundo', comportamento: { coragem: 2, impulsividade: 1 },
        resolver: c => { const briga = c.r.chance(0.4); return { texto: briga ? 'Virou empurrão, depois briga. Os dois foram suspensos.' : 'Você respondeu à altura, e a turma riu dele desta vez. Ele parou.', memoria: briga ? 'Brigou na escola por causa de uma implicância.' : null, tom: briga ? 'ruim' : undefined,
          efeito: () => { if (briga) { machucarNaBriga(c.v, c.r, 1); subirNota(c, -4); tensao(c, 'colega', 20); } else { tensao(c, 'colega', 4); feliz(c, 2); } } }; } },
      { id: 'ignorar', texto: 'Ignorar até cansar', resolver: c => ({ texto: 'Você fingiu que não ouvia. Levou dois meses; um dia, ele achou outra pessoa.', memoria: null, efeito: () => estresse(c, 7) }) }
    ]
  },
  {
    id: 'esc10_professor', tipo: 'decisao', peso: 2, idade: [12, 17], tema: 'escola', repetir: 3,
    quando: c => naEscola(c) && nota(c) < 55 && !!instituicaoAtual(c.v),
    titulo: 'A ajuda que ofereceram',
    texto: c => `${quemEnsina(c, 'escola')} chamou você no fim da aula: viu que as notas caíram e ofereceu ajuda nas tardes de quinta.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar as tardes de quinta', comportamento: { disciplina: 1 },
        consequencia: () => 'As notas sobem — e a semana perde uma tarde.',
        resolver: c => { const p = professor(c); return { texto: 'As quintas viraram aula particular de graça. No fim do bimestre, a nota respondeu.', memoria: p ? `${p.nome} ajudou você nas tardes de quinta.` : 'Teve ajuda de um professor nas tardes de quinta.',
          efeito: () => { subirNota(c, 8); const f = materiasExtremas(c.v).fraca; if (f) praticar(c.v, c.r, f, 0.4, 1.2); estresse(c, 2); if (p) { aproximar(c, p.id, 10); lembrarCom(c.v, p.id, 'As tardes de quinta.', 'apoio', 2); registrarEco(c.v, 'mentor', { pessoaId: p.id, de: 3, ate: 14 }); } } }; } },
      { id: 'amigo', texto: 'Aceitar e chamar um amigo junto', comportamento: { generosidade: 1 },
        resolver: c => { const p = professor(c); return { texto: 'Vocês dois, o professor e um quadro cheio. O amigo também melhorou.', memoria: null, efeito: () => { subirNota(c, 6); if (p) aproximar(c, p.id, 6); const a = P.amigo(c.v)[0]; if (a) { const vin = c.v.vinculos[a.id]; vin.proximidade = clamp(vin.proximidade + 5); } } }; } },
      { id: 'recusar', texto: 'Agradecer e dizer que dá conta sozinho', resolver: () => ({ texto: 'Você disse que ia dar conta. Às vezes dá.', memoria: null }) }
    ]
  },
  {
    id: 'esc10_materia', tipo: 'decisao', peso: 2, idade: [12, 17], tema: 'escola', repetir: 2,
    papeis: { colega: fixo(P.colegaDe('escola')) }, quando: c => naEscola(c) && !!materiasExtremas(c.v).fraca,
    titulo: 'A matéria que não entra',
    texto: () => 'Uma matéria virou um muro: a prova está chegando e nada parece fazer sentido.',
    opcoes: [
      { id: 'particular', texto: c => `Aula particular (uns ${fmt(preco(c, 300))})`, disponivel: c => custa(c, preco(c, 300), 'A família não tem como pagar aula particular agora.'),
        resolver: c => ({ texto: 'Duas horas por semana com alguém que explica do zero. Entrou.', memoria: null, efeito: () => { pagar(c.v, preco(c, 300)); praticar(c.v, c.r, materiasExtremas(c.v).fraca!, 0.6, 1.3); subirNota(c, 5); } }) },
      { id: 'colega', texto: c => `Estudar com ${nome(c, 'colega')}, que entende`, comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: `${nome(c, 'colega')} explicava do jeito que você entendia. Ficaram amigos no caminho.`, memoria: null, lembrar: ['colega', 'Estudaram juntos para a prova.', 'amizade'], efeito: () => { praticar(c.v, c.r, materiasExtremas(c.v).fraca!, 0.4, 1.1); subirNota(c, 3); prox(c, 'colega', 10); } }) },
      { id: 'aceitar', texto: 'Aceitar a nota baixa e cuidar do resto', resolver: c => ({ texto: 'Você escolheu as batalhas. Aquela, perdeu de propósito.', memoria: null, efeito: () => { subirNota(c, -2); estresse(c, -4); } }) }
    ]
  },
  {
    id: 'esc10_projeto', tipo: 'decisao', peso: 2, idade: [12, 17], tema: 'escola', repetir: 2,
    quando: c => naEscola(c),
    titulo: 'O convite para o projeto',
    texto: () => 'A escola vai montar um projeto para a feira estadual — robótica, um experimento, uma peça. Chamaram você.',
    opcoes: [
      { id: 'entrar', texto: 'Entrar no grupo', comportamento: { sociabilidade: 1 },
        resolver: c => { const premio = c.r.chance(0.2); return { texto: premio ? 'O projeto foi para a final — e voltou com uma menção honrosa.' : 'Semanas de trabalho depois da aula. Não ganharam; aprenderam muito.', memoria: premio ? 'O projeto da escola ganhou menção na feira estadual.' : null, efeito: () => { praticar(c.v, c.r, 'ciencias', 0.3, 1.1); estresse(c, 3); if (premio) marcar(c.v, 'conquista', 'Menção honrosa na feira estadual.', 2); } }; } },
      { id: 'liderar', texto: 'Liderar o grupo', comportamento: { coragem: 1, disciplina: 1 },
        resolver: c => ({ texto: 'Você dividiu tarefas, cobrou prazos, segurou a apresentação. Cansou — e aprendeu a liderar.', memoria: 'Liderou o projeto da escola.', efeito: () => { praticar(c.v, c.r, 'lideranca', 0.5, 1.2); estresse(c, 6); } }) },
      { id: 'recusar', texto: 'Dizer que não tem tempo', resolver: c => ({ texto: 'Você ficou de fora. A semana seguiu igual.', memoria: null, efeito: () => feliz(c, 0) }) }
    ]
  },
  {
    id: 'esc10_competicao', tipo: 'decisao', peso: 2, idade: [13, 17], tema: 'lazer', repetir: 2,
    quando: c => ['futebol', 'volei', 'natacao', 'atletismo', 'lutas', 'basquete', 'tenis', 'musica', 'xadrez'].some(d => habilidade(c.v, d as never) >= 30) && livre(c),
    titulo: 'Uma competição de verdade',
    texto: () => 'Abriu a inscrição para uma competição regional naquilo que você faz bem.',
    opcoes: [
      { id: 'treinar', texto: 'Treinar mais e se inscrever', comportamento: { disciplina: 1 },
        resolver: c => { const d = (['futebol', 'volei', 'natacao', 'atletismo', 'lutas', 'basquete', 'tenis', 'musica', 'xadrez'] as const).reduce((a, b) => (habilidade(c.v, b) > habilidade(c.v, a) ? b : a)); const podio = c.r.chance(clamp((habilidade(c.v, d) - 30) / 70, 0.08, 0.6)); return { texto: podio ? 'Pódio. A medalha ficou pendurada no quarto por anos.' : 'Não deu pódio. Deu a medida de onde você está.', memoria: podio ? 'Subiu ao pódio numa competição regional.' : null, efeito: () => { praticar(c.v, c.r, d, 0.4, 1.2); estresse(c, 3); if (podio) marcar(c.v, 'conquista', 'Pódio numa competição regional.', 2, { dominio: d }); } }; } },
      { id: 'ir', texto: 'Ir do jeito que está', resolver: c => ({ texto: 'Você foi, competiu e voltou com histórias. Sem medalha.', memoria: null, efeito: () => feliz(c, 2) }) },
      { id: 'nao', texto: 'Não ir', resolver: c => ({ texto: 'O fim de semana foi outro.', memoria: null, efeito: () => estresse(c, -1) }) }
    ]
  },

  /* =================================================================== ADOLESCÊNCIA */
  {
    id: 'ado10_festa', tipo: 'decisao', peso: 2, idade: [14, 17], tema: 'familia', repetir: 2,
    papeis: { genitor: fixo(P.genitorEmCasa) }, quando: c => livre(c),
    titulo: 'A festa proibida',
    texto: c => `Todo mundo vai à festa de sábado. ${nome(c, 'genitor')} disse que não, sem discussão.`,
    opcoes: [
      { id: 'escondido', texto: 'Ir escondido', comportamento: { impulsividade: 1 },
        resolver: c => { const pego = c.r.chance(0.4); return { texto: pego ? 'A festa foi ótima até a mensagem: "estou na porta". O castigo durou um mês.' : 'Voltou antes de amanhecer, ninguém soube. O coração ainda bate rápido lembrando.', memoria: pego ? 'Foi pego numa festa escondido.'.replace('pego', c.g('pego', 'pega', 'pegue')) : null, tom: pego ? 'ruim' : undefined, efeito: () => { feliz(c, pego ? -3 : 4); if (pego) { tensao(c, 'genitor', 14); } else { const a = P.amigo(c.v)[0]; if (a) c.v.vinculos[a.id].proximidade = clamp(c.v.vinculos[a.id].proximidade + 4); } } }; } },
      { id: 'argumentar', texto: 'Argumentar: quem vai, a que horas volta, quem busca', comportamento: { disciplina: 1 },
        resolver: c => { const sim = c.r.chance(0.5 + (c.v.vinculos[c.p.genitor.id]?.confianca ?? 50 - 50) / 200); return { texto: sim ? 'Depois de meia hora de condições, saiu o sim — com hora para voltar.' : 'Não foi desta vez. Mas a conversa ficou: na próxima, talvez.', memoria: null, efeito: () => { if (sim) { feliz(c, 3); const vin = c.v.vinculos[c.p.genitor.id]; if (vin) vin.confianca = clamp(vin.confianca + 4); } else prox(c, 'genitor', 2); } }; } },
      { id: 'ficar', texto: 'Ficar em casa', resolver: c => ({ texto: 'Na segunda, a festa foi o único assunto. Você ouviu.', memoria: null, efeito: () => feliz(c, -2) }) }
    ]
  },
  {
    id: 'ado10_bico', tipo: 'decisao', peso: 2, idade: [15, 17], tema: 'trabalho', repetir: 2,
    quando: c => !emprego(c) && livre(c),
    titulo: 'Um bico no fim de semana',
    texto: () => 'Um vizinho precisa de alguém para ajudar no fim de semana — entregas, estoque, o que aparecer.',
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { disciplina: 1 },
        consequencia: c => `Uns ${fmt(preco(c, 1200))} no ano; os sábados vão embora.`,
        resolver: c => ({ texto: 'O primeiro dinheiro que é só seu. E o cansaço de sábado à noite.', memoria: 'O primeiro bico, aos ' + idade(c.v) + '.', efeito: () => { c.v.financas.conta += preco(c, 1200); subirNota(c, -2); estresse(c, 3); marcarFato(c.v, 'primeiro_bico'); } }) },
      { id: 'recusar', texto: 'Recusar: o fim de semana é para descansar e estudar', resolver: c => ({ texto: 'Você disse que não. Os sábados continuaram seus.', memoria: null, efeito: () => estresse(c, -2) }) }
    ]
  },
  {
    id: 'ado10_amigo_apuros', tipo: 'decisao', peso: 2, idade: [14, 17], tema: 'amizade', repetir: 3,
    papeis: { amigo: fixo(P.amigoProximo) },
    titulo: 'O amigo em apuros',
    texto: c => `${nome(c, 'amigo')} aprontou em casa e está com medo de contar. Pediu para dizer que estava com você.`,
    opcoes: [
      { id: 'cobrir', texto: 'Cobrir', comportamento: { generosidade: 1 },
        resolver: c => { const descobriu = c.r.chance(0.35); return { texto: descobriu ? 'A história não fechou. Os pais dos dois souberam; sobrou para você também.' : `Funcionou. ${nome(c, 'amigo')} não esquece.`, memoria: null, efeito: () => { const vin = c.v.vinculos[c.p.amigo.id]; vin.confianca = clamp(vin.confianca + (descobriu ? 2 : 8)); if (descobriu) for (const g of P.genitor(c.v)) { const w = c.v.vinculos[g.id]; if (w) w.tensao = clamp(w.tensao + 8); } else registrarEco(c.v, 'favor', { pessoaId: c.p.amigo.id, de: 4, ate: 20 }); } }; } },
      { id: 'convencer', texto: 'Convencer a contar a verdade (e ir junto)', comportamento: { empatia: 1, coragem: 1 },
        resolver: c => ({ texto: `Você foi junto. Foi duro para ${nome(c, 'amigo')} — e passou mais rápido do que a mentira passaria.`, memoria: null, lembrar: ['amigo', 'Você foi junto contar a verdade.', 'apoio'], efeito: () => { prox(c, 'amigo', 6); const vin = c.v.vinculos[c.p.amigo.id]; vin.confianca = clamp(vin.confianca + 5); } }) },
      { id: 'fora', texto: 'Não se meter', resolver: c => ({ texto: `Você disse que não ia mentir. ${nome(c, 'amigo')} entendeu — mais ou menos.`, memoria: null, efeito: () => prox(c, 'amigo', -5) }) }
    ]
  },

  /* =================================================================== FACULDADE */
  {
    id: 'fac10_estagio', tipo: 'decisao', peso: 2, idade: [18, 30], tema: 'estudo', repetir: 2,
    quando: c => naFaculdade(c) && !emprego(c) && livre(c),
    titulo: 'Uma vaga de estágio',
    texto: c => `O mural do curso de ${curso(c.v.educacao.matricula!.cursoId).nome} tem uma vaga de estágio na área, com bolsa.`,
    opcoes: [
      { id: 'candidatar', texto: 'Mandar o currículo', comportamento: { disciplina: 1 },
        consequencia: () => 'Abre a porta do estágio (em Caminhos · Trabalho): aceitar ou não é com você.',
        resolver: c => ({ texto: 'O currículo foi. A resposta veio: há uma vaga esperando a sua decisão.', memoria: null, efeito: () => { novaOportunidade(c.v, { tipo: 'estagio', ocupacaoId: 'estagio_adm', meses: 12, chave: 'estagio_mural', titulo: 'O estágio do mural', texto: 'A vaga do mural da faculdade: meio período, com bolsa, na área.', bonus: 0.3 }); } }) },
      { id: 'focar', texto: 'Focar nos estudos agora', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você deixou a vaga para outro. O semestre rendeu.', memoria: null, efeito: () => subirNota(c, 4) }) }
    ]
  },
  {
    id: 'fac10_pesquisa', tipo: 'decisao', peso: 2, idade: [18, 32], tema: 'estudo', repetir: undefined,
    quando: c => naFaculdade(c) && nota(c) >= 60 && c.v.fatos['formacao:projeto_aceito'] === undefined && !!instituicaoAtual(c.v),
    titulo: 'O convite para a pesquisa',
    texto: c => `${quemEnsina(c, 'faculdade')} viu as suas provas e chamou para um projeto de pesquisa. Paga pouco; ensina muito.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { disciplina: 1 },
        consequencia: () => 'Menos tempo livre; uma porta para a pós (e uma carta de recomendação, um dia).',
        resolver: c => { const p = professor(c); return { texto: 'Um laboratório, uma mesa num canto, um problema que ninguém resolveu ainda.', memoria: p ? `Entrou num projeto de pesquisa com ${p.nome}.` : 'Entrou num projeto de pesquisa.', relevancia: 'biografia',
          efeito: () => { c.v.fatos['formacao:projeto_aceito'] = c.v.t; subirNota(c, 3); cognicao(c, 1); estresse(c, 4); if (p) { aproximar(c, p.id, 8); lembrarCom(c.v, p.id, 'O projeto de pesquisa.', 'apoio', 2); registrarEco(c.v, 'mentor', { pessoaId: p.id, de: 2, ate: 15 }); } } }; } },
      { id: 'recusar', texto: 'Recusar por agora', resolver: () => ({ texto: 'Você agradeceu e disse que talvez depois. O professor disse que a porta fica aberta. Às vezes fica.', memoria: null, efeito: () => {} }) }
    ]
  },
  {
    id: 'fac10_aperto', tipo: 'decisao', peso: 2, idade: [18, 35], tema: 'dinheiro', repetir: 2,
    quando: c => naFaculdade(c) && aperto(c) && (c.v.educacao.matricula!.mensalidade > 0),
    titulo: 'O semestre que não fecha',
    texto: c => `A mensalidade do semestre venceu e a conta não cobre. Faltam uns ${fmt(c.v.educacao.matricula!.mensalidade * 2)}.`,
    opcoes: [
      { id: 'bico', texto: 'Pegar bicos à noite', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Noites de garçom, fins de semana de entrega. A mensalidade fechou; as notas sentiram.', memoria: null, efeito: () => { c.v.financas.conta += c.v.educacao.matricula!.mensalidade * 2; subirNota(c, -6); estresse(c, 8); saude(c, -1); } }) },
      { id: 'trancar', texto: 'Trancar o semestre', resolver: c => ({ texto: 'Você trancou. O curso espera; a cabeça, também.', memoria: 'Trancou a faculdade por falta de dinheiro.', efeito: () => { const m = c.v.educacao.matricula!; m.trancado = true; m.tTrancou = c.v.t; estresse(c, -3); feliz(c, -4); } }) },
      { id: 'negociar', texto: 'Negociar com a faculdade', comportamento: { coragem: 1 },
        resolver: c => { const ok = c.r.chance(0.55); return { texto: ok ? 'A secretaria parcelou a dívida em seis vezes, sem juros.' : 'A secretaria disse que não há o que fazer. Pelo menos você tentou.', memoria: null, efeito: () => { if (ok) c.v.financas.conta += Math.round(c.v.educacao.matricula!.mensalidade * 1.5); else estresse(c, 4); } }; } }
    ]
  },
  {
    id: 'fac10_mudar', tipo: 'decisao', peso: 2, idade: [18, 30], tema: 'estudo', repetir: undefined,
    quando: c => naFaculdade(c) && nota(c) < 45 && c.v.t - c.v.educacao.matricula!.tInicio >= 12 && c.v.t - c.v.educacao.matricula!.tInicio <= 30,
    titulo: 'Será este o curso?',
    texto: c => `Faz ${Math.round((c.v.t - c.v.educacao.matricula!.tInicio) / 12)} ano(s) de ${curso(c.v.educacao.matricula!.cursoId).nome}, e cada aula pesa mais. Às vezes a dúvida é sobre o curso, não sobre você.`,
    opcoes: [
      { id: 'mudar', texto: 'Largar e tentar outro curso no próximo processo', comportamento: { coragem: 1 },
        consequencia: () => 'O curso acaba agora; o próximo começa do zero (a escolha volta em Caminhos · Estudos).',
        resolver: c => ({ texto: 'Você largou. Ficou um alívio e uma pergunta: e agora?', memoria: `Largou ${curso(c.v.educacao.matricula!.cursoId).nome} para tentar outro curso.`, relevancia: 'marco', efeito: () => { registrarEco(c.v, 'mudou_de_curso', { texto: curso(c.v.educacao.matricula!.cursoId).nome, de: 3, ate: 10 }); c.v.educacao.matricula = undefined; estresse(c, -8); } }) },
      { id: 'insistir', texto: 'Insistir: mais um semestre com outra postura', comportamento: { disciplina: 2 },
        resolver: c => ({ texto: 'Você mudou o horário de estudo, sentou na frente. O semestre foi difícil — e melhor.', memoria: null, efeito: () => { subirNota(c, 7); estresse(c, 6); } }) },
      { id: 'trancar', texto: 'Trancar um semestre para pensar', resolver: c => ({ texto: 'Um semestre fora para entender o que se quer. O curso espera.', memoria: null, efeito: () => { const m = c.v.educacao.matricula!; m.trancado = true; m.tTrancou = c.v.t; estresse(c, -5); } }) }
    ]
  },

  /* =================================================================== TRABALHO */
  {
    id: 'trab10_promocao', tipo: 'decisao', peso: 2, idade: [20, 64], tema: 'trabalho', repetir: 4,
    quando: c => { const e = emprego(c); const oc = e && ocupacaoOuNula(e.ocupacaoId); return !!e && !!oc && !e.posAposentadoria && !e.formacaoAte && e.contrato !== 'eletivo' && e.desempenho >= 60 && c.v.t - (e.tPosto ?? e.tInicio) >= 24 && !!proximoDegrau(c.v, e, oc) && livre(c); },
    titulo: 'A proposta',
    texto: c => { const e = emprego(c)!; const prox_ = proximoDegrau(c.v, e, ocupacao(e.ocupacaoId))!; return `A chefia chamou: há uma vaga de ${nomeOcupacao(c.v, prox_)}. O salário sobe; a responsabilidade e as horas também.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Mesa nova, gente nova respondendo a você, e o telefone tocando depois das seis.', memoria: null, efeito: () => { const e = emprego(c)!; const oc = ocupacao(e.ocupacaoId); const p = proximoDegrau(c.v, e, oc); if (p) subirDeCargo(c.v, e, oc, p); estresse(c, 5); } }) },
      { id: 'negociar', texto: 'Aceitar se o salário vier maior', comportamento: { coragem: 1 },
        resolver: c => { const ok = c.r.chance(clamp((emprego(c)!.desempenho - 55) / 50, 0.15, 0.7)); return { texto: ok ? 'Toparam. O salário veio acima do que ofereceram.' : 'Não toparam o valor. A vaga foi para outra pessoa — e ficou um clima.', memoria: null, efeito: () => { const e = emprego(c)!; const oc = ocupacao(e.ocupacaoId); if (ok) { const p = proximoDegrau(c.v, e, oc); if (p) { subirDeCargo(c.v, e, oc, p); e.salario = Math.round(e.salario * 1.06 / 10) * 10; } } else { e.desempenho = clamp(e.desempenho - 3); registrarEco(c.v, 'recusou', { texto: 'a promoção', de: 3, ate: 8 }); } } }; } },
      { id: 'recusar', texto: 'Recusar: a vida de agora está boa', comportamento: { familia: 1 },
        consequencia: () => 'Fica tudo como está — e a escolha fica na lembrança da empresa.',
        resolver: c => ({ texto: 'Você agradeceu e ficou onde estava. Sobrou tempo; sobrou também a pergunta.', memoria: 'Recusou uma promoção.', efeito: () => { registrarEco(c.v, 'recusou', { texto: 'a promoção', de: 3, ate: 8 }); estresse(c, -3); } }) }
    ]
  },
  {
    id: 'trab10_colega', tipo: 'decisao', idade: [18, 66], tema: 'trabalho', repetir: 4,
    papeis: { colega: fixo(P.genteDe('trabalho')) }, quando: c => !!emprego(c),
    titulo: 'Um colega difícil',
    texto: c => `${nome(c, 'colega')} toma crédito pelo que você faz e some quando o trabalho aperta. A equipe toda percebe.`,
    opcoes: [
      { id: 'particular', texto: 'Conversar em particular', comportamento: { coragem: 1, empatia: 1 },
        resolver: c => { const ok = c.r.chance(0.45 + c.p.colega.temperamento.afabilidade * 0.3); return { texto: ok ? 'A conversa foi melhor do que você esperava. As coisas mudaram — devagar.' : 'Ele negou tudo e passou a falar mal de você pelos corredores.', memoria: null, efeito: () => { if (ok) { tensao(c, 'colega', -12); prox(c, 'colega', 5); } else { tensao(c, 'colega', 15); estresse(c, 5); } } }; } },
      { id: 'chefia', texto: 'Levar à chefia, com fatos', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'A chefia ouviu e redistribuiu as tarefas. O colega soube de onde veio.', memoria: null, efeito: () => { const e = emprego(c)!; e.desempenho = clamp(e.desempenho + 3); tensao(c, 'colega', 20); } }) },
      { id: 'aproximar', texto: 'Tentar trabalhar junto de outro jeito', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'Você chamou para dividir um projeto, com as partes de cada um escritas. Funcionou melhor do que a briga.', memoria: null, efeito: () => { prox(c, 'colega', 8); tensao(c, 'colega', -6); estresse(c, 2); } }) },
      { id: 'aguentar', texto: 'Aguentar calado', resolver: c => ({ texto: 'Você engoliu. O estômago passou a reclamar às segundas.', memoria: null, efeito: () => { estresse(c, 8); saude(c, -1); } }) }
    ]
  },
  {
    id: 'trab10_salario', tipo: 'decisao', peso: 2, idade: [20, 64], tema: 'trabalho', repetir: 3,
    quando: c => { const e = emprego(c); return !!e && !e.posAposentadoria && e.contrato !== 'servidor' && e.contrato !== 'autonomo' && e.contrato !== 'informal' && e.contrato !== 'eletivo' && c.v.t - (e.tPosto ?? e.tInicio) >= 24 && e.desempenho >= 50; },
    titulo: 'A conversa sobre salário',
    texto: () => 'Dois anos no mesmo salário, com mais trabalho a cada mês. A avaliação anual é semana que vem.',
    opcoes: [
      { id: 'dados', texto: 'Pedir aumento com números (o que entregou, o que o mercado paga)', comportamento: { disciplina: 1, coragem: 1 },
        resolver: c => { const e = emprego(c)!; const ok = c.r.chance(clamp((e.desempenho - 45) / 55, 0.15, 0.75)); return { texto: ok ? 'Saiu um aumento de verdade.' : 'Disseram que não há orçamento este ano. Disseram também que viram o seu trabalho.', memoria: null, efeito: () => { if (ok) e.salario = Math.round(e.salario * 1.08 / 10) * 10; else e.desempenho = clamp(e.desempenho + 1); } }; } },
      { id: 'proposta', texto: 'Dizer que tem outra proposta', comportamento: { coragem: 2 },
        resolver: c => { const e = emprego(c)!; const x = c.r.next(); return { texto: x < 0.45 ? 'Cobriram a "proposta". O salário subiu bem.' : x < 0.75 ? 'Não cobriram, e o clima azedou: ficou a impressão de que você está de saída.' : 'Disseram que, se é assim, você pode ir. Você ficou — e eles também lembram.', memoria: null, efeito: () => { if (x < 0.45) e.salario = Math.round(e.salario * 1.14 / 10) * 10; else e.desempenho = clamp(e.desempenho - (x < 0.75 ? 4 : 8)); } }; } },
      { id: 'nao', texto: 'Não pedir', resolver: c => ({ texto: 'Mais um ano no mesmo valor. A inflação pediu por você.', memoria: null, efeito: () => estresse(c, 2) }) }
    ]
  },
  {
    id: 'trab10_transferencia', tipo: 'decisao', peso: 2, idade: [22, 60], tema: 'trabalho', repetir: 6,
    quando: c => { const e = emprego(c); return !!e && e.contrato === 'clt' && (ocupacaoOuNula(e.ocupacaoId)?.nivel ?? 0) >= 2 && livre(c); },
    titulo: 'A transferência',
    texto: () => `A empresa vai abrir uma unidade em outra cidade, longe daqui, e quer você lá: salário maior, tudo novo.`,
    opcoes: [
      { id: 'ir', texto: 'Ir', comportamento: { coragem: 1 },
        consequencia: () => 'Muda de cidade (e quem mora com você vai junto, por vontade ou não).',
        resolver: c => { const destino = cidadeLonge(c.v, 'sao-paulo-sp'); return { texto: 'Caixas, uma cidade estranha, um escritório novo. O salário veio maior; o resto, aos poucos.', memoria: 'Aceitou uma transferência para outra cidade.', relevancia: 'marco', efeito: () => { const e = emprego(c)!; if (destino !== c.v.moradia.municipioId) { e.municipioId = destino; mudarAgora(c.v, destino, 'pela transferência do trabalho'); const par = reacaoDaParceriaAMudanca(c.v); if (par) escrever(c.v, { texto: par, relevancia: 'cotidiano', tema: 'amor' }); } e.salario = Math.round(e.salario * 1.15 / 10) * 10; estresse(c, 6); } }; } },
      { id: 'remoto', texto: 'Propor trabalhar daqui, viajando quando precisar', comportamento: { coragem: 1 },
        resolver: c => { const ok = c.r.chance(0.35); return { texto: ok ? 'Aceitaram: uma semana por mês lá, o resto daqui.' : 'Não aceitaram. A vaga foi para outra pessoa.', memoria: null, efeito: () => { const e = emprego(c)!; if (ok) { e.salario = Math.round(e.salario * 1.07 / 10) * 10; estresse(c, 4); } else registrarEco(c.v, 'recusou', { texto: 'a transferência', de: 3, ate: 8 }); } }; } },
      { id: 'ficar', texto: 'Recusar e ficar', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Você ficou. Aqui está a sua gente.', memoria: null, efeito: () => { registrarEco(c.v, 'recusou', { texto: 'a transferência', de: 3, ate: 8 }); feliz(c, 1); } }) }
    ]
  },

  {
    id: 'trab10_erro', tipo: 'decisao', peso: 2, idade: [18, 66], tema: 'trabalho', repetir: 5,
    papeis: { colega: fixo(P.genteDe('trabalho')) }, quando: c => !!emprego(c) && livre(c),
    titulo: 'O erro',
    texto: () => 'Um erro seu passou despercebido e custou caro: um pedido errado, um prazo perdido. A chefia está procurando o responsável.',
    opcoes: [
      { id: 'assumir', texto: 'Assumir o erro e propor como corrigir', comportamento: { coragem: 1, disciplina: 1 },
        resolver: c => ({ texto: 'Você assumiu na reunião, com um plano na mão. Levou uma bronca — e ganhou um respeito que não esperava.', memoria: null, efeito: () => { const e = emprego(c)!; e.desempenho = clamp(e.desempenho - 2); estresse(c, 4); for (const x of vinculosVivos(c.v).filter(y => y.vin.convivio.includes('trabalho')).slice(0, 4)) x.vin.confianca = clamp(x.vin.confianca + 3); } }) },
      { id: 'esconder', texto: 'Ficar quieto e torcer', comportamento: { impulsividade: 1 },
        resolver: c => { const achou = c.r.chance(0.5); return { texto: achou ? 'A auditoria achou o rastro até você. O problema agora não era o erro: era o silêncio.' : 'Ninguém descobriu. O assunto morreu — em você, não.', memoria: null, tom: achou ? 'ruim' : undefined, efeito: () => { const e = emprego(c)!; if (achou) e.desempenho = clamp(e.desempenho - 15); else estresse(c, 6); } }; } },
      { id: 'culpar', texto: c => `Deixar a culpa cair em ${nome(c, 'colega')}`, comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: `${nome(c, 'colega')} levou a advertência. Soube depois, por outra pessoa, de onde ela tinha vindo.`, memoria: `Deixou ${nome(c, 'colega')} levar a culpa por um erro seu.`, tom: 'ruim', efeito: () => { tensao(c, 'colega', 30); const w = c.v.vinculos[c.p.colega.id]; w.confianca = clamp(w.confianca - 30); prox(c, 'colega', -15); } }) }
    ]
  },
  /* =================================================================== DESEMPREGO */
  {
    id: 'des10_requalificar', tipo: 'decisao', peso: 2, idade: [20, 60], tema: 'trabalho', repetir: 3,
    quando: c => desempregado(c) && livre(c),
    titulo: 'Um curso de requalificação',
    texto: () => 'Um programa público abriu turmas gratuitas de requalificação — informática, logística, atendimento. Três meses, à tarde.',
    opcoes: [
      { id: 'fazer', texto: 'Fazer o curso', comportamento: { disciplina: 1 },
        consequencia: () => 'Três meses de aula; a procura fica mais forte depois.',
        resolver: c => ({ texto: 'Três meses de aula com gente na mesma situação. Saiu um certificado — e dois contatos.', memoria: 'Fez um curso de requalificação.', efeito: () => { praticar(c.v, c.r, 'linguagens', 0.3, 1); c.v.fatos['requalificou'] = c.v.t; feliz(c, 2); novaOportunidade(c.v, { tipo: 'indicacao', ocupacaoId: 'aux_adm', meses: 12, chave: 'requalificacao', titulo: 'A indicação do curso', texto: 'O programa encaminha para empresas parceiras: auxiliar administrativo, com carteira.', bonus: 0.25 }); } }) },
      { id: 'procurar', texto: 'Seguir procurando do jeito de antes', resolver: c => ({ texto: 'Mais currículos, mais esperas.', memoria: null, efeito: () => estresse(c, 3) }) }
    ]
  },

  /* =================================================================== AMIZADES */
  {
    id: 'ami10_emprestimo', tipo: 'decisao', idade: [18, 85], tema: 'amizade', repetir: 4,
    papeis: { amigo: fixo(P.amigoProximo) }, quando: c => disponivel(c.v) >= preco(c, 2000),
    titulo: 'O pedido',
    texto: c => `${nome(c, 'amigo')} pediu dinheiro emprestado: uns ${fmt(preco(c, 2000))}, para fechar o mês. Disse que devolve.`,
    opcoes: [
      { id: 'emprestar', texto: 'Emprestar tudo', comportamento: { generosidade: 2 },
        consequencia: () => 'O dinheiro sai agora; a volta — dele e da ajuda — fica para depois.',
        resolver: c => ({ texto: `${nome(c, 'amigo')} chorou ao telefone. Prometeu devolver em três meses.`, memoria: `Emprestou dinheiro a ${nome(c, 'amigo')} num aperto.`, lembrar: ['amigo', 'Você emprestou dinheiro num aperto.', 'apoio'], efeito: () => { pagar(c.v, preco(c, 2000)); const vin = c.v.vinculos[c.p.amigo.id]; vin.confianca = clamp(vin.confianca + 6); registrarEco(c.v, 'favor', { pessoaId: c.p.amigo.id, valor: preco(c, 2000), de: 2, ate: 15 }); } }) },
      { id: 'metade', texto: 'Emprestar metade', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `Metade ajudou. ${nome(c, 'amigo')} agradeceu — e foi pedir o resto em outro lugar.`, memoria: null, efeito: () => { pagar(c.v, preco(c, 1000)); prox(c, 'amigo', 2); } }) },
      { id: 'ajudar_outro', texto: 'Não emprestar, mas ajudar a reorganizar as contas', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'Uma noite de planilha e café. Não resolveu o mês; resolveu o próximo.', memoria: null, efeito: () => { prox(c, 'amigo', 3); estresse(c, 1); } }) },
      { id: 'recusar', texto: 'Recusar com franqueza', resolver: c => ({ texto: `${nome(c, 'amigo')} disse que entendia. A voz disse outra coisa.`, memoria: null, efeito: () => { prox(c, 'amigo', -6); tensao(c, 'amigo', 6); } }) }
    ]
  },
  {
    id: 'ami10_reencontro', tipo: 'decisao', idade: [20, 90], tema: 'amizade', repetir: 5,
    papeis: { antigo: fixo(v => vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && (x.vin.estagio === 'afastado' || x.vin.estagio === 'ex_amigo') && v.t - x.vin.tUltimoContato >= 48
      // REWORK 10.5 · REL-07: o "lembrei de você" não vem de quem ainda está brigado ou magoado; depois de uma ruptura, só anos depois.
      && (procuraComoSeNada(v, x.vin) || (!!x.vin.ruptura && v.t - x.vin.ruptura.t >= 60 && (x.vin.magoa?.ressentimento ?? 0) < 25 && x.vin.digital?.bloqueado === undefined))).map(x => x.p)) },
    titulo: 'Quem reapareceu',
    texto: c => `${nome(c, 'antigo')} mandou mensagem depois de anos: "lembrei de você hoje".`,
    opcoes: [
      { id: 'retomar', texto: 'Marcar um café', comportamento: { sociabilidade: 1 },
        resolver: c => { const vin = c.v.vinculos[c.p.antigo.id]; const ruptura = !!vin.ruptura; const ok = ruptura ? reconciliar(c.v, c.r, c.p.antigo, vin) : true; if (!ruptura) { vin.estagio = 'amigo'; vin.proximidade = clamp(vin.proximidade + 15); vin.tUltimoContato = c.v.t; } return { texto: ok ? 'Duas horas de café que pareceram dez minutos. Como se o tempo não tivesse passado — e tinha.' : 'O café foi educado. O que separou vocês ainda estava na mesa.', memoria: ok ? `Reencontrou ${nome(c, 'antigo')} depois de anos.` : null, lembrar: ok ? ['antigo', 'O café do reencontro.', 'reconciliacao'] : undefined }; } },
      { id: 'responder', texto: 'Responder com carinho, sem marcar nada', resolver: c => ({ texto: 'Uma troca de mensagens boa. Ficou nisso.', memoria: null, efeito: () => prox(c, 'antigo', 4) }) },
      { id: 'ignorar', texto: 'Não responder', resolver: c => ({ texto: 'A mensagem ficou lá, lida.', memoria: null, efeito: () => prox(c, 'antigo', -3) }) }
    ]
  },

  /* =================================================================== NAMORO E CASAMENTO */
  {
    id: 'rom10_planos', tipo: 'decisao', peso: 2, idade: [18, 60], tema: 'amor', repetir: 4,
    papeis: { pessoa: fixo(P.namorado) }, quando: c => c.v.t - (c.v.vinculos[c.p.pessoa.id].romance?.tInicio ?? c.v.t) >= 12,
    titulo: 'Planos diferentes',
    texto: c => `${nome(c, 'pessoa')} quer ${c.p.pessoa.querFilhos === 'sim' ? 'filhos logo' : 'viajar o mundo antes de qualquer coisa'}; você, outra coisa. A conversa voltou três vezes este mês.`,
    opcoes: [
      { id: 'ceder', texto: 'Mudar os seus planos por vocês', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Você cedeu. O relacionamento ficou mais leve; você, nem sempre.', memoria: null, efeito: () => { tensao(c, 'pessoa', -10); const r = c.v.vinculos[c.p.pessoa.id].romance; if (r) r.envolvimento = clamp(r.envolvimento + 6); feliz(c, -3); } }) },
      { id: 'meio', texto: 'Propor um meio-termo, com prazo', comportamento: { empatia: 1 },
        resolver: c => { const ok = c.r.chance(0.55 + c.p.pessoa.temperamento.afabilidade * 0.2); return { texto: ok ? 'Um combinado escrito num guardanapo: "daqui a dois anos, a gente decide".' : 'O meio-termo não convenceu. A conversa ficou para depois.', memoria: null, efeito: () => { tensao(c, 'pessoa', ok ? -8 : 4); const vin = c.v.vinculos[c.p.pessoa.id]; if (ok) vin.confianca = clamp(vin.confianca + 5); } }; } },
      { id: 'manter', texto: 'Manter os seus planos', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Você disse o que queria, sem rodeio. Ficou um silêncio grande entre os dois.', memoria: null, efeito: () => { tensao(c, 'pessoa', 12); const r = c.v.vinculos[c.p.pessoa.id].romance; if (r) r.envolvimento = clamp(r.envolvimento - 6); } }) }
    ]
  },
  {
    id: 'rom10_ciume', tipo: 'decisao', idade: [16, 70], tema: 'amor', repetir: 3,
    papeis: { pessoa: fixo(P.parceiro) },
    titulo: 'O ciúme',
    texto: c => `${nome(c, 'pessoa')} anda mais no celular, rindo de mensagens que não mostra. Você reparou — e não para de reparar.`,
    opcoes: [
      { id: 'conversar', texto: 'Dizer o que está sentindo', comportamento: { coragem: 1, empatia: 1 },
        resolver: c => ({ texto: `${nome(c, 'pessoa')} mostrou: era o grupo do trabalho, e uma piada interna. A conversa sobre o que você sentiu durou mais do que a explicação.`, memoria: null, efeito: () => { const vin = c.v.vinculos[c.p.pessoa.id]; vin.confianca = clamp(vin.confianca + 5); tensao(c, 'pessoa', -4); } }) },
      { id: 'celular', texto: 'Pedir para ver o celular', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: `${nome(c, 'pessoa')} entregou, de cara fechada. Não havia nada — e agora havia uma desconfiança dita em voz alta.`, memoria: null, efeito: () => { const vin = c.v.vinculos[c.p.pessoa.id]; vin.confianca = clamp(vin.confianca - 8); tensao(c, 'pessoa', 12); } }) },
      { id: 'calar', texto: 'Guardar para si', resolver: c => ({ texto: 'Você não disse nada. A pergunta ficou girando por semanas.', memoria: null, efeito: () => { estresse(c, 6); tensao(c, 'pessoa', 3); } }) }
    ]
  },
  {
    id: 'cas10_rotina', tipo: 'decisao', peso: 2, idade: [25, 85], tema: 'amor', repetir: 5,
    papeis: { pessoa: fixo(P.conjuge) }, quando: c => (c.v.vinculos[c.p.pessoa.id].romance?.envolvimento ?? 100) < 65 && c.v.vinculos[c.p.pessoa.id].tensao < 45,
    titulo: 'A rotina',
    texto: c => `Você e ${nome(c, 'pessoa')} viraram ótimos sócios da casa. Faz tempo que não são outra coisa.`,
    opcoes: [
      { id: 'viagem', texto: c => `Uma viagem só dos dois (uns ${fmt(preco(c, 3500))})`, disponivel: c => custa(c, preco(c, 3500), 'Não há dinheiro para uma viagem agora.'),
        resolver: c => ({ texto: 'Quatro dias sem crianças, sem contas, sem despertador. Voltaram namorando.', memoria: `Viajou só com ${nome(c, 'pessoa')} para reencontrar o casal.`, lembrar: ['pessoa', 'A viagem só dos dois.', 'ritual'], efeito: () => { pagar(c.v, preco(c, 3500)); const r = c.v.vinculos[c.p.pessoa.id].romance; if (r) r.envolvimento = clamp(r.envolvimento + 12); feliz(c, 5); estresse(c, -6); } }) },
      { id: 'ritual', texto: 'Criar um ritual semanal (o jantar de quinta, sem celular)', comportamento: { disciplina: 1, familia: 1 },
        resolver: c => ({ texto: 'As quintas viraram de vocês. Nas primeiras, ninguém sabia o que dizer; depois, não paravam.', memoria: null, lembrar: ['pessoa', 'O jantar de quinta.', 'ritual'], efeito: () => { const r = c.v.vinculos[c.p.pessoa.id].romance; if (r) r.envolvimento = clamp(r.envolvimento + 7); estresse(c, 1); } }) },
      { id: 'deixar', texto: 'Deixar como está: é assim mesmo', resolver: c => ({ texto: 'Tudo funciona. Ninguém reclama. Ninguém comemora.', memoria: null, efeito: () => { const r = c.v.vinculos[c.p.pessoa.id].romance; if (r) r.envolvimento = clamp(r.envolvimento - 4); } }) }
    ]
  },

  /* =================================================================== FAMÍLIA */
  {
    id: 'fam10_ajuda', tipo: 'decisao', peso: 2, idade: [22, 80], tema: 'familia', repetir: 4,
    papeis: { parente: fixo(v => vinculosVivos(v).filter(x => (x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai' || x.vin.parentesco === 'irmao') && !x.p.especie && (x.p.aperto && !x.p.aperto.resolvido && v.t - x.p.aperto.t <= 24)).map(x => x.p)) },
    titulo: 'A família pede ajuda',
    texto: c => `${nome(c, 'parente')} está num momento difícil e pediu ajuda — com dinheiro, ou com tempo.`,
    opcoes: [
      { id: 'dinheiro', texto: c => `Ajudar com dinheiro (uns ${fmt(preco(c, 2500))})`, disponivel: c => custa(c, preco(c, 2500), 'O dinheiro não dá agora.'),
        resolver: c => ({ texto: 'O dinheiro resolveu o mês. A gratidão ficou mais tempo.', memoria: `Ajudou ${nome(c, 'parente')} num aperto.`, lembrar: ['parente', 'Você ajudou com dinheiro no aperto.', 'apoio'], efeito: () => { pagar(c.v, preco(c, 2500)); prox(c, 'parente', 8); registrarEco(c.v, 'cuidou', { pessoaId: c.p.parente.id, de: 3, ate: 25 }); } }) },
      { id: 'tempo', texto: 'Ajudar com tempo (as visitas, as filas, a burocracia)', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'Semanas de filas e telefonemas. Cansou — e aproximou.', memoria: null, lembrar: ['parente', 'Você esteve junto nas filas e nos telefonemas.', 'apoio'], efeito: () => { prox(c, 'parente', 10); estresse(c, 6); registrarEco(c.v, 'cuidou', { pessoaId: c.p.parente.id, de: 3, ate: 25 }); } }) },
      { id: 'nao_poder', texto: 'Dizer que não pode agora', resolver: c => ({ texto: `${nome(c, 'parente')} disse que entendia. A família inteira soube.`, memoria: null, efeito: () => { tensao(c, 'parente', 10); for (const x of vinculosVivos(c.v).filter(y => y.vin.parentesco && y.p.id !== c.p.parente.id && !y.p.especie).slice(0, 3)) x.vin.tensao = clamp(x.vin.tensao + 3); } }) }
    ]
  },
  {
    id: 'fam10_dinheiro', tipo: 'decisao', peso: 2, idade: [25, 80], tema: 'familia', repetir: 5,
    papeis: { irmao: fixo(P.irmao) }, quando: c => P.irmao(c.v).length >= 1 && P.genitor(c.v).some(g => idadePessoa(c.v, g) >= 65),
    titulo: 'Dinheiro na família',
    texto: c => `${nome(c, 'irmao')} acha que os pais precisam de uma cuidadora e que cada filho paga uma parte. Nem todo mundo concorda.`,
    opcoes: [
      { id: 'pagar', texto: 'Topar e pagar a sua parte', comportamento: { familia: 1, generosidade: 1 },
        resolver: c => ({ texto: 'A cuidadora começou na segunda. Os pais reclamaram uma semana; depois, agradeceram.', memoria: null, efeito: () => { c.v.fatos['ajuda_cuidadora'] = c.v.t; for (const g of P.genitor(c.v)) { const w = c.v.vinculos[g.id]; if (w) w.proximidade = clamp(w.proximidade + 5); } prox(c, 'irmao', 6); pagar(c.v, Math.min(disponivel(c.v), preco(c, 4000))); } }) },
      { id: 'mediar', texto: 'Mediar: uma reunião com todos os irmãos', comportamento: { empatia: 1 },
        resolver: c => { const ok = c.r.chance(0.6); return { texto: ok ? 'A reunião foi longa e saiu um combinado: cada um com o que pode.' : 'A reunião virou acerto de contas antigo. Ninguém saiu de acordo.', memoria: null, efeito: () => { if (ok) prox(c, 'irmao', 5); else tensao(c, 'irmao', 12); } }; } },
      { id: 'contra', texto: 'Dizer que os pais ainda se viram sozinhos', resolver: c => ({ texto: `${nome(c, 'irmao')} ficou de pagar sozinh${c.p.irmao.genero === 'feminino' ? 'a' : 'o'}. E não esqueceu.`, memoria: null, efeito: () => { tensao(c, 'irmao', 15); prox(c, 'irmao', -5); } }) }
    ]
  },
  {
    id: 'fam10_ligacao', tipo: 'decisao', peso: 2, idade: [20, 90], tema: 'familia', repetir: 6,
    papeis: { parente: fixo(v => vinculosVivos(v).filter(x => x.vin.parentesco && !x.p.especie && !!x.vin.ruptura).map(x => x.p)) },
    titulo: 'A ligação',
    texto: c => `${nome(c, 'parente')}, com quem você não fala desde ${Math.floor(c.v.vinculos[c.p.parente.id].ruptura!.t / 12)}, ligou.`,
    opcoes: [
      { id: 'atender', texto: 'Atender e conversar', comportamento: { empatia: 1, coragem: 1 },
        resolver: c => { const ok = reconciliar(c.v, c.r, c.p.parente, c.v.vinculos[c.p.parente.id]); return { texto: ok ? 'A conversa demorou a começar. Quando começou, não parou.' : 'Vocês tentaram. Ainda não deu — mas a linha ficou aberta.', memoria: ok ? `Fez as pazes com ${nome(c, 'parente')}.` : null, relevancia: ok ? 'marco' : undefined, efeito: () => { if (!ok) prox(c, 'parente', 3); } }; } },
      { id: 'mensagem', texto: 'Não atender; mandar uma mensagem depois', resolver: c => ({ texto: 'Uma mensagem curta, educada. Não era o que a ligação queria.', memoria: null, efeito: () => prox(c, 'parente', 2) }) },
      { id: 'recusar', texto: 'Deixar tocar', resolver: c => ({ texto: 'O telefone tocou até parar.', memoria: null, efeito: () => { tensao(c, 'parente', 4); estresse(c, 3); } }) }
    ]
  },
  {
    id: 'fam10_diagnostico', tipo: 'decisao', peso: 2, idade: [25, 85], tema: 'familia', repetir: 5,
    papeis: { genitor: fixo(v => P.genitor(v).filter(g => g.saude < 45 && idadePessoa(v, g) >= 60)) },
    titulo: 'O diagnóstico',
    texto: c => `${nome(c, 'genitor')} recebeu um diagnóstico difícil. O tratamento vai ser longo.`,
    opcoes: [
      { id: 'acompanhar', texto: 'Acompanhar de perto (as consultas, os exames)', comportamento: { familia: 2, empatia: 1 },
        consequencia: () => 'Tempo e cansaço seus; a presença vira memória.',
        resolver: c => ({ texto: 'Salas de espera, exames, o café ruim do hospital. Vocês conversaram mais do que em anos.', memoria: `Acompanhou ${nome(c, 'genitor')} no tratamento.`, relevancia: 'biografia', lembrar: ['genitor', 'Você esteve junto no tratamento.', 'apoio'], efeito: () => { prox(c, 'genitor', 12); estresse(c, 10); c.p.genitor.saude = clamp(c.p.genitor.saude + 2); registrarEco(c.v, 'cuidou', { pessoaId: c.p.genitor.id, de: 1, ate: 20 }); } }) },
      { id: 'pagar', texto: c => `Ajudar a pagar o melhor tratamento (uns ${fmt(preco(c, 8000))})`, disponivel: c => custa(c, preco(c, 8000), 'O dinheiro não chega a isso.'),
        resolver: c => ({ texto: 'O tratamento particular começou logo, sem fila.', memoria: null, efeito: () => { pagar(c.v, preco(c, 8000)); c.p.genitor.saude = clamp(c.p.genitor.saude + 6); prox(c, 'genitor', 6); } }) },
      { id: 'irmaos', texto: 'Deixar os irmãos à frente', resolver: c => ({ texto: 'Os irmãos cuidaram. Você ligava aos domingos.', memoria: null, efeito: () => { for (const i of P.irmao(c.v)) { const w = c.v.vinculos[i.id]; if (w) w.tensao = clamp(w.tensao + 6); } prox(c, 'genitor', -3); } }) }
    ]
  },

  /* =================================================================== FILHOS */
  {
    id: 'fil10_escola', tipo: 'decisao', peso: 2, idade: [24, 70], tema: 'filhos', repetir: 3,
    papeis: { filho: fixo(P.filhoEmCasa(8, 16)) },
    titulo: 'A escola chamou',
    texto: c => `A escola chamou por causa de ${nome(c, 'filho')}: notas caindo e uma briga no recreio.`,
    opcoes: [
      { id: 'conversar', texto: 'Conversar com calma antes de qualquer coisa', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `Por trás da briga havia uma implicância que ${nome(c, 'filho')} vinha aguentando sozinh${c.p.filho.genero === 'feminino' ? 'a' : 'o'}. Agora não mais.`, memoria: null, lembrar: ['filho', 'A conversa depois da escola chamar.', 'apoio'], efeito: () => { prox(c, 'filho', 8); const vin = c.v.vinculos[c.p.filho.id]; vin.confianca = clamp(vin.confianca + 6); } }) },
      { id: 'castigo', texto: 'Castigo: sem celular por um mês', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'O mês de castigo foi cumprido. O que aconteceu, ninguém perguntou.', memoria: null, efeito: () => { tensao(c, 'filho', 10); } }) },
      { id: 'defender', texto: 'Ir à escola defender o filho', comportamento: { familia: 1, coragem: 1 },
        resolver: c => ({ texto: 'Você chegou de peito aberto. A coordenação mostrou o vídeo; você saiu menos certo.', memoria: null, efeito: () => { prox(c, 'filho', 4); estresse(c, 4); } }) }
    ]
  },
  {
    id: 'fil10_largar', tipo: 'decisao', peso: 2, idade: [26, 70], tema: 'filhos', repetir: 3,
    papeis: { filho: fixo(P.filhoEmCasa(9, 16)) },
    titulo: 'Quero largar',
    texto: c => `${nome(c, 'filho')} quer largar a atividade que faz há anos. "Não é mais para mim."`,
    opcoes: [
      { id: 'deixar', texto: 'Deixar largar', comportamento: { empatia: 1 },
        resolver: c => ({ texto: `${nome(c, 'filho')} largou e, dois meses depois, achou outra coisa sozinh${c.p.filho.genero === 'feminino' ? 'a' : 'o'}.`, memoria: null, efeito: () => { const vin = c.v.vinculos[c.p.filho.id]; vin.confianca = clamp(vin.confianca + 5); } }) },
      { id: 'insistir', texto: 'Pedir mais um ano antes de decidir', comportamento: { disciplina: 1 },
        resolver: c => { const ficou = c.r.chance(0.5); return { texto: ficou ? 'O ano a mais mudou tudo: veio um professor novo, e o gosto voltou.' : 'O ano a mais foi arrastado. No fim, largou — e lembrou que você insistiu.', memoria: null, efeito: () => { if (ficou) prox(c, 'filho', 4); else tensao(c, 'filho', 8); } }; } },
      { id: 'negociar', texto: 'Trocar por outra atividade, escolhida junto', comportamento: { empatia: 1, disciplina: 1 },
        resolver: c => ({ texto: 'Uma tarde olhando opções juntos. Escolheram outra coisa; a decisão foi dos dois.', memoria: null, efeito: () => { prox(c, 'filho', 6); } }) }
    ]
  },
  {
    id: 'fil10_volta', tipo: 'decisao', peso: 2, idade: [45, 90], tema: 'filhos', repetir: 6,
    papeis: { filho: fixo(v => P.filho(22, 40)(v).filter(f => !v.vinculos[f.id]?.convivio.includes('casa') && (f.renda ?? 0) === 0)) },
    titulo: 'A volta para casa',
    texto: c => `${nome(c, 'filho')} perdeu o emprego e perguntou se pode voltar a morar com você por um tempo.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { familia: 2 },
        resolver: c => ({ texto: 'O quarto antigo voltou a ter dono. A casa ficou mais cheia — e mais barulhenta.', memoria: `${nome(c, 'filho')} voltou a morar em casa.`, efeito: () => { const vin = c.v.vinculos[c.p.filho.id]; if (!vin.convivio.includes('casa')) vin.convivio.push('casa'); prox(c, 'filho', 6); estresse(c, 3); } }) },
      { id: 'aluguel', texto: c => `Ajudar com o aluguel por uns meses (uns ${fmt(preco(c, 4000))})`, disponivel: c => custa(c, preco(c, 4000), 'O dinheiro não dá.'),
        resolver: c => ({ texto: `${nome(c, 'filho')} ficou onde estava, com a sua ajuda. A independência ficou de pé.`, memoria: null, efeito: () => { pagar(c.v, preco(c, 4000)); prox(c, 'filho', 5); } }) },
      { id: 'nao', texto: 'Dizer que não: é hora de se virar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `${nome(c, 'filho')} se virou. Demorou a perdoar.`, memoria: null, efeito: () => { tensao(c, 'filho', 14); } }) }
    ]
  },

  /* =================================================================== SAÚDE */
  {
    id: 'sau10_sintoma', tipo: 'decisao', peso: 2, idade: [18, 95], tema: 'saude', repetir: 3,
    quando: c => c.v.corpo.condicoes.some(x => x.diagnosticada === false) && livre(c),
    titulo: 'O sintoma que não passa',
    texto: () => 'Há semanas o corpo dá um sinal que não passa. Você já procurou na internet três vezes.',
    opcoes: [
      { id: 'medico', texto: c => `Ir ao médico agora${c.v.financas.planoDeSaude ? ' (o plano cobre)' : ''}`, comportamento: { disciplina: 1 },
        consequencia: () => 'Cedo, o que tem nome tem tratamento.',
        resolver: c => { const s = c.v.corpo.condicoes.find(x => x.diagnosticada === false)!; diagnosticar(c.v, s, 'consulta'); const t = registrarDiagnostico(c.v, s, 'consulta'); return { texto: t, memoria: null }; } },
      { id: 'esperar', texto: 'Esperar mais um pouco', resolver: c => ({ texto: 'Você esperou. O sinal também.', memoria: null, efeito: () => { saude(c, -3); estresse(c, 3); } }) },
      { id: 'internet', texto: 'Ler mais na internet', resolver: c => ({ texto: 'Às duas da manhã, você tinha certeza de doze doenças diferentes.', memoria: null, efeito: () => estresse(c, 6) }) }
    ]
  },
  {
    id: 'sau10_habitos', tipo: 'decisao', peso: 2, idade: [30, 85], tema: 'saude', repetir: 4,
    quando: c => c.v.corpo.saude < 55 && livre(c),
    titulo: 'O médico foi direto',
    texto: () => 'Na consulta de rotina, o médico tirou os óculos: "do jeito que está, não dá". Pediu mudança de hábitos.',
    opcoes: [
      { id: 'academia', texto: 'Começar a se mexer de verdade', comportamento: { disciplina: 2 },
        consequencia: () => 'Entra na semana (Minha Semana): corpo e saúde respondem com o tempo.',
        resolver: c => ({ texto: 'Primeira semana: dor em músculos que você nem sabia que tinha. Terceira: vontade de ir.', memoria: 'Mudou de hábitos depois de um susto na consulta.', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'corrida' || r.id === 'academia')) c.v.rotinas.push({ id: 'corrida', tInicio: c.v.t, nivel: 1 }); forma(c, 2); } }) },
      { id: 'comida', texto: 'Mudar a comida', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Menos sal, menos fritura, mais panela. O exame do ano seguinte agradeceu.', memoria: null, efeito: () => { saude(c, 4); feliz(c, -1); } }) },
      { id: 'ignorar', texto: 'Ouvir e seguir igual', resolver: c => ({ texto: 'Você saiu da consulta prometendo. Prometeu de novo no ano seguinte.', memoria: null, efeito: () => saude(c, -2) }) }
    ]
  },

  /* =================================================================== ESPORTE */
  {
    id: 'esp10_prova_jogo', tipo: 'decisao', peso: 2, idade: [14, 25], tema: 'lazer', repetir: 2,
    quando: c => c.v.caminhos.esporte?.fase === 'base' && (naEscola(c) || naFaculdade(c)),
    titulo: 'A prova e o jogo',
    texto: () => 'A prova mais importante do bimestre caiu no mesmo dia do jogo que decide a classificação.',
    opcoes: [
      { id: 'prova', texto: 'Fazer a prova', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você fez a prova. O time perdeu sem você — e o treinador anotou.', memoria: null, efeito: () => { subirNota(c, 5); const f = c.v.caminhos.frentes[c.v.caminhos.esporte!.modalidade]; if (f) f.habilidade = clamp(f.habilidade - 0.5); } }) },
      { id: 'jogo', texto: 'Ir ao jogo', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Você jogou bem. A prova de recuperação veio depois, e veio difícil.', memoria: null, efeito: () => { subirNota(c, -6); praticar(c.v, c.r, c.v.caminhos.esporte!.modalidade, 0.2, 1.2); } }) },
      { id: 'treinador', texto: 'Conversar com o treinador e com a escola', comportamento: { empatia: 1, disciplina: 1 },
        resolver: c => { const ok = c.r.chance(0.5); return { texto: ok ? 'A escola adiantou a prova em um dia. Deu para os dois.' : 'Ninguém mudou nada. Você escolheu a prova, no fim.', memoria: null, efeito: () => { subirNota(c, ok ? 3 : 4); } }; } }
    ]
  },

  /* =================================================================== DINHEIRO */
  {
    id: 'din10_sociedade', tipo: 'decisao', idade: [25, 70], tema: 'dinheiro', repetir: 6,
    papeis: { amigo: fixo(P.amigo) }, quando: c => disponivel(c.v) >= preco(c, 15000) && livre(c),
    titulo: 'A sociedade',
    texto: c => `${nome(c, 'amigo')} vai abrir um negócio e ofereceu sociedade: entra com uns ${fmt(preco(c, 15000))} e vira dono de uma parte.`,
    opcoes: [
      { id: 'entrar', texto: 'Entrar', comportamento: { coragem: 1, impulsividade: 1 },
        consequencia: () => 'O dinheiro sai agora; o retorno (ou a perda) vem em uns anos.',
        resolver: c => ({ texto: 'Assinaram num bar, com a caneta do garçom. O negócio abriu três meses depois.', memoria: `Virou sócio do negócio de ${nome(c, 'amigo')}.`, efeito: () => { pagar(c.v, preco(c, 15000)); prox(c, 'amigo', 5); registrarEco(c.v, 'investiu', { pessoaId: c.p.amigo.id, valor: preco(c, 15000), de: 2, ate: 5 }); } }) },
      { id: 'recusar', texto: 'Recusar, desejando sorte', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `${nome(c, 'amigo')} entendeu. Você foi à inauguração.`, memoria: null, efeito: () => prox(c, 'amigo', 1) }) }
    ]
  },
  {
    id: 'din10_golpe', tipo: 'decisao', idade: [18, 95], tema: 'dinheiro', repetir: 4,
    quando: c => c.v.financas.conta >= preco(c, 1000),
    titulo: 'A mensagem do "banco"',
    texto: () => 'Uma mensagem urgente, com o nome do seu banco: "atividade suspeita — confirme seus dados no link para não bloquear a conta".',
    opcoes: [
      { id: 'clicar', texto: 'Clicar e confirmar', comportamento: { impulsividade: 1 },
        resolver: c => { const perda = Math.min(c.v.financas.conta, preco(c, 2500)); return { texto: `Era golpe. ${fmt(perda)} saíram da conta antes de você entender. O banco devolveu uma parte, meses depois.`, memoria: 'Caiu num golpe pelo celular.', tom: 'ruim', efeito: () => { c.v.financas.conta -= Math.round(perda * 0.6); estresse(c, 10); abalar(c.v, 'o golpe', -6, 8); } }; } },
      { id: 'ligar', texto: 'Ligar para o banco pelo número do cartão', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'O atendente confirmou: golpe. Você bloqueou o número e avisou o grupo da família.', memoria: null, efeito: () => { marcarFato(c.v, 'golpe_evitado'); estresse(c, -1); for (const g of P.genitor(c.v)) { const w = c.v.vinculos[g.id]; if (w) w.confianca = clamp(w.confianca + 2); } } }) },
      { id: 'ignorar', texto: 'Apagar a mensagem', resolver: () => ({ texto: 'Apagou. Nunca mais pensou nisso.', memoria: null }) }
    ]
  },
  {
    id: 'din10_fiador', tipo: 'decisao', idade: [25, 80], tema: 'dinheiro', repetir: 8,
    papeis: { parente: fixo(v => vinculosVivos(v).filter(x => (x.vin.parentesco === 'irmao' || x.vin.parentesco === 'primo' || x.vin.parentesco === 'tio') && !x.p.especie && idadePessoa(v, x.p) >= 20).map(x => x.p)) },
    quando: c => disponivel(c.v) >= preco(c, 5000),
    titulo: 'O fiador',
    texto: c => `${nome(c, 'parente')} vai alugar um apartamento e pediu que você seja fiador. "É só uma assinatura."`,
    opcoes: [
      { id: 'assinar', texto: 'Assinar', comportamento: { generosidade: 1, familia: 1 },
        consequencia: () => 'Se o aluguel atrasar, a conta chega em você.',
        resolver: c => ({ texto: 'Você assinou. A chave saiu no mesmo dia.', memoria: `Foi fiador de ${nome(c, 'parente')}.`, efeito: () => { prox(c, 'parente', 6); if (c.p.parente.temperamento.responsabilidade < 0) registrarEco(c.v, 'fiador', { pessoaId: c.p.parente.id, valor: preco(c, 6000), de: 1, ate: 4 }); } }) },
      { id: 'recusar', texto: 'Recusar, explicando', resolver: c => ({ texto: `${nome(c, 'parente')} achou outro fiador. E um jeito de lembrar disso em todo almoço de família.`, memoria: null, efeito: () => tensao(c, 'parente', 8) }) }
    ]
  },

  /* =================================================================== CASA */
  {
    id: 'mor10_vizinho', tipo: 'decisao', idade: [18, 95], tema: 'casa', repetir: 4,
    quando: c => c.v.moradia.tipo === 'aluguel' || c.v.moradia.tipo === 'propria',
    titulo: 'O vizinho',
    texto: () => 'O vizinho de cima faz festa toda quinta, até as três da manhã.',
    opcoes: [
      { id: 'conversar', texto: 'Bater na porta e conversar', comportamento: { coragem: 1 },
        resolver: c => { const ok = c.r.chance(0.55); return { texto: ok ? 'Ele pediu desculpas, sem graça. As quintas ficaram mais calmas.' : 'Ele disse que a casa é dele. As quintas continuaram.', memoria: null, efeito: () => estresse(c, ok ? -3 : 5) }; } },
      { id: 'condominio', texto: 'Reclamar formalmente', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'A advertência veio por escrito. Ele parou — e passou a fingir que não vê você no elevador.', memoria: null, efeito: () => estresse(c, -2) }) },
      { id: 'aguentar', texto: 'Comprar tampões de ouvido', resolver: c => ({ texto: 'Os tampões funcionaram em metade das quintas.', memoria: null, efeito: () => { estresse(c, 3); saude(c, -1); } }) }
    ]
  },
  {
    id: 'mor10_reajuste', tipo: 'decisao', idade: [18, 95], tema: 'casa', repetir: 3,
    quando: c => c.v.moradia.tipo === 'aluguel' && (c.v.moradia.aluguel ?? 0) > 0,
    titulo: 'O reajuste',
    texto: c => `O contrato vence e o dono quer subir o aluguel em 15%: de ${fmt(c.v.moradia.aluguel)} para ${fmt(Math.round(c.v.moradia.aluguel * 1.15))}.`,
    opcoes: [
      { id: 'negociar', texto: 'Negociar (você paga em dia há anos)', comportamento: { coragem: 1 },
        resolver: c => { const ok = c.r.chance(0.6); return { texto: ok ? 'Fecharam em 6%. O dono gosta de inquilino que paga em dia.' : 'O dono não baixou nada.', memoria: null, efeito: () => { c.v.moradia.aluguel = Math.round(c.v.moradia.aluguel * (ok ? 1.06 : 1.15)); } }; } },
      { id: 'aceitar', texto: 'Aceitar', resolver: c => ({ texto: 'Mais caro, mas sem mudança.', memoria: null, efeito: () => { c.v.moradia.aluguel = Math.round(c.v.moradia.aluguel * 1.15); } }) },
      { id: 'procurar', texto: 'Procurar outro lugar (em Vida · Casa)', resolver: c => ({ texto: 'Você começou a olhar anúncios. A decisão é sua, na imobiliária.', memoria: null, efeito: () => { c.v.moradia.aluguel = Math.round(c.v.moradia.aluguel * 1.15); c.v.fatos['procurando_casa'] = c.v.t; } }) }
    ]
  },

  /* =================================================================== VIAGENS */
  {
    id: 'via10_amigos', tipo: 'decisao', idade: [18, 70], tema: 'lazer', repetir: 3,
    papeis: { amigo: fixo(P.amigoProximo) }, quando: c => livre(c),
    titulo: 'O convite',
    texto: c => `${nome(c, 'amigo')} está juntando a turma para uma viagem de cinco dias. Uns ${fmt(preco(c, 2200))} cada.`,
    opcoes: [
      { id: 'ir', texto: 'Ir', disponivel: c => custa(c, preco(c, 2200), 'O dinheiro não dá agora.'),
        resolver: c => ({ texto: 'Cinco dias de estrada, praia e histórias que vão ser contadas por anos.', memoria: `Viajou com a turma de ${nome(c, 'amigo')}.`, lembrar: ['amigo', 'A viagem com a turma.', 'ritual'], efeito: () => { pagar(c.v, preco(c, 2200)); prox(c, 'amigo', 10); feliz(c, 6); estresse(c, -8); } }) },
      { id: 'nao', texto: 'Não ir', resolver: c => ({ texto: 'As fotos chegaram no grupo a semana inteira.', memoria: null, efeito: () => { prox(c, 'amigo', -3); feliz(c, -1); } }) }
    ]
  },

  /* =================================================================== VIDA PÚBLICA */
  {
    id: 'pub10_entrevista', tipo: 'decisao', peso: 2, idade: [18, 95], tema: 'trabalho', repetir: 3,
    quando: c => (c.v.notoriedade?.valor ?? 0) >= 25,
    titulo: 'O jornalista',
    texto: () => 'Um jornalista quer uma entrevista longa: a vida, o começo, o que ninguém sabe.',
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar e falar abertamente', comportamento: { coragem: 1 },
        resolver: c => { const boa = c.r.chance(0.65); return { texto: boa ? 'A matéria saiu bonita. As pessoas param você na rua para falar dela.' : 'Uma frase tirada do contexto virou manchete. Você passou uma semana explicando.', memoria: null, efeito: () => { const n = c.v.notoriedade!; n.valor = clamp(n.valor + (boa ? 4 : 1)); if (!boa) estresse(c, 8); } }; } },
      { id: 'controlada', texto: 'Aceitar, com perguntas combinadas', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Uma matéria correta, sem surpresas. Nem boas, nem ruins.', memoria: null, efeito: () => { const n = c.v.notoriedade!; n.valor = clamp(n.valor + 2); } }) },
      { id: 'recusar', texto: 'Recusar', resolver: c => ({ texto: 'Você manteve a vida longe dos jornais. Por enquanto.', memoria: null, efeito: () => estresse(c, -1) }) }
    ]
  },

  /* =================================================================== VELHICE */
  {
    id: 'vel10_tempo', tipo: 'decisao', peso: 2, idade: [60, 95], tema: 'lazer', repetir: 6,
    quando: c => !!c.v.trabalho.aposentadoria && !c.v.trabalho.atual,
    titulo: 'O que fazer com o tempo',
    texto: () => 'Aposentadoria: os dias inteiros, de repente, são seus. Ninguém ensina o que fazer com isso.',
    opcoes: [
      { id: 'voluntario', texto: 'Ser voluntário', comportamento: { generosidade: 1, empatia: 1 },
        resolver: c => ({ texto: 'Duas manhãs por semana ensinando gente a ler. Você nunca se sentiu tão útil.', memoria: 'Virou voluntário depois de se aposentar.'.replace('voluntário', c.g('voluntário', 'voluntária', 'voluntárie')), efeito: () => { feliz(c, 8); estresse(c, -4); if (!c.v.rotinas.some(r => r.id === 'voluntariado')) c.v.rotinas.push({ id: 'voluntariado', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'aprender', texto: 'Aprender algo que nunca teve tempo de aprender', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Um curso de violão aos sessenta e tantos. Os dedos doem; a cabeça agradece.', memoria: null, efeito: () => { cognicao(c, 2); feliz(c, 4); praticar(c.v, c.r, 'musica', 0.4, 1); } }) },
      { id: 'descansar', texto: 'Descansar, enfim', resolver: c => ({ texto: 'Café demorado, jornal inteiro, cochilo depois do almoço. Mereceu.', memoria: null, efeito: () => { estresse(c, -6); forma(c, -1); } }) }
    ]
  },
  {
    id: 'vel10_sozinho', tipo: 'decisao', peso: 2, idade: [75, 100], tema: 'casa', repetir: 4,
    papeis: { filho: fixo(P.filho(30, 80)) }, quando: c => c.v.corpo.saude < 50 && !vinculosVivos(c.v).some(x => x.vin.convivio.includes('casa') && !x.p.especie),
    titulo: 'Morar sozinho ainda?',
    texto: c => `Depois do tombo do mês passado, ${nome(c, 'filho')} acha que você não deveria mais morar sozinh${c.g('o', 'a', 'e')}.`,
    opcoes: [
      { id: 'perto', texto: c => `Mudar para perto de ${nome(c, 'filho')}`, comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Um apartamento pequeno a duas quadras. Os netos passam no caminho da escola.', memoria: `Mudou para perto de ${nome(c, 'filho')} na velhice.`, efeito: () => { if (c.p.filho.municipioId !== c.v.moradia.municipioId) mudarAgora(c.v, c.p.filho.municipioId, 'para ficar perto da família'); prox(c, 'filho', 10); feliz(c, 2); } }) },
      { id: 'cuidador', texto: c => `Contratar alguém para ajudar em casa (uns ${fmt(preco(c, 2500))} por mês)`, disponivel: c => custa(c, preco(c, 2500) * 6, 'O dinheiro não sustenta isso.'),
        resolver: c => ({ texto: 'A ajuda chega às oito e sai às seis. A casa continua sua.', memoria: null, efeito: () => { pagar(c.v, preco(c, 2500) * 6); saude(c, 3); } }) },
      { id: 'ficar', texto: 'Ficar como está', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Você disse que ainda dá conta. Na maior parte dos dias, dá.', memoria: null, efeito: () => { tensao(c, 'filho', 8); saude(c, -2); } }) }
    ]
  },

  /* =================================================================== MAIS SITUAÇÕES */
  {
    id: 'inf10_vaso', tipo: 'decisao', peso: 1.5, idade: [5, 10], tema: 'familia', repetir: undefined,
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'O vaso',
    texto: c => `Você quebrou o vaso preferido de ${nome(c, 'genitor')}, jogando bola dentro de casa. Ninguém viu.`,
    opcoes: [
      { id: 'contar', texto: 'Contar logo', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Teve bronca, e depois um abraço: "obrigado por contar".', memoria: 'Contou que tinha quebrado o vaso, mesmo sem ninguém ter visto.', lembrar: ['genitor', 'A vez que você contou do vaso.', 'apoio'], efeito: () => { const w = c.v.vinculos[c.p.genitor.id]; if (w) w.confianca = clamp(w.confianca + 6); } }) },
      { id: 'esconder', texto: 'Esconder os cacos', comportamento: { impulsividade: 1 },
        resolver: c => { const achou = c.r.chance(0.6); return { texto: achou ? 'Os cacos apareceram atrás do sofá uma semana depois. A bronca foi pela mentira, não pelo vaso.' : 'Ninguém achou. Você pensou nos cacos por meses.', memoria: null, efeito: () => { const w = c.v.vinculos[c.p.genitor.id]; if (achou && w) { w.confianca = clamp(w.confianca - 6); w.tensao = clamp(w.tensao + 6); } else estresse(c, 3); } }; } },
      { id: 'irmao', texto: 'Dizer que foi o gato', disponivel: c => P.pet(c.v).length > 0 || 'Não há gato nem cachorro para levar a culpa.',
        resolver: c => ({ texto: 'O bicho levou a culpa e ficou de castigo no quintal. Você não conseguiu olhar para ele aquela noite.', memoria: null, efeito: () => estresse(c, 4) }) }
    ]
  },
  {
    id: 'ami10_segredo', tipo: 'decisao', idade: [14, 80], tema: 'amizade', repetir: 5,
    papeis: { amigo: fixo(P.amigoProximo) },
    titulo: 'O segredo',
    texto: c => `${nome(c, 'amigo')} contou um segredo pesado — e pediu que ficasse entre vocês. Outra pessoa próxima seria afetada se soubesse.`,
    opcoes: [
      { id: 'guardar', texto: 'Guardar', comportamento: { empatia: 1 },
        resolver: c => ({ texto: 'Você guardou. O segredo pesou em você algumas noites.', memoria: null, efeito: () => { const w = c.v.vinculos[c.p.amigo.id]; w.confianca = clamp(w.confianca + 8); estresse(c, 3); } }) },
      { id: 'aconselhar', texto: 'Guardar, mas insistir que conte por conta própria', comportamento: { empatia: 1, coragem: 1 },
        resolver: c => { const contou = c.r.chance(0.5); return { texto: contou ? `${nome(c, 'amigo')} contou, semanas depois. Disse que foi por você.` : `${nome(c, 'amigo')} ainda não teve coragem. Mas sabe que você acha que deve.`, memoria: null, efeito: () => { const w = c.v.vinculos[c.p.amigo.id]; w.confianca = clamp(w.confianca + (contou ? 6 : 2)); } }; } },
      { id: 'contar', texto: 'Contar para quem seria afetado', comportamento: { coragem: 1 },
        resolver: c => ({ texto: `A verdade apareceu. ${nome(c, 'amigo')} soube de onde veio — e não perdoou fácil.`, memoria: `Contou um segredo de ${nome(c, 'amigo')}.`, tom: 'ruim', efeito: () => { const w = c.v.vinculos[c.p.amigo.id]; w.confianca = clamp(w.confianca - 25); w.tensao = clamp(w.tensao + 25); } }) }
    ]
  },
  {
    id: 'cas10_dinheiro', tipo: 'decisao', peso: 2, idade: [22, 85], tema: 'amor', repetir: 6,
    papeis: { pessoa: fixo(v => [...P.conjuge(v), ...P.parceiro(v)].filter((p, i, a) => a.indexOf(p) === i && v.vinculos[p.id]?.convivio.includes('casa'))) },
    titulo: 'O dinheiro da casa',
    texto: c => `Você e ${nome(c, 'pessoa')} pensam diferente sobre dinheiro: um guarda, o outro vive o agora. A conta do mês virou assunto de toda semana.`,
    opcoes: [
      { id: 'conjunta', texto: 'Juntar tudo numa conta só', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Uma conta, uma senha, um planejamento na geladeira. Menos brigas sobre "seu" e "meu".', memoria: null, efeito: () => { tensao(c, 'pessoa', -10); const w = c.v.vinculos[c.p.pessoa.id]; w.confianca = clamp(w.confianca + 5); c.v.fatos['conta_conjunta'] = c.v.t; } }) },
      { id: 'separadas', texto: 'Cada um com a sua, dividindo as contas da casa', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Uma planilha de quem paga o quê. Funciona — e às vezes parece contrato.', memoria: null, efeito: () => { tensao(c, 'pessoa', -4); } }) },
      { id: 'orcamento', texto: 'Sentar e fazer um orçamento juntos, com uma meta', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Uma noite de números e uma meta escrita: a reserva de seis meses. O dinheiro passou a sobrar um pouco.', memoria: null, efeito: () => { tensao(c, 'pessoa', -6); c.v.financas.conta += preco(c, 600); estresse(c, -2); } }) },
      { id: 'evitar', texto: 'Evitar o assunto', resolver: c => ({ texto: 'O assunto foi evitado. As brigas, não.', memoria: null, efeito: () => { tensao(c, 'pessoa', 8); estresse(c, 3); } }) }
    ]
  },
  {
    id: 'fam10_perto', tipo: 'decisao', peso: 2, idade: [22, 60], tema: 'familia', repetir: 8,
    papeis: { genitor: fixo(v => P.genitor(v).filter(g => idadePessoa(v, g) >= 62 && g.municipioId !== v.moradia.municipioId)) },
    quando: c => livre(c),
    titulo: 'Morar mais perto',
    texto: c => `${nome(c, 'genitor')} disse ao telefone, meio de brincadeira: "você podia morar mais perto da gente, agora que estamos ficando velhos".`,
    opcoes: [
      { id: 'mudar', texto: 'Voltar para perto', comportamento: { familia: 2 },
        consequencia: () => 'Muda de cidade (e o trabalho fica para trás, se não puder ir junto).',
        resolver: c => ({ texto: 'As caixas, a estrada, o quarto de hóspedes da infância por umas semanas. Os almoços de domingo voltaram.', memoria: `Voltou a morar perto de ${nome(c, 'genitor')}.`, relevancia: 'marco', efeito: () => { mudarAgora(c.v, c.p.genitor.municipioId, 'para ficar perto da família'); const par = reacaoDaParceriaAMudanca(c.v); if (par) escrever(c.v, { texto: par, relevancia: 'cotidiano', tema: 'amor' }); prox(c, 'genitor', 12); } }) },
      { id: 'visitas', texto: c => `Visitar mais (uns ${fmt(preco(c, 900))} por ano em viagens)`, comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Uma viagem a cada dois meses. A estrada ficou conhecida.', memoria: null, efeito: () => { pagar(c.v, preco(c, 900)); prox(c, 'genitor', 6); } }) },
      { id: 'ficar', texto: 'Explicar que a vida está aqui', resolver: c => ({ texto: `${nome(c, 'genitor')} disse que entendia. Ligou menos, no mês seguinte.`, memoria: null, efeito: () => prox(c, 'genitor', -4) }) }
    ]
  },
  {
    id: 'sau10_checkup', tipo: 'decisao', peso: 2, idade: [40, 90], tema: 'saude', repetir: 5,
    quando: c => livre(c) && c.v.corpo.condicoes.some(x => x.diagnosticada === false) === false,
    titulo: 'O check-up',
    texto: () => 'Faz anos desde os últimos exames. Um check-up completo leva uma manhã — e alguns dias de espera pelos resultados.',
    opcoes: [
      { id: 'fazer', texto: c => `Fazer o check-up${c.v.financas.planoDeSaude ? ' (o plano cobre)' : ` (uns ${fmt(preco(c, 500))})`}`, comportamento: { disciplina: 1 },
        disponivel: c => !!c.v.financas.planoDeSaude || custa(c, preco(c, 500)),
        resolver: c => ({ texto: 'Exames de sangue, um eletro, a esteira. Tudo dentro do esperado — e uma lista de cuidados para o ano.', memoria: null, efeito: () => { if (!c.v.financas.planoDeSaude) pagar(c.v, preco(c, 500)); saude(c, 2); estresse(c, -2); c.v.fatos['checkup'] = c.v.t; } }) },
      { id: 'depois', texto: 'Deixar para o ano que vem', resolver: c => ({ texto: 'O ano que vem é sempre mais tranquilo. Dizem.', memoria: null, efeito: () => saude(c, -1) }) }
    ]
  },
  {
    id: 'esp10_tecnico', tipo: 'decisao', peso: 2, idade: [16, 38], tema: 'lazer', repetir: 4,
    quando: c => { const e = c.v.caminhos.esporte; return !!e && e.fase !== 'encerrada' && c.v.t - e.tFase >= 12; },
    titulo: 'O técnico novo',
    texto: () => 'Chegou um técnico novo, com outro jeito de jogar — e ele ainda não sabe quem você é.',
    opcoes: [
      { id: 'adaptar', texto: 'Treinar dobrado para se encaixar', comportamento: { disciplina: 2 },
        resolver: c => ({ texto: 'Você chegou antes e saiu depois por um mês. O técnico reparou.', memoria: null, efeito: () => { const e = c.v.caminhos.esporte!; if (e.fase === 'profissional') e.espaco = 'titular'; praticar(c.v, c.r, e.modalidade, 0.3, 1.2); estresse(c, 5); forma(c, 1); } }) },
      { id: 'conversar', texto: 'Pedir uma conversa para entender o que ele quer', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Dez minutos na sala dele. Ele disse o que esperava; você soube onde estava.', memoria: null, efeito: () => estresse(c, -2) }) },
      { id: 'bater', texto: 'Bater de frente quando ele mudar a sua posição', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'A discussão foi no vestiário, na frente do grupo. Você foi para o banco.', memoria: null, tom: 'ruim', efeito: () => { const e = c.v.caminhos.esporte!; if (e.fase === 'profissional') e.espaco = 'reserva'; estresse(c, 6); } }) }
    ]
  },
  {
    id: 'esp10_dor', tipo: 'decisao', peso: 2, idade: [15, 38], tema: 'saude', repetir: 3,
    quando: c => { const e = c.v.caminhos.esporte; return !!e && e.fase !== 'encerrada' && !c.v.corpo.condicoes.some(x => x.lesao && v_ativa(c, x.lesao.tFim)); },
    titulo: 'A dor antes da final',
    texto: () => 'O joelho dói desde terça. Domingo é o jogo mais importante do ano.',
    opcoes: [
      { id: 'jogar', texto: 'Jogar assim mesmo', comportamento: { coragem: 1, impulsividade: 1 },
        resolver: c => { const piorou = c.r.chance(0.45); return { texto: piorou ? 'No segundo tempo, o joelho cedeu. Você saiu de maca.' : 'Você jogou no limite e saiu de campo mancando — e campeão.', memoria: piorou ? null : 'Jogou a final com dor e foi campeão.', tom: piorou ? 'ruim' : 'bom', efeito: () => { if (piorou) lesionar(c.v, c.r, 2, c.v.caminhos.esporte!.fase === 'profissional' ? 'profissional' : 'pratica'); else marcar(c.v, 'conquista', 'Campeão com o joelho doendo.', 2, { dominio: c.v.caminhos.esporte!.modalidade }); } }; } },
      { id: 'poupar', texto: 'Contar ao departamento médico e ficar de fora', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'O exame mostrou uma inflamação. Uma semana de gelo e você voltou inteiro. O time perdeu sem você.', memoria: null, efeito: () => { saude(c, 1); estresse(c, 3); } }) }
    ]
  },
  {
    id: 'trab10_esquema', tipo: 'decisao', peso: 1.5, idade: [22, 66], tema: 'trabalho', repetir: undefined,
    quando: c => { const e = emprego(c); return !!e && (ocupacaoOuNula(e.ocupacaoId)?.nivel ?? 0) >= 2 && livre(c) && !c.v.caminhos.envolvimento; },
    titulo: 'O que você viu',
    texto: () => 'Nos relatórios do setor, os números não fecham: alguém está desviando dinheiro da empresa há meses. Pelo jeito, gente de cima.',
    opcoes: [
      { id: 'denunciar', texto: 'Levar ao canal de denúncias, com o que encontrou', comportamento: { coragem: 2 },
        consequencia: () => 'A investigação demora; o que volta disso (reconhecimento ou troco) vem depois.',
        resolver: c => ({ texto: 'Você mandou tudo pelo canal oficial. Nos meses seguintes, o setor ficou estranho, e você não sabia em quem confiar.', memoria: 'Denunciou um desvio na empresa.', relevancia: 'biografia', efeito: () => { registrarEco(c.v, 'denunciou', { de: 1, ate: 4 }); estresse(c, 8); } }) },
      { id: 'perguntar', texto: 'Perguntar ao chefe, discretamente', comportamento: { empatia: 1 },
        resolver: c => { const envolvido = c.r.chance(0.5); return { texto: envolvido ? 'O chefe mudou de assunto e, no mês seguinte, tirou você daquele projeto.' : 'O chefe agradeceu e levou adiante. Você não soube mais nada.', memoria: null, efeito: () => { const e = emprego(c)!; e.desempenho = clamp(e.desempenho + (envolvido ? -6 : 3)); } }; } },
      { id: 'calar', texto: 'Fingir que não viu', resolver: c => ({ texto: 'Você fechou a planilha. Ela continuou aberta na sua cabeça.', memoria: null, efeito: () => estresse(c, 6) }) }
    ]
  },
  {
    id: 'fac10_bolsa', tipo: 'decisao', peso: 2, idade: [18, 35], tema: 'estudo', repetir: undefined,
    quando: c => naFaculdade(c) && c.v.educacao.matricula!.mensalidade > 0 && nota(c) >= 70 && !c.v.educacao.matricula!.bolsaAtleta,
    titulo: 'A bolsa de mérito',
    texto: c => `A faculdade abriu bolsas para os melhores alunos: metade da mensalidade de ${fmt(c.v.educacao.matricula!.mensalidade)}. Precisa de uma prova e de uma carta.`,
    opcoes: [
      { id: 'tentar', texto: 'Fazer a prova da bolsa', comportamento: { disciplina: 1 },
        resolver: c => { const ok = c.r.chance(clamp((nota(c) - 55) / 45, 0.2, 0.75)); return { texto: ok ? 'Saiu a lista: o seu nome estava lá. A mensalidade caiu pela metade.' : 'Não foi desta vez — ficou a três posições da última bolsa.', memoria: ok ? 'Ganhou bolsa de mérito na faculdade.' : null, efeito: () => { if (ok) { const m = c.v.educacao.matricula!; m.mensalidade = Math.round(m.mensalidade / 2); } else estresse(c, 3); } }; } },
      { id: 'nao', texto: 'Não tentar', resolver: () => ({ texto: 'Você deixou passar. A prova era num sábado.', memoria: null, efeito: () => {} }) }
    ]
  },
  {
    id: 'des10_aplicativo', tipo: 'decisao', peso: 2, idade: [18, 60], tema: 'trabalho', repetir: 3,
    quando: c => desempregado(c) && aperto(c) && livre(c),
    titulo: 'Enquanto a vaga não vem',
    texto: () => 'As contas não esperam a vaga certa. Muita gente na sua situação está fazendo entregas por aplicativo.',
    opcoes: [
      { id: 'entregas', texto: 'Fazer entregas por um tempo', comportamento: { disciplina: 1 },
        consequencia: () => 'Abre a vaga de entregador (em Caminhos · Trabalho): o dinheiro de agora, menos tempo para procurar.',
        resolver: c => ({ texto: 'O aplicativo aprovou o cadastro em dois dias. A vaga está lá, esperando a sua decisão.', memoria: null, efeito: () => { novaOportunidade(c.v, { tipo: 'vaga', ocupacaoId: 'entregador_app', meses: 6, chave: 'aplicativo', titulo: 'As entregas por aplicativo', texto: 'Cadastro aprovado: é só começar. Paga por entrega, sem carteira.', bonus: 0.6 }); } }) },
      { id: 'bicos', texto: 'Pegar bicos na sua área, por indicação', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Três trabalhos avulsos em dois meses. Pouco dinheiro, mas os contatos voltaram a falar com você.', memoria: null, efeito: () => { c.v.financas.conta += preco(c, 1500); estresse(c, 2); } }) },
      { id: 'focar', texto: 'Focar só na procura', resolver: c => ({ texto: 'Você manteve a procura em tempo integral. As contas, em atraso.', memoria: null, efeito: () => estresse(c, 5) }) }
    ]
  },
  {
    id: 'vel10_netos', tipo: 'decisao', peso: 2, idade: [50, 90], tema: 'familia', repetir: 5,
    papeis: { neto: fixo(P.neto(1, 10)) }, quando: c => livre(c) && c.v.corpo.saude >= 35,
    titulo: 'Os netos',
    texto: c => `Os pais de ${nome(c, 'neto')} perguntaram se você pode ficar com a criança duas tardes por semana.`,
    opcoes: [
      { id: 'sim', texto: 'Aceitar com alegria', comportamento: { familia: 2 },
        resolver: c => ({ texto: 'As tardes viraram de vocês: bolo, praça, a novela que a criança não devia ver.', memoria: `As tardes com ${nome(c, 'neto')}.`, lembrar: ['neto', 'As tardes com você.', 'ritual'], efeito: () => { prox(c, 'neto', 14); feliz(c, 6); estresse(c, 2); } }) },
      { id: 'uma', texto: 'Aceitar uma tarde, não duas', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Uma tarde por semana, sagrada. As outras continuaram suas.', memoria: null, efeito: () => { prox(c, 'neto', 7); feliz(c, 3); } }) },
      { id: 'nao', texto: 'Dizer que não dá', resolver: c => ({ texto: 'Eles acharam outra solução. A criança perguntou por você.', memoria: null, efeito: () => prox(c, 'neto', -2) }) }
    ]
  },

  /* =================================================================== OS ECOS QUE VOLTAM */
  {
    id: 'eco10_favor', tipo: 'decisao', idade: [18, 95], tema: 'amizade', prioritario: true, prioridade: 2, repetir: 0,
    papeis: { amigo: fixo(pessoaDoEco('favor')) }, quando: c => !!ecoAberto(c.v, 'favor') && (desempregado(c) || aperto(c)),
    titulo: 'Quem lembrou',
    texto: c => `${nome(c, 'amigo')} soube do seu momento — e apareceu. "Você me ajudou quando ninguém ajudava."`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar a ajuda', comportamento: { familia: 1 },
        resolver: c => { const e = ecoAberto(c.v, 'favor')!; const vaga = !c.v.trabalho.atual; return { texto: vaga ? `${nome(c, 'amigo')} indicou você para uma vaga onde trabalha.` : `${nome(c, 'amigo')} devolveu o empréstimo antigo — e mais um pouco.`, memoria: `${nome(c, 'amigo')} retribuiu uma ajuda antiga.`, relevancia: 'biografia', lembrar: ['amigo', 'Retribuiu a ajuda de anos atrás.', 'apoio'],
          efeito: () => { ecoVoltou(c.v, e); if (vaga) novaOportunidade(c.v, { tipo: 'indicacao', ocupacaoId: 'aux_adm', meses: 12, chave: 'indicacao_amigo', titulo: `A indicação de ${nome(c, 'amigo')}`, texto: 'Uma vaga onde o amigo trabalha, com a palavra dele junto.', bonus: 0.4, pessoaId: c.p.amigo.id }); else c.v.financas.conta += Math.round((e.valor ?? preco(c, 2000)) * 1.1); prox(c, 'amigo', 8); } }; } },
      { id: 'recusar', texto: 'Agradecer e dizer que está se virando', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${nome(c, 'amigo')} insistiu, depois respeitou. O gesto ficou.`, memoria: null, efeito: () => { ecoVoltou(c.v, ecoAberto(c.v, 'favor')!); prox(c, 'amigo', 4); } }) }
    ]
  },
  {
    id: 'eco10_mentor', tipo: 'acontecimento', idade: [18, 60], tema: 'estudo', prioritario: true, repetir: 0,
    papeis: { professor: fixo(pessoaDoEco('mentor')) }, quando: c => !!ecoAberto(c.v, 'mentor') && (c.v.trabalho.candidaturas.length > 0 || desempregado(c) || c.v.caminhos.oportunidades.some(o => o.tipo === 'vaga' || o.tipo === 'estagio')),
    narrar: c => ({ texto: `${nome(c, 'professor')}, que apostou em você anos atrás, escreveu uma carta de recomendação sem que você pedisse. Ela abriu uma porta.`, relevancia: 'biografia', tom: 'bom', lembrar: ['professor', 'A carta de recomendação.', 'apoio'],
      efeito: () => { ecoVoltou(c.v, ecoAberto(c.v, 'mentor')!); novaOportunidade(c.v, { tipo: 'indicacao', ocupacaoId: 'analista_adm', meses: 12, chave: 'carta_mentor', titulo: 'A carta de recomendação', texto: `Uma vaga que chegou com a carta de ${nome(c, 'professor')}.`, bonus: 0.45, pessoaId: c.p.professor.id }); } })
  },
  {
    id: 'eco10_recusou', tipo: 'acontecimento', idade: [25, 75], tema: 'trabalho', prioritario: true, repetir: 0,
    quando: c => !!ecoAberto(c.v, 'recusou') && !!emprego(c),
    narrar: c => { const e = ecoAberto(c.v, 'recusou')!; return { texto: `${e.texto === 'a transferência' ? 'A unidade nova, a que você recusou, virou a maior da empresa.' : 'A vaga que você recusou foi para um colega — que hoje é a sua chefia.'} Às vezes você pensa no caminho que não foi; às vezes, no que ficou.`, relevancia: 'biografia',
      efeito: () => { ecoVoltou(c.v, e); estresse(c, 3); } }; }
  },
  {
    id: 'eco10_fiador', tipo: 'decisao', idade: [25, 90], tema: 'dinheiro', prioritario: true, prioridade: 3, repetir: 0,
    papeis: { parente: fixo(pessoaDoEco('fiador')) }, quando: c => !!ecoAberto(c.v, 'fiador'),
    titulo: 'A conta do fiador',
    texto: c => `A imobiliária ligou: ${nome(c, 'parente')} deve três meses de aluguel, e o fiador é você — uns ${fmt(ecoAberto(c.v, 'fiador')!.valor ?? preco(c, 6000))}.`,
    opcoes: [
      { id: 'pagar', texto: 'Pagar e cobrar depois', resolver: c => { const e = ecoAberto(c.v, 'fiador')!; return { texto: 'Você pagou. A conversa com o parente veio depois, e foi difícil.', memoria: `Pagou a dívida de aluguel de ${nome(c, 'parente')}, como fiador.`, efeito: () => { ecoVoltou(c.v, e); pagar(c.v, e.valor ?? preco(c, 6000)); tensao(c, 'parente', 20); } }; } },
      { id: 'negociar', texto: 'Negociar um parcelamento com a imobiliária', comportamento: { disciplina: 1 },
        resolver: c => { const e = ecoAberto(c.v, 'fiador')!; return { texto: 'Parcelaram em dez vezes. O peso diluiu; a mágoa, não.', memoria: null, efeito: () => { ecoVoltou(c.v, e); const v = e.valor ?? preco(c, 6000); c.v.financas.dividas.push({ id: `fiador${c.v.seq++}`, tipo: 'acordo', saldo: v, jurosMes: 0.01, parcela: Math.ceil(v / 10), descricao: 'A dívida de fiador', tInicio: c.v.t, prazo: 10 }); tensao(c, 'parente', 12); } }; } },
      { id: 'cobrar', texto: c => `Exigir que ${nome(c, 'parente')} resolva`, comportamento: { coragem: 1 },
        resolver: c => { const ok = c.r.chance(0.4); const e = ecoAberto(c.v, 'fiador')!; return { texto: ok ? 'Pressionado, ele resolveu sozinho — vendeu o carro.' : 'Ele não resolveu, e a imobiliária entrou na Justiça contra você.', memoria: null, efeito: () => { ecoVoltou(c.v, e); if (!ok) { pagar(c.v, Math.round((e.valor ?? preco(c, 6000)) * 1.2)); estresse(c, 8); } tensao(c, 'parente', ok ? 10 : 25); } }; } }
    ]
  },
  {
    id: 'eco10_investiu', tipo: 'acontecimento', idade: [25, 95], tema: 'dinheiro', prioritario: true, repetir: 0,
    papeis: { amigo: fixo(pessoaDoEco('investiu')) }, quando: c => !!ecoAberto(c.v, 'investiu'),
    narrar: c => { const e = ecoAberto(c.v, 'investiu')!; const deu = c.p.amigo.temperamento.responsabilidade + (c.v.t % 7) / 10 > 0.2; const volta = Math.round((e.valor ?? 0) * (deu ? 1.8 : 0.2)); return { texto: deu ? `O negócio de ${nome(c, 'amigo')} deu certo: a sua parte rendeu ${fmt(volta)} de volta, e ainda rende.` : `O negócio de ${nome(c, 'amigo')} fechou. Da sua parte, voltaram ${fmt(volta)}. A amizade sobreviveu — arranhada.`, relevancia: 'biografia', tom: deu ? 'bom' : 'ruim',
      efeito: () => { ecoVoltou(c.v, e); c.v.financas.conta += volta; prox(c, 'amigo', deu ? 6 : -8); } }; }
  },
  {
    id: 'eco10_cuidou', tipo: 'acontecimento', idade: [30, 100], tema: 'familia', prioritario: true, repetir: 0,
    papeis: { parente: fixo(pessoaDoEco('cuidou')) }, quando: c => !!ecoAberto(c.v, 'cuidou') && (c.v.corpo.saude < 50 || aperto(c) || c.v.luto.length > 0),
    narrar: c => ({ texto: `Quando foi a sua vez de precisar, ${nome(c, 'parente')} foi a primeira pessoa a aparecer. "Você esteve lá por mim."`, relevancia: 'biografia', tom: 'bom', lembrar: ['parente', 'Esteve por perto quando foi a sua vez.', 'apoio'],
      efeito: () => { ecoVoltou(c.v, ecoAberto(c.v, 'cuidou')!); prox(c, 'parente', 8); estresse(c, -6); feliz(c, 4); } })
  },
  {
    id: 'eco10_denunciou', tipo: 'acontecimento', idade: [22, 70], tema: 'trabalho', prioritario: true, repetir: 0,
    quando: c => !!ecoAberto(c.v, 'denunciou'),
    narrar: c => { const e = ecoAberto(c.v, 'denunciou')!; const reconhecido = c.r.chance(0.6); const job = emprego(c); return { texto: reconhecido ? 'A investigação terminou: dois diretores saíram, e o conselho mandou uma carta agradecendo a quem denunciou. O seu nome ficou conhecido — do jeito bom.' : 'A investigação terminou sem culpados. Meses depois, o seu cargo entrou num "corte de custos". Ninguém disse por quê; todo mundo sabia.', relevancia: 'biografia', tom: reconhecido ? 'bom' : 'ruim',
      efeito: () => { ecoVoltou(c.v, e); if (job) { if (reconhecido) { job.desempenho = clamp(job.desempenho + 8); job.salario = Math.round(job.salario * 1.08 / 10) * 10; } else job.desempenho = clamp(job.desempenho - 20); } if (!reconhecido) estresse(c, 8); } }; }
  },
  {
    id: 'eco10_mudou_de_curso', tipo: 'acontecimento', idade: [20, 45], tema: 'estudo', prioritario: true, repetir: 0,
    quando: c => !!ecoAberto(c.v, 'mudou_de_curso') && (!!emprego(c) || naFaculdade(c)),
    narrar: c => { const e = ecoAberto(c.v, 'mudou_de_curso')!; return { texto: `Às vezes você lembra de ${e.texto ?? 'o curso que largou'}. A decisão de sair, que pareceu fracasso, hoje parece a mais lúcida que tomou.`, relevancia: 'biografia', tom: 'bom',
      efeito: () => { ecoVoltou(c.v, e); feliz(c, 4); estresse(c, -3); } }; }
  }
];
