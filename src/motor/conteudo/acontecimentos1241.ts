/**
 * 12.4.1 — ACONTECIMENTOS POR FASE DA VIDA. Um da infância, três da adolescência e o fluxo próprio da vida adulta
 * (`motor.vidaAdultaDoAno`): os anos de adulto têm um sorteio só deles, entre acontecimentos que só fazem sentido na
 * trajetória de quem os vive — o filho que já saiu de casa, os dez anos de casados, o filho adulto que pede ajuda com a
 * entrada do apartamento, a goteira na casa própria que envelheceu, os anos no mesmo emprego, a cidade nova.
 *
 * Regras da casa: papéis com pessoas reais, `quando` lido do estado (idade, família, dinheiro, relações, decisões e
 * história de antes), `manual` com sorteio derivado (as vidas de antes continuam as mesmas até um deles acontecer),
 * e cada opção muda alguma coisa (o dinheiro, a relação, a casa, a cabeça).
 */
import type { Conteudo, Ctx } from './base';
import type { Imovel, Vida } from '../tipos';
import * as P from './papeis';
import { cognicao, custa, dinheiro, estresse, feliz, local, prox, tensao } from './efeitos';
import { clamp } from '../rng';

/** A família de origem consegue pagar uma coisa (pela classe e pela reserva da casa). */
const familiaPaga = (c: Ctx, valor: number) => ['media', 'alta'].includes(c.v.origem.classe) || (c.v.origem.reserva ?? 0) >= valor * 3;
const pagaFamilia = (c: Ctx, valor: number) => { c.v.origem.reserva = Math.max(0, Math.round((c.v.origem.reserva ?? 0) - valor)); };
const naEscola = (v: Vida) => !!v.educacao.basica && ['fundamental1', 'fundamental2', 'medio'].includes(v.educacao.basica.etapa);
const casaPropria = (v: Vida): Imovel | undefined => v.financas.bens.find((b): b is Imovel => b.tipo === 'imovel' && b.id === v.moradia.imovelId);
const anosCasados = (v: Vida, id: string) => { const r = v.vinculos[id]?.romance; return r?.estagio === 'casamento' ? (v.t - r.tEstagio) / 12 : 0; };
const temInstrumento = (v: Vida) => (v.financas.coisas ?? []).some(t => ['violao', 'guitarra', 'teclado', 'bateria', 'cavaquinho', 'violino', 'saxofone', 'sanfona', 'pandeiro'].includes(t.coisaId));

export const ACONTECIMENTOS_1241: Conteudo[] = [
  /* ================================================================ infância */
  {
    id: 'inf1241_feira_de_ciencias', manual: true, tipo: 'decisao', idade: [8, 11], tema: 'escola', peso: 2,
    papeis: { adulto: P.genitorEmCasa },
    quando: c => naEscola(c.v),
    titulo: 'A feira de ciências',
    texto: c => `A escola anunciou a feira de ciências. Cada um leva um experimento — e ${c.p.adulto.nome} perguntou o que você pretende fazer.`,
    opcoes: [
      { id: 'junto', texto: c => `Montar o vulcão (ou o circuito) junto com ${c.p.adulto.nome}`, comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: `Duas noites de mesa da cozinha suja, bicarbonato e cola quente. Na feira, você explicou sozinho — ${c.p.adulto.nome} ficou no fundo, filmando.`, memoria: `Fez a feira de ciências com ${c.p.adulto.nome}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['adulto', 'A feira de ciências, juntos na mesa da cozinha.', 'apoio'], efeito: () => { prox(c, 'adulto', 6); feliz(c, 4); } }) },
      { id: 'sozinho', texto: 'Fazer sozinho, do seu jeito', comportamento: { independencia: 1 },
        resolver: c => { const deu = c.v.mente.cognicao + c.r.next() * 30 >= 70; return { texto: deu ? 'A ideia era sua do começo ao fim — e a professora levou o seu trabalho para a vitrine do corredor.' : 'O experimento não funcionou na hora. Você explicou por que deveria ter funcionado; metade da turma entendeu.', memoria: deu ? 'Teve o trabalho da feira de ciências escolhido para a vitrine da escola.' : null, relevancia: 'biografia', tom: deu ? 'bom' : 'neutro', efeito: () => { feliz(c, deu ? 5 : -1); if (deu) c.v.fatos['gosta_de_ciencia'] = c.v.t; } }; } },
      { id: 'kit', texto: c => `Pedir o kit pronto da papelaria (uns ${local(c, 120)})`, disponivel: c => (familiaPaga(c, local(c, 120)) ? true : 'Em casa, o dinheiro não dá para isso agora.'),
        resolver: c => ({ texto: 'O kit veio com tudo — inclusive a explicação. Funcionou, e você aprendeu a montar, não a pensar.', memoria: null, efeito: () => { pagaFamilia(c, local(c, 120)); } }) }
    ]
  },

  /* ================================================================ adolescência */
  {
    id: 'ado1241_intercambio', manual: true, tipo: 'decisao', idade: [15, 17], tema: 'escola', peso: 1,
    papeis: { adulto: P.genitorEmCasa },
    quando: c => naEscola(c.v) && (familiaPaga(c, local(c, 30000)) || c.v.mente.cognicao >= 68),
    titulo: 'Um semestre fora',
    texto: c => familiaPaga(c, local(c, 30000))
      ? `Uma agência passou na escola oferecendo intercâmbio: seis meses noutro país, morando com uma família. ${c.p.adulto.nome} disse que dá para pagar — se você quiser.`
      : 'A escola abriu inscrição para uma bolsa de intercâmbio: seis meses noutro país, tudo pago, para quem tem boas notas. As suas dão.',
    opcoes: [
      { id: 'ir', texto: c => (familiaPaga(c, local(c, 30000)) ? 'Ir (a família paga)' : 'Concorrer à bolsa'), comportamento: { coragem: 1, independencia: 1 },
        resolver: c => {
          const bolsa = !familiaPaga(c, local(c, 30000));
          const passou = !bolsa || c.v.mente.cognicao + c.r.next() * 25 >= 82;
          if (!passou) return { texto: 'A bolsa ficou com outra pessoa da escola. Você ficou — e guardou o formulário.', memoria: 'Concorreu a uma bolsa de intercâmbio na escola e não passou.', relevancia: 'biografia', tom: 'ruim', efeito: () => { feliz(c, -4); } };
          return { texto: 'Seis meses de outra língua, outra comida, outra família. Voltou falando diferente — e vendo a sua cidade de fora.', memoria: bolsa ? 'Ganhou uma bolsa de intercâmbio e passou seis meses fora, na adolescência.' : 'Fez intercâmbio na adolescência: seis meses noutro país.', relevancia: 'marco', tom: 'bom',
            efeito: () => { if (!bolsa) pagaFamilia(c, local(c, 30000)); feliz(c, 6); c.v.fatos['fez_intercambio'] = c.v.t; prox(c, 'adulto', -2); } };
        } },
      { id: 'ficar', texto: 'Ficar: a turma, a casa, o último ano aqui', resolver: c => ({ texto: 'Você ficou. Às vezes pensa em como teria sido.', memoria: null, efeito: () => { prox(c, 'adulto', 2); } }) }
    ]
  },
  {
    id: 'ado1241_banda', manual: true, tipo: 'decisao', idade: [13, 17], tema: 'amizade', peso: 4,
    papeis: { amigo: P.amigo },
    quando: c => temInstrumento(c.v) || (c.v.caminhos.frentes['musica']?.habilidade ?? 0) >= 20,
    titulo: c => `${c.p.amigo.nome} quer montar uma banda`,
    texto: c => `${c.p.amigo.nome} arrumou uma garagem para ensaiar e falta gente. ${temInstrumento(c.v) ? 'Você tem o instrumento.' : 'Você toca um pouco.'} Ensaio todo sábado.`,
    opcoes: [
      { id: 'entrar', texto: 'Entrar na banda', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Três covers mal tocados, uma música própria com letra vergonhosa e o primeiro show numa festa de escola. Ninguém esqueceu.', memoria: `Teve uma banda de garagem com ${c.p.amigo.nome} na adolescência.`, relevancia: 'biografia', tom: 'bom', lembrar: ['amigo', 'A banda de garagem.', 'ritual'],
          efeito: () => { prox(c, 'amigo', 8); feliz(c, 5); const f = c.v.caminhos.frentes['musica']; if (f) { f.habilidade = clamp(f.habilidade + 3); f.interesse = clamp(f.interesse + 6); } c.v.fatos['banda_adolescencia'] = c.v.t; } }) },
      { id: 'nao', texto: 'Dizer que não tem tempo', resolver: c => ({ texto: `${c.p.amigo.nome} achou outra pessoa em uma semana.`, memoria: null, efeito: () => { prox(c, 'amigo', -3); } }) }
    ]
  },
  {
    id: 'ado1241_viagem_amigos', manual: true, tipo: 'decisao', idade: [16, 17], tema: 'familia', peso: 2,
    papeis: { adulto: P.genitorEmCasa, amigo: P.amigo },
    titulo: 'A primeira viagem sem os adultos',
    texto: c => `${c.p.amigo.nome} e a turma vão passar o feriado na casa de praia de um tio. Falta você — e falta ${c.p.adulto.nome} deixar.`,
    opcoes: [
      { id: 'pedir', texto: c => `Pedir a ${c.p.adulto.nome}, com o plano inteiro explicado`, comportamento: { disciplina: 1 },
        resolver: c => {
          const deixou = (c.v.vinculos[c.p.adulto.id]?.tensao ?? 0) < 40 && c.r.chance(0.7);
          return deixou
            ? { texto: `${c.p.adulto.nome} ligou para o tio, pediu o endereço e deixou. Foi o feriado mais longo e mais curto da sua vida.`, memoria: `Fez a primeira viagem sem os adultos, com ${c.p.amigo.nome} e a turma.`, relevancia: 'biografia', tom: 'bom', efeito: () => { feliz(c, 6); prox(c, 'amigo', 6); prox(c, 'adulto', 3); } }
            : { texto: `${c.p.adulto.nome} disse que ainda não. Você ficou ouvindo as histórias depois.`, memoria: null, tom: 'ruim', efeito: () => { feliz(c, -3); tensao(c, 'adulto', 4); } };
        } },
      { id: 'escondido', texto: 'Dizer que vai dormir na casa de um amigo — e ir', comportamento: { impulsividade: 1 },
        resolver: c => {
          const descobriu = c.r.chance(0.45);
          return { texto: descobriu ? `Uma foto da turma na praia chegou até ${c.p.adulto.nome}. A volta foi pior do que a ida foi boa.` : 'Ninguém descobriu. Você também nunca contou.', memoria: descobriu ? `Viajou escondido com a turma — e ${c.p.adulto.nome} descobriu.` : null, relevancia: 'biografia', tom: descobriu ? 'ruim' : 'bom',
            efeito: () => { feliz(c, descobriu ? -2 : 5); prox(c, 'amigo', 5); if (descobriu) { tensao(c, 'adulto', 15); prox(c, 'adulto', -6); } } };
        } },
      { id: 'ficar', texto: 'Ficar em casa', resolver: c => ({ texto: 'O feriado passou devagar.', memoria: null, efeito: () => { prox(c, 'amigo', -2); } }) }
    ]
  },

  /* ================================================================ vida adulta (fluxo próprio) */
  {
    id: 'adu1241_ninho_vazio', manual: true, tipo: 'acontecimento', idade: [42, 75], tema: 'familia', peso: 3,
    papeis: { filho: P.filho(18) },
    quando: c => P.filhoEmCasa()(c.v).length === 0 && P.filho(18)(c.v).length > 0 && P.filho(0, 17)(c.v).length === 0,
    narrar: c => {
      const par = P.conjuge(c.v)[0];
      return { texto: par ? `A casa ficou grande: ${c.p.filho.nome} foi o último a sair. Você e ${par.nome} voltaram a jantar a dois — e a falar de outras coisas.` : `A casa ficou grande: ${c.p.filho.nome} foi o último a sair. O silêncio do jantar demorou a ficar confortável.`, relevancia: 'biografia', tom: 'neutro',
        efeito: () => { feliz(c, par ? 1 : -3); if (par) { const vin = c.v.vinculos[par.id]; if (vin) vin.proximidade = clamp(vin.proximidade + 4); } prox(c, 'filho', 2); } };
    }
  },
  {
    id: 'adu1241_dez_anos_casados', manual: true, tipo: 'decisao', idade: [28, 90], tema: 'amor', peso: 8,
    papeis: { par: P.conjuge },
    quando: c => { const a = anosCasados(c.v, c.p.par.id); return a >= 10 && a < 12; },
    titulo: c => `Dez anos com ${c.p.par.nome}`,
    texto: c => `Em uma semana fazem dez anos de casados. ${c.p.par.nome} ${(c.v.vinculos[c.p.par.id]?.tensao ?? 0) >= 40 ? 'anda distante, mas lembrou da data' : 'já perguntou o que vocês vão fazer'}.`,
    opcoes: [
      { id: 'viagem', texto: c => `Uma viagem a dois (uns ${local(c, 6000)})`, disponivel: c => custa(c, local(c, 6000)), comportamento: { generosidade: 1 },
        resolver: c => ({ texto: 'Quatro dias longe de tudo. Riram das mesmas coisas de dez anos atrás.', memoria: `Comemorou dez anos de casados com ${c.p.par.nome} numa viagem a dois.`, relevancia: 'biografia', tom: 'bom', lembrar: ['par', 'Os dez anos de casados, viajando a dois.', 'ritual'], efeito: () => { dinheiro(c, -local(c, 6000)); prox(c, 'par', 8); tensao(c, 'par', -8); feliz(c, 5); } }) },
      { id: 'jantar', texto: c => `Um jantar no lugar do primeiro encontro (uns ${local(c, 500)})`, disponivel: c => custa(c, local(c, 500)),
        resolver: c => ({ texto: 'O restaurante mudou de dono, o cardápio também. A mesa do canto ainda estava lá.', memoria: null, tom: 'bom', efeito: () => { dinheiro(c, -local(c, 500)); prox(c, 'par', 5); tensao(c, 'par', -4); feliz(c, 3); } }) },
      { id: 'esquecer', texto: 'Deixar passar: é só uma data', resolver: c => ({ texto: `${c.p.par.nome} não disse nada. Disse tudo.`, memoria: null, tom: 'ruim', efeito: () => { prox(c, 'par', -6); tensao(c, 'par', 8); } }) }
    ]
  },
  {
    id: 'adu1241_filho_entrada', manual: true, tipo: 'decisao', idade: [45, 85], tema: 'familia', peso: 2,
    papeis: { filho: P.filho(23, 45) },
    quando: c => !c.v.vinculos[c.p.filho.id]?.convivio.includes('casa') && c.v.financas.conta >= local(c, 40000),
    titulo: c => `${c.p.filho.nome} quer comprar um apartamento`,
    texto: c => `${c.p.filho.nome} achou um apartamento e juntou quase tudo para a entrada. Faltam uns ${local(c, 30000)} — e o pedido veio meio sem jeito.`,
    opcoes: [
      { id: 'dar', texto: c => `Dar o que falta (${local(c, 30000)})`, comportamento: { generosidade: 1 },
        resolver: c => ({ texto: `${c.p.filho.nome} mandou a foto da chave na mesma tarde.`, memoria: `Ajudou ${c.p.filho.nome} com a entrada do primeiro apartamento.`, relevancia: 'biografia', tom: 'bom', lembrar: ['filho', 'A entrada do apartamento.', 'apoio'], efeito: () => { dinheiro(c, -local(c, 30000)); prox(c, 'filho', 10); feliz(c, 3); } }) },
      { id: 'emprestar', texto: 'Emprestar, para devolver aos poucos', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `Combinaram um valor por mês. ${c.p.filho.nome} agradeceu — e anotou num caderno.`, memoria: null, efeito: () => { dinheiro(c, -local(c, 30000)); c.v.fatos[`emprestou_filho_${c.p.filho.id}`] = c.v.t; prox(c, 'filho', 4); } }) },
      { id: 'negar', texto: 'Dizer que agora não dá', resolver: c => ({ texto: `${c.p.filho.nome} disse que entendia. Comprou dois anos depois, sem contar a ninguém.`, memoria: null, tom: 'ruim', efeito: () => { prox(c, 'filho', -5); tensao(c, 'filho', 6); } }) }
    ]
  },
  {
    id: 'adu1241_goteira', manual: true, tipo: 'decisao', idade: [22, 95], tema: 'casa', repetir: 6, peso: 2,
    quando: c => { const b = casaPropria(c.v); return !!b && b.estado < 65 && !b.problema; },
    titulo: 'A goteira',
    texto: c => `Choveu a noite inteira e amanheceu um balde no meio ${casaPropria(c.v)!.nome.startsWith('casa') ? 'da sala' : 'do quarto'}. O telhado (ou a laje) pede conserto há tempo.`,
    opcoes: [
      { id: 'consertar', texto: c => `Chamar alguém e consertar direito (uns ${local(c, 4000)})`, disponivel: c => custa(c, local(c, 4000)), comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Dois dias de obra, telha nova e manta. A próxima chuva passou por cima.', memoria: null, efeito: () => { dinheiro(c, -local(c, 4000)); const b = casaPropria(c.v)!; b.estado = clamp(b.estado + 12); (b.historia ??= []).push({ t: c.v.t, texto: 'Telhado consertado depois de uma goteira.' }); estresse(c, -2); } }) },
      { id: 'remendo', texto: c => `Um remendo, por enquanto (uns ${local(c, 600)})`, disponivel: c => custa(c, local(c, 600)),
        resolver: c => ({ texto: 'O remendo segurou. Por enquanto.', memoria: null, efeito: () => { dinheiro(c, -local(c, 600)); estresse(c, 2); } }) },
      { id: 'balde', texto: 'Deixar o balde e ver depois', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'O balde virou parte da casa. A mancha no teto também.', memoria: null, tom: 'ruim', efeito: () => { const b = casaPropria(c.v)!; b.estado = clamp(b.estado - 6); estresse(c, 4); } }) }
    ]
  },
  {
    id: 'adu1241_mesmo_emprego', manual: true, tipo: 'decisao', idade: [34, 52], tema: 'trabalho', peso: 2,
    quando: c => !!c.v.trabalho.atual && c.v.t - c.v.trabalho.atual.tInicio >= 96,
    titulo: c => `${Math.floor((c.v.t - c.v.trabalho.atual!.tInicio) / 12)} anos no mesmo lugar`,
    texto: c => `Você conhece cada canto ${c.v.trabalho.atual!.empregador.startsWith('a') || c.v.trabalho.atual!.empregador.startsWith('o') ? 'd' + c.v.trabalho.atual!.empregador : 'do trabalho'}. Numa segunda-feira qualquer, a pergunta apareceu: é isso para sempre?`,
    opcoes: [
      { id: 'curso', texto: c => `Fazer um curso à noite, para crescer aqui ou sair (uns ${local(c, 3000)})`, disponivel: c => custa(c, local(c, 3000)), comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Um ano de aula às terças e quintas. Cansou — e o currículo mudou de cara.', memoria: 'Voltou a estudar à noite depois de anos no mesmo emprego.', relevancia: 'biografia', tom: 'bom', efeito: () => { dinheiro(c, -local(c, 3000)); cognicao(c, 1); estresse(c, 4); c.v.fatos['curso_meia_carreira'] = c.v.t; if (c.v.trabalho.atual) c.v.trabalho.atual.desempenho = clamp(c.v.trabalho.atual.desempenho + 4); } }) },
      { id: 'pensar', texto: 'Começar a olhar outras vagas, com calma', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Abriu as vagas no celular, à noite. Ainda não mandou nada — mas sabe o que existe.', memoria: null, efeito: () => { c.v.fatos['quer_mudar_de_emprego'] = c.v.t; feliz(c, 1); } }) },
      { id: 'ficar', texto: 'Ficar: a estabilidade também é uma escolha', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'A pergunta passou. Voltou de vez em quando.', memoria: null, efeito: () => { estresse(c, -1); } }) }
    ]
  },
  {
    id: 'adu1241_cidade_nova', manual: true, tipo: 'decisao', idade: [20, 85], tema: 'lugar', repetir: 4, peso: 2,
    // Chegou há pouco (a moradia tem menos de um ano) e ainda não conhece ninguém na cidade.
    quando: c => c.v.t - c.v.moradia.tInicio <= 12 && !Object.entries(c.v.vinculos).some(([id, vin]) => !vin.parentesco && (vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo') && c.v.pessoas[id]?.vivo && c.v.pessoas[id]?.municipioId === c.v.moradia.municipioId),
    titulo: 'A vizinhança nova',
    texto: () => 'Os vizinhos do lado deixaram um bilhete por baixo da porta: um jantar no sábado, "para conhecer quem chegou".',
    opcoes: [
      { id: 'ir', texto: 'Ir, levando uma sobremesa', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Ficou até a meia-noite. Saiu com o telefone do encanador, da padaria boa e de um casal com filhos da mesma idade.', memoria: 'Foi bem recebido pelos vizinhos na cidade nova.', relevancia: 'cotidiano', tom: 'bom', efeito: () => { feliz(c, 4); estresse(c, -3); c.v.fatos['participa_comunidade'] = c.v.t; } }) },
      { id: 'agradecer', texto: 'Agradecer e não ir', resolver: c => ({ texto: 'Mandou uma mensagem educada. Os vizinhos acenam no elevador.', memoria: null, efeito: () => { feliz(c, -1); } }) }
    ]
  }
];

