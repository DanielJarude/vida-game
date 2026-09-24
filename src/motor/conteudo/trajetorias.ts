/**
 * Trajetórias: as decisões que dão forma aos caminhos novos (ilegalidade e
 * saída dela, prisão, cuidado, Forças Armadas, transformação do trabalho,
 * campo, formalização, serviço público, editais, segunda carreira).
 *
 * Tudo aqui é disparado por ESTADO (um fato marcado pelo sistema naquele
 * ano). O texto narra o mundo; a reação é do jogador. Nenhuma opção
 * descreve como se comete, se esconde ou se foge de coisa alguma.
 */

import type { Conteudo, Ctx, Resultado } from './base';
import type { CategoriaIlicita, Especialidade, Pessoa, Vida } from '../tipos';
import * as P from './papeis';
import { estresse, fato, feliz, prox, tensao } from './efeitos';
import { escrever, filhos, idade, idadePessoa, lembrarCom, marcarFato, parceiro, temFato, vinculosVivos } from '../nucleo';
import { CATEGORIAS, entrar, escalar, parar } from '../sistemas/ilicito';
import { mudarAgora, custoDeMudanca } from '../sistemas/processos';
import { disponivel, pagar } from '../sistemas/dinheiro';
import { encerrarPausa, iniciarPausa, podeReduzir } from '../sistemas/pausa';
import { escolherEspecialidade, fazerCurso, irParaReserva, MUNIC_POR_INDICE, sairDasForcas, transferir } from '../sistemas/militar';
import { ESPECIALIDADES, SIGLA_DA } from '../dados/forcas';
import { municipio, nivelDeOferta } from '../dados/lugares';
import { contratar, elegibilidade, nomeOcupacao, textoDeContratacao } from '../sistemas/trabalho';
import { OCUPACOES, ocupacao, ROTULO_TRILHA } from '../dados/ocupacoes';
import { familiaAtual, ondaAgora, TEXTO_ONDA } from '../sistemas/carreira';
import { novaOportunidade } from '../sistemas/oportunidades';
import { marcar } from '../sistemas/marcas';
import { abalar } from '../sistemas/abalo';
import { habilidade } from '../sistemas/frentes';
import { comprarSitio, precoDoSitio } from '../sistemas/rural';
import { capitalDoEstado } from '../sistemas/escola';
import { dinheiro as fmt } from '../texto';
import { clamp } from '../rng';
import { familiaDaTrilha } from '../dados/carreiras';
import { anoDe } from '../tempo';
import { registrarDevolutiva } from '../sistemas/devolutivas';

const categoria = (c: Ctx): CategoriaIlicita => CATEGORIAS[c.v.fatos['proposta_categoria'] ?? 1] ?? 'patrimonial';
const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] === c.v.t;
const quem = (c: Ctx): Pessoa | undefined => contato(c.v)[0];

/** Quem trouxe a proposta (a pessoa da vida real, guardada no fato). */
const contato = (v: Vida): Pessoa[] => {
  const k = Object.keys(v.fatos).find(x => x.startsWith('proposta_de_'));
  const p = k ? v.pessoas[k.slice('proposta_de_'.length)] : undefined;
  return p?.vivo ? [p] : [];
};

const CENA: Record<CategoriaIlicita, (c: Ctx) => string> = {
  pequenos: c => `${quem(c)?.nome ?? 'A turma'} anda metid${quem(c) ? (quem(c)!.genero === 'feminino' ? 'a' : 'o') : 'a'} em coisa errada — nada grande, dizem, "só pela adrenalina e por um dinheiro". Chamaram você para ir junto no fim de semana.`,
  patrimonial: c => `${quem(c)?.nome ?? 'Um conhecido'} tem mercadoria de origem que ninguém pergunta e precisa de alguém para guardar e repassar. Paga bem, em dinheiro vivo, e jura que não tem risco.`,
  mercado: c => `${quem(c)?.nome ?? 'Um conhecido do bairro'} disse que tem um esquema ilegal que paga num mês o que um emprego paga em três. "É só não fazer pergunta." Você sabe que é gente perigosa.`,
  grupo: c => `${quem(c)?.nome ?? 'Gente do esquema'} quer você mais perto do grupo. Mais dinheiro, mais compromisso — e sair depois fica mais difícil.`,
  fraude: c => {
    const e = c.v.trabalho.atual;
    return `${e ? `No trabalho, em ${e.empregador},` : 'No negócio,'} apareceu um jeito de fazer dinheiro sumir sem que ninguém perceba tão cedo. ${quem(c) ? `${quem(c)!.nome} insinuou que já faz isso há anos.` : 'Ninguém ofereceu: a brecha está ali, e você viu.'} As contas de casa estão ${c.v.financas.negativado ? 'atrasadas' : 'apertadas'}.`;
  }
};

function aceitar(c: Ctx, cat: CategoriaIlicita): Resultado {
  return {
    texto: cat === 'fraude' ? 'Da primeira vez, a mão tremeu. Da segunda, menos.' : 'O dinheiro veio rápido, em notas. Veio junto uma coisa que não sai do estômago.',
    memoria: cat === 'pequenos' ? 'Foi junto com a turma fazer o que não devia.' : cat === 'fraude' ? 'Entrou num esquema de fraude.' : 'Aceitou entrar num esquema ilegal.',
    relevancia: 'marco', tom: 'ruim',
    efeito: () => { entrar(c.v, cat, quem(c)?.id, c.r); if (quem(c)) lembrarCom(c.v, quem(c)!.id, 'Entraram juntos no esquema.', 'antigo', 2); }
  };
}

export const TRAJETORIAS: Conteudo[] = [
  /* ============================================== ILEGALIDADE: a proposta */
  {
    id: 'ilic_proposta', tipo: 'decisao', idade: [13, 72], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 0,
    quando: c => deHoje(c, 'proposta_ilicita') && !c.v.justica?.prisao,
    titulo: c => (categoria(c) === 'fraude' ? 'Uma brecha' : 'Uma proposta'),
    texto: c => CENA[categoria(c)](c),
    opcoes: [
      { id: 'recusar_proposta', texto: 'Recusar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você disse que não. A conversa morreu ali.', memoria: categoria(c) === 'fraude' ? 'Viu uma brecha para uma fraude e não entrou.' : 'Recusou entrar num esquema ilegal.', relevancia: 'biografia', efeito: () => fato(c, 'recusou_ilicito') }) },
      { id: 'afastar_proposta', texto: c => (quem(c) ? `Recusar e se afastar de ${quem(c)!.nome}` : 'Recusar e mudar de função para longe disso'), comportamento: { disciplina: 1, independencia: 1 },
        resolver: c => ({ texto: 'Você cortou a conversa e, aos poucos, a convivência.', memoria: null, efeito: () => { fato(c, 'recusou_ilicito'); const p = quem(c); if (p && c.v.vinculos[p.id]) { c.v.vinculos[p.id].proximidade = clamp(c.v.vinculos[p.id].proximidade - 25); c.v.vinculos[p.id].estagio = 'afastado'; } } }) },
      { id: 'aceitar_proposta', texto: c => (categoria(c) === 'pequenos' ? 'Ir junto' : categoria(c) === 'fraude' ? 'Usar a brecha' : 'Aceitar'), comportamento: { impulsividade: 1 }, resolver: c => aceitar(c, categoria(c)) }
    ]
  },
  {
    id: 'ilic_rumo', tipo: 'decisao', idade: [13, 75], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    quando: c => deHoje(c, 'ilic_rumo') && !!c.v.caminhos.envolvimento && c.v.caminhos.envolvimento.parou === undefined && !c.v.justica?.prisao,
    titulo: 'O que está virando isso',
    texto: c => {
      const e = c.v.caminhos.envolvimento!;
      const anos = Math.max(1, Math.round((c.v.t - e.tInicio) / 12));
      const par = parceiro(c.v);
      return `${anos === 1 ? 'Um ano' : `${anos} anos`} disso. Entraram ${fmt(e.ganhos)} por fora${e.exposicao >= 45 ? ', e gente demais já sabe' : ''}. ${par ? `${par.p.nome} desconfia de onde vem o dinheiro.` : ''} ${e.nivel < 3 ? 'Quem está acima oferece mais — mais dinheiro, mais compromisso.' : 'O grupo conta com você.'}`;
    },
    opcoes: [
      { id: 'parar_esquema', texto: 'Parar de vez', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: c.v.caminhos.envolvimento!.nivel >= 3 ? 'Você avisou que estava fora. Ninguém disse nada — e isso era o que dava medo.' : 'Você parou. O dinheiro fácil fez falta no primeiro mês; o sono voltou no segundo.', memoria: null, efeito: () => parar(c.v, 'decidiu sair') }) },
      { id: 'mudar_de_vez', texto: 'Parar e mudar de cidade, para longe de todo mundo', comportamento: { coragem: 1 },
        disponivel: c => (idade(c.v) >= 18 && disponivel(c.v) >= custoDeMudanca(c.v.moradia.municipioId, capitalDoEstado(c.v.moradia.municipioId)) ? true : 'Não há dinheiro nem idade para recomeçar longe.'),
        resolver: c => ({ texto: 'Uma mala, um número de telefone novo, uma cidade onde ninguém sabe o seu nome.', memoria: null, efeito: () => { const aqui = c.v.moradia.municipioId; const d = capitalDoEstado(aqui) !== aqui ? capitalDoEstado(aqui) : 'sao-paulo-sp'; parar(c.v, 'mudou de cidade para cortar os contatos'); pagar(c.v, custoDeMudanca(aqui, d)); mudarAgora(c.v, d, 'para recomeçar longe dos contatos de antes'); delete c.v.fatos['pressao_grupo']; } }) },
      { id: 'seguir_esquema', texto: 'Seguir do mesmo jeito', resolver: () => ({ texto: 'Você seguiu. Cada ano parece o último sem problema.', memoria: null }) },
      { id: 'fundo', texto: 'Ir mais fundo', comportamento: { impulsividade: 1, coragem: 1 }, disponivel: c => ((c.v.caminhos.envolvimento?.nivel ?? 3) < 3 ? true : false),
        resolver: c => ({ texto: 'Mais dinheiro, mais gente em volta, mais coisa para esconder.', memoria: 'Foi mais fundo no esquema.', relevancia: 'marco', tom: 'ruim', efeito: () => escalar(c.v) }) }
    ]
  },
  {
    id: 'ilic_pressao', tipo: 'acontecimento', idade: [16, 75], tema: 'escolha', prioritario: true, repetir: 3,
    quando: c => c.v.fatos['pressao_grupo'] !== undefined && c.v.t - c.v.fatos['pressao_grupo'] <= 24 && c.v.t > c.v.fatos['pressao_grupo'] && !c.v.justica?.prisao && c.r.chance(0.6),
    narrar: c => ({ texto: c.r.pick(['Gente do grupo apareceu na porta, "só para conversar". A conversa foi um aviso.', 'Um recado chegou por um conhecido: quem sai deve explicações.', 'Um carro parado na esquina, dois dias seguidos. Você passou a mudar o caminho de casa.']), relevancia: 'biografia', tom: 'ruim', efeito: () => abalar(c.v, 'a pressão do grupo', -6, 10) })
  },

  /* ================================================================ PRISÃO */
  {
    id: 'pri_rotina', tipo: 'decisao', idade: [12, 90], tema: 'escolha', prioritario: true, prioridade: 4, repetir: 3,
    quando: c => !!c.v.justica?.prisao && c.v.fatos['remicao_decidida'] === undefined,
    titulo: 'Lá dentro',
    texto: c => `${idade(c.v) < 18 ? 'A unidade tem escola, oficina e horário para tudo.' : 'A unidade tem escola, oficinas e uma lista de espera para trabalhar.'} O tempo passa de qualquer jeito — a pergunta é o que fazer com ele. ${c.v.educacao.escolaridade.includes('incompleto') ? 'Dá para terminar a escola aqui.' : ''}`,
    opcoes: [
      { id: 'estudar', texto: 'Estudar (a escola e os cursos da unidade)', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Caderno emprestado, turma de gente de todas as idades, aula à tarde. Cada mês de estudo desconta dias da pena.', memoria: 'Na prisão, voltou a estudar.', efeito: () => { fato(c, 'remicao_decidida'); fato(c, 'remicao_estudo'); if (c.v.educacao.evadiu && !c.v.educacao.basica) { c.v.educacao.basica = { etapa: 'medio', serie: 1, rede: 'publica', desempenho: 50, reprovacoes: 0 }; c.v.educacao.evadiu = false; } if (!c.v.rotinas.some(r => r.id === 'leitura')) c.v.rotinas.push({ id: 'leitura', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'trabalhar', texto: 'Trabalhar na unidade (cozinha, oficina, limpeza)', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você foi para a oficina. Pouco dinheiro, os dias contados a menos, e as mãos ocupadas.', memoria: 'Na prisão, trabalhou na oficina da unidade.', efeito: () => { fato(c, 'remicao_decidida'); fato(c, 'remicao_trabalho'); c.v.trabalho.experiencia['manutencao'] = (c.v.trabalho.experiencia['manutencao'] ?? 0) + 6; } }) },
      { id: 'os_dois', texto: 'Os dois: estudar e trabalhar', comportamento: { disciplina: 2 }, disponivel: c => (c.v.personalidade.tracos.disciplina >= 5 ? true : 'Os dois ao mesmo tempo pedem uma disciplina que ainda não está lá.'),
        resolver: c => ({ texto: 'De manhã, a oficina; à tarde, a escola. À noite, cansaço — do bom, às vezes.', memoria: 'Na prisão, estudou e trabalhou.', efeito: () => { fato(c, 'remicao_decidida'); fato(c, 'remicao_estudo'); fato(c, 'remicao_trabalho'); } }) },
      { id: 'quieto', texto: 'Ficar na sua, contando os dias', resolver: c => ({ texto: 'Você ficou na sua. Os dias não passaram mais rápido por isso.', memoria: null, efeito: () => fato(c, 'remicao_decidida') }) }
    ]
  },
  {
    id: 'pri_saida', tipo: 'decisao', idade: [16, 95], tema: 'escolha', prioritario: true, prioridade: 5, repetir: 1,
    quando: c => c.v.justica?.tSaida === c.v.t && !c.v.justica?.prisao,
    titulo: 'Do lado de fora',
    texto: c => {
      const g = P.genitor(c.v)[0];
      const par = parceiro(c.v);
      return `A rua parece mais barulhenta do que era. ${par ? `${par.p.nome} esperou.` : g ? `${g.nome} foi buscar você.` : 'Ninguém foi buscar você.'} Na carteira, pouco dinheiro; na ficha, o que não sai. ${contato(c.v).length || c.v.caminhos.envolvimento?.contatoId ? 'O pessoal de antes já mandou recado.' : ''}`;
    },
    opcoes: [
      { id: 'programa', texto: 'Procurar o programa de apoio a egressos e qualquer trabalho com carteira', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Fila, cadastro, entrevista, fila de novo. Mas havia uma porta.', memoria: 'Saiu da prisão e foi atrás de trabalho com carteira.', efeito: () => { delete c.v.fatos['remicao_decidida']; delete c.v.fatos['remicao_estudo']; delete c.v.fatos['remicao_trabalho']; if (!c.v.caminhos.oportunidades.some(o => o.tipo === 'reinsercao')) novaOportunidade(c.v, { tipo: 'reinsercao', ocupacaoId: 'aux_limpeza', meses: 18, chave: 'reinsercao', bonus: 0.3, titulo: 'Um programa para quem saiu', texto: 'Um programa de apoio a egressos encaminha para empresas parceiras. Carteira assinada, salário de começo.' }); } }) },
      { id: 'estudar', texto: 'Estudar: um curso técnico ou de qualificação', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você foi ver os cursos gratuitos da cidade. Uma sala cheia de gente recomeçando alguma coisa.', memoria: 'Saiu da prisão decidid' + c.g('o', 'a', 'e') + ' a estudar.', efeito: () => { fato(c, 'plano_tecnico'); delete c.v.fatos['remicao_decidida']; } }) },
      { id: 'longe', texto: 'Recomeçar em outra cidade, longe dos contatos de antes', comportamento: { coragem: 1 },
        disponivel: c => (disponivel(c.v) >= 2500 ? true : 'Sem dinheiro nem para a passagem e o primeiro mês.'),
        resolver: c => ({ texto: 'Outra rodoviária, outra cidade. Ninguém ali sabe de onde você veio.', memoria: 'Recomeçou a vida em outra cidade depois da prisão.', efeito: () => { const aqui = c.v.moradia.municipioId; const d = capitalDoEstado(aqui) !== aqui ? capitalDoEstado(aqui) : 'campinas-sp'; pagar(c.v, 2500); mudarAgora(c.v, d, 'para recomeçar'); const e = c.v.caminhos.envolvimento; if (e) e.contatoId = undefined; delete c.v.fatos['remicao_decidida']; } }) },
      { id: 'antigos', texto: 'Procurar o pessoal de antes', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Foram os únicos que abriram a porta sem perguntar nada.', memoria: 'Voltou para os contatos de antes da prisão.', relevancia: 'marco', tom: 'ruim', efeito: () => { delete c.v.fatos['remicao_decidida']; const e = c.v.caminhos.envolvimento; entrar(c.v, e?.categoria === 'fraude' ? 'patrimonial' : e?.categoria ?? 'patrimonial', e?.contatoId, c.r); } }) }
    ]
  },

  /* =============================================================== CUIDADO */
  {
    id: 'cui_bebe', tipo: 'decisao', idade: [16, 55], tema: 'filhos', prioritario: true, prioridade: 4, repetir: 1,
    papeis: { filho: v => filhos(v).filter(f => idadePessoa(v, f) <= 1 && v.vinculos[f.id]?.convivio.includes('casa') && v.fatos[`cuidado_decidido_${f.id}`] === undefined) },
    quando: c => !!c.v.trabalho.atual && !c.v.trabalho.pausa && !c.v.trabalho.atual.formacaoAte,
    titulo: 'Quando a licença acaba',
    texto: c => {
      const par = parceiro(c.v);
      const avo = P.avoPerto(c.v)[0] ?? P.genitor(c.v).find(g => g.municipioId === c.v.moradia.municipioId);
      return `${c.p.filho.nome} ainda acorda de três em três horas, e a licença está acabando. ${avo ? `${avo.nome} se ofereceu para ajudar alguns dias.` : 'Creche, só com vaga — e a lista é grande.'} ${par ? `${par.p.nome} também está pensando no que fazer.` : 'A decisão é sua, e só sua.'}`;
    },
    opcoes: [
      { id: 'voltar', texto: 'Voltar ao trabalho, com creche ou ajuda da família',
        resolver: c => ({ texto: 'A primeira semana foi a mais longa do ano. Depois, virou rotina.', memoria: null, efeito: () => fato(c, `cuidado_decidido_${c.p.filho.id}`) }) },
      { id: 'reduzir', texto: 'Reduzir a jornada por uns anos', comportamento: { familia: 1 }, disponivel: c => podeReduzir(c.v),
        resolver: c => ({ texto: 'Menos dinheiro, mais tardes em casa.', memoria: null, efeito: () => { fato(c, `cuidado_decidido_${c.p.filho.id}`); iniciarPausa(c.v, 'filhos', 'parcial', c.p.filho.id); } }) },
      { id: 'parar', texto: 'Parar de trabalhar enquanto é pequeno', comportamento: { familia: 1 }, disponivel: c => (c.v.trabalho.atual?.contrato === 'militar' ? 'Sair da carreira militar por isso seria perder a carreira.' : true),
        resolver: c => ({ texto: 'Você entregou o crachá. Em casa, o trabalho era outro e não tinha hora para acabar.', memoria: null, efeito: () => { fato(c, `cuidado_decidido_${c.p.filho.id}`); iniciarPausa(c.v, 'filhos', 'total', c.p.filho.id); } }) },
      { id: 'parceria', texto: c => `Combinar que ${parceiro(c.v)?.p.nome ?? 'a parceria'} reduz a jornada`, disponivel: c => ((parceiro(c.v)?.p.renda ?? 0) > 0 && parceiro(c.v)!.vin.convivio.includes('casa') ? true : false), comportamento: { familia: 1 },
        resolver: c => ({ texto: `${parceiro(c.v)!.p.nome} passou as tardes em casa. O dinheiro encolheu do outro lado.`, memoria: `Combinou com ${parceiro(c.v)!.p.nome} que ${parceiro(c.v)!.p.genero === 'feminino' ? 'ela' : 'ele'} reduziria a jornada para cuidar de ${c.p.filho.nome}.`, efeito: () => { fato(c, `cuidado_decidido_${c.p.filho.id}`); const par = parceiro(c.v)!; par.p.renda = Math.round(par.p.renda * 0.6); c.v.fatos[`parceria_cuidou_${par.p.id}`] = c.v.t; prox(c, 'filho', 4); } }) }
    ]
  },
  {
    id: 'cui_familiar', tipo: 'decisao', idade: [20, 80], tema: 'familia', prioritario: true, prioridade: 3, repetir: 6,
    papeis: { quem: v => vinculosVivos(v).filter(x => !x.p.especie && x.vin.convivio.includes('casa') && (x.vin.romance ? x.p.saude < 35 : ['mae', 'pai', 'sogro', 'avo'].includes(x.vin.parentesco ?? '') && idadePessoa(v, x.p) >= 68 && x.p.saude < 40)).map(x => x.p) },
    quando: c => !c.v.trabalho.pausa && !!c.v.trabalho.atual && !c.v.fatos[`paga_cuidadora_${c.p.quem.id}`] && !c.v.trabalho.atual.formacaoAte,
    titulo: c => `${c.p.quem.nome} precisa de alguém`,
    texto: c => `${c.p.quem.nome} já não consegue ficar sozinh${c.p.quem.genero === 'feminino' ? 'a' : 'o'} o dia inteiro: remédio na hora certa, consulta, banho, a noite. O trabalho continua cobrando o mesmo de sempre.`,
    opcoes: [
      { id: 'reduzir', texto: 'Reduzir a jornada para cuidar', comportamento: { familia: 1, empatia: 1 }, disponivel: c => podeReduzir(c.v),
        resolver: c => ({ texto: 'As manhãs no trabalho, as tardes em casa.', memoria: null, efeito: () => { iniciarPausa(c.v, c.p.quem.parceiroId === undefined && parceiro(c.v)?.p.id === c.p.quem.id ? 'parceiro' : 'pais', 'parcial', c.p.quem.id); prox(c, 'quem', 6); } }) },
      { id: 'parar', texto: 'Parar de trabalhar para cuidar', comportamento: { familia: 2, empatia: 1 }, disponivel: c => (c.v.trabalho.atual?.contrato === 'militar' ? 'A farda não permite parar assim.' : true),
        resolver: c => ({ texto: 'Você virou enfermeira, motorista e companhia — sem folga e sem salário.'.replace('enfermeira', c.g('enfermeiro', 'enfermeira', 'enfermeire')), memoria: null, efeito: () => { iniciarPausa(c.v, parceiro(c.v)?.p.id === c.p.quem.id ? 'parceiro' : 'pais', 'total', c.p.quem.id); prox(c, 'quem', 8); } }) },
      { id: 'cuidadora', texto: 'Pagar uma cuidadora durante o dia', disponivel: c => (disponivel(c.v) >= 6000 || (c.v.trabalho.atual?.salario ?? 0) >= 4500 ? true : 'O salário não cobre uma cuidadora.'),
        resolver: c => ({ texto: 'Uma cuidadora passou a vir de manhã. O custo entrou no orçamento.', memoria: `Contratou uma cuidadora para ${c.p.quem.nome}.`, efeito: () => fato(c, `paga_cuidadora_${c.p.quem.id}`) }) },
      { id: 'dar_conta', texto: 'Dar conta dos dois, como der', resolver: c => ({ texto: 'Você passou a dormir pouco.', memoria: null, efeito: () => estresse(c, 8) }) }
    ]
  },
  {
    id: 'cui_voltar', tipo: 'decisao', idade: [18, 64], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 2,
    quando: c => deHoje(c, 'pausa_voltar') && !!c.v.trabalho.pausa,
    titulo: c => (c.v.trabalho.pausa?.intensidade === 'parcial' ? 'A jornada inteira de novo?' : 'Voltar ao mercado?'),
    texto: c => {
      const pa = c.v.trabalho.pausa!;
      const anos = Math.max(1, Math.round((c.v.t - pa.tInicio) / 12));
      const p = pa.pessoaId ? c.v.pessoas[pa.pessoaId] : undefined;
      const motivo = pa.motivo === 'filhos' ? 'As crianças já não são tão pequenas.' : p && !p.vivo ? `Depois de ${p.nome}, a casa ficou grande.` : p ? `${p.nome} está melhor.` : 'A casa está em ordem.';
      return `${motivo} Foram ${anos} ${anos === 1 ? 'ano' : 'anos'} ${pa.intensidade === 'total' ? 'fora do trabalho pago' : 'de jornada reduzida'}. ${pa.intensidade === 'total' ? 'O currículo tem um buraco que alguém vai perguntar.' : ''}`;
    },
    opcoes: [
      { id: 'procurar', texto: c => (c.v.trabalho.pausa?.intensidade === 'parcial' ? 'Voltar à jornada inteira' : 'Voltar a procurar trabalho'),
        resolver: c => ({ texto: 'Currículo atualizado, a roupa de entrevista tirada do fundo do armário.', memoria: null, efeito: () => encerrarPausa(c.v, 'procurar') }) },
      { id: 'estudar', texto: 'Voltar primeiro estudando algo novo', comportamento: { disciplina: 1 }, disponivel: c => (c.v.trabalho.pausa?.intensidade === 'total' ? true : false),
        resolver: c => ({ texto: 'Um curso à noite para chegar no mercado com outra coisa na mão.', memoria: null, efeito: () => encerrarPausa(c.v, 'estudar') }) },
      { id: 'ficar', texto: 'Seguir assim por mais um tempo', resolver: c => ({ texto: 'Ainda não. A casa ainda pede você.', memoria: null, efeito: () => { delete c.v.fatos['pausa_voltar']; c.v.fatos['pausa_adiou'] = c.v.t; } }) }
    ]
  },

  /* ======================================================= FORÇAS ARMADAS */
  {
    id: 'mil_especialidade', tipo: 'decisao', idade: [17, 40], tema: 'trabalho', prioritario: true, prioridade: 4,
    quando: c => c.v.fatos['mil_especialidade'] !== undefined && !!c.v.caminhos.militar && !c.v.caminhos.militar.especialidade,
    titulo: 'A especialidade',
    texto: c => `No fim da formação, cada turma escolhe uma especialidade — o que vai fazer ${SIGLA_DA[c.v.caminhos.militar!.forca].replace(/^d/, 'n')} e o que vai levar, um dia, para a vida civil.`,
    opcoes: (['combatente', 'manutencao', 'comunicacoes', 'saude', 'administracao', 'musica'] as Especialidade[]).map(esp => ({
      id: esp, texto: () => ({ combatente: 'Combatente: a tropa, o campo, o comando', manutencao: 'Manutenção de viaturas e equipamentos', comunicacoes: 'Comunicações e sistemas', saude: 'Saúde', administracao: 'Administração e intendência', musica: 'Música (banda militar)' } as Record<string, string>)[esp],
      disponivel: (c: Ctx) => (esp === 'musica' ? (habilidade(c.v, 'musica') >= 58 ? true : 'A banda seleciona quem já toca bem.') : true),
      resolver: (c: Ctx) => ({ texto: `Especialidade: ${ESPECIALIDADES[esp].nome}.`, memoria: `Escolheu a especialidade de ${ESPECIALIDADES[esp].nome} na formação militar.`, efeito: () => escolherEspecialidade(c.v, esp) })
    }))
  },
  {
    id: 'mil_curso', tipo: 'decisao', idade: [22, 60], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 2,
    quando: c => deHoje(c, 'mil_curso_oferta') && !!c.v.caminhos.militar,
    titulo: 'O curso de carreira',
    texto: c => `Abriu a turma do curso ${c.v.trabalho.atual?.ocupacaoId === 'major' ? 'de altos estudos' : 'de aperfeiçoamento'}. Um ano puxado, estudo de noite e prova no fim — e, sem ele, a promoção ${c.v.trabalho.atual ? `a partir de ${nomeOcupacao(c.v, ocupacao(c.v.trabalho.atual.ocupacaoId))}` : ''} não vem. ${filhos(c.v).some(f => idadePessoa(c.v, f) < 6) ? 'Em casa, uma criança pequena.' : ''}`,
    opcoes: [
      { id: 'fazer', texto: 'Fazer o curso', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Um ano de apostila, simulado e pouca noite de sono. Aprovado.'.replace('Aprovado', c.g('Aprovado', 'Aprovada', 'Aprovade')), memoria: null, efeito: () => { fazerCurso(c.v); estresse(c, 8); } }) },
      { id: 'adiar', texto: 'Deixar para a próxima turma', resolver: c => ({ texto: 'Você deixou para depois. A carreira também esperou.', memoria: null, efeito: () => { delete c.v.fatos['mil_curso_oferta']; c.v.fatos['mil_curso_adiado'] = c.v.t; } }) }
    ]
  },
  {
    id: 'mil_transferencia', tipo: 'decisao', idade: [18, 62], tema: 'lugar', prioritario: true, prioridade: 3, repetir: 1,
    quando: c => deHoje(c, 'mil_transferencia') && !!c.v.caminhos.militar && !!c.v.trabalho.atual && MUNIC_POR_INDICE(c.v.fatos['mil_destino'] ?? -1) !== undefined,
    titulo: 'A movimentação',
    texto: c => {
      const destino = municipio(MUNIC_POR_INDICE(c.v.fatos['mil_destino']!)!);
      const par = parceiro(c.v);
      const casa = filhos(c.v).filter(f => c.v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(c.v, f) < 18);
      return `Saiu no boletim: transferência para ${destino.nome}, ${destino.uf}. ${par ? `${par.p.nome} ${par.p.renda > 0 ? 'teria de deixar o trabalho' : 'teria de recomeçar a vida'} lá.` : ''} ${casa.length ? `${casa.length === 1 ? casa[0].nome : 'As crianças'} mudaria${casa.length === 1 ? '' : 'm'} de escola no meio do ano.` : ''} Há imóvel funcional, às vezes — com fila.`;
    },
    opcoes: [
      { id: 'familia', texto: c => (parceiro(c.v) || filhos(c.v).some(f => c.v.vinculos[f.id]?.convivio.includes('casa')) ? 'Ir com a família' : 'Ir'),
        resolver: c => { const d = MUNIC_POR_INDICE(c.v.fatos['mil_destino']!)!; const funcional = c.r.chance(0.55); return { texto: funcional ? 'Um caminhão, três dias de estrada e uma casa na vila militar.' : 'Um caminhão, três dias de estrada e um apartamento alugado perto da unidade.', memoria: null, efeito: () => { delete c.v.fatos['mil_destino']; delete c.v.fatos['mil_transferencia']; transferir(c.v, d, true, funcional); for (const f of filhos(c.v)) if (idadePessoa(c.v, f) >= 8 && idadePessoa(c.v, f) < 18 && c.v.vinculos[f.id]?.convivio.includes('casa')) { tensaoPessoa(c.v, f.id, 10); } } }; } },
      { id: 'sozinho', texto: 'Ir sozinho; a família fica', disponivel: c => (parceiro(c.v) || filhos(c.v).some(f => c.v.vinculos[f.id]?.convivio.includes('casa')) ? true : false),
        resolver: c => { const d = MUNIC_POR_INDICE(c.v.fatos['mil_destino']!)!; return { texto: 'Casa em dois lugares, saudade nos dois, a estrada nos feriados.', memoria: `Transferid${c.g('o', 'a', 'e')} para ${municipio(d).nome}, foi sozinh${c.g('o', 'a', 'e')}: a família ficou.`, relevancia: 'marco', efeito: () => { delete c.v.fatos['mil_destino']; delete c.v.fatos['mil_transferencia']; transferir(c.v, d, false, false); const par = parceiro(c.v); if (par) par.vin.tensao = clamp(par.vin.tensao + 10); } }; } },
      { id: 'adiar', texto: 'Pedir para ficar mais um tempo (motivo de família)', disponivel: c => (!temFato(c.v, `mil_adiou_${c.v.caminhos.militar!.tGuarnicao}`) ? true : 'Já pediu uma vez nesta guarnição.'),
        resolver: c => { const deu = c.r.chance(0.45); return { texto: deu ? 'O pedido foi aceito: mais um ano, talvez dois.' : 'O pedido foi negado. A movimentação fica para o ano que vem, sem apelação.', memoria: null, efeito: () => { delete c.v.fatos['mil_transferencia']; marcarFato(c.v, `mil_adiou_${c.v.caminhos.militar!.tGuarnicao}`); if (deu) { c.v.caminhos.militar!.tGuarnicao = c.v.t - 6; delete c.v.fatos['mil_destino']; } else { c.v.caminhos.militar!.tGuarnicao = c.v.t - 30; } } }; } },
      { id: 'sair', texto: c => ((c.v.trabalho.contribuicao >= 0 && Math.floor((c.v.t - c.v.caminhos.militar!.tIngresso) / 12) >= 35) ? 'Pedir a reserva' : 'Pedir para sair da Força'), comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Você pediu para sair. Dezenas de formulários depois, a farda ficou no armário.', memoria: null, efeito: () => { delete c.v.fatos['mil_destino']; delete c.v.fatos['mil_transferencia']; if (Math.floor((c.v.t - c.v.caminhos.militar!.tIngresso) / 12) >= 35) irParaReserva(c.v, 'pedido'); else { const ind = sairDasForcas(c.v); if (ind) pagar(c.v, Math.min(ind, disponivel(c.v))); } } }) }
    ]
  },
  {
    id: 'mil_missao', tipo: 'acontecimento', idade: [18, 60], tema: 'trabalho', prioritario: true, repetir: 2,
    quando: c => deHoje(c, 'mil_missao') && !!c.v.caminhos.militar && !!c.v.trabalho.atual && !c.v.trabalho.atual.formacaoAte,
    narrar: c => {
      const f = c.v.caminhos.militar!.forca;
      const texto = c.r.pick(f === 'marinha' ? ['Três meses embarcado. Em casa, contaram os dias no calendário da geladeira.', 'Uma comissão no navio-patrulha: mar, turno e saudade.'] : f === 'aeronautica' ? ['Um período destacado numa base longe, apoiando uma operação de socorro.', 'Semanas de escala dobrada durante um exercício grande.'] : ['Dois meses de missão na fronteira.', 'Semanas de exercício no campo, dormindo em barraca.', 'Uma missão de apoio a uma cidade atingida por enchente.']);
      return { texto, relevancia: 'cotidiano', efeito: () => { const par = parceiro(c.v); if (par) par.vin.tensao = clamp(par.vin.tensao + 4); c.v.corpo.forma = clamp(c.v.corpo.forma + 3); } };
    }
  },
  {
    id: 'mil_reserva', tipo: 'decisao', idade: [40, 70], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 0,
    quando: c => deHoje(c, 'mil_reserva'),
    titulo: 'Na reserva',
    texto: c => `Farda no armário, remuneração na conta, ${idade(c.v)} anos e muito tempo pela frente. Muita gente da reserva começa outra coisa. ${c.v.caminhos.militar?.especialidade ? `A especialidade — ${ESPECIALIDADES[c.v.caminhos.militar.especialidade].nome} — ainda vale lá fora.` : ''}`,
    opcoes: [
      { id: 'segunda', texto: 'Uma segunda carreira, no que já sabe fazer', disponivel: c => (segundaCarreira(c.v) ? true : 'Por aqui, não há vaga que aproveite o que você sabe.'),
        resolver: c => { const oc = segundaCarreira(c.v); if (!oc) return { texto: 'Não apareceu nada que coubesse.', memoria: null }; return { texto: `Você mandou currículo com "militar da reserva" no topo. Chamaram: ${nomeOcupacao(c.v, oc)}.`, memoria: null, efeito: () => { const e = contratar(c.v, c.r, oc, 'segunda_carreira'); e.posAposentadoria = true; escrever(c.v, { texto: `Na reserva, começou uma segunda carreira: ${textoDeContratacao(c.v, oc, e).replace(/^Novo emprego: /, '')}`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' }); marcar(c.v, 'mudanca_carreira', `Segunda carreira depois da reserva: ${nomeOcupacao(c.v, oc)}.`, 3, { ocupacaoId: oc.id }); } }; } },
      { id: 'estudar', texto: 'Estudar para outra coisa (uma faculdade, um concurso civil)', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você comprou apostila de novo. Desta vez, por escolha.', memoria: null, efeito: () => { fato(c, 'plano_estudar'); if (!c.v.rotinas.some(r => r.id === 'estudar_concurso')) c.v.rotinas.push({ id: 'estudar_concurso', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'descansar', texto: 'Descansar e cuidar da família', resolver: c => ({ texto: 'Pela primeira vez em décadas, ninguém esperava você às sete.', memoria: null, efeito: () => feliz(c, 3) }) }
    ]
  },

  /* ================================================ TRANSFORMAÇÃO DO TRABALHO */
  {
    id: 'car_onda', tipo: 'decisao', idade: [18, 65], tema: 'trabalho', prioritario: true, prioridade: 1, repetir: 4,
    quando: c => { const o = ondaAgora(c.v); return !!o && deHoje(c, `onda_${o.familia.id}_${o.ano}`) && !!c.v.trabalho.atual && !c.v.trabalho.atual.posAposentadoria; },
    titulo: 'O trabalho mudou',
    texto: c => { const o = ondaAgora(c.v)!; const ts = TEXTO_ONDA[o.familia.id] ?? ['O jeito de trabalhar mudou.']; return `${ts[o.ano % ts.length]} ${idade(c.v) >= 45 ? 'Gente da sua idade anda dizendo que já não compensa aprender tudo de novo.' : ''}`; },
    opcoes: [
      { id: 'atualizar', texto: 'Fazer um curso de atualização (alguns meses, à noite)', comportamento: { disciplina: 1 }, disponivel: c => (disponivel(c.v) >= 1500 ? true : 'O curso custa uns R$ 1.500 que não sobram agora.'),
        resolver: c => ({ texto: 'Três meses de aula à noite. No fim, o que parecia outra língua virou ferramenta.', memoria: 'Fez um curso de atualização quando o trabalho mudou.', efeito: () => { pagar(c.v, 1500); const e = c.v.trabalho.atual; if (!e) return; e.tAtualizacao = c.v.t; e.desempenho = clamp(e.desempenho + 8); if (e.clientela !== undefined) e.clientela = clamp(e.clientela + 8); estresse(c, 4); } }) },
      { id: 'no_trabalho', texto: 'Aprender no próprio trabalho, errando', comportamento: { coragem: 1 },
        resolver: c => { const deu = c.r.chance(0.5 + c.v.mente.cognicao / 250); return { texto: deu ? 'Você foi aprendendo no susto. Deu certo, com alguns tropeços.' : 'Você tentou aprender sozinho. Ficou pela metade.', memoria: null, efeito: () => { if (deu && c.v.trabalho.atual) c.v.trabalho.atual.tAtualizacao = c.v.t; } }; } },
      { id: 'seguir', texto: 'Seguir do jeito que sabe', resolver: () => ({ texto: 'Você seguiu como sempre. Por um tempo, deu.', memoria: null }) },
      { id: 'mudar', texto: 'Aproveitar para mudar de área', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Se era para aprender tudo de novo, que fosse outra coisa.', memoria: 'Quando o trabalho mudou, decidiu mudar de área.', efeito: () => { fato(c, 'plano_estudar'); fato(c, 'quis_mudar_area'); } }) }
    ]
  },

  /* ============================================================== CAMPO */
  {
    id: 'rural_aperto', tipo: 'decisao', idade: [18, 85], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 3,
    quando: c => deHoje(c, 'rural_aperto') && !!c.v.caminhos.rural && c.v.trabalho.atual?.ocupacaoId === 'produtor_rural',
    titulo: 'Dois anos ruins',
    texto: c => `Duas safras ruins seguidas. ${c.v.caminhos.rural!.terra === 'arrendada' ? 'O arrendamento vence de qualquer jeito.' : 'A terra continua lá; o dinheiro, não.'} ${parceiro(c.v) ? `${parceiro(c.v)!.p.nome} pergunta se não é hora de mudar alguma coisa.` : ''}`,
    opcoes: [
      { id: 'diversificar', texto: 'Diversificar: horta, criação, venda direta na feira', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Você plantou o que não plantava e foi vender na feira da cidade.', memoria: 'Diversificou a produção depois de duas safras ruins.', efeito: () => { const ru = c.v.caminhos.rural!; ru.cultura = 'misto'; ru.anosRuins = 0; const e = c.v.trabalho.atual; if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + 10); c.v.trabalho.experiencia['informal'] = (c.v.trabalho.experiencia['informal'] ?? 0) + 6; } }) },
      { id: 'cooperativa', texto: 'Entrar para a cooperativa', disponivel: c => (!c.v.caminhos.rural!.cooperativa ? true : false),
        resolver: c => ({ texto: 'Na cooperativa, o preço é combinado e a perda é dividida.', memoria: 'Entrou para a cooperativa agrícola.', efeito: () => { c.v.caminhos.rural!.cooperativa = true; c.v.caminhos.rural!.anosRuins = 0; } }) },
      { id: 'largar', texto: 'Largar a terra e ir trabalhar na cidade',
        resolver: c => ({ texto: 'Você deixou a terra. A cidade tinha barulho demais e salário certo no fim do mês.', memoria: 'Largou a produção rural depois de anos ruins.', relevancia: 'marco', efeito: () => { const e = c.v.trabalho.atual; if (e) { c.v.trabalho.historico.push({ ...e, tFim: c.v.t, motivo: 'largou a terra' }); c.v.trabalho.atual = undefined; c.v.trabalho.desempregadoDesde = c.v.t; } c.v.caminhos.rural = undefined; marcar(c.v, 'mudanca_carreira', 'Deixou o campo.', 3); } }) },
      { id: 'aguentar', texto: 'Aguentar: a terra dá e tira', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Você apertou o cinto e esperou a próxima chuva.', memoria: null, efeito: () => { c.v.caminhos.rural!.anosRuins = 0; estresse(c, 5); } }) }
    ]
  },
  {
    id: 'rural_cooperativa', tipo: 'decisao', idade: [18, 85], tema: 'trabalho', prioritario: true, repetir: 4,
    quando: c => deHoje(c, 'rural_cooperativa') && !!c.v.caminhos.rural && !c.v.caminhos.rural.cooperativa && c.v.trabalho.atual?.ocupacaoId === 'produtor_rural',
    titulo: 'A cooperativa',
    texto: () => 'Os vizinhos estão entrando para a cooperativa da região: assistência técnica, venda conjunta, insumo mais barato. Tem mensalidade e tem reunião.',
    opcoes: [
      { id: 'entrar', texto: 'Entrar', resolver: c => ({ texto: 'Na primeira assembleia, você só ouviu. Na terceira, já palpitava.', memoria: 'Entrou para a cooperativa agrícola.', efeito: () => { c.v.caminhos.rural!.cooperativa = true; } }) },
      { id: 'sozinho', texto: 'Seguir por conta', comportamento: { independencia: 1 }, resolver: () => ({ texto: 'Você preferiu vender sozinho, do seu jeito.', memoria: null }) }
    ]
  },
  {
    id: 'rural_comprar', tipo: 'decisao', idade: [20, 75], tema: 'dinheiro', prioritario: true, repetir: 5,
    quando: c => deHoje(c, 'rural_comprar') && c.v.caminhos.rural?.terra === 'arrendada' && c.v.trabalho.atual?.ocupacaoId === 'produtor_rural',
    titulo: 'A terra à venda',
    texto: c => `O dono da terra arrendada quer vender. Pede uns ${fmt(precoDoSitio(c.v))}. Há crédito rural, com juro menor que o do banco, para quem produz.`,
    opcoes: [
      { id: 'vista', texto: 'Comprar à vista', disponivel: c => (disponivel(c.v) >= precoDoSitio(c.v) ? true : 'Não há esse dinheiro guardado.'),
        resolver: c => ({ texto: 'A escritura saiu no seu nome. Você andou a divisa inteira no primeiro dia.', memoria: 'Comprou a terra onde produzia.', relevancia: 'marco', tom: 'bom', efeito: () => comprarSitio(c.v, false) }) },
      { id: 'credito', texto: 'Comprar com crédito rural (20% de entrada)', disponivel: c => (disponivel(c.v) >= precoDoSitio(c.v) * 0.2 && !c.v.financas.negativado ? true : 'Não há a entrada, ou o nome está sujo.'),
        resolver: c => ({ texto: 'Doze anos de parcela. Mas é sua.', memoria: 'Comprou a terra com crédito rural.', relevancia: 'marco', tom: 'bom', efeito: () => comprarSitio(c.v, true) }) },
      { id: 'nao', texto: 'Seguir arrendando', resolver: () => ({ texto: 'Outro comprou. O novo dono renovou o arrendamento — por enquanto.', memoria: null }) }
    ]
  },

  /* ======================================================== INFORMAL / MEI */
  {
    id: 'inf_mei', tipo: 'decisao', idade: [18, 70], tema: 'trabalho', prioritario: true, repetir: 5,
    quando: c => { const e = c.v.trabalho.atual; return !!e && e.contrato === 'informal' && !e.mei && c.v.t - e.tInicio >= 24 && ((e.clientela ?? 40) >= 35 || e.salario >= 1800) && c.r.chance(0.6); },
    titulo: 'Sair da informalidade?',
    texto: c => `Faz ${Math.floor((c.v.t - c.v.trabalho.atual!.tInicio) / 12)} anos que você trabalha sem registro nenhum. Uma conhecida formalizou como MEI: paga uma guia todo mês, emite nota, conta tempo para a aposentadoria — e alguns clientes só compram com nota.`,
    opcoes: [
      { id: 'formalizar', texto: 'Formalizar como MEI', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'CNPJ na mão em uma tarde. A guia chega todo mês.', memoria: 'Formalizou o trabalho como MEI.', relevancia: 'biografia', efeito: () => formalizar(c.v) }) },
      { id: 'seguir', texto: 'Seguir como está', resolver: () => ({ texto: 'Por ora, a guia pesaria mais do que ajudaria.', memoria: null }) }
    ]
  },

  /* =========================================================== SERVIÇO PÚBLICO */
  {
    id: 'pub_funcao', tipo: 'decisao', idade: [28, 64], tema: 'trabalho', prioritario: true, repetir: 8, peso: 2,
    quando: c => { const e = c.v.trabalho.atual; return !!e && e.contrato === 'servidor' && c.v.t - e.tInicio >= 96 && e.desempenho >= 60 && !temFato(c.v, `funcao_${e.ocupacaoId}`) && c.r.chance(0.25); },
    titulo: 'Uma função de chefia',
    texto: c => { const oc = ocupacao(c.v.trabalho.atual!.ocupacaoId); return oc.trilha === 'educacao' ? 'A escola vai eleger uma nova direção, e colegas querem o seu nome na chapa. Mais salário, muito mais problema — e a sala de aula ficaria para depois.' : 'Ofereceram uma função de chefia no setor: gratificação no salário, a responsabilidade pelos outros e as reuniões que ninguém quer.'; },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Mesa nova, telefone que não para, gratificação no contracheque.', memoria: null, efeito: () => { const e = c.v.trabalho.atual; if (!e) return; const oc = ocupacao(e.ocupacaoId); marcarFato(c.v, `funcao_${oc.id}`); if (oc.trilha === 'educacao' && oc.id !== 'diretor_escola') { e.ocupacaoId = 'diretor_escola'; e.tPosto = c.v.t; } e.salario = Math.round(e.salario * 1.22 / 10) * 10; const texto = oc.trilha === 'educacao' ? 'Eleito para a direção da escola.'.replace('Eleito', c.g('Eleito', 'Eleita', 'Eleite')) : 'Assumiu uma função de chefia no serviço público.'; escrever(c.v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' }); marcar(c.v, 'lideranca', texto, 2); estresse(c, 6); } }) },
      { id: 'recusar', texto: 'Recusar: o trabalho de agora é o que gosto', resolver: c => ({ texto: 'Você agradeceu e ficou onde estava.', memoria: null, efeito: () => { if (c.v.trabalho.atual) marcarFato(c.v, `funcao_${c.v.trabalho.atual.ocupacaoId}`); } }) }
    ]
  },

  /* ================================================================= ARTE */
  {
    id: 'arte_edital', tipo: 'decisao', idade: [16, 80], tema: 'lazer', prioritario: true, repetir: 3, peso: 2,
    quando: c => ['musica', 'teatro', 'danca', 'desenho', 'escrita', 'fotografia'].some(d => c.v.rotinas.some(r => r.id === (d === 'escrita' ? 'escrever' : d)) && habilidade(c.v, d as never) >= 52) && c.r.chance(0.18),
    titulo: 'Um edital de cultura',
    texto: c => `Saiu o edital de cultura ${nivelDeOferta(c.v.moradia.municipioId) >= 2 ? 'do estado' : 'da prefeitura'}: bolsa para projetos de artistas da cidade. Pede um projeto escrito, portfólio, orçamento. ${c.v.caminhos.arte?.ativo ? `${c.v.caminhos.arte.nome} poderia concorrer.` : 'Dá trabalho montar.'}`,
    opcoes: [
      { id: 'inscrever', texto: 'Montar o projeto e se inscrever', comportamento: { disciplina: 1 },
        resolver: c => {
          const d = melhorArte(c.v);
          const chance = clamp((habilidade(c.v, d) - 50) / 60 + (c.v.caminhos.arte?.publico ?? 0) / 200 + (c.v.fatos['editais_tentados'] ?? 0) * 0.04, 0.05, 0.6);
          const passou = c.r.chance(chance);
          c.v.fatos['editais_tentados'] = (c.v.fatos['editais_tentados'] ?? 0) + 1;
          if (!passou) registrarDevolutiva(c.v, { tipo: 'concurso', titulo: 'Edital de cultura', texto: 'O parecer elogiou a proposta, mas o orçamento e o portfólio ficaram abaixo dos selecionados.', passou: false, perto: chance > 0.25, falta: 'concorrencia', dominio: d });
          return passou
            ? { texto: 'Aprovado. O dinheiro não é muito, mas é o primeiro que vem por causa do que você faz.', memoria: 'Teve um projeto aprovado num edital de cultura.', relevancia: 'marco', tom: 'bom', efeito: () => { c.v.financas.conta += 18000; if (c.v.caminhos.arte) c.v.caminhos.arte.publico = clamp(c.v.caminhos.arte.publico + 15); marcar(c.v, 'conquista', 'Projeto aprovado num edital de cultura.', 2, { dominio: d }); const f = c.v.caminhos.frentes[d]; if (f) f.interesse = clamp(f.interesse + 10); } }
            : { texto: 'Não passou. Veio um parecer de duas linhas e a lista dos aprovados.', memoria: null, tom: 'ruim', efeito: () => abalar(c.v, 'o edital que não passou', -2, 1) };
        } },
      { id: 'nao', texto: 'Deixar para o próximo', resolver: () => ({ texto: 'Ficou para o próximo edital.', memoria: null }) }
    ]
  },

  /* ======================================================== SEGUNDA CARREIRA */
  {
    id: 'car_segunda', tipo: 'decisao', idade: [38, 58], tema: 'trabalho', repetir: 10, peso: 2,
    quando: c => {
      const e = c.v.trabalho.atual;
      if (!e || e.posAposentadoria || e.formacaoAte || c.v.trabalho.pausa) return false;
      const oc = ocupacao(e.ocupacaoId);
      const anos = (c.v.trabalho.experiencia[oc.trilha] ?? 0) / 12;
      const cansado = c.v.mente.estresse >= 55 || c.v.mente.felicidade <= 45 || e.desempenho < 50;
      return anos >= 12 && cansado && familiaDaTrilha(oc.trilha).saidas.length > 0;
    },
    titulo: c => `${idade(c.v)} anos, e a mesma estrada`,
    texto: c => { const oc = ocupacao(c.v.trabalho.atual!.ocupacaoId); return `${Math.floor((c.v.trabalho.experiencia[oc.trilha] ?? 0) / 12)} anos de ${ROTULO_TRILHA[oc.trilha] ?? 'trabalho'}. O corpo e a cabeça já não respondem como antes a esse trabalho. Gente da sua idade tem recomeçado — em outra área, num concurso, num negócio, estudando de novo.`; },
    opcoes: [
      { id: 'vizinha', texto: 'Ir para uma área vizinha, onde o que sabe ainda vale', disponivel: c => (vizinha(c.v) ? true : 'Não há vaga assim ao alcance agora.'), comportamento: { coragem: 1 },
        resolver: c => { const oc = vizinha(c.v); return { texto: oc ? `Você começou a procurar em outra direção. Uma porta apareceu: ${nomeOcupacao(c.v, oc)}.` : 'Não havia nada naquela direção.', memoria: null, efeito: () => { if (oc) novaOportunidade(c.v, { tipo: 'vaga', ocupacaoId: oc.id, meses: 12, chave: 'segunda_carreira', bonus: 0.2, titulo: 'Uma segunda carreira', texto: `O que você aprendeu em anos de estrada abre uma porta ao lado: ${nomeOcupacao(c.v, oc)}.` }); fato(c, 'quis_mudar_area'); } }; } },
      { id: 'estudar', texto: 'Voltar a estudar para outra coisa', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Você se matriculou num curso à noite, entre gente com metade da sua idade — e alguns com o dobro.', memoria: `Decidiu recomeçar os estudos aos ${idade(c.v)}.`, efeito: () => fato(c, 'plano_estudar') }) },
      { id: 'concurso', texto: 'Estudar para um concurso', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Apostila na mesa da cozinha, de novo.', memoria: null, efeito: () => { if (!c.v.rotinas.some(r => r.id === 'estudar_concurso')) c.v.rotinas.push({ id: 'estudar_concurso', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'ficar', texto: 'Ficar: é o que sei fazer, e faço bem', resolver: c => ({ texto: 'Você decidiu que o que tinha bastava. E bastava.', memoria: null, efeito: () => feliz(c, 2) }) }
    ]
  }
];

/* -------------------------------------------------------------- Auxiliares */

function tensaoPessoa(v: Vida, id: string, n: number): void { const vin = v.vinculos[id]; if (vin) vin.tensao = clamp(vin.tensao + n); }

function melhorArte(v: Vida) {
  return (['musica', 'teatro', 'danca', 'desenho', 'escrita', 'fotografia'] as const).slice().sort((a, b) => habilidade(v, b) - habilidade(v, a))[0];
}

/** Formalizar como MEI: contribui, emite nota, alguns clientes a mais. */
export function formalizar(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e) return;
  e.mei = true;
  if (e.contrato === 'informal') e.contrato = 'autonomo';
  if (e.clientela !== undefined) e.clientela = clamp(e.clientela + 6);
  marcarFato(v, 'formalizou_mei');
  marcar(v, 'conquista', 'Formalizou o trabalho como MEI.', 2);
}

/** Onde a experiência militar vale na vida civil (reserva). */
function segundaCarreira(v: Vida) {
  const m = v.caminhos.militar;
  const esp = m?.especialidade ? ESPECIALIDADES[m.especialidade].trilhaCivil : undefined;
  const trilhas = [...new Set([esp, 'vigilancia', 'logistica', 'administrativo', 'ensino_tecnico'].filter(Boolean) as string[])];
  return OCUPACOES.filter(oc => trilhas.includes(oc.trilha) && !oc.concurso && !oc.entrada && oc.contrato !== 'estagio' && oc.contrato !== 'aprendiz')
    .map(oc => ({ oc, d: elegibilidade(v, oc, 'curriculo', 0.2) }))
    .filter(x => x.d.grau === 'permitido' || x.d.grau === 'improvavel')
    .sort((a, b) => b.oc.nivel - a.oc.nivel || b.oc.salario - a.oc.salario)[0]?.oc;
}

/** Uma área vizinha (as saídas da família de carreira) onde a pessoa conseguiria entrar. */
function vizinha(v: Vida) {
  const e = v.trabalho.atual;
  if (!e) return undefined;
  const f = familiaAtual(v);
  const saidas = f?.saidas ?? [];
  return OCUPACOES.filter(oc => saidas.includes(oc.trilha) && !oc.concurso && !oc.entrada && oc.contrato !== 'estagio' && oc.contrato !== 'aprendiz' && oc.id !== e.ocupacaoId)
    .map(oc => ({ oc, d: elegibilidade(v, oc, 'curriculo', 0.15) }))
    .filter(x => x.d.grau === 'permitido')
    .sort((a, b) => b.oc.nivel - a.oc.nivel || b.oc.salario - a.oc.salario)[0]?.oc;
}

void feliz; void tensao; void anoDe;
