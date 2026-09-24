/**
 * Caminhos: as decisões e os acontecimentos que ligam a vida vivida às
 * portas profissionais. Quase tudo aqui é disparado por estado (passou na
 * peneira, a base dispensou, a carreira parou, o desemprego durou, o
 * negócio apertou), não sorteado do nada.
 *
 * Regras de agência: o jogador escolhe a reação; o texto do acontecimento só
 * narra o mundo. Escolhas de caminho (ir para a base, assinar contrato,
 * entrar numa banda) não movem personalidade por si; persistir depois de um
 * fracasso, arriscar, voltar atrás — isso é comportamento.
 */

import type { Conteudo, Ctx } from './base';
import * as P from './papeis';
import { estresse, fato, feliz } from './efeitos';
import { escrever, idade, lembrarCom, marcarFato, parceiro, temFato, idadePessoa } from '../nucleo';
import { encerrarCarreira, entrarNaBase, fazerPeneira, nomeDeClube, profissionalizar } from '../sistemas/esporte';
import { MODS, MODS_ARTE, municipioPorIndice, novaOportunidade } from '../sistemas/oportunidades';
import { criarProjeto } from '../sistemas/arte';
import { contratar, degrausAcima, elegibilidade, encerrarEmprego, experienciaNaTrilha, horizonte, nomeOcupacao, porContaPropria, textoDeContratacao } from '../sistemas/trabalho';
import { OCUPACOES, ocupacao, ROTULO_TRILHA } from '../dados/ocupacoes';
import { curso, CURSOS } from '../dados/cursos';
import { capitalDoEstado } from '../sistemas/escola';
import { mediaEscolar, habilidade } from '../sistemas/frentes';
import { marcar } from '../sistemas/marcas';
import { abrirNegocio, fecharNegocio, NEGOCIOS } from '../sistemas/negocio';
import { mudarAgora, custoDeMudanca } from '../sistemas/processos';
import { economiaLocal, municipio, nivelDeOferta } from '../dados/lugares';
import { modeloRotina, podeComecarRotina } from '../sistemas/rotinas';
import { anoDe } from '../tempo';
import { clamp } from '../rng';
import { editaisAbertos } from '../sistemas/concurso';

const mod = (c: Ctx) => MODS[c.v.fatos['peneira_mod'] ?? 0] ?? 'futebol';
const lugarPeneira = (c: Ctx) => municipioPorIndice(c.v.fatos['peneira_lugar'] ?? -1) ?? c.v.moradia.municipioId;

function melhorEntrada(c: Ctx) {
  return OCUPACOES.filter(oc => !oc.concurso && !oc.entrada && oc.contrato !== 'estagio' && oc.contrato !== 'aprendiz')
    .map(oc => ({ oc, d: elegibilidade(c.v, oc) }))
    .filter(x => x.d.grau === 'permitido')
    .sort((a, b) => (b.d.chance ?? 0) * (1 + b.oc.salario / 8000) - (a.d.chance ?? 0) * (1 + a.oc.salario / 8000))[0]?.oc;
}

function autonomoPossivel(c: Ctx) {
  return OCUPACOES.filter(oc => porContaPropria(oc) && oc.promocao === 'clientela')
    .filter(oc => elegibilidade(c.v, oc).grau === 'permitido')
    .sort((a, b) => b.salario - a.salario)[0];
}

export const CAMINHOS: Conteudo[] = [
  /* ============================================================= ESPORTE */
  {
    id: 'esp_peneira', tipo: 'decisao', idade: [10, 19], tema: 'lazer', manual: true, repetir: 0,
    titulo: c => (mod(c) === 'futebol' ? 'A peneira' : 'A seletiva'),
    texto: c => `${municipio(lugarPeneira(c)).nome}, oito da manhã. ${mod(c) === 'futebol' ? 'Duzentos garotos de colete, três treinadores de prancheta' : 'Dezenas de atletas, cronômetro na mão dos técnicos'}. Você tem uma chance de mostrar o que sabe.`,
    opcoes: [
      { id: 'simples', texto: 'Jogar simples, sem errar', resolver: c => peneira(c, 0.02) },
      { id: 'arriscar', texto: 'Arriscar para aparecer', comportamento: { coragem: 1 }, resolver: c => peneira(c, habilidade(c.v, mod(c)) >= 70 ? 0.08 : -0.06) },
      { id: 'nervoso', texto: 'Pedir para alguém de casa ir junto', disponivel: c => (P.genitor(c.v).length ? true : false), comportamento: { familia: 1 },
        resolver: c => { const g = P.genitor(c.v)[0]; if (g) lembrarCom(c.v, g.id, `Foi junto na ${mod(c) === 'futebol' ? 'peneira' : 'seletiva'}.`, 'apoio', 2); return peneira(c, 0); } }
    ]
  },
  {
    id: 'esp_base', tipo: 'decisao', idade: [11, 20], tema: 'lazer', prioritario: true, prioridade: 4,
    quando: c => temFato(c.v, 'convite_base') && !c.v.caminhos.esporte,
    titulo: 'O convite',
    texto: c => {
      const longe = lugarPeneira(c) !== c.v.moradia.municipioId;
      return `O ${nomeDeClube(lugarPeneira(c), `${c.v.id}:${c.v.fatos['convite_base']}`, mod(c))} quer você ${mod(c) === 'futebol' ? 'na base' : 'na equipe'}. Treino todo dia${longe ? `, alojamento em ${municipio(lugarPeneira(c)).nome}` : ''}, escola à noite. ${P.genitor(c.v)[0] ? `${P.genitor(c.v)[0].nome} diz que a decisão é sua.` : ''}`;
    },
    opcoes: [
      { id: 'ir', texto: c => (lugarPeneira(c) !== c.v.moradia.municipioId ? `Ir — mesmo longe de casa` : 'Ir para a base'),
        resolver: c => {
          const lugar = lugarPeneira(c);
          const clube = nomeDeClube(lugar, `${c.v.id}:${c.v.fatos['convite_base']}`, mod(c));
          delete c.v.fatos['convite_base'];
          return { texto: 'A mochila ficou pesada de chuteira e caderno. O sonho, agora, tem horário.', memoria: null, efeito: () => entrarNaBase(c.v, mod(c), lugar, clube) };
        } },
      { id: 'ficar', texto: 'Ficar: a escola e a vida daqui vêm primeiro',
        resolver: c => { delete c.v.fatos['convite_base']; return { texto: `Você agradeceu. ${mod(c) === 'futebol' ? 'A bola' : 'O esporte'} continuou nos fins de semana.`, memoria: `Recusou o convite ${mod(c) === 'futebol' ? 'da base de um clube' : 'de uma equipe'} para ficar perto de casa e da escola.`, relevancia: 'marco' }; } }
    ]
  },
  {
    id: 'esp_contrato', tipo: 'decisao', idade: [16, 24], tema: 'trabalho', manual: true, repetir: 0,
    titulo: 'O contrato',
    texto: c => `Um papel de três páginas: salário, prazo, multa. ${c.v.educacao.basica ? 'A escola ainda não acabou.' : c.v.educacao.matricula ? 'A faculdade teria de esperar.' : ''} Quase ninguém que começou com você chegou até aqui.`,
    opcoes: [
      { id: 'assinar', texto: 'Assinar', resolver: c => ({ texto: 'A caneta falhou na primeira tentativa. Na segunda, foi.', memoria: null, efeito: () => profissionalizar(c.v, c.r, c.v.fatos['contrato_nivel'] ?? 1) }) },
      { id: 'estudar', texto: 'Recusar e seguir outro caminho',
        resolver: c => ({ texto: 'Você disse não ao que quase todo mundo diria sim.', memoria: 'Recusou um contrato profissional para seguir outro caminho.', relevancia: 'marco', efeito: () => { const e = c.v.caminhos.esporte; if (e) encerrarCarreira(c.v, e, 'escolha'); } }) }
    ]
  },
  {
    id: 'esp_dispensa', tipo: 'decisao', idade: [13, 23], tema: 'lazer', prioritario: true, prioridade: 3, repetir: 3,
    quando: c => c.v.caminhos.esporte?.fase === 'encerrada' && c.v.caminhos.esporte.motivoFim === 'dispensa' && c.v.caminhos.esporte.tFim === c.v.t,
    titulo: 'Depois da dispensa',
    texto: c => `O ${c.v.caminhos.esporte!.clube} mandou embora ${c.v.fatos['peneiras_' + c.v.caminhos.esporte!.modalidade] && c.v.fatos['peneiras_' + c.v.caminhos.esporte!.modalidade]! > 1 ? 'de novo' : ''} metade da categoria. Você estava na metade. Os colegas de escola não entendem direito o que acabou.`,
    opcoes: [
      { id: 'tentar', texto: 'Treinar mais e tentar outro clube', comportamento: { disciplina: 1 },
        disponivel: c => ((c.v.fatos['peneiras_' + c.v.caminhos.esporte!.modalidade] ?? 0) < 3 && idade(c.v) <= 18 ? true : 'Já não há idade nem peneira para isso.'),
        resolver: c => ({ texto: 'Você voltou para o treino na semana seguinte. Ninguém mandou.', memoria: 'Foi dispensado e decidiu tentar de novo.'.replace('dispensado', c.g('dispensado', 'dispensada', 'dispensade')), efeito: () => { const e = c.v.caminhos.esporte!; delete c.v.caminhos.ultimas[`peneira_${e.modalidade}`]; c.v.caminhos.esporte = undefined; const rot = c.v.rotinas.find(x => x.id === e.modalidade); if (rot) rot.nivel = 2; } }) },
      { id: 'gosto', texto: 'Continuar jogando por gosto',
        resolver: () => ({ texto: 'A bola voltou a ser de fim de semana. Doeu menos do que parecia.', memoria: null }) },
      { id: 'largar', texto: 'Largar de vez',
        resolver: c => ({ texto: 'Você guardou a chuteira no fundo do armário.', memoria: null, efeito: () => { const d = c.v.caminhos.esporte!.modalidade; c.v.rotinas = c.v.rotinas.filter(x => x.id !== d); } }) }
    ]
  },
  {
    id: 'esp_fim_carreira', tipo: 'decisao', idade: [20, 45], tema: 'trabalho', prioritario: true, prioridade: 3, repetir: 5,
    quando: c => c.v.caminhos.esporte?.fase === 'encerrada' && c.v.caminhos.esporte.tFim === c.v.t && temFato(c.v, 'fim_carreira_esportiva') && !c.v.trabalho.atual,
    titulo: 'E agora, sem o campo?',
    texto: c => `Foram ${Math.max(1, Math.round((c.v.caminhos.esporte!.tFim! - c.v.caminhos.esporte!.tInicio) / 12))} anos de treino e concentração. O corpo ainda acorda na hora do treino. ${c.v.educacao.escolaridade === 'medio' || c.v.educacao.escolaridade === 'medio_incompleto' ? 'O diploma que você tem é o do médio.' : ''}`,
    opcoes: [
      { id: 'treinador', texto: 'Treinar crianças numa escolinha',
        disponivel: c => (elegibilidade(c.v, ocupacao('treinador_escolinha')).grau === 'permitido' ? true : 'Ainda não dá.'),
        resolver: c => ({ texto: 'Na primeira aula, um menino perguntou se você já tinha jogado na TV.', memoria: null, efeito: () => { const e = contratar(c.v, c.r, ocupacao('treinador_escolinha'), 'transicao'); escrever(c.v, { texto: textoDeContratacao(c.v, ocupacao('treinador_escolinha'), e), relevancia: 'marco', tema: 'trabalho', tom: 'bom' }); } }) },
      { id: 'comissao', texto: 'Aceitar o convite para a comissão técnica',
        disponivel: c => ((c.v.caminhos.esporte?.nivel ?? 1) >= 3 && idade(c.v) >= 28 ? true : false),
        resolver: c => ({ texto: 'Do outro lado da linha lateral, o jogo parece outro.', memoria: null, efeito: () => { const e = contratar(c.v, c.r, ocupacao('auxiliar_tecnico'), 'oportunidade'); escrever(c.v, { texto: textoDeContratacao(c.v, ocupacao('auxiliar_tecnico'), e), relevancia: 'marco', tema: 'trabalho', tom: 'bom' }); } }) },
      { id: 'estudar', texto: 'Voltar a estudar',
        resolver: c => ({ texto: 'Você foi atrás dos cursos. Sentar numa carteira de novo pareceu estranho.', memoria: 'Depois do esporte, decidiu voltar a estudar.', efeito: () => fato(c, 'plano_estudar') }) },
      { id: 'recomecar', texto: 'Recomeçar em outra coisa, sem pressa', resolver: () => ({ texto: 'Você tirou um tempo. Depois, veria.', memoria: null }) }
    ]
  },

  /* ================================================================ ARTE */
  {
    id: 'arte_projeto', tipo: 'decisao', idade: [13, 50], tema: 'lazer', manual: true, repetir: 0,
    titulo: c => (MODS_ARTE[c.v.fatos['projeto_convite'] ?? 0] === 'musica' ? 'A banda' : 'O grupo'),
    texto: c => `${c.p.amigo ? `${c.p.amigo.nome} já tem nome para ${MODS_ARTE[c.v.fatos['projeto_convite'] ?? 0] === 'musica' ? 'a banda' : 'o grupo'} e um lugar para ensaiar.` : 'Tem gente, tem lugar para ensaiar e falta você.'} Ensaio todo sábado — ${semanaCheia(c) ? 'e a sua semana já está apertada' : 'e alguma coisa da semana vai ter de ceder'}.`,
    opcoes: [
      { id: 'entrar', texto: 'Entrar', resolver: c => ({ texto: 'No primeiro ensaio, ninguém acertou a entrada. No terceiro, quase todo mundo.', memoria: null, efeito: () => { const d = MODS_ARTE[c.v.fatos['projeto_convite'] ?? 0]; delete c.v.fatos['projeto_convite']; criarProjeto(c.v, c.r, d, c.p.amigo?.id); } }) },
      { id: 'recusar', texto: 'Recusar: é só por gosto', resolver: c => { delete c.v.fatos['projeto_convite']; return { texto: 'Você continuou tocando do seu jeito, no seu tempo.', memoria: null }; } }
    ]
  },

  /* =============================================================== ESCOLA */
  {
    id: 'esc_selecao_if', tipo: 'decisao', idade: [13, 16], tema: 'escola', manual: true, repetir: 0,
    titulo: 'A prova do instituto federal',
    texto: () => 'Três anos de dia inteiro, uniforme cinza, laboratório — e um diploma de técnico junto com o do médio. A prova é concorrida. Qual curso?',
    opcoes: [0, 1, 2].map(k => ({
      id: `curso${k}`,
      texto: (c: Ctx) => { const x = cursosDoIf(c)[k]; return x ? `Tentar ${x.nome.replace(/^Técnico em /, '')}` : '—'; },
      disponivel: (c: Ctx) => (cursosDoIf(c)[k] ? true : false),
      resolver: (c: Ctx) => selecaoIf(c, k)
    })).concat([{ id: 'nao', texto: () => 'Não fazer a prova', disponivel: () => true, resolver: () => ({ texto: 'Você seguiu na escola de sempre.', memoria: null }) } as never])
  },
  {
    id: 'esc_olimpiada', tipo: 'acontecimento', idade: [10, 17], tema: 'escola', repetir: 3,
    quando: c => !!c.v.educacao.basica && habilidade(c.v, 'exatas') >= 60 && c.r.chance(0.35),
    narrar: c => {
      const ouro = habilidade(c.v, 'exatas') >= 78;
      const texto = c.vezes === 0 ? `Ganhou uma medalha ${ouro ? 'de prata' : 'de bronze'} na olimpíada de matemática das escolas públicas. O nome saiu num cartaz na entrada da escola.` : `Mais uma medalha na olimpíada de matemática${ouro ? ' — dessa vez, entre as melhores do estado' : ''}.`;
      return { texto, relevancia: c.vezes === 0 ? 'biografia' : 'cotidiano', tom: 'bom', efeito: () => { fato(c, 'medalha_obmep'); feliz(c, 4); const f = c.v.caminhos.frentes.exatas; if (f) f.interesse = clamp(f.interesse + 10); if (c.vezes === 0) marcar(c.v, 'conquista', texto, 2, { dominio: 'exatas' }); } };
    }
  },
  {
    id: 'esc_feira_ciencias', tipo: 'acontecimento', idade: [10, 17], tema: 'escola', repetir: 3,
    quando: c => c.v.rotinas.some(r => r.id === 'clube_ciencias') && habilidade(c.v, 'ciencias') >= 45 && c.r.chance(0.5),
    narrar: c => {
      const ganhou = habilidade(c.v, 'ciencias') >= 58;
      const texto = ganhou ? `O projeto do clube de ciências ${c.r.pick(['— um filtro de água de garrafa PET —', '— um sensor de chuva feito de sucata —', '— uma horta que se rega sozinha —'])} ganhou a feira regional.` : 'O projeto do clube de ciências foi para a feira da cidade. Não ganhou, mas um professor da universidade parou para perguntar.';
      return { texto, relevancia: 'biografia', tom: 'bom', efeito: () => { const f = c.v.caminhos.frentes.ciencias; if (f) f.interesse = clamp(f.interesse + 8); if (ganhou) marcar(c.v, 'conquista', texto, 2, { dominio: 'ciencias' }); } };
    }
  },
  {
    id: 'esc_gremio_eleicao', tipo: 'acontecimento', idade: [13, 17], tema: 'escola',
    quando: c => c.v.rotinas.some(r => r.id === 'gremio') && habilidade(c.v, 'lideranca') >= 38,
    narrar: c => { const texto = `Foi ${c.g('eleito presidente', 'eleita presidenta', 'eleite presidente')} do grêmio, com uma chapa montada na hora do recreio.`; return { texto, relevancia: 'biografia', tom: 'bom', efeito: () => marcar(c.v, 'conquista', texto, 2, { dominio: 'lideranca' }) }; }
  },

  /* ============================================================= MILITAR */
  {
    id: 'mil_alistamento', tipo: 'decisao', idade: [18, 18], tema: 'lugar', garantido: true,
    quando: c => c.v.eu.genero === 'masculino',
    titulo: 'O alistamento',
    texto: () => 'Fila na junta militar, formulário, exame. Na ficha, uma pergunta: você deseja servir?',
    opcoes: [
      { id: 'servir', texto: 'Dizer que quer servir', resolver: c => alistar(c, 0.45) },
      { id: 'tanto_faz', texto: 'Não fazer questão', resolver: c => alistar(c, 0.05) }
    ]
  },
  {
    id: 'mil_engajar', tipo: 'decisao', idade: [18, 27], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 1,
    quando: c => ['soldado_ep', 'cabo_ep'].includes(c.v.trabalho.atual?.ocupacaoId ?? '') && c.v.t - c.v.trabalho.atual!.tInicio >= 12 && idade(c.v) <= 25,
    titulo: 'Fim do ano no quartel',
    texto: c => `O ano de serviço acabou. O sargento perguntou quem quer engajar e ficar mais um ano. ${c.v.educacao.escolaridade === 'medio' ? 'Alguns colegas vão prestar a escola de sargentos.' : ''}`,
    opcoes: [
      { id: 'engajar', texto: 'Engajar por mais um ano', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Mais um ano de farda, de formatura às seis e de soldo no fim do mês.', memoria: null }) },
      { id: 'baixa', texto: 'Dar baixa', resolver: c => ({ texto: 'Você devolveu a farda e saiu pelo portão de sempre, agora sem voltar.', memoria: 'Deu baixa do Exército depois do serviço militar.', efeito: () => { encerrarEmprego(c.v, 'baixa do serviço militar'); marcar(c.v, 'fim_carreira', 'Deu baixa do Exército.', 2); } }) }
    ]
  },

  /* ========================================================= MEIA-CARREIRA */
  {
    id: 'car_estagnacao', tipo: 'decisao', idade: [30, 58], tema: 'trabalho', repetir: 8, peso: 4,
    quando: c => {
      const e = c.v.trabalho.atual;
      if (!e || e.clientela !== undefined || e.posAposentadoria || e.formacaoAte || temFato(c.v, 'aceitou_estabilidade_' + e.ocupacaoId)) return false;
      const oc = ocupacao(e.ocupacaoId);
      if (oc.promocao === 'antiguidade' || oc.trilha === 'atleta') return false;
      return (c.v.t - (e.tPosto ?? e.tInicio)) >= 72;
    },
    titulo: c => `${Math.floor((c.v.t - (c.v.trabalho.atual!.tPosto ?? c.v.trabalho.atual!.tInicio)) / 12)} anos no mesmo lugar`,
    texto: c => `Mesma mesa, mesmo crachá, ${nomeOcupacao(c.v, ocupacao(c.v.trabalho.atual!.ocupacaoId))} há anos. ${horizonte(c.v) ?? ''}`,
    opcoes: [
      { id: 'estudar', texto: 'Voltar a estudar para destravar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você abriu o site de cursos numa noite de domingo e não fechou mais.', memoria: 'Decidiu voltar a estudar depois de anos parado no mesmo cargo.', relevancia: 'biografia', efeito: () => fato(c, 'plano_estudar') }) },
      { id: 'outra_empresa', texto: 'Procurar outra empresa',
        resolver: c => {
          const oc = ocupacao(c.v.trabalho.atual!.ocupacaoId);
          const alvo = degrausAcima(oc).find(x => elegibilidade(c.v, x).grau === 'permitido') ?? oc;
          const achou = c.r.chance(0.55);
          if (achou) novaOportunidade(c.v, { tipo: 'vaga', ocupacaoId: alvo.id, meses: 12, chave: 'troca_empresa', bonus: 0.2, titulo: 'Uma vaga lá fora', texto: `Depois de alguns currículos, uma empresa chamou: ${nomeOcupacao(c.v, alvo)}${alvo.id === oc.id ? ', por um salário melhor' : ''}.` });
          return { texto: achou ? 'Os currículos saíram. Uma resposta veio — está em "Ao seu alcance".' : 'Os currículos saíram. As respostas, não.', memoria: null };
        } },
      { id: 'mudar', texto: 'Mudar de área', comportamento: { coragem: 1 },
        resolver: c => {
          const alt = autonomoPossivel(c) ?? OCUPACOES.filter(x => x.trilha !== ocupacao(c.v.trabalho.atual!.ocupacaoId).trilha && !x.concurso && !x.entrada && elegibilidade(c.v, x).grau === 'permitido').sort((a, b) => b.salario - a.salario)[0];
          if (alt) novaOportunidade(c.v, { tipo: 'vaga', ocupacaoId: alt.id, meses: 12, chave: 'mudar_area', bonus: 0.15, titulo: 'Outra área', texto: `O que você sabe fazer abre uma porta diferente: ${nomeOcupacao(c.v, alt)}.` });
          return { texto: alt ? 'Você começou a olhar para o que sabe fazer além do cargo. Havia uma porta.' : 'Você procurou uma saída. Por ora, nenhuma cabia no que você sabe fazer — estudar talvez abra.', memoria: null, efeito: () => fato(c, 'quis_mudar_area') };
        } },
      { id: 'ficar', texto: 'Está bom assim',
        resolver: c => ({ texto: 'A estabilidade também é uma escolha. Você fez a sua.', memoria: null, efeito: () => { c.v.fatos['aceitou_estabilidade_' + c.v.trabalho.atual!.ocupacaoId] = c.v.t; marcar(c.v, 'estagnacao', `Escolheu ficar como ${nomeOcupacao(c.v, ocupacao(c.v.trabalho.atual!.ocupacaoId))}.`, 1); } }) }
    ]
  },
  {
    id: 'des_longo', tipo: 'decisao', idade: [20, 62], tema: 'trabalho', repetir: 3, prioritario: true, prioridade: 1,
    quando: c => !c.v.trabalho.atual && !c.v.trabalho.aposentadoria && !c.v.educacao.matricula && c.v.trabalho.desempregadoDesde !== undefined && c.v.t - c.v.trabalho.desempregadoDesde >= 24,
    titulo: c => `${Math.floor((c.v.t - c.v.trabalho.desempregadoDesde!) / 12)} anos sem trabalho fixo`,
    texto: c => `Currículo enviado para tudo quanto é lugar. ${c.v.rotinas.some(r => r.id === 'bico') ? 'Os bicos seguram parte das contas.' : 'As contas chegam do mesmo jeito.'} ${parceiro(c.v) ? `${parceiro(c.v)!.p.nome} pergunta, com cuidado, o que você pensa fazer.` : ''}`,
    opcoes: [
      { id: 'qualquer', texto: 'Aceitar o que aparecer', disponivel: c => (melhorEntrada(c) ? true : 'Nem isso apareceu por aqui.'),
        resolver: c => { const oc = melhorEntrada(c)!; return { texto: `Você aceitou a primeira vaga que disse sim: ${nomeOcupacao(c.v, oc)}.`, memoria: null, efeito: () => { const e = contratar(c.v, c.r, oc, 'necessidade'); escrever(c.v, { texto: `${textoDeContratacao(c.v, oc, e)} Abaixo do que esperava, acima de nada.`, relevancia: 'marco', tema: 'trabalho' }); } }; } },
      { id: 'estudar', texto: 'Voltar a estudar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Um curso técnico, uma qualificação, uma faculdade à noite: você foi ver o que cabia.', memoria: 'Desempregado, decidiu voltar a estudar.'.replace('Desempregado', c.g('Desempregado', 'Desempregada', 'Desempregade')), efeito: () => fato(c, 'plano_estudar') }) },
      { id: 'cidade', texto: 'Tentar a vida numa cidade maior', comportamento: { coragem: 1 },
        disponivel: c => (nivelDeOferta(c.v.moradia.municipioId) >= 2 ? false : c.v.financas.conta + c.v.financas.reserva >= custoDeMudanca(c.v.moradia.municipioId, capitalDoEstado(c.v.moradia.municipioId)) ? true : 'Não há dinheiro nem para a mudança.'),
        resolver: c => ({ texto: 'Uma mala, um endereço de conhecido, a rodoviária de madrugada.', memoria: null, efeito: () => { const d = capitalDoEstado(c.v.moradia.municipioId); c.v.financas.conta -= custoDeMudanca(c.v.moradia.municipioId, d); mudarAgora(c.v, d, 'atrás de trabalho'); marcar(c.v, 'mudanca_cidade', `Mudou-se para ${municipio(d).nome} atrás de trabalho.`, 2); marcarFato(c.v, 'mudou_por_trabalho'); } }) },
      { id: 'conta', texto: 'Trabalhar por conta', disponivel: c => (autonomoPossivel(c) ? true : false),
        resolver: c => { const oc = autonomoPossivel(c)!; return { texto: `Você imprimiu uns cartões e avisou todo mundo: ${nomeOcupacao(c.v, oc)}, atende em casa.`, memoria: null, efeito: () => { const e = contratar(c.v, c.r, oc, 'por_conta'); escrever(c.v, { texto: textoDeContratacao(c.v, oc, e), relevancia: 'marco', tema: 'trabalho' }); } }; } },
      { id: 'procurar', texto: 'Continuar procurando', resolver: () => ({ texto: 'Mais um mês de currículo. Mais um.', memoria: null }) }
    ]
  },
  {
    id: 'neg_aperto', tipo: 'decisao', idade: [18, 80], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 2,
    quando: c => (c.v.caminhos.negocio?.anosNoVermelho ?? 0) >= 2 && c.v.caminhos.negocio?.estado !== 'fechado',
    titulo: c => `${c.v.caminhos.negocio!.nome} no vermelho`,
    texto: c => `Dois anos de movimento fraco. O aluguel do ponto não espera, o fornecedor já liga duas vezes. ${parceiro(c.v) ? `${parceiro(c.v)!.p.nome} não diz nada, mas faz as contas na mesa da cozinha.` : ''}`,
    opcoes: [
      { id: 'fechar', texto: 'Fechar', resolver: c => ({ texto: 'Você baixou a porta de ferro pela última vez numa terça-feira.', memoria: null, efeito: () => { fecharNegocio(c.v, 'o movimento não pagou as contas'); encerrarEmprego(c.v, 'fechou o negócio'); estresse(c, 6); } }) },
      { id: 'insistir', texto: 'Insistir, com o dinheiro guardado', comportamento: { disciplina: 1 },
        disponivel: c => (c.v.financas.conta + c.v.financas.reserva >= 5000 ? true : 'Não há dinheiro guardado para isso.'),
        resolver: c => ({ texto: 'Você pôs mais dinheiro e mais horas. O movimento reagiu um pouco.', memoria: null, efeito: () => { c.v.financas.reserva -= Math.min(c.v.financas.reserva, 5000); if (c.v.financas.reserva < 0) c.v.financas.conta += c.v.financas.reserva; const e = c.v.trabalho.atual; if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + 16); c.v.caminhos.negocio!.anosNoVermelho = 0; estresse(c, 8); } }) },
      { id: 'mudar', texto: 'Mudar o jeito de vender', comportamento: { coragem: 1 },
        resolver: c => { const deu = c.r.chance(0.5); return { texto: deu ? 'Entrega por aplicativo, promoção no bairro, cardápio novo: funcionou mais do que você esperava.' : 'Você mudou tudo. O movimento não mudou.', memoria: null, efeito: () => { const e = c.v.trabalho.atual; if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + (deu ? 20 : 3)); c.v.caminhos.negocio!.anosNoVermelho = deu ? 0 : 1; } }; } }
    ]
  },

  /* ========================================================= APOSENTADORIA */
  {
    id: 'apo_segunda_feira', tipo: 'decisao', idade: [50, 90], tema: 'trabalho', prioritario: true, prioridade: 2,
    quando: c => !!c.v.trabalho.aposentadoria && c.v.t - c.v.trabalho.aposentadoria.t <= 12 && c.v.t > c.v.trabalho.aposentadoria.t && !temFato(c.v, 'bpc'),
    titulo: 'A primeira segunda-feira',
    texto: c => `O despertador tocou por costume e você não tinha para onde ir. ${c.v.trabalho.historico.length ? `Foram muitos anos de ${ROTULO_TRILHA[ocupacao(c.v.trabalho.historico[c.v.trabalho.historico.length - 1].ocupacaoId).trilha] ?? 'trabalho'}.` : ''} O dia inteiro pela frente.`,
    opcoes: [
      { id: 'antiga', texto: c => { const d = frenteAntiga(c); return d ? `Voltar a ${VERBOS[d] ?? 'fazer o que fazia'}` : 'Voltar a uma coisa antiga'; }, disponivel: c => (frenteAntiga(c) ? true : false),
        resolver: c => { const d = frenteAntiga(c)!; return { texto: 'As mãos lembraram antes da cabeça.', memoria: `Aposentado, voltou a ${VERBOS[d] ?? 'praticar'}.`.replace('Aposentado', c.g('Aposentado', 'Aposentada', 'Aposentade')), efeito: () => { if (!c.v.rotinas.some(r => r.id === d)) c.v.rotinas.push({ id: d, tInicio: c.v.t, nivel: 1 }); marcar(c.v, 'retomada', `Voltou a ${VERBOS[d] ?? 'praticar'} depois de aposentar.`, 2, { dominio: d as never }); } }; } },
      { id: 'voluntario', texto: 'Oferecer o que sabe como voluntário', comportamento: { generosidade: 1 },
        resolver: c => ({ texto: 'A associação do bairro aceitou na hora. Tinha fila de coisas para fazer.', memoria: null, efeito: () => { if (!c.v.rotinas.some(r => r.id === 'voluntariado')) c.v.rotinas.push({ id: 'voluntariado', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'conta', texto: 'Continuar trabalhando por conta', disponivel: c => (autonomoPossivel(c) ? true : false),
        resolver: c => { const oc = autonomoPossivel(c)!; return { texto: 'Aposentado no papel; na agenda, nem tanto.'.replace('Aposentado', c.g('Aposentado', 'Aposentada', 'Aposentade')), memoria: null, efeito: () => { const e = contratar(c.v, c.r, oc, 'aposentado'); e.posAposentadoria = true; escrever(c.v, { texto: `Depois de aposentar, seguiu trabalhando por conta como ${nomeOcupacao(c.v, oc)}.`, relevancia: 'biografia', tema: 'trabalho' }); } }; } },
      { id: 'descansar', texto: 'Descansar, sem plano', resolver: c => ({ texto: 'Café sem pressa, jornal inteiro, cochilo depois do almoço. Por enquanto, basta.', memoria: null, efeito: () => feliz(c, 3) }) }
    ]
  }
];

const VERBOS: Record<string, string> = { musica: 'tocar', futebol: 'jogar bola', volei: 'jogar vôlei', teatro: 'fazer teatro', danca: 'dançar', desenho: 'desenhar', escrever: 'escrever', natacao: 'nadar', lutas: 'treinar', xadrez: 'jogar xadrez', fotografia: 'fotografar', cozinhar: 'cozinhar', leitura: 'ler' };

function frenteAntiga(c: Ctx): string | undefined {
  const cand = Object.entries(c.v.caminhos.frentes)
    .filter(([d, f]) => f && f.auge >= 35 && modeloRotina(d) && !c.v.rotinas.some(r => r.id === d) && podeComecarRotina(c.v, d, 1).grau === 'permitido')
    .sort((a, b) => (b[1]!.auge) - (a[1]!.auge));
  return cand[0]?.[0];
}

function semanaCheia(c: Ctx): boolean {
  const d = MODS_ARTE[c.v.fatos['projeto_convite'] ?? 0];
  return podeComecarRotina(c.v, d, 3).grau === 'incompativel';
}

function peneira(c: Ctx, ajuste: number) {
  const d = mod(c);
  const passou = fazerPeneira(c.v, c.r, d, ajuste);
  if (passou) {
    c.v.fatos['convite_base'] = c.v.t;
    const texto = `Passou na ${d === 'futebol' ? 'peneira' : 'seletiva'}.`;
    marcar(c.v, 'oportunidade', texto, 3, { dominio: d });
    return { texto: 'No fim do dia, chamaram seu nome. Poucos nomes foram chamados.', memoria: `${texto} Chamaram poucos nomes; o seu foi um deles.`, relevancia: 'marco' as const, tom: 'bom' as const };
  }
  return { texto: 'Chamaram outros nomes. Na volta, o ônibus pareceu mais comprido.', memoria: `Não passou na ${d === 'futebol' ? 'peneira' : 'seletiva'} do clube.`, relevancia: 'biografia' as const, tom: 'ruim' as const };
}

function cursosDoIf(c: Ctx) {
  const agro = economiaLocal(c.v.moradia.municipioId).custo < 0.95 || municipio(c.v.moradia.municipioId).perfil === 'pequena';
  const base = ['tec_informatica', agro ? 'tec_agropecuaria' : 'tec_eletrotecnica', ['tec_mecanica', 'tec_edificacoes', 'tec_administracao'][Math.floor((anoDe(c.v.eu.tNasc) % 3))]];
  return base.map(id => CURSOS.find(x => x.id === id)!).filter(Boolean);
}

function selecaoIf(c: Ctx, k: number) {
  const cc = cursosDoIf(c)[k];
  const chance = clamp(0.12 + (mediaEscolar(c.v) - 40) / 45 + (c.v.educacao.postura === 'dedicada' ? 0.08 : 0), 0.05, 0.8);
  if (c.r.chance(chance) && c.v.educacao.basica) {
    return {
      texto: `Passou. Em fevereiro, começa o médio integrado em ${cc.nome.replace(/^Técnico em /, '')}.`,
      memoria: `Passou na prova do instituto federal: médio integrado ao técnico em ${cc.nome.replace(/^Técnico em /, '')}.`,
      relevancia: 'marco' as const, tom: 'bom' as const,
      efeito: () => { const b = c.v.educacao.basica!; b.integrado = cc.id; b.rede = 'publica'; if (b.etapa === 'fundamental2') { b.etapa = 'medio'; b.serie = 1; } marcar(c.v, 'ingresso', `Médio integrado ao técnico (${curso(cc.id).nome}).`, 3); }
    };
  }
  return { texto: 'A lista saiu e seu nome não estava. O médio seguiu na escola de sempre.', memoria: 'Não passou na prova do instituto federal.', relevancia: 'biografia' as const, tom: 'ruim' as const };
}

function alistar(c: Ctx, chance: number) {
  const aptoFisico = c.v.corpo.saude >= 50;
  if (aptoFisico && c.r.chance(chance)) {
    return {
      texto: 'Na lista de convocados, o seu nome. Um ano de quartel pela frente.',
      memoria: 'Foi convocado para o serviço militar: um ano no quartel da região.',
      relevancia: 'marco' as const,
      efeito: () => {
        const m = c.v.educacao.matricula;
        if (m && !m.trancado) { m.trancado = true; m.tTrancou = c.v.t; escrever(c.v, { texto: 'Trancou o curso para servir.', relevancia: 'cotidiano', tema: 'estudo' }); }
        const oc = ocupacao('soldado_ep');
        contratar(c.v, c.r, oc, 'oportunidade');
        marcar(c.v, 'ingresso', 'Serviço militar: soldado do Exército.', 2, { trilha: oc.trilha });
      }
    };
  }
  return { texto: 'Dispensado por excesso de contingente. O certificado veio pelo correio.', memoria: 'Fez o alistamento militar e foi dispensado por excesso de contingente.', relevancia: 'cotidiano' as const };
}

void NEGOCIOS; void abrirNegocio; void editaisAbertos; void idadePessoa; void experienciaNaTrilha;
