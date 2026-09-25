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

import { disponivel as guardado, pagar as pagarGuardado } from '../sistemas/dinheiro';
import type { Conteudo, Ctx, Resultado } from './base';
import * as P from './papeis';
import { estresse, fato, feliz } from './efeitos';
import { escrever, idade, lembrarCom, marcarFato, parceiro, temFato, idadePessoa } from '../nucleo';
import { encerrarCarreira, entrarNaBase, fazerPeneira, NOME_MOD, nomeDeClube, profissionalizar } from '../sistemas/esporte';
import { avaliarPeneira, ETAPAS_PENEIRA, falaDoTreinador } from '../sistemas/peneira';
import { registrarDevolutiva } from '../sistemas/devolutivas';
import { abalar } from '../sistemas/abalo';
import { MODS, MODS_ARTE, municipioIndice, municipioPorIndice, novaOportunidade } from '../sistemas/oportunidades';
import { criarProjeto } from '../sistemas/arte';
import { contratar, degrausAcima, elegibilidade, encerrarEmprego, experienciaNaTrilha, horizonte, nomeOcupacao, porContaPropria, textoDeContratacao } from '../sistemas/trabalho';
import { OCUPACOES, ocupacao, ROTULO_TRILHA } from '../dados/ocupacoes';
import { curso, CURSOS } from '../dados/cursos';
import { capitalDoEstado } from '../sistemas/escola';
import { habilidade } from '../sistemas/frentes';
import { marcar } from '../sistemas/marcas';
import { abrirNegocio, demitirFuncionario, fecharNegocio, NEGOCIOS, valorDoNegocio, venderNegocio } from '../sistemas/negocio';
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

/**
 * Trabalho por conta ao alcance: não há entrevista, então conta o requisito,
 * não a chance — e só o que tem a ver com a vida da pessoa (estrada na
 * área, ofício aprendido ou formação). Ninguém vira diarista "por conta" por
 * acaso depois de trinta anos de auditoria.
 */
function autonomoPossivel(c: Ctx) {
  const areas = new Set(c.v.educacao.concluidos.map(x => x.area));
  return OCUPACOES.filter(oc => porContaPropria(oc) && oc.promocao === 'clientela')
    .filter(oc => (c.v.trabalho.experiencia[oc.trilha] ?? 0) >= 24 || (!!oc.habilidade && habilidade(c.v, oc.habilidade.dominio) >= oc.habilidade.minimo) || !!oc.area?.some(a => areas.has(a)))
    .filter(oc => { const d = elegibilidade(c.v, oc); return d.grau === 'permitido' || d.grau === 'improvavel'; })
    .sort((a, b) => b.salario - a.salario)[0];
}

export const CAMINHOS: Conteudo[] = [
  /* ============================================================= ESPORTE */
  {
    id: 'esp_peneira', tipo: 'decisao', idade: [10, 19], tema: 'lazer', manual: true, repetir: 0,
    titulo: c => {
      const pr = c.v.caminhos.processo;
      const nome = mod(c) === 'futebol' ? 'A peneira' : 'A seletiva';
      return pr?.tipo === 'peneira' ? `${nome} · ${pr.atual === 0 ? 'o começo' : 'o fim do dia'}` : nome;
    },
    texto: c => {
      const pr = c.v.caminhos.processo;
      const etapa = pr?.tipo === 'peneira' ? ETAPAS_PENEIRA[pr.atual] : undefined;
      if (!etapa) return `${municipio(lugarPeneira(c)).nome}, oito da manhã. ${mod(c) === 'futebol' ? 'Duzentos garotos de colete, três treinadores de prancheta' : 'Dezenas de atletas, cronômetro na mão dos técnicos'}. Você tem uma chance de mostrar o que sabe.`;
      const lugar = pr?.lugar ?? municipio(lugarPeneira(c)).nome;
      const junto = pr?.via === 'familia' && pr.atual > 0 && P.genitor(c.v)[0] ? ` ${P.genitor(c.v)[0].nome} continua na arquibancada.` : '';
      return etapa.texto(mod(c), lugar) + junto;
    },
    opcoes: [
      ...[0, 1, 2, 3].map(k => ({
        id: `p${k}`,
        texto: (c: Ctx) => { const pr = c.v.caminhos.processo; return pr?.tipo === 'peneira' ? ETAPAS_PENEIRA[pr.atual]?.opcoes[k]?.texto(mod(c)) ?? '—' : '—'; },
        disponivel: (c: Ctx) => {
          const pr = c.v.caminhos.processo;
          const op = pr?.tipo === 'peneira' ? ETAPAS_PENEIRA[pr.atual]?.opcoes[k] : undefined;
          if (!op) return false;
          return op.id === 'familia' ? P.genitor(c.v).length > 0 : true;
        },
        resolver: (c: Ctx) => etapaDaPeneira(c, k)
      })),
      // Saves de antes das etapas: a peneira de um clique continua resolvível.
      { id: 'simples', texto: 'Jogar simples, sem errar', disponivel: () => false, resolver: c => peneira(c, 0.02) },
      { id: 'arriscar', texto: 'Arriscar para aparecer', disponivel: () => false, resolver: c => peneira(c, habilidade(c.v, mod(c)) >= 70 ? 0.08 : -0.06) },
      { id: 'nervoso', texto: 'Pedir para alguém de casa ir junto', disponivel: () => false, resolver: c => peneira(c, 0) }
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
      { id: 'preparo', texto: 'Trabalhar na preparação física de um clube', disponivel: c => (elegibilidade(c.v, ocupacao('preparador_fisico')).grau === 'permitido' ? true : false),
        resolver: c => ({ texto: 'Agora é você quem cobra o treino dos outros.', memoria: null, efeito: () => { const e = contratar(c.v, c.r, ocupacao('preparador_fisico'), 'transicao'); escrever(c.v, { texto: textoDeContratacao(c.v, ocupacao('preparador_fisico'), e), relevancia: 'marco', tema: 'trabalho', tom: 'bom' }); } }) },
      { id: 'lutas', texto: 'Abrir turmas de luta', disponivel: c => (c.v.caminhos.esporte?.modalidade === 'lutas' && elegibilidade(c.v, ocupacao('instrutor_lutas')).grau === 'permitido' ? true : false),
        resolver: c => ({ texto: 'Tatame alugado, turma das seis e das oito.', memoria: null, efeito: () => { const e = contratar(c.v, c.r, ocupacao('instrutor_lutas'), 'transicao'); escrever(c.v, { texto: textoDeContratacao(c.v, ocupacao('instrutor_lutas'), e), relevancia: 'marco', tema: 'trabalho', tom: 'bom' }); } }) },
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
    quando: c => !c.v.justica?.prisao,
    titulo: 'O alistamento',
    texto: c => (c.v.eu.genero === 'masculino'
      ? 'Fila na junta militar, formulário, exame. Na ficha, uma pergunta: você deseja servir?'
      : 'Desde 2025, mulheres podem se alistar voluntariamente no ano em que fazem 18. O site abre em janeiro; as vagas são poucas e há seleção.'),
    opcoes: [
      { id: 'servir', texto: c => (c.v.eu.genero === 'masculino' ? 'Dizer que quer servir' : 'Alistar-se como voluntári' + c.g('o', 'a', 'e')), resolver: c => alistar(c, c.v.eu.genero === 'masculino' ? 0.45 : 0.3) },
      { id: 'tanto_faz', texto: c => (c.v.eu.genero === 'masculino' ? 'Não fazer questão' : 'Não se alistar'), resolver: c => (c.v.eu.genero === 'masculino' ? alistar(c, 0.05) : { texto: 'Você deixou o site fechado.', memoria: null }) }
    ]
  },
  {
    id: 'mil_engajar', tipo: 'decisao', idade: [18, 29], tema: 'trabalho', prioritario: true, prioridade: 2, repetir: 1,
    quando: c => ['soldado_ep', 'cabo_ep'].includes(c.v.trabalho.atual?.ocupacaoId ?? '') && c.v.t - c.v.trabalho.atual!.tInicio >= 12 && (c.v.t - (c.v.caminhos.militar?.tIngresso ?? c.v.trabalho.atual!.tInicio)) < 96,
    titulo: c => ((c.v.t - (c.v.caminhos.militar?.tIngresso ?? c.v.t)) < 24 ? 'Fim do ano no quartel' : 'Mais um ano de farda?'),
    texto: c => {
      const anos = Math.floor((c.v.t - (c.v.caminhos.militar?.tIngresso ?? c.v.t)) / 12);
      return `${anos <= 1 ? 'O ano de serviço acabou.' : `${anos} anos de temporário, de um máximo de oito.`} O sargento perguntou quem quer engajar e ficar mais um ano. ${['medio', 'tecnico', 'superior_incompleto', 'superior'].includes(c.v.educacao.escolaridade) ? 'Alguns colegas estudam à noite para a escola de sargentos — lá, a carreira tem estabilidade.' : 'Sem o ensino médio, a escola de sargentos fica fora de alcance.'}`;
    },
    opcoes: [
      { id: 'engajar', texto: 'Engajar por mais um ano', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Mais um ano de farda, de formatura às seis e de soldo no fim do mês.', memoria: null }) },
      { id: 'carreira', texto: 'Engajar e estudar para a escola de sargentos', comportamento: { disciplina: 2 }, disponivel: c => (['medio', 'tecnico', 'superior_incompleto', 'superior'].includes(c.v.educacao.escolaridade) && idade(c.v) <= 24 ? true : 'Pede ensino médio e menos de 25 anos.'),
        resolver: c => ({ texto: 'Apostila no armário do alojamento, estudo depois do toque de silêncio.', memoria: 'No quartel, começou a estudar para seguir carreira.', efeito: () => { fato(c, 'plano_carreira_militar'); if (!c.v.rotinas.some(r => r.id === 'estudar_concurso')) c.v.rotinas.push({ id: 'estudar_concurso', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'baixa', texto: 'Dar baixa', resolver: c => ({ texto: 'Você devolveu a farda e saiu pelo portão de sempre, agora sem voltar.', memoria: 'Deu baixa depois do serviço militar.', efeito: () => { encerrarEmprego(c.v, 'baixa do serviço militar'); marcar(c.v, 'fim_carreira', 'Deu baixa do serviço militar.', 2); c.v.fatos['mil_baixa'] = c.v.t; } }) }
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
        resolver: c => { const oc = melhorEntrada(c); if (!oc) return { texto: 'Quando você foi atrás, o cenário já era outro. Ficou para depois.', memoria: null }; return { texto: `Você aceitou a primeira vaga que disse sim: ${nomeOcupacao(c.v, oc)}.`, memoria: null, efeito: () => { const e = contratar(c.v, c.r, oc, 'necessidade'); escrever(c.v, { texto: `${textoDeContratacao(c.v, oc, e)} Abaixo do que esperava, acima de nada.`, relevancia: 'marco', tema: 'trabalho' }); } }; } },
      { id: 'estudar', texto: 'Voltar a estudar', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Um curso técnico, uma qualificação, uma faculdade à noite: você foi ver o que cabia.', memoria: 'Desempregado, decidiu voltar a estudar.'.replace('Desempregado', c.g('Desempregado', 'Desempregada', 'Desempregade')), efeito: () => fato(c, 'plano_estudar') }) },
      { id: 'cidade', texto: 'Tentar a vida numa cidade maior', comportamento: { coragem: 1 },
        disponivel: c => (nivelDeOferta(c.v.moradia.municipioId) >= 2 ? false : guardado(c.v) >= custoDeMudanca(c.v.moradia.municipioId, capitalDoEstado(c.v.moradia.municipioId)) ? true : 'Não há dinheiro nem para a mudança.'),
        resolver: c => ({ texto: 'Uma mala, um endereço de conhecido, a rodoviária de madrugada.', memoria: null, efeito: () => { const d = capitalDoEstado(c.v.moradia.municipioId); c.v.financas.conta -= custoDeMudanca(c.v.moradia.municipioId, d); mudarAgora(c.v, d, 'atrás de trabalho'); marcar(c.v, 'mudanca_cidade', `Mudou-se para ${municipio(d).nome} atrás de trabalho.`, 2); marcarFato(c.v, 'mudou_por_trabalho'); } }) },
      { id: 'conta', texto: 'Trabalhar por conta', disponivel: c => (autonomoPossivel(c) ? true : false),
        resolver: c => { const oc = autonomoPossivel(c); if (!oc) return { texto: 'Quando você foi atrás, o cenário já era outro. Ficou para depois.', memoria: null }; return { texto: `Você imprimiu uns cartões e avisou todo mundo: ${nomeOcupacao(c.v, oc)}, atende em casa.`, memoria: null, efeito: () => { const e = contratar(c.v, c.r, oc, 'por_conta'); escrever(c.v, { texto: textoDeContratacao(c.v, oc, e), relevancia: 'marco', tema: 'trabalho' }); } }; } },
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
        disponivel: c => (guardado(c.v) >= 5000 ? true : 'Não há dinheiro guardado para isso.'),
        resolver: c => ({ texto: 'Você pôs mais dinheiro e mais horas. O movimento reagiu um pouco.', memoria: null, efeito: () => { pagarGuardado(c.v, 5000); const e = c.v.trabalho.atual; if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + 16); c.v.caminhos.negocio!.anosNoVermelho = 0; estresse(c, 8); } }) },
      { id: 'mudar', texto: 'Mudar o jeito de vender', comportamento: { coragem: 1 },
        resolver: c => { const deu = c.r.chance(0.5); return { texto: deu ? 'Entrega por aplicativo, promoção no bairro, cardápio novo: funcionou mais do que você esperava.' : 'Você mudou tudo. O movimento não mudou.', memoria: null, efeito: () => { const e = c.v.trabalho.atual; if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + (deu ? 20 : 3)); c.v.caminhos.negocio!.anosNoVermelho = deu ? 0 : 1; } }; } },
      { id: 'enxugar', texto: c => { const f = c.v.caminhos.negocio?.equipe?.[c.v.caminhos.negocio.equipe.length - 1]; return f && c.v.pessoas[f.pessoaId] ? `Enxugar: demitir ${c.v.pessoas[f.pessoaId].nome}, quem entrou por último` : 'Enxugar a equipe'; },
        disponivel: c => ((c.v.caminhos.negocio?.equipe?.length ?? 0) > 0 ? true : false),
        resolver: c => ({ texto: 'A folha ficou menor. O salão, mais silencioso.', memoria: null, tom: 'ruim', efeito: () => { const n = c.v.caminhos.negocio!; const f = n.equipe![n.equipe!.length - 1]; demitirFuncionario(c.v, f.pessoaId); n.anosNoVermelho = 1; } }) },
      { id: 'vender', texto: 'Tentar vender enquanto vale alguma coisa',
        resolver: c => { const n = c.v.caminhos.negocio!; const valor = Math.round(valorDoNegocio(c.v, n) * 0.7 / 1000) * 1000; return { texto: valor > 0 ? `Apareceu um comprador, pagando pouco: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}.` : 'Ninguém quis comprar um negócio no vermelho.', memoria: null, efeito: () => { if (valor > 0) venderNegocio(c.v, valor); } }; } }
    ]
  },

  /* ============================================== O TRABALHO ACONTECE (mundo) */
  {
    id: 'car_reconhecimento', tipo: 'acontecimento', idade: [20, 64], tema: 'trabalho', repetir: 6, peso: 3,
    quando: c => { const e = c.v.trabalho.atual; return !!e && e.clientela === undefined && e.desempenho >= 76 && !e.formacaoAte && ocupacao(e.ocupacaoId).trilha !== 'atleta' && !temFato(c.v, `reconhecido_${e.ocupacaoId}_${e.tPosto ?? e.tInicio}`); },
    narrar: c => {
      const e = c.v.trabalho.atual!;
      const texto = c.r.pick([
        `Na reunião de fim de ano, a chefia ${e.empregador.replace(/^o /, 'do ').replace(/^a /, 'da ').replace(/^(uma|um) /, 'de $1 ')} citou o seu trabalho como exemplo. O nome entrou na conversa da próxima promoção.`,
        'Um projeto difícil saiu bem por sua causa, e todo mundo ficou sabendo.',
        'Passaram a mandar os casos mais complicados direto para você.'
      ]);
      return { texto, relevancia: 'biografia', tom: 'bom', efeito: () => { fato(c, `reconhecido_${e.ocupacaoId}_${e.tPosto ?? e.tInicio}`); feliz(c, 3); } };
    }
  },
  {
    id: 'car_novato', tipo: 'acontecimento', idade: [30, 64], tema: 'trabalho', repetir: 10, peso: 2,
    quando: c => { const e = c.v.trabalho.atual; return !!e && e.clientela === undefined && ocupacao(e.ocupacaoId).trilha !== 'atleta' && (c.v.trabalho.experiencia[ocupacao(e.ocupacaoId).trilha] ?? 0) >= 144; },
    narrar: c => ({ texto: c.r.pick(['Puseram um novato para aprender o serviço com você. Na primeira semana, você se viu repetindo frases que ouviu vinte anos atrás.', 'Uma estagiária nova passou a andar atrás de você com um caderninho.', 'Chamaram você para treinar a turma que acabava de entrar.']), relevancia: 'biografia', efeito: () => { const f = c.v.caminhos.frentes.lideranca; if (f) f.interesse = clamp(f.interesse + 5); } })
  },
  {
    id: 'car_automacao', tipo: 'acontecimento', idade: [18, 64], tema: 'trabalho', repetir: 8,
    quando: c => { const e = c.v.trabalho.atual; const oc = e && ocupacao(e.ocupacaoId); return !!oc?.declinio && anoDe(c.v.t) >= oc.declinio; },
    narrar: c => ({ texto: ocupacao(c.v.trabalho.atual!.ocupacaoId).trilha === 'comercio' ? 'Chegaram os caixas de autoatendimento. Metade da equipe foi remanejada; a outra metade, dispensada.' : 'A linha ganhou máquinas novas que fazem sozinhas o que três pessoas faziam. Os colegas passaram a contar quem sobraria.', relevancia: 'biografia', tom: 'ruim', efeito: () => estresse(c, 6) })
  },
  {
    id: 'car_curso_empresa', tipo: 'acontecimento', idade: [20, 58], tema: 'trabalho', repetir: 7,
    quando: c => { const e = c.v.trabalho.atual; return !!e && ['clt', 'servidor', 'militar'].includes(e.contrato) && ocupacao(e.ocupacaoId).trilha !== 'atleta' && e.desempenho >= 55 && c.r.chance(0.5); },
    narrar: c => {
      const oc = ocupacao(c.v.trabalho.atual!.ocupacaoId);
      return { texto: c.r.pick([`A empresa pagou um curso de atualização em ${ROTULO_TRILHA[oc.trilha] ?? 'na área'}. Três semanas de aula à noite.`, 'Veio uma certificação nova obrigatória; a turma inteira estudou junta nas sextas.', 'Um sistema novo chegou ao trabalho. Quem aprendeu primeiro virou referência.']), relevancia: 'cotidiano', efeito: () => { const e = c.v.trabalho.atual!; e.desempenho = clamp(e.desempenho + 4); } };
    }
  },
  {
    id: 'aut_cliente_grande', tipo: 'acontecimento', idade: [20, 75], tema: 'trabalho', repetir: 6, peso: 2,
    quando: c => { const e = c.v.trabalho.atual; return !!e && (e.clientela ?? 0) >= 45; },
    narrar: c => ({ texto: c.r.pick(['Um cliente grande fechou com você e indicou outros três.', 'Um mês de agenda cheia por causa de um único cliente satisfeito que falou bem de você.', 'Apareceu um trabalho grande, desses que pagam o ano. Deu conta.']), relevancia: 'biografia', tom: 'bom', efeito: () => { const e = c.v.trabalho.atual!; e.clientela = clamp((e.clientela ?? 40) + 6); c.v.financas.conta += Math.round(e.salario * 1.5); } })
  },
  {
    id: 'aut_mes_fraco', tipo: 'acontecimento', idade: [20, 75], tema: 'trabalho', repetir: 5,
    quando: c => { const e = c.v.trabalho.atual; return !!e && e.clientela !== undefined && (e.clientela < 35 || c.r.chance(0.3)); },
    narrar: c => ({ texto: c.r.pick(['Três meses fracos seguidos. Você aprendeu a guardar dinheiro nos meses bons.', 'Um cliente antigo sumiu sem pagar.', 'Apareceu concorrência na mesma rua, cobrando mais barato.']), relevancia: 'cotidiano', tom: 'ruim', efeito: () => { const e = c.v.trabalho.atual!; e.clientela = clamp((e.clientela ?? 30) - 5); } })
  },
  {
    id: 'car_vendas_meta', tipo: 'acontecimento', idade: [18, 64], tema: 'trabalho', repetir: 5,
    quando: c => { const e = c.v.trabalho.atual; return !!e && ['comercio', 'vendas'].includes(ocupacao(e.ocupacaoId).trilha) && habilidade(c.v, 'vendas') >= 50 && e.desempenho >= 60; },
    narrar: c => ({ texto: 'Bateu a meta do ano antes de novembro. A comissão pagou as férias.', relevancia: 'cotidiano', tom: 'bom', efeito: () => { c.v.financas.conta += Math.round(c.v.trabalho.atual!.salario * 1.2); } })
  },

  /* ========================================================= APOSENTADORIA */
  {
    id: 'apo_segunda_feira', tipo: 'decisao', idade: [50, 90], tema: 'trabalho', prioritario: true, prioridade: 2,
    quando: c => !!c.v.trabalho.aposentadoria && c.v.t - c.v.trabalho.aposentadoria.t <= 12 && c.v.t > c.v.trabalho.aposentadoria.t && !temFato(c.v, 'bpc'),
    titulo: 'A primeira segunda-feira',
    texto: c => `O despertador tocou por costume e você não tinha para onde ir. ${c.v.trabalho.historico.length ? `Foram muitos anos de ${ROTULO_TRILHA[ocupacao(c.v.trabalho.historico[c.v.trabalho.historico.length - 1].ocupacaoId).trilha] ?? 'trabalho'}.` : ''} O dia inteiro pela frente.`,
    opcoes: [
      { id: 'antiga', texto: c => { const d = frenteAntiga(c); return d ? `Voltar a ${VERBOS[d] ?? 'fazer o que fazia'}` : 'Voltar a uma coisa antiga'; }, disponivel: c => (frenteAntiga(c) ? true : false),
        resolver: c => { const d = frenteAntiga(c); if (!d) return { texto: 'Quando você foi atrás, o cenário já era outro. Ficou para depois.', memoria: null }; return { texto: 'As mãos lembraram antes da cabeça.', memoria: `Aposentado, voltou a ${VERBOS[d] ?? 'praticar'}.`.replace('Aposentado', c.g('Aposentado', 'Aposentada', 'Aposentade')), efeito: () => { if (!c.v.rotinas.some(r => r.id === d)) c.v.rotinas.push({ id: d, tInicio: c.v.t, nivel: 1 }); marcar(c.v, 'retomada', `Voltou a ${VERBOS[d] ?? 'praticar'} depois de aposentar.`, 2, { dominio: d as never }); } }; } },
      { id: 'voluntario', texto: 'Oferecer o que sabe como voluntário', comportamento: { generosidade: 1 },
        resolver: c => ({ texto: 'A associação do bairro aceitou na hora. Tinha fila de coisas para fazer.', memoria: null, efeito: () => { if (!c.v.rotinas.some(r => r.id === 'voluntariado')) c.v.rotinas.push({ id: 'voluntariado', tInicio: c.v.t, nivel: 1 }); } }) },
      { id: 'conta', texto: 'Continuar trabalhando por conta', disponivel: c => (autonomoPossivel(c) ? true : false),
        resolver: c => { const oc = autonomoPossivel(c); if (!oc) return { texto: 'Quando você foi atrás, o cenário já era outro. Ficou para depois.', memoria: null }; return { texto: 'Aposentado no papel; na agenda, nem tanto.'.replace('Aposentado', c.g('Aposentado', 'Aposentada', 'Aposentade')), memoria: null, efeito: () => { const e = contratar(c.v, c.r, oc, 'aposentado'); e.posAposentadoria = true; escrever(c.v, { texto: `Depois de aposentar, seguiu trabalhando por conta como ${nomeOcupacao(c.v, oc)}.`, relevancia: 'biografia', tema: 'trabalho' }); } }; } },
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

/** Peneira antiga (save anterior às etapas): um clique, pela habilidade. */
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

/** Uma etapa da peneira em andamento; no fim, o resultado com a fala do treinador. */
function etapaDaPeneira(c: Ctx, k: number): Resultado {
  const pr = c.v.caminhos.processo;
  if (!pr || pr.tipo !== 'peneira') return { texto: 'O teste já tinha acabado.', memoria: null };
  const etapa = ETAPAS_PENEIRA[pr.atual];
  pr.etapas[pr.atual] = { id: etapa.id, resposta: etapa.opcoes[k].id };
  if (etapa.opcoes[k].id === 'familia') pr.via = 'familia';
  pr.atual += 1;
  if (pr.atual < ETAPAS_PENEIRA.length) return { texto: '', memoria: null, reabrir: true };
  const d = pr.dominio ?? mod(c);
  const lugar = pr.municipioId ?? lugarPeneira(c);
  const notas = { comeco: pr.etapas[0]?.resposta, final: pr.etapas[1]?.resposta };
  c.v.caminhos.processo = undefined;
  c.v.fatos[`peneiras_${d}`] = (c.v.fatos[`peneiras_${d}`] ?? 0) + 1;
  const res = avaliarPeneira(c.v, c.r, d, lugar, notas, pr.bonus);
  const antes = [...c.v.caminhos.devolutivas].reverse().find(x => x.tipo === 'peneira' && x.dominio === d && !x.passou);
  const fala = falaDoTreinador(d, res, antes?.falta && ['tecnica', 'fisico', 'leitura', 'nervos'].includes(antes.falta) ? antes.falta as 'tecnica' : undefined);
  const nome = d === 'futebol' ? 'peneira' : 'seletiva';
  if (pr.via === 'familia') { const g = P.genitor(c.v)[0]; if (g) lembrarCom(c.v, g.id, `Foi junto na ${nome}.`, 'apoio', 2); }
  // Um dia de teste também é treino.
  const f = c.v.caminhos.frentes[d];
  if (f) f.meses += 2;
  registrarDevolutiva(c.v, { tipo: 'peneira', titulo: `A ${nome} do ${pr.lugar ?? 'clube'}`, texto: fala, passou: res.passou, perto: res.perto, falta: res.passou ? undefined : res.falta, dominio: d });
  if (res.passou) {
    c.v.fatos['convite_base'] = c.v.t;
    c.v.fatos['peneira_lugar'] = municipioIndice(lugar);
    const texto = `Passou na ${nome}.`;
    marcar(c.v, 'oportunidade', texto, 3, { dominio: d });
    return { texto: `No fim do dia, chamaram seu nome. Poucos nomes foram chamados. ${fala}`, memoria: `${texto} Chamaram poucos nomes; o seu foi um deles.`, relevancia: 'marco', tom: 'bom' };
  }
  const tentativas = c.v.fatos[`peneiras_${d}`] ?? 1;
  marcar(c.v, 'fracasso', `Não passou na ${nome} (${NOME_MOD[d] ?? d}). ${fala}`, 2, { dominio: d });
  abalar(c.v, `a ${nome} que não deu`, -5, 3);
  // Quem ficou perto pode ser chamado de novo mais cedo.
  if (res.perto) c.v.caminhos.ultimas[`peneira_${d}`] = c.v.t - 12;
  const depois = res.perto
    ? tentativas < 3 ? ' Pediram para você voltar no ano que vem.' : ''
    : res.falta === 'idade' ? '' : ' Ainda dá para treinar e tentar outra.';
  return {
    texto: `Chamaram outros nomes. ${fala}${depois}`,
    memoria: `Não passou na ${nome} do clube. ${fala}`,
    relevancia: 'biografia', tom: 'ruim'
  };
}

function cursosDoIf(c: Ctx) {
  const agro = economiaLocal(c.v.moradia.municipioId).custo < 0.95 || municipio(c.v.moradia.municipioId).perfil === 'pequena';
  const base = ['tec_informatica', agro ? 'tec_agropecuaria' : 'tec_eletrotecnica', ['tec_mecanica', 'tec_edificacoes', 'tec_administracao'][Math.floor((anoDe(c.v.eu.tNasc) % 3))]];
  return base.map(id => CURSOS.find(x => x.id === id)!).filter(Boolean);
}

function selecaoIf(c: Ctx, k: number) {
  const cc = cursosDoIf(c)[k];
  // A prova compara com quem está na mesma série: vai bem quem vai bem na escola.
  const chance = clamp(0.3 + ((c.v.educacao.basica?.desempenho ?? 50) - 55) / 40 + (c.v.educacao.postura === 'dedicada' ? 0.08 : 0), 0.05, 0.8);
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
      memoria: c.v.eu.genero === 'masculino' ? 'Foi convocado para o serviço militar: um ano no quartel da região.' : 'Foi incorporada ao serviço militar voluntário: um ano de quartel.'.replace('incorporada', c.g('incorporado', 'incorporada', 'incorporade')),
      relevancia: 'marco' as const,
      efeito: () => {
        const m = c.v.educacao.matricula;
        if (m && !m.trancado) { m.trancado = true; m.tTrancou = c.v.t; escrever(c.v, { texto: 'Trancou o curso para servir.', relevancia: 'cotidiano', tema: 'estudo' }); }
        const oc = ocupacao('soldado_ep');
        contratar(c.v, c.r, oc, 'oportunidade');
        marcar(c.v, 'ingresso', `Serviço militar: ${nomeOcupacao(c.v, oc)}.`, 2, { trilha: oc.trilha });
      }
    };
  }
  if (c.v.eu.genero !== 'masculino') return { texto: 'A seleção foi concorrida. O seu nome não saiu na lista de incorporação.', memoria: 'Alistou-se voluntariamente, mas não foi selecionad' + c.g('o', 'a', 'e') + ' para o serviço militar.', relevancia: 'biografia' as const };
  return { texto: 'Dispensado por excesso de contingente. O certificado veio pelo correio.', memoria: 'Fez o alistamento militar e foi dispensado por excesso de contingente.', relevancia: 'cotidiano' as const };
}

void NEGOCIOS; void abrirNegocio; void editaisAbertos; void idadePessoa; void experienciaNaTrilha;
