/**
 * FIX pós-REWORK 2 — as perguntas que ligam um sistema ao outro.
 *
 * O mundo decide o que acontece (a lesão, a semana que não fecha, a
 * distância); a pessoa decide como reage. Cada decisão aqui nasce de um
 * estado do motor e devolve estado ao motor — nunca é um texto solto.
 */

import type { Conteudo, Ctx } from './base';
import { clamp } from '../rng';
import type { CuidadoLesao, Posicao } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { estresse } from './efeitos';
import { custa } from './efeitos';
import { pagar } from '../sistemas/dinheiro';
import { custoDoCuidado, cuidarDaLesao, lesaoAtiva, lesaoPorDecidir, prazoDoCuidado } from '../sistemas/lesoes';
import { leituraDaSobrecarga } from '../sistemas/sobrecarga';
import { modeloRotina } from '../sistemas/rotinas';
import { semana } from '../sistemas/semana';
import { mudarRitmo, rotulosDoRitmo, temRitmo } from '../sistemas/profissao';
import { ritmoDe } from '../sistemas/ritmo';
import { custoDeMudanca, mudarAgora } from '../sistemas/processos';
import { terminar } from '../sistemas/romance';
import { municipio } from '../dados/lugares';
import { encerrarCarreira, nomePosicao, POSICOES, posicaoSugerida, SOBRE_POSICAO } from '../sistemas/esporte';
import { dinheiro as fmt, flex } from '../texto';
import { abalar } from '../sistemas/abalo';
import { origemDoNome } from '../sistemas/notoriedade';

const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] !== undefined && c.v.fatos[chave] === c.v.t;
const mesesTexto = (n: number) => `${n} ${n === 1 ? 'mês' : 'meses'}`;

/* ------------------------------------------------------------ Lesão */

function opcaoLesao(cuidado: CuidadoLesao) {
  return {
    id: cuidado,
    texto: (c: Ctx) => {
      const l = lesaoAtiva(c.v)!.lesao;
      const pro = l.origem === 'profissional';
      return cuidado === 'repouso' ? (pro ? 'Parar e deixar o corpo recuperar (o departamento médico cuida)' : 'Parar e deixar o corpo se recuperar')
        : cuidado === 'fisio' ? (pro ? 'Fazer a reabilitação completa com a fisioterapia do clube' : 'Fazer fisioterapia')
          : cuidado === 'cirurgia' ? 'Operar'
            : pro ? 'Jogar no sacrifício' : 'Seguir treinando assim mesmo';
    },
    // Nada fica bloqueado por dinheiro: sem ele, o caminho é o SUS (mais lento). Operar só existe para o que é sério.
    disponivel: (c: Ctx) => { const l = lesaoAtiva(c.v)?.lesao; return !!l && !(cuidado === 'cirurgia' && l.gravidade < 2); },
    consequencia: (c: Ctx) => {
      const l = lesaoAtiva(c.v)!.lesao;
      const custo = custoDoCuidado(c.v, l, cuidado);
      const prazo = prazoDoCuidado(l, cuidado, false);
      const sus = custo > 0 ? ` Pelo bolso, uns ${fmt(custo)}; pelo SUS, de graça e mais demorado (${mesesTexto(prazoDoCuidado(l, cuidado, true))}).` : l.origem === 'profissional' ? ' O clube paga.' : c.v.financas.planoDeSaude ? ' O plano cobre.' : '';
      if (cuidado === 'sacrificio') return `Continua ${l.origem === 'profissional' ? 'jogando' : 'treinando'} — rende menos, a saúde sente, e pode piorar.`;
      if (cuidado === 'repouso') return `Volta em uns ${mesesTexto(prazo)}. Sem custo; o condicionamento cai no meio do caminho.${l.gravidade >= 3 ? ' Numa lesão assim, só repouso demora mais.' : ''}`;
      if (cuidado === 'fisio') return `Volta em uns ${mesesTexto(prazo)}, perdendo menos condicionamento.${sus}`;
      return `Volta em uns ${mesesTexto(prazo)}, e a chance de a lesão voltar diminui.${sus}`;
    },
    resolver: (c: Ctx) => {
      const l = lesaoAtiva(c.v)!.lesao;
      const custo = custoDoCuidado(c.v, l, cuidado);
      const podePagar = custo > 0 && custa(c, custo) === true;
      return {
        texto: cuidado === 'sacrificio' ? 'Você enfaixou, tomou o anti-inflamatório e voltou a campo. A dor foi junto.'
          : cuidado === 'cirurgia' ? `Cirurgia marcada${custo > 0 && !podePagar ? ' pelo SUS: fila, depois o centro cirúrgico' : ''}. Depois, meses de reabilitação.`
            : cuidado === 'fisio' ? `Três vezes por semana na fisioterapia${custo > 0 && !podePagar ? ' do posto' : ''}. O corpo vai voltando.`
              : 'Você parou. O mais difícil foi ficar vendo de fora.',
        memoria: cuidado === 'sacrificio' ? `Decidiu seguir ${l.origem === 'profissional' ? 'jogando' : 'treinando'} com ${l.parte}.` : cuidado === 'cirurgia' ? `Operou ${l.parte.replace(/^uma |^um |^o |^a /, '')}.` : null,
        relevancia: cuidado === 'sacrificio' || cuidado === 'cirurgia' ? 'biografia' as const : undefined,
        tom: cuidado === 'sacrificio' ? 'ruim' as const : undefined,
        efeito: () => { if (podePagar) pagar(c.v, custo); cuidarDaLesao(c.v, cuidado, podePagar); if (cuidado === 'sacrificio') estresse(c, 3); }
      };
    }
  };
}

/* ------------------------------------------------------------ Conteúdo */

export const INTEGRACAO: Conteudo[] = [
  {
    // A lesão não é descoberta por acaso numa tela qualquer: ela chega, e pede uma decisão.
    id: 'sau_lesao', tipo: 'decisao', idade: [8, 90], tema: 'saude', prioritario: true, prioridade: 7, repetir: 0,
    quando: c => deHoje(c, 'lesao_decidir') && lesaoPorDecidir(c.v),
    titulo: c => (lesaoAtiva(c.v)!.lesao.gravidade >= 3 ? 'Uma lesão grave' : 'Machucou'),
    texto: c => {
      const l = lesaoAtiva(c.v)!.lesao;
      const pro = l.origem === 'profissional';
      const e = c.v.caminhos.esporte;
      const contexto = pro && e ? (e.espaco === 'titular' ? ' O time conta com você; o departamento médico, também.' : ' No banco, a vaga não espera.') : '';
      return `${l.parte.charAt(0).toUpperCase()}${l.parte.slice(1)}. ${l.gravidade >= 3 ? 'O exame confirmou o que a dor já dizia.' : l.gravidade === 2 ? 'Não é coisa de uma semana.' : 'Nada grave — se for cuidado.'}${contexto}${(l.recaidas ?? 0) > 0 ? ' Não é a primeira vez que ela volta.' : ''}`;
    },
    opcoes: [opcaoLesao('repouso'), opcaoLesao('fisio'), opcaoLesao('cirurgia'), opcaoLesao('sacrificio'),
      {
        id: 'encerrar', texto: 'Encerrar a carreira de vez',
        disponivel: c => { const e = c.v.caminhos.esporte; const l = lesaoAtiva(c.v)?.lesao; return !!e && e.fase === 'profissional' && !!l && l.gravidade >= 3 && (e.lesoes >= 3 || idade(c.v) >= 30) ? true : false; },
        consequencia: () => 'O corpo pediu; a decisão é sua. Sem volta.',
        resolver: c => ({ texto: 'Você disse ao médico, e depois ao treinador, que era hora.', memoria: null, efeito: () => { cuidarDaLesao(c.v, 'repouso', false); encerrarCarreira(c.v, c.v.caminhos.esporte!, 'lesao'); } })
      }]
  },
  {
    // A semana maior do que a vida, há anos: o que sai, o que diminui — ou seguir assim, sabendo o custo.
    id: 'sob_semana', tipo: 'decisao', idade: [14, 90], tema: 'saude', prioritario: true, prioridade: 3, repetir: 0,
    quando: c => deHoje(c, 'sob_decidir') && leituraDaSobrecarga(c.v).nivel >= 2,
    titulo: 'A semana não fecha',
    texto: c => {
      const l = leituraDaSobrecarga(c.v);
      return `${l.anos >= 2 ? `Há ${l.anos} anos` : 'Faz tempo'} que a semana é maior do que a vida: ${l.causas.slice(0, 3).join(', ') || 'compromissos demais'}. O sono encurtou, a paciência também. Alguma coisa vai ter de ceder — ou você segue assim.`;
    },
    opcoes: [
      {
        id: 'largar', texto: c => { const x = maisPesada(c); return x ? `Largar ${x.rotulo.replace(/ — .*/, '').toLowerCase()}` : 'Largar uma atividade'; },
        disponivel: c => (maisPesada(c) ? true : false),
        consequencia: () => 'Sobra semana. Perde-se o que a atividade dava (e a prática esfria).',
        resolver: c => { const x = maisPesada(c)!; return { texto: 'Você parou. Na primeira semana, estranhou o tempo sobrando; na segunda, dormiu.', memoria: `Largou ${x.rotulo.replace(/ — .*/, '').toLowerCase()} porque a semana não fechava.`, relevancia: 'cotidiano', efeito: () => { c.v.rotinas = c.v.rotinas.filter(r => r.id !== x.id); estresse(c, -6); } }; }
      },
      {
        id: 'ritmo', texto: c => rotulosDoRitmo(c.v).leve,
        disponivel: c => (temRitmo(c.v) && c.v.trabalho.atual && ritmoDe(c.v.trabalho.atual) !== 'leve' ? true : false),
        consequencia: () => 'Menos dinheiro; mais semana.',
        resolver: c => ({ texto: 'Você aliviou o trabalho. A conta do mês ficou mais curta; o dia, mais comprido.', memoria: null, efeito: () => { mudarRitmo(c.v, 'leve'); estresse(c, -6); } })
      },
      {
        id: 'descansar', texto: 'Tirar férias de verdade, longe de tudo', disponivel: c => (idade(c.v) < 18 ? false : custa(c, 2500)),
        consequencia: () => 'Uns R$ 2.500. Alivia agora; a semana continua a mesma na volta.',
        resolver: c => ({ texto: 'Dez dias sem relógio. Na volta, a pilha de coisas estava lá — mas você também.', memoria: null, efeito: () => { pagar(c.v, 2500); estresse(c, -14); abalar(c.v, 'as férias', 4, -8); if (c.v.mente.sobrecarga) c.v.mente.sobrecarga.anos = Math.max(0, c.v.mente.sobrecarga.anos - 1); } })
      },
      {
        id: 'seguir', texto: 'Seguir assim', comportamento: { disciplina: 1, impulsividade: 1 },
        consequencia: () => 'Nada muda. O corpo, o trabalho e quem está perto continuam pagando a conta.',
        resolver: c => ({ texto: 'Você respirou fundo e seguiu. Por enquanto, aguenta.', memoria: null, efeito: () => estresse(c, 2) })
      }
    ]
  },
  {
    // Casal em cidades diferentes: ninguém decide sozinho, mas alguém tem de propor.
    id: 'rom_distancia', tipo: 'decisao', idade: [16, 95], tema: 'amor', manual: true, repetir: 0,
    titulo: 'A distância',
    texto: c => { const p = c.p.par; return `${p.nome} em ${municipio(p.municipioId).nome}, você em ${municipio(c.v.moradia.municipioId).nome}. ${c.v.trabalho.atual ? 'Você tem o seu trabalho aqui.' : ''} ${p.renda > 0 ? `${p.nome} tem o dela lá.`.replace('dela', flex(p.genero, 'dele', 'dela', 'delu')) : ''} O que fazer com isso?`; },
    opcoes: [
      {
        id: 'mudar', texto: c => `Mudar para ${municipio(c.p.par.municipioId).nome}`,
        disponivel: c => (idade(c.v) < 18 ? 'Menor de idade não muda de cidade sozinho.' : custa(c, custoDeMudanca(c.v.moradia.municipioId, c.p.par.municipioId))),
        consequencia: c => `A mudança custa uns ${fmt(custoDeMudanca(c.v.moradia.municipioId, c.p.par.municipioId))}.${c.v.trabalho.atual && c.v.trabalho.atual.contrato !== 'autonomo' && c.v.trabalho.atual.contrato !== 'informal' ? ' O trabalho daqui fica para trás.' : ''} Perto de ${c.p.par.nome}; longe do resto.`,
        resolver: c => { const p = c.p.par; const destino = p.municipioId; return { texto: `Caixas, estrada, e ${p.nome} esperando do outro lado.`, memoria: `Mudou-se para ${municipio(destino).nome} para ficar perto de ${p.nome}.`, relevancia: 'marco', tom: 'bom', efeito: () => { pagar(c.v, custoDeMudanca(c.v.moradia.municipioId, destino)); mudarAgora(c.v, destino, `para ficar perto de ${p.nome}`); const rom = c.v.vinculos[p.id]?.romance; if (rom) rom.envolvimento = clamp(rom.envolvimento + 10); lembrarCom(c.v, p.id, 'Você mudou de cidade por vocês.', 'casa', 3); } }; }
      },
      {
        id: 'chamar', texto: c => `Chamar ${c.p.par.nome} para vir para ${municipio(c.v.moradia.municipioId).nome}`,
        consequencia: c => `A decisão é de ${c.p.par.nome}${c.p.par.renda > 0 ? ', que teria de deixar o trabalho de lá' : ''}.`,
        resolver: c => {
          const p = c.p.par;
          const rom = c.v.vinculos[p.id]?.romance;
          const chance = clamp(((rom?.envolvimento ?? 50) - 45) / 40 - (p.renda > 0 ? 0.12 : 0) - (Object.values(c.v.pessoas).some(x => x.genitores?.includes(p.id) && !x.genitores.includes('eu') && x.vivo && Math.floor((c.v.t - x.tNasc) / 12) < 18) ? 0.3 : 0), 0.05, 0.85);
          if (!c.r.chance(chance)) return { texto: `${p.nome} disse que não consegue largar a vida de lá agora. Não foi um não para você; foi um não para a mudança.`, memoria: null, tom: 'ruim', efeito: () => { if (rom) rom.envolvimento = clamp(rom.envolvimento - 4); } };
          return { texto: `${p.nome} topou. Em alguns meses, estava aqui.`, memoria: `${p.nome} mudou-se para ${municipio(c.v.moradia.municipioId).nome} para ficar perto de você.`, relevancia: 'marco', tom: 'bom', efeito: () => { p.municipioId = c.v.moradia.municipioId; if (rom) rom.envolvimento = clamp(rom.envolvimento + 8); lembrarCom(c.v, p.id, 'Mudou de cidade por vocês.', 'casa', 3); } };
        }
      },
      { id: 'seguir', texto: 'Seguir à distância, por enquanto', consequencia: () => 'Visitas, chamadas de vídeo, saudade. A distância pesa com os anos.',
        resolver: c => ({ texto: 'Combinaram de se ver todo mês. Um calendário novo na geladeira de cada um.', memoria: null, efeito: () => { const rom = c.v.vinculos[c.p.par.id]?.romance; if (rom) rom.envolvimento = clamp(rom.envolvimento + 2); } }) },
      { id: 'terminar', texto: 'Terminar', consequencia: () => 'Acaba aqui.',
        resolver: c => ({ texto: 'Vocês concordaram que não dava. Doeu do mesmo jeito.', memoria: null, efeito: () => { const vin = c.v.vinculos[c.p.par.id]; if (vin) terminar(c.v, c.p.par, vin, 'jogador'); } }) }
    ]
  },
  {
    // O nome tem consumidores: convites, entrevistas, publicidade — e o preço de ser visto.
    id: 'noto_convite', tipo: 'decisao', idade: [16, 95], tema: 'trabalho', repetir: 2, peso: c => ((c.v.notoriedade?.valor ?? 0) >= 55 ? 2.2 : 1.2),
    // O convite é pelo que o público conhece de você (a ORIGEM do nome: o ex-jogador ainda é chamado pela marca esportiva).
    quando: c => (c.v.notoriedade?.valor ?? 0) >= 35 && !!origemDoNome(c.v),
    titulo: 'Querem você',
    texto: c => ({
      esporte: 'Uma marca de material esportivo quer você na campanha da temporada: foto, vídeo, uma frase sua no outdoor.',
      arte: 'Um programa de TV de domingo quer você ao vivo, contando a sua história e mostrando o trabalho novo.',
      politica: 'Um podcast de entrevistas longas, desses que meio país ouve, chamou para três horas de conversa.',
      negocio: 'Uma revista de negócios quer contar a história de como você começou.'
    }[origemDoNome(c.v)!]),
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', comportamento: { sociabilidade: 1 },
        consequencia: c => (origemDoNome(c.v) === 'esporte' || origemDoNome(c.v) === 'arte' ? `Um cachê de uns ${fmt(cacheDoConvite(c))}. Mais gente vai saber quem você é — para o bem e para o mal.` : 'Mais gente vai saber quem você é — para o bem e para o mal.'),
        resolver: c => ({ texto: 'Luz, maquiagem, uma pergunta que você não esperava. Saiu melhor do que o medo dizia.', memoria: null, efeito: () => { const n = c.v.notoriedade!; n.valor = clamp(n.valor + 3); n.pico = Math.max(n.pico, n.valor); if (origemDoNome(c.v) === 'esporte' || origemDoNome(c.v) === 'arte') c.v.financas.conta += cacheDoConvite(c); if (n.fonte === 'politica' && c.v.caminhos.politica) c.v.caminhos.politica.reputacao = clamp(c.v.caminhos.politica.reputacao + 3); estresse(c, 3); } }) },
      { id: 'recusar', texto: 'Recusar e guardar a vida privada', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Você agradeceu e disse que prefere falar pelo trabalho.', memoria: null, efeito: () => estresse(c, -2) }) }
    ]
  },
  {
    // Na base, o treinador quer saber onde você joga. É escolha (com a sugestão de quem viu você jogar).
    id: 'esp_posicao', tipo: 'decisao', idade: [11, 30], tema: 'lazer', prioritario: true, prioridade: 5, repetir: 0, biografica: true,
    quando: c => { const e = c.v.caminhos.esporte; return !!e && e.modalidade === 'futebol' && e.fase !== 'encerrada' && !e.posicao; },
    titulo: 'Onde você joga',
    texto: c => `No primeiro treino ${c.v.caminhos.esporte!.fase === 'base' ? 'da base' : 'do clube'}, a comissão pergunta onde você joga. Quem viu você jogar diria: ${nomePosicao(c.v, posicaoSugerida(c.v))}.`,
    opcoes: POSICOES.map((p: Posicao) => ({
      id: p,
      texto: (c: Ctx) => `${nomePosicao(c.v, p).charAt(0).toUpperCase()}${nomePosicao(c.v, p).slice(1)}${p === posicaoSugerida(c.v) ? ' (o que viram em você)' : ''}`,
      consequencia: () => SOBRE_POSICAO[p],
      resolver: (c: Ctx) => ({ texto: 'Colete na mão, lugar no campo. Agora é mostrar.', memoria: `Na base, firmou-se como ${nomePosicao(c.v, p)}.`, relevancia: 'cotidiano' as const, efeito: () => { const e = c.v.caminhos.esporte!; e.posicao = p; if (p !== posicaoSugerida(c.v)) { const f = c.v.caminhos.frentes.futebol; if (f) f.habilidade = clamp(f.habilidade - 2); } escrever(c.v, { texto: `Joga de ${nomePosicao(c.v, p)}.`, relevancia: 'tecnico', tema: 'lazer' }); } })
    }))
  }
];

/** O cachê de um convite de mídia (proporcional ao nome). */
const cacheDoConvite = (c: Ctx) => Math.round(((c.v.notoriedade?.valor ?? 35) - 25) ** 2 * 6 / 100) * 100;

/** A atividade que mais pesa na semana (a candidata natural a sair). */
function maisPesada(c: Ctx) {
  return semana(c.v).rotinas.filter(r => r.peso >= 0.5 && modeloRotina(r.id)).sort((a, b) => b.peso - a.peso)[0];
}
