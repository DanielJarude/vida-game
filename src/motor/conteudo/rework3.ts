/**
 * REWORK 3 — origem, formação e vida concreta: as perguntas que nascem do
 * estado da casa de origem e da formação.
 *
 * Todas são prioritárias e disparadas por estado; o "sorteio" de cada uma
 * usa um gerador derivado (`rngDe`), para não empurrar as vidas que já
 * existiam para outro rumo. Anos tranquilos continuam permitidos.
 */

import type { Conteudo, Ctx } from './base';
import { clamp, rngDe } from '../rng';
import { idade, lembrarCom, temFato } from '../nucleo';
import { fato, feliz, estresse, prox, tensao } from './efeitos';
import { genitorEmCasa } from './papeis';
import { cursoOuNulo, CURSOS } from '../dados/cursos';
import { OCUPACOES } from '../dados/ocupacoes';
import { elegibilidade, nomeOcupacao } from '../sistemas/trabalho';
import { novaOportunidade } from '../sistemas/oportunidades';
import { definirObjetivo, podeDefinirObjetivo } from '../sistemas/vestibular';
import { contribuicaoEsperada, principal, recursosDaFamilia } from '../sistemas/origem';
import { habilidade, praticar } from '../sistemas/frentes';
import { marcar } from '../sistemas/marcas';
import { ofereceAqui } from '../sistemas/formacao';
import { podeComecarRotina } from '../sistemas/rotinas';
import { podeTentar } from '../plausibilidade';
import { moraComFamiliaDeOrigem } from '../sistemas/domicilio';
import { rendaPropriaMensal } from '../sistemas/dinheiro';
import { dinheiro as fmt, flex } from '../texto';

const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] !== undefined && c.v.fatos[chave] === c.v.t;
/** Um "às vezes" que não mexe no gerador principal. */
const asVezes = (c: Ctx, chave: string, p: number) => rngDe(c.v.id, chave, c.v.t).chance(p);

/** O curso de graduação que continua uma área técnica (o técnico em edificações → engenharia civil). */
const CONTINUA: Record<string, string> = { computacao: 'computacao', eletrotecnica: 'eng_eletrica', mecanica: 'eng_mecanica', edificacoes: 'eng_civil', automacao: 'eng_controle', administracao: 'administracao', agro: 'agronomia', logistica: 'administracao', enfermagem: 'enfermagem' };
function graduacaoDaArea(area: string): string | undefined {
  const id = CONTINUA[area];
  if (id && cursoOuNulo(id)?.nivel === 'superior') return id;
  return CURSOS.find(c => c.nivel === 'superior' && c.area === area && c.corte > 0)?.id;
}

/** Uma vaga técnica da área, ao alcance (para a porta que o fim do técnico abre). */
function vagaTecnica(c: Ctx, area: string) {
  return OCUPACOES.filter(o => o.area?.includes(area as never) && o.nivelCurso === 'tecnico' && !o.concurso && !o.entrada && o.nivel <= 3)
    .filter(o => { const d = elegibilidade(c.v, o); return d.grau === 'permitido' || d.grau === 'improvavel'; })
    .sort((a, b) => a.nivel - b.nivel)[0];
}

export const REWORK3: Conteudo[] = [
  /* ================================================ INFÂNCIA E A CASA DE ORIGEM */
  {
    // A excursão da escola: a mesma escola, casas diferentes. Numa casa folgada, nem vira pergunta.
    id: 'inf_excursao', tipo: 'decisao', idade: [8, 13], tema: 'escola', prioritario: true, repetir: 3,
    quando: c => !!c.v.educacao.basica && moraComFamiliaDeOrigem(c.v) && recursosDaFamilia(c.v).folga <= 2 && !c.v.biografia.some(b => /excursão da escola/.test(b.texto) && c.v.t - b.t < 48) && asVezes(c, 'inf_excursao', 0.14),
    titulo: 'A excursão da escola',
    texto: c => `A turma vai ${c.r.pick(['ao museu da capital', 'ao zoológico', 'a um parque de ciências', 'ao teatro, na cidade vizinha'])}. O bilhete pede R$ 120 — ônibus, entrada e lanche. Em casa, o dinheiro anda ${recursosDaFamilia(c.v).folga === 0 ? 'no limite' : 'contado'}.`,
    papeis: { quem: genitorEmCasa },
    opcoes: [
      { id: 'pedir', texto: c => `Pedir a ${c.p.quem?.nome ?? 'quem cuida de você'} mesmo assim`,
        resolver: c => {
          const rec = recursosDaFamilia(c.v);
          const deu = rec.folga >= 1 || (c.v.origem.reserva ?? 0) >= 300;
          return deu
            ? { texto: `${c.p.quem?.nome ?? 'Em casa'} deu um jeito. Você voltou falando da excursão por uma semana.`, memoria: 'Foi à excursão da escola — em casa, deram um jeito.', relevancia: 'cotidiano', tom: 'bom', efeito: () => { c.v.origem.reserva = Math.max(0, (c.v.origem.reserva ?? 0) - 120); feliz(c, 4); prox(c, 'quem', 3); } }
            : { texto: 'Não tinha como. Você ficou na escola com a turma que também não foi.', memoria: 'Não foi à excursão da escola: não havia como pagar.', relevancia: 'cotidiano', tom: 'ruim', efeito: () => feliz(c, -3) };
        } },
      { id: 'rifa', texto: 'Juntar o dinheiro vendendo rifa na rua', comportamento: { disciplina: 1, independencia: 1 },
        resolver: c => ({ texto: 'Três semanas de rifa de porta em porta. Deu o dinheiro — e sobrou uma moeda.', memoria: 'Vendeu rifa para pagar a excursão da escola.', relevancia: 'cotidiano', tom: 'bom', efeito: () => { praticar(c.v, c.r, 'vendas', 0.4, 1); feliz(c, 3); } }) },
      { id: 'nao', texto: 'Dizer que nem queria ir', resolver: () => ({ texto: 'Você disse que não queria. No dia, ficou olhando o ônibus sair.', memoria: null }) }
    ]
  },
  {
    // Necessidade de trabalhar cedo: a casa no limite pede mãos. Contexto, não destino.
    id: 'inf_ajudar_em_casa', tipo: 'decisao', idade: [11, 15], tema: 'familia', prioritario: true, repetir: 4,
    quando: c => moraComFamiliaDeOrigem(c.v) && !!c.v.educacao.basica && recursosDaFamilia(c.v).folga === 0 && asVezes(c, 'inf_ajudar_em_casa', 0.22),
    titulo: 'A casa precisa de mãos',
    texto: c => `${c.p.quem?.nome ?? 'Em casa'} anda chegando tarde e saindo cedo. ${c.v.vinculos && Object.values(c.v.vinculos).some(x => x.parentesco === 'irmao' && x.convivio.includes('casa')) ? 'Alguém precisa olhar os irmãos depois da aula' : 'Alguém precisa dar conta da casa'} — e um vizinho oferece uns trocados por ajuda no comércio dele.`,
    papeis: { quem: genitorEmCasa },
    opcoes: [
      { id: 'ajudar', texto: 'Ajudar em casa e no comércio, depois da aula', comportamento: { familia: 2, disciplina: 1 },
        consequencia: () => 'Entra um dinheiro pequeno e a casa respira; a tarde de estudo encurta.',
        resolver: c => ({ texto: 'As tardes viraram trabalho: o balcão do vizinho, os irmãos, a louça. No fim do mês, você entregou o dinheiro em casa.', memoria: 'Começou a ajudar em casa e no comércio de um vizinho depois da aula.', relevancia: 'biografia', efeito: () => { praticar(c.v, c.r, 'vendas', 0.6, 1); if (c.v.educacao.basica) c.v.educacao.basica.desempenho = clamp(c.v.educacao.basica.desempenho - 5); c.v.origem.reserva = (c.v.origem.reserva ?? 0) + 900; prox(c, 'quem', 6); estresse(c, 4); fato(c, 'trabalhou_cedo'); } }) },
      { id: 'fds', texto: 'Ajudar só nos fins de semana', comportamento: { familia: 1 },
        resolver: c => ({ texto: 'Sábado no comércio, domingo com os irmãos. Durante a semana, a escola.', memoria: null, efeito: () => { praticar(c.v, c.r, 'vendas', 0.3, 1); c.v.origem.reserva = (c.v.origem.reserva ?? 0) + 400; prox(c, 'quem', 3); } }) },
      { id: 'estudar', texto: 'Explicar que precisa do tempo para estudar', comportamento: { independencia: 1 },
        resolver: c => ({ texto: `${c.p.quem?.nome ?? 'Em casa'} entendeu — e deu um jeito sem você. Custou.`, memoria: null, efeito: () => { tensao(c, 'quem', 4); if (c.v.educacao.basica) c.v.educacao.basica.desempenho = clamp(c.v.educacao.basica.desempenho + 2); } }) }
    ]
  },
  {
    // A adolescência numa casa apertada: um trabalho que ajude — sem largar a escola, se der.
    id: 'adol_ajudar_contas', tipo: 'decisao', idade: [15, 17], tema: 'familia', prioritario: true, repetir: 0,
    quando: c => moraComFamiliaDeOrigem(c.v) && !c.v.trabalho.atual && recursosDaFamilia(c.v).folga <= 1 && asVezes(c, 'adol_ajudar_contas', 0.3),
    titulo: 'Uma ajuda nas contas',
    texto: c => `${c.p.quem?.nome ?? 'Em casa'} perguntou, sem jeito, se você não conseguiria alguma coisa para ajudar. ${c.v.educacao.basica ? 'A escola tem vagas de jovem aprendiz: meio período, carteira assinada, escola garantida.' : ''}`,
    papeis: { quem: genitorEmCasa },
    opcoes: [
      { id: 'aprendiz', texto: 'Procurar uma vaga de jovem aprendiz',
        disponivel: c => (c.v.educacao.basica ? true : 'Jovem aprendiz precisa estar na escola.'),
        resolver: c => ({ texto: 'Você foi atrás: currículo impresso na lan house, fila na agência.', memoria: 'Foi atrás de uma vaga de jovem aprendiz para ajudar em casa.', efeito: () => { novaOportunidade(c.v, { tipo: 'aprendiz', ocupacaoId: 'jovem_aprendiz', meses: 12, chave: 'aprendiz', bonus: 0.3, titulo: 'Jovem aprendiz', texto: 'Uma empresa da cidade recebe aprendizes indicados pela escola. Meio período, carteira assinada, escola garantida.' }); prox(c, 'quem', 3); } }) },
      { id: 'bicos', texto: 'Fazer bicos nos fins de semana', disponivel: c => (idade(c.v) >= 16 ? (podeTentar(podeComecarRotina(c.v, 'bico', 1)) ? true : 'A semana não comporta.') : 'Bico é a partir dos 16.'),
        resolver: c => ({ texto: 'Entrega, evento, obra: o que aparecesse no sábado.', memoria: 'Começou a fazer bicos para ajudar em casa.', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'bico')) c.v.rotinas.push({ id: 'bico', tInicio: c.v.t, nivel: 1 }); prox(c, 'quem', 3); } }) },
      { id: 'escola', texto: 'Seguir só estudando, e prometer ajudar depois', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: `${c.p.quem?.nome ?? 'Em casa'} disse que tudo bem — que estudar também era ajudar.`, memoria: null, efeito: () => tensao(c, 'quem', 2) }) }
    ]
  },
  {
    // Adulto que trabalha e mora com a família: a conversa sobre as contas. A resposta muda a conta do mês (`origem`).
    id: 'fam_contas_de_casa', tipo: 'decisao', idade: [18, 34], tema: 'familia', prioritario: true, repetir: 6,
    quando: c => c.v.moradia.tipo === 'pais' && !!c.v.trabalho.atual && rendaPropriaMensal(c.v) >= 1200 && contribuicaoEsperada(c.v) >= 0.1 && !!principal(c.v)
      && (c.v.fatos['conversa_contas'] === undefined || c.v.t - c.v.fatos['conversa_contas'] >= 72) && asVezes(c, 'fam_contas', 0.5),
    titulo: 'As contas de casa',
    texto: c => { const pr = principal(c.v)!.p; return `${pr.nome} sentou na mesa da cozinha com as contas do mês. "Agora que você trabalha…" A casa anda ${['no limite', 'apertada', 'com o básico', 'com alguma folga', 'confortável'][recursosDaFamilia(c.v).folga]}. O combinado seria uns ${fmt(Math.round(rendaPropriaMensal(c.v) * contribuicaoEsperada(c.v) / 10) * 10)} por mês.`; },
    opcoes: [
      { id: 'combinado', texto: 'Topar o combinado', comportamento: { familia: 1 },
        consequencia: () => 'Uma parte do salário vai para a casa todo mês.',
        resolver: c => ({ texto: 'Vocês acertaram um valor. A conversa terminou num café.', memoria: 'Passou a ajudar nas contas da casa.', relevancia: 'cotidiano', efeito: () => { c.v.origem.contribuicao = 'combinado'; c.v.fatos['conversa_contas'] = c.v.t; const pr = principal(c.v); if (pr) { pr.vin.proximidade = clamp(pr.vin.proximidade + 3); pr.vin.tensao = clamp(pr.vin.tensao - 5); } } }) },
      { id: 'mais', texto: 'Pôr mais do que o pedido', comportamento: { familia: 2, generosidade: 1 },
        consequencia: () => 'Sobra menos para você; a casa de lá respira (e guarda).',
        resolver: c => ({ texto: `${principal(c.v)?.p.nome ?? 'Em casa'} fingiu que não precisava tanto. Aceitou.`, memoria: 'Passou a sustentar boa parte da casa da família.', relevancia: 'biografia', efeito: () => { c.v.origem.contribuicao = 'mais'; c.v.fatos['conversa_contas'] = c.v.t; const pr = principal(c.v); if (pr) { pr.vin.proximidade = clamp(pr.vin.proximidade + 6); lembrarCom(c.v, pr.p.id, 'Passou a ajudar a sustentar a casa.', 'apoio', 2); } } }) },
      { id: 'nada', texto: 'Dizer que agora não dá', comportamento: { independencia: 1 },
        consequencia: () => 'O salário fica todo com você; em casa, o assunto não morre.',
        resolver: c => ({ texto: 'Ficou um silêncio. A conta de luz ficou em cima da geladeira a semana inteira.', memoria: null, efeito: () => { c.v.origem.contribuicao = 'nada'; c.v.fatos['conversa_contas'] = c.v.t; const pr = principal(c.v); if (pr) pr.vin.tensao = clamp(pr.vin.tensao + 10); } }) }
    ]
  },

  /* ============================================================ FORMAÇÃO */
  {
    // O fim do médio integrado: o técnico pode ser trabalho, faculdade na área — ou só um diploma a mais.
    id: 'if_depois', tipo: 'decisao', idade: [16, 20], tema: 'estudo', prioritario: true, prioridade: 2, repetir: 0,
    quando: c => deHoje(c, 'concluiu_integrado'),
    titulo: 'E o técnico, agora?',
    texto: c => {
      const t = [...c.v.educacao.concluidos].reverse().find(x => x.nivel === 'tecnico');
      const viv = (c.v.educacao.vivencias ?? []).find(x => x.tipo === 'projeto_tecnico');
      return `Três anos de instituto federal e um diploma de ${t?.nome.replace(/^Técnico em /, 'técnico em ').toLowerCase() ?? 'técnico'}.${viv?.feito ? ` O projeto do laboratório ainda rende conversa.` : ''} Dá para trabalhar na área já, seguir para uma faculdade que continue o que você aprendeu — ou deixar o técnico como um diploma a mais.`;
    },
    opcoes: [
      { id: 'area', texto: 'Procurar trabalho na área técnica',
        disponivel: c => { const t = [...c.v.educacao.concluidos].reverse().find(x => x.nivel === 'tecnico'); return t && vagaTecnica(c, t.area) ? true : 'Não há vaga técnica ao alcance por aqui agora.'; },
        consequencia: () => 'Abre uma vaga da área, com entrevista.',
        resolver: c => {
          const t = [...c.v.educacao.concluidos].reverse().find(x => x.nivel === 'tecnico')!;
          const oc = vagaTecnica(c, t.area)!;
          return { texto: `A coordenação do curso passou a lista de empresas que contratam egressos. Uma delas chamou para entrevista: ${nomeOcupacao(c.v, oc)}.`, memoria: 'Terminou o técnico decidido a trabalhar na área.', efeito: () => { novaOportunidade(c.v, { tipo: 'vaga', ocupacaoId: oc.id, meses: 12, chave: 'vaga_egresso', bonus: 0.3, titulo: `Vaga para egressos: ${nomeOcupacao(c.v, oc)}`, texto: 'Uma empresa que contrata quem sai do instituto federal chamou para entrevista.' }); marcar(c.v, 'oportunidade', 'Saiu do técnico com uma vaga da área em vista.', 2); } };
        } },
      { id: 'faculdade', texto: 'Mirar uma faculdade na mesma área',
        disponivel: c => { const t = [...c.v.educacao.concluidos].reverse().find(x => x.nivel === 'tecnico'); const g = t ? graduacaoDaArea(t.area) : undefined; return g && podeTentar(podeDefinirObjetivo(c.v, g)) ? true : 'Não há uma graduação que continue esta área pelo ENEM.'; },
        consequencia: c => { const t = [...c.v.educacao.concluidos].reverse().find(x => x.nivel === 'tecnico'); const g = t ? cursoOuNulo(graduacaoDaArea(t.area) ?? '') : undefined; return g ? `A preparação para o ENEM passa a mirar ${g.nome}.` : undefined; },
        resolver: c => {
          const t = [...c.v.educacao.concluidos].reverse().find(x => x.nivel === 'tecnico')!;
          const g = graduacaoDaArea(t.area)!;
          return { texto: `${cursoOuNulo(g)!.nome} virou o alvo: o técnico foi o começo.`, memoria: `Terminou o técnico e decidiu seguir para ${cursoOuNulo(g)!.nome}.`, efeito: () => { definirObjetivo(c.v, g); } };
        } },
      { id: 'outro', texto: 'Seguir outro caminho', resolver: () => ({ texto: 'O diploma ficou na pasta. A vida foi para outro lado — por enquanto.', memoria: null }) }
    ]
  },
  {
    // A faculdade que não anda: o jogo não decide a saída; mostra as saídas.
    id: 'uni_dificuldade', tipo: 'decisao', idade: [17, 40], tema: 'estudo', prioritario: true, repetir: 3,
    quando: c => { const m = c.v.educacao.matricula; const cc = cursoOuNulo(m?.cursoId ?? ''); return !!m && !m.trancado && cc?.nivel === 'superior' && m.desempenho < 40 && c.v.t - m.tInicio >= 12 && asVezes(c, 'uni_dificuldade', 0.55); },
    titulo: 'O curso não está andando',
    texto: c => { const m = c.v.educacao.matricula!; return `Mais um semestre de ${cursoOuNulo(m.cursoId)!.nome} com matéria pendurada. ${c.v.trabalho.atual ? 'O trabalho come o tempo de estudar.' : c.v.mente.estresse >= 60 ? 'A cabeça não acompanha.' : 'O curso parece outro do que você imaginava.'}`; },
    opcoes: [
      { id: 'grupo', texto: 'Montar um grupo de estudos com a turma',
        disponivel: c => (ofereceAqui(c.v, 'grupo_estudos') && podeTentar(podeComecarRotina(c.v, 'grupo_estudos', 1)) ? true : 'Não cabe na semana agora.'),
        consequencia: () => 'Meia semana a menos de folga; a nota tende a subir — e a turma fica mais perto.',
        resolver: c => ({ texto: 'Quarta à noite, biblioteca. Quem entendeu explica; quem não entendeu pergunta.', memoria: 'Montou um grupo de estudos para não perder o curso.', efeito: () => { if (!c.v.rotinas.some(r => r.id === 'grupo_estudos')) c.v.rotinas.push({ id: 'grupo_estudos', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'trancar', texto: 'Trancar e respirar', consequencia: () => 'A vaga espera até quatro anos.',
        resolver: c => ({ texto: 'Você trancou. O alívio veio antes da culpa.', memoria: `Trancou ${cursoOuNulo(c.v.educacao.matricula!.cursoId)!.nome}.`, relevancia: 'biografia', efeito: () => { const m = c.v.educacao.matricula!; m.trancado = true; m.tTrancou = c.v.t; estresse(c, -8); } }) },
      { id: 'trocar', texto: 'Largar o curso e repensar a área', comportamento: { independencia: 1 },
        consequencia: () => 'O que foi cursado fica para trás; a escolha de outro curso é sua, em Formação.',
        resolver: c => { const nome = cursoOuNulo(c.v.educacao.matricula!.cursoId)!.nome; return { texto: `Você saiu de ${nome}. Não era o seu lugar — e agora você sabia disso.`, memoria: `Largou ${nome} para repensar o caminho.`, relevancia: 'marco', efeito: () => { c.v.educacao.matricula = undefined; } }; } },
      { id: 'seguir', texto: 'Seguir e insistir', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Você seguiu. Às vezes insistir é o que resolve.', memoria: null }) }
    ]
  },
  {
    // Quem saiu da escola técnica e da faculdade fica com gente por perto — às vezes, o professor volta à vida.
    id: 'form_professor_lembra', tipo: 'acontecimento', idade: [22, 50], tema: 'estudo', prioritario: true, repetir: 0,
    quando: c => {
      if (!asVezes(c, 'form_professor_lembra', 0.06)) return false;
      return Object.values(c.v.vinculos).some(x => x.formacao && x.formacao.papel !== 'colega' && x.formacao.tFim !== undefined && c.v.t - x.formacao.tFim >= 48 && c.v.pessoas[x.pessoaId]?.vivo && x.proximidade >= 30);
    },
    narrar: c => {
      const x = Object.values(c.v.vinculos).find(y => y.formacao && y.formacao.papel !== 'colega' && y.formacao.tFim !== undefined && c.v.t - y.formacao.tFim >= 48 && c.v.pessoas[y.pessoaId]?.vivo && y.proximidade >= 30)!;
      const p = c.v.pessoas[x.pessoaId];
      const anos = Math.floor((c.v.t - x.formacao!.tFim!) / 12);
      const papel = x.formacao!.papel === 'orientador' ? flex(p.genero, 'seu orientador', 'sua orientadora', 'sue orientadore') : flex(p.genero, 'seu professor', 'sua professora', 'sue professore');
      return { texto: `${p.nome}, que foi ${papel}, mandou mensagem depois de ${anos} anos: tinha visto seu nome por aí e quis saber como a vida tinha seguido.`, relevancia: 'cotidiano', tom: 'bom', efeito: () => { x.proximidade = clamp(x.proximidade + 6); x.tUltimoContato = c.v.t; lembrarCom(c.v, p.id, `Voltaram a se falar, ${anos} anos depois.`, 'reconciliacao', 1); } };
    }
  },
  {
    // Uma habilidade da escola que nunca virou nada — até alguém lembrar dela.
    id: 'form_time_lembra', tipo: 'acontecimento', idade: [19, 35], tema: 'lazer', prioritario: true, repetir: 0,
    quando: c => (c.v.educacao.vivencias ?? []).some(x => x.tipo === 'time' && x.anos >= 3) && !c.v.rotinas.some(r => r.id === 'futebol') && habilidade(c.v, 'futebol') >= 40 && !temFato(c.v, 'time_lembra') && asVezes(c, 'form_time_lembra', 0.12),
    narrar: c => ({ texto: 'Um antigo colega do time da escola montou um time de várzea e chamou quem jogava junto. "Você ainda chuta com a esquerda?"', relevancia: 'cotidiano', efeito: () => { fato(c, 'time_lembra'); novaOportunidade(c.v, { tipo: 'retomar', dominio: 'futebol', meses: 12, chave: 'retomar', titulo: 'O time da várzea', texto: 'Um antigo colega do time da escola chamou para o time de várzea do bairro, aos domingos.' }); } })
  }
];

