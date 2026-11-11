/**
 * VIDA 16.1 · MAIS CINCO OFÍCIOS POR DENTRO — engenharia, enfermagem, contabilidade, jornalismo e psicologia, que só
 * tinham o desafio genérico de `conteudo/oficios`. A pasta do ano é a mesma da VIDA 16 (`oficios16`: gerada com sorteio
 * derivado, nada muda para quem não abre), mas cada profissão tem o SEU estado e a SUA mecânica:
 *
 *   ENGENHARIA     a obra (ou o projeto, ou a parada de manutenção) do ano, o PADRÃO de execução (economizar, seguir a
 *                  norma, reforçar), os imprevistos (o solo, a chuva, o fornecedor, o erro de projeto), a ART que pedem
 *                  para assinar sem acompanhar — e o RISCO LATENTE de cada obra entregue, que pode virar patologia anos
 *                  depois (a rachadura, a infiltração) e chamar a responsabilidade técnica.
 *   ENFERMAGEM     a ESCALA (diurno, noturno, dobras), a SOBRECARGA que se acumula de um ano para o outro, a triagem
 *                  (o protocolo ou o olho), o quase-erro de medicação (notificar ou calar), a prescrição duvidosa, a
 *                  família do paciente que não vai sair — e os plantões contados na carreira.
 *   CONTABILIDADE  a CARTEIRA de clientes (enxuta, normal, cheia), o fechamento com os prazos fiscais, a nota fria no
 *                  meio dos papéis, o planejamento tributário (o legal e o agressivo, que volta como autuação), a malha
 *                  fina de um cliente; clientes ganhos e perdidos, multas.
 *   JORNALISMO     a LINHA de trabalho (agilidade, equilíbrio, investigação), as pautas do ano (publicar rápido, apurar
 *                  a fundo, descartar), a fonte com documentos, a pressão do anunciante — e a CREDIBILIDADE, que o furo
 *                  levanta e a correção derruba.
 *   PSICOLOGIA     os PACIENTES ficam de um ano para o outro (cada um com a demanda e a evolução dele): continuar,
 *                  intensificar, encaminhar, dar alta. A AGENDA (com supervisão, regular, cheia), o sigilo quando há
 *                  risco a alguém, os limites da relação terapêutica.
 *
 * Os feitos vão para a trajetória (e para a Linha da Vida quando importam); desempenho, estresse, dinheiro e reputação
 * são os de sempre.
 */
import type { Rng } from '../../rng';
import { clamp } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { anoDe } from '../../tempo';
import { marcar } from '../../sistemas/marcas';
import { habilidade, praticar } from '../../sistemas/frentes';
import { areaAtual } from '../../sistemas/areasDoOficio';
import type { Item16, Oficio16, SaidaOficio16 } from './oficios16';
import type { Ramo16 } from '../../dados16/oficios/catalogo16';

export const RAMOS_B: Ramo16[] = ['engenharia', 'enfermagem', 'contabilidade', 'jornalismo', 'psicologia'];
export const ehRamoB = (r: Ramo16) => RAMOS_B.includes(r);

/* ------------------------------------------------------------------ O plano do ano (uma escolha por ramo) */

export interface PlanoB { id: string; nome: string; texto: string }
export const PLANOS_B: Record<string, { pergunta: string; feita: string; opcoes: PlanoB[] }> = {
  engenharia: { pergunta: 'Qual o padrão de execução este ano?', feita: 'Padrão do ano', opcoes: [
    { id: 'economia', nome: 'Enxugar custo e prazo', texto: 'Material mais barato, menos folga na estrutura. A obra sai mais rápido — e guarda risco.' },
    { id: 'norma', nome: 'Seguir a norma à risca', texto: 'O que as normas técnicas pedem, nem mais nem menos.' },
    { id: 'reforco', nome: 'Reforçar onde importa', texto: 'Margem de segurança acima do mínimo. Custa mais, demora mais, dura mais.' }] },
  enfermagem: { pergunta: 'Qual a sua escala este ano?', feita: 'Escala do ano', opcoes: [
    { id: 'diurno', nome: 'Plantão diurno (12×36)', texto: 'O ritmo de sempre: dia sim, dia não.' },
    { id: 'noturno', nome: 'Plantão noturno', texto: 'O adicional noturno ajuda no salário; o sono, não.' },
    { id: 'dobras', nome: 'Pegar dobras', texto: 'Plantões extras quase toda semana: dinheiro a mais, corpo e cabeça no limite.' }] },
  contabilidade: { pergunta: 'Quantos clientes atender este ano?', feita: 'Carteira do ano', opcoes: [
    { id: 'enxuta', nome: 'Carteira enxuta', texto: 'Menos clientes, mais tempo para cada um. Menos honorário.' },
    { id: 'normal', nome: 'A carteira de sempre', texto: 'O que dá para fazer bem.' },
    { id: 'cheia', nome: 'Aceitar todo mundo', texto: 'Mais honorários — e os prazos fiscais apertando no mesmo mês.' }] },
  jornalismo: { pergunta: 'Que jornalismo fazer este ano?', feita: 'Linha do ano', opcoes: [
    { id: 'agilidade', nome: 'Rapidez e audiência', texto: 'Dar primeiro, com cliques. A checagem fica mais curta.' },
    { id: 'equilibrio', nome: 'O dia a dia bem feito', texto: 'Apurar o necessário, publicar no tempo da notícia.' },
    { id: 'investigacao', nome: 'Investigação', texto: 'Poucas matérias, meses de apuração. Pode virar a reportagem do ano — ou um processo.' }] },
  psicologia: { pergunta: 'Como organizar a agenda este ano?', feita: 'Agenda do ano', opcoes: [
    { id: 'supervisao', nome: 'Agenda menor, com supervisão', texto: 'Menos pacientes e a supervisão clínica paga do bolso: o trabalho melhora.' },
    { id: 'regular', nome: 'Agenda regular', texto: 'Os pacientes que cabem na semana.' },
    { id: 'cheia', nome: 'Agenda cheia', texto: 'Mais renda, menos tempo para pensar cada caso — e o cansaço aparece.' }] }
};

export function disponibilidadePlanoB(p: Oficio16, v: Vida, escolha: string): Veredito {
  const pl = PLANOS_B[p.ramo];
  if (!pl?.opcoes.some(o => o.id === escolha)) return bloqueio('impossivel', 'Não é o seu ofício.');
  if (p.plano && v.oficio16?.ano === anoDe(v.t)) return p.plano === escolha ? bloqueio('incompativel', 'É o plano deste ano.') : bloqueio('incompativel', 'O plano do ano já está combinado.');
  return PERMITIDO;
}

/* ------------------------------------------------------------------ Os catálogos */

const OBRAS: Record<string, { titulo: string; texto: string; forca: number }[]> = {
  estruturas: [{ titulo: 'O edifício de doze andares', texto: 'O cálculo estrutural de um residencial no centro: fundações, pilares, lajes.', forca: 70 }, { titulo: 'A passarela sobre a avenida', texto: 'Uma passarela de pedestres sobre oito faixas, com a avenida aberta.', forca: 75 }],
  'gestão de obras': [{ titulo: 'O condomínio de casas', texto: 'Quarenta casas, três equipes terceirizadas, um cronograma apertado.', forca: 60 }, { titulo: 'A reforma do hospital', texto: 'Reformar uma ala inteira com o hospital funcionando ao lado.', forca: 70 }],
  projetos: [{ titulo: 'O galpão logístico', texto: 'O projeto de um galpão de 20 mil m², com a estrutura metálica e a drenagem.', forca: 55 }, { titulo: 'A escola municipal', texto: 'O projeto de uma escola pública, com o orçamento contado.', forca: 50 }],
  'manutenção industrial': [{ titulo: 'A parada de manutenção', texto: 'Duas semanas com a fábrica parada para revisar as caldeiras e as linhas.', forca: 65 }, { titulo: 'A linha de produção nova', texto: 'Instalar e pôr para rodar uma linha de produção importada.', forca: 70 }]
};
const IMPREVISTOS = [
  { titulo: 'O solo', texto: 'A sondagem mentiu: o solo é mais fraco do que o projeto previu.' },
  { titulo: 'A chuva', texto: 'Três semanas de chuva sem parar. O cronograma foi junto.' },
  { titulo: 'O fornecedor', texto: 'O aço chegou fora da especificação — e o próximo lote demora dois meses.' },
  { titulo: 'O erro de projeto', texto: 'Na execução, aparece um erro de compatibilização: a tubulação passa onde vai uma viga.' }
];
const NOMES_P = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Heitor', 'Iara', 'João', 'Lia', 'Marcos', 'Nina', 'Otávio', 'Paula', 'Rafa', 'Sofia', 'Téo', 'Vera'];
const DEMANDAS: Record<string, { demanda: string; texto: string; gravidade: number }[]> = {
  geral: [{ demanda: 'ansiedade', texto: 'crises de ansiedade antes do trabalho', gravidade: 40 }, { demanda: 'luto', texto: 'o luto pela mãe, um ano depois', gravidade: 45 }, { demanda: 'depressao', texto: 'uma tristeza que não passa há meses', gravidade: 60 }, { demanda: 'relacionamento', texto: 'um casamento que acabou e a guarda dos filhos', gravidade: 40 }, { demanda: 'autoestima', texto: 'a sensação de nunca ser suficiente', gravidade: 30 }],
  'crianças e adolescentes': [{ demanda: 'escola', texto: 'um menino de 9 anos que não quer mais ir à escola', gravidade: 40 }, { demanda: 'adolescencia', texto: 'uma adolescente que parou de comer direito', gravidade: 65 }],
  'casais e famílias': [{ demanda: 'casal', texto: 'um casal que só conversa brigando', gravidade: 40 }, { demanda: 'familia', texto: 'uma família depois de uma falência', gravidade: 45 }],
  'trabalho e carreira': [{ demanda: 'burnout', texto: 'um esgotamento depois de dez anos sem férias', gravidade: 50 }, { demanda: 'carreira', texto: 'a dúvida de largar tudo aos 40', gravidade: 30 }],
  luto: [{ demanda: 'luto', texto: 'a perda de um filho', gravidade: 75 }, { demanda: 'luto', texto: 'a viuvez depois de 40 anos de casamento', gravidade: 55 }]
};
const PAUTAS: Record<string, { titulo: string; texto: string; impacto: number }[]> = {
  política: [{ titulo: 'O contrato da prefeitura', texto: 'Um contrato de limpeza urbana com preço três vezes acima do mercado.', impacto: 80 }, { titulo: 'A votação na Câmara', texto: 'O que mudou de última hora no projeto votado de madrugada.', impacto: 55 }],
  economia: [{ titulo: 'O fechamento da fábrica', texto: 'A maior fábrica da cidade vai demitir — e ainda não contou a ninguém.', impacto: 70 }, { titulo: 'O preço do aluguel', texto: 'Por que o aluguel subiu o dobro da inflação no bairro.', impacto: 45 }],
  cultura: [{ titulo: 'O teatro fechado', texto: 'O teatro centenário fechou, e o prédio foi vendido sem ninguém saber para quem.', impacto: 50 }, { titulo: 'O artista esquecido', texto: 'O compositor de sucessos que vive hoje num asilo da cidade.', impacto: 40 }],
  esporte: [{ titulo: 'A manipulação de resultados', texto: 'Apostas estranhas em jogos da segunda divisão.', impacto: 75 }, { titulo: 'A base do clube', texto: 'Os garotos da base que moram num alojamento sem condições.', impacto: 55 }]
};

/* ------------------------------------------------------------------ A pasta do ano */

const op = (escolha: string, rotulo: string) => ({ escolha, rotulo });
const ANO = (v: Vida) => anoDe(v.t);
const porConta = (v: Vida) => ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '')?.contrato === 'autonomo';

export function novaPastaB(v: Vida, r: Rng, base: Oficio16, antes?: Oficio16): void {
  const id = (k: string) => `o16b_${ANO(v)}_${k}`;
  const nivel = ocupacaoOuNula(v.trabalho.atual!.ocupacaoId)?.nivel ?? 3;
  switch (base.ramo) {
    case 'engenharia': {
      base.obras = antes?.obras ?? [];
      const trilha = ocupacaoOuNula(v.trabalho.atual!.ocupacaoId)?.trilha;
      const area = areaAtual(v, 'engenharia') ?? (trilha === 'eng_industrial' ? 'manutenção industrial' : r.pick(['estruturas', 'gestão de obras', 'projetos']));
      const o = r.pick(OBRAS[area] ?? OBRAS.projetos);
      base.itens.push({ id: id('obra'), tipo: 'obra', titulo: o.titulo, texto: o.texto, estado: 'andamento', forca: o.forca + r.int(-8, 8), valor: Math.round(r.int(nivel >= 5 ? 8 : 1, nivel >= 5 ? 60 : 12) * 100000) });
      if (r.chance(0.6)) { const im = r.pick(IMPREVISTOS); base.itens.push({ id: id('imp'), tipo: 'imprevisto', titulo: im.titulo, texto: im.texto, estado: 'aberto', opcoes: [op('aditivo', 'Parar e pedir aditivo de prazo e verba'), op('improvisar', 'Improvisar uma solução e seguir'), op('refazer', 'Refazer o trecho do jeito certo')] }); }
      if (r.chance(0.25)) base.itens.push({ id: id('art'), tipo: 'dilema', titulo: 'A ART', texto: 'Um conhecido pede para você assinar a responsabilidade técnica de uma obra que você não vai acompanhar. Paga bem.', estado: 'aberto', opcoes: [op('recusar', 'Recusar: quem assina responde'), op('assinar', 'Assinar')] });
      // A obra antiga que dá sinal: o risco latente cobra (uma por ano, no máximo).
      const velha = (antes?.obras ?? []).find(x => !x.patologia && x.risco >= 45 && v.t - x.t >= 24);
      if (velha && r.chance(velha.risco / 160)) {
        velha.patologia = true;
        base.itens.push({ id: id('pat'), tipo: 'patologia', titulo: `${velha.nome}: rachaduras`, texto: `${ANO(v) - anoDe(velha.t)} anos depois da entrega, ${velha.nome.toLowerCase()} apareceu com rachaduras e infiltração. O condomínio quer saber de quem é a responsabilidade.`, estado: 'aberto', opcoes: [op('assumir', 'Assumir, fazer o laudo e corrigir'), op('contestar', 'Contestar: foi falta de manutenção')] });
      }
      break;
    }
    case 'enfermagem': {
      base.sobrecarga = antes?.sobrecarga ?? 30;
      base.plantoes = antes?.plantoes ?? 0;
      const uti = areaAtual(v, 'enfermagem') === 'terapia intensiva';
      const pool: Item16[] = [
        { id: id('tri'), tipo: 'plantao', titulo: 'A triagem', texto: `Plantão cheio. Chegam juntos um senhor de 70 anos com dor no peito "que já passou" e uma criança com 40 °C de febre e a mãe aos gritos.`, estado: 'aberto', opcoes: [op('protocolo', 'Seguir a classificação de risco à risca'), op('olho', 'Ir pelo olho: atender a criança primeiro'), op('medico', 'Chamar o médico antes de decidir')] },
        { id: id('med'), tipo: 'plantao', titulo: 'O quase-erro', texto: 'Você percebe, a tempo, que a dose preparada no turno anterior estava dez vezes acima da prescrita. Ninguém mais viu.', estado: 'aberto', opcoes: [op('notificar', 'Notificar o evento, sem caça às bruxas'), op('calar', 'Corrigir em silêncio e seguir')] },
        { id: id('pre'), tipo: 'plantao', titulo: 'A prescrição', texto: 'A prescrição de um médico novo parece errada: o remédio interage com o que o paciente já toma.', estado: 'aberto', opcoes: [op('questionar', 'Questionar o médico antes de administrar'), op('administrar', 'Administrar: a prescrição é dele')] },
        { id: id('fam'), tipo: 'plantao', titulo: 'A família', texto: `A família de um paciente ${uti ? 'da UTI' : 'internado'}, que não vai sair, pergunta a você o que o médico não disse com clareza.`, estado: 'aberto', opcoes: [op('acolher', 'Acolher e chamar o médico para uma conversa honesta'), op('encaminhar', 'Dizer que só o médico pode falar')] },
        { id: id('esc'), tipo: 'plantao', titulo: 'A escala furada', texto: 'Duas colegas faltaram. A chefia pergunta se você fica para a noite.', estado: 'aberto', opcoes: [op('ficar', 'Ficar mais doze horas'), op('nao', 'Dizer que não dá: você está no limite')] }
      ];
      for (const it of [...pool].sort(() => r.next() - 0.5).slice(0, r.int(2, 3))) base.itens.push(it);
      break;
    }
    case 'contabilidade': {
      base.carteira = antes?.carteira ?? { clientes: porConta(v) ? 12 : 8, perdidos: 0, multas: 0 };
      base.itens.push({ id: id('fech'), tipo: 'fechamento', titulo: 'O fechamento do ano', texto: `${base.carteira.clientes} clientes: balanços, a declaração das empresas, o imposto de renda dos sócios, a folha.`, estado: 'andamento' });
      const pool: Item16[] = [
        { id: id('nf'), tipo: 'dilema', titulo: 'A nota fria', texto: 'No meio dos papéis de um cliente, notas de serviço de uma empresa que não existe. É caixa dois.', estado: 'aberto', opcoes: [op('orientar', 'Orientar a regularizar, por escrito'), op('omitir', 'Lançar como veio e não perguntar'), op('renunciar', 'Deixar de atender o cliente')] },
        { id: id('plan'), tipo: 'dilema', titulo: 'O planejamento tributário', texto: 'Um cliente quer pagar menos imposto. Há o caminho legal (mudar o regime, reorganizar) e o agressivo, que a Receita costuma questionar.', estado: 'aberto', opcoes: [op('legal', 'Fazer o planejamento legal'), op('agressivo', 'Montar a operação agressiva')] },
        { id: id('malha'), tipo: 'dilema', titulo: 'A malha fina', texto: 'A declaração de um cliente caiu na malha fina: despesas médicas sem comprovante.', estado: 'aberto', opcoes: [op('defender', 'Juntar documentos e defender'), op('retificar', 'Retificar e pagar a diferença')] }
      ];
      for (const it of [...pool].sort(() => r.next() - 0.5).slice(0, r.int(1, 2))) base.itens.push(it);
      break;
    }
    case 'jornalismo': {
      base.credibilidade = antes?.credibilidade ?? 50;
      base.fontes = antes?.fontes ?? 0;
      const area = areaAtual(v, 'comunicacao') ?? r.pick(['política', 'economia', 'cultura', 'esporte']);
      const lista = [...(PAUTAS[area] ?? PAUTAS.política), ...PAUTAS[r.pick(Object.keys(PAUTAS))]].filter((x, k, a) => a.findIndex(y => y.titulo === x.titulo) === k);
      for (const [k, pa] of lista.slice(0, 2).entries()) base.itens.push({ id: id(`p${k}`), tipo: 'pauta', titulo: pa.titulo, texto: pa.texto, estado: 'aberto', forca: pa.impacto, opcoes: [op('rapido', 'Publicar logo, com o que tem'), op('apurar', 'Apurar a fundo antes'), op('descartar', 'Deixar a pauta')] });
      if (r.chance(0.4)) base.itens.push({ id: id('fonte'), tipo: 'dilema', titulo: 'A fonte', texto: 'Uma fonte anônima entrega documentos explosivos. Ela pede que nada a identifique.', estado: 'aberto', opcoes: [op('checar', 'Checar com outras duas fontes antes'), op('publicar', 'Publicar os documentos como vieram'), op('recusar', 'Não usar: não dá para verificar')] });
      if (r.chance(0.3)) base.itens.push({ id: id('anun'), tipo: 'dilema', titulo: 'O anunciante', texto: 'O maior anunciante do veículo está na sua próxima matéria — e o comercial pediu "sensibilidade".', estado: 'aberto', opcoes: [op('manter', 'Manter a matéria como está'), op('suavizar', 'Suavizar o texto')] });
      break;
    }
    case 'psicologia': {
      // Os pacientes ficam: quem estava em acompanhamento continua (com a evolução dele); chegam os novos.
      const pacientes = (antes?.pacientes ?? []).filter(x => x.estado === 'ativo').map(x => ({ ...x }));
      const area = areaAtual(v, 'psicologia');
      const novos = Math.max(0, (antes?.plano === 'cheia' ? 5 : 3) - pacientes.length) + (r.chance(0.5) ? 1 : 0);
      for (let k = 0; k < Math.min(3, novos); k++) {
        const d = r.pick([...(DEMANDAS[area ?? ''] ?? []), ...DEMANDAS.geral]);
        pacientes.push({ id: `pc${ANO(v)}${k}`, nome: r.pick(NOMES_P), demanda: d.demanda, texto: d.texto, gravidade: d.gravidade, evolucao: r.int(10, 25), t: v.t, estado: 'ativo' });
      }
      base.pacientes = [...(antes?.pacientes ?? []).filter(x => x.estado !== 'ativo').slice(-20), ...pacientes];
      base.altas = antes?.altas ?? 0;
      for (const pc of pacientes.slice(0, 5)) base.itens.push(itemDoPaciente(id(pc.id), pc));
      if (r.chance(0.25)) base.itens.push({ id: id('sig'), tipo: 'dilema', titulo: 'O sigilo', texto: 'Numa sessão, um paciente fala, com detalhes, em machucar alguém da família.', estado: 'aberto', opcoes: [op('quebrar', 'Quebrar o sigilo no limite que o código de ética prevê'), op('manter', 'Manter o sigilo e trabalhar na sessão')] });
      if (r.chance(0.25)) base.itens.push({ id: id('lim'), tipo: 'dilema', titulo: 'O limite', texto: 'Um paciente de anos convida você para o casamento dele — e traz um presente caro.', estado: 'aberto', opcoes: [op('recusar', 'Recusar com cuidado e conversar sobre isso na sessão'), op('aceitar', 'Aceitar: seria uma desfeita')] });
      break;
    }
  }
}

export interface Paciente16 { id: string; nome: string; demanda: string; texto: string; gravidade: number; evolucao: number; t: number; estado: 'ativo' | 'alta' | 'abandono' | 'encaminhado'; intenso?: boolean }

function itemDoPaciente(id: string, pc: Paciente16): Item16 {
  const opcoes = [op('manter', 'Continuar o acompanhamento'), op('intensificar', 'Passar a sessões semanais'), op('encaminhar', 'Encaminhar à psiquiatria')];
  if (pc.evolucao >= 65) opcoes.push(op('alta', 'Combinar a alta'));
  return { id, tipo: 'paciente', titulo: pc.nome, texto: `Em acompanhamento por ${pc.texto}.`, estado: 'aberto', nome: pc.nome, forca: pc.evolucao, ref: pc.id, opcoes };
}

/* ------------------------------------------------------------------ As decisões */

const desemp = (v: Vida, n: number) => { const e = v.trabalho.atual; if (e) e.desempenho = clamp(Math.round(e.desempenho + n)); };
const cansar = (v: Vida, n: number) => { v.mente.estresse = clamp(Math.round(v.mente.estresse + n)); };
const rep = (p: Oficio16, n: number) => { p.rep = clamp(Math.round(p.rep + n)); };
const feito = (v: Vida, p: Oficio16, texto: string, bom: boolean, biografia = false) => {
  p.feitos.push({ t: v.t, texto, bom });
  if (p.feitos.length > 30) p.feitos.splice(0, p.feitos.length - 30);
  if (biografia) escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true });
};

export function decidirB(v: Vida, r: Rng, p: Oficio16, it: Item16, escolha: string): SaidaOficio16 {
  it.escolha = escolha;
  it.estado = 'resolvido';
  const fim = (texto: string, bom: boolean | undefined, tom: SaidaOficio16['tom'] = bom ? 'bom' : bom === false ? 'ruim' : 'neutro'): SaidaOficio16 => { it.resultado = texto; it.bom = bom; return { texto, tom }; };
  const obra = p.itens.find(x => x.tipo === 'obra');
  switch (p.ramo) {
    case 'engenharia':
      if (it.tipo === 'imprevisto') {
        if (escolha === 'aditivo') { rep(p, -1); desemp(v, -2); if (obra) obra.preparo = true; return fim('O aditivo saiu depois de muita reunião. A obra atrasou, mas ninguém improvisou nada.', true, 'neutro'); }
        if (escolha === 'improvisar') { desemp(v, 3); if (obra) obra.latente = (obra.latente ?? 0) + 20; return fim('Uma solução de campo resolveu na hora. Não está em norma nenhuma.', undefined); }
        cansar(v, 5); rep(p, 3); praticar(v, r, 'exatas', 0.8); if (obra) obra.forca = clamp((obra.forca ?? 60) - 10);
        return fim('Refeito do jeito certo. Custou semanas e uma conversa dura com o cliente.', true);
      }
      if (it.tipo === 'patologia') {
        const o = (p.obras ?? []).find(x => it.titulo.startsWith(x.nome));
        if (escolha === 'assumir') { rep(p, -2); cansar(v, 6); if (porConta(v)) v.financas.conta -= 15000; feito(v, p, `Assumiu a correção de ${o?.nome.toLowerCase() ?? 'uma obra antiga'}.`, true, true); return fim('O laudo apontou o que já se sabia. A correção saiu — e o nome ficou de pé.', true, 'neutro'); }
        if (r.chance(0.5)) { rep(p, -10); desemp(v, -8); cansar(v, 10); v.fatos['crea16_processo'] = v.t; feito(v, p, 'Respondeu a um processo ético no conselho de engenharia.', false, true); marcar(v, 'fracasso', 'Respondeu a um processo no conselho de engenharia por uma obra antiga.', 2, { trilha: 'engenharia' }); return fim('A perícia apontou falha de execução. O condomínio foi à Justiça e ao conselho.', false); }
        return fim('A perícia concluiu: faltou manutenção. Desta vez.', undefined);
      }
      if (escolha === 'recusar') { rep(p, 2); return fim('Você recusou. Quem assina responde pela obra inteira.', true, 'neutro'); }
      v.financas.conta += 6000;
      if (r.chance(0.35)) { rep(p, -12); desemp(v, -6); v.fatos['crea16_processo'] = v.t; feito(v, p, 'A obra que você assinou sem acompanhar deu problema.', false, true); return fim('A obra deu problema — e o nome na ART era o seu.', false); }
      return fim('Assinou. A obra terminou sem você ver um tijolo.', undefined);
    case 'enfermagem': {
      p.plantoes = (p.plantoes ?? 0);
      if (it.titulo === 'A triagem') {
        if (escolha === 'protocolo') { rep(p, 3); praticar(v, r, 'ciencias', 0.6); return fim('A classificação mandou o senhor primeiro: era um infarto. A criança foi atendida minutos depois, bem.', true); }
        if (escolha === 'medico') { rep(p, 1); return fim('O médico veio e decidiu. Demorou o suficiente para todo mundo ficar nervoso.', undefined); }
        if (r.chance(0.45)) { rep(p, -4); cansar(v, 6); return fim('A dor no peito era um infarto. O senhor esperou mais do que devia — sobreviveu, por pouco.', false); }
        return fim('A criança foi atendida logo; o senhor também, a tempo.', undefined);
      }
      if (it.titulo === 'O quase-erro') {
        if (escolha === 'notificar') { rep(p, 3); p.seguranca = (p.seguranca ?? 0) + 1; return fim('A notificação virou mudança no protocolo de dupla checagem. A colega agradeceu — depois.', true); }
        if (r.chance(0.25)) { rep(p, -8); desemp(v, -6); return fim('Outro erro igual aconteceu meses depois, e a auditoria achou o primeiro. Perguntaram por que ninguém notificou.', false); }
        return fim('Ninguém soube. O protocolo continuou igual.', undefined);
      }
      if (it.titulo === 'A prescrição') {
        if (escolha === 'questionar') { rep(p, 4); desemp(v, 2); return fim('O médico conferiu e trocou o remédio. Na passagem de plantão, agradeceu na frente de todo mundo.', true); }
        if (r.chance(0.4)) { rep(p, -6); cansar(v, 8); return fim('O paciente teve uma reação grave. A administração também era sua responsabilidade.', false); }
        return fim('Nada aconteceu — desta vez.', undefined);
      }
      if (it.titulo === 'A família') {
        if (escolha === 'acolher') { cansar(v, 5); rep(p, 3); v.mente.felicidade = clamp(v.mente.felicidade + 2); feito(v, p, 'Uma família mandou uma carta para a direção, com o seu nome.', true); return fim('A conversa foi difícil e foi honesta. A família agradeceu por não ter ficado no escuro.', true); }
        return fim('O médico falou no dia seguinte. A família passou a noite sem saber.', undefined);
      }
      if (escolha === 'ficar') { p.sobrecarga = clamp((p.sobrecarga ?? 30) + 10); p.plantoes = (p.plantoes ?? 0) + 6; v.financas.conta += 900; desemp(v, 3); return fim('Mais doze horas. O plantão fechou — e você também, de cansaço.', undefined); }
      p.sobrecarga = clamp((p.sobrecarga ?? 30) - 4);
      return fim('A chefia não gostou. Você dormiu.', undefined);
    }
    case 'contabilidade': {
      const c = p.carteira!;
      if (it.titulo === 'A nota fria') {
        if (escolha === 'orientar') { rep(p, 3); if (r.chance(0.35)) { c.clientes = Math.max(1, c.clientes - 1); c.perdidos++; return fim('O cliente achou que você estava complicando e foi procurar outro contador.', true, 'neutro'); } return fim('O cliente regularizou, resmungando. Ficou com você.', true); }
        if (escolha === 'renunciar') { c.clientes = Math.max(1, c.clientes - 1); c.perdidos++; rep(p, 1); return fim('Você deixou de atender o cliente, com a carta de renúncia registrada.', true, 'neutro'); }
        if (r.chance(0.3)) { rep(p, -14); desemp(v, -8); v.fatos['crc16_processo'] = v.t; feito(v, p, 'Respondeu no conselho de contabilidade por notas frias de um cliente.', false, true); return fim('Uma fiscalização chegou às notas. O conselho de contabilidade abriu processo contra você também.', false); }
        return fim('Ninguém perguntou. Os papéis ficaram lá.', undefined);
      }
      if (it.titulo === 'O planejamento tributário') {
        if (escolha === 'legal') { rep(p, 3); if (porConta(v)) v.financas.conta += 4000; praticar(v, r, 'exatas', 0.6); return fim('Mudar o regime economizou ao cliente quase um quinto do imposto. Ele indicou dois amigos.', true); }
        if (porConta(v)) v.financas.conta += 12000;
        (p.carteira!).agressivo = v.t;
        return fim('A operação foi montada. O cliente pagou bem — e a Receita tem cinco anos para olhar.', undefined);
      }
      if (escolha === 'defender') { const ok = r.chance(0.5 + habilidade(v, 'exatas') / 300); rep(p, ok ? 3 : -2); return fim(ok ? 'Os recibos apareceram; a malha foi resolvida sem multa.' : 'Sem comprovante, não teve jeito: a diferença com multa.', ok); }
      return fim('Retificado. A diferença saiu sem multa de ofício.', true, 'neutro');
    }
    case 'jornalismo': {
      if (it.tipo === 'pauta') {
        if (escolha === 'descartar') return fim('A pauta ficou na gaveta.', undefined);
        it.preparo = escolha === 'apurar';
        it.estado = 'andamento';
        if (escolha === 'apurar') cansar(v, 4);
        it.resultado = escolha === 'apurar' ? 'Em apuração: documentos, entrevistas, a versão do outro lado. Sai antes do fim do ano.' : 'Publicada com o que havia. A repercussão vem.';
        return { texto: it.resultado, tom: 'neutro' };
      }
      if (it.titulo === 'A fonte') {
        if (escolha === 'checar') { p.fontes = (p.fontes ?? 0) + 1; p.credibilidade = clamp((p.credibilidade ?? 50) + 3); return fim('Duas fontes confirmaram o essencial. A matéria saiu sólida, e a fonte voltou a procurar você.', true); }
        if (escolha === 'recusar') return fim('Você não usou os documentos. Outro veículo usou.', undefined);
        if (r.chance(0.4)) { p.credibilidade = clamp((p.credibilidade ?? 50) - 15); rep(p, -8); feito(v, p, 'Publicou documentos que não se confirmaram e teve de corrigir.', false, true); return fim('Parte dos documentos era falsa. A correção saiu na capa.', false); }
        p.credibilidade = clamp((p.credibilidade ?? 50) + 2); desemp(v, 5);
        return fim('Os documentos eram verdadeiros. Foi a matéria mais lida da semana.', true);
      }
      if (escolha === 'manter') { p.credibilidade = clamp((p.credibilidade ?? 50) + 4); desemp(v, -2); return fim('A matéria saiu inteira. O comercial não falou com você por um mês.', true); }
      p.credibilidade = clamp((p.credibilidade ?? 50) - 5);
      return fim('O texto ficou mais macio. Os leitores perceberam antes da redação.', false);
    }
    case 'psicologia': {
      if (it.tipo === 'paciente') {
        const pc = (p.pacientes ?? []).find(x => x.id === it.ref);
        if (!pc) return fim('', undefined);
        if (escolha === 'alta') { pc.estado = 'alta'; p.altas = (p.altas ?? 0) + 1; rep(p, 2); feito(v, p, `${pc.nome} teve alta, depois de ${Math.max(1, Math.round((v.t - pc.t) / 12))} ano(s) de acompanhamento.`, true); return fim(`A última sessão de ${pc.nome} foi sobre o que vem depois.`, true); }
        if (escolha === 'encaminhar') { pc.estado = pc.gravidade >= 55 ? 'encaminhado' : pc.estado; if (pc.gravidade >= 55) { pc.evolucao = clamp(pc.evolucao + 10); rep(p, 2); return fim(`${pc.nome} começou o tratamento com a psiquiatria e segue com você também.`, true); } rep(p, -1); return fim(`O psiquiatra devolveu: não era caso de remédio. ${pc.nome} ficou confus${pc.nome.endsWith('a') ? 'a' : 'o'}.`, false); }
        if (escolha === 'intensificar') { pc.intenso = true; cansar(v, 2); }
        it.estado = 'andamento';
        it.resultado = escolha === 'intensificar' ? 'Sessões semanais a partir de agora.' : 'O acompanhamento segue.';
        return { texto: it.resultado, tom: 'neutro' };
      }
      if (it.titulo === 'O sigilo') {
        if (escolha === 'quebrar') { rep(p, 3); cansar(v, 6); feito(v, p, 'Quebrou o sigilo, no limite do código de ética, para proteger alguém.', true, true); return fim('Você comunicou o risco a quem precisava saber, só o necessário. A pessoa em risco foi protegida — e o paciente voltou na semana seguinte.', true); }
        if (r.chance(0.2)) { rep(p, -12); cansar(v, 12); feito(v, p, 'Uma tragédia que você poderia ter ajudado a evitar.', false, true); return fim('Semanas depois, a notícia. O conselho perguntou o que foi dito nas sessões.', false); }
        return fim('O trabalho na sessão segurou a crise. Por enquanto.', undefined);
      }
      if (escolha === 'recusar') { rep(p, 2); return fim('Vocês conversaram sobre o convite na sessão. Foi das sessões que mais renderam.', true); }
      if (r.chance(0.3)) { rep(p, -8); return fim('A relação terapêutica se confundiu, e o acompanhamento acabou mal.', false); }
      return fim('Você foi. Na sessão seguinte, algo tinha mudado — e não para melhor.', undefined);
    }
  }
  return fim('', undefined);
}

/* ------------------------------------------------------------------ O fim do ano */

export function fimB(v: Vida, r: Rng, p: Oficio16): void {
  const pl = p.plano;
  switch (p.ramo) {
    case 'engenharia': {
      const o = p.itens.find(x => x.tipo === 'obra');
      if (!o || !pl) return;
      const latente = o.latente ?? 0;
      const chance = clamp(0.5 + (pl === 'economia' ? 0.18 : pl === 'reforco' ? -0.08 : 0.06) + habilidade(v, 'exatas') / 300 + p.rep / 400 - (o.forca ?? 60) / 400 + (o.preparo ? 0.05 : 0), 0.15, 0.9);
      const ok = r.chance(chance);
      o.estado = 'resolvido'; o.bom = ok;
      const risco = clamp((pl === 'economia' ? 55 : pl === 'reforco' ? 10 : 25) + latente + r.int(-8, 8));
      (p.obras ??= []).push({ nome: o.titulo, t: v.t, padrao: pl, risco });
      if (p.obras.length > 14) p.obras.splice(0, p.obras.length - 14);
      if (pl === 'reforco') cansar(v, 2);
      if (ok) { rep(p, 4); desemp(v, 6); o.resultado = pl === 'economia' ? 'Entregue antes do prazo e abaixo do orçamento.' : 'Entregue no prazo, vistoria aprovada.'; feito(v, p, `${o.titulo}: entregue.`, true, (o.forca ?? 0) >= 70); if ((o.forca ?? 0) >= 70) marcar(v, 'destaque', `Entregou ${o.titulo.toLowerCase()}.`, 2, { trilha: 'engenharia' }); }
      else { rep(p, -3); desemp(v, -5); o.resultado = 'Atrasou e estourou o orçamento. O cliente reteve parte do pagamento.'; feito(v, p, `${o.titulo}: atrasou.`, false); }
      return;
    }
    case 'enfermagem': {
      const base = pl === 'dobras' ? 160 : 120;
      p.plantoes = (p.plantoes ?? 0) + base;
      const delta = pl === 'dobras' ? 18 : pl === 'noturno' ? 8 : -6;
      p.sobrecarga = clamp((p.sobrecarga ?? 30) + delta);
      if (pl === 'dobras') v.financas.conta += Math.round((v.trabalho.atual?.salario ?? 3000) * 3);
      if (pl === 'noturno') v.financas.conta += Math.round((v.trabalho.atual?.salario ?? 3000) * 1.2);
      if (pl) cansar(v, Math.round(delta / 3));
      if ((p.sobrecarga ?? 0) >= 80 && v.fatos[`enf16_burnout_${anoDe(v.t)}`] === undefined) {
        v.fatos[`enf16_burnout_${anoDe(v.t)}`] = v.t;
        cansar(v, 12); desemp(v, -6); p.sobrecarga = 55;
        feito(v, p, 'Precisou de afastamento: o corpo pediu o que a escala não deixava.', false, true);
      }
      const mil = Math.floor((p.plantoes ?? 0) / 1000);
      if (mil >= 1 && v.fatos[`enf16_mil_${mil}`] === undefined) { v.fatos[`enf16_mil_${mil}`] = v.t; feito(v, p, `${mil * 1000} plantões na carreira.`, true, true); }
      return;
    }
    case 'contabilidade': {
      const c = p.carteira!;
      const f = p.itens.find(x => x.tipo === 'fechamento');
      if (!f || !pl) return;
      const alvo = pl === 'cheia' ? c.clientes + 4 : pl === 'enxuta' ? Math.max(4, c.clientes - 2) : c.clientes + 1;
      const risco = clamp((pl === 'cheia' ? 0.4 : pl === 'enxuta' ? 0.05 : 0.15) - habilidade(v, 'exatas') / 500, 0.02, 0.6);
      const perdeu = r.chance(risco);
      f.estado = 'resolvido'; f.bom = !perdeu;
      if (perdeu) { c.multas++; c.perdidos++; rep(p, -4); desemp(v, -4); f.resultado = 'Um prazo fiscal passou no meio da correria. A multa foi para o cliente — e o cliente foi embora.'; feito(v, p, 'Perdeu um prazo fiscal.', false); c.clientes = Math.max(3, alvo - 1); }
      else { rep(p, 2); desemp(v, 3); f.resultado = 'Todas as obrigações entregues no prazo.'; c.clientes = alvo; }
      if (porConta(v)) v.financas.conta += c.clientes * 2400;
      if (pl === 'cheia') cansar(v, 8);
      // O planejamento agressivo pode voltar como autuação (em até cinco anos).
      if (c.agressivo && v.t - c.agressivo <= 60 && r.chance(0.2)) { c.agressivo = undefined; c.clientes = Math.max(3, c.clientes - 1); c.perdidos++; rep(p, -8); feito(v, p, 'A Receita autuou uma operação que você montou.', false, true); }
      if (c.clientes >= 30 && v.fatos['cont16_trinta'] === undefined) { v.fatos['cont16_trinta'] = v.t; feito(v, p, 'Trinta clientes na carteira.', true, true); }
      return;
    }
    case 'jornalismo': {
      for (const it of p.itens) {
        if (it.tipo !== 'pauta' || it.estado !== 'andamento') continue;
        it.estado = 'resolvido';
        const fundo = !!it.preparo;
        const inv = pl === 'investigacao';
        const erro = r.chance(clamp((fundo ? 0.05 : pl === 'agilidade' ? 0.3 : 0.15) - (p.credibilidade ?? 50) / 1000, 0.02, 0.5));
        if (erro) { p.credibilidade = clamp((p.credibilidade ?? 50) - 10); rep(p, -4); it.bom = false; it.resultado = 'Um dado estava errado. A correção saiu — e a outra parte ameaçou processar.'; feito(v, p, `${it.titulo}: precisou de correção.`, false); if (r.chance(0.3)) { cansar(v, 8); feito(v, p, 'Processado por danos morais por uma matéria.', false, true); } continue; }
        const repercute = r.chance(clamp((it.forca ?? 50) / 140 + (fundo ? 0.2 : 0) + (inv ? 0.15 : 0), 0.05, 0.85));
        it.bom = true;
        if (repercute) {
          p.credibilidade = clamp((p.credibilidade ?? 50) + (fundo ? 8 : 3)); rep(p, 5); desemp(v, 6);
          it.resultado = fundo ? 'A reportagem repercutiu: o caso foi parar no Ministério Público.' : 'Repercutiu — mais pela velocidade do que pela profundidade.';
          feito(v, p, `${it.titulo}: a reportagem repercutiu.`, true, fundo && (it.forca ?? 0) >= 70);
          if (fundo && inv && (it.forca ?? 0) >= 70 && r.chance(0.3)) { feito(v, p, `Ganhou um prêmio de jornalismo com "${it.titulo}".`, true, true); marcar(v, 'conquista', `Prêmio de jornalismo por "${it.titulo}".`, 3, { trilha: 'comunicacao' }); }
        } else { desemp(v, 1); it.resultado = 'Saiu, foi lida, e a cidade seguiu.'; }
      }
      if (pl === 'agilidade') desemp(v, 3);
      if (pl === 'investigacao') cansar(v, 5);
      return;
    }
    case 'psicologia': {
      const sup = pl === 'supervisao';
      for (const pc of p.pacientes ?? []) {
        if (pc.estado !== 'ativo' && pc.estado !== 'encaminhado') continue;
        const ganho = 14 + (sup ? 8 : 0) + (pc.intenso ? 6 : 0) - (pl === 'cheia' ? 6 : 0) - (pc.gravidade - 45) / 6 + habilidade(v, 'humanas') / 25 + r.normal() * 6;
        pc.evolucao = clamp(Math.round(pc.evolucao + ganho));
        // Quem não evolui e perde o vínculo larga (o abandono acontece, e não diz tudo sobre o trabalho).
        if (ganho < 4 && r.chance(0.35)) { pc.estado = 'abandono'; feito(v, p, `${pc.nome} deixou de vir.`, false); }
        if (pc.estado === 'encaminhado') pc.estado = 'ativo';
      }
      if (sup) v.financas.conta -= 4800;
      if (porConta(v)) v.financas.conta += (p.pacientes ?? []).filter(x => x.estado === 'ativo').length * (pl === 'cheia' ? 9000 : 7000);
      if (pl === 'cheia') cansar(v, 7);
      rep(p, sup ? 3 : pl === 'cheia' ? -1 : 1);
      if ((p.altas ?? 0) >= 25 && v.fatos['psi16_altas'] === undefined) { v.fatos['psi16_altas'] = v.t; feito(v, p, 'Vinte e cinco altas: gente que saiu do consultório andando sozinha.', true, true); }
      return;
    }
  }
}
