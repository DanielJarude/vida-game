/**
 * VIDA 15 · ACONTECIMENTOS POR FASE DA VIDA E PELA HISTÓRIA DE CADA UM.
 *
 * A infância deixava os primeiros anos quase vazios (1–5 anos: ~0,1 decisão por ano numa simulação de 30 vidas); a
 * adolescência repetia poucas cenas; a velhice tinha pouco que fosse só dela. E a vida pouco voltava ao próprio passado.
 * Aqui: cenas da idade (o escuro do quarto, a bicicleta sem rodinhas, o primeiro dia de aula, o primeiro celular, o grupo
 * da turma, a primeira viagem sem adulto, o neto que ensina o celular, as chaves do carro) e cenas que LEEM a história
 * (a carta escrita aos 11 aberta aos 30, a foto de um marco de verdade, o colega de escola que ficou famoso, a volta à
 * cidade onde se cresceu). Regras da casa: papéis `fixo`, `quando` não sorteia, variações por sorteio derivado.
 */
import type { Conteudo, Ctx, Papel } from '../../conteudo/base';
import type { Vida } from '../../tipos';
import * as P from '../../conteudo/papeis';
import { fixo } from '../../conteudo/papeis';
import { cognicao, custa, dinheiro, estresse, feliz, local, prox } from '../../conteudo/efeitos';
import { idade, lembrarCom, vinculosVivos } from '../../nucleo';
import { rngDe } from '../../rng';
import { anoDe } from '../../tempo';
import { flex } from '../../texto';
import { municipio } from '../../dados/lugares';
import { ocupacaoOuNula } from '../../dados/ocupacoes';

const nome = (c: Ctx, papel: string) => c.p[papel]?.nome ?? '';
const ele = (c: Ctx, papel: string) => flex(c.p[papel]?.genero ?? 'masculino', 'ele', 'ela', 'elu');
const uma = <T,>(c: Ctx, chave: string, xs: T[]): T => rngDe(c.v.id, 'ev15', chave).pick(xs);
const naEscola = (c: Ctx) => !!c.v.educacao.basica && !c.v.educacao.evadiu;

/* -------------------------------------------------------------- A carta para o futuro (aos 11, aberta aos 30) */

const SONHOS: { id: string; texto: string; virou: (v: Vida) => boolean }[] = [
  { id: 'cuidar', texto: 'cuidar das pessoas (médico, enfermeiro, alguém que ajuda)', virou: v => /médic|enfermeir|cuidad|psic|dentist|fisioter|veterin/i.test(ocupacaoAtual(v)) },
  { id: 'atleta', texto: 'ser atleta', virou: v => !!v.caminhos.esporte && v.caminhos.esporte.fase !== 'base' },
  { id: 'artista', texto: 'ser artista (cantar, atuar, desenhar)', virou: v => (v.caminhos.curriculo?.length ?? 0) >= 2 || /ator|atriz|músic|cantor|artista|pintor|ilustrad|escritor|design/i.test(ocupacaoAtual(v)) },
  { id: 'ciencia', texto: 'descobrir coisas (cientista, professor, engenheiro)', virou: v => /professor|pesquis|cientist|engenheir|program|analista/i.test(ocupacaoAtual(v)) },
  { id: 'negocio', texto: 'ter um negócio meu', virou: v => !!v.caminhos.negocio || (v.financas.empresas?.length ?? 0) > 0 },
  { id: 'nao_sei', texto: 'ainda não sei — e tudo bem', virou: () => false }
];
function ocupacaoAtual(v: Vida): string {
  const em = v.trabalho.atual;
  const oc = em ? ocupacaoOuNula(em.ocupacaoId) : undefined;
  return oc ? oc.nome.join(' ') : '';
}

/* -------------------------------------------------------------- Os papéis desta história */

/** Quem da escola (da faculdade, da infância) ficou famoso — e ainda está na sua vida. */
const colegaFamoso: Papel = v => vinculosVivos(v).filter(x => x.p.celebridade15 && (x.vin.origem === 'escola' || x.vin.origem === 'faculdade' || x.vin.origem === 'vizinhanca' || !!x.vin.formacao)).map(x => x.p);
/** Um marco antigo da biografia (15 anos ou mais), da própria pessoa. */
function marcoAntigo(v: Vida) {
  const xs = v.biografia.filter(e => e.relevancia === 'marco' && e.t <= v.t - 180 && e.idade >= 5 && !/morreu|faleceu|enterro|morte/i.test(e.texto));
  return xs.length ? rngDe(v.id, 'foto15', Math.floor(v.t / 120)).pick(xs) : undefined;
}
const comCarro = (v: Vida) => v.financas.bens.some(b => b.tipo === 'veiculo');

export const ACONTECIMENTOS_15: Conteudo[] = [
  /* ============================================================ INFÂNCIA */
  {
    id: 'inf15_escuro', manual: true, tipo: 'decisao', idade: [3, 6], tema: 'infancia', peso: 1.6, repetir: 0,
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'O barulho no armário',
    texto: c => uma(c, 'escuro', [
      'Toda noite, quando a luz apaga, o armário do quarto faz um barulho. Você tem certeza de que tem alguma coisa lá dentro.',
      'A sombra na parede tem braços compridos quando o carro passa na rua. Hoje ela mexeu de novo.'
    ]),
    opcoes: [
      { id: 'chamar', texto: c => `Chamar ${nome(c, 'genitor')}`, resolver: c => ({ texto: `${nome(c, 'genitor')} abriu o armário, mostrou que só tinha roupa e ficou até você dormir.`, memoria: null, lembrar: ['genitor', 'As noites do armário: ficava até você dormir.', 'apoio'], efeito: () => { prox(c, 'genitor', 4); estresse(c, -2); } }) },
      { id: 'lanterna', texto: 'Enfrentar com a lanterna', comportamento: { coragem: 1 }, resolver: c => ({ texto: 'Era o casaco pendurado. Você dormiu com a lanterna na mão, orgulhos' + c.g('o', 'a', 'e') + '.', memoria: 'Enfrentou o "monstro do armário" com uma lanterna.', efeito: () => feliz(c, 2) }) },
      { id: 'luz', texto: 'Pedir para dormir de luz acesa', resolver: c => ({ texto: 'A luz do corredor ficou acesa por um ano inteiro. Ninguém comentou.', memoria: null, efeito: () => estresse(c, -1) }) }
    ]
  },
  {
    id: 'inf15_bicicleta', manual: true, tipo: 'decisao', idade: [4, 9], tema: 'infancia', peso: 1.5, repetir: 0,
    papeis: { quem: fixo(P.qualquer(P.genitorEmCasa, P.irmaoEmCasa)) },
    titulo: 'Sem rodinhas',
    texto: c => `${nome(c, 'quem')} tirou as rodinhas da bicicleta. "Eu seguro atrás", ${ele(c, 'quem')} prometeu.`,
    opcoes: [
      { id: 'insistir', texto: 'Tentar até conseguir', comportamento: { disciplina: 1 }, resolver: c => ({ texto: `Três joelhos ralados depois, você olhou para trás e ${nome(c, 'quem')} estava longe — tinha soltado fazia tempo.`, memoria: `Aprendeu a andar de bicicleta com ${nome(c, 'quem')}.`, lembrar: ['quem', 'Ensinou você a andar de bicicleta.', 'antigo'], efeito: () => { feliz(c, 4); prox(c, 'quem', 3); } }) },
      { id: 'medo', texto: 'Pedir as rodinhas de volta', resolver: c => ({ texto: 'As rodinhas voltaram por mais um verão. Tinha tempo.', memoria: null, efeito: () => estresse(c, 1) }) }
    ]
  },
  {
    id: 'inf15_primeiro_dia', manual: true, tipo: 'decisao', idade: [4, 7], tema: 'escola', peso: 2.4, repetir: 0,
    quando: c => naEscola(c) && (c.v.fatos['inf15_primeiro_dia'] === undefined),
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'O primeiro dia de aula',
    texto: c => `Mochila nova, lancheira com o seu nome. No portão da escola, ${nome(c, 'genitor') || 'quem levou você'} se abaixa para se despedir.`,
    opcoes: [
      { id: 'sozinho', texto: 'Entrar sem olhar para trás', comportamento: { coragem: 1 }, resolver: c => ({ texto: 'Você entrou correndo. Quem chorou no portão foi o adulto.', memoria: 'Entrou na escola sem olhar para trás, no primeiro dia.', efeito: () => { feliz(c, 2); c.v.fatos['inf15_primeiro_dia'] = c.v.t; } }) },
      { id: 'mao', texto: 'Segurar a mão até a sala', resolver: c => ({ texto: `${nome(c, 'genitor') || 'O adulto'} levou você até a carteira. Na hora do recreio, já tinha um amigo.`, memoria: null, efeito: () => { prox(c, 'genitor', 2); c.v.fatos['inf15_primeiro_dia'] = c.v.t; } }) },
      { id: 'chorar', texto: 'Chorar e não querer soltar', resolver: c => ({ texto: 'Chorou a manhã inteira. Na semana seguinte, chorava para ir embora da escola.', memoria: null, efeito: () => { estresse(c, 3); c.v.fatos['inf15_primeiro_dia'] = c.v.t; } }) }
    ]
  },
  {
    id: 'inf15_amigo_invisivel', manual: true, tipo: 'decisao', idade: [3, 6], tema: 'infancia', peso: 1, repetir: 0,
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'O amigo invisível',
    texto: c => `Você tem um amigo que só você vê. Ele se chama ${uma(c, 'invisivel', ['Bolota', 'Capitão', 'Tuti', 'Zumbo'])} e janta com a família — tem até prato na mesa.`,
    opcoes: [
      { id: 'defender', texto: 'Exigir o prato dele na mesa', comportamento: { coragem: 1 }, resolver: c => ({ texto: `${nome(c, 'genitor') || 'A família'} pôs o prato. Por meses, ele foi da família.`, memoria: null, efeito: () => { feliz(c, 2); cognicao(c, 1); } }) },
      { id: 'segredo', texto: 'Deixar ele só para você', resolver: c => ({ texto: 'Ele virou segredo. Um dia, sem ninguém notar, foi embora.', memoria: null, efeito: () => cognicao(c, 1) }) }
    ]
  },
  {
    id: 'inf15_perdido', manual: true, tipo: 'decisao', idade: [4, 8], tema: 'infancia', peso: 1.2, repetir: 0,
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'Perdido',
    texto: c => `${uma(c, 'perdido', ['No supermercado', 'Na feira de domingo', 'Na praia lotada'])}, você se virou e ${nome(c, 'genitor') || 'quem estava com você'} não estava mais lá.`,
    opcoes: [
      { id: 'parado', texto: 'Ficar parado onde estava', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Exatamente como ensinaram. Em cinco minutos, um abraço apertado e um sermão.', memoria: null, efeito: () => prox(c, 'genitor', 2) }) },
      { id: 'procurar', texto: 'Sair procurando', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'Vinte minutos de pânico dos dois lados. O alto-falante chamou o seu nome.', memoria: 'Se perdeu e foi achado pelo alto-falante.'.replace('achado', c.g('achado', 'achada', 'achade')), efeito: () => estresse(c, 4) }) },
      { id: 'pedir', texto: 'Pedir ajuda a um adulto', comportamento: { coragem: 1 }, resolver: c => ({ texto: 'Uma moça do caixa segurou sua mão até a família aparecer.', memoria: null, efeito: () => estresse(c, 1) }) }
    ]
  },
  {
    id: 'inf15_festa', manual: true, tipo: 'decisao', idade: [5, 11], tema: 'infancia', peso: 1.3, repetir: 0,
    quando: c => naEscola(c),
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'A festa de aniversário',
    texto: c => `${nome(c, 'genitor') || 'A família'} topou fazer uma festa este ano. A pergunta é: quem vai?`,
    opcoes: [
      { id: 'turma', texto: 'A turma inteira', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: 'Trinta crianças, um bolo que acabou em cinco minutos e um balão estourado no gato. Inesquecível.', memoria: 'A festa com a turma inteira.', efeito: () => feliz(c, 5) }) },
      { id: 'poucos', texto: 'Só os amigos de verdade', resolver: c => ({ texto: 'Quatro amigos, pizza e filme. Ninguém foi embora antes da hora.', memoria: null, efeito: () => feliz(c, 3) }) },
      { id: 'sem', texto: 'Trocar a festa por um presente', resolver: c => ({ texto: 'Você escolheu o presente. Na escola, contou que a festa ia ser no ano que vem.', memoria: null, efeito: () => feliz(c, 1) }) }
    ]
  },
  {
    id: 'inf15_ferias', manual: true, tipo: 'decisao', idade: [5, 12], tema: 'lazer', peso: 1.2, repetir: 1,
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'As férias',
    texto: c => `Férias. ${nome(c, 'genitor') || 'A família'} pergunta o que você prefere este ano.`,
    opcoes: [
      { id: 'avos', texto: 'Passar uns dias com os avós', disponivel: c => (P.avo(c.v).length ? true : false), resolver: c => ({ texto: 'Comida de avó, horário de avó, histórias de quando seus pais eram crianças.', memoria: 'As férias na casa dos avós.', efeito: () => { feliz(c, 3); for (const a of P.avo(c.v)) { const vin = c.v.vinculos[a.id]; if (vin) vin.proximidade = Math.min(100, vin.proximidade + 4); } } }) },
      { id: 'viagem', texto: 'Pedir uma viagem', resolver: c => ({ texto: uma(c, 'ferias', ['A estrada, o carro cheio, a primeira vez vendo o mar.', 'Uma cidade nova, um hotel simples, uma piscina que parecia enorme.']), memoria: 'Uma viagem de férias com a família.', efeito: () => feliz(c, 4) }) },
      { id: 'casa', texto: 'Ficar em casa brincando', resolver: c => ({ texto: 'A rua, os amigos, o tempo sobrando. Também é férias.', memoria: null, efeito: () => feliz(c, 2) }) }
    ]
  },
  {
    id: 'inf15_celular', manual: true, tipo: 'decisao', idade: [10, 12], tema: 'infancia', peso: 1.8, repetir: 0,
    papeis: { genitor: fixo(P.genitorEmCasa) },
    titulo: 'O primeiro celular',
    texto: c => `Metade da turma já tem celular. Você quer o seu — e ${nome(c, 'genitor') || 'a família'} tem opinião sobre isso.`,
    opcoes: [
      { id: 'regras', texto: 'Aceitar as regras (hora para desligar, nada no quarto)', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'O celular veio com um contrato escrito à mão, colado na geladeira. Você cumpriu — quase sempre.', memoria: 'Ganhou o primeiro celular (com regras na geladeira).', efeito: () => { feliz(c, 4); prox(c, 'genitor', 2); c.v.fatos['primeiro_celular15'] = c.v.t; } }) },
      { id: 'juntar', texto: 'Juntar o dinheiro e comprar um usado', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Mesada, aniversário, um bico de lavar carro. Um usado com a tela trincada — e era seu.', memoria: 'Juntou dinheiro e comprou o primeiro celular.', efeito: () => { feliz(c, 3); c.v.fatos['primeiro_celular15'] = c.v.t; } }) },
      { id: 'birra', texto: 'Fazer birra até ganhar', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: 'Não ganhou. Ganhou um castigo e a promessa de "quando tiver idade".', memoria: null, efeito: () => { estresse(c, 3); prox(c, 'genitor', -2); } }) }
    ]
  },
  {
    id: 'inf15_carta', manual: true, tipo: 'decisao', idade: [10, 12], tema: 'escola', peso: 1.6, repetir: 0,
    quando: c => naEscola(c),
    titulo: 'A carta para o futuro',
    texto: c => 'A professora pediu uma carta para você mesm' + c.g('o', 'a', 'e') + ' de 30 anos. Ela vai guardar numa caixa — e a escola promete entregar. O que você escreve que quer ser?',
    opcoes: SONHOS.map((s, k) => ({
      id: `s${k}`, texto: cap(s.texto),
      resolver: (c: Ctx) => ({ texto: k === 5 ? '"Querido eu de 30 anos: ainda não sei o que quero ser. Espero que você saiba." Você dobrou a carta em quatro.' : `"Querido eu de 30 anos: espero que você tenha conseguido ${s.texto.replace(/ \(.*\)$/, '')}." Você dobrou a carta em quatro.`, memoria: 'Escreveu uma carta para si mesmo, para abrir aos 30.'.replace('mesmo', c.g('mesmo', 'mesma', 'mesme')), efeito: () => { c.v.fatos['carta15'] = c.v.t; c.v.fatos['carta15_sonho'] = k; } })
    }))
  },
  /* ============================================================ ADOLESCÊNCIA */
  {
    id: 'ado15_grupo', manual: true, tipo: 'decisao', idade: [12, 16], tema: 'escola', peso: 1.6, repetir: 0,
    quando: c => naEscola(c),
    papeis: { amigo: fixo(P.qualquer(P.amigo, P.colegaDe('escola'))) },
    titulo: 'O print no grupo',
    texto: c => `Alguém mandou no grupo da turma um print de uma conversa de ${nome(c, 'amigo')} — tirado do contexto, e todo mundo está rindo.`,
    opcoes: [
      { id: 'defender', texto: `Defender no grupo, na frente de todo mundo`, comportamento: { coragem: 1, empatia: 1 }, resolver: c => ({ texto: `O grupo ficou quieto. ${nome(c, 'amigo')} mandou mensagem no privado: "valeu".`, memoria: `Defendeu ${nome(c, 'amigo')} no grupo da turma.`, lembrar: ['amigo', 'Defendeu no grupo da turma, quando todo mundo ria.', 'apoio'], efeito: () => { prox(c, 'amigo', 8); estresse(c, 2); } }) },
      { id: 'privado', texto: 'Mandar apoio só no privado', comportamento: { empatia: 1 }, resolver: c => ({ texto: `${nome(c, 'amigo')} agradeceu. Mas perguntou por que você não falou nada no grupo.`, memoria: null, efeito: () => prox(c, 'amigo', 3) }) },
      { id: 'rir', texto: 'Mandar um emoji rindo, como todo mundo', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: `${nome(c, 'amigo')} saiu do grupo naquela noite.`, memoria: null, efeito: () => { prox(c, 'amigo', -10); } }) }
    ]
  },
  {
    id: 'ado15_espelho', manual: true, tipo: 'decisao', idade: [12, 16], tema: 'infancia', peso: 1.2, repetir: 0,
    titulo: 'O espelho',
    texto: () => 'Espinhas, o corpo mudando, a roupa que ontem servia. Hoje o espelho ganhou a discussão.',
    opcoes: [
      { id: 'cuidar', texto: 'Pedir ajuda para cuidar da pele', resolver: c => ({ texto: 'Um dermatologista, um sabonete certo, paciência. Melhorou devagar.', memoria: null, efeito: () => { c.v.corpo.aparencia = Math.min(100, c.v.corpo.aparencia + 2); estresse(c, -2); } }) },
      { id: 'esconder', texto: 'Usar moletom no calor e evitar fotos', resolver: c => ({ texto: 'Um ano inteiro de moletom. As fotos da turma daquele ano quase não têm você.', memoria: null, efeito: () => { estresse(c, 4); feliz(c, -2); } }) },
      { id: 'rir', texto: 'Rir de si mesmo antes que alguém ria', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: 'Funcionou melhor do que esperava. O apelido nem pegou.', memoria: null, efeito: () => estresse(c, -1) }) }
    ]
  },
  {
    id: 'ado15_viagem_amigos', manual: true, tipo: 'decisao', idade: [15, 17], tema: 'lazer', peso: 1.4, repetir: 0,
    papeis: { genitor: fixo(P.genitorEmCasa), amigo: fixo(P.amigo) },
    titulo: 'A primeira viagem sem adulto',
    texto: c => `${nome(c, 'amigo')} conseguiu uma casa na praia por um fim de semana. A turma vai. Falta você convencer ${nome(c, 'genitor') || 'em casa'}.`,
    opcoes: [
      { id: 'pedir', texto: 'Pedir com todos os detalhes (endereço, telefones, horário)', comportamento: { disciplina: 1 }, resolver: c => c.r.chance(0.6) ? ({ texto: 'Deixaram — com três ligações por dia. Foi o fim de semana do ano.', memoria: 'A primeira viagem com os amigos, sem adulto.', lembrar: ['amigo', 'A casa na praia com a turma.', 'amizade'], efeito: () => { feliz(c, 5); prox(c, 'amigo', 5); } }) : ({ texto: '"Ano que vem." Você passou o fim de semana vendo as fotos dos outros.', memoria: null, efeito: () => { feliz(c, -3); } }) },
      { id: 'escondido', texto: 'Dizer que vai dormir na casa de um amigo', comportamento: { impulsividade: 1 }, resolver: c => c.r.chance(0.35) ? ({ texto: 'A mentira caiu no domingo à noite. O castigo durou até as férias.', memoria: 'Foi escondido numa viagem com os amigos — e foi descoberto.'.replace('escondido', c.g('escondido', 'escondida', 'escondide')).replace('descoberto', c.g('descoberto', 'descoberta', 'descoberte')), efeito: () => { prox(c, 'genitor', -8); estresse(c, 5); } }) : ({ texto: 'Ninguém descobriu. A culpa veio junto na mala, mas a viagem valeu.', memoria: null, efeito: () => { feliz(c, 3); prox(c, 'amigo', 4); } }) },
      { id: 'ficar', texto: 'Desistir de ir', resolver: c => ({ texto: 'Você ficou. Na segunda, a turma tinha piadas que você não entendia.', memoria: null, efeito: () => feliz(c, -2) }) }
    ]
  },
  {
    id: 'ado15_trabalho_grupo', manual: true, tipo: 'decisao', idade: [13, 17], tema: 'escola', peso: 1.2, repetir: 1,
    quando: c => naEscola(c),
    titulo: 'O trabalho em grupo',
    texto: () => 'Trabalho em grupo valendo meia nota do bimestre. Dos quatro do grupo, só você abriu o documento.',
    opcoes: [
      { id: 'sozinho', texto: 'Fazer tudo sozinho e pôr o nome de todos', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Tirou nota máxima. Os outros também. Você ficou com raiva e com nove horas de sono a menos.', memoria: null, efeito: () => { estresse(c, 4); cognicao(c, 1); } }) },
      { id: 'cobrar', texto: 'Cobrar cada um no grupo', comportamento: { coragem: 1 }, resolver: c => ({ texto: 'Dois fizeram a parte deles. O terceiro, não. Mas pelo menos dividiu.', memoria: null, efeito: () => estresse(c, 1) }) },
      { id: 'contar', texto: 'Contar para a professora quem não fez', resolver: c => ({ texto: 'A professora separou as notas. Na turma, o clima azedou por umas semanas.', memoria: null, efeito: () => estresse(c, 2) }) }
    ]
  },
  {
    id: 'ado15_show', manual: true, tipo: 'decisao', idade: [14, 17], tema: 'lazer', peso: 1.1, repetir: 0,
    titulo: 'O primeiro show',
    texto: c => `${uma(c, 'show', ['A banda que você ouve todo dia', 'O cantor que está em todas as playlists', 'O festival de que todo mundo fala'])} vem para perto. O ingresso não é barato.`,
    opcoes: [
      { id: 'juntar', texto: 'Juntar o dinheiro e ir', comportamento: { disciplina: 1 }, disponivel: c => custa(c, local(c, 180)), resolver: c => ({ texto: 'Você cantou todas, perdeu a voz e voltou de madrugada com a pulseira no braço por uma semana.', memoria: 'O primeiro show.', efeito: () => { dinheiro(c, -local(c, 180)); feliz(c, 6); } }) },
      { id: 'pedir', texto: 'Pedir de presente adiantado', resolver: c => c.r.chance(0.5) ? ({ texto: 'Deram. Com a condição de alguém buscar você na saída.', memoria: 'O primeiro show.', efeito: () => feliz(c, 5) }) : ({ texto: 'Não deram. Você viu o show pelos vídeos dos outros.', memoria: null, efeito: () => feliz(c, -2) }) },
      { id: 'nao', texto: 'Deixar para a próxima', resolver: () => ({ texto: 'Teve próxima? Talvez.', memoria: null }) }
    ]
  },
  /* ============================================================ VELHICE */
  {
    id: 'vel15_neto_celular', manual: true, tipo: 'decisao', idade: [62, 95], tema: 'familia', peso: 1.4, repetir: 1,
    papeis: { neto: fixo(P.neto(9, 22)) },
    titulo: 'A aula de celular',
    texto: c => `${nome(c, 'neto')} pegou o seu celular, suspirou e disse: "Senta aqui que eu vou te ensinar de uma vez."`,
    opcoes: [
      { id: 'aprender', texto: 'Sentar e aprender com paciência', comportamento: { disciplina: 1 }, resolver: c => ({ texto: `Uma tarde inteira. Agora você manda áudio, figurinha e chamada de vídeo — e ${nome(c, 'neto')} se arrepende um pouco.`, memoria: `${nome(c, 'neto')} ensinou você a usar o celular.`, lembrar: ['neto', 'A tarde da aula de celular.', 'antigo'], efeito: () => { prox(c, 'neto', 6); cognicao(c, 1); feliz(c, 3); } }) },
      { id: 'pedir', texto: '"Faz pra mim, que é mais rápido"', resolver: c => ({ texto: `${nome(c, 'neto')} fez — e virou o seu suporte técnico oficial, com direito a revirar os olhos.`, memoria: null, efeito: () => prox(c, 'neto', 2) }) }
    ]
  },
  {
    id: 'vel15_chaves', manual: true, tipo: 'decisao', idade: [72, 100], tema: 'familia', peso: 1.6, repetir: 1,
    quando: c => comCarro(c.v) && (c.v.corpo.saude < 70 || idade(c.v) >= 78),
    papeis: { filho: fixo(P.filho(25)) },
    titulo: 'As chaves do carro',
    texto: c => `${nome(c, 'filho')} chegou com um jeito ensaiado: "A gente precisa conversar sobre você dirigir."`,
    opcoes: [
      { id: 'entregar', texto: 'Entregar as chaves', resolver: c => ({ texto: 'Doeu mais do que você mostrou. O carro ficou na garagem, e a cidade ficou um pouco maior.', memoria: 'Parou de dirigir, a pedido da família.', lembrar: ['filho', 'A conversa difícil sobre as chaves do carro.', 'apoio'], efeito: () => { feliz(c, -4); prox(c, 'filho', 3); } }) },
      { id: 'exame', texto: 'Propor um exame médico — e aceitar o resultado', comportamento: { disciplina: 1 }, resolver: c => c.v.corpo.saude >= 60 ? ({ texto: 'O médico liberou, com restrições: só de dia, só perto. Todo mundo aceitou.', memoria: null, efeito: () => prox(c, 'filho', 2) }) : ({ texto: 'O médico foi gentil e firme. Você entregou as chaves na saída do consultório.', memoria: 'Parou de dirigir, depois de um exame.', efeito: () => feliz(c, -3) }) },
      { id: 'recusar', texto: '"Dirijo há cinquenta anos"', comportamento: { impulsividade: 1 }, resolver: c => ({ texto: `${nome(c, 'filho')} desistiu da conversa — não da preocupação.`, memoria: null, efeito: () => { prox(c, 'filho', -4); estresse(c, 2); } }) }
    ]
  },
  {
    id: 'vel15_album', manual: true, tipo: 'decisao', idade: [66, 100], tema: 'familia', peso: 1.1, repetir: 0,
    quando: c => !!marcoAntigo(c.v),
    titulo: 'O álbum',
    texto: c => `Você resolveu organizar as fotos de uma vida inteira. A primeira que caiu da caixa: ${anoDe(marcoAntigo(c.v)!.t)} — ${minusc(marcoAntigo(c.v)!.texto)}`,
    opcoes: [
      { id: 'escrever', texto: 'Escrever atrás de cada foto quem e quando', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Levou meses. No fim, era um livro — e a família brigou para ver quem ficava com ele.', memoria: 'Organizou o álbum da vida, com as histórias atrás das fotos.', efeito: () => { feliz(c, 5); for (const f of P.filho(18)(c.v)) { const vin = c.v.vinculos[f.id]; if (vin) vin.proximidade = Math.min(100, vin.proximidade + 3); } } }) },
      { id: 'guardar', texto: 'Ver sozinho e guardar de novo', resolver: c => ({ texto: 'Uma tarde inteira com a caixa no colo. Algumas lembranças doeram, outras riram com você.', memoria: null, efeito: () => feliz(c, 2) }) }
    ]
  },
  /* ============================================================ A HISTÓRIA QUE VOLTA */
  {
    id: 'h15_carta_aberta', tipo: 'decisao', idade: [29, 32], tema: 'escolha', peso: 6, prioritario: true, prioridade: 2, repetir: 0,
    quando: c => c.v.fatos['carta15'] !== undefined && c.v.fatos['carta15_aberta'] === undefined,
    titulo: 'A carta de quando você tinha onze anos',
    texto: c => {
      const s = SONHOS[c.v.fatos['carta15_sonho'] ?? 5] ?? SONHOS[5];
      const virou = s.virou(c.v);
      return `Chegou pelo correio, com a letra torta de criança: a carta escrita na escola, em ${anoDe(c.v.fatos['carta15']!)}. ${s.id === 'nao_sei' ? '"Espero que você saiba o que quer ser." ' : `"Espero que você tenha conseguido ${s.texto.replace(/ \(.*\)$/, '')}." `}${s.id === 'nao_sei' ? 'Você ri: ainda não sabe, não do jeito que a criança imaginava.' : virou ? 'E você conseguiu — de um jeito que a criança nem imaginava.' : 'A vida foi para outro lado.'}`;
    },
    opcoes: [
      { id: 'guardar', texto: 'Guardar a carta com carinho', resolver: c => ({ texto: 'Foi parar na gaveta das coisas que não se joga fora.', memoria: 'Recebeu a carta que escreveu para si aos onze anos.', relevancia: 'biografia', efeito: () => { feliz(c, 3); c.v.fatos['carta15_aberta'] = c.v.t; } }) },
      { id: 'mostrar', texto: 'Mostrar para alguém de casa', resolver: c => ({ texto: 'Riram juntos da letra, da ortografia, do tamanho dos sonhos. Depois ficaram quietos um pouco.', memoria: 'Recebeu a carta que escreveu para si aos onze anos — e mostrou em casa.', relevancia: 'biografia', efeito: () => { feliz(c, 4); c.v.fatos['carta15_aberta'] = c.v.t; } }) },
      { id: 'recomecar', texto: c => (SONHOS[c.v.fatos['carta15_sonho'] ?? 5]?.virou(c.v) ? 'Escrever outra, para os 50' : 'Pensar se ainda dá tempo'), comportamento: { coragem: 1 }, resolver: c => ({ texto: SONHOS[c.v.fatos['carta15_sonho'] ?? 5]?.virou(c.v) ? 'Você escreveu outra carta, para abrir aos 50. Com a letra de agora.' : 'Ainda dá, talvez de outro jeito. A carta ficou na porta da geladeira.', memoria: null, efeito: () => { estresse(c, -2); c.v.fatos['carta15_aberta'] = c.v.t; } }) }
    ]
  },
  {
    id: 'h15_foto', manual: true, tipo: 'decisao', idade: [28, 65], tema: 'escolha', peso: 1.2, repetir: 2,
    quando: c => !!marcoAntigo(c.v) && (c.v.fatos['h15_foto'] === undefined || c.v.t - c.v.fatos['h15_foto']! >= 120),
    titulo: 'Uma foto antiga',
    texto: c => { const e = marcoAntigo(c.v)!; return `Arrumando uma gaveta, apareceu uma foto de ${anoDe(e.t)}. Você tinha ${e.idade} anos: ${minusc(e.texto)}`; },
    opcoes: [
      { id: 'postar', texto: 'Postar com uma legenda', resolver: c => ({ texto: 'Choveu comentário de gente que estava lá — e de gente que você nem lembrava.', memoria: null, efeito: () => { feliz(c, 2); c.v.fatos['h15_foto'] = c.v.t; } }) },
      { id: 'ligar', texto: 'Ligar para alguém que estava lá', resolver: c => ({ texto: 'Ficaram uma hora no telefone lembrando do que a foto não mostra.', memoria: null, efeito: () => { feliz(c, 3); estresse(c, -2); c.v.fatos['h15_foto'] = c.v.t; } }) },
      { id: 'gaveta', texto: 'Devolver para a gaveta', resolver: c => ({ texto: 'Tem coisa que é melhor deixar onde está.', memoria: null, efeito: () => { c.v.fatos['h15_foto'] = c.v.t; } }) }
    ]
  },
  {
    id: 'h15_colega_famoso', manual: true, tipo: 'decisao', idade: [20, 80], tema: 'amizade', peso: 2, repetir: 1,
    papeis: { famoso: fixo(colegaFamoso) },
    titulo: c => `${nome(c, 'famoso')} na TV`,
    texto: c => `Lá está ${nome(c, 'famoso')}, que você conheceu ${c.v.vinculos[c.p.famoso.id]?.origem === 'faculdade' ? 'na faculdade' : 'na escola'}, dando entrevista em rede nacional. Hoje ${ele(c, 'famoso')} é ${flex(c.p.famoso.genero, 'conhecido', 'conhecida', 'conhecide')} do país inteiro.`,
    opcoes: [
      { id: 'mensagem', texto: 'Mandar uma mensagem de parabéns', resolver: c => c.r.chance(0.55) ? ({ texto: `${nome(c, 'famoso')} respondeu de madrugada: "Você lembrou! Quando eu passar aí, a gente se vê."`, memoria: null, lembrar: ['famoso', 'Os parabéns pela fama, e a resposta de madrugada.', 'amizade'], efeito: () => prox(c, 'famoso', 5) }) : ({ texto: 'Visualizou. Talvez responda um dia; a caixa de mensagens dessa gente é um oceano.', memoria: null }) },
      { id: 'contar', texto: 'Contar para todo mundo que estudou junto', comportamento: { sociabilidade: 1 }, resolver: c => ({ texto: 'Virou a sua história favorita em festa. Ninguém acredita até você mostrar a foto da turma.', memoria: null, efeito: () => feliz(c, 2) }) },
      { id: 'nada', texto: 'Mudar de canal', resolver: () => ({ texto: 'Cada um com a sua vida.', memoria: null }) }
    ]
  },
  {
    id: 'h15_cidade_natal', manual: true, tipo: 'decisao', idade: [30, 85], tema: 'lugar', peso: 1, repetir: 2,
    quando: c => { const n = c.v.eu.municipioNatal; return !!n && n !== c.v.moradia.municipioId && (c.v.fatos['h15_natal'] === undefined || c.v.t - c.v.fatos['h15_natal']! >= 180); },
    titulo: c => `Voltar a ${municipio(c.v.eu.municipioNatal).nome}`,
    texto: c => `Faz tempo que você não volta a ${municipio(c.v.eu.municipioNatal).nome}, onde cresceu. Apareceu uma brecha na agenda — e uma passagem barata.`,
    opcoes: [
      { id: 'ir', texto: 'Ir rever a cidade', disponivel: c => custa(c, local(c, 900)), resolver: c => {
        const antigo = vinculosVivos(c.v).find(x => !x.p.especie && x.p.municipioId === c.v.eu.municipioNatal && !x.vin.convivio.length && c.v.t - x.vin.tUltimoContato >= 60);
        if (antigo) { antigo.vin.proximidade = Math.min(100, antigo.vin.proximidade + 8); antigo.vin.tUltimoContato = c.v.t; lembrarCom(c.v, antigo.p.id, 'O reencontro na cidade onde vocês cresceram.', 'antigo', 1); }
        return { texto: `A rua parecia menor, a padaria tinha outro nome, a escola estava pintada de outra cor.${antigo ? ` E na praça, quem aparece? ${antigo.p.nome}, como se não tivessem passado ${Math.round((c.v.t - antigo.vin.tUltimoContato) / 12) || 'tantos'} anos.` : ' Mesmo assim, era a sua cidade.'}`, memoria: `Voltou a ${municipio(c.v.eu.municipioNatal).nome}, onde cresceu.`, efeito: () => { dinheiro(c, -local(c, 900)); feliz(c, 4); c.v.fatos['h15_natal'] = c.v.t; } };
      } },
      { id: 'depois', texto: 'Deixar para outra vez', resolver: c => ({ texto: 'A cidade continua lá. Você também.', memoria: null, efeito: () => { c.v.fatos['h15_natal'] = c.v.t; } }) }
    ]
  }
];

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function minusc(s: string): string { const t = s.replace(/\.$/, ''); return `${t.charAt(0).toLowerCase()}${t.slice(1)}.`; }
